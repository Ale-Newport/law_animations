/**
 * LAW-0073 — Matriz de autoridades · story
 *
 * Storyboard (a library bay seen from where the researcher stands; the
 * researcher's own arm reaches in from the bottom edge):
 *  0.00–0.15 rest     The library (bookcase, anchor) holds the supplied
 *                     sources as coloured volumes with their ids. On the cork
 *                     board the authority matrix waits: proposition cards
 *                     (fichas) down the left, source sheets (documentos)
 *                     across the top in the same colours, the search printout
 *                     (buscador) in the corner listing those sources. Each
 *                     supplied citation is a coloured pin resting on its
 *                     card's grommet, its thread tied there. A pad of sticky
 *                     notes lies on the board ledge. The hand rests on the
 *                     ledge.
 *  0.15–0.42 action   The hand reaches the first card, pinches its pin, lifts
 *                     it and carries it along the row — the thread pays out
 *                     from the grommet — to the column of the cited source;
 *                     it presses the pin into the cell and lets go. The column
 *                     lights down from the source sheet to the pin and the
 *                     supplied pinpoint flag unfurls on the pin.
 *  0.42–0.73 complete The remaining supplied links are carried the same way
 *                     (a row may link to several columns: parallel lanes).
 *                     For each row with no supplied citation the hand peels a
 *                     note off the pad (it flips up to face us) and sticks it
 *                     in the "pending source" column. Nothing moves before the
 *                     hand touches it; the hand never leaves a held item.
 *  0.73–1.00 hold     The hand returns to the ledge. The supplied final state
 *                     is shown (a status tag; optionally the pending rows are
 *                     called out) plus editorial callouts. The matrix only
 *                     shows the links the author supplied — no evaluation of
 *                     whether a source supports a proposition.
 * Layouts: 16:9 bookcase standing left of the board; 9:16 and 1:1 a wall
 * shelf above the board (recomposed, not scaled). 1:1 with texts too long for
 * the shelved matrix: a narrow bookcase (ids up the volume spines) stands left
 * of a banded matrix; this choice depends on the texts only, never on whether
 * labels are shown. Labels hidden: pins, their colours, threads, column lights
 * and the note still carry the action.
 * @module animations/research/LAW-0073
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, oneOf, list, obj, annotation} from '../../schemas/fields.js';
import {chip, statusTag} from '../../primitives/annotate.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {
  matrixFields, MATRIX_DEFAULTS, MATRIX_STRINGS, MAT, resolveMatrix, roomWindow, bookcase, corkBoard,
  matrixGeometry, bandedGeometry, matrixStatic, matrixLinks, researcherArm, mixPt, arcPt, packBand, balancedChipWidth, brokeWord,
  searchField, boxesOverlap, lineBoxes,
} from './kits/matriz-de-autoridades.js';

const ID = 'LAW-0073';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Trip window for all hand trips; hold windows. */
const W = {trips: [0.155, 0.725], tag: [0.75, 0.8], ring: [0.76, 0.82], note: [0.8, 0.9]};
const ARM_EXT = 0.84;

const STRINGS = {
  en: {...MATRIX_STRINGS.en, holdLinked: 'Supplied links pinned', holdPending: 'Pending source marked (as supplied)'},
  es: {...MATRIX_STRINGS.es, holdLinked: 'Vínculos aportados fijados', holdPending: 'Fuente pendiente marcada (según lo aportado)'},
};

const sceneSchema = {
  ...matrixFields,
  actorLabels: obj('Caption for the actor', {researcher: str('Caption on the researcher’s sleeve tag (descriptive role, fictional)', 50)}),
  objectLabels: obj('Labels printed on props', {
    library: str('Plaque on the library bookcase', 40),
    note: str('Text written on the sticky note placed on a row without a supplied source', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['link', 'pending', 'search', 'library']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: the supplied links pinned, or the same with the rows that have no supplied source called out (no conclusion is drawn either way)', ['links-pinned', 'pending-called-out']),
};

const defaultParams = {
  ...MATRIX_DEFAULTS,
  actorLabels: {researcher: 'Researcher'},
  objectLabels: {library: 'Library', note: 'Source pending'},
  actionProgress: 1,
  annotations: [{target: 'pending', text: 'No source has been supplied for this row yet'}],
  finalState: 'links-pinned',
};

/** Per-shape composition constants (design units). */
const SHAPES = {
  landscape: {ts: 1.15, band: 88, floorH: 62, lib: 'side', libW: 300, shelves: 4, chip: 27, ledgeGap: 66, armTh: 60},
  square: {ts: 1, band: 66, floorH: 40, lib: 'top', libH: 172, shelves: 1, chip: 25, ledgeGap: 38, armTh: 62, volScale: 1.55, compact: true, narrowW: 108},
  portrait: {ts: 1.06, band: 100, floorH: 64, lib: 'top', libH: 250, shelves: 2, chip: 28, ledgeGap: 60, armTh: 74, volScale: 1.15, titleLines: 5, dateLines: 2},
};

function compose(ctx) {
  const SH = SHAPES[ctx.view.shape];
  // square frame, long texts: when the matrix cannot keep every proposition, source id, title and note
  // whole and legible under the wall shelf, the library becomes a narrow bookcase standing beside the
  // board (the anchor stays in view with its tagged volumes) and the matrix is banded, using the full
  // board height. The choice is made from the texts themselves (as if every label were shown), so the
  // composition is the same whether labels are shown or hidden.
  let mode = SH.lib;
  if (SH.lib === 'top' && SH.compact) {
    const all = {...ctx, labels: 'all', show: () => true};
    const A = composeBand(all, 'top');
    if (!A.legible && composeBand(all, 'narrow').legibility > A.legibility) mode = 'narrow';
  }
  return composeBand(ctx, mode);
}

/** Lay out with the nominal band; if the hold chips need more rows, lay out again with a taller band. */
function composeBand(ctx, mode) {
  const SH = SHAPES[ctx.view.shape];
  const L = composeWith(ctx, SH.band, mode);
  return L.bandNeed > SH.band + 0.5 ? composeWith(ctx, L.bandNeed, mode) : L;
}

/**
 * Lowest header height at which a corner printout of width w shows the whole
 * query (wrapped, never cut) above result rows that stay legible.
 */
function cornerHeadH(ctx, query, w, nS, ts) {
  if (!ctx.show('all') || !query) return 0;
  for (let hh = 96 * ts; hh <= 220 * ts; hh += 6 * ts) {
    const sf = searchField(ctx, {box: {x: 0, y: 0, w, h: hh}, query, ts, nSources: nS});
    if (sf.qFit && !sf.qFit.truncated && !brokeWord(sf.qFit) && sf.rowH >= 22 * ts) return hh;
  }
  return 0;
}

/** Legibility of a matrix layout: 1 when every key text is whole, unbroken and at a readable size. */
function legibilityOf(ctx, G, M, minPx) {
  if (!ctx.show('key')) return 1;
  let bad = 0;
  for (const row of G.rows) if (row.fit.truncated || row.fit.size < minPx) bad++;
  for (const c of G.cols) {
    if (!c.titleFit) continue;
    if (c.titleFit.truncated || brokeWord(c.titleFit) || c.titleFit.size < minPx) bad++;
    if (c.dateFit && ctx.show('all') && (c.dateFit.truncated || brokeWord(c.dateFit))) bad += 0.5;
  }
  return 1 / (1 + bad);
}

function composeWith(ctx, band, mode) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const SH = SHAPES[ctx.view.shape];
  const ts = SH.ts;
  const M = resolveMatrix(p);
  const floorY = D.h - SH.floorH;
  // 'narrow' (square, long texts): a slim bookcase stands on the floor left of the board, the matrix is banded
  const banded = mode === 'narrow';
  let libBox, boardBox;
  if (mode === 'side') {
    libBox = {x: 30, y: band + 20, w: SH.libW, h: floorY + 4 - (band + 20)};
    const bx = libBox.x + libBox.w + 44;
    boardBox = {x: bx, y: band, w: D.w - bx - 30, h: floorY - band - SH.ledgeGap};
  } else if (banded) {
    libBox = {x: 12, y: band + 8, w: SH.narrowW, h: floorY + 4 - (band + 8)};
    const bx = libBox.x + libBox.w + 14;
    boardBox = {x: bx, y: band + 8, w: D.w - bx - 16, h: floorY - band - 8 - SH.ledgeGap};
  } else {
    // a taller band (two rows of hold chips) is taken from the wall shelf, not from the matrix
    libBox = {x: 44, y: band, w: D.w - 88, h: Math.max(72, SH.libH - (band - SH.band))};
    const by = libBox.y + libBox.h + 22;
    boardBox = {x: 22, y: by, w: D.w - 44, h: floorY - by - SH.ledgeGap};
  }
  const room = roomWindow(ctx, {prefix: 'room', box: {x: 0, y: 0, w: D.w, h: D.h}, floorY});
  const lib = banded
    // (the narrow bookcase: four shelves, one tagged volume per shelf, ids up the spines; the plaque may
    // overhang the case a little and take three lines)
    ? bookcase(ctx, {prefix: 'lib', ...libBox, shelves: 4, sources: M.sources, ts, seedKey: 'lib', label: p.objectLabels.library, plinth: true, spines: true, plaqueLines: 3, plaqueW: libBox.w + 12})
    : bookcase(ctx, {prefix: 'lib', ...libBox, shelves: SH.shelves, sources: M.sources, ts, seedKey: 'lib', label: p.objectLabels.library, plinth: mode === 'side', volScale: SH.volScale});
  const board = corkBoard(ctx, {prefix: 'board', ...boardBox, seedKey: 'board'});
  const inset = (banded ? 10 : 16) * ts;
  const mbox = {x: board.inner.x + inset, y: board.inner.y + inset, w: board.inner.w - inset * 2, h: board.inner.h - inset * 2};
  // (tall frames: long titles may take up to five lines and long dates two, rather than being cut)
  // beside the narrow bookcase (square, long texts) the matrix is banded: each proposition is a strip across
  // the board with its lane of cells beneath, so the source columns are wide enough for whole titles
  // (banded: the header row is at least tall enough for the corner printout to show the whole query
  // above its result rows — short titles must not squeeze the author's query into an ellipsis)
  // (the header may also grow a little, while the lanes keep what their pins and notes need, so that short
  // titles take a second line at a larger common size instead of one small line)
  const cornerW = Math.max(170 * ts, mbox.w * (banded ? 0.225 : 0.21));
  let G;
  if (banded) {
    const head0 = cornerHeadH(ctx, p.query, cornerW, M.nS, ts);
    const bandedWith = minHeadH => bandedGeometry(ctx, M, mbox, {ts, R: 12 * ts, corner: {w: cornerW}, titleMaxLines: 4, titleCompact: true, titleMin: 15.6, cardMin: 16.5, noteLane: 64 * ts, minHeadH});
    G = bandedWith(head0);
    for (const extra of head0 ? [8, 16, 24, 32] : []) {
      const C = bandedWith(head0 + extra * ts);
      // (never at the cost of the lanes or of the proposition strips)
      if (C.laneShort > 0.5 || C.laneShort > G.laneShort + 0.5 || C.stripH < G.stripH - 0.5 || C.rows.some(q => q.fit.truncated)) break;
      if (C.titleMinSize > G.titleMinSize + 0.25) G = C;
    }
  } else {
    G = matrixGeometry(ctx, M, mbox, {ts, titleMaxLines: SH.titleLines ?? 3, dateMaxLines: SH.dateLines ?? 1});
  }
  const legibility = legibilityOf(ctx, G, M, SH.minPx ?? 15.5);
  const stat = matrixStatic(ctx, {prefix: 'mx', G, M, query: p.query});
  // the pending note's words stay legible: up to three lines, using most of the cell's width
  const links = matrixLinks(ctx, {prefix: 'lk', G, M, notes: true, noteText: p.objectLabels.note || t.sourcePending,
    noteWFrac: 0.94, noteTextOpts: {size: 20 * ts, minSize: 15.5, maxLines: 3}});

  // --- note pad lying on the ledge under the pending column (seen slightly from above)
  const ns = links.noteSize;
  const L = board.ledge;
  const padX = G.pending.length ? G.pending[0].cell.x : G.sheet.x + G.sheet.w - G.colW / 2;
  const padY = L.y + 6;
  const PAD_SY = 0.2;
  const pad = G.pending.length ? g({name: 'pad'},
    h('path', {d: `M${r(padX - ns.w / 2 + 6)} ${r(padY + ns.h * PAD_SY / 2 + 8)}h${r(ns.w)}v6h${r(-ns.w)}Z`, fill: th.shadow}),
    [2, 1].map(k => h('rect', {x: r(padX - ns.w / 2), y: r(padY - ns.h * PAD_SY / 2 + k * 3), width: r(ns.w), height: r(ns.h * PAD_SY), rx: 2, fill: shade(MAT.note, -0.06 * k), stroke: shade(MAT.note, -0.45), 'stroke-width': 1.4}))) : null;
  const padTop = {x: padX, y: padY};

  // --- the researcher's arm (reach sized to the farthest target)
  const look = actorLook(ctx, {appearance: {}}, 0);
  // the hand rests on the ledge a third of the way across the matrix (clear of the pad and the notes)
  const restHand = {x: G.sheet.x + G.sheet.w * 0.34, y: L.y + 8};
  // constant-extension arm: the shoulder stays below the room (off stage) down-right of the
  // hand, so the elbow keeps one natural bend (outward) for every target — no flips
  const anchorX = boardBox.x + boardBox.w * 0.55;
  const thOf = hand => (SH.armTh + 10 * clamp((hand.x - anchorX) / boardBox.w, -0.5, 0.5)) * Math.PI / 180;
  const targets = [restHand, ...G.links.map(l => l.park), ...G.links.map(l => l.cell), ...G.pending.map(q => q.cell), padTop];
  // arm length: the highest target (lifted by the carry arc) still has its shoulder below the room
  const minY = Math.min(...targets.map(q => q.y)) - 80 * ts;
  const reach = Math.max(520, (D.h + 60 - minY) / (ARM_EXT * Math.sin((SH.armTh - 5) * Math.PI / 180)));
  const shoulderOf = hand => {
    const a = thOf(hand);
    return {x: hand.x + ARM_EXT * reach * Math.cos(a), y: hand.y + ARM_EXT * reach * Math.sin(a)};
  };
  const arm = researcherArm(ctx, {name: 'arm', look, reach, handed: 'right'});

  // --- trips: every supplied link (pin from its card), then every pending row (note from the pad)
  const trips = [
    ...G.links.map((l, k) => ({kind: 'pin', k, pick: l.park, drop: l.cell, row: l.row, col: l.col})),
    ...G.pending.map((q, i) => ({kind: 'note', q: i, pick: padTop, drop: q.cell, row: q.row})),
  ];
  // Schedule: time per leg ∝ travel distance (steady hand speed), plus fixed grip/press beats.
  const n = Math.max(1, trips.length);
  const span = W.trips[1] - W.trips[0];
  const gripU = Math.min(0.02, span * 0.2 / n), pressU = Math.min(0.02, span * 0.2 / n);
  let cur = restHand;
  let distTotal = 0;
  trips.forEach(tr => {
    tr.release = {x: tr.drop.x + 30 * ts, y: tr.drop.y + 60 * ts};
    tr.lift = Math.min(70 * ts, Math.hypot(tr.drop.x - tr.pick.x, tr.drop.y - tr.pick.y) * 0.16);
    tr.dReach = Math.hypot(tr.pick.x - cur.x, tr.pick.y - cur.y) + 40;
    tr.dCarry = Math.hypot(tr.drop.x - tr.pick.x, tr.drop.y - tr.pick.y) * 1.08 + 40;
    tr.dRel = Math.hypot(tr.release.x - tr.drop.x, tr.release.y - tr.drop.y) + 20;
    tr.from = cur;
    distTotal += tr.dReach + tr.dCarry + tr.dRel;
    cur = tr.release;
  });
  const dHome = Math.hypot(restHand.x - cur.x, restHand.y - cur.y) + 40;
  distTotal += trips.length ? dHome : 0;
  const rate = (span - n * (gripU + pressU)) / Math.max(1, distTotal);
  let tc = W.trips[0];
  trips.forEach(tr => {
    tr.a = tc;
    tr.reachEnd = tc += tr.dReach * rate;
    tr.gripEnd = tc += gripU;
    tr.carryEnd = tc += tr.dCarry * rate;
    tr.pressEnd = tc += pressU;
    tr.b = tc += tr.dRel * rate;
  });
  const home = {a: tc, b: tc + dHome * rate, from: cur};

  // --- band: status tag + editorial callouts (final hold), packed into rows above the room
  const tagText = p.finalState === 'pending-called-out' && G.pending.length ? t.holdPending : t.holdLinked;
  const tagProbe = ctx.show('key') ? statusTag(ctx, tagText, {x: 0, y: 0, size: SH.chip, maxWidth: Math.min(D.w * 0.62, 640)}) : null;
  const items = [];
  // (with a callout whose leader runs down the left margin, the status tag keeps to the middle of the band)
  const leftLeader = (mode === 'top' || banded) && ctx.show('all') && p.annotations.some(a => a.target === 'search');
  if (tagProbe) items.push({kind: 'tag', w: tagProbe.box.w, h: tagProbe.box.h, prefX: leftLeader ? D.w / 2 : boardBox.x + 6 + tagProbe.box.w / 2});
  const chipSize = SH.chip * 0.92;
  const opts = [[0.46, 2], [0.34, 3], [0.26, 4]];
  const notesIn = [];
  const topLib = mode === 'top';
  if (ctx.show('all')) {
    p.annotations.forEach((a, i) => {
      const tg = annotationTarget(a.target, {G, lib, links, board, topLib, D});
      if (!tg) return;
      const fits = opts.map(([fw, ml]) => {
        // balanced lines: no orphan word on the last line of a callout
        const maxW = balancedChipWidth(ctx, a.text, {maxWidth: Math.min(D.w * fw, 540), size: chipSize, maxLines: ml});
        const probe = chip(ctx, a.text, {x: 0, y: 0, maxWidth: maxW, size: chipSize, maxLines: ml});
        return {maxW, ml, w: probe.box.w, h: probe.box.h, trunc: probe.fit.truncated};
      });
      notesIn.push({kind: 'note', i, a, tg, fits, prefX: tg.bandX});
    });
  }
  // choose chip shapes (wide/2 lines … narrow/4 lines) that give the lowest band
  const rowGap = 10;
  const bandOf = rws => rws.reduce((acc, row) => acc + Math.max(...row.map(q => q.h)) + rowGap, 10) + 4;
  let bestPack = null;
  const combos = notesIn.length ? opts.map((_, k) => k).flatMap(k0 => (notesIn.length > 1 ? opts.map((__, k1) => [k0, k1]) : [[k0]])) : [[]];
  for (const combo of combos) {
    const its = [...items, ...notesIn.map((q, j) => ({...q, ...q.fits[combo[j]], pick: combo[j]}))];
    if (its.some(q => q.trunc)) continue;
    const rws = packBand(its, {x0: 14, x1: D.w - 14, gap: 16});
    // (a callout pushed away from its leader's start pays for it: a narrower chip that stays above its
    // target beats a long diagonal or horizontal leader across the band)
    const drift = rws.flat().filter(q => q.it.kind === 'note').reduce((acc, q) => acc + Math.abs(q.it.prefX - clamp(q.it.prefX, q.x + 14, q.x + q.w - 14)), 0);
    const hgt = bandOf(rws) + combo.reduce((acc, k) => acc + k * 2, 0) + drift * 0.1;
    if (!bestPack || hgt < bestPack.hgt) bestPack = {rws, hgt};
  }
  if (!bestPack) {
    const its = [...items, ...notesIn.map(q => ({...q, ...q.fits[opts.length - 1]}))];
    const rws = packBand(its, {x0: 14, x1: D.w - 14, gap: 16});
    bestPack = {rws, hgt: bandOf(rws)};
  }
  const rows = bestPack.rws;
  let yy = 10;
  const rowY = rows.map(row => { const y0 = yy; yy += Math.max(...row.map(q => q.h)) + rowGap; return y0; });
  const bandNeed = Math.max(SH.band, yy + 4);
  let tag = null;
  const notes = [];
  rows.forEach((row, ri) => row.forEach(q => {
    const y = rowY[ri] + (Math.max(...row.map(z => z.h)) - q.h) / 2;
    if (q.it.kind === 'tag') {
      tag = statusTag(ctx, tagText, {x: q.x, y, size: SH.chip, maxWidth: Math.min(D.w * 0.62, 640), name: 'state-tag', color: tagText === t.holdLinked ? th.accent2 : th.inkSoft, opacity: 0});
      return;
    }
    const {i, a, tg, maxW, ml} = q.it;
    const c = chip(ctx, a.text, {x: q.x, y, maxWidth: maxW, size: chipSize, maxLines: ml, fill: th.card, stroke: th.ink, name: `note${i}-chip`});
    // the leader drops from the chip when its first run is under the chip; otherwise it leaves the chip's
    // side at mid-height and runs across to that margin first (it never cuts diagonally across the scene)
    const x0 = tg.path[0].x, cb = c.box;
    let head;
    if (x0 >= cb.x + 14 && x0 <= cb.x + cb.w - 14) head = [{x: x0, y: cb.y + cb.h}];
    else if (tg.margin) {
      const my = cb.y + cb.h / 2;
      head = x0 > cb.x + cb.w ? [{x: cb.x + cb.w, y: my}, {x: x0, y: my}] : [{x: cb.x, y: my}, {x: x0, y: my}];
    } else head = [{x: clamp(x0, cb.x + 14, cb.x + cb.w - 14), y: cb.y + cb.h}];
    const pts = [...head, ...tg.path];
    const d = pts.map((pt, k) => `${k ? 'L' : 'M'}${r(pt.x)} ${r(pt.y)}`).join('');
    let total = 0;
    for (let k = 1; k < pts.length; k++) total += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    const end = pts[pts.length - 1];
    const node = g({name: `note${i}`, opacity: 0},
      h('path', {name: `note${i}-lead`, d, fill: 'none', stroke: th.ink, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 6)}`, 'stroke-dashoffset': r(total)}),
      h('circle', {name: `note${i}-dot`, cx: r(end.x), cy: r(end.y), r: 6.5, fill: th.ink, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
      c.node);
    notes.push({i, node, total, box: c.box, target: a.target, end});
  }));
  // pending rows called out: a highlight ring around each placed note
  // (banded: the ring stays inside the note's lane, clear of the card strips)
  const ringH = q => (G.banded ? Math.min(ns.h + 20, G.rows[q.row].laneH + 2) : ns.h + 20);
  const rings = G.pending.map((q, i) => h('rect', {name: `ring${i}`, x: r(q.cell.x - ns.w / 2 - 10), y: r(q.cell.y - ringH(q) / 2), width: r(ns.w + 20), height: r(ringH(q)), rx: 12, fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-dasharray': '12 8', opacity: 0}));

  // sleeve badge naming the actor: rides on the forearm, shown while the hand rests
  const who = ctx.show('key') && p.actorLabels.researcher
    ? chip(ctx, p.actorLabels.researcher, {x: 0, y: 0, anchor: 'middle', maxWidth: 300 * ts, size: SH.chip * 0.9, maxLines: 1, fill: th.card, stroke: th.ink, name: 'who-chip'})
    : null;

  // (reported in the semantics: the corner printout's query and the pending note's text show whole)
  const qf = G.corner && ctx.show('all') ? searchField(ctx, {box: G.corner, query: p.query, ts, nSources: M.nS}).qFit : null;
  const textsWhole = {query: !qf || (!qf.truncated && !brokeWord(qf)), note: !links.noteFit || (!links.noteFit.truncated && !brokeWord(links.noteFit))};
  return {M, G, room, lib, board, stat, links, pad, padTop, PAD_SY, arm, look, restHand, shoulderOf, trips, home, tag, notes, rings, ns, ts, who, D, bandNeed, legibility, legible: legibility === 1, libMode: mode, textsWhole};
}

/**
 * Target point and leader route (from the band) for an annotation. `margin`
 * routes start with a vertical run down a margin OUTSIDE the scene's props
 * (the chip's leader first runs across to that margin): with the wall shelf
 * above the board (9:16, 1:1) nothing may be crossed on the way down.
 */
function annotationTarget(target, {G, lib, links, board, topLib, D}) {
  const R = G.R;
  const rightMargin = Math.min(D.w - 10, board.inner.x + board.inner.w + 18 + 10);
  if (target === 'link') {
    const l0 = G.links[0];
    if (!l0) return null;
    // the row's last cited column: the rest of its lane is empty (no pin, no flag)
    const l = G.links.filter(q => q.row === l0.row).reduce((a, b) => (b.col > a.col ? b : a));
    const fi = links.flagInfo[l.k] && links.flagInfo[l.k].local;
    if (topLib || G.banded) {
      // down the right margin, then in along that lane to the pin (banded: the pinpoint flag opens
      // beside the pin, inside the lane, so the leader stops at the flag's far end, never across it)
      const endX = G.banded && fi ? l.cell.x + fi.x + fi.w + 5 : l.cell.x + R * 1.35;
      return {bandX: rightMargin - 90, margin: true, path: [{x: rightMargin, y: l.cell.y}, {x: endX, y: l.cell.y}]};
    }
    // down the gap between the source sheets left of that column (above every thread and flag of the
    // row), then in to the pin's upper-left — beside its column light, never across a thread or flag
    const gx = G.cols[l.col].x0;
    const turn = {x: gx, y: l.cell.y - R * 2.4};
    const end = {x: l.cell.x - R * 0.85, y: l.cell.y - R * 0.75};
    const flagBoxes = G.links.map((q, k) => {
      const f = links.flagInfo[k] && links.flagInfo[k].local;
      return f ? {x: q.cell.x + f.x, y: q.cell.y + f.y, w: f.w, h: f.h} : null;
    }).filter(Boolean);
    const threadBoxes = G.links.map(q => ({x: q.anchor.x, y: q.cell.y - 3, w: q.cell.x - q.anchor.x, h: 6}));
    const pinBoxes = G.links.filter(q => q !== l).map(q => ({x: q.cell.x - R * 1.2, y: q.cell.y - R * 1.2, w: R * 2.4, h: R * 2.4}));
    const run = lineBoxes([{x: gx, y: G.sheet.y - 4}, turn, end], 4, 8);
    const clear = !run.some(b => [...flagBoxes, ...threadBoxes, ...pinBoxes].some(q => boxesOverlap(b, q, 3)));
    if (clear) return {bandX: gx, path: [turn, end]};
    // (fallback: down the gutter left of the first cited column, then diagonally to its pin)
    const c = G.cols[l0.col];
    return {bandX: c.x0, path: [{x: c.x0, y: l0.cell.y + R * 2.4}, {x: l0.cell.x - R * 0.8, y: l0.cell.y + R * 0.8}]};
  }
  if (target === 'pending') {
    const q = G.pending[0];
    if (!q) return null;
    const ns = links.noteSize;
    // down outside the board's right frame, then in to the note's right edge
    return {bandX: rightMargin - 60, margin: true, path: [{x: rightMargin, y: q.cell.y}, {x: q.cell.x + ns.w / 2 + 2, y: q.cell.y}]};
  }
  if (target === 'search') {
    const c = G.corner;
    if (topLib) {
      // down the left margin beside the wall shelf, then in to the printout's left edge
      const gx = lib ? Math.max(10, lib.box.x - 16) : Math.max(10, board.inner.x - 18 - 10);
      const ty = c.y + Math.min(c.h * 0.3, 40);
      return {bandX: gx + 90, margin: true, path: [{x: gx, y: ty}, {x: c.x - 2, y: ty}]};
    }
    return {bandX: c.x + c.w * 0.7, path: [{x: c.x + c.w * 0.7, y: c.y - 2}]};
  }
  if (target === 'library') {
    if (!lib) return null;
    const b = lib.box;
    return {bandX: b.x + b.w * 0.5, path: [{x: b.x + b.w * 0.5, y: b.y - 6}]};
  }
  return null;
}

const scene = {
  sizes: {landscape: [1600, 880], square: [1060, 820], portrait: [900, 1380]},
  layout: compose,
  build(ctx, L) {
    const {room, lib, board, stat, links, arm} = L;
    return g(null,
      room.surface,
      lib && lib.node,
      board.node,
      stat.sheet,
      // (banded matrix: the column lights run UNDER the proposition strips, never across their text)
      L.G.banded ? links.colLinks : null,
      stat.heads,
      stat.corner,
      stat.cards,
      L.G.banded ? null : links.colLinks,
      links.sockets,
      links.threads,
      links.notes,
      L.rings,
      links.pins,
      links.flags,
      L.pad,
      g({'clip-path': room.clip}, arm.arm, arm.palm, links.held, arm.thumb),
      room.frame,
      L.who && g({name: 'who', opacity: 0}, L.who.node),
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const {G, trips, links, ts} = L;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const R = G.R;

    // --- item states and the hand path (absolute phase windows computed in layout)
    const linkSt = G.links.map(l => ({pos: l.park, lift: 0, held: false, col: 0, flag: 0}));
    const noteSt = G.pending.map(() => ({pos: L.padTop, lift: 0, held: false, visible: 0, sy: L.PAD_SY}));
    const holder = G.links.map(() => 'card');
    const noteHolder = G.pending.map(() => 'pad');
    const sine = ease.inOutSine;
    let hand = L.restHand;
    let heldPt = null;
    let activeTrip = -1;
    for (let i = 0; i < trips.length; i++) {
      const tr = trips[i];
      if (a < tr.a) break;
      activeTrip = i;
      const st = tr.kind === 'pin' ? linkSt[tr.k] : noteSt[tr.q];
      const grip = seg(a, tr.reachEnd, tr.gripEnd);
      const carry = sine(seg(a, tr.gripEnd, tr.carryEnd));
      const press = seg(a, tr.carryEnd, tr.pressEnd);
      const heldNow = a >= tr.reachEnd + (tr.gripEnd - tr.reachEnd) * 0.3 && a < tr.pressEnd;
      const itemPos = carry > 0 ? arcPt(tr.pick, tr.drop, carry, tr.lift) : tr.pick;
      if (a < tr.reachEnd) hand = mixPt(tr.from, tr.pick, sine(seg(a, tr.a, tr.reachEnd)));
      else if (a < tr.pressEnd) hand = itemPos;
      else hand = mixPt(tr.drop, tr.release, sine(seg(a, tr.pressEnd, tr.b)));
      st.pos = itemPos;
      st.lift = ease.outCubic(grip) * (1 - ease.inOutSine(press));
      st.held = heldNow;
      if (tr.kind === 'pin') holder[tr.k] = heldNow ? 'hand' : a >= tr.pressEnd ? 'cell' : 'card';
      else {
        noteHolder[tr.q] = heldNow ? 'hand' : a >= tr.pressEnd ? 'cell' : 'pad';
        st.visible = heldNow || a >= tr.pressEnd ? 1 : 0;
        st.sy = lerp(L.PAD_SY, 1, ease.outCubic(seg(a, tr.reachEnd, tr.gripEnd + (tr.carryEnd - tr.gripEnd) * 0.35)));
      }
      if (heldNow) heldPt = st.pos;
    }
    // after the last trip the hand goes home to the ledge
    if (trips.length && a >= L.home.a) hand = mixPt(L.home.from, L.restHand, sine(seg(a, L.home.a, L.home.b)));

    // column lights and pinpoint flags follow each press
    trips.forEach(tr => {
      if (tr.kind !== 'pin') return;
      const pe = tr.pressEnd;
      linkSt[tr.k].col = ease.outCubic(seg(a, pe, pe + 0.045));
      linkSt[tr.k].flag = ease.outCubic(seg(a, pe + 0.015, pe + 0.05));
    });

    const nodes = links.pose({
      links: linkSt,
      notes: noteSt.map(n => ({pos: n.pos, lift: n.lift, held: n.held, visible: n.visible, sy: n.sy})),
    });
    // notes flip up from the pad: vertical squash while lying on the pad
    G.pending.forEach((q, i) => {
      const n = noteSt[i];
      const tf = `${T(n.pos.x, n.pos.y)} scale(${r(1 + 0.06 * n.lift, 4)} ${r(n.sy * (1 + 0.06 * n.lift), 4)})`;
      nodes[`lk-nt${i}`].transform = tf;
      nodes[`lk-hn${i}`].transform = tf;
    });

    // --- arm
    const shoulder = L.shoulderOf(hand);
    const solved = L.arm.pose(shoulder, hand, -1);
    Object.assign(nodes, solved.nodes);

    // sleeve badge: on the forearm, only while the hand rests (before the first trip, after homing)
    if (L.who) {
      const lo = solved.nodes['arm-lower'];
      const q = {x: lerp(lo.x2, lo.x1, 0.5), y: lerp(lo.y2, lo.y1, 0.5)};
      const bw = L.who.box.w, bh = L.who.box.h;
      const bx = clamp(q.x, bw / 2 + 12, L.D.w - bw / 2 - 12), by = clamp(q.y - bh / 2, 12, L.D.h - bh - 12);
      const homeEnd = trips.length ? L.home.b : W.trips[0];
      const vis = (1 - seg(a, W.trips[0] - 0.01, W.trips[0] + 0.02)) + (done ? seg(u, homeEnd, homeEnd + 0.03) : 0);
      nodes.who = {transform: T(bx, by), opacity: r(clamp(vis), 3)};
    }

    // --- hold: tag, rings, callouts
    const holdP = done ? 1 : 0;
    if (L.tag) nodes['state-tag'] = {opacity: r(seg(u, ...W.tag) * holdP, 3)};
    const called = p.finalState === 'pending-called-out' && done;
    G.pending.forEach((q, i) => { nodes[`ring${i}`] = {opacity: called ? r(seg(u, ...W.ring), 3) : 0}; });
    L.notes.forEach(n => {
      const np = done ? seg(u, ...W.note) : 0;
      nodes[`note${n.i}`] = {opacity: np > 0 ? 1 : 0};
      nodes[`note${n.i}-lead`] = {'stroke-dashoffset': r(n.total * (1 - Math.min(1, np * 1.6)))};
      nodes[`note${n.i}-dot`] = {opacity: np >= 0.6 ? 1 : 0};
      nodes[`note${n.i}-chip`] = {opacity: r(clamp((np - 0.45) / 0.55), 3)};
    });

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const pinned = G.links.map((l, k) => holder[k] === 'cell');
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      // the SOLVED hand (IK result), so the attach check compares the real hand with the held item
      hand: P2(solved.hand),
      handTarget: P2(hand),
      allReached: solved.reached,
      reach: {hand: solved.reached},
      holders: holder,
      noteHolders: noteHolder,
      pinned,
      pinCells: G.links.map((l, k) => (pinned[k] ? {row: l.row, col: l.col} : null)),
      pinAtCell: G.links.map((l, k) => Math.hypot(linkSt[k].pos.x - l.cell.x, linkSt[k].pos.y - l.cell.y) < 0.5),
      columnLit: linkSt.map(s => r(s.col, 3)),
      flags: linkSt.map(s => r(s.flag, 3)),
      pendingRows: G.pending.map(q => q.row),
      notesPlaced: noteHolder.map(hn => hn === 'cell'),
      noteCol: G.pending.map(q => (G.cols[G.cols.length - 1].pending && Math.abs(q.cell.x - G.cols[G.cols.length - 1].cx) < 0.5 ? 'pending' : 'other')),
      activeTrip,
      tripOrder: trips.map(tr => (tr.kind === 'pin' ? `pin${tr.k}` : `note${tr.q}`)),
      linkCount: G.links.length,
      citedCells: G.links.map(l => `${l.row}:${l.col}`),
      calledOut: called,
      tagVisible: Boolean(L.tag) && done && u >= W.tag[0],
      pinR: r(R),
      textsWhole: L.textsWhole,
      geo: {headW: r(G.headW), headH: r(G.headH), rowH: r(G.rowH), colW: r(G.colW), sheet: {y: r(G.sheet.y), h: r(G.sheet.h)}, cardLines: G.rows.map(q => q.fit.lines.length), cardSize: G.rows.map(q => r(q.fit.size)), truncated: G.rows.map(q => q.fit.truncated), design: {w: r(L.D.w), h: r(L.D.h)}, bandNeed: r(L.bandNeed), banded: Boolean(G.banded), shelf: Boolean(L.lib), library: L.libMode, lanes: G.banded ? G.rows.map(q => r(q.laneH)) : null, strip: G.banded ? r(G.stripH) : null, titleLines: G.cols.map(c => (c.titleFit ? c.titleFit.lines.length : 0)), titleSize: G.cols.map(c => (c.titleFit ? r(c.titleFit.size) : 0)), dateLines: G.cols.map(c => (c.dateFit ? c.dateFit.lines.length : 0))},
    };
    if (heldPt) semantic.held = P2(heldPt);
    G.links.forEach((l, k) => { semantic[`pin${k}`] = P2(linkSt[k].pos); });
    G.pending.forEach((q, i) => { semantic[`note${i}`] = P2(noteSt[i].pos); });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-09-story',
    title: 'Authority matrix — pinning rows to the supplied sources',
    titleEs: 'Matriz de autoridades — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Matriz de autoridades',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Library-bay microscene: on a cork-board authority matrix the researcher’s hand carries each supplied citation — a coloured pin tied by a thread to its proposition card — along the row and presses it into the column of the cited source sheet; the column lights down and the pinpoint flag unfurls. Rows with no supplied source get a “source pending” note peeled from the pad. The bookcase holds the same colour-coded sources; the search printout lists them.',
    tags: ['research', 'authority matrix', 'propositions', 'sources', 'citations', 'pinpoint', 'pending source', 'library', 'index card', 'hand', 'pins'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/matriz-de-autoridades.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
