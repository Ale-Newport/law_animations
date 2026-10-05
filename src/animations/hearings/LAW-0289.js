/**
 * LAW-0289 — Interrogatorio directo · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the participants the counterpart, the wall clock the support,
 * the exhibit on the low cabinet):
 *  0.00–0.15  rest: the witness sits in the witness box (upper right) with a
 *             few folded answer slips on the counter; the questioner (generic;
 *             no rank or role rules implied) stands behind the lectern with
 *             the question slips; the small tray on the counter and the turn
 *             rail along the top wall are empty. Labels and legend readable.
 *  0.15–0.42  the action starts: the questioner lifts the question slips and
 *             turns to the witness; the first turn's slip is set on the tray
 *             beside the witness, slides up the guide onto the rail's entry
 *             place and unfolds into its card; its text arrives once open.
 *  0.42–0.73  turn by turn in the configured sequence, whoever gives the turn
 *             (questioner: a question; witness: an answer, as supplied) sets
 *             its slip on the tray; before it reaches the rail every card
 *             already there ADVANCES one place along it. Hand, slip and card
 *             stay together; the hand reaches before the slip moves.
 *  0.73–1.00  hold: the supplied final state (every turn on the rail, or the
 *             last turn not given), notes, state tag and the key "as supplied
 *             · no conclusion drawn". ● open question / ◆ bounded answer are
 *             supplied forms of equal weight; nothing is assessed (no rules of
 *             examination, no objection, admissibility, credibility or weight).
 * @module animations/hearings/LAW-0289
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, speakerChipNode, R2, searchLayout, centreShiftY} from './kits/apertura-audiencia.js';
import {itFields, IT_EN, IT_ES, resolveIt, composeIt, itRoom, itRowNode, itSchedule, itStageAt, formRows} from './kits/interrogatorio-directo.js';

const ID = 'LAW-0289';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {items: [0.16, 0.72], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['rail', 'witnessBox', 'tray', 'clock', 'exhibit', 'firstCard', 'lastCard'];

const STRINGS = {
  en: {allGiven: 'Every turn is on the rail (as supplied)', lastNot: 'The last turn is not given (as supplied)'},
  es: {allGiven: 'Todos los turnos están en el riel (según lo aportado)', lastNot: 'El último turno no se da (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {witnessBox: 'Witness box with the turn tray', rail: 'Turn rail', lectern: 'Lectern with question slips', clock: 'Wall clock (support)'},
  annotations: [{target: 'tray', text: 'Each turn is set beside the witness, then advances (as configured)'}],
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {witnessBox: 'Estrado del testigo con la bandeja de turnos', rail: 'Riel de turnos', lectern: 'Atril con hojas de preguntas', clock: 'Reloj de pared (soporte)'},
  annotations: [{target: 'tray', text: 'Cada turno se deja junto al testigo y luego avanza (según lo configurado)'}],
};
const EN = {...IT_EN, ...OWN_EN};
const ES = {...IT_ES, ...OWN_ES};

const sceneSchema = {
  ...itFields,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    witnessBox: str('Caption for the witness box and its tray', 60),
    rail: str('Caption for the turn rail', 60),
    lectern: str('Caption for the lectern', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['witnessBox', 'rail', 'lectern', 'clock']),
  actionProgress: num('How far the exchange is allowed to progress (1 = every turn given; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['all-given', 'last-not-given']),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'all-given'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveIt(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const lastWaiting = P.finalState === 'last-not-given' ? R.order[R.order.length - 1] : -1;
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) {
      rows.push(...formRows(R, P));
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'wbox', text: P.objectLabels.witnessBox, name: 'lg-wbox'});
      rows.push({kind: 'legend', glyphKind: 'card', text: P.objectLabels.rail, name: 'lg-rail'});
      rows.push({kind: 'legend', glyphKind: 'lectern', text: P.objectLabels.lectern, name: 'lg-lectern'});
      rows.push({kind: 'legend', glyphKind: 'clock', text: P.objectLabels.clock, name: 'lg-clock'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
    }
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
    if (showKey) rows.push({kind: 'state', text: lastWaiting >= 0 ? ctx.t.lastNot : ctx.t.allGiven, name: 'state-tag'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const best = searchLayout(ctx, P, R, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx: ctx.view.shape === 'square' ? 55.5 : 61,
      compose: (box, F, scale) => composeIt(ctx, P, R, box, F, {scale, chips: showKey, cardText: showKey}),
    });
    const {F, C, lay} = best;
    const G = C.G;
    const room = itRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft});
    // (rings stand clear of their target by a screen margin: never across a text inside it)
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      if (name === 'rail') return {x: G.ledge.x - 6, y: G.ledge.y - 4, w: G.ledge.w + 12, h: G.ledge.h + 8};
      if (name === 'witnessBox') return {x: G.counter.x - 8, y: G.wbox.y - 10, w: G.wbox.x + G.wbox.w - G.counter.x + 18, h: G.wbox.h + 20};
      if (name === 'tray') return {x: G.tray.cx - G.tray.w / 2 - 10, y: G.tray.cy - G.tray.h / 2 - 10, w: G.tray.w + 20, h: G.tray.h + 20};
      if (name === 'clock') return {x: G.clock.cx - G.clock.R - 8, y: G.clock.cy - G.clock.R - 8, w: 2 * G.clock.R + 16, h: 2 * G.clock.R + 16, round: true};
      if (name === 'exhibit') return G.cab ? {x: G.cab.x - 6, y: G.cab.y - 6, w: G.cab.w + 12, h: G.cab.h + 12} : {x: G.lectern.cx - 42, y: G.lectern.cy - 32, w: 84, h: 64};
      const s = G.slots[name === 'firstCard' ? R.order[0] : R.order[R.order.length - 1]];
      return {x: s.x - mg, y: s.y - mg * 0.8, w: s.w + 2 * mg, h: s.h + mg * 1.6};
    };
    const rings = showAll ? P.annotations.map((a, i) => {
      const b = tgt(a.target);
      const col = noteColors[i % 2];
      return b.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)});
    }) : [];
    const S = itSchedule(G, R, W.items[0], W.items[1], {waiting: lastWaiting});
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, lastWaiting, S, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => itRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      C.chips.map((ch, i) => (ch ? speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`}) : null)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G} = L;
    const nodes = {};
    const S = L.S;
    const cap = lerp(S.pick.a, S.t1, clamp(P.actionProgress));
    const ua = P.actionProgress >= 1 ? u : Math.min(u, cap);
    const st = itStageAt(G, R, S, ua);
    const rf = L.room.frame({clockDeg: 36 * clamp(u / 0.8), q: st.q, w: st.w, cards: st.cards, slips: st.slips});
    Object.assign(nodes, rf.nodes);
    C.chips.forEach((ch, i) => { if (ch) nodes[`lab${i}`] = {opacity: 1}; });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const sem = {};
    R.items.forEach(it => {
      sem[`card${it.i}`] = R2(C.toD({x: G.slots[it.i].cx + st.cards[it.i].dx, y: G.slots[it.i].bottom}));
      sem[`slip${it.i}`] = st.slips[it.i] ? R2(C.toD(st.slips[it.i])) : null;
    });
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const onRail = R.items.filter(it => ['entered', 'unfolding', 'open'].includes(st.states[it.i]));
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        hand: R2(C.toD(st.hand)),
        handQ: R2(C.toD(st.handQ)),
        handW: R2(C.toD(st.handW)),
        handL: R2(C.toD(st.handL)),
        held: st.held,
        carrier: st.carrier,
        active: st.active,
        heldSlip: st.held !== null ? R2(C.toD(st.slips[st.held])) : null,
        questioner: R2(C.toD(st.q.pose)),
        questionerDeg: r(st.q.pose.deg, 2),
        itemState: R.items.map(it => st.states[it.i]),
        open: R.items.map(it => r(st.cards[it.i].open, 3)),
        textShown: R.items.map(it => r(st.cards[it.i].text, 3)),
        railX: R.items.map(it => r(C.toD({x: G.slots[it.i].cx + st.cards[it.i].dx, y: 0}).x, 2)),
        kinds: R.items.map(it => it.kind),
        forms: R.items.map(it => it.form),
        givenBy: R.items.map(it => it.by),
        onRail: onRail.length,
        allReached: rf.reached,
        order: R.order.join('>'),
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
    slug: 'hearings-03-story',
    title: 'Direct examination — questions and answers advance one by one beside the witness',
    titleEs: 'Interrogatorio directo — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Interrogatorio directo',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. Turn by turn, the questioner sets a question slip or the witness an answer slip on the tray beside the witness; each slip slides onto the turn rail and unfolds into a card, and the cards advance one place along the rail as each new turn arrives. ● open question and ◆ bounded answer are supplied forms of equal weight. Fictional and illustrative; nothing is assessed — no rules of examination, objection, admissibility, credibility or weight.',
    tags: ['hearing', 'direct examination', 'witness', 'witness box', 'questions', 'answers', 'open question', 'bounded answer', 'turn rail', 'exhibit', 'floor plan', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/interrogatorio-directo.js', 'src/animations/hearings/kits/exposicion-inicial.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
