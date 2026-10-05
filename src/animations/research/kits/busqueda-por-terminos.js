/**
 * Library search stage for the "Búsqueda por términos" motif (LAW-0041..0044).
 *
 * Original vector objects drawn for this motif:
 *  - a library bookcase with one open volume (source document) per shelf,
 *    a brass plate under each volume and seeded book spines beside it;
 *  - an open volume: left page = identifier, title, date; right page = the
 *    passages. A matched word gets a highlighter mark and the page edge gets
 *    a sticky index tab at that passage's line;
 *  - a standing search kiosk (the "buscador"): screen with a search box whose
 *    term chips are typed in, an optional related-wording dropdown
 *    (contextual mode), a keyboard tray and a card printer slot on top;
 *  - a library index card (the "ficha") that rises out of the printer slot,
 *    one citation line per recorded passage;
 *  - threads: each match is linked by a thread from its term chip (or the
 *    related word in the dropdown) to the tab on the page edge; a token with
 *    the word travels along the thread and becomes the tab.
 *
 * Matches are COMPUTED from the supplied query and passage text (see
 * findMatches); nothing about which passage matches is hardcoded.
 *
 * The kit owns geometry and a pose solver (action values → node props).
 * Each entry owns its own timeline, layout and semantics.
 * Attachment rules (asserted by tests through semantics):
 *  - a token starts on its chip and ends exactly on its tab end (thread end);
 *  - the researcher's hand is solved by IK and stays on the keyboard while
 *    typing; the index card only moves out of the slot, never teleports.
 * @module animations/research/kits/busqueda-por-terminos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, cubicPolyline, roundRectPath} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

/** Lower-case, accent-free, punctuation-trimmed form of a word. */
export function normWord(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

/** Whitespace tokens exactly as the text wrapper splits them. */
export function wordsOf(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
}

function findPhrase(toks, phrase) {
  const words = wordsOf(phrase).map(normWord).filter(Boolean);
  if (!words.length) return -1;
  for (let i = 0; i + words.length <= toks.length; i++) {
    if (words.every((w, k) => toks[i + k] === w)) return i;
  }
  return -1;
}

/**
 * Matches between query terms and passages.
 * One match per passage at most: exact wins over contextual, then the first
 * term in query order. Sorted exact-first, then by term, source, passage (the
 * order in which scenes animate and print them).
 * @param {{terms:Array<{text:string, related?:string[]}>}} query
 * @param {Array<{id:string, passages:string[]}>} sources
 * @param {'exact'|'contextual'} mode
 * @returns {Array<{term:number, source:number, passage:number, kind:'exact'|'contextual', word:string, tokens:[number,number], related:number}>}
 */
export function findMatches(query, sources, mode) {
  const out = [];
  sources.forEach((src, s) => src.passages.forEach((text, p) => {
    const toks = wordsOf(text).map(normWord);
    let found = null;
    for (let ti = 0; ti < query.terms.length && !found; ti++) {
      const t = query.terms[ti];
      const i = findPhrase(toks, t.text);
      if (i >= 0) found = {term: ti, source: s, passage: p, kind: 'exact', word: t.text, tokens: [i, i + wordsOf(t.text).length], related: -1};
    }
    if (!found && mode === 'contextual') {
      for (let ti = 0; ti < query.terms.length && !found; ti++) {
        const rel = query.terms[ti].related || [];
        for (let ri = 0; ri < rel.length && !found; ri++) {
          const i = findPhrase(toks, rel[ri]);
          if (i >= 0) found = {term: ti, source: s, passage: p, kind: 'contextual', word: rel[ri], tokens: [i, i + wordsOf(rel[ri]).length], related: ri};
        }
      }
    }
    if (found) out.push(found);
  }));
  const rank = k => (k === 'exact' ? 0 : 1);
  return out.sort((a, b) => rank(a.kind) - rank(b.kind) || a.term - b.term || a.source - b.source || a.passage - b.passage);
}

/** Key identifying the same visual match across scenes/states. */
export const matchKey = m => `${m.source}:${m.passage}:${m.term}:${m.kind}:${m.tokens[0]}`;

/** Term colours (index = term order). */
export function termPalette(ctx) {
  const th = ctx.theme;
  return [
    {c: th.accent, soft: th.accentSoft},
    {c: th.accent2, soft: th.accent2Soft},
    {c: th.accent4, soft: th.accent4Soft},
  ];
}

/* ------------------------------------------------------------------ */
/* Bookcase                                                            */
/* ------------------------------------------------------------------ */

const BOOK_COLORS = ['#7d5a44', '#55684c', '#6f4f5c', '#3f5a70', '#9a7f4f', '#5d6356', '#846a58', '#4b5563', '#8a5a3c', '#566b6b'];

const BC = {post: 26, crown: 40, plinth: 56, board: 16};

/** Pure level geometry of a bookcase (same numbers the drawing uses). */
export function bookcaseLevels(w, hh, n, bookW) {
  const inner = {x: BC.post, y: BC.crown, w: w - BC.post * 2, h: hh - BC.crown - BC.plinth};
  const levelH = inner.h / n;
  return Array.from({length: n}, (_, i) => {
    const top = inner.y + i * levelH;
    return {x0: inner.x, x1: inner.x + inner.w, top, floor: top + levelH - (i === n - 1 ? 0 : BC.board), bookEnd: inner.x + bookW};
  });
}

/**
 * Bookcase with `n` levels. Local origin = top-left of the carcass.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, n:number, bookW:number, seedKey?:string, crownLabel?:string, plates?:string[], plateAt?:number[]}} o
 */
export function bookcase(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const key = o.seedKey || 'bookcase';
  const {w, h: hh, n} = o;
  const {post, crown, plinth, board} = BC;
  const inner = {x: post, y: crown, w: w - post * 2, h: hh - crown - plinth};
  const levelH = inner.h / n;
  const wood = '#a87b52';
  const woodDark = shade(wood, -0.28);
  const back = shade(wood, -0.42);
  const parts = [];
  parts.push(h('path', {d: roundRectPath(10, 12, w, hh, 8), fill: th.shadow}));
  // carcass
  parts.push(h('rect', {x: 0, y: 0, width: w, height: hh, rx: 6, fill: wood, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('rect', {x: inner.x, y: inner.y, width: inner.w, height: inner.h, fill: back, stroke: th.ink, 'stroke-width': 2}));
  // crown moulding and plinth
  parts.push(h('path', {d: roundRectPath(-10, -6, w + 20, crown + 4, 6), fill: shade(wood, 0.06), stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('line', {x1: -4, x2: w + 4, y1: crown - 12, y2: crown - 12, stroke: woodDark, 'stroke-width': 3}));
  parts.push(h('rect', {x: -4, y: hh - plinth, width: w + 8, height: plinth, rx: 4, fill: shade(wood, -0.08), stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('rect', {x: w * 0.08, y: hh - plinth + 14, width: w * 0.84, height: plinth - 28, rx: 3, fill: 'none', stroke: woodDark, 'stroke-width': 2}));
  const levels = [];
  for (let i = 0; i < n; i++) {
    const top = inner.y + i * levelH;
    const floor = top + levelH - (i === n - 1 ? 0 : board);
    // back panel grain
    parts.push(h('path', {d: `M${inner.x} ${r(top + levelH * 0.35)}C${r(inner.x + inner.w * 0.3)} ${r(top + levelH * 0.3)} ${r(inner.x + inner.w * 0.6)} ${r(top + levelH * 0.42)} ${r(inner.x + inner.w)} ${r(top + levelH * 0.36)}`, fill: 'none', stroke: shade(back, 0.08), 'stroke-width': 2, opacity: 0.7}));
    // books
    const books = [];
    let bx = inner.x + 10;
    let bi = 0;
    const bookEnd = inner.x + o.bookW;
    const avail = floor - top - 18;
    while (bx < bookEnd - 16) {
      const R = k => ctx.rng(`${key}-${k}`, i * 40 + bi);
      const bw = Math.min(bookEnd - bx, 18 + R('w') * 18);
      if (bw < 14) break;
      const bh = avail * (0.6 + R('h') * 0.34);
      const col = BOOK_COLORS[Math.floor(R('c') * BOOK_COLORS.length)];
      const y0 = floor - bh;
      books.push(g(null,
        h('rect', {x: r(bx), y: r(y0), width: r(bw), height: r(bh), rx: 2.5, fill: col, stroke: th.ink, 'stroke-width': 2}),
        h('line', {x1: r(bx + 2), x2: r(bx + bw - 2), y1: r(y0 + bh * 0.14), y2: r(y0 + bh * 0.14), stroke: shade(col, 0.35), 'stroke-width': 2.5}),
        h('line', {x1: r(bx + 2), x2: r(bx + bw - 2), y1: r(y0 + bh * 0.82), y2: r(y0 + bh * 0.82), stroke: shade(col, 0.35), 'stroke-width': 2.5}),
        h('rect', {x: r(bx + bw * 0.3), y: r(y0 + bh * 0.32), width: r(bw * 0.4), height: r(bh * 0.28), rx: 1.5, fill: shade(col, 0.5), opacity: 0.55}),
      ));
      bx += bw + 1.5;
      bi++;
    }
    parts.push(g(null, books));
    // shelf board (front edge)
    if (i < n - 1) {
      parts.push(h('rect', {x: inner.x - 2, y: floor, width: inner.w + 4, height: board, fill: shade(wood, 0.04), stroke: th.ink, 'stroke-width': 2}));
      parts.push(h('line', {x1: inner.x, x2: inner.x + inner.w, y1: floor + 4, y2: floor + 4, stroke: shade(wood, 0.25), 'stroke-width': 2}));
    }
    levels.push({x0: inner.x, x1: inner.x + inner.w, top, floor, bookEnd: inner.x + o.bookW});
  }
  // brass plates under each volume
  const plates = (o.plates || []).map((txt, i) => {
    const L = levels[i];
    if (!L) return null;
    const cx = o.plateAt && Number.isFinite(o.plateAt[i]) ? o.plateAt[i] : (L.bookEnd + L.x1) / 2;
    const py = i < n - 1 ? L.floor + 1 : hh - plinth + 6;
    const pw = 110, ph = 14;
    // decorative engraving only (the identifier is printed large on the volume)
    return g(null,
      h('rect', {x: r(cx - pw / 2), y: r(py), width: pw, height: ph, rx: 2, fill: '#d6b25e', stroke: shade('#d6b25e', -0.45), 'stroke-width': 1.5}),
      h('rect', {x: r(cx - 26), y: r(py + 5), width: 52, height: 4, rx: 2, fill: '#8a6d2a'}),
      h('circle', {cx: r(cx - pw / 2 + 6), cy: r(py + ph / 2), r: 1.8, fill: '#8a6d2a'}),
      h('circle', {cx: r(cx + pw / 2 - 6), cy: r(py + ph / 2), r: 1.8, fill: '#8a6d2a'}),
    );
  });
  // crown label plate
  let crownNode = null;
  if (o.crownLabel && ctx.show('key')) {
    const f = ctx.fit(o.crownLabel, {maxWidth: w * 0.6, size: 24, minSize: 16, maxLines: 1, weight: 700, family: 'serif'});
    const cw = f.width + 40;
    crownNode = g(null,
      h('rect', {x: r(w / 2 - cw / 2), y: -2, width: r(cw), height: crown - 8, rx: 4, fill: '#efe3c4', stroke: th.ink, 'stroke-width': 2}),
      textBlock(f, {x: w / 2, y: (crown - 8 - f.size) / 2 - 1, anchor: 'middle', fill: th.ink, letterSpacing: 1}),
    );
  }
  return {node: g({name: P}, parts, plates, crownNode), levels, inner, levelH, w, h: hh};
}

/* ------------------------------------------------------------------ */
/* Open volume (source document)                                       */
/* ------------------------------------------------------------------ */

const COVER_COLORS = ['#6d3b3b', '#2f4f6b', '#4d5e3a', '#5b4a6e'];

/**
 * An open volume standing on a book cradle. Local origin = top-left of the
 * spread (pages). The right page holds the passages; matches get a
 * highlighter mark and a sticky tab on the right page edge.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, index:number, source:{id:string,title:string,passages:string[]}, date?:string,
 *   matches:Array<{key:string, passage:number, tokens:[number,number], kind:string, color:{c:string,soft:string}}>,
 *   altPassage?:{passage:number, text:string, matches:Array<any>}, tabLen?:number}} o
 */
export function volume(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const showText = ctx.show('all');
  // left page (identifier, title, date) may be narrower than the passage page
  const pw = w * (o.split ?? 0.5);
  const pad = Math.max(12, Math.min(22, w * 0.03));
  const cover = COVER_COLORS[o.index % COVER_COLORS.length];
  const paper = th.paper;
  const parts = [];
  // cradle (book stand)
  parts.push(h('path', {d: `M${r(w * 0.06)} ${hh + 4}L${r(w * 0.94)} ${hh + 4}L${r(w * 0.9)} ${hh + 18}L${r(w * 0.1)} ${hh + 18}Z`, fill: '#8e6441', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: roundRectPath(8, 10, w, hh, 6), fill: th.shadow}));
  // covers peeking out, page block edges
  parts.push(h('path', {d: `M-8 -4H${w + 8}V${hh + 6}H-8Z`, fill: cover, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M-2 2H${r(pw)}V${hh + 2}H-2Z`, fill: shade(paper, -0.1), stroke: th.ink, 'stroke-width': 1.5}));
  parts.push(h('path', {d: `M${r(pw)} 2H${w + 2}V${hh + 2}H${r(pw)}Z`, fill: shade(paper, -0.1), stroke: th.ink, 'stroke-width': 1.5}));
  // pages (slight bow toward the gutter)
  parts.push(h('path', {d: `M0 0Q${r(pw * 0.5)} -5 ${r(pw)} 4V${hh}Q${r(pw * 0.5)} ${hh - 4} 0 ${hh}Z`, fill: paper, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(pw)} 4Q${r((pw + w) / 2)} -5 ${w} 0V${hh}Q${r((pw + w) / 2)} ${hh - 4} ${r(pw)} ${hh}Z`, fill: paper, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  parts.push(h('rect', {x: r(pw - 10), y: 4, width: 20, height: hh - 4, fill: '#000', opacity: 0.06}));
  parts.push(h('line', {x1: r(pw), x2: r(pw), y1: 4, y2: hh, stroke: th.ink, 'stroke-width': 1.5, opacity: 0.6}));

  // --- left page: identifier, title, date (bars when text is hidden).
  // `brief` (paired scenes): the narrow left page carries the identifier
  // only, larger, over a few ruled bars; the passages get the room.
  const L = [];
  if (o.brief) {
    const lx = pad, lw = pw - pad * 2;
    const idSize = Math.min(o.idCap ?? 34, Math.max(15, hh * 0.16));
    const idFit = ctx.fit(o.source.id, {maxWidth: lw, size: idSize, minSize: 12, maxLines: 1, weight: 700, family: 'mono'});
    if (showText) L.push(textBlock(idFit, {x: lx, y: pad, fill: cover}));
    else L.push(h('rect', {x: lx, y: pad + 2, width: r(Math.min(lw, idFit.width)), height: r(idSize * 0.7), rx: 3, fill: cover, opacity: 0.8}));
    let by = pad + idFit.size * 1.35;
    L.push(h('line', {x1: lx, x2: lx + lw, y1: r(by), y2: r(by), stroke: th.paperLine, 'stroke-width': 2}));
    by += 14;
    for (let b = 0; by + 7 < hh - pad && b < 8; b++) {
      L.push(h('rect', {x: lx, y: r(by), width: r(lw * (0.55 + ctx.rng(`${P}-lbar`, b) * 0.4)), height: 5, rx: 2.5, fill: th.paperLine}));
      by += 15;
    }
  } else {
    const lx = pad;
    const lw = pw - pad * 2;
    let ly = pad;
    const idSize = Math.min(30, Math.max(15, hh * 0.125));
    const idFit = ctx.fit(o.source.id, {maxWidth: lw, size: idSize, minSize: 12, maxLines: 1, weight: 700, family: 'mono'});
    if (showText) L.push(textBlock(idFit, {x: lx, y: ly, fill: cover}));
    else L.push(h('rect', {x: lx, y: ly + 2, width: r(Math.min(lw, idFit.width)), height: r(idSize * 0.7), rx: 3, fill: cover, opacity: 0.8}));
    ly += idSize * 1.35;
    L.push(h('line', {x1: lx, x2: lx + lw, y1: r(ly), y2: r(ly), stroke: th.paperLine, 'stroke-width': 2}));
    ly += 8;
    // never break a word across lines: shrink (bounded) until the longest word fits
    const longestWord = (t, sz, wt, fam) => Math.max(0, ...wordsOf(t).map(wd => ctx.measure(wd, sz, wt, fam)));
    let titleSize = Math.min(26, Math.max(14, hh * 0.108));
    while (titleSize > 12 && longestWord(o.source.title, titleSize, 700, 'serif') > lw) titleSize -= 0.5;
    // the title may take up to four lines of the room above the date (filler
    // bars give way); it shrinks (bounded) before it is ever cut short
    const dateSize0 = Math.min(22, Math.max(12, hh * 0.09));
    const titleRoom = hh - pad - (o.date ? dateSize0 * 1.6 : 0) - ly - 4;
    const titleMin = Math.max(12, titleSize * 0.72);
    let titleFit = null;
    for (let sz = titleSize; sz >= titleMin - 1e-6 && !titleFit; sz -= 0.5) {
      const f = ctx.fit(o.source.title, {maxWidth: lw, size: sz, minSize: sz, maxLines: 4, weight: 700, family: 'serif'});
      if (!f.truncated && f.height <= titleRoom) titleFit = f;
    }
    if (!titleFit) titleFit = ctx.fit(o.source.title, {maxWidth: lw, size: titleMin, minSize: titleMin, maxLines: Math.max(1, Math.min(4, Math.floor((titleRoom + titleMin * 0.18) / (titleMin * 1.18)))), weight: 700, family: 'serif'});
    if (showText) L.push(textBlock(titleFit, {x: lx, y: ly, fill: th.ink}));
    else titleFit.lines.forEach((ln, i) => L.push(h('rect', {x: lx, y: r(ly + i * titleFit.lineHeight + 3), width: r(ctx.measure(ln, titleFit.size, 700, 'serif')), height: r(titleFit.size * 0.62), rx: 3, fill: th.ink, opacity: 0.75})));
    ly += titleFit.height + 10;
    // filler text bars
    const dateSize = Math.min(22, Math.max(12, hh * 0.09));
    const barsEnd = hh - pad - (o.date ? dateSize * 1.6 : 0);
    for (let b = 0; ly + 7 < barsEnd && b < 6; b++) {
      const bw = lw * (0.62 + ctx.rng(`${P}-lbar`, b) * 0.36);
      L.push(h('rect', {x: lx, y: r(ly), width: r(bw), height: 5, rx: 2.5, fill: th.paperLine}));
      ly += 13;
    }
    if (o.date) {
      const df = ctx.fit(o.date, {maxWidth: lw, size: dateSize, minSize: 11, maxLines: 1, weight: 600});
      const dy = hh - pad - df.size;
      L.push(h('path', {d: `M${lx} ${r(dy + df.size * 0.5)}h10`, stroke: th.inkSoft, 'stroke-width': 2}));
      if (showText) L.push(textBlock(df, {x: lx + 16, y: dy, fill: th.inkSoft}));
      else L.push(h('rect', {x: lx + 16, y: r(dy + 3), width: r(df.width), height: r(df.size * 0.6), rx: 3, fill: th.inkSoft, opacity: 0.6}));
    }
  }
  parts.push(g(null, L));

  // --- right page: passages
  const x0 = pw + pad;
  const size0 = Math.min(o.textCap ?? 26, Math.max(13, hh * (o.textCap ? 0.2 : 0.13)));
  const numW = Math.max(24, size0 * (o.brief ? 1.25 : 1.6));
  const tx = x0 + numW;
  const tw = w - pad - tx;
  const n = o.source.passages.length;
  const padY = Math.min(pad, 14);
  const availH = hh - padY * 2;
  // one common size for every passage on the page
  let size = size0;
  const minSize = 12;
  const fitAt = (t, s) => ctx.fit(t, {maxWidth: tw, size: s, minSize: s, maxLines: 3, weight: 500, family: 'serif', leading: 1.2});
  const layoutAt = s => o.source.passages.map(t => fitAt(t, s));
  // a substituted passage (inspect) reserves room for its longer wording too
  const rowH = (f, i, s) => (o.altPassage && o.altPassage.passage === i ? Math.max(f.height, fitAt(o.altPassage.text, s).height) : f.height);
  let fits = layoutAt(size);
  const need = fs => fs.reduce((a, f, i) => a + rowH(f, i, size), 0) + (n - 1) * size * 0.5;
  // shrink (bounded) while the page overflows or a passage would be cut short
  while ((need(fits) > availH || fits.some(f => f.truncated)) && size > minSize) {
    size = Math.max(minSize, size - 0.5);
    fits = layoutAt(size);
  }
  const gap = Math.max(size * 0.5, Math.min(size * 1.4, (availH - fits.reduce((a, f, i) => a + rowH(f, i, size), 0)) / Math.max(1, n)));
  let py = padY + gap * 0.35;
  const rows = fits.map((f, i) => {
    const hRow = rowH(f, i, size);
    const row = {y: py, h: hRow, fit: f};
    py += hRow + gap;
    return row;
  });
  const lineMid = (row, li) => row.y + li * row.fit.lineHeight + row.fit.size * 0.5;
  /** rects covering tokens [a,b) of a fitted text */
  const tokenRects = (fit, row, tokens, xStart) => {
    const lineWords = fit.lines.map(l => wordsOf(l.replace(/…$/, '')));
    const out = [];
    let idx = 0;
    lineWords.forEach((ws, li) => {
      const a = Math.max(tokens[0], idx), b = Math.min(tokens[1], idx + ws.length);
      if (a < b) {
        const pre = ws.slice(0, a - idx).join(' ');
        const word = ws.slice(a - idx, b - idx).join(' ').replace(/[.,;:!?…)\]"'»”’]+$/, '');
        const px = pre ? ctx.measure(`${pre} `, fit.size, fit.weight, fit.family) : 0;
        const ww = Math.max(8, ctx.measure(word, fit.size, fit.weight, fit.family));
        out.push({x: xStart + px - 3, y: row.y + li * fit.lineHeight - fit.size * 0.08, w: ww + 6, h: fit.size * 1.12, line: li});
      }
      idx += ws.length;
    });
    if (!out.length) {
      // matched word fell into the truncated tail: mark the end of the last line
      const li = fit.lines.length - 1;
      const lw2 = ctx.measure(fit.lines[li], fit.size, fit.weight, fit.family);
      out.push({x: xStart + Math.max(0, lw2 - 40), y: row.y + li * fit.lineHeight - fit.size * 0.08, w: 40, h: fit.size * 1.12, line: li});
    }
    return out;
  };

  const tabLen = o.tabLen ?? 38;
  const tabH = Math.max(18, Math.min(28, size * 1.2));
  const mk = (m, row, fit, pref) => {
    const rects = tokenRects(fit, row, m.tokens, tx);
    const rowY = lineMid(row, rects[0].line);
    const contextual = m.kind === 'contextual';
    const hl = rects.map((q, j) => h('rect', {name: `${pref}-hl${j}`, x: r(q.x), y: r(q.y), width: 0, height: r(q.h), rx: 3, fill: contextual ? m.color.soft : m.color.c, 'fill-opacity': contextual ? 0.95 : 0.3}));
    const ul = rects.map((q, j) => h('path', {name: `${pref}-ul${j}`, d: `M${r(q.x + 2)} ${r(q.y + q.h + 1)}h${r(q.w - 4)}`, fill: 'none', stroke: m.color.c, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': contextual ? '2 6' : null, opacity: 0}));
    const tab = {x: w - 10, y: rowY - tabH / 2, w: tabLen + 10, h: tabH};
    const tabNode = g({name: `${pref}-tab`, opacity: 0},
      h('path', {d: roundRectPath(tab.x, tab.y, tab.w, tab.h, 4), fill: contextual ? th.paper : m.color.c, stroke: contextual ? m.color.c : th.ink, 'stroke-width': contextual ? 3 : 1.8, 'stroke-dasharray': contextual ? '5 4' : null}),
      contextual ? h('path', {d: `M${r(tab.x + 14)} ${r(tab.y + tab.h - 4)}l8 -${r(tab.h - 8)}M${r(tab.x + 26)} ${r(tab.y + tab.h - 4)}l8 -${r(tab.h - 8)}`, stroke: m.color.c, 'stroke-width': 2.5, 'stroke-linecap': 'round'}) : null,
    );
    return {key: m.key, passage: m.passage, rects, rowY, tab, tabEnd: {x: tab.x + tab.w, y: rowY}, hl, ul, tabNode, pref, kind: m.kind};
  };

  const matchGeo = o.matches.map((m, k) => mk(m, rows[m.passage], fits[m.passage], `${P}-m${k}`));
  // alternative wording of one passage (inspect): same row, text swapped in
  let alt = null;
  if (o.altPassage) {
    const ap = o.altPassage;
    const row = rows[ap.passage];
    const f2 = ctx.fit(ap.text, {maxWidth: tw, size, minSize: size, maxLines: 3, weight: 500, family: 'serif', leading: 1.2});
    alt = {passage: ap.passage, fit: f2, geo: (ap.matches || []).map((m, k) => mk(m, {...row, fit: f2}, f2, `${P}-a${k}`)), words: null};
    // Word-level substitution: only the replaced word(s) lift out and the new
    // word(s) settle in; the words before them stay put and the words after
    // them slide to their new places. Needs both wordings laid out at the same
    // size without truncation and with an identical prefix (else cross-fade).
    const f0 = row.fit;
    const lay = f => {
      const out = [];
      f.lines.forEach((ln, li) => {
        const ws = wordsOf(ln);
        ws.forEach((wd, k) => {
          const pre = ws.slice(0, k).join(' ');
          out.push({li, x: pre ? ctx.measure(`${pre} `, f.size, f.weight, f.family) : 0, text: wd});
        });
      });
      return out;
    };
    const w0 = wordsOf(o.source.passages[ap.passage]), w1 = wordsOf(ap.text);
    const L0 = lay(f0), L1 = lay(f2);
    if (!f0.truncated && !f2.truncated && f0.size === f2.size && L0.length === w0.length && L1.length === w1.length) {
      let a = 0;
      while (a < w0.length && a < w1.length && w0[a] === w1[a]) a++;
      let c = 0;
      while (c < w0.length - a && c < w1.length - a && w0[w0.length - 1 - c] === w1[w1.length - 1 - c]) c++;
      const samePrefix = L0.slice(0, a).every((q, k) => q.li === L1[k].li && Math.abs(q.x - L1[k].x) < 0.5);
      if (samePrefix && (a < w0.length || a < w1.length)) {
        alt.words = {
          prefix: L0.slice(0, a),
          old: L0.slice(a, w0.length - c),
          neu: L1.slice(a, w1.length - c),
          suffix: L0.slice(w0.length - c).map((q, k) => ({from: q, to: L1[w1.length - c + k]})),
          changed: [a, w0.length - c],
        };
      }
    }
  }

  /** consecutive words on one line → one text run (or bar when text is hidden) */
  const runs = (words, f, rowY) => {
    const segs = [];
    words.forEach(q => {
      const last = segs[segs.length - 1];
      if (last && last.li === q.li) last.text += ` ${q.text}`;
      else segs.push({li: q.li, x: q.x, text: q.text});
    });
    return segs.map(sg => {
      const y = rowY + sg.li * f.lineHeight;
      if (showText) return textBlock({lines: [sg.text], size: f.size, lineHeight: f.lineHeight, weight: f.weight, family: f.family}, {x: tx + sg.x, y, fill: th.ink});
      return h('rect', {x: r(tx + sg.x), y: r(y + f.size * 0.28), width: r(ctx.measure(sg.text, f.size, f.weight, f.family)), height: r(f.size * 0.44), rx: 2.5, fill: th.paperLine});
    });
  };

  const R = [];
  // highlights sit under the text
  matchGeo.forEach(m => R.push(m.hl));
  if (alt) alt.geo.forEach(m => R.push(m.hl));
  rows.forEach((row, i) => {
    const num = `¶${i + 1}`;
    const isAlt = alt && alt.passage === i;
    if (showText) {
      const nf = ctx.fit(num, {maxWidth: numW, size: size * 0.8, minSize: 9, maxLines: 1, weight: 700});
      R.push(textBlock(nf, {x: x0, y: row.y + (size - nf.size) * 0.5, fill: th.inkFaint}));
    } else R.push(h('circle', {cx: x0 + 6, cy: r(row.y + size * 0.5), r: 3.5, fill: th.inkFaint}));
    if (isAlt && alt.words) {
      const W2 = alt.words;
      if (showText) {
        // one <text> element: the passage stays one block of text whose
        // replaced and following words are positioned tspans
        const f = row.fit;
        const base = textBlock({lines: [], size: f.size, lineHeight: f.lineHeight, weight: f.weight, family: f.family}, {x: tx, y: row.y, fill: th.ink});
        const bl = li => row.y + f.size * 0.8 + li * f.lineHeight;
        const span = (sg, name, extra) => h('tspan', {name, x: r(tx + sg.x), y: r(bl(sg.li)), ...extra}, sg.text);
        const segsOf = words => {
          const out = [];
          words.forEach(q => {
            const last = out[out.length - 1];
            if (last && last.li === q.li) last.text += ` ${q.text}`;
            else out.push({li: q.li, x: q.x, text: q.text});
          });
          return out;
        };
        alt.segs = {old: segsOf(W2.old), neu: segsOf(W2.neu)};
        R.push({...base, children: [
          ...segsOf(W2.prefix).map(sg => span(sg, null)),
          ...alt.segs.old.map((sg, j) => span(sg, `${P}-p${i}-w0-${j}`)),
          ...alt.segs.neu.map((sg, j) => span(sg, `${P}-p${i}-w1-${j}`, {'fill-opacity': 0})),
          ...W2.suffix.map((sf, k) => span({li: sf.from.li, x: sf.from.x, text: sf.from.text}, `${P}-p${i}-s${k}`)),
        ]});
        alt.baseline = bl;
      } else {
        R.push(g(null, runs(W2.prefix, row.fit, row.y)));
        R.push(g({name: `${P}-p${i}-w0`}, runs(W2.old, row.fit, row.y)));
        R.push(g({name: `${P}-p${i}-w1`, opacity: 0}, runs(W2.neu, alt.fit, row.y)));
        W2.suffix.forEach((sf, k) => R.push(g({name: `${P}-p${i}-s${k}`}, runs([sf.from], row.fit, row.y))));
      }
      return;
    }
    const whole = f => (showText
      ? textBlock(f, {x: tx, y: row.y, fill: th.ink})
      : f.lines.map((ln, li) => h('rect', {x: tx, y: r(row.y + li * f.lineHeight + f.size * 0.28), width: r(ctx.measure(ln, f.size, f.weight, f.family)), height: r(f.size * 0.44), rx: 2.5, fill: th.paperLine})));
    R.push(g({name: isAlt ? `${P}-p${i}-t0` : null}, whole(row.fit)));
    if (isAlt) R.push(g({name: `${P}-p${i}-t1`, opacity: 0}, whole(alt.fit)));
  });
  matchGeo.forEach(m => R.push(m.ul));
  if (alt) alt.geo.forEach(m => R.push(m.ul));
  parts.push(g(null, R));
  // tabs on top of the page edge
  const tabs = [...matchGeo.map(m => m.tabNode), ...(alt ? alt.geo.map(m => m.tabNode) : [])];

  const node = g({name: P}, parts, tabs);
  const row0LineH = alt ? rows[alt.passage].fit.lineHeight : 0;
  /**
   * @param {Record<string, {tab:number, mark:number}>} states keyed by match key (alt keys prefixed "alt:")
   * @param {number} [altSwap] substitution progress: the old word lifts out
   *   (0–0.45), the following words slide (0.3–0.75), the new word settles (0.55–1)
   */
  const frame = (states, altSwap = 0) => {
    const out = {};
    const sw = clamp(altSwap);
    const words = alt && alt.words;
    const outP = words ? clamp(sw / 0.45) : clamp(sw * 2);
    const inP = words ? clamp((sw - 0.55) / 0.45) : clamp(sw * 2 - 1);
    const lift = 14;
    // `ink` = visibility of the wording the mark belongs to: the highlight of
    // a word that is being replaced lifts out together with that word
    const apply = (m, st, ink = 1) => {
      const tab = st ? st.tab : 0;
      const mark = st ? st.mark : 0;
      const grow = ctx.reduced ? ease.outCubic(clamp(tab)) : ease.outBack(clamp(tab));
      out[`${m.pref}-tab`] = {opacity: r(clamp(tab * 3), 3), transform: tab > 0 && tab < 1 ? `translate(${r(m.tab.x + m.tab.w)} ${r(m.rowY)}) scale(${r(0.6 + 0.4 * grow, 4)}) translate(${r(-(m.tab.x + m.tab.w))} ${r(-m.rowY)})` : ''};
      m.rects.forEach((q, j) => {
        const pj = clamp(mark * m.rects.length - j);
        out[`${m.pref}-hl${j}`] = {width: r(q.w * ease.outCubic(pj)), opacity: r(ink, 3), transform: ink < 1 ? `translate(0 ${r(-lift * (1 - ink))})` : ''};
        out[`${m.pref}-ul${j}`] = {opacity: pj >= 1 ? r(ink, 3) : 0, transform: ink < 1 ? `translate(0 ${r(-lift * (1 - ink))})` : ''};
      });
    };
    matchGeo.forEach(m => apply(m, states[m.key], alt && alt.passage === m.passage ? 1 - outP : 1));
    if (alt) {
      alt.geo.forEach(m => apply(m, states[`alt:${m.key}`], inP > 0 ? 1 : 0));
      const i = alt.passage;
      if (words && alt.segs) {
        // text mode: positioned tspans inside the passage's single <text>
        // an invisible word rests on its own baseline (it never widens the block)
        const up = outP < 1 ? lift * ease.outCubic(outP) : 0, down = inP > 0 ? 10 * (1 - ease.outCubic(inP)) : 0;
        alt.segs.old.forEach((sg, j) => { out[`${P}-p${i}-w0-${j}`] = {'fill-opacity': r(1 - outP, 3), y: r(alt.baseline(sg.li) - up)}; });
        alt.segs.neu.forEach((sg, j) => { out[`${P}-p${i}-w1-${j}`] = {'fill-opacity': r(inP, 3), y: r(alt.baseline(sg.li) + down)}; });
        const mv = ease.inOutCubic(seg(sw, 0.3, 0.75));
        words.suffix.forEach((sf, k) => {
          out[`${P}-p${i}-s${k}`] = {x: r(tx + sf.from.x + (sf.to.x - sf.from.x) * mv), y: r(alt.baseline(sf.from.li) + (sf.to.li - sf.from.li) * row0LineH * mv)};
        });
      } else if (words) {
        out[`${P}-p${i}-w0`] = {opacity: r(1 - outP, 3), transform: outP > 0 ? `translate(0 ${r(-lift * ease.outCubic(outP))})` : ''};
        out[`${P}-p${i}-w1`] = {opacity: r(inP, 3), transform: inP < 1 ? `translate(0 ${r(10 * (1 - ease.outCubic(inP)))})` : ''};
        const mv = ease.inOutCubic(seg(sw, 0.3, 0.75));
        words.suffix.forEach((sf, k) => {
          const dx = (sf.to.x - sf.from.x) * mv;
          const dy = (sf.to.li - sf.from.li) * row0LineH * mv;
          out[`${P}-p${i}-s${k}`] = {transform: mv > 0 ? `translate(${r(dx)} ${r(dy)})` : ''};
        });
      } else {
        out[`${P}-p${i}-t0`] = {opacity: r(1 - outP, 3), transform: `translate(0 ${r(-10 * outP)})`};
        out[`${P}-p${i}-t1`] = {opacity: r(inP, 3), transform: `translate(0 ${r(10 * (1 - inP))})`};
      }
    }
    return out;
  };
  return {node, frame, rows, matchGeo, alt, w, h: hh, pw, size, textX: tx, textW: tw};
}

/* ------------------------------------------------------------------ */
/* Search box (on the kiosk screen)                                    */
/* ------------------------------------------------------------------ */

/**
 * Search field with a magnifier and typed term chips. Local origin =
 * top-left of the field. Typing reveals the chips one after the other.
 * Chips keep their font size: when they do not fit one row they wrap onto
 * further rows (the field grows taller) instead of shrinking; only a single
 * chip wider than the whole field is reduced (bounded).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, terms:string[], colors:Array<{c:string,soft:string}>, placeholder?:string,
 *   alt?:{index:number, text:string}, size?:number, minSize?:number, maxRows?:number}} o
 *   `h` is the height of a one-row field.
 */
export function searchBox(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w;
  const rowField = o.h;
  const showText = ctx.show('all');
  const iconW = rowField * 0.9;
  const x0 = iconW + 6;
  const avail = w - x0 - 14;
  const gap = 10;
  const rowGap = 8;
  const maxRows = o.maxRows ?? 3;
  const size0 = o.size ?? Math.min(26, rowField * 0.42);
  const minSize = o.minSize ?? size0 * 0.8;
  const textW = (t, s) => ctx.measure(t, s, 700, 'sans');
  const chipW = (s, i) => {
    const base = textW(o.terms[i], s);
    const alt = o.alt && o.alt.index === i ? textW(o.alt.text, s) : 0;
    return Math.max(base, alt) + s * 1.1;
  };
  /** greedy rows at size s → array of rows of term indices, or null */
  const pack = s => {
    const rows = [[]];
    let x = 0;
    for (let i = 0; i < o.terms.length; i++) {
      const cw = chipW(s, i);
      if (cw > avail) return null;
      if (rows[rows.length - 1].length && x + gap + cw > avail) {
        rows.push([]);
        x = 0;
      }
      x += (rows[rows.length - 1].length ? gap : 0) + cw;
      rows[rows.length - 1].push(i);
    }
    return rows.length <= maxRows ? rows : null;
  };
  // one row at (almost) full size reads best; otherwise wrap at full size
  let size = size0;
  let rows = null;
  for (let s = size0; s >= size0 * 0.88 - 1e-6 && !rows; s -= 0.5) {
    const one = pack(s);
    if (one && one.length === 1) {
      rows = one;
      size = s;
    }
  }
  if (!rows) rows = pack(size);
  while (!rows && size > minSize) {
    size = Math.max(minSize, size - 0.5);
    rows = pack(size);
  }
  if (!rows) rows = o.terms.map((_, i) => [i]).slice(0, maxRows);
  const chH = size * 1.55;
  const vpad = Math.max(6, (rowField - chH) / 2);
  const hh = Math.max(rowField, rows.length * chH + (rows.length - 1) * rowGap + vpad * 2);
  const cy0 = vpad + chH / 2;
  const chips = [];
  rows.forEach((row, ri) => {
    let x = x0;
    row.forEach(i => {
      const cw = Math.min(avail, chipW(size, i));
      chips[i] = {box: {x, y: vpad + ri * (chH + rowGap), w: cw, h: chH}, text: o.terms[i], color: o.colors[i % o.colors.length], row: ri};
      x += cw + gap;
    });
  });
  const clipId = `${P}-type`;
  const chipNodes = chips.map((c, i) => {
    const cy = c.box.y + c.box.h / 2;
    const fo = {maxWidth: c.box.w - size * 0.8, size, minSize: Math.max(12, size * 0.72), maxLines: 1, weight: 700};
    const fit = ctx.fit(c.text, fo);
    const altFit = o.alt && o.alt.index === i ? ctx.fit(o.alt.text, fo) : null;
    return g({name: `${P}-chip${i}`},
      h('path', {d: roundRectPath(c.box.x, c.box.y, c.box.w, c.box.h, c.box.h / 2), fill: c.color.soft, stroke: c.color.c, 'stroke-width': 2.5}),
      showText ? g({name: altFit ? `${P}-chip${i}-t0` : null}, textBlock(fit, {x: c.box.x + c.box.w / 2, y: cy - fit.size * 0.5, anchor: 'middle', fill: shade(c.color.c, -0.35)})) : h('rect', {x: r(c.box.x + c.box.w * 0.18), y: r(cy - 4), width: r(c.box.w * 0.64), height: 8, rx: 4, fill: c.color.c, opacity: 0.8}),
      showText && altFit ? g({name: `${P}-chip${i}-t1`, opacity: 0}, textBlock(altFit, {x: c.box.x + c.box.w / 2, y: cy - altFit.size * 0.5, anchor: 'middle', fill: shade(c.color.c, -0.35)})) : null,
    );
  });
  const ph = o.placeholder && showText ? ctx.fit(o.placeholder, {maxWidth: avail, size: Math.min(24, rowField * 0.38), minSize: 13, maxLines: 1, weight: 500, italic: true}) : null;
  const mcy = cy0;
  const mag = g({name: `${P}-mag`},
    h('circle', {cx: r(iconW * 0.5), cy: r(mcy - 3), r: r(rowField * 0.19), fill: 'none', stroke: th.ink, 'stroke-width': 3.5}),
    h('line', {x1: r(iconW * 0.5 + rowField * 0.13), y1: r(mcy - 3 + rowField * 0.13), x2: r(iconW * 0.5 + rowField * 0.27), y2: r(mcy - 3 + rowField * 0.27), stroke: th.ink, 'stroke-width': 4.5, 'stroke-linecap': 'round'}),
  );
  // typing: one clip rect per chip, revealed in term order (proportional to width)
  const total = chips.reduce((a, c) => a + c.box.w, 0) || 1;
  let acc = 0;
  const spans = chips.map(c => {
    const s0 = acc / total;
    acc += c.box.w;
    return [s0, acc / total];
  });
  const node = g({name: P},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, chips.map((c, i) => h('rect', {name: `${P}-typeclip${i}`, x: r(c.box.x - 4), y: r(c.box.y - 6), width: 0, height: r(c.box.h + 12)})))),
    h('path', {name: `${P}-field`, d: roundRectPath(0, 0, w, hh, Math.min(hh / 2, rowField / 2)), fill: '#ffffff', stroke: th.ink, 'stroke-width': 2.5}),
    mag,
    ph ? g({name: `${P}-ph`}, textBlock(ph, {x: x0, y: cy0 - ph.size * 0.52, fill: th.inkFaint, italic: true})) : null,
    g({'clip-path': ctx.ref(clipId)}, chipNodes),
    h('line', {name: `${P}-caret`, x1: x0, x2: x0, y1: r(cy0 - chH * 0.45), y2: r(cy0 + chH * 0.45), stroke: th.ink, 'stroke-width': 2.5, opacity: 0}),
  );
  /**
   * @param {{type:number, press?:number, altSwap?:number, pulse?:number[]}} s
   */
  const frame = s => {
    const type = clamp(s.type);
    const out = {
      [`${P}-mag`]: {transform: s.press ? `translate(${r(iconW * 0.5)} ${r(mcy)}) scale(${r(1 + 0.18 * Math.sin(Math.PI * clamp(s.press)), 4)}) translate(${r(-iconW * 0.5)} ${r(-mcy)})` : ''},
    };
    let caret = null;
    chips.forEach((c, i) => {
      const [a, b] = spans[i];
      const local = clamp((type - a) / Math.max(1e-6, b - a));
      const wv = (c.box.w + 8) * local;
      out[`${P}-typeclip${i}`] = {width: r(wv)};
      if (type > a && type <= b) caret = {x: c.box.x - 4 + wv, y: c.box.y + c.box.h / 2};
    });
    if (!caret) caret = {x: x0, y: cy0};
    out[`${P}-caret`] = {x1: r(caret.x), x2: r(caret.x), y1: r(caret.y - chH * 0.45), y2: r(caret.y + chH * 0.45), opacity: type > 0 && type < 1 ? 1 : 0};
    if (ph) out[`${P}-ph`] = {opacity: type > 0 ? 0 : 1};
    // a chip swells briefly when one of its tokens leaves (cause of the travel);
    // a chip that has not been typed yet is not drawn at all (its clip is empty)
    chips.forEach((c, i) => {
      const pu = s.pulse ? clamp(s.pulse[i] || 0) : 0;
      const k = 1 + (ctx.reduced ? 0.05 : 0.14) * Math.sin(Math.PI * pu);
      const cx = c.box.x + c.box.w / 2, cy = c.box.y + c.box.h / 2;
      const typed = type > spans[i][0];
      out[`${P}-chip${i}`] = {opacity: typed ? 1 : 0, transform: pu > 0 && pu < 1 ? `translate(${r(cx)} ${r(cy)}) scale(${r(k, 4)}) translate(${r(-cx)} ${r(-cy)})` : ''};
    });
    if (o.alt && showText) {
      const outP = clamp((s.altSwap || 0) * 2), inP = clamp((s.altSwap || 0) * 2 - 1);
      out[`${P}-chip${o.alt.index}-t0`] = {opacity: r(1 - outP, 3), transform: `translate(0 ${r(-8 * outP)})`};
      out[`${P}-chip${o.alt.index}-t1`] = {opacity: r(inP, 3), transform: `translate(0 ${r(8 * (1 - inP))})`};
    }
    return out;
  };
  return {node, frame, chips, size, w, h: hh, rows: rows.length};
}

/* ------------------------------------------------------------------ */
/* Related-wording dropdown (contextual mode)                          */
/* ------------------------------------------------------------------ */

/**
 * Suggestion list under the search box: one row per term with related
 * wording. Local origin = top-left.
 */
export function relatedList(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const showText = ctx.show('all');
  const rowsIn = o.terms.map((t, i) => ({t, i})).filter(x => (x.t.related || []).length);
  const rowH = o.rowH;
  const size = Math.min(o.size ?? 24, rowH * 0.54);
  const items = [];
  const nodes = [];
  rowsIn.forEach((row, k) => {
    const y = 8 + k * rowH;
    const col = o.colors[row.i % o.colors.length];
    let x = 12;
    nodes.push(h('path', {d: `M${x} ${r(y + rowH * 0.5)}c4 -6 8 -6 12 0s8 6 12 0`, fill: 'none', stroke: col.c, 'stroke-width': 3, 'stroke-linecap': 'round'}));
    x += 44;
    row.t.related.forEach((word, ri) => {
      const f = ctx.fit(word, {maxWidth: Math.max(40, o.w - x - 10), size, minSize: 10, maxLines: 1, weight: 600});
      const cw = f.width + 18;
      if (x + cw > o.w - 6) return;
      const box = {x, y: y + (rowH - size * 1.5) / 2, w: cw, h: size * 1.5};
      nodes.push(h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, box.h / 2), fill: th.paper, stroke: col.c, 'stroke-width': 2, 'stroke-dasharray': '5 4'}));
      if (showText) nodes.push(textBlock(f, {x: box.x + box.w / 2, y: box.y + (box.h - f.size) / 2 - 1, anchor: 'middle', fill: shade(col.c, -0.35)}));
      else nodes.push(h('rect', {x: r(box.x + 8), y: r(box.y + box.h / 2 - 3), width: r(box.w - 16), height: 6, rx: 3, fill: col.c, opacity: 0.7}));
      items.push({term: row.i, related: ri, box});
      x += cw + 8;
    });
  });
  const hTotal = 16 + rowsIn.length * rowH;
  const node = g({name: P, opacity: 0},
    h('path', {d: roundRectPath(0, 0, o.w, hTotal, 12), fill: '#ffffff', stroke: th.inkSoft, 'stroke-width': 2}),
    nodes);
  return {node, items, h: hTotal, frame: p => ({[P]: {opacity: r(clamp(p * 2), 3), transform: `translate(0 ${r(-10 * (1 - ease.outCubic(clamp(p))))})`}})};
}

/* ------------------------------------------------------------------ */
/* Index card (ficha)                                                  */
/* ------------------------------------------------------------------ */

/**
 * Measure an index card for its lines: one column at the target size when it
 * fits `maxH`, else two columns (when they fit `maxW`), else a bounded
 * smaller size. Pure (used by the stage to reserve room before drawing).
 * @param {any} ctx
 * @param {{heading:string, lines:Array<{text:string}>, size:number, minSize?:number, maxW:number, maxH:number, minW?:number}} o
 */
export function measureCard(ctx, o) {
  // `measureLines` (optional) sizes the card for another line set, so two
  // cards that must print at the same size (paired scenes) share one measure
  const ref = o.measureLines && o.measureLines.length ? o.measureLines : o.lines;
  const n = Math.max(1, ref.length);
  const minSize = o.minSize ?? Math.max(14, o.size * 0.72);
  const at = (size, cols) => {
    const pad = 12 + size * 0.25;
    const dotW = size * 0.95;
    const colGap = size * 0.9;
    // the heading is printed as large as the citation lines (key label)
    const headSize = size;
    const headH = headSize * 1.75;
    const lineH = size * 1.42;
    const tw = Math.max(0, ...ref.map(l => ctx.measure(l.text, size, 600, 'mono')));
    const hw = o.heading ? ctx.measure(o.heading, headSize, 700, 'sans') : 0;
    const rows = Math.ceil(n / cols);
    const w = Math.max(o.minW ?? 0, hw + pad * 2, pad * 2 + cols * (dotW + tw) + (cols - 1) * colGap);
    const hh = headH + Math.max(rows, 2) * lineH + pad * 0.6 + 16;
    return {size, cols, rows, pad, dotW, colGap, headSize, headH, lineH, w, h: hh, colW: dotW + tw};
  };
  for (let size = o.size; size >= minSize - 1e-6; size -= 0.5) {
    const one = at(size, 1);
    if (one.w <= o.maxW && one.h <= o.maxH) return one;
    if (n > 1) {
      const two = at(size, 2);
      if (two.w <= o.maxW && two.h <= o.maxH) return two;
    }
  }
  const last = at(minSize, n > 3 ? 2 : 1);
  return {...last, w: Math.min(last.w, o.maxW)};
}

/**
 * Library catalogue card. Local origin = top-left. Lines are laid out in
 * one or two columns (see measureCard) and printed in order.
 * @param {any} ctx
 * @param {{prefix:string, heading:string, lines:Array<{text:string, color:{c:string,soft:string}, kind:string}>, size:number, minSize?:number, maxW:number, maxH:number, minW?:number}} o
 */
export function indexCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const M = measureCard(ctx, o);
  const {w, h: hh, pad, headH, lineH, size, cols, dotW, colGap} = M;
  const showText = ctx.show('all');
  const n = o.lines.length;
  const colW = (w - pad * 2 - (cols - 1) * colGap) / cols;
  const parts = [
    h('path', {d: roundRectPath(6, 8, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: '#fbf6e8', stroke: th.ink, 'stroke-width': 2.4}),
    h('line', {x1: pad * 0.6, x2: w - pad * 0.6, y1: r(headH), y2: r(headH), stroke: '#c8553d', 'stroke-width': 2.4}),
    h('circle', {cx: w / 2, cy: r(hh - 10), r: 5.5, fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.5}),
  ];
  for (let i = 0; i < Math.max(2, M.rows); i++) {
    const y = headH + (i + 1) * lineH;
    if (y < hh - 18) parts.push(h('line', {x1: pad * 0.6, x2: w - pad * 0.6, y1: r(y), y2: r(y), stroke: '#b9cde0', 'stroke-width': 1.4}));
  }
  if (cols > 1) parts.push(h('line', {x1: r(pad + colW + colGap / 2), x2: r(pad + colW + colGap / 2), y1: r(headH + 6), y2: r(headH + M.rows * lineH - 4), stroke: '#e3c9c0', 'stroke-width': 1.4}));
  const hf = ctx.fit(o.heading || '', {maxWidth: w - pad * 2, size: M.headSize, minSize: Math.max(12, M.headSize * 0.75), maxLines: 1, weight: 700});
  if (showText && o.heading) parts.push(textBlock(hf, {x: pad, y: (headH - hf.size) / 2, fill: th.ink}));
  else parts.push(h('rect', {x: pad, y: r(headH / 2 - 5), width: r(Math.min(w - pad * 2, w * 0.5)), height: 10, rx: 5, fill: th.ink, opacity: 0.7}));
  const lineAt = i => ({x: pad + (i % cols) * (colW + colGap), y: headH + Math.floor(i / cols) * lineH});
  const lineNodes = o.lines.map((ln, i) => {
    const {x, y} = lineAt(i);
    const mid = y + lineH * 0.52;
    const f = ctx.fit(ln.text, {maxWidth: colW - dotW, size, minSize: Math.max(12, size * 0.75), maxLines: 1, weight: 600, family: 'mono'});
    return g({name: `${P}-l${i}`, opacity: 0},
      ln.kind === 'contextual'
        ? h('circle', {cx: r(x + size * 0.3), cy: r(mid), r: r(size * 0.24), fill: th.paper, stroke: ln.color.c, 'stroke-width': 2.8})
        : h('circle', {cx: r(x + size * 0.3), cy: r(mid), r: r(size * 0.27), fill: ln.color.c}),
      showText ? textBlock(f, {x: x + dotW, y: mid - f.size * 0.55, fill: '#2b3a55'}) : h('rect', {x: r(x + dotW), y: r(mid - size * 0.25), width: r(Math.min(f.width, colW - dotW)), height: r(size * 0.5), rx: 3, fill: '#2b3a55', opacity: 0.6}),
    );
  });
  const node = g({name: P}, parts, lineNodes);
  const frame = printed => Object.fromEntries(o.lines.map((_, i) => [`${P}-l${i}`, {opacity: r(clamp(printed - i), 3)}]));
  return {node, frame, w, h: hh, headH, lineH, cols, rows: M.rows, size, n};
}

/* ------------------------------------------------------------------ */
/* Tokens and threads                                                  */
/* ------------------------------------------------------------------ */

/** A travelling word token (pill). Local origin = centre. */
export function tokenNode(ctx, {name, text, color, kind, size = 20}) {
  const th = ctx.theme;
  const showText = ctx.show('all');
  const f = ctx.fit(text, {maxWidth: 200, size, minSize: 11, maxLines: 1, weight: 700});
  const w = (showText ? f.width : size * 2.4) + size * 1.1;
  const hh = size * 1.55;
  const contextual = kind === 'contextual';
  return {
    node: g({name, opacity: 0},
      h('path', {d: roundRectPath(-w / 2 + 3, -hh / 2 + 5, w, hh, hh / 2), fill: th.shadow}),
      h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, hh / 2), fill: contextual ? th.paper : color.c, stroke: contextual ? color.c : th.ink, 'stroke-width': contextual ? 3 : 2, 'stroke-dasharray': contextual ? '6 4' : null}),
      showText ? textBlock(f, {x: 0, y: -f.size * 0.5, anchor: 'middle', fill: contextual ? shade(color.c, -0.35) : '#ffffff'}) : h('rect', {x: r(-size * 1.2), y: -3, width: r(size * 2.4), height: 6, rx: 3, fill: contextual ? color.c : '#ffffff', opacity: 0.85}),
    ),
    w, h: hh,
  };
}

/**
 * Thread between two points (cubic), drawn on progressively. Exact matches
 * use a solid line, contextual ones a dashed line (masked draw-on).
 */
export function thread(ctx, {name, from, c1, c2, to, color, kind}) {
  const poly = cubicPolyline(from, c1, c2, to, 64);
  const total = poly.total;
  const d = `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`;
  const contextual = kind === 'contextual';
  const xs = poly.pts.map(q => q.x), ys = poly.pts.map(q => q.y);
  const pad = 30;
  const mx = Math.min(...xs) - pad, my = Math.min(...ys) - pad;
  const node = g({name, opacity: 0},
    contextual ? h('defs', null, h('mask', {id: ctx.id(`${name}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...xs) - mx + pad), height: r(Math.max(...ys) - my + pad)},
      h('path', {name: `${name}-masker`, d, fill: 'none', stroke: '#fff', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}))) : null,
    h('path', {d, fill: 'none', stroke: ctx.theme.paper, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.65, 'stroke-dasharray': contextual ? null : `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': contextual ? null : r(total), name: `${name}-halo`, mask: contextual ? ctx.ref(`${name}-mask`) : null}),
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color.c, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': contextual ? '9 7' : `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': contextual ? null : r(total), mask: contextual ? ctx.ref(`${name}-mask`) : null}),
    h('circle', {name: `${name}-dot`, cx: r(from.x), cy: r(from.y), r: 5, fill: color.c, opacity: 0}),
  );
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - clamp(p)));
    const out = {[name]: {opacity: p > 0 ? opacity : 0}, [`${name}-dot`]: {opacity: p > 0 ? 1 : 0}};
    if (contextual) out[`${name}-masker`] = {'stroke-dashoffset': off};
    else {
      out[`${name}-line`] = {'stroke-dashoffset': off};
      out[`${name}-halo`] = {'stroke-dashoffset': off};
    }
    return out;
  };
  return {node, frame, at: t => poly.at(t), total, from, to};
}

/* ------------------------------------------------------------------ */
/* Kiosk                                                               */
/* ------------------------------------------------------------------ */

/**
 * Standing search kiosk. Coordinates are stage coordinates.
 * @param {any} ctx
 * @param {{prefix:string, housing:{x:number,y:number,w:number,h:number}, floorY:number, keyboard:{x:number,y:number,w:number,h:number}, slot:{x0:number,x1:number}, colX:number}} o
 */
export function kiosk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const H = o.housing, K = o.keyboard;
  const body = '#d9dee3';
  const dark = '#3c4650';
  const back = g({name: `${P}-back`},
    h('ellipse', {cx: o.colX, cy: o.floorY - 2, rx: 110, ry: 12, fill: th.shadow}),
    h('path', {d: roundRectPath(o.colX - 80, o.floorY - 16, 160, 16, 6), fill: dark, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: o.colX - 18, y: H.y + H.h - 10, width: 36, height: o.floorY - 16 - (H.y + H.h - 10), fill: body, stroke: th.ink, 'stroke-width': 2.2}),
    h('line', {x1: o.colX - 6, x2: o.colX - 6, y1: H.y + H.h, y2: o.floorY - 20, stroke: shade(body, -0.15), 'stroke-width': 3}),
  );
  // printer slot on top of the housing
  const slot = g(null,
    h('path', {d: roundRectPath(o.slot.x0 - 10, H.y - 12, o.slot.x1 - o.slot.x0 + 20, 16, 5), fill: shade(body, -0.08), stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: o.slot.x0, y: H.y - 7, width: o.slot.x1 - o.slot.x0, height: 5, rx: 2.5, fill: '#1f2328'}),
  );
  const screen = {x: H.x + 14, y: H.y + 14, w: H.w - 28, h: H.h - 50};
  const housing = g({name: `${P}-housing`},
    h('path', {d: roundRectPath(H.x + 6, H.y + 8, H.w, H.h, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(H.x, H.y, H.w, H.h, 18), fill: body, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(screen.x, screen.y, screen.w, screen.h, 10), fill: '#eef3f7', stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(screen.x + 8)} ${r(screen.y + 8)}l${r(screen.w * 0.3)} 0l${r(-screen.w * 0.18)} ${r(screen.h * 0.4)}Z`, fill: '#ffffff', opacity: 0.35}),
    h('circle', {cx: r(H.x + H.w / 2), cy: r(H.y + H.h - 18), r: 6, fill: th.accent4, stroke: th.ink, 'stroke-width': 1.5}),
  );
  // keyboard tray (seen slightly from above)
  const keys = [];
  const rows = 3, cols = 9;
  const kx0 = K.x + 10, ky0 = K.y + 5;
  const kw = (K.w - 20) / cols, kh = (K.h - 8) / rows;
  const keyPts = [];
  for (let rr = 0; rr < rows; rr++) {
    for (let c = 0; c < cols; c++) {
      const x = kx0 + c * kw + rr * 3;
      const y = ky0 + rr * kh;
      keys.push(h('rect', {x: r(x + 1), y: r(y + 1), width: r(kw - 3), height: r(kh - 2.5), rx: 2, fill: '#f6f7f8', stroke: '#8a939c', 'stroke-width': 1}));
      if (rr === 1) keyPts.push({x: x + kw / 2, y: y + kh / 2});
    }
  }
  const enter = o.enterSide === 'left' ? {x: K.x + 14, y: K.y + K.h * 0.5} : {x: K.x + K.w - 14, y: K.y + K.h * 0.5};
  // the tray hangs from the housing: a short strut under the lower bezel, or
  // a side arm when the tray sits beside the housing
  const beside = K.x + K.w <= H.x + 24 ? 'left' : K.x >= H.x + H.w - 24 ? 'right' : null;
  const brX = Math.max(H.x + 22, Math.min(K.x + K.w * 0.55, H.x + H.w - 22));
  const strut = beside === 'left'
    ? h('path', {d: roundRectPath(K.x + K.w - 30, K.y - 16, H.x - (K.x + K.w) + 40, 16, 4), fill: dark, stroke: th.ink, 'stroke-width': 2})
    : beside === 'right'
      ? h('path', {d: roundRectPath(H.x + H.w - 10, K.y - 16, K.x - (H.x + H.w) + 40, 16, 4), fill: dark, stroke: th.ink, 'stroke-width': 2})
      : h('rect', {x: r(brX - 9), y: r(H.y + H.h - 6), width: 18, height: r(Math.max(10, K.y - (H.y + H.h) + 12)), rx: 3, fill: dark, stroke: th.ink, 'stroke-width': 2});
  const keyboard = g({name: `${P}-keyboard`},
    strut,
    h('path', {d: `M${r(K.x - 6)} ${r(K.y + K.h + 8)}L${r(K.x + 4)} ${r(K.y - 4)}H${r(K.x + K.w - 4)}L${r(K.x + K.w + 6)} ${r(K.y + K.h + 8)}Z`, fill: dark, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    keys,
    h('rect', {name: `${P}-enter`, x: r(enter.x - 10), y: r(K.y + 2), width: 20, height: r(K.h - 4), rx: 3, fill: th.accent4Soft, stroke: th.accent4, 'stroke-width': 1.5}),
  );
  // footprint of tray + strut (collision checks for bezel indicators)
  const kbBox = beside
    ? {x: Math.min(K.x, H.x) - 8, y: K.y - 18, w: Math.max(K.x + K.w, H.x) - Math.min(K.x, H.x) + 16, h: K.h + 28}
    : {x: Math.min(K.x, brX - 9) - 8, y: Math.min(K.y, H.y + H.h - 6) - 6, w: Math.max(K.x + K.w, brX + 9) - Math.min(K.x, brX - 9) + 16, h: K.y + K.h + 8 - Math.min(K.y, H.y + H.h - 6) + 8};
  return {back, housing, slot, keyboard, screen, keyPts, enter, kbBox};
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */

/**
 * Stage geometry per axis. `horizontal`: bookcase left, kiosk right;
 * `vertical`: bookcase on top, kiosk below. `person` places the researcher.
 * All numbers are design units of the stage.
 */
/*
 * card: target font of the printed citation lines and the room the card may
 * take (maxW × maxH, the card never covers a volume). sb: one-row height of
 * the search field and its chip font. chip: size of the key captions.
 */
const GEO = {
  horizontal: {
    person: {W: 2140, H: 900, floor: 876, bookcase: {x: 16, y: 22, w: 1236}, bookW: 160,
      housing: {x: 1370, y: 300, w: 450, h: 280}, keyboard: {x: 1684, y: 596, w: 176, h: 26}, colX: 1560,
      slot: [0.08, 0.92], researcher: {x: 1946, k: 1.55, facing: -1}, keyRange: [4, 9],
      card: {size: 27, minSize: 21, maxW: 420, maxH: 236}, sb: {h: 70, size: 30}, chip: 32, token: 24},
    none: {W: 1290, H: 820, floor: 800, bookcase: {x: 12, y: 16, w: 830}, bookW: 84,
      housing: {x: 882, y: 262, w: 392, h: 262}, keyboard: {x: 980, y: 540, w: 210, h: 24}, colX: 1078,
      slot: [0.07, 0.93], researcher: null, keyRange: [0, 9],
      card: {size: 28, minSize: 20, maxW: 380, maxH: 236}, sb: {h: 70, size: 30}, chip: 30, token: 26},
    // paired scenes (contrast): volumes show the identifier on a narrow left
    // page and large passage text; the kiosk screen is large enough for the
    // query chips and the related-wording list at the same text size
    compare: {W: 1760, H: 960, floor: 944, bookcase: {x: 10, y: 14, w: 1140}, bookW: 30,
      housing: {x: 1182, y: 380, w: 566, h: 440}, keyboard: {x: 1350, y: 836, w: 230, h: 24}, colX: 1465,
      slot: [0.08, 0.92], researcher: null, keyRange: [0, 9],
      card: {size: 32, minSize: 24, maxW: 540, maxH: 350}, sb: {h: 88, size: 40}, ddRowMax: 84, ddSize: 38, chip: 34, token: 34,
      vol: {brief: true, textCap: 40, idCap: 36}},
  },
  compact: {
    person: {W: 1480, H: 1100, floor: 1076, bookcase: {x: 14, y: 22, w: 800}, bookW: 96,
      housing: {x: 856, y: 440, w: 404, h: 280}, keyboard: {x: 1082, y: 736, w: 170, h: 26}, colX: 1010,
      slot: [0.08, 0.92], researcher: {x: 1340, k: 1.6, facing: -1}, keyRange: [3, 9],
      card: {size: 30, minSize: 22, maxW: 390, maxH: 300}, sb: {h: 72, size: 31}, chip: 34, token: 27},
  },
  vertical: {
    // the printed card rises in the band between the bookcase and the kiosk;
    // the keyboard tray hangs beside the housing, toward the researcher
    person: {W: 1000, H: 1400, floor: 1384, bookcase: {x: 16, y: 16, w: 968, h: 780}, bookW: 110,
      housing: {x: 440, y: 960, w: 430, h: 214}, keyboard: {x: 236, y: 1104, w: 180, h: 26}, colX: 655,
      slot: [0.06, 0.94], researcher: {x: 176, k: 1.28, facing: 1}, keyRange: [1, 6], enterSide: 'left',
      card: {size: 24, minSize: 18, maxW: 420, maxH: 196}, sb: {h: 62, size: 26}, chip: 30, token: 22},
    none: {W: 900, H: 1320, floor: 1300, bookcase: {x: 12, y: 16, w: 876, h: 800}, bookW: 90,
      housing: {x: 130, y: 1004, w: 500, h: 236}, keyboard: {x: 285, y: 1252, w: 200, h: 24}, colX: 380,
      slot: [0.06, 0.94], researcher: null, keyRange: [0, 9],
      card: {size: 26, minSize: 18, maxW: 460, maxH: 182}, sb: {h: 66, size: 28}, chip: 30, token: 24},
  },
};

/** Stage size for an axis and whether the researcher is present. */
export function stageSize(axis, withPerson = true, variant = null) {
  const G = (variant && GEO[axis][variant]) || GEO[axis][withPerson ? 'person' : 'none'] || GEO[axis].person;
  return {w: G.W, h: G.H};
}

/**
 * Build a complete library search stage.
 * @param {any} ctx
 * @param {{prefix:string, axis:'horizontal'|'compact'|'vertical', withPerson?:boolean,
 *   query:{terms:Array<{text:string, related?:string[]}>, placeholder?:string}, mode:'exact'|'contextual',
 *   sources:Array<{id:string,title:string,passages:string[]}>, dates?:string[],
 *   citations?:{pinpoint?:string, withDate?:boolean}, cardHeading?:string, libraryLabel?:string,
 *   researcherLabel?:string, kioskLabel?:string, withCard?:boolean,
 *   extraMatches?:Array<any>, alt?:{kind:'passage'|'term', source?:number, passage?:number, text:string, index?:number}}} o
 */
export function searchStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const withPerson = o.withPerson !== false;
  const G = (o.variant && GEO[o.axis][o.variant]) || GEO[o.axis][withPerson ? 'person' : 'none'] || GEO[o.axis].person;
  const {W, H} = G;
  const colors = termPalette(ctx);
  const n = o.sources.length;
  const vertical = o.axis === 'vertical';

  // --- matches (+ optional extra/alternative matches used by inspect)
  const matches = findMatches(o.query, o.sources, o.mode).map(m => ({...m, key: matchKey(m), color: colors[m.term % 3]}));
  const extra = (o.extraMatches || []).map(m => ({...m, key: matchKey(m), color: colors[m.term % 3]}));
  const allMatches = [...matches, ...extra.filter(e => !matches.some(m => m.key === e.key))];

  // --- bookcase
  const bc = G.bookcase;
  const bcH = bc.h ?? (G.floor - bc.y);
  const levels = bookcaseLevels(bc.w, bcH, n, G.bookW);
  // volumes on the levels
  const tabRoom = 58;
  const vols = o.sources.map((src, i) => {
    const L = levels[i];
    const x = bc.x + L.bookEnd + 14;
    const w = bc.x + L.x1 - tabRoom - x;
    const top = bc.y + L.top + 26;
    const hh = bc.y + L.floor - 22 - top;
    const own = allMatches.filter(m => m.source === i);
    const altP = o.alt && o.alt.kind === 'passage' && o.alt.source === i ? {passage: o.alt.passage, text: o.alt.text, matches: (o.alt.matches || []).map(m => ({...m, key: matchKey(m), color: colors[m.term % 3]}))} : null;
    const V = G.vol || {};
    // brief pages: the left page is just wide enough for the longest identifier
    const split = V.brief ? clamp((Math.max(...o.sources.map(s2 => ctx.measure(s2.id, V.idCap ?? 34, 700, 'mono'))) + Math.max(12, Math.min(22, w * 0.03)) * 2 + 6) / w, 0.12, 0.3) : 0.42;
    const v = volume(ctx, {prefix: `${P}-v${i}`, w, h: hh, index: i, source: src, date: (o.dates || [])[i], matches: own, altPassage: altP, split, brief: V.brief, textCap: V.textCap, idCap: V.idCap});
    return {v, x, y: top, w, h: hh};
  });
  // brass plates centred under each volume
  const shelf2 = bookcase(ctx, {prefix: `${P}-bc`, w: bc.w, h: bcH, n, bookW: G.bookW, seedKey: 'research-bookcase', crownLabel: o.libraryLabel, plates: o.sources.map(s => s.id), plateAt: vols.map(v => v.x - bc.x + v.w / 2)});

  // --- kiosk + search box + dropdown
  const slotR = {x0: G.housing.x + G.housing.w * G.slot[0], x1: G.housing.x + G.housing.w * G.slot[1]};
  const K = kiosk(ctx, {prefix: `${P}-k`, housing: G.housing, floorY: G.floor, keyboard: G.keyboard, slot: slotR, colX: G.colX, enterSide: G.enterSide});
  const scr = K.screen;
  const sbW = scr.w - 24;
  const altTerm = o.alt && o.alt.kind === 'term' ? {index: o.alt.index, text: o.alt.text} : null;
  const box = searchBox(ctx, {prefix: `${P}-sb`, w: sbW, h: G.sb.h, size: G.sb.size, terms: o.query.terms.map(t => t.text), colors, placeholder: o.query.placeholder, alt: altTerm});
  const sb = {x: scr.x + 12, y: scr.y + 14, w: sbW, h: box.h};
  const hasRelated = o.mode === 'contextual' && o.query.terms.some(t => (t.related || []).length);
  const relRows = o.query.terms.filter(t => (t.related || []).length).length || 1;
  const ddRowH = Math.max(34, Math.min(G.ddRowMax ?? 54, (scr.h - box.h - 44) / relRows));
  const dd = hasRelated ? relatedList(ctx, {prefix: `${P}-dd`, w: sb.w, rowH: ddRowH, terms: o.query.terms, colors, size: G.ddSize ?? G.sb.size * 0.82}) : null;
  const ddAt = {x: sb.x, y: sb.y + sb.h + 8};
  const chipWorld = i => {
    const b = box.chips[i].box;
    return {x: sb.x + b.x, y: sb.y + b.y, w: b.w, h: b.h};
  };

  // --- threads + tokens
  const tabEndWorld = (m, geoList) => {
    const vol = vols[m.source];
    const mg = geoList.find(q => q.key === m.key);
    return {x: vol.x + mg.tabEnd.x, y: vol.y + mg.tabEnd.y};
  };
  const makeLink = (m, geoList, idx, pre) => {
    let startBox;
    if (m.kind === 'contextual' && dd) {
      const it = dd.items.find(q => q.term === m.term && q.related === m.related) || dd.items.find(q => q.term === m.term);
      startBox = it ? {x: ddAt.x + it.box.x, y: ddAt.y + it.box.y, w: it.box.w, h: it.box.h} : chipWorld(m.term);
    } else startBox = chipWorld(m.term);
    const end = tabEndWorld(m, geoList);
    let c1, c2;
    // Threads start on the chip and leave the kiosk from behind the housing
    // (the housing is drawn over them), then land on the tab from outside.
    const start = {x: startBox.x + startBox.w * 0.5, y: startBox.y + startBox.h * 0.5};
    const Hs = G.housing;
    if (vertical) {
      const lane = W - 14 - idx * 5;
      c1 = {x: lane + 8, y: Math.min(start.y, Hs.y + 40)};
      c2 = {x: lane, y: end.y + Math.min(260, (start.y - end.y) * 0.35)};
    } else {
      c1 = {x: Hs.x - 70 - idx * 6, y: start.y};
      c2 = {x: end.x + 110 + idx * 4, y: end.y};
    }
    const th2 = thread(ctx, {name: `${pre}-th`, from: start, c1, c2, to: end, color: m.color, kind: m.kind});
    const tk = tokenNode(ctx, {name: `${pre}-tok`, text: m.word, color: m.color, kind: m.kind, size: G.token});
    return {m, thread: th2, token: tk, start, end, pre};
  };
  const links = allMatches.map((m, i) => makeLink(m, vols[m.source].v.matchGeo, i, `${P}-L${i}`));
  const altLinks = [];
  vols.forEach(vol => {
    if (vol.v.alt) vol.v.alt.geo.forEach((ag, k) => {
      const am = (o.alt.matches || [])[k];
      const m = {...am, key: matchKey(am), color: colors[am.term % 3]};
      const link = makeLink({...m, key: ag.key}, vol.v.alt.geo, links.length + altLinks.length, `${P}-A${k}`);
      altLinks.push({...link, altKey: `alt:${ag.key}`});
    });
  });

  // --- index card rising from the printer slot. It may only rise into free
  // room: above the housing, below the bookcase's lowest volume (vertical).
  const slotX = (slotR.x0 + slotR.x1) / 2;
  const slotY = G.housing.y - 7;
  const pin = o.citations?.pinpoint ?? '¶';
  const cardLines = matches.map(m => {
    const date = o.citations?.withDate && (o.dates || [])[m.source] ? ` · ${(o.dates || [])[m.source]}` : '';
    return {text: `${o.sources[m.source].id} ${pin}${m.passage + 1}${date}`, color: m.color, kind: m.kind};
  });
  // `cardMeasureLines`: size this card for another scene's lines (paired
  // scenes print their cards at one common size)
  const card = o.withCard === false ? null : indexCard(ctx, {prefix: `${P}-card`, heading: o.cardHeading || '', lines: cardLines, measureLines: o.cardMeasureLines,
    size: G.card.size, minSize: G.card.minSize, maxW: G.card.maxW, maxH: G.card.maxH, minW: (slotR.x1 - slotR.x0) * 0.7});
  const cardW = card ? card.w : 0, cardH = card ? card.h : 0;
  const cardClip = `${P}-cardclip`;
  /** card rectangle once fully printed (stage coordinates) */
  const cardFinal = card ? {x: slotX - cardW / 2, y: slotY + 4 - (cardH - 6), w: cardW, h: cardH - 6} : null;

  // --- researcher
  let rig = null;
  let look = null;
  const RS = G.researcher;
  if (withPerson && RS) {
    look = actorLook(ctx, o.researcher || null, 0);
    rig = personRig(ctx, {name: `${P}-rs`, look, pose: 'standing'});
  }

  // --- result dots in the housing's lower bezel: one per link, lit when its
  // passage is marked. Left of the power light unless the keyboard tray is
  // there (then right of it), never on the related-wording list.
  // A substituted wording (inspect) that links its passage again lights its own
  // dot in the slot of the link it replaces (same passage), else a new slot.
  const altSlot = altLinks.map((al, k) => {
    const same = links.findIndex(l => l.m.source === al.m.source && l.m.passage === al.m.passage);
    return same >= 0 ? same : links.length + k;
  });
  const nSlots = Math.max(links.length, ...altSlot.map(sl => sl + 1));
  const dotR = 8;
  const Hh = G.housing;
  const dotY = Hh.y + Hh.h - 19;
  const dotStep = Math.min(dotR * 2 + 9, (Hh.w / 2 - 50) / Math.max(1, nSlots));
  const kb = K.kbBox;
  const hitsKb = x0 => Array.from({length: nSlots}).some((_, i) => {
    const x = x0 + i * dotStep;
    return x + dotR > kb.x && x - dotR < kb.x + kb.w && dotY + dotR > kb.y && dotY - dotR < kb.y + kb.h;
  });
  const leftX = scr.x + 18;
  const rightX = Hh.x + Hh.w / 2 + 28;
  const dotX0 = hitsKb(leftX) && !hitsKb(rightX) ? rightX : leftX;
  const dotNode = (l, name, slot, opacity) => h('circle', {name, cx: r(dotX0 + slot * dotStep), cy: r(dotY), r: dotR, fill: l.m.kind === 'contextual' ? th.paper : l.m.color.c, stroke: l.m.color.c, 'stroke-width': 2.5, 'stroke-dasharray': l.m.kind === 'contextual' ? '4 3' : null, opacity});
  const resultDots = g(null,
    links.map((l, i) => dotNode(l, `${P}-rd${i}`, i, 0.18)),
    altLinks.map((l, k) => dotNode(l, `${P}-ra${k}`, altSlot[k], 0)));

  // --- labels (key level): researcher and kiosk captions, standing on the floor
  const chips = [];
  const chipBoxes = {};
  const floorChip = (text, x, maxWidth, name) => {
    const size = G.chip;
    const probe = chip(ctx, text, {x, y: 0, anchor: 'middle', maxWidth, size, maxLines: 2});
    const c = chip(ctx, text, {x, y: G.floor + 16 - probe.box.h, anchor: 'middle', maxWidth, size, maxLines: 2, name});
    chips.push(c);
    return c.box;
  };
  if (ctx.show('key') && o.kioskLabel) chipBoxes.kiosk = floorChip(o.kioskLabel, G.colX, vertical ? 320 : 330, `${P}-chipK`);
  if (ctx.show('key') && rig && o.researcherLabel) chipBoxes.researcher = floorChip(o.researcherLabel, RS.x + (vertical ? 24 : 0), vertical ? 300 : 320, `${P}-chipR`);

  const node = g({name: P},
    g({transform: T(bc.x, bc.y)}, shelf2.node),
    vols.map(vol => g({transform: T(vol.x, vol.y)}, vol.v.node)),
    K.back,
    links.map(l => l.thread.node),
    altLinks.map(l => l.thread.node),
    // tokens travel behind the housing and emerge from its side
    links.map(l => l.token.node),
    altLinks.map(l => l.token.node),
    card ? g(null,
      h('defs', null, h('clipPath', {id: ctx.id(cardClip)}, h('rect', {x: slotX - cardW, y: slotY - cardH - 400, width: cardW * 2, height: cardH + 400}))),
      g({'clip-path': ctx.ref(cardClip)}, g({name: `${P}-cardg`, transform: T(slotX - cardW / 2, slotY + 4)}, card.node))) : null,
    K.slot,
    K.housing,
    g({transform: T(sb.x, sb.y)}, box.node),
    dd ? g({transform: T(ddAt.x, ddAt.y)}, dd.node) : null,
    K.keyboard,
    resultDots,
    rig ? rig.node : null,
    chips.map(c => c.node),
  );

  const restNear = RS ? {x: RS.x + RS.facing * 40 * RS.k, y: G.floor - 150 * RS.k} : null;
  const P2 = q => ({x: r(q.x), y: r(q.y)});
  /** researcher silhouette box (stage coordinates) */
  const researcherBox = RS ? {x: RS.x - 70 * RS.k, y: G.floor - 420 * RS.k, w: 140 * RS.k, h: 420 * RS.k} : null;

  /**
   * Pose from action values.
   * @param {{approach?:number, type?:number, press?:number, bloom?:number, links?:Array<{travel:number, tab:number, mark:number}>,
   *   alt?:Array<{travel:number, tab:number, mark:number}>, linkFade?:Array<number>, print?:number, altSwap?:number, look?:number}} s
   */
  function pose(s) {
    const nodes = {};
    const type = clamp(s.type ?? 0);
    const pulse = o.query.terms.map((_, ti) => {
      let best = 0;
      links.forEach((l, i) => {
        if (l.m.term !== ti || l.m.kind !== 'exact') return;
        const tr = s.links && s.links[i] ? s.links[i].travel : 0;
        const pu = seg(tr, 0, 0.3);
        if (pu > 0 && pu < 1) best = Math.max(best, pu);
      });
      return best;
    });
    Object.assign(nodes, box.frame({type, press: s.press ?? 0, altSwap: s.altSwap ?? 0, pulse}));
    if (dd) Object.assign(nodes, dd.frame(s.bloom ?? 0));
    // links
    const states = vols.map(() => ({}));
    const tokens = [];
    const linkSem = [];
    const Hs = G.housing;
    const doLink = (l, st, key, fade = 1) => {
      const travel = clamp(st ? st.travel : 0);
      // launched from the chip (the first part is hidden by the housing), soft landing on the tab
      const e = 1 - Math.pow(1 - travel, 2.2);
      Object.assign(nodes, l.thread.frame(e, fade));
      const pos = l.thread.at(e);
      // the token is only shown once it is completely clear of the housing
      // (fading in over a short distance), so it never appears cut in half
      const hw = l.token.w / 2, hh = l.token.h / 2;
      const sep = Math.max(Hs.x - (pos.x + hw), (pos.x - hw) - (Hs.x + Hs.w), Hs.y - 12 - (pos.y + hh), (pos.y - hh) - (Hs.y + Hs.h));
      const flying = travel > 0 && travel < 1;
      const lift = flying && !ctx.reduced ? Math.sin(Math.PI * travel) : 0;
      nodes[`${l.pre}-tok`] = {opacity: flying ? r(clamp(sep / 14), 3) : 0, transform: T(pos.x, pos.y, 0, 1 + 0.12 * lift)};
      states[l.m.source][key] = {tab: (st ? st.tab : 0) * fade, mark: (st ? st.mark : 0) * fade};
      tokens.push({x: r(pos.x), y: r(pos.y)});
      linkSem.push({key, travel: r(travel, 3), tab: r((st ? st.tab : 0) * fade, 3), mark: r((st ? st.mark : 0) * fade, 3), end: P2(l.end), token: P2(pos), kind: l.m.kind, term: l.m.term, source: l.m.source, passage: l.m.passage});
    };
    // result dots follow the dependent state: lit only while the link stands
    // (a retracted link dims its dot together with its tab and thread)
    const dotLit = (st, fade) => (st && st.mark >= 1 ? clamp(fade) : 0);
    links.forEach((l, i) => {
      const st = s.links ? s.links[i] : null;
      const fade = s.linkFade ? s.linkFade[i] ?? 1 : 1;
      doLink(l, st, l.m.key, fade);
      nodes[`${P}-rd${i}`] = {opacity: r(0.18 + 0.82 * dotLit(st, fade), 3)};
    });
    altLinks.forEach((l, i) => {
      const st = s.alt ? s.alt[i] : null;
      doLink(l, st, l.altKey, 1);
      nodes[`${P}-ra${i}`] = {opacity: r(dotLit(st, 1), 3)};
    });
    vols.forEach((vol, i) => Object.assign(nodes, vol.v.frame(states[i], s.altSwap ?? 0)));

    // card: rises row by row as lines are printed
    let cardTop = null;
    let printed = 0;
    if (card) {
      printed = s.print ?? 0; // number of lines printed (float)
      const rowsOut = printed / card.cols;
      const rise = printed > 0 ? Math.min(cardH - 6, card.headH + 8 + card.lineH * rowsOut + (printed >= cardLines.length ? cardH : 0)) : 0;
      nodes[`${P}-cardg`] = {transform: T(slotX - cardW / 2, slotY + 4 - rise)};
      Object.assign(nodes, card.frame(printed));
      cardTop = {x: slotX, y: slotY + 4 - rise};
    }

    // researcher
    let reached = true;
    let handNear = null;
    let handTarget = null;
    if (rig) {
      const kp = K.keyPts;
      const approach = clamp(s.approach ?? 0);
      let target;
      const onKeys = i => ({x: kp[i % kp.length].x, y: kp[i % kp.length].y - 6});
      if ((s.press ?? 0) > 0) {
        const pr = clamp(s.press);
        const back = seg(pr, 0.62, 1);
        const down = Math.sin(Math.PI * seg(pr, 0.34, 0.62));
        const enterPt = {x: K.enter.x, y: K.enter.y - 8 + 8 * down};
        target = back > 0 ? mix(enterPt, restNear, ease.inOutCubic(back)) : mix(onKeys(G.keyRange[1] - 1), enterPt, ease.inOutCubic(seg(pr, 0, 0.34)));
      } else if (type > 0) {
        // hop across the keys while typing
        const steps = 7;
        const f = type * steps;
        const i0 = Math.floor(Math.min(steps - 1, f));
        const loc = f - i0;
        const [k0, k1] = G.keyRange;
        const span = Math.max(1, k1 - k0 - 1);
        // hop sequence starts on the first key and ends on the last one
        const keyAt = j => (j >= steps ? k1 - 1 : k0 + ((j * 3) % span));
        const a = onKeys(keyAt(i0));
        const b = onKeys(keyAt(i0 + 1));
        const q = mix(a, b, ease.inOutSine(loc));
        target = {x: q.x, y: q.y - 10 * Math.sin(Math.PI * loc)};
        if (type >= 1) target = onKeys(G.keyRange[1] - 1);
      } else {
        target = mix(restNear, onKeys(G.keyRange[0]), ease.inOutCubic(approach));
      }
      const headTilt = (s.look ?? 0) * (vertical ? -6 : 6);
      const fr = rig.frame({x: RS.x, y: G.floor, facing: RS.facing, scale: RS.k, near: target, far: null, headTilt});
      Object.assign(nodes, fr.nodes);
      reached = fr.reached;
      handNear = fr.hands.near;
      handTarget = target;
    }

    const doneMarks = linkSem.filter(l => l.mark >= 1).length;
    const dotsLit = Object.keys(nodes).filter(k => (k.startsWith(`${P}-rd`) || k.startsWith(`${P}-ra`)) && nodes[k].opacity > 0.6).length;
    return {
      nodes,
      semantic: {
        typed: r(type, 3),
        tokens,
        links: linkSem,
        marked: doneMarks,
        dotsLit,
        cardTop: cardTop && P2(cardTop),
        cardLines: r(printed, 3),
        handNear: handNear && P2(handNear),
        handTarget: handTarget && P2(handTarget),
        allReached: reached,
      },
    };
  }

  return {
    node, pose, W, H, G, matches, links, altLinks, vols, box, sb, dd, ddAt, card, cardLines, cardFinal, colors, K, shelf: shelf2, rig,
    chipBoxes, researcherBox, bookcaseBox: {x: bc.x - 10, y: bc.y - 6, w: bc.w + 20, h: bcH + 6},
    slot: {x: slotX, y: slotY},
    /** stage point of a volume-local point */
    volPoint: (i, q) => ({x: vols[i].x + q.x, y: vols[i].y + q.y}),
    chipWorld,
  };
}

/* ------------------------------------------------------------------ */
/* Mechanism pieces: card-catalogue drawer, passage strip, mini library */
/* ------------------------------------------------------------------ */

/**
 * Card-catalogue drawer with one index card per term. The front card (the
 * featured term) stands raised and lists its postings (volume + passage);
 * the other terms' cards stand behind with coloured tabs. Local origin =
 * top-left of the element box; `raise` (0..1) lifts the front card.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, terms:Array<{text:string, related?:string[]}>, featured:number,
 *   postings:Array<{text:string, kind:string, featured?:boolean}>, related?:string[], colors:Array<{c:string,soft:string}>, seeAlso?:string}} o
 */
export function cardDrawer(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const showText = ctx.show('all');
  const wood = '#b58a5c';
  const drawerH = hh * 0.3;
  const dy = hh - drawerH;
  const cw = w * 0.82, ch = hh * 0.68;
  const cx0 = (w - cw) / 2;
  const col = o.colors[o.featured % o.colors.length];
  // back cards (other terms): standing a little higher and to the right so
  // their coloured tab and heading show above the front card
  const cardY0 = dy - ch * 0.84;
  const others = o.terms.map((t, i) => ({t, i})).filter(x => x.i !== o.featured);
  const back = others.map((x, k) => {
    const c2 = o.colors[x.i % o.colors.length];
    const off = (others.length - k);
    const bx = cx0 + off * 20, by = cardY0 - off * 44;
    const tabW = cw * 0.34;
    const tabX = bx + cw - tabW - 14 - off * 10;
    const f = showText ? ctx.fit(x.t.text, {maxWidth: cw * 0.5, size: 22, minSize: 12, maxLines: 1, weight: 700}) : null;
    return g(null,
      h('path', {d: `M${r(tabX)} ${r(by + 2)}v-22q0 -7 7 -7h${r(tabW - 14)}q7 0 7 7v22Z`, fill: c2.c, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: r(bx), y: r(by), width: r(cw), height: r(ch), rx: 5, fill: '#f3ead3', stroke: th.ink, 'stroke-width': 2}),
      h('line', {x1: r(bx + 10), x2: r(bx + cw - 10), y1: r(by + 36), y2: r(by + 36), stroke: '#c8553d', 'stroke-width': 1.8, opacity: 0.7}),
      f ? textBlock(f, {x: bx + 14, y: by + 18 - f.size / 2, fill: shade(c2.c, -0.3)}) : h('rect', {x: r(bx + 14), y: r(by + 12), width: r(cw * 0.3), height: 10, rx: 5, fill: c2.c, opacity: 0.8}),
    );
  });
  // front (featured) card, raised by `raise`
  const pad = 14;
  const headH = Math.min(46, ch * 0.2);
  const headF = ctx.fit(o.terms[o.featured].text, {maxWidth: cw * 0.6, size: Math.min(28, headH * 0.66), minSize: 13, maxLines: 1, weight: 800});
  const lines = o.postings.slice(0, 5);
  const extra = o.related && o.related.length ? 1 : 0;
  // lines are laid out in the part of the card that stands above the drawer
  const visibleH = ch * 0.84 - 30;
  const lineH = Math.min(46, (visibleH - headH - 8) / Math.max(3, lines.length + extra));
  const size = Math.min(27, lineH * 0.66);
  const cardParts = [
    h('path', {d: roundRectPath(5, 7, cw, ch, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, cw, ch, 6), fill: '#fbf6e8', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: `M${r(cw * 0.62)} 2v-22q0 -7 7 -7h${r(cw * 0.3)}q7 0 7 7v22Z`, fill: col.c, stroke: th.ink, 'stroke-width': 2}),
    h('line', {x1: 10, x2: cw - 10, y1: r(headH), y2: r(headH), stroke: '#c8553d', 'stroke-width': 2.2}),
    h('circle', {cx: cw / 2, cy: r(ch - 12), r: 6, fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.5}),
  ];
  if (showText) cardParts.push(textBlock(headF, {x: pad, y: (headH - headF.size) / 2, fill: shade(col.c, -0.3)}));
  else cardParts.push(h('rect', {x: pad, y: r(headH / 2 - 6), width: r(Math.min(cw * 0.5, headF.width)), height: 12, rx: 6, fill: col.c}));
  const lineNodes = [];
  lines.forEach((ln, i) => {
    const y = headH + (i + 1) * lineH;
    lineNodes.push(h('line', {x1: 10, x2: cw - 10, y1: r(y), y2: r(y), stroke: '#b9cde0', 'stroke-width': 1.3}));
    if (ln.featured) lineNodes.push(h('rect', {name: `${P}-feat`, x: 8, y: r(y - lineH + 3), width: r(cw - 16), height: r(lineH - 5), rx: 4, fill: col.c, 'fill-opacity': 0.22, stroke: col.c, 'stroke-width': 2, opacity: 0}));
    const f = ctx.fit(ln.text, {maxWidth: cw - pad * 2 - 22, size, minSize: 10, maxLines: 1, weight: 600, family: 'mono'});
    lineNodes.push(ln.kind === 'contextual'
      ? h('circle', {cx: pad + 6, cy: r(y - lineH * 0.45), r: 6, fill: th.paper, stroke: col.c, 'stroke-width': 2.5})
      : h('circle', {cx: pad + 6, cy: r(y - lineH * 0.45), r: 6.5, fill: col.c}));
    if (showText) lineNodes.push(textBlock(f, {x: pad + 22, y: y - lineH * 0.45 - f.size * 0.55, fill: '#2b3a55'}));
    else lineNodes.push(h('rect', {x: pad + 22, y: r(y - lineH * 0.45 - 4), width: r(Math.min(f.width, cw - pad * 2 - 30)), height: 8, rx: 4, fill: '#2b3a55', opacity: 0.6}));
  });
  if (extra) {
    const y = headH + (lines.length + 1) * lineH;
    const f = ctx.fit(`${o.seeAlso || '≈'} ${o.related.join(', ')}`, {maxWidth: cw - pad * 2, size: size * 0.9, minSize: 10, maxLines: 1, weight: 600, italic: true});
    if (showText) lineNodes.push(textBlock(f, {x: pad, y: y - lineH * 0.45 - f.size * 0.55, fill: col.c, italic: true}));
    else lineNodes.push(h('rect', {x: pad, y: r(y - lineH * 0.45 - 4), width: r(Math.min(f.width, cw - pad * 2)), height: 8, rx: 4, fill: col.c, opacity: 0.5}));
  }
  const cardY = cardY0;
  // the front card is clipped at the drawer opening: whatever is still inside
  // the drawer is genuinely hidden
  const clipId = `${P}-open`;
  const front = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {x: -60, y: -1200, width: w + 120, height: 1200 + dy - 12}))),
    g({'clip-path': ctx.ref(clipId)}, g({name: `${P}-front`}, g({transform: T(cx0, 0)}, cardParts, lineNodes))));
  // drawer box (front panel with brass pull and label holder), drawn over the card bottoms
  const drawer = g(null,
    h('path', {d: `M${r(cx0 - 26)} ${r(dy - 14)}L${r(cx0 - 10)} ${r(dy - 34)}H${r(w - cx0 + 10)}L${r(w - cx0 + 26)} ${r(dy - 14)}Z`, fill: shade(wood, -0.32), stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(0, dy - 14, w, drawerH + 14, 8), fill: wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(w / 2 - 50), y: r(dy + drawerH * 0.18), width: 100, height: r(drawerH * 0.3), rx: 3, fill: '#efe3c4', stroke: '#8a6d2a', 'stroke-width': 2}),
    h('path', {d: `M${r(w / 2 - 34)} ${r(dy + drawerH * 0.66)}q34 ${r(drawerH * 0.22)} 68 0`, fill: 'none', stroke: '#8a6d2a', 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(w / 2 - 34)} ${r(dy + drawerH * 0.66)}q34 ${r(drawerH * 0.22)} 68 0`, fill: 'none', stroke: '#d6b25e', 'stroke-width': 3.5, 'stroke-linecap': 'round'}),
  );
  const node = g({name: P},
    h('ellipse', {cx: w / 2, cy: hh + 4, rx: w * 0.52, ry: 12, fill: th.shadow}),
    back,
    front,
    drawer,
  );
  const frameFn = (raise, feat) => ({
    [`${P}-front`]: {transform: T(0, r(lerp(dy - ch * 0.25, cardY, ease.outCubic(clamp(raise)))))},
    ...(lines.some(l => l.featured) ? {[`${P}-feat`]: {opacity: r(clamp(feat), 3)}} : {}),
  });
  // the featured posting line (raised position): a relation that says the
  // card "lists" a passage leaves from this line
  const fi = Math.max(0, lines.findIndex(l => l.featured));
  const postingAt = {x0: cx0, x1: cx0 + cw, y: cardY + headH + (fi + 1) * lineH - lineH * 0.45, h: lineH};
  return {node, frame: frameFn, card: {x: cx0, y: cardY, w: cw, h: ch}, drawerTop: dy, top: cardY0 - others.length * 44 - 22, postingAt};
}

/**
 * A passage cut out of its page (exploded view): paper strip with the
 * passage text, its number and source, and the highlighter on the match.
 * Local origin = top-left.
 */
export function passageStrip(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w} = o;
  const showText = ctx.show('all');
  const pad = 18;
  const numW = 60;
  const size0 = o.size ?? 28;
  // header band with the source identifier (scales with `headSize`)
  const headSize = o.headSize ?? 18;
  const band = Math.max(26, headSize * 1.45);
  const fit = ctx.fit(o.text, {maxWidth: w - pad * 2 - numW, size: size0, minSize: 15, maxLines: 3, weight: 500, family: 'serif', leading: 1.2});
  const hh = Math.max(o.minH ?? 0, fit.height + pad * 2 + band + 2);
  const tx = pad + numW;
  const ty = band + 2 + (hh - band - 2 - fit.height) / 2;
  // token rects (same logic as volume)
  const lineWords = fit.lines.map(l => wordsOf(l.replace(/…$/, '')));
  const rects = [];
  let idx = 0;
  lineWords.forEach((ws, li) => {
    const a = Math.max(o.tokens[0], idx), b = Math.min(o.tokens[1], idx + ws.length);
    if (a < b) {
      const pre = ws.slice(0, a - idx).join(' ');
      const word = ws.slice(a - idx, b - idx).join(' ').replace(/[.,;:!?…)\]"'»”’]+$/, '');
      const px = pre ? ctx.measure(`${pre} `, fit.size, fit.weight, fit.family) : 0;
      rects.push({x: tx + px - 4, y: ty + li * fit.lineHeight - fit.size * 0.1, w: ctx.measure(word, fit.size, fit.weight, fit.family) + 8, h: fit.size * 1.18});
    }
    idx += ws.length;
  });
  const contextual = o.kind === 'contextual';
  const edge = `M0 6Q0 0 6 0H${w - 6}Q${w} 0 ${w} 6V${hh - 8}l-10 6l-12 -5l-14 6l-12 -5l-13 6l-12 -6l-12 5L${w - 90} ${hh - 4}H14l-8 -4l-6 3Z`;
  const idF = ctx.fit(o.sourceLabel, {maxWidth: w * 0.5, size: headSize, minSize: 11, maxLines: 1, weight: 700, family: 'mono'});
  const numF = ctx.fit(o.numLabel, {maxWidth: numW - 8, size: size0 * 0.8, minSize: 11, maxLines: 1, weight: 700});
  const parts = [
    h('path', {d: roundRectPath(6, 9, w, hh, 6), fill: th.shadow}),
    h('path', {d: edge, fill: th.paper, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('rect', {x: 0, y: 0, width: w, height: r(band), rx: 5, fill: o.cover, opacity: 0.9}),
    showText ? textBlock(idF, {x: pad, y: band / 2 - idF.size / 2, fill: '#ffffff'}) : h('rect', {x: pad, y: r(band / 2 - 4), width: r(idF.width), height: 8, rx: 4, fill: '#ffffff', opacity: 0.8}),
    rects.map((q, j) => h('rect', {name: `${P}-hl${j}`, x: r(q.x), y: r(q.y), width: 0, height: r(q.h), rx: 4, fill: contextual ? o.color.soft : o.color.c, 'fill-opacity': contextual ? 0.95 : 0.32})),
    showText ? textBlock(numF, {x: pad, y: ty + (fit.size - numF.size) * 0.4, fill: th.inkFaint}) : h('circle', {cx: pad + 8, cy: r(ty + fit.size * 0.5), r: 5, fill: th.inkFaint}),
    showText ? textBlock(fit, {x: tx, y: ty, fill: th.ink}) : fit.lines.map((ln, li) => h('rect', {x: tx, y: r(ty + li * fit.lineHeight + fit.size * 0.3), width: r(ctx.measure(ln, fit.size, fit.weight, fit.family)), height: r(fit.size * 0.42), rx: 3, fill: th.paperLine})),
    rects.map((q, j) => h('path', {name: `${P}-ul${j}`, d: `M${r(q.x + 2)} ${r(q.y + q.h + 2)}h${r(q.w - 4)}`, fill: 'none', stroke: o.color.c, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': contextual ? '2 7' : null, opacity: 0})),
  ];
  const frameFn = mark => {
    const out = {};
    rects.forEach((q, j) => {
      const pj = clamp(mark * rects.length - j);
      out[`${P}-hl${j}`] = {width: r(q.w * ease.outCubic(pj))};
      out[`${P}-ul${j}`] = {opacity: pj >= 1 ? 1 : 0};
    });
    return out;
  };
  // vertical centre of the matched word's line (where a tab would sit)
  const markY = rects.length ? rects[0].y + rects[0].h / 2 : ty + fit.size * 0.5;
  return {node: g({name: P}, parts), frame: frameFn, w, h: hh, markY, size: fit.size};
}

/**
 * Small library bookcase (spines only). The volume on level `gapLevel` is missing
 * from its shelf and marked by a dashed outline (it is shown elsewhere).
 * Local origin = top-left.
 */
export function miniLibrary(ctx, o) {
  const P = o.prefix;
  const {w, h: hh, n} = o;
  const bc = bookcase(ctx, {prefix: `${P}-bc`, w, h: hh, n, bookW: w - 52 - 12, seedKey: `${P}-lib`});
  const gaps = [];
  const L = bc.levels[o.gapLevel];
  const gw = Math.min(64, (L.x1 - L.x0) * 0.18);
  // `gapAt` (0 = left end, 1 = right end) puts the gap on the side the
  // relation to the volume arrives from
  const gx = Number.isFinite(o.gapAt) ? L.x0 + 6 + (L.x1 - L.x0 - gw - 12) * clamp(o.gapAt) : L.x0 + (L.x1 - L.x0) * 0.6;
  const gh = (L.floor - L.top) * 0.82;
  gaps.push(h('rect', {x: r(gx - 3), y: r(L.floor - gh - 6), width: r(gw + 6), height: r(gh + 6), fill: shade('#a87b52', -0.42)}));
  gaps.push(h('rect', {name: `${P}-gap`, x: r(gx), y: r(L.floor - gh), width: r(gw), height: r(gh), rx: 4, fill: 'none', stroke: o.color, 'stroke-width': 4, 'stroke-dasharray': '9 6', opacity: 0.35}));
  return {node: g({name: P}, bc.node, gaps), gap: {x: gx, y: L.floor - gh, w: gw, h: gh}, level: {x: L.x0, y: L.top, w: L.x1 - L.x0, h: L.floor - L.top}, frame: p => ({[`${P}-gap`]: {opacity: r(0.35 + 0.65 * clamp(p), 3)}})};
}
