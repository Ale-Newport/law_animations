/**
 * LAW-0059 — Lectura de sumario · contrast
 *
 * Two complete, identical reading corners (bookcase, search box, reading
 * stand with the summary card on its folded decision text, the researcher
 * holding a hand lens). Exactly ONE fact differs: what the lens reads.
 *  0.00–0.17 base      Identical rest state; same search result lights up.
 *  0.17–0.40 change    A: the lens moves onto the summary printed on the card.
 *                      B: the lens is lowered beside the stand, at the height
 *                      where the decision text will appear.
 *  0.40–0.77 parallel  In both scenes the card is lifted and the text unfolds
 *                      exactly as far as the pointed passage (same timing).
 *                      A's lens rides up with the summary; B's lens slides
 *                      onto the passage, which is highlighted as it is read.
 *  0.77–1.00 guide     A guide joins the two lens positions; neutral note.
 * No winner, score or legal consequence is shown or implied.
 * @module animations/research/LAW-0059
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields, party} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {pairedGeometry, scenarioHeader, neutralNote} from '../../frameworks/paired.js';
import {sumarioContentFields, SUMARIO_STRINGS} from './kits/lectura-de-sumario-fields.js';
import {readingStage, STAGE_COMPACT, balancedWidth, elbowGuide} from './kits/lectura-de-sumario.js';

const ID = 'LAW-0059';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  press: [0.05, 0.11], hit: [0.08, 0.14], tether: [0.1, 0.17], tetherFade: [0.34, 0.4],
  lensOut: [0.19, 0.33], reach: [0.3, 0.4], lift: [0.4, 0.64], lensIn: [0.64, 0.73], mark: [0.7, 0.77],
  changeChip: [0.2, 0.28], guide: [0.78, 0.9],
  // footer notes share one place, so they are strictly sequenced (the old
  // note is fully gone before the next one fades in — no garbled cross-fade)
  changeOut: [0.47, 0.5], sharedIn: [0.51, 0.55], sharedOut: [0.84, 0.865], note: [0.875, 0.93],
};

const sceneSchema = {
  ...sumarioContentFields,
  ...contrastFields(),
  researcher: party,
};

const defaultParams = {
  query: 'notice letter Day 3',
  sources: {library: 'Case library', volume: 'Vol. 12', database: 'Case search (fictional)'},
  citations: {decision: 'FD-118', paragraph: 3},
  dates: {decision: 'Day 12'},
  summaryText: 'The decision discusses the notice letter that Party A sent on Day 3.',
  passageText: 'The panel reviewed the letter dated Day 3 and the reply sent by Party B.',
  researcher: {name: 'Rosa Ibáñez', role: 'Researcher'},
  scenarioA: {label: 'Summary', caption: 'The lens reads the summary on the card'},
  scenarioB: {label: 'Decision text', caption: 'The lens reads the passage it points to'},
  changedFact: 'Only what is read differs: the summary or the decision text',
  sharedFacts: ['Same search', 'Same card', 'Same passage', 'Same unfolding'],
  comparisonLabels: {guide: 'Changed fact: what the lens reads', neutral: 'Two readings side by side — no outcome is stated'},
};

/** Stage axis and arrangement per available shape. */
const ARRANGE = {
  landscape: {axis: 'horizontal', arrangement: 'row'},
  square: {axis: 'vertical', arrangement: 'row'},
  // tall frames stack two short, wide scenes with a larger card, so what each
  // lens reads stays legible on a phone
  portrait: {axis: 'stacked', arrangement: 'column'},
};
/** Lens size and the guide's margin right of the strip, per stage axis. */
const LENS = {horizontal: {r: 50, handle: 72, margin: 60}, vertical: {r: 44, handle: 62, margin: 30}, stacked: {r: 58, handle: 80, margin: 34}};

const scene = {
  sizes: {landscape: [2460, 1200], square: [1580, 1450], portrait: [1260, 1950]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const stageSize = STAGE_COMPACT[axis];
    const header = axis === 'vertical' ? 128 : axis === 'stacked' ? 110 : 136;
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap: arrangement === 'column' ? 76 : 60});
    // footer notes (measured, so a two-line note never leaves the design);
    // rows also keep a band under the floor for the guide and its chip
    const footSize = axis === 'horizontal' ? 40 : 34;
    const noteH = text => (text ? chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: geo.w * 0.94, size: footSize, maxLines: 2}).box.h : 0);
    const notesH = Math.max(noteH(ctx.show('key') && p.changedFact), noteH(ctx.show('all') && p.sharedFacts.length ? `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}` : ''), noteH(ctx.show('all') && p.comparisonLabels.neutral));
    const footer = arrangement === 'row' ? Math.max(260, 150 + notesH + 16) : 22 + notesH + 18;
    const bw = geo.w, bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const content = {
      query: p.query, database: p.sources.database, library: p.sources.library, volume: p.sources.volume,
      decision: p.citations.decision, date: p.dates.decision, summary: p.summaryText, passage: p.passageText,
      paragraph: p.citations.paragraph, cardHeader: ctx.t.summary,
    };
    const LZ = LENS[axis];
    const stages = ['a', 'b'].map(k => readingStage(ctx, {prefix: `s${k}`, axis, mode: 'compact', content, researcher: p.researcher, withLens: true, magnify: k === 'a' ? 'summary' : 'passage', chips: false, lensRadius: LZ.r, lensHandle: LZ.handle}));
    const colors = [th.inkSoft, th.accent2];
    // Header: letter badge + label from the shared framework; the caption is
    // set here one clear line below the label (no descender overlap).
    const headers = geo.panels.map((pn, i) => {
      const sc = i ? p.scenarioB : p.scenarioA;
      const hh = header - 16;
      const size = Math.min(54, hh * 0.4);
      const badgeR = size * 0.78;
      const cap = sc.caption && ctx.show('all')
        ? caption(ctx, sc.caption, {x: pn.x + badgeR * 2 + 18, y: pn.headerY + 8 + hh * 0.42 + size * 0.66, maxWidth: pn.w - badgeR * 2 - 24, size: size * 0.6, minSize: 16, maxLines: 1, fill: th.fgSoft, name: `head-cap-${i}`})
        : null;
      return g(null, scenarioHeader(ctx, {name: `head-${i}`, letter: i ? 'B' : 'A', label: sc.label, x: pn.x, y: pn.headerY + 8, w: pn.w, h: hh, color: colors[i]}), cap && cap.node);
    });
    // Final lens spots: A reads the summary, B the passage (stage → pair coordinates).
    const stA = stages[0], stB = stages[1];
    const pA = geo.panels[0], pB = geo.panels[1];
    const sA = stA.spotAt('summary', stA.finalTop), sB = stB.spotAt('passage', stB.finalTop);
    const spotA = {x: pA.x + sA.x, y: pA.y + sA.y};
    const spotB = {x: pB.x + sB.x, y: pB.y + sB.y};
    // What each lens reads is framed at the end: A the summary on the card
    // (dashed), B the passage of the decision text (solid). A's frame runs
    // from under the header rule to the card's lower edge, so it encloses the
    // whole footer row (date and pointer pill) instead of cutting through it.
    const sumA = stA.cardPart('summary');
    const cardA = stA.cardBox();
    const psgB = stB.blockWorld(stB.target);
    const frameTopA = sumA.y - 6;
    const frameA = {x: pA.x + stA.sx + 6, y: pA.y + frameTopA, w: stA.sw - 12, h: cardA.y + cardA.h + 2 - frameTopA};
    const frameB = {x: pB.x + stB.sx + 6, y: pB.y + psgB.y + 2, w: stB.sw - 12, h: psgB.h - 4};
    // Guide: joins the RIGHT edges of the two framed texts through free space —
    // the right margin of each stage and, for side-by-side panels, the strip
    // under the floor — so it never crosses a person, a screen or printed text.
    const sumRightA = {x: frameA.x + frameA.w, y: frameA.y + frameA.h / 2};
    const psgRightB = {x: frameB.x + frameB.w, y: frameB.y + frameB.h / 2};
    const marginA = pA.x + stA.sx + stA.sw + LZ.margin;
    const marginB = pB.x + stB.sx + stB.sw + LZ.margin;
    const pts = arrangement === 'row'
      ? [sumRightA, {x: marginA, y: sumRightA.y}, {x: marginA, y: pA.y + stA.floor + 14}, {x: marginB, y: pB.y + stB.floor + 14}, {x: marginB, y: psgRightB.y}, psgRightB]
      : [sumRightA, {x: marginA, y: sumRightA.y}, {x: marginA, y: psgRightB.y}, psgRightB];
    const guide = elbowGuide(ctx, {name: 'guide', pts, color: th.accent, width: 4.5});
    let guideChip = null;
    if (ctx.show('key')) {
      const text = p.comparisonLabels.guide;
      if (arrangement === 'row') {
        const size = axis === 'vertical' ? 30 : 36;
        const y0 = geo.panels[0].y + stA.floor + 14;
        const maxW = balancedWidth(ctx, text, Math.min(760, bw * 0.4), size);
        guideChip = chip(ctx, text, {x: (marginA + marginB) / 2, y: y0 + 12, anchor: 'middle', maxWidth: maxW, size, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      } else {
        // in the band between the two scenes, left of the guide's vertical run
        const bandY = geo.panels[0].y + stageSize.h + 8;
        guideChip = chip(ctx, text, {x: marginA - 16, y: bandY, anchor: 'end', maxWidth: balancedWidth(ctx, text, bw * 0.7, 30), size: 30, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      }
    }
    const footY = geo.h + (arrangement === 'row' ? 150 : 22);
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.94, size: footSize, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.94, size: footSize, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.94, size: footSize, name: 'neutral-note'}) : null;
    return {geo, stages, headers, spotA, spotB, frameA, frameB, guide, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, bw};
  },
  build(ctx, L) {
    const frame = (i, b, dashed) => h('path', {name: `frame-${i}`, d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 4.5, 'stroke-dasharray': dashed ? '12 9' : null, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      frame(0, L.frameA, true), frame(1, L.frameB, false),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const common = {
      press: Math.sin(Math.PI * seg(u, ...W.press)), hit: seg(u, ...W.hit), tether: seg(u, ...W.tether), tetherFade: seg(u, ...W.tetherFade),
      reach: seg(u, ...W.reach), lift: seg(u, ...W.lift),
    };
    const lensOut = seg(u, ...W.lensOut);
    const lensIn = seg(u, ...W.lensIn);
    const a = L.stages[0].pose({...common, mark: 0, look: -6 * seg(u, ...W.lift), lens: {from: 'rest', target: 'summary', go: lensOut}});
    const bLens = lensIn > 0 ? {from: 'wait', target: 'passage', go: lensIn} : {from: 'rest', target: 'wait', go: lensOut};
    const b = L.stages[1].pose({...common, mark: seg(u, ...W.mark), look: -6 * seg(u, ...W.lift) + 10 * lensIn, lens: bLens});
    const nodes = {...a.nodes, ...b.nodes};
    const gp = seg(u, ...W.guide);
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    nodes['frame-0'] = {opacity: clamp(gp * 3)};
    nodes['frame-1'] = {opacity: clamp(gp * 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: clamp((gp - 0.5) * 2)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - seg(u, ...W.changeOut)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, ...W.sharedIn) * (1 - seg(u, ...W.sharedOut)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pan = (i, q) => (q ? {x: r(L.geo.panels[i].x + q.x), y: r(L.geo.panels[i].y + q.y)} : null);
    const near = (q, spot) => Boolean(q) && Math.hypot(q.x - spot.x, q.y - spot.y) < 4;
    const lensA = pan(0, a.semantic.lensCenter), lensB = pan(1, b.semantic.lensCenter);
    return {
      nodes,
      semantic: {
        beat,
        arrangement: L.arrangement,
        a: {pagesOpen: a.semantic.pagesOpen, targetPage: a.semantic.targetPage, holder: a.semantic.holder, highlight: a.semantic.highlight, cardTop: a.semantic.cardTop, lensOn: a.semantic.lensOn},
        b: {pagesOpen: b.semantic.pagesOpen, targetPage: b.semantic.targetPage, holder: b.semantic.holder, highlight: b.semantic.highlight, cardTop: b.semantic.cardTop, lensOn: b.semantic.lensOn},
        lensA,
        lensB,
        handA: pan(0, a.semantic.handNear),
        handB: pan(1, b.semantic.handNear),
        gripA: pan(0, a.semantic.cardGrip),
        gripB: pan(1, b.semantic.cardGrip),
        lensGripA: pan(0, a.semantic.lensGrip),
        lensHandA: pan(0, a.semantic.handFar),
        lensGripB: pan(1, b.semantic.lensGrip),
        lensHandB: pan(1, b.semantic.handFar),
        readsA: near(lensA, L.spotA) ? 'summary' : 'moving',
        readsB: near(lensB, L.spotB) ? 'passage' : 'moving',
        allReached: a.semantic.allReached && b.semantic.allReached,
        guideProgress: r(gp, 3),
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
    slug: 'research-05-contrast',
    title: 'Reading a summary — summary vs decision text',
    titleEs: 'Lectura de sumario — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Lectura de sumario',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical reading corners run in parallel: the same summary card is lifted and the decision text unfolds to the same passage. Only what the researcher’s hand lens reads differs — the summary (A) or the passage of the decision text (B). A closing guide joins the two lens positions without any verdict.',
    tags: ['summary', 'sumario', 'comparison', 'decision text', 'hand lens', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/lectura-de-sumario.js', 'src/animations/research/kits/lectura-de-sumario-fields.js', 'src/frameworks/paired.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: SUMARIO_STRINGS,
  scene,
});
