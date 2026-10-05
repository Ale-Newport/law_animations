/**
 * Redaction kit for the "Ocultación de datos" motif (LAW-0017..0020).
 *
 * Shared geometry only; every entry owns its own timeline, layout and
 * semantics.
 *
 *  - `recordSheet`  a filled-in record: header (id, title, copy-type box),
 *                   labelled field rows (label + value box + fictional value)
 *                   and a footer. Each field owns an opaque redaction band
 *                   (width animatable, sits INSIDE the value box so the box
 *                   outline and label — the structure — stay visible) and a
 *                   thin "marked" outline. Once a band fully covers a value
 *                   the underlying value text is removed (opacity 0), as a
 *                   real redaction removes, not just hides, the datum.
 *  - `redactionMarker` a broad chisel-tip marker (origin at the nib).
 *  - `redactionDesk` a top-down desk stage: the record lies on an open
 *                   folder; person A picks the marker up from the desk and
 *                   sweeps it along the selected value boxes — each band's
 *                   right edge is exactly the nib while it presses; person B
 *                   carries a stamp from the desk into the copy-type box.
 *
 * Attachment rules (asserted by tests through semantics):
 *  - the marker lies still on the desk until A's solved hand reaches its grip;
 *    afterwards it is positioned from the SOLVED hand until it is laid back
 *    at the exact rest spot;
 *  - while pressing, the band edge coincides with the nib;
 *  - the stamp follows B's solved hand and marks only on contact;
 *  - shoulders lean (outside the clipped desk window) only as far as needed
 *    to keep every hand target inside arm reach (`allReached`).
 * @module animations/documents/kits/ocultacion-de-datos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, r, seg} from '../../../core/time.js';
import {mix, rad, dist, polyline, roundRectPath} from '../../../core/geometry.js';
import {stampTool, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';
import {documentsFields, list, str} from '../../../schemas/fields.js';

/** Opaque band ink and the ink of filled-in (data) values. */
export const BAND_INK = '#141619';
export const DATA_INK = '#23408e';
const FOLDER = '#d9b877';

/** Built-in strings shared by the motif's entries. */
export const REDACTION_STRINGS = {
  en: {fullCopy: 'Full copy', redactedCopy: 'Redacted copy', markedCopy: 'Marked, not covered', covered: 'Covered', visible: 'Visible'},
  es: {fullCopy: 'Copia íntegra', redactedCopy: 'Copia redactada', markedCopy: 'Marcada, sin cubrir', covered: 'Cubierto', visible: 'Visible'},
};

/** Category fields (documents) specialised for a record with fillable fields. */
export const redactionDocFields = {
  ...documentsFields,
  clauses: {...documentsFields.clauses, description: 'Field labels printed on the record; they stay visible after redaction (array replaces the previous value)'},
  signers: {...documentsFields.signers, description: 'Person applying the bands (first) and reviewer who stamps the copy (second) (array replaces the previous value)'},
  redactions: {...documentsFields.redactions, description: 'Zero-based indices of the fields whose values are covered by bands (array replaces the previous value)'},
  fieldValues: list('Fictional value filled in each field, same order as the labels', str('Field value (fictional)', 60), 1, 5),
};

/** Valid, unique, ordered redaction indices for n fields. */
export function redactedIndices(redactions, n) {
  return [...new Set((redactions || []).filter(i => Number.isInteger(i) && i >= 0 && i < n))].sort((a, b) => a - b);
}

const SANS = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Filled-in record sheet. Local origin = top-left of the sheet.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, docId?:string, title?:string, labels:string[], values:string[], showText?:boolean, stampLabel?:string|null, stampColor?:string, lineSeed?:string}} o
 */
export function recordSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix: P} = o;
  const showText = o.showText !== false;
  const pad = w * 0.08;
  const inner = w - pad * 2;
  const fold = w * 0.1;
  const parts = [];

  parts.push(h('path', {d: roundRectPath(6, 9, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: `M0 4Q0 0 4 0H${r(w - fold)}L${w} ${r(fold)}V${hh - 4}Q${w} ${hh} ${w - 4} ${hh}H4Q0 ${hh} 0 ${hh - 4}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));

  // --- header: id + title on the left, copy-type box on the right
  const stampW = inner * 0.4;
  const stampBox = {x: w - pad - stampW, y: fold + w * 0.02, w: stampW, h: stampW * 0.46};
  const leftMax = inner - stampW - pad * 0.45;
  let y = pad * 0.75;
  const idSize = Math.max(12, w * 0.036);
  if (o.docId && showText) {
    const f = ctx.fit(o.docId, {maxWidth: leftMax, size: idSize, minSize: 10, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textBlock(f, {x: pad, y, fill: th.inkSoft}));
  } else parts.push(h('rect', {x: pad, y: y + 2, width: leftMax * 0.45, height: idSize * 0.55, rx: 3, fill: th.paperLine}));
  // leave the id line's full em box (incl. descent) clear of the title's
  y += idSize * 1.55;
  const titleSize = Math.max(15, w * 0.056);
  let titleBottom;
  if (o.title && showText) {
    const f = ctx.fit(o.title, {maxWidth: leftMax, size: titleSize, minSize: Math.max(12, titleSize * 0.62), maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x: pad, y, fill: th.ink}));
    titleBottom = y + f.height;
  } else {
    parts.push(h('rect', {x: pad, y, width: leftMax * 0.9, height: titleSize * 0.62, rx: 4, fill: th.ink, opacity: 0.8}));
    parts.push(h('rect', {x: pad, y: y + titleSize * 0.95, width: leftMax * 0.55, height: titleSize * 0.62, rx: 4, fill: th.ink, opacity: 0.8}));
    titleBottom = y + titleSize * 1.6;
  }
  parts.push(h('path', {d: roundRectPath(stampBox.x, stampBox.y, stampBox.w, stampBox.h, 6), fill: 'none', stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
  const headerBottom = Math.max(titleBottom, stampBox.y + stampBox.h) + w * 0.035;
  parts.push(h('line', {x1: pad, x2: w - pad, y1: headerBottom, y2: headerBottom, stroke: th.paperLine, 'stroke-width': 2}));

  // --- field rows
  const labels = o.labels && o.labels.length ? o.labels.slice(0, 5) : [''];
  const n = labels.length;
  const footerH = hh * 0.085;
  const rowsTop = headerBottom + w * 0.04;
  const rowsBottom = hh - footerH - pad * 0.25;
  const slot = (rowsBottom - rowsTop) / Math.max(n, 4);
  const labelSize = Math.max(Math.min(11, slot * 0.22), Math.min(w * 0.034, slot * 0.22));
  const boxH = Math.max(4, Math.min(slot - labelSize * 1.4 - slot * 0.12, w * 0.09));
  const bandInset = 3;
  const fields = labels.map((lab, i) => {
    const ry = rowsTop + i * slot;
    const box = {x: pad, y: ry + labelSize * 1.35, w: inner, h: boxH};
    const labelBox = {x: pad, y: ry, w: inner * 0.5, h: labelSize};
    if (lab && showText) {
      const f = ctx.fit(lab, {maxWidth: inner, size: labelSize, minSize: Math.max(9, labelSize * 0.72), maxLines: 1, weight: 600});
      parts.push(textBlock(f, {x: pad, y: ry, fill: th.inkSoft}));
      labelBox.w = f.width;
    } else {
      const lw = inner * (0.28 + ctx.rng(`${o.lineSeed || P}-lab`, i) * 0.2);
      parts.push(h('rect', {x: pad, y: ry + labelSize * 0.2, width: r(lw), height: labelSize * 0.6, rx: 3, fill: th.inkSoft, opacity: 0.55}));
      labelBox.w = lw;
    }
    parts.push(h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 5), fill: '#f6f1e6', stroke: th.paperLine, 'stroke-width': 1.8}));
    const val = (o.values && o.values[i]) || '';
    const vx = box.x + boxH * 0.3;
    const vSize = boxH * 0.5;
    let valueRight = vx;
    if (val && showText) {
      const f = ctx.fit(val, {maxWidth: inner - boxH * 0.6, size: vSize, minSize: vSize * 0.66, maxLines: 1, weight: 600});
      parts.push(textBlock(f, {x: vx, y: box.y + (boxH - f.size) / 2 - f.size * 0.04, fill: DATA_INK, name: `${P}-val-${i}`}));
      valueRight = vx + f.width;
    } else if (val) {
      const vw = Math.min(inner - boxH * 0.6, Math.max(inner * 0.2, val.length * vSize * 0.5));
      parts.push(h('rect', {name: `${P}-val-${i}`, x: vx, y: box.y + boxH * 0.36, width: r(vw), height: boxH * 0.28, rx: boxH * 0.14, fill: DATA_INK, opacity: 0.62}));
      valueRight = vx + vw;
    }
    // band (starts empty) and "marked" outline (starts undrawn)
    const band = {x: box.x + bandInset, y: box.y + bandInset, w: box.w - bandInset * 2, h: box.h - bandInset * 2};
    parts.push(h('rect', {name: `${P}-band-${i}`, x: r(band.x), y: r(band.y), width: 0, height: r(band.h), rx: 3, fill: BAND_INK}));
    // Outline margin: 7 units, reduced so the thick stroke (4.5) stays at
    // least 3 units below the field label's descenders.
    const gapAbove = box.y - (ry + labelSize);
    const m = clamp(gapAbove - 2.25 - 3, 2.5, 7);
    const outline = polyline([
      {x: box.x - m, y: box.y - m}, {x: box.x + box.w + m, y: box.y - m}, {x: box.x + box.w + m, y: box.y + box.h + m},
      {x: box.x - m, y: box.y + box.h + m}, {x: box.x - m, y: box.y - m},
    ]);
    parts.push(h('path', {name: `${P}-mark-${i}`, d: outline.d(), fill: 'none', stroke: BAND_INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(outline.total)} ${r(outline.total + 10)}`, 'stroke-dashoffset': r(outline.total)}));
    return {i, box, labelBox, band, outline, hasValue: Boolean(val), coverAt: valueRight - band.x + 4, valueX0: vx - band.x, valueW: valueRight - vx};
  });

  // --- footer
  const fy = hh - footerH;
  parts.push(h('line', {x1: pad, x2: w - pad, y1: fy, y2: fy, stroke: th.paperLine, 'stroke-width': 2}));
  parts.push(h('rect', {x: pad, y: fy + footerH * 0.36, width: inner * 0.3, height: footerH * 0.2, rx: 3, fill: th.paperLine}));
  parts.push(h('rect', {x: w - pad - inner * 0.12, y: fy + footerH * 0.36, width: inner * 0.12, height: footerH * 0.2, rx: 3, fill: th.paperLine}));

  // --- copy-type stamp impression (hidden until stamped)
  const stampSpot = {x: stampBox.x + stampBox.w / 2, y: stampBox.y + stampBox.h / 2};
  let impr = null;
  if (o.stampLabel !== null && o.stampLabel !== undefined) {
    impr = copyStampMark(ctx, {name: `${P}-impr`, text: o.stampLabel, w: stampW * 0.98, rotate: -6, color: o.stampColor || th.accent, showText});
    parts.push(g({transform: T(stampSpot.x, stampSpot.y)}, impr.node));
  }

  /** Band of field i with a width in design units (clamped); hides the value once covered. */
  const bandFrame = (i, wpx) => {
    const f = fields[i];
    if (!f) return {};
    const wv = clamp(wpx, 0, f.band.w);
    const out = {[`${P}-band-${i}`]: {width: r(wv)}};
    if (f.hasValue) out[`${P}-val-${i}`] = {opacity: wv >= f.coverAt ? 0 : 1};
    return out;
  };
  /** Band width that covers the first fraction `f` of field i's value (0 = none, 1 = whole box). */
  const partialWidth = (i, f) => {
    const fl = fields[i];
    if (!fl) return 0;
    if (f >= 1) return fl.band.w;
    return f <= 0 ? 0 : Math.min(fl.band.w, fl.valueX0 + fl.valueW * f);
  };
  /** Outline of field i drawn to fraction p. */
  const markFrame = (i, p) => {
    const f = fields[i];
    if (!f) return {};
    return {[`${P}-mark-${i}`]: {'stroke-dashoffset': r(f.outline.total * (1 - clamp(p))), opacity: p > 0 ? 1 : 0}};
  };
  /** Nib path (doc-local) for processing field i in a mode. */
  const strokePath = (i, mode) => {
    const f = fields[i];
    if (mode === 'outline') return f.outline;
    const cy = f.band.y + f.band.h / 2;
    return polyline([{x: f.band.x, y: cy}, {x: f.band.x + f.band.w, y: cy}]);
  };

  /** Lines printed on the copy-type impression (null when none / labels hidden), for word-split checks. */
  const stampLines = impr && impr.fit ? impr.fit.lines : null;
  return {node: g({name: P}, parts), w, h: hh, fields, stampBox, stampSpot, stampLines, bandFrame, markFrame, strokePath, partialWidth, headerBottom, pad, inner, labelSize, boxH};
}

/** Em-box metrics (fractions of the font size) assumed for stamp text. */
const STAMP_EM = {ascent: 0.95, descent: 0.48};

/**
 * Fit a stamp label (bold, letter-spaced) into `inner` × `maxH` WITHOUT ever
 * splitting a word: lines break only between words and the size shrinks until
 * the widest word, including its letter spacing, fits the width. One line is
 * preferred while it stays at least `oneMin`; otherwise up to three lines.
 * Returns a FitResult-compatible object plus the letter spacing used.
 * @param {any} ctx
 * @param {string} text
 * @param {{inner:number, maxH:number, oneMax:number, oneMin:number, multiMax:number, spacing?:number}} o
 */
export function fitStampText(ctx, text, o) {
  const full = String(text ?? '').trim();
  const words = full.split(/\s+/).filter(Boolean);
  const LEAD = 1.18;
  // em box of the bold sans stack relative to the size: ~0.95 ascent + ~0.48 descent
  const EM_H = STAMP_EM.ascent + STAMP_EM.descent;
  const spacingAt = size => Math.min(o.spacing ?? 1.5, size * 0.1);
  const width = (s, size, sp) => ctx.measure(s, size, 800, 'sans') + sp * s.length;
  const tryAt = (size, maxLines) => {
    const sp = spacingAt(size);
    const lines = [];
    let cur = '';
    for (const word of words) {
      if (width(word, size, sp) > o.inner) return null; // never split a word
      const cand = cur ? `${cur} ${word}` : word;
      if (!cur || width(cand, size, sp) <= o.inner) cur = cand;
      else { lines.push(cur); cur = word; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) return null;
    // the whole em box (ascent + descent of every line) must fit, so letters
    // with descenders stay inside the border too
    const height = size * LEAD * (lines.length - 1) + size * EM_H;
    if (height > o.maxH) return null;
    return {lines, size, lineHeight: size * LEAD, width: Math.max(...lines.map(l => width(l, size, sp))), height, truncated: false, full, weight: 800, family: 'sans', letterSpacing: sp};
  };
  if (!words.length) return {lines: [''], size: o.oneMax, lineHeight: o.oneMax * LEAD, width: 0, height: o.oneMax * EM_H, truncated: false, full, weight: 800, family: 'sans', letterSpacing: spacingAt(o.oneMax)};
  for (let s = o.oneMax; s >= o.oneMin; s -= 0.25) { const f = tryAt(s, 1); if (f) return f; }
  for (let s = o.multiMax; s >= 3; s -= 0.25) { const f = tryAt(s, 3); if (f) return f; }
  // pathological input (one enormous word): one line per word at the smallest size
  const size = 3, sp = 0;
  return {lines: words.slice(0, 3), size, lineHeight: size * LEAD, width: Math.max(...words.slice(0, 3).map(l => width(l, size, sp))), height: size * LEAD * (Math.min(3, words.length) - 1) + size * EM_H, truncated: words.length > 3, full, weight: 800, family: 'sans', letterSpacing: sp};
}

/**
 * Copy-type stamp impression (double border + fitted text). Local origin =
 * centre. The text fit (see `fitStampText`) accounts for the letter spacing
 * and never breaks inside a word, so a narrow stamp shrinks the text instead
 * of printing "DISCLOSUR / E".
 * @returns {{node:any, fit:any}}
 */
export function copyStampMark(ctx, {name, text, w = 190, color, rotate = -6, showText = true}) {
  const c = color || ctx.theme.accent;
  const hh = w * 0.4;
  const innerH = hh - 14;
  const f = fitStampText(ctx, text, {inner: w * 0.8, maxH: innerH - 4, oneMax: w * 0.13, oneMin: w * 0.085, multiMax: w * 0.115});
  // Capitals centred in the border (first baseline at top + 0.8·size), then
  // nudged, if needed, so the whole em box stays inside the inner border.
  const block = f.lineHeight * (f.lines.length - 1) + f.size;
  const lo = -innerH / 2 + 2 - (0.8 - STAMP_EM.ascent) * f.size;
  const hi = innerH / 2 - 2 - (0.8 + STAMP_EM.descent) * f.size - f.lineHeight * (f.lines.length - 1);
  const top = clamp(-block / 2, lo, Math.max(lo, hi));
  const node = g({name, opacity: 0, transform: T(0, 0, rotate)},
    h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 8, fill: 'none', stroke: c, 'stroke-width': 4}),
    h('rect', {x: -w / 2 + 7, y: -hh / 2 + 7, width: w - 14, height: hh - 14, rx: 5, fill: 'none', stroke: c, 'stroke-width': 1.8}),
    showText
      // letter spacing trails each glyph; shift by half a gap to stay centred
      ? textBlock(f, {x: r(f.letterSpacing / 2, 2), y: r(top, 2), anchor: 'middle', fill: c, letterSpacing: r(f.letterSpacing, 2)})
      : h('path', {d: `M${r(-w * 0.3)} 0H${r(w * 0.3)}M${r(-w * 0.2)} ${r(hh * 0.2)}H${r(w * 0.2)}`, stroke: c, 'stroke-width': hh * 0.12, 'stroke-linecap': 'round'}),
  );
  return {node, fit: showText ? f : null, w, h: hh};
}

/**
 * Broad chisel-tip marker seen from above. Local origin = nib centre; the
 * body extends along +x. `grip` is the palm point along +x.
 */
export function redactionMarker(ctx, {name, length = 230, body = '#30353c'}) {
  const th = ctx.theme;
  const L = length;
  const bw = L * 0.145;
  return {
    grip: L * 0.36,
    length: L,
    node: g({name},
      h('path', {name: `${name}-shadow`, d: `M${r(L * 0.12)} ${r(bw * 0.3)}L${r(L * 0.98)} ${r(bw * 0.3)}`, stroke: th.shadow, 'stroke-width': r(bw), 'stroke-linecap': 'round'}),
      h('path', {d: `M0 ${r(-bw * 0.34)}L${r(L * 0.065)} ${r(-bw * 0.4)}V${r(bw * 0.4)}L0 ${r(bw * 0.34)}Z`, fill: BAND_INK, stroke: th.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(L * 0.065)} ${r(-bw * 0.4)}L${r(L * 0.15)} ${r(-bw / 2)}V${r(bw / 2)}L${r(L * 0.065)} ${r(bw * 0.4)}Z`, fill: '#c9ced4', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('rect', {x: r(L * 0.15), y: r(-bw / 2), width: r(L * 0.77), height: r(bw), rx: r(bw * 0.3), fill: body, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: r(L * 0.5), y: r(-bw / 2), width: r(L * 0.26), height: r(bw), fill: '#f4f1ea', stroke: th.ink, 'stroke-width': 1.5}),
      h('rect', {x: r(L * 0.535), y: r(-bw * 0.17), width: r(L * 0.19), height: r(bw * 0.34), rx: 2, fill: BAND_INK}),
      h('rect', {x: r(L * 0.88), y: r(-bw / 2 - 3), width: r(L * 0.12), height: r(bw + 6), rx: 6, fill: BAND_INK, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: r(L * 0.19), y: r(-bw / 2 + 4), width: r(L * 0.26), height: r(bw * 0.18), rx: 2, fill: '#ffffff', opacity: 0.28}),
    ),
  };
}

/**
 * Open manila folder seen from above, tab with label at the top-left.
 * Local origin = top-left of the back cover.
 */
export function openFolder(ctx, {w, h: hh, label, showText = true}) {
  const th = ctx.theme;
  const tabW = w * 0.44;
  const tabH = Math.max(34, hh * 0.05);
  const parts = [
    h('path', {d: roundRectPath(8, -tabH + 12, w, hh + tabH, 12), fill: th.shadow}),
    h('path', {d: `M0 ${r(-tabH + 10)}Q0 ${r(-tabH)} 10 ${r(-tabH)}H${r(tabW - 16)}Q${r(tabW - 6)} ${r(-tabH)} ${r(tabW)} ${r(-tabH + 12)}L${r(tabW + 14)} 0H${r(w - 12)}Q${w} 0 ${w} 12V${r(hh - 12)}Q${w} ${hh} ${r(w - 12)} ${hh}H12Q0 ${hh} 0 ${r(hh - 12)}Z`, fill: FOLDER, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M14 ${r(hh - 10)}H${r(w - 14)}`, stroke: shade(FOLDER, -0.2), 'stroke-width': 3}),
    h('path', {d: `M${r(w - 10)} 16V${r(hh - 16)}`, stroke: shade(FOLDER, -0.14), 'stroke-width': 3}),
    // inner pocket at the bottom-left corner
    h('path', {d: `M0 ${r(hh * 0.62)}L${r(w * 0.34)} ${hh}H12Q0 ${hh} 0 ${r(hh - 12)}Z`, fill: shade(FOLDER, -0.08), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
  if (label && showText) {
    const f = ctx.fit(label, {maxWidth: tabW - 30, size: Math.min(26, tabH * 0.62), minSize: 13, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: 16, y: -tabH + (tabH - f.size) / 2 + 2, fill: th.ink}));
  } else {
    parts.push(h('rect', {x: 16, y: -tabH * 0.6, width: tabW * 0.5, height: tabH * 0.26, rx: 3, fill: th.ink, opacity: 0.35}));
  }
  return {node: g(null, parts), tabH, tabW};
}

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {horizontal: {w: 1600, h: 900}, square: {w: 1200, h: 1100}, vertical: {w: 900, h: 1400}};

/**
 * Geometry per axis (fractions of the stage unless > 1.5 or negative
 * absolutes are noted). Shoulders are outside the desk window.
 */
const GEO = {
  horizontal: {dh: 770, doc: [0.525, 0.515], folderOff: [-40, 10], markerRest: [0.775, 0.66], penAngle: 36,
    shoulderA: [0.76, 1.3], sideA: 'bottom', restHandA: [0.94, 0.9], bendA: -1, armA: {upper: 380, lower: 360},
    shoulderB: [0.92, -0.34], sideB: 'top', stampRest: [0.9, 0.2], restHandB: [0.95, 0.07], bendB: 1, armB: {upper: 360, lower: 340},
    chipA: {x: 0.02, y: 'bottom', anchor: 'start'}, chipB: {x: 0.8, y: 'top', anchor: 'end'}},
  square: {dh: 660, doc: [0.41, 0.535], folderOff: [-34, 10], markerRest: [0.765, 0.64], penAngle: 36,
    shoulderA: [0.66, 1.3], sideA: 'bottom', restHandA: [0.95, 0.93], bendA: -1, armA: {upper: 400, lower: 380},
    shoulderB: [0.9, -0.3], sideB: 'top', stampRest: [0.87, 0.16], restHandB: [0.95, 0.05], bendB: 1, armB: {upper: 360, lower: 340},
    chipA: {x: 0.02, y: 'bottom', anchor: 'start'}, chipB: {x: 0.66, y: 'top', anchor: 'end'}},
  vertical: {dh: 700, doc: [0.345, 0.545], folderOff: [4, 10], folderW: 1.14, markerRest: [0.5, 0.86], penAngle: 36,
    shoulderA: [0.62, 1.25], sideA: 'bottom', restHandA: [0.87, 0.93], bendA: -1, armA: {upper: 420, lower: 400},
    shoulderB: [0.84, -0.3], sideB: 'top', stampRest: [0.84, 0.12], restHandB: [0.95, 0.05], bendB: 1, armB: {upper: 400, lower: 380},
    chipA: {x: 0.03, y: 'bottom', anchor: 'start'}, chipB: {x: 0.03, y: 'top', anchor: 'start'}},
};

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix  unique node-name prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {{docId:string, title:string, labels:string[], values:string[]}} o.doc
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.actors  [A (marker), B (stamp)]
 * @param {string|null} o.stampLabel   impression text (null = no stamp in this scene)
 * @param {string} [o.folderLabel]
 * @param {boolean} [o.chips=true]
 * @param {boolean} [o.chipBLeft=false]  place B's name chip at the top-left corner
 * @param {Array<{field:number, mode:'cover'|'outline'}>} [o.strokes]  fields processed by the marker, in order
 */
export function redactionDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STAGE[axis];
  const showText = ctx.show('all');
  const F = (fx, fy) => ({x: W * fx, y: H * fy});

  const dh = G.dh;
  const dw = Math.round(dh * 0.76);
  const docC = F(...G.doc);
  const docTL = {x: docC.x - dw / 2, y: docC.y - dh / 2};
  const sheet = recordSheet(ctx, {prefix: `${P}-doc`, w: dw, h: dh, docId: o.doc.docId, title: o.doc.title, labels: o.doc.labels, values: o.doc.values, showText, stampLabel: o.stampLabel, lineSeed: 'redaction-doc'});
  const toWorld = q => ({x: docTL.x + q.x, y: docTL.y + q.y});

  // Folder under the sheet (support).
  const fw = dw * (G.folderW ?? 1.22), fh = dh * 1.06;
  const folderTL = {x: docC.x - fw / 2 + G.folderOff[0], y: docC.y - fh / 2 + G.folderOff[1]};
  const folder = openFolder(ctx, {w: fw, h: fh, label: o.folderLabel, showText: ctx.show('key')});

  // Actors.
  const lookA = actorLook(ctx, o.actors[0], 0);
  const lookB = actorLook(ctx, o.actors[1], 1);
  const armA = topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', width: 50, handScale: 1.3, ...G.armA});
  const armB = topArm(ctx, {name: `${P}-armB`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'left', width: 50, handScale: 1.3, ...G.armB});
  const baseA = F(...G.shoulderA);
  const baseB = F(...G.shoulderB);

  // Marker (lies on the desk at rest; the same angle is kept while held).
  const marker = redactionMarker(ctx, {name: `${P}-marker`, length: axis === 'horizontal' ? 230 : 240});
  const penDir = {x: Math.cos(rad(G.penAngle)), y: Math.sin(rad(G.penAngle))};
  const restTip = F(...G.markerRest);
  const gripOf = tip => ({x: tip.x + penDir.x * marker.grip, y: tip.y + penDir.y * marker.grip});
  const restGrip = gripOf(restTip);
  const restHandA = F(...G.restHandA);

  // Stamp (lies on the desk, then carried by B's solved hand).
  const stampRest = F(...G.stampRest);
  const stampNode = stampTool(ctx, {name: `${P}-stamp`, size: axis === 'horizontal' ? 96 : 100, color: th.accent});
  const withStamp = o.stampLabel !== null && o.stampLabel !== undefined;

  // Desk
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30});

  // Actor chips near where each actor sits, bounded to free desk space so
  // long names never run over the folder tab, the sheet or the marker.
  const chipSize = axis === 'horizontal' ? 30 : 32;
  const chipMax = {
    horizontal: {a: docTL.x - 16 - W * 0.02, b: W * 0.8 - (folderTL.x + folder.tabW + 24)},
    square: {a: W * 0.6, b: W * 0.62},
    // the marker body only reaches the chip row right of ~0.66W
    vertical: {a: W * 0.62, b: W * 0.62},
  }[axis];
  const mkChip = (spec, person, name, maxW, maxLines = 1) => {
    if (o.chips === false || !ctx.show('key')) return null;
    const text = person.role ? `${person.name} · ${person.role}` : person.name;
    const y = spec.y === 'bottom' ? H - 26 - chipSize * 1.8 : 24;
    return chip(ctx, text, {x: W * spec.x, y, anchor: spec.anchor, maxWidth: maxW, size: chipSize, maxLines, name});
  };
  const chipA = mkChip(G.chipA, o.actors[0], `${P}-chipA`, chipMax.a);
  // `chipBLeft` moves B's chip to the top-left corner (left of the folder tab),
  // e.g. when a scene draws a guide down the right side of the desk.
  const chipB = o.chipBLeft
    ? mkChip({x: 0.02, y: 'top', anchor: 'start'}, o.actors[1], `${P}-chipB`, Math.max(160, folderTL.x - 24 - W * 0.02), 2)
    : mkChip(G.chipB, o.actors[1], `${P}-chipB`, chipMax.b);

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      g({transform: T(folderTL.x, folderTL.y)}, folder.node),
      g({transform: T(docTL.x, docTL.y)}, sheet.node),
      marker.node,
      armA.arm, armA.palm, armA.thumb,
      withStamp ? [stampNode, armB.arm, armB.palm, armB.thumb] : null,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  // Strokes: fields processed by the marker, in order.
  const strokes = (o.strokes || []).filter(s => sheet.fields[s.field]);
  const paths = strokes.map(s => {
    const local = sheet.strokePath(s.field, s.mode);
    return {...s, poly: polyline(local.pts.map(toWorld))};
  });

  /** Lean a shoulder toward a target only as far as needed (it stays outside the desk). */
  const leanShoulder = (base, side, target, arm) => {
    const R = arm.reach * 0.94;
    const d = dist(base, target);
    let s = base;
    if (d > R) s = mix(base, target, (d - R) / d);
    const m = 36;
    if (side === 'bottom') s = {x: s.x, y: Math.max(s.y, H + m)};
    if (side === 'top') s = {x: s.x, y: Math.min(s.y, -m)};
    if (side === 'right') s = {x: Math.max(s.x, W + m), y: s.y};
    return s;
  };

  const LIFT = {x: -5, y: -12};
  /**
   * Nib position + lift amount while the marker is held, from work progress.
   * Per stroke: travel 0–0.4 (lifted), press 0.4–0.48, trace 0.48–0.92, raise 0.92–1.
   */
  function workTip(work) {
    const n = paths.length;
    if (!n) return {tip: restTip, lift: 0, active: -1, trace: 0, done: []};
    const x = clamp(work) * n;
    const k = Math.min(n - 1, Math.floor(x));
    const lp = x - k;
    const cur = paths[k];
    const start = cur.poly.at(0);
    const prevEnd = k === 0 ? restTip : paths[k - 1].poly.at(1);
    const travel = seg(lp, 0, 0.4);
    const press = seg(lp, 0.4, 0.48);
    const trace = ease.inOutSine(seg(lp, 0.48, 0.92));
    const raise = seg(lp, 0.92, 1);
    let tip, lift;
    if (lp < 0.4) {
      tip = mix(prevEnd, start, ease.inOutSine(travel));
      lift = k === 0 ? ease.outQuad(clamp(travel / 0.3)) : 1;
    } else if (lp < 0.48) {
      tip = start;
      lift = 1 - ease.inOutQuad(press);
    } else if (lp < 0.92) {
      tip = cur.poly.at(trace);
      lift = 0;
    } else {
      tip = cur.poly.at(1);
      lift = ease.outQuad(raise);
    }
    const tracing = lp >= 0.48 && lp < 0.92;
    const done = paths.map((_, j) => (j < k ? 1 : j > k ? 0 : lp >= 0.92 ? 1 : lp >= 0.48 ? trace : 0));
    return {tip, lift, active: tracing ? k : -1, trace, done, k};
  }

  /**
   * Pose the stage from action values in [0,1].
   * @param {{pick?:number, work?:number, stow?:number, withdraw?:number, stamp?:number, bands?:Record<number,number>, marks?:Record<number,number>}} s
   *   `bands` / `marks` override the band width fraction / outline progress of given fields.
   */
  function pose(s) {
    const nodes = {};
    const pick = s.pick ?? 0, work = s.work ?? 0, stow = s.stow ?? 0, withdraw = s.withdraw ?? 0;
    const reduced = ctx.reduced;

    // --- marker + arm A
    let tip = restTip;
    let lift = 0;
    let held = false;
    let handTarget;
    let wt = {active: -1, done: paths.map(() => 0)};
    if (pick <= 0) handTarget = restHandA;
    else if (pick < 1) handTarget = mix(restHandA, restGrip, ease.inOutCubic(pick));
    else if (stow < 1) {
      held = true;
      wt = workTip(work);
      if (stow > 0) {
        const last = paths.length ? paths[paths.length - 1].poly.at(1) : restTip;
        const from = work >= 1 ? last : wt.tip;
        tip = mix(from, restTip, ease.inOutCubic(stow));
        lift = paths.length ? 1 - ease.inQuad(seg(stow, 0.7, 1)) : Math.sin(Math.PI * stow) * 0.6;
        wt = {...wt, active: -1};
      } else {
        tip = wt.tip;
        lift = wt.lift;
      }
      const lifted = {x: tip.x + LIFT.x * lift, y: tip.y + LIFT.y * lift};
      handTarget = gripOf(lifted);
    } else handTarget = mix(restGrip, restHandA, ease.inOutCubic(withdraw));
    if (stow >= 1) wt = {active: -1, done: paths.map(() => 1)};
    if (pick >= 1 && work >= 1 && stow <= 0) wt = {...wt, done: paths.map(() => 1)};

    const shA = leanShoulder(baseA, G.sideA, handTarget, armA);
    const solvedA = armA.pose(shA, handTarget, G.bendA);
    Object.assign(nodes, solvedA.nodes);
    let markerTip = restTip;
    if (held) {
      // positioned from the SOLVED hand
      const back = {x: solvedA.hand.x - penDir.x * marker.grip, y: solvedA.hand.y - penDir.y * marker.grip};
      markerTip = back;
    }
    const liftVis = held ? lift : 0;
    nodes[`${P}-marker`] = {transform: T(markerTip.x, markerTip.y, G.penAngle, 1 + (reduced ? 0 : 0.05 * liftVis))};
    nodes[`${P}-marker-shadow`] = {transform: `translate(${r(10 * liftVis)} ${r(14 * liftVis)})`, opacity: r(0.6 + 0.4 * liftVis, 3)};

    // --- bands / outlines from the work progress (+ overrides)
    const bandFr = {};
    const markFr = {};
    paths.forEach((p, j) => {
      const v = wt.done[j] ?? 0;
      if (p.mode === 'outline') markFr[p.field] = v;
      else bandFr[p.field] = v;
    });
    if (s.bands) for (const [k, v] of Object.entries(s.bands)) bandFr[k] = v;
    if (s.marks) for (const [k, v] of Object.entries(s.marks)) markFr[k] = v;
    let bandEdge = null;
    sheet.fields.forEach(f => {
      const fr = bandFr[f.i] ?? 0;
      let wpx = s.bandsPx && s.bandsPx[f.i] !== undefined ? s.bandsPx[f.i] : f.band.w * fr;
      // while pressing, the band edge IS the nib
      if (held && wt.active >= 0 && paths[wt.active].field === f.i && paths[wt.active].mode !== 'outline') {
        wpx = markerTip.x - (docTL.x + f.band.x);
        bandEdge = {x: docTL.x + f.band.x + clamp(wpx, 0, f.band.w), y: docTL.y + f.band.y + f.band.h / 2};
      }
      Object.assign(nodes, sheet.bandFrame(f.i, wpx));
      Object.assign(nodes, sheet.markFrame(f.i, markFr[f.i] ?? 0));
    });
    let traceTip = null;
    if (held && wt.active >= 0 && paths[wt.active].mode === 'outline') traceTip = paths[wt.active].poly.at(wt.trace);

    // --- stamp: carried from the desk to the copy-type box, pressed, returned
    let press = 0;
    let stampPos = stampRest;
    let solvedB = null;
    const spot = toWorld(sheet.stampSpot);
    const st = s.stamp ?? 0;
    if (withStamp) {
      const reachT = seg(st, 0, 0.12);
      const go = seg(st, 0.12, 0.42), down = seg(st, 0.42, 0.52), up = seg(st, 0.52, 0.62), back = seg(st, 0.62, 0.86), leave = seg(st, 0.86, 1);
      const restHandB = F(...G.restHandB);
      let target;
      let carrying = false;
      if (st <= 0) target = restHandB;
      else if (reachT < 1) target = mix(restHandB, stampRest, ease.inOutCubic(reachT));
      else if (back > 0 && leave <= 0) { target = mix(spot, stampRest, ease.inOutCubic(back)); carrying = true; }
      else if (leave > 0) target = mix(stampRest, restHandB, ease.inOutCubic(leave));
      else { target = mix(stampRest, spot, ease.inOutCubic(go)); carrying = true; }
      if (back >= 1) carrying = false;
      press = down > 0 && up < 1 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
      const shB = leanShoulder(baseB, G.sideB, target, armB);
      solvedB = armB.pose(shB, target, G.bendB);
      Object.assign(nodes, solvedB.nodes);
      stampPos = carrying ? solvedB.hand : stampRest;
      const lifted = carrying && !reduced ? 1 - press : 0;
      nodes[`${P}-stamp`] = {transform: T(stampPos.x, stampPos.y, 0, (1 + 0.07 * lifted) * (1 - 0.08 * press))};
      nodes[`${P}-stamp-shadow`] = {opacity: r(1 - press * 0.85, 3)};
      nodes[`${P}-doc-impr`] = {opacity: st >= 0.52 ? 0.92 : 0};
    }

    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    const bands = sheet.fields.map(f => r(clamp(s.bandsPx && s.bandsPx[f.i] !== undefined ? s.bandsPx[f.i] / f.band.w : (bandFr[f.i] ?? 0)), 3));
    return {
      nodes,
      semantic: {
        markerTip: P2(markerTip),
        markerHeld: held,
        markerHolder: held ? 'A' : 'desk',
        markerAtRest: !held && dist(markerTip, restTip) < 0.5,
        markerTouching: held && wt.active >= 0,
        heldGrip: held ? P2(gripOf({x: markerTip.x, y: markerTip.y})) : null,
        handA: P2(solvedA.hand),
        nib: held && wt.active >= 0 ? P2(markerTip) : null,
        bandEdge: P2(bandEdge),
        traceTip: P2(traceTip),
        activeField: held && wt.active >= 0 ? paths[wt.active].field : -1,
        bands,
        marks: sheet.fields.map(f => r(clamp(markFr[f.i] ?? 0), 3)),
        valuesRemoved: sheet.fields.filter(f => f.hasValue && f.band.w * (bands[f.i] ?? 0) >= f.coverAt).map(f => f.i),
        labelsKept: sheet.fields.length,
        stampTool: P2(stampPos),
        stampContact: press > 0.5 ? P2(spot) : null,
        stampAt: press > 0.5 ? P2(stampPos) : null,
        handB: solvedB ? P2(solvedB.hand) : null,
        stampApplied: withStamp && st >= 0.52,
        reach: {A: solvedA.reached, B: solvedB ? solvedB.reached : true},
        allReached: solvedA.reached && (!solvedB || solvedB.reached),
      },
    };
  }

  // Stage-space bounds of what rests on the desk when nothing is held
  // (resting marker, stamp, waiting hands, actor chips), so scenes can keep
  // their own annotations clear of these props.
  const markerCorners = [0, 1].flatMap(t => [-1, 1].map(sd => {
    const along = t * marker.length;
    const half = marker.length * 0.145 / 2 + 4;
    return {x: restTip.x + penDir.x * along - penDir.y * half * sd, y: restTip.y + penDir.y * along + penDir.x * half * sd};
  }));
  const aabb = pts => {
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  };
  const around = (q, rx, ry = rx) => ({x: q.x - rx, y: q.y - ry, w: rx * 2, h: ry * 2});
  const restBoxes = {
    marker: aabb(markerCorners),
    markerSegment: {a: restTip, b: {x: restTip.x + penDir.x * marker.length, y: restTip.y + penDir.y * marker.length}, halfWidth: marker.length * 0.145 / 2},
    stamp: around(stampRest, 62),
    handA: around(restHandA, 58),
    handB: withStamp ? around(F(...G.restHandB), 58) : null,
    chipA: chipA ? chipA.box : null,
    chipB: chipB ? chipB.box : null,
  };

  return {
    node, pose, W, H, axis, sheet, dw, dh, docC, docTL, toWorld, folderTL, fw, fh, folder,
    restTip, stampRest, strokes: paths, restBoxes,
    /** world box of field i's value box / label */
    fieldBox: i => { const f = sheet.fields[i]; const p = toWorld(f.box); return {x: p.x, y: p.y, w: f.box.w, h: f.box.h}; },
    labelBox: i => { const f = sheet.fields[i]; const p = toWorld(f.labelBox); return {x: p.x, y: p.y, w: f.labelBox.w, h: f.labelBox.h}; },
    stampSpot: toWorld(sheet.stampSpot),
  };
}

/**
 * Editorial note with a leader (kit variant of `callout`): the chip may use
 * more lines in narrow columns, and the leader ends in a SOLID dot (no light
 * ring), so it reads cleanly whether it lands on paper or next to a band.
 * @param {any} ctx
 * @param {{name:string, text:string, chipAt:{x:number,y:number}, anchor?:'start'|'middle'|'end', target:{x:number,y:number}, maxWidth:number, size?:number, maxLines?:number, minSize?:number, color?:string}} o
 */
export function noteCallout(ctx, o) {
  const color = o.color ?? ctx.theme.ink;
  const c = chip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: o.anchor ?? 'middle', maxWidth: o.maxWidth, size: o.size ?? 26, minSize: o.minSize, maxLines: o.maxLines ?? 2, fill: ctx.theme.card, stroke: color, color: ctx.theme.ink, name: `${o.name}-chip`});
  const b = c.box;
  const from = {
    x: Math.max(b.x, Math.min(o.target.x, b.x + b.w)),
    y: o.target.y > b.y + b.h ? b.y + b.h : o.target.y < b.y ? b.y : b.y + b.h / 2,
  };
  if (from.y === b.y + b.h / 2) from.x = o.target.x > b.cx ? b.x + b.w : b.x;
  const len = Math.hypot(o.target.x - from.x, o.target.y - from.y);
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(o.target.x), y2: r(o.target.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(o.target.x), cy: r(o.target.y), r: 6.5, fill: color, opacity: 0}),
    c.node,
  );
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: Math.min(1, Math.max(0, (p - 0.45) / 0.55))},
  });
  return {node, frame, box: b, fit: c.fit};
}

const boxHit = (b, q, pad) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
const boxesOverlap = (a, b, pad) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/**
 * Connector-aware captions for a mechanism graph whose own labels are turned
 * off (the scene passes relationGraph a context that hides its labels).
 *
 * A caption sits ON its own connector when that leaves the connector's ends
 * (anchors, arrowhead) and every other connector visible. Otherwise it moves
 * to the nearest free spot around points along its own connector (best-first
 * 2-D search, narrower wrapping allowed at a cost) and gets a dotted leader
 * back to that point. Captions and leaders never cover element boxes,
 * element labels, other captions or leaders, other connectors, or the end
 * segments of their own connector, so every connector visibly starts and
 * ends at its element.
 * @param {any} ctx
 * @param {{name:string, conns:Array<{rel:any, c:any}>, texts:string[], colors:string[], obstacles:Array<{x:number,y:number,w:number,h:number}>, bounds:{x:number,y:number,w:number,h:number}, size?:number, maxWidth?:number}} o
 */
export function relationCaptions(ctx, o) {
  const n = o.conns.length;
  if (!ctx.show('all') || !n) return {node: null, frame: () => ({}), boxes: [], clear: true, fallbacks: 0};
  const size = o.size ?? 28;
  const maxW = o.maxWidth ?? 300;
  const B = o.bounds;
  const samples = o.conns.map(x => {
    const N = Math.max(10, Math.ceil(x.c.total / 9));
    return Array.from({length: N + 1}, (_, k) => ({...x.c.at(k / N), t: k / N}));
  });
  const variants = [
    {maxWidth: maxW, maxLines: 2, cost: 0},
    {maxWidth: Math.round(maxW * 0.74), maxLines: 2, cost: 24},
    {maxWidth: Math.round(maxW * 0.58), maxLines: 3, cost: 48},
  ];
  const probe = (i, v) => chip(ctx, o.texts[i], {x: 0, y: 0, anchor: 'start', maxWidth: v.maxWidth, size, maxLines: v.maxLines, weight: 600});
  const FR = [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73];
  const ANG = Array.from({length: 16}, (_, k) => (k * Math.PI) / 8);
  const placed = [];
  const leaderPts = [];
  const result = new Array(n);
  let fallbacks = 0;
  // most constrained (shortest) connectors choose first
  const order = [...o.conns.keys()].sort((a, b) => o.conns[a].c.total - o.conns[b].c.total);

  for (const i of order) {
    const sizes = variants.map(v => ({v, box: probe(i, v).box}));
    const own = samples[i];
    const others = samples.filter((_, j) => j !== i).flat();
    const evaluate = (cx, cy, P, sz, strict) => {
      const box = {x: cx - sz.box.w / 2, y: cy - sz.box.h / 2, w: sz.box.w, h: sz.box.h};
      if (box.x < B.x || box.y < B.y || box.x + box.w > B.x + B.w || box.y + box.h > B.y + B.h) return null;
      if (o.obstacles.some(q => boxesOverlap(box, q, 10))) return null;
      if (placed.some(q => boxesOverlap(box, q, 12))) return null;
      if (strict >= 1 && others.some(q => boxHit(box, q, 10))) return null;
      if (strict >= 2 && own.some(q => (q.t < 0.2 || q.t > 0.8) && boxHit(box, q, 8))) return null;
      if (leaderPts.some(q => boxHit(box, q, 6))) return null;
      // leader from P to the nearest point of the box (none when touching)
      const qx = Math.max(box.x, Math.min(P.x, box.x + box.w));
      const qy = Math.max(box.y, Math.min(P.y, box.y + box.h));
      const gap = Math.hypot(P.x - qx, P.y - qy);
      let leader = null;
      if (gap > 12) {
        const steps = Math.ceil(gap / 6);
        const pts = Array.from({length: steps + 1}, (_, k) => ({x: P.x + ((qx - P.x) * k) / steps, y: P.y + ((qy - P.y) * k) / steps}));
        const inner = pts.slice(2);
        if (inner.some(q => o.obstacles.some(b => boxHit(b, q, 2)) || placed.some(b => boxHit(b, q, 2)))) return null;
        if (strict >= 1 && inner.some(q => others.some(s => Math.hypot(s.x - q.x, s.y - q.y) < 8))) return null;
        leader = {x1: P.x, y1: P.y, x2: qx, y2: qy, pts};
      }
      return {box, leader};
    };
    let best = null;
    for (const strict of [2, 1, 0]) {
      for (let rad = 0; rad <= 560 && !(best && rad > best.score); rad += 16) {
        for (const sz of sizes) {
          for (const f of FR) {
            const P = o.conns[i].c.at(f);
            const cost = rad + sz.v.cost + Math.abs(f - 0.5) * 90;
            if (best && cost >= best.score) continue;
            for (const a of rad === 0 ? [0] : ANG) {
              const hit = evaluate(P.x + Math.cos(a) * rad, P.y + Math.sin(a) * rad, P, sz, strict);
              if (hit) { best = {...hit, sz, P, score: cost}; break; }
            }
          }
        }
      }
      if (best) break;
      fallbacks++;
    }
    if (!best) {
      const sz = sizes[0];
      const P = o.conns[i].c.mid;
      best = {box: {x: P.x - sz.box.w / 2, y: P.y - sz.box.h / 2, w: sz.box.w, h: sz.box.h}, leader: null, sz, P};
    }
    placed.push(best.box);
    if (best.leader) leaderPts.push(...best.leader.pts);
    result[i] = best;
  }

  const nodes = result.map((res, i) => {
    const color = o.colors[i];
    const c = chip(ctx, o.texts[i], {x: res.box.x, y: res.box.y, anchor: 'start', maxWidth: res.sz.v.maxWidth, size, maxLines: res.sz.v.maxLines, weight: 600, fill: ctx.theme.card, stroke: color});
    const L = res.leader;
    return g({name: `${o.name}-l${i}`, opacity: 0},
      L ? h('line', {x1: r(L.x1), y1: r(L.y1), x2: r(L.x2), y2: r(L.y2), stroke: color, 'stroke-width': 2.2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}) : null,
      L ? h('circle', {cx: r(L.x1), cy: r(L.y1), r: 4.5, fill: color}) : null,
      c.node);
  });
  /** @param {(i:number)=>number} progressOf connector drawing progress */
  const frame = progressOf => Object.fromEntries(result.map((_, i) => [`${o.name}-l${i}`, {opacity: r(clamp((progressOf(i) - 0.55) / 0.45), 3)}]));
  return {node: g({name: o.name}, nodes), frame, boxes: result.map(x => x.box), leaders: result.map(x => x.leader && {x1: x.leader.x1, y1: x.leader.y1, x2: x.leader.x2, y2: x.leader.y2}), clear: fallbacks === 0, fallbacks};
}
