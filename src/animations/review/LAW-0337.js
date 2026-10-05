/**
 * LAW-0337 — Revisión de documentos · story
 *
 * Storyboard (a generic, fictional filing room seen from above: a wooden counter carries folder A — the ORIGINAL FILE,
 * lane colour blue, with the placeholder decision sheet ("resolución", content never shown) on top of its stack —, a
 * neutral standing divider, and folder B — the SEPARATE folder for the proposed additional pieces, lane colour amber —,
 * both drawn at the same size and stroke; the new pieces (placeholder sheets with an amber strip) wait in the intake
 * tray — at the right end of the counter (row arrangement), or on a lower counter across the participant's lane (stack
 * arrangement, used in tall boxes: the participant turns round with each piece); a status sign and a blank wall
 * calendar hang on the left wall):
 *  0.00–0.15  rest: both folders lie open (their front covers folded out to the left), the pieces in the tray, the
 *             participant waits under the divider; the sign is empty (no state before its beat).
 *  0.15–0.42  the action starts: the participant walks to folder A, takes the edge of its front cover in the left hand
 *             and swings it over the original stack — the original file is closed and stays where it is; then walks to
 *             the intake tray, puts both hands on the first piece (the cause) and lifts it.
 *  0.42–0.73  every piece in turn is carried — always on folder B's side of the divider — and laid in folder B, a little
 *             offset on the previous one; the hands let go each time. (● kept-separate: the participant then swings
 *             folder B's cover over its pieces too; ◆ open-for-review: folder B stays open, its pieces in view.) The
 *             participant steps back under the divider.
 *  0.73–1.00  hold: the supplied state on the sign (● both folders closed / ◆ folder B open — equal weight), notes, the
 *             state tag and the key "as supplied · no conclusion drawn". Nothing passes the divider; no rule on
 *             admissibility, no assessment of the pieces or of the noted reason, no time limit or outcome.
 * @module animations/review/LAW-0337
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {pxPerUnit, R2, centreShiftY} from '../hearings/kits/apertura-audiencia.js';
import {searchSa} from './kits/solicitud-autorizacion.js';
import {rdFields, courierField, RD_EN, RD_ES, COURIER_EN, COURIER_ES, localisedRd, resolveRd, rdRoom, composeRd, makePlan, evalPlan, planRecord, rdRowNode, rdTargets} from './kits/revision-de-documentos.js';

const ID = 'LAW-0337';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {plan: [0.15, 0.748], pin: [0.75, 0.79], notes: [0.76, 0.81], state: [0.77, 0.82]};
const TARGETS = ['original', 'additional', 'divider', 'calendar'];
/** Sheet size factor per arrangement (the folders and pieces are the acting objects — item 18). */
const DOCK = {row: 1.42, stack: 1.62};

const STRINGS = {
  en: {kept: 'The original file and the new pieces are kept in separate folders (as supplied)', open: 'The new pieces lie in their own open folder, apart from the original file (as supplied)'},
  es: {kept: 'El expediente original y las piezas nuevas quedan en carpetas separadas (según lo aportado)', open: 'Las piezas nuevas quedan en su propia carpeta abierta, aparte del expediente original (según lo aportado)'},
};

const OWN_EN = {
  courier: COURIER_EN,
  outcomes: {a: 'Kept in two closed folders (as supplied)', b: 'Folder B left open for review (as supplied)'},
  objectLabels: {intake: 'Intake tray of the new pieces', calendar: 'Wall calendar (no date marked)'},
  annotations: [{target: 'divider', text: 'The pieces stay on folder B’s side of the divider (as supplied)'}],
  stateCaption: '',
};
const OWN_ES = {
  courier: COURIER_ES,
  outcomes: {a: 'En dos carpetas cerradas (según lo aportado)', b: 'Carpeta B abierta para revisión (según lo aportado)'},
  objectLabels: {intake: 'Bandeja de entrada de las piezas nuevas', calendar: 'Calendario de pared (sin fechas marcadas)'},
  annotations: [{target: 'divider', text: 'Las piezas quedan del lado de la carpeta B (según lo aportado)'}],
  stateCaption: '',
};
const EN = {...RD_EN, ...OWN_EN};
const ES = {...RD_ES, ...OWN_ES};

const sceneSchema = {
  ...rdFields,
  courier: courierField,
  outcomes: obj('Captions of the two supplied states (equal weight; nothing is inferred from either)', {
    a: str('Caption of ● kept-separate: both folders closed', 80),
    b: str('Caption of ◆ open-for-review: folder B stays open', 80),
  }, ['a', 'b']),
  objectLabels: obj('Captions of the room objects in the legend', {
    intake: str('Caption for the intake tray', 70),
    calendar: str('Caption for the wall calendar (a fixture only)', 70),
  }, ['intake', 'calendar']),
  actionProgress: num('How far the action is allowed to progress (1 = every piece filed; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target in the room', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 100),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): ● kept-separate — folder B is closed over its pieces too; ◆ open-for-review — folder B stays open, its pieces in view', ['kept-separate', 'open-for-review']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 120),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'kept-separate'};
/** The localised defaults (tests resolve what a locale-'es' render shows). */
export const LOCALES = {en: EN, es: ES};

/** The participant's plan (template units). */
function storyPlan(G, n, kept) {
  // (the participant starts by folder A, beside the edge of its open cover)
  const start = G.coverPose(G.folderO, -1);
  const specs = [
    {type: 'wait', dur: 0.004},
    {type: 'reach', dur: 0.016, mode: 'cover', cover: 'A'},
    {type: 'close', dur: 0.05, cover: 'A'},
    {type: 'release', dur: 0.014},
  ];
  for (let i = 0; i < n; i++) {
    specs.push({type: 'walk', to: G.poseFor(G.trayAt(i))});
    specs.push({type: 'reach', dur: 0.017, mode: 'sheet'});
    specs.push({type: 'lift', dur: 0.007, piece: i, from: {kind: 'tray', i}});
    specs.push({type: 'walk', to: G.poseFor(G.slotN(i))});
    specs.push({type: 'put', dur: 0.007, to: {kind: 'slotN', i}});
    specs.push({type: 'release', dur: 0.017});
  }
  if (kept) {
    specs.push({type: 'walk', to: G.coverPose(G.folderN, -1)});
    specs.push({type: 'reach', dur: 0.014, mode: 'cover', cover: 'B'});
    specs.push({type: 'close', dur: 0.046, cover: 'B'});
    specs.push({type: 'release', dur: 0.014});
    // (a step back under folder B: clear of the right wall)
    specs.push({type: 'walk', to: G.poseFor(G.slotN(Math.max(0, n - 1)))});
  }
  // (the participant then stands in the lane, clear of the counters and walls)
  return makePlan(G, start, specs, W.plan, {kind: 'b'});
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 820], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedRd(ctx, EN, ES);
    const R = resolveRd(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const side = P.finalState === 'open-for-review' ? 'b' : 'a';
    const noteColors = [ctx.theme.accent3, ctx.theme.accent2];
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.labels.heading, name: 'heading'});
      rows.push({kind: 'legend', glyphKind: 'folderA', text: P.routes.original, name: 'lg-a'});
      rows.push({kind: 'legend', glyphKind: 'decision', text: P.decisions.title, name: 'lg-dec'});
      rows.push({kind: 'legend', glyphKind: 'folderB', text: P.routes.additional, name: 'lg-b'});
      rows.push({kind: 'legend', glyphKind: 'piece', text: `${P.labels.pieces}: ${R.pieces.map(q => q.label).join(' · ')}`, name: 'lg-pieces'});
      rows.push({kind: 'legend', glyphKind: 'divider', text: P.routes.divider, name: 'lg-divider'});
      rows.push({kind: 'legend', glyphKind: 'grounds', text: P.grounds, name: 'lg-grounds'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.courier.label, name: 'lg-person'});
    }
    if (showAll) rows.push({kind: 'legend', glyphKind: 'tray', text: P.objectLabels.intake, name: 'lg-tray'});
    if (showKey) {
      rows.push({kind: 'legend', glyphKind: 'started', text: P.outcomes.a, name: 'lg-sa'});
      rows.push({kind: 'legend', glyphKind: 'pending', text: P.outcomes.b, name: 'lg-sb'});
    }
    if (showAll) rows.push({kind: 'legend', glyphKind: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
    if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'note', color: noteColors[i % 2], text: a.text, name: `note${i}`}));
    if (showKey) rows.push({kind: 'state', text: P.stateCaption ? P.stateCaption : ctx.t[side === 'a' ? 'kept' : 'open'], name: 'state-tag'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    // (a tall box may grow the room's floor further: the room keeps most of a portrait frame)
    const optsFor = arr => ({arr, docK: DOCK[arr], person: true, sign: true, n: R.n, crop: ctx.view.shape === 'square' ? 1.2 : ctx.view.shape === 'portrait' ? 2.6 : 1.7, maxK: 125 / (100 * px)});
    const search = (arr, minPersonPx, sizes = [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4]) => searchSa(ctx, rows, {
      sizes, minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39], bandCols: [2, 3], sidePanels: [[0.38, 2], [0.44, 2], [0.5, 2]], bandMax: ctx.view.shape === 'square' ? 0.62 : 0.5,
      scales: [1], targetPx: 1e9,
      // (item 18: the room — folders, pieces, participant — is the subject: a larger room outweighs a larger panel text)
      scoreOf: C => C.k * 200,
      compose: (box) => composeRd(ctx, R, box, {...optsFor(arr), align: {x: 0.5, y: box.y + box.h < ctx.design.h - 1 ? 1 : 0.5}}),
    });
    const floor = ctx.view.shape === 'square' ? 55.5 : 61;
    const good = b => !b.problems.length && b.F * px >= 19.5 - 1e-6;
    const sc = b => (good(b) ? 1000 : 0) - 100 * b.problems.length + b.C.k * 200 + Math.min(b.personPx, 110) + b.F * px * 3;
    let best = null, arr = 'row';
    // (four pieces: the stack arrangement's turn with every piece would hurry the walk — item 19 — so the row is used)
    const arrs = R.n >= 4 ? ['row'] : ['row', 'stack'];
    for (const a of arrs) {
      const b = search(a, floor);
      if (!best || sc(b) > sc(best)) { best = b; arr = a; }
    }
    if (best.problems.length) for (const a of arrs) { const b = search(a, 45.5); if (b.problems.length < best.problems.length) { best = b; arr = a; } }
    // (item 18, near-maximum texts in a wide frame: when the panel would leave the room under half the width, the
    // panel's text steps down — never under the 16 px floor — so the room keeps the larger share; baseline texts always
    // compose above 19.5 px with the room over half the width, so this never applies to them)
    const share = b => b.C.planRect.w / ctx.design.w;
    if (ctx.view.shape === 'landscape' && share(best) < 0.5) {
      for (const a of arrs) {
        const b = search(a, 45.5, [19.2, 18.5, 17.8, 17.1, 16.4]);
        if (!b.problems.length && share(b) > share(best) * 1.12) { best = b; arr = a; }
      }
    }
    const {F, lay} = best;
    const box = best.roomBox;
    const C = composeRd(ctx, R, box, {...optsFor(arr), align: {x: 0.5, y: box.y + box.h < ctx.design.h - 1 ? 1 : 0.5}});
    const G = C.G;
    const room = rdRoom(ctx, G, {prefix: 'rm', R, person: true});
    const plan = storyPlan(G, R.n, side === 'a');
    const tg = rdTargets(G);
    const mg = 14;
    const rings = showAll ? P.annotations.map((a, i) => {
      const b0 = tg[a.target];
      // (the thin divider gets a wider ring, round its feet too)
      const b = a.target === 'divider' ? {x: b0.x - 22, y: b0.y - 8, w: b0.w + 44, h: b0.h + 16} : b0;
      return h('rect', {x: r(b.x - mg), y: r(b.y - mg), width: r(b.w + 2 * mg), height: r(b.h + 2 * mg), rx: 12, fill: 'none', stroke: noteColors[i % 2], 'stroke-width': r(5 / C.k, 2), 'data-target': a.target});
    }) : [];
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox]);
    return {P, R, F, px, C, G, room, plan, lay, rings, side, arr, problems: [...best.problems, ...C.problems.filter(q => !best.problems.includes(q))], dyC, roomBox: box, cols: best.cols};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rdRowNode(ctx, m, {name: m.name, look: L.R.courier.look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, g({name: 'rings', opacity: 0}, L.rings)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, G, plan} = L;
    const nodes = {};
    const done = P.actionProgress >= 1;
    const cap = lerp(W.plan[0], W.plan[1], clamp(P.actionProgress));
    const ua = done ? u : Math.min(u, cap);
    const ps = evalPlan(G, plan, ua);
    const pinK = done ? seg(u, ...W.pin) : 0;
    const rec = planRecord(G, ps);
    const rf = L.room.frame({...rec, sign: {a: L.side === 'a' ? pinK : 0, b: L.side === 'b' ? pinK : 0}});
    Object.assign(nodes, rf.nodes);
    nodes.rings = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name.startsWith('note')) nodes[mm.name] = {opacity: r(done ? seg(u, ...W.notes) : 0, 3)};
      else if (mm.name === 'state-tag') nodes[mm.name] = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    // every piece's centre (tray → hands → folder B): continuous tracks p0..p3 (absent pieces stay put)
    const pieceAt = i => {
      if (i >= R.n) return {x: 0, y: 0};
      const l = ps.loc[i];
      const q = l.kind === 'hand' ? ps.held : l.kind === 'slotN' ? G.slotN(l.i) : G.trayAt(i);
      return R2(C.toD(q));
    };
    const inB = Object.values(ps.loc).filter(l => l.kind === 'slotN').length;
    const inTray = Object.values(ps.loc).filter(l => l.kind === 'tray').length;
    const gripR = ps.targets && ps.targets[0] ? ps.targets[0] : null;
    const gripL = ps.targets && ps.targets[1] ? ps.targets[1] : null;
    return {
      nodes,
      semantic: {
        beat,
        phase: ps.phase,
        step: ps.step,
        arr: L.arr,
        n: R.n,
        inB,
        inTray,
        carried: ps.carried,
        coverA: r(ps.cA, 3),
        coverB: r(ps.cB, 3),
        reaching: r(ps.k, 3),
        lift: r(ps.lift, 3),
        handMode: ps.mode,
        p0: pieceAt(0), p1: pieceAt(1), p2: pieceAt(2), p3: pieceAt(3),
        person: R2(C.toD(ps.pose)),
        hand: rf.hand ? R2(C.toD(rf.hand)) : null,
        handL: rf.handL ? R2(C.toD(rf.handL)) : null,
        gripR: gripR ? R2(C.toD(gripR)) : null,
        gripL: gripL ? R2(C.toD(gripL)) : null,
        held: ps.held ? R2(C.toD(ps.held)) : null,
        divider: {x: r(C.toD(G.divider).x), y: r(C.toD(G.divider).y), w: r(G.divider.w * C.k), h: r(G.divider.h * C.k)},
        dividerX: r(C.toD({x: G.divider.x + G.divider.w / 2, y: 0}).x),
        pin: r(pinK, 3),
        allReached: rf.reached,
        finalState: P.finalState,
        actionCapped: P.actionProgress < 1 && u > cap,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        pxu: r(L.px, 4),
        personPx: r(100 * C.k * L.px, 1),
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
    slug: 'review-05-story',
    title: 'Document review — a participant closes the original file in its folder and files each new piece in a separate folder across a neutral divider (as supplied)',
    titleEs: 'Revisión de documentos — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Revisión de documentos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic filing room seen from above. Folder A holds the original file with a placeholder decision sheet on top; folder B, of the same size, is a separate folder for the proposed additional pieces; a neutral divider stands between them. A generic participant swings folder A\'s cover over the original file, then carries every new piece from the intake tray into folder B, always on its side of the divider. With the supplied state "kept separate" folder B is closed too; with "open for review" it stays open. Both states have equal weight (● / ◆). Illustrative; no admissibility rule, assessment, time limit or outcome is drawn; jurisdiction unspecified.',
    tags: ['review', 'document review', 'original file', 'new pieces', 'kept separate', 'divider', 'folders', 'floor plan', 'as supplied', 'filing'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/revision-de-documentos.js', 'src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
