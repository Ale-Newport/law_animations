/**
 * LAW-0517 — Cláusula de cambio · story
 *
 * Storyboard (a procedure track on the desk: start tray → one station per supplied step → the contract):
 *  0.00–0.15  rest: the contract "CT-517 · Supply contract (fictional)" with its change-clause block ("Clause 18 ·
 *             Changes procedure", page-and-pencil disc); the start tray holds the amendment sheet "Amendment 1
 *             (fictional)"; one station per supplied step ("Proposal in writing", "Reviewed by both parties", "Signed by
 *             both parties"), each with a gantry, a press head showing its step pips, a stop pad and a step plate; the
 *             rail is unlit; the loupe rests beside the tray.
 *  0.04–0.30  the loupe slides over the change clause (the block lights); the rail lights from the clause back to the
 *             tray — the procedure the clause sets out; the loupe returns to its place.
 *  0.25–0.65  the sheet slides out of the tray and travels the track: it stops on each station's pad, the press head
 *             lowers onto its edge and lifts, leaving one layer tab, and the station lamp lights; then it moves on.
 *  0.65–0.75  after the last station the sheet joins the contract (laid over its lower part) and a binder clip closes.
 *  0.75–1.00  hold: the contract with the clipped amendment carrying one tab per supplied step; the note "The proposal
 *             followed the steps as supplied" and the key "As supplied · no conclusion drawn".
 * Only the supplied steps are drawn; no doctrine on whether a change is valid or effective; no outcome.
 * @module animations/contract-terms/LAW-0517
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {list, annotation} from '../../schemas/fields.js';
import {
  CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, stepsField, proposalField, localizeScene, unitPx, T,
  contractDoc, amendmentSheet, binderClip, loupe, loupeBox, trayBack, trayLip, notesStrip, trackGeom, stationNode, railNode, railFrame,
  overlaps, bx,
} from './kits/clausula-cambio.js';

const ID = 'LAW-0517';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {loupeTo: [0.02, 0.16], hl: [0.15, 0.19], rail: [0.17, 0.27], loupeBack: [0.2, 0.33], travel: [0.28, 0.645], attach: [0.645, 0.715], clip: [0.71, 0.75], note: [0.745, 0.79], key: [0.76, 0.8], ann: [0.77, 0.81]};
const STRINGS = {
  en: {...KIT_STRINGS.en, followed: 'The proposal followed the steps as supplied'},
  es: {...KIT_STRINGS.es, followed: 'La propuesta recorrió los pasos según lo aportado'},
};

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  steps: stepsField,
  proposal: proposalField,
  annotations: list('Editorial callouts shown in the final hold', annotation(['contract', 'proposal', 'steps']), 0, 2),
};
const defaultParams = {...CONTENT, annotations: []};
const defaultParamsEs = {...CONTENT_ES};

const isStress = p => [p.contract.title, p.clause, p.proposal, ...p.steps].some(t => t.length > 36) || p.annotations.length > 1;

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const pad = 14;
  const notes = [];
  if (show) notes.push({name: 'note', kind: 'note0', text: ctx.t.followed, fill: ctx.theme.accent2Soft});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const ns = notesStrip(ctx, notes, F, minF);
  const A = {x: pad, y: pad + 8, w: D.w - pad * 2, h: D.h - pad * 2 - 8 - (ns.nh ? ns.nh + 20 : 0)};
  const G = trackGeom(ctx, A, F, minF, p, {stress});
  const why = [...G.why];
  const {pl, bad} = ns.place();
  if (bad) why.push('note-text');
  // the parked loupe must not cover a plate, the tray, a pad or the contract
  const lb = loupeBox(G.loupeRest.x, G.loupeRest.y, G.LR);
  const S0 = G.stops[0];
  const boxes = [{x: G.C.x, y: G.C.y, w: G.C.w, h: G.C.h}, {x: S0.x - 20, y: S0.y - 18, w: G.sw + 40, h: G.sh + 36}, ...G.stations.map(st => st.plate)];
  if (boxes.some(b => overlaps(b, lb, 2)) || lb.x < 0 || lb.y < 0 || lb.x + lb.w > D.w || lb.y + lb.h > A.y + A.h + 6) why.push('loupe-rest');
  return {...G, ok: !why.length, why, F, minF, A, notesPl: pl, boxes};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1600]},
  layout(ctx) {
    const upx = unitPx(ctx);
    const stress = isStress(ctx.params);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [26, 24, 22.5, 21, 20.2]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const show = ctx.show('all');
    const C = L.C;
    const S0 = L.stops[0];
    const st = L.stations.map(s => stationNode(ctx, L, s, '', show));
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    const clipW = Math.min(64, L.sw * 0.3);
    return g({name: 'scene'},
      g({transform: T(C.x, C.y)}, contractDoc(ctx, {w: C.w, h: C.h, head: L.head, headH: L.headH, headX: L.headX, clause: L.clause, attach: L.attachArea, showText: show, prefix: '', discR: L.discR})),
      railNode(ctx, L, ''),
      g({transform: T(S0.x, S0.y)}, trayBack(ctx, L.sw, L.sh)),
      st.map(s => s.under),
      st.map(s => s.plate),
      g({name: 'sheet', transform: T(S0.x, S0.y)}, amendmentSheet(ctx, {w: L.sw, h: L.sh, fit: L.propFit, showText: show, name: 'am', n: L.n, edge: L.edge, headH: L.sheetHeadH})),
      g({transform: T(S0.x, S0.y)}, trayLip(ctx, L.sw, L.sh)),
      st.map(s => s.press),
      g({name: 'clip', transform: T(L.attach.x + L.sw * 0.16, L.attach.y - 60), opacity: 0}, binderClip(ctx, 'clip-art', clipW)),
      g({name: 'loupe', transform: T(L.loupeRest.x, L.loupeRest.y)}, loupe(ctx, 'loupe-art', L.LR)),
      notes,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const n = L.n;
    // loupe: rest → clause → rest
    const q1 = ease.inOutSine(seg(u, ...W.loupeTo)), q2 = ease.inOutSine(seg(u, ...W.loupeBack));
    const lp = u < W.loupeBack[0]
      ? {x: lerp(L.loupeRest.x, L.reads.x, q1), y: lerp(L.loupeRest.y, L.reads.y, q1) - Math.sin(q1 * Math.PI) * 26}
      : {x: lerp(L.reads.x, L.loupeRest.x, q2), y: lerp(L.reads.y, L.loupeRest.y, q2) - Math.sin(q2 * Math.PI) * 26};
    nodes.loupe = {transform: T(r(lp.x, 2), r(lp.y, 2))};
    nodes['clause-hl'] = {opacity: r(seg(u, ...W.hl), 3)};
    const railQ = ease.inOutSine(seg(u, ...W.rail));
    Object.assign(nodes, railFrame('', L, railQ));
    // travel: n legs (move, press down, press up)
    const [t0, t1] = W.travel;
    const d = (t1 - t0) / n;
    let sp = {...L.stops[0]};
    let tabs = 0, at = 0;
    const presses = [];
    for (let k = 0; k < n; k++) {
      const a = t0 + k * d;
      const mv = ease.inOutCubic(seg(u, a, a + d * 0.5));
      const down = ease.inOutSine(seg(u, a + d * 0.52, a + d * 0.72));
      const up = ease.inOutSine(seg(u, a + d * 0.74, a + d * 0.94));
      if (u >= a) { const A0 = L.stops[k], A1 = L.stops[k + 1]; sp = {x: lerp(A0.x, A1.x, mv), y: lerp(A0.y, A1.y, mv)}; at = mv >= 1 ? k + 1 : at; }
      const pq = down * (1 - up);
      const s = L.stations[k];
      const hp = {x: lerp(s.rest.x, s.contact.x, pq), y: lerp(s.rest.y, s.contact.y, pq)};
      nodes[`press${k}`] = {transform: T(r(hp.x, 2), r(hp.y, 2))};
      const tabOn = down >= 1 ? 1 : 0;
      nodes[`am-tab${k}`] = {opacity: tabOn};
      nodes[`lamp${k}`] = {opacity: r(clamp(seg(u, a + d * 0.7, a + d * 0.8)), 3)};
      tabs += tabOn;
      presses.push({x: r(hp.x), y: r(hp.y)});
    }
    // attach leg
    const aq = ease.inOutCubic(seg(u, ...W.attach));
    if (aq > 0) {
      const S = L.stops[n];
      if (L.lastLeg) {
        const pts = L.lastLeg;
        const l1 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), l2 = Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y);
        const s = aq * (l1 + l2);
        sp = s <= l1 ? {x: lerp(pts[0].x, pts[1].x, s / l1), y: lerp(pts[0].y, pts[1].y, s / l1)} : {x: lerp(pts[1].x, pts[2].x, (s - l1) / l2), y: lerp(pts[1].y, pts[2].y, (s - l1) / l2)};
      } else sp = {x: lerp(S.x, L.attach.x, aq), y: lerp(S.y, L.attach.y, aq)};
    }
    nodes.sheet = {transform: T(r(sp.x, 2), r(sp.y, 2))};
    const cq = ease.outCubic(seg(u, ...W.clip));
    nodes.clip = {transform: T(r(L.attach.x + L.sw * 0.16, 2), r(L.attach.y - 60 * (1 - cq), 2)), opacity: r(clamp(cq * 3), 3)};
    const noteO = seg(u, ...W.note), keyO = seg(u, ...W.key), annO = seg(u, ...W.ann);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'ann' ? annO : noteO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const parked = u < W.loupeTo[0] || u >= W.loupeBack[1];
    const lb = loupeBox(lp.x, lp.y, L.LR);
    return {
      nodes,
      semantic: {
        beat, steps: n, tabs, atStation: aq > 0 ? 'contract' : at, attached: aq >= 1, clipShown: r(cq, 3), railLit: r(railQ, 3),
        clauseLit: r(seg(u, ...W.hl), 3), reading: u >= W.loupeTo[1] && u < W.loupeBack[0],
        sheet: {x: r(sp.x + L.sw / 2), y: r(sp.y + L.sh / 2)}, loupe: {x: r(lp.x), y: r(lp.y)}, loupeParked: parked, loupeBox: bx(lb),
        press0: presses[0], press1: presses[1], pressLast: presses[n - 1],
        sheetBox: bx({x: sp.x, y: sp.y, w: L.sw, h: L.sh}), contractBox: bx(L.C), attachBox: bx({x: L.attach.x, y: L.attach.y, w: L.sw, h: L.sh}),
        clauseBox: bx({x: L.C.x + L.clause.x, y: L.C.y + L.clause.y, w: L.clause.w, h: L.clause.h}),
        plateBoxes: L.stations.map(s => bx(s.plate)), obstacleBoxes: L.boxes.map(bx),
        keyShown: r(keyO, 3), noteShown: r(noteO, 3),
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
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
    slug: 'contract-terms-10-story',
    title: 'Change clause, procedure only — a loupe reads the change clause, its procedure track lights up and the amendment sheet travels it, taking one layer tab per supplied step before it is clipped to the contract',
    titleEs: 'Cláusula de cambio — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de cambio',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A loupe reads the contract\'s change clause ("Clause 18 · Changes procedure"); the rail of the procedure it sets out lights from the clause back to the start tray. The amendment sheet ("Amendment 1 (fictional)") slides out of the tray and travels the track: at each station (one per supplied step) a press head lowers onto its edge and leaves a layer tab, and the station lamp lights. After the last station the sheet joins the contract and a binder clip closes over it. Note "The proposal followed the steps as supplied"; key "As supplied · no conclusion drawn". No doctrine on the validity or effect of changes; no outcome.',
    tags: ['change clause', 'amendment', 'variation procedure', 'procedure track', 'stations', 'layers', 'loupe', 'binder clip'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-cambio.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
