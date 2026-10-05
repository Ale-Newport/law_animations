/**
 * LAW-0243 — Requerimiento previo · contrast
 *
 * Storyboard (two complete copies of the same office scene — side by side on
 * wide and square boxes, stacked on tall boxes; the case file, the letter's
 * contents, the date line and the reply slip's text are identical in both and
 * are printed once in a shared strip; the action clock c = (u − 0.17) / 0.6
 * runs identically in both scenes until the reply beat):
 *  0.00–0.17  base: two identical scenes at rest (same people, letter, tray,
 *             pocket, calendar); the shared strip is readable.
 *  0.17–0.40  the scenario headers appear (A "Reply received", B "Reply
 *             pending", as supplied) and the changed-fact chip names the one
 *             fact that differs; in both scenes Party A signs the letter and
 *             pushes it onto the track.
 *  0.40–0.77  in parallel: the letter slides into Party B's tray and the
 *             response space opens (calendar unfolds, reply pocket lights up).
 *             Only the contrasted circumstance then differs: in A, Party B
 *             tears off the reply slip and sends it back along the return rail
 *             into Party A's pocket, and a glyph drops into the supplied day's
 *             slot; in B, nothing comes back — the pocket and the calendar
 *             slots stay empty (neutral dashed outlines, no consequence shown).
 *  0.77–1.00  a comparison guide outlines the reply pocket in both scenes and
 *             links them with the supplied guide label; neutral note and the
 *             "as supplied · no conclusion drawn" key. No winner, score, time
 *             limit, effect of silence or outcome is shown.
 * @module animations/civil-claim/LAW-0243
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj} from '../../schemas/fields.js';
import {contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  RP_DEFAULTS, RP_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, outcomeText, gchip, hit, solveStage, claimStage, choreo, placeTag, replyDayLabel,
} from './kits/requerimiento-previo.js';
import {fitG, calendarStrip, glue} from './kits/civil-claim-art.js';

const ID = 'LAW-0243';
const DURATION = 7500;
const C0 = 0.17, C1 = 0.77;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ = {headers: [0.17, 0.24], changed: [0.28, 0.36], guide: [0.775, 0.83], note: [0.8, 0.86]};
const TAGS = {sent: [0.47, 0.53], delivered: [0.63, 0.69], outcome: [0.975, 1]};
const SIZE = {landscape: 25.5, portrait: 22, square: 31};
const PEOPLE_KS = [2.0, 1.8, 1.6, 1.4, 1.2, 1];
// (fewer people scales once the supplied text has to step down)
const STEP_PKS = [1.8, 1.4, 1];
/** vertical gap between the items of the side text column (design units) */
const SIDE_GAP = 6;
const S_MIN = {landscape: 0.3, square: 0.3, portrait: 0.3};

const STRINGS = {
  en: {...RP_STRINGS.en, same: 'Same in A and B', changedFact: 'Changed fact', letter: 'Letter'},
  es: {...RP_STRINGS.es, same: 'Igual en A y B', changedFact: 'Hecho cambiado', letter: 'Carta'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  ...contrastFields(),
};

const defaultParams = {
  parties: RP_DEFAULTS.parties,
  documents: RP_DEFAULTS.documents,
  stages: RP_DEFAULTS.stages,
  dates: RP_DEFAULTS.dates,
  scenarioA: {label: 'Reply received', caption: 'A reply comes back in the supplied response space'},
  scenarioB: {label: 'Reply pending', caption: 'No reply is in the tray (as supplied)'},
  changedFact: 'Whether a reply comes back (as supplied)',
  sharedFacts: ['Same letter, same parties, same supplied response space'],
  comparisonLabels: {guide: 'Only the reply pocket differs', neutral: 'Two supplied situations side by side; no outcome is stated'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) { return compose(ctx); },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** flow chips left to right, wrapping rows, inside width w starting at (x, y) */
function flow(items, x, y, w, gap) {
  const out = [];
  let cx = x, cy = y, rowH = 0;
  for (const it of items) {
    if (cx > x && cx + it.w > x + w) { cx = x; cy += rowH + gap; rowH = 0; }
    out.push({...it, x: cx, y: cy});
    cx += it.w + gap;
    rowH = Math.max(rowH, it.h);
  }
  return {items: out, h: cy + rowH - y};
}

function compose(ctx) {
  // supplied text starts at ~20 px (1080p); only when the scenes would fall below their share (long supplied
  // text) does it step down, never below ~16 px
  const D = ctx.design;
  const fitScale = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const px = fitScale * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const B = SIZE[ctx.view.shape];
  const floor = 16.4 / px;
  // (shares of the rendered FRAME width: each scene >= 0.41 side by side, >= 0.56 stacked beside the text column,
  // >= 0.82 stacked full width — a small margin over the thresholds the tests measure)
  const need = L0 => (L0.arrangement === 'row' ? L0.frameFrac >= 0.41 : L0.arrangement === 'side' ? L0.colFits && L0.frameFrac >= 0.551 : L0.frameFrac >= 0.82);
  // square frames: the scenes side by side, or stacked with the shared texts in a right-hand column; the larger
  // people win (both are tried at every text step)
  const arrs = ctx.view.shape === 'square' ? ['side', 'row'] : [ctx.view.shape === 'portrait' ? 'column' : 'row'];
  // (square: the stacked scenes are laid out first; the row can only win with larger text than theirs — ties go to
  // the stacked scenes — so the row skips every text size at or below the one the stacked scenes kept)
  let bar = 0;
  // each arrangement at the largest text size that keeps its scenes large enough; then the larger people win
  // (the people are drawn as large as the scene's share allows — a smaller people scale is tried before the supplied
  // text is ever stepped down)
  const best = arrs.map(a => {
    let L = null;
    // (side: a wider text column when the shared texts would overflow a narrow one)
    // (every people scale and column width is tried: the largest people among the layouts that keep their share win)
    let good = null;
    // (a wider column is only tried when the narrower one keeps no layout; the column's fit does not depend on the
    // people scale, so an overflowing column is not tried again at the other scales)
    const skip = sz => a === 'row' && sz <= bar + 1e-6;
    for (const colK of skip(B * 0.96) ? [] : a === 'side' ? [0.31, 0.335, 0.355] : [0.36]) {
      for (const pk of PEOPLE_KS) {
        const prev = L;
        L = composeAt(ctx, B * 0.96, a, pk, colK, true);
        if (need(L) && (!good || L.s * L.pk > good.s * good.pk)) good = L;
        if (L.colFits === false) break;
        // (a share that the people scale does not change at all will not reach the threshold at another scale)
        if (!need(L) && prev && !prev.stub && prev.small === L.small && prev.frameFrac === L.frameFrac) break;
      }
      if (good) break;
    }
    if (good) { if (a === 'side') bar = good.small >= 19.55 / px - 1e-6 ? B : good.small; return good; }
    // (then the text steps down; at each step every column width is tried before the next step)
    // (and at each step the people scales, the largest people among the layouts that keep their share winning)
    // (a first, small step keeps the baseline size: text >= 19.55 px — then the usual steps)
    const base0 = 19.55 / px;
    const steps = [B * 0.96 * 0.98 >= base0 ? B * 0.96 * 0.98 : null, B * 0.86, B * 0.74, B * 0.62].filter(Boolean);
    for (const sz0 of steps) {
      const sz = Math.max(floor, sz0);
      if (skip(sz)) break;
      for (const colK of a === 'side' ? [0.31, 0.335, 0.355] : [0.36]) {
        for (const pk of STEP_PKS) {
          const prev = L;
          L = composeAt(ctx, sz, a, pk, colK, true);
          if (need(L) && (!good || L.s * L.pk > good.s * good.pk)) good = L;
          if (L.colFits === false) break;
          if (!need(L) && prev && !prev.stub && prev.small === L.small && prev.frameFrac === L.frameFrac) break;
        }
        if (good) break;
      }
      if (good || sz === floor) break;
    }
    if (a === 'side' && good) bar = good.small >= 19.55 / px - 1e-6 ? B : good.small;
    return good || (L && !L.stub ? L : composeAt(ctx, floor, a, 1));
  });
  // (a layout whose text column overflows the frame never wins over one that fits; then the larger people)
  // (square frames prefer the stacked scenes with the shared A/B calendar — coordinator decision 2026-09-26)
  // (text at the baseline size — >= 19.55 px — counts as full size: then the stacked scenes win over the row)
  const key = q => [need(q) ? 1 : 0, q.colFits === false ? 0 : 1, q.small >= 19.55 / px - 1e-6 ? 1 : 0, q.arrangement === 'side' ? 1 : 0, q.small, q.s * q.pk];
  return best.reduce((a, b) => { const ka = key(a), kb = key(b); for (let i = 0; i < ka.length; i++) { if (kb[i] !== ka[i]) return kb[i] > ka[i] ? b : a; } return a; });
}

function composeAt(ctx, small, arr, pk = 1, colK = 0.36, quick = false) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const arrangement = arr || (shape === 'portrait' ? 'column' : 'row');
  const side = arrangement === 'side';
  const looks = looksOf(ctx, p);
  // compact scenes: the props carry no printed labels (the shared texts are printed once in the strip)
  const sp = {...p, labels: {calendar: '', inTray: '', replyTray: ''}};
  const gap = arrangement === 'row' ? 28 : side ? 10 : 22;

  // ---- shared strip (drawn once): same-facts label, letter contents, date line, reply slip, case file,
  //      supplied shared facts, the changed fact, the neutral note and the key
  // (side: the shared texts in a right-hand column beside the stacked scenes)
  // (labels hidden: nothing goes in the column, the stacked scenes take the whole width)
  const colW = side && (showKey || showAll) ? Math.round((D.w - 16) * colK) : 0;
  const stripW = side ? colW : D.w - 16;
  const mk = (text, o = {}) => gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: o.maxWidth ?? stripW, size: o.size ?? small, minSize: o.size ?? small, maxLines: o.maxLines ?? 3, fill: th.card, stroke: o.stroke ?? th.inkSoft, color: o.color ?? th.ink, weight: o.weight ?? 600, name: o.name});
  const stripDefs = [];
  // everything identical in A and B, as ONE wrapped card (dense, whole words only)
  if (showAll || showKey) {
    const same = showAll
      ? [`${p.documents.letter.ref} · ${p.documents.letter.title}`, p.dates.sent, p.documents.replySlip, `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`, ...p.sharedFacts, `${p.stages.sent} → ${p.stages.delivered}`]
      : [`${p.stages.sent} → ${p.stages.delivered}`];
    stripDefs.push(['strip-same', `${ctx.t.same}: ${same.join('  ·  ')}`, {maxLines: side ? 30 : 12, weight: 500}]);
  }
  if (showKey) {
    stripDefs.push(['strip-changed', `${ctx.t.changedFact}: ${p.changedFact}`, {stroke: th.accent3, weight: 700}]);
    stripDefs.push(['strip-key', `◦ ${ctx.t.key}`, {stroke: th.inkSoft, color: th.inkSoft}]);
  }
  if (showAll) stripDefs.push(['strip-note', p.comparisonLabels.neutral, {weight: 500}]);
  const probes = stripDefs.map(([name, text, o]) => ({name, text, o, c: mk(text, o)}));
  // guide label row first (between the two changed details)
  const guideProbe = showKey ? mk(p.comparisonLabels.guide, {stroke: th.accent2, weight: 700, size: small}) : null;
  const flowed = flow(probes.map(q => ({name: q.name, w: q.c.box.w, h: q.c.box.h})), 8, 0, stripW, 10);
  const guideRowH = guideProbe && arrangement === 'row' ? guideProbe.box.h + 26 : 0;
  const stripH = side ? 0 : (flowed.items.length ? flowed.h + 10 : 0) + guideRowH;

  // ---- headers
  const hdrSize = Math.min(small * 1.12, 34);
  const hdrW = arrangement === 'row' ? (D.w - 16 - gap) / 2 : side ? D.w - 16 - colW - gap : D.w - 16;
  const hdrTW = (side ? colW : hdrW) - hdrSize * 2.2, hdrML = side ? 5 : 2;
  // (side: the caption runs under the badge too, across the whole column)
  const capTW = side ? colW - 4 : hdrTW;
  const fitHdr = (txt, sz, wt, tw = hdrTW) => fitG(txt, {maxWidth: tw, size: sz, minSize: sz, maxLines: hdrML, weight: wt});
  // A and B headers get the same line counts (equal visual weight): the shorter text is wrapped narrower
  const pair = (ta, tb, sz, wt, tw = hdrTW) => {
    let a = fitHdr(ta, sz, wt, tw), b = fitHdr(tb, sz, wt, tw);
    const narrow = (t, n) => {
      let w = tw, f = fitG(t, {maxWidth: w, size: sz, minSize: sz, maxLines: hdrML, weight: wt});
      while (f.lines.length < n && w > sz * 4) { w *= 0.92; f = fitG(t, {maxWidth: w, size: sz, minSize: sz, maxLines: 4, weight: wt}); }
      return f;
    };
    if (a.lines.length < b.lines.length) a = narrow(ta, b.lines.length);
    else if (b.lines.length < a.lines.length) b = narrow(tb, a.lines.length);
    return [a, b];
  };
  const [lA, lB] = pair(p.scenarioA.label, p.scenarioB.label, hdrSize, 700);
  const [cA, cB] = pair(p.scenarioA.caption || '', p.scenarioB.caption || '', small, 500, capTW);
  const hA = [lA, cA], hB = [lB, cB];
  // equal header heights for A and B (equal visual weight)
  const lab = Math.max(hA[0].lines.length, hB[0].lines.length), capL = Math.max(hA[1].lines.length, hB[1].lines.length);
  // (side: the caption runs under the badge, so it starts below the badge's circle)
  const capOff = side ? Math.max(4 + hdrSize * 1.2 * lab + 4, hdrSize * 1.0 + 16) : 4 + hdrSize * 1.2 * lab + 4;
  const hasCap = showAll && (p.scenarioA.caption || p.scenarioB.caption);
  const headerH = showKey ? (hasCap ? capOff + small * 1.2 * capL + 2 : hdrSize * 1.2 * lab) + 14 : hdrSize * 1.9;

  // ---- name chips band under each scene
  const chipMax = side ? hdrW * 0.49 : arrangement === 'row' ? hdrW * 0.46 : D.w * 0.46;
  const cap = i => partyCaption(p, i);
  const nameProbe = showKey ? [0, 1].map(i => gchip(ctx, cap(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6})) : [];
  const chipBand = nameProbe.length ? Math.max(...nameProbe.map(c => c.box.h)) + 12 : 4;

  // ---- panel geometry
  const top = 8;
  const panelW = hdrW;
  // the calendar strip (the response space) hangs across the top of each scene, drawn in design units so its
  // supplied day labels keep their size whatever the scale of the people and props. Side arrangement: ONE strip
  // drawn once above both scenes (shared content, LAW-0135), with an A row and a B row of slots in every day —
  // the only difference, the returned slip's glyph, shows in A's row
  // (stacked scenes — beside the text column or full width on tall frames — share ONE calendar strip)
  const sharedCal = side || arrangement === 'column';
  const badgeW = sharedCal ? small * 1.9 : 0;
  const calW = panelW - 12 - badgeW;
  // (a day label may wrap onto two lines — at whole words, its number kept with its word — before the strip loses a
  // column)
  const twoLine = d => {
    const w = glue(d).split(' ').filter(Boolean);
    const m = t => ctx.measure(t.replace(/\u00a0/g, ' '), small, 700, 'sans');
    if (w.length < 2) return m(w.join(' '));
    let best = Infinity;
    for (let k = 1; k < w.length; k++) best = Math.min(best, Math.max(m(w.slice(0, k).join(' ')), m(w.slice(k).join(' '))));
    return best;
  };
  // (one-line or two-line day labels: whichever gives the lower strip)
  const colsFor = dw => { let c = p.dates.window.length; while (c > 1 && calW / c < dw) c--; return c; };
  const oneLine = Math.max(...p.dates.window.map(d => ctx.measure(glue(d).replace(/\u00a0/g, ' '), small, 700, 'sans'))) + small * 2.6;
  const probeFor = c => calendarStrip(ctx, {prefix: 'calP', x: 0, y: 0, w: calW, cols: c, days: p.dates.window, title: '', showTitle: false, size: small, showText: showAll, inline: true, slotRows: sharedCal ? 2 : 1});
  const colsA = colsFor(oneLine), colsB = colsFor(Math.max(...p.dates.window.map(twoLine)) + small * 2.6);
  const probeA = probeFor(colsA), probeB = colsB === colsA ? probeA : probeFor(colsB);
  const calCols = probeB.h < probeA.h - 1 ? colsB : colsA;
  const calProbe = calCols === colsA ? probeA : probeB;
  const calBandShared = sharedCal ? calProbe.h + small * 0.9 + 10 : 0;
  const calBand = sharedCal ? 0 : calProbe.h + small * 0.9 + 6;
  // (side: the name chips, identical in A and B, are drawn once in a row between the two stacked scenes — shared
  // content drawn once, LAW-0135 — so both scenes gain that height)
  const sharedNames = side && nameProbe.length > 0;
  const nameRow = sharedNames ? chipBand : 0;
  const panelH = arrangement === 'row' ? D.h - top - stripH - 8 : (D.h - top - stripH - calBandShared - 8 - gap - nameRow) / 2;
  // (side: the headers stand in the right-hand column, level with their scenes)
  const headerP = side ? 0 : headerH;
  const stageH = panelH - headerP - calBand - (sharedNames ? 0 : chipBand);
  // design units → share of the rendered frame's width
  const toFrame = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) / ctx.view.width;
  const modes = (arrangement === 'row' ? [1300, 1150, 1000, 880, 1500, 1700] : side ? Array.from({length: 18}, (_, i) => 1000 + i * 200) : [900, 1050, 1250, 1400, 1550, 1700, 1850, 2050, 2300]).map(w => ['above', 'none', w]);
  // (quick: the text column's fit depends on the texts alone — an overflowing column returns before the stage is solved)
  if (side && quick) {
    const py1 = top + calBandShared + panelH + gap + nameRow;
    const sy = top + 4 + headerH + SIDE_GAP;
    const sf = flow(probes.map(q => ({name: q.name, w: q.c.box.w, h: q.c.box.h})), 0, sy, stripW, SIDE_GAP);
    const hy1 = Math.max(py1, sy + sf.h + SIDE_GAP + (guideProbe ? guideProbe.box.h : 0) + SIDE_GAP);
    if (hy1 + headerH > D.h - 8) return {arrangement, colFits: false, small, pk, s: 0, stageFraction: 0, frameFrac: 0, stub: true};
  }
  const sol = solveStage(ctx, {B: small, availW: panelW, availH: stageH, sMin: S_MIN[shape], preferWide: true, wideTol: 0.96, minWideW: (side ? (colW ? 0.5515 : 0.86) : arrangement === 'row' ? 0.415 : 0.83) / toFrame,
    modes, opts: {prefix: 'sa', p: sp, looks, showText: showAll, markIdx: p.dates.replyDay, compact: true, railClear: true, tight: true, slotK: 1.6, noCal: true, peopleK: pk}});
  const mkStage = prefix => solveStageSame(ctx, sol, prefix, sp, looks, showAll, pk);
  const stA = sol.stage;
  const stB = mkStage('sb');
  const s = sol.s;
  const E = stA.ext;
  const G = stA.G;
  const panels = [0, 1].map(i => {
    const px = arrangement === 'row' ? 8 + i * (panelW + gap) : 8;
    const py = arrangement === 'row' ? top : top + calBandShared + i * (panelH + gap + nameRow);
    const floorY = py + panelH - (sharedNames ? 0 : chipBand);
    const ox = px + (panelW - E.w * s) / 2 - E.x * s;
    return {i, px, py, ox, oy: floorY, headerY: py, w: panelW, h: panelH, calY: py + headerP + small * 0.9};
  });
  const cals = sharedCal
    ? [calendarStrip(ctx, {prefix: 'calA', x: 8 + 6 + badgeW, y: top + small * 0.9, w: calW, cols: calCols, days: p.dates.window, title: '', showTitle: false, size: small, showText: showAll, inline: true, slotRows: 2})]
    : panels.map((pn, i) => calendarStrip(ctx, {prefix: `cal${i ? 'B' : 'A'}`, x: pn.px + 6, y: pn.calY, w: calW, cols: calCols, days: p.dates.window, title: '', showTitle: false, size: small, showText: showAll, inline: true}));
  // (side: an A badge and a B badge beside each row of slots, in the scenes' own colours)
  const slotBadges = sharedCal ? Array.from({length: cals[0].rows}, (_, rr) => [0, 1].map(k => {
    const sb = cals[0].slotBox(rr * cals[0].cols, k);
    const R = Math.max(sb.h * 0.5, small * 0.62);
    const cx = 8 + badgeW / 2, cy = sb.y + sb.h / 2;
    return g(null,
      h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: k ? th.accent3 : th.accent2, stroke: th.ink, 'stroke-width': 2}),
      h('text', {x: r(cx), y: r(cy + small * 0.34), 'text-anchor': 'middle', 'font-size': r(small), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, k ? 'B' : 'A'));
  })).flat() : [];
  const Mp = (pn, q) => ({x: pn.ox + q.x * s, y: pn.oy + q.y * s});
  const Mbp = (pn, b) => ({x: pn.ox + b.x * s, y: pn.oy + b.y * s, w: b.w * s, h: b.h * s});
  const bounds = {x: 6, y: 6, w: D.w - 12, h: D.h - 12};

  // ---- headers (badge + label + caption), same geometry for A and B
  // side: the column holds A's header (level with scene A), the shared texts and the guide label, then B's
  // header (level with scene B, or just under the texts)
  const colTop = top + 4;
  const sideStripY = colTop + headerH + SIDE_GAP;
  const sideFlow = side ? flow(probes.map(q => ({name: q.name, w: q.c.box.w, h: q.c.box.h})), 0, sideStripY, stripW, SIDE_GAP) : null;
  const sideGuideY = side ? sideStripY + sideFlow.h + SIDE_GAP : 0;
  const hdrY = side ? [colTop, Math.max(panels[1].py, sideGuideY + (guideProbe ? guideProbe.box.h : 0) + SIDE_GAP)] : [0, 0];
  const colFits = !side || hdrY[1] + headerH <= D.h - 8;
  const headers = panels.map((pn, i) => {
    const hh = i === 0 ? hA : hB;
    const color = i === 0 ? th.accent2 : th.accent3;
    const R = hdrSize * (side ? 0.5 : 0.72);
    // (labels hidden on stacked scenes: no column — the badge marks each scene at its top-left corner)
    const noCol = side && !colW;
    const hx = noCol ? pn.px + pn.w / 2 - R - 2 : side ? 8 + hdrW + gap : pn.px, hy = noCol ? pn.py + 4 : side ? hdrY[i] : pn.headerY;
    const cx = hx + R + 2, cy = hy + R + 4;
    const parts = [h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: color, stroke: th.ink, 'stroke-width': 2.5})];
    if (showKey) {
      parts.push(h('text', {x: r(cx), y: r(cy + hdrSize * 0.36), 'text-anchor': 'middle', 'font-size': r(hdrSize), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i === 0 ? 'A' : 'B'));
      parts.push(textBlock(hh[0], {x: cx + R + 12, y: hy + 4, fill: th.fg, name: `h${i ? 'B' : 'A'}-lab`}));
      if (showAll && hh[1].full) parts.push(textBlock(hh[1], {x: side ? hx + 2 : cx + R + 12, y: hy + capOff, fill: th.fgSoft, name: `h${i ? 'B' : 'A'}-cap`}));
    }
    return g({name: `hdr${i ? 'B' : 'A'}`, opacity: 0}, parts);
  });

  // ---- per-scene labels: name chips, stage tags (identical placement in A and B)
  const occupiedOf = pn => {
    const bx = stA.boxes;
    return [bx.personA, bx.personB, bx.cal, bx.letterEnd, bx.pocket, bx.trayAt].map(b => Mbp(pn, b)).concat([Mbp(pn, {x: 0, y: G.top - 70, w: 200, h: 70})]);
  };
  const perScene = panels.map((pn, i) => {
    const occupied = occupiedOf(pn);
    // header box
    occupied.push({x: pn.px, y: pn.headerY, w: pn.w, h: headerP + calBand});
    const chips = [];
    if (showKey && !(sharedNames && i === 1)) {
      [0, 1].forEach(k => {
        const x = Mp(pn, {x: k ? G.W : 0, y: 0}).x;
        const w = nameProbe[k].box.w;
        const cx = clamp(x, pn.px + w / 2, pn.px + pn.w - w / 2);
        const c = gchip(ctx, cap(k), {x: cx, y: pn.oy + 6, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip${i ? 'B' : 'A'}-${k ? 'b' : 'a'}`});
        chips.push(c);
        occupied.push(c.box);
      });
    }
    const pb = {x: pn.px, y: pn.py, w: pn.w, h: pn.h};
    const tags = {};
    if (showKey) {
      const sfx = i ? 'B' : 'A';
      const add = (name, text, anchor, color) => {
        const t = placeTag(ctx, {name: `${name}${sfx}`, text, anchor, occupied, bounds: pb, maxWidth: Math.min(pn.w * 0.5, 380), size: small, color, maxLead: 30});
        occupied.push(t.box);
        tags[name] = t;
      };
      const pk = Mbp(pn, stA.boxes.pocket);
      add('tag-outcome', outcomeText(p, i === 0 ? 'received' : 'pending'), {x: pk.x + pk.w - 2, y: pk.y + pk.h * 0.5}, th.accent2);
    }
    return {chips, tags, occupied};
  });
  // equal visual weight: B's tags reuse A's positions when both fit (same geometry, same sizes)

  // ---- strip placement
  const colX = 8 + hdrW + gap;
  const stripY = side ? sideStripY : D.h - 8 - stripH;
  const guideY = stripY + 18;
  const stripItems = flow(probes.map(q => ({name: q.name, w: q.c.box.w, h: q.c.box.h})), side ? colX : 8, stripY + guideRowH, stripW, side ? SIDE_GAP : 10).items;
  const stripNodes = stripItems.map((it, k) => {
    const q = probes[k];
    const c = gchip(ctx, q.text, {x: it.x, y: it.y, anchor: 'start', maxWidth: q.c.box.w + 2, size: q.o.size ?? small, minSize: q.o.size ?? small, maxLines: q.o.maxLines ?? 3, fill: th.card, stroke: q.o.stroke ?? th.inkSoft, color: q.o.color ?? th.ink, weight: q.o.weight ?? 600});
    return {name: it.name, node: g({name: it.name}, c.node), box: c.box, fit: c.fit};
  });

  // ---- comparison guide: an outline around each scene's reply pocket, joined to the guide label
  let guide = null;
  if (showKey) {
    const outl = panels.map(pn => {
      const b = Mbp(pn, stA.boxes.pocket);
      return {x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12};
    });
    const segs = [];
    let label;
    if (arrangement === 'row') {
      // label in the strip's first row, centred between the two outlines; leaders drop from the outlines
      const cxA = outl[0].x + outl[0].w / 2, cxB = outl[1].x + outl[1].w / 2;
      const lx = (cxA + cxB) / 2;
      label = gchip(ctx, p.comparisonLabels.guide, {x: lx, y: guideY, anchor: 'middle', maxWidth: Math.min(stripW, 760), size: small, minSize: small, maxLines: 3, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700, name: 'guide-chip'});
      const ly = guideY - 8;
      segs.push(`M${r(cxA)} ${r(outl[0].y + outl[0].h)}V${r(ly)}H${r(cxB)}V${r(outl[1].y + outl[1].h)}`);
      segs.push(`M${r(lx)} ${r(ly)}V${r(guideY)}`);
    } else if (side) {
      // stacked scenes, texts on the right: the label sits in the column under the shared texts; its leaders run
      // along the gutter between the scenes and the column, then across to each outline
      const gy = sideGuideY;
      label = gchip(ctx, p.comparisonLabels.guide, {x: colX, y: gy, anchor: 'start', maxWidth: colW, size: small, minSize: small, maxLines: 4, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700, name: 'guide-chip'});
      const lb = label.box, ly = lb.y + lb.h / 2, gx = colX - gap / 2;
      // (each leader reaches its outline from below, under the pocket's own tag)
      const under = o => o.y + o.h + 7;
      segs.push(`M${r(lb.x)} ${r(ly)}H${r(gx)}V${r(under(outl[0]))}H${r(outl[0].x + outl[0].w / 2)}V${r(outl[0].y + outl[0].h)}`);
      segs.push(`M${r(gx)} ${r(ly)}V${r(under(outl[1]))}H${r(outl[1].x + outl[1].w / 2)}V${r(outl[1].y + outl[1].h)}`);
    } else {
      // stacked: the label sits in the gap between the scenes; one leader up to A's outline, one down the
      // side margin to B's outline
      const gy = panels[0].py + panels[0].h + gap / 2;
      label = gchip(ctx, p.comparisonLabels.guide, {x: D.w - 10, y: gy - small * 0.9, anchor: 'end', maxWidth: D.w * 0.55, size: small, minSize: small, maxLines: 3, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700, name: 'guide-chip'});
      const lb = label.box;
      // both leaders run along the left margin (clear of the name tags, headers and calendars) and reach each
      // outline from below, under the pocket's own tag
      const mx = 4, gyL = lb.y + lb.h / 2;
      const ua = outl[0].y + outl[0].h + 7, ub = outl[1].y + outl[1].h + 7;
      segs.push(`M${r(lb.x)} ${r(gyL)}H${r(mx)}`);
      segs.push(`M${r(mx)} ${r(gyL)}V${r(ua)}H${r(outl[0].x + outl[0].w / 2)}V${r(outl[0].y + outl[0].h)}`);
      segs.push(`M${r(mx)} ${r(gyL)}V${r(ub)}H${r(outl[1].x + outl[1].w / 2)}V${r(outl[1].y + outl[1].h)}`);
    }
    guide = {
      node: g({name: 'guide', opacity: 0},
        outl.map(o => h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 14), fill: 'none', stroke: th.accent2, 'stroke-width': 4})),
        segs.map(d => h('path', {d, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round'})),
        label.node),
      box: label.box, fit: label.fit, outlines: outl,
    };
  }

  const labelBoxes = [...perScene.flatMap(q => [...q.chips.map(c => c.box), ...Object.values(q.tags).map(t => t.box)]), ...stripNodes.map(n => n.box), ...(guide ? [guide.box] : [])];
  const labelsClear = labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)));
  const faces = panels.flatMap(pn => [Mbp(pn, stA.boxes.headA), Mbp(pn, stA.boxes.headB)]);
  const truncated = [...stA.fits, ...cals[0].dayFits, ...hA, ...hB, ...stripNodes.map(n => n.fit), ...perScene.flatMap(q => [...q.chips.map(c => c.fit), ...Object.values(q.tags).map(t => t.fit)]), guide && guide.fit]
    .filter(f => f && f.truncated).map(f => f.full);
  return {arrangement, pk, small, colFits, headK: 1, panels, cals, slotBadges, stA, stB, s, m: sol.m, headers, perScene, stripNodes, guide, labelsClear, labelBoxes, faces, truncated,
    dbg: [stripH, headerH, calBand, chipBand, panelH, colFits ? 1 : 0, Math.round(hdrY[1]), Math.round(D.h)].map(v => Math.round(v)), stageFraction: r(E.w * s / D.w, 3), frameFrac: r(E.w * s * toFrame, 3), sceneShareH: r((E.h - 44) * s / D.h, 3), textPx: r(stA.G.ts * s, 2), stripY};
}

/** Build the second stage with exactly the first one's solved geometry (only the prefix differs). */
function solveStageSame(ctx, sol, prefix, p, looks, showText, pk = 1) {
  return sol.rebuild ? sol.rebuild(prefix) : rebuildStage(ctx, sol, prefix, p, looks, showText, pk);
}
function rebuildStage(ctx, sol, prefix, p, looks, showText, pk = 1) {
  const st = sol.stage;
  return claimStage(ctx, {prefix, p, looks, showText, markIdx: p.dates.replyDay, compact: true, railClear: true, tight: true, slotK: 1.6, noCal: true, peopleK: pk,
    W: sol.W, ts: st.G.ts * st.k, tsMax: sol.tsMax, calMode: sol.calMode, fileMode: sol.fileMode});
}

function buildScene(ctx, L) {
  return g(null,
    L.panels.map((pn, i) => g({transform: `${T(pn.ox, pn.oy)} scale(${r(L.s, 5)})`}, (i ? L.stB : L.stA).node)),
    L.cals.map((c, i) => c.node(ctx.params.dates.replyDay)),
    L.slotBadges.length ? g({name: 'cal-badges', opacity: 0}, L.slotBadges) : null,
    L.headers,
    L.perScene.map(q => [q.chips.map(c => c.node), Object.values(q.tags).map(t => t.node)]),
    L.stripNodes.map(n => n.node),
    L.guide && L.guide.node,
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const c = clamp((u - C0) / (C1 - C0), 0, 1);
  const vA = choreo(c, 'received', L.stA.G, {reduced: ctx.reduced});
  const vB = choreo(c, 'pending', L.stB.G, {reduced: ctx.reduced});
  const pA = L.stA.pose(vA), pB = L.stB.pose(vB);
  const nodes = {...pA.nodes, ...pB.nodes};
  const md = p.dates.replyDay;
  Object.assign(nodes, L.cals[0].frame(vA.calOpen, vA.markP, md).nodes);
  if (L.cals[1]) Object.assign(nodes, L.cals[1].frame(vB.calOpen, vB.markP, md).nodes);
  if (L.slotBadges.length) nodes['cal-badges'] = {opacity: r(clamp(vA.calOpen * 3), 3)};
  const hdr = seg(u, ...W_.headers);
  nodes.hdrA = {opacity: r(hdr, 3)};
  nodes.hdrB = {opacity: r(hdr, 3)};
  const changed = seg(u, ...W_.changed);
  const tagP = {sent: seg(c, ...TAGS.sent), delivered: seg(c, ...TAGS.delivered), outcome: seg(c, ...TAGS.outcome)};
  L.perScene.forEach((q, i) => {
    const sfx = i ? 'B' : 'A';
    for (const k of Object.keys(q.tags)) nodes[`${k}${sfx}`] = {opacity: r(tagP[k.replace('tag-', '')], 3)};
  });
  for (const n of L.stripNodes) nodes[n.name] = {opacity: n.name === 'strip-changed' ? r(changed, 3) : n.name === 'strip-note' ? r(seg(u, ...W_.note), 3) : 1};
  const guideP = seg(u, ...W_.guide);
  if (L.guide) nodes.guide = {opacity: r(guideP, 3)};
  const S = L.s;
  const rel = q => (q ? {x: r(q.x, 1), y: r(q.y, 1)} : null);
  const look = (sem, v) => ({docAt: v.docAt, slipAt: v.slipAt, letter: rel(sem.letter), slip: rel(sem.slip), handA: rel(sem.handA), handB: rel(sem.handB), pen: rel(sem.pen),
    calOpen: sem.calOpen, markP: sem.markP, pocketEmpty: r(v.pocketEmpty, 3), lit: r(v.lit, 3), sig: r(v.sig, 3), header: r(hdr, 3), tags: r(tagP.sent, 3)});
  const W2 = (pn, q) => (q ? {x: r(pn.ox + q.x * S), y: r(pn.oy + q.y * S)} : null);
  const [PA, PB] = L.panels;
  const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), scenes: 2, arrangement: L.arrangement,
      lookA: look(pA.semantic, vA), lookB: look(pB.semantic, vB),
      a: {docAt: vA.docAt, slipAt: vA.slipAt, pocketEmpty: r(vA.pocketEmpty, 3), markP: pA.semantic.markP, calOpen: pA.semantic.calOpen},
      b: {docAt: vB.docAt, slipAt: vB.slipAt, pocketEmpty: r(vB.pocketEmpty, 3), markP: pB.semantic.markP, calOpen: pB.semantic.calOpen},
      handA_A: W2(PA, pA.semantic.handA), handB_A: W2(PA, pA.semantic.handB), handA_B: W2(PB, pB.semantic.handA), handB_B: W2(PB, pB.semantic.handB),
      penA: W2(PA, pA.semantic.pen), penGripA: W2(PA, pA.semantic.penGrip), penB: W2(PB, pB.semantic.pen), penGripB: W2(PB, pB.semantic.penGrip),
      letterA: W2(PA, pA.semantic.letter), letterB: W2(PB, pB.semantic.letter), letterGripA: W2(PA, pA.semantic.letterGrip), letterGripB: W2(PB, pB.semantic.letterGrip),
      slipA: W2(PA, pA.semantic.slip), slipGripA: W2(PA, pA.semantic.slipGrip), slipB: W2(PB, pB.semantic.slip),
      headers: r(hdr, 3), changedShown: r(changed, 3), guide: r(guideP, 3), neutralShown: r(seg(u, ...W_.note), 3),
      allReached: pA.semantic.allReached && pB.semantic.allReached,
      stageFraction: L.stageFraction, frameFrac: L.frameFrac, sceneShareH: L.sceneShareH, scale: r(L.s, 3), textPx: L.textPx, textMul: r(L.m, 2),
      labelsClear: L.labelsClear, truncated: L.truncated,
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !hit(b, f, 0))),
      replyDay: replyDayLabel(p),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-01-contrast',
    title: 'Pre-claim request — reply received vs reply pending, the same letter in two scenes',
    titleEs: 'Requerimiento previo — Comparación de dos supuestos',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Requerimiento previo',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical office scenes (side by side, or stacked on tall frames). In both, Party A signs the same letter and pushes it into Party B’s tray, and the same response space opens. Only one supplied fact differs: in A the reply slip comes back along the return rail into Party A’s pocket on the supplied day; in B nothing comes back and the pocket and calendar slots stay empty. A guide outlines both pockets; a neutral note says no outcome is stated.',
    tags: ['pre-claim request', 'contrast', 'reply received', 'reply pending', 'response space', 'calendar', 'tray', 'pocket', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
