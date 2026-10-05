/**
 * Case-file desk for the "Apertura de expediente" motif (LAW-0009..0012).
 *
 * Top-down desk. A manila case file lies closed: the back cover carries the
 * file-number tab and the coloured separator tabs of the documents inside
 * stick out of its right edge. The clerk's LEFT hand lifts the front cover by
 * its free edge and swings it over the hinge (the cover then falls open by
 * itself); the RIGHT hand draws the index sheet (the top layer) toward the
 * clerk and the documents underneath follow by friction, ending as a cascade
 * in which every layer shows its header strip. The left hand then takes the
 * pen and ticks each index entry; the right hand carries the stamp to the
 * registry box of the index sheet.
 *
 * A document listed in the index can be ABSENT: its layer is not drawn, a
 * dashed ghost marks the slot the index reserves for it (its separator tab is
 * a dashed outline too), and the pen passes over its box without ticking.
 *
 * The kit only owns geometry and a pose solver (action values → node props).
 * Each entry owns its own timeline, layout and semantics.
 *
 * Attachment rules (asserted by tests through semantics):
 *  - while lifting, the solved left hand coincides with the cover's grip point;
 *  - while spreading, the solved right hand coincides with the index grip point;
 *  - the pen tip is derived from the SOLVED left hand while held; laid down it
 *    rests exactly at its rest spot;
 *  - the stamp follows the solved right hand while carried and marks on contact.
 * @module animations/documents/kits/apertura-de-expediente
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, polyline, roundRectPath} from '../../../core/geometry.js';
import {pen, stampTool, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, int, party} from '../../../schemas/fields.js';

/* ---- fields ------------------------------------------------------------ */

/**
 * Category fields (documentId, clauses, signers, redactions) adapted to a case
 * file: the "clauses" are the headings of the documents the file contains, in
 * index order; each one is a layer of the file.
 */
export const caseFileFields = {
  documentId: str('File number printed on the folder tab and on the index sheet (fictional)', 32),
  documentTitle: str('File title printed on the folder label and on the index sheet', 120),
  clauses: list('Documents contained in the file, one heading per layer, in index order', str('Document heading', 90), 2, 5),
  signers: list('Person who opens the file (first) and the party the file concerns (second)', party, 2, 2),
  redactions: list('Zero-based document indices whose heading is covered by a redaction bar', int('Document index', 0, 4), 0, 5),
};

/** Built-in strings used by the four entries (merged into ctx.t). */
export const CASE_STRINGS = {
  en: {index: 'Index', registry: 'Registry', absent: 'Not in the file', opened: 'File opened', laidOut: 'Documents laid out', closed: 'File closed', listed: 'Listed', present: 'In the file', document: 'Document', title: 'Heading', fileNumber: 'File number', presence: 'Document'},
  es: {index: 'Índice', registry: 'Registro', absent: 'No está en el expediente', opened: 'Expediente abierto', laidOut: 'Documentos desplegados', closed: 'Expediente cerrado', listed: 'Listado', present: 'En el expediente', document: 'Documento', title: 'Encabezado', fileNumber: 'Número de expediente', presence: 'Documento'},
};

/** Separator colours per layer (index order). */
export function layerColors(th) {
  return [th.accent2, th.accent3, th.accent4, th.accent, th.cloth[3]];
}

const MANILA = {back: '#d4b16e', front: '#dcbc7d', inside: '#e8d09c', tab: '#cfa862'};
const PEN_INK = '#1d3f8f';

function luminance(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** Readable text colour on a filled badge. */
export const onColor = (ctx, hex) => (luminance(hex) > 0.3 ? ctx.theme.ink : '#ffffff');

/* ---- document sheet (one layer) --------------------------------------- */

const KINDS = ['form', 'letter', 'table', 'photo', 'letter'];

/**
 * Heading of a header strip: one line when it fits at a readable size;
 * otherwise (and when the strip is tall enough) two lines, so a long heading
 * keeps its meaning instead of being cut with an ellipsis.
 */
function fitHeading(ctx, text, maxWidth, size, stripH, weight) {
  const one = ctx.fit(text, {maxWidth, size, minSize: Math.min(size, 13), maxLines: 1, weight});
  if (!one.truncated || stripH < 48) return one;
  return ctx.fit(text, {maxWidth, size: Math.min(size, (stripH - 14) / 2.3), minSize: 11, maxLines: 2, weight});
}
/** Top y of a heading block vertically centred on the strip's badge line. */
const headingTop = (f, cy) => cy - f.height / 2 - f.size * 0.06;

/**
 * A document of the file. Local origin = top-left of the sheet. The header
 * strip (height `stripH`) holds a numbered colour badge and the heading so it
 * stays readable when the sheet is covered by the layers above it.
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, num:number, title:string, redacted?:boolean, color:string, kind?:string, stripH:number, tab?:{y:number,h:number,out:number}|null, showText:boolean, seed?:string, titleName?:string}} o
 */
export function docSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, stripH} = o;
  const pad = w * 0.07;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(5, 8, w, hh, 6), fill: th.shadow}));
  if (o.tab) parts.push(separatorTab(ctx, {w, h: hh, tab: o.tab, color: o.color, num: o.num, showText: o.showText}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('path', {d: `M0 7V6Q0 0 6 0H${w - 6}Q${w} 0 ${w} 6V7Z`, fill: o.color}));
  parts.push(h('rect', {x: 1.2, y: 1.2, width: w - 2.4, height: 6, fill: o.color}));
  const br = Math.min(17, stripH * 0.3);
  const cy = Math.min(stripH * 0.54, 40) + 3;
  parts.push(h('circle', {cx: pad + br, cy, r: br, fill: o.color, stroke: th.ink, 'stroke-width': 2}));
  const tx = pad + br * 2 + 10;
  const tmax = w - tx - pad;
  const size = Math.min(25, Math.max(14, stripH * 0.42));
  if (o.showText) {
    const nf = ctx.fit(String(o.num), {maxWidth: br * 1.6, size: br * 1.15, minSize: 10, maxLines: 1, weight: 800});
    parts.push(textBlock(nf, {x: pad + br, y: cy - nf.size * 0.54, anchor: 'middle', fill: onColor(ctx, o.color)}));
  }
  let titleBox;
  if (o.redacted) {
    parts.push(h('rect', {x: tx, y: cy - size * 0.42, width: r(tmax * 0.78), height: r(size * 0.84), rx: 3, fill: th.ink}));
    titleBox = {x: tx, y: cy - size * 0.42, w: tmax * 0.78, h: size * 0.84};
  } else if (o.showText) {
    const f = fitHeading(ctx, o.title, tmax, size, stripH, 700);
    parts.push(textBlock(f, {x: tx, y: headingTop(f, cy), fill: th.ink, name: o.titleName}));
    titleBox = {x: tx, y: headingTop(f, cy), w: f.width, h: f.height};
    if (o.altTitle != null && o.titleName) {
      // substitute heading (inspect): same place, hidden until swapped in
      const f2 = fitHeading(ctx, o.altTitle, tmax, size, stripH, 700);
      parts.push(textBlock(f2, {x: tx, y: headingTop(f2, cy), fill: th.accent2, name: `${o.titleName}-alt`, opacity: 0}));
    }
  } else {
    parts.push(h('rect', {x: tx, y: cy - size * 0.3, width: r(tmax * 0.62), height: r(size * 0.6), rx: 4, fill: th.ink, opacity: 0.75}));
    titleBox = {x: tx, y: cy - size * 0.3, w: tmax * 0.62, h: size * 0.6};
  }
  const by = Math.max(stripH, cy + br) + 14;
  parts.push(h('line', {x1: pad, x2: w - pad, y1: by - 7, y2: by - 7, stroke: th.paperLine, 'stroke-width': 1.5}));
  parts.push(...sheetBody(ctx, o.kind || 'letter', pad, by + 4, w - pad * 2, hh - by - pad, o.seed || o.name));
  return {node: g({name: o.name}, parts), w, h: hh, titleBox, badge: {x: pad + br, y: cy, r: br}};
}

/**
 * Coloured separator tab sticking out of a sheet's right edge (`tab.side`
 * 'right', default: {y, h, out}) or bottom edge ('bottom': {x, w, out}).
 */
function separatorTab(ctx, {w, h: hh, tab, color, num, showText, dashed}) {
  const th = ctx.theme;
  let d, cx, cy, span;
  if (tab.side === 'bottom') {
    const y0 = hh - 8, y1 = hh + tab.out;
    d = `M${r(tab.x)} ${r(y0)}V${r(y1 - 9)}Q${r(tab.x)} ${r(y1)} ${r(tab.x + 9)} ${r(y1)}H${r(tab.x + tab.w - 9)}Q${r(tab.x + tab.w)} ${r(y1)} ${r(tab.x + tab.w)} ${r(y1 - 9)}V${r(y0)}Z`;
    cx = tab.x + tab.w / 2;
    cy = hh + tab.out / 2 + 3;
    span = {w: tab.w, h: tab.out};
  } else {
    const x0 = w - 8, x1 = w + tab.out;
    d = `M${x0} ${r(tab.y)}H${r(x1 - 9)}Q${r(x1)} ${r(tab.y)} ${r(x1)} ${r(tab.y + 9)}V${r(tab.y + tab.h - 9)}Q${r(x1)} ${r(tab.y + tab.h)} ${r(x1 - 9)} ${r(tab.y + tab.h)}H${x0}Z`;
    cx = w + tab.out / 2 + 3;
    cy = tab.y + tab.h / 2;
    span = {w: tab.out, h: tab.h};
  }
  if (dashed) {
    return g(null, h('path', {d, fill: th.paper, 'fill-opacity': 0.55, stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '7 6', 'stroke-linejoin': 'round'}));
  }
  let mark;
  if (showText) {
    const f = ctx.fit(String(num), {maxWidth: span.w - 16, size: Math.min(24, span.h * 0.48), minSize: 11, maxLines: 1, weight: 800});
    mark = textBlock(f, {x: cx, y: cy - f.size * 0.54, anchor: 'middle', fill: onColor(ctx, color)});
  } else mark = h('circle', {cx, cy, r: Math.min(6, span.h * 0.12), fill: onColor(ctx, color), opacity: 0.85});
  return g(null, h('path', {d, fill: color, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}), mark);
}

/** Body artwork of a document by kind (form, letter, table, photo). */
function sheetBody(ctx, kind, x, y, w, hgt, seed) {
  const th = ctx.theme;
  const R = i => ctx.rng(`${seed}-body`, i);
  const bar = (bx, by, bw, bh = 7) => h('rect', {x: r(bx), y: r(by), width: r(Math.max(8, bw)), height: bh, rx: bh / 2, fill: th.paperLine});
  const out = [];
  if (hgt < 40) return out;
  if (kind === 'form') {
    const rows = Math.max(2, Math.min(5, Math.floor(hgt / 64)));
    const rh = hgt / rows;
    for (let i = 0; i < rows; i++) {
      const ry = y + i * rh;
      out.push(bar(x, ry + 2, w * (0.22 + R(i) * 0.18), 6));
      out.push(h('rect', {x: r(x), y: r(ry + 14), width: r(i % 2 ? w * 0.48 : w), height: r(Math.min(30, rh - 22)), rx: 4, fill: 'none', stroke: th.paperLine, 'stroke-width': 2}));
      if (i % 2) out.push(h('rect', {x: r(x + w * 0.52), y: r(ry + 14), width: r(w * 0.48), height: r(Math.min(30, rh - 22)), rx: 4, fill: 'none', stroke: th.paperLine, 'stroke-width': 2}));
    }
  } else if (kind === 'table') {
    const rows = Math.max(3, Math.min(8, Math.floor(hgt / 34)));
    const rh = Math.min(34, hgt / rows);
    out.push(h('rect', {x: r(x), y: r(y), width: r(w), height: r(rh), fill: th.paperShade}));
    for (let i = 0; i <= rows; i++) out.push(h('line', {x1: r(x), x2: r(x + w), y1: r(y + i * rh), y2: r(y + i * rh), stroke: th.paperLine, 'stroke-width': i === 0 || i === rows ? 2 : 1.4}));
    for (const f of [0, 0.42, 0.72, 1]) out.push(h('line', {x1: r(x + w * f), x2: r(x + w * f), y1: r(y), y2: r(y + rows * rh), stroke: th.paperLine, 'stroke-width': 1.4}));
    for (let i = 1; i < rows; i++) out.push(bar(x + 8, y + i * rh + rh * 0.36, w * (0.2 + R(i) * 0.14), 6));
  } else if (kind === 'photo') {
    const pw = w * 0.36, ph = Math.min(hgt * 0.5, pw * 1.25);
    out.push(h('rect', {x: r(x), y: r(y), width: r(pw), height: r(ph), rx: 6, fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 2}));
    out.push(h('circle', {cx: r(x + pw / 2), cy: r(y + ph * 0.4), r: r(pw * 0.17), fill: '#b9b1a2'}));
    out.push(h('path', {d: `M${r(x + pw * 0.18)} ${r(y + ph)}Q${r(x + pw * 0.2)} ${r(y + ph * 0.64)} ${r(x + pw / 2)} ${r(y + ph * 0.64)}Q${r(x + pw * 0.8)} ${r(y + ph * 0.64)} ${r(x + pw * 0.82)} ${r(y + ph)}Z`, fill: '#b9b1a2'}));
    for (let i = 0; i < 4; i++) out.push(bar(x + pw + 16, y + 6 + i * 26, (w - pw - 16) * (0.6 + R(i) * 0.4), 7));
    const ry = y + ph + 20;
    for (let i = 0; ry + i * 22 < y + hgt - 6 && i < 5; i++) out.push(bar(x, ry + i * 22, w * (0.7 + R(10 + i) * 0.3), 7));
  } else {
    let yy = y;
    let i = 0;
    while (yy < y + hgt - 44 && i < 12) {
      const last = (i + 1) % 4 === 0;
      out.push(bar(x, yy, w * (last ? 0.4 + R(i) * 0.25 : 0.84 + R(i) * 0.16), 7));
      yy += last ? 30 : 20;
      i++;
    }
    const sy = Math.min(yy + 10, y + hgt - 18);
    out.push(h('path', {d: `M${r(x)} ${r(sy)}c12 -18 20 -20 24 -6c4 12 10 10 18 -4c6 -10 12 -6 14 2c3 8 9 6 16 -2`, fill: 'none', stroke: PEN_INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.8}));
  }
  return out;
}

/** Dashed ghost of an absent document (same footprint as a sheet). */
export function ghostSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, stripH} = o;
  const pad = w * 0.07;
  const br = Math.min(17, stripH * 0.3);
  const cy = Math.min(stripH * 0.54, 40) + 3;
  const parts = [
    o.tab ? separatorTab(ctx, {w, h: hh, tab: o.tab, dashed: true}) : null,
    h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: th.paper, 'fill-opacity': 0.82, stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '12 9'}),
    h('circle', {cx: pad + br, cy, r: br, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '5 4'}),
  ];
  const tx = pad + br * 2 + 10;
  const size = Math.min(25, Math.max(14, stripH * 0.42));
  if (o.showText) {
    const nf = ctx.fit(String(o.num), {maxWidth: br * 1.6, size: br * 1.15, minSize: 10, maxLines: 1, weight: 800});
    parts.push(textBlock(nf, {x: pad + br, y: cy - nf.size * 0.54, anchor: 'middle', fill: th.inkSoft}));
    if (!o.redacted) {
      const f = fitHeading(ctx, o.title, w - tx - pad, size, stripH, 600);
      parts.push(textBlock(f, {x: tx, y: headingTop(f, cy), fill: th.inkSoft, italic: true, name: o.titleName}));
    }
  }
  if (!o.showText || o.redacted) parts.push(h('rect', {x: tx, y: cy - size * 0.3, width: r((w - tx - pad) * 0.62), height: r(size * 0.6), rx: 4, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '6 5'}));
  return g({name: o.name}, parts);
}

/* ---- index sheet (the file's cover sheet / inventory) ----------------- */

/**
 * Index sheet listing every document of the file with a checkbox. Local
 * origin = top-left. Tick strokes are named `${prefix}-tick-${i}`.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, number:string, title:string, applicant:string, entries:Array<{title:string, redacted?:boolean, color:string}>, showText:boolean, strings:any, stampLabel?:string, withStamp?:boolean}} o
 */
export function indexSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix} = o;
  const pad = w * 0.08;
  const inner = w - pad * 2;
  const fold = w * 0.1;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(6, 9, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: `M0 4Q0 0 4 0H${r(w - fold)}L${w} ${r(fold)}V${hh - 4}Q${w} ${hh} ${w - 4} ${hh}H4Q0 ${hh} 0 ${hh - 4}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  let y = pad * 0.85;
  const hs = Math.max(13, w * 0.038);
  if (o.showText) {
    const lf = ctx.fit(String(o.strings.index).toUpperCase(), {maxWidth: inner * 0.4, size: hs, minSize: 11, maxLines: 1, weight: 700});
    parts.push(textBlock(lf, {x: pad, y, fill: th.inkSoft, letterSpacing: 2}));
    const nf = ctx.fit(o.number, {maxWidth: inner * 0.56 - fold * 0.5, size: hs * 1.05, minSize: 11, maxLines: 1, weight: 700, family: 'mono'});
    parts.push(textBlock(nf, {x: w - pad - fold * 0.5, y, anchor: 'end', fill: th.ink, name: `${prefix}-number`}));
    if (o.numberAlt != null) {
      const nf2 = ctx.fit(o.numberAlt, {maxWidth: inner * 0.56 - fold * 0.5, size: hs * 1.05, minSize: 11, maxLines: 1, weight: 700, family: 'mono'});
      parts.push(textBlock(nf2, {x: w - pad - fold * 0.5, y, anchor: 'end', fill: th.accent2, name: `${prefix}-number-alt`, opacity: 0}));
    }
  } else {
    parts.push(h('rect', {x: pad, y: y + 2, width: inner * 0.22, height: hs * 0.6, rx: 3, fill: th.paperLine}));
    parts.push(h('rect', {x: w - pad - fold * 0.5 - inner * 0.3, y: y + 2, width: inner * 0.3, height: hs * 0.6, rx: 3, fill: th.inkSoft}));
  }
  y += hs * 1.7;
  const ts = Math.max(16, w * 0.062);
  if (o.showText) {
    const tf = ctx.fit(o.title, {maxWidth: inner, size: ts, minSize: Math.max(13, ts * 0.72), maxLines: 3, weight: 700, family: 'serif'});
    parts.push(textBlock(tf, {x: pad, y, fill: th.ink}));
    y += tf.height + ts * 0.4;
    if (o.applicant) {
      const af = ctx.fit(o.applicant, {maxWidth: inner, size: Math.max(12, w * 0.038), minSize: 11, maxLines: 1, weight: 500});
      parts.push(textBlock(af, {x: pad, y, fill: th.inkSoft}));
      y += af.height + 10;
    }
  } else {
    parts.push(h('rect', {x: pad, y, width: inner * 0.72, height: ts * 0.7, rx: 4, fill: th.ink, opacity: 0.8}));
    y += ts * 1.2;
    parts.push(h('rect', {x: pad, y, width: inner * 0.45, height: 8, rx: 4, fill: th.paperLine}));
    y += 22;
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 2}));
  y += 12;

  // entries
  const n = o.entries.length;
  const regY = hh * 0.79;
  const rowH = Math.min(56, (regY - 16 - y) / n);
  const s = Math.min(28, rowH * 0.62);
  const boxes = [];
  const tickPts = [];
  const ticks = [];
  const rows = [];
  o.entries.forEach((e, i) => {
    const ry = y + i * rowH;
    const bx = pad, by = ry + (rowH - s) / 2;
    boxes.push({x: bx, y: by, s});
    rows.push({x: pad, y: ry, w: inner, h: rowH});
    parts.push(h('rect', {x: r(bx), y: r(by), width: r(s), height: r(s), rx: 4, fill: '#ffffff', stroke: th.ink, 'stroke-width': 2.2}));
    parts.push(h('circle', {cx: r(bx + s + 14), cy: r(by + s / 2), r: r(s * 0.22), fill: e.color, stroke: th.ink, 'stroke-width': 1.5}));
    const tx = bx + s + 28;
    const size = Math.min(22, rowH * 0.46);
    if (e.redacted) {
      if (o.showText) {
        const nf = ctx.fit(`${i + 1}.`, {maxWidth: 40, size, minSize: 11, maxLines: 1, weight: 600});
        parts.push(textBlock(nf, {x: tx, y: by + s / 2 - nf.size * 0.56, fill: th.ink}));
      }
      parts.push(h('rect', {x: r(tx + size * 1.4), y: r(by + s / 2 - size * 0.42), width: r((w - pad - tx - size * 1.4) * 0.8), height: r(size * 0.84), rx: 3, fill: th.ink}));
    } else if (o.showText) {
      const f = ctx.fit(`${i + 1}. ${e.title}`, {maxWidth: w - pad - tx, size, minSize: Math.min(size, 11), maxLines: 1, weight: 600});
      parts.push(textBlock(f, {x: tx, y: by + s / 2 - f.size * 0.56, fill: th.ink, name: `${prefix}-entry-${i}`}));
      if (e.alt != null) {
        const f2 = ctx.fit(`${i + 1}. ${e.alt}`, {maxWidth: w - pad - tx, size, minSize: Math.min(size, 11), maxLines: 1, weight: 600});
        parts.push(textBlock(f2, {x: tx, y: by + s / 2 - f2.size * 0.56, fill: th.accent2, name: `${prefix}-entry-${i}-alt`, opacity: 0}));
      }
    } else {
      parts.push(h('rect', {x: r(tx), y: r(by + s / 2 - 4), width: r((w - pad - tx) * (0.55 + ctx.rng('case-index-ent', i) * 0.35)), height: 8, rx: 4, fill: th.paperLine}));
    }
    const pts = [{x: bx + s * 0.14, y: by + s * 0.5}, {x: bx + s * 0.4, y: by + s * 0.82}, {x: bx + s * 0.98, y: by - s * 0.08}];
    tickPts.push(pts);
    const poly = polyline(pts);
    ticks.push(poly.total);
    parts.push(h('path', {name: `${prefix}-tick-${i}`, d: `M${r(pts[0].x)} ${r(pts[0].y)}L${r(pts[1].x)} ${r(pts[1].y)}L${r(pts[2].x)} ${r(pts[2].y)}`, fill: 'none', stroke: PEN_INK, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(poly.total)} ${r(poly.total + 20)}`, 'stroke-dashoffset': r(poly.total)}));
  });

  // registry box where the opening stamp lands
  const reg = {x: w * 0.44, y: regY + hh * 0.02, w: w * 0.48, h: hh * 0.14};
  if (o.showText) {
    const rf = ctx.fit(o.strings.registry, {maxWidth: reg.w, size: Math.max(11, w * 0.032), minSize: 10, maxLines: 1, weight: 600});
    parts.push(textBlock(rf, {x: reg.x + 4, y: reg.y - rf.size - 5, fill: th.inkSoft}));
  }
  parts.push(h('path', {d: roundRectPath(reg.x, reg.y, reg.w, reg.h, 8), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
  parts.push(h('rect', {x: pad, y: reg.y + reg.h * 0.3, width: w * 0.28, height: 7, rx: 3.5, fill: th.paperLine}));
  parts.push(h('rect', {x: pad, y: reg.y + reg.h * 0.62, width: w * 0.2, height: 7, rx: 3.5, fill: th.paperLine}));
  const stampSpot = {x: reg.x + reg.w / 2, y: reg.y + reg.h / 2};
  if (o.withStamp !== false) {
    const imp = registryImpression(ctx, {name: `${prefix}-impr`, text: o.stampLabel || '', maxW: reg.w - 22, maxH: reg.h + 4, color: th.accent, showText: o.showText});
    parts.push(g({transform: T(stampSpot.x, stampSpot.y)}, imp));
  }

  /** Tick stroke progress per entry. */
  const frameTicks = progress => {
    const out = {};
    ticks.forEach((total, i) => {
      const p = clamp(progress[i] || 0);
      out[`${prefix}-tick-${i}`] = {'stroke-dashoffset': r(total * (1 - p)), opacity: p > 0 ? 1 : 0};
    });
    return out;
  };
  return {node: g({name: prefix}, parts), w, h: hh, boxes, rows, tickPts, stampSpot, reg, frameTicks};
}

/**
 * Opening-stamp impression sized so its ROTATED frame stays inside the
 * registry box (maxW × maxH), whatever the label length: a label that does
 * not fit on one line at a readable size wraps to two lines. Letter spacing
 * is reserved in the fitted width (the text measure does not include it).
 * Local origin = centre; hidden (opacity 0) until the stamp lands.
 */
function registryImpression(ctx, {name, text, maxW, maxH, color, rotate = -6, showText}) {
  const c = color || ctx.theme.accent;
  const sn = Math.abs(Math.sin(rad(rotate))), cs = Math.cos(rad(rotate));
  const AR = 0.38;
  const w = Math.max(60, Math.min(maxW / (cs + AR * sn), maxH / (sn + AR * cs)));
  const hh = w * AR;
  const avail = w - 14 - 18;
  let content;
  if (showText) {
    const label = String(text ?? '');
    const ls = 2;
    let f = ctx.fit(label, {maxWidth: avail - ls * Math.max(0, label.length - 1), size: hh * 0.42, minSize: hh * 0.3, maxLines: 1, weight: 800});
    let spacing = ls;
    if (f.truncated) {
      f = ctx.fit(label, {maxWidth: avail, size: Math.min(hh * 0.34, (hh - 18) / 2.18), minSize: 9, maxLines: 2, weight: 800});
      spacing = 0;
    }
    content = textBlock(f, {x: 0, y: -f.height / 2 - f.size * 0.06, anchor: 'middle', fill: c, letterSpacing: spacing || undefined});
  } else {
    content = h('path', {d: `M${r(-w * 0.3)} 0H${r(w * 0.3)}M${r(-w * 0.2)} ${r(hh * 0.18)}H${r(w * 0.2)}`, stroke: c, 'stroke-width': r(hh * 0.12), 'stroke-linecap': 'round'});
  }
  return g({name, opacity: 0, transform: T(0, 0, rotate)},
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 8, fill: 'none', stroke: c, 'stroke-width': 4}),
    h('rect', {x: r(-w / 2 + 7), y: r(-hh / 2 + 7), width: r(w - 14), height: r(hh - 14), rx: 5, fill: 'none', stroke: c, 'stroke-width': 1.8}),
    content);
}

/* ---- folder ------------------------------------------------------------ */

/**
 * Manila folder seen from above. Local origin = top-left of the back cover;
 * the hinge is the left edge. `outside` / `inside` are the two faces of the
 * front cover drawn so each reads correctly in its own state (the inside face
 * is pre-mirrored because the cover is flipped with a negative x-scale).
 */
export function folderArt(ctx, o) {
  const th = ctx.theme;
  const {fw, fh} = o;
  const tabX = fw * 0.5, tabW = fw * 0.42, tabH = 40;
  const back = g(null,
    h('path', {d: roundRectPath(8, 12, fw, fh, 10), fill: th.shadow}),
    h('path', {d: `M${r(tabX)} 4Q${r(tabX)} ${-tabH} ${r(tabX + 14)} ${-tabH}H${r(tabX + tabW - 14)}Q${r(tabX + tabW)} ${-tabH} ${r(tabX + tabW)} 4Z`, fill: MANILA.tab, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(0, 0, fw, fh, 10), fill: MANILA.back, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(12, 12, fw - 24, fh - 24, 8), fill: '#000', opacity: 0.06}),
    h('line', {x1: 7, x2: 7, y1: 10, y2: fh - 10, stroke: shade(MANILA.back, -0.22), 'stroke-width': 2}),
  );
  let tabText = null;
  if (o.showText && o.number) {
    const f = ctx.fit(o.number, {maxWidth: tabW - 24, size: 22, minSize: 12, maxLines: 1, weight: 700, family: 'mono'});
    tabText = textBlock(f, {x: tabX + tabW / 2, y: -tabH / 2 - f.size * 0.62, anchor: 'middle', fill: th.ink, name: `${o.prefix}-tabtext`});
    if (o.numberAlt != null) {
      const f2 = ctx.fit(o.numberAlt, {maxWidth: tabW - 24, size: 22, minSize: 12, maxLines: 1, weight: 700, family: 'mono'});
      tabText = g(null, tabText, textBlock(f2, {x: tabX + tabW / 2, y: -tabH / 2 - f2.size * 0.62, anchor: 'middle', fill: th.accent2, name: `${o.prefix}-tabtext-alt`, opacity: 0}));
    }
  } else {
    tabText = h('rect', {x: tabX + tabW * 0.2, y: -tabH * 0.62, width: tabW * 0.6, height: 9, rx: 4.5, fill: th.ink, opacity: 0.55});
  }
  // outside face of the front cover
  const lw = fw * 0.72, lh = Math.min(fh * 0.3, 168);
  const lx = (fw - lw) / 2 + 6, ly = fh * 0.2;
  const label = [h('path', {d: roundRectPath(lx, ly, lw, lh, 8), fill: '#fbf7ee', stroke: th.ink, 'stroke-width': 2})];
  if (o.showText) {
    const tf = ctx.fit(o.title, {maxWidth: lw - 32, size: Math.min(34, fw * 0.075), minSize: 15, maxLines: 3, weight: 700, family: 'serif'});
    const af = o.applicantLine ? ctx.fit(o.applicantLine, {maxWidth: lw - 32, size: Math.min(22, fw * 0.05), minSize: 12, maxLines: 2, weight: 500}) : null;
    const blockH = tf.height + (af ? af.height + 12 : 0);
    const y0 = ly + (lh - blockH) / 2;
    label.push(textBlock(tf, {x: lx + lw / 2, y: y0, anchor: 'middle', fill: th.ink}));
    if (af) label.push(textBlock(af, {x: lx + lw / 2, y: y0 + tf.height + 12, anchor: 'middle', fill: th.inkSoft}));
  } else {
    label.push(h('rect', {x: lx + lw * 0.15, y: ly + lh * 0.3, width: lw * 0.7, height: lh * 0.16, rx: 4, fill: th.ink, opacity: 0.7}));
    label.push(h('rect', {x: lx + lw * 0.25, y: ly + lh * 0.6, width: lw * 0.5, height: lh * 0.1, rx: 4, fill: th.paperLine}));
  }
  const outside = g(null,
    h('path', {d: `M0 0H${fw - 10}Q${fw} 0 ${fw} 10V${fh - 10}Q${fw} ${fh} ${fw - 10} ${fh}H0Z`, fill: MANILA.front, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('line', {x1: 16, x2: 16, y1: 4, y2: fh - 4, stroke: shade(MANILA.front, -0.18), 'stroke-width': 2.5}),
    // the label content fades while the cover is seen nearly edge-on (its
    // squeezed text would smear); the blank label card stays
    label[0],
    g({name: `${o.prefix}-cover-label`}, label.slice(1)),
    h('rect', {x: fw * 0.14, y: fh * 0.74, width: fw * 0.72, height: 8, rx: 4, fill: shade(MANILA.front, -0.12)}),
    h('rect', {x: fw * 0.14, y: fh * 0.8, width: fw * 0.5, height: 8, rx: 4, fill: shade(MANILA.front, -0.12)}),
  );
  // inside face (pre-mirrored)
  const inside = g({transform: `translate(${fw} 0) scale(-1 1)`},
    h('path', {d: `M0 10Q0 0 10 0H${fw}V${fh}H10Q0 ${fh} 0 ${fh - 10}Z`, fill: MANILA.inside, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('line', {x1: fw - 16, x2: fw - 16, y1: 4, y2: fh - 4, stroke: shade(MANILA.inside, -0.18), 'stroke-width': 2.5}),
    h('path', {d: `M8 ${r(fh * 0.62)}L${r(fw * 0.5)} ${r(fh * 0.7)}L${fw - 8} ${r(fh * 0.62)}V${fh - 8}H8Z`, fill: shade(MANILA.inside, -0.07), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(fw * 0.3)} ${r(fh * 0.66)}q${r(fw * 0.2)} ${r(fh * 0.05)} ${r(fw * 0.4)} 0`, fill: 'none', stroke: shade(MANILA.inside, -0.25), 'stroke-width': 2}),
  );
  return {back, tabText, outside, inside, tab: {x: tabX, y: -tabH, w: tabW, h: tabH}};
}

/* ---- stage geometry ----------------------------------------------------- */

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {horizontal: {w: 1600, h: 900}, square: {w: 1200, h: 1100}, vertical: {w: 900, h: 1400}};

const GEO = {
  horizontal: {
    fw: 430, fh: 560, spine: 560, top: 96, dw: 370, dh: 480, spread: [250, 250], release: 108,
    shoulderL: [700, 1110], shoulderR: [1150, 1110], restL: [610, 860],
    penRest: [500, 760], penAngle: 118, stampRest: [1440, 720],
    arm: {upper: 320, lower: 300, width: 50, handScale: 1.3},
  },
  square: {
    fw: 400, fh: 520, spine: 440, top: 236, dw: 344, dh: 446, spread: [220, 280], release: 104,
    shoulderL: [590, 1250], shoulderR: [1000, 1250], restL: [430, 1030],
    penRest: [330, 900], penAngle: 118, stampRest: [1110, 905],
    arm: {upper: 330, lower: 310, width: 50, handScale: 1.3},
  },
  vertical: {
    // Portrait: the opened spread (cover + back = 2·fw) is centred in the desk
    // window, taller sheets and a long downward cascade fill the tall frame.
    // Separator tabs stick out of the BOTTOM edge: they read in the closed
    // file and are tucked under the layer above once the cascade spreads
    // (right-edge tabs would end up beside the wrong header strips).
    fw: 400, fh: 600, spine: 450, top: 300, dw: 360, dh: 540, spread: [24, 360], release: 104,
    tabSide: 'bottom', headH: 60, gripCoverY: 0.92,
    shoulderL: [480, 1500], shoulderR: [860, 1500], restL: [432, 1335],
    penRest: [196, 962], penAngle: 118, stampRest: [818, 1326],
    arm: {upper: 372, lower: 352, width: 50, handScale: 1.3},
  },
};

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix                    unique node-name prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {{number:string, title:string, applicantLine:string, docs:Array<{title:string, redacted?:boolean}>}} o.file
 * @param {number} [o.absent=-1]               index of a listed document that is not in the file
 * @param {{name:string, role?:string, appearance?:object}} o.clerk
 * @param {string} [o.clerkCaption]            chip text (null = no chip)
 * @param {string} [o.stampLabel]
 * @param {boolean} [o.withPen=true]
 * @param {boolean} [o.withStamp=true]
 * @param {boolean} [o.withArms=true]
 * @param {{x:number,y:number,w:number,h:number}} [o.window]  crop of the desk window (stage units); default = whole stage
 * @param {{x:number,y:number}} [o.restR]     right-hand rest point (default: on the stamp)
 * @param {number} [o.swapLayer=-1]          inspect: layer drawn both as sheet and as ghost; pose `present` (0..1) chooses
 * @param {boolean} [o.swapSlide=false]      the swapped sheet slides out of / into the stack
 * @param {{index:number, text:string}} [o.altTitle]  inspect: substitute heading for one document (strip + index entry)
 * @param {string} [o.altNumber]             inspect: substitute file number (tab + index header)
 */
export function caseFileDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STAGE[axis];
  const showText = ctx.show('all');
  const strings = {...CASE_STRINGS.en, ...(CASE_STRINGS[ctx.params.locale] || {}), ...ctx.t};
  const docs = o.file.docs;
  const n = docs.length;
  const absent = o.absent ?? -1;
  const withPen = o.withPen !== false;
  const withStamp = o.withStamp !== false;
  const withArms = o.withArms !== false;
  const colors = layerColors(th);
  const {fw, fh, dw, dh, spine, top} = G;
  const step = {x: G.spread[0] / n, y: G.spread[1] / n};
  const stripH = step.y;
  // header band of each sheet (portrait: shorter than the visible strip so the
  // top of each document's body peeks out below its heading)
  const headH = Math.min(stripH, G.headH ?? stripH);

  // ---- folder
  const swapLayer = o.swapLayer ?? -1;
  const altTitle = o.altTitle || null;
  const folder = folderArt(ctx, {prefix: P, fw, fh, number: o.file.number, numberAlt: o.altNumber, title: o.file.title, applicantLine: o.file.applicantLine, showText});
  const cy = top + fh / 2;

  // ---- layers (0 = bottom of the stack … n-1 = top document; n = index sheet)
  const docTL0 = {x: spine + (fw - dw) / 2, y: top + (fh - dh) / 2 + 6};
  const docC0 = {x: docTL0.x + dw / 2, y: docTL0.y + dh / 2};
  const baseOff = j => ({x: j * 2.2, y: j * 2.6});
  const finalOff = j => ({x: j * step.x, y: j * step.y});
  // geometry variation is seeded by the file, never by the node prefix, so a
  // lens copy or a paired desk is geometrically identical
  const geoKey = 'case-file';
  const finalRot = j => (j === n ? 0 : (ctx.rng(`${geoKey}-rot`, j) - 0.5) * 1.6);
  const tabSide = G.tabSide || 'right';
  const tabOut = tabSide === 'bottom' ? (fh - dh) / 2 - 6 + 36 : (fw - dw) / 2 + 36;
  const tabH = Math.min(dh * 0.13, (dh * 0.74) / 5 - 8);
  const tabW = Math.min(dw * 0.16, (dw * 0.8) / 5 - 8);
  const tabOf = j => (tabSide === 'bottom'
    ? {side: 'bottom', x: dw * 0.1 + j * (tabW + 8), w: tabW, out: tabOut}
    : {y: dh * 0.09 + j * (tabH + 8), h: tabH, out: tabOut});
  /** Sheet-local centre of layer j's separator tab. */
  const tabCenter = j => {
    const t = tabOf(j);
    return t.side === 'bottom' ? {x: t.x + t.w / 2, y: dh + t.out * 0.5} : {x: dw + t.out * 0.5, y: t.y + t.h / 2};
  };
  const tabRadius = (tabSide === 'bottom' ? Math.max(tabW, tabOut) : Math.max(tabH, tabOut)) * 0.95;
  const kindOf = j => KINDS[(j + Math.floor(ctx.rng(`${geoKey}-kind`) * 4)) % KINDS.length];
  const layerNodes = docs.map((d, j) => {
    if (j === swapLayer) {
      const sheet = docSheet(ctx, {name: `${P}-sheet-${j}`, w: dw, h: dh, num: j + 1, title: d.title, redacted: d.redacted, color: colors[j % colors.length], kind: kindOf(j), stripH: headH, tab: tabOf(j), showText, seed: `case-doc-${j}`, titleName: `${P}-title-${j}`}).node;
      const ghost = ghostSheet(ctx, {name: `${P}-ghostsheet`, w: dw, h: dh, num: j + 1, title: d.title, redacted: d.redacted, stripH: headH, tab: tabOf(j), showText});
      return [
        g({name: `${P}-ghost`, opacity: 0}, g({transform: T(-dw / 2, -dh / 2)}, ghost)),
        g({name: `${P}-layer-${j}`}, g({transform: T(-dw / 2, -dh / 2)}, sheet)),
      ];
    }
    const inner = j === absent
      ? ghostSheet(ctx, {name: `${P}-ghostsheet`, w: dw, h: dh, num: j + 1, title: d.title, redacted: d.redacted, stripH: headH, tab: tabOf(j), showText, titleName: `${P}-ghost-title`})
      : docSheet(ctx, {name: `${P}-sheet-${j}`, w: dw, h: dh, num: j + 1, title: d.title, altTitle: altTitle && altTitle.index === j ? altTitle.text : null, redacted: d.redacted, color: colors[j % colors.length], kind: kindOf(j), stripH: headH, tab: tabOf(j), showText, seed: `case-doc-${j}`, titleName: `${P}-title-${j}`}).node;
    return g({name: j === absent ? `${P}-ghost` : `${P}-layer-${j}`}, g({transform: T(-dw / 2, -dh / 2)}, inner));
  });
  const idx = indexSheet(ctx, {
    prefix: `${P}-idx`, w: dw, h: dh, number: o.file.number, numberAlt: o.altNumber, title: o.file.title, applicant: o.file.applicantLine,
    entries: docs.map((d, j) => ({title: d.title, redacted: d.redacted, color: colors[j % colors.length], alt: altTitle && altTitle.index === j ? altTitle.text : null})),
    showText, strings, stampLabel: o.stampLabel, withStamp,
  });
  const indexNode = g({name: `${P}-index`}, g({transform: T(-dw / 2, -dh / 2)}, idx.node));

  // ---- props and arms
  const lookClerk = actorLook(ctx, o.clerk, 0);
  const armL = withArms ? topArm(ctx, {name: `${P}-armL`, skin: lookClerk.skin, sleeve: lookClerk.outfit, handed: 'left', ...G.arm}) : null;
  const armR = withArms ? topArm(ctx, {name: `${P}-armR`, skin: lookClerk.skin, sleeve: lookClerk.outfit, handed: 'right', ...G.arm}) : null;
  const penProp = pen(ctx, {name: `${P}-pen`, length: 200, body: th.accent2});
  const penDir = {x: Math.cos(rad(G.penAngle)), y: Math.sin(rad(G.penAngle))};
  const stampNode = stampTool(ctx, {name: `${P}-stamp`, size: axis === 'vertical' ? 84 : 92, color: th.accent});
  const V = a => ({x: a[0], y: a[1]});
  const shoulderL = V(G.shoulderL), shoulderR = V(G.shoulderR);
  const restL = V(G.restL);
  // the right hand rests on the stamp's knob until it is needed
  const restR = o.restR ? {x: o.restR.x, y: o.restR.y} : V(G.stampRest);
  const penRestTip = V(G.penRest);
  const stampRest = V(G.stampRest);

  const win = o.window || {x: 0, y: 0, w: W, h: H};
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: win.x, y: win.y, w: win.w, h: win.h, radius: 30});
  // deskWindow seeds its grain by prefix; repaint the surface with a grain
  // seeded by the stage itself so a lens copy / paired desk matches exactly
  const woodTop = th.woodTop;
  const grain = [];
  const gn = Math.max(6, Math.round(H / 70));
  for (let i = 0; i < gn; i++) {
    const gy = ((i + 0.5) / gn) * H + (ctx.rng('case-desk-grain', i) - 0.5) * 20;
    const wob = 6 + ctx.rng('case-desk-wob', i) * 10;
    grain.push(h('path', {d: `M0 ${r(gy)}C${r(W * 0.3)} ${r(gy - wob)} ${r(W * 0.6)} ${r(gy + wob)} ${r(W)} ${r(gy - wob * 0.4)}`, fill: 'none', stroke: shade(woodTop, -0.12), 'stroke-width': 2, opacity: 0.55}));
  }
  const surface = g(null, desk.surface, g({'clip-path': desk.clip},
    h('rect', {x: win.x, y: win.y, width: win.w, height: win.h, fill: woodTop}),
    grain,
    h('path', {d: roundRectPath(W * 0.06, H * 0.08, W * 0.88, H * 0.84, 22), fill: shade(woodTop, -0.05), opacity: 0.6})));
  const chipSize = axis === 'vertical' ? 30 : 28;
  // clerk chip in the bottom-left corner; up to three lines, bottom-aligned
  let clerkChip = null;
  if (o.clerkCaption && ctx.show('key')) {
    const co = {x: win.x + 26, maxWidth: axis === 'vertical' ? 320 : 400, size: chipSize, minSize: 20, maxLines: 3, name: `${P}-chip`};
    const probe = chip(ctx, o.clerkCaption, {...co, y: 0});
    clerkChip = chip(ctx, o.clerkCaption, {...co, y: win.y + win.h - 26 - probe.box.h});
  }

  const node = g({name: P},
    surface,
    g({'clip-path': desk.clip},
      g({transform: T(spine, top)}, folder.back, folder.tabText),
      layerNodes,
      indexNode,
      h('path', {name: `${P}-cshadow`, fill: '#1f2328', opacity: 0}),
      g({name: `${P}-cover`},
        g({name: `${P}-cover-out`}, folder.outside),
        g({name: `${P}-cover-in`, opacity: 0}, folder.inside)),
      withStamp ? stampNode : null,
      armR ? [armR.arm, armR.palm, armR.thumb] : null,
      armL ? [armL.arm, armL.palm] : null,
      withPen ? penProp.node : null,
      armL ? armL.thumb : null,
    ),
    desk.frame,
    clerkChip && clerkChip.node,
  );

  // ---- geometry helpers
  const rotAt = (pose, local) => {
    const a = rad(pose.rot);
    return {x: pose.x + local.x * Math.cos(a) - local.y * Math.sin(a), y: pose.y + local.x * Math.sin(a) + local.y * Math.cos(a)};
  };
  const layerProgress = (j, sp) => (j === n ? ease.inOutCubic(sp) : ease.inOutCubic(seg(sp, (1 - j / n) * 0.42, 1)));
  const layerPose = (j, sp) => {
    const p = layerProgress(j, sp);
    const off = mix(baseOff(j), finalOff(j), p);
    const wobble = ctx.reduced ? 0 : (j === n ? -1.3 : 0.6) * Math.sin(Math.PI * p);
    return {x: docC0.x + off.x, y: docC0.y + off.y, rot: finalRot(j) * p + wobble};
  };
  /** World point of a sheet-local (top-left origin) point of layer j at spread progress sp. */
  const layerWorld = (j, local, sp = 1) => rotAt(layerPose(j, sp), {x: local.x - dw / 2, y: local.y - dh / 2});
  const indexWorld = (local, sp = 1) => layerWorld(n, local, sp);
  const gripIndexLocal = {x: dw * 0.7, y: dh * 0.93};
  const gripCoverLocal = {x: fw - 24, y: fh * (G.gripCoverY ?? 0.84)};
  const coverAt = theta => {
    const c = Math.cos(rad(theta)), sn = Math.sin(rad(theta));
    return {c, sn, sy: 1 + 0.06 * sn};
  };
  const coverWorld = (theta, local) => {
    const {c, sy} = coverAt(theta);
    return {x: spine + local.x * c, y: cy + (local.y - fh / 2) * sy};
  };
  const penGripOf = tip => ({x: tip.x + penDir.x * penProp.grip, y: tip.y + penDir.y * penProp.grip});

  // ---- pen route over the index (final index pose)
  const route = [];
  // travel time grows with distance so long moves are not rushed
  const travelW = (a, b) => Math.max(0.6, Math.hypot(b.x - a.x, b.y - a.y) / 120);
  let cursor = penRestTip;
  let lastLift = 0;
  docs.forEach((d, i) => {
    const pts = idx.tickPts[i].map(q => indexWorld(q));
    if (i === absent) {
      const b = idx.boxes[i];
      const above = indexWorld({x: b.x + b.s * 0.5, y: b.y + b.s * 0.5});
      route.push({type: 'travel', from: cursor, to: above, l0: lastLift, l1: 1, w: travelW(cursor, above)});
      route.push({type: 'hover', at: above, w: 0.9, entry: i});
      cursor = above;
      lastLift = 1;
    } else {
      route.push({type: 'travel', from: cursor, to: pts[0], l0: lastLift, l1: 0, w: travelW(cursor, pts[0])});
      route.push({type: 'tick', poly: polyline(pts), w: 1.15, entry: i});
      cursor = pts[2];
      lastLift = 0;
    }
  });
  const routeEnd = cursor;
  const routeEndLift = lastLift;
  const routeTotal = route.reduce((a, s) => a + s.w, 0);
  const liftOffset = l => ({x: -5 * l, y: -15 * l});
  /** Pen state along the ticking route, t in [0,1]. */
  function routeAt(t) {
    const ticks = docs.map(() => 0);
    let acc = 0;
    const target = clamp(t) * routeTotal;
    for (const s of route) {
      const a = acc, b = acc + s.w;
      if (s.type === 'tick') ticks[s.entry] = target >= b ? 1 : target > a ? (target - a) / s.w : 0;
      acc = b;
    }
    acc = 0;
    for (const s of route) {
      const a = acc, b = acc + s.w;
      if (target <= b || s === route[route.length - 1]) {
        const k = clamp((target - a) / s.w);
        if (s.type === 'travel') {
          const e = ease.inOutSine(k);
          const base = s.l0 * (1 - k) + s.l1 * k;
          return {tip: mix(s.from, s.to, e), lift: base + (1 - base) * Math.sin(Math.PI * k), touching: false, ticks};
        }
        if (s.type === 'hover') {
          const wob = ctx.reduced ? 0 : Math.sin(Math.PI * 2 * k) * 7;
          return {tip: {x: s.at.x + wob, y: s.at.y}, lift: 1, touching: false, ticks, hovering: s.entry};
        }
        return {tip: s.poly.at(ease.inOutSine(k)), lift: 0, touching: k > 0 && k < 1, ticks};
      }
      acc = b;
    }
    return {tip: routeEnd, lift: routeEndLift, touching: false, ticks};
  }

  /**
   * Pose the stage from action values in [0,1] (missing = 0).
   * Left hand: reachCover → lift → toPen → ticks → penDown → withdrawL.
   * Right hand: reachIndex → spread → (releaseR | toStamp → stamp → backR).
   * Cover: lift (hand-held) then fall (free).
   * @param {Record<string, number>} s
   */
  function pose(s) {
    const v = k => clamp(s[k] ?? 0);
    const nodes = {};
    const reduced = ctx.reduced;

    // --- cover: hand-lifted to the release angle, then it falls open by itself
    const liftTheta = G.release * ease.inOutSine(v('lift'));
    let theta = liftTheta;
    if (v('fall') > 0) {
      const f = v('fall');
      theta = lerp(G.release, 180, ease.inQuad(clamp(f / 0.62)));
      if (!reduced && f > 0.62) theta = 180 - 5 * Math.sin((Math.PI * (f - 0.62)) / 0.38);
    }
    const cv = coverAt(theta);
    nodes[`${P}-cover`] = {transform: `${T(spine, cy)} scale(${r(cv.c, 4)} ${r(cv.sy, 4)}) translate(0 ${r(-fh / 2)})`};
    nodes[`${P}-cover-out`] = {opacity: cv.c >= 0 ? 1 : 0};
    nodes[`${P}-cover-in`] = {opacity: cv.c < 0 ? 1 : 0};
    // label text fades out before the cover turns edge-on (|cos θ| < ~0.3)
    nodes[`${P}-cover-label`] = {opacity: r(clamp((Math.abs(cv.c) - 0.3) / 0.2), 3)};
    // cast shadow of the lifted cover (offset away from the light, top-left)
    const lift = Math.max(0, cv.sn);
    const sh = {x: 26 * lift, y: 30 * lift};
    const xa = spine, xb = spine + fw * cv.c;
    const y0 = cy - (fh / 2) * cv.sy, y1 = cy + (fh / 2) * cv.sy;
    nodes[`${P}-cshadow`] = {
      d: `M${r(xa)} ${r(top)}L${r(xb + sh.x)} ${r(y0 + sh.y)}L${r(xb + sh.x)} ${r(y1 + sh.y)}L${r(xa)} ${r(top + fh)}Z`,
      opacity: r(0.16 * lift * (theta < 178 ? 1 : 0), 3),
    };
    const coverGrip = coverWorld(theta, gripCoverLocal);

    // --- layers + index
    const sp = v('spread');
    const layerPoses = [];
    for (let j = 0; j <= n; j++) {
      const lp = layerPose(j, sp);
      layerPoses.push(lp);
      const name = j === n ? `${P}-index` : j === absent ? `${P}-ghost` : `${P}-layer-${j}`;
      nodes[name] = {transform: T(lp.x, lp.y, lp.rot)};
    }
    if (absent >= 0) nodes[`${P}-ghost`].opacity = r(s.ghost ?? 1, 3);
    if (swapLayer >= 0) {
      // present = 1: the sheet is in the stack; 0: only its dashed slot remains
      // sequential, never a double exposure: the sheet leaves first, then the slot shows
      const q = 1 - clamp(s.present ?? 1);
      const lp = layerPoses[swapLayer];
      const dy = o.swapSlide ? -ease.inOutCubic(clamp(q / 0.6)) * stripH * 1.8 : 0;
      nodes[`${P}-layer-${swapLayer}`] = {transform: T(lp.x, lp.y + dy, lp.rot), opacity: r(1 - clamp(q / 0.6), 3)};
      nodes[`${P}-ghost`] = {transform: T(lp.x, lp.y, lp.rot), opacity: r(clamp((q - 0.5) / 0.5), 3)};
    }
    // text substitutions (old value lifts out, new value settles in)
    const swapText = (base, p) => {
      const out = clamp(p * 2), inn = clamp(p * 2 - 1);
      nodes[base] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-12 * out)})`};
      nodes[`${base}-alt`] = {opacity: r(inn, 3), transform: `translate(0 ${r(12 * (1 - inn))})`};
    };
    if (showText && altTitle && !docs[altTitle.index].redacted) {
      swapText(`${P}-title-${altTitle.index}`, clamp(s.titleSwap ?? 0));
      swapText(`${P}-idx-entry-${altTitle.index}`, clamp(s.titleSwap ?? 0));
    }
    if (showText && o.altNumber != null) {
      swapText(`${P}-tabtext`, clamp(s.numberSwap ?? 0));
      swapText(`${P}-idx-number`, clamp(s.numberSwap ?? 0));
    }
    const indexGrip = rotAt(layerPoses[n], {x: gripIndexLocal.x - dw / 2, y: gripIndexLocal.y - dh / 2});
    const indexGripBase = layerWorld(n, gripIndexLocal, 0);
    const indexGripFinal = layerWorld(n, gripIndexLocal, 1);

    // --- left hand (cover, then pen)
    let handL;
    let penTipTarget = null;
    let penLift = 0;
    let touching = false;
    let ticks = docs.map(() => 0);
    let hovering = -1;
    const rp = v('ticks');
    if (rp > 0 || v('penDown') > 0) ticks = routeAt(Math.max(rp, v('penDown') > 0 ? 1 : 0)).ticks;
    if (withPen && v('withdrawL') > 0) {
      handL = mix(penGripOf(penRestTip), restL, ease.inOutCubic(v('withdrawL')));
    } else if (withPen && v('penDown') > 0) {
      const pd = v('penDown');
      penTipTarget = mix(routeEnd, penRestTip, ease.inOutSine(pd));
      penLift = routeEndLift * (1 - pd) + (1 - routeEndLift * (1 - pd)) * Math.sin(Math.PI * pd);
    } else if (withPen && rp > 0) {
      const st = routeAt(rp);
      penTipTarget = st.tip;
      penLift = st.lift;
      touching = st.touching;
      hovering = st.hovering ?? -1;
    } else if (v('toPen') > 0) {
      handL = mix(coverWorld(G.release, gripCoverLocal), withPen ? penGripOf(penRestTip) : restL, ease.inOutCubic(v('toPen')));
    } else if (v('lift') > 0) {
      handL = coverWorld(liftTheta, gripCoverLocal);
    } else {
      handL = mix(restL, coverWorld(0, gripCoverLocal), ease.inOutSine(v('reachCover')));
    }
    if (penTipTarget) {
      const lo = liftOffset(penLift);
      handL = penGripOf({x: penTipTarget.x + lo.x, y: penTipTarget.y + lo.y});
    }
    let solvedL = null;
    if (armL) {
      solvedL = armL.pose(shoulderL, handL, 1);
      Object.assign(nodes, solvedL.nodes);
    }
    const handLpos = solvedL ? solvedL.hand : handL;
    const penHeld = Boolean(penTipTarget);
    const penTip = penHeld ? {x: handLpos.x - penDir.x * penProp.grip, y: handLpos.y - penDir.y * penProp.grip} : penRestTip;
    if (withPen) nodes[`${P}-pen`] = {transform: T(penTip.x, penTip.y, G.penAngle)};
    if (s.tickValues) ticks = s.tickValues.slice();
    Object.assign(nodes, idx.frameTicks(ticks));

    // --- right hand (index sheet, then stamp)
    let handR;
    let press = 0;
    const st = v('stamp');
    const spot = indexWorld(idx.stampSpot);
    if (withStamp && v('backR') > 0) handR = mix(stampRest, restR, ease.inOutCubic(v('backR')));
    else if (withStamp && st > 0) {
      const go = seg(st, 0, 0.38), down = seg(st, 0.38, 0.5), up = seg(st, 0.5, 0.6), back = seg(st, 0.6, 1);
      handR = back > 0 ? mix(spot, stampRest, ease.inOutCubic(back)) : mix(stampRest, spot, ease.inOutCubic(go));
      press = down > 0 && up < 1 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
    } else if (withStamp && v('toStamp') > 0) handR = mix(indexGripFinal, stampRest, ease.inOutCubic(v('toStamp')));
    else if (v('releaseR') > 0) handR = mix(indexGripFinal, restR, ease.inOutCubic(v('releaseR')));
    else if (sp > 0) handR = indexGrip;
    else handR = mix(restR, indexGripBase, ease.inOutSine(v('reachIndex')));
    let solvedR = null;
    if (armR) {
      solvedR = armR.pose(shoulderR, handR, -1);
      Object.assign(nodes, solvedR.nodes);
    }
    const handRpos = solvedR ? solvedR.hand : handR;
    const carried = withStamp && st > 0 && st < 1;
    const stampPos = carried ? handRpos : stampRest;
    if (withStamp) {
      nodes[`${P}-stamp`] = {transform: T(stampPos.x, stampPos.y, 0, (1 + 0.07 * (carried ? 1 - press : 0)) * (1 - 0.08 * press))};
      nodes[`${P}-stamp-shadow`] = {opacity: r(1 - press * 0.85, 3)};
      nodes[`${P}-idx-impr`] = {opacity: st >= 0.5 ? 0.92 : 0};
    }

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const reachedL = solvedL ? solvedL.reached : true;
    const reachedR = solvedR ? solvedR.reached : true;
    return {
      nodes,
      semantic: {
        coverAngle: r(theta, 2),
        coverOpen: theta >= 175,
        coverGrip: P2(coverGrip),
        handL: P2(handLpos),
        handR: P2(handRpos),
        indexGrip: P2(indexGrip),
        indexCenter: P2(layerPoses[n]),
        topDocCenter: P2(layerPoses[Math.max(0, n - 1)]),
        spread: r(sp, 3),
        penTip: P2(penTip),
        penGrip: P2(penGripOf(penTip)),
        penHeld,
        penTouching: touching,
        penHovering: hovering,
        ticks: ticks.map(t => r(t, 3)),
        stampTool: P2(stampPos),
        stampSpot: P2(spot),
        stampPressed: press > 0.5,
        stampApplied: withStamp && st >= 0.5,
        holder: sp >= 1 ? 'laid-out' : sp > 0 ? 'right-hand' : v('lift') > 0 && v('fall') === 0 ? 'cover-in-left-hand' : 'folder',
        reach: {L: reachedL, R: reachedR},
        allReached: reachedL && reachedR,
      },
    };
  }

  return {
    node, pose, W, H, axis, G, n, absent, dw, dh, fw, fh, stripH, step, spine, top, win,
    idx, colors,
    folderRect: {x: spine, y: top, w: fw, h: fh},
    coverOpenRect: {x: spine - fw, y: top, w: fw, h: fh},
    tabRect: {x: spine + folder.tab.x, y: top + folder.tab.y, w: folder.tab.w, h: folder.tab.h},
    tabOf,
    tabSide,
    tabCenter,
    tabRadius,
    headH,
    layerWorld,
    indexWorld,
    layerPose,
    penRestTip,
    stampRest,
    clerkChipBox: clerkChip ? clerkChip.box : null,
    /** Bounding box of the laid-out cascade (layers + index) in stage units (tabs are tucked under). */
    cascadeBox: (() => {
      const a = layerWorld(0, {x: 0, y: 0}), b = indexWorld({x: dw, y: dh});
      return {x: a.x - 6, y: a.y - 6, w: b.x - a.x + (tabSide === 'right' ? tabOut : 0) + 12, h: b.y - a.y + 12};
    })(),
  };
}

/**
 * Editorial note for narrow free areas (e.g. the inside of the opened cover):
 * a chip of up to three lines with a leader from its nearest edge to the
 * target. Same frame semantics as primitives/annotate `callout`.
 * @param {any} ctx
 * @param {{name:string, text:string, x:number, y:number, anchor?:'start'|'middle'|'end', maxWidth:number, size?:number, maxLines?:number, target:{x:number,y:number}}} o
 */
export function sideNote(ctx, o) {
  const th = ctx.theme;
  const c = chip(ctx, o.text, {x: o.x, y: o.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size ?? 26, maxLines: o.maxLines ?? 3, fill: th.card, stroke: th.ink, name: `${o.name}-chip`});
  const b = c.box;
  const t = o.target;
  let from;
  if (t.x > b.x + b.w) from = {x: b.x + b.w, y: clamp(t.y, b.y + 12, b.y + b.h - 12)};
  else if (t.x < b.x) from = {x: b.x, y: clamp(t.y, b.y + 12, b.y + b.h - 12)};
  else from = {x: clamp(t.x, b.x + 12, b.x + b.w - 12), y: t.y > b.y + b.h ? b.y + b.h : b.y};
  const len = Math.max(1, Math.hypot(t.x - from.x, t.y - from.y));
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(t.x), y2: r(t.y), stroke: th.ink, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(t.x), cy: r(t.y), r: 7, fill: th.ink, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
    c.node,
  );
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: Math.min(1, Math.max(0, (p - 0.45) / 0.55))},
  });
  return {node, frame, box: b};
}
