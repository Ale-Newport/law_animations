/**
 * Shared vector art for the "Inicio de reclamaciones civiles" category
 * (civil-claim). Original layered artwork, first drawn for the
 * "Requerimiento previo" motif (LAW-0241..0244) and meant to be reused by the
 * later civil-claim motifs:
 *
 *  - caseFile        a standing case file (expediente) seen from the front:
 *                    back cover showing its thickness, sheet edges, spine band,
 *                    elastic band, a reference tab and a title plate.
 *  - wallShelf       a bracketed wall shelf (for a case file or binders).
 *  - backWall        office back wall with baseboard, floor boards and a plant.
 *  - officeChair     side-view chair for a seated party.
 *  - seatedParty     a seated person (primitives/person.js rig) split into a
 *                    body layer and a near-arm layer, so props can pass
 *                    between the body and the hand that holds them.
 *  - longTable       a long side-view table with a groove track on its top
 *                    (the outgoing route) and a return rail with rollers on its
 *                    front apron (the return route).
 *  - letterSheet     a letter with reference, supplied contents, date line,
 *                    signature line and a perforated tear-off reply slip; the
 *                    slip is a separate node so it can be torn off and travel.
 *  - sled            a small runner base that carries a standing letter on the
 *                    groove track.
 *  - letterTray      a front-facing letter tray (back rack + front lip with a
 *                    label plate) and a neutral "lit slot" glow.
 *  - replyPocket     a pocket hanging on the table front that receives what
 *                    comes back along the return rail; neutral dashed empty
 *                    slot + neutral glow.
 *  - calendarStrip   a hanging calendar strip whose day cells unfold one by one
 *                    (the "response space"), each with a neutral empty slot; a
 *                    small paper glyph can drop into one day's slot.
 *
 * Every text is supplied data drawn through fitWords (whole-word wrapping;
 * numbers stay attached to their word through U+00A0). With text hidden the
 * props draw neutral filler bars marked `data-bar` instead of text.
 * Nothing here encodes a legal effect: glows and slots are neutral (accent2 /
 * ink-soft), never alarm colours, ticks or crosses.
 * @module animations/civil-claim/kits/civil-claim-art
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {r, seg, ease} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade, signatureMark} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {fitWords} from '../../roles/kits/mediation-labels.js';

const INK = '#1f2328';

/**
 * Keep numbers attached to the word before them ("Day 3", "CF 0412") and
 * short tokens in brackets together, so a wrap never leaves "Day / 3".
 * @param {string} s
 */
export function glue(s) {
  return String(s ?? '')
    // (a one- or two-letter word stays with the word after it: no line ends on "a", "of", "de", "la")
    // (a single capital letter stays with the word before it: "Party A", "Parte B")
    .replace(/(\S+) (\p{Lu})(?=\s|$|[.,;:·'’])/gu, '$1\u00a0$2')
    .replace(/(?<=^|\s)(\p{Ll}{1,2}) (?=\S)/gu, '$1\u00a0')
    .replace(/(\S+) (\d[\w./-]*)/gu, '$1 $2')
    // (a parenthesis after a number starts a new unit: "Day 1 (supplied)" may wrap as "Day 1 / (supplied)")
    .replace(/(\d[\w./-]*) (\S+)/gu, (m, a, b) => (/^[–—-]$|^\(/.test(b) ? m : `${a} ${b}`));
}

/** fitWords with glued numbers (same result shape as core fitText). */
export function fitG(text, o) {
  return fitWords(glue(text), o);
}

/** Neutral filler bars used on props when text is hidden. */
function bars(x, y, w, n, lh, th, key, rng) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const lw = i === n - 1 ? w * (0.45 + rng(`${key}-b`, i) * 0.3) : w * (0.8 + rng(`${key}-b`, i) * 0.2);
    out.push(h('rect', {'data-bar': 1, x: r(x), y: r(y + i * lh), width: r(lw), height: r(lh * 0.36), rx: r(lh * 0.18), fill: th.paperLine}));
  }
  return out;
}

/* ======================================================================== */
/* Case file (expediente)                                                    */
/* ======================================================================== */

/**
 * Standing case file seen from the front. Local origin = bottom-left corner of
 * the front cover. Height grows with the supplied text.
 * @param {any} ctx
 * @param {{prefix:string, w:number, ref:string, title:string, size:number, showText:boolean, color?:string}} o
 */
export function caseFile(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts} = o;
  const c = o.color || '#c9a15e';
  const pad = ts * 0.55;
  const inner = w - pad * 2 - ts * 0.6;
  const refFit = fitG(o.ref, {maxWidth: w * 0.8 - ts * 0.6, size: ts, minSize: ts, maxLines: 3, weight: 700, family: 'mono'});
  const titleFit = fitG(o.title, {maxWidth: inner - ts * 0.4, size: ts, minSize: ts, maxLines: 7, weight: 700, family: 'serif'});
  const tabH = refFit.height + ts * 0.7;
  const tabW = Math.max(w * 0.46, refFit.width + ts * 1.1);
  const plateH = titleFit.height + ts * 0.9;
  const bodyH = Math.max(w * 1.05, plateH + ts * 3.2);
  const H = bodyH + tabH;
  const top = -bodyH;
  const px = ts * 0.9, py = top + ts * 1.1;
  const parts = [
    h('path', {d: roundRectPath(8, top - 4, w, bodyH + 4, 8), fill: th.shadow}),
    // back cover (thickness) and sheet edges peeking above the front cover
    h('path', {d: roundRectPath(ts * 0.35, top - ts * 0.45, w, bodyH, 9), fill: shade(c, -0.22), stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: ts * 0.5, y: top - ts * 0.3, width: w - ts * 0.4, height: ts * 0.5, rx: 3, fill: th.paper, stroke: INK, 'stroke-width': 1.4}),
    h('rect', {x: ts * 0.62, y: top - ts * 0.18, width: w - ts * 0.6, height: ts * 0.45, rx: 3, fill: th.paperShade, stroke: INK, 'stroke-width': 1.2}),
    // reference tab
    h('path', {d: `M${r(w - tabW - 6)} ${r(top + 2)}V${r(top - tabH + 8)}Q${r(w - tabW - 6)} ${r(top - tabH)} ${r(w - tabW + 2)} ${r(top - tabH)}H${r(w - 14)}Q${r(w - 6)} ${r(top - tabH)} ${r(w - 6)} ${r(top - tabH + 8)}V${r(top + 2)}Z`, fill: shade(c, 0.1), stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    // front cover
    h('path', {d: roundRectPath(0, top, w, bodyH, 9), fill: c, stroke: INK, 'stroke-width': 2.8}),
    h('rect', {x: 0, y: top, width: ts * 0.6, height: bodyH, rx: 4, fill: shade(c, -0.18)}),
    h('path', {d: roundRectPath(0, top, w, bodyH, 9), fill: 'none', stroke: INK, 'stroke-width': 2.8}),
    // elastic band
    h('rect', {x: w - ts * 1.1, y: top, width: ts * 0.34, height: bodyH, fill: '#5b4b6b', opacity: 0.85}),
    // title plate
    h('path', {d: roundRectPath(px, py, inner, plateH, 6), fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: px, y: py + plateH + ts * 0.5, width: inner * 0.6, height: ts * 0.3, rx: 2, fill: shade(c, -0.14)}),
  ];
  if (o.showText) {
    parts.push(textBlock(refFit, {x: w - tabW - 6 + (tabW - 8) / 2, y: top - tabH + ts * 0.35, anchor: 'middle', fill: INK, name: `${o.prefix}-ref`}));
    parts.push(textBlock(titleFit, {x: px + ts * 0.2, y: py + ts * 0.45, fill: INK, name: `${o.prefix}-title`}));
  } else {
    parts.push(...bars(w - tabW + ts * 0.2, top - tabH + ts * 0.45, tabW - ts * 1.2, 1, ts, th, `${o.prefix}-rb`, ctx.rng));
    parts.push(...bars(px + ts * 0.2, py + ts * 0.5, inner - ts * 0.4, titleFit.lines.length, ts * 1.18, th, `${o.prefix}-tb`, ctx.rng));
  }
  return {node: g({name: o.prefix}, parts), w, h: H, bodyH, box: {x: 0, y: -H, w: w + ts * 0.4, h: H}, refFit, titleFit};
}

/** Bracketed wall shelf. Local origin = top-left of the plank. */
export function wallShelf(ctx, {w, depth = 18}) {
  const th = ctx.theme;
  return g(null,
    h('path', {d: `M${r(w * 0.18)} ${depth}V${depth + 40}L${r(w * 0.18 + 34)} ${depth}Z`, fill: th.metalDark, stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(w * 0.82)} ${depth}V${depth + 40}L${r(w * 0.82 - 34)} ${depth}Z`, fill: th.metalDark, stroke: INK, 'stroke-width': 2}),
    h('rect', {x: 0, y: 0, width: w, height: depth, rx: 4, fill: th.woodTop, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: 3, y: depth - 6, width: w - 6, height: 4, fill: th.woodDark, opacity: 0.5}),
  );
}

/** Low filing cabinet (two drawers). Local origin = floor point under its left edge; top at y = -h. */
export function filingCabinet(ctx, {w, h: hh}) {
  const th = ctx.theme;
  const c = '#8d9aa5';
  const dh = (hh - 22) / 2;
  return g(null,
    h('path', {d: roundRectPath(8, -hh + 8, w, hh - 8, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, -hh, w, hh, 8), fill: c, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: -6, y: -hh - 6, width: w + 12, height: 14, rx: 5, fill: shade(c, -0.2), stroke: INK, 'stroke-width': 2.2}),
    ...[0, 1].map(i => g(null,
      h('path', {d: roundRectPath(10, -hh + 16 + i * (dh + 4), w - 20, dh - 4, 6), fill: shade(c, 0.12), stroke: INK, 'stroke-width': 2}),
      h('rect', {x: w / 2 - 22, y: -hh + 16 + i * (dh + 4) + dh * 0.3, width: 44, height: 9, rx: 4.5, fill: th.metalDark, stroke: INK, 'stroke-width': 1.6}))),
  );
}

/**
 * Office back wall, floor and a potted plant (decor, never a sign of anything).
 * @param {any} ctx
 * @param {{x0:number, x1:number, top:number, plantX?:number|null, seedKey?:string}} o  floor at y = 0
 */
export function backWall(ctx, o) {
  const th = ctx.theme;
  const wall = th.dark ? '#3a3f46' : '#efe6d6';
  const floor = th.dark ? '#2e3238' : '#dccbb0';
  const w = o.x1 - o.x0;
  const boards = [];
  for (let x = o.x0 + 40; x < o.x1; x += 150) boards.push(h('path', {d: `M${r(x)} 2L${r(x - 30)} 46`, stroke: shade(floor, -0.12), 'stroke-width': 2}));
  const plant = o.plantX == null ? null : g({transform: T(o.plantX, 0)},
    h('path', {d: 'M-26 0L-32 -56H32L26 0Z', fill: '#b9774e', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('rect', {x: -36, y: -66, width: 72, height: 12, rx: 4, fill: '#a8663f', stroke: INK, 'stroke-width': 2.2}),
    ...[[-4, -150, -40], [0, -170, 5], [6, -140, 38], [-2, -120, -60], [4, -118, 60]].map(([bx, ty, tx]) =>
      h('path', {d: `M${bx} -66Q${r((bx + tx) / 2)} ${r(ty + 20)} ${tx} ${ty}Q${r((bx + tx) / 2 + 14)} ${r(ty + 44)} ${bx + 4} -66Z`, fill: '#6b9a62', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'})),
  );
  return g(null,
    h('rect', {x: o.x0, y: o.top, width: w, height: -o.top, rx: 14, fill: wall}),
    h('rect', {x: o.x0, y: o.top + 18, width: w, height: 10, fill: shade(wall, -0.05)}),
    h('rect', {x: o.x0, y: -26, width: w, height: 26, fill: shade(wall, -0.12)}),
    h('rect', {x: o.x0, y: 0, width: w, height: 48, rx: 6, fill: floor}),
    boards,
    h('line', {x1: o.x0, x2: o.x1, y1: 0, y2: 0, stroke: INK, 'stroke-width': 2.4}),
    plant,
  );
}

/** Side-view office chair; origin = seat point (hips), facing +x (mirror with facing −1). */
export function officeChair(ctx, {facing = 1, seatY = 132, color = '#5d6a78'}) {
  const f = facing;
  return g({transform: f === 1 ? '' : 'scale(-1 1)'},
    h('path', {d: 'M-60 -250Q-66 -250 -66 -242V-8H-44V-236Q-44 -250 -52 -250Z', fill: shade(color, -0.1), stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: -64, y: -6, width: 136, height: 18, rx: 7, fill: color, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M4 12V${seatY - 12}`, stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round'}),
    h('path', {d: `M-40 ${seatY - 8}H48`, stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round'}),
    h('circle', {cx: -40, cy: seatY - 6, r: 6, fill: INK}),
    h('circle', {cx: 48, cy: seatY - 6, r: 6, fill: INK}),
  );
}

/**
 * Seated party: person rig split into a body layer and a near-arm layer.
 * frame(s) = personRig frame plus the transform of the near-arm wrapper.
 * @param {any} ctx
 * @param {{name:string, look:any}} o
 */
export function seatedParty(ctx, o) {
  const rig = personRig(ctx, {name: o.name, look: o.look, pose: 'seated', chair: false});
  const [far, legs, upper, near] = rig.node.children;
  const body = g({name: o.name}, far, legs, upper);
  const nearNode = g({name: `${o.name}-nw`}, near);
  return {
    body,
    near: nearNode,
    anchors: rig.anchors,
    frame(s) {
      const out = rig.frame(s);
      out.nodes[`${o.name}-nw`] = {transform: out.nodes[o.name].transform};
      return out;
    },
  };
}

/* ======================================================================== */
/* Table with the two routes                                                 */
/* ======================================================================== */

/**
 * Long side-view table. Floor y = 0; the top surface is at `top` (negative).
 * The outgoing route is a groove track on the top (x from trackX0 to trackX1);
 * the return route is a rail with rollers on the front apron (railX0..railX1,
 * running surface at `railY`).
 * @param {any} ctx
 * @param {{x0:number, x1:number, top:number, apron:number, legs:number[], trackX0:number, trackX1:number, railX0:number, railX1:number, railY:number}} o
 */
export function longTable(ctx, o) {
  const th = ctx.theme;
  const wood = th.wood, top = th.woodTop;
  const W = o.x1 - o.x0;
  const legs = o.legs.map(x => g(null,
    h('rect', {x: x - 11, y: o.apron, width: 22, height: -o.apron, fill: shade(wood, -0.12), stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: x - 16, y: -8, width: 32, height: 8, rx: 3, fill: shade(wood, -0.3), stroke: INK, 'stroke-width': 2}),
  ));
  const rollers = [];
  for (let x = o.railX0 + 20; x < o.railX1 - 10; x += 46) rollers.push(h('circle', {cx: r(x), cy: r(o.railY + 5), r: 5, fill: th.metal, stroke: INK, 'stroke-width': 1.6}));
  const rail = g(null,
    // brackets holding the rail under the apron
    ...(o.railY > o.apron ? [o.railX0 + 8, (o.railX0 + o.railX1) / 2, o.railX1 - 8] : []).map(x => h('rect', {x: r(x - 5), y: o.apron - 4, width: 10, height: r(o.railY - o.apron + 8), fill: th.metalDark, stroke: INK, 'stroke-width': 1.6})),
    h('rect', {x: o.railX0, y: o.railY, width: o.railX1 - o.railX0, height: 12, rx: 6, fill: th.metal, stroke: INK, 'stroke-width': 2.2}),
    rollers,
    // chevrons along the rail (direction of the return route: towards x0)
    ...Array.from({length: Math.max(1, Math.floor((o.railX1 - o.railX0) / 180))}, (_, i) => {
      const x = o.railX0 + 110 + i * 180;
      return h('path', {d: `M${r(x + 7)} ${r(o.railY + 22)}l-8 5l8 5`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
    }),
  );
  const track = g(null,
    h('rect', {x: o.trackX0, y: o.top - 6, width: o.trackX1 - o.trackX0, height: 6, rx: 3, fill: shade(top, -0.25), stroke: INK, 'stroke-width': 1.6}),
    ...Array.from({length: Math.max(1, Math.floor((o.trackX1 - o.trackX0) / 180))}, (_, i) => {
      const x = o.trackX0 + 90 + i * 180;
      return h('path', {d: `M${r(x - 7)} ${r(o.top + 14)}l8 5l-8 5`, fill: 'none', stroke: shade(wood, -0.45), 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
    }),
  );
  const node = g(null,
    legs,
    h('rect', {x: o.x0 + 14, y: o.top + 16, width: W - 28, height: o.apron - o.top - 16, fill: wood, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: o.x0, y: o.top, width: W, height: 18, rx: 6, fill: top, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: o.x0 + 6, y: o.top + 3, width: W - 12, height: 4, rx: 2, fill: '#fff', opacity: 0.25}),
    track,
    rail,
  );
  return {node, top: o.top};
}

/* ======================================================================== */
/* Letter with tear-off reply slip                                           */
/* ======================================================================== */

/**
 * Letter prop with a tear-off reply coupon in its bottom-right corner. Local
 * origin = bottom-centre of the whole sheet. The body (the sheet minus the
 * coupon, with the signature line bottom-left) and the coupon are separate
 * nodes: the coupon's own origin is its bottom-centre, attached at
 * (slipOffX, 0) of the letter.
 * @param {any} ctx
 * @param {{prefix:string, w:number, size:number, ref:string, title:string, date:string, slip:string, signer:string,
 *   showText:boolean, lipCover?:number, sigW?:number, refSize?:number, barsOnly?:boolean, liftClear?:number}} o
 *   lipCover: height at the bottom that a tray lip may hide (only blank paper and the signature's foot there).
 */
export function letterSheet(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts, prefix} = o;
  const pad = ts * 0.6;
  const inner = w - pad * 2;
  // compact letters (o.barsOnly) print only filler bars: the entry draws those supplied texts once elsewhere
  const rs = o.refSize ?? ts;
  // (compact letters size their filler bars from fixed placeholder lines, so the sheet is the same for every
  // preset and never grows with supplied text it does not print)
  if (o.barsOnly && o.fixedFiller) o = {...o, ref: 'Ref. 0000/0', title: 'Xxxxxxx', date: 'Xxxx: xxx 0', slip: 'Xxxxx xxxx xxxxx'};
  const refFit = fitG(o.ref, {maxWidth: inner - w * 0.12, size: rs, minSize: rs, maxLines: 3, weight: 600, family: 'mono'});
  const titleFit = fitG(o.title, {maxWidth: inner, size: ts, minSize: ts, maxLines: 8, weight: 700, family: 'serif'});
  const dateFit = fitG(o.date, {maxWidth: inner, size: ts, minSize: ts, maxLines: 3, weight: 500});
  const cw = w * 0.56;
  const slipFit = fitG(o.slip, {maxWidth: cw - pad * 2, size: ts, minSize: ts, maxLines: 8, weight: 700});
  const lipCover = o.lipCover ?? ts * 1.3;
  let y = pad;
  const refY = y; y += refFit.height + ts * 0.45;
  const titleY = y; y += titleFit.height + ts * 0.45;
  const dateY = y; y += dateFit.height + ts * 0.4;
  const topH = y;
  const slipTextH = slipFit.height;
  const slipH = pad * 0.7 + slipTextH + ts * 0.35 + lipCover + 6;
  const sigZone = ts * 1.9 + lipCover + 8;
  // (liftClear: blank room above the coupon, so that the coupon lifted out of a tray covers none of the printed text)
  const Z = Math.max(slipH + (o.liftClear ?? 0), sigZone);
  const H = topH + Z;
  const fold = w * 0.1;
  const X = -w / 2, Tp = -H;
  const sigBox = {x: X + pad + ts * 0.1, y: -(lipCover + 6 + ts * 1.5), w: Math.min(w - cw - pad * 2 - ts * 0.2, o.sigW ?? inner), h: ts * 1.4};
  const sig = signatureMark(ctx, {name: `${prefix}-sig`, signer: o.signer, box: sigBox, color: '#1c3f8c', width: 3});
  const cx0 = X + w - cw; // the coupon's left edge
  const bodyParts = [
    h('path', {d: roundRectPath(X + 6, Tp + 8, w, H, 4), fill: th.shadow}),
    h('path', {d: `M${r(X)} ${r(Tp + 4)}Q${r(X)} ${r(Tp)} ${r(X + 4)} ${r(Tp)}H${r(X + w - fold)}L${r(X + w)} ${r(Tp + fold)}V${r(-slipH)}H${r(cx0)}V0H${r(X + 4)}Q${r(X)} 0 ${r(X)} -4Z`, fill: th.paper, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(X + w - fold)} ${r(Tp)}V${r(Tp + fold * 0.85)}Q${r(X + w - fold)} ${r(Tp + fold)} ${r(X + w - fold * 0.85)} ${r(Tp + fold)}H${r(X + w)}Z`, fill: th.paperShade, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: X + pad, y: Tp + refY + refFit.height + ts * 0.18, width: inner * 0.35, height: 3, fill: th.accent2}),
    h('line', {x1: sigBox.x - ts * 0.1, x2: sigBox.x + sigBox.w, y1: r(sigBox.y + sigBox.h), y2: r(sigBox.y + sigBox.h), stroke: INK, 'stroke-width': 2}),
    sig.node,
    // perforation along the coupon's edges (it stays on the sheet after the coupon is torn off)
    h('path', {d: `M${r(cx0)} -2V${r(-slipH)}H${r(X + w - 2)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '5 5'}),
  ];
  const barsFor = () => [
    ...bars(X + pad, Tp + refY + ts * 0.2, inner * 0.6, refFit.lines.length, ts * 1.18, th, `${prefix}-r`, ctx.rng),
    ...bars(X + pad, Tp + titleY + ts * 0.2, inner, titleFit.lines.length, ts * 1.18, th, `${prefix}-t`, ctx.rng),
    ...bars(X + pad, Tp + dateY + ts * 0.2, inner * 0.7, dateFit.lines.length, ts * 1.18, th, `${prefix}-d`, ctx.rng),
  ];
  if (o.showText && !o.barsOnly) {
    bodyParts.push(textBlock(refFit, {x: X + pad, y: Tp + refY, fill: th.inkSoft, name: `${prefix}-ref`}));
    bodyParts.push(textBlock(titleFit, {x: X + pad, y: Tp + titleY, fill: INK, name: `${prefix}-title`}));
    bodyParts.push(textBlock(dateFit, {x: X + pad, y: Tp + dateY, fill: th.inkSoft, name: `${prefix}-date`}));
  } else bodyParts.push(...barsFor());
  const CX = -cw / 2;
  const slipParts = sfx => [
    h('path', {d: roundRectPath(CX + 5, -slipH + 6, cw, slipH, 4), fill: th.shadow}),
    h('path', {d: `M${r(CX)} ${r(-slipH)}H${r(CX + cw)}V-4Q${r(CX + cw)} 0 ${r(CX + cw - 4)} 0H${r(CX + 4)}Q${r(CX)} 0 ${r(CX)} -4Z`, fill: '#f3ecdc', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(CX)} ${r(-slipH)}H${r(CX + cw)}M${r(CX)} ${r(-slipH)}V-2`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '5 5'}),
    o.showText && !o.barsOnly ? textBlock(slipFit, {x: CX + pad, y: -slipH + pad * 0.7, fill: INK, name: `${prefix}-sliptext${sfx}`})
      : bars(CX + pad, -slipH + pad * 0.9, (cw - pad * 2) * 0.8, slipFit.lines.length, ts * 1.18, th, `${prefix}-s`, ctx.rng),
  ];
  return {
    w, h: H, bodyH: H, slipH, slipTextH, sig, sigBox, cw, slipOffX: w / 2 - cw / 2,
    body: g({name: `${prefix}-body`}, bodyParts),
    /** coupon nodes (call once per copy with a distinct name suffix) */
    slip: slipParts,
    fits: [refFit, titleFit, dateFit, slipFit],
    /** blank band at the bottom of the coupon that a lip or a pocket front may cover */
    slipBlank: lipCover + 6,
  };
}

/** Runner base carrying a standing letter. Local origin = top-centre. */
export function sled(ctx, {name, w, hgt = 12}) {
  const th = ctx.theme;
  return g({name},
    h('rect', {x: -w / 2, y: 0, width: w, height: hgt, rx: 4, fill: th.metalDark, stroke: INK, 'stroke-width': 2}),
    h('rect', {x: -w / 2 + 10, y: hgt - 2, width: 22, height: 6, rx: 3, fill: INK}),
    h('rect', {x: w / 2 - 32, y: hgt - 2, width: 22, height: 6, rx: 3, fill: INK}),
  );
}

/* ======================================================================== */
/* Tray and pocket                                                           */
/* ======================================================================== */

/**
 * Front-facing letter tray standing on a table. Local origin = centre of its
 * base at table height (y = 0). `back` is drawn behind the letter, `front`
 * (lip + label plate) in front of it, `glow` behind everything.
 * @param {any} ctx
 * @param {{prefix:string, w:number, lipTop:number, rackTop:number, label:string, size:number, showText:boolean, icon?:'in'|'out', noIcon?:boolean}} o
 *   noIcon: a plain label plate without the in/out arrow glyph (LAW-0249..0252: no directed arrows)
 */
export function letterTray(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts} = o;
  const x = -w / 2;
  // (o.plateMaxW: the plate keeps within this width, its label wraps instead; o.plateAlign 'end' sets it at the
  // tray's right end)
  const fit = fitG(o.label, {maxWidth: Math.min(w - ts * 2.6, (o.plateMaxW ?? Infinity) - ts * 2.3), size: ts, minSize: ts, maxLines: 8, weight: 700});
  const lipH = -o.lipTop;
  // the label plate starts on the lip and may hang down over the table front (a long label never raises the lip)
  const plateH = o.plain ? lipH - 10 : Math.max(lipH - 10, fit.height + ts * 0.5);
  const plateW = Math.min(o.plain ? w * 0.5 : Math.max(fit.width + ts * (o.noIcon ? 1.8 : 2.3), w * 0.5), o.plateMaxW ?? Infinity);
  const wire = '#5f7482';
  const back = g({name: `${o.prefix}-back`},
    // wire rack: a light back panel with an outlined frame and uprights
    h('path', {d: `M${r(x)} 0V${r(o.rackTop + 12)}Q${r(x)} ${r(o.rackTop)} ${r(x + 12)} ${r(o.rackTop)}H${r(x + w - 12)}Q${r(x + w)} ${r(o.rackTop)} ${r(x + w)} ${r(o.rackTop + 12)}V0Z`, fill: '#dfe7ec', stroke: INK, 'stroke-width': 2.2}),
    ...[0.2, 0.4, 0.6, 0.8].map(k => h('line', {x1: r(x + w * k), x2: r(x + w * k), y1: r(o.rackTop + 8), y2: -4, stroke: wire, 'stroke-width': 3, opacity: 0.6})),
    h('line', {x1: x + 6, x2: x + w - 6, y1: r(o.rackTop * 0.5), y2: r(o.rackTop * 0.5), stroke: wire, 'stroke-width': 3, opacity: 0.6}),
    h('rect', {x: x - 6, y: -8, width: w + 12, height: 10, rx: 4, fill: shade('#6f8797', -0.3), stroke: INK, 'stroke-width': 2}),
  );
  const py = o.lipTop + 5;
  const px = o.plateAlign === 'end' ? x + w - ts * 0.3 - plateW : x + ts * 0.3;
  const ay = py + Math.min(plateH, ts * 1.4) / 2;
  const arrow = o.icon === 'out'
    ? `M${r(px + ts * 0.5)} ${r(ay)}h${r(ts * 0.7)}m-${r(ts * 0.3)} -${r(ts * 0.3)}l${r(ts * 0.3)} ${r(ts * 0.3)}l-${r(ts * 0.3)} ${r(ts * 0.3)}`
    : `M${r(px + ts * 1.2)} ${r(ay)}h-${r(ts * 0.7)}m${r(ts * 0.3)} -${r(ts * 0.3)}l-${r(ts * 0.3)} ${r(ts * 0.3)}l${r(ts * 0.3)} ${r(ts * 0.3)}`;
  const front = g({name: `${o.prefix}-front`},
    h('path', {d: `M${r(x - 6)} 0V${r(o.lipTop + 8)}Q${r(x - 6)} ${r(o.lipTop)} ${r(x + 4)} ${r(o.lipTop)}H${r(x + w - 4)}Q${r(x + w + 6)} ${r(o.lipTop)} ${r(x + w + 6)} ${r(o.lipTop + 8)}V0Z`, fill: '#8aa2b1', stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: px + 4, y: py + 5, width: plateW, height: plateH, rx: 5, fill: th.shadow}),
    h('rect', {x: px, y: py, width: plateW, height: plateH, rx: 5, fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    o.noIcon ? null : h('path', {d: arrow, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    o.plain ? null : o.showText ? textBlock(fit, {x: px + ts * (o.noIcon ? 0.9 : 1.8), y: py + (plateH - fit.height) / 2, fill: INK, name: `${o.prefix}-label`}) : bars(px + ts * (o.noIcon ? 0.9 : 1.6), py + plateH / 2 - ts * 0.2, plateW - ts * (o.noIcon ? 1.8 : 2.1), 1, ts, th, `${o.prefix}-lb`, ctx.rng),
  );
  const glow = h('path', {name: `${o.prefix}-glow`, d: roundRectPath(x - 18, o.rackTop - 16, w + 36, -o.rackTop + 28, 20), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3, opacity: 0});
  return {back, front, glow, fit, lipH, box: {x: x - 6, y: o.rackTop, w: w + 12, h: -o.rackTop}, plate: {x: px, y: py, w: plateW, h: plateH}};
}

/**
 * Pocket hanging on the table front that receives items coming back along the
 * return rail. Local origin = top-centre of the FRONT panel. `back` is drawn
 * behind the item, `front` in front of it, `glow` and `empty` (neutral dashed
 * slot) behind the item.
 * @param {any} ctx
 * @param {{prefix:string, w:number, depth:number, backRise:number, label:string, size:number, showText:boolean}} o
 */
export function replyPocket(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts} = o;
  const x = -w / 2;
  const fit = fitG(o.label, {maxWidth: w - ts * 1.6, size: ts, minSize: ts, maxLines: 3, weight: 700});
  const frontH = Math.max(o.depth, fit.height + ts * 0.8);
  const col = '#9c8a6e';
  const back = g({name: `${o.prefix}-back`},
    h('path', {d: roundRectPath(x + 8, -o.backRise + 8, w, o.backRise + frontH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, -o.backRise, w, o.backRise + frontH, 10), fill: shade(col, -0.25), stroke: INK, 'stroke-width': 2.4}),
  );
  const empty = h('path', {name: `${o.prefix}-empty`, d: roundRectPath(x + ts * 0.5, -o.backRise + ts * 0.35, w - ts, o.backRise - ts * 0.2, 6), fill: 'none', stroke: th.paper, 'stroke-width': 2.5, 'stroke-dasharray': '7 7', opacity: 0.9});
  const front = g({name: `${o.prefix}-front`},
    h('path', {d: roundRectPath(x - 4, 0, w + 8, frontH, 10), fill: col, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: x + 8, y: 5, width: w - 16, height: 4, rx: 2, fill: '#fff', opacity: 0.25}),
    o.showText ? textBlock(fit, {x: 0, y: (frontH - fit.height) / 2, anchor: 'middle', fill: '#fffdf8', name: `${o.prefix}-label`}) : null,
  );
  const glow = h('path', {name: `${o.prefix}-glow`, d: roundRectPath(x - 16, -o.backRise - 14, w + 32, o.backRise + frontH + 28, 18), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3, opacity: 0});
  return {back, front, empty, glow, fit, frontH, box: {x: x - 4, y: -o.backRise, w: w + 8, h: o.backRise + frontH}};
}

/* ======================================================================== */
/* Calendar strip (the response space)                                       */
/* ======================================================================== */

/**
 * Hanging calendar strip with unfolding day cells. Design-unit geometry;
 * origin = top-left of the header bar. The header (with hanging rings and the
 * supplied title) is present from the start; the cells unfold one by one from
 * their left hinge. Each cell shows the supplied day label and a neutral
 * dashed empty slot; `mark` drops a small paper glyph into one day's slot.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, cols:number, days:string[], title:string, size:number, showText:boolean, cellH?:number}} o
 */
export function calendarStrip(ctx, o) {
  const th = ctx.theme;
  const {prefix, x, y, w, size: ts, days} = o;
  const n = days.length;
  const cols = Math.max(1, Math.min(o.cols, n));
  const rows = Math.ceil(n / cols);
  const cw = w / cols;
  const titleFit = fitG(o.title, {maxWidth: w - ts * 2.4, size: ts, minSize: ts, maxLines: 3, weight: 700});
  const noTitle = o.showTitle === false;
  const headH = noTitle ? ts * 1.1 : titleFit.height + ts * 0.9;
  // o.inline: a compact cell with the day label on the left and its slot beside it
  const inl = Boolean(o.inline);
  // (inline: the label may take the cell up to a slot of 1.6 em, so that a short day label stays on one line)
  const dayFits = days.map(d => fitG(d, {maxWidth: inl ? Math.max(cw * 0.58 - ts * 0.5, cw - ts * 2.45) : cw - ts * 0.7, size: ts, minSize: ts, maxLines: 3, weight: 700}));
  const dayH = Math.max(...dayFits.map(f => f.height));
  const dayWmax = Math.max(...dayFits.map(f => f.width));
  // (o.slotRows: several slot rows per day — one per compared scene — stacked beside the label; row 0 holds the mark)
  const nRows = Math.max(1, o.slotRows ?? 1);
  const slotGap = ts * 0.3;
  const slotH = inl ? Math.max(nRows > 1 ? ts * 1.15 : dayH, ts * 1.15) : Math.max(ts * 1.6, o.slotH ?? 0);
  const slotsH = nRows * slotH + (nRows - 1) * slotGap;
  const cellH = o.cellH ?? (inl ? Math.max(slotsH, dayH) + ts * 0.8 : dayH + slotsH + ts * 1.3);
  const top = y + headH;
  const H = headH + rows * cellH;
  const cellBox = i => ({x: x + (i % cols) * cw, y: top + Math.floor(i / cols) * cellH, w: cw, h: cellH});
  const slotBox = (i, row = 0) => {
    const c = cellBox(i);
    const dy = row * (slotH + slotGap);
    if (inl) return {x: c.x + ts * 0.7 + dayWmax, y: c.y + ts * 0.4 + Math.max(0, (dayH - slotsH) / 2) + dy, w: c.w - dayWmax - ts * 1.1, h: slotH};
    return {x: c.x + ts * 0.4, y: c.y + ts * 0.45 + dayH + ts * 0.3 + dy, w: c.w - ts * 0.8, h: slotH};
  };
  const rings = [];
  const nr = Math.max(2, Math.round(w / 130));
  for (let i = 0; i < nr; i++) {
    const rx = x + ((i + 0.5) / nr) * w;
    rings.push(h('path', {d: `M${r(rx)} ${r(y + ts * 0.3)}v-${r(ts * 0.9)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}));
  }
  const header = g({name: `${prefix}-head`},
    h('path', {d: roundRectPath(x + 6, y + 8, w, headH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, headH, 10), fill: th.accent2, stroke: INK, 'stroke-width': 2.6}),
    rings,
    noTitle ? null : o.showText ? textBlock(titleFit, {x: x + w / 2, y: y + (headH - titleFit.height) / 2, anchor: 'middle', fill: '#fff', name: `${prefix}-title`}) : bars(x + w * 0.2, y + headH / 2 - ts * 0.2, w * 0.6, 1, ts, {paperLine: 'rgba(255,255,255,0.55)'}, `${prefix}-hb`, ctx.rng),
  );
  // the folded pack under the header's left end (visible while cells are closed)
  const pack = g({name: `${prefix}-pack`},
    ...[3, 2, 1, 0].map(k => h('path', {d: roundRectPath(x + k * 4, top + k * 3, Math.min(cw, w) * 0.28, cellH * 0.9, 6), fill: k ? th.paperShade : th.paper, stroke: INK, 'stroke-width': 2})),
  );
  const cells = days.map((d, i) => {
    const c = cellBox(i), s = slotBox(i);
    return g({name: `${prefix}-cell${i}`, transform: scaleAbout(c.x, c.y, 0.001, 1)},
      h('rect', {x: r(c.x), y: r(c.y), width: r(c.w), height: r(c.h), fill: th.paper, stroke: INK, 'stroke-width': 2.2}),
      ...Array.from({length: nRows}, (_, k) => { const sk = slotBox(i, k); return h('path', {name: k ? `${prefix}-slot${i}-${k}` : `${prefix}-slot${i}`, d: roundRectPath(sk.x, sk.y, sk.w, sk.h, 6), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '6 6'}); }),
      g({name: `${prefix}-ct${i}`, opacity: 0},
        o.showText ? textBlock(dayFits[i], inl ? {x: c.x + ts * 0.4, y: c.y + ts * 0.4 + (Math.max(slotsH, dayH) - dayFits[i].height) / 2, fill: INK, name: `${prefix}-day${i}`} : {x: c.x + c.w / 2, y: c.y + ts * 0.45, anchor: 'middle', fill: INK, name: `${prefix}-day${i}`}) : h('rect', {'data-bar': 1, x: r(c.x + c.w * 0.25), y: r(c.y + ts * 0.6), width: r(c.w * 0.5), height: r(ts * 0.4), rx: 3, fill: th.paperLine})),
    );
  });
  const glyph = (cx, cy, sw, sh) => g(null,
    h('rect', {x: r(cx - sw / 2 + 3), y: r(cy - sh / 2 + 4), width: r(sw), height: r(sh), rx: 3, fill: th.shadow}),
    h('rect', {x: r(cx - sw / 2), y: r(cy - sh / 2), width: r(sw), height: r(sh), rx: 3, fill: '#f3ecdc', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(cx - sw * 0.34)} ${r(cy - sh * 0.12)}h${r(sw * 0.62)}M${r(cx - sw * 0.34)} ${r(cy + sh * 0.18)}h${r(sw * 0.4)}`, stroke: th.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(cx - sw / 2)} ${r(cy - sh / 2)}h${r(sw)}`, stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '4 4'}),
  );
  const markNode = idx => {
    const s = slotBox(Math.max(0, Math.min(n - 1, idx)));
    return g({name: `${prefix}-mark`, opacity: 0}, glyph(s.x + s.w / 2, s.y + s.h / 2, Math.min(s.w * 0.62, ts * 3), s.h * 0.66));
  };
  /**
   * @param {number} open  0 (folded) → 1 (every cell open)
   * @param {number} [markP] 0..1 drop of the glyph into the marked slot
   * @param {number} [markIdx]
   */
  function frame(open, markP = 0, markIdx = 0) {
    const out = {};
    const each = 1 / (n * 0.7 + 0.3);
    let allOpen = true;
    days.forEach((d, i) => {
      const c = cellBox(i);
      const p = ease.outCubic(seg(open, i * each * 0.7, i * each * 0.7 + each * 0.3 + 1e-6));
      if (p < 1) allOpen = false;
      out[`${prefix}-cell${i}`] = {transform: scaleAbout(c.x, c.y, Math.max(0.001, p), 1), opacity: p > 0 ? 1 : 0};
      // (the day label fades in only once its cell is fully open: no text while the cell is still scaled)
      const t0 = i * each * 0.7 + each * 0.3 + 1e-6;
      out[`${prefix}-ct${i}`] = {opacity: p < 1 ? 0 : r(seg(open, t0, t0 + each * 0.25), 3)};
    });
    out[`${prefix}-pack`] = {opacity: r(1 - seg(open, 0, 0.35), 3)};
    const s = slotBox(Math.max(0, Math.min(n - 1, markIdx)));
    const mp = ease.outCubic(markP);
    out[`${prefix}-mark`] = {opacity: r(Math.min(1, markP * 3), 3), transform: T(0, (1 - mp) * -s.h * 0.9)};
    return {nodes: out, allOpen};
  }
  return {
    header, pack, cells, markNode, frame, cellBox, slotBox, titleFit, dayFits,
    node: idx => g({name: prefix}, header, pack, cells, markNode(idx)),
    box: {x, y: y - ts * 0.7, w, h: H + ts * 0.7},
    h: H, headH, cellH, cols, rows,
  };
}
