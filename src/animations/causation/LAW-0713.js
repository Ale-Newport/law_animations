/**
 * LAW-0713 — Contribución de la persona afectada · story
 *
 * Storyboard (oblique top view of one ground slab; objects only — no person is
 * drawn and nobody is injured):
 *  0.00–0.15 rest     Two parallel lanes of identical size and colour run
 *                     across the slab toward ONE event pad (a vase lying on
 *                     it: the loss, shown only as an object). Each lane ends at
 *                     an identical barrier; an identical trolley waits at each
 *                     lane's start (● flag on lane A, ◆ flag on lane B); the
 *                     supplied steps stand beside their lanes as generic
 *                     objects; the record lists them. Nothing is joined yet.
 *  0.15–0.42 begin    Both trolleys roll at the same time and the same speed
 *                     along their lanes (0.16–0.40); each step object gives a
 *                     small hop as its lane's trolley passes it, and its record
 *                     row lights.
 *  0.42–0.73 complete The trolleys stop at their barriers (nothing reaches the
 *                     event physically). The two connectors from the lane ends
 *                     to the event draw together (0.45–0.56), as a plain
 *                     relation unless "causal" is supplied. A brace beside the
 *                     pad joins both lanes (0.62–0.66) and carries "<event> ·
 *                     <loss as supplied>" (0.66–0.71).
 *  0.73–1.00 hold     Status "Convergence shown as supplied" (or marked
 *                     disputed, never decided), notes and the key "As supplied
 *                     · no conclusion drawn". Both lanes, trolleys, barriers
 *                     and connectors keep identical stroke, colour, size and
 *                     timing: no share, percentage, fault or contributory
 *                     doctrine is stated; the convergence is a supplied
 *                     description only.
 * Wide boxes: the slab left, record right (band below or in the record's
 * column). Tall boxes: the slab above the record (the loss chip may stand above
 * the slab). Square boxes may put the loss chip and the record in a right-hand
 * column; with long texts ('list') the legend continues as a compact list.
 * Layout engine copied from LAW-0709 (accepted causation-08 story).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0713
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, num, obj, list, oneOf, annotation} from '../../schemas/fields.js';
import {
  caFields, CA_STRINGS, CA_DEFAULTS, CA_ES_DEFAULTS, resolveCA, entryRow, lossText, linkNotes, altText,
  fieldGeom, fieldW, fieldH, itemPlaces, slabArt, cartArt, actorArt, eventArt, itemArt, laneBarrier, laneConnector, glueN, unwidow, floorArt,
  iconChip, flowRows, recordMeasure, recordBuild, chipG, linkIcon, adIcon,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/contribucion-afectada.js';

const ID = 'LAW-0713';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  legend: [0, 0.04], roll: [0.16, 0.4], conn: [0.45, 0.56],
  bracket: [0.62, 0.66], varChip: [0.66, 0.71], dispute: [0.74, 0.77],
  status: [0.76, 0.8], notes: [0.78, 0.82], key: [0.8, 0.84],
};
const FINAL = ['convergence-shown', 'convergence-disputed'];

const sceneSchema = {
  ...caFields,
  actorLabels: obj('Captions for the two lanes (the two compared conducts, equal weight)', {
    a: str('Caption for lane A and its trolley (conduct of A)', 70),
    b: str('Caption for lane B and its trolley (conduct of B, the affected person)', 70),
  }),
  objectLabels: obj('Labels printed in the scene', {
    record: str('Heading of the record', 60),
    laneA: str('Label of the ● lane A (comparison side A)', 60),
    laneB: str('Label of the ◆ lane B (comparison side B)', 70),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['field', 'record', 'lanes']), 0, 2),
  finalState: oneOf('SUPPLIED final state of the convergence: shown as supplied, or marked disputed (never decided)', FINAL),
};

const defaultParams = {
  ...CA_DEFAULTS,
  actorLabels: {a: 'Lane A: the conduct of A', b: 'Lane B: the conduct of B'},
  objectLabels: {record: '', laneA: '', laneB: ''},
  actionProgress: 1,
  annotations: [{target: 'lanes', text: 'Both lanes are drawn alike; nothing is weighed'}],
  finalState: 'convergence-shown',
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...CA_ES_DEFAULTS,
  actorLabels: {a: 'Carril A: la conducta de A', b: 'Carril B: la conducta de B'},
  annotations: [{target: 'lanes', text: 'Los dos carriles se dibujan igual; nada se pondera'}],
};

const strings = {
  en: {...CA_STRINGS.en, shown: 'Convergence shown as supplied', disputedState: 'Convergence disputed (as supplied) · undecided'},
  es: {...CA_STRINGS.es, shown: 'Convergencia mostrada según lo aportado', disputedState: 'Convergencia discutida (según lo aportado) · sin decidir'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, modes: ['side', 'split', 'tall'], hMin: 250},
  square: {size: 24, minSize: 17, modes: ['tall', 'side', 'split', 'below', 'below2'], hMin: 160},
  portrait: {size: 25, minSize: 17, modes: ['below', 'below2', 'side', 'split'], hMin: 250},
};
const RW_ = fieldW(), RH_ = fieldH();
// gap between the field's top and a loss chip standing above it (× PH)
const TOPX = 0.04;

function recordRows(ctx, p, M) {
  return M.entries.map(e => entryRow(e, {highlight: true}));
}

function bandItems(ctx, p, M) {
  const t = ctx.t;
  const allOn = ctx.show('all');
  const out = [];
  if (!ctx.show('key')) return out;
  // the rows that appear late come first, so the chips shown at rest take the band's last rows
  const late = [];
  // each lane key carries its caption (actorLabels) after the lane label: one chip per lane, equal and side by side
  const cap = l => (allOn && p.actorLabels[l] ? ` · ${p.actorLabels[l]}` : '');
  out.push({key: 'laneA', icon: 'laneA', text: `${p.objectLabels.laneA || t.laneA}${cap('a')}`, when: 'legend'});
  out.push({key: 'laneB', icon: 'laneB', text: `${p.objectLabels.laneB || t.laneB}${cap('b')}`, when: 'legend'});
  out.push({key: 'object', icon: 'event', text: `${p.origin.name} · ${t.lanes}`, when: 'legend'});
  if (p.losses[1]) out.push({key: 'loss1', icon: 'loss', text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'legend'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: altText(ctx, a), when: 'legend'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, when: 'legend'}));
  late.push({key: 'status', icon: 'lanes', text: p.finalState === 'convergence-disputed' ? t.disputedState : t.shown, when: 'status'});
  if (allOn) p.annotations.forEach((a, i) => late.push({key: `note${i}`, icon: a.target === 'record' ? 'record' : a.target === 'field' ? 'event' : 'lanes', text: a.text, when: 'notes'}));
  late.push({key: 'key', text: t.key, when: 'key'});
  return [...late, ...out];
}

function bandFlow(ctx, base, size, w, from, to, half, legendFirst = false) {
  const key = `${size}|${Math.round(w)}|${from}|${to}|${half}|${legendFirst}`;
  let b = base.memo.band.get(key);
  if (!b) {
    const mw = half ? (w - 18) / 2 : Math.min(w, 760);
    const sz = [];
    for (let i = from; i < to; i++) sz.push(bandChip(ctx, base, i, size, mw));
    // (legendFirst: the rows shown from the first frame sit directly under the record, the late rows below them)
    if (legendFirst) sz.sort((a0, b0) => (a0.it.when === 'legend' ? 0 : 1) - (b0.it.when === 'legend' ? 0 : 1));
    const fl = flowRows(sz, {x: 0, y: 0, w, gap: 18, rowGap: 10});
    b = {sz, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad) || sz.some(q => q.w > w + 0.5)};
    base.memo.band.set(key, b);
  }
  return b;
}

/**
 * One band chip measured for a column width, at bounded cost: a chip measured for width W (w wide) is reused for any
 * width in [w, W] (it fits there; a one-line chip for any width >= w), a chip that does not fit width W is not
 * measured again for a narrower one, and new widths are quantized down to 20-unit steps (a chip never gets more room
 * than it is offered).
 */
function bandChip(ctx, base, i, size, mw0) {
  const rk = `${size}|${i}`;
  let rs = base.memo.ranges.get(rk);
  if (!rs) { rs = []; base.memo.ranges.set(rk, rs); }
  for (const q of rs) {
    if (q.c.bad ? mw0 <= q.hi : q.c.w <= mw0 + 0.5 && (mw0 <= q.hi || q.c.lines === 1)) return q.c;
  }
  const mw = Math.max(size * 4, Math.floor(mw0 / 20) * 20);
  const c = {it: base.band[i], ...iconChip(ctx, base.band[i], {size, maxW: mw, maxLines: 3})};
  // (the whole quantization step [mw, mw + 20) maps to this measurement)
  rs.push({hi: Math.max(mw, Math.floor(mw0 / 20) * 20) + 19.99, c});
  return c;
}

/** The grouping chip beside the field (measured). */
function varChip(ctx, base, size, maxW) {
  const k = `var|${size}|${Math.round(maxW)}`;
  let c = base.memo.chip.get(k);
  if (c === undefined) {
    const o = {x: 0, y: 0, maxWidth: maxW, size, maxLines: 5, fill: ctx.theme.card, stroke: ctx.theme.accent2};
    c = ctx.show('key') ? chipG(ctx, unwidow(base.varText, t0 => chipG(ctx, t0, o).fit), o) : null;
    if (c) c.text = unwidow(base.varText, t0 => chipG(ctx, t0, o).fit);
    base.memo.chip.set(k, c);
  }
  return c;
}

/**
 * Compact list row (square boxes, 'list' mode): icon + a tight left-aligned chip as wide as the column, up to 4
 * lines (draws long legend texts as a compact list instead of a flow of balanced chips).
 */
function listItem(ctx, base, it, size, maxW) {
  const k = `li|${it.key}|${size}|${Math.round(maxW)}`;
  let c = base.memo.chip.get(k);
  if (c) return c;
  const th = ctx.theme;
  const iconS = it.icon ? size * 1.3 : 0;
  const iw = it.icon ? iconS + 8 : 0;
  const o = {x: 0, y: 0, maxWidth: maxW - iw, size, maxLines: 4, padX: size * 0.4, padY: size * 0.16, align: 'start', radius: size * 0.3};
  const text = unwidow(glueN(it.text), t0 => chipG(ctx, t0, o).fit);
  const probe = chipG(ctx, text, o);
  const hh = Math.max(probe.box.h, iconS);
  c = {
    it, w: iw + probe.box.w, h: hh, bad: probe.fit.truncated || probe.fit.broken,
    build(x, y, name, style = {}) {
      const ch = chipG(ctx, text, {...o, x: x + iw, y: y + (hh - probe.box.h) / 2, fill: style.fill ?? th.card, stroke: style.stroke ?? th.inkSoft});
      return {node: g({name, opacity: 0}, it.icon ? adIcon(ctx, it, x, y + hh / 2, iconS) : null, ch.node), box: {x, y, w: iw + probe.box.w, h: hh}};
    },
  };
  base.memo.chip.set(k, c);
  return c;
}

/** Stack list rows top-down into the given slots [{x, y, w, h}] in order; null when they do not all fit. */
function stackList(ctx, base, items, size, slots, gap) {
  const placed = [];
  let si = 0, y = slots.length ? slots[0].y : 0;
  for (const it of items) {
    for (;;) {
      if (si >= slots.length) return null;
      const S = slots[si];
      const c = listItem(ctx, base, it, size, S.w);
      if (c.bad) return null;
      // (the two lane keys stay together in one slot: lane A only goes where lane B fits right under it)
      const nx = it.key === 'laneA' ? items.find(q => q.key === 'laneB') : null;
      const need = nx ? c.h + gap + listItem(ctx, base, nx, size, S.w).h : c.h;
      if (y + need <= S.y + S.h + 0.5) { placed.push({c, x: S.x, y}); y += c.h + gap; break; }
      si++;
      if (si < slots.length) y = slots[si].y;
    }
  }
  // (bottom: the lowest placed row in any slot — the column can run lower than the slot under the field)
  return {placed, slot: si, bottom: Math.max(y - gap, ...placed.map(q => q.y + q.c.h))};
}

/**
 * 'list' (square boxes): the plate large on the left; a right-hand column with the grouping chip, the record and the
 * legend rows as a compact list, which continues under the plate. Used only when no other composition keeps the
 * plate at LIST_GATE (e.g. the long-labels stress at 1:1).
 */
const LIST_GATE = 300;
function composeList(ctx, base, size, hMin) {
  const D = ctx.design;
  const full = D.w - 2 * MARGIN;
  const stageH = ph => RH_ * ph + 16;
  const textOn = ctx.show('key');
  // legend rows first (shown from the first frame, directly under the record), then the late rows (status, notes, key)
  const late = base.band.filter(b => b.when !== 'legend'), legend = base.band.filter(b => b.when === 'legend');
  // (the late rows come first in the column: at rest the rows that are already shown reach the foot of the box)
  const items = [...late, ...legend];
  const phMax = Math.min((full - 330) / RW_, (D.h - 16) / RH_);
  for (let PH = Math.floor(phMax); PH >= hMin; PH -= 2) {
    const stageW = RW_ * PH + 20;
    const cw = Math.floor((full - stageW - 30) / 10) * 10;
    if (cw < 300) continue;
    const dc = varChip(ctx, base, size, cw);
    if (dc && (dc.fit.truncated || dc.fit.broken)) continue;
    const RW = cw - 20;
    const recKey = `${size}|${RW}|4`;
    const r3 = base.memo.rec.get(`${size}|${RW}|3`);
    const rec = base.memo.rec.get(recKey) || (r3 && !r3.bad ? r3 : null) || recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, text: textOn, maxLines: 4});
    base.memo.rec.set(recKey, rec);
    if (rec.bad) continue;
    const recW = RW + 20, recH = rec.h + 14 + rec.clipH * 0.35;
    const colX = MARGIN + full - recW;
    const head = (dc ? dc.box.h + 22 : 0) + recH;
    if (head > D.h) continue;
    const slots = [{x: colX, y: head + 16, w: recW, h: D.h - head - 16}, {x: MARGIN, y: stageH(PH) + 16, w: colX - 30 - MARGIN, h: D.h - stageH(PH) - 16}];
    const st = items.length ? stackList(ctx, base, items, size, slots, 7) : {placed: [], slot: 0, bottom: 0};
    if (!st) continue;
    return {PH, size, mode: 'list', cfg: {mode: 'list', size, hMin}, rec, recW, recH, dc, stageW, stageH: stageH(PH), colX, colH: head, list: st, full, A: null, B: {h: 0, sz: []}};
  }
  return {bad: 'list'};
}

/** Compose one configuration (stage = the field, the grouping chip beside it). */
function compose(ctx, base, cfg) {
  const D = ctx.design;
  const {size, mode, RW} = cfg;
  const textOn = ctx.show('key');
  const recKey = `${size}|${RW}|${cfg.maxLines ?? 3}`;
  // (a record whose rows all fit in three lines is the same record with a four-line limit)
  const r3 = (cfg.maxLines ?? 3) > 3 ? base.memo.rec.get(`${size}|${RW}|3`) : null;
  const rec = base.memo.rec.get(recKey) || (r3 && !r3.bad ? r3 : null) || recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, text: textOn, maxLines: cfg.maxLines ?? 3});
  base.memo.rec.set(recKey, rec);
  if (rec.bad && !cfg.force) return {bad: 'record'};
  const recW = RW + 20, recH = rec.h + 14 + rec.clipH * 0.35;
  const full = D.w - 2 * MARGIN;
  const n = base.band.length;
  const k = mode === 'split' || mode === 'tall' ? cfg.k : 0;
  const wsCol = full - recW - 30;
  let A = null, B = null, PH, dc = null, colH = 0;
  const chipTop = cfg.vw === 2;
  let stageH = ph => RH_ * ph + 16;
  if (mode === 'tall') {
    if (wsCol < 300) return {bad: 'ws'};
    dc = varChip(ctx, base, size, RW);
    if (dc && (dc.fit.truncated || dc.fit.broken) && !cfg.force) return {bad: 'var'};
    A = k ? bandFlow(ctx, base, size, recW, 0, k, false, true) : {h: 0, sz: []};
    B = k < n ? bandFlow(ctx, base, size, wsCol, k, n, cfg.half) : {h: 0, sz: []};
    if ((A.bad || B.bad) && !cfg.force) return {bad: 'band'};
    colH = (dc ? dc.box.h + 22 : 0) + recH + (A.h ? 14 + A.h : 0);
    if (colH > D.h) return {bad: 'colH'};
    const avail = D.h - (B.h ? 16 + B.h : 0);
    PH = Math.min((wsCol - 20) / RW_, (avail - 16) / RH_);
  } else {
    // (vw 2, tall boxes only: the chip stands ABOVE the bracket instead of beside the field — the field takes the width)
    if (chipTop && !(mode === 'below' || mode === 'below2')) return {bad: 'chipTop'};
    dc = varChip(ctx, base, size, chipTop ? Math.min(full * 0.8, size * 24) : cfg.vw === 1 ? Math.min(460, size * 18) : Math.max(size * 9, Math.min(360, size * 13)));
    if (dc && (dc.fit.truncated || dc.fit.broken) && !cfg.force) return {bad: 'var'};
    const chipW = dc && !chipTop ? dc.box.w + 40 : 0;
    if (mode === 'below' || mode === 'below2') {
      const bw = mode === 'below2' ? full - recW - 20 : full;
      if (bw < 240) return {bad: 'bw'};
      B = bandFlow(ctx, base, size, bw, 0, n, mode === 'below2' ? false : cfg.half);
      if (B.bad && !cfg.force) return {bad: 'band'};
      if (recW > full) return {bad: 'recW'};
      const hs = D.h - 32 - (mode === 'below2' ? Math.max(recH, B.h) : recH + (B.h ? 34 + B.h : 0)) - (chipTop && dc ? dc.box.h + 14 : 0);
      PH = Math.min((full - 20 - chipW) / RW_, (hs - 16) / (RH_ + (chipTop ? TOPX : 0)));
    } else {
      if (wsCol < 260) return {bad: 'ws'};
      A = k ? bandFlow(ctx, base, size, recW, 0, k, false) : {h: 0, sz: []};
      B = k < n ? bandFlow(ctx, base, size, mode === 'side' ? full : wsCol, k, n, cfg.half) : {h: 0, sz: []};
      if ((A.bad || B.bad) && !cfg.force) return {bad: 'band'};
      const avail = D.h - (B.h ? 16 + B.h : 0);
      if ((A.h ? A.h + 20 : 0) + recH > avail) return {bad: 'colH'};
      PH = Math.min((wsCol - 20 - chipW) / RW_, (avail - 16) / RH_);
    }
    // the chip (centred on the bracket, kept inside the stage's height) — or above the bracket (chipTop)
    if (chipTop) { const ch = dc ? dc.box.h + 14 : 0; stageH = ph => RH_ * ph + 16 + TOPX * ph + ch; }
    else if (dc && dc.box.h > stageH(PH) - 30) return {bad: 'chipH'};
  }
  if (!(PH >= cfg.hMin)) return {bad: 'PH', PH};
  const stageW = mode === 'tall' ? RW_ * PH + 20 : RW_ * PH + 20 + (dc && !chipTop ? dc.box.w + 40 : 0);
  // the scene (field + record) spans >= 0.56 of the FRAME width or height
  const v = ctx.view, fs = Math.min(v.content.w / D.w, v.content.h / D.h);
  const below = mode === 'below' || mode === 'below2';
  const sceneW = mode === 'tall' || mode === 'below2' ? full : below ? Math.max(stageW, recW) : stageW + 30 + recW;
  const sceneH = mode === 'tall' ? Math.max(stageH(PH), colH) : mode === 'below2' ? stageH(PH) + 32 + Math.max(recH, B.h) : below ? stageH(PH) + 32 + recH : Math.max(stageH(PH), recH);
  if (sceneW < 0.56 * v.width / fs && sceneH < 0.56 * v.height / fs && !cfg.force) return {bad: 'share'};
  if (cfg.dry) return {PH, size, cfg: {...cfg, dry: false}, dcW: dc ? dc.box.w : 0, stageW};
  return {PH, size, cfg, rec, recW, recH, A, B, dc, mode, colH, stageW, stageH: stageH(PH), wsCol, full, chipTop};
}

/**
 * Estimated share of the FRAME's area taken by the physical scene (field with its trolleys + floor line) for a measured
 * candidate {PH, cfg, dcW, stageW}, at rest — mirrors the placement in layout() (the floor runs under a loss chip that
 * stands beside or above the field in the stacked compositions).
 */
function sceneShare(ctx, c) {
  const D = ctx.design, v = ctx.view;
  const fs = Math.min(v.content.w / D.w, v.content.h / D.h);
  const PH = c.PH, mode = c.cfg.mode, full = D.w - 2 * MARGIN;
  const fieldWd = RW_ * PH + 20;
  let w = fieldWd;
  if ((mode === 'below' || mode === 'below2') && c.dcW) {
    const left = MARGIN + (full - c.stageW) / 2 + 10;
    if (c.cfg.vw === 2) {
      const mid = left + (RW_ - 0.1) * PH;
      const chipX = clamp(mid - c.dcW / 2, MARGIN, D.w - MARGIN - c.dcW);
      w = Math.max(fieldWd, chipX + c.dcW + 16 - (left - 10));
    } else w = fieldWd + 40 + c.dcW + 16 - 10;
  }
  return (w * (RH_ * PH + 16) * fs * fs) / (v.width * v.height);
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveCA(p);
    const base = {M, header: p.objectLabels.record || t.record, rows: recordRows(ctx, p, M), band: bandItems(ctx, p, M), varText: glueN(lossText(ctx, p)), memo: {rec: new Map(), band: new Map(), chip: new Map(), ranges: new Map()}};
    const rws = ctx.view.shape === 'landscape' ? [440, 520, 600, 680] : ctx.view.shape === 'square' ? [300, 340, 380, 440, 500] : [520, 640, 760, Math.floor(ctx.design.w - 2 * MARGIN - 20)];
    const nb0 = base.band.length;
    // (a split never falls between the two lane keys: A and B always stand together, in the same place)
    const keepAB = k => !(base.band[k - 1] && base.band[k - 1].key === 'laneA');
    const ks = [...new Set([1, Math.ceil(nb0 / 3), Math.ceil(nb0 / 2), Math.ceil((2 * nb0) / 3), nb0 - 1].filter(k => k >= 1 && k < nb0 && keepAB(k)))];
    let pick = null;
    const why = [];
    const bySize = new Map();
    // (wide and tall boxes: a size under the bound is still measured while no measured size keeps the scene area)
    const areaOK = () => [...bySize.values()].some(c => sceneShare(ctx, c) >= 0.205);
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      for (const mode of SH.modes) for (const RW of rws) for (const maxLines of [3, 4]) for (const half of [false, true]) for (const vw of [0, 1, 2]) for (const k of mode === 'split' ? ks : mode === 'tall' ? [...Array(nb0 + 1).keys()].filter(keepAB) : [0]) {
        const X = compose(ctx, base, {mode, size, RW, maxLines, half, vw, k, hMin: SH.hMin, dry: true});
        if (!X.cfg) { why.push(`${mode}${k || ''}/${RW}@${size}:${X.bad}${X.PH ? Math.round(X.PH) : ''}`); continue; }
        const b0 = bySize.get(size);
        if (!b0 || X.PH > b0.PH + 1e-6) bySize.set(size, X);
      }
      // (bounded, deterministic: wide and tall boxes stop three sizes below the first size that fits, and never search
      // below 20 px once a size >= 20 fitted; the first size under that bound is still measured, and in tall boxes the
      // search goes on (to the minimum size at most) while no measured size keeps the scene area — see the pick below)
      if (bySize.size) {
        const first = [...bySize.values()][0];
        if (size < Math.max(first.size - 3, Math.min(first.size, 20)) - 1e-9 && (ctx.view.shape === 'landscape' || areaOK())) break;
      }
    }
    // the field (slab, lanes, trolleys, event) stays >= 0.21 of the frame height when any configuration allows it
    const v0 = ctx.view, fs0 = Math.min(v0.content.w / ctx.design.w, v0.content.h / ctx.design.h);
    const subjOK = c => (RH_ - 0.02) * c.PH * fs0 >= 0.21 * v0.height;
    let cands = [...bySize.values()];
    if (cands.some(subjOK)) cands = cands.filter(subjOK);
    if (cands.length) {
      if (ctx.view.shape === 'square') {
        // the field stays the subject: the largest text size whose field is >= 0.95 of the largest found, >= 20 first
        const maxPH = Math.max(...cands.map(c => c.PH));
        const ok = cands.filter(c => c.PH >= 0.95 * maxPH - 1e-6);
        pick = (ok.filter(c => c.size >= 20).length ? ok.filter(c => c.size >= 20) : ok).sort((a, b) => b.size - a.size)[0];
        if (pick.size < 20) { const c20 = cands.filter(c => c.size >= 20).sort((a, b) => b.PH - a.PH)[0]; if (c20 && c20.PH >= 0.8 * maxPH) pick = c20; }
        // the physical scene keeps >= 0.205 of the frame's area when a measured size allows it (largest text first)
        // (estimate margin: the rendered union runs ~15 % under the estimate in square boxes)
        if (sceneShare(ctx, pick) < 0.235) {
          const big = cands.filter(c => sceneShare(ctx, c) >= 0.235).sort((a0, b0) => b0.size - a0.size || b0.PH - a0.PH)[0];
          if (big) pick = big;
        }
      } else {
        // text at >= 20 (the 19.5 px baseline floor) wins unless it costs more than a fifth of the field's size
        const best = cands.reduce((a0, b0) => (b0.PH > a0.PH + 1e-6 ? b0 : a0));
        const c20 = cands.filter(c => c.size >= 20 - 1e-9);
        const best20 = c20.length ? c20.reduce((a0, b0) => (b0.PH > a0.PH + 1e-6 ? b0 : a0)) : null;
        pick = best20 && best20.PH >= 0.9 * best.PH ? best20 : best;
        // the physical scene (field + floor) keeps >= 0.205 of the frame's area when a measured size allows it: the
        // largest text size whose larger field does (long texts in tall boxes give up a text size rather than shrink the field)
        const share = c => sceneShare(ctx, c);
        if (share(pick) < 0.205) {
          const big = cands.filter(c => c.PH > pick.PH && share(c) >= 0.205).sort((a0, b0) => b0.size - a0.size || b0.PH - a0.PH)[0];
          if (big) pick = big;
        }
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    // square boxes whose field would stay below LIST_GATE (long texts): the compact list composition, when it keeps
    // the field larger
    if (ctx.view.shape === 'square' && ctx.show('key') && (!L || L.PH < LIST_GATE)) {
      const ls = [];
      for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) { const X = composeList(ctx, base, size, SH.hMin); if (X.list) ls.push(X); }
      if (ls.length) {
        // (the field's size is the point of this composition: the largest field, then the largest text)
        // (text at >= 20 — the 19.5 px baseline floor — wins when it keeps >= 0.85 of the largest field)
        const lmax = Math.max(...ls.map(q => q.PH));
        const l20 = ls.filter(q => q.size >= 20 && q.PH >= 0.85 * lmax).sort((a, b) => b.PH - a.PH)[0];
        // (the physical scene keeps >= 0.205 of the frame's area when a list candidate allows it: largest text first)
        const v1 = ctx.view, fs1 = Math.min(v1.content.w / ctx.design.w, v1.content.h / ctx.design.h);
        const shareL = q => ((RW_ * q.PH + 20) * (RH_ * q.PH + 16) * fs1 * fs1) / (v1.width * v1.height);
        const lA = ls.filter(q => shareL(q) >= 0.205).sort((a, b) => b.size - a.size || b.PH - a.PH)[0];
        const lp = (l20 && shareL(l20) >= 0.205 ? l20 : lA) || l20 || ls.sort((a, b) => b.PH - a.PH || b.size - a.size)[0];
        const shareCur = L ? sceneShare(ctx, {...L, dcW: L.dc ? L.dc.box.w : 0}) : 0;
        if (!L || lp.PH > L.PH || (shareL(lp) >= 0.205 && shareCur < 0.235)) { L = lp; pick = lp; }
      }
    }
    let Dv = ctx.design;
    // fallback: a taller virtual box scaled into the real one (flagged); last resort (e.g. the DOM-less text estimator):
    // the same with text allowed to wrap without limit, flagged in semantic.problems — never throws
    for (const force of [false, true]) {
      for (let f = 1.1; f <= (force ? 12.01 : 4.01) && !L; f += force ? 0.5 : 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const mode of SH.modes.filter(m0 => m0 !== 'split' && m0 !== 'tall')) {
          const X = compose(c2, base, {mode, size: SH.minSize, RW: rws[rws.length - 1], maxLines: force ? 12 : 5, hMin: force ? 20 : 80, force, k: 0, vw: 1});
          if (X.rec) { L = X; Dv = c2.design; if (force) L.problems = ['no-layout-fits']; break; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(-24);
    L.M = M;
    const full = Dv.w - 2 * MARGIN;
    const PH = L.PH;
    let cx, F, recX, recY, recFloor = null;
    const bands = [];
    const colH = (L.A && L.A.h ? L.A.h + 20 : 0) + L.recH;
    if (L.mode === 'list') {
      const bottom = Math.max(L.stageH, L.colH, L.list.placed.length ? L.list.bottom : 0);
      const top = Math.max(0, (Dv.h - bottom) * 0.75);
      F = top + L.stageH - 16;
      cx = MARGIN + 10;
      L.colX = MARGIN + full - L.recW;
      L.colTop = top;
      recX = L.colX + 10;
      recY = top + (L.dc ? L.dc.box.h + 22 : 0) + L.rec.clipH * 0.35;
      L.listTop = top;
    } else if (L.mode === 'tall') {
      const blockH = L.stageH + (L.B.h ? 16 + L.B.h : 0);
      // (labels hidden: the slab stands at the foot of the box; square boxes: centred)
      const top = Math.max(0, (Dv.h - blockH) * (ctx.show('key') ? 0.75 : ctx.view.shape === 'square' ? 0.5 : 1));
      F = top + L.stageH - 16;
      cx = MARGIN + 10;
      const colX = MARGIN + full - L.recW;
      const colTop = Math.max(0, (Dv.h - L.colH) / 2);
      L.colX = colX; L.colTop = colTop;
      recX = colX + 10;
      recY = colTop + (L.dc ? L.dc.box.h + 22 : 0) + L.rec.clipH * 0.35;
      if (L.A && L.A.h) bands.push({band: L.A, x: colX, y: recY - L.rec.clipH * 0.35 + L.recH + 14, w: L.recW, center: false});
      if (L.B.h) bands.push({band: L.B, x: MARGIN, y: F + 32, w: L.wsCol, center: true});
    } else if (L.mode === 'side' || L.mode === 'split') {
      const blockW = L.stageW + 30 + L.recW;
      const extra = Math.max(0, full - blockW);
      const spread = L.mode === 'side' ? 0.7 : 0;
      const x0 = MARGIN + extra * (1 - spread) / 2;
      L.recGap = 30 + extra * spread;
      const blockH = Math.max(L.stageH, colH) + (L.B.h ? 16 + L.B.h : 0);
      // (labels hidden: the block stands at the foot of the box, so the slab reaches down the frame)
      const top = Math.max(0, (Dv.h - blockH) * (ctx.show('key') ? 0.75 : ctx.view.shape === 'square' ? 0.5 : 1));
      F = top + Math.max(L.stageH, colH) - 16;
      cx = x0 + 10;
      recX = x0 + L.stageW + L.recGap + 10;
      const aTop = top + (L.A && L.A.h ? L.A.h + 20 : 0);
      recY = aTop + L.rec.clipH * 0.35 + Math.max(0, (Math.max(L.stageH, colH) - colH) / 2);
      if (L.A && L.A.h) bands.push({band: L.A, x: recX - 10, y: recY - L.rec.clipH * 0.35 - 20 - L.A.h, w: L.recW, center: false});
      if (L.B.h) bands.push({band: L.B, x: L.mode === 'side' ? MARGIN : x0, y: F + 32, w: L.mode === 'side' ? full : L.wsCol, center: L.mode === 'side'});
      recFloor = F;
    } else if (L.mode === 'below2') {
      const lowH = Math.max(L.recH, L.B.h);
      const blockH = L.stageH + 32 + lowH;
      const top = Math.max(0, (Dv.h - blockH) / 2);
      F = top + L.stageH - 16;
      cx = MARGIN + (full - L.stageW) / 2 + 10;
      recX = MARGIN + 10;
      recY = F + 32 + L.rec.clipH * 0.35 + Math.max(0, (lowH - L.recH) / 2);
      if (L.B.h) bands.push({band: L.B, x: MARGIN + L.recW + 20, y: F + 32 + Math.max(0, (lowH - L.B.h) / 2), w: full - L.recW - 20, center: false});
    } else {
      const blockH = L.stageH + 32 + L.recH + (L.B.h ? 34 + L.B.h : 0);
      // (labels hidden: no band — the slab keeps the top of the box and the record stands at its foot, so the scene
      // spans the box)
      const bare = !L.B.h && !ctx.show('key');
      const top = bare ? 0 : Math.max(0, (Dv.h - blockH) * 0.75);
      F = top + L.stageH - 16;
      cx = MARGIN + (full - L.stageW) / 2 + 10;
      recX = MARGIN + (full - L.recW) / 2 + 10;
      recY = (bare ? Math.max(F + 32, Dv.h - L.recH - 8) : F + 32) + L.rec.clipH * 0.35;
      if (L.B.h) bands.push({band: L.B, x: MARGIN, y: recY - L.rec.clipH * 0.35 + L.recH + 34, w: full, center: true});
    }
    L.F = F;
    const G = fieldGeom(cx, F, PH);
    L.G = G;
    L.places = itemPlaces(G, M);
    L.actors = ['a', 'b'].map((l, i) => actorArt(ctx, {name: `ac${l}`, idx: i}));
    // the two connectors (lane end → event), each with its supplied kind and status
    L.links = M.links.map(l => ({lane: l.lane, kind: l.kind, art: laneConnector(ctx, {name: `cn${l.lane.toUpperCase()}`, G, l: l.lane, kind: l.kind, disputed: l.status === 'disputed'})}));
    // the brace beside the pad joins the two lanes; the loss chip hangs beside the field (or heads the right-hand
    // column, or stands above the field)
    if (L.dc) {
      const disputed = p.finalState === 'convergence-disputed';
      const endX = G.braceX + Math.max(6, disputed ? L.size * 2.1 : 0);
      if (L.chipTop) {
        const w0 = L.dc.box.w;
        const chipX = clamp(G.braceX - w0 / 2, MARGIN, Dv.w - MARGIN - w0);
        const y0 = G.top - 14 - L.dc.box.h;
        const c = chipG(ctx, L.dc.text, {x: chipX, y: y0, maxWidth: L.dc.box.w + 1, size: L.size, maxLines: 5, fill: th.card, stroke: th.accent2, name: 'var-chip'});
        L.varChip = c;
        L.varLead = `M${r(G.braceX)} ${r(G.yA - 2)}V${r(y0 + c.box.h)}`;
      } else if (L.mode === 'tall' || L.mode === 'list') {
        const c = chipG(ctx, L.dc.text, {x: L.colX, y: L.colTop, maxWidth: L.dc.box.w + 1, size: L.size, maxLines: 5, fill: th.card, stroke: th.accent2, name: 'var-chip'});
        L.varChip = c;
        const gx = L.colX - 14, my = c.box.y + c.box.h / 2;
        L.varLead = `M${r(endX + 4)} ${r(G.bracketY)}H${r(gx)}V${r(my)}H${r(L.colX)}`;
      } else {
        const chipX = G.x1 + 40;
        const cy0 = G.bracketY;
        const y0 = clamp(cy0 - L.dc.box.h / 2, G.top + 2, F - 24 - L.dc.box.h);
        const c = chipG(ctx, L.dc.text, {x: chipX, y: y0, maxWidth: L.dc.box.w + 1, size: L.size, maxLines: 5, fill: th.card, stroke: th.accent2, name: 'var-chip'});
        L.varChip = c;
        const my = clamp(cy0, y0 + 14, y0 + c.box.h - 14);
        const gx = chipX - 12;
        L.varLead = Math.abs(my - cy0) < 1 ? `M${r(endX + 4)} ${r(cy0)}H${r(chipX)}` : `M${r(endX + 4)} ${r(cy0)}H${r(gx)}V${r(my)}H${r(chipX)}`;
      }
    }
    L.recNode = recordBuild(ctx, L.rec, {prefix: 'rec', x: recX, y: recY});
    L.recFloor = recFloor;
    L.recX = recX;
    L.bandNodes = [];
    if (L.mode === 'list') {
      for (const pl of L.list.placed) {
        const it = pl.c.it;
        const st = it.key === 'status' ? {fill: th.accent2Soft, stroke: th.accent2} : {};
        const b = pl.c.build(pl.x, L.listTop + pl.y, `band-${it.key}`, st);
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    for (const bd of bands) {
      const placed = flowRows(bd.band.sz, {x: bd.x, y: bd.y, w: bd.w, gap: 18, rowGap: 10, center: bd.center}).placed;
      for (const pl of placed) {
        const it = pl.it.it;
        const st = it.key === 'status' ? {fill: th.accent2Soft, stroke: th.accent2} : {};
        const b = pl.it.build(pl.x, pl.y, `band-${it.key}`, st);
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    const Dr = ctx.design;
    L.k = Math.min(1, Dr.w / Dv.w, Dr.h / Dv.h);
    L.dx = (Dr.w - Dv.w * L.k) / 2;
    L.dy = (Dr.h - Dv.h * L.k) / 2;
    L.Dv = Dv;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const G = L.G, M = L.M;
    const legX = [L.recX + L.rec.w * 0.2, L.recX + L.rec.w * 0.8];
    const railY = L.recNode.box.y + L.recNode.box.h;
    const easel = L.recFloor === null ? null : g({name: 'easel'},
      legX.map(x => h('path', {d: `M${r(x)} ${r(railY - 6)}L${r(x + (x < L.recX + L.rec.w / 2 ? -1 : 1) * L.size)} ${r(L.recFloor)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.35)), 'stroke-linecap': 'round'})));
    const dispute = p.finalState === 'convergence-disputed'
      ? g({name: 'dispute', opacity: 0, transform: T(G.braceX + L.size * 1.15, G.bracketY)}, linkIcon(ctx, {cx: 0, cy: 0, s: L.size * 1.5, disputed: true}))
      : null;
    const x0f = G.x0 - 10;
    const x1f = L.mode === 'tall' || L.mode === 'list' ? G.x1 + 10 : L.mode.startsWith('below') ? (L.varChip ? Math.max(G.x1 + 10, L.varChip.box.x + L.varChip.box.w + 16) : G.x1 + 10) : L.recX + L.rec.w + 20;
    // the objects, barriers and trolleys, back to front (lane A behind lane B)
    const stand = [
      {y: G.py, node: g({name: 'event', transform: T(G.px, G.py)}, eventArt(ctx, {R: G.padR}))},
      ...L.places.map(q => ({y: q.y, node: g({name: `item${q.i}`, transform: T(q.x, q.y)}, itemArt(ctx, {i: q.i, s: q.s}))})),
      ...['a', 'b'].map(l => ({y: G.laneY(l) + 0.01, node: g({name: `bar${l.toUpperCase()}`, transform: T(G.xb, G.laneY(l))}, laneBarrier(ctx, {name: `lb${l}`, G}))})),
      ...['a', 'b'].map(l => ({y: G.laneY(l) + 0.02, node: g({name: `cart${l.toUpperCase()}`, transform: T(G.cartX(0), G.laneY(l))}, cartArt(ctx, {name: `ct${l}`, PH: G.PH, side: l}))})),
      // the two actors (equal size), each walking behind its trolley with both hands on the push bar
      ...['a', 'b'].map((l, i) => ({y: G.laneY(l) + 0.015, node: g({name: `actor${l.toUpperCase()}`}, L.actors[i].node)})),
    ].sort((a, b) => a.y - b.y);
    const tick = G.PH * 0.05;
    const bD = `M${r(G.braceX - tick)} ${r(G.yA)}H${r(G.braceX)}V${r(G.yB)}H${r(G.braceX - tick)}`;
    const bl = 2 * tick + (G.yB - G.yA) + 10;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      floorArt(ctx, {name: 'floor', x0: x0f, x1: x1f, floorY: L.F}),
      L.mode.startsWith('below') ? floorArt(ctx, {name: 'floor2', x0: L.recX - (L.mode === 'below2' ? 12 : 30), x1: L.recX + L.rec.w + (L.mode === 'below2' ? 12 : 30), floorY: L.recNode.box.y + L.recNode.box.h + 8}) : null,
      g({name: 'field'},
        slabArt(ctx, {name: 'slab', G}),
        L.links.map(lk => lk.art.node),
        stand.map(q => q.node)),
      h('path', {name: 'bracket', d: bD, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(bl)} ${r(bl + 20)}`, 'stroke-dashoffset': r(bl)}),
      L.varChip ? h('path', {name: 'var-lead', d: L.varLead, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linejoin': 'round', opacity: 0}) : null,
      L.varChip ? g({name: 'varg', opacity: 0}, L.varChip.node) : null,
      dispute,
      easel,
      L.recNode.node,
      L.bandNodes.map(b => b.node),
    );
    void M;
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G, M = L.M;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    // both trolleys roll together, at the same speed, from their lane starts to their barriers
    const f = ease.inOutCubic(seg(a, ...W.roll));
    const cx = G.cartX(f);
    for (const l of ['a', 'b']) nodes[`cart${l.toUpperCase()}`] = {transform: T(cx, G.laneY(l))};
    // the actors push their trolleys (same pose, same timing; a small walking sway while they move)
    let allReached = true;
    const acts = ['a', 'b'].map((l, i) => {
      const fr = L.actors[i].frame(cx, G.laneY(l), G.PH, f * 18);
      Object.assign(nodes, fr.nodes);
      if (!fr.reached) allReached = false;
      return {x: r(fr.x), hand: {x: r(fr.hand.x), y: r(fr.hand.y)}};
    });
    // each step object hops as its lane's trolley passes it; its record row lights while the trolley is beside it
    const hopH = G.PH * 0.06, hopW = G.PH * 0.24;
    const moving = f > 0 && f < 1;
    const hops = L.places.map(q => {
      const k = clamp((cx - (q.x - hopW / 2)) / hopW);
      const hop = moving && k > 0 && k < 1 ? Math.sin(Math.PI * k) : 0;
      nodes[`item${q.i}`] = {transform: T(q.x, q.y - hop * hopH)};
      nodes[`rec-hl-ev${q.i}`] = {opacity: moving && Math.abs(cx - q.x) < G.PH * 0.22 ? 1 : 0};
      return r(hop, 3);
    });
    // the two connectors draw together once the trolleys have stopped (a supplied description, not a movement)
    const cp = ease.inOutQuad(seg(a, ...W.conn));
    for (const lk of L.links) Object.assign(nodes, lk.art.frame(cp));
    const tick = G.PH * 0.05;
    const bl = 2 * tick + (G.yB - G.yA) + 10;
    nodes.bracket = {'stroke-dashoffset': r(bl * (1 - seg(a, ...W.bracket)))};
    if (L.varChip) { nodes.varg = {opacity: r(done ? seg(u, ...W.varChip) : 0, 3)}; nodes['var-lead'] = nodes.varg; }
    if (p.finalState === 'convergence-disputed') nodes.dispute = {opacity: r(done ? seg(u, ...W.dispute) : 0, 3)};
    const lg = seg(u, ...W.legend);
    for (const b of L.bandNodes) {
      const pr = b.when === 'legend' ? lg : b.when === 'key' ? seg(u, ...W.key) : done ? seg(u, ...W[b.when]) : 0;
      nodes[`band-${b.key}`] = {opacity: r(pr, 3)};
    }
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      roll: r(f, 3), conn: r(cp, 3),
      cartA: {x: r(cx), y: r(G.yA)}, cartB: {x: r(cx), y: r(G.yB)},
      atBarrier: f >= 1,
      allReached, actorA: {x: acts[0].x, y: r(G.yA)}, actorB: {x: acts[1].x, y: r(G.yB)}, handA: acts[0].hand, handB: acts[1].hand,
      // the trolleys never pass their barriers (nothing reaches the event physically)
      beforeBarrier: cx < G.xb - G.cartW * 0.5,
      nA: M.nA, nB: M.nB,
      lanes: L.places.map(q => q.lane),
      beside: L.places.map(q => q.x > G.xs && q.x < G.xe && Math.abs(q.y - G.stand(q.lane)) < 0.5),
      kinds: L.links.map(lk => lk.kind),
      hops,
      bracket: r(seg(a, ...W.bracket), 3),
      varShown: done && seg(u, ...W.varChip) >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      actionCapped: p.actionProgress < 1 && u > capU,
      lit: M.entries.map(e => Boolean(nodes[`rec-hl-ev${e.i}`] && nodes[`rec-hl-ev${e.i}`].opacity)),
      layout: {PH: r(L.PH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, mode: L.mode, why: L.why},
      ...(L.problems ? {problems: L.problems} : {}),
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
    slug: 'causation-09-story',
    title: 'Affected person\'s contribution — two identical trolleys roll along two parallel lanes toward one fictional event; the convergence is only a supplied description',
    titleEs: 'Contribución de la persona afectada — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Contribución de la persona afectada',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two parallel lanes of identical size and colour cross a slab toward one fictional event pad (a vase lying on it, the loss shown only as an object). An identical trolley waits at each lane start — ● for the conduct of A, ◆ for the conduct of B, the affected person; both roll at the same time and speed to identical barriers, and each supplied step beside a lane hops as its trolley passes. Two connectors then draw together from the lane ends to the event as a plain relation, and a brace carries the event and the loss as supplied. Nothing is weighed, shared out or decided; no conclusion is drawn.',
    tags: ['causation', 'affected person', 'two conducts', 'parallel lanes', 'convergence as supplied', 'equal weight', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/contribucion-afectada.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
