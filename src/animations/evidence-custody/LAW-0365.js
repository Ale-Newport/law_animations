/**
 * LAW-0365 — Embalaje de prueba · story
 *
 * Storyboard (the category's top-down evidence bench; a fictional object (box / mug / key, as supplied) lies on the
 * mat, an open evidence pouch waits with its white flap lying flat above the mouth (release-liner band visible), and
 * an ochre seal strip (precinto) with its printed seal number rests on a white backing card; the pouch's custody
 * label shows the supplied rows (written or blank) and a chain strip with one signed box per custodian; two gloved
 * hands rest at the bench edge; a legend lists item, seal number, rows, custodians, times, captions, notes, the
 * supplied state and the neutral key):
 *  0.00–0.15  rest: nothing moves; flap open, strip on its card, object apart from the pouch.
 *  0.15–0.42  the action starts: the left hand steadies the pouch's lower corner while the right hand grips the
 *             object, lifts it, carries it over the mouth and lowers it inside the film; the right hand takes the
 *             flap's free edge and folds it over the mouth (inner face → outer face as it passes edge-on).
 *  0.42–0.73  the right hand holds the folded flap down; the left hand peels the strip off its card (the card stays),
 *             turns it and lays it across the flap's free edge (the seam); it keeps the left end down while the right
 *             hand presses along the strip — a pressed tint follows the pressing hand. Cause precedes effect.
 *  0.73–1.00  hold: both hands return; the pouch lies closed with the seal across the seam and its number readable.
 *             finalState: sealed (seal intact, as supplied) · altered (a supplied zig-zag slit across the strip and
 *             the neutral Δ marker appear — "marked alteration", nothing inferred) · open (the object is in the
 *             pouch, the flap and strip stay as they were). No doctrine on tampering or its consequences.
 * @module animations/evidence-custody/LAW-0365
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {
  ecFields, localised, benchNode, gloveArm, panelLayout, ringRect, noteColors, R2,
} from './kits/evidence-art.js';
import {
  EP_EN, EP_ES, epFields, epRecords, epRecordLine, sealStage, sealPose, sealNodes, sealProps, markerAt, numberFit,
  epPanelNode,
} from './kits/embalaje-prueba.js';

const ID = 'LAW-0365';
const DURATION = 8000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  reachObj: [0.15, 0.215], steadyIn: [0.15, 0.215], lift: [0.215, 0.235], carry: [0.235, 0.31], lower: [0.31, 0.34],
  toFlap: [0.34, 0.385], fold: [0.385, 0.45], holdFlap: [0.45, 0.49], steadyOut: [0.36, 0.43],
  toStrip: [0.4, 0.48], carryStrip: [0.48, 0.58], lay: [0.58, 0.61], press: [0.62, 0.71], back: [0.71, 0.78],
  slit: [0.76, 0.8], marker: [0.78, 0.83], notes: [0.76, 0.82], state: [0.77, 0.83],
};
const TARGETS = ['object', 'bag', 'seal', 'label'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {
    sealed: 'The object is in the pouch; the pouch is closed with the seal strip, seal intact (as supplied)',
    altered: 'The pouch is closed with the seal strip; an alteration of the seal is marked (as supplied)',
    open: 'The object is in the pouch; the pouch is not sealed yet (as supplied)',
  },
  es: {
    sealed: 'El objeto está en la bolsa; la bolsa queda cerrada con el precinto íntegro (según lo aportado)',
    altered: 'La bolsa queda cerrada con el precinto; hay una alteración señalada en el precinto (según lo aportado)',
    open: 'El objeto está en la bolsa; la bolsa aún no está precintada (según lo aportado)',
  },
};

const OWN_EN = {
  actorLabels: {a: 'Gloved hands of the person packing (fictional, generic)'},
  objectLabels: {bag: 'Evidence pouch with a fold-over flap', seal: 'Seal strip with a printed number', label: 'Custody label with written rows', chain: 'Chain strip: one signed box per custodian'},
  annotations: [{target: 'seal', text: 'The seal strip crosses the flap edge'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos enguantadas de quien embala (ficticias, genéricas)'},
  objectLabels: {bag: 'Bolsa de pruebas con solapa', seal: 'Precinto con número impreso', label: 'Etiqueta de custodia con filas escritas', chain: 'Cadena: una casilla firmada por custodio'},
  annotations: [{target: 'seal', text: 'El precinto cruza el borde de la solapa'}],
  stateCaption: '',
};
const EN = {...EP_EN, ...OWN_EN};
const ES = {...EP_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...epFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the gloved hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the props in the legend', {
    bag: str('Caption for the evidence pouch', 60),
    seal: str('Caption for the seal strip', 60),
    label: str('Caption for the custody label', 60),
    chain: str('Caption for the chain strip on the label', 60),
  }, ['bag', 'seal', 'label', 'chain']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 80),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): sealed — the pouch is closed with the seal intact; altered — the pouch is closed and a supplied alteration mark is shown on the seal; open — the object is in the pouch, which is not sealed', ['sealed', 'altered', 'open']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 120),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'sealed'};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  const it = P.items[0];
  if (showKey) rows.push({kind: 'heading', icon: `object-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) rows.push({kind: 'item', icon: 'ep-seal', text: `${P.labels.seal}: ${P.sealNumber}`, name: 'lg-seal-no'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: epRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) rows.push({kind: 'item', icon: 'ep-pouch', text: P.objectLabels.bag, name: 'lg-bag'});
  if (showAll) rows.push({kind: 'item', icon: 'ep-seal', text: P.objectLabels.seal, name: 'lg-seal'});
  if (showAll) rows.push({kind: 'item', icon: 'ep-label', text: P.objectLabels.label, name: 'lg-label'});
  if (showAll) rows.push({kind: 'item', icon: 'ep-chain', text: P.objectLabels.chain, name: 'lg-chain'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.actorLabels.a, name: 'lg-hands'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function compose(ctx, P, recs, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  let bench, panel = null, PL = null;
  if (!rows.length) bench = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [panelLayout(ctx, rows, {w: colW, F})];
    if (cols === 2) {
      let best = null;
      for (let i = 1; i < rows.length; i++) {
        const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      if (best) PLs = best.cols;
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
  const G = bench.h > 200 && bench.w > 200 ? sealStage(mat, {kind: P.items[0].kind, rows: recs.length, chainN: P.custodians.length}) : null;
  const ok = (!PL || PL.ok) && G && G.fits && G.S >= 95;
  return {F, bench, mat, panel, PL, G, ok, problems: [PL && !PL.ok && 'panel-text', (!G || !G.fits) && 'pouch-fit', (!G || G.S < 95) && 'stage-small'].filter(Boolean)};
}

function poseAt(L, u) {
  const P = L.P;
  const capU = lerp(W.reachObj[0], W.back[1], clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const s = sealPose(L.G, L.C, W, ua, {doBag: true, doSeal: P.finalState !== 'open'});
  s.capped = P.actionProgress < 1 && u > capU;
  return s;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = epRecords(P);
    const rows = legendRows(ctx, P, recs);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.34}, {mode: 'side', pw: 0.38}, {mode: 'side', pw: 0.42}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.32}, {mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.4}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) for (const opt of opts) {
      const c = compose(ctx, P, recs, rows, F, opt);
      const score = (c.G ? c.G.S : 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
      if (c.ok && score > bestScore) { best = c; bestScore = score; }
      if (!C || c.problems.length < C.problems.length) C = c;
    }
    if (best) C = best;
    if (!C.G) C.G = sealStage(C.mat, {kind: P.items[0].kind, rows: recs.length, chainN: P.custodians.length});
    const G = C.G;
    const bb = C.bench.y + C.bench.h;
    const sOff = Math.max(70, C.bench.h * 0.08);
    C.shoulderR = {x: C.bench.x + C.bench.w * 0.74, y: bb + sOff};
    C.shoulderL = {x: C.bench.x + C.bench.w * 0.2, y: bb + sOff};
    const armW = clamp(G.S * 0.2, 36, 54);
    C.restR = {x: C.shoulderR.x - armW * 0.6, y: bb - armW * 0.9};
    C.restL = {x: C.shoulderL.x + armW * 0.6, y: bb - armW * 0.9};
    const L0 = {P, G, C};
    let far = 0;
    for (let i = 0; i <= 80; i++) {
      const s = poseAt(L0, i / 80);
      far = Math.max(far, Math.hypot(s.handR.x - C.shoulderR.x, s.handR.y - C.shoulderR.y), Math.hypot(s.handL.x - C.shoulderL.x, s.handL.y - C.shoulderL.y));
    }
    const armLen = far * 0.58 + 20;
    const armR = gloveArm(ctx, {name: 'armR', handed: 'right', upper: armLen, lower: armLen, width: armW});
    const armL = gloveArm(ctx, {name: 'armL', handed: 'left', upper: armLen, lower: armLen, width: armW});
    const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const nf = numberFit(ctx, G.SM, P.sealNumber, C.F, vs);
    // rings around the final positions of the note targets
    const notes = noteColors(ctx.theme);
    const end = poseAt(L0, 1);
    const pad = 12, PM = G.PM, SM = G.SM;
    const tgt = name => {
      if (name === 'bag') return {x: G.bag.x - pad, y: G.bag.y - (end.sy > 0 ? PM.fh : 0) - pad, w: PM.w + pad * 2, h: PM.h + (end.sy > 0 ? PM.fh : 0) + pad * 2};
      if (name === 'object') return {x: end.objPos.x - G.M.w / 2 - pad, y: end.objPos.y - G.M.h / 2 - pad, w: G.M.w + pad * 2, h: G.M.h + pad * 2};
      if (name === 'label') return {x: G.bag.x + PM.label.x - pad, y: G.bag.y + PM.label.y - pad, w: PM.label.w + pad * 2, h: PM.label.h + pad * 2};
      const vert = Math.abs(((end.stripA % 180) + 180) % 180 - 90) < 45;
      const lw = vert ? SM.h : SM.len, lh = vert ? SM.len : SM.h;
      return {x: end.stripC.x - lw / 2 - pad, y: end.stripC.y - lh / 2 - pad, w: lw + pad * 2, h: lh + pad * 2};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return {P, recs, C, G, armR, armL, rings, nf};
  },
  build(ctx, L) {
    const {C, G, P} = L;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const S = sealNodes(ctx, G, {prefix: 'st', rows: L.recs, chainN: P.custodians.length, number: L.nf, marker: true});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, epPanelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        S.back, S.inside, S.front, S.card, S.flap, S.low,
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
    const done = P.actionProgress >= 1;
    const alt = done && P.finalState === 'altered';
    const slitK = alt ? seg(u, ...W.slit) : 0;
    const mkK = alt ? seg(u, ...W.marker) : 0;
    const mkAt = markerAt(G, s.stripC, s.stripA, s.stripSc);
    const nodes = sealProps('st', G, s, {slit: slitK, marker: mkK, markerAt: mkAt});
    const pr = L.armR.pose(C.shoulderR, s.handR, -1);
    const pl = L.armL.pose(C.shoulderL, s.handL, 1);
    Object.assign(nodes, pr.nodes, pl.nodes);
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
        handR: R2(pr.hand), handL: R2(pl.hand), objGrip: R2(s.objG), flapGrip: R2(s.flapG), stripGrip: R2(s.stripG), steady: R2(s.steadyP), press: R2(s.pressP),
        obj: R2(s.objPos), strip: R2(s.stripC), stripAngle: r(s.stripA, 2), flap: r(s.sy, 3),
        inside: s.inside, folded: s.sy < -0.999, peeled: s.peeled, laid: s.laid, pressed: r(s.pressW / G.SM.len, 3), lift: r(s.lift, 3),
        holdingObj: s.holdingObj, folding: s.folding, holdingStrip: s.holdingStrip, pressing: s.pressing, steadying: s.steadying,
        slit: r(slitK, 3), marker: r(mkK, 3), sealNumberOnStrip: Boolean(L.nf),
        allReached: pr.reached && pl.reached,
        rows: L.recs.map(rw => rw.filled), finalState: P.finalState, actionCapped: s.capped,
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1), arrangement: G.arr,
        bench: {x: r(C.bench.x), y: r(C.bench.y), w: r(C.bench.w), h: r(C.bench.h)},
        bag: {x: r(G.bag.x), y: r(G.bag.y), w: r(G.PM.w), h: r(G.PM.h)},
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
    slug: 'evidence-custody-02-story',
    title: 'Evidence packing — gloved hands put an object into an evidence pouch, fold the flap and close it with a numbered seal strip',
    titleEs: 'Embalaje de prueba — Microescena con objetos y actores',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Embalaje de prueba',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down evidence bench. A fictional object (box, mug or key, as supplied) lies beside an open evidence pouch whose flap lies flat above the mouth; an ochre seal strip with a printed number rests on its backing card; the pouch\'s custody label carries the supplied rows and a chain strip with one signed box per custodian. The right hand puts the object into the pouch and folds the flap; the left hand peels the strip and lays it across the flap edge while the right hand presses it down. The hold shows the supplied state: seal intact, a marked alteration (a supplied slit with a neutral Δ marker) or not yet sealed. No doctrine on tampering or its consequences; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'packing', 'seal', 'tamper-evident', 'evidence bag', 'pouch', 'flap', 'gloves', 'label', 'chain of custody'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/embalaje-prueba.js', 'src/primitives/desk.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
