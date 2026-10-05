/**
 * LAW-0356 — Efectos durante revisión · inspect
 *
 * Storyboard (the two-lane board at the moment the decision card reaches the filter gate: the appeal card already
 * rests in the review lane's end bay; the gate's tag prints the supplied datum — by default "effect maintained", so the
 * slats stand edge-on (open) and the chevrons past the gate are lit; a calendar is a fixture; the legend beside or
 * below the board lists the lanes and the context):
 *  0.00–0.20  context: the board held still; the legend readable.
 *  0.20–0.45  a lens opens beside the board — a real enlarged copy (same coordinates) of the gate, its tag and the
 *             lit chevrons past it (the cards stay outside the crop); while the lens holds the tag, the context tag is
 *             blank (the datum is legible in ONE place only). The legend steps aside for the lens.
 *  0.45–0.75  substitution of one datum: the old value lifts away, the new supplied value settles (the cause); then,
 *             in the lens, the slats turn closed with the neutral pause glyph and the chevrons past the gate go grey
 *             (the local consequence) and stay still.
 *  0.75–1.00  the lens closes back to the context: the context gate is now closed, its tag prints the new value with
 *             the neutral changed-datum marker (Δ); the legend returns and keeps the previous datum traceable. Seeking
 *             back restores the old datum exactly. No doctrine, dates or time limits; nothing is judged.
 * @module animations/review/LAW-0356
 */
import {defineAnimation} from '../../core/define.js';
import {fitDesign} from '../../core/layout.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens as makeLens} from '../../frameworks/lens.js';
import {
  edFields, ED_EN, ED_ES, localisedEd, cardModel, cardNode, tagModel, boardPlan, boardNodes, gateFrame, litFrame,
  panelLayout, panelNode, R2, INK,
} from './kits/efectos-durante-revision.js';

const ID = 'LAW-0356';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], back: [0.75, 1]};
const W = {panelOut: [0.15, 0.21], open: [0.2, 0.36], oldOut: [0.46, 0.5], newIn: [0.5, 0.55], turn: [0.56, 0.64], close: [0.76, 0.86], marker: [0.84, 0.89], panelBack: [0.84, 0.9]};
const SIZES = [30, 28, 26, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const STATES = ['maintained', 'suspended'];

const OWN_EN = {
  objectLabels: {arrows: 'Chevrons past the gate: lit while the datum lets the card pass', calendar: 'Calendar (a fixture; no date marked)'},
  contextLabels: {context: 'The board when the decision card reaches the gate (as supplied)', marker: 'Δ Changed datum: the tag on the filter gate', previous: 'Previous datum'},
};
const OWN_ES = {
  objectLabels: {arrows: 'Chevrones tras el filtro: encendidos si el dato deja pasar la tarjeta', calendar: 'Calendario (accesorio; sin fechas marcadas)'},
  contextLabels: {context: 'El tablero cuando la resolución llega al filtro (según lo aportado)', marker: 'Δ Dato cambiado: la etiqueta del filtro', previous: 'Dato anterior'},
};
const EN = {...ED_EN, ...OWN_EN};
const ES = {...ED_ES, ...OWN_ES};

const sceneSchema = {
  ...edFields,
  objectLabels: obj('Captions of the board\'s objects in the legend', {
    arrows: str('Caption for the chevrons past the gate', 90),
    calendar: str('Caption for the calendar (a fixture only)', 70),
  }, ['arrows', 'calendar']),
  contextLabels: obj('Labels of the inspection', {
    context: str('Caption of the context (the board at that moment)', 100),
    marker: str('Caption of the changed-datum marker', 80),
    previous: str('Label of the previous datum kept traceable in the legend', 40),
  }, ['context', 'marker', 'previous']),
  finalState: oneOf('The datum after the substitution (as supplied). The datum before is the other one: maintained → suspended or suspended → maintained', STATES),
};

const defaultParams = {...EN, finalState: 'suspended'};

function compose(ctx, P, F, v, pxu) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const side = v.side;
  const after = P.finalState, before = after === 'maintained' ? 'suspended' : 'maintained';
  const problems = [];
  // legend (same place before and after the lens; the marker and previous-datum rows show after the substitution)
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'filter', text: P.labels.filter, name: 'lg-filter'});
  if (showKey) rows.push({kind: 'item', icon: 'laneA', text: P.routes.process, name: 'lg-process'});
  if (showKey) rows.push({kind: 'item', icon: 'laneB', text: P.routes.review, name: 'lg-review'});
  if (showAll) rows.push({kind: 'item', icon: 'kind-sequence', text: P.objectLabels.arrows, name: 'lg-arrows'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
  if (showAll) rows.push({kind: 'item', icon: 'same', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) rows.push({kind: 'item', icon: 'delta', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'state', text: `${P.contextLabels.previous}: ${P.outcomes[before]}`, name: 'lg-previous'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gap = F * 1.2;
  let area, band = null, PL = null;
  const shortD = Math.min(DW, DH);
  // (the lens's smaller side must reach ~0.35 of the frame's short side: 0.35 × 1080 px in design units)
  const lensMin = (0.35 * 1080) / pxu;
  void shortD;
  if (side) {
    const bw = DW * v.pw;
    PL = rows.length ? panelLayout(rows, {w: bw - 8, F}) : null;
    area = {x: 0, y: 0, w: DW - bw - gap, h: DH};
    band = {x: DW - bw, y: 0, w: bw, h: DH};
    if (PL && PL.h > DH) problems.push('panel-tall');
  } else {
    PL = rows.length ? panelLayout(rows, {w: DW - 8, F, cols: v.cols || 1, tight: v.tight}) : null;
    const bh = PL ? PL.h + F * 0.4 : 0;
    area = {x: 0, y: 0, w: DW, h: DH - bh - (PL ? gap : 0)};
    band = {x: 0, y: DH - bh, w: DW, h: bh};
  }
  const m = Math.max(F * 0.8, 14);
  const inner = {x: area.x + m, y: area.y + m, w: area.w - m * 2, h: area.h - m * 2};
  // (the tag with the fewest lines keeps the lens crop low, so the lens can magnify more)
  let TM = null;
  for (const k of [12, 14, 16]) {
    const q = tagModel(P, {w: F * k, F, maxLines: 4});
    if (!TM || (q.ok && (!TM.ok || q.h < TM.h - 1))) TM = q;
  }
  if (!TM.ok) problems.push('tag-text');
  const planFor = cw => {
    const M = cardModel(P, {w: cw, F, showText: showKey});
    return {M, B: boardPlan(M, TM, {F, orient: 'h'})};
  };
  const fits = q => q.B.w <= inner.w + 0.5 && q.B.h <= inner.h + 0.5 && q.M.ok;
  const lo = F * 8.6, hi = Math.max(lo, Math.min(F * 15, inner.w * 0.3));
  let best = null;
  for (let k = 0; k <= 8; k++) {
    const q = planFor(hi - ((hi - lo) * k) / 8);
    if (fits(q)) { best = q; break; }
    if (!best) best = q;
  }
  let {M, B} = best;
  if (!fits(best)) problems.push('board');
  if (!M.ok) problems.push('card-text');
  const extra = inner.w - B.w - F * 0.5;
  if (fits(best) && extra > 0) B = boardPlan(M, TM, {F, orient: 'h', travel: B.travel + extra * 0.5, run: B.run + extra * 0.5});
  // (the tag hangs from the gate's left edge so the lens crop can start right of the waiting card)
  const tag = {...B.tag, x: clamp(B.gT - B.gThk / 2, 0, B.len - TM.w)};
  B = {...B, tag};
  if (B.cal && tag.x < B.cal.x + B.cal.w + F * 0.4) problems.push('tag-calendar');
  // the plate hugs the board; centred in its area
  const plate = {w: B.w + m * 2, h: B.h + m * 2};
  plate.x = area.x + (area.w - plate.w) / 2;
  plate.y = side ? area.y + (area.h - plate.h) / 2 : area.y;
  const ox = plate.x + m, oy = plate.y + m;
  // lens source: the gate, its tag and the lit run past the gate (cards outside), in scene coordinates
  const cardRight = B.tWait + B.along;
  const sx0 = Math.max(cardRight + B.gapS * 0.35, B.gT - B.gThk / 2 - B.gapS * 0.6);
  const sx1 = Math.min(B.len, Math.max(tag.x + tag.w + F * 0.8, B.gT + B.gThk / 2 + F * 4));
  const sy0 = B.gateBox.y - F * 1.05, sy1 = tag.y + tag.h + F * 0.4;
  const src = {x: ox + sx0, y: oy + sy0, w: sx1 - sx0, h: sy1 - sy0};
  if (tag.x + tag.w > sx1 + 0.5) problems.push('lens-crop');
  // destination: side — inside the band where the legend stands; stacked — below the crop, over the review lane and
  // the legend band (both step aside while the lens is open; the process lane and the gate stay visible above it)
  const room = side ? {x: band.x, y: band.y, w: band.w, h: band.h}
    : {x: 0, y: src.y + src.h + F * 0.4, w: DW, h: DH - (src.y + src.h + F * 0.4)};
  const k = Math.min((room.w - F * 0.6) / src.w, (room.h - F * 0.4) / src.h, 3);
  if (k < 1.5 - 1e-6) problems.push('lens-zoom');
  const dest = {w: src.w * k, h: src.h * k};
  dest.x = side ? room.x + (room.w - dest.w) / 2 : clamp(src.x + src.w / 2 - dest.w / 2, room.x + F * 0.3, room.x + room.w - dest.w - F * 0.3);
  dest.y = side ? room.y + (room.h - dest.h) / 2 : room.y + Math.max(0, (room.h - dest.h) / 2) * 0.35;
  if (Math.min(dest.w, dest.h) < lensMin - 1e-6) problems.push('lens-small');
  if (globalThis.DBG) console.log('  src', Math.round(src.w), Math.round(src.h), 'room', Math.round(room.w), Math.round(room.h), 'k', k.toFixed(2), 'min', Math.round(lensMin), 'tagw', Math.round(TM.w), 'srcY', Math.round(src.y));
  const panel = PL ? (side ? {x: band.x + 4, y: Math.max(0, (DH - PL.h) / 2)} : {x: 4, y: band.y + (band.h - PL.h) / 2}) : null;
  if (PL && !PL.ok) problems.push('panel-text');
  return {F, side, M, TM, B, plate, ox, oy, src, dest, k, band, area, PL, panel, before, after, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 820], portrait: [950, 1420]},
  layout(ctx) {
    const P = localisedEd(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const vs = shape === 'portrait' ? [{}, {cols: 2}]
      : shape === 'square' ? [{cols: 2}, {cols: 2, tight: true}, {cols: 3, tight: true}]
        : [{side: true, pw: 0.36}, {side: true, pw: 0.4}, {side: true, pw: 0.44}];
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const sizes = (!showKey ? [34, 30, 27, ...SIZES] : SIZES).map(x => x / pxu);
    let C = null, best = null;
    outer: for (const F of sizes) for (const v of vs) {
      const c = compose(ctx, P, F, v, pxu);
      if (globalThis.DBG) console.log(r(F * pxu, 1), JSON.stringify(v), c.problems.join(','));
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.problems.length) best = c;
    }
    C = C || best;
    const lensGeom = makeLens(ctx, {name: 'lens', source: C.src, dest: C.dest, content: null, color: ctx.theme.accent2, frame: C.plate});
    return {P, C, lensGeom, pxu};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const {B, M, TM} = C;
    const bi = STATES.indexOf(C.before);
    const copy = (p, named) => {
      const bn = boardNodes(ctx, B, TM, {prefix: p, showText: showKey, tagOps: [0, 0]});
      const s0 = B.pos(0, B.tWait), s1 = B.pos(1, B.tEnd);
      return g({transform: T(C.ox, C.oy)},
        bn.lanes, bn.cal, bn.tag,
        g({transform: T(s0.x, s0.y)}, cardNode(ctx, M, 0, {prefix: `${p}-cardP`})),
        g({transform: T(s1.x, s1.y)}, cardNode(ctx, M, 1, {prefix: `${p}-cardR`})),
        bn.gate,
        named ? g({name: `${p}-mk`, opacity: 0, transform: T(B.tag.x + B.tag.w - 4, B.tag.y + 4)}, changedMarker(ctx, {radius: Math.max(14, C.F * 0.8)})) : null);
    };
    void bi;
    const lensContent = copy('ln', false);
    const L2 = makeLens(ctx, {name: 'lens', source: C.src, dest: C.dest, content: lensContent, color: th.accent2, frame: C.plate});
    return g({name: 'scene'},
      g({name: 'context'},
        h('path', {d: roundRectPath(C.plate.x + 5, C.plate.y + 7, C.plate.w, C.plate.h, 22), fill: th.shadow}),
        h('path', {name: 'board-plate', d: roundRectPath(C.plate.x, C.plate.y, C.plate.w, C.plate.h, 22), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
        copy('cx', true)),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null,
      g({name: 'lensw', opacity: 0, 'data-occludes': 1}, L2.node),
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const {B} = C;
    const nodes = {};
    const showKey = ctx.show('key');
    const kOpen = ease.inOutCubic(seg(u, ...W.open));
    const kClose = ease.inOutCubic(seg(u, ...W.close));
    const p = kOpen * (1 - kClose);
    Object.assign(nodes, L.lensGeom.frame(p, p));
    // the enlarged copy grows at its own place: shown from 40 % open on (no double image over the source)
    const lensVis = clamp((p - 0.4) / 0.25);
    nodes.lensw = {opacity: r(lensVis, 3)};
    const bi = STATES.indexOf(C.before), ai = 1 - bi;
    const kOld = seg(u, ...W.oldOut), kNew = seg(u, ...W.newIn);
    const kTurn = ease.inOutCubic(seg(u, ...W.turn));
    const changedNow = u >= W.newIn[0];
    // gate state: before → after (the slats turn only after the new value settled)
    const closedBefore = C.before === 'suspended' ? 1 : 0, closedAfter = C.after === 'suspended' ? 1 : 0;
    const closed = lerp(closedBefore, closedAfter, kTurn);
    for (const pfx of ['cx', 'ln']) {
      Object.assign(nodes, gateFrame(`${pfx}-gate`, closed, closed));
      const litK = 1 - closed;
      Object.assign(nodes, litFrame(pfx, B, litK >= 1 ? 1 : litK <= 0 ? 0 : litK));
    }
    // the datum: in the lens while it is shown; in the context otherwise (never both legible)
    const lensHolds = lensVis > 0;
    const vb = `-v${bi}`, va = `-v${ai}`;
    const oldOp = changedNow ? 0 : 1 - kOld, newOp = kNew;
    const ctxOld = !lensHolds && !changedNow ? 1 : 0;
    const ctxNew = !lensHolds && changedNow ? 1 : 0;
    if (showKey) {
      nodes[`ln-tag${vb}`] = {opacity: r(oldOp, 3), transform: T(0, -C.F * 0.9 * kOld)};
      nodes[`ln-tag${va}`] = {opacity: r(newOp, 3), transform: T(0, C.F * 0.4 * (1 - kNew))};
      nodes[`cx-tag${vb}`] = {opacity: ctxOld, transform: T(0, 0)};
      nodes[`cx-tag${va}`] = {opacity: ctxNew, transform: T(0, 0)};
    }
    const mk = seg(u, ...W.marker);
    nodes['cx-mk'] = {opacity: r(mk, 3)};
    // legend: steps aside while the lens is open, back after it closes (with the marker and the previous datum)
    const panelOp = clamp(1 - seg(u, ...W.panelOut)) + seg(u, ...W.panelBack);
    if (C.PL) {
      nodes.panel = {opacity: r(clamp(panelOp), 3)};
      for (const row of C.PL.rows) if (row.name === 'lg-marker' || row.name === 'lg-previous') nodes[row.name] = {opacity: r(mk, 3)};
    }
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const tagCtx = {x: C.ox + B.tag.x, y: C.oy + B.tag.y};
    const lensTag = {x: C.dest.x + (tagCtx.x - C.src.x) * C.k, y: C.dest.y + (tagCtx.y - C.src.y) * C.k};
    return {
      nodes,
      semantic: {
        beat, datum: changedNow ? 'after' : 'before', before: C.before, after: C.after,
        lensOpen: r(p, 3), lensVis: r(lensVis, 3), datumInLens: lensHolds,
        ctxOld, ctxNew, lensOld: r(lensHolds ? oldOp : 0, 3), lensNew: r(lensHolds ? newOp : 0, 3),
        closed: r(closed, 3), closedBefore: closedBefore, closedAfter: closedAfter, turn: r(kTurn, 3), marker: r(mk, 3), zoom: r(C.k, 3),
        tag: R2(tagCtx), lensTag: R2(lensTag), src: {x: r(C.src.x), y: r(C.src.y), w: r(C.src.w), h: r(C.src.h)}, dest: {x: r(C.dest.x), y: r(C.dest.y), w: r(C.dest.w), h: r(C.dest.h)},
        cardP: R2(B.pos(0, B.tWait)), problems: C.problems, textPx: r(C.F * L.pxu, 1),
        outcome: P.outcomes[changedNow ? C.after : C.before],
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
    slug: 'review-09-inspect',
    title: 'Effects during review — a lens enlarges the filter gate and its tag; one supplied datum is substituted and the gate turns with it before the board returns with a changed-datum marker',
    titleEs: 'Efectos durante revisión — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Efectos durante revisión',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The two-lane board at the moment the decision card reaches the filter gate (the appeal card already in its bay). A lens opens beside the board with a real enlarged copy of the gate, its tag and the lit chevrons past it; while the lens holds the tag, the context tag is blank. One supplied datum is substituted on the tag (by default "effect maintained" → "effect suspended according to the data supplied"); then the slats turn closed and the chevrons go grey — the local consequence. The lens closes; the context shows the new datum with a neutral Δ marker, and the legend keeps the previous datum traceable. Seeking back restores the old datum. No doctrine, dates or time limits; jurisdiction unspecified.',
    tags: ['review', 'effects during review', 'inspect', 'lens', 'filter gate', 'supplied datum', 'substitution', 'changed marker', 'parallel lanes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/efectos-durante-revision.js', 'src/animations/review/kits/confirmacion-ilustrativa.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
