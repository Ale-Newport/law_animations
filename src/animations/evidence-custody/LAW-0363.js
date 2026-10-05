/**
 * LAW-0363 — Etiquetado de indicio · contrast
 *
 * Storyboard (two complete evidence benches of identical size, A and B — side by side on wide frames, stacked on tall
 * ones; each holds the same object, the same blank manila tag with its loose ball chain, a pen and an open evidence
 * bag; gloved hands rest at each bench's edge; a shared strip lists the changed fact, the rows, shared facts, item,
 * custodians and times, the guide label, a neutral note and the key):
 *  0.00–0.17  base: the two benches are identical (same tag, all rows blank, same positions).
 *  0.17–0.40  the change: in both benches the right hand takes the pen and writes the tag's rows in order; in A every
 *             row is written ("Objeto identificado"); in B the pen lifts over the supplied changed row and leaves it
 *             blank ("etiqueta incompleta"). This is the only difference, and it is a different pen path (lift) and
 *             a different tag geometry (an empty row). The pen is put back.
 *  0.40–0.77  in parallel, the same action in both: the hand carries the tag to the object, the other hand steadies
 *             it, the chain is clipped; the object is lifted and carried into the bag while its tag stays attached.
 *  0.77–1.00  a comparison guide links the written row in A with the blank row in B; a neutral note. No winner, no
 *             score, no consequence of the blank row (nothing about admissibility, validity or custody).
 * @module animations/evidence-custody/LAW-0363
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {polyline} from '../../core/geometry.js';
import {pen} from '../../primitives/paper.js';
import {
  ecFields, EC_EN, EC_ES, localised, benchNode, gloveArm, panelLayout, panelNode, R2, pathAt, fitG, textAt, scribblePoints,
} from './kits/evidence-art.js';
import {
  EI_LABELS_EN, EI_LABELS_ES, eiLabelFields, resolveRecords, stageModel, stageNodes, stageProps, local, actionPose,
} from './kits/etiquetado-indicio.js';

const ID = 'LAW-0363';
const DURATION = 7500;
const CHANGE_AT = 0.17;
const W = {
  toPen: [0.17, 0.2], write: [0.225, 0.36], penBack: [0.36, 0.4],
  reachTag: [0.4, 0.46], carryTag: [0.46, 0.53], steadyIn: [0.42, 0.52], clip: [0.53, 0.58], release: [0.58, 0.6],
  steadyOut: [0.6, 0.67], toObj: [0.6, 0.64], lift: [0.64, 0.66], carry: [0.66, 0.74], lower: [0.74, 0.77], back: [0.77, 0.83],
  guide: [0.79, 0.85], note: [0.82, 0.87],
};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {inB: 'in B', blankRow: 'left blank'},
  es: {inB: 'en B', blankRow: 'en blanco'},
};

const OWN_EN = {
  labels: EI_LABELS_EN,
  scenarioA: {label: 'Object identified', caption: 'Every row of the tag is written'},
  scenarioB: {label: 'Incomplete tag', caption: 'One row of the tag is left blank'},
  changedFact: 'In B the "Time" row of the tag is left blank; everything else is the same',
  changedRecord: 3,
  sharedFacts: ['Same object, tag, chain and bag', 'The same hands clip the tag and bag the object'],
  comparisonLabels: {guide: 'Only this row differs', neutral: 'Two supplied situations side by side; no conclusion is drawn about either'},
};
const OWN_ES = {
  labels: EI_LABELS_ES,
  scenarioA: {label: 'Objeto identificado', caption: 'Todas las filas de la etiqueta están escritas'},
  scenarioB: {label: 'Etiqueta incompleta', caption: 'Una fila de la etiqueta queda en blanco'},
  changedFact: 'En B la fila «Hora» de la etiqueta queda en blanco; todo lo demás es igual',
  changedRecord: 3,
  sharedFacts: ['El mismo objeto, etiqueta, cadenilla y bolsa', 'Las mismas manos unen la etiqueta y embolsan el objeto'],
  comparisonLabels: {guide: 'Solo esta fila cambia', neutral: 'Dos supuestos aportados, uno junto a otro; no se extrae ninguna conclusión'},
};
const EN = {...EC_EN, ...OWN_EN};
const ES = {...EC_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...eiLabelFields,
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 40), caption: str('One-line description', 70)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 40), caption: str('One-line description', 70)}, ['label']),
  changedFact: str('The single fact that differs between A and B (describe the blank row)', 110),
  changedRecord: int('Index in `records` of the row that B leaves blank (the only difference)', 0, 4),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label of the guide linking the changed row', 50), neutral: str('Neutral note (no winner, no outcome)', 110)}, ['guide', 'neutral']),
};

const defaultParams = {...EN};

function infoRows(ctx, P, recs, ci) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', text: P.changedFact, name: 'lg-change'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: i === ci ? 'row-blank' : 'row-filled', text: i === ci ? `${rw.field}: A ${rw.value} · ${ctx.t.inB} ${P.labels.blank}` : `${rw.field}: ${rw.value}`, name: `lg-rec${i}`}));
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

function compose(ctx, P, recs, ci, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const rows = infoRows(ctx, P, recs, ci);
  const gapP = F * 1.1;
  let PLs = [], ph = 0;
  const cols = opt.cols;
  const side = opt.pw && rows.length ? DW * opt.pw : 0; // panel in a right-hand column (stacked benches at 1:1)
  const colW = side ? side : (DW - 8 - (cols - 1) * F * 1.2) / cols;
  if (rows.length) { PLs = splitCols(ctx, rows, colW, F, side ? 1 : cols); ph = Math.max(...PLs.map(q => q.h)); }
  const SW = DW - (side ? side + F * 1.2 : 0);
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const badgeR = F * 0.95;
  const hw = (opt.arr === 'row' ? (SW - F * 1.4) / 2 : SW) - badgeR * 2 - F * 0.8;
  const heads = [P.scenarioA, P.scenarioB].map(sc => {
    const lab = showKey ? fitG(sc.label, {maxWidth: hw, size: F * 1.08, minSize: F, maxLines: 1, weight: 700}) : null;
    const cap = showAll && sc.caption ? fitG(sc.caption, {maxWidth: hw, size: F, minSize: F, maxLines: 2, weight: 500}) : null;
    return {lab, cap};
  });
  const headOk = heads.every(hd => (!hd.lab || hd.lab.ok) && (!hd.cap || hd.cap.ok));
  const headH = Math.max(badgeR * 2 + 8, ...heads.map(hd => (hd.lab ? hd.lab.height : 0) + (hd.cap ? hd.cap.height + F * 0.25 : 0) + 10));
  const gap = opt.arr === 'row' ? F * 1.4 : F * 0.9;
  const avH = side ? DH : DH - (ph ? ph + gapP : 0);
  let stage;
  if (opt.arr === 'row') {
    const sw = (SW - gap) / 2;
    stage = {w: sw, h: avH - headH};
  } else {
    stage = {w: SW, h: (avH - gap) / 2 - headH};
  }
  const benches = [0, 1].map(i => opt.arr === 'row'
    ? {x: i * (stage.w + gap), y: headH, w: stage.w, h: stage.h, headY: 0}
    : {x: 0, y: i * (stage.h + headH + gap) + headH, w: stage.w, h: stage.h, headY: i * (stage.h + headH + gap)});
  const inset = Math.max(12, Math.min(stage.w, stage.h) * 0.035);
  const mat = b => ({x: b.x + inset, y: b.y + inset, w: b.w - inset * 2, h: b.h - inset * 2});
  const G = benches.map(b => stageModel(mat(b), {kind: P.items[0].kind, rows: recs.length, flat: true}));
  const panelOk = !side || ph <= DH;
  const ok = panelOk && PLs.every(q => q.ok) && headOk && stage.h > 220 && G[0].fitsBag;
  return {F, rows, PLs, ph, colW, headH, heads, badgeR, benches, stage, G, panelY: side ? Math.max(0, (DH - ph) / 2) : DH - ph, panelX: side ? DW - side : null, ok, arr: opt.arr,
    problems: [!PLs.every(q => q.ok) && 'panel-text', stage.h <= 220 && 'stage-small', !G[0].fitsBag && 'bag-fit'].filter(Boolean)};
}

/** Pen tip path and writing state for a bench at u. */
function penState(L, i, u) {
  const {C} = L;
  const G = C.G[i], Pn = L.pens[i];
  const n = L.recs.length;
  const skip = i === 1 ? L.ci : -1;
  const TG = G.TG;
  // the pen tip follows the very scribble the tag draws (same seed, same geometry), so ink appears under the nib
  const rowPath = k => {
    const ck = `${i}-${k}`;
    if (!L.rowCache[ck]) {
      const xs = TG.rx0 + TG.stub + 8;
      const len = clamp(L.lens[k], 0.3, 1);
      const R = TG.rows[k];
      const pts = scribblePoints(L.ctx, `ei-contrast-${k}`, xs, xs + (TG.rx1 - xs - 4) * len, R.y, Math.min(R.h * 0.4, TG.h * 0.09));
      L.rowCache[ck] = polyline(pts.map(q => local(q, G.tagHole0, G.tableAngle)));
    }
    return L.rowCache[ck];
  };
  const rowLine = k => [rowPath(k).at(0), rowPath(k).at(1)];
  const write = Array(n).fill(0);
  let tip = Pn.park, lifted = true, held = false;
  if (u >= W.toPen[1] && u < W.penBack[0]) {
    held = true;
    const k = seg(u, ...W.write) * n;
    const ri = Math.min(n - 1, Math.floor(k));
    const f = k - ri;
    for (let q = 0; q < n; q++) write[q] = q === skip ? 0 : q < ri ? 1 : q > ri ? 0 : clamp(f / 0.78);
    const [a, b] = rowLine(ri);
    if (u < W.write[0]) { tip = rowLine(0)[0]; }
    else if (f <= 0.78) { const q = rowPath(ri).at(f / 0.78); tip = {x: q.x, y: q.y}; lifted = ri === skip; }
    else {
      const nxt = ri + 1 < n ? rowLine(ri + 1)[0] : b;
      const t = ease.inOutCubic((f - 0.78) / 0.22);
      tip = {x: lerp(b.x, nxt.x, t), y: lerp(b.y, nxt.y, t)};
    }
    if (u >= W.write[1]) { for (let q = 0; q < n; q++) write[q] = q === skip ? 0 : 1; tip = rowLine(n - 1)[1]; }
  } else if (u >= W.penBack[0]) {
    for (let q = 0; q < n; q++) write[q] = q === skip ? 0 : 1;
    if (u < W.penBack[1]) { held = true; tip = pathAt([[W.penBack[0], rowLine(n - 1)[1]], [W.penBack[1], Pn.park]], u); }
  }
  // before the pen is taken it lies at the park point
  if (u < W.toPen[1]) { tip = u < W.toPen[1] ? Pn.park : tip; held = false; }
  if (u >= W.toPen[1] && u < W.write[0]) tip = pathAt([[W.toPen[1], Pn.park], [W.write[0], rowLine(0)[0]]], u);
  const a = (Pn.angle * Math.PI) / 180;
  const grip = {x: tip.x + Math.cos(a) * Pn.grip, y: tip.y + Math.sin(a) * Pn.grip};
  return {tip, grip, write, lifted: lifted || !held, held};
}

function benchPose(L, i, u) {
  const {C} = L;
  const G = C.G[i];
  const ps = penState(L, i, u);
  const Ci = {restR: L.pens[i].parkGrip, restL: C.restL[i]};
  const s = actionPose(G, Ci, W, u, {doTag: true, doBag: true});
  // right hand: bench edge → pen (0.17–0.21) → writing → pen back (0.40) → the tag-and-bag action (from the pen's park)
  let handR = s.handR;
  if (u < W.toPen[1]) handR = pathAt([[W.toPen[0], C.restR[i]], [W.toPen[1], L.pens[i].parkGrip]], u);
  else if (u < W.penBack[1]) handR = ps.grip;
  if (u >= W.back[0]) handR = pathAt([[W.back[0], s.objG], [W.back[1], C.restR[i]]], u);
  return {...s, handR, pen: ps};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = resolveRecords(P).map(rw => ({...rw, filled: true}));
    const ci = Math.min(recs.length - 1, P.changedRecord);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{arr: 'col', cols: 1}, {arr: 'col', cols: 2}]
      : shape === 'square' ? [{arr: 'col', cols: 1, pw: 0.36}, {arr: 'col', cols: 1, pw: 0.42}, {arr: 'col', cols: 2}, {arr: 'row', cols: 2}]
        : [{arr: 'row', cols: 2}, {arr: 'row', cols: 3}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) for (const opt of opts) {
      const c = compose(ctx, P, recs, ci, F, opt);
      const score = c.G[0].S * Math.sqrt(F / 24) * (F < 19.5 ? 0.7 : 1);
      if (c.ok && score > bestScore) { best = c; bestScore = score; }
      if (!C || c.problems.length < C.problems.length) C = c;
    }
    if (best) C = best;
    const lens = recs.map((_, k) => 0.55 + ((k * 37) % 40) / 100);
    const armW = clamp(C.G[0].S * 0.24, 30, 50);
    C.shoulderR = []; C.shoulderL = []; C.restR = []; C.restL = [];
    const pens = [];
    C.benches.forEach((b, i) => {
      const G = C.G[i];
      const bb = b.y + b.h;
      const sOff = Math.max(90, b.h * 0.14);
      C.shoulderR[i] = {x: b.x + b.w * (G.wide ? 0.6 : 0.78), y: bb + sOff};
      C.shoulderL[i] = {x: b.x + b.w * (G.wide ? 0.14 : 0.16), y: bb + sOff};
      C.restR[i] = {x: C.shoulderR[i].x - armW * 0.6, y: bb - armW * 0.9};
      C.restL[i] = {x: C.shoulderL[i].x + armW * 0.6, y: bb - armW * 0.9};
      const len = G.S * 0.95;
      const angle = 40;
      const park = {x: G.box.x + G.box.w * (G.wide ? 0.42 : 0.68), y: G.box.y + G.box.h * (G.wide ? 0.78 : 0.4)};
      const a = (angle * Math.PI) / 180;
      const pn = pen(ctx, {name: `pen${i}`, length: len});
      pens.push({node: pn.node, grip: pn.grip, angle, park, parkGrip: {x: park.x + Math.cos(a) * pn.grip, y: park.y + Math.sin(a) * pn.grip}});
    });
    const L0 = {P, recs, ci, C, pens, lens, rowCache: {}, ctx};
    let far = 0;
    for (let i = 0; i < 2; i++) for (let k = 0; k <= 80; k++) {
      const s = benchPose(L0, i, k / 80);
      far = Math.max(far, Math.hypot(s.handR.x - C.shoulderR[i].x, s.handR.y - C.shoulderR[i].y), Math.hypot(s.handL.x - C.shoulderL[i].x, s.handL.y - C.shoulderL[i].y));
    }
    const armLen = far * 0.5 + 18;
    const arms = [0, 1].map(i => ({
      R: gloveArm(ctx, {name: `arm${i}R`, handed: 'right', upper: armLen, lower: armLen, width: armW}),
      L: gloveArm(ctx, {name: `arm${i}L`, handed: 'left', upper: armLen, lower: armLen, width: armW}),
    }));
    return {...L0, arms};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const parts = [];
    C.benches.forEach((b, i) => {
      const G = C.G[i];
      const pfx = i ? 'B' : 'A';
      const bench = benchNode(ctx, {prefix: `bench${pfx}`, x: b.x, y: b.y, w: b.w, h: b.h});
      const S = stageNodes(ctx, G, {prefix: pfx, rows: L.recs.map((_, k) => ({filled: false, len: L.lens[k]})), seedKey: 'ei-contrast'});
      const A = L.arms[i];
      parts.push(g({name: `stage${pfx}`},
        bench.surface,
        g({'clip-path': bench.clip},
          S.back, S.inside, S.front,
          g({name: `penWrap${i}`}, L.pens[i].node),
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
    // comparison guide (drawn at the hold between the changed row in A and in B)
    parts.push(g({name: 'guide', opacity: 0},
      h('path', {name: 'guide-line', fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round'}),
      h('rect', {name: 'guide-a', fill: 'none', stroke: th.accent, 'stroke-width': 3.5, rx: 6}),
      h('rect', {name: 'guide-b', fill: 'none', stroke: th.accent, 'stroke-width': 3.5, rx: 6}),
    ));
    L.C.PLs.forEach((PLc, i) => parts.push(g({name: `info${i}`, transform: T(C.panelX ?? 4 + i * (C.colW + C.F * 1.2), C.panelY)}, panelNode(ctx, PLc))));
    return g({name: 'scene'}, parts);
  },
  frame(ctx, L, u) {
    const {C} = L;
    const nodes = {};
    const looks = [];
    const sem = {};
    const rowBoxes = [];
    for (let i = 0; i < 2; i++) {
      const G = C.G[i];
      const pfx = i ? 'B' : 'A';
      const s = benchPose(L, i, u);
      Object.assign(nodes, stageProps(pfx, G, {obj: s.objPos, lift: s.lift, inside: s.inside, hole: s.hole, tagAngle: s.tagAngle, chainEnd: s.chainEnd, clasp: s.clasp, tagLift: s.tagLift, write: s.pen.write}));
      const pl = s.pen;
      nodes[`penWrap${i}`] = {transform: T(pl.tip.x, pl.tip.y, L.pens[i].angle, pl.lifted && pl.held ? 1.06 : 1)};
      const A = L.arms[i];
      const pr = A.R.pose(C.shoulderR[i], s.handR, -1);
      const pll = A.L.pose(C.shoulderL[i], s.handL, 1);
      Object.assign(nodes, pr.nodes, pll.nodes);
      const b = C.benches[i];
      const rel = p => ({x: r(p.x - b.x, 1), y: r(p.y - b.y, 1)});
      looks.push({obj: rel(s.objPos), hole: rel(s.hole), tagAngle: r(s.tagAngle, 2), hand: rel(pr.hand), handL: rel(pll.hand), pen: rel(pl.tip), lifted: pl.lifted, write: pl.write.map(w => r(w, 3)), inside: s.inside, attached: s.attached});
      sem[`hand${pfx}`] = R2(pr.hand); sem[`handL${pfx}`] = R2(pll.hand); sem[`obj${pfx}`] = R2(s.objPos); sem[`hole${pfx}`] = R2(s.hole);
      sem[`pen${pfx}`] = R2(pl.tip); sem[`penGrip${pfx}`] = R2(pl.grip); sem[`penHeld${pfx}`] = pl.held;
      sem[`tagGrip${pfx}`] = R2(s.tagG); sem[`objGrip${pfx}`] = R2(s.objG); sem[`steady${pfx}`] = R2(s.steadyP);
      sem[`reached${pfx}`] = pr.reached && pll.reached;
      sem[`chainLen${pfx}`] = r(Math.hypot(s.hole.x - s.anchor.x, s.hole.y - s.anchor.y), 2);
      // the changed row's box in world space (tag pose)
      const TG = G.TG, R = TG.rows[L.ci];
      const pts = [[TG.rx0 - 4, R.top], [TG.rx1 + 4, R.top], [TG.rx1 + 4, R.top + R.h], [TG.rx0 - 4, R.top + R.h]].map(([x, y]) => local({x, y}, s.hole, s.tagAngle));
      rowBoxes.push(pts);
    }
    // guide: outlines around the changed row in both tags + a line between their centres (only in the hold)
    const gk = seg(u, ...W.guide);
    const bbox = pts => { const xs = pts.map(p => p.x), ys = pts.map(p => p.y); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}; };
    const ba = bbox(rowBoxes[0]), bb = bbox(rowBoxes[1]);
    const ca = {x: ba.x + ba.w / 2, y: ba.y + ba.h / 2}, cb = {x: bb.x + bb.w / 2, y: bb.y + bb.h / 2};
    const edge = (bx, toward) => (C.arr === 'row' ? {x: toward.x > bx.x + bx.w / 2 ? bx.x + bx.w : bx.x, y: bx.y + bx.h / 2} : {x: bx.x + bx.w / 2, y: toward.y > bx.y + bx.h / 2 ? bx.y + bx.h : bx.y});
    const ea = edge(ba, cb), eb = edge(bb, ca);
    const lenG = Math.hypot(eb.x - ea.x, eb.y - ea.y);
    const bend = C.arr === 'row' ? {x: (ea.x + eb.x) / 2, y: Math.max(ea.y, eb.y) + 60} : {x: Math.max(ea.x, eb.x) + 80, y: (ea.y + eb.y) / 2};
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
        beat, ...sem, lookA: looks[0], lookB: looks[1], guide: r(gk, 3), changedRecord: L.ci,
        writtenA: looks[0].write, writtenB: looks[1].write,
        allReached: sem.reachedA && sem.reachedB,
        problems: C.problems, textPx: r(C.F, 1), S: r(C.G[0].S, 1), arrangement: C.arr,
        stages: C.benches.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})), chainL: r(C.G[0].chainL, 2),
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
    slug: 'evidence-custody-01-contrast',
    title: 'Evidence tagging — two identical benches: in A every tag row is written, in B one supplied row is left blank; both tags are clipped on and bagged',
    titleEs: 'Etiquetado de indicio — Comparación de dos supuestos',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Etiquetado de indicio',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical evidence benches (side by side on wide frames, stacked on tall ones). In both, a gloved hand writes the tag\'s rows with a pen; in A every row is written, in B the pen lifts over one supplied row and leaves it blank — the only difference. Then, in parallel, the tag is clipped to the object and the object is carried into its bag with the tag attached. A guide links the written row in A with the blank row in B; a neutral note. No winner and no consequence of the blank row; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'tag', 'label', 'blank row', 'comparison', 'evidence bag', 'chain', 'pen', 'bench'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/etiquetado-indicio.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
