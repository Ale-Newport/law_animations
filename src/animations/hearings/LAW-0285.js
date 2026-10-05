/**
 * LAW-0285 — Exposición inicial · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the seated participants the counterpart, the wall clock the
 * support, the exhibit on the low cabinet):
 *  0.00–0.15  rest: the presenting participant (as supplied; no rank or
 *             speaking order implied) stands behind the lectern facing the
 *             room; a stack of folded slips lies on the lectern; the long
 *             presentation table along the top wall is empty; the seated
 *             participants face it. Labels and the legend are readable.
 *  0.15–0.42  the action starts: the presenter takes the first slip, turns,
 *             walks along the table, sets the slip down at its place and
 *             UNFOLDS it into a card (a fact or a question, as supplied); its
 *             text arrives once it is open.
 *  0.42–0.73  in the configured sequence each slip is laid out and unfolded
 *             beside the previous one (hand, slip and card stay together; the
 *             hand always reaches before the slip moves). A fact with
 *             SUPPORT SUPPLIED (◆) is then linked, along a lane behind the
 *             cards, to the exhibit it refers to (as supplied); a CLAIM MADE
 *             (●) has no such line. ● and ◆ have equal weight.
 *  0.73–1.00  hold: the supplied final state (every item laid out, or the
 *             last slip still on the lectern), notes, state tag and the key
 *             "as supplied · no conclusion drawn". Nothing is assessed: no
 *             proof, weight, burden, sufficiency or outcome.
 * @module animations/hearings/LAW-0285
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, speakerChipNode, exhibitChipNode, R2, searchLayout, centreShiftY} from './kits/apertura-audiencia.js';
import {expoFields, EXPO_EN, EXPO_ES, resolveExpo, composeExpo, expoRoom, expoRowNode, expoSchedule, stageAt, CUE_ROW} from './kits/exposicion-inicial.js';

const ID = 'LAW-0285';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {items: [0.16, 0.72], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['lectern', 'table', 'clock', 'exhibit', 'firstCard', 'lastCard'];

const STRINGS = {
  en: {allLaid: 'Every item has been laid out (as supplied)', lastFolded: 'The last slip is still on the lectern (as supplied)'},
  es: {allLaid: 'Todos los elementos están expuestos (según lo aportado)', lastFolded: 'La última hoja sigue en el atril (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {lectern: 'Lectern with folded slips', table: 'Presentation table', clock: 'Wall clock (support)'},
  annotations: [{target: 'lectern', text: 'Items laid out beside the lectern (as configured)'}],
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {lectern: 'Atril con hojas plegadas', table: 'Mesa de exposición', clock: 'Reloj de pared (soporte)'},
  annotations: [{target: 'lectern', text: 'Elementos expuestos junto al atril (según lo configurado)'}],
};
const EN = {...EXPO_EN, ...OWN_EN};
const ES = {...EXPO_ES, ...OWN_ES};

const sceneSchema = {
  ...expoFields,
  actorLabels: obj('Caption of the person glyph in the legend', {
    participant: str('Caption for the people drawn from above', 50),
  }, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    lectern: str('Caption for the lectern', 60),
    table: str('Caption for the presentation table', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['lectern', 'table', 'clock']),
  actionProgress: num('How far the laying out is allowed to progress (1 = every item laid out; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['all-laid-out', 'last-on-lectern']),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'all-laid-out'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveExpo(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const lastWaiting = P.finalState === 'last-on-lectern' ? R.order[R.order.length - 1] : -1;
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) {
      if (R.items.some(it => it.state === 'claim')) rows.push({kind: 'legend', glyphKind: CUE_ROW.claim, text: P.states.claim, name: 'lg-claim'});
      if (R.items.some(it => it.state === 'support')) rows.push({kind: 'legend', glyphKind: CUE_ROW.support, text: P.states.support, name: 'lg-support'});
      if (R.items.some(it => it.kind === 'question')) rows.push({kind: 'legend', glyphKind: 'question', text: P.labels.question, name: 'lg-question'});
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'lectern', text: P.objectLabels.lectern, name: 'lg-lectern'});
      rows.push({kind: 'legend', glyphKind: 'card', text: P.objectLabels.table, name: 'lg-table'});
      rows.push({kind: 'legend', glyphKind: 'clock', text: P.objectLabels.clock, name: 'lg-clock'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
    }
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
    if (showKey) rows.push({kind: 'state', text: lastWaiting >= 0 ? ctx.t.lastFolded : ctx.t.allLaid, name: 'state-tag'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const best = searchLayout(ctx, P, R, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx: 61,
      compose: (box, F, scale) => composeExpo(ctx, P, R, box, F, {scale, chips: showKey, cardText: showKey}),
    });
    const {F, C, lay} = best;
    const G = C.G;
    const room = expoRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft});
    // note rings around their target (template units)
    const tgt = name => {
      if (name === 'lectern') return {x: G.lectern.cx - 42, y: G.lectern.cy - 32, w: 84, h: 64};
      if (name === 'table') return {x: G.ledge.x - 6, y: G.ledge.y - 4, w: G.ledge.w + 12, h: G.ledge.h + 8};
      if (name === 'clock') return {x: G.clock.cx - G.clock.R - 8, y: G.clock.cy - G.clock.R - 8, w: 2 * G.clock.R + 16, h: 2 * G.clock.R + 16, round: true};
      if (name === 'exhibit') return G.cab ? {x: G.cab.x - 6, y: G.cab.y - 6, w: G.cab.w + 12, h: G.cab.h + 12} : {x: G.lectern.cx - 42, y: G.lectern.cy - 32, w: 84, h: 64};
      const s = G.slots[name === 'firstCard' ? R.order[0] : R.order[R.order.length - 1]];
      return {x: s.x - 12, y: s.y - 10, w: s.w + 24, h: s.h + 20};
    };
    const rings = showAll ? P.annotations.map((a, i) => {
      const b = tgt(a.target);
      const col = noteColors[i % 2];
      return b.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)});
    }) : [];
    const S = expoSchedule(G, R, W.items[0], W.items[1], {waiting: lastWaiting});
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box), ...C.exChips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, lastWaiting, S, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => expoRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      C.exChips.map((E, i) => exhibitChipNode(ctx, E, {name: `exchip${i}`})),
      C.chips.map((ch, i) => (ch ? speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`}) : null)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G} = L;
    const nodes = {};
    const S = L.S;
    const cap = lerp(S.segs[0].a, S.t1, clamp(P.actionProgress));
    const ua = P.actionProgress >= 1 ? u : Math.min(u, cap);
    const st = stageAt(G, R, S, ua, {reduced: ctx.reduced});
    const rf = L.room.frame({clockDeg: 36 * clamp(u / 0.8), presenter: st.presenter, cards: st.cards, slips: st.slips, tethers: st.tethers});
    Object.assign(nodes, rf.nodes);
    // the presenter's label stays with them: shown while they stand at the lectern (rest and hold), away otherwise
    const first = S.segs[0].a, last = S.t1;
    const presentOp = ua < first ? 1 - seg(u, first - 0.012, first) : P.actionProgress < 1 ? 0 : seg(u, last, last + 0.015);
    C.chips.forEach((ch, i) => { if (ch) { nodes[`lab${i}`] = {opacity: r(i === R.presenter ? presentOp : 1, 3)}; } });
    C.exChips.forEach((_, i) => { nodes[`exchip${i}`] = {opacity: 1}; });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const sem = {};
    R.items.forEach(it => {
      sem[`card${it.i}`] = R2(C.toD({x: G.slots[it.i].cx, y: G.slots[it.i].bottom}));
      sem[`slip${it.i}`] = st.slips[it.i] ? R2(C.toD(st.slips[it.i])) : null;
    });
    const hand = C.toD(st.hand);
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        hand: R2(hand),
        held: st.held,
        active: st.active,
        heldSlip: st.held !== null ? R2(C.toD(st.slips[st.held])) : null,
        handL: R2(C.toD(st.handL)),
        leftStack: st.left,
        stackTop: (() => { const top = R.order.find(i => st.states[i] === 'stack' && st.slips[i] && i !== L.lastWaiting); return top !== undefined && ua >= S.segs[0].b ? R2(C.toD(st.slips[top])) : null; })(),
        presenter: R2(C.toD(st.presenter.pose)),
        itemState: R.items.map(it => st.states[it.i]),
        open: R.items.map(it => r(st.cards[it.i].open, 3)),
        textShown: R.items.map(it => r(st.cards[it.i].text, 3)),
        tether: R.items.map(it => (it.exhibit !== null ? r(st.tethers[it.i], 3) : null)),
        kinds: R.items.map(it => it.kind),
        states: R.items.map(it => it.state),
        laidOut: R.items.filter(it => st.states[it.i] === 'open').length,
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
    slug: 'hearings-02-story',
    title: 'Opening statement — a participant lays out facts and questions beside the lectern',
    titleEs: 'Exposición inicial — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Exposición inicial',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. The presenting participant takes folded slips one by one from the lectern, walks along the presentation table and unfolds each into a card: a fact (● claim made or ◆ support supplied, as supplied) or a question. A fact with support supplied is linked to the exhibit it refers to. Fictional and illustrative; nothing is assessed — no proof, weight, burden or outcome.',
    tags: ['hearing', 'opening statement', 'lectern', 'facts', 'questions', 'claim made', 'support supplied', 'exhibit', 'presentation table', 'floor plan', 'participants', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/exposicion-inicial.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
