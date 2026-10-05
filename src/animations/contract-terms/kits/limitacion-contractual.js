/**
 * Kit for the "Limitación contractual" motif (contract-terms-06, LAW-0501..0504). Original art, contour geometry and
 * small pure helpers only: every entry owns its own staging, layout, timeline and semantics
 *  - story (0501): a reading desk seen from above — one hand reads the supplied clause under a round reading glass,
 *    the other draws an ink contour around the category tiles;
 *  - mechanism (0502): an exploded stack of three transparent sheets (capas) — clause text, contour stencil, category
 *    tiles — that separate along a diagonal rail; plain plumb lines tie each clause line to its tile;
 *  - contrast (0503): two identical peg trays where a cord is laid round brass pegs; one supplied status differs;
 *  - inspect (0504): the delimited sheet; a lens isolates one tile and one supplied status is substituted.
 *
 * Objects: the CONTRACT (a clipped sheet with layers behind: head band, clause heading, supplied clause lines), the
 * CATEGORY TILES (index cards with a tab and a number disc, label as supplied), the CONTOUR (one closed line: it encloses
 * every "included" tile and forms a bay — open to the right — around every tile whose supplied status is "exclusion to
 * be reviewed", so that tile lies outside the line), the READING GLASS (lupa) and the MARKER.
 * Legal content (very high risk: limitation of liability): no doctrine on whether a limitation or exclusion is
 * enforceable, valid or effective, no caps or amounts, no outcome. "Exclusion to be reviewed" is neutral: the tile stays
 * fully drawn at equal weight (◆ vs ●, same area, colour and stroke); nothing is crossed out, hatched or coloured red.
 * @module animations/contract-terms/kits/limitacion-contractual
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, int, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {fitG, txt, chipG, unitPx, localizeScene} from './terminacion-comunicaciones.js';

export {fitG, txt, chipG, unitPx, localizeScene};
export const INK = '#1f2328';
export const STATUSES = ['included', 'review'];

/* ------------------------------------------------------------------------ */
/* Fields, defaults, strings                                                 */
/* ------------------------------------------------------------------------ */

export const contractField = obj('The contract sheet', {
  reference: str('Reference printed on the contract (fictional)', 32),
  title: str('Heading of the contract, as supplied (generic, e.g. "Contract (fictional)")', 70),
}, ['reference', 'title']);
export const clauseTitleField = str('Heading of the clause, as supplied (e.g. "Limitation clause")', 60);
export const clausesField = list('Lines of the supplied clause text (generic, fictional placeholders such as "Clause 9.1 (supplied text)"; never real contract text, never an amount)', str('Clause line, as supplied', 70), 1, 3);
export const categoriesField = list('Categories of liability named by the supplied text, top to bottom. Each has a supplied status: "included" (inside the contour) or "review" (an exclusion to be reviewed: the contour forms a bay around it). Nothing is inferred from either status', obj('A category tile', {
  label: str('Label of the category, as supplied (generic, fictional)', 60),
  status: oneOf('Supplied status: included or review (exclusion to be reviewed)', STATUSES),
  clause: int('The supplied clause line this category is read from (1 = first; clamped to the list)', 1, 3),
}, ['label', 'status', 'clause']), 2, 4);
export const statusLabelsField = obj('Wording of the two supplied statuses (equal weight: ● included, ◆ to be reviewed)', {
  included: str('Status "included", as supplied', 60),
  review: str('Status "exclusion to be reviewed", as supplied', 60),
}, ['included', 'review']);
export const sheetLabelField = str('Heading of the category sheet (e.g. "Liability categories (supplied)")', 60);

export const CONTENT = {
  contract: {reference: 'CT-246', title: 'Contract (fictional)'},
  clauseTitle: 'Limitation clause',
  clauses: ['Clause 9.1 (supplied text)', 'Clause 9.2 (supplied text)'],
  sheetLabel: 'Liability categories (supplied)',
  categories: [
    {label: 'Category 1 (supplied)', status: 'included', clause: 1},
    {label: 'Category 2 (supplied)', status: 'review', clause: 2},
    {label: 'Category 3 (supplied)', status: 'included', clause: 1},
  ],
  statusLabels: {included: 'Category included (as supplied)', review: 'Exclusion to be reviewed (as supplied)'},
};
export const CONTENT_ES = {
  contract: {reference: 'CT-246', title: 'Contrato (ficticio)'},
  clauseTitle: 'Cláusula de limitación',
  clauses: ['Cláusula 9.1 (texto aportado)', 'Cláusula 9.2 (texto aportado)'],
  sheetLabel: 'Categorías de responsabilidad (aportadas)',
  categories: [
    {label: 'Categoría 1 (aportada)', status: 'included', clause: 1},
    {label: 'Categoría 2 (aportada)', status: 'review', clause: 2},
    {label: 'Categoría 3 (aportada)', status: 'included', clause: 1},
  ],
  statusLabels: {included: 'Categoría incluida (según lo aportado)', review: 'Exclusión por revisar (según lo aportado)'},
};

export const KIT_STRINGS = {
  en: {
    key: 'As supplied · no conclusion drawn',
    closed: 'Contour drawn as supplied',
    partial: 'Contour partly drawn (as supplied)',
    was: 'was',
  },
  es: {
    key: 'Según lo aportado · sin conclusión',
    closed: 'Contorno trazado según lo aportado',
    partial: 'Contorno trazado en parte (según lo aportado)',
    was: 'antes',
  },
};

export const clauseOf = (p, c) => clamp(c.clause, 1, p.clauses.length) - 1;
const longest = arr => arr.reduce((a, b) => (b.length > a.length ? b : a), '');
/** The longest status wording (layouts reserve room for either status). */
export const worstStatus = p => longest([p.statusLabels.included, p.statusLabels.review]);

/* ------------------------------------------------------------------------ */
/* Glyphs and art                                                            */
/* ------------------------------------------------------------------------ */

/** Status glyph: ● included, ◆ to be reviewed — same area, fill and stroke. */
export function statusGlyph(ctx, status, x, y, R, o = {}) {
  const fill = o.fill ?? ctx.theme.accent2;
  if (status === 'included') return h('circle', {name: o.name, cx: r(x), cy: r(y), r: r(R), fill, stroke: INK, 'stroke-width': 2, opacity: o.opacity});
  const s = R * Math.sqrt(Math.PI / 2);
  return h('path', {name: o.name, d: `M${r(x)} ${r(y - s)}L${r(x + s)} ${r(y)}L${r(x)} ${r(y + s)}L${r(x - s)} ${r(y)}Z`, fill, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', opacity: o.opacity});
}

/**
 * The contract: a sheet held by a binder clip, two sheets behind it (layers), a head band, the clause heading and the
 * supplied clause lines (each in its own named row group, with a highlighter band `${prefix}hl${i}` hidden at rest).
 * Local origin = sheet top-left.
 * @param {any} ctx
 * @param {{prefix?:string, w:number, h:number, head:any, headH:number, title:any, titleY:number, rows:Array<{y:number,h:number,fit:any}>, padX:number, showText:boolean, named?:boolean}} o
 */
export function contractDoc(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const P = o.named ? (o.prefix ?? '') : null;
  const nm = k => (P === null ? undefined : `${P}${k}`);
  const parts = [
    h('rect', {x: 10, y: 14, width: w, height: hh, rx: 8, fill: th.shadow}),
    h('rect', {x: 14, y: 8, width: w - 6, height: hh, rx: 8, fill: '#ece5d6', stroke: INK, 'stroke-width': 2, transform: `rotate(2.2 ${r(w / 2)} ${r(hh / 2)})`}),
    h('rect', {x: -6, y: 6, width: w - 4, height: hh, rx: 8, fill: '#f1ebdd', stroke: INK, 'stroke-width': 2, transform: `rotate(-1.6 ${r(w / 2)} ${r(hh / 2)})`}),
    h('rect', {x: 0, y: 0, width: w, height: hh, rx: 8, fill: '#fdfbf5', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: `M${r(o.padX - 16)} ${r(o.headH + 8)}V${r(hh - 18)}`, stroke: '#e3a9a0', 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(0, 0, w, o.headH, 8), fill: th.accent3Soft}),
    h('path', {d: `M0 ${r(o.headH)}H${r(w)}`, stroke: INK, 'stroke-width': 2}),
  ];
  if (o.showText) parts.push(txt(o.head, {x: o.padX - 6, y: (o.headH - o.head.height) / 2 + 6, fill: INK}));
  else parts.push(h('path', {d: `M${r(o.padX)} ${r(o.headH / 2 + 6)}h${r(Math.min(w * 0.5, 320))}`, stroke: shade(th.accent3Soft, -0.3), 'stroke-width': 10, 'stroke-linecap': 'round'}));
  if (o.showText) parts.push(txt(o.title, {x: o.padX, y: o.titleY, fill: INK}));
  else parts.push(h('path', {d: `M${r(o.padX)} ${r(o.titleY + o.title.size * 0.5)}h${r(Math.min(w * 0.45, 260))}`, stroke: '#c9bea8', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  o.rows.forEach((row, i) => {
    const lineW = w - o.padX - 24;
    parts.push(g({name: nm(`row${i}`)},
      h('rect', {name: nm(`hl${i}`), x: r(o.padX - 8), y: r(row.y), width: r(lineW + 12), height: r(row.h), rx: 6, fill: '#fbe7a6', opacity: P === null ? 1 : 0}),
      h('rect', {x: r(o.padX - 8), y: r(row.y), width: r(lineW + 12), height: r(row.h), rx: 6, fill: 'none', stroke: '#d8ceb9', 'stroke-width': 1.6}),
      o.showText
        ? txt(row.fit, {x: o.padX, y: row.y + (row.h - row.fit.height) / 2, fill: INK})
        : h('path', {d: `M${r(o.padX)} ${r(row.y + row.h / 2)}h${r(Math.min(lineW - 20, 340))}`, stroke: '#cfc5b0', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    ));
  });
  // filler lines below the rows (simulated text, decorative)
  const last = o.rows[o.rows.length - 1];
  for (let y = last.y + last.h + 26; y < hh - 26; y += 26) parts.push(h('path', {d: `M${r(o.padX)} ${r(y)}h${r((w - o.padX - 40) * (0.55 + 0.4 * ((y * 7) % 10) / 10))}`, stroke: '#e7e0d0', 'stroke-width': 5, 'stroke-linecap': 'round'}));
  // binder clip at the top centre
  const cx = w / 2;
  parts.push(g(null,
    h('path', {d: `M${r(cx - 46)} -14H${r(cx + 46)}L${r(cx + 38)} 22H${r(cx - 38)}Z`, fill: '#3b4148', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(cx - 30)} -14C${r(cx - 34)} -40 ${r(cx - 12)} -46 ${r(cx - 8)} -24M${r(cx + 30)} -14C${r(cx + 34)} -40 ${r(cx + 12)} -46 ${r(cx + 8)} -24`, fill: 'none', stroke: '#9aa3ad', 'stroke-width': 4, 'stroke-linecap': 'round'}),
    h('rect', {x: r(cx - 30), y: -8, width: 60, height: 6, rx: 3, fill: '#5b636c'}),
  ));
  return g({name: P === null ? undefined : `${P}doc`}, parts);
}

/**
 * A category tile (index card with a tab, a number disc and the supplied label). Local origin = card top-left.
 * The optional status glyph sits at the right end, in its own group `${name}-st` (hidden until the entry shows it).
 * @param {any} ctx
 * @param {{name?:string, w:number, h:number, n:number, fit:any, showText:boolean, status?:string, glyphR?:number, stName?:string, stOpacity?:number}} o
 */
export function tileArt(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const tabW = Math.min(110, w * 0.3), tabH = Math.min(22, hh * 0.18);
  const disc = Math.min(hh * 0.3, 30);
  const gR = o.glyphR ?? Math.min(15, hh * 0.16);
  const textX = 22 + disc * 2 + 16;
  const parts = [
    h('path', {d: roundRectPath(6, 8, w, hh, 12), fill: th.shadow}),
    h('path', {d: `M14 0Q14 ${r(-tabH)} ${r(28)} ${r(-tabH)}H${r(tabW - 14)}Q${r(tabW)} ${r(-tabH)} ${r(tabW)} 0Z`, fill: th.accent3Soft, stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
    h('circle', {cx: r(22 + disc), cy: r(hh / 2), r: r(disc), fill: th.accent3, stroke: INK, 'stroke-width': 2}),
  ];
  // number pips instead of a digit (labels-hidden safe): n small dots on the disc
  for (let k = 0; k < o.n; k++) {
    const a = (k / o.n) * Math.PI * 2 - Math.PI / 2;
    const rr = o.n === 1 ? 0 : disc * 0.42;
    parts.push(h('circle', {cx: r(22 + disc + Math.cos(a) * rr), cy: r(hh / 2 + Math.sin(a) * rr), r: r(disc * 0.2), fill: INK}));
  }
  if (o.showText) { if (o.fit) parts.push(txt(o.fit, {x: textX, y: (hh - o.fit.height) / 2, fill: INK})); } else parts.push(h('path', {d: `M${r(textX)} ${r(hh / 2)}h${r(Math.max(20, w - textX - gR * 2 - 40))}`, stroke: '#d6cfc0', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  if (o.status) parts.push(g({name: o.stName, opacity: o.stOpacity}, statusGlyph(ctx, o.status, w - 16 - gR, hh / 2, gR)));
  return g({name: o.name}, parts.filter(Boolean));
}
/** Width the tile keeps free at the right for its status glyph. */
export const tileGlyphRoom = hh => Math.min(15, hh * 0.16) * 2 + 26;
export const tileTextX = hh => 22 + Math.min(hh * 0.3, 30) * 2 + 16;

/* ------------------------------------------------------------------------ */
/* The contour                                                               */
/* ------------------------------------------------------------------------ */

/**
 * The contour around a column of tiles. The region is the column box; for each tile whose status is "review" the
 * right side steps in to `neckX` over that tile's band, forming a bay open to the right (the tile lies outside).
 * Drawing starts at the bottom-left corner and runs up the left side, then clockwise.
 * @param {{x:number,y:number,w:number,h:number}} C  column box (contour sits on its edges)
 * @param {Array<{y:number,h:number}>} rows  tile rows (y top, h height), top to bottom, inside C
 * @param {string[]} statuses
 * @param {number} neckX  x of the neck's right edge (left of every tile)
 * @param {number} [rad]
 */
export function contourGeom(C, rows, statuses, neckX, rad = 18) {
  const R = C.x + C.w, B = C.y + C.h;
  const xs = statuses.map(s => (s === 'review' ? neckX : R));
  const cuts = [];
  for (let i = 0; i < rows.length - 1; i++) cuts.push((rows[i].y + rows[i].h + rows[i + 1].y) / 2);
  const P = [{x: C.x, y: B}, {x: C.x, y: C.y}, {x: xs[0], y: C.y}];
  for (let i = 0; i < rows.length - 1; i++) {
    if (xs[i] !== xs[i + 1]) { P.push({x: xs[i], y: cuts[i]}); P.push({x: xs[i + 1], y: cuts[i]}); }
  }
  P.push({x: xs[xs.length - 1], y: B});
  return roundedLoop(P, rad);
}

/** A closed polygon with rounded corners, sampled densely; returns {d, len, at(q), pts}. */
export function roundedLoop(P, rad) {
  const n = P.length;
  const pts = [];
  const step = 7;
  const corner = i => {
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, l1 / 2, l2 / 2);
    const p1 = {x: b.x + ((a.x - b.x) / l1) * rr, y: b.y + ((a.y - b.y) / l1) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / l2) * rr, y: b.y + ((c.y - b.y) / l2) * rr};
    return {p1, b, p2};
  };
  const cs = P.map((_, i) => corner(i));
  const pushLine = (a, b) => {
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const k = Math.max(1, Math.ceil(L / step));
    for (let j = 1; j <= k; j++) pts.push({x: a.x + ((b.x - a.x) * j) / k, y: a.y + ((b.y - a.y) * j) / k});
  };
  const pushQuad = (p1, b, p2) => {
    for (let j = 1; j <= 8; j++) { const t = j / 8; pts.push({x: (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * b.x + t * t * p2.x, y: (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * b.y + t * t * p2.y}); }
  };
  // start at the midpoint of the first edge's far half: begin just after corner 0
  pts.push(cs[0].p2);
  for (let i = 1; i <= n; i++) {
    const c = cs[i % n];
    pushLine(pts[pts.length - 1], c.p1);
    pushQuad(c.p1, c.b, c.p2);
  }
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const len = acc[acc.length - 1];
  const d = `M${pts.map(p => `${r(p.x, 1)} ${r(p.y, 1)}`).join('L')}`;
  const at = q => {
    const s = clamp(q) * len;
    let lo = 0, hi = acc.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acc[m] < s) lo = m; else hi = m; }
    const t = (s - acc[lo]) / Math.max(1e-6, acc[hi] - acc[lo]);
    const a = pts[lo], b = pts[hi];
    return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x)};
  };
  return {d, len, at, pts};
}

/** A drawable contour: white halo + ink line, both drawn on with stroke-dashoffset. */
export function contourNode(ctx, name, cg, o = {}) {
  const color = o.color ?? '#23466b';
  const dash = `${r(cg.len + 2)} ${r(cg.len + 20)}`;
  return g({name},
    h('path', {name: `${name}-halo`, d: cg.d, fill: 'none', stroke: '#ffffff', 'stroke-width': (o.width ?? 7) + 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85, 'stroke-dasharray': dash, 'stroke-dashoffset': r(o.drawn ? 0 : cg.len + 2)}),
    h('path', {name: `${name}-line`, d: cg.d, fill: 'none', stroke: color, 'stroke-width': o.width ?? 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dash, 'stroke-dashoffset': r(o.drawn ? 0 : cg.len + 2)}),
  );
}
/** Frame record for a contour drawn to q. */
export function contourFrame(name, cg, q) {
  const off = r((cg.len + 2) * (1 - clamp(q)));
  return {[`${name}-halo`]: {'stroke-dashoffset': off}, [`${name}-line`]: {'stroke-dashoffset': off}};
}

/* ------------------------------------------------------------------------ */
/* Props                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * Round reading glass seen from above. Origin = grip centre; the handle runs along +x to the ring centred at hl + R.
 * @param {any} ctx
 * @param {{name:string, R:number, hl:number}} o
 */
export function readingGlass(ctx, o) {
  const {R, hl} = o;
  const cx = hl + R;
  return g({name: o.name},
    h('ellipse', {cx: r(cx + 8), cy: 12, rx: r(R + 6), ry: r(R + 6), fill: INK, opacity: 0.12}),
    h('path', {d: `M${r(-R * 0.1)} ${r(-R * 0.17)}H${r(hl - R * 0.1)}V${r(R * 0.17)}H${r(-R * 0.1)}Q${r(-R * 0.3)} 0 ${r(-R * 0.1)} ${r(-R * 0.17)}Z`, fill: '#2f6b5e', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(R * 0.2)} ${r(-R * 0.17)}V${r(R * 0.17)}M${r(R * 0.45)} ${r(-R * 0.17)}V${r(R * 0.17)}M${r(R * 0.7)} ${r(-R * 0.17)}V${r(R * 0.17)}`, stroke: '#20493f', 'stroke-width': 2}),
    h('rect', {x: r(hl - R * 0.18), y: r(-R * 0.22), width: r(R * 0.36), height: r(R * 0.44), rx: 4, fill: '#c9a24a', stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(cx), cy: 0, r: r(R + R * 0.12), fill: 'none', stroke: INK, 'stroke-width': r(R * 0.24 + 3)}),
    h('circle', {cx: r(cx), cy: 0, r: r(R + R * 0.12), fill: 'none', stroke: '#c9a24a', 'stroke-width': r(R * 0.2)}),
    h('path', {d: `M${r(cx - R * 0.62)} ${r(-R * 0.2)}A${r(R * 0.66)} ${r(R * 0.66)} 0 0 1 ${r(cx - R * 0.15)} ${r(-R * 0.62)}`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9}),
  );
}

/**
 * Felt-tip marker seen from above. Origin = the tip; the body runs along +x (length len, width w).
 * @param {any} ctx
 * @param {{name:string, len:number, w:number, color?:string}} o
 */
export function markerPen(ctx, o) {
  const {len, w} = o;
  const col = o.color ?? '#23466b';
  return g({name: o.name},
    h('rect', {x: 10, y: r(-w / 2 + 9), width: r(len), height: r(w), rx: r(w / 2), fill: INK, opacity: 0.14}),
    h('path', {d: `M0 0L${r(w * 0.7)} ${r(-w * 0.22)}V${r(w * 0.22)}Z`, fill: col, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w * 0.7)} ${r(-w * 0.34)}L${r(w * 1.5)} ${r(-w / 2)}V${r(w / 2)}L${r(w * 0.7)} ${r(w * 0.34)}Z`, fill: '#d9dde2', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(w * 1.5), y: r(-w / 2), width: r(len - w * 1.5), height: r(w), rx: r(w * 0.3), fill: '#f4f4f1', stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(len - w * 1.6), y: r(-w / 2), width: r(w * 1.6), height: r(w), rx: r(w * 0.3), fill: col, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(w * 2.2), y: r(-w * 0.18), width: r(len * 0.35), height: r(w * 0.36), rx: 3, fill: col, opacity: 0.85}),
  );
}

/** Little brass peg seen from above (contrast trays). */
export function brassPeg(x, y, R = 9) {
  return g(null,
    h('circle', {cx: r(x + 2), cy: r(y + 3), r: R + 2, fill: INK, opacity: 0.18}),
    h('circle', {cx: r(x), cy: r(y), r: R, fill: '#d2a64b', stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(x - R * 0.3), cy: r(y - R * 0.3), r: R * 0.32, fill: '#f5e1a4'}),
  );
}

/** Darker shade of a hex colour (outline of a tinted object). */
export const deeper = c => shade(c, -0.3);
export {T};
