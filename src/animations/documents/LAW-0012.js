/**
 * LAW-0012 — Apertura de expediente · inspect
 *
 * Storyboard:
 *  0.00–0.20  Context: the state produced by opening the file — cover open,
 *             documents laid out in layers, index ticked, opening stamp — on
 *             the clerk's desk.
 *  0.20–0.45  Isolate: a lens lifts a real copy of the detail that tells
 *             "complete file" from "document absent" (the header strip of the
 *             focus document, or the file-number tab) at its exact source
 *             coordinates; the rest of the desk dims.
 *  0.45–0.75  Substitute one datum inside the lens only: the focus document's
 *             sheet slides out of the stack leaving its dashed slot (or slides
 *             in), or its heading / the file number is replaced. A before →
 *             after annotation keeps the previous value readable (struck out).
 *  0.75–1.00  Return: the lens closes onto the source; the context now shows
 *             the new datum and its dependent state (the index tick of that
 *             entry) plus a "changed" marker. No validity or outcome is drawn.
 * Seeking back before the substitution restores the previous datum exactly.
 * @module animations/documents/LAW-0012
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, r} from '../../core/time.js';
import {inspectFields, int, bool, str} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {caseFileDesk, caseFileFields, CASE_STRINGS, STAGE} from './kits/apertura-de-expediente.js';

const ID = 'LAW-0012';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  change: [0.5, 0.68], after: [0.62, 0.7], close: [0.76, 0.87], ctxUpdate: [0.8, 0.87], marker: [0.87, 0.94],
};

const sceneSchema = {
  ...caseFileFields,
  ...inspectFields(['document', 'heading', 'fileNumber']),
  focusDocument: int('Zero-based index of the document whose presence or heading is inspected', 0, 4),
  documentPresentAfter: bool('For focusTarget "document": false = the document is removed (present → absent); true = it is added (absent → present)'),
  stampLabel: str('Text of the opening stamp on the index sheet', 24),
};

const defaultParams = {
  documentId: 'EXP-0417',
  documentTitle: 'Registration request',
  clauses: ['Application form', 'Identity document copy', 'Supporting letter', 'Fee receipt (hypothetical)'],
  signers: [{name: 'Dana Ruiz', role: 'Clerk'}, {name: 'Sam Okafor', role: 'Applicant'}],
  redactions: [],
  focusTarget: 'document',
  focusDocument: 2,
  documentPresentAfter: false,
  beforeValue: 'In the file',
  afterValue: 'Listed, not in the file',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'Opened file with its documents in layers', marker: 'Datum changed'},
  stampLabel: 'OPENED',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
/** Lens candidates per axis (fractions of the desk box); the first that clears the source wins. */
const DEST = {
  horizontal: [{at: 'bottom-left', maxW: 0.5}, {at: 'top-left', maxW: 0.34}],
  square: [{at: 'top-left', maxW: 0.64}, {at: 'bottom-left', maxW: 0.5}],
  vertical: [{at: 'top', maxW: 0.92}, {at: 'bottom', maxW: 0.92}],
};

const scene = {
  sizes: {landscape: [1600, 960], square: [1200, 1160], portrait: [900, 1460]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const D = ctx.design;
    // a long context caption takes two lines; the stage then starts lower
    const capText = `${t.context}: ${p.contextLabels.context}`;
    const k0 = Math.min((D.h - 60) / st.h, D.w / st.w);
    const capTwoLines = ctx.show('all') && ctx.fit(capText, {maxWidth: st.w * k0, size: 34, minSize: 26, maxLines: 1, weight: 600}).truncated;
    const sy = capTwoLines ? 96 : 60;
    const k = Math.min((D.h - sy) / st.h, D.w / st.w);
    const sx = (D.w - st.w * k) / 2;
    const toDesign = q => ({x: sx + q.x * k, y: sy + q.y * k});
    const target = p.focusTarget;
    const docs = p.clauses.map((title, i) => ({title, redacted: p.redactions.includes(i)}));
    const fd = Math.min(p.focusDocument, docs.length - 1);
    const applicant = p.signers[1].role ? `${p.signers[1].role}: ${p.signers[1].name}` : p.signers[1].name;
    const common = {
      axis,
      file: {number: target === 'fileNumber' ? p.beforeValue : p.documentId, title: p.documentTitle, applicantLine: applicant,
        docs: docs.map((d, i) => (target === 'heading' && i === fd ? {...d, title: p.beforeValue} : d))},
      clerk: p.signers[0], stampLabel: p.stampLabel, withStamp: true,
      swapLayer: target === 'document' ? fd : -1,
      altTitle: target === 'heading' ? {index: fd, text: p.afterValue} : null,
      altNumber: target === 'fileNumber' ? p.afterValue : undefined,
    };
    // context desk (with the clerk's resting arms) and a real copy for the lens
    const stage = caseFileDesk(ctx, {...common, prefix: 'ctx', clerkCaption: p.signers[0].role ? `${p.signers[0].name} · ${p.signers[0].role}` : p.signers[0].name});
    const copy = caseFileDesk(ctx, {...common, prefix: 'lc', withArms: false, clerkCaption: null, swapSlide: true});

    // detail region (stage units)
    let region;
    if (target === 'fileNumber') {
      const tr = stage.tabRect;
      region = {x: tr.x - 16, y: tr.y - 12, w: tr.w + 32, h: tr.h + 26};
    } else {
      const tl = stage.layerWorld(fd, {x: 0, y: 0});
      // starts just above the sheet's top edge so no clipped fragment of the
      // heading of the layer above enters the lens
      // the whole strip width, so the heading is never cut at the lens edge
      region = {x: tl.x - 16, y: tl.y - 8, w: stage.dw + 28, h: stage.stripH + 20};
    }
    const srcTL = toDesign(region);
    const source = {x: srcTL.x, y: srcTL.y, w: region.w * k, h: region.h * k};
    const stageBox = {x: sx, y: sy, w: st.w * k, h: st.h * k};
    const ratio = source.h / source.w;
    const clears = d => d.y > source.y + source.h + 24 || d.y + d.h < source.y - 24 || d.x > source.x + source.w + 24 || d.x + d.w < source.x - 24;
    let dest = null;
    for (const c of DEST[axis]) {
      const w = Math.min(stageBox.w * c.maxW, source.w * p.detailGeometry.zoom);
      const hh = w * ratio;
      const m = stageBox.w * 0.025;
      const d = c.at === 'bottom-left' ? {x: stageBox.x + m, y: stageBox.y + stageBox.h - m - hh}
        : c.at === 'top-left' ? {x: stageBox.x + m, y: stageBox.y + stageBox.h * 0.04}
          : c.at === 'top' ? {x: stageBox.x + (stageBox.w - w) / 2, y: stageBox.y + stageBox.h * 0.1}
            : {x: stageBox.x + (stageBox.w - w) / 2, y: stageBox.y + stageBox.h * 0.62};
      dest = {...d, w, h: hh};
      if (clears(dest)) break;
    }
    const lensContent = g({transform: T(sx, sy, 0, k)}, copy.node);
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // single editorial annotation: before → after (previous value kept, struck out)
    const label = target === 'document' ? `${t.document} ${fd + 1}` : target === 'heading' ? `${t.title} ${fd + 1}` : t.fileNumber;
    const annAt = axis === 'horizontal' ? {x: toDesign({x: 1405, y: 0}).x, y: toDesign({x: 0, y: 150}).y, w: 350 * k, stack: true}
      : axis === 'square' ? (dest.y < stageBox.y + stageBox.h / 2
        ? {x: dest.x + dest.w + (stageBox.x + stageBox.w - dest.x - dest.w) / 2, y: dest.y + 6, w: stageBox.x + stageBox.w - dest.x - dest.w - 30, stack: true}
        : {x: stageBox.x + stageBox.w * 0.25, y: stageBox.y + 24, w: stageBox.w * 0.42, stack: true})
        // portrait: the empty desk band above the folder, whichever end the lens takes
        : {x: stageBox.x + stageBox.w / 2, y: stageBox.y + 16, w: stageBox.w - 40, stack: false};
    const size = 30;
    let beforeChip = null, afterChip = null, arrow = null;
    if (ctx.show('key')) {
      if (annAt.stack) {
        beforeChip = chip(ctx, `${label}: ${p.beforeValue}`, {x: annAt.x, y: annAt.y, anchor: 'middle', maxWidth: annAt.w, size, maxLines: 3, fill: th.card, name: 'ann-before'});
        const ay = beforeChip.box.y + beforeChip.box.h + 8;
        arrow = h('path', {d: `M${r(annAt.x)} ${r(ay)}v26m-9 -10l9 10l9 -10`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
        afterChip = chip(ctx, `${label}: ${p.afterValue}`, {x: annAt.x, y: ay + 36, anchor: 'middle', maxWidth: annAt.w, size, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      } else {
        const half = annAt.w / 2 - 30;
        beforeChip = chip(ctx, `${label}: ${p.beforeValue}`, {x: annAt.x - 24, y: annAt.y, anchor: 'end', maxWidth: half, size, minSize: 22, maxLines: 3, fill: th.card, name: 'ann-before'});
        afterChip = chip(ctx, `${label}: ${p.afterValue}`, {x: annAt.x + 24, y: annAt.y, anchor: 'start', maxWidth: half, size, minSize: 22, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ay = annAt.y + beforeChip.box.h / 2;
        arrow = h('path', {d: `M${r(annAt.x - 14)} ${r(ay)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
      }
    }
    // the previous value stays readable but is struck through line by line
    let strike = null, strikeLen = 0;
    if (beforeChip) {
      const f = beforeChip.fit, b = beforeChip.box;
      const segs = f.lines.map((line, i) => {
        const lw = ctx.measure(line, f.size, 600, 'sans');
        return {x0: b.cx - lw / 2 - 6, x1: b.cx + lw / 2 + 6, y: b.y + size * 0.38 + i * f.lineHeight + f.size * 0.5};
      });
      strikeLen = segs.reduce((acc, q) => acc + q.x1 - q.x0, 0);
      strike = h('path', {name: 'ann-strike', d: segs.map(q => `M${r(q.x0)} ${r(q.y)}H${r(q.x1)}`).join(''), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(strikeLen)} ${r(strikeLen + 10)}`, 'stroke-dashoffset': r(strikeLen)});
    }
    const ctxCap = ctx.show('all') ? caption(ctx, capText, {x: sx, y: 6, maxWidth: st.w * k, size: 34, minSize: capTwoLines ? 24 : 26, maxLines: capTwoLines ? 2 : 1, name: 'ctx-caption', weight: 600}) : null;

    // changed-datum marker pinned to the source detail
    // pinned on the detail's left edge: the chip then lies over the lower
    // layers' bare left edges / the opened cover, never over a heading
    const mk = {x: source.x, y: source.y + source.h / 2};
    let markChip = null;
    if (ctx.show('key')) {
      markChip = chip(ctx, p.contextLabels.marker, {x: mk.x - 28, y: mk.y - 22, anchor: 'end', maxWidth: 360, size: 26, maxLines: 1, fill: th.card, stroke: th.accent2});
      if (markChip.box.x < 8) markChip = chip(ctx, p.contextLabels.marker, {x: mk.x + 28, y: mk.y - 22, maxWidth: 360, size: 26, maxLines: 1, fill: th.card, stroke: th.accent2});
    }
    const marker = g({name: 'marker', opacity: 0},
      h('circle', {cx: r(mk.x), cy: r(mk.y), r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    const presentBefore = target === 'document' ? !p.documentPresentAfter : true;
    return {stage, copy, k, sx, sy, source, dest, L2, beforeChip, afterChip, arrow, strike, strikeLen, ctxCap, marker, target, fd, presentBefore, n: docs.length,
      lensAligned: JSON.stringify(stage.layerWorld(fd, {x: 0, y: 0})) === JSON.stringify(copy.layerWorld(fd, {x: 0, y: 0}))};
  },
  build(ctx, L) {
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({transform: T(L.sx, L.sy, 0, L.k)}, L.stage.node),
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann'}, L.beforeChip.node, L.strike, L.arrow, L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const tgt = L.target;
    // presence of the focus document (1 = in the file)
    const pres = q => (L.presentBefore ? 1 - q : q);
    const done = {approach: 1, reachCover: 1, lift: 1, fall: 1, toPen: 1, reachIndex: 1, spread: 1, toStamp: 1, stamp: 1, backR: 1, ticks: 1, penDown: 1, withdrawL: 1};
    const tickFor = present => [...Array(L.n)].map((_, i) => (tgt === 'document' && i === L.fd ? present : 1));
    const ctxPresent = tgt === 'document' ? pres(ctxUpd) : 1;
    const lensPresent = tgt === 'document' ? pres(change) : 1;
    const a = L.stage.pose({...done, present: ctxPresent, tickValues: tickFor(ctxPresent), titleSwap: tgt === 'heading' ? ctxUpd : 0, numberSwap: tgt === 'fileNumber' ? ctxUpd : 0});
    const b = L.copy.pose({...done, present: lensPresent, tickValues: tickFor(lensPresent), titleSwap: tgt === 'heading' ? change : 0, numberSwap: tgt === 'fileNumber' ? change : 0});
    Object.assign(nodes, a.nodes, b.nodes);
    // lens open / close
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // annotation
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.strikeLen * (1 - seg(u, ...W.strike)))};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        focusTarget: tgt,
        lensPresent: r(lensPresent, 3),
        contextPresent: r(ctxPresent, 3),
        lensSwap: r(tgt === 'document' ? Math.abs(lensPresent - (L.presentBefore ? 1 : 0)) : change, 3),
        contextSwap: r(ctxUpd, 3),
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        contextTicks: a.semantic.ticks,
        lensTicks: b.semantic.ticks,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        lensAligned: L.lensAligned,
        allReached: a.semantic.allReached,
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
    slug: 'documents-03-inspect',
    title: 'Opening a case file — inspect one layer',
    titleEs: 'Apertura de expediente — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Apertura de expediente',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens lifts a real copy of one layer strip (or the file-number tab) of the opened case file. Inside the lens one datum is substituted — the document slides out leaving its dashed slot, or its heading / the file number is replaced — with the previous value kept readable; the context then shows the new datum, its dependent index tick and a changed marker.',
    tags: ['case file', 'inspect', 'lens', 'layer', 'absent document', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/apertura-de-expediente.js', 'src/frameworks/lens.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CASE_STRINGS,
  scene,
});
