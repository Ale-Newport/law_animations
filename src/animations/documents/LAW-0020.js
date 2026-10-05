/**
 * LAW-0020 — Ocultación de datos · inspect
 *
 * Storyboard (context desk → real enlarged copy of one field → substitution):
 *  0.00–0.20  build: the copy lies stamped on the release folder with bands
 *             over the other selected fields; the focused field shows the
 *             BEFORE state (value visible, or fully covered for `extent`).
 *  0.20–0.45  isolate: a lens lifts the focused field (label + value box) out
 *             at its exact source coordinates and enlarges it in free desk
 *             space; the before annotation appears.
 *  0.45–0.75  substitute: inside the lens only, one datum changes — a band
 *             sweeps across the value (`band`) or the band's end retracts so
 *             only part of the value stays covered (`extent`). The before
 *             annotation is struck through but stays readable.
 *  0.75–1.00  return: the (opaque) lens collapses back onto its source and
 *             lands on it carrying the after state, so the context field now
 *             shows it; a changed-datum marker is pinned beside the field,
 *             clear of the resting props. Seeking back restores the before
 *             state exactly.
 *             No validity, responsibility or outcome is inferred.
 * @module animations/documents/LAW-0020
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {inspectFields, int, num, str} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {recordSheet, redactionDesk, redactionDocFields, redactedIndices, REDACTION_STRINGS, STAGE} from './kits/ocultacion-de-datos.js';

const ID = 'LAW-0020';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  change: [0.5, 0.68], after: [0.62, 0.7], close: [0.76, 0.86], ctxUpdate: [0.84, 0.85], marker: [0.87, 0.94],
};

const sceneSchema = {
  ...redactionDocFields,
  ...inspectFields(['band', 'extent']),
  focusField: int('Zero-based index of the field that the lens enlarges', 0, 4),
  partialCover: num('Fraction of the focused value that stays covered after a partial-extent change (extent only)', 0.1, 0.95),
  stampLabel: str('Copy-type stamp impression on the copy', 24),
  folderLabel: str('Label on the folder tab', 40),
};

const defaultParams = {
  documentId: 'REC-2231',
  documentTitle: 'Client Intake Record',
  clauses: ['Client name', 'Home address', 'Account reference', 'Matter summary', 'Fee basis (hypothetical)'],
  fieldValues: ['Alex Moreno', '14 Example Lane, Northtown', 'ACC-0000-1234 (fictional)', 'Equipment lease review', 'Fixed fee of 900 (hypothetical)'],
  signers: [{name: 'Jordan Pike', role: 'Clerk'}, {name: 'Rina Solis', role: 'Reviewer'}],
  redactions: [0, 1],
  focusTarget: 'band',
  focusField: 2,
  beforeValue: 'Visible',
  afterValue: 'Covered by a band',
  partialCover: 0.7,
  detailGeometry: {zoom: 2.8, placement: 'auto'},
  contextLabels: {context: 'Copy on the release folder', marker: 'Datum changed'},
  stampLabel: 'REDACTED COPY',
  folderLabel: 'Copies for release',
};

/** Context stage axis per shape; design = caption strip + stage + annotation strip. */
const LAYOUT = {
  landscape: {axis: 'horizontal', size: [1600, 1080]},
  square: {axis: 'square', size: [1200, 1290]},
  portrait: {axis: 'vertical', size: [900, 1600]},
};
const CAP = 60;
const ANN = 120;

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const {axis} = LAYOUT[shape];
    const st = STAGE[axis];
    const D = ctx.design;
    const n = Math.min(5, p.clauses.length);
    const focus = Math.min(p.focusField, n - 1);
    const others = redactedIndices(p.redactions, n).filter(i => i !== focus);
    const target = p.focusTarget;

    // Annotation strip grows with the before/after chips (up to three lines
    // each), so long values reflow instead of being cut.
    const label = p.clauses[focus] || '';
    const annMax = Math.min(D.w - 40, 1200);
    const half = annMax / 2 - 40;
    const annFit = {maxWidth: half, size: 32, maxLines: 3};
    const annH = ctx.show('key') ? Math.max(...[p.beforeValue, p.afterValue].map(v => chip(ctx, `${label}: ${v}`, {x: 0, y: 0, ...annFit}).box.h)) : 0;
    const ANNh = Math.max(ANN, annH + 40);
    const k = Math.min((D.h - CAP - ANNh) / st.h, D.w / st.w);
    const sx = (D.w - st.w * k) / 2;
    const sy = CAP + Math.max(0, (D.h - CAP - ANNh - st.h * k) / 2);
    const actors = p.signers;
    const stage = redactionDesk(ctx, {
      prefix: 'ctx', axis,
      doc: {docId: p.documentId, title: p.documentTitle, labels: p.clauses, values: p.fieldValues},
      actors, stampLabel: p.stampLabel, folderLabel: p.folderLabel, strokes: [],
    });
    const toDesign = q => ({x: sx + q.x * k, y: sy + q.y * k});

    // Source region = the focused field (label + value box), in design units.
    const fb = stage.fieldBox(focus), lb = stage.labelBox(focus);
    // The whole field: label + the full value box with a margin on both sides,
    // so the band (which fills the box) starts and ends inside the lens and
    // never runs into the lens border.
    const regW = fb.w + 24;
    const regStage = {x: fb.x - 12, y: lb.y - 10, w: regW, h: fb.y + fb.h - lb.y + 22};
    const tl = toDesign(regStage);
    const source = {x: tl.x, y: tl.y, w: regStage.w * k, h: regStage.h * k};
    const stageBox = {x: sx, y: sy, w: st.w * k, h: st.h * k};

    // Lens destination: a wide window across the desk, below the source when
    // there is room (else above), never covering the source itself.
    const ratio = source.h / source.w;
    const lensW = Math.min(D.w - 60, stageBox.w * (axis === 'vertical' ? 1.08 : 0.86), source.w * p.detailGeometry.zoom);
    const lensH = lensW * ratio;
    const margin = 40 * k + 30;
    const below = {y: source.y + source.h + margin, fits: source.y + source.h + margin + lensH <= stageBox.y + stageBox.h - 16};
    const above = {y: source.y - margin - lensH, fits: source.y - margin - lensH >= stageBox.y + 16};
    const pl = p.detailGeometry.placement;
    let destY;
    if (pl === 'top' && above.fits) destY = above.y;
    else if (pl === 'bottom' && below.fits) destY = below.y;
    else if (below.fits) destY = below.y;
    else if (above.fits) destY = above.y;
    else destY = clamp(stageBox.y + stageBox.h - lensH - 16, stageBox.y + 16, D.h - lensH);
    const dest = {x: clamp(source.x + source.w / 2 - lensW / 2, 30, D.w - 30 - lensW), y: destY, w: lensW, h: lensH};

    // Lens content: a second, real copy of the sheet at the same coordinates.
    const lensSheet = recordSheet(ctx, {prefix: 'lens-doc', w: stage.dw, h: stage.dh, docId: p.documentId, title: p.documentTitle, labels: p.clauses, values: p.fieldValues, showText: ctx.show('all'), stampLabel: p.stampLabel, lineSeed: 'redaction-doc'});
    const lensContent = g({transform: T(sx, sy, 0, k)}, g({transform: T(stage.docTL.x, stage.docTL.y)}, lensSheet.node));
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // Before / after states of the focused band (design units in sheet space).
    const full = stage.sheet.fields[focus].band.w;
    const partial = stage.sheet.partialWidth(focus, p.partialCover);
    const beforePx = target === 'band' ? 0 : full;
    const afterPx = target === 'band' ? full : partial;

    // Single editorial annotation: before → after, the old value stays readable.
    const annY = stageBox.y + stageBox.h + 22;
    const beforeChip = ctx.show('key') ? chip(ctx, `${label}: ${p.beforeValue}`, {x: D.w / 2 - 28, y: annY, anchor: 'end', ...annFit, fill: th.card, name: 'ann-before'}) : null;
    const afterChip = ctx.show('key') ? chip(ctx, `${label}: ${p.afterValue}`, {x: D.w / 2 + 28, y: annY, anchor: 'start', ...annFit, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}) : null;
    const arrowY = annY + (beforeChip ? beforeChip.box.h / 2 : 30);
    const ctxCap = ctx.show('all') ? caption(ctx, `${ctx.t.context}: ${p.contextLabels.context}`, {x: sx, y: 8, maxWidth: stageBox.w, size: 34, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;

    // Changed-datum marker pinned to the context field (right end of its box).
    const mk = {x: source.x + source.w, y: source.y + source.h * 0.55};
    // Props resting on the context desk (design units). The datum chip is
    // placed clear of all of them — above all never across the resting marker.
    const toDesignBox = b => ({x: sx + b.x * k, y: sy + b.y * k, w: b.w * k, h: b.h * k});
    const RB = stage.restBoxes;
    const propBoxes = [RB.stamp, RB.handA, RB.handB, RB.chipA, RB.chipB].filter(Boolean).map(toDesignBox);
    const seg0 = RB.markerSegment;
    const markerPts = Array.from({length: 25}, (_, i) => toDesign({x: seg0.a.x + (seg0.b.x - seg0.a.x) * i / 24, y: seg0.a.y + (seg0.b.y - seg0.a.y) * i / 24}));
    const markerR = (seg0.halfWidth + 4) * k;
    const clearOfProps = (b, pad = 10) => propBoxes.every(q => b.x > q.x + q.w + pad || b.x + b.w < q.x - pad || b.y > q.y + q.h + pad || b.y + b.h < q.y - pad)
      && markerPts.every(q => q.x < b.x - markerR - pad || q.x > b.x + b.w + markerR + pad || q.y < b.y - markerR - pad || q.y > b.y + b.h + markerR + pad);
    const insideStage = b => b.x >= stageBox.x + 12 && b.y >= stageBox.y + 12 && b.x + b.w <= stageBox.x + stageBox.w - 12 && b.y + b.h <= stageBox.y + stageBox.h - 12;
    let markChip = null;
    let markLead = null;
    let markChipClear = true;
    if (ctx.show('key')) {
      // beside the check mark, on free desk right of the folder when possible
      const folderRight = sx + (stage.folderTL.x + stage.fw) * k;
      const chipX = Math.max(mk.x + 28, folderRight + 10);
      const mw = Math.min(360, stageBox.x + stageBox.w - chipX - 16);
      const right = mw > 160;
      const probe = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: right ? mw : 360, size: 26, maxLines: 1});
      const cw = probe.box.w, chh = probe.box.h;
      // candidates: beside the check mark (right) or above the field (narrow
      // stages), shifted in steps until the chip is clear of every resting prop
      const steps = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, -8, 8];
      const cands = right
        ? steps.map(i => ({x: chipX, y: mk.y - chh / 2 + i * 34}))
        : [0, 1, 2, 3, 4].flatMap(i => [{x: mk.x - 6 - cw, y: source.y - chh - 16 - i * 34}, {x: mk.x - 6 - cw, y: source.y + source.h + 16 + i * 34}]);
      const boxOf = c => ({x: c.x, y: c.y, w: cw, h: chh});
      const pick = cands.find(c => insideStage(boxOf(c)) && clearOfProps(boxOf(c))) || cands[0];
      markChipClear = clearOfProps(boxOf(pick)) && insideStage(boxOf(pick));
      markChip = chip(ctx, p.contextLabels.marker, {x: pick.x, y: pick.y, maxWidth: right ? mw : 360, size: 26, maxLines: 1, fill: th.card, stroke: th.accent2});
      // a leader keeps a displaced chip attached to its check mark
      const b = markChip.box;
      const qx = clamp(mk.x, b.x, b.x + b.w), qy = clamp(mk.y, b.y, b.y + b.h);
      const d = Math.hypot(qx - mk.x, qy - mk.y);
      if (d > 34) {
        const ux = (qx - mk.x) / d, uy = (qy - mk.y) / d;
        markLead = h('line', {x1: r(mk.x + ux * 22), y1: r(mk.y + uy * 22), x2: r(qx), y2: r(qy), stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round'});
      }
    }
    const marker = g({name: 'marker', opacity: 0},
      markLead,
      h('circle', {cx: mk.x, cy: mk.y, r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    const strike = beforeChip ? h('line', {name: 'ann-strike', x1: beforeChip.box.x + 10, x2: beforeChip.box.x + beforeChip.box.w - 10, y1: beforeChip.box.cy, y2: beforeChip.box.cy, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(beforeChip.box.w)} ${r(beforeChip.box.w + 10)}`, 'stroke-dashoffset': r(beforeChip.box.w)}) : null;

    // Source check: the lens source is exactly the field's region in context.
    const fieldDesign = toDesign({x: fb.x, y: fb.y});
    const fieldEnd = toDesign({x: fb.x + fb.w, y: fb.y + fb.h});
    return {stage, k, sx, sy, source, dest, L2, lensSheet, beforeChip, afterChip, arrowY, ctxCap, marker, strike, target, focus, others, beforePx, afterPx, full, fieldDesign, fieldEnd, D, markChipClear, markChipBox: markChip ? markChip.box : null};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({transform: T(L.sx, L.sy, 0, L.k)}, L.stage.node),
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann'},
        L.beforeChip.node, L.strike,
        h('path', {d: `M${r(L.D.w / 2 - 14)} ${r(L.arrowY)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = ease.inOutSine(seg(u, ...W.ctxUpdate));
    const lensPx = lerp(L.beforePx, L.afterPx, change);
    const ctxPx = lerp(L.beforePx, L.afterPx, ctxUpd);
    // Context: the stamped copy at rest; the other selected fields stay covered.
    const bandsPx = {[L.focus]: ctxPx};
    L.others.forEach(i => { bandsPx[i] = L.stage.sheet.fields[i].band.w; });
    const posed = L.stage.pose({stamp: 1, bandsPx});
    Object.assign(nodes, posed.nodes);
    // Lens copy: same bands, the focused one follows the in-lens substitution.
    L.lensSheet.fields.forEach(f => Object.assign(nodes, L.lensSheet.bandFrame(f.i, f.i === L.focus ? lensPx : L.others.includes(f.i) ? f.band.w : 0)));
    nodes['lens-doc-impr'] = {opacity: 0.92};
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // The lens window stays opaque until it has landed exactly on its source
    // (same content, same coordinates), so opening/closing never cross-fades
    // two offset copies of the field; the context field takes the after state
    // under the landing lens (ctxUpdate ends while the lens still covers it).
    nodes['lens-win'] = {opacity: lp > 0.001 ? 1 : 0};
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.beforeChip.box.w * (1 - seg(u, ...W.strike)))};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const fr = px => r(px / L.full, 3);
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        lensBand: fr(lensPx),
        contextBand: fr(ctxPx),
        beforeBand: fr(L.beforePx),
        afterBand: fr(L.afterPx),
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        contextBands: posed.semantic.bands,
        valuesRemoved: posed.semantic.valuesRemoved,
        focusTarget: L.target,
        focusField: L.focus,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        fieldOrigin: {x: r(L.fieldDesign.x), y: r(L.fieldDesign.y)},
        sourceContainsField: L.fieldDesign.x >= L.source.x && L.fieldDesign.y >= L.source.y && L.fieldDesign.x <= L.source.x + L.source.w && L.fieldDesign.y <= L.source.y + L.source.h,
        // the whole value box (so the whole band) lies inside the lens source
        sourceCoversFieldBox: L.fieldEnd.x <= L.source.x + L.source.w && L.fieldEnd.y <= L.source.y + L.source.h,
        lensClearOfSource: L.dest.y >= L.source.y + L.source.h || L.dest.y + L.dest.h <= L.source.y,
        allReached: posed.semantic.allReached,
        // the changed-datum chip never crosses the resting marker, stamp, hands or actor chips
        // the lens window is either fully opaque or gone (never a cross-fade of two offset copies)
        lensWindow: nodes['lens-win'].opacity,
        datumChipClear: L.markChipClear,
        datumChip: L.markChipBox && {x: r(L.markChipBox.x), y: r(L.markChipBox.y), w: r(L.markChipBox.w), h: r(L.markChipBox.h)},
        stampLines: L.stage.sheet.stampLines,
        lensStampLines: L.lensSheet.stampLines,
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
    slug: 'documents-05-inspect',
    title: 'Data redaction — inspect one field',
    titleEs: 'Ocultación de datos — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Ocultación de datos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens enlarges one field (label + value box) of the stamped copy at its exact source coordinates; inside the lens one datum changes — a band covers the value, or the band retracts to a partial extent — with the previous state kept traceable; the lens returns and the context field updates with a changed-datum marker.',
    tags: ['redaction', 'inspect', 'lens', 'field', 'before-after', 'band', 'extent'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/ocultacion-de-datos.js', 'src/frameworks/lens.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: REDACTION_STRINGS,
  scene,
});
