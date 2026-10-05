/**
 * LAW-0281 — Apertura de audiencia · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the participants around one shared oval table, the wall clock
 * as support, an exhibit on the cabinet):
 *  0.00–0.15  rest: the room with its lights off (a neutral blue-grey tint),
 *             the wall display showing the supplied PENDING state (◆, dashed
 *             frame), the switch at ◆, blank name cards in the tray in the
 *             middle of the table, each participant seated with their hands
 *             on the table; the exhibit tag and the legend are readable.
 *  0.15–0.42  the room is activated: the switch moves ◆ → ●, a pulse runs
 *             along the power line in the walls, the lamps come on one by
 *             one, then the display changes to the supplied STARTED state
 *             (● solid frame; the old text leaves before the new one comes).
 *             The first card slides out of the tray; its participant reaches
 *             out and takes it at the hand-over point.
 *  0.42–0.73  in the configured sequence each participant takes their card,
 *             carries it to their place and sets it upright; their supplied
 *             label arrives beside them (body first, then its text), with the
 *             order disc of the configured sequence. Cause precedes effect.
 *  0.73–1.00  hold: the supplied final state (everyone has their label, or
 *             the last card still waits in the tray), notes, state tag and
 *             the key "as supplied · no conclusion drawn". No formula, no
 *             ritual wording, no hierarchy, no speaking order, no outcome.
 * @module animations/hearings/LAW-0281
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {
  aperturaFields, APERTURA_EN, APERTURA_ES, localised, resolveApertura, pxPerUnit, composeRoom, hearingRoom, cardAt,
  speakerChipNode, exhibitChipNode, rowNode, R2, searchLayout,
  centreShiftY,
} from './kits/apertura-audiencia.js';
import {toWorld} from './kits/hearings-art.js';

const ID = 'LAW-0281';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  switch: [0.155, 0.19], pulse: [0.18, 0.27], lamps: [0.21, 0.31], pendOut: [0.27, 0.29], frame: [0.285, 0.31], startIn: [0.3, 0.325],
  cards: [0.33, 0.7], notes: [0.75, 0.8], state: [0.76, 0.81],
};
const CARD_WIN = 0.15;
const TARGETS = ['display', 'switch', 'tray', 'clock', 'exhibit', 'firstCard', 'lastCard'];

const STRINGS = {
  en: {allReceived: 'Every participant has received their label (as supplied)', lastWaiting: 'The last card is still in the tray (as supplied)'},
  es: {allReceived: 'Cada participante ha recibido su etiqueta (según lo aportado)', lastWaiting: 'La última tarjeta sigue en la bandeja (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {lights: 'Room lights', card: 'Name card with the supplied label', clock: 'Wall clock'},
  annotations: [{target: 'switch', text: 'The switch activates the room (as configured)'}],
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {lights: 'Luces de la sala', card: 'Tarjeta con la etiqueta aportada', clock: 'Reloj de pared'},
  annotations: [{target: 'switch', text: 'El interruptor activa la sala (según la configuración)'}],
};
const EN = {...APERTURA_EN, ...OWN_EN};
const ES = {...APERTURA_ES, ...OWN_ES};

const sceneSchema = {
  ...aperturaFields,
  actorLabels: obj('Caption of the person glyph in the legend', {
    participant: str('Caption for the people drawn from above', 50),
  }, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    lights: str('Caption for the wall lamps', 60),
    card: str('Caption for the name cards', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['lights', 'card', 'clock']),
  actionProgress: num('How far the opening is allowed to progress (1 = every card handed over; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['all-received', 'last-waiting']),
};

const defaultParams = {
  ...EN,
  actionProgress: 1,
  finalState: 'all-received',
};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveApertura(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const finalWaiting = P.finalState === 'last-waiting' ? R.order[R.order.length - 1] : -1;
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rowsFor = () => {
      const rows = [];
      if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      if (showAll) {
        rows.push({kind: 'legend', glyphKind: 'pending', text: P.session.pending, name: 'lg-pending'});
        rows.push({kind: 'legend', glyphKind: 'started', text: P.session.started, name: 'lg-started'});
        rows.push({kind: 'legend', glyphKind: 'lamp', text: P.objectLabels.lights, name: 'lg-lights'});
        rows.push({kind: 'legend', glyphKind: 'card', text: P.objectLabels.card, name: 'lg-card'});
        rows.push({kind: 'legend', glyphKind: 'clock', text: P.objectLabels.clock, name: 'lg-clock'});
        rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
      }
      if (showKey) rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: '1', text: P.labels.sequence, name: 'lg-seq'});
      if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
      if (showKey) rows.push({kind: 'state', text: P.finalState === 'last-waiting' ? ctx.t.lastWaiting : ctx.t.allReceived, name: 'state-tag'});
      if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
      return rows;
    };
    const rows = rowsFor();
    const best = searchLayout(ctx, P, R, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4], minF: 16.4,
      roomOpts: {chips: showKey, exhibitChips: showKey, seqDisc: true},
    });
    const {F, C, lay} = best;
    const tr = {room: best.roomBox, panel: best.panelBox, cols: best.cols};
    const log = best.log;
    const room = hearingRoom(ctx, C.G, {prefix: 'rm', R, dispText: showKey ? {started: C.dt.started, pending: C.dt.pending} : null, glyphS: C.dt.gS});
    // note rings on their targets (design units)
    const G = C.G;
    // rings are drawn around their target (template units, inside the plan group): never over a head or a text
    const tgt = name => {
      const cardFor = idx => ({box: {x: -38, y: -24, w: 76, h: 48}, at: G.cards[idx].rest, deg: G.cards[idx].deg});
      if (name === 'display') return {box: {x: G.display.x - 8, y: G.display.y - 6, w: G.display.w + 16, h: G.display.h + 12}};
      if (name === 'switch') return {box: {x: G.sw.cx - G.sw.s / 2 - 8, y: G.sw.cy - G.sw.s * 0.23 - 6, w: G.sw.s + 16, h: G.sw.s * 0.46 + 12}};
      if (name === 'tray') return {box: {x: G.C.x - 60, y: G.C.y - 42, w: 120, h: 84}};
      if (name === 'clock') return {box: {x: G.clock.cx - G.clock.R - 8, y: G.clock.cy - G.clock.R - 8, w: 2 * G.clock.R + 16, h: 2 * G.clock.R + 16}, round: true};
      if (name === 'exhibit') return G.cab ? {box: {x: G.cab.x - 6, y: G.cab.y - 6, w: G.cab.w + 12, h: G.cab.h + 12}} : {box: {x: G.C.x - 60, y: G.C.y - 42, w: 120, h: 84}};
      if (name === 'firstCard') return cardFor(R.order[0]);
      return cardFor(R.order[R.order.length - 1]);
    };
    const rings = showAll ? P.annotations.map((a, i) => {
      const t = tgt(a.target);
      const col = noteColors[i % 2];
      const b = t.box;
      const shape = t.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)});
      return t.at ? g({transform: T(t.at.x, t.at.y, t.deg)}, shape) : shape;
    }) : [];
    const look = R.speakers[0].look;
    // the whole composition is centred vertically in the safe box (no empty band under a portrait room)
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box), ...C.exChips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, tr, rings, look, finalWaiting, log, problems: best.problems, showKey, dyC};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rowNode(ctx, m, {name: m.name, look: L.look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      C.exChips.map((L2, i) => exhibitChipNode(ctx, L2, {name: `exchip${i}`})),
      C.chips.map((ch, i) => (ch ? speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`}) : null)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G} = L;
    const nodes = {};
    const cap = lerp(W.switch[0], W.cards[1], clamp(P.actionProgress));
    const ua = P.actionProgress >= 1 ? u : Math.min(u, cap);
    const sw = seg(ua, ...W.switch);
    const pulseP = seg(ua, ...W.pulse);
    const lights = seg(ua, ...W.lamps);
    const started = seg(ua, ...W.frame);
    const pendOp = 1 - seg(ua, ...W.pendOut);
    const startOp = seg(ua, ...W.startIn);
    // cards: one window per participant, in the configured order
    const n = R.n;
    const span = W.cards[1] - W.cards[0] - CARD_WIN;
    const step = n > 1 ? span / (n - 1) : 0;
    const cardStates = [];
    const people = [];
    const sem = {cards: [], cardState: [], labels: [], held: []};
    for (let i = 0; i < n; i++) {
      const rank = R.rank[i];
      const s0 = W.cards[0] + rank * step;
      const waiting = i === L.finalWaiting;
      const q = waiting ? 0 : seg(ua, s0, s0 + CARD_WIN);
      const st = cardAt(G, i, q, ctx.reduced);
      cardStates[i] = st.card;
      people[i] = {seated: 1, reach: st.reach};
      const chipBody = waiting ? seg(u, W.notes[0], W.notes[0] + 0.02) : seg(ua, s0 + CARD_WIN * 0.8, s0 + CARD_WIN * 0.9);
      // the text rides with its chip (a blank chip is never shown on its own)
      const chipText = waiting ? seg(u, W.notes[0] + 0.002, W.notes[0] + 0.022) : seg(ua, s0 + CARD_WIN * 0.81, s0 + CARD_WIN * 0.91);
      if (C.chips[i]) {
        nodes[`lab${i}`] = {opacity: r(chipBody, 3)};
        nodes[`lab${i}-text`] = {opacity: r(chipText, 3)};
      }
      sem.cards.push(R2(C.toD(st.card)));
      sem[`card${i}`] = R2(C.toD(st.card));
      sem[`grip${i}`] = R2(C.toD(toWorld({x: st.card.x, y: st.card.y, deg: G.cards[i].deg}, {x: 14, y: 10})));
      sem.cardState.push(st.state);
      sem.labels.push(r(C.chips[i] ? chipText : (q >= 1 ? 1 : 0), 3));
      sem.held.push(st.held);
    }
    const rf = L.room.frame({
      lights, switchK: sw, started, text: {started: startOp, pending: pendOp},
      pulse: pulseP > 0 && pulseP < 1 ? pulseP : null, pulseOp: 1,
      clockDeg: 36 * clamp(u / 0.8), cards: cardStates, people,
    });
    Object.assign(nodes, rf.nodes);
    rf.hands.forEach((hd, i) => { sem[`hand${i}`] = R2(C.toD(hd)); });
    C.exChips.forEach((_, i) => { nodes[`exchip${i}`] = {opacity: 1}; });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) {
      for (const m of L.lay.rows) {
        if (m.name.startsWith('note')) nodes[m.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
        else if (m.name === 'state-tag') nodes[m.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
      }
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        lights: r(lights, 3),
        switchK: r(sw, 3),
        started: r(started, 3),
        display: startOp > 0.5 ? 'started' : pendOp > 0.5 ? 'pending' : 'changing',
        textOverlap: startOp > 0.05 && pendOp > 0.05,
        received: sem.cardState.filter(s => s === 'placed').length,
        allReached: rf.reached,
        order: R.order.join('>'),
        finalState: P.finalState,
        actionCapped: P.actionProgress < 1 && u > cap,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(100 * C.k * L.px, 1),
        k: r(C.k, 3),
        roomBox: {x: r(L.tr.room.x), y: r(L.tr.room.y), w: r(L.tr.room.w), h: r(L.tr.room.h)},
        cols: L.tr.cols,
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
    slug: 'hearings-01-story',
    title: 'Opening of a hearing — the room is activated and the participants receive their labels',
    titleEs: 'Apertura de audiencia — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Apertura de audiencia',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. A wall switch activates the room: a pulse runs along the power line, the lamps come on and the wall display changes from the supplied pending state to the supplied started state. In the configured sequence each participant takes a name card from the tray on the shared table and sets it upright; their supplied label arrives beside them. Fictional and illustrative; no formula, hierarchy, speaking order or outcome is shown.',
    tags: ['hearing', 'opening', 'room', 'floor plan', 'participants', 'name cards', 'labels', 'wall clock', 'status display', 'switch', 'lights', 'exhibit', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
