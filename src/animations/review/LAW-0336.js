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
const W = {up: [0.15, 0.21], open: [0.2, 0.38], oldOut: [0.46, 0.5], newIn: [0.5, 0.55], move: [0.55, 0.67], close: [0.76, 0.86], down: [0.86, 0.92], marker: [0.84, 0.89], panelBack: [0.84, 0.9]};
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
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const problems = [];
  // legend rows (in one column, or two on wide frames)
  const rows = [];
  if (showAll) rows.push({kind: 'heading', icon: 'sheet', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) rows.push({kind: 'item', icon: 'frame', text: P.labels.frame, name: 'lg-frame'});
  // each question: its state before (shown from the start) and after (swapped while the lens covers the legend)
  const longer = P.outcomes.inside.length >= P.outcomes.outside.length ? P.outcomes.inside : P.outcomes.outside;
  if (showKey) R.qs.forEach(q => rows.push({kind: 'item', icon: q.side, text: q.text, sub: longer, subIcon: 'inside', name: `lg-q${q.side}`}));
  if (showKey) rows.push({kind: 'item', icon: 'ring', color: ctx.theme.accent2, text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  // landscape: the desk on the left (>= ~45 % of the frame width) and, on the right, the column shared by the legend
  // and the lens; portrait and square: stacked — the desk on top, the shared band below
  const side = ctx.view.shape === 'landscape';
  const fitS = Math.min(ctx.view.content.w / DW, ctx.view.content.h / DH);
  const shortD = Math.min(ctx.view.width, ctx.view.height) / fitS;
  const frameWD = ctx.view.width / fitS;
  const gap = side ? F * 1.4 : F * 0.5;
  const sideW = side ? DW - frameWD * 0.46 - gap : DW;
  const nCols = rows.length && !side && DW > 1200 ? 2 : 1;
  const colGap = F * 1.6;
  const colW = (sideW - (nCols - 1) * colGap) / nCols;
  const split = nCols === 2 ? Math.ceil(rows.length / 2) : rows.length;
  const cols = [];
  if (rows.length) {
    const parts = nCols === 2 ? [rows.slice(0, split), rows.slice(split)] : [rows];
    parts.forEach((rs, i) => {
      const PL = panelLayout(ctx, rs, {w: colW, F});
      if (!PL.ok) problems.push('panel-text');
      cols.push({PL, x: i * (colW + colGap)});
    });
  }
  // the after-state of each question's line: drawn at the same place, swapped while the lens covers the legend
  const after = {};
  for (const col of cols) for (const rw of col.PL.rows) {
    const q = R.qs.find(x => `lg-q${x.side}` === rw.name);
    if (!q || !rw.sub) continue;
    const fa = fitG(q.inAfter ? P.outcomes.inside : P.outcomes.outside, {maxWidth: rw.tw - F * 1.3, size: F, maxLines: 3, weight: 600});
    const fb = fitG(q.inBefore ? P.outcomes.inside : P.outcomes.outside, {maxWidth: rw.tw - F * 1.3, size: F, maxLines: 3, weight: 600});
    if (!fa.ok || !fb.ok || fa.lines.length > rw.sub.lines.length || fb.lines.length > rw.sub.lines.length) problems.push('after-text');
    after[rw.name] = {A: {fit: fa, icon: q.inAfter ? 'inside' : 'outside'}, B: {fit: fb, icon: q.inBefore ? 'inside' : 'outside'}};
  }
  const panelH = cols.length ? Math.max(...cols.map(c => c.PL.h)) : 0;
  // (the frame's short side in design units sizes the lens)
  const lensMinH = shortD * (ctx.view.shape === 'portrait' ? 0.42 : 0.346);
  let desk, band, restDx = 0, restDy = 0;
  if (side) {
    desk = {x: 0, y: 0, w: DW - sideW - gap, h: DH};
    band = {x: DW - sideW, y: 4, w: sideW - 6, h: DH - 8};
    if (panelH > DH) problems.push('panel-tall');
    // (labels hidden: no legend — the desk rests centred and slides aside only while the lens is open)
    if (!cols.length) restDx = (DW - desk.w) / 2;
  } else {
    const Ha = Math.max(panelH + F * 0.5, lensMinH + 4);
    const Hd = DH - Ha - gap;
    desk = {x: 0, y: 0, w: DW, h: Hd};
    band = {x: 8, y: Hd + gap, w: DW - 16, h: Ha};
    if (!cols.length) restDy = (DH - Hd) / 2;
  }
  const inset = side ? Math.max(18, F * 0.9) : Math.max(7, F * 0.4);
  const inner = {x: desk.x + inset, y: desk.y + inset, w: desk.w - inset * 2, h: desk.h - inset * 2};
  const AW = clamp(F * 5.2, 92, 140);
  const gapA = F * 0.4;
  const t = Math.max(12, F * 0.62);
  const m = Math.max(16, F * 0.9);
  const TWv = F * v.tw;
  const SW = Math.min(v.sw, inner.w - AW - gapA - m - 12 - TWv);
  if (SW < 240) problems.push('sheet-narrow');
  const M = sheetModel(ctx, {w: Math.max(240, SW), F, title: P.decisions.title, sections: P.decisions.sections, showText: showKey, bars: v.bars, compact: v.compact, pips: false, rowLines: 2, titleLines: 2});
  if (!M.ok) problems.push('sheet-text');
  if (M.h > inner.h + 0.5) problems.push('sheet-tall');
  // edge plate: pinned beside the frame's right rail at the height of the focus rail (the supplied datum)
  const tagX0 = M.w + m + 10;
  const TW = TWv;
  const blockW = AW + gapA + tagX0 + TW;
  const sx = inner.x + Math.max(0, (inner.w - blockW) / 2) + AW + gapA;
  const sy = inner.y + Math.max(0, (inner.h - M.h) / 2);
  if (sx + tagX0 + TW > desk.x + desk.w - inset * 0.5) problems.push('tag-right');
  const Eb = frameExtent(M, R.before.from, R.before.to, {t, margin: m});
  const Ea = frameExtent(M, R.after.from, R.after.to, {t, margin: m});
  const railB = R.lower ? Eb.yBot : Eb.yTop;
  const railA = R.lower ? Ea.yBot : Ea.yTop;
  const tagFitB = showKey ? fitG(P.beforeValue, {maxWidth: TW - F * 1.1, size: F, maxLines: 5, weight: 600}) : null;
  const tagFitA = showKey ? fitG(P.afterValue, {maxWidth: TW - F * 1.1, size: F, maxLines: 5, weight: 600}) : null;
  if ((tagFitB && !tagFitB.ok) || (tagFitA && !tagFitA.ok)) problems.push('tag-text');
  const tagH = Math.max(tagFitB ? tagFitB.height : F * 1.4, tagFitA ? tagFitA.height : F * 1.4) + F * 0.8;
  // (centred on the rail, kept inside the desk; a short pin line joins it to the rail's end)
  const pTopMin = desk.y - sy + 6, pTopMax = desk.y + desk.h - sy - 6 - tagH;
  const plateTop = rail => clamp(rail + t / 2 - tagH / 2, pTopMin, Math.max(pTopMin, pTopMax)); // sheet-local
  if (pTopMax < pTopMin) problems.push('tag-outside');
  // lens source: the full width of the section rows (titles wholly inside, the arrows' tips outside), the frame's
  // right rail and the plate; rows added around the rail until the lens is a real inspection
  const x0 = sx + F * 0.62 + 3;
  const x1 = sx + tagX0 + TW + 8;
  const touch = rl => {
    // rows bordering a rail (sheet-local rail top) — the row above and the row below
    const above = M.rows.filter(rw => rw.y + rw.h <= rl + 0.5).pop();
    const below = M.rows.find(rw => rw.y >= rl + t - 0.5);
    return [above, below].filter(Boolean).map(rw => rw.i);
  };
  const idx = [...touch(railB), ...touch(railA)];
  const lo0 = Math.min(...idx), hi0 = Math.max(...idx);
  const plateMin = sy + Math.min(plateTop(railB), plateTop(railA)) - 6, plateMax = sy + Math.max(plateTop(railB), plateTop(railA)) + tagH + 6;
  // the smallest crop: the rows bordering the rail (before and after) and the plate
  const minY0 = Math.min(sy + M.rows[lo0].y - M.rowGap / 2, plateMin);
  const minY1 = Math.max(sy + M.rows[hi0].y + M.rowH + M.rowGap / 2, plateMax);
  const srcW = x1 - x0;
  let k = Math.min(band.w / srcW, band.h / (minY1 - minY0), Math.max(1.5, P.detailGeometry.zoom));
  // taller crop (more filler rows around the rail) until the lens is a real inspection; rows only partly inside the
  // crop are copied without their titles (no supplied text is cut by the rim)
  let srcH = Math.min(band.h / k, Math.max(minY1 - minY0, lensMinH / k));
  const cyS = (minY0 + minY1) / 2;
  let y0 = clamp(cyS - srcH / 2, desk.y + 3, desk.y + desk.h - 3 - srcH);
  if (y0 > minY0) y0 = minY0;
  if (y0 + srcH < minY1) srcH = minY1 - y0;
  const src = {x: x0, y: y0, w: srcW, h: Math.min(srcH, desk.y + desk.h - 3 - y0)};
  k = Math.min(k, band.h / src.h);
  // (the lens window has rounded corners: a row counts as inside only clear of the corner radius)
  const cr = 30 / k;
  const whole = M.rows.filter(rw => sy + rw.y >= src.y + cr && sy + rw.y + rw.h <= src.y + src.h - cr).map(rw => rw.i);
  const lensRows = {lo: Math.min(...whole, 99), hi: Math.max(...whole, -1)};
  // the rows bordering the rail (before and after) must be readable in the lens: that is where the edge stands
  if (showKey && !idx.every(i => whole.includes(i))) problems.push('lens-rows');
  if (k < 1.5 - 1e-6) problems.push('lens-zoom');
  const dest = {w: src.w * k, h: src.h * k};
  dest.x = band.x + (band.w - dest.w) / 2;
  dest.y = band.y + (band.h - dest.h) / 2;
  if (Math.min(dest.w, dest.h) < shortD * 0.343) problems.push('lens-small');
  if (src.y < desk.y + 2 || src.y + src.h > desk.y + desk.h - 2) problems.push('src-outside');
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
  return {F, desk, band, restDx, restDy, side, cols, after, plateTop, M, sx, sy, Eb, Ea, t, m, AW, TW, tagX0, tagFitB, tagFitA, tagH, railB, railA, src, dest, k, lensRows, arrows, cal, shortD, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedLr(ctx, EN, ES);
    const R = resolve(P);
    const shape = ctx.view.shape;
    const sws = shape === 'landscape' ? [360, 320, 290, 260] : shape === 'square' ? [440, 425, 410, 380, 350] : [560, 500, 440, 380];
    const tws = shape === 'square' ? [11, 10, 9] : [12, 10, 8.5];
    const variants = tws.flatMap(tw => sws.flatMap(sw => [...(shape === 'portrait' ? [{sw, tw, bars: 2}] : []), {sw, tw, bars: 1}, {sw, tw, bars: 0}, {sw, tw, bars: 0, compact: true}]));
    const sizes = !ctx.show('key') || shape === 'portrait' ? [30, 28, 26, 24.5, ...SIZES] : SIZES;
    let C = null, best = null;
    outer: for (const F of sizes) for (const v of variants) {
      const c = compose(ctx, P, R, F, v);
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.problems.length) best = c;
    }
    C = C || best;
    // (lens geometry only — its frame() needs no content; the mounted lens is built with its content in build())
    const lensGeom = makeLens(ctx, {name: 'lens', source: C.src, dest: C.dest, content: null, color: ctx.theme.accent2});
    return {P, R, C, lensGeom};
  },
  build(ctx, L) {
    const {C, R} = L;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const E = C.Eb;
    const frame = prefix => frameNode(ctx, {prefix, w: E.w, t: C.t, yTop: E.yTop, yBot: E.yBot, knobs: false});
    const plate = (prefix, fitB, fitA) => g({name: prefix},
      h('path', {d: roundRectPath(5, 7 - C.tagH / 2, C.TW, C.tagH, 10), fill: th.shadow}),
      h('path', {d: roundRectPath(0, -C.tagH / 2, C.TW, C.tagH, 10), fill: '#fff', stroke: INK, 'stroke-width': 2.5}),
      h('circle', {cx: r(C.F * 0.45), cy: 0, r: 4.5, fill: RAIL, stroke: INK, 'stroke-width': 1.5}),
      h('circle', {cx: r(C.TW - C.F * 0.45), cy: 0, r: 4.5, fill: RAIL, stroke: INK, 'stroke-width': 1.5}),
      fitB ? g({name: `${prefix}-b`}, textAt(fitB, {x: C.F * 0.9, y: -fitB.height / 2, fill: INK})) : h('rect', {name: `${prefix}-b`, x: r(C.F * 0.9), y: r(-C.F * 0.25), width: r((C.TW - C.F * 1.8) * 0.8), height: r(C.F * 0.5), rx: 4, fill: th.paperLine}),
      fitA ? g({name: `${prefix}-a`, opacity: 0}, textAt(fitA, {x: C.F * 0.9, y: -fitA.height / 2, fill: INK})) : h('rect', {name: `${prefix}-a`, opacity: 0, x: r(C.F * 0.9), y: r(-C.F * 0.25), width: r((C.TW - C.F * 1.8) * 0.55), height: r(C.F * 0.5), rx: 4, fill: th.paperLine}),
    );
    const ghost = prefix => h('rect', {name: prefix, x: 0, y: 0, width: r(E.w), height: r(C.t), rx: r(C.t * 0.35), fill: 'none', stroke: RAIL, 'stroke-width': 2.5, 'stroke-dasharray': '7 6', opacity: 0});
    // lens copy: same coordinates as the context; the rows inside the crop keep their titles (wholly inside)
    const inLens = i => i >= C.lensRows.lo && i <= C.lensRows.hi;
    const copyRows = C.M.rows.map((rw, i) => rowParts(ctx, C.M, i, {prefix: 'lc', rowText: inLens}));
    const lensContent = g(null,
      h('rect', {x: r(C.src.x - 400), y: r(C.src.y - 400), width: r(C.src.w + 800), height: r(C.src.h + 800), fill: th.woodTop}),
      g({transform: T(C.sx, C.sy)}, h('path', {d: roundRectPath(0, 0, C.M.w, C.M.h, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.5}), copyRows),
      frame('lf'),
      g({name: 'lg-ghostw', transform: T(C.sx + E.x, C.sy + C.railB)}, ghost('lghost')),
      h('line', {name: 'llink', stroke: INK, 'stroke-width': 3}),
      g({name: 'ltagw'}, plate('ltag', C.tagFitB, C.tagFitA)),
    );
    const L2 = makeLens(ctx, {name: 'lens', source: C.src, dest: C.dest, content: lensContent, color: th.accent2});
    const panel = C.cols.length ? g({name: 'panel', transform: T(C.band.x, C.band.y + Math.max(0, (C.band.h - Math.max(...C.cols.map(c => c.PL.h))) / 2))},
      C.cols.map(col => g({transform: T(col.x, 0)},
        panelNode(ctx, col.PL),
        col.PL.rows.filter(rw => C.after[rw.name]).flatMap(rw => {
          const sy = rw.y + rw.fit.height + C.F * 0.3;
          return [['B', 'sub1'], ['A', 'sub2']].map(([k, nm]) => {
            const A = C.after[rw.name][k];
            return g({name: `${rw.name}-${nm}`, opacity: 0},
              g({transform: T(rw.iconW + C.F * 0.55, sy + Math.min(A.fit.height, C.F * 1.2) / 2)}, legendIcon(ctx, A.icon, C.F * 1.0)),
              textAt(A.fit, {x: rw.iconW + C.F * 1.3, y: sy, fill: th.fg}));
          });
        })))) : null;
    return g({name: 'scene'},
      g({name: 'context', transform: T(C.restDx, C.restDy)},
        desk.surface,
        g({'clip-path': desk.clip},
          g({transform: T(C.cal.x, C.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: C.cal.w, h: C.cal.h})),
          g({transform: T(C.sx, C.sy)}, sheetNode(ctx, C.M, {prefix: 'sheet', showText: showKey})),
          C.arrows.map((a, i) => g({transform: T(a.tip.x, a.tip.y)}, arrowNode(ctx, {prefix: `arrow${R.qs[i].side}`, side: a.side, len: a.len, hgt: a.hgt}))),
          frame('frame'),
          g({name: 'ghostw', transform: T(C.sx + E.x, C.sy + C.railB)}, ghost('ghost')),
          h('line', {name: 'clink', stroke: INK, 'stroke-width': 3}),
          g({name: 'ctagw'}, plate('ctag', C.tagFitB, C.tagFitA)),
          g({name: 'markerw', opacity: 0}, changedMarker(ctx, {radius: Math.max(16, C.F * 0.85)})),
        ),
        desk.frame,
      ),
      panel,
      L2.node,
    );
  },
  frame(ctx, L, u) {
    const {C, R} = L;
    const nodes = {};
    const kOpen = ease.inOutCubic(seg(u, ...W.open));
    const kClose = ease.inOutCubic(seg(u, ...W.close));
    const p = kOpen * (1 - kClose);
    Object.assign(nodes, L.lensGeom.frame(p, 0));
    // the lens window is shown from 86 % open on (it grows at its own place, not over the desk's rows)
    const lensVis = clamp((p - 0.86) / 0.1);
    nodes.lens = {opacity: r(lensVis, 3)};
    // labels hidden: the centred desk slides up for the lens and back for the hold
    const up = ease.inOutCubic(seg(u, ...W.up)), down = ease.inOutCubic(seg(u, ...W.down));
    const dyNow = C.restDy * (1 - up + down);
    const dxNow = C.restDx * (1 - up + down);
    nodes.context = {transform: T(dxNow, dyNow)};
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
    // the plate rides on the rail
    const pc = C.plateTop(rail) + C.tagH / 2;
    const tagPos = T(C.sx + C.tagX0, C.sy + pc);
    nodes.ctagw = {transform: tagPos};
    nodes.ltagw = {transform: tagPos};
    const link = {x1: r(C.sx + E.x + E.w), y1: r(C.sy + rail + t / 2), x2: r(C.sx + C.tagX0 + 2), y2: r(C.sy + pc)};
    nodes.clink = link;
    nodes.llink = link;
    // the datum: in the lens while it is shown; in the context otherwise (never both legible)
    const lensHolds = lensVis > 0;
    const oldOp = 1 - kOld, newOp = kNew;
    nodes['ltag-b'] = {opacity: r(oldOp, 3), transform: T(0, -C.F * 0.8 * kOld)};
    nodes['ltag-a'] = {opacity: r(newOp, 3), transform: T(0, 0)};
    const ctxOld = !lensHolds && u < W.newIn[0] ? 1 : 0;
    const ctxNew = !lensHolds && u >= W.newIn[0] ? 1 : 0;
    nodes['ctag-b'] = {opacity: ctxOld, transform: T(0, 0)};
    nodes['ctag-a'] = {opacity: ctxNew, transform: T(0, 0)};
    const mk = seg(u, ...W.marker);
    nodes.markerw = {opacity: r(R.changed ? mk : 0, 3), transform: T(C.sx + E.x + E.w + C.F * 0.1, C.sy + rail + t / 2)};
    // legend: fades out under the opening lens, back with the after-states once it closes
    const panelOp = clamp(1 - kOpen * 3) + clamp((kClose - 0.6) / 0.4);
    if (C.cols.length) {
      nodes.panel = {opacity: r(clamp(panelOp), 3)};
      const after = u >= W.newIn[0] ? 1 : 0;
      for (const col of C.cols) for (const rw of col.PL.rows) {
        if (rw.sub) nodes[`${rw.name}-sub`] = {opacity: 0};
        if (C.after[rw.name]) { nodes[`${rw.name}-sub1`] = {opacity: after ? 0 : 1}; nodes[`${rw.name}-sub2`] = {opacity: after}; }
        if (rw.name === 'lg-marker') nodes[rw.name] = {opacity: r(R.changed ? mk : 0, 3)};
      }
    }
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const datum = u < W.newIn[0] ? 'before' : 'after';
    const tagWorld = {x: C.sx + C.tagX0 + dxNow, y: C.sy + pc + dyNow};
    const tagLens = {x: C.sx + C.tagX0, y: C.sy + pc};
    return {
      nodes,
      semantic: {
        beat, datum,
        lensOpen: r(p, 3), lensShown: r(lensVis, 3), zoom: r(C.k, 3),
        src: {x: r(C.src.x), y: r(C.src.y), w: r(C.src.w), h: r(C.src.h)},
        dest: {x: r(C.dest.x), y: r(C.dest.y), w: r(C.dest.w), h: r(C.dest.h)},
        rail: r(C.sy + rail), railBefore: r(C.sy + C.railB), railAfter: r(C.sy + C.railA),
        tag: R2(tagWorld),
        lensTag: R2({x: C.dest.x + (tagLens.x - C.src.x) * C.k, y: C.dest.y + (tagLens.y - C.src.y) * C.k}),
        lensRows: C.lensRows,
        datumInLens: lensHolds, ctxOld, ctxNew, lensOld: r(lensHolds ? oldOp : 0, 3), lensNew: r(lensHolds ? newOp : 0, 3),
        ghost: r(ghostOp, 3), marker: r(R.changed ? mk : 0, 3), deskDy: r(dyNow),
        before: R.before, after: R.after, lower: R.lower, changed: R.changed,
        inside: R.qs.map(q => (u >= W.newIn[0] ? q.inAfter : q.inBefore)),
        panel: C.cols.length ? r(clamp(panelOp), 3) : 0,
        problems: C.problems, textPx: r(C.F, 1),
        desk: {x: r(C.desk.x + dxNow), y: r(C.desk.y + dyNow), w: r(C.desk.w), h: r(C.desk.h)},
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
