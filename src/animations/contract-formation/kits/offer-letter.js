/**
 * Offer-letter kit for the "Oferta comunicada" motif (LAW-0441..0444).
 *
 * Props (original vector geometry):
 *  - offerSheet: a tri-fold letter sheet whose outer panel is printed as a
 *    mailer face (addressee, postage square, seal). Folding bottom-up then
 *    top-down turns the open offer into its own sealed mailer, so the SAME
 *    object carries the terms from the offeror to the offeree (no swap).
 *    Local origin = centre of the middle panel; the grip points (left/right
 *    mid edge of the middle panel) do not move while folding.
 *  - dottedTrail: the communication route, revealed behind the moving mailer.
 *  - transitTray: a neutral relay tray on a stand (used by the contrast).
 *  - thumbNode / speechBubble helpers.
 *
 * Stage solver:
 *  - offerStage: two standing personRig characters (offeror facing the
 *    offeree), the sheet, the route and an optional relay tray. `pose()` turns
 *    action values into node props; the sheet is ALWAYS placed from a SOLVED
 *    hand while held (grip point == solved hand), follows the route while in
 *    flight, and rests in the tray slot when relayed. Entries own timelines.
 * @module animations/contract-formation/kits/offer-letter
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, r, lerp} from '../../../core/time.js';
import {roundRectPath, mix, cubicPolyline, rad} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';

const INK = '#1f2328';
const OUTSIDE = '#f2e8d4';

/* ------------------------------------------------------------------------ */
/* Numbers: arithmetic on supplied values only                               */
/* ------------------------------------------------------------------------ */

/** Parse a supplied numeric value ("40", "5,200", "1.5"); NaN when not purely numeric. */
export function parseAmount(s) {
  const t = String(s ?? '').trim().replace(/\s+/g, '');
  if (/^\d{1,3}([,.]\d{3})+$/.test(t)) return Number(t.replace(/[,.]/g, ''));
  if (/^\d+([.,]\d+)?$/.test(t)) return Number(t.replace(',', '.'));
  return NaN;
}

/** Locale formatting of a computed number (en-US / es-ES grouping). */
export function formatAmount(n, locale) {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {maximumFractionDigits: 2}).format(n);
}

/* ------------------------------------------------------------------------ */
/* Offer sheet                                                               */
/* ------------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix       unique node-name prefix
 * @param {number} o.w
 * @param {number} o.h            full unfolded height (3 equal panels)
 * @param {{reference:string, title:string}} o.offer
 * @param {string} o.from         offeror name
 * @param {string} o.to           offeree name
 * @param {Array<{key:string,label:string,value:string}>} o.terms
 * @param {string} [o.mailerLabel] small tag printed on the mailer face
 * @param {boolean} [o.showText=true]
 * @param {{index:number, value:string}} [o.alt]  second value node for one row (inspect substitution)
 * @param {string} [o.labels.from] @param {string} [o.labels.to]
 */
export function offerSheet(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w, hh = o.h, ph = hh / 3;
  const showText = o.showText !== false;
  const pad = w * 0.075;
  const inner = w - pad * 2;
  const x0 = -w / 2;
  const lab = {from: 'From', to: 'To', ...(o.labels || {})};

  /* ---- header (front of the top panel) */
  const header = [];
  let y = -1.5 * ph + pad * 0.75;
  const refS = Math.max(10, w * 0.046);
  if (showText) {
    const f = ctx.fit(o.offer.reference, {maxWidth: inner * 0.7, size: refS, minSize: refS * 0.75, maxLines: 1, weight: 600, family: 'mono'});
    header.push(textBlock(f, {x: x0 + pad, y, fill: th.inkSoft, name: `${P}-ref`}));
  } else header.push(h('rect', {x: x0 + pad, y: y + 2, width: inner * 0.28, height: refS * 0.6, rx: 3, fill: th.paperLine}));
  y += refS * 1.7; // clear gap between the mono reference and the serif title
  const titleS = Math.max(14, Math.min(w * 0.086, ph * 0.22));
  const ftS = Math.max(10, Math.min(w * 0.05, ph * 0.13));
  if (showText) {
    const room = ph - (y - (-1.5 * ph)) - ftS * 1.6 - pad * 0.4;
    const f = ctx.fit(o.offer.title, {maxWidth: inner, size: titleS, minSize: titleS * 0.72, maxLines: room > titleS * 2.2 ? 2 : 1, weight: 700, family: 'serif'});
    header.push(textBlock(f, {x: x0 + pad, y, fill: th.ink, name: `${P}-title`}));
    y += f.height + titleS * 0.32;
    const ft = ctx.fit(`${lab.from}: ${o.from}  ·  ${lab.to}: ${o.to}`, {maxWidth: inner, size: ftS, minSize: ftS * 0.72, maxLines: 1, weight: 500});
    header.push(textBlock(ft, {x: x0 + pad, y, fill: th.inkSoft, name: `${P}-parties`}));
  } else {
    header.push(h('rect', {x: x0 + pad, y, width: inner * 0.72, height: titleS * 0.7, rx: 4, fill: th.ink, opacity: 0.78}));
    y += titleS * 1.2;
    header.push(h('rect', {x: x0 + pad, y, width: inner * 0.6, height: ftS * 0.6, rx: 3, fill: th.paperLine}));
  }
  header.push(h('line', {x1: x0 + pad, x2: -x0 - pad, y1: -0.5 * ph - pad * 0.35, y2: -0.5 * ph - pad * 0.35, stroke: th.paperLine, 'stroke-width': 2}));

  /* ---- term rows (middle + bottom panels) */
  const n = o.terms.length;
  const perPanel = Math.ceil(n / 2);
  const rowH = ph / perPanel;
  const ls = Math.max(10, Math.min(rowH * 0.24, w * 0.053));
  const vs = Math.max(12, Math.min(rowH * 0.37, w * 0.083));
  const rows = [];
  const rowNodes = {mid: [], bot: []};
  o.terms.forEach((t, i) => {
    const ry = -0.5 * ph + i * rowH;
    const panel = i < perPanel ? 'mid' : 'bot';
    const ly = ry + rowH * 0.13;
    const vy = ly + ls * 1.68;
    const out = rowNodes[panel];
    if (i > 0 && i !== perPanel) out.push(h('line', {x1: x0 + pad, x2: -x0 - pad, y1: ry, y2: ry, stroke: th.paperLine, 'stroke-width': 1.5, 'stroke-dasharray': '2 5'}));
    let vfit = null;
    if (showText) {
      const lf = ctx.fit(t.label, {maxWidth: inner, size: ls, minSize: ls * 0.8, maxLines: 1, weight: 600});
      out.push(textBlock(lf, {x: x0 + pad, y: ly, fill: th.inkSoft, name: `${P}-lab-${i}`}));
      const room = ry + rowH - vy - rowH * 0.06;
      // a value that does not fit one line wraps onto two smaller lines when the row has room,
      // so the printed terms keep their meaning (only an extreme value is shortened)
      const fitValue = text => {
        let f = ctx.fit(text, {maxWidth: inner, size: vs, minSize: vs * 0.66, maxLines: room > vs * 2.05 ? 2 : 1, weight: 700});
        if (f.truncated) {
          const s2 = Math.min(vs, room / 2.1);
          if (s2 >= vs * 0.52) {
            const f2 = ctx.fit(text, {maxWidth: inner, size: s2, minSize: Math.max(8, s2 * 0.85), maxLines: 2, weight: 700});
            if (!f2.truncated || f2.size >= f.size * 0.8) f = f2;
          }
        }
        return f;
      };
      const vf = fitValue(t.value);
      vfit = vf;
      const isAlt = o.alt && o.alt.index === i;
      out.push(textBlock(vf, {x: x0 + pad, y: vy, fill: th.ink, name: isAlt ? `${P}-val-${i}-a` : `${P}-val-${i}`}));
      if (isAlt) {
        const af = fitValue(o.alt.value);
        out.push(textBlock(af, {x: x0 + pad, y: vy, fill: th.accent2, name: `${P}-val-${i}-b`, opacity: 0}));
      }
    } else {
      out.push(h('rect', {x: x0 + pad, y: ly + 2, width: inner * 0.4, height: ls * 0.55, rx: 3, fill: th.paperLine}));
      out.push(h('rect', {x: x0 + pad, y: vy + 2, width: inner * (0.5 + 0.35 * ctx.rng('offer-bar', i)), height: vs * 0.6, rx: 4, fill: th.ink, opacity: 0.72}));
    }
    rows.push({key: t.key, index: i, panel, box: {x: x0, y: ry, w, h: rowH}, value: {x: x0 + pad, y: vy, w: inner, h: vfit ? vfit.height : vs}, labelSize: ls, valueSize: vs});
  });

  /* ---- panels */
  const edge = {stroke: th.ink, 'stroke-width': th.stroke, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
  const fill = (y1, y2, color) => h('rect', {x: x0, y: y1, width: w, height: y2 - y1, fill: color});
  const rr = 5;
  // outer edges only; fold edges are drawn by hinge lines that show while folded
  const topOutline = `M${x0} ${-0.5 * ph}V${-1.5 * ph + rr}Q${x0} ${-1.5 * ph} ${x0 + rr} ${-1.5 * ph}H${-x0 - rr}Q${-x0} ${-1.5 * ph} ${-x0} ${-1.5 * ph + rr}V${-0.5 * ph}`;
  const botOutline = `M${x0} ${0.5 * ph}V${1.5 * ph - rr}Q${x0} ${1.5 * ph} ${x0 + rr} ${1.5 * ph}H${-x0 - rr}Q${-x0} ${1.5 * ph} ${-x0} ${1.5 * ph - rr}V${0.5 * ph}`;
  const midOutline = `M${x0} ${-0.5 * ph}V${0.5 * ph}M${-x0} ${-0.5 * ph}V${0.5 * ph}`;
  const hinge = (name, yy) => h('line', {name, x1: x0, x2: -x0, y1: yy, y2: yy, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linecap': 'round', opacity: 0});

  const mid = g({name: `${P}-pm`},
    fill(-0.5 * ph, 0.5 * ph, th.paper),
    rowNodes.mid,
    h('line', {x1: x0 + 2, x2: -x0 - 2, y1: -0.5 * ph, y2: -0.5 * ph, stroke: th.paperLine, 'stroke-width': 1.5}),
    h('line', {x1: x0 + 2, x2: -x0 - 2, y1: 0.5 * ph, y2: 0.5 * ph, stroke: th.paperLine, 'stroke-width': 1.5}),
    h('path', {d: midOutline, ...edge}),
  );
  const bot = g({name: `${P}-pb`},
    g({name: `${P}-pb-f`},
      fill(0.5 * ph, 1.5 * ph, th.paper),
      rowNodes.bot,
      h('path', {d: botOutline, ...edge})),
    g({name: `${P}-pb-b`, opacity: 0},
      fill(0.5 * ph, 1.5 * ph, OUTSIDE),
      h('path', {d: botOutline, ...edge})),
    h('rect', {name: `${P}-pb-shade`, x: x0, y: 0.5 * ph, width: w, height: ph, fill: INK, opacity: 0}),
    hinge(`${P}-pb-hinge`, 0.5 * ph),
  );
  const mailer = mailerFace(ctx, {prefix: P, w, ph, from: o.from, to: o.to, label: o.mailerLabel, showText, labels: lab});
  const top = g({name: `${P}-pt`},
    g({name: `${P}-pt-f`},
      fill(-1.5 * ph, -0.5 * ph, th.paper),
      header,
      h('path', {d: topOutline, ...edge})),
    // back of the top panel = mailer face, pre-flipped so it reads upright once folded
    g({name: `${P}-pt-b`, opacity: 0},
      g({transform: `translate(0 ${r(-ph)}) scale(1 -1)`}, mailer)),
    h('rect', {name: `${P}-pt-shade`, x: x0, y: -1.5 * ph, width: w, height: ph, fill: INK, opacity: 0}),
    hinge(`${P}-pt-hinge`, -0.5 * ph),
  );
  const shadows = g({opacity: 0.9},
    h('rect', {x: x0 + 6, y: -0.5 * ph + 9, width: w, height: ph, rx: 4, fill: th.shadow}),
    h('rect', {name: `${P}-sb`, x: x0 + 6, y: 0.5 * ph + 9, width: w, height: ph, rx: 4, fill: th.shadow}),
    h('rect', {name: `${P}-st`, x: x0 + 6, y: -1.5 * ph + 9, width: w, height: ph, rx: 4, fill: th.shadow}),
  );

  /* ---- seal on the free edge of the top panel (lands at y = +ph/2 when folded) */
  const sr = Math.max(9, ph * 0.12);
  const sealY = 0.5 * ph;
  const seal = g({name: `${P}-seal`, opacity: 0},
    g({name: `${P}-seal-l`},
      h('path', {d: `M0 ${r(sealY - sr)}A${r(sr)} ${r(sr)} 0 0 0 0 ${r(sealY + sr)}Z`, fill: th.accent, stroke: INK, 'stroke-width': 2})),
    g({name: `${P}-seal-r`},
      h('path', {d: `M0 ${r(sealY - sr)}A${r(sr)} ${r(sr)} 0 0 1 0 ${r(sealY + sr)}Z`, fill: th.accent, stroke: INK, 'stroke-width': 2})),
    h('circle', {name: `${P}-seal-ring`, cx: 0, cy: sealY, r: sr * 0.55, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0.85}),
  );

  const node = g({name: P}, shadows, mid, bot, top, seal);

  /**
   * @param {{bottom:number, top:number, seal?:number, broken?:number}} s
   *   bottom/top: 0 open → 1 folded; seal: 0 → 1 pressed on; broken: 0 → 1 torn apart
   */
  function frame(s) {
    const out = {};
    const sB = Math.cos(Math.PI * clamp(s.bottom));
    const sT = Math.cos(Math.PI * clamp(s.top));
    const panel = (key, hy, sv, amt) => {
      const tf = sv === 1 ? '' : scaleAbout(0, hy, 1, sv);
      out[`${P}-p${key}`] = {transform: tf};
      out[`${P}-s${key}`] = {transform: tf};
      out[`${P}-p${key}-f`] = {opacity: sv >= 0 ? 1 : 0};
      out[`${P}-p${key}-b`] = {opacity: sv < 0 ? 1 : 0};
      out[`${P}-p${key}-shade`] = {opacity: r((1 - Math.abs(sv)) * 0.32, 3)};
      out[`${P}-p${key}-hinge`] = {opacity: amt > 0.02 ? 1 : 0};
    };
    panel('b', 0.5 * ph, sB, clamp(s.bottom));
    panel('t', -0.5 * ph, sT, clamp(s.top));
    // fully folded, the middle panel is completely covered by the two folded panels: hide it so
    // its (covered) text never counts as visible
    out[`${P}-pm`] = {opacity: clamp(s.bottom) >= 0.999 && clamp(s.top) >= 0.999 ? 0 : 1};
    const sealP = clamp(s.seal ?? 0);
    const brk = clamp(s.broken ?? 0);
    const press = sealP < 1 ? 1 + 0.5 * (1 - ease.outCubic(sealP)) : 1;
    out[`${P}-seal`] = {opacity: sealP > 0 && brk < 1 ? r(Math.min(1, sealP * 3) * (1 - brk), 3) : 0, transform: press === 1 ? '' : scaleAbout(0, sealY, press)};
    out[`${P}-seal-l`] = {transform: brk ? T(-10 * brk, 4 * brk, -12 * brk) : ''};
    out[`${P}-seal-r`] = {transform: brk ? T(10 * brk, 4 * brk, 12 * brk) : ''};
    out[`${P}-seal-ring`] = {opacity: brk > 0 ? 0 : 0.85};
    return out;
  }

  return {
    node, frame, w, h: hh, ph, rows, rowH,
    /** grip points (sheet-local): left / right mid edge of the middle panel */
    gripL: {x: -w / 2, y: 0},
    gripR: {x: w / 2, y: 0},
    /** extents of the visible sheet for a fold state (sheet-local, y only) */
    extent: (bottom, top) => ({y1: -0.5 * ph - ph * Math.max(0, Math.cos(Math.PI * clamp(top))), y2: 0.5 * ph + ph * Math.max(0, Math.cos(Math.PI * clamp(bottom)))}),
  };
}

/** Outside face of the sheet (visible once folded): addressee, sender, postage square, tag. */
function mailerFace(ctx, o) {
  const th = ctx.theme;
  const {w, ph} = o;
  const x0 = -w / 2, y0 = -ph / 2;
  const pad = w * 0.07;
  const parts = [h('path', {d: roundRectPath(x0, y0, w, ph, 5), fill: OUTSIDE, stroke: th.ink, 'stroke-width': th.stroke})];
  // postage square (generic mark, no national symbol)
  const sw = Math.min(ph * 0.4, w * 0.15), sh = sw * 1.2;
  const sx = -x0 - pad * 0.8 - sw, sy = y0 + pad * 0.7;
  parts.push(
    h('rect', {x: sx, y: sy, width: sw, height: sh, rx: 2, fill: '#fff', stroke: th.inkSoft, 'stroke-width': 1.4, 'stroke-dasharray': '3 2.2'}),
    h('rect', {x: sx + sw * 0.14, y: sy + sh * 0.12, width: sw * 0.72, height: sh * 0.76, rx: 2, fill: th.accent2Soft}),
    h('circle', {cx: sx + sw * 0.64, cy: sy + sh * 0.34, r: sw * 0.12, fill: th.accent3}),
    h('path', {d: `M${r(sx + sw * 0.16)} ${r(sy + sh * 0.86)}L${r(sx + sw * 0.4)} ${r(sy + sh * 0.5)}L${r(sx + sw * 0.58)} ${r(sy + sh * 0.7)}L${r(sx + sw * 0.7)} ${r(sy + sh * 0.58)}L${r(sx + sw * 0.86)} ${r(sy + sh * 0.86)}Z`, fill: th.accent4}),
    h('path', {d: `M${r(sx - sw * 0.9)} ${r(sy + sh * 0.3)}q${r(sw * 0.25)} ${r(-sh * 0.12)} ${r(sw * 0.5)} 0t${r(sw * 0.5)} 0t${r(sw * 0.5)} 0M${r(sx - sw * 0.9)} ${r(sy + sh * 0.55)}q${r(sw * 0.25)} ${r(-sh * 0.12)} ${r(sw * 0.5)} 0t${r(sw * 0.5)} 0t${r(sw * 0.5)} 0`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.6, opacity: 0.7}),
  );
  const nameS = Math.max(11, Math.min(ph * 0.17, w * 0.07));
  const smallS = Math.max(9, Math.min(ph * 0.1, w * 0.042));
  if (o.showText) {
    const ff = ctx.fit(`${o.labels.from}: ${o.from}`, {maxWidth: w * 0.55, size: smallS, minSize: smallS * 0.8, maxLines: 1, weight: 500});
    parts.push(textBlock(ff, {x: x0 + pad, y: y0 + pad * 0.7, fill: th.inkSoft}));
    // "To:" sits on the name's baseline, left of it (one address line)
    const tl = ctx.fit(`${o.labels.to}:`, {maxWidth: w * 0.3, size: smallS, maxLines: 1, weight: 600});
    // indented: the holder's thumb grips the left edge at mid-height
    const ny = y0 + ph * 0.42, ax = x0 + pad + w * 0.06;
    parts.push(textBlock(tl, {x: ax, y: ny + 0.8 * (nameS - smallS), fill: th.inkSoft}));
    const nx = ax + tl.width + smallS * 0.6;
    const nameEnd = ny < sy + sh + 4 ? sx - smallS * 0.6 : x0 + w - pad; // never under the postage square
    const tn = ctx.fit(o.to, {maxWidth: nameEnd - nx, size: nameS, minSize: nameS * 0.7, maxLines: 1, weight: 700});
    parts.push(textBlock(tn, {x: nx, y: ny, fill: th.ink}));
    if (o.label) {
      const lf = ctx.fit(o.label, {maxWidth: w * 0.36, size: smallS, minSize: smallS * 0.8, maxLines: 1, weight: 700});
      const lw = lf.width + smallS * 1.2, lh = smallS * 1.7;
      const lx = -x0 - pad * 0.6 - lw, ly = -y0 - pad * 0.45 - lh;
      parts.push(h('path', {d: roundRectPath(lx, ly, lw, lh, lh / 2), fill: 'none', stroke: th.accent, 'stroke-width': 1.6}));
      parts.push(textBlock(lf, {x: lx + lw / 2, y: ly + (lh - lf.size) / 2, anchor: 'middle', fill: th.accent}));
    }
  } else {
    parts.push(h('rect', {x: x0 + pad, y: y0 + pad * 0.7, width: w * 0.3, height: smallS * 0.6, rx: 3, fill: th.paperLine}));
    parts.push(h('rect', {x: x0 + pad, y: y0 + ph * 0.42, width: w * 0.5, height: nameS * 0.65, rx: 4, fill: th.ink, opacity: 0.72}));
  }
  const barY = y0 + ph * 0.42 + nameS * 1.3;
  parts.push(h('rect', {x: x0 + pad, y: barY, width: w * 0.42, height: Math.max(3, ph * 0.035), rx: 2, fill: th.paperLine}));
  parts.push(h('rect', {x: x0 + pad, y: barY + ph * 0.08, width: w * 0.32, height: Math.max(3, ph * 0.035), rx: 2, fill: th.paperLine}));
  return g(null, parts);
}

/* ------------------------------------------------------------------------ */
/* Route, relay tray, thumbs, bubbles                                        */
/* ------------------------------------------------------------------------ */

/**
 * Dotted communication route revealed by arc length (mask), optional ghost.
 * @param {any} ctx
 * @param {{name:string, poly:any, color?:string, width?:number, gap?:number}} o
 */
export function dottedTrail(ctx, o) {
  const th = ctx.theme;
  const width = o.width ?? 7;
  const gap = o.gap ?? 17;
  // on dark backgrounds the route is lightened so the dotted path stays visible
  const color = o.color ?? (th.dark ? shade(th.accent2, 0.45) : th.accent2);
  const d = o.poly.d(1);
  const total = o.poly.total;
  const xs = o.poly.pts.map(p => p.x), ys = o.poly.pts.map(p => p.y);
  const pad = width * 4 + 10;
  const mx = Math.min(...xs) - pad, my = Math.min(...ys) - pad;
  const node = g({name: o.name, opacity: 0},
    h('defs', null, h('mask', {id: ctx.id(`${o.name}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...xs) - mx + pad), height: r(Math.max(...ys) - my + pad)},
      h('path', {name: `${o.name}-m`, d, fill: 'none', stroke: '#fff', 'stroke-width': width * 3, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}))),
    h('path', {d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-dasharray': `0.1 ${gap}`, mask: ctx.ref(`${o.name}-mask`)}),
  );
  const ghost = o.ghost ? h('path', {name: `${o.name}-ghost`, d, fill: 'none', stroke: color, 'stroke-width': width * 0.7, 'stroke-linecap': 'round', 'stroke-dasharray': `0.1 ${gap}`, opacity: 0}) : null;
  /** @param {number} p reveal fraction  @param {number} [ghostOpacity=0] */
  const frame = (p, ghostOpacity = 0) => {
    const out = {
      [o.name]: {opacity: p > 0 ? 1 : 0},
      [`${o.name}-m`]: {'stroke-dashoffset': r(total * (1 - clamp(p)))},
    };
    if (ghost) out[`${o.name}-ghost`] = {opacity: r(ghostOpacity, 3)};
    return out;
  };
  return {node, ghost, frame, total};
}

/**
 * Neutral relay tray on a stand. Local origin = floor point under the stand.
 * Returns back/front layers so a resting mailer sits between them.
 */
export function transitTray(ctx, {name, w, height, label}) {
  const th = ctx.theme;
  const top = -height;
  const lipH = w * 0.15;
  const backH = w * 0.22;
  const tray = '#c7d0d8';
  const trayDark = '#9aa6b1';
  const back = g({name: `${name}-back`},
    h('ellipse', {cx: 0, cy: 0, rx: w * 0.3, ry: w * 0.05, fill: th.shadow}),
    h('path', {d: `M${r(-w * 0.2)} 0Q${r(-w * 0.2)} ${r(-w * 0.05)} ${r(-w * 0.1)} ${r(-w * 0.05)}H${r(w * 0.1)}Q${r(w * 0.2)} ${r(-w * 0.05)} ${r(w * 0.2)} 0Z`, fill: trayDark, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('rect', {x: -w * 0.03, y: top + lipH * 0.6, width: w * 0.06, height: height - lipH * 0.6 - w * 0.04, fill: trayDark, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(-w / 2 + 4, top - backH, w - 8, backH + lipH * 0.5, 6), fill: shade(tray, -0.1), stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: `M${r(-w / 2 + 16)} ${r(top - backH + 10)}H${r(w / 2 - 16)}`, stroke: '#fff', 'stroke-width': 2, opacity: 0.5}),
  );
  let labelNode = null;
  if (label && ctx.show('key')) {
    const f = ctx.fit(label, {maxWidth: w * 0.84, size: Math.max(12, lipH * 0.5), minSize: 10, maxLines: 1, weight: 700});
    labelNode = textBlock(f, {x: 0, y: top + (lipH - f.size) / 2, anchor: 'middle', fill: INK});
  }
  const front = g({name: `${name}-front`},
    h('path', {d: `M${r(-w / 2 - 6)} ${r(top)}H${r(w / 2 + 6)}L${r(w / 2 - 2)} ${r(top + lipH)}H${r(-w / 2 + 2)}Z`, fill: tray, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-w / 2 + 4)} ${r(top + lipH * 0.2)}H${r(w / 2 - 4)}`, stroke: '#fff', 'stroke-width': 2, opacity: 0.55}),
    labelNode,
  );
  return {back, front, top, slotY: top - backH * 0.3, width: w};
}

/** Thumb drawn over a held sheet edge (skin + outline). Positioned per frame. */
export function thumbNode(ctx, name, skin, k) {
  return g({name, opacity: 0},
    h('path', {d: `M${r(-7 * k)} ${r(-5 * k)}C${r(-2 * k)} ${r(-12 * k)} ${r(9 * k)} ${r(-11 * k)} ${r(11 * k)} ${r(-4 * k)}C${r(12 * k)} ${r(2 * k)} ${r(4 * k)} ${r(6 * k)} ${r(-4 * k)} ${r(4 * k)}C${r(-9 * k)} ${r(3 * k)} ${r(-10 * k)} ${r(-2 * k)} ${r(-7 * k)} ${r(-5 * k)}Z`, fill: skin, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
  );
}

/**
 * Speech bubble with a tail toward `tip`. Returns node + box. Text via chip-like fit.
 * @param {any} ctx
 * @param {{name:string, text:string, x:number, y?:number, bottom?:number, maxWidth:number, size:number, tip:{x:number,y:number}, anchor?:'start'|'middle'|'end'}} o
 *   `bottom` places the bubble so that its lower edge sits at that y.
 */
export function speechBubble(ctx, o) {
  const th = ctx.theme;
  const padX = o.size * 0.7, padY = o.size * 0.5;
  const show = ctx.show('all');
  const fit = ctx.fit(o.text, {maxWidth: o.maxWidth - padX * 2, size: o.size, minSize: o.size * 0.75, maxLines: 2, weight: 600});
  const tw = show ? fit.width : o.maxWidth * 0.5;
  const th2 = show ? fit.height : o.size * 1.4;
  const bw = tw + padX * 2, bh = th2 + padY * 2;
  const x = o.anchor === 'end' ? o.x - bw : o.anchor === 'middle' ? o.x - bw / 2 : o.x;
  const y = o.bottom !== undefined ? o.bottom - bh : o.y;
  const cx = clamp(o.tip.x, x + bh * 0.6, x + bw - bh * 0.6);
  const baseY = o.tip.y > y + bh / 2 ? y + bh : y;
  const tail = `M${r(cx - 14)} ${r(baseY)}L${r(o.tip.x)} ${r(o.tip.y)}L${r(cx + 14)} ${r(baseY)}`;
  const node = g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(x + 5, y + 7, bw, bh, bh * 0.45), fill: th.shadow}),
    h('path', {d: tail, fill: th.card, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(x, y, bw, bh, bh * 0.45), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: `M${r(cx - 12)} ${r(baseY)}H${r(cx + 12)}`, stroke: th.card, 'stroke-width': 4}),
    show
      ? textBlock(fit, {x: x + bw / 2, y: y + padY, anchor: 'middle', fill: th.ink})
      : g(null,
        h('rect', {x: x + padX, y: y + padY + 2, width: tw, height: o.size * 0.45, rx: 3, fill: th.paperLine}),
        h('rect', {x: x + padX, y: y + padY + o.size * 0.85, width: tw * 0.6, height: o.size * 0.45, rx: 3, fill: th.paperLine})),
  );
  return {node, box: {x, y, w: bw, h: bh}};
}

/* ------------------------------------------------------------------------ */
/* Two-party standing stage                                                  */
/* ------------------------------------------------------------------------ */


/** Hand poses in rig-local units (standing rig, facing +x). */
export const HANDS = {
  hold: {x: 84, y: -236},     // sheet held at chest height, beside the head
  wind: {x: 34, y: -286},     // anticipation: pulled back and up
  launch: {x: 150, y: -282},  // arm extended toward the other party
  catch: {x: 150, y: -282},
  rest: {x: 22, y: -156},     // the rig's own rest pose for the near hand
};

/** Fold state from fold (0→1: bottom, then top) and unfold (0→1: top, then bottom). */
export function foldState(fold, unfold) {
  const f = clamp(fold), u = clamp(unfold);
  return {
    bottom: clamp(f / 0.5) * (1 - clamp((u - 0.5) / 0.5)),
    top: clamp((f - 0.5) / 0.5) * (1 - clamp(u / 0.5)),
  };
}

/**
 * Two standing parties, the offer sheet, its route and an optional relay tray.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {{x:number, floor:number, facing?:1|-1}} o.A   offeror feet point (default facing +x)
 * @param {{x:number, floor:number, facing?:1|-1}} o.B   offeree feet point (default facing −x)
 * @param {number} o.k                         character scale
 * @param {Array<any>} o.parties
 * @param {{reference:string,title:string}} o.offer
 * @param {Array<any>} o.terms
 * @param {string} [o.mailerLabel]
 * @param {{c1:{x:number,y:number}, c2:{x:number,y:number}}} [o.route]  control points of the direct route
 * @param {number} [o.apexLift]
 * @param {{x:number, floor:number, height:number, label?:string, legs?:any, trayW?:number}} [o.relay]
 * @param {Array<string>|null} [o.captions]   actor chip texts (null = none)
 * @param {number} [o.chipSize] @param {number} [o.chipMax] @param {number} [o.chipLines=1]  line limit of the actor chips (long names wrap instead of being cut)
 * @param {Record<string,string>} [o.sheetLabels]
 * @param {number} [o.sheetW] @param {number} [o.sheetH]  sheet size in rig units (× k)
 * @param {boolean|'strip'} [o.ground=true]  floor platform + contact shadow under each party ('strip' = one continuous floor across o.width)
 * @param {number} [o.width]  stage width; actor chips are kept inside it
 * @param {{index:number, value:string}} [o.sheetAlt]  alternate value node for one term row (inspect)
 * @param {boolean} [o.hideA]  omit the offeror's figure (context views that only show the offeree)
 * @param {{w?:number,h?:number}|false} [o.places]  tinted wall panels behind each party (two locations)
 */
export function offerStage(ctx, o) {
  const P = o.prefix;
  const k = o.k;
  const sw = (o.sheetW ?? 240) * k, sh = (o.sheetH ?? 320) * k;
  const fA = o.A.facing ?? 1, fB = o.B.facing ?? -1;
  const lookA = actorLook(ctx, o.parties[0], 0);
  const lookB = actorLook(ctx, o.parties[1], 1);
  const rigA = personRig(ctx, {name: `${P}-A`, look: lookA});
  const rigB = personRig(ctx, {name: `${P}-B`, look: lookB});
  const sheet = offerSheet(ctx, {
    prefix: `${P}-sheet`, w: sw, h: sh, offer: o.offer, from: o.parties[0].name, to: o.parties[1].name,
    terms: o.terms, mailerLabel: o.mailerLabel, showText: ctx.show('all'), labels: o.sheetLabels, alt: o.sheetAlt,
  });
  const wA = p => ({x: o.A.x + fA * p.x * k, y: o.A.floor + p.y * k});
  const wB = p => ({x: o.B.x + fB * p.x * k, y: o.B.floor + p.y * k});
  const hands = {
    holdA: wA(HANDS.hold), windA: wA(HANDS.wind), launchA: wA(HANDS.launch), restA: wA(HANDS.rest),
    catchB: wB(HANDS.catch), holdB: wB(HANDS.hold), restB: wB(HANDS.rest),
  };
  // the sheet extends away from its holder, gripped at the nearer mid edge
  const cA = q => ({x: q.x + fA * sw / 2, y: q.y});
  const cB = q => ({x: q.x + fB * sw / 2, y: q.y});
  const launchC = cA(hands.launchA);
  const catchC = cB(hands.catchB);

  let legs;
  if (o.relay) {
    const R = o.relay;
    const tray = transitTray(ctx, {name: `${P}-tray`, w: R.trayW ?? sw + 44 * k, height: R.height, label: R.label});
    const slot = {x: R.x, y: R.floor + tray.slotY};
    const L = R.legs || {};
    const lift = o.apexLift ?? 220 * k;
    const leg1 = cubicPolyline(launchC, L.c1a || {x: lerp(launchC.x, slot.x, 0.3), y: Math.min(launchC.y, slot.y) - lift}, L.c2a || {x: lerp(launchC.x, slot.x, 0.75), y: Math.min(launchC.y, slot.y) - lift}, slot, 60);
    const leg2 = cubicPolyline(slot, L.c1b || {x: lerp(slot.x, catchC.x, 0.25), y: Math.min(slot.y, catchC.y) - lift}, L.c2b || {x: lerp(slot.x, catchC.x, 0.7), y: Math.min(slot.y, catchC.y) - lift}, catchC, 60);
    legs = {tray, slot, leg1, leg2, R};
  } else {
    const lift = o.apexLift ?? 300 * k;
    const c1 = o.route ? o.route.c1 : {x: lerp(launchC.x, catchC.x, 0.25), y: Math.min(launchC.y, catchC.y) - lift};
    const c2 = o.route ? o.route.c2 : {x: lerp(launchC.x, catchC.x, 0.75), y: Math.min(launchC.y, catchC.y) - lift};
    legs = {leg1: cubicPolyline(launchC, c1, c2, catchC, 80)};
  }
  const tw = 7 * Math.min(1.2, k), tg = 17 * Math.min(1.2, k);
  const trail1 = dottedTrail(ctx, {name: `${P}-trail1`, poly: legs.leg1, width: tw, gap: tg, ghost: true});
  const trail2 = legs.leg2 ? dottedTrail(ctx, {name: `${P}-trail2`, poly: legs.leg2, width: tw, gap: tg, ghost: true}) : null;

  const thumbA = thumbNode(ctx, `${P}-thumbA`, lookA.skin, k);
  const thumbB = thumbNode(ctx, `${P}-thumbB`, lookB.skin, k);

  const chipSize = o.chipSize ?? 30;
  const chips = [];
  if (o.captions && ctx.show('key')) {
    [[o.A, o.hideA ? '' : o.captions[0], 'chipA'], [o.B, o.captions[1], 'chipB']].forEach(([pt, text, nm]) => {
      if (!text) return;
      const make = x => chip(ctx, text, {x, y: pt.floor + 14, anchor: 'middle', maxWidth: o.chipMax ?? 420, size: chipSize, maxLines: o.chipLines ?? 1, name: `${P}-${nm}`});
      let c = make(pt.x);
      // keep the chip inside the stage width (design space)
      if (o.width) {
        const lo = 8, hi = o.width - 8;
        if (c.box.x < lo) c = make(pt.x + (lo - c.box.x));
        else if (c.box.x + c.box.w > hi) c = make(pt.x - (c.box.x + c.box.w - hi));
      }
      chips.push(c);
    });
  }

  const trayAt = legs.tray ? T(legs.R.x, legs.R.floor) : null;
  const th = ctx.theme;
  // floor platforms and wall panels never leave the stage width (design space / panel)
  const lim = (lo, hi) => (o.width ? [Math.max(lo, 8), Math.min(hi, o.width - 8)] : [lo, hi]);
  const floorFill = th.dark ? '#3a3f46' : '#e4d9c4';
  const contact = (pt, f) => h('ellipse', {cx: pt.x + f * 6 * k, cy: pt.floor - 2, rx: 46 * k, ry: 8 * k, fill: th.shadow});
  let ground = null;
  if (o.ground === 'strip') {
    // one continuous floor across the whole stage (both parties share one place)
    const [lo, hi] = lim(8, o.width ?? Math.max(o.A.x, o.B.x) + 150 * k);
    ground = [g(null, h('path', {d: roundRectPath(lo, o.A.floor - 5 * k, hi - lo, 16 * k, 8 * k), fill: floorFill}), contact(o.A, fA)), contact(o.B, fB)];
  } else if (o.ground !== false) {
    ground = [o.A, o.B].map((pt, i) => {
      const f = i === 0 ? fA : fB;
      const x1 = pt.x - f * 150 * k, x2 = pt.x + f * 250 * k;
      const [lo, hi] = lim(Math.min(x1, x2), Math.max(x1, x2));
      return g(null,
        h('path', {d: roundRectPath(lo, pt.floor - 5 * k, hi - lo, 16 * k, 8 * k), fill: floorFill}),
        contact(pt, f));
    });
  }
  // optional "place" backdrops: a tinted wall with a window behind each party (two locations)
  const places = o.places ? [o.A, o.B].map((pt, i) => {
    const f = i === 0 ? fA : fB;
    const pw0 = o.places.w ?? 430 * k, phh = o.places.h ?? 470 * k;
    const x0 = f === 1 ? pt.x - 150 * k : pt.x + 150 * k - pw0;
    const [x, x1] = lim(x0, x0 + pw0);
    const pw = x1 - x;
    const y = Math.max(8, pt.floor - phh);
    const wall = th.dark ? (i ? '#2b3138' : '#312d29') : (i ? '#e6edf2' : '#efe6d8');
    const frame = th.dark ? '#4a525c' : (i ? '#c9d6df' : '#dccdb4');
    return g(null,
      h('path', {d: roundRectPath(x, y, pw, pt.floor - y, 22 * k), fill: wall}),
      h('rect', {x: x + pw * 0.06, y: pt.floor - 16 * k, width: pw * 0.88, height: 6 * k, rx: 3 * k, fill: frame, opacity: 0.8}));
  }) : null;
  const node = g({name: P},
    places && (o.hideA ? places[1] : places),
    o.hideA ? ground && ground[1] : ground,
    trail1.ghost, trail1.node,
    trail2 && trail2.ghost, trail2 && trail2.node,
    legs.tray && g({transform: trayAt}, legs.tray.back),
    o.hideA ? null : rigA.node, rigB.node,
    sheet.node,
    legs.tray && g({transform: trayAt}, legs.tray.front),
    o.hideA ? null : thumbA, thumbB,
    chips.map(c => c.node),
  );

  const rot = (v, deg) => {
    const a = rad(deg);
    return {x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a)};
  };
  const addP = (a, b) => ({x: a.x + b.x, y: a.y + b.y});
  const subP = (a, b) => ({x: a.x - b.x, y: a.y - b.y});

  /**
   * Pose the stage from action values (each 0..1).
   * fold/seal/windup/launch: offeror; travel (leg 1 or whole route), travel2 (relay leg 2);
   * returnA: offeror's empty hand back to rest; reach/bring: offeree's hand to the
   * catch point and back to reading position; open: seal torn; unfold: sheet opened.
   * headA/headB: head tilt in degrees (+ looks down); ghost1/ghost2: opacity of the not-yet-travelled route.
   */
  function pose(v) {
    const reduced = ctx.reduced;
    const nodes = {};
    const val = key => clamp(v[key] ?? 0);
    const windup = val('windup'), launch = val('launch');
    const travel = val('travel'), travel2 = val('travel2');
    const reach = val('reach'), bring = val('bring');
    const relay = Boolean(legs.leg2);
    const released = launch >= 1;
    const arrived = relay ? travel2 >= 1 : travel >= 1;

    let handAT;
    if (!released) {
      const wind = reduced ? mix(hands.holdA, hands.windA, 0.4) : hands.windA;
      handAT = launch > 0 ? mix(wind, hands.launchA, ease.inOutCubic(launch)) : mix(hands.holdA, wind, ease.inOutCubic(windup));
    } else {
      handAT = mix(hands.launchA, hands.restA, ease.inOutCubic(val('returnA')));
    }
    const handBT = bring > 0 ? mix(hands.catchB, hands.holdB, ease.inOutCubic(bring)) : mix(hands.restB, hands.catchB, ease.inOutCubic(reach));

    const dm = reduced ? 0.5 : 1;
    const headA = dm * (v.headA ?? 0);
    const headB = dm * (v.headB ?? 0);
    const leanA = reduced ? 0 : 4 * Math.sin(Math.PI * launch) - 2 * ease.inOutCubic(windup) * (1 - launch);
    const solvedA = rigA.frame({x: o.A.x, y: o.A.floor, facing: fA, scale: k, near: handAT, lean: leanA, headTilt: headA});
    const solvedB = rigB.frame({x: o.B.x, y: o.B.floor, facing: fB, scale: k, near: handBT, headTilt: headB});
    if (!o.hideA) Object.assign(nodes, solvedA.nodes);
    Object.assign(nodes, solvedB.nodes);
    const hA = solvedA.hands.near, hB = solvedB.hands.near;

    let holder, center, angle;
    let flight = 0;
    if (!released) {
      holder = 'A';
      angle = reduced ? 0 : -7 * fA * ease.inOutCubic(windup) * (1 - ease.inOutCubic(launch));
      center = addP(hA, rot({x: fA * sw / 2, y: 0}, angle));
    } else if (bring > 0 || (arrived && reach >= 1)) {
      holder = 'B';
      angle = 0;
      center = addP(hB, {x: fB * sw / 2, y: 0});
    } else if (relay && travel >= 1 && travel2 <= 0) {
      holder = 'relay';
      angle = 0;
      center = {x: legs.slot.x, y: legs.slot.y};
    } else {
      holder = 'in-transit';
      const second = relay && travel >= 1;
      const poly = second ? legs.leg2 : legs.leg1;
      const t = second ? travel2 : travel;
      flight = t;
      const q = poly.at(t);
      center = {x: q.x, y: q.y};
      const dir = Math.sign(poly.at(1).x - poly.at(0).x) || 1;
      angle = reduced ? 0 : -8 * dir * Math.sin(2 * Math.PI * t);
    }
    nodes[`${P}-sheet`] = {transform: T(center.x, center.y, angle)};
    const fs = foldState(val('fold'), val('unfold'));
    Object.assign(nodes, sheet.frame({bottom: fs.bottom, top: fs.top, seal: val('seal'), broken: val('open')}));

    const thumbAt = (name, hand, on, facing) => {
      nodes[name] = {opacity: on ? 1 : 0, transform: T(hand.x + facing * 5 * k, hand.y - 2 * k, 0, facing, 1)};
    };
    if (!o.hideA) thumbAt(`${P}-thumbA`, hA, holder === 'A', fA);
    thumbAt(`${P}-thumbB`, hB, holder === 'B', fB);

    Object.assign(nodes, trail1.frame(travel, v.ghost1 ?? 0));
    if (trail2) Object.assign(nodes, trail2.frame(travel2, v.ghost2 ?? 0));

    const gripA = subP(center, rot({x: fA * sw / 2, y: 0}, angle));
    const gripB = subP(center, rot({x: fB * sw / 2, y: 0}, angle));
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        holder,
        sheetCenter: P2(center),
        sheetAngle: r(angle),
        flight: r(flight, 3),
        folded: r(Math.min(fs.bottom, fs.top), 3),
        handA: P2(hA),
        handB: P2(hB),
        gripA: P2(gripA),
        gripB: P2(gripB),
        reach: {A: solvedA.reached, B: solvedB.reached},
        allReached: solvedA.reached && solvedB.reached,
      },
      mouthB: solvedB.mouth,
    };
  }

  return {
    node, pose, sheet, sw, sh, k, hands, launchC, catchC, legs, rigA, rigB, lookA, lookB, chips, fA, fB,
    /** world centre of the sheet when held at the reading positions */
    heldCenterA: cA(hands.holdA),
    heldCenterB: cB(hands.holdB),
    /** world points on the rigs (unleaned, untilted) */
    headB: wB({x: 5, y: -366}),
    mouthB: wB({x: 35, y: -346}),
    headA: wA({x: 5, y: -366}),
  };
}

/**
 * Editorial callout (chip + leader + dot) like primitives/annotate `callout`,
 * but with a configurable line limit for narrow columns. Kit-local helper.
 * @param {any} ctx
 * @param {{name:string, text:string, chipAt:{x:number,y:number}, anchor?:'start'|'middle'|'end', target:{x:number,y:number}, maxWidth:number, size?:number, maxLines?:number, color?:string}} o
 */
export function noteCallout(ctx, o) {
  const th = ctx.theme;
  const c = chip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: o.anchor ?? 'middle', maxWidth: o.maxWidth, size: o.size ?? 26, maxLines: o.maxLines ?? 2, fill: th.card, stroke: o.color ?? th.ink, color: th.ink, name: `${o.name}-chip`});
  const b = c.box;
  const from = {
    x: Math.max(b.x, Math.min(o.target.x, b.x + b.w)),
    y: o.target.y > b.y + b.h ? b.y + b.h : o.target.y < b.y ? b.y : b.y + b.h / 2,
  };
  if (from.y === b.y + b.h / 2) from.x = o.target.x > b.cx ? b.x + b.w : b.x;
  const len = Math.hypot(o.target.x - from.x, o.target.y - from.y);
  const color = o.color ?? (th.dark ? th.fg : th.ink); // leader stays visible on dark backgrounds
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: from.x, y1: from.y, x2: o.target.x, y2: o.target.y, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: o.target.x, cy: o.target.y, r: 7, fill: color, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
    c.node,
  );
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: r(Math.min(1, Math.max(0, (p - 0.45) / 0.55)), 3)},
  });
  return {node, frame, box: b};
}
