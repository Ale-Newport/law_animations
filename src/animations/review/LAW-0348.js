/**
 * LAW-0348 — Sustitución de decisión · inspect
 *
 * Storyboard (the context is the registry table seen from above, in its room:
 * the rail — intake tray with card B ◆ waiting, the position in its holder frame
 * with card A ●, the abutting history pocket — and, on the table under the
 * position, the position's RECORD PLATE: its glyph and order pips and the
 * supplied value naming what occupies the position; under the plate an empty
 * DOCK; a text panel beside the context names the cards and places):
 *  0.00–0.20  build: the plate carries the supplied BEFORE value (by default
 *             "in the position: the initial result").
 *  0.20–0.45  isolate: a frame settles on the plate; the panel steps out and the
 *             context steps back; a lens (a window with a rim and a shadow)
 *             opens in the freed space with a REAL enlarged copy of the same
 *             table coordinates, cropped on the plate and its dock. The plate's
 *             value and glyph leave the context as their enlarged copy arrives —
 *             one legible copy at a time.
 *  0.45–0.75  substitute ONE datum: the old value moves, unchanged, into the dock
 *             captioned "was" as the supplied AFTER value comes in (never struck,
 *             never marked as wrong); the glyph changes ● → ◆ and the pips from
 *             one dot to two (labels hidden: only these marks show the change).
 *             Only the dependent state follows, in the context, after the new
 *             value is legible: card B slides into the position and pushes card
 *             A into the history pocket, where A stays visible.
 *  0.75–1.00  return: the lens closes onto the context with the new value, the
 *             old value docked (traceable) and a neutral changed-datum marker
 *             (Δ). Seeking back restores the old datum exactly.
 * Nothing is evaluated: the value is only what the user supplied; no rule, time
 * limit or outcome; neither result is marked right or wrong; jurisdiction
 * unspecified.
 * @module animations/review/LAW-0348
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {pxPerUnit} from '../hearings/kits/apertura-audiencia.js';
import {wallRing, floorArea, planColors} from '../courts/kits/courts-art.js';
import {
  sdFields, SD_EN, SD_ES, localisedSd, fitG, textAt, cardModel, cardNode, railGeometry, railNode, calendarNode,
  markGlyph, orderPips, panelLayout, panelNode, INK, CARD, laneColor, overlaps,
} from './kits/sustitucion-de-decision.js';

const ID = 'LAW-0348';
const DURATION = 8000;
const W = {
  frame: [0.18, 0.205], panelOut: [0.185, 0.205], ctxOut: [0.205, 0.209], back: [0.209, 0.224], open: [0.212, 0.24],
  move: [0.48, 0.55], was: [0.54, 0.555], newIn: [0.555, 0.585], marks: [0.5, 0.585], cue: [0.6, 0.68],
  close: [0.728, 0.744], forward: [0.744, 0.758], ctxIn: [0.758, 0.761], frameOut: [0.735, 0.75], panelIn: [0.744, 0.762], marker: [0.8, 0.83],
};
const SIZES = [24, 23, 22, 21, 20.5, 19.5, 18.5, 17.5, 16.5, 16];

const STRINGS = {en: {was: 'was'}, es: {was: 'antes'}};
const OWN_EN = {
  focusTarget: 'position-record',
  beforeValue: 'In the position: the initial result, card A (as supplied)',
  afterValue: 'In the position: the later result supplied, card B (as supplied)',
  contextLabels: {context: 'The registry table and the record label of its position (as supplied)', marker: 'Changed: the supplied value on the record'},
};
const OWN_ES = {
  focusTarget: 'position-record',
  beforeValue: 'En la posición: el resultado inicial, tarjeta A (según lo aportado)',
  afterValue: 'En la posición: el resultado posterior suministrado, tarjeta B (según lo aportado)',
  contextLabels: {context: 'La mesa de registro y la placa de registro de su posición (según lo aportado)', marker: 'Cambio: el valor aportado en el registro'},
};
const pick = o => ({decisions: o.decisions, labels: o.labels});
const EN = {...pick(SD_EN), ...OWN_EN};
const ES = {...pick(SD_ES), ...OWN_ES};

// (OMITTED brief fields — see the presets note: grounds, routes, outcomes. The inspection substitutes one datum; the
// places are named by the panel's rows through the cards and the position.)
const sceneSchema = {
  decisions: sdFields.decisions,
  labels: sdFields.labels,
  focusTarget: oneOf('Detail that is enlarged and substituted: the record plate of the position (its supplied value); only the dependent state follows it (the cards on the rail)', ['position-record']),
  beforeValue: str('Value on the record plate before the substitution (as supplied; names card A, the initial result)', 90),
  afterValue: str('Value on the record plate after the substitution (the alternative datum, as supplied; names card B, the later result)', 90),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens, relative to the context at rest (never below 1.6)', 1.6, 4),
    placement: oneOf('Alignment of the lens inside the space it opens in', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 90),
    marker: str('Label of the changed-datum marker', 70),
  }, ['context', 'marker']),
};
const defaultParams = {...EN, detailGeometry: {zoom: 3, placement: 'auto'}};

/* ------------------------------------------------------------------ */
/* The context room (one builder for the context and the lens copy)    */
/* ------------------------------------------------------------------ */

/** Room geometry in room-local design units for a room box w × h and a text size F. */
function roomGeometry(ctx, P, w, F, showKey, wasText, chK = 0.68) {
  const wall = 14, pad = 16, ins = 9, m = 9, edge = 10;
  const gap = Math.max(34, F * 1.6);
  const tableW = w - 2 * (wall + pad);
  const cw = (tableW - 2 * edge - 4 * ins - gap - 2 * m) / 3;
  const ch = cw * chK;
  const RG = railGeometry({cw, ch, gap, inset: ins, margin: m});
  const CM = cardModel(ctx, {w: cw, F: Math.min(cw * 0.11, ch / 6.2), a: '', b: '', showText: false, fixH: ch, bars: 2});
  // plate and dock under the position (the plate is wider than the slot; it stays inside the table)
  const posCx = (RG.position.x + RG.cards.position.w / 2 + ins);
  const ppad = Math.max(10, F * 0.55);
  const head = F * 1.5;
  const vfitW = (t, tw) => fitG(t, {maxWidth: tw, size: F, minSize: F, maxLines: 6, weight: 600});
  // the narrowest plate (from 1.5 card widths up to the table's width) on which both values fit in five lines
  let plateW = showKey ? Math.min(tableW - 2 * edge, Math.max(cw * 1.15, F * 9.5)) : cw * 1.15;
  if (showKey) {
    for (let wq = plateW; wq <= tableW - 2 * edge + 0.5; wq += 12) {
      plateW = Math.min(wq, tableW - 2 * edge);
      if (vfitW(P.beforeValue, plateW - 2 * ppad).ok && vfitW(P.afterValue, plateW - 2 * ppad).ok) break;
    }
  }
  const textW = plateW - 2 * ppad;
  const fb = showKey ? vfitW(P.beforeValue, textW) : null, fa = showKey ? vfitW(P.afterValue, textW) : null;
  const ok = (!fb || fb.ok) && (!fa || fa.ok);
  const textH = fb && fa ? Math.max(fb.height, fa.height) : F * 1.6;
  const plateH = ppad + head + F * 0.3 + textH + ppad;
  const was = showKey ? fitG(wasText, {maxWidth: textW, size: F, minSize: F, maxLines: 1, weight: 500}) : null;
  const dfit = showKey ? vfitW(P.beforeValue, textW) : null;
  const dockH = ppad + (was ? was.height + F * 0.3 : F * 0.6) + (dfit ? dfit.height : F * 1.6) + ppad;
  const railY = wall + pad + edge;
  const plateY = railY + RG.H + F * 0.9;
  const dockY = plateY + plateH + F * 0.7;
  const tableH = (dockY + dockH + edge) - (wall + pad);
  const H = wall + pad + tableH + pad + wall + 8;
  const tableX = wall + pad;
  let plateX = tableX + edge + RG.position.x + RG.position.w / 2 - plateW / 2;
  const railX = tableX + (tableW - RG.W) / 2;
  plateX = railX + RG.position.x + (RG.cards.position.w + 2 * ins) / 2 - plateW / 2;
  plateX = clamp(plateX, tableX + edge, tableX + tableW - edge - plateW);
  void posCx;
  return {w, h: H, wall, pad, tableX, tableY: wall + pad, tableW, tableH, railX, railY, RG, CM, cw, ch,
    plate: {x: plateX, y: plateY, w: plateW, h: plateH, pad: ppad, head, textW, fits: {before: fb, after: fa}},
    dock: {x: plateX, y: dockY, w: plateW, h: dockH, was, fit: dfit, pad: ppad},
    cal: {x: w - wall - pad - Math.max(44, F * 2.2), y: H - wall - 8 - Math.max(44, F * 2.2) * 0.86 - 6, w: Math.max(44, F * 2.2), h: Math.max(44, F * 2.2) * 0.86},
    F, ok};
}

/** Room node with all named parts prefixed (context 'rm', lens copy 'lz'). Local origin = room top-left. */
function roomNode(ctx, G, pre) {
  const th = ctx.theme;
  const pc = planColors(ctx);
  const F = G.F;
  const parts = [];
  parts.push(floorArea(ctx, {name: `${pre}-floor`, x: G.wall, y: G.wall, w: G.w - 2 * G.wall, h: G.h - 2 * G.wall, kind: 'tiles', cell: 56}));
  parts.push(wallRing(ctx, {name: `${pre}-walls`, x: 0, y: 0, w: G.w, h: G.h, t: G.wall}));
  parts.push(g({transform: T(G.cal.x, G.cal.y)}, calendarNode(ctx, {prefix: `${pre}-cal`, w: G.cal.w, h: G.cal.h})));
  parts.push(g({name: `${pre}-table`},
    h('path', {d: roundRectPath(G.tableX + 5, G.tableY + 8, G.tableW, G.tableH, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(G.tableX, G.tableY, G.tableW, G.tableH, 14), fill: pc.wood, stroke: INK, 'stroke-width': 2.5})));
  parts.push(g({transform: T(G.railX, G.railY)}, railNode(ctx, G.RG, {prefix: `${pre}-rail`})));
  const cP = G.RG.cards.position, cI = G.RG.cards.intake;
  parts.push(g({name: `${pre}-cardA`, transform: T(G.railX + cP.x, G.railY + cP.y)}, cardNode(ctx, G.CM, {prefix: `${pre}-a`, side: 'a', order: 1, text: false})));
  parts.push(g({name: `${pre}-cardB`, transform: T(G.railX + cI.x, G.railY + cI.y)}, cardNode(ctx, G.CM, {prefix: `${pre}-b`, side: 'b', order: 2, text: false})));
  // record plate: a screw-mounted plate; header (glyph + order pips), then the supplied value
  const Pl = G.plate;
  const gR = F * 0.48;
  const valNode = (key, fit) => g({name: `${pre}-rec-v-${key}`, opacity: key === 'before' ? 1 : 0},
    fit ? textAt(fit, {x: Pl.x + Pl.pad, y: Pl.y + Pl.pad + Pl.head + F * 0.3, fill: INK, name: `${pre}-rec-v-${key}-text`}) : h('rect', {x: r(Pl.x + Pl.pad), y: r(Pl.y + Pl.pad + Pl.head + F * 0.4), width: r(Pl.textW * (key === 'before' ? 0.7 : 0.85)), height: r(F * 0.55), rx: 4, fill: INK, opacity: 0.7}));
  parts.push(g({name: `${pre}-rec`},
    h('path', {d: roundRectPath(Pl.x + 4, Pl.y + 6, Pl.w, Pl.h, 10), fill: th.shadow}),
    h('path', {name: `${pre}-rec-body`, d: roundRectPath(Pl.x, Pl.y, Pl.w, Pl.h, 10), fill: '#f2efe8', stroke: INK, 'stroke-width': 2.5}),
    [[Pl.x + 8, Pl.y + 8], [Pl.x + Pl.w - 8, Pl.y + 8], [Pl.x + 8, Pl.y + Pl.h - 8], [Pl.x + Pl.w - 8, Pl.y + Pl.h - 8]].map(([x, y]) => h('circle', {cx: r(x), cy: r(y), r: 3, fill: '#8a949c'})),
    g({name: `${pre}-rec-a`, transform: T(Pl.x + Pl.pad + gR + 6, Pl.y + Pl.pad + Pl.head / 2), opacity: 1}, markGlyph('a', gR, {stroke: '#f2efe8', sw: 1.5, name: `${pre}-rec-a-g`})),
    g({name: `${pre}-rec-b`, transform: T(Pl.x + Pl.pad + gR + 6, Pl.y + Pl.pad + Pl.head / 2), opacity: 0}, markGlyph('b', gR, {stroke: '#f2efe8', sw: 1.5, name: `${pre}-rec-b-g`})),
    g({name: `${pre}-rec-p1`, transform: T(Pl.x + Pl.pad + gR * 2 + 16 + gR * 1.6, Pl.y + Pl.pad + Pl.head / 2), opacity: 1}, orderPips(1, gR * 0.62)),
    g({name: `${pre}-rec-p2`, transform: T(Pl.x + Pl.pad + gR * 2 + 16 + gR * 1.6, Pl.y + Pl.pad + Pl.head / 2), opacity: 0}, orderPips(2, gR * 0.62)),
    h('line', {x1: r(Pl.x + Pl.pad), x2: r(Pl.x + Pl.w - Pl.pad), y1: r(Pl.y + Pl.pad + Pl.head + 2), y2: r(Pl.y + Pl.pad + Pl.head + 2), stroke: th.paperLine, 'stroke-width': 2}),
    valNode('before', Pl.fits.before),
    valNode('after', Pl.fits.after)));
  // dock: an empty tray; the old value arrives here as the record captioned "was"
  const Dk = G.dock;
  parts.push(g({name: `${pre}-dock`},
    h('path', {name: `${pre}-dock-body`, d: roundRectPath(Dk.x, Dk.y, Dk.w, Dk.h, 10), fill: '#e6e0d2', stroke: shadeInk(), 'stroke-width': 2}),
    h('path', {d: roundRectPath(Dk.x + 5, Dk.y + 5, Dk.w - 10, Dk.h - 10, 7), fill: 'none', stroke: '#cfc6b3', 'stroke-width': 1.5}),
    g({name: `${pre}-dock-v`, opacity: 0},
      Dk.was ? textAt(Dk.was, {x: Dk.x + Dk.pad, y: Dk.y + Dk.pad, fill: th.inkSoft, italic: true, name: `${pre}-was`}) : g({transform: T(Dk.x + Dk.pad + gR, Dk.y + Dk.pad + gR)}, markGlyph('a', gR * 0.8, {stroke: '#e6e0d2', sw: 1.5, name: `${pre}-dock-ma`})),
      Dk.fit ? textAt(Dk.fit, {x: Dk.x + Dk.pad, y: Dk.y + Dk.pad + (Dk.was ? Dk.was.height + F * 0.3 : F * 0.6), fill: INK, name: `${pre}-dock-text`}) : h('rect', {x: r(Dk.x + Dk.pad), y: r(Dk.y + Dk.h - Dk.pad - F * 0.6), width: r(Dk.w * 0.6), height: r(F * 0.5), rx: 4, fill: INK, opacity: 0.6}))));
  return g({name: pre}, parts);
}
const shadeInk = () => '#8c8576';

/** Frame records of a room copy: card positions (dependent state) and the record's datum. */
function roomFrame(G, pre, st) {
  const n = {};
  const cP = G.RG.cards.position, cI = G.RG.cards.intake;
  const travel = st.slide * G.RG.travelB;
  const contact = G.RG.travelB - G.RG.travelA;
  n[`${pre}-cardB`] = {transform: T(G.railX + cI.x + travel, G.railY + cI.y)};
  n[`${pre}-cardA`] = {transform: T(G.railX + cP.x + Math.max(0, travel - contact), G.railY + cP.y)};
  n[`${pre}-rec-v-before`] = {opacity: r(st.before, 3)};
  n[`${pre}-rec-v-after`] = {opacity: r(st.after, 3)};
  n[`${pre}-rec-a`] = {opacity: r(st.ga, 3)};
  n[`${pre}-rec-b`] = {opacity: r(st.gb, 3)};
  n[`${pre}-rec-p1`] = {opacity: r(st.ga, 3)};
  n[`${pre}-rec-p2`] = {opacity: r(st.gb, 3)};
  n[`${pre}-dock-v`] = {opacity: r(st.dock, 3)};
  n[`${pre}-rail-pocket-glow`] = {opacity: r(0.85 * st.slide * (st.slide >= 1 ? 1 : 0), 3)};
  return n;
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** The context room's top-left and scale when it has stepped back by `back` ∈ [0, 1]. */
function ctxPlace(L, back) {
  const R = L.roomRect;
  const sc = lerp(1, L.lens.s, back);
  if (L.tall) return {sc, x: R.x, y: lerp(R.y, 0, back)};
  const cy = R.y + R.h / 2;
  return {sc, x: lerp(R.x, 0, back), y: cy - (R.h / 2) * sc};
}

function compose(ctx, P, F, opt) {
  const D = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const problems = [];
  const tall = opt.tall;
  const gap = 18;
  // panel (beside the context on wide/square frames, below it on tall ones)
  const rows = [];
  if (showAll) rows.push({kind: 'heading', text: P.contextLabels.context, name: 'ctx-caption'});
  if (showKey) {
    rows.push({kind: 'item', icon: 'a', text: P.decisions.initial, name: 'lg-a'});
    rows.push({kind: 'item', icon: 'b', text: P.decisions.later, name: 'lg-b'});
    rows.push({kind: 'item', icon: 'holder', text: P.decisions.position, name: 'lg-position'});
  }
  if (showAll) rows.push({kind: 'item', icon: 'pips', text: P.labels.order, name: 'order-note'});
  if (showKey) rows.push({kind: 'item', icon: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const panelW = tall ? D.w : Math.max(F * 11, D.w * opt.panel);
  const PL = panelLayout(ctx, rows, {w: panelW - (tall ? 6 : gap), F, maxLines: 4, gap: F * 0.55});
  if (!PL.ok) problems.push('panel');
  // (labels hidden on wide frames: no panel; the room stands centred, leaving the lens its space when it steps back)
  // (labels hidden: no panel; the room stands centred and a little wider, its cards taller, so the scene fills the frame)
  const roomW = tall ? D.w : rows.length ? D.w - panelW : D.w * (ctx.view.shape === 'square' ? 0.75 : 0.68);
  const chK = tall ? (rows.length ? 1.4 : 1.7) : rows.length ? 0.68 : ctx.view.shape === 'square' ? 1.15 : 0.8;
  const G = roomGeometry(ctx, P, roomW, F, showKey, ctx.t.was, chK);
  if (!G.ok) problems.push('plate-text');
  // fit the room into its region (scale k ≤ 1 when it is taller than the space)
  const regionH = tall ? D.h - PL.h - gap * 2 : D.h;
  // (labels hidden: no panel — the same room grows to fill the frame at rest)
  const k = Math.min(1, regionH / G.h);
  if (showKey && F * k * pxPerUnit(ctx) < (opt.floor ?? 16) - 0.01) problems.push('ctx-text');
  const roomRect = {x: 0, y: tall ? Math.max(0, (D.h - (G.h * k + gap + PL.h)) * 0.3) : (D.h - G.h * k) / 2, w: G.w * k, h: G.h * k};
  if (!tall && k < 1) roomRect.x = (roomW - G.w * k) / 2;
  if (!rows.length) { roomRect.x = (D.w - G.w * k) / 2; roomRect.y = (D.h - G.h * k) / 2; }
  const panelRect = tall ? {x: 6, y: roomRect.y + roomRect.h + gap, w: D.w - 6, h: PL.h} : {x: roomW + gap, y: (D.h - PL.h) / 2, w: panelW - gap, h: PL.h};
  if (panelRect.y + panelRect.h > D.h + 0.5) problems.push('panel-height');
  return {problems, F, tall, PL, G, k, roomRect, panelRect, roomW};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1359]},
  layout(ctx) {
    const P = localisedSd(ctx, EN, ES);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const tall0 = ctx.view.shape === 'portrait';
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    const tightSide = 0.375 * shortD;
    const zoomMax = P.detailGeometry.zoom;
    const opts = tall0 ? [{tall: true}] : ctx.view.shape === 'square' ? [{tall: true}, {tall: false, panel: 0.4}, {tall: false, panel: 0.46}] : [{tall: false, panel: 0.34}, {tall: false, panel: 0.4}];
    // the lens: where it opens, how far the context steps back, the crop and the zoom
    const lensPlan = C => {
      const {G, k, roomRect} = C;
      const crop0 = {x: G.plate.x - 12, y: G.plate.y - 12, w: G.plate.w + 24, h: G.dock.y + G.dock.h - G.plate.y + 24};
      // (the context steps back to the frame's left edge — or its top on tall frames — as it shrinks)
      const regionFor = sc => (C.tall
        ? {x: 0, y: roomRect.h * sc + 18, w: D.w, h: D.h - (roomRect.h * sc + 18)}
        : {x: roomRect.w * sc + 18, y: 0, w: D.w - (roomRect.w * sc + 18), h: D.h});
      const shareOf = sc => (C.tall ? Math.max((roomRect.h * sc * f.scale) / ctx.view.height, (roomRect.w * sc * f.scale) / ctx.view.width) : (roomRect.w * sc * f.scale) / ctx.view.width);
      let sc = 1, region = regionFor(1), ok = false;
      for (const zt of [2.3, 2, 1.8, 1.65, 1.56]) {
        for (let q = 1; q >= 0.3 - 1e-9; q -= 0.02) {
          if (shareOf(q) < 0.455) break;
          const rg = regionFor(q);
          const z = Math.min(zoomMax, rg.w / (crop0.w * k), rg.h / (crop0.h * k));
          // (stacked: context + lens must span >= 0.8 of the frame width — the context's width or the lens's)
          if (C.tall && Math.max(roomRect.w * q, crop0.w * k * z) * f.scale / ctx.view.width < 0.8) continue;
          sc = q; region = rg;
          if (z >= zt && Math.min(rg.w, rg.h) >= tightSide) { ok = true; break; }
        }
        if (ok) break;
      }
      const problems = ok ? [] : ['lens-space'];
      let Z = k * Math.min(zoomMax, region.w / (crop0.w * k), region.h / (crop0.h * k));
      // grow the crop (around the plate, on the table) only as far as the window needs for its smaller side
      const crop = {...crop0};
      const minT = tightSide / Z;
      if (crop.w < minT) { const dx = (minT - crop.w) / 2; crop.x -= dx; crop.w = minT; }
      if (crop.h < minT) { const dy = (minT - crop.h) / 2; crop.y -= dy; crop.h = minT; }
      crop.x = clamp(crop.x, 0, G.w - crop.w);
      crop.y = clamp(crop.y, 0, G.h - crop.h);
      Z = Math.min(Z, region.w / crop.w, region.h / crop.h);
      const zm = Z / k;
      const dest = {w: crop.w * Z, h: crop.h * Z};
      const pl = P.detailGeometry.placement;
      const ax = pl === 'left' ? 0 : pl === 'right' ? 1 : 0.5;
      dest.x = region.x + (region.w - dest.w) * ax;
      dest.y = C.tall ? region.y + (region.h - dest.h) * (pl === 'bottom' ? 1 : pl === 'top' ? 0 : 0.5) : clamp(roomRect.y + roomRect.h / 2 - dest.h / 2, region.y, region.y + region.h - dest.h);
      if (Math.min(dest.w, dest.h) < 0.36 * shortD - 0.5) problems.push('lens-small');
      if (zm < 1.56) problems.push('lens-zoom');
      return {s: sc, region, Z, zm, crop, dest, problems};
    };
    let best = null;
    outer:
    for (const Fp of SIZES) {
      for (const opt of opts) {
        const C = compose(ctx, P, Fp / px, {...opt, floor: 16});
        const LP = lensPlan(C);
        C.lens = LP;
        C.problems.push(...LP.problems);
        if (!best || C.problems.length < best.problems.length) best = C;
        if (!C.problems.length) { best = C; break outer; }
      }
    }
    const L = best;
    L.P = P;
    L.px = px;
    L.shortD = shortD;
    const {G, k, roomRect} = L;
    const toD = b => ({x: roomRect.x + b.x * k, y: roomRect.y + b.y * k, w: b.w * k, h: b.h * k});
    L.toD = toD;
    L.srcD = toD({x: G.plate.x - 8, y: G.plate.y - 8, w: G.plate.w + 16, h: G.plate.h + 16});
    // the Δ marker: on the table beside the plate (left or right), clear of the plate and the dock
    const mR = 16;
    const side = G.plate.x - G.tableX > G.tableX + G.tableW - (G.plate.x + G.plate.w) ? -1 : 1;
    const mx = side < 0 ? G.plate.x - 14 / k - mR / k : G.plate.x + G.plate.w + 14 / k + mR / k;
    L.markerD = {x: roomRect.x + mx * k, y: roomRect.y + (G.plate.y + G.plate.h / 2) * k};
    L.markerR = mR;
    if ((side < 0 && G.plate.x - G.tableX < (28 + 2 * mR) / k) || (side > 0 && G.tableX + G.tableW - (G.plate.x + G.plate.w) < (28 + 2 * mR) / k)) L.problems.push('marker-space');
    // the lens opens only once the stepping-back context no longer lies under it
    const {dest} = L.lens;
    const lensBox = {x: dest.x - 4, y: dest.y - 4, w: dest.w + 14, h: dest.h + 18};
    const clearAt = u => {
      const q = ctxPlace(L, ease.inOutCubic(seg(u, ...W.back)));
      return !overlaps({x: q.x, y: q.y, w: roomRect.w * q.sc, h: roomRect.h * q.sc}, lensBox, 0);
    };
    let uClear = W.open[0];
    while (uClear <= W.back[1] && !clearAt(uClear)) uClear += 0.0002;
    if (!clearAt(uClear)) L.problems.push('lens-over-context');
    const shiftW = Math.max(0, uClear - W.open[0]);
    L.openW = [W.open[0] + shiftW, Math.max(W.open[1], W.open[0] + shiftW + 0.02)];
    L.ctxOutW = [W.ctxOut[0] + 0.004 + shiftW, W.ctxOut[1] + 0.004 + shiftW];
    L.panelOutW = [Math.max(W.panelOut[0], L.openW[0] - 0.018), L.openW[0]];
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {G, k, roomRect} = L;
    const d = L.lens.dest;
    const crop = L.lens.crop;
    const Z = L.lens.Z;
    return g(null,
      g({name: 'ctx', transform: 'translate(0 0) scale(1)'},
        g({name: 'plan', transform: `${T(roomRect.x, roomRect.y)} scale(${r(k, 5)})`}, roomNode(ctx, G, 'rm')),
        h('rect', {name: 'src-frame', x: r(L.srcD.x), y: r(L.srcD.y), width: r(L.srcD.w), height: r(L.srcD.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
        changedMarker(ctx, {name: 'cx-marker', x: L.markerD.x, y: L.markerD.y, radius: L.markerR, opacity: 0})),
      g({name: 'panel', transform: T(L.panelRect.x, L.panelRect.y)}, panelNode(ctx, L.PL)),
      g({name: 'lens', opacity: 0, 'data-occludes': 1, transform: 'translate(0 0) scale(1)'},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18}))),
        h('rect', {name: 'lens-shadow', x: r(d.x + 6), y: r(d.y + 10), width: r(d.w), height: r(d.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: '#f5efe3'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(d.x - crop.x * Z, d.y - crop.y * Z)} scale(${r(Z, 5)})`}, roomNode(ctx, G, 'lz'))),
        h('rect', {name: 'lens-rim', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const open = ease.inOutCubic(seg(u, ...L.openW)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const back = ease.inOutCubic(seg(u, ...W.back)) * (1 - ease.inOutCubic(seg(u, ...W.forward)));
    const q = ctxPlace(L, back);
    const sc = q.sc;
    nodes.ctx = {transform: `${T(q.x - L.roomRect.x * sc, q.y - L.roomRect.y * sc)} scale(${r(sc, 4)})`, opacity: r(1 - 0.42 * Math.min(1, open * 1.4), 3)};
    const move = ease.inOutCubic(seg(u, ...W.move));
    const was = seg(u, ...W.was);
    const newIn = seg(u, ...W.newIn);
    // context texts stay only while they are at or above the text floor; one copy of the datum at a time
    const floor = L.F * L.px >= 19.5 ? 19.5 : 16;
    const textK = sc >= 0.9999 ? 1 : clamp((L.F * L.k * L.px * sc - Math.min(floor, L.F * L.k * L.px - 0.01)) / 0.6);
    const ctxT = u < 0.5 ? Math.min(1 - seg(u, ...L.ctxOutW), textK) : seg(u, ...W.ctxIn);
    const lensT = clamp((open - 0.12) / 0.3);
    const sw = u >= W.newIn[0];
    const inK = sw ? 0.3 + 0.7 * newIn : 0;
    const marks = seg(u, ...W.marks);
    const showKey = ctx.show('key');
    const recFor = copy => {
      const q = showKey ? (sw ? 1 : 0) : marks;
      const out = showKey ? 1 - (sw ? 1 : 0) : 1 - clamp(q * 2);
      const inn = showKey ? (sw ? inK : 0) : clamp(q * 2 - 1);
      return {
        before: (sw ? 0 : 1 - 0.7 * seg(u, W.was[0], W.newIn[0])) * copy,
        after: inK * copy,
        ga: out * copy, gb: inn * copy,
        dock: (showKey ? inK : clamp(marks * 2 - 1)) * copy,
      };
    };
    // the dependent state (both copies): card B slides into the position and pushes card A on — after the new value
    const cue = ease.inOutSine(seg(u, ...W.cue));
    Object.assign(nodes, roomFrame(L.G, 'rm', {slide: cue, ...recFor(ctxT)}));
    Object.assign(nodes, roomFrame(L.G, 'lz', {slide: cue, ...recFor(lensT)}));
    const fr = seg(u, ...W.frame) * (1 - seg(u, ...W.frameOut));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const ls = 0.6 + 0.4 * open;
    const lc = {x: L.lens.dest.x + L.lens.dest.w / 2, y: L.lens.dest.y + L.lens.dest.h / 2};
    nodes.lens = {opacity: r(Math.min(1, open * 2.5), 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    const panelOp = u < 0.5 ? 1 - seg(u, ...L.panelOutW) : seg(u, ...W.panelIn);
    nodes.panel = {opacity: r(panelOp, 3)};
    const mk = seg(u, ...W.marker);
    nodes['cx-marker'] = {opacity: r(mk, 3)};
    if (L.PL.rows.some(m => m.name === 'marker-row')) nodes['marker-row'] = {opacity: r(mk, 3)};
    const datum = u < W.move[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    return {
      nodes,
      semantic: {
        beat: u < 0.2 ? 'build' : u < 0.45 ? 'isolate' : u < 0.75 ? 'substitute' : 'return',
        datum,
        cards: cue >= 1 ? 'after' : cue > 0 ? 'changing' : 'before',
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
        zoomVsRest: r(L.lens.zm, 3),
        lensMinSide: r(Math.min(L.lens.dest.w, L.lens.dest.h) / L.shortD, 3),
        textPx: r(L.F * L.k * L.px, 2),
        problems: L.problems,
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
    slug: 'review-07-inspect',
    title: 'Decision substitution — inspecting the record plate of the position and substituting its supplied value',
    titleEs: 'Sustitución de decisión — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Sustitución de decisión',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A registry table seen from above: the rail with card B (◆) in the intake tray, card A (●) in the position (in its holder frame) and the history pocket; under the position lies its record plate — glyph, order pips and the supplied value naming what occupies the position — with an empty dock below. A lens (a window with a rim) opens beside the context with a real enlarged copy of the same table coordinates, cropped on the plate and the dock. One supplied datum is substituted: the old value moves unchanged into the dock as "was" while the new value comes in; the glyph changes ● → ◆ and the pips from one dot to two. Only the dependent state follows, after the new value: card B slides into the position and pushes card A into the history pocket, where it stays visible. The context returns with a neutral changed-datum marker. Illustrative; nothing is evaluated; jurisdiction unspecified.',
    tags: ['review', 'decision substitution', 'inspect', 'lens', 'record plate', 'substitution', 'changed datum', 'history kept', 'as supplied', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/sustitucion-de-decision.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
