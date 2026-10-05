/**
 * Motif kit for "Extracción de hechos" (LAW-0065..0068).
 *
 * Research objects drawn for this motif (original vector artwork):
 *  - `libraryShelf`  front-view library bay: spines on shelves, a crown plate
 *                    and an OUT-guide card standing in the gap left by the
 *                    volume that is being read (its tab has the cover colour);
 *  - `openBook`      that volume, open on a reading stand. The right page is
 *                    the source page: header (volume, page, title, date) and
 *                    numbered sentences (¶ numbers in the left margin), each
 *                    with its own highlight bands and an edge notch;
 *  - `sourceSheet`   the same page drawn as a loose sheet (mechanism view);
 *  - `requestPanel`  the search box ("buscador") listing the facts the USER
 *                    indicates; each request row has its own coloured index
 *                    flag parked on it and an Extract button in the field;
 *  - `pointer`       the user's pointer that presses the Extract button;
 *  - `flagMarker`    an adhesive index flag (translucent sticky part + tab
 *                    with the ¶ pinpoint). Origin = its stick point;
 *  - `factStrip`     a copy slip of one sentence (same fit, same size) that
 *                    the flag peels off the page and carries away. Origin =
 *                    its grip (where the flag sticks), so lift/tilt never
 *                    detach it from the flag. With `roll` the copy rolls up
 *                    toward its grip and unrolls again (`rollCopies` on the
 *                    stage: a carried copy never lies over the page text);
 *  - `noteSlip`      a handwritten annotation (dashed border) for a fact that
 *                    is NOT written on the page (annotated inference);
 *  - `factCard`      a catalogue index card ("ficha": red header rule, blue
 *                    rules, punch hole) with one slot per requested fact.
 *
 * Text helpers: `balanceFit`/`fitBalanced` re-wrap a multi-line fit into lines
 * of similar length (no numeral left alone on a line).
 *
 * `extractionStage` composes them from an explicit geometry (supplied by each
 * entry per layout shape) and poses them from per-fact phase values. The
 * source page never changes its text: extraction leaves a highlight and an
 * edge notch; the strip is a copy. Attachment rules (exposed as semantics): a
 * carried strip's grip IS the flag's stick point; a parked or stuck flag never
 * moves; everything travels along continuous arc-length paths.
 * @module animations/research/kits/extraccion-de-hechos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, r, seg} from '../../../core/time.js';
import {catmullRom, polyline, roundRectPath, mix} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {pen, shade} from '../../../primitives/paper.js';
import {str, int, list, obj, oneOf} from '../../../schemas/fields.js';

export const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------------ */
/* Fields, defaults and strings                                              */
/* ------------------------------------------------------------------------ */

export const MAX_SENTENCES = 6;

/** One fact indicated by the user. The sentence that states it is SUPPLIED. */
export const factField = obj('A fact the user indicates in the search box', {
  label: str('Request typed by the user (short wording shown in the search box)', 60),
  sentence: int('¶ number (1-based) of the page sentence that states this fact — supplied by the author, never computed by the scene', 1, MAX_SENTENCES),
}, ['label', 'sentence']);

/** Research category fields specialised for this motif (query, sources, citations, dates). */
export const extractionFields = {
  query: obj('Facts indicated by the user in the search box', {
    facts: list('Requested facts (1–3), in the order they are filed on the card; each has its own marker colour', factField, 1, 3),
    placeholder: str('Text shown in the search field', 40),
  }, ['facts']),
  sources: obj('The library source (fictional, simulated text)', {
    library: str('Label on the library shelf', 40),
    volume: str('Volume identifier (page header and card source line)', 16),
    title: str('Title printed on the page header', 60),
    sentences: list('Numbered sentences printed on the source page (simulated, fictional)', str('Sentence', 90), 3, MAX_SENTENCES),
  }, ['volume', 'title', 'sentences']),
  citations: obj('How entries cite the page (fictional references only)', {
    page: str('Page reference printed on the page header and the card, e.g. "p. 12"', 16),
    pinpoint: str('Pinpoint sign printed before a sentence number on each marker, e.g. ¶', 4),
  }),
  dates: obj('Relative, fictional dates', {
    source: str('Date printed on the page header', 24),
    extracted: str('Date printed on the card source line', 24),
  }),
};

/** A request that is filed either as a quote (documented) or as an annotated inference. */
export const requestField = obj('One requested fact and how it is filed', {
  label: str('Request typed by the user', 60),
  mode: oneOf('documented: the page states it (a copy strip is pulled out) · inference: it is not written on the page (basis sentences are flagged and a note is written)', ['documented', 'inference']),
  sentence: int('¶ number (1-based) that states the fact (documented mode)', 1, MAX_SENTENCES),
  basis: list('¶ numbers (1-based) the inference is based on (inference mode)', int('¶ number', 1, MAX_SENTENCES), 1, 2),
  note: str('Annotation written on the card (inference mode; fictional, descriptive)', 80),
}, ['label', 'mode']);

export const SOURCES_EN = {
  library: 'Case library',
  volume: 'VOL-7',
  title: 'Warehouse file',
  sentences: [
    'Order 118 was placed by Party A on Day 2.',
    'The carrier collected the goods on Day 3.',
    'Party B signed the delivery note on Day 4.',
    'Two crates were stored in Bay 7.',
    'The invoice was issued on Day 6.',
  ],
};
export const SOURCES_ES = {
  library: 'Biblioteca de casos',
  volume: 'VOL-7',
  title: 'Expediente del almacén',
  sentences: [
    'La parte A hizo el pedido 118 el día 2.',
    'El transportista recogió la mercancía el día 3.',
    'La parte B firmó el albarán el día 4.',
    'Se guardaron dos cajas en la nave 7.',
    'La factura se emitió el día 6.',
  ],
};
export const QUERY_EN = {
  facts: [
    {label: 'Who signed the delivery note', sentence: 3},
    {label: 'When the goods were collected', sentence: 2},
    {label: 'Where the crates were stored', sentence: 4},
  ],
  placeholder: 'Facts to extract…',
};
export const QUERY_ES = {
  facts: [
    {label: 'Quién firmó el albarán', sentence: 3},
    {label: 'Cuándo se recogió la mercancía', sentence: 2},
    {label: 'Dónde se guardaron las cajas', sentence: 4},
  ],
  placeholder: 'Hechos que extraer…',
};
export const CITATIONS_DEFAULT = {page: 'p. 12', pinpoint: '¶'};
export const DATES_EN = {source: 'Day 7', extracted: 'Day 9'};
export const DATES_ES = {source: 'Día 7', extracted: 'Día 9'};

/** Built-in strings (user content is never translated). */
export const EXTRACTION_STRINGS = {
  en: {
    search: 'Search the file', card: 'Fact card', markers: 'Index flags', extract: 'Extract',
    extracted: 'Facts extracted', flagged: 'Facts flagged on the page', sourceKept: 'Source page unchanged',
    quoted: 'Quoted from the page', annotated: 'Annotated inference', notOnPage: 'Not written on the page',
    basedOn: 'based on', documented: 'Documented', inference: 'Inference', context: 'Context',
  },
  es: {
    search: 'Buscar en el expediente', card: 'Ficha de hechos', markers: 'Marcadores', extract: 'Extraer',
    extracted: 'Hechos extraídos', flagged: 'Hechos marcados en la página', sourceKept: 'Página de origen sin cambios',
    quoted: 'Citado de la página', annotated: 'Inferencia anotada', notOnPage: 'No figura en la página',
    basedOn: 'a partir de', documented: 'Documentado', inference: 'Inferencia', context: 'Contexto',
  },
};

/** Clamp the supplied 1-based sentence number to the page (0-based). */
export function sentenceIndex(n, count) {
  return clamp(Math.round(n) - 1, 0, count - 1);
}

/** Pinpoint text for a sentence index (0-based), e.g. "¶3". */
export function pinText(citations, i) {
  return `${(citations && citations.pinpoint) ?? '¶'}${i + 1}`;
}

/** Pinpoint text for several sentences, compact so it stays large on a flag tab: "¶2+3". */
export function pinsText(citations, idx) {
  return idx.length > 1 ? `${(citations && citations.pinpoint) ?? '¶'}${idx.map(i => i + 1).join('+')}` : pinText(citations, idx[0]);
}

const norm = s => String(s || '').toLowerCase().replace(/[“”"'«»]/g, '').replace(/\s+/g, ' ').replace(/[\s.;:,!?…]+$/, '').trim();

/**
 * Where a wording is written on the page: the index of the first sentence
 * that equals it or contains it verbatim (case/space/end-punctuation
 * insensitive, at least 12 characters), or -1 when the page does not contain
 * that wording. A descriptive text comparison only — it never decides what is
 * true or what a source means.
 * @param {string} text
 * @param {string[]} sentences
 */
export function findOnPage(text, sentences) {
  const t = norm(text);
  if (!t) return -1;
  const exact = sentences.findIndex(s => norm(s) === t);
  if (exact >= 0) return exact;
  if (t.length < 12) return -1;
  return sentences.findIndex(s => norm(s).includes(t));
}

/* ------------------------------------------------------------------------ */
/* Colour helpers                                                            */
/* ------------------------------------------------------------------------ */

function lum(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Marker colours per requested fact: flag fill, highlight band and tab ink. */
export function factPalette(ctx) {
  const th = ctx.theme;
  return [th.accent3, th.accent2, th.accent4].map(c => ({flag: c, band: c, tabInk: lum(c) > 0.33 ? th.ink : '#ffffff'}));
}

/** Book cover colour (shared by the book, the OUT-guide tab and the card source line). */
export const coverColor = ctx => shade(ctx.theme.accent, -0.38);

/** Ink used for handwriting (annotations). */
export const noteInk = ctx => (ctx.params.palette === 'mono' ? ctx.theme.ink : shade(ctx.theme.accent2, -0.35));

const BOOK_COLORS = ['#6d4c41', '#3d5a6c', '#7a6a3a', '#5b6e4f', '#8a5a44', '#4a4f6b', '#9b7b52', '#5e3f4f'];

/**
 * Text block, or bars of the same geometry when the level is hidden (so the
 * object keeps its look and the action still reads with labels off).
 */
export function textOrBars(ctx, fit, o) {
  if (o.show) return textBlock(fit, {x: o.x, y: o.y, anchor: o.anchor, fill: o.fill, name: o.name, italic: o.italic, letterSpacing: o.letterSpacing, opacity: o.opacity});
  return g({name: o.name, opacity: o.opacity}, fit.lines.map((line, i) => {
    const lw = ctx.measure(line, fit.size, fit.weight, fit.family);
    const x = o.anchor === 'middle' ? o.x - lw / 2 : o.anchor === 'end' ? o.x - lw : o.x;
    return h('rect', {x: r(x), y: r(o.y + i * fit.lineHeight + fit.size * 0.18), width: r(lw), height: r(fit.size * 0.62), rx: r(fit.size * 0.2), fill: o.barFill || o.fill, opacity: o.barOpacity ?? 0.42});
  }));
}

/**
 * Re-wrap a fitted multi-line text into lines of similar length (same size,
 * same number of lines, so the block height does not change). Used when the
 * last line is short, so a numeral never ends up alone ("… on Day / 3.").
 * @param {any} ctx
 * @param {import('../../../core/text.js').FitResult} fit
 * @param {number} maxWidth the width the text was fitted in
 * @param {number} [ratio=0.62] balance only when last line < ratio × widest line
 */
export function balanceFit(ctx, fit, maxWidth, ratio = 0.62) {
  if (!fit || fit.truncated || fit.lines.length < 2) return fit;
  const n = fit.lines.length;
  const lw = fit.lines.map(l => ctx.measure(l, fit.size, fit.weight, fit.family));
  if (lw[n - 1] >= ratio * Math.max(...lw)) return keepNumerals(ctx, fit, maxWidth);
  const o = {size: fit.size, minSize: fit.size, maxLines: n, weight: fit.weight, family: fit.family, leading: fit.lineHeight / fit.size};
  // (never narrower than the longest word: a balanced block never breaks a word)
  const longest = Math.max(...String(fit.full).split(/\s+/).map(w => ctx.measure(w, fit.size, fit.weight, fit.family)));
  let lo = Math.max(fit.width / n, longest), hi = maxWidth, best = fit;
  for (let k = 0; k < 10; k++) {
    const mid = (lo + hi) / 2;
    const f = ctx.fit(fit.full, {...o, maxWidth: mid});
    if (!f.truncated && f.lines.length === n) { best = f; hi = mid; } else lo = mid;
  }
  return keepNumerals(ctx, best, maxWidth);
}

/**
 * A line never starts with a bare number ("… by Day / 4"): the word before it
 * moves down with it when the line still fits (same size, same line count).
 * @param {any} ctx
 * @param {import('../../../core/text.js').FitResult} fit
 * @param {number} maxWidth
 */
export function keepNumerals(ctx, fit, maxWidth) {
  if (!fit || fit.truncated || fit.lines.length < 2) return fit;
  const lines = fit.lines.slice();
  const m = s => ctx.measure(s, fit.size, fit.weight, fit.family);
  let changed = false;
  for (let j = 1; j < lines.length; j++) {
    const first = lines[j].split(' ')[0];
    if (!/^\(?\d{1,4}[.,;:)]*$/.test(first)) continue;
    const prev = lines[j - 1].split(' ');
    if (prev.length < 2) continue;
    const moved = `${prev[prev.length - 1]} ${lines[j]}`;
    if (m(moved) > maxWidth) continue;
    lines[j - 1] = prev.slice(0, -1).join(' ');
    lines[j] = moved;
    changed = true;
  }
  return changed ? {...fit, lines, width: Math.max(...lines.map(m))} : fit;
}

/**
 * Two-line fit of a " · "-separated line (e.g. a card's source line) that only
 * breaks between segments, never inside one ("Day 7 (filed)" stays whole).
 * Returns null when no segment split fits between size and minSize.
 */
export function fitSegments(ctx, text, o) {
  const segs = String(text).split(' · ');
  if (segs.length < 2) return null;
  const weight = o.weight ?? 400, family = o.family ?? 'sans', leading = o.leading ?? 1.18;
  for (let size = o.size; size >= o.minSize - 1e-9; size -= 0.5) {
    let best = null;
    for (let k = 1; k < segs.length; k++) {
      const a = `${segs.slice(0, k).join(' · ')} ·`, b = segs.slice(k).join(' · ');
      const wa = ctx.measure(a, size, weight, family), wb = ctx.measure(b, size, weight, family);
      if (Math.max(wa, wb) > o.maxWidth) continue;
      const cost = Math.abs(wa - wb);
      if (!best || cost < best.cost) best = {cost, lines: [a, b], width: Math.max(wa, wb)};
    }
    if (best) return {lines: best.lines, size, lineHeight: size * leading, width: best.width, height: size * leading + size, truncated: false, full: String(text), weight, family};
  }
  return null;
}

const numeralStart = f => f.lines.slice(1).some(l => /^\(?\d{1,4}[.,;:)]*(\s|$)/.test(l));

/**
 * ctx.fit + balanceFit (same options). When a line would still start with a bare number, slightly
 * narrower widths are tried (same size, within maxLines) so the number keeps its word.
 */
export function fitBalanced(ctx, text, o) {
  const f = balanceFit(ctx, ctx.fit(text, o), o.maxWidth);
  if (f.truncated || !numeralStart(f)) return f;
  for (let k = 1; k <= 10; k++) {
    const w = o.maxWidth * (1 - 0.025 * k);
    const g2 = keepNumerals(ctx, ctx.fit(text, {...o, maxWidth: w}), w);
    if (!g2.truncated && g2.lines.length <= (o.maxLines ?? 2) && g2.size >= f.size - 1e-9 && !numeralStart(g2)) return g2;
  }
  return f;
}

/** Smooth path through points (arc-length sampled). */
export const smooth = pts => polyline(catmullRom(pts, 16));

/**
 * Orthogonal route through `pts` with rounded corners (arc-length sampled):
 * straight runs, quarter-curve turns, no overshoot.
 * @param {Array<{x:number,y:number}>} pts
 * @param {number} rad corner radius (clamped to half of each adjacent run)
 */
export function roundedRoute(pts, rad = 36) {
  const P = pts.filter((q, i) => i === 0 || Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) > 0.5);
  if (P.length < 3) return polyline(P.length > 1 ? P : [P[0], P[0]]);
  const out = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, l1 / 2, l2 / 2);
    const p1 = {x: b.x + (a.x - b.x) * rr / l1, y: b.y + (a.y - b.y) * rr / l1};
    const p2 = {x: b.x + (c.x - b.x) * rr / l2, y: b.y + (c.y - b.y) * rr / l2};
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      out.push({x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * b.x + t * t * p2.x, y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * b.y + t * t * p2.y});
    }
  }
  out.push(P[P.length - 1]);
  return polyline(out);
}

/* ------------------------------------------------------------------------ */
/* Library shelf                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Front-view library bay. Local origin = top-left of the case.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, rows?:number, label?:string, gapRow?:number, gapAt?:number, cover:string, seedKey?:string, plate?:boolean}} o
 */
export function libraryShelf(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const P = o.prefix;
  const seedKey = o.seedKey || 'extraction-shelf';
  const rows = o.rows ?? Math.max(1, Math.min(5, Math.round(hh / 150)));
  const side = Math.max(12, Math.min(22, w * 0.06));
  let plateFit = null;
  if (o.plate !== false && o.label) {
    // the plate names the object: a key label, kept large (it wraps to two lines before shrinking)
    const pw = w * (o.plateW ?? 0.84) - 14;
    const ps = o.plateSize ?? 24;
    // one line, else two (or three) lines at a still-large size, and only then smaller
    const tries = [[1, 0.9], [2, 0.85], ...(o.plateLines > 2 ? [[3, 0.85]] : []), [2, 0.72], ...(o.plateLines > 2 ? [[3, 0.72]] : [])];
    for (const [lines, k] of tries) {
      plateFit = fitBalanced(ctx, o.label, {maxWidth: pw, size: ps, minSize: ps * k, maxLines: lines, weight: 700});
      if (!plateFit.truncated) break;
    }
  }
  const crown = o.plate === false ? 16 : Math.max(40, Math.min(o.label && plateFit && plateFit.lines.length > 1 ? 70 : 56, hh * 0.1), plateFit ? plateFit.height + 20 : 0);
  const base = Math.max(16, Math.min(26, hh * 0.04));
  const board = 10;
  const inner = {x: side, y: crown, w: w - side * 2, h: hh - crown - base};
  const rowH = inner.h / rows;
  const parts = [
    h('path', {d: roundRectPath(8, 12, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: inner.x, y: inner.y, width: inner.w, height: inner.h, fill: shade(th.woodDark, -0.35), stroke: th.ink, 'stroke-width': 2}),
  ];
  const gapRow = clamp(o.gapRow ?? Math.min(1, rows - 1), 0, rows - 1);
  let gapBox = null;
  for (let k = 0; k < rows; k++) {
    const y0 = inner.y + k * rowH;
    const floor = y0 + rowH - board;
    let x = inner.x + 4;
    let i = 0;
    const gapAt = k === gapRow ? inner.x + inner.w * (o.gapAt ?? 0.52) : null;
    while (x < inner.x + inner.w - 12) {
      if (gapAt !== null && !gapBox && x >= gapAt) {
        const gw = Math.max(24, Math.min(36, inner.w * 0.16));
        gapBox = {x, y: y0 + 6, w: gw, h: floor - y0 - 6};
        x += gw + 2;
        continue;
      }
      const bw = 13 + ctx.rng(`${seedKey}-w-${k}`, i) * 15;
      if (x + bw > inner.x + inner.w - 3) break;
      const bh = (rowH - board - 10) * (0.66 + ctx.rng(`${seedKey}-h-${k}`, i) * 0.3);
      const col = BOOK_COLORS[Math.floor(ctx.rng(`${seedKey}-c-${k}`, i) * BOOK_COLORS.length)];
      const lean = ctx.rng(`${seedKey}-l-${k}`, i) > 0.9 && i > 0 ? 1 : 0;
      parts.push(h('rect', {x: r(x), y: r(floor - bh), width: r(bw), height: r(bh), rx: 2, fill: col, stroke: th.ink, 'stroke-width': 1.6, transform: lean ? `rotate(4 ${r(x + bw)} ${r(floor)})` : undefined}));
      parts.push(h('rect', {x: r(x + 2), y: r(floor - bh + bh * 0.14), width: r(bw - 4), height: 4, fill: '#ffffff', opacity: 0.35, transform: lean ? `rotate(4 ${r(x + bw)} ${r(floor)})` : undefined}));
      parts.push(h('rect', {x: r(x + 2), y: r(floor - bh * 0.24), width: r(bw - 4), height: 3, fill: '#000000', opacity: 0.22, transform: lean ? `rotate(4 ${r(x + bw)} ${r(floor)})` : undefined}));
      x += bw + 1.5 + lean * 3;
      i++;
    }
    parts.push(h('rect', {x: inner.x - 2, y: floor, width: inner.w + 4, height: board, fill: th.woodTop, stroke: th.ink, 'stroke-width': 1.8}));
  }
  // OUT-guide: a card standing in the gap left by the volume being read
  let outGuide = null;
  if (gapBox) {
    const gx = gapBox.x + 3, gw = gapBox.w - 6;
    const top = gapBox.y - 16;
    outGuide = {x: gx, y: top, w: gw, h: gapBox.y + gapBox.h - top};
    parts.push(h('rect', {x: gapBox.x, y: gapBox.y, width: gapBox.w, height: gapBox.h, fill: '#000', opacity: 0.25}));
    parts.push(h('path', {d: roundRectPath(gx, top, gw, outGuide.h, 3), fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}));
    parts.push(h('rect', {x: gx, y: top, width: gw, height: 16, rx: 3, fill: o.cover, stroke: th.ink, 'stroke-width': 1.6}));
    for (let j = 0; j < 4 && top + 28 + j * 12 < gapBox.y + gapBox.h - 6; j++) parts.push(h('rect', {x: gx + 5, y: top + 28 + j * 12, width: gw - 10, height: 3, rx: 1.5, fill: th.paperLine}));
  }
  // crown plate with the library label
  let plate = null;
  if (o.plate !== false) {
    const ph = plateFit ? plateFit.height + 12 : crown * 0.66;
    const pwf = o.plateW ?? 0.84;
    plate = {x: w * (1 - pwf) / 2, y: (crown - ph) / 2 - 2, w: w * pwf, h: ph};
    parts.push(h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 5), fill: '#efe3c4', stroke: th.ink, 'stroke-width': 1.8}));
    if (plateFit) {
      const f = plateFit;
      parts.push(textOrBars(ctx, f, {x: plate.x + plate.w / 2, y: plate.y + (plate.h - f.height) / 2, anchor: 'middle', fill: th.ink, show: ctx.show('key'), name: `${P}-label`}));
    }
  }
  parts.push(h('rect', {x: 0, y: hh - base, width: w, height: base, fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}));
  return {node: g({name: P}, parts), w, h: hh, gapBox, outGuide, plate, rows, rowH};
}

/* ------------------------------------------------------------------------ */
/* Source page: numbered sentences                                           */
/* ------------------------------------------------------------------------ */

/**
 * Height of one sentence row: a condensed context row (one simulated bar) is a thin row, but never
 * so thin that the ¶ number discs (r = 15) of neighbouring rows touch.
 */
const thinRow = size => Math.max(size * 0.8, 32 - Math.max(10, size * 0.5));
const rowHeight = (f, size, condensed) => (condensed ? thinRow(size) : f.height + size * 0.25);
/** Height kept under the last row (and added under the header rule) for the ellipsis of an omitted run that ends (starts) the page. */
const OMIT_TAIL = 14;
const OMIT_HEAD = 8;

/**
 * Fit every sentence at ONE common size so the page reads as one text.
 * Prefers ≤2 lines per sentence, then allows 3 at the minimum size.
 */
export function fitSentences(ctx, sentences, colW, avail, o = {}) {
  const s0 = o.size ?? 24;
  const sMin = o.minSize ?? 16;
  const condense = o.condense || [];
  const omit = o.omit || [];
  const maxL = Math.max(3, o.maxLines ?? 3);
  const nDrawn = sentences.filter((_, i) => !omit.includes(i)).length;
  // (an omitted run after the last row keeps a short band for its ellipsis)
  const tail = omit.includes(sentences.length - 1) ? OMIT_TAIL : 0;
  // the largest size that fits with ≤2 lines per sentence, with ≤3 lines and (when allowed) with ≤4;
  // fewer lines win unless they cost more than 15% of the size. Condensed sentences (context the user
  // did not ask for) are drawn as one simulated bar, so their own truncation never shrinks the page;
  // omitted ones (an excerpt of the page) take no row at all.
  let two = null, three = null, any = null, last = null;
  for (let size = s0; size >= sMin - 1e-9; size -= 0.5) {
    const fits = sentences.map((s, i) => ctx.fit(s, {maxWidth: colW, size, minSize: size, maxLines: condense.includes(i) || omit.includes(i) ? 1 : maxL, weight: 500, family: 'serif', leading: 1.22}));
    const gap = o.rowGap ?? Math.max(10, size * 0.5);
    const total = fits.reduce((a, f, i) => a + (omit.includes(i) ? 0 : rowHeight(f, size, condense.includes(i))), 0) + gap * Math.max(0, nDrawn - 1) + tail;
    const live = fits.filter((f, i) => !condense.includes(i) && !omit.includes(i));
    const maxLines = live.length ? Math.max(...live.map(f => f.lines.length)) : 1;
    const truncated = live.some(f => f.truncated);
    last = {fits, size, gap, total};
    if (total <= avail && !truncated) {
      if (!any) any = last;
      if (!three && maxLines <= 3) three = last;
      if (maxLines <= 2) { two = last; break; }
    }
  }
  const order = [two, three, any].filter(Boolean);
  const pick = order.find((c, k) => order.slice(k + 1).every(d => c.size >= d.size * 0.85)) || last;
  // balanced line breaks (same line count, same height): no numeral alone on a line
  return {...pick, fits: pick.fits.map((f, i) => (condense.includes(i) || omit.includes(i) ? f : balanceFit(ctx, f, colW)))};
}

/**
 * Lay out the text of a source page inside `page` (header + numbered
 * sentences). Shared by the open book and the loose sheet.
 * @returns {{parts:any[], sentences:any[], size:number, lineHeight:number, bandFrame:Function, colX:number, colW:number}}
 */
function pageText(ctx, o, page) {
  const th = ctx.theme;
  const P = o.prefix;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const parts = [];
  const padL = o.padL ?? 62, padR = o.padR ?? 26, padT = o.padT ?? 20;
  const colX = page.x + padL;
  const colW = page.w - padL - padR;
  let y = page.y + padT;
  // header row: volume · date on the left, page reference on the right; then the title
  const idSize = o.idSize ?? 19;
  let prW = 0;
  if (o.pageRef) {
    const pf = ctx.fit(o.pageRef, {maxWidth: (page.w - 44) * 0.35, size: idSize, minSize: 13, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textOrBars(ctx, pf, {x: page.x + page.w - (o.headerPadR ?? padR), y, anchor: 'end', fill: th.inkSoft, show: showAll, name: `${P}-pageref`}));
    prW = pf.width + 16;
  }
  const idText = [o.volume, o.date].filter(Boolean).join(' · ');
  const idW = page.w - 22 - (o.headerPadR ?? padR) - prW;
  // volume · date on one line; when that would shrink it below ~15 units it breaks between the two
  // (never inside "Day 7 (filed)") rather than being cut
  let idFit = ctx.fit(idText, {maxWidth: idW, size: idSize, minSize: Math.min(idSize, 15), maxLines: 1, weight: 600, family: 'mono'});
  if (idFit.truncated) idFit = (o.idWrap !== false && fitSegments(ctx, idText, {maxWidth: idW, size: idSize, minSize: Math.min(idSize, 14), weight: 600, family: 'mono'})) || ctx.fit(idText, {maxWidth: idW, size: idSize, minSize: 12, maxLines: 1, weight: 600, family: 'mono'});
  parts.push(textOrBars(ctx, idFit, {x: page.x + 22, y, fill: th.inkSoft, show: showAll, name: `${P}-vol`}));
  y += idFit.lines.length > 1 ? idFit.height + idSize * 0.55 : idSize * 1.55;
  // (noTitle: a compact header — volume · date · page only — where the height is needed for the text)
  if (!o.noTitle) {
    const tf = ctx.fit(o.title || '', {maxWidth: page.w - 44, size: o.titleSize ?? 29, minSize: 18, maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textOrBars(ctx, tf, {x: page.x + 22, y, fill: th.ink, show: showAll, name: `${P}-title`, barOpacity: 0.75}));
    y += tf.height + 12;
  } else y -= idSize * 0.4;
  parts.push(h('line', {x1: page.x + 22, x2: page.x + page.w - padR, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 2}));
  y += o.ruleGap ?? 22;
  // (an omitted run before the first row: a short band under the header rule for its ellipsis)
  const headBand = (o.omit || []).includes(0) ? OMIT_HEAD : 0;
  y += headBand;

  const avail = page.y + page.h - 18 - (o.reserveBottom ?? 0) - y;
  const condense = o.condense || [];
  // (omit: sentences nobody asked for are left out — the page is shown as an excerpt; each omitted run
  // is marked by an ellipsis in the gap where it was, so it takes no height of its own)
  const omit = o.omit || [];
  // the text keeps clear of the right end of its strip, where a flag's translucent adhesive part
  // lies (on the page and on a copy filed on a card): no word — and no highlight band — runs under
  // or up against a flag (≥ 12 units of paper between the band's end and the adhesive part)
  const textW = colW - (o.textGap ?? 20);
  const {fits, size} = fitSentences(ctx, o.sentences, textW, avail, {size: o.size ?? 24, minSize: o.minSize ?? 16, condense, omit, maxLines: o.maxLines, rowGap: o.rowGap});
  const heights = fits.map((f, i) => (omit.includes(i) ? 0 : rowHeight(f, size, condense.includes(i))));
  const tail = omit.includes(fits.length - 1) ? OMIT_TAIL : 0;
  const sum = heights.reduce((a, b) => a + b, 0) + tail;
  const nDrawn = fits.filter((_, i) => !omit.includes(i)).length;
  const gap = nDrawn > 1 ? clamp((avail - sum) / (nDrawn - 1), o.rowGap ?? Math.max(10, size * 0.5), size * 2.2) : 0;
  const lh = fits[0].lineHeight;
  const sentences = [];
  const bandNodes = [];
  const textNodes = [];
  const ruleGap = o.ruleGap ?? 22;
  let sy = y;
  let trailMark = null;
  fits.forEach((f, i) => {
    if (omit.includes(i)) {
      // an omitted run: an ellipsis (three dots in the ¶ column, a dotted rule across the text column)
      // in the middle of the gap it leaves — under the header rule, between two rows or under the last row
      const drawnBefore = sentences.some(q => !q.omitted);
      const drawnAfter = fits.some((_, j) => j > i && !omit.includes(j));
      // (between two rows: mid-gap; before the first row: under the header rule; after the last row: in
      // the band kept for it)
      const my = !drawnBefore ? y - (ruleGap + headBand) / 2 : drawnAfter ? sy - gap / 2 : sy - gap + OMIT_TAIL / 2 + 1;
      const cx = page.x + padL * 0.5 - 2;
      if (i === 0 || !omit.includes(i - 1)) {
        textNodes.push(g({name: `${P}-omit-${i}`},
          [-9, 0, 9].map(dx => h('circle', {cx: r(cx + dx), cy: r(my), r: 2.6, fill: th.inkSoft})),
          h('line', {x1: r(colX), x2: r(colX + colW * 0.5), y1: r(my), y2: r(my), stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round', opacity: 0.7})));
        if (drawnBefore) trailMark = my;
      }
      sentences.push({i, fit: f, lines: [], strip: {x: colX - 11, y: my - 8, w: colW + 22, h: 16}, numC: {x: cx, y: my}, notch: {x: page.x + page.w, y: my}, textY: my, textX: colX, blockH: 0, colors: [], omitted: true});
      return;
    }
    const bh = heights[i];
    const lines = f.lines.map((line, j) => {
      const lw = ctx.measure(line, f.size, f.weight, f.family);
      return {x: colX - 5, y: sy + j * lh - size * 0.08, w: lw + 10, h: size * 1.16};
    });
    const strip = {x: colX - 11, y: sy - 9, w: colW + 22, h: bh + 16};
    const numC = {x: page.x + padL * 0.5 - 2, y: sy + (condense.includes(i) ? thinRow(size) / 2 : size * 0.52)};
    const colors = (o.bandColors && o.bandColors[i]) || null;
    const list = Array.isArray(colors) ? colors : colors ? [colors] : [];
    list.forEach((color, c) => {
      lines.forEach((ln, j) => bandNodes.push(h('rect', {name: `${P}-band-${i}-${c}-${j}`, x: r(ln.x + ln.w), y: r(ln.y), width: 0, height: r(ln.h), rx: 4, fill: color, opacity: 0.4})));
    });
    textNodes.push(h('circle', {cx: r(numC.x), cy: r(numC.y), r: 15, fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.6}));
    if (showKey) textNodes.push(h('text', {x: r(numC.x), y: r(numC.y + 6.5), 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, 'font-family': SANS, fill: th.inkSoft}, String(i + 1)));
    else textNodes.push(h('rect', {x: r(numC.x - 4), y: r(numC.y - 4), width: 8, height: 8, rx: 2, fill: th.inkSoft, opacity: 0.6}));
    if (condense.includes(i)) {
      // condensed context line: a simulated text bar (full sentence kept as an accessible title)
      textNodes.push(g({name: `${P}-s-${i}`}, h('title', null, o.sentences[i]),
        h('rect', {x: r(colX), y: r(numC.y - f.size * 0.275), width: r(colW * 0.86), height: r(f.size * 0.55), rx: r(f.size * 0.2), fill: th.paperLine}),
        h('rect', {x: r(colX), y: r(numC.y - f.size * 0.275), width: r(colW * 0.86), height: r(f.size * 0.55), rx: r(f.size * 0.2), fill: 'none', stroke: th.inkSoft, 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.6})));
    } else textNodes.push(textOrBars(ctx, f, {x: colX, y: sy, fill: th.ink, show: showAll, name: `${P}-s-${i}`, barOpacity: 0.5}));
    const notch = {x: page.x + page.w, y: strip.y + strip.h / 2};
    list.forEach((color, c) => bandNodes.push(h('path', {name: `${P}-notch-${i}-${c}`, d: `M${r(notch.x - 4)} ${r(notch.y - 13 + c * 8)}h14q5 0 5 5v16q0 5 -5 5h-14Z`, fill: color, stroke: th.ink, 'stroke-width': 1.8, opacity: 0})));
    sentences.push({i, fit: f, lines, strip, numC, notch, textY: sy, textX: colX, blockH: bh, colors: list});
    sy += bh + gap;
  });
  parts.push(g({name: `${P}-bands`}, bandNodes));
  parts.push(g(null, textNodes));

  /** Band grow (0..1, right → left from the flag) and notch visibility for sentence i, colour slot c. */
  const bandFrame = (i, p, notch = 0, c = 0) => {
    const s = sentences[i];
    if (!s || !s.colors[c]) return {};
    const out = {};
    s.lines.forEach((ln, j) => {
      const wv = ln.w * clamp(p);
      out[`${P}-band-${i}-${c}-${j}`] = {x: r(ln.x + ln.w - wv), width: r(wv)};
    });
    out[`${P}-notch-${i}-${c}`] = {opacity: notch ? 1 : 0};
    return out;
  };
  const last = [...sentences].reverse().find(q => !q.omitted);
  const textBottom = Math.max(last ? last.strip.y + last.strip.h : y, trailMark !== null ? trailMark + 6 : -Infinity);
  const overflow = Math.max(0, textBottom - (page.y + page.h - 10 - (o.reserveBottom ?? 0)));
  return {parts, sentences, size, lineHeight: lh, bandFrame, colX, colW, headerBottom: y - ruleGap - headBand, textBottom, overflow, omitted: omit.length > 0};
}

/**
 * Open volume standing on a reading stand. Local origin = top-left of the
 * book block. The right page carries the header and the numbered sentences.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, leftW?:number, cover:string, volume:string, title:string, pageRef?:string, date?:string,
 *          sentences:string[], bandColors?:Array<string|string[]|null>, size?:number, minSize?:number, stand?:boolean}} o
 */
export function openBook(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const lip = 9;
  const leftW = o.leftW ?? Math.round(w * 0.14);
  const gutter = lip + leftW;
  const page = {x: gutter, y: lip, w: w - lip - gutter, h: hh - lip * 2};
  const parts = [];
  const standH = o.stand === false ? 0 : (o.standH ?? 42);
  if (standH) {
    const legs = `M${r(w * 0.22)} ${hh - 6}L${r(w * 0.14)} ${hh + standH}M${r(w * 0.78)} ${hh - 6}L${r(w * 0.86)} ${hh + standH}`;
    parts.push(h('path', {d: legs, stroke: th.woodDark, 'stroke-width': 12, 'stroke-linecap': 'round'}));
    parts.push(h('path', {d: legs, stroke: th.ink, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6}));
    parts.push(h('rect', {x: w * 0.1, y: hh + standH - 6, width: w * 0.8, height: 10, rx: 5, fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}));
  }
  parts.push(h('path', {d: roundRectPath(8, 14, w, hh, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: o.cover, stroke: th.ink, 'stroke-width': th.stroke}));
  // left page (partial, simulated text) with a ribbon marker
  parts.push(h('path', {d: `M${lip} ${lip + 6}Q${r(lip + leftW * 0.5)} ${lip - 4} ${gutter} ${lip + 8}V${hh - lip}H${lip}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}));
  const lb = Math.floor((page.h - 60) / 34);
  for (let i = 0; i < lb; i++) {
    const lw = (leftW - 30) * (0.6 + ctx.rng(`${P}-lp`, i) * 0.4);
    if (lw > 8) parts.push(h('rect', {x: r(gutter - 12 - lw), y: r(lip + 40 + i * 34), width: r(lw), height: 6, rx: 3, fill: th.paperLine, opacity: 0.8}));
  }
  parts.push(h('path', {d: `M${gutter - 6} ${hh - lip}v${Math.min(70, hh * 0.1)}l-9 -10l-9 10v${-Math.min(70, hh * 0.1)}Z`, fill: th.accent, stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}));
  // right page
  parts.push(h('path', {d: `M${gutter} ${lip + 8}Q${r(gutter + page.w * 0.2)} ${lip - 3} ${r(gutter + page.w * 0.5)} ${lip}H${r(page.x + page.w - 6)}Q${page.x + page.w} ${lip} ${page.x + page.w} ${lip + 6}V${hh - lip - 4}Q${page.x + page.w} ${hh - lip} ${r(page.x + page.w - 6)} ${hh - lip}H${gutter}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}));
  for (let k = 0; k < 4; k++) parts.push(h('rect', {x: gutter + k * 5, y: lip + 8, width: 5, height: page.h - 10, fill: '#000', opacity: 0.07 - k * 0.015}));
  parts.push(h('line', {x1: gutter, x2: gutter, y1: lip + 8, y2: hh - lip, stroke: th.ink, 'stroke-width': 2}));
  const txt = pageText(ctx, o, page);
  parts.push(...txt.parts);
  return {node: g({name: P}, parts), w, h: hh + standH, bookH: hh, page, standH, ...txt};
}

/**
 * The same source page as a loose sheet (mechanism view). Local origin =
 * top-left of the sheet.
 */
export function sourceSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const fold = 34;
  const parts = [
    h('path', {d: roundRectPath(8, 12, w, hh, 6), fill: th.shadow}),
    h('path', {d: `M0 4Q0 0 4 0H${w - fold}L${w} ${fold}V${hh - 4}Q${w} ${hh} ${w - 4} ${hh}H4Q0 ${hh} 0 ${hh - 4}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${w - fold} 0V${fold * 0.85}Q${w - fold} ${fold} ${w - fold * 0.85} ${fold}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
  ];
  const page = {x: 0, y: 0, w, h: hh};
  // the header keeps clear of the folded corner
  const txt = pageText(ctx, {...o, padR: o.padR ?? 30, headerPadR: fold + 12}, page);
  parts.push(...txt.parts);
  return {node: g({name: o.prefix}, parts), w, h: hh, page, ...txt};
}

/* ------------------------------------------------------------------------ */
/* Flag marker, fact strip, annotation note, pointer                         */
/* ------------------------------------------------------------------------ */

/**
 * Index-flag geometry: origin = stick point (left-middle of the adhesive part).
 * `inset`: how far the adhesive part overlaps the right end of what it marks
 * (a sentence strip or a note) — the rest of the flag hangs in the margin and
 * beyond the edge, like a real index tab, so it never hides the text.
 */
export const FLAG = {w: 118, h: 46, stick: 46, inset: 14};

/**
 * Adhesive index flag. The translucent adhesive part lies over what it
 * marks; the tab carries the pinpoint. Local origin = stick point.
 * @param {any} ctx
 * @param {{name:string, color:string, tabInk:string, pins?:Array<{key:string,text:string}>, dashed?:boolean}} o
 */
export function flagMarker(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, stick} = FLAG;
  const t = -hh / 2, b = hh / 2;
  const pins = (o.pins || []).filter(p => p && p.text);
  const pinNodes = ctx.show('key') ? pins.map(p => {
    const f = ctx.fit(p.text, {maxWidth: w - stick - 14, size: 23, minSize: 12, maxLines: 1, weight: 800});
    return textBlock(f, {x: stick + (w - stick) / 2 - 2, y: -f.size * 0.5, anchor: 'middle', fill: o.tabInk, name: `${o.name}-pin-${p.key}`, opacity: 0});
  }) : [];
  // with labels hidden the tab carries notches (one per pinpointed sentence) instead of text
  const dotNodes = !ctx.show('key') ? pins.map(p => g({name: `${o.name}-pin-${p.key}`, opacity: 0},
    (p.count ? Array.from({length: p.count}, (_, i) => i) : [0]).map(i => h('circle', {cx: stick + (w - stick) / 2 - 2 + (i - ((p.count || 1) - 1) / 2) * 16, cy: 0, r: 5, fill: o.tabInk})))) : [];
  const node = g({name: o.name},
    h('path', {name: `${o.name}-shadow`, d: roundRectPath(stick + 2, t + 6, w - stick + 4, hh, 9), fill: th.shadow}),
    h('path', {d: `M0 ${t}H${stick}V${b}H0Z`, fill: o.color, 'fill-opacity': 0.38, stroke: o.color, 'stroke-width': 2.2}),
    h('path', {d: `M${stick} ${t}H${w - 12}Q${w} ${t} ${w} ${t + 12}V${b - 12}Q${w} ${b} ${w - 12} ${b}H${stick}Z`, fill: o.color, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('line', {x1: stick, x2: stick, y1: t, y2: b, stroke: th.ink, 'stroke-width': 2.2}),
    h('rect', {x: stick + 7, y: t + 5, width: w - stick - 22, height: 5, rx: 2.5, fill: '#ffffff', opacity: 0.35}),
    pinNodes, dotNodes,
  );
  return {node, pinKeys: pins.map(p => p.key)};
}

/**
 * Copy slip of one sentence (same fit, same size, same place on the page).
 * Local origin = its GRIP (where the flag sticks: right edge − adhesive
 * width, vertical middle), so scale/tilt keep it attached to the flag.
 * @param {any} ctx
 * @param {{name:string, sentence:any, color:string, dashed?:boolean}} o
 */
export function factStrip(ctx, o) {
  const th = ctx.theme;
  const s = o.sentence;
  const {w, h: hh} = s.strip;
  const grip = {x: w - FLAG.inset, y: hh / 2};
  const ox = s.textX - s.strip.x, oy = s.textY - s.strip.y;
  const zig = [];
  const n = Math.max(4, Math.round(hh / 10));
  for (let k = 0; k <= n; k++) zig.push(`${k % 2 ? 5 : 0} ${r((hh * k) / n)}`);
  const body = `M${zig.join('L')}H${w - 4}Q${w} ${hh} ${w} ${hh - 4}V4Q${w} 0 ${w - 4} 0Z`;
  const lines = s.lines.map(ln => h('rect', {x: r(ln.x - s.strip.x), y: r(ln.y - s.strip.y), width: r(ln.w), height: r(ln.h), rx: 4, fill: o.color, opacity: 0.4}));
  const paper = g({transform: T(-grip.x, -grip.y)},
    h('path', {name: `${o.name}-shadow`, d: body, fill: th.shadow}),
    h('path', {d: body, fill: th.paper, stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    lines,
    textOrBars(ctx, s.fit, {x: ox, y: oy, fill: th.ink, show: ctx.show('all'), barOpacity: 0.5}),
  );
  if (!o.roll) return {node: g({name: o.name, opacity: 0}, paper), w, h: hh, grip};
  // rolled copy: the strip can roll up toward its grip (only a small paper roll is left beside the
  // flag) and unroll again; the roll sits at the visible part's left edge
  const rollW = 24;
  const clipId = `${o.name}-clip`;
  const node = g({name: o.name, opacity: 0},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${o.name}-reveal`, x: r(-grip.x - 14), y: r(-hh / 2 - 22), width: r(w + 40), height: r(hh + 44)}))),
    g({'clip-path': ctx.ref(clipId)}, paper),
    g({name: `${o.name}-roll`, opacity: 0},
      h('path', {d: roundRectPath(-rollW / 2, -hh / 2 - 3, rollW, hh + 6, 10), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${-rollW / 2 + 7} ${r(-hh / 2 + 6)}q-5 ${r(hh / 2 - 6)} 0 ${r(hh - 12)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.6}),
      h('rect', {x: -rollW / 2 + 11, y: r(-hh / 2 + 4), width: 7, height: r(hh - 8), rx: 3.5, fill: o.color, opacity: 0.45})),
  );
  /** Visible fraction f of the strip (1 = flat, 0 = rolled up at the grip). */
  const rollFrame = f => {
    const ff = clamp(f);
    const left = -grip.x + (1 - ff) * (grip.x - rollW / 2);
    return {
      [`${o.name}-reveal`]: {x: r(ff >= 1 ? -grip.x - 14 : left), width: r((ff >= 1 ? grip.x + 14 : -left) + FLAG.inset + 26)},
      [`${o.name}-roll`]: {opacity: ff < 0.995 ? 1 : 0, transform: T(left, 0)},
    };
  };
  return {node, w, h: hh, grip, rollFrame};
}

/**
 * Handwritten annotation note (for a fact that is not written on the page).
 * Local origin = top-left. Text is revealed by `write` (0..1) through a clip.
 * @param {any} ctx
 * @param {{name:string, text:string, w:number, color:string, size?:number, minH?:number, tag?:string}} o
 */
export function noteSlip(ctx, o) {
  const th = ctx.theme;
  const size = o.size ?? 24;
  const padX = 18, padY = o.padY ?? 12;
  const f = fitBalanced(ctx, o.text, {maxWidth: o.w - padX * 2 - FLAG.inset - 8, size, minSize: o.minSize ?? size * 0.72, maxLines: o.maxLines ?? 3, weight: 500, family: 'serif', leading: 1.22});
  const hh = Math.max(o.minH ?? 0, f.height + size * 0.25 + padY * 2);
  const w = o.w;
  const clipId = `${o.name}-clip`;
  const show = ctx.show('all');
  const ink = noteInk(ctx);
  const lineRects = f.lines.map((line, j) => ({x: padX, y: padY + j * f.lineHeight - size * 0.1, w: ctx.measure(line, f.size, f.weight, f.family), h: f.size * 1.25}));
  const node = g({name: o.name, opacity: 0},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, lineRects.map((lr, j) => h('rect', {name: `${o.name}-reveal-${j}`, x: r(lr.x - 4), y: r(lr.y), width: 0, height: r(lr.h)})))),
    h('path', {d: roundRectPath(4, 6, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: '#fffbe9', stroke: o.color, 'stroke-width': 3, 'stroke-dasharray': '10 7'}),
    g({'clip-path': ctx.ref(clipId)}, textOrBars(ctx, f, {x: padX, y: padY, fill: ink, show, italic: true, barOpacity: 0.45})),
  );
  const lens = lineRects.map(lr => lr.w);
  // writing path: each line left → right, then a lifted return stroke to the next line's start
  // (so the pen tip never jumps between lines)
  const segs = [];
  lineRects.forEach((lr, j) => {
    const y = lr.y + lr.h * 0.72;
    segs.push({kind: 'line', j, a: {x: lr.x, y}, b: {x: lr.x + lens[j], y}, len: Math.max(1, lens[j])});
    const nx = lineRects[j + 1];
    if (nx) {
      const b = {x: nx.x, y: nx.y + nx.h * 0.72};
      segs.push({kind: 'return', j, a: {x: lr.x + lens[j], y}, b, len: Math.hypot(b.x - lr.x - lens[j], b.y - y) * 0.35});
    }
  });
  const total = segs.reduce((a, sg) => a + sg.len, 0) || 1;
  const locate = p => {
    let d = clamp(p) * total;
    for (let i = 0; i < segs.length; i++) {
      const sg = segs[i];
      if (d <= sg.len || i === segs.length - 1) return {sg, k: clamp(d / sg.len), i};
      d -= sg.len;
    }
    return {sg: segs[0], k: 0, i: 0};
  };
  /** pen tip position for writing progress p (local coords) */
  const tipAt = p => {
    const {sg, k} = locate(p);
    return {x: sg.a.x + (sg.b.x - sg.a.x) * k, y: sg.a.y + (sg.b.y - sg.a.y) * k - (sg.kind === 'return' ? Math.sin(Math.PI * k) * 10 : 0), line: sg.j};
  };
  const writeFrame = p => {
    const out = {};
    const {sg, k, i} = locate(p);
    lineRects.forEach((lr, j) => {
      let wv = 0;
      if (p > 0) {
        if (j < sg.j || (j === sg.j && sg.kind === 'return')) wv = lens[j];
        else if (j === sg.j) wv = lens[j] * k;
      }
      if (clamp(p) >= 1) wv = lens[j];
      out[`${o.name}-reveal-${j}`] = {width: r(wv + (wv > 0 ? 6 : 0))};
    });
    void i;
    return out;
  };
  return {node, w, h: hh, fit: f, grip: {x: w - FLAG.inset, y: hh / 2}, tipAt, writeFrame};
}

/** The user's pointer (arrow cursor). Local origin = tip. */
export function pointer(ctx, {name, scale = 1}) {
  const th = ctx.theme;
  const d = 'M0 0L0 46L11 35L19 54L28 50L20 32L36 32Z';
  return g({name},
    g({transform: `scale(${scale})`},
      h('path', {d, fill: th.shadow, transform: 'translate(4 6)'}),
      h('path', {d, fill: '#ffffff', stroke: th.ink, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    ),
  );
}

/* ------------------------------------------------------------------------ */
/* Search box (request panel) and fact card                                  */
/* ------------------------------------------------------------------------ */

/** Small glyph telling how a request is filed: quote marks or a pencil note. */
export function requestIcon(ctx, kind, x, y, color, name, opacity) {
  const th = ctx.theme;
  if (kind === 'quote') {
    return g({name, transform: T(x, y), opacity},
      h('circle', {r: 17, fill: th.paper, stroke: color, 'stroke-width': 2.4}),
      h('path', {d: 'M-8 4q0 -9 6 -11M3 4q0 -9 6 -11', fill: 'none', stroke: th.ink, 'stroke-width': 3.2, 'stroke-linecap': 'round'}),
      h('circle', {cx: -5, cy: 4, r: 3.4, fill: th.ink}), h('circle', {cx: 6, cy: 4, r: 3.4, fill: th.ink}));
  }
  return g({name, transform: T(x, y), opacity},
    h('circle', {r: 17, fill: th.paper, stroke: color, 'stroke-width': 2.4, 'stroke-dasharray': '5 3'}),
    h('path', {d: 'M-8 8l3 -9l11 -11l6 6l-11 11z', fill: th.accent3, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-8 8l3 -9l6 6z', fill: '#f1d7b0', stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}));
}

/**
 * Search box listing the requested facts. Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, title:string, placeholder?:string, requests:Array<{label:string,color:string,icon?:'quote'|'note'|null}>,
 *          parkSide:'left'|'right', typing?:boolean, rowMin?:number, labelSize?:number, button?:boolean, footer?:string, iconsLate?:boolean}} o
 */
export function requestPanel(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w;
  const showKey = ctx.show('key');
  // owner pill (the actor's name: a key label, ≥ ownerSize·0.85, wrapping to two lines before
  // shrinking further) is sized first, then the title takes the rest of the bar
  const os = o.ownerSize ?? 23;
  const ownerMax = Math.max(120, w * (o.ownerMaxFrac ?? 0.36));
  let ownerFit = o.owner ? ctx.fit(o.owner, {maxWidth: ownerMax, size: os, minSize: os * 0.85, maxLines: 1, weight: 700}) : null;
  if (ownerFit && ownerFit.truncated) ownerFit = ctx.fit(o.owner, {maxWidth: ownerMax, size: os * 0.9, minSize: os * 0.78, maxLines: 2, weight: 700});
  const ownerW = ownerFit ? ownerFit.width + 44 : 0;
  const ownerH = ownerFit ? ownerFit.height + 12 : 0;
  // (balanced: a wrapped title never leaves one word alone on its second line)
  const tf = fitBalanced(ctx, o.title || '', {maxWidth: w - 76 - (ownerW ? ownerW + 64 : 0), size: o.titleSize ?? 25, minSize: Math.min(17, o.titleSize ?? 25), maxLines: 2, weight: 700});
  const titleH = Math.max(o.titleMin ?? 50, tf.height + (o.titlePad ?? 22), ownerH + 16);
  const fieldH = o.fieldH ?? 52;
  const parts = [];
  let y = titleH + 14;
  // compact: one-row request box without the search field (the request itself is typed in the row)
  const field = o.compact ? null : {x: 16, y, w: w - 32, h: fieldH};
  if (field) y += fieldH + 12;
  else y = titleH + 4;
  const left = o.parkSide === 'left';
  const size = o.labelSize ?? 26;
  const rows = o.requests.map((rq, i) => {
    const labelX0 = left ? FLAG.w + 30 : 26;
    // compact rows: the request keeps clear of the right end of the input pill it is typed into
    const labelX1 = o.compact ? (left ? w - 58 : w - FLAG.stick - 14) - 20 : left ? w - 58 : w - FLAG.stick - 58;
    const lo = {maxWidth: labelX1 - labelX0 - (rq.icon ? 42 : 0), size, minSize: size * (o.labelMinFrac ?? 0.8), maxLines: 2, weight: 600};
    // (`labelOneLine`: one line at ≥ labelMinFrac of the size is preferred to two lines)
    const one = o.labelOneLine ? ctx.fit(rq.label || ' ', {...lo, maxLines: 1}) : null;
    let f = one && !one.truncated ? one : fitBalanced(ctx, rq.label || ' ', lo);
    // (a request is key content: a third line before it is ever cut, when the scene allows it)
    if (f.truncated && (o.labelMaxLines ?? 2) > 2) f = fitBalanced(ctx, rq.label || ' ', {...lo, maxLines: o.labelMaxLines});
    const rh = Math.max(o.rowMin ?? 64, f.height + 30);
    const row = {i, x: 0, y, w, h: rh, fit: f, labelX: labelX0 + (rq.icon ? 42 : 0), iconX: labelX0 + 16, cy: y + rh / 2};
    row.park = left ? {x: 18, y: row.cy} : {x: w - FLAG.stick, y: row.cy};
    row.check = {x: w - 32, y: row.cy};
    y += rh;
    return row;
  });
  let footer = null;
  // without the search field (compact) the Extract button sits at the right end of the footer row
  const btnR = fieldH * 0.4;
  const footBtn = o.button && !field && o.footer;
  if (o.footer) {
    // the footer names the index flags (an actor label): large, wrapping to two lines before shrinking
    const fs = o.footerSize ?? 23;
    const fmw = w - 40 - o.requests.length * 16 - 32 - (footBtn ? btnR * 2 + 20 : 0);
    let ff = ctx.fit(o.footer, {maxWidth: fmw, size: fs, minSize: fs * 0.9, maxLines: 1, weight: 600});
    if (ff.truncated) ff = ctx.fit(o.footer, {maxWidth: fmw, size: fs * 0.95, minSize: fs * 0.8, maxLines: 2, weight: 600});
    const fh = Math.max(34, ff.height + 12, footBtn ? btnR * 2 + 10 : 0);
    footer = {y: y + 8, fit: ff, h: fh};
    y += 8 + fh;
  }
  const hh = y + 14;
  parts.push(h('path', {d: roundRectPath(8, 12, w, hh, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 16), fill: th.card, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('path', {d: `M0 16Q0 0 16 0H${w - 16}Q${w} 0 ${w} 16V${titleH}H0Z`, fill: th.ink}));
  parts.push(g({transform: T(28, titleH / 2)}, h('circle', {r: 10, fill: 'none', stroke: '#f4f1ea', 'stroke-width': 3.2}), h('line', {x1: 7, y1: 7, x2: 15, y2: 15, stroke: '#f4f1ea', 'stroke-width': 3.6, 'stroke-linecap': 'round'})));
  // owner pill (the user whose request this is) at the right of the title bar, beside the pointer's rest
  if (ownerFit) {
    const of = ownerFit;
    const ox = w - 58 - ownerW, oh = ownerH, oy = (titleH - oh) / 2;
    const my = oy + oh / 2;
    parts.push(g({name: `${P}-owner`},
      h('path', {d: roundRectPath(ox, oy, ownerW, oh, Math.min(oh / 2, 18)), fill: '#f4f1ea', stroke: '#f4f1ea', 'stroke-width': 1}),
      h('circle', {cx: ox + 16, cy: my - 5, r: 5.5, fill: th.ink}),
      h('path', {d: `M${ox + 7} ${my + 10}q9 -11 18 0z`, fill: th.ink}),
      textOrBars(ctx, of, {x: ox + 32, y: oy + (oh - of.height) / 2, fill: th.ink, show: showKey, name: `${P}-owner-label`})));
  }
  parts.push(textOrBars(ctx, tf, {x: 54, y: (titleH - tf.height) / 2 - 1, fill: '#f4f1ea', show: showKey, name: `${P}-title`}));
  // search field (+ Extract button at its right end, or at the end of the footer row when compact)
  const button = o.button && field ? {x: field.x + field.w - btnR - 6, y: field.y + field.h / 2, r: btnR}
    : footBtn && footer ? {x: w - btnR - 16, y: footer.y + footer.h / 2, r: btnR} : null;
  if (field) {
    parts.push(h('path', {d: roundRectPath(field.x, field.y, field.w, field.h, field.h / 2), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 2}));
    parts.push(g({transform: T(field.x + 28, field.y + field.h / 2)}, h('circle', {r: 9, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.6}), h('line', {x1: 6, y1: 6, x2: 13, y2: 13, stroke: th.inkSoft, 'stroke-width': 3, 'stroke-linecap': 'round'})));
  }
  if (o.placeholder && field) {
    const pf = ctx.fit(o.placeholder, {maxWidth: field.w - 70 - (button ? btnR * 2 + 12 : 0), size: 22, minSize: 14, maxLines: 1, weight: 500});
    parts.push(textOrBars(ctx, pf, {x: field.x + 52, y: field.y + (field.h - pf.size) / 2 - 1, fill: th.inkFaint, show: ctx.show('all'), name: `${P}-placeholder`}));
  }
  if (button) {
    parts.push(g({name: `${P}-button`, transform: T(button.x, button.y)},
      h('circle', {name: `${P}-button-halo`, r: button.r + 9, fill: th.accent, opacity: 0}),
      h('circle', {r: button.r, fill: th.accent, stroke: th.ink, 'stroke-width': 2.2}),
      h('path', {d: `M${r(-button.r * 0.42)} 0H${r(button.r * 0.4)}M${r(button.r * 0.08)} ${r(-button.r * 0.32)}L${r(button.r * 0.42)} 0L${r(button.r * 0.08)} ${r(button.r * 0.32)}`, fill: 'none', stroke: '#fff', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})));
  }
  rows.forEach((row, i) => {
    const rq = o.requests[i];
    if (i > 0) parts.push(h('line', {x1: 16, x2: w - 16, y1: row.y, y2: row.y, stroke: th.paperLine, 'stroke-width': 1.5}));
    if (o.compact) {
      // the row is the input the request is typed into
      const ix = row.iconX - 26, iw = (left ? w - 58 : w - FLAG.stick - 14) - ix;
      parts.push(h('path', {d: roundRectPath(ix, row.y + 7, iw, row.h - 14, (row.h - 14) / 2), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 1.8}));
    }
    // empty slot left when the flag departs
    const sx = row.park.x, sy = row.cy;
    parts.push(h('path', {d: roundRectPath(sx - 2, sy - FLAG.h / 2 - 2, (left ? FLAG.w : FLAG.stick) + 4, FLAG.h + 4, 8), fill: 'none', stroke: rq.color, 'stroke-width': 2, 'stroke-dasharray': '6 5', opacity: 0.8}));
    if (rq.icon) parts.push(requestIcon(ctx, rq.icon, row.iconX, row.cy, rq.color, `${P}-icon-${i}`, o.iconsLate ? 0 : undefined));
    const clipId = `${P}-type-${i}`;
    const labelNode = textOrBars(ctx, row.fit, {x: row.labelX, y: row.cy - row.fit.height / 2 - row.fit.size * 0.02, fill: th.ink, show: showKey, name: `${P}-label-${i}`});
    if (o.typing) {
      const lh = row.fit.lineHeight;
      parts.push(h('defs', null, h('clipPath', {id: ctx.id(clipId)}, row.fit.lines.map((_, j) => h('rect', {name: `${P}-typeclip-${i}-${j}`, x: row.labelX - 4, y: r(row.cy - row.fit.height / 2 - row.fit.size * 0.2 + j * lh), width: 0, height: r(row.fit.size * 1.3)})))));
      parts.push(g({'clip-path': ctx.ref(clipId)}, labelNode));
      parts.push(h('rect', {name: `${P}-caret-${i}`, x: row.labelX, y: r(row.cy - row.fit.size * 0.62), width: 3, height: r(row.fit.size * 1.2), fill: th.ink, opacity: 0}));
    } else parts.push(labelNode);
    parts.push(g({name: `${P}-check-${i}`, opacity: 0, transform: T(row.check.x, row.check.y)},
      h('circle', {r: 17, fill: th.accent4, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: 'M-7 0l5 5l9 -10', fill: 'none', stroke: '#fff', 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})));
  });
  if (footer) {
    parts.push(h('line', {x1: 16, x2: w - 16, y1: footer.y - 4, y2: footer.y - 4, stroke: th.paperLine, 'stroke-width': 1.5}));
    const cy = footer.y + footer.h / 2;
    o.requests.forEach((rq, i) => parts.push(g({transform: T(22 + i * 16, cy - 8 + i * 2)},
      h('rect', {x: 0, y: -8, width: 12, height: 16, fill: rq.color, 'fill-opacity': 0.4, stroke: rq.color, 'stroke-width': 1.5}),
      h('path', {d: roundRectPath(12, -8, 20, 16, 4), fill: rq.color, stroke: th.ink, 'stroke-width': 1.5}))));
    parts.push(textOrBars(ctx, footer.fit, {x: 22 + o.requests.length * 16 + 32, y: cy - footer.fit.height / 2 - 1, fill: th.inkSoft, show: ctx.show('key'), name: `${P}-footer`}));
  }
  /** Typing progress per row (0..1): clip widths + caret. */
  const typeFrame = (i, p) => {
    const row = rows[i];
    if (!o.typing || !row) return {};
    const lens = row.fit.lines.map(l => ctx.measure(l, row.fit.size, row.fit.weight, row.fit.family));
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let d = clamp(p) * total;
    const out = {};
    let caret = {x: row.labelX, j: 0};
    lens.forEach((len, j) => {
      const wv = clamp(d, 0, len);
      out[`${P}-typeclip-${i}-${j}`] = {width: r(wv > 0 ? wv + 8 : 0)};
      if (d > 0) caret = {x: row.labelX + wv + 3, j};
      d -= len;
    });
    const lh = row.fit.lineHeight;
    out[`${P}-caret-${i}`] = {opacity: p > 0 && p < 1 ? 1 : 0, x: r(caret.x), y: r(row.cy - row.fit.height / 2 - row.fit.size * 0.14 + caret.j * lh)};
    return out;
  };
  /** Button press (0..1: down and back up) and halo flash. */
  const pressFrame = p => {
    if (!button) return {};
    const dip = Math.sin(Math.PI * clamp(p));
    return {
      [`${P}-button`]: {transform: T(button.x, button.y, 0, 1 - 0.12 * dip)},
      [`${P}-button-halo`]: {opacity: r(0.35 * dip, 3)},
    };
  };
  return {node: g({name: P}, parts), w, h: hh, rows, field, button, typeFrame, pressFrame, titleH};
}

/**
 * Catalogue index card. Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, title:string, sourceLine:string, slots:Array<{h:number}>, gap?:number, stripX?:number}} o
 */
export function factCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(8, 12, w, hh, 8), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: '#fffaf0', stroke: th.ink, 'stroke-width': th.stroke}));
  // (the title is drawn letter-spaced: the fit leaves room for the extra spacing; with `titleLines: 2` a
  // title that does not fit beside a header tag wraps at its size instead of being cut)
  const tf = ctx.fit(o.title || '', {maxWidth: (o.titleMax ?? w - 56) - 0.6 * String(o.title || '').length, size: o.titleSize ?? 30, minSize: 18, maxLines: o.titleLines ?? 1, weight: 800});
  parts.push(textOrBars(ctx, tf, {x: 26, y: 16, fill: th.ink, show: ctx.show('key'), name: `${P}-title`, letterSpacing: 0.6, barOpacity: 0.7}));
  const titleBox = {x: 26, y: 16, w: tf.width, h: tf.height};
  // `sourceMinY` keeps the source line below a state tag that shares the header with the title
  let y = Math.max(16 + tf.height + 8, o.sourceMinY ?? 0);
  let sourceBox = null;
  if (o.sourceLine) {
    const ss = o.sourceSize ?? 19;
    const smw = o.sourceMax ?? w - 56;
    let sf = ctx.fit(o.sourceLine, {maxWidth: smw, size: ss, minSize: ss * 0.8, maxLines: 1, weight: 600, family: 'mono'});
    // two lines break between the " · " segments (never inside "Day 7 (filed)")
    if (sf.truncated) sf = fitSegments(ctx, o.sourceLine, {maxWidth: smw, size: ss * 0.95, minSize: ss * 0.7, weight: 600, family: 'mono'}) || fitBalanced(ctx, o.sourceLine, {maxWidth: smw, size: ss * 0.9, minSize: ss * 0.7, maxLines: 2, weight: 600, family: 'mono'});
    parts.push(textOrBars(ctx, sf, {x: 26, y, fill: th.inkSoft, show: ctx.show('all'), name: `${P}-source`}));
    sourceBox = {x: 26, y, w: sf.width, h: sf.height};
    y += sf.height + 10;
  }
  parts.push(h('line', {x1: 0, x2: w, y1: y, y2: y, stroke: '#c8553d', 'stroke-width': 3}));
  const top = y + 16;
  // bottom margin under the last slot (punch hole row); `bottomPad` makes it tighter
  const bp = o.bottomPad ?? 44;
  const avail = hh - (bp - 4) - (o.reserve ?? 0) - top;
  const need = o.slots.reduce((a, s) => a + s.h, 0);
  const gap = o.slots.length > 1 ? clamp((avail - need) / (o.slots.length - 1), 6, o.gap ?? 22) : 0;
  const stripX = o.stripX ?? 24;
  let sy = top;
  const slots = o.slots.map(sl => {
    const slot = {x: stripX, y: sy, h: sl.h};
    sy += sl.h + gap;
    return slot;
  });
  const ruleStep = 44;
  for (let ry = top - 4 + ruleStep; ry < hh - 30; ry += ruleStep) parts.push(h('line', {x1: 14, x2: w - 14, y1: ry, y2: ry, stroke: '#b9cfe0', 'stroke-width': 1.6}));
  parts.push(h('circle', {cx: w / 2, cy: hh - Math.min(20, bp / 2), r: bp < 36 ? 7 : 9, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.8}));
  const reserve = o.reserve ?? 0;
  return {node: g({name: P}, parts), w, h: hh, slots, top, bottom: sy - gap, headerBottom: y, titleBox, sourceBox,
    overflow: Math.max(0, sy - gap - (hh - (bp - 10) - reserve)), needH: top + need + (o.gap ?? 22) * Math.max(0, o.slots.length - 1) + bp + reserve};
}

/* ------------------------------------------------------------------------ */
/* Stage                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * The extraction stage: shelf, open book, search box, fact card, one flag
 * (and strip or note) per requested fact, optional pointer and pen.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {{shelf?:any, book:any, panel?:any, card:any, laneX:number, cardSide:'right'|'below'}} o.geo  explicit geometry (design units)
 * @param {{library?:string, volume:string, title:string, sentences:string[]}} o.sources
 * @param {Array<{label:string, mode?:'quote'|'annotate', sentence?:number, basis?:number[], note?:string, icon?:'quote'|'note'|null}>} o.facts  sentence/basis are 0-based
 * @param {{page?:string, pinpoint?:string}} o.citations
 * @param {{source?:string, extracted?:string}} o.dates
 * @param {{library?:string, search?:string, card?:string, markers?:string, placeholder?:string}} o.labels
 */
export function extractionStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = o.geo;
  const pal = factPalette(ctx);
  const cover = coverColor(ctx);
  const facts = o.facts.map((f, i) => ({...f, i, color: f.color || pal[i % pal.length], mode: f.mode || 'quote'}));
  const n = o.sources.sentences.length;

  // --- book (source page); band colours from the facts that mark each sentence
  const bandColors = Array.from({length: n}, () => []);
  const bandSlot = facts.map(() => ({}));
  facts.forEach((f, k) => {
    const idx = f.mode === 'annotate' ? f.basis : [f.sentence];
    idx.forEach(s => {
      if (s >= 0 && s < n) {
        bandSlot[k][s] = bandColors[s].length;
        bandColors[s].push(f.color.band);
      }
    });
  });
  const book = openBook(ctx, {prefix: `${P}-book`, w: G.book.w, h: G.book.h, leftW: G.book.leftW, cover, volume: o.sources.volume, title: o.sources.title,
    pageRef: o.citations.page, date: o.dates.source, sentences: o.sources.sentences, bandColors: bandColors.map(c => (c.length ? c : null)), size: G.book.size ?? 24, minSize: G.book.minSize ?? 16, titleSize: G.book.titleSize, reserveBottom: G.book.reserve, standH: G.book.standH, noTitle: G.book.noTitle, maxLines: G.book.maxLines, padL: G.book.padL, padR: G.book.padR, idWrap: G.book.idWrap, padT: G.book.padT, ruleGap: G.book.ruleGap,
    omit: o.omit || [], rowGap: G.book.rowGap,
    condense: Array.isArray(o.condense) ? o.condense : o.condense ? o.sources.sentences.map((_, i) => i).filter(i => !bandColors[i].length) : []});
  const BX = G.book.x, BY = G.book.y;
  const toStage = q => ({x: BX + q.x, y: BY + q.y});

  // --- search box
  const panel = G.panel ? requestPanel(ctx, {prefix: `${P}-panel`, w: G.panel.w, title: o.labels.search, placeholder: o.labels.placeholder,
    requests: facts.map(f => ({label: f.label, color: f.color.flag, icon: f.icon ?? null})), parkSide: G.panel.parkSide, typing: o.typing, labelSize: G.panel.labelSize ?? 26,
    rowMin: G.panel.rowMin, fieldH: G.panel.fieldH, titleMin: G.panel.titleMin, titlePad: G.panel.titlePad, titleSize: G.panel.titleSize, compact: G.panel.compact, labelMinFrac: G.panel.labelMinFrac, labelMaxLines: G.panel.labelMaxLines, labelOneLine: G.panel.labelOneLine,
    ownerSize: G.panel.ownerSize, footerSize: G.panel.footerSize, button: Boolean(o.pointer), footer: o.labels.markers, iconsLate: o.iconsLate, owner: o.pointer ? o.labels.user : null}) : null;
  const PX = G.panel ? G.panel.x : 0, PY = G.panel ? G.panel.y : 0;

  // --- shelf
  const shelfBox = G.shelf ? {...G.shelf, h: G.shelf.h === 'panel' ? panel.h : G.shelf.h} : null;
  const shelf = shelfBox ? libraryShelf(ctx, {prefix: `${P}-shelf`, w: shelfBox.w, h: shelfBox.h, rows: shelfBox.rows, label: o.labels.library, cover, gapRow: shelfBox.gapRow, gapAt: shelfBox.gapAt, seedKey: `${P}-shelf`, plate: shelfBox.plate, plateSize: shelfBox.plateSize, plateW: shelfBox.plateW}) : null;

  // --- strips / notes, card slots
  const items = facts.map(f => {
    if (f.mode === 'annotate') return {kind: 'note', f};
    const s = book.sentences[f.sentence];
    // two copies of the same strip: one in the resting layer (on the page / on the card) and one in
    // the moving layer (above every resting flag and strip) shown only while it is carried
    const strip = factStrip(ctx, {name: `${P}-strip-${f.i}`, sentence: s, color: f.color.band, roll: o.rollCopies});
    const stripM = factStrip(ctx, {name: `${P}-stripm-${f.i}`, sentence: s, color: f.color.band, roll: o.rollCopies});
    return {kind: 'strip', f, s, strip, stripM};
  });
  const stripW = book.sentences[0].strip.w;
  items.forEach(it => {
    if (it.kind === 'note') it.note = noteSlip(ctx, {name: `${P}-note-${it.f.i}`, text: it.f.note || '', w: stripW, color: it.f.color.flag, size: book.size, minSize: o.noteMinSize, maxLines: o.noteMaxLines, padY: G.card.notePadY});
  });
  const card = factCard(ctx, {prefix: `${P}-card`, w: G.card.w, h: G.card.h, title: o.labels.card, titleSize: G.card.titleSize, titleMax: G.card.titleMax, titleLines: G.card.titleLines, sourceMinY: G.card.sourceMinY, sourceSize: G.card.sourceSize,
    sourceLine: G.card.noSource ? '' : [o.sources.volume, o.citations.page, o.dates.source, o.dates.extracted ? `→ ${o.dates.extracted}` : ''].filter(Boolean).join(' · '),
    slots: items.map(it => ({h: it.kind === 'strip' ? it.strip.h : it.note.h})), gap: G.card.gap ?? 20, stripX: G.card.stripX ?? 22, reserve: G.card.reserve ?? 0, bottomPad: G.card.bottomPad});
  const CX = G.card.x, CY = G.card.y;

  // --- flags
  const flags = facts.map((f, k) => {
    const pins = f.mode === 'annotate'
      ? [{key: 'a', text: pinsText(o.citations, f.basis), count: f.basis.length}]
      : [{key: 'a', text: pinText(o.citations, f.sentence), count: 1}];
    return flagMarker(ctx, {name: `${P}-flag-${k}`, color: f.color.flag, tabInk: f.color.tabInk, pins});
  });
  // moving-layer copies (a flag in flight is always drawn above resting flags and strips)
  const flagsM = facts.map((f, k) => {
    const pins = f.mode === 'annotate'
      ? [{key: 'a', text: pinsText(o.citations, f.basis), count: f.basis.length}]
      : [{key: 'a', text: pinText(o.citations, f.sentence), count: 1}];
    return flagMarker(ctx, {name: `${P}-flagm-${k}`, color: f.color.flag, tabInk: f.color.tabInk, pins});
  });

  // --- pointer (user) and pen (writes annotation notes)
  // the pointer rests at the right end of the title bar (beside the owner pill) and hops onto the button
  const ptr = o.pointer && panel ? pointer(ctx, {name: `${P}-pointer`, scale: 1.05}) : null;
  const ptrRest = panel ? {x: PX + panel.w - 36, y: PY + 9} : null;
  const ptrBtn = panel && panel.button ? {x: PX + panel.button.x - 2, y: PY + panel.button.y + 3} : null;
  const penItem = o.pen ? pen(ctx, {name: `${P}-pen`, length: o.penLength ?? 150, body: th.accent3, cap: th.ink}) : null;
  const penRest = o.penRest || {x: CX + card.w - 200, y: CY + card.h - 40};
  const PEN_ANGLE = o.penAngle ?? -34;

  // --- paths
  const park = k => ({x: PX + panel.rows[k].park.x, y: PY + panel.rows[k].park.y});
  const stickAt = idx => {
    const s = book.sentences[idx];
    return toStage({x: s.strip.x + s.strip.w - FLAG.inset, y: s.strip.y + s.strip.h / 2});
  };
  const itemW = it => (it.kind === 'strip' ? it.strip.w : it.note.w);
  const dockFlag = k => {
    const sl = card.slots[k];
    return {x: CX + sl.x + itemW(items[k]) - FLAG.inset, y: CY + sl.y + sl.h / 2};
  };
  const laneX = G.laneX;
  const flyPath = (from, to) => {
    const leftPark = G.panel.parkSide === 'left';
    // (a card beside the page: the flag drops into the gap under the search box, runs along it to the
    // lane beside the page and down the lane, so it never crosses the card)
    if (G.flyGapY != null && !leftPark) return roundedRoute([from, {x: from.x, y: G.flyGapY}, {x: laneX, y: G.flyGapY}, {x: laneX, y: to.y}, to], 36);
    const midY = from.y + (to.y - from.y) * 0.5;
    const pts = leftPark
      ? [from, {x: from.x - 60, y: from.y + 4}, {x: laneX + 30, y: midY}, {x: to.x + 110, y: to.y}, to]
      : [from, {x: from.x + 16, y: from.y + 46}, {x: laneX, y: midY}, {x: to.x + 100, y: to.y - 4}, to];
    return smooth(pts);
  };
  // carry route: the copy slides sideways out of its sentence into the lane beside the page, runs
  // along the lane to the row of its slot and slides into the slot along that row (so it never
  // sweeps across the card's header or other filed slots on the way in)
  const runX = G.cardSide === 'right'
    ? Math.min(laneX + 10, CX - FLAG.w - 8)
    : Math.min(laneX, G.laneMax ?? Infinity);
  const carryPath = (from, to) => roundedRoute([from, {x: Math.max(runX, from.x + 24), y: from.y}, {x: Math.max(runX, from.x + 24), y: to.y}, to], 40);
  // (hopStraight: from one sentence to the next straight along the page edge)
  const hopPath = (from, to) => (G.hopStraight ? polyline([from, to]) : smooth([from, {x: from.x + 60, y: from.y + (to.y - from.y) * 0.2}, {x: to.x + 60, y: to.y - (to.y - from.y) * 0.2}, to]));

  const routes = facts.map((f, k) => {
    const p0 = panel ? park(k) : dockFlag(k);
    if (f.mode === 'annotate') {
      const a = stickAt(f.basis[0]);
      const b = stickAt(f.basis[f.basis.length - 1]);
      return {park: p0, fly: flyPath(p0, a), stickA: a, stickB: b, hop: hopPath(a, b), toCard: carryPath(b, dockFlag(k)), dock: dockFlag(k)};
    }
    const s = stickAt(f.sentence);
    return {park: p0, fly: flyPath(p0, s), stick: s, carry: carryPath(s, dockFlag(k)), dock: dockFlag(k)};
  });

  // --- assemble (flags + moving items above everything else)
  const node = g({name: P},
    shelf && g({transform: T(shelfBox.x, shelfBox.y)}, shelf.node),
    g({transform: T(BX, BY)}, book.node),
    g({transform: T(CX, CY)}, card.node),
    panel && g({transform: T(PX, PY)}, panel.node),
    items.map(it => (it.kind === 'strip' ? it.strip.node : g({transform: T(CX + card.slots[it.f.i].x, CY + card.slots[it.f.i].y)}, it.note.node))),
    flags.map(fl => fl.node),
    penItem && penItem.node,
    items.map(it => (it.kind === 'strip' ? it.stripM.node : null)),
    flagsM.map(fl => fl.node),
    ptr && g({name: `${P}-pointer-g`}, ptr),
  );

  /**
   * Pose from per-fact phase values.
   * quote:    {fly, mark, peel, carry}
   * annotate: {fly, mark, hop, mark2, toCard, write}
   * @param {{facts: Array<Record<string, number>>, pen?: {k:number, lift:number, write:number, back:number}, typing?: number[], ticks?: number[],
   *          pointer?: {move:number, press:number, away:number}, icons?: number[]}} v
   */
  function pose(v) {
    const nodes = {};
    const sem = {flags: [], strips: [], holders: [], marks: [], docked: [], shown: []};
    const reduced = ctx.reduced;
    facts.forEach((f, k) => {
      const ph = (v.facts && v.facts[k]) || {};
      const R = routes[k];
      const fl = `${P}-flag-${k}`;
      let pos = R.park;
      let tilt = 0;
      let lift = 0;
      let holder = panel ? 'search' : 'card';
      const fly = ph.fly ?? 0;
      if (fly > 0) {
        pos = R.fly.at(ease.inOutSine(fly));
        holder = fly >= 1 ? 'page' : 'flying';
        const env = Math.sin(Math.PI * fly);
        tilt = reduced ? 0 : -7 * env;
        lift = env;
      }
      let pinShown = false;
      let moving = fly > 0 && fly < 1;
      if (f.mode === 'quote') {
        const mark = ph.mark ?? 0, peel = ph.peel ?? 0, carry = ph.carry ?? 0;
        let bandP = 0, notch = 0;
        let stripPos = null, stripOn = false, stripLift = 0, stripTilt = 0;
        if (fly >= 1) {
          pos = R.stick;
          pinShown = mark > 0.35;
          bandP = ease.outCubic(seg(mark, 0.1, 1));
        }
        const s = book.sentences[f.sentence];
        const it = items[k];
        const home = toStage({x: s.strip.x + it.strip.grip.x, y: s.strip.y + it.strip.grip.y});
        if (peel > 0) {
          stripOn = true;
          stripLift = ease.outQuad(peel);
          stripPos = home;
          holder = 'page';
          bandP = 1;
          pinShown = true;
        }
        // rolled copies: the copy rolls up toward the flag during the peel, travels rolled and unrolls
        // into its slot at the end of the carry (it never lies over the page text on the way)
        const roll = Boolean(it.strip.rollFrame);
        const travel = roll ? seg(carry, 0, 0.8) : carry;
        let shown = 1;
        if (roll && peel > 0) shown = 1 - ease.inOutSine(seg(peel, 0.3, 1));
        if (carry > 0) {
          pos = R.carry.at(ease.inOutSine(travel));
          holder = carry >= 1 ? 'card' : 'carrying';
          const env = Math.sin(Math.PI * travel);
          // a slight sway only while running along the lane; level on the horizontal runs (so the
          // long strip never swings up into the card's header or a neighbouring slot)
          tilt = reduced ? 0 : 3 * env * Math.abs(Math.sin(pos.a ?? 0));
          stripTilt = tilt;
          lift = env;
          stripLift = 1 - ease.inQuad(seg(carry, 0.8, 1));
          stripPos = pos;
          notch = 1;
          bandP = 1;
          pinShown = true;
          moving = carry < 1;
          if (roll) shown = ease.inOutSine(seg(carry, 0.82, 1));
        }
        if (roll) {
          Object.assign(nodes, it.strip.rollFrame(shown), it.stripM.rollFrame(shown));
        }
        // both copies share the pose; only the layer that fits the state is visible
        for (const [nm, on] of [[`${P}-strip-${k}`, stripOn && !moving], [`${P}-stripm-${k}`, stripOn && moving]]) {
          if (stripOn) {
            nodes[nm] = {opacity: on ? 1 : 0, transform: T(stripPos.x, stripPos.y, stripTilt, 1 + (reduced ? 0 : 0.02 * stripLift))};
            nodes[`${nm}-shadow`] = {transform: `translate(${r(3 + 9 * stripLift)} ${r(4 + 12 * stripLift)})`, opacity: r(0.25 + 0.75 * stripLift, 3)};
          } else {
            nodes[nm] = {opacity: 0, transform: T(home.x, home.y)};
            // neutral shadow (as in build(): no offset, full opacity) so the DOM never depends on seek order
            nodes[`${nm}-shadow`] = {transform: 'translate(0 0)', opacity: 1};
          }
        }
        Object.assign(nodes, book.bandFrame(f.sentence, bandP, notch, bandSlot[k][f.sentence]));
        sem.strips.push(stripOn ? {x: r(stripPos.x), y: r(stripPos.y)} : null);
        sem.shown.push(stripOn ? r(roll ? shown : 1, 3) : null);
        sem.marks.push([r(bandP, 3)]);
      } else {
        const mark = ph.mark ?? 0, hop = ph.hop ?? 0, mark2 = ph.mark2 ?? 0, toCard = ph.toCard ?? 0, write = ph.write ?? 0;
        let bandA = 0, bandB = 0, notchA = 0, notchB = 0;
        const multi = f.basis.length > 1;
        if (fly >= 1) {
          pos = R.stickA;
          bandA = ease.outCubic(seg(mark, 0.1, 1));
          if (!multi) pinShown = mark > 0.35;
        }
        if (multi && hop > 0) {
          pos = R.hop.at(ease.inOutSine(hop));
          notchA = 1;
          bandA = 1;
          holder = hop >= 1 ? 'page' : 'moving';
          moving = hop < 1;
        }
        if (multi && hop >= 1) {
          bandB = ease.outCubic(seg(mark2, 0.1, 1));
          pinShown = mark2 > 0.35;
        }
        if (toCard > 0) {
          pos = R.toCard.at(ease.inOutSine(toCard));
          holder = toCard >= 1 ? 'card' : 'moving';
          const env = Math.sin(Math.PI * toCard);
          tilt = reduced ? 0 : 4 * env;
          lift = env;
          notchA = 1;
          notchB = 1;
          bandA = 1;
          bandB = 1;
          pinShown = true;
          moving = toCard < 1;
        }
        Object.assign(nodes, book.bandFrame(f.basis[0], bandA, notchA, bandSlot[k][f.basis[0]]));
        if (multi) Object.assign(nodes, book.bandFrame(f.basis[f.basis.length - 1], bandB, notchB, bandSlot[k][f.basis[f.basis.length - 1]]));
        const it = items[k];
        nodes[`${P}-note-${k}`] = {opacity: r(Math.max(write > 0 ? 1 : 0, clamp(ph.frame ?? 0)), 3)};
        Object.assign(nodes, it.note.writeFrame(write));
        sem.strips.push(null);
        sem.shown.push(null);
        sem.marks.push(multi ? [r(bandA, 3), r(bandB, 3)] : [r(bandA, 3)]);
      }
      const flm = `${P}-flagm-${k}`;
      for (const [nm, on] of [[fl, !moving], [flm, moving]]) {
        nodes[nm] = {transform: T(pos.x, pos.y, tilt, 1 + (reduced ? 0 : 0.05 * lift)), opacity: on ? 1 : 0};
        nodes[`${nm}-shadow`] = {transform: `translate(${r(6 * lift)} ${r(10 * lift)})`};
        for (const key of flags[k].pinKeys) nodes[`${nm}-pin-${key}`] = {opacity: pinShown ? 1 : 0};
      }
      sem.flags.push({x: r(pos.x), y: r(pos.y)});
      sem.holders.push(holder);
      sem.docked.push(holder === 'card');
      if (panel && v.ticks) nodes[`${P}-panel-check-${k}`] = {opacity: r(clamp(v.ticks[k] ?? 0), 3)};
      if (panel && v.typing) Object.assign(nodes, panel.typeFrame(k, v.typing[k] ?? 1));
      if (panel && v.icons && f.icon) nodes[`${P}-panel-icon-${k}`] = {opacity: r(clamp(v.icons[k] ?? 1), 3)};
    });
    // pointer: rests by the field, moves onto the Extract button, presses it, eases away
    let pointerAt = null;
    if (ptr) {
      const pv = v.pointer || {move: 0, press: 0, away: 0};
      let q = mix(ptrRest, ptrBtn, ease.inOutCubic(clamp(pv.move)));
      if (pv.away > 0) q = mix(ptrBtn, ptrRest, ease.inOutCubic(clamp(pv.away)));
      const dip = Math.sin(Math.PI * clamp(pv.press));
      nodes[`${P}-pointer-g`] = {transform: T(q.x, q.y, 0, 1 - (reduced ? 0 : 0.1 * dip))};
      Object.assign(nodes, panel.pressFrame(pv.press));
      pointerAt = {x: r(q.x), y: r(q.y)};
    }
    // pen: rests on the card; lifts, writes a note (tip follows the text), returns
    let penTip = null;
    if (penItem) {
      const pc = v.pen || {k: -1, write: 0, lift: 0, back: 0};
      const note = pc.k >= 0 && items[pc.k] && items[pc.k].kind === 'note' ? items[pc.k] : null;
      let tip = penRest;
      let raised = 0;
      if (note) {
        const sl = card.slots[pc.k];
        const origin = {x: CX + sl.x, y: CY + sl.y};
        const start = {x: origin.x + note.note.tipAt(0).x, y: origin.y + note.note.tipAt(0).y};
        const end = {x: origin.x + note.note.tipAt(1).x, y: origin.y + note.note.tipAt(1).y};
        if (pc.back > 0) {
          tip = mix(end, penRest, ease.inOutCubic(pc.back));
          raised = Math.sin(Math.PI * pc.back);
        } else if (pc.write > 0) {
          const q = note.note.tipAt(pc.write);
          tip = {x: origin.x + q.x, y: origin.y + q.y};
        } else if (pc.lift > 0) {
          tip = mix(penRest, start, ease.inOutCubic(pc.lift));
          raised = Math.sin(Math.PI * pc.lift);
        }
      }
      nodes[`${P}-pen`] = {transform: T(tip.x, tip.y - 10 * raised, PEN_ANGLE, 1 + (reduced ? 0 : 0.05 * raised))};
      penTip = {x: r(tip.x), y: r(tip.y)};
    }
    sem.pointer = pointerAt;
    sem.penTip = penTip;
    return {nodes, semantic: sem};
  }

  const bookBox = {x: BX, y: BY, w: G.book.w, h: G.book.h + book.standH};
  const pageBox = {x: BX + book.page.x, y: BY + book.page.y, w: book.page.w, h: book.page.h};
  const panelBox = panel ? {x: PX, y: PY, w: panel.w, h: panel.h} : null;
  const cardBox = {x: CX, y: CY, w: card.w, h: card.h};
  const headerBox = {x: BX + book.page.x, y: BY + book.page.y, w: book.page.w, h: book.headerBottom - book.page.y + 6};
  const textBottom = BY + book.textBottom;
  const sentenceBox = idx => {
    const s = book.sentences[idx];
    return {x: BX + s.strip.x, y: BY + s.strip.y, w: s.strip.w, h: s.strip.h};
  };
  const slotBox = k => {
    const sl = card.slots[k];
    return {x: CX + sl.x, y: CY + sl.y, w: itemW(items[k]) + FLAG.w - FLAG.inset, h: sl.h};
  };
  const shelfWorld = shelf ? {x: shelfBox.x, y: shelfBox.y, w: shelf.w, h: shelf.h} : null;
  return {node, pose, book, panel, card, shelf, facts, items, routes, flags, bookBox, pageBox, panelBox, cardBox, shelfBox: shelfWorld, sentenceBox, slotBox, headerBox, textBottom,
    toStage, penRest, cardOverflow: card.overflow, cardNeedH: card.needH, pageOverflow: book.overflow, condensed: Boolean(o.condense), omitted: book.omitted, stripW};
}
