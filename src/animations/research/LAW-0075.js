/**
 * LAW-0075 — Matriz de autoridades · contrast
 *
 * Storyboard (two complete, identical library corners; exactly one fact
 * differs — whether the changed source has been supplied to the matrix):
 *  0.00–0.17 base      Two identical scenes: a library shelf strip with the
 *                      same colour-coded volumes above a cork-board matrix
 *                      (same proposition cards, same search printout, same
 *                      source sheets). The changed source's column head is an
 *                      empty dashed slot marked with its id in BOTH scenes;
 *                      every supplied citation waits as a pin on its card.
 *  0.17–0.40 change    One local, explicit change: in A the volume lights and
 *                      its sheet comes down from the shelf into the slot and
 *                      is pinned; in B the slot stays empty and a "source
 *                      pending" note is peeled off the pad on the board's
 *                      ledge (both scenes have the same pad) and stuck on it.
 *                      The changed fact is named.
 *  0.40–0.77 parallel  The same pins run along their rows in the same order
 *                      and at the same instants in both scenes. The only
 *                      difference: the pin whose citation needs the changed
 *                      source lands in its cell in A (the column lights and the
 *                      pinpoint flag opens); in B it stays on its card and an
 *                      empty dashed socket marks that cell.
 *  0.77–1.00 guide     Rings mark the changed cell in both scenes and a guide
 *                      joins them (below the boards side by side; down a lane
 *                      beside the boards when stacked). Shared facts, then a
 *                      neutral note: no winner, score or legal consequence.
 * Side by side on wide boxes (and tall panels on square boxes), stacked on
 * tall boxes.
 * @module animations/research/LAW-0075
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {FONTS} from '../../core/text.js';
import {contrastFields, int} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {shade} from '../../primitives/paper.js';
import {
  matrixFields, MATRIX_STRINGS, MAX_SOURCES, MAT, resolveMatrix, bookcase, corkBoard, bandedGeometry, matrixStatic, matrixLinks,
  searchSlip, stickyNoteArt, noteTextFit, socketArt, arcPt, balancedChipWidth, fitWords, brokeWord,
} from './kits/matriz-de-autoridades.js';

const ID = 'LAW-0075';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  glow: [0.19, 0.23], fly: [0.22, 0.33], pinSheet: [0.33, 0.36], note: [0.22, 0.34], changeChip: [0.19, 0.25],
  links: [0.42, 0.73], guide: [0.78, 0.9], rings: [0.78, 0.83],
  changeOut: [0.43, 0.46], sharedIn: [0.47, 0.51], sharedOut: [0.84, 0.865], neutral: [0.875, 0.93],
};

const STRINGS = {
  en: {...MATRIX_STRINGS.en},
  es: {...MATRIX_STRINGS.es},
};

const sceneSchema = {
  ...matrixFields,
  ...contrastFields(),
  changedSource: int('Column (0 = first source) whose supply is the one fact that differs: supplied in scenario A, still pending in scenario B', 0, MAX_SOURCES - 1),
};

const defaultParams = {
  query: 'notice delivery Day 3',
  propositions: [
    {text: 'Party A sent written notice on Day 3.'},
    {text: 'The goods reached the dock on Day 7.'},
    {text: 'Party B asked for a replacement unit.'},
  ],
  sources: [
    {id: 'S1', title: 'Letter from Party A'},
    {id: 'S2', title: 'Warehouse delivery log'},
  ],
  dates: ['Day 3', 'Day 7'],
  citations: [
    {proposition: 0, source: 0, pinpoint: 'p. 1'},
    {proposition: 1, source: 1, pinpoint: 'entry 14'},
    {proposition: 2, source: 0, pinpoint: 'p. 2'},
  ],
  changedSource: 1,
  scenarioA: {label: 'Proposition with a supplied source', caption: 'The delivery log (S2) has been supplied'},
  scenarioB: {label: 'Source pending', caption: 'The delivery log (S2) has not been supplied yet'},
  changedFact: 'Only one fact differs: whether source S2 has been supplied',
  sharedFacts: ['Same propositions', 'Same search and shelf', 'Same order of pins'],
  comparisonLabels: {guide: 'Changed fact: row 2 × S2', neutral: 'Two situations side by side — nothing is concluded about the propositions'},
};

/**
 * Panel stage per shape (panel-local units). Every panel uses the banded
 * matrix (full-width proposition strips, full-width source columns), so key
 * labels stay large in two side-by-side or stacked scenes:
 *  - frame 'side' (wide panels, 16:9 and 9:16): the search printout and a
 *    bookcase stand in a column left of the cork board;
 *  - frame 'top' (tall, narrow panels, 1:1): printout and shelf share a strip
 *    above the board.
 */
const STAGES = {
  landscape: {arrangement: 'row', w: 1100, h: 790, ts: 1.3, title: 23.5, frame: 'side', sideW: 230, slipH: 250, gap: 80, header: 140, footer: 150},
  square: {arrangement: 'row', w: 800, h: 980, ts: 1.22, title: 24, titleMin: 19, card: 27, cardMin: 20, date: 21.5, note: 27, frame: 'top', topH: 196, slipFrac: 0.5, gap: 60, header: 170, footer: 160},
  portrait: {arrangement: 'column', w: 1220, h: 760, ts: 1.2, title: 24, frame: 'side', sideW: 260, slipH: 250, gap: 60, header: 124, footer: 160},
};
const LANE = 80;

/** Pieces of one scene (pure): printout, bookcase, board and banded matrix geometry, panel coordinates. */
function sceneFor(ctx, P, St, M) {
  const ts = St.ts;
  let slipBox, libBox, boardBox;
  if (St.frame === 'side') {
    slipBox = {x: 10, y: 12, w: St.sideW - 14, h: St.slipH};
    libBox = {x: 16, y: 12 + St.slipH + 22, w: St.sideW - 26, h: St.h - (12 + St.slipH + 22) - 12};
    boardBox = {x: St.sideW + 18, y: 12, w: St.w - St.sideW - 18 - 8, h: St.h - 12 - 30};
  } else {
    const sw = St.w * St.slipFrac;
    slipBox = {x: 10, y: 12, w: sw - 10, h: St.topH};
    libBox = {x: sw + 22, y: 12, w: St.w - sw - 22 - 16, h: St.topH};
    const by = 12 + St.topH + 20;
    boardBox = {x: 8, y: by, w: St.w - 16, h: St.h - by - 30};
  }
  const board = corkBoard(ctx, {prefix: `${P}-board`, ...boardBox, seedKey: 'cboard'});
  const inset = 14 * ts;
  const mbox = {x: board.inner.x + inset, y: board.inner.y + inset, w: board.inner.w - inset * 2, h: board.inner.h - inset * 2};
  // (St.title / St.card / St.date: text sizes of the source titles, proposition strips and dates, before ts)
  const G = bandedGeometry(ctx, M, mbox, {ts, R: 12 * ts, titleMaxLines: 3, titleSize: (St.title ?? 22) * ts, titleMin: St.titleMin ? St.titleMin * ts : undefined, cardSize: (St.card ?? 25) * ts, cardMin: St.cardMin ? St.cardMin * ts : undefined, dateSize: (St.date ?? 19) * ts});
  const trunc = ctx.show('key') ? G.rows.filter(q => q.fit.truncated).length + G.cols.filter(c => c.titleFit && c.titleFit.truncated).length * 0.5 : 0;
  return {board, G, slipBox, libBox, trunc};
}

function panel(ctx, P, St, M, ch, supplied) {
  const p = ctx.params;
  const th = ctx.theme;
  const ts = St.ts;
  const {board, G, slipBox, libBox, trunc} = sceneFor(ctx, P, St, M);
  const shelf = bookcase(ctx, {prefix: `${P}-lib`, ...libBox, shelves: St.frame === 'side' ? Math.min(3, Math.max(2, M.nS)) : 1, sources: M.sources, ts, seedKey: 'cshelf', plinth: St.frame === 'side', volScale: St.frame === 'side' ? 1.05 : 1.2});
  const slip = searchSlip(ctx, {name: `${P}-slip`, box: slipBox, query: p.query, sources: M.sources, ts});
  const stat = matrixStatic(ctx, {prefix: `${P}-mx`, G, M, query: p.query, dropSources: [ch], dropVisible: false, slotText: 'id'});
  const changed = G.links.filter(l => l.col === ch).map(l => l.k);
  // every cell whose citation needs the changed source is ringed; the ring fits inside the lane
  const laneH = Math.min(...G.rows.map(q => q.laneH));
  const ringR = Math.max(G.R * 1.7, Math.min(G.R * 2.3, laneH / 2 - 2 * ts));
  // the pinpoint flag of a ringed cell opens beside the ring (outside it), inside its lane
  const links = matrixLinks(ctx, {prefix: `${P}-lk`, G, M, heldLayer: false, flagClear: (l, k) => (changed.includes(k) ? ringR + 8 * ts : 0)});
  const vol = shelf.volumes[ch];
  const glow = vol ? h('rect', {name: `${P}-vglow`, x: r(vol.x - 6), y: r(vol.y - 6), width: r(vol.w + 12), height: r(vol.h + 12), rx: 6, fill: 'none', stroke: th.highlight, 'stroke-width': 6, opacity: 0}) : null;
  const head = G.cols[ch].head;
  // B: the empty socket that marks each cell whose citation needs the pending source
  const sockets = supplied ? [] : changed.map(k => g({name: `${P}-cs${k}`, opacity: 0, transform: T(G.links[k].cell.x, G.links[k].cell.y)}, socketArt(ctx, G.R)));
  const nw = Math.min(head.w * 0.92, 200 * ts), nh = Math.min(head.h * 0.7, 120 * ts);
  // the note carries the awaited id, so the slot's own id can fade out under it (no overprint)
  const noteOpts = {w: nw, h: nh, text: `${M.sources[ch].id} · ${ctx.t.sourcePending}`, ts, size: (St.note ?? 24) * ts, minSize: 19 * ts, maxLines: 3};
  const note = supplied ? null : g({name: `${P}-pnote`, opacity: 0}, stickyNoteArt(ctx, noteOpts));
  const nf = !supplied && ctx.show('key') ? noteTextFit(ctx, noteOpts) : null;
  const noteWhole = !nf || (!nf.truncated && !brokeWord(nf));
  // the same pad of sticky notes lies on the ledge of BOTH boards, at the end away from the guide
  // (the guide leaves the board straight down from the changed column)
  const L0 = board.ledge;
  const gx = G.cols[ch].px;
  const padW = Math.min(nw, L0.w * 0.3);
  const padAt = {x: gx > L0.x + L0.w / 2 ? L0.x + 30 + padW / 2 : L0.x + L0.w - 30 - padW / 2, y: L0.y + 7};
  const PAD_SY = 0.22;
  const pad = g(null,
    h('path', {d: `M${r(padAt.x - padW / 2 + 6)} ${r(padAt.y + nh * PAD_SY / 2 + 8)}h${r(padW)}v6h${r(-padW)}Z`, fill: th.shadow}),
    [2, 1, 0].map(k => h('rect', {x: r(padAt.x - padW / 2), y: r(padAt.y - nh * PAD_SY / 2 + k * 3), width: r(padW), height: r(nh * PAD_SY), rx: 2, fill: shade(MAT.note, -0.05 * k), stroke: shade(MAT.note, -0.45), 'stroke-width': 1.4})));
  // rings marking the changed cells (drawn under the pinpoint flags, so they never cross their text)
  const rings = changed.map((k, q) => h('circle', {name: `${P}-ring${q}`, cx: r(G.links[k].cell.x), cy: r(G.links[k].cell.y), r: r(ringR), fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-dasharray': supplied ? null : '10 8', opacity: 0}));
  const node = g(null,
    slip, shelf.node, glow,
    board.node,
    stat.sheet, links.colLinks, stat.heads, stat.cards,
    links.threads, sockets, rings, links.pins, links.flags,
    pad,
    note,
  );
  return {node, G, links, stat, shelf, vol, head, changed, supplied, note: note ? {w: nw, h: nh} : null, noteWhole, padAt, padW, PAD_SY, P, ringR, trunc, board, gx, gridBottom: G.sheet.y + G.sheet.h};
}

const scene = {
  sizes: {landscape: [2200, 1000], square: [1700, 1300], portrait: [1150, 1900]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    // long texts: the stage grows (up to +30 %) before any proposition or title is truncated
    const St0 = STAGES[ctx.view.shape];
    const M0 = resolveMatrix(ctx.params, {pendingColumn: 'never'});
    let St = St0;
    for (const k of [1, 1.12, 1.22, 1.32]) {
      St = {...St0, h: St0.h * k};
      if (!sceneFor(ctx, 'a', St, M0).trunc) break;
    }
    const {arrangement} = St;
    const ch = Math.min(p.changedSource, p.sources.length - 1);
    const M = resolveMatrix(p, {pendingColumn: 'never'});
    // guide chip (side by side: it sits ON the guide's run under the boards, so the footer starts below it;
    // stacked: ON the guide's run through the gap between the two scenes, which is made tall enough for it)
    const guideSize = 30;
    const guideMax = arrangement === 'row' ? Math.min(860, St.w + St.gap - 80) : Math.min(640, St.w * 0.6);
    const guideW = ctx.show('key') ? balancedChipWidth(ctx, p.comparisonLabels.guide, {maxWidth: guideMax, size: guideSize, maxLines: 2}) : guideMax;
    const guideH = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: guideW, size: guideSize, maxLines: 2}).box.h : 0;
    const gap = arrangement === 'row' ? St.gap : Math.max(St.gap, guideH + 36);
    const geo = pairedGeometry(ctx, {stage: {w: St.w, h: St.h}, arrangement, header: St.header, gap});
    // footer: the three captions share one slot; its height comes from the tallest of them
    const footTop = arrangement === 'row' ? Math.max(76, 26 + guideH + 30) : 44;
    const footTexts = [p.changedFact, p.sharedFacts.length ? `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}` : '', p.comparisonLabels.neutral];
    const footW = footTexts.map((txt, i) => (txt ? balancedChipWidth(ctx, txt, {maxWidth: geo.w * 0.94, size: i ? 36 : 38, maxLines: 2, weight: i ? 500 : 600}) : 0));
    const footProbe = footTexts.map((txt, i) => (txt ? chip(ctx, txt, {x: 0, y: 0, maxWidth: footW[i], size: i ? 36 : 38, maxLines: 2}).box.h : 0));
    const footer = Math.max(St.footer, footTop + Math.max(0, ...footProbe) + 12);
    const bw = geo.w + (arrangement === 'column' ? LANE : 0), bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const A = panel(ctx, 'a', St, M, ch, true);
    const B = panel(ctx, 'b', St, M, ch, false);
    const colors = [th.accent4, th.inkSoft];
    // both scenario headers use the SAME text size; labels and captions may wrap to two balanced lines
    const hdr = headerFits(ctx, [p.scenarioA, p.scenarioB], St.w, St.header - 24);
    const headers = geo.panels.map((pn, i) => panelHeader(ctx, {name: `head-${i}`, letter: i ? 'B' : 'A', fits: hdr.fits[i], size: hdr.size, x: pn.x, y: pn.headerY + 4, h: St.header - 24, color: colors[i]}));
    const backdrops = geo.panels.map((pn, i) => h('path', {d: roundRectPath(pn.x - 8, pn.y - 8, pn.w + 16, pn.h + 16, 26), fill: th.dark ? '#2c3036' : (i ? '#eef1f4' : '#f1efe8'), stroke: th.dark ? '#454b53' : '#d9d4c8', 'stroke-width': 2.5}));

    // the changed cells (every link that needs the changed source) are ringed in both scenes; the guide
    // joins the two scenes OUTSIDE the grids: it leaves each board straight down from the foot of the
    // changed column (below the last row, beside no pin or flag) and runs under the boards (side by
    // side) or through the gap between the scenes and down a lane beside them (stacked)
    const kc = A.changed[0];
    const pA = geo.panels[0], pB = geo.panels[1];
    const footOf = (pn, P) => (kc === undefined ? null : {x: pn.x + P.gx, y: pn.y + P.gridBottom});
    const cA = footOf(pA, A), cB = footOf(pB, B);
    let guide = null, guideChip = null;
    const row = arrangement === 'row';
    if (cA && cB) {
      let pts, chipAt;
      if (row) {
        const yLow = pA.y + St.h + 26 + guideH / 2;
        pts = [cA, {x: cA.x, y: yLow}, {x: cB.x, y: yLow}, cB];
        chipAt = {x: (cA.x + cB.x) / 2, y: yLow};
      } else {
        const laneX = geo.w + LANE / 2;
        const yA = pA.y + St.h + gap / 2, yB = pB.y + St.h + 18;
        pts = [cA, {x: cA.x, y: yA}, {x: laneX, y: yA}, {x: laneX, y: yB}, {x: cB.x, y: yB}, cB];
        chipAt = {x: clamp((cA.x + laneX) / 2, guideW / 2 + 10, laneX - guideW / 2 - 24), y: yA};
      }
      guide = laneGuide(ctx, 'guide', pts, 30, th.accent);
      if (ctx.show('key')) {
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: chipAt.x, y: chipAt.y - guideH / 2, anchor: 'middle', maxWidth: guideW, size: guideSize, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      }
    }
    const footY = geo.h + footTop;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: geo.w / 2, y: footY, anchor: 'middle', maxWidth: footW[0], size: 38, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, footTexts[1], {x: geo.w / 2, y: footY, maxWidth: footW[1], size: 36, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: geo.w / 2, y: footY, maxWidth: footW[2], size: 36, name: 'neutral-note'}) : null;

    // sheet flight in A: from its volume on the shelf into the slot at the head of its column
    const vol = A.vol;
    const hd = A.head;
    const fly = vol ? {dx: vol.cx - (hd.x + hd.w / 2), dy: vol.cy - (hd.y + hd.h / 2), k0: Math.max(0.2, vol.w / hd.w), cx: hd.x + hd.w / 2, cy: hd.y + hd.h / 2} : null;
    return {geo, St, s, ox, oy, A, B, headers, backdrops, guide, guideChip, changeChip, shared, neutral, fly, ch, kc, row, cA, cB, slotTxtB: ctx.show('key')};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.backdrops,
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, (i ? L.B : L.A).node)),
      L.guide && L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const sem = {};
    // A: the empty slot disappears under the arriving sheet; B: the slot's id fades under the note
    const landed = seg(u, W.fly[1] - 0.01, W.fly[1]);
    nodes[`a-mx-slot${L.ch}`] = {opacity: r(1 - landed, 3)};
    if (L.slotTxtB) nodes[`b-mx-slot${L.ch}-txt`] = {opacity: r(1 - seg(u, W.note[1] - 0.035, W.note[1]), 3)};
    const nL = L.A.G.links.length;
    const span = (W.links[1] - W.links[0]) / Math.max(1, nL);
    // identical schedule in both scenes: link k runs in [a_k, b_k]
    const winOf = k => [W.links[0] + k * span, W.links[0] + (k + 1) * span];
    for (const P of [L.A, L.B]) {
      const st = P.G.links.map(l => ({pos: l.park, lift: 0, col: 0, flag: 0}));
      const holders = [];
      const sockets = [];
      P.G.links.forEach((l, k) => {
        const [a, b] = winOf(k);
        const blocked = !P.supplied && l.col === L.ch;
        const mv = ease.inOutSine(seg(u, a, a + (b - a) * 0.72));
        if (blocked) {
          // B: the pin cannot land — it stays on its card; an empty socket marks the cell instead
          sockets.push(r(seg(u, a + (b - a) * 0.55, a + (b - a) * 0.85), 3));
          nodes[`${P.P}-cs${k}`] = {opacity: sockets[sockets.length - 1]};
          holders.push('card');
          return;
        }
        st[k].pos = mv > 0 ? arcPt(l.park, l.cell, mv, Math.min(40, Math.abs(l.cell.x - l.park.x) * 0.1)) : l.park;
        st[k].lift = Math.sin(Math.PI * mv) * 0.8;
        st[k].col = ease.outCubic(seg(u, a + (b - a) * 0.72, a + (b - a) * 0.95));
        st[k].flag = ease.outCubic(seg(u, a + (b - a) * 0.8, b));
        holders.push(mv >= 1 ? 'cell' : mv > 0 ? 'moving' : 'card');
      });
      Object.assign(nodes, P.links.pose({links: st}));
      sem[P.P] = {holders, pins: st.map(q => ({x: r(q.pos.x), y: r(q.pos.y)})), columnLit: st.map(q => r(q.col, 3)), sockets};
    }
    // change beat: A receives the sheet from its shelf; B gets a "source pending" note on the empty slot
    const gl = seg(u, ...W.glow) * (1 - seg(u, 0.36, 0.42));
    nodes['a-vglow'] = {opacity: r(gl, 3)};
    nodes['b-vglow'] = {opacity: 0};
    const fp = ease.inOutCubic(seg(u, ...W.fly));
    const F = L.fly;
    let sheetA = null;
    if (F) {
      const k = lerp(F.k0, 1, fp);
      nodes[`a-mx-drop${L.ch}`] = {opacity: fp > 0 ? 1 : 0, transform: `${T(F.dx * (1 - fp), F.dy * (1 - fp))} ${scaleAbout(F.cx, F.cy, k)}`};
      sheetA = {x: r(F.cx + F.dx * (1 - fp)), y: r(F.cy + F.dy * (1 - fp))};
    }
    nodes[`b-mx-drop${L.ch}`] = {opacity: 0};
    // B: a note is peeled off the pad on the ledge (flips up to face us), carried up and stuck on the slot
    const np = seg(u, ...W.note);
    const hd = L.B.head;
    let noteB = null;
    if (L.B.note) {
      const to = {x: hd.x + hd.w / 2, y: hd.y + hd.h * 0.56};
      const mv = ease.inOutSine(seg(np, 0.12, 1));
      const flip = ease.outCubic(seg(np, 0, 0.35));
      const lift = Math.sin(Math.PI * mv);
      const pos = arcPt(L.B.padAt, to, mv, 60);
      noteB = pos;
      // (lying on the pad it has the pad's width and is seen edge-on; it flips up to face us)
      const sy = lerp(L.B.PAD_SY, 1, flip);
      const sx = lerp(L.B.padW / L.B.note.w, 1, flip);
      nodes['b-pnote'] = {opacity: np > 0 ? 1 : 0, transform: `${T(pos.x, pos.y, -4 * mv)} scale(${r(sx * (1 + 0.08 * lift), 4)} ${r(sy * (1 + 0.08 * lift), 4)})`};
    }
    // guide + rings
    const gp = seg(u, ...W.guide);
    if (L.guide) Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    for (const P of [L.A, L.B]) P.changed.forEach((k, q) => { nodes[`${P.P}-ring${q}`] = {opacity: r(seg(u, ...W.rings), 3)}; });
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    if (L.changeChip) nodes['change-chip'] = {opacity: r(seg(u, ...W.changeChip) * (1 - seg(u, ...W.changeOut)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, ...W.sharedIn) * (1 - seg(u, ...W.sharedOut)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(seg(u, ...W.neutral), 3)};

    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const semantic = {
      beat,
      changedCol: L.ch,
      changedLinks: L.A.changed,
      a: {...sem.a, sheetSupplied: fp >= 1, sheetShown: fp > 0},
      b: {...sem.b, sheetShown: false, pendingNote: r(np, 3), noteOnSlot: np >= 1, noteWhole: L.B.noteWhole},
      // key texts of the matrix (propositions, source titles) shown whole in both scenes
      textsWhole: [L.A, L.B].every(P => P.G.rows.every(q => !q.fit.truncated) && P.G.cols.every(c => !c.titleFit || (!c.titleFit.truncated && !brokeWord(c.titleFit)))),
      guideProgress: r(gp, 3),
      arrangement: L.row ? 'row' : 'column',
      // same geometry in both scenes (panel-local)
      sameLayout: JSON.stringify(L.A.G.links.map(l => [l.park, l.cell])) === JSON.stringify(L.B.G.links.map(l => [l.park, l.cell])),
    };
    L.A.G.links.forEach((l, k) => { semantic[`aPin${k}`] = sem.a.pins[k]; semantic[`bPin${k}`] = sem.b.pins[k]; });
    if (sheetA) semantic.sheetA = sheetA;
    if (noteB) semantic.noteB = {x: r(noteB.x), y: r(noteB.y)};
    return {nodes, semantic};
  },
};

/**
 * Text fits for both scenario headers at one common size: the largest size at
 * which every label (≤ 2 lines) and caption (≤ 2 lines) fits the header strip.
 */
function headerFits(ctx, scs, w, hh) {
  const top = Math.min(54, hh * 0.42);
  for (let size = top; size >= 20; size -= 1) {
    const badge = size * 1.56 + 20;
    const fits = scs.map(sc => {
      const lf = ctx.show('key') ? fitWords(ctx, sc.label, {maxWidth: w - badge, size, minSize: size, maxLines: 2, weight: 700}) : null;
      const cs = Math.max(18, size * 0.6);
      const cf = sc.caption && ctx.show('all') ? fitWords(ctx, sc.caption, {maxWidth: w - badge, size: cs, minSize: cs, maxLines: 2, weight: 500}) : null;
      return {lf, cf};
    });
    const ok = fits.every(f => (!f.lf || !f.lf.truncated) && (!f.cf || !f.cf.truncated) && (f.lf ? f.lf.height : 0) + (f.cf ? f.cf.height + size * 0.34 : 0) <= hh);
    if (ok || size <= 20) return {size, fits};
  }
  return null;
}

/** Scenario header: letter badge + label + caption (fitted by headerFits). */
function panelHeader(ctx, o) {
  const th = ctx.theme;
  const {lf, cf} = o.fits;
  const badgeR = o.size * 0.78;
  const gap = o.size * 0.34;
  const blockH = (lf ? lf.height : 0) + (cf ? cf.height + gap : 0);
  const y0 = o.y + Math.max(0, (o.h - blockH) / 2);
  const by = lf ? y0 + lf.size * 0.5 + 2 : o.y + o.h / 2;
  const tx = o.x + badgeR * 2 + 18;
  return g({name: o.name},
    h('circle', {cx: r(o.x + badgeR), cy: r(by), r: r(badgeR), fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: r(o.x + badgeR), y: r(by + o.size * 0.36), 'text-anchor': 'middle', 'font-size': r(o.size), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.letter) : null,
    lf ? textBlock(lf, {x: tx, y: y0, fill: th.fg}) : null,
    cf ? textBlock(cf, {x: tx, y: y0 + (lf ? lf.height + gap : 0), fill: th.fgSoft}) : null);
}

/**
 * Comparison guide along a polyline with rounded corners (plain relation
 * style: no arrow, end dots), drawn on by arc length.
 */
function laneGuide(ctx, name, pts, rad, color) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  const samples = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const la = Math.hypot(b.x - a.x, b.y - a.y), lc = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, la / 2, lc / 2);
    const p1 = {x: b.x + ((a.x - b.x) / (la || 1)) * rr, y: b.y + ((a.y - b.y) / (la || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (lc || 1)) * rr, y: b.y + ((c.y - b.y) / (lc || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    samples.push(p1, p2);
  }
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  samples.push(last);
  let total = 0;
  for (let i = 1; i < samples.length; i++) total += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
  total *= 1.02;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: pts[0].x, cy: pts[0].y, r: 6, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: last.x, cy: last.y, r: 6, fill: color, opacity: 0}));
  const frame = (pr, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - pr))},
    [`${name}-dotA`]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: pr >= 0.985 ? 1 : 0},
  });
  return {node, frame};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-09-contrast',
    title: 'Authority matrix — source supplied vs source pending',
    titleEs: 'Matriz de autoridades — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Matriz de autoridades',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical library corners with the same cork-board authority matrix. Only one fact differs: whether one source has been supplied. In A its sheet comes down from the shelf into the empty column slot and the pin of the row that cites it lands in the cell; in B the slot gets a “source pending” note, that pin stays on its card and an empty socket marks the cell. All other pins run identically. Rings and a guide join the changed cell; neutral note, no winner or conclusion.',
    tags: ['research', 'authority matrix', 'comparison', 'supported proposition', 'pending source', 'side-by-side', 'stacked', 'citation', 'pins'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/matriz-de-autoridades.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
