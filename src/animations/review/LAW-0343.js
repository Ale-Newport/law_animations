/**
 * LAW-0343 — Confirmación ilustrativa · contrast
 *
 * Storyboard (two complete, equally scaled desks — side by side on wide frames, one above the other on tall ones —
 * each with the same original decision card A, the same parked filter strip, the same calendar and the same two
 * hands; the right part of each desk is empty):
 *  0.00–0.17  base: both desks identical.
 *  0.17–0.40  the one changed fact: on desk B the right hand brings the supplied confirmatory card up from the desk's
 *             lower edge and sets it square beside card A (the arrow marks on their facing edges meet); on desk A
 *             nothing is supplied and the right hand stays at rest.
 *  0.40–0.77  in parallel on both desks the left hand lays the same strip across the configured row — over card A
 *             alone on desk A, over both aligned cards on desk B. Nothing printed on any card changes.
 *  0.77–1.00  a comparison guide rings the place that differs on both desks ("only this differs") and the neutral
 *             note says the two situations are shown side by side with no winner, score or outcome.
 * @module animations/review/LAW-0343
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {topArm, deskWindow} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  ciFields, CI_EN, CI_ES, localisedCi, cardModel, cardNode, arrowMark, filterStrip, calendarNode, panelLayout, panelNode,
  planDesk, arrowTip, cardPoint, cardTransform, laneColor, fitG, textAt, INK, R2,
} from './kits/confirmacion-ilustrativa.js';

const ID = 'LAW-0343';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {reach: [0.17, 0.22], slide: [0.22, 0.37], release: [0.38, 0.45], reachL: [0.42, 0.48], strip: [0.48, 0.62], lay: [0.62, 0.65], backL: [0.65, 0.74], guide: [0.77, 0.82], note: [0.8, 0.85]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {en: {}, es: {}};

const OWN_EN = {
  scenarioA: {label: 'Original decision', caption: 'Only the original decision card is on the desk'},
  scenarioB: {label: 'Confirmatory decision supplied', caption: 'The supplied card is set beside the original one'},
  changedFact: 'Only desk B receives the supplied confirmatory card (as supplied)',
  sharedFacts: ['Same original decision card and printed result', 'Same filter strip laid across the same row', 'Same desk, calendar and hands'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'Two supplied situations side by side: no winner, no score, no outcome'},
};
const OWN_ES = {
  scenarioA: {label: 'Decisión original', caption: 'Solo la tarjeta de la decisión original está en la mesa'},
  scenarioB: {label: 'Decisión confirmatoria suministrada', caption: 'La tarjeta suministrada se coloca junto a la original'},
  changedFact: 'Solo la mesa B recibe la tarjeta confirmatoria suministrada (según lo aportado)',
  sharedFacts: ['La misma tarjeta de la decisión original y su resultado impreso', 'La misma tira filtro sobre la misma fila', 'La misma mesa, calendario y manos'],
  comparisonLabels: {guide: 'Solo esto cambia', neutral: 'Dos situaciones aportadas lado a lado: sin ganador, sin puntuación, sin resultado'},
};
const EN = {...CI_EN, ...OWN_EN};
const ES = {...CI_ES, ...OWN_ES};

const sceneSchema = {
  ...ciFields,
  scenarioA: obj('Scenario A (desk without the supplied card)', {label: str('Short label for scenario A', 50), caption: str('One-line description of scenario A', 90)}, ['label', 'caption']),
  scenarioB: obj('Scenario B (desk with the supplied confirmatory card)', {label: str('Short label for scenario B', 50), caption: str('One-line description of scenario B', 90)}, ['label', 'caption']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical on both desks', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide ringing the place that differs', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}, ['guide', 'neutral']),
};

const defaultParams = {...EN};

/** One desk's content at text size F inside a desk box. */
function deskPlan(P, M, desk, F, tight, compact) {
  const inset = tight ? Math.max(12, F * 0.6) : Math.max(16, F * 0.8);
  const inner = {x: desk.x + inset, y: desk.y + inset, w: desk.w - 2 * inset, h: desk.h - 2 * inset};
  // compact (square frames): no parking row above the cards — the strip waits below the desk's lower edge and is
  // pushed up into place; no calendar
  const plan = planDesk(M, {F, mode: 'none', align: P.routes.align, tight, calK: 3.2, noStripRow: compact, cal: !compact, avail: inner});
  const ox = inner.x + (inner.w - plan.needW) / 2, oy = inner.y + Math.max(0, (inner.h - plan.needH) / 2);
  const off = q => ({...q, x: q.x + ox, y: q.y + oy});
  const A = off(plan.A), Bt = off(plan.Bt);
  const Bs = {...Bt, y: desk.y + desk.h + 14};
  const strip = {...plan.strip, x: plan.strip.x + ox, yRest: compact ? desk.y + desk.h + 14 : plan.strip.yRest + oy, yLaid: plan.strip.yLaid + oy};
  return {compact, inner, plan, A, Bt, Bs, strip, cal: plan.cal ? off(plan.cal) : null, fits: plan.needW <= inner.w + 0.5 && plan.needH <= inner.h + 0.5};
}

export function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'guide', text: P.changedFact, name: 'lg-changed'});
  if (showAll) P.sharedFacts.forEach((f, i) => rows.push({kind: 'item', icon: 'same', text: f, name: `lg-shared${i}`}));
  if (showAll) rows.push({kind: 'item', icon: 'filter', text: P.routes.label, name: 'lg-guide'});
  if (showKey) rows.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'neutral'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gap = F * 1.1;
  let PL = null, top = DH, stageW = DW, panel = null;
  if (rows.length && opts.pw) {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F, tight: opts.tight});
    stageW = DW - PW - gap;
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  } else if (rows.length) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols, tight: opts.tight});
    top = DH - PL.h - gap - F * 0.4;
    panel = {x: 4, y: DH - PL.h - F * 0.4};
  }
  // scenario headers: badge + label (bold) + caption
  const arr = opts.arr;
  const pairGap = Math.max(F * 1.6, 28);
  const sw = arr === 'row' ? (stageW - pairGap) / 2 : stageW;
  const badgeR = F * 1.0;
  const hdr = ['a', 'b'].map(s => {
    const sc = s === 'a' ? P.scenarioA : P.scenarioB;
    if (!showKey) return {label: null, caption: null, h: badgeR * 2};
    const tw = sw - badgeR * 2 - F * 0.7;
    const label = fitG(sc.label, {maxWidth: tw, size: F * 1.05, minSize: F, maxLines: 2, weight: 700});
    const caption = showAll ? fitG(sc.caption, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 500}) : null;
    return {label, caption, h: Math.max(badgeR * 2, label.height + (caption ? F * 0.25 + caption.height : 0)), ok: label.ok && (!caption || caption.ok)};
  });
  const hh = Math.max(hdr[0].h, hdr[1].h);
  const stageH = arr === 'row' ? top : (top - pairGap) / 2;
  const deskH = stageH - hh - F * 0.5;
  // the cards: the widest that fits a desk (both desks are the same size)
  const deskW = sw;
  const desks = arr === 'row'
    ? [{x: 0, y: hh + F * 0.5, w: deskW, h: deskH}, {x: deskW + pairGap, y: hh + F * 0.5, w: deskW, h: deskH}]
    : [{x: 0, y: hh + F * 0.5, w: deskW, h: deskH}, {x: 0, y: stageH + pairGap + hh + F * 0.5, w: deskW, h: deskH}];
  const heads = arr === 'row' ? [{x: 0, y: 0}, {x: deskW + pairGap, y: 0}] : [{x: 0, y: 0}, {x: 0, y: stageH + pairGap}];
  const innerW = deskW - 2 * (opts.tight ? Math.max(12, F * 0.6) : Math.max(16, F * 0.8));
  let best = null;
  const tryCw = (cw, bars) => {
    const M = cardModel(P, {w: cw, F, showText: showKey, bars, foot: F * (opts.compact ? 0.7 : 1.4), layout: opts.wide ? 'wide' : 'tall', secK: opts.compact ? Math.min(1, Math.max(0.8, opts.secFloor / F)) : 1});
    return {M, d: deskPlan(P, M, desks[0], F, opts.tight, opts.compact)};
  };
  const cap = Math.min(F * (showKey ? 22 : 18), innerW * 0.5);
  const q0 = tryCw(cap, 0);
  if (!opts.force && q0.d.plan.needH > deskH - 2 * Math.max(12, F * 0.6) + 0.5) return {F, problems: ['desk-height'], ok: false, dbg: {need: Math.round(q0.d.plan.needH), deskH: Math.round(deskH), ch: Math.round(q0.M.h), cw: Math.round(cap), PL: PL && Math.round(PL.h), hh: Math.round(hh)}};
  let lo = F * 7, hi = cap;
  if (tryCw(lo, 0).d.plan.needW > innerW) best = tryCw(lo, 0);
  else {
    for (let it = 0; it < 7; it++) {
      const mid = (lo + hi) / 2;
      if (tryCw(mid, 0).d.plan.needW <= innerW) lo = mid; else hi = mid;
    }
    for (const bars of [1, 0]) {
      best = tryCw(lo, bars);
      if (best.d.fits) break;
    }
  }
  const M = best.M;
  const D = desks.map(dk => deskPlan(P, M, dk, F, opts.tight, opts.compact));
  const problems = [!D[0].fits && 'desk', !M.ok && 'card-text', PL && !PL.ok && 'panel-text', hdr.some(x => x.ok === false) && 'header-text'].filter(Boolean);
  return {F, arr, PL, panel, hdr, hh, heads, desks, D, M, sw, badgeR, pairGap, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const arrangements = shape === 'landscape' ? [{arr: 'row', cols: 3}, {arr: 'row', cols: 2}, {arr: 'row', cols: 3, tight: true}, {arr: 'row', cols: 3, tight: true, compact: true}]
      : shape === 'portrait' ? [{arr: 'column', cols: 1}, {arr: 'column', cols: 2}, {arr: 'column', cols: 2, tight: true}]
        : [{arr: 'column', pw: 0.3, tight: true, compact: true}, {arr: 'column', pw: 0.26, tight: true, compact: true}, {arr: 'column', pw: 0.23, tight: true, compact: true}, {arr: 'column', cols: 3, tight: true, compact: true, wide: true}, {arr: 'column', pw: 0.3, tight: true, compact: true, wide: true}];
    const sizes = (!showKey ? [40, 36, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    // (two passes: the full desks — strip parked above the cards, calendar — first; the compact desks only when no full
    // one fits)
    const passes = [arrangements.filter(a => !a.compact), arrangements.filter(a => a.compact)].filter(x => x.length);
    outer: for (const pass of passes) for (const F of sizes) {
      for (const a of pass) {
        const c = compose(ctx, P, F, {...a, secFloor: 16.5 / pxu});
        if (c.ok) { C = c; break outer; }
        if (c.M && (!C || c.problems.length < C.problems.length)) C = c;
      }
    }
    // (never without a scene: the smallest size, first arrangement, laid out even if it does not fit — flagged)
    if (!C) C = compose(ctx, P, sizes[sizes.length - 1], {...arrangements[0], secFloor: 16.5 / pxu, force: true});
    const look = actorLook(ctx, {appearance: {}}, 0);
    // arms per desk (the same rig geometry on both desks)
    const rigs = C.D.map((d, i) => {
      const dk = C.desks[i];
      const M = C.M;
      const grip = {x: M.w * 0.8, y: M.footY + M.foot * 0.5};
      const gT = cardPoint(d.Bt, M, grip);
      const deskB = dk.y + dk.h;
      const sOff = Math.max(100, C.F * 4.5);
      const shoulderR = {x: Math.min(dk.x + dk.w + sOff * 0.2, gT.x + C.F * 3), y: deskB + sOff};
      const restR = {x: Math.min(dk.x + dk.w - C.F * 1.6, gT.x + C.F * 2.6), y: deskB - C.F * 0.7};
      const gS0 = y => ({x: d.strip.x + d.strip.tab / 2, y: y + d.strip.h / 2});
      const shoulderL = d.compact ? {x: d.strip.x + d.strip.tab / 2 - C.F * 2, y: deskB + sOff} : {x: dk.x - sOff, y: (d.strip.yLaid + d.strip.h / 2) * 0.5 + deskB * 0.5};
      const restL = d.compact ? {x: shoulderL.x + C.F * 1.2, y: deskB - C.F * 0.7} : {x: dk.x + C.F * 1.1, y: shoulderL.y + C.F * 0.6};
      const gS = cardPoint(d.Bs, M, grip);
      const far = Math.max(Math.hypot(gT.x - shoulderR.x, gT.y - shoulderR.y), Math.hypot(gS.x - shoulderR.x, gS.y - shoulderR.y),
        Math.hypot(gS0(d.strip.yRest).x - shoulderL.x, gS0(d.strip.yRest).y - shoulderL.y), Math.hypot(gS0(d.strip.yLaid).x - shoulderL.x, gS0(d.strip.yLaid).y - shoulderL.y));
      const armLen = far * 0.5 + 26;
      const armW = clamp(C.F * 2.0, 34, 50);
      const arm = name => topArm(ctx, {name, skin: look.skin, sleeve: look.outfit, handed: name.endsWith('L') ? 'left' : 'right', upper: armLen, lower: armLen, width: armW, handScale: 1.3});
      const s = i ? 'b' : 'a';
      return {grip, shoulderR, restR, shoulderL, restL, gS0, armL: arm(`${s}-armL`), armR: arm(`${s}-armR`)};
    });
    // the comparison guide: the right part of each desk (where B's card is or is not)
    const rings = C.D.map(d => {
      const pad = Math.max(10, C.F * 0.5);
      return {x: d.Bt.x - pad, y: d.Bt.y - pad, w: C.M.w + pad * 2, h: C.M.h + pad * 2};
    });
    let guideChip = null;
    if (showKey) {
      const f = fitG(P.comparisonLabels.guide, {maxWidth: Math.min(C.M.w, C.F * 14), size: C.F, minSize: C.F, maxLines: 2, weight: 700});
      guideChip = {fit: f, w: f.width + C.F * 1.2, h: f.height + C.F * 0.7};
    }
    return {P, C, rigs, rings, guideChip, look, pxu};
  },
  build(ctx, L) {
    const {C, P} = L;
    const {M} = C;
    const th = ctx.theme;
    const parts = [];
    ['a', 'b'].forEach((s, i) => {
      const hd = C.hdr[i], at = C.heads[i];
      const lane = laneColor(th, s);
      const cy = at.y + C.hh / 2;
      const kids = [h('circle', {cx: r(at.x + C.badgeR), cy: r(cy), r: r(C.badgeR), fill: lane, stroke: INK, 'stroke-width': 2.4})];
      if (hd.label) {
        kids.push(h('text', {x: r(at.x + C.badgeR), y: r(cy + C.F * 0.36), 'text-anchor': 'middle', 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(C.F, 2), 'font-weight': 800, fill: '#fff'}, s.toUpperCase()));
        const tx = at.x + C.badgeR * 2 + C.F * 0.6;
        const blockH = hd.label.height + (hd.caption ? C.F * 0.25 + hd.caption.height : 0);
        const ty = cy - blockH / 2;
        kids.push(textAt(hd.label, {x: tx, y: ty, fill: th.fg}));
        if (hd.caption) kids.push(textAt(hd.caption, {x: tx, y: ty + hd.label.height + C.F * 0.25, fill: th.fgSoft}));
      }
      parts.push(g({name: `head-${s}`}, kids));
      const dk = C.desks[i], d = C.D[i], rig = L.rigs[i];
      const desk = deskWindow(ctx, {prefix: `desk${s}`, x: dk.x, y: dk.y, w: dk.w, h: dk.h, radius: 24, seedKey: 'ci-contrast-desk'});
      const card = (side, pose, name) => g({name, transform: cardTransform(pose, M)},
        cardNode(ctx, M, side, {prefix: `${name}-art`, seedKey: `ci-card-${side}`}),
        g({transform: T(side === 'a' ? M.w + d.plan.arrow.len : -d.plan.arrow.len, d.plan.arrow.y)}, arrowMark(ctx, {side, len: d.plan.arrow.len, hgt: d.plan.arrow.hgt, dir: side === 'a' ? 1 : -1})));
      parts.push(desk.surface, g({'clip-path': desk.clip},
        d.cal ? g({transform: T(d.cal.x, d.cal.y)}, calendarNode(ctx, {prefix: `${s}-calendar`, w: d.cal.w, h: d.cal.h})) : null,
        card('a', d.A, `${s}-carda`),
        s === 'b' ? card('b', d.Bs, 'b-cardb') : null,
        g({name: `${s}-strip`, transform: T(d.strip.x, d.strip.yRest)}, filterStrip(ctx, {prefix: `${s}-strip-art`, w: d.strip.w, h: d.strip.h, tab: d.strip.tab})),
        rig.armL.arm, rig.armR.arm, rig.armL.palm, rig.armR.palm, rig.armL.thumb, rig.armR.thumb), desk.frame);
    });
    // comparison guide: the same ring on both desks, joined; label chip between them
    const gc = th.accent3;
    const R0 = L.rings[0], R1 = L.rings[1];
    const guideKids = [
      h('path', {d: roundRectPath(R0.x, R0.y, R0.w, R0.h, 12), fill: 'none', stroke: gc, 'stroke-width': 5}),
      h('path', {d: roundRectPath(R1.x, R1.y, R1.w, R1.h, 12), fill: 'none', stroke: gc, 'stroke-width': 5}),
    ];
    const join = C.arr === 'row'
      ? {a: {x: R0.x + R0.w / 2, y: R0.y}, b: {x: R1.x + R1.w / 2, y: R1.y}, y: Math.min(R0.y, R1.y) - C.F * 0.9}
      : {a: {x: R0.x + R0.w, y: R0.y + R0.h / 2}, b: {x: R1.x + R1.w, y: R1.y + R1.h / 2}, x: Math.max(R0.x + R0.w, R1.x + R1.w) + C.F * 0.9};
    if (C.arr === 'row') guideKids.push(h('path', {d: `M${r(join.a.x)} ${r(join.a.y)}V${r(join.y)}H${r(join.b.x)}V${r(join.b.y)}`, fill: 'none', stroke: gc, 'stroke-width': 4, 'stroke-linejoin': 'round'}));
    if (L.guideChip) {
      const gch = L.guideChip;
      // the chip sits inside desk B's ring, in its upper part (over the card's header band, never over the result row)
      const cx = R1.x + R1.w / 2;
      // (on the lower edge of desk B's ring: over the card's footer filler, never over its result row)
      const dkB = C.desks[1];
      const x = cx - gch.w / 2, y = Math.min(R1.y + R1.h - gch.h / 2, dkB.y + dkB.h - gch.h - 4);
      guideKids.push(g({name: 'guide-chip'},
        h('path', {d: roundRectPath(x, y, gch.w, gch.h, Math.min(gch.h / 2, C.F * 0.6)), fill: th.card, stroke: gc, 'stroke-width': 3}),
        textAt(gch.fit, {x: cx, y: y + C.F * 0.35, anchor: 'middle', fill: INK})));
    }
    parts.push(g({name: 'guide', opacity: 0}, guideKids));
    return g({name: 'scene'}, parts, C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL, {skin: L.look.skin})) : null);
  },
  frame(ctx, L, u) {
    const {C, rigs} = L;
    const {M} = C;
    const nodes = {};
    const e = ease.inOutCubic;
    const kReach = e(seg(u, ...W.reach)), kSlide = e(seg(u, ...W.slide)), kRel = e(seg(u, ...W.release));
    const kReachL = e(seg(u, ...W.reachL)), kStrip = e(seg(u, ...W.strip)), kBackL = e(seg(u, ...W.backL));
    const liftS = Math.sin(Math.PI * seg(u, ...W.strip)) * (1 - seg(u, ...W.lay));
    const mix = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
    const look = {};
    const sem = {};
    ['a', 'b'].forEach((s, i) => {
      const d = C.D[i], rig = rigs[i], dk = C.desks[i];
      nodes[`${s}-carda`] = {transform: cardTransform(d.A, M)};
      let B = null, gripB = null;
      if (s === 'b') {
        B = {x: d.Bt.x, y: lerp(d.Bs.y, d.Bt.y, kSlide), deg: 0};
        nodes['b-cardb'] = {transform: cardTransform(B, M)};
        gripB = cardPoint(B, M, rig.grip);
      }
      const sy = lerp(d.strip.yRest, d.strip.yLaid, kStrip);
      const ss = 1 + 0.02 * liftS;
      const scx = d.strip.x + d.strip.w / 2, scy = sy + d.strip.h / 2;
      nodes[`${s}-strip`] = {transform: `${T(scx, scy, 0, ss)} translate(${r(-d.strip.w / 2)} ${r(-d.strip.h / 2)})`};
      const g0 = rig.gS0(sy);
      const gripS = {x: scx + (g0.x - scx) * ss, y: scy + (g0.y - scy) * ss};
      const hR = s === 'b' ? (kRel > 0 ? mix(gripB, rig.restR, kRel) : mix(rig.restR, gripB, kReach)) : rig.restR;
      const hL = kBackL > 0 ? mix(gripS, rig.restL, kBackL) : mix(rig.restL, gripS, kReachL);
      const pr = rig.armR.pose(rig.shoulderR, hR, -1);
      const pl = rig.armL.pose(rig.shoulderL, hL, 1);
      Object.assign(nodes, pr.nodes, pl.nodes);
      // what is visible on the desk (desk-local), for the identical-before-change check
      const loc = q => ({x: r(q.x - dk.x, 1), y: r(q.y - dk.y, 1)});
      const bVisible = !!B && B.y < dk.y + dk.h - 1;
      look[s] = {cardA: loc(d.A), cardB: bVisible ? loc(B) : null, strip: loc({x: d.strip.x, y: sy}), handR: loc(pr.hand), handL: loc(pl.hand)};
      const tipA = arrowTip(d.A, M, d.plan, 'a');
      const tipB = B ? arrowTip(B, M, d.plan, 'b') : null;
      sem[s] = {handR: R2(pr.hand), handL: R2(pl.hand), gripB: R2(gripB), gripS: R2(gripS), cardB: B ? R2({x: B.x + M.w / 2, y: B.y + M.h / 2}) : null,
        stripC: R2({x: scx, y: scy}), tipGap: tipB ? r(Math.hypot(tipA.x - tipB.x, tipA.y - tipB.y), 2) : null, bVisible,
        stripOnRow: r(Math.abs(scy - (d.A.y + d.plan.reg.y)), 2), reached: pr.reached && pl.reached};
    });
    const guideK = seg(u, ...W.guide), noteK = seg(u, ...W.note);
    nodes.guide = {opacity: r(guideK, 3)};
    if (C.PL) for (const row of C.PL.rows) if (row.name === 'neutral') nodes[row.name] = {opacity: r(noteK, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat, lookA: look.a, lookB: look.b,
        handRA: sem.a.handR, handLA: sem.a.handL, handRB: sem.b.handR, handLB: sem.b.handL, gripB: sem.b.gripB, gripSA: sem.a.gripS, gripSB: sem.b.gripS,
        cardB: sem.b.cardB, stripA: sem.a.stripC, stripB: sem.b.stripC, tipGapB: sem.b.tipGap, bVisible: sem.b.bVisible,
        stripOnRowA: sem.a.stripOnRow, stripOnRowB: sem.b.stripOnRow, slide: r(kSlide, 3), strip: r(kStrip, 3),
        heldB: kReach >= 1 && kRel <= 0, heldS: kReachL >= 1 && kBackL <= 0,
        allReached: sem.a.reached && sem.b.reached, guide: r(guideK, 3), note: r(noteK, 3), arr: C.arr,
        results: [L.P.outcomes.a, L.P.outcomes.b], desks: C.desks.map(dk => ({x: r(dk.x), y: r(dk.y), w: r(dk.w), h: r(dk.h)})),
        problems: C.problems, textPx: r(C.F * L.pxu, 1),
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
    slug: 'review-06-contrast',
    title: 'Illustrative confirmation — two identical desks; only desk B receives the supplied confirmatory card, then the same strip is laid on both',
    titleEs: 'Confirmación ilustrativa — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Confirmación ilustrativa',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete desks of the same size (side by side on wide frames, stacked on tall ones), each with the same original decision card, filter strip, calendar and hands. The one changed fact: on desk B a hand brings the supplied confirmatory card up from the desk\'s edge and sets it square beside the original (the arrow marks meet); desk A receives nothing. Then, in parallel, the same strip is laid across the configured row on both desks. A guide rings the place that differs and a neutral note shows the two situations without winner, score or outcome. The printed results never change. Illustrative; jurisdiction unspecified.',
    tags: ['review', 'confirmation', 'contrast', 'paired desks', 'one changed fact', 'decision cards', 'alignment', 'filter strip', 'no winner'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/desk.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
