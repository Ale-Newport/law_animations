/**
 * LAW-0401 — Mapa de proposiciones · story
 *
 * Storyboard (an open scene, front view: a witness stands on the left holding her statement card — the anchor; an
 * analyst stands beside her; a proposition board stands on an easel on the right (on tall frames it hangs above the
 * people) with the claim cards pinned along its top and an empty slot for each piece of evidence below; from each
 * claim card's eyelet one thread per supplied link hangs loose (solid = supplied as direct support, dashed = supplied
 * as a disputed inference); the other labelled evidence (a document, a photo or an object, as supplied) lies on a low
 * table; a magnifier lies on the board's ledge; a legend lists the claims, evidence, links, open points and captions):
 *  0.00–0.15  rest: everything still; no card is on the board, every thread hangs loose.
 *  0.15–0.42  the action starts: the witness holds out her statement card, the analyst's hand meets it at the same
 *             point and takes it; the analyst turns to the board, carries the card to its slot and pins it; then takes
 *             the loose end of each thread supplied for that card and carries it down to the card's eyelet — the
 *             labelled evidence is now joined to the claim it is said to support.
 *  0.42–0.73  the same for every other piece: the analyst lifts it from the table (it turns upright as it is lifted),
 *             carries it to its slot, pins it and joins its threads; then steps back beside the board.
 *  0.73–1.00  hold: the board shows every link as supplied; notes, the supplied state and the key "links as supplied ·
 *             no weighing of evidence, no conclusion drawn". No credibility judgement, no proof standard, no outcome.
 * @module animations/evidence-analysis/LAW-0401
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {personRig} from '../../primitives/person.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  eaFields, EA_EN, EA_ES, localised, resolveLinks, boardNode, threadNode, threadD, magnifierArt, magnifierBox,
  legendColumns, panelNode, ringRect, fitG, noteColors, R2, overlaps, unionBox, INK, FRAME, THREAD,
} from './kits/analysis-art.js';
import {
  MP_LABELS_EN, MP_LABELS_ES, mpLabelFields, boardLayout, idFits, claimTextH, evLabelH, slotLabelNodes, cardNodes, evidenceBox, slotNodes, contentRows,
} from './kits/mapa-proposiciones.js';

const ID = 'LAW-0401';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const ACT = [0.15, 0.725];
const W = {notes: [0.745, 0.8], state: [0.75, 0.805]};
const TARGETS = ['board', 'witness', 'thread', 'magnifier'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16];
const SHOULDER = {x: 12, y: -302};
const REACH = 165;
const LIE = 0.34; // vertical squash of a card lying on the table

const STRINGS = {
  en: {
    linked: 'Every supplied link is joined on the board (as supplied)',
    pinned: 'The evidence is pinned; the threads are not joined yet (as supplied)',
    pending: 'Nothing has been placed on the board yet (as supplied)',
  },
  es: {
    linked: 'Todos los vínculos aportados están unidos en el tablero (según lo aportado)',
    pinned: 'Las pruebas están clavadas; los hilos aún no se han unido (según lo aportado)',
    pending: 'Aún no se ha colocado nada en el tablero (según lo aportado)',
  },
};

const OWN_EN = {
  labels: MP_LABELS_EN,
  actorLabels: {a: 'Witness W. Abara holding her statement (fictional)', b: 'Analyst placing the evidence (fictional, generic)'},
  objectLabels: {board: 'Proposition board: claims above, evidence below', thread: 'Each thread is one supplied link', magnifier: 'Magnifier on the ledge (not used to weigh anything)'},
  annotations: [{target: 'thread', text: 'Solid and dashed threads only show how each link was supplied'}],
  stateCaption: '',
};
const OWN_ES = {
  labels: MP_LABELS_ES,
  actorLabels: {a: 'Testigo W. Abara con su declaración (ficticia)', b: 'Analista que coloca las pruebas (ficticio, genérico)'},
  objectLabels: {board: 'Tablero de proposiciones: afirmaciones arriba, pruebas abajo', thread: 'Cada hilo es un vínculo aportado', magnifier: 'Lupa en el reborde (no se usa para valorar nada)'},
  annotations: [{target: 'thread', text: 'Los hilos continuos y discontinuos solo muestran cómo se aportó cada vínculo'}],
  stateCaption: '',
};
const EN = {...EA_EN, ...OWN_EN};
const ES = {...EA_ES, ...OWN_ES};

const sceneSchema = {
  ...eaFields,
  ...mpLabelFields,
  actorLabels: obj('Captions of the two actors (legend)', {
    a: str('Caption for the witness (fictional)', 70),
    b: str('Caption for the analyst (fictional, generic)', 70),
  }, ['a', 'b']),
  objectLabels: obj('Captions of the props in the legend', {
    board: str('Caption for the proposition board', 70),
    thread: str('Caption for the threads', 60),
    magnifier: str('Caption for the magnifier', 70),
  }, ['board', 'thread', 'magnifier']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): linked — every card is pinned and every supplied thread joined; pinned — cards pinned, threads left loose; pending — nothing is placed', ['linked', 'pinned', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 100),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'linked'};

/* ------------------------------------------------------------------ */

function legendRows(ctx, P, links, looks, actorLooks, claimsInLegend, compact = false, evInLegend = true) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = contentRows(ctx, P, links, {looks, claims: claimsInLegend, evidence: evInLegend});
  if (showAll) {
    if (compact) {
      rows.push({kind: 'item', icon: 'person', look: actorLooks[0], text: `${P.actorLabels.a} · ${P.actorLabels.b}`, name: 'lg-actors', caption: true, maxLines: 6});
      rows.push({kind: 'item', icon: 'board', text: `${P.objectLabels.board} · ${P.objectLabels.thread} · ${P.objectLabels.magnifier}`, name: 'lg-objects', caption: true, maxLines: 7});
    } else {
      rows.push({kind: 'item', icon: 'person', look: actorLooks[0], text: P.actorLabels.a, name: 'lg-wit', caption: true});
      rows.push({kind: 'item', icon: 'person', look: actorLooks[1], text: P.actorLabels.b, name: 'lg-an', caption: true});
      rows.push({kind: 'item', icon: 'board', text: P.objectLabels.board, name: 'lg-board', caption: true});
      rows.push({kind: 'item', icon: 'line-direct', text: P.objectLabels.thread, name: 'lg-thread', caption: true});
      rows.push({kind: 'item', icon: 'lens', text: P.objectLabels.magnifier, name: 'lg-mag', caption: true});
    }
    P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  }
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Stage geometry for a stage box and an arrangement candidate. */
function stageModel(ctx, P, links, S, cand) {
  const tall = cand.arr === 'tall';
  const k = cand.kf * S.h / 410;
  const floor = S.y + S.h - 8;
  const wx = S.x + 52 * k;
  const ax0 = wx + 205 * k;
  let board, inner, BL;
  const innerOf = b => { const fw = clamp(Math.min(b.w, b.h) * 0.035, 10, 22); return {x: b.x + fw, y: b.y + fw, w: b.w - fw * 2, h: b.h - fw * 2}; };
  if (tall) {
    // the evidence row hangs where the analyst can reach it; the people stand under the board's left part
    const reachTop = floor + (SHOULDER.y - REACH * 0.78) * k;
    const evStart = clamp((ax0 + 80 * k - S.x) / S.w, 0.3, 0.55);
    let bh = S.h * cand.bb;
    for (let it = 0; it < 3; it++) {
      board = {x: S.x + 4, y: S.y, w: S.w - 8, h: bh};
      inner = innerOf(board);
      BL = boardLayout(inner, P, links, {evRange: [evStart, 1], cardScale: 0.9, claimText: cand.textH, evLabel: cand.evH, idW: cand.idW});
      const evTop = Math.min(...BL.evid.map(E => E.y));
      bh = clamp(bh + (reachTop + 14 - evTop), S.h * 0.3, S.h * 0.8);
    }
    board = {x: S.x + 4, y: S.y, w: S.w - 8, h: bh};
    inner = innerOf(board);
    BL = boardLayout(inner, P, links, {evRange: [evStart, 1], cardScale: 0.9, claimText: cand.textH, evLabel: cand.evH, idW: cand.idW});
  } else {
    const bx = S.x + S.w * cand.bx;
    board = {x: bx, y: S.y, w: S.x + S.w - bx - 4, h: (floor - S.y) * cand.bb};
    inner = innerOf(board);
    BL = boardLayout(inner, P, links, {evRange: [0, 1], cardScale: 1, claimText: cand.textH, evLabel: cand.evH, idW: cand.idW});
  }
  // table for the evidence that does not come from the witness
  const wIdx = P.evidence.findIndex(e => e.kind === 'witness');
  const tableItems = P.evidence.map((e, j) => j).filter(j => j !== wIdx);
  const slotW = BL.ew * 1.08 + BL.tw * 0.4;
  const tableW = Math.max(150 * k, tableItems.length * slotW + 40);
  const tableTop = floor - 150 * k;
  const tableX = tall ? S.x + S.w - tableW - 6 : Math.max(ax0 + 60 * k, board.x - tableW * 0.18);
  const table = {x: tableX, y: tableTop, w: tableW, h: 18};
  const lying = {};
  tableItems.forEach((j, q) => { lying[j] = {x: table.x + 20 + slotW * (q + 0.5) - BL.tw * 0.2, y: tableTop - 2 - (BL.eh * LIE) / 2}; });
  // magnifier: on the ledge (wide) or at the table's right end (tall)
  const magR = clamp(BL.ew * 0.24, 18, 34);
  const ledgeY = board.y + board.h;
  const mag = tall ? {x: table.x + table.w - magR * 2.6, y: tableTop - magR * 0.55, rot: -45, R: magR} : {x: board.x + board.w * 0.64, y: ledgeY - magR * 0.15, rot: -45, R: magR};
  return {k, floor, board, inner, BL, wx, ax0, wIdx, tableItems, table, lying, mag, tall, S, cand};
}

/* ---- choreography -------------------------------------------------- */

const shoulderAt = (M, ax, f) => ({x: ax + f * SHOULDER.x * M.k, y: M.floor + SHOULDER.y * M.k});
const restHand = (M, ax, f) => ({x: ax + f * 22 * M.k, y: M.floor - 156 * M.k});
const carryHand = (M, ax, f) => ({x: ax + f * (58 * M.k + M.BL.ew * 0.6), y: M.floor - 205 * M.k});

/** Standing x so that target t is comfortably within reach of the near hand (facing +1). */
function standFor(M, t) {
  const R = REACH * M.k * 0.86;
  const sy = M.floor + SHOULDER.y * M.k;
  const dy = Math.abs(t.y - sy);
  const dx = dy < R ? Math.sqrt(R * R - dy * dy) * 0.72 : 0;
  return t.x - SHOULDER.x * M.k - Math.max(28 * M.k, dx);
}

/** Whether target t is within comfortable reach of the near hand when standing at ax facing +1. */
function canReach(M, ax, t) {
  const sh = shoulderAt(M, ax, 1);
  return Math.hypot(t.x - sh.x, t.y - sh.y) < REACH * M.k * 0.9 && t.x > sh.x - 10 * M.k;
}

/**
 * Build the action script: keyed analyst x, turn, hand targets, witness hand and holder/thread state intervals.
 * Times are in "units" first, then normalised into ACT.
 */
function buildScript(M, P, links) {
  const BL = M.BL;
  const steps = [];
  const doPin = P.finalState !== 'pending';
  const doLink = P.finalState === 'linked';
  let ax = M.ax0;
  let f = M.wIdx >= 0 ? -1 : 1;
  const startF = f;
  const order = M.wIdx >= 0 ? [M.wIdx, ...M.tableItems] : M.tableItems.slice();
  const slotGrip = j => ({x: BL.evid[j].x + BL.ew / 2, y: BL.evid[j].y + BL.eh / 2});
  const walk = (to, carry) => {
    const d = Math.abs(to - ax);
    if (d < 2) return;
    steps.push({type: 'walk', from: ax, to, f, carry, dur: 0.25 + d / (420 * M.k)});
    ax = to;
  };
  if (doPin) {
    for (const j of order) {
      if (j === M.wIdx) {
        steps.push({type: 'handoff', j, ax, f, dur: 1.1});
        steps.push({type: 'turn', ax, carry: j, dur: 0.5});
        f = 1;
      } else {
        const lg = M.lying[j];
        walk(standFor(M, lg), null);
        steps.push({type: 'pick', j, ax, f, at: {...lg}, dur: 0.8});
      }
      walk(standFor(M, slotGrip(j)), j);
      steps.push({type: 'pin', j, ax, f, at: slotGrip(j), dur: 0.7});
      if (doLink) {
        for (const l of links.filter(q => q.e === j)) {
          const E = M.ends[l.n];
          if (canReach(M, ax, E.d) && canReach(M, ax, E.e)) {
            steps.push({type: 'link', l: l.n, ax, f, at: E.d, to: E.e, dur: 0.75});
            continue;
          }
          const mid = (standFor(M, E.d) + standFor(M, E.e)) / 2;
          if (canReach(M, mid, E.d) && canReach(M, mid, E.e)) {
            walk(mid, null);
            steps.push({type: 'link', l: l.n, ax, f, at: E.d, to: E.e, dur: 0.75});
            continue;
          }
          walk(standFor(M, E.d), null);
          steps.push({type: 'grab', l: l.n, ax, f, at: E.d, dur: 0.45});
          walk(standFor(M, E.e), {thread: l.n});
          steps.push({type: 'join', l: l.n, ax, f, at: E.e, dur: 0.5});
        }
      }
    }
    const finalX = M.tall ? M.ax0 : M.board.x - 78 * M.k;
    walk(finalX, null);
  }
  const total = steps.reduce((a, s) => a + s.dur, 0) || 1;
  let t = ACT[0];
  for (const s of steps) { s.u0 = t; t += (s.dur / total) * (ACT[1] - ACT[0]); s.u1 = t; }
  return {steps, startF, endAx: ax};
}

const E3 = ease.inOutCubic;

/** Every pose of the scene at time u (pure). */
function poseAt(L, u) {
  const {M, P, SC} = L;
  const BL = M.BL;
  const capU = lerp(ACT[0], ACT[1], clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const nE = P.evidence.length;
  // holder state per evidence card
  const cards = P.evidence.map((e, j) => (j === M.wIdx ? {holder: 'witness'} : {holder: 'table'}));
  const threads = L.links.map(() => ({state: 'loose'}));
  let ax = M.ax0, f = SC.startF, sx = 1, bob = 0;
  let hand = null; // analyst near hand target (world, pre-turn)
  let handW = null; // witness near hand target
  let held = null; // {card j} or {thread n}
  let phase = 'rest';
  const wChest = {x: M.wx + 56 * M.k + BL.ew * 0.6, y: M.floor - 205 * M.k};
  const wRest = restHand(M, M.wx, 1);
  const handoffPt = {x: (M.wx + M.ax0) / 2 + (M.wx < M.ax0 ? 0 : 0), y: M.floor - 225 * M.k};
  if (M.wIdx >= 0) handW = wChest;
  for (const s of SC.steps) {
    if (ua < s.u0) break;
    const t = clamp((ua - s.u0) / (s.u1 - s.u0));
    const done = ua >= s.u1;
    if (s.type === 'walk') {
      ax = lerp(s.from, s.to, E3(t));
      f = s.f;
      bob = done ? 0 : Math.abs(Math.sin(t * Math.PI * Math.max(2, Math.round(Math.abs(s.to - s.from) / (70 * M.k))))) * 5 * M.k;
      hand = s.carry != null ? carryHand(M, ax, f) : restHand(M, ax, f);
      held = s.carry == null ? null : typeof s.carry === 'number' ? {card: s.carry} : {thread: s.carry.thread};
      phase = done ? phase : 'walk';
    } else if (s.type === 'handoff') {
      ax = s.ax; f = s.f;
      const rest = restHand(M, ax, f);
      // 0–0.42 both hands to the shared point; 0.42–0.55 grasp; 0.55–1 analyst brings it in, witness lowers her hand
      if (t < 0.42) {
        const k1 = E3(t / 0.42);
        hand = mixP(rest, handoffPt, k1);
        handW = mixP(wChest, handoffPt, k1);
        held = null;
      } else if (t < 0.55) {
        hand = handoffPt; handW = handoffPt;
        held = null;
      } else {
        const k2 = E3((t - 0.55) / 0.45);
        hand = mixP(handoffPt, carryHand(M, ax, f), k2);
        handW = mixP(handoffPt, wRest, k2);
        held = {card: s.j};
      }
      cards[s.j].holder = t < 0.5 ? 'witness' : 'analyst';
      if (done) handW = wRest;
      phase = done ? phase : 'handoff';
    } else if (s.type === 'turn') {
      ax = s.ax;
      const kt = E3(t);
      sx = Math.max(0.06, Math.abs(1 - 2 * kt));
      f = kt < 0.5 ? -1 : 1;
      if (done) { sx = 1; f = 1; }
      // the card is drawn in to the chest while turning, then held out again
      const near = 1 - Math.abs(1 - 2 * kt);
      hand = mixP(carryHand(M, ax, f), {x: ax + f * 34 * M.k, y: M.floor - 215 * M.k}, done ? 0 : near);
      held = {card: s.carry};
      handW = wRest;
      phase = done ? phase : 'turn';
    } else if (s.type === 'pick') {
      ax = s.ax; f = s.f;
      const rest = restHand(M, ax, f);
      if (t < 0.45) { hand = mixP(rest, s.at, E3(t / 0.45)); held = null; cards[s.j].holder = 'table'; }
      else if (t < 0.55) { hand = s.at; held = {card: s.j}; cards[s.j].holder = 'analyst'; cards[s.j].lift = 0; }
      else { const k3 = E3((t - 0.55) / 0.45); hand = mixP(s.at, carryHand(M, ax, f), k3); held = {card: s.j}; cards[s.j].holder = 'analyst'; cards[s.j].lift = k3; }
      phase = done ? phase : 'pick';
    } else if (s.type === 'pin') {
      ax = s.ax; f = s.f;
      if (t < 0.55) { hand = mixP(carryHand(M, ax, f), s.at, E3(t / 0.55)); held = {card: s.j}; cards[s.j].holder = 'analyst'; }
      else if (t < 0.72) { hand = s.at; held = {card: s.j}; cards[s.j].holder = 'analyst'; cards[s.j].pin = seg(t, 0.58, 0.7); }
      else { hand = mixP(s.at, restHand(M, ax, f), E3((t - 0.72) / 0.28)); held = null; cards[s.j].holder = 'board'; cards[s.j].pin = 1; }
      if (done) { cards[s.j].holder = 'board'; cards[s.j].pin = 1; hand = restHand(M, ax, f); held = null; }
      phase = done ? phase : 'pin';
    } else if (s.type === 'link') {
      ax = s.ax; f = s.f;
      if (t < 0.36) { hand = mixP(restHand(M, ax, f), s.at, E3(t / 0.36)); held = null; }
      else if (t < 0.44) { hand = s.at; held = {thread: s.l}; threads[s.l].state = 'held'; }
      else if (t < 0.78) { hand = mixP(s.at, s.to, E3((t - 0.44) / 0.34)); held = {thread: s.l}; threads[s.l].state = 'held'; }
      else if (t < 0.86) { hand = s.to; held = {thread: s.l}; threads[s.l].state = 'held'; }
      else { hand = mixP(s.to, restHand(M, ax, f), E3((t - 0.86) / 0.14)); held = null; threads[s.l].state = 'joined'; }
      if (done) { hand = restHand(M, ax, f); held = null; threads[s.l].state = 'joined'; }
      phase = done ? phase : 'link';
    } else if (s.type === 'grab') {
      ax = s.ax; f = s.f;
      if (t < 0.7) { hand = mixP(restHand(M, ax, f), s.at, E3(t / 0.7)); held = null; }
      else { hand = mixP(s.at, carryHand(M, ax, f), E3((t - 0.7) / 0.3)); held = {thread: s.l}; threads[s.l].state = 'held'; }
      if (done) { hand = carryHand(M, ax, f); held = {thread: s.l}; threads[s.l].state = 'held'; }
      phase = done ? phase : 'grab';
    } else if (s.type === 'join') {
      ax = s.ax; f = s.f;
      if (t < 0.6) { hand = mixP(carryHand(M, ax, f), s.at, E3(t / 0.6)); held = {thread: s.l}; threads[s.l].state = 'held'; }
      else if (t < 0.72) { hand = s.at; held = {thread: s.l}; threads[s.l].state = 'held'; }
      else { hand = mixP(s.at, restHand(M, ax, f), E3((t - 0.72) / 0.28)); held = null; threads[s.l].state = 'joined'; }
      if (done) { hand = restHand(M, ax, f); held = null; threads[s.l].state = 'joined'; }
      phase = done ? phase : 'join';
    }
    if (done && s.type === 'walk') { hand = s.carry != null ? carryHand(M, ax, f) : restHand(M, ax, f); }
  }
  if (!hand) hand = restHand(M, ax, f);
  if (!handW) handW = wRest;
  // the analyst's hand in the world (after the turn squash)
  const toWorld = p => ({x: ax + (p.x - ax) * sx, y: p.y});
  // posture
  const lean = phase === 'walk' ? 3 : 0;
  return {ax, f, sx, bob, lean, hand, handW, handWorld: toWorld(hand), held, cards, threads, phase, capped: P.actionProgress < 1 && u > capU, nE};
}

const mixP = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

/* ---- composition --------------------------------------------------- */

function legendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  let stage, panel = null, PL = null;
  if (!rows.length) stage = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const colW = (DW - 8 - (opt.cols - 1) * F * 1.2) / opt.cols;
    PL = legendColumns(ctx, rows, colW, F, opt.cols);
    stage = {x: 0, y: 0, w: DW, h: DH - PL.h - gap};
    panel = {x: 4, y: DH - PL.h};
  } else {
    const PW = DW * opt.pw;
    PL = legendColumns(ctx, rows, PW, F, 1);
    PL.ok = PL.ok && PL.h <= DH;
    stage = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
  }
  return {stage, panel, PL};
}

function compose(ctx, P, links, LG, F, cand, md) {
  const cot = md.cot;
  const {stage, panel, PL} = LG;
  const problems = [];
  if (PL && !PL.ok) problems.push('panel-text');
  if (stage.h < 300 || stage.w < 300) return {problems: ['stage-small'], ok: false, score: 0};
  const asp = stage.w / stage.h;
  if ((cand.arr === 'tall') !== (asp < 1.05)) return {problems: ['arrangement'], ok: false};
  const key = ctx.show('key');
  const M = stageModel(ctx, P, links, stage, {...cand, textH: key && cot ? claimTextH(P, F) : null, evH: key && md.evb ? evLabelH(P, F) : null, idW: key ? Math.max(...P.evidence.map(e => fitG(e.id, {maxWidth: 999, size: 20, weight: 800, maxLines: 1}).width)) : 0});
  return {F, stage, panel, PL, M, problems, ok: problems.length === 0, cot};
}

/** Thread end points, dangle points and reach checks for a stage model. */
function finishModel(ctx, P, links, M) {
  const BL = M.BL;
  const sy = M.floor + SHOULDER.y * M.k;
  const reachTop = sy - REACH * M.k * 0.8;
  M.ends = BL.ends.map((E, n) => {
    const dy = Math.max(E.c.y + 36, Math.min(E.e.y - 24, Math.max(reachTop + 6, E.c.y + (E.e.y - E.c.y) * 0.55)));
    const d = {x: E.c.x + (E.e.x - E.c.x) * 0.18, y: dy};
    return {c: E.c, e: E.e, d};
  });
  const problems = [];
  const cBot = Math.max(...BL.claims.map(C => C.y + C.h)), eTop = Math.min(...BL.evid.map(E => E.y));
  if (eTop - cBot < Math.max(50, BL.eh * 0.45)) problems.push('board-fit');
  // the analyst's head stays below the claim cards while working at the board (claim text never covered)
  if (!M.tall && M.floor - 418 * M.k < cBot + 8) problems.push('head-over-claims');
  // reach: dangle ends and pin targets must be reachable from some standing place
  const R = REACH * M.k * 0.95;
  const okT = t => Math.abs(t.y - sy) < R;
  for (const E of M.ends) if (!okT(E.d) || !okT(E.e)) problems.push('reach');
  for (const E of BL.evid) if (!okT({x: 0, y: E.y + BL.eh / 2})) problems.push('reach');
  // the board must not run below the table top / people stay inside the stage
  if (M.tall && M.board.y + M.board.h > M.table.y - 20) problems.push('table');
  // head room: the witness's head must not cover an evidence slot on tall frames
  const headTop = M.floor - 410 * M.k;
  if (M.tall && BL.evid.some(E => E.x < M.wx + 60 * M.k && E.y + BL.eh > headTop)) problems.push('witness-head');
  return [...new Set(problems)];
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const links = resolveLinks(P);
    const looks = P.evidence.map((e, j) => actorLook(ctx, null, 2 + j));
    const actorLooks = [actorLook(ctx, null, 0), actorLook(ctx, null, 1)];
    const compact = ctx.view.shape === 'square';
    const MODES = [{cot: true, evb: true}, {cot: true, evb: false}, {cot: false, evb: false}];
    const rowsBy = MODES.map(md => legendRows(ctx, P, links, looks, actorLooks, !md.cot, compact, !md.evb));
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}, {mode: 'below', cols: 3}]
      : shape === 'square' ? [{mode: 'below', cols: 2}, {mode: 'below', cols: 3}, {mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.4}]
        : [{mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.32}, {mode: 'side', pw: 0.36}];
    const tallC = [{arr: 'tall', kf: 0.36, bb: 0.6}, {arr: 'tall', kf: 0.4, bb: 0.62}, {arr: 'tall', kf: 0.44, bb: 0.64}, {arr: 'tall', kf: 0.32, bb: 0.6}];
    const wideC = [];
    for (const kf of [0.5, 0.58, 0.64, 0.7, 0.78]) for (const bb of [0.62, 0.7, 0.8]) for (const bx of [0.28, 0.34, 0.38]) wideC.push({arr: 'wide', kf, bb, bx});
    const cands = [...tallC, ...wideC];
    let C = null, best = null, bestScore = -1;
    let firstOk = -1;
    for (const [si, F] of SIZES.entries()) {
      if (firstOk >= 0 && si > firstOk + 1) break;
      for (const [mi, md] of MODES.entries()) for (const opt of opts) {
        const cot = md.cot;
        const LG = legendFor(ctx, rowsBy[mi], F, opt);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const cand of cands) {
          const c = compose(ctx, P, links, LG, F, cand, md);
          if (!c.M) { if (!C) C = c; continue; }
          const ids = idFits(P, c.M.BL, 1, ctx.show('key') && cot ? F : null);
          const extra = finishModel(ctx, P, links, c.M);
          if (!ids.ok && ctx.show('key')) extra.push('id-text');
          c.problems.push(...extra);
          c.ok = c.problems.length === 0;
          c.ids = ids;
          const score = Math.pow(c.M.k, 0.7) * Math.pow(Math.min(c.M.BL.ew, 125), 0.6) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * (md.cot ? 1.1 : 1) * (md.evb ? 1.1 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = si;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || !C.M || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    const M = C.M;
    const witness = personRig(ctx, {name: 'wit', look: actorLooks[0]});
    const analyst = personRig(ctx, {name: 'an', look: actorLooks[1]});
    const SC = buildScript(M, P, links);
    const L = {P, links, C, M, SC, looks, actorLooks, witness, analyst};
    // rings around the final positions of the note targets
    const notes = noteColors(ctx.theme);
    const pad = 10;
    const tgt = name => {
      if (name === 'board') return {x: M.board.x - pad, y: M.board.y - pad, w: M.board.w + pad * 2, h: M.board.h + pad * 2};
      if (name === 'witness') return {x: M.wx - 60 * M.k, y: M.floor - 430 * M.k, w: 130 * M.k, h: 430 * M.k + 4};
      if (name === 'magnifier') { const b = magnifierBox(M.mag.x, M.mag.y, M.mag.R); return {x: b.x - pad, y: b.y - pad, w: b.w + pad, h: b.h * 0.7 + pad}; }
      const pts = M.ends.flatMap(E => [E.c, E.e]);
      const b = unionBox(pts.map(p => ({x: p.x, y: p.y, w: 1, h: 1})));
      return {x: b.x - pad * 2, y: b.y + 4, w: b.w + pad * 4, h: Math.max(30, b.h - 8)};
    };
    L.rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return L;
  },
  build(ctx, L) {
    const {C, M, P} = L;
    const BL = M.BL;
    const board = boardNode(ctx, {prefix: 'bd', x: M.board.x, y: M.board.y, w: M.board.w, h: M.board.h, floorY: M.tall ? null : M.floor});
    const cards = cardNodes(ctx, BL, P, {prefix: 'cd', ids: C.ids, looks: L.looks, pinOpacity: 0});
    const tw = 4.5;
    const threads = L.links.map(l => threadNode(`th${l.n}`, l.kind, tw));
    const T0 = M.table;
    const table = g({name: 'table'},
      h('path', {d: `M${r(T0.x + 16)} ${r(T0.y + T0.h)}L${r(T0.x + 10)} ${r(M.floor)}M${r(T0.x + T0.w - 16)} ${r(T0.y + T0.h)}L${r(T0.x + T0.w - 10)} ${r(M.floor)}`, stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(T0.x + 16)} ${r(T0.y + T0.h)}L${r(T0.x + 10)} ${r(M.floor)}M${r(T0.x + T0.w - 16)} ${r(T0.y + T0.h)}L${r(T0.x + T0.w - 10)} ${r(M.floor)}`, stroke: FRAME, 'stroke-width': 5, 'stroke-linecap': 'round'}),
      h('path', {d: roundRectPath(T0.x, T0.y, T0.w, T0.h, 5), fill: '#a77d55', stroke: INK, 'stroke-width': 2.4}),
      h('ellipse', {cx: r(T0.x + T0.w / 2), cy: r(M.floor), rx: r(T0.w * 0.5), ry: 6, fill: '#000', opacity: 0.1}),
    );
    const floorLine = h('path', {d: `M${r(M.S.x)} ${r(M.floor + 2)}H${r(M.S.x + M.S.w)}`, stroke: ctx.theme.fgSoft, 'stroke-width': 2, opacity: 0.35});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, panelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      floorLine,
      board.back,
      slotNodes(BL, 'slots'),
      slotLabelNodes(ctx, BL, C.ids, 'slot-labels'),
      cards.claims,
      table,
      g({transform: T(M.mag.x, M.mag.y, M.mag.rot)}, magnifierArt(M.mag.R, 'mag')),
      cards.evid,
      threads,
      g({name: 'wit-wrap'}, L.witness.node),
      g({name: 'an-wrap'}, L.analyst.node),
      g({name: 'rings', opacity: 0}, L.rings),
      panels,
    );
  },
  frame(ctx, L, u) {
    const {M, P} = L;
    const BL = M.BL;
    const s = poseAt(L, u);
    const nodes = {};
    // people
    const pw = L.witness.frame({x: M.wx, y: M.floor, facing: 1, scale: M.k, near: s.handW, far: null});
    Object.assign(nodes, pw.nodes);
    const pa = L.analyst.frame({x: s.ax, y: M.floor - s.bob, facing: s.f, scale: M.k, near: s.hand, far: null, lean: s.lean * s.f});
    Object.assign(nodes, pa.nodes);
    nodes['an-wrap'] = {transform: s.sx === 1 ? '' : `translate(${r(s.ax)} 0) scale(${r(s.sx, 4)} 1) translate(${r(-s.ax)} 0)`};
    const wHand = pw.hands.near, aHandPre = pa.hands.near;
    const aHand = {x: s.ax + (aHandPre.x - s.ax) * s.sx, y: aHandPre.y};
    // cards
    const grips = [];
    P.evidence.forEach((e, j) => {
      const cs = s.cards[j];
      let G, sy = 1, sxc = 1;
      if (cs.holder === 'witness') G = wHand;
      else if (cs.holder === 'analyst') { G = aHand; sy = cs.lift != null ? lerp(LIE, 1, cs.lift) : 1; sxc = s.sx; }
      else if (cs.holder === 'board') G = {x: BL.evid[j].x + BL.ew / 2, y: BL.evid[j].y + BL.eh / 2};
      else { G = M.lying[j]; sy = LIE; }
      grips.push(G);
      nodes[`cd-e${j}`] = {transform: `translate(${r(G.x - (BL.ew / 2) * sxc)} ${r(G.y - (BL.eh / 2) * sy)}) scale(${r(sxc, 4)} ${r(sy, 4)})`};
      if (L.C.ids && ctx.show('key')) nodes[`cd-e${j}-id`] = {opacity: sy > 0.92 && sxc > 0.92 ? 1 : 0};
      nodes[`cd-e${j}-pin`] = {opacity: r(cs.holder === 'board' ? 1 : cs.pin ?? 0, 3)};
    });
    // threads
    const tEnds = [];
    L.links.forEach(l => {
      const E = M.ends[l.n];
      const st = s.threads[l.n].state;
      let end, sag;
      if (st === 'loose') { end = E.d; nodes[`th${l.n}`] = {d: `M${r(E.c.x)} ${r(E.c.y)}Q${r(E.c.x + 22)} ${r((E.c.y + E.d.y) / 2)} ${r(E.d.x)} ${r(E.d.y)}`}; tEnds.push(E.d); return; }
      if (st === 'held') { end = aHand; sag = clamp(Math.hypot(end.x - E.c.x, end.y - E.c.y) * 0.06, 4, 30); }
      else { end = E.e; sag = 3; }
      nodes[`th${l.n}`] = {d: threadD(E.c, end, sag)};
      tEnds.push(end);
    });
    const done = P.actionProgress >= 1;
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (L.C.PL) for (const col of L.C.PL.cols) for (const row of col.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const heldGrip = s.held && s.held.card != null ? R2(grips[s.held.card]) : null;
    const heldThread = s.held && s.held.thread != null ? R2(tEnds[L.links.findIndex(l => l.n === s.held.thread)]) : null;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = {
      beat, phase: s.phase,
      handA: R2(aHand), handW: R2(wHand), heldGrip, heldThread, held: s.held ? (s.held.card != null ? `card${s.held.card}` : `thread${s.held.thread}`) : null,
      holders: s.cards.map(c => c.holder), threads: s.threads.map(t => t.state),
      linkKinds: L.links.map(l => l.kind), turnSx: r(s.sx, 3), facing: s.f,
      allReached: pa.reached && pw.reached,
      finalState: P.finalState, actionCapped: s.capped, problems: L.C.problems, textPx: r(L.C.F, 1), k: r(M.k, 3), ew: r(BL.ew, 1),
      board: {x: r(M.board.x), y: r(M.board.y), w: r(M.board.w), h: r(M.board.h)},
      ends: M.ends.map(E => ({c: R2(E.c), e: R2(E.e)})), threadEnds: tEnds.map(R2),
      mag: magnifierBox(M.mag.x, M.mag.y, M.mag.R),
      cards: BL.evid.map(E => evidenceBox(BL, E.x, E.y)),
    };
    for (let j = 0; j < 3; j++) sem[`ev${j}`] = j < grips.length ? R2(grips[j]) : {x: 0, y: 0};
    for (let n = 0; n < 4; n++) sem[`te${n}`] = n < tEnds.length ? R2(tEnds[n]) : {x: 0, y: 0};
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'evidence-analysis-01-story',
    title: 'Proposition map — a witness hands over her statement card; an analyst pins each labelled piece of evidence on a board and ties its threads to the claims it is said to support',
    titleEs: 'Mapa de proposiciones — Microescena con objetos y actores',
    category: 'evidence-analysis',
    categoryName: 'Análisis y presentación de pruebas',
    motif: 'Mapa de proposiciones',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Front view: a witness holds her statement card, an analyst stands beside her and a proposition board on an easel carries the claim cards along its top, an empty slot for each piece of evidence below and one loose thread per supplied link hanging from the claim cards. The witness hands the card over at a shared point; the analyst turns, pins it in its slot and carries each thread\'s loose end down to the card\'s eyelet; the other labelled evidence is lifted from a table, pinned and joined the same way. Solid threads are links supplied as direct support, dashed threads links supplied as a disputed inference. No weighing of evidence, no credibility judgement, no proof standard; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'analysis', 'proposition map', 'claims', 'witness', 'document', 'links', 'disputed inference', 'direct support', 'board', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-analysis/kits/analysis-art.js', 'src/animations/evidence-analysis/kits/mapa-proposiciones.js', 'src/primitives/person.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
