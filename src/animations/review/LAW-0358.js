/**
 * LAW-0358 — Cierre de itinerario · mechanism
 *
 * Storyboard (no desk, no hands; the parts of the case file's route map as an exploded view): the starting
 * resolution, the end card of each supplied route, the filter clip and the calendar (a fixture only).
 *  0.00–0.18  separate: the parts lie packed inside the open file's outline; the outline fades and the parts move apart
 *             into a fan — the starting resolution on one side, the end cards in a column (a row on tall frames), the
 *             filter clip beyond them, the calendar in a corner.
 *  0.18–0.43  relate: only the supplied relationships are drawn, each anchored to the edges of its two parts, in the
 *             style of its kind — a plain relation has dots at both ends and no arrowhead (nothing is causal unless the
 *             author supplies it).
 *  0.43–0.75  trace: a marker follows the supplied traversal order part to part; the focus part (default: the filter
 *             clip) is enlarged while the marker is on it.
 *  0.75–1.00  gather: the parts close in a little (the connectors follow), each end card shows the state it was
 *             supplied with (● route concluded, ◆ way pending a check) and the key "as supplied · no conclusion
 *             drawn" stays. No finality doctrine; nothing says whether a route is closed or available.
 * @module animations/review/LAW-0358
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  ciiFields, CII_EN, CII_ES, localisedCi, originModel, originNode, endModel, endNode, filterClip, calendarArt, panelLayout,
  panelNode, overlaps, R2, INK, SLATE, MANILA, trackDims,
} from './kits/cierre-de-itinerario.js';
import {linkColor} from './kits/confirmacion-ilustrativa.js';

const ID = 'LAW-0358';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {apart: [0.03, 0.17], outline: [0.03, 0.12], relate: [0.19, 0.42], trace: [0.44, 0.74], gather: [0.76, 0.82], badges: [0.78, 0.84], state: [0.8, 0.85]};
const IDS = ['origin', 'end1', 'end2', 'end3', 'filter', 'calendar'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const SIZES = [30, 28, 27, 26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const GATHER = 0.97;

const STRINGS = {
  en: {state: 'Origin, routes and the state each was supplied with; nothing else is concluded'},
  es: {state: 'Origen, rutas y el estado con que se aportó cada una; no se concluye nada más'},
};

const OWN_EN = {
  elements: [
    {id: 'origin', label: 'Starting resolution (as supplied)'},
    {id: 'end1', label: 'End card of route 1'},
    {id: 'end2', label: 'End card of route 2'},
    {id: 'end3', label: 'End card of route 3'},
    {id: 'filter', label: 'Filter clip: marks a way pending a check'},
    {id: 'calendar', label: 'Calendar (a fixture; no date marked)'},
  ],
  relationships: [
    {from: 'origin', to: 'end1', kind: 'relation'},
    {from: 'origin', to: 'end2', kind: 'relation'},
    {from: 'origin', to: 'end3', kind: 'relation'},
    {from: 'end2', to: 'filter', kind: 'relation'},
    {from: 'end3', to: 'filter', kind: 'relation'},
  ],
  focusElement: 'filter',
  relationLabels: {relation: 'Linked as supplied (no direction)', communication: 'Communication as supplied', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link as supplied'},
  traversalOrder: ['origin', 'end1', 'origin', 'end2', 'filter', 'end3'],
  stateCaption: '',
};
const OWN_ES = {
  elements: [
    {id: 'origin', label: 'Resolución de partida (según lo aportado)'},
    {id: 'end1', label: 'Tarjeta final de la ruta 1'},
    {id: 'end2', label: 'Tarjeta final de la ruta 2'},
    {id: 'end3', label: 'Tarjeta final de la ruta 3'},
    {id: 'filter', label: 'Pinza filtro: marca una vía pendiente de comprobar'},
    {id: 'calendar', label: 'Calendario (elemento fijo; sin fechas marcadas)'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'filter',
  relationLabels: {relation: 'Vinculados según lo aportado (sin dirección)', communication: 'Comunicación según lo aportado', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal según lo aportado'},
  traversalOrder: OWN_EN.traversalOrder,
  stateCaption: '',
};
const EN = {...CII_EN, ...OWN_EN};
const ES = {...CII_ES, ...OWN_ES};

const sceneSchema = {
  ...ciiFields,
  elements: list('Parts of the exploded view; ids are fixed by the scene, labels are editable (a part left out is not drawn; an end card exists only for a supplied route)', obj('Part', {
    id: oneOf('Part id', IDS),
    label: str('Visible label (legend)', 70),
  }, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships between parts; the kind sets the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source part id', IDS),
    to: oneOf('Target part id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Part enlarged while the marker passes', IDS),
  relationLabels: obj('Caption used for each relation kind (legend)', {
    relation: str('Caption for plain relations', 60),
    communication: str('Caption for communications', 60),
    sequence: str('Caption for sequence links', 60),
    causal: str('Caption for supplied causal links', 60),
  }, ['relation', 'communication', 'sequence', 'causal']),
  traversalOrder: list('Order in which the marker visits the parts', oneOf('Part id', IDS), 2, 8),
  stateCaption: str('Caption of the gathered state (empty: the built-in caption)', 110),
};

const defaultParams = {...EN};

const ICON = {origin: 'origin', end1: 'end', end2: 'end', end3: 'end', filter: 'filter', calendar: 'calendar'};

/** Resolved parts (end cards only for supplied routes), relationships and the visiting order. */
function resolve(P) {
  const nR = P.routes.length;
  const exists = id => !/^end\d$/.test(id) || Number(id.slice(3)) <= nR;
  const shown = new Set(P.elements.map(e => e.id).filter(exists));
  const label = Object.fromEntries(P.elements.map(e => [e.id, e.label]));
  const rels = [];
  for (const q of P.relationships) {
    if (q.from === q.to || !shown.has(q.from) || !shown.has(q.to)) continue;
    if (rels.some(x => (x.from === q.from && x.to === q.to) || (x.from === q.to && x.to === q.from))) continue;
    rels.push({...q});
  }
  const order = [];
  for (const id of P.traversalOrder) if (shown.has(id) && order[order.length - 1] !== id) order.push(id);
  if (order.length < 2) for (const id of IDS) if (shown.has(id) && !order.includes(id)) order.push(id);
  const kinds = KINDS.filter(k => rels.some(q => q.kind === k));
  return {shown, label, rels, order, kinds, focus: shown.has(P.focusElement) ? P.focusElement : null};
}

/** Edge anchor of a box towards a point (pad outside the box). */
function anchor(b, toward, pad = 7) {
  const c = {x: b.x + b.w / 2, y: b.y + b.h / 2};
  const dx = toward.x - c.x, dy = toward.y - c.y;
  const sx = dx ? (b.w / 2 + pad) / Math.abs(dx) : Infinity, sy = dy ? (b.h / 2 + pad) / Math.abs(dy) : Infinity;
  const k = Math.min(sx, sy);
  return {x: c.x + dx * k, y: c.y + dy * k};
}

function compose(ctx, P, R, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const rows = [];
  if (showKey) for (const id of IDS) if (R.shown.has(id)) rows.push({kind: 'item', icon: ICON[id], text: R.label[id], name: `lg-${id}`});
  if (showKey) for (const k of R.kinds) rows.push({kind: 'item', icon: `kind-${k}`, text: P.relationLabels[k], name: `lg-kind-${k}`});
  if (showKey) rows.push({kind: 'item', icon: 'concluded', text: P.outcomes.concluded, name: 'lg-concluded'});
  if (showKey) rows.push({kind: 'item', icon: 'pending', text: P.outcomes.pending, name: 'lg-pending'});
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t.state, name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gapP = F * 1.4;
  let box, panel = null, PL = null;
  if (!rows.length) box = {x: 0, y: 0, w: DW, h: DH};
  else if (opts.band) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols || 1, tight: opts.tight});
    box = {x: 0, y: 0, w: DW, h: DH - PL.h - gapP - F * 0.4};
    panel = {x: 4, y: DH - PL.h - F * 0.4};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F});
    box = {x: 0, y: 0, w: DW - PW - gapP, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  if (box.h < F * 8) return {F, ok: false, problems: ['box-height']};
  const m = Math.max(10, F * 0.5);
  const inner = {x: box.x + m, y: box.y + m, w: box.w - 2 * m, h: box.h - 2 * m};
  const ends = P.routes.map((rt, i) => `end${i + 1}`).filter(id => R.shown.has(id));
  const nE = ends.length;
  const orient = opts.orient;
  const D = trackDims(F);
  const fw = Math.max(F * 6.4, D.across * 2.2), fh = Math.max(F * 5, D.along * 3.2);
  const calW = F * 4.6, calH = F * 4.2;
  let OM, EM, sz = {}, pos = {};
  const has = id => R.shown.has(id);
  if (orient === 'h') {
    // columns: [calendar over origin] · gap · [end cards] · gap · [filter]
    const g1 = Math.max(F * 6, inner.w * 0.1), g2 = Math.max(F * 4.8, inner.w * 0.08);
    const avail = inner.w - g1 - (has('filter') || has('calendar') ? g2 + Math.max(has('filter') ? fw : 0, has('calendar') ? calW : 0) : 0);
    const ow = Math.min(F * 19, avail * 0.48), ew = Math.min(F * 20, avail - ow);
    if (ew < F * 8 || ow < F * 8) return {F, ok: false, problems: ['width']};
    OM = originModel(P, {w: ow, F, showText: showKey});
    EM = endModel(P, {w: ew, F, showText: showKey});
    const colH = nE * EM.h + Math.max(0, nE - 1) * F * 0.9;
    const rightH = (has('filter') ? fh : 0) + (has('calendar') ? calH + F * 1.2 : 0);
    const need = Math.max(colH, has('origin') ? OM.h : 0, rightH);
    if (need > inner.h + 0.5) return {F, ok: false, problems: ['height'], need};
    const vg = nE > 1 ? Math.min(F * 3, F * 0.9 + (inner.h - colH) / (nE - 1)) : 0;
    const colH2 = nE * EM.h + Math.max(0, nE - 1) * vg;
    const rw = Math.max(has('filter') ? fw : 0, has('calendar') ? calW : 0);
    const usedW = (has('origin') ? ow + g1 : 0) + ew + (rw ? g2 + rw : 0);
    const x0 = inner.x + (inner.w - usedW) / 2;
    const xE = x0 + (has('origin') ? ow + g1 : 0);
    const yE = inner.y + (inner.h - colH2) / 2;
    ends.forEach((id, i) => { pos[id] = {x: xE, y: yE + i * (EM.h + vg)}; sz[id] = {w: ew, h: EM.h}; });
    const cy = inner.y + inner.h / 2;
    if (has('origin')) { pos.origin = {x: x0, y: cy - OM.h / 2}; sz.origin = {w: ow, h: OM.h}; }
    // the right column: the filter clip level with the pending cards, the calendar at the other end of the column
    const xR = xE + ew + g2;
    let fy = cy;
    if (has('filter')) {
      const pendIdx = ends.filter(id => P.routes[Number(id.slice(3)) - 1].state === 'pending');
      const ys = (pendIdx.length ? pendIdx : ends).map(id => pos[id].y + EM.h / 2);
      fy = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : cy;
      const lo = inner.y + (has('calendar') && fy < cy ? 0 : has('calendar') ? calH + F * 1.2 : 0);
      const hi = inner.y + inner.h - fh - (has('calendar') && fy < cy ? calH + F * 1.2 : 0);
      pos.filter = {x: xR + (rw - fw) / 2, y: clamp(fy - fh / 2, lo, Math.max(lo, hi))};
      sz.filter = {w: fw, h: fh};
    }
    if (has('calendar')) { pos.calendar = {x: xR + (rw - calW) / 2, y: has('filter') && fy >= cy ? inner.y : inner.y + inner.h - calH}; sz.calendar = {w: calW, h: calH}; }
  } else {
    // rows: [calendar · origin] · gap · [end cards in a row] · gap · [filter]
    const gx = Math.max(F * 0.9, 14);
    const ew = Math.min(F * 15, (inner.w - (nE - 1) * gx) / Math.max(1, nE));
    const ow = Math.min(F * 17, inner.w - 2 * (calW + F * 1.2));
    if (ew < F * 7 || ow < F * 8) return {F, ok: false, problems: ['width']};
    OM = originModel(P, {w: ow, F, showText: showKey});
    EM = endModel(P, {w: ew, F, showText: showKey});
    const topH = Math.max(has('origin') ? OM.h : 0, has('calendar') ? calH : 0);
    const base = topH + EM.h + (has('filter') ? fh : 0);
    const nGaps = has('filter') ? 2 : 1;
    const minG = F * 3.6;
    if (base + nGaps * minG > inner.h + 0.5) return {F, ok: false, problems: ['height']};
    const gv = Math.min(F * 9, (inner.h - base) / nGaps);
    const used = base + nGaps * gv;
    const y0 = inner.y + (inner.h - used) / 2;
    const cx = inner.x + inner.w / 2;
    if (has('origin')) { pos.origin = {x: cx - ow / 2, y: y0 + (topH - OM.h) / 2}; sz.origin = {w: ow, h: OM.h}; }
    if (has('calendar')) { pos.calendar = {x: has('origin') ? cx - ow / 2 - F * 1.2 - calW : cx - calW / 2, y: y0 + (topH - calH) / 2}; sz.calendar = {w: calW, h: calH}; }
    const rowW = nE * ew + (nE - 1) * gx;
    ends.forEach((id, i) => { pos[id] = {x: cx - rowW / 2 + i * (ew + gx), y: y0 + topH + gv}; sz[id] = {w: ew, h: EM.h}; });
    if (has('filter')) {
      const pendIdx = ends.filter(id => P.routes[Number(id.slice(3)) - 1].state === 'pending');
      const xs = (pendIdx.length ? pendIdx : ends).map(id => pos[id].x + ew / 2);
      const fx = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : cx;
      pos.filter = {x: clamp(fx - fw / 2, inner.x, inner.x + inner.w - fw), y: y0 + topH + gv + EM.h + gv};
      sz.filter = {w: fw, h: fh};
    }
  }
  // packed start: the parts contracted towards their common centre until just before they would touch
  const ids = IDS.filter(id => pos[id]);
  // (along the main axis only: across it the parts keep their spacing)
  const kx = k => (orient === 'h' ? k : 1), ky = k => (orient === 'h' ? 1 : k);
  const bx = (k, id, c) => ({x: c.x + (pos[id].x + sz[id].w / 2 - c.x) * kx(k) - sz[id].w / 2, y: c.y + (pos[id].y + sz[id].h / 2 - c.y) * ky(k) - sz[id].h / 2, w: sz[id].w, h: sz[id].h});
  const all = ids.map(id => ({...pos[id], ...sz[id]}));
  const cen = {x: (Math.min(...all.map(b => b.x)) + Math.max(...all.map(b => b.x + b.w))) / 2, y: (Math.min(...all.map(b => b.y)) + Math.max(...all.map(b => b.y + b.h))) / 2};
  let k0 = 1;
  for (let k = 0.5; k <= 1.001; k += 0.05) {
    const bs = ids.map(id => bx(k, id, cen));
    let clear = true;
    for (let a = 0; a < bs.length && clear; a++) for (let b = a + 1; b < bs.length; b++) if (overlaps(bs[a], bs[b], F * 0.5)) { clear = false; break; }
    if (clear) { k0 = k; break; }
  }
  const start = Object.fromEntries(ids.map(id => [id, bx(k0, id, cen)]));
  const gath = Object.fromEntries(ids.map(id => [id, bx(GATHER, id, cen)]));
  // (the gathered state must keep the parts apart too)
  const sb = ids.map(id => start[id]);
  const outline = {x: Math.min(...sb.map(b => b.x)) - F * 0.8, y: Math.min(...sb.map(b => b.y)) - F * 0.8};
  outline.w = Math.max(...sb.map(b => b.x + b.w)) + F * 0.8 - outline.x;
  outline.h = Math.max(...sb.map(b => b.y + b.h)) + F * 0.8 - outline.y;
  let clearEnd = true;
  const fb = ids.map(id => ({...pos[id], ...sz[id]}));
  for (let a = 0; a < fb.length; a++) for (let b = a + 1; b < fb.length; b++) if (overlaps(fb[a], fb[b], F * 0.6)) clearEnd = false;
  const insideBox = fb.every(b => b.x >= box.x - 0.5 && b.y >= box.y - 0.5 && b.x + b.w <= box.x + box.w + 0.5 && b.y + b.h <= box.y + box.h + 0.5);
  const problems = [!OM.ok && 'origin-text', !EM.ok && 'end-text', PL && !PL.ok && 'panel-text', !clearEnd && 'parts-touch', !insideBox && 'outside', k0 >= 1 && ids.length > 2 && 'no-pack'].filter(Boolean);
  return {F, box, inner, panel, PL, OM, EM, D, pos, sz, start, gath, outline, k0, orient, fw, fh, calW, calH, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const R = resolve(P);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const arrangements = shape === 'portrait' ? [{band: true, orient: 'v'}, {band: true, cols: 2, orient: 'v'}]
      : shape === 'square' ? [{pw: 0.3, orient: 'h'}, {pw: 0.34, orient: 'h'}, {band: true, cols: 2, orient: 'h'}, {band: true, cols: 2, orient: 'v'}, {band: true, cols: 3, tight: true, orient: 'h'}]
        : [{pw: 0.27, orient: 'h'}, {pw: 0.31, orient: 'h'}, {pw: 0.35, orient: 'h'}, {pw: 0.39, orient: 'h'}];
    const sizes = (!showKey ? [44, 40, 36, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements) {
        const c = compose(ctx, P, R, F, a);
        if (c.ok) { C = c; break outer; }
        if (c.pos && (!C || c.problems.length < C.problems.length)) C = c;
      }
    }
    if (!C) for (const a of arrangements) { const c = compose(ctx, P, R, sizes[sizes.length - 1] * 0.8, a); if (c.pos) { C = c; break; } }
    return {P, R, C, pxu};
  },
  build(ctx, L) {
    const {C, R, P} = L;
    const th = ctx.theme;
    const parts = [];
    parts.push(g({name: 'outline', opacity: 1},
      h('path', {d: roundRectPath(C.outline.x + 6, C.outline.y + 8, C.outline.w, C.outline.h, 18), fill: th.shadow}),
      h('path', {d: roundRectPath(C.outline.x, C.outline.y, C.outline.w, C.outline.h, 18), fill: MANILA, stroke: INK, 'stroke-width': 2.6}),
      h('path', {d: roundRectPath(C.outline.x + C.F * 0.5, C.outline.y + C.F * 0.5, C.outline.w - C.F, C.outline.h - C.F, 12), fill: th.paper, stroke: SLATE, 'stroke-width': 1.6, opacity: 0.9})));
    const links = R.rels.map((q, i) => {
      const col = linkColor(th, q.kind);
      const wdt = q.kind === 'causal' ? 5 : 3.8;
      return g({name: `link${i}`, opacity: 0},
        h('path', {name: `link${i}-line`, d: 'M0 0L1 0', fill: 'none', stroke: col, 'stroke-width': wdt, 'stroke-linecap': 'round'}),
        q.kind === 'relation' || q.kind === 'communication' ? h('circle', {name: `link${i}-dA`, r: 5.5, fill: col}) : h('rect', {name: `link${i}-dA`, x: -5, y: -5, width: 10, height: 10, fill: col}),
        q.kind === 'relation' ? h('circle', {name: `link${i}-dB`, r: 5.5, fill: col})
          : q.kind === 'communication' ? h('circle', {name: `link${i}-dB`, r: 6.5, fill: th.card, stroke: col, 'stroke-width': 2.6})
            : h('path', {name: `link${i}-dB`, d: q.kind === 'causal' ? 'M4 0L-16 -10L-16 10Z' : 'M3 0L-13 -8L-13 8Z', fill: col}));
    });
    parts.push(g({name: 'links'}, links));
    for (const id of IDS) {
      const p = C.start[id];
      if (!p) continue;
      let art;
      if (id === 'origin') art = originNode(ctx, C.OM, {prefix: 'origin-art'});
      else if (id.startsWith('end')) { const i = Number(id.slice(3)) - 1; art = endNode(ctx, C.EM, i, P.routes[i], {prefix: `${id}-art`}); }
      else if (id === 'filter') {
        art = g(null,
          h('path', {d: roundRectPath(5, 7, C.fw, C.fh, 12), fill: th.shadow}),
          h('path', {d: roundRectPath(0, 0, C.fw, C.fh, 12), fill: th.card, stroke: INK, 'stroke-width': 2.4}),
          h('path', {d: `M${r(C.F * 0.6)} ${r(C.fh / 2)}H${r(C.fw - C.F * 0.6)}`, stroke: SLATE, 'stroke-width': r(C.D.tw + 4, 2)}),
          h('path', {d: `M${r(C.F * 0.6)} ${r(C.fh / 2)}H${r(C.fw - C.F * 0.6)}`, stroke: '#e9e4da', 'stroke-width': r(C.D.tw, 2)}),
          g({transform: T(C.fw / 2, C.fh / 2)}, filterClip(ctx, {prefix: 'filter-clip', w: C.D.along * 1.25, h: C.D.across * 1.25})));
      } else {
        art = g(null,
          h('path', {d: roundRectPath(5, 7, C.calW, C.calH, 12), fill: th.shadow}),
          h('path', {d: roundRectPath(0, 0, C.calW, C.calH, 12), fill: th.card, stroke: INK, 'stroke-width': 2.4}),
          g({transform: T(C.calW * 0.14, C.calH * 0.2)}, calendarArt(ctx, C.calW * 0.72, C.calH * 0.64, true)));
      }
      parts.push(g({name: `el-${id}`, transform: T(p.x, p.y)}, art));
    }
    parts.push(g({name: 'tracer', opacity: 0},
      h('circle', {r: 21, fill: th.accent3, opacity: 0.3}),
      h('circle', {r: 10.5, fill: th.accent3, stroke: '#fff', 'stroke-width': 3})));
    return g({name: 'scene'},
      g({name: 'parts'}, parts),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null);
  },
  frame(ctx, L, u) {
    const {C, R, P} = L;
    const nodes = {};
    const e = ease.inOutCubic;
    const kA = e(seg(u, ...W.apart));
    const kG = e(seg(u, ...W.gather));
    const mix = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
    const ids = IDS.filter(id => C.pos[id]);
    const pos = {};
    for (const id of ids) pos[id] = kG > 0 ? mix(C.pos[id], C.gath[id], kG) : mix(C.start[id], C.pos[id], kA);
    nodes.outline = {opacity: r(1 - seg(u, ...W.outline), 3)};
    const size = C.sz;
    // tracer along the visiting order; it rests on each part's outer edge midpoint (never over printed text)
    const restOf = id => ({x: pos[id].x + size[id].w / 2, y: pos[id].y + size[id].h});
    const nSeg = R.order.length - 1;
    const tq = seg(u, ...W.trace);
    const segF = tq * nSeg;
    const si = Math.min(nSeg - 1, Math.floor(segF));
    const local = clamp(segF - si);
    const travel = ease.inOutSine(clamp((local - 0.25) / 0.5));
    const tp = mix(restOf(R.order[si]), restOf(R.order[si + 1]), travel);
    const at = travel < 0.02 ? R.order[si] : travel > 0.98 ? R.order[si + 1] : null;
    const tracing = u >= W.trace[0] && u <= W.trace[1];
    nodes.tracer = {opacity: r(tracing ? Math.min(1, seg(u, W.trace[0], W.trace[0] + 0.015), 1 - seg(u, W.trace[1] - 0.015, W.trace[1])) : 0, 3), transform: T(tp.x, tp.y)};
    let fk = 0;
    if (R.focus && tracing) {
      const span = (W.trace[1] - W.trace[0]) / nSeg;
      for (let j = 0; j <= nSeg; j++) {
        if (R.order[j] !== R.focus) continue;
        const tj = W.trace[0] + span * j;
        fk = Math.max(fk, clamp(1 - Math.abs(u - tj) / (span * 0.45)));
      }
    }
    const zoom = 1 + 0.14 * ease.inOutSine(fk);
    const boxOf = id => {
      const p = pos[id], s = size[id];
      const k = id === R.focus ? zoom : 1;
      const c = {x: p.x + s.w / 2, y: p.y + s.h / 2};
      return {x: c.x - (s.w * k) / 2, y: c.y - (s.h * k) / 2, w: s.w * k, h: s.h * k};
    };
    for (const id of ids) {
      const p = pos[id], s = size[id];
      const k = id === R.focus ? zoom : 1;
      nodes[`el-${id}`] = {transform: k === 1 ? T(p.x, p.y) : `${scaleAbout(p.x + s.w / 2, p.y + s.h / 2, k)} ${T(p.x, p.y)}`};
    }
    const nR = R.rels.length;
    const linkInfo = R.rels.map((q, i) => {
      const bA = boxOf(q.from), bB = boxOf(q.to);
      const cA = {x: bA.x + bA.w / 2, y: bA.y + bA.h / 2}, cB = {x: bB.x + bB.w / 2, y: bB.y + bB.h / 2};
      const padB = q.kind === 'relation' ? 7 : 10;
      const a = anchor(bA, cB), b = anchor(bB, cA, padB);
      const len = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const span = (W.relate[1] - W.relate[0]) / Math.max(1, nR);
      const p = e(seg(u, W.relate[0] + i * span, W.relate[0] + (i + 0.85) * span));
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      nodes[`link${i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`link${i}-line`] = {d: `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`, 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len * (1 - p))};
      nodes[`link${i}-dA`] = {transform: T(a.x, a.y, ang), opacity: p > 0 ? 1 : 0};
      nodes[`link${i}-dB`] = {transform: T(b.x, b.y, ang), opacity: p >= 0.985 ? 1 : 0};
      const onEdge = (pt, bb, pad) => Math.abs(Math.max(Math.abs(pt.x - (bb.x + bb.w / 2)) - bb.w / 2, Math.abs(pt.y - (bb.y + bb.h / 2)) - bb.h / 2) - pad) < 1.5;
      // the connector must not pass through a third part
      const others = ids.filter(id => id !== q.from && id !== q.to).map(boxOf);
      const crosses = others.some(bb => {
        for (let t = 0.05; t < 0.96; t += 0.05) {
          const x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t);
          if (x > bb.x + 2 && x < bb.x + bb.w - 2 && y > bb.y + 2 && y < bb.y + bb.h - 2) return true;
        }
        return false;
      });
      return {from: q.from, to: q.to, kind: q.kind, p: r(p, 3), arrow: q.kind === 'sequence' || q.kind === 'causal', len: r(len, 1), endsOk: onEdge(a, bA, 7) && onEdge(b, bB, padB), crosses};
    });
    const badgeK = seg(u, ...W.badges);
    P.routes.forEach((rt, i) => { if (pos[`end${i + 1}`]) nodes[`end${i + 1}-art-st`] = {opacity: r(badgeK, 3)}; });
    const stateK = seg(u, ...W.state);
    if (C.PL) for (const row of C.PL.rows) if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const visit = tracing ? R.order.slice(0, si + 1 + (travel > 0.98 ? 1 : 0)) : u > W.trace[1] ? R.order.slice() : [];
    return {
      nodes,
      semantic: {
        beat, apart: r(kA, 3), gather: r(kG, 3), tracer: R2(tp), tracerAt: at, tracing, visited: visit, order: R.order,
        focus: R.focus, zoom: r(zoom, 3), links: linkInfo, arrowheads: linkInfo.filter(q => q.arrow && q.p >= 0.985).length,
        badges: r(badgeK, 3), states: P.routes.map(rt => rt.state), ends: P.routes.map(rt => rt.end),
        parts: Object.fromEntries(ids.map(id => [id, R2(pos[id])])), outline: r(1 - seg(u, ...W.outline), 3),
        stateK: r(stateK, 3), problems: C.problems, textPx: r(C.F * L.pxu, 1), orient: C.orient,
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
    slug: 'review-10-mechanism',
    title: 'Route closure — exploded view of the case file\'s route map: starting resolution, end cards, filter clip and calendar, with only the supplied relationships',
    titleEs: 'Cierre de itinerario — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Cierre de itinerario',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded view of the parts of a case file\'s route map: the parts lie packed inside the file\'s outline, then spread into a fan — the starting resolution, the end card of each supplied route, the filter clip beyond them and the calendar in a corner. Only the supplied relationships are drawn, anchored to the parts\' edges and styled by kind (a plain relation has no arrowhead). A marker follows the supplied traversal order and the focus part is enlarged as it passes; finally the parts close in and each end card shows the state it was supplied with. No finality doctrine; nothing says whether a route is closed or available. Illustrative; jurisdiction unspecified.',
    tags: ['review', 'route closure', 'mechanism', 'exploded view', 'case file', 'resolutions', 'end cards', 'filter clip', 'relationships as supplied', 'traversal'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/cierre-de-itinerario.js', 'src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
