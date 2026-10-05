/**
 * LAW-0189 — Atención en registro · story
 *
 * Storyboard (front view of a registry window; the person filing is seen from
 * the side, the clerk sits behind the ledge facing the viewer):
 *  0.00–0.15  rest: the person filing stands away from the window holding a
 *             bundle of sheets (each with a coloured index tab); the clerk
 *             waits with a pen; the checklist card (supplied items, each with
 *             a matching colour swatch and an empty slot) stands on the ledge
 *             beside a slip printer. Name chips identify both people.
 *  0.14–0.31  the person walks to the window (stepping legs, the bundle
 *             carried in the near hand) and raises the bundle over the ledge;
 *             a speech bubble with the SUPPLIED request opens from the mouth.
 *  0.30–0.42  hand-off at a shared point: the clerk's left hand takes the
 *             bundle's right edge while the filer still holds its left edge,
 *             then brings it up beside the window.
 *  0.41–0.61  the check: row by row, the matching sheet steps out of the
 *             stack (a stair fan) and the clerk's pen taps the row's slot —
 *             a filled ink dot = received; a row supplied as pending gets a
 *             dashed empty ring (no sheet steps out for it).
 *  0.60–0.80  the clerk lays the bundle on the ledge, presses the printer key,
 *             the entry-reference slip rises, is torn off and handed back to
 *             the filer's near hand at a shared point; the clerk's bubble
 *             (supplied text) opens. The filer holds the slip up.
 *  0.80–1.00  hold: the supplied final state, the "as supplied · no
 *             conclusion drawn" key, the relationship between the name chips
 *             and optional callouts. Nothing about validity, deadlines,
 *             admissibility or any consequence of a pending item is shown.
 * @module animations/roles/LAW-0189
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {connector} from '../../primitives/annotate.js';
import {talkBubble} from './kits/entrevista-a-cliente.js';
import {
  regFields, regProps, REG_DEFAULTS, REG_PROPS, KIT_STRINGS, RG, captionOf, itemColor, receivedIndices,
  runTrack, measureCard, measureSlip, stageGeometry, registryStage, shoulders, keyChip, flap, looksOf, legendPlate, CLERK_LEAN,
  intakeTargets, intakeReach, leanFor, intakeFrame,
  fitWords, wchip, noteCallout, overlaps, segHits, freeSpot, gridCands, leaderFrom, badWrap,
} from './kits/atencion-en-registro.js';

const ID = 'LAW-0189';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Timeline (normalized u). */
const W = {
  lead: [0.1, 0.15],
  walk: [0.145, 0.305], move: [0.14, 0.17], stop: [0.27, 0.305],
  raise: [0.25, 0.33],
  bubF: [0.265, 0.3], bubFclose: [0.445, 0.475], talkF: [0.275, 0.42],
  reachC: [0.3, 0.345], hold: [0.345, 0.37], take: [0.37, 0.41], fDrop: [0.37, 0.42],
  penTo: [0.395, 0.425], check: [0.41, 0.605], penBack: [0.605, 0.64],
  lay: [0.61, 0.645], toKey: [0.645, 0.665], press: [0.665, 0.68], rise: [0.672, 0.705],
  toSlip: [0.68, 0.705], tear: [0.705, 0.715], carry: [0.715, 0.75],
  fReach: [0.712, 0.75], both: [0.75, 0.765], fRead: [0.765, 0.8], cBack: [0.765, 0.805],
  bubC: [0.745, 0.775], talkC: [0.75, 0.83],
  tag: [0.8, 0.85], key: [0.81, 0.86], rel: [0.8, 0.86], note: [0.82, 0.88],
};
const TARGETS = ['checklist', 'slip', 'bundle'];
const MAX_LEADER = 170;

const STRINGS = {en: {...KIT_STRINGS.en}, es: {...KIT_STRINGS.es}};

const sceneSchema = {
  ...regFields,
  props: regProps,
  actorLabels: obj('Chip captions next to each person (empty = role caption)', {
    filer: str('Caption for the person filing', 50), clerk: str('Caption for the clerk', 50),
  }),
  objectLabels: obj('Labels printed on props', {
    checklist: str('Title printed on the checklist card', 50),
    slip: str('Header printed on the entry-reference slip', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('The state supplied for the final hold (no legal consequence is inferred)', ['reference-issued', 'documents-checked', 'documents-handed-over']),
};

const defaultParams = {
  ...REG_DEFAULTS,
  props: JSON.parse(JSON.stringify(REG_PROPS)),
  actorLabels: {filer: '', clerk: ''},
  objectLabels: {checklist: 'Intake checklist', slip: 'Entry reference'},
  actionProgress: 1,
  annotations: [{target: 'checklist', text: 'Each dot records a sheet as received'}],
  finalState: 'reference-issued',
};

/** Per-shape staging. */
const CFG = {
  landscape: {size: 22, walkMax: 430, walkMin: 260, noSign: true, variants: [null, {reserveR: 300}], fallback: [{headroom: 70}, {reserveR: 300, headroom: 70}]},
  // square: a clear walk from well away from the window
  square: {size: 21, walkMax: 110, walkMin: 110, depth: {x: 86, fk: 1.15, fy: 60, fk0: 1.35, fy0: 230}, clerkK: 1,
    // long captions: a shallower approach keeps the stage large enough
    variants: [null, {depth: {x: 95, fk: 1, fy: 0, fk0: 1.2, fy0: 150}, clerkK: 0.95, walkMin: 130, walkMax: 130},
      {depth: null, clerkK: 0.9, walkMin: 150, walkMax: 150}], cardWs: [270, 310, 350, 390, 430], slipWs: [156, 176, 196, 216]},
  // portrait: depth framing — the person filing walks in from the foreground (bigger, lower) and stands in
  // front of the counter at scale fk; the window and the clerk are behind
  portrait: {size: 22, walkMax: 36, walkMin: 36, depth: {x: 80, fk: 2.0, fy: 420, fk0: 2.25, fy0: 640, hx: 30, sx: 40, rk: 1.45}, clerkK: 1.35, cardWs: [230, 250, 270, 310, 350], slipWs: [176, 196, 216, 236]},
};

/** Event plan along the u axis: rows checked, where the action ends for the supplied final state. */
function plan(p) {
  const items = p.props.items;
  const n = items.length;
  const [c0, c1] = W.check;
  const d = (c1 - c0) / n;
  const rows = items.map((it, i) => ({i, received: it.status === 'received', a: c0 + i * d, b: c0 + (i + 1) * d}));
  const stop = p.finalState === 'documents-handed-over' ? W.fDrop[1] : p.finalState === 'documents-checked' ? W.lay[1] : W.fRead[1];
  return {rows, d, stop};
}

function tryLayout(ctx, S, cardW, slipW, V = null) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = {...CFG[shape], ...(V || {})};
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const problems = [];
  const items = p.props.items;
  const colors = items.map((_, i) => itemColor(ctx, i));
  const recv = receivedIndices(items);
  const hasPending = recv.length < items.length;

  // ---- scale: k from the height (landscape) or the width (portrait/square); iterate because text is in stage units
  // the filer's name chip rides under the feet: reserve its measured height below the floor
  const chipMaxW = Math.min(D.w * 0.46, 520);
  let chipProbe = null;
  // (measured with labels hidden too, so the stage keeps the same framing either way)
  for (const n of [1, 2]) {
    chipProbe = wchip(ctx, captionOf(p, 'filer', p.actorLabels.filer), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMaxW, size: S, minSize: S, maxLines: n});
    if (!chipProbe.fit.truncated) break;
  }
  const chipBand = (chipProbe ? chipProbe.box.h : S * 1.8) + 18;
  const geo = (M0, SM0, walk) => stageGeometry({cardW, cardH: M0.h, slipW, slipH: SM0.h, walk, depth: C.depth || null, clerkK: C.clerkK, noSign: Boolean(C.noSign), clerkLift: C.lift || 0});
  let k = 1, G = null, M = null, SM = null, walk = C.walkMax;
  for (let it = 0; it < 4; it++) {
    const su = S / k;
    M = measureCard(ctx, {items, title: p.objectLabels.checklist, su, w: cardW, legend: null});
    SM = measureSlip(ctx, {su, header: p.objectLabels.slip, ref: p.props.reference, w: slipW});
    G = geo(M, SM, walk);
    const Hst = G.floorBottom - G.top;
    const kH = (D.h - 16 - chipBand - (C.headroom || 0)) / Hst;
    if (shape === 'landscape') {
      k = kH;
      const room = (D.w - 16 - (C.reserveR || 0)) / k - (G.xR - (G.filerX - 80));
      walk = clamp(room, C.walkMin, C.walkMax);
    } else {
      walk = C.walkMin;
      const G2 = geo(M, SM, walk);
      k = Math.min(kH, (D.w - 16) / (G2.xR - G2.xL));
    }
  }
  G = geo(M, SM, walk);
  const su = S / k;
  if (M.truncated) problems.push('card-truncated');
  if (SM.truncated) problems.push('slip-truncated');
  if (k < 0.62) problems.push('too-small');
  const stW = (G.xR - G.xL) * k, stH = (G.floorBottom - G.top) * k;
  if (stW > D.w - 14 || stH + chipBand > D.h - 14) problems.push('too-big');
  if (problems.length) return {ok: false, problems};

  // ---- reach: every slot reachable by the pen hand (a small sideways lean at most — the clerk never rises)
  const lean = leanFor(G, M, G.card.x0);
  if (!lean) return {ok: false, problems: ['slot-reach']};

  // ---- place the stage in the design space (centred; landscape floor near the bottom)
  // headroom (a long request bubble above the window): the stage sits lower
  const free = D.h - 16 - stH - chipBand - (C.headroom || 0);
  const oy = 8 + (C.headroom || 0) + (shape === 'landscape' ? free * 0.5 : free * 0.45) - G.top * k;
  // (landscape with long callouts: a free column is kept right of the window for them)
  const ox = (D.w - stW - (C.reserveR || 0)) / 2 - G.xL * k;
  const looks = looksOf(ctx, p);
  const st = registryStage(ctx, {prefix: 'st', G, looks, items, card: {M, showText: showAll}, slipM: SM, showText: showAll, colors, place: {ox, oy, k}});
  const toD = st.toD;
  const Bx = q => ({x: ox + q.x * k, y: oy + q.y * k, w: q.w * k, h: q.h * k});
  const TR = intakeTargets(st, G, SM);
  if (!intakeReach(G, TR, lean)) return {ok: false, problems: ['reach']};

  // ---- design-space boxes of the art (obstacles for text)
  const B = RG.bundle;
  const fk = G.fk;
  const faceBox = (c, R) => ({x: c.x - R, y: c.y - R, w: R * 2, h: R * 2});
  const filerHead = st.filerHeadAt(G.filerX);
  const faces = [faceBox(toD(filerHead), 44 * fk * k), faceBox(toD(st.clerkHead), st.clerkHeadR * 1.15 * k)];
  const cardBox = Bx(st.cardBox);
  const printerBox = Bx(st.printerBox);
  const filerBody = Bx({x: G.filerX - 50 * fk, y: G.fy - 410 * fk, w: 110 * fk, h: 410 * fk});
  const clerkBody = Bx({x: G.clerk.x - 100 * G.clerk.k, y: st.clerkHead.y - 50, w: 200 * G.clerk.k, h: G.ledgeY - st.clerkHead.y + 50});
  const hB = TR.handoffGripL(fk);
  const bundleHand = Bx({x: hB.x, y: G.handoff.y - (B.h / 2) * fk - 20, w: B.w * fk, h: B.h * fk + 20});
  const lieC = TR.lieC;
  const lieBox = Bx({x: lieC.x - B.w / 2, y: G.ledgeY - 30, w: B.w, h: 30});
  const readTL = TR.readTL;
  const readBox = Bx({x: readTL.x, y: readTL.y, w: SM.w * G.readK, h: SM.h * G.readK});
  // the bundle carried in on the walk (from the start pose to the window), drawn at the filer's scale
  const carryBoxAt = (x, y, kk) => {
    const c = st.fromGrip({x: x + RG.carry.x * kk, y: y + RG.carry.y * kk}, 'L', 1, kk);
    return {x: c.x - (B.w / 2) * kk, y: c.y - (B.h / 2) * kk, w: B.w * kk, h: B.h * kk};
  };
  const cb0 = carryBoxAt(G.start.x, G.start.y, G.start.k), cb1 = carryBoxAt(G.filerX, G.fy, G.fk);
  const carryBox = Bx({x: Math.min(cb0.x, cb1.x), y: Math.min(cb0.y, cb1.y), w: Math.max(cb0.x + cb0.w, cb1.x + cb1.w) - Math.min(cb0.x, cb1.x), h: Math.max(cb0.y + cb0.h, cb1.y + cb1.h) - Math.min(cb0.y, cb1.y)});
  const slipHandTL = TR.slipHandTL(1);
  const ledgeBand = Bx({x: G.winX0 - 30, y: G.ledgeY - RG.ledgeTop, w: G.winX1 - G.winX0 + 60, h: RG.ledgeTop + RG.ledgeFront});

  // ---- speech bubbles (design units): above the heads, tails beside the mouths
  const pad = S * 0.7;
  const bubbleMax = Math.min(D.w - 20, shape === 'landscape' ? 520 : 460);
  const mkBubble = (name, text, tip, baseX, bottom, xRange) => {
    const w0 = Math.min(bubbleMax, xRange[1] - xRange[0]);
    let best = null;
    for (const w of [w0, w0 * 0.85, w0 * 0.7]) {
      const main = fitWords(text, {maxWidth: w - pad * 2, size: S, minSize: S, maxLines: 4, weight: 600});
      if (main.truncated || badWrap(main)) continue;
      const bw = Math.min(w, main.width + pad * 2 + 4);
      const x = clamp(baseX - bw * 0.35, xRange[0], xRange[1] - bw);
      const b = talkBubble(ctx, {name, x, w: bw, bottom, tip, tailBaseX: baseX, pad, main, extra: null, showText: showAll, stroke: '#3b4450'});
      if (!best || b.box.h < best.box.h) best = b;
    }
    return best;
  };
  // filer: tail tip in front of the mouth (filer-local, scaled); the bubble sits above the head and the bundle
  const tipF = toD(TR.F(64, -334));
  const bottomF = toD({x: 0, y: Math.min(G.fy - 440 * fk, G.handoff.y - (B.h / 2) * fk - 30)}).y;
  const bubF = mkBubble('bubF', p.props.speech.filer, tipF, tipF.x + 6, bottomF, [10, faces[1].x - 16]);
  // clerk: tail tip beside the left of the chin; the bubble stays left of the card, above the slip
  const tipC = toD({x: st.clerkHead.x - st.clerkHeadR - 18, y: st.clerkHead.y + 34});
  const bottomC = toD({x: 0, y: Math.min(G.winTop + 40, st.clerkHead.y - st.clerkHeadR - 24, slipHandTL.y - 16, readTL.y - 16)}).y;
  const bubC = mkBubble('bubC', p.props.speech.clerk, tipC, tipC.x - 8, bottomC, [Math.max(10, faces[0].x + faces[0].w + 12 - 200), cardBox.x - 14]);
  if (!bubF || !bubC) problems.push('bubble');
  if (problems.length) return {ok: false, problems};
  for (const b of [bubF, bubC]) if (b.box.y < 6) problems.push('bubble-top');
  // no bubble over a face, the card or the bundle/slip
  if (faces.some(f => overlaps(bubF.box, f, 2) || overlaps(bubC.box, f, 2))) problems.push('bubble-face');
  // props never cover a face: the slip being read, the bundle at the hand-off
  if (faces.some(f => overlaps(readBox, f, 0))) problems.push('slip-face');
  if (overlaps(bundleHand, faces[1], 0)) problems.push('bundle-face');
  if (overlaps(bubC.box, cardBox, 4) || overlaps(bubF.box, cardBox, 4)) problems.push('bubble-card');
  if (overlaps(bubF.box, bundleHand, 2)) problems.push('bubble-bundle');
  if (overlaps(bubC.box, readBox, 2) || overlaps(bubC.box, Bx({x: slipHandTL.x, y: slipHandTL.y, w: SM.w, h: SM.h}), 2)) problems.push('bubble-slip');
  if (problems.length) return {ok: false, problems};

  // ---- name chips: the filer's under the feet (moves with the walk), the clerk's on the counter panel
  const chips = {};
  const T0 = toD({x: 0, y: 0});
  if (showKey) {
    const maxW = chipMaxW;
    for (const n of [1, 2]) {
      chips.f = wchip(ctx, captionOf(p, 'filer', p.actorLabels.filer), {x: 0, y: 0, anchor: 'middle', maxWidth: maxW, size: S, minSize: S, maxLines: n, name: 'chip-f'});
      if (!chips.f.fit.truncated) break;
    }
    const panelW = (G.winX1 - G.winX0 - 40) * k;
    // depth framing: the foreground filer (and the slip they read) cover the left of the counter panel, so
    // the clerk's chip and the glyph legend stand on the floor just in front of the counter, under the clerk
    const chipY = G.depth ? toD({x: 0, y: 16}).y : toD({x: 0, y: G.ledgeY + 40}).y;
    for (const n of [1, 2, 3]) {
      chips.c = wchip(ctx, captionOf(p, 'clerk', p.actorLabels.clerk), {x: toD({x: G.clerk.x, y: 0}).x, y: chipY, anchor: 'middle', maxWidth: Math.min(panelW, maxW), size: S, minSize: S, maxLines: n, name: 'chip-c'});
      if (G.depth && (overlaps(chips.c.box, filerBody, 6) || overlaps(chips.c.box, carryBox, 6))) {
        const x0 = Math.max(filerBody.x + filerBody.w, overlaps(chips.c.box, carryBox, 6) ? carryBox.x + carryBox.w : 0) + 12;
        chips.c = wchip(ctx, captionOf(p, 'clerk', p.actorLabels.clerk), {x: x0 + chips.c.box.w / 2, y: chipY, anchor: 'middle', maxWidth: Math.min(panelW, maxW), size: S, minSize: S, maxLines: n, name: 'chip-c'});
      }
      if (!chips.c.fit.truncated) break;
    }
    if (chips.f.fit.truncated || chips.c.fit.truncated || badWrap(chips.f.fit) || badWrap(chips.c.fit)) problems.push('chips');
    if (!G.depth && chips.c.box.y + chips.c.box.h > T0.y - 20 * k) problems.push('chip-c-panel');
    if (chips.c.box.x < toD({x: G.winX0 - 20, y: 0}).x || chips.c.box.x + chips.c.box.w > toD({x: G.winX1 + 20, y: 0}).x) problems.push('chip-c-panel');
    if (G.depth && overlaps(chips.c.box, filerBody, 4)) problems.push('chip-c-filer');
    if (G.depth && overlaps(chips.c.box, carryBox, 4)) problems.push('chip-c-bundle');
    if (overlaps(chips.c.box, readBox, 4)) problems.push('chip-c-slip');
  }
  // generic captions (key, legend, state tag, relation label, callouts) never exceed the supplied text size
  const cMin = Math.min(M.minText, SM.size) * k;
  const capS = Math.min(S, cMin);
  // glyph legend plate on the counter panel (depth: on the floor): right-aligned beside the clerk's chip, else under it
  let legend = null;
  if (showKey) {
    const px0 = G.depth ? Math.max(toD({x: G.winX0, y: 0}).x, filerBody.x + filerBody.w + 12, carryBox.y + carryBox.h > toD({x: 0, y: 0}).y ? carryBox.x + carryBox.w + 12 : 0) : toD({x: G.winX0 + 16, y: 0}).x;
    const px1 = toD({x: G.winX1 - 16, y: 0}).x;
    const ly0 = chips.c ? chips.c.box.y : (G.depth ? toD({x: 0, y: 16}).y : toD({x: 0, y: G.ledgeY + 40}).y);
    legend = legendPlate(ctx, {name: 'legend', x: px1, y: ly0, S: capS, received: ctx.t.received, pending: ctx.t.pendingAs, maxW: px1 - px0, anchor: 'end'});
    if (chips.c && overlaps(legend.box, chips.c.box, 10)) {
      legend = legendPlate(ctx, {name: 'legend', x: px1, y: chips.c.box.y + chips.c.box.h + 10, S: capS, received: ctx.t.received, pending: ctx.t.pendingAs, maxW: px1 - px0, anchor: 'end'});
    }
    const floorY = G.depth ? toD({x: 0, y: G.floorBottom}).y : T0.y;
    if (legend.truncated || legend.box.y + legend.box.h > floorY - 8 * k || legend.box.x < px0 - 1) problems.push('legend');
    if (G.depth && overlaps(legend.box, filerBody, 4)) problems.push('legend-filer');
    if (G.depth && overlaps(legend.box, carryBox, 4)) problems.push('legend-bundle');
    if (overlaps(legend.box, readBox, 4)) problems.push('legend-slip');
  }
  // the filer chip rides under the feet; its box at the counter (for the hold)
  const feetY = toD({x: 0, y: G.fy}).y;
  const chipFy = feetY + 10;
  const fAt = x => toD({x, y: 0}).x;
  const chipFBox = chips.f ? {x: clamp(fAt(G.filerX), chips.f.box.w / 2 + 8, D.w - chips.f.box.w / 2 - 8) - chips.f.box.w / 2, y: chipFy, w: chips.f.box.w, h: chips.f.box.h} : null;
  if (chipFBox && (chipFBox.x < 6 || chipFBox.y + chipFBox.h > D.h - 4)) problems.push('chip-f');
  if (problems.length) return {ok: false, problems};

  // ---- obstacles for editorial text at the hold
  const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  const cands = gridCands(bounds, 12);
  const floorBox = Bx({x: G.filerX - 60 * fk, y: G.fy - 60 * fk, w: 140 * fk, h: 60 * fk});
  const obstacles = [bubC.box, cardBox, printerBox, filerBody, clerkBody, lieBox, readBox, ledgeBand, ...faces, floorBox];
  const soft0 = new Set();
  if (chips.c) obstacles.push(chips.c.box);
  if (legend) obstacles.push(legend.box);
  if (chipFBox) obstacles.push(chipFBox);
  const textBoxes = [bubC.box, cardBox, readBox, ...(chips.c ? [chips.c.box] : []), ...(chipFBox ? [chipFBox] : [])];

  // the corridor between the two name chips is kept for the relationship line (placed after the callouts)
  if (showKey && chips.c && chipFBox) {
    const A = {x: chipFBox.x + chipFBox.w, y: chipFBox.y + chipFBox.h / 2}, Bq = {x: chips.c.box.x, y: chips.c.box.y + chips.c.box.h / 2};
    for (let q = 1; q < 12; q++) {
      const pt = {x: A.x + (Bq.x - A.x) * q / 12, y: A.y + (Bq.y - A.y) * q / 12};
      const bx = {x: pt.x - 14, y: pt.y - 14, w: 28, h: 28};
      obstacles.push(bx);
      soft0.add(bx);
    }
  }
  // ---- editorial callouts: short leaders that cross no text, chip or face
  const notes = [];
  const leaders = [];
  // leaders may pass over art (bodies, printer, ledge) at a cost, never over text, chips or faces;
  // the object a leader points at is exempt
  const soft = new Set([printerBox, filerBody, clerkBody, lieBox, ledgeBand, floorBox, ...soft0]);
  const leaderCost = (from, end, tg) => {
    let c = 0;
    for (const o of obstacles) {
      if (tg.x >= o.x - 4 && tg.x <= o.x + o.w + 4 && tg.y >= o.y - 4 && tg.y <= o.y + o.h + 4 && !faces.includes(o)) continue;
      if (!segHits(from, end, o)) continue;
      c += soft.has(o) ? 300 : 1e5;
    }
    return c;
  };
  if (showAll) {
    const targets = {
      checklist: [{x: cardBox.x + 3, y: cardBox.y + cardBox.h * 0.4}, {x: cardBox.x + cardBox.w * 0.5, y: cardBox.y + 3}, {x: cardBox.x + cardBox.w - 3, y: cardBox.y + cardBox.h * 0.5}, {x: cardBox.x + cardBox.w * 0.3, y: cardBox.y + 3}],
      slip: [{x: readBox.x + readBox.w * 0.5, y: readBox.y + 3}, {x: readBox.x + 3, y: readBox.y + readBox.h * 0.6}, {x: readBox.x + readBox.w - 3, y: readBox.y + readBox.h * 0.3}, {x: readBox.x + readBox.w * 0.3, y: readBox.y + 3}, {x: readBox.x + 4, y: readBox.y + 4}, {x: readBox.x + readBox.w * 0.5, y: readBox.y + readBox.h - 3}],
      bundle: [{x: lieBox.x + lieBox.w * 0.5, y: lieBox.y + lieBox.h * 0.6}],
    };
    for (const [i, a] of p.annotations.entries()) {
      let best = null;
      for (const maxW of (shape === 'portrait' ? [D.w * 0.6, D.w * 0.45, D.w * 0.35] : [Math.min(440, D.w * 0.32), 330, 250])) {
        const probe = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, anchor: 'start', target: {x: -50, y: -50}, maxWidth: maxW, size: capS, minSize: capS, maxLines: 4});
        if (probe.fit.truncated || badWrap(probe.fit)) continue;
        for (const tg of targets[a.target]) {
          const spot = freeSpot(cands, probe.box.w, probe.box.h, obstacles, bounds, 12, b => {
            const from = leaderFrom(b, tg);
            const len = Math.hypot(tg.x - from.x, tg.y - from.y);
            const end = len > 14 ? {x: tg.x - ((tg.x - from.x) * 14) / len, y: tg.y - ((tg.y - from.y) * 14) / len} : from;
            return len + leaderCost(from, end, tg) + (len < 30 ? 200 : 0);
          });
          if (!spot) continue;
          const b = {x: spot.x, y: spot.y, w: probe.box.w, h: probe.box.h};
          const from = leaderFrom(b, tg);
          const len = Math.hypot(tg.x - from.x, tg.y - from.y);
          const end = len > 14 ? {x: tg.x - ((tg.x - from.x) * 14) / len, y: tg.y - ((tg.y - from.y) * 14) / len} : from;
          const cost = leaderCost(from, end, tg);
          const cross = cost >= 1e5;
          const sc = len + cost;
          if (!best || sc < best.sc) best = {sc, spot, tg, maxW, len, cross};
        }
      }
      if (!best || best.cross) { problems.push('note'); continue; }
      if (best.len > MAX_LEADER) problems.push(`note-far${i}:${Math.round(best.len)}`);
      leaders.push(r(best.len));
      const n = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: best.spot.x, y: best.spot.y}, anchor: 'start', target: best.tg, maxWidth: best.maxW, size: capS, minSize: capS, maxLines: 4});
      notes.push(n);
      obstacles.push(n.box);
    }
  }
  // ---- relationship between the name chips (supplied label beside its own connector)
  const rels = [];
  if (showKey && chips.c && chipFBox) {
    const cb = chips.c.box;
    p.relationships.forEach((rel, i) => {
      if (i > 0) return; // one relationship line between the two chips (the second is listed in the chip label)
      const fromF = rel.from === 'filer';
      const A = {x: chipFBox.x + chipFBox.w, y: chipFBox.y + chipFBox.h / 2};
      const Bp = {x: cb.x, y: cb.y + cb.h / 2};
      const a = fromF ? A : Bp, b = fromF ? Bp : A;
      // the line bends away from anything it would cross (legend, callouts, faces)
      let c = null;
      for (const bend of [0.12, -0.12, 0.28, -0.28, 0.45, -0.45, 0.65, -0.65]) {
        const cc = connector(ctx, {name: `rel${i}`, from: a, to: b, kind: rel.kind, bend, color: th.fgSoft});
        const pts = Array.from({length: 41}, (_, q) => cc.at(q / 40));
        const hits = bx => pts.slice(2, -2).some(q => q.x > bx.x && q.x < bx.x + bx.w && q.y > bx.y && q.y < bx.y + bx.h);
        if (!(legend && hits(legend.box)) && !faces.some(hits) && !notes.some(n => hits(n.box))) { c = cc; break; }
      }
      if (!c) { problems.push('rel-cross'); return; }
      rels.push({c, rel, i});
    });
  }
  const relLabels = [];
  for (const {c, rel, i} of rels) {
    const text = rel.label || ctx.t[rel.kind] || rel.kind;
    if (!showAll) continue;
    let best = null;
    for (const maxW of [Math.min(360, D.w * 0.3), 260, 200]) {
      const probe = wchip(ctx, text, {x: 0, y: 0, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, weight: 600});
      if (probe.fit.truncated || badWrap(probe.fit)) continue;
      const w = probe.box.w, hh = probe.box.h;
      // the connector's own points: the label must be nearer to its own line than to anything else
      const pts = Array.from({length: 21}, (_, q) => c.at(q / 20));
      const spot = freeSpot(cands, w, hh, obstacles, bounds, 8, b => {
        const d = Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
        const onLine = pts.some(q => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4);
        return d + (onLine ? 1e4 : 0) + Math.hypot(b.x + b.w / 2 - c.mid.x, b.y + b.h / 2 - c.mid.y) * 0.2;
      });
      if (!spot) continue;
      best = wchip(ctx, text, {x: spot.x, y: spot.y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, weight: 600, stroke: th.fgSoft, name: `rel${i}-lab`});
      break;
    }
    if (!best) { problems.push('rel-label'); continue; }
    relLabels.push(best);
    obstacles.push(best.box);
  }
  // the connector's own path is kept free of every later label (state tag, key, callouts)
  const connBoxes = rels.flatMap(({c}) => Array.from({length: 17}, (_, q) => { const pt = c.at(q / 16); return {x: pt.x - 6, y: pt.y - 6, w: 12, h: 12}; }));
  obstacles.push(...connBoxes);
  for (const b of connBoxes) soft0.add(b);

  // ---- final-state tag (near the slip) and the key (near the card)
  const stateText = {'reference-issued': ctx.t.stateIssued, 'documents-checked': ctx.t.stateChecked, 'documents-handed-over': ctx.t.stateHanded}[p.finalState];
  let tag = null, key = null;
  if (showKey) {
    const maxW = Math.min(D.w - 20, shape === 'portrait' ? 700 : 460);
    const anchorPt = p.finalState === 'reference-issued' ? {x: readBox.x + readBox.w / 2, y: readBox.y} : {x: cardBox.x + cardBox.w / 2, y: cardBox.y};
    const probe = wchip(ctx, `● ${stateText}`, {x: 0, y: 0, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, weight: 700});
    const spot = freeSpot(cands, probe.box.w, probe.box.h, obstacles, bounds, 10, b => Math.hypot(b.x + b.w / 2 - anchorPt.x, b.y + b.h / 2 - anchorPt.y));
    if (spot && !probe.fit.truncated) {
      tag = wchip(ctx, `● ${stateText}`, {x: spot.x, y: spot.y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, weight: 700, name: 'state-tag', color: th.ink, stroke: th.ink});
      obstacles.push(tag.box);
    } else problems.push('tag');
    const kProbe = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: maxW, size: capS, minSize: capS, maxLines: 2});
    const kAnchor = {x: cardBox.x + cardBox.w / 2, y: cardBox.y + cardBox.h};
    const ks = freeSpot(cands, kProbe.box.w, kProbe.box.h, obstacles, bounds, 10, b => Math.hypot(b.x + b.w / 2 - kAnchor.x, (b.y + b.h / 2 - kAnchor.y) * 1.3));
    if (ks) {
      key = keyChip(ctx, ctx.t.key, {x: ks.x, y: ks.y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 2, name: 'key'});
      obstacles.push(key.box);
    } else problems.push('key');
  }

  if (problems.length) return {ok: false, problems};

  const contentMin = Math.min(M.minText * k, SM.size * k, S, ...(chips.f ? [chips.f.fit.size, chips.c.fit.size] : []));
  return {
    ok: true, problems, S, k, su, G, M, SM, st, ox, oy, colors, recv, hasPending, lean,
    bubF, bubC, tipF, tipC, chips, chipFy, legend, rels, relLabels, tag, key, notes, leaders, capS, contentMin,
    TR, faces, boxes: {cardBox, bubF: bubF.box, bubC: bubC.box, readBox},
  };
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C0 = CFG[ctx.view.shape];
    const tries = [];
    // figure size of a candidate: the smaller of the two heads
    const score = L => L.k * Math.min(88 * L.G.clerk.k, 72 * L.G.fk);
    // the variants are tried in tiers: fallback variants (e.g. headroom for a long bubble) only when no
    // text size fits with the primary ones
    const search = variants => {
      const bestAt = S => {
        let best = null;
        for (const V of variants) {
          for (const cardW of C0.cardWs || [270, 310, 350, 390]) {
            for (const slipW of C0.slipWs || [156, 176, 196]) {
              let L = tryLayout(ctx, S, cardW, slipW, V);
              // a tall checklist: seat the clerk higher (static — the clerk never rises during the action)
              for (const lift of [30, 60, 90]) {
                if (L.ok || L.problems.join() !== 'slot-reach') break;
                L = tryLayout(ctx, S, cardW, slipW, {...(V || {}), lift});
              }
              if (L.ok && (!best || score(L) > score(best) + 1e-6)) best = L;
              if (!L.ok) tries.push(`${S}/${cardW}/${slipW}/${variants.indexOf(V)}:${L.problems.join('+')}`);
            }
          }
        }
        return best;
      };
      // text sizes from the largest down; a bisection finds the largest size that fits (then the sizes just
      // above it are re-checked so a non-monotone fit never loses a larger size)
      const Ss = [];
      for (let S = C0.size; S >= 16 - 1e-6; S -= 0.5) Ss.push(S);
      const memo = new Map();
      const at = i => { if (!memo.has(i)) memo.set(i, bestAt(Ss[i])); return memo.get(i); };
      if (at(0)) return at(0);
      let lo = 0, hi = Ss.length - 1;
      if (!at(hi)) return null;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (at(mid)) hi = mid; else lo = mid; }
      for (let i = Math.max(1, hi - 2); i < hi; i++) if (at(i)) return at(i);
      return at(hi);
    };
    for (const tier of [C0.variants || [null], C0.fallback || []]) {
      if (!tier.length) continue;
      const L = search(tier);
      if (L) return {...L, tries};
    }
    const kinds = {};
    for (const t of tries) { const kk = t.split(':')[1]; kinds[kk] = (kinds[kk] || 0) + 1; }
    throw new Error(`${ID}: no layout fits (${Object.entries(kinds).map(([kk, n]) => `${kk}×${n}`).join(' | ')})`);
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({transform: T(L.ox, L.oy, 0, L.k)}, L.st.node),
      L.chips.c && L.chips.c.node,
      L.legend && L.legend.node,
      L.chips.f && g({name: 'chip-fpos'}, g({transform: T(-L.chips.f.box.x - L.chips.f.box.w / 2, -L.chips.f.box.y)}, L.chips.f.node)),
      L.rels.map(x => g({name: `relg${x.i}`, opacity: 0}, x.c.node)),
      L.relLabels.map((x, i) => g({name: `rell${i}`, opacity: 0}, x.node)),
      L.bubF.node,
      L.bubC.node,
      L.tag && L.tag.node,
      L.key && L.key.node,
      L.notes.map(n => n.node),
      h('g', {'data-theme': th.name}),
    );
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const st = L.st;
    const G = L.G;
    const pl = plan(p);
    const cap = p.actionProgress >= 1 ? 1 : lerp(W.lead[0], pl.stop, p.actionProgress);
    const a = Math.min(u, cap);
    const done = p.actionProgress >= 1;
    const x = w => seg(a, w[0], w[1]);
    const fin = p.finalState;
    const stop = fin === 'documents-handed-over' ? 'hand' : fin === 'documents-checked' ? 'check' : null;
    // ---- faces: mouths (the filer speaks the request, the clerk hands back the slip)
    const talkF = seg(a, W.talkF[0], W.talkF[0] + 0.01) * (1 - seg(a, W.talkF[1] - 0.01, W.talkF[1]));
    const talkC = !stop ? seg(a, W.talkC[0], W.talkC[0] + 0.01) * (1 - seg(a, W.talkC[1] - 0.01, W.talkC[1])) : 0;
    const leanF = 4 * ease.inOutSine(x(W.lead)) * (1 - ease.inOutSine(seg(a, W.stop[0], W.stop[1] + 0.03)));
    const fr = intakeFrame(st, L.TR, W, a, p.props.items, L.lean, {walk: true, stop, filerMouth: talkF * flap(timeMs, reduced, 0.4), clerkMouth: talkC * flap(timeMs, reduced, 0), filerLean: leanF});
    const posed = st.pose(fr.input);
    const nodes = posed.nodes;
    const fp = fr.sem.filer;
    // the filer's name chip rides under the feet
    if (L.chips.f) {
      const fpD = L.st.toD({x: fp.x, y: fp.y});
      const hw = L.chips.f.box.w / 2 + 8;
      nodes['chip-fpos'] = {transform: T(clamp(fpD.x, hw, ctx.design.w - hw), fpD.y + 10)};
    }
    // speech bubbles: they appear together with their text
    const oF = seg(a, ...W.bubF) * (1 - seg(a, ...W.bubFclose));
    Object.assign(nodes, L.bubF.frame(oF, oF, 0, 0, reduced));
    const oC = stop ? 0 : seg(a, ...W.bubC);
    Object.assign(nodes, L.bubC.frame(oC, oC, 0, 0, reduced));
    const fade = w => (done ? r(seg(u, ...w), 3) : 0);
    if (L.tag) nodes['state-tag'] = {opacity: fade(W.tag)};
    if (L.key) nodes.key = {opacity: fade(W.key)};
    L.rels.forEach(x2 => {
      const pr = done ? ease.inOutSine(seg(u, ...W.rel)) : 0;
      Object.assign(nodes, x2.c.frame(pr, 1));
      nodes[`relg${x2.i}`] = {opacity: pr > 0 ? 1 : 0};
    });
    L.relLabels.forEach((_, i) => { nodes[`rell${i}`] = {opacity: done ? r(seg(u, W.rel[0] + 0.03, W.rel[1]), 3) : 0}; });
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));

    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    const D = q => ({x: r(L.ox + q.x * L.k), y: r(L.oy + q.y * L.k)});
    const f = fr.sem;
    return {
      nodes,
      semantic: {
        ...sem,
        // grips of the holder (for attachment checks): the holder's hand is on its grip
        gripF: f.bundleHolder === 'filer' ? sem.bundleL : f.slipHolder === 'filer' ? sem.slipL : null,
        gripC: f.bundleHolder === 'clerk' ? sem.bundleR : f.slipHolder === 'clerk' ? sem.slipR : null,
        // during a hand-off both hands are on the same object
        handoffB: f.inHold ? {f: sem.bundleL, c: sem.bundleR} : null,
        clerkOnBundle: f.inHold ? sem.bundleR : null,
        filerOnSlip: f.inSlipBoth ? sem.slipL : null,
        tapTarget: f.tapping ? D(f.tapping) : null,
        beat,
        bundleHolder: f.bundleHolder,
        slipHolder: f.slipHolder,
        slipRise: r(f.slipRise, 3),
        fanned: f.fan.map(v => r(v, 3)),
        dots: f.dots.map(v => r(v, 3)),
        rings: f.rings.map(v => r(v, 3)),
        received: f.dots.filter(v => v >= 1).length,
        pendingMarked: f.rings.filter(v => v >= 1).length,
        bubbleF: r(oF, 3), bubbleC: r(oC, 3),
        speakingF: talkF > 0.5, speakingC: talkC > 0.5,
        walking: f.walking,
        filerX: r(fp.x, 1), filerScale: r(fp.k, 3), bundleScale: r(f.bundleScale, 3), slipScale: r(f.slipScale, 3),
        clerkRise: r(-(fr.input.clerk.shift.y || 0), 2),
        walkDistance: r(Math.hypot(G.filerX - G.start.x, G.fy - G.start.y) * L.k, 1),
        depth: G.depth,
        finalState: fin,
        actionCapped: p.actionProgress < 1 && u > cap,
        labelsFit: L.ok, textSize: L.S, scale: r(L.k, 3),
        headPx: {filer: r(2 * 36 * G.fk * L.k, 1), clerk: r(2 * 44 * G.clerk.k * L.k, 1)},
        contentMin: r(L.contentMin, 1),
        keyShown: Boolean(L.key),
        leaderMax: L.leaders.length ? Math.max(...L.leaders) : 0,
        mainActionEnd: W.fRead[1],
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
    slug: 'roles-08-story',
    title: 'Registry window — handing in documents and receiving an entry reference',
    titleEs: 'Atención en registro — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Atención en registro',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Front view of a registry window: a person walks up with a bundle of tabbed sheets and hands it over the ledge to the clerk (both hands on the bundle at a shared point). The clerk fans the sheets one by one against a supplied checklist, tapping a neutral dot on each received row (a dashed ring for a row supplied as pending), lays the bundle down, prints an entry-reference slip and hands it back. Speech bubbles carry supplied text; the final state is supplied; no consequence is inferred.',
    tags: ['registry', 'filing', 'counter', 'window', 'checklist', 'entry reference', 'slip', 'printer', 'hand-off', 'walking', 'speech bubble', 'two people'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/atencion-en-registro.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/animations/roles/kits/entrevista-a-cliente.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
