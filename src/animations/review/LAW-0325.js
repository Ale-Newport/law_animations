/**
 * LAW-0325 — Ruta de recurso · story
 *
 * Storyboard (a generic, fictional room seen from above: abstract bodies drawn as
 * stations of the SAME size on ONE row along the top wall, each with its intake
 * tray; the route configured by the user drawn on the floor as numbered neutral
 * steps between them; a placeholder decision sheet as the anchor; a generic
 * participant carries it; a status board on the bottom wall shows the supplied
 * route state; a wall calendar is a fixture only):
 *  0.00–0.15  rest: the stations with their names (as supplied), the configured
 *             route with its numbered steps, the sheet in the tray of the route's
 *             first body, the participant below it, the status board showing the
 *             supplied state (● available / ◆ not checked — equal weight).
 *  0.15–0.42  the action starts: the participant's hands go to the sheet (the
 *             cause) and lift it; carrying it, the participant follows step 1.
 *  0.42–0.73  every step in the supplied order: the sheet dips into the tray of
 *             each body it passes and is finally laid in the last body's tray;
 *             the hands let go. (Supplied state ◆ "not checked": the sheet stays
 *             in the first tray and its dashed outline — pending — traces the
 *             configured route instead; nobody moves.)
 *  0.73–1.00  hold: the sheet with its ● / ◆ pin; notes, state tag and the key
 *             "as supplied · no conclusion drawn". No rank, no admissibility, no
 *             time limit, no outcome: the route is only the supplied sequence.
 * @module animations/review/LAW-0325
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {pxPerUnit, R2, centreShiftY} from '../hearings/kits/apertura-audiencia.js';
import {rrFields, courierField, RR_EN, RR_ES, COURIER_EN, COURIER_ES, localisedRr, resolveRr, rrRoom, rrAction, composeRr, searchRr, rrRowNode} from './kits/ruta-recurso.js';

const ID = 'LAW-0325';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {reach: [0.15, 0.19], lift: [0.19, 0.22], carry: [0.22, 0.65], put: [0.65, 0.68], release: [0.68, 0.72], back: [0.71, 0.75], pin: [0.74, 0.78], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['route', 'stations', 'board', 'calendar'];
/** Item 18: the sheet and the stations are the acting objects — the sheet drawn at DOCK times its standard size. */
const DOCK = {landscape: 1.5, square: 1.35, portrait: 2.4};
const DEPTH = {landscape: 1, square: 1, portrait: 1.4};
const GAP = {landscape: 84, square: 70, portrait: 56};

const STRINGS = {
  en: {available: 'The document travelled the configured route (as supplied)', unchecked: 'Route not checked: the document stays in the first tray (as supplied)'},
  es: {available: 'La resolución recorrió la ruta configurada (según lo aportado)', unchecked: 'Ruta no comprobada: la resolución sigue en la primera bandeja (según lo aportado)'},
};

const OWN_EN = {
  courier: COURIER_EN,
  objectLabels: {body: 'Body (fictional): every station the same size, on one row', tray: 'Intake tray of each body', calendar: 'Wall calendar (no date marked)', ghost: 'Dashed outline: the configured route, pending (as supplied)'},
  annotations: [{target: 'route', text: 'Each step joins two bodies in the supplied order (as supplied)'}],
  stateCaption: '',
};
const OWN_ES = {
  courier: COURIER_ES,
  objectLabels: {body: 'Órgano (ficticio): todos del mismo tamaño, en una fila', tray: 'Bandeja de entrada de cada órgano', calendar: 'Calendario de pared (sin fechas marcadas)', ghost: 'Contorno discontinuo: la ruta configurada, pendiente (según lo aportado)'},
  annotations: [{target: 'route', text: 'Cada paso une dos órganos, en el orden indicado (según lo aportado)'}],
  stateCaption: '',
};
const EN = {...RR_EN, ...OWN_EN};
const ES = {...RR_ES, ...OWN_ES};

const sceneSchema = {
  ...rrFields,
  courier: courierField,
  objectLabels: obj('Captions of the room objects in the legend', {
    body: str('Caption for the bodies (stations of the same size)', 80),
    tray: str('Caption for the intake trays (neutral trays, never an admission filter)', 70),
    calendar: str('Caption for the wall calendar (a fixture only)', 70),
    ghost: str('Caption for the dashed outline drawn when the route is not checked (pending)', 90),
  }, ['body', 'tray', 'calendar', 'ghost']),
  actionProgress: num('How far the action is allowed to progress (1 = the whole configured route; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to (the stations are always ringed alike)', TARGETS),
    text: str('Note text', 100),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The route state supplied by the author (no conclusion is inferred): ● route available — the document travels it; ◆ route not checked — a pending state: the document stays in the first tray and a dashed outline traces the configured route', ['route-available', 'route-unchecked']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 110),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'route-available'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedRr(ctx, EN, ES);
    const R = resolveRr(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const side = P.finalState === 'route-unchecked' ? 'b' : 'a';
    // (neutral note inks: amber and the blue-grey accent — never green, which could read as approval)
    const noteColors = [ctx.theme.accent3, ctx.theme.accent2];
    // the bodies' names: on their stations when they fit there; otherwise (long names, narrow frames) each station
    // carries its letter and the names are listed in the panel, keyed to the letters
    const rowsFor = names => {
      const rows = [];
      if (showKey) {
        rows.push({kind: 'heading', text: P.labels.route, name: 'route-name'});
        rows.push({kind: 'legend', glyphKind: 'doc', text: P.decisions.title, name: 'lg-doc'});
        rows.push({kind: 'legend', glyphKind: 'person', text: P.courier.label, name: 'lg-person'});
        if (names === 'letters') R.bodies.forEach(b => rows.push({kind: 'legend', glyphKind: 'station', letter: b.letter, text: b.label, name: `lg-body${b.index}`}));
      }
      if (showAll) rows.push({kind: 'legend', glyphKind: names === 'letters' ? 'tray' : 'station', text: names === 'letters' ? `${P.objectLabels.body} · ${P.objectLabels.tray}` : P.objectLabels.body, name: 'lg-body'});
      if (showAll && names !== 'letters') rows.push({kind: 'legend', glyphKind: 'tray', text: P.objectLabels.tray, name: 'lg-tray'});
      if (showKey) {
        rows.push({kind: 'legend', glyphKind: 'step', text: P.labels.sequence, name: 'lg-step'});
        rows.push({kind: 'legend', glyphKind: 'started', text: P.outcomes.a, name: 'lg-a'});
        rows.push({kind: 'legend', glyphKind: 'pending', text: P.outcomes.b, name: 'lg-b'});
      }
      if (showAll && side === 'b') rows.push({kind: 'legend', glyphKind: 'ghost', text: P.objectLabels.ghost, name: 'lg-ghost'});
      if (showAll) rows.push({kind: 'legend', glyphKind: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
      if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
      if (showKey) rows.push({kind: 'state', text: P.stateCaption ? P.stateCaption : ctx.t[side === 'a' ? 'available' : 'unchecked'], name: 'state-tag'});
      if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
      return rows;
    };
    const docK = DOCK[ctx.view.shape];
    // standing floors (hearings measure the FIGURE): >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — the
    // stress floor of 45 px only when nothing composes at 1:1
    const search = (minPersonPx, names) => searchRr(ctx, rowsFor(names), {
      sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39], bandCols: [2, 3], sidePanels: [[0.44, 2], [0.5, 2]], bandMax: ctx.view.shape === 'square' ? 0.5 : 0.45,
      scales: [1, 1.12, 1.25],
      compose: (box, F, scale) => composeRr(ctx, P, R, box, F, {scale, text: showKey, names, numbers: showKey, courier: true, sign: true, untangle: {}, docK, gap: GAP[ctx.view.shape], depthK: DEPTH[ctx.view.shape], crop: 1.12, align: {x: 0.5, y: box.y + box.h < ctx.design.h - 1 ? 1 : 0.5}}),
    });
    const floor = ctx.view.shape === 'square' ? 55.5 : 61;
    const good = b => !b.problems.length && b.F * px >= 19.5 - 1e-6;
    // (names on the stations, or letters on them and the names in the panel: the one with the larger room — people and
    // stations — among those that keep the text floor)
    let best = search(floor, 'room');
    let names = 'room';
    if (showKey) {
      const b2 = search(floor, 'letters');
      const sc = b => (good(b) ? 1000 : 0) - 100 * b.problems.length + b.personPx * 2 + b.F * px * 3;
      if (sc(b2) > sc(best)) { best = b2; names = 'letters'; }
    }
    if (best.problems.length && ctx.view.shape === 'square') { best = search(45.5, 'letters'); names = 'letters'; }
    // (the chosen composition only: spare height deepens the route, spare width spreads the stations)
    const {F, lay} = best;
    const box = best.roomBox;
    const C = composeRr(ctx, P, R, box, F, {scale: best.scale, text: showKey, names, numbers: showKey, courier: true, sign: true, untangle: {}, docK, gap: GAP[ctx.view.shape], depthK: DEPTH[ctx.view.shape], crop: 1.12, deepen: 2.2, spread: 2.4, align: {x: 0.5, y: box.y + box.h < ctx.design.h - 1 ? 1 : 0.5}});
    if (C.problems.length) best.problems.push(...C.problems.filter(q => !best.problems.includes(q)));
    const G = C.G;
    const room = rrRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, numbers: showKey});
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      if (name === 'stations') return G.stations.map(s => ({x: s.x - mg * 0.7, y: s.y - mg * 0.7, w: s.w + mg * 1.4, h: s.h + mg * 1.4}));
      if (name === 'board') return {x: G.sign.x - mg * 0.6, y: G.sign.y - mg * 0.6, w: G.sign.w + mg * 1.2, h: G.sign.h + mg * 1.2};
      if (name === 'calendar') return {x: G.clock.cx - G.clock.R - 10, y: G.clock.cy - G.clock.R * 1.1 - 12, w: 2 * G.clock.R + 20, h: 2.2 * G.clock.R + 22};
      return null;
    };
    const pairMin = Math.min(1e9, ...G.discs.flatMap((d, i) => G.discs.slice(i + 1).map(q => Math.hypot(q.x - d.x, q.y - d.y))));
    const ringR = Math.max(G.DR + 3 / C.k, Math.min(G.DR + Math.max(9, 11 / C.k), pairMin / 2 - 4 / C.k));
    // ('route': a ring round every step disc alike — never touching a neighbour's ring —; 'stations': round every station
    // alike)
    const rings = showAll ? P.annotations.flatMap((a, i) => (a.target === 'route'
      ? G.discs.map(d => h('circle', {cx: r(d.x), cy: r(d.y), r: r(ringR), fill: 'none', stroke: noteColors[i % 2], 'stroke-width': r(4 / C.k, 2), 'data-target': a.target}))
      : [].concat(tgt(a.target)).map(b => h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: noteColors[i % 2], 'stroke-width': r(5 / C.k, 2), 'data-target': a.target})))) : [];
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox]);
    return {P, R, F, px, C, G, room, lay, rings, side, names, log: best.log, problems: best.problems, showKey, dyC, roomBox: best.roomBox, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rrRowNode(ctx, m, {name: m.name, look: L.R.courier.look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G} = L;
    const nodes = {};
    const cap = lerp(W.reach[0], W.release[1], clamp(P.actionProgress));
    const done = P.actionProgress >= 1;
    const ua = done ? u : Math.min(u, cap);
    const mode = L.side === 'a' ? 'carry' : 'ghost';
    const ac = rrAction(G, W, ua, {mode});
    const pinK = done ? seg(u, ...W.pin) : 0;
    const rf = L.room.frame({
      doc: ac.doc, ghost: ac.ghost, person: ac.person, reach: ac.reach, covers: ac.covers,
      route: {solid: L.side === 'a' ? 1 : 0, dashed: L.side === 'b' ? 1 : 0},
      sign: {a: L.side === 'a' ? 1 : 0, b: L.side === 'b' ? 1 : 0},
      pin: {a: L.side === 'a' ? pinK : 0, b: L.side === 'b' ? pinK : 0},
    });
    Object.assign(nodes, rf.nodes);
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const first = R.steps[0], last = R.steps[R.steps.length - 1];
    const near = q => G.stations.findIndex(s => Math.hypot(s.doc.x - q.x, s.doc.y - q.y) < 0.5);
    return {
      nodes,
      semantic: {
        beat,
        mode,
        phase: ac.phase,
        stepK: ac.stepK.map(q => r(q, 3)),
        docAt: near(ac.doc),
        ghostAt: ac.ghost && ac.ghost.op > 0 ? near(ac.ghost) : null,
        first,
        last,
        steps: R.steps,
        reaching: r(ac.k, 3),
        lift: r(ac.lift, 3),
        hand: rf.hand ? R2(C.toD(rf.hand)) : null,
        doc: R2(C.toD(ac.doc)),
        ghost: ac.ghost ? R2(C.toD(ac.ghost)) : null,
        person: R2(C.toD(ac.person)),
        grip: ac.reach ? R2(C.toD(ac.reach.targets[0])) : null,
        pin: r(pinK, 3),
        allReached: rf.reached,
        finalState: P.finalState,
        actionCapped: P.actionProgress < 1 && u > cap,
        stations: G.stations.map(s => ({x: r(C.toD(s).x), y: r(C.toD(s).y), w: r(s.w * C.k), h: r(s.h * C.k)})),
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        pxu: r(L.px, 4),
        personPx: r(100 * C.k * L.px, 1),
        roomBox: {x: r(L.roomBox.x), y: r(L.roomBox.y), w: r(L.roomBox.w), h: r(L.roomBox.h)},
        cols: L.cols,
        names: L.names,
        back: r(ac.back ?? 0, 3),
        roomSize: {W: r(G.W), H: r(G.H), needW: r(G.needW), needH: r(G.needH), k: r(C.k, 3), depthK: r(G.depthK, 2)},
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
    slug: 'review-02-story',
    title: 'Configured route — a participant carries a placeholder decision along the route configured between abstract bodies (as supplied)',
    titleEs: 'Ruta de recurso — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Ruta de recurso',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic room seen from above. Abstract, fictional bodies are drawn as stations of the same size on one row, each with an intake tray; the route configured by the user is drawn on the floor as numbered neutral steps between them (direction only from the supplied order, no arrowheads). A generic participant takes the placeholder decision sheet from the first body\'s tray and carries it along every step, dipping it into each tray it passes, and lays it in the last body\'s tray. With the supplied state "route not checked" (a pending state, dashed) the sheet stays in the first tray and its dashed outline traces the configured route. Illustrative; no rank, admissibility, time limit, ground or outcome is drawn; jurisdiction unspecified.',
    tags: ['review', 'configured route', 'as supplied', 'abstract bodies', 'equal size', 'placeholder decision', 'numbered steps', 'pending state', 'floor plan', 'no hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/ruta-recurso.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
