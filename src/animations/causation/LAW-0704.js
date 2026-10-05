/**
 * LAW-0704 — Pérdida económica · inspect
 *
 * Storyboard (the state the flow produced; one real lens; one datum changes):
 *  0.00–0.20 build       The context: the balance column after the supplied
 *                        flows, under its hopper — the stack of tokens, a ●
 *                        arm at the reference level (as stated) and a ◆ arm at
 *                        the alleged-scenario level, a soft band and a solid
 *                        bracket for the stated gap between them. On a string
 *                        from the bracket hangs a value tag: the heading of the
 *                        stated difference and its supplied value ("120 units
 *                        (fictional) · as stated"). Beside it the flow record
 *                        (entries and the model scale — never the value).
 *  0.20–0.45 isolate     The record and captions step out, the scene's tag value
 *                        leaves, and an opaque lens appears EXACTLY over its
 *                        source (a real copy of the tag, the bracket and the top
 *                        of the stack, drawn in the same coordinates) and grows
 *                        into the freed room to ≥ 1.5× the rest size; guides stay
 *                        anchored to the source frame and the lens.
 *  0.45–0.75 substitute  The old value is struck (0.45–0.49), lifts away
 *                        (0.52–0.555) and the alternative value fades in
 *                        (0.56–0.595). Only the dependent geometry changes with
 *                        it: the ◆ arm, the band and the bracket move to the
 *                        alternative gap, and the tokens between the two levels
 *                        lift out of (or drop into) the stack. The new value is
 *                        still from 0.595 to 0.76.
 *  0.75–1.00 return      The lens shrinks back onto its source; the context
 *                        regrows before any text returns; then the tag value,
 *                        record and band come back, a neutral Δ marker marks the
 *                        changed tag, "Before: <old>" (struck) / "After: <new>"
 *                        keep the old value traceable, with the key "As supplied
 *                        · no conclusion drawn". Nothing is valued, computed or
 *                        owed; no damages, compensation, liability, fault or
 *                        causation is inferred. Seeking back restores the old
 *                        datum exactly.
 * Timings, the side (slide) and stack (step back) patterns and the lens rules
 * follow LAW-0700; the lens copy's value text shows only while it is drawn at
 * ≥ 19.5 px.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0704
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields, obj, int} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  peFields, PE_STRINGS, resolvePE, entryText, linkNotes, columnGeom, columnArt, hopperArt, tokenArt, levelMarker, floorArt,
  iconChip, flowRows, recordMeasure, recordBuild, fitG, sideMark, amountText, MAX_TOKENS, clamp, ease, lerp, r, seg,
  localizeScene, PE_ES_DEFAULTS,
} from './kits/perdida-economica.js';

const ID = 'LAW-0704';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_SIDE = {
  ctxIn: [0, 0.02], textIn: [0, 0.04],
  textOut: [0.195, 0.21], shift: [0.195, 0.222], tagOut: [0.212, 0.222], open: [0.2225, 0.31], guides: [0.3, 0.34],
  strike: [0.45, 0.49], oldOut: [0.52, 0.555], geo: [0.52, 0.58], newIn: [0.56, 0.595],
  close: [0.76, 0.8], tagIn: [0.8, 0.815], shiftBack: [0.8, 0.83], textBack: [0.83, 0.86], marker: [0.84, 0.87], trace: [0.85, 0.89], key: [0.86, 0.9],
};
const W_STACK = {...W_SIDE,
  textOut: [0.21, 0.222], tagOut: [0.203, 0.209], shrink: [0.205, 0.222], open: [0.2225, 0.27],
  close: [0.765, 0.795], regrow: [0.78, 0.8], tagIn: [0.8, 0.81], textBack: [0.8, 0.82],
  marker: [0.82, 0.85], trace: [0.83, 0.87], key: [0.84, 0.88],
};
const TARGETS = ['difference-tag'];
// the lens copy's text shows only while drawn at >= this size (px at 1080p; baseline floor)
const LENS_TEXT_MIN = 19.5;

const strings = {
  en: {...PE_STRINGS.en, context: 'The balance column and its flow record, as supplied', marker: 'Changed datum', beforeV: 'Before', afterV: 'After'},
  es: {...PE_STRINGS.es, context: 'La columna de saldo y su registro de flujos, según lo aportado', marker: 'Dato cambiado', beforeV: 'Antes', afterV: 'Después'},
};

const sceneSchema = {
  ...peFields,
  ...inspectFields(TARGETS),
  statedGap: obj('Fictional amounts of the stated difference shown with each value (model unit); only this geometry changes with the datum', {
    before: int('Amount drawn with the before value', 0, 9999),
    after: int('Amount drawn with the after value', 0, 9999),
  }),
};

const defaultParams = {
  events: [
    {label: 'Shop takings received', time: 'Month 1', dir: 'in', amount: 200},
    {label: 'Supplier invoice paid', time: 'Month 1', dir: 'out', amount: 60},
    {label: 'Shop takings received', time: 'Month 2', dir: 'in', amount: 160},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Stated difference (as stated by the shop)', amount: 120}],
  model: {unit: '', perToken: 0},
  focusTarget: 'difference-tag',
  beforeValue: '120 units (fictional) · as stated',
  afterValue: '80 units (fictional) · as stated',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'The balance column and its flow record, as supplied', marker: 'Changed datum'},
  statedGap: {before: 120, after: 80},
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...PE_ES_DEFAULTS,
  beforeValue: '120 unidades (ficticio) · según lo declarado',
  afterValue: '80 unidades (ficticio) · según lo declarado',
  contextLabels: {context: 'La columna de saldo y su registro de flujos, según lo aportado', marker: 'Dato cambiado'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['side']},
  square: {size: 24, minSize: 17, arr: ['stack', 'side']},
  portrait: {size: 25, minSize: 17, arr: ['stack']},
};
// zone geometry (× OH, the height of hopper + column + stand)
const ZG = {col: 0.72, stand: 0.07, hopGap: 0.03, hopH: 0.15, br: 0.07, arm: 0.1};

/** Frame size in design units (the design space is fitted into the caption-safe box). */
function frameUnits(ctx) {
  const v = ctx.view, D = ctx.design;
  const s = Math.min(v.content.w / D.w, v.content.h / D.h);
  return {w: v.width / s, h: v.height / s, short: Math.min(v.width, v.height) / s};
}

/** The value tag: heading (the stated difference as labelled) + the value (before / after), one width. */
function tagMeasure(ctx, p, size, w, textOn) {
  const pad = size * 0.6;
  // (the heading keeps clear of the tag's hole ring in the top-right corner)
  const fh = textOn ? fitG(ctx, p.losses[0].label, {maxWidth: w - 2 * pad - size * 1.3, size, minSize: size, maxLines: 4, weight: 600}) : null;
  const fb = textOn ? fitG(ctx, p.beforeValue, {maxWidth: w - 2 * pad, size, minSize: size, maxLines: 6, weight: 700}) : null;
  const fa = textOn ? fitG(ctx, p.afterValue, {maxWidth: w - 2 * pad, size, minSize: size, maxLines: 6, weight: 700}) : null;
  const headH = textOn ? fh.height + size * 0.45 : size * 1.1;
  const textH = textOn ? Math.max(fb.height, fa.height) : size * 2;
  const hole = size * 0.9;
  const bad = textOn && [fh, fb, fa].some(f => f.truncated || f.broken);
  return {w, pad, hole, fh, fb, fa, headH, h: hole + headH + textH + pad * 1.6, bad};
}

/** Tag art at (x, y) (top-left); names prefixed with P. Value groups: P-vb (before), P-va (after), P-strike. */
function tagArt(ctx, m, x, y, P, textOn) {
  const th = ctx.theme;
  const {w, pad, hole} = m;
  const card = h('path', {d: `M${r(x)} ${r(y)}H${r(x + w - hole * 0.9)}L${r(x + w)} ${r(y + hole * 0.9)}V${r(y + m.h)}H${r(x)}Z`, fill: '#fbf3dc', stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'});
  const ring = h('circle', {cx: r(x + w - hole * 0.95), cy: r(y + hole * 0.95), r: r(hole * 0.24), fill: th.paper, stroke: th.ink, 'stroke-width': 2});
  const hy = y + hole * 0.9;
  const ty = hy + m.headH + pad * 0.2;
  let head, vb, va, strike = null;
  if (textOn) {
    head = textBlock(m.fh, {x: x + pad, y: hy, fill: th.inkSoft, name: `${P}-head`});
    vb = g({name: `${P}-vb`}, textBlock(m.fb, {x: x + pad, y: ty, fill: th.ink, name: `${P}-vbt`}));
    va = g({name: `${P}-va`, opacity: 0}, textBlock(m.fa, {x: x + pad, y: ty, fill: th.ink, name: `${P}-vat`}));
    const lines = m.fb.lines.map((ln, i) => ({x: x + pad, y: ty + i * m.fb.lineHeight + m.fb.size * 0.5, w: ctx.measure(ln.replace(/ /g, ' '), m.fb.size, m.fb.weight, m.fb.family)}));
    strike = g({name: `${P}-strike`, opacity: 0}, lines.map((ln, i) => h('path', {name: `${P}-st${i}`, d: `M${r(ln.x - 3)} ${r(ln.y)}H${r(ln.x + ln.w + 3)}`, stroke: th.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(ln.w + 6)} ${r(ln.w + 20)}`, 'stroke-dashoffset': r(ln.w + 6)})));
    m.strikeLines = lines;
  } else {
    const bar = (ww, yy, o = 0.6) => h('path', {d: `M${r(x + pad)} ${r(yy)}H${r(x + pad + ww)}`, stroke: th.inkSoft, 'stroke-width': r(m.hole * 0.3), 'stroke-linecap': 'round', opacity: o});
    head = bar((w - 2 * pad) * 0.5, hy + pad * 0.6, 0.35);
    vb = g({name: `${P}-vb`}, bar((w - 2 * pad) * 0.8, ty + pad * 0.6), bar((w - 2 * pad) * 0.45, ty + pad * 1.6));
    va = g({name: `${P}-va`, opacity: 0}, bar((w - 2 * pad) * 0.6, ty + pad * 0.6), bar((w - 2 * pad) * 0.7, ty + pad * 1.6));
  }
  return {node: g({name: P}, card, ring, g({name: `${P}-vals`}, head, vb, va, strike)), hole: {x: x + w - hole * 0.95, y: y + hole * 0.95}, box: {x, y, w, h: m.h}};
}

/** Level (y, zone-local) of n tokens on a column C. */
const levelY = (C, n) => (n > 0 ? C.baseY - n * C.tk : C.baseY);

/**
 * Zone geometry at height OH (zone-local: x from the zone's left edge, y from the floor line, up negative).
 * [tag on a string] [bracket] [column under its hopper, ● / ◆ arms on the right] ([record on an easel] in wide boxes).
 */
function zoneGeom(M, gaps, OH, tg, rec, RW, arr, minW) {
  const CH = ZG.col * OH;
  const cw = CH * 0.42;
  const armS = Math.max(18, OH * 0.055);
  const brW = ZG.br * OH;
  let colX0 = tg.w + 26 + brW;
  const baseY = -ZG.stand * OH;
  let C = columnGeom(colX0 + cw / 2, baseY, CH);
  const armEnd = C.x1 + ZG.arm * OH + armS * 1.3;
  const refY = levelY(C, M.refTokens);
  const allY = gaps.map(n => levelY(C, M.refTokens - n));
  const colTop = C.top - 10;
  const zoneTop = colTop - (ZG.hopGap + ZG.hopH) * OH;
  let recX = null, recY = null, recTop = 0;
  let right = armEnd + 12;
  if (arr === 'side') {
    recX = armEnd + 40;
    recY = -OH * 0.18 - (rec.h + 14);
    recTop = recY - rec.clipH * 0.35;
    right = recX + RW + 20;
  }
  if (right < minW) right = minW;
  // the tag hangs level with the stated gap (clamped inside the column's height)
  const mid = (refY + Math.max(...allY)) / 2;
  // (never below the floor: a tag taller than the column rises above the hopper and the zone grows with it)
  const tagY = Math.min(-tg.h - 12, Math.max(zoneTop + 4, mid - tg.h / 2));
  // (the Δ marker later sits on the tag's top-left corner, raised by up to ~1.4 hole heights)
  const top = Math.min(zoneTop, tagY - tg.hole * 1.45, arr === 'side' ? recTop : 0);
  return {CH, C, colX0, brX: C.x0 - brW, armEnd, armS, refY, allY, recX, recY, tagX: 0, tagY, zoneTop, zW: right + 6, zH: -top + 16, top};
}

function compose(ctx, base, cfg) {
  const D = ctx.design;
  const p = ctx.params;
  const {size, RW, tagW, arr} = cfg;
  const textOn = ctx.show('key');
  const memo = base.memo;
  const full = D.w - 2 * MARGIN;
  const FU = frameUnits(ctx);
  const tg = tagMeasure(ctx, p, size, tagW, textOn);
  if (tg.bad && !cfg.force) return {bad: 'tag'};
  const rk = `${size}|${RW}`;
  let rec = memo.rec.get(rk);
  if (!rec) { rec = recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, text: textOn, maxLines: 4}); memo.rec.set(rk, rec); }
  if (rec.bad && !cfg.force) return {bad: 'record'};
  const recW = RW + 20, recH = rec.h + 14 + rec.clipH * 0.35;
  const minCtx = 0.45 * FU.w + 4;
  const flowBand = w => {
    const bk = `${size}|${Math.round(w)}`;
    let b = memo.band.get(bk);
    if (!b) {
      const sz = textOn ? base.band.map(it => ({it, ...iconChip(ctx, it, {size, maxW: Math.min(w, 760), maxLines: 4})})) : [];
      const fl = flowRows(sz, {x: 0, y: 0, w, gap: 16, rowGap: 10});
      b = {sz, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad || q.w > w + 0.5)};
      memo.band.set(bk, b);
    }
    return b;
  };
  const OHmax = arr === 'side' ? (D.h - 20) : D.h;
  let found = null;
  let lastWhy = '';
  for (let OH = Math.min(OHmax, 900); OH >= cfg.hMin; OH *= 0.985) {
    const zg = zoneGeom(base.M, base.gaps, OH, tg, rec, RW, arr, minCtx);
    if (zg.zW > full) { lastWhy = 'zW'; continue; }
    let band, room, blockH;
    const split = Boolean(cfg.split);
    const bandW = split ? Math.floor((arr === 'stack' ? full - recW - 20 : full - zg.zW - 12) / 24) * 24 : full;
    if (bandW < 240) { lastWhy = 'bandW'; continue; }
    band = flowBand(bandW);
    if (band.bad && !cfg.force) { lastWhy = 'band'; continue; }
    if (arr === 'side') {
      blockH = split ? Math.max(zg.zH, band.h) : zg.zH + (band.h ? 16 + band.h : 0);
      if (blockH > D.h) { lastWhy = `blockH${Math.round(blockH)}`; continue; }
      room = {w: full - zg.zW - 12, h: D.h};
      if (room.w < 200) { lastWhy = 'room'; continue; }
      if (split && band.h < 0.35 * D.h) return {bad: 'thin-band'};
    } else {
      blockH = zg.zH + 30 + (split ? Math.max(recH, band.h) : recH + (band.h ? 16 + band.h : 0));
      if (blockH > D.h) { lastWhy = `blockH${Math.round(blockH)}`; continue; }
      // spare height: the context sits high and the record (and band) at the foot of the box, so the scene spans the box
      const top = Math.max(0, (D.h - blockH) * 0.2);
      const sBack = Math.min(1, (0.45 * FU.w + 8) / full);
      room = {w: full, h: D.h - top - zg.zH * sBack - 16, sBack, top};
    }
    // crop: the tag, the bracket, the stated gap at both values and the ● / ◆ arms
    const tk = zg.C.tk;
    const c0 = {x: zg.tagX - 8, y: Math.min(zg.tagY, zg.refY - tk * 1.6) - 8};
    const c1 = {x: zg.armEnd + 8, y: Math.max(zg.tagY + tg.h, Math.max(...zg.allY) + tk * 1.6) + 8};
    let crop = {x: c0.x, y: c0.y, w: c1.x - c0.x, h: c1.y - c0.y};
    const ar = room.w / room.h;
    if (crop.w / crop.h < ar) { const nw = Math.min(crop.h * ar, crop.w * 1.5); crop = {...crop, x: crop.x - (nw - crop.w) * 0.15, w: nw}; }
    else { const nh = Math.min(crop.w / ar, crop.h * 3.6); crop = {...crop, y: crop.y - (nh - crop.h) * 0.3, h: nh}; }
    // (the source frame stays inside the design box: between its top and just under the floor)
    const Floc = arr === 'side' ? Math.max(0, (D.h - blockH) / 2) + (split ? (blockH - zg.zH) / 2 : 0) + zg.zH - 16 : room.top + zg.zH - 16;
    crop.h = Math.min(crop.h, Floc + 8);
    crop.y = Math.min(Math.max(crop.y, -Floc), 8 - crop.h);
    const Z = Math.min(room.w / crop.w, room.h / crop.h);
    const lensMin = Math.min(crop.w, crop.h) * Z;
    if ((Z < 1.55 || lensMin < 0.4 * FU.short + 4) && !cfg.force) { lastWhy = `Z${Z.toFixed(2)}/${Math.round(lensMin)}`; continue; }
    found = {OH, zg, band, room, crop, Z, blockH, split, bandW};
    break;
  }
  if (!found) return {bad: `fit:${lastWhy}`};
  if (cfg.dry) return {OH: found.OH, size, Z: found.Z, cfg: {...cfg, dry: false}};
  return {FU, size, cfg, tg, rec, recW, recH, arr, RW, ...found, ...found.zg};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const M = resolvePE(p);
    const tokOf = a => Math.min(M.refTokens, Math.max(a > 0 ? 1 : 0, Math.round(a / M.per)));
    const gaps = [tokOf(p.statedGap.before), tokOf(p.statedGap.after)];
    const textOn = ctx.show('key');
    const unit = (p.model && p.model.unit) || t.unit;
    // (the trace and key rows come first: they appear late, so the chips shown at rest take the band's last rows)
    const band = [
      {key: 'trB', icon: 'diff', text: `${t.beforeV}: ${p.beforeValue}`, when: 'trace'},
      {key: 'trA', icon: 'diff', text: `${t.afterV}: ${p.afterValue}`, when: 'trace'},
      {key: 'key', text: t.key, when: 'key'},
      {key: 'caption', icon: 'record', text: p.contextLabels.context || t.context, when: 'ctx'},
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged2 : t.proposed})`, when: 'ctx'})),
      ...linkNotes(ctx, M).map(l => ({...l, when: 'ctx'})),
      ...(p.losses[1] ? [{key: 'loss1', icon: 'diff', text: `${t.alsoNoted}: ${p.losses[1].label}${p.losses[1].amount ? ` · ${amountText(ctx, p, p.losses[1].amount)}` : ''}`, when: 'ctx'}] : []),
    ];
    const rows = [
      ...M.entries.map(e => ({key: `ev${e.i}`, icon: e.dir === 'in' ? 'in' : 'out', text: entryText(ctx, p, e)})),
      {key: 'scale', icon: 'scale', text: t.scale.replace('{n}', String(M.per)).replace('{u}', unit)},
    ];
    const base = {M, gaps, header: t.record, rows, band, memo: {rec: new Map(), band: new Map()}};
    const rws = ctx.view.shape === 'portrait' ? [440, 520, 620, 720, 900] : ctx.view.shape === 'square' ? [340, 420, 480, 640, 880] : [420, 480, 540, 600];
    const tws = ctx.view.shape === 'portrait' ? [240, 280, 320, 360] : ctx.view.shape === 'square' ? [180, 210, 240, 270] : [220, 260, 300];
    const hMin = ctx.view.shape === 'square' ? 180 : 220;
    let pick = null, best = null;
    const why = [];
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      if (best && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      for (const arr of SH.arr) for (const RW of rws) for (const tagW of tws) for (const split of [false, true]) {
        const X = compose(ctx, base, {size, RW, tagW, arr, split, hMin, dry: true});
        if (!X.cfg) { why.push(`${arr}/${RW}/${tagW}@${size}:${X.bad}`); continue; }
        if (!best) best = X;
        const sc = X.OH * Math.min(1.2, X.Z / 1.6);
        if (!pick || sc > pick.sc) pick = {...X, sc};
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    let Dv = ctx.design;
    // fallback: a taller virtual box scaled into the real one (flagged); last resort (e.g. the DOM-less text estimator):
    // text and lens limits relaxed, flagged in semantic.problems — never throws
    for (const force of [false, true]) {
      for (let f = 1.1; f <= (force ? 12.01 : 4.01) && !L; f += force ? 0.5 : 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const arr of ['stack', 'side']) for (const tagW of tws) {
          if (L) break;
          const X = compose(c2, base, {size: SH.minSize, RW: rws[rws.length - 1], tagW, arr, hMin: force ? 30 : 80, force});
          if (X.tg) { L = X; Dv = c2.design; if (force) L.problems = ['no-layout-fits']; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(0, 40);
    L.M = M; L.gaps = gaps;
    const full = Dv.w - 2 * MARGIN;
    let zx, F, recX, recY, bandX, bandY, bandW;
    if (L.arr === 'side') {
      const top = Math.max(0, (Dv.h - L.blockH) / 2);
      zx = L.split ? MARGIN + full - L.zW : MARGIN + (full - L.zW) / 2;
      L.zShift = MARGIN + full - L.zW - zx;
      F = top + (L.split ? (L.blockH - L.zH) / 2 : 0) + L.zH - 16;
      recX = zx + L.recX; recY = F + L.recY;
      if (L.split) { bandX = MARGIN; bandW = L.bandW; bandY = top + (L.blockH - L.band.h) / 2; } else { bandX = MARGIN; bandW = full; bandY = top + L.zH + 16; }
    } else {
      const top = L.room.top;
      L.zShift = 0;
      L.sBack = L.room.sBack;
      L.pivot = {x: MARGIN + full / 2, y: top};
      zx = MARGIN + (full - L.zW) / 2;
      F = top + L.zH - 16;
      const lowH = L.split ? Math.max(L.recH, L.band.h) : L.recH + (L.band.h ? 16 + L.band.h : 0);
      const lowTop = Math.max(top + L.zH + 30, Dv.h - lowH);
      recY = lowTop + L.rec.clipH * 0.35;
      if (L.split) {
        recX = MARGIN + 10;
        bandX = MARGIN + L.recW + 20; bandW = L.bandW; bandY = lowTop;
      } else {
        recX = MARGIN + (full - L.recW) / 2 + 10;
        bandX = MARGIN; bandW = full; bandY = recY - L.rec.clipH * 0.35 + L.recH + 16;
      }
    }
    L.F = F; L.zx = zx;
    const wx = x => zx + x, wy = y => F + y;
    const C0 = L.C;
    L.Cw = {...C0, x0: wx(C0.x0), x1: wx(C0.x1), cx: wx(C0.cx), baseY: wy(C0.baseY), top: wy(C0.top), slotY: s => wy(C0.slotY(s))};
    L.refYw = wy(L.refY);
    L.allYw = L.allY.map(wy);
    L.brXw = wx(L.brX);
    L.tagAt = {x: wx(L.tagX), y: wy(L.tagY)};
    L.crop = {x: wx(L.crop.x), y: wy(L.crop.y), w: L.crop.w, h: L.crop.h};
    const dw = L.crop.w * L.Z, dh = L.crop.h * L.Z;
    if (L.arr === 'side') {
      const cy = Math.max(0, Math.min(Dv.h - dh, L.crop.y + L.crop.h / 2 - dh / 2));
      const roomW = full - L.zW - 12;
      L.dest = {x: MARGIN + (roomW - dw) / 2, y: cy, w: dw, h: dh};
    } else {
      const backBottom = L.pivot.y + (F + 16 - L.pivot.y) * L.sBack;
      // the lens takes the foot of the room below the stepped-back context (context + lens then span the box)
      L.dest = {x: MARGIN + (full - dw) / 2, y: Math.max(backBottom + 14, Dv.h - dh), w: dw, h: dh};
    }
    L.recOnFloor = L.arr === 'side';
    L.recNode = recordBuild(ctx, L.rec, {prefix: 'rec', x: recX, y: recY});
    L.bandNodes = [];
    if (L.band.sz.length) {
      const pl = flowRows(L.band.sz, {x: bandX, y: bandY, w: bandW, gap: 16, rowGap: 10, center: !L.split}).placed;
      for (const q of pl) {
        const it = q.it.it;
        const b = q.it.build(q.x, q.y, `band-${it.key}`, {});
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    L.trB = L.bandNodes.find(b => b.key === 'trB');
    if (L.trB) {
      const strike = v => { if (v && typeof v === 'object') { if (v.tag === 'text') v.attrs['text-decoration'] = 'line-through'; (v.children || []).forEach(strike); } };
      strike(L.trB.node);
    }
    // Δ marker on the tag's top-left corner (over the card's blank top strip, never over the value); its label where
    // it is clear of the tag, the column and the frame
    const mR = Math.max(16, L.size * 0.8);
    // (raised so its disc ends above the heading's first line)
    L.marker = {x: L.tagAt.x + mR * 0.9, y: L.tagAt.y - mR * 0.35, R: mR};
    L.markerLabel = textOn ? {text: p.contextLabels.marker || t.marker} : null;
    if (L.markerLabel) {
      const f = fitG(ctx, L.markerLabel.text, {maxWidth: Math.max(160, Math.min(320, L.tg.w + 60)), size: L.size, minSize: L.size, maxLines: 2, weight: 600});
      const w = f.width + L.size * 1.2, hh = f.height + L.size * 0.76;
      const colBox = {x: L.brXw - 6, y: wy(L.zoneTop) - 6, w: wx(L.armEnd) - L.brXw + 12, h: F - wy(L.zoneTop) + 6};
      const tagBox = {x: L.tagAt.x, y: L.tagAt.y, w: L.tg.w, h: L.tg.h};
      const meets = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      const inD = b => b.x >= MARGIN - 0.5 && b.y >= 0 && b.x + b.w <= Dv.w - MARGIN + 0.5 && b.y + b.h <= Dv.h;
      const cands = [
        {x: L.tagAt.x, y: L.marker.y - mR - 8 - hh, w, h: hh},
        {x: L.tagAt.x, y: L.tagAt.y + L.tg.h + 12, w, h: hh},
        {x: L.marker.x - mR - 10 - w, y: L.marker.y - hh / 2, w, h: hh},
        {x: L.tagAt.x + L.tg.w - w, y: L.marker.y - mR - 8 - hh, w, h: hh},
      ];
      const bandBoxes = [...L.bandNodes.map(b => b.box), ...(L.recOnFloor ? [L.recNode.box] : [])];
      const clearOf = b => !bandBoxes.some(q => meets(b, {x: q.x - 6, y: q.y - 6, w: q.w + 12, h: q.h + 12}));
      const box = cands.find(b => inD(b) && !meets(b, tagBox) && !meets(b, colBox) && clearOf(b))
        || cands.find(b => inD(b) && !meets(b, tagBox) && clearOf(b))
        || cands.find(b => inD(b) && !meets(b, tagBox)) || cands[0];
      L.markerLabel = {...L.markerLabel, fit: f, box};
    }
    const Dr = ctx.design;
    L.k = Math.min(1, Dr.w / Dv.w, Dr.h / Dv.h);
    L.dx = (Dr.w - Dv.w * L.k) / 2;
    L.dy = (Dr.h - Dv.h * L.k) / 2;
    L.Dv = Dv;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const textOn = ctx.show('key');
    const C = L.Cw;
    const M = L.M;
    const armLen = ZG.arm * L.OH;
    // the zone (floor, column, tokens, gap band, arms, bracket, string, tag) — drawn twice: scene and lens copy
    const zone = (P, tagP) => {
      const tag = tagArt(ctx, L.tg, L.tagAt.x, L.tagAt.y, tagP, textOn);
      const toks = [];
      for (let k = 0; k < M.refTokens; k++) toks.push(g({name: `${P}tk${k}`, transform: T(C.cx, C.slotY(k))}, tokenArt(ctx, {w: C.tokW, hh: C.tokH, tone: (k % 3) * 0.05})));
      return g(null,
        L.arr !== 'side' || P ? floorArt(ctx, {name: `${P}floor`, x0: MARGIN, x1: L.Dv.w - MARGIN, floorY: L.F}) : null,
        h('path', {name: `${P}legs`, d: `M${r(C.x0 - 12)} ${r(C.baseY + 16)}L${r(C.x0 - 4)} ${r(L.F)}M${r(C.x1 + 12)} ${r(C.baseY + 16)}L${r(C.x1 + 4)} ${r(L.F)}`, stroke: th.metalDark, 'stroke-width': 6, 'stroke-linecap': 'round'}),
        columnArt(ctx, {name: `${P}column`, C, gate2: true}),
        hopperArt(ctx, {name: `${P}hopper`, cx: C.cx, mouthY: C.top - ZG.hopGap * L.OH, w: C.cw * 1.9, hh: ZG.hopH * L.OH}),
        // the stated gap: a soft neutral band from the reference line (●) to the alleged-scenario level (◆)
        h('rect', {name: `${P}gapband`, x: r(C.x0 + 4), y: r(L.refYw), width: r(C.x1 - C.x0 - 8), height: 0, rx: 3, fill: th.accent2Soft, opacity: 0.9}),
        g({name: `${P}toks`}, toks),
        h('path', {d: `M${r(C.x0 + 2)} ${r(L.refYw)}H${r(C.x1 - 2)}`, stroke: th.ink, 'stroke-width': 2.5}),
        g({transform: T(C.x1, L.refYw)}, levelMarker(ctx, {len: armLen, dir: 1, side: 'before', s: L.armS})),
        g({name: `${P}armAll`, transform: T(C.x1, L.allYw[0])}, levelMarker(ctx, {len: armLen, dir: 1, side: 'after', s: L.armS})),
        h('path', {name: `${P}bracket`, d: '', fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round'}),
        h('path', {d: `M${r(L.brXw)} ${r(L.refYw)}Q${r((L.brXw + tag.hole.x) / 2)} ${r(Math.max(L.refYw, tag.hole.y) + 24)} ${r(tag.hole.x)} ${r(tag.hole.y)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5}),
        tag.node,
      );
    };
    const rb = L.recNode.box;
    const recEasel = L.recOnFloor ? h('path', {d: `M${r(rb.x + rb.w * 0.3)} ${r(rb.y + rb.h - 4)}L${r(rb.x + rb.w * 0.24)} ${r(L.F)}M${r(rb.x + rb.w * 0.7)} ${r(rb.y + rb.h - 4)}L${r(rb.x + rb.w * 0.76)} ${r(L.F)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.32)), 'stroke-linecap': 'round'}) : null;
    const Lc = L.crop;
    const lens = g({name: 'lz', opacity: 0, 'data-occludes': 1},
      h('defs', null, h('clipPath', {id: ctx.id('lzclip')}, h('rect', {name: 'lz-cliprect', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14}))),
      h('rect', {name: 'lz-win', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14, fill: th.paper}),
      g({'clip-path': ctx.ref('lzclip')}, g({name: 'lz-content'}, zone('lzs-', 'lzt'))),
      h('rect', {name: 'lz-border', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14, fill: 'none', stroke: th.accent2, 'stroke-width': 4}),
    );
    const guides = g({name: 'guides', opacity: 0},
      h('path', {name: 'src-frame', d: roundRectPath(Lc.x, Lc.y, Lc.w, Lc.h, 10), fill: 'none', stroke: th.accent2, 'stroke-width': 3}),
      h('line', {name: 'guide0', x1: r(Lc.x), y1: r(Lc.y), x2: r(Lc.x), y2: r(Lc.y), stroke: th.accent2, 'stroke-width': 2.5}),
      h('line', {name: 'guide1', x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(Lc.x), y2: r(Lc.y + Lc.h), stroke: th.accent2, 'stroke-width': 2.5}),
    );
    const ml = L.markerLabel;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.recOnFloor ? null : g({name: 'rec-g'}, L.recNode.node),
      L.arr === 'side' ? floorArt(ctx, {name: 'floor', x0: MARGIN, x1: L.Dv.w - MARGIN, floorY: L.F}) : null,
      g({name: 'cam'}, zone('', 'tg'), L.recOnFloor ? g({name: 'rec-g'}, recEasel, L.recNode.node) : null),
      guides,
      lens,
      changedMarker(ctx, {name: 'marker', x: L.marker.x, y: L.marker.y, radius: L.marker.R, opacity: 0}),
      ml ? g({name: 'mlabel', opacity: 0},
        h('path', {d: roundRectPath(ml.box.x, ml.box.y, ml.box.w, ml.box.h, Math.min(ml.box.h / 2, L.size * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 2}),
        textBlock(ml.fit, {x: ml.box.x + L.size * 0.6, y: ml.box.y + L.size * 0.38, fill: th.ink})) : null,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const textOn = ctx.show('key');
    const nodes = {};
    const stack = L.arr !== 'side';
    const W = stack ? W_STACK : W_SIDE;
    const Lr = L.crop, De = L.dest;
    const shP = stack ? 0 : u < W.shiftBack[0] ? ease.inOutCubic(seg(u, ...W.shift)) : 1 - ease.inOutCubic(seg(u, ...W.shiftBack));
    const sh = L.zShift * shP;
    const backP = !stack ? 0 : u < W.regrow[0] ? ease.inOutCubic(seg(u, ...W.shrink)) : 1 - ease.inOutCubic(seg(u, ...W.regrow));
    const sc = stack ? lerp(1, L.sBack, backP) : 1;
    const pv = L.pivot || {x: 0, y: 0};
    const camT = stack ? `translate(${r(pv.x)} ${r(pv.y)}) scale(${r(sc, 5)}) translate(${r(-pv.x)} ${r(-pv.y)})` : T(r(sh), 0);
    nodes.cam = {opacity: r(seg(u, ...W.ctxIn), 3), transform: camT};
    const Lc = stack ? {x: pv.x + (Lr.x - pv.x) * sc, y: pv.y + (Lr.y - pv.y) * sc, w: Lr.w * sc, h: Lr.h * sc} : {x: Lr.x + sh, y: Lr.y, w: Lr.w, h: Lr.h};
    const op = stack
      ? ease.outCubic(seg(u, W.open[0] + 0.004, W.open[1])) * (1 - ease.inCubic(seg(u, ...W.close)))
      : ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const lensOn = u >= W.open[0] && u < W.close[1];
    const cur = {x: lerp(Lc.x, De.x, op), y: lerp(Lc.y, De.y, op), w: lerp(Lc.w, De.w, op), h: lerp(Lc.h, De.h, op)};
    const k = cur.w / Lr.w;
    nodes.lz = {opacity: lensOn ? 1 : 0};
    for (const n of ['lz-cliprect', 'lz-win', 'lz-border']) nodes[n] = {x: r(cur.x), y: r(cur.y), width: r(cur.w), height: r(cur.h)};
    nodes['lz-content'] = {transform: `translate(${r(cur.x)} ${r(cur.y)}) scale(${r(k, 5)}) translate(${r(-Lr.x)} ${r(-Lr.y)})`};
    const gOn = lensOn ? seg(u, ...W.guides) * (1 - seg(u, W.close[0], W.close[0] + 0.01)) : 0;
    nodes.guides = {opacity: r(gOn, 3)};
    const gVis = L.arr === 'side' ? 1 : 0;
    nodes['src-frame'] = {transform: camT};
    if (L.arr === 'side') {
      const bx = cur.x + cur.w <= Lc.x + 1 ? cur.x + cur.w : cur.x;
      nodes.guide0 = {x1: r(Lc.x), y1: r(Lc.y), x2: r(bx), y2: r(cur.y), opacity: gVis};
      nodes.guide1 = {x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(bx), y2: r(cur.y + cur.h), opacity: gVis};
    } else {
      nodes.guide0 = {x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(cur.x), y2: r(cur.y), opacity: gVis};
      nodes.guide1 = {x1: r(Lc.x + Lc.w), y1: r(Lc.y + Lc.h), x2: r(cur.x + cur.w), y2: r(cur.y), opacity: gVis};
    }
    // the datum: before → after (scene tag and lens copy together; the scene's tag is blank while the lens holds it)
    const out = seg(u, ...W.oldOut), inn = seg(u, ...W.newIn);
    const ctxVals = u < W.tagOut[1] ? 1 - seg(u, ...W.tagOut) : u < W.tagIn[0] ? 0 : seg(u, ...W.tagIn);
    const lift = L.OH * 0.05;
    for (const P of ['tg', 'lzt']) {
      nodes[`${P}-vb`] = {opacity: r(1 - out, 3), transform: T(0, -lift * ease.inQuad(out))};
      nodes[`${P}-va`] = {opacity: r(inn, 3)};
      if (textOn) {
        const st = seg(u, ...W.strike);
        nodes[`${P}-strike`] = {opacity: r(st > 0 ? 1 - out : 0, 3), transform: T(0, -lift * ease.inQuad(out))};
        (L.tg.strikeLines || []).forEach((ln, i) => { nodes[`${P}-st${i}`] = {'stroke-dashoffset': r((ln.w + 6) * (1 - st))}; });
      }
    }
    // the tag's texts (scene and lens copy) show only while drawn at >= the floor: 19.5 px when the layout's text is
    // at the baseline size, else 16 px (the scene tag shrinks with the stepped-back context; the lens copy starts
    // over it)
    const floor = L.size >= LENS_TEXT_MIN ? LENS_TEXT_MIN + 0.1 : 16.2;
    nodes['tg-vals'] = {opacity: r(L.size * sc >= floor ? ctxVals : 0, 3)};
    nodes['lzt-vals'] = {opacity: k * L.size >= floor ? 1 : 0};
    // dependent geometry only: the alleged-scenario level (◆), the gap band, the bracket and the tokens between levels
    const gp = ease.inOutQuad(seg(u, ...W.geo));
    const C = L.Cw;
    const [g0, g1] = L.gaps;
    const ref = L.M.refTokens;
    const nb = ref - g0, na = ref - g1;
    const allY = lerp(L.allYw[0], L.allYw[1], gp);
    const lo = Math.min(nb, na), hi = Math.max(nb, na);
    for (const P of ['', 'lzs-']) {
      for (let kk = 0; kk < ref; kk++) {
        let o = kk < nb ? 1 : 0, dy = 0;
        if (kk >= lo && kk < hi) {
          // staggered per token: tokens lift out (gap grows) or drop in (gap shrinks)
          const n = hi - lo;
          const idx = na < nb ? hi - 1 - kk : kk - lo;
          const f = clamp(gp * (n + 1) - idx);
          if (na < nb) { o = 1 - f; dy = -C.tk * 1.2 * f; } else { o = f; dy = -C.tk * 1.2 * (1 - f); }
        }
        nodes[`${P}tk${kk}`] = {opacity: r(o, 3), transform: T(C.cx, C.slotY(kk) + dy)};
      }
      nodes[`${P}gapband`] = {y: r(L.refYw), height: r(Math.max(0, allY - L.refYw))};
      nodes[`${P}armAll`] = {transform: T(C.x1, allY)};
      nodes[`${P}bracket`] = {d: Math.abs(allY - L.refYw) < 1 ? '' : `M${r(C.x0 - 4)} ${r(L.refYw)}H${r(L.brXw)}V${r(allY)}H${r(C.x0 - 4)}`};
    }
    const txt = u < W.textOut[1] ? Math.min(seg(u, ...W.textIn), 1 - seg(u, ...W.textOut)) : u < W.textBack[0] ? 0 : seg(u, ...W.textBack);
    nodes['rec-g'] = {opacity: r(L.arr === 'side' ? 1 : txt, 3)};
    for (const bn of L.bandNodes) {
      const v = bn.when === 'ctx' ? txt : bn.when === 'trace' ? seg(u, ...W.trace) : seg(u, ...W.key);
      nodes[`band-${bn.key}`] = {opacity: r(v, 3)};
    }
    const mOn = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mOn, 3)};
    if (L.markerLabel) nodes.mlabel = {opacity: r(mOn, 3)};
    const datum = inn >= 1 ? 'after' : out > 0 || seg(u, ...W.strike) > 0 ? 'changing' : 'before';
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      datum,
      tagValue: inn >= 1 ? 'after' : out <= 0 ? 'before' : 'changing',
      strike: r(seg(u, ...W.strike), 3),
      lensOpen: r(op, 3), lensOn,
      zoom: r(L.Z, 3),
      lensNow: {x: r(cur.x), y: r(cur.y), w: r(cur.w), h: r(cur.h)},
      crop: {x: r(Lc.x), y: r(Lc.y), w: r(Lc.w), h: r(Lc.h)},
      shift: r(sh),
      back: r(sc, 4),
      lensMinSide: r(Math.min(De.w, De.h) / L.FU.short, 3),
      ctxValues: r(ctxVals, 3),
      geo: r(gp, 3),
      gapTokens: gp >= 1 ? g1 : gp <= 0 ? g0 : 'changing',
      gaps: [g0, g1], refTokens: ref,
      markerVisible: mOn >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      textsOut: txt === 0,
      tag: {x: r(L.tagAt.x), y: r(L.tagAt.y), w: r(L.tg.w), h: r(L.tg.h)},
      marker: {x: r(L.marker.x), y: r(L.marker.y), R: r(L.marker.R)},
      frame: {w: r(L.Dv.w), h: r(L.Dv.h)},
      layout: {OH: r(L.OH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, arr: L.arr, why: L.why, Z: r(L.Z, 3), room: {w: r(L.room.w), h: r(L.room.h)}, dest: {w: r(L.dest.w), h: r(L.dest.h)}, zW: r(L.zW), zH: r(L.zH)},
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
    slug: 'causation-06-inspect',
    title: 'Economic loss — a lens on the stated-difference tag of the balance column; one supplied datum is substituted',
    titleEs: 'Pérdida económica — Inspección y cambio de un dato',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Pérdida económica',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The balance column after the supplied flows, with a ● reference level, a ◆ alleged-scenario level, a bracket for the stated gap and a value tag on a string, beside the flow record. A real enlarged copy of the tag and the gap grows from its source; the supplied value is struck and replaced by the alternative value while only the dependent geometry changes (the ◆ level, the band, the bracket and the tokens between the levels). The lens returns to its source; a Δ marker and a before/after trace keep the old value traceable. Nothing is valued, computed or owed; no damages, compensation, liability, fault or causation is inferred.',
    tags: ['causation', 'economic loss', 'inspect', 'lens', 'datum substitution', 'stated difference', 'before and after', 'as stated'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/perdida-economica.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
