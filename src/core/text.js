/**
 * Text measurement, wrapping and bounded fitting. Measurement uses a canvas
 * 2D context in browsers (same browser + same fonts = same layout) and a
 * documented width approximation elsewhere (Node import/unit tests).
 * User text is only ever placed through text nodes by the renderer.
 * @module core/text
 */

export const FONTS = {
  sans: "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  mono: "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
};

const APPROX = {sans: 0.54, serif: 0.5, mono: 0.61};
let ctx2d = null;
const cache = new Map();

function context() {
  if (ctx2d !== null) return ctx2d;
  try {
    if (typeof OffscreenCanvas !== 'undefined') ctx2d = new OffscreenCanvas(8, 8).getContext('2d');
    else if (typeof document !== 'undefined') ctx2d = document.createElement('canvas').getContext('2d');
    else ctx2d = false;
  } catch {
    ctx2d = false;
  }
  return ctx2d;
}

/** @param {'sans'|'serif'|'mono'} family */
export function fontString(size, weight = 400, family = 'sans', style = 'normal') {
  return `${style} ${weight} ${size}px ${FONTS[family] || FONTS.sans}`;
}

/**
 * Measure a single line of text.
 * @param {string} text
 * @param {number} size
 * @param {number} [weight]
 * @param {'sans'|'serif'|'mono'} [family]
 */
export function measure(text, size, weight = 400, family = 'sans') {
  const key = `${family}|${weight}|${size}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const c = context();
  let w;
  if (c) {
    c.font = fontString(size, weight, family);
    w = c.measureText(text).width;
  } else {
    w = text.length * size * (APPROX[family] || APPROX.sans) * (weight >= 600 ? 1.06 : 1);
  }
  if (cache.size > 20000) cache.clear();
  cache.set(key, w);
  return w;
}

/** Whether measurement uses a real font engine. */
export const measuresWithFonts = () => Boolean(context());

function breakLongWord(word, maxWidth, size, weight, family) {
  const parts = [];
  let cur = '';
  for (const ch of word) {
    if (cur && measure(cur + ch, size, weight, family) > maxWidth) {
      parts.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) parts.push(cur);
  return parts;
}

/** Greedy word wrap at a given size. */
export function wrap(text, maxWidth, size, weight = 400, family = 'sans') {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let cur = '';
  for (const word of words) {
    const pieces = measure(word, size, weight, family) > maxWidth ? breakLongWord(word, maxWidth, size, weight, family) : [word];
    for (const piece of pieces) {
      const candidate = cur ? `${cur} ${piece}` : piece;
      if (!cur || measure(candidate, size, weight, family) <= maxWidth) cur = candidate;
      else {
        lines.push(cur);
        cur = piece;
      }
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/**
 * @typedef {object} FitResult
 * @property {string[]} lines
 * @property {number} size
 * @property {number} lineHeight  absolute line advance
 * @property {number} width       widest line
 * @property {number} height      block height
 * @property {boolean} truncated  true when an ellipsis was applied
 * @property {string} full        the full original text (for accessible titles)
 */

/**
 * Fit text into a box by wrapping and bounded size reduction. Never shrinks
 * below `minSize`; if still too long, the last permitted line is truncated with
 * an ellipsis and `truncated` is set (the renderer keeps the full text in a
 * <title> so it remains accessible).
 * @param {string} text
 * @param {{maxWidth:number, maxLines?:number, size:number, minSize?:number, weight?:number, family?:'sans'|'serif'|'mono', leading?:number}} o
 * @returns {FitResult}
 */
export function fitText(text, o) {
  const full = String(text ?? '');
  const maxLines = o.maxLines ?? 2;
  const weight = o.weight ?? 400;
  const family = o.family ?? 'sans';
  const leading = o.leading ?? 1.18;
  const minSize = Math.max(8, o.minSize ?? o.size * 0.72);
  const maxWidth = Math.max(10, o.maxWidth);
  let size = o.size;
  let lines = wrap(full, maxWidth, size, weight, family);
  while (lines.length > maxLines && size > minSize) {
    size = Math.max(minSize, size - Math.max(0.5, o.size * 0.04));
    lines = wrap(full, maxWidth, size, weight, family);
  }
  let truncated = false;
  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && measure(`${last}…`, size, weight, family) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  const width = Math.max(...lines.map(l => measure(l, size, weight, family)));
  const lineHeight = size * leading;
  return {lines, size, lineHeight, width, height: lineHeight * (lines.length - 1) + size, truncated, full, weight, family};
}
