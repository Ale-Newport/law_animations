/**
 * LAW-0004 — Firma de documento · inspect
 * Context: the delivered copy lies on party B's folder. A lens isolates the
 * signature block (the detail that distinguishes "pending" from
 * "incorporated"), one datum is substituted inside the enlarged copy
 * (signature drawn, date or printed signer name replaced), a before→after
 * annotation keeps the previous value traceable, and the lens returns to the
 * context, which now shows the new datum and a "changed" marker.
 * Seeking back before the substitution restores the previous datum exactly.
 * @module animations/documents/LAW-0004
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {documentsFields, inspectFields, str} from '../../schemas/fields.js';
import {chip, caption, textBlock} from '../../primitives/annotate.js';
import {paperDocument, signatureMark, stampImpression} from '../../primitives/paper.js';
import {lens} from '../../frameworks/lens.js';
import {signingDesk, STAGE} from './kits/signing-desk.js';

const ID = 'LAW-0004';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  change: [0.5, 0.68], after: [0.62, 0.7], close: [0.76, 0.87], ctxUpdate: [0.8, 0.87], marker: [0.87, 0.94],
};

const STRINGS = {
  en: {signature: 'Signature', date: 'Date', signer: 'Printed name'},
  es: {signature: 'Firma', date: 'Fecha', signer: 'Nombre impreso'},
};

const sceneSchema = {
  ...documentsFields,
  ...inspectFields(['signature', 'date', 'signer']),
  signatureDate: str('Date text printed beside the signature line when the focus is not the date', 30),
  stampLabel: str('Receipt stamp text on the delivered copy', 24),
};

const defaultParams = {
  documentId: 'DOC-104',
  documentTitle: 'Service Agreement',
  clauses: ['Scope of work', 'Fees (hypothetical)', 'Term and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  focusTarget: 'signature',
  beforeValue: 'Pending',
  afterValue: 'Incorporated',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'Delivered copy on Party B’s folder', marker: 'Datum changed'},
  signatureDate: 'Day 3',
  stampLabel: 'RECEIVED',
};

/**
 * overlay: the lens sits inside the desk area vacated by the document (the
 *          context stays full size underneath);
 * stacked: context on top, lens below (used when the free desk area is small).
 */
const LAYOUT = {
  landscape: {axis: 'horizontal', size: [1600, 960], mode: 'overlay'},
  square: {axis: 'horizontal', size: [1600, 960], mode: 'overlay'},
  portrait: {axis: 'vertical', size: [900, 1460], mode: 'overlay'},
};

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const {axis, mode} = LAYOUT[shape];
    const st = STAGE[axis];
    const D = ctx.design;
    const target = p.focusTarget;
    const zoomWanted = p.detailGeometry.zoom;

    // Context stage placement (caption strip of 60 units above the desk)
    const k = mode === 'overlay' ? Math.min((D.h - 60) / st.h, D.w / st.w) : Math.min(D.w / st.w, (D.h * 0.52) / st.h);
    const sx = (D.w - st.w * k) / 2;
    const sy = 60;

    const stage = signingDesk(ctx, {
      prefix: 'ctx', axis,
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      signers: p.signers, stampLabel: p.stampLabel, folderLabel: '', withStamp: true, chips: true, printedName: false,
    });
    const {dw, dh} = stage;
    const pad = dw * 0.09, inner = dw - pad * 2;
    const sigY = dh - pad * 1.25;
    // Detail region in doc-local coordinates: signature line, printed name and date field.
    const region = {x: pad - 14, y: sigY - dh * 0.19, w: inner + 28, h: dh * 0.27};
    const toDesign = q => ({x: sx + q.x * k, y: sy + q.y * k});
    const regTL = toDesign(stage.docPoint('B', {x: region.x, y: region.y}));
    const source = {x: regTL.x, y: regTL.y, w: region.w * k, h: region.h * k};

    // Lens destination
    let dest;
    const ratio = source.h / source.w;
    const stageBox = {x: sx, y: sy, w: st.w * k, h: st.h * k};
    if (mode === 'overlay' && axis === 'horizontal') {
      // free area: left part of the desk, above the resting pen and hand
      const w = Math.min(stageBox.w * 0.47, source.w * zoomWanted);
      dest = {x: stageBox.x + stageBox.w * 0.03, y: stageBox.y + stageBox.h * 0.2, w, h: w * ratio};
    } else if (mode === 'overlay') {
      // free area: lower half of the desk
      const w = Math.min(stageBox.w * 0.92, source.w * zoomWanted);
      dest = {x: stageBox.x + (stageBox.w - w) / 2, y: stageBox.y + stageBox.h * 0.55, w, h: w * ratio};
    } else {
      const w = Math.min(D.w - 40, source.w * zoomWanted);
      dest = {x: (D.w - w) / 2, y: stageBox.y + stageBox.h + 40, w, h: w * ratio};
    }

    // Values: the context starts with the BEFORE datum.
    const dateBefore = target === 'date' ? p.beforeValue : p.signatureDate;
    const dateAfter = target === 'date' ? p.afterValue : p.signatureDate;
    const nameBefore = target === 'signer' ? p.beforeValue : p.signers[0].name;
    const nameAfter = target === 'signer' ? p.afterValue : p.signers[0].name;
    const sigBefore = target === 'signature' ? 0 : 1;

    // Overlay nodes (date field + printed name variants) in doc-local coordinates.
    const overlay = prefix => {
      const dx = pad + inner * 0.7;
      const dwid = inner * 0.3;
      const f = size => ({size, minSize: size * 0.7, maxLines: 1, weight: 600});
      const dl = ctx.fit(t.date, {maxWidth: dwid, ...f(dw * 0.034), weight: 500});
      const d1 = ctx.fit(dateBefore, {maxWidth: dwid, ...f(dw * 0.045)});
      const d2 = ctx.fit(dateAfter, {maxWidth: dwid, ...f(dw * 0.045)});
      const n1 = ctx.fit(nameBefore, {maxWidth: inner * 0.62, ...f(dw * 0.036), weight: 500});
      const n2 = ctx.fit(nameAfter, {maxWidth: inner * 0.62, ...f(dw * 0.036), weight: 500});
      const show = ctx.show('all');
      return g(null,
        h('line', {x1: dx, x2: dx + dwid, y1: sigY, y2: sigY, stroke: th.ink, 'stroke-width': 2.2}),
        show ? textBlock(dl, {x: dx, y: sigY + 8, fill: th.inkSoft}) : null,
        show ? textBlock(d1, {x: dx + 2, y: sigY - d1.size - 6, fill: th.ink, name: `${prefix}-date0`}) : null,
        show ? textBlock(d2, {x: dx + 2, y: sigY - d2.size - 6, fill: th.accent2, name: `${prefix}-date1`, opacity: 0}) : null,
        show ? textBlock(n1, {x: pad, y: sigY + 8, fill: th.inkSoft, name: `${prefix}-name0`}) : null,
        show ? textBlock(n2, {x: pad, y: sigY + 8, fill: th.accent2, name: `${prefix}-name1`, opacity: 0}) : null,
      );
    };

    // Lens content: a second, real copy of the delivered document at the same coordinates.
    const docB = stage.docPoint('B', {x: 0, y: 0});
    const lensDoc = paperDocument(ctx, {prefix: 'lens-doc', w: dw, h: dh, docId: p.documentId, title: p.documentTitle, clauses: p.clauses, signerLabel: '', showText: ctx.show('all'), lineSeed: 'signing-doc'});
    const lensSig = signatureMark(ctx, {name: 'lens-sig', signer: p.signers[0].name, box: stage.doc.sigBox, color: '#1d3f8f', width: 4});
    const lensContent = g({transform: T(sx, sy, 0, k)},
      g({transform: T(docB.x, docB.y)}, lensDoc.node, lensSig.node, overlay('lens'),
        g({transform: T(stage.stampSpotLocal.x, stage.stampSpotLocal.y)}, g({opacity: 0.9}, stampImpressionStatic(ctx, p.stampLabel, dw)))));
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // Single editorial annotation: before → after, with the old value kept visible.
    const label = t[target];
    const annY = dest.y + dest.h + 30;
    const annMax = Math.max(dest.w, Math.min(D.w - 40, 900));
    const beforeChip = ctx.show('key') ? chip(ctx, `${label}: ${p.beforeValue}`, {x: dest.x + dest.w / 2 - 24, y: annY, anchor: 'end', maxWidth: annMax / 2 - 30, size: 34, maxLines: 2, fill: th.card, name: 'ann-before'}) : null;
    const afterChip = ctx.show('key') ? chip(ctx, `${label}: ${p.afterValue}`, {x: dest.x + dest.w / 2 + 24, y: annY, anchor: 'start', maxWidth: annMax / 2 - 30, size: 34, maxLines: 2, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}) : null;
    const arrowY = annY + (beforeChip ? beforeChip.box.h / 2 : 30);
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: sx, y: 6, maxWidth: st.w * k, size: 36, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;

    // Changed-datum marker pinned to the context detail.
    const mk = {x: source.x + source.w, y: source.y};
    let markChip = null;
    if (ctx.show('key')) {
      markChip = chip(ctx, p.contextLabels.marker, {x: mk.x + 28, y: mk.y - 22, maxWidth: 360, size: 26, maxLines: 1, fill: th.card, stroke: th.accent2});
      // keep the marker label inside the frame: flip to the left of the pin when needed
      if (markChip.box.x + markChip.box.w > D.w - 8) markChip = chip(ctx, p.contextLabels.marker, {x: mk.x - 28, y: mk.y - 22, anchor: 'end', maxWidth: 360, size: 26, maxLines: 1, fill: th.card, stroke: th.accent2});
    }
    const marker = g({name: 'marker', opacity: 0},
      h('circle', {cx: mk.x, cy: mk.y, r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    // One strike segment per wrapped line, through that line's x-height, so a
    // two-line old value is struck on both lines (not underlined between them).
    let strikes = [];
    if (beforeChip) {
      const f = beforeChip.fit;
      const padY = 34 * 0.38;
      strikes = f.lines.map((line, i) => {
        const lw = ctx.measure(line, f.size, f.weight, f.family);
        const y = beforeChip.box.y + padY + f.size * 0.8 - f.size * 0.3 + i * f.lineHeight;
        return {len: lw + 8, node: h('line', {name: `ann-strike-${i}`, x1: beforeChip.box.cx - lw / 2 - 4, x2: beforeChip.box.cx + lw / 2 + 4, y1: y, y2: y, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw + 8)} ${r(lw + 18)}`, 'stroke-dashoffset': r(lw + 8)})};
      });
    }
    const strike = strikes.length ? g(null, strikes.map(s => s.node)) : null;

    return {stage, k, sx, sy, source, dest, L2, lensSig, overlay, beforeChip, afterChip, arrowY, ctxCap, marker, strike, strikes, sigBefore, target, docB};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ctxOverlay = g({transform: T(L.sx, L.sy, 0, L.k)}, g({transform: T(L.docB.x, L.docB.y)}, L.overlay('ctx')));
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({transform: T(L.sx, L.sy, 0, L.k)}, L.stage.node),
      ctxOverlay,
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann'},
        L.beforeChip.node, L.strike,
        h('path', {d: `M${r(L.dest.x + L.dest.w / 2 - 14)} ${r(L.arrowY)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    // Context: final state of the action (delivered and stamped); signature per datum.
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const sigCtx = L.target === 'signature' ? ctxUpd : 1;
    const posed = L.stage.pose({approach: 1, write: sigCtx, putDown: 1, toDoc: 1, push: 1, glide: 1, reach: 1, pull: 1, release: 1, stamp: 1});
    Object.assign(nodes, posed.nodes);
    // Lens open / close
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // Lens detail substitution
    const sigLens = L.target === 'signature' ? change : 1;
    Object.assign(nodes, L.lensSig.frame(sigLens));
    // Old value lifts out while the new one settles in, so the two strings are
    // never read as a double exposure.
    const swap = (prefix, key, pr) => {
      if (!ctx.show('all')) return;
      const out = clamp(pr * 2);
      const inn = clamp(pr * 2 - 1);
      nodes[`${prefix}-${key}0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-14 * out)})`};
      nodes[`${prefix}-${key}1`] = {opacity: r(inn, 3), transform: `translate(0 ${r(14 * (1 - inn))})`};
    };
    swap('lens', 'date', L.target === 'date' ? change : 0);
    swap('lens', 'name', L.target === 'signer' ? change : 0);
    swap('ctx', 'date', L.target === 'date' ? ctxUpd : 0);
    swap('ctx', 'name', L.target === 'signer' ? ctxUpd : 0);
    // Annotation
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      // lines are struck one after the other within the strike window
      const sp = seg(u, ...W.strike);
      const n = L.strikes.length;
      L.strikes.forEach((s, i) => { nodes[`ann-strike-${i}`] = {'stroke-dashoffset': r(s.len * (1 - clamp(sp * n - i)))}; });
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
        lensSignature: r(sigLens, 3),
        contextSignature: r(sigCtx, 3),
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        focusTarget: L.target,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        allReached: posed.semantic.allReached,
      },
    };
  },
};

function stampImpressionStatic(ctx, text, dw) {
  // same geometry as the context impression, rendered visible
  const node = stampImpression(ctx, {name: 'lens-impr', text, w: dw * 0.44, rotate: -10, color: ctx.theme.accent, showText: ctx.show('all')});
  node.attrs.opacity = 1;
  return node;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-01-inspect',
    title: 'Document signing — inspect the signature block',
    titleEs: 'Firma de documento — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Firma de documento',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens enlarges the signature block of the delivered copy, substitutes one datum (signature drawn, date or printed name replaced), keeps the previous value traceable, and returns to the context with a changed-datum marker.',
    tags: ['signature', 'inspect', 'lens', 'detail', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/signing-desk.js', 'src/frameworks/lens.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
