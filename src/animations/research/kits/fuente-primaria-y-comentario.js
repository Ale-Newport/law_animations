/**
 * Motif kit for "Fuente primaria y comentario" (LAW-0061..0064):
 * a primary-source page and a commentator's side note that are CONNECTED
 * (pinpoint tab, bracket, push pin and thread) but never MERGED (separate
 * sheets, separate voices, a gutter that the note never crosses).
 *
 * Contents (fields, geometry and art only; every entry owns its own
 * timeline, layout and semantics):
 *  - research-category fields (query / sources / citations / dates) with
 *    fictional EN/ES defaults and built-in strings;
 *  - original vector art: source page (navy header, serif text, ¶ numbers,
 *    highlight, right-margin bracket and per-line underlines), index-card
 *    side note (ochre band, italic voice, pinpoint tab that is the thread
 *    port) or verbatim quote slip (navy band, serif, quotation marks), push
 *    pins, thread, cork reading board with a dashed gutter and column
 *    plaques, library bookcase with labelled shelves and featured volumes,
 *    catalogue-search screen (typed query, result rows, link glyph).
 * Colour grammar: source = accent2 (navy), commentary = accent3 (ochre),
 * link (thread / pins / bracket) = accent (red). Voices: source = serif,
 * commentary = italic sans.
 * @module animations/research/kits/fuente-primaria-y-comentario
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ fields */

/** Category fields (research): query, sources, citations, dates. */
export const fpcContentFields = {
  query: str('Text shown in the catalogue search box (fictional)', 60),
  sources: obj('The primary source and the commentary (fictional, simulated text)', {
    sourceTitle: str('Heading printed on the primary-source page', 70),
    passages: list('Passages of the primary source, printed with ¶ numbers (simulated text)', str('Passage text', 110), 2, 4),
    commentator: str('Fictional commentator named on the side note', 40),
    commentaryWork: str('Title of the fictional commentary the side note comes from', 60),
    commentaryText: str('The commentator’s interpretation written on the side note (an attributed opinion, not a statement of law)', 120),
  }, ['sourceTitle', 'passages', 'commentator', 'commentaryWork', 'commentaryText']),
  citations: obj('Fictional references (never real citations)', {
    source: str('Reference printed on the source-page header and on its search result', 50),
    commentary: str('Reference of the commentary printed on the side note and on its search result', 40),
    passage: int('Passage number (1-based) the side note is linked to — supplied by the author, never computed', 1, 4),
  }, ['source', 'commentary', 'passage']),
  dates: obj('Relative, fictional dates', {
    source: str('Date label of the source-text version', 30),
    commentary: str('Date label of the commentary', 30),
  }, ['source', 'commentary']),
};

/** Researcher (story only). */
export const researcherField = {researcher: party};

/** Fictional English defaults shared by the four entries. */
export const FPC_DEFAULTS = {
  query: 'art. 7 notice — commentary',
  sources: {
    sourceTitle: 'Art. 7 — Notices between the parties',
    passages: [
      'Each party names an address for notices.',
      'Notice is given in writing and states the date it is sent.',
      'The sender keeps a copy of each notice.',
    ],
    commentator: 'R. Ferrer',
    commentaryWork: 'Notes on the Example Code',
    commentaryText: 'Reads “in writing” here as also covering email.',
  },
  citations: {source: 'Example Code (fictional) · art. 7', commentary: 'Ferrer, Notes, p. 14', passage: 2},
  dates: {source: 'Text as of Day 1', commentary: 'Written on Day 40'},
};

/** Spanish counterparts for the baseline-es presets. */
export const FPC_DEFAULTS_ES = {
  query: 'art. 7 aviso — comentario',
  sources: {
    sourceTitle: 'Art. 7 — Avisos entre las partes',
    passages: [
      'Cada parte indica una dirección para avisos.',
      'El aviso se da por escrito e indica la fecha de envío.',
      'Quien envía el aviso conserva una copia.',
    ],
    commentator: 'R. Ferrer',
    commentaryWork: 'Notas al Código de ejemplo',
    commentaryText: 'Entiende que «por escrito» incluye aquí el correo electrónico.',
  },
  citations: {source: 'Código de ejemplo (ficticio) · art. 7', commentary: 'Ferrer, Notas, p. 14', passage: 2},
  dates: {source: 'Texto a día 1', commentary: 'Escrito el día 40'},
};

/** Built-in strings (user content is never translated). */
export const FPC_STRINGS = {
  en: {
    search: 'Catalogue search', sourceShelf: 'Source texts', commentaryShelf: 'Commentaries',
    sourceText: 'Source text', commentary: 'Commentary', quote: 'Quoted words',
    linked: 'Linked, not merged', unchanged: 'Source text unchanged', attributed: 'Interpretation by', attributedState: 'Attributed interpretation',
    exactWords: 'Exact words copied', gutter: 'Gutter', notMerged: 'kept apart',
  },
  es: {
    search: 'Buscador del catálogo', sourceShelf: 'Textos fuente', commentaryShelf: 'Comentarios',
    sourceText: 'Texto fuente', commentary: 'Comentario', quote: 'Palabras citadas',
    linked: 'Enlazados, no fusionados', unchanged: 'Texto fuente sin cambios', attributed: 'Interpretación de', attributedState: 'Interpretación atribuida',
    exactWords: 'Palabras exactas copiadas', gutter: 'Medianil', notMerged: 'por separado',
  },
};

/** Zero-based passage index the note is linked to (clamped to the passages supplied). */
export function linkedPassage(p, n = p.sources.passages.length) {
  return Math.max(0, Math.min(n - 1, (p.citations.passage || 1) - 1));
}

/** Pinpoint label printed on the note tab. */
export const pinLabel = i => `¶${i + 1}`;

/* ------------------------------------------------------------------ colour */

/** Colour grammar of the motif (resolved from the palette). */
export function fpcColors(ctx) {
  const th = ctx.theme;
  return {
    src: th.accent2,
    srcSoft: th.accent2Soft,
    srcInk: shade(th.accent2, -0.35),
    com: th.accent3,
    comSoft: th.accent3Soft,
    comInk: shade(th.accent3, -0.62),
    link: th.accent,
    linkSoft: th.accentSoft,
    cork: '#dcc49e',
    corkDark: '#b99a6c',
    wall: '#ebe4d6',
    wallLow: '#ddd2bf',
    card: '#fffdf6',
    rule: '#c5d7e6',
  };
}

/* ---------------------------------------------------------------- helpers */

const fs1 = v => Math.round(v * 10) / 10;

/** Axis-aligned overlap test with padding. */
export function boxesOverlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Text bars used instead of text when labels are hidden. */
export function bars(ctx, x, y, w, n, barH, color, rngKey) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const lw = i === n - 1 ? w * (0.45 + ctx.rng(rngKey, i) * 0.3) : w * (0.85 + ctx.rng(rngKey, i) * 0.15);
    out.push(h('rect', {x: r(x), y: r(y + i * barH * 2.1), width: r(lw), height: r(barH), rx: r(barH / 2), fill: color}));
  }
  return out;
}

/** Quadratic thread path from a to b with a downward sag (design units). */
export function threadD(a, b, sag = 12) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag;
  return `M${r(a.x)} ${r(a.y)}Q${r(mx)} ${r(my)} ${r(b.x)} ${r(b.y)}`;
}

/** Point at t on the thread path (for tracers / annotation targets). */
export function threadPoint(a, b, sag, t) {
  const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag};
  const u = 1 - t;
  return {x: u * u * a.x + 2 * u * t * m.x + t * t * b.x, y: u * u * a.y + 2 * u * t * m.y + t * t * b.y};
}

/**
 * Push pin seen from the front. Local origin = the point it pins.
 * @param {any} ctx
 * @param {{name?:string, color?:string, radius?:number, opacity?:number}} o
 */
export function pushPin(ctx, o = {}) {
  const R = o.radius ?? 11;
  const c = o.color ?? ctx.theme.accent;
  return g({name: o.name, opacity: o.opacity},
    h('ellipse', {cx: r(R * 0.5), cy: r(R * 0.8), rx: r(R * 0.95), ry: r(R * 0.62), fill: 'rgba(31,35,40,0.28)'}),
    h('circle', {r: R, fill: c, stroke: '#1f2328', 'stroke-width': 2}),
    h('circle', {cx: r(-R * 0.33), cy: r(-R * 0.33), r: r(R * 0.34), fill: '#fff', opacity: 0.55}),
  );
}

/**
 * Fit text into a box of bounded height: the largest size (from `size` down
 * to `minSize`) whose wrapped block fits both the width and `maxH`; at the
 * minimum size the block is cut to the lines that fit (ellipsis).
 */
export function fitInto(ctx, text, o) {
  const lead = o.leading ?? 1.2;
  for (let sz = o.size; sz >= o.minSize - 0.01; sz -= Math.max(0.5, o.size * 0.04)) {
    const lines = Math.max(1, Math.min(o.maxLines ?? 8, Math.floor((o.maxH - sz) / (sz * lead)) + 1));
    const f = ctx.fit(text, {maxWidth: o.maxWidth, size: sz, minSize: sz, maxLines: lines, weight: o.weight, family: o.family, leading: lead});
    if (!f.truncated && f.height <= o.maxH + 0.5) return f;
  }
  const sz = o.minSize;
  const lines = Math.max(1, Math.floor((o.maxH - sz) / (sz * lead)) + 1);
  return ctx.fit(text, {maxWidth: o.maxWidth, size: sz, minSize: sz, maxLines: lines, weight: o.weight, family: o.family, leading: lead});
}

/* ------------------------------------------------------------ source page */

/**
 * Primary-source page. Local origin = top-left of the sheet.
 * Named nodes per passage i: `${prefix}-hl-${i}` (highlight, opacity),
 * `${prefix}-br-${i}` (bracket in the right margin, dash-drawn),
 * `${prefix}-ul-${i}-${k}` (underline under text line k, dash-drawn).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, title:string, ref:string, date?:string, passages:string[], showText?:boolean, textSize?:number, titleSize?:number, seedKey?:string, maxLines?:number, padL?:number, padR?:number, fitSlots?:boolean, slotGap?:number}} o
 */
export function sourcePage(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const {prefix, w} = o;
  const hh = o.h;
  const show = o.showText !== false;
  const seed = o.seedKey || 'fpc-src';
  // (optional absolute margins for wide pages; default 14% / 13% of the width)
  const padL = Math.round(o.padL ?? w * 0.14);
  const padR = Math.round(o.padR ?? w * 0.13);
  const headH = Math.round(Math.max(34, w * 0.09));
  const inner = w - padL - padR;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(7, 10, w, hh, 6), fill: th.shadow}));
  // a second sheet peeking behind: the page belongs to a bound text
  parts.push(h('path', {d: roundRectPath(-5, 5, w, hh, 6), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}));
  // header band = source identity
  parts.push(h('path', {d: `M0 6Q0 0 6 0H${w - 6}Q${w} 0 ${w} 6V${headH}H0Z`, fill: C.src, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  // emblem: two stacked leaves (a bound official text) at the right of the band
  const es = headH * 0.56, ex = w - headH * 0.95, ey = headH * 0.2;
  parts.push(h('rect', {x: r(ex + es * 0.2), y: r(ey), width: r(es * 0.62), height: r(es * 0.8), rx: 2, fill: shade(C.src, 0.55), stroke: '#fff', 'stroke-width': 1.4}));
  parts.push(h('rect', {x: r(ex), y: r(ey + es * 0.16), width: r(es * 0.62), height: r(es * 0.8), rx: 2, fill: '#fff', stroke: '#fff', 'stroke-width': 1.4}));
  if (show && o.ref) {
    const f = ctx.fit(o.ref, {maxWidth: w - 28 - headH, size: fs1(Math.min(24, headH * 0.46)), minSize: 12, maxLines: 1, weight: 600, family: 'sans'});
    parts.push(textBlock(f, {x: 14, y: (headH - f.size) / 2 + 1, fill: '#fff'}));
  } else {
    parts.push(h('rect', {x: 14, y: r(headH * 0.38), width: r(w * 0.5), height: r(headH * 0.24), rx: 3, fill: '#fff', opacity: 0.75}));
  }
  let y = headH + Math.max(12, w * 0.04);
  const titleSize = fs1(o.titleSize ?? Math.max(22, w * 0.058));
  if (show && o.title) {
    let f = ctx.fit(o.title, {maxWidth: w - w * 0.16, size: titleSize, minSize: titleSize * 0.72, maxLines: 2, weight: 700, family: 'serif'});
    if (f.truncated) f = ctx.fit(o.title, {maxWidth: w - w * 0.16, size: titleSize * 0.8, minSize: titleSize * 0.66, maxLines: 3, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x: w * 0.08, y, fill: th.ink}));
    y += f.height + Math.max(10, w * 0.03);
  } else {
    parts.push(h('rect', {x: r(w * 0.08), y: r(y), width: r(w * 0.62), height: r(titleSize * 0.7), rx: 4, fill: th.ink, opacity: 0.75}));
    y += titleSize * 1.25;
  }
  parts.push(h('line', {x1: r(w * 0.08), x2: r(w * 0.92), y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 2}));
  y += Math.max(6, w * 0.018);
  const footH = Math.max(30, w * 0.08);
  const n = o.passages.length;
  const area = hh - footH - y;
  const textSize = fs1(o.textSize ?? Math.max(20, w * 0.05));
  const lead = 1.24;
  const minText = textSize * 0.76;
  // opt-in `fitSlots`: each passage slot is as tall as its own text (+ an equal share of any
  // spare room) instead of an equal 1/n of the page; `needH` reports the page height that
  // holds every passage at full size. Falls back to equal slots when the page is too short.
  let fitted = null;
  let needH = null;
  if (o.fitSlots) {
    const barH0 = Math.max(6, textSize * 0.36);
    const pre = o.passages.map(t => ctx.fit(t, {maxWidth: inner, size: textSize, minSize: textSize * 0.9, maxLines: o.maxLines ?? 4, weight: 400, family: 'serif', leading: lead}));
    const hs = pre.map(f => (show ? f.height : barH0 * 2.1 * 2 + barH0) + 16 + (o.slotGap ?? 14));
    const need = hs.reduce((a, b) => a + b, 0);
    needH = y + need + footH;
    if (!pre.some(f => f.truncated) && need <= area + 0.5) {
      const extra = (area - need) / n;
      let yy = y;
      fitted = hs.map((sh, i) => { const s = {y: yy, h: sh + extra, fit: pre[i]}; yy += sh + extra; return s; });
    }
  }
  const each = area / n;
  const slotLines = Math.max(1, Math.min(o.maxLines ?? 5, Math.floor((each - 16 - minText) / (minText * lead)) + 1));
  const passages = [];
  const hl = [];
  const marks = [];
  for (let i = 0; i < n; i++) {
    const slotY = fitted ? fitted[i].y : y + i * each;
    const slotH = fitted ? fitted[i].h : each;
    // at full size the passage keeps at most 3 lines; longer passages shrink (bounded) into more
    // lines, never taller than their slot
    let fit = fitted ? fitted[i].fit : ctx.fit(o.passages[i], {maxWidth: inner, size: textSize, minSize: textSize * 0.9, maxLines: Math.min(3, slotLines), weight: 400, family: 'serif', leading: lead});
    if (!fitted && (fit.truncated || fit.height > each - 16)) fit = fitInto(ctx, o.passages[i], {maxWidth: inner, size: textSize * 0.9, minSize: minText, maxH: each - 16, maxLines: slotLines, weight: 400, family: 'serif', leading: lead});
    const barH = Math.max(6, textSize * 0.36);
    const blockH = show ? fit.height : barH * 2.1 * 2 + barH;
    const by = slotY + (slotH - blockH) / 2;
    const box = {x: padL - 10, y: by - 8, w: inner + 20, h: blockH + 16};
    hl.push(h('path', {name: `${prefix}-hl-${i}`, d: roundRectPath(box.x, box.y, box.w, box.h, 6), fill: C.srcSoft, stroke: C.src, 'stroke-width': 2, opacity: 0}));
    // ¶ mark (text) or a navy dot when labels are hidden
    if (show) {
      const mf = ctx.fit(pinLabel(i), {maxWidth: padL - 6, size: fs1(textSize * 1.02), minSize: 11, maxLines: 1, weight: 700, family: 'serif'});
      marks.push(textBlock(mf, {x: padL * 0.5, y: by, anchor: 'middle', fill: C.src, name: `${prefix}-pm-${i}`}));
    } else {
      marks.push(h('circle', {cx: r(padL * 0.5), cy: r(by + textSize * 0.45), r: r(textSize * 0.3), fill: C.src}));
    }
    const text = show
      ? textBlock(fit, {x: padL, y: by, fill: th.ink, name: `${prefix}-pt-${i}`})
      : g(null, bars(ctx, padL, by, inner, 3, barH, th.paperLine, `${seed}-p${i}`));
    // underline under each printed line (exact-words links)
    const lines = show
      ? fit.lines.map((line, k) => ({w: Math.min(inner, ctx.measure(line, fit.size, fit.weight, fit.family)), y: by + fit.size * 0.8 + k * fit.lineHeight + fit.size * 0.26, top: by + k * fit.lineHeight}))
      : [0, 1, 2].map(k => ({w: k === 2 ? inner * 0.55 : inner * 0.92, y: by + k * barH * 2.1 + barH + 4, top: by + k * barH * 2.1}));
    const ul = lines.map((ln, k) => h('line', {name: `${prefix}-ul-${i}-${k}`, x1: padL, x2: r(padL + ln.w), y1: r(ln.y), y2: r(ln.y), stroke: C.src, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(ln.w)} ${r(ln.w + 10)}`, 'stroke-dashoffset': r(ln.w)}));
    // bracket ] in the right margin; its spine carries the anchor pin
    const bx1 = w - padR * 0.36;
    const bx0 = bx1 - padR * 0.36;
    const brLen = 2 * (bx1 - bx0) + box.h;
    const br = h('path', {name: `${prefix}-br-${i}`, d: `M${r(bx0)} ${r(box.y)}H${r(bx1)}V${r(box.y + box.h)}H${r(bx0)}`, fill: 'none', stroke: C.link, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(brLen)} ${r(brLen + 10)}`, 'stroke-dashoffset': r(brLen)});
    passages.push({i, box, fit, text, ul, br, brLen, lines, pin: {x: bx1, y: box.y + box.h / 2}, mark: {x: padL * 0.5, y: by}, textX: padL, textY: by, blockH});
  }
  // footer: version date
  const foot = [];
  if (show && o.date) {
    const f = ctx.fit(o.date, {maxWidth: w * 0.8, size: fs1(Math.max(16, w * 0.038)), minSize: 12, maxLines: 1, weight: 500});
    foot.push(textBlock(f, {x: w * 0.08, y: hh - footH * 0.5 - f.size * 0.45, fill: th.inkSoft}));
  } else {
    foot.push(h('rect', {x: r(w * 0.08), y: r(hh - footH * 0.55), width: r(w * 0.3), height: 6, rx: 3, fill: th.paperLine}));
  }
  foot.push(h('line', {x1: r(w * 0.08), x2: r(w * 0.92), y1: r(hh - footH), y2: r(hh - footH), stroke: th.paperLine, 'stroke-width': 1.5}));
  const node = g({name: prefix}, parts, hl, marks, passages.map(p => p.text), passages.map(p => p.ul), passages.map(p => p.br), foot);
  const textBoxes = [{x: 0, y: 0, w, h: y}, {x: 0, y: hh - footH, w, h: footH}];
  return {node, w, h: hh, passages, headH, padL, padR, textSize, inner, textBoxes, needH};
}

/* --------------------------------------------------------------- note card */

/**
 * Index-card side note (the commentator's voice) or a verbatim quote slip
 * (the source's own words). Local origin = top-left of the card body; the
 * pinpoint tab protrudes to the LEFT (towards the source) and its tip is the
 * thread port.
 * Named nodes: `${prefix}` (card group, positioned by the scene),
 * `${prefix}-pin` (push pin, opacity/transform), `${prefix}-knot` (thread
 * eyelet at the port, opacity), `${prefix}-body` (body text group, opacity).
 * With `alt` supplied, the tab label / header / footer get a second named
 * variant (`-pp1`, `-hd1`, `-ft1`, primaries `-pp0`, `-hd0`, `-ft0`) so an
 * inspect scene can substitute one datum.
 * @param {any} ctx
 * `gripGutter` keeps a strip at the card's right edge free of body text, so a
 * hand holding the card by that edge never covers words.
 * @param {{prefix:string, w:number, h:number, variant?:'commentary'|'quote', header:string, text:string, footer?:string, pinpoint:string, showText?:boolean, tabW?:number, tabY?:number, textSize?:number, headSize?:number, footSize?:number, gripGutter?:number, alt?:{pinpoint?:string, header?:string, footer?:string}}} o
 */
export function noteCard(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const {prefix, w} = o;
  const hh = o.h;
  const show = o.showText !== false;
  const quote = o.variant === 'quote';
  const band = quote ? C.src : C.com;
  const bandInk = quote ? '#ffffff' : C.comInk;
  const pad0 = Math.max(12, w * 0.06);
  const hSize = fs1(o.headSize ?? Math.min(24, Math.max(34, hh * 0.2) * 0.5));
  // a long attribution takes two lines in a taller band instead of being cut
  const headFits = !show || !o.header || [o.header, (o.alt || {}).header].filter(Boolean).every(t => !ctx.fit(t, {maxWidth: w - pad0 - Math.max(34, hh * 0.2) * 1.25, size: hSize, minSize: hSize * 0.8, maxLines: 1, weight: 700}).truncated);
  // (an explicit `headSize` gets a band at least 1.7× its size; defaults are unaffected)
  const band0 = Math.max(34, hh * 0.2, hSize * 1.7);
  const bandH = Math.round(headFits ? band0 : band0 + hSize * 0.95);
  const tabW = o.tabW ?? Math.round(Math.max(56, w * 0.2));
  const tabH = Math.round(Math.min(46, Math.max(36, hh * 0.19)));
  const tabY = o.tabY ?? Math.round(bandH + (hh - bandH) * 0.32);
  const pad = Math.max(12, w * 0.06);
  const alt = o.alt || {};
  const parts = [];
  parts.push(h('path', {d: roundRectPath(6, 9, w, hh, 6), fill: th.shadow}));
  // pinpoint tab (behind the card edge)
  const tx0 = -tabW, ty0 = tabY - tabH / 2;
  parts.push(h('path', {d: `M10 ${r(ty0)}H${r(tx0 + tabH * 0.42)}L${r(tx0)} ${r(tabY)}L${r(tx0 + tabH * 0.42)} ${r(ty0 + tabH)}H10Z`, fill: band, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
  const tabText = (text, name, color, opacity) => {
    const f = ctx.fit(text, {maxWidth: tabW - tabH * 0.42 - 8, size: fs1(tabH * 0.56), minSize: 12, maxLines: 1, weight: 800, family: 'serif'});
    return textBlock(f, {x: tx0 + tabH * 0.36 + (tabW - tabH * 0.36) / 2 - 3, y: tabY - f.size * 0.52, anchor: 'middle', fill: color, name, opacity});
  };
  if (show && o.pinpoint) {
    parts.push(tabText(o.pinpoint, `${prefix}-pp0`, bandInk));
    if (alt.pinpoint !== undefined) parts.push(tabText(alt.pinpoint, `${prefix}-pp1`, bandInk, 0));
  } else {
    parts.push(h('path', {d: `M${r(tx0 + tabW * 0.4)} ${r(tabY)}h${r(tabW * 0.34)}`, stroke: bandInk, 'stroke-width': 4, 'stroke-linecap': 'round'}));
  }
  // card body
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: C.card, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('path', {d: `M0 6Q0 0 6 0H${w - 6}Q${w} 0 ${w} 6V${bandH}H0Z`, fill: band, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  // index-card rules + red top rule
  parts.push(h('line', {x1: 8, x2: w - 8, y1: bandH + 5, y2: bandH + 5, stroke: '#d98b85', 'stroke-width': 2}));
  const ruleStep = Math.max(22, hh * 0.13);
  for (let yy = bandH + 5 + ruleStep; yy < hh - 10; yy += ruleStep) parts.push(h('line', {x1: 8, x2: w - 8, y1: r(yy), y2: r(yy), stroke: C.rule, 'stroke-width': 1.5}));
  // header in the band (the pin sits at the band's right end: header keeps clear of it)
  const pinAt = {x: w - 22, y: Math.min(bandH * 0.5, 24)};
  const headerMax = w - pad - 50;
  const headText = (text, name, color, opacity) => {
    const f = headFits
      ? ctx.fit(text, {maxWidth: headerMax, size: hSize, minSize: hSize * 0.8, maxLines: 1, weight: 700})
      : ctx.fit(text, {maxWidth: headerMax, size: hSize * 0.86, minSize: 12, maxLines: 2, weight: 700, leading: 1.1});
    return textBlock(f, {x: pad, y: (bandH - f.height) / 2 + 1, fill: color, name, opacity});
  };
  if (show && o.header) {
    parts.push(headText(o.header, alt.header !== undefined ? `${prefix}-hd0` : undefined, bandInk));
    if (alt.header !== undefined) parts.push(headText(alt.header, `${prefix}-hd1`, bandInk, 0));
  } else {
    parts.push(h('rect', {x: r(pad), y: r(bandH * 0.38), width: r(w * 0.3), height: r(bandH * 0.24), rx: 3, fill: bandInk, opacity: 0.7}));
  }
  // footer (reference · date): one line, or two when it would otherwise be cut
  const footSize = fs1(o.footSize ?? Math.max(15, Math.min(20, hh * 0.09)));
  let footFit = null;
  if (o.footer && show) {
    footFit = ctx.fit(o.footer, {maxWidth: w - pad * 2, size: footSize, minSize: Math.max(12, footSize * 0.82), maxLines: 1, weight: 600});
    if (footFit.truncated) footFit = ctx.fit(o.footer, {maxWidth: w - pad * 2, size: footSize, minSize: 11, maxLines: 2, weight: 600});
  }
  // body: interpretation (italic sans) or verbatim quote (serif)
  const footH = o.footer ? Math.max(26, hh * 0.15, footFit ? footFit.height + 10 : 0) : 0;
  const bodyTop = bandH + 12;
  const bodyH = hh - bodyTop - footH - 8;
  const size = fs1(o.textSize ?? Math.max(20, w * 0.075));
  const bodyW = w - pad * 2 - (o.gripGutter ?? 0);
  let body;
  let bodyFit = null;
  if (o.noBody) {
    body = null;
  } else if (show) {
    const lead = 1.2;
    const minB = size * 0.72;
    const lines = Math.max(1, Math.min(6, Math.floor((bodyH - minB) / (minB * lead)) + 1));
    const text = quote ? `“${o.text}”` : o.text;
    bodyFit = ctx.fit(text, {maxWidth: bodyW, size, minSize: size * 0.9, maxLines: Math.min(4, lines), weight: quote ? 400 : 500, family: quote ? 'serif' : 'sans', leading: lead});
    if (bodyFit.truncated || bodyFit.height > bodyH) bodyFit = fitInto(ctx, text, {maxWidth: bodyW, size: size * 0.9, minSize: minB, maxH: bodyH, maxLines: lines, weight: quote ? 400 : 500, family: quote ? 'serif' : 'sans', leading: lead});
    body = textBlock(bodyFit, {x: pad, y: bodyTop + Math.max(0, (bodyH - bodyFit.height) / 2), fill: quote ? th.ink : C.comInk, italic: !quote});
  } else {
    body = g(null, bars(ctx, pad, bodyTop + 10, bodyW, 3, Math.max(6, size * 0.36), quote ? C.src : C.com, `${prefix}-b`));
  }
  parts.push(g({name: `${prefix}-body`}, body));
  if (o.footer) {
    const footText = (text, name, color, opacity) => {
      let f = ctx.fit(text, {maxWidth: w - pad * 2, size: footSize, minSize: Math.max(12, footSize * 0.82), maxLines: 1, weight: 600});
      if (f.truncated) f = ctx.fit(text, {maxWidth: w - pad * 2, size: footSize, minSize: 11, maxLines: 2, weight: 600});
      return textBlock(f, {x: pad, y: hh - footH - 2 + (footH - f.height) / 2, fill: color, name, opacity});
    };
    if (show) {
      parts.push(footText(o.footer, alt.footer !== undefined ? `${prefix}-ft0` : undefined, th.inkSoft));
      if (alt.footer !== undefined) parts.push(footText(alt.footer, `${prefix}-ft1`, th.accent2, 0));
    } else {
      parts.push(h('rect', {x: r(pad), y: r(hh - footH * 0.75), width: r(w * 0.4), height: 6, rx: 3, fill: th.paperLine}));
    }
  }
  const port = {x: tx0 + 3, y: tabY};
  const knot = g({name: `${prefix}-knot`, opacity: 0},
    h('circle', {cx: r(port.x + 7), cy: r(port.y), r: 6.5, fill: '#fff', stroke: C.link, 'stroke-width': 3.2}));
  const pin = g({name: `${prefix}-pinT`, transform: T(pinAt.x, pinAt.y)}, pushPin(ctx, {name: `${prefix}-pin`, opacity: 0, radius: Math.max(10, hh * 0.07)}));
  const node = g({name: prefix}, parts, knot, pin);
  return {
    node, w, h: hh, port, tab: {x: tx0, y: ty0, w: tabW, h: tabH}, tabY, pinAt, bandH, footH, bodyFit, bodyTop, bodyH, pad, bodyRight: pad + bodyW,
    headerBox: {x: 0, y: 0, w, h: bandH}, footBox: {x: 0, y: hh - footH - 4, w, h: footH + 4},
    tabBox: {x: tx0, y: ty0, w: tabW + 10, h: tabH},
  };
}

/* ------------------------------------------------------------- cork board */

/**
 * Reading board: wooden frame, cork surface, dashed gutter divider between
 * the source column and the margin column, optional column plaques on the
 * top rail (navy "source", ochre "commentary").
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, gutterX:number, plates?:Array<{x:number, text:string, kind:'source'|'commentary', maxWidth:number, anchor?:'start'|'middle'|'end'}>, plateSize?:number, seedKey?:string}} o
 */
export function corkBoard(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const {prefix, x, y, w} = o;
  const hh = o.h;
  const F = 18;
  const seed = o.seedKey || 'fpc-cork';
  const specks = [];
  const count = Math.round((w * hh) / 2600);
  for (let i = 0; i < count; i++) {
    const sx = x + F + ctx.rng(`${seed}-cx`, i) * (w - 2 * F);
    const sy = y + F + ctx.rng(`${seed}-cy`, i) * (hh - 2 * F);
    specks.push(h('circle', {cx: r(sx), cy: r(sy), r: r(1.2 + ctx.rng(`${seed}-cr`, i) * 1.8), fill: C.corkDark, opacity: 0.55}));
  }
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 10, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 14), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(x + F, y + F, w - 2 * F, hh - 2 * F, 6), fill: C.cork, stroke: shade(th.wood, -0.3), 'stroke-width': 2}),
    specks,
    h('line', {name: `${prefix}-gutter`, x1: r(o.gutterX), x2: r(o.gutterX), y1: r(y + F + 14), y2: r(y + hh - F - 14), stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '12 10', opacity: 0.6}),
  ];
  const plates = [];
  const plateBoxes = [];
  if (o.plates && ctx.show('key')) {
    for (const pl of o.plates) {
      const size = o.plateSize ?? 22;
      // one line when it fits without shrinking much, otherwise two lines at a readable size
      const mk = lines => chip(ctx, pl.text, {x: pl.x, y: y - size * 0.5, anchor: pl.anchor || 'middle', maxWidth: pl.maxWidth, size, minSize: size * (lines === 1 ? 0.86 : 0.76), maxLines: lines, fill: pl.kind === 'source' ? C.src : C.com, stroke: th.ink, color: pl.kind === 'source' ? '#fff' : C.comInk, weight: 700, padX: size * 0.6, padY: size * 0.24, radius: 5});
      let c = mk(1);
      if (c.fit.truncated) c = mk(2);
      plates.push(c.node);
      plateBoxes.push(c.box);
    }
  } else if (o.plates) {
    // labels hidden: coloured plaques keep the column identity
    for (const pl of o.plates) plates.push(h('path', {d: roundRectPath(pl.x - 44, y - 12, 88, 24, 5), fill: pl.kind === 'source' ? C.src : C.com, stroke: th.ink, 'stroke-width': 2}));
  }
  return {node: g({name: prefix}, parts, plates), inner: {x: x + F, y: y + F, w: w - 2 * F, h: hh - 2 * F}, box: {x, y, w, h: hh}, plateBoxes};
}

/* --------------------------------------------------------------- bookcase */

const SRC_SPINES = ['#2d4f7c', '#34598a', '#27436b', '#3b5f8f', '#2a4a73'];
const COM_SPINES = ['#c9893a', '#a8612e', '#b98a4a', '#d4a257', '#b07a52', '#8a6a3a', '#c07a3a'];
const MIX_SPINES = ['#7a5c8e', '#9c4f4f', '#5d6b75', '#4f7c7a', '#b98a5e', '#6b705c', '#3d5a6c'];

/**
 * Library bookcase (front view). Each row may feature one volume, drawn as a
 * separately named group `${prefix}-v${row}` with a glow outline
 * `${prefix}-glow${row}` and an optional bookmark `${prefix}-bm${row}`.
 * Plates (key labels) hang from the shelf lip under each labelled row.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, rows:Array<{kind:'source'|'commentary'|'mixed', label?:string, feature?:number, tab?:boolean}>, seedKey?:string, plateSize?:number, legs?:boolean}} o
 */
export function bookcase(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const {prefix, x, y, w} = o;
  const hh = o.h;
  const seed = o.seedKey || 'fpc-books';
  const F = Math.max(12, Math.min(22, w * 0.05));
  const B = Math.max(10, Math.min(18, hh * 0.028));
  const n = o.rows.length;
  const rh = (hh - 2 * F - (n - 1) * B) / n;
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 10, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 10), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(x + F), y: r(y + F), width: r(w - 2 * F), height: r(hh - 2 * F), fill: shade(th.wood, -0.45)}),
    // crown moulding
    h('path', {d: roundRectPath(x - 8, y - 6, w + 16, 16, 5), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
  ];
  const rows = [];
  const plates = [];
  const features = [];
  o.rows.forEach((row, ri) => {
    const ry = y + F + ri * (rh + B);
    const floor = ry + rh;
    const pal = row.kind === 'source' ? SRC_SPINES : row.kind === 'commentary' ? COM_SPINES : MIX_SPINES;
    let bx = x + F + 6;
    const right = x + w - F - 6;
    let k = 0;
    const books = [];
    let feature = null;
    while (bx < right - rh * 0.1) {
      const R = key => ctx.rng(`${seed}-${key}-${ri}`, k);
      let bw = Math.max(11, rh * (row.kind === 'source' ? 0.17 : 0.13 + R('w') * 0.08));
      bw = Math.min(bw, right - bx);
      if (bw < Math.max(8, rh * 0.08)) break;
      const bh = row.kind === 'source' ? rh * (0.84 + (k % 3 === 1 ? 0.04 : 0)) : rh * (0.62 + R('h') * 0.3);
      const col = pal[(k + Math.floor(R('c') * pal.length)) % pal.length];
      const isFeature = row.feature !== undefined && row.feature !== null && k === row.feature;
      const book = spine(ctx, {x: bx, y: floor - bh, w: bw, h: bh, color: col, kind: row.kind});
      if (isFeature) {
        const fb = {x: bx, y: floor - bh, w: bw, h: bh, cx: bx + bw / 2, cy: floor - bh / 2, top: floor - bh, floor};
        const tabCol = row.kind === 'source' ? C.src : C.com;
        feature = {...fb, row: ri, kind: row.kind};
        // halo behind the volume (found by the search), bookmark rises with it
        books.push(g({name: `${prefix}-v${ri}`},
          g({name: `${prefix}-glow${ri}`, opacity: 0},
            h('path', {d: roundRectPath(bx - 9, fb.top - 12, bw + 18, bh + 16, 8), fill: tabCol, opacity: 0.35}),
            h('path', {d: roundRectPath(bx - 9, fb.top - 12, bw + 18, bh + 16, 8), fill: 'none', stroke: tabCol, 'stroke-width': 4})),
          row.tab ? h('path', {name: `${prefix}-bm${ri}`, d: `M${r(bx + bw * 0.22)} ${r(fb.top + 6)}V${r(fb.top - rh * 0.18)}l${r(bw * 0.28)} ${r(-rh * 0.05)}l${r(bw * 0.28)} ${r(rh * 0.05)}V${r(fb.top + 6)}Z`, fill: row.kind === 'source' ? '#ffffff' : C.comSoft, stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}) : null,
          book));
      } else books.push(book);
      bx += bw + 2;
      k++;
    }
    parts.push(books);
    parts.push(h('path', {d: roundRectPath(x + F - 2, floor, w - 2 * F + 4, B, 3), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}));
    rows.push({x: x + F, y: ry, w: w - 2 * F, h: rh, floor});
    if (feature) features[ri] = feature;
    if (row.label) {
      const size = o.plateSize ?? Math.max(20, Math.min(26, rh * 0.18));
      if (ctx.show('key')) {
        const mk = lines => chip(ctx, row.label, {x: x + w / 2, y: floor + B * 0.2, anchor: 'middle', maxWidth: w - 2 * F - 8, size, minSize: size * 0.76, maxLines: lines, fill: row.kind === 'source' ? C.src : row.kind === 'commentary' ? C.com : '#efe0b0', color: row.kind === 'source' ? '#fff' : row.kind === 'commentary' ? C.comInk : th.ink, stroke: th.ink, weight: 700, padX: size * 0.55, padY: size * 0.2, radius: 4});
        let c = mk(1);
        if (c.fit.truncated) c = mk(2);
        plates.push(c.node);
        rows[ri].plate = c.box;
      } else {
        plates.push(h('path', {d: roundRectPath(x + w / 2 - 40, floor + B * 0.2, 80, size * 1.2, 4), fill: row.kind === 'source' ? C.src : C.com, stroke: th.ink, 'stroke-width': 2}));
      }
    }
  });
  if (o.legs !== false) {
    parts.push(h('rect', {x: r(x + 8), y: r(y + hh - 4), width: 18, height: 10, fill: th.woodDark || shade(th.wood, -0.3), stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('rect', {x: r(x + w - 26), y: r(y + hh - 4), width: 18, height: 10, fill: th.woodDark || shade(th.wood, -0.3), stroke: th.ink, 'stroke-width': 2}));
  }
  return {node: g({name: prefix}, parts, plates), rows, features, box: {x, y, w, h: hh}, rowH: rh};
}

function spine(ctx, {x, y, w, h: hh, color, kind}) {
  const th = ctx.theme;
  const band = kind === 'source' ? '#d8b25a' : shade(color, 0.45);
  const parts = [h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 2.5, fill: color, stroke: th.ink, 'stroke-width': 1.8})];
  if (kind === 'source') {
    parts.push(h('rect', {x: r(x + 2), y: r(y + hh * 0.1), width: r(w - 4), height: r(Math.max(3, hh * 0.035)), fill: band}));
    parts.push(h('rect', {x: r(x + 2), y: r(y + hh * 0.84), width: r(w - 4), height: r(Math.max(3, hh * 0.035)), fill: band}));
    parts.push(h('rect', {x: r(x + w * 0.25), y: r(y + hh * 0.28), width: r(w * 0.5), height: r(hh * 0.22), rx: 1.5, fill: band, opacity: 0.85}));
  } else {
    parts.push(h('rect', {x: r(x + w * 0.2), y: r(y + hh * 0.18), width: r(w * 0.6), height: r(hh * 0.28), rx: 2, fill: band, opacity: 0.8}));
    parts.push(h('rect', {x: r(x + 2), y: r(y + hh * 0.86), width: r(w - 4), height: r(Math.max(2.5, hh * 0.03)), fill: shade(color, -0.3)}));
  }
  return g(null, parts);
}

/* -------------------------------------------------------- search screen */

/**
 * Catalogue-search screen. Query typing is revealed with a clip rect
 * (`${prefix}-qclip`), results are rows `${prefix}-r${i}` with a highlight
 * `${prefix}-r${i}-hl`; `${prefix}-link` is a chain-link glyph joining the
 * two rows (they stay two separate rows).
 * mount: 'stand' (neck + foot below), 'wall' (bracket above), 'none'.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, title:string, query:string, results:Array<{kind:'source'|'commentary', text:string}>, size?:number, mount?:'stand'|'wall'|'none'}} o
 */
export function searchScreen(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const {prefix, x, y, w} = o;
  const hh = o.h;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const b = 12;
  const size = o.size ?? Math.max(20, Math.min(26, w * 0.062));
  const sx = x + b, sy = y + b, sw = w - 2 * b, sh = hh - 2 * b;
  const parts = [];
  if (o.mount === 'wall') {
    parts.push(h('rect', {x: r(x + w / 2 - 12), y: r(y - 34), width: 24, height: 40, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('path', {d: roundRectPath(x + w / 2 - 40, y - 44, 80, 14, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}));
  } else if (o.mount !== 'none') {
    parts.push(h('rect', {x: r(x + w / 2 - 14), y: r(y + hh - 4), width: 28, height: 26, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('path', {d: roundRectPath(x + w / 2 - 50, y + hh + 18, 100, 14, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}));
  }
  parts.push(
    h('path', {d: roundRectPath(x + 5, y + 8, w, hh, 16), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 16), fill: '#2f343a', stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(sx, sy, sw, sh, 8), fill: '#f8f7f3'}),
  );
  // title bar with a magnifier
  const tbH = size * 1.7;
  parts.push(h('path', {d: `M${sx} ${sy + 8}Q${sx} ${sy} ${sx + 8} ${sy}H${sx + sw - 8}Q${sx + sw} ${sy} ${sx + sw} ${sy + 8}V${r(sy + tbH)}H${sx}Z`, fill: '#e3e6ea'}));
  const mg = {x: sx + size * 0.9, y: sy + tbH / 2};
  parts.push(h('circle', {cx: r(mg.x - 2), cy: r(mg.y - 2), r: r(size * 0.36), fill: 'none', stroke: th.ink, 'stroke-width': 2.6}));
  parts.push(h('line', {x1: r(mg.x + size * 0.2), y1: r(mg.y + size * 0.2), x2: r(mg.x + size * 0.48), y2: r(mg.y + size * 0.48), stroke: th.ink, 'stroke-width': 3, 'stroke-linecap': 'round'}));
  if (showKey && o.title) {
    const f = ctx.fit(o.title, {maxWidth: sw - size * 2.2, size: size * 0.9, minSize: 13, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: sx + size * 1.7, y: sy + (tbH - f.size) / 2, fill: th.ink}));
  }
  // search field: one line, or two when the query would otherwise lose words
  const fx = sx + 10, fy = sy + tbH + 10, fw = sw - 20;
  const qMax = fw - size * 1.4;
  let qfit = null;
  if (showAll && o.query) {
    qfit = ctx.fit(o.query, {maxWidth: qMax, size: size * 0.88, minSize: size * 0.72, maxLines: 1, weight: 500});
    if (qfit.truncated) qfit = ctx.fit(o.query, {maxWidth: qMax, size: size * 0.8, minSize: 12, maxLines: 2, weight: 500});
  }
  const qLines = qfit ? qfit.lines.length : 1;
  const fh = qLines > 1 ? qfit.height + size * 0.9 : size * 1.7;
  parts.push(h('path', {d: roundRectPath(fx, fy, fw, fh, Math.min(fh / 2, size * 0.85)), fill: '#fff', stroke: th.ink, 'stroke-width': 2}));
  const qid = `${prefix}-qclip`;
  const lineW = qfit ? qfit.lines.map(l => Math.min(qMax, ctx.measure(l, qfit.size, qfit.weight, qfit.family))) : [fw * 0.6];
  const qTop = fy + (fh - (qfit ? qfit.height : 0)) / 2;
  const clipRects = lineW.map((_, k) => h('rect', {name: `${qid}${k}`, x: r(fx + size * 0.5), y: r(qfit ? qTop + k * qfit.lineHeight - 4 : fy), width: 0, height: r(qfit ? qfit.size + 8 : fh)}));
  parts.push(h('defs', null, h('clipPath', {id: ctx.id(qid)}, clipRects)));
  if (qfit) {
    parts.push(g({'clip-path': ctx.ref(qid)}, textBlock(qfit, {x: fx + size * 0.7, y: qTop, fill: th.ink})));
  } else {
    parts.push(g({'clip-path': ctx.ref(qid)}, h('rect', {x: r(fx + size * 0.7), y: r(fy + fh * 0.36), width: r(fw * 0.6), height: r(fh * 0.28), rx: 4, fill: th.inkFaint})));
  }
  const qW = lineW.reduce((a, b) => a + b, 0);
  const caretH = qfit ? qfit.size * 1.1 : fh * 0.56;
  parts.push(h('line', {name: `${prefix}-caret`, x1: 0, x2: 0, y1: 0, y2: r(caretH), stroke: th.accent2, 'stroke-width': 2.5, opacity: 0}));
  // results
  const top = fy + fh + 12;
  const n = o.results.length;
  const gap = 12;
  const rowH = Math.min(size * 2.9, (sy + sh - 10 - top - gap * (n - 1)) / n);
  const rowBoxes = [];
  const rowsNodes = o.results.map((res, i) => {
    const ry = top + i * (rowH + gap);
    const col = res.kind === 'source' ? C.src : C.com;
    const soft = res.kind === 'source' ? C.srcSoft : C.comSoft;
    const ic = {x: fx + 8, y: ry + rowH / 2};
    const icS = Math.min(size, rowH * 0.7);
    const icon = res.kind === 'source'
      ? g(null, h('rect', {x: r(ic.x), y: r(ic.y - icS * 0.62), width: r(icS * 0.95), height: r(icS * 1.24), rx: 2, fill: '#fff', stroke: col, 'stroke-width': 2.4}), h('rect', {x: r(ic.x), y: r(ic.y - icS * 0.62), width: r(icS * 0.95), height: r(icS * 0.3), fill: col}))
      : g(null, h('rect', {x: r(ic.x), y: r(ic.y - icS * 0.5), width: r(icS * 1.2), height: r(icS * 1.0), rx: 2, fill: '#fff', stroke: col, 'stroke-width': 2.4}), h('rect', {x: r(ic.x), y: r(ic.y - icS * 0.5), width: r(icS * 1.2), height: r(icS * 0.28), fill: col}));
    const tx = fx + 8 + size * 1.6;
    const tMax = fx + fw - tx - 8;
    let text;
    if (showAll) {
      // one line (shrinking a little) before wrapping to two lines sized to the row; a row never overflows
      let f = ctx.fit(res.text, {maxWidth: tMax, size: size * 0.82, minSize: size * 0.7, maxLines: 1, weight: 600});
      if (f.truncated) {
        const s2 = Math.min(size * 0.82, (rowH - 4) / 2.12);
        if (s2 >= 11) {
          const f2 = ctx.fit(res.text, {maxWidth: tMax, size: s2, minSize: s2, maxLines: 2, weight: 600, leading: 1.12});
          if (!f2.truncated || f2.size > f.size * 0.8) f = f2;
        }
      }
      text = textBlock(f, {x: tx, y: ry + (rowH - f.height) / 2, fill: th.ink});
    } else {
      text = g(null, bars(ctx, tx, ry + rowH * 0.34, tMax - 2, 2, 6, th.inkFaint, `${prefix}-r${i}`));
    }
    rowBoxes.push({x: fx, y: ry, w: fw, h: rowH, icon: ic, cy: ry + rowH / 2});
    return g({name: `${prefix}-r${i}`, opacity: 0},
      h('path', {name: `${prefix}-r${i}-hl`, d: roundRectPath(fx - 2, ry, fw + 4, rowH, 6), fill: soft, stroke: col, 'stroke-width': 2.5, opacity: 0}),
      icon, text);
  });
  // chain link between the first two rows (they stay separate rows)
  let link = null;
  if (n >= 2) {
    const lx = fx + fw - size * 1.1, ly = top + rowH + gap / 2;
    const L = size * 0.55;
    link = g({name: `${prefix}-link`, opacity: 0, transform: T(lx, ly, -60)},
      h('rect', {x: r(-L * 1.05), y: r(-L * 0.36), width: r(L * 1.3), height: r(L * 0.72), rx: r(L * 0.36), fill: 'none', stroke: C.link, 'stroke-width': 4}),
      h('rect', {x: r(-L * 0.25), y: r(-L * 0.36), width: r(L * 1.3), height: r(L * 0.72), rx: r(L * 0.36), fill: 'none', stroke: C.link, 'stroke-width': 4}));
  }
  /**
   * @param {{typed:number, rows:number[], hl:number[], link:number}} s
   */
  const frame = s => {
    const out = {};
    let rest = qW * s.typed;
    let caret = {x: fx + size * 0.7, y: qfit ? qTop - 2 : fy + fh * 0.22};
    lineW.forEach((lw, k) => {
      const tw = Math.max(0, Math.min(lw, rest));
      rest -= tw;
      out[`${qid}${k}`] = {width: r(tw > 0 ? tw + 4 : 0)};
      if (tw > 0) caret = {x: fx + size * 0.7 + tw + 3, y: qfit ? qTop + k * qfit.lineHeight - 2 : fy + fh * 0.22};
    });
    out[`${prefix}-caret`] = {transform: T(caret.x, caret.y), opacity: s.typed > 0 && s.typed < 1 ? 1 : 0};
    o.results.forEach((_, i) => {
      out[`${prefix}-r${i}`] = {opacity: r(s.rows[i] ?? 0, 3)};
      out[`${prefix}-r${i}-hl`] = {opacity: r(s.hl[i] ?? 0, 3)};
    });
    if (link) out[`${prefix}-link`] = {opacity: r(s.link, 3)};
    return out;
  };
  return {node: g({name: prefix}, parts, rowsNodes, link), frame, rowBoxes, box: {x, y, w, h: hh}};
}

/* --------------------------------------------------------- wall backdrop */

/**
 * Reading-room wall with a dado rail and a floor band (no clip; objects stand
 * on `floorY`).
 * @param {any} ctx
 * @param {{x:number, y:number, w:number, h:number, floorY:number}} o
 */
export function wallBackdrop(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const {x, y, w, floorY} = o;
  const hh = o.h;
  const dado = floorY - (floorY - y) * 0.2;
  return g(null,
    h('path', {d: roundRectPath(x, y, w, hh, 24), fill: C.wall}),
    h('rect', {x: r(x), y: r(dado), width: r(w), height: r(floorY - dado), fill: C.wallLow}),
    h('rect', {x: r(x), y: r(dado - 5), width: r(w), height: 10, fill: th.woodTop, stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: `M${r(x)} ${r(floorY)}H${r(x + w)}V${r(y + hh - 24)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - 24)} ${r(y + hh)}H${r(x + 24)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - 24)}Z`, fill: shade(th.wood, 0.25)}),
    h('line', {x1: r(x), x2: r(x + w), y1: r(floorY), y2: r(floorY), stroke: th.ink, 'stroke-width': 2}),
  );
}

/* ------------------------------------------------------------ state chip */

/**
 * Descriptive state tag with a coloured dot; wraps to `maxLines` so long
 * names keep their meaning (statusTag in annotate.js is single-line).
 * @param {any} ctx
 * @param {string} text
 * @param {{x:number, y:number, anchor?:'start'|'middle'|'end', size?:number, color:string, ink?:string, fill?:string, maxWidth:number, maxLines?:number, name?:string, opacity?:number}} o
 */
export function stateChip(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size ?? 22;
  const padX = size * 0.6;
  const dot = size * 0.9;
  const maxW = o.maxWidth - padX * 2 - dot;
  let fit;
  if (Array.isArray(text)) {
    // segments: one line when they fit, otherwise one segment per line (names never split)
    const one = ctx.fit(text.join(' '), {maxWidth: maxW, size, minSize: size * 0.9, maxLines: 1, weight: 700});
    if (!one.truncated || (o.maxLines ?? 2) < 2) fit = one;
    else {
      // one segment per line; a segment that still does not fit wraps at its own word breaks
      const parts = text.map(t => ctx.fit(t, {maxWidth: maxW, size, minSize: size * 0.8, maxLines: 1, weight: 700}));
      const sz = Math.min(...parts.map(q => q.size));
      const segs = text.map(t => {
        const one1 = ctx.fit(t, {maxWidth: maxW, size: sz, minSize: sz, maxLines: 1, weight: 700});
        return one1.truncated ? ctx.fit(t, {maxWidth: maxW, size: sz, minSize: sz, maxLines: 2, weight: 700}) : one1;
      });
      const lines = segs.flatMap(q => q.lines);
      fit = {...segs[0], lines, width: Math.max(...segs.map(q => q.width)), height: segs[0].lineHeight * (lines.length - 1) + sz, truncated: segs.some(q => q.truncated), full: text.join(' ')};
    }
  } else fit = ctx.fit(text, {maxWidth: maxW, size, minSize: size * 0.8, maxLines: o.maxLines ?? 2, weight: 700});
  const w = fit.width + padX * 2 + dot;
  const hh = fit.height + size * 0.72;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.9)), fill: o.fill ?? th.card, stroke: o.color, 'stroke-width': 2.2}),
    h('circle', {cx: r(x + padX + size * 0.22), cy: r(o.y + size * 0.36 + fit.size * 0.5), r: r(size * 0.26), fill: o.color}),
    textBlock(fit, {x: x + padX + dot, y: o.y + size * 0.36, fill: o.ink ?? o.color, letterSpacing: 0.3}),
  );
  return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}, fit};
}

/** Does segment a→b cross (or touch within pad) the box? (sampled; for label leaders) */
export function segmentHitsBox(a, b, box, pad = 4) {
  const n = 24;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    if (x > box.x - pad && x < box.x + box.w + pad && y > box.y - pad && y < box.y + box.h + pad) return true;
  }
  return false;
}

/**
 * Name chip for an actor: "Name · Role" on one line when it fits, otherwise
 * the name on the first line and the role on the second (never split mid-name).
 * @param {any} ctx
 * @param {string[]} segs  [name, role?]
 * @param {{x:number, y:number, anchor?:'start'|'middle'|'end', size?:number, maxWidth:number, name?:string}} o
 */
export function nameChip(ctx, segs, o) {
  const th = ctx.theme;
  const size = o.size ?? 26;
  const padX = size * 0.6, padY = size * 0.36;
  const maxW = o.maxWidth - padX * 2;
  const one = ctx.fit(segs.join(' · '), {maxWidth: maxW, size, minSize: size * 0.88, maxLines: 1, weight: 600});
  let fit = one;
  if (one.truncated && segs.length > 1) {
    const a = ctx.fit(segs[0], {maxWidth: maxW, size, minSize: size * 0.78, maxLines: 1, weight: 600});
    const b = ctx.fit(segs[1], {maxWidth: maxW, size: a.size, minSize: a.size * 0.8, maxLines: 1, weight: 600});
    const sz = Math.min(a.size, b.size);
    const la = ctx.fit(segs[0], {maxWidth: maxW, size: sz, minSize: sz, maxLines: 1, weight: 600});
    const lb = ctx.fit(segs[1], {maxWidth: maxW, size: sz, minSize: sz, maxLines: 1, weight: 600});
    fit = {...la, lines: [la.lines[0], lb.lines[0]], width: Math.max(la.width, lb.width), height: la.lineHeight + sz, truncated: la.truncated || lb.truncated, full: segs.join(' · ')};
  }
  const w = fit.width + padX * 2, hh = fit.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    textBlock(fit, {x: x + w / 2, y: o.y + padY, anchor: 'middle', fill: th.ink}));
  return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}, fit};
}

/** True when a fitted text had to split a single word across lines. */
export function brokeWord(fit) {
  if (!fit || !fit.lines || fit.lines.length < 2 || typeof fit.full !== 'string') return false;
  const norm = t => t.replace(/\s+/g, ' ').trim();
  return norm(fit.lines.join(' ')) !== norm(fit.full);
}

/**
 * Pick the first candidate label whose box is inside `bounds`, clear of
 * every obstacle box and of every sampled point (connector / tracer paths);
 * otherwise the candidate with the least overlap.
 * @template T
 * @param {Array<any>} cands
 * @param {(c:any) => (T & {box:{x:number,y:number,w:number,h:number}})} make
 * @param {{obstacles?:Array<{x:number,y:number,w:number,h:number}>, points?:Array<{x:number,y:number}>, bounds?:{x:number,y:number,w:number,h:number}, pad?:number, pointPad?:number}} o
 * @returns {T & {box:any, clean:boolean}}
 */
export function placeFirst(cands, make, o = {}) {
  const pad = o.pad ?? 8;
  const pp = o.pointPad ?? 10;
  const obs = o.obstacles || [];
  const pts = o.points || [];
  const B = o.bounds;
  const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  let best = null, bestScore = Infinity;
  for (const c of cands) {
    const res = make(c);
    const b = res.box;
    const out = B ? Math.max(0, B.x - b.x) + Math.max(0, b.x + b.w - B.x - B.w) + Math.max(0, B.y - b.y) + Math.max(0, b.y + b.h - B.y - B.h) : 0;
    const grown = {x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2};
    const ov = obs.reduce((a, q) => a + area(grown, q), 0);
    const hits = pts.filter(q => q.x > b.x - pp && q.x < b.x + b.w + pp && q.y > b.y - pp && q.y < b.y + b.h + pp).length;
    // a label that had to be cut (ellipsis) or split inside a word loses meaning: only a last resort
    const cut = res.fit && (res.fit.truncated || brokeWord(res.fit)) ? 1 : 0;
    if (out === 0 && ov === 0 && hits === 0 && !cut) return {...res, clean: true};
    const score = out * 1000 + ov + hits * 400 + cut * 50000;
    if (score < bestScore) { bestScore = score; best = res; }
  }
  return {...best, clean: false};
}

/**
 * Candidate label positions in rings around a box (for leader-attached labels
 * when the planned slots are taken). Each candidate carries the anchor point
 * on the box edge nearest to it.
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {{step?:number, rings?:number, gap?:number}} [o]
 */
export function ringCands(box, o = {}) {
  const step = o.step ?? 28, rings = o.rings ?? 8, gap = o.gap ?? 14;
  const out = [];
  for (let k = 0; k < rings; k++) {
    const d = gap + k * step;
    const pts = [
      {x: box.x + box.w / 2, y: box.y - d, a: 'middle', v: 'above'}, {x: box.x + box.w / 2, y: box.y + box.h + d, a: 'middle', v: 'below'},
      {x: box.x - d, y: box.y + box.h / 2, a: 'end', v: 'mid'}, {x: box.x + box.w + d, y: box.y + box.h / 2, a: 'start', v: 'mid'},
      {x: box.x, y: box.y - d, a: 'start', v: 'above'}, {x: box.x + box.w, y: box.y - d, a: 'end', v: 'above'},
      {x: box.x, y: box.y + box.h + d, a: 'start', v: 'below'}, {x: box.x + box.w, y: box.y + box.h + d, a: 'end', v: 'below'},
      {x: box.x - d, y: box.y - d * 0.5, a: 'end', v: 'above'}, {x: box.x + box.w + d, y: box.y - d * 0.5, a: 'start', v: 'above'},
      {x: box.x - d, y: box.y + box.h + d * 0.5, a: 'end', v: 'below'}, {x: box.x + box.w + d, y: box.y + box.h + d * 0.5, a: 'start', v: 'below'},
    ];
    out.push(...pts);
  }
  return out;
}

/**
 * Comparison guide along a polyline with rounded corners (plain relation
 * style: no arrowhead, end dots), drawn on by arc length.
 * @param {string} name
 * @param {Array<{x:number,y:number}>} pts
 * @param {number} rad corner radius
 * @param {string} color
 */
export function polyGuide(name, pts, rad, color) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  const samples = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const la = Math.hypot(b.x - a.x, b.y - a.y) || 1, lc = Math.hypot(c.x - b.x, c.y - b.y) || 1;
    const rr = Math.min(rad, la / 2, lc / 2);
    const p1 = {x: b.x + ((a.x - b.x) / la) * rr, y: b.y + ((a.y - b.y) / la) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / lc) * rr, y: b.y + ((c.y - b.y) / lc) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    samples.push(p1);
    for (let k = 1; k <= 6; k++) {
      const t = k / 6;
      samples.push({x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * b.x + t * t * p2.x, y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * b.y + t * t * p2.y});
    }
  }
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  samples.push(last);
  const cum = [0];
  for (let i = 1; i < samples.length; i++) cum.push(cum[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const at = t => {
    const L = Math.max(0, Math.min(1, t)) * total;
    let i = 1;
    while (i < samples.length - 1 && cum[i] < L) i++;
    const f = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return {x: samples[i - 1].x + (samples[i].x - samples[i - 1].x) * f, y: samples[i - 1].y + (samples[i].y - samples[i - 1].y) * f};
  };
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: r(pts[0].x), cy: r(pts[0].y), r: 6, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(last.x), cy: r(last.y), r: 6, fill: color, opacity: 0}));
  const frame = (pr, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - pr))},
    [`${name}-dotA`]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: pr >= 0.985 ? 1 : 0},
  });
  return {node, frame, at, total, from: pts[0], to: last, samples};
}

/**
 * Scenario header for paired scenes: letter badge + label + caption, with the
 * caption set clear of the label's descenders and allowed two lines (instead
 * of shrinking to an unreadable size).
 * @param {any} ctx
 * @param {{name:string, letter:string, label:string, caption?:string, x:number, y:number, w:number, h:number, color:string, size?:number}} o
 */
export function scenarioTitle(ctx, o) {
  const th = ctx.theme;
  const size = o.size ?? Math.min(46, o.h * 0.42);
  const badgeR = size * 0.74;
  const tx = o.x + badgeR * 2 + 16;
  const mw = o.w - badgeR * 2 - 22;
  const parts = [
    h('circle', {cx: r(o.x + badgeR), cy: r(o.y + badgeR + 2), r: r(badgeR), fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: r(o.x + badgeR), y: r(o.y + badgeR + 2 + size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
  ];
  let y = o.y + 2;
  if (ctx.show('key')) {
    const f = ctx.fit(o.label, {maxWidth: mw, size, minSize: size * 0.72, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: tx, y, fill: th.fg}));
    y += f.size * 1.3;
  }
  if (o.caption && ctx.show('all')) {
    const room = o.y + o.h - y;
    let cs = Math.max(18, size * 0.56);
    let f2 = ctx.fit(o.caption, {maxWidth: mw, size: cs, minSize: cs * 0.9, maxLines: 1, weight: 500});
    if (f2.truncated) {
      cs = Math.max(16, Math.min(cs, room / 2.3));
      f2 = ctx.fit(o.caption, {maxWidth: mw, size: cs, minSize: 16, maxLines: 2, weight: 500});
    }
    parts.push(textBlock(f2, {x: tx, y, fill: th.fgSoft}));
  }
  return g({name: o.name}, parts);
}
