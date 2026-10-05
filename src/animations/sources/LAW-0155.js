/**
 * LAW-0155 — Interpretaciones concurrentes · contrast
 *
 * Storyboard — two complete reading desks (lane A, lane B) on one clock.
 * Everything the two scenes share is drawn ONCE, legibly, in a shared strip:
 * the passage reference and wording, the shared facts, the source book and
 * the editable hierarchy board. On each desk the passage slip is drawn as
 * word marks at the exact word positions of that shared wording, so both
 * desks trace the very same passage.
 *  [0.00–0.17] base: both desks identical and neutral — the passage slip on a
 *              light pad, a blank tracing overlay in the reading tray, a
 *              highlighter on its rest; the same hand reaches for the overlay.
 *  [0.17–0.40] change: the lane colours come up (A amber, B blue). In each
 *              desk the hand lays the overlay on the passage (the words are
 *              traced as word marks), takes the highlighter and sweeps it
 *              over the words ITS reading focuses on — reading A over its
 *              focus, reading B over its focus: a different stroke, length
 *              and path. The focus words are printed legibly (full text size)
 *              on the overlay from the moment they are traced.
 *  [0.40–0.77] parallel: in both desks the hand puts the highlighter back,
 *              takes the overlay by its tab and slides it into the tray; the
 *              attributed reading card (label, "proposed (as supplied)",
 *              reading, source) is laid on the light pad over the slip. The
 *              hand withdraws.
 *              (The slip's bars under the focus words fade out as the overlay
 *              lands, the others once the trace is complete, so no text ever
 *              sits on a bar; the card's opaque body is laid on the slip
 *              before its printing fades in.)
 *  [0.77–1.00] guide: a neutral outline around each filed overlay (clear of
 *              every glyph), its lettered disc and the standard Δ marker on
 *              the outline's corners, mark the one thing that differs — the
 *              highlighted span on each overlay — and a guide chip carrying
 *              the supplied changed fact joins them; the neutral note and the
 *              "as supplied · no conclusion drawn" key. No winner, score or
 *              legal consequence; both readings keep equal size and weight.
 * Each desk is filled by its two acting objects from the first frame: the
 * light pad (slip, later the card) and the tray (overlay); there is no empty
 * card slot. The passage line width is chosen so that these blocks fill the
 * most desk height at the largest text size.
 * Layouts: 16:9 = desks side by side over the shared strip (pad and tray
 * side by side in each desk); 9:16 = desks stacked, the guide between them;
 * 1:1 = desks side by side, each desk in a column (pad over tray).
 * @module animations/sources/LAW-0155
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r, ease} from '../../core/time.js';
import {mix, dist, ik2, roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {FONTS} from '../../core/text.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  icFields, IC_DEFAULTS, IC_STRINGS, kitT, icColors, laneOf, sourceOf, pxPerUnit,
  passageLayout, phraseSpan, spanText, passageText, overlayArt, overlayFrame, trayArt, trayLipH, readingCardArt, openBook, hierarchyBoard,
  notePlate, measureNote, fitWords, textOrBars, overlaps, inside, segmentHits,
} from './kits/interpretaciones-concurrentes.js';

const ID = 'LAW-0155';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  enter: [0.04, 0.16], tint: [0.17, 0.22], lay: [0.18, 0.26], trace: [0.25, 0.3], toPen: [0.26, 0.29], sweep: [0.315, 0.4],
  penBack: [0.4, 0.45], toTab: [0.45, 0.49], slide: [0.49, 0.61], release: [0.61, 0.63], out: [0.63, 0.71],
  // the card's opaque body is laid on the slip first; its text fades in only once the body covers the slip
  cardBody: [0.6, 0.64], card: [0.645, 0.72], rings: [0.77, 0.81], guide: [0.79, 0.85], note: [0.83, 0.89], key: [0.85, 0.9],
};
const GRIP_ON = W.enter[1];

const sceneSchema = {...icFields, ...contrastFields()};

const defaultParams = {
  ...IC_DEFAULTS,
  scenarioA: {label: 'Interpretation A', caption: 'as proposed by Commentary A (fictional)'},
  scenarioB: {label: 'Interpretation B', caption: 'as proposed by Commentary B (fictional)'},
  changedFact: 'Changed fact: which words the reading highlights',
  sharedFacts: ['Same passage and wording', 'Same hierarchy as supplied', 'Same desk, overlay and hand'],
  comparisonLabels: {guide: 'Changed fact', neutral: 'Both readings are supplied with the example; neither is shown as correct.'},
};

const STRINGS = {
  en: {...IC_STRINGS.en, tray: 'Reading tray', sameFacts: 'Same in A and B'},
  es: {...IC_STRINGS.es, tray: 'Bandeja de lectura', sameFacts: 'Igual en A y B'},
};

/** Neutral lane (before the change beat, and for the shared sheets/pens). */
function neutralLane(ctx) {
  const C = icColors(ctx);
  return {color: '#9aa3ab', soft: '#e3e7ea', band: '#d7dce0', ink: C.frameDark};
}

/* ------------------------------------------------------------------ */
/* Art: highlighter                                                    */
/* ------------------------------------------------------------------ */

/** Highlighter pen: local origin = the tip; the body points along `angle`. */
function highlighter(ctx, {F, name, angle = -8}) {
  const th = ctx.theme;
  const L = F * 5.2, wd = F * 0.72;
  const tipName = `${name}-tip`;
  return {
    node: g({transform: `rotate(${angle})`},
      h('path', {d: roundRectPath(F * 0.4, -wd / 2 + 5, L, wd, wd * 0.35), fill: th.shadow}),
      h('path', {d: `M0 0L${r(F * 0.55)} ${r(-wd * 0.32)}V${r(wd * 0.32)}Z`, fill: '#8b949c', stroke: th.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round'}),
      h('path', {name: tipName, d: `M0 0L${r(F * 0.55)} ${r(-wd * 0.32)}V${r(wd * 0.32)}Z`, fill: '#8b949c', opacity: 0}),
      h('path', {d: roundRectPath(F * 0.5, -wd / 2, L * 0.28, wd, wd * 0.25), fill: '#c5ccd2', stroke: th.ink, 'stroke-width': 1.8}),
      h('path', {d: roundRectPath(F * 0.5 + L * 0.26, -wd / 2, L * 0.74, wd, wd * 0.35), fill: '#eef1f3', stroke: th.ink, 'stroke-width': 1.8}),
      h('rect', {x: r(F * 0.5 + L * 0.34), y: r(-wd * 0.12), width: r(L * 0.5), height: r(wd * 0.12), rx: 2, fill: '#fff', opacity: 0.7})),
    grip: {x: Math.cos((angle * Math.PI) / 180) * L * 0.62, y: Math.sin((angle * Math.PI) / 180) * L * 0.62},
    tipName,
  };
}

/* ------------------------------------------------------------------ */
/* Lane (one complete desk)                                            */
/* ------------------------------------------------------------------ */

/**
 * Measure and place one lane in its local coordinates. Both lanes use the
 * same geometry; only the supplied focus (span) differs.
 */
/**
 * Scale of the desks' passage relative to the text size: 1 in every ratio, so
 * the words each reading highlights are printed legibly (full text size) on
 * each desk's overlay from the moment they are traced.
 */
const markScale = () => 1;

/**
 * The slip's word marks (same geometry as the kit's placeholder bars). The bars of the words this
 * lane's reading highlights sit in their own named group: they fade out as the overlay lands on
 * the slip, so the legible traced words never sit on top of a bar (no struck-through look).
 */
function slipBars(PL, span, {x, y, fill, name}) {
  const i0 = span ? span.i0 : -1, i1 = span ? span.i1 : -2;
  const bar = (line, wd) => h('rect', {'data-bar': 1, x: r(wd.x), y: r(line.y + PL.size * 0.3), width: r(Math.max(4, wd.w)), height: r(PL.size * 0.46), rx: r(PL.size * 0.2), fill, opacity: 0.55});
  const rest = [], focus = [];
  PL.lines.forEach(line => line.words.forEach(wd => (wd.i >= i0 && wd.i <= i1 ? focus : rest).push(bar(line, wd))));
  return g({transform: T(x, y)}, g({name: name.replace('focus', 'rest')}, rest), g({name}, focus));
}

function laneGeometry(ctx, {F, LW, mode, PL, p, t, k, mark, cardH = 0}) {
  const Fm = F * mark;
  const tight = mode === 'tall';
  const pad = F * (tight ? 0.5 : 0.8), gp = F * (tight ? 0.45 : 0.8), gi = F * (tight ? 0.35 : 0.5), rim = Math.max(10, F * (tight ? 0.45 : 0.6));
  const tabW = Math.max(Fm * 1.5, 30);
  const span = phraseSpan(PL, p.interpretations[k].focus);
  const ov = overlayArt(ctx, {prefix: `ov${k}`, PL, F: Fm, lane: neutralLane(ctx), bandLane: laneOf(ctx, k), letter: k ? 'B' : 'A', side: 'right', span, pad: Fm * 0.8, focusOnly: true, marksOnly: false, focusWeight: PL.weight, tabName: `ov${k}-tab`});
  // header: letter badge + supplied label + caption
  const sc = k ? p.scenarioB : p.scenarioA;
  const R = F * 0.85;
  const lab = fitWords(ctx, sc.label, {maxWidth: LW - pad * 2 - R * 2 - F * 0.6, size: F, minSize: F, maxLines: 2, weight: 800});
  const cap = sc.caption ? fitWords(ctx, sc.caption, {maxWidth: LW - pad * 2 - R * 2 - F * 0.6, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
  // the caption shares the label's line when both fit on it
  const capInline = cap && lab.lines.length === 1 && cap.lines.length === 1 && lab.width + F * 0.8 + cap.width <= LW - pad * 2 - R * 2 - F * 0.6;
  const headH = Math.max(R * 2, lab.height + (cap && !capInline ? cap.height + F * 0.4 : 0)) + pad;
  // the highlighter rests in the header row when the labels leave room, else on the light pad's rail
  const textRight = pad + R * 2 + F * 0.6 + Math.max(lab.width, cap ? cap.width : 0);
  // (always on the pad rail: both desks keep identical geometry whatever their header text)
  const penInHead = false && LW - pad - textRight >= F * 7;
  // light pad with the slip (word marks at the shared passage's word boxes)
  const slipPadX = Fm * 0.8;
  const slip = {w: PL.w + slipPadX * 2, h: PL.h + Fm * 1.3};
  // tall desks: the highlighter lies beside the pad; wide desks: on the pad's lower rail
  const penBeside = mode === 'tall';
  // the light pad is large enough to receive the reading card on the slip once the overlay has left it
  const padBox = {w: Math.max(slip.w + gp * 1.2 + tabW, penBeside ? 0 : F * 6.4), h: Math.max(slip.h, cardH) + gp * 1.2 + (penInHead || penBeside ? 0 : F * 0.5)};
  const trayW = ov.w + tabW + gi * 3 + rim * 2;
  const lipH = trayLipH(ctx, {w: trayW, F, label: null, rim});
  const trayH = rim + gi + ov.h + gi + lipH;
  const out = {span, ov, lab, cap, capInline, headH, R, slip, padBox, trayW, trayH, lipH, tabW, gi, rim, pad};
  if (mode === 'wide') {
    // [pad | tray] side by side, card below across the lane
    const rowY = headH + gp * 0.4;
    out.pad = {x: pad, y: rowY, w: padBox.w, h: padBox.h};
    out.tray = {x: LW - pad - trayW, y: rowY, w: trayW, h: trayH};
    out.fitsW = out.pad.x + out.pad.w + gp <= out.tray.x;
    out.cardW = LW - pad * 2;
    out.cardY = rowY + Math.max(padBox.h, trayH) + gp * 0.8;
  } else if (mode === 'split') {
    // left column: pad over tray (the overlay slides down); the card fills the right column
    const rowY = headH + gp * 0.4;
    const colL = Math.max(padBox.w, trayW);
    out.pad = {x: pad + (colL - padBox.w) / 2, y: rowY, w: padBox.w, h: padBox.h};
    out.tray = {x: pad + (colL - trayW) / 2, y: rowY + padBox.h + gp * 0.8, w: trayW, h: trayH};
    out.cardX = pad + colL + gp;
    out.cardW = LW - out.cardX - pad;
    out.fitsW = out.cardW >= F * 10;
    out.cardY = rowY;
  } else {
    // column: pad, tray, card
    const rowY = headH + gp * 0.4;
    out.pad = {x: pad, y: rowY, w: padBox.w, h: padBox.h};
    out.tray = {x: pad, y: rowY + padBox.h + gp * 0.8, w: trayW, h: trayH};
    out.fitsW = padBox.w + F * 4.6 <= LW - pad * 2 + 0.5 && trayW <= LW - pad * 2 + 0.5;
    out.cardW = LW - pad * 2;
    out.cardY = out.tray.y + trayH + gp * 0.7;
  }
  if (out.cardX === undefined) out.cardX = pad;
  out.slipAt = {x: out.pad.x + gp * 0.6, y: out.pad.y + gp * 0.6 + Math.max(0, cardH - slip.h) / 2};
  out.textAt = {x: out.slipAt.x + slipPadX, y: out.slipAt.y + Fm * 0.65};
  out.onSlip = {x: out.textAt.x - ov.text.x, y: out.textAt.y - ov.text.y};
  if (mode !== 'split') {
    // the reading card is laid on the slip, on the light pad, once the overlay is filed in the tray
    out.cardX = out.slipAt.x;
    out.cardY = out.pad.y + gp * 0.6;
    // (the card covers the slip and the pad's free margin where the overlay's tab stood)
    out.cardW = out.pad.w - gp * 1.2;
  }
  const fl = {x: out.tray.x + rim, y: out.tray.y + rim};
  out.rest = {x: fl.x + gi, y: fl.y + gi};
  // highlighter rest: lying on the light pad's lower rail
  out.pen = highlighter(ctx, {F: F * 0.8, name: `pen${k}`, angle: 0});
  out.penRest = penInHead ? {x: LW - pad - F * 6, y: headH / 2} : penBeside ? {x: out.pad.x + out.pad.w + F * 0.35, y: out.pad.y + out.pad.h * 0.55} : {x: out.pad.x + out.pad.w - F * 5.2, y: out.pad.y + out.pad.h - F * 0.05};
  out.penInHead = penInHead;
  return out;
}

function tryLayout(ctx, F, modeIn, plK = 1) {
  const p = ctx.params;
  const t = kitT(ctx);
  const C = icColors(ctx);
  const shape = ctx.view.shape;
  const Wd = ctx.design.w, Hd = ctx.design.h;
  const m = F * (shape === 'square' ? 0.4 : 0.7), gap = F * (shape === 'square' ? 0.7 : 1.1);
  let fits = true;
  const need = c => { if (!c) fits = false; };
  // 16:9: desks side by side over a shared strip; 9:16: desks stacked over a shared strip;
  // 1:1: desks stacked beside a shared column
  const row = shape !== 'portrait';
  // (a shared side column is supported for narrow-high frames; the three ratios use the strip)
  const colMode = false;
  const colW = colMode ? clamp(Wd * 0.27, F * 11.5, F * 16) : 0;
  const LW = row ? (Wd - m * 2 - gap) / 2 : colMode ? Wd - m * 2 - gap - colW : Wd - m * 2;
  const mode = modeIn || 'wide';
  // the lanes' passage layout (same for both); in wide lanes the slip and tray share the width
  const mark = markScale(shape);
  const tabW = Math.max(F * 1.5, 30);
  // (plK: narrower passage lines give taller slip / overlay blocks that fill the desk)
  const PLw = mode === 'split' ? Math.min(F * 12 * plK, LW - F * 1.6 - F * 0.8 - F * 12 - (tabW * 2 + F * 3)) : mode === 'wide' ? Math.min(F * 12 * plK, (LW - F * 1.6 - F * 0.8 - (tabW * 2 + F * 5 + 28)) / 2) : Math.min(F * 13 * plK, LW - F * 1.6 - tabW * 2 - F * 3 - 28);
  const PL = passageLayout(ctx, p.passages.text, {w: PLw, size: F * mark});
  need(PL.fitsWords && PLw > F * 5, 'PL');
  const lanes0 = [0, 1].map(k => laneGeometry(ctx, {F, LW, mode, PL, p, t, k, mark}));
  // headers must be equally tall (identical geometry)
  // cards (equal size)
  // one shared label wrap width for both cards: narrowed until both headers take the same number of lines
  let labelMaxWidth;
  const mkCard = (k, minH) => readingCardArt(ctx, {labelMaxWidth, w: lanes0[k].cardW, F, lane: laneOf(ctx, k), letter: k ? 'B' : 'A', label: p.interpretations[k].label, text: p.interpretations[k].text, by: p.sources[sourceOf(p, k)].title, proposed: t.proposed, minH, inlineSub: true, round: k === 1, compact: mode === 'tall'});
  {
    const probe = () => [mkCard(0), mkCard(1)];
    let pc = probe();
    const full = lanes0[0].cardW;
    for (let f = 0.95; pc[0].headLines !== pc[1].headLines && f >= 0.5; f -= 0.05) {
      labelMaxWidth = full * f;
      pc = probe();
    }
    if (pc[0].headLines !== pc[1].headLines) labelMaxWidth = undefined;
  }
  const cardH = Math.max(mkCard(0).natural, mkCard(1).natural);
  const headH = Math.max(lanes0[0].headH, lanes0[1].headH);
  const cards = [mkCard(0, cardH), mkCard(1, cardH)];
  // equal weight: both card headers at one size with the same line count and layout
  need(cards[0].headLines === cards[1].headLines && cards[0].subLines === cards[1].subLines && cards[0].inline === cards[1].inline && cards[0].labSize === cards[1].labSize && cards.every(c => c.headerWhole));
  // the lanes again, with the light pad sized to receive the card
  const lanes = [0, 1].map(k => laneGeometry(ctx, {F, LW, mode, PL, p, t, k, mark, cardH}));
  need(lanes.every(l => l.fitsW), 'laneW');
  const dy = headH - lanes[0].headH;
  // (both lanes computed with their own header; shift to the common header height)
  lanes.forEach(l => {
    const d = headH - l.headH;
    for (const key of ['pad', 'tray']) l[key] = {...l[key], y: l[key].y + d};
    l.cardY += d;
    l.slipAt.y += d; l.textAt.y += d; l.onSlip.y += d; l.rest.y += d;
    l.headH = headH;
  });
  void dy;
  const laneH = Math.max(lanes[0].cardY + cardH, lanes[0].tray.y + lanes[0].trayH, lanes[0].pad.y + lanes[0].pad.h) + F * (mode === 'tall' ? 0.5 : 0.8);
  // shared strip: plate (same facts, reference, passage) + board + book, guide row below
  // footer: guide group, neutral note and key share the width; pick the split with the lowest row
  const fw = Wd - m * 2 - gap * 2 - F * 3.2;
  const Rb = F * 0.66;
  let foot = null;
  for (const gf of [0.26, 0.3, 0.34, 0.38, 0.43]) {
    for (const kf of [0.14, 0.17, 0.2, 0.24]) {
      const nf = 1 - gf - kf;
      const gMax = colMode ? Math.min(F * 22, LW - (Rb * 2 + F) * 2) : Math.min(F * 18, fw * gf);
      const nMax = colMode ? colW : Math.min(F * 24, fw * nf), kMax = colMode ? colW : Math.min(F * 14, fw * kf);
      const gc = measureNote(ctx, p.changedFact, {maxWidth: gMax, size: F, weight: 700, maxLines: 4});
      const nm = measureNote(ctx, p.comparisonLabels.neutral, {maxWidth: nMax, size: F, weight: 500, maxLines: 5});
      const km = measureNote(ctx, t.key, {maxWidth: kMax, size: F * 0.9, weight: 600, maxLines: 3});
      if ([gc, nm, km].some(q => q.fit.truncated)) continue;
      if (!colMode && gc.w + (Rb * 2 + F) * 2 + nm.w + km.w + gap * 2 > Wd - m * 2) continue;
      const hh = colMode ? Math.max(gc.h, Rb * 2) : Math.max(gc.h, nm.h, km.h, Rb * 2);
      if (!foot || hh < foot.hh - 0.5) foot = {hh, gMax, nMax, kMax, gc, nm, km};
    }
  }
  need(Boolean(foot), 'footer truncated');
  if (!foot) {
    const gMax = fw * 0.35, nMax = fw * 0.45, kMax = fw * 0.2;
    foot = {gMax, nMax, kMax, gc: measureNote(ctx, p.changedFact, {maxWidth: gMax, size: F, weight: 700, maxLines: 4}), nm: measureNote(ctx, p.comparisonLabels.neutral, {maxWidth: nMax, size: F, weight: 500, maxLines: 5}), km: measureNote(ctx, t.key, {maxWidth: kMax, size: F * 0.9, weight: 600, maxLines: 3})};
  }
  const {gMax, nMax, kMax} = foot;
  const guideChip = foot.gc, noteM = foot.nm, keyM = foot.km;
  // guide row: [A] — changed fact — [B] (the letters match the rings on the two overlays)
  const guideM = {w: guideChip.w + (Rb * 2 + F) * 2, h: Math.max(guideChip.h, Rb * 2)};
  // shared strip: book | plate (same facts, reference, passage) | board — split for the lowest strip
  const stripW = Wd - m * 2;
  let strip = null;
  if (colMode) {
    const board = hierarchyBoard(ctx, {prefix: 'board', w: colW, F, p, t, stack: colW < F * 13});
    const book = openBook(ctx, {prefix: 'book', w: colW, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
    const plate = sharedPlate(ctx, {w: colW, F, p, t});
    strip = {hh: 0, boardW: colW, bookW: colW, plateW: colW, board, book, plate};
  }
  for (const bf of colMode ? [] : [0.26, 0.3, 0.35, 0.4, 0.45, 0.5]) {
    for (const kf of [0.14, 0.17, 0.2, 0.24, 0.28]) {
      const boardW = Math.min(F * 24, stripW * bf), bookW = Math.min(F * 16, stripW * kf);
      const plateW = stripW - boardW - bookW - gap * 2;
      if (plateW < F * 12) continue;
      const book = openBook(ctx, {prefix: 'book', w: bookW, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
      const plate = sharedPlate(ctx, {w: plateW, F, p, t});
      for (const columns of [false, true]) {
        const board = hierarchyBoard(ctx, {prefix: 'board', w: boardW, F, p, t, stack: boardW < F * 13, columns});
        if (board.truncated) continue;
        const hh = Math.max(board.h, book.h, plate.h);
        if (!strip || hh < strip.hh - 0.5) strip = {hh, boardW, bookW, plateW, board, book, plate};
      }
    }
  }
  const {boardW, bookW, plateW, board, book, plate} = strip;
  const stripH = strip.hh;
  const guideRowH = colMode ? guideM.h : Math.max(guideM.h, noteM.h, keyM.h);
  let laneBox, stripY, guideAt, noteAt, keyAt;
  if (row) {
    const top = m;
    laneBox = [{x: m, y: top, w: LW, h: laneH}, {x: m + LW + gap, y: top, w: LW, h: laneH}];
    stripY = top + laneH + gap * 0.9;
    const gy = stripY + stripH + gap * 0.7;
    need(gy + guideRowH <= Hd - m * 0.6, `height lane ${Math.round(laneH)} (head ${Math.round(headH)} pad ${Math.round(lanes[0].padBox.h)} tray ${Math.round(lanes[0].trayH)} card ${Math.round(cardH)}) strip ${Math.round(stripH)} (board ${Math.round(board.h)} book ${Math.round(book.h)} plate ${Math.round(plate.h)}) foot ${Math.round(guideRowH)} H ${Math.round(Hd)} F ${Math.round(F)}`);
    const rowW = guideM.w + noteM.w + keyM.w + gap * 2;
    need(rowW <= stripW, 'guideRow');
    const gx = m + (stripW - rowW) / 2;
    guideAt = {x: gx, y: gy};
    noteAt = {x: gx + guideM.w + gap, y: gy};
    keyAt = {x: gx + guideM.w + gap + noteM.w + gap, y: gy};
  } else if (colMode) {
    // stacked desks, the guide between them; the shared column on the right
    const between = guideRowH + gap * 1.2;
    laneBox = [{x: m, y: m, w: LW, h: laneH}, {x: m, y: m + laneH + between, w: LW, h: laneH}];
    need(laneBox[1].y + laneH <= Hd - m * 0.6, `height lane ${Math.round(laneH)} (head ${Math.round(headH)} pad ${Math.round(lanes[0].padBox.h)} tray ${Math.round(lanes[0].trayH)} card ${Math.round(cardH)}) guide ${Math.round(guideRowH)} H ${Math.round(Hd)} F ${Math.round(F)} LW ${Math.round(LW)} PLw ${Math.round(PLw)}`);
    guideAt = {x: m + (LW - guideM.w) / 2, y: m + laneH + gap * 0.6};
    const cx = m + LW + gap;
    let cy = m;
    const place = hh => { const y = cy; cy += hh + gap * 0.6; return y; };
    stripY = cy;
    const yBook = place(book.h), yPlate = place(plate.h), yBoard = place(board.h);
    noteAt = {x: cx, y: place(noteM.h)};
    keyAt = {x: cx, y: place(keyM.h)};
    need(cy - gap * 0.6 <= Hd - m * 0.6, 'column height');
    strip.col = {cx, yBook, yPlate, yBoard};
  } else {
    // stacked lanes; the guide sits in the gap between them
    const top = m;
    const between = guideRowH + gap * 1.2;
    laneBox = [{x: m, y: top, w: LW, h: laneH}, {x: m, y: top + laneH + between, w: LW, h: laneH}];
    const gy = top + laneH + gap * 0.6;
    guideAt = {x: (Wd - guideM.w) / 2, y: gy};
    const rest = Wd - m * 2 - guideM.w - F * 0.4 - gap;
    need(noteM.w + keyM.w + gap <= rest || true, 'x');
    stripY = laneBox[1].y + laneH + gap * 0.9;
    const ny = stripY + stripH + gap * 0.7;
    const rowW = noteM.w + keyM.w + gap;
    need(rowW <= stripW, 'guideRow');
    noteAt = {x: m + (stripW - rowW) / 2, y: ny};
    keyAt = {x: noteAt.x + noteM.w + gap, y: ny};
    need(ny + Math.max(noteM.h, keyM.h) <= Hd - m * 0.6, 'height');
  }
  // strip / column positions
  const bookAt = strip.col ? {x: strip.col.cx, y: strip.col.yBook} : {x: m, y: stripY + (stripH - book.h) / 2};
  const plateAt = strip.col ? {x: strip.col.cx, y: strip.col.yPlate} : {x: m + bookW + gap, y: stripY};
  const boardAt = strip.col ? {x: strip.col.cx, y: strip.col.yBoard} : {x: m + bookW + gap + plateW + gap, y: stripY};
  // the outlines: around each whole overlay (sheet + tab) once it rests in its tray, so they never
  // cross a glyph; the overlay's highlight is the one fact that differs (world coords)
  const ringOf = k => {
    const l = lanes[k], lb = laneBox[k];
    const pd = F * 0.28;
    const x1 = Math.max(l.ov.w, l.ov.tabBox.x + l.ov.tabBox.w);
    return {x: lb.x + l.rest.x - pd, y: lb.y + l.rest.y - pd, w: x1 + pd * 2, h: l.ov.h + pd * 2};
  };
  const rings = [ringOf(0), ringOf(1)];
  // arms: one per lane, identical geometry (shoulder below the lane in wide lanes, at the right edge in tall lanes)
  const ARM = F * 2;
  const HAND = 24 * 1.3 * (ARM / 46);
  const l0 = lanes[0];
  const gripRest = {x: l0.rest.x + l0.ov.grip.x, y: l0.rest.y + l0.ov.grip.y};
  const gripSlip = {x: l0.onSlip.x + l0.ov.grip.x, y: l0.onSlip.y + l0.ov.grip.y};
  const penGrip = {x: l0.penRest.x + l0.pen.grip.x, y: l0.penRest.y + l0.pen.grip.y};
  // farthest sweep point: the start of the first line of either lane's span (pen grip above it)
  const sweepPts = lanes.flatMap(l => (l.ov.rects.length ? l.ov.rects : [{x: l.ov.text.x, y: l.ov.text.y, w: PL.w, h: PL.h}]).flatMap(q => [
    {x: l.onSlip.x + q.x + l.pen.grip.x, y: l.onSlip.y + q.y + q.h / 2 + l.pen.grip.y},
    {x: l.onSlip.x + q.x + q.w + l.pen.grip.x, y: l.onSlip.y + q.y + q.h / 2 + l.pen.grip.y}]));
  const tg = [gripRest, gripSlip, penGrip, ...sweepPts];
  let shoulder, dir;
  if (mode !== 'tall') {
    shoulder = {x: l0.tray.x + l0.tray.w * 0.35, y: laneH + F * 3};
    dir = {x: 0, y: -1};
  } else {
    shoulder = {x: LW + F * 3, y: l0.tray.y + l0.tray.h * 0.3};
    dir = {x: -1, y: 0};
  }
  const dmax = Math.max(...tg.map(q => dist(shoulder, q)));
  const Larm = Math.max(F * 8, (dmax * 1.06 - HAND) / 2);
  const sOut = {x: shoulder.x - dir.x * Larm * 1.5, y: shoulder.y - dir.y * Larm * 1.5};
  const handOut = {x: sOut.x + dir.x * Larm * 1.25, y: sOut.y + dir.y * Larm * 1.25};
  const e1 = ik2(shoulder, gripSlip, Larm, Larm + HAND, 1).elbow, e2 = ik2(shoulder, gripSlip, Larm, Larm + HAND, -1).elbow;
  const bend = mode !== 'tall' ? (e1.x > e2.x ? 1 : -1) : (e1.y > e2.y ? 1 : -1);
  const look = actorLook(ctx, null, 0);
  const rigs = [0, 1].map(k => topArm(ctx, {name: `arm${k}`, skin: look.skin, sleeve: look.outfit, handed: 'right', upper: Larm, lower: Larm, width: ARM}));
  // checks
  const deskBox = {x: 0, y: 0, w: Wd, h: Hd};
  need(laneBox.every(b => inside(b, deskBox, 0.5)), 'lanes inside');
  const stripBoxes = [{x: bookAt.x, y: bookAt.y, w: bookW, h: book.h}, {x: plateAt.x, y: plateAt.y, w: plateW, h: plate.h}, {x: boardAt.x, y: boardAt.y, w: boardW, h: board.h}];
  need(stripBoxes.every(b => inside(b, deskBox, 0.5)), 'strip inside');
  const guideBox = {x: guideAt.x, y: guideAt.y, w: guideM.w, h: guideM.h};
  const noteBox = {x: noteAt.x, y: noteAt.y, w: noteM.w, h: noteM.h};
  const keyBox = {x: keyAt.x, y: keyAt.y, w: keyM.w, h: keyM.h};
  const cardBoxes = lanes.map((l, k) => ({x: laneBox[k].x + l.cardX, y: laneBox[k].y + l.cardY, w: l.cardW, h: cardH}));
  const footerClear = [guideBox, noteBox, keyBox].every((a, i, arr) => arr.every((b, j) => j <= i || !overlaps(a, b, 2))) &&
    [guideBox, noteBox, keyBox].every(a => ![...stripBoxes, ...laneBox].some(b => overlaps(a, b, 0)) && inside(a, deskBox, 0.5));
  need(footerClear, 'footer');
  const guideClear = footerClear;
  const keyPx = F * pxPerUnit(ctx);
  const suppliedMin = Math.min(...cards.map(c => c.minSupplied), plate.minSize, board.minSupplied);
  return {
    fits, F, shape, Wd, Hd, mode, LW, PL, lanes, cards, cardH, laneBox, laneH, headH, stripY, stripH, plate, plateAt, plateW, board, boardAt, boardW, book, bookAt, bookW,
    guideM, guideChip, Rb, gMax, nMax, kMax, noteM, keyM, guideAt, noteAt, keyAt, rings, guideClear, footerClear, shoulder, sOut, handOut, dir, bend, rigs, Larm, keyPx, suppliedMin, row,
  };
}

/**
 * Shared-content plate: what the two scenes have in common, printed once —
 * the shared facts, the passage reference and the passage wording.
 */
function sharedPlate(ctx, {w, F, p, t}) {
  const th = ctx.theme;
  const key = ctx.show('key'), all = ctx.show('all');
  const pad = F * 0.7;
  const iw = w - pad * 2;
  const nodes = [];
  let y = pad * 0.8;
  // "Same in A and B" heads the shared facts (one paragraph, the heading word in the key colour row)
  const head = fitWords(ctx, `${t.sameFacts}:`, {maxWidth: iw, size: F * 0.9, minSize: F * 0.86, maxLines: 2, weight: 800});
  const fits = [head];
  if (p.sharedFacts.length) {
    const joined = p.sharedFacts.join(' · ');
    const inlineW = head.width + F * 0.4;
    const firstFit = head.lines.length === 1 ? fitWords(ctx, joined, {maxWidth: iw - inlineW, size: F, minSize: F, maxLines: 1, weight: 500}) : null;
    if (firstFit && !firstFit.truncated) {
      nodes.push(textOrBars(ctx, head, key, {x: pad, y: y + (F - head.size) * 0.5, fill: th.inkSoft}));
      nodes.push(textOrBars(ctx, firstFit, all, {x: pad + inlineW, y, fill: th.ink}));
      fits.push(firstFit);
      y += Math.max(head.height, firstFit.height) + F * 0.45;
    } else {
      nodes.push(textOrBars(ctx, head, key, {x: pad, y, fill: th.inkSoft}));
      y += head.height + F * 0.42;
      const ff = fitWords(ctx, joined, {maxWidth: iw, size: F, minSize: F, maxLines: 6, weight: 500});
      nodes.push(textOrBars(ctx, ff, all, {x: pad, y, fill: th.ink}));
      fits.push(ff);
      y += ff.height + F * 0.45;
    }
  } else {
    nodes.push(textOrBars(ctx, head, key, {x: pad, y, fill: th.inkSoft}));
    y += head.height + F * 0.45;
  }
  nodes.push(h('line', {x1: r(pad), x2: r(w - pad), y1: r(y - F * 0.2), y2: r(y - F * 0.2), stroke: th.paperLine, 'stroke-width': 1.5}));
  const ref = fitWords(ctx, p.passages.ref, {maxWidth: iw, size: F, minSize: F, maxLines: 4, weight: 800});
  nodes.push(textOrBars(ctx, ref, all, {x: pad, y, fill: th.ink}));
  fits.push(ref);
  y += ref.height + F * 0.55;
  const PL = passageLayout(ctx, p.passages.text, {w: iw, size: F});
  nodes.push(passageText(ctx, PL, {x: pad, y, fill: th.ink, barColor: th.inkSoft}));
  y += PL.h + pad * 0.8;
  const hh = y;
  const node = g(null,
    h('path', {d: roundRectPath(6, 8, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
    h('rect', {x: 0, y: r(Math.max(12, hh * 0.05)), width: 7, height: r(hh - Math.max(24, hh * 0.1)), rx: 3, fill: icColors(ctx).book}),
    nodes);
  return {node, w, h: hh, minSize: Math.min(...fits.slice(1).map(f => f.size), PL.size)};
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const scene = {
  sizes: {landscape: [1600, 800], square: [1100, 860], portrait: [1000, 1400]},
  layout(ctx) {
    // opt-in: mark the kit's placeholder bars (rendered text-over-bar test)
    ctx.icMarkBars = true;
    const ppu = pxPerUnit(ctx);
    let last = null;
    // 1:1 desks try a column inside each desk (pad, tray, card) and then the side-by-side row;
    // narrower passage lines first (taller blocks that fill the desk)
    const modes = ctx.view.shape === 'square' ? ['tall', 'wide'] : ['wide'];
    const pxs = [];
    for (let px = 25; px >= 16; px -= 0.4) pxs.push(px);
    pxs.push(16);
    for (const px of pxs) {
      for (const mode of modes) {
        // among the passage widths that fit, the one whose blocks fill the most desk height
        let best = null;
        for (const plK of [0.7, 0.8, 0.9, 1, 1.15, 1.3, 1.4, 1.5]) {
          const L = tryLayout(ctx, px / ppu, mode, plK);
          if (L.fits && (!best || L.laneH > best.laneH + 0.5)) best = L;
          last = L;
        }
        if (best) return best;
      }
    }
    return last;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = icColors(ctx);
    const t = kitT(ctx);
    const p = ctx.params;
    const F = L.F;
    const desk = deskWindow(ctx, {prefix: 'desk', x: 0, y: 0, w: L.Wd, h: L.Hd, radius: 26, mat: false});
    const laneNode = k => {
      const l = L.lanes[k], lb = L.laneBox[k];
      const lane = laneOf(ctx, k);
      const N = neutralLane(ctx);
      const win = deskWindow(ctx, {prefix: `lane${k}`, x: 0, y: 0, w: lb.w, h: lb.h, radius: 18, wood: shade(th.woodTop, 0.12), seedKey: 'lane'});
      const R = l.R;
      const hx = l.pad.x, hy = F * 0.35;
      const tray = trayArt(ctx, {w: l.tray.w, h: l.tray.h, lane: N, letter: k ? 'B' : 'A', label: null, F, rim: l.rim});
      const slip = g(null,
        h('path', {d: roundRectPath(l.pad.x, l.pad.y, l.pad.w, l.pad.h, 12), fill: '#b9c2c9', stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: roundRectPath(l.pad.x + 6, l.pad.y + 6, l.pad.w - 12, l.pad.h - 12, 9), fill: C.glassOn}),
        h('path', {d: roundRectPath(l.slipAt.x + 5, l.slipAt.y + 7, l.slip.w, l.slip.h, 4), fill: th.shadow}),
        h('path', {d: roundRectPath(l.slipAt.x, l.slipAt.y, l.slip.w, l.slip.h, 4), fill: C.slip, stroke: th.ink, 'stroke-width': 1.8}),
        h('rect', {x: r(l.slipAt.x), y: r(l.slipAt.y), width: r(Math.max(8, F * 0.35)), height: r(l.slip.h), fill: C.book, stroke: th.ink, 'stroke-width': 1.2}),
        slipBars(L.PL, l.span, {x: l.textAt.x, y: l.textAt.y, fill: th.inkSoft, name: `slipfocus${k}`}));
      const head = g(null,
        h('circle', {cx: r(hx + R), cy: r(hy + R), r: r(R), fill: N.color, stroke: th.ink, 'stroke-width': 2.2}),
        g({name: `lanetint${k}`, opacity: 0}, h('circle', {cx: r(hx + R), cy: r(hy + R), r: r(R), fill: lane.color, stroke: th.ink, 'stroke-width': 2.2})),
        ctx.show('key') ? h('text', {x: r(hx + R), y: r(hy + R + R * 0.38), 'text-anchor': 'middle', 'font-size': r(R * 1.1), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, k ? 'B' : 'A') : null,
        textOrBars(ctx, l.lab, ctx.show('key'), {x: hx + R * 2 + F * 0.6, y: l.capInline || !l.cap ? hy + (R * 2 - l.lab.height) / 2 : hy, fill: th.ink}),
        l.cap ? textOrBars(ctx, l.cap, ctx.show('all'), l.capInline
          ? {x: hx + R * 2 + F * 0.6 + l.lab.width + F * 0.8, y: hy + (R * 2 - l.cap.height) / 2, fill: th.inkSoft}
          : {x: hx + R * 2 + F * 0.6, y: hy + l.lab.height + F * 0.4, fill: th.inkSoft}) : null);
      return g({transform: T(lb.x, lb.y)},
        win.surface,
        g({'clip-path': win.clip},
          head, slip,
          g({transform: T(l.tray.x, l.tray.y)}, tray.node),
          g({name: `cardbody${k}`, opacity: 0, transform: T(l.cardX, l.cardY)},
            h('path', {d: roundRectPath(6, 8, L.cards[k].w, L.cards[k].h, 10), fill: th.shadow}),
            h('path', {d: roundRectPath(0, 0, L.cards[k].w, L.cards[k].h, 10), fill: C.card, stroke: shade(laneOf(ctx, k).color, -0.25), 'stroke-width': 2.2})),
          g({name: `card${k}`, opacity: 0, transform: T(l.cardX, l.cardY)}, L.cards[k].node),
          g({name: `film${k}`, transform: T(l.rest.x, l.rest.y)}, l.ov.node),
          g({name: `pen${k}`, transform: T(l.penRest.x, l.penRest.y)}, l.pen.node),
          g(null, L.rigs[k].arm, L.rigs[k].palm, L.rigs[k].thumb)),
        win.frame);
    };
    const Rb = L.Rb;
    const gcy = L.guideAt.y + L.guideM.h / 2;
    const chipX = L.guideAt.x + Rb * 2 + F;
    const guideN = notePlate(ctx, {text: p.changedFact, x: chipX, y: gcy - L.guideChip.h / 2, maxWidth: L.gMax, size: F, weight: 700, maxLines: 4, color: th.inkSoft, level: 'all'});
    const badge = (k, cx) => g(null,
      h('circle', {cx: r(cx), cy: r(gcy), r: r(Rb), fill: laneOf(ctx, k).soft, stroke: laneOf(ctx, k).color, 'stroke-width': 3}),
      ctx.show('key') ? h('text', {x: r(cx), y: r(gcy + Rb * 0.42), 'text-anchor': 'middle', 'font-size': r(F * 0.9), 'font-weight': 800, 'font-family': FONTS.sans, fill: th.ink}, k ? 'B' : 'A') : null);
    const bx = L.guideAt.x + L.guideM.w - Rb;
    const guideG = g(null,
      h('line', {x1: r(L.guideAt.x + Rb * 2), x2: r(chipX), y1: r(gcy), y2: r(gcy), stroke: th.inkSoft, 'stroke-width': 3}),
      h('line', {x1: r(chipX + L.guideChip.w), x2: r(bx - Rb), y1: r(gcy), y2: r(gcy), stroke: th.inkSoft, 'stroke-width': 3}),
      badge(0, L.guideAt.x + Rb), badge(1, bx), guideN.node);
    const noteN = notePlate(ctx, {text: p.comparisonLabels.neutral, x: L.noteAt.x, y: L.noteAt.y, maxWidth: L.nMax, size: F, weight: 500, maxLines: 5});
    const keyN = notePlate(ctx, {text: t.key, x: L.keyAt.x, y: L.keyAt.y, maxWidth: L.kMax, size: F * 0.9, weight: 600, maxLines: 3, dash: true, level: 'key'});
    const ringNode = k => {
      const b = L.rings[k];
      const lane = laneOf(ctx, k);
      const per = 2 * (b.w + b.h);
      const R = F * 0.62;
      // neutral outline (not the alarm accent); the lettered disc on its top-left corner and the
      // standard changed-datum Δ on its top-right corner, both off the overlay's text and tab
      return g({name: `ring${k}`, opacity: 0},
        h('path', {name: `ring${k}-path`, d: roundRectPath(b.x, b.y, b.w, b.h, F * 0.4), fill: 'none', stroke: th.ink, 'stroke-width': 3, 'stroke-dasharray': `${r(per)} ${r(per + 10)}`, 'stroke-dashoffset': r(per)}),
        g({name: `ringdisc${k}`},
          h('circle', {cx: r(b.x), cy: r(b.y), r: r(R), fill: lane.soft, stroke: lane.color, 'stroke-width': 3}),
          ctx.show('key') ? h('text', {x: r(b.x), y: r(b.y + R * 0.42), 'text-anchor': 'middle', 'font-size': r(F * 0.9), 'font-weight': 800, 'font-family': FONTS.sans, fill: th.ink}, k ? 'B' : 'A') : null),
        changedMarker(ctx, {name: `ringmark${k}`, x: b.x + b.w, y: b.y, radius: R}));
    };
    return g(null,
      desk.surface,
      g({'clip-path': desk.clip},
        laneNode(0), laneNode(1),
        g({transform: T(L.bookAt.x, L.bookAt.y)}, L.book.node),
        g({transform: T(L.plateAt.x, L.plateAt.y)}, L.plate.node),
        g({transform: T(L.boardAt.x, L.boardAt.y)}, L.board.node),
        ringNode(0), ringNode(1),
        g({name: 'guideG', opacity: 0}, guideG),
        g({name: 'noteG', opacity: 0}, noteN.node),
        g({name: 'keyG', opacity: 0}, keyN.node),
      ),
      desk.frame,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const F = L.F;
    const w = name => seg(u, ...W[name]);
    const looks = [];
    const sem = {};
    const reach = [];
    L.lanes.forEach((l, k) => {
      const tint = ease.inOutSine(w('tint'));
      nodes[`lanetint${k}`] = {opacity: r(tint, 3)};
      // overlay: tray → slip (lay) … slip → tray (slide)
      const layP = ease.inOutCubic(w('lay'));
      const slideP = ease.inOutCubic(w('slide'));
      const pos = slideP > 0 ? mix(l.onSlip, l.rest, slideP) : mix(l.rest, l.onSlip, layP);
      nodes[`film${k}`] = {transform: T(pos.x, pos.y)};
      const onPad = slideP > 0 ? 1 - slideP : layP;
      // the slip's bars under this reading's focus words fade out as the overlay lands (before the
      // traced words appear); the other bars once the trace is complete (the overlay now carries
      // the traced copy). They stay off: no text ever passes over a bar, and the card is later laid
      // on a clean slip
      nodes[`slipfocus${k}`] = {opacity: r(1 - ease.inOutSine(seg(u, 0.225, 0.255)), 3)};
      nodes[`sliprest${k}`] = {opacity: r(1 - ease.inOutSine(seg(u, 0.3, 0.34)), 3)};
      const traceP = ease.inOutSine(w('trace'));
      // the highlighter sweeps the reading's span, line by line; the band follows the tip
      const rects = l.ov.rects;
      const total = rects.reduce((a, q) => a + q.w, 0) || 1;
      const sw = w('sweep');
      const sweepEase = ease.inOutSine(sw);
      // the stroke: along each line of the span, lifting between lines (continuous path)
      const segs = [];
      const rs = rects.length ? rects : [{x: l.ov.text.x, y: l.ov.text.y, w: 0, h: 0}];
      rs.forEach((q, i) => {
        const a0 = {x: l.onSlip.x + q.x, y: l.onSlip.y + q.y + q.h / 2}, a1 = {x: a0.x + q.w, y: a0.y};
        if (i) segs.push({from: segs[segs.length - 1].to, to: a0, draw: false});
        segs.push({from: a0, to: a1, draw: true});
      });
      const lens = segs.map(q => dist(q.from, q.to));
      const totalLen = lens.reduce((a, b) => a + b, 0) || 1;
      const totalDraw = segs.reduce((a, q, i) => a + (q.draw ? lens[i] : 0), 0) || 1;
      let along = sweepEase * totalLen, drawn = 0, tip = segs[0].from;
      for (let i = 0; i < segs.length; i++) {
        const d = Math.min(along, lens[i]);
        tip = mix(segs[i].from, segs[i].to, lens[i] ? d / lens[i] : 1);
        if (segs[i].draw) drawn += d;
        along -= d;
        if (along <= 1e-9) break;
      }
      const bandP = clamp(drawn / totalDraw);
      const start = segs[0].from;
      Object.assign(nodes, overlayFrame(l.ov, {lit: onPad, trace: traceP, band: bandP}));
      // pen position: rest → hand → sweep → rest
      const toPen = ease.inOutCubic(w('toPen'));
      const penBack = ease.inOutCubic(w('penBack'));
      let penTip;
      if (u < W.toPen[1]) penTip = l.penRest;
      else if (u < W.sweep[0]) penTip = mix(l.penRest, start, ease.inOutCubic(seg(u, W.toPen[1], W.sweep[0])));
      else if (u < W.sweep[1]) penTip = tip;
      else penTip = mix(tip || start, l.penRest, penBack);
      nodes[`pen${k}`] = {transform: T(penTip.x, penTip.y)};
      nodes[l.pen.tipName] = {opacity: r(tint, 3)};
      const penGrip = {x: penTip.x + l.pen.grip.x, y: penTip.y + l.pen.grip.y};
      const filmGrip = {x: pos.x + l.ov.grip.x, y: pos.y + l.ov.grip.y};
      // hand
      const enter = ease.inOutCubic(w('enter'));
      let hand;
      let lean = 1;
      if (u < W.enter[1]) { hand = mix(L.handOut, filmGrip, enter); lean = enter; }
      else if (u < W.lay[1]) hand = filmGrip;
      else if (u < W.toPen[1]) hand = mix(filmGrip, penGrip, toPen);
      else if (u < W.penBack[1]) hand = penGrip;
      else if (u < W.toTab[1]) hand = mix(penGrip, filmGrip, ease.inOutCubic(w('toTab')));
      else if (u < W.release[1]) hand = filmGrip;
      else {
        const o = ease.inOutCubic(w('out'));
        hand = mix(filmGrip, L.handOut, o);
        lean = 1 - o;
      }
      const sh = mix(L.sOut, L.shoulder, lean);
      const pose = L.rigs[k].pose(sh, hand, L.bend);
      Object.assign(nodes, pose.nodes);
      reach.push(pose.reached);
      const cardP = seg(u, ...W.card);
      const bodyP = seg(u, ...W.cardBody);
      // the blank opaque body settles on the slip (a short drop), then the card's printing fades in on it
      nodes[`cardbody${k}`] = {opacity: r(clamp(bodyP * 1.6), 3), transform: T(l.cardX, l.cardY + (1 - ease.outCubic(bodyP)) * F * 0.6)};
      nodes[`card${k}`] = {opacity: r(ease.inOutSine(cardP), 3)};
      const lb = L.laneBox[k];
      const P2 = q => ({x: r(q.x), y: r(q.y)});
      const world = q => ({x: lb.x + q.x, y: lb.y + q.y});
      const letter = k ? 'B' : 'A';
      sem[`hand${letter}`] = P2(world(pose.hand));
      sem[`film${letter}`] = P2(world({x: pos.x + l.ov.w / 2, y: pos.y + l.ov.h / 2}));
      sem[`grip${letter}`] = P2(world(filmGrip));
      sem[`pen${letter}`] = P2(world(penGrip));
      sem[`tip${letter}`] = P2(world(penTip));
      // everything a viewer sees in the lane, relative to the lane (labels on or off)
      looks.push({
        hand: P2(pose.hand), film: P2(pos), pen: P2(penTip), tint: r(tint, 3), trace: r(traceP, 3), band: r(bandP, 3), card: r(cardP, 3),
        bandShape: bandP > 0 ? l.ov.rects.map(q => [r(q.x), r(q.w)]) : [],
        focus: traceP > 0 ? spanText(L.PL, l.span) : null,
      });
    });
    const ringsP = seg(u, ...W.rings);
    const guideP = seg(u, ...W.guide);
    [0, 1].forEach(k => {
      const b = L.rings[k];
      const per = 2 * (b.w + b.h);
      nodes[`ring${k}`] = {opacity: ringsP > 0 ? 1 : 0};
      nodes[`ring${k}-path`] = {'stroke-dashoffset': r(per * (1 - ease.inOutSine(ringsP)))};
    });
    nodes.guideG = {opacity: r(guideP, 3)};
    nodes.noteG = {opacity: r(seg(u, ...W.note), 3)};
    nodes.keyG = {opacity: r(seg(u, ...W.key), 3)};
    const holder = look => (look.film.x === r(L.lanes[0].rest.x) && look.film.y === r(L.lanes[0].rest.y) ? 'tray' : 'moving');
    return {
      nodes,
      semantic: {
        beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
        layout: L.shape, fits: L.fits, keyPx: r(L.keyPx, 2),
        ...sem,
        lookA: looks[0], lookB: looks[1],
        a: {holder: holder(looks[0]), band: looks[0].band, bandShape: looks[0].bandShape},
        b: {holder: holder(looks[1]), band: looks[1].band, bandShape: looks[1].bandShape},
        focusFound: L.lanes.map(l => Boolean(l.span)),
        spansDiffer: JSON.stringify(L.lanes[0].ov.rects.map(q => [r(q.x), r(q.w), q.line])) !== JSON.stringify(L.lanes[1].ov.rects.map(q => [r(q.x), r(q.w), q.line])),
        changedFact: 'focus', sameGeometry: JSON.stringify([L.lanes[0].rest, L.lanes[0].onSlip, L.lanes[0].tray, L.lanes[0].pad]) === JSON.stringify([L.lanes[1].rest, L.lanes[1].onSlip, L.lanes[1].tray, L.lanes[1].pad]),
        cardsEqual: L.cards[0].h === L.cards[1].h && L.cards[0].w === L.cards[1].w,
        guideShown: guideP >= 1 && ringsP >= 1, noteShown: seg(u, ...W.note) >= 1, keyShown: seg(u, ...W.key) >= 1,
        guideClear: L.guideClear, footerClear: L.footerClear,
        allReached: reach.every(Boolean), reach,
        laneFrac: r(L.laneBox[0].w / L.Wd, 3), row: L.row,
        // the acting objects (light pad with slip / card, tray with overlay) fill each desk below its header
        deskFill: r((L.lanes[0].pad.w * L.lanes[0].pad.h + L.lanes[0].tray.w * L.lanes[0].tray.h) / (L.LW * (L.laneH - L.headH)), 3),
        // the words each reading highlights are printed on its overlay at full text size (px at 1080p)
        focusPx: r(L.PL.size * pxPerUnit(ctx), 2), focusPrinted: ctx.show('all') && looks.every(q => q.trace === 1),
        cardOnPad: L.lanes.every(l => l.cardX >= l.pad.x && l.cardY >= l.pad.y && l.cardX + l.cardW <= l.pad.x + l.pad.w + 0.5 && l.cardY + L.cardH <= l.pad.y + l.pad.h + 0.5),
        laneBadges: {a: laneOf(ctx, 0).color, b: laneOf(ctx, 1).color, alarm: ctx.theme.accent},
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
    slug: 'sources-09-contrast',
    title: 'Concurrent interpretations — the same passage, two highlighted spans',
    titleEs: 'Interpretaciones concurrentes — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Interpretaciones concurrentes',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical reading desks trace the same fictional passage onto a tracing overlay; only the reading differs, so each hand sweeps a highlighter over a different span (a different stroke and path), then slides its overlay into the tray (the highlighted words legible on it) and the attributed reading card is laid on the light pad. Shared wording, facts, book and hierarchy are drawn once; lettered rings and a guide join the one changed detail. No winner or conclusion.',
    tags: ['interpretation', 'concurrent readings', 'contrast', 'passage', 'tracing overlay', 'highlighter', 'book', 'editable hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/interpretaciones-concurrentes.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
