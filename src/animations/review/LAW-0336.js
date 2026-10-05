/**
 * LAW-0336 — Límites de revisión · inspect
 *
 * Storyboard (the desk after the action: the placeholder decision with the review frame laid over the supplied
 * sections, its filter glass in place; both arrow tags (● A / ◆ B) at their sections; a desk calendar as a fixture; a
 * small edge tag hangs from the end of the frame's focus rail and states where that edge stands — the supplied datum):
 *  0.00–0.20  context: the state produced by the action, held still; the legend lists both questions with where their
 *             sections lie (as supplied).
 *  0.20–0.45  a lens opens from the focus rail's end — a real enlarged copy (same coordinates) of the rail, the rows
 *             it separates (filler only: no supplied text is cut) and the edge tag; while the lens holds the tag, the
 *             context tag is a blank card (the datum is legible in ONE place only).
 *  0.45–0.75  substitution of one datum: the tag's old value lifts away and the new value settles (the cause);
 *             then the rail, carrying the tag, slides to the supplied alternative section (a ghost outline keeps the
 *             old position traceable) and stays still. Only that rail and its tag change.
 *  0.75–1.00  the lens closes back to the context: the frame now ends at the new section, the ghost outline and the
 *             neutral changed-datum marker (Δ) stay on the rail, the legend updates where each section lies (as
 *             supplied). Seeking back restores the old datum exactly. No validity, scope rule or outcome is inferred.
 * @module animations/review/LAW-0336
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, int, obj, oneOf} from '../../schemas/fields.js';
import {roundRectPath} from '../../core/geometry.js';
import {deskWindow} from '../../primitives/desk.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens as makeLens} from '../../frameworks/lens.js';
import {
  lrFields, LR_EN, LR_ES, localisedLr, sheetModel, sheetNode, rowParts, frameExtent, frameNode, frameProps,
  arrowNode, calendarNode, placeCalendar, panelLayout, panelNode, legendIcon, fitG, textAt, INK, RAIL, R2,
} from './kits/limites-de-revision.js';

const ID = 'LAW-0336';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], back: [0.75, 1]};
const W = {open: [0.2, 0.38], oldOut: [0.46, 0.5], newIn: [0.5, 0.55], move: [0.55, 0.67], close: [0.76, 0.86], marker: [0.84, 0.89], panelBack: [0.84, 0.9]};
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  focusTarget: 'lower-edge',
  beforeValue: 'Frame ends after Section 3 (as supplied)',
  afterValue: 'Frame ends after Section 4 (as supplied)',
  afterIndex: 3,
  detailGeometry: {zoom: 2, placement: 'auto'},
  contextLabels: {context: 'The desk after the frame was laid (as supplied)', marker: 'Changed datum: where the frame\'s edge stands'},
};
const OWN_ES = {
  focusTarget: 'lower-edge',
  beforeValue: 'El marco termina tras el Apartado 3 (según lo aportado)',
  afterValue: 'El marco termina tras el Apartado 4 (según lo aportado)',
  afterIndex: 3,
  detailGeometry: {zoom: 2, placement: 'auto'},
  contextLabels: {context: 'La mesa tras colocar el marco (según lo aportado)', marker: 'Dato cambiado: dónde está el borde del marco'},
};
const EN = {...LR_EN, ...OWN_EN};
const ES = {...LR_ES, ...OWN_ES};

const sceneSchema = {
  ...lrFields,
  focusTarget: oneOf('Detail enlarged and substituted: the frame\'s lower edge (its last section) or upper edge (its first section)', ['lower-edge', 'upper-edge']),
  beforeValue: str('Text of the edge tag before the substitution (the supplied datum)', 90),
  afterValue: str('Text of the edge tag after the substitution (the alternative supplied datum)', 90),
  afterIndex: int('Section index at which the focus edge stands after the substitution (lower edge: the new last section; upper edge: the new first section)', 0, 5),
  detailGeometry: obj('Lens geometry', {zoom: num('Preferred magnification of the lens (at least 1.5 is always kept)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'bottom'])}, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 60)}, ['context', 'marker']),
};

const defaultParams = {...EN};

function resolve(P) {
  const n = P.decisions.sections.length;
  const cl = i => Math.max(0, Math.min(n - 1, i | 0));
  const a = cl(P.routes.from), b = cl(P.routes.to);
  const from = Math.min(a, b), to = Math.max(a, b);
  const lower = P.focusTarget !== 'upper-edge';
  // the new edge index stays on its side of the other edge
  let after = cl(P.afterIndex);
  if (lower) after = Math.max(from, after); else after = Math.min(to, after);
  const range = (f, t2) => ({from: f, to: t2});
  const before = range(from, to);
  const afterR = lower ? range(from, after) : range(after, to);
  const qs = ['a', 'b'].map((side, i) => {
    const q = P.grounds.find(x => x.side === side) || P.grounds[i];
    const section = cl(q.section);
    return {side, text: q.text, section, inBefore: section >= before.from && section <= before.to, inAfter: section >= afterR.from && section <= afterR.to};
  });
  return {n, lower, before, after: afterR, qs, changed: lower ? after !== to : after !== from};
}

function compose(ctx, P, R, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const problems = [];
  const rows = [];
  if (showAll) rows.push({kind: 'heading', icon: 'sheet', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) rows.push({kind: 'item', icon: 'frame', text: P.labels.frame, name: 'lg-frame'});
  // each question: its state before (shown from the start) and after (swapped while the lens covers the legend)
  const longer = P.outcomes.inside.length >= P.outcomes.outside.length ? P.outcomes.inside : P.outcomes.outside;
  if (showKey) R.qs.forEach(q => rows.push({kind: 'item', icon: q.side, text: q.text, sub: longer, subIcon: 'inside', name: `lg-q${q.side}`}));
  if (showKey) rows.push({kind: 'item', icon: 'ring', color: ctx.theme.accent2, text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gap = F * 1.4;
  let desk, panelBox, PL = null;
  const portrait = shape === 'portrait';
  const pw = portrait ? DW : DW * v.pw;
  if (rows.length) {
    PL = panelLayout(ctx, rows, {w: pw - (portrait ? 0 : 0), F});
    if (!PL.ok) problems.push('panel-text');
  }
  // the after-state of each question's line: drawn at the same place, swapped while the lens covers the legend
  const after = {};
  if (PL) for (const rw of PL.rows) {
    const q = R.qs.find(x => `lg-q${x.side}` === rw.name);
    if (!q || !rw.sub) continue;
    const fa = fitG(q.inAfter ? P.outcomes.inside : P.outcomes.outside, {maxWidth: rw.tw - F * 1.3, size: F, maxLines: 3, weight: 600});
    const fb = fitG(q.inBefore ? P.outcomes.inside : P.outcomes.outside, {maxWidth: rw.tw - F * 1.3, size: F, maxLines: 3, weight: 600});
    if (!fa.ok || !fb.ok || fa.lines.length > rw.sub.lines.length || fb.lines.length > rw.sub.lines.length) problems.push('after-text');
    after[rw.name] = {A: {fit: fa, icon: q.inAfter ? 'inside' : 'outside'}, B: {fit: fb, icon: q.inBefore ? 'inside' : 'outside'}};
  }
  const panelH = PL ? PL.h : 0;
  // lens area: over the legend (the legend fades out while the lens is open)
  const minLensH = Math.min(ctx.view.width, ctx.view.height) / Math.min(ctx.view.content.w / DW, ctx.view.content.h / DH) * 0.45;
  if (portrait) {
    const areaH = Math.max(panelH, minLensH);
    desk = {x: 0, y: 0, w: DW, h: DH - areaH - gap};
    panelBox = {x: 0, y: DH - areaH, w: DW, h: areaH};
  } else {
    desk = {x: 0, y: 0, w: DW - pw - gap, h: DH};
    panelBox = {x: DW - pw, y: 0, w: pw, h: DH};
    if (panelH > DH) problems.push('panel-tall');
  }
  const inset = shape === 'square' ? Math.max(12, F * 0.6) : Math.max(20, F * 1.0);
  const inner = {x: desk.x + inset, y: desk.y + inset, w: desk.w - inset * 2, h: desk.h - inset * 2};
  const sq = shape === 'square';
  const AW = sq ? clamp(F * 3.6, 64, 100) : clamp(F * 5.4, 96, 150);
  const gapA = F * 0.4;
  const t = Math.max(12, F * 0.62);
  const m = Math.max(16, F * 0.9);
  const TW = (sq ? clamp(F * 9, 150, 230) : clamp(F * 12, 200, 320)) * (v.tw ?? 1);
  const rightRoom = m + TW + 10;
  const SW = Math.min(shape === 'landscape' ? 560 : 600, inner.w - AW - gapA - rightRoom);
  if (SW < 220) problems.push('sheet-narrow');
  const M = sheetModel(ctx, {w: Math.max(220, SW), F, title: P.decisions.title, sections: P.decisions.sections, showText: showKey, bars: v.bars, rowLines: sq ? 3 : 2, titleLines: sq ? 3 : 2});
  if (!M.ok) problems.push('sheet-text');
  if (M.h > inner.h) problems.push('sheet-tall');
  const blockW = AW + gapA + M.w + rightRoom;
  const sx = inner.x + Math.max(0, (inner.w - blockW) / 2) + AW + gapA;
  const sy = inner.y + Math.max(0, (inner.h - M.h) / 2);
  const Eb = frameExtent(M, R.before.from, R.before.to, {t, margin: m});
  const Ea = frameExtent(M, R.after.from, R.after.to, {t, margin: m});
  // focus rail (sheet-local y of the rail's top) before / after
  const railB = R.lower ? Eb.yBot : Eb.yTop;
  const railA = R.lower ? Ea.yBot : Ea.yTop;
  // edge tag (hangs right of the frame from the focus rail's end)
  const tagFitB = showKey ? fitG(P.beforeValue, {maxWidth: TW - F * 1.2, size: F, maxLines: 6, weight: 600}) : null;
  const tagFitA = showKey ? fitG(P.afterValue, {maxWidth: TW - F * 1.2, size: F, maxLines: 6, weight: 600}) : null;
  if ((tagFitB && !tagFitB.ok) || (tagFitA && !tagFitA.ok)) problems.push('tag-text');
  const tagH = Math.max(tagFitB ? tagFitB.height : F * 1.5, tagFitA ? tagFitA.height : F * 1.5) + F * 1.0;
  const tagDX = Eb.x + Eb.w + 8; // sheet-local x of the tag's left edge
  const tagDY = t * 0.5 + F * 0.9; // below the rail's centre (cord length)
  const sheetBot = sy + M.h;
  // the tag hangs below the rail, or stands above it when the desk has no room below
  const tagUp = sy + Math.max(railB, railA) + tagDY + tagH > desk.y + desk.h - 6;
  const tagBottomMax = tagUp ? sy + Math.max(railB, railA) : sy + Math.max(railB, railA) + tagDY + tagH;
  const tagTopMin = tagUp ? sy + Math.min(railB, railA) - tagDY - tagH : sy + Math.min(railB, railA);
  if (tagUp && tagTopMin < desk.y + 6) problems.push('tag-low');
  if (sx + tagDX + TW > desk.x + desk.w - 6) problems.push('tag-right');
  // lens source (design coords): the rail's right part, the rows it separates (filler only), the tag
  const y0 = Math.min(sy + Math.min(railB, railA) - M.rowH * 0.5, tagTopMin - 8);
  const y1 = Math.max(sy + Math.max(railB, railA) + t + M.rowH * 0.5, tagBottomMax + 8);
  const x1 = sx + tagDX + TW + 8;
  // lens destination: inside the legend area, uniformly scaled, magnification >= 1.5
  const area = {x: panelBox.x + 4, y: panelBox.y + 4, w: panelBox.w - 8, h: panelBox.h - 8};
  // (the preferred zoom, raised when needed so the lens is a real inspection: >= ~0.36 of the short side; at most 4)
  const fitS = Math.min(ctx.view.content.w / DW, ctx.view.content.h / DH);
  const shortD = Math.min(ctx.view.width, ctx.view.height) / fitS; // the frame's short side in design units
  const want = s2 => Math.min(4, Math.max(1.5, P.detailGeometry.zoom, (shortD * 0.37) / Math.min(s2.w, s2.h)));
  // crop from wide (part of the sheet) to narrow (rail end and tag) until the lens is large enough
  let src = null, k = 0;
  for (const fx of [0.55, 0.68, 0.8, 0.9]) {
    const x0 = Math.max(sx + M.w * fx, Math.min(sx + M.w * 0.9, x1 - area.w / 1.5));
    const s2 = {x: fx === 0.55 ? sx + M.w * 0.55 : x0, y: y0, w: 0, h: y1 - y0};
    s2.w = x1 - s2.x;
    const k2 = Math.min(area.w / s2.w, area.h / s2.h, want(s2));
    if (!src || (k2 >= 1.5 && Math.min(s2.w, s2.h) * k2 > Math.min(src.w, src.h) * k + 0.5 && (k < 1.5 || Math.min(src.w, src.h) * k < shortD * 0.35))) { src = s2; k = k2; }
    if (k >= 1.5 && Math.min(src.w, src.h) * k >= shortD * 0.35) break;
  }
  // still short: grow the crop vertically towards the lens area's proportions (more rows of filler around the rail)
  if (Math.min(src.w, src.h) * k < shortD * 0.35 && src.h < src.w * area.h / area.w) {
    const nh = Math.min(src.w * area.h / area.w, M.h + 40);
    const cy = src.y + src.h / 2;
    src = {...src, y: clamp(cy - nh / 2, sy - 20, sy + M.h + 20 - nh), h: nh};
    k = Math.min(area.w / src.w, area.h / src.h, want(src));
  }
  if (k < 1.5 - 1e-6) problems.push('lens-zoom');
  const dest = {w: src.w * k, h: src.h * k};
  dest.x = area.x + (area.w - dest.w) / 2;
  dest.y = clamp(src.y + src.h / 2 - dest.h / 2, area.y, area.y + area.h - dest.h);
  if (Math.min(dest.w, dest.h) < shortD * 0.35) problems.push('lens-small');
  // arrows and calendar as in the desk scene
  const aH = Math.min(M.rowH * 0.62, F * 2.2);
  const arrows = R.qs.map((q, i) => {
    const same = R.qs[0].section === R.qs[1].section;
    const dy = same ? (i === 0 ? -1 : 1) * Math.min(M.rowH * 0.24, aH * 0.55) : 0;
    return {side: q.side, tip: {x: sx + F * 0.62, y: sy + M.rows[q.section].cy + dy}, len: AW + F * 0.62 - 4, hgt: same ? aH * 0.82 : aH};
  });
  const cal = {w: Math.min(AW - 14, F * 4.6), h: Math.min(AW - 14, F * 4.6) * 0.82};
  cal.x = sx - gapA - AW + (AW - cal.w) / 2 - 4;
  placeCalendar(cal, arrows, {top: sy, bottom: sy + M.h, head: M.head});
  if (!cal.ok) problems.push('calendar-arrow');
  if (PL && PL.h > panelBox.h + 0.5) problems.push('panel-tall');
  return {F, desk, inner, panelBox, PL, after, tagUp, M, sx, sy, Eb, Ea, t, m, AW, TW, tagFitB, tagFitA, tagH, tagDX, tagDY, railB, railA, src, dest, k, arrows, cal, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedLr(ctx, EN, ES);
    const R = resolve(P);
    const pws = ctx.view.shape === 'square' ? [0.38, 0.42, 0.46] : [0.36, 0.4];
    let C = null, best = null;
    outer: for (const F of SIZES) for (const pw of ctx.view.shape === 'portrait' ? [1] : pws) for (const bars of [2, 1, 0]) for (const tw of ctx.view.shape === 'portrait' ? [1, 1.3] : ctx.view.shape === 'square' ? [0.8, 1, 1.25, 1.5] : [1, 1.25]) {
      const c = compose(ctx, P, R, F, {pw, bars, tw});
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.problems.length) best = c;
    }
    C = C || best;
    // (lens geometry only — its frame() needs no content; the mounted lens is built with its content in build())
    const lensGeom = makeLens(ctx, {name: 'lens', source: C.src, dest: C.dest, content: null, color: ctx.theme.accent2});
    return {P, R, C, lensGeom};
  },
  build(ctx, L) {
    const {C, R, P} = L;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const sheet = sheetNode(ctx, C.M, {prefix: 'sheet', showText: showKey});
    const E = C.Eb;
    const frame = (prefix, knobs) => frameNode(ctx, {prefix, w: E.w, t: C.t, yTop: E.yTop, yBot: E.yBot, knobs});
    const by = C.tagUp ? -(C.tagDY + C.tagH) : C.tagDY;
    const hole = C.tagUp ? by + C.tagH - C.F * 0.35 : by + C.F * 0.35;
    const ty = C.tagUp ? by + C.F * 0.4 : by + C.F * 0.6;
    const tag = (prefix, fitB, fitA) => g({name: prefix},
      h('line', {name: `${prefix}-cord`, x1: 0, y1: 0, x2: 0, y2: r(C.tagUp ? -C.tagDY : C.tagDY), stroke: INK, 'stroke-width': 2.5}),
      h('circle', {cx: 0, cy: 0, r: 5, fill: RAIL, stroke: INK, 'stroke-width': 2}),
      h('path', {d: roundRectPath(-C.F * 0.6, by, C.TW, C.tagH, 10), fill: '#fff', stroke: INK, 'stroke-width': 2.5}),
      h('circle', {cx: 0, cy: r(hole), r: 4, fill: 'none', stroke: INK, 'stroke-width': 2}),
      fitB ? g({name: `${prefix}-b`}, textAt(fitB, {x: 0, y: ty, fill: INK})) : h('rect', {name: `${prefix}-b`, x: 0, y: r(ty + C.F * 0.1), width: r(C.TW * 0.62), height: r(C.F * 0.5), rx: 4, fill: th.paperLine}),
      fitA ? g({name: `${prefix}-a`, opacity: 0}, textAt(fitA, {x: 0, y: ty, fill: INK})) : h('rect', {name: `${prefix}-a`, opacity: 0, x: 0, y: r(ty + C.F * 0.1), width: r(C.TW * 0.45), height: r(C.F * 0.5), rx: 4, fill: th.paperLine}),
    );
    const ghost = prefix => h('rect', {name: prefix, x: 0, y: 0, width: r(E.w), height: r(C.t), rx: r(C.t * 0.35), fill: 'none', stroke: RAIL, 'stroke-width': 2.5, 'stroke-dasharray': '7 6', opacity: 0});
    // lens copy: same coordinates as the context (rows as filler only; rail; ghost; tag)
    const lo = 0, hi = C.M.rows.length - 1;
    const copyRows = [];
    for (let i = lo; i <= hi; i++) copyRows.push(rowParts(ctx, C.M, i, {prefix: 'lc', rowText: () => false}));
    const lensContent = g(null,
      h('rect', {x: r(C.src.x - 400), y: r(C.src.y - 400), width: r(C.src.w + 800), height: r(C.src.h + 800), fill: th.woodTop}),
      g({transform: T(C.sx, C.sy)}, h('path', {d: roundRectPath(0, 0, C.M.w, C.M.h, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.5}), copyRows),
      frame('lf', false),
      g({name: 'lg-ghostw', transform: T(C.sx + E.x, C.sy + C.railB)}, ghost('lghost')),
      g({name: 'ltagw'}, tag('ltag', C.tagFitB, C.tagFitA)),
    );
    const L2 = makeLens(ctx, {name: 'lens', source: C.src, dest: C.dest, content: lensContent, color: th.accent2});
    return g({name: 'scene'},
      desk.surface,
      g({'clip-path': desk.clip},
        g({transform: T(C.cal.x, C.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: C.cal.w, h: C.cal.h})),
        g({transform: T(C.sx, C.sy)}, sheet),
        C.arrows.map((a, i) => g({transform: T(a.tip.x, a.tip.y)}, arrowNode(ctx, {prefix: `arrow${R.qs[i].side}`, side: a.side, len: a.len, hgt: a.hgt}))),
        frame('frame', false),
        g({name: 'ghostw', transform: T(C.sx + E.x, C.sy + C.railB)}, ghost('ghost')),
        g({name: 'ctagw'}, tag('ctag', C.tagFitB, C.tagFitA)),
        g({name: 'markerw', opacity: 0}, changedMarker(ctx, {radius: Math.max(16, C.F * 0.85)})),
      ),
      desk.frame,
      C.PL ? g({name: 'panel', transform: T(C.panelBox.x, C.panelBox.y + (ctx.view.shape === 'portrait' ? 0 : Math.max(0, (C.panelBox.h - C.PL.h) / 2)))},
        panelNode(ctx, C.PL),
        C.PL.rows.filter(rw => C.after[rw.name]).flatMap(rw => {
          const sy = rw.y + rw.fit.height + C.F * 0.3;
          return [['B', 'sub1'], ['A', 'sub2']].map(([k, nm]) => {
            const A = C.after[rw.name][k];
            return g({name: `${rw.name}-${nm}`, opacity: 0},
              g({transform: T(rw.iconW + C.F * 0.55, sy + Math.min(A.fit.height, C.F * 1.2) / 2)}, legendIcon(ctx, A.icon, C.F * 1.0)),
              textAt(A.fit, {x: rw.iconW + C.F * 1.3, y: sy, fill: th.fg}));
          });
        })) : null,
      L2.node,
    );
  },
  frame(ctx, L, u) {
    const {C, R, P} = L;
    const nodes = {};
    const kOpen = ease.inOutCubic(seg(u, ...W.open));
    const kClose = ease.inOutCubic(seg(u, ...W.close));
    const p = kOpen * (1 - kClose);
    Object.assign(nodes, L.lensGeom.frame(p, 0));
    const kOld = seg(u, ...W.oldOut);
    const kMove = ease.inOutCubic(seg(u, ...W.move));
    const kNew = seg(u, ...W.newIn);
    const E = C.Eb, t = C.t;
    const rail = lerp(C.railB, C.railA, kMove);
    const yTop = R.lower ? E.yTop : rail;
    const yBot = R.lower ? rail : E.yBot;
    const fs = {x: C.sx + E.x, y: C.sy, yTop, yBot, t, w: E.w, glass: 1, lift: 0};
    Object.assign(nodes, frameProps('frame', fs), frameProps('lf', fs));
    const ghostOp = R.changed ? clamp(kMove * 3) : 0;
    nodes.ghost = {opacity: r(ghostOp, 3)};
    nodes.lghost = {opacity: r(ghostOp, 3)};
    // tag hangs from the rail's right end and moves with it
    const tagPos = T(C.sx + C.tagDX + C.F * 0.6, C.sy + rail + t / 2);
    nodes.ctagw = {transform: tagPos};
    nodes.ltagw = {transform: tagPos};
    // the datum: in the lens while it is open; in the context otherwise (never both legible)
    const lensHolds = p > 0.25;
    const oldOp = 1 - kOld, newOp = kNew;
    const lift = -C.F * 0.8 * kOld;
    nodes['ltag-b'] = {opacity: r(oldOp, 3), transform: T(0, lift)};
    nodes['ltag-a'] = {opacity: r(newOp, 3), transform: T(0, 0)};
    const ctxOld = !lensHolds && u < W.newIn[0] ? 1 : 0;
    const ctxNew = !lensHolds && u >= W.newIn[0] ? 1 : 0;
    nodes['ctag-b'] = {opacity: ctxOld, transform: T(0, 0)};
    nodes['ctag-a'] = {opacity: ctxNew, transform: T(0, 0)};
    const mk = seg(u, ...W.marker);
    nodes.markerw = {opacity: r(R.changed ? mk : 0, 3), transform: T(C.sx + E.x + E.w + C.F * 0.2, C.sy + rail - C.F * 0.9)};
    // legend: fades out under the opening lens, back with the after-states once it closes
    const panelOp = clamp(1 - kOpen * 3) + clamp((kClose - 0.6) / 0.4);
    if (C.PL) {
      nodes.panel = {opacity: r(clamp(panelOp), 3)};
      const after = u >= W.newIn[0] ? 1 : 0;
      for (const rw of C.PL.rows) {
        if (rw.sub) nodes[`${rw.name}-sub`] = {opacity: 0};
        if (C.after[rw.name]) { nodes[`${rw.name}-sub1`] = {opacity: after ? 0 : 1}; nodes[`${rw.name}-sub2`] = {opacity: after}; }
        if (rw.name === 'lg-marker') nodes[rw.name] = {opacity: r(R.changed ? mk : 0, 3)};
      }
    }
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const datum = u < W.newIn[0] ? 'before' : 'after';
    const tagWorld = {x: C.sx + C.tagDX + C.F * 0.6, y: C.sy + rail + t / 2};
    return {
      nodes,
      semantic: {
        beat, datum,
        lensOpen: r(p, 3), zoom: r(C.k, 3),
        src: {x: r(C.src.x), y: r(C.src.y), w: r(C.src.w), h: r(C.src.h)},
        dest: {x: r(C.dest.x), y: r(C.dest.y), w: r(C.dest.w), h: r(C.dest.h)},
        rail: r(C.sy + rail), railBefore: r(C.sy + C.railB), railAfter: r(C.sy + C.railA),
        tag: R2(tagWorld),
        lensTag: R2({x: C.dest.x + (tagWorld.x - C.src.x) * C.k, y: C.dest.y + (tagWorld.y - C.src.y) * C.k}),
        datumInLens: lensHolds, ctxOld, ctxNew, lensOld: r(lensHolds ? oldOp : 0, 3), lensNew: r(lensHolds ? newOp : 0, 3),
        ghost: r(ghostOp, 3), marker: r(R.changed ? mk : 0, 3),
        before: R.before, after: R.after, lower: R.lower, changed: R.changed,
        inside: R.qs.map(q => (u >= W.newIn[0] ? q.inAfter : q.inBefore)),
        panel: C.PL ? r(clamp(panelOp), 3) : 0,
        problems: C.problems, textPx: r(C.F, 1),
        desk: {x: r(C.desk.x), y: r(C.desk.y), w: r(C.desk.w), h: r(C.desk.h)},
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
    slug: 'review-04-inspect',
    title: 'Review limits — a lens on the frame\'s edge: its tag value is substituted and the rail moves one section, then back to the desk',
    titleEs: 'Límites de revisión — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Límites de revisión',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The desk after the action: a placeholder decision with the review frame laid over the supplied sections, two equal arrow tags and a desk calendar; an edge tag hangs from the frame\'s focus rail with the supplied datum. A lens opens on the rail\'s end (a real enlarged copy at the same coordinates); the tag\'s value is substituted by the alternative supplied value and only that rail slides to the new section, with a ghost outline of the old position. The lens closes; the frame now ends at the new section, a neutral changed-datum marker stays, and the legend updates where each question\'s section lies (as supplied). Seeking back restores the old datum. No validity, scope rule or outcome; jurisdiction unspecified.',
    tags: ['review', 'review limits', 'inspect', 'lens', 'frame edge', 'substitution', 'changed datum', 'scope as supplied', 'filter', 'calendar'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/limites-de-revision.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
