/**
 * LAW-0688 — Prueba contrafactual causal · inspect
 *
 * Storyboard (the model set up for its replay; one detail lens):
 *  0.00–0.20 build       The context: the model as supplied, ready to be run
 *                        again — tiles standing in the supplied order, the vase
 *                        on its plinth, the tethered pendulum, the claw parked
 *                        over the SELECTED event — with the event legend, the
 *                        context caption and a record card "Selected event ·
 *                        status in the model: <before value>".
 *  0.20–0.45 isolate     A lens opens beside the slot of the selected event —
 *                        a real enlarged copy of the stage drawn in the same
 *                        coordinates and posed from the context every frame —
 *                        while the rest dims. The copy fades in only once the
 *                        lens has left its source (no double image, no long
 *                        blank card). Under the lens: "Before: <before value>".
 *  0.45–0.75 substitute  The before value is struck (every line). Only then the
 *                        dependent geometry changes, in the scene and so in the
 *                        lens: the claw lowers, grips the selected tile and
 *                        lifts it out of the model, leaving a dashed outline in
 *                        the slot (substitution "remove"; "restore" lowers the
 *                        lifted tile back into its slot). The after value
 *                        appears and stays still; the record card in the
 *                        context turns over (old value kept, struck).
 *  0.75–1.00 return      The lens closes back onto its source; the context
 *                        keeps the changed slot, a neutral Δ marker with its
 *                        label, the record card with the old value struck and
 *                        the key "As supplied · no conclusion drawn". Nothing
 *                        is run, inferred or decided. Seeking back restores the
 *                        old datum exactly.
 * Wide boxes: stage left, legend column right. Square/tall: stage over the
 * legend. The lens takes the side (right, left, below, above) that allows the
 * largest magnification, never less than 1.5×.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0688
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {inspectFields, oneOf} from '../../schemas/fields.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {placeChip, unionBounds} from './kits/place.js';
import {
  cfFields, CF_STRINGS, resolveModel, cfStage, stageGeom, stageMetrics, fitGeomH,
  chipG, balancedG, legend, legendFrame, calloutG, clampNote,
} from './kits/prueba-contrafactual.js';

const ID = 'LAW-0688';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  legend: [0.02, 0.12], caption: [0.0, 0.08], record: [0.06, 0.14],
  camIn: [0.17, 0.225], open: [0.225, 0.3], before: [0.3, 0.35],
  strike: [0.45, 0.49],
  drop: [0.49, 0.535], grip: [0.535, 0.55], lift: [0.55, 0.605], slot: [0.58, 0.61],
  after: [0.6, 0.63],
  close: [0.76, 0.82], camOut: [0.82, 0.87], marker: [0.84, 0.88], markerLabel: [0.85, 0.89], key: [0.85, 0.89],
};
const DIM = 0.6;

const sceneSchema = {
  ...cfFields,
  ...inspectFields(['event-status']),
  substitution: oneOf('Geometry of the substituted datum: remove = the selected event is taken out of the model; restore = it is put back into its slot', ['remove', 'restore']),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+1 min'},
    {label: 'Display stand shakes', time: 'T+2 min'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  selectedEvent: 1,
  focusTarget: 'event-status',
  substitution: 'remove',
  beforeValue: 'Event present',
  afterValue: 'Event removed from the model',
  detailGeometry: {zoom: 3, placement: 'auto'},
  contextLabels: {context: 'Model as supplied by Party A, set up to be run again', marker: 'Datum changed'},
};

const SHAPES = {
  landscape: {mode: 'side', size: 28, baseMin: 24, minSize: 20, maxH: 345, legendW: 0.3},
  square: {mode: 'below', size: 31, baseMin: 29.4, minSize: 24.5, maxH: 300, cols: 2},
  portrait: {mode: 'below', size: 30, baseMin: 20.5, minSize: 17.5, maxH: 300, cols: 1},
};
const MARGIN = 24;
// the lens: at least 2.5× and at least ~36 % of the frame's short side wide
const Z_MIN = 2.5;
const LENS_FRAC = 0.36;

function compose(ctx, base, H0, size, cfg = {}) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M, SH, lossCount, remove} = base;
  const H = Math.max(100, H0);
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const side = SH.mode === 'side';
  const geom = stageGeom(M.n, H, lossCount, M.gap, cfg.wrapM ?? null);
  const stageW = geom.width;
  const full = D.w - 2 * MARGIN;
  // the stage's floor and gantry span a region at least half the box wide (the context never becomes a thumbnail)
  const regionW = side ? D.w * (1 - cfg.legendW) - MARGIN - 40 : full;
  if (regionW < stageW) return {ext: {h: 1e9, w: 1e9}};
  const stageX = side || (!keyOn && ctx.view.shape === 'square') ? MARGIN : (D.w - stageW) / 2;
  // (labels hidden, square/tall boxes: the floor spans just over half the box, so the rest framing can enlarge it)
  const spanW = !keyOn && !side ? Math.max(stageW, 0.56 * full) : full;
  const span = side ? [MARGIN, MARGIN + regionW] : !keyOn && ctx.view.shape === 'square' ? [MARGIN, MARGIN + spanW] : [MARGIN + (full - spanW) / 2, MARGIN + (full + spanW) / 2];
  const colX = side ? MARGIN + regionW + 40 : MARGIN;
  const colW = side ? D.w - colX - MARGIN : full;
  const k = M.k;

  // ---- context caption
  let y = 0;
  const cap = allOn ? chipG(ctx, `${t.context}: ${p.contextLabels.context}`, {x: span[0], y: 0, maxWidth: regionW, size, maxLines: 2, name: 'ctx-caption', fill: th.accent2Soft, stroke: th.accent2, opacity: 0}) : null;
  if (cap) y = cap.box.h + 16;
  const F = y + geom.above;
  const stageBottom = F + geom.below;

  // record card: "<selected event> · status in the model:" then the before value (struck later) and the after value
  const mkRecord = (x0, y0, rw) => {
    const head = chipG(ctx, `${t.selected} ${k + 1} · ${t.status}`, {x: x0, y: y0, maxWidth: rw, size, maxLines: 3, fill: th.card, stroke: th.inkSoft});
    const vy = y0 + head.box.h + 8;
    // narrow columns: old and new values stacked instead of side by side
    const stack = rw < size * 16;
    const oldC = chipG(ctx, p.beforeValue, {x: x0, y: vy, maxWidth: stack ? rw : rw * 0.48, size, maxLines: 6, name: 'rec-old', fill: th.card, stroke: th.inkSoft});
    const newC = stack
      ? chipG(ctx, p.afterValue, {x: x0, y: oldC.box.y + oldC.box.h + 8, maxWidth: rw, size, maxLines: 6, name: 'rec-new', fill: th.accent2Soft, stroke: th.accent2, opacity: 0})
      : chipG(ctx, p.afterValue, {x: x0 + oldC.box.w + 18, y: vy, maxWidth: rw - oldC.box.w - 18, size, maxLines: 6, name: 'rec-new', fill: th.accent2Soft, stroke: th.accent2, opacity: 0});
    const strikes = oldC.fit.lines.map((ln, i) => {
      const lw = ctx.measure(ln.replace(/\u00a0/g, ' '), oldC.fit.size, 600, 'sans');
      const yy = vy + size * 0.38 + i * oldC.fit.lineHeight + oldC.fit.size * 0.5;
      return h('line', {name: `rec-strike${i}`, x1: r(oldC.box.cx - lw / 2 - 4), x2: r(oldC.box.cx + lw / 2 + 4), y1: r(yy), y2: r(yy), stroke: th.ink, 'stroke-width': 3, 'stroke-dasharray': `${r(lw + 8)} ${r(lw + 20)}`, 'stroke-dashoffset': r(lw + 8)});
    });
    const box = unionBounds([head.box, oldC.box, newC.box]);
    const key = chipG(ctx, t.key, {x: x0, y: box.y + box.h + 14, maxWidth: rw, size, maxLines: 3, name: 'key', stroke: th.inkSoft, opacity: 0});
    return {node: g({name: 'record', opacity: 0}, head.node, oldC.node, g(null, strikes), newC.node), strikeLens: oldC.fit.lines.map(ln => ctx.measure(ln.replace(/\u00a0/g, ' '), oldC.fit.size, 600, 'sans') + 8), box, key, h: key.box.y + key.box.h - y0};
  };
  // ---- lens: the selected tile, its slot, its neighbours (whole) and the claw's working space above it, so
  // the whole removal (grip, lift, dashed slot) stays inside the magnified region
  const lensPad = Math.round(0.12 * H);
  // lens estimate (the crop: tiles k−1..k+1 and the claw's working space; the lens is >= 2.5× that)
  const mS = stageMetrics(M.n, H, lossCount, M.gap);
  const srcWe = mS.w + 2 * mS.spacing + 2 * lensPad + 0.25 * H, srcHe = 2.19 * H + 30;
  const lwE = Z_MIN * srcWe, lhE = Z_MIN * srcHe;
  const srcRightE = stageX + mS.pz + (k + 1) * mS.spacing + mS.w + lensPad + 0.12 * H;
  const annProbe = (mw) => (keyOn ? [p.beforeValue, p.afterValue].map((tx, i) => chipG(ctx, `${i ? t.after : t.before}: ${tx}`, {x: 0, y: 0, maxWidth: mw, size, maxLines: 5})) : []);
  const annHOf = pr => (pr.length ? pr[0].box.h + pr[1].box.h + 12 : 0);
  const annWOf = pr => (pr.length ? Math.max(pr[0].box.w, pr[1].box.w) : 0);
  // ---- legend + record card
  const items = [];
  if (keyOn) {
    M.events.forEach((e, i) => items.push({key: `ev${i}`, kind: 'event', i, text: `${i + 1}. ${e.label}${e.time ? ` · ${e.time}` : ''}`}));
    p.losses.forEach((l, j) => items.push({key: `loss${j}`, kind: 'loss', text: `${t.lossAs}: ${l.label}`}));
    M.alternatives.forEach((a, j) => items.push({key: `alt${j}`, kind: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`}));
    M.links.forEach(l => {
      const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputedLink : null, l.label || null].filter(Boolean);
      if (bits.length) items.push({key: `lk${l.from}`, kind: 'link', dim: l.status === 'disputed', text: `${t.link} ${l.from + 1} → ${l.from + 1 < M.n ? l.from + 2 : t.lossAs}: ${bits.join(' · ')}`});
    });
    const cn = clampNote(ctx, p, M);
    if (cn) items.push({key: 'clamp', kind: 'note', text: cn});
  }
  const cols = side ? (cfg.cols ?? 1) : (items.length >= 5 ? (cfg.cols ?? SH.cols) : 1);
  // the legend and the record card: right column, or under the stage (they step aside while the lens is open)
  const lgY = side ? 0 : stageBottom + 24;
  // the record card stays visible through the whole inspection: under the stage (wide boxes: left of where the lens
  // opens), or beside the lens (tall/square boxes: it is laid out at that width)
  const recW = side ? Math.min(regionW, D.w - MARGIN - lwE - 24 - MARGIN) : Math.max(size * 9, Math.min(full - lwE - 24, full * 0.5));
  if (keyOn && recW < size * 9) return {ext: {h: 1e9, w: 1e9}};
  const square = ctx.view.shape === 'square';
  if (side ? lhE > D.h - 20 || D.w - MARGIN - Math.max(srcRightE, MARGIN + (keyOn ? recW : 0)) - 24 < lwE : square ? lhE > D.h - 20 : stageBottom + 40 + lhE > D.h - 10) return {ext: {h: 1e9, w: 1e9}};
  // (tall boxes: the room under the stage is kept for the lens)
  const reserveH = !side && !square ? stageBottom + 40 + lhE : square ? D.h - 20 : 0;
  const lg = items.length ? legend(ctx, items, {x: colX, y: lgY, w: colW, cols, size, minSize: size, maxLines: cfg.maxLines ?? 3, iconS: size * 1.45, prefix: 'lg', gap: cfg.gap ?? 12, icons: cfg.icons, padY: cfg.padY}) : {rows: [], h: 0};
  // (a legend item must never be cut: such a composition is rejected)
  const lgTrunc = lg.rows.some((rw, i) => chipG(ctx, items[i].text, {x: 0, y: 0, maxWidth: rw.chip.w + 2, size, minSize: size, maxLines: cfg.maxLines ?? 3}).fit.truncated);
  if (lgTrunc) return {ext: {h: 1e9, w: 1e9}};
  const ny = side ? stageBottom + 22 : (lg.h ? lgY + lg.h + 20 : lgY);
  const record = keyOn ? mkRecord(MARGIN, ny, recW) : null;
  const key = record ? record.key : null;
  const textBottom = Math.max(record ? ny + record.h : ny, lg.h ? lgY + lg.h : 0);

  if (cfg.dry) return {ext: {h: Math.max(stageBottom, textBottom, reserveH), w: full}};

  const stage = cfStage(ctx, {prefix: 'st', x: stageX, floorY: F, H, M, lossCount, span, take: {start: 0.05, strike: 0.2}});
  const copy = cfStage(ctx, {prefix: 'lzs', x: stageX, floorY: F, H, M, lossCount, span, take: {start: 0.05, strike: 0.2}});
  const tl = stage.tiles;
  const sW2 = stage.right - stage.left;
  // the crop: tiles k−1..k+1 whole, any barrier it touches whole, and the claw's whole working space above the
  // slot (grip, lift, dashed slot); the pendulum, the posts and the plinth are left out whole
  const top = stage.clawPark - Math.max(14, H * 0.07) - 6 - 12;
  const bottom = F + 12;
  const vOver = q => q.y < bottom && q.y + q.h > top;
  let x0 = tl[k - 1].left - lensPad, x1 = tl[k + 1].left + stage.w + lensPad;
  const whole = [...tl.map(q => ({x: q.left, y: F - H, w: stage.w, h: H})), ...stage.barriers.map(q => unionBounds([q.box, q.stand]))].filter(vOver);
  for (let it = 0; it < 12; it++) {
    let ch = false;
    for (const q of whole) {
      if (q.x < x1 && q.x + q.w > x0 && (q.x < x0 - 1e-6 || q.x + q.w > x1 + 1e-6)) { x0 = Math.min(x0, q.x - 8); x1 = Math.max(x1, q.x + q.w + 8); ch = true; }
    }
    if (!ch) break;
  }
  const pend = {x: Math.min(stage.pivot.x, stage.raisedBob.x) - stage.rb, w: Math.abs(stage.pivot.x - stage.raisedBob.x) + 2 * stage.rb};
  const keepOut = [pend, {x: stage.left - 4, w: 26}, {x: stage.right - 40, w: 30}, {x: stage.plinth.x - 6, w: stage.plinth.w + 12}];
  for (const q of keepOut) {
    if (q.x + q.w > x0 && q.x < x1) {
      if (q.x + q.w / 2 < stage.slotX) x0 = Math.max(x0, q.x + q.w + 6); else x1 = Math.min(x1, q.x - 6);
    }
  }
  const source = {x: x0, y: top, w: x1 - x0, h: bottom - top};

  // ---- changed marker (Δ) + label, clear of the tiles, beside the slot
  const polysAfter = stage.polysAt('without', 0, 1).concat(stage.polysAt('with', 0, 0));
  const beamBand = {x: stage.left - 20, y: stage.beamY - 6, w: sW2 + 40, h: 30 + H * 0.07};
  const postBoxes = [{x: stage.left - 16, y: stage.beamY, w: 34, h: F - stage.beamY}, {x: stage.right - 44, y: stage.beamY, w: 34, h: stage.plinth.floorY - stage.beamY}];
  const obst = [beamBand, ...postBoxes, stage.hangBox, {x: stage.slotX - 8, y: stage.beamY, w: 16, h: F - H - stage.beamY}, ...stage.floorBoxes, ...polysAfter, ...stage.barriers.flatMap(b => [b.box, b.stand])];
  // (labels hidden: the Δ is the only sign of the change — drawn larger)
  const mR = keyOn ? Math.max(22, size * 0.8) : Math.max(30, H * 0.16);
  const mPos = placeChip({w: 2 * mR, h: 2 * mR}, {x: stage.slotX, y: F - H * 1.05}, {obstacles: obst, bounds: {x: stage.left + 10, y: stage.beamY + 30, w: sW2 - 20, h: F - stage.beamY - 40}, noLeader: true, order: ['aboveR', 'aboveL', 'rightHigh', 'leftHigh', 'right', 'left'], gaps: [8, 20, 40, 70, 110]})
    || {x: stage.slotX + stage.w, y: F - H * 1.3};
  const mC = {x: mPos.x, y: mPos.y + mR};
  const marker = changedMarker(ctx, {x: mC.x, y: mC.y, radius: mR, name: 'marker', opacity: 0});
  let mLabel = null;
  if (keyOn && p.contextLabels.marker) {
    const lp = chipG(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: Math.min(420, sW2 * 0.4), size, maxLines: 2});
    const res = placeChip({w: lp.box.w, h: lp.box.h}, {x: mC.x, y: mC.y, r: mR}, {obstacles: [...obst, {x: mC.x - mR, y: mC.y - mR, w: 2 * mR, h: 2 * mR}], bounds: {x: stage.left, y: stage.beamY + 24, w: sW2, h: F - stage.beamY - 30}, order: ['right', 'left', 'rightHigh', 'leftHigh', 'aboveR', 'aboveL'], gaps: [14, 30, 60]});
    const at = res || {x: Math.min(stage.right - lp.box.w / 2, mC.x + mR + 16 + lp.box.w / 2), y: mC.y - lp.box.h / 2};
    mLabel = calloutG(ctx, {name: 'mlabel', text: p.contextLabels.marker, chipAt: {x: at.x, y: at.y}, target: {x: mC.x + (at.x < mC.x ? -mR : mR), y: mC.y}, maxWidth: Math.min(420, sW2 * 0.4), maxLines: 2, size, color: th.accent2});
  }

  const ext = unionBounds([{x: stage.left - 8, y: 0, w: sW2 + 16, h: Math.max(stageBottom, reserveH)}, side || square ? {x: MARGIN, y: 0, w: full, h: 1} : null, cap && cap.box, ...lg.rows.map(rw => rw.box), record && record.box, key && key.box, mLabel && mLabel.box]);
  return {stage, copy, source, annProbe, annHOf, annWOf, side, stageBottom, record, key, cap, lg, marker, mC, mR, mLabel, ext, H, size, remove};
}

/**
 * The lens phase. The context stays in place at full size, dimmed; the lens opens in the free room beside its source
 * (wide boxes: to its right, over the dimmed legend column) or under the stage (tall/square boxes: over the dimmed
 * legend), >= 2.5× and >= ~36 % of the frame's short side. The record card stays visible (it moves beside the lens
 * when the lens takes its place) and its value turns over on screen. Guides are routed under the floor.
 * Everything here is in design coordinates (outside the block transform).
 */
function lensPhase(ctx, L) {
  const p = ctx.params, th = ctx.theme, D = ctx.design;
  const {stage, source, record} = L;
  const k = L.k, d = {x: L.dx, y: L.dy};
  const toD = q => ({x: k * q.x + d.x, y: k * q.y + d.y});
  const boxD = b => ({...toD(b), w: b.w * k, h: b.h * k});
  // the frame's short side in design units (the design is fitted into the caption-safe content box)
  const V = ctx.view;
  const S = Math.min(V.width, V.height) / Math.min(V.content.w / D.w, V.content.h / D.h);
  const full = D.w - 2 * MARGIN;
  const zCap = Math.max(Z_MIN, p.detailGeometry.zoom ?? 3);
  const sd = boxD(source);
  const srcW = sd.w, srcH = sd.h;
  const stageD = boxD({x: stage.left - 8, y: stage.beamY - 8, w: stage.right - stage.left + 16, h: stage.floorY + 36 - stage.beamY + 8});
  const recRest = record ? boxD(record.box) : null;
  const yf = toD({x: 0, y: stage.floorY + 36}).y;
  let o = null;
  if (ctx.view.shape === 'square') {
    // beside its source (the side with more room), over the dimmed stage and legend; the record card under the
    // stage on the other side
    const opts = [];
    for (const right of [true, false]) {
      const rw = recRest ? recRest.w : 0, rh = recRest ? recRest.h : 0;
      const lx0 = right ? sd.x + sd.w + 24 : MARGIN;
      const lx1 = right ? D.w - MARGIN : sd.x - 24;
      const z = Math.min(zCap, (lx1 - lx0) / srcW, (D.h - 16) / srcH);
      if (!(z > 0)) continue;
      const lw = srcW * z, lh = srcH * z;
      const lx = right ? lx0 : lx1 - lw;
      const ly = Math.max(8, Math.max(stageD.y, D.h - 8 - lh));
      let rec = null;
      const overL = q => q.x < lx + lw + 24 && lx - 24 < q.x + q.w && q.y < ly + lh + 24 && ly - 24 < q.y + q.h;
      if (recRest && !overL(recRest)) rec = recRest;
      else if (recRest) {
        const ry = stageD.y + stageD.h + 16;
        const rx = right ? Math.max(MARGIN, Math.min(lx - 24 - rw, recRest.x)) : Math.min(D.w - MARGIN - rw, Math.max(lx + lw + 24, recRest.x));
        rec = {x: rx, y: Math.min(ry, D.h - 8 - rh), w: rw, h: rh};
      }
      opts.push({mode: 'side', z, dest: {x: lx, y: ly, w: lw, h: lh}, rec, right});
    }
    const fitsRec = q => !q.rec || (q.rec.x >= MARGIN - 1 && q.rec.x + q.rec.w <= D.w - MARGIN + 1 && !(q.rec.x < q.dest.x + q.dest.w && q.dest.x < q.rec.x + q.rec.w));
    o = opts.filter(fitsRec).sort((a1, b1) => b1.dest.w - a1.dest.w)[0] || opts.sort((a1, b1) => b1.dest.w - a1.dest.w)[0];
  } else if (L.side) {
    // to the right of the source and of the record card (which stays where it is)
    // (past the end of the stage: the lens covers none of the scene, only the dimmed legend column)
    const lx = Math.max(sd.x + sd.w + 24, recRest ? recRest.x + recRest.w + 24 : 0, stageD.x + stageD.w + 8);
    const z = Math.min(zCap, (D.w - MARGIN - lx) / srcW, (D.h - 16) / srcH);
    const lw = srcW * z, lh = srcH * z;
    const ly = Math.max(8, Math.min(D.h - 8 - lh, yf + 22 - lh / 2));
    o = {mode: 'side', z, dest: {x: lx, y: ly, w: lw, h: lh}, rec: recRest};
  } else {
    // under the stage, next to its source; the record card beside it (or under it)
    const top = stageD.y + stageD.h + 32;
    const opts = [];
    for (const beside of record ? [true, false] : [false]) {
      const rw = recRest ? recRest.w : 0, rh = recRest ? recRest.h : 0;
      const z = Math.min(zCap, (full - (beside ? rw + 24 : 0)) / srcW, (D.h - 10 - top - (beside || !record ? 0 : rh + 14)) / srcH);
      const lw = srcW * z, lh = srcH * z;
      if (beside && lh < rh) continue;
      const srcCx = sd.x + sd.w / 2;
      let x = srcCx - lw / 2, rec = null;
      if (beside) {
        const leftRoom = x - MARGIN, rightRoom = D.w - MARGIN - (x + lw);
        if (rightRoom >= leftRoom) { x = Math.max(MARGIN, Math.min(x, D.w - MARGIN - rw - 24 - lw)); rec = {x: x + lw + 24, y: top + 8, w: rw, h: rh}; } else { x = Math.min(D.w - MARGIN - lw, Math.max(x, MARGIN + rw + 24)); rec = {x: x - 24 - rw, y: top + 8, w: rw, h: rh}; }
      } else {
        x = Math.max(MARGIN, Math.min(x, D.w - MARGIN - lw));
        if (record) rec = {x: Math.max(MARGIN, Math.min(D.w - MARGIN - rw, x + lw / 2 - rw / 2)), y: top + lh + 14, w: rw, h: rh};
      }
      opts.push({mode: 'below', z, dest: {x, y: top, w: lw, h: lh}, rec});
    }
    o = opts.sort((a1, b1) => b1.dest.w - a1.dest.w)[0];
  }
  const dest = o.dest;
  const content = g({transform: T(r(d.x), r(d.y), 0, r(k, 5))}, L.copy.back, L.copy.main);
  const L2 = lens(ctx, {name: 'lz', source: sd, dest, content, color: th.accent2});
  // guides: from under the floor below the crop to the lens (clear of every object and label)
  let gl;
  if (o.mode === 'side') {
    const gy = Math.max(dest.y + 24, Math.min(dest.y + dest.h - 24, yf + 22));
    const ex = o.right === false ? dest.x + dest.w : dest.x;
    const near = o.right === false ? sd.x : sd.x + sd.w, far = o.right === false ? sd.x + sd.w : sd.x;
    gl = [[{x: near, y: yf}, {x: near, y: gy - 8}, {x: ex, y: gy - 8}], [{x: far, y: yf}, {x: far, y: gy + 8}, {x: ex, y: gy + 8}]];
  } else {
    gl = [sd.x, sd.x + sd.w].map((gx, i) => {
      const dx = Math.max(dest.x + 18, Math.min(dest.x + dest.w - 18, gx));
      const midY = yf + (dest.y - yf) * (i ? 0.4 : 0.6);
      return Math.abs(dx - gx) < 0.5 ? [{x: gx, y: yf}, {x: gx, y: dest.y}] : [{x: gx, y: yf}, {x: gx, y: midY}, {x: dx, y: midY}, {x: dx, y: dest.y}];
    });
  }
  const guides = gl.map((pts, i) => h('path', {name: `lz-guide${i}`, d: 'M' + pts.map(q => `${r(q.x)} ${r(q.y)}`).join('L'), fill: 'none', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}));
  // the record card's move (layout units) and what the open lens lies over (it fades while the lens is open)
  const recMove = record && o.rec ? {x: (o.rec.x - recRest.x) / k, y: (o.rec.y - recRest.y) / k} : {x: 0, y: 0};
  const over = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
  const cover = {x: dest.x - 12, y: dest.y - 12, w: dest.w + 24, h: dest.h + 24};
  const recLens = o.rec || recRest;
  const underLens = L.lg.rows.filter(rw => over(boxD(rw.box), cover)).map(rw => rw.name);
  // (a moved record card: the rows under its new place, and under its path, step out while it moves)
  const moved = recLens && Math.hypot(recMove.x, recMove.y) > 0.5;
  const pathBox = moved ? unionBounds([recRest, recLens]) : null;
  const underRec = moved ? L.lg.rows.filter(rw => over(boxD(rw.box), {x: pathBox.x - 10, y: pathBox.y - 10, w: pathBox.w + 20, h: pathBox.h + 20})).map(rw => rw.name) : [];
  const capUnder = L.cap ? over(boxD(L.cap.box), cover) : false;
  const keyUnder = L.key ? over(boxD(L.key.box), cover) : false;
  const inBox = q => q.x >= -1 && q.y >= -1 && q.x + q.w <= D.w + 1 && q.y + q.h <= D.h + 1;
  const ok = o.z >= Z_MIN - 1e-6 && dest.w >= LENS_FRAC * S - 1e-6 && inBox(dest) && (!recLens || (inBox(recLens) && !over(recLens, dest))) && !over(sd, dest);
  return {L2, guides, dest, sd, zoom: dest.w / sd.w, frac: dest.w / S, ok, stageD, recMove, underLens, underRec, capUnder, keyUnder,
    stageCovered: false, fitsBox: inBox(dest)};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    // the model uses the "does not occur" spacing; nothing is run here, only the status of one event changes
    const M = resolveModel(p, 'loss-does-not-occur');
    const lossCount = Math.min(2, p.losses.length);
    const base = {M, SH, lossCount, remove: p.substitution !== 'restore'};
    const side = SH.mode === 'side';
    const topRow = 60;
    const maxH = ctx.show('key') ? Math.min(SH.maxH, 300) : SH.maxH;
    const hFor = (width, wrapM) => fitGeomH(M.n, width, maxH, lossCount, M.gap, wrapM ?? null, D.h - topRow - 10);
    const fits = X => X.ext.h <= D.h - 10 && X.ext.w <= D.w - 4;
    const sizesIn = (a, b) => { const out = []; for (let sz = a; sz > b + 1e-6; sz *= 0.97) out.push(sz); out.push(b); return out; };
    const passes = [
      {sizes: sizesIn(SH.size, SH.baseMin), hMin: 0.5},
      {sizes: sizesIn(SH.baseMin, SH.minSize), hMin: 0.5},
      {sizes: sizesIn(SH.baseMin, SH.minSize), hMin: 0.3},
    ];
    // the rest layout (build and hold) fills the box; the lens phase is framed separately (see lensPhase)
    const cfgs = side
      ? [{legendW: 0.3, cols: 1}, {legendW: 0.36, cols: 1}, {legendW: 0.36, cols: 1, maxLines: 6, gap: 6}, {legendW: 0.44, cols: 1, maxLines: 6, gap: 5, icons: false, padY: 6}, {legendW: 0.44, cols: 2, maxLines: 4}, {legendW: 0.44, cols: 2, maxLines: 6, gap: 5, icons: false, padY: 6}]
      : [{}, {cols: SH.cols + 1, maxLines: 4, gap: 8}, {cols: SH.cols + 1, maxLines: 5, gap: 5, icons: false, padY: 6}, {cols: SH.cols + 2, maxLines: 6, gap: 4, icons: false, padY: 5}];
    const widthOf = cfg => (!ctx.show('key') ? D.w - 2 * MARGIN : side ? D.w * (1 - cfg.legendW) - MARGIN - 40 : D.w - 2 * MARGIN - 16);
    let L = null;
    search: for (const ps of passes) {
      for (let f = 1; f >= ps.hMin - 1e-9; f -= 0.05) {
        for (const cfg of cfgs) {
          for (const size of ps.sizes) {
            const H = Math.max(100, hFor(widthOf(cfg)) * f);
            if (!fits(compose(ctx, base, H, size, {...cfg, dry: true}))) continue;
            const X = compose(ctx, base, H, size, cfg);
            if (!fits(X)) continue;
            X.k = Math.min(1, (D.h - 10) / X.ext.h, (D.w - 4) / X.ext.w);
            X.dx = (D.w - X.ext.w * X.k) / 2 - X.ext.x * X.k;
            X.dy = (D.h - X.ext.h * X.k) / 2 - X.ext.y * X.k;
            X.lens = lensPhase(ctx, X);
            L = X;
            if (X.lens.ok) break search;
          }
        }
      }
    }
    if (!L) L = compose(ctx, base, 100, SH.minSize, cfgs[cfgs.length - 1]);
    L.k = Math.min(1, (D.h - 10) / L.ext.h, (D.w - 4) / L.ext.w);
    L.dx = (D.w - L.ext.w * L.k) / 2 - L.ext.x * L.k;
    L.dy = (D.h - L.ext.h * L.k) / 2 - L.ext.y * L.k;
    L.M = M;
    // labels hidden: at rest a camera frames the stage alone to fill the box
    L.rest = {s: 1, tx: 0, ty: 0};
    if (!ctx.show('key')) {
      const b0 = {x: L.stage.left - 8, y: L.stage.beamY - 8, w: L.stage.right - L.stage.left + 16, h: L.stage.floorY + 36 - L.stage.beamY + 8};
      const sc = Math.min((D.w - 2 * MARGIN) / b0.w, (D.h - 20) / b0.h) / L.k;
      const tgt = {x: (D.w / 2 - L.dx) / L.k, y: (D.h / 2 - L.dy) / L.k};
      L.rest = {s: sc, tx: tgt.x - sc * (b0.x + b0.w / 2), ty: tgt.y - sc * (b0.y + b0.h / 2)};
    }
    L.lens = lensPhase(ctx, L);
    return L;
  },
  build(ctx, L) {
    return g(null,
      g({transform: T(L.dx, L.dy, 0, L.k)},
        L.cap && L.cap.node,
        g({name: 'cam'}, L.stage.back, L.stage.main, L.marker),
        L.lg.rows.map(rw => rw.node),
        L.record && L.record.node,
        L.key && L.key.node,
        L.mLabel && L.mLabel.node),
      g({name: 'lz-guides'}, L.lens.guides),
      g({name: 'lz-wrap', 'data-occludes': 1}, L.lens.L2.node),
      L.lens.ann && L.lens.ann.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const remove = L.remove;
    // claw / tile state of the substitution (identical in the scene and in the lens copy)
    const dp = seg(u, ...W.drop), gp = seg(u, ...W.grip), lp = seg(u, ...W.lift);
    let run, st;
    if (remove) {
      if (u < W.lift[0]) { run = 'with'; st = {drop: dp, grip: gp, lift: 0}; } else { run = 'without'; st = {drop: 1, grip: 1, lift: lp}; }
      st.slot = seg(u, ...W.slot);
    } else {
      // restore: lower the lifted tile into its slot (drop window), release (grip window), claw back up (lift window)
      if (u < W.grip[0]) { run = 'without'; st = {drop: 1, grip: 1, lift: 1 - dp}; } else if (u < W.lift[0]) { run = 'without'; st = {drop: 1, grip: 1 - gp, lift: 0}; } else { run = 'with'; st = {drop: 1 - lp, grip: 0, lift: 0}; }
      st.slot = 1 - seg(u, ...W.slot);
    }
    const a = L.stage.pose(run, 0, st);
    const c = L.copy.pose(run, 0, st);
    Object.assign(nodes, a.nodes, c.nodes);
    // lens
    const LZ = L.lens;
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const dim = open;
    Object.assign(nodes, LZ.L2.frame(open));
    // the card is opaque almost at once, and so is its copy (which starts exactly over its source): no faint phase
    const winOp = open > 0.001 ? Math.min(1, open * 20) : 0;
    nodes['lz-win'] = {opacity: r(winOp, 3)};
    // guides routed under the floor instead of straight cone lines through the scene
    nodes['lz-coneA'] = {...nodes['lz-coneA'], opacity: 0};
    nodes['lz-coneB'] = {...nodes['lz-coneB'], opacity: 0};
    LZ.guides.forEach((_, i) => { nodes[`lz-guide${i}`] = {opacity: open > 0.3 ? 1 : 0}; });
    // labels hidden: a rest camera frames the stage alone (build, hold); in place for the lens phase
    const camQ = ease.inOutCubic(seg(u, ...W.camIn)) * (1 - ease.inOutCubic(seg(u, ...W.camOut)));
    const R0 = L.rest;
    const cs = R0.s + (1 - R0.s) * camQ;
    nodes.cam = {transform: T(r(R0.tx * (1 - camQ), 2), r(R0.ty * (1 - camQ), 2), 0, r(cs, 5))};
    // no grey box over the frame: the context itself dims in place while the lens is open
    const ctxOp = r(1 - DIM * dim, 3);
    nodes['st-back'] = {opacity: ctxOp};
    nodes['st-main'] = {opacity: ctxOp};
    const copyOp = winOp;
    nodes['lz-content'] = {...nodes['lz-content'], opacity: r(copyOp, 3)};
    // text: dimmed in place; what the open lens (or the moved record card) lies over steps out
    const gone = r(1 - clamp(open * 3), 3);
    if (L.cap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.caption) * ctxOp * (LZ.capUnder ? gone : 1), 3)};
    const recQ = ease.inOutCubic(seg(u, ...W.camIn)) * (1 - ease.inOutCubic(seg(u, ...W.camOut)));
    const goneRec = r(1 - clamp(recQ * 3), 3);
    Object.assign(nodes, legendFrame(L.lg.rows, rw => seg(u, ...W.legend) * ctxOp * (LZ.underLens.includes(rw.name) ? gone : 1) * (LZ.underRec.includes(rw.name) ? goneRec : 1)));
    // the record card stays in full view; it moves beside the lens for the inspection and back, and its value turns
    // over on screen (old value struck, then the new one)
    const turn = seg(u, ...W.after);
    if (L.record) {
      nodes.record = {opacity: r(seg(u, ...W.record), 3), transform: T(r(LZ.recMove.x * recQ, 2), r(LZ.recMove.y * recQ, 2))};
      nodes['rec-new'] = {opacity: r(turn, 3)};
      const sp = seg(u, ...W.strike);
      L.record.strikeLens.forEach((lw, i) => { nodes[`rec-strike${i}`] = {'stroke-dashoffset': r(lw * (1 - sp))}; });
    }
    if (L.key) nodes.key = {opacity: r(seg(u, ...W.key) * (LZ.keyUnder ? gone : 1), 3)};
    const mp = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mp, 3)};
    if (L.mLabel) Object.assign(nodes, L.mLabel.frame(seg(u, ...W.markerLabel)));

    const S = a.semantic;
    const inside = (q, R) => q.x >= R.x && q.x <= R.x + R.w && q.y >= R.y && q.y <= R.y + R.h;
    const over = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
    const datum = u < W.strike[0] ? 'before' : u < W.after[0] ? 'changing' : 'after';
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      substitution: remove ? 'remove' : 'restore',
      focusTarget: p.focusTarget,
      selected: L.M.k,
      lensOpen: r(open, 3),
      copyShown: r(copyOp, 3),
      zoom: r(LZ.zoom, 3),
      datum,
      strike: r(seg(u, ...W.strike), 3),
      contextDatum: turn <= 0 ? 'before' : turn < 1 ? 'changing' : 'after',
      tileOut: run === 'without' && S.lift > 0,
      lift: S.lift,
      claw: S.claw,
      gripPt: L.stage.gripPoint(run, 0, S.lift),
      angles: S.angles,
      mirror: JSON.stringify(a.nodes[`st-tile${L.M.k}`]) === JSON.stringify(c.nodes[`lzs-tile${L.M.k}`]) && JSON.stringify(a.nodes['st-claw']) === JSON.stringify(c.nodes['lzs-claw']),
      sourceContainsSlot: inside({x: L.stage.slotX, y: L.stage.floorY - L.stage.H * 0.75}, L.source) && inside({x: L.stage.slotX, y: L.stage.floorY - L.stage.H + 4}, L.source) && inside({x: L.stage.tiles[L.M.k].left + 1, y: L.stage.floorY - 4}, L.source),
      lensClearOfSource: !over(LZ.sd, LZ.dest),
      lensFrac: r(LZ.frac, 3),
      lensOk: LZ.ok && LZ.fitsBox,
      // the whole moving part (the selected tile and the claw) stays inside the magnified region at every moment
      liftInLens: a.polys.length > 0 && [L.stage.clawBox(L.stage.gripPoint(run, 0, S.lift).y)].concat([]).every(b => b.x >= L.source.x && b.x + b.w <= L.source.x + L.source.w && b.y >= L.source.y && b.y + b.h <= L.source.y + L.source.h + 1) && inside({x: L.stage.slotX, y: L.stage.gripPoint(run, 0, S.lift).y}, L.source) && inside({x: L.stage.slotX, y: L.stage.gripPoint(run, 0, S.lift).y + L.stage.H}, L.source),
      stageCovered: LZ.stageCovered,
      recordShown: L.record ? r(seg(u, ...W.record), 3) : null,
      camera: r(camQ, 3),
      safe: {x: r(ctx.view.content.x / ctx.view.width, 4), y: r(ctx.view.content.y / ctx.view.height, 4), w: r(ctx.view.content.w / ctx.view.width, 4), h: r(ctx.view.content.h / ctx.view.height, 4)},
      markerVisible: mp >= 1,
      markerClear: !L.stage.polysAt(run, 0, S.lift).some(poly => poly.some(q => Math.hypot(q.x - L.mC.x, q.y - L.mC.y) < L.mR)),
      layout: {H: r(L.H), size: r(L.size), k: r(L.k, 3), wrapM: L.stage.wrapM}, dbg: L.dbg,
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
    slug: 'causation-02-inspect',
    title: 'Counterfactual replay — inspecting the selected event’s status in the model',
    titleEs: 'Prueba contrafactual causal — Inspección y cambio de un dato',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Prueba contrafactual causal',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The model set up to be run again; a lens enlarges the selected event’s slot (a real copy posed from the scene). One datum is substituted — the event’s status in the model (present → removed, or the reverse): the claw lifts the tile out (or lowers it back), leaving a dashed outline; the old value stays readable, struck. The lens closes onto the changed slot with a neutral Δ marker. Nothing is run or inferred; no legal conclusion.',
    tags: ['causation', 'counterfactual', 'inspect', 'lens', 'removed event', 'model as supplied', 'changed datum', 'claw'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CF_STRINGS,
  scene,
});
