/**
 * LAW-0023 — Anexo incorporado · contrast
 *
 * Storyboard (two complete desks, run in parallel):
 *  0.00–0.17  base: two identical desks — same contract, same annex in the
 *             same folder, same pen and seal, same parties.
 *  0.17–0.40  the one changed fact is introduced as a localized visual mark: a
 *             dashed outline shows where each annex will be placed — in A on the
 *             contract margin with its tab at the linked clause, in B beside the
 *             contract with a gap. B's hand starts taking the annex out.
 *  0.40–0.77  the same action runs in parallel (carry, glide, reference
 *             written, seal). Only the contrasted circumstance adapts: A's annex
 *             docks and the pen draws the link loop to its tab, so the seal lands
 *             across the seam; B's annex stays apart, no loop is drawn and the
 *             seal lands on the annex alone.
 *  0.77–1.00  a comparison guide joins the two junctions (joined / gap); a
 *             neutral note states that no outcome is shown. No winner, score or
 *             legal consequence.
 * @module animations/documents/LAW-0023
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {documentsFields, contrastFields, str} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {annexDesk, annexFields, ANNEX_STRINGS, STAGE} from './kits/anexo-incorporado.js';

const ID = 'LAW-0023';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  mark: [0.18, 0.26], markOut: [0.47, 0.53], changeChip: [0.2, 0.28],
  reachB: [0.24, 0.29], slideOut: [0.29, 0.34], carry: [0.34, 0.44], glide: [0.44, 0.51], retreatB: [0.46, 0.56],
  highlight: [0.49, 0.54],
  reachA: [0.41, 0.46], penLift: [0.46, 0.505], write: [0.505, 0.575], link: [0.575, 0.625], penBack: [0.625, 0.665],
  toStamp: [0.665, 0.69], stamp: [0.69, 0.765], retreatA: [0.765, 0.8],
  guide: [0.8, 0.9], sharedOut: [0.85, 0.88], note: [0.885, 0.94],
};
const sceneSchema = {
  ...documentsFields,
  ...annexFields,
  ...contrastFields(),
  folderLabel: str('Label printed on the folder pocket (identical in both scenes)', 40),
  sealLabel: str('Text inside the round seal impression (identical in both scenes)', 20),
};

const defaultParams = {
  documentId: 'CTR-208',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties and purpose', 'Delivery of the goods', 'Price (hypothetical)'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  linkedClause: 1,
  annex: {label: 'ANNEX 1', title: 'Delivery schedule'},
  reference: 'see Annex 1',
  scenarioA: {label: 'Annex linked', caption: 'Joined at clause 2, link drawn to its tab'},
  scenarioB: {label: 'Annex kept separate', caption: 'Laid beside the contract, not joined'},
  changedFact: 'Only the join between clause 2 and the annex differs',
  sharedFacts: ['Same contract and annex', 'Same reference written', 'Same seal'],
  comparisonLabels: {guide: 'Changed fact: joined at the clause / laid apart', neutral: 'Two situations shown side by side — no outcome is stated'},
  folderLabel: 'Annexes',
  sealLabel: 'CTR-208',
};

/**
 * Stage axis, arrangement and text sizes per available shape (design units).
 *  textScale / rowMinFrac: clause headings and the written reference are drawn
 *    larger inside each desk, in a taller linked row (the shared facts must
 *    read on a phone);
 *  label / caption / guide / note: scenario label, scenario caption, closing
 *    guide chip and footer note sizes (key labels >= ~20 px at 1080p).
 */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row', textScale: 2, rowMinFrac: 0.31, label: 56, caption: 42, guide: 46, note: 42},
  square: {axis: 'vertical', arrangement: 'row', textScale: 2, rowMinFrac: 0.31, label: 58, caption: 48, guide: 52, note: 48},
  portrait: {axis: 'horizontal', arrangement: 'column', textScale: 1.6, label: 56, caption: 38, guide: 38, note: 38},
};

const scene = {
  sizes: {landscape: [2470, 1410], square: [1870, 1710], portrait: [1670, 2440]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const AR = ARRANGE[ctx.view.shape];
    const {axis, arrangement} = AR;
    const stageSize = STAGE[axis];
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    // Target outlines (the localized change): where each annex will be placed —
    // drawn UNDER the annex (between contract and annex), so the sheet covers
    // its own target as it arrives.
    const outline = (geo2, pose, name, color) => h('path', {name, d: geo2.outline, transform: T(pose.x, pose.y, pose.rot || 0), fill: color, 'fill-opacity': 0.12, stroke: color, 'stroke-width': 4, 'stroke-dasharray': '14 10', 'stroke-linejoin': 'round', opacity: 0});
    const stages = [true, false].map((linked, i) => annexDesk(ctx, {
      prefix: i ? 'sb' : 'sa', axis, linked, doc,
      annex: {labels: [p.annex.label], title: p.annex.title},
      refTexts: [p.reference], clause: p.linkedClause,
      actors: p.signers, folderLabel: p.folderLabel, sealLabel: p.sealLabel,
      seedKey: 'annex-contrast', chips: false, textScale: AR.textScale, rowMinFrac: AR.rowMinFrac,
      under: geo2 => outline(geo2, i ? geo2.sepPose : geo2.dock1, `mark-${i}`, i ? th.inkSoft : th.accent2),
    }));
    // Junction points in stage coordinates: A = the docked tab eyelet on the
    // margin; B = the gap between the contract edge and the separate annex's tab.
    const junctionLocal = stages.map((st, i) => {
      const eyeA = st.annexPoint(st.dock1, st.annex.eyelet);
      const eyeB = st.annexPoint(st.sepPose, st.annex.eyelet);
      const edge = {x: st.docTL.x + st.dw, y: st.rowMid(st.k1)};
      return i ? {x: (edge.x + eyeB.x) / 2, y: (edge.y + eyeB.y) / 2} : eyeA;
    });
    const gText = p.comparisonLabels.guide;
    const gap = arrangement === 'column' ? 150 : 70;
    const scen = i => (i ? p.scenarioB : p.scenarioA);
    const colors = [th.accent2, th.inkSoft];
    // row: the header holds the scenario texts (top-anchored) and, under them,
    // a free lane for the closing guide chip, well clear of the desk tops
    let header = 180, lanePrb = null, gz = AR.guide, chipMax = 0, textBottomRel = 0;
    if (arrangement === 'row') {
      for (const i of [0, 1]) {
        const hd = panelHeader(ctx, {name: 'probe', letter: 'A', label: scen(i).label, caption: scen(i).caption, x: 0, y: 0, w: stageSize.w, size: AR.label, capSize: AR.caption, color: colors[i]});
        textBottomRel = Math.max(textBottomRel, hd.bottom);
      }
      const span = stageSize.w + gap + junctionLocal[1].x - junctionLocal[0].x;
      if (ctx.show('key')) {
        chipMax = balancedWidth(ctx, gText, Math.min(820, span - 90), gz);
        lanePrb = chip(ctx, gText, {x: 0, y: 0, maxWidth: chipMax, size: gz, maxLines: 2});
      }
      header = Math.max(260, Math.ceil(8 + textBottomRel + 18 + (lanePrb ? lanePrb.box.h : 40) + 48));
    }
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap});
    const lane = 130; // outer lane for the column guide (right of both desks, well clear of their edges)
    const bw = geo.w + (arrangement === 'column' ? lane : 0);
    // footer notes (one at a time, same place): the footer is as tall as the tallest
    const footY = geo.h + 22;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: geo.w / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.92, size: AR.note + 4, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: geo.w / 2, y: footY, maxWidth: bw * 0.95, size: AR.note, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: geo.w / 2, y: footY, maxWidth: bw * 0.95, size: AR.note, name: 'neutral-note'}) : null;
    const footer = Math.max(124, ...[changeChip, shared, neutral].filter(Boolean).map(x => (x.box ? x.box.h : 0) + 40));
    const bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const headers = geo.panels.map((pn, i) => panelHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: scen(i).label, caption: scen(i).caption,
      x: pn.x, y: pn.headerY + 8, w: pn.w, color: colors[i],
      ...(arrangement === 'row' ? {size: AR.label, capSize: AR.caption} : {h: header - 16, legacy: true}),
    }));
    const junction = junctionLocal.map((q, i) => ({x: geo.panels[i].x + q.x, y: geo.panels[i].y + q.y}));
    const ringR = 60;
    // Guide: an orthogonal route through space that is empty in both scenes.
    //  row:    ring A → up the contract margin → lane between headers and desks
    //          → across → down the gap column of B → ring B
    //  column: ring A → up the margin to A's top band → outer lane → B's top band
    //          → down the gap column of B → ring B
    const [pA, pB] = geo.panels;
    const topA = {x: junction[0].x, y: junction[0].y - ringR};
    const topB = {x: junction[1].x, y: junction[1].y - ringR};
    let pts, chipAt;
    if (arrangement === 'row') {
      // the chip sits ON the lane, centred between its two legs (both legs stay
      // visible), under the scenario texts and clear of the desk tops
      const chipTop = pA.headerY + 8 + textBottomRel + 18;
      const laneY = lanePrb ? chipTop + lanePrb.box.h / 2 : (chipTop + pA.y) / 2;
      pts = [topA, {x: topA.x, y: laneY}, {x: topB.x, y: laneY}, topB];
      chipAt = {x: (topA.x + topB.x) / 2, y: chipTop, anchor: 'middle'};
    } else {
      const bandY = 118;
      const outX = geo.w + lane / 2;
      pts = [topA, {x: topA.x, y: pA.y + bandY}, {x: outX, y: pA.y + bandY}, {x: outX, y: pB.y + bandY}, {x: topB.x, y: pB.y + bandY}, topB];
      chipAt = {x: outX - 20, y: pA.y + stageSize.h + 26, anchor: 'end'};
      chipMax = bw * 0.6;
    }
    const guide = routedGuide(ctx, 'guide', pts, 28, th.accent);
    const guideChip = ctx.show('key') ? chip(ctx, gText, {size: gz, ...chipAt, maxWidth: chipMax, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null;
    return {geo, stages, headers, junction, ringR, guide, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, bw};
  },
  build(ctx, L) {
    const ring = (i, dashed) => h('circle', {name: `ring-${i}`, cx: r(L.junction[i].x), cy: r(L.junction[i].y), r: L.ringR, fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 5, 'stroke-dasharray': dashed ? '12 10' : null, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers.map(x => x.node),
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      ring(0, false), ring(1, true),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const v = linked => {
      const o = {linked};
      for (const key of ['reachB', 'slideOut', 'carry', 'glide', 'retreatB', 'highlight', 'reachA', 'penLift', 'write', 'link', 'penBack', 'toStamp', 'stamp', 'retreatA']) o[key] = seg(u, ...W[key]);
      if (!linked) {
        o.link = 0;
        o.highlight = 0;
      }
      return o;
    };
    const a = L.stages[0].pose(v(true));
    const b = L.stages[1].pose(v(false));
    const nodes = {...a.nodes, ...b.nodes};
    const markP = seg(u, ...W.mark) * (1 - seg(u, ...W.markOut));
    nodes['mark-0'] = {opacity: r(markP, 3)};
    nodes['mark-1'] = {opacity: r(markP, 3)};
    const gp = seg(u, ...W.guide);
    Object.assign(nodes, L.guide.frame(gp));
    nodes['ring-0'] = {opacity: r(clamp(gp * 3), 3)};
    nodes['ring-1'] = {opacity: r(clamp(gp * 3), 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.52) / 0.05)), 3)};
    // the shared-facts note leaves before the neutral note arrives in the same
    // place (no cross-fade of two texts)
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.57) / 0.05) * (1 - seg(u, ...W.sharedOut)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = x => ({holder: x.annexHolder, write: x.writeProgress, link: x.linkProgress, seal: x.sealApplied, acrossSeam: x.sealAcrossSeam, highlight: x.highlight});
    return {
      nodes,
      semantic: {
        beat,
        a: pick(a.semantic),
        b: pick(b.semantic),
        annexA: a.semantic.annexCenter,
        annexB: b.semantic.annexCenter,
        penA: a.semantic.penTip,
        penB: b.semantic.penTip,
        handA: a.semantic.handB,
        handB: b.semantic.handB,
        stampA: a.semantic.stampTool,
        stampB: b.semantic.stampTool,
        marks: r(markP, 3),
        reach: {a: a.semantic.allReached, b: b.semantic.allReached},
        allReached: a.semantic.allReached && b.semantic.allReached,
        guideProgress: gp,
        arrangement: L.arrangement,
      },
    };
  },
};

/**
 * Scenario header (letter badge + label + caption), same style as the paired
 * framework header but with a wider label/caption gap so the two text lines
 * never touch at small render sizes. Row headers are top-anchored with explicit
 * sizes (the caption may take two lines); `legacy` keeps the column layout.
 * With labels hidden no badge is drawn (an unlabelled dot carries no meaning).
 */
function panelHeader(ctx, o) {
  const th = ctx.theme;
  const size = o.legacy ? Math.min(56, o.h * 0.36) : o.size;
  const capSize = o.legacy ? size * 0.68 : o.capSize;
  const badgeR = size * 0.78;
  const cy = o.legacy ? o.y + o.h * 0.36 : o.y + badgeR + 4;
  const parts = [];
  let right = o.x;
  let bottom = cy + badgeR;
  if (ctx.show('key')) {
    parts.push(h('circle', {cx: o.x + badgeR, cy, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}));
    parts.push(h('text', {x: o.x + badgeR, y: cy + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter));
    const f = ctx.fit(o.label, {maxWidth: o.w - badgeR * 2 - 24, size, minSize: size * 0.7, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: o.x + badgeR * 2 + 18, y: cy - f.size * 0.62, fill: th.fg}));
    right = Math.max(right, o.x + badgeR * 2 + 18 + f.width);
  }
  if (o.caption && ctx.show('all')) {
    // one line when readable, otherwise two lines (never shrunk below ~0.8 of its size)
    let f2 = ctx.fit(o.caption, {maxWidth: o.w - badgeR * 2 - 24, size: capSize, minSize: Math.max(30, capSize * 0.86), maxLines: 1, weight: 500});
    if (f2.truncated) f2 = ctx.fit(o.caption, {maxWidth: o.w - badgeR * 2 - 24, size: capSize * 0.94, minSize: Math.max(26, capSize * 0.8), maxLines: 2, weight: 500});
    parts.push(textBlock(f2, {x: o.x + badgeR * 2 + 18, y: cy + size * 0.78, fill: th.fgSoft}));
    right = Math.max(right, o.x + badgeR * 2 + 18 + f2.width);
    bottom = Math.max(bottom, cy + size * 0.78 + f2.height + f2.size * 0.25);
  }
  const node = g({name: o.name}, parts);
  return {node, right, bottom: bottom - o.y};
}

/**
 * Chip max width that keeps the same number of lines as `maxWidth` but
 * balances them (no orphan word on the last line).
 */
function balancedWidth(ctx, text, maxWidth, size) {
  const pad = size * 1.2;
  const o = mw => ({maxWidth: mw - pad, size, minSize: size * 0.75, maxLines: 2, weight: 600});
  const f0 = ctx.fit(text, o(maxWidth));
  if (f0.lines.length < 2 || f0.truncated) return maxWidth;
  let lo = size * 3, hi = maxWidth;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    const t = ctx.fit(text, o(mid));
    if (t.truncated || t.lines.length > f0.lines.length || t.size < f0.size - 0.01) lo = mid; else hi = mid;
  }
  return Math.ceil(hi) + 2;
}

/**
 * Orthogonal guide with rounded corners, drawn on progressively (relation
 * style: no arrowhead, end dots once complete).
 */
function routedGuide(ctx, name, pts, radius, color) {
  const segs = [];
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  const samples = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    if (!c) {
      d += `L${r(b.x)} ${r(b.y)}`;
      samples.push(b);
      break;
    }
    const lin = Math.hypot(b.x - a.x, b.y - a.y) || 1, lout = Math.hypot(c.x - b.x, c.y - b.y) || 1;
    const rr = Math.min(radius, lin / 2, lout / 2);
    const p1 = {x: b.x - ((b.x - a.x) / lin) * rr, y: b.y - ((b.y - a.y) / lin) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / lout) * rr, y: b.y + ((c.y - b.y) / lout) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    samples.push(p1);
    for (let k = 1; k <= 6; k++) {
      const t = k / 6;
      samples.push({x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * b.x + t * t * p2.x, y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * b.y + t * t * p2.y});
    }
    segs.push(rr);
  }
  let total = 0;
  for (let i = 1; i < samples.length; i++) total += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
  const end = pts[pts.length - 1];
  const node = g({name},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: r(pts[0].x), cy: r(pts[0].y), r: 6.5, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(end.x), cy: r(end.y), r: 6.5, fill: color, opacity: 0}),
  );
  const frame = pr => ({
    [name]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - pr))},
    [`${name}-dotA`]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: pr >= 0.985 ? 1 : 0},
  });
  return {node, frame, total};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-06-contrast',
    title: 'Annex incorporated — linked vs kept separate',
    titleEs: 'Anexo incorporado — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Anexo incorporado',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical desks run in parallel. Only the join differs: in A the annex docks on the contract margin with its tab at the linked clause, the pen draws the link loop and the seal lands across the seam; in B the annex is laid beside the contract with a gap, no loop is drawn and the seal lands on the annex alone. A closing guide joins the two junctions without stating any outcome.',
    tags: ['annex', 'comparison', 'linked', 'separate', 'clause', 'side-by-side', 'stacked', 'seal'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/anexo-incorporado.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...ANNEX_STRINGS.en}, es: {...ANNEX_STRINGS.es}},
  scene,
});
