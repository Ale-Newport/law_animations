/**
 * LAW-0007 — Sellado de copia · contrast
 *
 * Storyboard (two complete registry desks, 7.5 s default):
 *  0.00–0.17  base: two identical desks (same original, copy, pad, stamp,
 *             people); nothing differs yet.
 *  0.17–0.40  change: in A the clerk takes the stamp, inks it and carries it
 *             over the copy (dashed landing target on A's copy only); in B
 *             the stamp stays on its rest. Both clerks steady their copy
 *             identically.
 *  0.40–0.77  parallel: A's stamp is lowered, pressed and returned — the mark
 *             exists only on A's copy. Both copies are then slid onto the
 *             file and both originals drawn back at the same instants.
 *  0.77–1.00  guide: rings around A's mark and around the SAME spot on B's
 *             filed copy, joined by a plain relation guide; a neutral note.
 *             No winner, score, validity or consequence is stated.
 * Footer (one shared spot, strictly sequential, never cross-faded): changed
 * fact 0.19–0.54, shared facts 0.56–0.86, neutral note from 0.88.
 * The changed fact alters the sequence (stamp step present / absent) and the
 * objects (mark present / absent), not only text or colour.
 * @module animations/documents/LAW-0007
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {documentsFields, contrastFields, str} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {stampingDesk, pairBanner, DESK} from './kits/sellado-de-copia.js';

const ID = 'LAW-0007';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
/** Shared windows (both desks) and A-only stamp windows. */
const W = {
  steady: [0.24, 0.32], file: [0.62, 0.7], steadyRelease: [0.7, 0.77], retrieve: [0.63, 0.72],
  reach: [0.17, 0.22], ink: [0.22, 0.3], carry: [0.3, 0.38], descend: [0.4, 0.46], press: [0.46, 0.5],
  lift: [0.5, 0.54], back: [0.54, 0.61], release: [0.61, 0.66],
  guide: [0.78, 0.9],
  // footer notes share one spot, so their windows are strictly sequential (no
  // cross-fade): change chip in, then out; shared facts in, then out; neutral in
  changeChip: [0.19, 0.26], changeOut: [0.5, 0.54],
  sharedIn: [0.56, 0.61], sharedOut: [0.82, 0.86], note: [0.88, 0.94],
};

const sceneSchema = {
  ...documentsFields,
  ...contrastFields(),
  stampLabel: str('Legend of the stamp impression used in scenario A', 24),
};

const defaultParams = {
  documentId: 'DOC-218',
  documentTitle: 'Lease Agreement',
  clauses: ['Premises', 'Rent (hypothetical)', 'Duration and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  scenarioA: {label: 'Marked copy', caption: 'The stamp is lowered onto the copy'},
  scenarioB: {label: 'Unmarked copy', caption: 'The stamp stays on its rest'},
  changedFact: 'Only whether the stamp touches the copy differs',
  sharedFacts: ['Same document', 'Same people', 'Same filing'],
  comparisonLabels: {guide: 'Changed fact: mark on the copy', neutral: 'Two situations side by side — no outcome is stated'},
  stampLabel: 'COPY',
};

/** Stage axis and arrangement per available shape. */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row'},
  square: {axis: 'vertical', arrangement: 'row'},
  portrait: {axis: 'horizontal', arrangement: 'column'},
};

const scene = {
  sizes: {landscape: [2470, 1400], square: [1870, 1700], portrait: [1600, 2330]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const stageSize = DESK[axis];
    const footer = ctx.view.shape === 'landscape' ? 200 : 150;
    const colors = [th.accent2, th.accent3];
    // scenario banners: long labels and captions wrap (two lines each) instead of
    // being cut; both scenarios share one header band tall enough for either
    const banner = (i, x, y) => pairBanner(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x, y, w: stageSize.w, color: colors[i],
    });
    const header = Math.max(150, ...[0, 1].map(i => banner(i, 0, 0).h + 16));
    // stacked desks leave a wider band between them: the guide chip sits there
    const gap = arrangement === 'column' ? 110 : 70;
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap});
    const bw = geo.w;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const stages = ['a', 'b'].map(k => stampingDesk(ctx, {prefix: `s${k}`, axis, doc, signers: p.signers, stampLabel: p.stampLabel, folderLabel: ''}));
    const headers = geo.panels.map((pn, i) => banner(i, pn.x, pn.headerY + 8).node);
    // The same spot on each filed copy, in block coordinates.
    const spots = stages.map((st, i) => {
      const q = st.copyPoint('filed', st.markLocal);
      return {x: geo.panels[i].x + q.x, y: geo.panels[i].y + q.y};
    });
    const st0 = stages[0];
    const ring = {w: st0.sw + 56, h: st0.sh + 56, rot: 2 + st0.markRot};
    const row = arrangement === 'row';
    // Comparison guide (a plain relation) routed so it crosses no sheet or label:
    //  side by side (16:9, 1:1) → out of each ring to the desk's free right margin
    //    (between the file and the desk edge, clear of the actor chips), down that
    //    margin and along the band under both desks; the changed fact sits on the band;
    //  stacked (9:16) → straight down the right side from A's ring to B's ring.
    const route = row ? 'below' : 'down';
    const half = {x: ring.w * 0.54, y: ring.h * 0.58};
    let pts;
    let gcPos;
    const gcMax = route === 'down' ? bw * 0.6 : 760;
    if (route === 'below') {
      const yb = geo.panels[0].y + stageSize.h + 40;
      const folderRight = st0.folderC.x + st0.fw / 2 + 10;
      const chipRight = Math.max(0, ...st0.chipBoxes.filter(b => b.y > st0.copyFiled.y).map(b => b.x + b.w + 12));
      const marginX = Math.min(stageSize.w - 8, Math.max((folderRight + stageSize.w) / 2, chipRight));
      const xa = geo.panels[0].x + marginX, xb = geo.panels[1].x + marginX;
      pts = [
        {x: spots[0].x + half.x, y: spots[0].y}, {x: xa, y: spots[0].y}, {x: xa, y: yb},
        {x: xb, y: yb}, {x: xb, y: spots[1].y}, {x: spots[1].x + half.x, y: spots[1].y},
      ];
      gcPos = {x: (xa + xb) / 2, y: yb, anchor: 'middle', center: true};
    } else {
      const xr = Math.max(spots[0].x, spots[1].x) + half.x + 34;
      pts = [{x: spots[0].x + half.x, y: spots[0].y}, {x: xr, y: spots[0].y}, {x: xr, y: spots[1].y}, {x: spots[1].x + half.x, y: spots[1].y}];
      gcPos = {x: xr - 30, y: geo.panels[0].y + stageSize.h, anchor: 'end', band: gap};
    }
    const guide = bracketGuide(ctx, 'guide', pts, th.accent);
    let guideChip = null;
    let footY = geo.h + (route === 'below' ? 92 : 26);
    if (ctx.show('key')) {
      // the changed fact is never cut: it may wrap to two lines ('down' keeps one
      // line on a wider chip, as it sits in the band above scenario B's header)
      const lines = route === 'down' ? 1 : 2;
      const spec = {x: gcPos.x, y: gcPos.y, anchor: gcPos.anchor, maxWidth: route === 'down' ? bw * 0.8 : gcMax, size: 40, maxLines: lines, fill: th.card, stroke: th.accent, name: 'guide-chip'};
      guideChip = chip(ctx, p.comparisonLabels.guide, spec);
      const twoLines = guideChip.fit.lines.length > 1;
      if (gcPos.center && !(twoLines && route === 'below')) {
        // centred on the guide line (the line runs behind the chip)
        guideChip = chip(ctx, p.comparisonLabels.guide, {...spec, y: gcPos.y - guideChip.box.h / 2});
      } else if (gcPos.band) {
        // centred in the band between desk A and scenario B's header
        guideChip = chip(ctx, p.comparisonLabels.guide, {...spec, y: gcPos.y + (gcPos.band - guideChip.box.h) / 2});
      } else if (route === 'below') {
        // two lines: hang the chip just under the guide line, footer notes move down
        guideChip = chip(ctx, p.comparisonLabels.guide, {...spec, y: gcPos.y + 12});
        footY = Math.max(footY, guideChip.box.y + guideChip.box.h + 16);
      }
    }
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.9, size: 46, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 42, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 42, name: 'neutral-note'}) : null;
    // the block grows to hold the tallest footer note (long captions wrap to two lines)
    const noteBottom = Math.max(...[changeChip, shared, neutral].filter(Boolean).map(c => c.box.y + c.box.h), geo.h);
    const bh = Math.max(geo.h + footer, noteBottom + 16);
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    return {geo, stages, headers, spots, ring, guide, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ringNode = (i, dashed) => h('path', {
      name: `ring-${i}`, d: roundRectPath(-L.ring.w / 2, -L.ring.h / 2, L.ring.w, L.ring.h, 26),
      transform: T(L.spots[i].x, L.spots[i].y, L.ring.rot), fill: 'none', stroke: th.accent, 'stroke-width': 6,
      'stroke-dasharray': dashed ? '14 11' : null, opacity: 0,
    });
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      ringNode(0, false), ringNode(1, true),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const shared = {
      steady: seg(u, ...W.steady), file: seg(u, ...W.file), steadyRelease: seg(u, ...W.steadyRelease), retrieve: seg(u, ...W.retrieve),
    };
    const stampA = {
      reach: seg(u, ...W.reach), ink: seg(u, ...W.ink), carry: seg(u, ...W.carry), descend: seg(u, ...W.descend),
      press: seg(u, ...W.press), lift: seg(u, ...W.lift), back: seg(u, ...W.back), release: seg(u, ...W.release),
    };
    const a = L.stages[0].pose({...shared, ...stampA});
    const b = L.stages[1].pose({...shared});
    const nodes = {...a.nodes, ...b.nodes};
    const gp = seg(u, ...W.guide);
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    nodes['ring-0'] = {opacity: r3(clamp(gp * 3))};
    nodes['ring-1'] = {opacity: r3(clamp(gp * 3))};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r3(clamp((gp - 0.5) * 2))};
    // footer: the changed fact, then the shared facts, then the neutral note
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    const footer = {
      change: L.changeChip ? r3(cp * (1 - seg(u, ...W.changeOut))) : 0,
      shared: L.shared ? r3(seg(u, ...W.sharedIn) * (1 - seg(u, ...W.sharedOut))) : 0,
      neutral: L.neutral ? r3(noteP) : 0,
    };
    if (L.changeChip) nodes['change-chip'] = {opacity: footer.change};
    if (L.shared) nodes['shared-note'] = {opacity: footer.shared};
    if (L.neutral) nodes['neutral-note'] = {opacity: footer.neutral};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const sa = a.semantic, sb = b.semantic;
    return {
      nodes,
      semantic: {
        beat,
        a: {marked: sa.markApplied, stampOn: sa.stampOn, stampHeld: sa.stampHeld, copy: sa.copyHolder, original: sa.originalHolder},
        b: {marked: sb.markApplied, stampOn: sb.stampOn, stampHeld: sb.stampHeld, copy: sb.copyHolder, original: sb.originalHolder},
        copyA: sa.copyCenter, copyB: sb.copyCenter,
        originalA: sa.originalCenter, originalB: sb.originalCenter,
        stampA: sa.stampTool, stampB: sb.stampTool,
        handStampA: sa.handStamp, handSteadyA: sa.handSteady, handSteadyB: sb.handSteady,
        copyGripA: sa.copyGrip, copyGripB: sb.copyGrip, markSpotA: sa.markSpot,
        reach: {a: sa.allReached, b: sb.allReached},
        allReached: sa.allReached && sb.allReached,
        guideProgress: gp,
        footer,
        arrangement: L.arrangement,
      },
    };
  },
};

const r3 = v => Math.round(v * 1000) / 1000;

/**
 * Orthogonal guide path with draw-on progress and end dots (a plain relation:
 * no arrowhead, so it states no direction or consequence).
 */
function bracketGuide(ctx, name, pts, color) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${Math.round(q.x * 10) / 10} ${Math.round(q.y * 10) / 10}`).join('');
  const a = pts[0], b = pts[pts.length - 1];
  const node = g({name},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${Math.round(total)} ${Math.round(total + 10)}`, 'stroke-dashoffset': Math.round(total)}),
    h('circle', {name: `${name}-dotA`, cx: a.x, cy: a.y, r: 8, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: b.x, cy: b.y, r: 8, fill: color, opacity: 0}),
  );
  const frame = (p, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r3(total * (1 - p))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame, total};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-02-contrast',
    title: 'Copy stamping — marked vs unmarked copy',
    titleEs: 'Sellado de copia — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Sellado de copia',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical registry desks run in parallel. Only in scenario A is the stamp taken, inked and lowered onto the copy; in B it stays on its rest. Both copies are filed and both originals drawn back identically. A closing guide links A’s mark with the same, empty spot on B’s copy without stating any outcome.',
    tags: ['stamp', 'copy', 'comparison', 'marked', 'unmarked', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/sellado-de-copia.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
