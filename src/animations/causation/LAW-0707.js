/**
 * LAW-0707 — Agravación de daño · contrast
 *
 * Storyboard (two complete panel rigs of equal size and timing; only the
 * supplied later change differs):
 *  0.00–0.17 base      Two identical rigs, A and B: the same panel (Object A)
 *                      with its mark at the supplied initial level, the same
 *                      rail with its siding and a plain flag waiting there.
 *                      Header chips "● A · Prior condition · as supplied" and
 *                      "◆ B · Later change · as supplied" (equal chips, same
 *                      colour). One frame per head; at the change beat its
 *                      text swaps in sequence, both heads alike: the line
 *                      without a level fades out (0.200–0.212), then the
 *                      line with the level fades in (0.214–0.226). The supplied entries both
 *                      share are drawn ONCE.
 *  0.17–0.40 change    One localized change on each rail: A gets a ● stop
 *                      clamped at the initial level; B gets a ◆ stop clamped at
 *                      the supplied later level (0.20–0.34). Equal stops, equal
 *                      weight. The "Changed fact" chip names it.
 *  0.40–0.77 run       In parallel the same action runs on both rigs: each flag
 *                      slides from the siding to the initial level and drops its
 *                      edge line (0.40–0.55). Then only on B the mark spreads to
 *                      the supplied later level, the flag riding its edge up to
 *                      the ◆ stop (0.58–0.74); A's ● stop holds A's flag where it
 *                      is — the same action, adapted only to the contrasted fact.
 *  0.77–1.00 guide     A solid ink guide joins A's edge to the same line on B,
 *                      and a bracket over B's strip carries "Only this differs:
 *                      <variation> level a → level b (illustrative scale)". A
 *                      neutral note ("No winner, no conclusion") and the key "As
 *                      supplied · no conclusion drawn". Placeholder levels;
 *                      nothing attributed, measured, valued or decided; no red.
 * Wide boxes: A and B side by side. Tall boxes: A above B.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0707
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  agFields, AG_STRINGS, AG_DEFAULTS, AG_ES_DEFAULTS, resolveAG, entryText, variationText, levelText, linkNotes, altText, gp, unwidow,
  RIG, rigGeom, rigArt, rigW, rigH, markD, flagArt, edgeD, floorArt, iconChip, flowRows, fitG, chipG, sideMark,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/agravacion-dano.js';

const ID = 'LAW-0707';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], run: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0, 0.04], lvOut: [0.2, 0.212], lvIn: [0.214, 0.226], shared: [0, 0.05], stops: [0.2, 0.34], changed: [0.22, 0.3],
  slide: [0.4, 0.52], edge: [0.51, 0.55], spread: [0.58, 0.74],
  line: [0.77, 0.81], guide: [0.79, 0.84], note: [0.82, 0.87], key: [0.84, 0.89],
};

const strings = {
  en: {...AG_STRINGS.en, shared: 'Same in A and B (as supplied)', changed: 'Changed fact', guide: 'Only this differs', neutral: 'No winner, no conclusion: two states side by side'},
  // (scale wording: 'ilustrativa' rather than the kit's 'marcador'; set here so accepted LAW-0706/0708 stay unchanged)
  es: {...AG_STRINGS.es, scale: 'Escala: 1 columna = 1 nivel (ilustrativa)', shared: 'Igual en A y B (según lo aportado)', changed: 'Hecho que cambia', guide: 'Solo esto cambia', neutral: 'Sin ganador ni conclusión: dos estados comparados'},
};

const sceneSchema = {
  ...agFields,
  ...contrastFields(),
};

const defaultParams = {
  ...AG_DEFAULTS,
  scenarioA: {label: 'Prior condition', caption: 'as supplied'},
  scenarioB: {label: 'Later change', caption: 'as supplied'},
  changedFact: 'Only B’s stop sits at the later level, so only B’s mark spreads',
  sharedFacts: ['Same panel, same entries, same scale'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'No winner, no conclusion: two states side by side'},
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...AG_ES_DEFAULTS,
  scenarioA: {label: 'Condición previa', caption: 'según lo aportado'},
  scenarioB: {label: 'Cambio posterior', caption: 'según lo aportado'},
  changedFact: 'Solo el tope de B está en el nivel posterior, así que solo se extiende la marca de B',
  sharedFacts: ['Mismo panel, mismas entradas, misma escala'],
  comparisonLabels: {guide: 'Solo esto cambia', neutral: 'Sin ganador ni conclusión: dos estados comparados'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['row']},
  square: {size: 24, minSize: 17, arr: ['row', 'column', 'textcol']},
  portrait: {size: 25, minSize: 17, arr: ['column']},
};
// one flag per rig: a short siding (it waits there alone) and short stems
const PARK = 0.2;
const RW_ = rigW(undefined, PARK), RH_ = rigH(true);

/** Header chip: solid ●/◆ cue (equal weight, same colour) + "A · label" / "B · label". */
function headChip(ctx, it, size, maxW, textOn) {
  const th = ctx.theme;
  const R = size * 0.8;
  const fo = {maxWidth: maxW - 2 * R - 34, size, minSize: size, maxLines: 4, weight: 700};
  const fit = textOn ? fitG(ctx, unwidow(gp(it.text), t0 => fitG(ctx, t0, fo)), fo) : null;
  // (the same head without its level, shown before the change beat in the SAME frame)
  const fit0 = textOn && it.text0 ? fitG(ctx, unwidow(gp(it.text0), t0 => fitG(ctx, t0, fo)), fo) : null;
  const tw = Math.max(fit ? fit.width : 0, fit0 ? fit0.width : 0), th0 = Math.max(fit ? fit.height : 0, fit0 ? fit0.height : 0);
  const w = 2 * R + (fit ? 16 + tw + 18 : 12);
  const hh = Math.max(2 * R + 10, fit ? th0 + size * 0.8 : 0);
  return {
    hasText0: Boolean(fit0), w, h: hh, bad: fit ? fit.truncated || fit.broken || Boolean(fit0 && (fit0.truncated || fit0.broken)) : false,
    build(x, y, name) {
      const cy = y + hh / 2;
      return {node: g({name, opacity: 0},
        h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.8)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
        sideMark(ctx, {cx: x + R + 6, cy, s: R * 1.5, side: it.side}),
        fit0 ? g({name: `${name}-t0`}, textBlock(fit0, {x: x + 2 * R + 20, y: cy - fit0.height / 2, fill: th.ink})) : null,
        fit ? g({name: `${name}-t1`, opacity: fit0 ? 0 : 1}, textBlock(fit, {x: x + 2 * R + 20, y: cy - fit.height / 2, fill: th.ink})) : null,
      ), box: {x, y, w, h: hh}};
    },
  };
}

/** A clamp stop on the rail (● / ◆, identical shape and weight). Local origin = the rail top at the stop's x. */
function stopArt(ctx, {name, G, side}) {
  const th = ctx.theme;
  const w = G.PH * 0.09, hh = G.PH * 0.16;
  return g({name, opacity: 0},
    h('path', {d: roundRectPath(-w / 2, -hh * 0.55, w, hh, 3), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    sideMark(ctx, {cx: 0, cy: -hh * 0.55 + hh * 0.4, s: w * 0.78, side}),
  );
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
  const need = arr === 'row' ? 0.4 : textcol ? 0.55 : 0.71;
  if (!cfg.fallback && laneW - 12 < need * v.width / fs + 2) return {bad: 'lane-share'};
  // headSide: each lane's head chip stands right of its rig, at the rig's top (B's guide chip under it)
  const side = Boolean(cfg.headSide);
  const heads = base.heads.map(it => headChip(ctx, it, size, side ? Math.min(laneW * 0.4, 420) : laneW, textOn));
  if (heads.some(q => q.bad) && !cfg.force) return {bad: 'head'};
  const headH = Math.max(...heads.map(q => q.h));
  // the guide chip beside B's rig (measured once)
  const gk = `${size}|${Math.round(laneW)}|${cfg.wideGuide ? 1 : 0}`;
  let gc = memo.gc.get(gk);
  if (gc === undefined) {
    const o = {x: 0, y: 0, maxWidth: Math.max(size * 8, Math.min(laneW * (cfg.wideGuide ? 0.56 : 0.4), cfg.wideGuide ? 440 : 360)), size, maxLines: 6};
    gc = textOn ? chipG(ctx, unwidow(base.guideText, t0 => chipG(ctx, t0, o).fit), o) : null;
    if (gc) gc.text = unwidow(base.guideText, t0 => chipG(ctx, t0, o).fit);
    memo.gc.set(gk, gc);
  }
  if (gc && (gc.fit.truncated || gc.fit.broken) && !cfg.force) return {bad: 'guide'};
  const gcW = side ? Math.max(gc ? gc.box.w : 0, ...heads.map(q => q.w)) + 30 : gc ? gc.box.w + 36 : 0;
  const bw = textcol ? colW : full;
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
  const avail = D.h - bandH - (arr !== 'row' ? gapL : 0);
  const perLaneH = arr === 'row' ? avail : avail / 2;
  const innerH = perLaneH - (side ? 0 : headH) - 12;
  const PH = Math.min((laneW - gcW - 12) / RW_, (innerH - 16) / RH_);
  if (!(PH >= cfg.hMin)) return {bad: 'PH', PH};
  // the guide chip fits beside B's rig, above B's floor (headSide: under B's head chip)
  if (gc && gc.box.h + (side ? headH + 12 : 0) > RH_ * PH - 20) return {bad: 'guide-h'};
  if (side && headH > RH_ * PH * 0.5) return {bad: 'head-h'};
  if (cfg.dry) return {PH, size, cfg: {...cfg, dry: false}};
  return {PH, size, cfg, arr, laneW, laneH: perLaneH, gapL, heads, headH, shared, bandH, gc, gcW, colW, textcol, headSide: side};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveAG(p);
    const A = p.scenarioA, B = p.scenarioB;
    const sharedRows = [
      {key: 'object', icon: 'scale', text: `${p.object.name} · ${t.scale}`},
      ...M.entries.map(e => ({key: `ev${e.i}`, icon: e.stage, level: e.stage === 'later' ? M.L1 : M.L0, text: entryText(e)})),
      ...p.sharedFacts.map((f, i) => ({key: `sf${i}`, icon: 'record', text: f})),
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: altText(ctx, a)})),
      ...linkNotes(ctx, M),
      ...(p.losses[1] ? [{key: 'loss1', icon: 'variation', text: `${t.alsoNoted}: ${p.losses[1].label}`}] : []),
    ];
    // (the chips that appear later come first, so the shared rows shown from the first frame take the band's foot)
    const band = [
      {key: 'changed', icon: 'flag', text: `${t.changed}: ${p.changedFact}`, when: 'changed'},
      {key: 'neutral', text: p.comparisonLabels.neutral || t.neutral, when: 'note'},
      {key: 'key', text: t.key, when: 'key'},
      {key: 'sharedHead', text: t.shared, when: 'shared'},
      ...sharedRows.map(rw => ({...rw, when: 'shared'})),
    ];
    const base = {
      M, heads: [
        {key: 'hA', side: 'before', text: `A · ${A.label}${A.caption ? ` · ${A.caption}` : ''} · ${levelText(ctx, M.L0)}`, text0: `A · ${A.label}${A.caption ? ` · ${A.caption}` : ''}`},
        {key: 'hB', side: 'after', text: `B · ${B.label}${B.caption ? ` · ${B.caption}` : ''} · ${levelText(ctx, M.L1)}`, text0: `B · ${B.label}${B.caption ? ` · ${B.caption}` : ''}`},
      ],
      band, guideText: gp(`${p.comparisonLabels.guide || t.guide}: ${variationText(ctx, p, M.L0, M.L1)}`),
      memo: {shared: new Map(), gc: new Map()},
    };
    const hMin = ctx.view.shape === 'portrait' ? 150 : 110;
    let pick = null, best = null;
    const why = [];
    const v0 = ctx.view, fs0 = Math.min(v0.content.w / ctx.design.w, v0.content.h / ctx.design.h);
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      if (best && pick && pick.subj && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      for (const arr of SH.arr) for (const half of [false, true]) for (const headSide of [false, true]) for (const wideGuide of [false, true]) for (const colF of arr === 'textcol' ? [0.28, 0.3, 0.32, 0.33] : [0]) {
        const low = arr === 'textcol' && half;
        const X = compose(ctx, base, {size, arr, half: arr === 'textcol' ? false : half, low, colF, headSide, wideGuide, hMin, dry: true});
        if (!X.cfg) { why.push(`${arr}/${half ? 'h' : ''}@${size}:${X.bad}${X.PH ? Math.round(X.PH) : ''}`); continue; }
        if (!best) best = X;
        // each rig (panel, flag, floor) reaches >= 0.205 of the frame height when it can (subject floor 0.20 + margin);
        // then text at >= 20 (the 19.5 px baseline floor); then the larger rig
        const subj = (X.PH * (RH_ - RIG.brGap - 0.04) + 16) * fs0 >= 0.205 * v0.height;
        const ok20 = s0 => s0 >= 20 - 1e-9;
        const key = q => [q.subj ? 1 : 0, ok20(q.size) ? 1 : 0, q.PH];
        X.subj = subj;
        if (!pick || (() => { const a = key(X), b = key(pick); return a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2] + 1e-6; })()) pick = X;
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
    L.why = why.filter(w0 => /@17:/.test(w0) || globalThis.__whyAll).slice(0, 40);
    L.M = M;
    const full = Dv.w - 2 * MARGIN;
    const PH = L.PH;
    const lanesH = L.arr === 'row' ? L.laneH : 2 * L.laneH + L.gapL;
    const blockH = lanesH + L.bandH;
    // spare height goes mostly above the lanes, so the late chips (changed fact, note, key) never leave the foot empty
    let y = Math.max(0, (Dv.h - blockH) * 0.75);
    const lowY = y;
    if (L.shared && L.shared.low) y += L.bandH;
    const laneTop = [];
    if (L.arr === 'row') { laneTop.push(y, y); y += L.laneH; } else { laneTop.push(y); y += L.laneH + L.gapL; laneTop.push(y); y += L.laneH; }
    const laneX = L.arr === 'row' ? [MARGIN, MARGIN + L.laneW + L.gapL] : [MARGIN, MARGIN];
    L.lanes = [0, 1].map(i => {
      const x0 = laneX[i], y0 = laneTop[i];
      const hd = L.heads[i];
      const mw = RW_ * PH;
      const mx0 = x0 + Math.max(0, (L.laneW - mw - L.gcW) / 2);
      const F = y0 + L.laneH - 16;
      const G = rigGeom(mx0, F, PH, undefined, true, PARK);
      const head = L.headSide ? hd.build(G.x1 + 24, G.top + 2, i ? 'hB' : 'hA') : hd.build(x0 + (L.laneW - hd.w) / 2, y0, i ? 'hB' : 'hA');
      return {i, x0, y0, head, F, G, mx0};
    });
    const [la, lb] = L.lanes;
    L.bx = [lb.G.x(Math.min(M.L0, M.L1)), lb.G.x(Math.max(M.L0, M.L1))];
    if (L.gc) {
      const G = lb.G;
      const chipX = G.x1 + 24;
      const y0 = L.headSide ? Math.max(lb.head.box.y + lb.head.box.h + 12, Math.min(G.bracketY - L.gc.box.h / 2, lb.F - 24 - L.gc.box.h)) : clamp(G.bracketY - L.gc.box.h / 2, G.top + 2, lb.F - 24 - L.gc.box.h);
      L.guideChip = chipG(ctx, L.gc.text, {x: chipX, y: y0, maxWidth: L.gc.box.w + 1, size: L.size, maxLines: 6, fill: th.card, stroke: th.accent2, name: 'guide-chip'});
      const my = clamp(G.bracketY, y0 + 14, y0 + L.guideChip.box.h - 14);
      const sx = L.bx[1] + G.headS * 0.6 + 4;
      L.guideLead = Math.abs(my - G.bracketY) < 1 ? `M${r(sx)} ${r(G.bracketY)}H${r(chipX)}` : `M${r(sx)} ${r(G.bracketY)}H${r(chipX - 12)}V${r(my)}H${r(chipX)}`;
    }
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
    const M = L.M;
    const laneNode = ln => {
      const n = ln.i ? 'B' : 'A';
      const G = ln.G;
      return g({name: `lane${n}`},
        floorArt(ctx, {name: `floor${n}`, x0: ln.x0 + 6, x1: ln.x0 + L.laneW - 6, floorY: ln.F}),
        rigArt(ctx, {P: `r${n}`, G, level: M.L0, varFrom: M.L0, varTo: M.L1}),
        // the localized change: A's ● stop at the initial level, B's ◆ stop at the later level (same shape and weight)
        g({name: `stop${n}`, transform: T(G.x(ln.i ? M.L1 : M.L0) + G.headS * 0.35, G.railTop)}, stopArt(ctx, {name: `stop${n}-art`, G, side: ln.i ? 'after' : 'before'})),
        g({name: `flag${n}`, transform: T(G.parkB, G.railTop)}, flagArt(ctx, {name: `f${n}`, G, side: 'plain'})),
        ln.head.node,
      );
    };
    const [la, lb] = L.lanes;
    // the guide: A's edge line carried to the same line on B (row: across the gap above the rails; column: down the left)
    let lineD;
    const ya = la.G.railTop - la.G.PH * 0.05, yb = lb.G.railTop - lb.G.PH * 0.05;
    if (L.arr === 'row') lineD = `M${r(la.G.x(M.L0))} ${r(ya)}H${r(lb.G.x(M.L0))}`;
    else { const xl = la.G.x0 - 2; lineD = `M${r(la.G.x(M.L0))} ${r(ya)}H${r(xl)}V${r(yb)}H${r(lb.G.x(M.L0))}`; }
    const G = lb.G;
    const tick = G.railTop - G.PH * 0.1;
    const bD = `M${r(G.x(M.L0))} ${r(tick)}V${r(G.bracketY)}H${r(G.x(M.L1))}V${r(tick)}`;
    const bl = Math.abs(G.x(M.L1) - G.x(M.L0)) + 2 * (tick - G.bracketY) + 10;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.lanes.map(laneNode),
      g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d: lineD, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}),
        h('path', {name: 'guide-bracket', d: bD, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(bl)} ${r(bl + 20)}`, 'stroke-dashoffset': r(bl)}),
        L.guideChip ? h('path', {name: 'guide-lead', d: L.guideLead, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linejoin': 'round'}) : null),
      L.guideChip ? g({name: 'guide-chip-g', opacity: 0}, L.guideChip.node) : null,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const M = L.M;
    const nodes = {};
    const look = [];
    const sl = ease.inOutCubic(seg(u, ...W.slide));
    const ed = seg(u, ...W.edge);
    const st = ease.outCubic(seg(u, ...W.stops));
    L.lanes.forEach(ln => {
      const n = ln.i ? 'B' : 'A';
      const G = ln.G;
      const sp = ln.i ? ease.inOutCubic(seg(u, ...W.spread)) : 0;
      const lv = lerp(M.L0, M.L1, sp);
      const fx = sp > 0 ? G.x(lv) : lerp(G.parkB, G.x(M.L0), sl);
      nodes[`r${n}mark`] = {d: markD(G, lv)};
      nodes[`r${n}stripes`] = {opacity: ln.i ? r(seg(u, ...W.line), 3) : 0};
      nodes[`flag${n}`] = {transform: T(fx, G.railTop)};
      nodes[`f${n}-edge`] = {d: edgeD(G, ed), opacity: ed > 0 ? 1 : 0};
      nodes[`stop${n}-art`] = {opacity: st > 0 ? 1 : 0};
      nodes[`stop${n}`] = {transform: T(G.x(ln.i ? M.L1 : M.L0) + G.headS * 0.35, G.railTop - (1 - st) * G.PH * 0.12)};
      // one head frame; its text swaps in sequence (no level → level), never both lines legible at once
      const hn = ln.i ? 'hB' : 'hA';
      nodes[hn] = {opacity: r(seg(u, ...W.heads), 3)};
      if (L.heads[ln.i].hasText0) { nodes[`${hn}-t0`] = {opacity: r(1 - seg(u, ...W.lvOut), 3)}; nodes[`${hn}-t1`] = {opacity: r(seg(u, ...W.lvIn), 3)}; }
      // (lane-local look: positions relative to the lane, the stop's progress and the mark's level)
      look.push({flag: r(fx - ln.x0, 1), level: r(lv, 3), stop: r(st, 3), edge: r(ed, 3), head: r(seg(u, ...W.heads), 3)});
    });
    nodes.guide = {opacity: r(seg(u, ...W.line), 3)};
    const G = L.lanes[1].G;
    const tick = G.railTop - G.PH * 0.1;
    const bl = Math.abs(G.x(M.L1) - G.x(M.L0)) + 2 * (tick - G.bracketY) + 10;
    nodes['guide-bracket'] = {'stroke-dashoffset': r(bl * (1 - seg(u, ...W.guide)))};
    if (L.guideChip) nodes['guide-chip-g'] = {opacity: r(seg(u, ...W.guide), 3)};
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.when === 'key' ? seg(u, ...W.key) : b.when === 'changed' ? seg(u, ...W.changed) : b.when === 'shared' ? seg(u, ...W.shared) : seg(u, ...W.note), 3)};
    const fA = L.lanes[0], fB = L.lanes[1];
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.run[1] ? 'run' : 'guide',
      // before the change beat the two lanes are identical (the stops are not yet in place)
      lookA: u < W.stops[0] ? {...look[0], stop: 0} : look[0], lookB: u < W.stops[0] ? {...look[1], stop: 0} : look[1],
      stops: r(st, 3), slide: r(sl, 3),
      levelA: look[0].level, levelB: look[1].level, initial: M.L0, later: M.L1,
      flagA: {x: r(look[0].flag + fA.x0), y: r(fA.G.railTop)},
      flagB: {x: r(look[1].flag + fB.x0), y: r(fB.G.railTop)},
      guideShown: seg(u, ...W.guide) >= 1, keyShown: seg(u, ...W.key) >= 1,
      arrangement: L.arr,
      layout: {PH: r(L.PH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, why: L.why},
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
    slug: 'causation-07-contrast',
    title: 'Aggravation of damage — prior condition and later change, two identical panels that differ only by the supplied later level',
    titleEs: 'Agravación de daño — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Agravación de daño',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical fictional panels, A (prior condition, ●) and B (later change, ◆). One localized change each: a ● stop clamped on A’s rail at the initial level, a ◆ stop on B’s rail at the supplied later level. The same action then runs on both — each flag slides to the initial level — and only on B the mark spreads to its stop. A guide line and a bracket on B mark the one difference, as supplied. Shared entries drawn once. No winner, no conclusion; placeholder levels on an illustrative scale; nothing attributed, measured, valued or decided.',
    tags: ['causation', 'aggravation of damage', 'contrast', 'prior condition', 'later change', 'variation as supplied', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/agravacion-dano.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
