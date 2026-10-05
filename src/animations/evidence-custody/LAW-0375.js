/**
 * LAW-0375 — Registro fotográfico · contrast
 *
 * Storyboard (two complete evidence benches of identical size, A and B — side by side on wide frames, stacked on tall
 * ones; each holds the same object with its tag on a ball chain, the same open evidence bag, the same photo scale laid
 * along the object, the same camera folded on its stand arm and a photo board with one slot; gloved hands rest at each
 * bench edge; letter badges and scenario labels head each bench; a shared strip lists the changed fact, item, tag rows,
 * shared facts, custodians, times, the guide label, a neutral note and the key):
 *  0.00–0.17  base: the two benches are identical; in both the left hand takes the camera handle and the right hand
 *             moves onto the shutter button.
 *  0.17–0.40  the change (the only difference): in A the camera is swung to the FAR station — the wedge opens onto a
 *             wide field (vista general: bag, object, tag); in B it is brought to the NEAR station — the wedge closes
 *             onto a small field around the object and its scale (detalle documentado). Different station, wedge and
 *             field geometry.
 *  0.40–0.77  in parallel, the same exposure in both: flash, and a copy of exactly the framed field flies to the board.
 *             A's print shows the whole cluster with the object small; B's print shows the object large beside the
 *             scale. The hands return.
 *  0.77–1.00  a comparison guide outlines the same object inside both prints and joins them; a neutral note. No
 *             winner, no score and nothing about which photograph is better, required or sufficient.
 * @module animations/evidence-custody/LAW-0375
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {ecFields, localised, benchNode, gloveArm, panelLayout, R2, fitG, textAt} from './kits/evidence-art.js';
import {
  RF_EN, RF_ES, rfFields, rfRecords, rfRecordLine, rfStage, rfPose, subjectArt, rulerArt, cameraArt, standNodes,
  standProps, wedgeNodes, wedgeProps, printArt, printImage, boardArt, rfPanelNode, PRINT_AR,
} from './kits/registro-fotografico.js';

const ID = 'LAW-0375';
const DURATION = 7500;
const CHANGE_AT = 0.17;
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const TARGET = {A: 'scene', B: 'object'};
const W = {guide: [0.79, 0.85], note: [0.82, 0.87]};
const planFor = target => ({
  ruler: false, rulerPlaced: true, camReach: [0.03, 0.1], auxReach: [0.09, 0.16],
  views: [{target, move: [0.17, 0.38], shoot: [0.44, 0.5], fly: [0.5, 0.69]}],
  back: [0.7, 0.77], shots: [true], keepWedge: false,
});

const OWN_EN = {
  scenarioA: {label: 'Overview', caption: 'The camera stays far: one wide field'},
  scenarioB: {label: 'Documented detail', caption: 'The camera comes close to the object and its scale'},
  changedFact: 'Only the camera station differs: far in A (wide field), close in B (object with scale)',
  sharedFacts: ['Same object, tag, chain, bag and scale', 'The same hands and the same single exposure'],
  comparisonLabels: {guide: 'The same object in both prints', neutral: 'Two supplied framings side by side; no conclusion is drawn about either'},
};
const OWN_ES = {
  scenarioA: {label: 'Vista general', caption: 'La cámara queda lejos: un único campo amplio'},
  scenarioB: {label: 'Detalle documentado', caption: 'La cámara se acerca al objeto y a su escala'},
  changedFact: 'Solo cambia la posición de la cámara: lejos en A (campo amplio), cerca en B (objeto con escala)',
  sharedFacts: ['El mismo objeto, etiqueta, cadena, bolsa y escala', 'Las mismas manos y una sola toma'],
  comparisonLabels: {guide: 'El mismo objeto en ambas copias', neutral: 'Dos encuadres aportados, uno junto a otro; no se extrae ninguna conclusión'},
};
const EN = {...RF_EN, ...OWN_EN};
const ES = {...RF_ES, ...OWN_ES};

const {views: _views, ...rfFieldsNoViews} = rfFields;
const sceneSchema = {...ecFields, ...rfFieldsNoViews, ...contrastFields()};
const {views: _v1, ...EN0} = EN;
const defaultParams = {...EN0};

function infoRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', text: P.changedFact, name: 'lg-change'});
  if (showKey) rows.push({kind: 'item', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: rfRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.sharedFacts.forEach((f, i) => rows.push({kind: 'item', icon: 'ring', color: ctx.theme.fgSoft, text: f, name: `lg-shared${i}`}));
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
  const st = {kind: P.items[0].kind, targets: ['scene', 'object'], slots: 1, rows: recs.length, restRuler: false, ...opt.st};
  const G = stage.h > 150 && stage.w > 150 ? benches.map(b => rfStage({x: b.x + inset * 1.5, y: b.y + inset * 1.5, w: b.w - inset * 3, h: b.h - inset * 3}, st)) : null;
  const panelOk = !side || ph <= DH;
  const printOk = G && G[0].tray.pw >= G[0].S * 1.4;
  const ok = panelOk && PLs.every(q => q.ok) && headOk && G && G[0].fits && G[0].S >= 70 && printOk;
  return {F, rows, PLs, ph, colW, headH, heads, badgeR, benches, stage, G, panelY: side ? Math.max(0, (DH - ph) / 2) : DH - ph, panelX: side ? DW - side : null, ok, arr: opt.arr,
    problems: [!PLs.every(q => q.ok) && 'panel-text', !headOk && 'head-text', (!G || G[0].S < 70) && 'stage-small', G && !printOk && 'print-small'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN0, (({views, ...rest}) => rest)(ES));
    const recs = rfRecords(P);
    const shape = ctx.view.shape;
    const sts = [{tray: 'right', trayFrac: 0.34, approach: 'down'}, {tray: 'right', trayFrac: 0.4, approach: 'down'}, {tray: 'top', trayFrac: 0.3, approach: 'down'}, {tray: 'right', trayFrac: 0.28, approach: 'left'}, {tray: 'right', trayFrac: 0.34, approach: 'left'}];
    const opts0 = shape === 'portrait' ? [{arr: 'col', cols: 1}, {arr: 'col', cols: 2}]
      : shape === 'square' ? [{arr: 'col', cols: 1, pw: 0.36}, {arr: 'col', cols: 1, pw: 0.42}, {arr: 'row', cols: 2}, {arr: 'col', cols: 2}]
        : [{arr: 'row', cols: 2}, {arr: 'row', cols: 3}, {arr: 'row', cols: 1, pw: 0.22}, {arr: 'row', cols: 1, pw: 0.26}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) for (const o0 of opts0) for (const st of sts) {
      const c = compose(ctx, P, recs, F, {...o0, st});
      const score = (c.G ? c.G[0].S * Math.pow(Math.min(1, c.G[0].tray.pw / (2.2 * c.G[0].S)), 0.5) : 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.6 : 1);
      if (c.ok && score > bestScore) { best = c; bestScore = score; }
      if (!C || c.problems.length < C.problems.length) C = c;
    }
    if (best) C = best;
    if (!C.G) C.G = C.benches.map(b => rfStage({x: b.x + 12, y: b.y + 12, w: Math.max(300, b.w - 24), h: Math.max(300, b.h - 24)}, {kind: P.items[0].kind, targets: ['scene', 'object'], slots: 1, rows: recs.length, tray: 'right', trayFrac: 0.34}));
    const armW = clamp(C.G[0].S * 0.17, 28, 44);
    const plans = [planFor(TARGET.A), planFor(TARGET.B)];
    C.sh = C.benches.map((b, i) => {
      const G = C.G[i];
      const bb = b.y + b.h, sOff = Math.max(70, b.h * 0.1);
      const camX = (G.park.x + G.stations.scene.x + G.stations.object.x) / 3;
      const lx = clamp(camX - G.S * 0.6, b.x + b.w * 0.08, b.x + b.w * 0.6);
      const rx = clamp(Math.max(camX + G.S * 1.2, lx + b.w * 0.25), b.x + b.w * 0.3, b.x + b.w * 0.92);
      return {L: {x: lx, y: bb + sOff}, R: {x: rx, y: bb + sOff}, restCam: {x: lx + armW * 0.6, y: bb - armW * 0.9}, restAux: {x: rx - armW * 0.6, y: bb - armW * 0.9}};
    });
    let far = 0;
    for (let i = 0; i < 2; i++) for (let k = 0; k <= 80; k++) {
      const s = rfPose(C.G[i], C.sh[i], plans[i], k / 80);
      far = Math.max(far, Math.hypot(s.aux.x - C.sh[i].R.x, s.aux.y - C.sh[i].R.y), Math.hypot(s.camHand.x - C.sh[i].L.x, s.camHand.y - C.sh[i].L.y));
    }
    const armLen = far * 0.56 + 18;
    const arms = [0, 1].map(i => ({
      R: gloveArm(ctx, {name: `arm${i}R`, handed: 'right', upper: armLen, lower: armLen, width: armW}),
      L: gloveArm(ctx, {name: `arm${i}L`, handed: 'left', upper: armLen, lower: armLen, width: armW}),
    }));
    // the object as drawn inside each placed print (guide targets)
    const guides = [0, 1].map(i => {
      const G = C.G[i], s = G.tray.slots[0];
      const F0 = G.fields[i ? TARGET.B : TARGET.A];
      const PI = printImage(G.tray.pw, F0, s.x + s.w / 2, s.y + s.h / 2);
      const pad = G.S * 0.06;
      const a = PI.map({x: G.objC.x - G.M.w / 2 - pad, y: G.objC.y - G.M.h / 2 - pad});
      const b2 = PI.map({x: G.objC.x + G.M.w / 2 + pad, y: G.objC.y + G.M.h / 2 + pad});
      return {x: a.x, y: a.y, w: b2.x - a.x, h: b2.y - a.y};
    });
    const [ga, gb] = guides;
    const ea = C.arr === 'row' ? {x: ga.x + ga.w / 2, y: ga.y} : {x: ga.x + ga.w, y: ga.y + ga.h / 2};
    const eb = C.arr === 'row' ? {x: gb.x + gb.w / 2, y: gb.y} : {x: gb.x + gb.w, y: gb.y + gb.h / 2};
    const bend = C.arr === 'row' ? {x: (ea.x + eb.x) / 2, y: Math.min(ea.y, eb.y) - Math.max(80, C.G[0].S * 0.7)} : {x: Math.max(ea.x, eb.x) + Math.max(60, C.G[0].S * 0.5), y: (ea.y + eb.y) / 2};
    const lenG = Math.hypot(eb.x - ea.x, eb.y - ea.y) * 1.5;
    return {P, recs, C, arms, plans, guides, gd: {ea, eb, bend, lenG}};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const parts = [];
    C.benches.forEach((b, i) => {
      const G = C.G[i];
      const pfx = i ? 'B' : 'A';
      const bench = benchNode(ctx, {prefix: `bench${pfx}`, x: b.x, y: b.y, w: b.w, h: b.h});
      const A = L.arms[i];
      const pw = G.tray.pw;
      const pr = printArt(ctx, G, G.fields[i ? TARGET.B : TARGET.A], {name: `pr${pfx}`, pw, ph: pw / PRINT_AR, index: 0, rows: L.recs, ruler: true, numberText: null});
      parts.push(g({name: `stage${pfx}`},
        bench.surface,
        g({'clip-path': bench.clip},
          boardArt(ctx, G, {name: `board${pfx}`}),
          subjectArt(ctx, G, {prefix: `sc${pfx}`, rows: L.recs, ruler: true, seedKey: 'rf'}),
          standNodes(ctx, G, `stand${pfx}`),
          wedgeNodes(ctx, `wd${pfx}`),
          A.L.arm, A.R.arm, A.L.palm, A.R.palm,
          g({name: `cam${pfx}`}, cameraArt(ctx, G.CM, {name: `camArt${pfx}`})),
          h('circle', {name: `flash${pfx}`, r: r(G.S * 0.3), fill: '#fffbe6', opacity: 0}),
          A.L.thumb, A.R.thumb,
          pr,
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
    const [ga, gb] = L.guides;
    const {ea, eb, bend, lenG} = L.gd;
    parts.push(g({name: 'guide', opacity: 0},
      h('path', {name: 'guide-line', d: `M${r(ea.x)} ${r(ea.y)}Q${r(bend.x)} ${r(bend.y)} ${r(eb.x)} ${r(eb.y)}`, fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lenG)} ${r(lenG + 10)}`, 'stroke-dashoffset': r(lenG)}),
      h('rect', {x: r(ga.x), y: r(ga.y), width: r(ga.w), height: r(ga.h), fill: 'none', stroke: th.accent, 'stroke-width': 3.5, rx: 6}),
      h('rect', {x: r(gb.x), y: r(gb.y), width: r(gb.w), height: r(gb.h), fill: 'none', stroke: th.accent, 'stroke-width': 3.5, rx: 6}),
    ));
    C.PLs.forEach((PLc, i) => parts.push(g({name: `info${i}`, transform: T(C.panelX ?? 4 + i * (C.colW + C.F * 1.2), C.panelY)}, rfPanelNode(ctx, PLc))));
    return g({name: 'scene'}, parts);
  },
  frame(ctx, L, u) {
    const {C} = L;
    const nodes = {};
    const looks = [];
    const sem = {};
    for (let i = 0; i < 2; i++) {
      const G = C.G[i];
      const pfx = i ? 'B' : 'A';
      const s = rfPose(G, C.sh[i], L.plans[i], u);
      const F0 = G.fields[i ? TARGET.B : TARGET.A];
      nodes[`cam${pfx}`] = {transform: T(s.cam.x, s.cam.y, s.cam.a)};
      Object.assign(nodes, standProps(`stand${pfx}`, G, s.cam));
      Object.assign(nodes, wedgeProps(`wd${pfx}`, G, s.cam, F0, s.wedgeOp));
      const tip = {x: s.cam.x + Math.sin(s.cam.a * Math.PI / 180) * G.CM.Cs * 0.7, y: s.cam.y - Math.cos(s.cam.a * Math.PI / 180) * G.CM.Cs * 0.7};
      nodes[`flash${pfx}`] = {cx: r(tip.x), cy: r(tip.y), opacity: r(s.flash * 0.9, 3)};
      const p = s.prints[0];
      nodes[`pr${pfx}`] = {transform: T(p.x, p.y, 0, p.s), opacity: p.state === 'none' ? 0 : 1};
      nodes[`pr${pfx}-border`] = {opacity: r(p.border || 0, 3)};
      const A = L.arms[i];
      const pr = A.R.pose(C.sh[i].R, s.aux, -1);
      const pl = A.L.pose(C.sh[i].L, s.camHand, 1);
      Object.assign(nodes, pr.nodes, pl.nodes);
      const b = C.benches[i];
      const rel = q => ({x: r(q.x - b.x, 1), y: r(q.y - b.y, 1)});
      looks.push({cam: rel(s.cam), camA: r(s.cam.a, 2), hand: rel(pr.hand), handL: rel(pl.hand), wedge: r(s.wedgeOp, 3), print: p.state, ruler: rel(s.rul)});
      sem[`cam${pfx}`] = R2(s.cam); sem[`hand${pfx}`] = R2(pr.hand); sem[`handL${pfx}`] = R2(pl.hand); sem[`camGrip${pfx}`] = R2(s.camG);
      sem[`btn${pfx}`] = R2({x: s.btnG.x, y: s.btnG.y + s.press * G.S * 0.03}); sem[`print${pfx}`] = R2(p); sem[`printState${pfx}`] = p.state;
      sem[`reached${pfx}`] = pr.reached && pl.reached;
      sem[`field${pfx}`] = r(F0.w, 1);
      if (i === 1) sem.phase = s.phase;
    }
    const gk = seg(u, ...W.guide);
    nodes.guide = {opacity: r(Math.min(1, gk * 3), 3)};
    nodes['guide-line'] = {'stroke-dashoffset': r(L.gd.lenG * (1 - gk), 1)};
    const noteK = seg(u, ...W.note);
    for (const PLc of C.PLs) for (const row of PLc.rows) {
      if (row.name === 'lg-guide') nodes[row.name] = {opacity: r(gk, 3)};
      if (row.name === 'lg-note') nodes[row.name] = {opacity: r(noteK, 3)};
    }
    const beat = u < CHANGE_AT ? 'base' : u < 0.4 ? 'change' : u < 0.77 ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat, ...sem, lookA: looks[0], lookB: looks[1], guide: r(gk, 3),
        allReached: sem.reachedA && sem.reachedB,
        problems: C.problems, textPx: r(C.F, 1), S: r(C.G[0].S, 1), arrangement: C.arr, printW: r(C.G[0].tray.pw, 1),
        stages: C.benches.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
        guideA: L.guides[0], guideB: L.guides[1],
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
    slug: 'evidence-custody-04-contrast',
    title: 'Photographic record — two identical benches: in A the camera stays far (overview), in B it comes close to the object and its scale (documented detail); one exposure each and the two prints compared',
    titleEs: 'Registro fotográfico — Comparación de dos supuestos',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Registro fotográfico',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical evidence benches (side by side on wide frames, stacked on tall ones), each with the same object, tag on a ball chain, open bag, laid photo scale, camera on a stand arm and a one-slot photo board. The only difference is the camera station: far in A (a wide wedge onto the whole cluster — overview), close in B (a narrow wedge onto the object and its scale — documented detail). One exposure in both: each print copies exactly its field and flies to the board. A guide outlines the same object inside both prints; a neutral note. No winner and nothing about which photograph is better or required; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'photography', 'comparison', 'overview', 'detail', 'scale', 'camera', 'framing', 'prints'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/registro-fotografico.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
