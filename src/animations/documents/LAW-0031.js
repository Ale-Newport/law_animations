/**
 * LAW-0031 — Cadena de versiones · contrast
 *
 * Storyboard (two complete desks, identical except ONE fact):
 *  0.00–0.17  base: both desks show the same loose copies, file, tab pad,
 *             pen, clerk and reviewer.
 *  0.17–0.40  change: a dashed ring marks the copy that will receive the
 *             tab — the newest copy in A (“selected version”), the copy just
 *             before it in B (“previous version”). The ring travels with its
 *             copy. Ordering starts in parallel at 0.25.
 *  0.25–0.74  parallel action: the clerks file the copies oldest first into
 *             identical chains; the reviewers take a tab and press it on the
 *             ringed copy — the tab lands on a different band (different
 *             height, different hand path) in A and B.
 *  0.78–1.00  guide: rings on both tabs and a comparison guide routed around
 *             the chains joins them; shared facts, then a neutral note. No
 *             winner, score or legal consequence is shown.
 * @module animations/documents/LAW-0031
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {documentsFields, contrastFields, str, obj} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {textBlock} from '../../primitives/annotate.js';
import {versionDesk, versionFields, versionIndex, tightChip, STAGE} from './kits/cadena-de-versiones.js';

const ID = 'LAW-0031';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  ring: [0.17, 0.26], order: [0.25, 0.6], homeA: [0.6, 0.66],
  tabReach: [0.55, 0.61], tabCarry: [0.61, 0.68], tabPress: [0.68, 0.7], tabRelease: [0.7, 0.75],
  changeChip: [0.2, 0.28], changeOut: [0.47, 0.5], shared: [0.51, 0.55], sharedOut: [0.82, 0.85],
  guide: [0.78, 0.9], note: [0.86, 0.91],
};

const sceneSchema = {
  ...documentsFields,
  versions: versionFields.versions,
  ...contrastFields(),
  tabbed: obj('The single changed fact: which copy receives the tab in each scene (version ids)', {
    a: str('Version id tabbed in scenario A', 16),
    b: str('Version id tabbed in scenario B', 16),
  }),
  folderLabel: str('Label printed on the file tab (identical in both scenes)', 40),
};

const defaultParams = {
  documentId: 'DOC-311',
  documentTitle: 'Supply Agreement',
  clauses: ['Scope of supply', 'Prices (hypothetical)', 'Delivery schedule'],
  signers: [{name: 'Lena Ortiz', role: 'Clerk'}, {name: 'Kofi Mensah', role: 'Reviewer'}],
  redactions: [],
  versions: [
    {id: 'v1', date: 'Day 2'},
    {id: 'v2', date: 'Day 5'},
    {id: 'v3', date: 'Day 9'},
    {id: 'v4', date: 'Day 12'},
  ],
  scenarioA: {label: 'Selected version', caption: 'The tab marks the newest copy, v4'},
  scenarioB: {label: 'Previous version', caption: 'The tab marks the copy before it, v3'},
  changedFact: 'Only the copy that receives the tab differs',
  sharedFacts: ['Same four copies', 'Same order in the file', 'Same people, tab and pen'],
  comparisonLabels: {guide: 'Changed fact: which copy carries the tab', neutral: 'Two situations shown side by side — no outcome is stated'},
  tabbed: {a: 'v4', b: 'v3'},
  folderLabel: 'Version file',
};

/**
 * Stage axis and arrangement per available shape. Two desks side by side in
 * a square frame are drawn small, so their key labels (identifier bands,
 * actor chips) are enlarged there (`labelScale`). In row arrangements the
 * guide arches over the desks at `archY` (stage units), through desk area
 * that the filed piles have left empty — clear of pens, hands and arms.
 */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row', archY: 132, labelScale: 1.12},
  square: {axis: 'vertical', arrangement: 'row', archY: 300, labelScale: 1.45},
  portrait: {axis: 'horizontal', arrangement: 'column', labelScale: 1.12},
};
const MARGIN = 90; // right margin for the stacked guide

/** Rounded orthogonal path through points, returns path data + length. */
function roundedPath(pts, rad = 26) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    if (!c) {
      d += `L${r(b.x)} ${r(b.y)}`;
      len += Math.hypot(b.x - a.x, b.y - a.y);
      break;
    }
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const k = Math.min(rad, l1 / 2, l2 / 2);
    const p1 = {x: b.x - ((b.x - a.x) / l1) * k, y: b.y - ((b.y - a.y) / l1) * k};
    const p2 = {x: b.x + ((c.x - b.x) / l2) * k, y: b.y + ((c.y - b.y) / l2) * k};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    len += l1 - k + k * 1.6;
    pts[i] = p2; // continue from the end of the corner
  }
  return {d, len};
}

/**
 * Scenario header (letter badge + label + caption), styled like
 * frameworks/paired.js scenarioHeader(), but a long label or caption wraps to
 * a second line instead of being cut with an ellipsis (the words that tell A
 * from B must survive). Returns the node and the height it needs.
 */
function sceneHeader(ctx, o) {
  const th = ctx.theme;
  const size = o.size;
  const badgeR = size * 0.78;
  const tx = o.x + badgeR * 2 + 18;
  const mw = o.w - badgeR * 2 - 24;
  const cy = o.y + size * 0.62;
  const parts = [
    h('circle', {cx: r(o.x + badgeR), cy: r(cy), r: r(badgeR), fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    // with labels hidden the badge stays as a coloured marker (A = left/top, B = right/bottom)
    ctx.show('key') ? h('text', {x: r(o.x + badgeR), y: r(cy + size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
  ];
  let y = o.y;
  if (ctx.show('key')) {
    let f = ctx.fit(o.label, {maxWidth: mw, size, minSize: size * 0.8, maxLines: 1, weight: 700});
    if (f.truncated) f = ctx.fit(o.label, {maxWidth: mw, size: size * 0.8, minSize: size * 0.62, maxLines: 2, weight: 700});
    parts.push(textBlock(f, {x: tx, y, fill: th.fg}));
    y += f.height + f.size * 0.34; // clear of the label's descenders
  }
  if (o.caption && ctx.show('all')) {
    const cs = size * 0.6;
    let f2 = ctx.fit(o.caption, {maxWidth: mw, size: cs, minSize: cs * 0.85, maxLines: 1, weight: 500});
    if (f2.truncated) f2 = ctx.fit(o.caption, {maxWidth: mw, size: cs * 0.9, minSize: cs * 0.7, maxLines: 2, weight: 500});
    parts.push(textBlock(f2, {x: tx, y, fill: th.fgSoft}));
    y += f2.height;
  }
  return {node: g({name: o.name}, parts), h: Math.max(y - o.y, badgeR * 2 + 4)};
}

const scene = {
  sizes: {landscape: [2670, 1400], square: [1870, 1700], portrait: [1760 + MARGIN, 2380]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {axis, arrangement, archY, labelScale} = ARRANGE[ctx.view.shape];
    const stageSize = STAGE[axis];
    const footer = 130;
    // headers grow (never truncate) when a label or caption needs a second line
    const colors = [th.inkSoft, th.accent2];
    const headSpec = i => ({name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption, w: stageSize.w, size: 52, color: colors[i]});
    const header = Math.max(150, ...[0, 1].map(i => sceneHeader(ctx, {...headSpec(i), x: 0, y: 0}).h + 30));
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap: arrangement === 'column' ? 130 : 70});
    const bw = geo.w + (arrangement === 'column' ? MARGIN : 0);
    const bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const N = p.versions.length;
    const sel = [versionIndex(p.versions, p.tabbed.a, N - 1), versionIndex(p.versions, p.tabbed.b, Math.max(0, N - 2))];
    const stages = ['a', 'b'].map((k, i) => versionDesk(ctx, {
      prefix: `s${k}`, axis, versions: p.versions, selected: sel[i], doc, people: p.signers, folderLabel: p.folderLabel, ringIndex: sel[i], labelScale,
    }));
    const headers = geo.panels.map((pn, i) => sceneHeader(ctx, {...headSpec(i), x: pn.x, y: pn.headerY + 10}).node);
    const toBlock = (i, q) => ({x: geo.panels[i].x + q.x, y: geo.panels[i].y + q.y});
    const tips = stages.map((st, i) => toBlock(i, st.tabTip(sel[i])));
    // Guide route: row → up from A's tab, across above the desks' contents,
    // down to B's tab; column → out to the right margin and down.
    let pts;
    if (arrangement === 'row') {
      const yTop = geo.panels[0].y + archY;
      pts = [{x: tips[0].x + 6, y: tips[0].y}, {x: tips[0].x + 44, y: tips[0].y}, {x: tips[0].x + 44, y: yTop}, {x: tips[1].x + 44, y: yTop}, {x: tips[1].x + 44, y: tips[1].y}, {x: tips[1].x + 6, y: tips[1].y}];
    } else {
      const mx = geo.w + MARGIN * 0.5;
      pts = [{x: tips[0].x + 6, y: tips[0].y}, {x: mx, y: tips[0].y}, {x: mx, y: tips[1].y}, {x: tips[1].x + 6, y: tips[1].y}];
    }
    const route = roundedPath(pts.map(q => ({...q})));
    const guideNode = g({name: 'guide', opacity: 0},
      h('path', {name: 'guide-line', d: route.d, fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(route.len + 40)} ${r(route.len + 60)}`, 'stroke-dashoffset': r(route.len + 40)}),
      h('circle', {name: 'guide-dotA', cx: r(pts[0].x), cy: r(pts[0].y), r: 8, fill: th.accent, opacity: 0}),
      h('circle', {name: 'guide-dotB', cx: r(pts[pts.length - 1].x), cy: r(pts[pts.length - 1].y), r: 8, fill: th.accent, opacity: 0}),
    );
    // guide chip: on the arch over the gap (row) or in the gap on the right (column)
    let guideChip = null;
    if (ctx.show('key')) {
      if (arrangement === 'row' && axis === 'square') {
        // wide frames: the arch runs just under A's reviewer chip, so the guide
        // chip starts at the gap and sits over B's empty top-left desk corner
        // (clear of A's chip and of B's file label)
        const opts = {x: geo.panels[1].x - 60, anchor: 'start', maxWidth: stages[1].G.folder.x + 30, size: 36, maxLines: 3, fill: th.card, stroke: th.accent, name: 'guide-chip'};
        const probe = tightChip(ctx, p.comparisonLabels.guide, {...opts, y: 0});
        guideChip = tightChip(ctx, p.comparisonLabels.guide, {...opts, y: geo.panels[0].y + archY - 22 - probe.box.h / 2});
      } else if (arrangement === 'row') {
        const midX = geo.panels[0].x + geo.panels[0].w + 35;
        const opts = {x: midX, anchor: 'middle', maxWidth: 1000, size: 36, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'};
        const probe = tightChip(ctx, p.comparisonLabels.guide, {...opts, y: 0});
        guideChip = tightChip(ctx, p.comparisonLabels.guide, {...opts, y: geo.panels[0].y + archY - probe.box.h / 2});
      } else {
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: geo.w - 20, y: geo.panels[0].y + stageSize.h + 16, anchor: 'end', maxWidth: geo.w * 0.6, size: 34, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      }
    }
    const footY = geo.h + 24;
    const changeChip = ctx.show('key') ? tightChip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.9, size: 42, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 38, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 38, name: 'neutral-note'}) : null;
    return {geo, stages, headers, tips, sel, guideNode, route, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, bw};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const tabRing = i => h('ellipse', {name: `tabring-${i}`, cx: r(L.tips[i].x - 38), cy: r(L.tips[i].y), rx: 78, ry: 40, fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      tabRing(0), tabRing(1),
      L.guideNode,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const v = {
      order: seg(u, ...W.order), homeA: seg(u, ...W.homeA),
      tabReach: seg(u, ...W.tabReach), tabCarry: seg(u, ...W.tabCarry), tabPress: seg(u, ...W.tabPress), tabRelease: seg(u, ...W.tabRelease),
      ring: seg(u, ...W.ring),
    };
    const a = L.stages[0].pose(v);
    const b = L.stages[1].pose(v);
    const nodes = {...a.nodes, ...b.nodes};
    const gp = seg(u, ...W.guide);
    nodes.guide = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-line'] = {'stroke-dashoffset': r((L.route.len + 40) * (1 - gp))};
    nodes['guide-dotA'] = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-dotB'] = {opacity: gp >= 0.98 ? 1 : 0};
    nodes['tabring-0'] = {opacity: r(clamp(gp * 3), 3)};
    nodes['tabring-1'] = {opacity: r(clamp(gp * 3), 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    // footer notes share one place: each fades out completely before the next one fades in
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - seg(u, ...W.changeOut)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, ...W.shared) * (1 - seg(u, ...W.sharedOut)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const toBlock = (i, q) => (q ? {x: r(L.geo.panels[i].x + q.x), y: r(L.geo.panels[i].y + q.y)} : null);
    const p = ctx.params;
    const summary = (sm, i) => ({
      chainOrder: sm.order.map(k => p.versions[k].id),
      holders: sm.holders,
      tabOn: sm.tabAttached ? p.versions[L.sel[i]].id : null,
      tabHeld: sm.tabHeld,
      ring: r(v.ring, 3),
      ringOn: p.versions[L.sel[i]].id,
      copies: p.versions.map((_, k) => sm[`copy${k + 1}`]),
    });
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        a: summary(a.semantic, 0),
        b: summary(b.semantic, 1),
        handA_A: toBlock(0, a.semantic.handA), handA_B: toBlock(1, b.semantic.handA),
        handB1_A: toBlock(0, a.semantic.handB1), handB1_B: toBlock(1, b.semantic.handB1),
        gripA_A: toBlock(0, a.semantic.carryGrip), gripA_B: toBlock(1, b.semantic.carryGrip),
        tabGrip_A: toBlock(0, a.semantic.tabGrip), tabGrip_B: toBlock(1, b.semantic.tabGrip),
        tab_A: toBlock(0, a.semantic.tab), tab_B: toBlock(1, b.semantic.tab),
        copy1_A: toBlock(0, a.semantic.copy1), copy4_A: toBlock(0, a.semantic.copy4),
        copy1_B: toBlock(1, b.semantic.copy1), copy4_B: toBlock(1, b.semantic.copy4),
        allReached: a.semantic.allReached && b.semantic.allReached,
        reach: {a: a.semantic.reach, b: b.semantic.reach},
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
    slug: 'documents-08-contrast',
    title: 'Version chain — tab on the selected vs the previous version',
    titleEs: 'Cadena de versiones — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Cadena de versiones',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical desks file the same copies into identical chains in parallel; the only difference is which copy receives the index tab (the newest copy in A, the copy before it in B). A ring introduces the difference and a routed guide joins the two tabs; no outcome is stated.',
    tags: ['versions', 'version chain', 'index tab', 'comparison', 'selected version', 'previous version', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/cadena-de-versiones.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
