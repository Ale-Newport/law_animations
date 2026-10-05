/**
 * LAW-0055 — Tratamiento de un caso · contrast
 *
 * Storyboard (two complete, identical case-treatment scenes; side by side on
 * wide frames, stacked on tall frames):
 *  0.00–0.17  base: both scenes show the same library (same binders, same
 *             supplied tags), the same empty search bar and the same decision
 *             pinned on its treatment card.
 *  0.17–0.40  the single changed fact is introduced in B only, as a local
 *             visible change on one binder:
 *               - "no-label": B's supplied tag for one resolution is untied and
 *                 lifts away, leaving a dashed outline (no label supplied);
 *               - "extra-source": B's library gets one more resolution with a
 *                 supplied tag (A's copy of that binder has none).
 *             Both queries are then typed identically.
 *  0.40–0.77  the action runs in parallel with the same timing: the
 *             magnifiers visit the same shelf positions; found binders fly,
 *             turn and are pinned; tagged resolutions are linked. Only the
 *             contrasted resolution behaves differently (placed but not
 *             linked, or not found at all).
 *  0.77–1.00  a comparison guide rings the changed detail in both scenes and
 *             joins them; the footer states the changed fact, then the shared
 *             facts, then a neutral note. No winner, score or legal
 *             consequence is shown.
 * @module animations/research/LAW-0055
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {contrastFields, int, obj, oneOf} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, scenarioHeader, neutralNote} from '../../frameworks/paired.js';
import {caseStage, caseFields, caseObjectLabels, caseSource, CASE_DEFAULTS, CASE_STAGE, magValue} from './kits/tratamiento-de-un-caso.js';
import {roundRectPath} from '../../core/geometry.js';

const ID = 'LAW-0055';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {change: [0.19, 0.3], changeChip: [0.2, 0.28], type: [0.31, 0.37], magOut: 0.37, visit0: 0.41, dwell: 0.016, back: 0.06,
  pull: [0.006, 0.026], fly: 0.085, pin: 0.015, thread: 0.06, guide: [0.78, 0.9], note: [0.86, 0.94]};

const sceneSchema = {
  ...caseFields,
  objectLabels: caseObjectLabels,
  ...contrastFields(),
  alternative: obj('The single fact changed in scenario B', {
    kind: oneOf('"no-label": one resolution has no supplied label in B, so it is placed but not linked; "extra-source": B has one more resolution with a supplied label', ['no-label', 'extra-source']),
    index: int('For "no-label": zero-based index of the resolution whose label is not supplied in B', 0, 3),
    extra: caseSource,
  }, ['kind']),
};

const defaultParams = {
  ...CASE_DEFAULTS,
  scenarioA: {label: 'Distinct treatments, no ranking', caption: 'Each resolution hangs its own label'},
  scenarioB: {label: 'Alternative scenario', caption: 'No label is supplied for R-33'},
  changedFact: 'Only R-33’s label differs: supplied in A, not supplied in B',
  sharedFacts: ['Same query', 'Same library', 'Same decision D-104'],
  comparisonLabels: {guide: 'Changed detail: R-33’s label', neutral: 'Two situations side by side — no ranking and no outcome is stated'},
  alternative: {kind: 'no-label', index: 1, extra: {citation: 'R-58', date: 'Year 6', label: 'Mentions'}},
};

/** Panel geometry and arrangement per available shape. */
const ARRANGE = {
  // gapX: x of the bookcase/card gutter the comparison guide rises in (panelWide);
  // the square panels (library above the card) drop the guide from under the rings
  landscape: {geo: 'panelWide', arrangement: 'row', gapX: 248, capSize: 34},
  square: {geo: 'panelTall', arrangement: 'row', gapX: null, capSize: 36},
  portrait: {geo: 'panelWide', arrangement: 'column', gapX: 248, capSize: 34},
};

/** Union of resolutions and per-scenario flags. */
function scenarios(p) {
  const base = p.sources.map(s => ({...s}));
  const alt = p.alternative;
  if (alt.kind === 'extra-source' && alt.extra) {
    const union = [...base, {...alt.extra}];
    const k = union.length - 1;
    const on = union.map((s, i) => i < k);
    return {union, k, a: {found: on, linked: on.map((v, i) => v && Boolean(union[i].label))}, b: {found: union.map(() => true), linked: union.map(s => Boolean(s.label))}};
  }
  const k = Math.min(alt.index ?? 0, base.length - 1);
  const all = base.map(() => true);
  return {union: base, k, a: {found: all, linked: base.map(s => Boolean(s.label))}, b: {found: all, linked: base.map((s, i) => Boolean(s.label) && i !== k)}};
}

const scene = {
  sizes: {landscape: [2460, 1250], square: [1580, 1370], portrait: [1200, 2310]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {geo: geoName, arrangement, gapX, capSize} = ARRANGE[ctx.view.shape];
    const st = CASE_STAGE[geoName];
    const row = arrangement === 'row';
    // scenario captions keep one line when they fit, else they wrap to two
    // lines (the header strip grows) instead of being cut
    const panelW = st.w - (row ? 0 : gapX + 36);
    const capFit = cap => ctx.fit(cap || '', {maxWidth: panelW - 43.2 * 1.56 - 24, size: capSize, minSize: capSize * 0.85, maxLines: 1, weight: 500});
    const twoLines = ctx.show('all') && [p.scenarioA.caption, p.scenarioB.caption].some(c => c && capFit(c).truncated);
    const header = twoLines ? 120 + Math.round(capSize * 1.1) : 120;
    const footer = row ? 200 : 120;
    const pg = pairedGeometry(ctx, {stage: st, arrangement, header, gap: row ? 60 : 120});
    const bw = pg.w;
    const sc = scenarios(p);
    const n = sc.union.length;
    const k = sc.k;
    // the contrasted resolution is visited first in both scenes, so where the
    // library stands above the card it takes the bottom slot (a guide can then
    // leave its ring straight down through open space)
    const visitOrder = [k, ...sc.union.map((_, i) => i).filter(i => i !== k)];
    const stages = ['a', 'b'].map(key => caseStage(ctx, {
      prefix: `s${key}`, axis: geoName, query: p.query, decision: p.decision, sources: sc.union,
      objectLabels: p.objectLabels, seedKey: 'case-pair', visit: visitOrder,
    }));
    const colors = [th.inkSoft, th.accent2];
    // Headers start right of the library/card gutter so the column guide never crosses their text.
    const hx = row ? 0 : gapX + 36;
    // Scenario captions are drawn here (not by scenarioHeader) so that B's
    // specific caption can appear only when the change beat introduces it.
    const headers = [];
    const captions = [];
    pg.panels.forEach((pn, i) => {
      const scen = i ? p.scenarioB : p.scenarioA;
      const o = {x: pn.x + hx, y: pn.headerY + 6, w: pn.w - hx, h: 108};
      headers.push(scenarioHeader(ctx, {name: `head-${i}`, letter: i ? 'B' : 'A', label: scen.label, x: o.x, y: o.y, w: o.w, h: o.h, color: colors[i]}));
      if (scen.caption && ctx.show('all')) {
        const size = Math.min(54, o.h * 0.4);
        const badgeR = size * 0.78;
        const f = ctx.fit(scen.caption, {maxWidth: o.w - badgeR * 2 - 24, size: capSize, minSize: capSize * 0.85, maxLines: twoLines ? 2 : 1, weight: 500, leading: 1.1});
        captions.push(textBlock(f, {x: o.x + badgeR * 2 + 18, y: o.y + o.h * 0.42 + size * 0.72, fill: th.fgSoft, name: `head-cap-${i}`}));
      }
    });

    // Changed detail: the contrasted resolution's cover + label region in both scenes.
    const ring = pg.panels.map((pn, i) => {
      const b = stages[i].points.link(k);
      return {x: pn.x + b.x - 14, y: pn.y + b.y - 14, w: b.w + 28, h: b.h + 28};
    });
    // Guide path through open space only: out of each ring into the gutter
    // between bookcase and card, down that gutter and below the panels (row) or
    // across the gap between the scenes (column); for square panels it drops
    // straight from under each ring (the bottom slot) below the panels.
    let d, chipPos;
    const A = ring[0], B = ring[1];
    const ay = A.y + A.h / 2, by = B.y + B.h / 2;
    const yb = pg.h + 34;
    if (row && gapX === null) {
      const card = stages[0].card;
      const hanger = card.x + card.w / 2;
      const stem = rg => { let x = rg.x + rg.w * 0.4; if (Math.abs(x - hanger) < 34) x = hanger - 34; return x; };
      const xa = stem(A), xb = stem(B);
      d = `M${r(xa)} ${r(A.y + A.h)}V${r(yb)}H${r(xb)}V${r(B.y + B.h)}`;
      chipPos = {x: (xa + xb) / 2, y: yb + 14, anchor: 'middle', maxWidth: Math.min(bw * 0.7, 900)};
    } else if (row) {
      const xa = pg.panels[0].x + gapX, xb = pg.panels[1].x + gapX;
      d = `M${r(A.x)} ${r(ay)}H${r(xa)}V${r(yb)}H${r(xb)}V${r(by)}H${r(B.x)}`;
      chipPos = {x: (xa + xb) / 2, y: yb + 14, anchor: 'middle', maxWidth: Math.min(bw * 0.6, 900)};
    } else {
      const x = gapX;
      d = `M${r(A.x)} ${r(ay)}H${r(x)}V${r(by)}H${r(B.x)}`;
      chipPos = {x: x + 36, y: pg.panels[0].y + st.h + 14, anchor: 'start', maxWidth: bw - x - 60};
    }
    const guideChip = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {...chipPos, size: 36, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null;
    const footY = row ? (guideChip ? guideChip.box.y + guideChip.box.h + 18 : pg.h + 90) : pg.h + 26;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.94, size: 38, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.94, size: 36, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.94, size: 36, name: 'neutral-note'}) : null;
    // Block height follows the actual footer content (long notes wrap to two lines).
    const footH = Math.max(0, ...[changeChip, shared, neutral].filter(Boolean).map(c => c.box.h));
    const bh = Math.max(pg.h + footer, footY + footH + 16);
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    // Local marker of the change on B's binder (shown during the change beat).
    const bb = stages[1].binders[k];
    const mark = {x: pg.panels[1].x + bb.x - bb.w / 2 - 18, y: pg.panels[1].y + bb.y - bb.h / 2 - 18, w: bb.w + 36, h: bb.h + 36};
    return {pg, stages, headers, captions, ring, d, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, sc, n, k, bw, bh, mark, visitOrder};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ringNode = (i, dashed) => h('path', {name: `ring-${i}`, d: roundRectPath(L.ring[i].x, L.ring[i].y, L.ring[i].w, L.ring[i].h, 22), fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': dashed ? '14 10' : null, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.captions,
      L.pg.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      h('path', {name: 'guide', d: L.d, fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1000, 'stroke-dasharray': '1000 1010', 'stroke-dashoffset': 1000, opacity: 0}),
      ringNode(0, false), ringNode(1, true),
      h('path', {name: 'change-mark', d: roundRectPath(L.mark.x, L.mark.y, L.mark.w, L.mark.h, 16), fill: 'none', stroke: th.accent, 'stroke-width': 6, opacity: 0}),
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const n = L.n;
    const gap = n >= 5 ? 0.042 : 0.05;
    // visit times by visit order (the contrasted resolution is visited first)
    const tVisit = [];
    L.visitOrder.forEach((i, j) => { tVisit[i] = W.visit0 + j * gap; });
    const visits = L.visitOrder.map(i => tVisit[i]);
    const change = ease.inOutSine(seg(u, ...W.change));
    const p = ctx.params;
    const k = L.k;
    const kind = p.alternative.kind;
    // B's contrasted binder is pulled forward while its change happens, then put back
    const pop = ctx.reduced ? 0 : seg(u, 0.17, 0.2) * (1 - seg(u, 0.33, 0.37));
    const values = flags => {
      const v = {type: seg(u, ...W.type), mag: magValue(u, {out: W.magOut, visits, dwell: W.dwell, back: W.back}), found: [], pull: [], fly: [], pin: [], thread: [], tagVis: [], ghost: [], present: [], pop: [], tagAway: flags.tagAway};
      for (let i = 0; i < n; i++) {
        const t0 = tVisit[i];
        const flyA = t0 + W.pull[1], pinA = flyA + W.fly, thA = pinA + W.pin;
        const f = flags.found[i];
        v.found.push(f ? seg(u, t0 - 0.004, t0 + 0.01) : 0);
        v.pull.push(f ? seg(u, t0 + W.pull[0], t0 + W.pull[1]) : 0);
        v.fly.push(f ? seg(u, flyA, pinA) : 0);
        v.pin.push(f ? seg(u, pinA, thA) : 0);
        v.thread.push(f && flags.linked[i] ? seg(u, thA, thA + W.thread) : 0);
        v.tagVis.push(flags.tagVis(i));
        v.ghost.push(flags.ghost(i));
        v.present.push(flags.present(i));
        v.pop.push(flags.pop(i));
      }
      return v;
    };
    // extra-source: A's library never holds the extra resolution (its shelf gap
    // stays empty); in B it is put onto that shelf during the change beat
    const aFlags = {...L.sc.a, tagVis: () => 1, ghost: () => 0, pop: () => 0,
      present: i => (kind === 'extra-source' && i === k ? 0 : 1)};
    const bFlags = {...L.sc.b, tagAway: true,
      tagVis: i => (i !== k || kind !== 'no-label' ? 1 : 1 - change),
      ghost: i => (kind === 'no-label' && i === k ? change : 0),
      present: i => (kind === 'extra-source' && i === k ? change : 1),
      pop: i => (kind === 'no-label' && i === k ? pop : 0)};
    const a = L.stages[0].pose(values(aFlags));
    const b = L.stages[1].pose(values(bFlags));
    const nodes = {...a.nodes, ...b.nodes};
    // the change is marked on B's binder while it happens, then released
    const markP = seg(u, 0.18, 0.21) * (1 - seg(u, 0.36, 0.4));
    const pulse = ctx.reduced ? 0 : Math.sin(seg(u, 0.18, 0.36) * Math.PI * 3) * 0.04;
    const mc = {x: L.mark.x + L.mark.w / 2, y: L.mark.y + L.mark.h / 2};
    const grow = kind === 'no-label' ? 1 + 0.55 * ease.inOutSine(pop) : 1;
    nodes['change-mark'] = {opacity: r(markP, 3), transform: `translate(${r(mc.x)} ${r(mc.y - 14 * (grow - 1) / 0.55)}) scale(${r((1 + pulse) * grow, 4)}) translate(${r(-mc.x)} ${r(-mc.y)})`};
    // B's own caption states the changed fact: it appears with the change beat
    if (L.captions.length > 1) nodes['head-cap-1'] = {opacity: r(change, 3)};
    const gp = seg(u, ...W.guide);
    nodes.guide = {opacity: gp > 0 ? 1 : 0, 'stroke-dashoffset': r(1000 * (1 - ease.inOutSine(gp)))};
    nodes['ring-0'] = {opacity: r(clamp(gp * 4), 3)};
    nodes['ring-1'] = {opacity: r(clamp(gp * 4), 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.5) / 0.05)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.55) / 0.05) * (1 - noteP), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = (sem, key) => {
      const out = {mag: sem.mag};
      for (let i = 0; i < n; i++) {
        out[`res${i}`] = sem[`res${i}`];
        if (sem[`tag${i}`]) {
          out[`tag${i}`] = sem[`tag${i}`];
          out[`tagVis${i}`] = sem[`tagVis${i}`];
        }
      }
      return Object.fromEntries(Object.entries(out).map(([kk, v]) => [`${key}${kk[0].toUpperCase()}${kk.slice(1)}`, v]));
    };
    return {
      nodes,
      semantic: {
        beat,
        a: {states: a.semantic.states, linked: a.semantic.linked, threadP: a.semantic.threadP, typed: a.semantic.queryTyped},
        b: {states: b.semantic.states, linked: b.semantic.linked, threadP: b.semantic.threadP, typed: b.semantic.queryTyped},
        changedIndex: k,
        changeKind: kind,
        changeMarked: markP > 0.5,
        // actual opacity of B's contrasted tag and progress of the change beat
        tagVisB: b.semantic[`tagVis${k}`] ?? 0,
        bChange: r(change, 3),
        bCaption: r(L.captions.length > 1 ? change : 1, 3),
        bPop: r(pop, 3),
        ...pick(a.semantic, 'a'),
        ...pick(b.semantic, 'b'),
        guideProgress: r(gp, 3),
        arrangement: L.arrangement,
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
    slug: 'research-04-contrast',
    title: 'Case treatment — supplied labels vs an alternative scenario',
    titleEs: 'Tratamiento de un caso — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Tratamiento de un caso',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical library-search-card scenes run in parallel. Scenario A links every resolution by its supplied label with equal weight; in B exactly one fact differs (a label not supplied, or one more resolution supplied), which changes that resolution’s path and link. A guide rings the changed detail in both; no ranking or outcome is stated.',
    tags: ['case treatment', 'comparison', 'labels', 'library', 'search', 'side-by-side', 'stacked', 'no hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/tratamiento-de-un-caso.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
