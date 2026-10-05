/**
 * Kit for the "Premisa oculta" motif (LAW-0109..0112): field set, strings,
 * geometry and original vector parts. Each entry owns its own timeline,
 * composition and semantics; this file only draws and measures.
 *
 * Physical metaphor — a WALKWAY of three paper cards on a dark reading board:
 *  - FACT (hecho)          a paper card with a pull tab on its outer edge.
 *  - CONCLUSION            a paper card with a pull tab on its outer edge.
 *  - GAP                   pushed together, the fact and conclusion cards abut
 *                          over a recessed POCKET cut into the board. Pulled
 *                          apart, the space between them reveals what lies in
 *                          the pocket:
 *  - INTERMEDIATE PREMISE  (regla) the card in the pocket. Its text is always
 *                          the author's; its status is SUPPLIED, never
 *                          inferred:
 *                            stated   → printed card (solid border, ink text,
 *                                       quotation-mark badge); it is linked
 *                                       into the walkway,
 *                            unstated → pencil card (dashed border, grey italic
 *                                       text, ellipsis badge); it stays loose
 *                                       and recessed in the pocket.
 *  - CONNECTOR (conector)  a brass HINGE on the inner edge of the fact card and
 *                          of the conclusion card. At rest its moving leaf lies
 *                          folded back on its own card. For a stated premise it
 *                          swings over the joint and latches onto the premise
 *                          card (the walk is continuous); for an unstated one it
 *                          stays folded (nothing links the card in).
 *  - LUPA                  a hand magnifier (shared with the hecho-y-regla kit)
 *                          whose glass shows a real enlarged, text-free copy.
 * Glyphs are neutral (quotation marks, ellipsis, document, "therefore" dots);
 * no tick or cross is ever used. Nothing here says whether the reasoning is
 * right, whether the premise is true or what follows in law. Texts are
 * fictional, jurisdiction unspecified.
 * @module animations/reasoning/kits/premisa-oculta
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, oneOf, list} from '../../../schemas/fields.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {lupaArt} from './hecho-y-regla.js';
import {balancedWidth} from '../../causation/kits/place.js';

export {lupaArt};

export const PREMISE_STATUSES = ['stated', 'unstated'];
export const CARDS = ['fact', 'premise', 'conclusion'];

/** Built-in labels (user content is never translated). */
export const PO_STRINGS = {
  en: {
    factKind: 'Fact',
    premiseKind: 'Intermediate premise',
    conclusionKind: 'Conclusion',
    stated: 'stated',
    unstated: 'left unstated',
    statedKey: 'Premise stated in the argument',
    unstatedKey: 'Premise left unstated',
    bothKey: 'Premise stated / left unstated',
    asSupplied: 'as supplied',
    noConclusion: 'no conclusion drawn',
    issue: 'Issue',
    assumed: 'Assumed',
    connector: 'Hinge links',
    lupa: 'Magnifier',
    analyst: 'Analyst',
    latched: 'hinges latched',
    folded: 'hinges folded back',
  },
  es: {
    factKind: 'Hecho',
    premiseKind: 'Premisa intermedia',
    conclusionKind: 'Conclusión',
    stated: 'declarada',
    unstated: 'omitida',
    statedKey: 'Premisa declarada en el argumento',
    unstatedKey: 'Premisa omitida',
    bothKey: 'Premisa declarada / omitida',
    asSupplied: 'según lo aportado',
    noConclusion: 'sin conclusión',
    issue: 'Cuestión',
    assumed: 'Se asume',
    connector: 'Bisagras de enlace',
    lupa: 'Lupa',
    analyst: 'Analista',
    latched: 'bisagras enganchadas',
    folded: 'bisagras plegadas',
  },
};

/* ------------------------------------------------------------------------ */
/* Category field set (reasoning): facts, rules, issues, assumptions        */
/* ------------------------------------------------------------------------ */

export const poFields = {
  facts: str('Fact printed on the fact card (fictional, as supplied)', 120),
  rules: str('The intermediate premise — the step between the fact and the conclusion — as supplied by the author (illustrative text, not a statement of any law)', 120),
  conclusion: str('Conclusion printed on the conclusion card, as supplied (it is never evaluated)', 120),
  issues: list('Open questions supplied by the author (shown as notes; never answered)', str('Question', 100), 0, 2),
  assumptions: list('Working assumptions supplied by the author (shown as notes; not verified)', str('Assumption', 90), 0, 2),
};

export const premiseStatusField = oneOf('Whether the argument as supplied STATES the intermediate premise (stated: printed card, hinges latch it into the walk) or leaves it UNSTATED (unstated: pencil card that stays loose in the pocket). Descriptive only: never says whether the reasoning is right', PREMISE_STATUSES);

/** Fictional default content shared by the four entries (each entry may vary it). */
export const DEFAULT_CONTENT = {
  facts: 'The shed key was found in Jo’s coat pocket',
  rules: 'Whoever holds the shed key locked the shed last',
  conclusion: 'Jo locked the shed last',
  issues: ['Who else could open the shed that evening?'],
  assumptions: ['The shed has a single key'],
};

/** Colour family of the objects. */
export function poColors(ctx) {
  const th = ctx.theme;
  const conc = th.cloth[3];
  return {
    fact: th.accent2, factSoft: th.accent2Soft,
    premise: th.accent3, premiseSoft: th.accent3Soft, premiseInk: shade(th.accent3, -0.45),
    conclusion: conc, conclusionSoft: shade(conc, 0.8),
    brass: '#c9a24a', brassDark: '#86651d', brassLight: '#f0dc9a',
    board: '#5b4636', boardTop: '#6d5643', boardRim: '#3e2f24', pocket: '#2f241c',
    pencil: th.inkSoft,
  };
}

/** Design units per output pixel at the 1080p reference (depends only on the frame's aspect and safe box). */
export function unitsPer1080px(ctx) {
  const v = ctx.view, c = v.content, D = ctx.design;
  return 1 / (Math.min(c.w / D.w, c.h / D.h) * (1080 / Math.min(v.width, v.height)));
}

/* ------------------------------------------------------------------------ */
/* Geometry                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Geometry of the OPEN walkway (fact | premise | conclusion) in world design
 * units, plus the offsets that close the gap (fact and conclusion abutting
 * over the premise's centre).
 *  axis 'x': fact left, conclusion right; cards cw wide, equal height.
 *  axis 'y': fact on top, conclusion at the bottom; cards `width` wide.
 * Text is fitted even when labels are hidden, so both label modes share one
 * geometry (bars replace the text when hidden).
 * @param {any} ctx
 * @param {{axis:'x'|'y', x:number, y:number, s:number, u?:number, cw?:number, width?:number, show:boolean,
 *   kinds:{fact:string, premise:string, conclusion:string}, texts:{fact:string, premise:string, conclusion:string},
 *   alt?:{which:string, text:string}, maxLines?:number, J?:number, minH?:number, tabs?:boolean}} o
 */
export function walkGeometry(ctx, o) {
  const s = o.s;
  const X = o.axis === 'x';
  const u = o.u ?? 1;
  const J = o.J ?? Math.max(10, s * 0.42);
  const lw = s * 1.3;
  const lh = s * 2.2;
  const pad = s * 0.55;
  const e = s * 0.16;
  const reach = lw - J;
  // kind labels are generic captions: ~16.5–20.5 px at 1080p, never larger than the supplied texts around them
  const kindSize = Math.min(Math.max(s * 0.56, 16.5 * u), Math.max(20.5 * u, 16.5 * u));
  const bodyMin = Math.max(Math.min(s, 17.2 * u), s * 0.8);
  const maxLines = o.maxLines ?? 5;
  const badgeR = kindSize * 0.78;
  // narrow columns: shrink a text (down to the ~17 px floor) so its longest word fits whole — never split a word
  const bodyFloor = Math.min(bodyMin, 17.2 * u);
  const wordSafe = (text, w) => {
    const longest = Math.max(...String(text).split(/\s+/).map(wd => ctx.measure(wd, s, 500, 'sans')));
    return longest > w ? Math.max(bodyFloor, s * (w / longest) * 0.98) : s;
  };
  const fitBody = (text, w) => {
    if (text === null || text === undefined || text === '') return null;
    const sz = wordSafe(text, w);
    return ctx.fit(text, {maxWidth: w, size: sz, minSize: Math.min(sz, bodyMin), maxLines, weight: 500});
  };
  // a fitted text whose lines are not whole words of the source (a word split across lines)
  const splitsWord = (f, text) => {
    if (!f) return false;
    const words = new Set(String(text).toUpperCase().split(/\s+/).filter(Boolean));
    return f.lines.some(line => line.replace(/…$/, '').toUpperCase().split(/\s+/).filter(Boolean).some(tok => !words.has(tok)));
  };
  // kind labels wrap between words only: shrink (bounded) until the longest word fits whole
  const fitKind = (text, w) => {
    const T0 = String(text).toUpperCase();
    const longest = Math.max(...T0.split(/\s+/).map(wd => ctx.measure(wd, kindSize, 800, 'sans')));
    const sz = longest > w ? Math.max(16 * u, kindSize * (w / longest) * 0.97) : kindSize;
    return ctx.fit(T0, {maxWidth: w, size: sz, minSize: Math.min(sz, Math.max(sz * 0.86, 16 * u)), maxLines: 2, weight: 800});
  };
  const hgt = f => (f ? f.height : 0);
  // text columns (card-local) and reserved margins for the hinge leaves
  let cw, W, cols;
  if (X) {
    cw = o.cw;
    const innerM = lw + pad * 0.6;
    const premM = reach + pad * 0.6;
    // headers use the full card width: the card is made tall enough that the hinge leaves (centred on the
    // inner edges) stay below the header band
    cols = {
      fact: {x: pad, w: cw - pad - innerM, hx: pad, hw: cw - 2 * pad},
      premise: {x: premM, w: cw - 2 * premM, hx: pad, hw: cw - 2 * pad},
      conclusion: {x: innerM, w: cw - pad - innerM, hx: pad, hw: cw - 2 * pad},
    };
  } else {
    W = o.width;
    const hingeZone = lh + pad * 1.4;
    cols = {
      fact: {x: pad, w: W - 2 * pad, hx: pad, hw: W - 2 * pad},
      premise: {x: pad, w: W - 2 * pad - 2 * e, hx: pad, hw: W - 2 * pad - 2 * e - hingeZone},
      conclusion: {x: pad, w: W - 2 * pad, hx: pad, hw: W - 2 * pad - hingeZone},
    };
  }
  const fits = {};
  for (const k of CARDS) {
    const c = cols[k];
    const kindW = c.hw - badgeR * 2 - s * 0.35;
    fits[k] = {kind: fitKind(o.kinds[k], kindW), body: fitBody(o.texts[k], c.w)};
  }
  const altFit = o.alt ? fitBody(o.alt.text, cols[o.alt.which].w) : null;
  const headH = k => pad * 0.55 + Math.max(fits[k].kind.height, badgeR * 2) + pad * 0.5;
  const bodyH = k => Math.max(hgt(fits[k].body), o.alt && o.alt.which === k ? hgt(altFit) : 0, s);
  // bottom margins (axis y): the fact's folded leaf lies on its bottom edge; the conclusion's leaf latches on the premise's bottom edge
  const bottomM = k => (X ? 0 : k === 'fact' ? lw : k === 'premise' ? reach : 0);
  const need = k => headH(k) + pad * 0.5 + bodyH(k) + pad * 0.75 + bottomM(k) + (k === 'premise' && X ? 2 * e : 0);
  let H = Math.max(...CARDS.map(need), o.minH ?? 0, X ? lh + 2 * pad : s * 3.2);
  // the conclusion's folded leaf lies on its header band (axis y): the band must be deep enough
  const HB = Math.max(...CARDS.map(headH), X ? 0 : lw + pad * 0.3);
  // axis x: the hinges sit in the middle of the card BODY (below the header band), so the body must hold a leaf
  if (X) H = Math.max(H, HB + lh + 14 + 2 * e);
  H = Math.max(H, ...CARDS.map(k => HB + pad * 0.5 + bodyH(k) + pad * 0.75 + bottomM(k) + (k === 'premise' && X ? 2 * e : 0)));
  const boxes = {};
  let closed, hinge;
  if (X) {
    boxes.fact = {x: o.x, y: o.y, w: cw, h: H};
    boxes.premise = {x: o.x + cw + J, y: o.y + e, w: cw, h: H - 2 * e};
    boxes.conclusion = {x: o.x + 2 * (cw + J), y: o.y, w: cw, h: H};
    const d = cw / 2 + J;
    closed = {fact: {dx: d, dy: 0}, conclusion: {dx: -d, dy: 0}};
    const hy = o.y + HB + (H - HB) / 2;
    hinge = {fact: {x: o.x + cw, y: hy, angle: 0}, conclusion: {x: boxes.conclusion.x, y: hy, angle: 180}};
  } else {
    boxes.fact = {x: o.x, y: o.y, w: W, h: H};
    boxes.premise = {x: o.x + e, y: o.y + H + J, w: W - 2 * e, h: H};
    boxes.conclusion = {x: o.x, y: o.y + 2 * (H + J), w: W, h: H};
    const d = H / 2 + J;
    closed = {fact: {dx: 0, dy: d}, conclusion: {dx: 0, dy: -d}};
    const hx = o.x + W - pad - lh / 2;
    hinge = {fact: {x: hx, y: o.y + H, angle: 90}, conclusion: {x: hx, y: boxes.conclusion.y, angle: -90}};
  }
  const P = boxes.premise;
  const q = s * 0.22;
  const pocket = {x: P.x - q, y: P.y - q, w: P.w + 2 * q, h: P.h + 2 * q};
  const bp = s * 0.62;
  const F = boxes.fact, C = boxes.conclusion;
  const board = {x: F.x - bp, y: F.y - bp, w: C.x + C.w - F.x + 2 * bp, h: C.y + C.h - F.y + 2 * bp};
  // pull tabs: fact on its left edge, conclusion on its right edge (level with the card's middle)
  const tl = s * 1.15, tw = Math.min(s * 2.5, H * 0.5);
  const tabs = o.tabs === false ? null : {
    fact: {x: F.x - tl, y: F.y + H / 2 - tw / 2, w: tl + 12, h: tw},
    conclusion: {x: C.x + C.w - 12, y: C.y + H / 2 - tw / 2, w: tl + 12, h: tw},
  };
  const grips = tabs ? {fact: {x: tabs.fact.x + tl * 0.42, y: F.y + H / 2}, conclusion: {x: tabs.conclusion.x + 12 + tl * 0.58, y: C.y + H / 2}} : null;
  const bbox = unionRect([board, tabs && tabs.fact, tabs && tabs.conclusion]);
  return {
    axis: o.axis, X, s, u, J, lw, lh, pad, e, reach, kindSize, badgeR, cw, W, H, HB, cols, fits, altFit, alt: o.alt || null, boxes, pocket, board, closed, hinge, tabs, grips, bbox, show: o.show,
    truncated: CARDS.some(k => (fits[k].body && fits[k].body.truncated) || fits[k].kind.truncated) || !!(altFit && altFit.truncated)
      || CARDS.some(k => splitsWord(fits[k].body, o.texts[k]) || splitsWord(fits[k].kind, o.kinds[k])) || !!(o.alt && splitsWord(altFit, o.alt.text)),
    wordSplit: CARDS.some(k => splitsWord(fits[k].body, o.texts[k]) || splitsWord(fits[k].kind, o.kinds[k])) || !!(o.alt && splitsWord(altFit, o.alt.text)),
    bodySizes: [...CARDS.map(k => fits[k].body && fits[k].body.size), altFit && altFit.size].filter(Boolean),
    kindSizes: CARDS.map(k => fits[k].kind.size),
  };
}

export function unionRect(list) {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}

/** Translate every box/point of a geometry by (dx, dy). Returns a new object (text fits are kept). */
export function shiftWalk(geo, dx, dy) {
  const mv = v => {
    if (Array.isArray(v)) return v.map(mv);
    if (v && typeof v === 'object') {
      if (v.lines && v.size) return v;
      const out = {};
      for (const [k, x] of Object.entries(v)) {
        if (k === 'x' && typeof x === 'number') out[k] = x + dx;
        else if (k === 'y' && typeof x === 'number') out[k] = x + dy;
        else out[k] = mv(x);
      }
      return out;
    }
    return v;
  };
  const keep = {fits: geo.fits, altFit: geo.altFit, cols: geo.cols, closed: geo.closed, alt: geo.alt, bodySizes: geo.bodySizes};
  const moved = mv(geo);
  // hinge angles are not positions
  moved.hinge = {fact: {...moved.hinge.fact, angle: geo.hinge.fact.angle}, conclusion: {...moved.hinge.conclusion, angle: geo.hinge.conclusion.angle}};
  return Object.assign(moved, keep);
}

/** Centre of a box. */
export const centerOf = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});

/* ------------------------------------------------------------------------ */
/* Glyphs (paths, never text)                                               */
/* ------------------------------------------------------------------------ */

/** Printed quotation marks (“ ”), centred on (0,0), height ~ s. */
export function quoteGlyph(s, color) {
  const k = s / 20;
  const one = dx => g({transform: T(dx * k, 0)},
    h('circle', {cx: 0, cy: r(-2 * k), r: r(3.6 * k), fill: color}),
    h('path', {d: `M${r(-3.4 * k)} ${r(-1.6 * k)}Q${r(-4 * k)} ${r(5 * k)} ${r(1.4 * k)} ${r(7.4 * k)}Q${r(-1.2 * k)} ${r(4 * k)} ${r(0.4 * k)} ${r(0.8 * k)}Z`, fill: color}));
  return g(null, one(-4.6), one(4.6));
}

/** Ellipsis (…) in pencil: three dots, centred on (0,0), width ~ s. */
export function ellipsisGlyph(s, color) {
  const k = s / 20;
  return g(null, [-6.5, 0, 6.5].map(dx => h('circle', {cx: r(dx * k), cy: 0, r: r(2.4 * k), fill: color})));
}

/** Document glyph (fact badge). */
export function docGlyph(s, color) {
  const k = s / 20;
  return g(null,
    h('path', {d: `M${r(-5 * k)} ${r(-7 * k)}H${r(2.4 * k)}L${r(5.4 * k)} ${r(-4 * k)}V${r(7 * k)}H${r(-5 * k)}Z`, fill: 'none', stroke: color, 'stroke-width': r(1.9 * k), 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-2.6 * k)} ${r(-1 * k)}H${r(2.8 * k)}M${r(-2.6 * k)} ${r(2.6 * k)}H${r(2.8 * k)}`, stroke: color, 'stroke-width': r(1.7 * k), 'stroke-linecap': 'round'}));
}

/** "Therefore" dots (∴, conclusion badge). */
export function thereforeGlyph(s, color) {
  const k = s / 20;
  return g(null, [[0, -4.2], [-5, 4], [5, 4]].map(([x, y]) => h('circle', {cx: r(x * k), cy: r(y * k), r: r(2.5 * k), fill: color})));
}

/**
 * Round badge with the glyph of a card kind (fact / conclusion) or of the
 * premise's supplied status (stated / unstated). Centred on (x, y).
 */
export function badgeArt(ctx, kind, x, y, R) {
  const th = ctx.theme;
  const col = poColors(ctx);
  if (kind === 'unstated') {
    return g({transform: T(x, y)},
      h('circle', {r: r(R), fill: th.paper, stroke: col.pencil, 'stroke-width': 2, 'stroke-dasharray': '4 3'}),
      ellipsisGlyph(R * 1.25, col.pencil));
  }
  const fill = kind === 'fact' ? col.fact : kind === 'conclusion' ? col.conclusion : col.premise;
  const glyph = kind === 'fact' ? docGlyph(R * 1.3, '#ffffff') : kind === 'conclusion' ? thereforeGlyph(R * 1.2, '#ffffff') : quoteGlyph(R * 1.15, '#ffffff');
  return g({transform: T(x, y)}, h('circle', {r: r(R), fill, stroke: th.ink, 'stroke-width': 2}), glyph);
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

/** Placeholder text bars (labels hidden or text-free copies). x, y = top-left of the text block. */
export function bars(x, y, w, lines, s, color, k = 1.2) {
  const out = [];
  for (let i = 0; i < lines; i++) {
    const lw = i === lines - 1 && lines > 1 ? w * 0.55 : w * 0.92;
    out.push(h('rect', {x: r(x), y: r(y + i * s * k + s * 0.22), width: r(lw), height: r(s * 0.46), rx: r(s * 0.23), fill: color}));
  }
  return out;
}

/** Pull tab (paper, with finger ridges) drawn under a card's outer edge. */
function tabArt(ctx, tb, side, s) {
  const th = ctx.theme;
  const ridges = [];
  const x0 = side === 'left' ? tb.x + s * 0.28 : tb.x + tb.w - s * 0.28;
  for (let k = -1; k <= 1; k++) {
    const y = tb.y + tb.h / 2 + k * tb.h * 0.2;
    ridges.push(h('line', {x1: r(x0), x2: r(x0 + (side === 'left' ? 1 : -1) * s * 0.5), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
  }
  return g(null, h('path', {d: roundRectPath(tb.x, tb.y, tb.w, tb.h, 9), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2.4}), ridges);
}

/**
 * A card of the walkway at its OPEN position (world coords; entries move the
 * returned group). which: 'fact' | 'conclusion' | 'premise'.
 * Options: name, prefix (text node names), look ('stated'|'unstated', premise
 * only), textless (bars instead of text), skipBody (the entry draws the body
 * text itself), bodyFit (override), tab (default true for fact/conclusion).
 */
export function cardArt(ctx, geo, which, o = {}) {
  const th = ctx.theme;
  const col = poColors(ctx);
  const s = geo.s;
  const B = geo.boxes[which];
  const c = geo.cols[which];
  const f = geo.fits[which];
  const isP = which === 'premise';
  const unstated = isP && o.look === 'unstated';
  const accent = which === 'fact' ? col.fact : which === 'conclusion' ? col.conclusion : col.premise;
  const soft = which === 'fact' ? col.factSoft : which === 'conclusion' ? col.conclusionSoft : col.premiseSoft;
  const parts = [];
  const showText = geo.show && !o.textless;
  if (!isP && o.tab !== false && geo.tabs) parts.push(tabArt(ctx, geo.tabs[which], which === 'fact' ? 'left' : 'right', s));
  const rad = 12;
  if (!unstated) parts.push(h('path', {d: roundRectPath(B.x + 6, B.y + 9, B.w, B.h, rad), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, rad), fill: unstated ? '#fbf8f1' : th.paper, stroke: unstated ? col.pencil : th.ink, 'stroke-width': unstated ? 2.4 : th.stroke, 'stroke-dasharray': unstated ? '11 7' : undefined}));
  // header band
  const HB = geo.HB;
  const band = `M${r(B.x)} ${r(B.y + HB)}V${r(B.y + rad)}Q${r(B.x)} ${r(B.y)} ${r(B.x + rad)} ${r(B.y)}H${r(B.x + B.w - rad)}Q${r(B.x + B.w)} ${r(B.y)} ${r(B.x + B.w)} ${r(B.y + rad)}V${r(B.y + HB)}Z`;
  if (!unstated) {
    parts.push(h('path', {d: band, fill: soft}));
    parts.push(h('line', {x1: r(B.x), x2: r(B.x + B.w), y1: r(B.y + HB), y2: r(B.y + HB), stroke: th.ink, 'stroke-width': 1.8}));
  } else {
    parts.push(h('line', {x1: r(B.x + 10), x2: r(B.x + B.w - 10), y1: r(B.y + HB), y2: r(B.y + HB), stroke: col.pencil, 'stroke-width': 1.8, 'stroke-dasharray': '7 6'}));
  }
  // paper ruling in the body (printed cards only), under the text
  if (!unstated) {
    const y0 = B.y + HB + geo.pad * 0.5;
    const step = s * 1.18;
    for (let y = y0 + step; y < B.y + B.h - geo.pad * 0.5; y += step) {
      parts.push(h('line', {x1: r(B.x + c.x), x2: r(B.x + c.x + c.w), y1: r(y + s * 0.1), y2: r(y + s * 0.1), stroke: th.paperLine, 'stroke-width': 1, opacity: 0.45}));
    }
  }
  const bx = B.x + c.hx + geo.badgeR;
  const by = B.y + HB / 2;
  parts.push(badgeArt(ctx, isP ? (unstated ? 'unstated' : 'stated') : which, bx, by, geo.badgeR));
  const kx = bx + geo.badgeR + s * 0.35;
  const kColor = unstated ? col.pencil : shade(accent, -0.35);
  if (showText || (o.kindText && geo.show)) parts.push(g({'data-role': 'caption'}, textBlock(f.kind, {x: kx, y: by - f.kind.height / 2, fill: kColor, name: o.prefix ? `${o.prefix}-kind` : undefined})));
  else parts.push(...bars(kx, by - s * 0.4, Math.min(c.hw * 0.5, s * 5), 1, s * 0.7, unstated ? '#d8d2c6' : shade(soft, -0.18)));
  // body
  const bf = o.bodyFit || f.body;
  if (!o.skipBody) parts.push(bodyText(ctx, geo, which, bf, {name: o.prefix ? `${o.prefix}-body` : undefined, look: o.look, textless: !showText}));
  return g({name: o.name}, parts);
}

/** Top y of a card's body text block (world, open position). */
export function bodyTop(geo, which) {
  return geo.boxes[which].y + geo.HB + geo.pad * 0.5 + (geo.X && which === 'premise' ? 0 : 0);
}

/** The body text (or bars) of a card, in world open coordinates. */
export function bodyText(ctx, geo, which, fit, o = {}) {
  const th = ctx.theme;
  const col = poColors(ctx);
  const B = geo.boxes[which];
  const c = geo.cols[which];
  const unstated = which === 'premise' && o.look === 'unstated';
  const y = bodyTop(geo, which);
  if (o.textless || !fit) {
    const lines = fit ? fit.lines.length : 2;
    return g({name: o.name, opacity: o.opacity}, bars(B.x + c.x, y, c.w * (fit ? Math.min(1, fit.width / c.w + 0.05) : 0.8), lines, fit ? fit.size : geo.s, unstated ? '#d9d3c7' : th.paperLine, fit ? fit.lineHeight / fit.size : 1.2));
  }
  return g({'data-role': 'content', name: o.name, opacity: o.opacity}, textBlock(fit, {x: B.x + c.x, y, fill: unstated ? col.pencil : th.ink, italic: unstated}));
}

/**
 * The reading board with the recessed pocket under the gap. Local = world.
 * Returns {base, pocket}: `pocket` is the recess (drawn under the premise),
 * `base` the board itself.
 */
export function boardArt(ctx, geo, o = {}) {
  const col = poColors(ctx);
  const th = ctx.theme;
  const b = geo.board;
  const P = geo.pocket;
  const grain = [];
  const n = Math.max(3, Math.round((geo.X ? b.h : b.w) / 55));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const wob = 4 + ctx.rng(`${o.seedKey || 'po-board'}-g`, i) * 7;
    if (geo.X) {
      const y = b.y + t * b.h;
      grain.push(h('path', {d: `M${r(b.x + 14)} ${r(y)}C${r(b.x + b.w * 0.3)} ${r(y - wob)} ${r(b.x + b.w * 0.65)} ${r(y + wob)} ${r(b.x + b.w - 14)} ${r(y - wob * 0.4)}`, fill: 'none', stroke: col.boardRim, 'stroke-width': 1.6, opacity: 0.35}));
    } else {
      const x = b.x + t * b.w;
      grain.push(h('path', {d: `M${r(x)} ${r(b.y + 14)}C${r(x - wob)} ${r(b.y + b.h * 0.3)} ${r(x + wob)} ${r(b.y + b.h * 0.65)} ${r(x - wob * 0.4)} ${r(b.y + b.h - 14)}`, fill: 'none', stroke: col.boardRim, 'stroke-width': 1.6, opacity: 0.35}));
    }
  }
  const screws = [[b.x + 12, b.y + 12], [b.x + b.w - 12, b.y + 12], [b.x + 12, b.y + b.h - 12], [b.x + b.w - 12, b.y + b.h - 12]]
    .map(([x, y]) => g(null, h('circle', {cx: r(x), cy: r(y), r: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.4}), h('line', {x1: r(x - 3), x2: r(x + 3), y1: r(y - 3), y2: r(y + 3), stroke: th.metalDark, 'stroke-width': 1.4})));
  const base = g({name: o.name},
    h('path', {d: roundRectPath(b.x + 8, b.y + 12, b.w, b.h, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 18), fill: col.board, stroke: th.ink, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(b.x + 6, b.y + 6, b.w - 12, b.h - 12, 14), fill: col.boardTop}),
    grain, screws);
  // recess: dark well, inner shadow along the top and left walls, a lighter lip on the far walls
  const pocket = g({name: o.pocketName},
    h('path', {d: roundRectPath(P.x, P.y, P.w, P.h, 10), fill: col.pocket, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: `M${r(P.x + 4)} ${r(P.y + P.h - 6)}V${r(P.y + 10)}Q${r(P.x + 4)} ${r(P.y + 4)} ${r(P.x + 10)} ${r(P.y + 4)}H${r(P.x + P.w - 6)}`, fill: 'none', stroke: '#000', 'stroke-width': 7, opacity: 0.35}),
    h('path', {d: `M${r(P.x + P.w - 2)} ${r(P.y + 8)}V${r(P.y + P.h - 2)}H${r(P.x + 8)}`, fill: 'none', stroke: '#8a7058', 'stroke-width': 2.5, opacity: 0.8}));
  return {base, pocket};
}

/**
 * Inner shadow thrown by the pocket walls on a card that lies recessed in it
 * (fades when the card is lifted flush). World coords of the premise box.
 */
export function recessShade(ctx, geo, name) {
  const P = geo.boxes.premise;
  const w = Math.max(10, geo.s * 0.55);
  return g({name, opacity: 1},
    h('path', {d: `M${r(P.x)} ${r(P.y + P.h)}V${r(P.y + 12)}Q${r(P.x)} ${r(P.y)} ${r(P.x + 12)} ${r(P.y)}H${r(P.x + P.w)}V${r(P.y + w * 0.7)}H${r(P.x + w)}V${r(P.y + P.h)}Z`, fill: '#2a1f16', opacity: 0.18}),
    h('path', {d: `M${r(P.x)} ${r(P.y + P.h)}V${r(P.y + 12)}Q${r(P.x)} ${r(P.y)} ${r(P.x + 12)} ${r(P.y)}H${r(P.x + P.w)}V${r(P.y + w * 0.32)}H${r(P.x + w * 0.45)}V${r(P.y + P.h)}Z`, fill: '#2a1f16', opacity: 0.22}));
}

/**
 * Brass hinge on the inner edge of the fact card ('fact') or of the
 * conclusion card ('conclusion'), in open world coords (put it inside the
 * card's group so it travels with the card). The fixed leaf is screwed to its
 * own card; the moving leaf lies folded over it (k = −1) and swings over the
 * joint onto the premise card (k = +1).
 * @returns {{fixed:any, leaf:any, knuckle:any, frame:(k:number)=>Record<string,any>, tipAt:(k:number)=>{x:number,y:number}}}
 */
export function hingeArt(ctx, geo, side, o) {
  const th = ctx.theme;
  const col = poColors(ctx);
  const hg = geo.hinge[side];
  const lw = geo.lw, lh = geo.lh;
  const kn = Math.max(8, geo.s * 0.36);
  const N = o.name;
  const plate = (sgn, fill) => {
    const x0 = sgn > 0 ? kn * 0.3 : -lw, x1 = sgn > 0 ? lw : -kn * 0.3;
    const rr = Math.min(lh * 0.14, 10);
    const d = sgn > 0
      ? `M${r(x0)} ${r(-lh / 2)}H${r(x1 - rr)}Q${r(x1)} ${r(-lh / 2)} ${r(x1)} ${r(-lh / 2 + rr)}V${r(lh / 2 - rr)}Q${r(x1)} ${r(lh / 2)} ${r(x1 - rr)} ${r(lh / 2)}H${r(x0)}Z`
      : `M${r(x1)} ${r(-lh / 2)}H${r(x0 + rr)}Q${r(x0)} ${r(-lh / 2)} ${r(x0)} ${r(-lh / 2 + rr)}V${r(lh / 2 - rr)}Q${r(x0)} ${r(lh / 2)} ${r(x0 + rr)} ${r(lh / 2)}H${r(x1)}Z`;
    const sx = sgn * lw * 0.6;
    const screw = y => g(null, h('circle', {cx: r(sx), cy: r(y), r: r(Math.max(3.2, lh * 0.075)), fill: col.brassLight, stroke: col.brassDark, 'stroke-width': 1.5}),
      h('line', {x1: r(sx - lh * 0.045), x2: r(sx + lh * 0.045), y1: r(y - lh * 0.045), y2: r(y + lh * 0.045), stroke: col.brassDark, 'stroke-width': 1.3}));
    return [
      h('path', {d, fill, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(sgn > 0 ? x0 + 4 : x0 + 6)} ${r(-lh / 2 + 5)}H${r(sgn > 0 ? x1 - 6 : x1 - 4)}`, stroke: '#ffffff', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.45}),
      screw(-lh * 0.27), screw(lh * 0.27),
    ];
  };
  const place = T(hg.x, hg.y, hg.angle);
  const fixed = g({transform: place}, h('path', {d: roundRectPath(-lw + 4, -lh / 2 + 5, lw, lh, 8), fill: th.shadow, opacity: 0.8}), plate(-1, shade(col.brass, -0.12)));
  const leaf = g({name: `${N}-leaf`, transform: T(hg.x, hg.y, hg.angle, -1, 1)},
    h('path', {name: `${N}-lshadow`, d: roundRectPath(kn * 0.3 + 5, -lh / 2 + 6, lw - kn * 0.3, lh, 8), fill: th.shadow, opacity: 0}),
    plate(1, col.brass),
    h('path', {name: `${N}-edge`, d: roundRectPath(kn * 0.3, -lh / 2, lw - kn * 0.3, lh, 6), fill: col.brassDark, opacity: 0}));
  const segs = [];
  for (let k = 1; k < 4; k++) segs.push(h('line', {x1: r(-kn / 2), x2: r(kn / 2), y1: r(-lh / 2 + (lh * k) / 4), y2: r(-lh / 2 + (lh * k) / 4), stroke: col.brassDark, 'stroke-width': 1.6}));
  const knuckle = g({transform: place},
    h('rect', {x: r(-kn / 2), y: r(-lh / 2 - 3), width: r(kn), height: r(lh + 6), rx: r(kn / 2), fill: col.brass, stroke: th.ink, 'stroke-width': 2.2}),
    segs,
    h('line', {x1: r(-kn * 0.18), x2: r(-kn * 0.18), y1: r(-lh / 2 + 2), y2: r(lh / 2 - 2), stroke: '#ffffff', 'stroke-width': 1.8, opacity: 0.5}));
  const a = (hg.angle * Math.PI) / 180;
  return {
    fixed, leaf, knuckle,
    /** k = −1 folded back on its own card … +1 latched on the premise card */
    frame: k => {
      const kk = Math.abs(k) < 0.02 ? (k < 0 ? -0.02 : 0.02) : k;
      return {
        [`${N}-leaf`]: {transform: T(hg.x, hg.y, hg.angle, kk, 1)},
        [`${N}-edge`]: {opacity: r(0.55 * (1 - Math.abs(k)), 3)},
        [`${N}-lshadow`]: {opacity: r(0.9 * (1 - Math.abs(k)) + (k > 0.98 ? 0.6 : 0), 3)},
      };
    },
    /** world point of the moving leaf's free end (card at its open position) */
    tipAt: k => ({x: hg.x + Math.cos(a) * lw * k, y: hg.y + Math.sin(a) * lw * k}),
  };
}

/**
 * Text-free static copy of the open walkway (for the magnifier's glass).
 * @param {{look:'stated'|'unstated', k:number, prefix:string}} o
 */
export function walkCopy(ctx, geo, o) {
  const brd = boardArt(ctx, geo, {seedKey: 'po-board'});
  const cards = ['fact', 'conclusion'].map(w => cardArt(ctx, geo, w, {textless: true, tab: false}));
  const hinges = ['fact', 'conclusion'].map(side => hingeStatic(ctx, geo, side, o.k));
  return g(null, brd.base, brd.pocket, cardArt(ctx, geo, 'premise', {textless: true, look: o.look}), o.look === 'unstated' ? recessShade(ctx, geo) : null, cards, hinges);
}

/** A hinge frozen at leaf position k (no node names), for static copies. */
export function hingeStatic(ctx, geo, side, k) {
  const hn = hingeArt(ctx, geo, side, {name: 'tmp'});
  const leaf = stripNames(hn.leaf);
  leaf.attrs.transform = hn.frame(k)['tmp-leaf'].transform;
  return g(null, hn.fixed, leaf, hn.knuckle);
}

/** Copy of a subtree without node names (so copies never clash with live nodes). */
export function stripNames(node) {
  if (!node || typeof node === 'string') return node;
  const attrs = {...node.attrs};
  delete attrs.name;
  return {tag: node.tag, attrs, children: node.children.map(stripNames)};
}

/**
 * Note chips stacked in a column (issues, assumptions, key): each {kind, text}.
 * Returns {node, h, boxes}. kind: 'issue' | 'assumed' | 'key'.
 */
export function notesColumn(ctx, items, o) {
  const th = ctx.theme;
  const col = poColors(ctx);
  let y = o.y;
  const boxes = [];
  const parts = items.map((it, i) => {
    const bw = balancedWidth(ctx, it.text, {maxWidth: o.w, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 4, weight: it.kind === 'key' ? 700 : 600});
    const c = chip(ctx, it.text, {x: o.align === 'right' ? o.x + o.w - Math.min(o.w, bw) : o.x, y, maxWidth: bw, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 4, fill: th.card, stroke: it.kind === 'issue' ? shade(col.premise, -0.2) : it.kind === 'key' ? th.ink : th.inkFaint, weight: it.kind === 'key' ? 700 : 600, name: o.prefix ? `${o.prefix}${i}` : undefined});
    boxes.push(c.box);
    y += c.box.h + (o.gap ?? 10);
    return g({'data-role': 'content'}, markChip(c.node));
  });
  return {node: g({name: o.name, opacity: 0}, parts), h: Math.max(0, y - o.y - (o.gap ?? 10)), boxes, truncated: items.some(it => ctx.fit(it.text, {maxWidth: o.w - o.size * 1.2, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 4, weight: 600}).truncated)};
}

/** Mark a chip's group (its first/largest path is the container of its text) for the chip-containment test. */
export function markChip(node) {
  if (node && node.attrs) node.attrs['data-chip'] = '1';
  return node;
}

/** Mark the chip inside an editorial callout (place.js calloutChip: its chip group is named `${name}-chip`). */
export function markCallout(c) {
  const walk = n => { if (!n || typeof n === 'string') return; if (n.attrs && typeof n.attrs.name === 'string' && n.attrs.name.endsWith('-chip')) markChip(n); (n.children || []).forEach(walk); };
  walk(c.node);
  return c;
}

/** Height and width a notes column would take, without building nodes. */
export function notesSize(ctx, items, w, size, maxLines = 4, gap = 10, minSize) {
  let hh = 0, ww = 0, truncated = false;
  items.forEach((it, i) => {
    const bw = balancedWidth(ctx, it.text, {maxWidth: w, size, minSize: minSize ?? size, maxLines, weight: it.kind === 'key' ? 700 : 600});
    const c = chip(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size, minSize: minSize ?? size, maxLines, weight: it.kind === 'key' ? 700 : 600});
    hh += c.box.h + (i ? gap : 0);
    ww = Math.max(ww, c.box.w);
    if (c.fit.truncated) truncated = true;
  });
  return {h: hh, w: ww, truncated};
}

/**
 * Key chip: status badge + "Premise stated / left unstated · as supplied · no
 * conclusion drawn". Returns {node, box}.
 */
export function keyChip(ctx, status, o) {
  const th = ctx.theme;
  const t = ctx.t;
  const s = o.size;
  const R = s * 0.62;
  const both = status === 'both';
  const text = both ? `${t.bothKey} · ${t.asSupplied} · ${t.noConclusion}` : `${status === 'stated' ? t.statedKey : t.unstatedKey} · ${t.asSupplied} · ${t.noConclusion}`;
  const fitAt = mw => ctx.fit(text, {maxWidth: mw, size: s, minSize: o.minSize ?? s, maxLines: o.maxLines ?? 3, weight: 700});
  const icons = both ? 2 : 1;
  const mw0 = o.maxWidth - s * 1.2 - R * 2 * icons - s * 0.4 * icons;
  let fit = fitAt(mw0);
  // balanced lines: the narrowest width that keeps the same line count and size (no orphan word)
  if (fit.lines.length > 1 && !fit.truncated) {
    let lo = mw0 * 0.3, hi = mw0;
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2;
      const f = fitAt(mid);
      if (f.lines.length === fit.lines.length && !f.truncated && f.size >= fit.size - 0.01) hi = mid; else lo = mid;
    }
    fit = fitAt(hi + 1);
  }
  const iw = (R * 2 + s * 0.4) * icons;
  const w = fit.width + s * 1.2 + iw;
  const hh = Math.max(fit.height, R * 2) + s * 0.8;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.x;
  const node = g({name: o.name, opacity: 0, 'data-chip': '1'},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, s * 0.9)), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
    both
      ? [badgeArt(ctx, 'stated', x + s * 0.6 + R, o.y + hh / 2, R), badgeArt(ctx, 'unstated', x + s * 0.6 + R * 3 + s * 0.4, o.y + hh / 2, R)]
      : badgeArt(ctx, status, x + s * 0.6 + R, o.y + hh / 2, R),
    g({'data-role': 'content'}, textBlock(fit, {x: x + s * 0.6 + iw, y: o.y + (hh - fit.height) / 2, fill: th.ink})));
  return {node, box: {x, y: o.y, w, h: hh}, fit, text};
}

/* ------------------------------------------------------------------------ */
/* Mechanism / contrast / inspect helpers                                   */
/* ------------------------------------------------------------------------ */

/**
 * A free hinge (both leaves and the knuckle) in its own local frame: hinge
 * line at the origin, the moving leaf towards +x (k = +1 flat / latched,
 * −1 folded over the fixed leaf). frame(pos, k) places it anywhere.
 * @returns {{node:any, frame:(pos:{x:number,y:number,angle:number}, k:number, opacity?:number)=>Record<string,any>, extent:(pos:any, k:number)=>{x:number,y:number,w:number,h:number}}}
 */
export function hingeUnit(ctx, geo, name) {
  const local = {...geo, hinge: {fact: {x: 0, y: 0, angle: 0}, conclusion: {x: 0, y: 0, angle: 0}}};
  const hn = hingeArt(ctx, local, 'fact', {name});
  const node = g({name: `${name}-u`}, hn.fixed, hn.leaf, hn.knuckle);
  const lw = geo.lw, lh = geo.lh;
  return {
    node,
    frame: (pos, k, opacity = 1) => {
      const f = hn.frame(k);
      return {...f, [`${name}-u`]: {transform: T(pos.x, pos.y, pos.angle), opacity: r(opacity, 3)}};
    },
    extent: (pos, k) => {
      const a = (pos.angle * Math.PI) / 180;
      const ends = [-lw, Math.max(0.2, k) * lw].flatMap(u => [-lh / 2 - 3, lh / 2 + 3].map(v => ({x: pos.x + Math.cos(a) * u - Math.sin(a) * v, y: pos.y + Math.sin(a) * u + Math.cos(a) * v})));
      const xs = ends.map(q => q.x), ys = ends.map(q => q.y);
      return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
    },
  };
}

const LINK = {
  relation: {dash: null, arrow: false, width: 3.4, endDots: true},
  communication: {dash: '11 8', arrow: true, width: 3.6, endDots: false},
  sequence: {dash: null, arrow: true, width: 3.6, endDots: false},
  causal: {dash: null, arrow: true, width: 5.5, endDots: false},
};

/** Point of a quadratic curve. */
export const qAt = (a, c, b, t) => ({x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y});

/**
 * Curved link styled by relation kind (plain relation: end dots, no arrow;
 * sequence / communication / causal: arrowhead only once fully drawn). The
 * partial curve is the exact sub-curve up to p (de Casteljau), so dashed
 * styles draw on without masks. A card-coloured halo keeps it readable on
 * any background.
 */
export function curveLink(ctx, name, kind, color) {
  const st = LINK[kind] || LINK.relation;
  const w = st.width;
  const head = w * 4.4;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-halo`, d: 'M0 0', fill: 'none', stroke: ctx.theme.card, 'stroke-width': w + 5, 'stroke-linecap': 'round', opacity: 0.85}),
    h('path', {name: `${name}-line`, d: 'M0 0', fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': st.dash || undefined}),
    st.arrow ? h('path', {name: `${name}-head`, d: `M0 0L${r(-head)} ${r(-head * 0.55)}L${r(-head * 0.72)} 0L${r(-head)} ${r(head * 0.55)}Z`, fill: color, stroke: ctx.theme.card, 'stroke-width': 1.5, opacity: 0}) : null,
    st.endDots ? h('circle', {name: `${name}-dotA`, r: r(w * 1.6), fill: color}) : null,
    st.endDots ? h('circle', {name: `${name}-dotB`, r: r(w * 1.6), fill: color, opacity: 0}) : null);
  /**
   * @param {{x:number,y:number}} a start  @param {{x:number,y:number}} c control  @param {{x:number,y:number}} b end
   * @param {number} p draw progress  @param {number} [opacity]
   */
  const frame = (a, c, b, p, opacity = 1) => {
    const done = p >= 0.985;
    // sub-curve [0, p]
    const pp = Math.max(0, Math.min(1, p));
    const c1 = {x: a.x + (c.x - a.x) * pp, y: a.y + (c.y - a.y) * pp};
    let e = qAt(a, c, b, pp);
    // the arrowhead's tip touches b; the line stops under the head
    if (st.arrow && done) {
      const tg = {x: b.x - c.x, y: b.y - c.y};
      const L = Math.hypot(tg.x, tg.y) || 1;
      e = {x: b.x - (tg.x / L) * head * 0.7, y: b.y - (tg.y / L) * head * 0.7};
    }
    const d = `M${r(a.x)} ${r(a.y)}Q${r(c1.x)} ${r(c1.y)} ${r(e.x)} ${r(e.y)}`;
    const out = {
      [name]: {opacity: p > 0 && opacity > 0 ? r(opacity, 3) : 0},
      [`${name}-line`]: {d},
      [`${name}-halo`]: {d},
    };
    if (st.arrow) out[`${name}-head`] = {transform: T(b.x, b.y, (Math.atan2(b.y - c.y, b.x - c.x) * 180) / Math.PI), opacity: done ? 1 : 0};
    if (st.endDots) {
      out[`${name}-dotA`] = {cx: r(a.x), cy: r(a.y)};
      out[`${name}-dotB`] = {cx: r(b.x), cy: r(b.y), opacity: done ? 1 : 0};
    }
    return out;
  };
  return {node, frame, arrow: st.arrow, kind};
}

/** Link sample for legends (line + arrowhead or end dots), origin = left end. */
export function linkSample(ctx, kind, color, len = 54) {
  const st = LINK[kind] || LINK.relation;
  return g(null,
    h('line', {x1: 0, x2: len, y1: 0, y2: 0, stroke: ctx.theme.card, 'stroke-width': st.width + 5, 'stroke-linecap': 'round', opacity: 0.85}),
    h('line', {x1: 0, x2: st.arrow ? len - 8 : len, y1: 0, y2: 0, stroke: color, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}),
    st.arrow ? h('path', {d: `M${len + 4} 0l-15 -8l3 8l-3 8z`, fill: color}) : h('circle', {cx: len, cy: 0, r: 5, fill: color}),
    st.arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}));
}

/** Link colour per relation kind (ink family; a halo separates them from the ground). */
export function linkColor(ctx, kind) {
  const th = ctx.theme;
  return kind === 'communication' ? th.accent2 : kind === 'sequence' ? (th.dark ? th.fg : th.ink) : kind === 'causal' ? th.accent : (th.dark ? th.fgSoft : th.inkSoft);
}
