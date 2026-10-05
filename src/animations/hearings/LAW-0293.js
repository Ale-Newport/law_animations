/**
 * LAW-0293 — Preguntas de contraste · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the participants the counterpart, the wall clock the support,
 * the exhibit on the low cabinet):
 *  0.00–0.15  rest: the witness in the witness box; the questioner behind the
 *             lectern with the question slip and the PREVIOUS answer (a written
 *             record, as supplied); the tray and the turn rail are empty.
 *  0.15–0.42  the action starts: the questioner lifts the slips and turns to the
 *             witness; the question is set on the tray, slides onto the rail and
 *             unfolds; then the previous answer (● as supplied) follows it.
 *  0.42–0.73  the witness sets the CURRENT answer (◆ as supplied) on the tray; it
 *             slides up and stands beside the previous one — the cards on the
 *             rail advance a place for each new turn, so the two answers line up
 *             side by side. Hand, slip and card stay together.
 *  0.67–1.00  the one textual difference supplied by the author is marked with
 *             the SAME neutral highlight in both answers; notes, state tag and the
 *             key "as supplied · no conclusion drawn". Nothing is assessed: no
 *             inconsistency, contradiction, credibility, impeachment, error,
 *             weight or outcome; neither answer is marked as wrong.
 * @module animations/hearings/LAW-0293
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, speakerChipNode, R2, searchLayout, centreShiftY} from './kits/apertura-audiencia.js';
import {composeIt, itRoom, itSchedule, itStageAt} from './kits/interrogatorio-directo.js';
import {pcFields, PC_EN, PC_ES, resolvePc, pcRows, pcRowNode, spanBoxes, highlightNode} from './kits/preguntas-contraste.js';

const ID = 'LAW-0293';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {items: [0.16, 0.66], diff: [0.67, 0.73], notes: [0.75, 0.8], state: [0.76, 0.81]};
// (a note ring never singles out one answer: 'answers' rings both together)
const TARGETS = ['rail', 'witnessBox', 'tray', 'clock', 'exhibit', 'answers'];

const STRINGS = {
  en: {marked: 'Both answers side by side; the supplied difference is marked (as supplied)', lined: 'Both answers side by side (as supplied)'},
  es: {marked: 'Ambas respuestas lado a lado; la diferencia aportada está marcada (según lo aportado)', lined: 'Ambas respuestas lado a lado (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {witnessBox: 'Witness box with the turn tray', rail: 'Turn rail', lectern: 'Lectern with the question and the record', clock: 'Wall clock (support)'},
  annotations: [{target: 'tray', text: 'Each answer is set on the tray beside the witness (as configured)'}],
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {witnessBox: 'Estrado del testigo con la bandeja de turnos', rail: 'Riel de turnos', lectern: 'Atril con la pregunta y el registro', clock: 'Reloj de pared (soporte)'},
  annotations: [{target: 'tray', text: 'Cada respuesta se deja en la bandeja junto al testigo (según lo configurado)'}],
};
const EN = {...PC_EN, ...OWN_EN};
const ES = {...PC_ES, ...OWN_ES};

const sceneSchema = {
  ...pcFields,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    witnessBox: str('Caption for the witness box and its tray', 60),
    rail: str('Caption for the turn rail', 60),
    lectern: str('Caption for the lectern', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['witnessBox', 'rail', 'lectern', 'clock']),
  actionProgress: num('How far the lining up is allowed to progress (1 = both answers on the rail and the difference marked; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['difference-marked', 'aligned-only']),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'difference-marked'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolvePc(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const marked = P.finalState !== 'aligned-only';
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) {
      rows.push(...pcRows(R, P));
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'wbox', text: P.objectLabels.witnessBox, name: 'lg-wbox'});
      rows.push({kind: 'legend', glyphKind: 'card', text: P.objectLabels.rail, name: 'lg-rail'});
      rows.push({kind: 'legend', glyphKind: 'lectern', text: P.objectLabels.lectern, name: 'lg-lectern'});
      rows.push({kind: 'legend', glyphKind: 'clock', text: P.objectLabels.clock, name: 'lg-clock'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
    }
    if (showKey && marked) rows.push({kind: 'legend', glyphKind: 'diffmark', text: P.labels.difference, name: 'lg-diff'});
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
    if (showKey) rows.push({kind: 'state', text: marked ? ctx.t.marked : ctx.t.lined, name: 'state-tag'});
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
      const ss = [R.prevI, R.curI].filter(q => q !== null).map(q => G.slots[q]);
      const x0 = Math.min(...ss.map(q => q.x)), x1 = Math.max(...ss.map(q => q.x + q.w)), y0 = Math.min(...ss.map(q => q.y)), y1 = Math.max(...ss.map(q => q.y + q.h));
      return {x: x0 - mg, y: y0 - mg * 0.8, w: x1 - x0 + 2 * mg, h: y1 - y0 + mg * 1.6};
    };
    const rings = showAll ? P.annotations.map((a, i) => {
      const b = tgt(a.target);
      const col = noteColors[i % 2];
      return b.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)});
    }) : [];
    const S = itSchedule(G, R, W.items[0], W.items[1]);
    // the supplied differing words, marked the same way in both answers (only when the text is shown)
    const hl = showKey && marked && R.prevI !== null && R.curI !== null ? {prev: spanBoxes(G, R.prevI, P.difference.previous), cur: spanBoxes(G, R.curI, P.difference.current)} : {prev: null, cur: null};
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, marked, hl, S, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => pcRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, highlightNode(ctx, 'hl-prev', L.hl.prev, C.k), highlightNode(ctx, 'hl-cur', L.hl.cur, C.k), g({name: 'rings', opacity: 0}, L.rings)),
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
    // the highlight: the same in both answers, arriving together once both stand on the rail
    const hlOp = done && L.marked ? seg(u, ...W.diff) : 0;
    if (L.hl.prev) nodes['hl-prev'] = {opacity: r(hlOp, 3), transform: `translate(${r(st.cards[R.prevI].dx)} 0)`};
    if (L.hl.cur) nodes['hl-cur'] = {opacity: r(hlOp, 3), transform: `translate(${r(st.cards[R.curI].dx)} 0)`};
    if (L.lay && L.lay.rows.some(m => m.name === 'lg-diff')) nodes['lg-diff'] = {opacity: r(hlOp, 3)};
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
        sources: R.items.map(it => it.source),
        givenBy: R.items.map(it => it.by),
        rank: R.rank,
        prevI: R.prevI,
        curI: R.curI,
        highlight: r(hlOp, 3),
        highlightFound: Boolean(L.hl.prev && L.hl.cur),
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
    slug: 'hearings-04-story',
    title: 'Contrasting questions — two answers line up and one supplied difference is marked',
    titleEs: 'Preguntas de contraste — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Preguntas de contraste',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. The questioner lays a previous answer (● a written record, as supplied) on the tray beside the witness and the witness gives the current answer (◆ as supplied); both slide onto the turn rail and stand side by side, and the one textual difference supplied by the author is marked with the same neutral highlight in both. Fictional and illustrative; nothing is assessed — no inconsistency, credibility, impeachment, error, weight or outcome.',
    tags: ['hearing', 'contrasting questions', 'previous answer', 'current answer', 'textual difference', 'highlight', 'witness box', 'turn rail', 'exhibit', 'floor plan', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/preguntas-contraste.js', 'src/animations/hearings/kits/interrogatorio-directo.js', 'src/animations/hearings/kits/exposicion-inicial.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
