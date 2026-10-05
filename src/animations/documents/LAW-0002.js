/**
 * LAW-0002 — Firma de documento · mechanism
 * Decomposes signing into components: signer, pen, a separable signature
 * layer, the document body, the receiving folder and the recipient. The
 * signature layer lifts out of the sheet it belongs to, connectors anchored
 * to real edges state each relationship by kind (relation / sequence /
 * communication — no arrow for plain relations), and a tracer follows the
 * supplied traversal order. The part that changes — the signature layer,
 * empty → signed — updates only when the tracer passes the pen.
 * @module animations/documents/LAW-0002
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {documentsFields, mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag, textBlock} from '../../primitives/annotate.js';
import {paperDocument, signatureMark, pen, shade} from '../../primitives/paper.js';
import {personBadge, iconBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {roundRectPath} from '../../core/geometry.js';

const ID = 'LAW-0002';
const DURATION = 7000;
const IDS = ['signer', 'pen', 'signature', 'document', 'folder', 'recipient'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const sceneSchema = {
  ...documentsFields,
  ...mechanismFields(IDS),
};
// relationships may carry their own caption
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'DOC-104',
  documentTitle: 'Service Agreement',
  clauses: ['Scope of work', 'Fees (hypothetical)', 'Term and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  elements: [
    {id: 'signer', label: 'Signer (Party A)'},
    {id: 'pen', label: 'Pen'},
    {id: 'signature', label: 'Signature layer'},
    {id: 'document', label: 'Document body'},
    {id: 'folder', label: 'Party B file'},
    {id: 'recipient', label: 'Recipient (Party B)'},
  ],
  relationships: [
    {from: 'signer', to: 'pen', kind: 'relation', label: 'holds'},
    {from: 'pen', to: 'signature', kind: 'sequence', label: 'traces the mark'},
    {from: 'signature', to: 'document', kind: 'relation', label: 'belongs to'},
    {from: 'document', to: 'folder', kind: 'communication', label: 'delivered'},
    {from: 'folder', to: 'recipient', kind: 'relation', label: 'kept by'},
  ],
  focusElement: 'signature',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['signer', 'pen', 'signature', 'document', 'folder', 'recipient'],
};

/** Hand-placed component positions per shape (centres, design units). */
const PLACES = {
  landscape: {size: [1900, 1030], signer: [150, 640], pen: [440, 330], signature: [930, 150], document: [950, 630], folder: [1460, 630], recipient: [1770, 640], legend: [950, 1005]},
  square: {size: [1400, 1330], signer: [140, 760], pen: [340, 390], signature: [790, 150], document: [790, 740], folder: [1210, 1110], recipient: [1250, 650], legend: [700, 1305]},
  portrait: {size: [960, 1720], signer: [160, 180], pen: [490, 180], signature: [690, 450], document: [480, 930], folder: [270, 1440], recipient: [720, 1440], legend: [480, 1690]},
};
const DOC = {w: 400, h: 520};
const LAYER = {w: 460, h: 170};

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const Pl = PLACES[ctx.view.shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const at = id => ({x: Pl[id][0], y: Pl[id][1]});

    // --- document body (the signature line is the slot the layer belongs to)
    const dw = DOC.w, dh = DOC.h;
    const docC = at('document');
    const doc = paperDocument(ctx, {prefix: 'body', w: dw, h: dh, docId: p.documentId, title: p.documentTitle, clauses: p.clauses, signerLabel: '', showText: ctx.show('all'), lineSeed: 'signing-doc'});
    const redact = (p.redactions || []).filter(i => i < doc.clauseBoxes.length).map(i => {
      const b = doc.clauseBoxes[i];
      return h('rect', {x: b.x - 3, y: b.y - 2, width: b.w + 6, height: Math.min(b.h - 4, 44), rx: 3, fill: th.ink});
    });
    const docBox = {x: docC.x - dw / 2, y: docC.y - dh / 2, w: dw, h: dh};
    const slot = {x: doc.sigBox.x - 14, y: doc.sigBox.y - 6, w: doc.sigBox.w + 24, h: doc.sigBox.h + 30};
    const docNode = g({name: 'el-document', transform: T(docBox.x, docBox.y)}, g({name: 'el-document-body'},
      doc.node, redact,
      h('path', {name: 'slot-ghost', d: roundRectPath(slot.x, slot.y, slot.w, slot.h, 8), fill: th.accent2Soft, 'fill-opacity': 0.5, stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '8 7', opacity: 0})));
    const docLabel = ctx.show('key') ? chip(ctx, label('document'), {x: docC.x, y: docBox.y + dh + 14, anchor: 'middle', maxWidth: 420, size: 32, maxLines: 1, name: 'lab-document'}) : null;

    // --- signature layer: a transparent film that lifts out of the slot
    const layerW = LAYER.w, layerH = LAYER.h;
    const layerHome = {x: docBox.x + slot.x + slot.w / 2, y: docBox.y + slot.y + slot.h / 2};
    const layerOut = at('signature');
    const sigBox = {x: -layerW / 2 + 26, y: -layerH / 2 + 12, w: layerW - 60, h: layerH * 0.62};
    const sig = signatureMark(ctx, {name: 'sig-stroke', signer: p.signers[0].name, box: sigBox, color: '#1d3f8f', width: 4.5});
    const lineY = sigBox.y + sigBox.h * 0.95;
    const layerNode = g({name: 'el-signature'}, g({name: 'el-signature-body'},
      h('path', {d: roundRectPath(-layerW / 2, -layerH / 2, layerW, layerH, 12), fill: th.accent2Soft, 'fill-opacity': 0.75, stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '10 7'}),
      h('line', {x1: -layerW / 2 + 24, x2: layerW / 2 - 24, y1: lineY, y2: lineY, stroke: th.ink, 'stroke-width': 2.5}),
      sig.node,
      ctx.show('all') ? textBlock(ctx.fit(p.signers[0].name, {maxWidth: layerW - 50, size: 24, minSize: 16, maxLines: 1, weight: 500}), {x: -layerW / 2 + 24, y: lineY + 6, fill: th.inkSoft}) : null));
    const layerLabelAbove = ctx.view.shape !== 'portrait';
    const sigLabel = ctx.show('key') ? chip(ctx, label('signature'), {x: layerOut.x + (layerLabelAbove ? layerW / 2 + 16 : 0), y: layerLabelAbove ? layerOut.y - 24 : layerOut.y + layerH / 2 + 14, anchor: layerLabelAbove ? 'start' : 'middle', maxWidth: 360, size: 32, maxLines: 2, name: 'lab-signature', stroke: th.accent2}) : null;

    // --- actors, pen, folder
    const lookA = actorLook(ctx, p.signers[0], 0);
    const lookB = actorLook(ctx, p.signers[1], 1);
    const signer = personBadge(ctx, {name: 'el-signer', x: at('signer').x, y: at('signer').y, radius: 104, look: lookA, label: label('signer'), labelMax: 330});
    const recipient = personBadge(ctx, {name: 'el-recipient', x: at('recipient').x, y: at('recipient').y, radius: 104, look: lookB, label: label('recipient'), labelMax: 330});
    const penIcon = pen(ctx, {name: 'pen-icon', length: 150, body: th.accent2}).node;
    const penB = iconBadge(ctx, {name: 'el-pen', x: at('pen').x, y: at('pen').y, radius: 80, icon: g({transform: T(-48, 42, -48)}, penIcon), label: label('pen')});
    const fwid = 300, fhei = 236;
    const fC = at('folder');
    const folderNode = g({name: 'el-folder', transform: T(fC.x, fC.y)}, g({name: 'el-folder-body'},
      h('path', {d: `M${-fwid / 2} ${-fhei / 2 + 10}Q${-fwid / 2} ${-fhei / 2} ${-fwid / 2 + 10} ${-fhei / 2}H${r(-fwid / 2 + fwid * 0.38)}L${r(-fwid / 2 + fwid * 0.38 + 18)} ${-fhei / 2 + 18}H${fwid / 2 - 10}Q${fwid / 2} ${-fhei / 2 + 18} ${fwid / 2} ${-fhei / 2 + 28}V${fhei / 2 - 10}Q${fwid / 2} ${fhei / 2} ${fwid / 2 - 10} ${fhei / 2}H${-fwid / 2 + 10}Q${-fwid / 2} ${fhei / 2} ${-fwid / 2} ${fhei / 2 - 10}Z`, fill: '#dcbc7d', stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      h('rect', {name: 'folder-copy', x: -fwid * 0.3, y: -fhei * 0.36, width: fwid * 0.6, height: fhei * 0.74, rx: 4, fill: th.paper, stroke: th.ink, 'stroke-width': 2, opacity: 0}),
      h('path', {d: roundRectPath(-fwid / 2, -fhei / 2 + 50, fwid, fhei - 50, 10), fill: shade('#dcbc7d', -0.06), stroke: th.ink, 'stroke-width': th.stroke})),
      ctx.show('key') ? chip(ctx, label('folder'), {x: 0, y: fhei / 2 + 12, anchor: 'middle', maxWidth: 340, size: 32, maxLines: 1}).node : null);

    const elements = {
      signer: {circle: signer.circle},
      recipient: {circle: recipient.circle},
      pen: {circle: penB.circle},
      signature: {box: {x: layerOut.x - layerW / 2, y: layerOut.y - layerH / 2, w: layerW, h: layerH}},
      document: {box: docBox},
      folder: {box: {x: fC.x - fwid / 2, y: fC.y - fhei / 2, w: fwid, h: fhei}},
    };
    // Element captions are obstacles too, so relation labels never cover them.
    const obstacles = [
      signer.labelBox, recipient.labelBox, docLabel && docLabel.box, sigLabel && sigLabel.box,
      {x: at('pen').x - 90, y: at('pen').y + 80, w: 180, h: 52},
      {x: fC.x - 130, y: fC.y + fhei / 2 + 8, w: 260, h: 56},
    ].filter(Boolean);
    const graph = relationGraph(ctx, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize: 30, chipMax: 300, obstacles, separateLabels: true, bounds: {x: 0, y: 0, w: S.w, h: S.h - 60},
      bend: rel => (rel.kind === 'communication' ? -0.18 : 0.1)});
    const route = graph.route(p.traversalOrder);
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    // Legend: connection kinds actually used
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = ctx.show('all') ? legendNode(ctx, kinds, p.relationLabels, at('legend')) : null;

    // End-state tags (descriptive only), placed INSIDE their element so they
    // cannot collide with relation labels.
    const tagSig = ctx.show('key') ? statusTag(ctx, ctx.t.signed, {x: layerOut.x + layerW / 2 - 12, y: layerOut.y - layerH / 2 + 10, anchor: 'end', size: 24, name: 'tag-signed', color: th.accent4, opacity: 0}) : null;
    const tagRec = ctx.show('key') ? statusTag(ctx, ctx.t.received, {x: fC.x, y: fC.y + 8, anchor: 'middle', size: 26, name: 'tag-received', color: th.accent2, opacity: 0}) : null;

    return {S, s, ox, oy, signer, recipient, penB, folderNode, docNode, docLabel, layerNode, sigLabel, sig, layerHome, layerOut, graph, route, visitT, legend, tagSig, tagRec,
      centers: Object.fromEntries(IDS.map(id => [id, id === 'signature' ? layerOut : id === 'document' ? docC : at(id)]))};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      L.docNode, L.docLabel && L.docLabel.node,
      L.folderNode, L.signer.node, L.recipient.node, L.penB.node,
      L.layerNode, L.sigLabel && L.sigLabel.node,
      L.graph.labelsNode,
      L.tagSig && L.tagSig.node, L.tagRec && L.tagRec.node,
      L.graph.tracerNode('tracer'),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: components appear; the signature layer lifts out of its slot
    const appear = seg(u, 0, 0.1);
    const lift = ease.inOutCubic(seg(u, 0.06, 0.18));
    const lp = {x: lerp(L.layerHome.x, L.layerOut.x, lift), y: lerp(L.layerHome.y, L.layerOut.y, lift)};
    const layerScale = lerp(0.9, 1, lift);
    for (const id of ['signer', 'pen', 'folder', 'recipient']) nodes[`el-${id}`] = {opacity: r(appear, 3)};
    if (L.sigLabel) nodes['lab-signature'] = {opacity: r(seg(u, 0.14, 0.2), 3)};
    // 2) relations drawn one by one
    const n = p.relationships.length;
    Object.assign(nodes, L.graph.frame(i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / n, 0.18 + ((i + 1) * 0.25) / n))));
    // 3) tracer follows the traversal order; focus element enlarges as it passes
    const tp = seg(u, 0.44, 0.74);
    const tpos = L.route.poly.at(ease.inOutSine(tp));
    const tracerOn = u >= 0.43 && u < 0.78;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const tt = ease.inOutSine(tp);
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      const d = Math.abs(tt - vt);
      return clamp(1 - d / 0.08);
    };
    for (const id of IDS) {
      const focus = id === p.focusElement ? 0.22 : 0.08;
      const k = 1 + (reduced ? focus * 0.5 : focus) * ease.inOutSine(pulse(id));
      // body groups are drawn around their own centre, except the document (top-left origin)
      const pivot = id === 'document' ? {x: DOC.w / 2, y: DOC.h / 2} : {x: 0, y: 0};
      nodes[`el-${id}-body`] = {transform: scaleAbout(pivot.x, pivot.y, k)};
    }
    // the part that changes: signature drawn when the tracer passes pen → signature
    const reach = L.visitT.signature ?? 0.5;
    const sigT = seg(tt, Math.max(0, reach - 0.12), reach + 0.02);
    const sigP = tracerOn || u >= 0.78 ? (u >= 0.74 ? 1 : sigT) : 0;
    Object.assign(nodes, L.sig.frame(ease.inOutSine(sigP)));
    // document copy appears in the folder once the tracer passes document → folder
    const deliv = L.visitT.folder !== undefined ? (u >= 0.74 || (tracerOn && tt >= L.visitT.folder) ? 1 : 0) : 0;
    nodes['folder-copy'] = {opacity: deliv};
    // 4) gather: everything stays anchored; the home slot on the body lights up
    //    and descriptive states are labelled (no legal effect is stated).
    const pos = lp;
    nodes['el-signature'] = {transform: T(pos.x, pos.y, 0, layerScale), opacity: r(seg(u, 0.02, 0.1), 3)};
    nodes['slot-ghost'] = {opacity: r(Math.max(lift * (1 - seg(u, 0.2, 0.3)), seg(u, 0.78, 0.86)), 3)};
    const tagP = seg(u, 0.84, 0.92);
    if (L.tagSig) nodes['tag-signed'] = {opacity: r(tagP * (sigP >= 1 ? 1 : 0), 3)};
    if (L.tagRec) nodes['tag-received'] = {opacity: r(tagP * deliv, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        signatureLayer: {x: r(pos.x), y: r(pos.y)},
        signatureProgress: r(sigP, 3),
        delivered: Boolean(deliv),
        relationsDrawn: p.relationships.map((_, i) => r(seg(u, 0.18 + (i * 0.25) / p.relationships.length, 0.18 + ((i + 1) * 0.25) / p.relationships.length), 3)),
        visitOrder: L.route.visits.map(v => v.id),
      },
    };
  },
};

function legendNode(ctx, kinds, labels, at) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const size = 30;
  const gap = 56;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      h('circle', {cx: 0, cy: 0, r: arrow ? 0 : 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return g({name: 'legend'}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-01-mechanism',
    title: 'Document signing — components and relationships',
    titleEs: 'Firma de documento — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Firma de documento',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: the signature layer lifts out of the document body; signer, pen, folder and recipient are linked by edge-anchored connectors styled by relation kind; a tracer follows the traversal order and the signature layer changes from empty to signed as it passes.',
    tags: ['signature', 'mechanism', 'exploded', 'relations', 'tracer', 'document'],
    defaultDurationMs: DURATION,
    assets: ['src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
