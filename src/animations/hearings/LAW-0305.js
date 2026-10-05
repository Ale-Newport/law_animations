/**
 * LAW-0305 — Declaración experta en audiencia · story
 *
 * Storyboard (a generic, fictional hearing room seen from above; the room is
 * the anchor, the participants the counterpart, the wall clock the support,
 * the chart the exhibit):
 *  0.00–0.15  rest: the chart sheet lies on its exhibit on the low cabinet; the
 *             display board along the top wall shows its two empty places; the
 *             specialist stands at the lectern beside the board; the others sit
 *             at the shared table (same chairs, no hierarchy).
 *  0.15–0.42  the action starts: the specialist points to the board (the cause);
 *             the chart leaves the cabinet, travels along the free lane under
 *             the board and settles on its place, growing to a full sheet; its
 *             fictional reference tag (● measurement, as supplied) arrives.
 *  0.42–0.73  a band marks the supplied span of points; the specialist raises a
 *             hand again and the explanation card comes out of it to its place
 *             (a copy of the span's line and generic bars, never text); a
 *             connector draws from the marked span to the card, and the caption
 *             (◆ the specialist's interpretation, as supplied) arrives.
 *  0.73–1.00  hold: the chart and the connected explanation on the board; notes,
 *             state tag and the key "as supplied · no conclusion drawn". Nothing
 *             is assessed: the interpretation is neither right nor wrong,
 *             accepted nor rejected; no expert-evidence rule, weight or outcome.
 * @module animations/hearings/LAW-0305
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, speakerChipNode, R2, searchLayout, centreShiftY} from './kits/apertura-audiencia.js';
import {dxFields, DX_EN, DX_ES, resolveDx, dxRows, dxRowNode, dxRoom, dxTiming, dxStageAt, composeDx, zoneFit} from './kits/declaracion-experta.js';

const ID = 'LAW-0305';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {action: [0.16, 0.72], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['board', 'chart', 'explanation', 'cabinet', 'clock'];

const STRINGS = {
  en: {both: 'The chart and the explanation are connected on the board (as supplied)', one: 'The chart is on the board; no explanation is connected (as supplied)'},
  es: {both: 'Gráfico y explicación conectados en el tablero (aportado)', one: 'Gráfico en el tablero; sin explicación conectada (aportado)'},
};

const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {board: 'Display board with two places', lectern: 'Lectern beside the board', cabinet: 'Exhibit cabinet', clock: 'Wall clock (support)'},
  annotations: [{target: 'chart', text: 'The chart comes from its exhibit on the cabinet (as configured)'}],
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {board: 'Tablero con dos lugares', lectern: 'Atril junto al tablero', cabinet: 'Armario de pruebas', clock: 'Reloj de pared (soporte)'},
  annotations: [{target: 'chart', text: 'El gráfico viene de su prueba (según lo configurado)'}],
};
const EN = {...DX_EN, ...OWN_EN};
const ES = {...DX_ES, ...OWN_ES};

const sceneSchema = {
  ...dxFields,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    board: str('Caption for the display board', 60),
    lectern: str('Caption for the lectern', 60),
    cabinet: str('Caption for the exhibit cabinet', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['board', 'lectern', 'cabinet', 'clock']),
  actionProgress: num('How far the action is allowed to progress (1 = the chart and the connected explanation on the board; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['interpretation-connected', 'measurement-only']),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'interpretation-connected'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveDx(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const withDetail = P.finalState !== 'measurement-only';
    const noteColors = [ctx.theme.accent3, ctx.theme.accent4];
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showKey) {
      rows.push(...dxRows(R, P, 'lg', {noDetail: !withDetail}));
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
    // standing floors: >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — only when nothing composes at 1:1
    // does the stress floor of 45 px apply
    const search = minPersonPx => searchLayout(ctx, P, R, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4],
      compose: (box, F, scale) => composeDx(ctx, P, R, box, F, {scale, chips: showKey, text: showKey}),
    });
    let best = search(ctx.view.shape === 'square' ? 55.5 : 61);
    if (best.problems.length && ctx.view.shape === 'square') best = search(45);
    const {F, C, lay} = best;
    const G = C.G;
    const room = dxRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, tagFit: G.tagFit, capFit: G.capFit, noDetail: !withDetail});
    // (rings stand clear of their target by a screen margin: never across a text inside it)
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      if (name === 'board') return {x: G.board.x - mg, y: G.board.y - 4, w: G.board.w + 2 * mg, h: G.board.h + mg};
      // (the chart with its tag, the card with its caption: the ring encloses the wider of the two)
      const around = (a0, b0) => { const x0 = Math.min(a0.x, b0.x), x1 = Math.max(a0.x + a0.w, b0.x + b0.w); return {x: x0 - mg * 0.8, y: a0.y - mg * 0.8, w: x1 - x0 + mg * 1.6, h: b0.y + b0.h - a0.y + mg * 1.6}; };
      if (name === 'chart') return around(G.page, G.tagBox);
      if (name === 'explanation') return around(G.zone, G.capBox);
      if (name === 'clock') return {x: G.clock.cx - G.clock.R - 8, y: G.clock.cy - G.clock.R - 8, w: 2 * G.clock.R + 16, h: 2 * G.clock.R + 16, round: true};
      return G.cab ? {x: G.cab.x - 8, y: G.cab.y - 8, w: G.cab.w + 16, h: G.cab.h + 16} : {x: G.lectern.cx - 42, y: G.lectern.cy - 32, w: 84, h: 64};
    };
    const rings = showAll ? P.annotations.map((a, i) => {
      const b = tgt(a.target === 'explanation' && !withDetail ? 'chart' : a.target);
      const col = noteColors[i % 2];
      return b.round
        ? h('circle', {cx: r(b.x + b.w / 2), cy: r(b.y + b.h / 2), r: r(b.w / 2), fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)})
        : h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 10, fill: 'none', stroke: col, 'stroke-width': r(5 / C.k, 2)});
    }) : [];
    const TM = dxTiming(W.action[0], W.action[1]);
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox, ...C.chips.map(ch => ch && ch.box)]);
    return {P, R, F, px, C, G, room, lay, rings, withDetail, TM, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => dxRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
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
    const st = dxStageAt(G, R, TM, ua, {noDetail: !L.withDetail});
    const rf = L.room.frame({clockDeg: 36 * clamp(u / 0.8), doc: st.doc, tag: st.tag, frame: st.frame, zoom: st.zoom, link: st.link, cap: st.cap, reach: st.reach});
    Object.assign(nodes, rf.nodes);
    C.chips.forEach((ch, i) => { if (ch) nodes[`lab${i}`] = {opacity: 1}; });
    const done = P.actionProgress >= 1;
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const rr = G.PL.regionRect(R.region.from, R.region.to);
    const zf = zoneFit(G, rr);
    return {
      nodes,
      semantic: {
        beat,
        chart: R2(C.toD(st.doc)),
        chartScale: r(st.doc.s, 3),
        chartState: st.docState,
        tag: r(st.tag, 3),
        span: r(st.frame, 3),
        card: r(st.zoom, 3),
        link: r(st.link, 3),
        explanationState: st.zoneState,
        caption: r(st.cap, 3),
        gesture: r(st.gesture, 3),
        hand: rf.hands[R.presenter] ? R2(C.toD(rf.hands[R.presenter])) : null,
        pointing: r(st.k, 3),
        sheet: R2(C.toD({x: G.page.x, y: G.page.y})),
        cardAt: R2(C.toD({x: G.zone.x, y: G.zone.y})),
        spanZoom: r(zf.z, 3),
        spanPoints: [R.region.from, R.region.to],
        points: R.lines,
        order: R.order.join('>'),
        boardLeft: G.left,
        forms: R.items.map(it => it.form),
        ops: R.items.map(it => it.op),
        roles: {specialist: R.presenter, listeners: R.listeners},
        measurementI: R.docI,
        interpretationI: R.detI,
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
    slug: 'hearings-07-story',
    title: 'Expert statement at a hearing — a chart connects with a specialist\'s explanation',
    titleEs: 'Declaración experta en audiencia — Microescena con objetos y actores',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Declaración experta en audiencia',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic hearing room seen from above. The specialist points to the display board; the chart leaves its exhibit on the cabinet, travels along the lane under the board and settles on its place, with its fictional reference (● measurement, as supplied). A band marks the supplied span of points; the specialist raises a hand and an explanation card comes out of it to its place (a copy of the span\'s line and generic bars), and a connector draws from the span to the card (◆ the specialist\'s interpretation, as supplied). Fictional data; illustrative; the interpretation is neither right nor wrong, and no rule, weight or outcome is shown.',
    tags: ['hearing', 'specialist', 'expert statement', 'chart', 'measurement', 'interpretation', 'explanation', 'marked span', 'connector', 'as supplied', 'cabinet', 'floor plan', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/declaracion-experta.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
