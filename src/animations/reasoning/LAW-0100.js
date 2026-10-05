/**
 * LAW-0100 — Condiciones acumulativas · inspect
 *
 * Storyboard (an inspection mat: the rule board on one side, free room for a
 * reading glass on the other — right of the board on wide and square boxes,
 * under it on tall boxes):
 *  0.00–0.20 build       The state produced by the action: the rule board
 *                        with its fact pieces pressed into their pockets (a
 *                        pending pocket keeps a dashed outline, a disputed
 *                        piece rests askew), then the test turn: the gear line
 *                        turns as far as the seated pieces allow and the joint
 *                        dial follows only if every piece is seated. A reading
 *                        glass lies in the free room; the author's issue /
 *                        assumptions note is pinned beside it for this beat.
 *  0.20–0.45 isolate     The reading glass glides over the inspected pocket
 *                        (piece k with both of its mesh contacts, its fact
 *                        panel and its condition plate), then is lifted into
 *                        the free room: the lens — a real second copy of the
 *                        board drawn at the SAME coordinates — enlarges that
 *                        region while the context dims (the source stays lit,
 *                        dashed cone lines tie the two).
 *  0.45–0.75 substitute  ONE datum of piece k is replaced inside the lens and
 *                        only its local geometry changes:
 *                          status  supplied → pending: the piece slides out of
 *                                  its pocket along its lane, both mesh
 *                                  contacts split, a dashed outline stays (or
 *                                  → disputed: lifted askew, teeth unmeshed,
 *                                  "?" badge; or the reverse: slides in);
 *                          fact    the text printed on piece k: the old text
 *                                  lifts away, then the new one appears.
 *                        A before → after note keeps the old value traceable
 *                        (struck through line by line, still readable).
 *  0.75–1.00 return      The lens closes back onto its source (the context
 *                        takes the same change under it), the glass is laid
 *                        back down, the dependent state follows — the joint
 *                        dial springs back to its open end when a piece is
 *                        missing, or a new test turn carries it to the end
 *                        when the board becomes complete — and a "changed
 *                        datum" marker rings pocket k. Nothing else moves.
 * Seeking back before the substitution restores the previous datum exactly.
 * Legal content: fictional rule and facts, jurisdiction unspecified; the
 * substituted value is supplied by the author. The board never decides that
 * a condition is met in law, that the rule applies or any outcome.
 * @module animations/reasoning/LAW-0100
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, oneOf, inspectFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {placeChip, calloutChip, stateTag, leaderFrom, segmentHits} from '../causation/kits/place.js';
import {
  CA_STRINGS, caFields, CA_DEFAULTS, STATUSES, resolveSlots, stateLine, planBoard, boardArt, pieceArt, ghostArt,
  doubtBadge, noteCard, findSpot, meshPoints, meshMark, readingGlass, glassBox, inspectMat, factTextAt, fill, hit, stateTagWrap,
} from './kits/condiciones-acumulativas.js';

const ID = 'LAW-0100';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  cap: [0.02, 0.1], drop: [0.02, 0.12], turnB: [0.1, 0.19], tagB: [0.13, 0.19], note: [0.05, 0.12], noteOut: [0.19, 0.23], marks: [0.14, 0.2],
  glide: [0.2, 0.34], open: [0.355, 0.44], before: [0.42, 0.47],
  strike: [0.47, 0.53], change: [0.5, 0.68], after: [0.62, 0.7],
  close: [0.76, 0.86], ctxUpd: [0.79, 0.86], back: [0.87, 0.95], dep: [0.87, 0.94], tagOut: [0.86, 0.885], tagIn: [0.9, 0.94], marker: [0.9, 0.97],
};
const REST_ROT = -7;
const FONT = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

const sceneSchema = {
  ...caFields,
  ...inspectFields(['status', 'fact']),
  focusPiece: int('Piece examined under the reading glass (1 = the piece of the first condition)', 1, 5),
  afterStatus: oneOf('Status of the examined piece after the substitution, supplied by the author (used when focusTarget is "status"): supplied = seated | pending = no piece yet, the pocket stays empty | disputed = brought but not seated, not resolved here', STATUSES),
};

const defaultParams = {
  ...CA_DEFAULTS,
  focusTarget: 'status',
  focusPiece: 2,
  beforeValue: 'Supplied: receipt D-12 brought',
  afterValue: 'Pending: no receipt supplied yet',
  afterStatus: 'pending',
  detailGeometry: {zoom: 2.1, placement: 'auto'},
  contextLabels: {context: 'Context: the Rule R-1 board after its test turn', marker: 'Changed datum: piece 2'},
};

const SHAPE = {
  landscape: {side: 'right', fracs: [0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64], sizes: {fact: 26, cond: 23, header: 30}, maxR: 90, ann: 28, annW: 420, cap: 24, tag: 26, note: 22},
  square: {side: 'right', fracs: [0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.66], sizes: {fact: 30, cond: 27, header: 33}, maxR: 84, ann: 31, annW: 440, cap: 29, tag: 29, note: 27},
  portrait: {side: 'bottom', tagWrap: 440, fracs: [0.36, 0.4, 0.44, 0.48, 0.5, 0.52, 0.53, 0.54, 0.55, 0.56, 0.58, 0.6], sizes: {fact: 25, cond: 23, header: 29}, maxR: 90, ann: 28, annW: 400, cap: 25, tag: 25, note: 23},
};
const M = 22;       // outer margin
const GAP = 34;     // board region ↔ lens region
const ANN_GAP = 26; // lens ↔ before/after note

/** Region of the board and of the lens for a split fraction. */
function regions(D, side, f, top) {
  const iw = D.w - 2 * M, ih = D.h - 2 * M;
  if (side === 'right' || side === 'left') {
    const bw = iw * f;
    const bx = side === 'right' ? M : D.w - M - bw;
    const lx = side === 'right' ? M + bw + GAP : M;
    return {board: {x: bx, y: M + top, w: bw, h: ih - top}, lens: {x: lx, y: M, w: iw - bw - GAP, h: ih}};
  }
  const bh = ih * f;
  const by = side === 'bottom' ? M : D.h - M - bh;
  const ly = side === 'bottom' ? M + bh + GAP : M;
  return {board: {x: M, y: by + top, w: iw, h: bh - top}, lens: {x: M, y: ly, w: iw, h: ih - bh - GAP}};
}

/** The inspected region: pocket k with its gear, both mesh contacts and its fact panel. */
function sourceRect(P, k) {
  const s = P.slots[k];
  const half = 2 * P.R - P.gap / 2 + 10;
  return P.rectUV(s.u - half, s.u + half, -s.s * P.R * 1.3, s.s * (P.vIn + P.D + 10));
}

/**
 * Largest lens (≤ zoom) that fits in `reg` together with the before/after
 * note and the glass handle. The handle never points at the board or the note.
 */
function fitLens(ctx, src, reg, o) {
  const noteFor = w => (o.annTexts ? o.annTexts.map(tx => chip(ctx, tx, {x: 0, y: 0, maxWidth: w, size: o.annSize, maxLines: 4}).box) : null);
  const arrangements = o.annTexts ? ['below', 'right', 'left', 'above'] : ['none'];
  const handleSides = ['right', 'left', 'bottom', 'top', 'br', 'bl', 'tr', 'tl'];
  // never toward the board (it would lie across the context)
  const away = {left: ['left', 'tl', 'bl'], right: ['right', 'tr', 'br'], top: ['top', 'tl', 'tr'], bottom: ['bottom', 'bl', 'br']}[o.boardSide];
  let best = null;
  for (const arr of arrangements) {
    const beside = arr === 'right' || arr === 'left';
    const nw = beside ? Math.min(o.annW, reg.w * 0.42) : Math.min(reg.w, o.annW * 1.5);
    const chips = arr === 'none' ? null : noteFor(nw);
    const noteW = chips ? Math.max(...chips.map(b => b.w)) : 0;
    const noteH = chips ? chips[0].h + 44 + chips[1].h : 0;
    const box = {x: 0, y: 0, w: reg.w - (beside ? noteW + ANN_GAP : 0), h: reg.h - (!beside && chips ? noteH + ANN_GAP : 0)};
    if (box.w < 80 || box.h < 80) continue;
    const blocked = arr === 'below' ? ['bottom', 'bl', 'br'] : arr === 'above' ? ['top', 'tl', 'tr'] : arr === 'right' ? ['right', 'tr', 'br'] : arr === 'left' ? ['left', 'tl', 'bl'] : [];
    for (const side of handleSides) {
      if (away.includes(side) || blocked.includes(side)) continue;
      // bisection on the zoom: rim + handle inside the box
      const fits = z => {
        const R = {x: 0, y: 0, w: src.w * z, h: src.h * z};
        const b = glassBox(R, side);
        return b.w <= box.w && b.h <= box.h;
      };
      let lo = 0.5, hi = o.zoom;
      if (!fits(lo)) continue;
      if (fits(hi)) lo = hi;
      else for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
      const z = lo;
      const pref = (arr === 'below' || arr === 'none' ? 0.02 : 0) + (['right', 'left', 'bottom', 'top'].includes(side) ? 0.01 : 0);
      if (!best || z + pref > best.z + best.pref + 1e-6) best = {z, pref, arr, side, chips, noteW, noteH, nw};
    }
  }
  if (!best) return null;
  // place: the union of glass (rim + handle) and note, centred in the region
  const w = src.w * best.z, hh = src.h * best.z;
  const R0 = {x: 0, y: 0, w, h: hh};
  const gb = glassBox(R0, best.side);
  let note = null;
  if (best.arr === 'below') note = {x: w / 2 - best.noteW / 2, y: Math.max(hh, gb.y + gb.h) + ANN_GAP, w: best.noteW, h: best.noteH};
  if (best.arr === 'above') note = {x: w / 2 - best.noteW / 2, y: Math.min(0, gb.y) - ANN_GAP - best.noteH, w: best.noteW, h: best.noteH};
  if (best.arr === 'right') note = {x: Math.max(w, gb.x + gb.w) + ANN_GAP, y: 0, w: best.noteW, h: best.noteH};
  if (best.arr === 'left') note = {x: Math.min(0, gb.x) - ANN_GAP - best.noteW, y: 0, w: best.noteW, h: best.noteH};
  const U = note ? unionOf([gb, note]) : gb;
  const ox = reg.x + (reg.w - U.w) / 2 - U.x;
  const oy = reg.y + (reg.h - U.h) / 2 - U.y;
  const dest = {x: ox, y: oy, w, h: hh};
  return {zoom: best.z, dest, side: best.side, arr: best.arr, note: note && {x: note.x + ox, y: note.y + oy, w: note.w, h: note.h}, nw: best.nw};
}

/**
 * Free box for the marker chip anywhere off the board, whose leader reaches
 * the nearest point of the ring without crossing any text (it may cross the
 * bare slate and gears). Shortest leader wins.
 */
function markerSpot(size, ring, textParts, board, bounds) {
  let best = null;
  const step = 12;
  for (let y = bounds.y; y + size.h <= bounds.y + bounds.h; y += step) {
    for (let x = bounds.x; x + size.w <= bounds.x + bounds.w; x += step) {
      const b = {x, y, w: size.w, h: size.h};
      if (hit(b, board, 12) || textParts.some(q => hit(b, q, 10))) continue;
      const c = {x: x + size.w / 2, y: y + size.h / 2};
      const end = {x: clamp(c.x, ring.x, ring.x + ring.w), y: clamp(c.y, ring.y, ring.y + ring.h)};
      const from = leaderFrom(b, end);
      const len = Math.hypot(end.x - from.x, end.y - from.y);
      if (len < 24) continue;
      if (segmentHits(from, end, textParts, 14)) continue;
      if (!best || len < best.len) best = {len, x: c.x, y, end};
    }
  }
  return best;
}

function unionOf(list) {
  const x = Math.min(...list.map(b => b.x)), y = Math.min(...list.map(b => b.y));
  return {x, y, w: Math.max(...list.map(b => b.x + b.w)) - x, h: Math.max(...list.map(b => b.y + b.h)) - y};
}

/** Pose of the examined piece for a status (offset along its lane, tilt, lift). */
function poseOf(status, P, k, exit) {
  const s = P.slots[k].s;
  if (status === 'supplied') return {off: 0, rot: 0, lift: 0};
  // brought but not pressed in: raised (shadow, slight scale), a hair askew, teeth unmeshed;
  // it never slides onto its condition plate
  if (status === 'disputed') return {off: 0, rot: 1.5 * s, lift: 1};
  return {off: exit, rot: 0, lift: 0};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const SH = SHAPE[ctx.view.shape];
    const n = p.rules.conditions.length;
    const k = Math.min(p.focusPiece, n) - 1;
    const target = p.focusTarget;
    const resB = resolveSlots(p);
    const statusB = resB.slots[k].status;
    const statusA = target === 'status' ? p.afterStatus : statusB;
    const resA = resolveSlots(p, {[k]: statusA});
    const factB = target === 'fact' ? (p.beforeValue || resB.slots[k].fact) : resB.slots[k].fact;
    const factA = target === 'fact' ? (p.afterValue || factB) : factB;
    const planFacts = resB.slots.map(s => s.fact);
    planFacts[k] = factA.length > factB.length ? factA : factB;
    const conds = resB.slots.map(s => s.condition);
    const side = p.detailGeometry.placement === 'auto' ? SH.side : p.detailGeometry.placement;
    const boardSide = {right: 'left', left: 'right', bottom: 'top', top: 'bottom'}[side];

    // ---- texts: context caption, before → after note
    const showKey = ctx.show('key');
    const capW = side === 'right' || side === 'left' ? (D.w - 2 * M) * 0.46 : D.w - 2 * M;
    const capProbe = ctx.show('all') && p.contextLabels.context ? chip(ctx, p.contextLabels.context, {x: 0, y: 0, maxWidth: capW, size: SH.cap, maxLines: 2}) : null;
    const capH = capProbe ? capProbe.box.h + 12 : 0;
    const label = target === 'status' ? fill(t.statusOf, k + 1) : fill(t.factOn, k + 1);
    const beforeTxt = target === 'status' ? (p.beforeValue || t[statusB]) : factB;
    const afterTxt = target === 'status' ? (p.afterValue || t[statusA]) : factA;
    const annTexts = showKey ? [`${label}: ${beforeTxt}`, `${label}: ${afterTxt}`] : null;
    const tagSize = SH.tag;
    // portrait: the state wraps to two lines in a narrower pill, leaving room beside it for
    // the changed-datum marker (whose leader must reach the ring without crossing text)
    const tagMake = (text, o) => (SH.tagWrap ? stateTagWrap(ctx, text, {...o, maxWidth: SH.tagWrap}) : stateTag(ctx, text, o));
    const tagH = showKey ? Math.max(...[resB, resA].map(rs => tagMake(stateLine(t, rs), {x: 0, y: 0, size: tagSize, maxWidth: 10000}).box.h)) + 14 : 0;

    // ---- split search: board size vs lens magnification
    let best = null;
    for (const f of SH.fracs) {
      const reg = regions(D, side, f, capH);
      const box = {...reg.board, h: reg.board.h - tagH};
      const P = planBoard(ctx, {n, axis: 'row', box, header: 'top', ruleName: p.rules.name, conds, facts: planFacts, sizes: SH.sizes, maxR: SH.maxR});
      const src = sourceRect(P, k);
      const fl = fitLens(ctx, src, reg.lens, {annTexts, annSize: SH.ann, annW: SH.annW, zoom: p.detailGeometry.zoom, boardSide});
      if (!fl) continue;
      // a board that overflows its region (texts too long for it) ranks last
      const over = Math.max(0, P.extents.w - box.w, P.extents.h - box.h);
      // author text must stay whole and readable on the context board: an ellipsis or a
      // shrunken font costs more than a smaller magnification
      const cut = P.slots.some(q => (q.factFit && q.factFit.truncated) || (q.condFit && q.condFit.truncated)) || Boolean(P.header && P.header.fit && P.header.fit.truncated);
      const fontK = P.fs / SH.sizes.fact;
      const score = P.R * Math.pow(Math.min(fl.zoom, p.detailGeometry.zoom), 1.4) * fontK * fontK - (fl.zoom < 1.6 ? 1000 : 0) - (cut ? 1e4 : 0) - (over > 1 ? 1e5 + over : 0);
      if (!best || score > best.score) best = {score, f, reg, P, src, fl};
    }
    const {P, src: source, reg} = best;
    const fl = best.fl;
    const dest = fl.dest;
    const R = P.R;
    const slot = P.slots[k];
    const ext = P.extents;
    const exit = P.vIn + P.D + P.gp + P.ph + 12 + slot.inner + 16;

    // ---- context: mat, board, pieces, ghosts, badges, mesh marks
    const mat = n0 => inspectMat(ctx, {name: n0, x: 4, y: 4, w: D.w - 8, h: D.h - 8});
    const turnDir = 1;
    const mkCopy = (pre, texts) => {
      const board = boardArt(ctx, P, {prefix: `${pre}bd`, crankAngle: 90, turnDir, text: texts});
      const pieces = resB.slots.map(s => {
        const present = s.status !== 'pending' || (s.i === k && statusA !== 'pending');
        if (!present) return null;
        const own = s.i === k && target === 'fact';
        return pieceArt(ctx, P, s.i, {name: `${pre}pc${s.i}`, text: !own});
      });
      const ghosts = resB.slots.map(s => (s.status === 'pending' || (s.i === k && statusA === 'pending') ? ghostArt(ctx, P, s.i, `${pre}ghost${s.i}`) : null));
      const badges = resB.slots.map(s => (s.status === 'disputed' || (s.i === k && statusA === 'disputed') ? doubtBadge(ctx, {name: `${pre}doubt${s.i}`, x: 0, y: 0, rad: Math.max(18, R * 0.26)}) : null));
      const mp = meshPoints(P);
      const marks = [mp[k], mp[k + 1]].map((q, j) => meshMark(ctx, {name: `${pre}mk${j}`, x: q.x, y: q.y, a: q.a, size: Math.max(12, R * 0.2)}));
      // fact texts of piece k (fact substitution): before and after, on the piece
      let ftexts = null;
      if (target === 'fact' && pieces[k] && showKey) {
        const mw = slot.panelLocal.w - 2 * P.px - (P.row ? 0 : P.stripe);
        const fb = ctx.fit(factB, {maxWidth: mw, size: P.fs, minSize: P.fs * 0.8, maxLines: 4, weight: 500});
        const fa = ctx.fit(factA, {maxWidth: mw, size: P.fs, minSize: P.fs * 0.8, maxLines: 4, weight: 500});
        const pb = factTextAt(P, k, fb), pa = factTextAt(P, k, fa);
        ftexts = g({name: `${pre}ft`},
          g({name: `${pre}ftB`}, textBlock(fb, {x: pb.x, y: pb.y, anchor: 'middle', fill: th.ink})),
          g({name: `${pre}ftA`, opacity: 0}, textBlock(fa, {x: pa.x, y: pa.y, anchor: 'middle', fill: th.ink})));
      }
      return {board, pieces, ghosts, badges, marks, ftexts, mp};
    };
    const C = mkCopy('', true);
    const Lz = mkCopy('lz', true);

    // ---- lens (real enlarged copy of the same coordinates) and the reading glass
    const lensContent = g(null, mat('lzmat'), Lz.board.node, Lz.ghosts, Lz.marks,
      Lz.pieces.map(pc => pc && pc.node), Lz.ftexts, Lz.badges);
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: {x: 0, y: 0, w: D.w, h: D.h}, color: th.accent2});
    const glass = readingGlass(ctx, {name: 'glass'});

    // ---- before → after note (the single editorial annotation)
    let ann = null;
    if (annTexts && fl.note) {
      const nb = fl.note;
      const anchor = fl.arr === 'left' ? 'end' : fl.arr === 'right' ? 'start' : 'middle';
      const ax = anchor === 'end' ? nb.x + nb.w : anchor === 'start' ? nb.x : nb.x + nb.w / 2;
      const before = chip(ctx, annTexts[0], {x: ax, y: nb.y, anchor, maxWidth: fl.nw, size: SH.ann, maxLines: 4, fill: th.card, name: 'ann-before'});
      const ay = before.box.y + before.box.h + 8;
      const arX = anchor === 'middle' ? ax : anchor === 'start' ? ax + 30 : ax - 30;
      const arrow = h('path', {name: 'ann-arrow', d: `M${r(arX)} ${r(ay)}v26m-9 -10l9 10l9 -10`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
      const after = chip(ctx, annTexts[1], {x: ax, y: ay + 36, anchor, maxWidth: fl.nw, size: SH.ann, maxLines: 4, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      // one strike segment per fitted line of the old value, through that line's x-height
      const f = before.fit;
      const top = before.box.y + SH.ann * 0.38;
      const segs = f.lines.map((ln, i) => {
        const lw = ctx.measure(ln, f.size, f.weight, f.family);
        const y = top + f.size * 0.8 + i * f.lineHeight - f.size * 0.27;
        const x1 = before.box.cx - lw / 2 - 5, x2 = before.box.cx + lw / 2 + 5;
        return {x1, x2, y, len: x2 - x1};
      });
      const strike = g({name: 'ann-strike'}, segs.map((s, i) => h('line', {name: `ann-strike${i}`, x1: r(s.x1), x2: r(s.x2), y1: r(s.y), y2: r(s.y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(s.len)} ${r(s.len + 10)}`, 'stroke-dashoffset': r(s.len)})));
      ann = {before, after, arrow, strike, segs, box: unionOf([before.box, after.box])};
    }

    // ---- context caption (attached to the board's top-left corner)
    const capBox = capProbe ? {x: ext.x, y: ext.y - capProbe.box.h - 12, w: capProbe.box.w, h: capProbe.box.h} : null;
    const cap = capProbe ? chip(ctx, p.contextLabels.context, {x: capBox.x, y: capBox.y, maxWidth: capW, size: SH.cap, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: 'ctx-cap', weight: 600}) : null;

    // ---- state tags (before / after) under the board
    let tagB = null, tagA = null;
    if (showKey) {
      const mw = Math.min(D.w - M - ext.x, Math.max(ext.w, 360));
      const ty = ext.y + ext.h + 12;
      tagB = tagMake(stateLine(t, resB), {x: ext.x, y: ty, size: tagSize, maxWidth: mw, name: 'tagB', color: resB.complete ? th.accent2 : th.inkSoft, opacity: 0});
      tagA = tagMake(stateLine(t, resA), {x: ext.x, y: ty, size: tagSize, maxWidth: mw, name: 'tagA', color: resA.complete ? th.accent2 : th.inkSoft, opacity: 0});
    }

    // ---- where the glass rests (build and hold): free room, clear of the note
    const boardBox = {x: ext.x, y: ext.y, w: ext.w, h: ext.h};
    const hard = [boardBox, capBox, tagB && tagB.box, tagA && tagA.box, ann && ann.box].filter(Boolean);
    const restProbe = glassBox({x: 0, y: 0, w: source.w, h: source.h}, fl.side);
    const inflate = (b, d) => ({x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d});
    const restSize = {w: restProbe.w + 24, h: restProbe.h + 24};
    const bounds = {x: 10, y: 10, w: D.w - 20, h: D.h - 20};
    const destC = {x: dest.x + dest.w / 2, y: dest.y + dest.h / 2};
    const restSpot = findSpot(restSize, destC, hard, reg.lens.w > 0 ? {x: Math.max(bounds.x, reg.lens.x - 10), y: Math.max(bounds.y, reg.lens.y - 10), w: Math.min(reg.lens.w + 20, D.w - 20), h: Math.min(reg.lens.h + 20, D.h - 20)} : bounds, {pad: 10, step: 10})
      || findSpot(restSize, destC, hard, bounds, {pad: 6, step: 10})
      || {x: dest.x, y: dest.y, w: restSize.w, h: restSize.h};
    // the rim sits inside the spot where its handle leaves room
    const restRect = {x: restSpot.x + 12 - restProbe.x, y: restSpot.y + 12 - restProbe.y, w: source.w, h: source.h};
    const restBox = inflate(glassBox(restRect, fl.side), 12);

    // ---- author's issue / assumptions note (build beat only), clear of the glass at rest
    let note = null;
    for (const [mw, ml] of [[Math.min(520, D.w * 0.4), 3], [Math.min(420, D.w * 0.36), 5], [320, 7]]) {
      const probe = noteCard(ctx, {name: 'note-probe', x: 0, y: 0, maxWidth: mw, issues: p.issues, assumptions: p.assumptions, size: SH.note, maxLines: ml});
      if (!probe) break;
      const spot = findSpot({w: probe.box.w, h: probe.box.h}, {x: reg.lens.x + reg.lens.w / 2, y: reg.lens.y + 20}, [boardBox, capBox, tagB && tagB.box, restBox].filter(Boolean), bounds, {pad: 12, step: 12});
      if (spot) {
        note = noteCard(ctx, {name: 'note', x: spot.x, y: spot.y, maxWidth: mw, issues: p.issues, assumptions: p.assumptions, size: SH.note, maxLines: ml});
        break;
      }
    }

    // ---- changed-datum marker: a ring round pocket k, a callout in free room
    const foot = unionOf([slot.panelAbs, slot.tabAbs, {x: slot.c.x - P.G.ra, y: slot.c.y - P.G.ra, w: 2 * P.G.ra, h: 2 * P.G.ra}]);
    const ringBox = inflate(foot, 12);
    const ring = g({name: 'marker-ring', opacity: 0},
      h('path', {d: roundRectPath(ringBox.x, ringBox.y, ringBox.w, ringBox.h, 18), fill: 'none', stroke: '#ffffff', 'stroke-width': 11}),
      h('path', {d: roundRectPath(ringBox.x, ringBox.y, ringBox.w, ringBox.h, 18), fill: 'none', stroke: th.accent2, 'stroke-width': 5.5, 'stroke-dasharray': '16 9'}),
    );
    let marker = null;
    let markerClean = false;
    if (ctx.show('all') && p.contextLabels.marker) {
      const textParts = [P.header && P.header.rect, ...P.slots.map(s => s.plate), ...P.slots.map(s => s.panelAbs), capBox, tagB && tagB.box, tagA && tagA.box, ann && inflate(ann.box, 8), restBox].filter(Boolean);
      let mw = Math.min(380, D.w * 0.36);
      // the ring edge that faces the lens room
      const tg = side === 'right' ? {x: ringBox.x + ringBox.w, y: ringBox.y + ringBox.h / 2}
        : side === 'left' ? {x: ringBox.x, y: ringBox.y + ringBox.h / 2}
          : side === 'bottom' ? {x: ringBox.x + ringBox.w / 2, y: ringBox.y + ringBox.h} : {x: ringBox.x + ringBox.w / 2, y: ringBox.y};
      const order = side === 'right' ? ['right', 'rightHigh', 'rightLow', 'aboveR', 'belowR'] : side === 'left' ? ['left', 'leftHigh', 'leftLow', 'aboveL', 'belowL']
        : side === 'bottom' ? ['below', 'belowR', 'belowL', 'right', 'left'] : ['above', 'aboveR', 'aboveL', 'right', 'left'];
      // widest chip first; narrower (2–3 line) chips fit the gap beside the state tag
      const widths = [mw, 260, 200].filter((w0, j) => j === 0 || w0 < mw);
      let at = null;
      for (const w0 of widths) {
        const pr = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: w0, size: SH.tag - 2, maxLines: 3});
        if (pr.fit.truncated) continue;
        at = placeChip(pr.box, {...tg, r: 4}, {obstacles: [...textParts, P.board], own: [P.board], bounds, pad: 10, order, gaps: [30, 50, 80, 120, 170, 230, 300]});
        if (at) { mw = w0; break; }
      }
      for (const w0 of widths) {
        if (at) break;
        const pr = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: w0, size: SH.tag - 2, maxLines: 3});
        if (pr.fit.truncated) continue;
        at = markerSpot(pr.box, ringBox, textParts, P.board, bounds);
        if (at) mw = w0;
      }
      markerClean = Boolean(at);
      if (at) marker = calloutChip(ctx, {name: 'marker', text: p.contextLabels.marker, chipAt: {x: at.x, y: at.y}, target: at.end, maxWidth: mw, maxLines: 3, size: SH.tag - 2, color: th.accent2});
    }

    // ---- build-turn geometry: a whole number of teeth, so an inserted gear meshes
    const thetaFull = P.G.p * Math.round(180 / P.G.p);
    const turnedB = cell => {
      if (cell === 0) return true;
      if (cell === n + 1) return resB.complete;
      const i = cell - 1;
      return resB.slots[i].status === 'supplied' && (resB.breakAt < 0 || i < resB.breakAt);
    };
    const sourceHolds = pt => pt.x >= source.x && pt.x <= source.x + source.w && pt.y >= source.y && pt.y <= source.y + source.h;
    const sourceContains = sourceHolds(slot.c) && C.mp.slice(k, k + 2).every(sourceHolds)
      && [slot.tabAbs, slot.panelAbs].every(b => sourceHolds(b) && sourceHolds({x: b.x + b.w, y: b.y + b.h}));

    return {
      P, k, n, target, statusB, statusA, resB, resA, source, dest, zoom: fl.zoom, side, handleSide: fl.side, arr: fl.arr, exit, thetaFull, turnedB,
      C, Lz, L2, glass, ann, cap, tagB, tagA, note, ring, marker, markerClean, restRect, sourceContains, mat: mat('mat'), splitF: best.f,
    };
  },
  build(ctx, L) {
    const C = L.C;
    return g(null,
      L.mat,
      C.board.node,
      C.ghosts,
      C.marks,
      C.pieces.map(pc => pc && pc.node),
      C.ftexts,
      C.badges,
      L.ring,
      L.cap && g({name: 'ctx-cap-g', opacity: 0}, L.cap.node),
      L.tagB && L.tagB.node,
      L.tagA && L.tagA.node,
      L.note && L.note.node,
      L.L2.node,
      L.glass.node,
      L.ann && g({name: 'ann', opacity: 0}, L.ann.before.node, L.ann.strike, L.ann.arrow, L.ann.after.node),
      L.marker && L.marker.node,
    );
  },
  frame(ctx, L, u) {
    const P = L.P;
    const k = L.k;
    const reduced = ctx.reduced;
    const nodes = {};
    const sem = {};
    const slot = P.slots[k];
    const dir = slot.dir;

    // ---- build: pieces press in, then the test turn
    const drop = ease.outCubic(seg(u, ...W.drop));
    const thB = L.thetaFull * ease.inOutSine(seg(u, ...W.turnB));
    // dependent state on return
    const depK = ease.inOutSine(seg(u, ...W.dep));
    const turnA = L.resA.complete && !L.resB.complete;
    const thA = turnA ? L.thetaFull * depK : 0;

    // ---- the examined piece: lens copy changes first, context follows under the closing lens
    const vL = ease.inOutCubic(seg(u, ...W.change));
    const vC = ease.inOutCubic(seg(u, ...W.ctxUpd));
    const pB = poseOf(L.statusB, P, k, L.exit), pA = poseOf(L.statusA, P, k, L.exit);
    const kPose = v => {
      const off = lerp(pB.off, pA.off, v);
      const moving = L.statusA !== L.statusB && !reduced ? Math.sin(Math.PI * v) : 0;
      return {c: {x: slot.c.x + dir.x * off, y: slot.c.y + dir.y * off}, rot: lerp(pB.rot, pA.rot, v), lift: Math.max(lerp(pB.lift, pA.lift, v), moving), off};
    };
    const seatedAt = (st, v) => (v <= 0 ? st.b === 'supplied' : v >= 1 ? st.a === 'supplied' : false);

    const copy = (pre, Cc, vk, isLens) => {
      const states = [];
      for (let i = 0; i < L.n; i++) {
        const pc = Cc.pieces[i];
        const sB = L.resB.slots[i].status;
        const name = `${pre}pc${i}`;
        const gearTurn = (cell, extra = 0) => {
          const s0 = P.slots[i];
          const tB = isLens ? L.thetaFull : thB;
          return s0.phase + s0.sign * ((L.turnedB(cell) ? tB : 0) + (isLens ? 0 : thA)) + extra;
        };
        if (i === k) {
          if (!pc) { states.push('absent'); continue; }
          const ps = kPose(vk);
          const dropK = isLens ? 1 : drop;
          const pl = (1 - dropK);
          const lift = Math.max(ps.lift, pl);
          const sc = 1 + 0.035 * lift;
          let op = 1;
          if (!isLens) {
            if (L.statusB === 'pending') op = seg(vk, 0.02, 0.45);
            if (L.statusA === 'pending') op = Math.min(op, 1 - seg(vk, 0.55, 0.98));
          } else if ((L.statusB === 'pending' && vk <= 0) || (L.statusA === 'pending' && vk >= 1)) op = 0;
          nodes[name] = {transform: `${T(ps.c.x, ps.c.y, ps.rot)}${sc !== 1 ? ` scale(${r(sc, 4)})` : ''}`, opacity: r(op, 3)};
          nodes[`${name}-sh`] = {transform: T(6 * lift, 9 * lift), opacity: r(0.55 + 0.45 * lift, 3)};
          const unmesh = P.G.p * 0.45 * clamp(lerp(L.statusB === 'disputed' ? 1 : 0, L.statusA === 'disputed' ? 1 : 0, vk));
          const tB = isLens ? L.thetaFull : thB;
          const turnedK = L.statusB === 'supplied' && (L.resB.breakAt < 0 || k < L.resB.breakAt);
          nodes[`${name}-g-rot`] = {transform: `rotate(${r(slot.phase + slot.sign * ((turnedK ? tB : 0) + (isLens ? 0 : thA)) + unmesh)})`};
          if (Cc.ftexts) nodes[`${pre}ft`] = {transform: `${T(ps.c.x, ps.c.y, ps.rot)}${sc !== 1 ? ` scale(${r(sc, 4)})` : ''}`};
          sem[isLens ? 'lensPiece' : 'pieceK'] = {x: r(ps.c.x), y: r(ps.c.y)};
          states.push(vk <= 0 ? L.statusB : vk >= 1 ? L.statusA : 'changing');
          continue;
        }
        if (!pc) { states.push('absent'); continue; }
        const disp = sB === 'disputed';
        const off = 0;
        const rot = disp ? 1.5 * P.slots[i].s : 0;
        const dropK = isLens ? 1 : drop;
        const lift = Math.max(disp ? 1 : 0, 1 - dropK);
        const c = {x: P.slots[i].c.x + P.slots[i].dir.x * off, y: P.slots[i].c.y + P.slots[i].dir.y * off};
        const sc = 1 + 0.035 * lift;
        nodes[name] = {transform: `${T(c.x, c.y, rot)}${sc !== 1 ? ` scale(${r(sc, 4)})` : ''}`};
        nodes[`${name}-sh`] = {transform: T(6 * lift, 9 * lift), opacity: r(0.55 + 0.45 * lift, 3)};
        nodes[`${name}-g-rot`] = {transform: `rotate(${r(disp ? P.slots[i].phase + P.G.p * 0.45 : gearTurn(i + 1))})`};
        if (!isLens) sem[`pc${i}`] = {x: r(c.x), y: r(c.y)};
        states.push(disp ? 'disputed' : 'seated');
      }
      // drive / output
      const tB = isLens ? L.thetaFull : thB;
      nodes[`${pre}bd-drive-rot`] = {transform: `rotate(${r(P.phases[0].phase + tB + (isLens ? 0 : thA))})`};
      nodes[`${pre}bd-out-rot`] = {transform: `rotate(${r(P.output.phase + P.output.sign * ((L.resB.complete ? tB : 0) + (isLens ? 0 : thA)))})`};
      // badges ride on their pieces
      for (let i = 0; i < L.n; i++) {
        const b = Cc.badges[i];
        if (!b) continue;
        let c, op;
        if (i === k) {
          const ps = kPose(vk);
          c = ps.c;
          op = clamp(lerp(L.statusB === 'disputed' ? 1 : 0, L.statusA === 'disputed' ? 1 : 0, vk));
        } else {
          c = P.slots[i].c;
          op = isLens ? 1 : seg(u, ...W.marks);
        }
        nodes[`${pre}doubt${i}`] = {transform: T(c.x - P.slots[i].dir.x * P.R * 0.5, c.y - P.slots[i].dir.y * P.R * 0.5), opacity: r(op, 3)};
      }
      // ghosts (dashed outline of a missing piece)
      for (let i = 0; i < L.n; i++) {
        if (!Cc.ghosts[i]) continue;
        let op;
        if (i === k) op = clamp(lerp(L.statusB === 'pending' ? 1 : 0, L.statusA === 'pending' ? 1 : 0, seg(vk, 0.5, 1)));
        else op = isLens ? 1 : seg(u, ...W.marks);
        if (i === k && L.statusB === 'pending' && vk > 0) op = 1 - seg(vk, 0.6, 1);
        nodes[`${pre}ghost${i}`] = {opacity: r(op, 3)};
      }
      // mesh contacts on both sides of pocket k
      const present = i => (i === k ? null : L.resB.slots[i].status === 'supplied');
      const kSeated = seatedAt({b: L.statusB, a: L.statusA}, vk <= 0.12 ? 0 : vk >= 0.88 ? 1 : 0.5);
      const engaged = [
        (k === 0 || present(k - 1)) && kSeated,
        (k === L.n - 1 || present(k + 1)) && kSeated,
      ];
      const mkOp = isLens ? 1 : seg(u, ...W.marks);
      engaged.forEach((e, j) => {
        nodes[`${pre}mk${j}`] = {opacity: r(mkOp, 3)};
        nodes[`${pre}mk${j}-on`] = {opacity: e ? 1 : 0};
        nodes[`${pre}mk${j}-off`] = {opacity: e ? 0 : 1};
      });
      // fact substitution on piece k: old text lifts away, then the new one appears
      if (Cc.ftexts) {
        const out = seg(vk, 0, 0.45), inn = seg(vk, 0.55, 1);
        const up = {x: -dir.x * 14 * out, y: -dir.y * 14 * out};
        nodes[`${pre}ftB`] = {opacity: r(1 - out, 3), transform: T(up.x, up.y)};
        nodes[`${pre}ftA`] = {opacity: r(inn, 3)};
      }
      return {states, engaged};
    };
    const ctxK = copy('', L.C, vC, false);
    const lensK = copy('lz', L.Lz, vL, true);

    // ---- dials: the lens copy keeps the built state; the context follows the dependent state
    const dialB = L.resB.complete ? thB / L.thetaFull : 0;
    let dialK = dialB;
    if (turnA) dialK = depK;
    else if (L.resB.complete && !L.resA.complete) dialK = 1 - depK;
    Object.assign(nodes, L.C.board.dial.frame(dialK, dialK >= 0.99));
    Object.assign(nodes, L.Lz.board.dial.frame(L.resB.complete ? 1 : 0, L.resB.complete));

    // ---- lens and reading glass
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const pL = u < W.close[0] ? open : 1 - close;
    Object.assign(nodes, L.L2.frame(pL, pL));
    const S = L.source, Dst = L.dest, Rr = L.restRect;
    const glideK = ease.inOutCubic(seg(u, ...W.glide));
    const backK = ease.inOutCubic(seg(u, ...W.back));
    let rect, rot;
    const moveRect = (a, b, q) => ({x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), w: lerp(a.w, b.w, q), h: lerp(a.h, b.h, q)});
    if (u < W.open[0]) { rect = moveRect(Rr, S, glideK); rot = lerp(REST_ROT, 0, glideK); }
    else if (u < W.back[0]) { rect = moveRect(S, Dst, pL); rot = 0; }
    else { rect = moveRect(S, Rr, backK); rot = lerp(0, REST_ROT, backK); }
    if (u < W.open[0] && glideK > 0 && glideK < 1 && !reduced) {
      // the glass is lifted a little while it travels (a small arc, never teleports)
      const lift = Math.sin(Math.PI * glideK) * 18;
      rect = {...rect, y: rect.y - lift};
    }
    if (u >= W.back[0] && backK > 0 && backK < 1 && !reduced) rect = {...rect, y: rect.y - Math.sin(Math.PI * backK) * 18};
    Object.assign(nodes, L.glass.frame(rect, {rot, side: L.handleSide}));
    sem.glass = {x: r(rect.x + rect.w / 2), y: r(rect.y + rect.h / 2)};
    const win = moveRect(S, Dst, pL);
    sem.lensWin = {x: r(win.x + win.w / 2), y: r(win.y + win.h / 2)};

    // ---- note, captions, tags, marker
    if (L.cap) nodes['ctx-cap-g'] = {opacity: r(seg(u, ...W.cap), 3)};
    if (L.note) nodes.note = {opacity: r(seg(u, ...W.note) * (1 - seg(u, ...W.noteOut)), 3)};
    if (L.tagB) nodes.tagB = {opacity: r(seg(u, ...W.tagB) * (1 - seg(u, ...W.tagOut)), 3)};
    if (L.tagA) nodes.tagA = {opacity: r(seg(u, ...W.tagIn), 3)};
    const mk = seg(u, ...W.marker);
    nodes['marker-ring'] = {opacity: r(mk, 3)};
    if (L.marker) Object.assign(nodes, L.marker.frame(mk));
    if (L.ann) {
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.4 * seg(u, ...W.strike)), 3)};
      const total = L.ann.segs.reduce((a, s) => a + s.len, 0);
      let done = seg(u, ...W.strike) * total;
      L.ann.segs.forEach((s, i) => {
        const q = clamp(done / s.len);
        done -= s.len;
        nodes[`ann-strike${i}`] = {'stroke-dashoffset': r(s.len * (1 - q))};
      });
      nodes['ann-arrow'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
    }

    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const ctxDatum = vC <= 0 ? 'before' : vC >= 1 ? 'after' : 'changing';
    Object.assign(sem, {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      focusTarget: L.target,
      focusPiece: k + 1,
      statusBefore: L.statusB,
      statusAfter: L.statusA,
      lensOpen: r(pL, 3),
      contextDim: r(pL, 3),
      lensZoom: r(L.zoom, 3),
      datum,
      contextDatum: ctxDatum,
      contextStatus: ctxK.states[k],
      lensStatus: lensK.states[k],
      contextPieces: ctxK.states,
      lensPieces: lensK.states,
      contextMesh: ctxK.engaged,
      lensMesh: lensK.engaged,
      contextFact: L.target === 'fact' ? (vC >= 0.5 ? 'after' : 'before') : null,
      lensFact: L.target === 'fact' ? (vL >= 0.5 ? 'after' : 'before') : null,
      sourceContains: L.sourceContains,
      sourceRect: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
      destRect: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
      sameAspect: Math.abs(L.dest.w / L.source.w - L.dest.h / L.source.h) < 1e-6,
      destClear: !hit(L.dest, L.source, 0),
      dial: r(dialK, 3),
      dialLamp: dialK >= 0.99,
      completeBefore: L.resB.complete,
      completeAfter: L.resA.complete,
      thetaBuild: r(thB),
      thetaAfter: r(thA),
      markerShown: mk >= 1,
      markerClean: L.markerClean,
      noteShown: Boolean(L.note) && seg(u, ...W.note) * (1 - seg(u, ...W.noteOut)) > 0,
      tag: seg(u, ...W.tagIn) > 0 ? 'after' : seg(u, ...W.tagB) > 0 && seg(u, ...W.tagOut) < 1 ? 'before' : null,
      glassAtRest: u < W.glide[0] || backK >= 1,
      handleSide: L.handleSide,
      arrangement: L.arr,
      gearR: r(P.R),
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
    slug: 'reasoning-05-inspect',
    title: 'Cumulative conditions — a reading glass lifts one pocket of the gear board and one datum is replaced',
    titleEs: 'Condiciones acumulativas — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones acumulativas',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Inspection mat with the rule board after its test turn. A reading glass glides over one pocket and lifts a real enlarged copy of it (piece, both mesh contacts, fact panel, condition plate); inside the lens one supplied datum is replaced — the piece status (supplied → pending: it slides out and both contacts split; or disputed; or the reverse) or the fact printed on it — with a struck-through before → after note. The lens closes, the context takes the same change, the joint dial follows and a changed-datum marker rings the pocket. Nothing is decided.',
    tags: ['reasoning', 'cumulative conditions', 'inspect', 'lens', 'magnifier', 'reading glass', 'gears', 'pending', 'disputed', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-acumulativas.js', 'src/frameworks/lens.js', 'src/animations/causation/kits/place.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CA_STRINGS,
  scene,
});
