/**
 * LAW-0703 — Pérdida económica · contrast
 *
 * Storyboard (two complete flow machines of equal size and timing; only the
 * stated difference differs):
 *  0.00–0.17 base      Two identical machines, A and B: the same hopper, the
 *                      same empty balance column and the same outflow tray.
 *                      Header chips "● A · Reference scenario · as stated" and
 *                      "◆ B · Alleged loss · as stated" (equal chips, same
 *                      colour; beside each hopper when there is room). The
 *                      supplied entries both machines share are drawn ONCE.
 *  0.17–0.40 change    One localized change in each: A's left gate gets a shut
 *                      ● plate; B's gets a raised (open) ◆ plate and a tray
 *                      (0.20–0.34). The "Changed fact" chip names it.
 *  0.40–0.77 run       In parallel, the same supplied entries run in both
 *                      machines (0.40–0.62): inflows drop tokens, outflows let
 *                      the bottom token out and the stack settles. Then only
 *                      B's open ◆ gate lets the supplied stated difference out
 *                      (0.63–0.74) — the same action, adapted only to the
 *                      contrasted circumstance.
 *  0.77–1.00 guide     A solid ink level line joins A's level to the same height
 *                      on B (a thin ● line inside B's column), and a bracket on B
 *                      carries "Only this differs: <stated difference>". Neutral
 *                      note ("No winner, no outcome") and the key "As supplied ·
 *                      no conclusion drawn". Nothing is computed or valued; no
 *                      damages, compensation, liability, fault or causation is
 *                      stated; no red, no alarm.
 * Wide boxes: A and B side by side. Tall boxes: A above B (square boxes may put
 * the shared entries in a right-hand column beside the stacked machines, the
 * late chips under them).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0703
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  peFields, PE_STRINGS, resolvePE, planFlow, flowState, entryText, amountText, linkNotes, columnGeom, columnArt,
  hopperArt, trayArt, tokenArt, floorArt, iconChip, flowRows, fitG, chipG, sideMark, MAX_TOKENS, clamp, ease, lerp, r, seg,
  localizeScene, PE_ES_DEFAULTS,
} from './kits/perdida-economica.js';

const ID = 'LAW-0703';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], record: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0, 0.04], shared: [0, 0.05], gateIn: [0.2, 0.34], changed: [0.22, 0.3],
  flow: [0.4, 0.62], gap: [0.63, 0.74],
  line: [0.77, 0.81], guide: [0.79, 0.84], note: [0.82, 0.87], key: [0.84, 0.89],
};

const strings = {
  en: {...PE_STRINGS.en, shared: 'Same in A and B (as supplied)', changed: 'Changed fact', guide: 'Only this differs', neutral: 'No winner, no outcome: two scenarios side by side'},
  es: {...PE_STRINGS.es, shared: 'Igual en A y B (según lo aportado)', changed: 'Hecho que cambia', guide: 'Solo esto cambia', neutral: 'Sin ganador ni resultado: dos escenarios comparados'},
};

const sceneSchema = {
  ...peFields,
  ...contrastFields(),
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
  scenarioA: {label: 'Reference scenario', caption: 'as stated'},
  scenarioB: {label: 'Alleged loss', caption: 'as stated'},
  changedFact: 'Only B’s left gate opens and lets the stated difference out',
  sharedFacts: ['Same entries and the same model scale'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'No winner, no outcome: two scenarios side by side'},
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...PE_ES_DEFAULTS,
  scenarioA: {label: 'Escenario de referencia', caption: 'según lo declarado'},
  scenarioB: {label: 'Pérdida alegada', caption: 'según lo declarado'},
  changedFact: 'Solo se abre la compuerta izquierda de B y deja salir la diferencia declarada',
  sharedFacts: ['Mismas entradas y misma escala del modelo'],
  comparisonLabels: {guide: 'Solo esto cambia', neutral: 'Sin ganador ni resultado: dos escenarios comparados'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['row']},
  square: {size: 24, minSize: 17, arr: ['row', 'column', 'textcol']},
  portrait: {size: 25, minSize: 17, arr: ['column']},
};
// machine geometry (× column height CH): trays and gates each side of the column, hopper above
const MG = {trayW: 0.5, gapT: 0.05, col: 0.42, hopH: 0.28, hopGap: 0.05, base: 0.1, bracket: 0.36};
const machineW = (CH, tw) => (tw * 2 + MG.gapT * 2 + MG.col + MG.bracket) * CH;

/** Header chip: solid ●/◆ cue (equal weight, same colour) + "A · label" / "B · label". */
function headChip(ctx, it, size, maxW, textOn) {
  const th = ctx.theme;
  const R = size * 0.8;
  const fit = textOn ? fitG(ctx, it.text, {maxWidth: maxW - 2 * R - 34, size, minSize: size, maxLines: 2, weight: 700}) : null;
  const w = 2 * R + (fit ? 16 + fit.width + 18 : 12);
  const hh = Math.max(2 * R + 10, fit ? fit.height + size * 0.8 : 0);
  return {
    w, h: hh, bad: fit ? fit.truncated || fit.broken : false,
    build(x, y, name) {
      const cy = y + hh / 2;
      return {node: g({name, opacity: 0},
        h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.8)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
        sideMark(ctx, {cx: x + R + 6, cy, s: R * 1.5, side: it.side}),
        fit ? textBlock(fit, {x: x + 2 * R + 20, y: cy - fit.height / 2, fill: th.ink}) : null,
      ), box: {x, y, w, h: hh}};
    },
  };
}

function compose(ctx, base, cfg) {
  const D = ctx.design;
  const {size, arr} = cfg;
  const textOn = ctx.show('key');
  const memo = base.memo;
  const full = D.w - 2 * MARGIN;
  const textcol = arr === 'textcol';
  const colW = textcol ? Math.round(full * cfg.colF) : 0;
  const gapL = arr === 'row' ? 34 : 24;
  const laneW = arr === 'row' ? (full - gapL) / 2 : textcol ? full - colW - 24 : full;
  const v = ctx.view, fs = Math.min(v.content.w / D.w, v.content.h / D.h);
  const need = arr === 'row' ? 0.40 : textcol ? 0.55 : 0.71;
  if (!cfg.fallback && laneW - 12 < need * v.width / fs + 2) return {bad: 'lane-share'};
  const heads = base.heads.map(it => headChip(ctx, it, size, laneW, textOn));
  if (heads.some(q => q.bad) && !cfg.force) return {bad: 'head'};
  const headH = Math.max(...heads.map(q => q.h));
  // the guide chip on B (measured once)
  const gk = `${size}|${Math.round(laneW)}`;
  let gc = memo.gc.get(gk);
  if (gc === undefined) {
    gc = textOn ? chipG(ctx, base.guideText, {x: 0, y: 0, maxWidth: Math.max(size * 8, Math.min(laneW * 0.42, 360)), size, maxLines: 5}) : null;
    memo.gc.set(gk, gc);
  }
  if (gc && (gc.fit.truncated || gc.fit.broken) && !cfg.force) return {bad: 'guide'};
  const gcW = gc ? gc.box.w + 20 : 0;
  // shared band
  const bw = textcol ? colW : full;
  // textcol + low: only the shared entries stand in the right-hand column; the changed fact, the neutral note and the
  // key run under the stacked lanes (lane width)
  const low = textcol && cfg.low;
  const measureBand = (items, w, lines, half) => {
    const mw = half ? (w - 18) / 2 : Math.min(w, 760);
    const bsz = textOn ? items.map(it => ({it, ...iconChip(ctx, it, {size, maxW: it.key === 'sharedHead' ? w : mw, maxLines: lines})})) : [];
    const fl = flowRows(bsz, {x: 0, y: 0, w, gap: 18, rowGap: 10});
    return {bsz, bandH: bsz.length ? fl.bottom : 0, bad: bsz.some(q => q.bad || q.w > w + 0.5)};
  };
  const sk = `${size}|${Math.round(bw)}|${cfg.half}|${low}`;
  let shared = memo.shared.get(sk);
  if (!shared) {
    shared = measureBand(low ? base.band.filter(it => it.when === 'shared') : base.band, bw, textcol ? 6 : 3, cfg.half && !textcol);
    shared.low = low ? measureBand(base.band.filter(it => it.when !== 'shared'), laneW, 3, false) : null;
    memo.shared.set(sk, shared);
  }
  if ((shared.bad || (shared.low && shared.low.bad)) && !cfg.force) return {bad: 'shared'};
  if (textcol && shared.bandH > D.h) return {bad: 'col'};
  const bandH = shared.low ? (shared.low.bandH ? shared.low.bandH + 16 : 0) : shared.bandH && !textcol ? shared.bandH + 16 : 0;
  const lineH = textOn ? 10 : 0;
  const avail = D.h - bandH - (arr !== 'row' ? gapL : 0);
  const perLaneH = arr === 'row' ? avail : avail / 2;
  // headSide: each lane's head chip sits right of its hopper (at the hopper's height) instead of in a row above
  const innerH = perLaneH - (cfg.headSide ? 0 : headH) - 14 - lineH;
  const CH = Math.min((laneW - gcW) / (MG.trayW * 2 + MG.gapT * 2 + MG.col + MG.bracket), (innerH - 16) / (1 + MG.hopH + MG.hopGap + MG.base));
  if (!(CH >= cfg.hMin)) return {bad: 'CH', CH};
  const tw = clamp(((laneW - gcW) / CH - (MG.gapT * 2 + MG.col + MG.bracket)) / 2, MG.trayW, 1);
  let hds = heads, hdH = headH, chipTopH = null;
  if (cfg.headSide) {
    const mw = machineW(CH, tw);
    const off = Math.max(0, (laneW - mw - gcW) / 2);
    const hx = off + (tw + MG.gapT + MG.col / 2 + 0.4) * CH + 24;
    // the heads are re-measured for the room right of the hopper (up to two lines)
    const room = laneW - 4 - hx;
    if (room < size * 8) return {bad: 'head-side-w'};
    hds = base.heads.map(it => headChip(ctx, it, size, room, textOn));
    if (hds.some(q => q.bad || q.w > room + 0.5)) return {bad: 'head-side-w'};
    hdH = Math.max(...hds.map(q => q.h));
    const headH = hdH;
    // (heights above the floor) the head's foot stays above the level line and above B's guide chip
    const hopTop = (MG.base + 1 + MG.hopGap + MG.hopH) * CH;
    const M = base.M, tk = CH / MAX_TOKENS;
    const refH = MG.base * CH + M.refTokens * tk;
    // (row: the level line runs from A to B at the reference height, under A's head)
    if (arr === 'row' && hopTop - headH - 10 < refH + 12) return {bad: 'head-side-h'};
    // B's guide chip may slide down beside its bracket to stay under the head (still overlapping the bracket's span
    // and above the pile of outflow tokens on the right tray)
    if (gc) {
      const allH = MG.base * CH + M.allegedTokens * tk;
      const rows = Math.min(7, M.entries.reduce((q, e) => q + (e.take || 0), 0));
      const pileTop = rows * 0.86 * 1.02 * tk;
      const top = Math.min(MG.base * CH + ((M.refTokens + M.allegedTokens) / 2) * tk + gc.box.h / 2, hopTop - headH - 20);
      if (top - gc.box.h < Math.max(pileTop + 10, 0) || top < allH + 4) return {bad: 'head-side-chip'};
      chipTopH = top;
    }
  }
  if (cfg.dry) return {CH, size, cfg: {...cfg, dry: false}};
  return {CH, tw, size, cfg, arr, laneW, laneH: perLaneH, gapL, heads: hds, headH: hdH, shared, bandH, gc, gcW, colW, textcol, headSide: Boolean(cfg.headSide), chipTopH};
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
    const A = p.scenarioA, B = p.scenarioB;
    const sharedRows = [
      ...M.entries.map(e => ({key: `ev${e.i}`, icon: e.dir === 'in' ? 'in' : 'out', text: entryText(ctx, p, e)})),
      ...p.sharedFacts.map((f, i) => ({key: `sf${i}`, icon: 'record', text: f})),
      {key: 'scale', icon: 'scale', text: t.scale.replace('{n}', String(M.per)).replace('{u}', (p.model && p.model.unit) || t.unit)},
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged2 : t.proposed})`})),
      ...linkNotes(ctx, M),
      ...(p.losses[1] ? [{key: 'loss1', icon: 'diff', text: `${t.alsoNoted}: ${p.losses[1].label}${p.losses[1].amount ? ` · ${amountText(ctx, p, p.losses[1].amount)}` : ''}`}] : []),
    ];
    const band = [
      {key: 'sharedHead', text: t.shared, when: 'shared'},
      ...sharedRows.map(rw => ({...rw, when: 'shared'})),
      {key: 'changed', icon: 'gate', text: `${t.changed}: ${p.changedFact}`, when: 'changed'},
      {key: 'neutral', text: p.comparisonLabels.neutral || t.neutral, when: 'note'},
      {key: 'key', text: t.key, when: 'key'},
    ];
    const base = {
      M, heads: [
        {key: 'hA', letter: 'A', side: 'before', text: `A · ${A.label}${A.caption ? ` · ${A.caption}` : ''}`},
        {key: 'hB', letter: 'B', side: 'after', text: `B · ${B.label}${B.caption ? ` · ${B.caption}` : ''}`},
      ],
      band, guideText: `${p.comparisonLabels.guide || t.guide}: ${p.losses[0].label} · ${amountText(ctx, p, p.losses[0].amount || 0)}`,
      memo: {shared: new Map(), gc: new Map()},
    };
    const hMin = ctx.view.shape === 'portrait' ? 220 : 155;
    let pick = null, best = null;
    const why = [];
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      if (best && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      for (const arr of SH.arr) for (const half of [false, true]) for (const headSide of [false, true]) for (const colF of arr === 'textcol' ? [0.28, 0.3, 0.32, 0.33] : [0]) {
        // (for textcol, `half` selects the split column: the late chips under the lanes)
        const low = arr === 'textcol' && half;
        // labels hidden: the ●/◆ badges stand beside the hoppers (a badge row above the lanes would float alone)
        if (!ctx.show('key') && !headSide) continue;
        const X = compose(ctx, base, {size, arr, half: arr === 'textcol' ? false : half, low, headSide, colF, hMin, dry: true});
        if (!X.cfg) { why.push(`${arr}${headSide ? 'S' : ''}/${half ? 'h' : ''}@${size}:${X.bad}${X.CH ? Math.round(X.CH) : ''}`); continue; }
        if (!best) best = X;
        // text at >= 20 (the 19.5 px baseline floor) wins over a larger stage with smaller text
        const ok20 = s0 => s0 >= 20 - 1e-9;
        if (!pick || ok20(X.size) > ok20(pick.size) || (ok20(X.size) === ok20(pick.size) && X.CH > pick.CH + 1e-6)) pick = X;
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    let Dv = ctx.design;
    // fallback: a taller virtual box scaled into the real one (flagged); last resort (e.g. the DOM-less text estimator):
    // text limits relaxed, flagged in semantic.problems — never throws
    for (const force of [false, true]) {
      for (let f = 1.1; f <= (force ? 12.01 : 4.01) && !L; f += force ? 0.5 : 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const arr of SH.arr) {
          if (L) break;
          const X = compose(c2, base, {size: SH.minSize, arr, hMin: force ? 20 : 60, fallback: true, colF: 0.3, force});
          if (X.heads) { L = X; Dv = c2.design; if (force) L.problems = ['no-layout-fits']; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0) || globalThis.__whyAll).slice(0, globalThis.__whyAll ? 400 : 12);
    L.M = M; L.P = P;
    L.gs = Math.max(18, Math.min(30, L.CH * 0.09));
    const full = Dv.w - 2 * MARGIN;
    const CH = L.CH;
    const lanesH = L.arr === 'row' ? L.laneH : 2 * L.laneH + L.gapL;
    const blockH = lanesH + L.bandH;
    let y = Math.max(0, (Dv.h - blockH) / 2);
    // textcol + low: the late chips (changed fact, neutral note, key) run ABOVE the lanes, so the machines stand at the
    // foot of the box from the first frame
    const lowY = y;
    if (L.shared && L.shared.low) y += L.bandH;
    const laneTop = [];
    if (L.arr === 'row') { laneTop.push(y, y); y += L.laneH; } else { laneTop.push(y); y += L.laneH + L.gapL; laneTop.push(y); y += L.laneH; }
    const laneX = L.arr === 'row' ? [MARGIN, MARGIN + L.laneW + L.gapL] : [MARGIN, MARGIN];
    L.lanes = [0, 1].map(i => {
      const x0 = laneX[i], y0 = laneTop[i];
      const hd = L.heads[i];
      const mw = machineW(CH, L.tw);
      const mx0 = x0 + Math.max(0, (L.laneW - mw - L.gcW) / 2);
      const F = y0 + L.laneH - 16;
      const hopTopY = F - (MG.base + 1 + MG.hopGap + MG.hopH) * CH;
      const head = L.headSide
        ? hd.build(mx0 + (L.tw + MG.gapT + MG.col / 2 + 0.4) * CH + 24, hopTopY, i ? 'hB' : 'hA')
        : hd.build(x0 + (L.laneW - hd.w) / 2, y0, i ? 'hB' : 'hA');
      const cx = mx0 + (L.tw + MG.gapT + MG.col / 2) * CH;
      const C = columnGeom(cx, F - MG.base * CH, CH);
      const trayR = {x0: C.x1 + MG.gapT * CH, x1: C.x1 + (MG.gapT + L.tw) * CH};
      const trayL = {x0: C.x0 - (MG.gapT + L.tw) * CH, x1: C.x0 - MG.gapT * CH};
      const mouthY = C.top - MG.hopGap * CH;
      return {i, x0, y0, head, F, C, trayR, trayL, mouthY, mx0};
    });
    L.trayPos = (tray, k, F, C) => {
      const col = Math.floor(k / 7), row = k % 7;
      return {x: tray.x0 + C.tokW * (0.62 + col * 1.05), y: F - (row + 0.5) * C.tokH * 1.02};
    };
    // the guide: a level line at A's level (the reference, as stated) carried to the same height on B, and B's bracket
    const [la, lb] = L.lanes;
    const refY = n => (ln => (n ? ln.C.slotY(n - 1) - ln.C.tk * 0.5 : ln.C.baseY));
    L.refYA = refY(M.refTokens)(la);
    L.refYB = refY(M.refTokens)(lb);
    L.allYB = refY(M.allegedTokens)(lb);
    L.bx = lb.C.x1 + MG.bracket * CH * 0.55;
    if (L.gc) {
      const cy0 = (L.refYB + L.allYB) / 2;
      // (headSide: the chip's top may be lowered so it stays under B's head)
      const cy = L.chipTopH === null ? cy0 : Math.max(cy0, lb.F - L.chipTopH + L.gc.box.h / 2);
      // the chip never covers B's right tray or its pile of outflow tokens (review 2026-09-27): its bottom stays >= 10
      // above the higher of the tray rim and the pile
      const outN = Math.min(7, M.entries.reduce((q, e) => q + (e.take || 0), 0));
      const propTop = Math.min(lb.F - lb.C.tokH * 2.2, lb.F - outN * lb.C.tokH * 1.02) - 10;
      const cyTop = Math.min(cy - L.gc.box.h / 2, propTop - L.gc.box.h);
      L.guideChip = chipG(ctx, base.guideText, {x: L.bx + 16, y: cyTop, maxWidth: L.gc.box.w + 1, size: L.size, maxLines: 5, fill: th.card, stroke: th.accent2, name: 'guide-chip'});
    }
    // shared band
    const sy = L.shared && L.shared.low ? lowY : y + 16;
    L.bandNodes = [];
    if (L.shared.bsz.length) {
      const pl = L.textcol
        ? [...flowRows(L.shared.bsz, {x: MARGIN + L.laneW + 24, y: Math.max(0, (Dv.h - L.shared.bandH) / 2), w: L.colW, gap: 18, rowGap: 10}).placed,
          ...(L.shared.low ? flowRows(L.shared.low.bsz, {x: MARGIN, y: sy, w: L.laneW, gap: 18, rowGap: 10, center: true}).placed : [])]
        : flowRows(L.shared.bsz, {x: MARGIN, y: sy, w: full, gap: 18, rowGap: 10, center: true}).placed;
      for (const q of pl) {
        const it = q.it.it;
        const st = it.key === 'changed' ? {fill: th.accent2Soft, stroke: th.accent2} : it.key === 'sharedHead' ? {fill: th.paperShade, stroke: th.inkSoft} : {};
        const b = q.it.build(q.x, q.y, `band-${it.key}`, st);
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    const Dr = ctx.design;
    L.k = Math.min(1, Dr.w / Dv.w, Dr.h / Dv.h);
    L.dx = (Dr.w - Dv.w * L.k) / 2;
    L.dy = (Dr.h - Dv.h * L.k) / 2;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const CH = L.CH;
    const laneNode = ln => {
      const n = ln.i ? 'B' : 'A';
      const C = ln.C;
      const toks = [];
      for (let k = 0; k < L.P.total; k++) toks.push(g({name: `t${n}${k}`, transform: T(C.cx, ln.mouthY - MG.hopH * CH * 0.45)}, tokenArt(ctx, {w: C.tokW, hh: C.tokH, tone: (k % 3) * 0.05})));
      return g({name: `lane${n}`},
        floorArt(ctx, {name: `floor${n}`, x0: ln.x0 + 6, x1: ln.x0 + L.laneW - 6, floorY: ln.F}),
        trayArt(ctx, {name: `trayR${n}`, x0: ln.trayR.x0, x1: ln.trayR.x1, floorY: ln.F, hh: C.tokH * 2.2}),
        // B's ◆ tray and gate slide in at the change beat (A never has them)
        // the localized change: A's left foot gets a shut ● plate, B's gets an open ◆ gate and its tray
        ln.i ? g({name: 'gateB', opacity: 0},
          trayArt(ctx, {x0: ln.trayL.x0, x1: ln.trayL.x1, floorY: ln.F, hh: C.tokH * 2.2, alleged: true}),
          ) : null,
        columnArt(ctx, {name: `column${n}`, C, gate2: false}),
        h('path', {d: `M${r(C.x0 - 16)} ${r(C.baseY + 16)}L${r(C.x0 - 6)} ${r(ln.F)}M${r(C.x1 + 16)} ${r(C.baseY + 16)}L${r(C.x1 + 6)} ${r(ln.F)}`, stroke: th.metalDark, 'stroke-width': 6, 'stroke-linecap': 'round'}),
        g({name: `toks${n}`}, toks),
        // gate plates on the left wall, same size: A's ● plate is down (shut), B's ◆ plate is raised (open)
        ((pw, ph, lift) => g({name: ln.i ? 'plateB' : 'plateA', opacity: 0},
          h('path', {d: roundRectPath(C.x0 - pw / 2, C.baseY - lift - ph, pw, ph, 4), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
          sideMark(ctx, {cx: C.x0, cy: C.baseY - lift - ph / 2, s: pw * 0.62, side: ln.i ? 'after' : 'before'})))(L.gs * 1.4, L.gs * 1.7, ln.i ? C.tk * 1.4 : 0),
        hopperArt(ctx, {name: `hopper${n}`, cx: C.cx, mouthY: ln.mouthY, w: C.cw * 1.9, hh: MG.hopH * CH}),
        ln.head.node,
      );
    };
    const [la, lb] = L.lanes;
    // the guide: level line at A's level, carried to B at the same height (row) or along the left edge (column)
    // (drawn in ink, not an alarm colour; it runs only through empty space above the trays)
    let lineD;
    if (L.arr === 'row') lineD = `M${r(la.C.x1 + 4)} ${r(L.refYA)}H${r(lb.C.x0 - 4)}`;
    else { const xl = la.trayL.x0 - 4; lineD = `M${r(la.C.x0 - 4)} ${r(L.refYA)}H${r(xl)}V${r(L.refYB)}H${r(lb.C.x0 - 4)}`; }
    const bl = Math.abs(L.allYB - L.refYB) + 20;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.lanes.map(laneNode),
      g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d: lineD, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}),
        // B's reference line (●) inside the column at the same height as A's level
        h('path', {d: `M${r(lb.C.x0 + 3)} ${r(L.refYB)}H${r(lb.C.x1 - 3)}`, stroke: th.ink, 'stroke-width': 3}),
        sideMark(ctx, {cx: L.arr === 'row' ? la.C.x1 + 4 + L.gs * 0.7 : la.C.x0 - 4 - L.gs * 0.7, cy: L.refYA - L.gs * 0.75, s: L.gs * 0.8, side: 'before'}),
        h('path', {name: 'guide-bracket', d: `M${r(lb.C.x1 + 6)} ${r(L.refYB)}H${r(L.bx)}V${r(L.allYB)}H${r(lb.C.x1 + 6)}`, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(bl + 40)} ${r(bl + 60)}`, 'stroke-dashoffset': r(bl + 40)}),
        L.guideChip ? L.guideChip.node : null),
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const CH = L.CH;
    const nodes = {};
    const look = [];
    const fa = seg(u, ...W.flow);
    L.lanes.forEach(ln => {
      const n = ln.i ? 'B' : 'A';
      const C = ln.C;
      const fb = ln.i ? seg(u, ...W.gap) : 0;
      const S = flowState(L.P, fa, fb);
      const outOrder = L.P.steps.filter(s0 => s0.kind === 'out').map(s0 => s0.token);
      const gapOrder = L.P.gapSteps.map(s0 => s0.token);
      const pts = [];
      for (const tk of S.tokens) {
        let x = C.cx, y;
        if (tk.where === 'hopper') y = ln.mouthY - MG.hopH * CH * 0.45;
        else if (tk.where === 'fall') y = lerp(ln.mouthY - MG.hopH * CH * 0.45, C.slotY(tk.vslot), tk.drop);
        else if (tk.where === 'stack') y = C.slotY(tk.vslot);
        else {
          const tray = tk.where === 'out' ? ln.trayR : ln.trayL;
          const k = (tk.where === 'out' ? outOrder : gapOrder).indexOf(tk.id);
          const dest = L.trayPos(tray, k, ln.F, C);
          const s0 = tk.slide; // linear: steady speed out of the gate and onto the tray
          const exitX = tk.where === 'out' ? C.x1 + C.tokW * 0.6 : C.x0 - C.tokW * 0.6;
          const y0 = C.slotY(0);
          if (s0 < 0.5) { x = lerp(C.cx, exitX, s0 * 2); y = y0; } else { const q = (s0 - 0.5) * 2; x = lerp(exitX, dest.x, q); y = lerp(y0, dest.y, q * q); }
        }
        nodes[`t${n}${tk.id}`] = {transform: T(x, y)};
        pts.push({x: r(x - ln.x0, 1), y: r(y - ln.y0, 1)});
      }
      nodes[ln.i ? 'hB' : 'hA'] = {opacity: r(seg(u, ...W.heads), 3)};
      look.push({tokens: pts, stack: S.stack.length, head: r(seg(u, ...W.heads), 3)});
    });
    const gIn = ease.outCubic(seg(u, ...W.gateIn));
    // B's ◆ tray slides out from under the column to its place (it never travels past its rest position, so it stays
    // inside the frame)
    nodes.gateB = {opacity: r(gIn > 0 ? 1 : 0, 3), transform: T((1 - gIn) * L.tw * CH * 0.9, 0)};
    nodes.plateA = {opacity: r(gIn > 0 ? 1 : 0, 3), transform: T(0, -(1 - gIn) * CH * 0.3)};
    nodes.plateB = {opacity: r(gIn > 0 ? 1 : 0, 3), transform: T(0, -(1 - gIn) * CH * 0.3)};
    nodes.guide = {opacity: r(seg(u, ...W.line), 3)};
    const bl = Math.abs(L.allYB - L.refYB) + 20;
    nodes['guide-bracket'] = {'stroke-dashoffset': r((bl + 40) * (1 - seg(u, ...W.guide)))};
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.when === 'key' ? seg(u, ...W.key) : b.when === 'changed' ? seg(u, ...W.changed) : b.when === 'shared' ? seg(u, ...W.shared) : seg(u, ...W.note), 3)};
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.record[1] ? 'record' : 'guide',
      lookA: {...look[0], gate: r(gIn, 3)}, lookB: {...look[1], gate: r(gIn, 3)},
      gateB: r(gIn, 3),
      stackA: look[0].stack, stackB: look[1].stack,
      refTokens: L.M.refTokens, allegedTokens: L.M.allegedTokens, gapTokens: L.M.gapTokens,
      flow: r(fa, 3), gapB: r(seg(u, ...W.gap), 3),
      guideShown: seg(u, ...W.guide) >= 1, keyShown: seg(u, ...W.key) >= 1,
      tokA0: look[0].tokens[0] || null, tokB0: look[1].tokens[0] || null,
      arrangement: L.arr,
      layout: {CH: r(CH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, why: L.why},
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
    slug: 'causation-06-contrast',
    title: 'Economic loss — reference scenario and alleged loss, two flow machines that differ only by the stated difference',
    titleEs: 'Pérdida económica — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Pérdida económica',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical flow machines, A (reference scenario, ●) and B (alleged loss, ◆). One localized change each: A’s left gate is shut with a ● plate, B’s is opened with a ◆ plate and a tray; the same supplied entries then run in both, and only B lets the supplied stated difference out. A level line and a bracket on B mark the one difference, as stated. Shared entries drawn once. No winner, no outcome; nothing is computed or valued and no damages, compensation, liability, fault or causation is stated.',
    tags: ['causation', 'economic loss', 'contrast', 'reference scenario', 'alleged loss', 'stated difference', 'flows', 'as stated'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/perdida-economica.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
