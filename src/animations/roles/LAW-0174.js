/**
 * LAW-0174 — Intervención de perito · mechanism
 *
 * Storyboard (an exploded view, not a row of boxes): the specialist and the
 * examined object stand in a left column; the report is pulled apart on the
 * right into its three parts — the opinion (a dashed-fence speech bubble),
 * the data examined (a ruled card) and the figure (a drawing card).
 *  0.00–0.18  separate: the three report parts start stacked as one sheet and
 *             slide apart to their places; the specialist badge and the object
 *             (gear or jar in a round frame, with its tag) come in from the left.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             anchored to the element edges and styled by kind (relation =
 *             plain line with end dots, never an arrow; communication = dashed
 *             arrow; sequence = arrow; causal only when supplied).
 *  0.43–0.75  trace: a manila tag (the link itself) travels the supplied
 *             traversal order along the connectors. Each report part it reaches
 *             takes its supplied state (data rows fill, figure is drawn, the
 *             fence closes around the opinion and its scope); the focus element
 *             enlarges while the tag passes it.
 *  0.75–1.00  gather: every part keeps its state; legend of the connection
 *             kinds and the key "as supplied · no conclusion drawn".
 * The opinion is never marked correct, decisive or accepted; no cause, fault,
 * verdict or outcome is drawn.
 * @module animations/roles/LAW-0174
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {LINK_STYLES, connector} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {peritoFields, PERITO_DEFAULTS, PERITO_STRINGS, objectArt, dimensionLine, drawOn, tagArt, rulerGlyph, bubbleGlyph, miniTag,
  specialistCaption, fitW, textOrBars, wchip, findSpot, overlaps} from './kits/intervencion-de-perito.js';

const ID = 'LAW-0174';
const DURATION = 7000;
const IDS = ['specialist', 'object', 'data', 'figure', 'opinion'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {sep: [0.02, 0.16], rel: [0.19, 0.42], trace: [0.44, 0.74], late: [0.74, 0.79], legend: [0.77, 0.83], key: [0.8, 0.86]};

const sceneSchema = {
  ...peritoFields,
  elements: list('Component labels; ids are fixed by the scene, labels are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships between components; kind sets the line style (causal only when the author supplies it)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when supplied)', KINDS),
    label: str('Caption for this relationship (defaults to the caption of its kind)', 40),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption used in the legend for each relation kind', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tag tracer visits components', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {
  ...PERITO_DEFAULTS,
  elements: [
    {id: 'specialist', label: 'Specialist'},
    {id: 'object', label: 'Examined object'},
    {id: 'data', label: 'Data examined'},
    {id: 'figure', label: 'Figure of the object'},
    {id: 'opinion', label: 'Stated opinion'},
  ],
  relationships: [
    {from: 'specialist', to: 'object', kind: 'relation', label: 'examines'},
    {from: 'object', to: 'data', kind: 'sequence', label: 'measured, then recorded'},
    {from: 'object', to: 'figure', kind: 'relation', label: 'drawn as Fig. 1'},
    {from: 'specialist', to: 'opinion', kind: 'communication', label: 'states, scope included'},
    {from: 'opinion', to: 'data', kind: 'relation', label: 'refers to the data'},
  ],
  focusElement: 'opinion',
  relationLabels: {relation: 'relation (no direction)', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['specialist', 'object', 'data', 'opinion'],
};

const SIZES = {landscape: {S: 25, Smin: 20}, square: {S: 29.6, Smin: 24.2}, portrait: {S: 22, Smin: 16.8}};

/** Card with a heading tab (element label) — returns node + inner area. */
function cardFrame(ctx, {name, box, S, fill, stroke, dashed}) {
  return h('path', {name, d: roundRectPath(box.x, box.y, box.w, box.h, S * 0.45), fill, stroke, 'stroke-width': Math.max(2.5, S * 0.1), 'stroke-dasharray': dashed ? `${r(S * 0.55)} ${r(S * 0.32)}` : null});
}

function layoutAt(ctx, S, shape, artK = 9) {
  const p = ctx.params;
  const th = ctx.theme;
  const W0 = ctx.design.w, H0 = ctx.design.h;
  const m = 16;
  const showAll = ctx.show('all');
  const rep = p.props.report;
  const labelOf = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
  let truncated = false;
  const F = (text, o) => {
    const f = fitW(text, {minSize: o.size, ...o});
    if (f.truncated) truncated = true;
    return f;
  };
  // columns: people/object | gutter for connector labels | report parts
  const leftW = W0 * (shape === 'portrait' ? 0.34 : shape === 'square' ? 0.33 : 0.3);
  const gut = W0 * (shape === 'portrait' ? 0.14 : 0.17);
  const rx = m + leftW + gut, rw = W0 - m - rx;
  const pad = S * 0.6;
  // report sheet title
  const title = F(rep.title, {maxWidth: rw - pad * 2, size: S, maxLines: 3, weight: 800});
  let y = m + pad;
  const titleY = y;
  y += title.height + S * 0.8;
  // report parts are 90 % of the panel wide: the focus enlargement (×1.1, anchored on the
  // part's left side) stays inside the report panel
  const pw = rw / 1.1;
  // opinion bubble
  const opHead = F(rep.opinionHeading, {maxWidth: rw / 1.1 - pad * 2 - S * 1.5, size: S, maxLines: 2, weight: 700});
  const op = F(rep.opinion, {maxWidth: pw - pad * 2, size: S, maxLines: 5, weight: 500});
  const sc = F(rep.scope, {maxWidth: pw - pad * 2 - S * 0.9, size: S, maxLines: 4, weight: 500});
  const tabFit = id => (ctx.show('key') && labelOf(id) ? fitW(labelOf(id), {maxWidth: pw * 0.66 - S * 1.8, size: S, minSize: S, maxLines: 3, weight: 700}) : null);
  const tabFits = ['opinion', 'data', 'figure'].map(tabFit).filter(Boolean);
  if (tabFits.some(f => f.truncated)) truncated = true;
  const tabH = Math.max(S * 1.5, ...tabFits.map(f => f.height + S * 0.8));
  const opH = pad + Math.max(opHead.height, S * 1.1) + S * 0.35 + op.height + S * 0.35 + sc.height + pad;
  // headroom for the enlargement: the tab above may rise by 10 % of its distance to the centre
  const grow = h0 => (h0 / 2 + tabH) * 0.1 + 6;
  const opBox = {x: rx, y: y + tabH + grow(opH), w: pw, h: opH};
  y = opBox.y + opBox.h;
  // data card
  const dHead = F(rep.dataHeading, {maxWidth: pw - pad * 2 - S * 1.5, size: S, maxLines: 2, weight: 700});
  const rows = rep.measurements.map(t => F(t, {maxWidth: pw - pad * 2 - S * 1.2, size: S, maxLines: 3, weight: 500}));
  const dataH = pad + Math.max(dHead.height, S * 1.1) + S * 0.35 + rows.reduce((a, f) => a + f.height + S * 0.45, 0) + pad * 0.7;
  // figure card: drawing on the left, caption on the right
  const artW = Math.min(pw * 0.4, S * artK);
  const figCap = F(rep.figure, {maxWidth: pw - artW - pad * 3, size: S, maxLines: 3, weight: 600});
  const figH = Math.max(artW, figCap.height + pad * 2);
  // vertical spacing: the three parts spread over the available height
  const bottom = H0 - m;
  // gaps hold the next part's tab, a readable length of connector between parts and the headroom
  // the next part's tab sits left of the link (links run at 70 % of the width), so the gap holds
  // the larger of the tab and a readable link (≥ 3.2 text heights), plus the enlargement headroom
  const minGap = Math.max(tabH + 8, S * 3.2) + grow(Math.max(opH, dataH));
  const rest = bottom - y - dataH - figH - grow(figH);
  const gap = Math.max(minGap, rest / 2);
  const dataBox = {x: rx, y: y + gap, w: pw, h: dataH};
  const figBox = {x: rx, y: dataBox.y + dataH + gap, w: pw, h: figH};
  const fitsR = figBox.y + figBox.h + grow(figH) <= bottom + 0.5 && rest >= minGap * 2 && !truncated;
  // left column: specialist at the opinion's height, object between data and figure
  const lcx = m + leftW / 2;
  const sR = Math.min(leftW * 0.28, S * 3.6, opBox.h * 0.45 + 20);
  const spChip = ctx.show('key') ? fitW(`${labelOf('specialist')}: ${specialistCaption(p)}`, {maxWidth: leftW - S * 1.2, size: S, minSize: S, maxLines: 7, weight: 600}) : null;
  if (spChip && spChip.truncated) truncated = true;
  const spChipH = spChip ? spChip.height + S * 0.8 : 0;
  // the specialist's chip sits ABOVE the badge, so the badge → object link below it stays free
  const sC = {x: lcx, y: Math.max(m + spChipH + S * 0.5 + sR * 1.1, opBox.y + opBox.h * 0.4)};
  // legend (kinds present) and key reserved at the bottom of the left column
  const kinds = [...new Set(p.relationships.map(x => x.kind))];
  const legW = leftW + gut - S * 0.6;
  const legH = ctx.show('key') ? kinds.reduce((a, k) => a + fitW(p.relationLabels[k] || k, {maxWidth: legW - S * 3.1, size: S, minSize: S, maxLines: 2, weight: 500}).height + S * 0.35, 0)
    + fitW(ctx.t.key, {maxWidth: legW, size: S, minSize: S, maxLines: 2, weight: 600}).height + S * 0.3 : 0;
  const objChip = ctx.show('key') ? fitW(`${labelOf('object')}: ${p.props.object}`, {maxWidth: leftW - S * 1.2, size: S, minSize: S, maxLines: 6, weight: 600}) : null;
  if (objChip && objChip.truncated) truncated = true;
  const objChipH = objChip ? objChip.height + S * 0.8 : 0;
  const oR = Math.min(leftW * 0.36, S * 5.2);
  const oMax = bottom - legH - S * 0.6 - objChipH - S * 0.35 - oR * 1.1;
  const oMin = sC.y + sR * 1.1 + S * 5 + oR * 1.1;
  const oC = {x: lcx, y: clamp((dataBox.y + dataBox.h / 2 + figBox.y + figBox.h / 2) / 2, oMin, oMax)};
  const leftFits = oMax >= oMin - 0.5;
  return {legH, legW, S, W0, H0, m, rx, rw, pad, title, titleY, opHead, op, sc, opBox, dHead, rows, dataBox, figCap, artW, figBox, tabH, sR, sC, oR, oC, leftW, gut, fits: fitsR && leftFits, labelOf, showAll};
}

const scene = {
  sizes: {landscape: [1800, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const Z = SIZES[shape];
    // the largest size (up to 1.35× the base) whose layout AND relation labels fit uncut;
    // never below the floor
    let out = null;
    search: for (let S = Z.S * 1.35; S >= Z.Smin - 1e-6; S -= 0.5) {
      for (const artK of [9, 6.5]) {
        const L = layoutAt(ctx, S, shape, artK);
        if (!L.fits && (S > Z.Smin + 0.5 || artK === 9)) continue;
        out = assemble(ctx, L, p, th);
        if (out.labelsFit && out.legendClear && L.fits) break search;
      }
    }
    return out;
  },
  build(ctx, L) {
    return buildScene(ctx, L);
  },
  frame(ctx, L, u) {
    return frameScene(ctx, L, u);
  },
};

function assemble(ctx, L, p, th) {
  {
    const {S, rx, rw, pad, opBox, dataBox, figBox, tabH, sR, sC, oR, oC, W0, H0} = L;
    const cap = S;
    const look = actorLook(ctx, p.actors[0], 0);
    const showAll = ctx.show('all');
    const ink = '#1f2328';

    // ---- report sheet behind the parts (a real page, split apart)
    const sheet = {x: rx - S * 0.5, y: L.m, w: rw + S, h: H0 - L.m * 2};
    const sheetNode = g({name: 'sheet'},
      h('path', {d: roundRectPath(sheet.x + 8, sheet.y + 10, sheet.w, sheet.h, 12), fill: th.shadow}),
      h('path', {d: roundRectPath(sheet.x, sheet.y, sheet.w, sheet.h, 12), fill: th.paperShade, stroke: shade(th.paperLine, -0.2), 'stroke-width': 2, 'stroke-dasharray': '10 8'}),
      textOrBars(ctx, L.title, {x: rx + pad * 0.3, y: L.titleY, fill: ink, show: showAll, name: 'title'}));

    // ---- element tabs (element labels)
    const tab = (id, box, color) => {
      const text = L.labelOf(id);
      if (!ctx.show('key') || !text) return null;
      const tf = fitW(text, {maxWidth: box.w * 0.66 - S * 1.8, size: cap, minSize: cap, maxLines: 3, weight: 700});
      return wchip(ctx, text, {x: box.x + S * 0.6, y: box.y - (tf.height + S * 0.76) + S * 0.35, maxWidth: box.w * 0.66 - S * 0.6, size: cap, minSize: cap, maxLines: 3, fill: color, stroke: ink, name: `tab-${id}`, weight: 700});
    };

    // ---- opinion bubble (dashed fence; tail towards the specialist)
    const ob = opBox;
    const rr = S * 0.5;
    const ty = ob.y + Math.min(ob.h * 0.4, S * 2.4);
    const obD = `M${r(ob.x + rr)} ${r(ob.y)}H${r(ob.x + ob.w - rr)}Q${r(ob.x + ob.w)} ${r(ob.y)} ${r(ob.x + ob.w)} ${r(ob.y + rr)}V${r(ob.y + ob.h - rr)}Q${r(ob.x + ob.w)} ${r(ob.y + ob.h)} ${r(ob.x + ob.w - rr)} ${r(ob.y + ob.h)}H${r(ob.x + rr)}Q${r(ob.x)} ${r(ob.y + ob.h)} ${r(ob.x)} ${r(ob.y + ob.h - rr)}V${r(ty + S * 0.5)}L${r(ob.x - S * 0.8)} ${r(ty + S * 0.1)}L${r(ob.x)} ${r(ty - S * 0.3)}V${r(ob.y + rr)}Q${r(ob.x)} ${r(ob.y)} ${r(ob.x + rr)} ${r(ob.y)}Z`;
    const opY = ob.y + pad + Math.max(L.opHead.height, S * 1.1) + S * 0.35;
    const scY = opY + L.op.height + S * 0.35;
    const opinionNode = g({name: 'el-opinion'},
      h('path', {d: obD, fill: '#fffdf8', stroke: 'none'}),
      h('path', {name: 'op-fill', d: obD, fill: th.accent3Soft, opacity: 0}),
      h('defs', null, h('mask', {id: ctx.id('opmask'), maskUnits: 'userSpaceOnUse', x: r(ob.x - S * 2), y: r(ob.y - S * 2), width: r(ob.w + S * 4), height: r(ob.h + S * 4)},
        h('path', {name: 'op-fence', d: obD, fill: 'none', stroke: '#fff', 'stroke-width': 14, pathLength: 100, 'stroke-dasharray': '100 101', 'stroke-dashoffset': 100}))),
      h('path', {d: obD, fill: 'none', stroke: th.paperLine, 'stroke-width': 2}),
      h('path', {d: obD, fill: 'none', stroke: shade(th.accent3, -0.35), 'stroke-width': Math.max(3, S * 0.13), 'stroke-dasharray': `${r(S * 0.55)} ${r(S * 0.32)}`, mask: ctx.ref('opmask')}),
      g({transform: T(ob.x + pad, ob.y + pad - S * 0.05)}, bubbleGlyph(S * 1.1, ink)),
      textOrBars(ctx, L.opHead, {x: ob.x + pad + S * 1.4, y: ob.y + pad, fill: ink, show: showAll}),
      g({name: 'op-ph'}, [0, 1].map(i => h('path', {d: `M${r(ob.x + pad)} ${r(opY + S * 0.6 + i * S * 1.2)}H${r(ob.x + pad + (ob.w - pad * 2) * (i ? 0.4 : 0.7))}`, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '4 7'}))),
      textOrBars(ctx, L.op, {x: ob.x + pad, y: opY, fill: ink, show: showAll, name: 'op-text', opacity: 0}),
      g({name: 'op-scope', opacity: 0},
        h('path', {d: `M${r(ob.x + pad + S * 0.5)} ${r(scY + S * 0.05)}h${r(-S * 0.3)}v${r(L.sc.height - S * 0.1)}h${r(S * 0.3)}`, fill: 'none', stroke: shade(th.accent3, -0.35), 'stroke-width': Math.max(2.5, S * 0.1)}),
        textOrBars(ctx, L.sc, {x: ob.x + pad + S * 0.9, y: scY, fill: ink, show: showAll, italic: true})));

    // ---- data card
    const db = dataBox;
    let ry = db.y + pad + Math.max(L.dHead.height, S * 1.1) + S * 0.35;
    const rowNodes = L.rows.map((f, i) => {
      const y0 = ry;
      ry += f.height + S * 0.45;
      return g(null,
        h('path', {name: `d-ph${i}`, d: `M${r(db.x + pad + S * 1.2)} ${r(y0 + S * 0.6)}H${r(db.x + pad + S * 1.2 + (db.w - pad * 2) * 0.45)}`, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '4 7'}),
        g({name: `d-row${i}`, opacity: 0},
          h('path', {d: roundRectPath(db.x + pad, y0 + S * 0.12, S * 0.72, S * 0.72, S * 0.12), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2}),
          h('circle', {cx: r(db.x + pad + S * 0.36), cy: r(y0 + S * 0.48), r: r(S * 0.13), fill: th.accent2}),
          textOrBars(ctx, f, {x: db.x + pad + S * 1.2, y: y0, fill: ink, show: showAll})));
    });
    const dataNode = g({name: 'el-data'},
      cardFrame(ctx, {box: db, S, fill: '#fffdf8', stroke: ink}),
      g({transform: T(db.x + pad, db.y + pad - S * 0.1)}, rulerGlyph(S * 1.1, ink)),
      textOrBars(ctx, L.dHead, {x: db.x + pad + S * 1.4, y: db.y + pad, fill: ink, show: showAll}),
      rowNodes);

    // ---- figure card: the object's drawing + caption
    const fb = figBox;
    const artR = L.artW * 0.38;
    const fArt = objectArt(ctx, {kind: p.props.objectKind, R: artR, mode: 'line'});
    const figClip = 'figwipe';
    const figNode = g({name: 'el-figure'},
      cardFrame(ctx, {box: fb, S, fill: '#fffdf8', stroke: ink}),
      h('defs', null, h('clipPath', {id: ctx.id(figClip)}, h('rect', {name: 'fig-wipe', x: r(fb.x), y: r(fb.y), width: 0, height: r(fb.h)}))),
      g({'clip-path': ctx.ref(figClip)}, g({transform: T(fb.x + pad * 0.6 + L.artW / 2, fb.y + fb.h / 2)}, fArt.node, dimensionLine(ctx, fArt, {name: 'fig-dim', color: th.accent2, width: Math.max(3, S * 0.13)}))),
      textOrBars(ctx, L.figCap, {x: fb.x + pad * 1.6 + L.artW, y: fb.y + (fb.h - L.figCap.height) / 2, fill: ink, show: showAll}));

    // ---- specialist and object (left column)
    const sp = personBadge(ctx, {name: 'el-specialist', x: sC.x, y: sC.y, radius: sR, look});
    const oArt = objectArt(ctx, {kind: p.props.objectKind, R: oR * 0.62, mode: 'solid'});
    const tag = tagArt(ctx, {name: 'o-tag', text: p.props.tag, S, show: showAll, maxW: S * 5.4});
    const tagAt = {x: oC.x - oR * 0.8, y: oC.y - oR * 0.15};
    const objNode = g({name: 'el-object'},
      h('circle', {cx: r(oC.x + 6), cy: r(oC.y + 9), r: r(oR), fill: th.shadow}),
      h('circle', {cx: r(oC.x), cy: r(oC.y), r: r(oR), fill: th.paperShade, stroke: ink, 'stroke-width': 2.8}),
      g({transform: T(oC.x, oC.y)}, oArt.node),
      h('path', {d: `M${r(oC.x)} ${r(oC.y)}Q${r((oC.x + tagAt.x) / 2)} ${r(Math.max(oC.y, tagAt.y) + S * 0.6)} ${r(tagAt.x)} ${r(tagAt.y)}`, fill: 'none', stroke: '#8a5a33', 'stroke-width': 3}),
      g({transform: T(tagAt.x - tag.eye.x, tagAt.y - tag.eye.y, 6)}, tag.node));

    // ---- identity chips under the left elements (drawn once)
    const chipsL = [];
    if (ctx.show('key')) {
      const spText = `${L.labelOf('specialist')}: ${specialistCaption(p)}`;
      const obText = `${L.labelOf('object')}: ${p.props.object}`;
      const maxW = L.leftW;
      const spProbe = wchip(ctx, spText, {x: 0, y: 0, anchor: 'middle', maxWidth: maxW, size: cap, minSize: cap, maxLines: 7, weight: 600});
      chipsL.push(wchip(ctx, spText, {x: clamp(sC.x, L.m + maxW / 2, W0), y: sC.y - sR * 1.1 - S * 0.35 - spProbe.box.h, anchor: 'middle', maxWidth: maxW, size: cap, minSize: cap, maxLines: 7, name: 'chip-sp', fill: '#f7f1e3', weight: 600}));
      chipsL.push(wchip(ctx, obText, {x: clamp(oC.x, L.m + maxW / 2, W0), y: oC.y + oR * 1.1 + S * 0.35, anchor: 'middle', maxWidth: maxW, size: cap, minSize: cap, maxLines: 6, name: 'chip-obj', fill: '#fff', weight: 600}));
    }

    // ---- connectors (supplied relationships only), anchored to element edges
    const elements = {
      specialist: {circle: {x: sC.x, y: sC.y, r: sR}},
      object: {circle: {x: oC.x, y: oC.y, r: oR}},
      opinion: {box: {x: ob.x, y: ob.y, w: ob.w, h: ob.h}},
      data: {box: db},
      figure: {box: fb},
    };
    const rels = p.relationships.filter(x => elements[x.from] && elements[x.to] && x.from !== x.to);
    // explicit anchors: circles leave from their right side (within ±40°) towards the parts' left
    // edges (the opinion's bubble tail), stacked parts meet top/bottom, the two circles meet
    // bottom/top — every link gets a readable length and lands on its own element
    const tailY = ob.y + Math.min(ob.h * 0.4, S * 2.4) + S * 0.1;
    const leftPort = (id, y) => (id === 'opinion' ? {x: ob.x - S * 0.8, y: tailY} : {x: elements[id].box.x, y: clamp(y, elements[id].box.y + S * 0.9, elements[id].box.y + elements[id].box.h - S * 0.9)});
    const circleSide = (c, tgt) => {
      const a = clamp(Math.atan2(tgt.y - c.y, tgt.x - c.x), -0.7, 0.7);
      return {x: c.x + Math.cos(a) * c.r, y: c.y + Math.sin(a) * c.r};
    };
    const ORDER = ['opinion', 'data', 'figure'];
    const anchorsOf = (fid, tid) => {
      const A = elements[fid], B = elements[tid];
      if (A.circle && B.circle) {
        const up = A.circle.y < B.circle.y ? A.circle : B.circle, lo = up === A.circle ? B.circle : A.circle;
        const pu = {x: up.x, y: up.y + up.r}, pl = {x: lo.x, y: lo.y - lo.r};
        return A.circle === up ? [pu, pl, 'v'] : [pl, pu, 'v'];
      }
      if (A.circle || B.circle) {
        const c = A.circle || B.circle, bid = A.circle ? tid : fid;
        const port = leftPort(bid, c.y);
        const side = circleSide(c, port);
        return A.circle ? [side, port, 'h'] : [port, side, 'h'];
      }
      const ia = ORDER.indexOf(fid), ib = ORDER.indexOf(tid);
      const upId = ia < ib ? fid : tid, loId = upId === fid ? tid : fid;
      const U = elements[upId].box, Lo = elements[loId].box;
      const x = U.x + U.w * 0.7;
      if (Math.abs(ia - ib) === 1) {
        const pu = {x, y: U.y + U.h}, pl = {x, y: Lo.y};
        return upId === fid ? [pu, pl, 'v'] : [pl, pu, 'v'];
      }
      // non-adjacent parts: out of the left edges, around through the gutter
      const pu = {x: U.x, y: U.y + U.h * 0.75}, pl = {x: Lo.x, y: Lo.y + Lo.h * 0.25};
      return upId === fid ? [pu, pl, 'g'] : [pl, pu, 'g'];
    };
    const conns = rels.map((rel, i) => {
      const [from, to, mode] = anchorsOf(rel.from, rel.to);
      const dx = to.x - from.x, dy = to.y - from.y;
      const c1 = mode === 'h' ? {x: from.x + dx * 0.5, y: from.y} : mode === 'v' ? {x: from.x, y: from.y + dy * 0.4} : {x: from.x - S * 2.2, y: from.y};
      const c2 = mode === 'h' ? {x: to.x - dx * 0.5, y: to.y} : mode === 'v' ? {x: to.x, y: to.y - dy * 0.4} : {x: to.x - S * 2.2, y: to.y};
      const c = connector(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind, c1, c2, color: kindColor(ctx, rel.kind)});
      const samples = Array.from({length: 41}, (_, k) => c.at(k / 40));
      return {rel, c, samples};
    });
    const connNode = g({name: 'rel'}, conns.map(x => x.c.node));
    const tabs = {opinion: tab('opinion', ob, th.accent3Soft), data: tab('data', db, th.accent2Soft), figure: tab('figure', fb, '#f3efe6')};
    const circleBox = cc => ({x: cc.x - cc.r * 1.12, y: cc.y - cc.r * 1.12, w: cc.r * 2.24, h: cc.r * 2.24});
    const occupied = [
      ...Object.values(elements).map(e => (e.circle ? circleBox(e.circle) : e.box)),
      ...chipsL.map(c => c.box), ...Object.values(tabs).filter(Boolean).map(c => c.box),
      {x: rx, y: L.titleY, w: L.title.width + pad, h: L.title.height},
      {x: tagAt.x - tag.w / 2 - 6, y: tagAt.y - 6, w: tag.w + 20, h: tag.h + 10},
      {x: L.m, y: H0 - L.m - L.legH, w: L.legW, h: L.legH},
    ];
    // relation labels seated BESIDE their own line (perpendicular offset from a point near its
    // middle), clear of every element, chip, tab, other label and every connector
    const relLabels = [];
    let labelsFit = true;
    const boxDist = (bx, samples) => Math.min(...samples.map(q => Math.hypot(Math.max(bx.x - q.x, 0, q.x - bx.x - bx.w), Math.max(bx.y - q.y, 0, q.y - bx.y - bx.h))));
    const allSamples = conns.flatMap(x => x.samples);
    if (ctx.show('all')) {
      conns.forEach((cn, i) => {
        const text = cn.rel.label || p.relationLabels[cn.rel.kind] || cn.rel.kind;
        let found = null;
        let chipW = S * 8.5;
        // narrow (more lines) first; wider single-line chips for short links between stacked parts
        search: for (const mw of [S * 8.5, S * 13, S * 19]) {
        chipW = mw;
        const probe = wchip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: cap, minSize: cap, maxLines: 4, weight: 600});
        const bw = probe.box.w, bh = probe.box.h;
        for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          const P0 = cn.c.at(t);
          const nx = -Math.sin(P0.a), ny = Math.cos(P0.a);
          const half = Math.abs(nx) * bw / 2 + Math.abs(ny) * bh / 2;
          for (const extra of [0, S * 0.5, S * 1.1]) {
            for (const side of [1, -1]) {
              const d = half + S * 0.35 + extra;
              const cx = P0.x + nx * side * d, cy = P0.y + ny * side * d;
              const box = {x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh};
              if (box.x < 6 || box.y < 6 || box.x + box.w > W0 - 6 || box.y + box.h > H0 - 6) continue;
              if ([...occupied, ...relLabels.map(x => x.box)].some(q => overlaps(box, q, 4))) continue;
              if (allSamples.some(q => q.x > box.x - 5 && q.x < box.x + box.w + 5 && q.y > box.y - 5 && q.y < box.y + box.h + 5)) continue;
              // it must read as belonging to ITS line: clearly nearer to it than to any other connector
              const own = boxDist(box, cn.samples);
              if (conns.some((o2, j) => j !== i && boxDist(box, o2.samples) < own + S * 0.6)) continue;
              found = {box, d};
              break search;
            }
          }
        }
        }
        if (!found) { labelsFit = false; return; }
        const c = wchip(ctx, text, {x: found.box.x, y: found.box.y, maxWidth: chipW, size: cap, minSize: cap, maxLines: 4, weight: 600, fill: '#fff', stroke: kindColor(ctx, cn.rel.kind), name: `rl${i}-chip`});
        relLabels.push({i, box: c.box, gap: found.d, own: conns.every((o2, j) => j === i || boxDist(c.box, o2.samples) >= boxDist(c.box, cn.samples) + S * 0.6), node: g({name: `rl${i}`, opacity: 0}, c.node)});
      });
    }

    // ---- tracer route: the object's tag travels the supplied order along the connectors
    const centerOf = id => (elements[id].circle ? {x: elements[id].circle.x, y: elements[id].circle.y} : {x: elements[id].box.x + elements[id].box.w / 2, y: elements[id].box.y + elements[id].box.h / 2});
    const order = p.traversalOrder.filter(id => elements[id]);
    const pts = [];
    const visitIdx = [];
    order.forEach((id, i) => {
      if (i === 0) { pts.push(centerOf(id)); visitIdx.push({id, idx: 0}); return; }
      const prev = order[i - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      if (link) {
        const fwd = link.rel.from === prev;
        for (let k = 0; k <= 40; k++) pts.push(link.c.at(fwd ? k / 40 : 1 - k / 40));
      } else pts.push(centerOf(prev));
      pts.push(centerOf(id));
      visitIdx.push({id, idx: pts.length - 1});
    });
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
    const total = cum[cum.length - 1] || 1;
    const route = {poly: polyline(pts), visits: visitIdx.map(v => ({id: v.id, t: cum[v.idx] / total}))};
    const tracer = g({name: 'tracer', opacity: 0},
      h('circle', {r: r(S * 0.95), fill: th.accent3, opacity: 0.25}),
      g({transform: T(-S * 0.45, -S * 0.55)}, miniTag(S * 0.9)));
    // the focus element grows about a point that keeps its incoming links' ends in place
    const focusAnchor = {opinion: {x: ob.x - S * 0.8, y: tailY}, data: {x: db.x, y: db.y + db.h / 2}, figure: {x: fb.x, y: fb.y + fb.h / 2}, specialist: {x: sC.x, y: sC.y}, object: {x: oC.x, y: oC.y}};
    const FOCUS_MAX = {opinion: 1.08, data: 1.08, figure: 1.08, specialist: 1.08, object: 1.08};
    // is the fully enlarged focus element inside the report panel and clear of the title, the other
    // elements and chips? (checked in the tests)
    const fid = p.focusElement;
    const fb0 = elements[fid] && (elements[fid].circle ? circleBox(elements[fid].circle) : {...elements[fid].box, y: elements[fid].box.y - L.tabH, h: elements[fid].box.h + L.tabH});
    const sk = FOCUS_MAX[fid] || 1;
    const fA = focusAnchor[fid];
    const grown = fb0 && {x: fA.x + (fb0.x - fA.x) * sk, y: fA.y + (fb0.y - fA.y) * sk, w: fb0.w * sk, h: fb0.h * sk};
    const others = [...Object.entries(elements).filter(([id]) => id !== fid).map(([, e]) => (e.circle ? circleBox(e.circle) : e.box)), ...chipsL.map(c => c.box), {x: rx, y: L.titleY, w: L.title.width + pad, h: L.title.height}];
    const inPanel = !['opinion', 'data', 'figure'].includes(fid) || (grown.x >= rx - S * 0.9 - 1 && grown.x + grown.w <= rx + rw + 1 && grown.y >= L.m && grown.y + grown.h <= H0 - L.m);
    const focusClear = Boolean(grown) && inPanel && !others.some(q => overlaps(grown, q, 0));
    const minConnLen = conns.length ? Math.min(...conns.map(x => x.c.total)) : 0;
    const labelGap = relLabels.length ? Math.max(...relLabels.map(x => x.gap)) : 0;
    const labelsOwn = relLabels.every(x => x.own);

    // ---- legend of connection kinds present + key
    const kinds = [...new Set(rels.map(x => x.kind))];
    const legendParts = [];
    let lx = L.m, ly = H0 - L.m;
    const legendItems = ctx.show('key') ? kinds.map(k => ({k, f: fitW(p.relationLabels[k] || k, {maxWidth: L.legW - S * 3.1, size: cap, minSize: cap, maxLines: 2, weight: 500})})) : [];
    const keyFit = ctx.show('key') ? fitW(ctx.t.key, {maxWidth: L.legW, size: cap, minSize: cap, maxLines: 2, weight: 600}) : null;
    let legendH = legendItems.reduce((a, it) => a + it.f.height + S * 0.35, 0) + (keyFit ? keyFit.height + S * 0.3 : 0);
    const legW = Math.max(0, ...legendItems.map(it => it.f.width + S * 3.1), keyFit ? keyFit.width : 0);
    const obstacles = [...Object.values(elements).map(e => (e.circle ? circleBox(e.circle) : e.box)), ...chipsL.map(c => c.box), ...relLabels.map(x => x.box),
      {x: tagAt.x - tag.w / 2 - 6, y: tagAt.y - 6, w: tag.w + 20, h: tag.h + 10}];
    ly = H0 - L.m - legendH;
    const legendBox = {x: lx, y: ly, w: legW, h: legendH};
    let yy = ly;
    for (const it of legendItems) {
      const st = LINK_STYLES[it.k];
      const col = kindColor(ctx, it.k);
      const my = yy + S * 0.5;
      legendParts.push(g(null,
        h('path', {d: `M${r(lx)} ${r(my)}H${r(lx + S * 2.4)}`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash, fill: 'none'}),
        st.arrow ? h('path', {d: `M${r(lx + S * 2.6)} ${r(my)}l${r(-S * 0.5)} ${r(-S * 0.28)}v${r(S * 0.56)}Z`, fill: col}) : null,
        st.endDots ? g(null, h('circle', {cx: r(lx), cy: r(my), r: st.width * 1.6, fill: col}), h('circle', {cx: r(lx + S * 2.4), cy: r(my), r: st.width * 1.6, fill: col})) : null,
        textOrBars(ctx, it.f, {x: lx + S * 3.1, y: yy, fill: th.fg, show: true})));
      yy += it.f.height + S * 0.35;
    }
    const keyNode = keyFit ? g({name: 'key', opacity: 0}, textOrBars(ctx, keyFit, {x: lx, y: yy, fill: th.fgSoft, show: true})) : null;
    const legendClear = !obstacles.some(b => overlaps(b, legendBox, 2));

    // ---- separation: the parts start stacked as one sheet at the data card's place
    const home = {x: db.x + db.w / 2, y: db.y + db.h / 2};
    const partC = {opinion: {x: ob.x + ob.w / 2, y: ob.y + ob.h / 2}, data: home, figure: {x: fb.x + fb.w / 2, y: fb.y + fb.h / 2}};
    const centers = {specialist: sC, object: oC, ...partC};
    const chipsCrossed = chipsL.some(ch => allSamples.some(q => q.x > ch.box.x && q.x < ch.box.x + ch.box.w && q.y > ch.box.y && q.y < ch.box.y + ch.box.h));
    return {L, S, sheetNode, opinionNode, dataNode, figNode, sp, objNode, chipsL, tabs, conns, connNode, rels, relLabels, labelsFit, route, tracer, legendParts, keyNode, legendClear, home, partC, centers, elements, fArt, focusAnchor, FOCUS_MAX, focusClear, minConnLen, labelGap, labelsOwn, chipsCrossed};
  }
}

function buildScene(ctx, L) {
  {
    return g(null,
      L.sheetNode,
      L.connNode,
      g({name: 'mv-figure'}, g({name: 'sc-figure'}, L.figNode, L.tabs.figure && L.tabs.figure.node)),
      g({name: 'mv-data'}, g({name: 'sc-data'}, L.dataNode, L.tabs.data && L.tabs.data.node)),
      g({name: 'mv-opinion'}, g({name: 'sc-opinion'}, L.opinionNode, L.tabs.opinion && L.tabs.opinion.node)),
      g({name: 'mv-specialist'}, g({name: 'sc-specialist'}, L.sp.node)),
      g({name: 'mv-object'}, g({name: 'sc-object'}, L.objNode)),
      L.chipsL.map(c => g({name: `${c.node.attrs.name}-w`, opacity: 0}, c.node)),
      L.relLabels.map(x => x.node),
      L.tracer,
      g({name: 'legend', opacity: 0}, L.legendParts),
      L.keyNode);
  }
}

function frameScene(ctx, L, u) {
  {
    const p = ctx.params;
    const nodes = {};
    const sep = ease.inOutCubic(seg(u, ...W.sep));
    // 1) separate: report parts slide from one stacked sheet to their places; left elements slide in
    for (const id of ['opinion', 'figure']) {
      const c = L.partC[id];
      nodes[`mv-${id}`] = {transform: T((L.home.x - c.x) * (1 - sep), (L.home.y - c.y) * (1 - sep)), opacity: r(clamp(sep * 1.6), 3)};
    }
    nodes['mv-data'] = {transform: ''};
    const inL = ease.outCubic(seg(u, 0.02, 0.14));
    nodes['mv-specialist'] = {transform: T(-L.S * 4 * (1 - inL), 0), opacity: r(inL, 3)};
    nodes['mv-object'] = {transform: T(-L.S * 4 * (1 - inL), 0), opacity: r(inL, 3)};
    for (const c of L.chipsL) nodes[`${c.node.attrs.name}-w`] = {opacity: r(seg(u, 0.1, 0.17), 3)};
    // 2) relate: connectors one by one, in the supplied order
    const n = L.rels.length;
    const relP = i => seg(u, W.rel[0] + ((W.rel[1] - W.rel[0]) / n) * i, W.rel[0] + ((W.rel[1] - W.rel[0]) / n) * (i + 0.85));
    L.conns.forEach((cn, i) => Object.assign(nodes, cn.c.frame(relP(i), relP(i) > 0 ? 1 : 0)));
    L.relLabels.forEach(x => { nodes[`rl${x.i}`] = {opacity: r(clamp((relP(x.i) - 0.6) / 0.4), 3)}; });
    // 3) trace: the tag follows the traversal order; parts take their supplied state on arrival
    const tp = ease.inOutSine(seg(u, ...W.trace));
    const at = L.route.poly.at(tp);
    const tracing = u >= W.trace[0] && u <= W.trace[1] + 0.03;
    nodes.tracer = {opacity: tracing && L.route.poly.total > 0 ? 1 : 0, transform: T(at.x, at.y)};
    const reached = L.route.visits.filter(v => tp >= v.t - 1e-6).map(v => v.id);
    const arrive = id => {
      const v = L.route.visits.find(x => x.id === id);
      const tu = v ? W.trace[0] + (W.trace[1] - W.trace[0]) * v.t : W.late[0];
      return tu;
    };
    const late = id => clamp((u - arrive(id)) / 0.04);
    const dataP = late('data'), figP = late('figure'), opP = late('opinion');
    const rowsN = p.props.report.measurements.length;
    for (let i = 0; i < rowsN; i++) {
      const v = clamp((u - arrive('data') - 0.01 * i) / 0.035);
      // placeholder out first, then the text in (text never lies over the dashes)
      nodes[`d-row${i}`] = {opacity: r(clamp((v - 0.4) / 0.6), 3)};
      nodes[`d-ph${i}`] = {opacity: r(1 - clamp(v / 0.4), 3)};
    }
    nodes['fig-wipe'] = {width: r(L.elements.figure.box.w * figP)};
    Object.assign(nodes, drawOn('fig-dim', seg(figP, 0.7, 1)));
    nodes['op-fence'] = {'stroke-dashoffset': r(100 * (1 - opP), 2)};
    nodes['op-fill'] = {opacity: r(0.6 * opP, 3)};
    nodes['op-text'] = {opacity: r(clamp((opP - 0.3) / 0.7), 3)};
    nodes['op-scope'] = {opacity: r(clamp((opP - 0.6) / 0.4), 3)};
    nodes['op-ph'] = {opacity: r(1 - clamp(opP / 0.3), 3)};
    // focus element enlarges while the tag passes it
    const fv = L.route.visits.find(v => v.id === p.focusElement);
    let focusScale = 1;
    if (fv && u >= W.trace[0]) {
      const d = Math.abs(tp - fv.t);
      focusScale = 1 + ((L.FOCUS_MAX[p.focusElement] || 1) - 1) * clamp(1 - d / 0.22) * (1 - seg(u, 0.75, 0.8));
    }
    for (const id of ['specialist', 'object', 'data', 'figure', 'opinion']) {
      const c = L.focusAnchor[id];
      nodes[`sc-${id}`] = {transform: id === p.focusElement && focusScale !== 1 ? scaleAbout(c.x, c.y, focusScale) : ''};
    }
    // 4) gather: legend and key
    nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    if (L.keyNode) nodes.key = {opacity: r(seg(u, ...W.key), 3)};
    // connector end gaps (each connector ends at its element edge)
    const tailTip = L.focusAnchor.opinion;
    const gapOf = (pt, e) => (e === L.elements.opinion && Math.hypot(pt.x - tailTip.x, pt.y - tailTip.y) < 1 ? 0 : e.circle ? Math.abs(Math.hypot(pt.x - e.circle.x, pt.y - e.circle.y) - e.circle.r)
      : Math.min(Math.abs(pt.x - e.box.x), Math.abs(pt.x - e.box.x - e.box.w), Math.abs(pt.y - e.box.y), Math.abs(pt.y - e.box.y - e.box.h)));
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sep, 3),
        relationsDrawn: L.rels.map((_, i) => r(relP(i), 3)),
        tracer: {x: r(at.x), y: r(at.y)},
        tracerVisible: nodes.tracer.opacity === 1,
        visitOrder: reached,
        focus: p.focusElement, focusScale: r(focusScale, 3),
        states: {data: r(dataP, 3), figure: r(figP, 3), opinion: r(opP, 3)},
        arrows: L.rels.map(x => ({kind: x.kind, arrow: LINK_STYLES[x.kind].arrow})),
        connectorGaps: L.conns.map(cn => r(Math.max(gapOf(cn.c.from, L.elements[cn.rel.from]), gapOf(cn.c.to, L.elements[cn.rel.to])), 2)),
        focusClear: L.focusClear, minConnLen: r(L.minConnLen), labelGap: r(L.labelGap), labelsOwn: L.labelsOwn, chipsCrossed: L.chipsCrossed,
        labelsFit: L.labelsFit, legendClear: L.legendClear, layoutFits: L.L.fits,
        S: L.S,
      },
    };
  }
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-04-mechanism',
    title: 'Specialist intervention — how the object, the data, the figure and the stated opinion connect',
    titleEs: 'Intervención de perito — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Intervención de perito',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: the specialist and the examined object on the left; the report pulled apart into its opinion (dashed-fence bubble), data and figure parts. Only the supplied relationships are drawn, styled by kind (plain relations never get arrows); a manila tag tracer follows the supplied order and each part takes its supplied state as the tag arrives; the focus element enlarges. As supplied; no conclusion drawn.',
    tags: ['specialist', 'expert', 'report', 'mechanism', 'relations', 'tracer', 'data examined', 'opinion scope', 'figure', 'exploded view'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/intervencion-de-perito.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: PERITO_STRINGS,
  scene,
});
