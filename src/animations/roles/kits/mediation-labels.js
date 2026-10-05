/**
 * Editorial label helpers for the "Mediación entre partes" motif.
 *  - noteCallout: the shared callout (leader + chip) with a configurable line
 *    budget, so long author text can wrap to 3–5 lines instead of being cut
 *    (primitives/annotate.js `callout` is fixed at two lines);
 *  - fitNote: picks the largest font size whose callout fits a band without
 *    truncation;
 *  - overlaps / placeClear: box-overlap test and a small resolver that slides
 *    a label along candidate positions until it clears the occupied boxes.
 * @module animations/roles/kits/mediation-labels
 */
import {h, g} from '../../../core/svg.js';
import {r} from '../../../core/time.js';
import {fitText, measure} from '../../../core/text.js';
import {chip} from '../../../primitives/annotate.js';

/**
 * fitText variant for names and captions (same options and result shape):
 *  - a separator (" · ", " – ", " — ") stays at the end of the line before it,
 *    so no line starts with "· …";
 *  - shrinks (bounded by minSize) before it would break a word mid-way;
 *  - if a word is still wider than the line, it breaks after a hyphen or slash
 *    inside that word ("Bartholomew-" / "Nakamura"); only then (as fitText)
 *    at a character;
 *  - balances multi-line text (narrowest width with the same number of lines)
 *    so a short last word is not left alone on its own line.
 * @param {string} text
 * @param {Parameters<typeof fitText>[1] & {balance?:boolean}} o
 */
export function fitWords(text, o) {
  const full = String(text ?? '');
  const weight = o.weight ?? 400;
  const family = o.family ?? 'sans';
  const leading = o.leading ?? 1.18;
  const maxLines = o.maxLines ?? 2;
  const minSize = Math.max(8, o.minSize ?? o.size * 0.72);
  const maxWidth = Math.max(10, o.maxWidth);
  // a no-break space keeps words together (e.g. a value "5 min (hypothetical)");
  // it is carried as a word joiner and rendered/measured as a space
  const GLUE = '\u2060';
  const shown = t => t.replace(/\u2060/g, ' ');
  const m = (t, sz) => measure(shown(t), sz, weight, family);
  // tokens: words, with a lone separator glued to the word before it
  let tokens = [];
  for (const w of full.replace(/\u00a0/g, GLUE).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)) {
    if (/^[·•–—|:]$/.test(w) && tokens.length) tokens[tokens.length - 1] += ` ${w}`;
    else tokens.push(w);
  }
  if (!tokens.length) return fitText(full.replace(/\u00a0/g, ' '), o);
  const widest = sz => Math.max(...tokens.map(t => m(t, sz)));
  const step = Math.max(0.5, o.size * 0.04);
  let size = o.size;
  // bounded shrink so every word (and kept-together group) fits a line; a group
  // that does not fit even at minSize is released into separate words
  while (widest(size) > maxWidth && size > minSize) size = Math.max(minSize, size - step);
  if (widest(size) > maxWidth && tokens.some(t => t.includes(GLUE))) {
    tokens = tokens.flatMap(t => (t.includes(GLUE) && m(t, size) > maxWidth ? t.split(GLUE) : [t]));
    size = o.size;
    while (widest(size) > maxWidth && size > minSize) size = Math.max(minSize, size - step);
  }
  if (widest(size) > maxWidth) {
    // still too wide: split long tokens after an inner hyphen/slash
    tokens = tokens.flatMap(t => (m(t, size) > maxWidth ? t.replace(/([-‐/])(?=\S)/g, '$1\n').split('\n') : [t]));
    if (widest(size) > maxWidth) return fitText(full.replace(/\u00a0/g, ' '), {...o, size, minSize: size});
  }
  // greedy wrap; hyphen-split pieces join without a space
  const wrapAt = (w, sz) => {
    const lines = [];
    let cur = '';
    for (const t of tokens) {
      const joint = /[-‐/]$/.test(cur) && !cur.endsWith(' -') ? '' : ' ';
      const cand = cur ? cur + joint + t : t;
      if (!cur || m(cand, sz) <= w) cur = cand;
      else { lines.push(cur); cur = t; }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  let lines = wrapAt(maxWidth, size);
  while (lines.length > maxLines && size > minSize) {
    size = Math.max(minSize, size - step);
    lines = wrapAt(maxWidth, size);
  }
  let truncated = false;
  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && m(`${last}…`, size) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  } else if (o.balance !== false && lines.length > 1) {
    const n = lines.length;
    let lo = widest(size), hi = maxWidth;
    for (let i = 0; i < 14 && hi - lo > 1; i++) {
      const mid = (lo + hi) / 2;
      if (wrapAt(mid, size).length <= n) hi = mid;
      else lo = mid;
    }
    lines = wrapAt(hi, size);
  }
  lines = lines.map(shown);
  const width = Math.max(...lines.map(l => m(l, size)));
  const lineHeight = size * leading;
  return {lines, size, lineHeight, width, height: lineHeight * (lines.length - 1) + size, truncated, full: shown(full.replace(/\u00a0/g, ' ')), weight, family};
}

/** `chip` whose text is fitted with fitWords (no mid-word breaks, balanced lines). */
export function wchip(ctx, text, o) {
  return chip({theme: ctx.theme, fit: fitWords}, text, o);
}

/**
 * Callout (same frame protocol as annotate.callout): leader from the chip edge
 * nearest the target, target dot, chip.
 * @param {any} ctx
 * @param {{name:string, text:string, chipAt:{x:number,y:number}, anchor?:'start'|'middle'|'end', target:{x:number,y:number}, maxWidth:number, size?:number, minSize?:number, maxLines?:number, color?:string}} o
 */
export function noteCallout(ctx, o) {
  const c = wchip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: o.anchor ?? 'middle', maxWidth: o.maxWidth, size: o.size ?? 26, minSize: o.minSize, maxLines: o.maxLines ?? 2, fill: ctx.theme.card, stroke: o.color ?? ctx.theme.ink, color: ctx.theme.ink, name: `${o.name}-chip`});
  const b = c.box;
  const from = {
    x: Math.max(b.x + 12, Math.min(o.target.x, b.x + b.w - 12)),
    y: o.target.y > b.y + b.h ? b.y + b.h : o.target.y < b.y ? b.y : b.y + b.h / 2,
  };
  if (from.y === b.y + b.h / 2) from.x = o.target.x > b.cx ? b.x + b.w : b.x;
  const len = Math.hypot(o.target.x - from.x, o.target.y - from.y);
  const color = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(o.target.x), y2: r(o.target.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(o.target.x), cy: r(o.target.y), r: 7, fill: color, stroke: ctx.theme.card, 'stroke-width': 2.5, opacity: 0}),
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

/**
 * Largest callout (size from `size` down to `minSize`, up to `maxLines`) whose
 * chip bottom stays above `bottom` without truncating the text. Returns the
 * smallest attempt flagged `overflow` when nothing fits.
 * @param {any} ctx
 * @param {Parameters<typeof noteCallout>[1] & {bottom:number, step?:number}} o
 */
export function fitNote(ctx, o) {
  const step = o.step ?? Math.max(1, o.size * 0.06);
  let last = null;
  for (let size = o.size; size >= o.minSize - 1e-6; size -= step) {
    const note = noteCallout(ctx, {...o, size, minSize: size});
    last = note;
    if (!note.fit.truncated && note.box.y + note.box.h <= o.bottom) return {...note, overflow: false};
  }
  return {...last, overflow: true};
}

/** Axis-aligned overlap test with padding. */
export function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
}

/**
 * First candidate whose box clears every occupied box (and stays inside
 * `bounds`); falls back to the candidate with the least overlap area.
 * @template T
 * @param {Array<T & {box:{x:number,y:number,w:number,h:number}}>} candidates
 * @param {Array<{x:number,y:number,w:number,h:number}>} occupied
 * @param {{x:number,y:number,w:number,h:number}} [bounds]
 * @param {number} [pad]
 * @returns {T}
 */
export function placeClear(candidates, occupied, bounds, pad = 6) {
  let best = null, bestArea = Infinity;
  for (const c of candidates) {
    const b = c.box;
    const inside = !bounds || (b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h);
    let area = 0;
    for (const o of occupied) {
      if (!overlaps(b, o, pad)) continue;
      area += Math.max(0, Math.min(b.x + b.w, o.x + o.w) - Math.max(b.x, o.x) + pad) * Math.max(0, Math.min(b.y + b.h, o.y + o.h) - Math.max(b.y, o.y) + pad);
    }
    if (!inside) area += 1e7;
    if (area === 0) return c;
    if (area < bestArea) { best = c; bestArea = area; }
  }
  return best;
}
