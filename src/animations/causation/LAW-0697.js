/**
 * LAW-0697 — Daño material · story
 *
 * Storyboard (side view of one display corner; only the props move):
 *  0.00–0.15 rest     A ceramic vase (or a painted cabinet panel) stands intact
 *                     on a display table. Above it a shelf board on a wall post
 *                     holds a paint tin. Beside the table, on an easel, the
 *                     incident record lists the supplied entries (die faces =
 *                     supplied order) and the row "● Object before: …" with an
 *                     intact thumbnail; the row "◆ Object after" is still blank.
 *                     A small plotter waits under the record.
 *  0.15–0.42 action   The shelf board tilts on its bracket (0.15–0.22), the tin
 *                     slides off its end (0.19–0.26) and drops (0.26–0.33) onto
 *                     the object's top edge at 0.33. Only then does the object
 *                     change: a crack draws down from the lip (0.33–0.42) and
 *                     the struck piece of the lip breaks off and drops onto the
 *                     table (0.345–0.43) — or, for the panel, the top edge is
 *                     dented and scratches draw across the face. The object
 *                     rocks briefly; the tin bounces off to the floor.
 *  0.42–0.73 complete The plotter's carriage runs along its rail under the
 *                     record, its rod rises to the last row and its pen writes
 *                     "◆ Object after: <supplied altered state>" (0.52–0.68),
 *                     the altered thumbnail appearing in the row as it starts.
 *                     Before and after rows have equal weight.
 *  0.73–1.00 hold     Status "Altered state recorded (as supplied)" (or, when
 *                     supplied, the after entry is marked disputed with a dashed
 *                     "?" ring — never decided), notes and the key "As supplied ·
 *                     no conclusion drawn". Nothing is valued; no fault,
 *                     liability, compensation or causation is stated.
 * Wide boxes: stage left, record right. Tall boxes: the stage above, the record
 * on a lower floor below it. Text that does not belong to a prop sits in a band
 * of chips under the scene.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0697
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, num, obj, list, oneOf, annotation} from '../../schemas/fields.js';
import {
  dmFields, DM_STRINGS, resolveDM, eventText, linkNotes, objectArt, objectGeom, tableArt, floorArt, tinArt, shelfArt,
  iconChip, flowRows, recordMeasure, recordBuild, writeRow, plotterArt, linkIcon, CHIP_REST_ROT, CHIP_REST_DY,
  clamp, ease, lerp, r, seg,
} from './kits/dano-material.js';

const ID = 'LAW-0697';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  legend: [0.02, 0.1],
  tilt: [0.15, 0.22], slide: [0.19, 0.26], fall: [0.26, 0.33], contact: 0.33,
  crack: [0.33, 0.42], chip: [0.345, 0.43], scratch: [0.35, 0.45], wobble: [0.33, 0.52], bounce: [0.33, 0.44],
  toRow: [0.46, 0.52], icon: [0.49, 0.53], write: [0.52, 0.68], park: [0.68, 0.73],
  dispute: [0.73, 0.77], status: [0.75, 0.8], notes: [0.77, 0.82], key: [0.79, 0.84],
};
const FINAL = ['recorded', 'entry-disputed'];

const sceneSchema = {
  ...dmFields,
  actorLabels: obj('Captions for the two props that act', {
    a: str('Caption for the shelf and tin (what strikes the object, as supplied)', 70),
    b: str('Caption for the record plotter that writes the after entry', 70),
  }),
  objectLabels: obj('Labels printed in the scene', {
    record: str('Heading of the incident record', 60),
    before: str('Heading of the before row (comparison side A)', 40),
    after: str('Heading of the after row (comparison side B)', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['object', 'record', 'tin']), 0, 2),
  finalState: oneOf('SUPPLIED final state of the after entry: recorded as supplied, or marked disputed (never decided)', FINAL),
};

const defaultParams = {
  events: [
    {label: 'Shelf bracket above the table works loose', time: 'Day 3'},
    {label: 'Paint tin slides off the shelf', time: 'Day 3'},
    {label: 'Tin lands on the vase’s lip', time: 'Day 3'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Lip chipped, crack down the side'}],
  object: {kind: 'vase', before: 'Ceramic vase, no marks'},
  actorLabels: {a: 'Shelf and tin (as supplied)', b: 'Record plotter'},
  objectLabels: {record: '', before: '', after: ''},
  actionProgress: 1,
  annotations: [{target: 'object', text: 'Only the object’s visible state is shown'}],
  finalState: 'recorded',
};

// stage geometry (× object height H; x from the object's centre, y up from the floor)
const SG = {TH: 0.42, tabL: -0.62, tabR: 0.5, postX: -1.2, postW: 0.08, postTop: 2.3, pivY: 2.1, boardLen: 0.8, tk: 0.05, tinS: 0.3, tilt: 24, land: -0.98, left: -1.36, top: 2.47};
const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, modes: ['side', 'col', 'split'], hMin: 180},
  square: {size: 24, minSize: 17, modes: ['side', 'col', 'split', 'below'], hMin: 130},
  portrait: {size: 25, minSize: 17, modes: ['below', 'side', 'col', 'split'], hMin: 170},
};

function recordRows(ctx, p) {
  const t = ctx.t;
  const bl = p.objectLabels.before || t.before, al = p.objectLabels.after || t.after;
  const rows = p.events.map((e, i) => ({key: `ev${i}`, icon: 'event', i, text: eventText(e)}));
  rows.push({key: 'before', icon: 'before', text: `${bl}: ${p.object.before || ''}`.replace(/: $/, '')});
  rows.push({key: 'after', icon: 'after', level: 2, text: `${al}: ${p.losses[0].label}`, wipe: true, iconHidden: true});
  return rows;
}

function bandItems(ctx, p, M) {
  const t = ctx.t;
  const allOn = ctx.show('all');
  const out = [];
  if (!ctx.show('key')) return out;
  out.push({key: 'status', icon: 'after', level: 2, text: p.finalState === 'entry-disputed' ? t.entryDisputed : t.recorded, when: 'status'});
  if (allOn) p.annotations.forEach((a, i) => out.push({key: `note${i}`, icon: a.target === 'record' ? 'record' : a.target === 'tin' ? 'tin' : 'object', level: 2, text: a.text, when: 'notes', target: a.target}));
  if (p.losses[1]) out.push({key: 'loss1', icon: 'object', level: 2, text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'legend'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`, when: 'legend'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, icon: 'link', when: 'legend'}));
  if (allOn && p.actorLabels.a) out.push({key: 'actA', icon: 'tin', text: p.actorLabels.a, when: 'legend'});
  if (allOn && p.actorLabels.b) out.push({key: 'actB', icon: 'pen', text: p.actorLabels.b, when: 'legend'});
  out.push({key: 'key', text: t.key, when: 'key'});
  // chips shown from the start come first, the hold chips after them
  const order = {legend: 0, status: 1, notes: 2, key: 3};
  return out.sort((a, b) => order[a.when] - order[b.when]);
}

/** Stage extents at object height H (relative to the object centre x and floor F). */

/** Flow a list of measured chips into width w (memoised per size/width/slice). */
function bandFlow(ctx, base, size, w, from, to, half) {
  const key = `${size}|${Math.round(w)}|${from}|${to}|${half}`;
  let b = base.memo.band.get(key);
  if (!b) {
    const mw = half ? (w - 18) / 2 : Math.min(w, 760);
    const sz = [];
    for (let i = from; i < to; i++) {
      const ck = `${size}|${Math.round(mw)}|${i}`;
      let c = base.memo.chip.get(ck);
      if (!c) { c = {it: base.band[i], ...iconChip(ctx, base.band[i], {size, maxW: mw, kind: base.kind, maxLines: 3})}; base.memo.chip.set(ck, c); }
      sz.push(c);
    }
    const fl = flowRows(sz, {x: 0, y: 0, w, gap: 18, rowGap: 10});
    b = {sz, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad) || sz.some(q => q.w > w + 0.5)};
    base.memo.band.set(key, b);
  }
  return b;
}

/**
 * Compose the layout for one configuration. Vertical geometry of the record block (y = top of the sheet):
 * clip arm 0.35·clip above y; board to y + h + 14; rail 0.54·size lower; plotter to rail + 0.4·size; easel legs from
 * the rail to the floor (>= legMin). Horizontal: board from x - 10, rail to x + RW + 20 + railExt.
 */
function compose(ctx, base, cfg) {
  const D = ctx.design;
  const {size, mode, RW} = cfg;
  const textOn = ctx.show('key');
  const recKey = `${size}|${RW}|${cfg.maxLines ?? 3}`;
  const rec = base.memo.rec.get(recKey) || recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, kind: base.kind, text: textOn, maxLines: cfg.maxLines ?? 3});
  base.memo.rec.set(recKey, rec);
  if (rec.bad) return {bad: 'record'};
  const railGap = size * 0.9;
  const railExt = size * 2.4;
  const legMin = size * 1.4;
  const recW = RW + railExt + 36; // block width (rail end caps included)
  const above = rec.clipH * 0.35; // clip arm above the sheet top
  const recToRail = rec.h + 14 + railGap * 0.6; // sheet top → rail
  const recSpan = above + recToRail + size * 0.4; // drawn height of the record block (without legs)
  const full = D.w - 2 * MARGIN;
  const unit = SG.tabR - SG.left;
  const n = base.band.length;
  const k = mode === 'split' ? cfg.k : mode === 'col' ? n : 0; // chips in the right column (above the record)
  const wsCol = full - recW - 24; // stage column width (side-by-side modes)
  let A = null, B = null, H;
  if (mode === 'below') {
    B = bandFlow(ctx, base, size, full, 0, n, cfg.half);
    if (B.bad) return {bad: 'band'};
    if (recW > full) return {bad: 'recW'};
    const hs = D.h - 16 - 16 - recSpan - legMin - 16 - (B.h ? 16 + B.h : 0);
    H = Math.min((full - 10) / unit, hs / SG.top);
  } else {
    if (wsCol < 200) return {bad: 'ws'};
    A = k ? bandFlow(ctx, base, size, recW, 0, k, false) : {h: 0, sz: []};
    B = k < n ? bandFlow(ctx, base, size, mode === 'side' ? full : wsCol, k, n, cfg.half) : {h: 0, sz: []};
    if (A.bad || B.bad) return {bad: 'band'};
    const Fmax = D.h - 16 - (B.h ? 16 + B.h : 0);
    const needF = (A.h ? A.h + 20 : 0) + recSpan - size * 0.4 + legMin;
    if (needF > Fmax) return {bad: 'colH'};
    H = Math.min((wsCol - 10) / unit, Fmax / SG.top);
  }
  if (!(H >= cfg.hMin)) return {bad: 'H', H};
  // drawn extent of the scene (stage + record), used to prefer layouts where the scene fills the box
  const span = mode === 'below'
    ? Math.max((SG.top * H + 32 + recSpan + legMin) / D.h, Math.max(unit * H + 10, recW) / D.w)
    : Math.max((unit * H + 34 + recW) / D.w, Math.max(SG.top * H, (A && A.h ? 0 : recSpan)) / D.h);
  // the scene (stage + record) spans >= 0.56 of the FRAME width or height (frame in design units)
  const v = ctx.view, fs = Math.min(v.content.w / D.w, v.content.h / D.h);
  const sceneW = mode === 'below' ? Math.max(unit * H + 10, recW) : unit * H + 34 + recW;
  const sceneH = mode === 'below' ? SG.top * H + 32 + recSpan + legMin : Math.max(SG.top * H, recSpan + legMin);
  if (sceneW < 0.56 * v.width / fs && sceneH < 0.56 * v.height / fs) return {bad: 'share'};
  if (cfg.dry) return {H, size, span, cfg: {...cfg, dry: false}};

  // ---- place
  const sw = unit * H + 10;
  let cx, F, recX, recY, recFloor;
  const bands = [];
  if (mode !== 'below') {
    const blockW = sw + 24 + recW;
    const x0 = MARGIN + Math.max(0, (full - blockW) / 2);
    cx = x0 + 10 - SG.left * H;
    const colH = (A.h ? A.h + 20 : 0) + recSpan - size * 0.4 + legMin;
    const blockH = Math.max(SG.top * H, colH) + 16 + (B.h ? 16 + B.h : 0);
    const top = Math.max(0, (D.h - blockH) / 2);
    F = top + Math.max(SG.top * H, colH);
    recX = x0 + sw + 24 + 16;
    recFloor = F;
    // the record stands on its easel, centred on the object's height when there is room, legs >= legMin
    const lo = top + (A.h ? A.h + 20 : 0) + above; // highest sheet top
    const hi = F - legMin - recToRail; // lowest sheet top
    const want = F - (SG.TH + 0.55) * H - recToRail / 2;
    recY = Math.max(lo, Math.min(hi, want));
    if (A.h) bands.push({band: A, x: recX - 16, y: recY - above - 20 - A.h, w: recW, center: false});
    if (B.h) bands.push({band: B, x: mode === 'side' ? MARGIN : x0, y: F + 16 + 16, w: mode === 'side' ? full : sw, center: mode === 'side'});
  } else {
    const blockH = SG.top * H + 16 + 16 + recSpan + legMin + 16 + (B.h ? 16 + B.h : 0);
    const top = Math.max(0, (D.h - blockH) / 2);
    cx = MARGIN + (full - sw) / 2 + 10 - SG.left * H;
    F = top + SG.top * H;
    recX = MARGIN + (full - recW) / 2 + 16;
    recY = F + 16 + 16 + above;
    recFloor = recY + recToRail + legMin;
    if (B.h) bands.push({band: B, x: MARGIN, y: recFloor + 16 + 16, w: full, center: true});
  }
  return {H, size, cfg, cx, F, rec, recX, recY, recFloor, recW, railGap, railExt, bands, mode};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveDM(p);
    const base = {M, kind: p.object.kind, header: p.objectLabels.record || t.record, rows: recordRows(ctx, p), band: bandItems(ctx, p, M), memo: {rec: new Map(), band: new Map(), chip: new Map()}};
    const sizes = [];
    for (let s = SH.size; s >= SH.minSize - 1e-9; s -= 0.5) sizes.push(s);
    const rws = ctx.view.shape === 'landscape' ? [480, 560, 640, 720] : ctx.view.shape === 'square' ? [380, 430, 480, 540] : [520, 620, 720, Math.floor(ctx.design.w - 2 * MARGIN - (SH.size * 2.4 + 36))];
    let pick = null;
    const why = [];
    const nb0 = base.band.length;
    // split points: a few positions in the chip list (the right column takes the first k chips)
    const ks = [...new Set([1, Math.ceil(nb0 / 3), Math.ceil(nb0 / 2), Math.ceil((2 * nb0) / 3), nb0 - 1].filter(k => k >= 1 && k < nb0))];
    const cfgs = size => SH.modes.flatMap(mode => rws.flatMap(RW => [3, 4].flatMap(maxLines => (mode === 'split'
      ? ks.map(k => ({mode, size, RW, maxLines, k}))
      : [{mode, size, RW, maxLines}]).flatMap(c => [false, true].map(half => ({...c, half, hMin: SH.hMin, dry: true}))))));
    let best = null;
    const tryAt = size => {
      for (const c of cfgs(size)) {
        const X = compose(ctx, base, c);
        if (!X.cfg) { why.push(`${c.mode}${c.k ?? ''}/${c.RW}@${size}:${X.bad}`); continue; }
        if (!best) best = X;
        const sc = X.H * (0.6 + 0.4 * Math.min(1, X.span));
        if (!pick || sc > pick.sc + 1e-6) pick = {...X, sc};
      }
    };
    // whole sizes first; then the half sizes around the largest size that fits; keep sizes within 3 px of it
    for (const size of sizes.filter(s0 => Number.isInteger(s0))) {
      // keep the text >= 20 px whenever the largest size that fits allows it
      if (best && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      tryAt(size);
    }
    if (best && best.size + 0.5 <= SH.size) { const b0 = best.size; best = null; tryAt(b0 + 0.5); if (!best) best = {size: b0}; }
    let L = null;
    if (pick) L = compose(ctx, base, pick.cfg);
    else {
      // last resort (reported as a fallback, never used by a saved preset): compose in a taller virtual box and
      // scale the result into the real one
      for (let f = 1.1; f <= 4.01 && !L; f += 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const mode of SH.modes.filter(m0 => m0 !== 'split')) {
          const X = compose(c2, base, {mode, size: SH.minSize, RW: rws[rws.length - 1], maxLines: 5, hMin: SH.hMin * 0.6});
          if (X.cx !== undefined) { L = X; break; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(0, 12);
    L.M = M;
    L.base = base;
    // geometry used by build/frame
    const H = L.H, cx = L.cx, F = L.F;
    const G = objectGeom(p.object.kind, H);
    L.G = G;
    L.obj = objectArt(ctx, {name: 'obj', kind: p.object.kind, H, level: 0});
    L.objBase = {x: cx, y: F - SG.TH * H};
    L.strike = {x: cx + G.strike.x, y: F - SG.TH * H + G.strike.y};
    const tinS = SG.tinS * H, tinW = tinS * 0.88;
    L.tinS = tinS;
    L.pivot = {x: cx + SG.postX * H, y: F - SG.pivY * H};
    L.tinRest = SG.boardLen * H * 0.45;
    L.contact = {x: L.strike.x - tinW / 2 + 0.02 * H, y: L.strike.y - tinS / 2};
    L.landing = {x: cx + SG.land * H, y: F - tinW / 2};
    // the tin leaves the board with its centre just past the board's end
    const th = SG.tilt * Math.PI / 180;
    const along = SG.boardLen * H + tinW * 0.1;
    const off = -(SG.tk * H / 2 + tinS / 2);
    L.slideEnd = {x: L.pivot.x + along * Math.cos(th) - off * Math.sin(th), y: L.pivot.y + along * Math.sin(th) + off * Math.cos(th)};
    // record + plotter
    const recNode = recordBuild(ctx, L.rec, {prefix: 'rec', x: L.recX, y: L.recY, kind: p.object.kind});
    L.recNode = recNode;
    const railY = L.recY - L.rec.clipH * 0.35 + recNode.box.h + L.railGap * 0.6;
    L.plot = plotterArt(ctx, {prefix: 'plt', x0: L.recX - 10, x1: L.recX + L.rec.w + 10 + L.railExt, railY, s: L.size});
    L.railY = railY;
    L.afterRow = recNode.rows.find(rw => rw.key === 'after');
    // band chips
    L.bandNodes = [];
    for (const bd of L.bands) {
      const placed = flowRows(bd.band.sz, {x: bd.x, y: bd.y, w: bd.w, gap: 18, rowGap: 10, center: bd.center}).placed;
      for (const pl of placed) {
        const it = pl.it.it;
        const st = it.key === 'status' ? {fill: ctx.theme.accent2Soft, stroke: ctx.theme.accent2} : {};
        const b = pl.it.build(pl.x, pl.y, `band-${it.key}`, st);
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    // everything must sit in the design box (k < 1 only in the reported fallback)
    const D = ctx.design;
    const ext = {x0: Math.min(cx + SG.left * H - 10, L.recX - 16, ...L.bandNodes.map(b => b.box.x)), x1: Math.max(cx + SG.tabR * H, L.plot.box.x + L.plot.box.w, ...L.bandNodes.map(b => b.box.x + b.box.w)),
      y0: Math.min(F - SG.top * H, L.recY - L.rec.clipH * 0.35, L.plot.box.y), y1: Math.max(F + 16, L.recFloor + 16, ...L.bandNodes.map(b => b.box.y + b.box.h))};
    L.ext = ext;
    L.k = Math.min(1, D.w / (ext.x1 - ext.x0), D.h / (ext.y1 - ext.y0));
    L.dx = L.k < 1 ? (D.w - (ext.x1 - ext.x0) * L.k) / 2 - ext.x0 * L.k : 0;
    L.dy = L.k < 1 ? (D.h - (ext.y1 - ext.y0) * L.k) / 2 - ext.y0 * L.k : 0;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const H = L.H, cx = L.cx, F = L.F;
    const shelf = shelfArt(ctx, {name: 'sh', postX: cx + SG.postX * H, postTop: F - SG.postTop * H, floorY: F, px: L.pivot.x, py: L.pivot.y, len: SG.boardLen * H, th: SG.tk * H});
    const obj0 = L.obj;
    const rec = L.recNode;
    const legX = [L.recX + L.rec.w * 0.2, L.recX + L.rec.w * 0.8];
    const easel = g({name: 'easel'},
      legX.map(x => h('path', {d: `M${r(x)} ${r(L.railY)}L${r(x + (x < L.recX + L.rec.w / 2 ? -1 : 1) * L.size)} ${r(L.recFloor)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.35)), 'stroke-linecap': 'round'})),
      h('path', {d: `M${r(L.recX + L.rec.w / 2)} ${r(L.railY)}V${r(L.recFloor)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(5, L.size * 0.28)), 'stroke-linecap': 'round'}));
    const floors = L.mode === 'below'
      ? [floorArt(ctx, {name: 'floor', x0: cx + SG.left * H - 10, x1: cx + SG.tabR * H + 10, floorY: F}), floorArt(ctx, {name: 'floor2', x0: L.recX - 30, x1: L.recX + L.recW, floorY: L.recFloor})]
      : [floorArt(ctx, {name: 'floor', x0: cx + SG.left * H - 10, x1: L.recX + L.recW - 16, floorY: F})];
    const dispute = p.finalState === 'entry-disputed'
      ? g({name: 'dispute', opacity: 0, transform: T(L.afterRow.iconBox.x + L.afterRow.iconBox.w * 0.2, L.afterRow.iconBox.y + L.afterRow.iconBox.h / 2)}, linkIcon(ctx, {cx: 0, cy: 0, s: L.size * 1.6, disputed: true}))
      : null;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      floors,
      shelf.back,
      tableArt(ctx, {name: 'table', x0: cx + SG.tabL * H, x1: cx + SG.tabR * H, topY: F - SG.TH * H, floorY: F}),
      g({name: 'objg', transform: T(L.objBase.x, L.objBase.y)}, obj0.node),
      obj0.chip,
      shelf.board,
      g({name: 'tin', transform: T(L.pivot.x, L.pivot.y)}, tinArt(ctx, {name: 'tin-art', s: L.tinS})),
      easel,
      rec.node,
      L.plot.node,
      dispute,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const H = L.H;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const obj0 = L.obj;
    // shelf + tin
    const tilt = SG.tilt * ease.inOutQuad(seg(a, ...W.tilt));
    nodes['sh-board'] = {transform: T(L.pivot.x, L.pivot.y, tilt)};
    const tinW = L.tinS * 0.88;
    const off = -(SG.tk * H / 2 + L.tinS / 2);
    let tin, tinRot;
    if (a < W.fall[0]) {
      const s = ease.inQuad(seg(a, ...W.slide));
      const along = lerp(L.tinRest, SG.boardLen * H + tinW * 0.1, s);
      const th = tilt * Math.PI / 180;
      tin = {x: L.pivot.x + along * Math.cos(th) - off * Math.sin(th), y: L.pivot.y + along * Math.sin(th) + off * Math.cos(th)};
      tinRot = tilt;
    } else if (a < W.contact) {
      const s = ease.inQuad(seg(a, ...W.fall));
      const P0 = L.slideEnd, P2 = L.contact, P1 = {x: P0.x + (P2.x - P0.x) * 0.9, y: P0.y};
      tin = {x: (1 - s) ** 2 * P0.x + 2 * s * (1 - s) * P1.x + s * s * P2.x, y: (1 - s) ** 2 * P0.y + 2 * s * (1 - s) * P1.y + s * s * P2.y};
      tinRot = lerp(SG.tilt, 0, ease.outQuad(s));
    } else {
      const s = seg(a, ...W.bounce);
      const Q = {x: L.contact.x - 0.45 * H, y: L.contact.y - 0.42 * H};
      const e = ease.inQuad(s);
      tin = {x: (1 - e) ** 2 * L.contact.x + 2 * e * (1 - e) * Q.x + e * e * L.landing.x, y: (1 - s) ** 2 * L.contact.y + 2 * s * (1 - s) * Q.y + s * s * L.landing.y};
      tinRot = -90 * ease.inOutQuad(s);
    }
    nodes.tin = {transform: T(tin.x, tin.y, tinRot)};
    // object marks + wobble
    const markA = ease.outQuad(seg(a, ...W.crack));
    const isVase = p.object.kind === 'vase';
    const markB = isVase ? (a >= W.chip[0] ? Math.max(1e-6, seg(a, ...W.chip)) : 0) : seg(a, ...W.scratch);
    Object.assign(nodes, obj0.frame({a: markA, b: markB}));
    const ws = seg(a, ...W.wobble);
    const wob = ctx.reduced ? 0 : (ws > 0 && ws < 1 ? 3 * Math.exp(-4 * ws) * Math.sin(ws * Math.PI * 5) : 0);
    const pivotX = L.objBase.x + (wob >= 0 ? 1 : -1) * L.G.W * 0.24;
    const rot = `rotate(${r(wob)} ${r(pivotX)} ${r(L.objBase.y)})`;
    nodes.objg = {transform: `${rot} ${T(L.objBase.x, L.objBase.y)}`};
    let chipPos = null;
    if (isVase) {
      const G = L.G;
      const from = {x: L.objBase.x + G.chipFrom.x, y: L.objBase.y + G.chipFrom.y};
      const rest = {x: L.objBase.x + G.chipRest.x, y: L.objBase.y + G.chipRest.y - H * CHIP_REST_DY};
      const s = seg(a, ...W.chip);
      if (a < W.chip[0]) {
        chipPos = from;
        nodes['obj-chip'] = {transform: `${rot} ${T(from.x, from.y)}`};
      } else {
        const Q = {x: from.x - 0.12 * H, y: from.y - 0.12 * H};
        const e = s;
        chipPos = {x: (1 - e) ** 2 * from.x + 2 * e * (1 - e) * Q.x + e * e * rest.x, y: (1 - s) ** 2 * from.y + 2 * s * (1 - s) * Q.y + s * s * rest.y};
        nodes['obj-chip'] = {transform: T(chipPos.x, chipPos.y, CHIP_REST_ROT * ease.outQuad(s))};
      }
    }
    // record: after row written by the plotter
    const textOn = ctx.show('key');
    const row = L.afterRow;
    const wr = seg(a, ...W.write);
    const w0 = writeRow(ctx, 'rec', row, wr, textOn && Boolean(L.rec.rows.find(q => q.key === 'after').fit));
    Object.assign(nodes, w0.nodes);
    nodes['rec-icon-after'] = {opacity: r(seg(a, ...W.icon), 3)};
    const start = {x: row.lines[0].x, y: w0.tip.y};
    let tip;
    if (a < W.toRow[0]) tip = L.plot.parkTip;
    else if (a < W.write[0]) {
      const s = ease.inOutQuad(seg(a, ...W.toRow));
      const firstY = row.lines[0].y + row.lines[0].h * (textOn ? 0.95 : 0.7);
      tip = {x: lerp(L.plot.parkTip.x, row.lines[0].x, s), y: lerp(L.plot.parkTip.y, firstY, ease.inOutQuad(seg(s, 0.4, 1)))};
    } else if (a < W.park[0]) tip = w0.tip;
    else {
      const s = ease.inOutQuad(seg(a, ...W.park));
      tip = {x: lerp(w0.tip.x, L.plot.parkTip.x, s), y: lerp(w0.tip.y, L.plot.parkTip.y, ease.inOutQuad(seg(s, 0, 0.6)))};
    }
    void start;
    Object.assign(nodes, L.plot.frame(tip));
    // band
    const lg = seg(u, ...W.legend);
    for (const b of L.bandNodes) {
      const pr = b.when === 'legend' ? lg : b.when === 'key' ? seg(u, ...W.key) : done ? seg(u, ...W[b.when]) : 0;
      nodes[`band-${b.key}`] = {opacity: r(pr, 3)};
    }
    if (p.finalState === 'entry-disputed') nodes.dispute = {opacity: r(done ? seg(u, ...W.dispute) : 0, 3)};
    const phase = a < W.tilt[0] ? 'rest' : a < W.contact ? 'tin-falls' : a < W.chip[1] ? 'altering' : a < W.write[0] ? 'to-record' : a < W.write[1] ? 'writing' : 'done';
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      phase,
      kind: p.object.kind,
      finalState: p.finalState,
      tin: {x: r(tin.x), y: r(tin.y)},
      tinRot: r(tinRot),
      tilt: r(tilt),
      contactU: W.contact,
      markA: r(markA, 3), markB: r(clamp(markB), 3),
      altered: markA > 0 || markB > 0.0001,
      chip: chipPos ? {x: r(chipPos.x), y: r(chipPos.y)} : null,
      objTop: {x: r(L.objBase.x), y: r(L.objBase.y - H)},
      tip: {x: r(tip.x), y: r(tip.y)},
      written: r(wr, 3),
      afterIcon: r(seg(a, ...W.icon), 3),
      statusShown: done && seg(u, ...W.status) >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      actionCapped: p.actionProgress < 1 && u > capU,
      layout: {H: r(L.H), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, mode: L.mode, why: L.why, ext: L.ext && [r(L.ext.x0), r(L.ext.y0), r(L.ext.x1), r(L.ext.y1)], cfg: L.cfg && {RW: L.cfg.RW, k: L.cfg.k, half: L.cfg.half, maxLines: L.cfg.maxLines}},
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
    slug: 'causation-05-story',
    title: 'Material damage — an object changes to an altered state next to the incident record',
    titleEs: 'Daño material — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Daño material',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a display corner: a shelf tilts, a paint tin drops onto a vase (or a cabinet panel) on a table, and only then does the object change — a crack and a chipped lip (or a dent and scratches). Beside it, on an easel, a plotter writes the after entry in the incident record, next to the before entry of equal weight. As supplied; nothing is valued and no fault, liability, compensation or causation is stated.',
    tags: ['causation', 'damage', 'material damage', 'before and after', 'incident record', 'vase', 'panel', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: DM_STRINGS,
  scene,
});
