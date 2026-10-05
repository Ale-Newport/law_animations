/**
 * LAW-0309 — Pausa de audiencia · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the participants the counterpart, the clocks the support, the
 * exhibits on the cabinet the evidence):
 *  0.00–0.15  rest, session active: the session clock on the panel along the top
 *             wall runs (its plate ● "session active", as supplied); the wall
 *             clock runs; the operator stands at the lectern beside the panel;
 *             the others sit at the shared table (same chairs, no hierarchy).
 *  0.15–0.42  the action starts: the operator raises a hand towards the panel
 *             (the cause); the session clock's hands slow down and stop at the
 *             supplied (fictional) time; a neutral pause badge ‖ and ring appear
 *             on its bezel. The wall clock keeps running: the paused clock does
 *             not read as broken.
 *  0.42–0.73  the operator raises the hand again and the recess card comes out
 *             of it to its place (a small copy of the stopped dial and a ‖,
 *             never text); a connector draws from the session clock to the card,
 *             and the caption (◆ recess, as supplied) arrives; a floor ring marks
 *             every participant's position — nobody moves.
 *  0.73–1.00  hold: the paused session clock and the recess card on the panel,
 *             the kept positions; notes, state tag and the key "as supplied · no
 *             conclusion drawn". No rule on recesses, no duration, no time limit,
 *             no consequence; the recess is not a problem or an end.
 * @module animations/hearings/LAW-0309
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, speakerChipNode, R2, searchLayout, centreShiftY} from './kits/apertura-audiencia.js';
import {pzFields, PZ_EN, PZ_ES, resolvePz, pzRows, pzRowNode, pzRoom, pzTiming, pzStageAt, composePz, cardBox} from './kits/pausa-audiencia.js';

const ID = 'LAW-0309';
// (the clocks that keep running — the wall clock, a session that stays active — come to rest at CLOCK_END: the last
// frames are a still hold)
const CLOCK_END = 0.94;
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {action: [0.16, 0.72], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['panel', 'session-clock', 'recess-card', 'cabinet', 'clock'];

const STRINGS = {
  en: {both: 'Session time paused; every position kept (as supplied)', one: 'Session active; the session clock runs (as supplied)'},
  es: {both: 'Tiempo de sesión en pausa; posiciones conservadas (aportado)', one: 'Sesión activa; el reloj de sesión avanza (aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {board: 'Session panel with two places', lectern: 'Lectern beside the panel', cabinet: 'Exhibit cabinet', clock: 'Wall clock (support)'},
  annotations: [{target: 'session-clock', text: 'The session clock stops at the supplied time; the wall clock runs on'}],
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {board: 'Panel de sesión con dos lugares', lectern: 'Atril junto al panel', cabinet: 'Armario de pruebas', clock: 'Reloj de pared (soporte)'},
  annotations: [{target: 'session-clock', text: 'El reloj de sesión se detiene en el momento aportado; el de pared sigue'}],
};
const EN = {...PZ_EN, ...OWN_EN};
const ES = {...PZ_ES, ...OWN_ES};

const sceneSchema = {
  ...pzFields,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    board: str('Caption for the session panel', 60),
    lectern: str('Caption for the lectern', 60),
    cabinet: str('Caption for the exhibit cabinet', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['board', 'lectern', 'cabinet', 'clock']),
  actionProgress: num('How far the action is allowed to progress (1 = the session clock paused, the recess card in place and the positions marked; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['recess', 'session-active']),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'recess'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolvePz(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const withDetail = P.finalState !== 'session-active';
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) {
      rows.push(...pzRows(R, P, 'lg', {noDetail: !withDetail}));
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'board', text: P.objectLabels.board, name: 'lg-board'});
      rows.push({kind: 'legend', glyphKind: 'card', text: P.objectLabels.lectern, name: 'lg-lectern'});
      rows.push({kind: 'legend', glyphKind: 'exhibit', text: P.objectLabels.cabinet, name: 'lg-cabinet'});
      rows.push({kind: 'legend', glyphKind: 'clock', text: P.objectLabels.clock, name: 'lg-clock'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
    }
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
    if (showKey) rows.push({kind: 'state', text: withDetail ? ctx.t.both : ctx.t.one, name: 'state-tag'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    // standing floors (hearings measure the FIGURE): >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — only
    // when nothing composes at 1:1 does the stress floor of 45 px apply
    const search = minPersonPx => searchLayout(ctx, P, R, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4],
      compose: (box, F, scale) => composePz(ctx, P, R, box, F, {scale, chips: showKey, text: showKey}),
    });
    let best = search(ctx.view.shape === 'square' ? 55.5 : 61);
    if (best.problems.length && ctx.view.shape === 'square') best = search(45);
    const {F, C, lay} = best;
    const G = C.G;
    const room = pzRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, tagFit: G.tagFit, capFit: G.capFit, noDetail: !withDetail, pins: withDetail});
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      if (name === 'panel') return {x: G.board.x - mg, y: G.board.y - 4, w: G.board.w + 2 * mg, h: G.board.h + mg};
      const around = (a0, b0) => { const x0 = Math.min(a0.x, b0.x), x1 = Math.max(a0.x + a0.w, b0.x + b0.w); return {x: x0 - mg * 0.8, y: a0.y - mg * 0.8, w: x1 - x0 + mg * 1.6, h: b0.y + b0.h - a0.y + mg * 1.6}; };
      if (name === 'session-clock') return around(G.page, G.tagBox);
      if (name === 'recess-card') return around(cardBox(G), G.capBox);
      if (name === 'clock') return {x: G.clock.cx - G.clock.R - 8, y: G.clock.cy - G.clock.R - 8, w: 2 * G.clock.R + 16, h: 2 * G.clock.R + 16, round: true};
      return G.cab ? {x: G.cab.x - 8, y: G.cab.y - 8, w: G.cab.w + 16, h: G.cab.h + 16} : {x: G.lectern.cx - 42, y: G.lectern.cy - 32, w: 84, h: 64};
    };
    const rings = showAll ? P.annotations.map((a, i) => {
      const b = tgt(a.target === 'recess-card' && !withDetail ? 'session-clock' : a.target);
      const col = noteColors[i % 2];
      return b.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)});
    }) : [];
    const TM = pzTiming(W.action[0], W.action[1]);
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, withDetail, TM, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => pzRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      C.chips.map((ch, i) => (ch ? speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`}) : null)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G, TM} = L;
    const nodes = {};
    const cap = lerp(TM.point[0], TM.t1, clamp(P.actionProgress));
    const ua = P.actionProgress >= 1 ? u : Math.min(u, cap);
    const st = pzStageAt(G, R, TM, ua, {noDetail: !L.withDetail});
    // (a session that stays active keeps running to the end; a capped action keeps the clock where the cap froze it)
    const run = !L.withDetail ? pzStageAt(G, R, TM, Math.min(u, CLOCK_END), {noDetail: true}).run : st.run;
    const rf = L.room.frame({clockDeg: 48 * Math.min(u, CLOCK_END), run, tag: 1, pause: st.pause, zoom: st.zoom, link: st.link, cap: st.cap, pins: st.pins, reach: st.reach});
    Object.assign(nodes, rf.nodes);
    C.chips.forEach((ch, i) => { if (ch) nodes[`lab${i}`] = {opacity: 1}; });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        beat,
        clockState: !L.withDetail ? 'running' : st.clockState,
        run: r(run, 4),
        minuteDeg: r(rf.minDeg, 2),
        wallDeg: r(48 * Math.min(u, CLOCK_END), 2),
        pause: r(st.pause, 3),
        card: r(st.zoom, 3),
        link: r(st.link, 3),
        cardState: st.cardState,
        caption: r(st.cap, 3),
        pins: r(st.pins, 3),
        gesture: r(st.gesture, 3),
        hand: rf.hands[R.presenter] ? R2(C.toD(rf.hands[R.presenter])) : null,
        signalling: r(st.k, 3),
        positions: R.speakers.map(sp => R2(C.toD(G.seats[sp.index]))),
        cardAt: R2(C.toD({x: G.zone.x, y: G.zone.y})),
        clockAt: R2(C.toD({x: G.page.x, y: G.page.y})),
        stop: `${R.stop.hour}:${String(R.stop.minute).padStart(2, '0')}`,
        order: R.order.join('>'),
        boardLeft: G.left,
        ops: R.items.map(it => it.op),
        roles: {operator: R.presenter, listeners: R.listeners},
        activeI: R.docI,
        recessI: R.detI,
        allReached: rf.reached,
        finalState: P.finalState,
        actionCapped: P.actionProgress < 1 && u > cap,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(100 * C.k * L.px, 1),
        roomBox: {x: r(L.roomBox.x), y: r(L.roomBox.y), w: r(L.roomBox.w), h: r(L.roomBox.h)},
        cols: L.cols,
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
    slug: 'hearings-08-story',
    title: 'Hearing pause — the session clock stops while everybody keeps their place',
    titleEs: 'Pausa de audiencia — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Pausa de audiencia',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. The session clock on the panel runs (● session active, as supplied); the operator at the lectern raises a hand towards the panel and the session clock\'s hands slow down and stop at the supplied, fictional time, with a neutral pause badge — the wall clock keeps running. The recess card comes out of the operator\'s hand to its place (a small copy of the stopped dial and a pause sign), a connector links it to the session clock and its caption arrives (◆ recess, as supplied); a floor ring marks every participant\'s position: nobody moves. Illustrative; no rule on recesses, duration, time limit or consequence is shown.',
    tags: ['hearing', 'recess', 'pause', 'session clock', 'session time', 'positions kept', 'wall clock', 'as supplied', 'cabinet', 'floor plan', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/pausa-audiencia.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
