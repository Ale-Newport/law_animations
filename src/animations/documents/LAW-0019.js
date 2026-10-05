/**
 * LAW-0019 — Ocultación de datos · contrast
 *
 * Storyboard (two complete, identical desks; one changed fact):
 *  0.00–0.17  base: the same filled-in record on the same folder in A and B,
 *             marker and stamp resting on each desk.
 *  0.17–0.40  change: only in B the marker is picked up and opaque bands start
 *             covering the selected value boxes (or, with `scenarioBMode:
 *             'outline'`, the boxes are outlined instead). In A the marker
 *             stays on the desk — the full copy keeps every value readable.
 *  0.40–0.77  parallel: B finishes and lays the marker down; then both
 *             reviewers carry the SAME stamp into the copy-type box at the
 *             same time (shared fact).
 *  0.77–1.00  guide: rings around the same field in A and B joined by a
 *             neutral guide; shared facts, then a neutral note. No winner,
 *             score or legal consequence is shown.
 * @module animations/documents/LAW-0019
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields, str, oneOf} from '../../schemas/fields.js';
import {chip, connector} from '../../primitives/annotate.js';
import {pairedGeometry, scenarioHeader, neutralNote} from '../../frameworks/paired.js';
import {redactionDesk, redactionDocFields, redactedIndices, STAGE} from './kits/ocultacion-de-datos.js';

const ID = 'LAW-0019';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  pick: [0.16, 0.21], work: [0.21, 0.45], stow: [0.45, 0.5], withdraw: [0.5, 0.54],
  stamp: [0.52, 0.76], changeChip: [0.2, 0.28], changeOut: [0.49, 0.52], sharedIn: [0.53, 0.57], sharedOut: [0.84, 0.88], guide: [0.78, 0.9], note: [0.89, 0.94],
};

const sceneSchema = {
  ...redactionDocFields,
  ...contrastFields(),
  scenarioBMode: oneOf('What the marker does to the selected fields in scenario B: cover them with opaque bands, or only outline them', ['cover', 'outline']),
  stampLabel: str('Copy-type stamp used identically in both scenes', 24),
  folderLabel: str('Label on both folder tabs', 40),
};

const defaultParams = {
  documentId: 'REC-2231',
  documentTitle: 'Client Intake Record',
  clauses: ['Client name', 'Home address', 'Account reference', 'Matter summary', 'Fee basis (hypothetical)'],
  fieldValues: ['Alex Moreno', '14 Example Lane, Northtown', 'ACC-0000-1234 (fictional)', 'Equipment lease review', 'Fixed fee of 900 (hypothetical)'],
  signers: [{name: 'Jordan Pike', role: 'Clerk'}, {name: 'Rina Solis', role: 'Reviewer'}],
  redactions: [0, 1, 2],
  scenarioA: {label: 'Full copy', caption: 'Every value stays readable'},
  scenarioB: {label: 'Redacted copy', caption: 'Selected values covered by bands'},
  changedFact: 'Only the bands over the selected values differ',
  sharedFacts: ['Same record', 'Same field layout', 'Same copy stamp'],
  comparisonLabels: {guide: 'Changed fact: value visible or covered', neutral: 'Two copies shown side by side — no outcome is stated'},
  scenarioBMode: 'cover',
  stampLabel: 'COPY',
  folderLabel: 'Copies for release',
};

/** Stage axis and arrangement per available shape. */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row'},
  square: {axis: 'vertical', arrangement: 'row'},
  portrait: {axis: 'horizontal', arrangement: 'column'},
};

const scene = {
  sizes: {landscape: [2470, 1330], square: [1870, 1630], portrait: [1600, 2220]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const stageSize = STAGE[axis];
    const header = 150;
    const footer = 140;
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap: 70});
    const bw = geo.w, bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const n = Math.min(5, p.clauses.length);
    const idx = redactedIndices(p.redactions, n);
    const doc = {docId: p.documentId, title: p.documentTitle, labels: p.clauses, values: p.fieldValues};
    const modeB = p.scenarioBMode === 'outline' ? 'outline' : 'cover';
    const stages = ['a', 'b'].map(k => redactionDesk(ctx, {
      prefix: `s${k}`, axis, doc, actors: p.signers, stampLabel: p.stampLabel, folderLabel: p.folderLabel,
      strokes: k === 'b' ? idx.map(field => ({field, mode: modeB})) : [],
      // stacked: the guide runs down the right side, so both reviewer chips move left
      chipBLeft: arrangement === 'column',
    }));
    // The changed detail: the first selected field, in block coordinates.
    const focus = idx.length ? idx[0] : 0;
    // Rings hug the field (label + value box) without touching the rows
    // above/below: margins shrink to the gap between neighbouring rows.
    const nFields = stages[0].sheet.fields.length;
    const rings = stages.map((st, i) => {
      const b = st.fieldBox(focus);
      const l = st.labelBox(focus);
      const pn = geo.panels[i];
      const below = focus + 1 < nFields ? st.labelBox(focus + 1).y - (b.y + b.h) : 40;
      const above = focus > 0 ? l.y - (st.fieldBox(focus - 1).y + st.fieldBox(focus - 1).h) : 40;
      const mb = clamp(below / 2 - 1, 3, 14), mt = clamp(above / 2 - 1, 3, 12);
      return {x: pn.x + b.x - 16, y: pn.y + l.y - mt, w: b.w + 32, h: b.y + b.h - l.y + mt + mb};
    });
    const row = arrangement === 'row';
    // Row: straight between the facing sides. Column: around the right side of
    // both sheets so the guide never crosses A's other rows.
    const from = {x: rings[0].x + rings[0].w, y: rings[0].y + rings[0].h / 2};
    const to = row ? {x: rings[1].x, y: rings[1].y + rings[1].h / 2} : {x: rings[1].x + rings[1].w, y: rings[1].y + rings[1].h / 2};
    // Column: bulge out to the right only as far as keeps the guide clear of
    // A's resting marker (the cubic reaches 0.25·from + 0.75·bulge at most).
    const tipX = geo.panels[0].x + stages[0].restTip.x;
    const bulge = row ? null : clamp((tipX - 44 - 0.25 * from.x) / 0.75, Math.max(from.x, to.x) + 30, Math.max(from.x, to.x) + stageSize.w * 0.2);
    const guide = connector(ctx, {name: 'guide', from, to, kind: 'relation', bend: -0.2, color: th.accent,
      ...(row ? {} : {c1: {x: bulge, y: from.y + (to.y - from.y) * 0.08}, c2: {x: bulge, y: to.y - (to.y - from.y) * 0.08}})});
    // Scenario headers. Stacked: the guide runs down the right side through
    // B's header strip, so both headers' text ends left of the guide there
    // (same width for A and B; long titles shrink within the framework bound).
    let headerW = geo.panels[0].w;
    let guideGap = Infinity;
    if (!row) {
      const hb = geo.panels[1];
      const band = [hb.headerY, hb.headerY + header];
      const xs = Array.from({length: 241}, (_, i) => guide.at(i / 240)).filter(q => q.y >= band[0] - 20 && q.y <= band[1] + 20).map(q => q.x);
      if (xs.length) headerW = Math.min(headerW, Math.min(...xs) - 28 - hb.x);
      guideGap = xs.length ? Math.min(...xs) - (hb.x + headerW) : Infinity;
    }
    const colors = [th.accent2, th.inkSoft];
    const headers = geo.panels.map((pn, i) => scenarioHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x, y: pn.headerY + 8, w: headerW, h: header - 16, color: colors[i],
    }));
    // Row: the chip stays between A's sheet and B's folder, so it never
    // covers either record (it may cross the desk frames in the gap).
    const st0 = stages[0], st1 = stages[1];
    const freeL = geo.panels[0].x + Math.max(st0.docTL.x + st0.dw, st0.folderTL.x + st0.fw) + 14;
    const freeR = geo.panels[1].x + Math.min(st1.docTL.x, st1.folderTL.x) - 14;
    // Column: on A's free desk area right of the sheet, between the stamp and
    // the resting marker, its left edge beside the guide (never over B's header).
    const colL = Math.max(from.x, to.x, 0.25 * from.x + 0.75 * (bulge ?? 0)) + 14;
    const colR = stageSize.w - 24;
    const gcMax = row ? Math.min(520, freeR - freeL) : colR - colL;
    const gcProbe = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: gcMax, size: 38, minSize: 26, maxLines: 3}).box : null;
    const colTop = geo.panels[0].y + stages[0].stampRest.y + 70;
    const colBot = geo.panels[0].y + stages[0].restTip.y - 30;
    const gcPos = row
      ? {x: (freeL + freeR) / 2, y: Math.min(from.y, to.y) - 200, anchor: 'middle'}
      : {x: colL, y: gcProbe ? Math.max(colTop, Math.min(colBot - gcProbe.h, (colTop + colBot - gcProbe.h) / 2)) : colTop, anchor: 'start'};
    const guideChip = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {...gcPos, maxWidth: gcMax, size: 38, minSize: 26, maxLines: 3, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null;
    const footY = geo.h + 22;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.9, size: 44, maxLines: 1, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'neutral-note'}) : null;
    return {geo, stages, headers, rings, guide, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, focus, idx, modeB, headerW, guideGap};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ring = (i, dashed) => h('rect', {name: `ring-${i}`, x: L.rings[i].x, y: L.rings[i].y, width: L.rings[i].w, height: L.rings[i].h, rx: 18, fill: 'none', stroke: th.accent, 'stroke-width': 6, 'stroke-dasharray': dashed ? '14 10' : null, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      ring(0, true), ring(1, false),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const shared = {stamp: seg(u, ...W.stamp)};
    const a = L.stages[0].pose({...shared});
    const b = L.stages[1].pose({...shared, pick: seg(u, ...W.pick), work: seg(u, ...W.work), stow: seg(u, ...W.stow), withdraw: seg(u, ...W.withdraw)});
    const nodes = {...a.nodes, ...b.nodes};
    const gp = seg(u, ...W.guide);
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    nodes['ring-0'] = {opacity: clamp(gp * 3)};
    nodes['ring-1'] = {opacity: clamp(gp * 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: clamp((gp - 0.5) * 2)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    // The footer notes share one spot, so each fades out completely before
    // the next fades in (never two texts cross-fading in the same place).
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - seg(u, ...W.changeOut)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, ...W.sharedIn) * (1 - seg(u, ...W.sharedOut)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = sem => ({bands: sem.bands, marks: sem.marks, removed: sem.valuesRemoved, marker: sem.markerHolder, stamp: sem.stampApplied, labels: sem.labelsKept});
    return {
      nodes,
      semantic: {
        beat,
        a: pick(a.semantic),
        b: pick(b.semantic),
        markerA: a.semantic.markerTip,
        markerB: b.semantic.markerTip,
        handA1: a.semantic.handA,
        handB1: b.semantic.handA,
        stampA: a.semantic.stampTool,
        stampB: b.semantic.stampTool,
        nibB: b.semantic.nib,
        bandEdgeB: b.semantic.bandEdge,
        reach: {a: a.semantic.allReached, b: b.semantic.allReached},
        allReached: a.semantic.allReached && b.semantic.allReached,
        focusField: L.focus,
        selected: L.idx,
        modeB: L.modeB,
        guideProgress: gp,
        // footer notes (same spot): at most one is visible at any time
        footerNotesVisible: [L.changeChip ? nodes['change-chip'].opacity : 0, L.shared ? nodes['shared-note'].opacity : 0, L.neutral ? nodes['neutral-note'].opacity : 0].filter(o => o > 0).length,
        arrangement: L.arrangement,
        // stacked: gap between the scenario header text box and the guide where it passes the header strip
        guideHeaderGap: Number.isFinite(L.guideGap) ? Math.round(L.guideGap) : null,
        stampLines: L.stages[0].sheet.stampLines,
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
    slug: 'documents-05-contrast',
    title: 'Data redaction — full copy vs redacted copy',
    titleEs: 'Ocultación de datos — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Ocultación de datos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical desks with the same record. Only in B does a marker lay opaque bands over the selected value boxes (or outline them); A keeps the full copy. Both copies then receive the same copy-type stamp in parallel. A neutral guide joins the same field in both scenes without stating any outcome.',
    tags: ['redaction', 'comparison', 'full copy', 'redacted copy', 'record', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/ocultacion-de-datos.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
