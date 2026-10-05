/**
 * LAW-0140 — Ámbito material · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] build: the state produced by the filter fills the frame — the
 *              stand with the fictional texts, the article in the holder, the
 *              keyed plates, every activity card in its bin and the card whose
 *              tag matches no key in the side bin.
 *  [0.20–0.45] isolate: the whole wall shrinks into a framed context
 *              miniature (its caption says what it shows) and dims, except for
 *              the focus card, which a frame marks. A detail window grows out
 *              of that card: a real enlarged copy of the whole card (tag chip
 *              and name), drawn in the same coordinates, joined to its source
 *              in the miniature by two sight lines. The single editorial note
 *              shows the datum as supplied ("Subject tag: Culture").
 *  [0.45–0.75] substitute: in the detail window the old tag lifts out and the
 *              alternative datum is clipped on (only that tag changes); in the
 *              note the old value stays, struck through, above the new one.
 *  [0.75–1.00] return: the miniature grows back and un-dims; in the context
 *              the tag now reads the new datum and only that card is re-sorted
 *              by the filter's keys (its dependent place). A card already in
 *              that bin is lifted so both stay readable (fanned). The dependent
 *              state tags update, the note gains its "datum changed" title and a
 *              marker badge stays on the re-sorted card; the detail window keeps
 *              following the card. Seeking back restores the previous datum and
 *              place exactly.
 * @module animations/sources/LAW-0140
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {sourcesFields, activitiesField, CONTENT_EN, KIT_STRINGS, kitStrings, resolveScope, sorterStage, STAGE, fitWords, NEUTRAL} from './kits/ambito-material.js';

const ID = 'LAW-0140';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  shrink: [0.2, 0.32], greek: [0.21, 0.28], open: [0.24, 0.37], caption: [0.37, 0.42], before: [0.36, 0.42], strike: [0.47, 0.53], change: [0.5, 0.66], after: [0.62, 0.7],
  grow: [0.75, 0.83], undim: [0.75, 0.81], ctxUpdate: [0.8, 0.84], move: [0.84, 0.93], lift: [0.84, 0.9], state: [0.9, 0.94], marker: [0.92, 0.97], coneOut: [0.93, 0.97],
};
// text width inside a card's tag chip: the chip's text slot is 101 wide (card 190 − 52 − 37); 90 leaves real padding
const TAG_TEXT_W = 90;
const TARGETS = ['activity-1', 'activity-2', 'activity-3', 'activity-4', 'activity-5'];

const STRINGS = {
  en: {tag: 'Subject tag', context: 'Context', changed: 'Datum changed', after: 'Activities after the subject filter', asSupplied: 'as supplied'},
  es: {tag: 'Etiqueta de materia', context: 'Contexto', changed: 'Dato cambiado', after: 'Actividades tras el filtro de materias', asSupplied: 'según lo aportado'},
};

const sceneSchema = {
  ...sourcesFields,
  activities: activitiesField,
  ...inspectFields(TARGETS),
};
sceneSchema.focusTarget.description = 'Activity card whose subject tag is enlarged and substituted (activity-1 = first card)';
sceneSchema.beforeValue.description = 'Subject tag shown on that card before the substitution (it replaces the tag of that activity)';
sceneSchema.afterValue.description = 'Alternative subject tag supplied after the substitution (compared verbatim with the listed subjects)';
sceneSchema.detailGeometry.properties.zoom.description = 'Magnification of the detail window relative to the card in the full-size context (reduced only if the window would not fit)';

// the collection after the filter: one card per bin, so the re-sorted card lands in a bin of its own and
// no name is covered at the hold (with supplied data that fills the bin, a resident is fanned: see pose)
const defaultParams = {
  ...CONTENT_EN,
  activities: [
    {label: 'Roof repair', subject: 'Housing'},
    {label: 'Street concert', subject: 'Culture'},
    {label: 'Seed exchange', subject: 'Farming'},
  ],
  focusTarget: 'activity-2',
  beforeValue: 'Culture',
  afterValue: 'Transport',
  detailGeometry: {zoom: 3.8, placement: 'auto'},
  contextLabels: {context: 'Activities after the subject filter', marker: 'Datum changed'},
};

/**
 * Composition per shape (design units = the sorter stage size):
 *  C1 / C2  the context miniature during the inspection / at the return (top-left, scale k)
 *  I1 / I2  the box the detail window is centred in (the window keeps the card's aspect)
 *  note     the single editorial note (before → after, then the "changed" title)
 */
const COMPOSE = {
  landscape: {C1: {x: 16, y: 16, k: 0.5}, C2: {x: 16, y: 16, k: 0.56}, I1: {x: 960, y: 24, w: 864, h: 752}, I2: {x: 1076, y: 24, w: 748, h: 752}, note: {x: 16, y: 520, w: 900}},
  portrait: {C1: {x: 16, y: 16, k: 0.52}, C2: {x: 16, y: 16, k: 0.64}, I1: {x: 16, y: 810, w: 968, h: 604}, I2: {x: 16, y: 980, w: 968, h: 434}, note: {x: 672, y: 60, w: 312}},
  square: {C1: {x: 16, y: 16, k: 0.48}, C2: {x: 16, y: 16, k: 0.55}, I1: {x: 16, y: 500, w: 1128, h: 410}, I2: {x: 16, y: 566, w: 1128, h: 344}, note: {x: 680, y: 40, w: 464}},
};

const mixC = (a, b, e) => ({x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), k: lerp(a.k, b.k, e)});
const mapC = (C, q) => ({x: C.x + q.x * C.k, y: C.y + q.y * C.k});
const mapRect = (C, q) => ({x: C.x + q.x * C.k, y: C.y + q.y * C.k, w: q.w * C.k, h: q.h * C.k});
const lerpRect = (a, b, e) => ({x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e)});
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const rotPt = (pose, q, s) => {
  const a = (pose.rot * Math.PI) / 180;
  return {x: pose.x + (q.x * Math.cos(a) - q.y * Math.sin(a)) * s, y: pose.y + (q.x * Math.sin(a) + q.y * Math.cos(a)) * s};
};

/**
 * Text-free ("greeked") copy of a virtual tree: every text becomes soft bars of the same size and
 * position (named texts keep their name, so per-frame opacity still applies). Used for the context
 * miniature, whose text would be illegibly small; the geometry stays identical to the full stage.
 */
function greek(node) {
  if (typeof node === 'string' || !node) return node;
  if (node.tag === 'text') {
    const a = node.attrs;
    const fs = Number(a['font-size']) || 16, x = Number(a.x) || 0, y = Number(a.y) || 0;
    const anchor = a['text-anchor'] || 'start';
    const spans = node.children.filter(c => typeof c !== 'string' && c.tag === 'tspan');
    let dy = 0;
    const lines = spans.length
      ? spans.map((sp, i) => { dy += i ? Number(sp.attrs.dy) || 0 : 0; return {text: sp.children.filter(c => typeof c === 'string').join(''), y: y + dy}; })
      : [{text: node.children.filter(c => typeof c === 'string').join(''), y}];
    const bars = lines.filter(l => l.text.trim()).map(l => {
      const w = Math.max(fs * 0.6, l.text.length * fs * 0.5);
      const bx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
      return h('rect', {x: r(bx), y: r(l.y - fs * 0.62), width: r(w), height: r(fs * 0.5), rx: r(fs * 0.25), fill: a.fill || '#1f2328', opacity: 0.45});
    });
    return g({name: a.name, opacity: a.opacity, transform: a.transform}, bars);
  }
  return {...node, children: node.children.map(greek)};
}

/** The two sight lines between a source rect and the window (as a lens draws its cone). */
function sightLines(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x;
    const rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [[{x: sx, y: S.y}, {x: rx, y: R.y}], [{x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}]];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y;
  const ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [[{x: S.x, y: sy}, {x: R.x, y: ry}], [{x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}]];
}

const scene = {
  sizes: {landscape: [STAGE.landscape.w, STAGE.landscape.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.portrait.w, STAGE.portrait.h]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const st0 = STAGE[shape];
    const s0 = Math.min(ctx.design.w / st0.w, ctx.design.h / st0.h);
    const ox = (ctx.design.w - st0.w * s0) / 2, oy = (ctx.design.h - st0.h * s0) / 2;
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const showKey = ctx.show('key');
    let K = COMPOSE[shape];
    const fi = Math.min(p.activities.length - 1, TARGETS.indexOf(p.focusTarget));
    const scope = resolveScope(ctx, p, {[fi]: p.beforeValue});
    const alt = scope.tagFor(p.afterValue);
    const stageOpts = {shape, params: {...p, actorLabels: {a: '', b: t.filter}}, scope, arms: false, focus: {index: fi, alt}, magnify: false, cardText: {tagMin: 14, tagLines: 4, tagWidth: TAG_TEXT_W}, plateText: {minSize: 11, maxLines: 3}, bookTitleLines: 5};
    const stage = sorterStage(ctx, {prefix: 'st', ...stageOpts});
    // the same wall again for the miniature (identical geometry), its text greeked
    const miniStage = sorterStage(ctx, {prefix: 'mn', ...stageOpts});
    const miniNode = greek(miniStage.node);
    const {s, cw, chh, cardsL} = stage;
    const plan = stage.plans[fi];
    const rest0 = plan.rest;

    /* --- the re-sort after the substitution: its own slot, fanned with any resident */
    const after = stage.focusAfter || {container: plan.container, stack: plan.stack};
    const moves = String(after.container) !== String(plan.container);
    const base = stage.restIn(after.container, 0);
    // it settles lower in the bin (its bottom margin behind the base strip) so a resident can show above it
    const restAfter = moves ? {x: base.x + 6 * s, y: base.y + Math.max(0, 14 * s - 4), rot: 2} : rest0;
    const kitAfter = stage.restIn(after.container, after.stack);
    const residents = moves ? stage.plans.map((pl, i) => (i !== fi && String(pl.container) === String(after.container) ? i : -1)).filter(i => i >= 0) : [];
    const box = after.container === 'side' ? stage.sideBin.box : stage.bins[after.container].box;
    // a keyed bin has its plate above (only the resident's top border may pass behind it);
    // the side bin is open above, so a resident may stand out of it
    const ceiling = after.container === 'side' ? box.y - 80 : stage.plates[after.container].box.y + stage.plates[after.container].box.h - 5 * s;
    const lifted = residents.map((i, n) => {
      const rp = stage.plans[i].rest;
      const top = rp.y - chh / 2;
      // the resident rises until its whole tag strip shows above the arriving card
      const lift = Math.max(0, Math.min(cardsL.stripH * s + 6 + n * 12 * s, top - ceiling));
      return {i, from: rp, to: {x: rp.x - 8 * s, y: rp.y - lift, rot: -2}, lift};
    });

    /* --- detail window: a real copy of the card, in stage coordinates ------ */
    const m = 16;
    const srcW = cw + 2 * m, srcH = chh + 2 * m;
    const srcAt = pose => ({x: pose.x - srcW / 2, y: pose.y - srcH / 2, w: srcW, h: srcH});
    const zoomFor = Ibox => Math.min(p.detailGeometry.zoom, (Ibox.w - 8) / srcW, (Ibox.h - 8) / srcH);
    const winIn = Ibox => {
      const z = zoomFor(Ibox);
      const w = srcW * z, hh = srcH * z;
      return {x: Ibox.x + (Ibox.w - w) / 2, y: Ibox.y + (Ibox.h - hh) / 2, w, h: hh, z};
    };
    // caption of the miniature (what the context shows), riding under it
    const capFit = ctx.show('all') ? fitWords(ctx, `${t.context}: ${p.contextLabels.context}`, {maxWidth: st0.w * K.C1.k - 30, size: 21, minSize: 15, maxLines: 2, weight: 600}) : null;
    // a window box under the miniature starts below the miniature's caption
    const clearOf = (Ibox, C) => {
      if (Ibox.x >= C.x + st0.w * C.k) return Ibox;
      const minY = C.y + st0.h * C.k + 12 + (capFit ? capFit.height : 0) + 14;
      return minY > Ibox.y ? {...Ibox, y: minY, h: Ibox.h - (minY - Ibox.y)} : Ibox;
    };
    // square box with a tall card (long labels): the window beside the miniature when that makes it larger
    if (shape === 'square') {
      const side = {C1: {x: 16, y: 16, k: 0.48}, C2: {x: 16, y: 16, k: 0.5}};
      side.I1 = {x: 16 + st0.w * 0.48 + 26, y: 24, w: st0.w - 16 - (16 + st0.w * 0.48 + 26), h: st0.h - 48};
      side.I2 = {x: 16 + st0.w * 0.5 + 26, y: 24, w: st0.w - 16 - (16 + st0.w * 0.5 + 26), h: st0.h - 48};
      side.note = {x: 16, y: 16 + st0.h * 0.5 + 12 + (capFit ? capFit.height : 0) + 26, w: st0.w * 0.5};
      if (zoomFor(side.I1) > 1.15 * zoomFor(clearOf(K.I1, K.C1))) K = side;
    }
    const I1 = winIn(clearOf(K.I1, K.C1)), I2 = winIn(clearOf(K.I2, K.C2));
    const altFit = showKey ? cardsL.tagFit(alt.subject) : null;
    const cardCopy = stage.cardCopy('lc-card', fi, {alt: {tag: alt, fit: altFit}});
    const clipId = 'ins-clip';
    const insetNode = g({name: 'ins', opacity: 0},
      h('rect', {name: 'ins-shadow', rx: 18, fill: th.shadow}),
      h('rect', {name: 'ins-bg', rx: 18, fill: th.paper}),
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'ins-cliprect', rx: 18}))),
      g({'clip-path': ctx.ref(clipId)}, g({name: 'ins-content'}, g({name: 'lc-pose'}, cardCopy.node))),
      h('rect', {name: 'ins-border', rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5}));

    /* --- the single editorial note: changed title, before (struck) → after */
    const N = K.note;
    const size = 27;
    let head = null, before = null, afterChip = null, stateChip = null, strikes = [], arrow = null;
    if (showKey) {
      head = chip(ctx, p.contextLabels.marker, {x: N.x, y: N.y, anchor: 'start', maxWidth: N.w, size, minSize: 17, maxLines: 2, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-head'});
      const y1 = N.y + head.box.h + 12;
      before = chip(ctx, `${t.tag}: ${p.beforeValue || t.noSubject}`, {x: N.x, y: y1, anchor: 'start', maxWidth: N.w, size, minSize: 17, maxLines: 3, fill: th.card, name: 'ann-before'});
      const ay = before.box.y + before.box.h + 6;
      arrow = {x: N.x + 26, y: ay};
      afterChip = chip(ctx, `${t.tag}: ${p.afterValue || t.noSubject}`, {x: N.x, y: ay + 30, anchor: 'start', maxWidth: N.w, size, minSize: 17, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      // the dependent state after the re-sort, in words (descriptive, as supplied — never a verdict)
      stateChip = chip(ctx, `→ ${alt.state === 'included' ? t.included : t.unclassified} (${t.asSupplied})`, {x: N.x, y: afterChip.box.y + afterChip.box.h + 12, anchor: 'start', maxWidth: N.w, size, minSize: 17, maxLines: 3, fill: th.card, stroke: alt.state === 'included' ? th.ink : NEUTRAL, name: 'ann-state'});
      const f = before.fit;
      const padY = size * 0.38;
      strikes = f.lines.map((line, i) => {
        const lw = ctx.measure(line, f.size, f.weight, f.family);
        const y = before.box.y + padY + f.size * 0.8 - f.size * 0.3 + i * f.lineHeight;
        return {len: lw + 8, node: h('line', {name: `ann-strike-${i}`, x1: r(before.box.x + before.box.w / 2 - lw / 2 - 4), x2: r(before.box.x + before.box.w / 2 + lw / 2 + 4), y1: r(y), y2: r(y), stroke: th.accent, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw + 8)} ${r(lw + 18)}`, 'stroke-dashoffset': r(lw + 8)})};
      });
    }

    // dependent states: is anything still unclassified / included after the move?
    const others = scope.acts.filter((_, i) => i !== fi);
    const unBefore = scope.acts.some(a => a.state === 'unclassified');
    const unAfter = others.some(a => a.state === 'unclassified') || alt.state === 'unclassified';
    const inBefore = scope.acts.some(a => a.state === 'included');
    const inAfter = others.some(a => a.state === 'included') || alt.state === 'included';
    const pxPerUnit = fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * s0;
    return {stage, miniStage, miniNode, st0, s0, ox, oy, t, K, fi, scope, alt, plan, rest0, restAfter, kitAfter, moves, residents, lifted, srcAt, I1, I2, insetNode, cardCopy,
      head, before, afterChip, stateChip, strikes, arrow, capFit, unBefore, unAfter, inBefore, inAfter, altFit, pxPerUnit};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {st0} = L;
    const dimPath = `M0 0H${st0.w}V${st0.h}H0Z`;
    return g({transform: T(L.ox, L.oy, 0, L.s0)},
      // the context (the whole sorter wall) — full size at first, then a framed miniature
      g({name: 'ctx'},
        g({name: 'ctx-mini', opacity: 0}, L.miniNode),
        g({name: 'ctx-full'}, L.stage.node),
        h('path', {name: 'ctx-dim', d: dimPath, 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
        h('path', {name: 'ctx-src', fill: 'none', stroke: th.accent2, 'stroke-width': 7, opacity: 0}),
        h('path', {name: 'ctx-frame', d: roundRectPath(-6, -6, st0.w + 12, st0.h + 12, 34), fill: 'none', stroke: th.fgSoft, 'stroke-width': 5, opacity: 0})),
      L.capFit && g({name: 'ctx-cap', opacity: 0},
        textBlock(L.capFit, {x: 0, y: 0, fill: th.fg})),
      // changed-datum marker: a badge just outside the re-sorted card's corner (off the chip)
      g({name: 'mk-badge', opacity: 0},
        h('circle', {r: 13, fill: th.accent2, stroke: th.paper, 'stroke-width': 3}),
        // Δ = "changed" (a neutral change glyph: no tick, nothing that reads as approved or valid)
        h('path', {d: 'M0 -6.5L6.5 5H-6.5Z', fill: 'none', stroke: '#fff', 'stroke-width': 2.8, 'stroke-linejoin': 'round'})),
      h('circle', {name: 'mk-ring', r: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      // sight lines from the source in the miniature to the detail window
      [0, 1].map(i => h('line', {name: `ins-cone-${i}`, stroke: th.accent2, 'stroke-width': 2.6, 'stroke-dasharray': '8 7', opacity: 0})),
      L.insetNode,
      // the same badge on the window: it names the card the window shows once the sight lines are gone
      g({name: 'ins-badge', opacity: 0},
        h('circle', {r: 17, fill: th.accent2, stroke: th.paper, 'stroke-width': 3}),
        h('path', {d: 'M0 -8.5L8.5 6.5H-8.5Z', fill: 'none', stroke: '#fff', 'stroke-width': 3.2, 'stroke-linejoin': 'round'})),
      L.before && g({name: 'ann', opacity: 0},
        g({name: 'ann-head-g', opacity: 0}, L.head.node),
        L.before.node, L.strikes.map(q => q.node),
        h('path', {d: `M${r(L.arrow.x)} ${r(L.arrow.y)}v18m-8 -8l8 8l8 -8`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node,
        L.stateChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const {stage, st0, K, fi} = L;
    const {s, chh} = stage;
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const move = seg(u, ...W.move);
    const st = seg(u, ...W.state);
    const statusIn = L.inBefore ? (L.inAfter ? 1 : 1 - st) : (L.inAfter ? st : 0);
    const statusUn = L.unBefore ? (L.unAfter ? 1 : 1 - st) : (L.unAfter ? st : 0);
    // context: the sorted state; the focus card changes only in the return beat
    const cards = stage.plans.map(() => ({slide: 1, fall: 1, gate: 0}));
    const V = {
      a: {reach: 1, pull: 1, carry: 1, insert: 1, out: 1}, keys: L.scope.listed.map(() => 1), flap: 1, cards,
      swap: ctxUpd, move, statusIn, statusUn,
    };
    const posed = stage.pose(V);
    Object.assign(nodes, posed.nodes, L.miniStage.pose(V).nodes);
    const holders = posed.semantic.holders.slice();
    // the re-sorted card gets its own slot (the kit would stack it on the resident)
    const mv = ease.inOutSine(move);
    const kitPose = posed.semantic.cards[fi];
    const kitRot = lerp(L.rest0.rot, L.kitAfter.rot, mv);
    const cardNow = L.moves ? {x: kitPose.x + (L.restAfter.x - L.kitAfter.x) * mv, y: kitPose.y + (L.restAfter.y - L.kitAfter.y) * mv, rot: kitRot + (L.restAfter.rot - L.kitAfter.rot) * mv} : {...L.rest0};
    nodes[`st-card${fi}`] = nodes[`mn-card${fi}`] = {transform: T(cardNow.x, cardNow.y, cardNow.rot, s)};
    // any card already in that bin is lifted and fanned so its tag strip stays in view
    const lf = ease.inOutSine(seg(u, ...W.lift));
    const residentPoses = L.lifted.map(q => {
      const ps = {x: lerp(q.from.x, q.to.x, lf), y: lerp(q.from.y, q.to.y, lf), rot: lerp(q.from.rot, q.to.rot, lf)};
      nodes[`st-card${q.i}`] = nodes[`mn-card${q.i}`] = {transform: T(ps.x, ps.y, ps.rot, s)};
      const tx = stage.cards[q.i].texts;
      if (tx) {
        const covered = move > 0.85;
        nodes[tx.num] = {opacity: 1};
        if (tx.tag) nodes[tx.tag] = {opacity: 1};
        if (tx.label) nodes[tx.label] = {opacity: covered ? 0 : 1};
      }
      return ps;
    });

    /* --- camera: full context → miniature → larger miniature at the return */
    const shrink = ease.inOutCubic(seg(u, ...W.shrink));
    const grow = ease.inOutCubic(seg(u, ...W.grow));
    const C0 = {x: 0, y: 0, k: 1};
    const C = grow > 0 ? mixC(K.C1, K.C2, grow) : mixC(C0, K.C1, shrink);
    nodes.ctx = {transform: T(C.x, C.y, 0, C.k)};
    // as the wall shrinks into the miniature its text gives way to greeked bars (same geometry)
    const greekP = seg(u, ...W.greek);
    nodes['ctx-full'] = {opacity: r(1 - greekP, 3)};
    nodes['ctx-mini'] = {opacity: r(greekP, 3)};
    const mini = seg(u, ...W.shrink);
    nodes['ctx-frame'] = {opacity: r(mini, 3)};
    const undim = seg(u, ...W.undim);
    const dimP = seg(u, ...W.open) * (1 - undim);
    const src = L.srcAt(cardNow);
    nodes['ctx-dim'] = {opacity: r(0.38 * dimP, 3), d: `M0 0H${st0.w}V${st0.h}H0Z` + `M${r(src.x)} ${r(src.y)}v${r(src.h)}h${r(src.w)}v${r(-src.h)}Z`};
    const openP = ease.inOutCubic(seg(u, ...W.open));
    // the source frame marks the card while it is inspected; at the return the tight marker frame takes over
    nodes['ctx-src'] = {d: roundRectPath(src.x, src.y, src.w, src.h, 12), opacity: r(clamp(openP * 3) * (1 - undim), 3)};
    const capBox = L.capFit ? {x: C.x + 8, y: C.y + st0.h * C.k + 12, w: L.capFit.width, h: L.capFit.height} : null;
    if (capBox) nodes['ctx-cap'] = {transform: T(capBox.x, capBox.y), opacity: r(seg(u, ...W.caption), 3)};

    /* --- detail window --------------------------------------------------- */
    const srcScene = mapRect(C, src);
    const Iend = grow > 0 ? lerpRect(L.I1, L.I2, grow) : L.I1;
    const R = openP < 1 ? lerpRect(srcScene, Iend, openP) : Iend;
    const k = R.w / src.w;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    nodes.ins = {opacity: openP > 0.001 ? r(Math.min(1, openP * 4), 3) : 0};
    nodes['ins-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['ins-bg'] = rect;
    nodes['ins-cliprect'] = rect;
    nodes['ins-border'] = rect;
    nodes['ins-content'] = {transform: `${T(R.x - src.x * k, R.y - src.y * k)} scale(${r(k, 4)})`};
    nodes['lc-pose'] = {transform: T(cardNow.x, cardNow.y, cardNow.rot, s)};
    // inside the window: the old tag lifts out, the alternative datum is clipped on
    const out = clamp(change * 2), inn = clamp(change * 2 - 1);
    nodes['lc-card-tag'] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
    nodes['lc-card-tagB'] = {opacity: r(inn, 3), transform: `translate(0 ${r(10 * (1 - inn))})`};
    // the sight lines follow the card while it is re-sorted, then give way to the matching badges
    // (at the hold they would cross the state tags and the plates of the context)
    const coneOut = seg(u, ...W.coneOut);
    const cones = sightLines(srcScene, R);
    nodes['ins-badge'] = {transform: T(R.x + R.w - 6, R.y + 6), opacity: r(seg(u, ...W.marker), 3)};
    cones.forEach(([a, b], i) => {
      nodes[`ins-cone-${i}`] = {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: openP > 0.15 ? r(0.9 * (1 - coneOut), 3) : 0};
    });

    /* --- note -------------------------------------------------------------- */
    if (L.before) {
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      const sp = seg(u, ...W.strike);
      const n = L.strikes.length;
      L.strikes.forEach((q, i) => { nodes[`ann-strike-${i}`] = {'stroke-dashoffset': r(q.len * (1 - clamp(sp * n - i)))}; });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes['ann-state'] = {opacity: r(seg(u, ...W.state), 3)};
      nodes['ann-head-g'] = {opacity: r(seg(u, ...W.marker), 3)};
    }

    /* --- marker on the re-sorted card (outside its chip, at its top-right corner) */
    const mkp = seg(u, ...W.marker);
    const hw = stage.cardsL.W / 2, hh = stage.cardsL.H / 2;
    // the badge (constant on-screen size) sits outside the card's top-right corner, overlapping only its border
    const rb = 13 / C.k;
    const c0 = rotPt(cardNow, {x: hw, y: -hh}, s);
    const corner = {x: c0.x + rb * 0.8, y: c0.y - rb * 0.8};
    const mkS = mapC(C, corner);
    nodes['mk-badge'] = {transform: T(mkS.x, mkS.y), opacity: r(mkp, 3)};
    nodes['mk-ring'] = {transform: T(mkS.x, mkS.y, 0, 1 + 0.6 * mkp), opacity: r(mkp > 0 && mkp < 1 ? 1 - mkp : 0, 3)};

    /* --- semantics ------------------------------------------------------ */
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    if (L.moves) holders[fi] = move >= 1 ? (L.stage.focusAfter.container === 'side' ? 'side' : `bin${L.stage.focusAfter.container}`) : holders[fi];
    const cardBox = {x: cardNow.x - stage.cw / 2, y: cardNow.y - chh / 2, w: stage.cw, h: chh};
    // chip text of the focus card (stage coords, axis-aligned approx.) vs the marker badge
    const CLW = stage.cardsL.W, CLH = stage.cardsL.H, stripH = stage.cardsL.stripH;
    // the text actually drawn in the chip (centred in its slot), after the change
    const tf = L.altFit || stage.cardsL.fits[fi].tag;
    const tcx = -CLW / 2 + 44 + 33 + (CLW - 52 - 37) / 2;
    const chipTL = rotPt(cardNow, {x: tcx - (tf ? tf.width / 2 : 40), y: -CLH / 2 + 7}, s);
    const chipText = {x: chipTL.x, y: chipTL.y, w: (tf ? tf.width : 80) * s, h: (stripH - 14) * s};
    const badgeStage = {x: corner.x - rb, y: corner.y - rb, w: 2 * rb, h: 2 * rb};
    const ctxRect = {x: C.x, y: C.y, w: st0.w * C.k, h: st0.h * C.k};
    // a resident's tag chip (its strip minus the paddings) is neither under the arriving card nor under its plate
    const plateBox = L.moves && L.stage.focusAfter.container !== 'side' ? stage.plates[L.stage.focusAfter.container].box : null;
    const residentsClear = residentPoses.every((ps, n) => {
      // the resident's chip text (centred in its chip), plus its mark and number on the left
      const rf = stage.cardsL.fits[L.lifted[n].i].tag;
      const th2 = rf ? rf.height * s : 24 * s;
      const cyc = ps.y - chh / 2 + (stripH / 2) * s;
      const chipR = {x: ps.x - stage.cw / 2 + 8 * s, y: cyc - th2 / 2, w: stage.cw - 16 * s, h: th2};
      return !hit(chipR, cardBox) && !(plateBox && hit(chipR, plateBox)) && !(mkp > 0 && hit(chipR, badgeStage));
    });
    const fits = stage.cardsL.fits[fi];
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(openP, 3),
        lens: {x: r(R.x + R.w / 2), y: r(R.y + R.h / 2)},
        lensZoom: r(R.w / src.w, 3),
        lensSourceCenter: {x: r(src.x + src.w / 2), y: r(src.y + src.h / 2)},
        focusCenter: {x: r(cardNow.x), y: r(cardNow.y)},
        // the window frames the WHOLE card (tag chip and name), not a fragment of it
        windowHasWholeCard: cardBox.x >= src.x && cardBox.y >= src.y && cardBox.x + cardBox.w <= src.x + src.w && cardBox.y + cardBox.h <= src.y + src.h,
        wholeTexts: !(fits.tag && fits.tag.truncated) && !(fits.label && fits.label.truncated) && !(L.altFit && L.altFit.truncated),
        // composition: a context miniature beside a large detail window (they never overlap)
        contextScale: r(C.k, 3),
        insetClearOfContext: openP < 1 || (!hit({x: R.x, y: R.y, w: R.w, h: R.h}, ctxRect) && !(capBox && hit({x: R.x, y: R.y, w: R.w, h: R.h}, capBox))),
        insetPx: r(R.w * L.pxPerUnit, 1),
        tagPxInWindow: fits.tag ? r(fits.tag.size * s * k * L.pxPerUnit, 1) : null,
        magnifiers: 1,
        markerGlyph: 'delta',
        // every tag text fits inside its chip's text slot with padding (context cards and the substituted tag)
        tagsInChips: [...stage.cardsL.fits.map(f => f.tag), L.altFit].filter(Boolean).every(f => f.width <= TAG_TEXT_W + 0.5 && !f.truncated),
        // the context caption is never under the window (it appears once the window has settled)
        captionClear: !capBox || seg(u, ...W.caption) === 0 || !hit({x: R.x, y: R.y, w: R.w, h: R.h}, capBox),
        // the new dependent state in words, in the note
        stateText: L.stateChip ? L.stateChip.fit.full : null,
        stateShown: r(seg(u, ...W.state), 3),
        windowShare: r(R.w / st0.w, 3),
        contextShare: r(C.k, 3),
        ctxTagPx: fits.tag ? r(fits.tag.size * s * C.k * L.pxPerUnit, 1) : null,
        ctxLabelPx: fits.label ? r(fits.label.size * s * C.k * L.pxPerUnit, 1) : null,
        sightLines: r(openP > 0.15 ? 1 - coneOut : 0, 3),
        windowBadge: r(seg(u, ...W.marker), 3),
        datum,
        lensDatum: change === 0 ? 'before' : change >= 1 ? 'after' : 'changing',
        contextDatum: ctxUpd === 0 ? 'before' : ctxUpd >= 1 ? 'after' : 'changing',
        focus: fi,
        focusCard: {x: r(C.x + cardNow.x * C.k), y: r(C.y + cardNow.y * C.k)},
        holders,
        focusHolder: holders[fi],
        othersHolders: holders.filter((_, i) => i !== fi),
        residents: L.residents,
        residentsClear,
        residentLift: L.lifted.map(q => r(q.lift)),
        markerShown: r(mkp, 3),
        markerClearOfTag: !hit(badgeStage, chipText),
        statusUn: r(statusUn, 3),
        before: L.scope.acts[fi].subject,
        after: L.alt.subject,
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.1.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-05-inspect',
    title: 'Material scope — inspecting one subject tag',
    titleEs: 'Ámbito material — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito material',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The sorted state of the subject filter shrinks into a framed context miniature while a detail window grows out of one activity card: a real enlarged copy of the whole card, joined to its source by sight lines. The supplied alternative tag replaces the old one in the window while the old value stays struck in the single note; back in the (larger, undimmed) context only that card is re-sorted by the filter keys into its own slot, any card already there is fanned to stay readable, the dependent state tags update and a changed-datum marker stays. Seeking back restores the previous datum and place.',
    tags: ['material scope', 'inspect', 'detail window', 'context miniature', 'subject tag', 'substitution', 'before after'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-material.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...KIT_STRINGS.en, ...STRINGS.en}, es: {...KIT_STRINGS.es, ...STRINGS.es}},
  scene,
});
