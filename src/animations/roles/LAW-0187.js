/**
 * LAW-0187 — Mediación entre partes · contrast
 *
 * Two complete, identical mediation tables (same people, table, agenda,
 * token, mediator). Exactly one fact differs: WHEN each party speaks.
 *  - Scenario A (ordered turns): the mediator slides the token to the first
 *    speaker, ends that turn with an open hand and a tick, and passes the
 *    token to the other party; the speech bubbles alternate.
 *  - Scenario B (simultaneous interventions): the token stays on the table;
 *    both parties lean in and speak at the same time (both bubbles open,
 *    both mouths moving) while the mediator raises both open hands.
 * Under each table a speaking-interval chart grows with a playhead: the
 * bars follow one another in A and overlap in B.
 *  0.00–0.17  base: identical rest state in both scenes.
 *  0.17–0.40  change: the localized difference starts (token to the first
 *             speaker in A; both start talking in B); the changed fact is named.
 *  0.40–0.77  parallel: both scenes run on the same clock.
 *  0.77–1.00  guide: the two charts are linked by a comparison guide on the
 *             changed timing; a neutral note states no winner or outcome.
 * @module animations/roles/LAW-0187
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, connector, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, scenarioHeader} from '../../frameworks/paired.js';
import {wchip, fitWords} from './kits/mediation-labels.js';
import {mediationRolesFields, MEDIATION_DEFAULTS, speakingOrder, roleOf} from './kits/mediation-fields.js';
import {mediationStage, turnScript, TURN_WINDOWS} from './kits/mediation-table.js';

const ID = 'LAW-0187';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
/** Action clock: c = 0 at u = 0.17, c = C_MAX at u = 0.77. */
const U0 = 0.17, U1 = 0.77, C_MAX = 1.12;
const W = {changeChip: [0.2, 0.27], guide: [0.79, 0.9], note: [0.87, 0.94]};

const sceneSchema = {
  ...mediationRolesFields,
  ...contrastFields(),
};

const defaultParams = {
  ...MEDIATION_DEFAULTS,
  scenarioA: {label: 'Ordered turns', caption: 'The token passes from one speaker to the other'},
  scenarioB: {label: 'Simultaneous interventions', caption: 'Both parties speak at the same time'},
  changedFact: 'Only the timing of the interventions differs',
  sharedFacts: ['Same people', 'Same table and agenda', 'Same mediator'],
  comparisonLabels: {guide: 'Changed fact: when each party speaks', neutral: 'Two situations shown side by side — no outcome is stated'},
};

/** Stage per arrangement: wide tables side by side / stacked; narrow tables side by side on squares. */
const STAGES = {
  wide: {W: 1150, H: 700, cx: 575, sy: 450, sep: 370, z: 1, bubbles: 'side', bubbleH: 150},
  narrow: {W: 900, H: 900, cx: 450, sy: 620, sep: 262, z: 1.1, bubbles: 'top', crowd: 'narrow'},
};
/**
 * Arrangement per shape. header/chartH/gap/footer are design units; the
 * column (portrait) arrangement keeps a gutter on the right where the closing
 * guide runs, outside both scenes.
 */
const ARRANGE = {
  landscape: {stage: 'wide', arrangement: 'row', header: 124, chartH: 205, gap: 64, footer: 175},
  square: {stage: 'narrow', arrangement: 'row', header: 132, chartH: 215, gap: 70, footer: 190},
  portrait: {stage: 'wide', arrangement: 'column', header: 118, chartH: 200, gap: 34, footer: 175, gutter: 64},
};

const scene = {
  sizes: {landscape: [2380, 1290], square: [1870, 1500], portrait: [1150, 2440]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const A = ARRANGE[ctx.view.shape];
    const {stage: stageKey, arrangement} = A;
    const cfg = STAGES[stageKey];
    const header = A.header;
    const CHART_H = A.chartH;
    const gutter = A.gutter || 0;
    const geo = pairedGeometry(ctx, {stage: {w: cfg.W, h: cfg.H + CHART_H}, arrangement, header, gap: A.gap});
    const bw = geo.w + gutter;
    const order = speakingOrder(p.relationships);
    const captions = {a: roleOf(p, 'a'), b: roleOf(p, 'b'), mediator: roleOf(p, 'mediator')};
    const stages = ['a', 'b'].map(k => mediationStage(ctx, {prefix: `s${k}`, cfg, actors: p.actors, captions, props: p.props, order, chips: false}));
    const scripts = [turnScript(stages[0], 'second'), turnScript(stages[1], 'simultaneous')];
    const colors = [th.accent2, th.accent];
    const headers = geo.panels.map((pn, i) => scenarioHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x, y: pn.headerY + 8, w: pn.w, h: header - 16, color: colors[i],
    }));
    // speaking-interval charts (one per scene, identical axes)
    const [F, S] = order;
    const TW = TURN_WINDOWS;
    const intervals = [
      {[F]: [TW.fMouth], [S]: [TW.sMouth]},
      {[F]: [TW.sim.mouth], [S]: [TW.sim.mouth]},
    ];
    const charts = geo.panels.map((pn, i) => intervalChart(ctx, {
      prefix: `ch${i}`, x: pn.x + 30, y: pn.y + cfg.H + 16, w: pn.w - 60, h: CHART_H - 40,
      rows: ['a', 'b'].map(id => ({id, color: stages[i].looks[id === 'a' ? 0 : 1].outfit, role: roleOf(p, id), name: p.actors[id === 'a' ? 0 : 1].name})),
      intervals: intervals[i], cMax: C_MAX + 0.05,
    }));
    // Footer: line 1 = changed fact / shared facts / comparison guide chip
    // (shown one at a time, up to two balanced lines each), line 2 = neutral
    // note. The guide chip is tied to the part of each chart that differs by
    // two plain leaders (relation style: no arrow, no causation).
    const footY = geo.h + 24;
    const cxF = geo.w / 2;
    const line1 = (text, o2) => wchip(ctx, text, {x: cxF, y: footY, anchor: 'middle', maxLines: 2, ...o2});
    const guideChip = ctx.show('key') ? line1(p.comparisonLabels.guide, {maxWidth: geo.w * 0.7, size: 40, minSize: 30, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null;
    const changeChip = ctx.show('key') ? line1(p.changedFact, {maxWidth: geo.w * 0.92, size: 42, minSize: 30, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? line1(`${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {maxWidth: geo.w * 0.95, size: 38, minSize: 28, fill: th.card, weight: 500, name: 'shared-note'}) : null;
    // without labels the two leaders meet at one point, still joining the charts
    const gcBox = guideChip ? guideChip.box : {x: cxF - 30, y: footY, w: 60, h: 60, cx: cxF, cy: footY + 30};
    // line 2: below the guide chip; the block grows when the footer needs it
    let neutral = null;
    let footBottom = Math.max(gcBox.y + gcBox.h, changeChip ? changeChip.box.y + changeChip.box.h : 0, shared ? shared.box.y + shared.box.h : 0);
    if (ctx.show('all')) {
      neutral = wchip(ctx, p.comparisonLabels.neutral, {x: cxF, y: gcBox.y + gcBox.h + 12, anchor: 'middle', maxWidth: geo.w * 0.95, size: 38, minSize: 28, maxLines: 2, fill: th.card, weight: 500, name: 'neutral-note'});
      footBottom = Math.max(footBottom, neutral.box.y + neutral.box.h);
    }
    const bh = Math.max(geo.h + A.footer, footBottom + 6);
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const gA = charts[0].focusBox, gB = charts[1].focusBox;
    let guides;
    if (arrangement === 'row') {
      guides = [
        connector(ctx, {name: 'guideA', from: {x: gA.x + gA.w / 2, y: gA.y + gA.h + 6}, to: {x: gcBox.x + 30, y: gcBox.cy}, kind: 'relation', color: th.accent,
          c1: {x: gA.x + gA.w / 2, y: gcBox.cy}, c2: {x: gA.x + gA.w / 2 + 40, y: gcBox.cy}}),
        connector(ctx, {name: 'guideB', from: {x: gB.x + gB.w / 2, y: gB.y + gB.h + 6}, to: {x: gcBox.x + gcBox.w - 30, y: gcBox.cy}, kind: 'relation', color: th.accent,
          c1: {x: gB.x + gB.w / 2, y: gcBox.cy}, c2: {x: gB.x + gB.w / 2 - 40, y: gcBox.cy}}),
      ];
    } else {
      // stacked: A's guide leaves the chart to the right, runs down the gutter
      // (outside scene B) and enters the chip from the right; B's drops straight down
      const gx = geo.w + gutter * 0.45;
      const endA = guideChip ? {x: gcBox.x + gcBox.w + 4, y: gcBox.cy} : {x: gB.x + gB.w / 2 + 4, y: gcBox.cy};
      guides = [
        elbowGuide(ctx, {name: 'guideA', pts: [{x: gA.x + gA.w + 6, y: gA.y + gA.h / 2}, {x: gx, y: gA.y + gA.h / 2}, {x: gx, y: endA.y}, endA], radius: 28, color: th.accent}),
        connector(ctx, {name: 'guideB', from: {x: gB.x + gB.w / 2, y: gB.y + gB.h + 6}, to: {x: gB.x + gB.w / 2, y: gcBox.y - 4}, kind: 'relation', color: th.accent, bend: 0}),
      ];
    }
    return {geo, stages, scripts, headers, charts, guides, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      L.charts.map(c => c.node),
      L.guides.map(x => x.node),
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u, timeMs) {
    const c = Math.max(0, Math.min(C_MAX, ((u - U0) / (U1 - U0)) * C_MAX));
    const posed = L.scripts.map((sc, i) => L.stages[i].pose(sc(c, timeMs, ctx.reduced)));
    const nodes = {...posed[0].nodes, ...posed[1].nodes};
    // charts grow with the shared clock; the playhead runs during the action
    L.charts.forEach(ch => Object.assign(nodes, ch.frame(c, u >= U0 && u < W.guide[0] + 0.02)));
    const gp = seg(u, ...W.guide);
    L.guides.forEach(x => Object.assign(nodes, x.frame(ease.inOutCubic(gp), gp > 0 ? 1 : 0)));
    L.charts.forEach(ch => { nodes[`${ch.prefix}-focus`] = {opacity: r(clamp(gp * 3), 3)}; });
    // footer line 1 shows one item at a time: changed fact → shared facts → guide chip
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.35) * 3), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.5) / 0.04)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.55) / 0.04) * (1 - clamp((u - 0.76) / 0.03)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const sem = i => {
      const q = posed[i].semantic;
      return {tokenAt: q.tokenAt, speakingA: q.speakingA, speakingB: q.speakingB, bubbleA: q.bubbleA, bubbleB: q.bubbleB, ticks: q.ticks, both: q.speakingA && q.speakingB};
    };
    return {
      nodes,
      semantic: {
        beat,
        clock: r(c, 3),
        a: sem(0),
        b: sem(1),
        tokenA: posed[0].semantic.token,
        tokenB: posed[1].semantic.token,
        medLA: posed[0].semantic.medL,
        medRA: posed[0].semantic.medR,
        medLB: posed[1].semantic.medL,
        medRB: posed[1].semantic.medR,
        handAA: posed[0].semantic.handA,
        handBB: posed[1].semantic.handB,
        gripLA: posed[0].semantic.gripL,
        gripRA: posed[0].semantic.gripR,
        tokenHoldA: posed[0].semantic.tokenHold,
        charts: L.charts.map(ch => ch.state(c)),
        reach: {a: posed[0].semantic.allReached, b: posed[1].semantic.allReached},
        allReached: posed[0].semantic.allReached && posed[1].semantic.allReached,
        guideProgress: r(gp, 3),
        arrangement: L.arrangement,
      },
    };
  },
};

/**
 * Orthogonal guide with rounded corners (plain relation style: no arrow), drawn
 * on like `connector`: same frame protocol `frame(p, opacity)`.
 */
function elbowGuide(ctx, o) {
  const P = o.pts;
  let d = `M${r(P[0].x)} ${r(P[0].y)}`;
  let total = 0;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    if (!c) { d += `L${r(b.x)} ${r(b.y)}`; total += Math.hypot(b.x - a.x, b.y - a.y); break; }
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(o.radius, l1 / 2, l2 / 2);
    const p1 = {x: b.x - ((b.x - a.x) / l1) * rr, y: b.y - ((b.y - a.y) / l1) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / l2) * rr, y: b.y + ((c.y - b.y) / l2) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    total += Math.hypot(p1.x - a.x, p1.y - a.y) + rr * 1.6;
    P[i] = p2;
  }
  const end = P[P.length - 1];
  const node = g({name: o.name},
    h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${o.name}-dotA`, cx: r(o.pts[0].x), cy: r(o.pts[0].y), r: 4.8, fill: o.color, opacity: 0}),
    h('circle', {name: `${o.name}-dotB`, cx: r(end.x), cy: r(end.y), r: 4.8, fill: o.color, opacity: 0}),
  );
  const frame = (p, opacity = 1) => ({
    [o.name]: {opacity},
    [`${o.name}-line`]: {'stroke-dashoffset': r(total * (1 - p))},
    [`${o.name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame};
}

/**
 * Speaking-interval chart: one lane per party, bars grow up to the current
 * clock, a playhead marks "now". `focusBox` frames the part that differs.
 */
function intervalChart(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const labelW = Math.min(o.w * 0.36, 340);
  const laneX = o.x + labelW + 20;
  const laneW = o.x + o.w - laneX - 20;
  const laneH = (o.h - 30) / 2;
  const xOf = c => laneX + (c / o.cMax) * laneW;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 16), fill: th.card, stroke: th.ink, 'stroke-width': 2, opacity: 0.92}));
  const bars = [];
  o.rows.forEach((row, i) => {
    const y = o.y + 12 + i * laneH;
    const cy = y + laneH / 2;
    parts.push(h('circle', {cx: o.x + 32, cy, r: laneH * 0.3, fill: row.color, stroke: th.ink, 'stroke-width': 2}));
    if (ctx.show('key')) parts.push(h('text', {x: o.x + 32, y: cy + laneH * 0.12, 'text-anchor': 'middle', 'font-size': r(laneH * 0.34), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, row.id.toUpperCase()));
    else parts.push(h('circle', {cx: o.x + 32, cy, r: laneH * 0.1, fill: '#fff'}));
    if (ctx.show('all')) {
      // role · name when it fits in two lines, else the name alone (the lane's
      // letter disc and colour still identify the party)
      const fo = {maxWidth: labelW - 46 - laneH * 0.3, size: Math.min(30, laneH * 0.36), minSize: 19, maxLines: 2, weight: 600};
      let f = fitWords(row.role ? `${row.role} · ${row.name}` : row.name, fo);
      if (f.truncated && row.role) f = fitWords(row.name, fo);
      if (f.truncated) f = fitWords(row.name, {...fo, minSize: 15});
      parts.push(textBlock(f, {x: o.x + 32 + laneH * 0.3 + 14, y: cy - f.height / 2, fill: th.ink}));
    }
    parts.push(h('rect', {x: laneX, y: cy - laneH * 0.3, width: laneW, height: laneH * 0.6, rx: laneH * 0.3, fill: th.paperShade}));
    (o.intervals[row.id] || []).forEach((iv, k) => {
      const name = `${P}-bar${i}-${k}`;
      bars.push({name, iv, y: cy - laneH * 0.26, hh: laneH * 0.52});
      parts.push(h('rect', {name, x: xOf(iv[0]), y: cy - laneH * 0.26, width: 0, height: laneH * 0.52, rx: laneH * 0.2, fill: row.color, stroke: th.ink, 'stroke-width': 2}));
    });
  });
  // time axis (arrow only, no numbers: relative time)
  const axY = o.y + o.h - 14;
  parts.push(h('path', {d: `M${r(laneX)} ${r(axY)}H${r(laneX + laneW)}m-12 -7l12 7l-12 7`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  const play = h('line', {name: `${P}-play`, x1: laneX, x2: laneX, y1: o.y + 8, y2: axY, stroke: th.ink, 'stroke-width': 3, 'stroke-dasharray': '6 5', opacity: 0});
  // part that differs between the scenes: the stretch where turns follow / overlap
  const all = Object.values(o.intervals).flat();
  const fx0 = xOf(Math.min(...all.map(iv => iv[0]))) - 12;
  const fx1 = xOf(Math.max(...all.map(iv => iv[1]))) + 12;
  const focusBox = {x: fx0, y: o.y + 4, w: fx1 - fx0, h: o.h - 26};
  const focus = h('path', {name: `${P}-focus`, d: roundRectPath(focusBox.x, focusBox.y, focusBox.w, focusBox.h, 14), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '12 8', opacity: 0});
  const node = g({name: P}, parts, play, focus);
  const widthAt = (iv, c) => Math.max(0, xOf(Math.min(c, iv[1])) - xOf(iv[0]));
  return {
    node, prefix: P, focusBox,
    frame(c, playOn) {
      const out = {};
      for (const b of bars) out[b.name] = {width: r(widthAt(b.iv, c))};
      out[`${P}-play`] = {x1: r(xOf(c)), x2: r(xOf(c)), opacity: playOn ? 1 : 0};
      return out;
    },
    /** serializable state: visible bar spans per row (clock units) */
    state(c) {
      const spans = {};
      for (const row of o.rows) spans[row.id] = (o.intervals[row.id] || []).filter(iv => c > iv[0]).map(iv => [iv[0], r(Math.min(c, iv[1]), 3)]);
      const a = spans.a || [], b = spans.b || [];
      let overlap = 0;
      for (const x of a) for (const y of b) overlap += Math.max(0, Math.min(x[1], y[1]) - Math.max(x[0], y[0]));
      return {spans, overlap: r(overlap, 3)};
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-07-contrast',
    title: 'Mediation between parties — ordered turns vs simultaneous interventions',
    titleEs: 'Mediación entre partes — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Mediación entre partes',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical mediation tables run on one clock. In A the mediator passes the turn token and the speech bubbles alternate; in B both parties speak at once while the mediator raises both open hands. Speaking-interval charts under each table show sequence versus overlap; a closing guide links them without naming a winner or outcome.',
    tags: ['mediation', 'comparison', 'turn-taking', 'simultaneous speech', 'timeline', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/mediation-table.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-fields.js', 'src/frameworks/paired.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
