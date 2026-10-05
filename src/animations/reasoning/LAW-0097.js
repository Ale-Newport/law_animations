/**
 * LAW-0097 — Condiciones acumulativas · story
 *
 * Storyboard (top-down workbench; several contributors around a gear board):
 *  0.00–0.15 rest    The rule board lies on the bench: brass plaque (rule as
 *                    supplied), one brass plate + empty pocket per condition
 *                    along a vertical gear line, a drive gear with a crank at
 *                    the top and the output gear with a quarter dial at the
 *                    bottom. Every fact piece waits WHOLE on the bench: on
 *                    wide boxes beside its own lane (left / right zones); on
 *                    square and tall boxes in a supply tray under the board
 *                    (each piece whole, in its own lane column, staggered in
 *                    placement order; pips = which condition).
 *  0.15–0.60 action  One contributor per piece pushes it by its trailing
 *                    edge (solved hand = push grip beyond the panel, so no
 *                    hand or arm ever lies across printed text) along its
 *                    lane — or up its lane column from the tray — into its
 *                    pocket, lets go and withdraws. Seated gears mesh with
 *                    their neighbours. A pending piece never arrives (the
 *                    pocket stays empty); a disputed piece is brought but
 *                    left unseated, askew, its teeth not meshed.
 *  0.47–0.87         A tester reaches in level from the drive's free side
 *                    (over bare slate), takes the crank knob (hand = knob) and
 *                    turns it half a turn: the gears turn in alternate
 *                    directions up to the first empty/unseated pocket; only
 *                    when every piece is seated does the output turn and the
 *                    dial pointer reach the filled end (cause precedes effect).
 *  0.73–1.00 hold    Seated board held; state tag with the SUPPLIED state
 *                    (all pieces supplied / piece k pending / disputed, not
 *                    resolved here); dashed ghost in an empty pocket; note
 *                    with the author's issue and assumptions; callouts — all
 *                    in the zones the waiting pieces have left.
 * Legal content: fictional rule and facts, jurisdiction unspecified; the
 * board shows the supplied structure only — no finding that a condition is
 * met in law, that the rule applies, or of any outcome.
 * @module animations/reasoning/LAW-0097
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, annotation} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {roundRectPath} from '../../core/geometry.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {placeChip, calloutChip, stateTag, leaderPoly, leaderFrom} from '../causation/kits/place.js';
import {
  CA_STRINGS, caFields, CA_DEFAULTS, resolveSlots, stateLine, planBoard, boardArt, pieceArt, ghostArt,
  trainPose, doubtBadge, noteCard, findSpot, calloutSpot, segHitsBox, dialBounds, headerBlock, legendBlock,
} from './kits/condiciones-acumulativas.js';

const ID = 'LAW-0097';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  captions: [0.02, 0.1], place: [0.15, 0.6], placeLen: 0.2,
  testReach: [0.47, 0.62], turn: [0.62, 0.71], testRelease: [0.71, 0.73], testBack: [0.73, 0.87],
  tag: [0.74, 0.8], marks: [0.74, 0.8], note: [0.78, 0.86], ann: [0.8, 0.9],
  // dial caption that could only sit on a carried piece's path: shown once every arm is back
  dialLate: [0.66, 0.72],
};
// sub-phases of one placement window (fractions of the window)
const Q = {reach: 0.2, carry: 0.74, release: 0.8, withdraw: 0.5};
const ARM = {upper: 300, lower: 285, width: 48, handScale: 1.25};
const REACH = 300 + 285 + 24 * 1.25 * (48 / 46);

const sceneSchema = {
  ...caFields,
  actorLabels: obj('Role captions shown with the hands', {
    a: str('Caption for the contributors bringing the fact pieces (descriptive)', 80),
    b: str('Caption for the hand trying the crank (descriptive)', 80),
  }),
  objectLabels: obj('Labels printed on props', {
    dial: str('Caption printed beside the output dial', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['rule', 'gap', 'dial', 'pieces']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: after a test turn of the crank (motion runs as far as the seated pieces allow), or assembled without a test turn. The supplied piece statuses decide what is seated; nothing is inferred', ['test-turn', 'assembled']),
};

const defaultParams = {
  ...CA_DEFAULTS,
  actorLabels: {a: 'Contributors bring the pieces', b: 'Trying the joint mechanism'},
  objectLabels: {dial: 'Joint dial'},
  actionProgress: 1,
  annotations: [{target: 'dial', text: 'The dial moves only if every piece is seated (as supplied)'}],
  finalState: 'test-turn',
};

const SHAPE = {
  // wide boxes: a vertical gear column in the middle; the pieces wait WHOLE on the bench left
  // and right of their own lanes and are pushed straight in; the side zones take the labels in
  // the hold
  landscape: {axis: 'column', stage: 'lanes', header: 'start', sizes: {fact: 26, cond: 23, header: 32}, maxR: 118, floorK: 0.4, chip: 24, tag: 27},
  // square / tall boxes: the pieces wait WHOLE, side by side or staggered (never on top of each
  // other), in a supply tray under the board and are carried up their lane column; the tray's
  // strip becomes the label strip in the hold. The square design is fitted small (≈0.69 px per
  // unit at 1080×1080), so its texts are larger and the gears give way before any text shrinks.
  square: {axis: 'column', stage: 'pile', header: 'start', sizes: {fact: 30, cond: 29, header: 32}, maxR: 118, floorK: 0.3, maxD: 400, smallSizes: {fact: 26, cond: 23, header: 30}, reserve: 150, chip: 28, tag: 30},
  portrait: {axis: 'column', stage: 'pile', header: 'start', sizes: {fact: 26, cond: 24, header: 32}, maxR: 104, floorK: 0.4, reserve: 330, chip: 23, tag: 27, capBand: true},
};

/** Clearance between a waiting piece and the bench edge / the board. */
const EDGE = 18;
/** Clearance between two pieces waiting in the supply tray. */
const TRAY_GAP = 16;
/** Push grip: palm centre this far outside the piece's trailing edge / from its corner. */
const GRIP = {out: 17, side: 26};

/**
 * Height of the label strip under a portrait board: state tag, issue note and
 * callouts stacked at (almost) full width, never less than the shape's reserve.
 */
function holdStrip(ctx, SH) {
  if (!SH.reserve || SH.axis !== 'column') return SH.reserve ?? 0;
  const p = ctx.params;
  const D = ctx.design;
  let need = 30;
  if (ctx.show('key')) need += SH.tag * 1.75 + 16;
  if (ctx.show('all')) {
    const probe = noteCard(ctx, {name: 'strip-probe', x: 0, y: 0, maxWidth: D.w * 0.9, issues: p.issues, assumptions: p.assumptions, size: SH.chip - 1, maxLines: 3});
    if (probe) need += probe.box.h + 16;
    for (const a of p.annotations) need += chip(ctx, a.text, {x: 0, y: 0, maxWidth: D.w * 0.62, size: SH.chip, maxLines: 2}).box.h + 24;
  }
  return Math.max(SH.reserve, Math.min(D.h * 0.34, need));
}

/** Local bounds of a piece (panel ∪ tab) around its gear centre. */
function pieceExtent(sl) {
  const a = sl.panelLocal, b = sl.tabLocal;
  const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
  return {x: x0, y: y0, w: Math.max(a.x + a.w, b.x + b.w) - x0, h: Math.max(a.y + a.h, b.y + b.h) - y0};
}

/**
 * Supply tray under the board: every piece that will be brought waits WHOLE in (or, where the
 * bench has room, just outward of) its own lane column, in placement order from the board
 * downwards; a piece moves down only as far as it must to clear every piece placed before it
 * (left and right pieces share a row or interleave with their gears staggered), so nothing
 * hides another piece or its gear. A piece's way up to its pocket is clear: whatever lies
 * above it has been carried away before it.
 * @returns {{off:Record<number,number>, dx:Record<number,number>, h:number, top:number}} centre
 *   offsets from the first piece, sideways shifts, tray height, tray top relative to a centre
 */
function trayPlan(P, res, bench, maxH = Infinity, hub = false) {
  const off = {};
  const dxs = {};
  const placed = [];
  let last = 0;
  let bottom = -Infinity;
  const ext = pieceExtent(P.slots[0]);
  const ra = P.G.ra;
  const top = Math.min(ext.y, -ra);
  const one = Math.max(ext.y + ext.h, ra) - top;
  // where the bench has room beside the board, a piece may sit a little outward of its lane so
  // that a left and a right piece share a row (their gears side by side)
  const shift = ra + TRAY_GAP / 2 + 4;
  // hub mode (many pieces): gear tabs may overlap a little, as long as every hub (the pips)
  // stays in view; cards never overlap
  const hubSep = ra + P.R * 0.24 + 4;
  for (const s of res.slots) {
    if (s.status === 'pending') continue;
    const sl = P.slots[s.i];
    let best = null;
    for (const dx of [0, sl.s * shift]) {
      const cx = sl.c.x + dx;
      const e = pieceExtent(sl);
      if (dx && bench && (cx + e.x < bench.x0 || cx + e.x + e.w > bench.x1)) continue;
      // panel, tab and the gear's tooth circle (the teeth reach beyond the tab)
      const boxes = [sl.panelLocal, sl.tabLocal, {x: -ra, y: -ra, w: 2 * ra, h: 2 * ra}].map((q, k) => ({x: cx + q.x, y: q.y, w: q.w, h: q.h, k}));
      let y = last;
      for (const q of placed) {
        for (const A of boxes) {
          for (const B of q.boxes) {
            if (!(A.x < B.x + B.w + TRAY_GAP && B.x < A.x + A.w + TRAY_GAP)) continue;
            if (hub && A.k > 0 && B.k > 0) {
              if (A.k === 2 && B.k === 2) y = Math.max(y, q.y + hubSep);
              continue;
            }
            y = Math.max(y, q.y + B.y + B.h + TRAY_GAP - A.y);
          }
        }
      }
      if (!best || y < best.y - 0.5) best = {y, dx, boxes, i: s.i};
    }
    placed.push(best);
    last = best.y;
    bottom = Math.max(bottom, best.y + one + top);
  }
  let h = placed.length ? bottom - top : 0;
  // last resort (many long pieces on a small box): the tray is squeezed to `maxH`; pieces then
  // overlap like a fanned stack, earlier ones on top
  if (h > maxH && h > one) {
    const k = Math.max(0, (maxH - one) / (h - one));
    // ...but every gear hub (the pips) stays in view: a piece sits at least hubSep below any
    // earlier piece whose gear column it shares
    for (let j = 0; j < placed.length; j++) {
      const q = placed[j];
      q.y *= k;
      for (let i = 0; i < j; i++) {
        const o = placed[i];
        if (Math.abs(q.boxes[2].x - o.boxes[2].x) < 2 * ra) q.y = Math.max(q.y, o.y + hubSep);
      }
    }
    h = Math.max(...placed.map(q => q.y)) + one;
  }
  for (const q of placed) { off[q.i] = q.y; dxs[q.i] = q.dx; }
  // which earlier (upper) pieces lie over each piece at rest
  const coveredBy = {};
  const abs = q => q.boxes.map(B => ({...B, y: q.y + B.y}));
  for (const A of placed) {
    coveredBy[A.i] = placed.filter(B => B.y < A.y && abs(B).some(y => hitBox(abs(A)[0], y, -1))).map(B => B.i);
  }
  return {off, dx: dxs, h, top, coveredBy};
}

/** Role-caption chips of a tray layout (probe), and the band they need above the board. */
function capChip(ctx, SH, text, o = {}) {
  return chip(ctx, text, {x: o.x ?? 0, y: o.y ?? 0, anchor: o.anchor, maxWidth: ctx.design.w * 0.46, size: SH.chip, maxLines: 2, name: o.name, weight: 600});
}
function capBand(ctx, SH) {
  const p = ctx.params;
  if (SH.stage !== 'pile' || !SH.capBand || !ctx.show('all') || SH.noCaptions) return 0;
  const hs = [p.actorLabels.a, p.finalState === 'test-turn' ? p.actorLabels.b : ''].filter(Boolean).map(tx => capChip(ctx, SH, tx).box.h);
  return hs.length ? Math.max(...hs) + 10 : 0;
}

/** Plan the board so that every waiting piece fits WHOLE inside the bench. */
function planStory(ctx, res, SH) {
  const p = ctx.params;
  const D = ctx.design;
  const conds = res.slots.map(s => s.condition);
  const facts = res.slots.map(s => s.fact);
  let opt = {floorK: SH.floorK, strictPanel: SH.stage === 'pile'};
  const plan = box => planBoard(ctx, {n: res.n, axis: SH.axis, box, header: SH.header, ruleName: p.rules.name, conds, facts, sizes: SH.sizes, maxR: SH.maxR ?? 150, maxD: SH.maxD, ...(SH.bare ? {text: false, bare: true, minR: 20} : {}), ...opt});
  let P = null;
  if (SH.stage === 'lanes' && SH.stageSide) {
    // wide legend bench: the pieces wait in two stacks in the side margins (left / right of
    // the board) and are carried, lifted, straight to their pockets; the board takes the
    // full height
    const placingN = res.slots.filter(s => s.status !== 'pending').length;
    const perSide = Math.ceil(placingN / 2);
    let maxR = SH.maxR ?? 150;
    for (let pass = 0; pass < 12; pass++) {
      let m = D.w * 0.15;
      const plan2 = box => planBoard(ctx, {n: res.n, axis: 'row', box, header: SH.header, ruleName: p.rules.name, conds, facts, sizes: SH.sizes, maxR, text: false, bare: true, minR: 20});
      for (let it = 0; it < 14; it++) {
        P = plan2({x: m, y: 20, w: D.w - 2 * m, h: D.h - 40});
        const pw = Math.max(...P.slots.map(sl => pieceExtent(sl).w));
        const nm = pw + 2 * EDGE + 10;
        if (Math.abs(nm - m) < 0.5) { m = nm; break; }
        m = it < 10 ? (m + nm) / 2 : Math.max(m, nm);
      }
      P = plan2({x: m, y: 20, w: D.w - 2 * m, h: D.h - 40});
      P.zone = m;
      P.stageSide = true;
      const stackH = perSide * (Math.max(...P.slots.map(sl => pieceExtent(sl).h)) + 2 * (P.G.ra - P.R * 0.96) + 16);
      if (stackH <= D.h - 2 * EDGE) break;
      maxR = P.R * 0.94;
    }
  } else if (SH.stage === 'lanes') {
    // staging zones beyond both ends of the lanes: one whole piece deep
    const row = SH.axis === 'row';
    const span = row ? D.h : D.w;
    let m = span * 0.26;
    const box = mm => (row ? {x: 20, y: mm, w: D.w - 40, h: D.h - 2 * mm} : {x: mm, y: 20, w: D.w - 2 * mm, h: D.h - 40});
    for (let it = 0; it < 14; it++) {
      P = plan(box(m));
      const depth = Math.max(...P.slots.map(sl => (row ? pieceExtent(sl).h : pieceExtent(sl).w)));
      const nm = depth + 2 * EDGE + 6;
      if (Math.abs(nm - m) < 0.5) { m = nm; break; }
      m = it < 10 ? (m + nm) / 2 : Math.max(m, nm);
    }
    P = plan(box(m));
    P.zone = m;
  } else {
    // supply tray in a strip under the board. Texts keep their full size while the gears stay
    // usable; with long texts the texts shrink (bounded) first; the last resort lets a text
    // fill its card to the edge
    const reserve = holdStrip(ctx, SH);
    const bench = {x0: EDGE, x1: D.w - EDGE};
    // role captions sit in a band along the top bench edge, above the rule plaque: the
    // contributors' caption at the left, the tester's at the right, just above where the
    // tester's arm comes in (level with the drive at the top of the gear column)
    const band = capBand(ctx, SH);
    const top = 20 + band;
    // (the last tries squeeze the tray: with many long pieces on a small box they overlap)
    // tries: [planner options, squeeze the tray, hub-overlap tray]
    const strict = {strictPanel: opt.strictPanel};
    const base = opt;
    // (square boxes: long texts may fall back to the smaller text sizes of a tall box)
    const small = SH.smallSizes ? {...strict, sizes: SH.smallSizes, maxD: 440} : strict;
    const tries = [[base, false, false], [strict, false, false], [base, false, true], [strict, false, true], [small, false, true], [small, true, true], [{sizes: small.sizes, maxD: small.maxD}, true, true]];
    const run = (t, k) => {
      const [o, squeeze, hub] = t;
      opt = o;
      let strip = reserve;
      for (let it = 0; it < 14; it++) {
        P = plan({x: 20, y: top, w: D.w - 40, h: D.h - 20 - top - strip});
        const ext = pieceExtent(P.slots[0]);
        const maxH = squeeze ? Math.max(reserve - 2 * EDGE - 20, Math.max(ext.h, 2 * P.G.ra) * 1.3) : Infinity;
        const ns = Math.max(reserve, trayPlan(P, res, bench, maxH, hub).h + 2 * EDGE + 20);
        if (Math.abs(ns - strip) < 0.5) { strip = ns; break; }
        strip = it < 10 ? (strip + ns) / 2 : Math.max(strip, ns);
      }
      P = plan({x: 20, y: top, w: D.w - 40, h: D.h - 20 - top - strip});
      P.zone = strip;
      P.capBand = band;
      P.trayMaxH = squeeze ? Math.max(0, strip - 2 * EDGE - 20) : Infinity;
      P.trayHub = hub;
      P.planTry = k;
      return P;
    };
    // whole, clear pieces win while the gears keep ~30% of their largest size; next, whole
    // pieces with a text ellipsis (full text kept in the title); last, a squeezed tray
    const usable = Q => Q.fitOk && Q.R >= (SH.maxR ?? 150) * 0.29;
    let fallback = -1;
    let fallbackR = 0;
    let done = false;
    for (let k = 0; k < tries.length && !done; k++) {
      if (tries[k][1] && fallback >= 0) { run(tries[fallback], fallback); done = true; break; }
      const Q = run(tries[k], k);
      if (usable(Q) && !Q.truncated) done = true;
      else if (usable(Q) && (fallback < 0 || Q.R > fallbackR)) { fallback = k; fallbackR = Q.R; }
    }
  }
  return P;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const SH = SHAPE[ctx.view.shape];
    const L = layoutCore(ctx, SH);
    // long texts that the supply tray cannot show whole at a readable size: pictogram pieces
    // and a shared legend (the words are printed once, at ≥ 16 px)
    if (ctx.show('key')) return needsLegend(ctx, L) ? legendLayout(ctx, SH) : L;
    // labels hidden: the same composition as with labels (the picture-only bench without the
    // legend when the labelled version needs one), so hiding the words never re-lays the scene
    const keyed = Object.create(ctx);
    keyed.show = () => true;
    return needsLegend(keyed, layoutCore(keyed, SH)) ? legendLayout(ctx, SH) : L;
  },
  build(ctx, L) {
    if (!L.legendMode) return buildCore(ctx, L);
    const M = L.legendMode;
    return g(null,
      M.plaqueNode,
      M.legend && M.legend.node(),
      g({transform: T(M.area.x, M.area.y)}, buildCore(ctx, L)),
      M.caps.map(c => g({name: `${c.name}-g`, opacity: 0}, c.node)),
      M.note && M.note.node,
    );
  },
  frame(ctx, L, u) {
    const out = frameCore(ctx, L, u);
    const M = L.legendMode;
    if (M) {
      for (const c of M.caps) out.nodes[`${c.name}-g`] = {opacity: r(seg(u, ...W.captions), 3)};
      if (M.note) out.nodes.note = {opacity: r(seg(u, 0.02, 0.1), 3)};
    }
    out.semantic.legendMode = Boolean(M);
    out.semantic.roles = M ? M.caps.length : L.captions.length;
    out.semantic.noteShown = Boolean(M ? M.note : L.note);
    out.semantic.text = textReport(ctx, L);
    // mechanism size in output terms: gear diameter (px at 1080p) and the board's share of the
    // caption-safe box
    const cv = ctx.view.content;
    const fk = Math.min(cv.w / ctx.design.w, cv.h / ctx.design.h);
    const b = L.P.board;
    out.semantic.mechanism = {gearPx: pxScale(ctx).px(2 * L.P.R), boardShare: r((b.w * b.h * fk * fk) / (cv.w * cv.h), 3)};
    return out;
  },
};

/** Output-pixel helpers: design units for px at 1080p and back. */
function pxScale(ctx) {
  const cv = ctx.view.content;
  const D = ctx.design;
  const fitK = Math.min(cv.w / D.w, cv.h / D.h);
  const per = Math.min(ctx.view.width, ctx.view.height) / 1080;
  return {dz: px => (px * per) / fitK, px: size => r((size * fitK) / per, 2)};
}

/** Does the text layout lose meaning or size (→ legend mode)? */
function needsLegend(ctx, L) {
  const {px} = pxScale(ctx);
  const P = L.P;
  if (P.truncated || !P.fitOk) return true;
  if (L.minFact !== null && px(L.minFact) < 16) return true;
  if (L.minCond !== null && px(L.minCond) < 16) return true;
  if (P.trayHub || Number.isFinite(P.trayMaxH ?? Infinity) || !L.trayClear) return true;
  return false;
}

/** Sizes actually printed (px at 1080p) and cut texts, for the semantics. */
function textReport(ctx, L) {
  const {px} = pxScale(ctx);
  const M = L.legendMode;
  const fits = M ? (M.legend ? M.legend.rowsFits() : []) : L.P.slots.flatMap(q => [q.factFit, q.condFit]).filter(Boolean);
  const cut = fits.filter(f => f.truncated).length + (L.P.truncated ? 1 : 0);
  return {content: fits.length ? Math.min(...fits.map(f => px(f.size))) : null, truncated: cut, legend: Boolean(M)};
}

/**
 * Legend mode (long texts on square / tall boxes): the rule plaque on top, a legend with
 * every condition and the fact supplied for it (right column on square boxes, under the
 * bench on tall ones), and the bench scene with pictogram pieces (pips): a horizontal gear
 * line, the pieces waiting whole above and below their own lanes and pushed straight in.
 */
function legendLayout(ctx, SH) {
  const p = ctx.params;
  const D = ctx.design;
  const M = 20;
  const res = resolveSlots(p);
  const {dz} = pxScale(ctx);
  const size = dz(17.5);
  const chipSize = dz(16.5);
  const side = ctx.view.shape !== 'portrait';
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const hdrFor = w => headerBlock(ctx, p.rules.name, w, dz(18), {minSize: dz(17), maxLines: 4, tagSize: dz(15)});
  const capOpts = (w, ml = 3) => ({maxWidth: w, size: chipSize, minSize: chipSize, maxLines: ml, weight: 600});
  const capFor = (text, w, ml) => (showAll && text ? chip(ctx, text, {x: 0, y: 0, ...capOpts(w, ml)}) : null);
  const noteFor = (w, x, y) => (showAll ? noteCard(ctx, {name: 'note', x, y, maxWidth: w, issues: p.issues, assumptions: p.assumptions, size: dz(16.5), maxLines: 6}) : null);
  let legend = null, note = null, lx = D.w + 4;
  if (!showKey) {
    // labels hidden: no legend; the bench takes the whole width
  } else if (side) {
    for (let lw = 460; lw <= D.w * 0.46; lw += 20) {
      legend = legendBlock(ctx, res, {x: D.w - M - lw, w: lw, size, cols: 1, stack: true, title: true});
      note = noteFor(lw, D.w - M - lw, 0);
      if (legend.h + (note ? note.box.h + 14 : 0) <= D.h - 16) break;
    }
    lx = D.w - M - legend.w;
    const y0 = 8 + Math.max(0, (D.h - 16 - legend.h - (note ? note.box.h + 14 : 0)) / 2);
    legend.place(y0);
    if (note) note = noteFor(legend.w, lx, y0 + legend.h + 14);
  } else {
    legend = legendBlock(ctx, res, {x: M, w: D.w - 2 * M, size, cols: 1, stack: false, title: true});
    note = noteFor(D.w - 2 * M, M, 0);
    const nh = note ? note.box.h + 12 : 0;
    legend.place(D.h - 8 - nh - legend.h);
    if (note) note = noteFor(D.w - 2 * M, M, D.h - 8 - note.box.h);
  }
  const aw = side ? lx - 24 : D.w;
  const hdr = hdrFor(aw - 2 * M);
  const plaque = {x: M, y: 8, w: aw - 2 * M, h: hdr.h};
  const floor = side || !legend ? D.h - 8 : D.h - 8 - (note ? note.box.h + 12 : 0) - legend.h - 12;
  const textB = p.finalState === 'test-turn' ? p.actorLabels.b : '';
  // the bench's arms and hands are scaled down with the picture-only mechanism
  const stageSide = aw > 1.6 * (floor - plaque.y - plaque.h);
  const SHL = {...SH, axis: 'row', stage: 'lanes', header: 'none', bare: true, maxR: SH.legendMaxR ?? 110, floorK: undefined, maxD: undefined, noNote: true, noCaptions: true, armW: 36, stageSide};
  const bench = (top, bottom) => {
    const local = Object.create(ctx);
    local.design = {w: aw, h: bottom - top};
    return {L: layoutCore(local, SHL), area: {x: 0, y: top, w: aw, h: bottom - top}};
  };
  const caps = [];
  // 1) role captions inside the bench's side margins, by the edges where the hands come in:
  //    contributors at the top-left, the tester at the bottom-left (next to the drive)
  let B = bench(plaque.y + plaque.h + 10, floor);
  const margin = B.L.P.extents.x - 24;
  const inA = capFor(p.actorLabels.a, margin, 4), inB = capFor(textB, margin, 4);
  const fitsIn = c => !stageSide && (!c || (!c.fit.truncated && margin >= 160));
  if (fitsIn(inA) && fitsIn(inB)) {
    if (inA) caps.push({name: 'cap-a', node: chip(ctx, p.actorLabels.a, {x: 14, y: B.area.y + 14, ...capOpts(margin, 4), name: 'cap-a'}).node});
    if (inB) caps.push({name: 'cap-b', node: chip(ctx, textB, {x: 14, y: B.area.y + B.area.h - 14 - inB.box.h, ...capOpts(margin, 4), name: 'cap-b'}).node});
  } else {
    // 2) otherwise in bands just outside the bench's top and bottom edges
    const capA = capFor(p.actorLabels.a, aw * 0.7);
    const capB = capFor(textB, aw * 0.7);
    const top = plaque.y + plaque.h + 10 + (capA ? capA.box.h + 8 : 0);
    const bottom = floor - (capB ? capB.box.h + 8 : 0);
    B = bench(top, bottom);
    if (capA) caps.push({name: 'cap-a', node: chip(ctx, p.actorLabels.a, {x: M, y: top - 8 - capA.box.h, ...capOpts(aw * 0.7), name: 'cap-a'}).node});
    if (capB) caps.push({name: 'cap-b', node: chip(ctx, textB, {x: M, y: bottom + 8, ...capOpts(aw * 0.7), name: 'cap-b'}).node});
  }
  const L = B.L;
  L.legendMode = {legend, area: B.area, plaque, note, caps, plaqueNode: plaqueArt(ctx, plaque, hdr)};
  return L;
}

/** The rule plaque (brass, same look as the board header), drawn above the bench. */
function plaqueArt(ctx, q, hdr) {
  const f = hdr.fit, tg = hdr.tag;
  const parts = [
    h('path', {d: roundRectPath(q.x + 5, q.y + 8, q.w, q.h, 16), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 16), fill: '#dcbb6e', stroke: '#a17f36', 'stroke-width': 3}),
    h('path', {d: roundRectPath(q.x + 7, q.y + 7, q.w - 14, q.h - 14, 11), fill: 'none', stroke: '#ecd7a2', 'stroke-width': 1.5}),
  ];
  const gap = tg ? 12 + tg.size * 0.35 : 0;
  const total = (f ? f.height : 0) + (tg ? tg.height + gap : 0);
  let y = q.y + (q.h - total) / 2;
  const cx = q.x + q.w / 2;
  if (tg) { parts.push(textBlock(tg, {x: cx, y, anchor: 'middle', fill: '#5c4712', letterSpacing: 0.6})); y += tg.height + gap; }
  if (f) parts.push(textBlock(f, {x: cx, y, anchor: 'middle', fill: ctx.theme.ink}));
  return g({name: 'plaque'}, parts);
}

function layoutCore(ctx, SH) {
  {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    // picture-only boards (legend layout): arms scaled to the smaller mechanism; the forearm
    // grows by what the smaller hand loses, so every reach stays the same
    const armW = SH.armW ?? ARM.width;
    const handFix = 24 * ARM.handScale * ((ARM.width - armW) / 46);
    const res = resolveSlots(p);
    const P = planStory(ctx, res, SH);
    const row = P.row;
    const R = P.R;

    const desk = deskWindow(ctx, {prefix: 'bench', x: 0, y: 0, w: D.w, h: D.h, radius: 28});
    const crankAngle = row ? 90 : 0;
    const turnDir = row ? 1 : -1;
    const board = boardArt(ctx, P, {prefix: 'bd', crankAngle, turnDir});

    // --- pieces, staging and contributor arms
    // Every waiting piece is WHOLE inside the bench: wide layouts park it in the zone beyond its
    // own lane; square and tall layouts lay the pieces out in a supply tray under the board. A
    // contributor pushes the piece by its trailing edge (row: the outer corner on the plate's
    // badge side; column: the middle of the outer edge), so neither hand nor arm ever lies
    // across printed text.
    const pieces = [];
    const arms = [];
    let placing = res.slots.filter(s => s.status !== 'pending').map(s => s.i);
    // side stacks (wide legend bench): left-hand pieces are brought from the left stack,
    // right-hand ones from the right; each stack sends the piece bound for the pocket nearest
    // the centre first, so a carried piece never passes over a piece already seated
    const sideStart = {};
    if (P.stageSide) {
      const mid = P.extents.x + P.extents.w / 2;
      const left = placing.filter(i => P.slots[i].c.x < mid).sort((a, b) => P.slots[b].c.x - P.slots[a].c.x);
      const right = placing.filter(i => P.slots[i].c.x >= mid).sort((a, b) => P.slots[a].c.x - P.slots[b].c.x);
      while (left.length > right.length + 1) right.unshift(left.pop());
      while (right.length > left.length + 1) left.unshift(right.pop());
      placing = [];
      for (let j = 0; j < Math.max(left.length, right.length); j++) { if (left[j] !== undefined) placing.push(left[j]); if (right[j] !== undefined) placing.push(right[j]); }
      // whole footprint of a piece: panel, tab and the gear's tooth circle
      const ra = P.G.ra;
      const full = i => { const e = pieceExtent(P.slots[i]); const x0 = Math.min(e.x, -ra), y0 = Math.min(e.y, -ra); return {x: x0, y: y0, w: Math.max(e.x + e.w, ra) - x0, h: Math.max(e.y + e.h, ra) - y0}; };
      const stack = (list, xc) => {
        const hs = list.map(i => full(i).h);
        let y = (D.h - (hs.reduce((a, b) => a + b, 0) + 16 * (list.length - 1))) / 2;
        list.forEach((i, j) => { const e = full(i); sideStart[i] = {x: xc - (e.x + e.w / 2), y: y - e.y}; y += hs[j] + 16; });
      };
      stack(left, P.zone / 2);
      stack(right, D.w - P.zone / 2);
    }
    const m = placing.length;
    const step = m > 1 ? (W.place[1] - W.placeLen - W.place[0]) / (m - 1) : 0;
    const tray = SH.stage === 'pile' ? trayPlan(P, res, {x0: EDGE, x1: D.w - EDGE}, P.trayMaxH, P.trayHub) : null;
    const boardBottom = Math.max(P.board.y + P.board.h, dialBounds(P, board.dial, 0).y + dialBounds(P, board.dial, 0).h);
    const pileTop = SH.stage !== 'pile' ? 0 : Math.max(boardBottom + EDGE, D.h - P.zone + EDGE);
    for (const s of res.slots) {
      const sl = P.slots[s.i];
      const pc = pieceArt(ctx, P, s.i, {name: `pc${s.i}`});
      const dir = sl.dir;
      const ext = pieceExtent(sl);
      let start;
      if (SH.stage === 'pile') start = {x: sl.c.x + (tray.dx[s.i] ?? 0), y: pileTop - tray.top + (tray.off[s.i] ?? 0)};
      else if (sideStart[s.i]) start = sideStart[s.i];
      else if (row) start = {x: sl.c.x, y: sl.s < 0 ? EDGE - ext.y : D.h - EDGE - (ext.y + ext.h)};
      else start = {x: sl.s < 0 ? EDGE - ext.x : D.w - EDGE - (ext.x + ext.w), y: sl.c.y};
      const travel = Math.hypot(start.x - sl.c.x, start.y - sl.c.y);
      const k = placing.indexOf(s.i);
      const win = k >= 0 ? [W.place[0] + k * step, W.place[0] + k * step + W.placeLen] : null;
      pieces.push({i: s.i, status: s.status, pc, sl, start, seat: sl.c, travel, win, dir, ext});
      if (k >= 0) {
        const look = actorLook(ctx, null, s.i + 1);
        const pl = sl.panelLocal;
        const gripLocal = row
          ? {x: pl.x + GRIP.side, y: sl.s < 0 ? pl.y - GRIP.out : pl.y + pl.h + GRIP.out}
          : {x: sl.s < 0 ? pl.x - GRIP.out : pl.x + pl.w + GRIP.out, y: pl.y + pl.h * 0.5};
        const startGrip = {x: start.x + gripLocal.x, y: start.y + gripLocal.y};
        const seatGrip = {x: sl.c.x + gripLocal.x, y: sl.c.y + gripLocal.y};
        // the contributor stands beyond the bench edge on the piece's side; in the column layout
        // they walk along the bench side with the piece (shoulder follows the hand)
        const edgeD = q => (row ? (sl.s < 0 ? q.y : D.h - q.y) : (sl.s < 0 ? q.x : D.w - q.x));
        const far = Math.max(edgeD(seatGrip), P.stageSide ? edgeD(startGrip) : 0);
        // a deep seat (wide bench) gets a longer reach, so the shoulder stays beyond the bench edge
        const aK = Math.max(1, (far + 70) / (REACH * 0.93));
        const arm = topArm(ctx, {name: `arm${s.i}`, skin: look.skin, sleeve: look.outfit, handed: sl.s < 0 ? 'left' : 'right', ...ARM, width: armW, upper: ARM.upper * aK, lower: ARM.lower * aK + 24 * ARM.handScale * (ARM.width / 46) * (aK - 1) + handFix});
        // the contributor leans along the lane: the shoulder stays on the lane line, just short of
        // full reach behind the hand, so the arm lies straight behind the piece's trailing edge
        const lean = arm.reach * 0.99;
        const shoulderAt = hand => ({x: hand.x + dir.x * lean, y: hand.y + dir.y * lean});
        const rest = row ? {x: startGrip.x, y: sl.s < 0 ? -80 : D.h + 80} : {x: sl.s < 0 ? -80 : D.w + 80, y: startGrip.y};
        // arm corridor (bench edge → deepest grip), kept clear of labels visible during the action
        const corridor = P.stageSide
          ? {x: Math.min(startGrip.x, seatGrip.x) - 60, y: sl.s < 0 ? 0 : Math.min(startGrip.y, seatGrip.y) - 40, w: Math.abs(startGrip.x - seatGrip.x) + 120, h: sl.s < 0 ? Math.max(startGrip.y, seatGrip.y) + 40 : D.h - Math.min(startGrip.y, seatGrip.y) + 40}
          : row
          ? {x: startGrip.x - 60, y: sl.s < 0 ? 0 : seatGrip.y - 40, w: 110, h: sl.s < 0 ? seatGrip.y + 40 : D.h - seatGrip.y + 40}
          : {x: sl.s < 0 ? 0 : seatGrip.x - 40, y: Math.min(startGrip.y, seatGrip.y) - 50, w: sl.s < 0 ? seatGrip.x + 40 : D.w - seatGrip.x + 40, h: Math.abs(startGrip.y - seatGrip.y) + 100};
        arms.push({i: s.i, arm, gripLocal, shoulderAt, rest, dir, corridor});
      }
    }

    // --- tester arm on the drive crank: a level reach from the drive's free side (the bench
    // edge beyond it), over bare slate only; the arm is long enough to reach the crank without
    // the shoulder ever entering the bench
    const tLook = actorLook(ctx, null, 0);
    const tf = P.drive.free;
    const dc = P.drive.c;
    const tEdge = row ? D.h + 60 : D.w + 60;
    const tShoulder = row ? {x: dc.x + R * 0.2, y: tEdge + 40} : {x: tEdge + 40, y: dc.y + R * 0.2};
    const tRest = row ? {x: dc.x + R * 0.2, y: tEdge - 20} : {x: tEdge - 20, y: dc.y + R * 0.2};
    const tFar = Math.hypot(tShoulder.x - dc.x, tShoulder.y - dc.y) + R * 0.66;
    const tK = Math.max(1, (tFar * 1.03) / REACH);
    const tester = p.finalState === 'test-turn' ? topArm(ctx, {name: 'tester', skin: tLook.skin, sleeve: tLook.outfit, handed: 'right', ...ARM, width: armW, upper: ARM.upper * tK, lower: ARM.lower * tK + 24 * ARM.handScale * (ARM.width / 46) * (tK - 1) + handFix}) : null;
    const knobAt = th0 => {
      const a = (crankAngle + P.phases[0].phase + th0) * Math.PI / 180;
      return {x: dc.x + P.drive.knobR * Math.cos(a), y: dc.y + P.drive.knobR * Math.sin(a)};
    };

    // --- markers for the final hold
    const ghosts = res.slots.filter(s => s.status === 'pending').map(s => ghostArt(ctx, P, s.i, `ghost${s.i}`));
    const markChips = [];
    for (const s of res.slots) {
      if (s.status !== 'pending' || !ctx.show('key')) continue;
      const sl = P.slots[s.i];
      const pa = sl.panelAbs;
      const text = s.status === 'pending' ? t.pending : `${t.disputed} · ${t.notSeated}`;
      const c = chip(ctx, text, {x: pa.x + pa.w / 2, y: pa.y + pa.h / 2 - 20, anchor: 'middle', maxWidth: Math.min(pa.w - 16, 360), size: 24, maxLines: 1, fill: '#ffffff', stroke: s.status === 'pending' ? th.inkSoft : th.accent3, name: `mark${s.i}`, weight: 700});
      markChips.push({i: s.i, node: g({name: `markg${s.i}`, opacity: 0}, c.node), box: c.box});
    }
    // disputed pieces rest askew, part-way; the "?" badge rides on the piece
    const badges = res.slots.filter(s => s.status === 'disputed').map(s => ({i: s.i, node: doubtBadge(ctx, {name: `doubt${s.i}`, x: 0, y: 0, rad: Math.max(20, R * 0.26)})}));

    // --- hold labels. Chips stay off the board (never over its slate, plates or
    // pieces); leaders may cross bare slate and gears but never any text.
    const finalPiece = pc => {
      const q = pc.sl;
      const at = pc.status === 'disputed' ? disputedPose(pc).c : pc.seat;
      return [q.panelLocal, q.tabLocal].map(b => ({x: at.x + b.x, y: at.y + b.y, w: b.w, h: b.h}));
    };
    const finals = pieces.filter(pc => pc.status !== 'pending').flatMap(finalPiece);
    const dialB = dialBox(P, board.dial);
    const headerRect = P.header ? P.header.rect : null;
    const offBoard = [P.board, headerRect, dialB, ...finals].filter(Boolean);
    const c0 = P.cells[0].c, c1 = P.cells[P.n + 1].c;
    const gearLine = {x: Math.min(c0.x, c1.x) - P.G.ra, y: Math.min(c0.y, c1.y) - P.G.ra, w: Math.abs(c1.x - c0.x) + 2 * P.G.ra, h: Math.abs(c1.y - c0.y) + 2 * P.G.ra};
    const textBoxes = [...P.slots.map(s => s.plate), headerRect, ...pieces.filter(pc => pc.status !== 'pending').map(pc => finalPiece(pc)[0]), ...markChips.map(mc => mc.box)].filter(Boolean);
    // (tray layouts: the top band belongs to the role captions)
    const bounds = {x: 14, y: 14 + (P.capBand || 0), w: D.w - 28, h: D.h - 28 - (P.capBand || 0)};
    const placed = [];
    const leads = [];
    const stagedBoxes = pieces.filter(pc => pc.status !== 'pending').flatMap(pc => {
      const q = pc.sl; return [q.panelLocal, q.tabLocal].map(b => ({x: pc.start.x + b.x, y: pc.start.y + b.y, w: b.w, h: b.h}));
    });
    // everything that moves during the action: waiting pieces and the arm corridors
    const tCorr = tester ? (row ? {x: dc.x - R * 0.5, y: dc.y, w: R * 1.6, h: D.h - dc.y} : {x: dc.x, y: dc.y - R * 0.4, w: D.w - dc.x, h: R * 1.5}) : null;
    // the swept path of each carried piece (start → seat)
    const sweeps = pieces.filter(pc => pc.win).map(pc => {
      const e = pc.ext;
      const x0 = Math.min(pc.start.x, pc.seat.x) + e.x, y0 = Math.min(pc.start.y, pc.seat.y) + e.y;
      return {x: x0, y: y0, w: Math.abs(pc.start.x - pc.seat.x) + e.w, h: Math.abs(pc.start.y - pc.seat.y) + e.h};
    });
    const actionBoxes = [...stagedBoxes, ...sweeps, ...arms.map(x => x.corridor), tCorr].filter(Boolean);

    // editorial callouts (final hold)
    // candidate anchor points per target, best first (leaders end on an edge or on bare
    // metal / slate, never inside printed text)
    const annTargets = {
      rule: (() => {
        const q = P.header ? P.header.rect : P.slots[0].plate;
        // edge midpoints, then corners (a leader can come up along the board's edge to a corner)
        const k3 = 3;
        return P.header && P.header.mode === 'start'
          ? [{x: q.x + q.w / 2, y: q.y + q.h, r: 3}, {x: q.x + q.w / 2, y: q.y, r: 3}, {x: q.x, y: q.y + q.h / 2, r: 3}, {x: q.x - k3, y: q.y + q.h + k3, r: 0}, {x: q.x - k3, y: q.y - k3, r: 0}]
          : [{x: q.x, y: q.y + q.h / 2, r: 3}, {x: q.x + q.w, y: q.y + q.h / 2, r: 3}, {x: q.x + q.w + k3, y: q.y + q.h + k3, r: 0}, {x: q.x - k3, y: q.y + q.h + k3, r: 0}, {x: q.x + q.w / 2, y: q.y, r: 3}];
      })(),
      gap: (() => {
        // the condition whose piece is missing / not seated: its pocket peg (or the unseated
        // piece's gear), else the outer edge of its plate
        const b = res.breakAt >= 0 ? P.slots[res.breakAt] : P.slots[P.n - 1];
        const pc = pieces[b.i];
        const at = pc && pc.status === 'disputed' ? disputedPose(pc).c : b.c;
        const q = b.plate;
        const edge = row ? {x: q.x + q.w / 2, y: b.s < 0 ? q.y : q.y + q.h, r: 3} : {x: b.s < 0 ? q.x : q.x + q.w, y: q.y + q.h / 2, r: 3};
        return [{x: at.x, y: at.y, r: P.R * 0.36}, edge];
      })(),
      dial: [{...board.dial.tip(0.5), r: 6}],
      pieces: (() => { const q = P.slots[0].panelAbs; return [{x: q.x + q.w * 0.8, y: q.y + q.h / 2, r: 4}, {x: P.slots[0].c.x, y: P.slots[0].c.y, r: P.R * 0.36}]; })(),
    };
    const annModes = [];
    const notes = ctx.show('all') ? p.annotations.map((a, i) => {
      const tgs = annTargets[a.target];
      const mw = Math.min(520, D.w * 0.4);
      // compact first; a long single/double line fits the thin margins beside a wide board
      // (never an ellipsis: sizes that would cut the text are dropped; the roomiest one stays)
      const all = [[mw, 2], [mw * 0.72, 3], [mw * 0.55, 4], [Math.min(D.w * 0.62, 1000), 1], [D.w - 60, 2], [mw, 4], [mw * 0.72, 6]]
        .map(([wd, ml]) => { const c = chip(ctx, a.text, {x: 0, y: 0, maxWidth: wd, size: SH.chip, maxLines: ml}); return {wd, ml, box: c.box, cut: c.fit.truncated}; });
      const whole = all.filter(z => !z.cut);
      const sizes = whole.length ? whole : [all[all.length - 1]];
      let at = null, k = 0, mode = 'leastBad';
      for (const tg of tgs) {
        mode = 'near';
        for (k = 0; k < sizes.length && !at; k++) {
          at = placeChip(sizes[k].box, tg, {obstacles: [...offBoard, ...placed, ...leads], own: [P.board, dialB, ...finals], bounds, gaps: [30, 60, 100, 150, 210, 280, 360]});
          // the leader may cross bare slate and pieces, never their printed text
          if (at && textBoxes.some(q => segHitsBox(leaderFrom(at.box, at.end), at.end, q, -2) && !(q.x <= at.end.x && at.end.x <= q.x + q.w && q.y <= at.end.y && at.end.y <= q.y + q.h))) at = null;
        }
        if (at) break;
        // grid search: chip off the board, leader clear of every text
        mode = 'grid';
        for (k = 0; k < sizes.length && !at; k++) at = calloutSpot(sizes[k].box, tg, {block: [...offBoard, ...placed, ...leads.map(boxOfPoly)], text: [...textBoxes, ...placed], bounds, prefer: tg, gap: tg.r ?? 0});
        if (at) break;
      }
      k = Math.max(0, k - 1);
      if (!at) { k = Math.min(1, sizes.length - 1); mode = 'leastBad'; at = placeChip(sizes[k].box, tgs[0], {obstacles: [...offBoard, ...placed], bounds, leastBad: true}); }
      annModes.push(mode);
      const c = calloutChip(ctx, {name: `ann${i}`, text: a.text, chipAt: {x: at.x, y: at.y}, target: at.end, maxWidth: sizes[k].wd, maxLines: sizes[k].ml, size: SH.chip});
      placed.push(c.box);
      leads.push(leaderPoly(c.box, at.end));
      return c;
    }) : [];

    // state tag: off the board, near the dial's filled end
    let tag = null;
    if (ctx.show('key')) {
      const text = stateLine(t, res);
      const mw = Math.min(D.w - 40, 760);
      const probe = stateTag(ctx, text, {x: 0, y: 0, size: SH.tag, maxWidth: mw});
      const pe = board.dial.end;
      const spot = findSpot({w: probe.box.w, h: probe.box.h}, {x: pe.x, y: pe.y}, [...offBoard, ...placed, ...leads.map(boxOfPoly)], bounds, {pad: 10, step: 8})
        || findSpot({w: probe.box.w, h: probe.box.h}, {x: pe.x, y: pe.y}, [...P.slots.map(s => s.plate), headerRect, dialB, ...finals, ...placed, ...leads.map(boxOfPoly)].filter(Boolean), bounds, {pad: 6, step: 8})
        || {x: (D.w - probe.box.w) / 2, y: D.h - 20 - probe.box.h};
      tag = stateTag(ctx, text, {x: spot.x, y: spot.y, size: SH.tag, maxWidth: mw, name: 'state-tag', color: res.complete ? th.accent2 : th.inkSoft, opacity: 0});
      placed.push(tag.box);
    }

    // dial caption (object label), close to the dial's open end; visible from the start
    // It keeps clear of the waiting pieces, the arms AND the paths the carried pieces sweep (a
    // piece never passes under it); when that leaves no spot near the dial, it is placed near
    // the dial and shown only once every piece has been brought.
    let dialCap = null;
    let dialLate = false;
    if (ctx.show('all') && p.objectLabels.dial) {
      const probe = chip(ctx, p.objectLabels.dial, {x: 0, y: 0, maxWidth: 300, size: SH.chip - 2, maxLines: 1});
      const size = {w: probe.box.w, h: probe.box.h};
      const ds = board.dial.start;
      const dist = q => Math.hypot(q.x + q.w / 2 - ds.x, q.y + q.h / 2 - ds.y);
      const base = [...P.slots.map(s => s.plate), headerRect, ...finals, ...placed, ...leads.map(boxOfPoly)].filter(Boolean);
      const obs = [...base, ...stagedBoxes, ...sweeps, ...arms.map(x => x.corridor), tCorr].filter(Boolean);
      let spot = findSpot(size, ds, [...obs, dialB], bounds, {pad: 6, step: 8}) || findSpot(size, ds, obs, bounds, {pad: 6, step: 8});
      if (!spot || dist(spot) > Math.max(P.R * 2.4, 170)) {
        const late = [...base, tCorr].filter(Boolean);
        const s2 = findSpot(size, ds, [...late, dialB], bounds, {pad: 6, step: 8}) || findSpot(size, ds, late, bounds, {pad: 6, step: 8});
        if (s2 && (!spot || dist(s2) < dist(spot))) { spot = s2; dialLate = true; }
      }
      if (spot) {
        dialCap = chip(ctx, p.objectLabels.dial, {x: spot.x, y: spot.y, maxWidth: 300, size: SH.chip - 2, maxLines: 1, fill: '#eef1f3', stroke: '#6c7985', name: 'dial-cap', weight: 600});
        placed.push(dialCap.box);
      }
    }

    // note with the author's issue / assumptions (final hold, free space off the board)
    let note = null;
    const sideZone = SH.stage === 'lanes' && !row ? Math.min(460, P.zone - 44) : 0;
    const noteSizes = sideZone ? [[sideZone, 4], [sideZone, 6]] : [[row ? Math.min(440, D.w * 0.28) : D.w * 0.9, 3], [row ? 360 : D.w * 0.7, 5]];
    for (const [mw0, ml] of SH.noNote ? [] : noteSizes) {
      const probe = noteCard(ctx, {name: 'note-probe', x: 0, y: 0, maxWidth: mw0, issues: p.issues, assumptions: p.assumptions, size: SH.chip - 1, maxLines: ml});
      if (!probe) break;
      const pref = sideZone ? {x: 30, y: D.h * 0.72} : row ? {x: 40, y: 40} : {x: 40, y: D.h - 20};
      const spot = findSpot({w: probe.box.w, h: probe.box.h}, pref, [...offBoard, ...placed, ...leads.map(boxOfPoly)], bounds, {pad: 10, step: 8});
      if (spot) {
        note = noteCard(ctx, {name: 'note', x: spot.x, y: spot.y, maxWidth: mw0, issues: p.issues, assumptions: p.assumptions, size: SH.chip - 1, maxLines: ml});
        placed.push(note.box);
        break;
      }
    }

    // role captions: contributors near the first lane, tester near its lane; visible from
    // the start, so they also keep clear of the staged pieces
    const captions = [];
    if (ctx.show('all') && !SH.noCaptions && P.capBand) {
      const y = 14;
      if (p.actorLabels.a) { const c = capChip(ctx, SH, p.actorLabels.a, {x: 18, y, name: 'cap-a'}); placed.push(c.box); captions.push({name: 'cap-a', node: c.node, box: c.box}); }
      if (tester && p.actorLabels.b) { const c = capChip(ctx, SH, p.actorLabels.b, {x: D.w - 18, y, anchor: 'end', name: 'cap-b'}); placed.push(c.box); captions.push({name: 'cap-b', node: c.node, box: c.box}); }
    } else if (ctx.show('all') && !SH.noCaptions) {
      const cap = (text, pref, name) => {
        if (!text) return;
        // near the actor's lane first (off the board, then on bare slate), else anywhere off the board
        const near = Math.max(D.w, D.h) * 0.3;
        const wide = Math.min(420, D.w * 0.44), narrow = Math.min(300, D.w * 0.34);
        // (tray layouts also try a slim 3-line chip in the bench margin beside the board)
        const slim = SH.stage === 'pile' ? [[Math.min(190, D.w * 0.2), true, near, 3], [Math.min(190, D.w * 0.2), false, near, 3]] : [];
        for (const [mw, strict, lim, ml = 2] of [[wide, true, near], [narrow, true, near], [wide, false, near], [narrow, false, near], ...slim, [wide, true, Infinity], [wide, false, Infinity]]) {
          const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: SH.chip, maxLines: ml});
          if (probe.fit.truncated && mw !== wide) continue;
          const obs = [...(strict ? offBoard : [...P.slots.map(s => s.plate), headerRect, ...finals, dialB, gearLine]), ...placed, ...leads.map(boxOfPoly), ...actionBoxes].filter(Boolean);
          // (tray layouts: a finer search finds the narrow strip of bare slate beside the drive)
          const spot = findSpot({w: probe.box.w, h: probe.box.h}, pref, obs, bounds, {pad: 8, step: SH.stage === 'pile' ? 4 : 8});
          if (!spot || Math.hypot(spot.x + spot.w / 2 - pref.x, spot.y + spot.h / 2 - pref.y) > lim) continue;
          const c = chip(ctx, text, {x: spot.x, y: spot.y, maxWidth: mw, size: SH.chip, maxLines: ml, name, weight: 600});
          placed.push(c.box);
          captions.push({name, node: c.node});
          return;
        }
      };
      const first = pieces.find(pc => pc.win);
      // (tray layouts: near where the first contributor's arm comes in, beside the first lane)
      const capY = !first ? 0 : SH.stage === 'pile' ? Math.min(first.start.y, first.seat.y + P.R * 2) - P.R * 2 : first.start.y - P.R * 2;
      if (first) cap(p.actorLabels.a, row ? {x: first.start.x - P.R * 2, y: first.sl.s < 0 ? 30 : D.h - 30} : {x: first.sl.s < 0 ? 30 : D.w - 30, y: capY}, 'cap-a');
      if (tester) cap(p.actorLabels.b, row ? {x: dc.x - P.R * 1.6, y: D.h - 30} : {x: D.w - 30, y: dc.y - P.R * 1.6}, 'cap-b');
    }

    // checks for the semantics: no waiting piece (panel, tab or gear) overlaps another, and the
    // dial caption, when shown during the action, lies on no carried piece's path
    const ra = P.G.ra;
    const restBoxes = pieces.filter(pc => pc.status !== 'pending').map(pc => [pc.sl.panelLocal, pc.sl.tabLocal, {x: -ra, y: -ra, w: 2 * ra, h: 2 * ra}].map(b => ({x: pc.start.x + b.x, y: pc.start.y + b.y, w: b.w, h: b.h})));
    const clearOf = k => restBoxes.every((A, i) => restBoxes.every((B, j) => j <= i || !A.slice(k).some(a => B.slice(k).some(b => hitBox(a, b, -1)))));
    const trayClear = clearOf(0);
    // gears and tabs (the pips) of the waiting pieces never overlap, even in a fanned tray
    const gearsClear = clearOf(1);
    const dialCapOnPath = Boolean(dialCap && !dialLate && sweeps.some(q => hitBox(dialCap.box, q)));
    // smallest text size actually printed on a fact piece / condition plate (null: none shown)
    const minSize = fits => { const z = fits.filter(Boolean).map(f => f.size); return z.length ? r(Math.min(...z), 2) : null; };
    const minFact = minSize(P.slots.map(q => q.factFit));
    const minCond = minSize(P.slots.map(q => q.condFit));
    return {stage: SH.stage, tray, minFact, minCond, trayClear, gearsClear, dialCapOnPath, P, res, desk, board, pieces, arms, tester, tShoulder, tRest, tf, knobAt, crankAngle, turnDir, ghosts, markChips, badges, tag, dialCap, dialLate, captions, note, notes, row, annModes};
  }
}

function buildCore(ctx, L) {
  {
    return g(null,
      L.desk.surface,
      g({'clip-path': L.desk.clip},
        L.board.node,
        L.ghosts,
        // later pieces first: a piece being carried passes above the ones still waiting
        L.pieces.filter(pc => pc.status !== 'pending').slice().reverse().map(pc => pc.pc.node),
        L.badges.map(b => b.node),
        L.arms.map(a => [a.arm.arm, a.arm.palm, a.arm.thumb]),
        L.tester ? [L.tester.arm, L.tester.palm, L.tester.thumb] : null,
      ),
      L.desk.frame,
      L.markChips.map(mc => mc.node),
      L.captions.map(c => g({name: `${c.name}-g`, opacity: 0}, c.node)),
      L.dialCap && g({name: 'dial-cap-g', opacity: 0}, L.dialCap.node),
      L.tag && L.tag.node,
      L.note && L.note.node,
      L.notes.map(nn => nn.node),
    );
  }
}

function frameCore(ctx, L, u) {
  {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const P = L.P;
    const capU = p.actionProgress >= 1 ? 1 : lerp(BEATS.action[0], W.testBack[1], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const sem = {pieces: [], allReached: true, reach: {}};

    // --- pieces and contributor arms
    for (const pc of L.pieces) {
      if (pc.status === 'pending') {
        sem.pieces.push('absent');
        continue;
      }
      const q = seg(a, pc.win[0], pc.win[1]);
      const kc = ease.inOutCubic(clamp((q - Q.reach) / (Q.carry - Q.reach)));
      const disp = pc.status === 'disputed';
      const pose = disp ? disputedPose(pc, kc) : {c: mix(pc.start, pc.seat, kc), rot: 0};
      // a disputed piece stays raised once brought (not pressed in): informational, kept in reduced motion
      const lift = Math.max(reduced ? 0 : Math.sin(Math.PI * kc), disp ? 0.85 * kc : 0);
      const sc = 1 + 0.035 * lift;
      nodes[`pc${pc.i}`] = {transform: `${T(pose.c.x, pose.c.y, pose.rot)}${sc !== 1 ? ` scale(${r(sc, 4)})` : ''}`};
      nodes[`pc${pc.i}-sh`] = {transform: T(5 * lift, 8 * lift), opacity: r(0.55 + 0.45 * lift, 3)};
      const state = q <= Q.reach ? 'staged' : q < Q.carry ? 'carried' : disp ? 'unseated' : 'seated';
      sem.pieces.push(state);
      sem[`pc${pc.i}`] = {x: r(pose.c.x), y: r(pose.c.y)};
      const A = L.arms.find(x => x.i === pc.i);
      const grip = gripAt(pose, A.gripLocal);
      sem[`grip${pc.i}`] = {x: r(grip.x), y: r(grip.y)};
      // hand path: rest → grip (reach), with the piece (carry, release), grip → rest (withdraw)
      const startGrip = gripAt(disp ? disputedPose(pc, 0) : {c: pc.start, rot: 0}, A.gripLocal);
      let hand;
      // the withdraw runs on its own, longer window (it may outlast the placement window)
      const qw = clamp((a - (pc.win[0] + Q.release * W.placeLen)) / (W.placeLen * Q.withdraw));
      if (q <= Q.reach) hand = mix(A.rest, startGrip, ease.inOutSine(q / Q.reach));
      else if (q <= Q.release) hand = grip;
      else hand = mix(grip, A.rest, ease.inOutSine(qw));
      const shoulder = A.shoulderAt(hand);
      // elbows bend away from the board: toward the plate's badge side (row) / downward (column)
      const bend = pc.sl.s < 0 ? -1 : 1;
      const posed = A.arm.pose(shoulder, hand, L.row ? bend : -bend);
      Object.assign(nodes, posed.nodes);
      sem[`hand${pc.i}`] = {x: r(posed.hand.x), y: r(posed.hand.y)};
      sem.reach[`arm${pc.i}`] = posed.reached;
      if (!posed.reached) sem.allReached = false;
    }
    // squeezed tray: a piece's print is hidden while an earlier piece still lies over it
    if (L.tray && ctx.show('key')) {
      for (const pc of L.pieces) {
        const cov = L.tray.coveredBy[pc.i];
        if (!cov || !cov.length || !pc.sl.factFit) continue;
        const covered = cov.some(j => { const o = L.pieces[j]; return seg(a, o.win[0], o.win[1]) <= Q.reach; });
        nodes[`pc${pc.i}-fact`] = {opacity: covered ? 0 : 1};
      }
    }
    for (const b of L.badges) {
      const pc = L.pieces.find(x => x.i === b.i);
      const q = seg(a, pc.win[0], pc.win[1]);
      const kc = ease.inOutCubic(clamp((q - Q.reach) / (Q.carry - Q.reach)));
      const pose = disputedPose(pc, kc);
      const off = {x: pc.dir.x * (pc.sl.inner * 0.2) + (L.row ? P.R * 0.95 : 0), y: pc.dir.y * (pc.sl.inner * 0.2) + (L.row ? 0 : P.R * 0.95)};
      nodes[`doubt${b.i}`] = {transform: T(pose.c.x + off.x, pose.c.y + off.y), opacity: done ? r(seg(u, ...W.marks), 3) : 0};
    }

    // --- tester and the gear line
    let theta = 0;
    if (L.tester) {
      const reachK = ease.inOutCubic(seg(a, ...W.testReach));
      const turnK = ease.inOutSine(seg(a, ...W.turn));
      const backK = ease.inOutCubic(seg(a, ...W.testBack));
      theta = L.turnDir * 180 * turnK;
      const knob = L.knobAt(theta);
      let hand;
      if (a < W.turn[0]) hand = mix(L.tRest, knob, reachK);
      else if (a < W.testRelease[1]) hand = knob;
      else hand = mix(knob, L.tRest, backK);
      // the tester leans along the reach (shoulder beyond the bench edge), so the arm stays
      // almost straight and level over bare slate
      const dv = {x: L.tShoulder.x - hand.x, y: L.tShoulder.y - hand.y};
      const dl = Math.hypot(dv.x, dv.y) || 1;
      const reachLen = L.tester.reach * 0.992;
      const sh = dl < reachLen ? {x: hand.x + (dv.x / dl) * reachLen, y: hand.y + (dv.y / dl) * reachLen} : L.tShoulder;
      const posed = L.tester.pose(sh, hand, L.row ? 1 : 1);
      Object.assign(nodes, posed.nodes);
      sem.testerHand = {x: r(posed.hand.x), y: r(posed.hand.y)};
      sem.knob = {x: r(knob.x), y: r(knob.y)};
      sem.reach.tester = posed.reached;
      if (!posed.reached) sem.allReached = false;
      sem.onKnob = a >= W.turn[0] && a < W.testRelease[1];
    }
    const tp = trainPose(P, theta, L.res.breakAt, {drive: 'bd-drive', out: 'bd-out', pieceRot: i => (L.pieces[i].status === 'pending' ? null : `pc${i}-g-rot`)});
    Object.assign(nodes, tp.nodes);
    // a disputed piece's gear sits askew: not meshed
    for (const pc of L.pieces) if (pc.status === 'disputed') nodes[`pc${pc.i}-g-rot`] = {transform: `rotate(${r(pc.sl.phase + P.G.p * 0.45)})`};
    const dialK = tp.outTurns ? Math.abs(theta) / 180 : 0;
    Object.assign(nodes, L.board.dial.frame(dialK, dialK >= 0.99));

    // --- hold: markers, tag, captions, note, callouts
    const holdK = done ? seg(u, ...W.marks) : 0;
    for (const gh of L.ghosts) nodes[gh.attrs.name] = {opacity: r(holdK, 3)};
    for (const mc of L.markChips) nodes[`markg${mc.i}`] = {opacity: r(holdK, 3)};
    if (L.tag) nodes['state-tag'] = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    for (const c of L.captions) nodes[`${c.name}-g`] = {opacity: r(seg(u, ...W.captions), 3)};
    if (L.dialCap) nodes['dial-cap-g'] = {opacity: r(L.dialLate ? (done ? seg(u, ...W.dialLate) : 0) : seg(u, ...W.captions), 3)};
    if (L.note) nodes.note = {opacity: done ? r(seg(u, ...W.note), 3) : 0};
    L.notes.forEach((nn, i) => Object.assign(nodes, nn.frame(done ? seg(u, ...W.ann) : 0)));

    const turned = [];
    turned.push(Math.abs(theta) > 0.5);
    for (const s of P.slots) turned.push(Math.abs(theta) > 0.5 && (L.res.breakAt < 0 || s.i < L.res.breakAt) && L.pieces[s.i].status === 'supplied');
    turned.push(tp.outTurns && Math.abs(theta) > 0.5);
    Object.assign(sem, {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      layout: P.axis,
      n: P.n,
      statuses: L.res.slots.map(s => s.status),
      breakAt: L.res.breakAt,
      complete: L.res.complete,
      theta: r(theta),
      turned,
      dial: r(dialK, 3),
      dialLamp: dialK >= 0.99,
      seated: sem.pieces.filter(s => s === 'seated').length,
      actionCapped: p.actionProgress < 1 && u > capU,
      gearR: r(P.R),
      factSize: L.minFact,
      condSize: L.minCond,
      stage: L.stage,
      planTry: P.planTry ?? 0,
      trayClear: L.trayClear,
      gearsClear: L.gearsClear,
      traySqueezed: Number.isFinite(P.trayMaxH ?? Infinity),
      dialCapOnPath: L.dialCapOnPath,
      dialCapLate: L.dialLate,
      annModes: L.annModes,
    });
    return {nodes, semantic: sem};
  }
}

/**
 * A disputed piece is brought over its pocket but not pressed in: it rests
 * raised (shadow), a little askew and a hair short of its peg, teeth unmeshed;
 * it stays off its condition plate.
 */
function disputedPose(pc, k = 1) {
  const f = Math.max(0.2, 1 - 6 / Math.max(1, pc.travel));
  return {c: mix(pc.start, pc.seat, f * k), rot: 3 * k * (pc.sl.s < 0 ? 1 : -1)};
}

function gripAt(pose, local) {
  const a = (pose.rot * Math.PI) / 180;
  return {x: pose.c.x + local.x * Math.cos(a) - local.y * Math.sin(a), y: pose.c.y + local.x * Math.sin(a) + local.y * Math.cos(a)};
}

/** Bounding box of a polygon (leader polygons). */
function boxOfPoly(poly) {
  const xs = poly.map(q => q.x), ys = poly.map(q => q.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

function hitBox(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

function dialBox(P, dial) {
  return dialBounds(P, dial, 10);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-05-story',
    title: 'Cumulative conditions — contributors seat the pieces of a gear board',
    titleEs: 'Condiciones acumulativas — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones acumulativas',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down workbench: contributors slide fact pieces (each carrying a gear) into the pockets of a rule board, one per listed condition; a tester turns the crank and the gear line turns only as far as the seated pieces allow — the output dial moves only when every piece is seated. Piece statuses are supplied by the author (supplied / pending / disputed); nothing is decided.',
    tags: ['reasoning', 'cumulative conditions', 'all required', 'gears', 'mechanism', 'rule', 'facts', 'pending', 'disputed', 'hands', 'workbench'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-acumulativas.js', 'src/animations/causation/kits/place.js', 'src/primitives/desk.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CA_STRINGS,
  scene,
});
