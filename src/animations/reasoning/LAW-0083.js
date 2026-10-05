/**
 * LAW-0083 — Hecho y regla · contrast
 *
 * Storyboard (two complete docking stations, identical except ONE supplied
 * fact: the status of one attribute):
 *  0.00–0.17 base      Two identical stations appear: the same rule plate
 *                      (same illustrative conditions, same socket profiles),
 *                      the same fact card lying loose and tilted in front of
 *                      it, the same magnifier resting on the header band
 *                      straight above the joint column (scenario label on
 *                      its left, caption on its right).
 *  0.17–0.40 change    The one changed fact is introduced locally and
 *                      physically on the SAME row of both cards: A gets a
 *                      blue clip with an "=" face (the attribute supplied as
 *                      coinciding with its condition), B an amber clip with a
 *                      "?" face (supplied as disputed). Nothing else differs.
 *  0.40–0.77 parallel  Both cards slide in and square up with identical
 *                      timing; the latch bolts run row by row. Every row
 *                      behaves identically except the changed one: A's bolt
 *                      seats (registration halves close), B's bolt stops
 *                      short with a '?' disc in the gap, and only B's
 *                      magnifier lifts off and drops straight down the gap
 *                      (where only bolts lie) onto that joint — the
 *                      difference changes geometry and sequence, not only
 *                      colour.
 *  0.77–1.00 guide     The changed row is framed in both stations and a
 *                      comparison guide joins the two frames (across the gap
 *                      between side-by-side stations, or down the right-hand
 *                      margin between stacked ones); the changed fact, the
 *                      shared facts and a neutral note. No winner, score or
 *                      conclusion.
 * Side by side on wide boxes, stacked on square and tall boxes; each station
 * docks left → right. Text-dense sets on square/wide boxes (where the doubled
 * scenes cannot keep rows at ~16 px at 1080p) draw the identical rule plate
 * ONCE, shared: A's card docks on its left edge, B's (mirrored) on its right
 * edge, one frame spans the changed row across both lanes, and one magnifier
 * rests over the plate and moves to B's joint only.
 * Legal content: fictional, jurisdiction unspecified; the rule text is the
 * author's illustrative text; both statuses are supplied, never inferred.
 * @module animations/reasoning/LAW-0083
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, rotateAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, oneOf, contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {placeChipAny, placeChip, calloutChip, segPolys, balancedWidth} from '../causation/kits/place.js';
import {
  hrFields, HR_STRINGS, DEFAULT_CONTENT, STATUSES, resolveRows, assemblyGeometry, cardArt, plateArt, boltArt,
  lupaArt, assemblyCopy, jointPoint, hrColors, markerClip, socketPath, boltPath, regHalf, doubtDisc,
} from './kits/hecho-y-regla.js';

const ID = 'LAW-0083';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  headers: [0.01, 0.1], clip: [0.2, 0.32], boltLook: [0.2, 0.3], labels: [0.27, 0.38], slide: [0.41, 0.56], bolts: [0.57, 0.69], lupa: [0.685, 0.765],
  frames: [0.78, 0.86], guide: [0.82, 0.9], guideChip: [0.86, 0.93], notes: [0.88, 0.96],
};
const TILT = -5;

const EXTRA = {
  en: {letterA: 'A', letterB: 'B', sameInBoth: 'Same in A and B', changed: 'Changed detail'},
  es: {letterA: 'A', letterB: 'B', sameInBoth: 'Igual en A y B', changed: 'Detalle cambiado'},
};
const STRINGS = {en: {...HR_STRINGS.en, ...EXTRA.en}, es: {...HR_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...hrFields,
  changedAttribute: int('Zero-based index of the ONE attribute whose supplied status differs between A and B (all other data are shared)', 0, 3),
  statusA: oneOf('Status of the changed attribute in scenario A, as supplied (as-supplied = coincides with its condition as supplied; the bolt seats)', STATUSES),
  statusB: oneOf('Status of the changed attribute in scenario B, as supplied (disputed = the bolt stops short with a question mark)', STATUSES),
  ...contrastFields(),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  facts: {
    title: 'Incident at Plot 12 (fictional)',
    attributes: [
      {text: 'Wheelbarrow left on the main path', status: 'as-supplied'},
      {text: 'It belongs to the Plot 12 holder', status: 'as-supplied'},
      {text: 'Seen there at 21:40', status: 'as-supplied'},
    ],
  },
  changedAttribute: 2,
  statusA: 'as-supplied',
  statusB: 'disputed',
  scenarioA: {label: 'Attributes coincide', caption: 'Attribute 3 supplied as matching its condition'},
  scenarioB: {label: 'One attribute disputed', caption: 'Attribute 3 supplied as disputed'},
  changedFact: 'Attribute 3 “Seen there at 21:40”: supplied as matching in A, as disputed in B',
  sharedFacts: ['same fact card and title', 'same rule text', 'attributes 1–2 as supplied'],
  comparisonLabels: {guide: 'Only this row differs', neutral: 'Two supplied situations side by side — no conclusion is drawn'},
};

const SHAPES = {
  landscape: {arr: 'row', size: 46, pk: 2.7, notesSide: true, sharedAlt: true},
  // square: stacked like portrait (each station gets the full width, so rows read in one or two lines), tighter row pitch
  square: {arr: 'column', size: 40, pk: 2.05, notesSide: true, alt: {arr: 'row', pk: 2.7, maxLines: 4, threshold: 1.2}, sharedAlt: true},
  portrait: {arr: 'column', size: 40, pk: 2.35},
};
const M = 30;
/** Design units per output pixel at 1080p reference (scale-invariant: depends on the frame's aspect and safe box only). */
function unitsPer1080px(ctx) {
  const v = ctx.view, c = v.content, D = ctx.design;
  const k = Math.min(c.w / D.w, c.h / D.h) * (1080 / Math.min(v.width, v.height));
  return 1 / k;
}

/** One station's geometry inside a panel box. */
function stationGeo(ctx, s, rows, panel, o) {
  const p = ctx.params;
  const t = ctx.t;
  const show = ctx.show('key');
  const G = s * 2.7;
  // the card starts back-left and low, tilted, and approaches diagonally (short horizontal travel keeps the text columns wide)
  const dx = Math.min(panel.w * 0.06, s * 1.7);
  const tab = s * 1.25;
  const inner = panel.w - dx - tab - 16 - o.br;
  const cardW = (inner - G) * 0.49;
  const plateW = inner - G - cardW;
  const x0 = panel.x + 8 + dx + tab;
  const geo = assemblyGeometry(ctx, {
    axis: 'x', x: x0, y: panel.y + o.hh + s * 0.3, rows, size: s, show,
    kinds: {fact: t.factKind, rule: t.ruleKind}, titles: {fact: p.facts.title, rule: p.rules.title},
    cardW, plateW, G, D: s * 1.1, minP: o.minP, maxLines: o.maxLines ?? 3,
  });
  const H = geo.card.h;
  const dy = Math.min(H * 0.14, s * 1.8);
  // the start offset (dy) only matters during the slide; the gap below / the notes band are empty then
  return {geo, dx, dy, H, bottom: geo.card.y + H + 10, startBottom: geo.card.y + H + dy + 10};
}

/**
 * Shared-plate composition (text-dense square boxes): the rule is identical in A and B, so it is drawn ONCE, in the
 * middle; A's fact card docks on its left edge and B's on its right edge (B mirrored), both bolt rows meeting the same
 * condition rows. A's lane (badge, label, caption) is above A's card, B's above B's card; one magnifier rests above the
 * shared plate and, in B only, moves to B's joint. Removes the second copy of the conditions, so rows can wrap to 3 lines
 * at a readable size.
 */
function composeShared(ctx, s, extraP, S) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const base = resolveRows(p);
  const k = clamp(p.changedAttribute, 0, base.length - 1);
  const pairedK = base[k].status !== 'unpaired';
  const rowsA = resolveRows(p, pairedK ? {[k]: p.statusA} : {});
  const rowsB = resolveRows(p, pairedK ? {[k]: p.statusB} : {});
  const units = unitsPer1080px(ctx);
  // lane headings and captions take the height here: they stay at least as large as the rows (≈ 17 px), never 22 px
  const u22 = 17 * units;
  const lab = Math.max(u22 * 1.15, Math.min(s * 1.05, 44));
  const G = s * 2.7;
  const R = G * 0.46;
  const Lh = Math.max(70, G * 0.95);
  const Dd = s * 1.1;
  const minP = s * S.pk + extraP;
  const noteSize = Math.max(u22 * 1.04, s * 0.78);
  const notesW = D.w - 2 * M;
  // widths: card | gap | plate (sockets on both edges) | gap | card; attribute and condition text columns equal
  const avail = D.w - 2 * M - 8 - 2 * G;
  const cw = (avail - 2 * Dd) / 3; // card width: wA = cw − pads; wC = (pw − 2D) − pads, equal → pw = cw + 2D
  const pw = avail - 2 * cw;
  const xA = M + 4;
  const top = M;
  // header band columns: A over A's card, B over B's card; the magnifier rests over the plate between them
  const Rb = lab * 0.8;
  const textX = Rb * 2 + 16;
  const colW = cw + G / 2 - R - 14;
  const textW = colW - textX;
  const fitL = (txt, size, min) => ctx.fit(txt, {maxWidth: textW, size, minSize: min, maxLines: 3, weight: 700});
  const fitC = (txt, size, min) => (txt && showAll ? ctx.fit(txt, {maxWidth: textW, size, minSize: min, maxLines: 5, weight: 600}) : null);
  const scs = [p.scenarioA, p.scenarioB];
  const lSize = Math.min(...scs.map(sc => fitL(sc.label, lab * 0.95, u22).size));
  const cs = scs.map(sc => fitC(sc.caption, u22, u22)).filter(Boolean);
  const cSize = cs.length ? Math.min(...cs.map(f => f.size)) : 0;
  const headFit = sc => {
    if (!showKey) return null;
    const lf = fitL(sc.label, lSize, lSize);
    const cf = fitC(sc.caption, cSize, cSize);
    return {lf, cf, h: lf.height + (cf ? cf.height + 6 : 0) + 4};
  };
  const headA = headFit(p.scenarioA), headB = headFit(p.scenarioB);
  const headOk = !headA || [headA, headB].every(hf => !hf.lf.truncated && !(hf.cf && hf.cf.truncated));
  const headH = Math.max(headA ? headA.h : 0, headB ? headB.h : 0, Rb * 2 + 8);
  // the magnifier rests over the shared plate with its whole handle above the plate (never on the plate's heading)
  const restDrop = (R + Lh) * 1.07 + 8;
  const hh = Math.max(2 * R + s * 0.7, headH + s * 0.45, R + restDrop + 6 - s * 0.3);
  // A's assembly from the kit (card left, plate right, sockets on the plate's left edge); the plate is then widened by
  // one socket depth on the right, where B's sockets are cut
  const geoA = assemblyGeometry(ctx, {
    axis: 'x', x: xA, y: top + hh + s * 0.3, rows: rowsA, size: s, show: showKey,
    kinds: {fact: t.factKind, rule: t.ruleKind}, titles: {fact: p.facts.title, rule: p.rules.title},
    cardW: cw, plateW: pw - Dd, G, D: Dd, minP, maxLines: 3,
  });
  geoA.plate = {...geoA.plate, w: pw};
  geoA.plateHeader = {...geoA.plateHeader, w: pw};
  geoA.cells = geoA.cells.map(c => ({...c, plateRow: {...c.plateRow, w: pw}}));
  geoA.tab = {x: xA, y: geoA.card.y + geoA.card.h / 2 - 1, w: 1, h: 1}; // no grip tab in this layout
  const xB = geoA.plate.x + pw + G;
  const bx = xB - xA;
  const sh = q => ({...q, x: q.x + bx});
  const geoB = {
    ...geoA, rows: rowsB, card: sh(geoA.card), cardHeader: sh(geoA.cardHeader), tab: sh(geoA.tab), dir: {x: -1, y: 0}, angle: 180,
    cells: geoA.cells.map(c => ({...c, cardRow: sh(c.cardRow), badgeA: sh(c.badgeA), attrAt: sh(c.attrAt), port: {x: xB, y: c.cy}, sock: {x: geoA.plate.x + pw, y: c.cy}})),
  };
  const H = geoA.card.h;
  const dy = Math.min(H * 0.14, s * 1.8);
  const mk = geo => ({geo, dx: 0, dy, H, bottom: geo.card.y + H + 10, startBottom: geo.card.y + H + dy + 10});
  const stA = mk(geoA), stB = mk(geoB);
  // row text: the smallest row size actually used (the kit may shrink a long row before wrapping it)
  const rowPx = rowPxOf(geoA, ctx);
  const rowOk = geoA.fits.every(f => !(f.a && f.a.truncated) && !(f.c && f.c.truncated));
  // notes band: guide chip, then shared facts | neutral note side by side
  const sharedParts = [...p.sharedFacts, ...p.assumptions.map(a => `${t.assumed}: ${a}`), ...p.issues.map(q => `${t.issue}: ${q.text}`)];
  const sharedText = showAll && sharedParts.length ? `${t.sameInBoth}: ${sharedParts.join(' · ')}` : null;
  const side = true;
  const gutterX = M + (notesW - 24) * 0.56 + 12;
  const sharedW = gutterX - 12 - M;
  const neutralX0 = gutterX + 12;
  const neutralW = D.w - M - neutralX0;
  const guideText = showAll ? [p.comparisonLabels.guide, p.changedFact].filter(Boolean).join(' — ') : null;
  const chipH = (txt, ml = 2, kk = 1, mw = notesW) => (txt ? chip(ctx, txt, {x: 0, y: 0, maxWidth: balancedWidth(ctx, txt, {maxWidth: mw, size: noteSize * kk, minSize: noteSize * kk * 0.8, maxLines: ml}), size: noteSize * kk, minSize: noteSize * kk * 0.8, maxLines: ml}).box.h : 0);
  const guideBox = guideText ? chip(ctx, guideText, {x: 0, y: 0, maxWidth: D.w * 0.62, size: noteSize, maxLines: 3}).box : null;
  const neutralH = showAll ? chipH(p.comparisonLabels.neutral, 4, 1, neutralW) : 0;
  const shTrunc = ml => ctx.fit(sharedText, {maxWidth: sharedW - noteSize * 1.2, size: noteSize * 0.92, minSize: noteSize * 0.92 * 0.8, maxLines: ml, weight: 600}).truncated;
  const sharedML = sharedText ? [4, 5, 6].find(ml => !shTrunc(ml)) ?? 6 : 4;
  const sharedH = sharedText ? chipH(sharedText, sharedML, 0.92, sharedW) : 0;
  const notesOk = !sharedText || !shTrunc(sharedML);
  const notesH = (guideBox ? guideBox.h + 14 : 0) + Math.max(sharedH, neutralH) + 6;
  const jB = jointPoint(geoB, k);
  const handleEnd = jB.y + (R + Lh) * 1.07 + 10;
  const contentBottom = Math.max(stA.bottom, handleEnd);
  const startOk = stA.startBottom <= D.h - 12;
  const notesTop = D.h - M - notesH;
  const panels = [{x: M, y: top, w: colW}, {x: xB + cw + 4 - colW, y: top, w: colW}];
  return {
    s, row: true, sharedPlate: true, side, colW: 0, k, pairedK, rowsA, rowsB, hh, panels, stA, stB, PG: G, noteSize, notesTop, notesH, sharedText, guideText, guideBox, neutralH,
    R, Lh, restDX: 0, restX: geoA.plate.x + pw / 2, restDrop, headA, headB, textX, textW, capX: textX, capW: textW, lab, holdDown: true, sharedW, sharedML, neutralW, neutralX0, sharedH, notesW,
    rowPx,
    fits: contentBottom + 8 <= notesTop && startOk && textW >= 110 && headOk && notesOk && rowOk,
    budget: {contentBottom: r(contentBottom), notesTop: r(notesTop), notesH: r(notesH), PG: r(G), H: r(H), hh: r(hh)},
  };
}

/** Smallest row text size (px at 1080p) of an assembly (the kit may shrink a long row before wrapping it). */
function rowPxOf(geo, ctx) {
  const sizes = geo.fits.flatMap(f => [f.a, f.c]).filter(Boolean).map(f => f.size);
  return (sizes.length ? Math.min(...sizes) : geo.size) / unitsPer1080px(ctx);
}

/** Largest text size whose composition fits (5 % steps, then refined), plus leftover height spread into the row pitch. */
function search(ctx, S) {
  let s = S.size;
  let L = compose(ctx, s, 0, S);
  for (let it = 0; it < 24 && !L.fits; it++) {
    s *= 0.95;
    L = compose(ctx, s, 0, S);
  }
  if (L.fits && s < S.size) {
    let lo = s, hi = s / 0.95;
    for (let it = 0; it < 5; it++) {
      const mid = (lo + hi) / 2;
      const Lm = compose(ctx, mid, 0, S);
      if (Lm.fits) { lo = mid; L = Lm; } else hi = mid;
    }
    s = lo;
  }
  // spread leftover height into the row pitch so both stations fill the frame
  if (L.fits) {
    const free = L.budget.notesTop - 8 - L.budget.contentBottom;
    const nRows = L.rowsA.length * (L.row ? 1 : 2);
    if (free > nRows * 4) {
      const P0 = L.stA.geo.P;
      const L2 = compose(ctx, s, Math.max(0, P0 - s * S.pk) + Math.min(free / nRows, s * 1.2), S);
      if (L2.fits) L = L2;
    }
  }
  return L;
}

function compose(ctx, s, extraP = 0, S = SHAPES[ctx.view.shape]) {
  if (S.arr === 'shared') return composeShared(ctx, s, extraP, S);
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const row = S.arr === 'row';
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const base = resolveRows(p);
  const k = clamp(p.changedAttribute, 0, base.length - 1);
  const pairedK = base[k].status !== 'unpaired';
  const rowsA = resolveRows(p, pairedK ? {[k]: p.statusA} : {});
  const rowsB = resolveRows(p, pairedK ? {[k]: p.statusB} : {});
  // header band above each station: scenario badge, label and caption on the left; the magnifier rests on the band
  // straight above the joint column (handle down the empty gap between the two headers), so its later move to the changed
  // joint is a straight drop down the gap between card and plate — it never passes over a title or a row text
  // design size of 22 px at 1080p (key labels); only when a very long text set forces the rows themselves below ~24 design
  // units does this floor relax (to ~18 px), so the labels never dwarf the subject
  const u22 = 22 * unitsPer1080px(ctx) * clamp(s / (S.size * 0.5), 0.72, 1);
  const lab = Math.max(u22 * 1.15, Math.min(s * 1.05, 44));
  const G = s * 2.7;
  const R = G * 0.46;
  const Lh = Math.max(70, G * 0.95);
  const minP = s * S.pk + extraP;
  const noteSize = Math.max(u22 * (row ? 1.04 : 1), s * 0.78);
  // notes band: guide chip (wide boxes), shared facts, neutral note
  const notesW = D.w - 2 * M;
  // shared data: the supplied shared facts, plus the working assumptions and open issues (identical in A and B)
  const sharedParts = [...p.sharedFacts, ...p.assumptions.map(a => `${t.assumed}: ${a}`), ...p.issues.map(q => `${t.issue}: ${q.text}`)];
  const sharedText = showAll && sharedParts.length ? `${t.sameInBoth}: ${sharedParts.join(' · ')}` : null;
  const br = row ? 0 : s * 1.3; // right margin for the comparison bracket (stacked)
  const pw = row ? (D.w - 2 * M - s * 2.2) / 2 : D.w - 2 * M;
  // where the magnifier rests (relative to the panel): straight above the changed joint
  const probe = stationGeo(ctx, s, rowsA, {x: 0, y: 0, w: pw}, {hh: 0, br, minP, maxLines: S.maxLines});
  const restDX = jointPoint(probe.geo, k).x;
  // the shared-facts note breaks into at least two balanced lines (never one frame-wide line); on wide and square boxes
  // it sits beside the neutral note (left / right halves of the notes band)
  // (stacked + side: the gutter between them is B's magnifier handle, which hangs below the changed joint)
  const side = Boolean(S.notesSide);
  const gutterX = row ? M + (notesW - 24) * 0.56 + 12 : M + restDX;
  const gw = row ? 12 : s * 0.7 + 14;
  const sharedW = side ? gutterX - gw - M : Math.min(notesW, D.w * 0.9);
  const neutralX0 = side ? gutterX + gw : M;
  const neutralW = side ? D.w - M - neutralX0 : notesW;
  const guideText = showAll ? [p.comparisonLabels.guide, p.changedFact].filter(Boolean).join(' — ') : null;
  // chips may shrink to 85 % of their size before wrapping further (never below ~18 px for the shared note)
  const chipH = (txt, ml = 2, k = 1, mw = notesW) => (txt ? chip(ctx, txt, {x: 0, y: 0, maxWidth: balancedWidth(ctx, txt, {maxWidth: mw, size: noteSize * k, minSize: noteSize * k * 0.8, maxLines: ml}), size: noteSize * k, minSize: noteSize * k * 0.8, maxLines: ml}).box.h : 0);
  // same first width as the placement in finishLayout (mws[0])
  const guideBox = guideText ? chip(ctx, guideText, {x: 0, y: 0, maxWidth: D.w * (side && !row ? 0.8 : 0.62), size: noteSize, maxLines: 3}).box : null;
  const neutralH = showAll ? chipH(p.comparisonLabels.neutral, side ? 4 : 3, 1, neutralW) : 0;
  // fewest lines (4, else 5, 6) in which the shared note fits whole
  const shTrunc = ml => ctx.fit(sharedText, {maxWidth: sharedW - noteSize * 1.2, size: noteSize * 0.92, minSize: noteSize * 0.92 * 0.8, maxLines: ml, weight: 600}).truncated;
  const sharedML = sharedText ? [4, 5, 6].find(ml => !shTrunc(ml)) ?? 6 : 4;
  const sharedH = sharedText ? chipH(sharedText, sharedML, 0.92, sharedW) : 0;
  const notesOk = !sharedText || !shTrunc(sharedML);
  const notesH = (row && guideBox ? guideBox.h + 14 : 0) + (side ? Math.max(sharedH, neutralH) + 6 : (sharedH ? sharedH + 10 : 0) + (neutralH ? neutralH + 6 : 0));
  const Rb = lab * 0.8;
  const textX = Rb * 2 + 16;
  // the band has three columns: badge + label left of the magnifier, the caption right of it (over the plate)
  const textW = restDX - R - 18 - textX;
  const capX = restDX + R + 18;
  const capW = pw - br - capX - 4;
  // A and B labels (and captions) share one size, so neither scenario looks more prominent
  const fitL = (txt, size, min) => ctx.fit(txt, {maxWidth: textW, size, minSize: min, maxLines: 3, weight: 700});
  const fitC = (txt, size, min) => (txt && showAll ? ctx.fit(txt, {maxWidth: capW, size, minSize: min, maxLines: 4, weight: 600}) : null);
  const scs = [p.scenarioA, p.scenarioB];
  const lSize = Math.min(...scs.map(sc => fitL(sc.label, lab * 0.95, Math.max(20, u22)).size));
  const cs = scs.map(sc => fitC(sc.caption, Math.max(u22, lab * 0.72), u22)).filter(Boolean);
  const cSize = cs.length ? Math.min(...cs.map(f => f.size)) : 0;
  const headFit = sc => {
    if (!showKey) return null;
    const lf = fitL(sc.label, lSize, lSize);
    const cf = fitC(sc.caption, cSize, cSize);
    return {lf, cf, h: Math.max(lf.height, cf ? cf.height : 0) + 4};
  };
  const headA = headFit(p.scenarioA), headB = headFit(p.scenarioB);
  const headOk = !headA || [headA, headB].every(hf => !hf.lf.truncated && !(hf.cf && hf.cf.truncated));
  const headH = Math.max(headA ? headA.h : 0, headB ? headB.h : 0, Rb * 2 + 8);
  const hh = Math.max(2 * R + s * 0.7, headH + s * 0.45);
  let panels, stA, stB, PG;
  if (row) {
    PG = s * 2.2;
    panels = [{x: M, y: M, w: pw}, {x: M + pw + PG, y: M, w: pw}];
    stA = stationGeo(ctx, s, rowsA, panels[0], {hh, br: 0, minP, maxLines: S.maxLines});
    stB = stationGeo(ctx, s, rowsB, panels[1], {hh, br: 0, minP, maxLines: S.maxLines});
  } else {
    PG = guideBox ? guideBox.h + s * 0.9 : s * 1.4;
    panels = [{x: M, y: M, w: pw}];
    stA = stationGeo(ctx, s, rowsA, panels[0], {hh, br, minP});
    panels.push({x: M, y: stA.bottom + PG, w: pw});
    stB = stationGeo(ctx, s, rowsB, panels[1], {hh, br, minP});
  }
  const colW = 0;
  // B's magnifier, handle down at the changed joint, must not reach the notes band / the other station
  const holdDown = true;
  const jB = jointPoint(stB.geo, k);
  const handleEnd = holdDown ? jB.y + (R + Lh) * 1.07 + 10 : jB.y;
  // B's start pose (low, tilted) is only seen during the slide, when the notes band is still empty: it just has to stay in the frame
  const contentBottom = Math.max(stA.bottom, stB.bottom, stA.startBottom - (row ? 0 : PG - 8), row || side ? 0 : handleEnd);
  const startOk = stB.startBottom <= D.h - 12;
  const notesTop = D.h - M - notesH;
  return {
    s, row, side, colW, k, pairedK, rowsA, rowsB, hh, panels, stA, stB, PG, noteSize, notesTop, notesH, sharedText, guideText, guideBox, neutralH,
    R, Lh, restDX, headA, headB, textX, textW, capX, capW, lab, holdDown, sharedW, sharedML, neutralW, neutralX0, sharedH, notesW,
    rowPx: rowPxOf(stA.geo, ctx),
    fits: contentBottom + 8 <= notesTop && startOk && textW >= 110 && capW >= 110 && headOk && notesOk,
    budget: {contentBottom: r(contentBottom), notesTop: r(notesTop), notesH: r(notesH), PG: r(PG), H: r(stA.H), hh: r(hh)},
  };
}

/**
 * Header band. Two layers so that no difference shows before the change beat:
 *  - `<name>`      neutral letter badge (same grey disc in A and B), shown from the base beat;
 *  - `<name>-lab`  the scenario colour over the badge, the label and the caption (pre-fitted, left / right of the
 *                  resting magnifier), faded in only when the clip lands on the changed row.
 */
function headerArt(ctx, name, letter, hf, box, color, soft, L) {
  const th = ctx.theme;
  const size = L.lab;
  const Rb = size * 0.8;
  const cy = L.sharedPlate ? box.y + Math.max(0, (box.h - (hf ? hf.h : 0)) / 2) + Rb + 2 : box.y + Math.max(Rb + 4, (hf ? hf.h : 0) / 2 - 2);
  const base = [h('circle', {cx: r(box.x + Rb), cy: r(cy), r: r(Rb), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2.5})];
  // scenario colour: a tinted disc with a coloured ring (the one letter stays on top, ink on a light fill)
  const lab = [
    h('circle', {cx: r(box.x + Rb), cy: r(cy), r: r(Rb), fill: soft, stroke: th.ink, 'stroke-width': 2.5}),
    h('circle', {cx: r(box.x + Rb), cy: r(cy), r: r(Rb - Rb * 0.14 - 1.25), fill: 'none', stroke: color, 'stroke-width': r(Rb * 0.28, 2)}),
  ];
  const top = [];
  if (ctx.show('key') && hf) {
    const lf = ctx.fit(letter, {maxWidth: Rb * 1.6, size: size * 0.9, maxLines: 1, weight: 800});
    top.push(textBlock(lf, {x: box.x + Rb, y: cy - lf.size * 0.6, anchor: 'middle', fill: th.ink}));
    const y0 = box.y + Math.max(0, (box.h - hf.h) / 2);
    lab.push(textBlock(hf.lf, {x: box.x + L.textX, y: y0 + 2, fill: th.fg}));
    if (hf.cf && L.sharedPlate) lab.push(textBlock(hf.cf, {x: box.x + L.textX, y: y0 + 2 + hf.lf.height + 6, fill: th.fg}));
    else if (hf.cf) lab.push(textBlock(hf.cf, {x: box.x + L.capX, y: y0 + 2 + Math.max(0, (hf.lf.height - hf.cf.height) / 2), fill: th.fg}));
  }
  return g(null, g({name, opacity: 0}, base), g({name: `${name}-lab`, opacity: 0}, lab), g({name: `${name}-letter`, opacity: 0}, top));
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const col = hrColors(ctx);
  const s = L.s;
  L.baseK = resolveRows(p)[L.k].status;
  const stations = [['A', L.stA, L.rowsA, p.scenarioA, th.accent2, th.accent2Soft], ['B', L.stB, L.rowsB, p.scenarioB, th.accent3, th.accent3Soft]].map(([P, st, rows, sc, color, soft], idx) => {
    const geo = st.geo;
    const C = geo.card;
    const cc = {x: C.x + C.w / 2, y: C.y + C.h / 2};
    const R = L.R;
    const Lh = L.Lh;
    const panel = L.panels[idx];
    const header = headerArt(ctx, `${P}-head`, P === 'A' ? t.letterA : t.letterB, P === 'A' ? L.headA : L.headB, {x: panel.x, y: panel.y, w: panel.w, h: L.hh - s * 0.4}, color, soft, L);
    // resting magnifier: on the header band straight above the changed joint, handle down the empty gap between the headers
    const rest = {c: L.sharedPlate ? {x: L.restX, y: L.stA.geo.plate.y - L.restDrop} : {x: panel.x + L.restDX, y: panel.y + (L.hh - s * 0.4) / 2}, angle: 90};
    const sign = L.sharedPlate && P === 'B' ? -1 : 1; // B is mirrored in the shared-plate layout (docks on the plate's right edge)
    const kRow = rows[L.k];
    const J0 = jointPoint(geo, L.k);
    const J = {x: J0.x, y: J0.y};
    const holdAngle = 90; // handle straight down the gap (only bolts lie there, never text)
    const finalTravel = rows.map(rw => (rw.attr ? geo.travel[rw.status] ?? 0 : 0));
    const copy = assemblyCopy(ctx, geo, finalTravel, `${P}lc`);
    const lupa = lupaArt(ctx, {name: `${P}lupa`, R, handle: Lh, copy, zoom: 2, lensFill: th.paperShade});
    const clipKind = kRow.status === 'disputed' ? 'dispute' : kRow.status === 'as-supplied' ? 'match' : 'pending';
    const port = geo.cells[L.k].port;
    const clipAt = {x: port.x + sign * s * 0.4, y: port.y}; // clamped on the card edge right over the row's channel (hinge on the card, face over the gap): the bolt slides out beneath it
    const clip = clipKind === 'pending' ? null : markerClip(ctx, {name: `${P}clip`, kind: clipKind, size: s * 1.3});
    // highlight frame around the changed row (card + gap + plate)
    const c = geo.cells[L.k];
    // (shared plate: ONE frame across A's card, the shared plate and B's card; B's own frame is empty)
    const fr = L.sharedPlate
      ? {x: L.stA.geo.card.x - 8, y: c.cardRow.y + 2, w: L.stB.geo.card.x + L.stB.geo.card.w - L.stA.geo.card.x + 16, h: c.cardRow.h - 4}
      : {x: Math.min(geo.tab.x, C.x) - 8, y: c.cardRow.y + 2, w: geo.plate.x + geo.plate.w - Math.min(geo.tab.x, C.x) + 16, h: c.cardRow.h - 4};
    const frLen = 2 * (fr.w + fr.h);
    const frame = h('path', {name: `${P}frame`, d: L.sharedPlate && P === 'B' ? 'M0 0' : roundRectPath(fr.x, fr.y, fr.w, fr.h, 12), fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-dasharray': `${r(frLen)} ${r(frLen + 10)}`, 'stroke-dashoffset': r(frLen), opacity: 0});
    return {
      P, st, geo, rows, cc, R, Lh, header, rest, J, holdAngle, lupa, clip, clipKind, clipAt, fr, frLen, frame, sign,
      // shared plate: only B's magnifier is drawn (it rests over the plate; A's never moves in any layout)
      lupaShown: !(L.sharedPlate && P === 'A'),
      card: cardArt(ctx, geo, {prefix: `${P}crd`, tab: !L.sharedPlate}),
      plate: L.sharedPlate && P === 'B' ? sideSockets(ctx, geo, `${P}plt`) : plateArt(ctx, geo, {prefix: `${P}plt`}),
      bolts: rows.map((rw, i) => (rw.attr ? boltArt(ctx, geo, i, {name: `${P}bolt${i}`, status: rw.status}) : null)),
      // the changed row's bolt is drawn with the SHARED (base) status look until the change beat, so nothing about the
      // difference shows before it; it takes the station's supplied look together with the clip
      boltN: rows[L.k].attr && lookOf(rows[L.k].status) !== lookOf(L.baseK) ? boltArt(ctx, geo, L.k, {name: `${P}bolt${L.k}n`, status: L.baseK}) : null,
      // bolts are clipped to the card's own width (a retracted bolt longer than a narrow card never sticks out behind it)
      boltClipId: `${P}boltclip`,
      card0: poseT({x: C.x, y: C.y, w: C.w, h: C.h}, cc, -st.dx * sign, st.dy, TILT * sign),
    };
  });
  L.stations = stations;
  const [A, B] = stations;
  // comparison guide between the two frames
  if (L.sharedPlate) {
    // one frame across the row: the guide drops from its bottom edge down A's gap column (only bolts there) to the notes
    const gx = (A.geo.cells[L.k].port.x + A.geo.cells[L.k].sock.x) / 2;
    const y0 = A.fr.y + A.fr.h, y1 = L.notesTop - 6;
    L.guidePts = [{x: gx, y: y0}, {x: gx, y: (y0 + y1) / 2}, {x: gx, y: (y0 + y1) / 2}, {x: gx, y: y1}];
  } else if (L.row) {
    const y = A.geo.cells[L.k].cy;
    const yB = B.geo.cells[L.k].cy;
    L.guidePts = [{x: A.fr.x + A.fr.w, y}, {x: (A.fr.x + A.fr.w + B.fr.x) / 2, y}, {x: (A.fr.x + A.fr.w + B.fr.x) / 2, y: yB}, {x: B.fr.x, y: yB}];
  } else {
    const xb = D.w - M - s * 0.45;
    const yA = A.fr.y + A.fr.h / 2, yB = B.fr.y + B.fr.h / 2;
    L.guidePts = [{x: A.fr.x + A.fr.w, y: yA}, {x: xb, y: yA}, {x: xb, y: yB}, {x: B.fr.x + B.fr.w, y: yB}];
  }
  let gl = 0;
  for (let i = 1; i < L.guidePts.length; i++) gl += Math.hypot(L.guidePts[i].x - L.guidePts[i - 1].x, L.guidePts[i].y - L.guidePts[i - 1].y);
  L.guideLen = gl;
  const gd = L.guidePts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  L.guideNode = g({name: 'guide', opacity: 0},
    h('path', {d: gd, fill: 'none', stroke: th.card, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85}),
    h('path', {name: 'guide-line', d: gd, fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(gl)} ${r(gl + 10)}`, 'stroke-dashoffset': r(gl)}),
    h('circle', {name: 'guide-a', cx: r(L.guidePts[0].x), cy: r(L.guidePts[0].y), r: 7, fill: th.accent, stroke: th.card, 'stroke-width': 2.5}),
    h('circle', {name: 'guide-b', cx: r(L.guidePts[3].x), cy: r(L.guidePts[3].y), r: 7, fill: th.accent, stroke: th.card, 'stroke-width': 2.5, opacity: 0}));
  const gmid = mid2(L.guidePts[1], L.guidePts[2]);
  L.guideMid = gmid;

  // notes: guide chip, shared facts, neutral note
  L.guideChip = null;
  L.shared = null;
  L.neutral = null;
  const obstacles = stations.flatMap((st, i) => [st.geo.card, st.geo.plate, st.geo.tab, st.fr,
    {x: st.rest.c.x - st.R - 6, y: st.rest.c.y - st.R - 6, w: 2 * st.R + 12, h: 2 * st.R + st.Lh + 12},
    // the scenario label zone of the header band
    {x: L.panels[i].x, y: L.panels[i].y, w: L.panels[i].w, h: L.hh - s * 0.3}]);
  let y = L.notesTop;
  if (L.guideText) {
    const size = L.noteSize;
    const bounds = L.row ? {x: M, y: L.notesTop - 4, w: D.w - 2 * M, h: D.h - M - L.notesTop + 4} : {x: M, y: A.st.bottom - 6, w: D.w - 2 * M - s * 0.9, h: B.st.geo.card.y - A.st.bottom};
    const mws = L.row ? [D.w * 0.62, D.w * 0.5, D.w * 0.42] : L.side ? [D.w * 0.8, D.w * 0.66, D.w * 0.52] : [D.w * 0.62, D.w * 0.52, D.w * 0.44];
    const sizes = mws.map(mw => chip(ctx, L.guideText, {x: 0, y: 0, maxWidth: balancedWidth(ctx, L.guideText, {maxWidth: mw, size, maxLines: 3}), size, maxLines: 3}).box);
    // wide: below the short connector between the stations; stacked: on the bracket where it crosses the empty band between them
    const target = L.row ? {x: gmid.x, y: Math.max(L.guidePts[1].y, L.guidePts[2].y) + 4} : {x: L.guidePts[1].x, y: (A.st.bottom + L.panels[1].y) / 2};
    const order = L.row ? ['below'] : ['left', 'leftHigh', 'leftLow'];
    const po = {obstacles, bounds, order, gaps: L.row ? [L.notesTop - target.y + 4, L.notesTop - target.y + 20] : [20, 40, 70, 110, 160, 220, 300]};
    const res = placeChipAny(sizes, target, po) || (() => {
      const lb = placeChip(sizes[0], target, {...po, leastBad: true});
      if (lb) return {...lb, k: 0};
      // no candidate inside the band at all: centre the chip in it
      return {x: bounds.x + bounds.w / 2, y: bounds.y + Math.max(0, (bounds.h - sizes[0].h) / 2), end: target, k: 0};
    })();
    const mw = balancedWidth(ctx, L.guideText, {maxWidth: mws[res.k], size, maxLines: 3});
    L.guideChip = calloutChip(ctx, {name: 'guide-chip', text: L.guideText, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: mw, maxLines: 3, size, color: th.accent});
    if (L.row) y = L.guideChip.box.y + L.guideChip.box.h + 14;
  }
  const nSide = L.side && L.sharedText && L.neutralH;
  const y0 = y;
  if (L.sharedText) {
    const ml = L.sharedML;
    const sz = L.noteSize * 0.92;
    const mw = balancedWidth(ctx, L.sharedText, {maxWidth: L.sharedW, size: sz, minSize: sz * 0.8, maxLines: ml});
    // side by side: right-aligned against the centre gutter, top-aligned with the neutral note
    const cx = nSide ? M + L.sharedW - mw / 2 : D.w / 2;
    const c = chip(ctx, L.sharedText, {x: cx, y, anchor: 'middle', maxWidth: mw, size: sz, minSize: sz * 0.8, maxLines: ml, name: 'shared', fill: th.card, stroke: th.inkFaint, weight: 500});
    L.shared = c;
    if (!nSide) y = c.box.y + c.box.h + 10;
  }
  if (L.neutralH) {
    const txt = p.comparisonLabels.neutral;
    const ml = L.side ? 4 : 3;
    const mw = balancedWidth(ctx, txt, {maxWidth: L.neutralW, size: L.noteSize, minSize: L.noteSize * 0.85, maxLines: ml});
    const cx = nSide ? L.neutralX0 + mw / 2 : D.w / 2;
    L.neutral = chip(ctx, txt, {x: cx, y: nSide ? y0 : y, anchor: 'middle', maxWidth: mw, size: L.noteSize, minSize: L.noteSize * 0.85, maxLines: ml, name: 'neutral', fill: th.card, stroke: th.ink, weight: 600});
  }
  void col;
  L.budget.notesBottom = r(Math.max(L.neutral ? L.neutral.box.y + L.neutral.box.h : y, L.shared ? L.shared.box.y + L.shared.box.h : y));
  L.budget.guideChipY = L.guideChip ? r(L.guideChip.box.y) : null;
  return L;
}

/**
 * Sockets (and their top layer: ghost, seated rim, plate registration half, '?' disc) for a station whose card docks
 * on the far edge of a plate that is drawn by the other station (shared-plate layout). Same art as the kit's plateArt
 * sockets, at this station's socket points and orientation; same node names (<prefix>-rim<i>, -doubt<i>, -ghost<i>).
 */
function sideSockets(ctx, geo, prefix) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const base = [], top = [];
  geo.cells.forEach((c, i) => {
    const rw = geo.rows[i];
    if (rw.cond === null) return;
    base.push(g({transform: T(c.sock.x, c.sock.y, geo.angle)},
      h('path', {d: socketPath(rw.profile, geo.BW, geo.D), fill: shade(col.plate, -0.42), stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      h('path', {d: socketPath(rw.profile, geo.BW * 0.8, geo.D * 0.8), transform: T(geo.D * 0.12, 0), fill: shade(col.plate, -0.55), opacity: 0.5})));
    top.push(g({transform: T(c.sock.x, c.sock.y, geo.angle)},
      rw.attr && rw.status === 'pending'
        ? h('path', {name: `${prefix}-ghost${i}`, d: boltPath(rw.profile, geo.BW, geo.G + geo.D - 4), transform: T(geo.D, 0), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-dasharray': '6 6', opacity: 0})
        : null,
      h('path', {name: `${prefix}-rim${i}`, d: socketPath(rw.profile, geo.BW, geo.D), fill: 'none', stroke: col.bolt, 'stroke-width': 4.5, 'stroke-linejoin': 'round', opacity: 0}),
      regHalf(ctx, geo, 'plate', `${prefix}-reg${i}`),
      rw.attr && rw.status === 'disputed' ? g({transform: T(-geo.G * 0.24, 0, -geo.angle)}, doubtDisc(ctx, geo, {name: `${prefix}-doubt${i}`, opacity: 0})) : null));
  });
  return {base: g(null, base), top: g(null, top)};
}

/** Visual look of a bolt for a status (the kit draws disputed hatched amber, every other status solid blue). */
const lookOf = st => (st === 'disputed' ? 'hatched' : 'solid');

function mid2(a, b) {
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
}

/** Card transform for a pose offset (dx, dy) and rotation about its centre. */
function poseT(C, cc, dx, dy, rot) {
  return `${T(dx, dy)} ${rotateAbout(cc.x, cc.y, rot)}`;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1250, 970], portrait: [900, 1400]},
  layout(ctx) {
    const S0 = SHAPES[ctx.view.shape];
    let L = search(ctx, S0);
    // square: stacking is the composition; only when a very long text set would make the stacked rows much smaller than
    // the side-by-side arrangement (4 long rows twice over), fall back to side by side
    // (never with labels hidden: the bars then take any width, and the composition stays the same as with labels)
    if (S0.alt && ctx.show('key')) {
      const L2 = search(ctx, {...S0, ...S0.alt});
      if (L2.fits && (!L.fits || L2.s > L.s * S0.alt.threshold)) L = L2;
    }
    // text-dense sets: when the doubled scenes cannot keep rows at ~16 px (1080p), draw the identical rule plate once,
    // shared by both lanes, if that gives larger rows
    if (S0.sharedAlt && ctx.show('key') && (!L.fits || L.rowPx < 16)) {
      const L3 = search(ctx, {...S0, arr: 'shared', pk: 2.2, maxLines: 3});
      if (L3.fits && (!L.fits || L3.rowPx > L.rowPx + 0.5)) L = L3;
    }
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    const station = st => g(null,
      st.header,
      st.plate.base,
      g({name: `${st.P}card`, transform: st.card0},
        h('defs', null, h('clipPath', {id: ctx.id(st.boltClipId)}, st.geo.dir.x > 0
          ? h('rect', {x: r(st.geo.card.x), y: r(st.geo.card.y - 400), width: r(st.geo.card.w + st.geo.G + st.geo.plate.w + 400), height: r(st.geo.card.h + 800)})
          : h('rect', {x: r(st.geo.plate.x - 400), y: r(st.geo.card.y - 400), width: r(st.geo.card.x + st.geo.card.w - st.geo.plate.x + 400), height: r(st.geo.card.h + 800)}))),
        g({'clip-path': ctx.ref(st.boltClipId)}, st.boltN && st.boltN.node, st.bolts.map(b => b && b.node)),
        st.card, st.clip ? g({name: `${st.P}clipPos`, transform: T(st.clipAt.x, st.clipAt.y)}, st.clip) : null),
      st.plate.top,
      st.frame,
      st.lupaShown ? [st.lupa.shadows, st.lupa.view, st.lupa.prop] : null);
    return g(null,
      L.stations.map(station),
      L.guideNode,
      L.guideChip && L.guideChip.node,
      L.shared && g({name: 'shared-g', opacity: 0}, L.shared.node),
      L.neutral && g({name: 'neutral-g', opacity: 0}, L.neutral.node),
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const nodes = {};
    const sem = {};
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    // identical timing in both stations; only the supplied status of row k differs
    const pr = ease.inOutCubic(seg(u, ...W.slide));
    const al = ease.inOutSine(clamp((pr - 0.55) / 0.45));
    const clipIn = seg(u, ...W.clip);
    const lookSwap = seg(u, ...W.boltLook);
    L.stations.forEach(st => {
      const P = st.P;
      const geo = st.geo;
      nodes[`${P}-head`] = {opacity: r(seg(u, ...W.headers), 3)};
      nodes[`${P}-head-letter`] = {opacity: r(seg(u, ...W.headers), 3)};
      // scenario colour, label and caption only once the changed row has received its marker
      const labIn = seg(u, ...W.labels);
      nodes[`${P}-head-lab`] = {opacity: r(labIn, 3)};
      sem[`label${P}`] = r(labIn, 3);
      const pose = {dx: -st.st.dx * (1 - pr) * st.sign, dy: st.st.dy * (1 - al), rot: TILT * st.sign * (1 - al)};
      nodes[`${P}card`] = {transform: poseT(null, st.cc, pose.dx, pose.dy, pose.rot)};
      // the clip drops onto the changed row (same moment, same place in A and B)
      if (st.clip) {
        const d = ease.outCubic(clipIn);
        nodes[`${P}clip`] = {opacity: r(clamp(clipIn * 3), 3), transform: T(0, -L.s * 1.6 * (1 - d), 0, 1 + 0.15 * (1 - d))};
      }
      // bolts, row by row, only after docking
      const n = st.rows.length;
      const each = (W.bolts[1] - W.bolts[0]) / (n * 0.7 + 0.3);
      const travel = [], seated = [], short = [], boltLooks = [], marks = [];
      st.rows.forEach((rw, i) => {
        const w0 = W.bolts[0] + i * each * 0.7;
        const kk = seg(u, w0, w0 + each);
        const target = rw.attr ? (geo.travel[rw.status] ?? 0) : 0;
        let tr = 0;
        if (rw.status === 'as-supplied') tr = target * (reduced ? ease.outCubic(kk) : ease.outBack(kk));
        else if (rw.status === 'disputed') {
          const q = clamp((kk - 0.7) / 0.3);
          const jam = reduced ? 0 : Math.sin(q * Math.PI * 2) * 4 * (1 - q);
          tr = target * ease.outCubic(clamp(kk / 0.7)) - (kk > 0.7 ? jam : 0);
        }
        tr = Math.min(tr, geo.travel.seated + 3);
        travel.push(r(tr, 2));
        if (st.bolts[i]) nodes[`${P}bolt${i}`] = {transform: st.bolts[i].transform(tr)};
        if (i === L.k && st.boltN) {
          nodes[`${P}bolt${i}`].opacity = r(lookSwap, 3);
          nodes[`${P}bolt${i}n`] = {transform: st.boltN.transform(tr), opacity: r(1 - lookSwap, 3)};
        }
        // what a viewer can see of this bolt: its look(s) with opacity, and its travel
        boltLooks.push(st.bolts[i] ? [...(i === L.k && st.boltN ? [[lookOf(L.baseK), r(1 - lookSwap, 3)]] : []), [lookOf(rw.status), r(i === L.k && st.boltN ? lookSwap : 1, 3)]].filter(q => q[1] > 0) : null);
        const isSeated = rw.status === 'as-supplied' && kk >= 1;
        seated.push(isSeated);
        short.push(rw.status === 'disputed' && kk >= 1);
        const mk = {rim: rw.cond !== null && isSeated ? 1 : 0, doubt: 0, ghost: 0};
        if (rw.cond !== null) nodes[`${P}plt-rim${i}`] = {opacity: mk.rim};
        if (rw.status === 'disputed' && rw.attr) nodes[`${P}plt-doubt${i}`] = {opacity: (mk.doubt = r(seg(kk, 0.72, 0.95), 3))};
        if (rw.status === 'pending' && rw.attr) nodes[`${P}plt-ghost${i}`] = {opacity: (mk.ghost = r(0.9 * seg(kk, 0, 0.6), 3))};
        marks.push(mk);
      });
      // the magnifier: moves to the changed joint only where that joint is not seated (sequence differs)
      const inspects = st.rows[L.k].status !== 'as-supplied' && st.rows[L.k].status !== 'unpaired';
      const carry = inspects ? seg(u, ...W.lupa) : 0;
      const drop = ease.inOutSine(carry);
      const lift = Math.sin(Math.PI * carry) * 0.8 + (carry >= 1 ? 0.25 : 0);
      const ang = st.holdAngle;
      // (shared plate: it rests over the plate, slides along the band to above B's gap, then drops straight down it)
      const lc = L.sharedPlate
        ? {x: lerp(st.rest.c.x, st.J.x, ease.inOutSine(clamp(drop / 0.35))), y: lerp(st.rest.c.y, st.J.y, clamp((drop - 0.35) / 0.65))}
        : {x: st.rest.c.x, y: lerp(st.rest.c.y, st.J.y, drop)};
      // the glass centres on the stop of the changed row (where a short bolt leaves its gap and '?' disc)
      const zc = {x: lc.x + st.sign * st.geo.G * 0.22 * drop, y: lc.y};
      if (st.lupaShown) {
        const lf = st.lupa.frame(lc, ang, lift, drop > 0.6 ? seg(drop, 0.6, 1) : 0, zc);
        delete lf.grip;
        Object.assign(nodes, lf);
      }
      // frame around the changed row
      const fp = ease.inOutSine(seg(u, ...W.frames));
      nodes[`${P}frame`] = {opacity: fp > 0 ? 1 : 0, 'stroke-dashoffset': r(st.frLen * (1 - fp))};
      // semantics
      const cardC = {x: st.cc.x + pose.dx, y: st.cc.y + pose.dy};
      sem[`card${P}`] = P2(cardC);
      sem[`lupa${P}`] = P2(lc);
      sem[`travel${P}`] = travel;
      sem[`seated${P}`] = seated;
      sem[`short${P}`] = short;
      sem[`statuses${P}`] = st.rows.map(rw => rw.status);
      sem[`clip${P}`] = st.clip ? {kind: st.clipKind, visible: clipIn > 0.3} : null;
      // everything a viewer can tell apart between A and B (used to prove that nothing differs before the change beat)
      sem[`look${P}`] = {
        head: r(seg(u, ...W.headers), 3), label: r(labIn, 3),
        clip: st.clip ? r(clamp(clipIn * 3), 3) : 0, clipKind: st.clip && clipIn > 0 ? st.clipKind : null,
        // (mirror-normalised: in the shared-plate layout B is A's mirror image)
        pose: [r(pose.dx * st.sign, 2), r(pose.dy, 2), r(pose.rot * st.sign, 3)], bolts: boltLooks, travel, marks,
        lupa: [r(carry, 3), r(lc.y - st.rest.c.y, 2)], frame: r(fp, 3),
        card: [r(geo.card.w, 1), r(geo.card.h, 1), r(geo.plate.w, 1)],
        boltsClippedToCard: true,
      };
      sem[`lupa${P}OverJoint`] = carry >= 1;
      sem[`lupa${P}AtRest`] = carry === 0;
      // the magnifier only ever moves straight down the gap column of the changed joint (no title or row text on its way)
      sem[`lupa${P}InGapColumn`] = Math.abs(lc.x - st.J.x) < 0.5 && Math.abs(lc.x - (geo.cells[L.k].port.x + geo.cells[L.k].sock.x) / 2) < 0.5;
      st.rows.forEach((rw, i) => {
        if (st.bolts[i]) {
          const tip = st.bolts[i].tipAt(travel[i]);
          // world tip: card pose applied (rotation about the card centre, then offset)
          const a = (pose.rot * Math.PI) / 180;
          const dx0 = tip.x - st.cc.x, dy0 = tip.y - st.cc.y;
          sem[`tip${P}${i}`] = P2({x: st.cc.x + dx0 * Math.cos(a) - dy0 * Math.sin(a) + pose.dx, y: st.cc.y + dx0 * Math.sin(a) + dy0 * Math.cos(a) + pose.dy});
        }
      });
    });
    // comparison guide + notes
    const gp = ease.inOutSine(seg(u, ...W.guide));
    nodes.guide = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-line'] = {'stroke-dashoffset': r(L.guideLen * (1 - gp))};
    nodes['guide-b'] = {opacity: gp >= 0.98 ? 1 : 0};
    if (L.guideChip) Object.assign(nodes, L.guideChip.frame(seg(u, ...W.guideChip)));
    if (L.shared) nodes['shared-g'] = {opacity: r(seg(u, ...W.notes), 3)};
    if (L.neutral) nodes['neutral-g'] = {opacity: r(seg(u, W.notes[0] + 0.02, W.notes[1] + 0.02), 3)};

    const differing = L.rowsA.map((rw, i) => (rw.status !== L.rowsB[i].status ? i : -1)).filter(i => i >= 0);
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      arrangement: L.sharedPlate ? 'shared-plate' : L.row ? 'side-by-side' : 'stacked',
      rowTextPx: r(L.rowPx, 1),
      textSize: r(L.s, 2),
      layoutBudget: L.budget,
      scenes: 2,
      changedAttribute: L.k,
      differingRows: differing,
      slide: r(pr, 3),
      docked: pr >= 1,
      guide: r(gp, 3),
      ...sem,
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
    slug: 'reasoning-01-contrast',
    title: 'Fact and rule — attributes coinciding vs one attribute disputed',
    titleEs: 'Hecho y regla — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho y regla',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical docking stations (same fact card, same rule plate, same timing) differ in one supplied fact: the status of one attribute. A clips an "=" marker on that row and its latch bolt seats; B clips a "?" marker, its bolt stops short with a question mark and only B’s magnifier moves over the joint. A guide links the changed row in both scenes, with the shared facts and a neutral note; no winner or conclusion.',
    tags: ['reasoning', 'fact', 'rule', 'attributes', 'comparison', 'disputed', 'coinciding', 'contrast', 'magnifier', 'connector'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-y-regla.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
