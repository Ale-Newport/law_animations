/**
 * LAW-0062 — Fuente primaria y comentario · mechanism
 *
 * Storyboard (an exploded "reading spread", not a row of boxes): the library
 * shelving and the reading spread are both split by the same gutter — source
 * texts on the left, commentaries on the right — and the only thing that
 * crosses the gutter is the pinpoint reference.
 *  0.00–0.18  separate: the two shelf units open apart along the gutter, the
 *             catalogue-search panel rises above them, and the commentator's
 *             card — which starts with its tab touching the page's margin —
 *             slides out to the commentary side. Element labels appear.
 *  0.18–0.43  relate: only the explicit relationships are drawn, one by one,
 *             anchored to element edges and styled by kind (communication =
 *             dashed arrow, sequence = arrow, relation = plain line with end
 *             dots, never an arrow; causal only when supplied).
 *  0.43–0.75  trace: a marker follows `traversalOrder` along the connectors
 *             (straight hops where no connector exists); the focus element
 *             (default: the pinpoint tab) enlarges while the marker is on it.
 *  0.75–1.00  gather: everything stays in place with origin (shelves and
 *             search), transformation (a card added beside the text, linked
 *             by the pinpoint) and state (source unchanged, interpretation
 *             attributed, linked not merged) visible, plus a kinds legend.
 * @module animations/research/LAW-0062
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, edgeAnchor, polyline} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, textBlock, connector, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  fpcContentFields, FPC_DEFAULTS, FPC_STRINGS, fpcColors, linkedPassage, pinLabel,
  sourcePage, noteCard, bookcase, searchScreen, stateChip, placeFirst, ringCands, segmentHitsBox,
} from './kits/fuente-primaria-y-comentario.js';

const ID = 'LAW-0062';
const DURATION = 7000;
const IDS = ['search', 'sourceShelf', 'commentaryShelf', 'source', 'passage', 'pinpoint', 'note'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {rise: [0, 0.12], open: [0.02, 0.16], slide: [0.03, 0.17], gutter: [0.06, 0.16], labels: [0.1, 0.19], type: [0.02, 0.1], rows: [0.08, 0.15], relate: [0.19, 0.42], trace: [0.44, 0.74], states: [0.77, 0.86], legend: [0.2, 0.26]};

const sceneSchema = {
  ...fpcContentFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  ...FPC_DEFAULTS,
  elements: [
    {id: 'search', label: 'Catalogue search'},
    {id: 'sourceShelf', label: 'Source texts'},
    {id: 'commentaryShelf', label: 'Commentaries'},
    {id: 'source', label: 'Primary source'},
    {id: 'passage', label: 'Linked passage'},
    {id: 'pinpoint', label: 'Pinpoint'},
    {id: 'note', label: 'Commentator’s note'},
  ],
  relationships: [
    {from: 'search', to: 'sourceShelf', kind: 'communication', label: 'finds the text'},
    {from: 'search', to: 'commentaryShelf', kind: 'communication', label: 'finds the note'},
    {from: 'sourceShelf', to: 'source', kind: 'relation', label: 'holds'},
    {from: 'commentaryShelf', to: 'note', kind: 'relation', label: 'holds'},
    {from: 'pinpoint', to: 'passage', kind: 'relation', label: 'points to'},
  ],
  focusElement: 'pinpoint',
  relationLabels: {relation: 'relation', communication: 'search result', sequence: 'then', causal: 'causal (as supplied)'},
  traversalOrder: ['search', 'sourceShelf', 'source', 'passage', 'pinpoint', 'note'],
};

/** Hand-placed exploded plans per shape (stage units). */
const PLANS = {
  landscape: {
    // the shelves stand beside (not under) the search panel so its result connectors leave from
    // its sides with a readable length; page and card end high enough for their state chips
    stage: {w: 1600, h: 900},
    search: {x: 530, y: 2, w: 540, h: 196, size: 23},
    shelfL: {x: 20, y: 214, w: 480, h: 112}, shelfR: {x: 1100, y: 214, w: 480, h: 112},
    gutter: {x: 772, w: 56, y0: 214, y1: 896},
    page: {x: 20, y: 426, w: 600, h: 414, text: 23, title: 26},
    note: {x: 1044, y: 474, w: 386, h: 280, text: 26},
    label: 22, legend: {x: 16, y: 40, anchor: 'start'},
  },
  square: {
    stage: {w: 1200, h: 1040},
    search: {x: 370, y: 4, w: 460, h: 196, size: 23},
    shelfL: {x: 16, y: 244, w: 400, h: 124}, shelfR: {x: 740, y: 244, w: 400, h: 124},
    gutter: {x: 540, w: 56, y0: 236, y1: 1036},
    page: {x: 12, y: 500, w: 392, h: 476, text: 20, title: 23},
    note: {x: 790, y: 560, w: 300, h: 280, text: 22},
    label: 24, legend: {x: 1190, y: 1008, anchor: 'end'},
  },
  portrait: {
    stage: {w: 920, h: 1440},
    search: {x: 150, y: 4, w: 620, h: 214, size: 26},
    // shelves stand well below the search panel: its result connectors fan down with room for labels
    shelfL: {x: 8, y: 384, w: 400, h: 150}, shelfR: {x: 512, y: 384, w: 400, h: 150},
    gutter: {x: 452, w: 44, y0: 280, y1: 1320},
    page: {x: 8, y: 652, w: 350, h: 610, text: 21, title: 23},
    note: {x: 604, y: 760, w: 308, h: 300, text: 23},
    label: 22, legend: {x: 460, y: 1414, anchor: 'middle'},
  },
};

const labelOf = (p, id) => (p.elements.find(e => e.id === id) || {}).label;

/** Copy of the note's pinpoint tab (for the focus enlargement overlay). */
function tabCopy(ctx, name, tab, text, color, ink, glow) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = tab;
  const parts = [
    // focus halo behind the enlarged copy (link colour: the pinpoint is the link)
    h('path', {d: roundRectPath(x - 9, y - 9, w + 18, hh + 18, 12), fill: glow, opacity: 0.35}),
    h('path', {d: roundRectPath(x - 9, y - 9, w + 18, hh + 18, 12), fill: 'none', stroke: glow, 'stroke-width': 3}),
    h('path', {d: `M${r(x + w)} ${r(y)}H${r(x + hh * 0.42)}L${r(x)} ${r(y + hh / 2)}L${r(x + hh * 0.42)} ${r(y + hh)}H${r(x + w)}Z`, fill: color, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
  ];
  if (ctx.show('all')) {
    const f = ctx.fit(text, {maxWidth: w - hh * 0.42 - 6, size: hh * 0.56, minSize: 12, maxLines: 1, weight: 800, family: 'serif'});
    parts.push(textBlock(f, {x: x + hh * 0.36 + (w - hh * 0.36) / 2 - 3, y: y + hh / 2 - f.size * 0.52, anchor: 'middle', fill: ink}));
  } else parts.push(h('path', {d: `M${r(x + w * 0.4)} ${r(y + hh / 2)}h${r(w * 0.34)}`, stroke: ink, 'stroke-width': 4, 'stroke-linecap': 'round'}));
  return g({name, opacity: 0}, parts);
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1040], portrait: [920, 1440]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const C = fpcColors(ctx);
    const shape = ctx.view.shape;
    const P = PLANS[shape];
    const D = ctx.design;
    const s = Math.min(D.w / P.stage.w, D.h / P.stage.h);
    const ox = (D.w - P.stage.w * s) / 2;
    const oy = (D.h - P.stage.h * s) / 2;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const li = linkedPassage(p);
    const LS = P.label;

    // --- objects (final, exploded positions)
    const screen = searchScreen(ctx, {prefix: 'scr', ...P.search, mount: 'none', title: labelOf(p, 'search') || t.search, query: p.query,
      results: [{kind: 'source', text: p.citations.source}, {kind: 'commentary', text: p.citations.commentary}]});
    const shelfL = bookcase(ctx, {prefix: 'shl', ...P.shelfL, rows: [{kind: 'source', label: labelOf(p, 'sourceShelf'), feature: 4}], plateSize: LS, legs: false, seedKey: 'fpc-m-l'});
    const shelfR = bookcase(ctx, {prefix: 'shr', ...P.shelfR, rows: [{kind: 'commentary', label: labelOf(p, 'commentaryShelf'), feature: 5}], plateSize: LS, legs: false, seedKey: 'fpc-m-r'});
    const pg = P.page;
    const page = sourcePage(ctx, {prefix: 'src', w: pg.w, h: pg.h, title: p.sources.sourceTitle, ref: p.citations.source, date: p.dates.source, passages: p.sources.passages, showText: showAll, textSize: pg.text, titleSize: pg.title});
    const pas = page.passages[li];
    const probe = noteCard(ctx, {prefix: 'np', w: P.note.w, h: P.note.h, header: p.sources.commentator, text: '', pinpoint: pinLabel(li), showText: showAll, textSize: P.note.text});
    const pasY = pg.y + pas.box.y + pas.box.h / 2;
    // portrait: the card hangs below the crossing (tab near its top) so the space above it stays free
    // (never so low that its name label and state chip would run into the legend at the foot)
    const nt = shape === 'portrait' ? {...P.note, y: Math.min(P.stage.h - P.note.h - 150, pasY - (probe.bandH + probe.tab.h / 2 + 8))} : P.note;
    // the tab points at the passage when the card's height allows it
    const tabY = clamp(pasY - nt.y, probe.bandH + probe.tab.h / 2 + 4, nt.h - probe.tab.h / 2 - 8);
    const note = noteCard(ctx, {prefix: 'note', w: nt.w, h: nt.h, header: p.sources.commentator, text: p.sources.commentaryText,
      footer: `${p.citations.commentary} · ${p.dates.commentary}`, pinpoint: pinLabel(li), showText: showAll, textSize: nt.text, tabY});
    // start of the separation: the card's tab tip touches the page's right edge
    const noteStartX = pg.x + pg.w + note.tab.w + 4;

    // element boxes (stage units; shelves include their hanging plates)
    const plateBox = sh => (sh.rows[0].plate ? sh.rows[0].plate : null);
    const shelfBox = (sh, S) => {
      const pb = plateBox(sh);
      return {x: S.x, y: S.y, w: S.w, h: Math.max(S.h, pb ? pb.y + pb.h - S.y : S.h)};
    };
    const boxes = {
      search: {x: P.search.x, y: P.search.y, w: P.search.w, h: P.search.h},
      sourceShelf: shelfBox(shelfL, P.shelfL),
      commentaryShelf: shelfBox(shelfR, P.shelfR),
      source: {x: pg.x, y: pg.y, w: pg.w, h: pg.h},
      passage: {x: pg.x + pas.box.x, y: pg.y + pas.box.y, w: pas.box.w, h: pas.box.h},
      pinpoint: {x: nt.x + note.tab.x, y: nt.y + note.tab.y, w: note.tab.w - 10, h: note.tab.h},
      note: {x: nt.x, y: nt.y, w: nt.w, h: nt.h},
    };
    // --- connectors with designed ports (so every label has predictable free space)
    const B = boxes;
    const cxOf = b => b.x + b.w / 2;
    const above = (a, b) => B[a].y + B[a].h <= B[b].y + 4;
    // an element whose centre lies clearly beside (not under) the other one, lower down: the
    // connector leaves from the upper element's side and lands on the lower one's top edge, so a
    // search result reaches a shelf standing beside the panel with a readable length
    const beside = (upper, lower) => {
      const u = B[upper], l = B[lower];
      if (!above(upper, lower)) return 0;
      const lc = cxOf(l);
      return lc < u.x - 40 ? -1 : lc > u.x + u.w + 40 ? 1 : 0;
    };
    const port = (id, other) => {
      const b = B[id], o = B[other];
      if ((id === 'passage' && other === 'pinpoint') || (id === 'pinpoint' && other === 'passage')) {
        return id === 'passage' ? {x: b.x + b.w + 6, y: b.y + b.h / 2} : {x: b.x - 2, y: b.y + b.h / 2};
      }
      const sd = beside(id, other);
      if (sd) return {x: sd < 0 ? b.x - 6 : b.x + b.w + 6, y: b.y + b.h * 0.6};
      const sl = beside(other, id);
      if (sl) return {x: sl < 0 ? b.x + b.w * 0.62 : b.x + b.w * 0.38, y: b.y - 6};
      if (above(id, other)) {
        // leaving downwards: from the bottom edge, x aimed at the other element's port column
        const tx = other === 'source' ? o.x + o.w * 0.74 : other === 'note' ? o.x + o.w * 0.62 : cxOf(o);
        return {x: clamp(tx, b.x + Math.min(40, b.w * 0.2), b.x + b.w - Math.min(40, b.w * 0.2)), y: b.y + b.h + 6};
      }
      if (above(other, id)) {
        const fx = id === 'source' ? b.x + b.w * 0.74 : id === 'note' ? b.x + b.w * 0.62 : clamp(cxOf(o), b.x + Math.min(60, b.w * 0.2), b.x + b.w - Math.min(60, b.w * 0.2));
        return {x: fx, y: b.y - 6};
      }
      return edgeAnchor(b, {x: cxOf(o), y: o.y + o.h / 2}, 8);
    };
    const rels = p.relationships.filter(x => boxes[x.from] && boxes[x.to] && x.from !== x.to);
    const conns = rels.map((rel, i) => {
      const from = port(rel.from, rel.to), to = port(rel.to, rel.from);
      const vertical = Math.abs(from.x - to.x) < 6;
      // side → top connectors: leave the side horizontally, land on the top edge from above
      const side = beside(rel.from, rel.to) ? {c1: {x: from.x + (to.x - from.x) * 0.55, y: from.y}, c2: {x: to.x, y: from.y + (to.y - from.y) * 0.35}}
        : beside(rel.to, rel.from) ? {c1: {x: from.x, y: to.y + (from.y - to.y) * 0.35}, c2: {x: from.x + (to.x - from.x) * 0.45, y: to.y}} : {};
      const c = connector(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind, bend: vertical || rel.from === 'pinpoint' || rel.to === 'pinpoint' ? 0 : 0.1, color: kindColor(ctx, rel.kind), ...side});
      return {rel, c};
    });
    const graph = {
      node: g({name: 'rel'}, conns.map(x => x.c.node)),
      conns,
      frame: progressOf => {
        const out = {};
        conns.forEach((x, i) => { const pr = progressOf(i); Object.assign(out, x.c.frame(pr, pr > 0 ? 1 : 0)); });
        return out;
      },
    };
    // tracer route: along a connector when one links consecutive ids, otherwise a straight hop
    // where the marker rests on each element: on a band, margin or tab edge, never on body text
    const center = id => {
      const b = B[id];
      if (id === 'search') return {x: cxOf(b), y: b.y + 26};
      // on the header band's right end, above the text-free right margin (hops down to the passage
      // then run along the margin instead of across the body text)
      if (id === 'source') return {x: b.x + b.w - page.headH * 0.6, y: b.y + page.headH / 2};
      if (id === 'passage') return {x: b.x + b.w - 8, y: b.y + b.h / 2};
      if (id === 'pinpoint') return {x: b.x + 10, y: b.y + b.h / 2};
      // on the card's push pin at the band's right end (the header text stops short of it)
      if (id === 'note') return {x: b.x + note.pinAt.x, y: b.y + note.pinAt.y};
      return {x: cxOf(b), y: b.y + b.h / 2};
    };
    const order = p.traversalOrder.filter(id => boxes[id]);
    const rpts = [];
    const visitsIdx = [];
    order.forEach((id, k) => {
      if (k === 0) { rpts.push(center(id)); visitsIdx.push({id, idx: 0}); return; }
      const prev = order[k - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      if (link) {
        const fwd = link.rel.from === prev;
        rpts.push(fwd ? link.c.from : link.c.to);
        for (let q = 1; q <= 30; q++) rpts.push(link.c.at(fwd ? q / 30 : 1 - q / 30));
      }
      rpts.push(center(id));
      visitsIdx.push({id, idx: rpts.length - 1});
    });
    const cum = [0];
    for (let q = 1; q < rpts.length; q++) cum.push(cum[q - 1] + Math.hypot(rpts[q].x - rpts[q - 1].x, rpts[q].y - rpts[q - 1].y));
    const total = cum[cum.length - 1] || 1;
    const route = {poly: polyline(rpts), visits: visitsIdx.map(v => ({id: v.id, t: cum[v.idx] / total}))};
    // a large marker with a halo and a ring, readable at mobile size
    const tracer = g({name: 'tracer', opacity: 0},
      h('circle', {r: 31, fill: C.link, opacity: 0.16}),
      h('circle', {r: 21, fill: 'none', stroke: C.link, 'stroke-width': 3.5, opacity: 0.85}),
      h('circle', {r: 12, fill: C.link, stroke: th.paper, 'stroke-width': 3.5}));

    // --- label placement: planned slots per layout, then rings around the target with a leader
    const bounds = {x: 6, y: 6, w: P.stage.w - 12, h: P.stage.h - 12};
    const passageTexts = [...page.passages.map(q => ({x: pg.x + q.textX, y: pg.y + q.textY, w: q.fit ? Math.min(page.inner, q.fit.width) : page.inner, h: q.blockH})),
      ...page.textBoxes.map(b => ({x: pg.x + b.x, y: pg.y + b.y, w: b.w, h: b.h}))];
    const obstacles = [B.search, B.sourceShelf, B.commentaryShelf, B.source, B.note, B.pinpoint];
    const connPts = conns.flatMap(x => Array.from({length: 41}, (_, k) => x.c.at(k / 40)));
    const routePts = Array.from({length: 161}, (_, k) => route.poly.at(k / 160));
    const gutterBox = {x: P.gutter.x, y: P.gutter.y0, w: P.gutter.w, h: P.gutter.y1 - P.gutter.y0};
    const labels = [];
    // sampled leader lines already drawn: later labels keep off them, and a new leader may not cross a label
    const leaderPts = [];
    const sampleSeg = (a, b, n = 14) => Array.from({length: n + 1}, (_, k) => ({x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n}));

    // legend of the relationship kinds actually used (placed first: everything else avoids it)
    const kinds = [...new Set(rels.map(x => x.kind))];
    let legend = null;
    if (showAll && kinds.length) {
      const size = LS - 4;
      const entries = kinds.map(k => ({k, f: ctx.fit(p.relationLabels[k] || t[k] || k, {maxWidth: 300, size, minSize: size * 0.85, maxLines: 1, weight: 600})}));
      const item = (e, x, y) => {
        const st = LINK_STYLES[e.k];
        const col = kindColor(ctx, e.k);
        return g({transform: T(x, y)},
          h('line', {x1: 0, y1: 0, x2: 44, y2: 0, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}),
          st.arrow ? h('path', {d: 'M50 0l-12 -7l3 7l-3 7Z', fill: col}) : null,
          st.endDots ? g(null, h('circle', {cx: 0, cy: 0, r: 4.5, fill: col}), h('circle', {cx: 44, cy: 0, r: 4.5, fill: col})) : null,
          textBlock(e.f, {x: 60, y: -e.f.size * 0.55, fill: th.fg}));
      };
      // one row; when a row finds no free place (long kind captions), a stacked column
      const row = [];
      let x = 0;
      for (const e of entries) { row.push(item(e, x, 0)); x += 60 + e.f.width + 34; }
      const rowW = x - 34;
      const stepY = size * 1.7;
      const col = entries.map((e, i) => item(e, 0, i * stepY));
      const colW = Math.max(...entries.map(e => 60 + e.f.width));
      const colH = stepY * (entries.length - 1) + size * 2;
      const spots = [P.legend, {x: 8, y: 40, anchor: 'start'}, {x: P.stage.w - 8, y: 40, anchor: 'end'}, {x: 8, y: P.stage.h - 22, anchor: 'start'}, {x: P.stage.w - 12, y: P.stage.h - 22, anchor: 'end'}, {x: P.stage.w / 2, y: P.stage.h - 22, anchor: 'middle'}];
      const cands = [...spots, ...spots.slice(1).map(sp => ({...sp, stack: true, y: sp.y > P.stage.h / 2 ? sp.y - stepY * (entries.length - 1) : sp.y}))];
      const res = placeFirst(cands, Lg => {
        const lw = Lg.stack ? colW : rowW;
        const lx = Lg.anchor === 'middle' ? Lg.x - lw / 2 : Lg.anchor === 'end' ? Lg.x - lw : Lg.x;
        return {node: g({name: 'legend', opacity: 0, transform: T(lx, Lg.y)}, Lg.stack ? col : row), box: {x: lx, y: Lg.y - size, w: lw, h: Lg.stack ? colH : size * 2}};
      }, {obstacles: [...obstacles, gutterBox], points: [...connPts, ...routePts], bounds, pad: 8});
      legend = res;
      labels.push(res);
    }

    // candidate y semantics: v 'above' = y is the bottom edge, 'mid' = centre, otherwise the top
    const settle = (c, make) => {
      if (!c.v || c.v === 'below') return c;
      const hh = make({...c, x: 0, y: 0}).box.h;
      return {...c, y: c.v === 'above' ? c.y - hh : c.y - hh / 2};
    };
    const withLeader = (make, target, color) => c => {
      const cc = make(c);
      const b = cc.box;
      // shortest leader between the two boxes: straight across their shared span when they overlap on
      // one axis, corner to corner otherwise
      const span = (a0, a1, b0, b1) => {
        const lo = Math.max(a0, b0), hi = Math.min(a1, b1);
        if (lo <= hi) return [(lo + hi) / 2, (lo + hi) / 2];
        return a1 < b0 ? [a1, b0] : [a0, b1];
      };
      const [ex, tx] = span(b.x, b.x + b.w, target.x, target.x + target.w);
      const [ey, ty] = span(b.y, b.y + b.h, target.y, target.y + target.h);
      const lead = Math.hypot(tx - ex, ty - ey) > 6 ? g(null,
        h('line', {x1: r(ex), y1: r(ey), x2: r(tx), y2: r(ty), stroke: color, 'stroke-width': 2.2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round'}),
        h('circle', {cx: r(tx), cy: r(ty), r: 4.5, fill: color})) : null;
      return {...cc, lead: lead ? [{x: ex, y: ey}, {x: tx, y: ty}] : null, node: g({name: cc.node.attrs.name, opacity: cc.node.attrs.opacity}, lead, g(null, ...cc.node.children))};
    };
    /**
     * planned candidates first (a candidate flagged `lead` hangs a short leader to `around`); if none
     * is clean, rings around `around` (with a leader). A leader may not run through another label or
     * through an object other than its target (and the object that contains it).
     */
    const placeLabel = ({primary, make, around, color, extraObs = [], ignore = [], ringMw = 300, leadBlock = []}) => {
      const opts = {obstacles: [...obstacles.filter(b => !ignore.includes(b)), ...extraObs, ...labels.map(q => q.box)], points: [...connPts, ...routePts, ...leaderPts], bounds, pad: 6, pointPad: 10};
      const host = around ? obstacles.filter(o => o.x <= around.x + 1 && o.y <= around.y + 1 && o.x + o.w >= around.x + around.w - 1 && o.y + o.h >= around.y + around.h - 1) : [];
      const blockers = [...labels.map(q => q.box), ...obstacles.filter(o => o !== around && !host.includes(o)), ...leadBlock];
      const lm = around ? withLeader(make, around, color) : make;
      const leadClear = q => !q.lead || !blockers.some(bx => segmentHitsBox(q.lead[0], q.lead[1], bx, 4));
      const settled = primary.map(c => settle(c, make));
      const prim = settled.filter(c => !c.lead || leadClear(lm(c)));
      let res = prim.length ? placeFirst(prim, c => (c.lead ? lm(c) : make(c)), opts) : {clean: false};
      if (!res.clean && around) {
        const ring = ringCands(around, {rings: 10}).map(c => settle({...c, mw: ringMw}, make)).filter(c => leadClear(lm(c)));
        const res2 = ring.length ? placeFirst(ring, lm, opts) : {clean: false};
        if (res2.clean) res = res2;
      }
      if (!res.box) res = placeFirst(settled, make, opts);
      if (res.lead) leaderPts.push(...sampleSeg(res.lead[0], res.lead[1]));
      labels.push(res);
      return res;
    };
    const elemChip = (id, color, ink, fill) => c => chip(ctx, labelOf(p, id), {x: c.x, y: c.y, anchor: c.a, maxWidth: c.mw ?? 320, size: LS, minSize: LS * 0.82, maxLines: 2, fill, stroke: color, color: ink, weight: 700, name: `el-${id}`});
    const gapX0 = pg.x + pg.w + 8, gapX1 = P.gutter.x - 6;
    const pinX0 = P.gutter.x + P.gutter.w + 6, pinX1 = nt.x + note.tab.x - 6;
    // state chips (gather), anchored to the object each one describes: "linked, not merged" at the
    // crossing (placed first, before the element labels, so it keeps the crossing), "source text
    // unchanged" under the page and "attributed interpretation" under the card (below its name
    // label). One line at the element-label size; where the gap between page and card is too narrow
    // for one line, the link state breaks after its comma (never shrinks).
    const states = [];
    const gx = gutterBox.x + gutterBox.w / 2;
    const SS = LS;
    const mkState = (name, text, color, ink, fill, primary, mw, around) => {
      states.push(placeLabel({primary, make: c => stateChip(ctx, text, {x: c.x, y: c.y, anchor: c.a, size: SS, color, ink, fill, maxWidth: c.mw ?? mw, maxLines: Array.isArray(text) ? 2 : 1, name, opacity: 0}), around, color, extraObs: passageTexts, ringMw: mw}));
    };
    if (showKey) {
      const crossBox = {x: gx - 20, y: pasY - 20, w: 40, h: 40};
      const linkText = /,\s/.test(t.linked) ? t.linked.split(/,\s+/).map((q, i, all) => (i < all.length - 1 ? `${q},` : q)) : t.linked;
      const gapL = pg.x + pg.w, gapR = nt.x + note.tab.x;
      const gapMid = (gapL + gapR) / 2, gapW = gapR - gapL - 16;
      // leave the slot right under the crossing to the crossing relation's own label
      const crossRel = conns.find(x => (x.c.from.x - gutterBox.x) * (x.c.to.x - gutterBox.x) < 0 && Math.abs(x.c.from.y - x.c.to.y) < 80);
      const relH = crossRel && showAll ? chip(ctx, crossRel.rel.label || p.relationLabels[crossRel.rel.kind] || crossRel.rel.kind, {x: 0, y: 0, maxWidth: 240, size: LS - 2, minSize: (LS - 2) * 0.85, maxLines: 2}).box.h : 0;
      const dLink = Math.max(68, 48 + relH / 2 + 14);
      mkState('st-link', linkText, C.link, C.link, th.card, [
        {x: gx, y: pasY + dLink, a: 'middle'}, {x: gx, y: pasY + dLink + 42, a: 'middle'},
        {x: pinX0, y: pasY - 60, v: 'above', a: 'start', mw: Math.max(300, pinX1 - pinX0)}, {x: gx, y: pasY + 160, a: 'middle'},
        // below the tab the whole gap between page and card is free
        {x: (gapL + nt.x) / 2, y: pasY + dLink, a: 'middle', mw: nt.x - gapL - 14}, {x: (gapL + nt.x) / 2, y: pasY + dLink + 42, a: 'middle', mw: nt.x - gapL - 14},
        {x: gapMid, y: pasY + dLink, a: 'middle', mw: gapW}, {x: gapMid, y: pasY + dLink + 42, a: 'middle', mw: gapW}, {x: gapMid, y: pasY - 50, v: 'above', a: 'middle', mw: gapW},
      ], 420, crossBox);
    }
    const elLabels = [];
    if (showKey) {
      if (labelOf(p, 'source')) elLabels.push(placeLabel({primary: [
        {x: B.source.x + 4, y: B.source.y - 8, v: 'above', a: 'start', mw: B.source.w * 0.62},
        {x: B.source.x + B.source.w, y: B.source.y - 8, v: 'above', a: 'end', mw: B.source.w * 0.5},
      ], make: elemChip('source', C.src, '#fff', C.src), around: B.source, color: C.src}));
      // pinpoint first (its slots are few: beside the tab or over the card's corner), then the passage,
      // which can hang anywhere around its block with a leader.
      // pinpoint: between the gutter and the tab, above it (the card hangs lower in 9:16)
      if (labelOf(p, 'pinpoint')) elLabels.push(placeLabel({primary: [
        // (clear of the tab even while it is enlarged for the focus)
        {x: pinX1 + 6, y: B.pinpoint.y - 20, v: 'above', a: 'end', mw: pinX1 + 6 - pinX0},
        {x: pinX0, y: B.pinpoint.y - 20, v: 'above', a: 'start', mw: Math.max(pinX1 - pinX0, 300)},
        {x: pinX1 + 6, y: B.pinpoint.y + B.pinpoint.h + 20, a: 'end', mw: pinX1 + 6 - pinX0},
        // over the card's top-left corner, with a short leader down to the tab
        // (starting near the card's edge, so its leader drops at the tab's card end and the space above
        // the crossing stays free for the passage label)
        {x: Math.max(pinX0, nt.x - 24), y: nt.y - 12, v: 'above', a: 'start', mw: Math.max(300, nt.x + nt.w * 0.6 - Math.max(pinX0, nt.x - 24)), lead: true},
        {x: pinX0, y: nt.y - 12, v: 'above', a: 'start', mw: Math.max(300, nt.x + nt.w * 0.6 - pinX0), lead: true},
      ], make: elemChip('pinpoint', C.com, C.comInk, C.comSoft), around: B.pinpoint, color: C.com}));
      // passage: in the gap before the gutter above the crossing, or on the page just above/below the passage block
      // the space above the crossing reaches to the pinpoint's leader (or the tab tip)
      const pinLab = elLabels.find(x => x.node.attrs.name === 'el-pinpoint');
      const crossR = (pinLab && pinLab.lead ? Math.min(pinLab.lead[0].x, pinLab.lead[1].x) : nt.x + note.tab.x) - 14;
      if (labelOf(p, 'passage')) elLabels.push(placeLabel({primary: [
        {x: gapX0, y: pasY - 16, v: 'above', a: 'start', mw: gapX1 - gapX0},
        {x: gapX0, y: pasY - 16, v: 'above', a: 'start', mw: crossR - gapX0},
        {x: B.passage.x + B.passage.w, y: B.passage.y - 6, v: 'above', a: 'end', mw: B.passage.w * 0.8},
        {x: gapX0, y: pasY + 24, a: 'start', mw: gapX1 - gapX0},
        {x: B.passage.x + B.passage.w, y: B.passage.y + B.passage.h + 6, a: 'end', mw: B.passage.w * 0.8},
      ], make: elemChip('passage', C.src, C.srcInk, C.srcSoft), around: B.passage, color: C.src, extraObs: passageTexts, ignore: [B.source],
      // its leader may cross the page margin but never the other passages' text or the page heading
      leadBlock: passageTexts.filter(q => !(q.y >= B.passage.y - 1 && q.y + q.h <= B.passage.y + B.passage.h + 1))}));
      if (labelOf(p, 'note')) elLabels.push(placeLabel({primary: [
        {x: B.note.x + B.note.w, y: B.note.y + B.note.h + 12, a: 'end', mw: B.note.w},
        {x: B.note.x + B.note.w + 12, y: B.note.y + 6, a: 'start', mw: P.stage.w - B.note.x - B.note.w - 18},
        {x: B.note.x, y: B.note.y + B.note.h + 12, a: 'start', mw: B.note.w},
      ], make: elemChip('note', C.com, C.comInk, '#fff'), around: B.note, color: C.com}));
    }


    if (showKey) {
      const pgB = pg.y + pg.h + 10;
      mkState('st-src', t.unchanged, C.src, C.src, th.card, [
        {x: pg.x + 4, y: pgB, a: 'start'}, {x: pg.x + pg.w / 2, y: pgB, a: 'middle'}, {x: pg.x + pg.w - 4, y: pgB, a: 'end'},
        {x: pg.x + pg.w - 4, y: pg.y - 10, v: 'above', a: 'end'},
      ], Math.max(pg.w, 420), B.source);
      // under the card, or under the card's own name label when that hangs below it
      const noteLab = elLabels.find(x => x.node.attrs.name === 'el-note');
      const nb = noteLab && noteLab.box.y >= nt.y + nt.h - 2 && noteLab.box.x < nt.x + nt.w && noteLab.box.x + noteLab.box.w > nt.x ? noteLab.box.y + noteLab.box.h + 8 : nt.y + nt.h + 10;
      mkState('st-note', t.attributedState, C.com, C.comInk, C.comSoft, [
        {x: nt.x + nt.w, y: nb, a: 'end'}, {x: nt.x, y: nb, a: 'start'}, {x: nt.x + nt.w / 2, y: nb, a: 'middle'},
        {x: nt.x + nt.w, y: nt.y - 10, v: 'above', a: 'end'},
      ], Math.max(nt.w, 420), B.note);
    }

    // relation labels beside their connector (dotted leader when moved off the line)
    const relLabels = conns.map((x, i) => {
      if (!showAll) return null;
      const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
      const color = kindColor(ctx, x.rel.kind);
      const cands = [];
      const crossing = (x.c.from.x - gutterBox.x) * (x.c.to.x - gutterBox.x) < 0 && Math.abs(x.c.from.y - x.c.to.y) < 80;
      if (crossing) {
        const gx = gutterBox.x + gutterBox.w / 2;
        const yy = (x.c.from.y + x.c.to.y) / 2;
        for (const d of [30, 48, 70, 96]) cands.push({q: {x: gx, y: yy}, x: gx, y: yy + d}, {q: {x: gx, y: yy}, x: gx, y: yy - d});
      }
      for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
        const q = x.c.at(tt);
        const q0 = x.c.at(Math.max(0, tt - 0.02)), q1 = x.c.at(Math.min(1, tt + 0.02));
        const len = Math.hypot(q1.x - q0.x, q1.y - q0.y) || 1;
        const n = {x: -(q1.y - q0.y) / len, y: (q1.x - q0.x) / len};
        for (const d of [30, 50, 74, 100, 130, 170]) for (const sg of [1, -1]) cands.push({q, x: q.x + n.x * d * sg, y: q.y + n.y * d * sg});
      }
      const make = c => {
        const probeC = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: 240, size: LS - 2, minSize: (LS - 2) * 0.85, maxLines: 2});
        const cc = chip(ctx, text, {x: c.x, y: c.y - probeC.box.h / 2, anchor: 'middle', maxWidth: 240, size: LS - 2, minSize: (LS - 2) * 0.85, maxLines: 2, fill: th.card, stroke: color, weight: 600});
        return {...cc, q: c.q};
      };
      // a leader from the connector to the label may not run through another label
      const labelBoxes = labels.map(q => q.box);
      const leadOk = c => {
        const b = make(c).box;
        const e = {x: clamp(c.q.x, b.x, b.x + b.w), y: clamp(c.q.y, b.y, b.y + b.h)};
        return Math.hypot(e.x - c.q.x, e.y - c.q.y) <= 8 || !labelBoxes.some(bx => segmentHitsBox(c.q, e, bx, 3));
      };
      const okCands = cands.filter(leadOk);
      const res = placeFirst(okCands.length ? okCands : cands, make, {obstacles: [...obstacles, ...passageTexts, ...labelBoxes], points: [...connPts, ...routePts, ...leaderPts], bounds, pad: 6, pointPad: 10});
      labels.push(res);
      const b = res.box;
      const ex = clamp(res.q.x, b.x, b.x + b.w), ey = clamp(res.q.y, b.y, b.y + b.h);
      if (Math.hypot(ex - res.q.x, ey - res.q.y) > 8) leaderPts.push(...sampleSeg(res.q, {x: ex, y: ey}));
      const lead = Math.hypot(ex - res.q.x, ey - res.q.y) > 8
        ? g(null, h('line', {x1: r(res.q.x), y1: r(res.q.y), x2: r(ex), y2: r(ey), stroke: color, 'stroke-width': 2.2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round'}), h('circle', {cx: r(res.q.x), cy: r(res.q.y), r: 4.5, fill: color}))
        : null;
      return {node: g({name: `rlab${i}`, opacity: 0}, lead, res.node), box: b, clean: res.clean};
    });

    // focus overlays (exact copies that enlarge while the marker passes)
    const fxPassage = g({name: 'fx-passage', opacity: 0},
      h('path', {d: roundRectPath(pg.x + 4, B.passage.y - 4, B.passage.x + B.passage.w + 4 - pg.x - 4, B.passage.h + 8, 8), fill: th.paper, stroke: C.src, 'stroke-width': 3}),
      h('path', {d: roundRectPath(B.passage.x, B.passage.y, B.passage.w, B.passage.h, 6), fill: C.srcSoft}),
      showAll ? textBlock(pas.fit, {x: pg.x + pas.textX, y: pg.y + pas.textY, fill: th.ink}) : null,
      showAll ? textBlock(ctx.fit(pinLabel(li), {maxWidth: page.padL - 6, size: pg.text * 1.02, minSize: 11, maxLines: 1, weight: 700, family: 'serif'}), {x: pg.x + pas.mark.x, y: pg.y + pas.mark.y, anchor: 'middle', fill: C.src}) : null);
    const fxPin = tabCopy(ctx, 'fx-pinpoint', {x: nt.x + note.tab.x, y: nt.y + note.tab.y, w: note.tab.w, h: note.tab.h}, pinLabel(li), C.com, C.comInk, C.link);

    return {
      P, s, ox, oy, screen, shelfL, shelfR, page, note, pas, boxes, graph, route, tracer, relLabels, labels, states, legend,
      gutterBox, noteStartX, fxPassage, fxPin, li, rels, nt, elLabels,
      // how far each gather-state chip sits from the object it describes (a chip under a name label
      // hanging below its object counts from that label), and its line count
      stateInfo: states.map(q => {
        const nm = q.node && q.node.attrs && q.node.attrs.name;
        const noteLab = elLabels.find(x => x.node.attrs.name === 'el-note');
        const anchor = nm === 'st-src' ? B.source : nm === 'st-note' ? (noteLab && noteLab.box.y >= nt.y + nt.h - 2 ? {x: Math.min(nt.x, noteLab.box.x), y: nt.y, w: Math.max(nt.x + nt.w, noteLab.box.x + noteLab.box.w) - Math.min(nt.x, noteLab.box.x), h: noteLab.box.y + noteLab.box.h - nt.y} : B.note) : {x: gutterBox.x + gutterBox.w / 2 - 1, y: pasY - 1, w: 2, h: 2};
        const bx = q.box;
        const dx = Math.max(anchor.x - (bx.x + bx.w), 0, bx.x - (anchor.x + anchor.w)), dy = Math.max(anchor.y - (bx.y + bx.h), 0, bx.y - (anchor.y + anchor.h));
        return {name: nm, gap: Math.round(Math.hypot(dx, dy)), lines: q.fit ? q.fit.lines.length : 0, size: q.fit ? q.fit.size : 0};
      }),
      labelSize: LS,
      // labels that found no collision-free place (drawn at their least-overlapping candidate)
      uncleanLabels: labels.filter(q => !q.clean).map(q => (q.node && q.node.attrs && q.node.attrs.name) || (q.fit && q.fit.full) || '?'),
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = fpcColors(ctx);
    const {P} = L;
    const gb = L.gutterBox;
    const gutter = g({name: 'gutter', opacity: 0},
      h('rect', {x: gb.x, y: gb.y, width: gb.w, height: gb.h, rx: 8, fill: th.dark ? 'rgba(255,255,255,0.06)' : 'rgba(31,35,40,0.05)'}),
      h('line', {x1: gb.x, x2: gb.x, y1: gb.y, y2: gb.y + gb.h, stroke: th.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '10 9'}),
      h('line', {x1: gb.x + gb.w, x2: gb.x + gb.w, y1: gb.y, y2: gb.y + gb.h, stroke: th.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '10 9'}));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      gutter,
      g({name: 'shl-T'}, L.shelfL.node),
      g({name: 'shr-T'}, L.shelfR.node),
      g({name: 'scr-T'}, L.screen.node),
      g({name: 'src-T', transform: T(P.page.x, P.page.y)}, L.page.node),
      L.graph.node,
      g({name: 'note-T'}, L.note.node),
      L.fxPassage,
      L.fxPin,
      L.elLabels.map(x => g({name: `${x.node.attrs.name || 'el'}-w`, opacity: 0}, x.node)),
      L.relLabels.map(x => x && x.node),
      L.states.map(x => x.node),
      L.legend && L.legend.node,
      L.tracer,
      // the passage outline on the page marks it as a component from the start
      h('path', {name: 'pas-outline', d: roundRectPath(L.boxes.passage.x - 3, L.boxes.passage.y - 3, L.boxes.passage.w + 6, L.boxes.passage.h + 6, 8), fill: 'none', stroke: C.src, 'stroke-width': 2.5, 'stroke-dasharray': '6 5', opacity: 0}),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const {P} = L;
    const nodes = {};
    const S = w => seg(u, ...W[w]);
    const E = w => ease.inOutCubic(S(w));
    // --- separate
    const open = E('open');
    const half = (P.shelfR.x - (P.shelfL.x + P.shelfL.w)) / 2;
    nodes['shl-T'] = {transform: T(half * (1 - open), 0)};
    nodes['shr-T'] = {transform: T(-half * (1 - open), 0)};
    const rise = E('rise');
    // the panel rises into place without dipping over the shelves that open below it
    const riseD = clamp(Math.min(P.shelfL.y, P.shelfR.y) - (P.search.y + P.search.h) - 4, 0, 40);
    nodes['scr-T'] = {transform: T(0, riseD * (1 - rise)), opacity: r(clamp(S('rise') * 1.6), 3)};
    Object.assign(nodes, L.screen.frame({typed: S('type'), rows: [S('rows'), clamp(S('rows') * 1.4 - 0.2)], hl: [0, 0], link: 0}));
    const slide = E('slide');
    const nx = lerp(L.noteStartX, L.nt.x, slide);
    nodes['note-T'] = {transform: T(nx, L.nt.y)};
    nodes.gutter = {opacity: r(S('gutter'), 3)};
    const labP = r(S('labels'), 3);
    for (const x of L.elLabels) nodes[`${x.node.attrs.name}-w`] = {opacity: labP};
    nodes['pas-outline'] = {opacity: labP};
    nodes[`src-hl-${L.li}`] = {opacity: labP};
    // --- relate: connectors one by one, in the supplied order
    const n = L.graph.conns.length;
    const rp = S('relate');
    const drawn = L.graph.conns.map((_, i) => clamp(rp * n - i));
    Object.assign(nodes, L.graph.frame(i => drawn[i]));
    L.relLabels.forEach((x, i) => { if (x) nodes[`rlab${i}`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45), 3)}; });
    if (L.legend) nodes.legend = {opacity: r(S('legend'), 3)};
    // --- trace
    const tp = S('trace');
    const tr = L.route.poly.at(ease.inOutSine(tp));
    const tracerOn = u >= W.trace[0] - 0.005 && u < W.states[1];
    nodes.tracer = {transform: T(tr.x, tr.y), opacity: tracerOn ? r(Math.min(1, (u - W.trace[0] + 0.005) / 0.01), 3) : 0};
    const te = ease.inOutSine(tp);
    const visits = L.route.visits;
    const visited = u >= W.trace[0] ? visits.filter(v => te >= v.t - 1e-6).map(v => v.id) : [];
    // focus: enlarge while the marker is on (or near) the focus element
    const fv = visits.filter(v => v.id === p.focusElement);
    let focus = 0;
    // rises as the marker approaches, holds while it is on the element, eases off after it leaves
    for (const v of fv) focus = Math.max(focus, te < v.t ? clamp(1 - (v.t - te) / 0.1) : clamp(1 - (te - v.t - 0.06) / 0.1));
    if (u < W.trace[0]) focus = 0;
    focus *= 1 - seg(u, W.trace[1], W.trace[1] + 0.04);
    // a small part (the pinpoint tab) enlarges more than a whole object, so the focus reads at mobile size
    const fs = 1 + (p.focusElement === 'pinpoint' ? 0.55 : 0.3) * ease.inOutSine(focus);
    const B = L.boxes;
    const scaleOf = id => (id === p.focusElement ? fs : 1);
    const cen = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    const sc = (id, name) => {
      const c = cen(B[id]);
      return {transform: scaleAbout(c.x, c.y, scaleOf(id))};
    };
    // whole-object focus scales the object's own group; parts use their overlay copy
    if (p.focusElement === 'search') nodes['scr-T'].transform = `${nodes['scr-T'].transform} ${scaleAbout(B.search.x + B.search.w / 2, B.search.y + B.search.h / 2, fs)}`;
    if (p.focusElement === 'sourceShelf') nodes['shl-T'].transform = `${nodes['shl-T'].transform} ${sc('sourceShelf').transform}`;
    if (p.focusElement === 'commentaryShelf') nodes['shr-T'].transform = `${nodes['shr-T'].transform} ${sc('commentaryShelf').transform}`;
    if (p.focusElement === 'source') nodes['src-T'] = {transform: `${sc('source').transform} ${T(P.page.x, P.page.y)}`};
    if (p.focusElement === 'note') nodes['note-T'].transform = `${sc('note').transform} ${nodes['note-T'].transform}`;
    const fxPas = p.focusElement === 'passage' && focus > 0;
    const fxPin = p.focusElement === 'pinpoint' && focus > 0;
    nodes['fx-passage'] = {opacity: fxPas ? 1 : 0, ...(p.focusElement === 'passage' ? sc('passage') : {})};
    nodes['fx-pinpoint'] = {opacity: fxPin ? 1 : 0, ...(p.focusElement === 'pinpoint' ? sc('pinpoint') : {})};
    // the enlarged copy replaces the original while shown (no double print)
    if (ctx.show('all')) {
      nodes[`src-pt-${L.li}`] = {opacity: fxPas ? 0 : 1};
      nodes[`src-pm-${L.li}`] = {opacity: fxPas ? 0 : 1};
      nodes['note-pp0'] = {opacity: fxPin ? 0 : 1};
    }
    // --- gather: descriptive states
    const st = r(S('states'), 3);
    for (const x of L.states) nodes[x.node.attrs.name] = {opacity: st};

    // semantics
    const toD = q => ({x: r(L.ox + q.x * L.s), y: r(L.oy + q.y * L.s)});
    const edgeGap = (pt, b) => {
      const dx = Math.max(b.x - pt.x, 0, pt.x - (b.x + b.w)), dy = Math.max(b.y - pt.y, 0, pt.y - (b.y + b.h));
      return Math.hypot(dx, dy);
    };
    const connectorGaps = L.graph.conns.map(x => r(Math.max(edgeGap(x.c.from, B[x.rel.from]), edgeGap(x.c.to, B[x.rel.to]))));
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const pageRight = P.page.x + P.page.w;
    return {
      nodes,
      semantic: {
        beat,
        separated: r(slide, 3),
        noteGap: r(nx - pageRight),
        tabGap: r(nx + L.note.tab.x - pageRight),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracer: toD(tr),
        tracerVisible: tracerOn,
        visitOrder: visited,
        focusScale: r(fs, 3),
        connectorGaps,
        arrows: L.graph.conns.map(x => ({kind: x.rel.kind, arrow: LINK_STYLES[x.rel.kind].arrow})),
        crossesGutter: L.graph.conns.filter(x => (x.c.from.x - L.gutterBox.x) * (x.c.to.x - L.gutterBox.x) < 0).map(x => `${x.rel.from}>${x.rel.to}`),
        statesShown: st,
        labelsClean: L.relLabels.every(x => !x || x.clean),
        uncleanLabels: L.uncleanLabels,
        stateInfo: L.stateInfo,
        labelSize: L.labelSize,
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
    slug: 'research-06-mechanism',
    title: 'Primary source and commentary — anatomy of a linked side note',
    titleEs: 'Fuente primaria y comentario — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Fuente primaria y comentario',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded reading spread split by a gutter: source-text shelf and page on one side, commentary shelf and card on the other, catalogue search above. Only the supplied relationships are drawn (search results, shelving, pinpoint → passage); a marker follows the traversal order and the pinpoint enlarges. Ends with source unchanged, interpretation attributed, linked not merged.',
    tags: ['research', 'primary source', 'commentary', 'pinpoint', 'passage', 'gutter', 'library', 'search', 'mechanism', 'relations'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/fuente-primaria-y-comentario.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: FPC_STRINGS,
  scene,
});
