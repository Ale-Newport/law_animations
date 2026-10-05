/**
 * LAW-0027 — Traducción paralela · contrast
 *
 * Storyboard (two complete translation desks, 7.5 s):
 *  0.00–0.17  base: two identical desks — same source page, same translation
 *             with a BLANK slot where the key term goes, same translator and
 *             reviewer, pens and stamps at rest. Nothing differs yet.
 *  0.17–0.40  the one changed fact, introduced locally at the slot:
 *             A "translation available" — the pen writes the equivalent into
 *             the slot (highlighted);
 *             B "term without confirmed equivalent" — the pen writes the
 *             retained source term «…» in a dashed box and adds a "?".
 *  0.40–0.77  both translators draw the same guides pair by pair in parallel
 *             (in B the bracket of the term pair stays dashed); both reviewers
 *             press the same stamp.
 *  0.77–1.00  a comparison guide joins the two slots through text-free lanes;
 *             neutral note. No winner, score, validity or consequence.
 * Side by side on wide boxes, stacked on tall boxes, tall desks side by side
 * on square boxes.
 * @module animations/documents/LAW-0027
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {contrastFields, str} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {pairedGeometry, scenarioHeader, neutralNote} from '../../frameworks/paired.js';
import {translationFields, TP_STRINGS, translationDesk, deskLayout, DESK} from './kits/traduccion-paralela.js';

const ID = 'LAW-0027';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {term: [0.17, 0.4], links: [0.42, 0.68], stamp: [0.64, 0.77], changeChip: [0.19, 0.27], guide: [0.78, 0.9], note: [0.86, 0.94]};

const sceneSchema = {
  ...translationFields,
  ...contrastFields(),
  stampLabel: str('Text of the reviewer stamp pressed identically in both scenes', 22),
};

const defaultParams = {
  documentId: 'TR-208',
  documentTitle: 'Carta de entrega',
  targetTitle: 'Delivery letter',
  languages: {source: 'ES', target: 'EN'},
  clauses: [
    'El proveedor entrega veinte cajas el día 3.',
    'La carga se deja en la lonja del puerto.',
    'Cada parte guarda una copia de esta carta.',
  ],
  translations: [
    'The supplier delivers twenty boxes on day 3.',
    'The load is left at the port fish-market hall.',
    'Each party keeps a copy of this letter.',
  ],
  term: {segment: 1, source: 'lonja', target: 'fish-market hall'},
  signers: [{name: 'Lena Ortiz', role: 'Translator'}, {name: 'Tomás Rivera', role: 'Reviewer'}],
  redactions: [],
  scenarioA: {label: 'Translation available', caption: 'An equivalent of «lonja» is written in the slot'},
  scenarioB: {label: 'Term without confirmed equivalent', caption: 'The slot keeps «lonja» and a question mark'},
  changedFact: 'Only the equivalent of «lonja» differs',
  sharedFacts: ['Same pages and segments', 'Same guides', 'Same translator and reviewer'],
  comparisonLabels: {guide: 'Changed fact: the term slot', neutral: 'Two situations side by side — no outcome is stated'},
  stampLabel: 'ALIGNED',
};

/** Desk geometry and arrangement per available shape. */
const ARRANGE = {
  landscape: {key: 'panel', arrangement: 'row', header: 140, gap: 70, footer: 220},
  square: {key: 'panelTall', arrangement: 'row', header: 130, gap: 56, footer: 200},
  portrait: {key: 'panel', arrangement: 'column', header: 140, gap: 120, footer: 150, margin: 60},
};

const scene = {
  sizes: {landscape: [2470, 1150], square: [1576, 1320], portrait: [1270, 2150]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const A = ARRANGE[ctx.view.shape];
    const G = DESK[A.key];
    const geo = pairedGeometry(ctx, {stage: {w: G.W, h: G.H}, arrangement: A.arrangement, header: A.header, gap: A.gap});
    const bw = geo.w + (A.margin || 0);
    let bh = geo.h + A.footer;
    const L = deskLayout(ctx, A.key, p);
    const links = Array.from({length: L.n}, (_, i) => `link${i}`);
    const common = {key: A.key, p, L, reveal: true, stampLabel: p.stampLabel, chips: false};
    const stages = [
      translationDesk(ctx, {...common, prefix: 'sa', slotVariants: [{key: 'bl', kind: 'blank'}, {key: 'av', kind: 'avail', text: p.term.target, initial: 0}], plans: [['write'], links], dashedTarget: false}),
      translationDesk(ctx, {...common, prefix: 'sb', slotVariants: [{key: 'bl', kind: 'blank'}, {key: 'un', kind: 'unc', initial: 0}], plans: [['write', 'q'], links], dashedTarget: true}),
    ];
    const colors = [th.accent4, th.accent];
    const headers = geo.panels.map((pn, i) => scenarioHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x, y: pn.headerY + 8, w: pn.w, h: A.header - 16, color: colors[i],
    }));
    // write-start times (u) of each pen, so the blank slot fades only once writing starts
    const writeStart = stages.map(st => lerp(W.term[0], W.term[1], st.plans[0].checkpoints[0].start));

    // --- comparison guide between the two slots, through text-free lanes only
    const slots = stages.map((st, i) => st.slotBox && {...st.slotBox, x: st.slotBox.x + geo.panels[i].x, y: st.slotBox.y + geo.panels[i].y});
    let guide = null, guideChip = null, rings = [];
    if (slots[0] && slots[1]) {
      const lane = i => geo.panels[i].x + stages[i].tgtTL.x + L.pageW - L.pad * 0.45;
      const gapY = i => slots[i].y + slots[i].h + L.s * 0.16;
      const end = i => ({x: slots[i].x + slots[i].w - 8, y: slots[i].y + slots[i].h + 3});
      let pts;
      if (A.arrangement === 'row') {
        // below both desks: the lanes run down the translated pages' outer
        // margin (left of the resting pen hand), then join under the desks
        const bandY = geo.h + 18;
        pts = [end(0), {x: end(0).x, y: gapY(0)}, {x: lane(0), y: gapY(0)}, {x: lane(0), y: bandY}, {x: lane(1), y: bandY}, {x: lane(1), y: gapY(1)}, {x: end(1).x, y: gapY(1)}, end(1)];
      } else {
        const outX = geo.panels[0].x + G.W + (A.margin || 60) * 0.5;
        pts = [end(0), {x: end(0).x, y: gapY(0)}, {x: lane(0), y: gapY(0)}, {x: outX, y: gapY(0)}, {x: outX, y: gapY(1)}, {x: lane(1), y: gapY(1)}, {x: end(1).x, y: gapY(1)}, end(1)];
      }
      const pl = polyline(pts);
      const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
      guide = {pl, d, pts};
      // each ring encloses the slot AND its pen marks (the "?" of B sits at the
      // slot's right end) with clear room on the sides, so no mark is crossed
      // punctuation glued to the slot (e.g. the final full stop) is enclosed
      // too, so the ring never runs through a mark or a glyph
      const seg = L.pages.target.segs[L.k];
      let gluedEnd = 0;
      for (let li = 0; seg && li < seg.lines.length; li++) {
        const items = seg.lines[li].items;
        const si = items.findIndex(it => it.kind === 'special');
        if (si < 0) continue;
        const tail = items[si].lines > 1 ? (seg.lines[li + 1] || {items: []}).items : items.slice(si + 1);
        for (const it of tail) { if (!it.glue) break; gluedEnd = L.pages.target.colX + it.x + it.w; }
        break;
      }
      rings = slots.map((sl, i) => {
        const q = stages[i].markPolys.q;
        const qx1 = q ? Math.max(...q.poly.pts.map(pt => pt.x)) + geo.panels[i].x + 8 : 0;
        const gx1 = gluedEnd ? stages[i].tgtTL.x + gluedEnd + geo.panels[i].x + 4 : 0;
        const x1 = Math.max(sl.x + sl.w + 5, qx1, gx1);
        return {x: sl.x - 9, y: sl.y - 7, w: x1 - sl.x + 9, h: sl.h + 14};
      });
      if (ctx.show('key')) {
        guideChip = A.arrangement === 'row'
          ? chip(ctx, p.comparisonLabels.guide, {x: bw / 2, y: geo.h + 44, anchor: 'middle', maxWidth: bw * 0.8, size: 36, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'})
          : chip(ctx, p.comparisonLabels.guide, {x: bw - (A.margin || 0) * 0.5 - 16, y: geo.panels[0].y + G.H + 16, anchor: 'end', maxWidth: bw * 0.9, size: 34, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
        if (A.arrangement === 'row') guide.stem = {x: bw / 2, y0: pts[3].y, y1: guideChip.box.y}; // bw / 2 lies in the gap between the panels
      }
    }
    // footer: changed fact, then shared facts, then the neutral note (same slot, never simultaneous)
    // bottom-anchored so a two-line note still ends inside the block; below
    // the desks (row arrangement) the notes stay under the comparison-guide
    // chip, which is visible at the same time: the block grows if needed
    const noteMakers = [
      y => neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y, maxWidth: bw * 0.95, size: 34}),
      y => neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y, maxWidth: bw * 0.95, size: 34}),
    ];
    if (guideChip && A.arrangement === 'row') {
      const noteH = Math.max(...noteMakers.map(m => m(0).box.h));
      bh = Math.max(bh, guideChip.box.y + guideChip.box.h + 16 + noteH + 6);
    }
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const bottomChip = (make) => { const probe = make(0); return make(bh - probe.box.h - 6); };
    const changeChip = ctx.show('key') ? bottomChip(y => chip(ctx, p.changedFact, {x: bw / 2, y, anchor: 'middle', maxWidth: bw * 0.9, size: 40, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'})) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? bottomChip(y => neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y, maxWidth: bw * 0.95, size: 34, name: 'shared-note'})) : null;
    const neutral = ctx.show('all') ? bottomChip(y => neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y, maxWidth: bw * 0.95, size: 34, name: 'neutral-note'})) : null;
    return {geo, stages, headers, guide, guideChip, rings, changeChip, shared, neutral, s, ox, oy, arrangement: A.arrangement, writeStart, bw, bh};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      L.rings.map((rg, i) => h('path', {name: `ring-${i}`, d: roundRectPath(rg.x, rg.y, rg.w, rg.h, 12), fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': i ? '12 8' : null, opacity: 0})),
      L.guide && h('path', {name: 'cmp-guide', d: L.guide.d, fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(L.guide.pl.total)} ${r(L.guide.pl.total + 10)}`, 'stroke-dashoffset': r(L.guide.pl.total)}),
      L.guide && L.guide.stem && h('line', {name: 'cmp-stem', x1: r(L.guide.stem.x), x2: r(L.guide.stem.x), y1: r(L.guide.stem.y0), y2: r(L.guide.stem.y1), stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '4 6', opacity: 0}),
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const penTerm = seg(u, ...W.term);
    const penLinks = seg(u, ...W.links);
    const stamp = seg(u, ...W.stamp);
    const posed = L.stages.map((st, i) => st.pose({
      pen: [penTerm, penLinks],
      stamp,
      slot: {bl: 1 - clamp((u - L.writeStart[i]) / 0.025), [i ? 'un' : 'av']: u >= L.writeStart[i] ? 1 : 0},
    }));
    const nodes = {...posed[0].nodes, ...posed[1].nodes};
    const gp = seg(u, ...W.guide);
    if (L.guide) {
      nodes['cmp-guide'] = {'stroke-dashoffset': r(L.guide.pl.total * (1 - ease.inOutSine(gp)))};
      nodes['ring-0'] = {opacity: r(clamp(gp * 4), 3)};
      nodes['ring-1'] = {opacity: r(clamp(gp * 4 - 2.6), 3)};
      if (L.guide.stem) nodes['cmp-stem'] = {opacity: gp >= 0.6 ? 1 : 0};
    }
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.6) / 0.4), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.5) / 0.05)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.55) / 0.05) * (1 - noteP), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const slotState = i => (u < L.writeStart[i] ? 'blank' : i ? 'unconfirmed' : 'available');
    const view = i => {
      const s = posed[i].semantic;
      return {slot: slotState(i), write: s.write, question: s.question, linked: s.linked, links: s.links, stamp: s.stampApplied, penTip: s.penTip};
    };
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        a: view(0),
        b: view(1),
        penA: posed[0].semantic.penTip,
        penB: posed[1].semantic.penTip,
        stampA: posed[0].semantic.stampTool,
        stampB: posed[1].semantic.stampTool,
        handA: posed[0].semantic.handPen,
        gripA: posed[0].semantic.penGrip,
        handB: posed[1].semantic.handPen,
        gripB: posed[1].semantic.penGrip,
        strokeA: posed[0].semantic.strokeEnd,
        strokeB: posed[1].semantic.strokeEnd,
        reach: {a: posed[0].semantic.allReached, b: posed[1].semantic.allReached},
        allReached: posed[0].semantic.allReached && posed[1].semantic.allReached,
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
    slug: 'documents-07-contrast',
    title: 'Parallel translation — equivalent available vs not confirmed',
    titleEs: 'Traducción paralela — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Traducción paralela',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical translation desks start with a blank term slot. In A the pen writes the equivalent; in B it writes the retained source term in a dashed box and a question mark (the bracket of that pair stays dashed). Both then link every segment pair and stamp the translation the same way; a comparison guide joins the two slots without stating any outcome.',
    tags: ['translation', 'comparison', 'term', 'equivalent', 'guides', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/traduccion-paralela.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: TP_STRINGS,
  scene,
});
