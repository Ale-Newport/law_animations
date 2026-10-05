/**
 * LAW-0374 — Registro fotográfico · mechanism
 *
 * Storyboard (a spatial map of one photographic record laid out on the evidence bench: the object sits at the
 * centre with its tag on a ball chain, the open bag and the laid photo scale; the camera on its stand arm; a photo
 * board with two slots; every component carries its editable label chip; a legend lists item, custodians, times,
 * tag rows, the relation kinds in use and the key):
 *  0.00–0.18  assemble: no hands — the camera swings on its arm to the far station (wide wedge, overview field) and
 *             its print flies to slot 1, then to the near station (narrow wedge onto the object and scale) and the
 *             detail print flies to slot 2. Label chips fade in once their parts are in place.
 *  0.18–0.43  only the explicit relationships are drawn, one after another, anchored to the components' edges; a
 *             plain relation has no arrowhead (causal arrows only when the author supplies a causal relation).
 *  0.43–0.75  a tracer follows the supplied traversal order along the drawn relations (by default camera → overview →
 *             object → detail → scale: several views, one object); the focus component (the detail print) enlarges.
 *  0.75–1.00  hold: the map stays with every relation and label visible; line kinds keyed in the legend. No doctrine
 *             on photographic evidence and no outcome.
 * @module animations/evidence-custody/LAW-0374
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {edgeAnchor, roundRectPath, polyline} from '../../core/geometry.js';
import {connector, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {
  ecFields, localised, benchNode, panelLayout, R2, fitG, textAt, objectArt, tagArt, bagBack, bagFront, overlaps, INK, METAL, METAL_DARK,
} from './kits/evidence-art.js';
import {chainD} from './kits/evidence-art.js';
import {
  RF_EN, RF_ES, rfFields, rfRecords, rfRecordLine, rfStage, rulerArt, cameraArt, standNodes, standProps, wedgeNodes,
  wedgeProps, printArt, printFly, boardArt, rfPanelNode, PRINT_AR,
} from './kits/registro-fotografico.js';

const ID = 'LAW-0374';
const DURATION = 7000;
const EL = ['camera', 'overview', 'detail', 'object', 'scale', 'tag', 'chain', 'bag'];
const W = {mv1: [0.02, 0.06], sh1: [0.065, 0.075], fl1: [0.075, 0.11], mv2: [0.1, 0.13], sh2: [0.135, 0.145], fl2: [0.145, 0.18], labels: [0.16, 0.2], draw: [0.19, 0.43], trace: [0.43, 0.75], focus: [0.43, 0.49], unfocus: [0.75, 0.8]};
const mechColor = (ctx, k) => ({relation: ctx.theme.accent3, communication: '#7fb0d8', sequence: '#e58e73', causal: ctx.theme.accent}[k] || ctx.theme.accent3);
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  elements: [
    {id: 'camera', label: 'Camera on its arm'}, {id: 'overview', label: 'Overview print'}, {id: 'detail', label: 'Detail print with scale'},
    {id: 'object', label: 'Object (fictional)'}, {id: 'scale', label: 'Photo scale'}, {id: 'tag', label: 'Tag'},
    {id: 'chain', label: 'Ball chain'}, {id: 'bag', label: 'Evidence bag'},
  ],
  relationships: [
    {from: 'camera', to: 'overview', kind: 'relation'}, {from: 'camera', to: 'detail', kind: 'relation'},
    {from: 'overview', to: 'object', kind: 'relation'}, {from: 'detail', to: 'object', kind: 'relation'},
    {from: 'detail', to: 'scale', kind: 'relation'}, {from: 'object', to: 'chain', kind: 'relation'},
    {from: 'chain', to: 'tag', kind: 'relation'}, {from: 'object', to: 'bag', kind: 'relation'},
  ],
  focusElement: 'detail',
  relationLabels: {relation: 'linked (as supplied)', communication: 'communicates (as supplied)', sequence: 'then (sequence as configured)', causal: 'causes (supplied)'},
  traversalOrder: ['camera', 'overview', 'object', 'detail', 'scale'],
};
const OWN_ES = {
  elements: [
    {id: 'camera', label: 'Cámara en su brazo'}, {id: 'overview', label: 'Copia de vista general'}, {id: 'detail', label: 'Copia de detalle con escala'},
    {id: 'object', label: 'Objeto (ficticio)'}, {id: 'scale', label: 'Escala fotográfica'}, {id: 'tag', label: 'Etiqueta'},
    {id: 'chain', label: 'Cadena de bolas'}, {id: 'bag', label: 'Bolsa de pruebas'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'detail',
  relationLabels: {relation: 'unidos (según lo aportado)', communication: 'comunica (según lo aportado)', sequence: 'después (secuencia configurada)', causal: 'causa (aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const {views: _ve, ...RFE} = RF_EN;
const {views: _vs, ...RFS} = RF_ES;
const EN = {...RFE, ...OWN_EN};
const ES = {...RFS, ...OWN_ES};
const {views: _vf, ...rfF} = rfFields;

const sceneSchema = {...ecFields, ...rfF, ...mechanismFields(EL)};
const defaultParams = {...EN};

function legendRows(ctx, P, recs, kinds) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: rfRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) kinds.forEach(k => rows.push({kind: 'item', icon: `line-${k}`, color: mechColor(ctx, k), text: P.relationLabels[k] || k, name: `lg-kind-${k}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function legendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  if (!rows.length) return {bench: {x: 0, y: 0, w: DW, h: DH}, panel: null, PL: null};
  if (opt.mode === 'below') {
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
    return {bench: {x: 0, y: 0, w: DW, h: DH - ph - gap}, panel: {x: 4, y: DH - ph}, PL: {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW}};
  }
  const PW = DW * opt.pw;
  const one = panelLayout(ctx, rows, {w: PW, F});
  return {bench: {x: 0, y: 0, w: DW - PW - gap, h: DH}, panel: {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)}, PL: {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW}};
}

/** Component boxes (world) of the assembled map. */
function boxesOf(G) {
  const {M, T0} = G;
  const R0 = G.ruler.placed;
  const cam = G.stations.object, cr = G.CM.radius * 0.9;
  const s0 = G.tray.slots[0], s1 = G.tray.slots[1];
  return {
    object: {x: G.objC.x - M.w / 2, y: G.objC.y - M.h / 2, w: M.w, h: M.h},
    tag: {x: G.hole.x + T0.x0, y: G.hole.y - T0.h / 2, w: T0.w, h: T0.h + T0.w * 0.14},
    chain: {x: Math.min(G.anchor.x, G.hole.x), y: Math.min(G.anchor.y, G.hole.y), w: Math.abs(G.hole.x - G.anchor.x), h: Math.abs(G.hole.y - G.anchor.y) + G.S * 0.12},
    bag: {x: G.bag.x, y: G.bag.y, w: G.bag.w, h: G.bag.h},
    scale: {x: R0.x, y: R0.y - G.ruler.Lv, w: G.ruler.L, h: G.ruler.Lv},
    camera: {x: cam.x - cr, y: cam.y - cr, w: cr * 2, h: cr * 2},
    overview: {x: s0.x, y: s0.y, w: s0.w, h: s0.h},
    detail: {x: s1.x, y: s1.y, w: s1.w, h: s1.h},
  };
}

function compose(ctx, P, recs, F, opt, LG) {
  const {bench, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset * 1.6, y: bench.y + inset * 1.6, w: bench.w - inset * 3.2, h: bench.h - inset * 3.2};
  const G = rfStage(mat, {kind: P.items[0].kind, targets: ['scene', 'object'], slots: 2, rows: recs.length, tray: opt.tray, trayFrac: opt.trayFrac, approach: opt.approach, restRuler: false, slotGap: 0.12});
  const B = boxesOf(G);
  const showKey = ctx.show('key');
  const labelOf = id => (P.elements.find(e => e.id === id) || {}).label;
  // label chips: one side of the component, avoiding other components and chips
  const chips = {};
  let ok = !PL || PL.ok;
  const placed = [];
  const obst = Object.values(B);
  for (const id of EL) {
    const lab = labelOf(id);
    if (!lab || !showKey) continue;
    const f = fitG(lab, {maxWidth: Math.max(F * 6, G.S * 1.6), size: F, minSize: F, maxLines: 2, weight: 700});
    if (!f.ok) ok = false;
    const w = f.width + F * 0.9, hh = f.height + F * 0.5;
    const b = B[id];
    const cands = [];
    for (const dd of [6, 6 + F * 1.6, 6 + F * 3.2]) {
      for (const sh of [0, -0.5, 0.5]) {
        cands.push({x: b.x + b.w / 2 - w / 2 + sh * w, y: b.y + b.h + dd}, {x: b.x + b.w / 2 - w / 2 + sh * w, y: b.y - hh - dd});
        cands.push({x: b.x + b.w + dd, y: b.y + b.h / 2 - hh / 2 + sh * hh * 1.5}, {x: b.x - w - dd, y: b.y + b.h / 2 - hh / 2 + sh * hh * 1.5});
      }
    }
    let best = null, bestPen = Infinity;
    for (const c of cands) {
      const box = {x: c.x, y: c.y, w, h: hh};
      let pen = 0;
      if (box.x < mat.x || box.y < mat.y || box.x + w > mat.x + mat.w || box.y + hh > mat.y + mat.h) pen += 100;
      for (const o of obst) if (o !== b && overlaps(box, o, 4)) pen += 30;
      if (overlaps(box, b, 2)) pen += 30;
      pen += Math.hypot(box.x + w / 2 - (b.x + b.w / 2), box.y + hh / 2 - (b.y + b.h / 2)) * 0.01;
      for (const o of placed) if (overlaps(box, o, 4)) pen += 50;
      if (pen < bestPen) { bestPen = pen; best = box; }
    }
    if (bestPen >= 50) ok = false;
    placed.push(best);
    chips[id] = {box: best, fit: f};
  }
  const ok2 = ok && G.fits && G.S >= 80;
  return {F, bench, mat, panel: LG.panel, PL, G, B, chips, ok: ok2, problems: [PL && !PL.ok && 'panel-text', !ok && 'labels', G.S < 80 && 'stage-small'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = rfRecords(P);
    const shape = ctx.view.shape;
    const kinds = [...new Set(P.relationships.map(rl => rl.kind))];
    const rows = legendRows(ctx, P, recs, kinds);
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.22}, {mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.3}];
    const sts = [{tray: 'right', trayFrac: 0.3, approach: 'down'}, {tray: 'right', trayFrac: 0.36, approach: 'down'}, {tray: 'top', trayFrac: 0.28, approach: 'down'}, {tray: 'right', trayFrac: 0.3, approach: 'left'}];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 3) break;
      for (const o0 of opts) {
        const LG = legendFor(ctx, rows, F, o0);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const st of sts) {
          const c = compose(ctx, P, recs, F, st, LG);
          const score = c.G.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    const E = C.B;
    const hit = id => (C.chips[id] ? {x: Math.min(E[id].x, C.chips[id].box.x), y: Math.min(E[id].y, C.chips[id].box.y), w: 0, h: 0, _a: E[id], _b: C.chips[id].box} : E[id]);
    const ctr = id => ({x: E[id].x + E[id].w / 2, y: E[id].y + E[id].h / 2});
    const rels = P.relationships.filter(rl => rl.from !== rl.to && E[rl.from] && E[rl.to]);
    const conns = rels.map((rl, i) => {
      const from = edgeAnchor(E[rl.from], ctr(rl.to), 8);
      const to = edgeAnchor(E[rl.to], ctr(rl.from), rl.kind === 'relation' ? 8 : 14);
      return {rel: rl, c: connector(ctx, {name: `c${i}`, from, to, kind: rl.kind, bend: 0.12, color: mechColor(ctx, rl.kind)})};
    });
    void hit;
    const order = P.traversalOrder.filter(id => E[id]);
    const legs = [];
    for (let i = 0; i + 1 < order.length; i++) {
      const a = order[i], b = order[i + 1];
      const cn = conns.find(q => (q.rel.from === a && q.rel.to === b) || (q.rel.from === b && q.rel.to === a));
      const pts = [ctr(a)];
      if (cn) for (let k = 0; k <= 24; k++) pts.push(cn.rel.from === a ? cn.c.at(k / 24) : cn.c.at(1 - k / 24));
      pts.push(ctr(b));
      const pl = polyline(pts);
      legs.push({a, b, fn: t => pl.at(t)});
    }
    return {P, recs, C, conns, order, legs, ctr: Object.fromEntries(EL.map(id => [id, ctr(id)]))};
  },
  build(ctx, L) {
    const {C, P} = L;
    const G = C.G;
    const th = ctx.theme;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const pw = G.tray.pw, ph = pw / PRINT_AR;
    const sag = G.S * 0.12, bw = Math.max(5, G.S * 0.05);
    const d = chainD(G.anchor, G.hole, sag);
    const at = (id, node) => {
      const c = L.ctr[id];
      return g({name: `el-${id}`}, g({transform: T(c.x, c.y)}, g({name: `el-${id}-s`}, g({transform: T(-c.x, -c.y)}, node))));
    };
    const parts = {
      bag: at('bag', g({transform: T(G.bag.x, G.bag.y)}, bagBack(ctx, G.bag.B, {}), bagFront(ctx, G.bag.B, {}))),
      chain: at('chain', g(null,
        h('path', {d, fill: 'none', stroke: METAL_DARK, 'stroke-width': r(bw * 0.3, 2), 'stroke-linecap': 'round'}),
        h('path', {d, fill: 'none', stroke: METAL, 'stroke-width': r(bw, 2), 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.35, 2)}`}))),
      object: at('object', g({transform: G.mirror ? `${T(G.objC.x, G.objC.y)} scale(-1 1)` : T(G.objC.x, G.objC.y)}, objectArt(ctx, G.M))),
      tag: at('tag', g({transform: T(G.hole.x, G.hole.y, 8)}, tagArt(ctx, G.T0, {prefix: 'mtag', rows: L.recs.map(rw => ({filled: rw.filled, len: 0.8})), seedKey: 'rf'}))),
      scale: at('scale', g({transform: T(G.ruler.placed.x, G.ruler.placed.y)}, rulerArt(ctx, G))),
    };
    const prints = ['scene', 'object'].map((t, i) => g({name: `pm${i}`}, g({name: `el-${i ? 'detail' : 'overview'}-s`}, printArt(ctx, G, G.fields[t], {name: `mp${i}`, pw, ph, index: i, rows: L.recs, ruler: true, numberText: ctx.show('key') ? String(i + 1) : null}))));
    const chips = EL.filter(id => C.chips[id]).map(id => {
      const ch = C.chips[id];
      const cc = {x: ch.box.x + ch.box.w / 2, y: ch.box.y + ch.box.h / 2};
      const la = edgeAnchor(ch.box, L.ctr[id], 0), lb = edgeAnchor(C.B[id], cc, 2);
      const lead = Math.hypot(la.x - lb.x, la.y - lb.y) > 10 ? h('path', {d: `M${r(la.x)} ${r(la.y)}L${r(lb.x)} ${r(lb.y)}`, stroke: '#f4f1ea', 'stroke-width': 2, 'stroke-dasharray': '4 4'}) : null;
      return g({name: `chip-${id}`, opacity: 0},
        lead,
        h('path', {d: roundRectPath(ch.box.x, ch.box.y, ch.box.w, ch.box.h, 8), fill: th.card, stroke: INK, 'stroke-width': 1.6, opacity: 0.95}),
        textAt(ch.fit, {x: ch.box.x + C.F * 0.45, y: ch.box.y + C.F * 0.25, fill: INK}));
    });
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, rfPanelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        boardArt(ctx, G, {}),
        parts.bag, parts.chain, parts.object, parts.tag, parts.scale,
        standNodes(ctx, G, 'stand'),
        wedgeNodes(ctx, 'wd'),
        g({name: 'el-camera'}, g({name: 'camPos'}, g({name: 'el-camera-s'}, cameraArt(ctx, G.CM, {name: 'camArt'})))),
        h('circle', {name: 'flash', r: r(G.S * 0.3), fill: '#fffbe6', opacity: 0}),
        prints,
        L.conns.map(q => q.c.node),
        chips,
        tracer(ctx, 'tracer', th.accent2),
      ),
      bench.frame,
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const G = C.G;
    const nodes = {};
    // camera: park → overview station → detail station
    const k1 = ease.inOutCubic(seg(u, ...W.mv1)), k2 = ease.inOutCubic(seg(u, ...W.mv2));
    const A = G.park, B1 = G.stations.scene, B2 = G.stations.object;
    const lerpP = (p, q, k) => ({x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, a: p.a + (q.a - p.a) * k});
    const cam = k2 > 0 ? lerpP(B1, B2, k2) : lerpP(A, B1, k1);
    nodes.camPos = {transform: T(cam.x, cam.y, cam.a)};
    Object.assign(nodes, standProps('stand', G, cam));
    const F0 = u < W.mv2[0] ? G.fields.scene : G.fields.object;
    const wop = seg(u, W.mv1[0], W.mv1[0] + 0.02) * (1 - seg(u, W.fl2[1], W.fl2[1] + 0.03));
    Object.assign(nodes, wedgeProps('wd', G, cam, F0, wop));
    const fl = Math.max(Math.sin(Math.PI * seg(u, ...W.sh1)), Math.sin(Math.PI * seg(u, ...W.sh2)));
    const tip = {x: cam.x + Math.sin(cam.a * Math.PI / 180) * G.CM.Cs * 0.7, y: cam.y - Math.cos(cam.a * Math.PI / 180) * G.CM.Cs * 0.7};
    nodes.flash = {cx: r(tip.x), cy: r(tip.y), opacity: r(fl * 0.9, 3)};
    const kF = ease.inOutCubic(seg(u, ...W.focus)) * (1 - ease.inOutCubic(seg(u, ...W.unfocus)));
    const fsc = id => (id === P.focusElement ? 1 + 0.14 * kF : 1);
    const pr = [[W.sh1, W.fl1, G.fields.scene], [W.sh2, W.fl2, G.fields.object]].map(([sh, flw, Fd], i) => {
      const born = u >= (sh[0] + sh[1]) / 2;
      const kf = seg(u, ...flw);
      const p = printFly(G, Fd, G.tray.slots[i], kf, G.tray.pw);
      nodes[`pm${i}`] = {transform: T(p.x, p.y, 0, p.s), opacity: born ? 1 : 0};
      nodes[`mp${i}-border`] = {opacity: r(born ? clamp(kf * 3) : 0, 3)};
      return {born, kf, p};
    });
    for (const id of EL) {
      const s = fsc(id);
      if (id === 'overview' || id === 'detail' || id === 'camera') nodes[`el-${id}-s`] = {transform: T(0, 0, 0, s)};
      else nodes[`el-${id}-s`] = {transform: T(0, 0, 0, s)};
    }
    const labK = seg(u, ...W.labels);
    for (const id of EL) if (C.chips[id]) nodes[`chip-${id}`] = {opacity: r(labK, 3)};
    const n = L.conns.length;
    L.conns.forEach((q, i) => {
      const a = W.draw[0] + ((W.draw[1] - W.draw[0]) / n) * i;
      const b = a + ((W.draw[1] - W.draw[0]) / n) * 0.85;
      Object.assign(nodes, q.c.frame(ease.inOutCubic(seg(u, a, b))));
    });
    const kT = seg(u, ...W.trace);
    let tp = L.legs.length ? L.legs[0].fn(0) : L.ctr[L.order[0] || 'object'];
    let at = L.order[0] || null, legIdx = -1;
    if (L.legs.length) {
      const f = kT * L.legs.length;
      legIdx = Math.min(L.legs.length - 1, Math.floor(f));
      const t = ease.inOutSine(clamp(f - legIdx));
      tp = L.legs[legIdx].fn(t);
      at = t < 0.5 ? L.legs[legIdx].a : L.legs[legIdx].b;
    }
    const trOn = u >= W.trace[0] && u <= W.trace[1] + 0.02;
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: trOn ? 1 : 0};
    const phase = u < W.draw[0] ? 'assemble' : u < W.trace[0] ? 'relate' : u < W.trace[1] ? 'trace' : 'hold';
    return {
      nodes,
      semantic: {
        phase, cam: R2(cam), camAngle: r(cam.a, 2), tracer: R2(tp), tracerAt: at, leg: legIdx, focus: P.focusElement, focusScale: r(1 + 0.14 * kF, 3),
        prints: pr.map(q => (!q.born ? 'none' : q.kf < 1 ? 'flying' : 'placed')), print0: R2(pr[0].p), print1: R2(pr[1].p), wedge: r(wop, 3), flash: r(fl, 3),
        connectors: L.conns.map(q => ({from: q.rel.from, to: q.rel.to, kind: q.rel.kind, a: R2(q.c.from), b: R2(q.c.to)})),
        drawn: L.conns.map((q, i) => r(seg(u, W.draw[0] + ((W.draw[1] - W.draw[0]) / n) * i, W.draw[0] + ((W.draw[1] - W.draw[0]) / n) * (i + 0.85)), 3)),
        arrows: L.conns.filter(q => LINK_STYLES[q.rel.kind].arrow).map(q => q.rel.kind),
        order: L.order, problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1),
        fields: [r(G.fields.scene.w, 1), r(G.fields.object.w, 1)],
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
    slug: 'evidence-custody-04-mechanism',
    title: 'Photographic record — a spatial map: the camera produces an overview and a detail print, and only the supplied relations join camera, prints, object, scale, tag, chain and bag; a tracer follows them',
    titleEs: 'Registro fotográfico — Mecanismo o relación explicada',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Registro fotográfico',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A spatial map on the evidence bench. Without hands, the camera swings on its stand arm to a far station (wide wedge, overview) and a near one (narrow wedge onto the object and its scale); each exposure becomes a print that flies to the photo board. Every component — camera, overview print, detail print, object, scale, tag, ball chain, bag — carries its editable label. Only the supplied relationships are drawn, anchored to the components\' edges (plain relations without arrowheads; causal only when supplied); a tracer follows the supplied order (several views, one object) and the focus component enlarges. No doctrine and no outcome; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'photography', 'mechanism', 'relations', 'tracer', 'camera', 'overview', 'detail', 'prints', 'scale'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/registro-fotografico.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
