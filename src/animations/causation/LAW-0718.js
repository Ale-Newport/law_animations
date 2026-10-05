/**
 * LAW-0718 — Distribución ilustrativa de pérdidas · mechanism
 *
 * Storyboard (an exploded view of the four parts of the division; no person,
 * no rule, no computation):
 *  0.00–0.18 separate  The four parts start packed together in the centre (the
 *                      blades over the bar, the rails and trays under it) and
 *                      move apart to their own places, clockwise round the box:
 *                      LOSS (the hypothetical total bar) top left, BARRIERS
 *                      (the blade set on its rail) top right, CONNECTORS (the
 *                      bundle of guide rails) bottom right, EVENTS (one tray
 *                      per fictional event) bottom left. The bar carries the
 *                      boundaries of BOTH supplied allocations: ● ticks above
 *                      (A), ◆ ticks below (B), identical weight. Each part's
 *                      name chip fades in under it (0.12–0.18).
 *  0.18–0.43 relate    Only the supplied relationships are drawn, one after
 *                      another, anchored on the parts' edges; a plain relation
 *                      has no arrowhead, a sequence has one, a causal link only
 *                      when supplied (ink, never red); each carries its kind's
 *                      caption.
 *  0.43–0.75 trace     A tracer runs the traversal order along the drawn
 *                      relationships; the focus part enlarges while the tracer
 *                      is on it.
 *  0.75–1.00 gather    The mechanism stays assembled in its ring with every
 *                      relationship still drawn; each part's state chip shows
 *                      what it holds as supplied (values of A
 *                      and B for the events); the key "As supplied · no
 *                      conclusion drawn". No share rule, percentage, fault or
 *                      outcome; neither allocation is preferred.
 * Wide boxes: the four parts in a 2 × 2 ring beside or above the panel; tall
 * boxes: the ring above the panel.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0718
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath, edgeAnchor} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {connector} from '../../primitives/annotate.js';
import {
  dpFields, DP_STRINGS, DP_DEFAULTS, DP_ES_DEFAULTS, resolveDP, linkNotes, altText, allocText, cum, fmtV,
  pieceArt, bladeArt, railArt, shelfArt, guideArt, trayBack, trayFront, sideMark, eventTint,
  arrangeScene, placePanel, chipG, glueN, unwidow,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/distribucion-perdidas.js';

const ID = 'LAW-0718';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {legend: [0, 0.04], explode: [0.02, 0.16], names: [0.15, 0.19], rel: [0.19, 0.42], trace: [0.44, 0.73], gather: [0.75, 0.82], state: [0.78, 0.84], key: [0.82, 0.87]};
const IDS = ['loss', 'barriers', 'connectors', 'events'];
// clockwise ring of places: 0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left
const PLACE = {loss: 0, barriers: 1, connectors: 2, events: 3};

const strings = {
  en: {...DP_STRINGS.en, relation: 'related as supplied', sequence: 'then, as supplied', causal: 'causal (as supplied)', communication: 'communication (as supplied)',
    ticksA: 'ticks above the bar', ticksB: 'ticks below the bar', stEvents: 'Values', forA: 'for A:', forB: 'for B:', and: 'and'},
  es: {...DP_STRINGS.es, relation: 'relacionado según lo aportado', sequence: 'después, según lo aportado', causal: 'causal (según lo aportado)', communication: 'comunicación (según lo aportado)',
    ticksA: 'marcas sobre la barra', ticksB: 'marcas bajo la barra', stEvents: 'Valores', forA: 'para A:', forB: 'para B:', and: 'y'},
};

const sceneSchema = {
  ...dpFields,
  ...mechanismFields(IDS),
};

const defaultParams = {
  ...DP_DEFAULTS,
  elements: [
    {id: 'loss', label: 'Loss: the hypothetical total'},
    {id: 'barriers', label: 'Barriers: blades at the boundaries'},
    {id: 'connectors', label: 'Connectors: one guide rail per event'},
    {id: 'events', label: 'Events: one tray each'},
  ],
  relationships: [
    {from: 'loss', to: 'barriers', kind: 'relation'},
    {from: 'barriers', to: 'connectors', kind: 'sequence'},
    {from: 'connectors', to: 'events', kind: 'sequence'},
  ],
  focusElement: 'barriers',
  relationLabels: {relation: '', communication: '', sequence: '', causal: ''},
  traversalOrder: ['loss', 'barriers', 'connectors', 'events'],
};

const defaultParamsEs = {
  ...DP_ES_DEFAULTS,
  elements: [
    {id: 'loss', label: 'Pérdida: el total hipotético'},
    {id: 'barriers', label: 'Barreras: cuchillas en los límites'},
    {id: 'connectors', label: 'Conectores: una guía por evento'},
    {id: 'events', label: 'Eventos: una bandeja cada uno'},
  ],
};

const SHAPES = {
  landscape: {sizes: [26, 16], modes: ['side', 'below'], sideWs: [0.26, 0.32, 0.38, 0.45], arr: ['ring']},
  square: {sizes: [24, 16], modes: ['below', 'side'], sideWs: [0.32, 0.38, 0.45], arr: ['ring', 'diamond']},
  portrait: {sizes: [25, 16], modes: ['below'], sideWs: [], arr: ['diamond', 'ring']},
};

/** Part sizes (× U). */
const PART = {loss: {w: 1, h: 0.36}, barriers: {w: 0.62, h: 0.42}, connectors: {w: 0.62, h: 0.42}, events: null};
const evW = n => Math.max(0.62, 0.27 * n);
const partWH = (id, n) => (id === 'events' ? {w: evW(n), h: 0.42} : PART[id]);

function panelItems(ctx, p, M) {
  const t = ctx.t;
  if (!ctx.show('key')) return [];
  const out = [];
  // the two supplied allocations: identical chips (their values are the events' state chip)
  out.push({key: 'alloc-a', icon: 'alloc', side: 'a', text: `A · ${p.allocationLabels.a} · ${t.ticksA}`, when: 'legend'});
  out.push({key: 'alloc-b', icon: 'alloc', side: 'b', text: `B · ${p.allocationLabels.b} · ${t.ticksB}`, when: 'legend'});
  p.events.forEach((e, i) => out.push({key: `ev${i}`, icon: 'tray', i, text: e.label, when: 'legend'}));
  out.push({key: 'bar', icon: 'bar', text: `${p.losses[0].label}: ${t.total}`, when: 'legend'});
  if (p.losses[1]) out.push({key: 'loss1', icon: 'note', text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'legend'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: altText(ctx, a), when: 'legend'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, when: 'legend'}));
  // (the key appears late: it comes first, so the chips shown from the first frame take the panel's last rows)
  return [{key: 'key', text: t.key, when: 'key'}, ...out];
}

/** A relation chip: balanced, up to three lines, no one-word line. */
function relChip(ctx, text, o) {
  const oo = {maxLines: 3, ...o};
  const t0 = unwidow(glueN(text), q => chipG(ctx, q, {...oo, x: 0, y: 0}).fit);
  return chipG(ctx, t0, oo);
}

/** Widest relation chip (two lines): narrower in square and tall boxes so the gap between parts stays small. */
const labMax = (ctx, size) => size * (ctx.view.shape === 'landscape' ? 11 : 9.5);
const relText = (ctx, p, kind) => (p.relationLabels && p.relationLabels[kind]) || ctx.t[kind] || kind;
const kindCol = (th, kind) => (kind === 'communication' ? th.accent2 : kind === 'relation' ? th.inkSoft : th.ink);

/** Name and state chips of each part (measured). */
function partChips(ctx, p, M, size, U, arr = 'ring') {
  const t = ctx.t;
  const out = {};
  for (const id of IDS) {
    const wh = partWH(id, M.n);
    // (wide boxes: wider chips, fewer lines — the ring's two rows of chips then cost less height)
    const mw = Math.max((arr === 'ring' ? wh.w : id === 'loss' || id === 'events' ? 0.9 : 0.44) * U, size * (ctx.view.shape === 'landscape' ? 19 : 13));
    const el = p.elements.find(e => e.id === id);
    const nameT = el ? el.label : id;
    // the state shown at the end: the events hold the supplied values of A and B (the bar shows both sets of
    // boundaries as ● / ◆ ticks; the blades and rails have no state of their own)
    const st = id === 'events' ? `${t.stEvents} ${t.forA} ${M.vA.map(fmtV).join('\u00a0·\u00a0')} ${t.and} ${t.forB} ${M.vB.map(fmtV).join('\u00a0·\u00a0')} (${p.unit})` : null;
    const show = ctx.show('key');
    const o1 = {x: 0, y: 0, maxWidth: mw, size, maxLines: 3, weight: 700};
    const o2 = {x: 0, y: 0, maxWidth: Math.max(mw, size * 15), size, maxLines: 4, weight: 600};
    const n0 = show ? unwidow(glueN(nameT), q => chipG(ctx, q, o1).fit) : null;
    const s0 = show && st ? unwidow(glueN(st), q => chipG(ctx, q, o2).fit) : null;
    const nc = n0 ? chipG(ctx, n0, o1) : null, sc = s0 ? chipG(ctx, s0, o2) : null;
    out[id] = {n0, s0, o1, o2, nh: nc ? nc.box.h : 0, sh: sc ? sc.box.h : 0, nw: nc ? nc.box.w : 0, sw: sc ? sc.box.w : 0, bad: (nc && (nc.fit.truncated || nc.fit.broken)) || (sc && (sc.fit.truncated || sc.fit.broken))};
  }
  return out;
}

/**
 * Composition for unit U: 'ring' = 2 × 2 clockwise (loss top left, barriers top right, connectors bottom right, events
 * bottom left); 'diamond' = three rows (the loss bar across the top, barriers and connectors side by side in the middle,
 * the event trays across the bottom). Each part box is followed by its chip block. Returns relative boxes and size;
 * ex / ey = extra room spread into the gaps.
 */
function geomFor(ctx, p, M, size, U, arr, gx0, ex = 0, ey = 0) {
  const ch = partChips(ctx, p, M, size, U, arr);
  const dims = arr === 'ring'
    ? {loss: [1, 0.42], barriers: [0.62, 0.6], connectors: [0.62, 0.6], events: [evW(M.n), 0.52]}
    : {loss: [1, 0.3], barriers: [0.44, 0.36], connectors: [0.44, 0.36], events: [Math.min(1, Math.max(0.6, 0.3 * M.n)), 0.36]};
  const parts = {};
  for (const id of IDS) parts[id] = {w: dims[id][0] * U, h: dims[id][1] * U, chipH: ch[id].nh + (ch[id].sh ? ch[id].sh + 6 : 0) + 10, chipW: Math.max(ch[id].nw, ch[id].sw)};
  const cellW = id => Math.max(parts[id].w, parts[id].chipW);
  const cellH = id => parts[id].h + parts[id].chipH;
  // (the gaps between rows hold relation chips: up to three lines)
  const gy0 = Math.max(0.12 * U, size * 4.2);
  const gx = gx0 + ex, gy = gy0 + ey;
  const boxes = {};
  let w, hh;
  if (arr === 'ring') {
    const colW = [Math.max(cellW('loss'), cellW('events')), Math.max(cellW('barriers'), cellW('connectors'))];
    const rowH = [Math.max(cellH('loss'), cellH('barriers')), Math.max(cellH('events'), cellH('connectors'))];
    w = colW[0] + gx + colW[1]; hh = rowH[0] + gy + rowH[1];
    const put = (id, col, row) => { const P = parts[id]; boxes[id] = {x: (col ? colW[0] + gx : 0) + (colW[col] - P.w) / 2, y: row ? rowH[0] + gy : rowH[0] - P.h - P.chipH, w: P.w, h: P.h}; };
    put('loss', 0, 0); put('barriers', 1, 0); put('connectors', 1, 1); put('events', 0, 1);
  } else {
    const midW = cellW('barriers') + gx + cellW('connectors');
    w = Math.max(cellW('loss'), midW, cellW('events'));
    const midH = Math.max(cellH('barriers'), cellH('connectors'));
    hh = cellH('loss') + gy + midH + gy + cellH('events');
    boxes.loss = {x: (w - parts.loss.w) / 2, y: 0, w: parts.loss.w, h: parts.loss.h};
    const mx = (w - midW) / 2;
    boxes.barriers = {x: mx + (cellW('barriers') - parts.barriers.w) / 2, y: cellH('loss') + gy, w: parts.barriers.w, h: parts.barriers.h};
    boxes.connectors = {x: mx + cellW('barriers') + gx + (cellW('connectors') - parts.connectors.w) / 2, y: cellH('loss') + gy, w: parts.connectors.w, h: parts.connectors.h};
    boxes.events = {x: (w - parts.events.w) / 2, y: cellH('loss') + gy + midH + gy, w: parts.events.w, h: parts.events.h};
  }
  return {ch, parts, boxes, w, h: hh, gx, gy, bad: IDS.some(id => ch[id].bad)};
}

/** Art of each part in local coordinates (origin = the part's box top-left), size w × h. */
function partArt(ctx, id, M, wb, hb, P) {
  const th = ctx.theme;
  const n = M.n;
  if (id === 'loss') {
    const t = hb * 0.36, len = wb * 0.92, x0 = (wb - len) / 2, my = hb / 2;
    const tick = hb * 0.32, ms = Math.max(12, hb * 0.16);
    const ca = cum(M.fA).slice(1, -1), cb = cum(M.fB).slice(1, -1);
    return g(null,
      g({transform: T(wb / 2, my)}, pieceArt(ctx, {w: len, t})),
      ca.map((c, j) => g({name: `${P}tA${j}`}, h('path', {d: `M${r(x0 + c * len)} ${r(my - t / 2 + 2)}V${r(my - t / 2 - tick + ms / 2)}`, stroke: th.ink, 'stroke-width': 3}), sideMark(ctx, {cx: x0 + c * len, cy: my - t / 2 - tick + ms * 0.1, s: ms, side: 'a'}))),
      cb.map((c, j) => g({name: `${P}tB${j}`}, h('path', {d: `M${r(x0 + c * len)} ${r(my + t / 2 - 2)}V${r(my + t / 2 + tick - ms / 2)}`, stroke: th.ink, 'stroke-width': 3}), sideMark(ctx, {cx: x0 + c * len, cy: my + t / 2 + tick - ms * 0.1, s: ms, side: 'b'}))),
    );
  }
  if (id === 'barriers') {
    const rt = hb * 0.08, bw = Math.min(hb * 0.18, wb / (n + 1) * 0.6), bh = hb * 0.62;
    return g(null,
      railArt(ctx, {x0: wb * 0.04, x1: wb * 0.96, y: hb * 0.12, t: rt}),
      Array.from({length: n - 1}, (_, j) => g({transform: T(wb * (j + 1) / n, hb * 0.12 + rt + bh)}, bladeArt(ctx, {bw, bh}))),
    );
  }
  if (id === 'connectors') {
    const gw = Math.max(5, hb * 0.05);
    return g(null,
      shelfArt(ctx, {x0: wb * 0.08, x1: wb * 0.92, y: hb * 0.06, t: hb * 0.1, floorY: hb * 0.16, posts: false}),
      Array.from({length: n}, (_, i) => guideArt(ctx, {a: {x: wb * (0.3 + 0.4 * (i + 0.5) / n), y: hb * 0.2}, b: {x: wb * ((i + 0.5) / n), y: hb * 0.92}, w: gw, dashed: M.links[i] && M.links[i].status === 'disputed'})),
    );
  }
  // events: one tray per event
  const tw = wb / n * 0.84, td = hb * 0.22, ph = hb * 0.42;
  return g(null,
    h('rect', {x: 0, y: r(hb * 0.86), width: r(wb), height: r(hb * 0.08), rx: 3, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}),
    Array.from({length: n}, (_, i) => g({transform: T(wb * (i + 0.5) / n, hb * 0.2)}, trayBack(ctx, {tw, td, ph, i}), trayFront(ctx, {tw, td, ph, i, numText: ctx.show('key') ? String(i + 1) : null}))),
  );
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveDP(p);
    const items = panelItems(ctx, p, M);
    const memo = new Map();
    const rels = p.relationships.map((q, i) => ({...q, i, text: relText(ctx, p, q.kind)}));
    const ringMemo = new Map();
    const stage = size => {
      // the gap between the columns holds the relation chips (measured at this size)
      const labW = ctx.show('all') ? Math.max(0, ...rels.map(q => relChip(ctx, q.text, {x: 0, y: 0, maxWidth: labMax(ctx, size), size}).box.w)) : 0;
      const gx = Math.max(size * 5, labW + 40);
      return SH.arr.map(arr => ({go: {gx, arr}, dims: U => { const k = `${arr}|${size}|${Math.round(U)}`; let R = ringMemo.get(k); if (!R) { R = geomFor(ctx, p, M, size, U, arr, gx); ringMemo.set(k, R); } return R.bad ? {w: 1e9, h: 1e9} : {w: R.w, h: R.h}; }}));
    };
    let A = arrangeScene(ctx, {items, stage, modes: SH.modes, sizes: SH.sizes, sideWs: SH.sideWs, memo, sMax: 1400});
    const problems = [];
    if (!A) { problems.push('no-layout-fits'); A = {size: SH.sizes[1], mode: 'below', S: 120, pw: ctx.design.w - 20, panel: {placed: [], h: 0}, st: stage(SH.sizes[1])[0], bw: ctx.design.w, bh: ctx.design.h}; }
    const U = A.S;
    const R0 = geomFor(ctx, p, M, A.size, U, A.st.go.arr, A.st.go.gx);
    const D = ctx.design;
    const MG = 10, GAP = 26;
    // spread the composition over its whole box (extra room goes into the gaps, capped)
    const ex = Math.min(Math.max(0, A.bw - R0.w), U * 1.2), ey = Math.min(Math.max(0, A.bh - R0.h), U * 0.6) * (A.st.go.arr === 'ring' ? 1 : 0.5);
    const R = geomFor(ctx, p, M, A.size, U, A.st.go.arr, A.st.go.gx, ex, ey);
    const rw = R.w, rh = R.h;
    let ox, oy, px, py;
    if (A.mode === 'side') { ox = MG + Math.max(0, (A.bw - rw) / 2); oy = (D.h - rh) / 2; px = MG + A.bw + GAP; py = Math.max(MG, (D.h - A.panel.h) / 2); } else { const blockH = rh + (A.panel.h ? GAP + A.panel.h : 0); oy = Math.max(MG, (D.h - blockH) / 2); ox = (D.w - rw) / 2; px = MG; py = oy + rh + GAP; }
    const boxes = {};
    for (const id of IDS) { const b = R.boxes[id]; boxes[id] = {x: ox + b.x, y: oy + b.y, w: b.w, h: b.h}; }
    // gathered (0.75–): every part moves a little towards the centre
    const C = {x: ox + rw / 2, y: oy + rh / 2};
    const pull = {x: 0, y: 0};
    // packed start (0.00): all parts near the centre, slightly overlapping, scaled 0.8
    const nodesChips = {};
    for (const id of IDS) {
      const b = boxes[id], c = R.ch[id];
      const cx = b.x + b.w / 2;
      const nc = c.n0 ? chipG(ctx, c.n0, {...c.o1, x: cx, y: b.y + b.h + 8, anchor: 'middle', fill: ctx.theme.card, stroke: ctx.theme.ink, name: `name-${id}`}) : null;
      const sc = c.s0 ? chipG(ctx, c.s0, {...c.o2, x: cx, y: b.y + b.h + 8 + (nc ? nc.box.h + 6 : 0), anchor: 'middle', fill: ctx.theme.accent2Soft, stroke: ctx.theme.accent2, name: `state-${id}`}) : null;
      nodesChips[id] = {nc, sc};
    }
    // relationships: anchored connectors between the part boxes (the gathered positions are where they are drawn)
    const gpos = id => { const k = PLACE[id]; const dx = (k === 0 || k === 3 ? 1 : -1) * pull.x, dy = (k <= 1 ? 1 : -1) * pull.y; return {dx, dy}; };
    const boxAt = (id, gather) => { const b = boxes[id]; const d = gather ? gpos(id) : {dx: 0, dy: 0}; return {x: b.x + d.dx, y: b.y + d.dy, w: b.w, h: b.h}; };
    const conns = rels.filter(q => q.from !== q.to).map(q => {
      const A0 = boxAt(q.from, false), B0 = boxAt(q.to, false);
      const ca = {x: A0.x + A0.w / 2, y: A0.y + A0.h / 2}, cb = {x: B0.x + B0.w / 2, y: B0.y + B0.h / 2};
      const from = edgeAnchor(A0, cb, 10), to = edgeAnchor(B0, ca, q.kind === 'relation' ? 10 : 16);
      const neutral = Object.create(ctx); neutral.theme = {...ctx.theme, accent: ctx.theme.ink};
      const c = connector(neutral, {name: `rel${q.i}`, from, to, kind: q.kind, bend: 0, color: kindCol(ctx.theme, q.kind)});
      return {q, c};
    });
    // relation chips: in free space beside their connector's midpoint (clear of parts, chips and other labels)
    const bandNodes = placePanel(ctx, A.panel, px, py);
    const obst = [...bandNodes.map(b => b.box), ...IDS.map(id => boxes[id]), ...IDS.flatMap(id => [nodesChips[id].nc, nodesChips[id].sc].filter(Boolean).map(x => x.box))];
    const placed = [];
    const meet = (a, b, pad = 6) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
    const labs = conns.map(({q, c}) => {
      if (!ctx.show('all')) return null;
      const lo = {maxWidth: labMax(ctx, A.size), size: A.size, fill: ctx.theme.card, stroke: kindCol(ctx.theme, q.kind), name: `rlab${q.i}`};
      const m0 = relChip(ctx, q.text, {...lo, x: 0, y: 0});
      const bw = m0.box.w, bh = m0.box.h;
      // candidates: along the connector (middle first), pushed off it on both sides; the first clear one wins, else
      // the one with the least overlap
      const cands = [];
      for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7]) {
        const P0 = c.at(tt), P1 = c.at(Math.min(1, tt + 0.02));
        const dx = P1.x - P0.x, dy = P1.y - P0.y, L0 = Math.hypot(dx, dy) || 1;
        const nx = -dy / L0, ny = dx / L0;
        for (let d = 0; d <= 200; d += 10) for (const sgn of d ? [1, -1] : [1]) cands.push({P0, d: sgn * d, b: {x: P0.x + nx * sgn * d - bw / 2, y: P0.y + ny * sgn * d - bh / 2, w: bw, h: bh}});
      }
      const ov = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + 6) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + 6);
      let best = null, bestOv = Infinity;
      for (const cd of cands) {
        const b2 = cd.b;
        if (b2.x < 4 || b2.y < 4 || b2.x + b2.w > D.w - 4 || b2.y + b2.h > D.h - 4) continue;
        const o = [...obst, ...placed].reduce((a, q2) => a + ov(b2, q2), 0);
        if (o === 0) { best = cd; bestOv = 0; break; }
        if (o < bestOv) { best = cd; bestOv = o; }
      }
      const b2 = best ? best.b : {x: c.mid.x - bw / 2, y: c.mid.y - bh / 2, w: bw, h: bh};
      const ch = relChip(ctx, q.text, {...lo, x: b2.x + bw / 2, y: b2.y, anchor: 'middle'});
      placed.push(b2);
      const P0 = best ? best.P0 : c.mid;
      const far = best && Math.abs(best.d) > bh * 0.5 + 8;
      return {ch, lead: far ? {x1: r(P0.x), y1: r(P0.y), x2: r(b2.x + bw / 2), y2: r(b2.y + bh / 2)} : null, clear: bestOv === 0};
    });
    // tracer route through the traversal order: along a drawn connector when consecutive parts are related
    const centre = id => ({x: boxes[id].x + boxes[id].w / 2, y: boxes[id].y + boxes[id].h / 2});
    const pts = [], visits = [];
    p.traversalOrder.forEach((id, k) => {
      if (k === 0) { pts.push(centre(id)); visits.push({id, i: 0}); return; }
      const prev = p.traversalOrder[k - 1];
      const link = conns.find(x => (x.q.from === prev && x.q.to === id) || (x.q.from === id && x.q.to === prev));
      if (link) { const fw = link.q.from === prev; for (let s = 0; s <= 24; s++) pts.push(link.c.at(fw ? s / 24 : 1 - s / 24)); }
      pts.push(centre(id));
      visits.push({id, i: pts.length - 1});
    });
    const cuml = [0];
    for (let i = 1; i < pts.length; i++) cuml.push(cuml[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const tot = cuml[cuml.length - 1] || 1;
    const route = {pts, cuml, tot, visits: visits.map(v => ({id: v.id, t: cuml[v.i] / tot}))};
    return {M, U, R, boxes, nodesChips, conns, labs, route, pull, gpos, C, bandNodes, size: A.size, mode: A.mode, problems};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const parts = IDS.map(id => {
      const b = L.boxes[id];
      const c = L.nodesChips[id];
      return g({name: `part-${id}`, transform: T(0, 0)},
        g({name: `art-${id}`, transform: T(b.x, b.y)}, partArt(ctx, id, L.M, b.w, b.h, `${id}-`)),
        c.nc ? g({name: `nameg-${id}`, opacity: 0}, c.nc.node) : null,
        c.sc ? g({name: `stateg-${id}`, opacity: 0}, c.sc.node) : null);
    });
    return g(null,
      g({name: 'rels'}, L.conns.map(x => x.c.node)),
      parts,
      g({name: 'rlabs'}, L.labs.map((lb, i) => (lb ? g({name: `rlabg${i}`, opacity: 0},
        lb.lead ? h('line', {...lb.lead, stroke: th.inkSoft, 'stroke-width': 2}) : null, lb.ch.node) : null))),
      g({name: 'tracer', opacity: 0}, h('circle', {r: 20, fill: th.accent2, opacity: 0.25}), h('circle', {r: 10, fill: th.accent2, stroke: th.paper, 'stroke-width': 3})),
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const ex = ease.inOutCubic(seg(u, ...W.explode));
    const ga = ease.inOutCubic(seg(u, ...W.gather));
    const tr = seg(u, ...W.trace);
    // tracer position (arc length)
    const R0 = L.route;
    let tp = R0.pts[0];
    const target = tr * R0.tot;
    for (let i = 1; i < R0.pts.length; i++) if (R0.cuml[i] >= target) { const k = (target - R0.cuml[i - 1]) / ((R0.cuml[i] - R0.cuml[i - 1]) || 1); tp = {x: lerp(R0.pts[i - 1].x, R0.pts[i].x, k), y: lerp(R0.pts[i - 1].y, R0.pts[i].y, k)}; break; } else tp = R0.pts[i];
    const near = {};
    for (const v of R0.visits) near[v.id] = Math.max(near[v.id] || 0, tr > 0 && tr < 1 ? clamp(1 - Math.abs(tr - v.t) / 0.12) : 0);
    const sem = {parts: {}};
    for (const id of IDS) {
      const b = L.boxes[id];
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      // packed start: towards the centre (C) by 55 %, scaled 0.8; gathered end: L.gpos
      const k0 = 1 - ex;
      const gp0 = L.gpos(id);
      const dx = (L.C.x - cx) * 0.22 * k0 + gp0.dx * ga, dy = (L.C.y - cy) * 0.22 * k0 + gp0.dy * ga;
      const sc = (id === p.focusElement ? 1 + 0.14 * ease.inOutCubic(near[id] || 0) : 1);
      nodes[`part-${id}`] = {transform: `${T(cx + dx, cy + dy)} scale(${r(sc, 4)}) ${T(-cx, -cy)}`};
      const nm = seg(u, ...W.names);
      if (L.nodesChips[id].nc) nodes[`nameg-${id}`] = {opacity: r(nm, 3)};
      if (L.nodesChips[id].sc) nodes[`stateg-${id}`] = {opacity: r(seg(u, ...W.state), 3)};
      sem.parts[id] = {x: r(cx + dx), y: r(cy + dy), scale: r(sc, 3)};
      sem[`part_${id}`] = {x: r(cx + dx), y: r(cy + dy)};
    }
    // relationships draw one after another, then follow the gathered parts (redrawn by a translate of the group: the
    // pull is small and symmetric, so each connector keeps both ends on its parts — they are drawn at the gathered
    // positions' midpoint offset)
    const nr = L.conns.length;
    L.conns.forEach((x, i) => {
      const a = W.rel[0] + (i / Math.max(1, nr)) * (W.rel[1] - W.rel[0]), b = a + (W.rel[1] - W.rel[0]) / Math.max(1, nr) * 0.9;
      const pr = seg(u, a, b);
      Object.assign(nodes, x.c.frame(ease.inOutCubic(pr), pr > 0 ? 1 : 0));
      if (L.labs[i]) nodes[`rlabg${i}`] = {opacity: r(clamp((pr - 0.6) / 0.4), 3)};
    });
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: tr > 0 && tr < 1 ? 1 : 0};
    const lg = seg(u, ...W.legend);
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.when === 'key' ? seg(u, ...W.key) : lg, 3)};
    Object.assign(sem, {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      explode: r(ex, 3), gather: r(ga, 3), trace: r(tr, 3),
      tracer: {x: r(tp.x), y: r(tp.y)},
      focus: p.focusElement, focusScale: sem.parts[p.focusElement] ? sem.parts[p.focusElement].scale : 1,
      visits: R0.visits.map(v => v.id),
      relKinds: L.conns.map(x => x.q.kind),
      relEnds: L.conns.map(x => ({from: x.q.from, to: x.q.to, a: {x: r(x.c.from.x), y: r(x.c.from.y)}, b: {x: r(x.c.to.x), y: r(x.c.to.y)}})),
      boxes: Object.fromEntries(IDS.map(id => [id, {x: r(L.boxes[id].x), y: r(L.boxes[id].y), w: r(L.boxes[id].w), h: r(L.boxes[id].h)}])),
      labelsClear: L.labs.every(lb => !lb || lb.clear),
      keyShown: seg(u, ...W.key) >= 1,
      layout: {U: r(L.U), size: L.size, mode: L.mode},
      ...(L.problems.length ? {problems: L.problems} : {}),
    });
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-10-mechanism',
    title: 'Illustrative loss distribution — the hypothetical total, the barrier blades, the guide rails and the event trays pulled apart, related only as supplied',
    titleEs: 'Distribución ilustrativa de pérdidas — Mecanismo espacial',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Distribución ilustrativa de pérdidas',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded view of the division of a hypothetical total: the bar (with the boundaries of both supplied allocations as ● and ◆ ticks of equal weight), the barrier blades, the guide rails and one tray per fictional event move apart into a ring. Only the supplied relationships are drawn, each with its kind (a plain relation has no arrowhead); a tracer follows the traversal order while the focus part enlarges. Nothing is computed, attributed or decided; no conclusion drawn.',
    tags: ['causation', 'loss distribution', 'mechanism', 'barriers', 'connectors', 'events', 'supplied values', 'hypothetical'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/distribucion-perdidas.js', 'src/animations/causation/kits/alcance-dano.js', 'src/animations/causation/kits/prueba-contrafactual.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
