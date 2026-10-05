/**
 * LAW-0378 — Inventario de objetos · mechanism
 *
 * Storyboard (an exploded view of ONE inventory unit, laid out as a loop rather than a row of boxes: on wide frames
 * the bag, the object and its cell run along the top, and the cell's ball chain, its tag and the list row come back
 * along the bottom; on tall frames the loop runs down the left column and back up the right one; each part is real
 * artwork from the station with its editable caption; a legend lists the object, list row, custodians, times, the
 * line-style key and the neutral key):
 *  0.00–0.18  separate: the six parts start packed together as one assembled unit and move apart to their places
 *             (growing to full size; printed text appears only once full size).
 *  0.18–0.43  only the supplied relationships are drawn, one after another, each anchored to the edges of its two
 *             parts; a plain relation has no arrowhead, a sequence/communication/causal link is drawn as such only when
 *             supplied. Each line carries its kind's caption.
 *  0.43–0.75  a tracer follows the supplied traversal order along the drawn lines; the focus part is enlarged while
 *             the tracer runs.
 *  0.75–1.00  hold: all parts, lines and captions visible; "as supplied · no conclusion drawn".
 * @module animations/evidence-custody/LAW-0378
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r, ease, lerp} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {T, scaleAbout} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {relationGraph} from '../../frameworks/graph.js';
import {localised, panelLayout, fitG, textAt, tagModel, tagArt, bagModel, bagBack, bagFront, INK, WRITE_INK, R2} from './kits/evidence-art.js';
import {
  ioFields, IO_EN, IO_ES, IO_LABELS_EN, IO_LABELS_ES, ioLabelFields, itemArt, legendNodes, F_SIZES, RACK, RACK_DARK, CELL,
  BOARD, SHEET, LINK,
} from './kits/inventario-objetos.js';

const ID = 'LAW-0378';
const DURATION = 7000;
const IDS = ['bag', 'object', 'cell', 'chain', 'tag', 'row'];
const W = {sep: [0.02, 0.17], caps: [0.16, 0.2], draw: [0.18, 0.43], trace: [0.43, 0.75], focusIn: [0.43, 0.49], focusOut: [0.75, 0.8]};

const OWN_EN = {
  labels: IO_LABELS_EN,
  elements: [
    {id: 'bag', label: 'Bag the object comes from'},
    {id: 'object', label: 'Object (fictional)'},
    {id: 'cell', label: 'Its cell in the rack'},
    {id: 'chain', label: 'Ball chain on the cell'},
    {id: 'tag', label: 'Tag with the entry reference'},
    {id: 'row', label: 'Row on the inventory list'},
  ],
  relationships: [
    {from: 'bag', to: 'object', kind: 'sequence'},
    {from: 'object', to: 'cell', kind: 'sequence'},
    {from: 'cell', to: 'chain', kind: 'relation'},
    {from: 'chain', to: 'tag', kind: 'relation'},
    {from: 'tag', to: 'row', kind: 'relation'},
  ],
  focusElement: 'tag',
  relationLabels: {relation: 'joined (as supplied)', communication: 'communicated (as supplied)', sequence: 'next step (as supplied)', causal: 'causes (only as supplied)'},
  traversalOrder: ['bag', 'object', 'cell', 'chain', 'tag', 'row'],
};
const OWN_ES = {
  labels: IO_LABELS_ES,
  elements: [
    {id: 'bag', label: 'Bolsa de la que sale el objeto'},
    {id: 'object', label: 'Objeto (ficticio)'},
    {id: 'cell', label: 'Su celda en la bandeja'},
    {id: 'chain', label: 'Cadenilla de la celda'},
    {id: 'tag', label: 'Etiqueta con la referencia'},
    {id: 'row', label: 'Fila del listado de inventario'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'tag',
  relationLabels: {relation: 'unidos (según lo aportado)', communication: 'comunicado (según lo aportado)', sequence: 'paso siguiente (según lo aportado)', causal: 'causa (solo si se aporta)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...IO_EN, ...OWN_EN};
const ES = {...IO_ES, ...OWN_ES};

const sceneSchema = {...ioFields, ...ioLabelFields, ...mechanismFields(IDS)};
const defaultParams = {...EN};

function legendRows(ctx, P) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  const it = P.items[0];
  const rw = P.records[0];
  if (showKey) rows.push({kind: 'item', icon: `item-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) rows.push({kind: 'item', icon: 'list', text: rw && String(rw.value || '').trim() ? `${rw.field}: ${rw.value}` : P.labels.noEntry, name: 'lg-row'});
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) [...new Set(P.relationships.map(x => x.kind))].forEach(kd => rows.push({kind: 'item', icon: `line-${kd}`, text: P.relationLabels[kd] || kd, name: `lg-k${kd}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Grid slot of each part: a loop (top row out, bottom row back) or (left column down, right column up). */
function slots(tall) {
  return tall
    ? {bag: [0, 0], object: [0, 1], cell: [0, 2], chain: [1, 2], tag: [1, 1], row: [1, 0], cols: 2, rows: 3}
    : {bag: [0, 0], object: [1, 0], cell: [2, 0], chain: [2, 1], tag: [1, 1], row: [0, 1], cols: 3, rows: 2};
}

function compose(ctx, P) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const labelOf = id => (P.elements.find(e => e.id === id) || {}).label;
  const present = IDS.filter(id => labelOf(id) !== undefined);
  const opts = shape === 'portrait' ? [{legend: 'below', tall: true}] : shape === 'square' ? [{legend: 'below', tall: false}, {legend: 'side', pw: 0.34, tall: true}] : [{legend: 'side', pw: 0.26, tall: false}, {legend: 'side', pw: 0.3, tall: false}];
  let best = null, bestScore = -1, fallback = null;
  for (const F of F_SIZES) {
    const rows = legendRows(ctx, P);
    for (const opt of opts) {
      const gap = F * 1.2;
      let area = {x: 0, y: 0, w: DW, h: DH}, panel = null, PL = null;
      if (rows.length) {
        if (opt.legend === 'below') {
          const colW = (DW - 8 - F * 1.2) / 2;
          const all = panelLayout(ctx, rows, {w: colW, F});
          const half = all.h / 2;
          let idx = all.rows.findIndex(rw => rw.y + rw.h > half);
          idx = Math.max(1, Math.min(rows.length - 1, idx + 1));
          const PLs = rows.length > 1 ? [panelLayout(ctx, rows.slice(0, idx), {w: colW, F}), panelLayout(ctx, rows.slice(idx), {w: colW, F})] : [all];
          PL = {cols: PLs, h: Math.max(...PLs.map(q => q.h)), ok: PLs.every(q => q.ok), colW};
          area = {x: 0, y: 0, w: DW, h: DH - PL.h - gap};
          panel = {x: 4, y: DH - PL.h};
        } else {
          const PW = DW * opt.pw;
          const one = panelLayout(ctx, rows, {w: PW, F});
          PL = {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW};
          area = {x: 0, y: 0, w: DW - PW - gap, h: DH};
          panel = {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)};
        }
      }
      const sl = slots(opt.tall);
      const gx = Math.max(110, area.w * 0.08), gy = Math.max(70, area.h * 0.07);
      const capH = ctx.show('key') ? F * 1.2 * 2 + 8 : 0;
      const cw = (area.w - gx * (sl.cols - 1)) / sl.cols;
      const ch = (area.h - gy * (sl.rows - 1)) / sl.rows - capH;
      const B = Math.min(cw, ch * 1.45);
      const bh = Math.min(ch, B / 1.25);
      let ok = (!PL || PL.ok) && B > 90 && bh > 70;
      const caps = {};
      if (ctx.show('key')) for (const id of present) {
        const f = fitG(labelOf(id), {maxWidth: cw, size: F, minSize: F, maxLines: 2, weight: 600});
        if (!f.ok) ok = false;
        caps[id] = f;
      }
      const boxes = {};
      const totalW = sl.cols * B + (sl.cols - 1) * gx, totalH = sl.rows * (bh + capH) + (sl.rows - 1) * gy;
      const ox = area.x + (area.w - totalW) / 2, oy = area.y + (area.h - totalH) / 2;
      for (const id of present) {
        const [c, rr] = sl[id];
        boxes[id] = {x: ox + c * (B + gx), y: oy + rr * (bh + capH + gy), w: B, h: bh};
      }
      const cand = {F, opt, area, panel, PL, B, bh, boxes, caps, capH, ok, present, problems: [!ok && 'fit'].filter(Boolean)};
      if (!fallback) fallback = cand;
      if (!ok) continue;
      const score = Math.min(B, bh * 1.25) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
      if (score > bestScore) { best = cand; bestScore = score; }
    }
  }
  return best || fallback;
}

/** Artwork of one part, fitted into box b (local origin = box centre). */
function partArt(ctx, id, b, P, F, showText) {
  const s = Math.min(b.w, b.h * 1.25);
  if (id === 'bag') {
    const B = bagModel(b.h * 0.72, b.h * 0.92);
    return g({transform: T(-B.w / 2, -B.h / 2)}, bagBack(ctx, B, {}), bagFront(ctx, B, {}));
  }
  if (id === 'object') return itemArt(ctx, P.items[0].kind, Math.min(b.w, b.h) * 0.9);
  if (id === 'cell') {
    const c = Math.min(b.w, b.h) * 0.86;
    return g(null,
      h('path', {d: roundRectPath(-c / 2 - 12, -c / 2 - 12, c + 24, c + 24, 16), fill: RACK, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: roundRectPath(-c / 2, -c / 2, c, c, 10), fill: CELL, stroke: RACK_DARK, 'stroke-width': 2}),
      h('circle', {cx: r(c / 2 + 6), cy: r(-c * 0.3), r: 7, fill: '#9ea5ab', stroke: INK, 'stroke-width': 1.6}),
    );
  }
  if (id === 'chain') {
    const w = b.w * 0.8, bw = Math.max(6, s * 0.06);
    const d = `M${r(-w / 2)} ${r(-b.h * 0.15)}Q0 ${r(b.h * 0.45)} ${r(w / 2)} ${r(-b.h * 0.15)}`;
    return g(null,
      h('path', {d, fill: 'none', stroke: '#5d656c', 'stroke-width': r(bw * 0.3, 2)}),
      h('path', {d, fill: 'none', stroke: '#9ea5ab', 'stroke-width': bw, 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.35, 2)}`}),
      h('circle', {cx: r(-w / 2), cy: r(-b.h * 0.15), r: r(bw), fill: '#9ea5ab', stroke: INK, 'stroke-width': 1.4}),
    );
  }
  if (id === 'tag') {
    const tw = b.w * 0.9, th = Math.min(b.h * 0.6, tw * 0.45);
    const TG = tagModel({w: tw, h: th, rows: 1});
    const rw = P.records[0];
    const f = showText && rw ? fitG(rw.field, {maxWidth: (TG.rx1 - TG.rx0) * 0.95, size: Math.min(F * 1.3, th * 0.45), minSize: 16, maxLines: 1, weight: 700}) : null;
    return g({transform: T(-tw / 2 + th * 0.3, 0)},
      tagArt(ctx, TG, {prefix: 'mtag', rows: [{filled: !f, len: 0.8}], seedKey: 'mtag'}),
      f && f.ok ? g({name: 'p-tagtext'}, textAt(f, {x: TG.rx0 + 2, y: -f.height / 2, fill: WRITE_INK})) : g({name: 'p-tagtext'}));
  }
  // row: a strip of the clipboard list with the badge and the entry text
  const rw = P.records[0];
  const txt = rw && String(rw.value || '').trim() ? `${rw.field}: ${rw.value}` : '';
  const badgeR = Math.min(18, b.h * 0.14);
  const f = showText && txt ? fitG(txt, {maxWidth: b.w - badgeR * 2 - 40, size: F, minSize: 16, maxLines: 3, weight: 500}) : null;
  return g(null,
    h('path', {d: roundRectPath(-b.w / 2, -b.h / 2, b.w, b.h, 10), fill: BOARD, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(-b.w / 2 + 8), y: r(-b.h / 2 + 8), width: r(b.w - 16), height: r(b.h - 16), rx: 5, fill: SHEET}),
    h('path', {d: `M${r(-b.w / 2 + 16)} ${r(b.h / 2 - 18)}H${r(b.w / 2 - 16)}`, stroke: '#c3cbd2', 'stroke-width': 2}),
    h('circle', {cx: r(-b.w / 2 + 18 + badgeR), cy: 0, r: r(badgeR), fill: '#fff', stroke: LINK, 'stroke-width': 2.4}),
    h('circle', {cx: r(-b.w / 2 + 18 + badgeR), cy: 0, r: r(badgeR * 0.38), fill: LINK}),
    f && f.ok ? g({name: 'p-rowtext'}, textAt(f, {x: -b.w / 2 + 30 + badgeR * 2, y: -f.height / 2, fill: INK})) : g({name: 'p-rowtext'}),
  );
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const C = compose(ctx, P);
    const els = Object.fromEntries(C.present.map(id => [id, {box: C.boxes[id]}]));
    const rels = P.relationships.filter(x => els[x.from] && els[x.to] && x.from !== x.to);
    const obstacles = ctx.show('key') ? C.present.map(id => ({x: C.boxes[id].x, y: C.boxes[id].y + C.bh, w: C.B, h: C.capH})) : [];
    const graph = relationGraph(ctx, {name: 'gr', elements: els, relationships: rels, relationLabels: P.relationLabels, obstacles, bounds: C.area, separateLabels: true, chipSize: Math.min(C.F, 22), chipMax: Math.max(160, C.B * 1.1)});
    const order = P.traversalOrder.filter(id => els[id]);
    const route = order.length > 1 ? graph.route(order) : null;
    const cx = C.area.x + C.area.w / 2, cy = C.area.y + C.area.h / 2;
    const start = id => ({x: cx + (C.boxes[id].x + C.B / 2 - cx) * 0.3, y: cy + (C.boxes[id].y + C.bh / 2 - cy) * 0.3});
    return {P, C, els, rels, graph, route, order, start};
  },
  build(ctx, L) {
    const {C, P} = L;
    const parts = C.present.map(id => {
      const b = C.boxes[id];
      return g({name: `p_${id}`, transform: T(b.x + b.w / 2, b.y + b.h / 2)}, g({name: `pz_${id}`}, partArt(ctx, id, b, P, C.F, ctx.show('key'))));
    });
    const caps = ctx.show('key') ? C.present.map(id => {
      const b = C.boxes[id], f = C.caps[id];
      return g({name: `cap_${id}`, opacity: 0}, textAt(f, {x: b.x + b.w / 2, y: b.y + b.h + 8, fill: ctx.theme.fg, anchor: 'middle'}));
    }) : [];
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, legendNodes(ctx, PLc))) : [];
    return g({name: 'scene'},
      L.graph.node, parts, caps, L.graph.labelsNode, L.graph.tracerNode('tracer'), panels);
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const nodes = {};
    const sepK = ease.inOutCubic(seg(u, ...W.sep));
    const focusK = ease.inOutCubic(seg(u, ...W.focusIn)) * (1 - ease.inOutCubic(seg(u, ...W.focusOut)));
    const sem = {};
    for (const id of C.present) {
      const b = C.boxes[id];
      const end = {x: b.x + b.w / 2, y: b.y + b.h / 2};
      const st = L.start(id);
      const p = {x: lerp(st.x, end.x, sepK), y: lerp(st.y, end.y, sepK)};
      const sc = lerp(0.45, 1, sepK) * (id === P.focusElement ? 1 + 0.16 * focusK : 1);
      nodes[`p_${id}`] = {transform: T(p.x, p.y, 0, sc)};
      sem[`p_${id}`] = R2(p);
      sem[`s_${id}`] = r(sc, 3);
      if (ctx.show('key')) nodes[`cap_${id}`] = {opacity: r(seg(u, ...W.caps), 3)};
    }
    const printed = sepK >= 1;
    for (const nm of ['p-tagtext', 'p-rowtext']) if (C.present.includes(nm === 'p-tagtext' ? 'tag' : 'row')) nodes[nm] = {opacity: printed ? 1 : 0};
    const nR = Math.max(1, L.rels.length);
    const per = (W.draw[1] - W.draw[0]) / nR;
    Object.assign(nodes, L.graph.frame(i => ease.inOutCubic(seg(u, W.draw[0] + i * per, W.draw[0] + (i + 1) * per))));
    // tracer
    let tracerAt = null;
    const tk = seg(u, ...W.trace);
    if (L.route && u >= W.trace[0] && u <= W.trace[1] + 1e-9) {
      const q = L.route.poly.at(tk);
      nodes.tracer = {opacity: 1, transform: T(q.x, q.y)};
      sem.tracer = R2(q);
      for (const v of L.route.visits) if (v.t <= tk + 1e-6) tracerAt = v.id;
    } else {
      const q = L.route ? L.route.poly.at(u < W.trace[0] ? 0 : 1) : {x: 0, y: 0};
      nodes.tracer = {opacity: 0, transform: T(q.x, q.y)};
      sem.tracer = R2(q);
    }
    const connectors = L.graph.conns.map(x => {
      const A = C.boxes[x.rel.from], B = C.boxes[x.rel.to];
      const near = (pt, bx) => pt.x >= bx.x - 20 && pt.x <= bx.x + bx.w + 20 && pt.y >= bx.y - 20 && pt.y <= bx.y + bx.h + 20;
      return {from: x.rel.from, to: x.rel.to, okA: near(x.c.from, A), okB: near(x.c.to, B)};
    });
    return {
      nodes,
      semantic: {
        ...sem,
        phase: u < W.draw[0] ? 'separate' : u < W.trace[0] ? 'relate' : u < W.trace[1] ? 'trace' : 'hold',
        separated: r(sepK, 3), printed, focus: P.focusElement, focusScale: r(1 + 0.16 * focusK, 3),
        connectors, arrows: L.rels.map(x => x.kind), order: L.order, tracerAt,
        problems: C.problems, textPx: r(C.F, 1), B: r(C.B, 1),
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
    slug: 'evidence-custody-05-mechanism',
    title: 'Object inventory — exploded loop of one inventory unit: bag, object, cell, ball chain, tag and list row, with only the supplied relationships drawn and traced',
    titleEs: 'Inventario de objetos — Mecanismo o relación explicada',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Inventario de objetos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'One inventory unit taken apart: the bag the object comes from, the fictional object, its rack cell, the ball chain on the cell, the tag with the entry reference and the row on the clipboard list start packed together and move apart into a loop (a row out and a row back on wide frames, down and up two columns on tall ones). Only the supplied relationships are drawn, anchored to the parts\' edges, in their own styles (a plain relation has no arrowhead; sequence or causal links only when supplied); a tracer follows the supplied order while the focus part enlarges. No custody or admissibility doctrine; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'inventory', 'mechanism', 'exploded view', 'relationships', 'tag', 'list', 'rack'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/inventario-objetos.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
