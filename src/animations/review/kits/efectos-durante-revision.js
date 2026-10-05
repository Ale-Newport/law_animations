/**
 * "Efectos durante revisión" kit (LAW-0353..0356, review-09): geometry, art and text helpers shared by the four entries.
 *
 * The motif's objects (all original vector art):
 *  - Two LANES (carriles), drawn as grooved tracks that never touch: the PROCESS lane (● accent2 stripe) and the
 *    REVIEW lane (◆ accent3 stripe — never red or green). Each lane starts with its glyph disc and ends in a neutral
 *    end slot of the same size and weight.
 *  - RESOLUCIONES: two cards of the SAME size — the decision card (●, placeholder title and reference) that advances
 *    along the process lane, and the appeal card (◆, the supplied grounds line) that advances along the review lane.
 *  - FLECHAS: chevrons engraved along each lane. They only show the direction of travel within a lane. On the process
 *    lane the chevrons past the filter are "lit" (lane colour) while the supplied datum says the effect is maintained,
 *    and stay grey while it says the effect is suspended — a picture of the supplied datum, not of a rule.
 *  - FILTROS: a neutral slatted gate across the process lane. Its slats stand edge-on (open) or close into a wall
 *    (closed, with a neutral pause glyph ‖) according to the SUPPLIED datum only.
 *  - CALENDARIO: a small calendar, a fixture only (blank grid, no date marked, no time limit implied).
 *
 * Legal care (brief): whether the effects continue during the review is a SUPPLIED DATUM (`finalState`). The scenes
 * never explain why, never state a suspension doctrine, a date or a time limit, and never judge the decision or the
 * appeal. Fictional content, jurisdiction unspecified, `illustrative-unverified`.
 *
 * The kit owns fields, defaults, localisation, the card model and art, the lane / gate / tag art, the board plan and
 * legend helpers (re-using the accepted review-06 text and panel helpers). Each entry owns its composition, timeline
 * and semantics.
 * @module animations/review/kits/efectos-durante-revision
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, obj} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {
  fitG, textAt, markGlyph, calendarArt, calendarNode, panelLayout, panelNode, legendIcon, ringRect, overlaps, R2,
  localisedCi, noteColors, INK, SLATE,
} from './confirmacion-ilustrativa.js';

export {fitG, textAt, markGlyph, calendarArt, calendarNode, panelLayout, panelNode, legendIcon, ringRect, overlaps, R2, noteColors, INK, SLATE};

/* ------------------------------------------------------------------ */
/* Fields, defaults, localisation                                      */
/* ------------------------------------------------------------------ */

export const STATES = ['maintained', 'suspended'];

/** Category fields shared by the four entries (brief: decisions, grounds, routes, outcomes). */
export const edFields = {
  decisions: obj('The decision card that advances along the process lane (fictional; placeholder content)', {
    title: str('Fictional title printed on the decision card', 70),
    ref: str('Reference tag printed on the decision card (fictional)', 44),
  }, ['title', 'ref']),
  grounds: obj('The appeal card that advances along the review lane (fictional; placeholder content, never assessed)', {
    appeal: str('Grounds line printed on the appeal card (as supplied)', 80),
  }, ['appeal']),
  routes: obj('Captions of the two lanes (as configured; the lanes never cross and imply no hierarchy)', {
    process: str('Caption of the process lane (keep "as configured")', 80),
    review: str('Caption of the review lane (keep "as configured")', 80),
  }, ['process', 'review']),
  outcomes: obj('The two possible supplied data printed on the filter tag. The animation never infers which applies', {
    maintained: str('Tag text when the supplied datum says the effect is maintained', 90),
    suspended: str('Tag text when the supplied datum says the effect is suspended', 90),
  }, ['maintained', 'suspended']),
  labels: obj('Editable captions', {
    filter: str('Caption of the filter gate (it shows the supplied datum only)', 80),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['filter', 'key']),
};

export const ED_EN = {
  decisions: {title: 'Decision 1 (fictional)', ref: 'Ref. R-01 (fictional)'},
  grounds: {appeal: 'Appeal: placeholder grounds (as supplied)'},
  routes: {process: 'Process lane: the decision card (as configured)', review: 'Review lane: the appeal card (as configured)'},
  outcomes: {maintained: 'Effect maintained (supplied datum)', suspended: 'Effect suspended according to the data supplied'},
  labels: {filter: 'Filter gate: set by the supplied datum only', key: 'As supplied · no conclusion drawn'},
};

export const ED_ES = {
  decisions: {title: 'Resolución 1 (ficticia)', ref: 'Ref. R-01 (ficticia)'},
  grounds: {appeal: 'Recurso: motivos provisionales (según lo aportado)'},
  routes: {process: 'Carril del proceso: la resolución (según lo configurado)', review: 'Carril del recurso: el escrito (según lo configurado)'},
  outcomes: {maintained: 'Efecto mantenido (dato aportado)', suspended: 'Efecto suspendido según los datos aportados'},
  labels: {filter: 'Filtro: lo fija solo el dato aportado', key: 'Según lo aportado · sin conclusión'},
};

/** Untouched English defaults follow `locale: 'es'` (see review-06 `localisedCi`). */
export const localisedEd = localisedCi;

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

export const LANE_BED = '#e6e1d6';
export const GROOVE = '#cfc7b6';
export const CHEV_DIM = '#b3ab9b';
export const CARD = '#fffdf8';
/** Lane colour: process ● accent2 (slate blue), review ◆ accent3 (amber). Never red / green. */
export const laneColor = (th, i) => (i === 0 ? th.accent2 : th.accent3);
export const SIDE = ['a', 'b'];

/* ------------------------------------------------------------------ */
/* Cards (both cards share one size)                                   */
/* ------------------------------------------------------------------ */

/**
 * Card model for a width w and text size F. Both cards (decision ● / appeal ◆) get the same height.
 * @param {any} P localised params
 * @param {{w:number, F:number, showText:boolean, minH?:number}} o
 */
export function cardModel(P, o) {
  const {w, F} = o;
  const pad = Math.max(10, F * 0.55);
  const stripe = Math.max(16, F * 0.95);
  const tw = w - pad * 2;
  let ok = true;
  let dec = null, app = null;
  if (o.showText) {
    const title = fitG(P.decisions.title, {maxWidth: tw, size: F, maxLines: 3, weight: 700});
    const ref = fitG(P.decisions.ref, {maxWidth: tw - F * 0.8, size: F, maxLines: 2, weight: 500});
    const gr = fitG(P.grounds.appeal, {maxWidth: tw, size: F, maxLines: 4, weight: 500});
    ok = title.ok && ref.ok && gr.ok;
    const refH = ref.height + F * 0.5;
    dec = {title, ref, refH, h: title.height + F * 0.45 + refH};
    app = {gr, h: gr.height};
  }
  const bodyH = o.showText ? Math.max(dec.h, app.h) : F * 2.6;
  const hh = Math.max(o.minH ?? 0, stripe + pad * 1.6 + bodyH, w * 0.42);
  return {w, h: hh, F, pad, stripe, tw, dec, app, ok, showText: o.showText};
}

/**
 * Card art (local origin = top-left). kind 0 = decision (●), 1 = appeal (◆, folded corner). Text nodes named
 * `${prefix}-t*` so tests can find them.
 */
export function cardNode(ctx, M, kind, o = {}) {
  const th = ctx.theme;
  const col = laneColor(th, kind);
  const {w, h: hh, pad, stripe, F} = M;
  const fold = kind === 1 ? Math.min(w, hh) * 0.16 : 0;
  const body = kind === 1
    ? `M6 0H${r(w - fold)}L${r(w)} ${r(fold)}V${r(hh - 6)}Q${r(w)} ${r(hh)} ${r(w - 6)} ${r(hh)}H6Q0 ${r(hh)} 0 ${r(hh - 6)}V6Q0 0 6 0Z`
    : roundRectPath(0, 0, w, hh, 8);
  const parts = [
    h('path', {d: kind === 1 ? body : roundRectPath(6, 8, w, hh, 8), fill: th.shadow, transform: kind === 1 ? T(6, 8) : undefined}),
    h('path', {d: body, fill: CARD, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M2 ${r(stripe)}V8Q2 2 8 2H${r(w - fold - 2)}${kind === 1 ? `L${r(w - fold * 0.25)} ${r(Math.min(stripe, fold * 0.75))}` : `Q${r(w - 2)} 2 ${r(w - 2)} 8`}V${r(stripe)}Z`, fill: col, opacity: 0.92}),
    g({transform: T(pad + stripe * 0.35, stripe / 2 + 1)}, markGlyph(SIDE[kind], stripe * 0.3, {fill: '#fff', stroke: col, sw: 1.4})),
  ];
  if (kind === 1) parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold)}H${r(w)}`, fill: shade(CARD, -0.08), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  const y0 = stripe + pad * 0.8;
  if (M.showText) {
    if (kind === 0) {
      parts.push(textAt(M.dec.title, {name: `${o.prefix}-t0`, x: pad, y: y0, fill: INK}));
      const ry = y0 + M.dec.title.height + F * 0.45;
      parts.push(h('path', {d: roundRectPath(pad - 2, ry, M.dec.ref.width + F * 0.8, M.dec.refH, F * 0.3), fill: shade(col, 0.82), stroke: SLATE, 'stroke-width': 1.6}));
      parts.push(textAt(M.dec.ref, {name: `${o.prefix}-t1`, x: pad - 2 + F * 0.4, y: ry + F * 0.25, fill: INK}));
    } else {
      parts.push(textAt(M.app.gr, {name: `${o.prefix}-t0`, x: pad, y: y0, fill: INK}));
    }
  } else {
    const n = 3;
    const bh = Math.max(6, F * 0.42);
    const gap = (hh - y0 - pad - n * bh) / Math.max(1, n - 1);
    for (let i = 0; i < n; i++) parts.push(h('rect', {x: r(pad), y: r(y0 + i * (bh + Math.max(4, Math.min(gap, bh * 1.6)))), width: r((w - pad * 2) * (i === n - 1 ? 0.55 : 0.92)), height: r(bh), rx: r(bh / 2), fill: shade(SLATE, 0.62)}));
  }
  return g({name: o.prefix}, parts);
}

/* ------------------------------------------------------------------ */
/* Lane, chevrons, end slot (lane-local: axis along +x, across along +y) */
/* ------------------------------------------------------------------ */

/**
 * Lane art in lane-local coordinates (length len along x, width wd across y). Chevrons at the supplied axis positions;
 * `lit` chevrons get a second, lit layer named `${prefix}-lit${i}` (opacity animated by the entry).
 * @param {any} ctx
 * @param {{prefix:string, i:number, len:number, wd:number, F:number, chev:number[], lit?:number[], disc:number, endT:number, along:number, pad:number}} o
 */
export function laneArt(ctx, o) {
  const th = ctx.theme;
  const col = laneColor(th, o.i);
  const {len, wd, F} = o;
  const cs = Math.min(wd * 0.22, F * 1.1);
  const chevPath = x => `M${r(x - cs * 0.45)} ${r(wd / 2 - cs)}L${r(x + cs * 0.45)} ${r(wd / 2)}L${r(x - cs * 0.45)} ${r(wd / 2 + cs)}`;
  const parts = [
    h('path', {d: roundRectPath(4, 6, len, wd, wd * 0.18), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, len, wd, wd * 0.18), fill: LANE_BED, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(o.pad * 0.45, o.pad * 0.45, len - o.pad * 0.9, wd - o.pad * 0.9, wd * 0.14), fill: GROOVE, opacity: 0.55}),
    h('rect', {x: 0, y: r(-1), width: r(len), height: r(Math.max(5, F * 0.3)), rx: 2, fill: col, opacity: 0.9}),
  ];
  for (const x of [...o.chev, ...(o.lit || [])]) parts.push(h('path', {d: chevPath(x), fill: 'none', stroke: CHEV_DIM, 'stroke-width': Math.max(4, F * 0.28), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  // end slot: an outlined bay of the card's size (same weight on both lanes)
  parts.push(h('path', {d: roundRectPath(o.endT - 6, o.pad - 6, o.along + 12, wd - o.pad * 2 + 12, 10), fill: 'none', stroke: shade(SLATE, 0.35), 'stroke-width': 3, 'stroke-dasharray': undefined}));
  // start disc with the lane glyph
  const dR = o.disc / 2;
  parts.push(h('circle', {cx: r(o.pad + dR), cy: r(wd / 2), r: r(dR), fill: col, stroke: INK, 'stroke-width': 2.4}));
  parts.push(g({transform: T(o.pad + dR, wd / 2)}, markGlyph(SIDE[o.i], dR * 0.42, {fill: '#fff', stroke: col, sw: 1.5})));
  const lit = (o.lit || []).map((x, k) => h('path', {name: `${o.prefix}-lit${k}`, d: chevPath(x), fill: 'none', stroke: col, 'stroke-width': Math.max(5, F * 0.34), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}));
  return g({name: o.prefix}, parts, lit);
}

/* ------------------------------------------------------------------ */
/* Filter gate (gate-local: centred, thickness along x, span along y)  */
/* ------------------------------------------------------------------ */

export const SLATS = 4;

/**
 * Slatted filter gate across a lane. Local origin = gate centre; thickness th along x, span sp along y (posts stick
 * out beyond the lane). Slats named `${prefix}-slat${i}` (transform: `scale(k 1)` with k = slatK(open)); the neutral
 * pause glyph `${prefix}-pause` sits on the near post.
 */
export function gateArt(ctx, o) {
  const th = ctx.theme;
  const {thk, sp, F} = o;
  const post = Math.max(12, thk * 0.55);
  const inner = sp - post * 2;
  const sh = inner / SLATS;
  const slats = [];
  for (let i = 0; i < SLATS; i++) {
    const cy = -inner / 2 + sh * (i + 0.5);
    slats.push(g({transform: T(0, cy)}, g({name: `${o.prefix}-slat${i}`, transform: 'scale(1 1)'},
      h('rect', {x: r(-thk * 0.42), y: r(-sh * 0.5 + 1.5), width: r(thk * 0.84), height: r(sh - 3), rx: 3, fill: '#c9d2da', stroke: SLATE, 'stroke-width': 2}))));
  }
  const pr = Math.max(F * 0.7, post * 0.75);
  return g({name: o.prefix},
    h('rect', {x: r(-thk * 0.08), y: r(-inner / 2), width: r(thk * 0.16), height: r(inner), fill: SLATE, opacity: 0.8}),
    slats,
    h('rect', {x: r(-thk / 2), y: r(-sp / 2), width: r(thk), height: r(post), rx: 4, fill: SLATE, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(-thk / 2), y: r(sp / 2 - post), width: r(thk), height: r(post), rx: 4, fill: SLATE, stroke: INK, 'stroke-width': 2.2}),
    g({name: `${o.prefix}-pause`, opacity: 0, transform: T(0, -sp / 2 - pr * 0.2)},
      h('circle', {r: r(pr), fill: '#fff', stroke: INK, 'stroke-width': 2.4}),
      h('rect', {x: r(-pr * 0.42), y: r(-pr * 0.45), width: r(pr * 0.28), height: r(pr * 0.9), rx: 1.5, fill: INK}),
      h('rect', {x: r(pr * 0.14), y: r(-pr * 0.45), width: r(pr * 0.28), height: r(pr * 0.9), rx: 1.5, fill: INK})),
  );
}

/** Slat thickness factor: edge-on (open, 0.2) → wall (closed, 1). */
export const slatK = closed => r(0.2 + 0.8 * clamp(closed), 3);

/** Frame record for the gate's slats and pause glyph. */
export function gateFrame(prefix, closed, pauseOp = closed) {
  const out = {};
  const k = slatK(closed);
  for (let i = 0; i < SLATS; i++) out[`${prefix}-slat${i}`] = {transform: `scale(${k} 1)`};
  out[`${prefix}-pause`] = {opacity: r(clamp(pauseOp), 3)};
  return out;
}

/* ------------------------------------------------------------------ */
/* Datum tag (hangs from the gate)                                     */
/* ------------------------------------------------------------------ */

/**
 * Tag model: fits both data texts so the tag never resizes when the datum changes.
 * @param {any} P
 * @param {{w:number, F:number}} o
 */
export function tagModel(P, o) {
  const pad = o.F * 0.5;
  const fits = STATES.map(s => fitG(P.outcomes[s], {maxWidth: o.w - pad * 2 - o.F * 1.4, size: o.F, maxLines: 4, weight: 600}));
  const hh = Math.max(...fits.map(f => f.height)) + pad * 2;
  return {w: o.w, h: Math.max(hh, o.F * 2.2), pad, fits, ok: fits.every(f => f.ok), F: o.F};
}

/** Tag art (local origin = top-left). Texts named `${prefix}-v0` / `${prefix}-v1` (opacity animated by the entry). */
export function tagNode(ctx, TM, o) {
  const th = ctx.theme;
  const holeX = TM.F * 0.7;
  return g({name: o.prefix},
    h('path', {d: roundRectPath(4, 5, TM.w, TM.h, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, TM.w, TM.h, 10), fill: '#fff', stroke: INK, 'stroke-width': 2.4}),
    h('circle', {cx: r(holeX), cy: r(TM.h / 2), r: r(TM.F * 0.26), fill: th.paperShade, stroke: INK, 'stroke-width': 1.8}),
    o.showText ? TM.fits.map((f, i) => textAt(f, {name: `${o.prefix}-v${i}`, x: TM.F * 1.4, y: (TM.h - f.height) / 2, fill: INK, opacity: o.ops ? o.ops[i] : undefined})) : null,
    !o.showText ? g({name: `${o.prefix}-bars`}, [0, 1].map(i => h('rect', {x: r(TM.F * 1.4), y: r(TM.h / 2 - TM.F * 0.55 + i * TM.F * 0.7), width: r((TM.w - TM.F * 2.2) * (i ? 0.6 : 0.9)), height: r(TM.F * 0.4), rx: 3, fill: shade(SLATE, 0.6)}))) : null,
  );
}

/* ------------------------------------------------------------------ */
/* Board plan: two straight lanes with the gate on the process lane    */
/* ------------------------------------------------------------------ */

/**
 * Plan of a two-lane board (board-local; top-left origin). orient 'h': lanes are rows (process on top), the middle gap
 * holds the datum tag (below the gate) and the calendar (left); 'v': lanes are columns (process left), the middle
 * column holds the tag (beside the gate) and the calendar (top).
 * @param {ReturnType<typeof cardModel>} M
 * @param {ReturnType<typeof tagModel>} TM
 * @param {{F:number, orient:'h'|'v', travel?:number, cal?:boolean}} o
 */
export function boardPlan(M, TM, o) {
  const F = o.F;
  const H = o.orient === 'h';
  const along = H ? M.w : M.h, across = H ? M.h : M.w;
  const pad = Math.max(10, F * 0.6);
  const wd = across + pad * 2;
  const disc = Math.min(wd * 0.5, F * 2.4);
  const tStart = pad + disc + pad;
  const travel = o.travel ?? Math.max(along * 0.75, F * 5);
  const tWait = tStart + travel;
  const gThk = Math.max(F * 1.5, 24);
  const gapS = Math.max(F * 0.7, 12);
  const gT = tWait + along + gapS + gThk / 2;
  const tEnd = gT + gThk / 2 + gapS + F * 0.5;
  const len = tEnd + along + pad;
  const calW = F * 3.4, calH = calW * 0.86;
  const mg = F * 0.6;
  const showCal = o.cal !== false;
  let mid, lanes, tag, cal;
  if (H) {
    mid = Math.max(TM.h, showCal ? calH : 0) + mg * 2 + F * 0.4;
    lanes = [{x: 0, y: 0, w: len, h: wd}, {x: 0, y: wd + mid, w: len, h: wd}];
    tag = {x: clamp(gT - TM.w * 0.3, 0, len - TM.w), y: wd + mg + F * 0.4, w: TM.w, h: TM.h};
    cal = showCal ? {x: tStart, y: wd + mid / 2 - calH / 2 + F * 0.2, w: calW, h: calH} : null;
  } else {
    mid = Math.max(TM.w, showCal ? calW : 0) + mg * 2;
    lanes = [{x: 0, y: 0, w: wd, h: len}, {x: wd + mid, y: 0, w: wd, h: len}];
    tag = {x: wd + mg, y: clamp(gT - TM.h * 0.3, 0, len - TM.h), w: TM.w, h: TM.h};
    cal = showCal ? {x: wd + mid / 2 - calW / 2, y: tStart, w: calW, h: calH} : null;
  }
  const tagCal = cal && overlaps(tag, cal, F * 0.4);
  const W = H ? len : wd * 2 + mid, Hh = H ? wd * 2 + mid : len;
  // chevrons: before the gate (all lanes) and after it; the process lane's after-gate chevrons are the lit ones
  const step = Math.max(F * 2.4, 34);
  const chevAll = [];
  for (let x = tStart + step * 0.5; x < len - pad - step * 0.3; x += step) chevAll.push(x);
  const nearGate = x => Math.abs(x - gT) < gThk / 2 + step * 0.45;
  const proc = chevAll.filter(x => !nearGate(x));
  const lit = proc.filter(x => x > gT);  // (lit ones are drawn over dim copies: see laneArt)
  const procDim = proc.filter(x => x < gT);
  /** World top-left of a card in lane i at axis position t. */
  const pos = (i, t) => (H ? {x: lanes[i].x + t, y: lanes[i].y + pad} : {x: lanes[i].x + pad, y: lanes[i].y + t});
  /** World point on lane i's axis at t (centre line). */
  const axis = (i, t) => (H ? {x: lanes[i].x + t, y: lanes[i].y + wd / 2} : {x: lanes[i].x + wd / 2, y: lanes[i].y + t});
  const gate = H ? {cx: gT, cy: wd / 2, rot: 0} : {cx: wd / 2, cy: gT, rot: 90};
  const gateSpan = wd + F * 1.2;
  const gateBox = H ? {x: gT - gThk / 2, y: wd / 2 - gateSpan / 2, w: gThk, h: gateSpan} : {x: wd / 2 - gateSpan / 2, y: gT - gThk / 2, w: gateSpan, h: gThk};
  return {F, H, along, across, pad, wd, disc, tStart, tWait, tEnd, gT, gThk, gapS, len, lanes, tag, cal, mid, W, H2: Hh, w: W, h: Hh,
    chevAll, procDim, lit, rev: chevAll, pos, axis, gate, gateSpan, gateBox, tagCal, ok: !tagCal};
}

/**
 * Board node (lanes, gate, tag, calendar; cards are separate so the entry can layer them between the lanes and the
 * gate). Returns named groups: `${p}-lane0`, `${p}-lane1`, `${p}-gate`, `${p}-tag`, `${p}-cal`.
 */
export function boardNodes(ctx, B, TM, o) {
  const p = o.prefix;
  const lane = i => {
    const L = B.lanes[i];
    const art = laneArt(ctx, {prefix: `${p}-lane${i}`, i, len: B.len, wd: B.wd, F: B.F, chev: i === 0 ? B.procDim : B.rev, lit: i === 0 ? B.lit : [], disc: B.disc, endT: B.tEnd, along: B.along, pad: B.pad});
    return g({transform: B.H ? T(L.x, L.y) : `${T(L.x + L.w, L.y)} rotate(90)`}, art);
  };
  const gate = g({transform: T(B.lanes[0].x + B.gate.cx, B.lanes[0].y + B.gate.cy, B.gate.rot)}, gateArt(ctx, {prefix: `${p}-gate`, thk: B.gThk, sp: B.gateSpan, F: B.F}));
  const leader = (() => {
    const t = B.tag;
    const gb = {x: B.lanes[0].x + B.gateBox.x, y: B.lanes[0].y + B.gateBox.y, w: B.gateBox.w, h: B.gateBox.h};
    const a = B.H ? {x: clamp(gb.x + gb.w / 2, t.x + 10, t.x + t.w - 10), y: t.y} : {x: t.x, y: clamp(gb.y + gb.h / 2, t.y + 10, t.y + t.h - 10)};
    const b = B.H ? {x: a.x, y: gb.y + gb.h} : {x: gb.x + gb.w, y: a.y};
    return h('path', {d: `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`, stroke: SLATE, 'stroke-width': 3, 'stroke-linecap': 'round'});
  })();
  return {
    lanes: [lane(0), lane(1)],
    gate,
    tag: g({name: `${p}-tagg`}, leader, g({transform: T(B.tag.x, B.tag.y)}, tagNode(ctx, TM, {prefix: `${p}-tag`, showText: o.showText, ops: o.tagOps}))),
    cal: B.cal ? g({transform: T(B.cal.x, B.cal.y)}, calendarNode(ctx, {prefix: `${p}-cal`, w: B.cal.w, h: B.cal.h})) : null,
  };
}

/** Frame record for the process lane's lit chevrons (k = 0 dim … 1 lit; staggered from the gate outwards). */
export function litFrame(prefix, B, k) {
  const out = {};
  const n = B.lit.length;
  B.lit.forEach((x, i) => { out[`${prefix}-lane0-lit${i}`] = {opacity: r(clamp(k * (n + 1) - i), 3)}; });
  return out;
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

/** Card box (world) at a top-left pose. */
export const cardBox = (p, M) => ({x: p.x, y: p.y, w: M.w, h: M.h});

/** Linear mix of two points. */
export const mix = (a, b, k) => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k});
