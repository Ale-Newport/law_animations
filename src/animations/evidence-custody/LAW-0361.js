/**
 * LAW-0361 — Etiquetado de indicio · story
 *
 * Storyboard (a top-down evidence bench — steel table, green cutting mat; a fictional object (key / mug / box, as
 * supplied) lies on the mat, a manila tag with its loose ball chain lies below it, an open evidence bag waits on the
 * right (below on tall frames); two gloved hands rest at the bench's lower edge; a legend lists the item, the tag's
 * rows as supplied, custodians, times, captions, notes, the supplied state and the neutral key):
 *  0.00–0.15  rest: everything still; the chain is not clipped, the tag lies apart from the object.
 *  0.15–0.42  the action starts: the right hand takes the tag and carries it (turning it) to the object while the
 *             left hand steadies the object; the chain's clasp is pulled onto the object's attachment point (key bow /
 *             mug handle / box eyelet) — the tag is now joined to the object; the right hand lets the tag go.
 *  0.42–0.73  the right hand grips the object, lifts it and carries it over the bag: the tag trails on its chain
 *             (constant chain length, it swings back against the motion and settles) and goes in with the object;
 *             the object is lowered inside the bag film, the hand returns to the bench edge.
 *  0.73–1.00  hold: the object lies in the bag with the tag still attached; the legend shows the rows as supplied
 *             (written or blank), the supplied state and "as supplied · no conclusion drawn". No admissibility or
 *             chain-of-custody doctrine, no consequence of a blank row.
 * @module animations/evidence-custody/LAW-0361
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {
  ecFields, EC_EN, EC_ES, localised, benchNode, gloveArm, panelLayout, panelNode, ringRect, noteColors, R2,
} from './kits/evidence-art.js';
import {
  EI_LABELS_EN, EI_LABELS_ES, eiLabelFields, resolveRecords, recordLine, stageModel, stageNodes, stageProps,
  local, actionPose,
} from './kits/etiquetado-indicio.js';

const ID = 'LAW-0361';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  reachTag: [0.15, 0.225], carryTag: [0.225, 0.32], steadyIn: [0.17, 0.28], clip: [0.32, 0.39], release: [0.39, 0.42],
  steadyOut: [0.42, 0.5], toObj: [0.42, 0.48], lift: [0.48, 0.51], carry: [0.51, 0.63], lower: [0.63, 0.66],
  back: [0.66, 0.73], notes: [0.74, 0.8], state: [0.75, 0.81],
};
const TARGETS = ['object', 'tag', 'bag'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {
    bagged: 'The tagged object lies in the bag; the tag stays attached (as supplied)',
    tagged: 'The tag is attached to the object, which stays on the bench (as supplied)',
    pending: 'The tag is not attached yet (as supplied)',
  },
  es: {
    bagged: 'El objeto etiquetado está en la bolsa; la etiqueta sigue unida (según lo aportado)',
    tagged: 'La etiqueta está unida al objeto, que sigue en la mesa (según lo aportado)',
    pending: 'La etiqueta aún no está unida (según lo aportado)',
  },
};

const OWN_EN = {
  labels: EI_LABELS_EN,
  actorLabels: {a: 'Gloved hands of the person tagging (fictional, generic)'},
  objectLabels: {tag: 'Manila tag with written rows', chain: 'Ball chain clipped to the object', bag: 'Evidence bag (transparent film)'},
  annotations: [{target: 'tag', text: 'The tag moves with the object on its chain'}],
  stateCaption: '',
};
const OWN_ES = {
  labels: EI_LABELS_ES,
  actorLabels: {a: 'Manos enguantadas de quien etiqueta (ficticias, genéricas)'},
  objectLabels: {tag: 'Etiqueta de cartulina con filas escritas', chain: 'Cadenilla enganchada al objeto', bag: 'Bolsa de indicios (lámina transparente)'},
  annotations: [{target: 'tag', text: 'La etiqueta se mueve con el objeto sujeta a su cadenilla'}],
  stateCaption: '',
};
const EN = {...EC_EN, ...OWN_EN};
const ES = {...EC_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...eiLabelFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the gloved hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the props in the legend', {
    tag: str('Caption for the tag', 60),
    chain: str('Caption for the ball chain', 60),
    bag: str('Caption for the evidence bag', 60),
  }, ['tag', 'chain', 'bag']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 80),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): bagged — the tag is clipped on and the object is moved into the bag; tagged — the tag is clipped on, the object stays on the bench; pending — the tag stays apart', ['bagged', 'tagged', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 100),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'bagged'};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  const it = P.items[0];
  if (showKey) rows.push({kind: 'heading', icon: `object-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: recordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) rows.push({kind: 'item', icon: 'tag', text: P.objectLabels.tag, name: 'lg-tag'});
  if (showAll) rows.push({kind: 'item', icon: 'chain', text: P.objectLabels.chain, name: 'lg-chain'});
  if (showAll) rows.push({kind: 'item', icon: 'bag', text: P.objectLabels.bag, name: 'lg-bag'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.actorLabels.a, name: 'lg-hands'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Compose bench + legend for a font size F and an arrangement. */
function compose(ctx, P, recs, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  let bench, panel = null, PL = null;
  if (!rows.length) bench = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const cols = opt.cols || 1;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    // split rows into columns of balanced height
    const all = panelLayout(ctx, rows, {w: colW, F});
    let PLs = [all];
    if (cols === 2) {
      const half = all.h / 2;
      let idx = all.rows.findIndex(rw => rw.y + rw.h > half);
      idx = Math.max(1, idx);
      PLs = [panelLayout(ctx, rows.slice(0, idx), {w: colW, F}), panelLayout(ctx, rows.slice(idx), {w: colW, F})];
    }
    const ph = Math.max(...PLs.map(q => q.h));
    PL = {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW};
    bench = {x: 0, y: 0, w: DW, h: DH - ph - gap};
    panel = {x: 4, y: DH - ph};
  } else {
    const PW = DW * opt.pw;
    const one = panelLayout(ctx, rows, {w: PW, F});
    PL = {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW};
    bench = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)};
  }
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset, y: bench.y + inset, w: bench.w - inset * 2, h: bench.h - inset * 2};
  const G = stageModel(mat, {kind: P.items[0].kind, rows: recs.length});
  const ok = (!PL || PL.ok) && bench.h > 300 && bench.w > 300 && G.fitsBag;
  return {F, bench, mat, panel, PL, G, ok, problems: [PL && !PL.ok && 'panel-text', !G.fitsBag && 'bag-fit', bench.h <= 300 && 'bench-small'].filter(Boolean)};
}

/** Every pose of the scene at time u (pure). */
function poseAt(L, u) {
  const P = L.P;
  const capU = lerp(W.reachTag[0], W.back[1], clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const s = actionPose(L.G, L.C, W, ua, {doTag: P.finalState !== 'pending', doBag: P.finalState === 'bagged'});
  s.capped = P.actionProgress < 1 && u > capU;
  return s;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = resolveRecords(P);
    const rows = legendRows(ctx, P, recs);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.42}, {mode: 'side', pw: 0.48}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.32}, {mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.4}];
    // score = object size, discounted for smaller text (larger scene first, text never below the floor)
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) {
      for (const opt of opts) {
        const c = compose(ctx, P, recs, rows, F, opt);
        const score = c.G.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.7 : 1);
        if (c.ok && score > bestScore) { best = c; bestScore = score; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    if (best) C = best;
    // arms: shoulders below the bench's lower edge
    const G = C.G;
    const bb = C.bench.y + C.bench.h;
    const sOff = Math.max(110, C.bench.h * 0.14);
    C.shoulderR = {x: C.bench.x + C.bench.w * (G.wide ? 0.6 : 0.78), y: bb + sOff};
    C.shoulderL = {x: C.bench.x + C.bench.w * (G.wide ? 0.14 : 0.16), y: bb + sOff};
    const armW = clamp(G.S * 0.24, 38, 54);
    C.restR = {x: C.shoulderR.x - armW * 0.6, y: bb - armW * 0.9};
    C.restL = {x: C.shoulderL.x + armW * 0.6, y: bb - armW * 0.9};
    const L0 = {P, G, C};
    // reach: the farthest hand target over the timeline sets the arm length (hands stay within reach)
    let farR = 0, farL = 0;
    for (let i = 0; i <= 60; i++) {
      const s = poseAt(L0, i / 60);
      farR = Math.max(farR, Math.hypot(s.handR.x - C.shoulderR.x, s.handR.y - C.shoulderR.y));
      farL = Math.max(farL, Math.hypot(s.handL.x - C.shoulderL.x, s.handL.y - C.shoulderL.y));
    }
    const far = Math.max(farR, farL);
    const armLen = far * 0.5 + 20;
    const armR = gloveArm(ctx, {name: 'armR', handed: 'right', upper: armLen, lower: armLen, width: armW});
    const armL = gloveArm(ctx, {name: 'armL', handed: 'left', upper: armLen, lower: armLen, width: armW});
    // rings around the final positions of the note targets
    const notes = noteColors(ctx.theme);
    const end = poseAt(L0, 1);
    const pad = 12;
    const tgt = name => {
      if (name === 'bag') return {x: G.bag.x - pad, y: G.bag.y - pad, w: G.B.w + pad * 2, h: G.B.h + pad * 2};
      if (name === 'object') return {x: end.objPos.x - G.M.w / 2 - pad, y: end.objPos.y - G.M.h / 2 - pad, w: G.M.w + pad * 2, h: G.M.h + pad * 2};
      const pts = [[G.TG.x0, -G.TG.h / 2], [G.TG.x1, -G.TG.h / 2], [G.TG.x1, G.TG.h / 2], [G.TG.x0, G.TG.h / 2]].map(([x, y]) => local({x, y}, end.hole, end.tagAngle));
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      return {x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return {P, recs, C, G, armR, armL, rings};
  },
  build(ctx, L) {
    const {C, G} = L;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const S = stageNodes(ctx, G, {prefix: 'st', rows: L.recs.map((rw, i) => ({filled: rw.filled, len: 0.55 + ((i * 37) % 40) / 100}))});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, panelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        S.back, S.inside, S.front,
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm,
        S.carried,
        L.armL.thumb, L.armR.thumb,
      ),
      bench.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, G, P} = L;
    const s = poseAt(L, u);
    const nodes = stageProps('st', G, {obj: s.objPos, lift: s.lift, inside: s.inside, hole: s.hole, tagAngle: s.tagAngle, chainEnd: s.chainEnd, clasp: s.clasp, tagLift: s.tagLift});
    const pr = L.armR.pose(C.shoulderR, s.handR, -1);
    const pl = L.armL.pose(C.shoulderL, s.handL, 1);
    Object.assign(nodes, pr.nodes, pl.nodes);
    const done = P.actionProgress >= 1;
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        beat, phase: s.phase,
        handR: R2(pr.hand), handL: R2(pl.hand), tagGrip: R2(s.tagG), objGrip: R2(s.objG), steady: R2(s.steadyP),
        obj: R2(s.objPos), hole: R2(s.hole), anchor: R2(s.anchor), chainEnd: R2(s.chainEnd),
        chainLen: r(Math.hypot(s.hole.x - s.anchor.x, s.hole.y - s.anchor.y), 2), chainL: r(G.chainL, 2),
        attached: s.attached, inside: s.inside, lift: r(s.lift, 3), tagAngle: r(s.tagAngle, 2),
        holdingTag: s.holdingTag, holdingObj: s.holdingObj, steadying: s.steadying,
        allReached: pr.reached && pl.reached,
        rows: L.recs.map(rw => rw.filled), finalState: P.finalState, actionCapped: s.capped,
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1),
        bench: {x: r(C.bench.x), y: r(C.bench.y), w: r(C.bench.w), h: r(C.bench.h)},
        bag: {x: r(G.bag.x), y: r(G.bag.y), w: r(G.B.w), h: r(G.B.h)},
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
    slug: 'evidence-custody-01-story',
    title: 'Evidence tagging — gloved hands clip a tag to an object on an evidence bench and bag it; the tag stays attached as it moves',
    titleEs: 'Etiquetado de indicio — Microescena con objetos y actores',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Etiquetado de indicio',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down evidence bench with a green cutting mat. A fictional object (key, mug or box, as supplied) lies on the mat; a manila tag with written or blank rows (as supplied) and a loose ball chain lies below it; an evidence bag waits open. Gloved hands carry the tag to the object, the left hand steadies the object and the chain is clipped to its attachment point; then the right hand lifts the object and carries it into the bag while the tag trails on its chain and stays attached. The hold shows the supplied rows, custodians, times and state. No admissibility or chain-of-custody doctrine, no consequence of a blank row; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'tag', 'label', 'chain', 'evidence bag', 'gloves', 'bench', 'records', 'item'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/etiquetado-indicio.js', 'src/primitives/desk.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
