/**
 * LAW-0353 — Efectos durante revisión · story
 *
 * Storyboard (a top-down desk with a two-lane board: the PROCESS lane (● stripe) and, apart from it, the REVIEW lane
 * (◆ stripe); the decision card lies at the start of the process lane, the appeal card at the start of the review
 * lane; a slatted filter gate stands across the process lane and a tag hanging from it prints the SUPPLIED datum —
 * effect maintained (slats edge-on, open) or effect suspended (slats closed, neutral pause glyph); a desk calendar is a
 * fixture only; two hands rest at the desk's edges, one on each side of the board):
 *  0.00–0.15  rest: everything still, the datum tag readable.
 *  0.15–0.42  the action starts: each hand reaches its card (the cause) and both cards begin to advance, at the same
 *             pace, each in its own lane — they never cross or touch.
 *  0.42–0.73  the advance completes: the appeal card reaches the review lane's end bay; the decision card either passes
 *             under the open gate to the process lane's end bay while the chevrons past the gate light up (maintained),
 *             or stops before the closed gate and waits there (suspended). The hands let go and return to the edges.
 *  0.73–1.00  hold: both cards where the supplied datum leaves them, notes, the supplied state and the key "as
 *             supplied · no conclusion drawn". No suspension doctrine, no dates, no time limits; nothing is judged.
 * @module animations/review/LAW-0353
 */
import {defineAnimation} from '../../core/define.js';
import {fitDesign} from '../../core/layout.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {topArm, deskWindow} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  edFields, ED_EN, ED_ES, localisedEd, cardModel, cardNode, tagModel, boardPlan, boardNodes, gateFrame, litFrame,
  panelLayout, panelNode, ringRect, noteColors, overlaps, R2, mix,
} from './kits/efectos-durante-revision.js';

const ID = 'LAW-0353';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {reach: [0.15, 0.21], slide: [0.21, 0.62], wait: [0.21, 0.5], lit: [0.47, 0.64], release: [0.63, 0.71], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['cards', 'arrows', 'filter', 'calendar'];
const SIZES = [26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {
    maintained: 'Both cards advanced in their own lanes; the decision card passed the open filter (supplied datum)',
    suspended: 'Both cards advanced in their own lanes; the decision card waits at the closed filter (supplied datum)',
  },
  es: {
    maintained: 'Las dos tarjetas avanzaron por su carril; la resolución pasó el filtro abierto (dato aportado)',
    suspended: 'Las dos tarjetas avanzaron por su carril; la resolución espera ante el filtro cerrado (dato aportado)',
  },
};

const OWN_EN = {
  actorLabels: {a: 'Hands of two participants (fictional, generic)'},
  objectLabels: {arrows: 'Chevrons: direction of travel in each lane', calendar: 'Desk calendar (no date marked)'},
  annotations: [{target: 'filter', text: 'The gate only shows the supplied datum; it explains nothing'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos de dos participantes (ficticias, genéricas)'},
  objectLabels: {arrows: 'Chevrones: sentido de avance en cada carril', calendar: 'Calendario de mesa (sin fechas marcadas)'},
  annotations: [{target: 'filter', text: 'El filtro solo muestra el dato aportado; no explica nada'}],
  stateCaption: '',
};
const EN = {...ED_EN, ...OWN_EN};
const ES = {...ED_ES, ...OWN_ES};

const sceneSchema = {
  ...edFields,
  actorLabels: obj('Caption of the actors (legend)', {a: str('Caption for the two hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the desk objects in the legend', {
    arrows: str('Caption for the chevrons (direction of travel only)', 80),
    calendar: str('Caption for the desk calendar (a fixture only)', 70),
  }, ['arrows', 'calendar']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 100),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The supplied datum (no conclusion is inferred): maintained — the gate is open and the decision card passes it; suspended — the gate is closed and the decision card waits before it', ['maintained', 'suspended']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 120),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'maintained'};

function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const orient = opts.orient;
  const H = orient === 'h';
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'filter', text: P.labels.filter, name: 'lg-filter'});
  if (showKey) rows.push({kind: 'item', icon: 'laneA', text: P.routes.process, name: 'lg-process'});
  if (showKey) rows.push({kind: 'item', icon: 'laneB', text: P.routes.review, name: 'lg-review'});
  if (showAll) rows.push({kind: 'item', icon: 'kind-sequence', text: P.objectLabels.arrows, name: 'lg-arrows'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
  if (showAll) rows.push({kind: 'item', icon: 'hand', text: P.actorLabels.a, name: 'lg-hand'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});

  const gap = F * 1.2;
  let desk, panel = null, PL = null;
  if (!rows.length) desk = {x: 0, y: 0, w: DW, h: DH};
  else if (opts.band) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols || 1, tight: opts.tight});
    desk = {x: 0, y: 0, w: DW, h: DH - PL.h - gap};
    panel = {x: 4, y: DH - PL.h};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F});
    desk = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  // margins: the hands rest in the margins on both sides of the board
  const mHand = opts.tight ? Math.max(F * 1.7, 32) : Math.max(F * 2.4, 42), mSide = Math.max(F * 0.9, 16);
  const inner = H ? {x: desk.x + mSide, y: desk.y + mHand, w: desk.w - mSide * 2, h: desk.h - mHand * 2}
    : {x: desk.x + mHand, y: desk.y + mSide, w: desk.w - mHand * 2, h: desk.h - mSide * 2};
  const tagW = F * (H ? 16 : 12);
  const planFor = cw => {
    const M = cardModel(P, {w: cw, F, showText: showKey, minK: H ? opts.minK : 0.3});
    const TM = tagModel(P, {w: tagW, F, maxLines: H ? 5 : 6});
    return {M, TM, B: boardPlan(M, TM, {F, orient})};
  };
  const fits = q => q.B.w <= inner.w + 0.5 && q.B.h <= inner.h + 0.5 && q.M.ok;
  // (height falls and length grows with the card width: scan the widths, keep the widest that fits)
  const lo = F * 8.6, hi = Math.max(lo, Math.min(F * (H ? 19 : 15), H ? inner.w * 0.34 : inner.w * 0.4));
  let best = null;
  for (let k = 0; k <= 8; k++) {
    const q = planFor(hi - ((hi - lo) * k) / 8);
    if (fits(q)) { best = q; break; }
    if (!best) best = q;
  }
  let {M, TM, B} = best;
  // stretch the lanes along their axis to use the free length (more travel before the gate and more run after it)
  const extra = (H ? inner.w - B.w : inner.h - B.h) - F;
  if (fits(best) && extra > 0) B = boardPlan(M, TM, {F, orient, travel: B.travel + extra * 0.55, run: B.run + extra * 0.45});
  if (opts.band && PL) {
    const need = (H ? B.h + mHand * 2 : B.h + mSide * 2) + F * 0.4;
    if (need < desk.h) {
      desk.h = need;
      inner.h = desk.h - (H ? mHand * 2 : mSide * 2);
      panel.y = desk.h + gap;
    }
  }
  const ox = inner.x + (inner.w - B.w) / 2, oy = inner.y + Math.max(0, (inner.h - B.h) / 2);
 
  const problems = [!fits(best) && 'board', !M.ok && 'card-text', !TM.ok && 'tag-text', !B.ok && 'tag-calendar', PL && !PL.ok && 'panel-text'].filter(Boolean);
  // hands: grips on the outer edge of each card; shoulders outside the desk, tracking the hand along the lane
  const deskB = desk.y + desk.h, deskR = desk.x + desk.w;
  const sOff = Math.max(100, F * 4.5);
  // (the hands push from behind each card's trailing edge: they never cover its text)
  const grip = H ? [{x: -F * 0.45, y: Math.min(M.h * 0.4, F * 1.4)}, {x: -F * 0.45, y: M.h - Math.min(M.h * 0.4, F * 1.4)}] : [{x: Math.min(M.w * 0.4, F * 1.4), y: -F * 0.45}, {x: M.w - Math.min(M.w * 0.4, F * 1.4), y: -F * 0.45}];
  const at = (i, t) => { const p = B.pos(i, t); return {x: p.x + ox, y: p.y + oy}; };
  const gripAt = (i, t) => { const p = at(i, t); return {x: p.x + grip[i].x, y: p.y + grip[i].y}; };
  const lead = F * 2.2;
  const rest = H ? [{x: gripAt(0, B.tStart).x - lead, y: desk.y + mHand * 0.42}, {x: gripAt(1, B.tStart).x - lead, y: deskB - mHand * 0.42}]
    : [{x: desk.x + mHand * 0.42, y: gripAt(0, B.tStart).y - lead}, {x: deskR - mHand * 0.42, y: gripAt(1, B.tStart).y - lead}];
  const shoulderFor = (i, hand) => (H ? {x: hand.x - F * 2.4, y: i === 0 ? desk.y - sOff : deskB + sOff} : {x: i === 0 ? desk.x - sOff : deskR + sOff, y: hand.y - F * 2.4});
  const far = Math.max(...[0, 1].flatMap(i => [gripAt(i, B.tStart), gripAt(i, B.tEnd), rest[i]].map(p => { const s = shoulderFor(i, p); return Math.hypot(p.x - s.x, p.y - s.y); })));
  const armLen = far * 0.5 + 24;
  const armW = clamp(F * 2, 36, 52);
  const usedH = PL ? Math.max(desk.y + desk.h, panel.y + PL.h) : desk.y + desk.h;
  const dy = Math.max(0, (DH - usedH) / 2);
  return {F, orient, H, desk, inner, panel, PL, M, TM, B, ox, oy, at, gripAt, grip, rest, shoulderFor, armLen, armW, dy, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 820], portrait: [950, 1420]},
  layout(ctx) {
    const P = localisedEd(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const arrangements = shape === 'portrait' ? [{band: true, orient: 'v'}, {band: true, cols: 2, orient: 'v'}]
      : shape === 'square' ? [{band: true, cols: 2, orient: 'h'}, {pw: 0.42, orient: 'v'}, {pw: 0.46, orient: 'v'}, {band: true, cols: 2, orient: 'h', tight: true}, {band: true, cols: 3, orient: 'h', tight: true}]
        : [{pw: 0.27, orient: 'h'}, {pw: 0.31, orient: 'h'}, {pw: 0.35, orient: 'h'}];
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const sizes = (!showKey ? [40, 36, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements.flatMap(x => [0.8, 0.6, 0.45, 0.3].map(mk => ({...x, minK: mk})))) {
        const c = compose(ctx, P, F, a);
        if (c.ok) { C = c; break outer; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    const look0 = actorLook(ctx, {appearance: {}}, 0), look1 = actorLook(ctx, {appearance: {}}, 1);
    const arm = (name, look, handed) => topArm(ctx, {name, skin: look.skin, sleeve: look.outfit, handed, upper: C.armLen, lower: C.armLen, width: C.armW, handScale: 1.25});
    const armP = arm('armP', look0, 'right'), armR = arm('armR', look1, 'left');
    const notes = noteColors(ctx.theme);
    const showAll = ctx.show('all');
    const {B, M} = C;
    const tgt = name => {
      const pad = 12;
      const o = (bx) => ({x: bx.x + C.ox - pad, y: bx.y + C.oy - pad, w: bx.w + pad * 2, h: bx.h + pad * 2});
      if (name === 'calendar' && B.cal) return o({...B.cal, y: B.cal.y - 6, h: B.cal.h + 10});
      if (name === 'filter') return o(B.gateBox);
      if (name === 'arrows') {
        const a = B.axis(0, B.lit[0] ?? B.gT), b = B.axis(0, B.lit[B.lit.length - 1] ?? B.gT);
        const s = B.wd * 0.3;
        return o({x: Math.min(a.x, b.x) - s, y: Math.min(a.y, b.y) - s, w: Math.abs(b.x - a.x) + s * 2, h: Math.abs(b.y - a.y) + s * 2});
      }
      // (cards: one ring round each card where it ends — a single ring would cross the tag between the lanes)
      const p0 = B.pos(0, P.finalState === 'maintained' ? B.tEnd : B.tWait), p1 = B.pos(1, B.tEnd);
      return [o({...p0, w: M.w, h: M.h}), o({...p1, w: M.w, h: M.h})];
    };
    const rings = showAll ? P.annotations.filter(a => a.target !== 'calendar' || B.cal).flatMap((a, i) => [tgt(a.target)].flat().map(b => ringRect(b, notes[i % 2], 4))) : [];
    return {P, C, armP, armR, rings, look: look0, pxu};
  },
  build(ctx, L) {
    const {C, P} = L;
    const {M, B, TM} = C;
    const showKey = ctx.show('key');
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const st = P.finalState === 'maintained' ? 0 : 1;
    const bn = boardNodes(ctx, B, TM, {prefix: 'bd', showText: showKey, tagOps: [st === 0 ? 1 : 0, st === 1 ? 1 : 0]});
    const s0 = C.at(0, B.tStart), s1 = C.at(1, B.tStart);
    return g({name: 'scene', transform: C.dy ? T(0, C.dy) : undefined},
      desk.surface,
      g({'clip-path': desk.clip},
        g({name: 'board', transform: T(C.ox, C.oy)}, bn.lanes, bn.cal, bn.tag),
        g({name: 'cardP', transform: T(s0.x, s0.y)}, cardNode(ctx, M, 0, {prefix: 'cardP-art'})),
        g({name: 'cardR', transform: T(s1.x, s1.y)}, cardNode(ctx, M, 1, {prefix: 'cardR-art'})),
        g({transform: T(C.ox, C.oy)}, bn.gate),
        L.armP.arm, L.armR.arm, L.armP.palm, L.armR.palm, L.armP.thumb, L.armR.thumb,
      ),
      desk.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL, {skin: L.look.skin})) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, C} = L;
    const {B} = C;
    const nodes = {};
    const maintained = P.finalState === 'maintained';
    const cap = lerp(W.reach[0], W.release[1], clamp(P.actionProgress));
    const done = P.actionProgress >= 1;
    const ua = done ? u : Math.min(u, cap);
    const e = ease.inOutCubic;
    const kReach = e(seg(ua, ...W.reach)), kRel = e(seg(ua, ...W.release));
    const kR = e(seg(ua, ...W.slide));
    const kP = maintained ? e(seg(ua, ...W.slide)) : e(seg(ua, ...W.wait));
    const tP = maintained ? lerp(B.tStart, B.tEnd, kP) : lerp(B.tStart, B.tWait, kP);
    const tR = lerp(B.tStart, B.tEnd, kR);
    const pP = C.at(0, tP), pR = C.at(1, tR);
    nodes.cardP = {transform: T(pP.x, pP.y)};
    nodes.cardR = {transform: T(pR.x, pR.y)};
    const gP = C.gripAt(0, tP), gR = C.gripAt(1, tR);
    const hP = kRel > 0 ? mix(gP, C.rest[0], kRel) : mix(C.rest[0], gP, kReach);
    const hR = kRel > 0 ? mix(gR, C.rest[1], kRel) : mix(C.rest[1], gR, kReach);
    const pp = L.armP.pose(C.shoulderFor(0, hP), hP, C.H ? 1 : -1);
    const pr = L.armR.pose(C.shoulderFor(1, hR), hR, C.H ? -1 : 1);
    Object.assign(nodes, pp.nodes, pr.nodes);
    Object.assign(nodes, gateFrame('bd-gate', maintained ? 0 : 1));
    const kLit = maintained ? seg(ua, ...W.lit) : 0;
    Object.assign(nodes, litFrame('bd', B, kLit));
    const held = kReach >= 1 && kRel <= 0;
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const row of C.PL.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const lead = tP + B.along; // leading edge of the decision card along its lane
    const passed = tP >= B.gT + B.gThk / 2;
    const phase = ua < W.reach[0] ? 'rest' : ua < W.reach[1] ? 'reach' : kRel <= 0 && (kR < 1 || kP < 1) ? 'advance' : kRel <= 0 ? 'arrived' : kRel < 1 ? 'release' : 'done';
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const boxP = {x: pP.x, y: pP.y, w: C.M.w, h: C.M.h}, boxR = {x: pR.x, y: pR.y, w: C.M.w, h: C.M.h};
    const laneBox = i => ({x: B.lanes[i].x + C.ox, y: B.lanes[i].y + C.oy, w: B.lanes[i].w, h: B.lanes[i].h});
    const inside = (a, b) => a.x >= b.x - 0.5 && a.y >= b.y - 0.5 && a.x + a.w <= b.x + b.w + 0.5 && a.y + a.h <= b.y + b.h + 0.5;
    return {
      nodes,
      semantic: {
        beat, phase,
        handP: R2(pp.hand), handR: R2(pr.hand), gripP: R2(gP), gripR: R2(gR),
        cardP: R2({x: pP.x + C.M.w / 2, y: pP.y + C.M.h / 2}), cardR: R2({x: pR.x + C.M.w / 2, y: pR.y + C.M.h / 2}),
        held, kP: r(kP, 3), kR: r(kR, 3), reach: r(kReach, 3),
        tP: r(tP, 2), tR: r(tR, 2), tStart: r(B.tStart, 2), tWait: r(B.tWait, 2), tEnd: r(B.tEnd, 2), gateT: r(B.gT, 2),
        leadGap: r(B.gT - B.gThk / 2 - lead, 2), passed, closed: !maintained, lit: r(kLit, 3),
        inLanes: inside(boxP, laneBox(0)) && inside(boxR, laneBox(1)), cardsApart: !overlaps(boxP, boxR, 2),
        allReached: pp.reached && pr.reached,
        finalState: P.finalState, actionCapped: P.actionProgress < 1 && u > cap,
        problems: C.problems, textPx: r(C.F * L.pxu, 1), orient: C.orient,
        desk: {x: r(C.desk.x), y: r(C.desk.y), w: r(C.desk.w), h: r(C.desk.h)},
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
    slug: 'review-09-story',
    title: 'Effects during review — two hands advance a decision card and an appeal card in separate lanes; a filter set by the supplied datum lets the decision card pass or makes it wait',
    titleEs: 'Efectos durante revisión — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Efectos durante revisión',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down desk with two separate lanes: the process lane carries the decision card (●), the review lane the appeal card (◆). A slatted filter gate stands across the process lane; its tag prints the supplied datum. Two hands push both cards forward at the same pace, each in its own lane. The appeal card reaches the review lane\'s end bay; the decision card passes under the open gate while the chevrons past it light up (effect maintained, as supplied) or stops before the closed gate (effect suspended according to the data supplied). A desk calendar is a fixture only. Illustrative; no suspension doctrine, no dates, no time limits; jurisdiction unspecified.',
    tags: ['review', 'effects during review', 'parallel lanes', 'appeal', 'decision card', 'filter gate', 'supplied datum', 'chevrons', 'calendar', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/efectos-durante-revision.js', 'src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/desk.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
