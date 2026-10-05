/**
 * LAW-0321 — Identificación de motivo · story
 *
 * Storyboard (a generic, fictional examination room seen from above; the
 * decision's numbered apartados on the table are the anchor, the board with the
 * party's two supplied labels and the lines ("flechas") the secondary objects,
 * the wall calendar a fixture only; the decision's content is ONLY supplied
 * placeholder text):
 *  0.00–0.15  rest: the label board along the top wall shows the two label cards
 *             of the same size (● "Factual discrepancy", ◆ "Legal question
 *             raised" by default — neutral labels supplied by the party, equal
 *             weight); the numbered apartados lie on the table; the magnifier lies
 *             on the table in front of the party (generic, neutral).
 *  0.15–0.42  the action starts: the party's hand goes to the magnifier's grip
 *             (the cause) and lifts it; carrying it, the party walks along the
 *             table's lower edge so that the lens passes over the apartados.
 *  0.42–0.73  the lens stops over every apartado the party intends to challenge
 *             (as supplied) and a neutral bracket frame settles round that sheet —
 *             the same frame whichever label it gets; the magnifier comes back to
 *             its rest and is laid down; then a line runs from each label card to
 *             every apartado it is attached to (as supplied), all lines together,
 *             its marker (● / ◆, equal ink) resting on the apartado.
 *  0.73–1.00  hold: the located apartados framed, the lines with their markers;
 *             notes, state tag and the key "as supplied · no conclusion drawn".
 *             Nothing is evaluated: a label never says that an apartado is wrong,
 *             neither label is preferred, no outcome is drawn.
 * @module animations/review/LAW-0321
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {pxPerUnit, speakerChipNode, R2, centreShiftY} from '../hearings/kits/apertura-audiencia.js';
import {imFields, IM_EN, IM_ES, localisedIm, resolveIm, imRows, imRowNode, imRoom, imTiming, imDrawAt, imScan, locatedOf, composeIm, searchIm, SIDES} from './kits/identificacion-motivo.js';

const ID = 'LAW-0321';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {reach: [0.15, 0.2], lift: [0.2, 0.235], scan: [0.235, 0.6], put: [0.6, 0.625], release: [0.625, 0.665], links: [0.64, 0.73], notes: [0.75, 0.8], state: [0.76, 0.81]};
const SCAN = {reach: W.reach, lift: W.lift, scan: W.scan, put: W.put, release: W.release};
// (equal weight: a note may ring the board, both label cards together — the same ring round each —, the table or the
// calendar; never one label's card alone)
const TARGETS = ['board', 'labels', 'table', 'calendar'];
// (item 18: the table and its apartados are the acting objects — the sheets drawn at ACT.exK times the kit's standard
// size, the magnifier at ACT.lupaK, the sheets spaced so that the magnifier at rest lies clear of the located frames on
// either side of its gap; lupaDx balances the handle's reach to the right)
// (landscape: the room is bounded by its height beside the text column, so the sheets grow further there)
const ACTS = {landscape: {exK: 2.6, lupaK: 2.2, exStep: 344, lupaDx: -5, walkNarrow: true, linkGap: 150}, square: {exK: 1.3, lupaK: 1.2, exStep: 184, lupaDx: -3, linkGap: 52, walkPad: 60}, other: {exK: 1.6, lupaK: 1.45, exStep: 214, lupaDx: -4, walkNarrow: true, linkGap: 130}};

const STRINGS = {
  en: {both: 'The magnifier located the sections the party intends to challenge (as supplied)', one: 'Sections located; no label attached (as supplied)'},
  es: {both: 'La lupa localizó los apartados que se pretende impugnar (según lo aportado)', one: 'Apartados localizados; sin etiqueta (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {board: 'Board with the two labels of the same size', table: 'Table with the numbered sections', calendar: 'Wall calendar (no date marked)', located: 'Located section (as supplied)'},
  annotations: [{target: 'table', text: 'Each line ends on a located section (as supplied)'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {board: 'Panel con las dos etiquetas del mismo tamaño', table: 'Mesa con los apartados numerados', calendar: 'Calendario de pared (sin fechas marcadas)', located: 'Apartado localizado (según lo aportado)'},
  annotations: [{target: 'table', text: 'Cada línea acaba en un apartado localizado (según lo aportado)'}],
  stateCaption: '',
};
// (finalState 'located-only': no line and no marker is drawn, so the untouched default note speaks of the frames
// instead of the lines, and the ● / ◆ "labelled" rows are left out of the legend — nothing in the hold refers to an
// element that is not drawn)
const ONLY_NOTE = {
  en: [{target: 'table', text: 'Each frame marks a located section (as supplied)'}],
  es: [{target: 'table', text: 'Cada marco señala un apartado localizado (según lo aportado)'}],
};
const EN = {...IM_EN, ...OWN_EN};
const ES = {...IM_ES, ...OWN_ES};

const sceneSchema = {
  ...imFields,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    board: str('Caption for the label board', 60),
    table: str('Caption for the table with the apartados', 60),
    calendar: str('Caption for the wall calendar (a fixture only)', 60),
    located: str('Caption for the neutral frame of a located apartado', 70),
  }, ['board', 'table', 'calendar', 'located']),
  actionProgress: num('How far the action is allowed to progress (1 = every supplied apartado located and every line drawn; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the hold (no conclusion is inferred): the located apartados linked to their labels, or located only', ['located-labelled', 'located-only']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 100),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'located-labelled'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedIm(ctx, EN, ES);
    const R = resolveIm(ctx, P);
    // (fewer apartados: each sheet is drawn larger, so the table keeps its share of the frame)
    // (labels hidden, landscape: the room has the whole frame — the portrait sheet size keeps the party's walk calm)
    const act0 = ctx.view.shape === 'landscape' && !ctx.show('key') ? {...ACTS.other, linkGap: 110} : ACTS[ctx.view.shape] || ACTS.other;
    const fewK = R.exhibits.length <= 2 ? 1.45 : R.exhibits.length === 3 ? 1.25 : 1;
    const act = {...act0, extraH: R.listeners.length && ctx.view.shape === 'portrait' ? 140 : 0, exK: act0.exK * fewK, lupaK: act0.lupaK * fewK, exStep: act0.exStep * Math.sqrt(fewK), lupaDx: act0.lupaDx * fewK};
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const linked = P.finalState !== 'located-only';
    if (!linked) {
      const dflt = JSON.stringify(P.annotations);
      if (dflt === JSON.stringify(OWN_EN.annotations)) P.annotations = ONLY_NOTE.en;
      else if (dflt === JSON.stringify(OWN_ES.annotations)) P.annotations = ONLY_NOTE.es;
    }
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) rows.push(...imRows(R, P, 'lg').filter(m => linked || (m.name !== 'lg-a' && m.name !== 'lg-b')));
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'located', text: P.objectLabels.located, name: 'lg-located'});
      rows.push({kind: 'legend', glyphKind: 'board', text: P.objectLabels.board, name: 'lg-board'});
      rows.push({kind: 'legend', glyphKind: 'table', text: P.objectLabels.table, name: 'lg-table'});
      rows.push({kind: 'legend', glyphKind: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
    }
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
    if (showKey) rows.push({kind: 'state', text: P.stateCaption ? P.stateCaption : linked ? ctx.t.both : ctx.t.one, name: 'state-tag'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    // standing floors (hearings measure the FIGURE): >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — only
    // when nothing composes at 1:1 does the stress floor of 45 px apply
    const search = minPersonPx => searchIm(ctx, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4], sidePanels: [[0.44, 2], [0.5, 2], [0.56, 2]], bandMax: ctx.view.shape === 'square' ? 0.56 : 0.5,
      // (finer room scales: the room is never enlarged — and the acting objects shrunk — more than its walk needs)
      scales: [1, 1.06, 1.12, 1.2, 1.3, 1.42, 1.55],
      compose: (box, F, scale) => composeIm(ctx, P, R, box, F, {scale, chips: showKey, text: showKey, walk: true, crop: ctx.view.shape === 'landscape' || showKey, doorTop: true, calFree: true, restAtLupa: true, ...act}),
    });
    let best = search(ctx.view.shape === 'square' ? 55.5 : 61);
    if (best.problems.length && ctx.view.shape === 'square') best = search(45);
    const {F, C, lay} = best;
    const G = C.G;
    const located = locatedOf(G);
    const room = imRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, numFt: G.numFt, cardFits: G.cardFits, noLinks: !linked, located});
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      if (name === 'board') return {x: G.board.x - mg, y: G.board.y - mg, w: G.board.w + 2 * mg, h: G.board.h + 2 * mg};
      // (round each card: as far out as the gap between the two cards allows — the stroke clear of the card's text)
      if (name === 'labels') { const lm = Math.min(mg * 1.05, 20.5 - 2.5 / C.k); return SIDES.map(s => { const b = G.card[s]; return {x: b.x - lm, y: b.y - lm, w: b.w + 2 * lm, h: b.h + 2 * lm}; }); }
      if (name === 'calendar') return {x: G.clock.cx - G.clock.R - 10, y: G.clock.cy - G.clock.R * 1.1 - 12, w: 2 * G.clock.R + 20, h: 2.2 * G.clock.R + 22};
      return {x: G.table.x - 10, y: G.table.y - 10, w: G.table.w + 20, h: G.table.h + 20};
    };
    const rings = showAll ? P.annotations.flatMap((a, i) => {
      const col = noteColors[i % 2];
      // ('labels': the same ring round each card — both labels alike)
      return [].concat(tgt(a.target)).map(b => h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2), 'data-target': a.target}));
    }) : [];
    const nMax = Math.max(R.links.a.length, R.links.b.length);
    const TM = imTiming(W.links[0], W.links[1], nMax, {together: true});
    // (the party's chip travels with the party: the vertical centring takes the chip's whole walk into account)
    const walkD = [(G.walk.min - G.restX) * C.k, (G.walk.max - G.restX) * C.k];
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, linked, TM, located, walkD, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => imRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      C.chips.map((ch, i) => (ch ? g({name: `labw${i}`, transform: 'translate(0 0)'}, speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`})) : null)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G, TM} = L;
    const nodes = {};
    const cap = lerp(W.reach[0], W.links[1], clamp(P.actionProgress));
    const ua = P.actionProgress >= 1 ? u : Math.min(u, cap);
    const sc = imScan(G, L.located, SCAN, ua);
    const st = imDrawAt(G, TM, ua, {sides: L.linked ? SIDES : []});
    const rf = L.room.frame({reach: sc.reach, draw: st.draw, lupa: sc.lens, readerX: sc.readerX, loc: sc.loc});
    Object.assign(nodes, rf.nodes);
    // (the party's chip travels with the party)
    const dx = (sc.readerX - G.restX) * C.k;
    C.chips.forEach((ch, i) => { if (ch) { nodes[`lab${i}`] = {opacity: 1}; nodes[`labw${i}`] = {transform: `translate(${r(i === R.reader ? dx : 0, 2)} 0)`}; } });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const hand = rf.hands[R.reader] ? R2(C.toD(rf.hands[R.reader])) : null;
    const locK = L.located.map(i => r(clamp(sc.loc[i] ?? 0), 3));
    return {
      nodes,
      semantic: {
        beat,
        lupaPhase: sc.phase,
        over: sc.over,
        located: L.located,
        locK,
        carry: r(sc.carry, 3),
        linkState: st.state,
        drawA: st.draw.a.map(q => r(q, 3)),
        drawB: st.draw.b.map(q => r(q, 3)),
        linksA: G.links.a.map(lk => lk.ex),
        linksB: G.links.b.map(lk => lk.ex),
        reaching: r(sc.k, 3),
        hand,
        lupa: R2(C.toD(sc.lens)),
        lupaScale: r(sc.lens.s, 3),
        grip: sc.reach ? R2(C.toD(sc.reach.target)) : null,
        tableRect: (() => { const b = C.bD(G.table); return {x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)}; })(),
        party: R2(C.toD({x: sc.readerX, y: G.seats[R.reader].y})),
        chipShift: r(dx, 2),
        tipA: rf.tips.a[0] ? R2(C.toD(rf.tips.a[0])) : null,
        tipB: rf.tips.b[0] ? R2(C.toD(rf.tips.b[0])) : null,
        positions: R.speakers.filter(sp => sp.index !== R.reader).map(sp => R2(C.toD(G.seats[sp.index]))),
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
        pxu: r(L.px, 4),
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
    slug: 'review-01-story',
    title: 'Identifying a ground — a magnifier locates the section a party intends to challenge (as supplied)',
    titleEs: 'Identificación de motivo — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Identificación de motivo',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic examination room seen from above. The decision\'s numbered placeholder sections lie on a table; a board along the top wall holds the two neutral labels supplied by the party, of the same size ("Factual discrepancy" ● and "Legal question raised" ◆ by default). The party takes a hand magnifier and, carrying it, walks along the table so that the lens passes over the sections; it stops over each section the party intends to challenge (as supplied), where a neutral frame settles — the same frame for either label. The magnifier is laid back and a line runs from each label to the section it is attached to (as supplied). Illustrative; the decision carries only placeholder text; nothing is evaluated, no section is said to be wrong, neither label is preferred and no outcome is drawn.',
    tags: ['review', 'challenge as supplied', 'magnifier', 'decision', 'sections', 'placeholder text', 'as supplied', 'equal weight', 'label board', 'floor plan', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/identificacion-motivo.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
