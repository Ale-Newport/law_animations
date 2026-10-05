/**
 * LAW-0366 — Embalaje de prueba · mechanism
 *
 * Storyboard (an exploded assembly drawing of the sealed evidence pouch on the evidence bench: the pouch body stays
 * where it is while its parts are pulled off the places they occupy on it — the object out of the mouth, the folded
 * flap up off the mouth, the seal strip up off the seam, the custody label off the body and the chain strip off the
 * label; each part is real art with its caption; a legend lists item, seal number, custodians, times, the relation
 * kinds in use and the key):
 *  0.00–0.18  separate: the assembled, sealed pouch comes apart; every part travels from its true place on the pouch
 *             to its own place on the bench and grows to its readable size (label rows, custodian names and the seal
 *             number print only once the part is full size).
 *  0.18–0.43  only the explicit relationships are drawn, one after another, anchored to the parts' edges; a plain
 *             relation has no arrowhead (causal arrows only when the author supplies a causal relation).
 *  0.43–0.75  a tracer follows the supplied traversal order along the drawn relations (by default the packing order:
 *             object → pouch → flap → seal → label → chain); the focus part (the seal strip) is enlarged while the
 *             tracer runs.
 *  0.75–1.00  hold: the exploded drawing stays with origin (object), transformation (pouch, flap, seal) and recorded
 *             state (label rows, chain) visible; line kinds keyed in the legend. No doctrine, no outcome.
 * @module animations/evidence-custody/LAW-0366
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {edgeAnchor, roundRectPath, polyline} from '../../core/geometry.js';
import {connector, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {
  ecFields, localised, benchNode, panelLayout, R2, fitG, textAt, objectModel, objectArt, overlaps, scribble, INK, BAG_EDGE, WRITE_INK,
} from './kits/evidence-art.js';
import {
  EP_EN, EP_ES, epFields, epRecords, epRecordLine, pouchModel, pouchBack, flapOutline, stripModel, stripArt, numberFit,
  epPanelNode, FLAP,
} from './kits/embalaje-prueba.js';

const ID = 'LAW-0366';
const DURATION = 7500;
const EL = ['object', 'bag', 'flap', 'seal', 'label', 'chain'];
const W = {separate: [0.03, 0.17], labels: [0.17, 0.21], draw: [0.18, 0.43], trace: [0.43, 0.75], focus: [0.43, 0.49], unfocus: [0.75, 0.8]};
const mechColor = (ctx, k) => ({relation: ctx.theme.accent3, communication: '#7fb0d8', sequence: '#e58e73', causal: ctx.theme.accent}[k] || ctx.theme.accent3);
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {en: {}, es: {}};

const OWN_EN = {
  elements: [
    {id: 'object', label: 'Object (fictional)'}, {id: 'bag', label: 'Evidence pouch'}, {id: 'flap', label: 'Fold-over flap'},
    {id: 'seal', label: 'Seal strip with number'}, {id: 'label', label: 'Custody label rows'}, {id: 'chain', label: 'Chain strip (custodians)'},
  ],
  relationships: [
    {from: 'object', to: 'bag', kind: 'relation'}, {from: 'bag', to: 'flap', kind: 'relation'}, {from: 'flap', to: 'seal', kind: 'relation'},
    {from: 'bag', to: 'label', kind: 'relation'}, {from: 'label', to: 'chain', kind: 'relation'},
  ],
  focusElement: 'seal',
  relationLabels: {relation: 'linked (as supplied)', communication: 'communicates (as supplied)', sequence: 'then (sequence as configured)', causal: 'causes (supplied)'},
  traversalOrder: ['object', 'bag', 'flap', 'seal', 'label', 'chain'],
};
const OWN_ES = {
  elements: [
    {id: 'object', label: 'Objeto (ficticio)'}, {id: 'bag', label: 'Bolsa de pruebas'}, {id: 'flap', label: 'Solapa plegable'},
    {id: 'seal', label: 'Precinto con número'}, {id: 'label', label: 'Filas de la etiqueta'}, {id: 'chain', label: 'Cadena (custodios)'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'seal',
  relationLabels: {relation: 'unidos (según lo aportado)', communication: 'comunica (según lo aportado)', sequence: 'después (secuencia configurada)', causal: 'causa (aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...EP_EN, ...OWN_EN};
const ES = {...EP_ES, ...OWN_ES};

const sceneSchema = {...ecFields, ...epFields, ...mechanismFields(EL)};
const defaultParams = {...EN};

/** Slots (fractions of the mat): x, y, w, h. Wide: object | flap over pouch | seal, label, chain. Tall: stacked. */
const SLOTS = {
  wide: {object: [0, 0.22, 0.2, 0.56], flap: [0.22, 0, 0.36, 0.24], bag: [0.22, 0.26, 0.36, 0.74], seal: [0.6, 0, 0.4, 0.25], label: [0.6, 0.27, 0.4, 0.43], chain: [0.6, 0.72, 0.4, 0.28]},
  tall: {seal: [0, 0, 1, 0.13], flap: [0.12, 0.14, 0.76, 0.13], object: [0, 0.29, 0.34, 0.33], bag: [0.36, 0.29, 0.64, 0.4], label: [0, 0.71, 0.58, 0.29], chain: [0.6, 0.71, 0.4, 0.29]},
  // tall, with the label and the chain strip in full-width rows (long rows and names)
  tall2: {seal: [0, 0, 0.62, 0.15], flap: [0.64, 0, 0.36, 0.15], object: [0, 0.17, 0.3, 0.36], bag: [0.32, 0.17, 0.4, 0.42], label: [0, 0.61, 1, 0.24], chain: [0, 0.86, 1, 0.14]},
};

function legendRows(ctx, P, kinds) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showKey) rows.push({kind: 'item', icon: 'ep-seal', text: `${P.labels.seal}: ${P.sealNumber}`, name: 'lg-seal-no'});
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) kinds.forEach(k => rows.push({kind: 'item', icon: `line-${k}`, color: mechColor(ctx, k), text: P.relationLabels[k] || k, name: `lg-kind-${k}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Element art for an area a (w × h): {w, h, ok, node(), text?} with local origin = centre. `asm` = its size on the assembled pouch. */
function elementArt(ctx, id, a, P, recs, F, show, vs) {
  if (id === 'object') {
    const M1 = objectModel(P.items[0].kind, 1);
    const S = Math.min(a.w / M1.w, a.h / M1.h) * 0.92;
    const M = objectModel(P.items[0].kind, S);
    return {w: M.w, h: M.h, S, node: () => objectArt(ctx, M)};
  }
  if (id === 'bag') {
    const s = Math.min(a.w / 1.9, a.h / 2.1) * 0.96;
    const PM = pouchModel(s, {rows: recs.length, chainN: P.custodians.length});
    return {w: PM.w, h: PM.h, PM, node: () => g({transform: T(-PM.w / 2, -PM.h / 2)},
      pouchBack(ctx, PM, {}),
      h('path', {d: `M${r(PM.w * 0.86)} ${r(s * 0.62)}L${r(PM.w * 0.8)} ${r(s * 1.2)}`, stroke: '#fff', 'stroke-width': r(Math.max(6, s * 0.05)), 'stroke-linecap': 'round', opacity: 0.5}),
      h('path', {d: roundRectPath(PM.label.x, PM.label.y, PM.label.w, PM.label.h, 8), fill: 'none', stroke: BAG_EDGE, 'stroke-width': 1.5, opacity: 0.45}),
      h('path', {d: `M${r(PM.w * 0.04)} ${r(s * 0.03)}H${r(PM.w * 0.96)}`, stroke: INK, 'stroke-width': 2.5}),
    )};
  }
  if (id === 'flap') {
    const w = Math.min(a.w * 0.96, a.h * 0.96 * 3.8);
    const fh = w * 0.5 / 1.9;
    const S = w / 1.9;
    return {w, h: fh, node: () => g({transform: T(0, -fh / 2)},
      h('path', {d: flapOutline(w, fh, -1), fill: FLAP, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-w * 0.44)} ${r(fh * 0.24)}h${r(w * 0.12)}M${r(-w * 0.44)} ${r(fh * 0.5)}h${r(w * 0.12)}`, stroke: '#7d8a94', 'stroke-width': r(Math.max(2.5, S * 0.02), 2), 'stroke-linecap': 'round'}),
      h('path', {d: scribble(ctx, 'ep-mech-by', -w * 0.26, w * 0.12, fh * 0.24, S * 0.045), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2, 'stroke-linecap': 'round'}),
      h('path', {d: scribble(ctx, 'ep-mech-st', -w * 0.26, w * 0.02, fh * 0.5, S * 0.045), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2, 'stroke-linecap': 'round'}),
    )};
  }
  if (id === 'seal') {
    const len = Math.min(a.w * 0.96, a.h * 0.9 * 2.16 / 0.26);
    const S = len / 2.16;
    const SM = stripModel(len, S * 0.26, S);
    const nf = show ? numberFit(ctx, SM, P.sealNumber, F, vs) : null;
    return {w: len, h: SM.h, SM, nf, node: () => stripArt(ctx, SM, {name: 'ms', numberFit: nf, barSeed: P.sealNumber})};
  }
  if (id === 'label') {
    const padX = F * 0.55, head = F * 0.9;
    const lines = recs.map(rw => epRecordLine(rw, P.labels.blank));
    const fits = show ? lines.map(t => fitG(t, {maxWidth: a.w * 0.96 - padX * 2, size: F, minSize: F, maxLines: 2, weight: 500})) : null;
    const rowH = show ? fits.map(f => f.height + F * 0.35) : recs.map(() => F * 1.2);
    const hh = head + F * 0.4 + rowH.reduce((s, v) => s + v, 0) + F * 0.2;
    const w = show ? Math.min(a.w * 0.96, Math.max(a.w * 0.6, ...fits.map(f => f.width + padX * 2))) : a.w * 0.8;
    const ok = (!fits || fits.every(f => f.ok)) && hh <= a.h + 0.5;
    return {w, h: hh, ok, node: () => {
      const parts = [
        h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 8), fill: '#fbfaf6', stroke: BAG_EDGE, 'stroke-width': 2.2}),
        h('path', {d: roundRectPath(-w / 2, -hh / 2, w, head, 8), fill: '#c7d5df'}),
        h('path', {d: `M${r(-w / 2 + padX)} ${r(-hh / 2 + head / 2)}h${r(w * 0.3)}`, stroke: '#51677a', 'stroke-width': 4, 'stroke-linecap': 'round'}),
      ];
      const txt = [];
      let y = -hh / 2 + head + F * 0.4;
      recs.forEach((rw, i) => {
        if (show) txt.push(textAt(fits[i], {x: -w / 2 + padX, y, fill: rw.filled ? WRITE_INK : '#6b5a3a'}));
        else parts.push(h('path', {d: `M${r(-w / 2 + padX)} ${r(y + F * 0.5)}h${r((w - padX * 2) * (rw.filled ? 0.8 : 0.35))}`, stroke: rw.filled ? WRITE_INK : '#b9c2c8', 'stroke-width': 3, 'stroke-linecap': 'round'}));
        y += rowH[i];
      });
      return g(null, parts, show ? g({name: 'mlabel-text', opacity: 0}, txt) : null);
    }};
  }
  // chain: one signed box per custodian joined by links; names printed (row when wide enough, else a column)
  const n = P.custodians.length;
  const pad = F * 0.45, link = F * 1.4;
  const tryLayout = row => {
    const bw = row ? (a.w * 0.96 - link * (n - 1)) / n : a.w * 0.9;
    const fits = show ? P.custodians.map(c => fitG(c.name, {maxWidth: bw - pad * 2, size: F, minSize: F, maxLines: 3, weight: 600})) : null;
    const bh = Math.max(...(fits ? fits.map(f => f.height) : [F])) + pad * 2 + F * 0.9;
    const w = row ? bw * n + link * (n - 1) : bw;
    const hh = row ? bh : bh * n + link * (n - 1);
    return {row, bw, bh, w, h: hh, fits, ok: (!fits || fits.every(f => f.ok)) && hh <= a.h + 0.5 && bw > F * 3};
  };
  let Lc = tryLayout(true);
  if (!Lc.ok) { const c2 = tryLayout(false); if (c2.ok) Lc = c2; }
  return {w: Lc.w, h: Lc.h, ok: Lc.ok, node: () => {
    const parts = [], txt = [];
    for (let i = 0; i < n; i++) {
      const bx = Lc.row ? -Lc.w / 2 + i * (Lc.bw + link) : -Lc.w / 2;
      const by = Lc.row ? -Lc.h / 2 : -Lc.h / 2 + i * (Lc.bh + link);
      parts.push(h('path', {d: roundRectPath(bx, by, Lc.bw, Lc.bh, 6), fill: '#eef2f4', stroke: '#7d8a94', 'stroke-width': 2}));
      parts.push(h('path', {d: scribble(ctx, `ep-mech-sig${i}`, bx + pad, bx + Lc.bw * 0.7, by + Lc.bh - pad - F * 0.2, F * 0.35), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2, 'stroke-linecap': 'round'}));
      if (show) txt.push(textAt(Lc.fits[i], {x: bx + pad, y: by + pad, fill: INK}));
      if (i > 0) {
        const lx = Lc.row ? bx - link / 2 : 0, ly = Lc.row ? by + Lc.bh / 2 : by - link / 2;
        const ox = Lc.row ? link * 0.2 : 0, oy = Lc.row ? 0 : link * 0.2;
        const rx = Lc.row ? link * 0.34 : F * 0.22, ry = Lc.row ? F * 0.22 : link * 0.34;
        parts.push(h('ellipse', {cx: r(lx - ox), cy: r(ly - oy), rx: r(rx), ry: r(ry), fill: 'none', stroke: '#5d656c', 'stroke-width': 3}));
        parts.push(h('ellipse', {cx: r(lx + ox), cy: r(ly + oy), rx: r(rx), ry: r(ry), fill: 'none', stroke: '#5d656c', 'stroke-width': 3}));
      }
    }
    return g(null, parts, show ? g({name: 'mchain-text', opacity: 0}, txt) : null);
  }};
}

function compose(ctx, P, recs, F, opt, vs) {
  const {w: DW, h: DH} = ctx.design;
  const kinds = [...new Set(P.relationships.map(rl => rl.kind))];
  const rows = legendRows(ctx, P, kinds);
  const showKey = ctx.show('key');
  const gap = F * 1.3;
  let bench, panel = null, PL = null;
  if (!rows.length) bench = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
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
  const mat = {x: bench.x + inset * 1.4, y: bench.y + inset * 1.4, w: bench.w - inset * 2.8, h: bench.h - inset * 2.8};
  const grid = SLOTS[opt.grid || (mat.w / mat.h > 1.2 ? 'wide' : 'tall')];
  const labelOf = id => (P.elements.find(e => e.id === id) || {}).label;
  const els = {};
  let ok = !PL || PL.ok;
  for (const id of EL) {
    const [fx, fy, fw, fh] = grid[id];
    const cell = {x: mat.x + fx * mat.w, y: mat.y + fy * mat.h, w: fw * mat.w, h: fh * mat.h};
    const lab = labelOf(id);
    const lf = lab && showKey ? fitG(lab, {maxWidth: cell.w * 0.96, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
    if (lf && !lf.ok) ok = false;
    const labH = lf ? lf.height + F * 0.5 : 0;
    const area = {w: cell.w * 0.96, h: Math.max(10, cell.h - labH - F * 0.3)};
    const art = elementArt(ctx, id, area, P, recs, F, showKey, vs);
    if (art.ok === false) ok = false;
    const c = {x: cell.x + cell.w / 2, y: cell.y + (cell.h - labH) / 2};
    const E = {id, cell, c, art, lf, label: lab, box: {x: c.x - art.w / 2, y: c.y - art.h / 2, w: art.w, h: art.h}, present: Boolean(lab)};
    const lw = lf ? lf.width : 0;
    E.hit = {x: Math.min(E.box.x, c.x - lw / 2), y: E.box.y, w: Math.max(E.box.w, lw), h: E.box.h + (lf ? F * 0.4 + lf.height : 0)};
    els[id] = E;
  }
  const minArt = Math.min(els.object.art.w, els.bag.art.h * 0.5, els.seal.art.w * 0.4, els.flap.art.w * 0.4);
  return {F, bench, mat, panel, PL, els, kinds, ok: ok && minArt > 70, minArt,
    problems: [PL && !PL.ok && 'panel-text', !ok && 'element-text', minArt <= 70 && 'art-small'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = epRecords(P);
    const shape = ctx.view.shape;
    const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'below', cols: 2}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.34}]
        : [{mode: 'side', pw: 0.22}, {mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.3}];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const o0 of opts) for (const gr of [null, 'tall2']) {
        if (gr && shape === 'landscape') continue;
        const opt = {...o0, grid: gr};
        const c = compose(ctx, P, recs, F, opt, vs);
        const score = c.minArt * Math.sqrt(F / 24) * (F < 19.5 ? 0.7 : 1);
        if (c.ok && firstOk < 0) firstOk = fi;
        if (c.ok && score > bestScore) { best = c; bestScore = score; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    if (best) C = best;
    const E = C.els;
    // assembled start: each part on its true place on the pouch body, at the pouch's scale
    const B = E.bag, PM = B.art.PM, s = PM.S;
    const bx = B.c.x - PM.w / 2, by = B.c.y - PM.h / 2;
    const fit1 = (wNeed, hNeed, art) => Math.min(wNeed / art.w, hNeed / art.h);
    const start = {
      bag: {x: B.c.x, y: B.c.y, s: 1},
      object: {x: bx + PM.inner.x + PM.inner.w / 2, y: by + PM.inner.y + PM.inner.h / 2, s: (s * 1.04) / E.object.art.S},
      flap: {x: B.c.x, y: by + PM.fh / 2, s: PM.w / E.flap.art.w},
      seal: {x: B.c.x, y: by + PM.fh, s: (PM.w + s * 0.26) / E.seal.art.w},
      label: {x: bx + PM.label.x + PM.label.w / 2, y: by + PM.label.y + PM.label.h * 0.4, s: fit1(PM.label.w, PM.label.h * 0.7, E.label.art)},
      chain: {x: bx + PM.label.x + PM.label.w / 2, y: by + PM.label.y + PM.label.h * 0.82, s: fit1(PM.label.w * 0.9, PM.label.h * 0.24, E.chain.art)},
    };
    const rels = P.relationships.filter(rl => rl.from !== rl.to && E[rl.from] && E[rl.to]);
    const conns = rels.map((rl, i) => {
      const A = E[rl.from], Bb = E[rl.to];
      const from = edgeAnchor(A.hit, Bb.c, 10);
      const to = edgeAnchor(Bb.hit, A.c, rl.kind === 'relation' ? 10 : 16);
      return {rel: rl, c: connector(ctx, {name: `c${i}`, from, to, kind: rl.kind, bend: 0.1, color: mechColor(ctx, rl.kind)})};
    });
    const order = P.traversalOrder.filter(id => E[id]);
    const legs = [];
    for (let i = 0; i + 1 < order.length; i++) {
      const a = order[i], b = order[i + 1];
      const cn = conns.find(q => (q.rel.from === a && q.rel.to === b) || (q.rel.from === b && q.rel.to === a));
      const pts = [E[a].c];
      if (cn) for (let k = 0; k <= 24; k++) pts.push(cn.rel.from === a ? cn.c.at(k / 24) : cn.c.at(1 - k / 24));
      pts.push(E[b].c);
      const pl = polyline(pts.map(q => ({x: q.x, y: q.y})));
      legs.push({a, b, fn: t => pl.at(t), along: Boolean(cn)});
    }
    return {P, recs, C, start, conns, order, legs};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const order = ['bag', 'object', 'label', 'chain', 'flap', 'seal'];
    const els = order.map(id => {
      const E = C.els[id];
      return g({name: `el-${id}`},
        g({name: `el-${id}-art`}, E.art.node()),
        E.lf ? g({name: `el-${id}-lab`, opacity: 0}, textAt(E.lf, {x: 0, y: E.art.h / 2 + C.F * 0.4, anchor: 'middle', fill: '#f4f1ea'})) : null,
      );
    });
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, epPanelNode(ctx, PLc))) : [];
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
    const kF = ease.inOutCubic(seg(u, ...W.focus)) * (1 - ease.inOutCubic(seg(u, ...W.unfocus)));
    const pos = {};
    const full = kSep >= 0.999;
    for (const id of EL) {
      const E = C.els[id], S0 = L.start[id];
      const x = lerp(S0.x, E.c.x, kSep), y = lerp(S0.y, E.c.y, kSep);
      const sc = lerp(S0.s, 1, kSep) * (id === P.focusElement ? 1 + 0.16 * kF : 1);
      pos[id] = {x, y, s: sc};
      nodes[`el-${id}`] = {transform: T(x, y)};
      nodes[`el-${id}-art`] = {transform: T(0, 0, 0, sc)};
      if (E.lf) nodes[`el-${id}-lab`] = {opacity: r(seg(u, ...W.labels), 3), transform: T(0, (sc - 1) * E.art.h / 2)};
    }
    // printed text on the parts shows only at full size (never below the text floor while they grow)
    if (ctx.show('key')) {
      nodes['mlabel-text'] = {opacity: full ? 1 : 0};
      nodes['mchain-text'] = {opacity: full ? 1 : 0};
      if (C.els.seal.art.nf) nodes['ms-num'] = {opacity: full ? 1 : 0};
    }
    const n = L.conns.length;
    L.conns.forEach((q, i) => {
      const a = W.draw[0] + ((W.draw[1] - W.draw[0]) / n) * i;
      const b = a + ((W.draw[1] - W.draw[0]) / n) * 0.85;
      Object.assign(nodes, q.c.frame(ease.inOutCubic(seg(u, a, b))));
    });
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
    const sem = {phase, tracer: R2(tp), tracerAt: at, leg: legIdx, focus: P.focusElement, focusScale: r(1 + 0.16 * kF, 3), separated: r(kSep, 3),
      connectors: conEnds, order: L.order, problems: C.problems, textPx: r(C.F, 1), minArt: r(C.minArt, 1), printed: full,
      arrows: L.conns.filter(q => LINK_STYLES[q.rel.kind].arrow).map(q => q.rel.kind)};
    for (const id of EL) { sem[`p_${id}`] = R2(pos[id]); sem[`s_${id}`] = r(pos[id].s, 3); }
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'evidence-custody-02-mechanism',
    title: 'Evidence packing — exploded drawing of a sealed pouch: object, pouch, flap, seal strip, custody label and chain strip come off their places; only supplied relations are drawn and a tracer follows them',
    titleEs: 'Embalaje de prueba — Mecanismo o relación explicada',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Embalaje de prueba',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded assembly drawing on the evidence bench. The sealed pouch comes apart: the object leaves the mouth, the folded flap lifts off, the numbered seal strip lifts off the seam, the custody label (supplied rows printed) and the chain strip (custodian names) come off the body — each from its true place on the pouch to its own place. Only the supplied relationships are drawn, anchored to the parts\' edges (plain relations without arrowheads; causal only when supplied); a tracer follows the supplied order and the focus part is enlarged. No doctrine and no outcome; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'packing', 'seal', 'mechanism', 'exploded view', 'relations', 'tracer', 'pouch', 'label', 'chain of custody'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/embalaje-prueba.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
