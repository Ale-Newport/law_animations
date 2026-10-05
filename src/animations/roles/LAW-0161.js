/**
 * LAW-0161 — Entrevista a cliente · story
 *
 * Storyboard (medium shot of a meeting table, side view; the table's front
 * panel crops the legs):
 *  0.00–0.15  rest: the client (left) and the interviewer (right) sit at the
 *             table. The interviewer holds an upright question list in the
 *             far hand and a pen in the near hand; the questions are
 *             readable. Name chips on the table panel.
 *  0.08–0.15  anticipation: the interviewer straightens the list to present it.
 *  0.15–0.42  the exchange starts (order from the sequence relationship):
 *             the client leans in and tells the account — a speech bubble
 *             with the SUPPLIED account opens from the client's mouth while
 *             one hand gestures; the interviewer asks the first question (a
 *             "?" bubble opens, the row lights up) and marks it with the pen
 *             (the nib follows the mark exactly; a mark = "asked", a process
 *             step).
 *  0.42–0.73  the interviewer asks the next question(s) the same way; the
 *             client answers: the account bubble grows and the supplied
 *             clarified detail is added under it with the neutral changed-
 *             datum marker (Δ). The earlier account stays as given.
 *  0.73–1.00  hold: the supplied final state (account given / questions
 *             asked / detail clarified), the "as supplied · no conclusion
 *             drawn" key and optional callouts. Nothing is assessed: no
 *             credibility, merit, advice or outcome is shown or implied.
 * The list never leaves the interviewer's solved far hand; the pen is placed
 * from the solved near hand.
 * @module animations/roles/LAW-0161
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {mix} from '../../core/geometry.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {noteCallout} from './kits/mediation-labels.js';
import {runTrack} from './kits/mediation-table.js';
import {
  interviewFields, interviewProps, INTERVIEW_DEFAULTS, INTERVIEW_PROPS, KIT_STRINGS,
  firstSpeaker, captionOf, measureBoard, interviewStage, talkBubble, askBubble, keyChip,
  fitWords, wchip, overlaps, flap, extraBodyH,
} from './kits/entrevista-a-cliente.js';

const ID = 'LAW-0161';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const ACT0 = 0.15, ACT1 = 0.68;
const DUR = {account: 1.7, ask: 1.05, clarify: 1.5};
const W = {present: [0.08, 0.15], tag: [0.76, 0.81], key: [0.78, 0.83], note: [0.8, 0.88]};
const TARGETS = ['account', 'list', 'clarified'];
/** Board poses: resting low and leaning slightly towards the interviewer → presented upright. */
const BOARD_REST = {rot: 3, dy: 7};
const BOARD_UP = {rot: 0, dy: 0};

const STRINGS = {
  en: {...KIT_STRINGS.en},
  es: {...KIT_STRINGS.es},
};

const sceneSchema = {
  ...interviewFields,
  props: interviewProps,
  actorLabels: obj('Chip captions next to each person (empty = role caption)', {
    client: str('Caption for the client', 50), interviewer: str('Caption for the interviewer', 50),
  }),
  objectLabels: obj('Labels printed on props', {clarified: str('Label of the clarified-detail line added to the account', 40)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('The state supplied for the final hold (nothing is assessed or concluded)', ['account-given', 'questions-asked', 'detail-clarified']),
};

const defaultParams = {
  ...INTERVIEW_DEFAULTS,
  props: {...INTERVIEW_PROPS},
  actorLabels: {client: '', interviewer: ''},
  objectLabels: {clarified: 'Clarified detail'},
  actionProgress: 1,
  annotations: [{target: 'list', text: 'Each mark records a question as asked'}],
  finalState: 'detail-clarified',
};

/** Per-shape staging (design units; k = person scale). */
const CFG = {
  landscape: {gap: 100, k: 1.8, bw: 380, clearA: 150, crop: 80, size: 28, min: 17, bubbleMax: 1400, gesture: {x: 128, y: -98}},
  square: {gap: 104, k: 1.4, bw: 320, clearA: 110, crop: 96, size: 26, min: 17, bubbleMax: 690, gesture: {x: 94, y: -92}},
  portrait: {gap: 122, k: 1.62, bw: 350, clearA: 108, crop: 156, floor: true, panelLocal: 104, size: 36, min: 17, bubbleMax: 700, gesture: {x: 92, y: -90}},
};

/** Event schedule on the u axis (depends on the supplied order and final state). */
function schedule(p) {
  const qs = p.props.questions;
  const c = clamp(p.props.clarifies, 0, qs.length - 1);
  const first = firstSpeaker(p.relationships);
  const asks = [];
  for (let i = 0; i <= c; i++) asks.push({type: 'ask', i});
  let ev = first === 'client' ? [{type: 'account'}, ...asks] : [asks[0], {type: 'account'}, ...asks.slice(1)];
  ev.push({type: 'clarify', i: c});
  if (p.finalState === 'account-given') ev = ev.slice(0, ev.findIndex(e => e.type === 'account') + 1);
  else if (p.finalState === 'questions-asked') ev = ev.filter(e => e.type !== 'clarify');
  const total = ev.reduce((a, e) => a + DUR[e.type], 0);
  const unit = Math.min((ACT1 - ACT0) / total, 0.12);
  let t = ACT0;
  ev = ev.map(e => {
    const a = t;
    t += DUR[e.type] * unit;
    return {...e, a, b: t};
  });
  return {events: ev, end: t, first, c};
}

/** Does segment p→q cross box b? */
function segHits(p, q, b) {
  const n = 16;
  for (let i = 1; i < n; i++) {
    const x = p.x + ((q.x - p.x) * i) / n, y = p.y + ((q.y - p.y) * i) / n;
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
  }
  return false;
}

/** First candidate (x,y offsets for a box of size w×h) clear of obstacles and inside bounds. */
function freeSpot(cands, w, hh, obstacles, bounds, pad = 10, score) {
  let best = null, bestS = Infinity;
  for (const c of cands) {
    const b = {x: c.x, y: c.y, w, h: hh};
    if (b.x < bounds.x || b.y < bounds.y || b.x + w > bounds.x + bounds.w || b.y + hh > bounds.y + bounds.h) continue;
    if (obstacles.some(o => overlaps(b, o, pad))) continue;
    const s = score ? score(b) : 0;
    if (s < bestS) { best = c; bestS = s; }
    if (!score) break;
  }
  return best;
}

const LEAN_B = 10;
/** Longest callout leader accepted (design units ≈ px). */
const MAX_LEADER = 170;
/** Interviewer's lean while working on the list during an ask event (event-local x). */
const leanAsk = x => LEAN_B * ease.inOutSine(seg(x, 0.06, 0.3)) * (1 - ease.inOutSine(seg(x, 0.86, 1)));

/** Pen plan: nib track on the u axis (hover beside a box → mark → hover), and the IK targets to verify. */
function penPlan(st, events) {
  const bpUp = st.boardAt(BOARD_UP);
  const tickW = i => q => bpUp.toWorld(st.bd.tickPaths[i].at(q));
  // hover just right of (towards the interviewer) and level with the box
  const hover = i => {
    const q = tickW(i)(0);
    return {x: q.x + 12 * st.k, y: q.y + 3 * st.k};
  };
  const track = [];
  const ticks = [];
  const targets = [];
  for (const e of events) {
    if (e.type !== 'ask') continue;
    const at = f => e.a + (e.b - e.a) * f;
    // approach in front of the board first (level with the lower rows), then up to the row:
    // a straight path from the resting hand would pass the interviewer's cheek
    const hv = hover(e.i);
    const low = {x: hv.x, y: Math.max(hv.y, st.rest.nibB.y - 40 * st.k)};
    track.push({a: at(0.02), b: at(0.24), to: low, ease: ease.inOutSine});
    track.push({a: at(0.24), b: at(0.45), to: hv, ease: ease.inOutSine});
    targets.push(low);
    track.push({a: at(0.45), b: at(0.55), to: tickW(e.i)(0)});
    const draw = [at(0.55), at(0.8)];
    track.push({a: draw[0], b: draw[1], at: u => tickW(e.i)(ease.inOutSine(seg(u, draw[0], draw[1])))});
    track.push({a: at(0.8), b: at(0.95), to: hover(e.i)});
    ticks.push({i: e.i, draw});
    targets.push(hover(e.i));
    for (let q = 0; q <= 1; q += 0.25) targets.push(tickW(e.i)(q));
  }
  const lastAsk = events.filter(e => e.type === 'ask').pop();
  if (lastAsk) {
    const hv = hover(lastAsk.i);
    const low = {x: hv.x, y: Math.max(hv.y, st.rest.nibB.y - 40 * st.k)};
    track.push({a: lastAsk.b, b: lastAsk.b + 0.03, to: low, ease: ease.inOutSine});
    track.push({a: lastAsk.b + 0.03, b: lastAsk.b + 0.06, to: st.rest.nibB, ease: ease.inOutSine});
  }
  // every nib target (leaning in) and the grip at both board poses must be within reach
  let reach = targets.every(nib => {
    const sm = st.pose({a: {}, b: {nib, lean: LEAN_B}, board: BOARD_UP}).semantic;
    return sm.reach.b && sm.forearmFaceB >= 58 && sm.handFaceB >= 58;
  });
  for (const lean of [0, LEAN_B]) for (const bp of [BOARD_REST, BOARD_UP]) reach = reach && st.pose({a: {}, b: {lean}, board: bp}).semantic.reach.b;
  return {track, ticks, reach};
}

function tryLayout(ctx, S, gapAdd = 0) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = {...CFG[ctx.view.shape], gap: CFG[ctx.view.shape].gap + gapAdd};
  const pr = p.props;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const sched = schedule(p);
  const minS = Math.max(C.min, S * 0.86);
  const problems = [];
  const portrait = shape === 'portrait';

  // --- board (question list), measured from the supplied text
  const M = measureBoard(ctx, {w: C.bw, title: pr.listTitle, questions: pr.questions, size: S, minSize: minS, maxLines: 4});
  if (M.truncated) problems.push('board-truncated');

  // --- horizontal staging
  const k = C.k;
  const X = C.gap + C.bw / k + C.clearA;
  const stageW = (X + 132) * k;
  if (stageW > D.w - 8) problems.push('too-wide');
  const Ax = (D.w - stageW) / 2 + 66 * k;
  const clarifies = sched.events.some(e => e.type === 'clarify');
  const probeStage = interviewStage(ctx, {prefix: 'st', k, A: {x: Ax, y: 0}, X, crop: C.crop, floor: C.floor, panelLocal: C.panelLocal, actors: p.actors, board: M, boardText: false, boardGap: C.gap});
  const R = 21 * k;
  // the "?" bubble sits above the interviewer's forehead (towards the client), its tail on her mouth
  // directly above the tail tip, so the tail drops in front of her face (never across hair or face)
  const askDX = -75 * k;
  const askLeft = probeStage.headB.x + askDX - R * 1.15;

  // --- account bubble (+ clarified addendum); width is free of the y placement
  const pad = S * 0.7;
  const bubbleRight = Math.min(D.w - 10, askLeft - 16);
  const bubbleLeft = 10;
  const bubbleW = Math.min(C.bubbleMax, bubbleRight - bubbleLeft);
  const main = fitWords(pr.account, {maxWidth: bubbleW - pad * 2, size: S, minSize: minS, maxLines: 5, weight: 600});
  if (main.truncated) problems.push('account-truncated');
  let extra = null;
  if (clarifies) {
    const mR = S * 0.72;
    const tw = bubbleW - pad * 2.5 - mR * 2;
    const label = p.objectLabels.clarified ? fitWords(p.objectLabels.clarified, {maxWidth: tw, size: Math.max(S * 0.88, Math.min(S, 17)), minSize: Math.min(S, 17), maxLines: 2, weight: 700}) : null;
    const text = fitWords(pr.clarification, {maxWidth: tw, size: S, minSize: minS, maxLines: 3, weight: 600});
    if (text.truncated || (label && label.truncated)) problems.push('clarified-truncated');
    extra = {label, text, markerR: mR};
  }
  // bubble height (grown) before placing it
  const gap = pad * 0.7;
  const h1 = pad * 2 + main.height + (extra ? gap + extraBodyH(extra, pad) : 0);

  // --- vertical staging: bubble + tail + people (+ a band for tags in 9:16), centred.
  // The bubble sits above the heads and above the top of the held board.
  const tailGap = 22 * k;
  const boardTopLocal = -50 - (M.h + M.pad * 1.8) / k;
  const bubbleLocal = Math.min(-228 - 22, boardTopLocal - 16 / k);
  const band = portrait ? S * 5.2 : 0;
  const body = (C.crop - bubbleLocal) * k;
  const total = h1 + body + band;
  const free = Math.max(0, D.h - 16 - total);
  const topY = 8 + free * (shape === 'landscape' ? 0.6 : 0.5);
  const A = {x: Ax, y: topY + h1 - bubbleLocal * k};
  if (total > D.h - 16 + 0.5) problems.push('too-tall');
  const stage0 = interviewStage(ctx, {prefix: 'st', k, A, X, crop: C.crop, floor: C.floor, actors: p.actors, board: M, boardText: showAll, boardOpts: {title: pr.listTitle, questions: pr.questions}, gesture: C.gesture, boardGap: C.gap, panelLocal: C.panelLocal});
  const boardTop = stage0.boardBox.y - M.pad * 1.8;
  if (boardTop < 6) problems.push('board-too-tall');
  const pen = penPlan(stage0, sched.events);
  if (!pen.reach) problems.push('reach');
  const bx = shape !== 'landscape' ? bubbleLeft : clamp(stage0.mouthA.x - bubbleW * 0.3, bubbleLeft, bubbleRight - bubbleW);
  const tip = stage0.tipA;
  const bubbleBottom = A.y + bubbleLocal * k;
  const bub = talkBubble(ctx, {name: 'acc', x: bx, w: bubbleW, bottom: bubbleBottom, tip, tailBaseX: tip.x + 8 * k, pad, main, extra, showText: showAll, stroke: '#3b4450'});
  if (!stage0.tipClear(tip, 'a')) problems.push('tail-face');
  if (bub.box.y < 6) problems.push('bubble-too-tall');
  // the bubble must clear the board (it sits above the heads)
  const boardFull = {x: stage0.boardBox.x - M.pad, y: boardTop, w: M.w + M.pad * 2, h: stage0.boardBox.y + stage0.boardBox.h - boardTop};
  if (overlaps(bub.box, boardFull, 4)) problems.push('bubble-board');

  // --- question bubble ("?" shape) behind-above the interviewer's head
  const askC = {x: stage0.headB.x + askDX, y: Math.min(stage0.headTopY - R * 1.5, boardTop - R * 1.3)};
  const ask = askBubble(ctx, {name: 'ask', c: askC, R, tip: stage0.tipB, baseX: askC.x, stroke: '#3b4450'});
  // the bubble must stay clear of the board and of her head
  if (overlaps(ask.box, {x: stage0.boardBox.x - M.pad, y: stage0.boardBox.y - M.pad * 1.8, w: M.w + M.pad * 2, h: M.h + M.pad * 2.8}, 4)) problems.push('ask-board');
  if (!stage0.tipClear(stage0.tipB, 'b')) problems.push('ask-tail-face');

  // --- name chips on the table's front panel
  const T0 = stage0.table;
  const chips = [];
  if (showKey) {
    const half = (T0.x1 - T0.x0) / 2 - 26 * k;
    const cy = T0.panelTop + 12 * k;
    const mk = (id, x, anchor, sz, n) => wchip(ctx, captionOf(p, id, p.actorLabels[id]), {x, y: cy, anchor, maxWidth: half, size: sz, minSize: minS, maxLines: n, name: `chip-${id}`});
    let a = mk('client', T0.x0 + 20 * k, 'start', S, 1), b = mk('interviewer', T0.x1 - 20 * k, 'end', S, 1);
    if (a.fit.truncated || b.fit.truncated) {
      a = mk('client', T0.x0 + 20 * k, 'start', S, 3);
      b = mk('interviewer', T0.x1 - 20 * k, 'end', S, 3);
    }
    if (a.fit.truncated || b.fit.truncated || overlaps(a.box, b.box, 8) || Math.max(a.box.y + a.box.h, b.box.y + b.box.h) > T0.panelBottom - 4) problems.push('chips');
    chips.push(a, b);
  }

  // obstacles for tags / callouts
  // the bubble's tail (from its lower edge down to the mouth)
  const tailBox = {x: Math.min(tip.x, stage0.mouthA.x) - 30 * k, y: bubbleBottom, w: 60 * k + Math.abs(tip.x - stage0.mouthA.x), h: tip.y - bubbleBottom};
  const obstacles = [bub.box, tailBox, ask.box, boardFull, stage0.personBox('a'), stage0.personBox('b'), ...stage0.chairBoxes(),
    // the tabletop and its edge; the front panel below the name chips is free for labels
    {x: T0.x0, y: T0.yFar, w: T0.x1 - T0.x0, h: T0.panelTop + 6 * k - T0.yFar}, ...chips.map(c => c.box)];
  // below the panel (full-body staging) the legs and floor are art, not free space
  if (C.floor) obstacles.push({x: T0.x0 - 60 * k, y: T0.panelBottom, w: T0.x1 - T0.x0 + 120 * k, h: T0.yBottom - T0.panelBottom});
  // text areas (and heads) a leader must never cross
  const hr = stage0.headR * 1.15;
  // heads and bodies: leaders avoid them when another route exists
  const heads = [
    {x: stage0.headA.x - hr, y: stage0.headA.y - hr, w: hr * 2, h: hr * 2},
    {x: stage0.headB.x - hr, y: stage0.headB.y - hr, w: hr * 2, h: hr * 2},
    {x: stage0.hipA.x - 40 * k, y: stage0.headA.y, w: 80 * k, h: stage0.table.yNear - stage0.headA.y},
    {x: stage0.hipB.x - 40 * k, y: stage0.headB.y, w: 80 * k, h: stage0.table.yNear - stage0.headB.y},
  ];
  const textBoxes = [
    {x: bub.box.x + pad * 0.5, y: bub.box.y + pad * 0.5, w: bub.box.w - pad, h: bub.box.h - pad},
    {x: stage0.boardBox.x, y: stage0.boardBox.y, w: stage0.boardBox.w, h: stage0.boardBox.h},
  ];
  // leaders may cross bodies and the table, never chips, tags or other notes
  const chipBoxes = [ask.box, ...chips.map(c => c.box)];
  const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  const cands = [];
  for (let y = bounds.y; y < D.h; y += 12) for (let x = bounds.x; x < D.w; x += 12) cands.push({x, y});
  // generic captions (key, state tag) and callouts never exceed the smallest supplied text
  const cMin = Math.min(main.size, M.minSize, ...(extra ? [extra.text.size, ...(extra.label ? [extra.label.size] : [])] : []), ...chips.map(c => c.fit.size));
  const capS = Math.max(Math.min(17, cMin), Math.min(S * 0.92, cMin));

  // --- editorial callouts (leaders end on their target, never across text)
  const notes = [];
  const leaders = [];
  const leaderFrom = obstacles.length;
  obstacles.push(...chipBoxes);
  if (showAll) {
    const bb = bub.box;
    const targets = {
      // the bubble's lower edge beside the tail (inside the outline, clear of the text)
      account: {x: bb.x + Math.min(bb.w * 0.2, 80), y: bb.y + bb.h - 3},
      list: {x: stage0.boardBox.x - M.pad * 0.55 - 2, y: stage0.boardBox.y + stage0.boardBox.h * 0.3},
      // the Δ marker's outer edge (left of the disc)
      clarified: extra ? {x: bb.x + pad * 0.35, y: bb.y + bb.h - pad - extraBodyH(extra, pad) + extra.markerR} : {x: bb.x + 3, y: bb.y + bb.h / 2},
    };
    const exRowY = extra ? bb.y + bb.h - pad - extraBodyH(extra, pad) + extra.markerR : bb.y + bb.h / 2;
    const tgOpts = {
      account: [targets.account, {x: bb.x + bb.w - Math.min(bb.w * 0.2, 80), y: bb.y + bb.h - 3}],
      list: [
        targets.list,
        // the board's lower brown edge (reached from the table panel between the name chips)
        {x: stage0.boardBox.x + stage0.boardBox.w * 0.4, y: stage0.boardBox.y + stage0.boardBox.h + M.pad * 0.6},
        // the board's top edge, left of the clip
        {x: stage0.boardBox.x + stage0.boardBox.w * 0.18, y: stage0.boardBox.y - M.pad * 1.2},
      ],
      clarified: [targets.clarified, {x: bb.x + bb.w - 3, y: exRowY}],
    };
    for (const [i, a] of p.annotations.entries()) {
      if (a.target === 'clarified' && !clarifies) continue;
      let best = null;
      for (const maxW of (portrait ? [D.w * 0.62, D.w * 0.45] : [Math.min(460, D.w * 0.3), Math.min(330, D.w * 0.3), 250, 200])) {
        const probe = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, anchor: 'start', target: {x: -50, y: -50}, maxWidth: maxW, size: capS, minSize: capS, maxLines: 4});
        if (probe.fit.truncated) continue;
        const w = probe.box.w, hh = probe.box.h;
        for (const tg of tgOpts[a.target]) {
          let sc = Infinity;
          const spot = freeSpot(cands, w, hh, obstacles, bounds, 12, b => {
            const from = {x: clamp(tg.x, b.x + 12, b.x + b.w - 12), y: tg.y > b.y + b.h ? b.y + b.h : tg.y < b.y ? b.y : b.y + b.h / 2};
            if (from.y === b.y + b.h / 2) from.x = tg.x > b.x + b.w / 2 ? b.x + b.w : b.x;
            const len = Math.hypot(tg.x - from.x, tg.y - from.y);
            // stop the crossing test 14 units before the target (the dot sits on the edge)
            const end = len > 14 ? {x: tg.x - ((tg.x - from.x) * 14) / len, y: tg.y - ((tg.y - from.y) * 14) / len} : from;
            const cross = [...textBoxes, ...obstacles.slice(leaderFrom)].some(o => segHits(from, end, o)) ? 1e5 : 0;
            const v = len + cross + (heads.some(o => segHits(from, end, o)) ? 600 : 0) + (len < 36 ? 300 : 0);
            return v;
          });
          if (!spot) continue;
          // recompute the chosen spot's score
          const b = {x: spot.x, y: spot.y, w, h: hh};
          const from = {x: clamp(tg.x, b.x + 12, b.x + b.w - 12), y: tg.y > b.y + b.h ? b.y + b.h : tg.y < b.y ? b.y : b.y + b.h / 2};
          if (from.y === b.y + b.h / 2) from.x = tg.x > b.x + b.w / 2 ? b.x + b.w : b.x;
          const len = Math.hypot(tg.x - from.x, tg.y - from.y);
          const end = len > 14 ? {x: tg.x - ((tg.x - from.x) * 14) / len, y: tg.y - ((tg.y - from.y) * 14) / len} : from;
          sc = len + ([...textBoxes, ...obstacles.slice(leaderFrom)].some(o => segHits(from, end, o)) ? 1e5 : 0) + (heads.some(o => segHits(from, end, o)) ? 600 : 0);
          if (!best || sc < best.sc) best = {sc, spot, tg, maxW, len};
        }
      }
      if (!best || best.sc >= 1e5) { problems.push('note'); if (!best) continue; }
      // a callout sits near its target: never on a long leader
      if (best.len > MAX_LEADER) problems.push('note-far');
      leaders.push(r(best.len));
      const n = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: best.spot.x, y: best.spot.y}, anchor: 'start', target: best.tg, maxWidth: best.maxW, size: capS, minSize: capS, maxLines: 4});
      if (n.fit.truncated) problems.push('note-truncated');
      notes.push(n);
      obstacles.push(n.box);
    }
  }

  // --- final-state tag and the neutral key (near the scene they describe)
  let tag = null, key = null;
  const stateText = {'account-given': ctx.t.accountGiven, 'questions-asked': ctx.t.questionsAsked, 'detail-clarified': ctx.t.detailClarified}[p.finalState];
  const sceneC = {x: (T0.x0 + T0.x1) / 2, y: (stage0.headTopY + T0.yBottom) / 2};
  const anchorPt = p.finalState === 'questions-asked' ? {x: boardFull.x + boardFull.w, y: boardFull.y} : {x: bub.box.x + bub.box.w, y: bub.box.y + bub.box.h};
  if (showKey) {
    const maxW = portrait ? D.w - 20 : Math.max(280, Math.min(520, D.w * 0.3));
    const probe = wchip(ctx, `● ${stateText}`, {x: 0, y: 0, maxWidth: maxW, size: capS, minSize: capS, maxLines: 2, weight: 700});
    const spot = freeSpot(cands, probe.box.w, probe.box.h, obstacles, bounds, 12, b => Math.hypot(b.x + b.w / 2 - anchorPt.x, b.y + b.h / 2 - anchorPt.y));
    if (spot) {
      tag = wchip(ctx, `● ${stateText}`, {x: spot.x, y: spot.y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 2, weight: 700, name: 'state-tag', color: th.ink, stroke: th.ink});
      obstacles.push(tag.box);
    } else problems.push('tag');
    const kProbe = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: maxW, size: capS, minSize: capS, maxLines: 2});
    const kSpot = freeSpot(cands, kProbe.box.w, kProbe.box.h, obstacles, bounds, 12, b => Math.hypot(b.x + b.w / 2 - sceneC.x, (b.y + b.h / 2 - T0.yBottom) * 1.6));
    if (kSpot) {
      key = keyChip(ctx, ctx.t.key, {x: kSpot.x, y: kSpot.y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 2, name: 'key'});
      obstacles.push(key.box);
    } else problems.push('key');
  }

  const contentMin = Math.min(capS, M.minSize, main.size, ...(extra ? [extra.text.size] : []), ...chips.map(c => c.fit.size));
  return {ok: problems.length === 0, problems, S, stage: stage0, M, bub, ask, chips, tag, key, notes, sched, extra: Boolean(extra), capS, contentMin, penTrack: pen.track, ticks: pen.ticks, leaders, tailClear: stage0.tipClear(tip, 'a'), askTailClear: stage0.tipClear(stage0.tipB, 'b')};
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    let L = null;
    const tries = [];
    // a taller board may need more room between it and the interviewer's face
    outer: for (let S = C.size; S >= C.min - 1e-6; S -= 1) {
      for (const gapAdd of [0, 16]) {
        L = tryLayout(ctx, S, gapAdd);
        if (L.ok) break outer;
        tries.push(`${S}/${gapAdd}:${L.problems.join('+')}`);
      }
    }
    L.tries = tries;
    const st = L.stage;
    return L;
  },
  build(ctx, L) {
    return g(null,
      L.stage.node,
      L.chips.map(c => c.node),
      L.ask.node,
      L.bub.node,
      L.tag && L.tag.node,
      L.key && L.key.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const st = L.stage;
    const reduced = ctx.reduced;
    const endU = L.sched.end + 0.06;
    const capU = lerp(ACT0, endU, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const qn = p.props.questions.length;
    const ticks = new Array(qn).fill(0), hl = new Array(qn).fill(0);
    let talkA = 0, talkB = 0, leanA = 0, leanB = 0, gestA = 0, tiltB = -3, tiltA = 0;
    let open = 0, words = 0, grow = 0, extra = 0, askOpen = 0;
    let tickTarget = null;
    for (const e of L.sched.events) {
      const x = seg(a, e.a, e.b);
      if (a < e.a) continue;
      if (e.type === 'account') {
        const on = seg(x, 0.06, 0.14) * (1 - seg(x, 0.82, 0.92));
        talkA = Math.max(talkA, on);
        leanA = Math.max(leanA, 6 * ease.inOutSine(seg(x, 0, 0.16)) * (1 - ease.inOutSine(seg(x, 0.84, 1))));
        gestA = Math.max(gestA, ease.inOutSine(seg(x, 0.1, 0.3)) * (1 - ease.inOutSine(seg(x, 0.74, 0.96))));
        open = Math.max(open, seg(x, 0, 0.22));
        words = Math.max(words, seg(x, 0.16, 0.5));
        if (x < 1) tiltB = lerp(tiltB, -5, ease.inOutSine(seg(x, 0, 0.2)));
      } else if (e.type === 'ask') {
        if (x < 1 || a <= e.b) askOpen = Math.max(askOpen, seg(x, 0, 0.18) * (1 - seg(x, 0.84, 1)));
        talkB = Math.max(talkB, seg(x, 0.03, 0.08) * (1 - seg(x, 0.36, 0.42)));
        hl[e.i] = Math.max(hl[e.i], seg(x, 0, 0.12) * (1 - seg(x, 0.88, 1)));
        ticks[e.i] = Math.max(ticks[e.i], ease.inOutSine(seg(x, 0.55, 0.8)));
        const mark = seg(x, 0.4, 0.55) * (1 - seg(x, 0.82, 0.98));
        leanB = Math.max(leanB, leanAsk(x));
        if (x < 1) tiltB = lerp(-4, 9, ease.inOutSine(mark));
      } else if (e.type === 'clarify') {
        talkA = Math.max(talkA, seg(x, 0.04, 0.1) * (1 - seg(x, 0.5, 0.58)));
        leanA = Math.max(leanA, 5 * ease.inOutSine(seg(x, 0, 0.14)) * (1 - ease.inOutSine(seg(x, 0.6, 0.8))));
        gestA = Math.max(gestA, 0.6 * ease.inOutSine(seg(x, 0.06, 0.2)) * (1 - ease.inOutSine(seg(x, 0.5, 0.7))));
        grow = Math.max(grow, seg(x, 0.08, 0.36));
        extra = Math.max(extra, seg(x, 0.34, 0.56));
        if (x < 1) tiltB = lerp(tiltB, -5, ease.inOutSine(seg(x, 0, 0.2)));
      }
    }
    for (const t of L.ticks) if (a >= t.draw[0] && a <= t.draw[1]) tickTarget = null;
    // pen and A's gesturing hand
    const nib = runTrack(a, st.rest.nibB, L.penTrack);
    const activeTick = L.ticks.find(t => a >= t.draw[0] && a <= t.draw[1]);
    if (activeTick) tickTarget = nib;
    const wave = reduced ? 0 : Math.sin(timeMs * 0.009) * 10 * st.k;
    const gp = {x: st.rest.gestureA.x, y: st.rest.gestureA.y + wave * gestA};
    const nearA = mix(st.rest.nearA, gp, gestA);
    const present = ease.inOutCubic(seg(u, ...W.present));
    const posed = st.pose({
      a: {near: nearA, lean: leanA, mouth: talkA * flap(timeMs, reduced, 0), tilt: tiltA},
      b: {nib, lean: leanB, mouth: talkB * flap(timeMs, reduced, 0.9), tilt: tiltB},
      board: {rot: lerp(BOARD_REST.rot, BOARD_UP.rot, present), dy: lerp(BOARD_REST.dy, BOARD_UP.dy, present)},
      boardState: {ticks, hl},
    });
    const nodes = posed.nodes;
    Object.assign(nodes, L.bub.frame(open, words, grow, extra, reduced));
    Object.assign(nodes, L.ask.frame(askOpen, reduced));
    const fade = w => (done ? r(seg(u, ...w), 3) : 0);
    if (L.tag) nodes['state-tag'] = {opacity: fade(W.tag)};
    if (L.key) nodes.key = {opacity: fade(W.key)};
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    return {
      nodes,
      semantic: {
        ...sem,
        tickTarget: tickTarget ? {x: r(tickTarget.x), y: r(tickTarget.y)} : null,
        beat,
        first: L.sched.first,
        events: L.sched.events.map(e => (e.type === 'ask' ? `ask${e.i}` : e.type)).join('>'),
        ticks: ticks.map(v => r(clamp(v), 3)),
        asked: ticks.filter(v => v >= 1).length,
        bubbleA: r(open, 3),
        words: r(words, 3),
        grow: r(grow, 3),
        clarifiedShown: r(extra, 3),
        askOpen: r(askOpen, 3),
        speakingA: talkA > 0.5,
        speakingB: talkB > 0.5,
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        labelsFit: L.ok,
        layoutProblems: L.problems,
        layoutTries: L.tries,
        textSize: L.S,
        contentMin: r(L.contentMin),
        keyShown: Boolean(L.key),
        leaderMax: L.leaders.length ? Math.max(...L.leaders) : 0,
        tailClear: L.tailClear, askTailClear: L.askTailClear,
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
    slug: 'roles-01-story',
    title: 'Client interview — an account and a list of questions at the table',
    titleEs: 'Entrevista a cliente — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Entrevista a cliente',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Medium shot of a meeting table: the client tells a supplied account in a speech bubble while gesturing; the interviewer holds an upright question list, asks each question ("?" bubble) and marks it with a pen that follows the solved hand; the client’s answer adds the supplied clarified detail under the account with a neutral Δ marker. Final state supplied; nothing is assessed.',
    tags: ['client interview', 'account', 'questions', 'question list', 'clipboard', 'pen', 'speech bubble', 'table', 'two people', 'clarified detail'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/entrevista-a-cliente.js', 'src/animations/roles/kits/mediation-labels.js', 'src/animations/roles/kits/mediation-table.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/markers.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
