/**
 * LAW-0359 — Cierre de itinerario · contrast
 *
 * Storyboard (two complete, equally scaled desks — side by side on wide frames, one above the other on tall ones —
 * each with the same open case file and route map, the same tray holding the same filter clips and the tracing puck,
 * the same calendar):
 *  0.00–0.17  base: both desks identical; every track pale, every badge neutral.
 *  0.17–0.40  the one changed fact, on the focus route only: on desk A it is supplied as concluded — the puck leaves
 *             the tray, traces the focus route to its end card (badge ●) and returns; on desk B it is supplied as
 *             pending a check — a filter clip slides from the tray across the focus track (badge ◆).
 *  0.40–0.77  in parallel, identically on both desks, the other routes are marked with their (shared) supplied
 *             states: concluded routes traced by the puck, pending ways clipped.
 *  0.77–1.00  a comparison guide rings the focus route on both desks ("only this differs") and the neutral note says
 *             the two supplied situations are shown side by side with no winner, score or outcome. Nothing says
 *             whether any route is closed or available.
 * @module animations/review/LAW-0359
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {deskWindow} from '../../primitives/desk.js';
import {
  ciiFields, CII_EN, CII_ES, localisedCi, fitG, textAt, originModel, originNode, endModel, endNode, mapPlan, shiftPlan,
  trackNode, trackDims, inkNode, chevron, filterClip, puckNode, trayNode, calendarNode, folderNode, panelLayout, panelNode, markGlyph,
  inkColor, INK, R2,
} from './kits/cierre-de-itinerario.js';
import {laneColor} from './kits/confirmacion-ilustrativa.js';

const ID = 'LAW-0359';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  fHop: [0.17, 0.21], fTrace: [0.21, 0.34], fBack: [0.34, 0.39], fClip: [0.19, 0.33],
  sPuck: [0.43, 0.66], sBack: [0.66, 0.73], sClips: [0.43, 0.73], guide: [0.77, 0.82], note: [0.8, 0.85],
};
const SIZES = [26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {en: {}, es: {}};

const OWN_EN = {
  routes: [
    {label: 'Route 1 (as supplied)', state: 'concluded', end: 'End entry of route 1 (as supplied)'},
    {label: 'Route 2 (as supplied)', state: 'concluded', end: 'Resolution R-3 recorded (fictional)'},
    {label: 'Route 3 (as supplied)', state: 'pending', end: 'Not yet checked in this file'},
  ],
  focusRoute: 1,
  scenarioA: {label: 'Route 1 supplied as concluded', caption: 'The puck traces route 1 to its end card'},
  scenarioB: {label: 'Route 1 supplied as pending a check', caption: 'A filter clip is laid across route 1'},
  changedFact: 'Only the supplied state of route 1 differs (as supplied)',
  sharedFacts: ['Same starting resolution and routes', 'Routes 2 and 3 marked the same way on both desks', 'Same file, tray and calendar'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'Two supplied situations side by side: no winner, no score, no outcome'},
};
const OWN_ES = {
  routes: [
    {label: 'Ruta 1 (según lo aportado)', state: 'concluded', end: 'Entrada final de la ruta 1 (según lo aportado)'},
    {label: 'Ruta 2 (según lo aportado)', state: 'concluded', end: 'Resolución R-3 registrada (ficticia)'},
    {label: 'Ruta 3 (según lo aportado)', state: 'pending', end: 'Aún sin comprobar en este expediente'},
  ],
  focusRoute: 1,
  scenarioA: {label: 'Ruta 1 aportada como concluida', caption: 'La ficha traza la ruta 1 hasta su tarjeta final'},
  scenarioB: {label: 'Ruta 1 aportada como pendiente de comprobar', caption: 'Se coloca una pinza filtro sobre la ruta 1'},
  changedFact: 'Solo cambia el estado aportado de la ruta 1 (según lo aportado)',
  sharedFacts: ['La misma resolución de partida y las mismas rutas', 'Las rutas 2 y 3 se marcan igual en ambas mesas', 'El mismo expediente, bandeja y calendario'],
  comparisonLabels: {guide: 'Solo esto cambia', neutral: 'Dos situaciones aportadas lado a lado: sin ganador, sin puntuación, sin resultado'},
};
const EN = {...CII_EN, ...OWN_EN};
const ES = {...CII_ES, ...OWN_ES};

const sceneSchema = {
  ...ciiFields,
  focusRoute: int('The route whose supplied state differs (1-based): concluded on desk A, pending a check on desk B; its own `state` is ignored', 1, 3),
  scenarioA: obj('Scenario A (the focus route supplied as concluded)', {label: str('Short label for scenario A', 60), caption: str('One-line description of scenario A', 90)}, ['label', 'caption']),
  scenarioB: obj('Scenario B (the focus route supplied as pending a check)', {label: str('Short label for scenario B', 60), caption: str('One-line description of scenario B', 90)}, ['label', 'caption']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical on both desks', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label of the guide ringing the place that differs', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}, ['guide', 'neutral']),
};

const defaultParams = {...EN};

/** Routes of one desk: the focus route takes the scenario's state. */
const deskRoutes = (P, fi, side) => P.routes.map((rt, i) => (i === fi ? {...rt, state: side === 'a' ? 'concluded' : 'pending'} : rt));

function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const n = P.routes.length;
  const fi = Math.min(n, P.focusRoute) - 1;
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'guide', text: P.changedFact, name: 'lg-changed'});
  // compact desks (square frames): the content shared by both files is printed once, here, keyed by the route numbers
  if (showKey && opts.compact) {
    rows.push({kind: 'item', icon: 'origin', text: `${P.decisions.title} · ${P.decisions.ref} · ${P.grounds}`, name: 'lg-origin'});
    P.routes.forEach((rt, i) => rows.push({kind: 'item', icon: 'end', text: `${i + 1}. ${rt.label}: ${rt.end}`, name: `lg-route${i}`}));
  }
  if (showKey) rows.push({kind: 'item', icon: 'guide', text: P.comparisonLabels.guide, name: 'guide-label'});
  if (showKey) rows.push({kind: 'item', icon: 'concluded', text: P.outcomes.concluded, name: 'lg-concluded'});
  if (showKey) rows.push({kind: 'item', icon: 'pending', text: P.outcomes.pending, name: 'lg-pending'});
  if (showAll) P.sharedFacts.forEach((f, i) => rows.push({kind: 'item', icon: 'same', text: f, name: `lg-shared${i}`}));
  // (the scenario captions sit under the scenario labels when the headers have room for them, else here)
  if (showAll && !opts.capHead) rows.push({kind: 'item', icon: 'laneA', text: P.scenarioA.caption, name: 'lg-capA'}, {kind: 'item', icon: 'laneB', text: P.scenarioB.caption, name: 'lg-capB'});
  if (showKey) rows.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'neutral'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gap = F * 1.1;
  let PL = null, top = DH, stageW = DW, panel = null;
  if (rows.length && opts.pw) {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F, tight: opts.tight});
    stageW = DW - PW - gap;
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  } else if (rows.length) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols, tight: opts.tight});
    top = DH - PL.h - gap - F * 0.4;
    panel = {x: 4, y: DH - PL.h - F * 0.4};
  }
  const arr = opts.arr;
  const pairGap = Math.max(F * 1.4, 26);
  const sw = arr === 'row' ? (stageW - pairGap) / 2 : stageW;
  const badgeR = F * 0.95;
  const hdr = ['a', 'b'].map(s => {
    const sc = s === 'a' ? P.scenarioA : P.scenarioB;
    if (!showKey) return {label: null, h: badgeR * 2, ok: true};
    const label = fitG(sc.label, {maxWidth: sw - badgeR * 2 - F * 0.7, size: F * 1.05, minSize: F, maxLines: 2, weight: 700});
    const caption = showAll && opts.capHead ? fitG(sc.caption, {maxWidth: sw - badgeR * 2 - F * 0.7, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
    return {label, caption, h: Math.max(badgeR * 2, label.height + (caption ? F * 0.2 + caption.height : 0)), ok: label.ok && (!caption || caption.ok)};
  });
  const hh = Math.max(hdr[0].h, hdr[1].h);
  const stageH = arr === 'row' ? top : (top - pairGap) / 2;
  const deskH = stageH - hh - F * 0.4;
  if (deskH < F * 8 || sw < F * 16) return {F, ok: false, problems: ['stage']};
  const desks = arr === 'row'
    ? [{x: 0, y: hh + F * 0.4, w: sw, h: deskH}, {x: sw + pairGap, y: hh + F * 0.4, w: sw, h: deskH}]
    : [{x: 0, y: hh + F * 0.4, w: sw, h: deskH}, {x: 0, y: stageH + pairGap + hh + F * 0.4, w: sw, h: deskH}];
  const heads = desks.map(d => ({x: d.x, y: d.y - hh - F * 0.4}));
  // one plan for both desks (identical geometry); the folder fills the desk
  const cardText = showKey && !opts.compact;
  const tabFit = showKey ? fitG(P.labels.file, {maxWidth: sw * 0.8, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  const tabH = tabFit ? tabFit.height + F * 0.6 : F * 1.4;
  const tabW = tabFit ? tabFit.width + F * 1.6 : F * 8;
  const mI = Math.max(10, F * 0.5);
  const pF = Math.max(10, F * 0.5) + F * 0.4;
  const mapW = sw - 2 * mI - 2 * pF;
  const mapHmax = deskH - 2 * mI - tabH - 2 * pF;
  const pendIdx = P.routes.map((rt, i) => i).filter(i => i === fi || P.routes[i].state === 'pending');
  const slots = pendIdx.length + 1;
  const orient = opts.orient;
  let OM, EM, plan;
  // (compact desks: the cards carry no text, so the map's geometry may be drawn at a smaller unit)
  const G = opts.compact && showKey ? F * (orient === 'v' ? 0.46 : 0.62) : F;
  const routesB = deskRoutes(P, fi, 'b');
  if (orient === 'h') {
    const gapM = Math.max(G * 6.5, mapW * 0.15);
    const tot = Math.min(G * (opts.compact ? 22 : 42), mapW - gapM);
    if (tot < G * (opts.compact ? 9 : 15)) return {F, ok: false, problems: ['map-width']};
    for (const k of [0.47, 0.52, 0.42, 0.57]) {
      OM = originModel(P, {w: tot * k, F: G, showText: cardText});
      EM = endModel(P, {w: tot * (1 - k), F: G, showText: cardText});
      if (OM.ok && EM.ok) break;
    }
    plan = mapPlan(P, OM, EM, {F: G, orient, gap: mapW - tot, slots, routes: routesB, gx: Math.max(G * 0.5, 10)});
    const spare = mapHmax - plan.needH;
    if (spare > 1 && n > 1) plan = mapPlan(P, OM, EM, {F: G, orient, gap: mapW - tot, slots, routes: routesB, gx: Math.max(G * 0.5, 10) + Math.min(G * 2, spare / (n - 1))});
  } else {
    const gx = Math.max(G * 0.8, 14);
    const ew = Math.min(G * 14, (mapW - (n - 1) * gx) / n);
    const ow = Math.min(G * 16, mapW - 2 * (G * 4.6));
    if (ew < G * 7 || ow < G * 8) return {F, ok: false, problems: ['map-width']};
    OM = originModel(P, {w: ow, F: G, showText: cardText});
    EM = endModel(P, {w: ew, F: G, showText: cardText});
    const g0 = opts.compact ? Math.max(G * 3.8, trackDims(G).along * 3.6) : G * 6;
    plan = mapPlan(P, OM, EM, {F: G, orient, gap: g0, slots, routes: routesB});
    const spare = mapHmax - plan.needH;
    if (spare > 1) plan = mapPlan(P, OM, EM, {F: G, orient, gap: g0 + Math.min(G * 5, spare), slots, routes: routesB});
  }
  if (globalThis.__trace) globalThis.__trace.push({F: r(G * 1, 1), a: JSON.stringify(opts), mapW: r(mapW), mapHmax: r(mapHmax), needW: r(plan.needW), needH: r(plan.needH), oh: r(OM.h), eh: r(EM.h), PL: PL && r(PL.h)});
  const fits = plan.needW <= mapW + 0.5 && plan.needH <= mapHmax + 0.5;
  const D = desks.map(dk => {
    const folder = {x: dk.x + mI, y: dk.y + mI + tabH, w: dk.w - 2 * mI, h: plan.needH + 2 * pF};
    const pl = shiftPlan(plan, folder.x + pF + (mapW - plan.needW) / 2, folder.y + pF);
    return {folder, pl};
  });
  // the desks are as tall as their folder needs (both the same); the pair is centred in its stage
  const dh = Math.min(deskH, 2 * mI + tabH + plan.needH + 2 * pF);
  const problems = [!fits && 'map', !OM.ok && 'origin-text', !EM.ok && 'end-text', !plan.ok && plan.problems.join('+'), PL && !PL.ok && 'panel-text', hdr.some(x => !x.ok) && 'header-text', tabFit && !tabFit.ok && 'tab-text'].filter(Boolean);
  return {compact: !!opts.compact && showKey, F, arr, PL, panel, hdr, hh, heads, desks, dh, D, OM, EM, plan, fi, pendIdx, tabFit, tabH, tabW, sw, badgeR, pairGap, orient, deskH, ok: !problems.length, problems};
}

/** Pose of the shared objects on one desk at time u: puck position, ink per route, clip per slot. */
function deskState(C, P, side, u) {
  const pl = C.D[0].pl;
  const slots = pl.slotsAt;
  const park = slots[slots.length - 1];
  const fi = C.fi;
  const routes = deskRoutes(P, fi, side);
  const ink = routes.map(() => 0), laid = routes.map(() => 0);
  const clips = C.pendIdx.map((ri, k) => ({...slots[k]}));
  let puck = {...park}, lift = 0, puckPhase = 'parked';
  const e = ease.inOutCubic;
  // the changed fact
  const frt = pl.routes[fi];
  if (side === 'a') {
    if (u >= W.fHop[0] && u < W.fHop[1]) { const k = e(seg(u, ...W.fHop)); puck = {x: lerp(park.x, frt.pts[0].x, k), y: lerp(park.y, frt.pts[0].y, k)}; lift = Math.sin(Math.PI * k); puckPhase = 'hop'; }
    else if (u >= W.fTrace[0] && u < W.fTrace[1]) { const k = ease.inOutSine(seg(u, ...W.fTrace)); ink[fi] = k; const q = frt.poly.at(k); puck = {x: q.x, y: q.y}; puckPhase = 'trace'; }
    else if (u >= W.fTrace[1] && u < W.fBack[1]) { const k = e(seg(u, ...W.fBack)); const end = frt.pts[frt.pts.length - 1]; puck = {x: lerp(end.x, park.x, k), y: lerp(end.y, park.y, k)}; lift = Math.sin(Math.PI * k); puckPhase = 'back'; }
    if (u >= W.fTrace[1]) ink[fi] = 1;
  } else {
    const k = C.pendIdx.indexOf(fi);
    const kk = e(seg(u, ...W.fClip));
    const tgt = pl.routes[fi].clipC;
    clips[k] = {x: lerp(slots[k].x, tgt.x, kk), y: lerp(slots[k].y, tgt.y, kk), s: 1 + 0.06 * Math.sin(Math.PI * kk)};
    if (kk >= 1) laid[fi] = 1;
  }
  // the shared routes (identical on both desks)
  const conc = routes.map((rt, i) => i).filter(i => i !== fi && routes[i].state === 'concluded');
  const pend = routes.map((rt, i) => i).filter(i => i !== fi && routes[i].state === 'pending');
  if (conc.length && u >= W.sPuck[0]) {
    const span = (W.sPuck[1] - W.sPuck[0]) / conc.length;
    let prev = park, placed = false;
    for (let j = 0; j < conc.length; j++) {
      const i = conc[j], rt = pl.routes[i];
      const a = W.sPuck[0] + j * span, b = a + span, hopEnd = a + span * 0.3;
      if (!placed && u < hopEnd) { const k = e(seg(u, a, hopEnd)); puck = {x: lerp(prev.x, rt.pts[0].x, k), y: lerp(prev.y, rt.pts[0].y, k)}; lift = Math.sin(Math.PI * k); puckPhase = 'hop'; placed = true; }
      else if (!placed && u < b) { const k = ease.inOutSine(seg(u, hopEnd, b)); ink[i] = k; const q = rt.poly.at(k); puck = {x: q.x, y: q.y}; puckPhase = 'trace'; placed = true; }
      else if (!placed) { ink[i] = 1; prev = rt.pts[rt.pts.length - 1]; }
    }
    if (!placed) { const k = e(seg(u, ...W.sBack)); puck = {x: lerp(prev.x, park.x, k), y: lerp(prev.y, park.y, k)}; lift = Math.sin(Math.PI * k); puckPhase = k >= 1 ? 'parked' : 'back'; }
  }
  if (pend.length && u >= W.sClips[0]) {
    const span = (W.sClips[1] - W.sClips[0]) / pend.length;
    pend.forEach((i, j) => {
      const k = C.pendIdx.indexOf(i);
      const kk = e(seg(u, W.sClips[0] + j * span, W.sClips[0] + (j + 0.85) * span));
      const tgt = pl.routes[i].clipC;
      clips[k] = {x: lerp(slots[k].x, tgt.x, kk), y: lerp(slots[k].y, tgt.y, kk), s: 1 + 0.06 * Math.sin(Math.PI * kk)};
      if (kk >= 1) laid[i] = 1;
    });
  }
  return {puck, lift, puckPhase, ink, laid, clips, routes};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const arrangements = shape === 'landscape' ? [{arr: 'row', cols: 3, orient: 'h'}, {arr: 'row', cols: 3, orient: 'v'}, {arr: 'row', cols: 2, orient: 'h'}, {arr: 'row', cols: 3, tight: true, orient: 'v'}]
      : shape === 'portrait' ? [{arr: 'column', cols: 2, orient: 'h'}, {arr: 'column', cols: 1, orient: 'h'}, {arr: 'column', cols: 2, tight: true, orient: 'h'}]
        : [{arr: 'column', pw: 0.3, tight: true, orient: 'h'}, {arr: 'column', pw: 0.42, tight: true, orient: 'h', compact: true}, {arr: 'column', pw: 0.48, tight: true, orient: 'h', compact: true}, {arr: 'row', cols: 2, tight: true, orient: 'v', compact: true, capHead: true}, {arr: 'row', cols: 3, tight: true, orient: 'v', compact: true, capHead: true}, {arr: 'row', cols: 3, tight: true, orient: 'h', compact: true}];
    const sizes = (!showKey ? [40, 36, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements) {
        const c = compose(ctx, P, F, a);
        if (globalThis.__trace) globalThis.__trace.push({P: [r(F * pxu, 1), JSON.stringify(a), c.problems]});
        if (c.ok) { C = c; break outer; }
        if (c.D && (!C || c.problems.length < C.problems.length)) C = c;
      }
    }
    if (!C) for (const a of arrangements) { const c = compose(ctx, P, sizes[sizes.length - 1] * 0.8, a); if (c.D) { C = c; break; } }
    // the comparison guide: the focus route's end card and the last leg of its track, on both desks
    const rings = C.D.map(d => {
      const pad = Math.max(8, C.F * 0.4);
      const e = d.pl.E[C.fi], cb = d.pl.routes[C.fi].clip;
      const x0 = Math.min(e.x, cb.x) - pad, y0 = Math.min(e.y, cb.y) - pad;
      return {x: x0, y: y0, w: Math.max(e.x + e.w, cb.x + cb.w) + pad - x0, h: Math.max(e.y + e.h, cb.y + cb.h) + pad - y0};
    });
    return {P, C, rings, pxu};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const parts = [];
    const D0 = C.D[0].pl.D;
    ['a', 'b'].forEach((s, i) => {
      const hd = C.hdr[i], at = C.heads[i];
      const lane = laneColor(th, s);
      const cy = at.y + C.hh / 2;
      const kids = [h('circle', {cx: r(at.x + C.badgeR), cy: r(cy), r: r(C.badgeR), fill: lane, stroke: INK, 'stroke-width': 2.4})];
      if (!hd.label) kids.push(g({transform: T(at.x + C.badgeR, cy)}, markGlyph(s, C.badgeR * 0.42, {fill: '#fff', stroke: lane})));
      else {
        kids.push(textAt(fitG(s.toUpperCase(), {maxWidth: 100, size: C.F, minSize: C.F, maxLines: 1, weight: 800}), {x: at.x + C.badgeR, y: cy - C.F * 0.5, anchor: 'middle', fill: '#fff'}));
        const bh = hd.label.height + (hd.caption ? C.F * 0.2 + hd.caption.height : 0);
        kids.push(textAt(hd.label, {x: at.x + C.badgeR * 2 + C.F * 0.6, y: cy - bh / 2, fill: th.fg}));
        if (hd.caption) kids.push(textAt(hd.caption, {x: at.x + C.badgeR * 2 + C.F * 0.6, y: cy - bh / 2 + hd.label.height + C.F * 0.2, fill: th.fgSoft}));
      }
      parts.push(g({name: `head-${s}`}, kids));
      const dk = {...C.desks[i], h: C.dh};
      const d = C.D[i];
      const pl = d.pl;
      const routes = deskRoutes(P, C.fi, s);
      const desk = deskWindow(ctx, {prefix: `desk${s}`, x: dk.x, y: dk.y, w: dk.w, h: dk.h, radius: 22, seedKey: 'cii-contrast-desk'});
      parts.push(desk.surface, g({'clip-path': desk.clip},
        g({transform: T(d.folder.x, d.folder.y)}, folderNode(ctx, {prefix: `${s}-folder`, w: d.folder.w, h: d.folder.h, tabW: C.tabW, tabH: C.tabH, labelFit: C.tabFit, F: C.F})),
        pl.cal ? g({transform: T(pl.cal.x, pl.cal.y)}, calendarNode(ctx, {prefix: `${s}-calendar`, w: pl.cal.w, h: pl.cal.h})) : null,
        pl.tray ? g({transform: T(pl.tray.x, pl.tray.y)}, trayNode(ctx, pl.tray)) : null,
        pl.routes.map((rt, j) => trackNode(ctx, rt, D0, {prefix: `${s}-track${j}`})),
        pl.routes.map((rt, j) => inkNode(ctx, rt, D0, {prefix: `${s}-ink${j}`, color: inkColor(th)})),
        pl.routes.map((rt, j) => g(null, rt.chev.map((c, q) => chevron(D0, {name: `${s}-chev${j}-${q}`, transform: T(c.x, c.y, c.a), opacity: 0})))),
        g({transform: T(pl.O.x, pl.O.y)}, originNode(ctx, C.OM, {prefix: `${s}-origin`})),
        pl.E.map((b, j) => g({transform: T(b.x, b.y)}, endNode(ctx, C.EM, j, routes[j], {prefix: `${s}-end${j}`, num: C.compact ? {text: String(j + 1), size: C.F * 0.85} : null}))),
        C.pendIdx.map((ri, k) => {
          const cs = C.orient === 'h' ? {w: D0.along, h: D0.across} : {w: D0.across, h: D0.along};
          return g({name: `${s}-clip${k}`, transform: T(pl.slotsAt[k].x, pl.slotsAt[k].y)}, filterClip(ctx, {prefix: `${s}-clip${k}-art`, w: cs.w, h: cs.h}));
        }),
        g({name: `${s}-puck`, transform: T(pl.slotsAt[pl.slotsAt.length - 1].x, pl.slotsAt[pl.slotsAt.length - 1].y)}, puckNode(ctx, Math.min(D0.puck, D0.along * 0.48)))), desk.frame);
    });
    const gc = th.accent3;
    const R0 = L.rings[0], R1 = L.rings[1];
    const guideKids = [
      h('path', {d: roundRectPath(R0.x, R0.y, R0.w, R0.h, 12), fill: 'none', stroke: gc, 'stroke-width': 5}),
      h('path', {d: roundRectPath(R1.x, R1.y, R1.w, R1.h, 12), fill: 'none', stroke: gc, 'stroke-width': 5}),
    ];
    // (no joining line: it would cross desk A's map; the legend keys the rings with the guide sign)
    parts.push(g({name: 'guide', opacity: 0}, guideKids));
    return g({name: 'scene'}, parts, C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null);
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const nodes = {};
    const look = {}, sem = {};
    ['a', 'b'].forEach((s, i) => {
      const S = deskState(C, P, s, u);
      const pl = C.D[i].pl;
      const dx = C.D[i].pl.O.x - C.D[0].pl.O.x, dy = C.D[i].pl.O.y - C.D[0].pl.O.y;
      nodes[`${s}-puck`] = {transform: T(S.puck.x + dx, S.puck.y + dy, 0, 1 + 0.08 * S.lift)};
      pl.routes.forEach((rt, j) => {
        nodes[`${s}-ink${j}`] = {'stroke-dashoffset': r(rt.len * (1 - S.ink[j]), 1)};
        rt.chev.forEach((c, q) => { nodes[`${s}-chev${j}-${q}`] = {opacity: S.ink[j] * rt.len >= c.s + C.F ? 1 : 0}; });
        nodes[`${s}-end${j}-st`] = {opacity: S.routes[j].state === 'concluded' ? (S.ink[j] >= 1 ? 1 : 0) : S.laid[j]};
      });
      S.clips.forEach((c, k) => { nodes[`${s}-clip${k}`] = {transform: T(c.x + dx, c.y + dy, 0, c.s || 1)}; });
      const rl = q => ({x: r(q.x, 1), y: r(q.y, 1)});
      look[s] = {puck: rl(S.puck), ink: S.ink.map(v => r(v, 3)), clips: S.clips.map(rl), badges: S.routes.map((rt, j) => (rt.state === 'concluded' ? (S.ink[j] >= 1 ? 1 : 0) : S.laid[j]))};
      sem[s] = {S, puck: R2({x: S.puck.x + dx, y: S.puck.y + dy})};
    });
    const guideK = seg(u, ...W.guide), noteK = seg(u, ...W.note);
    nodes.guide = {opacity: r(guideK, 3)};
    if (C.PL) for (const row of C.PL.rows) {
      if (row.name === 'neutral') nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'guide-label') nodes[row.name] = {opacity: r(guideK, 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const fi = C.fi;
    const pick = (o, skip) => o.filter((v, j) => j !== skip);
    const fk = C.pendIdx.indexOf(fi);
    return {
      nodes,
      semantic: {
        beat, lookA: look.a, lookB: look.b, puckA: sem.a.puck, puckB: sem.b.puck,
        clipB: R2(sem.b.S.clips[fk]),
        focus: fi, inkFocusA: r(sem.a.S.ink[fi], 3), inkFocusB: r(sem.b.S.ink[fi], 3), laidFocusA: sem.a.S.laid[fi], laidFocusB: sem.b.S.laid[fi],
        sharedSame: JSON.stringify(pick(look.a.ink, fi)) === JSON.stringify(pick(look.b.ink, fi)) && JSON.stringify(pick(look.a.badges, fi)) === JSON.stringify(pick(look.b.badges, fi)) && JSON.stringify(look.a.clips.filter((c, k) => k !== fk)) === JSON.stringify(look.b.clips.filter((c, k) => k !== fk)),
        badgesA: look.a.badges, badgesB: look.b.badges, statesA: sem.a.S.routes.map(x => x.state), statesB: sem.b.S.routes.map(x => x.state),
        guide: r(guideK, 3), note: r(noteK, 3), arr: C.arr,
        desks: C.desks.map(dk => ({x: r(dk.x), y: r(dk.y), w: r(dk.w), h: r(C.dh)})),
        problems: C.problems, textPx: r(C.F * L.pxu, 1),
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'review-10-contrast',
    title: 'Route closure — two identical case files; only the supplied state of one route differs: traced as concluded on A, clipped as pending a check on B',
    titleEs: 'Cierre de itinerario — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Cierre de itinerario',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete desks of the same size (side by side on wide frames, stacked on tall ones), each with the same case file and route map, the same tray of filter clips and tracing puck and the same calendar. The one changed fact is the supplied state of the focus route: on desk A (concluded) the puck traces it to its end card; on desk B (pending a check) a filter clip is laid across it. Then the other routes are marked identically on both desks with their shared supplied states. A guide rings the focus route on both desks and a neutral note shows the two situations without winner, score or outcome. Nothing says whether a route is closed or available. Illustrative; jurisdiction unspecified.',
    tags: ['review', 'route closure', 'contrast', 'paired desks', 'one changed fact', 'case file', 'routes as supplied', 'filter clip', 'no winner'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/cierre-de-itinerario.js', 'src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/desk.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
