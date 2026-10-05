/**
 * LAW-0332 — Solicitud de autorización · inspect
 *
 * Storyboard (the context is the state produced by the action: the generic room
 * seen from above after the placeholder petition passed, along the configured
 * path, into the prior-examination tray — the abstract stations of the same size
 * on one row, each with its neutral two-slot tray, the last stop's marked by a
 * plain tab; the path on the floor with its numbered steps —; on the board on
 * the bottom wall lies the tray's RECORD plate: the supplied state, its glyph (●
 * authorization requested / ◆ decision supplied, equal weight) over a small
 * two-slot tray icon, and the supplied value):
 *  0.00–0.20  build: the room fills its area beside a text panel; the record plate
 *             carries the supplied BEFORE value (by default "authorization
 *             requested"); the petition lies in the prior-examination tray with
 *             its ● pin, the tray's other slot empty.
 *  0.20–0.45  isolate: a frame settles on the record; the panel steps out and the
 *             context steps back; a lens (a window with a rim and a shadow) opens
 *             in the freed space with a REAL enlarged copy of the same room
 *             coordinates, cropped on the record plate and the empty dock under
 *             it. The plate's value and glyph leave the context as their enlarged
 *             copy arrives — one legible copy at a time.
 *  0.45–0.75  substitute ONE datum: the plate's old value enters the dock as the
 *             record captioned "was" as the supplied AFTER value comes in (never
 *             struck, never marked as wrong); the glyph changes ● → ◆ and the icon
 *             gains the decision's sheet (labels hidden: only these marks show the
 *             change). Only the dependent state follows, in the context, after the
 *             new value is legible: the decision's placeholder sheet (content never
 *             shown) is laid with its ◆ pin in the prior-examination tray's other
 *             slot and the petition's ● pin leaves.
 *  0.75–1.00  return: the lens closes onto the context with the new value, the old
 *             value docked (traceable) and a neutral changed-datum marker (Δ).
 *             Seeking back restores it exactly.
 * Nothing is evaluated: the state is only what the user supplied; no criterion,
 * threshold, time limit, rank or outcome (granted / refused / admitted);
 * jurisdiction unspecified.
 * @module animations/review/LAW-0332
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {measure} from '../../core/text.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {pxPerUnit, overlaps} from '../hearings/kits/apertura-audiencia.js';
import {saFields, SA_EN, SA_ES, localisedSa, resolveSa, saRoom, composeSa, searchSa, saRowNode, recordLayout, fitSa, hasLoneWord, SIDES} from './kits/solicitud-autorizacion.js';

const ID = 'LAW-0332';
/** The record plate's text, a multiple of the text size, largest first: the plate's value fills the lens. */
const REFS_SIZES = [2.1, 1.85, 1.6, 1.4, 1.2, 1];
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.18, 0.205], panelOut: [0.185, 0.205], ctxOut: [0.205, 0.209], back: [0.209, 0.224], open: [0.212, 0.24],
  move: [0.48, 0.55], chip: [0.53, 0.55], was: [0.54, 0.555], newIn: [0.555, 0.585], marks: [0.5, 0.585], cue: [0.6, 0.68],
  close: [0.728, 0.744], forward: [0.744, 0.758], ctxIn: [0.758, 0.761],
  frameOut: [0.735, 0.75], panelIn: [0.744, 0.762], marker: [0.8, 0.83],
};

const STRINGS = {
  en: {was: 'was'},
  es: {was: 'antes'},
};

const OWN_EN = {
  focusTarget: 'tray-record',
  beforeStatus: 'a',
  beforeValue: 'State noted for the tray: authorization requested (as supplied)',
  afterValue: 'State noted for the tray: decision text supplied (as supplied)',
  objectLabels: {record: 'Record of the prior-examination tray on the board (as supplied)'},
  contextLabels: {context: 'The room after the petition passed to the tray (as supplied)', marker: 'Changed: the supplied state'},
};
const OWN_ES = {
  focusTarget: 'tray-record',
  beforeStatus: 'a',
  beforeValue: 'Estado anotado: autorización solicitada (según lo aportado)',
  afterValue: 'Estado anotado: decisión suministrada (según lo aportado)',
  objectLabels: {record: 'Registro de la bandeja de examen previo en el tablero (según lo aportado)'},
  contextLabels: {context: 'La sala tras pasar la petición a la bandeja (según lo aportado)', marker: 'Cambio: el estado aportado'},
};
const EN = {...SA_EN, ...OWN_EN};
const ES = {...SA_ES, ...OWN_ES};

const sceneSchema = {
  ...saFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the prior-examination tray\'s record plate (the supplied state); only the dependent sheet in the tray\'s other slot and the pins follow it', ['tray-record']),
  beforeStatus: oneOf('The supplied state before the substitution: a (● authorization requested) or b (◆ decision supplied — a placeholder whose content is never shown); the substitution supplies the other one', ['a', 'b']),
  beforeValue: str('Value on the record plate before the substitution (as supplied)', 80),
  afterValue: str('Value on the record plate after the substitution (the alternative datum, as supplied)', 80),
  objectLabels: obj('Captions of the room objects in the legend', {
    record: str('Caption for the tray record on the board', 80),
  }, ['record']),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens, relative to the context at rest (never below 1.6)', 1.6, 4),
    placement: oneOf('Alignment of the lens inside the space it opens in', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 70),
  }, ['context', 'marker']),
};

const defaultParams = {...EN, detailGeometry: {zoom: 3, placement: 'auto'}};

/** What the prior-examination tray holds for a supplied state: the petition always; its ● pin (a) or the decision's
 * placeholder sheet with its ◆ pin in the other slot (b). */
const stateLook = s => (s === 'a' ? {pinA: 1, dec: 0} : {pinA: 0, dec: 1});

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedSa(ctx, EN, ES);
    const R = resolveSa(ctx, P);
    const before = P.beforeStatus === 'b' ? 'b' : 'a';
    const after = before === 'a' ? 'b' : 'a';
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const rowsFor = names => {
      const rows = [];
      if (showKey) rows.push({kind: 'heading', text: P.labels.route, name: 'route-name'});
      if (showAll) rows.push({kind: 'text', text: P.contextLabels.context, name: 'ctx-caption'});
      if (showKey) {
        rows.push({kind: 'legend', glyphKind: 'doc', text: P.decisions.title, name: 'lg-doc'});
        rows.push({kind: 'legend', glyphKind: 'dec', text: P.decisions.supplied, name: 'lg-dec'});
        if (names === 'letters') R.bodies.forEach(b => rows.push({kind: 'legend', glyphKind: 'station', letter: b.letter, text: b.label, name: `lg-body${b.index}`}));
        rows.push({kind: 'legend', glyphKind: 'step', text: P.labels.sequence, name: 'lg-step'});
        rows.push({kind: 'legend', glyphKind: 'exam', text: P.labels.exam, name: 'lg-exam'});
        rows.push({kind: 'legend', glyphKind: 'started', text: P.outcomes.a, name: 'lg-a'});
        rows.push({kind: 'legend', glyphKind: 'pending', text: P.outcomes.b, name: 'lg-b'});
      }
      if (showAll) rows.push({kind: 'legend', glyphKind: 'sign', text: P.objectLabels.record, name: 'lg-record'});
      if (showKey) rows.push({kind: 'legend', glyphKind: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
      if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
      return rows;
    };
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    const tightSide = 0.375 * shortD;
    // (coordinator: the lens magnifies the text >= 1.5x on every host — robustness target 1.6x; the search aims above)
    const ZT = 1.65;
    const gap = 16;
    const zoomMax = P.detailGeometry.zoom;
    // ---- the record's fits (template units) at a plate text multiple rs
    // (fix-review-03, cold create: while the layout is searched, the record is wrapped exactly only once per plate size
    // and 10 % band of text sizes, and scaled to the size asked for — text widths scale with the size; the chosen
    // composition is then composed again with the exact record)
    let approx = true;
    const recMemo = new Map();
    const scaleFit = (f, q) => (f ? {...f, width: f.width * q, height: f.height * q, size: f.size * q} : f);
    const recordFor = (Ft, rs) => {
      if (!approx || !showKey) return recordFor0(Ft, rs);
      const Fr = Math.exp(Math.round(Math.log(Ft) / 0.5) * 0.5);
      const key = `${Fr}|${rs}|${maxRecLines}`;
      if (!recMemo.has(key)) recMemo.set(key, recordFor0(Fr, rs));
      const R0 = recMemo.get(key), q = Ft / Fr;
      const fits = {before: scaleFit(R0.fits.before, q), after: scaleFit(R0.fits.after, q)};
      const dockFits = {was: scaleFit(R0.dockFits.was, q), rec: scaleFit(R0.dockFits.rec, q)};
      return {fits, dockFits, layout: recordLayout(fits, dockFits, Math.max(16, Ft * rs * 0.46)), rs};
    };
    const recordFor0 = (Ft, rs) => {
      if (!showKey) return {fits: null, dockFits: null, layout: recordLayout(null, null, Math.max(26, 22)), rs};
      const pick = text => {
        let best = null;
        // (fix-review-03, cold create: the words alone, without spaces, are a lower bound of the width the lines take — a
        // width at which they cannot fit in five lines is certainly truncated, and one at which they cannot fit in the
        // allowed lines can only be the fallback, so neither is wrapped)
        const sz = Ft * rs;
        const words = text.split(/[\s\u00a0]+/).filter(Boolean).reduce((a, w) => a + measure(w, sz, 600, 'sans'), 0) * 0.98;
        // (a compact block — the narrowest wrap with no one-word line, at most four lines —: the plate is near square, so
        // its enlarged copy fills the lens with text)
        for (const q of [5, 6, 7, 8, 9, 10, 11, 12, 12.75, 13.5, 14.25, 15, 16.5, 19]) {
          if (words > 5 * sz * q || (best && words > maxRecLines * sz * q)) continue;
          const ft = fitSa(text, {maxWidth: Ft * rs * q, size: Ft * rs, minSize: Ft * rs, maxLines: 5, weight: 600, widow: false});
          if (ft.truncated) continue;
          if (!best) best = ft;
          if (!hasLoneWord(ft) && ft.lines.length <= maxRecLines) return ft;
        }
        return best || fitSa(text, {maxWidth: Ft * rs * 20, size: Ft * rs, minSize: Ft * rs, maxLines: 6, weight: 600});
      };
      const fits = {before: pick(P.beforeValue), after: pick(P.afterValue)};
      const was = fitSa(ctx.t.was, {maxWidth: Ft * 8, size: Ft, minSize: Ft, maxLines: 1, weight: 500});
      const gs = Math.max(16, Ft * rs * 0.46);
      // (the dock's record wraps to the plate's width: the dock never widens the board)
      const plateTextW = Math.max(fits.before.width, fits.after.width);
      const room0 = 12 + Math.max(gs * 2, gs * 2.2) + 12 + plateTextW * 1.02 + 12;
      let rec = null;
      for (const q of [1, 0.9, 0.8, 0.7, 0.6, 1.2, 1.5]) { const ft = fitSa(P.beforeValue, {maxWidth: Math.max(Ft * 6, (room0 - was.width - 34) * q), size: Ft, minSize: Ft, maxLines: 4, weight: 600}); if (ft.truncated) continue; if (!rec) rec = ft; if (!hasLoneWord(ft)) { rec = ft; break; } }
      return {fits, dockFits: {was, rec}, layout: recordLayout(fits, {was, rec}, gs), rs};
    };
    // ---- the lens for a composed room: where it opens, how far the context steps back, the crop and the zoom
    const lensPlan = (C, roomBox, forceWide = null) => {
      const G = C.G, k = C.k;
      const B = G.board;
      const mg = 6;
      const needT = {x: B.x - mg, y: B.y - mg, w: B.w + 2 * mg, h: B.h + 2 * mg};
      const needD = {w: needT.w * k, h: needT.h * k};
      const plan = C.planRect;
      const wide = forceWide !== null ? forceWide : roomBox.w < D.w - 1 ? true : roomBox.h < D.h - 1 ? false : D.w >= D.h;
      const regionFor = sc => (wide
        ? {x: plan.x + plan.w * sc + gap, y: 0, w: D.w - (plan.x + plan.w * sc + gap), h: D.h}
        : {x: 0, y: plan.y + plan.h * sc + gap, w: D.w, h: D.h - (plan.y + plan.h * sc + gap)});
      // (stacked on a tall frame the context steps back towards the top-left corner and the lens opens below on the right:
      // together they span the frame's width)
      const anchor = wide ? {x: plan.x, y: plan.y + plan.h / 2} : {x: plan.x, y: plan.y};
      const problems = [];
      // (visible context: >= 0.46 of the frame width beside the lens; stacked, of either frame dimension)
      const shareOf = sc => (wide ? (plan.w * sc * f.scale) / ctx.view.width : Math.max((plan.h * sc * f.scale) / ctx.view.height, (plan.w * sc * f.scale) / ctx.view.width));
      let sc = 1, region = regionFor(1), ok = false;
      // (the robustness target 1.65x first; then, coordinator decision 2026-10-04 LAW-0300, any zoom with margin over the
      // 1.5x floor — 1.56x — rather than no lens)
      for (const zt of [ZT, 1.56]) {
        for (let q = 1; q >= 0.3 - 1e-9; q -= 0.02) {
          if (shareOf(q) < 0.455) break;
          const rg = regionFor(q);
          sc = q; region = rg;
          if (Math.min(zoomMax, rg.w / needD.w, rg.h / needD.h) >= zt && Math.min(rg.w, rg.h) >= tightSide) { ok = true; break; }
        }
        if (ok) break;
      }
      if (!ok) problems.push('lens-space');
      let Z = k * Math.min(zoomMax, region.w / needD.w, region.h / needD.h);
      const zm0 = Z / k;
      // crop (template): the board with its margin; grown round it (on the floor around the board) only as far as the
      // window needs to keep its smaller side >= tightSide
      const crop = {...needT};
      const minT = tightSide / Z;
      if (crop.w < minT) { const dx = (minT - crop.w) / 2; crop.x -= dx; crop.w = minT; }
      if (crop.h < minT) { const dy = (minT - crop.h) / 2; crop.y -= dy; crop.h = minT; }
      // (inside the room)
      crop.x = clamp(crop.x, -G.t, G.W + G.t - crop.w);
      crop.y = clamp(crop.y, -G.t, G.H + G.t - crop.h);
      Z = Math.min(Z, region.w / crop.w, region.h / crop.h);
      const zm = Z / k;
      const dest = {w: crop.w * Z, h: crop.h * Z};
      const pl = P.detailGeometry.placement;
      const ax = pl === 'left' ? 0 : pl === 'right' ? 1 : 0.5;
      dest.x = region.x + (region.w - dest.w) * (wide || pl !== 'auto' ? ax : 1);
      dest.y = wide ? clamp(plan.y + plan.h / 2 - dest.h / 2, region.y, region.y + region.h - dest.h) : region.y + (region.h - dest.h) * (pl === 'bottom' ? 1 : 0);
      if (Math.min(dest.w, dest.h) < 0.36 * shortD - 0.5) problems.push('lens-small');
      if (zm < 1.56) problems.push('lens-zoom');
      void zm0;
      return {needT, wide, anchor, s: sc, region, zm, Z, dest, crop, problems};
    };
    // (the plate's value wraps to at most this many lines: four, or six for a taller block when the lens opens beside a
    // 1:1 context — a near-square plate fills the lens window with text instead of floor)
    let maxRecLines = 4, tryFlip = false;
    const rsMax = Infinity;
    let rsList = REFS_SIZES.filter(v => v >= 1.4 && v <= rsMax);
    const memo = new Map();
    // (text coverage of the lens: >= 0.31 estimated; at 1:1 only, when no composition reaches it, the documented 1:1
    // limit — coordinator decision "LENS TEXT COVERAGE 1:1 LIMIT", 2026-10-05 — of >= 0.21)
    let lensTextMin = 0.31;
    // (first the board kept within the row of bodies; only when nothing composes that way may it be wider)
    let boardCheck = true;
    const compose1 = (box, F, scale, rs, names) => {
      let rec = null;
      const C = composeSa(ctx, P, R, box, F, {scale, text: showKey, names, numbers: showKey, courier: false, untangle: {clearPx: ctx.view.shape === 'square' ? (R.n >= 4 ? 17.5 : 16) : 18}, docK: R.n >= 4 && ctx.view.shape === 'square' ? 0.95 : R.n <= 2 ? 1.9 : 1.35, gap: R.n <= 2 ? 150 : 70, crop: 1.1, spread: 1.8, deepen: ctx.view.shape === 'portrait' ? 3.5 : 0,
        ...(approx && showKey ? {fitsBand: true} : {}), board: Ft => { rec = recordFor(Ft || F, rs); return {w: rec.layout.w, h: rec.layout.h}; }});
      C.rec = rec;
      C.refsSize = rs;
      // (the record's board never outgrows the row of bodies: the context stays a scene of bodies and route, not a plate)
      if (boardCheck && C.G.board && C.G.board.w > C.G.rowW * 1.02 + 40) C.problems.push('board-wide');
      let LP = lensPlan(C, box);
      if (LP.problems.length && box.w >= D.w - 1 && box.h >= D.h - 1) {
        const LP2 = lensPlan(C, box, !LP.wide);
        if (LP2.problems.length < LP.problems.length) LP = LP2;
      }
      // (the 1:1 fallback pass: when the plate's value would cover too little of a window opening beside the context, the
      // window under it — the board's own proportions, so no floor is added round it — when that composes)
      const textOf = LQ => (showKey && rec && rec.fits ? Math.min(rec.fits.before.width * rec.fits.before.height, rec.fits.after.width * rec.fits.after.height) / (LQ.crop.w * LQ.crop.h) : 1);
      if (tryFlip && !LP.problems.length && textOf(LP) < lensTextMin) {
        const LP2 = lensPlan(C, box, !LP.wide);
        if (!LP2.problems.length && textOf(LP2) > textOf(LP)) LP = LP2;
      }
      C.problems.push(...LP.problems);
      // (labels shown: the plate's value covers >= 0.31 of the lens window — estimated on the template boxes, the same
      // ratio as rendered — so the enlarged copy is mostly text even while the dock waits empty)
      if (showKey && rec && rec.fits) {
        const fb = rec.fits.before, fa = rec.fits.after;
        const tA = Math.min(fb.width * fb.height, fa.width * fa.height);
        C.lensText = tA / (LP.crop.w * LP.crop.h);
        if (C.lensText < lensTextMin) C.problems.push('lens-text');
      }
      C.lens = LP;
      return C;
    };
    // (fix-review-03, cold create: a box no larger than one that already composed without problems in the same pass
    // (same names, record lines, plate sizes and limits), at a text size no larger, can only give a smaller room and
    // smaller text — it could never score better, so it is not composed. It stands in as composable, so the size search
    // still climbs to the larger text sizes, but it scores far below every real composition)
    const composed = [];
    const composeFor = names => (box, F, scale) => {
      const state = [names, maxRecLines, tryFlip, boardCheck, lensTextMin, (showKey ? rsList : [1]).join()].join('|');
      const key = [box.x, box.y, box.w, box.h, F, scale, names, maxRecLines, tryFlip, (showKey ? rsList : [1]).join()].map(v => (typeof v === 'number' ? v.toFixed(4) : v)).join('|');
      if (memo.has(key)) return memo.get(key);
      const dom = composed.find(q => !q.tiny && q.state === state && q.scale === scale && q.box.w >= box.w - 0.01 && q.box.h >= box.h - 0.01 && q.F >= F - 1e-6);
      if (dom) { const Cd = {...dom.C, problems: [], dominated: true}; memo.set(key, Cd); return Cd; }
      // (and a box no larger than one where every plate size was already too small for its room ('room-tiny'), at a text
      // size no smaller, is too small as well)
      const tiny = composed.find(q => q.tiny && q.state === state && q.scale === scale && q.box.w >= box.w - 0.01 && q.box.h >= box.h - 0.01 && q.F <= F + 1e-6);
      if (tiny) { const Ct = {...tiny.C, problems: [...tiny.C.problems]}; memo.set(key, Ct); return Ct; }
      let allTiny = true;
      let C = null;
      for (const rs of showKey ? rsList : [1]) {
        C = compose1(box, F, scale, rs, names);
        if (!C.problems.includes('room-tiny')) allTiny = false;
        if (!C.problems.length) break;
      }
      memo.set(key, C);
      if (!C.problems.length || allTiny) composed.push({state, scale, box, F, C, tiny: allTiny});
      return C;
    };
    const opts = names => ({sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4], sidePanels: ctx.view.shape === 'square' ? [[0.5, 2], [0.56, 2]] : [[0.44, 2]], scales: [1], scoreOf: C => (C.dominated ? -1e6 : 0), compose: composeFor(names)});
    const good = b => !b.problems.length && b.F * px >= 19.5 - 1e-6;
    // (four bodies: their names go to the panel, keyed to letters, from the start)
    let names = R.n >= 4 && showKey ? 'letters' : 'room';
    let best = searchSa(ctx, rowsFor(names), opts(names));
    if (showKey && names === 'room' && !good(best)) { const b2 = searchSa(ctx, rowsFor('letters'), opts('letters')); if (good(b2) || b2.problems.length < best.problems.length || (!b2.problems.length && b2.F > best.F)) { best = b2; names = 'letters'; } }
    if (best.problems.length && showKey) { rsList = REFS_SIZES.filter(v => v < 1.4); memo.clear(); const b3 = searchSa(ctx, rowsFor(names), opts(names)); if (b3.problems.length < best.problems.length) best = b3; }
    if (best.problems.length && showKey) {
      boardCheck = false; rsList = REFS_SIZES.filter(v => v >= 1.4); memo.clear();
      const b5 = searchSa(ctx, rowsFor(names), opts(names));
      if (b5.problems.length < best.problems.length) best = b5;
    }
    // (1:1: a taller block on the plate — up to six lines — so the board is near square and the lens window, beside or
    // under the context, is filled by the plate's value rather than by floor; the 0.31 text estimate still applies)
    if (best.problems.length && showKey && ctx.view.shape === 'square') {
      maxRecLines = 6; tryFlip = true; boardCheck = true; rsList = REFS_SIZES.filter(v => v >= 1.2); memo.clear();
      const b6 = searchSa(ctx, rowsFor(names), opts(names));
      if (b6.problems.length < best.problems.length) best = b6;
      else { maxRecLines = 4; tryFlip = false; }
    }
    let textLimit = false;
    if (best.problems.length && showKey && ctx.view.shape === 'square') {
      lensTextMin = 0.21; rsList = REFS_SIZES.filter(v => v >= 1.2); memo.clear();
      const b4 = searchSa(ctx, rowsFor(names), opts(names));
      if (b4.problems.length < best.problems.length || (!b4.problems.length && best.problems.length)) { best = b4; textLimit = true; }
    }
    approx = false;
    if (showKey) best = {...best, C: compose1(best.roomBox, best.F, best.scale, best.C.refsSize, names)};
    const {F, C, lay} = best;
    const G = C.G, k = C.k;
    const {dest, crop, Z, zm, s, anchor, wide} = C.lens;
    const problems = [...best.problems];
    const record = {fits: C.rec.fits, dockFits: C.rec.dockFits, layout: C.rec.layout};
    const room = saRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, numbers: showKey, dec: true, ghost: false, record});
    const inCrop = b => b.x >= crop.x + 1 && b.y >= crop.y + 1 && b.x + b.w <= crop.x + crop.w - 1 && b.y + b.h <= crop.y + crop.h - 1;
    const lz = saRoom(ctx, G, {prefix: 'lz', R, Ft: G.Ft, numbers: showKey, dec: true, ghost: false, record, keep: inCrop});
    const cropD = C.bD(crop);
    // (the source frame marks the detail the lens enlarges: the board with its record, never the floor around it)
    // (its margin clears the step discs above the board: the frame never runs over a step's number)
    const bd0 = G.board;
    const discGap = Math.min(Infinity, ...G.discs.map(d => Math.hypot(Math.max(bd0.x - d.x, 0, d.x - (bd0.x + bd0.w)), Math.max(bd0.y - d.y, 0, d.y - (bd0.y + bd0.h))) - G.DR - 8 / k));
    const fm = Math.max(6, Math.min(Math.max(16, 14 / k), discGap));
    const srcD = C.bD({x: G.board.x - fm, y: G.board.y - fm, w: G.board.w + 2 * fm, h: G.board.h + 2 * fm});
    // the changed-datum marker (Δ): on the free floor beside the board — fully inside the room, clear of the board, the
    // route, its discs and every text; the side away from the route's discs first
    const markerR = 16;
    const rT = markerR / k, gT = 14 / k;
    const B = G.board;
    const cands = [{x: B.x - gT - rT, y: B.y + B.h / 2}, {x: B.x + B.w + gT + rT, y: B.y + B.h / 2}, {x: B.x - gT - rT, y: B.y + rT + 6}, {x: B.x + B.w + gT + rT, y: B.y + rT + 6}];
    const clearOf = q => q.x - rT > 14 && q.x + rT < G.W - 14 && q.y + rT < G.H - 10 && G.discs.every(d => Math.hypot(d.x - q.x, d.y - q.y) > G.DR + rT + 12) && G.arcs.every(a => a.pts.every(pp => Math.hypot(pp.x - q.x, pp.y - q.y) > rT + 14));
    let markT = cands.find(clearOf);
    if (!markT) { markT = cands[0]; problems.push('marker-space'); }
    const markerD = C.toD(markT);
    const lensBox = {x: dest.x - 4, y: dest.y - 4, w: dest.w + 14, h: dest.h + 18};
    const roomD = C.planRect;
    const clearAt = u => {
      const sc = lerp(1, s, ease.inOutCubic(seg(u, ...W.back)));
      return !overlaps({x: anchor.x + (roomD.x - anchor.x) * sc, y: anchor.y + (roomD.y - anchor.y) * sc, w: roomD.w * sc, h: roomD.h * sc}, lensBox, 0);
    };
    let uClear = W.open[0];
    while (uClear <= W.back[1] && !clearAt(uClear)) uClear += 0.0002;
    if (!clearAt(uClear)) problems.push('lens-over-context');
    const shiftW = Math.max(0, uClear - W.open[0]);
    const openW = [W.open[0] + shiftW, Math.max(W.open[1], W.open[0] + shiftW + 0.02)];
    const ctxOutW = [W.ctxOut[0] + 0.004 + shiftW, W.ctxOut[1] + 0.004 + shiftW];
    const panelOutW = [Math.max(W.panelOut[0], openW[0] - 0.018), openW[0]];
    const first = G.stations[R.steps[0]].doc, last = G.stations[R.exam].doc;
    return {textLimit, P, R, F, px, C, G, k, room, lz, lay, dest, crop, cropD, srcD, Z, zm, s, anchor, wide, markerD, markerR, problems, showKey, shortD, openW, ctxOutW, panelOutW, before, after, first, last, names, record};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const panel = L.lay ? L.lay.rows.map(m => saRowNode(ctx, m, {name: m.name})) : [];
    const ctxGroup = g({name: 'ctx', transform: 'translate(0 0) scale(1)'},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node),
      h('rect', {name: 'src-frame', x: r(L.srcD.x), y: r(L.srcD.y), width: r(L.srcD.w), height: r(L.srcD.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      changedMarker(ctx, {name: 'cx-marker', x: L.markerD.x, y: L.markerD.y, radius: L.markerR, opacity: 0}),
    );
    const d = L.dest;
    return g(null,
      ctxGroup,
      g({name: 'panel'}, panel),
      g({name: 'lens', opacity: 0, 'data-occludes': 1, transform: 'translate(0 0) scale(1)'},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18}))),
        h('rect', {name: 'lens-shadow', x: r(d.x + 6), y: r(d.y + 10), width: r(d.w), height: r(d.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: '#f5efe3'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(d.x - L.crop.x * L.Z, d.y - L.crop.y * L.Z)} scale(${r(L.Z, 5)})`}, L.lz.node)),
        h('rect', {name: 'lens-rim', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const {G, C} = L;
    const nodes = {};
    const open = ease.inOutCubic(seg(u, ...L.openW)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const back = ease.inOutCubic(seg(u, ...W.back)) * (1 - ease.inOutCubic(seg(u, ...W.forward)));
    const sc = lerp(1, L.s, back);
    const a = L.anchor;
    nodes.ctx = {transform: `${T(a.x - a.x * sc, a.y - a.y * sc)} scale(${r(sc, 4)})`, opacity: r(1 - 0.42 * Math.min(1, open * 1.4), 3)};
    const move = ease.inOutCubic(seg(u, ...W.move)), chip = seg(u, ...W.chip), was = seg(u, ...W.was);
    const newIn = seg(u, ...W.newIn);
    // context texts stay while they are still at their floor and leave just before
    const floor = L.F * L.px >= 19.5 ? 19.5 : 16;
    const textK = sc >= 0.9999 ? 1 : clamp((L.F * L.px * sc - Math.min(floor, L.F * L.px - 0.01)) / 0.6);
    // one copy of the datum at a time: the context copy (value and glyph) leaves as the lens copy arrives, comes back after
    const ctxT = u < 0.5 ? Math.min(1 - seg(u, ...L.ctxOutW), textK) : seg(u, ...W.ctxIn);
    const lensT = clamp((open - 0.12) / 0.3);
    // the substitution, a dip hand-over: the old value dims to 0.3; at one instant it leaves the plate and enters the
    // dock as the record captioned "was", while the plate takes the new value — both come in at 0.3 and brighten
    const sw = u >= W.newIn[0];
    const inK = sw ? 0.3 + 0.7 * newIn : 0;
    const marks = seg(u, ...W.marks);
    const showKey = L.showKey;
    const markAt = (copy) => {
      // (labels shown: the glyph switches with the value; labels hidden: it changes over the marks window, a cross-fade
      // with no text — out first, then in)
      const q = showKey ? (sw ? 1 : 0) : marks;
      const out = showKey ? 1 - (sw ? 1 : 0) : 1 - clamp(q * 2);
      const inn = showKey ? (sw ? inK : 0) : clamp(q * 2 - 1);
      return {[L.before]: r(out * copy, 3), [L.after]: r(inn * copy, 3)};
    };
    const recFor = (copy, dockTray) => ({
      mark: markAt(copy),
      before: sw ? 0 : copy * (1 - 0.7 * seg(u, W.was[0], W.newIn[0])),
      after: copy * inK,
      dock: dockTray * copy,
      was: copy * inK,
      dockV: (showKey ? inK : clamp(marks * 2 - 1)) * copy,
      dockMark: {[L.before]: (showKey ? 0 : clamp(marks * 2 - 1)) * copy, [L.after]: 0},
    });
    // the dependent state, in the context, once the new value is in: the decision's sheet in the tray's other slot and the
    // pins follow it (out first, then in)
    const cue = ease.inOutSine(seg(u, ...W.cue));
    const o1 = 1 - clamp(cue * 2), i1 = clamp(cue * 2 - 1);
    const A0 = stateLook(L.before), A1 = stateLook(L.after);
    const mix = key => (A0[key] && !A1[key] ? o1 : !A0[key] && A1[key] ? i1 : A0[key]);
    const stFor = (textk, recState) => ({
      textK: textk,
      route: {solid: 1},
      doc: {x: L.last.x, y: L.last.y, s: 1, op: 1},
      pin: {a: mix('pinA')},
      dec: {op: mix('dec'), s: lerp(1.12, 1, mix('dec')), pin: {b: mix('dec')}},
      covers: [],
      rec: recState,
    });
    const rf = L.room.frame(stFor(textK, recFor(ctxT, chip)));
    Object.assign(nodes, rf.nodes);
    // (in the lens the dock's tray is there from the opening, empty until the substitution)
    Object.assign(nodes, L.lz.frame(stFor(lensT, recFor(lensT, 1))).nodes);
    const fr = seg(u, ...W.frame) * (1 - seg(u, ...W.frameOut));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const ls = 0.6 + 0.4 * open;
    const lc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
    nodes.lens = {opacity: r(Math.min(1, open * 2.5), 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    const panelOp = u < 0.5 ? 1 - seg(u, ...L.panelOutW) : seg(u, ...W.panelIn);
    nodes.panel = {opacity: r(panelOp, 3)};
    const mk = seg(u, ...W.marker);
    nodes['cx-marker'] = {opacity: r(mk, 3)};
    if (L.lay && L.lay.rows.some(m => m.name === 'marker-row')) nodes['marker-row'] = {opacity: r(mk, 3)};
    const datumState = u < W.move[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {
      nodes,
      semantic: {
        beat,
        datum: datumState,
        stateBefore: L.before,
        stateAfter: L.after,
        trayState: cue >= 1 ? 'after' : cue > 0 ? 'changing' : 'before',
        decShown: r(mix('dec'), 3),
        petitionPin: r(mix('pinA'), 3),
        exam: L.R.exam,
        lensOpen: r(open, 3),
        lensStartU: r(L.openW[0], 4),
        contextScale: r(sc, 3),
        ctxCopy: r(ctxT, 3),
        lensCopy: r(lensT, 3),
        bothCopies: ctxT >= 0.15 && lensT >= 0.15 && open > 0.01,
        strike: 0,
        docked: r(move, 3),
        newShown: r(newIn, 3),
        was: r(was, 3),
        focusTarget: L.P.focusTarget,
        markerText: L.P.contextLabels.marker,
        markerShown: r(mk, 3),
        panel: r(panelOp, 3),
        zoomVsRest: r(L.zm, 3),
        lensMinSide: r(Math.min(L.dest.w, L.dest.h) / L.shortD, 3),
        refsSize: L.C.refsSize,
        lensText: L.C.lensText ? r(L.C.lensText, 3) : null,
        textLimit: L.textLimit,
        roomSize: {W: r(G.W), H: r(G.H), needW: r(G.needW), needH: r(G.needH), k: r(C.k, 4)},
        names: L.names,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        stations: G.stations.map(s0 => ({x: r(C.toD(s0).x), y: r(C.toD(s0).y), w: r(s0.w * C.k), h: r(s0.h * C.k)})),
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
    slug: 'review-03-inspect',
    title: 'Authorization request — inspecting the prior-examination tray\'s record and substituting its supplied state',
    titleEs: 'Solicitud de autorización — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Solicitud de autorización',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The generic room after the placeholder petition passed, along the path configured between abstract stations (the same size, on one row, each with a neutral two-slot tray), into the prior-examination tray. On the board lies the tray\'s record plate: the supplied state, its glyph (● authorization requested / ◆ decision supplied, equal weight) over a small tray icon. A lens (a window with a rim, distinct from the panel) opens on the plate — a real enlarged copy of the same room coordinates — and one supplied datum is substituted: the state. The old value is kept, unchanged, in a dock as "was"; the glyph and the icon change (labels hidden: only they show it); only the dependent state follows in the context, after the new value is legible: the decision\'s placeholder sheet (content never shown) is laid with its ◆ pin in the tray\'s other slot and the petition\'s ● pin leaves. The context returns with a neutral changed-datum marker. Illustrative; nothing is evaluated; no criterion, threshold, time limit, rank or outcome; jurisdiction unspecified.',
    tags: ['review', 'authorization request', 'inspect', 'lens', 'tray record', 'substitution', 'changed datum', 'prior-examination tray', 'placeholder decision', 'as supplied', 'abstract stations', 'equal size'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
