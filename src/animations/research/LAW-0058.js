/**
 * LAW-0058 — Lectura de sumario · mechanism
 *
 * Storyboard (a research loop laid out as a ring, not a row of boxes):
 *  0.00–0.18 separate  The summary card sits on top of the decision text and
 *                      the pointed passage sits in its slot. The card slides
 *                      off to its own place; the passage lifts out of the
 *                      decision as a separate slip, leaving a dashed empty
 *                      slot. Search box and library shelf fade in.
 *  0.18–0.43 relate    Only the supplied relationships are drawn, edge-anchored
 *                      and styled by kind (search → card: communication with
 *                      an arrow; the rest plain relations without arrows —
 *                      "points to" is a reference, not causation).
 *  0.43–0.75 trace     A tracer follows the supplied traversal order; each
 *                      element swells as it is visited (the focus element
 *                      most). Leaving the card, its pointer pill lights; on
 *                      arriving at the passage, the highlighter sweeps it.
 *  0.75–1.00 gather    Everything stays anchored: origin (search), summary,
 *                      located passage, its empty slot in the decision and
 *                      the library are all visible, with a kind legend.
 * @module animations/research/LAW-0058
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, edgeAnchor, polyline} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {sumarioContentFields, MECH_IDS, SUMARIO_STRINGS} from './kits/lectura-de-sumario-fields.js';
import {summaryCard, decisionPanel, passageSlip, libraryShelf, searchScreen, pairWidth} from './kits/lectura-de-sumario.js';

const ID = 'LAW-0058';
const DURATION = 7000;
const IDS = MECH_IDS;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const sceneSchema = {...sumarioContentFields, ...mechanismFields(IDS)};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  query: 'notice letter Day 3',
  sources: {library: 'Case library', volume: 'Vol. 12', database: 'Case search (fictional)'},
  citations: {decision: 'FD-118', paragraph: 3},
  dates: {decision: 'Day 12'},
  summaryText: 'The decision discusses the notice letter that Party A sent on Day 3.',
  passageText: 'The panel reviewed the letter dated Day 3 and the reply sent by Party B.',
  elements: [
    {id: 'search', label: 'Search box'},
    {id: 'card', label: 'Summary card'},
    {id: 'passage', label: 'Summarised passage'},
    {id: 'document', label: 'Decision text'},
    {id: 'library', label: 'Library volume'},
  ],
  relationships: [
    {from: 'search', to: 'card', kind: 'communication', label: 'returns'},
    {from: 'card', to: 'passage', kind: 'relation', label: 'points to'},
    {from: 'passage', to: 'document', kind: 'relation', label: 'part of'},
    {from: 'document', to: 'library', kind: 'relation', label: 'kept in'},
    {from: 'search', to: 'library', kind: 'relation', label: 'indexes'},
  ],
  focusElement: 'card',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['search', 'card', 'passage', 'document', 'library'],
};

/**
 * Hand-placed boxes per shape: [x, y, w, h] (design units) and the preferred
 * caption side. The ring runs search → card → passage → document → library →
 * search. Captions are then placed by `placeCaptions` on a side that no
 * connector uses (preferred side first).
 */
const PLACES = {
  landscape: {
    size: [2000, 1040],
    search: [60, 60, 600, 204, 'below-left'], card: [1330, 70, 460, 214, 'above-left'], passage: [1440, 570, 500, 196, 'below'],
    document: [820, 370, 370, 550, 'below'], library: [70, 520, 390, 380, 'below'], legend: [1000, 1018],
  },
  square: {
    size: [1400, 1200],
    search: [30, 50, 540, 196, 'below-left'], card: [860, 64, 440, 204, 'above-left'], passage: [1024, 610, 356, 176, 'below'],
    document: [520, 520, 270, 500, 'below'], library: [20, 600, 262, 350, 'below'], legend: [700, 1176],
  },
  portrait: {
    size: [960, 1760],
    search: [40, 150, 880, 190, 'above-left'], card: [520, 560, 400, 190, 'above-right'], passage: [480, 1020, 440, 170, 'below-right'],
    document: [60, 1180, 320, 460, 'below'], library: [40, 600, 300, 300, 'right-bottom'], legend: [480, 1738],
  },
};
const SIDES = ['below', 'above', 'below-left', 'below-right', 'above-left', 'above-right', 'right', 'left', 'right-bottom', 'left-bottom', 'right-top', 'left-top'];
const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const inBox = (q, b, pad = 0) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;

/**
 * Pure geometry of the mechanism for one shape (used for the current view,
 * and for all three shapes to report label/connector clearance).
 */
function geometry(ctx, shape) {
  const p = ctx.params;
  const th = ctx.theme;
  const Pl = PLACES[shape];
  const S = {w: Pl.size[0], h: Pl.size[1]};
  const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
  const box = id => ({x: Pl[id][0], y: Pl[id][1], w: Pl[id][2], h: Pl[id][3], side: Pl[id][4]});
  const elements = Object.fromEntries(IDS.map(id => [id, {box: (({x, y, w, h: hh}) => ({x, y, w, h: hh}))(box(id))}]));
  const graphOpts = {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize: 26, chipMax: 280, separateLabels: true, bounds: {x: 0, y: 0, w: S.w, h: S.h - 50}, bend: rel => (rel.kind === 'communication' ? -0.14 : 0.08)};
  // 1) connectors only depend on the element boxes: sample them first
  const dry = relationGraph(ctx, {...graphOpts, obstacles: []});
  const samples = dry.conns.map(x => {
    const n = Math.max(8, Math.ceil(x.c.total / 12));
    return Array.from({length: n + 1}, (_, i) => x.c.at(i / n));
  });
  const onLine = b => samples.some(pts => pts.some(q => inBox(q, b, 10)));
  const elementBoxes = Object.values(elements).map(e => e.box);
  const inside = b => b.x >= 8 && b.x + b.w <= S.w - 8 && b.y >= 8;
  // 2) captions: preferred side first, then any side clear of elements,
  //    other captions and every connector
  const labels = [];
  const captionBoxes = [];
  const size = shape === 'square' ? 30 : 28;
  const tryPlace = (make, sides) => {
    let best = null;
    for (const side of sides) {
      const c = make(side);
      if (!c) continue;
      const b = c.box;
      const bad = (inside(b) ? 0 : 3) + elementBoxes.filter(e => hit(b, e, 8)).length * 2 + captionBoxes.filter(q => hit(b, q, 10)).length * 2 + (onLine(b) ? 2 : 0);
      if (!best || bad < best.bad) best = {c, bad, side};
      if (bad === 0) break;
    }
    return best;
  };
  const at = (b, side, h) => {
    const above = b.y - h - 14, below = b.y + b.h + 14;
    return {
      below: {x: b.x + b.w / 2, y: below, anchor: 'middle'},
      above: {x: b.x + b.w / 2, y: above, anchor: 'middle'},
      'below-left': {x: b.x - 4, y: below, anchor: 'start'},
      'below-right': {x: b.x + b.w + 4, y: below, anchor: 'end'},
      'above-left': {x: b.x - 4, y: above, anchor: 'start'},
      'above-right': {x: b.x + b.w + 4, y: above, anchor: 'end'},
      right: {x: b.x + b.w + 16, y: b.y + b.h / 2 - h / 2, anchor: 'start'},
      left: {x: b.x - 16, y: b.y + b.h / 2 - h / 2, anchor: 'end'},
      'right-bottom': {x: b.x + b.w + 16, y: b.y + b.h - h, anchor: 'start'},
      'left-bottom': {x: b.x - 16, y: b.y + b.h - h, anchor: 'end'},
      'right-top': {x: b.x + b.w + 16, y: b.y, anchor: 'start'},
      'left-top': {x: b.x - 16, y: b.y, anchor: 'end'},
    }[side];
  };
  const widthFor = (b, side) => (side.startsWith('right') ? S.w - b.x - b.w - 24 : side.startsWith('left') ? b.x - 24 : side.includes('-') ? Math.max(260, b.w * 0.7) : Math.max(260, b.w + 40));
  for (const id of IDS) {
    if (!ctx.show('key')) break;
    const b = box(id);
    const pair = id === 'library' && p.sources.volume;
    const text = pair ? `${label(id)} · ${p.sources.volume}` : label(id);
    const stroke = id === p.focusElement ? th.accent3 : th.ink;
    // each side is tried at full width, then narrower (more lines)
    const make = variant => {
      const [side, f] = variant;
      let maxW = Math.min(420, widthFor(b, side)) * f;
      if (maxW < 150) return null;
      if (pair) maxW = pairWidth(ctx, label(id), p.sources.volume, maxW, size);
      const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: maxW, size, maxLines: 4, name: `lab-${id}`, stroke});
      if (probe.fit.truncated) return null;
      return chip(ctx, text, {...at(b, side, probe.box.h), maxWidth: maxW, size, maxLines: 4, name: `lab-${id}`, stroke});
    };
    const sides = [b.side, ...SIDES.filter(x => x !== b.side)];
    const best = tryPlace(make, [1, 0.72, 0.52].flatMap(f => sides.map(sd => [sd, f])));
    labels.push(best.c);
    captionBoxes.push(best.c.box);
  }
  // 3) status tag for the located passage: next to the slip, clear of every
  //    connector end and caption
  const Q = box('passage');
  let tag = null;
  if (ctx.show('key')) {
    const pc = labels[IDS.indexOf('passage')];
    const makeTag = side => {
      const probe = statusTag(ctx, ctx.t.located, {x: 0, y: 0, size: 26, name: 'tag-located', color: th.accent4, opacity: 0});
      const hh = probe.box.h, ww = probe.box.w;
      const cap = pc && pc.box;
      const pos = cap && side.startsWith('under-caption')
        ? {x: side.endsWith('right') ? cap.x + cap.w : side.endsWith('left') ? cap.x : cap.cx, y: cap.y + cap.h + 10, anchor: side.endsWith('right') ? 'end' : side.endsWith('left') ? 'start' : 'middle'}
        : cap && side === 'over-caption'
          ? {x: cap.cx, y: cap.y - hh - 10, anchor: 'middle'}
          : side.startsWith('under') || side.startsWith('over') ? null : at(Q, side, hh);
      if (!pos) return null;
      if (pos.anchor === 'start' && pos.x + ww > S.w - 8) return null;
      return statusTag(ctx, ctx.t.located, {...pos, size: 26, name: 'tag-located', color: th.accent4, opacity: 0});
    };
    const best = tryPlace(makeTag, ['under-caption', 'under-caption-right', 'under-caption-left', 'right', 'above-right', 'below-right', 'over-caption', 'left', 'above-left', 'below-left']);
    tag = best.c;
    captionBoxes.push(tag.box);
  }
  // 4) relation labels: clear of captions and the tag; a label whose
  //    connector is short is pushed beside its line so the line stays visible
  const lineBoxes = [];
  dry.conns.forEach((x, i) => {
    const len = Math.hypot(x.c.to.x - x.c.from.x, x.c.to.y - x.c.from.y);
    const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
    const labW = ctx.measure(text, 26, 600, 'sans') + 32;
    if (len - labW < 110) samples[i].forEach(q => lineBoxes.push({x: q.x - 5, y: q.y - 5, w: 10, h: 10}));
  });
  const graph = relationGraph(ctx, {...graphOpts, obstacles: [...captionBoxes, ...lineBoxes]});
  const relLabelBoxes = graph.conns.filter(x => x.lab).map(x => x.lab.box);
  // clearance facts (for tests): no connector end under any label, and no
  // caption / tag across a connector
  const allLabels = [...captionBoxes, ...relLabelBoxes];
  const endsClear = graph.conns.every(x => !allLabels.some(b => inBox(x.c.from, b, 4) || inBox(x.c.to, b, 4)));
  const captionsClear = !captionBoxes.some(b => onLine(b));
  return {S, Pl, box, label, elements, labels, tag, graph, endsClear, captionsClear, captionBoxes};
}

/* Tracer route ------------------------------------------------------------ */
/** Perimeter parameter (clockwise from the top-left corner) of q on rect R. */
function perimOf(R, q) {
  const x = Math.min(R.x + R.w, Math.max(R.x, q.x)), y = Math.min(R.y + R.h, Math.max(R.y, q.y));
  const d = [y - R.y, R.x + R.w - x, R.y + R.h - y, x - R.x]; // top, right, bottom, left
  const e = d.indexOf(Math.min(...d));
  return e === 0 ? x - R.x : e === 1 ? R.w + (y - R.y) : e === 2 ? R.w + R.h + (R.x + R.w - x) : 2 * R.w + R.h + (R.y + R.h - y);
}
function perimPoint(R, s) {
  const P = 2 * (R.w + R.h);
  const t = ((s % P) + P) % P;
  if (t <= R.w) return {x: R.x + t, y: R.y};
  if (t <= R.w + R.h) return {x: R.x + R.w, y: R.y + (t - R.w)};
  if (t <= 2 * R.w + R.h) return {x: R.x + R.w - (t - R.w - R.h), y: R.y + R.h};
  return {x: R.x, y: R.y + R.h - (t - 2 * R.w - R.h)};
}
/** Points walking round rect R from a to b in direction dir (+1 clockwise). */
function perimWalk(R, a, b, dir) {
  const P = 2 * (R.w + R.h);
  const s1 = perimOf(R, a), s2 = perimOf(R, b);
  const dist = dir > 0 ? (s2 - s1 + P) % P : (s1 - s2 + P) % P;
  const corners = [0, R.w, R.w + R.h, 2 * R.w + R.h]
    .map(c => ({c, k: dir > 0 ? (c - s1 + P) % P : (s1 - c + P) % P}))
    .filter(q => q.k > 0.5 && q.k < dist - 0.5)
    .sort((m, n) => m.k - n.k);
  return {pts: [perimPoint(R, s1), ...corners.map(q => perimPoint(R, q.c)), perimPoint(R, s2)], len: dist};
}

/**
 * Tracer route through the traversal order that never crosses printed text:
 * it rides along each connector (edge anchor to edge anchor) and, between two
 * connectors, walks round the element's outline (on the side that crosses
 * fewer captions / relation labels, else the shorter one).
 * @returns {{poly:any, visits:{id:string,t:number}[]}}
 */
function outlineRoute(elements, conns, order, avoid, pad = 18) {
  const pts = [];
  const visits = [];
  const push = q => { const last = pts[pts.length - 1]; if (!last || Math.hypot(last.x - q.x, last.y - q.y) > 0.01) pts.push({x: q.x, y: q.y}); };
  const centre = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
  const ring = b => ({x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2});
  const hits = list => {
    let n = 0;
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1], b = list[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 10));
      for (let k = 0; k <= steps; k++) {
        const q = {x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps};
        if (avoid.some(bx => inBox(q, bx, 6))) n++;
      }
    }
    return n;
  };
  const around = (id, from, to) => {
    const R = ring(elements[id].box);
    const cw = perimWalk(R, from, to, 1), ccw = perimWalk(R, from, to, -1);
    const score = w => hits(w.pts) * 1000 + w.len;
    return score(cw) <= score(ccw) ? cw.pts : ccw.pts;
  };
  const legs = [];
  for (let i = 1; i < order.length; i++) {
    const prev = order[i - 1], id = order[i];
    if (!elements[prev] || !elements[id]) continue;
    const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    let leg;
    if (link) {
      const fwd = link.rel.from === prev;
      const n = 30;
      leg = Array.from({length: n + 1}, (_, k) => link.c.at(fwd ? k / n : 1 - k / n));
    } else {
      const A = elements[prev].box, B = elements[id].box;
      leg = [edgeAnchor(A, centre(B), 8), edgeAnchor(B, centre(A), 8)];
    }
    legs.push({prev, id, leg});
  }
  if (!legs.length) {
    const b = elements[order[0]].box;
    return {poly: polyline([centre(b)]), visits: [{id: order[0], t: 0}]};
  }
  // start on the first element's outline, where its first connector leaves
  push(legs[0].leg[0]);
  visits.push({id: legs[0].prev, idx: 0});
  let at = legs[0].leg[0];
  legs.forEach((L, i) => {
    if (i > 0) around(L.prev, at, L.leg[0]).forEach(push);
    L.leg.forEach(push);
    at = L.leg[L.leg.length - 1];
    visits.push({id: L.id, idx: pts.length - 1});
  });
  const poly = polyline(pts);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  return {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
}

/** Tracer: a solid dot with a ring and a soft halo (reads at phone size). */
function tracerMark(ctx, name) {
  const th = ctx.theme;
  return g({name, opacity: 0},
    h('circle', {r: 30, fill: th.accent, opacity: 0.18}),
    h('circle', {r: 21, fill: 'none', stroke: th.accent, 'stroke-width': 3, opacity: 0.6}),
    h('circle', {r: 13, fill: th.accent, stroke: th.paper, 'stroke-width': 4}));
}

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const Gm = geometry(ctx, shape);
    const {Pl, box, labels, graph, tag} = Gm;
    const S = {...Gm.S};
    const n = p.citations.paragraph;
    const elements = Gm.elements;

    // --- decision text (the slot of the passage empties when the slip lifts)
    const D = box('document');
    // The passage text itself travels on the slip; the decision keeps only its
    // ¶ number and an empty (then dashed) slot.
    const doc = decisionPanel(ctx, {prefix: 'doc', w: D.w, h: D.h, paragraphs: [1, 2, 3, 4], target: n, passage: '', header: {decision: p.citations.decision, date: p.dates.decision}, showText: showAll, crease: false, highlights: []});
    const slot = doc.blocks[n];
    // the ghost covers only the text column: the ¶ number stays in the decision
    const gx = D.x + 52 * (D.w / 380);
    const ghost = h('path', {name: 'slot-ghost', d: roundRectPath(gx, D.y + slot.y + 2, D.x + D.w - 8 - gx, slot.h - 4, 8), fill: th.paper, stroke: th.accent3, 'stroke-width': 3, 'stroke-dasharray': '9 7', opacity: 0});
    const docNode = g({name: 'el-document', transform: T(D.x, D.y)}, g({name: 'el-document-body'}, doc.node));

    // --- summary card (starts lying on top of the decision's header)
    const C = box('card');
    const card = summaryCard(ctx, {prefix: 'card', w: C.w, h: C.h, header: ctx.t.summary, decision: p.citations.decision, date: p.dates.decision, summary: p.summaryText, pointer: n, showText: showAll});
    const pb = card.boxes.pointer;
    const glow = h('path', {name: 'ptr-glow', d: roundRectPath(pb.x - 7, pb.y - 7, pb.w + 14, pb.h + 14, (pb.h + 14) / 2), fill: 'none', stroke: th.accent3, 'stroke-width': 6, opacity: 0});
    const cardNode = g({name: 'el-card'}, g({name: 'el-card-body'}, card.node, glow));
    // the summary starts as a headnote resting on the decision's top edge
    const cardStart = {k: (D.w - 20) / C.w, x: D.x + 10, y: D.y + 4 - C.h * ((D.w - 20) / C.w)};

    // --- passage slip (starts in its slot)
    const Q = box('passage');
    const slip = passageSlip(ctx, {prefix: 'slip', w: Q.w, h: Q.h, n, text: p.passageText, showText: showAll});
    const slipNode = g({name: 'el-passage'}, g({name: 'el-passage-body'}, slip.node));
    const slipStart = {k: (D.x + D.w - 8 - gx) / Q.w, x: gx, y: D.y + slot.y + 2};

    // --- search box and library volume
    const Sx = box('search');
    const search = searchScreen(ctx, {prefix: 'srch', x: 0, y: 0, w: Sx.w, h: Sx.h, title: p.sources.database, query: p.query, decision: p.citations.decision, date: p.dates.decision, showText: showAll, mount: false, rows: 1});
    const searchNode = g({name: 'el-search', transform: T(Sx.x, Sx.y)}, g({name: 'el-search-body'}, search.node));
    const Lb = box('library');
    const shelf = libraryShelf(ctx, {prefix: 'lib', x: 0, y: 0, w: Lb.w, h: Lb.h, rows: 2, target: {row: 1, at: 0.45}, seedKey: 'sumario-mech'});
    const libNode = g({name: 'el-library', transform: T(Lb.x, Lb.y)}, g({name: 'el-library-body'}, shelf.node));

    // the tracer rides the connectors and walks round element outlines,
    // steering clear of captions, the status tag and relation labels
    const avoid = [...Gm.captionBoxes, ...graph.conns.filter(x => x.lab).map(x => x.lab.box)];
    const route = outlineRoute(elements, graph.conns, p.traversalOrder, avoid);
    // the tracer's centre never enters an element (so it never sits on printed text)
    const tracerOffText = Array.from({length: 201}, (_, i) => route.poly.at(i / 200))
      .every(q => Object.values(elements).every(e => !inBox(q, e.box, -1)));
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    // the legend sits below every caption; long captions push it (and the
    // stage) down instead of overlapping
    const lowest = Math.max(0, ...labels.map(c => c.box.y + c.box.h), tag ? tag.box.y + tag.box.h : 0, ...graph.conns.filter(x => x.lab).map(x => x.lab.box.y + x.lab.box.h));
    const legendY = Math.max(Pl.legend[1], lowest + 40);
    S.h = Math.max(S.h, legendY + 24);
    const legend = showAll ? legendNode(ctx, kinds, p.relationLabels, {x: Pl.legend[0], y: legendY}) : null;
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;

    // Every connector must start on its source element and end on its target
    // (edge-anchored; the gap equals the anchor padding, never free space).
    const edgeGap = (b, q) => {
      const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
      const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
      return Math.hypot(dx, dy);
    };
    const landing = graph.conns.map(x => ({
      from: x.rel.from, to: x.rel.to,
      gapFrom: r(edgeGap(elements[x.rel.from].box, x.c.from)),
      gapTo: r(edgeGap(elements[x.rel.to].box, x.c.to)),
    }));
    const connectorsLand = landing.every(l => l.gapFrom <= 16 && l.gapTo <= 16);
    // label clearance in every shape, not only the one on screen
    const clearance = Object.fromEntries(['landscape', 'square', 'portrait'].map(sh => {
      const q = sh === shape ? Gm : geometry(ctx, sh);
      return [sh, {endsClear: q.endsClear, captionsClear: q.captionsClear}];
    }));
    return {tracerOffText, landing, connectorsLand, clearance, S, s, ox, oy, docNode, ghost, cardNode, cardStart, C, slipNode, slip, slipStart, Q, searchNode, libNode, labels, graph, route, visitT, legend, tag,
      centers: {document: D, card: C, passage: Q, search: Sx, library: Lb}};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      // the tracer rides above the connectors but UNDER the elements, captions
      // and labels: when an element swells as it is visited, the tracer docks
      // under its edge instead of sitting on its printed text
      tracerMark(ctx, 'tracer'),
      L.libNode, L.searchNode, L.docNode, L.ghost,
      L.slipNode, L.cardNode,
      L.labels.map(c => c.node),
      L.graph.labelsNode,
      L.tag && L.tag.node,
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: card slides off the decision; the passage lifts out of its slot
    const appear = r(seg(u, 0, 0.08), 3);
    nodes['el-search'] = {opacity: appear};
    nodes['el-library'] = {opacity: appear};
    const cardMove = ease.inOutCubic(seg(u, 0.05, 0.16));
    const slipMove = ease.inOutCubic(seg(u, 0.08, 0.18));
    const C = L.C, Q = L.Q;
    const ck = lerp(L.cardStart.k, 1, cardMove);
    const cardPos = {x: lerp(L.cardStart.x, C.x, cardMove), y: lerp(L.cardStart.y, C.y, cardMove)};
    nodes['el-card'] = {transform: T(cardPos.x, cardPos.y, 0, ck)};
    const sk = lerp(L.slipStart.k, 1, slipMove);
    const slipPos = {x: lerp(L.slipStart.x, Q.x, slipMove), y: lerp(L.slipStart.y, Q.y, slipMove)};
    nodes['el-passage'] = {transform: T(slipPos.x, slipPos.y, 0, sk)};
    nodes['slot-ghost'] = {opacity: slipMove > 0.02 ? 1 : 0};
    for (const c of L.labels) nodes[c.node.attrs.name] = {opacity: r(seg(u, 0.12, 0.2), 3)};
    // 2) relations drawn one by one, in the order supplied
    const nRel = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / nRel, 0.18 + ((i + 1) * 0.25) / nRel));
    Object.assign(nodes, L.graph.frame(relP));
    // 3) tracer along the traversal order; visited elements swell (focus most)
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.78;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    for (const id of IDS) {
      const focus = id === p.focusElement ? 0.14 : 0.05;
      const k = 1 + (reduced ? focus * 0.5 : focus) * ease.inOutSine(pulse(id));
      const b = L.centers[id];
      // bodies are drawn from their own top-left; scale about their centre
      nodes[`el-${id}-body`] = {transform: scaleAbout(b.w / 2, b.h / 2, k)};
    }
    // the changing part: pointer lights as the tracer leaves the card; the
    // passage is marked once the tracer reaches it (never before)
    const vCard = L.visitT.card, vPsg = L.visitT.passage;
    const passedCard = vCard !== undefined && (u >= 0.75 || (tracerOn && tt >= vCard));
    const reached = vPsg !== undefined && (u >= 0.75 || (tracerOn && tt >= vPsg));
    nodes['ptr-glow'] = {opacity: passedCard ? 1 : 0};
    const markP = reached ? (u >= 0.75 ? 1 : clamp((tt - vPsg) / 0.08)) : 0;
    Object.assign(nodes, L.slip.frame(markP));
    // 4) gather: state tag (descriptive)
    if (L.tag) nodes['tag-located'] = {opacity: r(seg(u, 0.8, 0.88) * (markP >= 1 ? 1 : 0), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        cardAt: {x: r(cardPos.x), y: r(cardPos.y)},
        passageAt: {x: r(slipPos.x), y: r(slipPos.y)},
        passageLifted: r(slipMove, 3),
        pointerLit: passedCard,
        passageMarked: r(markP, 3),
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        relationKinds: p.relationships.map(x => x.kind),
        arrowheads: L.graph.conns.map(x => Boolean(x.c.node.children.some(ch => ch.attrs && String(ch.attrs.name || '').endsWith('-head')))),
        connectorLanding: L.landing,
        connectorsLand: L.connectorsLand,
        labelClearance: L.clearance,
        labelsClearOfConnectors: Object.values(L.clearance).every(c => c.endsClear && c.captionsClear),
        tracerOffText: L.tracerOffText,
        visitOrder: L.route.visits.map(v => v.id),
        focusElement: p.focusElement,
      },
    };
  },
};

function legendNode(ctx, kinds, labels, at) {
  const th = ctx.theme;
  const size = 28;
  const gap = 50;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': it.k === 'communication' ? '10 8' : null}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return g({name: 'legend'}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-05-mechanism',
    title: 'Reading a summary — the research loop',
    titleEs: 'Lectura de sumario — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Lectura de sumario',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded research loop: the summary card slides off the decision text and the pointed passage lifts out of its slot; search box, card, passage, decision and library volume are joined by edge-anchored connectors styled by kind (the pointer is a plain relation, not causation); a tracer follows the supplied order and the passage is marked only when the tracer arrives from the card.',
    tags: ['summary', 'sumario', 'mechanism', 'relations', 'tracer', 'passage', 'search', 'library'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/lectura-de-sumario.js', 'src/animations/research/kits/lectura-de-sumario-fields.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: SUMARIO_STRINGS,
  scene,
});
