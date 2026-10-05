/**
 * LAW-0360 — Cierre de itinerario · inspect
 *
 * Storyboard (a top-down desk with the open case file in the state the marking produced: the route supplied as
 * concluded inked with its arrows up to its end card, the ways supplied as pending a check carrying a filter clip, the
 * end cards' badges showing the supplied states; a desk calendar is a fixture only):
 *  0.00–0.20  build: the ink runs along the concluded routes and the clips settle on their tracks; the badges show.
 *  0.20–0.45  isolate: the focus route's end card and the last leg of its track — the detail that tells "route
 *             concluded" (ink and arrows, ●) from "way pending a check" (clip, ◆) — is outlined and a real enlarged copy
 *             opens beside the desk; the context copy of the end entry is hidden while the lens holds it.
 *  0.45–0.75  substitute: in the lens the supplied end entry lifts into a "was" band under the lens and the alternative
 *             entry takes its place. Nothing else changes: no track, clip, badge or state is touched.
 *  0.75–1.00  return: the lens closes onto its source, the context card shows the new entry with the neutral "changed
 *             datum" marker (Δ); the key reads "as supplied · no conclusion drawn". Seeking back restores the old entry
 *             exactly. No validity, finality or outcome is inferred.
 * @module animations/review/LAW-0360
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {deskWindow} from '../../primitives/desk.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  ciiFields, CII_EN, CII_ES, localisedCi, fitG, textAt, originModel, originNode, endModel, endNode, mapPlan, shiftPlan,
  trackNode, inkNode, chevron, filterClip, trayNode, calendarNode, folderNode, panelLayout, panelNode, inkColor, overlaps,
  INK, SLATE, R2,
} from './kits/cierre-de-itinerario.js';

const ID = 'LAW-0360';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {ink: [0.03, 0.14], clips: [0.06, 0.16], badges: [0.14, 0.18], src: [0.2, 0.24], open: [0.24, 0.37], panelOut: [0.2, 0.26], lift: [0.47, 0.53], newIn: [0.56, 0.62], close: [0.75, 0.85], marker: [0.85, 0.9], panelIn: [0.85, 0.91]};
const SIZES = [30, 28, 27, 26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const FOCI = ['route1', 'route2', 'route3'];

const STRINGS = {
  en: {was: 'was', calendar: 'Desk calendar (no date marked)'},
  es: {was: 'antes', calendar: 'Calendario de mesa (sin fechas marcadas)'},
};

const OWN_EN = {
  focusTarget: 'route1',
  beforeValue: '',
  afterValue: 'Resolution R-2b recorded (fictional)',
  detailGeometry: {zoom: 1.9, placement: 'auto'},
  contextLabels: {context: 'The case file after its routes were marked (as supplied)', marker: 'Changed: the end entry of one route only'},
};
const OWN_ES = {
  focusTarget: 'route1',
  beforeValue: '',
  afterValue: 'Resolución R-2b registrada (ficticia)',
  detailGeometry: {zoom: 1.9, placement: 'auto'},
  contextLabels: {context: 'El expediente tras marcar sus rutas (según lo aportado)', marker: 'Cambia: solo la entrada final de una ruta'},
};
const EN = {...CII_EN, ...OWN_EN};
const ES = {...CII_ES, ...OWN_ES};

const sceneSchema = {
  ...ciiFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the end card of route 1, 2 or 3 (a route that is not supplied falls back to the last one)', FOCI),
  beforeValue: str('End entry of the focus route before the substitution (empty: the entry supplied in `routes`)', 80),
  afterValue: str('End entry of the focus route after the substitution (the alternative datum, as supplied)', 80),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens (raised when needed so the lens stays ≥ ~37 % of the frame\'s short side; bounded by the frame; never below 1.5)', 1.5, 4), placement: oneOf('Where the lens opens', ['auto', 'right', 'bottom'])}, ['zoom', 'placement']),
  contextLabels: obj('Labels of the context view', {context: str('Context caption (legend heading)', 80), marker: str('Label of the changed-datum marker (legend)', 60)}, ['context', 'marker']),
};

const defaultParams = {...EN};

function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const n = P.routes.length;
  const fi = Math.min(n, Number(P.focusTarget.slice(5))) - 1;
  const before = P.beforeValue || P.routes[fi].end;
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'file', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) rows.push({kind: 'item', icon: 'concluded', text: P.outcomes.concluded, name: 'lg-concluded'});
  if (showKey) rows.push({kind: 'item', icon: 'pending', text: P.outcomes.pending, name: 'lg-pending'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: ctx.t.calendar, name: 'lg-calendar'});
  if (showKey) rows.push({kind: 'item', icon: 'delta', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gap = F * 1.4;
  let desk, panel = null, PL = null;
  if (!rows.length) desk = opts.band ? {x: 0, y: 0, w: DW, h: DH} : {x: 0, y: 0, w: DW * (1 - opts.pw) - gap, h: DH};
  else if (opts.band) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols || 1, tight: opts.tight});
    desk = {x: 0, y: 0, w: DW, h: DH - PL.h - gap - F * 0.4};
    panel = {x: 4, y: DH - PL.h - F * 0.4};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F});
    desk = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  if (desk.h < F * 8) return {F, ok: false, problems: ['desk-height']};
  const orient = opts.orient;
  const tabFit = showKey ? fitG(P.labels.file, {maxWidth: desk.w * 0.7, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  const tabH = tabFit ? tabFit.height + F * 0.6 : F * 1.4;
  const tabW = tabFit ? tabFit.width + F * 1.6 : F * 8;
  const mI = Math.max(12, F * 0.6);
  const pF = Math.max(10, F * 0.5) + F * 0.5;
  const folder = {x: desk.x + mI, y: desk.y + mI + tabH, w: desk.w - 2 * mI};
  const mapW = folder.w - 2 * pF;
  // (the map may take at most this share of the desk height: the lens needs the rest on tall frames)
  const mapHmax = (desk.h - 2 * mI - tabH - 2 * pF) * (opts.mapK || 1);
  const np = P.routes.filter(rt => rt.state === 'pending').length;
  const alt = showKey ? {index: fi, text: P.afterValue} : null;
  const P2 = showKey ? {...P, routes: P.routes.map((rt, i) => (i === fi ? {...rt, end: before} : rt))} : P;
  let OM, EM, plan;
  if (orient === 'h') {
    const gapM = Math.max(F * 7, mapW * 0.16);
    const tot = Math.min(F * 40, mapW - gapM);
    if (tot < F * 16) return {F, ok: false, problems: ['map-width']};
    for (const k of [0.47, 0.52, 0.42, 0.57]) {
      OM = originModel(P2, {w: tot * k, F, showText: showKey});
      EM = endModel(P2, {w: tot * (1 - k), F, showText: showKey, alt});
      if (OM.ok && EM.ok) break;
    }
    plan = mapPlan(P2, OM, EM, {F, orient, gap: mapW - tot, slots: Math.max(1, np), tray: false});
    // spare height spreads the end cards apart (a fuller sheet, never a blank band)
    const spare = mapHmax - plan.needH;
    if (spare > 1 && n > 1) plan = mapPlan(P2, OM, EM, {F, orient, gap: mapW - tot, slots: Math.max(1, np), tray: false, gx: Math.max(F * 0.8, 14) + Math.min(F * 2.4, spare / (n - 1))});
  } else {
    const gx = Math.max(F * 0.8, 14);
    const ew = Math.min(F * 15, (mapW - (n - 1) * gx) / n);
    const ow = Math.min(F * 17, mapW - 2 * (F * 3.4 + F * 0.9));
    if (ew < F * 7.5 || ow < F * 8) return {F, ok: false, problems: ['map-width']};
    OM = originModel(P2, {w: ow, F, showText: showKey});
    EM = endModel(P2, {w: ew, F, showText: showKey, alt});
    plan = mapPlan(P2, OM, EM, {F, orient, gap: F * 6.5, slots: Math.max(1, np), tray: false});
  }
  const fitsW = plan.needW <= mapW + 0.5, fitsH = plan.needH <= mapHmax + 0.5;
  folder.h = plan.needH + 2 * pF;
  const pl = shiftPlan(plan, folder.x + pF + (mapW - plan.needW) / 2, folder.y + pF);
  desk.h = Math.min(desk.h, 2 * mI + tabH + folder.h);
  if (panel && opts.band) panel.y = desk.y + desk.h + gap;
  const usedH = PL ? Math.max(desk.y + desk.h, panel.y + PL.h) : desk.y + desk.h;
  const dyC = Math.max(0, (DH - usedH) / 2) * (!PL && opts.band ? 0.3 : 1);
  // the lens source: the focus end card and the last leg of its track (whole fields only)
  const E = pl.E[fi], rt = pl.routes[fi];
  const m = Math.min(Math.max(F * 0.5, 8), Math.max(F * 0.8, 14) * 0.6);
  const last = rt.pts[rt.pts.length - 2];
  let src;
  if (orient === 'h') {
    const leg = E.x - last.x;
    const x0 = Math.min(E.x - leg * 0.55, rt.clip.x - F * 0.5);
    src = {x: x0, y: E.y - m, w: E.x + E.w + m - x0, h: E.h + 2 * m};
  } else {
    const leg = E.y - last.y;
    const y0 = Math.min(E.y - leg * 0.55, rt.clip.y - F * 0.5);
    src = {x: E.x - m, y: y0, w: E.w + 2 * m, h: E.y + E.h + m - y0};
  }
  const wasLab = showKey ? fitG(ctx.t.was, {maxWidth: 1000, size: F, minSize: F, maxLines: 1, weight: 500}) : null;
  const was1 = showKey ? fitG(before, {maxWidth: 10000, size: F, minSize: F, maxLines: 1, weight: 600}) : null;
  // (the "was" band wraps a long value onto a second line)
  const wasLines = was1 && was1.width + wasLab.width + F * 2 > src.w * 1.6 ? 2 : 1;
  const bandH = was1 ? F * (0.9 + 1.2 * wasLines) + F * 0.3 : F * 1.6;
  const shortSide = Math.min(ctx.view.width, ctx.view.height) / fitDesign(ctx.view, DW, DH).scale;
  const kS = opts.shrink || 1;
  const pref = P.detailGeometry.placement === 'auto' ? (opts.band && !opts.shrink ? 'bottom' : 'right') : P.detailGeometry.placement;
  const lensFor = placement => {
    let room;
    if (kS < 1) {
      const cr = desk.x + desk.w * kS + F * 0.8, cb = (desk.y + desk.h + dyC) * kS + F * 0.8;
      room = placement === 'right' ? {x: cr, y: 4, w: DW - cr - 4, h: DH - 8} : {x: 4, y: cb, w: DW - 8, h: DH - cb - 4};
    } else if (placement === 'right') room = {x: desk.x + desk.w + F * 0.6, y: 4, w: DW - desk.w - F * 0.6 - 4, h: DH - 8};
    else { const top = desk.y + desk.h + dyC + F * 0.6; room = {x: 4, y: top, w: DW - 8, h: DH - top - 4}; }
    const zMax = Math.min((room.w - 8) / src.w, (room.h - bandH - 8) / src.h);
    const zNeed = (0.37 * shortSide) / Math.min(src.w, src.h);
    const zoom = Math.min(Math.max(P.detailGeometry.zoom, zNeed), zMax);
    const dW = src.w * zoom, dH = src.h * zoom;
    const s1 = kS < 1 ? {x: desk.x + (src.x - desk.x) * kS, y: (src.y + dyC) * kS - dyC, w: src.w * kS, h: src.h * kS} : src;
    const srcC = {x: s1.x + s1.w / 2, y: s1.y + dyC + s1.h / 2};
    const dx = placement === 'right' ? room.x + (room.w - dW) / 2 : clamp(srcC.x - dW / 2, room.x, room.x + room.w - dW);
    const dy = placement === 'right' ? clamp(srcC.y - (dH + bandH) / 2, room.y, room.y + room.h - dH - bandH) : room.y + Math.max(0, (room.h - dH - bandH) / 2);
    return {dest: {x: dx, y: dy - dyC, w: dW, h: dH}, zoom, big: Math.min(dW, dH) / shortSide, placement};
  };
  // (the supplied placement is a preference: when the lens cannot be large enough there, the other side is used)
  let LZ = lensFor(pref);
  if (LZ.zoom < 1.5 || LZ.big < 0.355) { const L2 = lensFor(pref === 'right' ? 'bottom' : 'right'); if ((L2.zoom >= 1.5 && L2.big >= 0.355) || L2.big > LZ.big) LZ = L2; }
  const {dest, zoom, placement} = LZ;
  const wasBand = {x: dest.x, y: dest.y + dest.h + 6, w: dest.w, h: bandH - 6};
  const wasFit = was1 ? fitG(before, {maxWidth: dest.w - wasLab.width - F * 1.8, size: F, minSize: F, maxLines: wasLines, weight: 600}) : null;
  // nothing but the focus card, its own track and its own clip may lie inside the crop
  const others = [pl.O, ...pl.E.filter((b, i) => i !== fi), pl.cal, ...pl.routes.filter((q, i) => i !== fi).map(q => q.clip)].filter(Boolean);
  const cropClean = !others.some(b => overlaps(b, src, -0.5));
  const problems = [!fitsW && 'map-width', !fitsH && 'map-height', !OM.ok && 'origin-text', !EM.ok && 'end-text', !plan.ok && plan.problems.join('+'), PL && !PL.ok && 'panel-text',
    zoom < 1.5 && 'lens-small', LZ.big < 0.35 && 'lens-thumbnail', !cropClean && 'crop', tabFit && !tabFit.ok && 'tab-text',
    wasFit && (!wasFit.ok || wasFit.height > wasBand.h - F * 0.4) && 'was-band'].filter(Boolean);
  return {kS, F, fi, before, desk, panel, PL, OM, EM, pl, D: plan.D, folder, tabFit, tabH, tabW, src, dest, wasBand, wasFit, wasLab, zoom, placement, dyC, orient, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const arrangements = shape === 'portrait' ? [{band: true, orient: 'v', mapK: 0.6}, {band: true, cols: 2, orient: 'v', mapK: 0.6}, {band: true, cols: 2, orient: 'h', mapK: 0.6}]
      : shape === 'square' ? [{band: true, cols: 2, orient: 'v', shrink: 0.56}, {band: true, cols: 2, orient: 'v', shrink: 0.5}, {band: true, cols: 2, orient: 'h', shrink: 0.55}, {band: true, cols: 2, orient: 'h', shrink: 0.5}, {band: true, cols: 3, tight: true, orient: 'v', shrink: 0.48}, {band: true, cols: 3, tight: true, orient: 'h', shrink: 0.48}]
        : [{pw: 0.4, orient: 'v'}, {pw: 0.44, orient: 'v'}, {pw: 0.36, orient: 'h'}, {pw: 0.3, orient: 'h', shrink: 0.62}, {pw: 0.3, orient: 'h', shrink: 0.56}, {pw: 0.36, orient: 'h', shrink: 0.56}, {pw: 0.44, orient: 'h'}];
    const sizes = (!showKey ? [40, 36, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    // (two passes: the context at full size — no stepping back — while key text stays ≥ ~21 px; then everything)
    const passes = [{arr: arrangements.filter(a => !a.shrink), sizes: sizes.filter(F => F * pxu >= 21)}, {arr: arrangements, sizes}];
    outer: for (const pass of passes) for (const F of pass.sizes) {
      for (const a of pass.arr) {
        const c = compose(ctx, P, F, a);
        if (globalThis.__trace) globalThis.__trace.push([r(F * pxu, 1), JSON.stringify(a), c.problems, c.zoom && r(c.zoom, 2)]);
        if (c.ok) { C = c; break outer; }
        if (c.pl && (!C || c.problems.length < C.problems.length)) C = c;
      }
    }
    if (!C) for (const a of arrangements) { const c = compose(ctx, P, sizes[sizes.length - 1] * 0.8, a); if (c.pl) { C = c; break; } }
    return {P, C, pxu};
  },
  build(ctx, L) {
    const {C, P} = L;
    const {pl, D} = C;
    const th = ctx.theme;
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const clipSize = C.orient === 'h' ? {w: D.along, h: D.across} : {w: D.across, h: D.along};
    const map = pre => [
      pl.routes.map((rt, i) => trackNode(ctx, rt, D, {prefix: `${pre}track${i}`})),
      pl.routes.map((rt, i) => (P.routes[i].state === 'concluded' ? inkNode(ctx, rt, D, {prefix: `${pre}ink${i}`, color: inkColor(th)}) : null)),
      pl.routes.map((rt, i) => (P.routes[i].state === 'concluded' ? g(null, rt.chev.map((c, j) => chevron(D, {name: `${pre}chev${i}-${j}`, transform: T(c.x, c.y, c.a), opacity: 0}))) : null)),
      pl.E.map((b, i) => g({transform: T(b.x, b.y)}, endNode(ctx, C.EM, i, P.routes[i], {prefix: `${pre}end${i}`}))),
      pl.routes.map((rt, i) => (P.routes[i].state === 'pending' ? g({name: `${pre}clip${i}`, transform: T(rt.clipC.x, rt.clipC.y)}, filterClip(ctx, {prefix: `${pre}clip${i}-art`, w: clipSize.w, h: clipSize.h})) : null)),
    ];
    const S = C.src;
    const E = pl.E[C.fi];
    const R = Math.max(14, C.F * 0.75);
    const mk = {x: E.x + E.w - R * 0.2, y: E.y + R * 0.2};
    const lens = g({name: 'lens', 'data-occludes': 1, opacity: 0},
      h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {name: 'lens-cliprect', x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 18}))),
      h('rect', {name: 'lens-shadow', x: r(S.x + 8), y: r(S.y + 12), width: r(S.w), height: r(S.h), rx: 18, fill: th.shadow}),
      h('rect', {name: 'lens-bg', x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 18, fill: '#fbf8f1'}),
      g({'clip-path': ctx.ref('lens-clip')}, g({name: 'lens-content', opacity: 0}, map('L-'))),
      h('rect', {name: 'lens-border', x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5}));
    const B = C.wasBand;
    const was = g({name: 'was', opacity: 0},
      h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 10), fill: th.card, stroke: SLATE, 'stroke-width': 2}),
      C.wasFit ? textAt(C.wasLab, {x: B.x + C.F * 0.6, y: B.y + (B.h - C.wasLab.height) / 2, fill: th.fgSoft, italic: true}) : null,
      C.wasFit ? textAt(C.wasFit, {x: B.x + C.F * 0.6 + C.wasLab.width + C.F * 0.5, y: B.y + (B.h - C.wasFit.height) / 2, fill: INK})
        : h('rect', {x: r(B.x + C.F), y: r(B.y + B.h / 2 - C.F * 0.2), width: r(B.w * 0.5), height: r(C.F * 0.4), rx: r(C.F * 0.2), fill: SLATE, opacity: 0.55}));
    return g({name: 'scene', transform: C.dyC ? T(0, C.dyC) : undefined},
      g({name: 'ctx', transform: 'translate(0 0)'},
        desk.surface,
        g({'clip-path': desk.clip},
          g({transform: T(C.folder.x, C.folder.y)}, folderNode(ctx, {prefix: 'folder', w: C.folder.w, h: C.folder.h, tabW: C.tabW, tabH: C.tabH, labelFit: C.tabFit, F: C.F})),
          pl.cal ? g({transform: T(pl.cal.x, pl.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: pl.cal.w, h: pl.cal.h})) : null,
          g({transform: T(pl.O.x, pl.O.y)}, originNode(ctx, C.OM, {prefix: 'origin'})),
          map('')),
        desk.frame,
        h('path', {name: 'dim', d: roundRectPath(C.desk.x, C.desk.y, C.desk.w, C.desk.h, 26), fill: '#1f2328', opacity: 0}),
        h('path', {name: 'src', d: roundRectPath(S.x, S.y, S.w, S.h, 14), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
        g({name: 'marker', opacity: 0}, changedMarker(ctx, {x: mk.x, y: mk.y, radius: R}))),
      h('line', {name: 'coneA', stroke: th.accent2, 'stroke-width': 2.5, opacity: 0}),
      h('line', {name: 'coneB', stroke: th.accent2, 'stroke-width': 2.5, opacity: 0}),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null,
      lens, was);
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const {pl} = C;
    const nodes = {};
    const e = ease.inOutCubic;
    // build: ink runs, clips settle, badges show (context and lens copies alike)
    const kInk = e(seg(u, ...W.ink)), kClip = e(seg(u, ...W.clips)), kBadge = seg(u, ...W.badges);
    for (const pre of ['', 'L-']) {
      P.routes.forEach((rt, i) => {
        const q = pl.routes[i];
        if (rt.state === 'concluded') {
          nodes[`${pre}ink${i}`] = {'stroke-dashoffset': r(q.len * (1 - kInk), 1)};
          q.chev.forEach((c, j) => { nodes[`${pre}chev${i}-${j}`] = {opacity: kInk * q.len >= c.s + C.F ? 1 : 0}; });
        } else {
          const off = (C.orient === 'h' ? -1 : -1) * C.F * 1.2 * (1 - kClip);
          nodes[`${pre}clip${i}`] = {transform: T(q.clipC.x + (C.orient === 'v' ? off : 0), q.clipC.y + (C.orient === 'h' ? off : 0), 0, 1 + 0.08 * (1 - kClip)), opacity: r(0.25 + 0.75 * kClip, 3)};
        }
        nodes[`${pre}end${i}-st`] = {opacity: r(kBadge, 3)};
      });
    }
    const kOpen = e(seg(u, ...W.open)) * (1 - e(seg(u, ...W.close)));
    const S = C.src, D = C.dest;
    const ctxK = lerp(1, C.kS, kOpen);
    const dk = C.desk;
    nodes.ctx = {transform: ctxK === 1 ? 'translate(0 0)' : `translate(${r(dk.x * (1 - ctxK))} ${r(-C.dyC * (1 - ctxK))}) scale(${r(ctxK, 4)})`};
    const S1 = {x: dk.x + (S.x - dk.x) * ctxK, y: (S.y + C.dyC) * ctxK - C.dyC, w: S.w * ctxK, h: S.h * ctxK};
    const R = {x: lerp(S1.x, D.x, kOpen), y: lerp(S1.y, D.y, kOpen), w: lerp(S1.w, D.w, kOpen), h: lerp(S1.h, D.h, kOpen)};
    const txtK = C.kS < 1 ? clamp((C.F * L.pxu * ctxK - 16.5) / 2.5) : 1;
    const k = R.w / S.w;
    const lensOn = kOpen > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    nodes.lens = {opacity: lensOn ? 1 : 0};
    nodes['lens-cliprect'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    const copyK = lensOn ? 1 : 0;
    nodes['lens-content'] = {transform: `${T(R.x - S.x * k, R.y - S.y * k)} scale(${r(k, 4)})`, opacity: copyK};
    const srcK = seg(u, ...W.src) * (1 - seg(u, W.close[1], W.close[1] + 0.02));
    nodes.src = {opacity: r(srcK, 3)};
    const sc = {x: S1.x + S1.w / 2, y: S1.y + S1.h / 2}, rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
    const horiz = Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y);
    const cone = horiz
      ? [{x: S1.x + S1.w, y: S1.y}, {x: R.x, y: R.y}, {x: S1.x + S1.w, y: S1.y + S1.h}, {x: R.x, y: R.y + R.h}]
      : [{x: S1.x, y: S1.y + S1.h}, {x: R.x, y: R.y}, {x: S1.x + S1.w, y: S1.y + S1.h}, {x: R.x + R.w, y: R.y}];
    const coneK = kOpen > 0.15 ? 1 : 0;
    nodes.coneA = {x1: r(cone[0].x), y1: r(cone[0].y), x2: r(cone[1].x), y2: r(cone[1].y), opacity: coneK};
    nodes.coneB = {x1: r(cone[2].x), y1: r(cone[2].y), x2: r(cone[3].x), y2: r(cone[3].y), opacity: coneK};
    nodes.dim = {opacity: r(0.22 * kOpen, 3)};
    const pk = clamp(u < W.close[0] ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn));
    if (C.PL) nodes.panel = {opacity: r(overlaps(C.dest, {x: C.panel.x, y: C.panel.y, w: C.PL.w, h: C.PL.h}) ? pk : 1, 3)};
    // the datum: context copy hidden while the lens holds it; in the lens the old entry lifts out, the new one comes in
    const kLift = seg(u, ...W.lift), kNew = seg(u, ...W.newIn);
    const substituted = u >= W.lift[0];
    const lensHolds = copyK > 0.02;
    const fi = C.fi;
    if (C.EM.showText) {
      for (const pre of ['', 'L-']) {
        const inLens = pre === 'L-';
        const ctxBefore = !substituted && !lensHolds ? 1 : 0;
        const ctxAfter = substituted && !lensHolds ? 1 : 0;
        nodes[`${pre}end${fi}-end`] = {opacity: r(inLens ? 1 - kLift : ctxBefore * txtK, 3), transform: inLens ? T(0, -C.F * 0.9 * kLift) : 'translate(0 0)'};
        nodes[`${pre}end${fi}-alt`] = {opacity: r(inLens ? kNew : ctxAfter * txtK, 3)};
      }
      if (C.kS < 1) {
        nodes['origin-title'] = {opacity: r(txtK, 3)};
        nodes['origin-ref-t'] = {opacity: r(txtK, 3)};
        nodes['origin-grounds'] = {opacity: r(txtK, 3)};
        nodes['folder-tab-t'] = {opacity: r(txtK, 3)};
        P.routes.forEach((rt, i) => {
          nodes[`end${i}-label`] = {opacity: r(txtK, 3)};
          if (i !== fi) nodes[`end${i}-end`] = {opacity: r(txtK, 3)};
        });
      }
    }
    const wasK = clamp(seg(u, W.lift[0] + 0.02, W.lift[1]) * clamp((kOpen - 0.85) / 0.15));
    nodes.was = {opacity: r(wasK, 3)};
    const markK = seg(u, ...W.marker);
    nodes.marker = {opacity: r(markK, 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const shown = !lensHolds ? (substituted ? 'after' : 'before') : 'lens';
    return {
      nodes,
      semantic: {
        beat, open: r(kOpen, 3), copy: copyK, zoom: r(C.zoom, 3), lensBox: R2({x: R.x, y: R.y}), lensSize: {w: r(R.w), h: r(R.h)},
        src: {x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)}, dest: {x: r(D.x), y: r(D.y), w: r(D.w), h: r(D.h)},
        value: substituted ? 'after' : 'before', contextShows: shown, lift: r(kLift, 3), newIn: r(kNew, 3), was: r(wasK, 3), marker: r(markK, 3),
        before: C.before, after: P.afterValue, focus: fi, ink: r(kInk, 3), clips: r(kClip, 3), badges: r(kBadge, 3),
        states: P.routes.map(x => x.state), labels: P.routes.map(x => x.label),
        placement: C.placement, ctxK: r(ctxK, 3), ctxText: r(txtK, 3), dyC: r(C.dyC, 2),
        problems: C.problems, textPx: r(C.F * L.pxu, 1), orient: C.orient,
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
    slug: 'review-10-inspect',
    title: 'Route closure — a lens on one route\'s end card and last leg: its supplied end entry is substituted, every route state stays untouched',
    titleEs: 'Cierre de itinerario — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Cierre de itinerario',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A top-down desk with the case file in the state the marking produced: the route supplied as concluded inked with arrows to its end card, the ways supplied as pending a check carrying filter clips. A lens opens a real enlarged copy of the focus route\'s end card and the last leg of its track — the detail that tells a concluded route from a way pending a check. In the lens the supplied end entry lifts into a "was" band and the alternative entry takes its place. The lens closes, the context shows the new entry with the neutral changed-datum marker; no track, clip, badge or state changes. Seeking back restores the old entry. Illustrative; jurisdiction unspecified.',
    tags: ['review', 'route closure', 'inspect', 'lens', 'end card', 'substitution', 'was band', 'changed datum', 'routes as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/cierre-de-itinerario.js', 'src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/desk.js', 'src/primitives/markers.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
