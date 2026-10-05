/**
 * LAW-0329 — Solicitud de autorización · story
 *
 * Storyboard (a generic, fictional room seen from above: abstract stations of
 * the SAME size on ONE row along the top wall, each with a neutral two-slot
 * tray; the path configured by the user drawn on the floor as numbered neutral
 * steps between them; the last stop's tray is the prior-examination tray, marked
 * only by a small plain tab; a placeholder petition sheet as the anchor; a
 * generic participant carries it; a status sign on the left wall (low in the
 * corner with four stations at 9:16) shows the supplied state from the pin beat;
 * a wall calendar is a fixture only; with four stations at 1:1 each station's
 * letter stands beside its tray):
 *  0.00–0.15  rest: the stations with their names (as supplied), the configured
 *             path with its numbered steps, the petition in the first station's
 *             tray, the participant below it, the status sign still empty (no
 *             state is shown before the pin beat).
 *  0.15–0.42  the action starts: the participant's hands go to the petition (the
 *             cause) and lift it; carrying it, the participant follows step 1.
 *  0.42–0.73  every step in the supplied order: the petition dips into the tray
 *             of each station it passes and is laid in the prior-examination
 *             tray; the hands let go and the participant steps aside. (Supplied
 *             state ◆ "decision supplied": then the supplied decision's
 *             placeholder sheet — content never shown — is laid in the same
 *             tray's other slot.)
 *  0.73–1.00  hold: the petition with its ● pin (or the decision sheet with its ◆
 *             pin) and, over the same pin beat (0.74–0.78), the sign's ● / ◆
 *             (● authorization requested / ◆ decision supplied — equal weight); notes, state tag and the key "as supplied · no conclusion
 *             drawn". No criterion, threshold, time limit, rank or outcome: the
 *             path is only the supplied sequence and the decision only a supplied
 *             placeholder.
 * @module animations/review/LAW-0329
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {pxPerUnit, R2, centreShiftY} from '../hearings/kits/apertura-audiencia.js';
import {saFields, courierField, SA_EN, SA_ES, COURIER_EN, COURIER_ES, localisedSa, resolveSa, saRoom, saAction, composeSa, searchSa, saRowNode} from './kits/solicitud-autorizacion.js';

const ID = 'LAW-0329';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {reach: [0.15, 0.19], lift: [0.19, 0.22], carry: [0.22, 0.65], put: [0.65, 0.68], release: [0.68, 0.72], back: [0.71, 0.75], dec: [0.7, 0.74], pin: [0.74, 0.78], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['route', 'stations', 'board', 'calendar'];
/** Item 18: the sheets and the stations are the acting objects — the sheets drawn at DOCK times their standard size. */
const DOCK = {landscape: 1.4, square: 1.25, portrait: 1.9};
const DEPTH = {landscape: 1, square: 1, portrait: 1.4};
const GAP = {landscape: 84, square: 70, portrait: 56};
/** Item 18, four stations (long-labels-stress): the sheets' size factor with the compact stations (letters beside the trays at 1:1; sign low and narrower gaps at 9:16). */
const SIDE_DOCK = {square: 1.3, portrait: 1.47, landscape: 1.15};

const STRINGS = {
  en: {requested: 'The petition passed to the prior-examination tray (as supplied)', supplied: 'The petition passed to the prior-examination tray; the supplied decision lies beside it (as supplied)'},
  es: {requested: 'La petición pasó a la bandeja de examen previo (según lo aportado)', supplied: 'La petición pasó a la bandeja de examen previo; la decisión aportada está a su lado (según lo aportado)'},
};

const OWN_EN = {
  courier: COURIER_EN,
  objectLabels: {body: 'Station (fictional): every station the same size, on one row', tray: 'Two-slot tray of each station (neutral)', calendar: 'Wall calendar (no date marked)'},
  annotations: [{target: 'route', text: 'Each step joins two stations in the supplied order (as supplied)'}],
  stateCaption: '',
};
const OWN_ES = {
  courier: COURIER_ES,
  objectLabels: {body: 'Puesto (ficticio): todos del mismo tamaño, en una fila', tray: 'Bandeja de dos huecos de cada puesto (neutra)', calendar: 'Calendario de pared (sin fechas marcadas)'},
  annotations: [{target: 'route', text: 'Cada paso une dos puestos, en el orden indicado (según lo aportado)'}],
  stateCaption: '',
};
const EN = {...SA_EN, ...OWN_EN};
const ES = {...SA_ES, ...OWN_ES};

const sceneSchema = {
  ...saFields,
  courier: courierField,
  objectLabels: obj('Captions of the room objects in the legend', {
    body: str('Caption for the stations (all the same size)', 80),
    tray: str('Caption for the two-slot trays (neutral trays, never an admission gate)', 70),
    calendar: str('Caption for the wall calendar (a fixture only)', 70),
  }, ['body', 'tray', 'calendar']),
  actionProgress: num('How far the action is allowed to progress (1 = the whole configured path; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to (the stations are always ringed alike)', TARGETS),
    text: str('Note text', 100),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): ● authorization requested — the petition alone passes to the prior-examination tray; ◆ decision supplied — the supplied decision\'s placeholder sheet (content never shown) is then laid in the same tray\'s other slot', ['authorization-requested', 'decision-supplied']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 110),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'authorization-requested'};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedSa(ctx, EN, ES);
    const R = resolveSa(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const side = P.finalState === 'decision-supplied' ? 'b' : 'a';
    // (neutral note inks: amber and the blue-grey accent — never green, which could read as approval)
    const noteColors = [ctx.theme.accent3, ctx.theme.accent2];
    // the bodies' names: on their stations when they fit there; otherwise (long names, narrow frames) each station
    // carries its letter and the names are listed in the panel, keyed to the letters
    const rowsFor = names => {
      const rows = [];
      if (showKey) {
        rows.push({kind: 'heading', text: P.labels.route, name: 'route-name'});
        rows.push({kind: 'legend', glyphKind: 'doc', text: P.decisions.title, name: 'lg-doc'});
        if (side === 'b') rows.push({kind: 'legend', glyphKind: 'dec', text: P.decisions.supplied, name: 'lg-dec'});
        rows.push({kind: 'legend', glyphKind: 'person', text: P.courier.label, name: 'lg-person'});
        if (names === 'letters') R.bodies.forEach(b => rows.push({kind: 'legend', glyphKind: 'station', letter: b.letter, text: b.label, name: `lg-body${b.index}`}));
      }
      if (showAll) rows.push({kind: 'legend', glyphKind: names === 'letters' ? 'tray' : 'station', text: names === 'letters' ? `${P.objectLabels.body} · ${P.objectLabels.tray}` : P.objectLabels.body, name: 'lg-body'});
      if (showAll && names !== 'letters') rows.push({kind: 'legend', glyphKind: 'tray', text: P.objectLabels.tray, name: 'lg-tray'});
      if (showKey) {
        rows.push({kind: 'legend', glyphKind: 'step', text: P.labels.sequence, name: 'lg-step'});
        rows.push({kind: 'legend', glyphKind: 'exam', text: P.labels.exam, name: 'lg-exam'});
        rows.push({kind: 'legend', glyphKind: 'started', text: P.outcomes.a, name: 'lg-a'});
        rows.push({kind: 'legend', glyphKind: 'pending', text: P.outcomes.b, name: 'lg-b'});
      }
      if (showAll) rows.push({kind: 'legend', glyphKind: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
      if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
      if (showKey) rows.push({kind: 'state', text: P.stateCaption ? P.stateCaption : ctx.t[side === 'a' ? 'requested' : 'supplied'], name: 'state-tag'});
      if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
      return rows;
    };
    // (two-slot trays make a station twice as wide as in a one-slot room: with four stations the sheets are drawn a little
    // smaller, so the people keep their floors)
    const docK0 = DOCK[ctx.view.shape] * (R.n >= 4 ? (ctx.view.shape === 'square' ? 0.66 : 1) : R.n === 3 ? (ctx.view.shape === 'portrait' ? 1.06 : 0.9) : ctx.view.shape === 'landscape' ? 1.7 : 1.2);
    // (item 18, four stations: at 1:1 — a room bound by its height — the letters stand beside the trays, so the stations
    // are shorter and the trays and sheets larger; at 9:16 — bound by its width — the sign and calendar stand low on the
    // left wall and the gaps are narrower, so the row's width goes to larger trays and sheets)
    const four = R.n >= 4;
    const fourOpts = names => (four && ctx.view.shape === 'square' && names === 'letters' ? {letterSide: true, docK: DOCK.square * SIDE_DOCK.square, gap: 46}
      : four && ctx.view.shape === 'portrait' ? {signLow: true, docK: DOCK.portrait * SIDE_DOCK.portrait, gap: 44}
      : four && ctx.view.shape === 'landscape' ? {docK: DOCK.landscape * SIDE_DOCK.landscape, gap: 52} : {});
    const docKFor = names => fourOpts(names).docK ?? docK0;
    const gapFor = names => fourOpts(names).gap ?? GAP[ctx.view.shape];
    const sideFor = names => { const q = fourOpts(names); return {letterSide: q.letterSide, signLow: q.signLow}; };
    // (item 18, four stations at 16:9 — fix-review-03: the long station names fill the legend beside the room, so the
    // two-column panel may be narrower — its rows wrap onto more lines — and the gaps between the stations tighter, so
    // the row, its trays and sheets take the width)
    const fourWide = four && ctx.view.shape === 'landscape';
    // (the rendered share of the frame width of the petition and of a tray in a composition — 1080p px per frame width)
    const frameW = ctx.view.width * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const shares = C => ({doc: C.G.DW * C.k * px / frameW, tray: C.G.TW * C.k * px / frameW});
    // (the acting objects' floors, with a small margin over the tests': a composition below them loses to any that keeps
    // them, whatever its text size)
    const tall = ctx.view.shape === 'portrait';
    const shareMin = four ? {doc: tall ? 0.082 : 0.0365, tray: tall ? 0.184 : ctx.view.shape === 'square' ? 0.082 : 0.093}
      : {doc: tall ? 0.092 : 0.047, tray: tall ? 0.184 : 0.093};
    const shareScore = C => { if (C.dominated) return -1e6; const q = shares(C); return (q.doc < shareMin.doc || q.tray < shareMin.tray ? -700 : 0) + (ctx.view.shape === 'square' ? 1500 * q.doc : 0); };
    // (cold create stays within its budget — fix-review-03: every composition is computed once per layout (the searches
    // with and without the stress people floor try the same boxes, sizes and scales); and a larger room scale is only
    // composed where scale 1 at the same box and text size has problems — a larger room at the same text size only makes
    // the people, stations and sheets smaller, so it never scores better —, and never where scale 1 is already too small
    // ('room-tiny': a larger scale is smaller still). usedScale: the scale the composition was made at.)
    const memo = new Map();
    const composed = [];
    const keyOf = (box, F, scale, names) => `${names}|${r(box.x, 2)}|${r(box.y, 2)}|${r(box.w, 2)}|${r(box.h, 2)}|${r(F, 4)}|${scale}`;
    const composeAt = (box, F, scale, names) => {
      const key = keyOf(box, F, scale, names);
      if (memo.has(key)) return memo.get(key);
      if (scale > 1) {
        const c1 = memo.get(keyOf(box, F, 1, names));
        if (c1 && (!c1.problems.length || c1.problems.includes('room-tiny'))) { memo.set(key, c1); return c1; }
      }
      // (a box no larger than one that already composed without problems, at a text size no larger, can only give a
      // smaller room and smaller text: it is not composed — it could never score better. It stands in as composable, so
      // the size search still climbs to the larger text sizes, but scores far below every real composition)
      const dom = composed.find(q => !q.tiny && q.names === names && q.box.w >= box.w - 0.01 && q.box.h >= box.h - 0.01 && q.F >= F - 1e-6);
      if (dom) { const Cd = {...dom.C, problems: [], dominated: true, usedScale: scale}; memo.set(key, Cd); return Cd; }
      // (and a box no larger than one already too small for its room ('room-tiny'), at a text size no smaller, is too
      // small as well)
      const tiny = composed.find(q => q.tiny && q.names === names && q.box.w >= box.w - 0.01 && q.box.h >= box.h - 0.01 && q.F <= F + 1e-6);
      if (tiny) { const Ct = {...tiny.C, problems: [...tiny.C.problems], usedScale: scale}; memo.set(key, Ct); return Ct; }
      const C0 = composeSa(ctx, P, R, box, F, {scale, text: showKey, names, numbers: showKey, courier: true, sign: true, untangle: {clearPx: ctx.view.shape === 'square' ? 16.5 : 18}, docK: docKFor(names), gap: gapFor(names), ...sideFor(names), tabPad: 9, depthK: DEPTH[ctx.view.shape], crop: 1.12, align: {x: 0.5, y: box.y + box.h < ctx.design.h - 1 ? 1 : 0.5}});
      C0.usedScale = scale;
      memo.set(key, C0);
      if (!C0.problems.length || C0.problems.includes('room-tiny')) composed.push({names, box, F, C: C0, tiny: C0.problems.includes('room-tiny')});
      return C0;
    };
    // standing floors (hearings measure the FIGURE): >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — the
    // stress floor of 45 px only when nothing composes at 1:1
    const search = (minPersonPx, names) => searchSa(ctx, rowsFor(names), {
      sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39], bandCols: [2, 3, 4], sidePanels: fourWide ? [[0.3, 2], [0.34, 2], [0.38, 2], [0.44, 2]] : [[0.44, 2], [0.5, 2]], bandMax: ctx.view.shape === 'square' ? 0.6 : 0.45,
      // (four stations at 1:1: a narrower gap between the room and the panel under it — item 18)
      ...(four && ctx.view.shape === 'square' && names === 'letters' ? {bandGap: 16} : {}),
      scales: [1, 1.12, 1.25],
      scoreOf: shareScore,
      compose: (box, F, scale) => composeAt(box, F, scale, names),
    });
    const floor = ctx.view.shape === 'square' ? 55.5 : 61;
    const good = b => !b.problems.length && b.F * px >= 19.5 - 1e-6;
    // (names on the stations, or letters on them and the names in the panel: the one with the larger room — people and
    // stations — among those that keep the text floor)
    let best = search(floor, 'room');
    let names = 'room';
    if (showKey) {
      const b2 = search(floor, 'letters');
      const sc = b => (good(b) ? 1000 : 0) - 100 * b.problems.length + b.personPx * 2 + b.F * px * 3 + shareScore(b.C);
      if (sc(b2) > sc(best)) { best = b2; names = 'letters'; }
    }
    // (long-labels-stress keeps >= 45 px at every ratio — STRESS PEOPLE FLOOR OFF 1:1, 2026-10-05; the tests hold the
    // non-stress presets to 60 / 55 px)
    if (best.problems.length) { const b3 = search(45.5, 'letters'); if (b3.problems.length < best.problems.length) { best = b3; names = 'letters'; } }
    // (the chosen composition only: spare height deepens the route, spare width spreads the stations)
    const {F, lay} = best;
    const box = best.roomBox;
    const C = composeSa(ctx, P, R, box, F, {scale: best.C.usedScale ?? best.scale, text: showKey, names, numbers: showKey, courier: true, sign: true, untangle: {clearPx: ctx.view.shape === 'square' ? 16.5 : 18}, docK: docKFor(names), gap: gapFor(names), ...sideFor(names), tabPad: 9, depthK: DEPTH[ctx.view.shape], crop: 1.12, deepen: ctx.view.shape === 'portrait' ? 4.2 : R.n <= 2 ? 3.5 : 2.2, spread: R.n <= 2 ? 4 : 2.4, align: {x: 0.5, y: box.y + box.h < ctx.design.h - 1 ? 1 : 0.5}});
    if (C.problems.length) best.problems.push(...C.problems.filter(q => !best.problems.includes(q)));
    const G = C.G;
    const room = saRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, numbers: showKey, dec: true, ghost: false});
    const mg = Math.max(12, 16 / C.k);
    const tgt = name => {
      // (the rings round neighbouring stations never touch: sideways at most a little under half the gap between them)
      const ms = Math.min(mg * 0.7, Math.max(4 / C.k, G.gap / 2 - 7 / C.k));
      if (name === 'stations') return G.stations.map(s => ({x: s.x - ms, y: s.y - mg * 0.7, w: s.w + ms * 2, h: s.h + mg * 1.4}));
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
    const panel = L.lay ? L.lay.rows.map(m => saRowNode(ctx, m, {name: m.name, look: L.R.courier.look})) : [];
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
    const mode = 'carry';
    const ac = saAction(G, W, ua, {mode});
    const pinK = done ? seg(u, ...W.pin) : 0;
    // (◆ decision supplied: once the petition is laid, the decision's placeholder sheet is laid in the other slot — it
    // comes down from above: a little larger and fading in as it settles)
    const decK = done && L.side === 'b' ? ease.inOutCubic(seg(u, ...W.dec)) : 0;
    const rf = L.room.frame({
      doc: ac.doc, person: ac.person, reach: ac.reach, covers: ac.covers,
      route: {solid: 1},
      // (item 9: the sign stays empty — no state — until the pin beat, when the supplied state's glyph and icon come in
      // together with the pin; nothing was on the sign before, so nothing has to leave first)
      sign: {a: L.side === 'a' ? pinK : 0, b: L.side === 'b' ? pinK : 0},
      pin: {a: L.side === 'a' ? pinK : 0},
      dec: {op: decK, s: lerp(1.12, 1, decK), pin: {b: L.side === 'b' ? pinK : 0}},
    });
    Object.assign(nodes, rf.nodes);
    // (fix-review-03: while the sheet passes near a step disc the WHOLE disc fades with its number — never an empty white
    // circle; the room hides only the number, so its opacity is moved to the disc's group)
    G.discs.forEach((_, j) => {
      const n = nodes[`rm-step${j}-n`];
      if (!n) return;
      nodes[`rm-step${j}`] = {opacity: n.opacity};
      nodes[`rm-step${j}-n`] = {opacity: 1};
    });
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
        decShown: r(decK, 3),
        decAt: R.exam,
        first,
        last,
        steps: R.steps,
        reaching: r(ac.k, 3),
        lift: r(ac.lift, 3),
        hand: rf.hand ? R2(C.toD(rf.hand)) : null,
        doc: R2(C.toD(ac.doc)),
        person: R2(C.toD(ac.person)),
        grip: ac.reach ? R2(C.toD(ac.reach.targets[0])) : null,
        pin: r(pinK, 3),
        sign: r(pinK, 3),
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
    slug: 'review-03-story',
    title: 'Authorization request — a participant carries a placeholder petition along a configured path into a neutral prior-examination tray (as supplied)',
    titleEs: 'Solicitud de autorización — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Solicitud de autorización',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic room seen from above. Abstract, fictional stations of the same size stand on one row, each with a neutral two-slot tray; the path configured by the user is drawn on the floor as numbered neutral steps between them (direction only from the supplied order, no arrowheads); the last stop\'s tray is the prior-examination tray, marked only by a small plain tab. A generic participant takes the placeholder petition from the first station\'s tray, carries it along every step, dipping it into each tray it passes, and lays it in the prior-examination tray. With the supplied state "decision supplied" the supplied decision\'s placeholder sheet (content never shown) is then laid in the same tray\'s other slot. Both states have equal weight (● / ◆). Illustrative; no criterion, threshold, time limit, rank or outcome is drawn; jurisdiction unspecified.',
    tags: ['review', 'authorization request', 'petition', 'prior-examination tray', 'as supplied', 'abstract stations', 'equal size', 'placeholder decision', 'numbered steps', 'floor plan', 'no hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
