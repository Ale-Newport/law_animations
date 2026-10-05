/**
 * LAW-0317 — Lectura de resolución · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the reader and the other participants the people, the wall
 * clock the room's fixture; the document's content is ONLY supplied
 * placeholder text):
 *  0.00–0.15  rest: the reading board along the top wall shows its two empty
 *             places of the same size; the closed document lies on the lectern
 *             in front of the reader (generic, neutral); the reading table is
 *             empty; the other participants sit beside, facing the board.
 *  0.15–0.42  the action starts: the reader's hand goes to the document (the
 *             cause); the document emerges — it rises from the lectern and
 *             grows as it moves onto the middle of the reading table, where it
 *             lies open.
 *  0.42–0.73  it separates its editable apartados: the two section cards come
 *             out of it at the same moment and the same pace (● section A to its
 *             place, ◆ section B to its place) and the numbered apartados spread
 *             out of it to their places along the table; then a line runs from each
 *             section card to every apartado placed in it (as supplied), all
 *             lines together, its marker (● / ◆, equal ink) resting on the
 *             apartado. The hand has come down.
 *  0.73–1.00  hold: both sections on the board, each showing only its supplied
 *             heading and neutral placeholder bars; notes, state tag and the key
 *             "as supplied · no conclusion drawn". Nothing is decided, granted
 *             or found; neither section is preferred.
 * @module animations/hearings/LAW-0317
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, speakerChipNode, R2, centreShiftY} from './kits/apertura-audiencia.js';
import {lrFields, LR_EN, LR_ES, resolveLr, lrRows, lrRowNode, lrRoom, lrTiming, lrDrawAt, docAt, composeLr, searchLr, SIDES} from './kits/lectura-resolucion.js';

const ID = 'LAW-0317';
// (the wall clock comes to rest at CLOCK_END: the last frames are a still hold)
const CLOCK_END = 0.94;
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {point: [0.15, 0.21], lift: [0.21, 0.37], lower: [0.37, 0.43], split: [0.42, 0.56], fade: [0.42, 0.47], links: [0.57, 0.72], notes: [0.75, 0.8], state: [0.76, 0.81]};
// (equal weight: a note may ring the board, both section cards together — the same ring round each —, the table or the
// clock; never one section's card alone)
const TARGETS = ['board', 'sections', 'table', 'clock'];

const STRINGS = {
  en: {both: 'The document separated into its two sections (as supplied)', one: 'Both sections on the board; no line drawn (as supplied)'},
  es: {both: 'El documento separado en sus dos bloques (según lo aportado)', one: 'Ambos bloques en el panel; sin líneas (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {board: 'Board with two places of the same size', lectern: 'Lectern with the document', table: 'Table with the numbered paragraphs', clock: 'Wall clock (room fixture)'},
  annotations: [{target: 'table', text: 'Each line ends on a paragraph of its section (as supplied)'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {board: 'Panel con dos lugares iguales', lectern: 'Atril con el documento', table: 'Mesa con los apartados numerados', clock: 'Reloj de la sala'},
  annotations: [{target: 'table', text: 'Cada línea acaba en un apartado de su bloque (según lo aportado)'}],
  stateCaption: '',
};
const EN = {...LR_EN, ...OWN_EN};
const ES = {...LR_ES, ...OWN_ES};

const sceneSchema = {
  ...lrFields,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    board: str('Caption for the reading board', 60),
    lectern: str('Caption for the lectern', 60),
    table: str('Caption for the reading table', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['board', 'lectern', 'table', 'clock']),
  actionProgress: num('How far the action is allowed to progress (1 = the document separated and every supplied line drawn; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the hold (no conclusion is inferred): the sections linked to their apartados, or the sections only', ['separated', 'sections-only']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 100),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'separated'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveLr(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const linked = P.finalState !== 'sections-only';
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) rows.push(...lrRows(R, P, 'lg'));
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'board', text: P.objectLabels.board, name: 'lg-board'});
      rows.push({kind: 'legend', glyphKind: 'lectern', text: P.objectLabels.lectern, name: 'lg-lectern'});
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
    const search = minPersonPx => searchLr(ctx, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4],
      compose: (box, F, scale) => composeLr(ctx, P, R, box, F, {scale, chips: showKey, text: showKey}),
    });
    let best = search(ctx.view.shape === 'square' ? 55.5 : 61);
    if (best.problems.length && ctx.view.shape === 'square') best = search(45);
    const {F, C, lay} = best;
    const G = C.G;
    const room = lrRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, cardFits: G.cardFits, noLinks: !linked, cardsIn: true, exIn: true, doc: true});
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      if (name === 'board') return {x: G.board.x - mg, y: G.board.y - mg, w: G.board.w + 2 * mg, h: G.board.h + 2 * mg};
      if (name === 'sections') return SIDES.map(s => { const b = G.card[s]; return {x: b.x - mg * 0.8, y: b.y - mg * 0.8, w: b.w + mg * 1.6, h: b.h + mg * 1.6}; });
      if (name === 'clock') return {x: G.clock.cx - G.clock.R - 8, y: G.clock.cy - G.clock.R - 8, w: 2 * G.clock.R + 16, h: 2 * G.clock.R + 16, round: true};
      return {x: G.table.x - 10, y: G.table.y - 10, w: G.table.w + 20, h: G.table.h + 20};
    };
    const rings = showAll ? P.annotations.flatMap((a, i) => {
      const col = noteColors[i % 2];
      // ('sections': the same ring round each card — both sections alike)
      return [].concat(tgt(a.target)).map(b => b.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2), 'data-target': a.target})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2), 'data-target': a.target}));
    }) : [];
    const nMax = Math.max(R.links.a.length, R.links.b.length);
    const TM = lrTiming(W.links[0], W.links[1], nMax, {together: true});
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, linked, TM, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => lrRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      C.chips.map((ch, i) => (ch ? speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`}) : null)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G, TM} = L;
    const nodes = {};
    const cap = lerp(W.point[0], W.links[1], clamp(P.actionProgress));
    const ua = P.actionProgress >= 1 ? u : Math.min(u, cap);
    const e = ease.inOutCubic;
    // the reader's hand goes to the document (the cause), stays while it rises, then comes down
    const k = e(seg(ua, ...W.point)) * (1 - e(seg(ua, ...W.lower)));
    const lift = seg(ua, ...W.lift);
    const split = seg(ua, ...W.split);
    const fade = seg(ua, ...W.fade);
    const doc = docAt(G, lift, fade);
    const st = lrDrawAt(G, TM, ua, {sides: L.linked ? SIDES : []});
    const rf = L.room.frame({clockDeg: 48 * Math.min(u, CLOCK_END), reach: k > 0 ? {target: G.aim.target, k} : null, draw: st.draw, cardIn: {a: split, b: split}, exIn: split, doc});
    Object.assign(nodes, rf.nodes);
    C.chips.forEach((ch, i) => { if (ch) nodes[`lab${i}`] = {opacity: 1}; });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const docState = lift <= 0 ? 'lectern' : lift < 1 ? 'rising' : fade <= 0 ? 'open' : fade < 1 ? 'separating' : 'separated';
    const hand = rf.hands[R.reader] ? R2(C.toD(rf.hands[R.reader])) : null;
    return {
      nodes,
      semantic: {
        beat,
        docState,
        lift: r(lift, 3),
        split: r(split, 3),
        cardInA: r(split, 3),
        cardInB: r(split, 3),
        linkState: st.state,
        drawA: st.draw.a.map(q => r(q, 3)),
        drawB: st.draw.b.map(q => r(q, 3)),
        linksA: G.links.a.map(lk => lk.ex),
        linksB: G.links.b.map(lk => lk.ex),
        reaching: r(k, 3),
        hand,
        doc: R2(C.toD(doc)),
        docScale: r(doc.s, 3),
        tipA: rf.tips.a[0] ? R2(C.toD(rf.tips.a[0])) : null,
        tipB: rf.tips.b[0] ? R2(C.toD(rf.tips.b[0])) : null,
        positions: R.speakers.map(sp => R2(C.toD(G.seats[sp.index]))),
        cardA: R2(C.toD({x: G.card.a.x, y: G.card.a.y})),
        cardB: R2(C.toD({x: G.card.b.x, y: G.card.b.y})),
        cardSize: {a: [r(G.card.a.w), r(G.card.a.h)], b: [r(G.card.b.w), r(G.card.b.h)]},
        order: R.order.join('>'),
        boardLeft: G.left,
        reader: R.reader,
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
    slug: 'hearings-10-story',
    title: 'Reading of a document — it emerges from the lectern and separates into its editable sections and paragraphs',
    titleEs: 'Lectura de resolución — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Lectura de resolución',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. The closed document lies on the lectern in front of a generic, neutral reader; the reading board shows two empty places of the same size. The reader\'s hand goes to the document; it rises from the lectern and grows as it moves onto the reading table, then separates: the two section cards (● "Grounds", ◆ "Operative part" by default — editable headings with neutral placeholder bars only) come out of it at the same moment and pace to their places on the board, and the numbered placeholder paragraphs spread out to their places along the table. A line then runs from each section to every paragraph placed in it (as supplied). Illustrative; the document carries no decision content: nothing is decided, granted or found and neither section is preferred.',
    tags: ['hearing', 'reading', 'document', 'sections', 'paragraphs', 'placeholder text', 'as supplied', 'equal weight', 'reading board', 'lectern', 'floor plan', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/lectura-resolucion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
