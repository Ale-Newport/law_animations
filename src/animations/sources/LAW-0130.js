/**
 * LAW-0130 — Conflicto entre textos · mechanism
 *
 * Storyboard — an exploded "convergence" diagram (brief beats in brackets):
 *  [0.00–0.18] separate: the book (Text 1) and the article (Text 2) start
 *              side by side, as the action leaves them; they move apart to
 *              the upper corners while each provision peels out of its text
 *              as a paper slip that settles below it; the editable hierarchy
 *              board drops in between the two texts, the attributed reading
 *              card below it, and the zone of tension opens as an empty lens
 *              between the two slips.
 *  [0.18–0.43] relate: only the explicit relationships are drawn, each with
 *              its kind: plain relations (text contains provision; text sits
 *              on a user-supplied level) have no arrow, the two slips are
 *              brought to the zone as a sequence (each label sits at the
 *              midpoint of its own connector), and the reading addresses
 *              the zone as a communication. Nothing is causal unless the
 *              author supplies a causal relationship.
 *  [0.43–0.75] trace: a tracer follows the supplied traversal order along
 *              the connectors and round the elements' outlines (never over
 *              their wording); meanwhile the two provision slips slide
 *              TOWARDS EACH OTHER onto the zone's row (their connectors and
 *              labels follow them) and the zone fills as they arrive: each
 *              phrase enters the ring from its own side and they meet in the
 *              middle, where the zone is marked. Each provision's phrase is
 *              highlighted as the tracer passes, and the focus element (the
 *              zone by default) enlarges when the tracer reaches it.
 *  [0.75–1.00] gather: the mechanism holds with origin (the two texts),
 *              transformation (the highlighted phrases) and state ("zone of
 *              tension highlighted") visible, plus a legend of connector
 *              kinds. The hierarchy is displayed, never applied.
 * @module animations/sources/LAW-0130
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {dist, mix, edgeAnchor, circleAnchor, cubicPolyline, polyline} from '../../core/geometry.js';
import {mechanismFields, str} from '../../schemas/fields.js';
import {chip, statusTag, textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, kitT, stateLabel, motifColors,
  openBook, articleSheet, hierarchyBoard, readingCard, provisionSlip, fitWords, balanceFit,
} from './kits/conflicto-entre-textos.js';

const ID = 'LAW-0130';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const IDS = ['source1', 'source2', 'passage1', 'passage2', 'zone', 'hierarchy', 'reading'];

const baseMech = mechanismFields(IDS);
baseMech.relationships.items.properties.label = str('Short caption of this relationship shown on its connector (optional; the legend names the kind)', 40);
const sceneSchema = {...sourcesFields, ...baseMech};
sceneSchema.elements.description = 'Captions of the components (the scene draws all seven; ids are fixed): source1 = book (Text 1), source2 = article (Text 2), passage1/passage2 = the provisions pulled out as slips, zone = zone of tension, hierarchy = editable hierarchy board, reading = attributed reading card (array replaces the previous value)';

const defaultParams = {
  ...SOURCES_DEFAULTS,
  elements: [
    {id: 'source1', label: 'Book · Text 1'},
    {id: 'source2', label: 'Article · Text 2'},
    {id: 'passage1', label: 'Provision of Text 1'},
    {id: 'passage2', label: 'Provision of Text 2'},
    {id: 'zone', label: 'Zone of tension'},
    {id: 'hierarchy', label: 'Editable hierarchy'},
    {id: 'reading', label: 'Reading proposed'},
  ],
  relationships: [
    {from: 'source1', to: 'passage1', kind: 'relation', label: 'contains'},
    {from: 'source2', to: 'passage2', kind: 'relation', label: 'contains'},
    {from: 'passage1', to: 'zone', kind: 'sequence', label: 'brought together'},
    {from: 'passage2', to: 'zone', kind: 'sequence', label: 'brought together'},
    {from: 'hierarchy', to: 'source1', kind: 'relation', label: 'level as supplied'},
    {from: 'hierarchy', to: 'source2', kind: 'relation', label: 'level as supplied'},
    {from: 'reading', to: 'zone', kind: 'communication', label: 'addresses'},
  ],
  focusElement: 'zone',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['source1', 'passage1', 'zone', 'passage2', 'source2'],
};

const STAGES = {
  // slips: `slipW` wide; FINAL row: slip1 — zone — slip2 with `gap` between each slip and the ring;
  // `out` offsets (from the final row) are where each slip settles after peeling out of its text
  landscape: {
    W: 1880, H: 900, idMin: 23, size: 25, bsize: 27, cap: 27, rel: 24, lg: 25, cardSize: 25,
    pw: 240, ph: 290, bookSize: 21, book: {x: 250, y: 292}, art: {x: 1560, y: 140, w: 290, h: 310}, artSize: 23,
    board: {x: 630, y: 16, w: 660}, card: {x: 690, y: 300, w: 500},
    slipW: 490, rowY: 590, zoneX: 940, R: 136, gap: 134, out: [{dx: -130, dy: -44}, {dx: 130, dy: 44}],
    legend: {x: 22, y: 'bottom'},
  },
  square: {
    W: 1300, H: 1120, idMin: 29, size: 30, bsize: 33, cap: 29, rel: 30, lg: 31, cardSize: 31,
    pw: 236, ph: 262, bookSize: 25, book: {x: 256, y: 530}, art: {x: 950, y: 400, w: 330, h: 282}, artSize: 29,
    board: {x: 360, y: 16, w: 580}, card: {x: 530, y: 350, w: 340},
    slipW: 290, rowY: 800, zoneX: 650, R: 122, gap: 112, out: [{dx: -100, dy: -60}, {dx: 100, dy: 60}],
    legend: {x: 18, y: 'bottom', column: true},
  },
  portrait: {
    W: 1000, H: 1450, idMin: 19, size: 22, bsize: 25, cap: 26, rel: 23, lg: 24, cardSize: 24,
    pw: 182, ph: 290, bookSize: 18, book: {x: 232, y: 505}, art: {x: 610, y: 350, w: 330, h: 316}, artSize: 23,
    board: {x: 120, y: 16, w: 760}, card: {x: 506, y: 1400, w: 470},
    slipW: 230, rowY: 960, zoneX: 500, R: 118, gap: 122, out: [{dx: -40, dy: -230}, {dx: 40, dy: 180}],
    legend: {x: 24, y: 'bottom', column: true},
  },
};

/** Whether segment p→q crosses box b (sampled). */
function segmentHitsBox(p, q, b) {
  const n = Math.max(6, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 8));
  for (let i = 1; i < n; i++) {
    const x = p.x + ((q.x - p.x) * i) / n, y = p.y + ((q.y - p.y) * i) / n;
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
  }
  return false;
}

const boxOf = e => (e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: e.circle.r * 2, h: e.circle.r * 2} : e.box);
const centerOf = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
const anchorOf = (e, toward, pad = 8) => (e.circle ? circleAnchor(e.circle, e.circle.r + pad, toward) : edgeAnchor(e.box, toward, pad));
const hit = (a, b, pad = 0) => {
  // a circle obstacle ({cx, cy, r}) is tested as a circle, not as its bounding square
  if (b.r !== undefined) {
    const nx = Math.max(a.x, Math.min(b.cx, a.x + a.w)), ny = Math.max(a.y, Math.min(b.cy, a.y + a.h));
    return Math.hypot(nx - b.cx, ny - b.cy) < b.r + pad;
  }
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
};

/**
 * Connector geometry between two elements (same construction as the annotate connector).
 * `ends` may pin the two end points (e.g. slip top edge → ring shoulder).
 */
function connGeom(A, B, kind, bend, ends) {
  // (ends on the zone ring stand a rim's width off it: a tracer resting there stays off the chips)
  const from = ends ? ends.from : anchorOf(A, centerOf(B), A.circle ? 22 : 8);
  const to = ends ? ends.to : anchorOf(B, centerOf(A), B.circle ? 30 : kind === 'relation' ? 8 : 14);
  const dx = to.x - from.x, dy = to.y - from.y;
  const nx = -dy, ny = dx;
  const c1 = {x: from.x + dx * 0.3 + nx * bend, y: from.y + dy * 0.3 + ny * bend};
  const c2 = {x: from.x + dx * 0.7 + nx * bend, y: from.y + dy * 0.7 + ny * bend};
  const poly = cubicPolyline(from, c1, c2, to, 48);
  return {from, to, c1, c2, poly, total: poly.total, mid: poly.at(0.5), end: poly.at(1),
    d: `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`};
}

/** Walk along an element's outline (box grown by `pad`, or circle) from p to q, the short way round. */
function outlineWalk(e, p, q, pad = 11) {
  if (e.circle) {
    // the zone element's circle is the ring's settled (enlarged) size; the walk keeps outside its rim
    // at the focus peak too (never across the phrase chips inside it)
    const c = e.circle, rr = c.r + 46;
    const a0 = Math.atan2(p.y - c.y, p.x - c.x);
    let a1 = Math.atan2(q.y - c.y, q.x - c.x);
    while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
    while (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
    const n = 16;
    return [p, ...Array.from({length: n + 1}, (_, i) => ({x: c.x + rr * Math.cos(a0 + (a1 - a0) * (i / n)), y: c.y + rr * Math.sin(a0 + (a1 - a0) * (i / n))})), q];
  }
  const b = {x: e.box.x - pad, y: e.box.y - pad, w: e.box.w + pad * 2, h: e.box.h + pad * 2};
  const P = 2 * (b.w + b.h);
  const sOf = pt => {
    const x = Math.max(b.x, Math.min(pt.x, b.x + b.w)), y = Math.max(b.y, Math.min(pt.y, b.y + b.h));
    const dT = Math.abs(y - b.y), dR = Math.abs(x - (b.x + b.w)), dB = Math.abs(y - (b.y + b.h)), dL = Math.abs(x - b.x);
    const m = Math.min(dT, dR, dB, dL);
    if (m === dT) return x - b.x;
    if (m === dR) return b.w + (y - b.y);
    if (m === dB) return b.w + b.h + (b.x + b.w - x);
    return 2 * b.w + b.h + (b.y + b.h - y);
  };
  const ptOf = s => {
    s = ((s % P) + P) % P;
    if (s < b.w) return {x: b.x + s, y: b.y};
    if (s < b.w + b.h) return {x: b.x + b.w, y: b.y + s - b.w};
    if (s < 2 * b.w + b.h) return {x: b.x + b.w - (s - b.w - b.h), y: b.y + b.h};
    return {x: b.x, y: b.y + b.h - (s - 2 * b.w - b.h)};
  };
  const s0 = sOf(p);
  let s1 = sOf(q);
  if (s1 - s0 > P / 2) s1 -= P;
  if (s0 - s1 > P / 2) s1 += P;
  const n = 24;
  return [p, ...Array.from({length: n + 1}, (_, i) => ptOf(s0 + (s1 - s0) * (i / n))), q];
}

/** The stage spread `k`× wider: centred elements stay centred, edge elements keep their margins. */
function widen(S, k) {
  if (k === 1) return S;
  const W = Math.round(S.W * k), dx = W - S.W;
  const mid = (o, w) => ({...o, x: o.x + (dx * (o.x + w / 2)) / S.W});
  return {
    ...S, W,
    pw: Math.round(S.pw + dx * 0.06),
    book: {...S.book, x: S.book.x + dx * 0.16},
    art: {...S.art, x: S.art.x + dx * 0.88, w: Math.round(S.art.w + dx * 0.08)},
    board: (bw => ({...S.board, w: bw, x: S.board.x + (dx * (S.board.x + S.board.w / 2)) / S.W - (bw - S.board.w) / 2}))(Math.round(S.board.w + dx * 0.35)),
    card: {...mid(S.card, S.card.w), w: Math.round(S.card.w + dx * 0.16)},
    zoneX: S.zoneX + dx / 2,
    R: Math.round(S.R * (1 + (k - 1) * 0.7)),
    slipW: Math.round(S.slipW + dx * 0.3),
  };
}

/**
 * Vertical room for the hierarchy board: the stage positions below the board (texts, card, slip
 * row) are shifted down by what a full-size board needs beyond its default slot.
 */
function layoutShift(ctx, S0, p) {
  const C = motifColors(ctx);
  const label = (p.elements.find(e => e.id === 'hierarchy') || {label: ''}).label;
  const board = hierarchyBoard(ctx, {prefix: 'm-probe', w: S0.board.w, hier: p.hierarchy, ids: p.sources.map(x => x.id), colors: C.src, header: label, size: S0.bsize, tokScale: 0.8});
  const book = openBook(ctx, {prefix: 'm-probe-b', pw: S0.pw, ph: S0.ph, color: C.src[0], src: p.sources[0], passage: p.passages[0], passageAt: 0.45, size: S0.bookSize, seedKey: 'cet-mech-book', quiet: true, idMin: S0.idMin});
  const cap = id => (ctx.show('key') ? chip(ctx, (p.elements.find(e => e.id === id) || {label: ''}).label, {x: 0, y: 0, maxWidth: 400, size: S0.cap, minSize: S0.cap * 0.8, maxLines: 2, weight: 700}).box : {w: 0, h: 0});
  const c1 = cap('source1'), c2 = cap('source2');
  const bx = S0.book.x + book.outer.x;
  const tops = [
    {x: bx, w: c1.w, y: S0.book.y + book.outer.y - 34 - c1.h},
    {x: S0.art.x + S0.art.w - c2.w, w: c2.w, y: S0.art.y - 48 - c2.h},
  ].filter(q => q.x < S0.board.x + S0.board.w + 12 && q.x + q.w + 12 > S0.board.x).map(q => q.y);
  const budget = Math.min(S0.card.y - 26, ...tops.map(y => y - 14)) - S0.board.y;
  const dy = Math.max(0, Math.ceil(board.h - budget));
  if (!dy) return S0;
  return {...S0, book: {...S0.book, y: S0.book.y + dy}, art: {...S0.art, y: S0.art.y + dy}, card: {...S0.card, y: S0.card.y + dy}, rowY: S0.rowY + dy};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1120], portrait: [1000, 1450]},
  layout(ctx) {
    // a tall composition (long content in a square or portrait box) is spread wider — the frame is
    // height-bound, so the extra width is free — which lets the slips wrap to fewer lines
    if (ctx.view.shape === 'landscape') return scene.layoutAt(ctx, 1);
    // (a width at which every relation label finds a clear place wins over a slightly larger scale)
    // (a composition where every relation label finds a clear place wins; among those, the largest
    // scale; a little extra room between the card and the slip row is added only if labels need it)
    const pick = cands => cands.reduce((b, c) => (c.hiddenLabels.length !== b.hiddenLabels.length ? (c.hiddenLabels.length < b.hiddenLabels.length ? c : b) : (c.s > b.s ? c : b)));
    let best = pick([1, 1.12, 1.24, 1.36, 1.5].map(k => scene.layoutAt(ctx, k)));
    if (best.hiddenLabels.length) best = pick([best, ...[1, 1.12, 1.24, 1.36, 1.5].map(k => scene.layoutAt(ctx, k, 70))]);
    return best;
  },
  layoutAt(ctx, k, rowGap = 0, retried = false) {
    const p = ctx.params;
    const th = ctx.theme;
    const C = motifColors(ctx);
    const t = kitT(ctx);
    const S00 = widen(STAGES[ctx.view.shape], k);
    const S0 = rowGap ? {...S00, rowY: S00.rowY + rowGap} : S00;
    // the hierarchy board keeps its full text size: when a long hierarchy needs more height than the
    // board's slot, everything below the board moves down by the difference (the scene scales to fit)
    const S = layoutShift(ctx, S0, p);
    const SW = S.W;
    let SH = S.H;
    const labelOf = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
    const showKey = ctx.show('key');

    // --- the two texts; their passages (drawn as the pulled-out slot) always stay inside the page
    // (only the passage slot shrinks when a long wording would overflow the page; titles keep their size)
    let bookPass = S.bookSize, artPass = S.artSize, book, art;
    for (let k = 0; k < 16; k++) {
      book = openBook(ctx, {prefix: 'm-book', pw: S.pw, ph: S.ph, color: C.src[0], src: p.sources[0], passage: p.passages[0], passageAt: 0.45, size: S.bookSize, passSize: bookPass, seedKey: 'cet-mech-book', quiet: true, idMin: S.idMin});
      if (book.passOrigin.y + book.pass.h <= book.bot - S.pw * 0.08 || bookPass < 9) break;
      bookPass *= 0.92;
    }
    for (let k = 0; k < 16; k++) {
      art = articleSheet(ctx, {prefix: 'm-art', w: S.art.w, h: S.art.h, color: C.src[1], src: p.sources[1], passage: p.passages[1], passageAt: 0.3, size: S.artSize, passSize: artPass, seedKey: 'cet-mech-art', quiet: true, idMin: S.idMin, titleLines: 3});
      if (art.passOrigin.y + art.pass.h <= art.h - art.pad * 0.9 || artPass < 9) break;
      artPass *= 0.92;
    }
    const bookBox = {x: S.book.x + book.outer.x, y: S.book.y + book.outer.y, w: book.outer.w, h: book.outer.h};
    const artBox = {x: S.art.x, y: S.art.y, w: art.w, h: art.h};
    const capProbe = id => (showKey ? chip(ctx, labelOf(id), {x: 0, y: 0, maxWidth: 400, size: S.cap, minSize: S.cap * 0.8, maxLines: 2, weight: 700}).box : {w: 0, h: 0});
    const c1p = capProbe('source1'), c2p = capProbe('source2');
    const capTops = [
      {x: bookBox.x, w: c1p.w, y: bookBox.y - 34 - c1p.h},
      {x: S.art.x + S.art.w - c2p.w, w: c2p.w, y: S.art.y - 48 - c2p.h},
    ].filter(q => q.x < S.board.x + S.board.w + 12 && q.x + q.w + 12 > S.board.x).map(q => q.y);
    const boardBudget = Math.min(S.card.y - 26, ...capTops.map(y => y - 14)) - S.board.y;
    let bsz = S.bsize;
    const mkBoard = sz => hierarchyBoard(ctx, {prefix: 'm-board', w: S.board.w, hier: p.hierarchy, ids: p.sources.map(x => x.id), colors: C.src, header: labelOf('hierarchy'), size: sz, tokScale: 0.8});
    let board = mkBoard(bsz);
    while (board.h > boardBudget && bsz > S.bsize * 0.9) { bsz *= 0.96; board = mkBoard(bsz); }
    const card = readingCard(ctx, {prefix: 'm-card', w: S.card.w, interp: p.interpretations.length ? p.interpretations[0] : {by: '—', text: t.notClassified}, size: S.cardSize, heading: labelOf('reading') || t.readingProposed, roomy: true});
    const boardBox = {x: S.board.x, y: S.board.y, w: board.w, h: board.h};
    const cardBox0 = {x: S.card.x, y: S.card.y, w: card.w, h: card.h};

    // --- the two provision slips: out position (after peeling out) and final row flanking the zone
    const slip1 = provisionSlip(ctx, {prefix: 'm-slip1', w: S.slipW, color: C.src[0], src: p.sources[0], passage: p.passages[0], size: S.size, idMin: S.idMin});
    const slip2 = provisionSlip(ctx, {prefix: 'm-slip2', w: S.slipW, color: C.src[1], src: p.sources[1], passage: p.passages[1], size: S.size, idMin: S.idMin});
    const slipH = Math.max(slip1.h, slip2.h);
    const Z = {x: S.zoneX, y: S.rowY + slipH / 2, R: S.R};
    // a reading card right above the zone leaves room between them for its connector and label
    {
      const cardAbove = cardBox0.y < Z.y && cardBox0.x < Z.x + Z.R && cardBox0.x + card.w > Z.x - Z.R;
      const room = Z.y - Z.R * 1.12 - (cardBox0.y + card.h);
      if (cardAbove && room < 120 && !retried) return scene.layoutAt(ctx, k, rowGap + (120 - room), true);
    }
    const fin = [{x: Z.x - Z.R - S.gap - S.slipW, y: S.rowY + (slipH - slip1.h) / 2}, {x: Z.x + Z.R + S.gap, y: S.rowY + (slipH - slip2.h) / 2}];
    const out = fin.map((q, i) => ({x: Math.max(14, Math.min(SW - 14 - S.slipW, q.x + S.out[i].dx)), y: q.y + S.out[i].dy}));
    const slips = [slip1, slip2];
    const slipBoxAt = (i, pos) => ({x: pos.x, y: pos.y, w: slips[i].w, h: slips[i].h});

    // --- captions: text captions above the texts, slip captions ride under their slips, zone caption under the ring
    const capSize = S.cap;
    const caps = {};
    // captions wrap into balanced lines (never a lone "1" orphaned from its "Text")
    const mkCap = (id, x, y, anchor, mw, lines) => {
      const o = {x, y, anchor, maxWidth: mw, size: capSize, minSize: capSize * 0.8, maxLines: lines, fill: th.card, stroke: th.inkSoft, name: `cap-${id}`, weight: 700};
      const c = chip(ctx, labelOf(id), o);
      if (c.fit.lines.length < 2 || c.fit.truncated) return c;
      const padX = capSize * 0.6;
      const bal = balanceFit(ctx, labelOf(id), c.fit, {maxWidth: mw - padX * 2, size: c.fit.size, minSize: c.fit.size, maxLines: lines, weight: 700, family: 'sans'});
      return bal === c.fit ? c : chip(ctx, labelOf(id), {...o, maxWidth: bal.width + padX * 2 + 1, minSize: c.fit.size});
    };
    if (showKey) {
      const up = (id, x, y, anchor) => { const probe = mkCap(id, 0, 0, anchor, 400, 2); caps[id] = mkCap(id, x, y - probe.box.h, anchor, 400, 2); };
      up('source1', bookBox.x, bookBox.y - 34, 'start');
      up('source2', artBox.x + artBox.w, artBox.y - 48, 'end');
      // slip captions in slip-local coordinates (they travel with their slip)
      caps.passage1 = mkCap('passage1', 6, slip1.h + 16, 'start', S.slipW, 2);
      caps.passage2 = mkCap('passage2', S.slipW - 6, slip2.h + 16, 'end', S.slipW, 2);
      caps.zone = mkCap('zone', Z.x, Z.y + Z.R * 1.22 + 12, 'middle', Math.max(Z.R * 3.2, 300), 2);
    }
    const slipCapH = i => (caps[`passage${i + 1}`] ? caps[`passage${i + 1}`].box.h + 16 : 0);
    const slipFoot = (i, pos) => ({x: pos.x, y: pos.y, w: slips[i].w, h: slips[i].h + slipCapH(i)});
    // the reading card sits below the zone caption when it shares the zone's column below it
    const zoneCapBottom = caps.zone ? caps.zone.box.y + caps.zone.box.h : Z.y + Z.R * 1.3;
    const cardUnderZone = S.card.y > Z.y && S.card.x < Z.x + Z.R && S.card.x + card.w > Z.x - Z.R;
    const allSlipFeet = [0, 1].flatMap(i => [slipFoot(i, out[i]), slipFoot(i, fin[i])]);
    const cardBox = {...cardBox0, y: cardUnderZone ? Math.max(S.card.y, zoneCapBottom + 20) : S.card.y};
    // a card below the slips' row never meets a slip (at rest or after the approach)
    if (cardBox.y > S.rowY) for (const f of allSlipFeet) if (hit(cardBox, f, 12)) cardBox.y = f.y + f.h + 24;
    SH = Math.max(SH, cardBox.y + cardBox.h + 14, zoneCapBottom + 12, ...allSlipFeet.map(b => b.y + b.h + 12));

    // elements at a given approach state (slips at `pos`)
    const elementsAt = pos => ({
      source1: {box: bookBox}, source2: {box: artBox}, passage1: {box: slipBoxAt(0, pos[0])}, passage2: {box: slipBoxAt(1, pos[1])},
      zone: {circle: {x: Z.x, y: Z.y, r: Z.R * 1.12}}, hierarchy: {box: boardBox}, reading: {box: cardBox},
    });
    const elFin = elementsAt(fin);
    const elOut = elementsAt(out);
    const centers = Object.fromEntries(Object.entries(elFin).map(([k, e]) => [k, centerOf(e)]));

    // --- relationships: geometry at out and final state; one label per connector at ITS midpoint
    const rels = p.relationships.filter(rl => rl.from !== rl.to && elFin[rl.from] && elFin[rl.to]).map(rl => ({...rl}));
    const bendOf = rl => (rl.kind === 'communication' ? 0 : rl.from === 'hierarchy' || rl.to === 'hierarchy' ? 0.08 : 0.1);
    // a slip ↔ zone connector leaves the slip's TOP edge near its inner end and enters the ring at
    // its upper shoulder: it arcs over the gap, so its label sits above the row, clear of both
    const slipZoneEnds = (els, rl) => {
      const pid = rl.from.startsWith('passage') && rl.to === 'zone' ? rl.from : rl.to.startsWith('passage') && rl.from === 'zone' ? rl.to : null;
      if (!pid) return null;
      const b = els[pid].box, c = els.zone.circle;
      const left = b.x + b.w / 2 < c.x;
      const onSlip = {x: left ? b.x + b.w - Math.min(44, b.w * 0.16) : b.x + Math.min(44, b.w * 0.16), y: b.y - 8};
      const a = left ? -2.2 : -0.94;
      const pad = 30;
      const onRing = {x: c.x + (c.r + pad) * Math.cos(a), y: c.y + (c.r + pad) * Math.sin(a)};
      return rl.from === pid ? {from: onSlip, to: onRing} : {from: {x: c.x + (c.r + 22) * Math.cos(a), y: c.y + (c.r + 22) * Math.sin(a)}, to: {x: onSlip.x, y: b.y - 14}};
    };
    const geomAt = (els, rl) => connGeom(els[rl.from], els[rl.to], rl.kind, slipZoneEnds(els, rl) ? (rl.from === 'zone' ? 0.22 : -0.22) * (els[rl.from.startsWith('passage') ? rl.from : rl.to].box.x < Z.x ? 1 : -1) : bendOf(rl), slipZoneEnds(els, rl));
    // --- legend band: first free spot
    const kindsUsed = [...new Set(p.relationships.filter(rl => rl.from !== rl.to).map(rl => rl.kind))];
    const lgItems = kindsUsed.map(k => ({k, fit: ctx.fit(p.relationLabels[k] || k, {maxWidth: 300, size: S.lg, maxLines: 1, weight: 600})}));
    const colW = 80 + Math.max(0, ...lgItems.map(it => it.fit.width));
    const rowW = lgItems.reduce((a, it) => a + 100 + it.fit.width, 0);
    const lgRow = S.lg * 1.55;
    const staticCapBoxes = ['source1', 'source2', 'zone'].filter(id => caps[id]).map(id => caps[id].box);
    const ringBox = {x: Z.x - Z.R * 1.25, y: Z.y - Z.R * 1.25, w: Z.R * 2.5, h: Z.R * 2.5};
    const objs = [bookBox, artBox, boardBox, cardBox, ringBox, ...allSlipFeet];
    let legendBand = null;
    for (const column of [Boolean(S.legend.column), !S.legend.column]) {
      const lgW = column ? colW : rowW, lgHt = column ? lgRow * lgItems.length : lgRow;
      const cands = [{x: S.legend.x, y: SH - 16 - lgHt}, {x: 16, y: SH - 16 - lgHt}, {x: SW - 16 - lgW, y: SH - 16 - lgHt}, {x: 16, y: 16}, {x: SW - 16 - lgW, y: 16}];
      const c = cands.find(q => q.x >= 10 && q.x + lgW <= SW - 10 && ![...staticCapBoxes, ...objs].some(b => hit({x: q.x, y: q.y, w: lgW, h: lgHt}, b, 8)));
      if (c) { legendBand = {x: c.x, y: c.y, w: lgW, h: lgHt, column}; break; }
    }
    if (!legendBand) {
      const lgW = rowW;
      SH += lgRow + 20;
      legendBand = {x: 16, y: SH - 16 - lgRow, w: lgW, h: lgRow, column: false};
    }

    // --- state tag beside the zone caption
    let stateTag = null;
    if (showKey) {
      const zc = caps.zone ? caps.zone.box : {x: Z.x, y: Z.y + Z.R * 1.2, w: 0, h: 0};
      const cands = [{x: zc.x + zc.w + 12, y: zc.y, anchor: 'start'}, {x: zc.x - 12, y: zc.y, anchor: 'end'}, {x: Z.x, y: zc.y + zc.h + 10, anchor: 'middle'}, {x: SW - 12, y: zc.y + zc.h + 8, anchor: 'end'}, {x: 12, y: zc.y + zc.h + 8, anchor: 'start'}];
      const busy = [legendBand, ...staticCapBoxes.filter(b => b !== zc), ...objs.filter(b => b !== ringBox)];
      // ... and clear of every connector (a line through the tag would read as struck through)
      const connPts = rels.flatMap(rl => geomAt(elFin, rl).poly.pts);
      busy.push(...connPts.map(q => ({x: q.x - 3, y: q.y - 3, w: 6, h: 6})));
      const mk = c => statusTag(ctx, stateLabel(ctx, 'tension-highlighted'), {...c, size: S.cap, maxWidth: SW * 0.45, name: 'zone-state', color: C.flag, opacity: 0});
      for (const c of cands) {
        const tg = mk(c);
        const b = tg.box;
        if (b.x >= 10 && b.x + b.w <= SW - 10 && !busy.some(q => hit(b, q, 4))) { stateTag = tg; break; }
      }
      if (!stateTag) stateTag = mk(cands[2]);
      SH = Math.max(SH, stateTag.box.y + stateTag.box.h + 12);
    }

    const labels = [];
    const placedBoxes = [];
    const hiddenLabels = [];
    // the ring as a circle (it settles 1.12× larger after the focus beat, plus its rim)
    const ringCircle = {cx: Z.x, cy: Z.y, r: Z.R * 1.12 + 9, x: Z.x - Z.R * 1.2, y: Z.y - Z.R * 1.2, w: Z.R * 2.4, h: Z.R * 2.4};
    // the texts' index tabs stick out above them
    const bookTabbed = {...bookBox, y: S.book.y + book.tab.y, h: bookBox.y + bookBox.h - (S.book.y + book.tab.y)};
    const artTabbed = {...artBox, y: artBox.y + art.tab.y, h: artBox.h - art.tab.y};
    const staticObs = [...staticCapBoxes, stateTag && stateTag.box, legendBand, bookTabbed, artTabbed, boardBox, cardBox, ringCircle].filter(Boolean);
    const placedO = [], placedF = [];
    // the tightest connectors (shortest at the final state) choose their label spot first
    const slipZone = rl => (rl.from === 'zone' || rl.to === 'zone') && (rl.from.startsWith('passage') || rl.to.startsWith('passage'));
    const placeOrder = rels.map((rl, i) => i).sort((a, b) => (slipZone(rels[b]) - slipZone(rels[a])) || geomAt(elFin, rels[a]).total - geomAt(elFin, rels[b]).total);
    const labelsAt = [];
    placeOrder.forEach(i => {
      const rl = rels[i];
      const labels = {push: v => { labelsAt[i] = v; }};
      if (!ctx.show('all')) { labels.push(null); return; }
      const text = rl.label || p.relationLabels[rl.kind] || rl.kind;
      const gO = geomAt(elOut, rl), gF = geomAt(elFin, rl);
      const obsO = [...staticObs, ...[0, 1].map(k => slipFoot(k, out[k]))];
      const obsF = [...staticObs, ...[0, 1].map(k => slipFoot(k, fin[k]))];
      const inBounds = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= SW - 8 && b.y + b.h <= SH - 8;
      // best spot ON one geometry: at the connector's midpoint first, then nudged across it,
      // then further along its own line (the label always touches its connector)
      const placeOn = (g0, obs, placed, bw, bh, own = []) => {
        const dx = g0.to.x - g0.from.x, dy = g0.to.y - g0.from.y, L0 = Math.hypot(dx, dy) || 1;
        const nx = -dy / L0, ny = dx / L0;
        let best = null;
        for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7]) {
          for (const d of [0, 14, -14, 28, -28, bh / 2 + 10, -(bh / 2 + 10)]) {
            const m = g0.poly.at(tt);
            const off = {x: nx * d, y: ny * d};
            const box = {x: m.x + off.x - bw / 2, y: m.y + off.y - bh / 2, w: bw, h: bh};
            const clash = obs.filter(q => hit(box, q, 4)).length + placed.filter(q => hit(box, q, 6)).length;
            const score = clash * 10 + (inBounds(box) ? 0 : 100) + Math.abs(d) / 400 + Math.abs(tt - 0.5);
            if (!best || score < best.score) best = {score, tt, off, box};
            if (score < 0.5) return best;
          }
        }
        if (best.score < 1) return best;
        // no clear spot on the connector: the label goes to the nearest free space, tied to its
        // connector's midpoint by a short leader (it is never dropped)
        const m = g0.poly.at(0.5);
        for (const dist0 of [bh / 2 + 34, bh / 2 + 64, bh / 2 + 96, bh / 2 + 130, bh / 2 + 170, bh / 2 + 220, bh / 2 + 280, bh / 2 + 340]) {
          for (let a = 0; a < 24; a++) {
            const ang = (a / 24) * Math.PI * 2;
            const cx = m.x + Math.cos(ang) * (dist0 + Math.abs(Math.cos(ang)) * (bw - bh) / 2), cy = m.y + Math.sin(ang) * dist0;
            const box = {x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh};
            if (!inBounds(box)) continue;
            if (obs.some(q => hit(box, q, 4)) || placed.some(q => hit(box, q, 12))) continue;
            const near = {x: Math.max(box.x, Math.min(m.x, box.x + box.w)), y: Math.max(box.y, Math.min(m.y, box.y + box.h))};
            // the leader never runs behind another label
            if (placed.some(q => segmentHitsBox(m, near, {x: q.x - 4, y: q.y - 4, w: q.w + 8, h: q.h + 8}))) continue;
            // the leader crosses no element (other than the ones this connector joins)
            // (a leader may leave across the connector's own elements, never across another one)
            const isOwn = q => own.some(o => o.x + o.w / 2 >= q.x && o.x + o.w / 2 <= q.x + q.w && o.y + o.h / 2 >= q.y && o.y + o.h / 2 <= q.y + q.h);
            // (a leader never crosses an element's face — its own elements included; it may only
            // leave from their edge)
            if (obs.some(q => q.r === undefined && segmentHitsBox(m, near, isOwn(q) ? {x: q.x + 8, y: q.y + 8, w: q.w - 16, h: q.h - 16} : q) && !(m.x >= q.x - 2 && m.x <= q.x + q.w + 2 && m.y >= q.y - 2 && m.y <= q.y + q.h + 2 && !isOwn(q)))) continue;
            return {score: 0.9, tt: 0.5, off: {x: cx - m.x, y: cy - m.y}, box, leader: true};
          }
        }
        // last resort: the nearest free spot anywhere on the stage (leader still crosses no element)
        let far = null;
        for (let gy = 12; gy + bh < SH - 8; gy += 24) {
          for (let gx = 12; gx + bw < SW - 8; gx += 24) {
            const box = {x: gx, y: gy, w: bw, h: bh};
            if (obs.some(q => hit(box, q, 4)) || placed.some(q => hit(box, q, 12))) continue;
            const near = {x: Math.max(box.x, Math.min(m.x, box.x + box.w)), y: Math.max(box.y, Math.min(m.y, box.y + box.h))};
            // the leader never runs behind another label
            if (placed.some(q => segmentHitsBox(m, near, {x: q.x - 4, y: q.y - 4, w: q.w + 8, h: q.h + 8}))) continue;
            const len = Math.hypot(near.x - m.x, near.y - m.y);
            if (len > 240 || (far && len >= far.len)) continue;
            const isOwn = q => own.some(o => o.x + o.w / 2 >= q.x && o.x + o.w / 2 <= q.x + q.w && o.y + o.h / 2 >= q.y && o.y + o.h / 2 <= q.y + q.h);
            // (a leader never crosses an element's face — its own elements included; it may only
            // leave from their edge)
            if (obs.some(q => q.r === undefined && segmentHitsBox(m, near, isOwn(q) ? {x: q.x + 8, y: q.y + 8, w: q.w - 16, h: q.h - 16} : q) && !(m.x >= q.x - 2 && m.x <= q.x + q.w + 2 && m.y >= q.y - 2 && m.y <= q.y + q.h + 2 && !isOwn(q)))) continue;
            far = {len, box};
          }
        }
        if (far) return {score: 0.95, tt: 0.5, off: {x: far.box.x + bw / 2 - m.x, y: far.box.y + bh / 2 - m.y}, box: far.box, leader: true};
        return best;
      };
      let best = null;
      // wide → narrow chips, always at the full label size (never a cut word)
      const widths = [[S.rel * 11, 1], [S.rel * 7, 1], [S.rel * 5.2, 1], [S.rel * 4.4, 1], [S.rel * 3.8, 1], [S.rel * 3.2, 1]];
      for (const [mw, k] of widths) {
        const c = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: S.rel * k, minSize: S.rel * k * 0.94, maxLines: 4, fill: th.card, stroke: kindColor(ctx, rl.kind), name: `rl${i}-chip`, weight: 600});
        // never cut a word or lose one to an ellipsis
        if (c.fit.truncated || c.fit.lines.join(' ').split(/\s+/).length !== String(text).trim().split(/\s+/).length) continue;
        const pO = placeOn(gO, obsO, placedO, c.box.w, c.box.h, [boxOf(elOut[rl.from]), boxOf(elOut[rl.to])]);
        const pF = placeOn(gF, obsF, placedF, c.box.w, c.box.h, [boxOf(elFin[rl.from]), boxOf(elFin[rl.to])]);
        const score = pO.score + pF.score;
        if (!best || score < best.score) best = {score, c, pO, pF};
        if (pO.score < 1 && pF.score < 1) break;
      }
      if (!best || best.pO.score >= 1 || best.pF.score >= 1) hiddenLabels.push(i);
      // (only if even free space with a leader is missing does a label step back in that state)
      const oOk = best.pO.score < 1, fOk = best.pF.score < 1;
      if (oOk) placedO.push(best.pO.box);
      if (fOk) placedF.push(best.pF.box);
      labels.push({o: best.pO, f: best.pF, oOk, fOk, c: best.c, w: best.c.box.w, h: best.c.box.h});
    });
    rels.forEach((_, i) => labels.push(labelsAt[i] ?? null));

    // --- legend nodes
    const legendItems = kindsUsed.map(k => ({k, fit: ctx.fit(p.relationLabels[k] || k, {maxWidth: 300, size: S.lg, maxLines: 1, weight: 600})}));
    let lx = legendBand.x, legendY = legendBand.y;
    const legend = ctx.show('all') ? g({name: 'legend', opacity: 0}, legendItems.map((it, i) => {
      const st = LINK_STYLES[it.k];
      const col = kindColor(ctx, it.k);
      const x0 = lx;
      if (legendBand.column) { if (i) legendY += lgRow; } else lx += 70 + it.fit.width + 30;
      return g(null,
        h('line', {x1: x0, x2: x0 + 56, y1: legendY + lgRow / 2, y2: legendY + lgRow / 2, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}),
        st.arrow ? h('path', {d: `M${x0 + 58} ${legendY + lgRow / 2}l-12 -7v14Z`, fill: col}) : h('circle', {cx: x0 + 56, cy: legendY + lgRow / 2, r: 4.5, fill: col}),
        textBlock(it.fit, {x: x0 + 66, y: legendY + (lgRow - it.fit.size) / 2, fill: th.fg}));
    })) : null;

    // --- zone lens content: the two phrases enter from their sides as the slips approach
    let zs = S.size, phrases;
    const tensions = [p.passages[0].tension, p.passages[1].tension];
    for (let k = 0; k < 14; k++) {
      const phFit = text => fitWords(ctx, text, {maxWidth: Z.R * 1.5, size: zs, minSize: zs * 0.9, maxLines: 3, weight: 700, family: 'serif'});
      phrases = tensions.map(phFit);
      const whole = phrases.every((f, i) => f.lines.join(' ').split(/\s+/).length === String(tensions[i]).trim().split(/\s+/).length);
      if (whole && phrases.reduce((a, f) => a + f.height + 14, 0) + 24 <= Z.R * 1.55 && !phrases.some(f => f.truncated)) break;
      zs *= 0.94;
    }
    const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s) / 2;
    const oy = (ctx.design.h - SH * s) / 2;
    return {trail: [0, 1, 2, 3, 4], hiddenLabels, S, SW, SH, s, ox, oy, book, art, board, card, slips, out, fin, elementsAt, centers, caps, stateTag, legend, phrases, Z, rels, labels, geomAt, bendOf,
      boxes: {bookBox, artBox, boardBox, cardBox}, gapOut: out[1].x - (out[0].x + S.slipW), gapFin: fin[1].x - (fin[0].x + S.slipW)};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = motifColors(ctx);
    const {Z} = L;
    const zoneClip = 'zclip';
    const pChip = (fit, i) => {
      const w = fit.width + 22, hh = fit.height + 14;
      return g({name: `zph${i}`},
        h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 7, fill: C.hl, stroke: C.src[i], 'stroke-width': 4}),
        ctx.show('all')
          ? textBlock(fit, {x: 0, y: -fit.height / 2, anchor: 'middle', fill: th.ink})
          : h('rect', {x: -fit.width / 2, y: -5, width: fit.width, height: 10, rx: 5, fill: th.ink, opacity: 0.7}));
    };
    const zigW = Z.R * 1.1;
    const zig = [];
    for (let i = 0; i <= 8; i++) zig.push(`${i ? 'L' : 'M'}${r(-zigW / 2 + (zigW * i) / 8)} ${i % 2 ? -9 : 9}`);
    const zoneNode = g({name: 'el-zone', transform: T(Z.x, Z.y)},
      h('circle', {r: Z.R + 12, fill: th.shadow, transform: 'translate(8 12)'}),
      h('defs', null, h('clipPath', {id: ctx.id(zoneClip)}, h('circle', {r: Z.R}))),
      g({'clip-path': ctx.ref(zoneClip)},
        h('circle', {r: Z.R + 2, fill: th.paper}),
        h('rect', {name: 'zband', x: -Z.R, y: -16, width: Z.R * 2, height: 32, fill: C.zoneSoft, opacity: 0}),
        h('path', {name: 'zzig', d: zig.join(''), fill: 'none', stroke: C.flag, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0}),
        L.phrases.map(pChip)),
      h('circle', {r: Z.R, fill: '#dcebf6', 'fill-opacity': 0.12}),
      h('circle', {r: Z.R, fill: 'none', stroke: '#3b3f45', 'stroke-width': 14}),
      h('circle', {r: Z.R + 8, fill: 'none', stroke: th.ink, 'stroke-width': 2.2}),
      h('path', {d: `M${r(-Z.R * 0.84)} ${r(-Z.R * 0.4)}A${r(Z.R * 0.93)} ${r(Z.R * 0.93)} 0 0 1 ${r(-Z.R * 0.4)} ${r(-Z.R * 0.84)}`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.5}),
    );
    const B = L.boxes;
    // connectors (geometry is set per frame: the slips move)
    const conns = L.rels.map((rl, i) => {
      const st = LINK_STYLES[rl.kind] || LINK_STYLES.relation;
      const col = kindColor(ctx, rl.kind);
      const hl = st.width * 4.2;
      return g({name: `rc${i}`, opacity: 0},
        st.dash ? h('defs', null, h('mask', {id: ctx.id(`rc${i}-mask`), maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: L.SW, height: L.SH},
          h('path', {name: `rc${i}-masker`, d: 'M0 0', fill: 'none', stroke: '#fff', 'stroke-width': st.width * 4, 'stroke-linecap': 'round'}))) : null,
        h('path', {name: `rc${i}-line`, d: 'M0 0', fill: 'none', stroke: col, 'stroke-width': st.width, 'stroke-linecap': 'round', 'stroke-dasharray': st.dash || undefined, mask: st.dash ? ctx.ref(`rc${i}-mask`) : undefined}),
        st.arrow ? h('path', {name: `rc${i}-head`, d: `M0 0L${r(-hl)} ${r(-hl * 0.55)}L${r(-hl * 0.72)} 0L${r(-hl)} ${r(hl * 0.55)}Z`, fill: col, opacity: 0}) : null,
        st.endDots ? h('circle', {name: `rc${i}-dotA`, r: st.width * 1.6, fill: col, opacity: 0}) : null,
        st.endDots ? h('circle', {name: `rc${i}-dotB`, r: st.width * 1.6, fill: col, opacity: 0}) : null);
    });
    const labels = L.labels.map((lb, i) => lb && g(null,
      (lb.o.leader || lb.f.leader) ? g({name: `rl${i}-leadg`, opacity: 0},
        h('line', {name: `rl${i}-lead`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: kindColor(ctx, L.rels[i].kind), 'stroke-width': 3.5}),
        h('circle', {name: `rl${i}-leaddot`, r: 6, fill: kindColor(ctx, L.rels[i].kind), stroke: th.card, 'stroke-width': 2})) : null,
      g({name: `rl${i}`, opacity: 0}, g({transform: T(0, -lb.h / 2)}, lb.c.node))));
    const slipCap = i => L.caps[`passage${i + 1}`] && L.caps[`passage${i + 1}`].node;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      conns,
      g({name: 'el-hierarchy'}, g({transform: T(B.boardBox.x, B.boardBox.y)}, L.board.node)),
      g({name: 'el-reading'}, g({transform: T(B.cardBox.x, B.cardBox.y)}, L.card.node)),
      g({name: 'el-source1'}, g({transform: T(L.S.book.x, L.S.book.y)}, L.book.node)),
      g({name: 'el-source2'}, g({transform: T(B.artBox.x, B.artBox.y)}, L.art.node)),
      g({name: 'el-passage1'}, L.slips[0].node, slipCap(0)),
      g({name: 'el-passage2'}, L.slips[1].node, slipCap(1)),
      g({name: 'el-zone-g'}, zoneNode),
      ['source1', 'source2', 'zone'].map(id => L.caps[id] && L.caps[id].node),
      L.stateTag && L.stateTag.node,
      L.legend,
      // tracer: a lens glint with a short fading trail, large enough to follow on a phone
      // (drawn under the relation labels, so it passes beneath them instead of over their words)
      L.trail.map(k => h('circle', {name: `tracer-t${k}`, r: r(L.S.rel * (0.62 - k * 0.08)), fill: C.flag, opacity: 0})),
      g({name: 'tracer', opacity: 0},
        h('circle', {r: r(L.S.rel * 1.25), fill: C.flag, opacity: 0.2}),
        h('circle', {r: r(L.S.rel * 0.7), fill: C.flag, stroke: th.paper, 'stroke-width': 4}),
        h('path', {d: `M${r(-L.S.rel * 0.3)} ${r(-L.S.rel * 0.12)}A${r(L.S.rel * 0.36)} ${r(L.S.rel * 0.36)} 0 0 1 ${r(L.S.rel * 0.1)} ${r(-L.S.rel * 0.34)}`, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.85})),
      labels,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const {Z, centers} = L;
    // --- separate: texts start side by side at the centre and move apart; slips peel out of them
    const sep = ease.inOutCubic(seg(u, 0.02, 0.16));
    const mid = {x: L.SW / 2, y: centers.source1.y};
    const startBook = {x: mid.x - L.boxes.bookBox.w / 2 - 12, y: mid.y};
    const startArt = {x: mid.x + L.boxes.artBox.w / 2 + 12, y: mid.y};
    const moveTo = (id, start) => {
      const c = centers[id];
      const q = mix(start, c, sep);
      nodes[`el-${id}`] = {transform: `translate(${r(q.x - c.x)} ${r(q.y - c.y)})`};
      return q;
    };
    const bookC = moveTo('source1', startBook);
    const artC = moveTo('source2', startArt);
    // --- approach: while the tracer runs, the two slips slide towards each other onto the zone's row
    const appr = ease.inOutCubic(seg(u, 0.47, 0.66));
    const pos = [0, 1].map(i => mix(L.out[i], L.fin[i], appr));
    const slipC = [0, 1].map(i => {
      const w = L.slips[i].w, hh = L.slips[i].h;
      const src = i ? artC : bookC;
      const k = lerp(0.3, 1, sep);
      const at = {x: lerp(src.x - w / 2, pos[i].x, sep), y: lerp(src.y - hh / 2, pos[i].y, sep)};
      nodes[`el-passage${i + 1}`] = {transform: `translate(${r(at.x + w / 2)} ${r(at.y + hh / 2)}) scale(${r(k, 4)}) translate(${r(-w / 2)} ${r(-hh / 2)})`, opacity: r(clamp(sep * 3), 3)};
      return {x: at.x + w / 2, y: at.y + hh / 2};
    });
    const fadeIn = (id, a, b) => {
      const k = ease.outCubic(seg(u, a, b));
      nodes[`el-${id}`] = {opacity: r(k, 3), transform: `translate(0 ${r(-24 * (1 - k))})`};
    };
    fadeIn('hierarchy', 0.12, 0.19);
    fadeIn('reading', 0.13, 0.2);
    const open = ease.outCubic(seg(u, 0.1, 0.18));

    // --- connectors: drawn one after the other in relate; geometry follows the slips
    const els = L.elementsAt(pos);
    const geoms = L.rels.map(rl => L.geomAt(els, rl));
    const n = L.rels.length;
    const relP = i => ease.inOutCubic(seg(u, BEATS.relate[0] + (i / Math.max(1, n)) * 0.2, BEATS.relate[0] + (i / Math.max(1, n)) * 0.2 + 0.07));
    const labelPos = [];
    const leaders = [];
    L.rels.forEach((rl, i) => {
      const st = LINK_STYLES[rl.kind] || LINK_STYLES.relation;
      const gm = geoms[i];
      const pr = relP(i);
      const dash = `${r(gm.total)} ${r(gm.total + 10)}`;
      const off = r(gm.total * (1 - pr));
      nodes[`rc${i}`] = {opacity: pr > 0 ? 1 : 0};
      if (st.dash) {
        nodes[`rc${i}-masker`] = {d: gm.d, 'stroke-dasharray': dash, 'stroke-dashoffset': off};
        nodes[`rc${i}-line`] = {d: gm.d};
      } else nodes[`rc${i}-line`] = {d: gm.d, 'stroke-dasharray': dash, 'stroke-dashoffset': off};
      if (st.arrow) nodes[`rc${i}-head`] = {transform: T(gm.end.x, gm.end.y, (gm.end.a * 180) / Math.PI), opacity: pr >= 0.985 ? 1 : 0};
      if (st.endDots) {
        nodes[`rc${i}-dotA`] = {cx: r(gm.from.x), cy: r(gm.from.y), opacity: pr > 0 ? 1 : 0};
        nodes[`rc${i}-dotB`] = {cx: r(gm.to.x), cy: r(gm.to.y), opacity: pr >= 0.985 ? 1 : 0};
      }
      // each label rides on its own connector (at its midpoint unless that spot is taken)
      const lb = L.labels[i];
      if (lb) {
        const tt = lerp(lb.o.tt, lb.f.tt, appr);
        const m = gm.poly.at(tt);
        labelPos[i] = {x: m.x + lerp(lb.o.off.x, lb.f.off.x, appr), y: m.y + lerp(lb.o.off.y, lb.f.off.y, appr)};
      }
      if (lb && (lb.o.leader || lb.f.leader)) {
        const useLead = appr < 0.5 ? lb.o.leader : lb.f.leader;
        const m = gm.poly.at(lerp(lb.o.tt, lb.f.tt, appr));
        const b = {x: labelPos[i].x - lb.w / 2, y: labelPos[i].y - lb.h / 2};
        const nx = Math.max(b.x, Math.min(m.x, b.x + lb.w)), ny = Math.max(b.y, Math.min(m.y, b.y + lb.h));
        const leadOn = useLead && pr >= 1 && (appr === 0 || appr === 1 || Math.hypot(lb.o.off.x - lb.f.off.x, lb.o.off.y - lb.f.off.y) <= 24);
        nodes[`rl${i}-lead`] = {x1: r(m.x), y1: r(m.y), x2: r(nx), y2: r(ny)};
        nodes[`rl${i}-leaddot`] = {cx: r(m.x), cy: r(m.y)};
        nodes[`rl${i}-leadg`] = {opacity: leadOn ? 1 : 0};
        leaders[i] = leadOn ? {from: m, to: {x: nx, y: ny}} : null;
      }
      // a label whose spot changes with the approach steps aside while its slip travels (it would
      // otherwise sweep across its neighbours) and settles at its final spot
      const travels = lb && Math.hypot(lb.o.off.x - lb.f.off.x, lb.o.off.y - lb.f.off.y) > 24;
      const away = travels ? clamp(1 - 5 * Math.min(appr, 1 - appr)) : 1;
      if (lb) nodes[`rl${i}`] = {transform: T(labelPos[i].x, labelPos[i].y), opacity: r(clamp((pr - 0.55) / 0.45) * lerp(lb.oOk ? 1 : 0, lb.fOk ? 1 : 0, appr) * away, 3)};
    });

    // --- trace: the tracer follows the supplied order along the connectors and around the
    // elements' OUTLINES (it never crosses their wording)
    const tr = seg(u, 0.45, 0.73);
    const order = p.traversalOrder.filter(id => els[id]);
    const hops = Math.max(1, order.length - 1);
    const hopPath = j => {
      const a = order[j], b = order[j + 1];
      const k = L.rels.findIndex(rl => (rl.from === a && rl.to === b) || (rl.from === b && rl.to === a));
      let pts;
      if (k >= 0) {
        const fw = L.rels[k].from === a;
        pts = Array.from({length: 41}, (_, q) => geoms[k].poly.at(fw ? q / 40 : 1 - q / 40));
      } else pts = [anchorOf(els[a], centerOf(els[b])), anchorOf(els[b], centerOf(els[a]))];
      // arrival point on `a` (end of the previous hop) → walk round `a` to this hop's start
      if (j > 0) {
        const prev = hopPath.cacheEnd[j - 1];
        if (prev) pts = [...outlineWalk(els[a], prev, pts[0]), ...pts];
      }
      hopPath.cacheEnd[j] = pts[pts.length - 1];
      return polyline(pts);
    };
    hopPath.cacheEnd = [];
    const hopPolys = order.length > 1 ? Array.from({length: hops}, (_, j) => hopPath(j)) : [];
    const routeAt = x => {
      if (!hopPolys.length) return anchorOf(els[order[0]] || els.zone, {x: 0, y: 0});
      const j = Math.min(hops - 1, Math.floor(x * hops));
      const local = ease.inOutSine(seg(x, j / hops + 0.22 / hops, (j + 1) / hops));
      return hopPolys[j].at(local);
    };
    // the dot never sits on the ring or its phrase chips: at the zone it waits just outside the
    // ring's largest (focused) radius, pushed out along the radius
    const tpos = (() => {
      const q = routeAt(tr), d = Math.hypot(q.x - Z.x, q.y - Z.y), safe = Z.R * 1.2 + L.S.rel * 1.1;
      return d >= safe || d < 1 ? q : {x: Z.x + (q.x - Z.x) * safe / d, y: Z.y + (q.y - Z.y) * safe / d};
    })();
    const arrive = k => (k === 0 ? 0 : k / hops);
    const reached = id => {
      const k = order.indexOf(id);
      if (k < 0) return 0;
      return k === 0 ? (tr > 0 ? 1 : 0) : seg(tr, arrive(k) - 0.02, arrive(k) + 0.05);
    };
    const tracerOn = tr > 0 && u < 0.78 ? 1 : 0;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn};
    for (const k of L.trail) {
      const q = routeAt(Math.max(0, tr - (k + 1) * 0.012));
      nodes[`tracer-t${k}`] = {transform: T(q.x, q.y), opacity: tracerOn && dist(q, tpos) > 2 ? r(0.5 - k * 0.1, 3) : 0};
    }
    // phrase highlights as the tracer passes each provision (then kept)
    const hl1 = Math.max(reached('passage1'), seg(u, 0.74, 0.8));
    const hl2 = Math.max(reached('passage2'), seg(u, 0.74, 0.8));
    Object.assign(nodes, L.slips[0].frame({hl: hl1}));
    Object.assign(nodes, L.slips[1].frame({hl: hl2}));
    // focus element enlarges while the tracer is on it, then settles slightly larger
    const focus = p.focusElement;
    const fReach = reached(focus);
    const fAfter = seg(u, 0.75, 0.82);
    const focusScale = r(fReach >= 1 ? 1.2 - 0.08 * fAfter : 1 + 0.2 * ease.inOutCubic(fReach), 4);
    const scaleAbout = (c, k) => `translate(${r(c.x)} ${r(c.y)}) scale(${r(k, 4)}) translate(${r(-c.x)} ${r(-c.y)})`;
    if (focus === 'zone') nodes['el-zone-g'] = {transform: scaleAbout(centers.zone, open * focusScale), opacity: open > 0 ? 1 : 0};
    else {
      nodes['el-zone-g'] = {transform: scaleAbout(centers.zone, open), opacity: open > 0 ? 1 : 0};
      const cur = nodes[`el-${focus}`] || {};
      const c = focus.startsWith('passage') ? slipC[focus === 'passage1' ? 0 : 1] : centers[focus];
      nodes[`el-${focus}`] = {...cur, transform: `${scaleAbout(c, focusScale)} ${cur.transform || ''}`.trim()};
    }
    // the ring fills as the slips arrive: each phrase enters from its own side, meeting in the middle
    const meet = appr;
    const off = k => Z.R + (L.phrases[k].width + 22) / 2 + 12;
    const dy = Math.max(Z.R * 0.36, ...L.phrases.map(f => (f.height + 14) / 2 + 8));
    nodes.zph0 = {transform: T(lerp(-off(0), 0, meet), -dy)};
    nodes.zph1 = {transform: T(lerp(off(1), 0, meet), dy)};
    nodes.zband = {opacity: r(0.9 * clamp((meet - 0.6) / 0.4), 3)};
    nodes.zzig = {opacity: r(clamp((meet - 0.75) / 0.25), 3)};
    // captions with the components; state and legend at gather
    for (const id of Object.keys(L.caps)) if (!id.startsWith('passage')) nodes[`cap-${id}`] = {opacity: r(seg(u, 0.14, 0.2), 3)};
    if (L.stateTag) nodes['zone-state'] = {opacity: r(seg(u, 0.78, 0.84), 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, 0.2, 0.27), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const drawn = L.rels.map((_, i) => r(relP(i), 3));
    const visited = order.filter((_, k) => tr > 0 && tr >= arrive(k) - 1e-6);
    const slipGap = r(pos[1].x - (pos[0].x + L.slips[0].w));
    // distance between the two slips' centres (they converge diagonally in tall frames)
    const cDist = q => Math.hypot(q[1].x + L.slips[1].w / 2 - q[0].x - L.slips[0].w / 2, q[1].y + L.slips[1].h / 2 - q[0].y - L.slips[0].h / 2);
    // labels stay attached: each label box is centred within a chip-height of its connector's midpoint
    // labels stay attached: the gap between each label box and its own connector (now)
    const labelGaps = L.labels.map((lb, i) => {
      if (!lb) return 0;
      const b = {x: labelPos[i].x - lb.w / 2, y: labelPos[i].y - lb.h / 2, w: lb.w, h: lb.h};
      return r(Math.min(...geoms[i].poly.pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h)))));
    });
    // visible label boxes never overlap one another; every drawn leader starts ON its own connector,
    // ends ON its own label and crosses no other label
    const shownBox = i => {
      const lb = L.labels[i];
      if (!lb || !(nodes[`rl${i}`].opacity > 0.5)) return null;
      return {x: labelPos[i].x - lb.w / 2, y: labelPos[i].y - lb.h / 2, w: lb.w, h: lb.h};
    };
    const boxesNow = L.labels.map((_, i) => shownBox(i));
    const labelsNoOverlap = boxesNow.every((a, i) => !a || boxesNow.every((b, j) => j <= i || !b || !hit(a, b, 0)));
    const leadersReach = leaders.every((ld, i) => {
      if (!ld) return true;
      const onConn = Math.min(...geoms[i].poly.pts.map(q => Math.hypot(q.x - ld.from.x, q.y - ld.from.y))) <= 6;
      const b = boxesNow[i] || {x: labelPos[i].x - L.labels[i].w / 2, y: labelPos[i].y - L.labels[i].h / 2, w: L.labels[i].w, h: L.labels[i].h};
      const onLabel = ld.to.x >= b.x - 1 && ld.to.x <= b.x + b.w + 1 && ld.to.y >= b.y - 1 && ld.to.y <= b.y + b.h + 1;
      const crosses = boxesNow.some((o, j) => o && j !== i && segmentHitsBox(ld.from, ld.to, o));
      return onConn && onLabel && !crosses;
    });
    const labelsAttached = labelGaps.every((v, i) => v <= 24 || ((appr < 0.5 ? L.labels[i].o.leader : L.labels[i].f.leader) && v <= 270));
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        book: {x: r(bookC.x), y: r(bookC.y)},
        article: {x: r(artC.x), y: r(artC.y)},
        slip1: {x: r(slipC[0].x), y: r(slipC[0].y)},
        slip2: {x: r(slipC[1].x), y: r(slipC[1].y)},
        order: p.traversalOrder,
        visited,
        drawn,
        kinds: L.rels.map(rl => rl.kind),
        arrows: L.rels.map(rl => Boolean((LINK_STYLES[rl.kind] || {}).arrow)),
        connectorsLand: L.rels.every((rl, i) => landsOn(els[rl.from], geoms[i].from) && landsOn(els[rl.to], geoms[i].to)),
        focus,
        focusScale,
        approach: r(appr, 3),
        slipGap,
        slipGapOut: r(L.gapOut),
        stageH: r(L.SH),
        slipDist: r(cDist(pos)),
        slipDistOut: r(cDist(L.out)),
        phrasesMet: r(meet, 3),
        highlight: [r(hl1, 3), r(hl2, 3)],
        stateShown: u >= 0.84,
        hiddenLabels: L.hiddenLabels.length,
        labelsAttached,
        labelGaps,
        labelsNoOverlap,
        leadersReach,
        // …and never over the phrase chips inside the (possibly enlarged) ring
        tracerOffChips: !(tr > 0 && u < 0.78) || Math.hypot(tpos.x - Z.x, tpos.y - Z.y) - L.S.rel * 1.0 >= Z.R * (focus === 'zone' ? focusScale : 1) * open * 0.97,
        tracerOffText: [0, 1].every(i => !inside(els[`passage${i + 1}`].box, tpos, -4)),
      },
    };
  },
};

/** Whether point q lies inside box b (shrunk by -pad when pad < 0). */
function inside(b, q, pad = 0) {
  return q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
}

/** A connector end lies on (or just outside) its element's edge. */
function landsOn(e, q) {
  if (e.circle) return Math.abs(dist(q, e.circle) - e.circle.r) <= 34;
  const b = e.box;
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
  const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  return Math.hypot(dx, dy) <= 16;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-03-mechanism',
    title: 'Conflict between texts — how two provisions converge on a zone of tension',
    titleEs: 'Conflicto entre textos — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Conflicto entre textos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded diagram: the book and the article separate, each provision peels out as a slip, the hierarchy board (user-supplied, displayed only) and an attributed reading card take their places. Only explicit relationships are drawn with their kind (relation, sequence, communication; causal only when supplied); a tracer follows the traversal order and the zone of tension enlarges as the two phrases slide face to face inside its lens.',
    tags: ['conflict between texts', 'mechanism', 'relations', 'provisions', 'zone of tension', 'editable hierarchy', 'attributed reading', 'tracer', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/conflicto-entre-textos.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
