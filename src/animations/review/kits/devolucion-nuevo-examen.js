/**
 * "Devolución para nuevo examen" kit (LAW-0349..0352, review-08): geometry, art and text helpers shared by the four
 * entries.
 *
 * The motif's objects (all original vector art, top-down):
 *  - CARPETA: the case folder holding the decision of the initial examination (RESOLUCIÓN, a placeholder: its title is
 *    supplied, the cover label carries filler bars only).
 *  - NOTAS DE REVISIÓN: a slip of 1–3 sticky notes (each with a neutral notched index pip); their texts are supplied.
 *  - RUTA: the supplied return route — a row (or column) of in-trays, one per supplied point, and the review desk mat
 *    where the folder starts; a lane with chevron arrows (FLECHAS) runs from the review desk past every tray.
 *  - FILTROS: a pair of filter doors (mesh bars) at every tray mouth. Only the doors of the CONFIGURED return point
 *    (`routes.returnTo`, as supplied) stand open — swung across the lane, they divert the folder into that tray. The
 *    doors show the supplied configuration only: no doctrine about where a case must go back to is drawn or implied.
 *  - CALENDARIO: a desk calendar, a fixture only (blank grid, no date marked, no time limit implied).
 * Nothing about the renewed examination's content or outcome is ever drawn: its sheet, where shown, stays blank.
 *
 * The kit owns geometry, art and text fitting only. Each entry owns its own composition, timeline and semantics.
 * Text fitting reuses the glue-aware wrap of the review-04 kit (nothing breaks mid-word).
 * @module animations/review/kits/devolucion-nuevo-examen
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {str, int, list, obj} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {fitG, textAt, indexPip, calendarNode, overlaps, R2, INK} from './limites-de-revision.js';

export {fitG, textAt, indexPip, calendarNode, overlaps, R2, INK};

/* ------------------------------------------------------------------ */
/* Fields, defaults, localisation                                      */
/* ------------------------------------------------------------------ */

/** Category fields shared by the four entries (brief: decisions, grounds, routes, outcomes). */
export const dnFields = {
  decisions: obj('The decision of the initial examination carried in the folder (fictional placeholder)', {
    title: str('Name of the decision (fictional, as supplied); shown in the legend, the folder label carries filler only', 70),
  }, ['title']),
  grounds: list('Review notes attached to the folder (supplied, fictional; each keyed by a notched index pip)', str('Text of the note (as supplied)', 80), 1, 3),
  routes: obj('The supplied return route: points in order, the desk the folder starts from and the configured return point', {
    stations: list('Points of the route, in order (fictional names, as supplied)', str('Name of the point', 48), 2, 3),
    origin: str('Name of the desk where the folder starts (fictional, as supplied)', 48),
    returnTo: int('Index in `stations` of the configured return point (only its filter doors stand open)', 0, 2),
  }, ['stations', 'origin', 'returnTo']),
  outcomes: obj('Descriptive state captions (never a result of the renewed examination)', {
    returned: str('Caption when the folder lies at the configured point', 90),
    renewed: str('Caption for the renewed examination (must not state an outcome)', 90),
  }, ['returned', 'renewed']),
  labels: obj('Editable captions', {
    route: str('Caption of the return route (keep "as supplied")', 90),
    point: str('Caption of the configured return point marker', 70),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['route', 'point', 'key']),
};

export const DN_EN = {
  decisions: {title: 'Decision of the initial examination (fictional)'},
  grounds: ['Note 1: a point to look at again (fictional)', 'Note 2: a document to consider (fictional)'],
  routes: {stations: ['Point 1 · intake (fictional)', 'Point 2 · initial examination (fictional)', 'Point 3 · file room (fictional)'], origin: 'Review desk (fictional)', returnTo: 1},
  outcomes: {returned: 'Back at the configured point with review notes (as supplied)', renewed: 'Renewed examination: not shown, no outcome'},
  labels: {route: 'Return route as configured (as supplied)', point: 'Configured return point (as supplied)', key: 'As supplied · no conclusion drawn'},
};

export const DN_ES = {
  decisions: {title: 'Resolución del examen inicial (ficticia)'},
  grounds: ['Nota 1: un punto que mirar de nuevo (ficticia)', 'Nota 2: un documento que considerar (ficticia)'],
  routes: {stations: ['Punto 1 · entrada (ficticio)', 'Punto 2 · examen inicial (ficticio)', 'Punto 3 · archivo (ficticio)'], origin: 'Mesa de revisión (ficticia)', returnTo: 1},
  outcomes: {returned: 'De vuelta en el punto configurado con notas de revisión (según lo aportado)', renewed: 'Examen renovado: no se muestra, sin resultado'},
  labels: {route: 'Ruta de devolución configurada (según lo aportado)', point: 'Punto de devolución configurado (según lo aportado)', key: 'Según lo aportado · sin conclusión'},
};

/**
 * Untouched English defaults follow `locale: 'es'` (whole field, or per property of an object field).
 * @param {any} ctx
 * @param {Record<string, any>} en
 * @param {Record<string, any>} es
 */
export function localisedDn(ctx, en, es) {
  const p = ctx.params;
  if (p.locale !== 'es') return {...p};
  const out = {...p};
  for (const k of Object.keys(es)) {
    if (!(k in en) || !(k in p)) continue;
    if (JSON.stringify(p[k]) === JSON.stringify(en[k])) out[k] = JSON.parse(JSON.stringify(es[k]));
    else if (p[k] && en[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) {
      const o = {...p[k]};
      for (const kk of Object.keys(es[k] || {})) if (JSON.stringify(p[k][kk]) === JSON.stringify(en[k][kk])) o[kk] = es[k][kk];
      out[k] = o;
    }
  }
  return out;
}

/** Normalised route: the configured return point is clamped to the supplied points. */
export function resolveDn(P) {
  const n = P.routes.stations.length;
  const target = Math.max(0, Math.min(n - 1, P.routes.returnTo | 0));
  return {n, target, notes: P.grounds.slice(0, 3)};
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

/** Tray rims and filter doors: one slate for all (no colour carries a verdict). */
export const SLATE = '#3b4a5a';
export const SLATE_HI = '#6d7f91';
export const MAT = '#46586a';
export const FOLDER = '#d9b877';
export const NOTE = '#f3e3a1';
export const NOTE_BAND = '#e2c96d';
export const LANE = '#ece4d3';
export const CHEVRON = '#8a7f6c';

/* ------------------------------------------------------------------ */
/* Art                                                                  */
/* ------------------------------------------------------------------ */

/**
 * Folder seen from above; local origin = centre. Cover label carries filler bars only (the decision's title is
 * supplied text drawn elsewhere).
 * @param {any} ctx
 * @param {{name?:string, w:number, h:number, seedKey?:string}} o
 */
export function folderArt(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const x = -w / 2, y = -hh / 2;
  const tabW = w * 0.32, tabH = Math.max(10, hh * 0.1);
  const lw = w * 0.5, lh = hh * 0.36;
  const bars = [0.82, 0.64, 0.74];
  return g({name: o.name},
    h('path', {d: roundRectPath(x + 7, y + 10, w, hh, 9), fill: th.shadow}),
    // back cover with tab
    h('path', {d: `M${r(x)} ${r(y + 8)}Q${r(x)} ${r(y - tabH)} ${r(x + 10)} ${r(y - tabH)}H${r(x + tabW)}L${r(x + tabW + tabH)} ${r(y)}H${r(x + w - 9)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + 9)}V${r(y + hh - 9)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - 9)} ${r(y + hh)}H${r(x + 9)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - 9)}Z`, fill: shade(FOLDER, -0.1), stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    // a sheet edge peeking out (the decision inside)
    h('rect', {x: r(x + w * 0.1), y: r(y - tabH * 0.4), width: r(w * 0.78), height: r(hh * 0.5), rx: 3, fill: th.paper, stroke: INK, 'stroke-width': 1.6}),
    // front cover
    h('path', {d: roundRectPath(x, y + hh * 0.08, w, hh * 0.92, 9), fill: FOLDER, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: `M${r(x + 10)} ${r(y + hh * 0.08 + 6)}H${r(x + w - 10)}`, stroke: shade(FOLDER, 0.35), 'stroke-width': 3, 'stroke-linecap': 'round'}),
    // cover label (filler bars only)
    h('rect', {x: r(-lw / 2), y: r(y + hh * 0.3), width: r(lw), height: r(lh), rx: 5, fill: '#fffdf6', stroke: INK, 'stroke-width': 1.6}),
    bars.map((k, i) => h('rect', {x: r(-lw / 2 + lw * 0.1), y: r(y + hh * 0.3 + lh * (0.2 + i * 0.25)), width: r(lw * 0.8 * k), height: r(Math.max(3, lh * 0.11)), rx: 2, fill: th.paperLine})),
  );
}

/**
 * Slip of review notes (1–3 stacked sticky notes, each with a notched index pip); local origin = centre of the
 * stack's bounding box. Size `s` = one note's width.
 */
export function slipArt(ctx, o) {
  const n = Math.max(1, Math.min(3, o.n));
  const s = o.s;
  const nh = s * 0.82;
  const off = s * 0.16;
  const W = s + off * (n - 1), H = nh + off * (n - 1);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + off * i, y = -H / 2 + off * i;
    parts.push(h('rect', {x: r(x + 3), y: r(y + 5), width: r(s), height: r(nh), rx: 3, fill: ctx.theme.shadow}));
    parts.push(h('rect', {x: r(x), y: r(y), width: r(s), height: r(nh), rx: 3, fill: NOTE, stroke: INK, 'stroke-width': 1.8}));
    parts.push(h('rect', {x: r(x + 1), y: r(y + 1), width: r(s - 2), height: r(nh * 0.17), fill: NOTE_BAND}));
    parts.push(g({transform: T(x + s * 0.2, y + nh * 0.42)}, indexPip(i, s * 0.13)));
    for (let b = 0; b < 2; b++) parts.push(h('rect', {x: r(x + s * 0.4), y: r(y + nh * (0.36 + b * 0.2)), width: r(s * (b ? 0.36 : 0.48)), height: r(Math.max(2.5, nh * 0.07)), rx: 1.5, fill: shade(NOTE, -0.3)}));
  }
  return {node: g({name: o.name}, parts), w: W, h: H};
}

/** Slip size for n notes of width s. */
export const slipSize = (n, s) => ({w: s + s * 0.16 * (Math.max(1, n) - 1), h: s * 0.82 + s * 0.16 * (Math.max(1, n) - 1)});

/**
 * In-tray (open towards the lane); local origin = top-left. `mouth`: 'bottom' (row) or 'right' (column).
 */
export function trayArt(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const rim = Math.max(8, Math.min(w, hh) * 0.07);
  const floor = h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: shade(th.paperShade, -0.04), stroke: INK, 'stroke-width': 2});
  const rims = o.mouth === 'right'
    ? `M${r(w)} 0H10Q0 0 0 10V${r(hh - 10)}Q0 ${r(hh)} 10 ${r(hh)}H${r(w)}V${r(hh - rim)}H${r(rim)}V${r(rim)}H${r(w)}Z`
    : `M0 ${r(hh)}V10Q0 0 10 0H${r(w - 10)}Q${r(w)} 0 ${r(w)} 10V${r(hh)}H${r(w - rim)}V${r(rim)}H${r(rim)}V${r(hh)}Z`;
  return g({name: o.name},
    h('path', {d: roundRectPath(6, 9, w, hh, 10), fill: th.shadow}),
    floor,
    h('path', {d: rims, fill: SLATE, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: o.mouth === 'right' ? `M${r(rim * 0.5)} ${r(rim * 1.4)}V${r(hh - rim * 1.4)}` : `M${r(rim * 1.4)} ${r(rim * 0.5)}H${r(w - rim * 1.4)}`, stroke: SLATE_HI, 'stroke-width': 2, 'stroke-linecap': 'round'}),
  );
}

/** Review desk mat (local origin = top-left): a stitched leather mat. */
export function matArt(ctx, o) {
  const {w, h: hh} = o;
  return g({name: o.name},
    h('path', {d: roundRectPath(6, 9, w, hh, 14), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: MAT, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(7, 7, w - 14, hh - 14, 9), fill: 'none', stroke: shade(MAT, 0.35), 'stroke-width': 2, 'stroke-dasharray': '5 5'}),
  );
}

/**
 * Name plate (local origin = top-left) with a fitted text or a filler bar; `pin` adds the configured-point pin.
 */
export function plateArt(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, F} = o;
  const parts = [
    h('path', {d: roundRectPath(4, 6, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: th.card, stroke: INK, 'stroke-width': 2}),
  ];
  const tx = o.pin ? F * 1.55 : F * 0.5;
  if (o.fit) parts.push(textAt(o.fit, {x: tx, y: (hh - o.fit.height) / 2, fill: INK, name: o.textName}));
  else parts.push(h('rect', {x: r(tx), y: r(hh / 2 - F * 0.25), width: r((w - tx - F * 0.5) * 0.7), height: r(F * 0.5), rx: 4, fill: th.paperLine}));
  if (o.pin) parts.push(g({transform: T(F * 0.82, hh / 2)}, pinGlyph(ctx, F * 0.62)));
  return g({name: o.name}, parts);
}

/** Map pin (configured return point); local origin = the pin's head centre. Neutral accent2. */
export function pinGlyph(ctx, R) {
  return g(null,
    h('path', {d: `M0 ${r(R * 1.55)}C${r(-R * 0.35)} ${r(R * 0.95)} ${r(-R)} ${r(R * 0.5)} ${r(-R)} 0A${r(R)} ${r(R)} 0 1 1 ${r(R)} 0C${r(R)} ${r(R * 0.5)} ${r(R * 0.35)} ${r(R * 0.95)} 0 ${r(R * 1.55)}Z`, transform: `translate(0 ${r(-R * 0.35)})`, fill: ctx.theme.accent2, stroke: INK, 'stroke-width': 1.8}),
    h('circle', {cx: 0, cy: r(-R * 0.35), r: r(R * 0.38), fill: '#fff'}),
  );
}

/**
 * One filter door (a mesh bar), drawn pointing along +x from its pivot (local origin = pivot).
 */
export function doorArt(ctx, o) {
  const {len, t} = o;
  const holes = [];
  const n = Math.max(2, Math.floor((len - t * 1.6) / (t * 0.75)));
  for (let i = 0; i < n; i++) {
    const cx = t * 0.9 + (i + 0.5) * ((len - t * 1.4) / n);
    holes.push(h('circle', {cx: r(cx), cy: r(-t * 0.18), r: r(t * 0.13), fill: shade(SLATE, 0.45)}));
    holes.push(h('circle', {cx: r(cx), cy: r(t * 0.18), r: r(t * 0.13), fill: shade(SLATE, 0.45)}));
  }
  return g({name: o.name},
    h('rect', {x: 0, y: r(-t / 2), width: r(len), height: r(t), rx: r(t * 0.3), fill: SLATE, stroke: INK, 'stroke-width': 2}),
    holes,
    h('circle', {cx: 0, cy: 0, r: r(t * 0.62), fill: shade(SLATE, 0.15), stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: 0, r: r(t * 0.2), fill: INK}),
  );
}

/** Chevron (local origin = centre, pointing along +x). */
export function chevron(s, fill = CHEVRON) {
  const k = s / 2;
  return h('path', {d: `M${r(-k * 0.7)} ${r(-k)}L${r(k * 0.5)} 0L${r(-k * 0.7)} ${r(k)}L${r(-k * 0.15)} ${r(k)}L${r(k)} 0L${r(-k * 0.15)} ${r(-k)}Z`, fill});
}

/** Blank sheet of the renewed examination (local origin = top-left). Deliberately empty: no content, no outcome. */
export function blankSheetArt(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  return g({name: o.name},
    h('path', {d: roundRectPath(5, 7, w, hh, 6), fill: th.shadow}),
    h('path', {d: `M0 6Q0 0 6 0H${r(w - w * 0.2)}L${r(w)} ${r(w * 0.2)}V${r(hh - 6)}Q${r(w)} ${r(hh)} ${r(w - 6)} ${r(hh)}H6Q0 ${r(hh)} 0 ${r(hh - 6)}Z`, fill: th.paper, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w - w * 0.2)} 0V${r(w * 0.2)}H${r(w)}`, fill: th.paperShade, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(w * 0.15), y: r(hh * 0.16), width: r(w * 0.42), height: r(Math.max(4, hh * 0.05)), rx: 2, fill: th.paperLine}),
  );
}

/* ------------------------------------------------------------------ */
/* Board model (stations, review mat, lane, doors)                     */
/* ------------------------------------------------------------------ */

/**
 * Lay out the route board inside `box`.
 *  - orient 'row': the trays stand in a row along the top (plates above them), the review mat at the right end, the
 *    lane runs below the trays (return direction: leftwards); hands come from the bottom edge.
 *  - orient 'column': the trays stand in a column on the left (plates above each tray), the review mat at the
 *    bottom, the lane runs right of the trays (return direction: upwards); hands come from the right edge.
 * @param {any} ctx
 * @param {{orient:'row'|'column', box:{x:number,y:number,w:number,h:number}, F:number, names:string[], origin:string,
 *   showText:boolean, target:number, handRoom?:number, slipN?:number, maxFw?:number, plateLines?:number, reviewW?:number}} o
 */
export function boardModel(ctx, o) {
  const {box, F, names} = o;
  const n = names.length;
  const N = n + 1;
  const fm = Math.max(10, F * 0.5);
  const tm = Math.max(6, F * 0.3);
  const plateLines = o.plateLines ?? 3;
  const handMin = o.handRoom ?? F * 2.4;
  const doorT = Math.max(12, F * 0.7);
  const problems = [];
  const plateFit = (text, w) => (o.showText ? fitG(text, {maxWidth: w, size: F, minSize: F, maxLines: plateLines, weight: 600}) : null);
  const slots = [];
  let fw, fh, lane, extra = 0;
  const M = {};
  const slipN = o.slipN ?? 2;
  const sep = Math.max(F * 9, 180);
  if (o.orient === 'row' && o.matBelow) {
    // (opt-in, off by default) stations in a row across the whole width; the review mat sits in a row BELOW the
    // lane (its plate and the calendar to its left), joined to the lane by a drop strip
    const gx = F * 0.7;
    const unit = (box.w - (n - 1) * gx) / n;
    const fits = names.map((nm, i) => plateFit(nm, unit + (i ? 0 : (o.plateExtL ?? 0)) - tm * 2 - (i === o.target ? F * 1.55 : F * 0.5) - F * 0.5));
    const plateH = Math.max(F * 1.9, ...fits.map(f => (f ? f.height + F * 0.9 : 0)));
    const g1 = F * 0.45;
    const above = o.matPlate === 'under'; // (plate in its own row under the mat, clear of the mat's drop to the lane)
    const pfA = above ? plateFit(o.origin, box.w * 0.62 - F * 2.6) : null;
    if (pfA && !pfA.ok) problems.push('plate-text');
    const phA = above ? Math.max(F * 1.9, pfA ? pfA.height + F * 0.9 : 0) + g1 : 0;
    const matGap = o.matGap ?? 0;
    const clear0 = doorT * 0.6 + F * 0.3;
    // heights: plate, tray (fh+2fm), clear, lane band (fh), clear, [matGap], mat (fh+2fm), hand room
    const fixed = plateH + g1 + 4 * fm + clear0 * 2 + matGap + phA + handMin;
    fh = Math.min((unit - 2 * tm - 2 * fm) * 0.68, (box.h - fixed) / 3, (o.maxFw ?? 1e9) * 0.68);
    fw = fh / 0.68;
    if (fw < F * (o.folderMin ?? 5)) problems.push('folder-small');
    const S = Math.max(0, box.h - fixed - 3 * fh);
    extra = Math.min(S * 0.3, fh * 0.5);
    const clear = clear0 + Math.min(S * 0.2, fh * 0.4);
    const tw = fw + 2 * fm, th = fh + 2 * fm + extra;
    const used = plateH + g1 + th + clear + fh + clear + matGap + (fh + 2 * fm) + phA;
    const y0 = box.y + Math.max(0, (box.h - used - handMin) / 2);
    const trayY = y0 + plateH + g1;
    const yL = trayY + th + clear + fh / 2;
    const laneW = fh * 0.5;
    for (let i = 0; i < n; i++) {
      const cx = box.x + i * (unit + gx);
      const tx = cx + (unit - tw) / 2;
      slots.push({i, station: true, plate: {x: cx + tm - (i ? 0 : (o.plateExtL ?? 0)), y: y0, w: unit - tm * 2 + (i ? 0 : (o.plateExtL ?? 0)), h: plateH, fit: fits[i]}, tray: {x: tx, y: trayY, w: tw, h: th}, rest: {x: tx + tw / 2, y: trayY + th / 2}, mouth: {x: tx + tw / 2, y: trayY + th}});
    }
    // mat row
    const mh = fh + 2 * fm;
    const s0 = slipSize(slipN, fw * 0.36);
    const mw = above ? Math.max(box.w * 0.62, Math.min(box.w - tm * 2, tw + s0.w + fm)) : Math.min(box.w * 0.6, tw + s0.w + fm);
    const my = yL + fh / 2 + clear + matGap;
    const mx = box.x + box.w - mw - tm;
    const cw = above ? Math.min(fw * 0.42, mx - box.x - tm - F * 0.5) : Math.min(fw * 0.42, (mx - box.x) * 0.3);
    let plate;
    if (above) plate = {x: mx + F * 1.6, y: my + mh + g1, w: mw - F * 1.6, h: phA - g1, fit: pfA};
    else {
      const px = box.x + tm + (cw >= F * 2.4 ? cw + F * 0.6 : 0);
      const pw = mx - px - F * 0.6;
      const pf = plateFit(o.origin, pw - F);
      if (pf && !pf.ok) problems.push('plate-text');
      const ph = Math.max(F * 1.9, pf ? pf.height + F * 0.9 : 0);
      plate = {x: px, y: my + (mh - ph) / 2, w: pw, h: ph, fit: pf};
    }
    slots.push({i: n, station: false, plate, tray: {x: mx, y: my, w: mw, h: mh}, rest: {x: mx + fm + fw / 2, y: my + mh / 2}, mouth: {x: mx + fm + fw / 2, y: my}});
    const R = slots[n];
    const xs = slots.map(q => q.rest.x);
    lane = {orient: 'row', w: laneW, a: {x: Math.min(...xs) - laneW * 0.9, y: yL}, b: {x: Math.max(...xs) + laneW * 0.9, y: yL}, drop: {x: R.rest.x, y: yL}};
    M.slipS = fw * 0.36;
    M.slipRest = {x: mx + fm * 2 + fw + s0.w / 2, y: R.rest.y};
    M.cal = {w: cw, h: cw * 0.82, x: box.x + tm, y: my + (mh - cw * 0.82) / 2};
    if (cw < F * 2.4) problems.push('calendar-small');
    const cx = box.x + box.w * 0.55;
    const sy = box.y + box.h + Math.max(110, box.h * 0.16);
    M.shoulders = {R: {x: cx + sep / 2, y: sy}, L: {x: cx - sep / 2, y: sy}};
    M.rests = {R: {x: cx + sep * 0.55, y: box.y + box.h - F * 0.5}, L: {x: cx - sep * 0.55, y: box.y + box.h - F * 0.5}};
    M.used = {x: box.x, y: y0, w: box.w, h: used};
    if (y0 + used > box.y + box.h + 0.5) problems.push('board-tall');
  } else if (o.orient === 'row') {
    const gx = F * 0.7;
    const rw = o.reviewW ?? 1.45;
    const unit = (box.w - (N - 1) * gx) / (n + rw);
    const cols = [];
    let x = box.x;
    for (let i = 0; i < N; i++) { const w = unit * (i < n ? 1 : rw); cols.push({x, w}); x += w + gx; }
    const extL = o.plateExtL ?? 0; // the first plate may reach further left (a sign over free desk space)
    const fits = cols.map((c, i) => plateFit(i < n ? names[i] : o.origin, c.w + (i ? 0 : extL) - tm * 2 - (i === o.target ? F * 1.55 : F * 0.5) - F * 0.5));
    fits.forEach(f => { if (f && !f.ok) problems.push('plate-text'); });
    const plateH = Math.max(F * 1.9, ...fits.map(f => (f ? f.height + F * 0.9 : 0)));
    const g1 = F * 0.45;
    const fixed = plateH + g1 + 2 * fm + doorT * 0.6 + F * 0.3 + handMin;
    fh = Math.min((unit - 2 * tm - 2 * fm) * 0.68, (box.h - fixed) / 2.14, (o.maxFw ?? 1e9) * 0.68);
    fw = fh / 0.68;
    if (fw < F * (o.folderMin ?? 5)) problems.push('folder-small');
    const clear0 = fh * 0.14 + doorT * 0.6 + F * 0.3;
    const S = Math.max(0, box.h - (fixed - doorT * 0.6 - F * 0.3) - clear0 - 2 * fh);
    extra = Math.min(S * 0.4, fh * 0.8);
    const clear = clear0 + Math.min(S * 0.4, fh * 1.0);
    const tw = fw + 2 * fm, th = fh + 2 * fm + extra;
    const used = plateH + g1 + th + clear + fh;
    const y0 = box.y + Math.min(F * 0.8, Math.max(0, box.h - used - handMin) * 0.12);
    const trayY = y0 + plateH + g1;
    const yL = trayY + th + clear + fh / 2;
    const laneW = fh * 0.5;
    cols.forEach((c, i) => {
      const station = i < n;
      const w = station ? tw : Math.min(c.w - 2 * tm, tw + fw * 0.6);
      const tx = c.x + (c.w - w) / 2;
      const tray = {x: tx, y: trayY, w, h: th};
      const rest = station ? {x: tx + tw / 2, y: trayY + th / 2} : {x: tx + fm + fw / 2, y: trayY + th / 2};
      slots.push({i, station, plate: {x: c.x + tm - (i ? 0 : extL), y: y0, w: c.w - tm * 2 + (i ? 0 : extL), h: plateH, fit: fits[i]}, tray, rest, mouth: {x: rest.x, y: trayY + th}});
    });
    const R = slots[n];
    lane = {orient: 'row', w: laneW, a: {x: slots[0].rest.x - laneW * 0.9, y: yL}, b: {x: R.rest.x + laneW * 0.9, y: yL}, drop: {x: R.rest.x, y: yL}};
    const room = R.tray.w - fw - fm * 3;
    const s = Math.min(fw * 0.42, room / (1 + 0.16 * (slipN - 1)));
    const slip = slipSize(slipN, s);
    M.slipS = s;
    M.slipRest = {x: R.tray.x + fm * 2 + fw + slip.w / 2, y: R.tray.y + R.tray.h / 2};
    if (s < F * 2.2) problems.push('slip-small');
    const cw = Math.min(fw * 0.42, box.x + box.w - (R.rest.x + fw / 2 + F * 0.6) - F * 0.2);
    M.cal = {w: cw, h: cw * 0.82, x: R.rest.x + fw / 2 + F * 0.6, y: yL - cw * 0.41};
    if (cw < F * 2.4) problems.push('calendar-small');
    const cx = box.x + box.w * 0.55;
    const sy = box.y + box.h + Math.max(110, box.h * 0.16);
    M.shoulders = {R: {x: cx + sep / 2, y: sy}, L: {x: cx - sep / 2, y: sy}};
    M.rests = {R: {x: cx + sep * 0.55, y: box.y + box.h - F * 0.5}, L: {x: cx - sep * 0.55, y: box.y + box.h - F * 0.5}};
    M.used = {x: box.x, y: y0, w: box.w, h: used};
  } else {
    const plateW = o.plateW ?? box.w * 0.36;
    const fits = [...names, o.origin].map((s, i) => plateFit(s, plateW - (i === o.target ? F * 1.55 : F * 0.5) - F * 0.5));
    fits.forEach(f => { if (f && !f.ok) problems.push('plate-text'); });
    const plateH = Math.max(F * 1.9, ...fits.map(f => (f ? f.height + F * 0.9 : 0)));
    const gp = F * 0.5;
    const gyMin = F * 0.5;
    const clear0 = doorT * 0.6 + F * 0.4;
    const sideMin = F * 1.2;
    const fwW = (box.w - plateW - gp - 2 * fm - clear0 - sideMin) / 2.47;
    const thMax = (box.h - (N - 1) * gyMin) / N;
    fh = Math.min(fwW * 0.68, thMax - 2 * fm, (o.maxFw ?? 1e9) * 0.68);
    fw = fh / 0.68;
    if (fw < F * 5) problems.push('folder-small');
    const tw = fw + 2 * fm, th = fh + 2 * fm;
    const sH = Math.max(th, plateH);
    if (N * sH + (N - 1) * gyMin > box.h + 0.5) problems.push('column-tall');
    const gy = Math.min(fh * 0.7, Math.max(gyMin, (box.h - N * sH) / (N - 1)));
    const used = N * sH + (N - 1) * gy;
    const y0 = box.y + Math.max(0, (box.h - used) / 2);
    const slackW = Math.max(0, box.w - (plateW + gp + tw + clear0 + fw * 1.47 + sideMin));
    const clear = clear0 + Math.min(slackW * 0.3, fw * 0.3);
    const x0 = box.x + Math.min(F * 0.6, slackW * 0.15);
    const trayX = x0 + plateW + gp;
    const xL = trayX + tw + clear + fw / 2;
    const laneW = fh * 0.62;
    for (let i = 0; i < N; i++) {
      const sy = y0 + i * (sH + gy);
      const station = i < n;
      const tray = {x: trayX, y: sy + (sH - th) / 2, w: tw, h: th};
      const rest = {x: trayX + tw / 2, y: tray.y + th / 2};
      slots.push({i, station, plate: {x: x0, y: sy + (sH - plateH) / 2, w: plateW, h: plateH, fit: fits[i]}, tray, rest, mouth: {x: trayX + tw, y: rest.y}});
    }
    const R = slots[n];
    lane = {orient: 'column', w: laneW, a: {x: xL, y: slots[0].rest.y - laneW * 0.9}, b: {x: xL, y: R.rest.y + laneW * 0.9}, drop: {x: xL, y: R.rest.y}};
    const right = box.x + box.w;
    const sideX = xL + fw / 2 + F * 0.5;
    const sideW = right - sideX;
    const s = Math.min(fw * 0.42, (sideW - F * 0.3) / (1 + 0.16 * (slipN - 1)));
    const slip = slipSize(slipN, s);
    M.slipS = s;
    M.slipRest = {x: sideX + slip.w / 2, y: R.rest.y};
    if (s < F * 2.2) problems.push('slip-small');
    const cw = Math.min(fw * 0.42, sideW - F * 0.3);
    M.cal = {w: cw, h: cw * 0.82, x: sideX, y: slots[0].rest.y - cw * 0.41};
    if (cw < F * 2.4) problems.push('calendar-small');
    const cy = (slots[0].rest.y + R.rest.y) / 2 + fh * 0.4;
    const sx = right + Math.max(110, box.w * 0.16);
    M.shoulders = {R: {x: sx, y: cy + sep / 2}, L: {x: sx, y: cy - sep / 2}};
    M.rests = {R: {x: right - F * 0.5, y: cy + sep * 0.6}, L: {x: right - F * 0.5, y: cy - sep * 0.6}};
    M.used = {x: x0, y: y0, w: right - x0, h: used};
  }
  const tw = fw + 2 * fm, th = fh + 2 * fm + extra;
  // filter doors: two halves per station tray mouth; open = folded back along the tray's side walls (inside the rim)
  const doors = slots.filter(s => s.station).map(s => {
    if (o.orient === 'row') {
      const y = s.tray.y + s.tray.h;
      return {i: s.i, halves: [{p: {x: s.tray.x, y}, base: 0, open: -90, len: s.tray.w / 2}, {p: {x: s.tray.x + s.tray.w, y}, base: 180, open: 90, len: s.tray.w / 2}]};
    }
    const x = s.tray.x + s.tray.w;
    return {i: s.i, halves: [{p: {x, y: s.tray.y}, base: 90, open: 90, len: s.tray.h / 2}, {p: {x, y: s.tray.y + s.tray.h}, base: -90, open: -90, len: s.tray.h / 2}]};
  });
  M.shoulder = side => M.shoulders[side];
  M.handRest = side => M.rests[side];
  return {orient: o.orient, F, n, slots, lane, fw, fh, fm, tw, th, doors, doorT, ...M, ok: !problems.length, problems};
}


/**
 * The folder's return path (folder-centre points): rest on the review mat → the lane → along it to the branch of
 * station k → into tray k. Returns a polyline plus the arc-length fractions of the corners.
 */
export function returnPath(B, k) {
  const R = B.slots[B.n];
  const S = B.slots[k];
  const pts = B.orient === 'row'
    ? [R.rest, {x: R.rest.x, y: B.lane.drop.y}, {x: S.rest.x, y: B.lane.drop.y}, S.rest]
    : [R.rest, {x: B.lane.drop.x, y: R.rest.y}, {x: B.lane.drop.x, y: S.rest.y}, S.rest];
  const poly = polyline(pts);
  const seg = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {poly, pts, corners: seg.map(s => s / (poly.total || 1))};
}

/** Lane node: the strip, the branches into every tray (and the drop from the mat) and chevrons in return direction. */
export function laneArt(ctx, B, o = {}) {
  const L = B.lane;
  const w = L.w;
  const parts = [];
  const strip = (x, y, ww, hh) => h('path', {d: roundRectPath(x, y, ww, hh, Math.min(ww, hh) / 2), fill: LANE, stroke: shade(LANE, -0.3), 'stroke-width': 2});
  const R = B.slots[B.n];
  if (L.orient === 'row') {
    for (const s of B.slots) parts.push(s.tray.y > L.a.y ? strip(s.rest.x - w / 2, L.a.y, w, s.tray.y - L.a.y + 4) : strip(s.rest.x - w / 2, s.tray.y + s.tray.h - 4, w, L.a.y - (s.tray.y + s.tray.h) + 4));
    parts.push(strip(L.a.x - w / 2, L.a.y - w / 2, L.b.x - L.a.x + w, w));
    const step = w * 1.5;
    for (let x = R.rest.x - step; o.chev !== false && x > L.a.x + w * 0.2; x -= step) {
      if (B.slots.some(s => Math.abs(s.rest.x - x) < w * 0.75)) continue;
      parts.push(g({transform: T(x, L.a.y, 180)}, chevron(w * 0.5)));
    }
    if (o.branchArrow != null) {
      const s = B.slots[o.branchArrow];
      const yy = (s.tray.y + s.tray.h + L.a.y - w / 2) / 2;
      if (L.a.y - w / 2 - (s.tray.y + s.tray.h) > w * 0.55) parts.push(g({transform: T(s.rest.x, yy, -90)}, chevron(w * 0.42)));
    }
  } else {
    for (const s of B.slots) parts.push(strip(s.tray.x + s.tray.w - 4, s.rest.y - w / 2, L.a.x - (s.tray.x + s.tray.w) + 4, w));
    parts.push(strip(L.a.x - w / 2, L.a.y - w / 2, w, L.b.y - L.a.y + w));
    const step = w * 1.5;
    for (let y = R.rest.y - step; o.chev !== false && y > L.a.y + w * 0.2; y -= step) {
      if (B.slots.some(s => Math.abs(s.rest.y - y) < w * 0.75)) continue;
      parts.push(g({transform: T(L.a.x, y, -90)}, chevron(w * 0.5)));
    }
  }
  return g({name: o.name}, parts);
}

/** Door half transform for an opening fraction k (0 closed, 1 open). */
export const doorT = (hv, k) => T(hv.p.x, hv.p.y, hv.base + hv.open * clamp(k));

/** Box of a slot's folder at rest (for overlap tests). */
export const folderBox = (B, p) => ({x: p.x - B.fw / 2, y: p.y - B.fh / 2, w: B.fw, h: B.fh});

/* ------------------------------------------------------------------ */
/* Legend panel                                                        */
/* ------------------------------------------------------------------ */

/** Legend icon (size s, local origin = icon centre). */
export function dnIcon(ctx, kind, s, o = {}) {
  const th = ctx.theme;
  const k = s / 2;
  if (kind === 'folder') return g({transform: `scale(${r(s / 120, 4)})`}, folderArt(ctx, {w: 120, h: 82}));
  if (kind === 'note') {
    return g(null,
      h('rect', {x: r(-k * 0.9), y: r(-k * 0.75), width: r(k * 1.8), height: r(k * 1.5), rx: 3, fill: NOTE, stroke: INK, 'stroke-width': 1.8}),
      h('rect', {x: r(-k * 0.9 + 1), y: r(-k * 0.75 + 1), width: r(k * 1.8 - 2), height: r(k * 0.3), fill: NOTE_BAND}),
      g({transform: T(0, k * 0.15)}, indexPip(o.index ?? 0, k * 0.5)));
  }
  if (kind === 'doors') {
    return g(null,
      h('path', {d: `M${r(-k)} ${r(-k * 0.8)}V${r(k * 0.1)}H${r(k)}V${r(-k * 0.8)}`, fill: 'none', stroke: SLATE, 'stroke-width': 3}),
      g({transform: T(-k * 0.8, k * 0.15, 90)}, doorArt(ctx, {len: k * 0.85, t: k * 0.3})),
      g({transform: T(k * 0.8, k * 0.15, 90)}, doorArt(ctx, {len: k * 0.85, t: k * 0.3})));
  }
  if (kind === 'num') {
    const F = o.F ?? s / 1.2;
    return g(null, h('circle', {cx: 0, cy: 0, r: r(F * 0.68), fill: th.card, stroke: o.color ?? INK, 'stroke-width': 2.5}),
      h('text', {x: 0, y: r(F * 0.35), 'text-anchor': 'middle', 'font-size': r(F), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: INK}, String((o.index ?? 0) + 1)));
  }
  if (kind === 'pip') return g(null, indexPip(o.index ?? 0, k * 0.62));
  if (kind === 'pin') return g({transform: T(0, -k * 0.1)}, pinGlyph(ctx, k * 0.62));
  if (kind === 'calendar') return g({transform: T(-k, -k * 0.82)}, calendarNode(ctx, {w: s, h: s * 0.82}));
  if (kind === 'lane') return g(null, h('rect', {x: r(-k), y: r(-k * 0.35), width: r(s), height: r(k * 0.7), rx: r(k * 0.35), fill: LANE, stroke: shade(LANE, -0.3), 'stroke-width': 2}), g({transform: T(0, 0, 180)}, chevron(k * 0.6)));
  if (kind === 'hand') {
    return h('path', {d: `M${r(-k * 0.55)} ${r(k * 0.9)}L${r(-k * 0.55)} ${r(-k * 0.1)}Q${r(-k * 0.55)} ${r(-k * 0.6)} ${r(-k * 0.2)} ${r(-k * 0.6)}L${r(-k * 0.2)} ${r(-k * 0.95)}Q0 ${r(-k * 1.1)} ${r(k * 0.2)} ${r(-k * 0.95)}L${r(k * 0.2)} ${r(-k * 0.55)}Q${r(k * 0.55)} ${r(-k * 0.65)} ${r(k * 0.6)} ${r(-k * 0.2)}L${r(k * 0.6)} ${r(k * 0.9)}Z`, fill: '#e0ac85', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'});
  }
  if (kind === 'blank') return g({transform: T(-k * 0.62, -k * 0.82)}, blankSheetArt(ctx, {w: k * 1.24, h: k * 1.64}));
  if (kind === 'ring') return h('circle', {cx: 0, cy: 0, r: r(k * 0.7), fill: 'none', stroke: o.color ?? th.accent3, 'stroke-width': 4});
  if (kind === 'mat') return h('path', {d: roundRectPath(-k, -k * 0.7, s, k * 1.4, 4), fill: MAT, stroke: INK, 'stroke-width': 2});
  if (kind === 'tray') return g({transform: T(-k, -k * 0.7)}, trayArt(ctx, {w: s, h: k * 1.4, mouth: 'bottom'}));
  return null;
}

/**
 * Lay out legend rows in a column. Row kinds: heading (bold), item (icon + text, optional `sub` line), state
 * (outlined tag), key (italic, the neutral key).
 */
export function panelLayout(ctx, rows, o) {
  const {w, F} = o;
  const iconW = F * 1.7;
  const gap = F * 0.5;
  let y = 0;
  let ok = true;
  const out = rows.map(row => {
    const tw = row.kind === 'state' || row.kind === 'key' ? w - F * 1.2 : w - iconW;
    const fit = fitG(row.text, {maxWidth: tw, size: F, minSize: o.minF ?? F, maxLines: o.maxLines ?? 3, weight: row.kind === 'heading' ? 700 : row.kind === 'key' ? 600 : 500});
    if (!fit.ok) ok = false;
    let sub = null;
    if (row.sub) {
      sub = fitG(row.sub, {maxWidth: tw - F * 1.3, size: F, minSize: o.minF ?? F, maxLines: o.maxLines ?? 3, weight: 600});
      if (!sub.ok) ok = false;
    }
    const pad = row.kind === 'state' ? F * 0.45 : 0;
    const hh = fit.height + pad * 2 + (sub ? F * 0.3 + sub.height : 0);
    const item = {...row, fit, sub, y, h: hh, pad, iconW, tw};
    y += hh + gap;
    return item;
  });
  return {rows: out, h: Math.max(0, y - gap), w, F, ok};
}

/** Panel node (local origin = top-left). Every row is a named group (`row.name`); a sub line is `${name}-sub`. */
export function panelNode(ctx, PL) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    if (row.dx) return g({transform: T(row.dx, 0)}, panelNode(ctx, {...PL, rows: [{...row, dx: 0}]}));
    const parts = [];
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, PL.w, row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(PL.w), y1: r(row.y - F * 0.3), y2: r(row.y - F * 0.3), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.72, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, dnIcon(ctx, row.icon, F * 1.2, {color: row.color, index: row.index, F})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
      if (row.sub) {
        const sy = row.y + row.fit.height + F * 0.3;
        parts.push(g({name: `${row.name}-sub`, opacity: 0},
          g({transform: T(row.iconW + F * 0.55, sy + Math.min(row.sub.height, F * 1.2) / 2)}, dnIcon(ctx, row.subIcon || 'pin', F * 1.0)),
          textAt(row.sub, {x: row.iconW + F * 1.3, y: sy, fill: th.fg})));
      }
    }
    return g({name: row.name}, parts);
  });
}

/** Rounded ring rectangle used to key editorial notes to their targets. */
export function ringRect(b, color, sw = 4) {
  return h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: color, 'stroke-width': r(sw, 2)});
}

/** Neutral note inks (amber and slate-blue; never green or red). */
export const noteColors = th => [th.accent3, th.accent2];
