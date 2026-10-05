/**
 * Kit for the "Ley y foro pactados" motif (contract-terms-08, LAW-0509..0512). Original art and small pure helpers
 * only: every entry owns its own staging, layout, timeline and semantics.
 *  - story (0509): the contract sheet with two separate clause blocks; an index tab slides out of each block carrying
 *    a compass dial; after a loupe passes over the clause, its needle swings to its own destination plaque and a sight
 *    line is drawn to it (law clause → law plaque, forum clause → forum plaque);
 *  - mechanism (0510): two independent concentric dials round the contract hub (inner ring = choice-of-law clause,
 *    outer ring = choice-of-forum clause, a visible gap between them); each ring turns its own tooth to its plaque,
 *    plain radial links are drawn and a tracer runs each route in turn;
 *  - contrast (0511): two identical boards (two plaques on top, the contract card with two clause posts below); one
 *    fact differs — which clause is examined: in A the law clause's signpost turns to its plaque, in B the forum
 *    clause's; the other signpost stays at rest in each scene;
 *  - inspect (0512): the pointed contract (story's end state); a lens isolates one destination plaque and its supplied
 *    name is substituted; the other clause and plaque stay untouched.
 *
 * Objects: the CONTRACT (sheet with a head band and two clause blocks, each with its glyph disc), the CLAUSE TABS / DIALS
 * (one per clause, never joined), the DESTINATION PLAQUES (law: a rounded tablet with an open-book emblem; forum: a
 * pedimented plaque with a hall emblem — equal size and weight), the LOUPE (lupa) and, in the mechanism, the RINGS
 * (capas). Legal content: no conflict-of-laws or jurisdiction doctrine; fictional labels only ("Law X (fictional)",
 * "Forum Y (fictional)"); the two clauses are separate and neither decides the other; no validity, effect or outcome.
 * @module animations/contract-terms/kits/ley-y-foro
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, obj} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {fitG, txt, chipG, unitPx, localizeScene} from './terminacion-comunicaciones.js';

export {fitG, txt, chipG, unitPx, localizeScene, T};
export const INK = '#1f2328';
export const KINDS = ['law', 'forum'];

/* ------------------------------------------------------------------------ */
/* Fields, defaults, strings                                                 */
/* ------------------------------------------------------------------------ */

export const contractField = obj('The contract sheet', {
  reference: str('Reference printed on the contract (fictional)', 32),
  title: str('Heading of the contract, as supplied (generic, e.g. "Contract (fictional)")', 70),
}, ['reference', 'title']);
export const clausesField = obj('The two separate clauses, as supplied (generic headings; never real contract text)', {
  law: str('Heading of the choice-of-law clause, as supplied (e.g. "Clause 14 · Choice of law")', 64),
  forum: str('Heading of the choice-of-forum clause, as supplied (e.g. "Clause 15 · Choice of forum")', 64),
}, ['law', 'forum']);
export const destinationsField = obj('Labels of the two destination plaques (objectLabels; fictional, never a real country, system or court)', {
  law: str('Plaque the choice-of-law clause points to (e.g. "Law X (fictional)")', 56),
  forum: str('Plaque the choice-of-forum clause points to (e.g. "Forum Y (fictional)")', 56),
}, ['law', 'forum']);

export const CONTENT = {
  contract: {reference: 'CT-508', title: 'Contract (fictional)'},
  clauses: {law: 'Clause 14 · Choice of law', forum: 'Clause 15 · Choice of forum'},
  destinations: {law: 'Law X (fictional)', forum: 'Forum Y (fictional)'},
};
export const CONTENT_ES = {
  contract: {reference: 'CT-508', title: 'Contrato (ficticio)'},
  clauses: {law: 'Cláusula 14 · Elección de ley', forum: 'Cláusula 15 · Elección de foro'},
  destinations: {law: 'Ley X (ficticia)', forum: 'Foro Y (ficticio)'},
};
export const KIT_STRINGS = {
  en: {
    key: 'As supplied · no conclusion drawn',
    separate: 'Two separate clauses · each points to its own choice',
  },
  es: {
    key: 'Según lo aportado · sin conclusión',
    separate: 'Dos cláusulas separadas · cada una apunta a su elección',
  },
};

/** Lane colour of a clause kind (law = accent2, forum = accent3; equal weight). */
export const laneColor = (ctx, kind) => (kind === 'law' ? ctx.theme.accent2 : ctx.theme.accent3);
export const laneSoft = (ctx, kind) => (kind === 'law' ? ctx.theme.accent2Soft : ctx.theme.accent3Soft);
export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export const longest = arr => arr.reduce((a, b) => (String(b).length > String(a).length ? b : a), '');

/* ------------------------------------------------------------------------ */
/* Glyphs (text-free identifiers)                                            */
/* ------------------------------------------------------------------------ */

/** Open-book glyph (choice of law), centred at (x, y), half-size s. */
export function bookGlyph(x, y, s, col = INK, sw = 2.4) {
  return h('path', {
    d: `M${r(x)} ${r(y - s * 0.55)}Q${r(x - s * 0.5)} ${r(y - s * 0.85)} ${r(x - s)} ${r(y - s * 0.6)}V${r(y + s * 0.7)}Q${r(x - s * 0.5)} ${r(y + s * 0.45)} ${r(x)} ${r(y + s * 0.75)}Q${r(x + s * 0.5)} ${r(y + s * 0.45)} ${r(x + s)} ${r(y + s * 0.7)}V${r(y - s * 0.6)}Q${r(x + s * 0.5)} ${r(y - s * 0.85)} ${r(x)} ${r(y - s * 0.55)}ZM${r(x)} ${r(y - s * 0.55)}V${r(y + s * 0.75)}`,
    fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round',
  });
}
/** Hall glyph (chosen forum): pediment, three columns, base. */
export function hallGlyph(x, y, s, col = INK, sw = 2.4) {
  const c = [-0.55, 0, 0.55].map(k => `M${r(x + s * k)} ${r(y - s * 0.25)}V${r(y + s * 0.6)}`).join('');
  return h('path', {
    d: `M${r(x - s)} ${r(y - s * 0.3)}L${r(x)} ${r(y - s * 0.9)}L${r(x + s)} ${r(y - s * 0.3)}Z${c}M${r(x - s)} ${r(y + s * 0.75)}H${r(x + s)}`,
    fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
  });
}
export const glyphOf = (kind, x, y, s, col, sw) => (kind === 'law' ? bookGlyph(x, y, s, col, sw) : hallGlyph(x, y, s, col, sw));

/** Glyph disc: lane-coloured disc with a white glyph. */
export function glyphDisc(ctx, kind, x, y, R) {
  return g(null,
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: laneColor(ctx, kind), stroke: INK, 'stroke-width': 2.2}),
    glyphOf(kind, x, y, R * 0.55, '#ffffff', Math.max(2, R * 0.11)),
  );
}

/* ------------------------------------------------------------------------ */
/* Art                                                                       */
/* ------------------------------------------------------------------------ */

/**
 * The contract sheet: shadow, a sheet behind, folded top-right corner, head band with the heading, and the two clause
 * blocks (each a framed band with its glyph disc, the clause heading and simulated lines). Local origin = top-left.
 * Block highlight rects are named `${prefix}hl-${kind}` (opacity 0 at rest) when `prefix` is given.
 * @param {any} ctx
 * @param {{w:number, h:number, head:any, headH:number, blocks:Array<{kind:string, x?:number, y:number, w?:number, h:number, fit:any}>, showText:boolean, prefix?:string, discR?:number}} o
 */
export function contractSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const fold = Math.min(46, w * 0.09);
  const discR = o.discR ?? 22;
  const parts = [
    h('rect', {x: 10, y: 14, width: w, height: hh, rx: 10, fill: th.shadow}),
    h('rect', {x: 9, y: 7, width: w - 4, height: hh, rx: 10, fill: '#ece5d6', stroke: INK, 'stroke-width': 2, transform: `rotate(1.4 ${r(w / 2)} ${r(hh / 2)})`}),
    h('path', {d: `M10 0H${r(w - fold)}L${r(w)} ${r(fold)}V${r(hh - 10)}Q${r(w)} ${r(hh)} ${r(w - 10)} ${r(hh)}H10Q0 ${r(hh)} 0 ${r(hh - 10)}V10Q0 0 10 0Z`, fill: '#fdfbf5', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w - fold)} 0V${r(fold - 8)}Q${r(w - fold)} ${r(fold)} ${r(w - fold + 8)} ${r(fold)}H${r(w)}`, fill: '#e9e0cc', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M2 ${r(o.headH)}H${r(w - 2)}`, stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M10 2H${r(w - fold - 2)}V${r(o.headH - 1)}H2V10Q2 2 10 2Z`, fill: th.accent4Soft, opacity: 0.9}),
  ];
  if (o.showText) parts.push(txt(o.head, {x: 24, y: (o.headH - o.head.height) / 2, fill: INK}));
  else parts.push(h('path', {d: `M24 ${r(o.headH / 2)}h${r(Math.min(w * 0.5, 300))}`, stroke: shade(th.accent4Soft, -0.3), 'stroke-width': 11, 'stroke-linecap': 'round'}));
  for (const b of o.blocks) {
    const bx = b.x ?? 18, bw = b.w ?? w - 36;
    const textX = bx + 20 + discR * 2 + 14;
    const textW = bw - (textX - bx) - 16;
    const fillers = [];
    const fy0 = b.y + 18 + Math.max(discR * 2, b.fit.height) + 18;
    for (let y = fy0, k = 0; y < b.y + b.h - 14; y += 22, k++) fillers.push(`M${r(textX)} ${r(y)}h${r(textW * (0.92 - 0.22 * ((k * 3) % 4) / 3))}`);
    parts.push(g({name: o.prefix != null ? `${o.prefix}blk-${b.kind}` : undefined},
      o.prefix != null ? h('path', {name: `${o.prefix}hl-${b.kind}`, d: roundRectPath(bx - 6, b.y - 6, bw + 12, b.h + 12, 14), fill: laneSoft(ctx, b.kind), stroke: laneColor(ctx, b.kind), 'stroke-width': 3, opacity: 0}) : null,
      h('path', {d: roundRectPath(bx, b.y, bw, b.h, 10), fill: '#ffffff', stroke: '#cfc4ae', 'stroke-width': 2}),
      h('rect', {x: r(bx), y: r(b.y), width: 9, height: r(b.h), rx: 4, fill: laneColor(ctx, b.kind)}),
      glyphDisc(ctx, b.kind, bx + 20 + discR, b.y + 18 + discR, discR),
      o.showText
        ? txt(b.fit, {x: textX, y: b.y + 18 + Math.max(0, (discR * 2 - b.fit.height) / 2), fill: INK})
        : h('path', {d: `M${r(textX)} ${r(b.y + 18 + discR)}h${r(Math.min(textW, 260))}`, stroke: '#cdbfa6', 'stroke-width': 10, 'stroke-linecap': 'round'}),
      fillers.length ? h('path', {d: fillers.join(''), stroke: '#e6dfcf', 'stroke-width': 5, 'stroke-linecap': 'round'}) : null,
    ));
  }
  return g(null, parts);
}
/** Height a clause block needs for a fitted heading. */
export const blockHeight = (fit, discR = 22, fillerLines = 2) => 18 + Math.max(discR * 2, fit.height) + 18 + fillerLines * 22 + 4;

/**
 * Index tab sliding out of a clause block: a lane-coloured strip with a grip pattern. Drawn along +x from (0,0)
 * (length len, thickness t). Rotate the parent for other directions.
 */
export function clauseTab(ctx, kind, len, t) {
  const col = laneColor(ctx, kind);
  const ribs = [];
  for (let x = 18; x < len - t; x += 14) ribs.push(`M${r(x)} ${r(-t * 0.28)}V${r(t * 0.28)}`);
  return g(null,
    h('rect', {x: 6, y: r(-t / 2 + 8), width: r(len), height: r(t), rx: r(t * 0.35), fill: ctx.theme.shadow}),
    h('rect', {x: 0, y: r(-t / 2), width: r(len), height: r(t), rx: r(t * 0.35), fill: laneSoft(ctx, kind), stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: 0, y: r(-t / 2), width: r(len), height: r(t * 0.22), rx: r(t * 0.11), fill: col, opacity: 0.9}),
    ribs.length ? h('path', {d: ribs.join(''), stroke: shade(laneSoft(ctx, kind), -0.25), 'stroke-width': 2.4, 'stroke-linecap': 'round'}) : null,
  );
}

/**
 * Compass dial seen from above: brass bezel, face with ticks, the needle (group `${name}-needle`, drawn pointing +x,
 * rotate it in frame), pivot cap. Origin = dial centre.
 */
export function compassDial(ctx, kind, name, R) {
  const col = laneColor(ctx, kind);
  const ticks = [];
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2, l = k % 6 === 0 ? 0.2 : 0.1;
    ticks.push(`M${r(Math.cos(a) * R * 0.86)} ${r(Math.sin(a) * R * 0.86)}L${r(Math.cos(a) * R * (0.86 - l))} ${r(Math.sin(a) * R * (0.86 - l))}`);
  }
  const nl = R * 0.78, nw = R * 0.16;
  return g({name},
    h('circle', {cx: 5, cy: 8, r: r(R + 6), fill: ctx.theme.shadow}),
    h('circle', {cx: 0, cy: 0, r: r(R + 5), fill: '#c9a24a', stroke: INK, 'stroke-width': 2.6}),
    h('circle', {cx: 0, cy: 0, r: r(R - 2), fill: '#fbf8ef', stroke: INK, 'stroke-width': 2}),
    h('path', {d: ticks.join(''), stroke: '#8b8170', 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    glyphOf(kind, 0, R * 0.45, R * 0.2, shade(col, -0.1), 2),
    g({name: `${name}-needle`},
      h('path', {d: `M${r(nl)} 0L0 ${r(-nw)}L${r(-nl * 0.62)} 0L0 ${r(nw)}Z`, fill: '#ffffff', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(nl)} 0L0 ${r(-nw)}L0 ${r(nw)}Z`, fill: col, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    ),
    h('circle', {cx: 0, cy: 0, r: r(R * 0.12 + 2), fill: '#3b4148', stroke: INK, 'stroke-width': 1.6}),
  );
}

/**
 * Destination plaque: law = rounded tablet top, forum = pediment top; same body size, stroke and emblem disc.
 * Local origin = body top-left; the top ornament rises above y = 0 by `plaqueTop(w)`.
 * The label is drawn by the caller unless `fit` is given. `emblemName` names the emblem group (inspect swaps it).
 * @param {any} ctx
 * @param {{kind:string, w:number, h:number, fit?:any, showText:boolean, discR:number, stack?:boolean, textX?:number, name?:string, labelName?:string, band?:'plain'|'diagonal'}} o
 */
export function plaque(ctx, o) {
  const {w, h: hh, kind} = o;
  const col = laneColor(ctx, kind);
  const top = plaqueTop(w);
  const topPath = kind === 'law'
    ? `M8 0Q${r(w / 2)} ${r(-top * 1.9)} ${r(w - 8)} 0Z`
    : `M0 0L${r(w / 2)} ${r(-top)}L${r(w)} 0Z`;
  const R = o.discR;
  const cx = o.stack ? w / 2 : 18 + R, cy = o.stack ? 16 + R : hh / 2;
  const parts = [
    h('rect', {x: 8, y: r(-top + 12), width: r(w), height: r(hh + top), rx: 12, fill: ctx.theme.shadow}),
    h('path', {d: topPath, fill: laneSoft(ctx, kind), stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: '#fffdf7', stroke: INK, 'stroke-width': 2.8}),
    h('path', {d: roundRectPath(7, 7, w - 14, hh - 14, 8), fill: 'none', stroke: col, 'stroke-width': 2.4}),
    h('circle', {cx: r(w / 2), cy: r(-top * 0.42), r: 5, fill: '#9aa3ad', stroke: INK, 'stroke-width': 1.4}),
    glyphDisc(ctx, kind, cx, cy, R),
  ];
  if (o.band === 'diagonal') parts.push(h('path', {d: `M${r(cx - R * 0.7)} ${r(cy + R * 0.7)}L${r(cx + R * 0.7)} ${r(cy - R * 0.7)}`, stroke: '#ffffff', 'stroke-width': r(R * 0.16), 'stroke-linecap': 'round', opacity: 0.9}));
  if (o.fit && o.stack) {
    const ty = cy + R + 12;
    parts.push(o.showText ? txt(o.fit, {x: w / 2, y: ty, anchor: 'middle', fill: INK, name: o.labelName}) : h('path', {d: `M${r(w * 0.25)} ${r(ty + o.fit.size * 0.6)}H${r(w * 0.75)}`, stroke: '#d6cfc0', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  } else if (o.fit) {
    const tx = o.textX ?? cx + R + 14;
    parts.push(o.showText ? txt(o.fit, {x: tx, y: (hh - o.fit.height) / 2, fill: INK, name: o.labelName}) : h('path', {d: `M${r(tx)} ${r(hh / 2)}h${r(Math.max(30, Math.min(w - tx - 22, 180)))}`, stroke: '#d6cfc0', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  }
  return g({name: o.name}, parts);
}
export const plaqueTop = w => clamp(w * 0.12, 18, 34);
export const plaqueTextX = R => 18 + R * 2 + 14;
/** Body height of a stacked plaque (emblem above, label below). */
export const stackedPlaqueH = (R, fit) => 16 + R * 2 + 12 + fit.height + 22;

/** Straight sight line from a to b drawn on with stroke-dashoffset (halo + line + end ring). */
export function sightLine(ctx, name, a, b, color) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const dash = `${r(L + 2)} ${r(L + 20)}`;
  const d = `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`;
  return g({name},
    h('path', {name: `${name}-halo`, d, stroke: '#ffffff', 'stroke-width': 12, 'stroke-linecap': 'round', opacity: 0.85, 'stroke-dasharray': dash, 'stroke-dashoffset': r(L + 2)}),
    h('path', {name: `${name}-line`, d, stroke: color, 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-dasharray': dash, 'stroke-dashoffset': r(L + 2)}),
    h('circle', {name: `${name}-end`, cx: r(b.x), cy: r(b.y), r: 9, fill: '#ffffff', stroke: color, 'stroke-width': 4, opacity: 0}),
  );
}
export function sightFrame(name, a, b, q) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const off = r((L + 2) * (1 - clamp(q)));
  return {[`${name}-halo`]: {'stroke-dashoffset': off}, [`${name}-line`]: {'stroke-dashoffset': off}, [`${name}-end`]: {opacity: q >= 0.999 ? 1 : 0}};
}

/**
 * Loupe (lupa) seen from above: thick dark rim, tinted glass with a glint, a short faceted handle toward +x+y.
 * Origin = glass centre.
 */
export function loupe(ctx, name, R) {
  const a = Math.PI / 4;
  const hx = Math.cos(a), hy = Math.sin(a);
  const p0 = {x: hx * (R + 4), y: hy * (R + 4)}, p1 = {x: hx * (R * 2.1), y: hy * (R * 2.1)};
  return g({name},
    h('circle', {cx: 8, cy: 12, r: r(R + 8), fill: INK, opacity: 0.12}),
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}L${r(p1.x)} ${r(p1.y)}`, stroke: INK, 'stroke-width': r(R * 0.42 + 4), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}L${r(p1.x)} ${r(p1.y)}`, stroke: '#7b4b2a', 'stroke-width': r(R * 0.42), 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: 0, r: r(R), fill: '#dff0f5', opacity: 0.28}),
    h('circle', {cx: 0, cy: 0, r: r(R + R * 0.08), fill: 'none', stroke: INK, 'stroke-width': r(R * 0.2 + 3)}),
    h('circle', {cx: 0, cy: 0, r: r(R + R * 0.08), fill: 'none', stroke: '#4a5560', 'stroke-width': r(R * 0.16)}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.18)}A${r(R * 0.65)} ${r(R * 0.65)} 0 0 1 ${r(-R * 0.16)} ${r(-R * 0.62)}`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9}),
  );
}
/** Bounding box of the loupe centred at (x, y). */
export const loupeBox = (x, y, R) => ({x: x - R * 1.25, y: y - R * 1.25, w: R * 2.1 + R * 1.25 + 8, h: R * 2.1 + R * 1.25 + 8});

/** Letter badge (A / B) drawn as strokes so it carries no <text>. */
export function letterBadge(ctx, which, x, y, R) {
  const col = which === 'a' ? ctx.theme.accent2 : ctx.theme.accent3;
  const s = R * 0.55;
  const d = which === 'a'
    ? `M${r(x - s * 0.6)} ${r(y + s * 0.7)}L${r(x)} ${r(y - s * 0.75)}L${r(x + s * 0.6)} ${r(y + s * 0.7)}M${r(x - s * 0.33)} ${r(y + s * 0.15)}H${r(x + s * 0.33)}`
    : `M${r(x - s * 0.45)} ${r(y - s * 0.75)}V${r(y + s * 0.75)}H${r(x + s * 0.15)}Q${r(x + s * 0.6)} ${r(y + s * 0.75)} ${r(x + s * 0.6)} ${r(y + s * 0.38)}Q${r(x + s * 0.6)} ${r(y)} ${r(x + s * 0.1)} ${r(y)}H${r(x - s * 0.45)}M${r(x + s * 0.1)} ${r(y)}Q${r(x + s * 0.5)} ${r(y)} ${r(x + s * 0.5)} ${r(y - s * 0.38)}Q${r(x + s * 0.5)} ${r(y - s * 0.75)} ${r(x + s * 0.1)} ${r(y - s * 0.75)}H${r(x - s * 0.45)}`;
  return g(null,
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: col, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d, fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(3, R * 0.16)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
}

/** Shortest signed angle difference b − a in degrees, in (−180, 180]. */
export const angDiff = (a, b) => { let d = (b - a) % 360; if (d > 180) d -= 360; if (d <= -180) d += 360; return d; };
export const toDeg = (a, b) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
