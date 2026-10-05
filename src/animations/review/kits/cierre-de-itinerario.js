/**
 * "Cierre de itinerario" kit (LAW-0357..0360, review-10): geometry, art and text helpers shared by the four entries.
 *
 * The motif's objects (all original vector art):
 *  - EXPEDIENTE: an open manila case file with a tab carrying its (fictional) label. Its inner sheet carries a printed
 *    route map: the starting resolution on one side, one track per supplied route and, at the end of each track, an
 *    end card printing the route's label and the entry supplied for its end.
 *  - RESOLUCIONES: the starting resolution card (title, reference, grounds line — all as supplied) and the end cards
 *    of the routes. All end cards have the SAME size and weight; a state badge on each card stays neutral grey until
 *    the route is marked with its supplied state.
 *  - FLECHAS: direction chevrons that appear along a track as it is traced (the route as travelled, as supplied).
 *  - FILTROS: small neutral glass filter clips, laid across the track of a route supplied as "pending a check". A clip
 *    marks the way as not yet checked; it does not close, open, admit or decide anything.
 *  - CALENDARIO: a desk calendar, a fixture only (blank grid, no date marked, no time span implied).
 *
 * Supplied states: `concluded` (route concluded, as supplied — lane A, blue accent2, ● glyph) and `pending` (way pending
 * a check, as supplied — lane B, amber accent3, ◆ glyph). Both are drawn with the same stroke weight and size; no
 * check marks, crosses, red or green. Legal care (brief): the routes and their states are supplied; no finality
 * doctrine; nothing says whether any remaining route is closed or available. Fictional content, jurisdiction
 * unspecified, `illustrative-unverified`.
 *
 * Text helpers (glue-aware wrapping, bounded fit), the legend panel layout, the calendar art and a few geometry helpers
 * are imported read-only from the accepted review-06 kit (`confirmacion-ilustrativa.js`).
 * @module animations/review/kits/cierre-de-itinerario
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {str, obj, oneOf, list} from '../../../schemas/fields.js';
import {FONTS} from '../../../core/text.js';
import {shade} from '../../../primitives/paper.js';
import {
  localisedCi, fitG, textAt, wrapG, panelLayout, ringRect, overlaps, inside, R2, markGlyph, calendarArt, legendIcon as ciIcon,
  INK, SLATE,
} from './confirmacion-ilustrativa.js';

export {localisedCi, fitG, textAt, wrapG, panelLayout, ringRect, overlaps, inside, R2, markGlyph, calendarArt, INK, SLATE};

/* ------------------------------------------------------------------ */
/* Fields, defaults                                                    */
/* ------------------------------------------------------------------ */

export const STATES = ['concluded', 'pending'];

/** Category fields shared by the four entries (brief: decisions, grounds, routes, outcomes). */
export const ciiFields = {
  decisions: obj('The starting resolution printed in the file (fictional; placeholder content)', {
    title: str('Title of the starting resolution (fictional)', 70),
    ref: str('Reference tag of the starting resolution (fictional)', 44),
  }, ['title', 'ref']),
  grounds: str('Grounds line printed on the starting resolution, as supplied (placeholder; never assessed)', 90),
  routes: list('Routes printed in the file, as supplied: each has a label, a supplied state and the entry printed at its end. The scene never infers whether any route is closed or still available', obj('Route', {
    label: str('Route label (as supplied)', 50),
    state: oneOf('Supplied state: concluded (route concluded, as supplied) or pending (way pending a check, as supplied)', STATES),
    end: str('Entry printed on the route\'s end card (as supplied)', 80),
  }, ['label', 'state', 'end']), 2, 3),
  outcomes: obj('Captions of the two supplied states (legend). Descriptive only: no finality doctrine', {
    concluded: str('Caption for a route supplied as concluded', 80),
    pending: str('Caption for a way supplied as pending a check', 80),
  }, ['concluded', 'pending']),
  labels: obj('Editable captions', {
    file: str('Label on the case file\'s tab (fictional)', 60),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['file', 'key']),
};

export const CII_EN = {
  decisions: {title: 'Resolution R-1 (fictional)', ref: 'Ref. X-100 (fictional)'},
  grounds: 'Grounds: placeholder text (as supplied)',
  routes: [
    {label: 'Route 1 (as supplied)', state: 'concluded', end: 'Resolution R-2 recorded (fictional)'},
    {label: 'Route 2 (as supplied)', state: 'pending', end: 'Not yet checked in this file'},
    {label: 'Route 3 (as supplied)', state: 'pending', end: 'Not yet checked in this file'},
  ],
  outcomes: {concluded: 'Route concluded (as supplied)', pending: 'Way pending a check (as supplied)'},
  labels: {file: 'Case file X-100 (fictional)', key: 'As supplied · no conclusion drawn'},
};

export const CII_ES = {
  decisions: {title: 'Resolución R-1 (ficticia)', ref: 'Ref. X-100 (ficticia)'},
  grounds: 'Fundamentos: texto provisional (según lo aportado)',
  routes: [
    {label: 'Ruta 1 (según lo aportado)', state: 'concluded', end: 'Resolución R-2 registrada (ficticia)'},
    {label: 'Ruta 2 (según lo aportado)', state: 'pending', end: 'Aún sin comprobar en este expediente'},
    {label: 'Ruta 3 (según lo aportado)', state: 'pending', end: 'Aún sin comprobar en este expediente'},
  ],
  outcomes: {concluded: 'Ruta concluida (según lo aportado)', pending: 'Vía pendiente de comprobar (según lo aportado)'},
  labels: {file: 'Expediente X-100 (ficticio)', key: 'Según lo aportado · sin conclusión'},
};

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

export const MANILA = '#e6d3a3';
export const TRACK = '#e9e4da';
/** Lane colour of a supplied state (concluded: blue accent2, pending: amber accent3 — never red or green). */
export const stateColor = (th, st) => (st === 'concluded' ? th.accent2 : th.accent3);
/** Glyph side of a state (● for concluded, ◆ for pending: equal area and ink). */
export const stateGlyph = st => (st === 'concluded' ? 'a' : 'b');
export const noteColors = th => [th.accent3, th.accent2];

/* ------------------------------------------------------------------ */
/* Starting resolution card                                            */
/* ------------------------------------------------------------------ */

/**
 * Model of the starting resolution card for a width w and text size F.
 * @param {any} P localised params
 * @param {{w:number, F:number, showText:boolean, minF?:number}} o
 */
export function originModel(P, o) {
  const {w, F} = o;
  const st = o.showText;
  const minF = o.minF ?? F;
  const pad = Math.max(12, F * 0.75);
  const inner = w - pad * 2;
  const seal = F * 1.0;
  const f = {};
  let ok = true;
  if (st) {
    f.title = fitG(P.decisions.title, {maxWidth: inner - seal * 2 - F * 0.5, size: F * 1.04, minSize: minF, maxLines: 4, weight: 700, family: 'serif'});
    f.ref = fitG(P.decisions.ref, {maxWidth: inner - F * 1.4, size: F, minSize: minF, maxLines: 2, weight: 600});
    f.grounds = fitG(P.grounds, {maxWidth: inner, size: F, minSize: minF, maxLines: 5, weight: 500});
    ok = f.title.ok && f.ref.ok && f.grounds.ok;
  }
  let y = pad + F * 0.2;
  const header = {y, h: Math.max(seal * 2, st ? f.title.height : F * 1.4)};
  y += header.h + F * 0.45;
  const sep = y;
  y += F * 0.45;
  const ref = {x: pad, y, h: (st ? f.ref.height : F) + F * 0.6, w: st ? Math.min(inner, f.ref.width + F * 1.4) : inner * 0.6};
  y += ref.h + F * 0.5;
  const grounds = {x: pad, y, h: st ? f.grounds.height : F * 1.3, w: inner};
  y += grounds.h + pad;
  return {w, h: y, F, pad, inner, seal, fits: f, header, sep, ref, grounds, showText: st, ok};
}

/** Starting resolution card (local origin = top-left). Named text nodes `${prefix}-title`, `-ref-t`, `-grounds`. */
export function originNode(ctx, M, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const F = M.F;
  const f = M.fits;
  const fold = Math.min(F * 1.1, M.w * 0.12);
  const body = `M0 8Q0 0 8 0H${r(M.w - fold)}L${r(M.w)} ${r(fold)}V${r(M.h - 8)}Q${r(M.w)} ${r(M.h)} ${r(M.w - 8)} ${r(M.h)}H8Q0 ${r(M.h)} 0 ${r(M.h - 8)}Z`;
  const parts = [
    o.shadow === false ? null : h('path', {d: body, transform: 'translate(6 8)', fill: th.shadow}),
    h('path', {d: body, fill: th.paper, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(M.w - fold)} 0V${r(fold)}H${r(M.w)}`, fill: th.paperShade, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
  // the seal of the resolution (concentric rings; carries no text)
  const sx = M.pad + M.seal, sy = M.header.y + M.header.h / 2;
  parts.push(h('circle', {cx: r(sx), cy: r(sy), r: r(M.seal), fill: SLATE, stroke: INK, 'stroke-width': 2.2}));
  parts.push(h('circle', {cx: r(sx), cy: r(sy), r: r(M.seal * 0.62), fill: 'none', stroke: '#fff', 'stroke-width': 2}));
  parts.push(h('circle', {cx: r(sx), cy: r(sy), r: r(M.seal * 0.22), fill: '#fff'}));
  const tx = M.pad + M.seal * 2 + F * 0.5;
  if (M.showText) parts.push(textAt(f.title, {x: tx, y: M.header.y + (M.header.h - f.title.height) / 2, fill: INK, name: `${P}-title`}));
  else parts.push(h('rect', {x: r(tx), y: r(sy - F * 0.3), width: r((M.w - M.pad - tx) * 0.8), height: r(F * 0.6), rx: r(F * 0.3), fill: INK, opacity: 0.7}));
  parts.push(h('line', {x1: r(M.pad), x2: r(M.w - M.pad), y1: r(M.sep), y2: r(M.sep), stroke: th.paperLine, 'stroke-width': 2}));
  parts.push(h('path', {d: roundRectPath(M.ref.x, M.ref.y, M.ref.w, M.ref.h, Math.min(M.ref.h / 2, F * 0.6)), fill: th.paperShade, stroke: SLATE, 'stroke-width': 2}));
  if (M.showText) parts.push(textAt(f.ref, {x: M.ref.x + F * 0.7, y: M.ref.y + F * 0.3, fill: INK, name: `${P}-ref-t`}));
  else parts.push(h('rect', {x: r(M.ref.x + F * 0.6), y: r(M.ref.y + M.ref.h / 2 - F * 0.2), width: r(M.ref.w - F * 1.2), height: r(F * 0.4), rx: r(F * 0.2), fill: SLATE, opacity: 0.55}));
  if (M.showText) parts.push(textAt(f.grounds, {x: M.grounds.x, y: M.grounds.y, fill: '#3d4650', name: `${P}-grounds`, italic: true}));
  else for (let b = 0; b < 2; b++) parts.push(h('rect', {x: r(M.grounds.x), y: r(M.grounds.y + F * 0.1 + b * F * 0.62), width: r(M.grounds.w * (b ? 0.5 : 0.85)), height: r(F * 0.34), rx: r(F * 0.17), fill: '#8c959f', opacity: 0.6}));
  return g({name: P}, parts);
}

/* ------------------------------------------------------------------ */
/* End cards (same size for every route)                               */
/* ------------------------------------------------------------------ */

/**
 * Model of the end cards (one shared size). `alt` = {index, text}: an alternative end entry for one route (inspect) —
 * the card is sized for both values.
 * @param {any} P
 * @param {{w:number, F:number, showText:boolean, minF?:number, alt?:{index:number, text:string}|null, routes?:any[]}} o
 */
export function endModel(P, o) {
  const {w, F} = o;
  const st = o.showText;
  const minF = o.minF ?? F;
  const routes = o.routes || P.routes;
  const pad = Math.max(12, F * 0.7);
  const inner = w - pad * 2;
  const badgeR = F * 0.9;
  let ok = true;
  const fits = routes.map((rt, i) => {
    if (!st) return {};
    const f = {
      label: fitG(rt.label, {maxWidth: inner - badgeR * 2 - F * 0.5, size: F, minSize: minF, maxLines: 3, weight: 700}),
      end: fitG(rt.end, {maxWidth: inner, size: F, minSize: minF, maxLines: 5, weight: 500}),
    };
    if (o.alt && o.alt.index === i) f.alt = fitG(o.alt.text, {maxWidth: inner, size: F, minSize: minF, maxLines: 5, weight: 500});
    for (const v of Object.values(f)) if (!v.ok) ok = false;
    return f;
  });
  const maxH = key => Math.max(0, ...fits.map(f => (f[key] ? f[key].height : 0)));
  let y = pad;
  const header = {y, h: Math.max(badgeR * 2, st ? maxH('label') : F * 1.3)};
  y += header.h + F * 0.4;
  const sep = y;
  y += F * 0.4;
  const end = {x: pad, y, w: inner, h: st ? Math.max(maxH('end'), maxH('alt')) : F * 1.3};
  y += end.h + pad * 0.9;
  return {w, h: y, F, pad, inner, badgeR, fits, header, sep, end, showText: st, ok};
}

/**
 * End card of route i (local origin = top-left). Named nodes: `${prefix}` (group), `${prefix}-st` (supplied-state
 * badge, starts hidden), `${prefix}-label`, `${prefix}-end` (end entry), `${prefix}-alt` (alternative entry, hidden).
 */
export function endNode(ctx, M, i, route, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const F = M.F;
  const f = M.fits[i] || {};
  const parts = [];
  if (o.shadow !== false) parts.push(h('path', {d: roundRectPath(5, 7, M.w, M.h, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, M.w, M.h, 10), fill: th.paper, stroke: INK, 'stroke-width': 2.5}));
  const bx = M.pad + M.badgeR, by = M.header.y + M.header.h / 2;
  // neutral badge (before the route is marked) and the supplied-state badge laid over it
  parts.push(h('circle', {cx: r(bx), cy: r(by), r: r(M.badgeR), fill: th.paperShade, stroke: SLATE, 'stroke-width': 2.2}));
  const sc = stateColor(th, route.state);
  parts.push(g({name: `${P}-st`, opacity: o.stateOn ? 1 : 0},
    h('circle', {cx: r(bx), cy: r(by), r: r(M.badgeR), fill: sc, stroke: INK, 'stroke-width': 2.2}),
    g({transform: T(bx, by)}, markGlyph(stateGlyph(route.state), M.badgeR * 0.42, {fill: '#fff', stroke: sc}))));
  const tx = M.pad + M.badgeR * 2 + F * 0.5;
  if (M.showText) parts.push(textAt(f.label, {x: tx, y: M.header.y + (M.header.h - f.label.height) / 2, fill: INK, name: `${P}-label`}));
  else if (o.num) parts.push(h('text', {name: `${P}-num`, x: r(tx), y: r(by + o.num.size * 0.36), 'font-family': FONTS.sans, 'font-size': r(o.num.size, 2), 'font-weight': 800, fill: INK}, o.num.text));
  else parts.push(h('rect', {x: r(tx), y: r(by - F * 0.28), width: r((M.w - M.pad - tx) * 0.75), height: r(F * 0.56), rx: r(F * 0.28), fill: INK, opacity: 0.7}));
  parts.push(h('line', {x1: r(M.pad), x2: r(M.w - M.pad), y1: r(M.sep), y2: r(M.sep), stroke: th.paperLine, 'stroke-width': 2}));
  if (M.showText) {
    if (!o.skipEnd) parts.push(textAt(f.end, {x: M.end.x, y: M.end.y, fill: '#2f3740', name: `${P}-end`}));
    if (f.alt && !o.skipEnd) parts.push(textAt(f.alt, {x: M.end.x, y: M.end.y, fill: '#2f3740', name: `${P}-alt`, opacity: 0}));
  } else {
    parts.push(g({name: `${P}-endbars`}, [0, 1].map(b => h('rect', {x: r(M.end.x), y: r(M.end.y + F * 0.1 + b * F * 0.62), width: r(M.end.w * (b ? 0.45 : 0.82)), height: r(F * 0.34), rx: r(F * 0.17), fill: '#8c959f', opacity: 0.6}))));
  }
  return g({name: P}, parts);
}

/* ------------------------------------------------------------------ */
/* Route map plan                                                      */
/* ------------------------------------------------------------------ */

/** Track width, filter-clip size and puck radius for a text size F. */
export function trackDims(F) {
  const tw = clamp(F * 0.95, 11, 28);
  return {tw, along: Math.max(F * 1.5, 16), across: tw * 2.9, puck: Math.max(F * 0.8, 11)};
}

/**
 * Plan of the route map (block-local units): the starting resolution O, the end cards E[i], one track per route
 * (orthogonal polyline from a port on O to its end card — the tracks never cross), the filter-clip place on each
 * track, the clip tray and the calendar in the free space beside O.
 *  orient 'h': O on the left, end cards in a column on the right; tray below O, calendar above it.
 *  orient 'v': O at the top, end cards in a row below; tray left of O, calendar right of it.
 * @param {any} P
 * @param {ReturnType<typeof originModel>} OM
 * @param {ReturnType<typeof endModel>} EM
 * @param {{F:number, orient:'h'|'v', gap:number, slots:number, cal?:boolean, tray?:boolean}} o
 */
export function mapPlan(P, OM, EM, o) {
  const F = o.F;
  const n = (o.routes || P.routes).length;
  const D = trackDims(F);
  const {tw, along, across} = D;
  const calW = F * 3.4, calH = calW * 0.84;
  const slots = Math.max(1, o.slots);
  const sGap = F * 0.45;
  const gv = Math.max(F * 0.8, 14);
  const gx = o.gx ?? Math.max(F * 0.8, 14);
  const useCal = o.cal !== false, useTray = o.tray !== false;
  const ow = OM.w, oh = OM.h, ew = EM.w, eh = EM.h;
  let O, E = [], tray = null, cal = null, slotsAt = [], needW, needH, routes = [];
  let pg;
  if (o.orient === 'h') {
    const colH = n * eh + (n - 1) * gx;
    const trayW = slots * along + (slots + 1) * sGap, trayH = across + F * 0.7;
    // tray and calendar share one row under O
    const rowW = (useTray ? trayW : 0) + (useTray && useCal ? F * 0.9 : 0) + (useCal ? calW : 0);
    const rowH = Math.max(useTray ? trayH : 0, useCal ? calH : 0);
    const leftH = oh + (rowW ? gv + rowH : 0);
    const H = Math.max(colH, leftH);
    const oy = clamp((H - leftH) / 2, 0, H - leftH);
    O = {x: 0, y: oy, w: ow, h: oh};
    const ey0 = (H - colH) / 2;
    for (let i = 0; i < n; i++) E.push({x: ow + o.gap, y: ey0 + i * (eh + gx), w: ew, h: eh});
    pg = Math.min(Math.max(F * 1.9, tw * 1.7), (oh - F * 1.4) / Math.max(1, n - 1));
    const xm = ow + o.gap * 0.36;
    for (let i = 0; i < n; i++) {
      const py = O.y + oh / 2 + (i - (n - 1) / 2) * pg;
      const ey = E[i].y + eh / 2;
      const pts = Math.abs(py - ey) < 1 ? [{x: ow, y: ey}, {x: E[i].x, y: ey}] : [{x: ow, y: py}, {x: xm, y: py}, {x: xm, y: ey}, {x: E[i].x, y: ey}];
      const fx = xm + (E[i].x - xm) * 0.56;
      routes.push({pts, clip: {x: fx - along / 2, y: ey - across / 2, w: along, h: across}, clipC: {x: fx, y: ey}});
    }
    const rx = Math.max(0, (ow - rowW) / 2), ry = O.y + oh + gv;
    if (useTray) {
      tray = {x: rx, y: ry + (rowH - trayH) / 2, w: trayW, h: trayH};
      for (let k = 0; k < slots; k++) slotsAt.push({x: tray.x + sGap + along / 2 + k * (along + sGap), y: tray.y + trayH / 2});
    }
    if (useCal) cal = {x: rx + (useTray ? trayW + F * 0.9 : 0), y: ry + (rowH - calH) / 2, w: calW, h: calH};
    needW = ow + o.gap + ew;
    needH = H;
  } else {
    const rowW = n * ew + (n - 1) * gx;
    const trayW = across + F * 0.7, trayH = slots * along + (slots + 1) * sGap;
    const sideW = Math.max(useCal ? calW : 0, useTray ? trayW : 0);
    const topH = Math.max(oh, useCal ? calH : 0, useTray ? trayH : 0);
    const W = Math.max(rowW, ow + 2 * (sideW + F * 0.9));
    O = {x: (W - ow) / 2, y: (topH - oh) / 2, w: ow, h: oh};
    const ex0 = (W - rowW) / 2;
    for (let i = 0; i < n; i++) E.push({x: ex0 + i * (ew + gx), y: topH + o.gap, w: ew, h: eh});
    pg = Math.min(Math.max(F * 1.9, tw * 1.7), (ow - F * 1.4) / Math.max(1, n - 1));
    const ym = O.y + oh + (E[0].y - (O.y + oh)) * 0.36;
    for (let i = 0; i < n; i++) {
      const px = O.x + ow / 2 + (i - (n - 1) / 2) * pg;
      const ex = E[i].x + ew / 2;
      const pts = Math.abs(px - ex) < 1 ? [{x: ex, y: O.y + oh}, {x: ex, y: E[i].y}] : [{x: px, y: O.y + oh}, {x: px, y: ym}, {x: ex, y: ym}, {x: ex, y: E[i].y}];
      const fy = ym + (E[i].y - ym) * 0.56;
      routes.push({pts, clip: {x: ex - across / 2, y: fy - along / 2, w: across, h: along}, clipC: {x: ex, y: fy}});
    }
    if (useTray) {
      tray = {x: O.x - F * 0.9 - trayW, y: (topH - trayH) / 2, w: trayW, h: trayH};
      for (let k = 0; k < slots; k++) slotsAt.push({x: tray.x + trayW / 2, y: tray.y + sGap + along / 2 + k * (along + sGap)});
    }
    if (useCal) cal = {x: O.x + ow + F * 0.9, y: (topH - calH) / 2, w: calW, h: calH};
    needW = W;
    needH = topH + o.gap + eh;
  }
  for (const rt of routes) {
    rt.poly = polyline(rt.pts);
    rt.len = rt.poly.total;
    rt.d = rt.poly.d(2);
    // chevrons every ~3 F along the track, clear of the corners and of the ends
    const corners = rt.pts.slice(1, -1);
    const chev = [];
    const step = Math.max(F * 2.6, 40);
    for (let s = F * 1.6; s <= rt.len - F * 1.4; s += step) {
      const p = rt.poly.at(s / rt.len);
      if (corners.some(c => Math.hypot(c.x - p.x, c.y - p.y) < tw * 1.1)) continue;
      chev.push({s, x: p.x, y: p.y, a: (p.a * 180) / Math.PI});
    }
    rt.chev = chev;
  }
  const portOk = n < 2 || pg >= tw * 1.55;
  const legOk = routes.every(rt => {
    const last = rt.pts[rt.pts.length - 2], end = rt.pts[rt.pts.length - 1];
    return Math.hypot(end.x - last.x, end.y - last.y) >= along * 2.6;
  });
  return {F, n, O, E, routes, tray, cal, slotsAt, needW, needH, D, ok: portOk && legOk, problems: [!portOk && 'ports', !legOk && 'leg'].filter(Boolean)};
}

/** Offset every box/point of a plan by (dx, dy) (returns a new plan; polylines are rebuilt). */
export function shiftPlan(pl, dx, dy) {
  const sb = b => (b ? {...b, x: b.x + dx, y: b.y + dy} : b);
  const sp = p => ({...p, x: p.x + dx, y: p.y + dy});
  const routes = pl.routes.map(rt => {
    const pts = rt.pts.map(sp);
    const poly = polyline(pts);
    return {...rt, pts, poly, d: poly.d(2), clip: sb(rt.clip), clipC: sp(rt.clipC), chev: rt.chev.map(sp)};
  });
  return {...pl, O: sb(pl.O), E: pl.E.map(sb), tray: sb(pl.tray), cal: sb(pl.cal), slotsAt: pl.slotsAt.map(sp), routes};
}

/** Bounds of a plan (block-local). */
export function planBounds(pl) {
  const bs = [pl.O, ...pl.E, pl.tray, pl.cal].filter(Boolean);
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y));
  const x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

/* ------------------------------------------------------------------ */
/* Art: tracks, chevrons, filter clip, puck, tray, folder              */
/* ------------------------------------------------------------------ */

/** A printed track (outline + pale band). Named `${prefix}`. */
export function trackNode(ctx, rt, D, o) {
  return g({name: o.prefix},
    h('path', {d: rt.d, fill: 'none', stroke: SLATE, 'stroke-width': r(D.tw + 4, 2), 'stroke-linejoin': 'round', 'stroke-linecap': 'butt'}),
    h('path', {d: rt.d, fill: 'none', stroke: TRACK, 'stroke-width': r(D.tw, 2), 'stroke-linejoin': 'round', 'stroke-linecap': 'butt'}));
}

/** Ink laid along a track as it is traced (dash-revealed). Named `${prefix}`. */
export function inkNode(ctx, rt, D, o) {
  return h('path', {name: o.prefix, d: rt.d, fill: 'none', stroke: o.color, 'stroke-width': r(D.tw * 0.62, 2), 'stroke-linejoin': 'round', 'stroke-linecap': 'butt', 'stroke-dasharray': `${r(rt.len, 1)} ${r(rt.len + 20, 1)}`, 'stroke-dashoffset': r(rt.len, 1)});
}

/** A direction chevron (local origin = centre, pointing +x). */
export function chevron(D, o = {}) {
  const k = D.tw * 0.3;
  return h('path', {name: o.name, d: `M${r(-k * 0.7)} ${r(-k)}L${r(k * 0.5)} 0L${r(-k * 0.7)} ${r(k)}`, fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(2.4, D.tw * 0.16), 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: o.transform, opacity: o.opacity});
}

/**
 * Filter clip (local origin = centre). vertical: long side vertical (laid across a horizontal track). A neutral glass
 * pane with a grip tab at one end; it carries no text and no verdict sign.
 */
export function filterClip(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const gc = th.accent3;
  const vert = hh >= w;
  const tab = (vert ? hh : w) * 0.22;
  const glass = vert ? {x: -w / 2, y: -hh / 2 + tab - 2, w, h: hh - tab + 2} : {x: -w / 2 + tab - 2, y: -hh / 2, w: w - tab + 2, h: hh};
  const tabR = vert ? {x: -w / 2 - 2, y: -hh / 2, w: w + 4, h: tab} : {x: -w / 2, y: -hh / 2 - 2, w: tab, h: hh + 4};
  return g({name: o.prefix},
    o.shadow === false ? null : h('rect', {x: r(glass.x + 4), y: r(glass.y + 5), width: r(glass.w), height: r(glass.h), rx: 5, fill: th.shadow}),
    h('rect', {x: r(glass.x), y: r(glass.y), width: r(glass.w), height: r(glass.h), rx: 5, fill: gc, 'fill-opacity': 0.32, stroke: shade(gc, -0.35), 'stroke-width': 2.4}),
    vert ? h('line', {x1: r(glass.x + 4), x2: r(glass.x + 4), y1: r(glass.y + 6), y2: r(glass.y + glass.h - 6), stroke: '#fff', 'stroke-width': 2.2, opacity: 0.6})
      : h('line', {x1: r(glass.x + 6), x2: r(glass.x + glass.w - 6), y1: r(glass.y + 4), y2: r(glass.y + 4), stroke: '#fff', 'stroke-width': 2.2, opacity: 0.6}),
    h('rect', {x: r(tabR.x), y: r(tabR.y), width: r(tabR.w), height: r(tabR.h), rx: 4, fill: SLATE, stroke: INK, 'stroke-width': 2}),
    g({transform: T(vert ? 0 : -w / 2 + tab / 2, vert ? -hh / 2 + tab / 2 : 0)}, markGlyph('b', Math.min(w, hh) * 0.16, {fill: shade(gc, 0.2), stroke: SLATE, sw: 1})));
}

/** Grip point of a filter clip (its tab), relative to its centre. */
export function clipGrip(c) {
  const vert = c.h >= c.w;
  const tab = (vert ? c.h : c.w) * 0.22;
  return vert ? {x: 0, y: -c.h / 2 + tab / 2} : {x: -c.w / 2 + tab / 2, y: 0};
}

/** Tracing puck (local origin = centre): a weighted disc with a pointer notch. */
export function puckNode(ctx, R, o = {}) {
  const th = ctx.theme;
  return g({name: o.name},
    h('circle', {cx: 3, cy: 5, r: r(R), fill: th.shadow}),
    h('circle', {r: r(R), fill: '#f6f3ec', stroke: INK, 'stroke-width': 2.5}),
    h('circle', {r: r(R * 0.62), fill: th.accent2, stroke: INK, 'stroke-width': 2}),
    h('circle', {r: r(R * 0.2), fill: '#fff'}));
}

/** Clip tray (local origin = top-left). */
export function trayNode(ctx, b, o = {}) {
  const th = ctx.theme;
  return g({name: o.name},
    h('path', {d: roundRectPath(4, 5, b.w, b.h, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, b.w, b.h, 10), fill: shade(th.paperShade, -0.04), stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(5, 5, b.w - 10, b.h - 10, 7), fill: 'none', stroke: th.paperLine, 'stroke-width': 2}));
}

/** Desk calendar (local origin = top-left). Blank grid: no date is marked. */
export function calendarNode(ctx, o) {
  return g({name: o.prefix},
    h('path', {d: roundRectPath(5, 7, o.w, o.h, 8), fill: ctx.theme.shadow}),
    calendarArt(ctx, o.w, o.h, true));
}

/**
 * The open case file (local origin = top-left of the folder body; the tab sticks out ABOVE it by `tabH`). The tab
 * prints the supplied file label (named `${prefix}-tab-t`).
 */
export function folderNode(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, tabW, tabH} = o;
  const c = 16;
  const tx = Math.min(w * 0.06, 40);
  const tabD = `M${r(tx)} 2V${r(-tabH + 10)}Q${r(tx)} ${r(-tabH)} ${r(tx + 10)} ${r(-tabH)}H${r(tx + tabW - 10)}Q${r(tx + tabW)} ${r(-tabH)} ${r(tx + tabW)} ${r(-tabH + 10)}V2Z`;
  const ins = Math.max(10, (o.F || 20) * 0.5);
  return g({name: o.prefix},
    h('path', {d: roundRectPath(7, 10, w, hh, c), fill: th.shadow}),
    h('path', {d: tabD, fill: shade(MANILA, -0.06), stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(0, 0, w, hh, c), fill: MANILA, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(ins, ins, w - 2 * ins, hh - 2 * ins, c * 0.6), fill: shade(th.paper, 0.02), stroke: shade(MANILA, -0.25), 'stroke-width': 2}),
    o.labelFit ? textAt(o.labelFit, {x: tx + (tabW - o.labelFit.width) / 2, y: -tabH + (tabH - o.labelFit.height) / 2 + 1, fill: INK, name: `${o.prefix}-tab-t`})
      : h('rect', {x: r(tx + tabW * 0.18), y: r(-tabH / 2 - 4), width: r(tabW * 0.64), height: 8, rx: 4, fill: INK, opacity: 0.55}));
}

/* ------------------------------------------------------------------ */
/* Legend icons and panel                                              */
/* ------------------------------------------------------------------ */

/** Legend icon (size s, local origin = icon centre). Motif kinds first, then the review-06 kit's generic icons. */
export function legendIcon(ctx, kind, s, o = {}) {
  const th = ctx.theme;
  const k = s / 2;
  if (kind === 'concluded' || kind === 'pending') {
    const st = kind;
    const col = stateColor(th, st);
    return g(null,
      h('circle', {r: r(k * 0.72), fill: col, stroke: INK, 'stroke-width': 2}),
      markGlyph(stateGlyph(st), k * 0.3, {fill: '#fff', stroke: col}));
  }
  if (kind === 'trace') {
    return g(null,
      h('path', {d: `M${r(-k)} 0H${r(k)}`, stroke: SLATE, 'stroke-width': r(k * 0.75 + 3, 2)}),
      h('path', {d: `M${r(-k)} 0H${r(k)}`, stroke: th.accent2, 'stroke-width': r(k * 0.5, 2)}),
      h('path', {d: `M${r(-k * 0.15)} ${r(-k * 0.2)}L${r(k * 0.2)} 0L${r(-k * 0.15)} ${r(k * 0.2)}`, fill: 'none', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
  }
  if (kind === 'clip') {
    return g(null,
      h('path', {d: `M${r(-k)} 0H${r(k)}`, stroke: SLATE, 'stroke-width': r(k * 0.75 + 3, 2)}),
      h('path', {d: `M${r(-k)} 0H${r(k)}`, stroke: TRACK, 'stroke-width': r(k * 0.75, 2)}),
      filterClip(ctx, {w: k * 0.62, h: k * 1.7, shadow: false}));
  }
  if (kind === 'puck') return puckNode(ctx, k * 0.62);
  if (kind === 'file') {
    return g(null,
      h('path', {d: `M${r(-k)} ${r(-k * 0.5)}V${r(-k * 0.8)}H${r(-k * 0.2)}V${r(-k * 0.5)}`, fill: shade(MANILA, -0.06), stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-k), y: r(-k * 0.55), width: r(s), height: r(k * 1.4), rx: 3, fill: MANILA, stroke: INK, 'stroke-width': 2}));
  }
  if (kind === 'origin') {
    return g(null,
      h('rect', {x: r(-k * 0.75), y: r(-k), width: r(k * 1.5), height: r(s), rx: 3, fill: th.paper, stroke: INK, 'stroke-width': 2}),
      h('circle', {cx: r(-k * 0.3), cy: r(-k * 0.45), r: r(k * 0.28), fill: SLATE}),
      h('rect', {x: r(-k * 0.55), y: r(k * 0.1), width: r(k * 1.1), height: r(k * 0.22), rx: 1, fill: INK, opacity: 0.6}));
  }
  if (kind === 'end') {
    return g(null,
      h('rect', {x: r(-k), y: r(-k * 0.7), width: r(s), height: r(k * 1.4), rx: 3, fill: th.paper, stroke: INK, 'stroke-width': 2}),
      h('circle', {cx: r(-k * 0.5), cy: r(-k * 0.2), r: r(k * 0.24), fill: th.paperShade, stroke: SLATE, 'stroke-width': 1.5}),
      h('rect', {x: r(-k * 0.6), y: r(k * 0.22), width: r(k * 1.2), height: r(k * 0.2), rx: 1, fill: INK, opacity: 0.55}));
  }
  if (kind === 'filter') return filterClip(ctx, {w: k * 1.7, h: k * 0.75, shadow: false});
  return ciIcon(ctx, kind, s, o);
}

/** Panel node (local origin = top-left). Every row is a named group (`row.name`). */
export function panelNode(ctx, PL, o = {}) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    const cw = PL.colW ?? PL.w;
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, Math.min(cw, row.fit.width + F * 1.2), row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(Math.min(cw, row.fit.width + F * 0.5)), y1: r(row.y - F * 0.3), y2: r(row.y - F * 0.3), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.7}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.75, row.y + Math.min(row.fit.height, F * 1.2) / 2 + (row.fit.lines.length > 1 ? 0 : F * 0.05))}, legendIcon(ctx, row.icon, F * 1.2, {color: row.color, skin: o.skin})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y + (row.h - row.fit.height) / 2, fill: th.fg}));
    }
    return g({name: row.name, transform: row.x ? T(row.x, 0) : undefined}, parts);
  });
}

/** Ink colour for a traced route (lane A). */
export const inkColor = th => th.accent2;

export {clamp};
