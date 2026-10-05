/**
 * LAW-0156 — Interpretaciones concurrentes · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] build: the desk in the state produced by the action — the
 *              passage slip on the lit table between two reading trays; in
 *              each tray the traced overlay with its reading's highlight and
 *              the attributed reading card; the source book, the editable
 *              hierarchy board, the context caption and the key. A hand
 *              reaches the magnifier.
 *  [0.20–0.45] isolate: the hand carries the magnifier over the overlay of
 *              the inspected reading, onto the words it highlights. From the
 *              magnifier's glass a detail window opens: a REAL enlarged copy
 *              of that overlay region (same coordinates, cone lines back to
 *              the source); the rest of the desk dims but stays in place.
 *  [0.45–0.75] substitute: one datum changes — the words that reading
 *              highlights (beforeValue → afterValue). The old band fades to a
 *              dashed outline that stays (traceable), the new band is drawn
 *              over the new words; "Before" (struck) and "After" chips name
 *              both values. Only the band's geometry changes; the passage,
 *              the other reading and every card stay as they were.
 *  [0.72–0.905] return (spread, still from 0.905): the chips go, the window
 *              closes back into the magnifier (0.73–0.79), the hand lays the
 *              magnifier down (0.755–0.815) and withdraws off the desk
 *              (0.815–0.885); only then the changed-datum marker (Δ, on the
 *              overlay's top or bottom edge at the new band, never on a pull
 *              tab) and the note appear. The note ALWAYS keeps both values
 *              ("old" → "new"), so the dashed outline stays explained in every
 *              ratio and preset. Seeking back restores the old band exactly.
 * Layouts: 16:9 = tray | book, table, board | tray (window over the centre);
 * 9:16 = book + board, tray A, table, tray B; 1:1 = book | table | board over
 * the two trays.
 * @module animations/sources/LAW-0156
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r, ease, lerp} from '../../core/time.js';
import {mix, dist, ik2, roundRectPath} from '../../core/geometry.js';
import {inspectFields, str} from '../../schemas/fields.js';
import {lens as lensWindow} from '../../frameworks/lens.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  icFields, IC_DEFAULTS, IC_STRINGS, kitT, icColors, laneOf, sourceOf, pxPerUnit,
  passageLayout, phraseSpan, spanRects, passageSlip, overlayArt, overlayFrame, lightTable, lightTableFrame,
  trayArt, trayLipH, readingCardArt, openBook, hierarchyBoard, magnifier, notePlate, measureNote, fitWords, textOrBars,
  overlaps, inside, segmentHits, TRACE_MARK,
} from './kits/interpretaciones-concurrentes.js';

const ID = 'LAW-0156';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  enter: [0.1, 0.19], carry: [0.2, 0.3], open: [0.3, 0.44],
  beforeChip: [0.45, 0.5], fade: [0.5, 0.56], sweep: [0.56, 0.66], afterChip: [0.63, 0.69],
  // return: spread over 0.72–0.905; the marker and the note fade in only once the arm has left them
  chipsOut: [0.72, 0.75], close: [0.73, 0.79], carryBack: [0.755, 0.815], out: [0.815, 0.885],
  marker: [0.86, 0.89], note: [0.875, 0.905],
};
const TARGETS = ['readingB-focus', 'readingA-focus'];

const sceneSchema = {...icFields, ...inspectFields(TARGETS)};
sceneSchema.beforeValue.description = 'Words the inspected reading highlights BEFORE the substitution (its band is drawn from these words; if they do not occur in the passage, the whole passage is bracketed)';
sceneSchema.afterValue.description = 'Alternative words highlighted AFTER the substitution (the one datum that changes)';

const defaultParams = {
  ...IC_DEFAULTS,
  focusTarget: 'readingB-focus',
  beforeValue: 'the register and the minutes kept by the secretary',
  afterValue: 'the register and the minutes',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Context: the two readings after the split', marker: 'Changed datum'},
};

const STRINGS = {en: {...IC_STRINGS.en}, es: {...IC_STRINGS.es}};

/** Greedy packing of note items into free zones (see LAW-0153). */
function packZones(zones, items, gap) {
  const cur = zones.map(z => ({...z, cy: z.y}));
  return items.map(it => {
    const order = it.zones ? it.zones.map(i => cur[i]).filter(Boolean) : cur;
    for (const z of order) {
      const m = it.measure(z.w);
      if (m.w <= z.w + 0.5 && z.cy + m.h <= z.y + z.h + 0.5 && !m.truncated) {
        const x = z.align === 'right' ? z.x + z.w - m.w : z.align === 'center' ? z.x + (z.w - m.w) / 2 : z.x;
        const out = {x, y: z.cy, w: m.w, h: m.h, maxW: z.w};
        if (it.accept && !it.accept(out)) continue;
        z.cy += m.h + gap;
        return out;
      }
    }
    return null;
  });
}

function magBox(c, R, len, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  const ex = c.x + Math.cos(a) * len, ey = c.y + Math.sin(a) * len;
  const x0 = Math.min(c.x - R * 1.2, ex - R * 0.4), x1 = Math.max(c.x + R * 1.2, ex + R * 0.4);
  const y0 = Math.min(c.y - R * 1.2, ey - R * 0.4), y1 = Math.max(c.y + R * 1.2, ey + R * 0.4);
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

const bandPath = (rects, round) => rects.map(q => roundRectPath(q.x, q.y, q.w, q.h, round ? q.h / 2 : 3)).join('');

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

function tryLayout(ctx, F) {
  const p = ctx.params;
  const t = kitT(ctx);
  const C = icColors(ctx);
  const shape = ctx.view.shape;
  const Wd = ctx.design.w, Hd = ctx.design.h;
  const m = F * 0.8, gp = F * 0.8;
  const pad = F * 0.8, edge = Math.max(10, F * 0.45), tabW = Math.max(F * 1.5, 30), rail = F * 1.5, gi = F * 0.5, rim = Math.max(14, F * 0.6);
  let fits = true;
  const need = c => { if (!c) fits = false; };
  const trayFixed = pad * 2 + tabW + gi * 3 + rim * 2;
  const tableFixed = edge + pad * 2 + F * 1.2 + rail * 2;
  const k = p.focusTarget === 'readingA-focus' ? 0 : 1;
  let PLw, trayW, beside = false;
  if (shape === 'landscape') PLw = Math.min(F * 19, (Wd - m * 2 - gp * 2 - trayFixed * 2 - tableFixed) / 3);
  else if (shape === 'portrait') {
    trayW = Wd - m * 2;
    PLw = Math.min(F * 16, Wd - m * 2 - tableFixed);
    beside = true;
  } else {
    trayW = (Wd - m * 2 - gp) / 2;
    PLw = Math.min(F * 19, trayW - trayFixed);
  }
  const PL = passageLayout(ctx, p.passages.text, {w: PLw, size: F});
  need(PL.fitsWords, 'PL');
  const spanOther = phraseSpan(PL, p.interpretations[1 - k].focus);
  const spanBefore = phraseSpan(PL, p.beforeValue) ?? phraseSpan(PL, p.interpretations[k].focus);
  const spanAfter = phraseSpan(PL, p.afterValue);
  const slip = passageSlip(ctx, {prefix: 'slip', PL, ref: p.passages.ref, F, color: C.book, pad});
  const toFilmPre = q => ({...q, x: q.x + pad, y: q.y + F * 0.6});
  const preBands = {before: spanRects(PL, spanBefore, F * 0.18).map(toFilmPre), after: spanRects(PL, spanAfter, F * 0.18).map(toFilmPre)};
  const ov = [0, 1].map(j => overlayArt(ctx, {prefix: `ov${j}`, PL, F, lane: laneOf(ctx, j), letter: j ? 'B' : 'A', side: j ? 'right' : 'left', span: j === k ? null : spanOther, bandless: j === k, pad,
    underText: j === k ? bandsNode(ctx, {k, bandBefore: preBands.before, bandAfter: preBands.after}, 'cb') : null}));
  if (!trayW) trayW = ov[0].w + tabW + gi * 3 + rim * 2;
  const tableW = slip.w + F * 1.2 + rail * 2;
  const tableH = slip.h + 6 + F * 1.2 + rail * 2;
  const cardW = beside ? trayW - rim * 2 - ov[0].w - tabW - gi * 4 : trayW - rim * 2 - gi * 2;
  need(cardW >= F * 9, 'cardW');
  const mkCard = (j, minH) => readingCardArt(ctx, {w: cardW, F, lane: laneOf(ctx, j), letter: j ? 'B' : 'A', label: p.interpretations[j].label, text: p.interpretations[j].text, by: p.sources[sourceOf(p, j)].title, proposed: t.proposed, minH, inlineSub: true});
  const cardH = Math.max(mkCard(0).natural, mkCard(1).natural);
  const cards = [mkCard(0, cardH), mkCard(1, cardH)];
  const labels = p.interpretations.map(x => x.label);
  const lipH = trayLipH(ctx, {w: trayW, F, label: null, rim});
  const trayNeed = beside ? rim + gi + Math.max(ov[0].h, cardH) + gi + lipH : rim + gi + ov[0].h + gi + cardH + gi + lipH;
  const R = F * 1.45;
  const mag = magnifier(ctx, {R, angle: 40, handle: 1.4});
  const magLen = mag.reachEnd;
  let trayBox = [], tableBox, bookO, bookBox, boardO, boardBox, zones;
  if (shape === 'landscape') {
    trayBox = [{x: m, y: m, w: trayW, h: trayNeed}, {x: Wd - m - trayW, y: m, w: trayW, h: trayNeed}];
    const cx0 = m + trayW + gp, Cw = Wd - m * 2 - gp * 2 - trayW * 2;
    need(Cw >= tableW, 'Cw');
    bookO = openBook(ctx, {prefix: 'book', w: Math.min(Cw, Math.max(tableW, F * 14)), F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
    bookBox = {x: cx0 + (Cw - bookO.w) / 2, y: m, w: bookO.w, h: bookO.h};
    tableBox = {x: cx0 + (Cw - tableW) / 2, y: m + bookO.h + gp, w: tableW, h: tableH};
    boardO = hierarchyBoard(ctx, {prefix: 'board', w: Math.min(Cw, F * 16), F, p, t});
    boardBox = {x: cx0 + (Cw - boardO.w) / 2, y: tableBox.y + tableH + gp, w: boardO.w, h: boardO.h};
    need(boardBox.y + boardO.h <= Hd - m, 'centre height');
    const by = m + trayNeed + gp;
    need(by <= Hd - m, 'tray height');
    const bz = boardBox.y + boardO.h + gp;
    zones = [
      {x: trayBox[k].x, y: by, w: trayW, h: Math.max(0, Hd - m - by), align: 'center'},
      {x: trayBox[1 - k].x, y: by, w: trayW, h: Math.max(0, Hd - m - by), align: 'center'},
      {x: cx0, y: bz, w: Cw, h: Math.max(0, Hd - m - bz), align: 'center'},
    ];
  } else if (shape === 'portrait') {
    const colW = (Wd - m * 2 - gp) / 2;
    bookO = openBook(ctx, {prefix: 'book', w: colW, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
    boardO = hierarchyBoard(ctx, {prefix: 'board', w: colW, F, p, t});
    const r1 = Math.max(bookO.h, boardO.h);
    const used = m * 2 + r1 + trayNeed * 2 + tableH + gp * 4;
    need(used + F * 4 <= Hd, 'portrait height');
    const gx = gp + clamp((Hd - used - F * 8) / 5, 0, F * 1.2);
    bookBox = {x: m, y: m + (r1 - bookO.h) / 2, w: colW, h: bookO.h};
    boardBox = {x: m + colW + gp, y: m, w: colW, h: boardO.h};
    trayBox[0] = {x: m, y: m + r1 + gx, w: trayW, h: trayNeed};
    // the table leaves its free side under/over the inspected overlay (the change note goes there)
    tableBox = {x: k === 0 ? Wd - m - tableW : m, y: trayBox[0].y + trayNeed + gx, w: tableW, h: tableH};
    trayBox[1] = {x: m, y: tableBox.y + tableH + gx, w: trayW, h: trayNeed};
    const zy = trayBox[1].y + trayNeed + gx;
    zones = [
      {x: k === 0 ? m : m + tableW + gp, y: tableBox.y, w: Math.max(0, Wd - m * 2 - tableW - gp), h: tableH, align: 'center'},
      {x: m, y: zy, w: Wd - m * 2, h: Math.max(0, Hd - m - zy), align: 'center'},
    ];
  } else {
    const sideW = (Wd - m * 2 - gp * 2 - tableW) / 2;
    need(sideW >= F * 9, 'sideW');
    bookO = openBook(ctx, {prefix: 'book', w: sideW, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
    boardO = hierarchyBoard(ctx, {prefix: 'board', w: sideW, F, p, t, stack: true});
    const r1 = Math.max(bookO.h, boardO.h, tableH);
    tableBox = {x: m + sideW + gp, y: m, w: tableW, h: tableH};
    bookBox = {x: m, y: m, w: sideW, h: bookO.h};
    boardBox = {x: Wd - m - sideW, y: m, w: sideW, h: boardO.h};
    const ty = m + r1 + gp;
    trayBox = [{x: m, y: ty, w: trayW, h: trayNeed}, {x: Wd - m - trayW, y: ty, w: trayW, h: trayNeed}];
    need(ty + trayNeed <= Hd - m, 'square height');
    const below = y => Math.max(0, ty - gp - y);
    zones = [
      {x: tableBox.x, y: tableBox.y + tableH + gp, w: tableW, h: below(tableBox.y + tableH + gp), align: 'center'},
      {x: m, y: bookBox.y + bookO.h + gp, w: sideW, h: below(bookBox.y + bookO.h + gp), align: 'center'},
      {x: boardBox.x, y: boardBox.y + boardO.h + gp, w: sideW, h: below(boardBox.y + boardO.h + gp), align: 'center'},
    ];
    // below the trays: three columns (magnifier | caption + key | change note)
    const zy = ty + trayNeed + gp * 0.5, zh = Math.max(0, Hd - m - zy), zw = Wd - m * 2 - gp * 2;
    zones.push({x: m, y: zy, w: zw * 0.2, h: zh, align: 'center'});
    zones.push({x: m + zw * 0.2 + gp, y: zy, w: zw * 0.34, h: zh, align: 'center'});
    zones.push({x: m + zw * 0.54 + gp * 2, y: zy, w: zw * 0.46, h: zh, align: 'center'});
  }
  const table = lightTable(ctx, {prefix: 'lt', w: tableW, h: tableH, rail, F, label: null});
  const slipPos = {x: tableBox.x + (tableW - slip.w) / 2, y: tableBox.y + rail + F * 0.6};
  const trays = [0, 1].map(j => trayArt(ctx, {w: trayBox[j].w, h: trayBox[j].h, lane: laneOf(ctx, j), letter: j ? 'B' : 'A', label: null, F, rim}));
  const floorW = j => ({x: trayBox[j].x + trays[j].floor.x, y: trayBox[j].y + trays[j].floor.y, w: trays[j].floor.w, h: trays[j].floor.h});
  const rest = [0, 1].map(j => {
    const fl = floorW(j);
    const x = j ? fl.x + fl.w - gi - tabW + 4 - ov[j].w - gi * 0.5 : fl.x + gi + tabW - 4 + gi * 0.5;
    return {x, y: beside ? fl.y + Math.max(gi, (fl.h - ov[j].h) / 2) : fl.y + gi};
  });
  const cardPos = [0, 1].map(j => {
    const fl = floorW(j);
    if (beside) return {x: j ? fl.x + gi : fl.x + fl.w - gi - cardW, y: fl.y + gi};
    return {x: fl.x + gi, y: rest[j].y + ov[j].h + gi};
  });
  // the inspected bands (film coordinates of the target overlay)
  const toFilm = q => ({...q, x: q.x + ov[k].text.x, y: q.y + ov[k].text.y});
  const bandBefore = spanRects(PL, spanBefore, F * 0.18).map(toFilm);
  const bandAfter = spanRects(PL, spanAfter, F * 0.18).map(toFilm);
  const world = q => ({x: rest[k].x + q.x, y: rest[k].y + q.y, w: q.w, h: q.h});
  const allBands = [...bandBefore, ...bandAfter].map(world);
  const bx0 = Math.min(...allBands.map(q => q.x)), by0 = Math.min(...allBands.map(q => q.y));
  const bx1 = Math.max(...allBands.map(q => q.x + q.w)), by1 = Math.max(...allBands.map(q => q.y + q.h));
  const source = {x: bx0 - F * 0.6, y: by0 - F * 0.5, w: bx1 - bx0 + F * 1.2, h: by1 - by0 + F * 1.0};
  // detail window: enlarged copy placed over the centre of the desk (or as the author places it)
  const deskBox = {x: 0, y: 0, w: Wd, h: Hd};
  let zoom = p.detailGeometry.zoom;
  zoom = Math.min(zoom, (Wd - m * 2) / source.w, (Hd - m * 2) * 0.55 / source.h);
  const dw = source.w * zoom, dh = source.h * zoom;
  const place = p.detailGeometry.placement;
  const ctr = {
    // auto: 16:9 over the centre column; 9:16 over the table; 1:1 over the top row, clear of the trays
    auto: shape === 'landscape' ? {x: Wd / 2, y: Hd * 0.52} : shape === 'portrait' ? {x: Wd / 2, y: tableBox.y + tableH / 2}
      : {x: Wd / 2, y: Math.min(Hd * 0.42, source.y - F * 0.8 - dh / 2)},
    left: {x: m + dw / 2, y: Hd / 2}, right: {x: Wd - m - dw / 2, y: Hd / 2}, top: {x: Wd / 2, y: m + dh / 2 + F * 2}, bottom: {x: Wd / 2, y: Hd - m - dh / 2 - F * 2},
  }[place] || {x: Wd / 2, y: Hd / 2};
  // keep the window off its own source vertically when the frame allows it
  let cy = ctr.y;
  if (shape !== 'portrait') cy = source.y + source.h / 2 > Hd / 2 ? Math.min(cy, source.y - F * 0.8 - dh / 2) : Math.max(cy, source.y + source.h + F * 0.8 + dh / 2);
  const dest = {x: clamp(ctr.x - dw / 2, m, Wd - m - dw), y: clamp(cy - dh / 2, m + F * 2.4, Hd - m - dh - F * 2.4), w: dw, h: dh};
  // before / after chips above and below the window
  const chipW = Math.min(dw, Wd - m * 2);
  const beforeM = measureNote(ctx, `${t.before}: “${p.beforeValue}”`, {maxWidth: chipW, size: F, weight: 600, maxLines: 3});
  const afterM = measureNote(ctx, `${t.after}: “${p.afterValue}”`, {maxWidth: chipW, size: F, weight: 700, maxLines: 3});
  const beforeAt = {x: dest.x + (dw - beforeM.w) / 2, y: Math.max(m * 0.5, dest.y - beforeM.h - F * 0.4)};
  const afterAt = {x: dest.x + (dw - afterM.w) / 2, y: Math.min(Hd - m * 0.5 - afterM.h, dest.y + dh + F * 0.4)};
  need(!overlaps({...beforeAt, w: beforeM.w, h: beforeM.h}, dest, 0) && !overlaps({...afterAt, w: afterM.w, h: afterM.h}, dest, 0), 'chips');
  // notes: magnifier rest (near the inspected tray), context caption, key, change note
  const all = ctx.show('all'), key = ctx.show('key');
  const noteM = (text, sz, wt, ml, cap = F * 24) => w => {
    const q = measureNote(ctx, text, {maxWidth: Math.min(w, cap), size: sz, weight: wt, maxLines: ml});
    return {w: q.w, h: q.h, truncated: q.fit.truncated};
  };
  // the change note always names both values (old → new), so the dashed outline of the old band stays explained
  const changeText = `${p.contextLabels.marker}: “${p.beforeValue}” → “${p.afterValue}”`;
  const magM = magBox({x: 0, y: 0}, R, magLen, 40);
  const items = [];
  const pref = shape === 'landscape' ? {mag: [0, 1, 2], change: [0, 2, 1], ctx: [1, 2, 0], key: [1, 2, 0]}
    : shape === 'portrait' ? {mag: [0, 1], change: [1, 0], ctx: [1, 0], key: [1, 0]}
      : {mag: [3, 1, 2, 0], change: [5, 4, 0], ctx: [4, 0, 1, 2, 5], key: [4, 0, 1, 2, 5, 3]};
  // the Δ marker sits on the inspected overlay's TOP edge, right above the start of the new band
  // (clear of both pull tabs, which stand on the side edges, and of the traced words)
  const firstAfter = (bandAfter.length ? bandAfter : bandBefore).map(world)[0];
  const cardBoxes = [0, 1].map(j => ({x: cardPos[j].x, y: cardPos[j].y, w: cardW, h: cardH}));
  const Rm = F * 0.62 + 3;
  const tabW0 = j => ({x: rest[j].x + ov[j].tabBox.x, y: rest[j].y + ov[j].tabBox.y, w: ov[j].tabBox.w, h: ov[j].tabBox.h});
  const lastAfter = (bandAfter.length ? bandAfter : bandBefore).map(world).slice(-1)[0];
  const markerTop = {x: clamp(firstAfter.x + Rm * 0.8, rest[k].x + Rm + 4, rest[k].x + ov[k].w - Rm - 4), y: rest[k].y - F * 0.05};
  // (or on the bottom edge, below the end of the new band, when the note lies below and that edge is free)
  const markerBottom = {x: clamp(lastAfter.x + lastAfter.w - Rm * 0.8, rest[k].x + Rm + 4, rest[k].x + ov[k].w - Rm - 4), y: rest[k].y + ov[k].h + F * 0.05};
  const markerFor = () => markerTop;
  // leader from the change note to the marker: straight when clear of every object, the traced words
  // and the tabs; else around the tray's outer side and along its top rim
  const taken = [];
  const filmBody = {x: rest[k].x, y: rest[k].y + Rm, w: ov[k].w, h: ov[k].h - Rm * 2};
  const blockersFor = () => [bookBox, boardBox, tableBox, trayBox[1 - k], cardBoxes[k], filmBody, tabW0(0), tabW0(1)];
  // (parked props and other notes: kept at a visible distance from the leader)
  const segsClear = pts => pts.slice(1).every((q, i) => !blockersFor().some(b => segmentHits(pts[i], q, b, 0)) && !taken.some(b => segmentHits(pts[i], q, b, F * 0.4)));
  const leaderFor = nb => {
    for (const to of [markerTop, markerBottom]) {
      const from = {x: clamp(to.x, nb.x + 10, nb.x + nb.w - 10), y: to.y < nb.y ? nb.y : to.y > nb.y + nb.h ? nb.y + nb.h : nb.y + nb.h / 2};
      if (from.y === nb.y + nb.h / 2) from.x = to.x < nb.x ? nb.x : nb.x + nb.w;
      if (segsClear([from, to])) return [from, to];
    }
    const to = markerTop;
    const outerLeft = trayBox[k].x + trayBox[k].w / 2 < Wd / 2;
    const tb = trayBox[k];
    const xo = outerLeft ? tb.x - m * 0.45 : tb.x + tb.w + m * 0.45;
    const yr = Math.min(to.y - Rm - 2, tb.y + rim * 0.5);
    const f2 = {x: outerLeft ? nb.x : nb.x + nb.w, y: nb.y + Math.min(nb.h / 2, F)};
    return [f2, {x: xo, y: f2.y}, {x: xo, y: yr}, {x: to.x, y: yr}, to];
  };
  const leaderOk = nb => {
    const pts = leaderFor(nb);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
    return segsClear(pts) && len < F * 42;
  };
  const take = nb => { taken.push(nb); return true; };
  items.push({kind: 'mag', zones: pref.mag, measure: () => ({w: magM.w, h: magM.h}), accept: take});
  if (all) items.push({kind: 'ctx', zones: pref.ctx, measure: noteM(p.contextLabels.context, F, 500, 3), accept: take});
  if (key) items.push({kind: 'key', zones: pref.key, measure: noteM(t.key, F * 0.9, 600, 3), accept: take});
  if (key) items.push({kind: 'change', zones: pref.change, measure: noteM(changeText, F, 600, 8, F * 30), accept: leaderOk});
  let placed = packZones(zones, items, gp * 0.6);
  if (!placed.every(Boolean) && key) {
    // second order: the change note (both values) chooses its place first; the caption and the key
    // then take what is left, clear of its leader
    taken.length = 0;
    let changeLead = null;
    const byKind = kd => items.find(it => it.kind === kd);
    const clearOfLead = nb => !changeLead || !changeLead.slice(1).some((q, i) => segmentHits(changeLead[i], q, nb, 2));
    const order = ['mag', 'change', 'ctx', 'key'].map(byKind).filter(Boolean).map(it => it.kind === 'change'
      ? {...it, accept: nb => { if (!leaderOk(nb)) return false; changeLead = leaderFor(nb); return true; }}
      : {...it, accept: nb => clearOfLead(nb) && take(nb)});
    const got = packZones(zones, order, gp * 0.6);
    placed = items.map(it => got[order.findIndex(o => o.kind === it.kind)]);
  }
  need(placed.every(Boolean));
  const pl = kind => placed[items.findIndex(it => it.kind === kind)];
  const magP = pl('mag');
  const magRest = magP ? {x: magP.x - magM.x, y: magP.y - magM.y} : {x: Wd / 2, y: Hd - m - R};
  const mk = (kind, text, sz, wt, ml, extra = {}) => {
    const q = pl(kind);
    return q ? notePlate(ctx, {text, x: q.x, y: q.y, maxWidth: Math.min(q.maxW, kind === 'change' ? F * 30 : F * 24), size: sz, weight: wt, maxLines: ml, name: `${kind}N`, ...extra}) : null;
  };
  const changeN = mk('change', changeText, F, 600, 8, {color: C.b.ink, level: 'key'});
  const ctxN = mk('ctx', p.contextLabels.context, F, 500, 3);
  const keyN = mk('key', t.key, F * 0.9, 600, 3, {dash: true, level: 'key'});
  // the Δ marker at the end of the new band, with a leader from the change note
  const lead = changeN ? leaderFor(changeN.box) : null;
  const markerAt = changeN ? lead[lead.length - 1] : markerFor({x: rest[k].x, y: rest[k].y, w: 0, h: 0});
  // hand: from the desk edge nearest the magnifier's rest
  const magGrip = c => ({x: c.x + mag.grip.x, y: c.y + mag.grip.y});
  const srcC = {x: source.x + source.w / 2, y: source.y + source.h / 2};
  const g0 = magGrip(magRest), g1 = magGrip(srcC);
  const ARM = F * 2.1;
  const HAND = 24 * 1.3 * (ARM / 46);
  const fromBottom = shape === 'landscape' || (shape === 'square' && magRest.y > Hd * 0.5);
  const off = F * 4;
  const s = fromBottom ? {x: (g0.x + g1.x) / 2, y: Hd + off} : {x: magRest.x < Wd / 2 ? -off : Wd + off, y: (g0.y + g1.y) / 2};
  const dir = fromBottom ? {x: 0, y: -1} : {x: s.x < 0 ? 1 : -1, y: 0};
  const dmax = Math.max(dist(s, g0), dist(s, g1));
  const L = Math.max(F * 8, (dmax * 1.06 - HAND) / 2);
  const sOut = {x: s.x - dir.x * L * 1.5, y: s.y - dir.y * L * 1.5};
  const handOut = {x: sOut.x + dir.x * L * 1.25, y: sOut.y + dir.y * L * 1.25};
  const look = actorLook(ctx, null, 1);
  const rig = topArm(ctx, {name: 'arm', skin: look.skin, sleeve: look.outfit, handed: 'right', upper: L, lower: L, width: ARM});
  const e1 = ik2(s, g1, L, L + HAND, 1).elbow, e2 = ik2(s, g1, L, L + HAND, -1).elbow;
  const bend = fromBottom ? (e1.x > e2.x === (s.x > Wd / 2) ? 1 : -1) : (e1.y > e2.y ? 1 : -1);
  // checks
  const objBoxes = [bookBox, {...boardBox, h: boardO.h}, tableBox, trayBox[0], trayBox[1]];
  need(objBoxes.every(b => inside(b, deskBox, 0.5)), 'inside');
  const noteBoxes = [changeN && changeN.box, ctxN && ctxN.box, keyN && keyN.box].filter(Boolean);
  const magFoot = magBox(magRest, R, magLen, 40);
  const magClear = objBoxes.every(b => !overlaps(magFoot, b, 2)) && noteBoxes.every(b => !overlaps(magFoot, b, 2));
  const notesClear = noteBoxes.every(nb => objBoxes.every(b => !overlaps(nb, b, 0)) && inside(nb, deskBox, 0.5));
  const leadClear = !lead || leaderOk(changeN.box);
  need(magClear && notesClear, 'clear');
  return {
    fits, F, shape, Wd, Hd, k, changeText, tabBoxes: [tabW0(0), tabW0(1)], Rm, PL, slip, ov, table, tableBox, slipPos, trays, trayBox, rest, cards, cardPos, cardH, bookO, bookBox, boardO, boardBox,
    bandBefore, bandAfter, source, dest, zoom, beforeM, afterM, beforeAt, afterAt, mag, R, magLen, magRest, srcC, changeN, ctxN, keyN, markerAt, lead,
    rig, s, sOut, handOut, dir, bend, L, magClear, notesClear, leadClear, rail, spanBefore, spanAfter, pxu: pxPerUnit(ctx),
  };
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/** Build the detail window once the layout is chosen: its content is a real copy of the inspected tray region. */
function finish(ctx, L) {
  const k = L.k;
  const C = icColors(ctx);
  const copyOv = overlayArt(ctx, {prefix: 'lzov', PL: L.PL, F: L.F, lane: laneOf(ctx, k), letter: k ? 'B' : 'A', side: k ? 'right' : 'left', span: null, bandless: true, pad: L.F * 0.8, underText: bandsNode(ctx, L, 'lzb')});
  const tray = L.trayBox[k];
  const lensContent = g(null,
    h('rect', {x: r(tray.x), y: r(tray.y), width: r(tray.w), height: r(tray.h), fill: laneOf(ctx, k).soft}),
    g({transform: T(L.rest[k].x, L.rest[k].y)}, copyOv.node));
  L.win = lensWindow(ctx, {name: 'lens', source: L.source, dest: L.dest, content: lensContent, frame: {x: 0, y: 0, w: L.Wd, h: L.Hd}, color: C.b.color});
  return L;
}

/**
 * The inspected overlay's two bands (film coordinates): before = solid band
 * that fades to a dashed outline (kept, traceable); after = drawn line by
 * line over the new words.
 */
function bandsNode(ctx, L, prefix) {
  const lane = laneOf(ctx, L.k);
  const round = L.k === 1;
  const clipId = `${prefix}-aclip`;
  return g(null,
    h('path', {name: `${prefix}-before`, d: bandPath(L.bandBefore, round), fill: lane.band, opacity: 0.92}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, L.bandAfter.map((q, i) => h('rect', {name: `${prefix}-a${i}`, x: r(q.x), y: r(q.y - 2), width: 0, height: r(q.h + 4)})))),
    g({'clip-path': ctx.ref(clipId)}, h('path', {d: bandPath(L.bandAfter, round), fill: lane.band, opacity: 0.95})),
    h('path', {name: `${prefix}-ghost`, d: bandPath(L.bandBefore, round), fill: 'none', stroke: lane.ink, 'stroke-width': 2.5, 'stroke-dasharray': '7 5', opacity: 0}),
  );
}

/** Frame props for the after band drawn line by line (progress 0..1). */
function afterSweep(prefix, rects, pr) {
  const out = {};
  const total = rects.reduce((a, q) => a + q.w, 0) || 1;
  let acc = 0;
  rects.forEach((q, i) => {
    const a = acc / total, b = (acc + q.w) / total;
    acc += q.w;
    out[`${prefix}-a${i}`] = {width: r(q.w * clamp((pr - a) / Math.max(1e-6, b - a)))};
  });
  return out;
}

const scene = {
  sizes: {landscape: [1600, 800], square: [1100, 860], portrait: [1000, 1400]},
  layout(ctx) {
    const ppu = pxPerUnit(ctx);
    let last = null;
    // the change note always carries both values (old → new)
    for (let px = 25; px >= 16; px -= 0.4) {
      const L = tryLayout(ctx, px / ppu);
      if (L.fits) return finish(ctx, L);
      last = L;
    }
    return finish(ctx, last);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const t = kitT(ctx);
    const C = icColors(ctx);
    const p = ctx.params;
    const desk = deskWindow(ctx, {prefix: 'desk', x: 0, y: 0, w: L.Wd, h: L.Hd, radius: 26});
    const k = L.k;
    const win = L.win;
    const lead = L.lead;
    return g(null,
      desk.surface,
      g({'clip-path': desk.clip},
        g({transform: T(L.bookBox.x, L.bookBox.y)}, L.bookO.node),
        g({transform: T(L.boardBox.x, L.boardBox.y)}, L.boardO.node),
        g({transform: T(L.tableBox.x, L.tableBox.y)}, L.table.node),
        g({transform: T(L.slipPos.x, L.slipPos.y)}, L.slip.node),
        [0, 1].map(j => g({transform: T(L.trayBox[j].x, L.trayBox[j].y)}, L.trays[j].node)),
        [0, 1].map(j => g({transform: T(L.cardPos[j].x, L.cardPos[j].y)}, L.cards[j].node)),
        [0, 1].map(j => g({name: `film${j}`, transform: T(L.rest[j].x, L.rest[j].y)}, L.ov[j].node)),
        L.ctxN && L.ctxN.node,
        L.keyN && L.keyN.node,
        lead ? h('path', {name: 'lead', d: lead.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: C.b.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round', opacity: 0}) : null,
        g({name: 'changeG', opacity: 0}, L.changeN && L.changeN.node),
        changedMarker(ctx, {name: 'marker', x: L.markerAt.x, y: L.markerAt.y, radius: L.F * 0.62, opacity: 0}),
        g({name: 'mag', transform: T(L.magRest.x, L.magRest.y)}, L.mag.node),
        g(null, L.rig.arm, L.rig.palm, L.rig.thumb),
        win.node,
        g({name: 'beforeG', opacity: 0}, notePlate(ctx, {text: `${TRACE_MARK}${t.before}: “${p.beforeValue}”`, x: L.beforeAt.x, y: L.beforeAt.y, maxWidth: Math.min(L.dest.w, L.Wd - L.F * 1.6), size: L.F, weight: 600, maxLines: 3, level: 'key'}).node,
          h('line', {name: 'strike', x1: r(L.beforeAt.x + L.F * 1.4), y1: r(L.beforeAt.y + L.beforeM.h / 2), x2: r(L.beforeAt.x + L.F * 1.4), y2: r(L.beforeAt.y + L.beforeM.h / 2), stroke: th.ink, 'stroke-width': 2.5})),
        g({name: 'afterG', opacity: 0}, notePlate(ctx, {text: `${TRACE_MARK}${t.after}: “${p.afterValue}”`, x: L.afterAt.x, y: L.afterAt.y, maxWidth: Math.min(L.dest.w, L.Wd - L.F * 1.6), size: L.F, weight: 700, maxLines: 3, color: C.b.ink, level: 'key'}).node),
      ),
      desk.frame,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const w = name => seg(u, ...W[name]);
    const k = L.k;
    Object.assign(nodes, lightTableFrame('lt', 1, 1, L.rail));
    [0, 1].forEach(j => Object.assign(nodes, overlayFrame(L.ov[j], {lit: 0, trace: 1, band: 1})));
    // bands: before → dashed ghost; after drawn left to right
    const fade = ease.inOutSine(w('fade'));
    const sweep = ease.inOutSine(w('sweep'));
    for (const pre of ['cb', 'lzb']) {
      nodes[`${pre}-before`] = {opacity: r(0.92 * (1 - fade), 3)};
      nodes[`${pre}-ghost`] = {opacity: r(fade, 3)};
      Object.assign(nodes, afterSweep(pre, L.bandAfter, sweep));
    }
    Object.assign(nodes, overlayFrame({prefix: 'lzov', w: L.ov[k].w, h: L.ov[k].h, rects: []}, {lit: 0, trace: 1, band: 1}));
    // magnifier: rest → over the source → rest; the window opens from its glass
    const carry = ease.inOutCubic(w('carry'));
    const back = ease.inOutCubic(w('carryBack'));
    const magC = back > 0 ? mix(L.srcC, L.magRest, back) : mix(L.magRest, L.srcC, carry);
    nodes.mag = {transform: T(magC.x, magC.y)};
    const grip = {x: magC.x + L.mag.grip.x, y: magC.y + L.mag.grip.y};
    const enter = ease.inOutCubic(w('enter'));
    const out = ease.inOutCubic(w('out'));
    let hand, lean;
    if (u < W.enter[1]) { hand = mix(L.handOut, grip, enter); lean = enter; } else if (u < W.out[0]) { hand = grip; lean = 1; } else { hand = mix(grip, L.handOut, out); lean = 1 - out; }
    const sh = mix(L.sOut, L.s, lean);
    const pose = L.rig.pose(sh, hand, L.bend);
    Object.assign(nodes, pose.nodes);
    const el = ik2(sh, hand, L.L, L.L + 24 * 1.3 * ((L.F * 2.1) / 46), L.bend).elbow;
    const armPad = L.F * 1.05;
    const grow = b => ({x: b.x - armPad, y: b.y - armPad, w: b.w + armPad * 2, h: b.h + armPad * 2});
    const guarded = [L.changeN && L.changeN.box, {x: L.markerAt.x - L.Rm, y: L.markerAt.y - L.Rm, w: L.Rm * 2, h: L.Rm * 2}].filter(Boolean).map(grow);
    const armOff = guarded.every(b => !segmentHits(sh, el, b, 0) && !segmentHits(el, pose.wrist, b, 0) && !overlaps(b, {x: pose.hand.x - armPad, y: pose.hand.y - armPad, w: armPad * 2, h: armPad * 2}, 0));
    const open = ease.inOutCubic(w('open')) * (1 - ease.inOutCubic(w('close')));
    Object.assign(nodes, L.win.frame(open));
    const bc = w('beforeChip') * (1 - w('chipsOut'));
    const ac = w('afterChip') * (1 - w('chipsOut'));
    nodes.beforeG = {opacity: r(bc, 3)};
    nodes.afterG = {opacity: r(ac, 3)};
    const strikeW = (L.beforeM.w - L.F * 2) * fade;
    nodes.strike = {x2: r(L.beforeAt.x + L.F * 1.4 + strikeW)};
    const mk = w('marker'), nt = w('note');
    nodes.marker = {opacity: r(mk, 3)};
    nodes.changeG = {opacity: r(nt, 3)};
    if (L.lead) nodes.lead = {opacity: r(nt, 3)};
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const datum = sweep >= 0.5 ? 'after' : 'before';
    return {
      nodes,
      semantic: {
        beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
        layout: L.shape, fits: L.fits, keyPx: r(L.F * L.pxu, 2),
        focusTarget: ctx.params.focusTarget,
        datum, datumText: datum === 'after' ? ctx.params.afterValue : ctx.params.beforeValue,
        fade: r(fade, 3), swap: r(sweep, 3), lensOpen: r(open, 3),
        magnification: r(L.dest.w / L.source.w, 3),
        lensMapsSource: Math.abs(L.dest.w / L.source.w - L.dest.h / L.source.h) < 1e-6,
        contextScale: 1,
        hand: P2(pose.hand), magGrip: P2(grip), mag: P2(magC),
        magAtSource: dist(magC, L.srcC) < 0.5, magAtRest: dist(magC, L.magRest) < 0.5,
        oldTraceable: fade >= 1 ? true : null,
        spansFound: [Boolean(L.spanBefore), Boolean(L.spanAfter)],
        bandsDiffer: JSON.stringify(L.bandBefore.map(q => [r(q.x), r(q.w), q.line])) !== JSON.stringify(L.bandAfter.map(q => [r(q.x), r(q.w), q.line])),
        markerShown: mk >= 1, noteShown: nt >= 1,
        // the change note keeps both values; the Δ marker never covers a pull tab
        noteKeepsBoth: !L.changeN || (L.changeText.includes(ctx.params.beforeValue) && L.changeText.includes(ctx.params.afterValue)),
        markerOffTabs: L.tabBoxes.every(b => !overlaps(b, {x: L.markerAt.x - L.Rm, y: L.markerAt.y - L.Rm, w: L.Rm * 2, h: L.Rm * 2}, 0)),
        // while the marker / note / leader are visible, the drawn arm lies over none of them
        armClearOfNote: (mk === 0 && nt === 0) || armOff,
        // the return is spread and complete: nothing moves after this time
        lastMotionEnd: Math.max(...Object.values(W).map(q => q[1])),
        allReached: pose.reached,
        magClear: L.magClear, notesClear: L.notesClear, leadClear: L.leadClear,
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
    slug: 'sources-09-inspect',
    title: 'Concurrent interpretations — one highlighted span, changed and traced',
    titleEs: 'Interpretaciones concurrentes — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Interpretaciones concurrentes',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The light-table desk after one passage has given two readings: a hand carries the magnifier over the overlay of one reading and a real enlarged copy of that region opens; the words it highlights are substituted (the old band stays as a dashed outline, "before" and "after" named), the window closes and a changed-datum marker and a note naming the old and the new value remain. No reading is marked correct.',
    tags: ['interpretation', 'concurrent readings', 'inspect', 'magnifier', 'lens', 'tracing overlay', 'changed datum', 'book', 'editable hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/interpretaciones-concurrentes.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
