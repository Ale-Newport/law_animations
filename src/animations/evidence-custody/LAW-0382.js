/**
 * LAW-0382 — Copia de evidencia digital · mechanism
 *
 * Storyboard (an exploded spatial map of the imaging station, no hands: the duplicator dock lies enlarged along the
 * lower part of the bench; at the start both devices sit seated in its bays — the original in the source bay, the blank
 * copy in the target bay — and the two tags lie by them; a legend lists item, copy-tag rows, custodians, times, the
 * relation kinds in use and the key):
 *  0.00–0.18  separate: the original lifts out of the source bay and rises to the upper left into its open evidence
 *             bag, its tag and ball chain following; the blank copy rises to the upper right with its own tag; label
 *             chips fade in once each part has arrived.
 *  0.18–0.43  only the explicit relationships are drawn, one after another, anchored to the components' edges; a plain
 *             relation has no arrowhead (arrows only for a supplied sequence / causal kind).
 *  0.43–0.75  a tracer follows the supplied traversal order (by default original → transfer window → dock → copy → copy
 *             tag); while it passes the transfer window blocks travel through the dock and the copy's block map is
 *             written cell by cell with the original's pattern; the focus component enlarges.
 *  0.75–1.00  hold: origin (original with its unchanged map), transformation (dock) and state (copy with its map and its
 *             tag) all visible with every relation and label. No doctrine and no outcome.
 * @module animations/evidence-custody/LAW-0382
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {edgeAnchor, roundRectPath, polyline} from '../../core/geometry.js';
import {connector, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {ecFields, localised, benchNode, R2, fitG, textAt, bagBack, bagFront, chainNode, chainProps, overlaps, INK} from './kits/evidence-art.js';
import {
  DC_EN, DC_ES, dcFields, dcRecords, dcRecordLine, deviceModel, deviceArt, cellsOf, copyCellProps, dockModel, dockArt,
  dockFlowProps, origTagArt, copyTagArt, dcLegendFor, dcPanels,
} from './kits/copia-digital.js';
import {tagModel, bagModel} from './kits/evidence-art.js';

const ID = 'LAW-0382';
const DURATION = 7000;
const EL = ['original', 'window', 'dock', 'copy', 'tagO', 'tagC', 'bag'];
const W = {sep: [0.03, 0.15], labels: [0.14, 0.18], draw: [0.19, 0.42], trace: [0.44, 0.74], focus: [0.44, 0.5], unfocus: [0.75, 0.8]};
const mechColor = (ctx, k) => ({relation: ctx.theme.accent3, communication: '#7fb0d8', sequence: '#e58e73', causal: ctx.theme.accent}[k] || ctx.theme.accent3);
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  elements: [
    {id: 'original', label: 'Original device'}, {id: 'window', label: 'Transfer window'}, {id: 'dock', label: 'Duplicator dock'},
    {id: 'copy', label: 'Copy device'}, {id: 'tagO', label: 'Tag of the original'}, {id: 'tagC', label: 'Tag of the copy'},
    {id: 'bag', label: 'Evidence bag'},
  ],
  relationships: [
    {from: 'original', to: 'window', kind: 'relation'}, {from: 'window', to: 'copy', kind: 'relation'},
    {from: 'original', to: 'copy', kind: 'relation'}, {from: 'tagO', to: 'tagC', kind: 'relation'},
  ],
  focusElement: 'copy',
  relationLabels: {relation: 'linked (as supplied)', communication: 'communicates (as supplied)', sequence: 'then (sequence as configured)', causal: 'causes (supplied)'},
  traversalOrder: ['original', 'window', 'copy'],
};
const OWN_ES = {
  elements: [
    {id: 'original', label: 'Dispositivo original'}, {id: 'window', label: 'Ventana de transferencia'}, {id: 'dock', label: 'Duplicador'},
    {id: 'copy', label: 'Dispositivo copia'}, {id: 'tagO', label: 'Etiqueta del original'}, {id: 'tagC', label: 'Etiqueta de la copia'},
    {id: 'bag', label: 'Bolsa de pruebas'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'copy',
  relationLabels: {relation: 'unidos (según lo aportado)', communication: 'comunica (según lo aportado)', sequence: 'después (secuencia configurada)', causal: 'causa (aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...DC_EN, ...OWN_EN};
const ES = {...DC_ES, ...OWN_ES};
const {items: _ei, records: _er, ...ecRest} = ecFields;
const sceneSchema = {...ecRest, ...dcFields, ...mechanismFields(EL)};
const defaultParams = {...EN};

function legendRows(ctx, P, recs, kinds) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  const it = P.items[0];
  if (showKey) rows.push({kind: 'heading', icon: `dc-orig-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: dcRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) kinds.forEach(k => rows.push({kind: 'item', icon: `line-${k}`, color: mechColor(ctx, k), text: P.relationLabels[k] || k, name: `lg-kind-${k}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Exploded map geometry in a box. 'h': bag+original left, copy right, dock along the bottom; 'v': same, taller. */
function mapStage(B, kind, rows, orient) {
  const w = orient === 'v' ? 4.1 : 6.2, hh = orient === 'v' ? 4.6 : 3.55;
  const S = Math.min(B.w / (w + 0.1), B.h / (hh + 0.1));
  const ox = B.x + (B.w - w * S) / 2, oy = B.y + (B.h - hh * S) / 2;
  const P = (x, y) => ({x: ox + x * S, y: oy + y * S});
  const M = deviceModel(kind, S);
  const D = dockModel(S);
  const dock = {...P((w - D.w / S) / 2, hh - D.h / S - 0.05), w: D.w, h: D.h};
  const bagW = 1.45, bagH = orient === 'v' ? 2.15 : 2.05;
  const bag = {...P(0.05, 0.05), w: bagW * S, h: bagH * S, B: bagModel(bagW * S, bagH * S)};
  const orig = P(0.05 + bagW / 2, 0.72);
  const copy = P(w - 0.05 - bagW / 2, 0.72);
  const src = {x: dock.x + D.src.c.x, y: dock.y + D.src.c.y}, dst = {x: dock.x + D.dst.c.x, y: dock.y + D.dst.c.y};
  const tagO = tagModel({w: 1.05 * S, h: 0.46 * S, rows: 3}), tagC = tagModel({w: 1.05 * S, h: 0.46 * S, rows});
  const hole = c => ({x: c.x + M.eye.x + 0.02 * S, y: c.y + M.eye.y + 0.42 * S});
  return {S, M, D, dock, bag, orig, copy, src, dst, tagO, tagC, hole, eye: c => ({x: c.x + M.eye.x, y: c.y + M.eye.y}), orient};
}

function boxesOf(G) {
  const {M, D, dock} = G;
  const tb = (c, T0) => { const hp = G.hole(c); return {x: hp.x + T0.x0, y: hp.y - T0.h / 2, w: T0.w, h: T0.h}; };
  return {
    original: {x: G.orig.x - M.w / 2, y: G.orig.y - M.h / 2, w: M.w, h: M.h},
    copy: {x: G.copy.x - M.w / 2, y: G.copy.y - M.h / 2, w: M.w, h: M.h},
    dock: {x: dock.x, y: dock.y, w: dock.w, h: dock.h},
    window: {x: dock.x + D.chan.x, y: dock.y + D.chan.y, w: D.chan.w, h: D.chan.h},
    tagO: tb(G.orig, G.tagO), tagC: tb(G.copy, G.tagC),
    bag: {x: G.bag.x, y: G.bag.y, w: G.bag.w, h: G.bag.h},
  };
}

function compose(ctx, P, recs, F, LG, orient) {
  const {bench, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset * 1.6, y: bench.y + inset * 1.6, w: bench.w - inset * 3.2, h: bench.h - inset * 3.2};
  const G = mapStage(mat, P.items[0].kind, recs.length, orient);
  const B = boxesOf(G);
  const showKey = ctx.show('key');
  const chips = {};
  let ok = !PL || PL.ok;
  const placed = [];
  const obst = Object.entries(B).filter(([k]) => k !== 'bag' && k !== 'dock').map(([, v]) => v);
  for (const id of EL) {
    const lab = (P.elements.find(e => e.id === id) || {}).label;
    if (!lab || !showKey) continue;
    const f = fitG(lab, {maxWidth: Math.max(F * 6, G.S * 1.5), size: F, minSize: F, maxLines: 2, weight: 700});
    if (!f.ok) ok = false;
    const w = f.width + F * 0.9, hh = f.height + F * 0.5;
    const b = B[id];
    const cands = [];
    for (const dd of [6, 6 + F * 1.4, 6 + F * 2.8]) for (const sh of [0, -0.5, 0.5]) {
      cands.push({x: b.x + b.w / 2 - w / 2 + sh * w, y: b.y + b.h + dd}, {x: b.x + b.w / 2 - w / 2 + sh * w, y: b.y - hh - dd});
      cands.push({x: b.x + b.w + dd, y: b.y + b.h / 2 - hh / 2 + sh * hh * 1.5}, {x: b.x - w - dd, y: b.y + b.h / 2 - hh / 2 + sh * hh * 1.5});
    }
    if (id === 'bag') cands.unshift({x: b.x + b.w / 2 - w / 2, y: b.y + b.h - hh - 8});
    if (id === 'dock') cands.unshift({x: b.x + 12, y: b.y + b.h - hh - 8}, {x: b.x + b.w - w - 12, y: b.y + b.h - hh - 8});
    if (id === 'window') cands.unshift({x: b.x + b.w / 2 - w / 2, y: b.y + b.h + 6});
    let best = null, bestPen = Infinity;
    for (const c of cands) {
      const box = {x: c.x, y: c.y, w, h: hh};
      let pen = 0;
      if (box.x < mat.x || box.y < mat.y || box.x + w > mat.x + mat.w || box.y + hh > mat.y + mat.h) pen += 100;
      for (const o of obst) if (o !== b && overlaps(box, o, 4)) pen += 30;
      if (id !== 'dock' && id !== 'bag' && overlaps(box, b, 2)) pen += 30;
      if (id === 'dock' && overlaps(box, B.window, 4)) pen += 30;
      pen += Math.hypot(box.x + w / 2 - (b.x + b.w / 2), box.y + hh / 2 - (b.y + b.h / 2)) * 0.01;
      for (const o of placed) if (overlaps(box, o, 4)) pen += 50;
      if (pen < bestPen) { bestPen = pen; best = box; }
    }
    if (bestPen >= 50) ok = false;
    placed.push(best);
    chips[id] = {box: best, fit: f};
  }
  const ok2 = ok && G.S >= 80;
  return {F, bench, mat, panel: LG.panel, PL, G, B, chips, ok: ok2, problems: [PL && !PL.ok && 'panel-text', !ok && 'labels', G.S < 80 && 'stage-small'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = dcRecords(P);
    const shape = ctx.view.shape;
    const kinds = [...new Set(P.relationships.map(rl => rl.kind))];
    const rows = legendRows(ctx, P, recs, kinds);
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.22}, {mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.3}];
    const orients = shape === 'landscape' ? ['h'] : ['v', 'h'];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const o0 of opts) {
        const LG = dcLegendFor(ctx, rows, F, o0);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const orient of orients) {
          const c = compose(ctx, P, recs, F, LG, orient);
          const score = c.G.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * (shape === 'square' && o0.mode === 'below' ? 0.6 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    const E = C.B;
    const ctr = id => ({x: E[id].x + E[id].w / 2, y: E[id].y + E[id].h / 2});
    const rels = P.relationships.filter(rl => rl.from !== rl.to && E[rl.from] && E[rl.to]);
    const conns = rels.map((rl, i) => {
      // a device joined to the dock / window leaves from its inner side, so the line never runs through its own tag
      const dev = id => id === 'original' || id === 'copy';
      const low = id => id === 'window' || id === 'dock';
      const side = (id, other) => { const b = E[id], tx = ctr(other).x; return {x: tx > b.x + b.w / 2 ? b.x + b.w + 8 : b.x - 8, y: b.y + b.h / 2}; };
      const top = (id, other) => { const b = E[id], left = ctr(other).x < b.x + b.w / 2; return {x: b.x + b.w * (left ? 0.3 : 0.7), y: b.y - 8}; };
      const dl = dev(rl.from) && low(rl.to), ld = low(rl.from) && dev(rl.to);
      const from = dl ? side(rl.from, rl.to) : ld ? top(rl.from, rl.to) : edgeAnchor(E[rl.from], ctr(rl.to), 8);
      const to = ld ? side(rl.to, rl.from) : dl ? top(rl.to, rl.from) : edgeAnchor(E[rl.to], ctr(rl.from), rl.kind === 'relation' ? 8 : 14);
      const elbow = (a, b, aHoriz) => (aHoriz ? {c1: {x: a.x + (b.x - a.x) * 0.75, y: a.y}, c2: {x: b.x, y: b.y - (b.y - a.y) * 0.75}} : {c1: {x: a.x, y: a.y + (b.y - a.y) * 0.75}, c2: {x: b.x + (a.x - b.x) * 0.75, y: b.y}});
      const cc = dl ? elbow(from, to, true) : ld ? elbow(from, to, false) : {};
      return {rel: rl, c: connector(ctx, {name: `c${i}`, from, to, kind: rl.kind, bend: 0.14, color: mechColor(ctx, rl.kind), ...cc})};
    });
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
    // the copy is written while the tracer passes the transfer window (or across the whole trace when it never does)
    const wi = order.indexOf('window');
    const n = Math.max(1, legs.length);
    const write = wi >= 0 ? [W.trace[0] + (W.trace[1] - W.trace[0]) * Math.max(0, wi - 0.5) / n, W.trace[0] + (W.trace[1] - W.trace[0]) * Math.min(n, wi + 0.5) / n] : W.trace;
    return {P, recs, C, conns, order, legs, write, nCells: cellsOf(C.G.M).length, ctr: Object.fromEntries(EL.map(id => [id, ctr(id)]))};
  },
  build(ctx, L) {
    const {C} = L;
    const G = C.G;
    const th = ctx.theme;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const bw = Math.max(5, G.S * 0.045);
    const sc = (id, node) => g({name: `el-${id}`}, node);
    const chips = EL.filter(id => C.chips[id]).map(id => {
      const ch = C.chips[id];
      const cc = {x: ch.box.x + ch.box.w / 2, y: ch.box.y + ch.box.h / 2};
      const inside = overlaps(ch.box, C.B[id], 0);
      const la = edgeAnchor(ch.box, L.ctr[id], 0), lb = edgeAnchor(C.B[id], cc, 2);
      const lead = !inside && Math.hypot(la.x - lb.x, la.y - lb.y) > 10 ? h('path', {d: `M${r(la.x)} ${r(la.y)}L${r(lb.x)} ${r(lb.y)}`, stroke: '#f4f1ea', 'stroke-width': 2, 'stroke-dasharray': '4 4'}) : null;
      return g({name: `chip-${id}`, opacity: 0},
        lead,
        h('path', {d: roundRectPath(ch.box.x, ch.box.y, ch.box.w, ch.box.h, 8), fill: th.card, stroke: INK, 'stroke-width': 1.6, opacity: 0.95}),
        textAt(ch.fit, {x: ch.box.x + C.F * 0.45, y: ch.box.y + C.F * 0.25, fill: INK}));
    });
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        sc('dock', g({transform: T(G.dock.x, G.dock.y)}, dockArt(ctx, G.D, {prefix: 'dk', name: 'el-dock-s'}))),
        sc('bag', g({transform: T(G.bag.x, G.bag.y)}, bagBack(ctx, G.bag.B, {}), bagFront(ctx, G.bag.B, {}))),
        chainNode('chO', {bead: bw}), chainNode('chC', {bead: bw}),
        g({name: 'tagO'}, origTagArt(ctx, G, 'tO')),
        g({name: 'tagC'}, copyTagArt(ctx, G, 'tC', L.recs)),
        g({name: 'orig'}, g({name: 'el-original-s'}, deviceArt(ctx, G.M, {prefix: 'o', role: 'original'}))),
        g({name: 'copy'}, g({name: 'el-copy-s'}, deviceArt(ctx, G.M, {prefix: 'cp', role: 'copy'}))),
        h('rect', {name: 'winRing', x: r(C.B.window.x - 6), y: r(C.B.window.y - 6), width: r(C.B.window.w + 12), height: r(C.B.window.h + 12), rx: 10, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
        L.conns.map(q => q.c.node),
        chips,
        tracer(ctx, 'tracer', th.accent2),
      ),
      bench.frame,
      dcPanels(ctx, C),
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const G = C.G;
    const nodes = {};
    const k = ease.inOutCubic(seg(u, ...W.sep));
    const lp = (a, b) => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k});
    const o = lp(G.src, G.orig), c = lp(G.dst, G.copy);
    const kF = ease.inOutCubic(seg(u, ...W.focus)) * (1 - ease.inOutCubic(seg(u, ...W.unfocus)));
    const fs = id => (id === P.focusElement ? 1 + 0.14 * kF : 1);
    nodes.orig = {transform: T(o.x, o.y)};
    nodes.copy = {transform: T(c.x, c.y)};
    nodes['el-original-s'] = {transform: T(0, 0, 0, fs('original'))};
    nodes['el-copy-s'] = {transform: T(0, 0, 0, fs('copy'))};
    const sAbout = (id, ctr) => ({transform: `translate(${r(ctr.x)} ${r(ctr.y)}) scale(${r(fs(id), 4)}) translate(${r(-ctr.x)} ${r(-ctr.y)})`});
    nodes['el-dock-s'] = sAbout('dock', {x: L.ctr.dock.x - G.dock.x, y: L.ctr.dock.y - G.dock.y});
    const hO = G.hole(o), hC = G.hole(c);
    nodes.tagO = {transform: `${T(hO.x, hO.y)} scale(${r(fs('tagO'), 4)})`};
    nodes.tagC = {transform: `${T(hC.x, hC.y)} scale(${r(fs('tagC'), 4)})`};
    Object.assign(nodes, chainProps('chO', G.eye(o), hO, G.S * 0.06), chainProps('chC', G.eye(c), hC, G.S * 0.06));
    const kw = seg(u, ...L.write);
    const flowA = seg(u, L.write[0] - 0.01, L.write[0]) * (1 - seg(u, L.write[1], L.write[1] + 0.01));
    Object.assign(nodes, copyCellProps('cp', L.nCells, kw * L.nCells), dockFlowProps('dk', G.D, kw, flowA));
    nodes.winRing = {opacity: r(P.focusElement === 'window' ? kF : 0, 3)};
    const labK = seg(u, ...W.labels);
    for (const id of EL) if (C.chips[id]) nodes[`chip-${id}`] = {opacity: r(labK, 3)};
    const n = L.conns.length;
    const drawn = L.conns.map((q, i) => {
      const a = W.draw[0] + ((W.draw[1] - W.draw[0]) / n) * i;
      const p = seg(u, a, a + ((W.draw[1] - W.draw[0]) / n) * 0.85);
      Object.assign(nodes, q.c.frame(ease.inOutCubic(p)));
      return r(p, 3);
    });
    const kT = seg(u, ...W.trace);
    let tp = L.legs.length ? L.legs[0].fn(0) : L.ctr[L.order[0] || 'copy'];
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
    const phase = u < W.draw[0] ? 'separate' : u < W.trace[0] ? 'relate' : u < W.trace[1] ? 'trace' : 'hold';
    return {
      nodes,
      semantic: {
        phase, orig: R2(o), copy: R2(c), separated: r(k, 3), tracer: R2(tp), tracerAt: at, leg: legIdx, focus: P.focusElement, focusScale: r(1 + 0.14 * kF, 3),
        copied: r(kw, 3), copyCells: Math.floor(kw * L.nCells + 1e-6), cells: L.nCells, flow: r(flowA, 3),
        connectors: L.conns.map(q => ({from: q.rel.from, to: q.rel.to, kind: q.rel.kind, a: R2(q.c.from), b: R2(q.c.to)})),
        drawn, arrows: L.conns.filter(q => LINK_STYLES[q.rel.kind].arrow).map(q => q.rel.kind),
        order: L.order, problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1),
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
    slug: 'evidence-custody-06-mechanism',
    title: 'Digital evidence copy — an exploded map of the imaging station: original, transfer window, dock, copy, tags and bag separate, only the supplied relations are drawn, and a tracer runs from the original through the window to the copy while the copy\'s block map is written',
    titleEs: 'Copia de evidencia digital — Mecanismo o relación explicada',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Copia de evidencia digital',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded spatial map on the evidence bench, without hands. Both devices start seated in the duplicator dock; they separate — the original (fictional drive, stick or card) up into its open evidence bag with its tag on a ball chain, the blank copy to the other side with its own tag. Every component carries an editable label; only the supplied relationships are drawn, anchored to the components\' edges (plain relations without arrowheads). A tracer follows the supplied order; while it passes the transfer window, blocks travel through the dock and the copy\'s block map is written with the original\'s pattern; the focus component enlarges. No doctrine and no outcome; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'digital evidence', 'copy', 'mechanism', 'relations', 'tracer', 'duplicator', 'block map', 'tag'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/copia-digital.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
