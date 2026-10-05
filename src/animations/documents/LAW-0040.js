/**
 * LAW-0040 — Custodia del original · inspect
 *
 * Storyboard:
 *  0.00–0.20  context: the state produced by the story — the original sealed
 *             in the closed archive box, the annotated working copy on the
 *             reader's file, pen and stamp put back.
 *  0.20–0.45  a lens (a real second copy of the whole desk, drawn at the SAME
 *             coordinates) grows out of the detail that tells the two sheets
 *             apart: the status mark on the working copy (default) or the
 *             label on the box that holds the original; the rest is dimmed.
 *  0.45–0.75  inside the lens one datum is substituted (beforeValue →
 *             afterValue): the old mark lifts away, then the new one is
 *             pressed in and its ink box re-fits; the before→after note keeps
 *             the old value readable (struck through).
 *  0.75–1.00  the lens folds back onto its source; the context's old datum
 *             lifts out as the lens starts back and the new one is pressed in
 *             only once the lens has faded (no double exposure); a "changed"
 *             pin marks the corner of the new datum. Seeking back restores the
 *             old datum exactly. No validity or consequence is inferred.
 * @module animations/documents/LAW-0040
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {custodyDesk, custodyDocFields, custodyObjectLabels, CUSTODY_STRINGS, STAGE} from './kits/custodia-del-original.js';

const ID = 'LAW-0040';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  change: [0.5, 0.68], after: [0.62, 0.7], close: [0.76, 0.87],
  // the context's old datum lifts out as the lens starts back; the new one is
  // pressed in only once the returning lens has faded (never two values at once)
  ctxOut: [0.76, 0.79], ctxIn: [0.86, 0.9], marker: [0.9, 0.96],
};

const sceneSchema = {
  ...custodyDocFields,
  ...inspectFields(['copyMark', 'boxLabel']),
  objectLabels: custodyObjectLabels,
};
sceneSchema.focusTarget = {...sceneSchema.focusTarget, description: 'Detail that is enlarged and substituted: copyMark (status mark on the working copy) or boxLabel (label of the box holding the original)'};

const defaultParams = {
  documentId: 'DOC-214',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties', 'Goods (hypothetical)', 'Delivery terms'],
  signers: [{name: 'Alex Moreno', role: 'Custodian'}, {name: 'Sam Okafor', role: 'Reader'}],
  redactions: [],
  objectLabels: {box: 'Box 07 · Originals', seal: 'SEALED', copyMark: 'COPY', folder: 'Working file'},
  focusTarget: 'copyMark',
  beforeValue: 'COPY',
  afterValue: 'COPY 2 OF 3',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'Original sealed in the box · working copy on the reader’s file', marker: 'Datum changed'},
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
/**
 * Desk area left free by the final state (stage units) where the lens opens,
 * the lens aspect ratio, and where the before→after note goes.
 */
const FREE = {
  horizontal: {x: 492, y: 104, w: 690, h: 600, ratio: 0.56, notes: 'below'},
  square: {x: 30, y: 108, w: 610, h: 450, ratio: 0.56, notes: 'below'},
  // tall frames: the lens takes most of the desk width between the file and
  // the box; the note goes in the narrow column beside it
  vertical: {x: 24, y: 548, w: 852, h: 316, ratio: 0.5, notes: 'side', noteW: 262, srcScale: 2.6},
};
const FINAL = {toCopy: 1, push: 1, glide: 1, reach: 1, pull: 1, releaseB1: 1, toOrig: 1, carry: 1, sink: 1, withdraw: 1, toLid: 1, close: 1, leaveLid: 1, stampFetch: 1, stamp: 1, stampLeave: 1, toPen: 1, write: 1, putPen: 1};

const scene = {
  sizes: {landscape: [1600, 960], square: [1200, 1170], portrait: [900, 1470]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const D = ctx.design;
    // the context caption may take two lines on narrow frames; reserve its
    // measured height above the desk
    const capLines = axis === 'horizontal' ? 1 : 2;
    const capText = `${t.context}: ${p.contextLabels.context}`;
    const kFor = h0 => Math.min((D.h - h0) / st.h, D.w / st.w);
    const capFor = h0 => (ctx.show('all') ? ctx.fit(capText, {maxWidth: st.w * kFor(h0) - 8, size: 34, maxLines: capLines, weight: 600}) : null);
    const capFit = capFor(capFor(66) ? Math.max(66, capFor(66).height + 24) : 66);
    const capH = capFit ? Math.max(66, capFit.height + 24) : 66;
    const capW = capFit ? st.w * kFor(66) - 8 : 0;
    const k = kFor(capH);
    const sx = (D.w - st.w * k) / 2;
    const sy = capH + (D.h - capH - st.h * k) / 2;
    const toD = q => ({x: sx + q.x * k, y: sy + q.y * k});
    const target = p.focusTarget;

    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const labels = p.objectLabels;
    const copyMarks = target === 'copyMark' ? [p.beforeValue, p.afterValue] : [labels.copyMark];
    const boxLabels = target === 'boxLabel' ? [p.beforeValue, p.afterValue] : [labels.box];
    const mk = prefix => custodyDesk(ctx, {prefix, axis, mode: 'both', doc, parties: p.signers, labels, copyMarks, boxLabels, seedKey: 'inspect'});
    const stage = mk('ctx');
    const lensStage = mk('lz');
    const F = FREE[axis];

    // Source: the detail in the context, in design units.
    let srcStage, detail;
    if (target === 'copyMark') {
      const cs = stage.copySheet;
      const c = stage.copyPoint(cs.idSpot);
      const sw = cs.markW * (F.srcScale ?? 2.1);
      srcStage = {x: c.x - sw / 2, y: c.y - (sw * F.ratio) / 2, w: sw, h: sw * F.ratio};
      detail = c;
    } else {
      const card = stage.lidCard();
      const pad = 16;
      const sw = card.w + pad * 2;
      const shh = Math.max(card.h + pad * 2, sw * F.ratio);
      srcStage = {x: card.x - pad, y: card.y + card.h / 2 - shh / 2, w: sw, h: shh};
      detail = {x: card.x + card.w / 2, y: card.y + card.h / 2};
    }
    const s0 = toD(srcStage);
    const source = {x: s0.x, y: s0.y, w: srcStage.w * k, h: srcStage.h * k};
    const ratio = source.h / source.w;
    // Destination inside the free area, as large as the zoom allows.
    const f0 = toD(F);
    const free = {x: f0.x, y: f0.y, w: F.w * k, h: F.h * k};
    const notesSide = F.notes === 'side';
    // below-notes need ~110 design units under the lens
    // side notes keep a column of their own to the right of the lens
    const room = {w: notesSide ? free.w - ((F.noteW ?? 0) + 26) * k : free.w, h: notesSide ? free.h : free.h - 110 * k};
    let dw = Math.min(room.w, source.w * p.detailGeometry.zoom);
    if (dw * ratio > room.h) dw = room.h / ratio;
    const dh = dw * ratio;
    const pl = p.detailGeometry.placement;
    const dx = pl === 'left' || (notesSide && pl !== 'right') ? free.x : pl === 'right' ? free.x + room.w - dw : free.x + (free.w - dw) / 2;
    const dy = pl === 'top' || notesSide ? free.y + (notesSide ? (free.h - dh) / 2 : 0) : pl === 'bottom' ? free.y + free.h - dh : free.y + (room.h - dh) / 2;
    const dest = {x: dx, y: dy, w: dw, h: dh};

    const stageBox = {x: sx, y: sy, w: st.w * k, h: st.h * k};
    const lensContent = g({transform: T(sx, sy, 0, k)}, lensStage.node);
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // Single editorial annotation: before → after (the old value stays readable).
    const label = t[target];
    let beforeChip = null, afterChip = null, arrow = null;
    if (ctx.show('key')) {
      if (!notesSide) {
        const annY = dest.y + dest.h + 22;
        // the note row may use the whole free width (not just the lens width)
        const cx = dest.x + dest.w / 2;
        const half = Math.min(cx - free.x, free.x + free.w - cx) - 30;
        beforeChip = chip(ctx, `${label}: ${p.beforeValue}`, {x: cx - 26, y: annY, anchor: 'end', maxWidth: half, size: 30, maxLines: 3, fill: th.card, name: 'ann-before'});
        afterChip = chip(ctx, `${label}: ${p.afterValue}`, {x: cx + 26, y: annY, anchor: 'start', maxWidth: half, size: 30, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ay = annY + beforeChip.box.h / 2;
        const ax = dest.x + dest.w / 2 - 13;
        arrow = `M${r(ax)} ${r(ay)}h26m-10 -9l10 9l-10 9`;
      } else {
        const nx = dest.x + dest.w + 26;
        const nw = stageBox.x + stageBox.w - nx - 16;
        beforeChip = chip(ctx, `${label}: ${p.beforeValue}`, {x: nx, y: dest.y + 6, maxWidth: nw, size: 30, maxLines: 3, fill: th.card, name: 'ann-before'});
        const ay = beforeChip.box.y + beforeChip.box.h + 12;
        afterChip = chip(ctx, `${label}: ${p.afterValue}`, {x: nx, y: ay + 34, maxWidth: nw, size: 30, maxLines: 4, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ax = nx + 26;
        arrow = `M${r(ax)} ${r(ay)}v26m-9 -10l9 10l9 -10`;
      }
    }
    const strike = beforeChip ? h('line', {name: 'ann-strike', x1: beforeChip.box.x + 12, x2: beforeChip.box.x + beforeChip.box.w - 12, y1: beforeChip.box.cy, y2: beforeChip.box.cy, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(beforeChip.box.w)} ${r(beforeChip.box.w + 10)}`, 'stroke-dashoffset': r(beforeChip.box.w)}) : null;
    const ctxCap = ctx.show('all') ? caption(ctx, capText, {x: sx, y: 8, maxWidth: Math.min(capW, D.w - sx - 8), size: 34, maxLines: capLines, name: 'ctx-caption', weight: 600}) : null;

    // Changed-datum pin on the corner of the NEW datum's own ink box (copy
    // mark) or of the lid's label card (box label) — on the replaced datum,
    // not on the neighbouring clauses or notes. Its label goes beside the
    // object that carries the datum (never over it), with a short leader.
    const pinLeft = target === 'copyMark';
    let pin;
    if (target === 'copyMark') {
      const cs = stage.copySheet;
      const m1 = cs.marks.mark1 || cs.marks.mark0;
      pin = toD(stage.copyPoint({x: cs.idSpot.x - cs.markW / 2 + 4, y: cs.idSpot.y - m1.h / 2 + 2}));
    } else {
      const card = stage.lidCard();
      pin = toD({x: card.x + card.w - 4, y: card.y + 4});
    }
    let markChip = null, lead = null;
    if (ctx.show('key')) {
      const objBox = target === 'copyMark' ? stage.folderBox : stage.boxBox;
      const ob = {x: toD(objBox).x, y: toD(objBox).y, w: objBox.w * k, h: objBox.h * k};
      const leftSide = target === 'copyMark';
      const cx = leftSide ? ob.x - 18 : ob.x + ob.w + 18;
      const mkAt = y => chip(ctx, p.contextLabels.marker, {x: cx, y, anchor: leftSide ? 'end' : 'start', maxWidth: 360, size: 28, maxLines: 2, fill: th.card, stroke: th.accent2});
      markChip = mkAt(pin.y - 24);
      // keep clear of the before→after note
      const notes = [beforeChip, afterChip].filter(Boolean).map(c => c.box);
      const hits = b => notes.some(n => b.x < n.x + n.w + 10 && b.x + b.w + 10 > n.x && b.y < n.y + n.h + 10 && b.y + b.h + 10 > n.y);
      if (hits(markChip.box)) {
        const top = Math.min(...notes.map(n => n.y)), bottom = Math.max(...notes.map(n => n.y + n.h));
        const up = mkAt(top - 14 - markChip.box.h);
        markChip = !hits(up.box) && up.box.y > stageBox.y + 8 ? up : mkAt(bottom + 14);
      }
      const b = markChip.box;
      lead = h('line', {x1: r(leftSide ? b.x + b.w : b.x), y1: r(b.cy), x2: r(pin.x), y2: r(pin.y), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '6 5'});
    }
    const marker = g({name: 'marker', opacity: 0},
      lead,
      h('circle', {cx: pin.x, cy: pin.y, r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(pin.x)} ${r(pin.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    return {stage, lensStage, k, sx, sy, source, dest, L2, beforeChip, afterChip, arrow, strike, ctxCap, marker, target, detail: toD(detail), hasText: ctx.show('all')};
  },
  build(ctx, L) {
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({transform: T(L.sx, L.sy, 0, L.k)}, L.stage.node),
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {d: L.arrow, fill: 'none', stroke: ctx.theme.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    Object.assign(nodes, L.stage.pose(FINAL).nodes);
    const lensPose = L.lensStage.pose(FINAL);
    Object.assign(nodes, lensPose.nodes);
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    const change = seg(u, ...W.change);
    // context swap: out-phase maps to [0, 0.5], in-phase to [0.5, 1] of `swap`
    const ctxUpd = u < W.ctxIn[0] ? 0.5 * seg(u, ...W.ctxOut) : 0.5 + 0.5 * seg(u, ...W.ctxIn);
    // Old value lifts out first; the new one is then pressed in — never a
    // double exposure in the same place.
    const swap = (prefix, pr) => {
      const out = clamp(pr * 2), inn = clamp(pr * 2 - 1);
      if (L.target === 'copyMark') {
        nodes[`${prefix}-copy-mark0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-16 * ease.outQuad(out))})`};
        nodes[`${prefix}-copy-mark1`] = {opacity: r(ease.outQuad(inn), 3), transform: inn < 1 ? `scale(${r(1.22 - 0.22 * ease.outCubic(inn), 4)})` : ''};
      } else {
        const n0 = `${prefix}-box-label0`, n1 = `${prefix}-box-label1`;
        nodes[n0] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-12 * out)})`};
        nodes[n1] = {opacity: r(inn, 3), transform: `translate(0 ${r(12 * (1 - inn))})`};
      }
    };
    swap('lz', change);
    swap('ctx', ctxUpd);
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
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        lensSwap: r(change, 3),
        contextSwap: r(ctxUpd, 3),
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        focusTarget: L.target,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        detailCenter: {x: r(L.detail.x), y: r(L.detail.y)},
        dest: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
        lidClosed: lensPose.semantic.lidClosed,
        allReached: lensPose.semantic.allReached,
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
    slug: 'documents-10-inspect',
    title: 'Custody of the original — inspect the distinguishing mark',
    titleEs: 'Custodia del original — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Custodia del original',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'After the original is sealed in its box and the working copy reaches the reader, a lens (a real copy of the desk at the same coordinates) enlarges the detail that tells them apart — the status mark on the copy or the label of the box — substitutes one supplied datum, keeps the old value traceable and returns to the context with a changed-datum pin.',
    tags: ['custody', 'inspect', 'lens', 'copy mark', 'box label', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/custodia-del-original.js', 'src/frameworks/lens.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CUSTODY_STRINGS,
  scene,
});
