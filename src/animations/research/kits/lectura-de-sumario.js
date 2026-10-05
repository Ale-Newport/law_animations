/**
 * Kit for the "Lectura de sumario" motif (LAW-0057..0060).
 *
 * Original research objects, front view:
 *  - libraryShelf   a bookcase with seeded volumes; one volume carries the
 *                   same coloured index tab as the summary card;
 *  - searchScreen   a wall-mounted search box (query field, search button,
 *                   result rows; the matching row shares the tab colour);
 *  - summaryCard    the "ficha": an index card printed with the summary
 *                   (sumario), the decision id, its date and a pointer pill
 *                   (→ ¶ n) naming the paragraph it claims to summarise;
 *  - decisionPanel  a panel of the decision text (¶-numbered paragraphs, the
 *                   pointed passage printed in full with a highlighter band);
 *  - lectern        a reading stand with a ledge (and an optional top clip);
 *  - magnifier      a hand lens (origin at the grip).
 *
 * The summary card is the first panel of a FANFOLD: the decision text is
 * folded underneath it and rests on the lectern ledge. Lifting the card pulls
 * the panels out one by one, and it only opens AS FAR AS the panel that holds
 * the pointed passage — the rest of the decision stays folded on the ledge.
 *
 * `readingStage` assembles the scene per axis and exposes a pose solver
 * (action values → node props + semantics). Each entry owns its timeline.
 * Attachment rules enforced here and asserted through semantics:
 *  - while held, the card's grip point IS the researcher's solved near hand;
 *  - the strip's lowest point always rests on the ledge (no floating paper);
 *  - the lens is placed from the solved far hand (never detached).
 * @module animations/research/kits/lectura-de-sumario
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {mix, cubic, roundRectPath} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {PARAGRAPHS} from './lectura-de-sumario-fields.js';

export const CARD_FILL = '#fbf5e6';
const RULE_BLUE = '#bfd5ea';
const BOOK_COLORS = ['#7b3f3a', '#2f5d62', '#8a6a2f', '#46557a', '#6d4a6b', '#3e6b4a', '#9a5a3a', '#5a6470', '#a07c45', '#4d6b7d'];

/** Panels of decision text behind the card (two paragraphs each). */
export const PAGES = PARAGRAPHS / 2;
/** Page (1-based) that holds paragraph n. */
export const pageOf = n => Math.min(PAGES, Math.max(1, Math.ceil(n / 2)));

/**
 * One-line fit for identifiers: shrinks within bounds, then keeps the START
 * and the END of the text with a middle ellipsis (identifiers usually differ
 * at the end). The full text stays accessible through the <title>.
 */
export function fitId(ctx, text, o) {
  const f = ctx.fit(text, {...o, maxLines: 1});
  if (!f.truncated) return f;
  const full = String(text);
  const fits = str => ctx.measure(str, f.size, f.weight, f.family) <= o.maxWidth;
  let tail = Math.min(10, Math.floor(full.length / 2));
  let head = full.length - tail - 1;
  while (head > 1 && !fits(`${full.slice(0, head)}…${full.slice(full.length - tail)}`)) {
    head -= 1;
    if (head < tail && tail > 4) { tail -= 1; }
  }
  const line = `${full.slice(0, head)}…${full.slice(full.length - tail)}`;
  return {...f, lines: [line], width: ctx.measure(line, f.size, f.weight, f.family), truncated: true, full};
}

/**
 * A context whose `fit` wraps long identifiers AFTER their hyphens (or other
 * separators such as / _ .) instead of in the middle of a token
 * ("FICTIONAL-DECISION-" / "2026-00118-B", never "FICTIONAL-DECISI" / "ON-…").
 * Ordinary words wrap at spaces as usual. When the text cannot fit within
 * `maxLines` that way (down to `minSize`), it falls back to the standard fit.
 * Pass it to chip()/callout() for labels that may carry long identifiers.
 */
export function hyphenCtx(ctx) {
  const fit = (text, o) => {
    const full = String(text ?? '');
    const maxLines = o.maxLines ?? 2;
    const weight = o.weight ?? 400;
    const family = o.family ?? 'sans';
    const leading = o.leading ?? 1.18;
    const minSize = Math.max(8, o.minSize ?? o.size * 0.72);
    const maxWidth = Math.max(10, o.maxWidth);
    const words = full.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const wrapAt = size => {
      const m = s => ctx.measure(s, size, weight, family);
      const lines = [];
      let cur = '';
      for (const word of words) {
        // break after separators; a very short last segment ("-B") stays
        // with the one before it, so no line holds a lone letter
        const pieces = m(word) > maxWidth ? word.split(/(?<=[-‐–/_.])/) : [word];
        if (pieces.length > 1 && pieces[pieces.length - 1].length <= 2) pieces.splice(-2, 2, pieces.slice(-2).join(''));
        pieces.forEach((piece, j) => {
          const cand = cur ? `${cur}${j === 0 ? ' ' : ''}${piece}` : piece;
          if (!cur || m(cand) <= maxWidth) cur = cand;
          else { lines.push(cur); cur = piece; }
        });
      }
      if (cur) lines.push(cur);
      return lines.every(l => m(l) <= maxWidth) ? lines : null;
    };
    for (let size = o.size; size >= minSize - 1e-9; size -= Math.max(0.5, o.size * 0.04)) {
      const lines = wrapAt(size);
      if (lines && lines.length <= maxLines) {
        const width = Math.max(...lines.map(l => ctx.measure(l, size, weight, family)));
        return {lines, size, lineHeight: size * leading, width, height: size * leading * (lines.length - 1) + size, truncated: false, full, weight, family};
      }
    }
    return ctx.fit(text, o);
  };
  return {...ctx, fit};
}

/**
 * Narrowest chip width that keeps the same number of lines as `maxWidth`, so
 * wrapped labels are balanced instead of leaving an orphan word.
 * @returns {number} a maxWidth to pass to chip()/callout() (padding included)
 */
export function balancedWidth(ctx, text, maxWidth, size, {maxLines = 2, weight = 600} = {}) {
  const padX = size * 0.6;
  const fitAt = w => ctx.fit(text, {maxWidth: w - padX * 2, size, minSize: size * 0.75, maxLines, weight});
  const base = fitAt(maxWidth);
  if (base.lines.length < 2 || base.truncated) return maxWidth;
  let w = maxWidth;
  for (let cand = maxWidth - 8; cand > maxWidth * 0.4; cand -= 8) {
    const f = fitAt(cand);
    if (f.lines.length !== base.lines.length || f.size !== base.size || f.truncated) break;
    w = cand;
  }
  return w;
}

/**
 * Width for a "head · tail" chip label so that, when it cannot stay on one
 * line, it breaks right after the separator (never inside a short tail such
 * as "Vol. 12"). Falls back to `maxW`.
 */
export function pairWidth(ctx, head, tail, maxW, size, weight = 600) {
  const pad = size * 1.2 + 4;
  const m = t => ctx.measure(t, size, weight, 'sans') + pad;
  if (m(`${head} · ${tail}`) <= maxW) return maxW;
  const w1 = m(`${head} ·`), w2 = m(tail);
  return w1 <= maxW && w2 <= w1 ? Math.ceil(w1) : maxW;
}

/**
 * Annotation chip without a leader, keyed to its target by a colour swatch
 * (used where a straight leader would have to cross printed text).
 * Same frame API as callout(): frame(p) → opacity record.
 */
export function swatchNote(ctx, {name, text, x, y, maxWidth, size = 26, swatch, anchor = 'middle', maxLines = 2}) {
  const th = ctx.theme;
  const sw = size * 0.9;
  const c = chip(ctx, text, {x: 0, y: 0, maxWidth: maxWidth - sw - 12, size, maxLines, fill: th.card, stroke: th.ink, name: `${name}-chip`});
  const w = c.box.w + sw + 14;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const node = g({name, opacity: 0, transform: T(x0, y)},
    h('rect', {x: 0, y: (c.box.h - sw) / 2, width: sw, height: sw, rx: 5, fill: swatch, stroke: th.ink, 'stroke-width': 2}),
    g({transform: T(sw + 14, 0)}, c.node));
  return {node, box: {x: x0, y, w, h: c.box.h}, frame: p => ({[name]: {opacity: Math.min(1, Math.max(0, p * 1.6 - 0.3))}})};
}

/**
 * Orthogonal guide with rounded corners through free space (draw-on). Plain
 * relation styling: no arrowhead, dots at both ends.
 * @param {any} ctx
 * @param {{name:string, pts:{x:number,y:number}[], color:string, width?:number, radius?:number}} o
 */
export function elbowGuide(ctx, o) {
  const pts = o.pts;
  const rad = o.radius ?? 18;
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (i < pts.length - 1) {
      const c = pts[i + 1];
      const nextLen = Math.hypot(c.x - b.x, c.y - b.y);
      const k = Math.min(rad, segLen / 2, nextLen / 2);
      const u1 = {x: (b.x - a.x) / (segLen || 1), y: (b.y - a.y) / (segLen || 1)};
      const u2 = {x: (c.x - b.x) / (nextLen || 1), y: (c.y - b.y) / (nextLen || 1)};
      d += `L${r(b.x - u1.x * k)} ${r(b.y - u1.y * k)}Q${r(b.x)} ${r(b.y)} ${r(b.x + u2.x * k)} ${r(b.y + u2.y * k)}`;
    } else d += `L${r(b.x)} ${r(b.y)}`;
    len += segLen;
  }
  const first = pts[0], last = pts[pts.length - 1];
  const width = o.width ?? 4;
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {cx: first.x, cy: first.y, r: width * 1.8, fill: o.color}),
    h('circle', {name: `${o.name}-end`, cx: last.x, cy: last.y, r: width * 1.8, fill: o.color, opacity: 0}),
  );
  const frame = (p, opacity = 1) => ({
    [o.name]: {opacity: p > 0 ? opacity : 0},
    [`${o.name}-line`]: {'stroke-dashoffset': r(len * (1 - p))},
    [`${o.name}-end`]: {opacity: p >= 0.99 ? 1 : 0},
  });
  return {node, frame, len};
}

/* ------------------------------------------------------------------------ */
/* Summary card (ficha)                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Index card with the summary. Local origin = top-left of the card.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, header:string, decision:string, date:string, summary:string,
 *   pointer:number, showText:boolean, tab?:string, swap?:{field:'pointer'|'date'|'decision', before:string, after:string}}} o
 */
export function summaryCard(ctx, o) {
  const th = ctx.theme;
  const {w, h: H, prefix} = o;
  const k = w / 380;
  const pad = 20 * k;
  const tab = o.tab || th.accent3;
  const show = o.showText;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(6, 8, w, H, 8), fill: th.shadow}));
  // index tab on the top edge (shared colour with the result row and the volume)
  parts.push(h('path', {d: roundRectPath(w - 108 * k, -16 * k, 70 * k, 30 * k, 6), fill: tab, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, H, 8), fill: CARD_FILL, stroke: th.ink, 'stroke-width': th.stroke}));
  // header row + red rule + blue ruling
  const ruleY = 42 * k;
  const lineGap = 28 * k;
  parts.push(h('line', {x1: 10, x2: w - 10, y1: ruleY, y2: ruleY, stroke: th.accent, 'stroke-width': 2.2}));
  for (let i = 1; i <= 3; i++) parts.push(h('line', {x1: 10, x2: w - 10, y1: ruleY + i * lineGap, y2: ruleY + i * lineGap, stroke: RULE_BLUE, 'stroke-width': 1.5}));
  const headSize = 17 * k;
  const monoSize = 17 * k;
  const boxes = {};
  let headW = 86 * k;
  if (show) {
    const headText = String(o.header).toUpperCase();
    const hf = ctx.fit(headText, {maxWidth: w * 0.42, size: headSize, minSize: 12 * k, maxLines: 1, weight: 800});
    parts.push(textBlock(hf, {x: pad, y: 14 * k, fill: th.accent, letterSpacing: 1.2}));
    headW = hf.width + 1.2 * [...hf.lines[0]].length;
  } else {
    parts.push(h('rect', {x: pad, y: 18 * k, width: 86 * k, height: 11 * k, rx: 4, fill: th.accent, opacity: 0.75}));
  }
  // decision id (right) — may be the substituted datum. The header keeps its
  // natural width; the identifier gets the rest minus a fixed gap and is the
  // one that shrinks / middle-ellipsises first.
  const idMax = Math.max(w * 0.3, w - pad * 2 - headW - 22 * k);
  const idFit = v => fitId(ctx, v, {maxWidth: idMax, size: monoSize, minSize: 11 * k, weight: 600, family: 'mono'});
  const idX = w - pad;
  boxes.decision = {x: w - pad - idMax, y: 12 * k, w: idMax, h: 24 * k};
  if (show) {
    if (o.swap && o.swap.field === 'decision') {
      parts.push(textBlock(idFit(o.swap.before), {x: idX, y: 15 * k, anchor: 'end', fill: th.inkSoft, name: `${prefix}-sw0`}));
      parts.push(textBlock(idFit(o.swap.after), {x: idX, y: 15 * k, anchor: 'end', fill: th.accent2, name: `${prefix}-sw1`, opacity: 0}));
    } else parts.push(textBlock(idFit(o.decision), {x: idX, y: 15 * k, anchor: 'end', fill: th.inkSoft}));
  } else if (o.swap && o.swap.field === 'decision') {
    // labels hidden: the identifier becomes a bar whose length changes
    parts.push(h('rect', {name: `${prefix}-sw0`, x: w - pad - 96 * k, y: 18 * k, width: 96 * k, height: 10 * k, rx: 4, fill: th.inkSoft, opacity: 0.5}));
    parts.push(h('rect', {name: `${prefix}-sw1`, x: w - pad - 60 * k, y: 18 * k, width: 60 * k, height: 10 * k, rx: 4, fill: th.accent2, opacity: 0}));
  } else {
    parts.push(h('rect', {x: w - pad - 96 * k, y: 18 * k, width: 96 * k, height: 10 * k, rx: 4, fill: th.inkSoft, opacity: 0.5}));
  }
  // summary text on the ruled lines
  const sumTop = ruleY + 7 * k;
  const sumSize = 21 * k;
  boxes.summary = {x: pad, y: ruleY + 4 * k, w: w - pad * 2, h: lineGap * 3 - 6 * k};
  if (show) {
    const sf = ctx.fit(o.summary, {maxWidth: w - pad * 2, size: sumSize, minSize: 15 * k, maxLines: 3, weight: 500, family: 'serif', leading: lineGap / sumSize});
    const drop = (lineGap - sf.lineHeight) / 2;
    parts.push(textBlock(sf, {x: pad, y: sumTop + Math.max(0, drop), fill: th.ink, italic: true, name: `${prefix}-sum`}));
  } else {
    [0.92, 0.84, 0.55].forEach((f, i) => parts.push(h('rect', {x: pad, y: ruleY + lineGap * (i + 1) - 13 * k, width: (w - pad * 2) * f, height: 9 * k, rx: 4, fill: th.ink, opacity: 0.55})));
  }
  // footer: date (left), punch hole (centre), pointer pill (right). The date
  // may run up to the pill (the punch hole is dropped when it would be hit).
  const footY = H - 36 * k;
  const pillW = 108 * k, pillH = 32 * k;
  const pill = {x: w - pad - pillW + 6, y: H - pillH - 10 * k, w: pillW, h: pillH};
  const dateMax = pill.x - pad - 16 * k;
  const dateFit = v => ctx.fit(v, {maxWidth: dateMax, size: 16 * k, minSize: 11 * k, maxLines: 1, weight: 500, family: 'mono'});
  const dateVals = o.swap && o.swap.field === 'date' ? [o.swap.before, o.swap.after] : [o.date];
  const dateW = show ? Math.max(...dateVals.map(v => dateFit(v).width)) : 70 * k;
  boxes.date = {x: pad - 4, y: footY, w: dateW + 8, h: 28 * k};
  if (show) {
    if (o.swap && o.swap.field === 'date') {
      parts.push(textBlock(dateFit(o.swap.before), {x: pad, y: footY + 6 * k, fill: th.inkSoft, name: `${prefix}-sw0`}));
      parts.push(textBlock(dateFit(o.swap.after), {x: pad, y: footY + 6 * k, fill: th.accent2, name: `${prefix}-sw1`, opacity: 0}));
    } else parts.push(textBlock(dateFit(o.date), {x: pad, y: footY + 6 * k, fill: th.inkSoft}));
  } else if (o.swap && o.swap.field === 'date') {
    parts.push(h('rect', {name: `${prefix}-sw0`, x: pad, y: footY + 10 * k, width: 70 * k, height: 9 * k, rx: 4, fill: th.inkSoft, opacity: 0.5}));
    parts.push(h('rect', {name: `${prefix}-sw1`, x: pad, y: footY + 10 * k, width: 44 * k, height: 9 * k, rx: 4, fill: th.accent2, opacity: 0}));
  } else {
    parts.push(h('rect', {x: pad, y: footY + 10 * k, width: 70 * k, height: 9 * k, rx: 4, fill: th.inkSoft, opacity: 0.5}));
  }
  if (pad + dateW + 12 * k < w / 2 - 8 * k) parts.push(h('circle', {cx: w / 2, cy: H - 16 * k, r: 6.5 * k, fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.6}));
  boxes.pointer = pill;
  const arrow = h('path', {d: `M${r(pill.x + 12 * k)} ${r(pill.y + pillH / 2)}h${r(24 * k)}m${r(-9 * k)} ${r(-7 * k)}l${r(9 * k)} ${r(7 * k)}l${r(-9 * k)} ${r(7 * k)}`, fill: 'none', stroke: th.ink, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  const ptrFit = v => ctx.fit(v, {maxWidth: pillW - 50 * k, size: 19 * k, minSize: 12 * k, maxLines: 1, weight: 700, family: 'mono'});
  const ptrText = [];
  if (show) {
    if (o.swap && o.swap.field === 'pointer') {
      ptrText.push(textBlock(ptrFit(o.swap.before), {x: pill.x + 44 * k, y: pill.y + (pillH - 19 * k) / 2, fill: th.ink, name: `${prefix}-sw0`}));
      ptrText.push(textBlock(ptrFit(o.swap.after), {x: pill.x + 44 * k, y: pill.y + (pillH - 19 * k) / 2, fill: th.accent2, name: `${prefix}-sw1`, opacity: 0}));
    } else ptrText.push(textBlock(ptrFit(`¶ ${o.pointer}`), {x: pill.x + 44 * k, y: pill.y + (pillH - 19 * k) / 2, fill: th.ink}));
  } else {
    // labels hidden: the paragraph number becomes pips (¶ 3 → three dots)
    const pips = (n, name, fill, opacity) => {
      const count = Math.max(1, Math.min(6, Number(String(n).replace(/[^0-9]/g, '')) || 1));
      const gap = 11 * k;
      const x0 = pill.x + 46 * k;
      return g({name, opacity}, Array.from({length: count}, (_, i) => h('circle', {cx: x0 + i * gap, cy: pill.y + pillH / 2, r: 4.2 * k, fill})));
    };
    if (o.swap && o.swap.field === 'pointer') {
      ptrText.push(pips(o.swap.before, `${prefix}-sw0`, th.ink));
      ptrText.push(pips(o.swap.after, `${prefix}-sw1`, th.accent2, 0));
    } else ptrText.push(pips(o.pointer, null, th.ink));
  }
  parts.push(g({name: `${prefix}-ptr`},
    h('path', {d: roundRectPath(pill.x, pill.y, pill.w, pill.h, pillH / 2), fill: th.card, stroke: tab, 'stroke-width': 3}),
    arrow, ptrText));
  return {node: g({name: prefix}, parts), w, h: H, boxes};
}

/* ------------------------------------------------------------------------ */
/* Decision panel (a fold of the decision text)                              */
/* ------------------------------------------------------------------------ */

/**
 * One panel of the decision text. Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, paragraphs:number[], target:number|null, passage:string,
 *   header?:{decision:string, date:string}|null, showText:boolean, crease?:boolean, highlights?:number[],
 *   headerSwap?:{field:'date'|'decision', before:string, after:string}}} o
 *   `highlights`: paragraphs that get their own (initially hidden) highlighter band.
 */
export function decisionPanel(ctx, o) {
  const th = ctx.theme;
  const {w, h: H, prefix} = o;
  const k = w / 380;
  const pad = 18 * k;
  const show = o.showText;
  const parts = [];
  // Printed text lives in its own layer; `bars` is the same page drawn as
  // grey text bars. While a fold is foreshortened the scene shows the bars
  // (squashed glyphs are unreadable), then cross-fades to the text.
  const txt = [];
  const bars = [];
  const barRect = (x, y, bw, bh, fill, opacity = 1) => bars.push(h('rect', {x: r(x), y: r(y), width: r(Math.max(4, bw)), height: r(bh), rx: r(Math.min(4 * k, bh / 2)), fill, opacity}));
  parts.push(h('rect', {x: 0, y: 0, width: w, height: H, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}));
  if (o.crease !== false) {
    parts.push(h('rect', {x: 1.5, y: 1.5, width: w - 3, height: 7 * k, fill: th.ink, opacity: 0.07}));
    parts.push(h('path', {d: `M0 0l${r(9 * k)} ${r(6 * k)}M${w} 0l${r(-9 * k)} ${r(6 * k)}`, stroke: th.inkSoft, 'stroke-width': 1.6}));
  }
  let top = 12 * k;
  const headerBoxes = {};
  if (o.header) {
    const hs = o.headerSwap;
    // date first (it keeps its meaning only when whole); the identifier gets
    // the remaining width minus a fixed gap and middle-ellipsises if needed
    const dFit = v => ctx.fit(v, {maxWidth: (w - pad * 2) * 0.5, size: 16 * k, minSize: 10.5 * k, maxLines: 1, weight: 500, family: 'mono'});
    const dates = hs && hs.field === 'date' ? [hs.before, hs.after] : [o.header.date];
    const dW = Math.max(...dates.map(v => dFit(v).width));
    const idMax = Math.max(w * 0.3, w - pad * 2 - dW - 20 * k);
    headerBoxes.date = {x: w - pad - dW - 5 * k, y: top, w: dW + 10 * k, h: 26 * k};
    headerBoxes.decision = {x: pad - 5 * k, y: top, w: idMax + 10 * k, h: 26 * k};
    const iFit = v => fitId(ctx, v, {maxWidth: idMax, size: 18 * k, minSize: 11 * k, weight: 700, family: 'mono'});
    if (show) {
      const idAlt = hs && hs.field === 'decision' ? iFit(hs.after) : null;
      const dAlt = hs && hs.field === 'date' ? dFit(hs.after) : null;
      const idB = iFit(hs && hs.field === 'decision' ? hs.before : o.header.decision);
      const dB = dFit(hs && hs.field === 'date' ? hs.before : o.header.date);
      txt.push(textBlock(idB, {x: pad, y: top + 2 * k, fill: th.ink, name: idAlt ? `${prefix}-hsw0` : `${prefix}-hid`}));
      if (idAlt) txt.push(textBlock(idAlt, {x: pad, y: top + 2 * k, fill: th.accent2, name: `${prefix}-hsw1`, opacity: 0}));
      txt.push(textBlock(dB, {x: w - pad, y: top + 4 * k, anchor: 'end', fill: th.inkSoft, name: dAlt ? `${prefix}-hsw0` : `${prefix}-hdate`}));
      if (dAlt) txt.push(textBlock(dAlt, {x: w - pad, y: top + 4 * k, anchor: 'end', fill: th.accent2, name: `${prefix}-hsw1`, opacity: 0}));
      barRect(pad, top + 6 * k, idB.width, 11 * k, th.ink, 0.6);
      barRect(w - pad - dB.width, top + 7 * k, dB.width, 9 * k, th.inkSoft, 0.45);
    } else {
      parts.push(h('rect', {x: pad, y: top + 6 * k, width: w * 0.4, height: 11 * k, rx: 4, fill: th.ink, opacity: 0.7}));
      parts.push(h('rect', {x: w - pad - w * 0.2, y: top + 7 * k, width: w * 0.2, height: 9 * k, rx: 4, fill: th.inkSoft, opacity: 0.5}));
    }
    top += 30 * k;
    parts.push(h('line', {x1: pad, x2: w - pad, y1: top, y2: top, stroke: th.paperLine, 'stroke-width': 2}));
    top += 6 * k;
  }
  const bottom = H - 10 * k;
  const paras = o.paragraphs;
  const weights = paras.map(n => (n === o.target ? 1.7 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const avail = bottom - top;
  const numSize = 18 * k;
  const textX = 62 * k;
  const blocks = {};
  const hls = [];
  let y = top;
  paras.forEach((n, i) => {
    const bh = (avail * weights[i]) / total;
    const by = y;
    y += bh;
    const isT = n === o.target;
    // highlighter band (behind the text), one per requested paragraph
    const hlBox = {x: textX - 7 * k, y: by + 2 * k, w: w - textX - pad + 12 * k, h: bh - 6 * k};
    if ((o.highlights || (o.target ? [o.target] : [])).includes(n)) {
      hls.push(g({name: `${prefix}-hl${n}`, transform: T(hlBox.x, hlBox.y, 0, 0.001, 1), opacity: 0},
        h('rect', {x: 0, y: 0, width: hlBox.w, height: hlBox.h, rx: 5, fill: th.highlight})));
    }
    if (show) {
      const nf = ctx.fit(`¶ ${n}`, {maxWidth: textX - pad, size: numSize, minSize: 11 * k, maxLines: 1, weight: 700, family: 'mono'});
      txt.push(textBlock(nf, {x: pad, y: by + 6 * k, fill: isT ? th.ink : th.inkSoft}));
      barRect(pad, by + 9 * k, 26 * k, 11 * k, th.inkSoft, isT ? 0.8 : 0.45);
    } else {
      parts.push(h('rect', {x: pad, y: by + 9 * k, width: 26 * k, height: 11 * k, rx: 3, fill: th.inkSoft, opacity: isT ? 0.8 : 0.45}));
    }
    if (isT && show && o.passage) {
      const lines = Math.max(1, Math.min(3, Math.floor((bh - 8 * k) / (24 * k))));
      const pf = ctx.fit(o.passage, {maxWidth: w - textX - pad, size: 20 * k, minSize: 14 * k, maxLines: lines, weight: 500, family: 'serif'});
      txt.push(textBlock(pf, {x: textX, y: by + 6 * k, fill: th.ink, name: `${prefix}-psg`}));
      pf.lines.forEach((line, li) => barRect(textX, by + 6 * k + li * pf.lineHeight + pf.size * 0.3, ctx.measure(line, pf.size, pf.weight, pf.family), pf.size * 0.45, th.inkSoft, 0.8));
    } else {
      const bars = Math.max(1, Math.min(isT ? 3 : 2, Math.floor((bh - 10 * k) / (20 * k))));
      for (let b = 0; b < bars; b++) {
        const f = b === bars - 1 && bars > 1 ? 0.5 + ctx.rng(`${prefix}-bar`, n * 5 + b) * 0.25 : 0.85 + ctx.rng(`${prefix}-bar`, n * 5 + b) * 0.15;
        parts.push(h('rect', {x: textX, y: by + 12 * k + b * 20 * k, width: r((w - textX - pad) * f), height: 8 * k, rx: 4 * k, fill: isT ? th.inkSoft : th.paperLine, opacity: isT ? 0.8 : 1}));
      }
    }
    blocks[n] = {x: 0, y: by, w, h: bh, hl: hlBox};
  });
  const layered = show && txt.length;
  return {
    node: g({name: prefix}, parts.slice(0, 1), hls, parts.slice(1),
      layered ? g({name: `${prefix}-bars`, opacity: 0}, bars) : null,
      layered ? g({name: `${prefix}-txt`}, txt) : null),
    w, h: H, blocks, headerBoxes, layered: Boolean(layered),
    /**
     * Text ↔ bars for a fold opened to `e` (1 = flat and readable). Sequenced,
     * never overlapping: the bars are fully gone (e 0.86→0.93) before the
     * printed text fades in (e 0.93→1), so no frame shows text with bars
     * drawn through it (which reads as struck-out text).
     */
    fold: e => (layered ? {[`${prefix}-txt`]: {opacity: r(clamp((e - 0.93) / 0.07), 3)}, [`${prefix}-bars`]: {opacity: r(1 - clamp((e - 0.86) / 0.07), 3)}} : {}),
  };
}

/**
 * The pointed passage as a separate paper slip (lifted out of the decision).
 * Local origin = top-left. Highlighter band `${prefix}-hl` sweeps via frame.
 */
export function passageSlip(ctx, {prefix, w, h: H, n, text, showText}) {
  const th = ctx.theme;
  const k = w / 380;
  const pad = 18 * k;
  const textX = 64 * k;
  const hl = {x: textX - 8 * k, y: 10 * k, w: w - textX - pad + 14 * k, h: H - 20 * k};
  const parts = [
    h('path', {d: roundRectPath(6, 8, w, H, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, H, 6), fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}),
    // crease notches drawn INSIDE the slip's edges (in the side margins, clear of the text)
    h('path', {d: `M1.5 ${r(H * 0.5)}l${r(8 * k)} ${r(-6 * k)}M${r(w - 1.5)} ${r(H * 0.5)}l${r(-8 * k)} ${r(-6 * k)}`, stroke: th.inkSoft, 'stroke-width': 1.5, 'stroke-linecap': 'round'}),
    g({name: `${prefix}-hl`, transform: T(hl.x, hl.y, 0, 0.001, 1), opacity: 0}, h('rect', {x: 0, y: 0, width: hl.w, height: hl.h, rx: 6, fill: th.highlight})),
  ];
  if (showText) {
    const nf = ctx.fit(`¶ ${n}`, {maxWidth: textX - pad, size: 20 * k, minSize: 12, maxLines: 1, weight: 700, family: 'mono'});
    parts.push(textBlock(nf, {x: pad, y: 14 * k, fill: th.ink}));
    const lines = Math.max(1, Math.min(4, Math.floor((H - 20 * k) / (26 * k))));
    const pf = ctx.fit(text, {maxWidth: w - textX - pad, size: 22 * k, minSize: 15 * k, maxLines: lines, weight: 500, family: 'serif'});
    parts.push(textBlock(pf, {x: textX, y: 14 * k, fill: th.ink}));
  } else {
    parts.push(h('rect', {x: pad, y: 18 * k, width: 28 * k, height: 12 * k, rx: 3, fill: th.inkSoft}));
    [0.95, 0.9, 0.6].forEach((f, i) => parts.push(h('rect', {x: textX, y: 20 * k + i * 26 * k, width: (w - textX - pad) * f, height: 10 * k, rx: 5, fill: th.inkSoft, opacity: 0.8})));
  }
  const frame = p => ({[`${prefix}-hl`]: {transform: T(hl.x, hl.y, 0, Math.max(0.001, ease.outCubic(p)), 1), opacity: p > 0 ? 0.9 : 0}});
  return {node: g({name: prefix}, parts), w, h: H, frame};
}

/* ------------------------------------------------------------------------ */
/* Library shelf                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Front-view bookcase. Coordinates are world (stage) units.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, rows:number, target:{row:number, at:number}, seedKey:string, tab?:string, volumeColor?:string}} o
 */
export function libraryShelf(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: H, rows} = o;
  const side = 18, topH = 24, baseH = 30, board = 13;
  const wood = th.wood, dark = th.woodDark;
  const innerX = x + side, innerW = w - side * 2;
  const rowH = (H - topH - baseH) / rows;
  const rng = (k, i) => ctx.rng(`${o.seedKey}-${k}`, i);
  const parts = [];
  parts.push(h('rect', {x: x + 8, y: y + 10, width: w, height: H, rx: 6, fill: th.shadow}));
  parts.push(h('rect', {x, y, width: w, height: H, rx: 6, fill: shade(dark, -0.25), stroke: th.ink, 'stroke-width': th.stroke}));
  const books = [];
  let volume = null;
  for (let row = 0; row < rows; row++) {
    const floorY = y + topH + rowH * (row + 1) - board;
    const ceil = y + topH + rowH * row;
    const maxH = floorY - ceil - 10;
    let bx = innerX + 10;
    const targetX = o.target.row === row ? innerX + innerW * o.target.at : null;
    let i = 0;
    let placedTarget = false;
    while (bx < innerX + innerW - 40) {
      const isTarget = targetX !== null && !placedTarget && bx + 40 >= targetX;
      const bw = isTarget ? 46 : 20 + Math.floor(rng(`bw${row}`, i) * 22);
      if (bx + bw > innerX + innerW - 10) break;
      const bh = isTarget ? maxH * 0.94 : maxH * (0.68 + rng(`bh${row}`, i) * 0.3);
      const color = isTarget ? (o.volumeColor || th.accent2) : BOOK_COLORS[Math.floor(rng(`bc${row}`, i) * BOOK_COLORS.length)];
      const top = floorY - bh;
      const band = shade(color, 0.3);
      books.push(g(null,
        h('rect', {x: bx, y: top, width: bw, height: bh, rx: 3, fill: color, stroke: th.ink, 'stroke-width': 2}),
        h('rect', {x: bx + 2, y: top + 9, width: bw - 4, height: 5, fill: isTarget ? (o.tab || th.accent3) : band}),
        h('rect', {x: bx + 2, y: floorY - 16, width: bw - 4, height: 5, fill: isTarget ? (o.tab || th.accent3) : band}),
        h('rect', {x: bx + bw * 0.22, y: top + bh * 0.3, width: bw * 0.56, height: Math.min(34, bh * 0.22), rx: 2, fill: '#efe6d2', opacity: 0.9}),
      ));
      if (isTarget) {
        placedTarget = true;
        // the index tab sticking out of the volume (same colour as the card tab)
        books.push(h('path', {d: roundRectPath(bx + bw * 0.28, top - 22, 20, 30, 4), fill: o.tab || th.accent3, stroke: th.ink, 'stroke-width': 2}));
        volume = {x: bx, y: top - 22, w: bw, h: bh + 22};
      }
      bx += bw + 3;
      i++;
    }
    // a leaning book closes the row
    const lw = 22, lh = maxH * 0.8;
    const lx = Math.min(bx + 14, innerX + innerW - lw - 6);
    if (lx > bx) {
      books.push(h('rect', {x: lx, y: floorY - lh, width: lw, height: lh, rx: 3, fill: BOOK_COLORS[(row * 3 + 2) % BOOK_COLORS.length], stroke: th.ink, 'stroke-width': 2, transform: `rotate(-14 ${r(lx + lw)} ${r(floorY)})`}));
    }
    parts.push(h('rect', {x: innerX - 2, y: floorY, width: innerW + 4, height: board, fill: wood, stroke: th.ink, 'stroke-width': 2}));
  }
  parts.push(g(null, books));
  parts.push(h('rect', {x, y, width: side, height: H, rx: 4, fill: wood, stroke: th.ink, 'stroke-width': 2.2}));
  parts.push(h('rect', {x: x + w - side, y, width: side, height: H, rx: 4, fill: wood, stroke: th.ink, 'stroke-width': 2.2}));
  parts.push(h('rect', {x: x - 8, y, width: w + 16, height: topH, rx: 5, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.2}));
  parts.push(h('rect', {x: x - 4, y: y + H - baseH, width: w + 8, height: baseH, rx: 4, fill: dark, stroke: th.ink, 'stroke-width': 2.2}));
  return {node: g({name: o.prefix}, parts), box: {x, y, w, h: H}, volume};
}

/* ------------------------------------------------------------------------ */
/* Search screen (buscador)                                                  */
/* ------------------------------------------------------------------------ */

/**
 * Wall-mounted search box. World coordinates.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, title:string, query:string, decision:string, date:string, showText:boolean, tab?:string, mount?:boolean, rows?:number}} o
 */
export function searchScreen(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: H, prefix} = o;
  const show = o.showText;
  const k = Math.min(1.25, Math.max(0.8, Math.min(w / 440, H / 250)));
  const parts = [];
  if (o.mount !== false) {
    parts.push(h('path', {d: `M${r(x + w * 0.3)} ${r(y - 26)}V${r(y + 4)}M${r(x + w * 0.7)} ${r(y - 26)}V${r(y + 4)}`, stroke: th.metalDark, 'stroke-width': 7, 'stroke-linecap': 'round'}));
  }
  parts.push(h('path', {d: roundRectPath(x + 7, y + 10, w, H, 20), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, H, 20), fill: '#2a3036', stroke: th.ink, 'stroke-width': th.stroke}));
  const sx = x + 12, sy = y + 12, sw = w - 24, sh = H - 24;
  parts.push(h('path', {d: roundRectPath(sx, sy, sw, sh, 10), fill: '#f5f7f9'}));
  // title bar
  const barH = 34 * k;
  parts.push(h('path', {d: `M${sx} ${sy + barH}V${sy + 10}Q${sx} ${sy} ${sx + 10} ${sy}H${sx + sw - 10}Q${sx + sw} ${sy} ${sx + sw} ${sy + 10}V${sy + barH}Z`, fill: '#e1e6ec'}));
  ['#e06c5f', '#e2b04a', '#5fb26a'].forEach((c, i) => parts.push(h('circle', {cx: sx + 18 * k + i * 17 * k, cy: sy + barH / 2, r: 5.5 * k, fill: c})));
  if (show && o.title) {
    const tf = ctx.fit(o.title, {maxWidth: sw - 90 * k, size: 17 * k, minSize: 12, maxLines: 1, weight: 700});
    parts.push(textBlock(tf, {x: sx + 70 * k, y: sy + (barH - tf.size) / 2 + 1, fill: th.inkSoft}));
  }
  // search field + button
  const fy = sy + barH + 14 * k;
  const fh = 48 * k;
  const btn = fh;
  const fw = sw - 28 * k - btn - 10 * k;
  const fx = sx + 14 * k;
  parts.push(h('path', {d: roundRectPath(fx, fy, fw, fh, fh / 2), fill: '#fff', stroke: th.ink, 'stroke-width': 2.4}));
  parts.push(g({transform: T(fx + 26 * k, fy + fh / 2)},
    h('circle', {cx: -3 * k, cy: -3 * k, r: 9 * k, fill: 'none', stroke: th.inkSoft, 'stroke-width': 3}),
    h('line', {x1: 4 * k, y1: 4 * k, x2: 11 * k, y2: 11 * k, stroke: th.inkSoft, 'stroke-width': 3.4, 'stroke-linecap': 'round'})));
  const qx = fx + 48 * k;
  const qMax = fw - 62 * k;
  if (show) {
    const qf = ctx.fit(o.query, {maxWidth: qMax, size: 22 * k, minSize: 13, maxLines: 1, weight: 600});
    parts.push(textBlock(qf, {x: qx, y: fy + (fh - qf.size) / 2 + 1, fill: th.ink}));
  } else {
    parts.push(h('rect', {x: qx, y: fy + fh / 2 - 6 * k, width: qMax * 0.62, height: 12 * k, rx: 6 * k, fill: th.ink, opacity: 0.6}));
  }
  const bx = fx + fw + 10 * k;
  const btnC = {x: bx + btn / 2, y: fy + fh / 2};
  parts.push(g({name: `${prefix}-btn`, transform: T(btnC.x, btnC.y)},
    h('path', {d: roundRectPath(-btn / 2, -btn / 2, btn, btn, 12 * k), fill: th.accent2, stroke: th.ink, 'stroke-width': 2.4}),
    h('circle', {cx: -3 * k, cy: -3 * k, r: 9 * k, fill: 'none', stroke: '#fff', 'stroke-width': 3.2}),
    h('line', {x1: 4 * k, y1: 4 * k, x2: 11 * k, y2: 11 * k, stroke: '#fff', 'stroke-width': 3.6, 'stroke-linecap': 'round'})));
  // result rows
  // as many result rows as fit (at least the matching one)
  const ry0 = fy + fh + 14 * k;
  const avail = sy + sh - 10 - ry0;
  const rows = Math.max(1, Math.min(o.rows ?? 2, Math.floor(avail / (48 * k))));
  const rh = Math.min(64 * k, avail / rows - 8);
  let rowBox = null;
  for (let i = 0; i < rows; i++) {
    const ry = ry0 + i * (rh + 8);
    const box = {x: sx + 10 * k, y: ry, w: sw - 20 * k, h: rh};
    if (i === 0) {
      rowBox = box;
      parts.push(h('path', {name: `${prefix}-hit`, d: roundRectPath(box.x, box.y, box.w, box.h, 10), fill: th.accent3Soft, stroke: o.tab || th.accent3, 'stroke-width': 2.4, opacity: 0}));
    }
    parts.push(h('path', {d: roundRectPath(box.x + 10 * k, ry + 10 * k, 20 * k, 26 * k, 4), fill: i === 0 ? (o.tab || th.accent3) : th.paperLine, stroke: th.ink, 'stroke-width': 1.8}));
    const tx = box.x + 42 * k;
    const tMax = box.w - 52 * k;
    if (i === 0 && show) {
      const idf = ctx.fit(`${o.decision} · ${o.date}`, {maxWidth: tMax, size: 18 * k, minSize: 11, maxLines: 1, weight: 700, family: 'mono'});
      parts.push(textBlock(idf, {x: tx, y: ry + 9 * k, fill: th.ink}));
    } else {
      parts.push(h('rect', {x: tx, y: ry + 13 * k, width: tMax * (i === 0 ? 0.62 : 0.5), height: 10 * k, rx: 4, fill: i === 0 ? th.ink : th.inkFaint, opacity: 0.6}));
    }
    if (rh > 44 * k) parts.push(h('rect', {x: tx, y: ry + 38 * k, width: tMax * (i === 0 ? 0.86 : 0.72), height: 8 * k, rx: 4, fill: th.paperLine}));
  }
  const node = g({name: prefix}, parts);
  /**
   * @param {number} press  button press 0..1..0
   * @param {number} hit    result-row highlight 0..1
   */
  const frame = (press, hit) => ({
    [`${prefix}-btn`]: {transform: T(btnC.x, btnC.y, 0, 1 - 0.1 * press)},
    [`${prefix}-hit`]: {opacity: r(hit, 3)},
  });
  return {node, frame, rowBox, box: {x, y, w, h: H}, button: btnC};
}

/* ------------------------------------------------------------------------ */
/* Lectern, clip and magnifier                                               */
/* ------------------------------------------------------------------------ */

/** Front-view reading stand. `board` is drawn behind the paper, `lip` in front. */
export function lectern(ctx, o) {
  const th = ctx.theme;
  const {cx, ledgeY, w, boardH, floorY} = o;
  const bx = cx - w / 2;
  const board = g({name: `${o.prefix}-board`},
    h('rect', {x: cx - 16, y: ledgeY, width: 32, height: floorY - ledgeY - 18, fill: th.woodDark, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: `M${r(cx - 120)} ${r(floorY)}Q${r(cx - 110)} ${r(floorY - 26)} ${r(cx - 60)} ${r(floorY - 24)}H${r(cx + 60)}Q${r(cx + 110)} ${r(floorY - 26)} ${r(cx + 120)} ${r(floorY)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(bx + 6, ledgeY - boardH + 10, w, boardH, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(bx, ledgeY - boardH, w, boardH, 12), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(bx + 14, ledgeY - boardH + 14, w - 28, boardH - 26, 8), fill: shade(th.woodTop, -0.08)}),
  );
  const lip = h('path', {d: roundRectPath(bx - 14, ledgeY - 6, w + 28, 22, 6), fill: th.wood, stroke: th.ink, 'stroke-width': 2.4});
  return {board, lip};
}

/**
 * Binder clip seen from the front. Local origin = the paper's top edge at the
 * clip centre. The front jaw only overlaps the paper's top margin (≤ 9 units),
 * so printed text is never covered.
 */
export function paperClip(ctx, name, size = 1) {
  const th = ctx.theme;
  const s = size;
  return g({name},
    h('path', {d: `M${r(-30 * s)} ${r(-14 * s)}C${r(-34 * s)} ${r(-52 * s)} ${r(-8 * s)} ${r(-56 * s)} ${r(-6 * s)} ${r(-26 * s)}M${r(30 * s)} ${r(-14 * s)}C${r(34 * s)} ${r(-52 * s)} ${r(8 * s)} ${r(-56 * s)} ${r(6 * s)} ${r(-26 * s)}`, fill: 'none', stroke: th.metal, 'stroke-width': 4.5, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-42 * s)} ${r(-16 * s)}H${r(42 * s)}L${r(38 * s)} ${r(8 * s)}H${r(-38 * s)}Z`, fill: '#3b4148', stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('rect', {x: -34 * s, y: -12 * s, width: 68 * s, height: 4 * s, rx: 2, fill: '#fff', opacity: 0.25}),
  );
}

/**
 * Hand lens. Local origin = grip at the end of the handle; the lens centre is
 * at (`reach`, 0) along +x, so rotate the node to aim it.
 */
export function magnifier(ctx, {name, radius = 50, handle = 70}) {
  const th = ctx.theme;
  const reach = handle + radius;
  return {
    reach,
    radius,
    node: g({name},
      h('rect', {x: -8, y: -10, width: handle + 4, height: 20, rx: 10, fill: '#3b3f45', stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: handle - 16, y: -12, width: 16, height: 24, rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: reach, cy: 0, r: radius, fill: '#dbeaf5', 'fill-opacity': 0.28, stroke: '#3b3f45', 'stroke-width': 10}),
      h('circle', {cx: reach, cy: 0, r: radius + 5, fill: 'none', stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(reach - radius * 0.55)} ${r(-radius * 0.35)}A${r(radius * 0.62)} ${r(radius * 0.62)} 0 0 1 ${r(reach - radius * 0.1)} ${r(-radius * 0.62)}`, fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.8}),
    ),
  };
}

/* ------------------------------------------------------------------------ */
/* Reading stage                                                             */
/* ------------------------------------------------------------------------ */

/** Canonical stage sizes by axis (design units). */
export const STAGE = {horizontal: {w: 1600, h: 950}, square: {w: 1200, h: 1150}, vertical: {w: 965, h: 1450}};
/** Compact stages used in pairs (contrast): no side column for editorial chips. */
export const STAGE_COMPACT = {horizontal: {w: 1200, h: 800}, vertical: {w: 760, h: 1060}, stacked: {w: 1260, h: 750}};

/**
 * Geometry per axis. `held` = a researcher lifts the card; `clipped` = the
 * opened strip hangs from a clip on a tall stand (no person). `link` is the
 * bracket's offset from the strip's right edge.
 * The portrait `held` stage keeps a free column right of the bracket for the
 * editorial note at the passage's height; the researcher stands in front of
 * the bookcase's edge.
 * In the square and portrait `held` stages the researcher stands far enough
 * left of the strip that the hand holding the lifted card's left edge stays
 * well clear of the face (≥ 20 units between fist and nose).
 */
const GEO = {
  held: {
    horizontal: {floor: 862, shelf: [22, 134, 336, 728, 4], screen: [1164, 44, 416, 318], person: [476, 1.9], strip: [704, 380, 176], ledge: 620, lectern: [470, 150]},
    square: {floor: 1056, shelf: [22, 400, 270, 656, 4], screen: [22, 16, 500, 212], person: [340, 1.8], strip: [504, 360, 170], ledge: 870, lectern: [400, 150]},
    vertical: {floor: 1366, shelf: [16, 620, 230, 746, 4], screen: [40, 30, 885, 392], rows: 3, person: [222, 1.8], strip: [384, 340, 170], ledge: 1150, lectern: [360, 150], link: 26},
  },
  compact: {
    horizontal: {floor: 780, shelf: [16, 292, 220, 488, 3], screen: [16, 22, 324, 226], person: [470, 1.7], strip: [640, 380, 160], ledge: 560, lectern: [440, 130]},
    vertical: {floor: 1030, shelf: [0, 560, 150, 470, 3], screen: [16, 18, 728, 196], person: [240, 1.6], strip: [380, 340, 150], ledge: 790, lectern: [360, 120]},
    // one of two scenes stacked in a tall frame: short and wide, with a
    // larger card (its printed summary stays legible on a phone); the lens
    // waits held low in front of the body, left of the stand (`wait`)
    stacked: {floor: 730, shelf: [0, 330, 300, 400, 3], screen: [0, 40, 420, 230], person: [580, 1.63], strip: [760, 450, 190], ledge: 620, lectern: [470, 120], wait: [-70, -60], restAim: 82},
  },
  clipped: {
    horizontal: {floor: 862, shelf: [36, 92, 372, 770, 4], screen: [1190, 40, 390, 280], strip: [470, 380, 176], ledge: 800, lectern: [470, 0]},
    square: {floor: 1056, shelf: [22, 404, 270, 652, 4], screen: [22, 30, 500, 214], strip: [380, 360, 170], ledge: 1000, lectern: [440, 0]},
    vertical: {floor: 1366, shelf: [22, 566, 250, 800, 4], screen: [40, 40, 885, 300], strip: [300, 356, 170], ledge: 1280, lectern: [420, 0]},
  },
};
const SHEET = 7;
const EXTRA_SHEETS = 3;
/** Magnification of the text seen through the hand lens. */
const MAG = 1.7;

/** Partial cubic (0..t) as path data (de Casteljau split). */
function cubicPart(p0, p1, p2, p3, t) {
  const L = (a, b) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  const a = L(p0, p1), b = L(p1, p2), c = L(p2, p3);
  const d = L(a, b), e = L(b, c);
  const f = L(d, e);
  return `M${r(p0.x)} ${r(p0.y)}C${r(a.x)} ${r(a.y)} ${r(d.x)} ${r(d.y)} ${r(f.x)} ${r(f.y)}`;
}

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {'horizontal'|'square'|'vertical'|'stacked'} o.axis  ('stacked': compact only)
 * @param {'held'|'compact'|'clipped'} [o.mode]
 * @param {{query:string, database:string, library:string, volume:string, decision:string, date:string, summary:string, passage:string, paragraph:number, cardHeader:string}} o.content
 * @param {{name:string, role?:string, appearance?:object}} [o.researcher]
 * @param {boolean} [o.withLens]
 * @param {'summary'|'passage'} [o.magnify]  what the lens glass shows enlarged
 * @param {boolean} [o.withLink]
 * @param {boolean} [o.chips]        researcher / library chips
 * @param {number[]} [o.highlights]  paragraphs that get highlighter bands (default: the pointed one)
 * @param {object} [o.cardSwap]      pass-through to summaryCard (inspect)
 * @param {number} [o.libChipMax]    max width of the library chip (the entry may reserve room)
 */
export function readingStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const mode = o.mode || 'held';
  const G = GEO[mode][axis];
  const {w: W, h: H} = (mode === 'compact' ? STAGE_COMPACT : STAGE)[axis];
  const c = o.content;
  const showAll = ctx.show('all');
  const [sx0, sw0, hp] = G.strip;
  const target = Math.min(PARAGRAPHS, Math.max(1, c.paragraph));
  const targetPage = mode === 'clipped' ? PAGES : pageOf(target);
  const ledge = G.ledge;

  // --- library, search box, lectern
  const [shx, shy, shw, shh, rows] = G.shelf;
  const shelf = libraryShelf(ctx, {prefix: `${P}-shelf`, x: shx, y: shy, w: shw, h: shh, rows, target: {row: 1, at: 0.56}, seedKey: 'sumario-shelf'});
  const [scx, scy, scw, sch] = G.screen;
  const screen = searchScreen(ctx, {prefix: `${P}-screen`, x: scx, y: scy, w: scw, h: sch, title: c.database, query: c.query, decision: c.decision, date: c.date, showText: showAll, rows: G.rows});
  const stripCx = sx0 + sw0 / 2;
  const lect = lectern(ctx, {prefix: `${P}-lect`, cx: stripCx, ledgeY: ledge, w: G.lectern[0], boardH: mode === 'clipped' ? (PAGES + 1) * hp + 70 : G.lectern[1], floorY: G.floor});
  const seat = ledge - 6; // top surface of the lectern lip

  // --- the fanfold: card + decision panels + folded remainder
  const card = summaryCard(ctx, {prefix: `${P}-card`, w: sw0, h: hp, header: c.cardHeader, decision: c.decision, date: c.date, summary: c.summary, pointer: target, showText: showAll, swap: o.cardSwap});
  const highlights = o.highlights || [target];
  const pages = [];
  for (let k = 1; k <= PAGES; k++) {
    const paras = [2 * k - 1, 2 * k];
    const pg = decisionPanel(ctx, {
      prefix: `${P}-pg${k}`, w: sw0, h: hp, paragraphs: paras, target: paras.includes(target) ? target : null, passage: c.passage,
      header: k === 1 ? {decision: c.decision, date: c.date} : null, showText: showAll, highlights: highlights.filter(n => paras.includes(n)),
      headerSwap: k === 1 ? o.headerSwap : null,
    });
    pages.push(pg);
  }
  const pageNodes = pages.map((pg, i) => g({name: `${P}-pgw${i + 1}`, opacity: 0},
    pg.node,
    h('rect', {name: `${P}-pgsh${i + 1}`, x: 0, y: 0, width: sw0, height: hp, fill: th.ink, opacity: 0})));
  const maxSheets = EXTRA_SHEETS + PAGES;
  const stackNodes = [];
  for (let i = 0; i < maxSheets; i++) {
    const inset = i % 2 ? 3 : 0;
    stackNodes.push(h('rect', {name: `${P}-sheet${i}`, x: sx0 + inset, y: seat - (i + 1) * SHEET, width: sw0 - 3, height: SHEET, fill: i % 2 ? th.paper : th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.2}));
  }

  // --- researcher and lens
  const person = mode !== 'clipped' && o.researcher ? (() => {
    const look = actorLook(ctx, o.researcher, 0);
    return {rig: personRig(ctx, {name: `${P}-rig`, look, pose: 'standing'}), x: G.person[0], s: G.person[1], look};
  })() : null;
  // head box (with this hair style) in stage units: labels keep clear of it;
  // the tether also keeps clear of the neck (tetherBox)
  const HAIR_EXT = {bun: [49, 45, 40], long: [50, 48, 84], scarf: [52, 52, 70], curly: [49, 58, 40], short: [44, 48, 40], buzz: [42, 46, 40]};
  const headBox = person ? (() => {
    const [hl, ht, hb] = HAIR_EXT[person.look.hair] || [52, 58, 84];
    return {x: person.x + (5 - hl) * person.s, y: G.floor + (-366 - ht) * person.s, w: (hl + 46) * person.s, h: (ht + hb) * person.s};
  })() : null;
  const tetherBox = headBox ? {...headBox, h: G.floor - 290 * person.s - headBox.y} : null;
  const lens = o.withLens ? magnifier(ctx, {name: `${P}-lens`, radius: o.lensRadius ?? 50, handle: o.lensHandle ?? 72}) : null;

  // Pose helpers -------------------------------------------------------------
  const stackT = remaining => remaining * SHEET;
  const cardTopFor = E => seat - stackT(EXTRA_SHEETS + PAGES - E) - hp - E * hp;
  const gripLocal = {x: -8, y: 64}; // the hand pinches the card's left edge, clear of its text
  const shoulderFar = person ? {x: person.x - 14 * person.s, y: G.floor - 305 * person.s} : null;
  const restNear = person ? {x: person.x + 22 * person.s, y: G.floor - 156 * person.s} : null;
  const restFar = person ? {x: person.x - 10 * person.s, y: G.floor - 159 * person.s} : null;
  const finalE = mode === 'clipped' ? PAGES : targetPage;
  const finalTop = cardTopFor(finalE);
  const restTop = cardTopFor(0);
  // world box of paragraph n once the strip is opened to its final extension
  const blockWorld = (n, top = finalTop) => {
    const k = pageOf(n);
    const b = pages[k - 1].blocks[n];
    const y0 = top + hp * k;
    return {x: sx0 + b.x, y: y0 + b.y, w: b.w, h: b.h, hl: {x: sx0 + b.hl.x, y: y0 + b.hl.y, w: b.hl.w, h: b.hl.h}};
  };
  const cardBox = (top = finalTop) => ({x: sx0, y: top, w: sw0, h: hp});
  const cardPart = (name, top = finalTop) => {
    const b = card.boxes[name];
    return {x: sx0 + b.x, y: top + b.y, w: b.w, h: b.h};
  };
  /** World box of a header datum ('date' | 'decision') on the first decision panel. */
  const headerPart = (name, top = finalTop) => {
    const b = pages[0].headerBoxes[name];
    return b ? {x: sx0 + b.x, y: top + hp + b.y, w: b.w, h: b.h} : null;
  };

  // Link bracket (summary pointer → passage) at the final geometry -----------
  const linkOff = G.link ?? 34;
  /**
   * @param {number} n  paragraph the bracket lands on
   * @param {string} name  node name
   * @param {{off?:number, color?:string}} [lo]  `off`: bracket distance from the
   *   strip's right edge (e.g. to clear a wide stand board); `color`: stroke
   */
  const linkFor = (n, name, lo = {}) => {
    const pb = cardPart('pointer');
    const qb = blockWorld(n);
    const x0 = sx0 + sw0;
    const bx = x0 + (lo.off ?? linkOff);
    const color = lo.color ?? th.accent3;
    const y0 = pb.y + pb.h / 2;
    const y1 = qb.y + qb.h / 2;
    const rr = 14;
    const d = `M${r(pb.x + pb.w)} ${r(y0)}H${r(bx - rr)}Q${r(bx)} ${r(y0)} ${r(bx)} ${r(y0 + rr)}V${r(y1 - rr)}Q${r(bx)} ${r(y1)} ${r(bx - rr)} ${r(y1)}H${r(x0 + 4)}`;
    const len = (bx - rr - (pb.x + pb.w)) + (y1 - y0 - 2 * rr) + (bx - rr - x0 - 4) + Math.PI * rr;
    const node = g({name, opacity: 0},
      h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
      h('circle', {name: `${name}-a`, cx: pb.x + pb.w, cy: y0, r: 6.5, fill: color, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {name: `${name}-b`, cx: x0 + 4, cy: y1, r: 6.5, fill: color, stroke: th.ink, 'stroke-width': 2, opacity: 0}),
    );
    const frame = p => ({
      [name]: {opacity: p > 0 ? 1 : 0},
      [`${name}-line`]: {'stroke-dashoffset': r(len * (1 - p))},
      [`${name}-b`]: {opacity: p >= 0.99 ? 1 : 0},
    });
    return {node, frame, d, len, mid: {x: bx, y: (y0 + y1) / 2}, from: {x: pb.x + pb.w, y: y0}, to: {x: x0 + 4, y: y1}, bx, y0, y1};
  };
  const link = o.withLink ? linkFor(target, `${P}-link`) : null;

  // Tether: from the matching result row to the card, as a cubic that arcs
  // over the researcher's head when a straight run would cross it -----------
  const rb = screen.rowBox;
  const scrB = screen.box;
  const restCard = {x: sx0, y: restTop, w: sw0, h: hp};
  // where the search box hangs relative to the strip decides the tether's ends
  const side = scrB.x > sx0 + sw0 ? 'right' : axis === 'vertical' ? 'above' : 'left';
  const tFrom = side === 'right' ? {x: rb.x - 4, y: rb.y + rb.h / 2}
    : side === 'above' ? {x: rb.x + rb.w * 0.62, y: rb.y + rb.h + 14} : {x: rb.x + rb.w + 14, y: rb.y + rb.h / 2};
  const tTo = side === 'right' ? {x: restCard.x + restCard.w + 2, y: restCard.y + 22} : {x: restCard.x + restCard.w * 0.72, y: restCard.y - 18};
  const tether = (() => {
    const straight = [tFrom, mix(tFrom, tTo, 1 / 3), mix(tFrom, tTo, 2 / 3), tTo];
    const clear = pts => !tetherBox || [...Array(41).keys()].every(i => {
      const q = cubic(pts[0], pts[1], pts[2], pts[3], i / 40);
      return q.x < tetherBox.x - 14 || q.x > tetherBox.x + tetherBox.w + 14 || q.y < tetherBox.y - 14 || q.y > tetherBox.y + tetherBox.h + 14;
    });
    if (clear(straight)) return straight;
    for (let arc = Math.min(tFrom.y, tTo.y) - 20; arc >= -160; arc -= 10) {
      const pts = [tFrom, {x: tFrom.x + 30, y: arc}, {x: tTo.x - 110, y: arc}, tTo];
      if (clear(pts)) return pts;
    }
    return straight;
  })();

  // Lens grip: one handle angle per reading spot, chosen so the far hand stays
  // between the torso and the strip (visible, never behind the paper) with a
  // natural reach; the grip follows the spot as the card moves --------------
  const armLen = person ? (80 + 76 + 9) * person.s : 0;
  const handZone = person ? {x0: person.x + 42 * person.s + 10, x1: sx0 - 12} : null;
  const spotAt = (where, top) => (where === 'summary'
    ? {x: sx0 + 92 * (sw0 / 380), y: top + card.boxes.summary.y + card.boxes.summary.h / 2}
    : where === 'passage'
      // right of the ¶ number, so the glass never sits on the paragraph label
      ? (() => { const b = blockWorld(target, top); return {x: sx0 + Math.max(92 * (sw0 / 380), 56 * (sw0 / 380) + (lens ? lens.radius : 50) + 4), y: b.y + b.h / 2}; })()
      : where === 'wait'
        ? (G.wait ? {x: sx0 + G.wait[0], y: seat + G.wait[1]} : {x: sx0 + 10, y: seat + 10})
        : null);
  const phiFor = where => {
    if (!lens || !person) return null;
    const pts = where === 'summary' ? [spotAt(where, restTop), spotAt(where, finalTop)] : [spotAt(where, finalTop)];
    let best = null;
    for (let deg = 150; deg <= 250; deg += 5) {
      const a = (deg * Math.PI) / 180;
      const ok = pts.every(sp => {
        const gx = sp.x + Math.cos(a) * lens.reach, gy = sp.y + Math.sin(a) * lens.reach;
        const d = Math.hypot(gx - shoulderFar.x, gy - shoulderFar.y);
        return gx >= handZone.x0 && gx <= handZone.x1 && d <= armLen * 0.94 && d >= armLen * 0.45;
      });
      const score = Math.abs(deg - 190);
      if (ok && (!best || score < best.score)) best = {a, score};
    }
    return best ? best.a : null;
  };
  const PHI = lens ? {summary: phiFor('summary'), passage: phiFor('passage'), wait: phiFor('wait')} : {};

  // Magnified copy seen through the lens glass (same content, enlarged) -------
  let mag = null;
  if (lens && o.magnify) {
    const magR = lens.radius - 5;
    const isSum = o.magnify === 'summary';
    const copy = isSum
      ? summaryCard(ctx, {prefix: `${P}-mcard`, w: sw0, h: hp, header: c.cardHeader, decision: c.decision, date: c.date, summary: c.summary, pointer: target, showText: showAll, swap: o.cardSwap}).node
      : decisionPanel(ctx, {prefix: `${P}-mpg`, w: sw0, h: hp, paragraphs: [2 * targetPage - 1, 2 * targetPage], target, passage: c.passage,
        header: targetPage === 1 ? {decision: c.decision, date: c.date} : null, showText: showAll, highlights: [target]}).node;
    const clipId = `${P}-magclip`;
    mag = {
      where: o.magnify,
      node: g({name: `${P}-mag`, opacity: 0},
        h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${P}-magcirc`, cx: 0, cy: 0, r: magR}))),
        g({'clip-path': ctx.ref(clipId)}, g({name: `${P}-magc`}, copy))),
    };
  }

  // Chips ---------------------------------------------------------------------
  const chipsOn = o.chips !== false && ctx.show('key');
  const chipSize = axis === 'square' ? 30 : 28;
  const hitBox = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  // Library chip above the shelf, up to two lines; lifted above the
  // researcher's head (never on it) and kept below the search box.
  let libChip = null;
  if (chipsOn && c.library) {
    const text = c.volume ? `${c.library} · ${c.volume}` : c.library;
    const fitW = (mw, ln, sz) => (c.volume && pairWidth(ctx, c.library, c.volume, mw, sz) < mw ? pairWidth(ctx, c.library, c.volume, mw, sz) : balancedWidth(ctx, text, mw, sz, {maxLines: ln}));
    const maxW = o.libChipMax ?? Math.max(shw + 40, 300) + (axis === 'horizontal' ? 60 : 30);
    const lines = axis === 'horizontal' ? 2 : 3;
    const make = (mw, ln, sz = chipSize) => chip(ctx, text, {x: shx - 6, y: 0, anchor: 'start', maxWidth: fitW(mw, ln, sz), size: sz, maxLines: ln});
    const place = (chipRaw, bottom) => {
      const dy = Math.max(4 - chipRaw.box.y, bottom - chipRaw.box.h);
      return {chipRaw, dy, box: {...chipRaw.box, y: chipRaw.box.y + dy}};
    };
    const clear = b => !hitBox(b, scrB, 8) && (!headBox || !hitBox(b, headBox, 6)) && b.y + b.h <= shy - 4;
    // above the shelf at full width; if that lands on the researcher's head
    // or the search box, or has to truncate, try a narrower column (left of
    // the head) with one more line and then a slightly smaller size — the
    // label's meaning must survive; last resort: lift it above the head
    let pl = place(make(maxW, lines), shy - 8);
    if (!clear(pl.box) || pl.chipRaw.fit.truncated) {
      const onHead = headBox && hitBox(pl.box, headBox, 6);
      const mw = onHead ? headBox.x - 12 - (shx - 6) : maxW;
      const cands = mw >= 200 ? [[lines, 1], [lines + 1, 1], [lines + 1, 0.85]].map(([ln, f]) => place(make(mw, ln, chipSize * f), shy - 8)) : [];
      const ok = cands.filter(q => clear(q.box));
      const pick = ok.find(q => !q.chipRaw.fit.truncated) || ok[0];
      if (pick) pl = pick;
      else if (onHead) pl = place(make(maxW, lines), Math.min(shy - 8, headBox.y - 12));
    }
    const raw = pl.chipRaw;
    const dy = pl.dy;
    libChip = {node: g({name: `${P}-libchip`, transform: T(0, dy)}, raw.node), box: {...raw.box, y: raw.box.y + dy, cy: raw.box.cy + dy}};
  }
  // Researcher chip under the feet: name and role, up to two lines, kept
  // inside the stage.
  let readerChip = null;
  if (chipsOn && person) {
    const text = o.researcher.role ? `${o.researcher.name} · ${o.researcher.role}` : o.researcher.name;
    const maxW = axis === 'vertical' ? 560 : 640;
    const size = chipSize * 0.93;
    const raw = chip(ctx, text, {x: 0, y: G.floor + 8, anchor: 'middle', maxWidth: balancedWidth(ctx, text, maxW, size), size, maxLines: 2});
    let dx = person.x;
    if (raw.box.x + dx < 8) dx = 8 - raw.box.x;
    if (raw.box.x + raw.box.w + dx > W - 8) dx = W - 8 - raw.box.x - raw.box.w;
    readerChip = {node: g({name: `${P}-readerchip`, transform: T(dx, 0)}, raw.node), box: {...raw.box, x: raw.box.x + dx, cx: raw.box.cx + dx}};
  }

  const clipNode = mode === 'clipped' ? g({transform: T(stripCx, finalTop)}, paperClip(ctx, `${P}-clip`, 1.1)) : null;

  const node = g({name: P},
    h('rect', {x: 0, y: G.floor, width: W, height: 4, fill: th.ink, opacity: 0.12}),
    shelf.node,
    screen.node,
    lect.board,
    // the researcher stands behind the paper: the hand holds the card's edge
    // from behind, so arms never cover the printed text
    person && person.rig.node,
    g({name: `${P}-stack`}, stackNodes),
    g({name: `${P}-strip`},
      pageNodes.slice().reverse(),
      card.node),
    lect.lip,
    h('path', {name: `${P}-tether`, d: `M${r(tFrom.x)} ${r(tFrom.y)}`, fill: 'none', stroke: th.accent3, 'stroke-width': 3.5, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round', opacity: 0}),
    link && link.node,
    clipNode,
    mag && mag.node,
    lens && lens.node,
    libChip && libChip.node,
    readerChip && readerChip.node,
  );

  /**
   * Pose the stage.
   * @param {{press?:number, hit?:number, tether?:number, tetherFade?:number, reach?:number, lift?:number, mark?:number, link?:number,
   *   look?:number, lens?:{target:'summary'|'passage'|'wait'|'rest', go:number, from?:'summary'|'passage'|'wait'|'rest'},
   *   marks?:Record<number, number>}} s   `marks` drives each highlighter band directly (inspect)
   */
  function pose(s) {
    const nodes = {};
    Object.assign(nodes, screen.frame(s.press ?? 0, s.hit ?? 0));
    const lift = clamp(s.lift ?? 0);
    const E = mode === 'clipped' ? PAGES : targetPage * ease.inOutSine(lift);
    const top = cardTopFor(E);
    nodes[`${P}-strip`] = {transform: T(sx0, top)};
    // panels: fully extended ones at full height, the peeling one foreshortened
    // (its printed text shows as bars until the fold is nearly flat)
    let yy = hp;
    const pageY = [];
    const pageE = [];
    for (let k = 1; k <= PAGES; k++) {
      const e = clamp(E - (k - 1));
      pageY.push(yy);
      pageE.push(e);
      nodes[`${P}-pgw${k}`] = {transform: `${T(0, yy)} scale(1 ${r(Math.max(0.001, e), 4)})`, opacity: e > 0.001 ? 1 : 0};
      nodes[`${P}-pgsh${k}`] = {opacity: r(0.3 * (1 - e), 3)};
      Object.assign(nodes, pages[k - 1].fold(e));
      yy += e * hp;
    }
    const remaining = EXTRA_SHEETS + PAGES - E;
    for (let i = 0; i < maxSheets; i++) nodes[`${P}-sheet${i}`] = {opacity: r(clamp(remaining - i), 3)};
    // highlighter sweep on the pointed passage
    const mark = clamp(s.mark ?? 0);
    for (const n of highlights) {
      const b = pages[pageOf(n) - 1].blocks[n];
      if (!b) continue;
      const on = s.marks ? clamp(s.marks[n] ?? 0) : n === target ? mark : 0;
      nodes[`${P}-pg${pageOf(n)}-hl${n}`] = {transform: T(b.hl.x, b.hl.y, 0, Math.max(0.001, ease.outCubic(on)), 1), opacity: on > 0 ? 0.9 : 0};
    }
    // tether from the matching result row to the resting card (drawn, then faded)
    const tp = clamp(s.tether ?? 0);
    const tf = clamp(s.tetherFade ?? 0);
    nodes[`${P}-tether`] = {d: cubicPart(tether[0], tether[1], tether[2], tether[3], Math.max(0.001, ease.outCubic(tp))), opacity: r(tp > 0 ? 1 - tf : 0, 3)};
    if (link) Object.assign(nodes, link.frame(clamp(s.link ?? 0)));

    // researcher: near hand reaches the grip, then holds it while lifting
    const grip = {x: sx0 + gripLocal.x, y: top + gripLocal.y};
    let handNear = null, handFar = null, reachedAll = true, lensC = null, lensGrip = null, lensOn = null, magOn = 0;
    if (person) {
      const rp = ease.inOutCubic(clamp(s.reach ?? 0));
      const nearTarget = lift > 0 || rp >= 1 ? grip : mix(restNear, grip, rp);
      // far hand: optional lens
      let farTarget = restFar;
      let lensAngle = 0;
      let L = null;
      if (lens) {
        L = s.lens || {target: 'rest', go: 0};
        const spot = where => (where === 'rest' ? null : where === 'wait' ? spotAt('wait', finalTop) : spotAt(where, top));
        // at rest the lens hangs from a hand held just in front of the body
        const restGrip = {x: person.x + 48 * person.s, y: G.floor - 182 * person.s};
        const gripFor = (where, spotPt) => {
          const a = PHI[where];
          if (a !== null && a !== undefined) return {x: spotPt.x + Math.cos(a) * lens.reach, y: spotPt.y + Math.sin(a) * lens.reach};
          const dx = shoulderFar.x - spotPt.x, dy = shoulderFar.y - spotPt.y;
          const d = Math.hypot(dx, dy) || 1;
          return {x: spotPt.x + (dx / d) * lens.reach, y: spotPt.y + (dy / d) * lens.reach};
        };
        const gp = ease.inOutCubic(clamp(L.go));
        lensOn = L.go >= 1 ? L.target : L.go <= 0 ? (L.from || 'rest') : 'moving';
        const from = L.from || 'rest';
        const fromSpot = spot(from);
        const toSpot = spot(L.target);
        const a = fromSpot ? gripFor(from, fromSpot) : restGrip;
        const b = toSpot ? gripFor(L.target, toSpot) : restGrip;
        farTarget = mix(a, b, gp);
        // lens aims from the grip toward its spot (rest: handle down, lens up-right)
        const REST_AIM = ((G.restAim ?? 72) * Math.PI) / 180;
        const aimA = fromSpot ? Math.atan2(fromSpot.y - a.y, fromSpot.x - a.x) : REST_AIM;
        const aimB = toSpot ? Math.atan2(toSpot.y - b.y, toSpot.x - b.x) : REST_AIM;
        lensAngle = lerp(aimA, aimB, gp);
        if (mag) magOn = L.target === mag.where ? clamp((L.go - 0.8) / 0.2) : from === mag.where ? clamp(1 - L.go / 0.2) : 0;
      }
      const look = s.look ?? 0;
      const fr = person.rig.frame({x: person.x, y: G.floor, facing: 1, scale: person.s, near: nearTarget, far: farTarget, headTilt: look, lean: 0});
      Object.assign(nodes, fr.nodes);
      handNear = fr.hands.near;
      handFar = fr.hands.far;
      reachedAll = fr.reached;
      if (lens) {
        lensGrip = handFar;
        lensC = {x: handFar.x + Math.cos(lensAngle) * lens.reach, y: handFar.y + Math.sin(lensAngle) * lens.reach};
        nodes[`${P}-lens`] = {transform: T(handFar.x, handFar.y, (lensAngle * 180) / Math.PI)};
        if (mag) {
          // the enlarged copy is pinned to its paper: point q shows at lensC + MAG·(q − lensC)
          const isSum = mag.where === 'summary';
          const oy = isSum ? top : top + pageY[targetPage - 1];
          const ey = isSum ? 1 : Math.max(0.001, pageE[targetPage - 1]);
          nodes[`${P}-mag`] = {opacity: r(magOn, 3)};
          nodes[`${P}-magcirc`] = {cx: r(lensC.x), cy: r(lensC.y)};
          nodes[`${P}-magc`] = {transform: `${T(lensC.x - MAG * (lensC.x - sx0), lensC.y - MAG * (lensC.y - oy))} scale(${MAG} ${r(MAG * ey, 4)})`};
          if (!isSum) {
            const b = pages[targetPage - 1].blocks[target];
            nodes[`${P}-mpg-hl${target}`] = {transform: T(b.hl.x, b.hl.y, 0, Math.max(0.001, ease.outCubic(mark)), 1), opacity: mark > 0 ? 0.9 : 0};
          }
        }
      }
    }
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    const pagesOpen = r(E, 3);
    return {
      nodes,
      semantic: {
        cardTop: P2({x: sx0, y: top}),
        cardGrip: P2(grip),
        handNear: P2(handNear),
        handFar: P2(handFar),
        lensCenter: P2(lensC),
        lensGrip: P2(lensGrip),
        lensOn,
        magnified: mag && magOn >= 1 ? mag.where : null,
        pagesOpen,
        targetPage,
        stackBottom: r(top + hp * (1 + E) + stackT(remaining)),
        seat: r(seat),
        holder: !person ? 'clip' : lift > 0 ? 'researcher' : 'lectern',
        highlight: r(mark, 3),
        link: r(clamp(s.link ?? 0), 3),
        allReached: reachedAll,
      },
    };
  }

  return {
    node, pose, W, H, axis, mode, hp, sw: sw0, sx: sx0, ledge, floor: G.floor, seat,
    card, pages, shelf, screen, link, lensObj: lens, person, headBox, targetPage, target, finalTop, restTop,
    blockWorld, cardBox, cardPart, headerPart, linkFor, cardTopFor, spotAt,
    free: G, libChip, readerChip,
  };
}
