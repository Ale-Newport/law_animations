/**
 * LAW-0335 — Límites de revisión · contrast
 *
 * Storyboard (two complete desk scenes of the same size — side by side on wide frames, one above the other on tall
 * ones — each with the same placeholder decision, the same arrow tag and the same review frame; only ONE fact differs:
 * the section the question's arrow points at):
 *  0.00–0.17  base: both scenes identical; the arrow lies parked beside the sheet's title, touching nothing; no frame.
 *  0.17–0.40  the changed fact, localised: in A the arrow slides down to its section, in B to a different section
 *             (as supplied) — the only change of geometry between the scenes.
 *  0.40–0.77  in parallel and identically, the review frame comes down from the top edge onto the supplied sections,
 *             is laid flat and its filter glass settles. In A the arrow's tip ends inside the frame, in B outside —
 *             a consequence of geometry only.
 *  0.77–1.00  the guide: a highlight outline round each arrow joined by one line with its label ("only this
 *             differs"); under each scene where its section lies (inside / outside, as supplied, equal-weight icons);
 *             the neutral note and key. No winner, no score, no conclusion about what a review may cover.
 * @module animations/review/LAW-0335
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, list, obj} from '../../schemas/fields.js';
import {roundRectPath} from '../../core/geometry.js';
import {deskWindow} from '../../primitives/desk.js';
import {chip} from '../../primitives/annotate.js';
import {
  lrFields, LR_EN, LR_ES, localisedLr, sheetModel, sheetNode, frameExtent, frameNode, frameProps, arrowNode,
  panelLayout, panelNode, fitG, textAt, INK, R2,
} from './kits/limites-de-revision.js';

const ID = 'LAW-0335';
const DURATION = 7500;
const CHANGE_AT = 0.17;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {slide: [0.19, 0.38], descend: [0.42, 0.62], lay: [0.62, 0.67], glass: [0.67, 0.75], guide: [0.77, 0.83], states: [0.78, 0.83], notes: [0.8, 0.85]};
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  grounds: [
    {side: 'a', text: 'The question points at Section 2 here (as supplied)', section: 1},
    {side: 'b', text: 'The question points at Section 4 here (as supplied)', section: 3},
  ],
  scenarioA: {label: 'Question inside the frame', caption: ''},
  scenarioB: {label: 'Question outside the frame', caption: ''},
  changedFact: 'Only the section the arrow points at differs',
  sharedFacts: ['Same decision and sections', 'Same frame over Sections 2–3'],
  comparisonLabels: {guide: 'only this differs', neutral: 'Two supplied situations side by side: no winner, no outcome'},
};
const OWN_ES = {
  grounds: [
    {side: 'a', text: 'La cuestión señala el Apartado 2 (según lo aportado)', section: 1},
    {side: 'b', text: 'La cuestión señala el Apartado 4 (según lo aportado)', section: 3},
  ],
  scenarioA: {label: 'Cuestión incluida', caption: ''},
  scenarioB: {label: 'Cuestión fuera del marco', caption: ''},
  changedFact: 'Solo cambia el apartado al que apunta la flecha',
  sharedFacts: ['Misma resolución y apartados', 'Mismo marco sobre los Apartados 2–3'],
  comparisonLabels: {guide: 'solo esto cambia', neutral: 'Dos situaciones aportadas lado a lado: sin ganador ni resultado'},
};
const EN = {...LR_EN, ...OWN_EN};
const ES = {...LR_ES, ...OWN_ES};

const sceneSchema = {
  ...lrFields,
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('Optional one-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('Optional one-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B (here: the section the question points at; A uses grounds[a].section, B uses grounds[b].section)', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide joining the changed detail', 50), neutral: str('Neutral note (no winner, no outcome)', 120)}, ['guide', 'neutral']),
};

const defaultParams = {...EN};

function resolve(P) {
  const n = P.decisions.sections.length;
  const cl = i => Math.max(0, Math.min(n - 1, i | 0));
  const a = cl(P.routes.from), b = cl(P.routes.to);
  const from = Math.min(a, b), to = Math.max(a, b);
  const q = side => P.grounds.find(x => x.side === side) || P.grounds[side === 'a' ? 0 : 1];
  const lanes = ['a', 'b'].map(side => {
    const gq = q(side);
    const section = cl(gq.section);
    return {side, text: gq.text, section, inside: section >= from && section <= to, scen: side === 'a' ? P.scenarioA : P.scenarioB};
  });
  return {n, from, to, lanes};
}

function compose(ctx, P, R, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const arr = ctx.view.shape === 'portrait' ? 'column' : 'row';
  const problems = [];
  const gapS = ctx.view.shape === 'square' ? F * 1.2 : F * 2.2;
  const stageW = arr === 'row' ? (DW - gapS) / 2 : DW;
  const AW = ctx.view.shape === 'square' ? clamp(F * 3.4, 52, 90) : clamp(F * 4.4, 84, 120);
  const inset = ctx.view.shape === 'square' ? Math.max(8, F * 0.4) : Math.max(16, F * 0.8);
  const t = Math.max(12, F * 0.62);
  const m = Math.max(16, F * 0.9);
  const SW = Math.min(arr === 'row' ? 600 : 700, stageW - inset * 2 - AW - m - 8);
  // (1:1 fallback: the decision's title and section tags are identical in both scenes, so they are listed ONCE in the
  // shared strip, keyed by the sheets' index pips; the sheets then carry pips and filler only)
  const M = sheetModel(ctx, {w: SW, F, title: P.decisions.title, sections: P.decisions.sections, showText: showKey && !v.list, bars: v.bars, compact: v.compact, pips: !v.compact});
  if (!M.ok) problems.push('sheet-text');
  const stageH = M.h + inset * 2;
  // header (own: the badge stands right of the arrow column, which the guide's leaders use)
  const badgeR = F * 0.95;
  const headW = stageW - AW - badgeR * 2 - F;
  const heads = R.lanes.map(l => {
    const lab = showKey ? fitG(l.scen.label, {maxWidth: headW, size: F * 1.1, minSize: F, maxLines: 2, weight: 700}) : null;
    const cap = showAll && l.scen.caption ? fitG(l.scen.caption, {maxWidth: headW, size: F, maxLines: 2, weight: 500}) : null;
    if ((lab && !lab.ok) || (cap && !cap.ok)) problems.push('header-text');
    return {lab, cap, h: Math.max(badgeR * 2, (lab ? lab.height : 0) + (cap ? cap.height + F * 0.25 : 0)) + F * 0.5};
  });
  const headH = Math.max(heads[0].h, heads[1].h);
  // lanes' texts (question + state)
  const laneW = arr === 'row' ? stageW : DW;
  const lanePL = R.lanes.map(l => (showKey ? panelLayout(ctx, [{kind: 'item', icon: 'a', text: l.text, sub: l.inside ? P.outcomes.inside : P.outcomes.outside, subIcon: l.inside ? 'inside' : 'outside', name: `lane${l.side}`}], {w: laneW - (arr === 'column' ? badgeR * 2 + F * 0.6 : 0), F}) : null));
  lanePL.forEach(pl => { if (pl && !pl.ok) problems.push('lane-text'); });
  const laneH = Math.max(...lanePL.map(pl => (pl ? pl.h : 0)));
  // guide band
  const guideChip = showAll ? chip(ctx, P.comparisonLabels.guide, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(DW * 0.5, 420), size: F, minSize: F, maxLines: 2, weight: 600}) : null;
  if (guideChip && guideChip.fit.truncated) problems.push('guide-text');
  const bandH = Math.max(F * 2.2, guideChip ? guideChip.box.h + F * 0.8 : 0);
  // shared strip
  const rowsL = [], rowsR = [];
  if (showKey && v.list) {
    rowsL.push({kind: 'heading', icon: 'sheet', text: P.decisions.title, name: 'sh-title'});
    P.decisions.sections.forEach((sct, i) => rowsL.push({kind: 'item', icon: 'pip', index: i, text: sct, name: `sh-sec${i}`}));
  }
  if (showKey) (v.list ? rowsR : rowsL).push({kind: 'heading', icon: 'frame', text: P.labels.frame, name: 'sh-frame'});
  if (showAll) P.sharedFacts.forEach((f, i) => (v.list ? rowsR : rowsL).push({kind: 'item', icon: 'sheet', text: f, name: `sh-fact${i}`}));
  if (showKey) rowsR.push({kind: 'item', icon: 'ring', color: ctx.theme.accent3, text: P.changedFact, name: 'sh-changed'});
  if (showAll) rowsR.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'sh-neutral'});
  if (showKey) rowsR.push({kind: 'key', text: P.labels.key, name: 'key'});
  let strip = null;
  if (rowsL.length + rowsR.length) {
    if (arr === 'row') {
      const cw = (DW - F * 2) / 2;
      const L1 = panelLayout(ctx, rowsL, {w: cw, F}), L2 = panelLayout(ctx, rowsR, {w: cw, F});
      strip = {cols: [{PL: L1, x: 0}, {PL: L2, x: cw + F * 2}], h: Math.max(L1.h, L2.h)};
      if (!L1.ok || !L2.ok) problems.push('strip-text');
    } else {
      const L1 = panelLayout(ctx, [...rowsL, ...rowsR], {w: DW, F});
      strip = {cols: [{PL: L1, x: 0}], h: L1.h};
      if (!L1.ok) problems.push('strip-text');
    }
  }
  const stripH = strip ? strip.h + F * 0.9 : 0;
  // vertical stack
  let stages, total, bandY, laneY;
  if (arr === 'row') {
    total = headH + stageH + bandH + (laneH ? laneH + F * 0.6 : 0) + stripH;
    stages = [0, 1].map(i => ({x: i * (stageW + gapS), y: headH, w: stageW, h: stageH, headY: 0}));
    bandY = headH + stageH;
    laneY = bandY + bandH;
  } else {
    total = (headH + stageH) * 2 + bandH + F * 0.6 + (laneH ? lanePL.reduce((a, pl) => a + (pl ? pl.h + F * 0.5 : 0), 0) + F * 0.3 : 0) + stripH;
    stages = [0, 1].map(i => ({x: 0, y: headH + i * (headH + stageH + bandH), w: stageW, h: stageH, headY: i * (headH + stageH + bandH)}));
    bandY = headH + stageH;
    laneY = (headH + stageH) * 2 + bandH + F * 0.6;
  }
  if (total > DH + 0.5) problems.push('too-tall');
  const dy = Math.max(0, (DH - total) / 2);
  stages.forEach(s => { s.y += dy; s.headY += dy; });
  bandY += dy; laneY += dy;
  const stripY = dy + total - (strip ? strip.h : 0);
  // stage-local geometry
  const sxL = inset + AW + 4, syL = inset;
  const E = frameExtent(M, R.from, R.to, {t, margin: m});
  const aH = Math.min(M.rowH * 0.62, F * 2.1);
  const park = {x: sxL - F * 1.4, y: syL + Math.max(aH / 2 + 4, M.pad * 0.85 + M.titleH / 2)};
  const tipAt = sec => ({x: sxL + F * 0.62, y: syL + M.rows[sec].cy});
  return {F, M, E, t, m, AW, inset, SW, stageW, stageH, arr, stages, heads, headH, badgeR, lanePL, laneY, bandY, bandH, guideChip, strip, stripY, sxL, syL, aH, park, tipAt, ok: !problems.length, problems};
}

const LANE_COLOR = th => [th.accent2, th.cloth[3]];

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedLr(ctx, EN, ES);
    const R = resolve(P);
    let C = null, best = null;
    const vs = [2, 1, 0].map(bars => ({bars})).concat(ctx.view.shape === 'square' ? [{bars: 0, compact: true}] : []);
    outer: for (const F of SIZES) for (const v of vs) {
      const bars = v.bars;
      const c = compose(ctx, P, R, F, v);
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.problems.length) best = c;
    }
    return {P, R, C: C || best};
  },
  build(ctx, L) {
    const {C, R, P} = L;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const lanes = LANE_COLOR(th);
    const stageNodes = C.stages.map((S, i) => {
      const k = i ? 'B' : 'A';
      const desk = deskWindow(ctx, {prefix: `desk${k}`, x: 0, y: 0, w: S.w, h: S.h, radius: 22, seedKey: 'lr-contrast-desk'});
      const hd = C.heads[i];
      const hx = C.AW;
      const header = g({name: `head${k}`, transform: T(S.x, S.headY)},
        h('circle', {cx: r(hx + C.badgeR), cy: r(C.badgeR + 2), r: r(C.badgeR), fill: lanes[i], stroke: INK, 'stroke-width': 2.5}),
        showKey ? h('text', {x: r(hx + C.badgeR), y: r(C.badgeR + 2 + C.F * 0.36), 'text-anchor': 'middle', 'font-size': r(C.F), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, k) : null,
        hd.lab ? textAt(hd.lab, {x: hx + C.badgeR * 2 + C.F * 0.6, y: 2 + Math.max(0, C.badgeR - hd.lab.size * 0.62), fill: th.fg}) : null,
        hd.cap ? textAt(hd.cap, {x: hx + C.badgeR * 2 + C.F * 0.6, y: 2 + Math.max(0, C.badgeR - hd.lab.size * 0.62) + hd.lab.height + C.F * 0.25, fill: th.fgSoft}) : null,
      );
      const frame = frameNode(ctx, {prefix: `fr${k}`, w: C.E.w, t: C.t, yTop: C.E.yTop, yBot: C.E.yBot, knobs: false});
      return g(null, header,
        g({name: `stage${k}`, transform: T(S.x, S.y)},
          desk.surface,
          g({'clip-path': desk.clip},
            g({transform: T(C.sxL, C.syL)}, sheetNode(ctx, C.M, {prefix: `sh${k}`, showText: showKey, seedKey: 'lr-contrast'})),
            g({name: `arrowg${k}`}, arrowNode(ctx, {prefix: `arrow${k}`, side: 'a', len: C.AW + C.F * 0.62 - 4, hgt: C.aH})),
            frame,
          ),
          desk.frame,
          g({name: `outline${k}`, opacity: 0}),
        ));
    });
    // guide: outlines round both arrows, leaders down the arrow column to one line with its chip
    const gc = th.accent3;
    const ol = C.stages.map(S => {
      const tip = C.tipAt(0);
      return {S, tip};
    });
    const guideParts = [];
    const tails = C.stages.map((S, i) => {
      const sec = R.lanes[i].section;
      const tip = C.tipAt(sec);
      const len = C.AW + C.F * 0.62 - 4;
      const box = {x: S.x + tip.x - len - 8, y: S.y + tip.y - C.aH / 2 - 8, w: len + 16, h: C.aH + 16};
      return box;
    });
    void ol;
    const bandMid = C.bandY + C.bandH / 2;
    tails.forEach((b, i) => {
      guideParts.push(h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: gc, 'stroke-width': 5}));
    });
    let chipNode = null;
    if (C.arr === 'row') {
      const lx = tails.map(b => b.x + C.F * 0.9);
      tails.forEach((b, i) => guideParts.push(h('path', {d: `M${r(lx[i])} ${r(b.y + b.h)}V${r(bandMid)}`, fill: 'none', stroke: gc, 'stroke-width': 4})));
      guideParts.push(h('path', {d: `M${r(lx[0])} ${r(bandMid)}H${r(lx[1])}`, fill: 'none', stroke: gc, 'stroke-width': 4}));
      if (C.guideChip) chipNode = chip(ctx, P.comparisonLabels.guide, {x: (lx[0] + lx[1]) / 2, y: bandMid - C.guideChip.box.h / 2, anchor: 'middle', maxWidth: Math.min(ctx.design.w * 0.5, 420), size: C.F, minSize: C.F, maxLines: 2, weight: 600, stroke: gc}).node;
    } else {
      const lx = tails[0].x + C.F * 0.9;
      guideParts.push(h('path', {d: `M${r(lx)} ${r(tails[0].y + tails[0].h)}V${r(tails[1].y)}`, fill: 'none', stroke: gc, 'stroke-width': 4}));
      if (C.guideChip) chipNode = chip(ctx, P.comparisonLabels.guide, {x: lx + C.F * 0.8, y: bandMid - C.guideChip.box.h / 2, anchor: 'start', maxWidth: Math.min(ctx.design.w * 0.5, 420), size: C.F, minSize: C.F, maxLines: 2, weight: 600, stroke: gc}).node;
    }
    const laneNodes = C.lanePL.map((pl, i) => {
      if (!pl) return null;
      const k = i ? 'B' : 'A';
      if (C.arr === 'row') return g({name: `lanes${k}`, transform: T(C.stages[i].x, C.laneY)}, panelNode(ctx, pl));
      const y = C.laneY + (i ? (C.lanePL[0].h + C.F * 0.5) : 0);
      return g({name: `lanes${k}`, transform: T(0, y)},
        h('circle', {cx: r(C.badgeR * 0.8), cy: r(C.F * 0.6), r: r(C.badgeR * 0.8), fill: lanes[i], stroke: INK, 'stroke-width': 2}),
        h('text', {x: r(C.badgeR * 0.8), y: r(C.F * 0.6 + C.F * 0.32), 'text-anchor': 'middle', 'font-size': r(C.F * 0.9), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, k),
        g({transform: T(C.badgeR * 2 + C.F * 0.6, 0)}, panelNode(ctx, pl)));
    });
    return g({name: 'scene'},
      stageNodes,
      g({name: 'guide', opacity: 0}, guideParts, chipNode),
      laneNodes,
      C.strip ? g({name: 'strip', transform: T(0, C.stripY)}, C.strip.cols.map(col => g({transform: T(col.x, 0)}, panelNode(ctx, col.PL)))) : null,
    );
  },
  frame(ctx, L, u) {
    const {C, R} = L;
    const nodes = {};
    const kSlide = ease.inOutCubic(seg(u, ...W.slide));
    const kDesc = ease.inOutCubic(seg(u, ...W.descend));
    const kLay = ease.inOutCubic(seg(u, ...W.lay));
    const kGlass = seg(u, ...W.glass);
    const {E, t} = C;
    const startY = -(E.yBot + t) - C.F * 2; // above the stage's top edge (clipped)
    const fyy = lerp(startY, C.syL, kDesc);
    const lift = kDesc > 0 ? 1 - kLay : 0;
    const looks = {};
    C.stages.forEach((S, i) => {
      const k = i ? 'B' : 'A';
      const target = C.tipAt(R.lanes[i].section);
      // slide: first down beside the sheet (tip clear of it), then in to touch its section
      const midX = C.park.x;
      const kd = clamp(kSlide / 0.75), ki = clamp((kSlide - 0.7) / 0.3);
      const tip = {x: lerp(midX, target.x, ease.inOutCubic(ki)), y: lerp(C.park.y, target.y, ease.inOutCubic(kd))};
      nodes[`arrowg${k}`] = {transform: T(tip.x, tip.y)};
      Object.assign(nodes, frameProps(`fr${k}`, {x: C.sxL + E.x, y: fyy, yTop: E.yTop, yBot: E.yBot, t, w: E.w, glass: kGlass, lift}));
      nodes[`fr${k}`].opacity = kDesc > 0 ? 1 : 0;
      looks[k] = {tip: R2(tip), frameY: r(fyy), frameShown: kDesc > 0, glass: r(kGlass, 3), lift: r(lift, 3)};
    });
    const gk = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gk, 3)};
    const st = seg(u, ...W.states);
    for (const pl of C.lanePL) if (pl) for (const row of pl.rows) if (row.sub) nodes[`${row.name}-sub`] = {opacity: r(st, 3)};
    if (C.strip) for (const col of C.strip.cols) for (const row of col.PL.rows) if (row.name === 'sh-neutral') nodes[row.name] = {opacity: r(seg(u, ...W.notes), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const insideNow = C.stages.map((S, i) => {
      const k = i ? 'B' : 'A';
      const tip = looks[k].tip;
      return kDesc >= 1 && tip.y > fyy + E.yTop + t && tip.y < fyy + E.yBot;
    });
    return {
      nodes,
      semantic: {
        beat,
        lookA: looks.A, lookB: looks.B,
        tipA: {x: r(C.stages[0].x + looks.A.tip.x), y: r(C.stages[0].y + looks.A.tip.y)},
        tipB: {x: r(C.stages[1].x + looks.B.tip.x), y: r(C.stages[1].y + looks.B.tip.y)},
        frameA: {x: r(C.stages[0].x + C.sxL + E.x + E.w / 2), y: r(C.stages[0].y + fyy + (E.yTop + E.yBot) / 2)},
        sections: R.lanes.map(l => l.section), inside: R.lanes.map(l => l.inside), insideNow,
        from: R.from, to: R.to, guide: r(gk, 3), states: r(st, 3),
        stages: C.stages.map(S => ({x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)})), arrangement: C.arr,
        problems: C.problems, textPx: r(C.F, 1),
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
    slug: 'review-04-contrast',
    title: 'Review limits — two identical desks; only the section the question\'s arrow points at differs, then the same frame comes down on both',
    titleEs: 'Límites de revisión — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Límites de revisión',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete desk scenes of equal size (side by side on wide frames, stacked on tall ones) with the same placeholder decision, the same arrow tag and the same review frame. Only one fact differs: the arrow slides to a different supplied section in A and in B. The same frame then comes down from the top edge on both and is laid over the supplied sections with its neutral filter glass; in A the arrow\'s tip ends inside the frame, in B outside. A highlight guide joins the two arrows ("only this differs"); a neutral note says there is no winner and no outcome. Jurisdiction unspecified; no doctrine on review scope.',
    tags: ['review', 'review limits', 'contrast', 'paired scenes', 'frame', 'filter', 'arrow', 'scope as supplied', 'changed fact', 'neutral'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/limites-de-revision.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
