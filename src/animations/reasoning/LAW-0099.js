/**
 * LAW-0099 — Condiciones acumulativas · contrast
 *
 * Storyboard (two complete, identical bench scenes built from the same rule
 * board; side by side on wide and square boxes, stacked on tall boxes). The
 * boards are pictogram boards — gears, coloured pieces and pip badges — and the
 * words (each condition with the fact supplied for it) are printed ONCE in a
 * shared legend keyed by the same pips, so that every text keeps a readable
 * size (the accepted LAW-0091 pattern: shared content drawn once).
 *  0.00–0.17 base      Scenes A and B: the same rule board (shared rule plaque
 *                      above both), the same fact pieces hovering over their
 *                      own pockets (raised, soft shadow), the same latch
 *                      holding each drive gear and, beside each board, the
 *                      same empty set-aside tray. Nothing differs yet.
 *  0.17–0.40 change    ONE fact changes, locally: the plate of the changed
 *                      condition is framed in both scenes (solid in A, dashed
 *                      in B) and its legend row is marked. In B a hand reaches
 *                      in, takes that piece by its free side edge (never by
 *                      printed text), lifts it out of its pocket, carries it
 *                      to B's set-aside tray and sets it down there, whole and
 *                      in view; a dashed outline stays in the empty pocket. If
 *                      the change is "disputed" the piece instead tilts, keeps
 *                      hovering and gets a "?" badge. A keeps every piece. The
 *                      changed fact is captioned.
 *  0.40–0.77 parallel  Same action, same timing in both scenes: the pieces
 *                      drop into their pockets one after another; at the same
 *                      instant both latches lift and both drives turn half a
 *                      turn. A: the whole line turns and the joint dial
 *                      reaches its end. B: the line turns up to the empty (or
 *                      unseated) pocket and stops there; B's dial stays put.
 *  0.77–1.00 guide     A comparison guide runs from A's framed plate through
 *                      the lanes to B's framed plate, with its label; each
 *                      scene shows its SUPPLIED state; a neutral note says
 *                      nothing else differs. The author's issue and
 *                      assumptions are shown with the key "states as supplied ·
 *                      no conclusion is drawn". No winner, score, verdict
 *                      colour or outcome.
 * Layouts: wide boxes put the legend (and the issue note) in a full-height
 * column on the left; square and tall boxes put it under the scenes. Text
 * sizes are floored in output pixels at 1080p (legend ≥ 18.5 px, captions and
 * chips ≥ 16.5 px); long texts wrap, they are never cut.
 * Legal content: fictional rule and facts, jurisdiction unspecified; the
 * difference is a supplied status (pending / disputed), never a finding.
 * @module animations/reasoning/LAW-0099
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, settle, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, oneOf, contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {stateTag} from '../causation/kits/place.js';
import {
  CA_STRINGS, caFields, CA_DEFAULTS, resolveSlots, stateLine, planBoard, boardArt, pieceArt, ghostArt,
  trainPose, doubtBadge, latchArt, headerBlock, gearSpec, legendBlock,
} from './kits/condiciones-acumulativas.js';

const ID = 'LAW-0099';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  frame: [0.18, 0.25], changed: [0.19, 0.27],
  // the hand: reach to the piece, lift + carry it to the tray, set it down, let go, withdraw
  pullReach: [0.19, 0.235], carry: [0.235, 0.32], setDown: [0.32, 0.335], withdraw: [0.335, 0.38],
  mark: [0.3, 0.38],
  drop: [0.41, 0.58], dropLen: 0.075,
  latch: [0.585, 0.61], turn: [0.61, 0.745],
  tags: [0.78, 0.84], guide: [0.79, 0.9], guideLabel: [0.86, 0.92], neutral: [0.9, 0.97], note: [0.84, 0.92],
};
const HOVER = {scale: 0.03, dx: 10, dy: 14, rot: 1.4};
/** Extra lift while a piece is carried (scale and shadow). */
const CARRY_LIFT = 0.05;
/** Set-aside tray: padding around the piece, gap to the board. */
const TRAY = {pad: 12, gap: 14};

const sceneSchema = {
  ...caFields,
  ...contrastFields(),
  changedPiece: int('Which piece differs between A and B (1 = first condition). In A it is supplied; in B it has the changed status', 1, 5),
  changedStatus: oneOf('Status of the changed piece in B (supplied by the author): pending = not supplied yet, the piece is set aside and its pocket stays empty; disputed = brought but not seated, not resolved here', ['pending', 'disputed']),
};

const defaultParams = {
  ...CA_DEFAULTS,
  scenarioA: {label: 'All pieces supplied', caption: 'Pieces 1, 2 and 3 brought for Rule R-1'},
  scenarioB: {label: 'Piece 2 pending', caption: 'The same pieces, except piece 2'},
  changedFact: 'Receipt D-12 for the deposit: supplied in A, not yet supplied in B',
  sharedFacts: ['Same rule R-1', 'Same pieces 1 and 3', 'Same test turn'],
  comparisonLabels: {guide: 'Only piece 2 differs', neutral: 'Everything else is identical in A and B. No outcome is decided here.'},
  changedPiece: 2,
  changedStatus: 'pending',
};

// Output-pixel floors at 1080p; converted to design units with the actual fit scale.
const PX = {legend: 18.5, legendSide: 20, caption: 16.5, chip: 17, note: 17, tag: 16.5, label: 21, plaque: 19, guide: 17};

const SHAPE = {
  landscape: {arr: 'row', legendAt: 'side', trayAt: 'below', minR: 32, col: {legendAt: 'column'}, gap: 44, lane: 50, side: 18, maxR: 74, chip: 22, tag: 21, label: 30, plaque: 26},
  square: {arr: 'row', legendAt: 'below', trayAt: 'side', minR: 34, alt: {legendAt: 'side', trayAt: 'below', gap: 20, lane: 40, side: 10}, col: {legendAt: 'column', arr: 'column', gap: 12, lane: 34, side: 12}, legendCols: 2, legendStack: true, gap: 26, lane: 46, side: 12, maxR: 66, chip: 26, tag: 25, label: 34, plaque: 30},
  portrait: {arr: 'column', legendAt: 'below', trayAt: 'side', minR: 34, alt: {lane: 26, gap: 8}, legendCols: 1, gap: 12, lane: 34, side: 14, maxR: 70, chip: 20, tag: 19, label: 28, plaque: 24},
};

// Lighter floors for dense content (long texts): used only when the regular floors would leave
// the boards gears smaller than minR; key content never drops below 16.5 px.
const PX_DENSE = {legend: 16.5, legendSide: 17, caption: 16.5, chip: 16, note: 16.5, tag: 16, label: 18, plaque: 16.5, guide: 16};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    // Recompose rather than shrink: besides the shape's own composition, try the other tray
    // position and the other arrangement (side by side / stacked) and keep the one with the
    // largest boards — first with the regular text floors, then with the dense ones.
    const SH = SHAPE[ctx.view.shape];
    const flipTray = sh => ({...sh, trayAt: sh.trayAt === 'side' ? 'below' : 'side'});
    const flipArr = sh => ({...sh, arr: sh.arr === 'row' ? 'column' : 'row', legendCols: 1, legendStack: false});
    const variants = sh => [sh, flipTray(sh), flipArr(sh), flipTray(flipArr(sh))];
    let best = null;
    for (const px of [PX, PX_DENSE]) {
      for (const base of [SH, SH.alt ? {...SH, ...SH.alt} : null, SH.col ? {...SH, ...SH.col} : null].filter(Boolean)) {
        variants(base).forEach(v => {
          const L = layoutScene(ctx, v, px);
          // the composition with the largest boards wins (the shape's own one on a tie)
          if (!best || L.R > best.R + 0.5) best = L;
        });
      }
      if (best.R >= SH.minR) break;
    }
    return best;
  },
  build(ctx, L) {
    return buildScene(ctx, L);
  },
  frame(ctx, L, u) {
    return frameScene(ctx, L, u);
  },
};

function layoutScene(ctx, SH, PX) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const M = 20;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const k = Math.min(p.changedPiece, p.rules.conditions.length) - 1;
  const resA = resolveSlots(p, {[k]: 'supplied'});
  const resB = resolveSlots(p, {[k]: p.changedStatus});
  const pending = p.changedStatus === 'pending';
  const sK = k % 2 === 0 ? -1 : 1;

  // design units for a size in output pixels at 1080p
  const cv = ctx.view.content;
  const fitK = Math.min(cv.w / D.w, cv.h / D.h);
  const per1080 = Math.min(ctx.view.width, ctx.view.height) / 1080;
  const dz = px => (px * per1080) / fitK;
  // (dense content: the floors alone decide, the shape's comfortable sizes are dropped)
  const base = v => (PX === PX_DENSE ? 0 : v);
  const S = {
    legend: dz(SH.legendAt === 'side' || (SH.legendAt === 'column' && ctx.view.shape === 'landscape') ? PX.legendSide : PX.legend),
    caption: dz(PX.caption),
    chip: Math.max(base(SH.chip), dz(PX.chip)),
    note: dz(PX.note),
    tag: Math.max(base(SH.tag), dz(PX.tag)),
    label: Math.max(base(SH.label), dz(PX.label)),
    plaque: Math.max(base(SH.plaque), dz(PX.plaque)),
    guide: Math.max(base(SH.chip), dz(PX.guide)),
  };
  // content (conditions and facts) is never printed smaller than the generic chips
  S.legend = Math.max(S.legend, S.chip);
  const texts = [];   // every fitted text: {name, fit, key}
  const keep = (name, fit, key = true) => { if (fit) texts.push({name, fit, key}); return fit; };

  // ---- legend (+ note with issues, assumptions and the "as supplied" key)
  let legend = null, note = null;
  let band = {ax: M, aw: D.w - 2 * M};
  let hdr = null, plaque = null, shared = null, areaTop0 = null, overflow = false;
  if (SH.legendAt === 'column' && showKey) {
    // a right-hand column carries everything drawn once for both scenes: the rule plaque, the
    // shared-facts line, the legend and the issue note; the scenes (stacked, A over B) take
    // the rest of the width
    const avail = D.h - 16;
    let col = null;
    for (let lw = 380; lw <= D.w * 0.6; lw += 20) {
      const x0 = D.w - M - lw;
      const hd = headerBlock(ctx, p.rules.name, lw, S.plaque, {minSize: S.plaque, maxLines: 6, tagSize: dz(15)});
      const sh = showAll && p.sharedFacts.length ? chip(ctx, `${t.sameBoth}: ${p.sharedFacts.join(' · ')}`, {x: x0 + lw / 2, y: 0, anchor: 'middle', maxWidth: lw, size: S.chip, minSize: S.chip * 0.95, maxLines: 5}) : null;
      const lg = legendBlock(ctx, resA, {x: x0, w: lw, size: S.legend, cols: 1, stack: true, title: true});
      const nt = showAll ? noteFor(ctx, p, {x: x0, w: lw, size: S.note}) : null;
      const total = hd.h + 10 + (sh ? sh.box.h + 10 : 0) + lg.h + (nt ? nt.h + 12 : 0);
      col = {lw, x0, hd, sh, lg, nt, total};
      if (total <= avail) break;
    }
    // a column that cannot hold everything is not a usable composition
    if (col.total > avail) overflow = true;
    let yy = 8 + Math.max(0, (avail - col.total) / 2);
    hdr = col.hd;
    plaque = {x: col.x0, y: yy, w: col.lw, h: hdr.h};
    yy += hdr.h + 10;
    if (col.sh) {
      shared = chip(ctx, `${t.sameBoth}: ${p.sharedFacts.join(' · ')}`, {x: col.x0 + col.lw / 2, y: yy, anchor: 'middle', maxWidth: col.lw, size: S.chip, minSize: S.chip * 0.95, maxLines: 5, fill: th.card, stroke: th.inkSoft, weight: 500, name: 'shared'});
      yy += shared.box.h + 10;
    }
    legend = col.lg;
    legend.place(yy);
    yy += legend.h + 12;
    note = col.nt;
    if (note) note.place(yy);
    band = {ax: M, aw: col.x0 - 24 - M};
    areaTop0 = 8;
  } else if (SH.legendAt === 'side' && showKey) {
    const avail = D.h - 16;
    const maxW = D.w * 0.4;
    let lw = 420;
    for (; lw <= maxW; lw += 20) {
      legend = legendBlock(ctx, resA, {x: M, w: lw, size: S.legend, cols: 1, stack: true, title: true});
      note = showAll ? noteFor(ctx, p, {x: M, w: lw, size: S.note}) : null;
      if (legend.h + (note ? note.h + 18 : 0) <= avail) break;
    }
    const total = legend.h + (note ? note.h + 18 : 0);
    const y0 = 8 + Math.max(0, (avail - total) / 2);
    legend.place(y0);
    if (note) note.place(y0 + legend.h + 18);
    band = {ax: M + legend.w + 28, aw: D.w - M - (M + legend.w + 28)};
  }

  // ---- shared plaque (rule as supplied) and shared-facts line
  let y = areaTop0;
  if (!hdr) {
    const plaqueW = Math.min(band.aw, 940);
    hdr = headerBlock(ctx, p.rules.name, plaqueW, S.plaque, {minSize: S.plaque, maxLines: 4, tagSize: dz(15)});
    plaque = {x: band.ax + (band.aw - plaqueW) / 2, y: 8, w: plaqueW, h: hdr.h};
    y = plaque.y + plaque.h + 10;
  }
  keep('rule', hdr.fit);
  if (shared) keep('shared', shared.fit);
  else if (showAll && p.sharedFacts.length && areaTop0 === null) {
    const text = `${t.sameBoth}: ${p.sharedFacts.join(' · ')}`;
    shared = chip(ctx, text, {x: band.ax + band.aw / 2, y, anchor: 'middle', maxWidth: band.aw, size: S.chip, minSize: S.chip * 0.95, maxLines: 3, fill: th.card, stroke: th.inkSoft, weight: 500, name: 'shared'});
    keep('shared', shared.fit);
    y += shared.box.h + 10;
  }
  const areaTop = y;

  // ---- bottom block (square / tall): changed fact | neutral note, then legend, then note
  const bw = (band.aw - 24) / 2;
  const chipOpts = {maxWidth: bw, size: S.chip, minSize: S.chip, maxLines: 8};
  const probeChanged = showAll && p.changedFact ? chip(ctx, p.changedFact, {x: 0, y: 0, ...chipOpts}) : null;
  const probeNeutral = showAll && p.comparisonLabels.neutral ? chip(ctx, p.comparisonLabels.neutral, {x: 0, y: 0, ...chipOpts}) : null;
  const chipsH = Math.max(0, ...[probeChanged, probeNeutral].filter(Boolean).map(c => c.box.h));
  let bottomY = D.h - 8;
  if (SH.legendAt === 'below' && showKey) {
    legend = legendBlock(ctx, resA, {x: band.ax, w: band.aw, size: S.legend, cols: SH.legendCols, stack: SH.legendStack, title: false});
    note = showAll ? noteFor(ctx, p, {x: band.ax, w: band.aw, size: S.note}) : null;
    if (note) { bottomY -= note.h; note.place(bottomY); bottomY -= 10; }
    bottomY -= legend.h;
    legend.place(bottomY);
    bottomY -= 12;
  }
  const chipsY = bottomY - chipsH;
  const areaBottom = chipsH ? chipsY - 12 : bottomY;

  // ---- state tags: one line when it fits the scene's width, else a two-line tag (never cut)
  const slotW = SH.arr === 'row' ? (band.aw - SH.gap) / 2 : band.aw;
  const tagText = {A: stateLine(t, resA), B: stateLine(t, resB)};
  const tagMax = SH.tagInHeader ? slotW * 0.5 : slotW - 8;
  const tagFor = (key, o = {}) => {
    if (!showKey) return null;
    const one = stateTag(ctx, tagText[key], {x: 0, y: 0, size: S.tag, maxWidth: 4000});
    if (one.box.w <= tagMax) return o.name ? stateTag(ctx, tagText[key], {x: o.x, y: o.y, size: S.tag, maxWidth: 4000, name: o.name, color: o.color, opacity: 0}) : one;
    const c = chip(ctx, tagText[key], {x: o.x ?? 0, y: o.y ?? 0, maxWidth: tagMax, size: S.tag, minSize: S.tag, maxLines: 3, fill: th.card, stroke: o.color ?? th.ink, color: o.color ?? th.ink, weight: 700});
    if (o.name) return {node: g({name: o.name, opacity: 0}, c.node), box: c.box, fit: c.fit};
    return c;
  };
  const tagProbe = key => tagFor(key);
  const tagH = Math.max(0, ...['A', 'B'].map(key => (showKey ? tagProbe(key).box.h : 0)));

  // ---- lanes: the guide runs on the side of the changed condition's plate; the other lane
  // holds the state tag (tall boxes: the tag sits in the scenario header)
  const laneG = SH.lane;
  const laneT = SH.tagInHeader ? 12 : Math.max(SH.lane, tagH + 10);
  const lanes = {top: sK < 0 ? laneG : laneT, bottom: sK > 0 ? laneG : laneT};

  // ---- scenario headers (badge + label + caption up to three lines, never cut)
  // the badge letter (1.2 × radius) never drops below ~16 px
  const badgeR = Math.max(S.label * 0.62, dz(16.5) / 1.2);
  const headerFor = (key, label, caption) => {
    const tp = SH.tagInHeader ? tagProbe(key) : null;
    const lw = slotW - badgeR * 2 - 22;
    const lf = showKey ? ctx.fit(label, {maxWidth: lw, size: S.label, minSize: S.label * 0.9, maxLines: 3, weight: 700}) : null;
    const cw = lw - (tp ? tp.box.w + 18 : 0);
    const cf = showAll && caption ? ctx.fit(caption, {maxWidth: cw, size: S.caption, minSize: S.caption, maxLines: 4, weight: 500}) : null;
    const labelH = Math.max(badgeR * 2, lf ? lf.height : 0);
    const capH = Math.max(cf ? cf.height : 0, tp ? tp.box.h : 0);
    return {key, lf, cf, tp, labelH, capH, h: labelH + (capH ? capH + 8 : 0) + 12};
  };
  const hA = headerFor('A', p.scenarioA.label, p.scenarioA.caption);
  const hB = headerFor('B', p.scenarioB.label, p.scenarioB.caption);
  keep('labelA', hA.lf); keep('labelB', hB.lf); keep('captionA', hA.cf); keep('captionB', hB.cf);
  const headerH = Math.max(hA.h, hB.h);

  // ---- guide label (measured first: the tall layout keeps a band for it between the scenes)
  let guideProbe = null;
  if (showAll && p.comparisonLabels.guide) {
    const mw = SH.arr === 'row' ? Math.min(520, Math.max(300, slotW * 0.8)) : Math.min(620, slotW * 0.7);
    guideProbe = {mw, c: chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: mw, size: S.guide, minSize: S.guide * 0.95, maxLines: 4})};
  }
  const midBand = SH.arr === 'column' ? SH.gap + (guideProbe ? guideProbe.c.box.h + 10 : 0) : 0;

  // ---- table slots
  const slots = [];
  // side by side: the guide's label sits under the tables, centred on the gutter (never on a rim)
  const guideBand = SH.arr === 'row' && guideProbe ? guideProbe.c.box.h + 16 : 0;
  if (SH.arr === 'row') {
    const hgt = areaBottom - areaTop - headerH - guideBand;
    for (let q = 0; q < 2; q++) slots.push({x: band.ax + q * (slotW + SH.gap), y: areaTop + headerH, w: slotW, h: hgt, hy: areaTop});
  } else {
    const hgt = (areaBottom - areaTop - 2 * headerH - midBand) / 2;
    for (let q = 0; q < 2; q++) {
      const y0 = areaTop + q * (headerH + hgt + midBand);
      slots.push({x: band.ax, y: y0 + headerH, w: slotW, h: hgt, hy: y0});
    }
  }

  // ---- board (pictogram board: pips only; the words are in the legend) and set-aside tray.
  // The tray sits beside the board (square / tall boxes, left) or below / above it on the
  // changed plate's side (wide boxes), right of the guide's drop from that plate.
  const planIn = (box, maxR) => planBoard(ctx, {n: resA.n, axis: 'row', box, header: 'none', ruleName: '', conds: resA.slots.map(s => s.condition), facts: resA.slots.map(s => s.fact), sizes: {fact: 11, cond: 11}, maxR, minR: 8, text: false, bare: true});
  const sideTray = SH.trayAt === 'side';
  const pieceDims = R => { const G = gearSpec(R); const gp = Math.max(10, 0.1 * R); return {w: 4 * R - gp, h: 0.96 * R + G.ra + 10 + Math.max(20, 0.62 * R)}; };
  const trayW = R => pieceDims(R).w + 2 * TRAY.pad;
  const trayH = R => pieceDims(R).h + 2 * TRAY.pad;
  const innerOf = sb => ({x: sb.x + SH.side, y: sb.y + lanes.top, w: sb.w - 2 * SH.side, h: sb.h - lanes.top - lanes.bottom});
  const boardBox = (b, R) => {
    if (!pending) return b;
    if (sideTray) { const d = trayW(R) + TRAY.gap; return {x: b.x + d, y: b.y, w: b.w - d, h: b.h}; }
    const d = trayH(R) + TRAY.gap;
    return {x: b.x, y: sK < 0 ? b.y + d : b.y, w: b.w, h: b.h - d};
  };
  // the guide leaves the changed plate a little left of its centre, the tray lies right of it
  const dropX = Q => { const q = Q.slots[k].plate; return q.x + q.w * 0.25; };
  const trayRect = (Q, R) => {
    if (!pending) return null;
    const sl = Q.slots[k];
    const e = extentOf(sl);
    if (sideTray) return {x: Q.extents.x - TRAY.gap - trayW(R), y: sl.c.y + e.y - TRAY.pad, w: trayW(R), h: e.h + 2 * TRAY.pad};
    const x = dropX(Q) + 16;
    const y = sK > 0 ? Q.extents.y + Q.extents.h + TRAY.gap : Q.extents.y - TRAY.gap - trayH(R);
    return {x, y, w: trayW(R), h: trayH(R)};
  };
  const union = (a, b) => (b ? {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y)} : a);
  const inside = (q, b) => q.x >= b.x - 0.5 && q.y >= b.y - 0.5 && q.x + q.w <= b.x + b.w + 0.5 && q.y + q.h <= b.y + b.h + 0.5;
  // largest gear radius whose board AND tray fit the slot (bisection: the tray grows with R)
  let lo = 8, hi = SH.maxR;
  for (let it = 0; it < 24; it++) {
    const mid = (lo + hi) / 2;
    const inner = innerOf(slots[0]);
    const box = boardBox(inner, mid);
    const Q = planIn(box, mid);
    const tr = trayRect(Q, mid);
    if (Q.R >= mid - 0.01 && inside(Q.extents, inner) && (!tr || inside(tr, inner))) lo = mid; else hi = mid;
  }
  const R = lo;
  // the tables shrink to board ∪ tray (no empty bench margins) and sit centred in their slots
  const Q0 = planIn(boardBox(innerOf(slots[0]), R), R);
  const U = union(Q0.extents, trayRect(Q0, R));
  const tw = Math.min(slots[0].w, U.w + 2 * SH.side + 6);
  const tH = Math.min(slots[0].h, U.h + lanes.top + lanes.bottom + 6);
  const dx = (slots[0].w - tw) / 2, dy = (slots[0].h - tH) / 2;
  const stageBoxes = slots.map(sl => ({x: sl.x + dx, y: sl.y + dy, w: tw, h: tH, hy: sl.hy + dy, slot: {x: sl.x, w: sl.w}}));
  // same relative placement of board and tray inside each tight table
  const boardIn = sb => {
    const ix = sb.x + (sb.w - U.w) / 2, iy = sb.y + lanes.top + (sb.h - lanes.top - lanes.bottom - U.h) / 2;
    return {x: ix + (Q0.extents.x - U.x), y: iy + (Q0.extents.y - U.y), w: Q0.extents.w, h: Q0.extents.h};
  };
  const PA = planIn(boardIn(stageBoxes[0]), R);
  const PB = planIn(boardIn(stageBoxes[1]), R);
  const off = {x: stageBoxes[1].x - stageBoxes[0].x, y: stageBoxes[1].y - stageBoxes[0].y};

  const sides = [
    {key: 'A', P: PA, res: resA, sb: stageBoxes[0], color: th.accent2, head: hA},
    {key: 'B', P: PB, res: resB, sb: stageBoxes[1], color: th.accent3, head: hB},
  ];
  const latchAngle = 180 + PA.G.p / 2;
  for (const Sd of sides) {
    const L0 = Sd.key.toLowerCase();
    Sd.desk = deskWindow(ctx, {prefix: `st${Sd.key}`, x: Sd.sb.x, y: Sd.sb.y, w: Sd.sb.w, h: Sd.sb.h, radius: 22, seedKey: 'bench'});
    Sd.board = boardArt(ctx, Sd.P, {prefix: `bd${Sd.key}`, crankAngle: 90, turnDir: 1});
    Sd.latch = latchArt(ctx, Sd.P, {name: `latch${Sd.key}`, angle: latchAngle});
    Sd.pieces = Sd.res.slots.map(sl => {
      const slot = Sd.P.slots[sl.i];
      // B's changed piece is present at the start too (no difference before the change beat)
      const present = sl.status !== 'pending' || (Sd.key === 'B' && sl.i === k);
      if (!present) return {i: sl.i, status: sl.status, slot, pc: null};
      return {i: sl.i, status: sl.status, slot, pc: pieceArt(ctx, Sd.P, sl.i, {name: `p${L0}${sl.i}`})};
    });
    Sd.header = headerArt(ctx, Sd, {x: Sd.sb.slot.x + 4, y: Sd.sb.hy + 4, w: Sd.sb.slot.w - 8, badgeR, labelH: Sd.head.labelH, tagRight: Sd.sb.x + Sd.sb.w - 4});
    // frame around the changed condition's plate
    const q = Sd.P.slots[k].plate;
    Sd.frameBox = {x: q.x - 8, y: q.y - 8, w: q.w + 16, h: q.h + 16};
    Sd.frame = h('path', {name: `frame${Sd.key}`, d: roundRectPath(Sd.frameBox.x, Sd.frameBox.y, Sd.frameBox.w, Sd.frameBox.h, 12), fill: 'none', stroke: Sd.color, 'stroke-width': 5, 'stroke-dasharray': Sd.key === 'B' ? '12 8' : undefined, opacity: 0});
    // set-aside tray (identical in both scenes; only B's receives a piece)
    if (pending) {
      Sd.tray = trayRect(Sd.P, R);
      Sd.trayNode = trayArt(ctx, Sd.tray, `tray${Sd.key}`);
    }
  }
  const A = sides[0], B = sides[1];

  // ---- B's changed piece: carried to the tray (pending) or left tilted and hovering (disputed)
  const slB = PB.slots[k];
  const eB = extentOf(slB);
  const ghostB = pending ? ghostArt(ctx, PB, k, 'ghostB') : null;
  const doubt = !pending ? doubtBadge(ctx, {name: 'doubtB', x: 0, y: 0, rad: Math.max(16, PA.R * 0.34)}) : null;
  let puller = null;
  {
    // pending: set-down pose whole inside B's tray, upright (a straight carry from the pocket);
    // disputed: the hand draws the piece partly back out of its pocket and leaves it there,
    // askew and raised (brought but not seated)
    const set = pending
      ? {x: B.tray.x + (B.tray.w - eB.w) / 2 - eB.x, y: B.tray.y + (B.tray.h - eB.h) / 2 - eB.y}
      : {x: slB.c.x, y: slB.c.y + sK * PB.R * 0.45};
    // grip: the piece's free left side edge, level with its panel (no text there)
    const pl = slB.panelLocal;
    const aw = clamp(PB.R * 0.46, 18, 34);
    const gripLocal = {x: Math.min(pl.x, slB.tabLocal.x) - aw * 0.55, y: pl.y + pl.h / 2};
    const look = actorLook(ctx, null, 2);
    const reachL = PB.R * 3.2 + 140;
    const arm = topArm(ctx, {name: 'pullB', skin: look.skin, sleeve: look.outfit, handed: sK > 0 ? 'right' : 'left', width: aw, handScale: 1.2, upper: reachL * 0.52, lower: reachL * 0.48});
    const dir = {x: 0, y: sK};
    const g0 = {x: slB.c.x + gripLocal.x, y: slB.c.y + gripLocal.y};
    const edge = sK > 0 ? B.sb.y + B.sb.h : B.sb.y;
    const rest = {x: g0.x, y: edge + sK * (aw * 2.2 + 30)};
    puller = {arm, gripLocal, rest, dir, set, gripLen: Math.hypot(gripLocal.x, gripLocal.y)};
  }

  // ---- drop order (identical in A and B)
  const order = resA.slots.map(s => s.i);
  const dStep = order.length > 1 ? (W.drop[1] - W.drop[0] - W.dropLen) / (order.length - 1) : 0;
  const dropWin = i => [W.drop[0] + i * dStep, W.drop[0] + i * dStep + W.dropLen];

  // ---- comparison guide: A's framed plate → lane → (gutter | right margin) → lane → B's plate
  const laneY = Sd => (sK > 0 ? Sd.sb.y + Sd.sb.h - lanes.bottom / 2 : Sd.sb.y + lanes.top / 2);
  const plateEdge = Sd => ({x: pending && !sideTray ? dropX(Sd.P) : Sd.frameBox.x + Sd.frameBox.w / 2, y: sK > 0 ? Sd.frameBox.y + Sd.frameBox.h : Sd.frameBox.y});
  const guideX = sb => (sb.slot.x + sb.slot.w - (sb.x + sb.w) > 40 ? (sb.x + sb.w + sb.slot.x + sb.slot.w) / 2 : sb.x + sb.w - SH.side / 2 - 2);
  let pts;
  const a0 = plateEdge(A), b0 = plateEdge(B);
  if (SH.arr === 'row') pts = [a0, {x: a0.x, y: laneY(A)}, {x: b0.x, y: laneY(B)}, b0];
  else {
    const mx = guideX(A.sb);
    pts = [a0, {x: a0.x, y: laneY(A)}, {x: mx, y: laneY(A)}, {x: mx, y: laneY(B)}, {x: b0.x, y: laneY(B)}, b0];
  }
  const guide = orthoPath(pts, 16);
  let guideLabel = null;
  if (guideProbe) {
    const pb = guideProbe.c.box;
    let cx, cy;
    if (SH.arr === 'row') { cx = (A.sb.x + A.sb.w + B.sb.x) / 2; cy = A.sb.y + A.sb.h + 8; }
    else {
      // in the band between the scenes, beside the guide's vertical run
      const mx = guideX(A.sb);
      cx = Math.max(band.ax + pb.w / 2, mx - 14 - pb.w / 2);
      cy = A.sb.y + A.sb.h + (midBand - pb.h) / 2;
    }
    guideLabel = chip(ctx, p.comparisonLabels.guide, {x: cx, y: cy, anchor: 'middle', maxWidth: guideProbe.mw, size: S.guide, minSize: S.guide * 0.95, maxLines: 4, fill: th.card, stroke: th.ink, name: 'guide-label', weight: 700});
    // a short leader up the gutter joins the label to the guide
    if (SH.arr === 'row') guideLabel.leader = h('line', {name: 'guide-leader', x1: r(cx), y1: r(laneY(A)), x2: r(cx), y2: r(cy), stroke: th.fg, 'stroke-width': 2.5, 'stroke-dasharray': '5 5', opacity: 0});
    keep('guide', guideLabel.fit);
  }

  // ---- state tags (one per scene: in the lane away from the guide, or in the header)
  const tags = [];
  for (const Sd of sides) {
    if (!showKey) continue;
    const pb = tagProbe(Sd.key).box;
    let x, ly;
    if (SH.tagInHeader) {
      x = Sd.sb.slot.x + Sd.sb.slot.w - 4 - pb.w;
      ly = Sd.sb.hy + 4 + Sd.head.labelH + 8 + (Sd.head.capH - pb.h) / 2;
    } else {
      // right-aligned in the table's lane; centred (over the rim) when wider than the table
      x = pb.w <= Sd.sb.w - 2 * SH.side ? Sd.sb.x + Sd.sb.w - SH.side - pb.w : clamp(Sd.sb.x + (Sd.sb.w - pb.w) / 2, Sd.sb.slot.x, Sd.sb.slot.x + Sd.sb.slot.w - pb.w);
      ly = sK > 0 ? Sd.sb.y + (lanes.top - pb.h) / 2 : Sd.sb.y + Sd.sb.h - lanes.bottom + (lanes.bottom - pb.h) / 2;
    }
    const tg = tagFor(Sd.key, {x, y: ly, name: `tag${Sd.key}`, color: Sd.color});
    tags.push(tg);
    if (tg.fit) keep(`tag${Sd.key}`, tg.fit);
  }

  // ---- changed fact (change beat) and neutral note (guide beat), under the scenes
  let changedChip = null, neutral = null;
  if (probeChanged) changedChip = chip(ctx, p.changedFact, {x: band.ax + bw / 2, y: chipsY, anchor: 'middle', ...chipOpts, fill: th.card, stroke: th.accent3, name: 'changed', weight: 600});
  if (probeNeutral) neutral = chip(ctx, p.comparisonLabels.neutral, {x: band.ax + band.aw - bw / 2, y: chipsY, anchor: 'middle', ...chipOpts, fill: th.card, name: 'neutral', weight: 500});
  keep('changed', changedChip && changedChip.fit); keep('neutral', neutral && neutral.fit);
  if (legend) legend.rowsFits().forEach((f, j) => keep(`legend${j}`, f));
  if (note) note.fits.forEach((f, j) => keep(`note${j}`, f));

  return {R: overflow ? 0 : R, P: PA, PB, k, sK, sides, hdr, plaque, shared, legend, note, ghostB, doubt, puller, order, dropWin, guide, guideLabel, tags, changedChip, neutral, off, SH, texts, fitK, per1080, pending};
}

/** Local bounds of a piece (panel ∪ tab) around its gear centre. */
function extentOf(sl) {
  const a = sl.panelLocal, b = sl.tabLocal;
  const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
  return {x: x0, y: y0, w: Math.max(a.x + a.w, b.x + b.w) - x0, h: Math.max(a.y + a.h, b.y + b.h) - y0};
}

/** A shallow wooden set-aside tray (empty at the start in both scenes). */
function trayArt(ctx, q, name) {
  const th = ctx.theme;
  return g({name},
    h('path', {d: roundRectPath(q.x + 4, q.y + 6, q.w, q.h, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 14), fill: '#b98a57', stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(q.x + 7, q.y + 7, q.w - 14, q.h - 14, 9), fill: '#d8c3a0', stroke: '#8a6238', 'stroke-width': 2}),
  );
}

/** Scenario header: colour badge (letter), label and caption (wrapped, never cut). */
function headerArt(ctx, Sd, o) {
  const th = ctx.theme;
  const hd = Sd.head;
  const parts = [
    h('circle', {cx: r(o.x + o.badgeR), cy: r(o.y + o.labelH / 2), r: r(o.badgeR), fill: Sd.color, stroke: th.ink, 'stroke-width': 2.5}),
  ];
  if (ctx.show('key')) {
    const sz = o.badgeR * 1.2;
    parts.push(h('text', {x: r(o.x + o.badgeR), y: r(o.y + o.labelH / 2 + sz * 0.36), 'text-anchor': 'middle', 'font-size': r(sz, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, Sd.key));
  }
  const tx = o.x + o.badgeR * 2 + 14;
  if (hd.lf) parts.push(textBlock(hd.lf, {x: tx, y: o.y + (o.labelH - hd.lf.height) / 2, fill: th.fg}));
  if (hd.cf) parts.push(textBlock(hd.cf, {x: tx, y: o.y + o.labelH + 8, fill: th.fgSoft}));
  return g({name: `hdr${Sd.key}`}, parts);
}

function buildScene(ctx, L) {
  const k = L.k;
  return g(null,
    plaqueArt(ctx, L),
    L.shared && g({name: 'shared-g', opacity: 0}, L.shared.node),
    L.sides.map(Sd => g(null,
      Sd.header,
      Sd.desk.surface,
      g({'clip-path': Sd.desk.clip},
        Sd.trayNode || null,
        Sd.board.node,
        Sd.key === 'B' ? L.ghostB : null,
        Sd.latch.node,
        Sd.pieces.filter(pc => pc.pc && !(Sd.key === 'B' && pc.i === k)).map(pc => pc.pc.node),
      ),
      Sd.desk.frame,
      Sd.frame,
      // B's changed piece (and the hand carrying it) travel above the framed plate, inside
      // B's table: the piece is never cut by the bench window
      Sd.key === 'B' ? g({'clip-path': Sd.desk.clip},
        Sd.pieces[k].pc.node,
        L.doubt,
        L.puller ? [L.puller.arm.arm, L.puller.arm.palm, L.puller.arm.thumb] : null,
      ) : null,
    )),
    h('path', {name: 'guide', d: L.guide.d, fill: 'none', stroke: ctx.theme.fg, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.len)} ${r(L.guide.len + 10)}`, 'stroke-dashoffset': r(L.guide.len), opacity: 0}),
    L.guide.ends.map((q, i) => h('circle', {name: `guide-end${i}`, cx: r(q.x), cy: r(q.y), r: 7, fill: ctx.theme.fg, opacity: 0})),
    L.guideLabel && L.guideLabel.leader,
    L.guideLabel && g({name: 'guide-label-g', opacity: 0}, L.guideLabel.node),
    L.tags.map(tg => tg.node),
    L.legend && L.legend.node(L.k),
    L.note && L.note.node(),
    L.changedChip && g({name: 'changed-g', opacity: 0}, L.changedChip.node),
    L.neutral && g({name: 'neutral-g', opacity: 0}, L.neutral.node),
  );
}

function frameScene(ctx, L, u) {
  const reduced = ctx.reduced;
  const k = L.k;
  const nodes = {};
  const sem = {};

  // ---- identical drops, latches and turns in both scenes
  const latchK = ease.inOutCubic(seg(u, ...W.latch));
  const theta = 180 * ease.inOutSine(seg(u, ...W.turn));
  const carryK = ease.inOutCubic(seg(u, ...W.carry));
  const setK = ease.outCubic(seg(u, ...W.setDown));
  let bPose = null;

  for (const Sd of L.sides) {
    const P = Sd.P;
    const L0 = Sd.key.toLowerCase();
    const states = [];
    for (const pc of Sd.pieces) {
      if (!pc.pc) { states.push('absent'); continue; }
      const name = `p${L0}${pc.i}`;
      const changed = Sd.key === 'B' && pc.i === k;
      const dw = L.dropWin(pc.i);
      const q = changed ? 0 : seg(u, dw[0], dw[1]);
      let c = pc.slot.c;
      let rot = HOVER.rot * (pc.i % 2 ? -1 : 1);
      let sc, lift, st;
      if (changed && L.pending) {
        // lifted out of its pocket, carried level to B's tray and set down there, upright
        const set = L.puller.set;
        c = {x: lerp(pc.slot.c.x, set.x, carryK), y: lerp(pc.slot.c.y, set.y, carryK)};
        rot = rot * (1 - carryK);
        const carrying = carryK > 0 && setK < 1;
        lift = 1 + (carrying ? CARRY_LIFT / HOVER.scale * Math.sin(Math.PI * Math.min(1, carryK * 1.2)) : 0);
        lift *= 1 - setK;
        sc = 1 + HOVER.scale * lift;
        st = setK >= 1 ? 'withdrawn' : carryK > 0 ? 'withdrawing' : 'hovering';
        bPose = {c, rot, sc};
      } else if (changed) {
        // disputed: the hand draws it partly out of its pocket; it stays raised, askew, its
        // teeth not meshed (brought but not seated)
        const set = L.puller.set;
        c = {x: lerp(pc.slot.c.x, set.x, carryK), y: lerp(pc.slot.c.y, set.y, carryK)};
        rot = lerp(rot, 4 * pc.slot.s, carryK);
        lift = 1;
        sc = 1 + HOVER.scale;
        st = 'unseated';
        bPose = {c, rot, sc};
      } else {
        const d = reduced ? ease.outCubic(q) : settle(q, false);
        lift = 1 - d;
        rot *= lift;
        sc = 1 + HOVER.scale * lift;
        st = q <= 0 ? 'hovering' : q < 1 ? 'dropping' : 'seated';
      }
      nodes[name] = {transform: T(c.x, c.y, rot, sc)};
      nodes[`${name}-sh`] = {transform: T(HOVER.dx * clamp(lift), HOVER.dy * clamp(lift)), opacity: r(0.5 + 0.5 * clamp(lift, 0, 1), 3)};
      sem[name] = {x: r(c.x), y: r(c.y)};
      states.push(st);
    }
    // latch lifts, then the drive turns as far as the seated pieces allow
    nodes[`latch${Sd.key}-arm`] = {transform: `rotate(${r(Sd.latch.toward - 42 * latchK)})`};
    const tp = trainPose(P, theta, Sd.res.breakAt, {drive: `bd${Sd.key}-drive`, out: `bd${Sd.key}-out`, pieceRot: i => (Sd.pieces[i].pc ? `p${L0}${i}-g-rot` : null)});
    Object.assign(nodes, tp.nodes);
    for (const pc of Sd.pieces) if (pc.pc && pc.status === 'disputed') nodes[`p${L0}${pc.i}-g-rot`] = {transform: `rotate(${r(pc.slot.phase + P.G.p * 0.45)})`};
    const dialK = tp.outTurns ? theta / 180 : 0;
    Object.assign(nodes, Sd.board.dial.frame(dialK, dialK >= 0.99));
    const turned = [theta > 0.5, ...P.slots.map(s => theta > 0.5 && (Sd.res.breakAt < 0 || s.i < Sd.res.breakAt) && Sd.res.slots[s.i].status === 'supplied'), tp.outTurns && theta > 0.5];
    sem[Sd.key.toLowerCase()] = {
      statuses: Sd.res.slots.map(s => s.status), pieces: states, seated: states.filter(s => s === 'seated').length,
      theta: r(theta), dial: r(dialK, 3), lamp: dialK >= 0.99, turned, breakAt: Sd.res.breakAt, latch: r(latchK, 3),
    };
    nodes[`frame${Sd.key}`] = {opacity: r(seg(u, ...W.frame), 3)};
  }

  // ---- the hand: reaches in, holds B's piece by its side edge all the way to the tray, lets go
  const B = L.sides[1];
  if (L.puller && bPose) {
    const Pu = L.puller;
    const a = (bPose.rot * Math.PI) / 180;
    const gx = Pu.gripLocal.x * bPose.sc, gy = Pu.gripLocal.y * bPose.sc;
    const grip = {x: bPose.c.x + gx * Math.cos(a) - gy * Math.sin(a), y: bPose.c.y + gx * Math.sin(a) + gy * Math.cos(a)};
    const reachK = ease.inOutCubic(seg(u, ...W.pullReach));
    const backK = ease.inOutCubic(seg(u, ...W.withdraw));
    let hand;
    if (u < W.carry[0]) hand = {x: lerp(Pu.rest.x, grip.x, reachK), y: lerp(Pu.rest.y, grip.y, reachK)};
    else if (u < W.withdraw[0]) hand = grip;
    else {
      const away = {x: grip.x, y: Pu.rest.y};
      hand = {x: lerp(grip.x, away.x, backK), y: lerp(grip.y, away.y, backK)};
    }
    const lean = Pu.arm.reach * 0.99;
    const shoulder = {x: hand.x + Pu.dir.x * lean, y: hand.y + Pu.dir.y * lean};
    const posed = Pu.arm.pose(shoulder, hand, 1);
    Object.assign(nodes, posed.nodes);
    sem.pullHand = {x: r(posed.hand.x), y: r(posed.hand.y)};
    sem.pullGrip = {x: r(grip.x), y: r(grip.y)};
    sem.pullGripLen = r(Pu.gripLen * bPose.sc, 2);
    sem.pullReached = posed.reached;
    sem.pullHolding = u >= W.carry[0] && u < W.withdraw[0];
    // the carried piece stays whole inside B's table (never cut by the bench window)
    const e = extentOf(B.P.slots[k]);
    const pad = e.w * (bPose.sc - 1) + 4;
    const box = {x: bPose.c.x + e.x - pad, y: bPose.c.y + e.y - pad, w: e.w + 2 * pad, h: e.h + 2 * pad};
    const tb = B.sb;
    sem.pieceInTable = box.x >= tb.x && box.y >= tb.y && box.x + box.w <= tb.x + tb.w && box.y + box.h <= tb.y + tb.h;
 const tr = B.tray;
    sem.pieceInTray = Boolean(tr) && setK >= 1 && bPose.c.x + e.x >= tr.x - 0.5 && bPose.c.x + e.x + e.w <= tr.x + tr.w + 0.5 && bPose.c.y + e.y >= tr.y - 0.5 && bPose.c.y + e.y + e.h <= tr.y + tr.h + 0.5;
  }

  // ---- change markers in B
  const markK = seg(u, ...W.mark);
  if (L.ghostB) nodes.ghostB = {opacity: r(markK, 3)};
  if (L.doubt) {
    const pc = B.pieces[k];
    const c = bPose ? bPose.c : pc.slot.c;
    nodes.doubtB = {transform: T(c.x - pc.slot.dir.x * B.P.G.ra * 0.5, c.y - pc.slot.dir.y * B.P.G.ra * 0.5), opacity: r(markK, 3)};
  }
  if (L.legend) nodes['legend-mark'] = {opacity: r(seg(u, ...W.frame), 3)};

  // ---- guide, labels, tags, notes
  const gp = ease.inOutSine(seg(u, ...W.guide));
  nodes.guide = {'stroke-dashoffset': r(L.guide.len * (1 - gp)), opacity: gp > 0 ? 1 : 0};
  nodes['guide-end0'] = {opacity: gp > 0 ? 1 : 0};
  nodes['guide-end1'] = {opacity: gp >= 0.99 ? 1 : 0};
  if (L.guideLabel) nodes['guide-label-g'] = {opacity: r(seg(u, ...W.guideLabel), 3)};
  if (L.guideLabel && L.guideLabel.leader) nodes['guide-leader'] = {opacity: r(seg(u, ...W.guideLabel), 3)};
  for (const tg of L.tags) nodes[tg.node.attrs.name] = {opacity: r(seg(u, ...W.tags), 3)};
  if (L.shared) nodes['shared-g'] = {opacity: r(seg(u, 0.02, 0.1), 3)};
  if (L.changedChip) nodes['changed-g'] = {opacity: r(seg(u, ...W.changed), 3)};
  if (L.neutral) nodes['neutral-g'] = {opacity: r(seg(u, ...W.neutral), 3)};
  // the issue / assumptions note and the "as supplied" key are readable from the start
  if (L.note) nodes.note = {opacity: r(seg(u, 0.02, 0.1), 3)};

  // text sizes actually drawn, in output pixels at 1080p
  const pxOf = f => r((f.size * L.fitK) / L.per1080, 2);
  const minPx = kind => { const z = L.texts.filter(x => x.name.startsWith(kind)).map(x => pxOf(x.fit)); return z.length ? Math.min(...z) : null; };
  Object.assign(sem, {
    beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
    changedPiece: k,
    changedStatus: B.res.slots[k].status,
    framesShown: seg(u, ...W.frame) > 0.99,
    guideProgress: r(gp, 3),
    offsetB: {x: r(L.off.x), y: r(L.off.y)},
    sameGeometry: L.P.R === L.PB.R && Math.abs((L.PB.slots[0].c.x - L.P.slots[0].c.x) - L.off.x) < 0.01 && Math.abs((L.PB.slots[0].c.y - L.P.slots[0].c.y) - L.off.y) < 0.01,
    arrangement: L.SH.arr,
    gearR: r(L.P.R),
    text: {
      legend: minPx('legend'), caption: minPx('caption'), label: minPx('label'), chips: Math.min(...['changed', 'neutral', 'shared', 'guide'].map(minPx).filter(v => v !== null), 999),
      note: minPx('note'), rule: minPx('rule'),
      truncated: L.texts.filter(x => x.fit.truncated).map(x => x.name),
    },
    // mechanism size in output terms: gear diameter (px at 1080p) and each board's share of the
    // caption-safe box
    mechanism: {gearPx: r((2 * L.R * L.fitK) / L.per1080, 2), boardShare: r(Math.min(...L.sides.map(Sd => Sd.P.board.w * Sd.P.board.h)) * L.fitK * L.fitK / (ctx.view.content.w * ctx.view.content.h), 3)},
    notes: {shown: Boolean(L.note), issues: L.note ? L.note.issues : 0, assumptions: L.note ? L.note.assumptions : 0, key: Boolean(L.note && L.note.key)},
    fit: {legend: Boolean(L.legend), legendSide: Boolean(L.legend && L.SH.legendAt === 'side'),
      boardFits: L.sides.every(Sd => Sd.P.board.y >= Sd.sb.y - 1 && Sd.P.board.y + Sd.P.board.h <= Sd.sb.y + Sd.sb.h + 1 && Sd.P.board.x >= Sd.sb.x - 1 && Sd.P.board.x + Sd.P.board.w <= Sd.sb.x + Sd.sb.w + 1),
      trayFits: !L.pending || L.sides.every(Sd => Sd.tray.x >= Sd.sb.x && Sd.tray.x + Sd.tray.w <= Sd.sb.x + Sd.sb.w && Sd.tray.y >= Sd.sb.y && Sd.tray.y + Sd.tray.h <= Sd.sb.y + Sd.sb.h && !(Sd.tray.x < Sd.P.extents.x + Sd.P.extents.w && Sd.tray.x + Sd.tray.w > Sd.P.extents.x && Sd.tray.y < Sd.P.extents.y + Sd.P.extents.h && Sd.tray.y + Sd.tray.h > Sd.P.extents.y)),
      R: r(L.P.R)},
  });
  return {nodes, semantic: sem};
}

/**
 * Note with the author's issue(s) and assumption(s) and the reading key
 * "states as supplied · no conclusion is drawn" (always shown, even when the
 * author supplied no issue).
 */
function noteFor(ctx, p, o) {
  const th = ctx.theme;
  const t = ctx.t;
  const size = o.size;
  const pad = 14;
  const lines = [
    ...p.issues.map(s => ({text: `${t.issue}: ${s}`, weight: 700, italic: false, fill: th.ink})),
    ...p.assumptions.map(s => ({text: `${t.assumption}: ${s}`, weight: 500, italic: true, fill: th.ink})),
    {text: t.noConclusion, weight: 700, italic: false, fill: th.inkSoft, key: true},
  ];
  const fits = lines.map(ln => ctx.fit(ln.text, {maxWidth: o.w - 2 * pad, size, minSize: size, maxLines: 5, weight: ln.weight}));
  const hh = fits.reduce((a, f) => a + f.height, 0) + (fits.length - 1) * 8 + 2 * pad + 6;
  let top = 0;
  return {
    h: hh, fits, issues: p.issues.length, assumptions: p.assumptions.length, key: true,
    place(yy) { top = yy; },
    node() {
      let yy = top + pad + 6;
      const texts = fits.map((f, j) => {
        const nd = textBlock(f, {x: o.x + pad, y: yy, fill: lines[j].fill, italic: lines[j].italic});
        yy += f.height + 8;
        return nd;
      });
      const w = o.w;
      return g({name: 'note', opacity: 0},
        h('path', {d: roundRectPath(o.x + 4, top + 6, w, hh, 6), fill: th.shadow}),
        h('path', {d: roundRectPath(o.x, top, w, hh, 6), fill: '#fff6c9', stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: `M${r(o.x)} ${r(top + 5)}H${r(o.x + w)}`, stroke: '#e8d98a', 'stroke-width': 9, opacity: 0.8}),
        texts,
      );
    },
  };
}

/** The shared rule plaque (brass, same look as the board header). */
function plaqueArt(ctx, L) {
  const q = L.plaque;
  const f = L.hdr.fit, tg = L.hdr.tag;
  const brass = '#dcbb6e', brassDark = '#a17f36';
  const parts = [
    h('path', {d: roundRectPath(q.x + 5, q.y + 8, q.w, q.h, 16), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 16), fill: brass, stroke: brassDark, 'stroke-width': 3}),
    h('path', {d: roundRectPath(q.x + 7, q.y + 7, q.w - 14, q.h - 14, 11), fill: 'none', stroke: '#ecd7a2', 'stroke-width': 1.5}),
  ];
  if (f || tg) {
    const gap = tg ? 12 + tg.size * 0.35 : 0;
    const total = (f ? f.height : 0) + (tg ? tg.height + gap : 0);
    let y = q.y + (q.h - total) / 2;
    const cx = q.x + q.w / 2;
    if (tg) { parts.push(textBlockC(tg, cx, y, '#5c4712', 0.6)); y += tg.height + gap; }
    if (f) parts.push(textBlockC(f, cx, y, ctx.theme.ink));
  }
  return g({name: 'plaque'}, parts);
}

function textBlockC(fit, x, y, fill, ls) {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'text-anchor': 'middle', 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, fill, 'letter-spacing': ls},
    fit.truncated ? h('title', null, fit.full) : null,
    fit.lines.map((line, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, line)));
}

/** Orthogonal polyline with rounded corners; returns path data, length and ends. */
function orthoPath(pts, rad) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, l1 / 2, l2 / 2);
    const p1 = {x: b.x - ((b.x - a.x) / (l1 || 1)) * rr, y: b.y - ((b.y - a.y) / (l1 || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (l2 || 1)) * rr, y: b.y + ((c.y - b.y) / (l2 || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  const z = pts[pts.length - 1];
  d += `L${r(z.x)} ${r(z.y)}`;
  return {d, len, ends: [pts[0], z], pts};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-05-contrast',
    title: 'Cumulative conditions — all pieces supplied vs one piece pending, same test turn',
    titleEs: 'Condiciones acumulativas — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones acumulativas',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical bench scenes with the same pictogram gear board and fact pieces; a shared legend names each condition and the fact supplied for it. In B a hand lifts one piece out and sets it aside in a tray (pending), or the piece is left unseated (disputed); the pieces drop in with identical timing, both latches release at the same instant and both drives turn: A turns as a whole and its joint dial moves, B stops at the gap. A guide links the changed condition in both scenes; the issue, assumptions and an "as supplied" key are shown; a neutral note, no winner or outcome.',
    tags: ['reasoning', 'cumulative conditions', 'contrast', 'pending', 'disputed', 'gears', 'paired scenes', 'rule', 'facts', 'no outcome'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-acumulativas.js', 'src/frameworks/paired.js', 'src/primitives/desk.js', 'src/animations/causation/kits/place.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CA_STRINGS,
  scene,
});
