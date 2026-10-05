/**
 * LAW-0508 — Cláusula de indemnidad · inspect
 *
 * Storyboard (a reading stand; one tag, one lens):
 *  0.00–0.12  context: on a wooden reading stand the contract "CT-412 · Supply contract (fictional)" (heading "Indemnity
 *             clause", supplied clause lines) has the claim slip plugged into the socket of the supplied promise line; a
 *             scope tag hangs from the slip on a short cord, printed with the supplied status (before-value, e.g.
 *             ● "Claim covered as per supplied data"); the scope outline round the promise line and the claim is drawn
 *             accordingly (solid). The reading lens rests on the stand's ledge.
 *  0.10–0.20  the reading lens slides up over the tag;
 *  0.20–0.32  a detail lens opens beside the stand (a real enlargement of the tag and the outline's edge, ≥ 1.5×); the
 *             tag's value in the context is blanked in step, so the datum is legible in one place only.
 *  0.42–0.56  in the lens the before-value lifts away and stays traceable as "was: …"; the after-value (e.g. ◆ "Scope
 *             disputed (as supplied)") drops in and holds still.
 *  0.56–0.64  only the dependent geometry follows: the outline edge changes from solid to dashed (same colour, width).
 *  0.68–0.78  the lens closes; the context tag shows the after-value (and "was: …"); 0.74–0.82 the reading lens returns
 *             to the ledge; 0.80–0.84 the changed-datum marker (Δ) appears beside the tag; the key fades in.
 * Seeking back restores the before-value exactly. No indemnity doctrine, nothing decided beyond the supplied values.
 * @module animations/contract-terms/LAW-0508
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, num, oneOf} from '../../schemas/fields.js';
import {lens as lensFrame} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  INK, SCOPE, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, promiseField, claimField,
  promiseIndex, localizeScene, unitPx, fitG, chipG, txt, stateGlyph, sheetText, placeRows, contractSheet, socketArt,
  slipText, claimSlip, slipBox, readingLens, lensCentreOf, roundedLoop, overlaps, shade,
} from './kits/clausula-indemnidad.js';

const ID = 'LAW-0508';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {lupaIn: [0.04, 0.2], open: [0.2, 0.32], lift: [0.42, 0.49], was: [0.47, 0.52], after: [0.5, 0.56], edge: [0.56, 0.64], close: [0.68, 0.78], lupaOut: [0.72, 0.84], marker: [0.8, 0.84], key: [0.82, 0.88], label: [0.84, 0.9]};

const strings = {
  en: {...KIT_STRINGS.en},
  es: {...KIT_STRINGS.es},
};

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  promise: promiseField,
  claim: claimField,
  focusTarget: oneOf('Detail that is enlarged and substituted (the scope tag)', ['tag']),
  beforeState: oneOf('Supplied status before the substitution (sets the glyph and outline: covered ● solid, disputed ◆ dashed); the after-status is the other one', ['covered', 'disputed']),
  beforeValue: str('Wording printed on the tag before the substitution, as supplied', 60),
  afterValue: str('Wording printed on the tag after the substitution, as supplied (stays an allegation where it says so)', 60),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens (it may be smaller to fit, never under 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Plate on the reading stand', 60), marker: str('Label of the changed-datum marker', 40)}),
  actionProgress: num('How far the inspection is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
};

const defaultParams = {
  ...stripState(CONTENT),
  focusTarget: 'tag',
  beforeState: 'covered',
  beforeValue: 'Claim covered as per supplied data',
  afterValue: 'Scope disputed (as supplied)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Reading stand · claim connected as supplied', marker: 'Supplied status changed'},
  actionProgress: 1,
};
const defaultParamsEs = {
  ...stripState(CONTENT_ES),
  beforeValue: 'Reclamación cubierta según los datos aportados',
  afterValue: 'Alcance discutido (según lo aportado)',
  contextLabels: {context: 'Atril · reclamación conectada según lo aportado', marker: 'Estado aportado cambiado'},
};
function stripState(o) { const {stateLabels, ...rest} = o; void stateLabels; return rest; }

const isStress = p => [...p.clauses, p.claim.label, p.contract.title, p.beforeValue, p.afterValue, p.clauseTitle].some(t => t.length > 48);

/* ---------------------------------------------------------------------- */
/* Layout                                                                  */
/* ---------------------------------------------------------------------- */

function geom(ctx, F, minF, placementPref) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 28;
  const pi = promiseIndex(p);
  const prong = 50;
  const after = p.beforeState === 'covered' ? 'disputed' : 'covered';
  // the stand fills the frame; the detail lens opens OVER the stand, away from its source
  const stand = {x: m, y: m, w: D.w - 2 * m, h: D.h - 2 * m};
  const fr = 16;
  const ledgeH = 22;
  const lupaDim = {lw: clamp(Math.min(stand.w, stand.h) * 0.2, 130, 200), lh: 0, hl: 0};
  lupaDim.lh = lupaDim.lw * 0.62; lupaDim.hl = lupaDim.lw * 0.62;
  const shelfH = lupaDim.lh + 28;
  const board = {x: stand.x, y: stand.y, w: stand.w, h: stand.h - shelfH - ledgeH};
  const inner = {x: board.x + fr, y: board.y + fr, w: board.w - 2 * fr, h: board.h - 2 * fr};
  // the tag (value text sized for the longer value; the "was" line below)
  const tagW = clamp(inner.w * (shape === 'portrait' ? 0.44 : 0.27), 240, 380);
  const gR = F * 0.42;
  const vMax = tagW - 44 - gR * 2 - 12;
  const valFits = {before: fitG(p.beforeValue, {maxWidth: vMax, size: F, minSize: minF, maxLines: stress ? 5 : 4, weight: 700}), after: fitG(p.afterValue, {maxWidth: vMax, size: F, minSize: minF, maxLines: stress ? 5 : 4, weight: 700})};
  const wasFit = fitG(`${ctx.t.was}: ${p.beforeValue}`, {maxWidth: tagW - 44, size: Math.max(minF, F * 0.85), minSize: minF, maxLines: stress ? 5 : 4, weight: 500});
  if (valFits.before.bad || valFits.after.bad || wasFit.bad) why.push('tag-text');
  const valH = Math.max(valFits.before.height, valFits.after.height);
  const tagH = 34 + valH + 14 + wasFit.height + 24;
  // the sheet on the left, the column (slip + tag + notes) on its right
  const slipW = clamp(inner.w * (shape === 'portrait' ? 0.42 : 0.24), 220, 340);
  const colW = Math.max(slipW, tagW) + 16;
  const sheetW = Math.min(inner.w - (prong + 14) - colW - 8, inner.w * (shape === 'portrait' ? 0.6 : 0.56));
  const used = sheetW + prong + 14 + colW;
  const x0 = inner.x + Math.max(6, (inner.w - used) / 2);
  const S = sheetText(p, sheetW, F, minF, {stress});
  const sheet = {x: x0, y: inner.y + 8, w: sheetW, h: inner.h - 16};
  if (S.need > sheet.h) why.push('sheet-text');
  const rows = placeRows(S, sheet.h, F);
  const row = rows[pi];
  const sock = {x: sheet.x + sheet.w, y: sheet.y + row.y + row.h / 2};
  const TT = slipText(ctx, p, slipW, F, minF, stress, F * 4.2);
  if (TT.bad) why.push('slip-text');
  const tip = {x: sock.x + 4, y: sock.y};
  const sb = slipBox(TT, 'left', prong);
  const dockBox = {x: tip.x + sb.x, y: tip.y + sb.y, w: sb.w, h: sb.h};
  if (dockBox.y < inner.y - 2 || dockBox.y + dockBox.h > inner.y + inner.h + 2) why.push('slip-off-board');
  const colX = dockBox.x;
  // the tag hangs from the slip: below it if there is room, else above it
  const tagX = colX + Math.max(0, (colW - 16 - tagW) / 2);
  let tag = {x: tagX, y: dockBox.y + dockBox.h + 30, w: tagW, h: tagH, hang: 'below'};
  if (tag.y + tag.h > inner.y + inner.h + 4) tag = {x: tagX, y: dockBox.y - 30 - tagH, w: tagW, h: tagH, hang: 'above'};
  if (tag.y < inner.y + 4) why.push('tag-does-not-fit');
  // the scope outline round the promise row and the docked slip
  const rl = sheet.x + S.padX - 22, rt = sheet.y + row.y - 12, rb = sheet.y + row.y + row.h + 12;
  const sx = sock.x + 8, pad = 14;
  const P = [{x: rl, y: rb}, {x: rl, y: rt}, {x: sx, y: rt}, {x: sx, y: dockBox.y - pad}, {x: dockBox.x + dockBox.w + pad, y: dockBox.y - pad},
    {x: dockBox.x + dockBox.w + pad, y: dockBox.y + dockBox.h + pad}, {x: sx, y: dockBox.y + dockBox.h + pad}, {x: sx, y: rb}];
  const loop = roundedLoop(P, 16);
  // lens source: the socket, the docked slip, the tag below/above it and the outline round them (supplied texts wholly inside)
  const sx0 = Math.min(sock.x - 34, tag.x - 18), sx1 = Math.max(dockBox.x + dockBox.w + pad + 10, tag.x + tag.w + 18);
  const sy0 = Math.min(dockBox.y - pad - 12, tag.y - 14), sy1 = Math.max(dockBox.y + dockBox.h + pad + 12, tag.y + tag.h + 14);
  let src = {x: sx0, y: sy0, w: sx1 - sx0, h: sy1 - sy0};
  if (shape === 'portrait') {
    // tall frames: the tag and the outline's edge next to it (the lens then spans the frame width)
    const edgeY = tag.hang === 'below' ? dockBox.y + dockBox.h + pad : dockBox.y - pad;
    src = tag.hang === 'below'
      ? {x: tag.x - 18, y: edgeY - 16, w: tag.w + 36, h: tag.y + tag.h + 14 - (edgeY - 16)}
      : {x: tag.x - 18, y: tag.y - 14, w: tag.w + 36, h: edgeY + 16 - (tag.y - 14)};
  }
  // lens destination: over the stand, clear of the source (and of the slip it hangs from)
  const keep = {x: src.x - 20, y: src.y - 20, w: src.w + 40, h: src.h + 40};
  const regions = [
    {k: 'left', x: m, y: m, w: keep.x - m, h: D.h - 2 * m},
    {k: 'top', x: m, y: m, w: D.w - 2 * m, h: keep.y - m},
    {k: 'bottom', x: m, y: keep.y + keep.h, w: D.w - 2 * m, h: D.h - m - (keep.y + keep.h)},
  ].filter(rg => rg.w > 100 && rg.h > 100);
  let best = null;
  for (const rg of regions) {
    const z = Math.min(p.detailGeometry.zoom, (rg.w - 10) / src.w, (rg.h - 10) / src.h, (rg.k === 'left' ? D.w * 0.55 : D.w) / src.w, (rg.k === 'left' ? D.h : D.h * 0.55) / src.h);
    const smaller = Math.min(src.w * z, src.h * z);
    if (!best || (placementPref && rg.k === placementPref && z >= 1.5) || z > best.z + 0.05) best = {rg, z, smaller};
  }
  const zoom = best ? best.z : 1;
  if (zoom < 1.5) why.push('zoom-too-small');
  const rg = best ? best.rg : {x: m, y: m, w: 100, h: 100};
  const dest = {w: src.w * zoom, h: src.h * zoom};
  dest.x = rg.x + (rg.w - dest.w) / 2;
  dest.y = rg.y + (rg.h - dest.h) / 2;
  // reading lens: rests on the shelf below the board, then over the tag
  const shelfY = board.y + board.h + ledgeH;
  const lensRest = {centre: {x: stand.x + 26 + lupaDim.lh * 0.3 + lupaDim.hl + lupaDim.lw / 2, y: shelfY + shelfH / 2 - 6}, a: 0};
  const lensRead = {centre: {x: tag.x + tag.w / 2, y: tag.y + tag.h / 2}, a: -25};
  // the stand plate on the shelf; the marker beside the tag; the marker label and key in the column's free space
  const plateFit = show && p.contextLabels.context ? fitG(p.contextLabels.context, {maxWidth: stand.w - lupaDim.lw - lupaDim.hl - 100, size: Math.max(minF, F * 0.9), minSize: minF, maxLines: 2, weight: 700}) : null;
  if (plateFit && plateFit.bad) why.push('plate-text');
  const markerR = Math.max(18, F * 0.7);
  const markerAt = {x: tag.x + tag.w + markerR + 8, y: tag.y + 28};
  if (markerAt.x + markerR > inner.x + inner.w - 2) markerAt.x = tag.x - markerR - 8;
  const notes = [];
  if (show && p.contextLabels.marker) notes.push({name: 'mlabel', text: p.contextLabels.marker, kind: 'marker'});
  if (showKey) notes.push({name: 'key', text: ctx.t.key, kind: 'key'});
  const top0 = Math.min(dockBox.y, tag.y), bot0 = Math.max(dockBox.y + dockBox.h, tag.y + tag.h);
  const colRegions = [
    {x: colX - 6, w: inner.x + inner.w - colX - 2, top: bot0 + 22, bottom: inner.y + inner.h - 6},
    {x: colX - 6, w: inner.x + inner.w - colX - 2, top: inner.y + 6, bottom: top0 - 22},
  ];
  const placed = [];
  const usedR = colRegions.map(q => ({...q, y: q.top}));
  for (const q of notes) {
    let ok = false;
    for (const cr of usedR) {
      if (cr.w < 180) continue;
      const c = chipG(ctx, q.text, {x: cr.x, y: cr.y, maxWidth: cr.w, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, opacity: 0, fill: q.kind === 'marker' ? ctx.theme.accent2Soft : ctx.theme.card});
      if (c.bad || cr.y + c.box.h > cr.bottom) continue;
      placed.push({q, c}); cr.y += c.box.h + 12; ok = true; break;
    }
    if (!ok) why.push(`note-${q.name}`);
  }
  return {
    ok: !why.length, why, F, minF, after, stand, board, inner, fr, ledgeH, shelfH, shelfY, lupaDim, tag, tagW, valFits, wasFit, gR,
    sheet, S, rows, pi, sock, TT, tip, prong, dockBox, loop, src, dest, zoom, lensPlace: best ? best.rg.k : null, lensRest, lensRead, plateFit, markerR, markerAt, placed, stress,
  };
}

/* ---------------------------------------------------------------------- */
/* Art                                                                     */
/* ---------------------------------------------------------------------- */

/** The scope tag (luggage-tag shape). prefix distinguishes the context and lens copies. */
function scopeTag(ctx, L, prefix, show) {
  const {tag} = L;
  const p = ctx.params;
  const bs = p.beforeState, as = L.after;
  const notch = 22;
  const d = `M${r(tag.x + notch)} ${r(tag.y)}H${r(tag.x + tag.w - 12)}Q${r(tag.x + tag.w)} ${r(tag.y)} ${r(tag.x + tag.w)} ${r(tag.y + 12)}V${r(tag.y + tag.h - 12)}Q${r(tag.x + tag.w)} ${r(tag.y + tag.h)} ${r(tag.x + tag.w - 12)} ${r(tag.y + tag.h)}H${r(tag.x + notch)}L${r(tag.x)} ${r(tag.y + tag.h - notch)}V${r(tag.y + notch)}Z`;
  const vy = tag.y + 34;
  const gx = tag.x + 22 + L.gR, gy = vy + L.F * 0.45;
  const tx = tag.x + 22 + L.gR * 2 + 12;
  const wy = vy + Math.max(L.valFits.before.height, L.valFits.after.height) + 14;
  return g(null,
    h('path', {d, transform: 'translate(6 8)', fill: ctx.theme.shadow}),
    h('path', {d, fill: '#f3ead2', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(tag.x + notch * 0.9), cy: r(tag.hang === 'below' ? tag.y + notch * 0.9 : tag.y + tag.h - notch * 0.9), r: 7, fill: '#fff', stroke: INK, 'stroke-width': 2}),
    // before value (glyph + text), after value, "was" line — each named for the frame
    g({name: `${prefix}before`}, stateGlyph(ctx, bs, gx, gy, L.gR), show ? txt(L.valFits.before, {x: tx, y: vy, fill: INK}) : h('path', {d: `M${r(tx)} ${r(gy)}h${r(Math.min(L.tagW - 100, 180))}`, stroke: '#cbbd9c', 'stroke-width': 10, 'stroke-linecap': 'round'})),
    g({name: `${prefix}after`, opacity: 0}, stateGlyph(ctx, as, gx, gy, L.gR), show ? txt(L.valFits.after, {x: tx, y: vy, fill: INK}) : h('path', {d: `M${r(tx)} ${r(gy)}h${r(Math.min(L.tagW - 140, 140))}`, stroke: '#cbbd9c', 'stroke-width': 10, 'stroke-linecap': 'round'})),
    g({name: `${prefix}was`, opacity: 0}, show ? txt(L.wasFit, {x: tag.x + 22, y: wy, fill: '#5b4d36'}) : h('path', {d: `M${r(tag.x + 22)} ${r(wy + 10)}h${r(Math.min(L.tagW - 80, 160))}`, stroke: '#ddd0b2', 'stroke-width': 7, 'stroke-linecap': 'round'})),
  );
}

function outlineCopies(ctx, L, prefix) {
  const bs = ctx.params.beforeState;
  const solid = h('path', {d: L.loop.d + 'Z', fill: 'none', stroke: SCOPE, 'stroke-width': 6, 'stroke-linejoin': 'round'});
  const dashed = h('path', {d: L.loop.d + 'Z', fill: 'none', stroke: SCOPE, 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-dasharray': '20 13'});
  const halo = h('path', {d: L.loop.d + 'Z', fill: 'none', stroke: '#ffffff', 'stroke-width': 13, opacity: 0.85, 'stroke-linejoin': 'round'});
  return g(null, halo,
    g({name: `${prefix}lineBefore`}, bs === 'covered' ? solid : dashed),
    g({name: `${prefix}lineAfter`, opacity: 0}, bs === 'covered' ? dashed : solid));
}

/** The cord from the slip to the tag's hole. */
function cord(L) {
  const {tag, dockBox} = L;
  const hx = tag.x + 22 * 0.9, hy = tag.hang === 'below' ? tag.y + 22 * 0.9 : tag.y + tag.h - 22 * 0.9;
  const ax = dockBox.x + dockBox.w * 0.5, ay = tag.hang === 'below' ? dockBox.y + dockBox.h - 6 : dockBox.y + 6;
  return h('path', {d: `M${r(ax)} ${r(ay)}Q${r((ax + hx) / 2 - 20)} ${r((ay + hy) / 2)} ${r(hx)} ${r(hy)}`, fill: 'none', stroke: '#7a5a3a', 'stroke-width': 3});
}

const scene = {
  sizes: {landscape: [1800, 790], square: [1240, 960], portrait: [900, 1290]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const shape = ctx.view.shape;
    const pref = p.detailGeometry.placement === 'auto' ? null : p.detailGeometry.placement === 'right' ? 'left' : 'bottom';
    let L = null;
    for (const fpx of stress ? [23, 21, 19.5, 18, 17] : [28, 26.5, 25, 23, 21.5, 20.5]) {
      L = geom(ctx, fpx / upx, minF, pref);
      if (L.ok) break;
    }
    void shape;
    L.upx = upx;
    L.lensF = lensFrame(ctx, {name: 'lens', source: L.src, dest: L.dest, content: null, color: ctx.theme.accent2}).frame;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const {board, inner, stand} = L;
    const wood = '#a0703f';
    const standNode = g(null,
      // post and feet
      h('rect', {x: r(stand.x + stand.w / 2 - 14), y: r(board.y + board.h), width: 28, height: r(stand.y + stand.h - board.y - board.h), fill: shade(wood, -0.15), stroke: INK, 'stroke-width': 2.4}),
      h('rect', {x: r(board.x + 8), y: r(board.y + 12), width: r(board.w), height: r(board.h), rx: 14, fill: th.shadow}),
      h('rect', {x: r(board.x), y: r(board.y), width: r(board.w), height: r(board.h), rx: 14, fill: wood, stroke: INK, 'stroke-width': 2.8}),
      h('rect', {x: r(inner.x), y: r(inner.y), width: r(inner.w), height: r(inner.h), rx: 8, fill: '#c9a273', stroke: shade(wood, -0.25), 'stroke-width': 2}),
      // ledge (the reading lens rests on the shelf below it)
      h('rect', {x: r(board.x - 6), y: r(board.y + board.h), width: r(board.w + 12), height: r(L.ledgeH), rx: 5, fill: shade(wood, -0.2), stroke: INK, 'stroke-width': 2.4}),
      h('rect', {x: r(stand.x), y: r(L.shelfY + L.shelfH - 12), width: r(stand.w), height: 12, rx: 5, fill: shade(wood, -0.1), stroke: INK, 'stroke-width': 2.2}),
    );
    const plate = L.plateFit ? (() => {
      const w = L.plateFit.width + 30, hh = L.plateFit.height + 12;
      const x = stand.x + stand.w - w - 10, y = L.shelfY + (L.shelfH - 12 - hh) / 2;
      return g(null, h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 6, fill: '#e8d6a8', stroke: INK, 'stroke-width': 1.8}), txt(L.plateFit, {x: x + 15, y: y + 6, fill: INK}));
    })() : null;
    const sheetNode = g({transform: T(L.sheet.x, L.sheet.y)}, contractSheet(ctx, {prefix: 'c-', w: L.sheet.w, h: L.sheet.h, S: L.S, rows: L.rows, showText: show, promise: L.pi, railD: `M${r(L.S.padX + L.S.rowW)} ${r(L.rows[L.pi].y + L.rows[L.pi].h / 2)}H${r(L.sheet.w - 6)}`}));
    const sock = g({transform: T(L.sock.x, L.sock.y)}, socketArt(ctx, 'sock', 'right', 1));
    const slip = g({transform: T(L.tip.x, L.tip.y)}, claimSlip(ctx, {name: 'slip', T: L.TT, side: 'left', prong: L.prong, showText: show}));
    const ctxTag = scopeTag(ctx, L, 'c-', show);
    // lens content: a real copy of the tag and the outline at the same coordinates
    const content = g(null,
      h('rect', {x: r(L.src.x - 40), y: r(L.src.y - 40), width: r(L.src.w + 80), height: r(L.src.h + 80), fill: '#c9a273'}),
      h('rect', {x: r(L.sheet.x + L.sheet.w - 60), y: r(L.src.y - 40), width: 60, height: r(L.src.h + 80), fill: '#fffdf7'}),
      outlineCopies(ctx, L, 'L-'),
      g({transform: T(L.sock.x, L.sock.y)}, socketArt(ctx, undefined, 'right', 1)),
      g({transform: T(L.tip.x, L.tip.y)}, g({name: 'L-slipcopy', opacity: 0}, claimSlip(ctx, {name: undefined, T: L.TT, side: 'left', prong: L.prong, showText: show}))),
      cord(L),
      scopeTag(ctx, L, 'L-', show),
    );
    const lz = lensFrame(ctx, {name: 'lens', source: L.src, dest: L.dest, content, color: th.accent2});
    const lupa = readingLens(ctx, {name: 'lupa', ...L.lupaDim});
    const marker = changedMarker(ctx, {name: 'marker', x: L.markerAt.x, y: L.markerAt.y, radius: L.markerR, opacity: 0});
    const notes = L.placed.map(pl => pl.c.node);
    return g({name: 'scene'},
      standNode, plate,
      sheetNode, sock, slip,
      g({name: 'ctxOutline'}, outlineCopies(ctx, L, 'c-')),
      cord(L),
      g({name: 'ctxTag'}, ctxTag),
      marker,
      g({name: 'lz-wrap', 'data-occludes': 1}, lz.node),
      lupa,
      notes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(W.lupaIn[0], W.label[1], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const E = ease.inOutCubic;
    // reading lens
    const inQ = ease.inOutSine(seg(a, ...W.lupaIn)), outQ = ease.inOutSine(seg(a, ...W.lupaOut));
    const C = outQ > 0 ? mix(L.lensRead.centre, L.lensRest.centre, outQ) : mix(L.lensRest.centre, L.lensRead.centre, inQ);
    const A = outQ > 0 ? lerp(L.lensRead.a, L.lensRest.a, outQ) : lerp(L.lensRest.a, L.lensRead.a, inQ);
    const d = L.lupaDim.hl + L.lupaDim.lw / 2;
    const grip = {x: C.x - Math.cos((A * Math.PI) / 180) * d, y: C.y - Math.sin((A * Math.PI) / 180) * d};
    nodes.lupa = {transform: T(r(grip.x, 2), r(grip.y, 2), r(A, 2))};
    // detail lens
    const oq = E(seg(a, ...W.open)), cq = E(seg(a, ...W.close));
    const open = cq > 0 ? 1 - cq : oq;
    Object.assign(nodes, L.lensF(open));
    // the datum: substitution happens inside the lens
    const lift = seg(a, ...W.lift), wasQ = seg(a, ...W.was), aftQ = seg(a, ...W.after);
    const substituted = aftQ > 0;
    const copyO = open < 0.4 ? 0 : clamp((open - 0.4) / 0.4); // the lens copy grows legible from 40 % open
    nodes['L-before'] = {opacity: r((1 - lift) * copyO, 3), transform: T(0, r(-26 * ease.outCubic(lift), 2))};
    nodes['L-after'] = {opacity: r(aftQ * copyO, 3), transform: T(0, r(-14 * (1 - ease.outCubic(aftQ)), 2))};
    nodes['L-was'] = {opacity: r(wasQ * copyO, 3)};
    nodes['L-slipcopy'] = {opacity: r(copyO, 3)};
    // context copy: blanked while the lens shows the datum (one legible place at a time); it swaps while hidden
    const ctxVis = 1 - clamp(open / 0.3);
    const changed = aftQ >= 1;
    nodes['c-before'] = {opacity: r(changed ? 0 : ctxVis, 3)};
    nodes['c-after'] = {opacity: r(changed ? ctxVis : 0, 3)};
    nodes['c-was'] = {opacity: r(changed ? ctxVis : 0, 3)};
    // dependent geometry: the outline edge (solid → dashed or back)
    const eq = seg(a, ...W.edge);
    const outO = clamp(1 - eq * 2), inO = clamp(eq * 2 - 1);
    nodes['L-lineBefore'] = {opacity: r(outO, 3)};
    nodes['L-lineAfter'] = {opacity: r(inO, 3)};
    nodes['c-lineBefore'] = {opacity: r(outO, 3)};
    nodes['c-lineAfter'] = {opacity: r(inO, 3)};
    nodes.marker = {opacity: r(done ? seg(u, ...W.marker) : 0, 3)};
    for (const pl of L.placed) nodes[pl.q.name] = {opacity: r(done ? seg(u, ...(pl.q.kind === 'key' ? W.key : W.label)) : 0, 3)};
    const contextDatum = Math.max(+nodes['c-before'].opacity, +nodes['c-after'].opacity);
    const copyShown = r(copyO * Math.max(1 - lift, aftQ), 3);
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        beat, value: substituted && aftQ >= 1 ? 'after' : substituted ? 'changing' : 'before', lensOpen: r(open, 3), copyShown, contextDatum: r(contextDatum, 3),
        zoom: r(L.zoom, 3), lupaGrip: {x: r(grip.x), y: r(grip.y)}, lensCentre: {x: r(C.x), y: r(C.y)}, lupaParked: outQ >= 1 || inQ === 0,
        outline: inO >= 1 ? L.after : eq > 0 ? 'changing' : p.beforeState, markerShown: r(+nodes.marker.opacity, 3), keyShown: nodes.key ? r(+nodes.key.opacity, 3) : 0,
        wasShown: r(Math.max(wasQ * copyO, +nodes['c-was'].opacity), 3), lensPlace: L.lensPlace,
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why, actionCapped: p.actionProgress < 1 && u > capU,
        lupaBox: (() => { const c = L.lensRest.centre; return {x: r(c.x - L.lupaDim.lw / 2 - L.lupaDim.hl - 14), y: r(c.y - L.lupaDim.lh / 2 - 8), w: r(L.lupaDim.lw + L.lupaDim.hl + 28), h: r(L.lupaDim.lh + 16)}; })(),
        tagBox: {x: r(L.tag.x), y: r(L.tag.y), w: r(L.tag.w), h: r(L.tag.h)},
      },
    };
  },
};

function mix(P, Q, t) { return {x: lerp(P.x, Q.x, t), y: lerp(P.y, Q.y, t)}; }

/** The bottom (or top) edge of the slip, copied into the lens so the cord has its anchor. */
function slipBottomCopy(ctx, L) {
  const b = L.dockBox;
  return h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: '#fffaf3', stroke: INK, 'stroke-width': 2.6});
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-07-inspect',
    title: 'Indemnity clause, without doctrine — on a reading stand a lens isolates the scope tag of a connected claim and one supplied status is substituted',
    titleEs: 'Cláusula de indemnidad — Inspección de detalle y sustitución',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de indemnidad',
    treatment: 'inspect',
    family: 'detail-lens',
    description: 'On a wooden reading stand, the contract "CT-412 · Supply contract (fictional)" shows the heading "Indemnity clause" and its supplied lines; the claim slip is plugged into the socket of the supplied promise line and a scope tag hangs from it, printed with the supplied status (● "Claim covered as per supplied data"); the scope outline is drawn solid. A reading lens slides over the tag and a detail lens opens beside the stand (a real enlargement, the context copy blanked in step). In the lens the before-value lifts away and stays traceable as "was: …", the after-value (◆ "Scope disputed (as supplied)") drops in, and only the outline edge follows (solid → dashed). The lens closes, the reading lens returns to its shelf and the changed-datum marker appears beside the tag. Seeking back restores the before-value. No indemnity doctrine.',
    tags: ['indemnity clause', 'claim', 'promise of cover', 'inspect', 'detail lens', 'substitution', 'scope tag', 'reading stand', 'reading lens', 'changed marker', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-indemnidad.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
