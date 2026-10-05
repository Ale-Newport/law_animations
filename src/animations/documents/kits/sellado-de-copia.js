/**
 * Stamping-desk stage for the "Sellado de copia" motif (LAW-0005..0008).
 *
 * A top-down registry desk inside a clipped window. Party A keeps a hand on
 * the signed original; clerk B steadies a photocopy of it with one hand while
 * the other lifts a rubber stamp off its rest, dips it into an ink pad,
 * carries it (raised = larger with a displaced shadow) over a dashed landing
 * target, lowers it onto the copy and lifts it again: the ink mark appears
 * exactly under the stamp face, at the stamp's rotation. The clerk can then
 * slide the marked copy onto B's file while A draws the original back.
 *
 * The kit owns geometry and a pose solver only (action values → node props);
 * every entry owns its own timeline, layout and semantics.
 *
 * Attachment rules (asserted through semantics by the tests):
 *  - the stamp is positioned from the SOLVED stamp hand while it is held;
 *    it only rests at its rest spot, on the pad or on the copy;
 *  - the steadying hand coincides with the copy's grip point while it holds
 *    or slides the copy; A's hand coincides with the original's grip point;
 *  - the mark is drawn inside the copy group at the exact spot and rotation
 *    of the stamp face at contact, so it travels with the copy afterwards;
 *  - every IK target is inside arm reach (`reach.*`).
 * @module animations/documents/kits/sellado-de-copia
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, roundRectPath} from '../../../core/geometry.js';
import {paperDocument, signatureStroke, pen, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';

/** Canonical stage sizes (design units) per axis. */
export const DESK = {horizontal: {w: 1600, h: 900}, square: {w: 1200, h: 1100}, vertical: {w: 900, h: 1400}};

/**
 * Geometry per axis. `[fx, fy]` pairs are fractions of the stage; `stamp`
 * and `pad` are sizes in design units; `retrieve` is A's pull-back offset.
 */
const GEO = {
  horizontal: {
    dh: 520, orig: [0.19, 0.555], copy: [0.475, 0.555], folder: [0.8, 0.565], pad: [0.585, 0.13], rest: [0.735, 0.135],
    pen: [0.055, 0.2, -18], shStamp: [0.74, -0.1], shSteady: [0.5, -0.11], shA: [0.07, 1.2],
    handRestStamp: [0.875, 0.1], handRestSteady: [0.43, 0.03], retrieve: [-30, 56], filedRot: 2,
    stamp: [156, 104], padSize: [180, 114], arm: {upper: 310, lower: 290},
    chipB: {x: 0.015, anchor: 'start', maxWidth: 0.38, lines: 2}, chipA: {x: 0.335, anchor: 'start', maxWidth: 0.44}, markRot: -7,
  },
  square: {
    dh: 440, orig: [0.165, 0.56], copy: [0.465, 0.56], folder: [0.79, 0.57], pad: [0.57, 0.13], rest: [0.76, 0.14],
    pen: [0.05, 0.2, -18], shStamp: [0.7, -0.05], shSteady: [0.46, -0.08], shA: [0.05, 1.15],
    handRestStamp: [0.93, 0.08], handRestSteady: [0.36, 0.05], retrieve: [-24, 50], filedRot: 2,
    stamp: [146, 98], padSize: [170, 108], arm: {upper: 320, lower: 300},
    chipB: {x: 0.02, anchor: 'start', maxWidth: 0.33, lines: 2}, chipA: {x: 0.3, anchor: 'start', maxWidth: 0.5}, markRot: -7,
  },
  vertical: {
    // the original (and its pull-back) stays >= 40 units inside the desk's bottom edge
    dh: 430, orig: [0.36, 0.785], copy: [0.3, 0.43], folder: [0.735, 0.44], pad: [0.72, 0.085], rest: [0.45, 0.145],
    pen: [0.82, 0.73, 115], shStamp: [0.66, -0.02], shSteady: [0.28, -0.04], shA: [-0.02, 1.07],
    handRestStamp: [0.93, 0.05], handRestSteady: [0.12, 0.06], retrieve: [-28, 30], filedRot: 2,
    stamp: [140, 94], padSize: [166, 106], arm: {upper: 320, lower: 300},
    chipB: {x: 0.455, anchor: 'middle', maxWidth: 0.36, lines: 3, size: 26}, chipA: {x: 0.97, anchor: 'end', maxWidth: 0.42, lines: 4}, markRot: -7,
  },
};

/** Preferred mark centre in copy-local (top-left origin) fractions of the sheet. */
const MARK_LOCAL = [0.63, 0.285];

/**
 * Stamping spot on a sheet (sheet-local, top-left origin): right of centre,
 * in the upper part, but always BELOW the document heading so the impression
 * never hides the title (a two-line title pushes the spot down). The heading
 * height is measured with the same rules as `paperDocument` (text-on layout),
 * so the spot does not move when labels are hidden.
 * @param {any} ctx
 * @param {{w:number, h:number, title?:string, sw:number, sh:number, rot?:number}} o  sheet size, title, stamp footprint and rotation (deg)
 * @returns {{x:number, y:number, ruleY:number, titleTop:number, titleRight:number, maxX:number, extY:number}}
 *   also the heading band (`titleTop`..`ruleY`), the right end of the title text
 *   and the largest centre x that keeps the impression on the sheet
 */
export function markSpotLocal(ctx, o) {
  const {w, h: hh, sw, sh} = o;
  const a = rad(Math.abs(o.rot ?? 0));
  const extX = (sw / 2) * Math.cos(a) + (sh / 2) * Math.sin(a);
  const extY = (sh / 2) * Math.cos(a) + (sw / 2) * Math.sin(a);
  const pad = w * 0.09;
  const idSize = Math.max(14, w * 0.043);
  const titleSize = Math.max(18, w * 0.068);
  const titleTop = pad * 0.9 + idSize * 1.55;
  let ruleY = titleTop;
  let titleRight = pad + (w - pad * 2) * 0.7;
  if (o.title) {
    const f = ctx.fit(o.title, {maxWidth: w - pad * 2, size: titleSize, minSize: Math.max(14, titleSize * 0.7), maxLines: 2, weight: 700, family: 'serif'});
    ruleY += f.height + titleSize * 0.55;
    titleRight = pad + f.width;
  } else {
    ruleY += titleSize * 1.3;
  }
  const y = Math.min(Math.max(hh * MARK_LOCAL[1], ruleY + 6 + extY), hh * 0.72 - extY);
  const maxX = w - 10 - extX;
  const x = Math.min(w * MARK_LOCAL[0], maxX);
  return {x, y, ruleY, titleTop, titleRight, maxX, extY};
}
/** The steadying hand holds the copy near its top-left corner. */
const GRIP_COPY = [0.13, 0.085];
/** Party A's hand rests on the original's lower edge. */
const GRIP_ORIG = [0.46, 0.9];

/**
 * Photocopy or original sheet: the same document drawn twice from the same
 * line seed, so the copy visibly reproduces the original. The copy gets a
 * toner tint, a scanner edge band, a few specks and a grey reproduced
 * signature; the original keeps its blue ink signature.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, doc:{docId:string,title:string,clauses:string[],redactions?:number[]}, signer:string, tone:'copy'|'original', showText:boolean, redact?:boolean}} o
 */
export function sheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const doc = paperDocument(ctx, {
    prefix: o.prefix, w, h: hh, docId: o.doc.docId, title: o.doc.title, clauses: o.doc.clauses,
    signerLabel: o.showText ? o.signer : '', showText: o.showText, lineSeed: 'seal-doc',
  });
  const isCopy = o.tone === 'copy';
  const fold = w * 0.11;
  const outline = `M0 4Q0 0 4 0H${r(w - fold)}L${r(w)} ${r(fold)}V${r(hh - 4)}Q${r(w)} ${r(hh)} ${r(w - 4)} ${r(hh)}H4Q0 ${r(hh)} 0 ${r(hh - 4)}Z`;
  const sig = signatureStroke(o.signer, ctx.rng, doc.sigBox);
  const parts = [doc.node];
  if (isCopy) {
    parts.push(h('path', {d: outline, fill: '#6c747d', opacity: 0.16}));
    parts.push(h('path', {d: `M5 ${r(fold * 0.3)}V${r(hh - 6)}`, stroke: '#3d434b', 'stroke-width': 7, opacity: 0.2, 'stroke-linecap': 'round'}));
    parts.push(h('path', {d: `M${r(w * 0.04)} ${r(hh - 5)}H${r(w - 6)}`, stroke: '#3d434b', 'stroke-width': 4, opacity: 0.14, 'stroke-linecap': 'round'}));
    for (let i = 0; i < 11; i++) {
      const x = w * (0.06 + 0.88 * ctx.rng(`${o.prefix}-speck-x`, i));
      const y = hh * (0.05 + 0.9 * ctx.rng(`${o.prefix}-speck-y`, i));
      parts.push(h('circle', {cx: r(x), cy: r(y), r: r(1.2 + ctx.rng(`${o.prefix}-speck-r`, i) * 1.8), fill: '#353a41', opacity: 0.45}));
    }
  }
  parts.push(h('path', {d: sig.d(1), fill: 'none', stroke: isCopy ? '#3f454d' : '#1d3f8f', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  if (o.redact !== false) {
    for (const i of (o.doc.redactions || []).filter(k => k < doc.clauseBoxes.length)) {
      const b = doc.clauseBoxes[i];
      parts.push(h('rect', {x: r(b.x - 4), y: r(b.y - 2), width: r(b.w + 8), height: r(Math.min(b.h - 6, 60)), rx: 4, fill: th.ink}));
    }
  }
  return {node: g(null, parts), doc, outline, w, h: hh};
}

/**
 * Ink impression left by the stamp. Local origin = centre of the footprint
 * (same footprint as the die). A seeded wear mask gives the uneven ink of a
 * real rubber stamp. With labels hidden the legend becomes ink bars.
 * `alt` supplies an alternative legend or date line: it is drawn as a second
 * text node at the same place (`${name}-label-alt` / `${name}-detail-alt`,
 * hidden) so a substitution can swap ONE line while the rest stays inked.
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, label:string, detail?:string, alt?:{label?:string, detail?:string}, color:string, showText:boolean, opacity?:number}} o
 */
export function inkMark(ctx, o) {
  const {w, h: hh, color: c} = o;
  const alt = o.alt || {};
  const maskId = `${o.name}-wear`;
  const specks = [];
  for (let i = 0; i < 16; i++) {
    const x = (ctx.rng(`${o.name}-wx`, i) - 0.5) * w * 0.96;
    let y = (ctx.rng(`${o.name}-wy`, i) - 0.5) * hh * 0.92;
    // wear stays on the borders: a gap punched into a letter would misspell the legend
    if (Math.abs(x) < w * 0.42 && Math.abs(y) < hh * 0.36) y = Math.sign(y || 1) * hh * (0.38 + 0.08 * ctx.rng(`${o.name}-wb`, i));
    specks.push(h('circle', {cx: r(x), cy: r(y), r: r(1.4 + ctx.rng(`${o.name}-wr`, i) * 2.6), fill: '#000'}));
  }
  const inner = [];
  const hasDetail = Boolean(o.detail || alt.detail);
  if (o.showText) {
    // The legend must stay inside the inner border (box w-22 × hh-22, minus a
    // small margin); letter spacing is part of the measured width.
    const ls = 1;
    const innerW = Math.min(w * 0.78, w - 40);
    const innerH = hh - 32;
    // with a date line the legend keeps the band above the rule and may wrap to
    // two lines there, so a longer legend is never cut
    const bandTop = -hh / 2 + 12, bandH = -hh * 0.02 - bandTop;
    const labelText = (text, name, opacity) => {
      const f = fitInk(ctx, text, hasDetail
        ? {maxWidth: innerW, maxH: bandH, size: hh * 0.27, minSize: Math.max(9, hh * 0.12), maxLines: 2, weight: 800, ls}
        : {maxWidth: innerW, maxH: innerH, size: hh * 0.3, minSize: Math.max(9, hh * 0.11), maxLines: 3, weight: 800, ls});
      const ly = hasDetail ? bandTop + (bandH - f.height) / 2 : -f.height / 2 + f.size * 0.04;
      return textBlock(f, {x: 0, y: r(ly), anchor: 'middle', fill: c, letterSpacing: ls, name, opacity});
    };
    inner.push(labelText(o.label, `${o.name}-label`));
    if (alt.label) inner.push(labelText(alt.label, `${o.name}-label-alt`, 0));
    if (hasDetail) {
      inner.push(h('line', {x1: r(-w * 0.34), x2: r(w * 0.34), y1: r(hh * 0.07), y2: r(hh * 0.07), stroke: c, 'stroke-width': 2}));
      const detailText = (text, name, opacity) => {
        const d = fitInk(ctx, text, {maxWidth: Math.min(w * 0.74, w - 40), maxH: hh * 0.24, size: hh * 0.17, minSize: Math.max(8, hh * 0.1), maxLines: 1, weight: 700, ls: 0});
        return textBlock(d, {x: 0, y: r(hh * 0.15), anchor: 'middle', fill: c, name, opacity});
      };
      if (o.detail) inner.push(detailText(o.detail, `${o.name}-detail`));
      if (alt.detail) inner.push(detailText(alt.detail, `${o.name}-detail-alt`, 0));
    }
  } else {
    inner.push(h('path', {d: `M${r(-w * 0.3)} ${r(-hh * 0.06)}H${r(w * 0.3)}M${r(-w * 0.18)} ${r(hh * 0.18)}H${r(w * 0.18)}`, stroke: c, 'stroke-width': r(hh * 0.12), 'stroke-linecap': 'round'}));
  }
  return g({name: o.name, opacity: o.opacity},
    h('defs', null, h('mask', {id: ctx.id(maskId), maskUnits: 'userSpaceOnUse', x: r(-w), y: r(-hh), width: r(w * 2), height: r(hh * 2)},
      h('rect', {x: r(-w), y: r(-hh), width: r(w * 2), height: r(hh * 2), fill: '#fff'}), specks)),
    g({mask: ctx.ref(maskId)},
      h('path', {d: roundRectPath(-w / 2 + 3, -hh / 2 + 3, w - 6, hh - 6, 9), fill: 'none', stroke: c, 'stroke-width': 5}),
      h('path', {d: roundRectPath(-w / 2 + 11, -hh / 2 + 11, w - 22, hh - 22, 5), fill: 'none', stroke: c, 'stroke-width': 2}),
      inner),
  );
}

/**
 * Fit a legend into a box of `maxWidth × maxH`: the largest size (down to
 * `minSize`) and line count (up to `maxLines`) whose block height fits and
 * whose every line, including `ls` letter spacing per glyph, fits the width.
 * Falls back to the smallest size with as many lines as the height allows
 * (ellipsis on the last line).
 * @param {any} ctx
 * @param {string} text
 * @param {{maxWidth:number, maxH:number, size:number, minSize:number, maxLines:number, weight:number, ls:number}} o
 */
export function fitInk(ctx, text, o) {
  const lead = 1.18;
  const len = [...String(text ?? '')].length;
  for (let s = o.size; s >= o.minSize - 1e-6; s -= 0.5) {
    const byHeight = Math.floor((o.maxH - s) / (s * lead) + 1e-6) + 1;
    const most = Math.min(o.maxLines, byHeight);
    for (let n = 1; n <= most; n++) {
      const f = ctx.fit(text, {maxWidth: o.maxWidth - o.ls * (Math.ceil(len / n) + 3), size: s, minSize: s, maxLines: n, weight: o.weight});
      if (f.truncated || f.height > o.maxH + 1e-6) continue;
      if (f.lines.every(l => ctx.measure(l, f.size, o.weight) + o.ls * [...l].length <= o.maxWidth + 0.5)) return f;
    }
  }
  const s = o.minSize;
  const n = Math.max(1, Math.min(o.maxLines, Math.floor((o.maxH - s) / (s * lead) + 1e-6) + 1));
  return ctx.fit(text, {maxWidth: o.maxWidth - o.ls * (Math.ceil(len / n) + 3), size: s, minSize: s, maxLines: n, weight: o.weight});
}

/**
 * Rubber stamp seen from above: rubber die edge, wooden mount with an index
 * plate that shows a miniature of the impression, and a turned knob.
 * Local origin = centre of the die (the knob sits there too).
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, ink:string}} o
 * @returns {{node:any, shadow:any}}
 */
export function rubberStamp(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, ink} = o;
  const wood = '#b98a5e';
  const knob = '#6e4b2f';
  const px = -w / 2 + 10, pw = w * 0.2, ph = hh * 0.5;
  return {
    shadow: h('path', {name: `${o.name}-sh`, d: roundRectPath(-w / 2 - 6, -hh / 2 - 6, w + 12, hh + 12, 14), fill: th.shadow}),
    node: g({name: o.name},
      h('path', {d: roundRectPath(-w / 2 - 5, -hh / 2 - 5, w + 10, hh + 10, 12), fill: shade(ink, -0.3), stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 9), fill: wood, stroke: th.ink, 'stroke-width': th.stroke}),
      h('path', {d: roundRectPath(-w / 2 + 8, -hh / 2 + 8, w - 16, hh - 16, 6), fill: shade(wood, 0.2), opacity: 0.75}),
      h('path', {d: `M${r(-w / 2 + 12)} ${r(hh / 2 - 12)}H${r(w / 2 - 12)}`, stroke: shade(wood, -0.25), 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6}),
      // index plate (miniature impression)
      h('rect', {x: r(px), y: r(-ph / 2), width: r(pw), height: r(ph), rx: 3, fill: '#fbf7ee', stroke: th.ink, 'stroke-width': 1.5}),
      h('rect', {x: r(px + 4), y: r(-ph / 2 + 5), width: r(pw - 8), height: r(ph - 10), rx: 2, fill: 'none', stroke: ink, 'stroke-width': 1.6}),
      h('path', {d: `M${r(px + 8)} ${r(-2)}H${r(px + pw - 8)}M${r(px + 10)} ${r(5)}H${r(px + pw - 10)}`, stroke: ink, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
      // knob
      h('circle', {cx: 0, cy: 0, r: r(hh * 0.36), fill: shade(knob, 0.25), stroke: th.ink, 'stroke-width': th.stroke}),
      h('circle', {cx: 0, cy: 0, r: r(hh * 0.25), fill: knob, stroke: th.ink, 'stroke-width': 1.5}),
      h('circle', {cx: r(-hh * 0.09), cy: r(-hh * 0.09), r: r(hh * 0.075), fill: '#fff', opacity: 0.4}),
    ),
  };
}

/**
 * Open ink pad seen from above: tin, inked felt, lid folded back.
 * Local origin = centre of the felt.
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, ink:string}} o
 */
export function inkPad(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, ink} = o;
  const metal = '#aab3bb';
  const lidH = hh * 0.34;
  const felt = shade(ink, -0.28);
  return g({name: o.name},
    h('path', {d: roundRectPath(-w / 2 + 6, -hh / 2 - lidH + 10, w, hh + lidH, 12), fill: th.shadow}),
    // lid folded back (foreshortened)
    h('path', {d: `M${r(-w / 2 + 6)} ${r(-hh / 2)}L${r(-w / 2 + 14)} ${r(-hh / 2 - lidH)}H${r(w / 2 - 14)}L${r(w / 2 - 6)} ${r(-hh / 2)}Z`, fill: shade(metal, 0.18), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-w * 0.28)} ${r(-hh / 2 - lidH * 0.5)}H${r(w * 0.28)}`, stroke: shade(metal, -0.2), 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 10), fill: metal, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(-w / 2 + 11, -hh / 2 + 11, w - 22, hh - 22, 6), fill: felt, stroke: shade(felt, -0.3), 'stroke-width': 1.5}),
    h('path', {d: `M${r(-w / 2 + 22)} ${r(-hh / 2 + 24)}L${r(-w / 2 + 44)} ${r(-hh / 2 + 16)}M${r(-w / 2 + 22)} ${r(-hh / 2 + 42)}L${r(-w / 2 + 70)} ${r(-hh / 2 + 18)}`, stroke: '#fff', 'stroke-width': 3, opacity: 0.25, 'stroke-linecap': 'round'}),
  );
}

/**
 * Open file folder seen from above holding a few earlier sheets.
 * Local origin = centre. The label sits on a white plate near the bottom.
 */
export function fileFolder(ctx, {w, h: hh, label, color = '#d9b877', showText = true}) {
  const th = ctx.theme;
  const x0 = -w / 2, y0 = -hh / 2;
  const tabW = w * 0.36;
  let labelNode = null;
  if (label && showText) {
    const f = ctx.fit(label, {maxWidth: w * 0.78, size: 24, minSize: 14, maxLines: 1, weight: 700});
    const pw = f.width + 26;
    labelNode = g(null,
      h('rect', {x: r(-pw / 2), y: r(hh / 2 - 50), width: r(pw), height: 38, rx: 6, fill: '#fffdf6', stroke: th.ink, 'stroke-width': 1.5}),
      textBlock(f, {x: 0, y: r(hh / 2 - 50 + (38 - f.size) / 2), anchor: 'middle', fill: th.ink}));
  }
  return g(null,
    h('path', {d: roundRectPath(x0 + 8, y0 + 12, w, hh, 12), fill: th.shadow}),
    h('path', {d: `M${r(x0)} ${r(y0 + 32)}Q${r(x0)} ${r(y0)} ${r(x0 + 12)} ${r(y0)}H${r(x0 + tabW)}L${r(x0 + tabW + 22)} ${r(y0 + 22)}H${r(-x0 - 12)}Q${r(-x0)} ${r(y0 + 22)} ${r(-x0)} ${r(y0 + 34)}V${r(-y0 - 12)}Q${r(-x0)} ${r(-y0)} ${r(-x0 - 12)} ${r(-y0)}H${r(x0 + 12)}Q${r(x0)} ${r(-y0)} ${r(x0)} ${r(-y0 - 12)}Z`, fill: color, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(x0 + w * 0.09), y: r(y0 + hh * 0.07), width: r(w * 0.8), height: r(hh * 0.76), rx: 4, fill: '#efe9dc', stroke: shade(color, -0.35), 'stroke-width': 1.5, transform: `rotate(2.2 ${r(x0 + w * 0.5)} ${r(y0 + hh * 0.5)})`}),
    h('rect', {x: r(x0 + w * 0.1), y: r(y0 + hh * 0.06), width: r(w * 0.8), height: r(hh * 0.76), rx: 4, fill: '#f6f2e8', stroke: shade(color, -0.35), 'stroke-width': 1.5, transform: `rotate(-1.4 ${r(x0 + w * 0.5)} ${r(y0 + hh * 0.5)})`}),
    h('path', {d: `M${r(x0 + 16)} ${r(-y0 - 10)}H${r(-x0 - 16)}`, stroke: shade(color, -0.2), 'stroke-width': 3}),
    labelNode,
  );
}

/**
 * The full stamping desk.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix  unique node-name prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {{docId:string,title:string,clauses:string[],redactions:number[]}} o.doc
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.signers  [A presenting party, B clerk]
 * @param {string} o.stampLabel
 * @param {string} [o.folderLabel]
 * @param {boolean} [o.chips=true]
 * @param {string} [o.markDetail]  optional date line printed in the impression
 * @param {{label?:string, detail?:string}} [o.markAlt]  alternative legend / date line (swappable text nodes)
 * @param {boolean} [o.arms=true]   draw the actors' arms
 */
export function stampingDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = DESK[axis];
  const showText = ctx.show('all');
  const at = f => ({x: W * f[0], y: H * f[1]});
  const ink = th.accent;
  const arms = o.arms !== false;

  const dh = G.dh;
  const dw = Math.round(dh * 0.76);
  const [sw, sh] = G.stamp;
  const origHome = at(G.orig);
  const copyHome = at(G.copy);
  const folderC = at(G.folder);
  const fw = Math.round(dw * 1.14), fh = Math.round(dh + 96);
  const copyFiled = {x: folderC.x + 2, y: folderC.y - 26};
  const origBack = {x: origHome.x + G.retrieve[0], y: origHome.y + G.retrieve[1]};
  const padC = at(G.pad);
  const rest = at(G.rest);
  const markSpot = markSpotLocal(ctx, {w: dw, h: dh, title: o.doc.title, sw, sh, rot: G.markRot});
  const markLocal = {x: markSpot.x, y: markSpot.y};
  const gripCopy = {x: dw * GRIP_COPY[0], y: dh * GRIP_COPY[1]};
  const gripOrig = {x: dw * GRIP_ORIG[0], y: dh * GRIP_ORIG[1]};
  const markRot = G.markRot;

  const lookA = actorLook(ctx, o.signers[0], 0);
  const lookB = actorLook(ctx, o.signers[1], 1);
  const armSpec = {...G.arm, width: 50, handScale: 1.3};
  const armA = topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', ...armSpec});
  const armS = topArm(ctx, {name: `${P}-armS`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'left', ...armSpec});
  const armT = topArm(ctx, {name: `${P}-armT`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'right', ...armSpec});
  const shA = at(G.shA), shS = at(G.shSteady), shT = at(G.shStamp);
  const restT = at(G.handRestStamp), restS = at(G.handRestSteady);

  // --- sheets
  const docData = o.doc;
  const orig = sheet(ctx, {prefix: `${P}-orig`, w: dw, h: dh, doc: docData, signer: o.signers[0].name, tone: 'original', showText, redact: false});
  const copy = sheet(ctx, {prefix: `${P}-copy`, w: dw, h: dh, doc: docData, signer: o.signers[0].name, tone: 'copy', showText});
  const markNodes = [inkMark(ctx, {name: `${P}-imp`, w: sw, h: sh, label: o.stampLabel, detail: o.markDetail, alt: o.markAlt, color: ink, showText})];
  const pad = 14;
  const target = h('path', {name: `${P}-target`, d: roundRectPath(-sw / 2 - pad, -sh / 2 - pad, sw + pad * 2, sh + pad * 2, 14), fill: th.accent2Soft, 'fill-opacity': 0.35, stroke: th.accent2, 'stroke-width': 4, 'stroke-dasharray': '12 9', opacity: 0});
  const pulse = h('path', {name: `${P}-pulse`, d: roundRectPath(-sw / 2 - 6, -sh / 2 - 6, sw + 12, sh + 12, 12), fill: 'none', stroke: ink, 'stroke-width': 4, opacity: 0});
  const markGroup = g({transform: T(markLocal.x, markLocal.y, markRot)},
    target,
    g({name: `${P}-mark`, opacity: 0}, markNodes),
    g({name: `${P}-pulseg`}, pulse));
  const copyNode = g({name: `${P}-copyg`}, g({transform: T(-dw / 2, -dh / 2)}, copy.node, markGroup));
  const origNode = g({name: `${P}-origg`}, g({transform: T(-dw / 2, -dh / 2)}, orig.node));

  // --- props
  const padNode = g({transform: T(padC.x, padC.y)}, inkPad(ctx, {name: `${P}-pad`, w: G.padSize[0], h: G.padSize[1], ink}));
  const stamp = rubberStamp(ctx, {name: `${P}-stamp`, w: sw, h: sh, ink});
  const penProp = pen(ctx, {name: `${P}-pen`, length: 190, body: th.accent2});
  const penAt = at(G.pen);
  const folderNode = g({transform: T(folderC.x, folderC.y)}, fileFolder(ctx, {w: fw, h: fh, label: o.folderLabel, showText}));

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30});

  // --- actor chips, kept clear of the action
  const chipSize = axis === 'vertical' ? 30 : 28;
  let chipA = null, chipB = null;
  if (o.chips !== false && ctx.show('key')) {
    const ca = G.chipA;
    const specA = {x: W * ca.x, anchor: ca.anchor, maxWidth: W * ca.maxWidth, size: chipSize, maxLines: ca.lines ?? 2, name: `${P}-chipA`};
    const textA = actorCaption(o.signers[0]);
    specA.size = wordSafeSize(ctx, textA, specA.maxWidth, specA.size);
    specA.maxWidth = balancedWidth(ctx, textA, specA.maxWidth, specA.size, specA.maxLines);
    const probe = chip(ctx, textA, {...specA, y: 0});
    chipA = chip(ctx, textA, {...specA, y: H - 20 - probe.box.h});
    const cb = G.chipB;
    const textB = actorCaption(o.signers[1]);
    const sizeB = wordSafeSize(ctx, textB, W * (cb.maxWidth ?? 0.42), cb.size ?? chipSize);
    const mwB = balancedWidth(ctx, textB, W * (cb.maxWidth ?? 0.42), sizeB, cb.lines ?? 1);
    chipB = chip(ctx, textB, {x: W * cb.x, y: 20, anchor: cb.anchor, maxWidth: mwB, size: sizeB, maxLines: cb.lines ?? 1, name: `${P}-chipB`});
  }

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      folderNode,
      origNode,
      copyNode,
      g({transform: T(penAt.x, penAt.y, G.pen[2])}, penProp.node),
      padNode,
      stamp.shadow,
      stamp.node,
      arms ? [armA.arm, armA.palm, armA.thumb, armS.arm, armS.palm, armS.thumb, armT.arm, armT.palm, armT.thumb] : null,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  const rotAt = (p, local) => {
    const a = rad(p.rot || 0);
    return {x: p.x + local.x * Math.cos(a) - local.y * Math.sin(a), y: p.y + local.x * Math.sin(a) + local.y * Math.cos(a)};
  };
  /** world point of a sheet-local (top-left origin) point for a sheet pose */
  const sheetWorld = (p, local) => rotAt(p, {x: local.x - dw / 2, y: local.y - dh / 2});
  const P2 = q => ({x: r(q.x), y: r(q.y)});
  const e3 = ease.inOutCubic;

  /**
   * Pose the stage from action values, each in [0,1] (missing = 0).
   * @param {{reach?:number, ink?:number, carry?:number, descend?:number, press?:number, lift?:number, hover?:number, back?:number, release?:number, steady?:number, file?:number, steadyRelease?:number, retrieve?:number}} s0
   */
  function pose(s0) {
    const s = {reach: 0, ink: 0, carry: 0, descend: 0, press: 0, lift: 0, hover: 0, back: 0, release: 0, steady: 0, file: 0, steadyRelease: 0, retrieve: 0, ...s0};
    const reduced = ctx.reduced;
    const nodes = {};

    // --- copy: home → folder (slid by the steadying hand)
    const fileT = e3(s.file);
    const copyPos = mix(copyHome, copyFiled, fileT);
    const copyPose = {...copyPos, rot: lerp(0, G.filedRot, fileT) + (reduced ? 0 : Math.sin(Math.PI * s.file) * -2.5)};
    nodes[`${P}-copyg`] = {transform: T(copyPose.x, copyPose.y, copyPose.rot)};
    const copyHolder = s.file >= 1 ? 'folder' : s.file > 0 ? 'sliding' : 'desk';

    // --- original: drawn back toward A
    const retT = e3(s.retrieve);
    const origPose = {...mix(origHome, origBack, retT), rot: lerp(0, -3, retT)};
    nodes[`${P}-origg`] = {transform: T(origPose.x, origPose.y, origPose.rot)};

    // --- stamp: rest → pad (ink) → above the spot → down → up → rest
    const spot = sheetWorld(copyPose, markLocal);
    const padUp = {x: padC.x, y: padC.y};
    const liftEnd = mix(spot, rest, 0.18);
    let pos = rest, z = 0, rot = 0, squash = 0, where = 'rest';
    if (s.back > 0) {
      const t = e3(s.back);
      pos = mix(liftEnd, rest, t);
      z = lerp(1, 0, ease.inQuad(t));
      rot = lerp(markRot, 0, t);
      where = s.back >= 1 ? 'rest' : 'air';
      if (s.hover > 0) pos = mix(spot, rest, t);
    } else if (s.lift > 0) {
      const t = ease.outCubic(s.lift);
      pos = mix(spot, liftEnd, t);
      z = t;
      rot = markRot;
      where = 'air';
    } else if (s.press > 0) {
      pos = spot;
      rot = markRot;
      squash = Math.sin(Math.PI * s.press);
      where = 'copy';
    } else if (s.descend > 0) {
      pos = spot;
      z = 1 - ease.inQuad(s.descend);
      rot = markRot;
      where = s.descend >= 1 ? 'copy' : 'air';
    } else if (s.hover > 0) {
      pos = spot;
      z = 1 - 0.32 * Math.sin(Math.PI * s.hover);
      rot = markRot;
      where = 'air';
    } else if (s.carry > 0) {
      const t = e3(s.carry);
      pos = mix(padUp, spot, t);
      z = lerp(0.75, 1, t) + (reduced ? 0 : 0.12 * Math.sin(Math.PI * t));
      rot = lerp(0, markRot, t);
      where = 'air';
    } else if (s.ink > 0) {
      const a = seg(s.ink, 0, 0.45), b = seg(s.ink, 0.45, 0.72), c = seg(s.ink, 0.72, 1);
      if (c > 0) {
        pos = padUp;
        z = 0.75 * ease.outCubic(c);
        where = 'air';
      } else if (b > 0) {
        pos = padUp;
        squash = Math.sin(Math.PI * b);
        where = 'pad';
      } else {
        pos = mix(rest, padUp, e3(a));
        z = 0.55 * Math.sin(Math.PI * a);
        where = a >= 1 ? 'pad' : 'air';
      }
    }
    // --- mark and landing target (inside the copy group, so they travel with it)
    const applied = s.press > 0;
    nodes[`${P}-mark`] = {opacity: applied ? 0.92 : 0};
    let targetOp = clamp(seg(s.ink, 0.3, 0.8) + s.carry) * (1 - seg(s.descend, 0.8, 1));
    if (s.press > 0) targetOp = 0;
    if (s.back > 0) targetOp *= clamp(1 - s.back * 3);
    nodes[`${P}-target`] = {opacity: r(targetOp, 3)};
    const pl = applied && !reduced ? seg(s.back, 0.05, 0.75) : 0;
    const grow = 1 + 0.35 * ease.outCubic(pl);
    nodes[`${P}-pulseg`] = {transform: `scale(${r(grow, 4)})`};
    nodes[`${P}-pulse`] = {opacity: pl > 0 && pl < 1 ? r(0.9 * (1 - pl), 3) : 0};

    // --- arms
    let solvedA = null, solvedS = null, solvedT = null;
    const origGripW = sheetWorld(origPose, gripOrig);
    const copyGripW = sheetWorld(copyPose, gripCopy);
    let handT, handS;
    if (s.release > 0) handT = mix(rest, restT, e3(s.release));
    else if (s.reach < 1) handT = mix(restT, rest, e3(s.reach));
    else handT = pos;
    const holding = s.reach >= 1 && s.release === 0;
    if (s.steadyRelease > 0) handS = mix(copyGripW, restS, e3(s.steadyRelease));
    else handS = mix(restS, copyGripW, e3(s.steady));
    if (arms) {
      solvedA = armA.pose(shA, origGripW, 1);
      solvedS = armS.pose(shS, handS, -1);
      solvedT = armT.pose(shT, handT, 1);
      Object.assign(nodes, solvedA.nodes, solvedS.nodes, solvedT.nodes);
      // the stamp hand is closer to the camera while the stamp is raised
      const hk = holding ? 1 + 0.22 * z : 1;
      if (hk !== 1) {
        const pre = scaleAbout(solvedT.hand.x, solvedT.hand.y, hk);
        nodes[`${P}-armT-hand`] = {transform: `${pre} ${solvedT.nodes[`${P}-armT-hand`].transform}`};
        nodes[`${P}-armT-thumb`] = {transform: `${pre} ${solvedT.nodes[`${P}-armT-thumb`].transform}`};
      }
    }
    // the stamp follows the SOLVED hand while held (never detached)
    const stampPos = holding && solvedT ? solvedT.hand : pos;
    const k = 1 + 0.3 * z - 0.05 * squash;
    nodes[`${P}-stamp`] = {transform: T(stampPos.x, stampPos.y, rot, k)};
    nodes[`${P}-stamp-sh`] = {transform: T(stampPos.x + 8 + 34 * z, stampPos.y + 10 + 46 * z, rot, 1 + 0.12 * z), opacity: r(1 - 0.45 * z, 3)};
    const reach = {A: solvedA ? solvedA.reached : true, steady: solvedS ? solvedS.reached : true, stamp: solvedT ? solvedT.reached : true};
    return {
      nodes,
      semantic: {
        stampTool: P2(stampPos),
        stampHeight: r(z, 3),
        stampOn: where,
        stampHeld: holding,
        stampPressed: s.press > 0 && s.press < 1,
        markApplied: applied,
        markSpot: P2(spot),
        markRotation: r(copyPose.rot + markRot, 2),
        stampRotation: r(rot, 2),
        copyCenter: P2(copyPose),
        copyHolder,
        copyGrip: P2(copyGripW),
        handSteady: P2(solvedS ? solvedS.hand : handS),
        handStamp: P2(solvedT ? solvedT.hand : handT),
        originalCenter: P2(origPose),
        originalHolder: s.retrieve >= 1 ? 'A' : s.retrieve > 0 ? 'A-returning' : 'desk',
        origGrip: P2(origGripW),
        handA: P2(solvedA ? solvedA.hand : origGripW),
        reach,
        allReached: reach.A && reach.steady && reach.stamp,
      },
    };
  }

  /**
   * What covers the desk for a given pose (stage coordinates): axis-aligned
   * boxes for the sheets, folder, pad, stamp, pen, hands and actor chips, and
   * the solved arm segments. Entries use it to put annotations in free desk
   * space instead of on top of an object.
   * @param {object} v  action values (as for `pose`)
   * @returns {{rects:Array<{x:number,y:number,w:number,h:number}>, segs:Array<{a:{x:number,y:number}, b:{x:number,y:number}, r:number}>}}
   */
  function occupied(v) {
    const posed = pose(v);
    const n = posed.nodes;
    const sm = posed.semantic;
    const rects = [];
    const box = (cx, cy, w, hh) => rects.push({x: cx - w / 2, y: cy - hh / 2, w, h: hh});
    box(sm.originalCenter.x, sm.originalCenter.y, dw + 16, dh + 16);
    box(sm.copyCenter.x, sm.copyCenter.y, dw + 16, dh + 16);
    box(folderC.x + 4, folderC.y + 6, fw + 16, fh + 20);
    box(padC.x, padC.y - G.padSize[1] * 0.17, G.padSize[0] + 20, G.padSize[1] * 1.34 + 24);
    box(sm.stampTool.x + 4, sm.stampTool.y + 5, sw + 30, sh + 30);
    const pa = rad(G.pen[2]);
    const pe = {x: penAt.x + Math.cos(pa) * 190, y: penAt.y + Math.sin(pa) * 190};
    rects.push({x: Math.min(penAt.x, pe.x) - 14, y: Math.min(penAt.y, pe.y) - 14, w: Math.abs(pe.x - penAt.x) + 28, h: Math.abs(pe.y - penAt.y) + 28});
    for (const hand of [sm.handA, sm.handSteady, sm.handStamp]) box(hand.x, hand.y, 100, 100);
    for (const c of [chipA, chipB]) if (c) rects.push(c.box);
    const segs = [];
    for (const k of ['armA', 'armS', 'armT']) {
      for (const part of ['upper', 'lower']) {
        const l = n[`${P}-${k}-${part}`];
        if (l) segs.push({a: {x: l.x1, y: l.y1}, b: {x: l.x2, y: l.y2}, r: 34});
      }
    }
    return {rects, segs};
  }

  return {
    node, pose, occupied, W, H, axis, dw, dh, sw, sh, fw, fh, markLocal, markRot,
    copyHome, copyFiled, origHome, origBack, folderC, padC, rest,
    /** stage point of a copy-local point with the copy at 'home' or 'filed' */
    copyPoint: (where, local) => sheetWorld(where === 'filed' ? {...copyFiled, rot: G.filedRot} : {...copyHome, rot: 0}, local),
    /** stage point of an original-local point at 'home' or 'back' (with A) */
    origPoint: (where, local) => sheetWorld(where === 'back' ? {...origBack, rot: -3} : {...origHome, rot: 0}, local),
    doc: copy.doc,
    chipBoxes: [chipA && chipA.box, chipB && chipB.box].filter(Boolean),
  };
}

function actorCaption(p) {
  return p.role ? `${p.name} · ${p.role}` : p.name;
}

/**
 * True when `b` (padded by `pad`) touches any rectangle or arm segment of an
 * `occupied()` map, or leaves the `bounds` rectangle.
 * @param {{rects:any[], segs:any[]}} occ
 * @param {{x:number,y:number,w:number,h:number}} b
 * @param {number} [pad=6]
 * @param {{x:number,y:number,w:number,h:number}} [bounds]
 */
export function boxBlocked(occ, b, pad = 6, bounds) {
  if (bounds && (b.x < bounds.x || b.y < bounds.y || b.x + b.w > bounds.x + bounds.w || b.y + b.h > bounds.y + bounds.h)) return true;
  const x0 = b.x - pad, y0 = b.y - pad, x1 = b.x + b.w + pad, y1 = b.y + b.h + pad;
  if (occ.rects.some(q => q.x < x1 && q.x + q.w > x0 && q.y < y1 && q.y + q.h > y0)) return true;
  return occ.segs.some(sg => {
    const len = Math.hypot(sg.b.x - sg.a.x, sg.b.y - sg.a.y);
    const steps = Math.max(2, Math.ceil(len / 10));
    for (let i = 0; i <= steps; i++) {
      const x = sg.a.x + ((sg.b.x - sg.a.x) * i) / steps, y = sg.a.y + ((sg.b.y - sg.a.y) * i) / steps;
      if (x > x0 - sg.r && x < x1 + sg.r && y > y0 - sg.r && y < y1 + sg.r) return true;
    }
    return false;
  });
}

/**
 * Largest chip font size (≤ `size`) at which the widest single word still
 * fits the chip's text width, so wrapping never has to split a word.
 * @param {any} ctx
 * @param {string} text
 * @param {number} maxWidth  chip max width (padding included, as `chip()` takes it)
 * @param {number} size
 * @param {number} [weight=600]
 */
export function wordSafeSize(ctx, text, maxWidth, size, weight = 600) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  if (!words.length) return size;
  const widest = Math.max(...words.map(wd => ctx.measure(wd, size, weight)));
  const avail = maxWidth - size * 1.2;
  return widest > avail ? Math.max(12, size * (avail / widest) * 0.98) : size;
}

/**
 * Narrowest chip width (≤ `maxWidth`) that still sets `text` in the same
 * number of lines at `size`, so wrapped lines come out balanced instead of
 * leaving a one-word orphan.
 * @param {any} ctx
 * @param {string} text
 * @param {number} maxWidth  chip max width (padding included)
 * @param {number} size
 * @param {number} maxLines
 */
export function balancedWidth(ctx, text, maxWidth, size, maxLines, weight = 600) {
  const pad = size * 1.2;
  const at = w => ctx.fit(text, {maxWidth: w - pad, size, minSize: size, maxLines: 99, weight});
  const base = at(maxWidth);
  const n = base.lines.length;
  if (n < 2 || n > maxLines) return maxWidth;
  // never narrower than the widest word: a narrower box would split a word
  // (e.g. a long hyphenated surname) while keeping the same line count
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const widest = Math.max(0, ...words.map(wd => ctx.measure(wd, size, weight)));
  let lo = Math.max(pad + 10, widest + pad + 1), hi = maxWidth;
  if (lo >= hi) return maxWidth;
  for (let k = 0; k < 14; k++) {
    const mid = (lo + hi) / 2;
    if (at(mid).lines.length <= n) hi = mid; else lo = mid;
  }
  return Math.min(maxWidth, hi + 2);
}

/**
 * Scenario banner for a paired comparison: letter badge, a label that may
 * wrap to two lines and a caption that may wrap to two lines, so long
 * scenario texts stay whole and legible. Returns its height so the caller
 * can reserve a common header band for both scenarios.
 * @param {any} ctx
 * @param {{name:string, letter:string, label:string, caption?:string, x:number, y:number, w:number, color:string, size?:number}} o
 */
export function pairBanner(ctx, o) {
  const th = ctx.theme;
  const S = o.size ?? 54;
  const rB = S * 0.78;
  const cy = o.y + rB + 4;
  const tx = o.x + rB * 2 + 18;
  const maxW = o.w - rB * 2 - 24;
  const parts = [h('circle', {cx: r(o.x + rB), cy: r(cy), r: r(rB), fill: o.color, stroke: th.ink, 'stroke-width': 2.5})];
  let bottom = o.y + rB * 2 + 8;
  if (ctx.show('key')) {
    parts.push(h('text', {x: r(o.x + rB), y: r(cy + S * 0.36), 'text-anchor': 'middle', 'font-size': r(S), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter));
    const f = ctx.fit(o.label, {maxWidth: maxW, size: S, minSize: S * 0.7, maxLines: 2, weight: 700});
    const ly = cy - f.size * 0.62;
    parts.push(textBlock(f, {x: r(tx), y: r(ly), fill: th.fg}));
    bottom = Math.max(bottom, ly + f.height + 6);
    if (o.caption && ctx.show('all')) {
      const f2 = ctx.fit(o.caption, {maxWidth: maxW, size: S * 0.62, minSize: Math.max(22, S * 0.46), maxLines: 2, weight: 500});
      const cyTop = ly + f.height + S * 0.32;
      parts.push(textBlock(f2, {x: r(tx), y: r(cyTop), fill: th.fgSoft}));
      bottom = Math.max(bottom, cyTop + f2.height + 6);
    }
  }
  return {node: g({name: o.name}, parts), h: bottom - o.y};
}

/**
 * Camera lens with a MOVING source: the context can shrink into a thumbnail
 * while the detail window grows out of the source region. The window content
 * is drawn in the same stage coordinates as the context and mapped
 * source → window, so the detail keeps the source coordinates exactly.
 * @param {any} ctx
 * @param {{name:string, content:any, color:string}} o
 */
export function travellingLens(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const clipId = `${N}-clip`;
  const rad = 22;
  const node = g({name: N},
    h('path', {name: `${N}-src`, fill: 'none', stroke: o.color, 'stroke-width': 3.5, opacity: 0}),
    h('line', {name: `${N}-coneA`, stroke: o.color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('line', {name: `${N}-coneB`, stroke: o.color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${N}-cliprect`, rx: rad}))),
    g({name: `${N}-win`, opacity: 0},
      h('rect', {name: `${N}-shadow`, rx: rad, fill: th.shadow}),
      h('rect', {name: `${N}-bg`, rx: rad, fill: th.woodTop}),
      g({'clip-path': ctx.ref(clipId)}, g({name: `${N}-content`}, o.content)),
      h('rect', {name: `${N}-border`, rx: rad, fill: 'none', stroke: o.color, 'stroke-width': 5}),
    ),
  );
  /**
   * @param {{x:number,y:number,w:number,h:number}} R   source region, stage coordinates
   * @param {{x:number,y:number,w:number,h:number}} Rd  source region, design coordinates now
   * @param {{x:number,y:number,w:number,h:number}} Wd  window rect, design coordinates now
   * @param {boolean} visible
   */
  const frame = (R, Rd, Wd, visible) => {
    const k = Wd.w / R.w;
    const rect = {x: r(Wd.x), y: r(Wd.y), width: r(Wd.w), height: r(Wd.h)};
    const rc = {x: Wd.x + Wd.w / 2, y: Wd.y + Wd.h / 2}, sc = {x: Rd.x + Rd.w / 2, y: Rd.y + Rd.h / 2};
    const hor = Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y);
    let cone;
    if (hor) {
      const sx = rc.x > sc.x ? Rd.x + Rd.w : Rd.x, wx = rc.x > sc.x ? Wd.x : Wd.x + Wd.w;
      cone = [[sx, Rd.y, wx, Wd.y], [sx, Rd.y + Rd.h, wx, Wd.y + Wd.h]];
    } else {
      const sy = rc.y > sc.y ? Rd.y + Rd.h : Rd.y, wy = rc.y > sc.y ? Wd.y : Wd.y + Wd.h;
      cone = [[Rd.x, sy, Wd.x, wy], [Rd.x + Rd.w, sy, Wd.x + Wd.w, wy]];
    }
    const far = Math.hypot(rc.x - sc.x, rc.y - sc.y) > 30;
    const line = c => ({x1: r(c[0]), y1: r(c[1]), x2: r(c[2]), y2: r(c[3]), opacity: visible && far ? 1 : 0});
    return {
      [`${N}-src`]: {d: roundRectPath(r(Rd.x), r(Rd.y), r(Rd.w), r(Rd.h), 6), opacity: visible ? 1 : 0},
      [`${N}-coneA`]: line(cone[0]),
      [`${N}-coneB`]: line(cone[1]),
      [`${N}-cliprect`]: rect,
      [`${N}-win`]: {opacity: visible ? 1 : 0},
      [`${N}-shadow`]: {x: r(Wd.x + 8), y: r(Wd.y + 12), width: rect.width, height: rect.height},
      [`${N}-bg`]: rect,
      [`${N}-border`]: rect,
      [`${N}-content`]: {transform: `${T(Wd.x - R.x * k, Wd.y - R.y * k)} scale(${r(k, 4)})`},
    };
  };
  return {node, frame};
}
