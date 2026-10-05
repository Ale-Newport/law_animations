/**
 * LAW-0367 — Embalaje de prueba · contrast
 *
 * Storyboard (two complete evidence benches of identical size, A and B — side by side on wide frames, stacked on tall
 * ones; each holds the same object, the same open pouch with its flap lying flat and the same numbered seal strip on
 * its backing card; gloved hands rest at each bench's edge; letter badges and scenario labels head each bench; a
 * shared strip lists the changed fact, seal number, label rows, shared facts, item, custodians, times, the guide
 * label, a neutral note and the key):
 *  0.00–0.17  base: the two benches are identical (same strip, same positions, nothing marked).
 *  0.17–0.40  the change: in B only, a supplied zig-zag slit is drawn across the strip lying on its card and the
 *             neutral Δ marker appears beside it ("alteración señalada"); A keeps its strip unbroken ("Precinto
 *             íntegro"). Nobody performs the alteration: it is a supplied mark. This is the only difference, and it
 *             changes the strip's geometry (a cut line with a gap).
 *  0.40–0.77  in parallel, the same packing in both: the right hand puts the object into the pouch and folds the
 *             flap; the left hand peels the strip, lays it across the flap edge and the right hand presses it down.
 *             In B the marked slit (and its Δ) travel with the strip and end on the seam.
 *  0.77–1.00  a comparison guide outlines the same stretch of both laid strips (unbroken in A, slit in B) and joins
 *             them; a neutral note. No winner, no score and no consequence of the mark (nothing about tampering,
 *             admissibility, validity or custody).
 * @module animations/evidence-custody/LAW-0367
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {ecFields, localised, benchNode, gloveArm, panelLayout, R2, fitG, textAt} from './kits/evidence-art.js';
import {
  EP_EN, EP_ES, epFields, epRecords, epRecordLine, sealStage, sealPose, sealNodes, sealProps, markerAt, numberFit,
  epPanelNode, local,
} from './kits/embalaje-prueba.js';

const ID = 'LAW-0367';
const DURATION = 9000;
const CHANGE_AT = 0.17;
const W = {
  slit: [0.2, 0.3], mark: [0.27, 0.34],
  reachObj: [0.4, 0.45], steadyIn: [0.4, 0.45], lift: [0.45, 0.465], carry: [0.465, 0.52], lower: [0.52, 0.54],
  toFlap: [0.54, 0.57], fold: [0.57, 0.615], holdFlap: [0.615, 0.64], steadyOut: [0.9, 0.95],
  toStrip: [0.56, 0.62], carryStrip: [0.62, 0.68], lay: [0.68, 0.7], press: [0.7, 0.75], back: [0.75, 0.8],
  guide: [0.79, 0.85], note: [0.82, 0.87],
};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  scenarioA: {label: 'Seal intact', caption: 'The strip is laid on the seam unbroken'},
  scenarioB: {label: 'Alteration marked', caption: 'A supplied mark shows a slit across the strip'},
  changedFact: 'In B a slit across the seal strip is marked (supplied); everything else is the same',
  sharedFacts: ['Same object, pouch, label and seal number', 'The same hands pack, fold and seal'],
  comparisonLabels: {guide: 'Only this stretch of the strip differs', neutral: 'Two supplied situations side by side; no conclusion is drawn about either'},
};
const OWN_ES = {
  scenarioA: {label: 'Precinto íntegro', caption: 'El precinto se coloca entero sobre la unión'},
  scenarioB: {label: 'Alteración señalada', caption: 'Una marca aportada señala un corte en el precinto'},
  changedFact: 'En B se señala un corte en el precinto (aportado); todo lo demás es igual',
  sharedFacts: ['El mismo objeto, bolsa, etiqueta y número de precinto', 'Las mismas manos embalan, pliegan y precintan'],
  comparisonLabels: {guide: 'Solo este tramo del precinto cambia', neutral: 'Dos supuestos aportados, uno junto a otro; no se extrae ninguna conclusión'},
};
const EN = {...EP_EN, ...OWN_EN};
const ES = {...EP_ES, ...OWN_ES};

const sceneSchema = {...ecFields, ...epFields, ...contrastFields()};
const defaultParams = {...EN};

function infoRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', text: P.changedFact, name: 'lg-change'});
  if (showKey) rows.push({kind: 'item', icon: 'ep-seal', text: `${P.labels.seal}: ${P.sealNumber}`, name: 'lg-seal-no'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: epRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.sharedFacts.forEach((f, i) => rows.push({kind: 'item', icon: 'ring', color: ctx.theme.fgSoft, text: f, name: `lg-shared${i}`}));
  if (showAll) rows.push({kind: 'item', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) rows.push({kind: 'item', icon: 'ring', color: ctx.theme.accent, text: P.comparisonLabels.guide, name: 'lg-guide'});
  if (showKey) rows.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'lg-note'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function splitCols(ctx, rows, colW, F, cols) {
  const all = panelLayout(ctx, rows, {w: colW, F});
  if (cols === 1 || rows.length < 2) return [all];
  let best = null;
  for (let i = 1; i < rows.length; i++) {
    const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
    const hh = Math.max(a.h, b.h);
    if (!best || hh < best.h) best = {h: hh, cols: [a, b]};
  }
  return best.cols;
}

function compose(ctx, P, recs, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const rows = infoRows(ctx, P, recs);
  const gapP = F * 1.1;
  let PLs = [], ph = 0;
  const side = opt.pw && rows.length ? DW * opt.pw : 0;
  const colW = side ? side : (DW - 8 - (opt.cols - 1) * F * 1.2) / opt.cols;
  if (rows.length) { PLs = splitCols(ctx, rows, colW, F, side ? 1 : opt.cols); ph = Math.max(...PLs.map(q => q.h)); }
  const SW = DW - (side ? side + F * 1.2 : 0);
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const badgeR = F * 0.95;
  const hw = (opt.arr === 'row' ? (SW - F * 1.4) / 2 : SW) - badgeR * 2 - F * 0.8;
  const heads = [P.scenarioA, P.scenarioB].map(sc => ({
    lab: showKey ? fitG(sc.label, {maxWidth: hw, size: F * 1.08, minSize: F, maxLines: 1, weight: 700}) : null,
    cap: showAll && sc.caption ? fitG(sc.caption, {maxWidth: hw, size: F, minSize: F, maxLines: 2, weight: 500}) : null,
  }));
  const headOk = heads.every(hd => (!hd.lab || hd.lab.ok) && (!hd.cap || hd.cap.ok));
  const headH = Math.max(badgeR * 2 + 8, ...heads.map(hd => (hd.lab ? hd.lab.height : 0) + (hd.cap ? hd.cap.height + F * 0.25 : 0) + 10));
  const gap = opt.arr === 'row' ? F * 1.4 : F * 0.9;
  const avH = side ? DH : DH - (ph ? ph + gapP : 0);
  const stage = opt.arr === 'row' ? {w: (SW - gap) / 2, h: avH - headH} : {w: SW, h: (avH - gap) / 2 - headH};
  const benches = [0, 1].map(i => (opt.arr === 'row'
    ? {x: i * (stage.w + gap), y: headH, w: stage.w, h: stage.h, headY: 0}
    : {x: 0, y: i * (stage.h + headH + gap) + headH, w: stage.w, h: stage.h, headY: i * (stage.h + headH + gap)}));
  const inset = Math.max(12, Math.min(stage.w, stage.h) * 0.035);
  const G = stage.h > 150 && stage.w > 150 ? benches.map(b => sealStage({x: b.x + inset, y: b.y + inset, w: b.w - inset * 2, h: b.h - inset * 2}, {kind: P.items[0].kind, rows: recs.length, chainN: P.custodians.length})) : null;
  const panelOk = !side || ph <= DH;
  const ok = panelOk && PLs.every(q => q.ok) && headOk && G && G[0].fits && G[0].S >= 70;
  return {F, rows, PLs, ph, colW, headH, heads, badgeR, benches, stage, G, panelY: side ? Math.max(0, (DH - ph) / 2) : DH - ph, panelX: side ? DW - side : null, ok, arr: opt.arr,
    problems: [!PLs.every(q => q.ok) && 'panel-text', !headOk && 'head-text', (!G || G[0].S < 70) && 'stage-small', G && !G[0].fits && 'pouch-fit'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = epRecords(P);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{arr: 'col', cols: 1}, {arr: 'col', cols: 2}]
      : shape === 'square' ? [{arr: 'col', cols: 1, pw: 0.36}, {arr: 'col', cols: 1, pw: 0.42}, {arr: 'col', cols: 2}, {arr: 'row', cols: 2}]
        : [{arr: 'row', cols: 2}, {arr: 'row', cols: 3}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) for (const opt of opts) {
      const c = compose(ctx, P, recs, F, opt);
      const score = (c.G ? c.G[0].S : 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.7 : 1);
      if (c.ok && score > bestScore) { best = c; bestScore = score; }
      if (!C || c.problems.length < C.problems.length) C = c;
    }
    if (best) C = best;
    if (!C.G) C.G = C.benches.map(b => sealStage({x: b.x + 12, y: b.y + 12, w: Math.max(200, b.w - 24), h: Math.max(200, b.h - 24)}, {kind: P.items[0].kind, rows: recs.length, chainN: P.custodians.length}));
    const armW = clamp(C.G[0].S * 0.2, 30, 50);
    C.shoulderR = []; C.shoulderL = []; C.restR = []; C.restL = [];
    C.benches.forEach((b, i) => {
      const bb = b.y + b.h;
      const sOff = Math.max(80, b.h * 0.12);
      C.shoulderR[i] = {x: b.x + b.w * 0.74, y: bb + sOff};
      C.shoulderL[i] = {x: b.x + b.w * 0.2, y: bb + sOff};
      C.restR[i] = {x: C.shoulderR[i].x - armW * 0.6, y: bb - armW * 0.9};
      C.restL[i] = {x: C.shoulderL[i].x + armW * 0.6, y: bb - armW * 0.9};
    });
    let far = 0;
    for (let i = 0; i < 2; i++) for (let k = 0; k <= 80; k++) {
      const s = sealPose(C.G[i], {restR: C.restR[i], restL: C.restL[i]}, W, k / 80);
      far = Math.max(far, Math.hypot(s.handR.x - C.shoulderR[i].x, s.handR.y - C.shoulderR[i].y), Math.hypot(s.handL.x - C.shoulderL[i].x, s.handL.y - C.shoulderL[i].y));
    }
    const armLen = far * 0.55 + 18;
    const arms = [0, 1].map(i => ({
      R: gloveArm(ctx, {name: `arm${i}R`, handed: 'right', upper: armLen, lower: armLen, width: armW}),
      L: gloveArm(ctx, {name: `arm${i}L`, handed: 'left', upper: armLen, lower: armLen, width: armW}),
    }));
    const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    // the same number fit on both strips (identical geometry in A and B)
    const nf = numberFit(ctx, C.G[0].SM, P.sealNumber, C.F, vs);
    if (nf) { C.G[1].SM.plate = {...C.G[0].SM.plate}; C.G[1].SM.slitX = C.G[0].SM.slitX; }
    return {P, recs, C, arms, nf};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const parts = [];
    C.benches.forEach((b, i) => {
      const G = C.G[i];
      const pfx = i ? 'B' : 'A';
      const bench = benchNode(ctx, {prefix: `bench${pfx}`, x: b.x, y: b.y, w: b.w, h: b.h});
      const S = sealNodes(ctx, G, {prefix: pfx, rows: L.recs, chainN: P.custodians.length, number: L.nf, marker: i === 1, seedKey: 'ep-contrast'});
      const A = L.arms[i];
      parts.push(g({name: `stage${pfx}`},
        bench.surface,
        g({'clip-path': bench.clip},
          S.back, S.inside, S.front, S.card, S.flap, S.low,
          A.L.arm, A.R.arm, A.L.palm, A.R.palm,
          S.carried,
          A.L.thumb, A.R.thumb,
        ),
        bench.frame,
      ));
      const hd = C.heads[i], R = C.badgeR;
      const tx = b.x + R * 2 + C.F * 0.6;
      parts.push(g({name: `head${pfx}`},
        h('circle', {cx: r(b.x + R + 2), cy: r(b.headY + R + 2), r: r(R), fill: i ? th.accent2 : th.accent3, stroke: th.ink, 'stroke-width': 2.5}),
        ctx.show('key') ? h('text', {x: r(b.x + R + 2), y: r(b.headY + R + 2 + R * 0.42), 'text-anchor': 'middle', 'font-size': r(R * 1.2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, pfx) : null,
        hd.lab ? textAt(hd.lab, {x: tx, y: b.headY + 4, fill: th.fg}) : null,
        hd.cap ? textAt(hd.cap, {x: tx, y: b.headY + 4 + (hd.lab ? hd.lab.height + C.F * 0.25 : 0), fill: th.fgSoft}) : null,
      ));
    });
    parts.push(g({name: 'guide', opacity: 0},
      h('path', {name: 'guide-line', fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round'}),
      h('rect', {name: 'guide-a', fill: 'none', stroke: th.accent, 'stroke-width': 3.5, rx: 6}),
      h('rect', {name: 'guide-b', fill: 'none', stroke: th.accent, 'stroke-width': 3.5, rx: 6}),
    ));
    C.PLs.forEach((PLc, i) => parts.push(g({name: `info${i}`, transform: T(C.panelX ?? 4 + i * (C.colW + C.F * 1.2), C.panelY)}, epPanelNode(ctx, PLc))));
    return g({name: 'scene'}, parts);
  },
  frame(ctx, L, u) {
    const {C} = L;
    const nodes = {};
    const looks = [];
    const sem = {};
    const boxes = [];
    const slitK = seg(u, ...W.slit), markK = seg(u, ...W.mark);
    for (let i = 0; i < 2; i++) {
      const G = C.G[i];
      const pfx = i ? 'B' : 'A';
      const s = sealPose(G, {restR: C.restR[i], restL: C.restL[i]}, W, u);
      Object.assign(nodes, sealProps(pfx, G, s, i === 1 ? {slit: slitK, marker: markK, markerAt: markerAt(G, s.stripC, s.stripA, s.stripSc)} : {}));
      const A = L.arms[i];
      const pr = A.R.pose(C.shoulderR[i], s.handR, -1);
      const pl = A.L.pose(C.shoulderL[i], s.handL, 1);
      Object.assign(nodes, pr.nodes, pl.nodes);
      const b = C.benches[i];
      const rel = p => ({x: r(p.x - b.x, 1), y: r(p.y - b.y, 1)});
      const slit = i === 1 ? r(slitK, 3) : 0;
      looks.push({obj: rel(s.objPos), strip: rel(s.stripC), stripA: r(s.stripA, 2), flap: r(s.sy, 3), hand: rel(pr.hand), handL: rel(pl.hand), inside: s.inside, laid: s.laid, pressed: r(s.pressW, 1), slit});
      sem[`hand${pfx}`] = R2(pr.hand); sem[`handL${pfx}`] = R2(pl.hand); sem[`obj${pfx}`] = R2(s.objPos); sem[`strip${pfx}`] = R2(s.stripC);
      sem[`objGrip${pfx}`] = R2(s.objG); sem[`flapGrip${pfx}`] = R2(s.flapG); sem[`stripGrip${pfx}`] = R2(s.stripG); sem[`steady${pfx}`] = R2(s.steadyP); sem[`press${pfx}`] = R2(s.pressP);
      sem[`reached${pfx}`] = pr.reached && pl.reached;
      sem[`slit${pfx}`] = slit;
      // the compared stretch of the strip (around the slit position) in world space
      const SM = G.SM;
      const pts = [[SM.slitX - SM.h * 0.55, -SM.h * 0.62], [SM.slitX + SM.h * 0.55, -SM.h * 0.62], [SM.slitX + SM.h * 0.55, SM.h * 0.62], [SM.slitX - SM.h * 0.55, SM.h * 0.62]].map(([x, y]) => local({x, y}, s.stripC, s.stripA, s.stripSc));
      boxes.push(pts);
      if (i === 1) sem.phase = s.phase;
    }
    const gk = seg(u, ...W.guide);
    const bbox = pts => { const xs = pts.map(p => p.x), ys = pts.map(p => p.y); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}; };
    const ba = bbox(boxes[0]), bb = bbox(boxes[1]);
    const ca = {x: ba.x + ba.w / 2, y: ba.y + ba.h / 2}, cb = {x: bb.x + bb.w / 2, y: bb.y + bb.h / 2};
    // side by side: the guide leaves both outlines from their top edge (left part, clear of the Δ) and arcs above the
    // strips; stacked: it leaves both outlines from their right edge and arcs over the bench to the right
    const ea = C.arr === 'row' ? {x: ba.x + ba.w * 0.3, y: ba.y} : {x: ba.x + ba.w, y: ba.y + ba.h / 2};
    const eb = C.arr === 'row' ? {x: bb.x + bb.w * 0.3, y: bb.y} : {x: bb.x + bb.w, y: bb.y + bb.h / 2};
    const lenG = Math.hypot(eb.x - ea.x, eb.y - ea.y);
    const bend = C.arr === 'row' ? {x: (ea.x + eb.x) / 2, y: Math.min(ea.y, eb.y) - Math.max(90, C.G[0].S * 0.6)} : {x: Math.max(ea.x, eb.x) + Math.max(110, C.G[0].S * 0.6), y: (ea.y + eb.y) / 2};
    nodes.guide = {opacity: r(Math.min(1, gk * 3), 3)};
    nodes['guide-line'] = {d: `M${r(ea.x)} ${r(ea.y)}Q${r(bend.x)} ${r(bend.y)} ${r(eb.x)} ${r(eb.y)}`, 'stroke-dasharray': `${r(lenG * 1.4)} ${r(lenG * 1.4 + 10)}`, 'stroke-dashoffset': r(lenG * 1.4 * (1 - gk))};
    nodes['guide-a'] = {x: r(ba.x), y: r(ba.y), width: r(ba.w), height: r(ba.h)};
    nodes['guide-b'] = {x: r(bb.x), y: r(bb.y), width: r(bb.w), height: r(bb.h)};
    const noteK = seg(u, ...W.note);
    for (const PLc of C.PLs) for (const row of PLc.rows) {
      if (row.name === 'lg-guide') nodes[row.name] = {opacity: r(gk, 3)};
      if (row.name === 'lg-note') nodes[row.name] = {opacity: r(noteK, 3)};
    }
    const beat = u < CHANGE_AT ? 'base' : u < 0.4 ? 'change' : u < 0.77 ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat, ...sem, lookA: looks[0], lookB: looks[1], guide: r(gk, 3), marker: r(markK, 3),
        allReached: sem.reachedA && sem.reachedB, sealNumberOnStrip: Boolean(L.nf),
        problems: C.problems, textPx: r(C.F, 1), S: r(C.G[0].S, 1), arrangement: C.arr,
        stages: C.benches.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
        guideA: {x: r(ba.x), y: r(ba.y), w: r(ba.w), h: r(ba.h)}, guideB: {x: r(bb.x), y: r(bb.y), w: r(bb.w), h: r(bb.h)},
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
    slug: 'evidence-custody-02-contrast',
    title: 'Evidence packing — two identical benches: in A the seal strip stays intact, in B a supplied slit is marked on it; both pouches are packed and sealed in parallel',
    titleEs: 'Embalaje de prueba — Comparación de dos supuestos',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Embalaje de prueba',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical evidence benches (side by side on wide frames, stacked on tall ones), each with the same object, open pouch and numbered seal strip on its card. In B only, a supplied zig-zag slit is marked across the strip with the neutral Δ marker — the single difference; A keeps the strip intact. Then, in parallel, the object goes into the pouch, the flap is folded and the strip is laid across the flap edge and pressed down; the mark travels with B\'s strip. A guide outlines the same stretch of both strips; a neutral note. No winner, no consequence of the mark; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'packing', 'seal', 'tamper-evident', 'comparison', 'alteration marked', 'pouch', 'bench', 'gloves'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/embalaje-prueba.js', 'src/primitives/markers.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
