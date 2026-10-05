/**
 * LAW-0355 — Efectos durante revisión · contrast
 *
 * Storyboard (two complete two-lane boards of the same size — side by side on wide frames, one above the other on tall
 * ones — each with the same decision card on the process lane, the same appeal card on the review lane, the same
 * filter gate, the same blank datum tag above the gate and the same calendar; only ONE fact differs: the supplied
 * datum — A "effect maintained", B "effect suspended according to the data supplied"):
 *  0.00–0.18  base: both boards identical and still; the gates' slats half-turned (unset), the tags blank.
 *  0.18–0.40  in parallel and identically, both decision cards advance up to their gate and both appeal cards advance
 *             along their review lanes (the appeal cards keep going at the same pace).
 *  0.40–0.50  the changed fact, localised: each tag receives its supplied datum and each gate turns to it — A's slats
 *             edge-on (open), B's closed with the neutral pause glyph. This is the only change between the scenes.
 *  0.50–0.77  the consequence of geometry only: A's decision card passes under its gate to the end bay and the chevrons
 *             past the gate light up; B's decision card stays before its gate; both appeal cards reach their bays
 *             identically.
 *  0.77–1.00  the guide: a highlight outline round each tag + gate, joined by one line with its label ("only this
 *             differs"); the neutral note and key. No winner, no score, no doctrine; dates and time limits never shown.
 * @module animations/review/LAW-0355
 */
import {defineAnimation} from '../../core/define.js';
import {fitDesign} from '../../core/layout.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, lerp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {
  edFields, ED_EN, ED_ES, localisedEd, cardModel, cardNode, tagModel, boardPlan, boardNodes, gateFrame, litFrame,
  panelLayout, panelNode, fitG, textAt, laneColor, R2, INK,
} from './kits/efectos-durante-revision.js';

const ID = 'LAW-0355';
const DURATION = 7500;
const CHANGE_AT = 0.4;
const BEATS = {base: [0, 0.18], parallel: [0.18, 0.4], change: [0.4, 0.5], consequence: [0.5, 0.77], guide: [0.77, 1]};
const W = {toGate: [0.18, 0.38], appeal: [0.18, 0.74], tag: [0.4, 0.45], set: [0.42, 0.5], pass: [0.5, 0.72], lit: [0.52, 0.72], guide: [0.77, 0.83], notes: [0.8, 0.85]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const DATA = ['maintained', 'suspended'];

const OWN_EN = {
  scenarioA: {label: 'A · Effect maintained (datum)', caption: ''},
  scenarioB: {label: 'B · Effect suspended (per data)', caption: ''},
  routes: {process: 'Process lane (as configured)', review: 'Review lane (as configured)'},
  changedFact: 'Only the supplied datum on the tag differs',
  sharedFacts: ['Same cards, lanes, gate and calendar'],
  objectLabels: {arrows: 'Chevrons: direction of travel in each lane', calendar: 'Calendar (a fixture; no date marked)'},
  comparisonLabels: {guide: 'only this differs', neutral: 'Two supplied situations side by side: no winner, no outcome'},
};
const OWN_ES = {
  scenarioA: {label: 'A · Efecto mantenido (dato)', caption: ''},
  scenarioB: {label: 'B · Efecto suspendido según datos', caption: ''},
  routes: {process: 'Carril del proceso (según lo configurado)', review: 'Carril del recurso (según lo configurado)'},
  changedFact: 'Solo cambia el dato aportado en la etiqueta',
  sharedFacts: ['Mismas tarjetas, carriles, filtro y calendario'],
  objectLabels: {arrows: 'Chevrones: sentido de avance en cada carril', calendar: 'Calendario (accesorio; sin fechas marcadas)'},
  comparisonLabels: {guide: 'solo esto cambia', neutral: 'Dos situaciones aportadas lado a lado: sin ganador ni resultado'},
};
const EN = {...ED_EN, ...OWN_EN};
const ES = {...ED_ES, ...OWN_ES};

const sceneSchema = {
  ...edFields,
  scenarioA: obj('Scenario A (its tag carries outcomes.maintained)', {label: str('Short label for scenario A', 70), caption: str('Optional one-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B (its tag carries outcomes.suspended)', {label: str('Short label for scenario B', 70), caption: str('Optional one-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B (here: the supplied datum on the tag)', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  objectLabels: obj('Captions of the shared objects in the strip', {
    arrows: str('Caption for the chevrons (direction of travel only)', 80),
    calendar: str('Caption for the calendar (a fixture only)', 70),
  }, ['arrows', 'calendar']),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide joining the changed detail', 50), neutral: str('Neutral note (no winner, no outcome)', 120)}, ['guide', 'neutral']),
};

const defaultParams = {...EN};

/** Height of the guide's chip (0 when notes are hidden). */
function guideChipH(ctx, P, F, DW, showAll) {
  return showAll ? chip(ctx, P.comparisonLabels.guide, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(DW * 0.4, 360), size: F, minSize: F, maxLines: 2, weight: 600}).box.h : 0;
}

function compose(ctx, P, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const th = ctx.theme;
  const row = v.arr === 'row';
  const H = v.orient === 'h';
  const problems = [];
  // shared strip
  const rowsL = [], rowsR = [];
  if (showKey && v.list) {
    rowsL.push({kind: 'item', icon: 'cardA', text: P.decisions.title, name: 'sh-title'});
    rowsL.push({kind: 'item', text: P.decisions.ref, name: 'sh-ref'});
    rowsL.push({kind: 'item', icon: 'cardB', text: P.grounds.appeal, name: 'sh-appeal'});
  }
  if (showKey) rowsL.push({kind: 'heading', icon: 'filter', text: P.labels.filter, name: 'sh-filter'});
  if (showKey) rowsL.push({kind: 'item', icon: 'laneA', text: P.routes.process, name: 'sh-process'});
  if (showKey) rowsL.push({kind: 'item', icon: 'laneB', text: P.routes.review, name: 'sh-review'});
  if (showAll) rowsR.push({kind: 'item', icon: 'kind-sequence', text: P.objectLabels.arrows, name: 'sh-arrows'});
  if (showAll) rowsR.push({kind: 'item', icon: 'calendar', text: P.objectLabels.calendar, name: 'sh-calendar'});
  if (showAll) P.sharedFacts.forEach((f, i) => rowsR.push({kind: 'item', icon: 'same', text: f, name: `sh-fact${i}`}));
  if (showKey) rowsR.push({kind: 'item', icon: 'guide', text: P.changedFact, name: 'sh-changed'});
  if (showAll) rowsR.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'sh-neutral'});
  if (showKey) rowsR.push({kind: 'key', text: P.labels.key, name: 'key'});
  let strip = null;
  if (rowsL.length + rowsR.length) {
    const cols = v.cols ?? (row ? 2 : 1);
    if (cols === 2) {
      const cw = (DW - F * 2) / 2;
      const L1 = panelLayout(rowsL, {w: cw, F, tight: v.tight}), L2 = panelLayout(rowsR, {w: cw, F, tight: v.tight});
      strip = {cols: [{PL: L1, x: 0}, {PL: L2, x: cw + F * 2}], h: Math.max(L1.h, L2.h)};
      if (!L1.ok || !L2.ok) problems.push('strip-text');
    } else {
      const L1 = panelLayout([...rowsL, ...rowsR], {w: DW, F, cols: v.stripCols || 1, tight: v.tight});
      strip = {cols: [{PL: L1, x: 0}], h: L1.h};
      if (!L1.ok) problems.push('strip-text');
    }
  }
  const stripH = (strip ? strip.h + F * 0.9 : 0) + (row && !H && guideChipH(ctx, P, F, DW, showAll) ? guideChipH(ctx, P, F, DW, showAll) + F * 0.5 : 0);
  // scenes
  const gapS = F * 1.6;
  const sceneW = row ? (DW - gapS) / 2 : DW;
  const badgeR = F * 0.95;
  const guideChip = showAll ? chip(ctx, P.comparisonLabels.guide, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(DW * 0.4, 360), size: F, minSize: F, maxLines: 2, weight: 600}) : null;
  if (guideChip && guideChip.fit.truncated) problems.push('guide-text');
  const chipH = guideChip ? guideChip.box.h : 0;
  const headW = sceneW - badgeR * 2 - F - (row ? 0 : F * 1.6); // (column: the guide runs down the right margin)
  const heads = [P.scenarioA, P.scenarioB].map(sc => {
    const lab = showKey ? fitG(sc.label, {maxWidth: headW, size: F * 1.05, minSize: F, maxLines: 2, weight: 700}) : null;
    const cap = showAll && sc.caption ? fitG(sc.caption, {maxWidth: headW, size: F, maxLines: 2, weight: 500}) : null;
    if ((lab && !lab.ok) || (cap && !cap.ok)) problems.push('header-text');
    return {lab, cap, h: Math.max(badgeR * 2, (lab ? lab.height : 0) + (cap ? cap.height + F * 0.25 : 0)) + F * 0.45};
  });
  const headH = Math.max(heads[0].h, heads[1].h);
  const midBand = row ? 0 : Math.max(F * 0.8, chipH + F * 0.4); // (column: the guide's chip sits between the scenes)
  const m = v.tight ? Math.max(F * 0.45, 9) : Math.max(F * 0.7, 12);
  const availH = row ? DH - stripH - headH : (DH - stripH - midBand) / 2 - headH;
  const inner = {w: sceneW - m * 2, h: availH - m * 2};
  // (the narrowest tag that holds both data texts: a narrow tag keeps the middle column of a 'v' board slim)
  let TM = null;
  for (const k of H ? [12, 15] : [7.5, 9, 10.5]) { TM = tagModel(P, {w: F * k, F, maxLines: H ? 4 : 7}); if (TM.ok) break; }
  if (!TM.ok) problems.push('tag-text');
  const planFor = cw => {
    const M = cardModel(P, {w: cw, F, showText: showKey && !v.list, compact: v.list, minK: H ? v.minK : 0.3});
    return {M, B: boardPlan(M, TM, {F, orient: v.orient, tagTop: H, calEnd: false, compact: v.list})};
  };
  const fits = q => q.B.w <= inner.w + 0.5 && q.B.h <= inner.h + 0.5 && q.M.ok;
  const lo = v.list ? F * 4.6 : F * 8.6;
  const hi = Math.max(lo, Math.min(F * (H ? 16 : 13), H ? inner.w * 0.3 : inner.w * 0.36));
  let best = null;
  for (let k = 0; k <= 8; k++) {
    const q = planFor(hi - ((hi - lo) * k) / 8);
    if (fits(q)) { best = q; break; }
    if (!best) best = q;
  }
  let {M, B} = best;
 
  if (!fits(best)) problems.push('board');
  if (!M.ok) problems.push('card-text');
  if (!B.ok) problems.push('tag-calendar');
  const extra = (H ? inner.w - B.w : inner.h - B.h) - F * 0.5;
  if (fits(best) && extra > 0) B = boardPlan(M, TM, {F, orient: v.orient, tagTop: H, calEnd: false, compact: v.list, travel: B.travel + extra * 0.5, run: B.run + extra * 0.5});
  // the plates hug their boards (same size in A and B); the whole is centred vertically
  const plateW = sceneW, plateH = B.h + m * 2;
  const sceneH = headH + plateH;
  const total = row ? sceneH + stripH : sceneH * 2 + midBand + stripH;
  if (total > DH + 0.5) problems.push('too-tall');
  const dy = Math.max(0, (DH - total) / 2);
  const stages = [0, 1].map(i => (row
    ? {x: i * (sceneW + gapS), y: dy + headH, w: plateW, h: plateH, headY: dy}
    : {x: 0, y: dy + headH + i * (sceneH + midBand), w: plateW, h: plateH, headY: dy + i * (sceneH + midBand)}));
  const bx = (plateW - B.w) / 2, by = m;
  const stripY = dy + total - (strip ? strip.h : 0);
  return {F, H, row, M, TM, B, bx, by, m, stages, heads, headH, badgeR, guideChip, chipH, midBand, strip, stripY, sceneW, ok: !problems.length, problems, v};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 820], portrait: [950, 1420]},
  layout(ctx) {
    const P = localisedEd(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const vs = shape === 'portrait' ? [{arr: 'column', orient: 'h'}, {arr: 'column', orient: 'h', stripCols: 2}, {arr: 'column', orient: 'h', list: true, stripCols: 2}]
      : shape === 'square' ? [{arr: 'column', orient: 'h', list: true, stripCols: 3, tight: true}, {arr: 'row', orient: 'v', list: true, cols: 1, stripCols: 3, tight: true}, {arr: 'row', orient: 'v', list: true}, {arr: 'row', orient: 'v', list: true, tight: true}, {arr: 'column', orient: 'h', list: true, stripCols: 2, tight: true}]
        : [{arr: 'row', orient: 'v', cols: 1, stripCols: 3}, {arr: 'row', orient: 'v', list: true, cols: 1, stripCols: 3}, {arr: 'row', orient: 'v', list: true, cols: 1, stripCols: 3, tight: true}, {arr: 'row', orient: 'h', list: true}];
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const sizes = (!showKey ? [36, 32, 28, ...SIZES] : SIZES).map(x => x / pxu);
    let C = null, best = null;
    outer: for (const F of sizes) for (const v of vs.flatMap(x => [0.8, 0.6, 0.45, 0.3].map(mk => ({...x, minK: mk})))) {
      const c = compose(ctx, P, F, v);
     
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.problems.length) best = c;
    }
    return {P, C: C || best, pxu};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const {B, M, TM} = C;
    const nodesFor = (S, i) => {
      const k = i ? 'B' : 'A';
      const bn = boardNodes(ctx, B, TM, {prefix: `bd${k}`, showText: showKey, tagOps: [0, 0]});
      const hd = C.heads[i];
      const header = g({name: `head${k}`, transform: T(S.x, S.headY)},
        h('circle', {cx: r(C.badgeR), cy: r(C.badgeR + 2), r: r(C.badgeR), fill: laneColor(th, i), stroke: INK, 'stroke-width': 2.5}),
        showKey ? h('text', {x: r(C.badgeR), y: r(C.badgeR + 2 + C.F * 0.36), 'text-anchor': 'middle', 'font-size': r(C.F), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, k) : null,
        hd.lab ? textAt(hd.lab, {x: C.badgeR * 2 + C.F * 0.5, y: 2 + Math.max(0, C.badgeR - hd.lab.size * 0.62), fill: th.fg}) : null,
        hd.cap ? textAt(hd.cap, {x: C.badgeR * 2 + C.F * 0.5, y: 2 + Math.max(0, C.badgeR - hd.lab.size * 0.62) + hd.lab.height + C.F * 0.25, fill: th.fgSoft}) : null);
      const s0 = B.pos(0, B.tStart), s1 = B.pos(1, B.tStart);
      return g(null, header,
        g({name: `stage${k}`, transform: T(S.x, S.y)},
          h('path', {d: roundRectPath(5, 7, S.w, S.h, 22), fill: th.shadow}),
          h('path', {d: roundRectPath(0, 0, S.w, S.h, 22), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
          g({transform: T(C.bx, C.by)},
            bn.lanes, bn.cal, bn.tag,
            g({name: `card${k}P`, transform: T(s0.x, s0.y)}, cardNode(ctx, M, 0, {prefix: `card${k}P-art`})),
            g({name: `card${k}R`, transform: T(s1.x, s1.y)}, cardNode(ctx, M, 1, {prefix: `card${k}R-art`})),
            bn.gate)));
    };
    // guide: outline round each tag + gate; one line joins them, with its chip
    const gc = th.accent3;
    const pad = Math.max(10, C.F * 0.45);
    const ol = C.stages.map(S => {
      const t = {x: S.x + C.bx + B.tag.x, y: S.y + C.by + B.tag.y, w: B.tag.w, h: B.tag.h};
      const gb = {x: S.x + C.bx + B.gateBox.x, y: S.y + C.by + B.gateBox.y, w: B.gateBox.w, h: B.gateBox.h};
      const x0 = Math.min(t.x, gb.x) - pad, y0 = Math.min(t.y, gb.y) - pad;
      return {x: x0, y: y0, w: Math.max(t.x + t.w, gb.x + gb.w) + pad - x0, h: Math.max(t.y + t.h, gb.y + gb.h) + pad - y0, t};
    });
    const parts = ol.map(o => h('rect', {x: r(o.x), y: r(o.y), width: r(o.w), height: r(o.h), rx: 12, fill: 'none', stroke: gc, 'stroke-width': 5}));
    let chipNode = null;
    const chipAt = (x, y, anchor) => (C.guideChip ? chip(ctx, P.comparisonLabels.guide, {x, y: y - C.chipH / 2, anchor, maxWidth: Math.min(ctx.design.w * 0.4, 360), size: C.F, minSize: C.F, maxLines: 2, weight: 600, stroke: gc}).node : null);
    const line = d => parts.push(h('path', {d, fill: 'none', stroke: gc, 'stroke-width': 4, 'stroke-linejoin': 'round'}));
    if (C.row && C.H) {
      // side by side, tags above the gates: one straight line between the two outlines, through the empty top bands
      const y = ol[0].t.y + ol[0].t.h / 2;
      line(`M${r(ol[0].x + ol[0].w)} ${r(y)}H${r(ol[1].x)}`);
      chipNode = chipAt((ol[0].x + ol[0].w + ol[1].x) / 2, y, 'middle');
    } else if (C.row) {
      // side by side, vertical lanes: down each middle column, under the plates, joined below them (chip between)
      const yb = C.stages[0].y + C.stages[0].h + C.F * 0.25 + C.chipH / 2;
      const xa = ol[0].x + ol[0].w / 2 + C.F * 0.6, xb = ol[1].x + ol[1].w / 2 + C.F * 0.6;
      line(`M${r(xa)} ${r(ol[0].y + ol[0].h)}V${r(yb)}H${r(xb)}V${r(ol[1].y + ol[1].h)}`);
      chipNode = chipAt((xa + xb) / 2, yb, 'middle');
    } else {
      // stacked: out of A's top band to the right margin, down past A's lane ends, into B's top band
      const xr = C.stages[0].x + C.stages[0].w - C.m * 0.5;
      const ya = ol[0].t.y + ol[0].t.h / 2, yb = ol[1].t.y + ol[1].t.h / 2;
      line(`M${r(ol[0].x + ol[0].w)} ${r(ya)}H${r(xr)}V${r(yb)}H${r(ol[1].x + ol[1].w)}`);
      chipNode = chipAt(xr - C.F * 0.5, C.stages[1].headY - C.midBand / 2, 'end');
    }
    return g({name: 'scene'},
      C.stages.map(nodesFor),
      g({name: 'guide', opacity: 0}, parts, chipNode),
      C.strip ? g({name: 'strip', transform: T(0, C.stripY)}, C.strip.cols.map(col => g({transform: T(col.x, 0)}, panelNode(ctx, col.PL)))) : null,
    );
  },
  frame(ctx, L, u) {
    const {C} = L;
    const {B} = C;
    const nodes = {};
    const e = ease.inOutCubic;
    const kGate = e(seg(u, ...W.toGate)), kApp = e(seg(u, ...W.appeal)), kPass = e(seg(u, ...W.pass));
    const kTag = seg(u, ...W.tag), kSet = e(seg(u, ...W.set));
    const looks = {};
    C.stages.forEach((S, i) => {
      const k = i ? 'B' : 'A';
      const maintained = DATA[i] === 'maintained';
      const tP = lerp(B.tStart, B.tWait, kGate) + (maintained ? (B.tEnd - B.tWait) * kPass : 0);
      const tR = lerp(B.tStart, B.tEnd, kApp);
      const pP = B.pos(0, tP), pR = B.pos(1, tR);
      nodes[`card${k}P`] = {transform: T(pP.x, pP.y)};
      nodes[`card${k}R`] = {transform: T(pR.x, pR.y)};
      const closed = lerp(0.5, maintained ? 0 : 1, kSet);
      Object.assign(nodes, gateFrame(`bd${k}-gate`, closed, maintained ? 0 : kSet));
      const kLit = maintained ? seg(u, ...W.lit) : 0;
      Object.assign(nodes, litFrame(`bd${k}`, B, kLit));
      if (ctx.show('key')) {
        nodes[`bd${k}-tag-v0`] = {opacity: r(maintained ? kTag : 0, 3)};
        nodes[`bd${k}-tag-v1`] = {opacity: r(maintained ? 0 : kTag, 3)};
      } else nodes[`bd${k}-tag-bars`] = {opacity: r(kTag, 3)};
      looks[k] = {tP: r(tP, 2), tR: r(tR, 2), closed: r(closed, 3), pause: r(maintained ? 0 : kSet, 3), lit: r(kLit, 3), tag: r(kTag, 3), datum: kTag > 0 ? DATA[i] : 'none',
        cardP: R2({x: S.x + C.bx + pP.x + C.M.w / 2, y: S.y + C.by + pP.y + C.M.h / 2}), cardR: R2({x: S.x + C.bx + pR.x + C.M.w / 2, y: S.y + C.by + pR.y + C.M.h / 2})};
    });
    const gk = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gk, 3)};
    if (C.strip) for (const col of C.strip.cols) for (const row of col.PL.rows) if (row.name === 'sh-neutral') nodes[row.name] = {opacity: r(seg(u, ...W.notes), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.parallel[1] ? 'parallel' : u < BEATS.change[1] ? 'change' : u < BEATS.consequence[1] ? 'consequence' : 'guide';
    const strip = looks => {
      const {cardP, cardR, ...rest} = looks;
      return rest;
    };
    return {
      nodes,
      semantic: {
        beat,
        lookA: strip(looks.A), lookB: strip(looks.B),
        cardAP: looks.A.cardP, cardAR: looks.A.cardR, cardBP: looks.B.cardP, cardBR: looks.B.cardR,
        tStart: r(B.tStart, 2), tWait: r(B.tWait, 2), tEnd: r(B.tEnd, 2), gateT: r(B.gT, 2),
        passedA: looks.A.tP >= B.gT + B.gThk / 2, passedB: looks.B.tP >= B.gT + B.gThk / 2,
        guide: r(gk, 3),
        stages: C.stages.map(S => ({x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)})), arrangement: C.row ? 'row' : 'column', orient: C.H ? 'h' : 'v', list: !!C.v.list,
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
    slug: 'review-09-contrast',
    title: 'Effects during review — two identical two-lane boards; only the supplied datum on the filter tag differs, so the decision card passes the gate in A and waits before it in B',
    titleEs: 'Efectos durante revisión — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Efectos durante revisión',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete two-lane boards of equal size (side by side on wide frames, stacked on tall ones) with the same decision card on the process lane, the same appeal card on the review lane, the same filter gate, blank tag and calendar. Both cards advance identically; then only the supplied datum differs: A\'s tag reads "effect maintained" and its gate turns open, B\'s reads "effect suspended according to the data supplied" and its gate closes. A\'s decision card passes the gate; B\'s waits before it; both appeal cards reach their bays identically. A highlight guide joins the two tags ("only this differs"); a neutral note says there is no winner and no outcome. No suspension doctrine, dates or time limits; jurisdiction unspecified.',
    tags: ['review', 'effects during review', 'contrast', 'paired scenes', 'parallel lanes', 'filter gate', 'supplied datum', 'changed fact', 'neutral'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/efectos-durante-revision.js', 'src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
