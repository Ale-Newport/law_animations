/**
 * LAW-0370 — Transferencia de custodia · mechanism
 *
 * Storyboard (a spatial plan of the hand-off, laid out like the room it comes from: custodian A on the left with A's
 * own record sheet below, the sealed evidence bag (object inside) on the counter tray in the middle with its ball chain
 * and tag beneath it, custodian B on the right with B's own record sheet below; in tall frames A's corner sits on top
 * and B's at the bottom; the sheets print their supplied rows; every element is real art with its editable label; a
 * legend lists item, custodians, times, the line kinds in use and the neutral key):
 *  0.00–0.18  separate: the elements start packed together around the tray (as at the moment of the hand-off) and move
 *             apart to their own places, growing to readable size; labels and sheet rows print only at full size.
 *  0.18–0.43  only the explicit relationships are drawn, one after another, each anchored to the edges of its two
 *             elements: a plain relation has no arrowhead; a sequence ("then", as configured) has one; causal arrows
 *             appear only when the author supplies a causal relation.
 *  0.43–0.75  a tracer follows the supplied traversal order along the drawn relations (by default sheet A → A → bag →
 *             B → sheet B); the focus element (the bag) is enlarged while the tracer runs.
 *  0.75–1.00  hold: origin (A and sheet A), the passage (bag on the tray, tag and chain) and the recorded state (sheet
 *             B) stay visible; line kinds keyed in the legend. No doctrine, no outcome; a blank row is only a supplied
 *             blank row.
 * @module animations/evidence-custody/LAW-0370
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {edgeAnchor, roundRectPath, polyline} from '../../core/geometry.js';
import {connector, tracer} from '../../primitives/annotate.js';
import {localised, R2, fitG, textAt, tagModel, tagArt, chainNode, chainProps, bagModel, INK} from './kits/evidence-art.js';
import {
  TC_EN, TC_ES, tcFields, tcLogs, sheetModel, sheetArt, badge, bagUnit, tcPanelLayout, tcPanelNode, LANE,
} from './kits/transferencia-custodia.js';
import {objectModel} from './kits/evidence-art.js';

const ID = 'LAW-0370';
const DURATION = 8000;
const EL = ['custodianA', 'logA', 'bag', 'chain', 'tag', 'custodianB', 'logB'];
const W = {separate: [0.02, 0.16], labels: [0.16, 0.2], draw: [0.19, 0.43], trace: [0.44, 0.74], focus: [0.43, 0.49], unfocus: [0.75, 0.8]};
const mechColor = (ctx, k) => ({relation: ctx.theme.accent3, communication: '#7fb0d8', sequence: '#e58e73', causal: ctx.theme.accent}[k] || ctx.theme.accent3);
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  elements: [
    {id: 'custodianA', label: 'Custodian A (hands the bag over)'}, {id: 'logA', label: 'Sheet A (kept by A)'},
    {id: 'bag', label: 'Sealed bag on the counter tray'}, {id: 'chain', label: 'Ball chain'}, {id: 'tag', label: 'Tag'},
    {id: 'custodianB', label: 'Custodian B (receives the bag)'}, {id: 'logB', label: 'Sheet B (kept by B)'},
  ],
  relationships: [
    {from: 'custodianA', to: 'logA', kind: 'relation'}, {from: 'custodianA', to: 'bag', kind: 'sequence'},
    {from: 'bag', to: 'custodianB', kind: 'sequence'}, {from: 'custodianB', to: 'logB', kind: 'relation'},
    {from: 'bag', to: 'chain', kind: 'relation'}, {from: 'chain', to: 'tag', kind: 'relation'},
  ],
  focusElement: 'bag',
  relationLabels: {relation: 'linked (as supplied)', communication: 'communicates (as supplied)', sequence: 'then (sequence as configured)', causal: 'causes (supplied)'},
  traversalOrder: ['logA', 'custodianA', 'bag', 'custodianB', 'logB'],
};
const OWN_ES = {
  elements: [
    {id: 'custodianA', label: 'Custodio A (entrega la bolsa)'}, {id: 'logA', label: 'Hoja A (la lleva A)'},
    {id: 'bag', label: 'Bolsa cerrada en la bandeja'}, {id: 'chain', label: 'Cadena de bolas'}, {id: 'tag', label: 'Etiqueta'},
    {id: 'custodianB', label: 'Custodio B (recibe la bolsa)'}, {id: 'logB', label: 'Hoja B (la lleva B)'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'bag',
  relationLabels: {relation: 'unidos (según lo aportado)', communication: 'comunica (según lo aportado)', sequence: 'después (secuencia configurada)', causal: 'causa (aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...TC_EN, ...OWN_EN};
const ES = {...TC_ES, ...OWN_ES};

const sceneSchema = {...tcFields, ...mechanismFields(EL)};
const defaultParams = {...EN};

/** Slots (fractions of the diagram box): x, y, w, h. */
const SLOTS = {
  wide: {custodianA: [0, 0, 0.21, 0.4], logA: [0, 0.46, 0.25, 0.54], bag: [0.34, 0, 0.32, 0.5], chain: [0.32, 0.6, 0.15, 0.3], tag: [0.49, 0.56, 0.2, 0.4], custodianB: [0.79, 0, 0.21, 0.4], logB: [0.75, 0.46, 0.25, 0.54]},
  tall: {custodianA: [0, 0, 0.44, 0.2], logA: [0.5, 0, 0.5, 0.27], bag: [0, 0.32, 0.46, 0.3], chain: [0.5, 0.38, 0.18, 0.18], tag: [0.7, 0.34, 0.3, 0.26], custodianB: [0, 0.8, 0.44, 0.2], logB: [0.5, 0.71, 0.5, 0.29]},
};

function legendRows(ctx, P, kinds) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showKey) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'cus-a' : 'cus-b', text: `${i === 0 ? 'A' : 'B'} · ${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) kinds.forEach(k => rows.push({kind: 'item', icon: `line-${k}`, color: mechColor(ctx, k), text: P.relationLabels[k] || k, name: `lg-kind-${k}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Element art fitted to an area a (w × h). Returns {w, h, ok, node()} with local origin = centre. */
function elementArt(ctx, id, a, P, rows, F, show) {
  if (id === 'custodianA' || id === 'custodianB') {
    const key = id === 'custodianA' ? 'a' : 'b';
    const R = Math.min(a.w, a.h) * 0.46;
    return {w: R * 2, h: R * 2, ok: R >= 40, node: () => g(null, h('circle', {r: r(R * 1.04), fill: '#000', opacity: 0.12, cx: 5, cy: 7}), badge(key, R))};
  }
  if (id === 'logA' || id === 'logB') {
    const key = id === 'logA' ? 'a' : 'b';
    const rs = rows[key];
    const fs = F * 0.86;
    const head = show ? fitG(key === 'a' ? P.labels.logA : P.labels.logB, {maxWidth: a.w * 0.62, size: F, minSize: F, maxLines: 1, weight: 700}) : null;
    const texts = show ? rs.map(rw => ({fieldFit: fitG(rw.field, {maxWidth: a.w * 0.76, size: fs, minSize: fs, maxLines: 1, weight: 600}), valueFit: fitG(rw.filled ? rw.value : P.labels.blank, {maxWidth: a.w * 0.74, size: F, minSize: F, maxLines: 2, weight: 500})})) : null;
    const rowH = texts ? Math.max(...texts.map(t => t.fieldFit.height + t.valueFit.height + F * 0.75), F * 2.6) : F * 2.4;
    const headH = F * 2;
    const clipH = F * 0.9;
    const need = clipH * 0.9 + headH + F * 0.5 + rowH * Math.max(2, rs.length) + F * 0.8;
    const wNeed = texts ? Math.max(...texts.map(t => Math.max(t.fieldFit.width, t.valueFit.width + F * 0.3)), head ? head.width + F * 3.5 : 0) / 0.76 : a.w * 0.8;
    const w = Math.min(a.w, Math.max(a.w * 0.82, wNeed));
    const hh = Math.max(need, Math.min(a.h, need * 1.15));
    const ok = hh <= a.h + 0.5 && wNeed <= a.w + 0.5 && (!texts || texts.every(t => t.fieldFit.ok && t.valueFit.ok)) && (!head || head.ok);
    return {w, h: hh, ok, node: () => {
      const SM = sheetModel({x: -w / 2, y: -hh / 2, w, h: hh}, rs.length, {clipH, headH, minRows: Math.max(2, rs.length)});
      return sheetArt(ctx, SM, key, rs, {prefix: `m-${id}`, name: `m-${id}-sheet`, texts: texts || rs.map(() => null), headText: head});
    }};
  }
  if (id === 'bag') {
    const bh = Math.min(a.h, a.w / 0.86) * 0.96, bw = bh * 0.86;
    const B = bagModel(bw, bh);
    const G0 = {B, S: bh, M: objectModel(P.items[0].kind, Math.min(B.inner.w / 1.05, B.inner.h / 0.75) * 0.9), TM: tagModel({w: bw * 0.7, h: bh * 0.2, rows: 2})};
    // the tray under the bag
    return {w: bw, h: bh, ok: bh >= 120, node: () => g(null,
      h('path', {d: roundRectPath(-bw / 2 - bh * 0.06, -bh / 2 - bh * 0.05, bw + bh * 0.12, bh * 1.1, 10), fill: '#c8a272', stroke: INK, 'stroke-width': 2}),
      bagUnit(ctx, G0, 'm-bagunit', {noTag: true}).node,
    )};
  }
  if (id === 'tag') {
    const tw = Math.min(a.w * 0.96, a.h * 2.6 * 0.96), th = tw / 2.6;
    const TM = tagModel({w: tw, h: th, rows: 2});
    return {w: tw, h: th, ok: tw >= 90, node: () => g({transform: T(-tw / 2 + th * 0.3, 0)}, tagArt(ctx, TM, {prefix: 'm-tag', rows: [{filled: true, len: 0.85}, {filled: true, len: 0.55}], seedKey: 'm-tag'}))};
  }
  // chain: a sagging ball chain across the slot
  const cw = a.w * 0.9, ch = Math.min(a.h * 0.6, cw * 0.5);
  return {w: cw, h: ch, ok: cw >= 50, node: () => {
    const c = chainNode('m-chainart', {bead: Math.max(6, cw * 0.05)});
    return g(null, c);
  }, chain: {a: {x: -cw / 2, y: -ch / 2}, b: {x: cw / 2, y: -ch / 2}, sag: ch * 1.6}};
}

function compose(ctx, P, rows, lrows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const show = ctx.show('all');
  const gap = F * 1.3;
  let D, panel = null, PL = null;
  if (!lrows.length) D = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [tcPanelLayout(ctx, lrows, {w: colW, F})];
    if (cols === 2) {
      let best = null;
      for (let i = 1; i < lrows.length; i++) {
        const a = tcPanelLayout(ctx, lrows.slice(0, i), {w: colW, F}), b = tcPanelLayout(ctx, lrows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      if (best) PLs = best.cols;
    }
    const ph = Math.max(...PLs.map(q => q.h));
    PL = {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW};
    D = {x: 0, y: 0, w: DW, h: DH - ph - gap};
    panel = {x: 4, y: DH - ph};
  } else {
    const PW = DW * opt.pw;
    const one = tcPanelLayout(ctx, lrows, {w: PW, F});
    PL = {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW};
    D = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)};
  }
  const slots = SLOTS[opt.slots];
  const lab = Object.fromEntries(P.elements.map(e => [e.id, e.label]));
  const E = {};
  let ok = (!PL || PL.ok) && D.h > 200;
  for (const id of EL) {
    const [fx, fy, fw, fh] = slots[id];
    const s = {x: D.x + fx * D.w, y: D.y + fy * D.h, w: fw * D.w, h: fh * D.h};
    const lf = show && lab[id] ? fitG(lab[id], {maxWidth: Math.max(id === 'chain' ? s.w * 1.3 : s.w, 60), size: F, minSize: F, maxLines: 2, weight: 600}) : null;
    const lh = lf ? lf.height + F * 0.4 : 0;
    const area = {w: s.w * 0.96, h: Math.max(10, s.h - lh)};
    const art = elementArt(ctx, id, area, P, rows, F, show);
    if (!art.ok || (lf && !lf.ok) || area.h < 40) ok = false;
    const cx = s.x + s.w / 2;
    const cy = s.y + (s.h - lh) / 2;
    E[id] = {id, slot: s, art, c: {x: cx, y: cy}, box: {x: cx - art.w / 2, y: cy - art.h / 2, w: art.w, h: art.h}, lf, labelY: cy + art.h / 2 + F * 0.3};
  }
  const minArt = Math.min(E.bag.art.h, E.custodianA.art.h);
  return {F, D, panel, PL, E, ok, score: minArt, problems: [PL && !PL.ok && 'panel-text', !ok && 'element-fit'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const rows = tcLogs(P);
    const kinds = [...new Set(P.relationships.map(rl => rl.kind))];
    const lrows = legendRows(ctx, P, kinds);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1, slots: 'tall'}, {mode: 'below', cols: 2, slots: 'tall'}]
      : shape === 'square' ? [{mode: 'side', pw: 0.3, slots: 'tall'}, {mode: 'side', pw: 0.34, slots: 'tall'}, {mode: 'below', cols: 2, slots: 'wide'}, {mode: 'below', cols: 2, slots: 'tall'}]
        : [{mode: 'side', pw: 0.22, slots: 'wide'}, {mode: 'side', pw: 0.26, slots: 'wide'}, {mode: 'side', pw: 0.3, slots: 'wide'}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) {
      for (const opt of opts) {
        const c = compose(ctx, P, rows, lrows, F, opt);
        const score = c.score * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
        if (c.ok && score > bestScore) { best = c; bestScore = score; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
      if (best && F <= 19.5) break;
    }
    if (best) C = best;
    const E = C.E;
    // start positions: packed around the bag (the moment of the hand-off)
    const hub = E.bag.c;
    for (const id of EL) {
      const e = E[id];
      e.start = id === 'bag' ? {...e.c} : {x: lerp(e.c.x, hub.x, 0.62), y: lerp(e.c.y, hub.y, 0.62)};
    }
    // connectors anchored to element edges
    const els = new Set(P.elements.map(e => e.id));
    const rels = P.relationships.filter(rl => rl.from !== rl.to && els.has(rl.from) && els.has(rl.to));
    const conns = rels.map((rl, i) => {
      const A = E[rl.from], B = E[rl.to];
      const from = edgeAnchor(A.box, B.c, 10), to = edgeAnchor(B.box, A.c, 12);
      return {rl, c: connector(ctx, {name: `cn${i}`, from, to, kind: rl.kind, bend: 0.08 * (i % 2 ? 1 : -1), color: mechColor(ctx, rl.kind)})};
    });
    // tracer route through the traversal order (along a drawn relation when one exists)
    const order = P.traversalOrder.filter(id => els.has(id));
    const legs = [];
    for (let i = 0; i + 1 < order.length; i++) {
      const a = order[i], b = order[i + 1];
      const cn = conns.find(q => q.rl.from === a && q.rl.to === b) || conns.find(q => q.rl.from === b && q.rl.to === a);
      const pts = [];
      if (cn) {
        for (let k = 0; k <= 30; k++) pts.push(cn.c.at(k / 30));
        if (cn.rl.from !== a) pts.reverse();
      } else { pts.push(E[a].c, E[b].c); }
      legs.push({a, b, pts, along: Boolean(cn), poly: polyline(pts)});
    }
    const chainE = E.chain;
    return {P, rows, C, E, conns, legs, order, kinds, chainProps: chainE.art.chain ? chainProps('m-chainart', chainE.art.chain.a, chainE.art.chain.b, chainE.art.chain.sag) : {}};
  },
  build(ctx, L) {
    const {C, E, P} = L;
    const th = ctx.theme;
    const show = ctx.show('all');
    const lab = Object.fromEntries(P.elements.map(e => [e.id, e.label]));
    const els = EL.map(id => {
      const e = E[id];
      return g({name: `el-${id}`},
        g({name: `el-${id}-art`}, e.art.node()),
      );
    });
    const labels = show ? EL.filter(id => lab[id] && E[id].lf).map(id => g({name: `lb-${id}`, opacity: 0}, textAt(E[id].lf, {x: E[id].c.x, y: E[id].labelY, anchor: 'middle', fill: th.fg}))) : [];
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, tcPanelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      h('path', {d: roundRectPath(C.D.x, C.D.y, C.D.w, C.D.h, 22), fill: th.paper, stroke: th.paperLine || '#d8d2c4', 'stroke-width': 2}),
      g({name: 'conns'}, L.conns.map(q => q.c.node)),
      els,
      labels,
      tracer(ctx, 'tracer', th.accent),
      panels,
    );
  },
  frame(ctx, L, u) {
    const {E, C} = L;
    const nodes = {};
    const k = ease.inOutCubic(seg(u, ...W.separate));
    const sc = lerp(0.55, 1, k);
    const focusK = ease.inOutCubic(seg(u, ...W.focus)) * (1 - ease.inOutCubic(seg(u, ...W.unfocus)));
    const pos = {};
    for (const id of EL) {
      const e = E[id];
      const p = {x: lerp(e.start.x, e.c.x, k), y: lerp(e.start.y, e.c.y, k)};
      pos[id] = p;
      const s = sc * (id === L.P.focusElement ? 1 + 0.12 * focusK : 1);
      nodes[`el-${id}`] = {transform: T(p.x, p.y, 0, s)};
      nodes[`el-${id}-art`] = {transform: ''};
    }
    const labK = seg(u, ...W.labels);
    for (const id of EL) if (E[id].lf && ctx.show('all')) nodes[`lb-${id}`] = {opacity: r(labK, 3)};
    for (const key of ['logA', 'logB']) if (ctx.show('all')) nodes[`m-${key}-txt`] = {opacity: k >= 1 ? 1 : 0};
    Object.assign(nodes, L.chainProps);
    const n = L.conns.length;
    const drawn = [];
    L.conns.forEach((q, i) => {
      const a = W.draw[0] + (W.draw[1] - W.draw[0]) * (i / Math.max(1, n));
      const b = W.draw[0] + (W.draw[1] - W.draw[0]) * ((i + 0.85) / Math.max(1, n));
      const p = seg(u, a, b);
      Object.assign(nodes, q.c.frame(p, 1));
      drawn.push(r(p, 3));
    });
    // tracer
    const tk = seg(u, ...W.trace);
    let tp = null, leg = -1;
    if (L.legs.length && u >= W.trace[0] && u <= W.trace[1] + 0.03) {
      const f = Math.min(tk * L.legs.length, L.legs.length - 1e-6);
      leg = Math.floor(f);
      const lg = L.legs[leg];
      tp = lg.poly.at(f - leg);
    }
    nodes.tracer = tp ? {transform: T(tp.x, tp.y), opacity: u <= W.trace[1] ? 1 : r(1 - seg(u, W.trace[1], W.trace[1] + 0.03), 3)} : {transform: T(E.bag.c.x, E.bag.c.y), opacity: 0};
    return {
      nodes,
      semantic: {
        phase: u < W.separate[1] ? 'separate' : u < W.draw[1] ? 'relations' : u < W.trace[1] ? 'trace' : 'hold',
        separated: r(k, 3), labels: r(labK, 3), focus: r(focusK, 3), drawn,
        tracer: tp ? R2(tp) : null, leg, legs: L.legs.map(lg => [lg.a, lg.b, lg.along]),
        connectors: L.conns.map(q => ({from: q.rl.from, to: q.rl.to, kind: q.rl.kind, end: R2(q.c.to), start: R2(q.c.from), toBox: E[q.rl.to].box, fromBox: E[q.rl.from].box, arrow: q.rl.kind !== 'relation'})),
        pos: Object.fromEntries(EL.map(id => [id, R2(pos[id])])), bag: R2(pos.bag), custodianA: R2(pos.custodianA), logB: R2(pos.logB),
        rows: {a: L.rows.a.map(rw => rw.filled), b: L.rows.b.map(rw => rw.filled)},
        problems: C.problems, textPx: r(C.F, 1), bagH: r(E.bag.art.h, 1), personR: r(E.custodianA.art.h / 2, 1),
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
    slug: 'evidence-custody-03-mechanism',
    title: 'Custody transfer — a spatial plan of the hand-off: two custodians, their own record sheets and the bag passing between them',
    titleEs: 'Transferencia de custodia — Mecanismo o relación explicada',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Transferencia de custodia',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A spatial plan of a custody hand-off laid out like the room: custodian A with A\'s own record sheet, the sealed evidence bag on the counter tray with its ball chain and tag, custodian B with B\'s own record sheet. The elements move apart from the hand-off point, only the explicit relationships are drawn (plain relations without arrowheads, sequence links as configured), a tracer follows the supplied traversal order and the bag is enlarged while it runs. Sheets print their supplied rows; a blank row is only a supplied blank row. No doctrine; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'transfer', 'hand-off', 'mechanism', 'record sheet', 'relations', 'tracer', 'evidence bag', 'tag', 'chain'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/transferencia-custodia.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
