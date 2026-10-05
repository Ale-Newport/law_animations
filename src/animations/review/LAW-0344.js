/**
 * LAW-0344 — Confirmación ilustrativa · inspect
 *
 * Storyboard (a top-down desk in the state the alignment produced: card A, the original decision, and card B, the
 * confirmatory decision as supplied, lie square side by side with their arrow marks meeting; the filter strip lies
 * across the configured row; a desk calendar is a fixture only):
 *  0.00–0.20  build: the strip settles onto the aligned rows; the context reads as the aligned pair.
 *  0.20–0.45  isolate: the upper part of the focus card (its letter badge, role, title and reference tag — the detail
 *             that tells card A from card B) is outlined and a real enlarged copy of it opens beside the desk; the
 *             context copy of the reference value is hidden while the lens holds it (the rest of the desk stays, dimmed).
 *  0.45–0.75  substitute: in the lens the supplied reference value lifts out into a "was" band under the lens and the
 *             alternative value takes its place; only the tag's own width follows. Nothing else on either card changes
 *             — the printed results are never touched.
 *  0.75–1.00  return: the lens closes onto its source, the context tag shows the new value and the neutral "changed
 *             datum" marker (Δ) stays beside it; the key reads "as supplied · no conclusion drawn". Seeking back
 *             restores the old value exactly. No validity, responsibility or outcome is inferred.
 * @module animations/review/LAW-0344
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
  ciFields, CI_EN, CI_ES, localisedCi, cardModel, cardNode, arrowMark, filterStrip, calendarNode, panelLayout, panelNode,
  planDesk, arrowTip, cardTransform, refBox, fitG, textAt, INK, SLATE, R2, overlaps,
} from './kits/confirmacion-ilustrativa.js';

const ID = 'LAW-0344';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {settle: [0.03, 0.16], src: [0.2, 0.24], open: [0.24, 0.37], panelOut: [0.2, 0.26], lift: [0.47, 0.53], width: [0.52, 0.58], newIn: [0.57, 0.63], close: [0.75, 0.85], marker: [0.85, 0.9], panelIn: [0.85, 0.91]};
const SIZES = [25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {was: 'was', calendar: 'Desk calendar (no date marked)'},
  es: {was: 'antes', calendar: 'Calendario de mesa (sin fechas marcadas)'},
};

const OWN_EN = {
  focusTarget: 'refB',
  beforeValue: '',
  afterValue: 'Ref. B-02 (fictional)',
  detailGeometry: {zoom: 1.9, placement: 'auto'},
  contextLabels: {context: 'The desk after the two cards were aligned (as supplied)', marker: 'Changed: the reference tag only'},
};
const OWN_ES = {
  focusTarget: 'refB',
  beforeValue: '',
  afterValue: 'Ref. B-02 (ficticia)',
  detailGeometry: {zoom: 1.9, placement: 'auto'},
  contextLabels: {context: 'La mesa tras alinear las dos tarjetas (según lo aportado)', marker: 'Cambia: solo la etiqueta de referencia'},
};
const EN = {...CI_EN, ...OWN_EN};
const ES = {...CI_ES, ...OWN_ES};

const sceneSchema = {
  ...ciFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the reference tag of card B (refB) or of card A (refA)', ['refB', 'refA']),
  beforeValue: str('Value of the focus card\'s reference tag before the substitution (empty: the reference supplied in `decisions`)', 44),
  afterValue: str('Value of the focus card\'s reference tag after the substitution (the alternative datum, as supplied)', 44),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens (raised when needed so the lens stays ≥ ~37 % of the frame\'s short side; bounded by the frame; never below 1.5)', 1.5, 4), placement: oneOf('Where the lens opens', ['auto', 'right', 'bottom'])}, ['zoom', 'placement']),
  contextLabels: obj('Labels of the context view', {context: str('Context caption (legend heading)', 80), marker: str('Label of the changed-datum marker (legend)', 60)}, ['context', 'marker']),
};

const defaultParams = {...EN};

function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const side = P.focusTarget === 'refA' ? 'a' : 'b';
  const before = P.beforeValue || P.decisions[side].ref;
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: side === 'a' ? 'cardA' : 'cardB', text: P.contextLabels.context, name: 'lg-context'});
  if (showAll) rows.push({kind: 'item', icon: 'filter', text: P.routes.label, name: 'lg-guide'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: ctx.t.calendar, name: 'lg-calendar'});
  if (showKey) rows.push({kind: 'item', icon: 'delta', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gap = F * 1.4;
  let desk, panel = null, PL = null;
  // (labels hidden: no panel, but the lens still needs its side of the frame)
  if (!rows.length) desk = opts.band ? {x: 0, y: 0, w: DW * (opts.deskW || 1), h: DH} : {x: 0, y: 0, w: DW * (1 - opts.pw) - gap, h: DH};
  else if (opts.band) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols || 1, tight: opts.tight});
    // (deskW: a narrower desk, the lens opening at its right — square frames)
    desk = {x: 0, y: 0, w: DW * (opts.deskW || 1), h: DH - PL.h - gap - F * 0.4};
    panel = {x: 4, y: DH - PL.h - F * 0.4};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F});
    desk = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  const inset = Math.max(16, F * 0.8);
  const inner = {x: desk.x + inset, y: desk.y + inset, w: desk.w - inset * 2, h: desk.h - inset * 2};
  const refAlt = showKey ? {[side]: P.afterValue} : null;
  const P2 = showKey ? {...P, decisions: {...P.decisions, [side]: {...P.decisions[side], ref: before}}} : P;
  const planFor = (cw, bars) => {
    const M = cardModel(P2, {w: cw, F, showText: showKey, bars, refAlt});
    return {M, plan: planDesk(M, {F, mode: 'none', align: P.routes.align, avail: inner})};
  };
  const cap = Math.min(F * (showKey ? 24 : 20), inner.w * 0.5);
  if (planFor(cap, 0).plan.needH > inner.h + 0.5) return {F, problems: ['desk-height'], ok: false};
  let lo = F * 9, hi = cap, best;
  if (planFor(lo, 0).plan.needW > inner.w) best = planFor(lo, 0);
  else {
    for (let it = 0; it < 7; it++) { const mid = (lo + hi) / 2; if (planFor(mid, 0).plan.needW <= inner.w) lo = mid; else hi = mid; }
    for (const bars of [2, 1, 0]) { best = planFor(lo, bars); if (best.plan.needH <= inner.h) break; }
  }
  const {M, plan} = best;
  if (opts.band) {
    const hh = Math.min(desk.h, plan.needH + inset * 2 + F * 0.8);
    desk.h = hh; inner.h = hh - inset * 2;
    if (panel) panel.y = hh + gap;
  }
  const ox = inner.x + (inner.w - plan.needW) / 2, oy = inner.y + Math.max(0, (inner.h - plan.needH) / 2);
  const off = q => ({...q, x: q.x + ox, y: q.y + oy});
  const A = off(plan.A), B = off(plan.Bt);
  const strip = {...plan.strip, x: plan.strip.x + ox, yRest: plan.strip.yRest + oy, yLaid: plan.strip.yLaid + oy};
  const cal = plan.cal ? off(plan.cal) : null;
  // the lens source: the upper part of the focus card — badge, role, title and reference tag (every field whole)
  const pose = side === 'a' ? A : B;
  const rb = refBox(M, side);
  const m = Math.max(10, F * 0.5);
  // the "was" band under the lens (old value kept traceable)
  const wasFit = showKey ? fitG(before, {maxWidth: 10000, size: F, minSize: F, maxLines: 1, weight: 600}) : null;
  const wasLab = showKey ? fitG(ctx.t.was, {maxWidth: 1000, size: F, minSize: F, maxLines: 1, weight: 500}) : null;
  const usedH = PL ? Math.max(desk.y + desk.h, panel.y + PL.h) : desk.y + desk.h;
  const dyC = Math.max(0, (DH - usedH) / 2);
  const bandH = (wasFit ? Math.max(wasFit.height, F) + F * 0.9 : F * 1.6);
  const pref = P.detailGeometry.placement === 'auto' ? (opts.band && !opts.deskW ? 'bottom' : 'right') : P.detailGeometry.placement;
  // (the frame's short side in design units: the lens is measured against the whole frame, not the safe box)
  const shortSide = Math.min(ctx.view.width, ctx.view.height) / fitDesign(ctx.view, DW, DH).scale;
  // lens destination: the free side (right of the desk on wide frames — over the panel, which steps aside —, below it on
  // tall ones), as large as the room allows within the supplied zoom, never below 1.5×. The crop is the whole card
  // width, from the header down to the reasons line (or, when that cannot be enlarged enough, down to the reference
  // tag): every field inside is whole.
  const kS = opts.shrink || 1;
  const lensFor = (deep, placement, overlap) => {
    const src = {x: pose.x - m * 0.5, y: pose.y + M.header.y - m, w: M.w + m, h: (deep ? M.grounds.y + M.grounds.h : M.ref.y + M.ref.h) - M.header.y + 2 * m};
    let room;
    if (kS < 1) {
      // shrink mode (square frames): the context steps back to the top-left at kS; the lens takes the space below or
      // at the right of it, over the panel (which steps aside)
      // (the context steps back about the frame's top edge above the desk's left edge: it moves up as it shrinks)
      const cr = desk.x + desk.w * kS + F * 0.8, cb = (desk.y + desk.h + dyC) * kS + F * 0.8;
      room = placement === 'right' ? {x: cr, y: 4, w: DW - cr - 4, h: DH - 8} : {x: 4, y: cb, w: DW - 8, h: DH - cb - 4};
    } else if (placement === 'right') room = {x: desk.x + desk.w + F * 0.6, y: 4, w: DW - desk.w - F * 0.6 - 4, h: DH - 8};
    else {
      // (below the desk's objects — the cards and the calendar —: the lens may lie over the desk's empty lower margin)
      const objB = Math.max(A.y + M.h, cal ? cal.y + cal.h : 0) + dyC + F * 0.6;
      room = {x: 4, y: objB, w: DW - 8, h: DH - objB - 4};
    }
    // (where the room below the desk is short the lens may overlap the desk's lower part — never its source)
    if (overlap && placement === 'bottom' && room.h < src.h * 1.5 + bandH) {
      const top = src.y + dyC + src.h + F * 0.8;
      room = {x: 4, y: top, w: DW - 8, h: DH - top - 4};
    }
    const zMax = Math.min((room.w - 8) / src.w, (room.h - bandH - 8) / src.h);
    // (the supplied magnification, raised when needed so the lens stays a real inspection — ≥ ~37 % of the frame's short
    // side —, always bounded by the room)
    const zNeed = (0.37 * shortSide) / Math.min(src.w, src.h);
    const zoom = Math.min(Math.max(P.detailGeometry.zoom, zNeed), zMax);
    const dW = src.w * zoom, dH = src.h * zoom;
    const s1 = kS < 1 ? {x: desk.x + (src.x - desk.x) * kS, y: (src.y + dyC) * kS - dyC, w: src.w * kS, h: src.h * kS} : src;
    const srcC = {x: s1.x + s1.w / 2, y: s1.y + dyC + s1.h / 2};
    const dx = placement === 'right' ? room.x + (room.w - dW) / 2 : clamp(srcC.x - dW / 2, room.x, room.x + room.w - dW);
    const dy = placement === 'right' ? clamp(srcC.y - (dH + bandH) / 2, room.y, room.y + room.h - dH - bandH) : room.y + Math.max(0, (room.h - dH - bandH) / 2);
    const dest = {x: dx, y: dy - dyC, w: dW, h: dH};
    return {src, dest, zoom, big: Math.min(dW, dH) / shortSide, placement, deep};
  };
  // (the supplied placement is a preference: when the lens cannot be enlarged enough there, the other side is used)
  // (in order: the deep crop beside the desk, the shallow crop beside it, then either overlapping the desk's lower part)
  const choose = placement => {
    const tries = [[true, false], [false, false], [true, true], [false, true]].map(([d, o]) => lensFor(d, placement, o));
    return tries.find(t => t.zoom >= 1.5 && t.big >= 0.355) || tries.find(t => t.zoom >= 1.5) || tries[0];
  };
  let LZ = choose(pref);
  if (LZ.zoom < 1.5 || LZ.big < 0.355) { const L3 = choose(pref === 'right' ? 'bottom' : 'right'); if (L3.zoom >= 1.5 && L3.big >= 0.355) LZ = L3; }
  const {src, dest, zoom, placement, deep} = LZ;
  const wasBand = {x: dest.x, y: dest.y + dest.h + 6, w: dest.w, h: bandH - 6};
  const problems = [plan.needW > inner.w + 0.5 && 'desk-width', plan.needH > inner.h + 0.5 && 'desk-height', !M.ok && 'card-text', PL && !PL.ok && 'panel-text', zoom < 1.5 && 'lens-small', LZ.big < 0.35 && 'lens-thumbnail',
    wasFit && wasLab && wasLab.width + wasFit.width + F * 2 > dest.w && 'was-band'].filter(Boolean);
  return {deep, kS, F, side, before, desk, inner, panel, PL, M, plan, A, B, strip, cal, src, dest, wasBand, wasFit, wasLab, zoom, placement, dyC, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const arrangements = shape === 'portrait' ? [{band: true}, {band: true, cols: 2}]
      : shape === 'square' ? [{band: true, cols: 2}, {band: true, cols: 2, shrink: 0.48}, {band: true, cols: 2, shrink: 0.44}, {band: true, cols: 3, tight: true, shrink: 0.44}]
        : [{pw: 0.34}, {pw: 0.38}, {pw: 0.42}, {pw: 0.46}];
    const sizes = (!showKey ? [40, 36, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements) {
        const c = compose(ctx, P, F, a);
        if (c.ok) { C = c; break outer; }
        if (c.M && (!C || c.problems.length < C.problems.length)) C = c;
      }
    }
    if (!C) C = compose(ctx, P, sizes[sizes.length - 1], {...arrangements[0]});
    return {P, C, pxu};
  },
  build(ctx, L) {
    const {C} = L;
    const {M, plan} = C;
    const th = ctx.theme;
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const card = (side, pose, pre, extra) => g({name: pre, transform: cardTransform(pose, M)},
      cardNode(ctx, M, side, {prefix: `${pre}-art`, seedKey: `ci-card-${side}`, ...extra}),
      g({transform: T(side === 'a' ? M.w + plan.arrow.len : -plan.arrow.len, plan.arrow.y)}, arrowMark(ctx, {side, len: plan.arrow.len, hgt: plan.arrow.hgt, dir: side === 'a' ? 1 : -1})));
    const contextKids = (pre) => [
      C.cal ? g({transform: T(C.cal.x, C.cal.y)}, calendarNode(ctx, {prefix: `${pre}calendar`, w: C.cal.w, h: C.cal.h})) : null,
      card('a', C.A, `${pre}carda`), card('b', C.B, `${pre}cardb`),
      g({name: `${pre}strip`, transform: T(C.strip.x, C.strip.yLaid)}, filterStrip(ctx, {prefix: `${pre}strip-art`, w: C.strip.w, h: C.strip.h, tab: C.strip.tab})),
    ];
    const S = C.src, D = C.dest;
    const k = D.w / S.w;
    const rb = refBox(M, C.side);
    const pose = C.side === 'a' ? C.A : C.B;
    const mk = {x: pose.x + rb.x + Math.max(rb.w, 0) + C.F * 1.1, y: pose.y + rb.y + rb.h / 2};
    // lens: a real enlarged copy of the same desk region, at the same coordinates
    const lensId = 'lens-clip';
    const lens = g({name: 'lens', 'data-occludes': 1, opacity: 0},
      h('defs', null, h('clipPath', {id: ctx.id(lensId)}, h('rect', {name: 'lens-cliprect', x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 18}))),
      h('rect', {name: 'lens-shadow', x: r(S.x + 8), y: r(S.y + 12), width: r(S.w), height: r(S.h), rx: 18, fill: th.shadow}),
      h('rect', {name: 'lens-bg', x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 18, fill: th.woodTop}),
      // (the copy holds what the crop can show: the focus card — its lines below the crop left out — and the strip)
      g({'clip-path': ctx.ref(lensId)}, g({name: 'lens-content', opacity: 0},
        card(C.side, C.side === 'a' ? C.A : C.B, `L-card${C.side}`, {skipText: C.deep ? ['result'] : ['result', 'grounds']}),
        g({name: 'L-strip', transform: T(C.strip.x, C.strip.yLaid)}, filterStrip(ctx, {prefix: 'L-strip-art', w: C.strip.w, h: C.strip.h, tab: C.strip.tab})))),
      h('rect', {name: 'lens-border', x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5}));
    const B = C.wasBand;
    const was = C.wasFit ? g({name: 'was', opacity: 0},
      h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 10), fill: th.card, stroke: SLATE, 'stroke-width': 2}),
      textAt(C.wasLab, {x: B.x + C.F * 0.6, y: B.y + (B.h - C.wasLab.height) / 2, fill: th.fgSoft, italic: true}),
      textAt(C.wasFit, {x: B.x + C.F * 0.6 + C.wasLab.width + C.F * 0.5, y: B.y + (B.h - C.wasFit.height) / 2, fill: INK})) : g({name: 'was', opacity: 0},
      h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 10), fill: th.card, stroke: SLATE, 'stroke-width': 2}),
      h('rect', {x: r(B.x + C.F), y: r(B.y + B.h / 2 - C.F * 0.2), width: r(B.w * 0.5), height: r(C.F * 0.4), rx: r(C.F * 0.2), fill: SLATE, opacity: 0.55}));
    return g({name: 'scene', transform: C.dyC ? T(0, C.dyC) : undefined},
      g({name: 'ctx', transform: 'translate(0 0)'},
        desk.surface,
        g({'clip-path': desk.clip}, contextKids('')),
        desk.frame,
        h('path', {name: 'dim', d: roundRectPath(C.desk.x, C.desk.y, C.desk.w, C.desk.h, 26), fill: '#1f2328', opacity: 0}),
        h('path', {name: 'src', d: roundRectPath(S.x, S.y, S.w, S.h, 14), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
        g({name: 'marker', opacity: 0}, changedMarker(ctx, {x: mk.x, y: mk.y, radius: Math.max(14, C.F * 0.75)}))),
      h('line', {name: 'coneA', stroke: th.accent2, 'stroke-width': 2.5, opacity: 0}),
      h('line', {name: 'coneB', stroke: th.accent2, 'stroke-width': 2.5, opacity: 0}),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null,
      lens, was);
  },
  frame(ctx, L, u) {
    const {C} = L;
    const {M} = C;
    const nodes = {};
    const e = ease.inOutCubic;
    const side = C.side;
    // build: the strip settles onto the rows
    const kSet = e(seg(u, ...W.settle));
    const sy = lerp(C.strip.yLaid - C.strip.h * 0.9, C.strip.yLaid, kSet);
    for (const pre of ['', 'L-']) nodes[`${pre}strip`] = {transform: T(C.strip.x, sy), opacity: r(0.35 + 0.65 * kSet, 3)};
    // lens open / close
    const kOpen = e(seg(u, ...W.open)) * (1 - e(seg(u, ...W.close)));
    const S = C.src, D = C.dest;
    // shrink mode: the context steps back about the desk's top-left corner in step with the lens
    const ctxK = lerp(1, C.kS, kOpen);
    const dk = C.desk;
    nodes.ctx = {transform: ctxK === 1 ? 'translate(0 0)' : `translate(${r(dk.x * (1 - ctxK))} ${r(-C.dyC * (1 - ctxK))}) scale(${r(ctxK, 4)})`};
    const S1 = {x: dk.x + (S.x - dk.x) * ctxK, y: (S.y + C.dyC) * ctxK - C.dyC, w: S.w * ctxK, h: S.h * ctxK};
    const R = {x: lerp(S1.x, D.x, kOpen), y: lerp(S1.y, D.y, kOpen), w: lerp(S1.w, D.w, kOpen), h: lerp(S1.h, D.h, kOpen)};
    // context text is hidden while the stepped-back context would render it under ~16 px
    const txtK = C.kS < 1 ? clamp((C.F * L.pxu * ctxK - 16.5) / 2.5) : 1;
    const k = R.w / S.w;
    const lensOn = kOpen > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    nodes.lens = {opacity: lensOn ? 1 : 0};
    nodes['lens-cliprect'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    // the enlarged copy is opaque from the first frame: at the start it lies exactly over its source (same coordinates,
    // same scale), so there is never a blank window nor a translucent double image
    const copyK = lensOn ? 1 : 0;
    nodes['lens-content'] = {transform: `${T(R.x - S.x * k, R.y - S.y * k)} scale(${r(k, 4)})`, opacity: r(copyK, 3)};
    const srcK = seg(u, ...W.src) * (1 - seg(u, W.close[1], W.close[1] + 0.02));
    nodes.src = {opacity: r(srcK, 3)};
    // cone lines from the source to the lens window
    const sc = {x: S1.x + S1.w / 2, y: S1.y + S1.h / 2}, rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
    const horiz = Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y);
    const cone = horiz
      ? [{x: S1.x + S1.w, y: S1.y}, {x: R.x, y: R.y}, {x: S1.x + S1.w, y: S1.y + S1.h}, {x: R.x, y: R.y + R.h}]
      : [{x: S1.x, y: S1.y + S1.h}, {x: R.x, y: R.y}, {x: S1.x + S1.w, y: S1.y + S1.h}, {x: R.x + R.w, y: R.y}];
    const coneK = kOpen > 0.15 ? 1 : 0;
    nodes.coneA = {x1: r(cone[0].x), y1: r(cone[0].y), x2: r(cone[1].x), y2: r(cone[1].y), opacity: coneK};
    nodes.coneB = {x1: r(cone[2].x), y1: r(cone[2].y), x2: r(cone[3].x), y2: r(cone[3].y), opacity: coneK};
    nodes.dim = {opacity: r(0.22 * kOpen, 3)};
    // panel steps aside while the lens is out (only when the lens opens over it), and back after
    const pk = clamp(u < W.close[0] ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn));
    if (C.PL) nodes.panel = {opacity: r(C.PL && overlaps(C.dest, {x: C.panel.x, y: C.panel.y, w: C.PL.w, h: C.PL.h}) ? pk : 1, 3)};
    // the datum: before value → lifted into the "was" band → after value (in the lens); the context copy is hidden while
    // the lens holds it and shows the new value only after the lens has closed
    const kLift = seg(u, ...W.lift), kW = e(seg(u, ...W.width)), kNew = seg(u, ...W.newIn);
    const substituted = u >= W.lift[0];
    const lensHolds = copyK > 0.02;
    const rb = refBox(M, side);
    const f = M.fits[side];
    const altW = f && f.refAlt ? Math.min(M.ref.w, f.refAlt.width + C.F * 1.4) : rb.w;
    const baseW = f && f.ref ? Math.min(M.ref.w, f.ref.width + C.F * 1.4) : rb.w;
    const chipW = lerp(baseW, altW, kW);
    const chipPath = roundRectPath(rb.x, rb.y, chipW, rb.h, Math.min(rb.h / 2, C.F * 0.6));
    for (const pre of ['', 'L-']) {
      const cp = `${pre}card${side}-art`;
      nodes[`${cp}-ref-body`] = {d: chipPath};
      if (f && f.ref) {
        const inLens = pre === 'L-';
        // context copy: before value visible until the lens holds it; after value only once the lens has closed
        const ctxBefore = !substituted && !lensHolds ? 1 : 0;
        const ctxAfter = substituted && !lensHolds ? 1 : 0;
        const lensBefore = 1 - kLift;
        const lensAfter = kNew;
        nodes[`${cp}-ref-t`] = {opacity: r(inLens ? lensBefore : ctxBefore * txtK, 3), transform: inLens ? T(0, -C.F * 0.9 * kLift) : 'translate(0 0)'};
        nodes[`${cp}-ref-alt`] = {opacity: r(inLens ? lensAfter : ctxAfter * txtK, 3)};
      }
    }
    if (C.kS < 1 && M.showText) for (const s0 of ['a', 'b']) {
      const cp = `card${s0}-art`;
      for (const n of ['role', 'title', 'grounds', 'res-t', 'badge-t']) nodes[`${cp}-${n}`] = {opacity: r(txtK, 3)};
      if (s0 !== side) { nodes[`${cp}-ref-t`] = {opacity: r(txtK, 3)}; }
    }
    // "was" band (under the lens) while the lens is open after the substitution
    const wasK = clamp(seg(u, W.lift[0] + 0.02, W.lift[1]) * clamp((kOpen - 0.85) / 0.15));
    nodes.was = {opacity: r(wasK, 3)};
    const markK = seg(u, ...W.marker);
    nodes.marker = {opacity: r(markK, 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const tipA = arrowTip(C.A, M, C.plan, 'a'), tipB = arrowTip(C.B, M, C.plan, 'b');
    const shown = !lensHolds ? (substituted ? 'after' : 'before') : 'lens';
    return {
      nodes,
      semantic: {
        beat, open: r(kOpen, 3), copy: r(copyK, 3), zoom: r(C.zoom, 3), lensBox: R2({x: R.x, y: R.y}), lensSize: {w: r(R.w), h: r(R.h)},
        src: {x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)}, dest: {x: r(D.x), y: r(D.y), w: r(D.w), h: r(D.h)},
        value: substituted ? 'after' : 'before', contextShows: shown, lift: r(kLift, 3), newIn: r(kNew, 3), was: r(wasK, 3), marker: r(markK, 3),
        before: C.before, after: L.P.afterValue, focus: side, chipW: r(chipW, 2), tipGap: r(Math.hypot(tipA.x - tipB.x, tipA.y - tipB.y), 2),
        results: [L.P.outcomes.a, L.P.outcomes.b], dyC: r(C.dyC, 2), placement: C.placement, ctxK: r(ctxK, 3), ctxText: r(txtK, 3),
        desk: {x: r(C.desk.x), y: r(C.desk.y), w: r(C.desk.w), h: r(C.desk.h)},
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
    slug: 'review-06-inspect',
    title: 'Illustrative confirmation — a lens on the focus card\'s reference tag: one supplied value is substituted, the printed results stay untouched',
    titleEs: 'Confirmación ilustrativa — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Confirmación ilustrativa',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A top-down desk in the state the alignment produced: the original decision card and the supplied confirmatory card lie square side by side under the filter strip. A lens opens a real enlarged copy of the focus card\'s upper part — badge, role, title and reference tag, the detail that tells the two cards apart. In the lens the supplied reference value lifts into a "was" band and the alternative value takes its place; only the tag\'s width follows. The lens closes, the context shows the new value with the neutral changed-datum marker, and the printed results never change. Seeking back restores the old value. Illustrative; jurisdiction unspecified.',
    tags: ['review', 'confirmation', 'inspect', 'lens', 'reference tag', 'substitution', 'was band', 'changed datum', 'result unchanged'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/desk.js', 'src/primitives/markers.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
