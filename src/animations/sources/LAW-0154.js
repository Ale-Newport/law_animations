/**
 * LAW-0154 — Interpretaciones concurrentes · mechanism
 *
 * Storyboard — an exploded view of the split, placed along the path the
 * passage travels (source → passage → reading lens → two readings), not a
 * row of boxes (brief beats in brackets):
 *  [0.00–0.18] separate: the passage slip is already on the desk; the
 *              editable hierarchy board, the source book, the reading lens
 *              and the two reading elements (a tracing overlay with its
 *              highlight pattern still empty + an attributed card) slide out
 *              of it into their places, one after another; reading A and
 *              reading B arrive together (neither is on screen alone).
 *  [0.18–0.43] relate: ONLY the supplied relationships are drawn, each
 *              anchored to the edges of its two elements and captioned by its
 *              kind (relation = plain line with end dots, no arrow; sequence /
 *              communication = arrow; causal only when supplied).
 *  [0.43–0.75] trace: a tracer follows the supplied traversal order along the
 *              drawn links (straight hops where no link is supplied). The
 *              focus element grows while the tracer is on it. When the tracer
 *              leaves the lens, the lens shows both highlight patterns at
 *              once (A on the upper, B on the lower half of each line, same
 *              opacity, height and length), and each overlay's highlight
 *              pattern is drawn when the tracer reaches it along the supplied
 *              connectors: the same words, two different patterns.
 *  [0.75–1.00] gather: everything held — origin (book, passage), transformation
 *              (lens) and the two states (A, B) — with the neutral key.
 *              Neither reading is ranked or marked correct.
 * Layouts: 16:9 = columns (board/book · passage · lens · A over B);
 * 9:16 = rows (board + book, passage, lens, A | B); 1:1 = board/book and
 * passage over the lens, A | B below.
 * @module animations/sources/LAW-0154
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, r, ease} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {chip} from '../../primitives/annotate.js';
import {deskWindow} from '../../primitives/desk.js';
import {
  icFields, IC_DEFAULTS, IC_STRINGS, kitT, icColors, laneOf, sourceOf, pxPerUnit,
  passageLayout, phraseSpan, passageSlip, overlayArt, overlayFrame, readingCardArt, openBook, hierarchyBoard,
  notePlate, measureNote, overlaps, inside, fitWords, textOrBars, unionBox, contrast, BAND_OPACITY,
} from './kits/interpretaciones-concurrentes.js';
import {roundRectPath} from '../../core/geometry.js';

const ID = 'LAW-0154';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {appear: [0.0, 0.17], relate: [0.18, 0.42], trace: [0.44, 0.74], key: [0.76, 0.82]};
const IDS = ['board', 'book', 'passage', 'lens', 'readingA', 'readingB'];
// A and B are introduced together (same slot): neither reading is on screen before the other
const APPEAR_ORDER = [['book'], ['board'], ['lens'], ['readingA', 'readingB']];

const sceneSchema = {...icFields, ...mechanismFields(IDS)};

const defaultParams = {
  ...IC_DEFAULTS,
  elements: [
    {id: 'board', label: 'Editable hierarchy'},
    {id: 'book', label: 'Source book'},
    {id: 'passage', label: 'The passage'},
    {id: 'lens', label: 'Reading the passage'},
    {id: 'readingA', label: 'Reading A'},
    {id: 'readingB', label: 'Reading B'},
  ],
  relationships: [
    {from: 'board', to: 'book', kind: 'relation'},
    {from: 'book', to: 'passage', kind: 'relation'},
    {from: 'passage', to: 'lens', kind: 'sequence'},
    {from: 'lens', to: 'readingA', kind: 'relation'},
    {from: 'lens', to: 'readingB', kind: 'relation'},
  ],
  focusElement: 'lens',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'read next', causal: 'causal (as supplied)'},
  traversalOrder: ['book', 'passage', 'lens', 'readingA', 'lens', 'readingB'],
};

const STRINGS = {en: {...IC_STRINGS.en}, es: {...IC_STRINGS.es}};

const labelOf = (p, id) => (p.elements.find(e => e.id === id) || {}).label ?? null;

/* ------------------------------------------------------------------ */
/* Art: reading lens (a round glass on a stand, seen from above)       */
/* ------------------------------------------------------------------ */

function readingLens(ctx, {R, F}) {
  const th = ctx.theme;
  const C = icColors(ctx);
  const clip = 'lensclip';
  const rows = [-0.42, -0.08, 0.26].map(k => k * R);
  const bars = rows.map((y, i) => h('rect', {x: r(-R * 0.66), y: r(y), width: r(R * (i === 2 ? 0.9 : 1.32)), height: r(R * 0.1), rx: r(R * 0.05), fill: C.pencil, opacity: 0.55}));
  // the same three lines, two different highlight extents of EQUAL total length, height and opacity:
  // A on the upper half of each line (square caps), B on the lower half (round caps), so neither covers the other
  const bh = R * 0.11;
  const spansA = [[1, -0.66, 1.0], [2, -0.66, 0.4]];
  const spansB = [[0, 0.1, 0.56], [1, -0.18, 0.84]];
  const bandRects = (list, k) => list.map(([i, x, w]) => h('rect', {x: r(R * x), y: r(rows[i] - R * 0.06 + (k ? bh : 0)), width: r(R * w), height: r(bh), rx: r(k ? bh / 2 : 2), fill: k ? C.b.band : C.a.band}));
  const bandA = g({name: 'lens-bandA', opacity: 0}, bandRects(spansA, 0));
  const bandB = g({name: 'lens-bandB', opacity: 0}, bandRects(spansB, 1));
  const bandStyle = [spansA, spansB].map((list, k) => ({h: r(bh, 2), len: r(R * list.reduce((a, q) => a + q[2], 0), 2), fill: k ? C.b.band : C.a.band, contrast: r(contrast(k ? C.b.band : C.a.band, '#eef6fb'), 2)}));
  const node = g(null,
    h('circle', {cx: 9, cy: 12, r: r(R + R * 0.14), fill: th.shadow}),
    // the stand's three feet
    [210, 330, 90].map(a => {
      const ar = (a * Math.PI) / 180;
      return h('line', {x1: r(Math.cos(ar) * R * 0.9), y1: r(Math.sin(ar) * R * 0.9), x2: r(Math.cos(ar) * R * 1.3), y2: r(Math.sin(ar) * R * 1.3), stroke: '#5b646c', 'stroke-width': r(R * 0.09), 'stroke-linecap': 'round'});
    }),
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('circle', {r: r(R * 0.9)}))),
    h('circle', {r: r(R * 0.9), fill: '#eef6fb'}),
    g({'clip-path': ctx.ref(clip)}, bandB, bandA, bars),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.3)}A${r(R * 0.68)} ${r(R * 0.68)} 0 0 1 ${r(-R * 0.3)} ${r(-R * 0.62)}`, fill: 'none', stroke: '#fff', 'stroke-width': r(R * 0.07), 'stroke-linecap': 'round', opacity: 0.9}),
    h('circle', {r: r(R), fill: 'none', stroke: th.ink, 'stroke-width': r(R * 0.16 + 4)}),
    h('circle', {r: r(R), fill: 'none', stroke: '#3f4a55', 'stroke-width': r(R * 0.16)}),
    h('circle', {r: r(R + R * 0.03), fill: 'none', stroke: '#9aa6b0', 'stroke-width': r(R * 0.04)}),
  );
  return {node, R, bandStyle};
}

/** Supplied element label plate. */
function labelPlate(ctx, text, {w, F}) {
  const th = ctx.theme;
  const f = fitWords(ctx, text, {maxWidth: w - F, size: F, minSize: F, maxLines: 6, weight: 800});
  const hh = f.height + F * 0.5;
  const pw = f.width + F;
  return {w: pw, h: hh, fit: f, node: (x, y) => g(null,
    h('path', {d: roundRectPath(x, y, pw, hh, hh / 2 > 12 ? 12 : hh / 2), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    textOrBars(ctx, f, ctx.show('key'), {x: x + pw / 2, y: y + F * 0.25, anchor: 'middle', fill: th.ink}))};
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

function tryLayout(ctx, F) {
  const p = ctx.params;
  const t = kitT(ctx);
  const C = icColors(ctx);
  const shape = ctx.view.shape;
  const Wd = ctx.design.w, Hd = ctx.design.h;
  const m = F * (shape === 'square' ? 0.6 : 0.9), gap = F * 3.2;
  const pad = F * 0.7;
  let fits = true;
  const need = c => { if (!c) fits = false; };
  const R = F * (shape === 'landscape' ? 3 : shape === 'square' ? 2.2 : 3.2);
  // gaps wide enough for a relation caption to sit ON its connector between two elements
  const usedKinds = [...new Set(p.relationships.map(q => q.kind))];
  const capW = ctx.show('all') ? Math.max(F * 4, ...usedKinds.map(k => chip(ctx, p.relationLabels[k] || k, {x: 0, y: 0, maxWidth: F * 7, size: F, maxLines: 3, weight: 600}).box.w)) : F * 3;
  const hg = Math.min(F * 8.4, capW + F * 1.1);
  // column / cell widths per layout
  let wSide, wSlip, wRead, wBook;
  if (shape === 'landscape') {
    // [board | book | passage] over [A | lens | B]; each reading lies sideways (overlay + card)
    const inner = Wd - m * 2 - hg * 2;
    wSide = Math.min(inner * 0.27, F * 16);
    wBook = wSide * 0.8;
    wSlip = inner - wSide - wBook;
    wRead = (Wd - m * 2 - R * 2.7 - hg * 2) / 2;
  } else if (shape === 'portrait') {
    wSide = (Wd - m * 2 - hg) / 2;
    wBook = wSide;
    wSlip = Math.min(Wd - m * 2 - F * 4, F * 26);
    wRead = (Wd - m * 2 - F * 1.4) / 2;
  } else {
    // square: [board | book | passage] over [A | lens | B]
    const inner = Wd - m * 2 - hg * 2;
    wSide = inner * 0.35;
    wBook = inner * 0.27;
    wSlip = inner - wSide - wBook;
    wRead = (Wd - m * 2 - R * 2.7 - (capW + F * 0.7) * 2) / 2;
  }
  // 16:9 and 1:1: split the top row between board, book and passage so the row is as low as possible
  if (shape !== 'portrait') {
    const inner = Wd - m * 2 - hg * 2;
    const plateH = (id, w) => (labelOf(p, id) ? labelPlate(ctx, labelOf(p, id), {w, F}).h + F * 0.3 : 0);
    let best = null;
    for (const fb of [0.27, 0.31, 0.35, 0.4]) {
      for (const fk of [0.2, 0.25, 0.3, 0.35]) {
        const ws = inner * fb, wb = inner * fk, wp = inner - ws - wb;
        if (wp < F * 11) continue;
        const bh = hierarchyBoard(ctx, {prefix: 'probe', w: ws, F, p, t: {...t, hierarchy: labelOf(p, 'board') ?? t.hierarchy}, headSize: labelOf(p, 'board') ? F : null}).h;
        const kh = openBook(ctx, {prefix: 'probe', w: wb, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book}).h + plateH('book', wb);
        const PLp = passageLayout(ctx, p.passages.text, {w: Math.min(wp - F * 2.3, F * 22), size: F});
        const sh = passageSlip(ctx, {prefix: 'probe', PL: PLp, ref: p.passages.ref, F, color: C.book, pad: F * 0.7}).h + plateH('passage', wp);
        const hmax = Math.max(bh, kh, sh);
        if (!best || hmax < best.h - 0.5) best = {h: hmax, ws, wb, wp};
      }
    }
    wSide = best.ws;
    wBook = best.wb;
    wSlip = best.wp;
  }
  // passage slip (drawn once, legible) and the two reading elements
  const slipPL = passageLayout(ctx, p.passages.text, {w: Math.min(wSlip - F * 2.3, F * 22), size: F});
  const slip = passageSlip(ctx, {prefix: 'slip', PL: slipPL, ref: p.passages.ref, F, color: C.book, pad: F * 0.7});
  const tabW = Math.max(F * 1.5, 30);
  // 16:9: each reading lies sideways (overlay facing the lens, card beside it); else card below
  const side = shape === 'landscape';
  // 16:9: the overlay takes the largest share that still leaves each card's header on one line
  // (else: the largest share whose header units stay whole)
  const buildReadings = share => {
    const rPL = passageLayout(ctx, p.passages.text, {w: side ? Math.min(F * 16, (wRead - tabW) * share - F * 1.4) : wRead - tabW - F * 1.4, size: F});
    const sp = [0, 1].map(k => phraseSpan(rPL, p.interpretations[k].focus));
    const o2 = [0, 1].map(k => overlayArt(ctx, {prefix: `ov${k}`, PL: rPL, F, lane: laneOf(ctx, k), letter: k ? 'B' : 'A', side: k ? 'right' : 'left', span: sp[k], pad: F * 0.7}));
    const cw = side ? wRead - tabW - o2[0].w - F * 0.6 : o2[0].w;
    const mkCard = (k, minH) => readingCardArt(ctx, {w: cw, F, lane: laneOf(ctx, k), letter: k ? 'B' : 'A', label: p.interpretations[k].label, text: p.interpretations[k].text, by: p.sources[sourceOf(p, k)].title, proposed: t.proposed, minH});
    const ch = Math.max(mkCard(0).natural, mkCard(1).natural);
    return {readPL: rPL, spans: sp, ov: o2, cardW: cw, cardH: ch, cards: [mkCard(0, ch), mkCard(1, ch)]};
  };
  const shares = side ? [0.47, 0.44, 0.41, 0.38, 0.35, 0.32] : [1];
  const tries = shares.map(buildReadings);
  const pick = tries.find(q => q.cards.every(c => c.headLines === 1 && c.subLines === 1)) || tries.find(q => q.cards.every(c => c.headLines === 1 && c.subParen))
    || tries.find(q => q.cards.every(c => c.headerWhole)) || tries[0];
  const {readPL, spans, ov, cardW, cardH, cards} = pick;
  need(cards.every(c => c.headerWhole), 'header');
  const board = hierarchyBoard(ctx, {prefix: 'board', w: wSide, F, p, t: {...t, hierarchy: labelOf(p, 'board') ?? t.hierarchy}, stack: false, headSize: labelOf(p, 'board') ? F : null});
  const book = openBook(ctx, {prefix: 'book', w: wBook, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
  const lens = readingLens(ctx, {R, F});
  // element label plates (supplied)
  const plate = (id, w) => (labelOf(p, id) ? labelPlate(ctx, labelOf(p, id), {w, F}) : null);
  const pl = {book: plate('book', wBook), passage: plate('passage', wSlip), lens: plate('lens', shape !== 'portrait' ? R * 2.7 + F * 0.8 : shape === 'portrait' ? (Wd - m * 2) / 2 - R * 1.3 - F * 0.6 : Math.max(R * 2 + F * 6, F * 12)), readingA: plate('readingA', wRead), readingB: plate('readingB', wRead)};
  const ph = id => (pl[id] ? pl[id].h + F * 0.3 : 0);
  // element block sizes: plate above the object (lens: plate below)
  // both readings reserve the same plate height (equal blocks); a shorter plate sits right above its overlay
  const phR = Math.max(ph('readingA'), ph('readingB'));
  const readH = k => phR + (side ? Math.max(ov[k].h, cardH) : ov[k].h + F * 0.5 + cardH);
  const size = {
    board: {w: wSide, h: board.h},
    book: {w: wBook, h: ph('book') + book.h},
    passage: {w: slip.w, h: ph('passage') + slip.h},
    lens: shape === 'portrait' ? {w: R * 2.7, h: R * 2.7} : {w: Math.max(R * 2.7, pl.lens ? pl.lens.w : 0), h: R * 2.7 + ph('lens')},
    readingA: {w: ov[0].w + tabW + (side ? F * 0.6 + cardW : 0), h: readH(0)},
    readingB: {w: ov[1].w + tabW + (side ? F * 0.6 + cardW : 0), h: readH(1)},
  };
  const keyMaxW = shape !== 'portrait' ? R * 2.7 + hg * 2 - F : F * 20;
  const keyM = measureNote(ctx, t.key, {maxWidth: keyMaxW, size: F * 0.9, weight: 600, maxLines: 3});
  // positions (top-left of each block)
  const pos = {};
  const avail = Hd - m * 2;
  let keyAt;
  if (shape === 'portrait') {
    const r1 = Math.max(size.board.h, size.book.h);
    const lensBlock = size.lens.h;
    const r4 = Math.max(size.readingA.h, size.readingB.h);
    const total = r1 + size.passage.h + lensBlock + r4 + keyM.h;
    const gy = (avail - total) / 5;
    need(gy >= F * 1.6, 'height');
    pos.board = {x: m, y: m};
    pos.book = {x: Wd - m - wBook, y: m + (r1 - size.book.h) / 2};
    pos.passage = {x: (Wd - slip.w) / 2, y: m + r1 + gy};
    pos.lens = {x: (Wd - size.lens.w) / 2, y: pos.passage.y + size.passage.h + gy};
    const ry = pos.lens.y + lensBlock + gy;
    pos.readingA = {x: m + tabW * 0, y: ry};
    pos.readingB = {x: Wd - m - size.readingB.w, y: ry};
    need(size.readingA.w + size.readingB.w + F <= Wd - m * 2 + 0.5, 'width');
    keyAt = {x: (Wd - keyM.w) / 2, y: ry + r4 + gy};
  } else {
    // square: [board | book | passage] over [A | lens | B] — the readings sit left and right of the lens
    const r1 = Math.max(size.board.h, size.book.h, size.passage.h);
    const r2 = Math.max(size.readingA.h, size.readingB.h, size.lens.h + F * 0.6 + keyM.h + F * 1.6);
    const total = r1 + r2;
    const gy = (avail - total) / 2;
    need(gy >= F * 0.9, `height ${Math.round(r1)}+${Math.round(r2)} vs ${Math.round(avail)} (F ${Math.round(F)}; A ${Math.round(size.readingA.h)} lensKey ${Math.round(size.lens.h + keyM.h)} board ${Math.round(size.board.h)} book ${Math.round(size.book.h)} pass ${Math.round(size.passage.h)})`);
    pos.board = {x: m, y: m};
    pos.book = {x: m + wSide + hg, y: m + (r1 - size.book.h) / 2};
    if (shape === 'landscape') pos.board.y = m + (r1 - size.board.h) / 2;
    pos.passage = {x: Wd - m - wSlip + (wSlip - slip.w) / 2, y: m + (r1 - size.passage.h) / 2};
    const ry = m + r1 + gy;
    pos.readingA = {x: m, y: ry};
    pos.readingB = {x: Wd - m - size.readingB.w, y: ry};
    // lens centred on the overlays' height, so both splits run sideways
    const filmMid = ry + phR + ov[0].h / 2;
    pos.lens = {x: (Wd - size.lens.w) / 2, y: Math.max(ry, filmMid - R * 1.35)};
    need(pos.readingA.x + size.readingA.w + F * 0.6 <= pos.lens.x && pos.lens.x + size.lens.w + F * 0.6 <= pos.readingB.x, 'width');
    // the key sits under the lens, between the two readings
    keyAt = {x: (Wd - keyM.w) / 2, y: Math.max(ry + r2 - keyM.h, pos.lens.y + size.lens.h + F * 0.5)};
    need(keyAt.y + keyM.h <= Hd - m * 0.5, 'key');
    need(slip.w <= wSlip + 0.5, 'slipW');
  }
  // object boxes (the parts connectors attach to)
  const objBox = {
    board: {x: pos.board.x, y: pos.board.y, w: wSide, h: board.h},
    book: {x: pos.book.x, y: pos.book.y + ph('book'), w: wBook, h: book.h},
    passage: {x: pos.passage.x, y: pos.passage.y + ph('passage'), w: slip.w, h: slip.h},
    // a reading's connectors land on its tracing overlay (the card hangs below it)
    // sideways: A = [card | tab | overlay] (overlay faces the lens), B = [overlay | tab | card]
    readingA: {x: pos.readingA.x + (side ? cardW + F * 0.6 : 0) + tabW, y: pos.readingA.y + phR, w: ov[0].w, h: ov[0].h},
    readingB: {x: pos.readingB.x, y: pos.readingB.y + phR, w: ov[1].w, h: ov[1].h},
  };
  const lensC = {x: pos.lens.x + size.lens.w / 2, y: pos.lens.y + R * 1.35};
  const blocks = IDS.map(id => ({id, ...pos[id], w: size[id].w, h: size[id].h}));
  need(blocks.every(b => inside(b, {x: 0, y: 0, w: Wd, h: Hd}, 0.5)), 'inside');
  need(blocks.every((a, i) => blocks.every((b, j) => j <= i || !overlaps(a, b, F * 0.4))), 'blocks overlap');
  // the focus element settles 8 % larger: connectors attach to its settled outline
  const HOLD = 1.08;
  const grow = (b, k) => ({x: b.x - (b.w * (k - 1)) / 2, y: b.y - (b.h * (k - 1)) / 2, w: b.w * k, h: b.h * k});
  const elements = {};
  for (const id of IDS) {
    const k = id === p.focusElement ? HOLD : 1;
    elements[id] = id === 'lens' ? {circle: {x: lensC.x, y: lensC.y, r: R * 1.05 * k}} : {box: grow(objBox[id], k)};
  }
  // lens label: below the lens, or beside it in 9:16 (its links leave from the bottom there)
  const lensPlateAt = pl.lens ? (shape === 'portrait'
    ? {x: lensC.x + R * 1.3 + F * 0.4, y: lensC.y - pl.lens.h / 2}
    : {x: lensC.x - pl.lens.w / 2, y: lensC.y + R * 1.35 + F * 0.3}) : null;
  const plateBoxes = Object.entries(pl).filter(([, v]) => v).map(([id, v]) => {
    if (id === 'lens') return {x: lensPlateAt.x, y: lensPlateAt.y, w: v.w, h: v.h};
    const b = pos[id];
    const reading = id === 'readingA' || id === 'readingB';
    return {x: reading ? objBox[id].x : b.x, y: b.y + (reading ? phR - ph(id) : 0), w: v.w, h: v.h};
  });
  const keyBox = {x: keyAt.x, y: keyAt.y, w: keyM.w, h: keyM.h};
  const cardBoxes = [0, 1].map(k => {
    const b = objBox[k ? 'readingB' : 'readingA'];
    if (side) return {x: k ? b.x + ov[k].w + tabW + F * 0.6 : pos.readingA.x, y: b.y, w: cardW, h: cardH};
    return {x: b.x, y: b.y + ov[k].h + F * 0.5, w: ov[k].w, h: cardH};
  });
  const graph = relationGraph({...ctx, show: () => false}, {
    name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, bend: () => 0.08,
  });
  // relation captions: centred ON their own connector (the line runs behind the chip), at the first
  // point along it that is clear of every element, plate, card, the key and the other captions
  const objObst = [...Object.values(objBox), {x: lensC.x - R * 1.1, y: lensC.y - R * 1.1, w: R * 2.2, h: R * 2.2}, ...plateBoxes, keyBox, ...cardBoxes,
    {x: pos.board.x, y: pos.board.y, w: wSide, h: board.h}];
  const bounds = {x: m * 0.4, y: m * 0.4, w: Wd - m * 0.8, h: Hd - m * 0.8};
  const placedLabels = [];
  const relLabels = graph.conns.map((c, i) => {
    if (!ctx.show('all')) return null;
    const text = p.relationLabels[c.rel.kind] || c.rel.kind;
    const make = (q, size, maxW) => {
      const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: maxW, size, maxLines: 3, weight: 600});
      return chip(ctx, text, {x: q.x, y: q.y - probe.box.h / 2, anchor: 'middle', maxWidth: maxW, size, maxLines: 3, fill: ctx.theme.card, stroke: kindColor(ctx, c.rel.kind), weight: 600, name: `rl${i}`});
    };
    const ok = b => inside(b, bounds) && !objObst.some(o => overlaps(b, o, 3)) && !placedLabels.some(o => overlaps(b, o, 4));
    for (const maxW of [F * 10, F * 7]) {
      for (const tt of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
        const q = c.c.at(tt);
        const base = make(q, F, maxW);
        // centred on the line, else touching it from either side
        const nx = -Math.sin(q.a), ny = Math.cos(q.a);
        const half = Math.min(base.box.w / 2 / Math.max(1e-6, Math.abs(nx)), base.box.h / 2 / Math.max(1e-6, Math.abs(ny))) + 1;
        for (const off of [0, half, -half]) {
          const cand = off ? make({x: q.x + nx * off, y: q.y + ny * off}, F, maxW) : base;
          if (ok(cand.box)) { placedLabels.push(cand.box); return {...cand, clear: true, at: {x: q.x, y: q.y}}; }
        }
      }
    }
    const q0 = c.c.at(0.5);
    const fb = make(q0, F, F * 7);
    placedLabels.push(fb.box);
    return {...fb, clear: false, at: {x: q0.x, y: q0.y}};
  });
  const labelsClear = relLabels.every(x => !x || x.clear);
  need(labelsClear, 'labels');
  const route = graph.route(p.traversalOrder);
  const plateDy = {readingA: phR - ph('readingA'), readingB: phR - ph('readingB')};
  return {fits, plateDy, F, shape, Wd, Hd, slipPL, slip, readPL, spans, ov, cards, cardH, board, book, lens, R, lensC, pl, ph, pos, size, objBox, tabW, graph, route, keyAt, keyM, keyMaxW, cardBoxes, plateBoxes, labelsClear, relLabels, lensPlateAt, pxu: pxPerUnit(ctx), HOLD};
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});

const scene = {
  sizes: {landscape: [1600, 800], square: [1100, 860], portrait: [1000, 1400]},
  layout(ctx) {
    const ppu = pxPerUnit(ctx);
    let last = null;
    for (let px = 25; px >= 16; px -= 0.4) {
      const L = tryLayout(ctx, px / ppu);
      if (L.fits) return L;
      last = L;
    }
    return last;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = icColors(ctx);
    const desk = deskWindow(ctx, {prefix: 'desk', x: 0, y: 0, w: L.Wd, h: L.Hd, radius: 26, mat: false});
    const P = L.pos;
    const el = (id, ...kids) => g({name: `el-${id}`, opacity: 0}, ...kids);
    const plateAt = (id, x, y) => (L.pl[id] ? L.pl[id].node(x, y) : null);
    const key = notePlate(ctx, {text: kitT(ctx).key, x: L.keyAt.x, y: L.keyAt.y, maxWidth: L.keyMaxW, size: L.F * 0.9, weight: 600, maxLines: 3, dash: true, level: 'key'});
    return g(null,
      desk.surface,
      g({'clip-path': desk.clip},
        L.graph.node,
        el('board', g({transform: T(P.board.x, P.board.y)}, L.board.node)),
        el('book', plateAt('book', P.book.x, P.book.y), g({transform: T(L.objBox.book.x, L.objBox.book.y)}, L.book.node)),
        el('passage', plateAt('passage', P.passage.x, P.passage.y), g({transform: T(L.objBox.passage.x, L.objBox.passage.y)}, L.slip.node)),
        el('lens', g({transform: T(L.lensC.x, L.lensC.y)}, L.lens.node), L.pl.lens ? L.pl.lens.node(L.lensPlateAt.x, L.lensPlateAt.y) : null),
        [0, 1].map(k => {
          const id = k ? 'readingB' : 'readingA';
          const b = L.objBox[id];
          return el(id, plateAt(id, b.x, P[id].y + L.plateDy[id]),
            g({transform: T(b.x, b.y)}, L.ov[k].node),
            g({transform: T(L.cardBoxes[k].x, L.cardBoxes[k].y)}, L.cards[k].node));
        }),
        L.relLabels.map((x, i) => x && g({name: `rlg${i}`, opacity: 0}, x.node)),
        L.graph.tracerNode('tracer'),
        g({name: 'keyG', opacity: 0}, key.node),
      ),
      desk.frame,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const F = L.F;
    // separate: the other elements slide out of the passage slip, one after another
    const pc = center(L.objBox.passage);
    const appear = {passage: 1};
    APPEAR_ORDER.forEach((ids, i) => {
      const a0 = W.appear[0] + 0.02 + i * 0.035;
      ids.forEach(id => { appear[id] = ease.outCubic(seg(u, a0, a0 + 0.06)); });
    });
    const focus = p.focusElement;
    const visits = L.route.visits;
    const trP = seg(u, ...W.trace);
    const focusVisits = visits.filter(v => v.id === focus).map(v => v.t);
    const near = focusVisits.length ? Math.max(...focusVisits.map(t0 => clamp(1 - Math.abs(trP - t0) / 0.12))) : 0;
    const passed = focusVisits.length && trP >= Math.min(...focusVisits) ? 1 : 0;
    const focusScale = r(passed ? Math.max(L.HOLD, 1 + 0.18 * ease.inOutSine(near)) : 1 + 0.18 * ease.inOutSine(near) * (trP > 0 ? 1 : 0), 4);
    for (const id of IDS) {
      const a = appear[id];
      const b = id === 'lens' ? {x: L.lensC.x - L.R, y: L.lensC.y - L.R, w: L.R * 2, h: L.R * 2} : L.objBox[id];
      const c = center(b);
      // the two readings arrive together, so they slide only along the axis that does not bring them together
      const reading = id === 'readingA' || id === 'readingB';
      const sideBySide = Math.abs(L.objBox.readingA.y - L.objBox.readingB.y) < Math.abs(L.objBox.readingA.x - L.objBox.readingB.x);
      const off = {x: reading && sideBySide ? 0 : (pc.x - c.x) * 0.25 * (1 - a), y: reading && !sideBySide ? 0 : (pc.y - c.y) * 0.25 * (1 - a)};
      const sc = id === focus ? focusScale : 1;
      nodes[`el-${id}`] = {opacity: r(clamp(a * 1.4), 3), transform: `${T(off.x, off.y)} ${scaleAbout(c.x, c.y, sc)}`};
    }
    // relate: the supplied relationships draw one after another
    const n = p.relationships.length;
    const drawn = p.relationships.map((_, i) => ease.inOutCubic(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 1) * (W.relate[1] - W.relate[0])) / n)));
    Object.assign(nodes, L.graph.frame(i => drawn[i]));
    L.relLabels.forEach((x, i) => { if (x) nodes[`rlg${i}`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45), 3)}; });
    // trace
    const tp = L.route.poly.at(trP);
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: trP > 0 && u < 0.78 ? 1 : 0};
    const visited = visits.filter(v => trP > 0 && trP >= v.t - 1e-6).map(v => v.id);
    const firstVisit = id => { const v = visits.find(q => q.id === id); return v ? v.t : null; };
    // the lens shows both readings' patterns together once the tracer has passed it; each overlay's
    // pattern is drawn when the tracer reaches that reading
    const lensT = firstVisit('lens');
    const reachAt = k => firstVisit(k ? 'readingB' : 'readingA');
    const lensP = lensT === null ? ease.inOutSine(seg(u, 0.7, 0.74)) : ease.inOutSine(clamp((trP - lensT) / 0.08)) * (trP > 0 ? 1 : 0);
    const bandP = [0, 1].map(k => {
      const tA = reachAt(k);
      // the pattern is drawn as the tracer arrives (complete when it reaches the reading)
      return tA === null ? ease.inOutSine(seg(u, 0.7, 0.74)) : ease.inOutSine(clamp((trP - tA + 0.1) / 0.1)) * (trP > 0 ? 1 : 0);
    });
    [0, 1].forEach(k => Object.assign(nodes, overlayFrame(L.ov[k], {lit: 0, trace: 1, band: bandP[k]})));
    const lensOp = r(BAND_OPACITY * lensP, 3);
    nodes['lens-bandA'] = {opacity: lensOp};
    nodes['lens-bandB'] = {opacity: lensOp};
    const keyP = seg(u, ...W.key);
    nodes.keyG = {opacity: r(keyP, 3)};
    // semantics
    const kinds = p.relationships.map(q => q.kind);
    const connectorsLand = L.graph.conns.every(c => {
      const from = c.c.from, to = c.c.to;
      const onEdge = (id, q, pad) => {
        const e = (() => {
          const k = id === focus ? L.HOLD : 1;
          if (id === 'lens') return {circle: {x: L.lensC.x, y: L.lensC.y, r: L.R * 1.05 * k}};
          const b = L.objBox[id];
          return {box: {x: b.x - (b.w * (k - 1)) / 2, y: b.y - (b.h * (k - 1)) / 2, w: b.w * k, h: b.h * k}};
        })();
        if (e.circle) return Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r - pad) < 2.5;
        const b = e.box;
        const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
        return Math.hypot(dx, dy) <= pad + 2.5;
      };
      return onEdge(c.rel.from, from, 8) && onEdge(c.rel.to, to, c.rel.kind === 'relation' ? 8 : 14);
    });
    return {
      nodes,
      semantic: {
        beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
        layout: L.shape, fits: L.fits, keyPx: r(F * L.pxu, 2),
        appeared: IDS.every(id => appear[id] >= 1),
        drawn: drawn.map(v => r(v, 3)),
        kinds, arrows: L.graph.conns.map(c => c.rel.kind !== 'relation' && c.rel.kind !== 'disputed'),
        order: p.traversalOrder.filter(id => IDS.includes(id)), visited,
        tracer: {x: r(tp.x), y: r(tp.y)},
        focus, focusScale,
        appear: {A: r(appear.readingA, 3), B: r(appear.readingB, 3)},
        lensBands: [lensOp, lensOp].map((op, k) => ({opacity: op, ...L.lens.bandStyle[k]})),
        bands: bandP.map(v => r(v, 3)),
        // equal weight (legal): identical overlay styles, card and block sizes, lens band opacity / height / length / contrast
        equalWeight: JSON.stringify(L.ov[0].style) === JSON.stringify(L.ov[1].style) && L.cards[0].w === L.cards[1].w && L.cards[0].h === L.cards[1].h
          && L.size.readingA.w === L.size.readingB.w && L.size.readingA.h === L.size.readingB.h
          && L.lens.bandStyle[0].h === L.lens.bandStyle[1].h && Math.abs(L.lens.bandStyle[0].len - L.lens.bandStyle[1].len) < 0.5 && Math.abs(L.lens.bandStyle[0].contrast - L.lens.bandStyle[1].contrast) <= 0.03
          && Math.abs(contrast(laneOf(ctx, 0).band, '#f3f7fa') - contrast(laneOf(ctx, 1).band, '#f3f7fa')) <= 0.03,
        headersWhole: L.cards.every(c => c.headerWhole), headLines: L.cards.map(c => c.headLines), subLines: L.cards.map(c => c.subLines), subParen: L.cards.map(c => c.subParen),
        bandsDiffer: JSON.stringify(L.ov[0].rects.map(q => [r(q.x), r(q.w), q.line])) !== JSON.stringify(L.ov[1].rects.map(q => [r(q.x), r(q.w), q.line])),
        connectorsLand, labelsClear: L.labelsClear, hiddenLabels: L.relLabels.filter(x => ctx.show('all') && !x).length,
        labelsOnConnectors: L.relLabels.every(x => !x || Math.hypot(Math.max(x.box.x - x.at.x, 0, x.at.x - x.box.x - x.box.w), Math.max(x.box.y - x.at.y, 0, x.at.y - x.box.y - x.box.h)) <= 3),
        keyShown: keyP >= 1,
        passage: {x: r(pc.x), y: r(pc.y)},
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
    slug: 'sources-09-mechanism',
    title: 'Concurrent interpretations — how one passage splits into two readings',
    titleEs: 'Interpretaciones concurrentes — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Interpretaciones concurrentes',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view along the path of the passage: hierarchy board and source book, the passage slip, a reading lens and two reading elements (tracing overlay + attributed card). Only the supplied relationships are drawn, by kind; a tracer follows the supplied order, the focus element grows, the lens shows both highlight patterns with equal weight, and each reading\'s pattern is drawn when the tracer reaches it. No reading is ranked.',
    tags: ['interpretation', 'concurrent readings', 'mechanism', 'passage', 'lens', 'tracing overlay', 'book', 'editable hierarchy', 'relations'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/interpretaciones-concurrentes.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
