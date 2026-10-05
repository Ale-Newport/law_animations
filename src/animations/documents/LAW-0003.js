/**
 * LAW-0003 — Firma de documento · contrast
 * Two complete, identical signing desks. Exactly one fact differs: in
 * scenario A the pen hovers and is laid down without signing (signature
 * pending); in scenario B the signature is drawn (signature incorporated).
 * Everything else — document, parties, transfer, receipt stamp — runs in
 * parallel identically. The closing guide joins the two signature lines and
 * states no winner, validity or consequence.
 * @module animations/documents/LAW-0003
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {documentsFields, contrastFields, str} from '../../schemas/fields.js';
import {chip, connector} from '../../primitives/annotate.js';
import {signingDesk, STAGE} from './kits/signing-desk.js';
import {pairedGeometry, scenarioHeader, neutralNote} from '../../frameworks/paired.js';

const ID = 'LAW-0003';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  approach: [0.17, 0.22], write: [0.22, 0.37], putDown: [0.37, 0.41], toDoc: [0.41, 0.44],
  push: [0.44, 0.48], glide: [0.48, 0.56], reach: [0.45, 0.545], pull: [0.56, 0.64], release: [0.64, 0.69],
  stamp: [0.6, 0.76], changeChip: [0.2, 0.28], guide: [0.78, 0.9], note: [0.86, 0.94],
};

const sceneSchema = {
  ...documentsFields,
  ...contrastFields(),
  stampLabel: str('Text of the receipt stamp used identically in both scenes', 24),
};

const defaultParams = {
  documentId: 'DOC-104',
  documentTitle: 'Service Agreement',
  clauses: ['Scope of work', 'Fees (hypothetical)', 'Term and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  scenarioA: {label: 'Signature pending', caption: 'The signature line is left blank'},
  scenarioB: {label: 'Signature incorporated', caption: 'The signature is drawn on the line'},
  changedFact: 'Only the signature on the line differs',
  sharedFacts: ['Same document', 'Same parties', 'Same delivery and receipt stamp'],
  comparisonLabels: {guide: 'Changed fact: signature line', neutral: 'Two situations shown side by side — no outcome is stated'},
  stampLabel: 'RECEIVED',
};

/** Stage axis and arrangement per available shape. */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row'},
  square: {axis: 'vertical', arrangement: 'row'},
  portrait: {axis: 'horizontal', arrangement: 'column'},
};

const scene = {
  sizes: {landscape: [2470, 1330], square: [1870, 1630], portrait: [1600, 2280]},
  layout(ctx) {
    const p = ctx.params;
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const stageSize = STAGE[axis];
    const header = 150;
    const footer = 140;
    // Stacked panels get a taller gap: the comparison-guide chip lives there,
    // clear of panel B's header however long its label is.
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap: arrangement === 'column' ? 130 : 70});
    const bw = geo.w, bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const stages = ['a', 'b'].map(k => signingDesk(ctx, {prefix: `s${k}`, axis, doc, signers: p.signers, stampLabel: p.stampLabel, folderLabel: '', withStamp: true}));
    const colors = [ctx.theme.inkSoft, ctx.theme.accent2];
    const headers = geo.panels.map((pn, i) => scenarioHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x, y: pn.headerY + 8, w: pn.w, h: header - 16, color: colors[i],
    }));
    // Signature-line centres of the received documents, in block coordinates.
    const sigLocal = st => ({x: st.doc.sigBox.x + st.doc.sigBox.w * 0.42, y: st.doc.sigBox.y + st.doc.sigBox.h * 0.62});
    const sigPts = stages.map((st, i) => {
      const q = st.docPoint('B', sigLocal(st));
      return {x: geo.panels[i].x + q.x, y: geo.panels[i].y + q.y};
    });
    const ringR = stages[0].doc.sigBox.w * 0.62;
    // Row: a gentle arc between the rings. Column: leave each ring on its right
    // and run down the right margin so the guide never crosses header text.
    const guide = arrangement === 'row'
      ? connector(ctx, {name: 'guide', from: {x: sigPts[0].x + ringR * 0.9, y: sigPts[0].y}, to: {x: sigPts[1].x - ringR * 0.9, y: sigPts[1].y}, kind: 'relation', bend: -0.22, color: ctx.theme.accent})
      : (() => {
        const from = {x: sigPts[0].x + ringR, y: sigPts[0].y};
        const to = {x: sigPts[1].x + ringR, y: sigPts[1].y};
        const mx = bw - 36;
        return connector(ctx, {name: 'guide', from, to, kind: 'relation', color: ctx.theme.accent, c1: {x: mx, y: from.y + (to.y - from.y) * 0.08}, c2: {x: mx, y: to.y - (to.y - from.y) * 0.08}});
      })();
    // Guide chip: between the panels (row) or in the inter-panel band on the right (column).
    const gcPos = arrangement === 'row'
      ? {x: guide.mid.x, y: guide.mid.y - 52, anchor: 'middle'}
      : {x: bw - 10, y: geo.panels[0].y + stageSize.h + 18, anchor: 'end'};
    const guideChip = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {...gcPos, maxWidth: arrangement === 'row' ? 600 : bw * 0.62, size: arrangement === 'row' ? 38 : 34, maxLines: 2, fill: ctx.theme.card, stroke: ctx.theme.accent, name: 'guide-chip'}) : null;
    const footY = geo.h + 22;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.9, size: 44, maxLines: 1, fill: ctx.theme.accentSoft, stroke: ctx.theme.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'neutral-note'}) : null;
    return {geo, stages, headers, sigPts, ringR, guide, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement};
  },
  build(ctx, L) {
    const ring = (i, dashed) => h('ellipse', {name: `ring-${i}`, cx: L.sigPts[i].x, cy: L.sigPts[i].y, rx: L.ringR, ry: L.ringR * 0.42, fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 5, 'stroke-dasharray': dashed ? '12 10' : null, opacity: 0});
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
    const v = signed => ({
      approach: seg(u, ...W.approach),
      write: signed ? seg(u, ...W.write) : 0,
      hover: signed ? 0 : seg(u, ...W.write),
      putDown: seg(u, ...W.putDown),
      toDoc: seg(u, ...W.toDoc),
      push: seg(u, ...W.push),
      glide: seg(u, ...W.glide),
      reach: seg(u, ...W.reach),
      pull: seg(u, ...W.pull),
      release: seg(u, ...W.release),
      stamp: seg(u, ...W.stamp),
    });
    const a = L.stages[0].pose(v(false));
    const b = L.stages[1].pose(v(true));
    const nodes = {...a.nodes, ...b.nodes};
    const gp = seg(u, ...W.guide);
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    nodes['ring-0'] = {opacity: clamp(gp * 3)};
    nodes['ring-1'] = {opacity: clamp(gp * 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: clamp((gp - 0.5) * 2)};
    // footer: changed fact during the change/parallel beats, shared facts, then the neutral note
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    // The three footer notes share one spot, so they hand over strictly in
    // sequence (each is fully out before the next fades in — no garbled overlap).
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - seg(u, 0.48, 0.52)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, 0.53, 0.57) * (1 - seg(u, 0.82, 0.85)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(seg(u, 0.86, 0.92), 3)};
    void noteP;
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        a: {signature: a.semantic.signatureProgress, holder: a.semantic.documentHolder, stamp: a.semantic.stampApplied, doc: a.semantic.documentCenter},
        b: {signature: b.semantic.signatureProgress, holder: b.semantic.documentHolder, stamp: b.semantic.stampApplied, doc: b.semantic.documentCenter},
        docA: a.semantic.documentCenter,
        docB: b.semantic.documentCenter,
        penA: a.semantic.penTip,
        penB: b.semantic.penTip,
        reach: {a: a.semantic.allReached, b: b.semantic.allReached},
        allReached: a.semantic.allReached && b.semantic.allReached,
        guideProgress: gp,
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
    slug: 'documents-01-contrast',
    title: 'Document signing — pending vs incorporated signature',
    titleEs: 'Firma de documento — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Firma de documento',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical desks run in parallel; only the signature differs (left blank in A, drawn in B). Both documents are delivered and stamped the same way. A closing guide links the two signature lines without stating any outcome.',
    tags: ['signature', 'comparison', 'pending', 'document', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/signing-desk.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
