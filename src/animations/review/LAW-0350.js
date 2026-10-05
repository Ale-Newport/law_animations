/**
 * LAW-0350 — Devolución para nuevo examen · mechanism
 *
 * Storyboard (an explanatory map of the return — not the story's desk: five component cards placed where they sit on
 * the supplied route — the folder with the decision of the initial examination (at the review desk), its slip of review
 * notes, the filter doors, the configured return point (its tray and plate) and the blank sheet of the renewed
 * examination (not shown, no outcome)):
 *  0.00–0.18  separate: the notes slip starts clipped on the folder card and slides out to its own card; the other
 *             components stand at their places on the route.
 *  0.18–0.43  draw only the supplied relationships, one after the other, anchored on the cards' edges (plain relations
 *             without arrowheads; the return itself is a supplied "sequence as configured" link).
 *  0.43–0.75  a tracer follows `traversalOrder`; the focus component enlarges while the tracer passes; when it reaches
 *             the return point a copy of the folder (with its notes) settles in that card's tray — the transformation.
 *  0.75–1.00  everything stays visible: origin (folder at the review desk), transformation (copy in the configured
 *             tray) and state (the renewed examination's blank sheet); key "as supplied · no conclusion drawn".
 * @module animations/review/LAW-0350
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {roundRectPath} from '../../core/geometry.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {tracer} from '../../primitives/annotate.js';
import {
  dnFields, DN_EN, DN_ES, localisedDn, resolveDn, folderArt, slipArt, trayArt, doorArt, blankSheetArt, pinGlyph, indexPip,
  panelLayout, panelNode, fitG, textAt, overlaps, dnIcon, INK, R2,
} from './kits/devolucion-nuevo-examen.js';

const ID = 'LAW-0350';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], hold: [0.75, 1]};
const W = {explode: [0.04, 0.16], relate: [0.18, 0.42], trace: [0.44, 0.74], copy: 0.06};
const IDS = ['folder', 'notes', 'doors', 'point', 'renewed'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  elements: [
    {id: 'folder', label: 'Folder at the review desk'},
    {id: 'notes', label: 'Review notes'},
    {id: 'doors', label: 'Filter doors'},
    {id: 'point', label: 'Configured return point'},
    {id: 'renewed', label: 'Renewed examination'},
  ],
  relationships: [
    {from: 'notes', to: 'folder', kind: 'relation', label: 'clipped to the folder'},
    {from: 'folder', to: 'doors', kind: 'sequence', label: 'return as configured (illustrative)'},
    {from: 'doors', to: 'point', kind: 'relation', label: 'open only here'},
    {from: 'point', to: 'renewed', kind: 'relation', label: 'not shown'},
  ],
  focusElement: 'doors',
  relationLabels: {relation: 'linked as supplied', communication: 'communication (as supplied)', sequence: 'sequence as configured (illustrative)', causal: 'causal link (supplied)'},
  traversalOrder: ['notes', 'folder', 'doors', 'point', 'renewed'],
};
const OWN_ES = {
  elements: [
    {id: 'folder', label: 'Carpeta en la mesa de revisión'},
    {id: 'notes', label: 'Notas de revisión'},
    {id: 'doors', label: 'Puertas filtro'},
    {id: 'point', label: 'Punto de devolución configurado'},
    {id: 'renewed', label: 'Examen renovado'},
  ],
  relationships: [
    {from: 'notes', to: 'folder', kind: 'relation', label: 'sujetas a la carpeta'},
    {from: 'folder', to: 'doors', kind: 'sequence', label: 'devolución configurada (ilustrativa)'},
    {from: 'doors', to: 'point', kind: 'relation', label: 'abiertas solo aquí'},
    {from: 'point', to: 'renewed', kind: 'relation', label: 'no se muestra'},
  ],
  focusElement: 'doors',
  relationLabels: {relation: 'vinculado según lo aportado', communication: 'comunicación (según lo aportado)', sequence: 'secuencia configurada (ilustrativa)', causal: 'vínculo causal (aportado)'},
  traversalOrder: ['notes', 'folder', 'doors', 'point', 'renewed'],
};
const EN = {...DN_EN, ...OWN_EN};
const ES = {...DN_ES, ...OWN_ES};

const sceneSchema = {
  ...dnFields,
  elements: list('Component captions; ids are fixed by the scene, captions are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 2, 5),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Optional caption of this relationship (otherwise the caption of its kind)', 60),
  }, ['from', 'to', 'kind']), 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption used for each relation kind', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links', 50),
    causal: str('Caption for supplied causal links', 50),
  }, ['relation', 'communication', 'sequence', 'causal']),
  traversalOrder: list('Order in which the tracer visits components (repeats allowed)', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {...EN};

/** Grid cells per shape: [col, row] in a cols × rows grid (cards placed where they sit on the route). */
const GRID = {
  landscape: {cols: 4, rows: 2, cells: {point: [0, 0], renewed: [0, 1], doors: [1, 0.5], folder: [2, 0.5], notes: [3, 0.5]}},
  square: {cols: 3, rows: 2, cells: {notes: [2, 0.5, 2], folder: [1, 0], doors: [0, 0], point: [0, 1], renewed: [1, 1]}},
  portrait: {cols: 2, rows: 3, cells: {notes: [1, 0], folder: [0, 0], doors: [0.5, 1], point: [0, 2], renewed: [1, 2]}},
};

function cardContent(ctx, P, R, id, w, F, maxH = 0) {
  const showKey = ctx.show('key');
  const pad = F * 0.6;
  const tw = w - pad * 2;
  const label = (P.elements.find(e => e.id === id) || {}).label;
  const head = showKey && label ? fitG(label, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  const texts = [];
  const add = (t, o = {}) => { if (showKey) texts.push({fit: fitG(t, {maxWidth: tw - (o.indent || 0), size: F, minSize: F, maxLines: 3, weight: o.weight || 500}), indent: o.indent || 0, pip: o.pip}); };
  let artH;
  if (id === 'folder') { add(P.decisions.title); add(P.routes.origin, {weight: 600}); artH = Math.min(tw * 0.55, F * 4.4); }
  else if (id === 'notes') { R.notes.forEach((t, i) => add(t, {indent: F * 1.5, pip: i})); artH = Math.min(tw * 0.4, F * 3.2); }
  else if (id === 'doors') { artH = Math.min(tw * 0.5, F * 3.6); }
  else if (id === 'point') { add(P.routes.stations[R.target], {weight: 600, indent: F * 1.4, pin: true}); artH = Math.min(tw * 0.55, F * 4.2); }
  else { add(P.outcomes.renewed); artH = Math.min(tw * 0.6, F * 4.0); }
  if (!showKey) artH *= 1.5;
  const headH = head ? head.height + F * 0.4 : 0;
  const textH = texts.reduce((a, t) => a + t.fit.height + F * 0.3, 0);
  // grow the art into the cell's spare height (the objects stay the subject)
  if (maxH) artH = Math.max(artH, Math.min(tw * 0.62, maxH - (pad * 1.7 + headH + (texts.length ? F * 0.4 + textH : 0)) - 2));
  const hh = pad + headH + artH + (texts.length ? F * 0.4 + textH : 0) + pad * 0.7;
  return {id, w, h: hh, pad, head, headH, artH, texts, ok: [head, ...texts.map(t => t.fit)].every(f => !f || f.ok)};
}

function cardNode(ctx, K, R, name) {
  const th = ctx.theme;
  const {pad, w} = K;
  const F = K.F;
  const parts = [h('path', {d: roundRectPath(5, 7, w, K.h, 14), fill: th.shadow}), h('path', {d: roundRectPath(0, 0, w, K.h, 14), fill: th.card, stroke: INK, 'stroke-width': 2.5})];
  let y = pad;
  if (K.head) { parts.push(g({name: `${name}-head`}, textAt(K.head, {x: pad, y, fill: INK}))); y += K.headH; }
  const aw = w - pad * 2, ah = K.artH, cx = w / 2, cy = y + ah / 2;
  if (K.id === 'folder') parts.push(g({transform: T(cx, cy + ah * 0.05)}, folderArt(ctx, {w: Math.min(aw * 0.7, ah * 1.3), h: Math.min(aw * 0.7, ah * 1.3) * 0.68})));
  else if (K.id === 'notes') parts.push(g({transform: T(cx, cy)}, slipArt(ctx, {n: R.notes.length, s: ah * 0.85}).node));
  else if (K.id === 'doors') {
    const tw = Math.min(aw * 0.6, ah * 1.4), tt = Math.max(10, F * 0.6);
    parts.push(h('path', {d: `M${r(cx - tw / 2)} ${r(cy - ah * 0.4)}V${r(cy + ah * 0.1)}M${r(cx + tw / 2)} ${r(cy - ah * 0.4)}V${r(cy + ah * 0.1)}`, stroke: '#3b4a5a', 'stroke-width': r(tt * 0.9), 'stroke-linecap': 'round'}));
    parts.push(g({name: `${name}-dl`, transform: T(cx - tw / 2, cy + ah * 0.1, 0)}, doorArt(ctx, {len: tw / 2, t: tt})));
    parts.push(g({name: `${name}-dr`, transform: T(cx + tw / 2, cy + ah * 0.1, 180)}, doorArt(ctx, {len: tw / 2, t: tt})));
  } else if (K.id === 'point') {
    const tw = Math.min(aw * 0.62, ah * 1.4), thh = Math.min(ah * 0.92, tw * 0.75);
    parts.push(g({transform: T(cx - tw / 2, cy - thh / 2)}, trayArt(ctx, {w: tw, h: thh, mouth: 'bottom'})));
    K.tray = {x: cx, y: cy, w: tw, h: thh};
  } else parts.push(g({transform: T(cx - ah * 0.36, cy - ah * 0.46)}, blankSheetArt(ctx, {w: ah * 0.72, h: ah * 0.92})));
  y += ah + F * 0.4;
  const txt = [];
  for (const t of K.texts) {
    if (t.pip != null) txt.push(g({transform: T(pad + F * 0.6, y + Math.min(t.fit.height, F * 1.2) / 2)}, indexPip(t.pip, F * 0.5)));
    if (t.indent && t.pip == null) txt.push(g({transform: T(pad + F * 0.6, y + F * 0.55)}, pinGlyph(ctx, F * 0.5)));
    txt.push(textAt(t.fit, {x: pad + t.indent, y, fill: INK}));
    y += t.fit.height + F * 0.3;
  }
  return g({name}, parts, g({name: `${name}-txt`}, txt));
}

function compose(ctx, P, R, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const problems = [];
  // shared strip: the route, the other points, the configured-point caption, the key
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'lane', text: P.labels.route, name: 'sh-route'});
  if (showKey) P.routes.stations.forEach((s, i) => { if (i !== R.target) rows.push({kind: 'item', icon: 'tray', text: s, name: `sh-st${i}`}); });
  if (showKey) rows.push({kind: 'item', icon: 'pin', text: P.labels.point, name: 'sh-point'});
  const relsF = P.relationships.filter(x => x.from !== x.to && IDS.includes(x.from) && IDS.includes(x.to) && P.elements.some(e => e.id === x.from) && P.elements.some(e => e.id === x.to));
  if (v.foot && ctx.show('all')) relsF.forEach((x, i) => rows.push({kind: 'item', icon: 'num', index: i, text: x.label || P.relationLabels[x.kind] || x.kind, name: `sh-rel${i}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  let strip = null;
  if (rows.length) {
    const sc = v.sc;
    const cg = F * 1.6, cw = (DW - cg * (sc - 1)) / sc, per = Math.ceil(rows.length / sc);
    const cols = [];
    for (let c = 0; c < sc; c++) {
      const part = rows.slice(c * per, (c + 1) * per);
      if (!part.length) continue;
      const PLc = panelLayout(ctx, part, {w: cw, F});
      if (!PLc.ok) problems.push('strip-text');
      cols.push({PL: PLc, x: c * (cw + cg)});
    }
    strip = {cols, h: Math.max(...cols.map(c => c.PL.h))};
  }
  const stripH = strip ? strip.h + F * 1.0 : 0;
  const G = GRID[shape];
  const area = {x: 0, y: 0, w: DW, h: DH - stripH};
  const gx = v.gx * F, gy = v.gy * F;
  const cellW = (area.w - gx * (G.cols - 1)) / G.cols;
  const cellH = (area.h - gy * (G.rows - 1)) / G.rows;
  const cards = {};
  for (const id of IDS) {
    if (!P.elements.some(e => e.id === id)) continue;
    const [c, rr, span = 1] = G.cells[id];
    const hMax = cellH * span + gy * (span - 1);
    const K = cardContent(ctx, P, R, id, cellW * v.cw, F, Math.min(hMax, cellH * 1.4) * 0.94);
    K.F = F;
    if (!K.ok) problems.push('card-text');
    if (K.h > hMax + 0.5) problems.push('card-tall');
    const cx = area.x + c * (cellW + gx) + cellW / 2, cy = area.y + rr * (cellH + gy) + cellH / 2;
    K.x = cx - K.w / 2; K.y = clamp(cy - K.h / 2, 0, area.h - K.h);
    cards[id] = K;
  }
  const els = Object.fromEntries(Object.entries(cards).map(([k, K]) => [k, {box: {x: K.x, y: K.y, w: K.w, h: K.h}}]));
  const boxes = Object.values(els).map(e => e.box);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlaps(boxes[i], boxes[j], 12)) problems.push('cards-overlap');
  if (problems.length && !v.force) return {ok: false, problems};
  const rels = P.relationships.filter(x => x.from !== x.to && els[x.from] && els[x.to]);
  const bend = [0.06, 0.2, -0.2, 0.4, -0.4];
  const bi = rels.map(() => 0);
  let graph = null;
  const crosses = gr => {
    const bad = new Set();
    gr.conns.forEach((c, ci) => {
      for (const [id, e] of Object.entries(els)) {
        if (id === c.rel.from || id === c.rel.to) continue;
        for (let k = 1; k < 24; k++) { const q = c.c.at(k / 24); if (q.x > e.box.x - 4 && q.x < e.box.x + e.box.w + 4 && q.y > e.box.y - 4 && q.y < e.box.y + e.box.h + 4) { bad.add(ci); break; } }
      }
    });
    return bad;
  };
  for (let pass = 0; pass < 5; pass++) {
    graph = relationGraph(v.foot ? {...ctx, show: lvl => (lvl === 'all' ? false : ctx.show(lvl))} : ctx, {name: 'rel', elements: els, relationships: rels, relationLabels: P.relationLabels, bend: (rel, i) => bend[bi[i]], chipSize: F, chipMax: Math.max(F * 9, cellW * v.chip), bounds: {x: 0, y: 0, w: DW, h: DH - stripH}, separateLabels: true});
    const bad = crosses(graph);
    if (!bad.size) break;
    if (pass === 4) problems.push('conn-crosses');
    bad.forEach(i => { bi[i] = Math.min(4, bi[i] + 1); });
  }
  if (ctx.show('all') && graph.conns.some(c => c.lab && !c.labelClear)) problems.push('label-overlap');
  if (ctx.show('all') && graph.conns.some(c => c.lab && c.lab.fit && (c.lab.fit.size < F - 0.01 || c.lab.fit.truncated))) problems.push('label-shrunk');
  const foot = v.foot && ctx.show('all') ? graph.conns.map((c, i) => ({i, at: c.c.at(0.5)})) : [];
  return {F, cards, els, graph, rels, foot, strip, stripY: DH - (strip ? strip.h : 0), ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedDn(ctx, EN, ES);
    const R = resolveDn(P);
    const shape = ctx.view.shape;
    const sc0 = shape === 'landscape' ? 3 : 2;
    const vs0 = [0.9, 1.3].flatMap(chip => [{gx: 5, gy: 3, cw: 1, sc: sc0, chip}, {gx: 4, gy: 2.5, cw: 1, sc: sc0, chip}, {gx: 5, gy: 3, cw: 0.9, sc: 2, chip}, {gx: 6, gy: 4, cw: 0.85, sc: 2, chip}]);
    const vs = [...vs0, ...vs0.slice(0, 3).map(v => ({...v, foot: true}))];
    const sizes = !ctx.show('key') ? [30, 26, ...SIZES] : SIZES;
    let C = null, best = null;
    outer: for (const F of sizes) for (const v of vs) {
      const c = compose(ctx, P, R, F, v);
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.n) best = {n: c.problems.length, F, v};
    }
    if (!C) C = compose(ctx, P, R, best.F, {...best.v, force: true});
    const route = C.graph.route(P.traversalOrder.filter(id => C.els[id]));
    return {P, R, C, route};
  },
  build(ctx, L) {
    const {C, R} = L;
    const th = ctx.theme;
    const cardEls = Object.entries(C.cards).map(([id, K]) => g({name: `el-${id}`}, g({name: `pos-${id}`, transform: T(K.x, K.y)}, cardNode(ctx, K, R, `card-${id}`))));
    const pt = C.cards.point;
    const copy = pt && pt.tray ? g({name: 'copy', opacity: 0, transform: T(pt.x + pt.tray.x, pt.y + pt.tray.y)},
      folderArt(ctx, {w: pt.tray.w * 0.78, h: pt.tray.w * 0.78 * 0.68}),
      g({transform: T(pt.tray.w * 0.26, -pt.tray.w * 0.14)}, slipArt(ctx, {n: R.notes.length, s: pt.tray.w * 0.24}).node)) : null;
    return g({name: 'scene'},
      C.graph.node,
      cardEls,
      copy,
      C.graph.labelsNode,
      C.foot.map(f => g({name: `foot${f.i}`, opacity: 0, transform: T(f.at.x, f.at.y)}, dnIcon(ctx, 'num', C.F * 1.2, {index: f.i, F: C.F, color: kindColor(ctx, C.rels[f.i].kind)}))),
      tracer(ctx, 'tracer', th.accent2),
      C.strip ? g({name: 'strip', transform: T(0, C.stripY)}, C.strip.cols.map(col => g({transform: T(col.x, 0)}, panelNode(ctx, col.PL)))) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, C, route} = L;
    const nodes = {};
    const kEx = ease.inOutCubic(seg(u, ...W.explode));
    // the notes card starts over the folder card and slides out to its own place
    if (C.cards.notes) {
      // the notes card starts as a small slip on the folder card and grows out to its own place; its text stays
      // hidden until it has reached full size (no shrunken or overlapping text)
      const N = C.cards.notes, Fd = C.cards.folder || N;
      const sc = lerp(0.3, 1, kEx);
      const sx = Fd.x + Fd.w * 0.62 - N.w * 0.3 / 2, sy = Fd.y + Fd.h * 0.12;
      nodes['pos-notes'] = {transform: T(lerp(sx, N.x, kEx), lerp(sy, N.y, kEx), 0, sc)};
      const tk = kEx >= 0.98 ? 1 : 0;
      nodes['card-notes-txt'] = {opacity: tk};
      if (N.head) nodes['card-notes-head'] = {opacity: tk};
    }
    const tr = seg(u, ...W.trace);
    const kt = ease.inOutSine(tr);
    const tp = route.poly.at(kt);
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: tr > 0 && tr < 1 ? 1 : 0};
    const near = id => {
      let best = 0;
      for (const vv of route.visits) if (vv.id === id) best = Math.max(best, 1 - clamp(Math.abs(kt - vv.t) / 0.12));
      return tr > 0 && tr < 1 ? ease.inOutSine(best) : 0;
    };
    const fe = P.focusElement;
    const grow = C.els[fe] ? near(fe) : 0;
    for (const id of Object.keys(C.els)) {
      const b = C.els[id].box;
      const s = id === fe ? 1 + 0.06 * grow : 1;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      nodes[`el-${id}`] = {transform: `${T(cx, cy, 0, s)} translate(${r(-cx)} ${r(-cy)})`};
    }
    // the configured doors open as the tracer passes them (they stay open: as configured)
    const vPoint = route.visits.find(vv => vv.id === 'point');
    const kc = vPoint ? clamp((kt - (vPoint.t - 0.03)) / W.copy) * (tr > 0 ? 1 : 0) : 0;
    const kCopy = u >= W.trace[1] ? (vPoint ? 1 : 0) : kc;
    if (C.cards.point && C.cards.point.tray) nodes.copy = {opacity: r(kCopy, 3)};
    if (C.cards.doors) {
      nodes['card-doors-dl'] = {transform: dl(C, 1)};
      nodes['card-doors-dr'] = {transform: dl(C, -1)};
    }
    const n = Math.max(1, C.rels.length);
    const relP = i => ease.inOutCubic(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 1) * (W.relate[1] - W.relate[0])) / n));
    Object.assign(nodes, C.graph.frame(relP));
    for (const f of C.foot) nodes[`foot${f.i}`] = {opacity: r(clamp((relP(f.i) - 0.55) / 0.45), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'hold';
    return {
      nodes,
      semantic: {
        beat,
        notesCard: C.cards.notes ? R2(nodesPos(C, kEx)) : null,
        tracer: tr > 0 && tr < 1 ? R2(tp) : null,
        traceK: r(kt, 3),
        visits: route.visits.map(vv => ({id: vv.id, t: r(vv.t, 3)})),
        reached: route.visits.filter(vv => kt >= vv.t - 1e-6).map(vv => vv.id),
        connectors: C.graph.conns.map((x, i) => ({from: x.rel.from, to: x.rel.to, kind: x.rel.kind, a: R2(x.c.from), b: R2(x.c.to), drawn: r(relP(i), 3), arrow: x.rel.kind !== 'relation'})),
        boxes: Object.fromEntries(Object.entries(C.els).map(([k, e]) => [k, {x: r(e.box.x), y: r(e.box.y), w: r(e.box.w), h: r(e.box.h)}])),
        focus: fe, focusScale: r(1 + 0.06 * grow, 4), exploded: r(kEx, 3), copy: r(kCopy, 3),
        problems: C.problems, textPx: r(C.F, 1),
      },
    };
  },
};

function nodesPos(C, k) {
  const N = C.cards.notes, Fd = C.cards.folder || N;
  return {x: lerp(Fd.x + Fd.w * 0.62 - N.w * 0.15, N.x, k), y: lerp(Fd.y + Fd.h * 0.12, N.y, k)};
}

/** Door half transform inside the doors card: open (folded back), as configured. */
function dl(C, side) {
  const K = C.cards.doors;
  const aw = K.w - K.pad * 2, ah = K.artH;
  const tw = Math.min(aw * 0.6, ah * 1.4);
  const cy = K.pad + K.headH + ah / 2;
  const x = side > 0 ? K.w / 2 - tw / 2 : K.w / 2 + tw / 2;
  return T(x, cy + ah * 0.1, side > 0 ? -55 : 235);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'review-08-mechanism',
    title: 'Return for a new examination — map of the return: folder, notes, filter doors, configured point and the blank renewed examination, linked only as supplied',
    titleEs: 'Devolución para nuevo examen — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Devolución para nuevo examen',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An explanatory map of the return. Five component cards stand where they sit on the supplied route: the folder with the decision of the initial examination at the review desk, its review notes (which slide out of the folder card), the filter doors, the configured return point and the blank sheet of the renewed examination. Only the supplied relationships are drawn, anchored on card edges (plain relations without arrowheads; the return is a supplied sequence link captioned as configured and illustrative). A tracer follows the supplied order, the focus card enlarges, and a copy of the folder with its notes settles in the configured tray. No result of the renewed examination; jurisdiction unspecified.',
    tags: ['review', 'return for a new examination', 'mechanism', 'relations', 'tracer', 'folder', 'review notes', 'filter doors', 'return point', 'renewed examination'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/devolucion-nuevo-examen.js', 'src/animations/review/kits/limites-de-revision.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
