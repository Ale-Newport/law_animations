/**
 * LAW-0074 — Matriz de autoridades · mechanism
 *
 * Storyboard (the matrix taken apart around ONE supplied citation; the row
 * axis and the column axis become the connectors that meet at a cell):
 *  0.00–0.18 separate  The pieces start packed like a corner of the matrix
 *                      and pull apart: search printout (buscador) in the
 *                      corner, library shelf (biblioteca) above the column,
 *                      the cited source sheet (documento) at the head of its
 *                      column, the proposition card (ficha) at the head of its
 *                      row — its citation pin waiting on the card's grommet —
 *                      and the empty cell where row and column cross (a dashed
 *                      socket).
 *  0.18–0.43 relate    Only the supplied relationships are drawn, one by one,
 *                      each anchored to the edges of its two elements and
 *                      styled by kind: a plain relation has no arrowhead
 *                      (row, column, "holds"); the search → shelf step is a
 *                      sequence. Causal arrows appear only when supplied.
 *                      Relation captions sit beside their connector (short
 *                      leader), never on it.
 *  0.43–0.75 trace     A large tracer runs along the connectors in
 *                      `traversalOrder`; each element swells while the tracer
 *                      passes through it (the focus element more). The cited
 *                      result row, its volume and its sheet band light in turn.
 *                      While the tracer comes down the column, the pin leaves
 *                      the card's grommet and rides along the row — its thread
 *                      paying out — so that pin and tracer meet in the cell:
 *                      the pin drops into the socket and its supplied pinpoint
 *                      flag unfurls. At the card a tab with the source id slides
 *                      up from behind the card.
 *  0.75–1.00 gather    Everything stays anchored; the rest of this corner of
 *                      the matrix fades in as context: a proposition with no
 *                      supplied citation, its dashed row ending in an empty
 *                      socket under the "pending source" column. Descriptive
 *                      state tags (supplied source / pending source). No
 *                      evaluation of whether the source supports the text.
 * Layout: hand-placed per shape (wide cross in 16:9, compact cross in 1:1,
 * search and shelf side by side above a tall cross in 9:16). Element
 * captions, relation captions and tags are solved into free space.
 * @module animations/research/LAW-0074
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, edgeAnchor} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag, textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {
  matrixFields, MATRIX_DEFAULTS, MATRIX_STRINGS, resolveMatrix, bookcase, indexCard, sourceSheet, pendingSlot,
  searchSlip, pinHead, socketArt, sourceColor, fitCard, fitWhole, fitWords, placeBeside, lineBoxes, boxesOverlap, balancedChipWidth, unionBox, brokeWord,
} from './kits/matriz-de-autoridades.js';

const ID = 'LAW-0074';
const DURATION = 7000;
const IDS = ['search', 'library', 'source', 'cell', 'proposition'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const TRACE = [0.44, 0.74];
const W = {spread: [0.02, 0.17], labels: [0.12, 0.18], context: [0.76, 0.84], tags: [0.82, 0.9]};
/** Staggered appearance: the cell first, then the axes that meet there, then the origin. */
const APPEAR = {cell: 0, source: 0.015, proposition: 0.015, library: 0.03, search: 0.045};
/** Swell of an element while the tracer passes through it (the focus element more). */
const AMP = {focus: 0.12, other: 0.05};
/** Weight (per unit length) of the tracer's quick run round an element's outline (between two connectors). */
const HOP = 0.2;

const STRINGS = {
  en: {...MATRIX_STRINGS.en, contextRow: 'Proposition without a supplied citation'},
  es: {...MATRIX_STRINGS.es, contextRow: 'Proposición sin cita aportada'},
};

const sceneSchema = {
  ...matrixFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships = JSON.parse(JSON.stringify(sceneSchema.relationships));
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  ...MATRIX_DEFAULTS,
  elements: [
    {id: 'search', label: 'Search printout'},
    {id: 'library', label: 'Library shelf'},
    {id: 'source', label: 'Cited source'},
    {id: 'cell', label: 'Matrix cell'},
    {id: 'proposition', label: 'Proposition card'},
  ],
  relationships: [
    {from: 'search', to: 'library', kind: 'sequence', label: 'leads to the shelf'},
    {from: 'library', to: 'source', kind: 'relation', label: 'holds'},
    {from: 'source', to: 'cell', kind: 'relation', label: 'column'},
    {from: 'proposition', to: 'cell', kind: 'relation', label: 'row'},
  ],
  focusElement: 'cell',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['search', 'library', 'source', 'cell', 'proposition'],
};

/**
 * Hand-placed geometry per shape (local units, fitted into the design space).
 * Boxes are [x, y, w, h]. col / pend: x centres of the cited-source column and
 * the pending column; row / row2: y centres of the cited row and the pending
 * row. Gaps between shelf → sheet → cell and card → cell are ≥ 150 units so
 * every connector reads as a line with its caption beside it.
 */
const PLACES = {
  landscape: {size: [1900, 960], ts: 1.1, chip: 28, cardSize: 27, titleSize: 24,
    search: [30, 34, 420, 196], library: [720, 22, 540, 164], sheet: [280, 200], headY: 344,
    col: 990, cell: [240, 140], row: 764, card: [30, 570, 150],
    pend: 1560, pendW: 230, pendH: 160, row2: 905, card2: 84, card2W: 700, card2Max: 88, card2Min: 26,
    capCell: ['right', 'aboveEast', 'aboveRight'], tagSupported: ['below', 'belowRight'], tagPending: ['right', 'below', 'above'], legend: {x: 1400, y: 34, dir: 'col'}},
  // (square: the pending row sits low enough that the cell's caption and the supplied-source tag both fit
  // between the cell and that row's dashed line, and the pending tag fits under its socket)
  square: {size: [1300, 1060], ts: 1.02, chip: 30, cardSize: 31, titleSize: 27,
    search: [20, 28, 360, 190], library: [580, 22, 440, 128], sheet: [250, 190], headY: 306,
    col: 800, cell: [220, 140], row: 716, card: [20, 480, 150],
    pend: 1172, pendW: 200, pendH: 150, row2: 968, card2: 84, card2Max: 170, card2Min: 28.5, card2Centered: true,
    capCell: ['right', 'aboveEast', 'belowLeft', 'below'], tagSupported: ['below', 'belowRight', 'belowLeft'], tagPending: ['below', 'belowLeft', 'above'], legend: {x: 1062, y: 34, dir: 'col'}},
  // (portrait: the card → cell gap is ≥ 220 units, so the row caption sits beside the row line with room to spare)
  portrait: {size: [1000, 1480], ts: 1.08, chip: 28, cardSize: 29, titleSize: 25,
    search: [30, 104, 380, 216], library: [560, 104, 410, 186], sheet: [270, 244], headY: 478,
    col: 640, cell: [220, 184], row: 1000, card: [30, 280, 250],
    pend: 890, pendW: 196, pendH: 176, row2: 1322, card2: 128, card2Max: 172, card2Min: 22,
    capTop: ['above', 'aboveLeft', 'aboveRight'],
    // the source caption stays beside its sheet on the left (the pending placeholder is on the right); when
    // the tracer's run round the sheet takes the left side, the caption keeps outside that run
    capSource: [{order: ['left', 'belowLeft', 'aboveLeft'], gap: 10}, {order: ['left', 'belowLeft'], gap: 60}],
    capCell: ['belowLeft', 'below', 'right'], tagSupported: ['below', 'belowLeft', 'belowRight'], tagPending: ['below', 'belowLeft', 'aboveLeft', 'above'], legend: {x: 30, y: 1438, dir: 'row'}},
};

function label(p, id) {
  return (p.elements.find(e => e.id === id) || {}).label || '';
}

/**
 * Outline of box B grown by m: perimeter coordinate of a point on B's edge and
 * the path round the outline between two such coordinates (either direction).
 */
function outline(B, m) {
  const x0 = B.x - m, y0 = B.y - m, x1 = B.x + B.w + m, y1 = B.y + B.h + m;
  const W = x1 - x0, H = y1 - y0, per = 2 * (W + H);
  const sOf = p => {
    const d = {top: Math.abs(p.y - B.y), right: Math.abs(p.x - B.x - B.w), bottom: Math.abs(p.y - B.y - B.h), left: Math.abs(p.x - B.x)};
    const side = Object.keys(d).reduce((a, k) => (d[k] < d[a] ? k : a), 'top');
    if (side === 'top') return clamp(p.x, x0, x1) - x0;
    if (side === 'right') return W + clamp(p.y, y0, y1) - y0;
    if (side === 'bottom') return W + H + x1 - clamp(p.x, x0, x1);
    return 2 * W + H + y1 - clamp(p.y, y0, y1);
  };
  const ptOf = q => {
    const s = ((q % per) + per) % per;
    if (s <= W) return {x: x0 + s, y: y0};
    if (s <= W + H) return {x: x1, y: y0 + s - W};
    if (s <= 2 * W + H) return {x: x1 - (s - W - H), y: y1};
    return {x: x0, y: y1 - (s - 2 * W - H)};
  };
  const corners = [0, W, W + H, 2 * W + H];
  const dist = (a, b, dir) => (dir > 0 ? (((b - a) % per) + per) % per : (((a - b) % per) + per) % per);
  const path = (a, b, dir) => {
    const len = dist(a, b, dir);
    const cs = corners.map(c => [dist(a, c, dir), c]).filter(([d]) => d > 1e-6 && d < len - 1e-6).sort((p, q) => p[0] - q[0]);
    return {pts: [ptOf(a), ...cs.map(([, c]) => ptOf(c)), ptOf(b)], len};
  };
  return {sOf, path};
}

/**
 * Tracer route along the connectors in traversal order. Consecutive elements
 * joined by a supplied connector are followed along it; between two
 * connectors the tracer runs quickly round the element's outline (it stays in
 * view, never under the element), choosing the side clear of other items.
 * Unlinked neighbours are joined by a straight run. Visits record when the
 * tracer enters and leaves each element (fractions of the route).
 * @param {(id:string) => number} marginOf  outline distance per element (clear of its swell)
 * @param {Array<{x:number,y:number,w:number,h:number}>} avoid  boxes the outline run should keep off
 */
function traceRoute(graph, B, order, marginOf, avoid) {
  const ctrOf = id => ({x: B[id].x + B[id].w / 2, y: B[id].y + B[id].h / 2});
  const connFor = (a, b) => graph.conns.find(x => (x.rel.from === a && x.rel.to === b) || (x.rel.from === b && x.rel.to === a));
  const ids = order.filter(id => B[id]);
  const pts = [];
  const wts = [];
  const marks = [];
  const hops = [];
  const push = (pt, w) => { pts.push({x: pt.x, y: pt.y}); wts.push(pts.length > 1 ? w : 0); };
  const hopAround = (id, to) => {
    const from = pts[pts.length - 1];
    if (Math.hypot(to.x - from.x, to.y - from.y) < 1) { push(to, HOP); return; }
    const o = outline(B[id], marginOf(id));
    const a = o.sOf(from), b = o.sOf(to);
    const others = avoid.filter(q => q !== B[id]);
    const cands = [1, -1].map(dir => {
      const pa = o.path(a, b, dir);
      const hits = lineBoxes(pa.pts, 26, 14).filter(lb => others.some(q => boxesOverlap(lb, q, 2))).length;
      return {...pa, cost: pa.len + hits * 400};
    }).sort((x, y) => x.cost - y.cost);
    const run = [from, ...cands[0].pts, to];
    for (const pt of run.slice(1)) push(pt, HOP);
    hops.push(run);
  };
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (i === 0) {
      const next = ids[1];
      let start = ctrOf(id);
      if (next) {
        const c = connFor(id, next);
        start = c ? (c.rel.from === id ? c.c.from : c.c.to) : edgeAnchor(B[id], ctrOf(next), 8);
      }
      push(start, 0);
      marks.push({id, enter: 0, leave: 0});
      continue;
    }
    const prev = ids[i - 1];
    const c = connFor(prev, id);
    if (c) {
      const fwd = c.rel.from === prev;
      hopAround(prev, fwd ? c.c.from : c.c.to);
      marks[marks.length - 1].leave = pts.length - 1;
      const n = 30;
      for (let k = 1; k <= n; k++) push(c.c.at(fwd ? k / n : 1 - k / n), 1);
    } else {
      hopAround(prev, edgeAnchor(B[prev], ctrOf(id), 8));
      marks[marks.length - 1].leave = pts.length - 1;
      push(edgeAnchor(B[id], ctrOf(prev), 8), 1);
    }
    marks.push({id, enter: pts.length - 1, leave: pts.length - 1});
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) * wts[i]);
  const total = cum[cum.length - 1] || 1;
  const visits = marks.map(m => ({id: m.id, enter: cum[m.enter] / total, leave: cum[m.leave] / total}));
  visits.forEach(v => { v.t = v.enter; });
  const at = t => {
    if (pts.length === 1) return pts[0];
    const target = clamp(t) * total;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < target) i++;
    const span = cum[i] - cum[i - 1];
    const f = span > 0 ? (target - cum[i - 1]) / span : 1;
    return {x: lerp(pts[i - 1].x, pts[i].x, f), y: lerp(pts[i - 1].y, pts[i].y, f)};
  };
  return {at, visits, pts, hops};
}

const scene = {
  sizes: {landscape: [1700, 800], square: [1200, 930], portrait: [950, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const Pl = PLACES[ctx.view.shape];
    const ts = Pl.ts;
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const M = resolveMatrix(p, {pendingColumn: 'never'});
    const link = M.links[0] || null;
    const row0 = link ? link.row : 0;
    const col0 = link ? link.col : 0;
    const pendRow = M.pendingRows.find(i => i !== row0);
    const color = sourceColor(ctx, col0);
    const R = 17 * ts;

    // --- element boxes (home positions)
    const box = a => ({x: a[0], y: a[1], w: a[2], h: a[3]});
    const B = {
      search: box(Pl.search),
      library: box(Pl.library),
      source: {x: Pl.col - Pl.sheet[0] / 2, y: Pl.headY, w: Pl.sheet[0], h: Pl.sheet[1]},
      cell: {x: Pl.col - Pl.cell[0] / 2, y: Pl.row - Pl.cell[1] / 2, w: Pl.cell[0], h: Pl.cell[1]},
      proposition: {x: Pl.card[0], y: Pl.row - Pl.card[2] / 2, w: Pl.card[1], h: Pl.card[2]},
    };
    const ctr = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    const cellC = ctr(B.cell);

    // --- element art (each in its own group, local = S coordinates)
    const art = {};
    art.search = searchSlip(ctx, {name: 'art-search', box: B.search, query: p.query, sources: M.sources, ts, results: true});
    const lib = bookcase(ctx, {prefix: 'art-library', ...B.library, shelves: 1, sources: M.sources, ts, seedKey: 'mlib', plinth: false, volScale: 1.1});
    art.library = lib.node;
    const vol = lib.volumes[col0];
    const volGlow = vol ? h('rect', {name: 'vol-glow', x: r(vol.x - 6), y: r(vol.y - 6), width: r(vol.w + 12), height: r(vol.h + 12), rx: 6, fill: 'none', stroke: th.highlight, 'stroke-width': 6, opacity: 0}) : null;
    const src = M.sources[col0];
    const tFit = fitWhole(ctx, src.title, {maxWidth: B.source.w - 20 * ts, size: Pl.titleSize * ts, minSize: 17, maxLines: 3, weight: 700, floor: 14});
    const dFit = src.date ? ctx.fit(src.date, {maxWidth: B.source.w - 20 * ts, size: 20 * ts, minSize: 15, maxLines: 1, weight: 500}) : null;
    const bandH = 38 * ts;
    art.source = sourceSheet(ctx, {name: 'art-source', box: B.source, color, id: src.id, titleFit: tFit, dateFit: dFit, ts, bandH});
    const bandGlow = h('rect', {name: 'band-glow', x: r(B.source.x - 5), y: r(B.source.y - 5), width: r(B.source.w + 10), height: r(bandH + 10), rx: 6, fill: 'none', stroke: th.highlight, 'stroke-width': 6, opacity: 0});
    // the cell: a square of grid paper tinted with the column colour, row & column guides, a socket
    const cb = B.cell;
    art.cell = g({name: 'art-cell'},
      h('path', {d: roundRectPath(cb.x + 6, cb.y + 9, cb.w, cb.h, 8), fill: th.shadow}),
      h('path', {d: roundRectPath(cb.x, cb.y, cb.w, cb.h, 8), fill: th.paper, stroke: th.ink, 'stroke-width': 2.4}),
      h('rect', {x: r(cb.x + 1.5), y: r(cb.y + 1.5), width: r(cb.w - 3), height: r(cb.h - 3), rx: 7, fill: shade(color, 0.86)}),
      h('path', {d: `M${r(cb.x + 10)} ${r(cellC.y)}H${r(cb.x + cb.w - 10)}M${r(cellC.x)} ${r(cb.y + 10)}V${r(cb.y + cb.h - 10)}`, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '4 8'}),
      g({name: 'cell-socket', transform: T(cellC.x, cellC.y)}, socketArt(ctx, R)),
    );
    const cardFit = fitCard(ctx, M.rows[row0].text, {maxWidth: B.proposition.w - 58 * ts - R * 1.4, size: Pl.cardSize * ts, minSize: 19, height: B.proposition.h - 18 * ts});
    const grom = {x: B.proposition.x + B.proposition.w, y: Pl.row};
    const cardArt = indexCard(ctx, {name: 'art-proposition', box: B.proposition, n: row0 + 1, fit: cardFit, ts, laneYs: [grom.y], R});

    // the state at the card: a tab with the source id that slides up from BEHIND the card; once up, its
    // whole label stands clear above the card's top edge (the tab's foot stays tucked behind the card)
    const tabFit = ctx.show('key') ? ctx.fit(src.id, {maxWidth: 170 * ts, size: 29 * ts, minSize: 22, maxLines: 1, weight: 800}) : null;
    const tabH = (tabFit ? tabFit.size : 29 * ts) + 16 * ts;
    const tabW = Math.max(76 * ts, tabFit ? tabFit.width + 30 * ts : 0);
    const tabX = B.proposition.x + B.proposition.w - tabW - 40 * ts, tabY = B.proposition.y - tabH - 3 * ts;
    const tabHide = tabH + 16 * ts;
    const tab = link ? g({name: 'card-tab', transform: T(0, tabHide), opacity: 0},
      h('path', {d: roundRectPath(tabX, tabY, tabW, tabH + 20 * ts, 6), fill: color, stroke: th.ink, 'stroke-width': 2}),
      ctx.show('key')
        ? textBlock(tabFit, {x: tabX + tabW / 2, y: tabY + (tabH - tabFit.size) / 2, anchor: 'middle', fill: '#ffffff'})
        : h('rect', {x: r(tabX + 12), y: r(tabY + tabH * 0.4), width: r(tabW - 24), height: r(tabH * 0.2), rx: 2, fill: '#ffffff'})) : null;
    art.proposition = g(null, tab, cardArt);

    // the citation pin: waits on the card's grommet, rides along the row into the socket
    let pinG = null, thread = null, flagBox = null, flagLocal = null;
    if (link) {
      let flag = null;
      if (link.pinpoint) {
        const f = ctx.fit(link.pinpoint, {maxWidth: 240 * ts, size: 25 * ts, minSize: 17, maxLines: 1, weight: 700});
        const fw = f.width + 18 * ts, fh = f.size + 12 * ts;
        const fx = R * 0.6, fy = -R * 0.6 - fh - 8 * ts;
        flagLocal = {x: fx, y: fy, w: fw, h: fh};
        flag = g({name: 'cell-flag', opacity: 0},
          h('path', {d: `M${r(R * 0.3)} ${r(-R * 0.3)}L${r(fx + 4)} ${r(fy + fh)}`, stroke: th.ink, 'stroke-width': 2}),
          h('path', {d: roundRectPath(fx, fy, fw, fh, 4), fill: '#ffffff', stroke: color, 'stroke-width': 2.4}),
          ctx.show('all') ? textBlock(f, {x: fx + fw / 2, y: fy + (fh - f.size) / 2, anchor: 'middle', fill: shade(color, -0.4)}) : h('rect', {x: r(fx + 6), y: r(fy + fh * 0.42), width: r(fw - 12), height: r(fh * 0.18), rx: 2, fill: shade(color, 0.3)}));
        flagBox = {x: cellC.x + fx - 4, y: cellC.y + fy - 4, w: fw + 8, h: fh + 8};
      }
      thread = h('line', {name: 'pin-thread', x1: r(grom.x), y1: r(grom.y), x2: r(grom.x), y2: r(grom.y), stroke: shade(color, -0.12), 'stroke-width': r(4.5 * ts), 'stroke-linecap': 'round', opacity: 0});
      pinG = g({name: 'cell-pin', transform: T(grom.x, grom.y), opacity: 0},
        h('ellipse', {name: 'cell-pin-sh', rx: r(R * 1.02), ry: r(R * 0.82), fill: 'rgba(31,35,40,0.26)', transform: T(4, 6)}),
        g({name: 'cell-pin-hd'}, pinHead(ctx, color, R)),
        flag);
    }

    // --- context (gather): pending row, pending column header, dashed axes, socket
    const ctxParts = [];
    const ctxBoxes = [];
    let pendCard = null, pendSocket = null, pendHead = null, headNode = null;
    if (pendRow !== undefined) {
      // the context card carries the pending side of the comparison: its text is sized like the cited card
      // (the card grows downwards, up to card2Max, before its text is allowed to shrink)
      const c2w = Pl.card2W ?? Pl.card[1];
      const c2top = Pl.row2 - Pl.card2 / 2;
      const c2text = {maxWidth: c2w - 58 * ts - R * 1.4, size: Pl.cardSize * ts};
      let c2h = Pl.card2, pf = null;
      for (let hh = Pl.card2; hh <= (Pl.card2Max ?? Pl.card2) + 0.5; hh += 4) {
        const f = fitCard(ctx, M.rows[pendRow].text, {...c2text, minSize: Pl.card2Min ?? 17, height: hh - 16 * ts});
        c2h = hh; pf = f;
        if (!f.truncated && !brokeWord(f)) break;
      }
      if (pf.truncated) pf = fitCard(ctx, M.rows[pendRow].text, {...c2text, minSize: 17, height: c2h - 16 * ts});
      // (card2Centered: the card grows about its row, so the dashed row line keeps its place)
      const row2 = Pl.card2Centered ? Pl.row2 : c2top + c2h / 2;
      pendCard = {x: Pl.card[0], y: Pl.card2Centered ? Pl.row2 - c2h / 2 : c2top, w: c2w, h: c2h};
      pendHead = {x: Pl.pend - Pl.pendW / 2, y: Pl.headY, w: Pl.pendW, h: Pl.pendH};
      const hf = fitWords(ctx, t.pendingSource, {maxWidth: pendHead.w - 28, size: 27 * ts, minSize: 18, maxLines: 2, weight: 700});
      pendSocket = {x: Pl.pend, y: row2};
      const rowLine = [{x: pendCard.x + pendCard.w, y: row2}, {x: Pl.pend - R * 1.4, y: row2}];
      const colLine = [{x: Pl.pend, y: pendHead.y + pendHead.h}, {x: Pl.pend, y: row2 - R * 1.4}];
      // the pending column header belongs to the matrix corner from the start; the row comes in the gather
      headNode = pendingSlot(ctx, {name: 'ctx-head-art', box: pendHead, fit: hf, ts});
      ctxParts.push(
        h('path', {d: `M${r(rowLine[0].x)} ${r(rowLine[0].y)}H${r(rowLine[1].x)}M${r(colLine[0].x)} ${r(colLine[0].y)}V${r(colLine[1].y)}`, stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '6 9', 'stroke-linecap': 'round', fill: 'none'}),
        indexCard(ctx, {name: 'ctx-card', box: pendCard, n: pendRow + 1, fit: pf, ts, laneYs: [], R}),
        g({transform: T(pendSocket.x, pendSocket.y)}, socketArt(ctx, R)),
      );
      // (the pending placeholder keeps a clear margin: no caption may sit on it as if it were its title)
      ctxBoxes.push(pendCard, {x: pendHead.x - 8, y: pendHead.y - 8, w: pendHead.w + 16, h: pendHead.h + 16}, {x: pendSocket.x - R * 1.4, y: pendSocket.y - R * 1.4, w: R * 2.8, h: R * 2.8}, ...lineBoxes(rowLine, 12), ...lineBoxes(colLine, 12));
    }

    // --- relation graph (pass 1: connector geometry, used as obstacles for every caption)
    const elements = Object.fromEntries(IDS.map(id => [id, {box: B[id]}]));
    const bounds = {x: 8, y: 8, w: S.w - 16, h: S.h - 16};
    const relSize = Pl.chip;
    const graphOpts = obstacles => ({name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize: relSize, chipMax: 330 * ts,
      bend: rel => (rel.from === 'search' || rel.to === 'search' ? 0.06 : 0), obstacles, bounds, separateLabels: true});
    const g1 = relationGraph({...ctx, show: () => false}, graphOpts([]));
    // connectors (and the pin's path along the row) are obstacles for every label: no label sits on a line
    // (as wide as the tracer that runs along them)
    const connBoxes = g1.conns.flatMap(x => lineBoxes(sampleConn(x.c), 36, 18));
    const pinPath = link ? lineBoxes([grom, cellC], 2 * R + 6, 18) : [];

    // --- legend of the relation kinds actually supplied (line style = kind; no arrow = relation)
    const kinds = [...new Set(p.relationships.map(q => q.kind))];
    const legendParts = [];
    const legendBoxes = [];
    if (ctx.show('all') && kinds.length) {
      const lg = Pl.legend;
      const size = Pl.chip * 0.8;
      let lx = lg.x, ly = lg.y;
      for (const kd of kinds) {
        const st = LINK_STYLES[kd];
        const col = kindColor(ctx, kd);
        const f = ctx.fit(p.relationLabels[kd] || kd, {maxWidth: 300 * ts, size, minSize: 15, maxLines: 1, weight: 600});
        const sw = 64;
        const itemW = sw + 14 + f.width;
        if (lg.dir === 'row' && lx + itemW > S.w - 20 && lx > lg.x) { lx = lg.x; ly += size * 1.7; }
        const y0 = ly + size * 0.62;
        legendParts.push(g(null,
          h('line', {x1: r(lx), y1: r(y0), x2: r(lx + sw - (st.arrow ? 8 : 0)), y2: r(y0), stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || null, 'stroke-linecap': 'round'}),
          st.arrow ? h('path', {d: `M${r(lx + sw)} ${r(y0)}l-14 -7.5l3.5 7.5l-3.5 7.5Z`, fill: col}) : null,
          st.endDots ? [h('circle', {cx: r(lx), cy: r(y0), r: 4.5, fill: col}), h('circle', {cx: r(lx + sw), cy: r(y0), r: 4.5, fill: col})] : null,
          textBlock(f, {x: lx + sw + 14, y: y0 - f.size * 0.62, fill: th.fgSoft})));
        legendBoxes.push({x: lx - 6, y: y0 - size * 0.8, w: itemW + 12, h: size * 1.6});
        if (lg.dir === 'row') lx += itemW + 40;
        else ly += size * 1.7;
      }
    }

    const tabBox = link ? {x: tabX - 4, y: tabY - 4, w: tabW + 8, h: tabH + 8} : null;
    const fixed = [...Object.values(B), ...ctxBoxes, flagBox, tabBox, ...legendBoxes].filter(Boolean);

    // --- tracer route along the connectors (traversal order), round each element's outline between
    //     two connectors (clear of its swell); every caption keeps off the whole route
    const marginOf = id => 14 + (id === p.focusElement ? AMP.focus : AMP.other) * Math.max(B[id].w, B[id].h) / 2;
    const route = traceRoute(g1, B, p.traversalOrder, marginOf, [...Object.values(B), ...ctxBoxes, flagBox, tabBox, ...legendBoxes].filter(Boolean));
    const tracerBoxes = route.hops.flatMap(run => lineBoxes(run, 40, 16));

    // the connectors themselves (labels are drawn by this entry: beside the line, never on it)
    const graph = g1;

    // --- element captions, solved into free space next to their element
    const capNodes = [];
    const capBoxes = [];
    const capIds = [];
    if (ctx.show('key')) {
      const orders = {
        search: [...(Pl.capTop || []), 'below', 'belowLeft', 'belowRight', 'right'],
        library: [...(Pl.capTop || []), 'belowLeft', 'belowRight', 'below', 'aboveLeft', 'right', 'left'],
        source: ['left', 'right', 'aboveLeft', 'belowLeft'],
        cell: [...Pl.capCell, 'below', 'right', 'belowRight', 'belowLeft'],
        proposition: ['above', 'aboveLeft', 'aboveRight', 'below', 'belowLeft'],
      };
      for (const id of IDS) {
        const text = label(p, id);
        if (!text) continue;
        const mw = balancedChipWidth(ctx, text, {maxWidth: 320 * ts, size: Pl.chip, maxLines: 2});
        const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: Pl.chip, maxLines: 2});
        const sz = {w: probe.box.w, h: probe.box.h};
        const obs = [...fixed, ...connBoxes, ...tracerBoxes, ...pinPath, ...capBoxes];
        const first = id === 'source' && Pl.capSource
          ? Pl.capSource.reduce((acc, pass) => acc || placeBeside(B[id], sz, {obstacles: obs, bounds, order: pass.order, gap: pass.gap, pad: 6}), null)
          : null;
        const at = first
          || placeBeside(B[id], sz, {obstacles: obs, bounds, order: orders[id], gap: 10, pad: 6})
          || placeBeside(B[id], sz, {obstacles: obs, bounds, order: ['below', 'above', 'right', 'left', 'belowLeft', 'belowRight', 'aboveLeft', 'aboveRight'], gap: 8, pad: 2, shifts: [0, 40, -40, 90, -90, 150, -150]})
          || scanFree(sz, obs, bounds, ctr(B[id]))
          || {x: B[id].x, y: B[id].y + B[id].h + 8};
        const c = chip(ctx, text, {x: at.x, y: at.y, maxWidth: mw, size: Pl.chip, maxLines: 2, fill: th.dark ? th.card : '#fbf7ee', stroke: th.inkSoft, color: th.ink, name: `cap-${id}`});
        capNodes.push({id, node: c.node});
        capBoxes.push(c.box);
        capIds.push(id);
      }
    }

    // --- state tags (gather)
    const tags = [];
    if (ctx.show('key')) {
      const mk = (name, text, near, colorTag, order, keepOut = []) => {
        const probe = statusTag(ctx, text, {x: 0, y: 0, size: Pl.chip * 0.92, maxWidth: 560 * ts});
        const obs = [...fixed, ...connBoxes, ...tracerBoxes, ...pinPath, ...capBoxes, ...tags.map(q => q.box), ...keepOut];
        const sz = {w: probe.box.w, h: probe.box.h};
        const at = placeBeside(near, sz, {obstacles: obs, bounds, order, gap: 10, pad: 6})
          || placeBeside(near, sz, {obstacles: obs, bounds, order: ['below', 'belowLeft', 'belowRight', 'right', 'above', 'left'], gap: 10, pad: 2, shifts: [0, 40, -40, 90, -90, 150, -150, 220, -220]})
          || scanFree(sz, obs, bounds, {x: near.x + near.w / 2, y: near.y + near.h})
          || {x: near.x, y: near.y + near.h + 8};
        const tg = statusTag(ctx, text, {x: at.x, y: at.y, size: Pl.chip * 0.92, maxWidth: 560 * ts, name, color: colorTag, opacity: 0});
        tags.push({name, node: tg.node, box: tg.box});
      };
      // each state tag sits at the end of its row (after the cell / the socket)
      // (next to the cell, or under the cell's caption when that caption sits below the cell)
      const capCell = capBoxes[capIds.indexOf('cell')];
      const cellNear = capCell && capCell.y >= B.cell.y + B.cell.h - 2 && capCell.y - (B.cell.y + B.cell.h) < 40 ? unionBox([B.cell, capCell]) : B.cell;
      // (the supplied-source tag stays on the cell's side of the pending row's dashed line: below that line
      // it would read as the pending row's label)
      if (link) mk('tag-supported', t.supported, cellNear, th.accent4, Pl.tagSupported, pendSocket ? [{x: 0, y: pendSocket.y + 6, w: S.w, h: S.h}] : []);
      if (pendCard) mk('tag-pending', t.pendingSource, {x: pendSocket.x - R * 1.4, y: pendSocket.y - R * 1.4, w: R * 2.8, h: R * 2.8}, th.inkSoft, Pl.tagPending);
    }

    // (reported in the semantics: each state tag on its own side of the pending row's dashed line and next
    // to what it describes; the source caption never on the pending placeholder)
    const tagBox = n => (tags.find(q => q.name === n) || {}).box;
    const tS = tagBox('tag-supported'), tP = tagBox('tag-pending');
    const capSrc = capBoxes[capIds.indexOf('source')];
    const capProp = capBoxes[capIds.indexOf('proposition')];
    const boxGap = (a, b) => Math.hypot(Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w)), Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h)));
    const layoutChecks = {
      supportedAboveLine: !tS || !pendSocket || tS.y + tS.h <= pendSocket.y - 6,
      pendingBesideSocket: !tP || !pendSocket || (tP.y >= pendSocket.y - R * 1.4 - tP.h - 14 && tP.y <= pendSocket.y + R * 1.4 + 14 && tP.x <= pendSocket.x + R * 1.4 + 14 && tP.x + tP.w >= pendSocket.x - R * 1.4 - 14),
      sourceCaptionClear: !capSrc || !pendHead || !boxesOverlap(capSrc, pendHead, 8),
      // the card caption is plainly nearer its own card than the pending row's card
      propCaptionOwn: !capProp || !pendCard || boxGap(capProp, B.proposition) * 2 < boxGap(capProp, pendCard),
    };

    // --- relation captions: beside their connector with a short leader, clear of every line, element,
    //     element caption and other relation caption; the leader never crosses a caption
    const rels = [];
    if (ctx.show('all')) {
      graph.conns.forEach((x, i) => {
        const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
        const col = kindColor(ctx, x.rel.kind);
        const obs = [...fixed, ...connBoxes, ...tracerBoxes, ...pinPath, ...capBoxes, ...tags.map(q => q.box), ...rels.map(q => q.box)];
        const capObs = [...capBoxes, ...tags.map(q => q.box), ...rels.map(q => q.box), ...Object.values(B)];
        const placed = placeRelLabel(ctx, x.c, text, {size: relSize, maxWidth: 330 * ts, obstacles: obs, leaderObstacles: capObs, bounds});
        const c = chip(ctx, text, {x: placed.x, y: placed.y, maxWidth: placed.mw, size: placed.size, maxLines: 2, fill: th.card, stroke: col, name: `rel-l${i}`, weight: 600});
        const lead = placed.leader;
        rels.push({i, box: c.box, node: g({name: `rel-lg${i}`, opacity: 0},
          lead ? h('line', {x1: r(lead.x1), y1: r(lead.y1), x2: r(lead.x2), y2: r(lead.y2), stroke: col, 'stroke-width': 2.2, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null,
          lead ? h('circle', {cx: r(lead.x1), cy: r(lead.y1), r: 3.5, fill: col}) : null,
          c.node), leaderLen: lead ? Math.hypot(lead.x2 - lead.x1, lead.y2 - lead.y1) : 0, onLine: placed.onLine});
      });
    }
    const relBoxes = rels.map(q => q.box);

    const onEdge = (b, q) => q.x >= b.x - 16 && q.x <= b.x + b.w + 16 && q.y >= b.y - 16 && q.y <= b.y + b.h + 16
      && !(q.x > b.x + 2 && q.x < b.x + b.w - 2 && q.y > b.y + 2 && q.y < b.y + b.h - 2);
    const linkEnds = graph.conns.map(x => onEdge(B[x.rel.from], x.c.from) && onEdge(B[x.rel.to], x.c.to));
    const labelsOffLines = rels.every(q => !q.onLine);

    // pin ride: it leaves the grommet while the tracer runs the leg into the cell and lands exactly as the
    // tracer arrives (timed in scene progress u, so the ride keeps a readable pace at any tracer speed)
    const vCell = route.visits.find(v => v.id === 'cell');
    let ride = null;
    if (link && vCell) {
      const uOf = tt => TRACE[0] + (Math.acos(1 - 2 * clamp(tt)) / Math.PI) * (TRACE[1] - TRACE[0]);
      const arr = uOf(vCell.enter);
      ride = {dep: Math.max(0.3, arr - 0.075), arr: Math.max(arr, 0.3 + 0.04)};
    }

    // --- packed start ("a corner of the matrix"): every element pulled towards the cell
    const packK = 0.3;
    const packOffset = {};
    for (const id of IDS) {
      const c = ctr(B[id]);
      packOffset[id] = {x: (cellC.x - c.x) * packK, y: (cellC.y - c.y) * packK};
    }

    const tracerNode = g({name: 'tracer', opacity: 0},
      h('circle', {r: 30, fill: th.accent, opacity: 0.22}),
      h('circle', {r: 16, fill: th.accent, stroke: th.paper, 'stroke-width': 4}),
      h('circle', {r: 5, fill: th.paper}));

    return {S, s, ox, oy, rels, B, art, layoutChecks, volGlow, bandGlow, pinG, thread, flagLocal, tabHide, grom, ride, ctxParts, headNode, capNodes, tags, graph, route, linkEnds, labelsOffLines, packOffset, legendParts,
      cellC, link, M, pendRow, R, ctr, tracerNode, hasContext: pendRow !== undefined};
  },
  build(ctx, L) {
    const el = id => g({name: `el-${id}`}, g({name: `el-${id}-body`}, L.art[id],
      id === 'library' ? L.volGlow : null,
      id === 'source' ? L.bandGlow : null));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headNode && g({name: 'ctx-head', opacity: 0}, L.headNode),
      g({name: 'context', opacity: 0}, L.ctxParts),
      L.graph.node,
      IDS.map(el),
      // the pin rides over the card edge along the row and sits on top of the cell
      L.thread, L.pinG,
      // the tracer runs ON the connectors and round the elements' outlines: always in view
      L.tracerNode,
      L.rels.map(q => q.node),
      g({name: 'caps', opacity: 0}, L.capNodes.map(c => c.node)),
      L.legendParts.length ? g({name: 'legend', opacity: 0}, L.legendParts) : null,
      L.tags.map(q => q.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;

    // 1) separate: from a packed corner of the matrix to the exploded positions
    const spread = ease.inOutCubic(seg(u, ...W.spread));
    const centers = {};
    const offsets = {};
    const appearOf = id => r(seg(u, APPEAR[id], APPEAR[id] + 0.05), 3);
    for (const id of IDS) {
      const o = L.packOffset[id];
      const dx = o.x * (1 - spread), dy = o.y * (1 - spread);
      offsets[id] = {x: dx, y: dy};
      nodes[`el-${id}`] = {transform: T(dx, dy), opacity: appearOf(id)};
      const c = L.ctr(L.B[id]);
      centers[id] = {x: c.x + dx, y: c.y + dy};
    }
    nodes.caps = {opacity: r(seg(u, ...W.labels), 3)};
    if (L.legendParts.length) nodes.legend = {opacity: r(seg(u, 0.18, 0.24), 3)};
    // the pending column header joins once the pieces have pulled apart (it never ghosts over the sheet)
    if (L.headNode) nodes['ctx-head'] = {opacity: r(seg(u, 0.11, 0.17), 3)};

    // 2) relations drawn one by one, in the supplied order
    const m = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / m, 0.18 + ((i + 1) * 0.25) / m));
    Object.assign(nodes, L.graph.frame(relP));
    for (const q of L.rels) nodes[`rel-lg${q.i}`] = {opacity: r(clamp((relP(q.i) - 0.55) / 0.45), 3)};

    // 3) tracer along the traversal order
    const tp = seg(u, ...TRACE);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.at(tt);
    const tracerOn = u >= TRACE[0] - 0.005 && u < TRACE[1] + 0.02;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? r(Math.min(1, seg(u, TRACE[0] - 0.005, TRACE[0] + 0.01) * (1 - seg(u, TRACE[1], TRACE[1] + 0.02)) * 1.2), 3) : 0};
    const traced = u >= TRACE[1];
    const visitOf = id => L.route.visits.find(q => q.id === id) || null;
    const k = {};
    for (const id of IDS) k[id] = 0;
    if (tracerOn) {
      for (const v of L.route.visits) {
        const d = tt < v.enter ? v.enter - tt : tt > v.leave ? tt - v.leave : 0;
        k[v.id] = Math.max(k[v.id], clamp(1 - d / 0.06));
      }
    }
    const scales = {};
    for (const id of IDS) {
      const amp = (id === p.focusElement ? AMP.focus : AMP.other) * (reduced ? 0.5 : 1);
      const kk = 1 + amp * ease.inOutSine(k[id]);
      const c = L.ctr(L.B[id]);
      scales[id] = kk;
      nodes[`el-${id}-body`] = {transform: kk === 1 ? '' : scaleAbout(c.x, c.y, kk)};
    }
    // origin: the cited result row, its volume and its sheet band light as the tracer passes
    const glow = id => {
      const v = visitOf(id);
      if (!v || u < TRACE[0]) return 0;
      return traced ? 1 : clamp((tt - v.enter + 0.03) / 0.04);
    };
    const citedRow = `art-search-r${L.link ? L.link.col : 0}`;
    L.M.sources.forEach((sq, j) => { nodes[`art-search-r${j}`] = {opacity: `art-search-r${j}` === citedRow ? 1 : r(1 - 0.55 * glow('search'), 3)}; });
    if (L.volGlow) nodes['vol-glow'] = {opacity: r(glow('library'), 3)};
    nodes['band-glow'] = {opacity: r(glow('source'), 3)};

    // the change at the cell: the pin rides from the card's grommet along the row and drops into the socket
    let pinP = 0, lift = 0, pinPos = null;
    if (L.pinG) {
      // parked on the grommet it follows the card (spread and swell)
      const cc = L.ctr(L.B.proposition);
      const kc = scales.proposition;
      const park = {x: cc.x + (L.grom.x - cc.x) * kc + offsets.proposition.x, y: cc.y + (L.grom.y - cc.y) * kc + offsets.proposition.y};
      if (L.ride) pinP = clamp((u - L.ride.dep) / (L.ride.arr - L.ride.dep));
      const mv = ease.inOutSine(pinP);
      lift = pinP > 0 && pinP < 1 ? Math.min(1, Math.min(pinP, 1 - pinP) * 6) : 0;
      pinPos = {x: lerp(park.x, L.cellC.x, mv), y: lerp(park.y, L.cellC.y, mv) - 6 * lift};
      nodes['cell-pin'] = {transform: T(pinPos.x, pinPos.y), opacity: appearOf('proposition')};
      nodes['cell-pin-hd'] = {transform: lift ? `scale(${r(1 + 0.25 * lift, 4)})` : ''};
      nodes['cell-pin-sh'] = {transform: T(4 + 12 * lift, 6 + 16 * lift, 0, 1 + 0.2 * lift), opacity: r(1 - 0.35 * lift, 3)};
      const len = Math.hypot(pinPos.x - park.x, pinPos.y - park.y);
      nodes['pin-thread'] = {x1: r(park.x), y1: r(park.y), x2: r(pinPos.x), y2: r(pinPos.y), opacity: len > 0.5 ? 1 : 0};
      if (L.flagLocal) {
        const fl = L.flagLocal;
        const fp = pinP >= 1 ? ease.outCubic(seg(u, L.ride.arr, L.ride.arr + 0.035)) : 0;
        nodes['cell-flag'] = {opacity: fp > 0 ? r(Math.min(1, fp * 1.5), 3) : 0, transform: fp < 1 ? `translate(${r(fl.x)} ${r(fl.y + fl.h)}) scale(${r(0.3 + 0.7 * fp, 4)}) translate(${r(-fl.x)} ${r(-fl.y - fl.h)})` : ''};
      }
    }
    nodes['cell-socket'] = {opacity: r(1 - clamp((pinP - 0.85) / 0.15), 3)};
    // the state at the card: a tab with the source id slides up from behind the card
    const vProp = visitOf('proposition');
    let tabP = 0;
    if (L.link && vProp && u >= TRACE[0]) tabP = traced ? 1 : clamp((tt - vProp.enter + 0.02) / 0.05);
    // (while fully tucked behind the card the tab is not rendered at all)
    if (L.link) nodes['card-tab'] = {transform: T(0, L.tabHide * (1 - ease.outCubic(tabP))), opacity: tabP > 0 ? 1 : 0};

    // 4) gather: context and state tags
    nodes.context = {opacity: r(ease.inOutSine(seg(u, ...W.context)), 3)};
    for (const q of L.tags) nodes[q.name] = {opacity: r(seg(u, ...W.tags), 3)};

    // --- semantics
    const visitOrder = [];
    if (u >= TRACE[0]) for (const v of L.route.visits) if (traced || tt >= v.enter - 1e-9) visitOrder.push(v.id);
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      spread: r(spread, 3),
      relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
      linkEnds: L.linkEnds,
      labelsOffLines: L.labelsOffLines,
      linkStyles: p.relationships.map(q => q.kind),
      arrowheads: L.graph.conns.map(x => x.rel.kind !== 'relation'),
      tracerVisible: tracerOn,
      visitOrder,
      focus: p.focusElement,
      focusScale: r(scales[p.focusElement], 3),
      cellPinned: pinP >= 1,
      pinDrop: r(pinP, 3),
      pinHolder: !L.pinG ? null : pinP >= 1 ? 'cell' : pinP > 0 ? 'row' : 'card',
      tabShown: tabP >= 1,
      layoutChecks: L.layoutChecks,
      contextShown: r(seg(u, ...W.context), 3),
      hasContext: L.hasContext,
      citedRow: L.link ? L.link.row : null,
      citedCol: L.link ? L.link.col : null,
      tracer: P2(tpos),
      // the tracer is drawn above the elements and never runs across one (it goes round its outline;
      // connectors end on the element edges)
      tracerClear: !tracerOn || IDS.every(id => {
        const b = L.B[id], cx = b.x + b.w / 2 + offsets[id].x, cy = b.y + b.h / 2 + offsets[id].y;
        return Math.abs(tpos.x - cx) >= b.w / 2 - 8 || Math.abs(tpos.y - cy) >= b.h / 2 - 8;
      }),
    };
    if (pinPos) semantic.pin = P2(pinPos);
    for (const id of IDS) semantic[`c_${id}`] = P2(centers[id]);
    return {nodes, semantic};
  },
};

/**
 * Place a relation caption beside a connector: candidate points along the
 * middle of the line, both sides, increasing distances; the chip must be clear
 * of every obstacle (lines included) and its leader must not cross a caption.
 * Falls back to a slightly smaller chip, then to the clearest candidate.
 */
function placeRelLabel(ctx, c, text, o) {
  const B = o.bounds;
  const inside = b => b.x >= B.x && b.y >= B.y && b.x + b.w <= B.x + B.w && b.y + b.h <= B.y + B.h;
  const area = (a, q, pad) => Math.max(0, Math.min(a.x + a.w, q.x + q.w + pad) - Math.max(a.x, q.x - pad)) * Math.max(0, Math.min(a.y + a.h, q.y + q.h + pad) - Math.max(a.y, q.y - pad));
  // chip shapes: one balanced line/two lines at full size, a narrower two-line block, then slightly smaller
  const shapes = [];
  for (const size of [o.size, o.size * 0.9, o.size * 0.8]) {
    const mw = balancedChipWidth(ctx, text, {maxWidth: o.maxWidth, size, maxLines: 2});
    const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size, maxLines: 2});
    shapes.push({size, mw, w: probe.box.w, hh: probe.box.h});
    if (probe.fit.lines.length === 1 && String(text).includes(' ')) {
      const mw2 = balancedChipWidth(ctx, text, {maxWidth: probe.box.w * 0.62 + size * 1.2, size, maxLines: 2});
      const p2 = chip(ctx, text, {x: 0, y: 0, maxWidth: mw2, size, maxLines: 2});
      if (!p2.fit.truncated && p2.fit.size >= size - 1e-6) shapes.push({size, mw: mw2, w: p2.box.w, hh: p2.box.h});
    }
  }
  let best = null;
  for (const sh of shapes) {
    const {w, hh} = sh;
    // nearest free slot first (the caption stays close to its own line), then the most central one
    for (const d of [16, 30, 48, 72, 104, 140, 190, 250]) {
      for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) {
        const P = c.at(t), P1 = c.at(Math.min(1, t + 0.02)), P0 = c.at(Math.max(0, t - 0.02));
        const dx = P1.x - P0.x, dy = P1.y - P0.y, len = Math.hypot(dx, dy) || 1;
        const n = {x: -dy / len, y: dx / len};
        const ext = Math.abs(n.x) * w / 2 + Math.abs(n.y) * hh / 2;
        for (const side of [1, -1]) {
          const cx = P.x + n.x * side * (ext + d), cy = P.y + n.y * side * (ext + d);
          const box = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
          if (!inside(box)) continue;
          const edge = {x: cx - n.x * side * ext, y: cy - n.y * side * ext};
          const leader = d > 20 ? {x1: P.x, y1: P.y, x2: edge.x, y2: edge.y} : null;
          const hit = o.obstacles.reduce((acc, q) => acc + (q ? area(box, q, 10) : 0), 0);
          const cross = leader && lineBoxes([{x: P.x + n.x * side * 8, y: P.y + n.y * side * 8}, edge], 6, 10).some(lb => o.leaderObstacles.some(q => boxesOverlap(lb, q, 0)));
          const cand = {x: box.x, y: box.y, mw: sh.mw, size: sh.size, leader, onLine: false};
          if (!hit && !cross) return cand;
          const cost = hit + (cross ? 5000 : 0) + d * 2;
          if (!best || cost < best.cost) best = {...cand, cost};
        }
      }
    }
  }
  // no clear slot: the candidate with the least overlap (still beside the line, never centred on it)
  return best;
}

/** Scan a coarse grid (nearest to `near` first) for a free slot. */
function scanFree(sz, obstacles, B, near) {
  const cands = [];
  for (let y = B.y; y + sz.h <= B.y + B.h; y += 20) for (let x = B.x; x + sz.w <= B.x + B.w; x += 20) cands.push({x, y, d: Math.hypot(x + sz.w / 2 - near.x, y - near.y)});
  cands.sort((a, b) => a.d - b.d);
  for (const c of cands) if (!obstacles.some(o => o && boxesOverlap({x: c.x, y: c.y, w: sz.w, h: sz.h}, o, 4))) return {x: c.x, y: c.y};
  return null;
}

/** Sample points of a connector. */
function sampleConn(c) {
  const pts = [];
  for (let i = 0; i <= 24; i++) pts.push(c.at(i / 24));
  return pts;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-09-mechanism',
    title: 'Authority matrix — where a row meets a column',
    titleEs: 'Matriz de autoridades — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Matriz de autoridades',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded corner of an authority matrix around one supplied citation: search printout, library shelf, cited source sheet (column), proposition card (row) and the cell where they cross. Only the supplied relationships are drawn, styled by kind (no causal arrows by default), with captions beside the lines; a large tracer runs along them in the traversal order while the cited volume and sheet light. As the tracer comes down the column the citation pin rides from the card’s grommet along the row, its thread paying out, and drops into the cell with its pinpoint; a source tab slides up behind the card. The gather beat adds a proposition with no supplied citation whose dashed row ends in an empty socket under the pending-source column.',
    tags: ['research', 'authority matrix', 'mechanism', 'row', 'column', 'cell', 'citation', 'pinpoint', 'pending source', 'tracer', 'library', 'search'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/matriz-de-autoridades.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
