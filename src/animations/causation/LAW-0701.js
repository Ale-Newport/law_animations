/**
 * LAW-0701 — Pérdida económica · story
 *
 * Storyboard (side view of one flow machine; only the machine moves tokens):
 *  0.00–0.15 rest     A balance column (a glass rack with tick marks, no
 *                     numbers) stands empty under a hopper; two trays wait on
 *                     the floor — the right one for outflows, the left (◆)
 *                     one for the stated difference. Beside it the flow record
 *                     lists the supplied entries (in / out, amount "(fictional)").
 *  0.15–0.42 flow     The entries run in the supplied order, each row lit while
 *                     it runs: an inflow drops its tokens one by one from the
 *                     hopper onto the stack; an outflow lets the bottom token
 *                     slide out through the right gate onto its tray and the
 *                     stack settles one slot. Nothing moves before its step.
 *  0.42–0.73 state    A ● arm marks the level the flow reached — the reference
 *                     scenario, as stated (0.43–0.47). Then the ◆ gate lets the
 *                     supplied stated difference out onto the ◆ tray
 *                     (0.48–0.64) and a ◆ arm of identical weight marks the new
 *                     level (0.64–0.68). A solid bracket joins the two arms and
 *                     carries "Stated difference: <supplied>" (0.67–0.74).
 *  0.73–1.00 hold     Status "Difference shown as stated" (or, when supplied,
 *                     marked disputed with a dashed "?" ring — never decided),
 *                     notes and the key "As supplied · no conclusion drawn".
 *                     Nothing is valued; no damages, compensation, liability,
 *                     fault or causation is stated; no red, no alarm.
 * Wide boxes: machine left, record right (band below or in the record's
 * column). Tall boxes: the machine above the record.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0701
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, num, obj, list, oneOf, annotation} from '../../schemas/fields.js';
import {
  peFields, PE_STRINGS, resolvePE, planFlow, flowState, entryText, amountText, linkNotes, columnGeom, columnArt,
  hopperArt, trayArt, levelMarker, tokenArt, floorArt, iconChip, flowRows, recordMeasure, recordBuild, chipG, peIcon,
  linkIcon, MAX_TOKENS, clamp, ease, lerp, r, seg,
  localizeScene, PE_ES_DEFAULTS,
} from './kits/perdida-economica.js';

const ID = 'LAW-0701';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  legend: [0, 0.04], flow: [0.15, 0.42], ref: [0.43, 0.47], gap: [0.48, 0.64], alleged: [0.64, 0.68],
  bracket: [0.67, 0.71], diffChip: [0.7, 0.74], dispute: [0.74, 0.77], status: [0.76, 0.8], notes: [0.78, 0.82], key: [0.8, 0.84],
};
const FINAL = ['difference-stated', 'difference-disputed'];

const sceneSchema = {
  ...peFields,
  actorLabels: obj('Captions for the two parts of the machine that act', {
    a: str('Caption for the hopper (inflows) and the right gate (outflows)', 70),
    b: str('Caption for the ◆ gate that lets the stated difference out', 70),
  }),
  objectLabels: obj('Labels printed in the scene', {
    record: str('Heading of the flow record', 60),
    reference: str('Label of the ● reference-scenario level (comparison side A)', 50),
    alleged: str('Label of the ◆ alleged-loss level (comparison side B)', 50),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['column', 'record', 'difference']), 0, 2),
  finalState: oneOf('SUPPLIED final state of the stated difference: shown as stated, or marked disputed (never decided)', FINAL),
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
  actorLabels: {a: 'Hopper and right gate: the supplied flows', b: 'Left gate: the stated difference'},
  objectLabels: {record: '', reference: '', alleged: ''},
  actionProgress: 1,
  annotations: [{target: 'difference', text: 'The gap is only the difference as stated'}],
  finalState: 'difference-stated',
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...PE_ES_DEFAULTS,
  actorLabels: {a: 'Tolva y compuerta derecha: los flujos aportados', b: 'Compuerta izquierda: la diferencia declarada'},
  annotations: [{target: 'difference', text: 'El hueco es solo la diferencia declarada'}],
};

const strings = {
  en: {...PE_STRINGS.en, shown: 'Difference shown as stated', disputedState: 'Stated difference disputed (as supplied) · undecided'},
  es: {...PE_STRINGS.es, shown: 'Diferencia mostrada según lo declarado', disputedState: 'Diferencia declarada discutida (según lo aportado) · sin decidir'},
};

// stage geometry (× column height CH; x from the column centre, y up from the floor)
const SG = {trayW: 0.56, gapT: 0.05, hopH: 0.3, hopGap: 0.05, base: 0.1, arm: 0.3, col: 0.42};
const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, modes: ['side', 'col', 'split'], hMin: 260},
  square: {size: 24, minSize: 17, modes: ['tall', 'side', 'col', 'split', 'below', 'below2'], hMin: 165},
  portrait: {size: 25, minSize: 17, modes: ['below', 'below2', 'side', 'col', 'split'], hMin: 280},
};

function recordRows(ctx, p, M) {
  return M.entries.map(e => ({key: `ev${e.i}`, icon: e.dir === 'in' ? 'in' : 'out', text: entryText(ctx, p, e), highlight: true}));
}

function bandItems(ctx, p, M) {
  const t = ctx.t;
  const allOn = ctx.show('all');
  const out = [];
  if (!ctx.show('key')) return out;
  // the rows that appear late (status, notes, key) come first, so the chips shown at rest take the band's last rows
  // and the scene already reaches the foot of the box at rest
  const late = [];
  out.push({key: 'ref', icon: 'ref', text: p.objectLabels.reference || t.reference, when: 'legend'});
  out.push({key: 'alleged', icon: 'alleged', text: p.objectLabels.alleged || t.alleged, when: 'legend'});
  out.push({key: 'scale', icon: 'scale', text: t.scale.replace('{n}', String(M.per)).replace('{u}', (p.model && p.model.unit) || t.unit), when: 'legend'});
  if (p.losses[1]) out.push({key: 'loss1', icon: 'diff', text: `${t.alsoNoted}: ${p.losses[1].label}${p.losses[1].amount ? ` · ${amountText(ctx, p, p.losses[1].amount)}` : ''}`, when: 'legend'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged2 : t.proposed})`, when: 'legend'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, when: 'legend'}));
  if (allOn && p.actorLabels.a) out.push({key: 'actA', icon: 'hopper', text: p.actorLabels.a, when: 'legend'});
  if (allOn && p.actorLabels.b) out.push({key: 'actB', icon: 'gate', text: p.actorLabels.b, when: 'legend'});
  late.push({key: 'status', icon: 'diff', text: p.finalState === 'difference-disputed' ? t.disputedState : t.shown, when: 'status'});
  if (allOn) p.annotations.forEach((a, i) => late.push({key: `note${i}`, icon: a.target === 'record' ? 'record' : a.target === 'column' ? 'in' : 'diff', text: a.text, when: 'notes'}));
  late.push({key: 'key', text: t.key, when: 'key'});
  return [...late, ...out];
}

function bandFlow(ctx, base, size, w, from, to, half) {
  const key = `${size}|${Math.round(w)}|${from}|${to}|${half}`;
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
    const fl = flowRows(sz, {x: 0, y: 0, w, gap: 18, rowGap: 10});
    b = {sz, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad) || sz.some(q => q.w > w + 0.5)};
    base.memo.band.set(key, b);
  }
  return b;
}

/** The difference chip beside the bracket (measured). */
function diffChip(ctx, base, size) {
  const k = `diff|${size}`;
  let c = base.memo.chip.get(k);
  if (!c) {
    const text = ctx.show('key') ? base.diffText : '';
    c = text ? chipG(ctx, text, {x: 0, y: 0, maxWidth: Math.max(size * 9, Math.min(330, size * 13)), size, maxLines: 4, fill: ctx.theme.card, stroke: ctx.theme.accent2}) : null;
    base.memo.chip.set(k, c);
  }
  return c;
}

/**
 * Compose one configuration. Stage (× CH): trays SG.trayW each side of the column (0.34), the level arms and the
 * bracket on the right (SG.arm + 0.1) followed by the difference chip; hopper above the column.
 */
function compose(ctx, base, cfg) {
  const D = ctx.design;
  const {size, mode, RW} = cfg;
  const textOn = ctx.show('key');
  const recKey = `${size}|${RW}|${cfg.maxLines ?? 3}`;
  const rec = base.memo.rec.get(recKey) || recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, text: textOn, maxLines: cfg.maxLines ?? 3});
  base.memo.rec.set(recKey, rec);
  if (rec.bad && !cfg.force) return {bad: 'record'};
  const dc = diffChip(ctx, base, size);
  if (dc && (dc.fit.truncated || dc.fit.broken) && !cfg.force) return {bad: 'diff'};
  const recW = RW + 20, recH = rec.h + 14 + rec.clipH * 0.35;
  const full = D.w - 2 * MARGIN;
  const n = base.band.length;
  const k = mode === 'split' || mode === 'tall' ? cfg.k : mode === 'col' ? n : 0;
  // tall (square boxes): narrower trays when each tray holds a single pile (<= 7 tokens), so the machine can be taller
  const M0 = base.M;
  const outN = M0.entries.reduce((q, e) => q + (e.take || 0), 0);
  const tw = mode === 'tall' && outN <= 7 && M0.gapTokens <= 7 ? 0.42 : SG.trayW;
  // stage width (× CH): left tray | column | right tray, with the level arms and the bracket right of the column and
  // the difference chip beside the bracket. The chip hangs at the height of the stated gap, so it may sit above the
  // right tray's airspace when it clears the pile of outflow tokens there; otherwise it starts right of the tray.
  const chipW = dc ? dc.box.w + 16 : 0;
  const leftW = tw + SG.gapT + SG.col / 2;
  const trayEnd = SG.col / 2 + SG.gapT + tw;
  const armEnd = SG.col / 2 + SG.arm + 0.12;
  const M = base.M;
  const m = (M.refTokens + M.allegedTokens) / 2;
  const rows = Math.min(7, M.entries.reduce((q, e) => q + (e.take || 0), 0));
  // clear of the pile when the chip's bottom stays >= 14 above the pile's top (heights above the floor, × CH)
  const clearAt = CH => !dc || SG.base * CH + (m * CH) / MAX_TOKENS - dc.box.h / 2 >= (rows * 0.86 * 1.02 * CH) / MAX_TOKENS + 14;
  const stageW = (CH, clear = clearAt(CH)) => (clear
    ? Math.max((leftW + trayEnd) * CH, (leftW + armEnd) * CH + 48 + chipW)
    : Math.max((leftW + armEnd) * CH + 48, (leftW + trayEnd) * CH + 16) + chipW) + 20;
  const solveW = avail => {
    const cl = Math.min((avail - 20) / (leftW + trayEnd), (avail - 20 - 48 - chipW) / (leftW + armEnd));
    if (clearAt(cl)) return cl;
    return Math.min((avail - 20 - 48 - chipW) / (leftW + armEnd), (avail - 20 - 16 - chipW) / (leftW + trayEnd));
  };
  const stageH = CH => (1 + SG.hopH + SG.hopGap + SG.base) * CH + 16;
  const wsCol = full - recW - 30;
  let A = null, B = null, CH, chipC = null, colH = 0;
  if (mode === 'tall') {
    // tall (square boxes): the machine as tall as the box on the left; a right-hand column holds the difference chip
    // (joined to the bracket by a leader), the record and the first k band chips; the other chips run under the machine
    if (wsCol < 300) return {bad: 'ws'};
    if (dc) {
      const ck = `tall|${size}|${RW}`;
      chipC = base.memo.chip.get(ck);
      if (!chipC) { chipC = chipG(ctx, base.diffText, {x: 0, y: 0, maxWidth: RW, size, maxLines: 4}); base.memo.chip.set(ck, chipC); }
      if ((chipC.fit.truncated || chipC.fit.broken) && !cfg.force) return {bad: 'diff'};
    }
    A = k ? bandFlow(ctx, base, size, recW, 0, k, false) : {h: 0, sz: []};
    B = k < n ? bandFlow(ctx, base, size, wsCol, k, n, cfg.half) : {h: 0, sz: []};
    if ((A.bad || B.bad) && !cfg.force) return {bad: 'band'};
    colH = (chipC ? chipC.box.h + 18 : 0) + recH + (A.h ? 20 + A.h : 0);
    if (colH > D.h) return {bad: 'colH'};
    const avail = D.h - (B.h ? 16 + B.h : 0);
    CH = Math.min((wsCol - 20) / (leftW + trayEnd), (wsCol - 20 - 48) / (leftW + armEnd), (avail - 16) / (1 + SG.hopH + SG.hopGap + SG.base));
  } else if (mode === 'below' || mode === 'below2') {
    // below2: the record and the band side by side under the machine
    const bw = mode === 'below2' ? full - recW - 20 : full;
    if (bw < 240) return {bad: 'bw'};
    B = bandFlow(ctx, base, size, bw, 0, n, mode === 'below2' ? false : cfg.half);
    if (B.bad && !cfg.force) return {bad: 'band'};
    if (recW > full) return {bad: 'recW'};
    const hs = D.h - 32 - (mode === 'below2' ? Math.max(recH, B.h) : recH + (B.h ? 34 + B.h : 0));
    CH = Math.min(solveW(full), (hs - 16) / (1 + SG.hopH + SG.hopGap + SG.base));
  } else {
    if (wsCol < 260) return {bad: 'ws'};
    A = k ? bandFlow(ctx, base, size, recW, 0, k, false) : {h: 0, sz: []};
    B = k < n ? bandFlow(ctx, base, size, mode === 'side' ? full : wsCol, k, n, cfg.half) : {h: 0, sz: []};
    if ((A.bad || B.bad) && !cfg.force) return {bad: 'band'};
    const avail = D.h - (B.h ? 16 + B.h : 0);
    if ((A.h ? A.h + 20 : 0) + recH > avail) return {bad: 'colH'};
    CH = Math.min(solveW(wsCol), (avail - 16) / (1 + SG.hopH + SG.hopGap + SG.base));
  }
  if (!(CH >= cfg.hMin)) return {bad: 'CH', CH};
  // the scene (machine + record) spans >= 0.56 of the FRAME width or height
  const v = ctx.view, fs = Math.min(v.content.w / D.w, v.content.h / D.h);
  const below = mode === 'below' || mode === 'below2';
  const sceneW = mode === 'tall' ? full : mode === 'below2' ? full : below ? Math.max(stageW(CH), recW) : stageW(CH) + 30 + recW;
  const sceneH = mode === 'tall' ? Math.max(stageH(CH), colH) : mode === 'below2' ? stageH(CH) + 32 + Math.max(recH, B.h) : below ? stageH(CH) + 32 + recH : Math.max(stageH(CH), recH);
  if (sceneW < 0.56 * v.width / fs && sceneH < 0.56 * v.height / fs && !cfg.force) return {bad: 'share'};
  if (cfg.dry) return {CH, size, cfg: {...cfg, dry: false}};
  const stageWt = Math.max((leftW + trayEnd) * CH, (leftW + armEnd) * CH + 48) + 20;
  return {CH, size, cfg, rec, recW, recH, A, B, dc, chipW, mode, tw, chipC, colH, stageW: mode === 'tall' ? stageWt : stageW(CH), chipClear: clearAt(CH), stageH: stageH(CH), wsCol, full};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const M = resolvePE(p);
    const P = planFlow(M);
    const diffText = `${p.losses[0].label}: ${amountText(ctx, p, p.losses[0].amount || 0)}`;
    const base = {M, header: p.objectLabels.record || t.record, rows: recordRows(ctx, p, M), band: bandItems(ctx, p, M), diffText, memo: {rec: new Map(), band: new Map(), chip: new Map()}};
    const rws = ctx.view.shape === 'landscape' ? [440, 520, 600, 680] : ctx.view.shape === 'square' ? [300, 340, 380, 440, 500] : [520, 640, 760, Math.floor(ctx.design.w - 2 * MARGIN - 20)];
    const nb0 = base.band.length;
    const ks = [...new Set([1, Math.ceil(nb0 / 3), Math.ceil(nb0 / 2), Math.ceil((2 * nb0) / 3), nb0 - 1].filter(k => k >= 1 && k < nb0))];
    let pick = null;
    const why = [];
    // every size down to the minimum; per size the configuration with the largest machine. Square boxes (review
    // 2026-09-27: the machine must stay the subject) take the largest text size whose machine is >= 0.95 of the largest
    // machine found at any size; other boxes keep the first size (from the top) that fits and >= 20 when possible.
    const bySize = new Map();
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      for (const mode of SH.modes) for (const RW of rws) for (const maxLines of [3, 4]) for (const half of [false, true]) for (const k of mode === 'split' ? ks : mode === 'tall' ? [...Array(nb0 + 1).keys()] : [0]) {
        // square boxes with labels hidden: the machine over the record (side by side leaves the upper half empty)
        if (ctx.view.shape === 'square' && !ctx.show('key') && !mode.startsWith('below') && mode !== 'tall') continue;
        const X = compose(ctx, base, {mode, size, RW, maxLines, half, k, hMin: SH.hMin, dry: true});
        if (!X.cfg) { why.push(`${mode}${k || ''}/${RW}@${size}:${X.bad}${X.CH ? Math.round(X.CH) : ''}`); continue; }
        const b0 = bySize.get(size);
        if (!b0 || X.CH > b0.CH + 1e-6) bySize.set(size, X);
      }
      if (ctx.view.shape !== 'square' && bySize.size) {
        const first = [...bySize.values()][0];
        if (size < Math.max(first.size - 3, Math.min(first.size, 20)) - 1e-9) break;
      }
    }
    const cands = [...bySize.values()];
    if (globalThis.__whyAll) why.push(...cands.map(c => `CAND ${c.cfg.mode}/${c.cfg.RW}/k${c.cfg.k}/h${c.cfg.half ? 1 : 0}/ml${c.cfg.maxLines}@${c.size}:CH${Math.round(c.CH)}`));
    if (cands.length) {
      if (ctx.view.shape === 'square') {
        const maxCH = Math.max(...cands.map(c => c.CH));
        pick = cands.filter(c => c.CH >= 0.95 * maxCH - 1e-6).sort((a, b) => b.size - a.size)[0];
      } else {
        // text at >= 20 (the 19.5 px baseline floor) wins over a larger stage with smaller text
        const ok20 = s0 => s0 >= 20 - 1e-9;
        for (const X of cands) if (!pick || ok20(X.size) > ok20(pick.size) || (ok20(X.size) === ok20(pick.size) && X.CH > pick.CH + 1e-6)) pick = X;
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    let Dv = ctx.design;
    // fallback: a taller virtual box scaled into the real one (flagged); last resort (e.g. the DOM-less text estimator):
    // the same with text allowed to wrap without limit, flagged in semantic.problems — never throws
    for (const force of [false, true]) {
      for (let f = 1.1; f <= (force ? 12.01 : 4.01) && !L; f += force ? 0.5 : 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const mode of SH.modes.filter(m0 => m0 !== 'split')) {
          const X = compose(c2, base, {mode, size: SH.minSize, RW: rws[rws.length - 1], maxLines: force ? 12 : 5, hMin: force ? 20 : 60, force});
          if (X.rec) { L = X; Dv = c2.design; if (force) L.problems = ['no-layout-fits']; break; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0) || globalThis.__whyAll).slice(globalThis.__whyAll ? -600 : -24);
    L.M = M; L.P = P;
    const full = Dv.w - 2 * MARGIN;
    const CH = L.CH;
    // ---- place
    let cx, F, recX, recY, recFloor;
    const bands = [];
    const colH = (L.A && L.A.h ? L.A.h + 20 : 0) + L.recH;
    L.tw = L.tw || SG.trayW;
    if (L.mode === 'tall') {
      const blockH = L.stageH + (L.B.h ? 16 + L.B.h : 0);
      const top = Math.max(0, (Dv.h - blockH) / 2);
      F = top + L.stageH - 16;
      cx = MARGIN + (L.tw + SG.gapT + SG.col / 2) * CH;
      const colX = MARGIN + full - L.recW;
      const colTop = Math.max(0, (Dv.h - L.colH) / 2);
      L.colX = colX; L.colTop = colTop;
      recX = colX + 10;
      recY = colTop + (L.chipC ? L.chipC.box.h + 18 : 0) + L.rec.clipH * 0.35;
      if (L.A && L.A.h) bands.push({band: L.A, x: colX, y: recY - L.rec.clipH * 0.35 + L.recH + 20, w: L.recW, center: false});
      if (L.B.h) bands.push({band: L.B, x: MARGIN, y: F + 16 + 16, w: L.wsCol, center: true});
      recFloor = F;
    } else if (L.mode !== 'below' && L.mode !== 'below2') {
      const blockW = L.stageW + 30 + L.recW;
      // spare width goes mostly between the machine and the record (the scene spans the box)
      // (side mode only: in col / split modes a band stands under the machine, beside the record column)
      const extra = Math.max(0, full - blockW);
      const spread = L.mode === 'side' ? 0.7 : 0;
      const x0 = MARGIN + extra * (1 - spread) / 2;
      L.recGap = 30 + extra * spread;
      const blockH = Math.max(L.stageH, colH) + (L.B.h ? 16 + L.B.h : 0);
      const top = Math.max(0, (Dv.h - blockH) / 2);
      F = top + Math.max(L.stageH, colH) - 16;
      cx = x0 + (L.tw + SG.gapT + SG.col / 2) * CH;
      recX = x0 + L.stageW + L.recGap + 10;
      const aTop = top + (L.A && L.A.h ? L.A.h + 20 : 0);
      recY = aTop + L.rec.clipH * 0.35 + Math.max(0, (Math.max(L.stageH, colH) - colH) / 2);
      if (L.A && L.A.h) bands.push({band: L.A, x: recX - 10, y: recY - L.rec.clipH * 0.35 - 20 - L.A.h, w: L.recW, center: false});
      if (L.B.h) bands.push({band: L.B, x: L.mode === 'side' ? MARGIN : x0, y: F + 16 + 16, w: L.mode === 'side' ? full : L.wsCol, center: L.mode === 'side'});
      recFloor = F;
    } else if (L.mode === 'below2') {
      const lowH = Math.max(L.recH, L.B.h);
      const blockH = L.stageH + 32 + lowH;
      const top = Math.max(0, (Dv.h - blockH) / 2);
      F = top + L.stageH - 16;
      cx = MARGIN + (full - L.stageW) / 2 + (SG.trayW + SG.gapT + SG.col / 2) * CH;
      recX = MARGIN + 10;
      recY = F + 16 + 16 + L.rec.clipH * 0.35 + Math.max(0, (lowH - L.recH) / 2);
      if (L.B.h) bands.push({band: L.B, x: MARGIN + L.recW + 20, y: F + 32 + Math.max(0, (lowH - L.B.h) / 2), w: full - L.recW - 20, center: false});
    } else {
      const blockH = L.stageH + 32 + L.recH + (L.B.h ? 34 + L.B.h : 0);
      const top = Math.max(0, (Dv.h - blockH) / 2);
      F = top + L.stageH - 16;
      cx = MARGIN + (full - L.stageW) / 2 + (SG.trayW + SG.gapT + SG.col / 2) * CH;
      recX = MARGIN + (full - L.recW) / 2 + 10;
      recY = F + 16 + 16 + L.rec.clipH * 0.35;
      if (L.B.h) bands.push({band: L.B, x: MARGIN, y: recY - L.rec.clipH * 0.35 + L.recH + 34, w: full, center: true});
    }
    L.F = F; L.cx = cx;
    const baseY = F - SG.base * CH;
    const C = columnGeom(cx, baseY, CH);
    L.C = C;
    L.mouthY = C.top - SG.hopGap * CH;
    // trays: right (outflows) and left (◆ stated difference); tokens pile in two stacks of up to 7
    L.trayR = {x0: C.x1 + SG.gapT * CH, x1: C.x1 + (SG.gapT + L.tw) * CH};
    L.trayL = {x0: C.x0 - (SG.gapT + L.tw) * CH, x1: C.x0 - SG.gapT * CH};
    const trayPos = (tray, k) => {
      const col = Math.floor(k / 7), row = k % 7;
      const x = tray.x0 + C.tokW * (0.62 + col * 1.05);
      return {x, y: F - (row + 0.5) * C.tokH * 1.02};
    };
    L.trayPos = trayPos;
    // level arms and bracket on the right of the column
    L.armLen = SG.arm * CH;
    const refY = C.slotY(M.refTokens - 1) - C.tk * 0.5;
    const allY = C.slotY(M.allegedTokens - 1) - C.tk * 0.5;
    L.refY = M.refTokens ? refY : baseY;
    L.allY = M.allegedTokens ? allY : baseY;
    L.bx = C.x1 + L.armLen + 26;
    // the difference chip sits beside the bracket, centred on the gap
    if (L.dc && L.mode === 'tall') {
      // the chip heads the right-hand column; a leader runs from the bracket's middle through the gutter to it
      const cy = (L.refY + L.allY) / 2;
      const c = chipG(ctx, base.diffText, {x: L.colX, y: L.colTop, maxWidth: L.chipC.box.w + 1, size: L.size, maxLines: 4, fill: th.card, stroke: th.accent2, name: 'diff-chip'});
      L.diffChip = c;
      const gx = L.colX - 14, my = c.box.y + c.box.h / 2;
      // (it starts beyond the disputed-state ring when that ring sits on the bracket)
      const lx = L.bx + (ctx.params.finalState === 'difference-disputed' ? L.size * 0.9 : 2);
      L.diffLead = `M${r(lx)} ${r(cy)}H${r(gx)}V${r(my)}H${r(L.colX)}`;
    } else if (L.dc) {
      const cy = (L.refY + L.allY) / 2;
      const chipX = L.chipClear ? L.bx + 22 : Math.max(L.bx + 22, L.trayR.x1 + 16);
      const c = chipG(ctx, base.diffText, {x: chipX, y: cy - L.dc.box.h / 2, maxWidth: L.dc.box.w + 1, size: L.size, maxLines: 4, fill: th.card, stroke: th.accent2, name: 'diff-chip'});
      L.diffChip = c;
    }
    L.recNode = recordBuild(ctx, L.rec, {prefix: 'rec', x: recX, y: recY});
    L.recFloor = recFloor;
    L.recX = recX;
    L.bandNodes = [];
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
    const C = L.C, CH = L.CH;
    const tokens = [];
    for (let k = 0; k < L.P.total; k++) tokens.push(g({name: `tok${k}`, transform: T(C.cx, L.mouthY - SG.hopH * L.CH * 0.45)}, tokenArt(ctx, {w: C.tokW, hh: C.tokH, tone: (k % 3) * 0.05})));
    const legX = [L.recX + L.rec.w * 0.2, L.recX + L.rec.w * 0.8];
    const railY = L.recNode.box.y + L.recNode.box.h;
    const easel = L.mode.startsWith('below') || L.mode === 'tall' ? null : g({name: 'easel'},
      legX.map(x => h('path', {d: `M${r(x)} ${r(railY - 6)}L${r(x + (x < L.recX + L.rec.w / 2 ? -1 : 1) * L.size)} ${r(L.recFloor)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.35)), 'stroke-linecap': 'round'})));
    const hopW = C.cw * 1.9;
    const dispute = p.finalState === 'difference-disputed'
      ? g({name: 'dispute', opacity: 0, transform: T(L.bx, (L.refY + L.allY) / 2)}, linkIcon(ctx, {cx: 0, cy: 0, s: L.size * 1.6, disputed: true}))
      : null;
    const x0f = Math.min(L.trayL.x0 - 16, C.x0 - 40);
    const x1f = L.mode === 'tall' ? Math.max(L.trayR.x1 + 16, L.bx + 30) : L.mode.startsWith('below') ? (L.diffChip ? L.diffChip.box.x + L.diffChip.box.w + 20 : L.bx + 30) : L.recX + L.rec.w + 20;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      floorArt(ctx, {name: 'floor', x0: x0f, x1: x1f, floorY: L.F}),
      L.mode.startsWith('below') ? floorArt(ctx, {name: 'floor2', x0: L.recX - (L.mode === 'below2' ? 12 : 30), x1: L.recX + L.rec.w + (L.mode === 'below2' ? 12 : 30), floorY: L.recNode.box.y + L.recNode.box.h + 8}) : null,
      trayArt(ctx, {name: 'trayR', x0: L.trayR.x0, x1: L.trayR.x1, floorY: L.F, hh: C.tokH * 2.2}),
      trayArt(ctx, {name: 'trayL', x0: L.trayL.x0, x1: L.trayL.x1, floorY: L.F, hh: C.tokH * 2.2, alleged: true}),
      columnArt(ctx, {name: 'column', C}),
      h('path', {name: 'colbase', d: `M${r(C.x0 - 16)} ${r(C.baseY + 16)}L${r(C.x0 - 6)} ${r(L.F)}M${r(C.x1 + 16)} ${r(C.baseY + 16)}L${r(C.x1 + 6)} ${r(L.F)}`, stroke: th.metalDark, 'stroke-width': 6, 'stroke-linecap': 'round'}),
      g({name: 'tokens'}, tokens),
      hopperArt(ctx, {name: 'hopper', cx: C.cx, mouthY: L.mouthY, w: hopW, hh: SG.hopH * CH}),
      g({name: 'armRef', transform: T(C.x1, L.refY, 0, 0.001, 1)}, levelMarker(ctx, {len: L.armLen, dir: 1, side: 'before', s: L.size * 0.9})),
      g({name: 'armAll', transform: T(C.x1, L.allY, 0, 0.001, 1)}, levelMarker(ctx, {len: L.armLen, dir: 1, side: 'after', s: L.size * 0.9})),
      h('path', {name: 'bracket', d: `M${r(L.bx - 8)} ${r(L.refY)}H${r(L.bx)}V${r(L.allY)}H${r(L.bx - 8)}`, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(Math.abs(L.allY - L.refY) + 20)} ${r(Math.abs(L.allY - L.refY) + 40)}`, 'stroke-dashoffset': r(Math.abs(L.allY - L.refY) + 20)}),
      L.diffChip ? g({name: 'diff', opacity: 0}, L.diffLead ? h('path', {name: 'diff-lead', d: L.diffLead, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linejoin': 'round'}) : null, L.diffChip.node) : null,
      dispute,
      easel,
      L.recNode.node,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const C = L.C;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const fa = seg(a, ...W.flow), fb = seg(a, ...W.gap);
    const S = flowState(L.P, fa, fb);
    const outOrder = [], gapOrder = [];
    for (const s0 of L.P.steps) if (s0.kind === 'out') outOrder.push(s0.token);
    for (const s0 of L.P.gapSteps) gapOrder.push(s0.token);
    const pts = {};
    for (const tk of S.tokens) {
      let x = C.cx, y;
      if (tk.where === 'hopper') { y = L.mouthY - SG.hopH * L.CH * 0.45; }
      else if (tk.where === 'fall') {
        const e = tk.drop; // linear: the first drop spans the whole column within one step (<= 90 units a frame at 60 fps)
        y = lerp(L.mouthY - SG.hopH * L.CH * 0.45, C.slotY(tk.vslot), e);
      } else if (tk.where === 'stack') { y = C.slotY(tk.vslot); }
      else {
        // out (right gate → right tray) / gap (◆ left gate → left tray): slide out along the floor of the column, drop in
        const tray = tk.where === 'out' ? L.trayR : L.trayL;
        const k = (tk.where === 'out' ? outOrder : gapOrder).indexOf(tk.id);
        const dest = L.trayPos(tray, k);
        const s0 = tk.slide; // linear: steady speed out of the gate and onto the tray
        const exitX = tk.where === 'out' ? C.x1 + C.tokW * 0.6 : C.x0 - C.tokW * 0.6;
        const y0 = C.slotY(0);
        if (s0 < 0.5) { x = lerp(C.cx, exitX, s0 * 2); y = y0; }
        else { const q = (s0 - 0.5) * 2; x = lerp(exitX, dest.x, q); y = lerp(y0, dest.y, q * q); }
      }
      nodes[`tok${tk.id}`] = {transform: T(x, y)};
      pts[tk.id] = {x: r(x), y: r(y)};
    }
    // record: the running entry is lit
    L.M.entries.forEach(e => { nodes[`rec-hl-ev${e.i}`] = {opacity: S.activeEntry === e.i && fa < 1 ? 1 : 0}; });
    // level arms, bracket, difference chip
    const ra = ease.outCubic(seg(a, ...W.ref)), aa = ease.outCubic(seg(a, ...W.alleged));
    nodes.armRef = {transform: T(C.x1, L.refY, 0, Math.max(0.001, ra), 1)};
    nodes.armAll = {transform: T(C.x1, L.allY, 0, Math.max(0.001, aa), 1)};
    const bl = Math.abs(L.allY - L.refY) + 20;
    nodes.bracket = {'stroke-dashoffset': r(bl * (1 - seg(a, ...W.bracket)))};
    if (L.diffChip) nodes.diff = {opacity: r(done ? seg(u, ...W.diffChip) : 0, 3)};
    if (p.finalState === 'difference-disputed') nodes.dispute = {opacity: r(done ? seg(u, ...W.dispute) : 0, 3)};
    const lg = seg(u, ...W.legend);
    for (const b of L.bandNodes) {
      const pr = b.when === 'legend' ? lg : b.when === 'key' ? seg(u, ...W.key) : done ? seg(u, ...W[b.when]) : 0;
      nodes[`band-${b.key}`] = {opacity: r(pr, 3)};
    }
    const inStack = S.stack.length;
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      flow: r(fa, 3), gap: r(fb, 3),
      stack: inStack, refTokens: L.M.refTokens, allegedTokens: L.M.allegedTokens, gapTokens: L.M.gapTokens, per: L.M.per,
      outOnTray: S.tokens.filter(q => q.where === 'out' && q.slide >= 1).length,
      gapOnTray: S.tokens.filter(q => q.where === 'gap' && q.slide >= 1).length,
      activeEntry: S.activeEntry,
      refArm: r(ra, 3), allegedArm: r(aa, 3), bracket: r(seg(a, ...W.bracket), 3),
      diffShown: done && seg(u, ...W.diffChip) >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      actionCapped: p.actionProgress < 1 && u > capU,
      tok0: pts[0] || null, tokLast: pts[L.P.total - 1] || null,
      tokens: pts,
      layout: {CH: r(L.CH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, mode: L.mode, why: L.why},
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
    slug: 'causation-06-story',
    title: 'Economic loss — a flow of inflows and outflows, and a difference shown only as stated',
    titleEs: 'Pérdida económica — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Pérdida económica',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A flow machine: the supplied inflows drop unit tokens from a hopper into a balance column and the outflows let tokens out through a gate, each record row lit as it runs. A ● arm marks the reference-scenario level, a ◆ gate lets the supplied stated difference out, a ◆ arm of equal weight marks the new level and a solid bracket carries the difference as stated. Fictional amounts; nothing is valued and no damages, compensation, liability, fault or causation is stated.',
    tags: ['causation', 'economic loss', 'flows', 'inflows', 'outflows', 'reference scenario', 'alleged loss', 'as stated'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/perdida-economica.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
