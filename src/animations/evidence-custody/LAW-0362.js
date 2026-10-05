/**
 * LAW-0362 — Etiquetado de indicio · mechanism
 *
 * Storyboard (an exploded view on the evidence bench: the tagged object comes apart into its components, each drawn
 * as real art in its own place — the object, the ball chain, the manila tag, the tag's written rows (a card with the
 * supplied records), the evidence bag and the gloved custodian; a legend lists the item, custodians, times, the
 * relation kinds in use and the key):
 *  0.00–0.18  separate: the assembled tagged object (object + chain + tag, rows inside the tag, bag around it, the
 *             glove at it) comes apart; every component travels to its own place (no fade-in of a title card).
 *  0.18–0.43  only the explicit relationships are drawn, one after another, anchored to the components' edges; a
 *             plain relation has no arrowhead (causal arrows only when the author supplies a causal relation).
 *  0.43–0.75  a tracer follows the supplied traversal order along the drawn relations; the focus component is
 *             enlarged while the tracer is on it.
 *  0.75–1.00  hold: the mechanism stays assembled as a diagram with origin (object), transformation (chain + tag +
 *             rows) and state (bag) visible; relation kinds keyed in the legend. No custody doctrine, no outcome.
 * @module animations/evidence-custody/LAW-0362
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {edgeAnchor, roundRectPath, polyline} from '../../core/geometry.js';
import {connector, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  ecFields, EC_EN, EC_ES, localised, benchNode, panelLayout, panelNode, R2, fitG, textAt, objectModel, objectArt,
  tagModel, tagArt, bagModel, bagBack, bagFront, legendIcon, INK, MANILA, METAL, METAL_DARK, overlaps,
} from './kits/evidence-art.js';
import {EI_LABELS_EN, EI_LABELS_ES, eiLabelFields, resolveRecords, recordLine} from './kits/etiquetado-indicio.js';

const ID = 'LAW-0362';
const DURATION = 7000;
const EL = ['object', 'chain', 'tag', 'rows', 'bag', 'custodian'];
const W = {separate: [0.03, 0.17], draw: [0.18, 0.43], trace: [0.43, 0.75], focus: [0.43, 0.49], unfocus: [0.75, 0.8], legend: [0.76, 0.82]};
/** Line colours readable both on the green mat and on the paper legend (kind still set by the line style). */
const mechColor = (ctx, k) => ({relation: ctx.theme.accent3, communication: '#7fb0d8', sequence: '#e58e73', causal: ctx.theme.accent}[k] || ctx.theme.accent3);
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {kindsTitle: 'Lines as supplied:'},
  es: {kindsTitle: 'Líneas según lo aportado:'},
};

const OWN_EN = {
  labels: EI_LABELS_EN,
  elements: [
    {id: 'object', label: 'Object (fictional)'}, {id: 'chain', label: 'Ball chain'}, {id: 'tag', label: 'Manila tag'},
    {id: 'rows', label: 'Rows written on the tag'}, {id: 'bag', label: 'Evidence bag'}, {id: 'custodian', label: 'Person tagging (gloved)'},
  ],
  relationships: [
    {from: 'object', to: 'chain', kind: 'relation'}, {from: 'chain', to: 'tag', kind: 'relation'},
    {from: 'tag', to: 'rows', kind: 'relation'}, {from: 'object', to: 'bag', kind: 'relation'},
    {from: 'custodian', to: 'tag', kind: 'relation'},
  ],
  focusElement: 'chain',
  relationLabels: {relation: 'linked (as supplied)', communication: 'communicates (as supplied)', sequence: 'then (sequence as configured)', causal: 'causes (supplied)'},
  traversalOrder: ['custodian', 'tag', 'chain', 'object', 'bag'],
};
const OWN_ES = {
  labels: EI_LABELS_ES,
  elements: [
    {id: 'object', label: 'Objeto (ficticio)'}, {id: 'chain', label: 'Cadenilla'}, {id: 'tag', label: 'Etiqueta de cartulina'},
    {id: 'rows', label: 'Filas escritas en la etiqueta'}, {id: 'bag', label: 'Bolsa de indicios'}, {id: 'custodian', label: 'Quien etiqueta (con guantes)'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'chain',
  relationLabels: {relation: 'unidos (según lo aportado)', communication: 'comunica (según lo aportado)', sequence: 'después (secuencia configurada)', causal: 'causa (aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...EC_EN, ...OWN_EN};
const ES = {...EC_ES, ...OWN_ES};

const sceneSchema = {...ecFields, ...eiLabelFields, ...mechanismFields(EL)};
const defaultParams = {...EN};

const SLOTS = {
  wide: {object: [0, 0], chain: [1, 0], tag: [2, 0], bag: [0, 1], custodian: [1, 1], rows: [2, 1], cols: 3, rows_: 2},
  tall: {object: [0, 0], chain: [1, 0], bag: [0, 1], tag: [1, 1], custodian: [0, 2], rows: [1, 2], cols: 2, rows_: 3},
};

function legendRows(ctx, P, kinds) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) kinds.forEach(k => rows.push({kind: 'item', icon: `line-${k}`, color: mechColor(ctx, k), text: P.relationLabels[k] || k, name: `lg-kind-${k}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Element art size model for a cell (w × h available for the art). */
function elementArt(ctx, id, a, P, recs, F, show) {
  // returns {w, h, node(prefix)} with local origin = centre
  if (id === 'object') {
    const S = Math.min(a.w / 1.0, a.h / 0.62) * 0.95;
    const M = objectModel(P.items[0].kind, S);
    return {w: M.w, h: M.h, node: () => objectArt(ctx, M)};
  }
  if (id === 'chain') {
    const len = Math.min(a.w * 0.9, a.h * 2.2);
    const bw = clamp(len * 0.05, 7, 14);
    const d = `M${r(-len / 2)} 0Q0 ${r(len * 0.22)} ${r(len / 2)} 0`;
    return {w: len + bw * 2, h: len * 0.16 + bw * 2, node: () => g(null,
      h('path', {d, fill: 'none', stroke: METAL_DARK, 'stroke-width': r(bw * 0.3, 2), 'stroke-linecap': 'round'}),
      h('path', {d, fill: 'none', stroke: METAL, 'stroke-width': bw, 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.35, 2)}`}),
      h('circle', {cx: r(-len / 2), cy: 0, r: r(bw * 0.9), fill: 'none', stroke: METAL_DARK, 'stroke-width': 3}),
    )};
  }
  if (id === 'tag') {
    const tw = Math.min(a.w, a.h / 0.52);
    const TG = tagModel({w: tw, h: tw * 0.52, rows: recs.length});
    return {w: TG.w, h: TG.h, node: () => g({transform: T(-TG.w / 2 - TG.x0, 0)}, tagArt(ctx, TG, {prefix: 'mtag', rows: recs.map(rw => ({filled: rw.filled, len: 0.75})), seedKey: 'ei-mech'}))};
  }
  if (id === 'bag') {
    const bh = Math.min(a.h, a.w / 0.72);
    const B = bagModel(bh * 0.72, bh);
    return {w: B.w, h: B.h, node: () => g({transform: T(-B.w / 2, -B.h / 2)}, bagBack(ctx, B, {}), bagFront(ctx, B, {}))};
  }
  if (id === 'custodian') {
    const s = Math.min(a.w, a.h) * 0.95;
    return {w: s * 0.7, h: s, node: () => g({transform: T(0, 0)}, legendIcon(ctx, 'glove', s))};
  }
  // rows: a card that lists the supplied records (the written rows of the tag)
  const lines = recs.map(rw => recordLine(rw, P.labels.blank));
  const padX = F * 0.6, padY = F * 0.5;
  const fits = lines.map(t => fitG(t, {maxWidth: a.w - padX * 2, size: F, minSize: F, maxLines: 2, weight: 500}));
  const hh = fits.reduce((s, f) => s + f.height + F * 0.35, 0) - F * 0.35 + padY * 2;
  const w = Math.max(...fits.map(f => f.width)) + padX * 2;
  const ok = fits.every(f => f.ok) && hh <= a.h + 0.5;
  return {w, h: hh, ok, node: () => {
    let y = -hh / 2 + padY;
    const parts = [h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 10), fill: MANILA, stroke: INK, 'stroke-width': 2.5})];
    const txt = [];
    fits.forEach((f, i) => {
      if (show) txt.push(textAt(f, {x: -w / 2 + padX, y, fill: recs[i].filled ? '#2a3f7a' : '#6b5a3a', name: `mrow${i}`}));
      else parts.push(h('path', {d: `M${r(-w / 2 + padX)} ${r(y + F * 0.6)}h${r((w - padX * 2) * (recs[i].filled ? 0.8 : 0.4))}`, stroke: '#7a6640', 'stroke-width': 3, 'stroke-linecap': 'round'}));
      y += f.height + F * 0.35;
    });
    return g(null, parts, show ? g({name: 'mrows-text', opacity: 0}, txt) : null);
  }};
}

function compose(ctx, P, recs, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const kinds = [...new Set(P.relationships.map(rl => rl.kind))];
  const rows = legendRows(ctx, P, kinds);
  const gap = F * 1.3;
  let bench, panel = null, PL = null;
  if (!rows.length) bench = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs;
    if (cols === 1) PLs = [panelLayout(ctx, rows, {w: colW, F})];
    else {
      let best = null;
      for (let i = 1; i < rows.length; i++) {
        const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      PLs = best ? best.cols : [panelLayout(ctx, rows, {w: colW, F})];
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
  const grid = opt.grid ? SLOTS[opt.grid] : mat.w / mat.h > 1.0 ? SLOTS.wide : SLOTS.tall;
  const cw = mat.w / grid.cols, ch = mat.h / grid.rows_;
  const labelOf = id => (P.elements.find(e => e.id === id) || {}).label;
  const els = {};
  let ok = !PL || PL.ok;
  for (const id of EL) {
    const [ci, ri] = grid[id];
    const cell = {x: mat.x + ci * cw, y: mat.y + ri * ch, w: cw, h: ch};
    const lab = labelOf(id);
    const lf = lab && showKey ? fitG(lab, {maxWidth: cw * 0.94, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
    if (lf && !lf.ok) ok = false;
    const labH = lf ? lf.height + F * 0.7 : 0;
    const area = id === 'rows' ? {w: cw * 0.97, h: (ch - labH) * 0.97} : {w: cw * 0.84, h: (ch - labH) * 0.8};
    const art = elementArt(ctx, id, area, P, recs, F, showKey);
    if (art.ok === false) ok = false;
    const c = {x: cell.x + cw / 2, y: cell.y + (ch - labH) / 2 + F * 0.3};
    els[id] = {id, cell, c, art, lf, label: lab, box: {x: c.x - art.w / 2, y: c.y - art.h / 2, w: art.w, h: art.h},
      labY: c.y + art.h / 2 + F * 0.45, present: Boolean(lab)};
    // the connector anchor box includes the label, so no line runs through a label
    const E = els[id];
    const lw = lf ? lf.width : 0;
    E.hit = {x: Math.min(E.box.x, c.x - lw / 2), y: E.box.y, w: Math.max(E.box.w, lw), h: E.box.h + (lf ? F * 0.45 + lf.height : 0)};
  }
  const minArt = Math.min(...['object', 'tag', 'bag'].map(id => Math.min(els[id].art.w, els[id].art.h)));
  return {F, bench, mat, panel, PL, els, grid, kinds, ok: ok && minArt > 50, minArt,
    problems: [PL && !PL.ok && 'panel-text', !ok && 'element-text', minArt <= 50 && 'art-small'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = resolveRecords(P);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'below', cols: 2}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.34}, {mode: 'side', pw: 0.4}]
        : [{mode: 'side', pw: 0.24}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.32}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) for (const o0 of opts) for (const grid of [null, 'wide', 'tall']) {
      const opt = {...o0, grid};
      const c = compose(ctx, P, recs, F, opt);
      const score = c.minArt * Math.sqrt(F / 24) * (F < 19.5 ? 0.7 : 1);
      if (c.ok && score > bestScore) { best = c; bestScore = score; }
      if (!C || c.problems.length < C.problems.length) C = c;
    }
    if (best) C = best;
    const E = C.els;
    // assembled start: everything clustered on the object's place at the centre of the bench
    const cx = C.mat.x + C.mat.w / 2, cy = C.mat.y + C.mat.h / 2;
    const so = E.object.art.w;
    const start = {
      object: {x: cx, y: cy, s: 1}, chain: {x: cx + so * 0.25, y: cy + so * 0.12, s: 0.45},
      tag: {x: cx + so * 0.55, y: cy + so * 0.3, s: 0.6}, rows: {x: cx + so * 0.55, y: cy + so * 0.3, s: 0.2},
      bag: {x: cx + so * 0.1, y: cy + so * 0.1, s: 1.15}, custodian: {x: cx - so * 0.45, y: cy + so * 0.25, s: 0.7},
    };
    // connectors anchored to the exploded components' edges (only explicit relationships)
    const rels = P.relationships.filter(rl => rl.from !== rl.to && E[rl.from] && E[rl.to]);
    const conns = rels.map((rl, i) => {
      const A = E[rl.from], B = E[rl.to];
      const from = edgeAnchor(A.hit, B.c, 10);
      const to = edgeAnchor(B.hit, A.c, rl.kind === 'relation' ? 10 : 16);
      return {rel: rl, c: connector(ctx, {name: `c${i}`, from, to, kind: rl.kind, bend: 0.08, color: mechColor(ctx, rl.kind)})};
    });
    // tracer route: consecutive traversal pairs follow their connector when one exists, else a straight hop
    const order = P.traversalOrder.filter(id => E[id]);
    const legs = [];
    for (let i = 0; i + 1 < order.length; i++) {
      const a = order[i], b = order[i + 1];
      const cn = conns.find(q => (q.rel.from === a && q.rel.to === b) || (q.rel.from === b && q.rel.to === a));
      // centre a → along the connector (when one exists) → centre b, sampled by arc length (continuous at centres)
      const pts = [E[a].c];
      if (cn) for (let k = 0; k <= 24; k++) pts.push(cn.rel.from === a ? cn.c.at(k / 24) : cn.c.at(1 - k / 24));
      pts.push(E[b].c);
      const pl = polyline(pts.map(q => ({x: q.x, y: q.y})));
      legs.push({a, b, fn: t => pl.at(t), along: Boolean(cn)});
    }
    return {P, recs, C, start, conns, order, legs};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const order = ['bag', 'object', 'chain', 'tag', 'rows', 'custodian'];
    const els = order.map(id => {
      const E = C.els[id];
      return g({name: `el-${id}`},
        g({name: `el-${id}-art`}, E.art.node()),
        E.lf ? g({name: `el-${id}-lab`, opacity: 0}, textAt(E.lf, {x: 0, y: E.art.h / 2 + C.F * 0.45, anchor: 'middle', fill: '#f4f1ea'})) : null,
      );
    });
    // legend line icons drawn inline (the category icon set has no connector samples)
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, panelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip}, L.conns.map(q => q.c.node), els, tracer(ctx, 'tracer', th.accent2)),
      bench.frame,
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const nodes = {};
    const kSep = ease.inOutCubic(seg(u, ...W.separate));
    const pos = {};
    const kF = ease.inOutCubic(seg(u, ...W.focus)) * (1 - ease.inOutCubic(seg(u, ...W.unfocus)));
    for (const id of EL) {
      const E = C.els[id], S0 = L.start[id];
      const x = lerp(S0.x, E.c.x, kSep), y = lerp(S0.y, E.c.y, kSep);
      const sc = lerp(S0.s, 1, kSep) * (id === P.focusElement ? 1 + 0.18 * kF : 1);
      pos[id] = {x, y, s: sc};
      // labels move with the element; text stays hidden until the element is at full size (no text under 16 px)
      const art = `el-${id}-art`;
      nodes[`el-${id}`] = {transform: T(x, y)};
      nodes[art] = {transform: T(0, 0, 0, sc)};
      if (E.lf) nodes[`el-${id}-lab`] = {opacity: r(seg(u, 0.17, 0.21), 3), transform: T(0, (sc - 1) * E.art.h / 2)};
    }
    if (ctx.show('key')) nodes['mrows-text'] = {opacity: kSep >= 0.99 ? 1 : 0};
    // connectors draw in sequence
    const n = L.conns.length;
    L.conns.forEach((q, i) => {
      const a = W.draw[0] + ((W.draw[1] - W.draw[0]) / n) * i;
      const b = a + ((W.draw[1] - W.draw[0]) / n) * 0.85;
      Object.assign(nodes, q.c.frame(ease.inOutCubic(seg(u, a, b))));
    });
    // tracer
    const kT = seg(u, ...W.trace);
    let tp = L.legs.length ? L.legs[0].fn(0) : C.els[L.order[0] || 'object'].c;
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
    const conEnds = L.conns.map(q => ({from: q.rel.from, to: q.rel.to, a: R2(q.c.from), b: R2(q.c.to), kind: q.rel.kind,
      okA: overlaps({x: q.c.from.x, y: q.c.from.y, w: 0, h: 0}, C.els[q.rel.from].hit, 16), okB: overlaps({x: q.c.to.x, y: q.c.to.y, w: 0, h: 0}, C.els[q.rel.to].hit, 20)}));
    const phase = u < W.draw[0] ? 'separate' : u < W.trace[0] ? 'relate' : u < W.trace[1] ? 'trace' : 'hold';
    const sem = {phase, tracer: R2(tp), tracerAt: at, leg: legIdx, focus: P.focusElement, focusScale: r(1 + 0.18 * kF, 3), separated: r(kSep, 3),
      connectors: conEnds, order: L.order, problems: C.problems, textPx: r(C.F, 1), minArt: r(C.minArt, 1),
      arrows: L.conns.filter(q => LINK_STYLES[q.rel.kind].arrow).map(q => q.rel.kind)};
    for (const id of EL) sem[`p_${id}`] = R2(pos[id]);
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'evidence-custody-01-mechanism',
    title: 'Evidence tagging — exploded view: object, ball chain, tag, written rows, bag and gloved custodian come apart; only supplied relations are drawn and a tracer follows them',
    titleEs: 'Etiquetado de indicio — Mecanismo o relación explicada',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Etiquetado de indicio',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded view on the evidence bench. The assembled tagged object comes apart into its components — object, ball chain, manila tag, a card with the tag\'s written rows (supplied records), evidence bag and gloved custodian — each in its own place. Only the supplied relationships are drawn, anchored to the components\' edges (plain relations without arrowheads; causal only when supplied); a tracer follows the supplied traversal order and the focus component is enlarged. No custody doctrine and no outcome; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'tag', 'chain', 'mechanism', 'exploded view', 'relations', 'tracer', 'evidence bag', 'records'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/etiquetado-indicio.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
