/**
 * LAW-0313 — Conclusiones de las partes · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the parties the counterpart, the wall clock the room's fixture,
 * the exhibits on the evidence table the evidence):
 *  0.00–0.15  rest: the argument board along the top wall holds the two cards
 *             of the same size (● argument A, ◆ argument B, each as supplied,
 *             in the configured order); the exhibits lie numbered on the
 *             evidence table; each party stands at an identical lectern on the
 *             side of its own card; any other participant sits facing the board.
 *  0.15–0.42  the action starts: both parties raise a hand towards their own
 *             card at the same moment (the cause); the first link of each side
 *             runs out of the card's lower edge down to an exhibit it invokes,
 *             its marker (● / ◆, equal ink) riding the tip.
 *  0.42–0.73  the remaining links run, the j-th of A and the j-th of B in the
 *             same window (the same pace, no order between the sides); each
 *             marker comes to rest on its exhibit's upper edge; the hands come
 *             down.
 *  0.73–1.00  hold: both cards linked to the exhibits they invoke, as supplied;
 *             notes, state tag and the key "as supplied · no conclusion drawn".
 *             A link only means "invoked by the party (as supplied)": nothing is
 *             proved, weighed or decided; no side is preferred.
 * @module animations/hearings/LAW-0313
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, speakerChipNode, R2, centreShiftY} from './kits/apertura-audiencia.js';
import {cpFields, CP_EN, CP_ES, resolveCp, cpRows, cpRowNode, cpRoom, cpTiming, cpStageAt, composeCp, searchCp, SIDES} from './kits/conclusiones-partes.js';

const ID = 'LAW-0313';
// (the wall clock comes to rest at CLOCK_END: the last frames are a still hold)
const CLOCK_END = 0.94;
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {action: [0.16, 0.72], notes: [0.75, 0.8], state: [0.76, 0.81]};
// (equal weight: a note may ring the board, both argument cards together — the same ring round each —, the evidence or
// the clock; never one side's card alone)
const TARGETS = ['board', 'arguments', 'evidence', 'clock'];

const STRINGS = {
  en: {both: 'Each argument linked to the exhibits it invokes (as supplied)', one: 'Both arguments on the board; no link drawn (as supplied)'},
  es: {both: 'Cada argumento unido a las pruebas que invoca (aportado)', one: 'Ambos argumentos en el panel; sin vínculos (aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {board: 'Argument board with two places', lectern: 'Two identical lecterns', table: 'Evidence table with the exhibits', clock: 'Wall clock (room fixture)'},
  annotations: [{target: 'evidence', text: 'Each line ends on an exhibit its party invokes (as supplied)'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {board: 'Panel de argumentos con dos lugares', lectern: 'Dos atriles idénticos', table: 'Mesa de pruebas con las pruebas', clock: 'Reloj de pared (de la sala)'},
  annotations: [{target: 'evidence', text: 'Cada línea acaba en una prueba invocada por su parte (aportado)'}],
  stateCaption: '',
};
const EN = {...CP_EN, ...OWN_EN};
const ES = {...CP_ES, ...OWN_ES};

const sceneSchema = {
  ...cpFields,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    board: str('Caption for the argument board', 60),
    lectern: str('Caption for the lecterns', 60),
    table: str('Caption for the evidence table', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['board', 'lectern', 'table', 'clock']),
  actionProgress: num('How far the action is allowed to progress (1 = every supplied link drawn; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['linked', 'arguments-only']),
  stateCaption: str('Caption of the supplied final state in the hold (empty: the built-in caption of that state)', 100),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'linked'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveCp(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const linked = P.finalState !== 'arguments-only';
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) rows.push(...cpRows(R, P, 'lg'));
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'board', text: P.objectLabels.board, name: 'lg-board'});
      rows.push({kind: 'legend', glyphKind: 'card', text: P.objectLabels.lectern, name: 'lg-lectern'});
      rows.push({kind: 'legend', glyphKind: 'table', text: P.objectLabels.table, name: 'lg-table'});
      rows.push({kind: 'legend', glyphKind: 'clock', text: P.objectLabels.clock, name: 'lg-clock'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
    }
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
    if (showKey) rows.push({kind: 'state', text: P.stateCaption ? P.stateCaption : linked ? ctx.t.both : ctx.t.one, name: 'state-tag'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    // standing floors (hearings measure the FIGURE): >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — only
    // when nothing composes at 1:1 does the stress floor of 45 px apply
    const search = minPersonPx => searchCp(ctx, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4],
      compose: (box, F, scale) => composeCp(ctx, P, R, box, F, {scale, chips: showKey, text: showKey}),
    });
    let best = search(ctx.view.shape === 'square' ? 55.5 : 61);
    if (best.problems.length && ctx.view.shape === 'square') best = search(45);
    const {F, C, lay} = best;
    const G = C.G;
    const room = cpRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, cardFits: G.cardFits, noLinks: !linked});
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      if (name === 'board') return {x: G.board.x - mg, y: G.board.y - mg, w: G.board.w + 2 * mg, h: G.board.h + 2 * mg};
      if (name === 'arguments') return SIDES.map(s => { const b = G.card[s]; return {x: b.x - mg * 0.8, y: b.y - mg * 0.8, w: b.w + mg * 1.6, h: b.h + mg * 1.6}; });
      if (name === 'clock') return {x: G.clock.cx - G.clock.R - 8, y: G.clock.cy - G.clock.R - 8, w: 2 * G.clock.R + 16, h: 2 * G.clock.R + 16, round: true};
      return {x: G.table.x - 10, y: G.table.y - 10, w: G.table.w + 20, h: G.table.h + 20};
    };
    const rings = showAll ? P.annotations.flatMap((a, i) => {
      const col = noteColors[i % 2];
      // ('arguments': the same ring round each card — both sides alike)
      return [].concat(tgt(a.target)).map(b => b.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2), 'data-target': a.target})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2), 'data-target': a.target}));
    }) : [];
    const nMax = Math.max(R.links.a.length, R.links.b.length);
    const TM = cpTiming(W.action[0], W.action[1], nMax);
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, linked, TM, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => cpRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
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
    const st = cpStageAt(G, R, TM, ua, {sides: L.linked ? SIDES : []});
    const rf = L.room.frame({clockDeg: 48 * Math.min(u, CLOCK_END), reach: st.reach, draw: st.draw});
    Object.assign(nodes, rf.nodes);
    C.chips.forEach((ch, i) => { if (ch) nodes[`lab${i}`] = {opacity: 1}; });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const handOf = s => (rf.hands[R.party[s]] ? R2(C.toD(rf.hands[R.party[s]])) : null);
    return {
      nodes,
      semantic: {
        beat,
        linkState: st.state,
        drawA: st.draw.a.map(q => r(q, 3)),
        drawB: st.draw.b.map(q => r(q, 3)),
        linksA: G.links.a.map(lk => lk.ex),
        linksB: G.links.b.map(lk => lk.ex),
        signalling: r(st.k, 3),
        handA: handOf('a'),
        handB: handOf('b'),
        tipA: rf.tips.a[0] ? R2(C.toD(rf.tips.a[0])) : null,
        tipB: rf.tips.b[0] ? R2(C.toD(rf.tips.b[0])) : null,
        positions: R.speakers.map(sp => R2(C.toD(G.seats[sp.index]))),
        cardA: R2(C.toD({x: G.card.a.x, y: G.card.a.y})),
        cardB: R2(C.toD({x: G.card.b.x, y: G.card.b.y})),
        cardSize: {a: [r(G.card.a.w), r(G.card.a.h)], b: [r(G.card.b.w), r(G.card.b.h)]},
        order: R.order.join('>'),
        boardLeft: G.left,
        parties: R.party,
        listeners: R.listeners,
        allReached: rf.reached,
        finalState: P.finalState,
        actionCapped: P.actionProgress < 1 && u > cap,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(100 * C.k * L.px, 1),
        roomBox: {x: r(L.roomBox.x), y: r(L.roomBox.y), w: r(L.roomBox.w), h: r(L.roomBox.h)},
        cols: L.cols,
        roomSize: {W: r(G.W), H: r(G.H), needW: r(G.needW), needH: r(G.needH), k: r(C.k, 3)},
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
    slug: 'hearings-09-story',
    title: 'Closing arguments — each party links its argument to the exhibits it invokes',
    titleEs: 'Conclusiones de las partes — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Conclusiones de las partes',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. The argument board holds two cards of the same size (● argument A, ◆ argument B, as supplied); the exhibits lie numbered on the evidence table; each party stands at an identical lectern on the side of its own card. Both parties raise a hand towards their own card at the same moment; then, link by link and at the same pace on both sides, a line runs from each card down to an exhibit it invokes, its marker (● or ◆, equal ink) coming to rest on the exhibit. A link only means "invoked by the party (as supplied)". Illustrative; nothing is proved, weighed or decided and no side is preferred.',
    tags: ['hearing', 'closing arguments', 'arguments', 'exhibits', 'evidence table', 'invoked as supplied', 'two parties', 'equal weight', 'argument board', 'floor plan', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/conclusiones-partes.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
