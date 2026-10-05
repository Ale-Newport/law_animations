/**
 * LAW-0709 — Alcance del daño · story
 *
 * Storyboard (oblique top view of one round ground plate; objects only — no
 * person is drawn and nobody is injured):
 *  0.00–0.15 rest     Event A (a tipped crate on its pad) stands at the centre
 *                     of the plate; the SUPPLIED consequences (generic objects)
 *                     stand around it; beside it the record lists them, each
 *                     row with its object's icon. No ring yet; both posts lie
 *                     flat (hidden).
 *  0.15–0.42 begin    The rows supplied as immediate light; the INNER ring
 *                     grows out of the event's pad to its radius (0.16–0.27),
 *                     each object it reaches gives a small hop, and the ● post
 *                     rises on its rim (0.26–0.31). The rows supplied as
 *                     subsequent light.
 *  0.42–0.73 complete The OUTER ring grows from the inner ring to its radius
 *                     (0.33–0.56), its objects hop as it reaches them, and the ◆
 *                     post rises (0.55–0.60) — identical stroke, colour, height
 *                     and weight for both rings and posts. A solid bracket joins
 *                     the two post heads (0.63–0.67) and carries "<grouping>: n
 *                     in the inner ring · m in the outer ring" (0.67–0.72).
 *  0.73–1.00 hold     Status "Grouping shown as supplied" (or, when supplied,
 *                     marked disputed — never decided), notes and the key "As
 *                     supplied · no conclusion drawn". The rings are only the
 *                     supplied grouping: the inner ring holds "Immediate
 *                     consequence (as supplied)", the outer ring "Subsequent
 *                     consequence (as supplied) — to be examined", neither
 *                     excluded, faded, struck or coloured differently. No
 *                     doctrine, test, liability, amount or outcome is stated.
 * Wide boxes: the plate left, record right (band below or in the record's
 * column). Tall boxes: the plate above the record. Square boxes may put the
 * grouping chip and the record in a right-hand column; with long texts ('list')
 * the legend continues as a compact list in that column and under the plate.
 * Layout engine copied from LAW-0705 (accepted causation-07 story).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0709
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, num, obj, list, oneOf, annotation} from '../../schemas/fields.js';
import {
  adFields, AD_STRINGS, AD_DEFAULTS, AD_ES_DEFAULTS, resolveAD, entryRow, groupingText, linkNotes, altText,
  FIELD, ringD, fieldGeom, fieldW, fieldH, itemPlaces, plateArt, ringArt, postArt, eventArt, itemArt, glueN, unwidow, floorArt,
  iconChip, flowRows, recordMeasure, recordBuild, chipG, linkIcon, adIcon,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/alcance-dano.js';

const ID = 'LAW-0709';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  legend: [0, 0.04], litA: [0.15, 0.29], ring1: [0.16, 0.27], post1: [0.26, 0.31], litB: [0.31, 0.6], ring2: [0.33, 0.56], post2: [0.55, 0.6],
  bracket: [0.63, 0.67], varChip: [0.67, 0.72], dispute: [0.74, 0.77],
  status: [0.76, 0.8], notes: [0.78, 0.82], key: [0.8, 0.84],
};
const FINAL = ['grouping-shown', 'grouping-disputed'];

const sceneSchema = {
  ...adFields,
  actorLabels: obj('Captions for the two acting parts of the scene', {
    a: str('Caption for the event and its supplied consequences', 70),
    b: str('Caption for the two rings and their posts (the supplied grouping)', 70),
  }),
  objectLabels: obj('Labels printed in the scene', {
    record: str('Heading of the record', 60),
    inner: str('Label of the ● inner ring (comparison side A)', 60),
    outer: str('Label of the ◆ outer ring (comparison side B)', 70),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['field', 'record', 'rings']), 0, 2),
  finalState: oneOf('SUPPLIED final state of the grouping: shown as supplied, or marked disputed (never decided)', FINAL),
};

const defaultParams = {
  ...AD_DEFAULTS,
  actorLabels: {a: 'Event A and its consequences as supplied', b: 'Rings: the supplied grouping, inner and outer'},
  objectLabels: {record: '', inner: '', outer: ''},
  actionProgress: 1,
  annotations: [{target: 'rings', text: 'The rings only show the grouping as supplied'}],
  finalState: 'grouping-shown',
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...AD_ES_DEFAULTS,
  actorLabels: {a: 'El evento A y sus consecuencias aportadas', b: 'Anillos: la agrupación aportada, interior y exterior'},
  annotations: [{target: 'rings', text: 'Los anillos solo muestran la agrupación según lo aportado'}],
};

const strings = {
  en: {...AD_STRINGS.en, shown: 'Grouping shown as supplied', disputedState: 'Grouping disputed (as supplied) · undecided'},
  es: {...AD_STRINGS.es, shown: 'Agrupación mostrada según lo aportado', disputedState: 'Agrupación discutida (según lo aportado) · sin decidir'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, modes: ['side', 'split'], hMin: 250},
  square: {size: 24, minSize: 17, modes: ['tall', 'side', 'split', 'below', 'below2'], hMin: 160},
  portrait: {size: 25, minSize: 17, modes: ['below', 'below2', 'side', 'split'], hMin: 250},
};
const RW_ = fieldW(), RH_ = fieldH();
// height of the bracket above the field's top (× PH), for a grouping chip standing above it
const TOPX = FIELD.post + FIELD.head + 0.1 - (RH_ - FIELD.plate - FIELD.RG * FIELD.K) + 0.04;

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
  out.push({key: 'inner', icon: 'inner', text: p.objectLabels.inner || t.inner, when: 'legend'});
  out.push({key: 'outer', icon: 'outer', text: p.objectLabels.outer || t.outer, when: 'legend'});
  out.push({key: 'object', icon: 'event', text: `${p.origin.name} · ${t.rings}`, when: 'legend'});
  if (p.losses[1]) out.push({key: 'loss1', icon: 'grouping', text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'legend'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: altText(ctx, a), when: 'legend'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, when: 'legend'}));
  if (allOn && p.actorLabels.a) out.push({key: 'actA', icon: 'event', text: p.actorLabels.a, when: 'legend'});
  if (allOn && p.actorLabels.b) out.push({key: 'actB', icon: 'rings', text: p.actorLabels.b, when: 'legend'});
  late.push({key: 'status', icon: 'grouping', text: p.finalState === 'grouping-disputed' ? t.disputedState : t.shown, when: 'status'});
  if (allOn) p.annotations.forEach((a, i) => late.push({key: `note${i}`, icon: a.target === 'record' ? 'record' : a.target === 'field' ? 'event' : 'rings', text: a.text, when: 'notes'}));
  late.push({key: 'key', text: t.key, when: 'key'});
  return [...late, ...out];
}

function bandFlow(ctx, base, size, w, from, to, half, legendFirst = false) {
  const key = `${size}|${Math.round(w)}|${from}|${to}|${half}|${legendFirst}`;
  let b = base.memo.band.get(key);
  if (!b) {
    const mw = half ? (w - 18) / 2 : Math.min(w, 760);
    const sz = [];
    for (let i = from; i < to; i++) {
      const ck = `${size}|${Math.round(mw)}|${i}`;
      let c = base.memo.chip.get(ck);
      if (!c) { c = {it: base.band[i], ...iconChip(ctx, base.band[i], {size, maxW: mw, maxLines: 3})}; base.memo.chip.set(ck, c); }
      sz.push(c);
    }
    // (legendFirst: the rows shown from the first frame sit directly under the record, the late rows below them)
    if (legendFirst) sz.sort((a0, b0) => (a0.it.when === 'legend' ? 0 : 1) - (b0.it.when === 'legend' ? 0 : 1));
    const fl = flowRows(sz, {x: 0, y: 0, w, gap: 18, rowGap: 10});
    b = {sz, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad) || sz.some(q => q.w > w + 0.5)};
    base.memo.band.set(key, b);
  }
  return b;
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
      if (y + c.h <= S.y + S.h + 0.5) { placed.push({c, x: S.x, y}); y += c.h + gap; break; }
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
  const items = [...legend, ...late];
  const phMax = Math.min((full - 330) / RW_, (D.h - 16) / RH_);
  for (let PH = Math.floor(phMax); PH >= hMin; PH -= 2) {
    const stageW = RW_ * PH + 20;
    const cw = Math.floor((full - stageW - 30) / 10) * 10;
    if (cw < 300) continue;
    const dc = varChip(ctx, base, size, cw);
    if (dc && (dc.fit.truncated || dc.fit.broken)) continue;
    const RW = cw - 20;
    const recKey = `${size}|${RW}|4`;
    const rec = base.memo.rec.get(recKey) || recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, text: textOn, maxLines: 4});
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
  const rec = base.memo.rec.get(recKey) || recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, text: textOn, maxLines: cfg.maxLines ?? 3});
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
  if (cfg.dry) return {PH, size, cfg: {...cfg, dry: false}};
  return {PH, size, cfg, rec, recW, recH, A, B, dc, mode, colH, stageW, stageH: stageH(PH), wsCol, full, chipTop};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveAD(p);
    const base = {M, header: p.objectLabels.record || t.record, rows: recordRows(ctx, p, M), band: bandItems(ctx, p, M), varText: glueN(groupingText(ctx, p, M)), memo: {rec: new Map(), band: new Map(), chip: new Map()}};
    const rws = ctx.view.shape === 'landscape' ? [440, 520, 600, 680] : ctx.view.shape === 'square' ? [300, 340, 380, 440, 500] : [520, 640, 760, Math.floor(ctx.design.w - 2 * MARGIN - 20)];
    const nb0 = base.band.length;
    const ks = [...new Set([1, Math.ceil(nb0 / 3), Math.ceil(nb0 / 2), Math.ceil((2 * nb0) / 3), nb0 - 1].filter(k => k >= 1 && k < nb0))];
    let pick = null;
    const why = [];
    const bySize = new Map();
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      for (const mode of SH.modes) for (const RW of rws) for (const maxLines of [3, 4]) for (const half of [false, true]) for (const vw of [0, 1, 2]) for (const k of mode === 'split' ? ks : mode === 'tall' ? [...Array(nb0 + 1).keys()] : [0]) {
        const X = compose(ctx, base, {mode, size, RW, maxLines, half, vw, k, hMin: SH.hMin, dry: true});
        if (!X.cfg) { why.push(`${mode}${k || ''}/${RW}@${size}:${X.bad}${X.PH ? Math.round(X.PH) : ''}`); continue; }
        if (globalThis.__dbg) globalThis.__dbg.push(`${mode}${k || ''}/${RW}/h${half ? 1 : 0}/v${vw}/m${maxLines}@${size}:PH${Math.round(X.PH)}`);
        const b0 = bySize.get(size);
        if (!b0 || X.PH > b0.PH + 1e-6) bySize.set(size, X);
      }
      if (ctx.view.shape !== 'square' && bySize.size) {
        const first = [...bySize.values()][0];
        if (size < Math.max(first.size - 3, Math.min(first.size, 20)) - 1e-9 && !globalThis.__dbg) break;
      }
    }
    // the field (plate, event, objects, posts) stays >= 0.21 of the frame height when any configuration allows it
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
      } else {
        // text at >= 20 (the 19.5 px baseline floor) wins unless it costs more than a fifth of the field's size
        const best = cands.reduce((a0, b0) => (b0.PH > a0.PH + 1e-6 ? b0 : a0));
        const c20 = cands.filter(c => c.size >= 20 - 1e-9);
        const best20 = c20.length ? c20.reduce((a0, b0) => (b0.PH > a0.PH + 1e-6 ? b0 : a0)) : null;
        pick = best20 && best20.PH >= 0.9 * best.PH ? best20 : best;
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
        const lp = l20 || ls.sort((a, b) => b.PH - a.PH || b.size - a.size)[0];
        if (!L || lp.PH > L.PH) { L = lp; pick = lp; }
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
    L.why = why.filter(w0 => /@17:/.test(w0) || globalThis.__whyAll).slice(-24);
    L.M = M;
    const full = Dv.w - 2 * MARGIN;
    const PH = L.PH;
    let cx, F, recX, recY, recFloor = null;
    const bands = [];
    const colH = (L.A && L.A.h ? L.A.h + 20 : 0) + L.recH;
    if (L.mode === 'list') {
      const bottom = Math.max(L.stageH, L.colH, L.list.placed.length ? L.list.bottom : 0);
      const top = Math.max(0, (Dv.h - bottom) / 2);
      F = top + L.stageH - 16;
      cx = MARGIN + 10;
      L.colX = MARGIN + full - L.recW;
      L.colTop = top;
      recX = L.colX + 10;
      recY = top + (L.dc ? L.dc.box.h + 22 : 0) + L.rec.clipH * 0.35;
      L.listTop = top;
    } else if (L.mode === 'tall') {
      const blockH = L.stageH + (L.B.h ? 16 + L.B.h : 0);
      const top = Math.max(0, (Dv.h - blockH) / 2);
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
      const top = Math.max(0, (Dv.h - blockH) / 2);
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
      const top = Math.max(0, (Dv.h - blockH) / 2);
      F = top + L.stageH - 16;
      cx = MARGIN + (full - L.stageW) / 2 + 10;
      recX = MARGIN + (full - L.recW) / 2 + 10;
      recY = F + 32 + L.rec.clipH * 0.35;
      if (L.B.h) bands.push({band: L.B, x: MARGIN, y: recY - L.rec.clipH * 0.35 + L.recH + 34, w: full, center: true});
    }
    L.F = F;
    const G = fieldGeom(cx, F, PH);
    L.cx = G.cx;
    L.G = G;
    L.places = itemPlaces(G, M);
    L.ringW = Math.max(5, PH * 0.028);
    // the bracket joins the two post heads; the grouping chip hangs beside the field (or heads the right-hand column)
    L.bx = [G.postX1, G.postX2];
    if (L.dc) {
      const disputed = p.finalState === 'grouping-disputed';
      const endX = L.bx[1] + Math.max(G.headS * 0.6 + 4, disputed ? L.size * 1.9 : 0);
      if (L.chipTop) {
        const mid = (L.bx[0] + L.bx[1]) / 2;
        const w0 = L.dc.box.w;
        const chipX = clamp(mid - w0 / 2, MARGIN, Dv.w - MARGIN - w0);
        const y0 = G.bracketY - 14 - L.dc.box.h;
        const c = chipG(ctx, L.dc.text, {x: chipX, y: y0, maxWidth: L.dc.box.w + 1, size: L.size, maxLines: 5, fill: th.card, stroke: th.accent2, name: 'var-chip'});
        L.varChip = c;
        L.varLead = `M${r(mid)} ${r(G.bracketY - 2)}V${r(y0 + c.box.h)}`;
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
    const G = L.G;
    const legX = [L.recX + L.rec.w * 0.2, L.recX + L.rec.w * 0.8];
    const railY = L.recNode.box.y + L.recNode.box.h;
    const easel = L.recFloor === null ? null : g({name: 'easel'},
      legX.map(x => h('path', {d: `M${r(x)} ${r(railY - 6)}L${r(x + (x < L.recX + L.rec.w / 2 ? -1 : 1) * L.size)} ${r(L.recFloor)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.35)), 'stroke-linecap': 'round'})));
    const dispute = p.finalState === 'grouping-disputed'
      ? g({name: 'dispute', opacity: 0, transform: T(L.bx[1] + L.size * 1.0, G.bracketY)}, linkIcon(ctx, {cx: 0, cy: 0, s: L.size * 1.5, disputed: true}))
      : null;
    const x0f = G.x0 - 10;
    const x1f = L.mode === 'tall' || L.mode === 'list' ? G.x1 + 10 : L.mode.startsWith('below') ? (L.varChip ? L.varChip.box.x + L.varChip.box.w + 16 : G.x1 + 10) : L.recX + L.rec.w + 20;
    const tick = G.headY - G.headS * 0.55 - 3;
    const bD = `M${r(L.bx[0])} ${r(tick)}V${r(G.bracketY)}H${r(L.bx[1])}V${r(tick)}`;
    const bl = Math.abs(L.bx[1] - L.bx[0]) + 2 * (tick - G.bracketY) + 10;
    // the objects and both posts, back to front
    const stand = [
      {y: G.cy, node: g({name: 'event', transform: T(G.cx, G.cy)}, eventArt(ctx, {s: G.PH}))},
      ...L.places.map(q => ({y: q.y, node: g({name: `item${q.i}`, transform: T(q.x, q.y)}, itemArt(ctx, {i: q.i, s: G.itemS}))})),
      {y: G.cy + 0.01, node: g({name: 'post1', transform: T(G.postX1, G.cy, 0, 1, 0.01), opacity: 0}, postArt(ctx, {name: 'p1', G, side: 'before'}))},
      {y: G.cy + 0.02, node: g({name: 'post2', transform: T(G.postX2, G.cy, 0, 1, 0.01), opacity: 0}, postArt(ctx, {name: 'p2', G, side: 'after'}))},
    ].sort((a, b) => a.y - b.y);
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      floorArt(ctx, {name: 'floor', x0: x0f, x1: x1f, floorY: L.F}),
      L.mode.startsWith('below') ? floorArt(ctx, {name: 'floor2', x0: L.recX - (L.mode === 'below2' ? 12 : 30), x1: L.recX + L.rec.w + (L.mode === 'below2' ? 12 : 30), floorY: L.recNode.box.y + L.recNode.box.h + 8}) : null,
      g({name: 'field'},
        plateArt(ctx, {name: 'plate', G}),
        g({name: 'ring1', transform: T(G.cx, G.cy), opacity: 0}, ringArt(ctx, {name: 'r1', R: 0, w: L.ringW})),
        g({name: 'ring2', transform: T(G.cx, G.cy), opacity: 0}, ringArt(ctx, {name: 'r2', R: 0, w: L.ringW})),
        stand.map(q => q.node)),
      h('path', {name: 'bracket', d: bD, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(bl)} ${r(bl + 20)}`, 'stroke-dashoffset': r(bl)}),
      L.varChip ? h('path', {name: 'var-lead', d: L.varLead, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linejoin': 'round', opacity: 0}) : null,
      L.varChip ? g({name: 'varg', opacity: 0}, L.varChip.node) : null,
      dispute,
      easel,
      L.recNode.node,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G, M = L.M;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    // the inner ring grows out of the event's pad; the outer ring grows out of the inner ring (same stroke and weight)
    const s1 = ease.inOutCubic(seg(a, ...W.ring1)), s2 = ease.inOutCubic(seg(a, ...W.ring2));
    const rad1 = lerp(FIELD.ev * G.PH, G.R1, s1), rad2 = lerp(G.R1, G.R2, s2);
    nodes.ring1 = {opacity: a >= W.ring1[0] ? 1 : 0};
    nodes.ring2 = {opacity: r(seg(a, W.ring2[0], W.ring2[0] + 0.02), 3)};
    const d1 = ringD(s1 > 0 || a >= W.ring1[0] ? rad1 : 0), d2 = ringD(s2 > 0 || a >= W.ring2[0] ? rad2 : 0);
    nodes['r1-o'] = {d: d1}; nodes['r1-i'] = {d: d1}; nodes['r2-o'] = {d: d2}; nodes['r2-i'] = {d: d2};
    // each object gives a small hop as its ring reaches it (labels hidden, the grouping still reads)
    const hopH = G.PH * 0.06, hopW = G.PH * 0.16;
    const hops = L.places.map(q => {
      const rr = q.ring === 'inner' ? G.rIn : G.rOut;
      const rad = q.ring === 'inner' ? (s1 > 0 ? rad1 : 0) : (s2 > 0 ? rad2 : 0);
      const k = clamp((rad - (rr - hopW / 2)) / hopW);
      const hop = rad > 0 && k > 0 && k < 1 ? Math.sin(Math.PI * k) : 0;
      nodes[`item${q.i}`] = {transform: T(q.x, q.y - hop * hopH)};
      return r(hop, 3);
    });
    const p1 = ease.outBack ? ease.outBack(seg(a, ...W.post1)) : ease.outCubic(seg(a, ...W.post1));
    const p2 = ease.outBack ? ease.outBack(seg(a, ...W.post2)) : ease.outCubic(seg(a, ...W.post2));
    const q1 = seg(a, ...W.post1), q2 = seg(a, ...W.post2);
    nodes.post1 = {transform: T(G.postX1, G.cy, 0, 1, r(Math.max(0.01, q1 >= 1 ? 1 : p1), 4)), opacity: q1 > 0 ? 1 : 0};
    nodes.post2 = {transform: T(G.postX2, G.cy, 0, 1, r(Math.max(0.01, q2 >= 1 ? 1 : p2), 4)), opacity: q2 > 0 ? 1 : 0};
    const tick = G.headY - G.headS * 0.55 - 3;
    const bl = Math.abs(L.bx[1] - L.bx[0]) + 2 * (tick - G.bracketY) + 10;
    nodes.bracket = {'stroke-dashoffset': r(bl * (1 - seg(a, ...W.bracket)))};
    if (L.varChip) { nodes.varg = {opacity: r(done ? seg(u, ...W.varChip) : 0, 3)}; nodes['var-lead'] = nodes.varg; }
    if (p.finalState === 'grouping-disputed') nodes.dispute = {opacity: r(done ? seg(u, ...W.dispute) : 0, 3)};
    // record: the rows supplied as immediate light first, then the rows supplied as subsequent
    const litA = seg(a, ...W.litA), litB = seg(a, ...W.litB);
    M.entries.forEach(e => {
      const on = e.ring === 'inner' ? litA > 0 && litA < 1 : litB > 0 && litB < 1;
      nodes[`rec-hl-ev${e.i}`] = {opacity: on ? 1 : 0};
    });
    const lg = seg(u, ...W.legend);
    for (const b of L.bandNodes) {
      const pr = b.when === 'legend' ? lg : b.when === 'key' ? seg(u, ...W.key) : done ? seg(u, ...W[b.when]) : 0;
      nodes[`band-${b.key}`] = {opacity: r(pr, 3)};
    }
    const growing = s2 > 0 ? 2 : 1;
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      ring1: r(s1, 3), ring2: r(s2, 3), post1: r(q1, 3), post2: r(q2, 3),
      radius1: r(s1 > 0 ? rad1 : 0, 1), radius2: r(s2 > 0 ? rad2 : 0, 1),
      nIn: M.nIn, nOut: M.nOut,
      rings: L.places.map(q => q.ring),
      inside: L.places.map(q => (q.ring === 'inner' ? Math.hypot(q.x - G.cx, (q.y - G.cy) / G.K) < G.R1 : Math.hypot(q.x - G.cx, (q.y - G.cy) / G.K) > G.R1 && Math.hypot(q.x - G.cx, (q.y - G.cy) / G.K) < G.R2)),
      hops,
      bracket: r(seg(a, ...W.bracket), 3),
      varShown: done && seg(u, ...W.varChip) >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      actionCapped: p.actionProgress < 1 && u > capU,
      edge: {x: r(G.cx + (growing === 2 ? rad2 : s1 > 0 ? rad1 : 0)), y: r(G.cy)},
      lit: M.entries.map(e => Boolean(nodes[`rec-hl-ev${e.i}`].opacity)),
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
    slug: 'causation-08-story',
    title: 'Scope of damage — two rings grow around a fictional event and group its supplied consequences, inner and outer, only as supplied',
    titleEs: 'Alcance del daño — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Alcance del daño',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A fictional event (Event A, a tipped crate) stands at the centre of a round plate with its supplied consequences — generic objects — around it. An inner ring grows out of the event and a ● post rises on it; an outer ring grows out of the inner ring and a ◆ post rises; each object hops as its ring reaches it. Both rings and posts have identical stroke, colour and weight: the inner ring holds the consequences supplied as immediate, the outer ring those supplied as subsequent, to be examined. A bracket carries the grouping as supplied. Objects only; nothing is tested, valued or decided, and no conclusion is drawn.',
    tags: ['causation', 'scope of damage', 'immediate consequence', 'subsequent consequence', 'rings', 'grouping as supplied', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/alcance-dano.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
