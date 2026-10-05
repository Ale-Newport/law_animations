/**
 * LAW-0076 — Matriz de autoridades · inspect
 *
 * Storyboard (context thumbnail + a real enlarged copy of the inspected datum):
 *  0.00–0.20 build      The library shelf strip and the cork-board matrix
 *                       assemble the state produced by the concrete action:
 *                       every supplied pin runs from its card to its cell, the
 *                       columns light, rows without a source get a note peeled
 *                       off the pad on the board's ledge.
 *  0.20–0.45 isolate    The context shrinks to a thumbnail; a lens lifts a REAL
 *                       copy (same coordinates) of exactly what identifies the
 *                       datum: the proposition card with its text, the column
 *                       head(s) of the source(s) involved and the focus row's
 *                       cell(s) with pin, thread and pinpoint flag. Columns and
 *                       rows in between are collapsed (marked by break lines),
 *                       so the detail is enlarged instead of empty trailing
 *                       columns. The "before" value is named in the one
 *                       editorial annotation.
 *  0.45–0.75 substitute Inside the lens ONE datum is replaced by the preset's
 *                       alternative and only its dependent geometry updates:
 *                       focusTarget "source" → the pin lifts and travels along
 *                       its own thread to the new column (or back to the card
 *                       when the new value is a pending source); the old column
 *                       light retracts, the new one draws. focusTarget
 *                       "pinpoint" → the flag's text is struck and the new
 *                       pinpoint unfurls below the pin, inside the same cell.
 *                       The old place keeps a dashed ghost + struck old value.
 *  0.75–1.00 return     The lens folds back onto its source; the context shows
 *                       the new datum (a pending row gets its note from the pad),
 *                       a dashed ghost where the old one was and a "datum
 *                       changed" tag. Seeking back restores the old datum
 *                       exactly. Nothing about validity is inferred.
 * Camera: the context is built full size; while isolating it shrinks to a
 * thumbnail (top-left) and the lens grows out of the thumbnail's focus region
 * into a wide window below it (annotation beside the thumbnail); on return the
 * lens folds back and the context grows to full size again.
 * @module animations/research/LAW-0076
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields, int} from '../../schemas/fields.js';
import {chip, caption, textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {
  matrixFields, MATRIX_DEFAULTS, MATRIX_STRINGS, MAX_ROWS, MAT, resolveMatrix, bookcase, corkBoard, matrixGeometry, matrixStatic, matrixLinks,
  stickyNoteArt, pinHead, sourceColor, arcPt, placeBeside, boxesOverlap, fitWords, noteSizeFor, unionBox, searchField,
} from './kits/matriz-de-autoridades.js';

const ID = 'LAW-0076';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  build: [0.02, 0.18], buildNotes: [0.1, 0.17], caption: [0.0, 0.06], shrink: [0.21, 0.33], open: [0.23, 0.39], before: [0.34, 0.42],
  lift: [0.47, 0.51], move: [0.5, 0.63], colOut: [0.47, 0.52], colIn: [0.62, 0.67],
  strike: [0.48, 0.53], newFlag: [0.55, 0.62], ghost: [0.5, 0.56], after: [0.64, 0.71],
  close: [0.76, 0.84], ctxUpdate: [0.8, 0.86], ctxNote: [0.85, 0.93], grow: [0.83, 0.93], marker: [0.92, 0.97],
};
/** Gap between lens tiles where columns / rows are collapsed (design units). */
const BRK = {x: 34, y: 26};
const PAD_SY = 0.22;

const STRINGS = {
  en: {...MATRIX_STRINGS.en, before: 'Before', after: 'After'},
  es: {...MATRIX_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  ...matrixFields,
  ...inspectFields(['source', 'pinpoint']),
  focusRow: int('Row (0 = first proposition) whose first supplied citation is inspected', 0, MAX_ROWS - 1),
};
sceneSchema.focusTarget = {...sceneSchema.focusTarget, description: 'Datum that is enlarged and substituted: "source" = which source the focus row cites (afterValue starting with a supplied source id moves the pin to that column, e.g. "S3 · p. 2"; any other afterValue means the source becomes pending); "pinpoint" = the text on the pin flag (beforeValue → afterValue)'};
sceneSchema.beforeValue = {...sceneSchema.beforeValue, description: 'Value named as "before" (for pinpoint it is also the flag text before the substitution)'};
sceneSchema.afterValue = {...sceneSchema.afterValue, description: 'Alternative value: for "source", a supplied source id (optionally followed by a pinpoint, e.g. "S3 · p. 2") or a pending label; for "pinpoint", the new flag text'};

const defaultParams = {
  ...MATRIX_DEFAULTS,
  focusRow: 0,
  focusTarget: 'source',
  beforeValue: 'S1 · p. 1',
  afterValue: 'Pending source',
  detailGeometry: {zoom: 3, placement: 'auto'},
  contextLabels: {context: 'Authority matrix as supplied', marker: 'Datum changed'},
};

/**
 * Shape plans: text scale, thumbnail scale of the context while the lens is
 * open, shelf height, and the card-column widths the matrix may choose from
 * (narrow proposition cards keep the lens region compact, so it can be
 * enlarged more).
 */
const PLANS = {
  landscape: {ts: 1.15, thumb: 0.22, shelfH: 120, chip: 30, headFracs: [0.15, 0.165, 0.18, 0.2]},
  square: {ts: 1.02, thumb: 0.34, shelfH: 100, chip: 27, headFracs: [0.22, 0.24, 0.26, 0.28]},
  portrait: {ts: 1.06, thumb: 0.23, shelfH: 150, chip: 28, headFracs: [0.25, 0.27, 0.29, 0.31]},
};

/** Parse the after state for focusTarget "source". */
function parseAfterSource(p, M) {
  const tok = String(p.afterValue).trim().split(/[\s·:,;]+/)[0] || '';
  const j = M.sources.findIndex(s => s.id === tok);
  if (j < 0) return {kind: 'pending'};
  const rest = String(p.afterValue).trim().slice(tok.length).replace(/^[\s·:,;]+/, '');
  return {kind: 'cell', col: j, pinpoint: rest || null};
}

/** Index of the matrix column whose centre is at x. */
function colAt(G, x) {
  let j = 0, best = Infinity;
  G.cols.forEach((c, q) => { const d = Math.abs(c.cx - x); if (d < best) { best = d; j = q; } });
  return j;
}

/**
 * Pinpoint flags of the inspected link. A flag stays between the centre lines
 * of the neighbouring columns (where their lights run), wraps to two balanced
 * lines rather than running across them, and opens on the side with room. The
 * old flag sits above its pin; when the pin stays (pinpoint target) the new
 * flag unfurls BELOW the pin, so the two never stack and their poles never
 * cross the other flag.
 */
function focusFlags(ctx, G, F, texts) {
  const R = G.R, ts = G.ts;
  const pad = 14 * ts;
  const one = (text, cell, below) => {
    if (!cell || !text) return null;
    const j = colAt(G, cell.x);
    const cols = G.cols;
    const rightEdge = j + 1 < cols.length ? cols[j + 1].cx - 12 : G.sheet.x + G.sheet.w - 6;
    const leftEdge = j > 0 ? cols[j - 1].cx + 12 : G.sheet.x + 6;
    const fitFor = room => fitWords(ctx, text, {maxWidth: Math.max(40, room - pad), size: 23 * ts, minSize: 15, maxLines: 2, weight: 700});
    const fr = fitFor(rightEdge - (cell.x + R * 0.55));
    const fl = fitFor(cell.x - R * 0.55 - leftEdge);
    const rank = f => (f.truncated ? 100 : 0) + f.lines.length * 10 - f.size;
    const flip = rank(fl) < rank(fr) - 0.5;
    const f = flip ? fl : fr;
    const fw = f.width + pad, fh = f.height + 10 * ts;
    const fx = flip ? -R * 0.55 - fw : R * 0.55;
    const fy = below ? R * 0.55 + 6 * ts : -R * 0.55 - fh - 6 * ts;
    return {fit: f, fw, fh, fx, fy, flip, below, box: {x: cell.x + fx, y: cell.y + fy, w: fw, h: fh}};
  };
  return {B: one(texts.flagBefore, F.cellB, false), A: one(texts.flagAfter, F.cellA, F.samePlace)};
}

/**
 * The focus row's pin in one copy (context or lens): thread, column light,
 * pin, flags, pending note, ghost. Local = board coordinates.
 */
function focusParts(ctx, P, G, F, FL, noteText) {
  const th = ctx.theme;
  const R = G.R;
  const ts = G.ts;
  const colorB = F.before.kind === 'cell' ? sourceColor(ctx, F.before.col) : th.inkSoft;
  const colorA = F.after.kind === 'cell' ? sourceColor(ctx, F.after.col) : th.inkSoft;
  const strikes = [];
  const flagNode = (name, fl, color, strikeName) => {
    if (!fl) return g({name, opacity: 0});
    const {fx, fy, fw, fh, fit: f} = fl;
    const sx = fx < 0 ? -R * 0.3 : R * 0.3, sy = fl.below ? R * 0.3 : -R * 0.3;
    const ex = fx < 0 ? fx + fw - 4 : fx + 4, ey = fl.below ? fy : fy + fh;
    const tx = fx + fw / 2, ty = fy + (fh - f.height) / 2;
    const lines = !strikeName ? [] : ctx.show('all')
      ? f.lines.map((ln, i) => {
        const w = ctx.measure(ln, f.size, f.weight, f.family);
        return {x1: tx - w / 2 - 4, x2: tx + w / 2 + 4, y: ty + i * f.lineHeight + f.size * 0.5};
      })
      : [{x1: fx + 4, x2: fx + fw - 4, y: fy + fh / 2}];
    lines.forEach((_, i) => strikes.push(`${strikeName}${i}`));
    return g({name, opacity: 0},
      h('path', {d: `M${r(sx)} ${r(sy)}L${r(ex)} ${r(ey)}`, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: roundRectPath(fx, fy, fw, fh, 4), fill: '#ffffff', stroke: color, 'stroke-width': 2.2}),
      ctx.show('all')
        ? textBlock(f, {x: tx, y: ty, anchor: 'middle', fill: shade(color, -0.4)})
        : h('rect', {x: r(fx + 6), y: r(fy + fh * 0.4), width: r(fw - 12), height: r(fh * 0.2), rx: 2, fill: shade(color, 0.3)}),
      lines.map((ln, i) => h('line', {name: `${strikeName}${i}`, x1: r(ln.x1), y1: r(ln.y), x2: r(ln.x2), y2: r(ln.y), stroke: th.accent, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0})));
  };
  const ns = noteSizeFor(G);
  const parts = {
    thread: h('line', {name: `${P}-fth`, stroke: shade(colorB, -0.12), 'stroke-width': r(4 * ts), 'stroke-linecap': 'round', opacity: 0}),
    threadA: h('line', {name: `${P}-ftha`, stroke: shade(colorA, -0.12), 'stroke-width': r(4 * ts), 'stroke-linecap': 'round', opacity: 0}),
    colB: h('line', {name: `${P}-fclB`, stroke: colorB, 'stroke-width': r(4 * ts), 'stroke-linecap': 'round', opacity: 0}),
    colA: h('line', {name: `${P}-fclA`, stroke: colorA, 'stroke-width': r(4 * ts), 'stroke-linecap': 'round', opacity: 0}),
    ghost: F.cellB ? g({name: `${P}-ghost`, opacity: 0, transform: T(F.cellB.x, F.cellB.y)},
      h('circle', {r: r(R * 1.45), fill: 'rgba(255,255,255,0.55)', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '7 6'}),
      h('circle', {r: r(R * 0.3), fill: th.accent})) : null,
    pin: g({name: `${P}-fpin`},
      h('ellipse', {name: `${P}-fpin-sh`, rx: r(R * 1.02), ry: r(R * 0.82), fill: 'rgba(31,35,40,0.26)', transform: T(4 * ts, 6 * ts)}),
      g({name: `${P}-fpin-b`}, pinHead(ctx, colorB, R)),
      g({name: `${P}-fpin-a`, opacity: 0}, pinHead(ctx, colorA, R))),
    flagB: g({name: `${P}-flBg`}, flagNode(`${P}-flB`, FL.B, colorB, `${P}-strike`)),
    flagA: g({name: `${P}-flAg`}, flagNode(`${P}-flA`, FL.A, colorA, null)),
    note: F.pendCell ? g({name: `${P}-fnote`, opacity: 0}, stickyNoteArt(ctx, {w: ns.w, h: ns.h, text: noteText, ts})) : null,
  };
  return {parts, ns, strikes, colorB, colorA};
}

/** Where the focus pin is for a substitution progress. */
function focusPos(F, move) {
  if (F.samePlace) return F.cellB;
  const a = F.cellB || F.park, b = F.cellA || F.park;
  return move > 0 ? arcPt(a, b, move, Math.min(60, Math.abs(b.x - a.x) * 0.12)) : a;
}

/**
 * A note travelling between the pad on the ledge (at = 0) and its cell (at = 1):
 * peeled, flipped up, carried in front of the board (slightly enlarged while
 * carried), stuck.
 */
function notePose(pad, cell, at) {
  const e = ease.inOutSine(clamp(at));
  const pos = arcPt(pad, cell, e, 40);
  const sy = lerp(PAD_SY, 1, ease.outCubic(clamp(at * 3.5)));
  const lift = 1 + 0.08 * Math.sin(Math.PI * e);
  return {tf: `${T(pos.x, pos.y)} scale(${r(lift, 4)} ${r(sy * lift, 4)})`, opacity: at > 0 ? 1 : 0, pos};
}

/** Pose the focus parts for substitution progress values. */
function poseFocus(P, G, F, fp, st, hidePin = false) {
  const nodes = {};
  const R = G.R;
  // st: {move 0..1, lift 0..1, colOut, colIn, strike, newFlag, noteAt, ghost, oldFlag}
  const pos = focusPos(F, st.move);
  // a re-linked pin keeps its colour in flight and takes the new column's colour as it lands
  // (re-tagged there); a pin going back to its card keeps its colour
  const colorSwap = F.samePlace || !F.cellA ? 0 : clamp((st.move - 0.8) / 0.2);
  const threadVisible = !hidePin && Math.hypot(pos.x - F.anchor.x, pos.y - F.anchor.y) > 0.5;
  nodes[`${P}-fth`] = {x1: r(F.anchor.x), y1: r(F.anchor.y), x2: r(pos.x), y2: r(pos.y), opacity: threadVisible ? r(1 - colorSwap, 3) : 0};
  nodes[`${P}-ftha`] = {x1: r(F.anchor.x), y1: r(F.anchor.y), x2: r(pos.x), y2: r(pos.y), opacity: threadVisible ? r(colorSwap, 3) : 0};
  const lineTo = (cell, prog) => (cell ? {x1: r(cell.x), y1: r(G.sheet.y), x2: r(cell.x), y2: r(lerp(G.sheet.y, cell.y - R * 1.05, clamp(prog))), opacity: prog > 0 ? 0.92 : 0} : {opacity: 0});
  nodes[`${P}-fclB`] = lineTo(F.cellB, F.cellB ? 1 - st.colOut : 0);
  nodes[`${P}-fclA`] = lineTo(F.samePlace ? null : F.cellA, st.colIn);
  nodes[`${P}-fpin`] = {transform: T(pos.x, pos.y), opacity: hidePin ? 0 : 1};
  nodes[`${P}-fpin-b`] = {transform: st.lift ? `scale(${r(1 + 0.3 * st.lift, 4)})` : '', opacity: r(1 - colorSwap, 3)};
  nodes[`${P}-fpin-a`] = {transform: st.lift ? `scale(${r(1 + 0.3 * st.lift, 4)})` : '', opacity: r(colorSwap, 3)};
  nodes[`${P}-fpin-sh`] = {transform: T(4 + 14 * st.lift, 6 + 18 * st.lift, 0, 1 + 0.25 * st.lift)};
  // flags ride on the pin (old flag only while at the old place, new flag once landed)
  const atB = F.cellB || F.park;
  nodes[`${P}-flBg`] = {transform: T(atB.x, atB.y)};
  nodes[`${P}-flB`] = {opacity: F.cellB ? r(st.oldFlag, 3) : 0};
  fp.strikes.forEach(n => { nodes[n] = {opacity: st.strike > 0 ? 1 : 0, 'stroke-dasharray': '600 600', 'stroke-dashoffset': r(600 - 600 * st.strike)}; });
  const atA = F.cellA || F.park;
  nodes[`${P}-flAg`] = {transform: T(atA.x, atA.y)};
  nodes[`${P}-flA`] = {opacity: F.cellA ? r(st.newFlag, 3) : 0};
  if (F.pendCell) {
    const np = notePose(F.padAt, F.pendCell, st.noteAt);
    nodes[`${P}-fnote`] = {opacity: np.opacity, transform: np.tf};
  }
  if (F.cellB) nodes[`${P}-ghost`] = {opacity: r(st.ghost, 3)};
  return {nodes, pos, colorSwap};
}

/**
 * Merge touching / overlapping [a, b] spans (sorted by start). `c0`/`c1` keep
 * the extent of the matrix columns themselves (a flag may widen a span over
 * the neighbouring cell; the column HEAD tile never shows the neighbour's head).
 */
function mergeSpans(spans, key0, key1) {
  const s = [...spans].sort((a, b) => a[key0] - b[key0]);
  const out = [];
  for (const q of s) {
    const last = out[out.length - 1];
    if (last && q[key0] <= last[key1] + 1) {
      last[key1] = Math.max(last[key1], q[key1]);
      if (q.c0 !== undefined) { last.c0 = Math.min(last.c0, q.c0); last.c1 = Math.max(last.c1, q.c1); }
      last.kind = 'row';
    } else out.push({...q});
  }
  return out;
}

/** Zig-zag break mark (collapsed rows / columns) centred on a line. */
function breakMark(x0, y0, x1, y1, amp = 7, step = 14) {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1;
  const ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
  const n = Math.max(2, Math.round(L / step));
  let d = '';
  for (let off of [-amp * 0.9, amp * 0.9]) {
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * L;
      const a = (i % 2 ? 1 : -1) * amp * 0.55 + off;
      d += `${i ? 'L' : 'M'}${r(x0 + ux * t + nx * a)} ${r(y0 + uy * t + ny * a)}`;
    }
  }
  return d;
}

const scene = {
  sizes: {landscape: [1700, 860], square: [1100, 860], portrait: [920, 1380]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const shape = ctx.view.shape;
    const PL = PLANS[shape];
    const ts = PL.ts;

    // --- data: the focus link and the before / after states
    const M0 = resolveMatrix(p);
    const fr = Math.min(p.focusRow, M0.nR - 1);
    const focusLink0 = M0.links.find(l => l.row === fr) || null;
    const before = focusLink0 ? {kind: 'cell', col: focusLink0.col, pinpoint: focusLink0.pinpoint} : {kind: 'pending'};
    let after;
    if (p.focusTarget === 'pinpoint') after = before.kind === 'cell' ? {kind: 'cell', col: before.col, pinpoint: p.afterValue} : {kind: 'pending'};
    else after = parseAfterSource(p, M0);
    const needsPending = before.kind === 'pending' || after.kind === 'pending';
    const M = resolveMatrix(p, {pendingColumn: needsPending ? 'always' : 'auto'});

    // --- the full-size context (context coordinates = design coordinates at scale 1)
    const capH = ctx.show('all') ? 52 : 12;
    const shelf = bookcase(ctx, {prefix: 'lib', x: 34, y: capH, w: D.w - 68, h: PL.shelfH, shelves: 1, sources: M.sources, ts, seedKey: 'ishelf', plinth: false});
    const boardBox = {x: 10, y: capH + PL.shelfH + 22, w: D.w - 20, h: D.h - (capH + PL.shelfH + 22) - 30};
    const board = corkBoard(ctx, {prefix: 'board', ...boardBox, seedKey: 'iboard'});
    const inset = 14 * ts;
    const mbox = {x: board.inner.x + inset, y: board.inner.y + inset, w: board.inner.w - inset * 2, h: board.inner.h - inset * 2};
    // narrow proposition cards first; the default widths only when a narrow card would truncate
    // its proposition or shrink its text noticeably
    let G = matrixGeometry(ctx, M, mbox, {ts, headFracs: PL.headFracs});
    const cramped = q => q.rows.some(rw => rw.fit.truncated || rw.fit.size < q.cardSize * 0.86) || q.cols.some(c => c.titleFit && c.titleFit.truncated);
    if (cramped(G)) {
      const G2 = matrixGeometry(ctx, M, mbox, {ts});
      if (!cramped(G2) || G2.rows.filter(rw => rw.fit.truncated).length < G.rows.filter(rw => rw.fit.truncated).length) G = G2;
    }
    const row = G.rows[fr];
    const focusLink = G.links.find(l => l.row === fr) || null;
    const laneY = focusLink ? focusLink.cell.y : row.cy;
    const anchor = {x: row.card.x + row.card.w, y: laneY};
    const pendCol = G.cols.find(c => c.pending) || null;
    const ns = noteSizeFor(G);
    const padAt = pendCol ? {x: pendCol.cx, y: board.ledge.y + 7} : null;
    const F = {
      before, after, anchor, park: anchor, padAt,
      cellB: before.kind === 'cell' ? {x: G.cols[before.col].cx, y: laneY} : null,
      cellA: after.kind === 'cell' ? {x: G.cols[after.col].cx, y: laneY} : null,
      pendCell: needsPending && pendCol ? {x: pendCol.cx, y: row.cy} : null,
      samePlace: before.kind === 'cell' && after.kind === 'cell' && before.col === after.col,
    };
    const flagBefore = p.focusTarget === 'pinpoint' ? p.beforeValue : (before.pinpoint || '');
    const flagAfter = p.focusTarget === 'pinpoint' ? p.afterValue : (after.kind === 'cell' ? (after.pinpoint ?? before.pinpoint ?? '') : '');
    const texts = {flagBefore, flagAfter, note: t.sourcePending};
    const FL = focusFlags(ctx, G, F, texts);

    // the pad of sticky notes on the ledge, under the pending column (notes are peeled off it)
    const pad = padAt ? g({name: 'pad'},
      h('path', {d: `M${r(padAt.x - ns.w / 2 + 6)} ${r(padAt.y + ns.h * PAD_SY / 2 + 8)}h${r(ns.w)}v6h${r(-ns.w)}Z`, fill: th.shadow}),
      [2, 1, 0].map(k => h('rect', {x: r(padAt.x - ns.w / 2), y: r(padAt.y - ns.h * PAD_SY / 2 + k * 3), width: r(ns.w), height: r(ns.h * PAD_SY), rx: 2, fill: shade(MAT.note, -0.05 * k), stroke: shade(MAT.note, -0.45), 'stroke-width': 1.4}))) : null;

    // two copies: the context (c) and the lens content (z), same coordinates
    const mkCopy = P => {
      const stat = matrixStatic(ctx, {prefix: `${P}mx`, G, M, query: p.query});
      const links = matrixLinks(ctx, {prefix: `${P}lk`, G, M, notes: true, noteText: t.sourcePending, heldLayer: false});
      const fp = focusParts(ctx, `${P}f`, G, F, FL, t.sourcePending);
      const node = g(null,
        stat.sheet, stat.heads, stat.corner, stat.cards,
        links.colLinks, fp.parts.colB, fp.parts.colA, links.threads, fp.parts.thread, fp.parts.threadA,
        links.sockets, links.notes, fp.parts.note, fp.parts.ghost, links.pins, fp.parts.pin, links.flags, fp.parts.flagB, fp.parts.flagA, links.held);
      return {stat, links, fp, node};
    };
    const C = mkCopy('c');
    const Z = mkCopy('z');
    const zBoard = corkBoard(ctx, {prefix: 'zboard', ...boardBox, seedKey: 'iboard'});

    // --- lens tiles: the card column, the column(s) involved (heads + focus row); the columns
    //     and rows in between are collapsed, so the inspected detail is what gets enlarged
    const involved = [...new Set([F.cellB, F.cellA].filter(Boolean).map(q => colAt(G, q.x)))];
    const flagCols = [[FL.B, F.cellB], [FL.A, F.cellA]].filter(([f, c]) => f && c).map(([f, c]) => ({box: f.box, j: colAt(G, c.x)}));
    const flagBoxes = flagCols.map(q => q.box);
    let colSpans = [{x0: G.box.x - 10, x1: G.sheet.x, c0: G.box.x - 10, c1: G.sheet.x}];
    for (const j of involved) {
      const c = G.cols[j];
      const sp = {x0: c.x0, x1: c.x1, c0: c.x0, c1: c.x1};
      // a flag that opens over the neighbouring cell widens its column's tile
      for (const q of flagCols.filter(fc => fc.j === j)) {
        sp.x0 = Math.min(sp.x0, q.box.x - 8);
        sp.x1 = Math.max(sp.x1, q.box.x + q.box.w + 8);
      }
      colSpans.push(sp);
    }
    colSpans = mergeSpans(colSpans, 'x0', 'x1');
    // heads: pin, id band and title of the sheets (dates and ruled lines are cropped)
    const titleH = Math.max(...involved.map(j => (ctx.show('key') && G.cols[j].titleFit ? G.cols[j].titleFit.height : 54 * ts)), 54 * ts * (ctx.show('key') ? 0 : 1));
    const headSpan = {y0: G.box.y - 16 * ts, y1: Math.min(G.box.y + G.headH, G.box.y + G.bandH + 10 * ts + titleH + 5 * ts), kind: 'head'};
    // the crop never runs through a line of text (a sheet's date, a search result row): such a line is
    // shown whole or not at all
    const textBands = [];
    for (const j of involved) {
      const c = G.cols[j];
      if (c.dateFit && ctx.show('all')) {
        const dy = G.box.y + G.bandH + 10 * ts + (ctx.show('key') && c.titleFit ? c.titleFit.height : 54 * ts) + 8 * ts;
        textBands.push({y0: dy - 2, y1: dy + c.dateFit.height});
      }
    }
    // the lowest line the crop may take: just under the titles of the involved sheets
    const titleFloor = G.box.y + G.bandH + 10 * ts + titleH + 2;
    const cuts = y => textBands.some(b => y > b.y0 - 2 && y < b.y1 + 3);
    if (cuts(headSpan.y1)) {
      // nearest clean line, above (never into the titles) or below the text it would cut
      const cands = [titleFloor, ...textBands.flatMap(b => [b.y0 - 3, b.y1 + 4])].filter(y => y >= titleFloor && y <= G.box.y + G.headH && !cuts(y));
      if (cands.length) headSpan.y1 = cands.reduce((a, y) => (Math.abs(y - headSpan.y1) < Math.abs(a - headSpan.y1) ? y : a));
    }
    // over the card column the head tile shows the search printout down to a clean line (no half result row)
    const slipField = searchField(ctx, {box: G.corner, query: p.query, ts, nSources: M.sources.length});
    let slipY1 = headSpan.y1;
    for (const b of slipField.rowBands) if (slipY1 > b.y0 - 2 && slipY1 < b.y1 + 3) slipY1 = Math.max(slipField.bottom + 4, b.y0 - 3);
    const flagTop = Math.min(row.y0, ...flagBoxes.map(b => b.y - 6));
    const flagBot = Math.max(row.y1, ...flagBoxes.map(b => b.y + b.h + 6));
    const rowSpan = {y0: flagTop - 4, y1: flagBot + 4, kind: 'row'};
    const rowSpans = mergeSpans([headSpan, rowSpan], 'y0', 'y1');
    // tiles (context coordinates), each inside one column span × one row span; in the head row only the
    // involved columns' own heads and, over the card column, the search printout
    const tiles = [];
    rowSpans.forEach((rs, j) => colSpans.forEach((cs, i) => {
      if (rs.kind !== 'head') { tiles.push({i, j, x0: cs.x0, x1: cs.x1, y0: rs.y0, y1: rs.y1}); return; }
      const cx0 = Math.max(cs.x0, cs.c0), cx1 = Math.min(cs.x1, cs.c1), split = G.sheet.x;
      if (cx0 < split) tiles.push({i, j, x0: cx0, x1: Math.min(cx1, split), y0: rs.y0, y1: Math.min(rs.y1, slipY1)});
      if (cx1 > split) tiles.push({i, j, x0: Math.max(cx0, split), x1: cx1, y0: rs.y0, y1: rs.y1});
    }));
    const sumW = colSpans.reduce((a, q) => a + q.x1 - q.x0, 0);
    const sumH = rowSpans.reduce((a, q) => a + q.y1 - q.y0, 0);

    // --- thumbnail (context while the lens is open), lens band, annotation area
    const kT = PL.thumb;
    const thumb = {x: 14, y: 14, w: D.w * kT, h: D.h * kT};
    const band = {x: 12, y: thumb.y + thumb.h + 34, w: D.w - 24, h: D.h - (thumb.y + thumb.h + 34) - 12};
    const annBox = {x: thumb.x + thumb.w + 36, y: 22, w: D.w - (thumb.x + thumb.w + 36) - 16, h: thumb.h - 12};
    const nx = colSpans.length, ny = rowSpans.length;
    const zoom = Math.max(1.1, Math.min(p.detailGeometry.zoom, (band.w - BRK.x * (nx - 1)) / sumW, (band.h - BRK.y * (ny - 1)) / sumH));
    const destW = sumW * zoom + BRK.x * (nx - 1), destH = sumH * zoom + BRK.y * (ny - 1);
    const dx0 = band.x + (band.w - destW) / 2, dy0 = band.y + (band.h - destH) / 2;
    let acc = dx0;
    const colDest = colSpans.map(q => { const x = acc; acc += (q.x1 - q.x0) * zoom + BRK.x; return x; });
    acc = dy0;
    const rowDest = rowSpans.map(q => { const y = acc; acc += (q.y1 - q.y0) * zoom + BRK.y; return y; });
    const destUnion = {x: dx0, y: dy0, w: destW, h: destH};
    const breaks = [];
    for (let i = 1; i < nx; i++) { const x = colDest[i] - BRK.x / 2; breaks.push(breakMark(x, dy0 + 6, x, dy0 + destH - 6)); }
    for (let j = 1; j < ny; j++) { const y = rowDest[j] - BRK.y / 2; breaks.push(breakMark(dx0 + 6, y, dx0 + destW - 6, y)); }

    // --- the one editorial annotation: before → after (stacked, in the annotation area)
    let ann = null;
    if (ctx.show('key')) {
      const size = PL.chip;
      const mw = Math.min(annBox.w, 620);
      const b = chip(ctx, `${t.before}: ${p.beforeValue}`, {x: annBox.x, y: annBox.y, maxWidth: mw, size, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: 'ann-before'});
      const gapA = Math.max(34, Math.min(50, annBox.h - b.box.h * 2 - 8));
      const ay = b.box.y + b.box.h + gapA;
      const a = chip(ctx, `${t.after}: ${p.afterValue}`, {x: annBox.x, y: ay, maxWidth: mw, size, maxLines: 2, fill: th.card, stroke: th.accent2, color: th.accent2, name: 'ann-after'});
      const arrow = `M${r(annBox.x + 40)} ${r(b.box.y + b.box.h + 6)}V${r(ay - 6)}m-9 -10l9 10l9 -10`;
      // one strike per line of the old value
      const strikes = b.fit.lines.map((ln, i) => {
        const w = ctx.measure(ln, b.fit.size, b.fit.weight, b.fit.family);
        const cy = b.box.y + (b.box.h - b.fit.height) / 2 + i * b.fit.lineHeight + b.fit.size * 0.5;
        return {x1: b.box.cx - w / 2 - 4, x2: b.box.cx + w / 2 + 4, y: cy};
      });
      ann = {b, a, arrow, strikes};
    }

    // --- context caption and changed-datum tag (on the ghost, inside the sheet)
    const ctxCap = ctx.show('all') ? caption(ctx, p.contextLabels.context, {x: 24, y: 8, maxWidth: D.w - 48, size: 32, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;
    let marker = null;
    if (ctx.show('key') && (F.cellB || F.cellA)) {
      const at = F.cellB || F.cellA;
      const probe = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: Math.max(160, G.colW * 1.6), size: 23 * ts, maxLines: 2});
      const ringBox = {x: at.x - G.R * 1.6, y: at.y - G.R * 1.6, w: G.R * 3.2, h: G.R * 3.2};
      const obst = [
        ...[FL.A ? FL.A.box : null, F.samePlace && FL.B ? FL.B.box : null].filter(Boolean),
        // the thread of the focus row (from the card to the pin) and the column lights (sheet top → pin)
        {x: F.anchor.x, y: F.anchor.y - 5, w: Math.max(0, at.x - F.anchor.x), h: 10},
        ...G.links.filter(l => l !== focusLink).map(l => ({x: l.cell.x - 5, y: G.sheet.y, w: 10, h: l.cell.y - G.sheet.y})),
        ...G.links.filter(l => l !== focusLink).map(l => ({x: l.anchor.x, y: l.cell.y - 5, w: l.cell.x - l.anchor.x, h: 10})),
        ...[F.cellA, F.samePlace ? F.cellB : null].filter(Boolean).map(c => ({x: c.x - 5, y: G.sheet.y, w: 10, h: c.y - G.sheet.y})),
        ...G.links.filter(l => l !== focusLink).map(l => ({x: l.cell.x - G.R * 1.3, y: l.cell.y - G.R * 1.3, w: G.R * 2.6, h: G.R * 2.6})),
        // the other links' pinpoint flags (their real boxes, on the landed pins)
        ...G.links.map((l, k) => (l !== focusLink && C.links.flagInfo[k] ? C.links.flagInfo[k].local : null) && {x: l.cell.x + C.links.flagInfo[k].local.x - 4, y: l.cell.y + C.links.flagInfo[k].local.y - 4, w: C.links.flagInfo[k].local.w + 8, h: C.links.flagInfo[k].local.h + 8}),
        F.cellA ? {x: F.cellA.x - G.R * 1.3, y: F.cellA.y - G.R * 1.3, w: G.R * 2.6, h: G.R * 2.6} : null,
        F.pendCell ? {x: F.pendCell.x - ns.w / 2, y: F.pendCell.y - ns.h / 2, w: ns.w, h: ns.h} : null,
        ...G.pending.map(q => ({x: q.cell.x - ns.w / 2, y: q.cell.y - ns.h / 2, w: ns.w, h: ns.h})),
        ringBox,
      ].filter(Boolean);
      const bnd = {x: G.sheet.x + 4, y: G.sheet.y + 4, w: G.sheet.w - 8, h: G.sheet.h - 8};
      // next to the ghost / pin; else next to the pin together with its flags (never over a flag)
      const withFlags = unionBox([ringBox, ...[FL.A, FL.B].filter(Boolean).map(f => f.box)]);
      const sz = {w: probe.box.w, h: probe.box.h};
      let pos = placeBeside(ringBox, sz, {obstacles: obst, bounds: bnd, order: ['below', 'belowRight', 'belowLeft', 'above', 'right', 'left'], gap: 6, pad: 4, shifts: [0, 30, -30, 60, -60]})
        || placeBeside(withFlags, sz, {obstacles: obst, bounds: bnd, order: ['below', 'belowLeft', 'belowRight', 'above', 'aboveLeft', 'aboveRight', 'left', 'right'], gap: 6, pad: 3, shifts: [0, 30, -30, 60, -60, 100, -100]});
      // crowded cell: the nearest free spot on the sheet (a slightly smaller tag if needed), tied to
      // the changed cell by a short leader
      let leader = null;
      let mSize = 23 * ts, mLines = 2, mWidth = Math.max(160, G.colW * 1.6);
      if (!pos) {
        const rc = {x: at.x, y: at.y};
        // (the full-size tag unless a slightly smaller one fits much closer to the cell)
        const found = [[1, 2], [0.84, 3]].map(([k, ml]) => {
          const pr = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: mWidth * (k < 1 ? 0.8 : 1), size: 23 * ts * k, maxLines: ml});
          const zs = {w: pr.box.w, h: pr.box.h};
          const cands = [];
          for (let y = bnd.y; y + zs.h <= bnd.y + bnd.h; y += 8) for (let x = bnd.x; x + zs.w <= bnd.x + bnd.w; x += 8) cands.push({x, y, d: Math.hypot(clamp(rc.x, x, x + zs.w) - rc.x, clamp(rc.y, y, y + zs.h) - rc.y)});
          cands.sort((q1, q2) => q1.d - q2.d);
          const free = cands.find(q => !obst.some(o => boxesOverlap({x: q.x, y: q.y, w: zs.w, h: zs.h}, o, 3)));
          return free ? {free, zs, k, ml} : null;
        }).filter(Boolean);
        const pick = found.length > 1 && found[1].free.d + 40 < found[0].free.d ? found[1] : found[0];
        if (pick) {
          const {free, zs, k, ml} = pick;
          pos = free;
          mSize = 23 * ts * k; mLines = ml; mWidth *= k < 1 ? 0.8 : 1;
          const ex = clamp(rc.x, free.x, free.x + zs.w), ey = clamp(rc.y, free.y, free.y + zs.h);
          const L0 = Math.hypot(ex - rc.x, ey - rc.y) || 1;
          if (L0 > G.R * 1.8) leader = {x1: ex, y1: ey, x2: rc.x + ((ex - rc.x) / L0) * G.R * 1.6, y2: rc.y + ((ey - rc.y) / L0) * G.R * 1.6};
        }
      }
      pos = pos || placeBeside(ringBox, sz, {obstacles: obst, bounds: bnd, order: ['below', 'above', 'right', 'left'], gap: 4, pad: 0})
        || {x: ringBox.x, y: ringBox.y + ringBox.h + 4};
      const c = chip(ctx, p.contextLabels.marker, {x: pos.x, y: pos.y, maxWidth: mWidth, size: mSize, maxLines: mLines, fill: th.accentSoft, stroke: th.accent, name: 'marker-chip'});
      marker = g({name: 'marker', opacity: 0},
        leader ? h('line', {x1: r(leader.x1), y1: r(leader.y1), x2: r(leader.x2), y2: r(leader.y2), stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '4 5', 'stroke-linecap': 'round'}) : null,
        c.node);
    }

    // what the lens shows (for semantics): the whole focus card and each involved column head
    const inX = x => colSpans.some(q => x >= q.x0 - 0.5 && x <= q.x1 + 0.5);
    const inY = y => rowSpans.some(q => y >= q.y0 - 0.5 && y <= q.y1 + 0.5);
    const cardInLens = inX(row.card.x) && inX(row.card.x + row.card.w) && inY(row.card.y) && inY(row.card.y + row.card.h);
    const headsInLens = involved.every(j => inX(G.cols[j].head.x) && inX(G.cols[j].head.x + G.cols[j].head.w) && inY(G.box.y) && inY(G.box.y + G.bandH));

    return {tiles, G, M, row, fr, F, FL, C, Z, zBoard, shelf, board, pad, ns, colSpans, rowSpans, colDest, rowDest, destUnion, breaks, zoom, thumb, kT,
      ann, ctxCap, marker, focusLink, before, after, texts, D, inX, inY, cardInLens, headsInLens, involved};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const zId = ctx.id('zcopy');
    const tiles = [];
    L.tiles.forEach((_, k) => {
      const n = `lt${k}`;
      tiles.push(g({name: n},
        h('defs', null, h('clipPath', {id: ctx.id(`${n}-clip`)}, h('rect', {name: `${n}-cr`, rx: 10}))),
        h('rect', {name: `${n}-bg`, rx: 10, fill: th.paper}),
        g({'clip-path': ctx.ref(`${n}-clip`)}, g({name: `${n}-c`}, h('use', {href: `#${zId}`}))),
        h('rect', {name: `${n}-fr`, rx: 10, fill: 'none', stroke: th.accent, 'stroke-width': 2, opacity: 0.55})));
    });
    const srcRects = L.colSpans.map((q, i) => h('rect', {name: `ctx-src${i}`, x: r(q.x0), y: r(L.rowSpans[0].y0), width: r(q.x1 - q.x0), height: r(L.rowSpans[L.rowSpans.length - 1].y1 - L.rowSpans[0].y0), rx: 10, fill: 'none', stroke: th.accent, 'stroke-width': 7, opacity: 0}));
    const R = L.G.R;
    return g(null,
      // the lens content lives once, hidden; every lens tile shows it through <use> (same coordinates)
      g({opacity: 0}, g({id: zId}, L.zBoard.node, L.Z.node)),
      // cone lines run BENEATH the thumbnail (they never cross its content)
      h('line', {name: 'cone-a', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'cone-b', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      // the context (full size, shrinks to a thumbnail while the lens is open)
      g({name: 'ctx'},
        h('rect', {name: 'ctx-bg', x: 0, y: 0, width: r(L.D.w), height: r(L.D.h), rx: 40, fill: th.dark ? '#262a30' : '#f6f2e9', opacity: 0}),
        L.ctxCap && L.ctxCap.node,
        L.shelf.node,
        L.board.node,
        L.pad,
        L.C.node,
        L.marker,
        srcRects,
      ),
      h('rect', {name: 'thumb-frame', rx: 14, fill: 'none', stroke: th.dark ? '#5b626b' : '#cfc8ba', 'stroke-width': 3, opacity: 0}),
      // the lens: tiles of a real copy of the context, clipped to the kept columns / rows
      g({name: 'lens-win', opacity: 0},
        h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow, opacity: 0}),
        h('rect', {name: 'lens-bg', rx: 22, fill: th.dark ? '#30343a' : '#efe9dc', opacity: 0}),
        tiles,
        h('path', {name: 'lens-breaks', d: L.breaks.join(''), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-linejoin': 'round', opacity: 0}),
        // the inspected pin and its thread ride ACROSS the tiles (through a collapsed gap, too)
        h('defs', null, h('clipPath', {id: ctx.id('lz-clip')}, h('rect', {name: 'lz-cr', rx: 22}))),
        g({'clip-path': ctx.ref('lz-clip')},
          h('line', {name: 'lz-th', stroke: shade(L.C.fp.colorB, -0.12), 'stroke-linecap': 'round', opacity: 0}),
          h('line', {name: 'lz-tha', stroke: shade(L.C.fp.colorA, -0.12), 'stroke-linecap': 'round', opacity: 0}),
          g({name: 'lz-pin', opacity: 0},
            h('ellipse', {name: 'lz-pin-sh', rx: r(R * 1.02), ry: r(R * 0.82), fill: 'rgba(31,35,40,0.26)', transform: T(4, 6)}),
            g({name: 'lz-pin-b'}, pinHead(ctx, L.C.fp.colorB, R)),
            g({name: 'lz-pin-a', opacity: 0}, pinHead(ctx, L.C.fp.colorA, R)))),
        h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0}),
      ),
      L.ann && g({name: 'ann', opacity: 0},
        L.ann.b.node,
        L.ann.strikes.map((st, i) => h('line', {name: `ann-strike${i}`, x1: r(st.x1), x2: r(st.x2), y1: r(st.y), y2: r(st.y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0})),
        h('path', {name: 'ann-arrow', d: L.ann.arrow, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        L.ann.a.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const {G, F} = L;
    const s = w => seg(u, ...W[w]);
    const R = G.R;

    // 1) build: every supplied pin (other than the inspected one) runs to its cell; notes are peeled
    //    off the pad on the ledge and carried up to their rows
    const nL = G.links.length;
    const buildState = (P, done) => {
      const st = G.links.map((l, k) => {
        if (l === L.focusLink) return {pos: l.park, visible: 0};
        const a = W.build[0] + (k / Math.max(1, nL)) * (W.build[1] - W.build[0] - 0.05);
        const mv = done ? 1 : ease.inOutSine(seg(u, a, a + 0.05));
        return {pos: mv > 0 ? arcPt(l.park, l.cell, mv, 20) : l.park, lift: Math.sin(Math.PI * mv) * 0.7, col: done ? 1 : seg(u, a + 0.045, a + 0.065), flag: done ? 1 : seg(u, a + 0.05, a + 0.07)};
      });
      const noteAts = G.pending.map((q, i) => (q.row === L.fr && F.pendCell ? 0 : done ? 1 : seg(u, W.buildNotes[0] + 0.015 * i, W.buildNotes[1] + 0.015 * i)));
      const out = L[P === 'c' ? 'C' : 'Z'].links.pose({links: st, notes: G.pending.map((q, i) => ({pos: q.cell, visible: noteAts[i] > 0 ? 1 : 0}))});
      G.pending.forEach((q, i) => {
        const np = F.padAt ? notePose(F.padAt, q.cell, noteAts[i]) : {tf: T(q.cell.x, q.cell.y), opacity: noteAts[i] > 0 ? 1 : 0};
        out[`${P}lk-nt${i}`] = {transform: np.tf, opacity: q.row === L.fr && F.pendCell ? 0 : np.opacity};
      });
      return out;
    };
    Object.assign(nodes, buildState('c', false));
    Object.assign(nodes, buildState('z', u >= W.build[1]));

    // 2) the inspected datum: arrives with the build, is substituted in the lens, then in the context
    const arrive = ease.inOutSine(seg(u, W.build[0], W.build[0] + 0.07));
    // a pending "before" row gets its note with the build; a pending "after" row gets it on return
    const noteBuilt = seg(u, W.buildNotes[0], W.buildNotes[1]);
    const noteBefore = F.before.kind === 'pending' ? noteBuilt : 0;
    const sub = {
      move: ease.inOutSine(s('move')),
      lift: F.samePlace ? 0 : (u >= W.lift[0] && u <= W.colIn[0] ? Math.sin(Math.PI * clamp((u - W.lift[0]) / (W.colIn[0] - W.lift[0]))) : 0),
      colOut: F.samePlace ? 0 : s('colOut'), colIn: s('colIn'), strike: s('strike'),
      newFlag: F.samePlace ? s('newFlag') : s('colIn'), ghost: F.samePlace ? 0 : s('ghost'),
      oldFlag: F.samePlace ? 1 : 1 - s('lift'),
      // the lens never shows the pending column: its note keeps the context's state until the return
      noteAt: F.before.kind === 'pending' ? 1 : 0,
    };
    const upd = ease.inOutSine(s('ctxUpdate'));
    const noteCtx = F.after.kind === 'pending' ? s('ctxNote') : noteBefore * (1 - s('ctxNote'));
    const ctxSt = {
      move: upd, lift: 0, colOut: F.samePlace ? 0 : upd, colIn: upd >= 1 ? 1 : seg(u, W.ctxUpdate[1] - 0.02, W.ctxUpdate[1]),
      // a replaced pinpoint stays readable above the pin, struck (the new one is below it)
      strike: F.samePlace ? upd : 0, newFlag: upd >= 1 ? 1 : 0, noteAt: noteCtx, ghost: F.samePlace ? 0 : upd, oldFlag: F.samePlace ? 1 : 1 - upd,
    };
    let pc;
    if (F.cellB && u < W.build[0] + 0.07) {
      // arrival run of the inspected pin (card → before cell); seeking back restores this exactly
      pc = poseFocus('cf', G, F, L.C.fp, {move: 0, lift: 0, colOut: 0, colIn: 0, strike: 0, newFlag: 0, noteAt: 0, ghost: 0, oldFlag: arrive >= 1 ? 1 : 0});
      const pos = arcPt(F.park, F.cellB, arrive, 20);
      pc.nodes['cf-fpin'] = {transform: T(pos.x, pos.y), opacity: 1};
      pc.nodes['cf-fth'] = {...pc.nodes['cf-fth'], x2: r(pos.x), y2: r(pos.y), opacity: Math.hypot(pos.x - F.park.x, pos.y - F.park.y) > 0.5 ? 1 : 0};
      pc.nodes['cf-fclB'] = {...pc.nodes['cf-fclB'], opacity: arrive >= 1 ? 0.92 : 0};
      pc.pos = pos;
    } else pc = poseFocus('cf', G, F, L.C.fp, ctxSt);
    Object.assign(nodes, pc.nodes);
    // lens copy: everything except the pin and its thread, which are drawn over the tiles
    const pz = poseFocus('zf', G, F, L.Z.fp, sub, true);
    Object.assign(nodes, pz.nodes);

    // 3) camera: context → thumbnail while the lens is open, then back
    const shrink = ease.inOutCubic(s('shrink')) * (1 - ease.inOutCubic(s('grow')));
    const k = lerp(1, L.kT, shrink);
    const tx = lerp(0, L.thumb.x, shrink), ty = lerp(0, L.thumb.y, shrink);
    nodes.ctx = {transform: T(tx, ty, 0, k)};
    nodes['ctx-bg'] = {opacity: r(clamp(shrink * 1.5), 3)};
    nodes['thumb-frame'] = {x: r(tx - 6), y: r(ty - 6), width: r(L.D.w * k + 12), height: r(L.D.h * k + 12), opacity: r(clamp(shrink * 1.4) * 0.9, 3)};
    const open = ease.inOutCubic(s('open')) * (1 - ease.inOutCubic(s('close')));
    const vis = open > 0.001;
    // tiles: each kept column span / row span morphs from its place in the thumbnail to the lens
    const sc = lerp(k, L.zoom, open);
    const colNow = L.colSpans.map((q, i) => ({x: lerp(tx + q.x0 * k, L.colDest[i], open), w: (q.x1 - q.x0) * sc, x0: q.x0}));
    const rowNow = L.rowSpans.map((q, j) => ({y: lerp(ty + q.y0 * k, L.rowDest[j], open), h: (q.y1 - q.y0) * sc, y0: q.y0}));
    L.tiles.forEach((tl, k) => {
      const n = `lt${k}`;
      const cl = colNow[tl.i], rw = rowNow[tl.j];
      const rect = {x: r(cl.x + (tl.x0 - cl.x0) * sc), y: r(rw.y + (tl.y0 - rw.y0) * sc), width: r((tl.x1 - tl.x0) * sc), height: r((tl.y1 - tl.y0) * sc)};
      nodes[`${n}-cr`] = rect;
      nodes[`${n}-bg`] = rect;
      nodes[`${n}-fr`] = rect;
      nodes[`${n}-c`] = {transform: `${T(cl.x - cl.x0 * sc, rw.y - rw.y0 * sc)} scale(${r(sc, 4)})`};
    });
    const uni = {x: colNow[0].x, y: rowNow[0].y, w: colNow[colNow.length - 1].x + colNow[colNow.length - 1].w - colNow[0].x, h: rowNow[rowNow.length - 1].y + rowNow[rowNow.length - 1].h - rowNow[0].y};
    const frameIn = r(clamp((open - 0.35) / 0.4), 3);
    const ur = {x: r(uni.x - 8), y: r(uni.y - 8), width: r(uni.w + 16), height: r(uni.h + 16)};
    nodes['lens-win'] = {opacity: vis ? r(Math.min(1, open * 4), 3) : 0};
    nodes['lens-bg'] = {...ur, opacity: frameIn};
    nodes['lens-border'] = {...ur, opacity: frameIn};
    nodes['lens-shadow'] = {x: r(uni.x), y: r(uni.y + 4), width: ur.width, height: ur.height, opacity: frameIn};
    nodes['lens-breaks'] = {opacity: r(clamp((open - 0.8) / 0.2), 3)};
    nodes['lz-cr'] = ur;
    // piecewise map from context coordinates into the lens (collapsed gaps are squeezed into the breaks)
    const mapAxis = (v, spans, now, key0, key1, pos, len) => {
      for (let i = 0; i < spans.length; i++) {
        const q = spans[i];
        if (v <= q[key1] || i === spans.length - 1) {
          if (v >= q[key0] || i === 0) return now[i][pos] + (v - q[key0]) * sc;
          const prev = spans[i - 1];
          const f = (v - prev[key1]) / Math.max(1e-6, q[key0] - prev[key1]);
          return lerp(now[i - 1][pos] + now[i - 1][len], now[i][pos], f);
        }
      }
      return now[0][pos];
    };
    const mapPt = q => ({x: mapAxis(q.x, L.colSpans, colNow, 'x0', 'x1', 'x', 'w'), y: mapAxis(q.y, L.rowSpans, rowNow, 'y0', 'y1', 'y', 'h')});
    const lzPos = mapPt(pz.pos), lzAnchor = mapPt(F.anchor);
    const lzThread = Math.hypot(pz.pos.x - F.anchor.x, pz.pos.y - F.anchor.y) > 0.5;
    const tw = r(4 * G.ts * sc, 3);
    nodes['lz-th'] = {x1: r(lzAnchor.x), y1: r(lzAnchor.y), x2: r(lzPos.x), y2: r(lzPos.y), 'stroke-width': tw, opacity: lzThread ? r(1 - pz.colorSwap, 3) : 0};
    nodes['lz-tha'] = {x1: r(lzAnchor.x), y1: r(lzAnchor.y), x2: r(lzPos.x), y2: r(lzPos.y), 'stroke-width': tw, opacity: lzThread ? r(pz.colorSwap, 3) : 0};
    const lzLift = sub.lift;
    nodes['lz-pin'] = {transform: T(lzPos.x, lzPos.y, 0, sc), opacity: vis ? 1 : 0};
    nodes['lz-pin-b'] = {transform: lzLift ? `scale(${r(1 + 0.3 * lzLift, 4)})` : '', opacity: r(1 - pz.colorSwap, 3)};
    nodes['lz-pin-a'] = {transform: lzLift ? `scale(${r(1 + 0.3 * lzLift, 4)})` : '', opacity: r(pz.colorSwap, 3)};
    nodes['lz-pin-sh'] = {transform: T(4 + 14 * lzLift, 6 + 18 * lzLift, 0, 1 + 0.25 * lzLift)};
    // source outlines in the context, one per kept column span
    L.colSpans.forEach((_, i) => { nodes[`ctx-src${i}`] = {opacity: vis || shrink > 0.5 ? r(clamp(shrink * 2), 3) : 0}; });
    // cone lines: from the outer corners of the source region to the lens (under the thumbnail)
    const src = {x: tx + L.colSpans[0].x0 * k, y: ty + L.rowSpans[0].y0 * k, x1: tx + L.colSpans[L.colSpans.length - 1].x1 * k, y1: ty + L.rowSpans[L.rowSpans.length - 1].y1 * k};
    const coneOn = open > 0.05 ? 1 : 0;
    nodes['cone-a'] = {x1: r(src.x), y1: r(src.y1), x2: r(uni.x), y2: r(uni.y), opacity: coneOn};
    nodes['cone-b'] = {x1: r(src.x1), y1: r(src.y1), x2: r(uni.x + uni.w), y2: r(uni.y), opacity: coneOn};

    // annotation: before named while isolating, struck and joined to the after value while substituting
    if (L.ann) {
      nodes.ann = {opacity: r(s('before') * (1 - seg(u, W.close[0], W.close[0] + 0.025)), 3)};
      L.ann.strikes.forEach((st, i) => { nodes[`ann-strike${i}`] = {opacity: s('strike') > 0 ? 1 : 0, x2: r(lerp(st.x1, st.x2, s('strike')))}; });
      nodes['ann-arrow'] = {opacity: r(s('after'), 3)};
      nodes['ann-after'] = {opacity: r(s('after'), 3)};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(s('caption'), 3)};
    if (L.marker) nodes.marker = {opacity: r(s('marker'), 3)};

    // --- semantics
    const datum = u < W.lift[0] ? 'before' : u < W.colIn[1] ? 'changing' : 'after';
    const contextDatum = upd >= 1 ? 'after' : upd > 0 ? 'changing' : 'before';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const placeOf = pos => {
      if (F.cellA && Math.hypot(pos.x - F.cellA.x, pos.y - F.cellA.y) < 0.5) return `col${F.after.col}`;
      if (F.cellB && Math.hypot(pos.x - F.cellB.x, pos.y - F.cellB.y) < 0.5) return `col${F.before.col}`;
      if (Math.hypot(pos.x - F.park.x, pos.y - F.park.y) < 0.5) return 'card';
      return 'moving';
    };
    const noteState = at => r(F.pendCell ? at : 0, 3);
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      focusTarget: ctx.params.focusTarget,
      focusRow: L.fr,
      lensOpen: r(open, 3),
      thumb: r(shrink, 3),
      zoom: r(L.zoom, 3),
      lensTiles: {columns: L.colSpans.length, rows: L.rowSpans.length},
      cardInLens: L.cardInLens,
      headsInLens: L.headsInLens,
      datum,
      contextDatum,
      lensPlace: placeOf(pz.pos),
      contextPlace: placeOf(pc.pos),
      beforePlace: F.before.kind === 'cell' ? `col${F.before.col}` : 'card',
      afterPlace: F.after.kind === 'cell' ? `col${F.after.col}` : 'card',
      afterKind: F.after.kind,
      contextNote: noteState(ctxSt.noteAt),
      lensFlagText: sub.newFlag >= 1 ? L.texts.flagAfter : L.texts.flagBefore,
      contextFlagText: ctxSt.newFlag >= 1 ? L.texts.flagAfter : L.texts.flagBefore,
      ghost: r(ctxSt.ghost, 3),
      sourceContainsFocus: [F.cellB, F.cellA, F.anchor].filter(Boolean).every(q => L.inX(q.x) && L.inY(q.y)),
      markerShown: seg(u, ...W.marker) >= 1,
      otherLinks: G.links.filter(l => l !== L.focusLink).length,
      contextPin: P2(pc.pos),
      lensPin: P2(pz.pos),
      lensPinScreen: P2(lzPos),
      lensRect: {x: r(uni.x), y: r(uni.y), w: r(uni.w), h: r(uni.h)},
      geo: {D: [r(L.D.w), r(L.D.h)], headW: r(G.headW), colW: r(G.colW), rowH: r(G.rowH), cardLines: L.row.fit.lines.length},
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-09-inspect',
    title: 'Authority matrix — inspecting one cited source',
    titleEs: 'Matriz de autoridades — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Matriz de autoridades',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A cork-board authority matrix assembles as supplied; a lens lifts a real enlarged copy of what identifies one citation — the proposition card, the head of the cited source and the cell with its pin, thread and pinpoint flag — with the columns in between collapsed. One datum is replaced by the preset’s alternative — which source the row cites (the pin travels along its thread to another column, or back to the card) or the pinpoint on its flag — while the old place keeps a dashed ghost and a struck value. The lens folds back; the context shows the new datum (a pending row gets a “source pending” note from the pad) with a “datum changed” tag. Seeking back restores the old datum.',
    tags: ['research', 'authority matrix', 'inspect', 'lens', 'citation', 'pinpoint', 'pending source', 'before and after', 'library'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/matriz-de-autoridades.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
