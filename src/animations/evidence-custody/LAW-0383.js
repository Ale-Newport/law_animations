/**
 * LAW-0383 — Copia de evidencia digital · contrast
 *
 * Storyboard (two complete imaging stations, identical in scale, props and timing: on each evidence bench the
 * duplicator dock holds the ORIGINAL in its source bay and the finished COPY in its target bay (both block maps
 * complete), the original's open evidence bag waits at the left, an unattached tag waits on the mat at the right and
 * one gloved hand rests at the bench edge; side by side on wide boxes, stacked on tall ones; a legend lists the item,
 * the changed fact, shared facts, copy-tag rows, custodians, times, the guide, the neutral note and the key):
 *  0.00–0.17  base: both stations identical; each hand rises to hover over the middle of its dock (same path).
 *  0.17–0.40  the one changed fact: in A the hand takes the ORIGINAL out of the source bay; in B it takes the COPY out of
 *             the target bay — a localised, physical difference (which bay is emptied).
 *  0.40–0.77  parallel action, adapted only to that fact: A carries the original back into its bag (its own tag and
 *             chain travel with it) and the hand withdraws; B carries the copy to its spot beside the dock and slides the
 *             waiting tag under its eyelet, where the ball chain appears — the copy is identified.
 *  0.77–1.00  hold: a guide links the moved device in A and in B (the only difference); a neutral note: no winner, no
 *             score, no consequence. No doctrine on digital evidence.
 * @module animations/evidence-custody/LAW-0383
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {
  ecFields, localised, benchNode, gloveArm, R2, fitG, textAt, bagBack, bagFront, chainNode, chainProps, pathAt, INK,
} from './kits/evidence-art.js';
import {
  DC_EN, DC_ES, dcFields, dcRecords, dcRecordLine, dcStage, deviceArt, dockArt, tagT, origTagArt, copyTagArt, dcLegendFor,
  dcPanels,
} from './kits/copia-digital.js';

const ID = 'LAW-0383';
const DURATION = 7500;
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const W = {guide: [0.79, 0.85], note: [0.82, 0.87], chain: [0.66, 0.69]};
const LANE = ['#3d6f99', '#b07a2a'];

const OWN_EN = {
  scenarioA: {label: 'Original', caption: 'The hand takes the original back to its bag'},
  scenarioB: {label: 'Identified copy', caption: 'The hand takes the copy and clips on its tag'},
  changedFact: 'Which device the hand takes from the dock: the original (A) or the copy (B)',
  sharedFacts: ['Same dock, same devices, same block map', 'Same timing and the same hand'],
  comparisonLabels: {guide: 'Only this differs: the device moved', neutral: 'Two supplied situations side by side — no winner, no score, no consequence'},
};
const OWN_ES = {
  scenarioA: {label: 'Original', caption: 'La mano devuelve el original a su bolsa'},
  scenarioB: {label: 'Copia identificada', caption: 'La mano toma la copia y le une su etiqueta'},
  changedFact: 'Qué dispositivo toma la mano del duplicador: el original (A) o la copia (B)',
  sharedFacts: ['Mismo duplicador, mismos dispositivos, mismo mapa de bloques', 'Mismos tiempos y la misma mano'],
  comparisonLabels: {guide: 'Solo esto cambia: el dispositivo movido', neutral: 'Dos situaciones aportadas lado a lado: sin ganador, sin puntuación, sin consecuencia'},
};
const EN = {...DC_EN, ...OWN_EN};
const ES = {...DC_ES, ...OWN_ES};
const {items: _ei, records: _er, ...ecRest} = ecFields;
const sceneSchema = {...ecRest, ...dcFields, ...contrastFields()};
const defaultParams = {...EN};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const it = P.items[0];
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: `dc-orig-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) rows.push({kind: 'state', text: P.changedFact, name: 'lg-changed'});
  if (showAll) P.sharedFacts.forEach((f, i) => rows.push({kind: 'item', icon: 'dc-dock', text: f, name: `lg-shared${i}`}));
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: dcRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) rows.push({kind: 'item', icon: 'ring', color: ctx.theme.accent, text: P.comparisonLabels.guide, name: 'lg-guide'});
  if (showKey) rows.push({kind: 'key', text: P.comparisonLabels.neutral, name: 'lg-neutral'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function compose(ctx, P, recs, F, LG, arr) {
  const {bench: R, PL} = LG;
  const gap = F * 1.6;
  const showKey = ctx.show('key');
  const hH = showKey ? F * (P.scenarioA.caption || P.scenarioB.caption ? 3.4 : 2.2) : F * 1.6;
  const pw = arr === 'row' ? (R.w - gap) / 2 : R.w, ph = arr === 'row' ? R.h : (R.h - gap) / 2;
  const panels = [0, 1].map(i => ({x: R.x + (arr === 'row' ? i * (pw + gap) : 0), y: R.y + (arr === 'row' ? 0 : i * (ph + gap)), w: pw, h: ph}));
  let ok = !PL || PL.ok;
  const heads = [P.scenarioA, P.scenarioB].map(sc => {
    if (!showKey) return null;
    const lf = fitG(sc.label, {maxWidth: pw - F * 3, size: F * 1.15, minSize: F, maxLines: 1, weight: 700});
    const cf = sc.caption && ctx.show('all') ? fitG(sc.caption, {maxWidth: pw - F * 3, size: F, minSize: F, maxLines: 1, weight: 500}) : null;
    if (!lf.ok || (cf && !cf.ok)) ok = false;
    return {lf, cf};
  });
  const benches = panels.map(p => ({x: p.x, y: p.y + hH, w: p.w, h: p.h - hH}));
  const b = benches[0];
  const inset = Math.max(14, Math.min(b.w, b.h) * 0.035);
  const mat = bb => ({x: bb.x + inset * 1.3, y: bb.y + inset * 1.3, w: bb.w - inset * 2.6, h: bb.h - inset * 2.6});
  let best = null;
  for (const orient of ['h', 'v']) {
    if (b.w < 150 || b.h < 150) continue;
    const G = dcStage(mat(b), {kind: P.items[0].kind, orient, rows: recs.length});
    if (!best || G.S > best.S) best = G;
  }
  const G0 = best;
  const Gs = G0 ? benches.map(bb => dcStage(mat(bb), {kind: P.items[0].kind, orient: G0.orient, rows: recs.length})) : null;
  const S = G0 ? G0.S : 0;
  const okAll = ok && S >= 70;
  return {F, arr, panels, benches, heads, hH, Gs, PL, panel: LG.panel, bench: R, ok: okAll, S, problems: [PL && !PL.ok && 'panel-text', !ok && 'header-text', S < 70 && 'stage-small'].filter(Boolean)};
}

function plan(G, rest, lane) {
  const gy = G.M.h * 0.4;
  const d = p => ({x: p.x, y: p.y + gy});
  const hover = {x: (G.srcBay.x + G.dstBay.x) / 2, y: G.dock.y + G.dock.h + G.S * 0.25};
  const off = G.tagC.w * 0.42;
  const grip = p => ({x: p.x + off, y: p.y});
  const keys = [[0.05, rest], [0.15, hover]];
  if (lane === 0) keys.push([0.27, d(G.srcBay)], [0.4, d(G.srcBay)], [0.55, d(G.origRest)], [0.66, rest]);
  else keys.push([0.27, d(G.dstBay)], [0.4, d(G.dstBay)], [0.55, d(G.copySpot)], [0.58, grip(G.tagLie)], [0.66, grip(G.tagFinal)], [0.74, rest]);
  return {keys, gy, off};
}

function laneState(G, pl, lane, u) {
  const hand = pathAt(pl.keys, u);
  let orig = G.srcBay, copy = G.dstBay, tag = G.tagLie, origAt = 'dock', copyAt = 'dock', tagState = 'lying';
  const held = u >= 0.27 && u < 0.55;
  if (lane === 0) {
    if (u >= 0.27 && u < 0.4) origAt = 'gripped';
    if (held) { orig = {x: hand.x, y: hand.y - pl.gy}; if (u >= 0.4) origAt = 'carried'; }
    if (u >= 0.55) { orig = G.origRest; origAt = 'bag'; }
  } else {
    if (u >= 0.27 && u < 0.4) copyAt = 'gripped';
    if (held) { copy = {x: hand.x, y: hand.y - pl.gy}; if (u >= 0.4) copyAt = 'carried'; }
    if (u >= 0.55) { copy = G.copySpot; copyAt = 'placed'; }
    if (u >= 0.58 && u < 0.66) { tag = {x: hand.x - pl.off, y: hand.y}; tagState = 'carried'; }
    if (u >= 0.66) { tag = G.tagFinal; tagState = 'attached'; }
  }
  return {hand, orig, copy, tag, origAt, copyAt, tagState};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = dcRecords(P);
    const shape = ctx.view.shape;
    const rows = legendRows(ctx, P, recs);
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.22}, {mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.3}];
    const arrs = shape === 'portrait' ? ['column'] : shape === 'square' ? ['column', 'row'] : ['row'];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const o0 of opts) {
        const LG = dcLegendFor(ctx, rows, F, o0);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const arr of arrs) {
          const c = compose(ctx, P, recs, F, LG, arr);
          const score = c.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    if (!C.Gs) C.Gs = [0, 1].map(i => dcStage({x: 20 + i * 400, y: 20, w: 380, h: 300}, {kind: P.items[0].kind, orient: 'h', rows: recs.length}));
    const lanes = C.Gs.map((G, i) => {
      const bb = C.benches[i] || {x: G.ext.x, y: G.ext.y, w: G.ext.w, h: G.ext.h};
      const armW = clamp(G.S * 0.2, 26, 44);
      const shoulder = {x: bb.x + bb.w * 0.55, y: bb.y + bb.h + Math.max(60, G.S * 0.5)};
      const rest = {x: shoulder.x - armW * 0.6, y: bb.y + bb.h - armW * 0.9};
      const pl = plan(G, rest, i);
      let far = 0;
      for (let k = 0; k <= 100; k++) { const p = pathAt(pl.keys, k / 100); far = Math.max(far, Math.hypot(p.x - shoulder.x, p.y - shoulder.y)); }
      const arm = gloveArm(ctx, {name: `arm${i}`, handed: 'right', upper: far * 0.55 + 14, lower: far * 0.55 + 14, width: armW});
      return {G, bb, shoulder, pl, arm};
    });
    // guide: moved device in A (in its bag) and in B (on its spot)
    const ga = lanes[0].G.origRest, gb = lanes[1].G.copySpot;
    const M = lanes[0].G.M;
    const ringA = {x: ga.x - M.w / 2 - 10, y: ga.y - M.h / 2 - 10, w: M.w + 20, h: M.h + 20};
    const ringB = {x: gb.x - M.w / 2 - 10, y: gb.y - M.h / 2 - 10, w: M.w + 20, h: M.h + 20};
    return {P, recs, C, lanes, ringA, ringB};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const parts = L.lanes.map((ln, i) => {
      const {G, bb} = ln;
      const bench = benchNode(ctx, {prefix: `bench${i}`, x: bb.x, y: bb.y, w: bb.w, h: bb.h});
      const bw = Math.max(4, G.S * 0.045);
      const p = `L${i}`;
      const pan = C.panels[i];
      const hd = C.heads[i];
      const badgeR = C.F * 0.75;
      const head = g({name: `head${i}`},
        h('circle', {cx: r(pan.x + badgeR + 2), cy: r(pan.y + badgeR + 2), r: r(badgeR), fill: LANE[i], stroke: INK, 'stroke-width': 2}),
        hd ? h('text', {x: r(pan.x + badgeR + 2), y: r(pan.y + badgeR + 2 + C.F * 0.36), 'text-anchor': 'middle', 'font-size': r(C.F, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i ? 'B' : 'A') : null,
        hd ? textAt(hd.lf, {x: pan.x + badgeR * 2 + C.F * 0.6, y: pan.y + 2, fill: th.fg}) : null,
        hd && hd.cf ? textAt(hd.cf, {x: pan.x + badgeR * 2 + C.F * 0.6, y: pan.y + 2 + hd.lf.size * 1.3, fill: th.fgSoft}) : null,
      );
      return g(null, head, bench.surface,
        g({'clip-path': bench.clip},
          g({transform: T(G.dock.x, G.dock.y)}, dockArt(ctx, G.D, {prefix: `${p}dk`})),
          g({transform: T(G.bag.x, G.bag.y)}, bagBack(ctx, G.bag.B, {})),
          g({name: `${p}origLo`}, deviceArt(ctx, G.M, {prefix: `${p}oL`, role: 'original'})),
          g({transform: T(G.bag.x, G.bag.y)}, bagFront(ctx, G.bag.B, {})),
          chainNode(`${p}chO`, {bead: bw}),
          g({name: `${p}tagO`}, origTagArt(ctx, G, `${p}tO`)),
          g({name: `${p}tagLo`}, copyTagArt(ctx, G, `${p}tL`, L.recs)),
          chainNode(`${p}chC`, {bead: bw}),
          ln.arm.arm, ln.arm.palm,
          g({name: `${p}origHi`}, deviceArt(ctx, G.M, {prefix: `${p}oH`, role: 'original'})),
          g({name: `${p}copy`}, deviceArt(ctx, G.M, {prefix: `${p}cp`, role: 'copy', filled: true})),
          g({name: `${p}tagHi`, opacity: 0}, copyTagArt(ctx, G, `${p}tH`, L.recs)),
          ln.arm.thumb,
        ),
        bench.frame);
    });
    const a = L.ringA, b = L.ringB;
    const ca = {x: a.x + a.w / 2, y: a.y + a.h / 2}, cb = {x: b.x + b.w / 2, y: b.y + b.h / 2};
    const row = C.arr === 'row';
    const pa = row ? {x: ca.x, y: a.y} : {x: a.x + a.w, y: ca.y};
    const pb = row ? {x: cb.x, y: b.y} : {x: b.x + b.w, y: cb.y};
    const bR = Math.min(...L.lanes.map(q => q.bb.x + q.bb.w)) - 10, bT = Math.max(...L.lanes.map(q => q.bb.y)) + 10;
    const lift = row ? Math.max(bT, Math.min(pa.y, pb.y) - C.F * 1.2) : Math.min(bR, Math.max(pa.x, pb.x) + C.F * 1.6);
    const d = row ? `M${r(pa.x)} ${r(pa.y)}V${r(lift)}H${r(pb.x)}V${r(pb.y)}` : `M${r(pa.x)} ${r(pa.y)}H${r(lift)}V${r(pb.y)}H${r(pb.x)}`;
    return g({name: 'scene'},
      parts,
      g({name: 'guide', opacity: 0},
        h('rect', {x: r(a.x), y: r(a.y), width: r(a.w), height: r(a.h), rx: 12, fill: 'none', stroke: th.accent, 'stroke-width': 4}),
        h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: th.accent, 'stroke-width': 4}),
        h('path', {d, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-linejoin': 'round'})),
      dcPanels(ctx, C),
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const nodes = {};
    const sems = L.lanes.map((ln, i) => {
      const {G, pl} = ln;
      const p = `L${i}`;
      const s = laneState(G, pl, i, u);
      const inBag = s.origAt === 'bag';
      nodes[`${p}origLo`] = {transform: T(s.orig.x, s.orig.y), opacity: inBag ? 1 : 0};
      nodes[`${p}origHi`] = {transform: T(s.orig.x, s.orig.y), opacity: inBag ? 0 : 1};
      const hO = G.holeOf(s.orig);
      nodes[`${p}tagO`] = {transform: tagT(hO)};
      Object.assign(nodes, chainProps(`${p}chO`, G.eyeOf(s.orig), hO, G.S * 0.06));
      nodes[`${p}copy`] = {transform: T(s.copy.x, s.copy.y)};
      const car = s.tagState === 'carried';
      nodes[`${p}tagLo`] = {transform: tagT(s.tag), opacity: car ? 0 : 1};
      nodes[`${p}tagHi`] = {transform: tagT(s.tag), opacity: car ? 1 : 0};
      Object.assign(nodes, chainProps(`${p}chC`, G.eyeOf(s.copy), G.holeOf(s.copy), G.S * 0.06));
      nodes[`${p}chC`] = {opacity: r(s.tagState === 'attached' ? seg(u, ...W.chain) : 0, 3)};
      const ps = ln.arm.pose(ln.shoulder, s.hand, -1);
      Object.assign(nodes, ps.nodes);
      const o = {x: G.ext.x, y: G.ext.y};
      const rel = q => ({x: r(q.x - o.x), y: r(q.y - o.y)});
      return {s, ps, look: {hand: rel(ps.hand), orig: rel(s.orig), copy: rel(s.copy), tag: rel(s.tag), origAt: s.origAt, copyAt: s.copyAt, tagState: s.tagState}};
    });
    const gk = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gk, 3)};
    const nk = seg(u, ...W.note);
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name === 'lg-guide') nodes[row.name] = {opacity: r(gk, 3)};
      if (row.name === 'lg-neutral') nodes[row.name] = {opacity: r(nk, 3)};
    }
    const [A, B] = sems;
    const beat = u < 0.17 ? 'base' : u < 0.4 ? 'change' : u < 0.77 ? 'parallel' : 'hold';
    return {
      nodes,
      semantic: {
        beat, lookA: A.look, lookB: B.look,
        handA: R2(A.ps.hand), handB: R2(B.ps.hand), origA: R2(A.s.orig), copyA: R2(A.s.copy), origB: R2(B.s.orig), copyB: R2(B.s.copy), tagB: R2(B.s.tag),
        gripOrigA: R2({x: A.s.orig.x, y: A.s.orig.y + L.lanes[0].pl.gy}), gripCopyB: R2({x: B.s.copy.x, y: B.s.copy.y + L.lanes[1].pl.gy}), gripTagB: R2({x: B.s.tag.x + L.lanes[1].pl.off, y: B.s.tag.y}),
        origAtA: A.s.origAt, copyAtA: A.s.copyAt, origAtB: B.s.origAt, copyAtB: B.s.copyAt, tagA: A.s.tagState, tagStateB: B.s.tagState,
        guide: r(gk, 3), note: r(nk, 3), allReached: A.ps.reached && B.ps.reached,
        problems: C.problems, textPx: r(C.F, 1), S: r(C.S, 1), arrangement: C.arr,
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
    slug: 'evidence-custody-06-contrast',
    title: 'Digital evidence copy — two identical imaging stations; the one changed fact is which device the hand takes from the dock: in A the original goes back to its bag, in B the copy is moved to its spot and receives its own tag',
    titleEs: 'Copia de evidencia digital — Comparación de dos supuestos',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Copia de evidencia digital',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete imaging stations, side by side on wide boxes and stacked on tall ones, identical in scale, props and timing: a duplicator dock holding the original (fictional drive, stick or card) and its finished copy, the original\'s open evidence bag, a waiting tag and one gloved hand. The only changed fact is which device the hand takes from the dock: in A the original goes back into its bag with its own tag; in B the copy is moved to its spot and the waiting tag is clipped to it with a ball chain. A guide links the moved device in both scenes; a neutral note says there is no winner, score or consequence. No doctrine; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'digital evidence', 'copy', 'contrast', 'original', 'identified copy', 'duplicator', 'tag', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/copia-digital.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
