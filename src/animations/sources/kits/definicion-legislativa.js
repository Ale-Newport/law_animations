/**
 * "Definición legislativa" kit (LAW-0125..0128): original vector art, a
 * sources field set and a desk-stage pose solver for a term that is joined to
 * a definition supplied in ANOTHER section of the same (fictional) text.
 *
 * Art (all original geometry):
 *  - articleSheet(): a loose extract of the article that USES the term; its
 *    body is drawn as text lines with the term set inline in a highlight box;
 *    a coloured tab on its edge carries the colour of its hierarchy level;
 *  - definitionsPage(): the page of the definitions section (reference,
 *    heading, entry rows with a highlight per row);
 *  - lawBook(): the full text lying on the desk seen from above; its cover
 *    (with the preceding pages) swings open about the spine, revealing the
 *    definitions page; index flags on the fore-edge are the user-supplied
 *    hierarchy (one flag per level, top to bottom, in the author's order);
 *  - magnifier(): a hand lens whose glass shows a REAL enlarged copy of what
 *    lies under it (the sheet drawn again at the same coordinates);
 *  - usageNote(): a separate note card (another source) that turns over to
 *    show an ordinary use PROPOSED by a named (fictional) source;
 *  - pinPair(): two map pins joined by a cord; the cord is the link.
 *  - definitionDesk(): a top-down desk with two IK arms entering from the
 *    frame edge. The stage owns geometry and a pose solver only; each entry
 *    owns its own timeline, layout and semantics.
 *
 * Attachment rules enforced by the stage (tests read them from semantics):
 *  - while held, the magnifier is positioned from the SOLVED left hand;
 *  - while carried, pin B is positioned from the SOLVED left hand;
 *  - while opening, the right hand rides the cover's (or card's) free edge;
 *  - every IK target is inside arm reach (`allReached`).
 *
 * Legal content: every text is a fictional placeholder; the hierarchy is an
 * author-supplied ordering with neutral default labels and implies no rule of
 * precedence; the scene shows supplied states only (linked / located /
 * proposed) and never says a definition or reading is correct.
 * @module animations/sources/kits/definicion-legislativa
 */
import {h, g} from '../../../core/svg.js';
import {FONTS} from '../../../core/text.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {mix, roundRectPath, dist} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {topArm, deskWindow} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj, int} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Parameters                                                          */
/* ------------------------------------------------------------------ */

/**
 * Category field set for "sources" motifs built on this kit (brief:
 * sources, hierarchy, passages, interpretations). All defaults are
 * fictional placeholders.
 */
export const sourcesFields = {
  sources: list('Fictional source names: [0] is printed on the book (the full text that holds both sections); [1] names the separate note in which an ordinary use is proposed (scenes that show it)', str('Source name (fictional)', 60), 1, 3),
  hierarchy: list('User-supplied ordering of the divisions of the text, drawn top to bottom as index flags on the book. The order is the author\'s; the scene implies no rule of precedence between levels', str('Level label (neutral by default)', 50), 2, 4),
  passages: list('Fictional passages: [0] the article in which the term is USED; [1] the section that SUPPLIES the definition', obj('Passage', {
    ref: str('Reference printed on the page, e.g. "Text 1 · Art. 7 (fictional)"', 60),
    heading: str('Heading of the passage', 50),
    text: str('Simulated wording: for [0] the clause that uses the term; for [1] the definition wording that follows the term', 170),
    term: str('The term as written in this passage', 40),
    level: int('Hierarchy level (1 = first flag) that holds the passage', 1, 4),
  }, ['ref', 'heading', 'text', 'term', 'level']), 2, 2),
  interpretations: list('Readings attributed to fictional sources (shown as attributed proposals, never endorsed)', obj('Attributed reading', {
    source: str('Who proposes the reading (fictional)', 50),
    reading: str('The proposed reading, stated descriptively', 120),
  }, ['source', 'reading']), 0, 2),
};

/** Built-in strings of this kit. */
export const KIT_STRINGS = {
  en: {
    reader: 'Reader', extract: 'Article extract', hierarchy: 'Hierarchy (user-supplied)', level: 'Level',
    linked: 'Definition linked (as supplied)', located: 'Definition located', marked: 'Term marked',
    proposed: 'Ordinary use proposed (attributed)', notLinked: 'Term not linked', noEntry: 'No entry for this term',
    term: 'Term', definition: 'Definition', proposedBy: 'Proposed by', usedIn: 'used in', suppliedIn: 'supplied in',
  },
  es: {
    reader: 'Lectora', extract: 'Extracto del artículo', hierarchy: 'Jerarquía (aportada)', level: 'Nivel',
    linked: 'Definición vinculada (según lo aportado)', located: 'Definición localizada', marked: 'Término marcado',
    proposed: 'Uso ordinario propuesto (atribuido)', notLinked: 'Término sin vincular', noEntry: 'Sin entrada para este término',
    term: 'Término', definition: 'Definición', proposedBy: 'Propuesto por', usedIn: 'se usa en', suppliedIn: 'se aporta en',
  },
};

/** Kit strings for the active locale. */
export const kitStrings = locale => ({...KIT_STRINGS.en, ...(KIT_STRINGS[locale] || {})});

/** 0-based hierarchy index of a passage, clamped to the supplied levels. */
export const levelIndex = (p, passage) => clamp(Math.round(passage.level) - 1, 0, p.hierarchy.length - 1);

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

const INK = '#1f2328';
const WOOD_HANDLE = '#6b3f2a';
const RIM = '#3b4148';
const METAL = '#c9ced4';

/** Colour of a hierarchy level (stripe) and its light tint (flag body). */
export function levelColor(ctx, i) {
  const th = ctx.theme;
  const list4 = [th.accent2, shade(th.accent3, -0.3), th.accent4, '#7a5c8e'];
  const c = list4[i % list4.length];
  return {c, soft: shade(c, 0.74)};
}

/** Colour of the link (cord, pins, marks). */
export const linkColor = ctx => ctx.theme.accent;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const rotP = (p, deg) => {
  const a = (deg * Math.PI) / 180;
  return {x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a)};
};
const unit = (a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  return {x: dx / l, y: dy / l};
};
/** Distance from p along unit direction d until it leaves the rect [0,W]×[0,H]. */
export function exitDistance(p, d, W, H) {
  const ts = [];
  if (d.x > 1e-6) ts.push((W - p.x) / d.x);
  if (d.x < -1e-6) ts.push(-p.x / d.x);
  if (d.y > 1e-6) ts.push((H - p.y) / d.y);
  if (d.y < -1e-6) ts.push(-p.y / d.y);
  return Math.max(0, Math.min(...ts));
}
/** Axis-aligned box overlap with padding. */
export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** Quadratic point. */
const qpt = (a, c, b, t) => ({x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y});

/**
 * fit() that never breaks a word: the size first shrinks (down to minSize)
 * until the longest word fits the width, then wraps.
 */
export function fitWords(ctx, text, o) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const minSize = o.minSize ?? o.size * 0.7;
  let size = o.size;
  const longest = sz => Math.max(0, ...words.map(wd => ctx.measure(wd, sz, o.weight ?? 400, o.family ?? 'sans')));
  while (size > minSize && longest(size) > o.maxWidth) size = Math.max(minSize, size * 0.95);
  return ctx.fit(text, {...o, size, minSize: Math.min(size, minSize)});
}

/** Would this fitted text break a word across lines (a word wider than the box)? */
export const breaksWord = (ctx, f, maxWidth) => !!f && String(f.full || '').split(/\s+/).filter(Boolean).some(wd => ctx.measure(wd, f.size, f.weight, f.family) > maxWidth + 0.5);

/* ------------------------------------------------------------------ */
/* Whole-word masking for lens copies                                  */
/* ------------------------------------------------------------------ */

/** Is the box {x,y,w,h} entirely inside the circle {x,y,r}? */
export const boxInCircle = (b, c, margin = 0) => (c.r === undefined
  ? b.x >= c.x + margin && b.y >= c.y + margin * 0.3 && b.x + b.w <= c.x + c.w - margin && b.y + b.h <= c.y + c.h - margin * 0.3
  : [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].every(([x, y]) => Math.hypot(x - c.x, y - c.y) <= c.r - margin));

/**
 * A fitted text block for a lens COPY: every word that lies entirely inside
 * `mask` (a circle in the same coordinates as `o.x/o.y`) is drawn as text at
 * the position the full block gives it; every other word is drawn as a bar
 * (so a lens never shows a word cut in half). `y` is the top of the block.
 * @param {any} ctx
 * @param {import('../../../core/text.js').FitResult} fit
 * @param {{x:number, y:number, anchor?:'start'|'middle', fill:string, bar:string, italic?:boolean, name?:string, opacity?:number}} o
 * @param {{x:number,y:number,r:number}} mask
 */
export function maskedBlock(ctx, fit, o, mask) {
  const fam = FONTS[fit.family] || FONTS.sans;
  const space = ctx.measure(' ', fit.size, fit.weight, fit.family);
  const out = [];
  const spans = [];
  fit.lines.forEach((line, li) => {
    const words = line.split(' ').filter(Boolean);
    const lw = ctx.measure(line, fit.size, fit.weight, fit.family);
    let x = o.anchor === 'middle' ? o.x - lw / 2 : o.x;
    const base = o.y + fit.size * 0.8 + li * fit.lineHeight;
    words.forEach(wd => {
      const ww = ctx.measure(wd, fit.size, fit.weight, fit.family);
      const box = {x, y: base - fit.size * 0.8, w: ww, h: fit.size};
      if (boxInCircle(box, mask, Math.max(3, fit.size * 0.15))) {
        spans.push(h('tspan', {x: r(x, 2), y: r(base, 2)}, wd));
      } else if (!mask.omit) {
        out.push(h('rect', {x: r(x, 2), y: r(base - fit.size * 0.42, 2), width: r(ww, 2), height: r(fit.size * 0.34, 2), rx: 3, fill: o.bar}));
      }
      x += ww + space;
    });
  });
  // the whole words form ONE text block (as the original's lines do)
  const txt = spans.length ? h('text', {'font-family': fam, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': o.italic ? 'italic' : undefined, fill: o.fill}, spans) : null;
  return g({name: o.name, opacity: o.opacity}, out, txt);
}

/* ------------------------------------------------------------------ */
/* Inline text with a highlighted term                                 */
/* ------------------------------------------------------------------ */

/**
 * Lay out `text` in lines with `term` as one unbreakable, bold token. The
 * term's first case-insensitive occurrence is used; if the text does not
 * contain it the term is appended. Returns lines of segments and the boxes
 * of the term (relative to the block's top-left).
 * @param {any} ctx
 * @param {string} text
 * @param {string} term
 * @param {{maxWidth:number, size:number, maxLines:number, leading?:number}} o
 */
export function inlineTerm(ctx, text, term, o) {
  // o.termBreak: the term always starts a line (so a connector can reach it through the margin only)
  const full = String(text || '').replace(/\s+/g, ' ').trim();
  const t = String(term || '').trim();
  let before = full, after = '';
  let tk = t;
  const at = t ? full.toLowerCase().indexOf(t.toLowerCase()) : -1;
  if (at >= 0) {
    before = full.slice(0, at);
    tk = full.slice(at, at + t.length);
    after = full.slice(at + t.length);
  } else if (t) {
    before = `${full} `;
    after = '';
  }
  const tokens = [];
  before.split(' ').filter(Boolean).forEach(wd => tokens.push({text: wd, bold: false}));
  // punctuation glued to the term stays with it
  let tail = '';
  const m = /^([^\s]*)(.*)$/.exec(after);
  if (m) { tail = m[1]; after = m[2]; }
  if (tk) tokens.push({text: tk, bold: true, tail, brk: !!o.termBreak});
  after.split(' ').filter(Boolean).forEach(wd => tokens.push({text: wd, bold: false}));
  // the term's highlight and mark ring overhang the word: it gets its own clearance on both sides
  const clearOf = size => size * 0.5;
  const fit = size => {
    const wOf = tok => ctx.measure(tok.text, size, tok.bold ? 700 : 400, 'serif') + (tok.tail ? ctx.measure(tok.tail, size, 400, 'serif') : 0) + (tok.bold ? clearOf(size) * 2 : 0);
    const space = ctx.measure(' ', size, 400, 'serif');
    const lines = [];
    let cur = [];
    let w = 0;
    for (const tok of tokens) {
      const tw = wOf(tok);
      if (cur.length && (tok.brk || w + space + tw > o.maxWidth)) { lines.push(cur); cur = []; w = 0; }
      cur.push({...tok, w: tw});
      w += (cur.length > 1 ? space : 0) + tw;
    }
    if (cur.length) lines.push(cur);
    return {lines, space};
  };
  let size = o.size;
  let res = fit(size);
  while (res.lines.length > o.maxLines && size > Math.max(o.size * 0.78, o.minSize ?? 0)) {
    size -= o.size * 0.04;
    res = fit(size);
  }
  const lh = size * (o.leading ?? 1.3);
  let truncated = false;
  let lines = res.lines;
  if (lines.length > o.maxLines) {
    truncated = true;
    // keep the line with the term visible: drop lines after it first, then before it
    const ti = lines.findIndex(l => l.some(x => x.bold));
    let from = 0;
    if (ti >= o.maxLines) from = ti - o.maxLines + 1;
    lines = lines.slice(from, from + o.maxLines);
  }
  const termBoxes = [];
  lines.forEach((l, li) => {
    let x = 0;
    l.forEach((tok, k) => {
      if (k) x += res.space;
      const cl = tok.bold ? clearOf(size) : 0;
      // at the start of a line the term needs no clearance on its left
      const lead = tok.bold && k === 0 ? 0 : cl;
      if (tok.bold) {
        const tw = ctx.measure(tok.text, size, 700, 'serif');
        termBoxes.push({x: x + lead, y: li * lh, w: tw, h: size, line: li});
      }
      tok.x = x + lead;
      if (tok.bold) x -= cl - lead;
      x += tok.w;
    });
  });
  return {lines, size, lh, termBoxes, truncated, full};
}

/** Render inline-term lines as <text> nodes (block top-left at x,y). */
function inlineTermNodes(ctx, lay, o) {
  const th = ctx.theme;
  if (o.mask) {
    // lens copy: whole words inside the mask as text, the rest as bars
    const out = [];
    const spans = [];
    lay.lines.forEach((l, li) => l.forEach(tok => {
      const txt = tok.text + (tok.tail || '');
      const ww = ctx.measure(txt, lay.size, tok.bold ? 700 : 400, 'serif');
      const x = o.x + tok.x, top = o.y + li * lay.lh;
      if (boxInCircle({x, y: top, w: ww, h: lay.size}, o.mask, Math.max(3, lay.size * 0.15))) {
        spans.push(h('tspan', {x: r(x, 2), y: r(top + lay.size * 0.8, 2), 'font-weight': tok.bold ? 700 : 400, fill: tok.bold ? INK : th.inkSoft}, txt));
      } else if (!o.mask.omit) out.push(h('rect', {x: r(x, 2), y: r(top + lay.size * 0.3, 2), width: r(ww, 2), height: r(lay.size * 0.42, 2), rx: 3, fill: tok.bold ? INK : th.paperLine}));
    }));
    if (spans.length) out.push(h('text', {'font-family': FONTS.serif, 'font-size': r(lay.size, 2)}, spans));
    return out;
  }
  return lay.lines.map((l, li) => h('text', {
    x: o.x, y: o.y + li * lay.lh + lay.size * 0.8, 'font-family': "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif", 'font-size': r(lay.size, 2), fill: th.ink,
  },
  l.map(tok => [
    h('tspan', {x: r(o.x + tok.x, 2), 'font-weight': tok.bold ? 700 : 400, fill: tok.bold ? INK : th.inkSoft}, tok.text),
    tok.tail ? h('tspan', {'font-weight': 400, fill: th.inkSoft}, tok.tail) : null,
  ])));
}

/* ------------------------------------------------------------------ */
/* Article sheet                                                       */
/* ------------------------------------------------------------------ */

/**
 * Loose extract of the article that uses the term. Local origin = top-left.
 * The body is a column of text lines; line `termLine` carries the term
 * (a real word in a highlight box). With `bodyText` the body is the clause
 * wording itself with the term inline (used where no lens copies it).
 * Named nodes: `${P}-termhl` (highlight), `${P}-termring` (mark ring),
 * `${P}-termtext` (the term word).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, ref?:string, heading?:string, term:string, levelLabel?:string, levelColor:{c:string,soft:string}, termLine?:number, fs?:number, showText?:boolean, copy?:boolean, bodyText?:string, seedKey?:string}} o
 */
export function articleSheet(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const fs = o.fs ?? 1;
  const allOn = o.showText !== false && ctx.show('all') && !o.copy;
  const keyOn = o.showText !== false && ctx.show('key');
  const pad = w * 0.085;
  const inner = w - pad * 2;
  const fold = w * 0.1;
  const seed = o.seedKey || 'def-sheet';
  const parts = [];
  const lc = o.levelColor;
  // level tab tucked under the right edge (drawn before the sheet)
  const tabY = hh * 0.1, tabH = Math.min(hh * 0.12, 58 * fs), tabW = 30 * fs;
  const tabBox = {x: w - 6, y: tabY, w: tabW + 6, h: tabH};
  parts.push(h('path', {d: roundRectPath(w - 14, tabY, tabW + 14, tabH, 8), fill: lc.c, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: roundRectPath(6, 10, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: `M0 5Q0 0 5 0H${r(w - fold)}L${w} ${r(fold)}V${hh - 5}Q${w} ${hh} ${w - 5} ${hh}H5Q0 ${hh} 0 ${hh - 5}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));

  let y = pad * 0.72;
  // o.kicker (opt-in): the part's own caption as the page's first line (accent colour, bold)
  if (o.kicker && o.showText !== false && ctx.show('all')) {
    const f = fullFit(ctx, o.kicker, {maxWidth: inner - fold * 0.7, size: Math.max(o.floor || 0, 15 * fs), weight: 800});
    if (allOn) parts.push(textBlock(f, {x: pad, y, fill: shade(linkColor(ctx), -0.25), name: `${P}-kicker`}));
    else f.lines.forEach((l, li) => parts.push(h('rect', {x: pad, y: r(y + li * f.lineHeight + f.size * 0.3), width: r(ctx.measure(l, f.size, f.weight, f.family)), height: r(f.size * 0.45), rx: 3, fill: th.paperLine})));
    y += f.height + f.size * 0.5;
  }
  // o.floor (opt-in, design units): no text is set smaller than this (legibility at the frame's scale);
  // a text that cannot fit at that size is drawn as placeholder bars instead of shrinking or an ellipsis
  const FL = o.floor || 0;
  const F = v => Math.max(v, FL);
  const refSize = F(17 * fs);
  // o.fullText (opt-in): the reference and the level label wrap to a second line instead of an ellipsis;
  // an aligned lens copy (o.alignCopy) reserves the same lines as bars
  const wrapAll = !!o.fullText;
  const alignOn = !!(o.alignCopy && o.copy && o.showText !== false && ctx.show('all'));
  const barLines = (f, x, yy, hgt, fill) => f.lines.forEach((l, li) => parts.push(h('rect', {x, y: r(yy + 3 + li * f.lineHeight), width: r(ctx.measure(l, f.size, f.weight, f.family)), height: r(hgt), rx: 3, fill})));
  if (wrapAll && o.ref && (allOn || alignOn)) {
    const f = FL ? fitWords(ctx, o.ref, {maxWidth: inner - fold * 0.7, size: refSize, minSize: refSize, maxLines: 6, weight: 600}) : ctx.fit(o.ref, {maxWidth: inner - fold * 0.7, size: refSize, minSize: 12, maxLines: 2, weight: 600});
    if (allOn) parts.push(textBlock(f, {x: pad, y, fill: th.inkSoft}));
    else barLines(f, pad, y, refSize * 0.55, th.paperLine);
    y += Math.max(refSize * 1.5, f.height + refSize * 0.5);
  } else {
    if (allOn && o.ref) {
      const f = ctx.fit(o.ref, {maxWidth: inner - fold * 0.7, size: refSize, minSize: 12, maxLines: 1, weight: 600});
      parts.push(textBlock(f, {x: pad, y, fill: th.inkSoft}));
    } else parts.push(h('rect', {x: pad, y: y + 3, width: r(inner * 0.55), height: r(refSize * 0.55), rx: 3, fill: th.paperLine}));
    y += refSize * 1.5;
  }
  // level row: a colour chip (and the level label when text is on)
  const lvlSize = F(15 * fs);
  parts.push(h('rect', {x: pad, y: y + 1, width: lvlSize * 1.1, height: lvlSize * 0.9, rx: 3, fill: lc.c}));
  if (wrapAll && o.levelLabel && (allOn || alignOn)) {
    const f = FL ? fitWords(ctx, o.levelLabel, {maxWidth: inner - lvlSize * 1.6, size: lvlSize, minSize: lvlSize, maxLines: 6, weight: 600}) : ctx.fit(o.levelLabel, {maxWidth: inner - lvlSize * 1.6, size: lvlSize, minSize: 11, maxLines: 2, weight: 600});
    if (allOn) parts.push(textBlock(f, {x: pad + lvlSize * 1.6, y, fill: shade(lc.c, -0.35)}));
    else barLines(f, pad + lvlSize * 1.6, y, lvlSize * 0.5, lc.soft);
    y += Math.max(lvlSize * 1.55, f.height + lvlSize * 0.55);
  } else {
    if (allOn && o.levelLabel) {
      const f = ctx.fit(o.levelLabel, {maxWidth: inner - lvlSize * 1.6, size: lvlSize, minSize: 11, maxLines: 1, weight: 600});
      parts.push(textBlock(f, {x: pad + lvlSize * 1.6, y, fill: shade(lc.c, -0.35)}));
    } else parts.push(h('rect', {x: pad + lvlSize * 1.6, y: y + 3, width: r(inner * 0.4), height: r(lvlSize * 0.5), rx: 3, fill: lc.soft}));
    y += lvlSize * 1.55;
  }
  const headSize = F(23 * fs);
  if (allOn && o.heading) {
    const f = FL ? fitWords(ctx, o.heading, {maxWidth: inner, size: headSize, minSize: headSize, maxLines: 6, weight: 700, family: 'serif'}) : ctx.fit(o.heading, {maxWidth: inner, size: headSize, minSize: 15, maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x: pad, y, fill: th.ink}));
    y += f.height + headSize * 0.5;
  } else if (o.alignCopy && o.copy && o.heading && o.showText !== false && ctx.show('all')) {
    // opt-in: a lens copy keeps the ORIGINAL's line positions (its heading may wrap to two lines)
    const f = FL ? fitWords(ctx, o.heading, {maxWidth: inner, size: headSize, minSize: headSize, maxLines: 6, weight: 700, family: 'serif'}) : ctx.fit(o.heading, {maxWidth: inner, size: headSize, minSize: 15, maxLines: 2, weight: 700, family: 'serif'});
    f.lines.forEach((l, li) => parts.push(h('rect', {x: pad, y: r(y + 2 + li * f.lineHeight), width: r(Math.min(inner, ctx.measure(l, f.size, 700, 'serif'))), height: r(headSize * 0.7), rx: 4, fill: th.ink, opacity: 0.75})));
    y += f.height + headSize * 0.5;
  } else {
    parts.push(h('rect', {x: pad, y: y + 2, width: r(inner * 0.62), height: r(headSize * 0.7), rx: 4, fill: th.ink, opacity: 0.75}));
    y += headSize * 1.2;
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 2}));
  y += headSize * 0.7;

  const bodyTop = y;
  let termBox;
  let termBox2 = null;
  let termFits = null;
  let needH = hh;
  const hlParts = [];
  const textParts = [];
  if (o.bodyText) {
    // real clause wording with the inline term
    const size = F(21 * fs);
    // with a floor the whole clause is set (the sheet is sized to it: see needH)
    const lay = inlineTerm(ctx, o.bodyText, o.term, {maxWidth: inner, size, minSize: FL || undefined, termBreak: o.termBreak, maxLines: FL ? 40 : Math.max(2, Math.floor((hh - pad - bodyTop) / (size * 1.3)))});
    needH = bodyTop + lay.lines.length * lay.lh + pad * 0.9;
    const tb = lay.termBoxes[0] || {x: 0, y: 0, w: 40, h: size};
    termBox = {x: pad + tb.x - 6, y: bodyTop + tb.y - 5, w: tb.w + 12, h: tb.h + 10};
    if (keyOn) textParts.push(inlineTermNodes(ctx, lay, {x: pad, y: bodyTop, mask: o.textMask}));
    else lay.lines.forEach((l, li) => l.forEach(tok => textParts.push(h('rect', {x: r(pad + tok.x), y: r(bodyTop + li * lay.lh + lay.size * 0.3), width: r(tok.bold && lay.termBoxes[0] ? lay.termBoxes[0].w : tok.w), height: r(lay.size * 0.42), rx: 3, fill: tok.bold ? th.ink : th.paperLine}))));
    // the rest of the article continues as text lines
    const bar = Math.max(6, 7.5 * fs);
    for (let yy = bodyTop + lay.lines.length * lay.lh + lay.lh * 0.6, i = 0; yy < hh - pad * 0.8; yy += 34 * fs, i++) {
      textParts.push(h('rect', {x: pad, y: r(yy), width: r(inner * (0.8 + ctx.rng(`${seed}-f`, i) * 0.2)), height: bar, rx: bar / 2, fill: th.paperLine}));
    }
  } else {
    const termSize = F(25 * fs);
    const lh = FL ? Math.max(36 * fs, termSize * 1.25) : 36 * fs;
    const bar = Math.max(6, 7.5 * fs);
    const n = Math.max(4, Math.floor((hh - pad * 0.8 - bodyTop) / lh));
    const tl = clamp(o.termLine ?? 2, 1, n - 2);
    // o.termMaxWidth (opt-in): a narrower term column, so a long term wraps (between words) into a compact block
    const termMW = o.termMaxWidth ? Math.min(inner - 14, o.termMaxWidth) : inner - 14;
    const termML = o.termMaxLines ?? 2;
    const fTerm = ctx.fit(o.term || ' ', {maxWidth: termMW, size: termSize, minSize: FL ? Math.max(FL, termSize * 0.8) : termSize * 0.8, maxLines: termML, weight: 700, family: 'serif'});
    // an alternative term (inspect): the line is laid out for the wider of the two
    const fAlt = o.altTerm ? ctx.fit(o.altTerm, {maxWidth: termMW, size: termSize, minSize: FL ? Math.max(FL, termSize * 0.8) : termSize * 0.8, maxLines: termML, weight: 700, family: 'serif'}) : null;
    termFits = {term: fTerm, alt: fAlt};
    const tw = Math.max(fTerm.width, fAlt ? fAlt.width : 0);
    const inline = fTerm.lines.length === 1 && (!fAlt || fAlt.lines.length === 1) && tw <= inner * 0.6;
    const rng = k => ctx.rng(`${seed}-${k}`, 0);
    const tx = inline ? pad + Math.min(inner * (0.1 + rng('tx') * 0.16), inner - tw - 50) : pad + 7;
    const lineC = i => bodyTop + i * lh + bar / 2;
    const nTermLines = Math.max(fTerm.lines.length, fAlt ? fAlt.lines.length : 0);
    const termTop = lineC(tl) - fTerm.size * 0.62;
    termBox = {x: tx - 7, y: termTop - 5, w: fTerm.width + 14, h: fTerm.height + 10};
    if (fAlt) termBox2 = {x: tx - 7, y: termTop - 5, w: fAlt.width + 14, h: fAlt.height + 10};
    for (let i = 0; i < n; i++) {
      const cy = lineC(i) - bar / 2;
      if (i >= tl && i < tl + nTermLines + (nTermLines > 1 ? 0 : 0)) {
        if (i === tl && inline) {
          textParts.push(h('rect', {x: pad, y: cy, width: r(Math.max(0, tx - 12 - pad)), height: bar, rx: bar / 2, fill: th.paperLine}));
          const x2 = tx + tw + 14;
          const end = pad + inner * (0.86 + rng('end') * 0.14);
          if (end - x2 > 20) textParts.push(h('rect', {x: r(x2), y: cy, width: r(end - x2), height: bar, rx: bar / 2, fill: th.paperLine}));
        }
        continue;
      }
      if (nTermLines > 1 && i === tl + 1) continue;
      const last = i === n - 1;
      const lw = inner * (last ? 0.4 + ctx.rng(`${seed}-l`, i) * 0.3 : 0.84 + ctx.rng(`${seed}-l`, i) * 0.16);
      textParts.push(h('rect', {x: pad + (i === 0 ? inner * 0.06 : 0), y: cy, width: r(lw - (i === 0 ? inner * 0.06 : 0)), height: bar, rx: bar / 2, fill: th.paperLine}));
    }
    const termNode = (f, name, op) => (keyOn
      ? textBlock(f, {x: tx, y: termTop, fill: INK, name, opacity: op})
      : g({name, opacity: op}, f.lines.map((l, li) => h('rect', {x: r(tx), y: r(termTop + li * f.lineHeight + f.size * 0.22), width: r(Math.min(f.width, ctx.measure(l, f.size, 700, 'serif'))), height: r(f.size * 0.56), rx: 4, fill: INK}))));
    if (keyOn && !o.copy) {
      // the sheet's own term word is clipped to the part the lens glass does not cover
      textParts.push(h('defs', null, h('clipPath', {id: ctx.id(`${P}-tclip`)}, h('rect', {name: `${P}-tclipr`, x: r(tx - 10), y: r(termTop - 10), width: r(tw + 20), height: r(fTerm.height + 20)}))));
      textParts.push(g({'clip-path': ctx.ref(`${P}-tclip`)}, termNode(fTerm, `${P}-termtext`), fAlt ? termNode(fAlt, `${P}-termtext2`, 0) : null));
    } else {
      textParts.push(termNode(fTerm, `${P}-termtext`));
      if (fAlt) textParts.push(termNode(fAlt, `${P}-termtext2`, 0));
    }
  }
  hlParts.push(h('path', {name: `${P}-termhl`, d: roundRectPath(termBox.x, termBox.y, termBox.w, termBox.h, 6), fill: th.highlight, opacity: 0.55}));
  if (termBox2) hlParts.push(h('path', {name: `${P}-termhl2`, d: roundRectPath(termBox2.x, termBox2.y, termBox2.w, termBox2.h, 6), fill: th.highlight, opacity: 0}));
  const ring = h('path', {name: `${P}-termring`, d: roundRectPath(termBox.x - 4, termBox.y - 4, termBox.w + 8, termBox.h + 8, 9), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0});
  const ring2 = termBox2 ? h('path', {name: `${P}-termring2`, d: roundRectPath(termBox2.x - 4, termBox2.y - 4, termBox2.w + 8, termBox2.h + 8, 9), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}) : null;
  const node = g({name: P}, parts, hlParts, textParts, ring, ring2);
  const pinPt = {x: termBox.x + termBox.w + 15, y: termBox.y + termBox.h / 2};
  const pinPt2 = termBox2 ? {x: termBox2.x + termBox2.w + 15, y: termBox2.y + termBox2.h / 2} : pinPt;
  const clipOn = !o.bodyText && keyOn && !o.copy;
  return {node, w, h: hh, termBox, termBox2: termBox2 || termBox, pinPt, pinPt2, tabBox, bodyTop, clipOn, termFits, needH};
}

/** Frame record for the term marks of a sheet (highlight strength, ring). */
export function sheetMarks(prefix, mark, opts = {}) {
  const m = clamp(mark);
  const pulse = m > 0 && m < 1 ? Math.sin(m * Math.PI) * 0.35 : 0;
  const out = {
    [`${prefix}-termhl`]: {opacity: r(0.55 + 0.45 * m, 3)},
    [`${prefix}-termring`]: {opacity: r(clamp(m * 1.6), 3), 'stroke-width': r(4 + pulse * 6, 2)},
  };
  if (opts.textOpacity !== undefined) out[`${prefix}-termtext`] = {opacity: r(opts.textOpacity, 3)};
  return out;
}

/* ------------------------------------------------------------------ */
/* Definitions page                                                    */
/* ------------------------------------------------------------------ */

/**
 * The page of the definitions section. Local origin = top-left.
 * rows: one object per entry row; `term`/`text` null = drawn as bars (no
 * invented content). Named: `${P}-hl${i}`, `${P}-ring${i}` per row.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, ref?:string, heading?:string, rows:Array<{term?:string|null, text?:string|null}>, fs?:number, showText?:boolean, seedKey?:string, levelColor?:{c:string,soft:string}, levelLabel?:string}} o
 */
export function definitionsPage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const fs = o.fs ?? 1;
  const allOn = o.showText !== false && ctx.show('all');
  const keyOn = o.showText !== false && ctx.show('key');
  const pad = w * 0.09;
  const inner = w - pad * 2;
  const seed = o.seedKey || 'def-page';
  const parts = [];
  parts.push(h('rect', {x: 0, y: 0, width: w, height: hh, fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}));
  let y = pad * 0.6;
  // o.floor (opt-in, design units): minimum text size; what cannot fit at it is drawn as bars
  const FL = o.floor || 0;
  const F = v => Math.max(v, FL);
  // o.barsHeader (opt-in, lens copies): the header keeps the original's layout but is drawn as bars
  const hdr = (f, oo) => (o.barsHeader
    ? g(null, f.lines.map((l, li) => h('rect', {x: r(oo.x, 2), y: r(oo.y + li * f.lineHeight + f.size * 0.25, 2), width: r(ctx.measure(l, f.size, f.weight, f.family), 2), height: r(f.size * 0.5, 2), rx: 3, fill: th.paperLine})))
    : textBlock(f, oo));
  const refSize = F(15.5 * fs);
  // o.fullText (opt-in): reference, level label and entry wording wrap instead of an ellipsis
  const wrapAll = !!o.fullText;
  // with a text floor on a short page, the reference and level label (shown on the parts around it)
  // become one-line placeholders so the entry keeps its room
  const hdrEst = () => {
    const fr = o.ref ? ctx.fit(o.ref, {maxWidth: inner, size: refSize, minSize: refSize, maxLines: 2, weight: 600}) : null;
    const fl = o.levelLabel ? ctx.fit(o.levelLabel, {maxWidth: inner - F(13 * fs) * 1.6, size: F(13 * fs), minSize: F(13 * fs), maxLines: 2, weight: 600}) : null;
    const fh = o.heading ? ctx.fit(o.heading, {maxWidth: inner, size: F(21 * fs), minSize: F(21 * fs), maxLines: 2, weight: 700, family: 'serif'}) : null;
    return pad * 0.6 + (fr ? fr.height + refSize * 0.45 : refSize * 1.45) + (fl ? fl.height + F(13 * fs) * 0.9 : F(13 * fs) * 1.9) + (fh ? fh.height : 0) + F(21 * fs) * 1.8;
  };
  const compact = !!(FL && allOn && hdrEst() > hh * 0.5);
  // very short page: the heading too becomes a placeholder
  const compact2 = !!(compact && hdrEst() - refSize * 1.2 - F(13 * fs) * 1.2 > hh * 0.55);
  if (allOn && o.ref && !compact) {
    const f = ctx.fit(o.ref, {maxWidth: inner, size: refSize, minSize: FL ? refSize : 11, maxLines: wrapAll ? 2 : 1, weight: 600});
    if (FL && (f.truncated || breaksWord(ctx, f, inner))) parts.push(h('rect', {x: pad, y: y + 3, width: r(inner * 0.55), height: r(refSize * 0.5), rx: 3, fill: th.paperLine}));
    else parts.push(hdr(f, {x: pad, y, fill: th.inkSoft}));
    if (wrapAll) y += f.height - f.size;
  } else parts.push(h('rect', {x: pad, y: y + 3, width: r(inner * 0.55), height: r(refSize * 0.5), rx: 3, fill: th.paperLine}));
  y += refSize * 1.45;
  if (o.levelColor) {
    const lvl = F(13 * fs);
    parts.push(h('rect', {x: pad, y: y + 1, width: lvl * 1.1, height: lvl * 0.9, rx: 3, fill: o.levelColor.c}));
    if (allOn && o.levelLabel && !compact) {
      const f = ctx.fit(o.levelLabel, {maxWidth: inner - lvl * 1.6, size: lvl, minSize: FL ? lvl : 10, maxLines: wrapAll ? 2 : 1, weight: 600});
      if (FL && (f.truncated || breaksWord(ctx, f, inner - lvl * 1.6))) parts.push(h('rect', {x: pad + lvl * 1.6, y: y + 3, width: r(inner * 0.36), height: r(lvl * 0.5), rx: 3, fill: o.levelColor.soft}));
      else parts.push(hdr(f, {x: pad + lvl * 1.6, y, fill: shade(o.levelColor.c, -0.35)}));
      if (wrapAll) y += f.height - f.size;
    } else parts.push(h('rect', {x: pad + lvl * 1.6, y: y + 3, width: r(inner * 0.36), height: r(lvl * 0.5), rx: 3, fill: o.levelColor.soft}));
    y += lvl * 1.9;
  }
  const headSize = F(21 * fs);
  if (allOn && o.heading && !compact2) {
    const f = ctx.fit(o.heading, {maxWidth: inner, size: headSize, minSize: FL ? headSize : 14, maxLines: 2, weight: 700, family: 'serif'});
    if (FL && f.truncated) f.lines.forEach((l, li) => parts.push(h('rect', {x: pad, y: r(y + 2 + li * f.lineHeight), width: r(Math.min(inner, ctx.measure(l, f.size, 700, 'serif'))), height: r(headSize * 0.7), rx: 4, fill: th.ink, opacity: 0.75})));
    else parts.push(hdr(f, {x: pad, y, fill: th.ink}));
    y += f.height - f.size;
  } else parts.push(h('rect', {x: pad, y: y + 2, width: r(inner * 0.5), height: r(headSize * 0.7), rx: 4, fill: th.ink, opacity: 0.75}));
  y += headSize * 1.35;
  parts.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 1.6}));
  y += headSize * 0.45;
  const nRows = o.rows.length;
  const rowH0 = (hh - pad * 0.6 - y) / nRows;
  // with o.fullText the rows that carry wording get a larger share of the page
  const wOf = row => (wrapAll ? (row.text ? 2.2 : 0.6) : 1);
  const wSum = o.rows.reduce((a, row) => a + wOf(row), 0);
  const rowTops = [];
  o.rows.reduce((acc, row) => { rowTops.push(acc); return acc + (wrapAll ? (hh - pad * 0.6 - y) * wOf(row) / wSum : rowH0); }, y);
  const rowHOf = i => (wrapAll ? (hh - pad * 0.6 - y) * wOf(o.rows[i]) / wSum : rowH0);
  const rowBoxes = [];
  const termBoxes = [];
  const hl = [];
  const txt = [];
  const bar = Math.max(4.5, 6 * fs);
  // o.textMask (opt-in, lens copies): whole words inside the circle as text, the rest as bars
  const M = o.textMask;
  o.rows.forEach((row, i) => {
    const ry = rowTops[i];
    const rowH = rowHOf(i);
    const box = {x: pad - 8, y: ry - 4, w: inner + 16, h: rowH - 8};
    rowBoxes.push(box);
    hl.push(h('path', {name: `${P}-hl${i}`, d: roundRectPath(box.x, box.y, box.w, box.h, 6), fill: th.highlight, opacity: 0}));
    hl.push(h('path', {name: `${P}-ring${i}`, d: roundRectPath(box.x - 3, box.y - 3, box.w + 6, box.h + 6, 8), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 3.5, opacity: 0}));
    const termSize = F(19 * fs);
    let ty = ry + 2;
    if (row.term && keyOn) {
      // o.termMaxWidth (opt-in): a long entry term wraps (between words) into a compact block
      const f = o.termMaxWidth
        ? fitWords(ctx, `“${row.term}”`, {maxWidth: Math.min(inner, o.termMaxWidth), size: termSize, minSize: FL || 13, maxLines: FL ? 3 : 2, weight: 700, family: 'serif'})
        : ctx.fit(`“${row.term}”`, {maxWidth: inner, size: termSize, minSize: FL || 13, maxLines: FL ? 3 : 2, weight: 700, family: 'serif'});
      if (FL && (f.truncated || f.height > rowH - 8 || breaksWord(ctx, f, inner))) {
        // cannot be set at the minimum size inside its row: a placeholder bar keeps the row's shape
        txt.push(h('rect', {x: pad, y: ty + termSize * 0.2, width: r(Math.min(inner, f.width)), height: r(termSize * 0.6), rx: 4, fill: INK, opacity: 0.9}));
        termBoxes.push({x: pad, y: ty + termSize * 0.2, w: Math.min(inner, f.width), h: termSize * 0.6});
        ty += termSize * 1.3;
      } else {
        txt.push(M ? maskedBlock(ctx, f, {x: pad, y: ty, fill: INK, bar: INK}, M) : textBlock(f, {x: pad, y: ty, fill: INK}));
        termBoxes.push({x: pad, y: ty, w: f.width, h: f.height});
        ty += f.height + termSize * 0.35;
      }
    } else {
      const bw = inner * (0.28 + ctx.rng(`${seed}-t`, i) * 0.14);
      txt.push(h('rect', {x: pad, y: ty + termSize * 0.2, width: r(bw), height: r(termSize * 0.6), rx: 4, fill: INK, opacity: row.term ? 0.9 : 0.55}));
      termBoxes.push({x: pad, y: ty + termSize * 0.2, w: bw, h: termSize * 0.6});
      ty += termSize * 1.3;
    }
    const avail = ry + rowH - 12 - ty;
    const tsz = F(15.5 * fs);
    if (row.text && allOn && avail > tsz) {
      const fitAt = sz => ctx.fit(row.text, {maxWidth: inner, size: sz, minSize: wrapAll ? sz : (FL || 11), maxLines: Math.max(1, Math.floor((avail + sz * 0.18) / (sz * 1.18))), weight: 400, family: 'serif'});
      let f = fitAt(tsz);
      // full text: a smaller size (more lines in the same room) rather than an ellipsis
      if (wrapAll) for (let sz = tsz - 0.5; f.truncated && sz >= (FL || 9.5); sz -= 0.5) f = fitAt(sz);
      if (FL && f.truncated) {
        // cannot be read at the minimum size here: placeholder lines (the wording is shown elsewhere)
        for (let b = 0; b < Math.max(1, Math.min(4, Math.floor(avail / (bar * 2.6)))); b++) txt.push(h('rect', {x: pad, y: r(ty + b * bar * 2.6 + bar * 0.4), width: r(inner * (b ? 0.6 : 0.92)), height: bar, rx: bar / 2, fill: th.paperLine}));
      } else txt.push(M ? maskedBlock(ctx, f, {x: pad, y: ty, fill: th.inkSoft, bar: th.paperLine}, M) : textBlock(f, {x: pad, y: ty, fill: th.inkSoft}));
    } else {
      // (with a text floor a short row may hold no line at all: never draw past the row)
      const nb = FL ? Math.max(0, Math.min(3, Math.floor((avail + bar) / (bar * 2.6)))) : Math.max(1, Math.min(3, Math.floor(avail / (bar * 2.6))));
      for (let b = 0; b < nb; b++) {
        const lw = inner * (b === nb - 1 ? 0.45 + ctx.rng(`${seed}-b`, i * 5 + b) * 0.3 : 0.86 + ctx.rng(`${seed}-b`, i * 5 + b) * 0.14);
        txt.push(h('rect', {x: pad, y: r(ty + b * bar * 2.6 + bar * 0.4), width: r(lw), height: bar, rx: bar / 2, fill: th.paperLine}));
      }
    }
  });
  const node = g({name: P}, parts, hl, txt);
  return {node, w, h: hh, rowBoxes, termBoxes, pinPt: i => ({x: rowBoxes[i].x - 16, y: rowBoxes[i].y + 16 * fs})};
}

/** Frame record for a definitions page: highlight strength per row. */
export function pageMarks(prefix, rows, hlOf) {
  const out = {};
  for (let i = 0; i < rows; i++) {
    const v = clamp(hlOf(i));
    out[`${prefix}-hl${i}`] = {opacity: r(0.85 * v, 3)};
    out[`${prefix}-ring${i}`] = {opacity: r(clamp(v * 1.4), 3)};
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Book (top-down)                                                     */
/* ------------------------------------------------------------------ */

/**
 * The full text lying on the desk. Local origin = middle of the spine (the
 * hinge). The right page spans x ∈ [0, pw]; the cover (with the preceding
 * pages) swings about the hinge: scaleX = cos φ, φ = open·π, its inside face
 * becomes the left page x ∈ [-pw, 0]. Index flags (one per hierarchy level)
 * stick out of the fore-edge at x = pw.
 * @param {any} ctx
 * @param {{prefix:string, pw:number, ph:number, title?:string, ref?:string, heading?:string, rows:Array<{term?:string|null,text?:string|null}>, levels:string[], defLevel:number, levelLabel?:string, fs?:number, flagW:number, coverColor?:string, seedKey?:string}} o
 */
export function lawBook(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {pw, ph} = o;
  const fs = o.fs ?? 1;
  const top = -ph / 2;
  // o.mute (opt-in): the book is a prop only — its supplied texts are shown elsewhere, readable
  const allOn = !o.mute && ctx.show('all');
  const keyOn = !o.mute && ctx.show('key');
  const n = o.levels.length;
  const coverCol = o.coverColor || shade(th.accent4, -0.35);

  // flags (user-supplied hierarchy): under the pages, sticking out of the fore-edge
  const fy0 = top + ph * 0.06, fy1 = -top - ph * 0.05;
  const slot = (fy1 - fy0) / n;
  const fh = Math.min(slot - 10, 74 * fs);
  const FLb = o.floor || 0;
  const flagSize = Math.max(FLb, 19 * Math.min(fs, 1.3) * (o.flagFs ?? 1));
  const flags = o.levels.map((label, i) => {
    const y = fy0 + slot * i + (slot - fh) / 2;
    const lc = levelColor(ctx, i);
    const x0 = pw - 18, x1 = pw + o.flagW;
    const f0 = keyOn && label ? fitWords(ctx, label, {maxWidth: o.flagW - 30, size: flagSize, minSize: FLb || 12, maxLines: Math.max(1, Math.min(3, Math.floor((fh - 6) / ((FLb || flagSize * 0.86) * 1.18)))), weight: 700}) : null;
    // with a text floor, a label that cannot be read in its flag is left as the flag's colour bar
    const f = f0 && FLb && (f0.truncated || f0.size < FLb - 0.01 || breaksWord(ctx, f0, o.flagW - 30)) ? null : f0;
    const node = g({name: `${P}-flag${i}`},
      h('path', {d: roundRectPath(x0 + 5, y + 6, x1 - x0, fh, 10), fill: th.shadow}),
      h('path', {d: `M${r(x0)} ${r(y)}H${r(x1 - 12)}Q${r(x1)} ${r(y)} ${r(x1)} ${r(y + 12)}V${r(y + fh - 12)}Q${r(x1)} ${r(y + fh)} ${r(x1 - 12)} ${r(y + fh)}H${r(x0)}Z`, fill: lc.soft, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: pw + 2, y, width: 10, height: fh, fill: lc.c}),
      h('path', {name: `${P}-flag${i}-ring`, d: roundRectPath(pw - 2, y - 5, o.flagW + 7, fh + 10, 12), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}),
      f ? textBlock(f, {x: pw + 20, y: y + (fh - f.height) / 2, fill: INK}) : h('rect', {x: pw + 20, y: y + fh / 2 - 5, width: r((o.flagW - 40) * 0.7), height: 10, rx: 4, fill: shade(lc.c, -0.2), opacity: 0.7}),
    );
    return {node, box: {x: pw - 4, y, w: o.flagW + 4, h: fh}, cy: y + fh / 2, color: lc};
  });

  // page block (thickness) under the right page
  const block = g(null,
    h('rect', {x: 6, y: top + 8, width: pw + 4, height: ph + 4, rx: 4, fill: th.shadow}),
    h('rect', {x: 2, y: top + 5, width: pw + 3, height: ph + 1, rx: 3, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.4}),
    h('rect', {x: 1, y: top + 2.5, width: pw + 1.5, height: ph, rx: 3, fill: th.paper, stroke: th.ink, 'stroke-width': 1.2}),
  );
  const page = definitionsPage(ctx, {prefix: `${P}-page`, w: pw, h: ph, ref: o.ref, heading: o.heading, rows: o.rows, fs, seedKey: `${o.seedKey || 'def'}-page`, levelColor: levelColor(ctx, o.defLevel), levelLabel: o.levelLabel, fullText: o.fullText, floor: o.floor, showText: o.mute ? false : undefined});
  const gutter = h('rect', {x: 0, y: top, width: pw * 0.07, height: ph, fill: '#000', opacity: 0.07});
  const pageShadow = h('rect', {name: `${P}-pshadow`, x: 0, y: top, width: pw, height: ph, fill: '#000', opacity: 0});

  // cover outside
  const titleFit0 = allOn && o.title ? fitWords(ctx, o.title, {maxWidth: pw * 0.56, size: Math.max(FLb, 25 * fs), minSize: FLb || 12, maxLines: 3, weight: 700, family: 'serif'}) : null;
  const titleFit = titleFit0 && FLb && (titleFit0.truncated || titleFit0.size < FLb - 0.01 || breaksWord(ctx, titleFit0, pw * 0.56) || titleFit0.height > ph * 0.22 - 8) ? null : titleFit0;
  const plate = {x: pw * 0.2, y: top + ph * 0.18, w: pw * 0.64, h: ph * 0.22};
  const out = g({name: `${P}-cover-out`},
    h('path', {d: `M0 ${r(top)}H${r(pw - 7)}Q${r(pw)} ${r(top)} ${r(pw)} ${r(top + 7)}V${r(-top - 7)}Q${r(pw)} ${r(-top)} ${r(pw - 7)} ${r(-top)}H0Z`, fill: coverCol, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('rect', {x: 0, y: top, width: 20, height: ph, fill: shade(coverCol, -0.3)}),
    h('rect', {x: 20, y: top, width: 5, height: ph, fill: '#fff', opacity: 0.12}),
    h('rect', {x: pw * 0.13, y: top + ph * 0.05, width: pw * 0.8, height: ph * 0.9, rx: 4, fill: 'none', stroke: '#d8b75a', 'stroke-width': 2, opacity: 0.85}),
    // o.plateFade (opt-in): the title plate is a named group that fades as the cover starts to lift
    (plateNodes => (o.plateFade ? g({name: `${P}-plate`}, plateNodes) : plateNodes))([
      h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 4), fill: '#f3ead3', stroke: shade(coverCol, -0.35), 'stroke-width': 1.6}),
      titleFit ? textBlock(titleFit, {x: plate.x + plate.w / 2, y: plate.y + (plate.h - titleFit.height) / 2, anchor: 'middle', fill: INK}) : h('rect', {x: plate.x + plate.w * 0.16, y: plate.y + plate.h * 0.4, width: plate.w * 0.68, height: plate.h * 0.2, rx: 3, fill: INK, opacity: 0.6}),
    ]),
    // an abstract ornament (no real emblem)
    h('circle', {cx: pw * 0.53, cy: -top - ph * 0.26, r: pw * 0.075, fill: 'none', stroke: '#d8b75a', 'stroke-width': 2.2}),
    h('path', {d: `M${r(pw * 0.36)} ${r(-top - ph * 0.26)}H${r(pw * 0.45)}M${r(pw * 0.61)} ${r(-top - ph * 0.26)}H${r(pw * 0.7)}`, stroke: '#d8b75a', 'stroke-width': 2.2}),
  );
  // cover inside = left page (content drawn in left-page coords, pre-mirrored)
  const leftBars = [];
  const lpad = pw * 0.09;
  const bar = Math.max(4.5, 6 * fs);
  for (let i = 0; i < 12; i++) {
    const yy = top + ph * 0.14 + i * ph * 0.064;
    if (i === 4 || i === 9) continue;
    const lw = (pw - lpad * 2) * (i === 3 || i === 8 || i === 11 ? 0.45 : 0.9 + ctx.rng(`${P}-lb`, i) * 0.1);
    leftBars.push(h('rect', {x: r(-pw + lpad), y: r(yy), width: r(lw), height: bar, rx: bar / 2, fill: th.paperLine}));
  }
  const inside = g({name: `${P}-cover-in`, opacity: 0},
    g({transform: 'scale(-1 1)'},
      h('rect', {x: -pw - 7, y: top + 5, width: pw + 4, height: ph + 1, rx: 3, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.4}),
      h('rect', {x: -pw - 3.5, y: top + 2.5, width: pw + 2, height: ph, rx: 3, fill: th.paper, stroke: th.ink, 'stroke-width': 1.2}),
      h('rect', {x: -pw, y: top, width: pw, height: ph, fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}),
      h('rect', {x: -pw * 0.07, y: top, width: pw * 0.07, height: ph, fill: '#000', opacity: 0.07}),
      h('rect', {x: r(-pw + lpad), y: r(top + ph * 0.06), width: r(pw * 0.38), height: bar * 1.2, rx: 3, fill: th.ink, opacity: 0.45}),
      leftBars),
  );
  const cover = g({name: `${P}-cover`}, inside, out);
  // the page under a fully closed cover is not drawn (its text would sit under the cover's title)
  const node = g({name: P}, flags.map(f => f.node), block, g({name: `${P}-pagewrap`, transform: T(0, top), opacity: 0}, page.node), gutter, pageShadow, cover);

  /**
   * @param {{open:number, flagHl?:number, flagIndex?:number, rowHl?:(i:number)=>number}} s
   */
  function frame(s) {
    const phi = clamp(s.open) * Math.PI;
    let c = Math.cos(phi);
    if (Math.abs(c) < 0.02) c = c < 0 ? -0.02 : 0.02;
    const lift = 0.035 * Math.sin(phi);
    const nodes = {
      [`${P}-cover`]: {transform: `scale(${r(c, 4)} ${r(1 + lift, 4)})`},
      [`${P}-cover-out`]: {opacity: c > 0 ? 1 : 0},
      [`${P}-cover-in`]: {opacity: c > 0 ? 0 : 1},
      [`${P}-pshadow`]: {opacity: r(0.2 * Math.sin(phi) * (c > 0 ? 1 : 0.6), 3)},
      [`${P}-pagewrap`]: {opacity: s.open > 0.004 ? 1 : 0},
    };
    if (o.plateFade) {
      // the plate is gone before any page text shows; the page text fades in once the cover
      // has passed the vertical and no longer covers any of the page (no squashed plate or cut page words side by side)
      nodes[`${P}-plate`] = {opacity: r(1 - clamp(s.open / 0.1), 3)};
      nodes[`${P}-pagewrap`] = {opacity: r(clamp((s.open - 0.5) / 0.15), 3)};
    }
    flags.forEach((f, i) => {
      const on = s.flagIndex === i ? clamp(s.flagHl ?? 0) : 0;
      nodes[`${P}-flag${i}`] = {transform: T(on * 8, 0)};
      nodes[`${P}-flag${i}-ring`] = {opacity: r(on, 3)};
    });
    Object.assign(nodes, pageMarks(`${P}-page`, o.rows.length, s.rowHl || (() => 0)));
    return nodes;
  }
  /** Local point on the cover's free edge at height y for open progress. */
  const edgeAt = (open, y) => {
    const phi = clamp(open) * Math.PI;
    return {x: pw * Math.cos(phi), y: y * (1 + 0.035 * Math.sin(phi))};
  };
  const rowBoxes = page.rowBoxes.map(b => ({x: b.x, y: b.y + top, w: b.w, h: b.h}));
  return {node, frame, edgeAt, flags, rowBoxes, pw, ph, top, pinPt: i => ({x: page.pinPt(i).x, y: page.pinPt(i).y + top}),
    box: {x: -pw, y: top, w: pw * 2 + o.flagW, h: ph}};
}

/* ------------------------------------------------------------------ */
/* Magnifier                                                           */
/* ------------------------------------------------------------------ */

/**
 * Hand lens. The glass shows `content` (drawn in the SAME world coordinates
 * as the scene) enlarged about the lens centre: a real magnified copy.
 * Handle points along `angle` (degrees) from the centre.
 * @param {any} ctx
 * @param {{prefix:string, R:number, handleLen?:number, content:any, bg:string, bgBox:{x:number,y:number,w:number,h:number}}} o
 */
export function magnifier(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const R = o.R;
  const len = o.handleLen ?? R * 1.3;
  const neck = R * 0.34;
  const hw = R * 0.2;
  const clipId = `${P}-clip`;
  const handle = g({name: `${P}-handle`},
    h('path', {d: roundRectPath(R + 8, -hw + 10, neck + len, hw * 2, hw), fill: th.shadow}),
    h('rect', {x: R - 2, y: -hw * 0.62, width: neck + 6, height: hw * 1.24, rx: 3, fill: METAL, stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(R + neck, -hw, len, hw * 2, hw), fill: WOOD_HANDLE, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(R + neck + len * 0.2)} ${r(-hw)}V${r(hw)}M${r(R + neck + len * 0.28)} ${r(-hw)}V${r(hw)}`, stroke: shade(WOOD_HANDLE, -0.35), 'stroke-width': 2}),
    h('rect', {x: R + neck + 6, y: -hw * 0.6, width: len - 16, height: hw * 0.36, rx: 3, fill: '#fff', opacity: 0.18}),
  );
  const node = g({name: P},
    h('circle', {name: `${P}-shadow`, r: R + 10, fill: th.shadow}),
    handle,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${P}-clipc`, r: R}))),
    g({'clip-path': ctx.ref(clipId)},
      h('rect', {name: `${P}-bg`, x: o.bgBox.x, y: o.bgBox.y, width: o.bgBox.w, height: o.bgBox.h, fill: o.bg}),
      g({name: `${P}-content`}, o.content)),
    h('circle', {name: `${P}-glass`, r: R, fill: '#cfe6ff', opacity: 0.14}),
    h('path', {name: `${P}-glint`, d: `M${r(-R * 0.62)} ${r(-R * 0.3)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(-R * 0.2)} ${r(-R * 0.66)}`, fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.6}),
    h('circle', {name: `${P}-rim`, r: R + 5, fill: 'none', stroke: RIM, 'stroke-width': 12}),
    h('circle', {name: `${P}-rim2`, r: R + 5, fill: 'none', stroke: METAL, 'stroke-width': 4.5}),
  );
  /** Grip point on the handle for a lens centre and handle angle. */
  const gripAt = (c, angle) => {
    const a = (angle * Math.PI) / 180;
    const d = R + neck + len * 0.55;
    return {x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d};
  };
  /** @param {{x:number,y:number,angle:number,zoom:number,lift?:number}} s */
  function frame(s) {
    const lift = s.lift ?? 0;
    const cx = r(s.x), cy = r(s.y);
    return {
      [`${P}-shadow`]: {cx: r(s.x + 6 + lift * 10), cy: r(s.y + 10 + lift * 14)},
      [`${P}-handle`]: {transform: T(s.x, s.y, s.angle)},
      [`${P}-clipc`]: {cx, cy},
      [`${P}-content`]: {transform: `translate(${cx} ${cy}) scale(${r(s.zoom, 4)}) translate(${r(-s.x)} ${r(-s.y)})`},
      [`${P}-glass`]: {cx, cy},
      [`${P}-glint`]: {transform: T(s.x, s.y)},
      [`${P}-rim`]: {cx, cy},
      [`${P}-rim2`]: {cx, cy},
    };
  }
  return {node, frame, gripAt, R, reach: R + neck + len};
}

/* ------------------------------------------------------------------ */
/* Usage note (another source; an ordinary use proposed)               */
/* ------------------------------------------------------------------ */

/**
 * A note card lying face down; it turns over about its vertical centre line
 * (scaleX = cos φ) to show a proposed ordinary use attributed to a named
 * fictional source. Local origin = centre. Named: `${P}-flip`, `${P}-back`,
 * `${P}-front`, `${P}-hl`.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, title?:string, reading?:string, source?:string, fs?:number, proposedBy?:string}} o
 */
export function usageNote(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const fs = o.fs ?? 1;
  const x0 = -w / 2, y0 = -hh / 2;
  const cardCol = '#f1e3c4';
  // o.mute (opt-in): the note is a prop only — its supplied texts are shown elsewhere, readable
  const allOnN = !o.mute && ctx.show('all');
  const keyOnN = !o.mute && ctx.show('key');
  const backCol = shade(th.accent2, 0.35);
  // back face: patterned card
  const stripes = [];
  for (let i = -6; i < 14; i++) stripes.push(h('path', {d: `M${r(x0 + i * 28)} ${r(y0)}l${r(hh)} ${r(hh)}`, stroke: '#fff', 'stroke-width': 5, opacity: 0.22}));
  const clipId = `${P}-bclip`;
  const back = g({name: `${P}-back`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(x0, y0, w, hh, 10)}))),
    h('path', {d: roundRectPath(x0, y0, w, hh, 10), fill: backCol, stroke: th.ink, 'stroke-width': 2.2}),
    g({'clip-path': ctx.ref(clipId)}, stripes),
    h('circle', {cx: 0, cy: 0, r: hh * 0.2, fill: '#fff', opacity: 0.8, stroke: th.ink, 'stroke-width': 1.6}),
    h('path', {d: `M${r(-hh * 0.1)} ${r(-hh * 0.06)}h${r(hh * 0.2)}M${r(-hh * 0.1)} ${r(hh * 0.02)}h${r(hh * 0.2)}M${r(-hh * 0.1)} ${r(hh * 0.1)}h${r(hh * 0.12)}`, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
  );
  // front face (pre-mirrored: it is seen after a half turn)
  const pad = w * 0.08;
  const inner = w - pad * 2;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(x0, y0, w, hh, 10), fill: cardCol, stroke: th.ink, 'stroke-width': 2.2}));
  parts.push(h('path', {name: `${P}-hl`, d: roundRectPath(x0 + 6, y0 + 6, w - 12, hh - 12, 8), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}));
  let y = y0 + pad * 0.7;
  // o.sizes (opt-in): explicit title / reading / attribution sizes (paired desks keep the proposal legible)
  const SZ = o.sizes || {};
  const FLn = o.floor || 0;
  const tSize = Math.max(FLn, SZ.title ?? 15.5 * fs);
  let titleExtra = 0;
  if (allOnN && o.title) {
    const f = ctx.fit(o.title, {maxWidth: inner, size: tSize, minSize: FLn || 11, maxLines: FLn ? 3 : 1, weight: 700});
    parts.push(textBlock(f, {x: x0 + pad, y, fill: shade(th.accent2, -0.3)}));
    // with a text floor the title may take two lines: the rest of the card moves down
    if (FLn) titleExtra = f.height - f.size;
  } else parts.push(h('rect', {x: x0 + pad, y: y + 2, width: inner * 0.5, height: tSize * 0.6, rx: 3, fill: shade(th.accent2, -0.1), opacity: 0.7}));
  y += tSize * 1.45 + titleExtra;
  parts.push(h('line', {x1: x0 + pad, x2: x0 + w - pad, y1: y, y2: y, stroke: shade(cardCol, -0.25), 'stroke-width': 1.6}));
  y += tSize * 0.45;
  const attrSize = Math.max(FLn, SZ.attr ?? 14 * fs);
  const readSize = Math.max(FLn, SZ.read ?? 18 * fs);
  // the reading is indented by a margin that takes the pin head (the pin never covers its first letter)
  const pinGap = PIN_R * 1.5;
  // the attribution (bottom right) may take two lines with a text floor
  const fA = allOnN && o.source ? ctx.fit(`— ${o.source}`, {maxWidth: inner, size: attrSize, minSize: FLn || 10, maxLines: FLn ? 2 : 1, weight: 600}) : null;
  const attrH = FLn && fA ? fA.height : attrSize;
  const availRead = y0 + hh - pad * 0.6 - attrH - attrSize * 0.5 - y;
  if (keyOnN && o.reading) {
    const f = ctx.fit(o.reading, {maxWidth: inner - pinGap, size: readSize, minSize: FLn ? Math.max(FLn, SZ.read ? SZ.read * 0.85 : 12) : (SZ.read ? SZ.read * 0.85 : 12), maxLines: Math.max(1, Math.floor(availRead / (readSize * 1.18))), weight: 600, family: 'serif'});
    parts.push(textBlock(f, {x: x0 + pad + pinGap, y, fill: INK, italic: true, name: `${P}-reading`}));
  } else {
    for (let i = 0; i < 3; i++) parts.push(h('rect', {x: x0 + pad + pinGap, y: r(y + i * readSize * 1.1 + 4), width: r((inner - pinGap) * (i === 2 ? 0.5 : 0.92)), height: r(readSize * 0.42), rx: 3, fill: INK, opacity: 0.55}));
  }
  const ay = y0 + hh - pad * 0.55 - attrH;
  if (fA) {
    parts.push(textBlock(fA, {x: x0 + w - pad, y: ay, anchor: 'end', fill: th.inkSoft}));
  } else parts.push(h('rect', {x: x0 + w - pad - inner * 0.42, y: ay + 3, width: inner * 0.42, height: attrSize * 0.5, rx: 3, fill: th.inkSoft, opacity: 0.6}));
  const front = g({name: `${P}-front`, opacity: 0}, g({transform: 'scale(-1 1)'}, parts));
  const node = g({name: P},
    h('path', {name: `${P}-shadow`, d: roundRectPath(x0 + 6, y0 + 9, w, hh, 10), fill: th.shadow}),
    g({name: `${P}-flip`}, back, front));
  /** @param {{flip:number, hl?:number}} s */
  function frame(s) {
    const phi = clamp(s.flip) * Math.PI;
    let c = Math.cos(phi);
    if (Math.abs(c) < 0.02) c = c < 0 ? -0.02 : 0.02;
    const lift = 0.06 * Math.sin(phi);
    return {
      [`${P}-flip`]: {transform: `scale(${r(c, 4)} ${r(1 + lift, 4)})`},
      [`${P}-back`]: {opacity: c > 0 ? 1 : 0},
      [`${P}-front`]: {opacity: c > 0 ? 0 : 1},
      [`${P}-hl`]: {opacity: r(clamp(s.hl ?? 0), 3)},
      // the shadow narrows with the card as it turns (no bare shadow rectangle beside a thin card)
      [`${P}-shadow`]: {transform: `${T(Math.sin(phi) * 8, Math.sin(phi) * 10)} scale(${r(Math.max(0.02, Math.abs(c)), 4)} ${r(1 + lift, 4)})`},
    };
  }
  /** Local point on the card's free (right) edge for a flip value. */
  const edgeAt = (flip, y) => ({x: (w / 2) * Math.cos(clamp(flip) * Math.PI), y: y * (1 + 0.06 * Math.sin(clamp(flip) * Math.PI))});
  // pin dock on the front face, at the start of the reading (front is mirrored: its left is local -x after the turn)
  const dock = {x: x0 + pad + pinGap - PIN_R - 8, y: y0 + pad * 0.7 + tSize * 1.9 + titleExtra + readSize * 0.45};
  return {node, frame, edgeAt, dock, w, h: hh};
}

/* ------------------------------------------------------------------ */
/* Pins and cord                                                       */
/* ------------------------------------------------------------------ */

/** Radius of a map pin head (stage units). */
export const PIN_R = 18;

/** One map-pin head (shadow, head, glint). Local origin = the pin point. */
export function pinHead(ctx, name, color) {
  const th = ctx.theme;
  const col = color ?? linkColor(ctx);
  return g({name},
    h('ellipse', {cx: 7, cy: 12, rx: PIN_R + 1, ry: PIN_R * 0.75, fill: th.shadow}),
    h('circle', {r: PIN_R, fill: col, stroke: INK, 'stroke-width': 3}),
    h('circle', {r: PIN_R * 0.45, fill: shade(col, -0.25), opacity: 0.45}),
    h('circle', {cx: -PIN_R * 0.33, cy: -PIN_R * 0.33, r: PIN_R * 0.3, fill: '#fff', opacity: 0.65}),
  );
}

/**
 * Two map pins joined by a cord. Named: `${P}-cord`, `${P}-a`, `${P}-b`,
 * `${P}-coil` (the wound cord at rest, rides pin B).
 */
export function pinPair(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const col = o.color ?? linkColor(ctx);
  const pin = name => pinHead(ctx, name, col);
  const coilD = [];
  for (let i = 0; i < 3; i++) coilD.push(`M${-30 - i * 7} 0a${30 + i * 7} ${21 + i * 6} 0 1 0 ${60 + i * 14} 0a${30 + i * 7} ${21 + i * 6} 0 1 0 ${-60 - i * 14} 0`);
  const node = g({name: P},
    h('path', {name: `${P}-cord`, d: 'M0 0', fill: 'none', stroke: col, 'stroke-width': o.cordWidth ?? 4.4, 'stroke-linecap': 'round', opacity: 0}),
    g({name: `${P}-coil`}, h('path', {d: coilD.join(''), fill: 'none', stroke: INK, 'stroke-width': 6.4, opacity: 0.35}), h('path', {d: coilD.join(''), fill: 'none', stroke: col, 'stroke-width': 4, opacity: 0.95})),
    pin(`${P}-a`),
    pin(`${P}-b`),
  );
  /** Cord path between a and b with a gentle sag (bend grows with length). */
  const cordD = (a, b) => {
    const d = dist(a, b);
    const n = unit(a, b);
    let nx = -n.y, ny = n.x;
    if (ny < 0) { nx = -nx; ny = -ny; }
    const bend = Math.min(70, d * 0.12);
    const c = {x: (a.x + b.x) / 2 + nx * bend, y: (a.y + b.y) / 2 + ny * bend};
    return {d: `M${r(a.x)} ${r(a.y)}Q${r(c.x)} ${r(c.y)} ${r(b.x)} ${r(b.y)}`, c};
  };
  /** @param {{a:{x:number,y:number}, b:{x:number,y:number}, aScale?:number, bScale?:number, coil:number, cord:number}} s */
  function frame(s) {
    // o.cordPath (opt-in): a routed cord (a polyline through free space) instead of the sagging curve
    const cd = o.cordPath ? {d: o.cordPath(s.a, s.b)} : cordD(s.a, s.b);
    return {
      [`${P}-cord`]: {d: cd.d, opacity: r(clamp(s.cord), 3)},
      [`${P}-coil`]: {transform: `${T(s.b.x - 2, s.b.y + 4, 0, Math.max(0.01, clamp(s.coil)))}`, opacity: s.coil > 0.02 ? 1 : 0},
      [`${P}-a`]: {transform: T(s.a.x, s.a.y, 0, s.aScale ?? 1)},
      [`${P}-b`]: {transform: T(s.b.x, s.b.y, 0, s.bScale ?? 1)},
    };
  }
  return {node, frame, cordD, midpoint: (a, b) => qpt(a, cordD(a, b).c, b, 0.5)};
}

/* ------------------------------------------------------------------ */
/* Desk stage                                                          */
/* ------------------------------------------------------------------ */

export const STAGE = {horizontal: {w: 1600, h: 900}, square: {w: 1300, h: 1100}, vertical: {w: 1000, h: 1400}, pair: {w: 1300, h: 770}};

/**
 * Geometry per axis (stage units). sheet: centre, size, rotation; book:
 * hinge, page size, flag width; lens/pins rest; note card; torso anchors
 * of the shoulders (far outside the window: the arms enter from its edge);
 * chip: the reader caption at the window's bottom edge.
 */
const GEO = {
  horizontal: {
    fs: 1, sheet: {cx: 292, cy: 412, w: 392, h: 528, rot: -1.5}, hinge: [900, 408], pw: 318, ph: 470, flagW: 184,
    lensR: 84, lensRest: [150, 792], lensAngle: -18, pinsRest: [448, 832], note: {cx: 668, cy: 786, w: 300, h: 176},
    shL: [520, 1760], shR: [1500, 1760], armW: 54, chip: [1010, 'middle', 360],
  },
  square: {
    fs: 1.22, sheet: {cx: 262, cy: 478, w: 382, h: 520, rot: -1.5}, hinge: [796, 452], pw: 292, ph: 452, flagW: 186,
    lensR: 80, lensRest: [140, 972], lensAngle: -18, pinsRest: [436, 1012], note: {cx: 672, cy: 934, w: 300, h: 178},
    shL: [480, 1960], shR: [1460, 1860], armW: 56, chip: [1250, 'end', 380],
  },
  vertical: {
    fs: 1.1, sheet: {cx: 292, cy: 902, w: 400, h: 468, rot: -1.5}, hinge: [470, 372], pw: 292, ph: 452, flagW: 176,
    lensR: 80, lensRest: [140, 1270], lensAngle: -18, pinsRest: [428, 1306], note: {cx: 768, cy: 868, w: 290, h: 178},
    shL: [-420, 1860], shR: [1500, 1080], armW: 56, chip: [970, 'end', 400],
  },
  // compact desk for paired scenes (contrast, LAW-0127 only): no captions on the desk, so the
  // sheet and the book sit near the top; the lens, pins and note card lie in a low band under them;
  // the bottom-right corner (x >= PAIR_ZONE.x, y >= PAIR_ZONE.y) is kept free for a result callout
  pair: {
    fs: 1.22, sheet: {cx: 250, cy: 258, w: 382, h: 440, rot: -1.5}, hinge: [760, 264], pw: 292, ph: 452, flagW: 186,
    lensR: 76, lensRest: [118, 628], lensAngle: -18, pinsRest: [262, 732], note: {cx: 462, cy: 632, w: 264, h: 178},
    shL: [440, 1620], shR: [1460, 1540], armW: 56, chip: [1250, 'end', 380],
  },
};
/**
 * Free areas of the `pair` desk (stage units) for a result callout at the hold: `note` = right of
 * the note card (the cord ends on it in scenario B); `band` = the low band right of the lens
 * (over the unused note card and the pins' rest, for scenario A, whose cord ends on the book).
 */
export const PAIR_ZONE = {note: {x: 612, y: 504, w: 668, h: 252}, band: {x: 322, y: 504, w: 958, h: 252}, noteCard: {x: 330, y: 543, w: 264, h: 178},
  // outer boxes of the documents on the pair desk (a callout must never cover them)
  sheet: {x: 50, y: 30, w: 400, h: 456}, openPages: {x: 468, y: 38, w: 584, h: 452}, closedBook: {x: 760, y: 38, w: 478, h: 452}, flags: {x: 1034, y: 38, w: 204, h: 452}};
/** Fraction of its full length an arm is extended to (slight natural elbow bend). */
const ARM_EXT = 0.93;
/** Open progress at which the hand lets the cover / card fall the rest of the way. */
export const RELEASE = 0.6;

/**
 * Desk with the article extract, the book (hierarchy flags on its
 * fore-edge), the hand lens, the pins and cord, optionally the usage note,
 * and two arms.
 * @param {any} ctx
 * @param {{prefix:string, axis:'horizontal'|'square'|'vertical', params:any, target?:'definition'|'note', withNote?:boolean, fsBoost?:number, entryRow?:number, rows?:Array<{term?:string|null,text?:string|null}>, term?:string, termAlt?:string, chips?:boolean, captions?:boolean, noteText?:{title?:string, reading?:string, source?:string}}} o
 */
export function definitionDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  // o.stageH (opt-in): a taller desk (extra free surface under the props)
  const W = STAGE[axis].w, H = o.stageH ?? STAGE[axis].h;
  const p = o.params;
  const t = kitStrings(p.locale);
  const fs = G.fs * (o.fsBoost ?? 1);
  const target = o.target || 'definition';
  const pa = p.passages[0], pd = p.passages[1];
  const aLvl = levelIndex(p, pa), dLvl = levelIndex(p, pd);
  const levelName = i => p.hierarchy[i] || `${t.level} ${i + 1}`;
  const term = o.term ?? pa.term;

  // desk window (clips everything inside, so arms enter from the frame edge)
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, seedKey: 'def-desk'});

  // article extract
  const S = G.sheet;
  const sheetT = `${T(S.cx, S.cy, S.rot)} translate(${r(-S.w / 2)} ${r(-S.h / 2)})`;
  const sheetOpts = {w: S.w, h: S.h, ref: pa.ref, heading: pa.heading, term, altTerm: o.termAlt, levelLabel: levelName(aLvl), levelColor: levelColor(ctx, aLvl), termLine: 2, fs, seedKey: 'def-sheet'};
  if (o.termMaxWidth) sheetOpts.termMaxWidth = o.termMaxWidth;
  if (o.termMaxLines) sheetOpts.termMaxLines = o.termMaxLines;
  if (o.fullText) sheetOpts.fullText = true;
  if (o.floor) sheetOpts.floor = o.floor;
  // o.mute (opt-in): every prop on the desk is drawn without its supplied text (thumbnails only)
  if (o.mute) sheetOpts.showText = false;
  // opt-in overrides (entries other than the story): flag column width and label size
  const flagW = o.flagW ?? G.flagW;
  const sheet = articleSheet(ctx, {prefix: `${P}-sheet`, ...sheetOpts});
  const toWorldS = q => {
    const v = rotP({x: q.x - S.w / 2, y: q.y - S.h / 2}, S.rot);
    return {x: S.cx + v.x, y: S.cy + v.y};
  };
  const toLocalS = q => {
    const v = rotP({x: q.x - S.cx, y: q.y - S.cy}, -S.rot);
    return {x: v.x + S.w / 2, y: v.y + S.h / 2};
  };
  const termC = toWorldS({x: sheet.termBox.x + sheet.termBox.w / 2, y: sheet.termBox.y + sheet.termBox.h / 2});
  const pinAPt = toWorldS(sheet.pinPt);
  const pinAPt2 = toWorldS(sheet.pinPt2);
  const sheetBox = {x: S.cx - S.w / 2 - 8, y: S.cy - S.h / 2 - 8, w: S.w + 44, h: S.h + 16};

  // book: the definitions page holds `rows`; the supplied definition sits in `entryRow`
  const nRows = 3;
  const entryRow = clamp((o.entryRow ?? p.entryRow ?? 2) - 1, 0, nRows - 1);
  const rows = o.rows || Array.from({length: nRows}, (_, i) => (i === entryRow ? {term: pd.term, text: pd.text} : {term: null, text: null}));
  const hinge = {x: G.hinge[0], y: G.hinge[1]};
  const book = lawBook(ctx, {prefix: `${P}-book`, pw: G.pw, ph: G.ph, title: p.sources[0], ref: pd.ref, heading: pd.heading, rows, levels: p.hierarchy, defLevel: dLvl, levelLabel: levelName(dLvl), fs, flagW, seedKey: 'def-book', plateFade: o.plateFade, flagFs: o.flagFs, fullText: o.fullText, floor: o.floor, mute: o.mute});
  const bookW = q => ({x: hinge.x + q.x, y: hinge.y + q.y});
  const flagDef = book.flags[dLvl];
  const gripY = flagDef.cy;
  const coverEdge = openV => bookW(book.edgeAt(openV, gripY));
  const entryPin = i => bookW(book.pinPt(i));

  // usage note (another source)
  // with boosted text (small paired desks) the note card grows a little so its proposal stays legible
  const nk = Math.min(1.2, Math.max(1, o.fsBoost ?? 1));
  // o.noteGeo (opt-in): explicit note card centre and size
  const N = o.noteGeo ? {...o.noteGeo} : {...G.note, w: G.note.w * nk, h: G.note.h * nk};
  const noteC = {x: N.cx, y: N.cy};
  const it = (p.interpretations || [])[0] || {};
  const nt = o.noteText || {};
  const note = o.withNote ? usageNote(ctx, {prefix: `${P}-note`, w: N.w, h: N.h, title: nt.title ?? p.sources[1] ?? '', reading: nt.reading ?? it.reading ?? '', source: nt.source ?? it.source ?? '', fs, sizes: o.noteSizes, floor: o.floor, mute: o.mute}) : null;
  const noteGripY = N.h * 0.18;
  const noteEdge = flip => ({x: noteC.x + note.edgeAt(flip, noteGripY).x, y: noteC.y + note.edgeAt(flip, noteGripY).y});
  const noteDock = note ? {x: noteC.x + note.dock.x, y: noteC.y + note.dock.y} : null;

  // lens: a copy of the sheet (same pose) under the glass; only the term word
  // is text in the copy (it is the only text the glass ever passes over)
  const lensR = G.lensR;
  const sheetCopy = articleSheet(ctx, {prefix: `${P}-lz`, ...sheetOpts, copy: true});
  const lens = magnifier(ctx, {prefix: `${P}-lens`, R: lensR, content: g({transform: sheetT}, sheetCopy.node), bg: th.woodTop, bgBox: {x: -W, y: -H, w: W * 3, h: H * 3}});
  const lensRest = {x: G.lensRest[0], y: G.lensRest[1]};
  const termW = sheet.termBox.w;
  const zoom = clamp((lensR * 1.76) / Math.max(1, termW), 1.2, 1.9);

  // pins
  // o.cordWidth (opt-in): a thicker cord (small paired desks keep it >= 4 px on the frame)
  const pins = pinPair(ctx, {prefix: `${P}-pins`, cordWidth: o.cordWidth});
  const pinsRest = {x: G.pinsRest[0], y: G.pinsRest[1]};
  const offA = {x: 16, y: 14};

  // arms (one reader, both arms the same look)
  const look = actorLook(ctx, {appearance: {skin: 3, outfit: 1}}, 0);
  const shL = {x: G.shL[0], y: G.shL[1]}, shR = {x: G.shR[0], y: G.shR[1]};
  const angleAt = c => (Math.atan2(shL.y - c.y, shL.x - c.x) * 180) / Math.PI;
  const lensOn = {x: termC.x, y: termC.y};
  const restAngle = G.lensAngle ?? 0;
  const angleFor = (c, k) => lerp(restAngle, angleAt(c), clamp(k));
  const gripOf = (c, k = 1) => lens.gripAt(c, angleFor(c, k));
  const dockB = target === 'note' && noteDock ? noteDock : entryPin(entryRow);
  const outOf = (q, anchor) => {
    const d = unit(q, anchor);
    const e = exitDistance(q, d, W, H) + G.armW * 2.6;
    return {x: q.x + d.x * e, y: q.y + d.y * e};
  };
  const restGripL = gripOf(lensRest, 0);
  const startR = target === 'note' && note ? noteEdge(0) : coverEdge(0);
  const releaseR = target === 'note' && note ? noteEdge(RELEASE) : coverEdge(RELEASE);
  const carryCtrl = {x: (pinAPt.x - offA.x + dockB.x) / 2, y: Math.min(pinAPt.y, dockB.y) - (axis === 'vertical' ? 60 : 110)};
  const carryAt = e => qpt({x: pinAPt.x - offA.x, y: pinAPt.y - offA.y}, carryCtrl, dockB, e);
  const targetsL = [restGripL, gripOf(lensOn), gripOf(mix(lensRest, lensOn, 0.5)), pinsRest, {x: pinAPt.x - offA.x, y: pinAPt.y - offA.y}, dockB, carryAt(0.5), carryAt(0.25), carryAt(0.75)];
  if (noteDock) targetsL.push(noteDock);
  const targetsR = [startR, releaseR, target === 'note' && note ? noteEdge(RELEASE / 2) : coverEdge(RELEASE / 2)];
  const armW = G.armW;
  const HAND = 24 * 1.3 * (armW / 46);
  const lenFor = (anchor, targets) => Math.max(...targets.map(q => (exitDistance(q, unit(q, anchor), W, H) + armW * 1.8) / ARM_EXT));
  const lenL = lenFor(shL, targetsL), lenR = lenFor(shR, targetsR);
  const armSpec = len => ({upper: (len - HAND) * 0.52, lower: (len - HAND) * 0.48, width: armW, handScale: 1.3});
  const armL = topArm(ctx, {name: `${P}-armL`, skin: look.skin, sleeve: look.outfit, handed: 'left', ...armSpec(lenL)});
  const armR = topArm(ctx, {name: `${P}-armR`, skin: look.skin, sleeve: look.outfit, handed: 'right', ...armSpec(lenR)});
  const shoulderFor = (anchor, hand, len) => {
    const d = unit(hand, anchor);
    return {x: hand.x + d.x * len * ARM_EXT, y: hand.y + d.y * len * ARM_EXT};
  };
  const outL0 = outOf(restGripL, shL);
  // off-stage start is the same whatever the target (identical scenes before the change)
  const outR0 = outOf(coverEdge(0), shR);
  const outRel = outOf(releaseR, shR);
  const outDock = outOf(dockB, shL);

  // captions (key labels): reader at the bottom edge where the arms enter,
  // the extract above the sheet, the hierarchy above the flags
  const chips = [];
  const capSize = Math.max(o.floor || 0, 23 * fs);
  if (o.captions !== false && ctx.show('key')) {
    const mk = (text, x, anchor, maxWidth, yFn, name, under = false) => {
      const opts = {x, anchor, maxWidth, size: capSize, minSize: o.floor ? capSize : capSize * 0.8, maxLines: 2, name, weight: 600};
      const probe = chip(ctx, text, {...opts, y: 0});
      const c = chip(ctx, text, {...opts, y: yFn(probe.box.h)});
      c.under = under;
      chips.push(c);
      return c;
    };
    if (o.chips !== false) mk((p.actorLabels && p.actorLabels.a) || t.reader, G.chip[0], G.chip[1], G.chip[2], hh => H - 14 - hh, `${P}-cap-reader`);
    const sheetTop = S.cy - S.h / 2;
    mk((p.actorLabels && p.actorLabels.b) || t.extract, S.cx, 'middle', S.w + 20, hh => Math.max(10, sheetTop - 10 - hh), `${P}-cap-extract`, true);
    const fTop = Math.min(hinge.y + book.flags[0].box.y, hinge.y - G.ph / 2);
    mk((p.objectLabels && p.objectLabels.hierarchy) || t.hierarchy, W - 14, 'end', flagW + G.pw * 0.9, hh => Math.max(10, fTop - 14 - hh), `${P}-cap-hier`, true);
  }

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      g({transform: T(hinge.x, hinge.y)}, book.node),
      note ? g({transform: T(noteC.x, noteC.y)}, note.node) : null,
      g({transform: sheetT}, sheet.node),
      // object captions lie on the desk: an arm that crosses them passes over them
      chips.filter(c => c.under).map(c => c.node),
      armR.arm, armR.palm, armR.thumb,
      armL.arm, armL.palm,
      lens.node,
      pins.node,
      armL.thumb,
    ),
    desk.frame,
    chips.filter(c => !c.under).map(c => c.node),
  );

  /**
   * Pose the stage from action values in [0,1].
   * @param {{lEnter:number, lensMove:number, mark:number, lensPark:number, pinsTake:number, pinA:number, carry:number, lOut:number,
   *          rEnter:number, open:number, rOut:number, entryHl?:number, noteHl?:number, flagHl?:number, rowHl?:(i:number)=>number, openHeld?:number}} v
   */
  function pose(v) {
    const nodes = {};
    const E = ease.inOutCubic;
    // ---- magnifier and left hand
    let lensC = lensRest;
    let lift = 0;
    if (v.lensPark > 0) {
      const e = E(v.lensPark);
      lensC = mix(lensOn, lensRest, e);
      lift = Math.sin(e * Math.PI);
    } else if (v.lensMove > 0) {
      const e = E(v.lensMove);
      lensC = mix(lensRest, lensOn, e);
      lift = Math.sin(e * Math.PI);
    }
    // the lens is held from taking it until the hand lets go of it (parked, then pins or leave)
    const lensHeld = v.lEnter >= 1 && v.pinsTake <= 0 && !(v.lOut > 0);
    const turnK = E(clamp(v.lensMove)) * (1 - E(clamp(v.lensPark)));
    let hL;
    let pinsHeld = false;
    let pinAPlaced = v.pinA >= 1;
    if (v.lOut > 0) hL = v.carry >= 1 ? mix(dockB, outDock, E(v.lOut)) : mix(restGripL, outL0, E(v.lOut));
    else if (v.carry > 0) { hL = carryAt(E(v.carry)); pinsHeld = v.carry < 1; }
    else if (v.pinA > 0) {
      const e = E(v.pinA);
      const a = pinsRest, b = {x: pinAPt.x - offA.x, y: pinAPt.y - offA.y};
      const c = {x: (a.x + b.x) / 2 + 40, y: Math.min(a.y, b.y) - 30};
      hL = qpt(a, c, b, e);
      pinsHeld = true;
    } else if (v.pinsTake > 0) {
      hL = mix(restGripL, pinsRest, E(v.pinsTake));
      pinsHeld = v.pinsTake >= 1;
    } else if (v.lEnter < 1) hL = mix(outL0, restGripL, E(v.lEnter));
    else hL = gripOf(lensC, turnK);
    const solvedL = armL.pose(shoulderFor(shL, hL, lenL), hL, 1);
    Object.assign(nodes, solvedL.nodes);
    if (lensHeld) {
      // the lens follows the SOLVED hand (identical when reached)
      const g0 = gripOf(lensC, turnK);
      lensC = {x: lensC.x + solvedL.hand.x - g0.x, y: lensC.y + solvedL.hand.y - g0.y};
    }
    const ang = angleFor(lensC, turnK);
    const overSheet = clamp(1 - dist(lensC, termC) / (lensR * 3));
    const zoomNow = zoom;
    Object.assign(nodes, lens.frame({x: lensC.x, y: lensC.y, angle: ang, zoom: zoomNow, lift: lift * 0.6}));
    // the sheet's own term word hides only while the glass fully covers it
    // (the glass shows the enlarged copy)
    const tb = sheet.termBox;
    const corners = [[tb.x, tb.y], [tb.x + tb.w, tb.y], [tb.x, tb.y + tb.h], [tb.x + tb.w, tb.y + tb.h]].map(([x, y]) => toWorldS({x, y}));
    const covered = corners.every(q => dist(q, lensC) < lensR - 4);
    Object.assign(nodes, sheetMarks(`${P}-sheet`, v.mark));
    if (sheet.clipOn) {
      // visible part of the sheet's own term word: outside the glass (approximated at the term's centre line)
      const lc = toLocalS(lensC);
      const cyT = tb.y + tb.h / 2;
      const dy = Math.abs(lc.y - cyT);
      let x0 = tb.x - 10, x1 = tb.x + Math.max(tb.w, sheet.termBox2.w) + 10;
      if (dy < lensR + 4) {
        const half = Math.sqrt(Math.max(0, (lensR + 4) * (lensR + 4) - dy * dy));
        const l = lc.x - half, rr = lc.x + half;
        if (l <= x0 && rr >= x1) x1 = x0;
        else if (l <= x0 && rr > x0) x0 = rr;
        else if (rr >= x1 && l < x1) x1 = l;
        else if (l > x0 && rr < x1) { if (l - x0 >= x1 - rr) x1 = l; else x0 = rr; }
      }
      nodes[`${P}-sheet-tclipr`] = {x: r(x0), width: r(Math.max(0, x1 - x0))};
    }
    Object.assign(nodes, sheetMarks(`${P}-lz`, v.mark));
    // the glass's enlarged word is drawn only while its enlarged position is inside the glass
    // (exact test: the enlarged word's box, centred where the glass shows it, meets the glass circle)
    const ez = {x: lensC.x + (termC.x - lensC.x) * zoomNow, y: lensC.y + (termC.y - lensC.y) * zoomNow};
    const hw = (Math.max(tb.w, sheet.termBox2.w) * zoomNow) / 2, hh2 = (tb.h * zoomNow) / 2;
    const nx = clamp(lensC.x, ez.x - hw, ez.x + hw), ny = clamp(lensC.y, ez.y - hh2, ez.y + hh2);
    nodes[`${P}-lz-termtext`] = {opacity: Math.hypot(nx - lensC.x, ny - lensC.y) < lensR - 6 ? 1 : 0};

    // ---- pins and cord
    let pa, pb;
    const handPt = solvedL.hand;
    let bScale = 1;
    if (pinsHeld && !pinAPlaced) {
      pb = handPt;
      pa = {x: handPt.x + offA.x, y: handPt.y + offA.y};
      bScale = 1.12;
    } else if (pinAPlaced && v.carry < 1) {
      pa = pinAPt;
      pb = v.carry > 0 || pinsHeld ? handPt : {x: pinAPt.x - offA.x, y: pinAPt.y - offA.y};
      bScale = 1 + 0.18 * Math.sin(E(v.carry) * Math.PI) + (v.carry > 0 ? 0.08 : 0);
    } else if (v.carry >= 1) {
      pa = pinAPt;
      pb = dockB;
    } else {
      pb = pinsRest;
      pa = {x: pinsRest.x + offA.x, y: pinsRest.y + offA.y};
    }
    const cordOn = pinAPlaced ? 1 : 0;
    Object.assign(nodes, pins.frame({a: pa, b: pb, aScale: pinAPlaced ? 0.92 : 1, bScale: v.carry >= 1 ? 0.92 : bScale, coil: 1 - clamp(v.carry * 1.6), cord: cordOn}));

    // ---- right hand: opens the book at the definition's flag (or turns the note)
    const noteMode = target === 'note' && note;
    const openE = E(clamp(v.open));
    const edgeFn = noteMode ? noteEdge : coverEdge;
    let hR;
    if (v.rOut > 0) hR = mix(edgeFn(Math.min(openE, RELEASE)), noteMode ? outOf(releaseR, shR) : outRel, E(v.rOut));
    else if (v.open > 0) hR = edgeFn(Math.min(openE, RELEASE));
    else hR = mix(outR0, startR, E(v.rEnter));
    const solvedR = armR.pose(shoulderFor(shR, hR, lenR), hR, -1);
    Object.assign(nodes, solvedR.nodes);
    const bookOpen = noteMode ? 0 : openE;
    const noteFlip = noteMode ? openE : 0;
    Object.assign(nodes, book.frame({open: bookOpen, flagIndex: dLvl, flagHl: noteMode ? 0 : (v.flagHl ?? clamp(v.rEnter * 2 - 1)), rowHl: v.rowHl || (i => (i === entryRow ? (v.entryHl ?? 0) : 0))}));
    if (note) Object.assign(nodes, note.frame({flip: noteFlip, hl: v.noteHl ?? 0}));

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const upperL = solvedL.nodes[`${P}-armL-upper`];
    const upperR = solvedR.nodes[`${P}-armR-upper`];
    return {
      nodes,
      semantic: {
        lens: P2(lensC),
        lensGrip: P2(gripOf(lensC, turnK)),
        lensHolder: lensHeld ? 'hand' : 'desk',
        lensOverTerm: r(overSheet, 3),
        termCovered: covered,
        handL: P2(solvedL.hand),
        elbowL: {x: upperL.x2, y: upperL.y2},
        handR: P2(solvedR.hand),
        elbowR: {x: upperR.x2, y: upperR.y2},
        pinA: P2(pa),
        pinB: P2(pb),
        pinHolder: v.carry >= 1 ? 'pinned' : pinsHeld || (v.carry > 0) ? 'hand' : pinAPlaced ? 'hand' : 'desk',
        pinAPlaced,
        coverEdge: P2(coverEdge(noteMode ? 0 : openE)),
        noteEdge: note ? P2(noteEdge(noteFlip)) : null,
        edgeGrip: P2(edgeFn(Math.min(openE, RELEASE))),
        bookOpen: r(bookOpen, 3),
        noteOpen: r(noteFlip, 3),
        termMark: r(clamp(v.mark), 3),
        entryHl: r(clamp(v.entryHl ?? 0), 3),
        noteHl: r(clamp(v.noteHl ?? 0), 3),
        linked: v.carry >= 1,
        target,
        reach: {L: solvedL.reached, R: solvedR.reached},
        allReached: solvedL.reached && solvedR.reached,
      },
    };
  }

  return {
    node, pose, W, H, axis, G, fs, strings: t, sheet, book, note, lens, pins, hinge, chips,
    termC, pinAPt, pinAPt2, dockB, entryRow, sheetOpts, sheetCopy, entryPin, noteC, noteDock, sheetBox, aLvl, dLvl, lensRest,
    /** world box of a definitions row */
    rowBox: i => { const b = book.rowBoxes[i]; return {x: hinge.x + b.x, y: hinge.y + b.y, w: b.w, h: b.h}; },
    /** world box of the flags column */
    flagsBox: {x: hinge.x + G.pw - 4, y: hinge.y + book.flags[0].box.y, w: flagW + 8, h: book.flags[book.flags.length - 1].box.y + book.flags[book.flags.length - 1].box.h - book.flags[0].box.y},
    flagBox: i => { const b = book.flags[i].box; return {x: hinge.x + b.x, y: hinge.y + b.y, w: b.w, h: b.h}; },
    bookBox: {x: hinge.x - G.pw, y: hinge.y - G.ph / 2, w: G.pw * 2, h: G.ph},
    termBoxW: (() => { const tb = sheet.termBox; const a = toWorldS({x: tb.x, y: tb.y}); return {x: a.x, y: a.y, w: tb.w, h: tb.h}; })(),
    noteBox: note ? {x: noteC.x - N.w / 2, y: noteC.y - N.h / 2, w: N.w, h: N.h} : null,
    toWorldS,
    sheetT,
  };
}

/* ------------------------------------------------------------------ */
/* Mechanism pieces                                                    */
/* ------------------------------------------------------------------ */

/**
 * The book cut open along its page edge: a slab of stacked page bands, one
 * band per user-supplied hierarchy level (top to bottom in the author's
 * order). `vertical` stands the slab on its spine end (bands stacked along
 * y either way; a vertical slab is tall and narrow). Local = stage coords.
 * Named: `${P}-band${i}` (tint), `${P}-band${i}-ring`.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, levels:string[], fs?:number, title?:string, plateMax?:number}} o
 */
export function hierarchySlab(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const fs = o.fs ?? 1;
  const keyOn = ctx.show('key');
  const allOn = ctx.show('all');
  const n = o.levels.length;
  const board = 16;
  const inner = {x: o.x + 10, y: o.y + board, w: o.w - 20, h: o.h - board * 2};
  const bh = inner.h / n;
  const cover = shade(th.accent4, -0.35);
  const parts = [
    h('path', {d: roundRectPath(o.x + 8, o.y + 12, o.w, o.h, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 12), fill: cover, stroke: th.ink, 'stroke-width': 2.4}),
  ];
  const bands = o.levels.map((label, i) => {
    const b = {x: inner.x, y: inner.y + i * bh, w: inner.w, h: bh};
    const lc = levelColor(ctx, i);
    const lines = [];
    const nl = Math.max(2, Math.floor((bh - 10) / 7));
    for (let k = 1; k < nl; k++) lines.push(h('line', {x1: b.x + 4, x2: b.x + b.w - 4, y1: r(b.y + k * (bh / nl)), y2: r(b.y + k * (bh / nl)), stroke: shade(lc.soft, -0.12), 'stroke-width': 1}));
    const size = Math.max(o.floor || 0, 20 * fs);
    // o.plateMax: a narrower name plate (wraps the label; a round lens can then hold the whole plate)
    // with a floor the name plate takes as many lines as the name needs (the band is sized to it)
    const f = keyOn && label ? fitWords(ctx, label, {maxWidth: Math.min(b.w - 40, o.plateMax ?? Infinity), size, minSize: o.floor || 12, maxLines: o.floor ? 6 : Math.max(1, Math.min(3, Math.floor((bh - 8) / (size * 1.2)))), weight: 700}) : null;
    const plateW = f ? f.width + 24 : Math.min(b.w * 0.4, 160);
    const plateH = f ? f.height + 12 : Math.min(bh * 0.4, 24);
    const px = b.x + (b.w - plateW) / 2, py = b.y + (bh - plateH) / 2;
    const node = g({name: `${P}-band${i}`},
      h('rect', {x: b.x, y: b.y, width: b.w, height: bh, fill: lc.soft, stroke: th.ink, 'stroke-width': 1.4}),
      lines,
      h('rect', {x: b.x, y: b.y, width: 12, height: bh, fill: lc.c}),
      h('rect', {x: b.x + b.w - 12, y: b.y, width: 12, height: bh, fill: lc.c}),
      h('path', {d: roundRectPath(px, py, plateW, plateH, 6), fill: '#ffffff', opacity: 0.88, stroke: shade(lc.c, -0.2), 'stroke-width': 1.4}),
      f ? (o.textMask ? maskedBlock(ctx, f, {x: b.x + b.w / 2, y: py + 6, anchor: 'middle', fill: INK, bar: shade(lc.c, -0.2)}, o.textMask) : textBlock(f, {x: b.x + b.w / 2, y: py + 6, anchor: 'middle', fill: INK})) : h('rect', {x: px + plateW * 0.15, y: py + plateH * 0.35, width: plateW * 0.7, height: plateH * 0.3, rx: 3, fill: shade(lc.c, -0.2)}),
      h('rect', {name: `${P}-band${i}-ring`, x: b.x - 3, y: b.y + 1, width: b.w + 6, height: bh - 2, rx: 4, fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}),
    );
    return {node, box: b, color: lc, plate: {x: px, y: py, w: plateW, h: plateH}};
  });
  let titleNode = null;
  let titleBox = null;
  if (o.title && allOn) {
    const f = o.floor ? fullFit(ctx, o.title, {maxWidth: o.w + 120, size: Math.max(o.floor, 17 * fs), weight: 700}) : ctx.fit(o.title, {maxWidth: o.w - 20, size: 17 * fs, minSize: 12, maxLines: 1, weight: 700});
    titleNode = textBlock(f, {x: o.x + o.w / 2, y: o.y - f.height - 8, anchor: 'middle', fill: th.fgSoft});
    titleBox = {x: o.x + o.w / 2 - f.width / 2, y: o.y - f.height - 8, w: f.width, h: f.height + 8};
  }
  const node = g({name: P}, parts, bands.map(b => b.node), titleNode);
  return {node, bands, box: {x: o.x, y: o.y, w: o.w, h: o.h}, titleBox};
}

/**
 * A card lifted out of a page: the enlarged term, or the definition entry.
 * Local origin = centre. Named: `${P}` (transform), `${P}-ring`.
 * @param {any} ctx
 * @param {{prefix:string, kind:'term'|'definition', term:string, text?:string, caption?:string, maxWidth:number, fs?:number, color?:string}} o
 */
export function liftedCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const fs = o.fs ?? 1;
  const keyOn = ctx.show('key');
  const allOn = ctx.show('all');
  const pad = 18 * fs;
  const parts = [];
  const inner = o.maxWidth - pad * 2;
  const tSize = (o.kind === 'term' ? 34 : 25) * fs;
  const fT = ctx.fit(o.kind === 'term' ? o.term : `“${o.term}”`, {maxWidth: inner, size: tSize, minSize: tSize * 0.7, maxLines: 2, weight: 700, family: 'serif'});
  const FLc = o.floor || 0;
  const fD = o.kind === 'definition' && o.text && allOn ? (FLc ? fullFit(ctx, o.text, {maxWidth: inner, size: Math.max(FLc, 18 * fs), weight: 400, family: 'serif'}) : ctx.fit(o.text, {maxWidth: inner, size: 18 * fs, minSize: 13, maxLines: 4, weight: 400, family: 'serif'})) : null;
  const fC = o.caption && allOn ? (FLc ? fullFit(ctx, o.caption, {maxWidth: inner, size: Math.max(FLc, 15 * fs), weight: 700}) : ctx.fit(o.caption, {maxWidth: inner, size: 15 * fs, minSize: 11, maxLines: 1, weight: 700})) : null;
  const w = Math.max(fT.width, fD ? fD.width : 0, fC ? fC.width : 0, 120 * fs) + pad * 2;
  const capH = fC ? fC.height + 8 * fs + tSize * 0.22 : 0;
  // o.noBody (opt-in): the card carries its caption and quoted term only (no wording, no filler lines)
  const bodyH = fT.height + (fD ? fD.height + 10 * fs : (o.kind === 'definition' && !o.noBody ? 40 * fs : 0));
  const hh = capH + bodyH + pad * 1.4;
  const x0 = -w / 2, y0 = -hh / 2;
  parts.push(h('path', {d: roundRectPath(x0 + 6, y0 + 9, w, hh, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x0, y0, w, hh, 10), fill: o.kind === 'term' ? '#fff8dc' : th.paper, stroke: th.ink, 'stroke-width': 2.4}));
  parts.push(h('rect', {x: x0, y: y0, width: 10, height: hh, rx: 4, fill: o.color || linkColor(ctx)}));
  parts.push(h('path', {name: `${P}-ring`, d: roundRectPath(x0 - 5, y0 - 5, w + 10, hh + 10, 13), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}));
  let y = y0 + pad * 0.7;
  const M = o.textMask;
  const block = (f, oo) => (M ? maskedBlock(ctx, f, {...oo, bar: oo.bar ?? th.paperLine}, M) : textBlock(f, oo));
  if (fC) { parts.push(M ? block(fC, {x: x0 + pad, y, fill: th.inkSoft}) : textBlock(fC, {x: x0 + pad, y, fill: th.inkSoft, letterSpacing: 0.4})); y += capH; }
  const termBox = {x: x0 + pad, y, w: fT.width, h: fT.height};
  if (keyOn) parts.push(block(fT, {x: x0 + pad, y, fill: INK, bar: INK}));
  else parts.push(h('rect', {x: x0 + pad, y: y + fT.size * 0.2, width: fT.width, height: fT.size * 0.62, rx: 5, fill: INK}));
  y += fT.height + 10 * fs;
  // placeholder lines stay inside the card (the card is only as wide as its widest text)
  const cardInner = w - pad * 2;
  if (fD) parts.push(block(fD, {x: x0 + pad, y, fill: th.inkSoft}));
  else if (o.kind === 'definition' && !o.noBody) for (let i = 0; i < 2; i++) parts.push(h('rect', {x: x0 + pad, y: y + i * 18 * fs + 4, width: cardInner * (i ? 0.5 : 0.9), height: 7 * fs, rx: 3, fill: th.paperLine}));
  const node = g({name: P}, parts);
  return {node, w, h: hh, termBox, barsRight: x0 + pad + cardInner * 0.9, right: x0 + w};
}

/**
 * Lens ring (a magnifier drawn around a focused element). Local origin =
 * lens centre; the handle points down-right. Named `${P}`.
 */
export function lensRing(ctx, o) {
  const R = o.R;
  const len = R * 0.9;
  return g({name: o.prefix, opacity: 0},
    g({transform: T(0, 0, 40)},
      h('rect', {x: R + 2, y: -R * 0.1, width: R * 0.3, height: R * 0.2, fill: METAL, stroke: INK, 'stroke-width': 2}),
      h('path', {d: roundRectPath(R + R * 0.3, -R * 0.14, len, R * 0.28, R * 0.14), fill: WOOD_HANDLE, stroke: INK, 'stroke-width': 2.2})),
    h('circle', {r: R + 5, fill: 'none', stroke: RIM, 'stroke-width': 11}),
    h('circle', {r: R + 5, fill: 'none', stroke: METAL, 'stroke-width': 4}),
    h('path', {d: `M${r(-R * 0.66)} ${r(-R * 0.3)}A${r(R * 0.72)} ${r(R * 0.72)} 0 0 1 ${r(-R * 0.22)} ${r(-R * 0.68)}`, fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.7}),
  );
}

/* ------------------------------------------------------------------ */
/* Inspect lens (round, a magnifier)                                   */
/* ------------------------------------------------------------------ */

/**
 * Round detail lens drawn as a magnifier. The content is drawn in the SAME
 * world coordinates as the context; the window morphs from the source circle
 * to the destination circle and the content is scaled about the source
 * centre, so the detail keeps its source coordinates. Cone lines tie the
 * window to its source; the rest of the context dims.
 * @param {any} ctx
 * @param {{name:string, source:{x:number,y:number,r:number}, dest:{x:number,y:number,r:number}, content:any, frame:{x:number,y:number,w:number,h:number}, bg:string, color?:string, handleAngle?:number}} o
 */
export function roundLens(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const S = o.source, Dd = o.dest, F = o.frame;
  const color = o.color ?? th.accent;
  // o.inset (opt-in): an editorial inset window — no handle, no metal rim — so it never reads as a
  // second copy of a magnifier prop lying on the desk
  const inset = !!o.inset;
  // o.srcBox (opt-in): the source is marked by a rounded box hugging the detail (it never crosses
  // neighbouring text) instead of the source circle; the cone lines leave from its sides
  const SB = o.srcBox || null;
  const hole = `M${r(S.x - S.r)} ${r(S.y)}a${r(S.r)} ${r(S.r)} 0 1 0 ${r(S.r * 2)} 0a${r(S.r)} ${r(S.r)} 0 1 0 ${r(-S.r * 2)} 0Z`;
  const clipId = `${N}-clip`;
  const node = g({name: N},
    h('path', {name: `${N}-dim`, d: `M${r(F.x)} ${r(F.y)}h${r(F.w)}v${r(F.h)}h${r(-F.w)}Z${hole}`, 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
    SB ? h('path', {name: `${N}-src`, d: roundRectPath(SB.x, SB.y, SB.w, SB.h, Math.min(10, SB.h / 2)), fill: 'none', stroke: color, 'stroke-width': 3, opacity: 0})
      : h('circle', {name: `${N}-src`, cx: S.x, cy: S.y, r: S.r, fill: 'none', stroke: color, 'stroke-width': 4, opacity: 0}),
    h('line', {name: `${N}-coneA`, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('line', {name: `${N}-coneB`, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${N}-clipc`, cx: S.x, cy: S.y, r: S.r}))),
    g({name: `${N}-win`, opacity: 0},
      inset ? null : g({name: `${N}-handle`},
        h('rect', {x: 4, y: -9, width: 30, height: 18, fill: METAL, stroke: INK, 'stroke-width': 2}),
        h('path', {d: roundRectPath(32, -14, 120, 28, 14), fill: WOOD_HANDLE, stroke: INK, 'stroke-width': 2.2})),
      h('circle', {name: `${N}-shadow`, cx: S.x, cy: S.y, r: S.r, fill: th.shadow}),
      h('circle', {name: `${N}-bg`, cx: S.x, cy: S.y, r: S.r, fill: o.bg}),
      g({'clip-path': ctx.ref(clipId)}, g({name: `${N}-content`}, o.content)),
      inset ? null : h('circle', {name: `${N}-glass`, cx: S.x, cy: S.y, r: S.r, fill: '#cfe6ff', opacity: 0.1}),
      h('circle', {name: `${N}-rim`, cx: S.x, cy: S.y, r: S.r + 5, fill: 'none', stroke: inset ? th.paper : RIM, 'stroke-width': inset ? 10 : 12}),
      h('circle', {name: `${N}-rim2`, cx: S.x, cy: S.y, r: S.r + 5, fill: 'none', stroke: inset ? color : METAL, 'stroke-width': inset ? 4 : 4.5, 'stroke-dasharray': inset ? '14 8' : undefined}),
    ),
  );
  /** @param {number} p open 0 (on the source) → 1 (at the destination) @param {number} [dim] */
  function frame(p, dim = p) {
    const q = clamp(p);
    const C = {x: lerp(S.x, Dd.x, q), y: lerp(S.y, Dd.y, q)};
    const R = lerp(S.r, Dd.r, q);
    const k = R / S.r;
    const vis = q > 0.001;
    const O = SB ? {x: SB.x + SB.w / 2, y: SB.y + SB.h / 2} : S;
    const a = Math.atan2(C.y - O.y, C.x - O.x);
    const nx = -Math.sin(a), ny = Math.cos(a);
    // the source's extent across the cone direction (circle radius, or the box's support width)
    const ext = SB ? Math.abs(nx) * SB.w / 2 + Math.abs(ny) * SB.h / 2 : S.r;
    const line = (s1, s2) => ({x1: r(O.x + nx * ext * s1), y1: r(O.y + ny * ext * s1), x2: r(C.x + nx * R * s2), y2: r(C.y + ny * R * s2)});
    const cc = {cx: r(C.x), cy: r(C.y), r: r(R)};
    const haDeg = o.handleAngle ?? 45;
    const ha = (haDeg * Math.PI) / 180;
    const out = {
      [`${N}-dim`]: {opacity: r(0.38 * clamp(dim), 3)},
      [`${N}-src`]: {opacity: vis ? 1 : 0},
      [`${N}-coneA`]: {...line(1, 1), opacity: q > 0.05 ? 1 : 0},
      [`${N}-coneB`]: {...line(-1, -1), opacity: q > 0.05 ? 1 : 0},
      [`${N}-clipc`]: cc,
      [`${N}-win`]: {opacity: vis ? 1 : 0},
      [`${N}-shadow`]: {cx: r(C.x + 8), cy: r(C.y + 12), r: r(R)},
      [`${N}-bg`]: cc,
      [`${N}-rim`]: {cx: cc.cx, cy: cc.cy, r: r(R + 5)},
      [`${N}-rim2`]: {cx: cc.cx, cy: cc.cy, r: r(R + 5)},
      [`${N}-content`]: {transform: `translate(${r(C.x)} ${r(C.y)}) scale(${r(k, 4)}) translate(${r(-S.x)} ${r(-S.y)})`},
    };
    if (!inset) {
      out[`${N}-handle`] = {transform: T(C.x + Math.cos(ha) * (R + 4), C.y + Math.sin(ha) * (R + 4), haDeg, clamp(R / 140, 0.6, 1.3))};
      out[`${N}-glass`] = cc;
    }
    return out;
  }
  /** Where a context point appears inside the open lens (for checks). */
  const map = (pt0, p) => {
    const q = clamp(p);
    const C = {x: lerp(S.x, Dd.x, q), y: lerp(S.y, Dd.y, q)};
    const k = lerp(S.r, Dd.r, q) / S.r;
    return {x: C.x + (pt0.x - S.x) * k, y: C.y + (pt0.y - S.y) * k};
  };
  return {node, frame, map, zoom: Dd.r / S.r, inset};
}

/* ------------------------------------------------------------------ */
/* Readable documents (content-sized)                                  */
/* ------------------------------------------------------------------ */

/**
 * A fitted text that never shrinks and never breaks a word: it wraps
 * (between words) as many lines as it needs at `size`.
 */
export const fullFit = (ctx, text, o) => fitWords(ctx, text, {maxLines: 40, ...o, minSize: o.size});

/**
 * The definitions section as a readable document, sized to its content: the
 * reference, the level (colour chip + supplied name), the heading, then one
 * row per entry. An entry row shows the quoted term and its supplied wording;
 * a row with neither is simulated filler (bars). Every supplied text is set at
 * `S` or larger and wraps between words; nothing is replaced by bars.
 * Named: `${P}-hl${i}`, `${P}-ring${i}` per row. Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, S:number, ref?:string, heading?:string, levelLabel?:string, levelColor?:{c:string,soft:string}, rows:Array<{term?:string|null, text?:string|null}>, minH?:number, termMaxWidth?:number, textMask?:any, barsHeader?:boolean, seedKey?:string}} o
 */
export function readablePage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w, S = o.S;
  const allOn = ctx.show('all');
  const keyOn = ctx.show('key');
  // o.tight (opt-in): margins sized to the text only (callout cards)
  const pad = o.tight ? S * 0.75 : Math.max(w * 0.07, S * 0.9);
  const inner = w - pad * 2;
  const seed = o.seedKey || 'def-rpage';
  const head = [];
  const bar = Math.max(5, S * 0.3);
  const bars = (x, y, ww, n, fill = th.paperLine) => Array.from({length: n}, (_, i) => h('rect', {x: r(x), y: r(y + i * bar * 2.6), width: r(ww * (i === n - 1 && n > 1 ? 0.55 : 0.95)), height: r(bar), rx: bar / 2, fill}));
  // the lens copy draws the header as bars (it lies outside the lens window)
  const txt = (f, oo) => (o.barsHeader
    ? g(null, f.lines.map((l, li) => h('rect', {x: r(oo.x), y: r(oo.y + li * f.lineHeight + f.size * 0.3), width: r(ctx.measure(l, f.size, f.weight, f.family)), height: r(f.size * 0.45), rx: 3, fill: th.paperLine})))
    : textBlock(f, oo));
  let y = pad * 0.8;
  // o.kicker: the part's own caption as the page's first line
  if (o.kicker && allOn) {
    const f = fullFit(ctx, o.kicker, {maxWidth: inner, size: S, weight: 800});
    head.push(txt(f, {x: pad, y, fill: shade(linkColor(ctx), -0.25), name: `${P}-kicker`}));
    y += f.height + S * 0.5;
  }
  const refS = S;
  if (o.compact && o.ref && o.levelLabel && allOn && o.levelColor) {
    // o.compact (opt-in): the reference and the level's name flow as one block (colour chip first)
    const chipW = S * 1.0;
    head.push(h('rect', {x: pad, y: y + S * 0.12, width: r(chipW), height: r(S * 0.8), rx: 3, fill: o.levelColor.c}));
    // (o.chipOnly: the level's name is shown elsewhere, e.g. in a hierarchy list of the same colours)
    const f = fullFit(ctx, o.chipOnly ? o.ref : `${o.ref} · ${o.levelLabel}`, {maxWidth: inner - chipW * 1.5, size: S, weight: 600});
    head.push(txt(f, {x: pad + chipW * 1.5, y, fill: th.inkSoft}));
    y += f.height + S * 0.45;
  } else if (o.ref && allOn) {
    const f = fullFit(ctx, o.ref, {maxWidth: inner, size: refS, weight: 600});
    head.push(txt(f, {x: pad, y, fill: th.inkSoft}));
    y += f.height + S * 0.45;
  } else { head.push(...bars(pad, y + refS * 0.3, inner * 0.55, 1)); y += refS * 1.45; }
  if (o.levelColor && !(o.compact && o.ref && o.levelLabel && allOn)) {
    const chipW = S * 1.0;
    head.push(h('rect', {x: pad, y: y + S * 0.12, width: r(chipW), height: r(S * 0.8), rx: 3, fill: o.levelColor.c}));
    if (o.levelLabel && allOn) {
      const f = fullFit(ctx, o.levelLabel, {maxWidth: inner - chipW * 1.5, size: S, weight: 600});
      head.push(txt(f, {x: pad + chipW * 1.5, y, fill: shade(o.levelColor.c, -0.4)}));
      y += f.height + S * 0.45;
    } else { head.push(h('rect', {x: pad + chipW * 1.5, y: y + S * 0.3, width: r(inner * 0.4), height: r(S * 0.45), rx: 3, fill: o.levelColor.soft})); y += S * 1.45; }
  }
  const hs = o.tight ? S * 1.06 : S * 1.2;
  if (o.heading && allOn) {
    const f = fullFit(ctx, o.heading, {maxWidth: inner, size: hs, weight: 700, family: 'serif'});
    head.push(txt(f, {x: pad, y, fill: th.ink}));
    y += f.height + S * 0.35;
  } else { head.push(h('rect', {x: pad, y: y + hs * 0.2, width: r(inner * 0.5), height: r(hs * 0.6), rx: 4, fill: th.ink, opacity: 0.75})); y += hs * 1.35; }
  head.push(h('line', {x1: pad, x2: w - pad, y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 1.6}));
  y += S * 0.7;
  const rowBoxes = [], termBoxes = [], entryBoxes = [];
  const hl = [], body = [];
  const M = o.textMask;
  const ts = S * 1.1;
  o.rows.forEach((row, i) => {
    const ry = y;
    let ty = ry + S * 0.25;
    const parts = [];
    let tb;
    if (row.term && keyOn) {
      const f = fullFit(ctx, `“${row.term}”`, {maxWidth: Math.min(inner, o.termMaxWidth ?? inner), size: ts, weight: 700, family: 'serif'});
      parts.push(M ? maskedBlock(ctx, f, {x: pad, y: ty, fill: INK, bar: INK}, M) : textBlock(f, {x: pad, y: ty, fill: INK}));
      tb = {x: pad, y: ty, w: f.width, h: f.height};
      ty += f.height + S * 0.3;
    } else {
      const bw = inner * (0.3 + ctx.rng(`${seed}-t`, i) * 0.14);
      parts.push(h('rect', {x: pad, y: r(ty + ts * 0.2), width: r(bw), height: r(ts * 0.6), rx: 4, fill: INK, opacity: row.term ? 0.9 : 0.55}));
      tb = {x: pad, y: ty + ts * 0.2, w: bw, h: ts * 0.6};
      ty += ts * 1.25;
    }
    let textW = 0;
    if (row.text && allOn) {
      const f = fullFit(ctx, row.text, {maxWidth: inner, size: S, weight: 400, family: 'serif'});
      parts.push(M ? maskedBlock(ctx, f, {x: pad, y: ty, fill: th.inkSoft, bar: th.paperLine}, M) : textBlock(f, {x: pad, y: ty, fill: th.inkSoft}));
      textW = f.width;
      ty += f.height;
    } else {
      // simulated filler lines (a row without supplied wording, or labels hidden)
      parts.push(...bars(pad, ty + bar * 0.4, inner, row.term || row.text ? 2 : 2));
      ty += bar * 2.6 * 2 - bar * 0.6;
    }
    const rowH = ty - ry + S * 0.55;
    const box = {x: pad - S * 0.35, y: ry - S * 0.1, w: inner + S * 0.7, h: rowH};
    rowBoxes.push(box);
    termBoxes.push(tb);
    entryBoxes.push({x: pad, y: tb.y, w: Math.max(tb.w, textW), h: ty - tb.y});
    hl.push(h('path', {name: `${P}-hl${i}`, d: roundRectPath(box.x, box.y, box.w, box.h, 6), fill: th.highlight, opacity: 0}));
    hl.push(h('path', {name: `${P}-ring${i}`, d: roundRectPath(box.x - 3, box.y - 3, box.w + 6, box.h + 6, 8), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 3.5, opacity: 0}));
    body.push(...parts);
    y += rowH + S * 0.3;
  });
  const needH = y + pad * 0.4;
  const H = Math.max(o.minH || 0, needH);
  const node = g({name: P}, h('rect', {x: 0, y: 0, width: w, height: r(H), fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}), head, hl, body);
  return {node, w, h: H, needH, rowBoxes, termBoxes, entryBoxes, pinPt: i => ({x: rowBoxes[i].x - 14, y: termBoxes[i].y + termBoxes[i].h / 2})};
}

/**
 * Rectangular detail inset (an editorial window, no handle): shows a REAL
 * enlarged copy of a source rectangle. The window morphs from the source rect
 * to the destination rect; the content is scaled about the source's top-left
 * so the detail keeps its source coordinates. The source is marked by a box.
 * @param {any} ctx
 * @param {{name:string, source:{x:number,y:number,w:number,h:number}, dest:{x:number,y:number,w:number,h:number}, content:any, bg:string, color?:string}} o
 */
export function rectLens(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const S = o.source, Dd = o.dest;
  const color = o.color ?? th.accent;
  const clipId = `${N}-clip`;
  const node = g({name: N},
    h('path', {name: `${N}-src`, d: roundRectPath(S.x, S.y, S.w, S.h, 8), fill: 'none', stroke: color, 'stroke-width': 3, opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${N}-clipr`, x: S.x, y: S.y, width: S.w, height: S.h, rx: 10}))),
    g({name: `${N}-win`, opacity: 0},
      h('rect', {name: `${N}-shadow`, x: S.x + 8, y: S.y + 12, width: S.w, height: S.h, rx: 12, fill: th.shadow}),
      h('rect', {name: `${N}-bg`, x: S.x, y: S.y, width: S.w, height: S.h, rx: 10, fill: o.bg}),
      g({'clip-path': ctx.ref(clipId)}, g({name: `${N}-content`}, o.content)),
      h('rect', {name: `${N}-rim`, x: S.x, y: S.y, width: S.w, height: S.h, rx: 12, fill: 'none', stroke: th.paper, 'stroke-width': 9}),
      h('rect', {name: `${N}-rim2`, x: S.x, y: S.y, width: S.w, height: S.h, rx: 12, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-dasharray': '14 8'}),
    ),
  );
  const at = p => {
    const q = clamp(p);
    return {x: lerp(S.x, Dd.x, q), y: lerp(S.y, Dd.y, q), w: lerp(S.w, Dd.w, q), h: lerp(S.h, Dd.h, q)};
  };
  /** @param {number} p open 0 (on the source) → 1 (at the destination) */
  function frame(p) {
    const q = clamp(p);
    const b = at(q);
    const k = b.w / S.w;
    const vis = q > 0.001;
    const rr = {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h)};
    return {
      [`${N}-src`]: {opacity: vis ? 1 : 0},
      [`${N}-win`]: {opacity: vis ? 1 : 0},
      [`${N}-clipr`]: rr,
      [`${N}-shadow`]: {x: r(b.x + 8), y: r(b.y + 12), width: r(b.w), height: r(b.h)},
      [`${N}-bg`]: rr,
      [`${N}-rim`]: {x: r(b.x - 4), y: r(b.y - 4), width: r(b.w + 8), height: r(b.h + 8)},
      [`${N}-rim2`]: {x: r(b.x - 4), y: r(b.y - 4), width: r(b.w + 8), height: r(b.h + 8)},
      [`${N}-content`]: {transform: `translate(${r(b.x)} ${r(b.y)}) scale(${r(k, 4)}) translate(${r(-S.x)} ${r(-S.y)})`},
    };
  }
  /** Where a context point appears inside the open window. */
  const map = (pt0, p) => {
    const b = at(p);
    const k = b.w / S.w;
    return {x: b.x + (pt0.x - S.x) * k, y: b.y + (pt0.y - S.y) * k};
  };
  return {node, frame, map, zoom: Dd.w / S.w, at};
}

/**
 * The article extract as a readable document, sized to its content: the
 * reference, the level (chip + supplied name), the heading, then the clause.
 * The term stands on its own line(s) — a slot — between the clause text that
 * precedes and follows it, so an alternative term (`altTerm`) can take its
 * place without moving any other word. Every supplied text is set at `S` or
 * larger and wraps between words. Named: `${P}-termtext`, `${P}-termtext2`,
 * `${P}-termhl`, `${P}-termhl2`, `${P}-termring`, `${P}-termring2`.
 * Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, S:number, ref?:string, heading?:string, levelLabel?:string, levelColor:{c:string,soft:string}, text:string, term:string, altTerm?:string, copy?:boolean, minH?:number}} o
 */
export function articleDoc(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w, S = o.S;
  const allOn = ctx.show('all') && !o.copy;
  const keyOn = ctx.show('key');
  const pad = Math.max(w * 0.07, S * 0.9);
  const inner = w - pad * 2;
  const fold = Math.min(w * 0.09, 48);
  const lc = o.levelColor;
  const head = [];
  const barsOf = (f, x, y) => f.lines.map((l, li) => h('rect', {x: r(x), y: r(y + li * f.lineHeight + f.size * 0.3), width: r(Math.min(inner, ctx.measure(l, f.size, f.weight, f.family))), height: r(f.size * 0.45), rx: 3, fill: th.paperLine}));
  const put = (f, x, y, fill) => (o.copy ? [] : allOn ? [textBlock(f, {x, y, fill})] : barsOf(f, x, y));
  let y = pad * 0.8;
  const chipW = S;
  if (o.compact && o.ref && o.levelLabel) {
    // o.compact (opt-in): the reference and the level's name flow as one block (colour chip first)
    head.push(h('rect', {x: pad, y: r(y + S * 0.12), width: r(chipW), height: r(S * 0.8), rx: 3, fill: lc.c}));
    const f = fullFit(ctx, o.chipOnly ? o.ref : `${o.ref} · ${o.levelLabel}`, {maxWidth: inner - fold * 0.6 - chipW * 1.5, size: S, weight: 600});
    head.push(...put(f, pad + chipW * 1.5, y, th.inkSoft));
    y += f.height + S * 0.45;
  } else if (o.ref) {
    const f = fullFit(ctx, o.ref, {maxWidth: inner - fold * 0.6, size: S, weight: 600});
    head.push(...put(f, pad, y, th.inkSoft));
    y += f.height + S * 0.45;
  }
  if (!(o.compact && o.ref && o.levelLabel)) head.push(h('rect', {x: pad, y: r(y + S * 0.12), width: r(chipW), height: r(S * 0.8), rx: 3, fill: lc.c}));
  if (o.compact && o.ref && o.levelLabel) { /* level shown in the first block */ } else if (o.levelLabel) {
    const f = fullFit(ctx, o.levelLabel, {maxWidth: inner - chipW * 1.5, size: S, weight: 600});
    head.push(...put(f, pad + chipW * 1.5, y, shade(lc.c, -0.4)));
    y += f.height + S * 0.45;
  } else y += S * 1.4;
  if (o.heading) {
    const f = fullFit(ctx, o.heading, {maxWidth: inner, size: S * 1.2, weight: 700, family: 'serif'});
    head.push(...put(f, pad, y, th.ink));
    y += f.height + S * 0.35;
  }
  head.push(h('line', {x1: pad, x2: w - pad, y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 2}));
  y += S * 0.7;
  // the clause, split around the term (first occurrence; appended when absent)
  const full = String(o.text || '').replace(/\s+/g, ' ').trim();
  const t = String(o.term || '').trim();
  const at = t ? full.toLowerCase().indexOf(t.toLowerCase()) : -1;
  const before = at >= 0 ? full.slice(0, at).trim() : full;
  const after = at >= 0 ? full.slice(at + t.length).trim() : '';
  const body = [], bodyAfter = [];
  if (before) {
    const f = fullFit(ctx, before, {maxWidth: inner, size: S, weight: 400, family: 'serif'});
    body.push(...put(f, pad, y, th.inkSoft));
    y += f.height + S * 0.45;
  }
  const ts = S * 1.1;
  const fT = fullFit(ctx, at >= 0 ? full.slice(at, at + t.length) : t, {maxWidth: inner - 20, size: ts, weight: 700, family: 'serif'});
  const fA = o.altTerm ? fullFit(ctx, o.altTerm, {maxWidth: inner - 20, size: ts, weight: 700, family: 'serif'}) : null;
  const slotTop = y + 4;
  const slotH = Math.max(fT.height, fA ? fA.height : 0);
  const tx = pad + 8;
  const boxOf = f => ({x: tx - 7, y: slotTop - 5, w: f.width + 14, h: f.height + 10});
  const termBox = boxOf(fT), termBox2 = fA ? boxOf(fA) : termBox;
  const termNode = (f, name, op) => (keyOn
    ? textBlock(f, {x: tx, y: slotTop, fill: INK, name, opacity: op})
    : g({name, opacity: op}, f.lines.map((l, li) => h('rect', {x: r(tx), y: r(slotTop + li * f.lineHeight + f.size * 0.22), width: r(ctx.measure(l, f.size, 700, 'serif')), height: r(f.size * 0.56), rx: 4, fill: INK}))));
  const marks = [
    h('path', {name: `${P}-termhl`, d: roundRectPath(termBox.x, termBox.y, termBox.w, termBox.h, 6), fill: th.highlight, opacity: 0.55}),
    fA ? h('path', {name: `${P}-termhl2`, d: roundRectPath(termBox2.x, termBox2.y, termBox2.w, termBox2.h, 6), fill: th.highlight, opacity: 0}) : null,
    h('path', {name: `${P}-termring`, d: roundRectPath(termBox.x - 4, termBox.y - 4, termBox.w + 8, termBox.h + 8, 9), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}),
    fA ? h('path', {name: `${P}-termring2`, d: roundRectPath(termBox2.x - 4, termBox2.y - 4, termBox2.w + 8, termBox2.h + 8, 9), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}) : null,
  ];
  const terms = [termNode(fT, `${P}-termtext`), fA ? termNode(fA, `${P}-termtext2`, 0) : null];
  y = slotTop + slotH + 5 + S * 0.55;
  if (after) {
    const f = fullFit(ctx, after, {maxWidth: inner, size: S, weight: 400, family: 'serif'});
    bodyAfter.push(...put(f, pad, y, th.inkSoft));
    y += f.height + S * 0.3;
  }
  const needH = y + pad * 0.8;
  const H = Math.max(o.minH || 0, needH);
  const tabY = S * 1.6, tabH = Math.min(H * 0.18, S * 2.6);
  const node = g({name: P},
    h('path', {d: roundRectPath(w - 14, tabY, S * 1.6 + 14, tabH, 8), fill: lc.c, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(6, 10, w, H, 6), fill: th.shadow}),
    h('path', {d: `M0 5Q0 0 5 0H${r(w - fold)}L${r(w)} ${r(fold)}V${r(H - 5)}Q${r(w)} ${r(H)} ${r(w - 5)} ${r(H)}H5Q0 ${r(H)} 0 ${r(H - 5)}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${r(w)}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    head, marks, body, terms, bodyAfter);
  const pinOf = b => ({x: b.x + b.w + 16, y: b.y + b.h / 2});
  return {node, w, h: H, needH, termBox, termBox2, pinPt: pinOf(termBox), pinPt2: pinOf(termBox2), slot: {x: tx - 7, y: slotTop - 5, w: Math.max(termBox.w, termBox2.w), h: slotH + 10}, tab: {x: w - 6, y: tabY, w: S * 1.6 + 6, h: tabH}};
}

/**
 * Index flags for the user-supplied hierarchy, stacked down the right edge of
 * a page (one per level, in the author's order, colour-coded), each carrying
 * the level's supplied name at `S` or larger. Local origin = the page's
 * top-right corner. Named: `${P}-flag${i}-ring`.
 */
export function levelFlags(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const S = o.S;
  const keyOn = ctx.show('key');
  const flags = [];
  let y = o.top ?? S;
  const boxes = [];
  o.levels.forEach((label, i) => {
    const lc = levelColor(ctx, i);
    const f = keyOn && label ? fullFit(ctx, label, {maxWidth: o.w - 34, size: S, weight: 700}) : null;
    const fh = f ? f.height + S * 0.9 : S * 1.8;
    const x0 = -10, x1 = o.w;
    flags.push(g(null,
      h('path', {d: roundRectPath(x0 + 5, y + 6, x1 - x0, fh, 10), fill: th.shadow}),
      h('path', {d: `M${r(x0)} ${r(y)}H${r(x1 - 12)}Q${r(x1)} ${r(y)} ${r(x1)} ${r(y + 12)}V${r(y + fh - 12)}Q${r(x1)} ${r(y + fh)} ${r(x1 - 12)} ${r(y + fh)}H${r(x0)}Z`, fill: lc.soft, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: 2, y: r(y), width: 10, height: r(fh), fill: lc.c}),
      h('path', {name: `${P}-flag${i}-ring`, d: roundRectPath(-4, y - 5, o.w + 9, fh + 10, 12), fill: 'none', stroke: linkColor(ctx), 'stroke-width': 4, opacity: 0}),
      f ? textBlock(f, {x: 20, y: y + S * 0.45, fill: INK}) : h('rect', {x: 20, y: r(y + fh / 2 - 5), width: r((o.w - 40) * 0.7), height: 10, rx: 4, fill: shade(lc.c, -0.2), opacity: 0.7}),
    ));
    boxes.push({x: -4, y, w: o.w + 4, h: fh});
    y += fh + S * 0.4;
  });
  return {node: g({name: P}, flags), boxes, h: y};
}

/**
 * A readable note card (another source): an optional status line, the
 * note's title, the proposed reading (italic) and its attribution, sized to
 * its content at `S`. Local origin = top-left. Named: `${P}-status`.
 */
export function noteDoc(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w, S = o.S;
  const allOn = ctx.show('all'), keyOn = ctx.show('key');
  // o.tight (opt-in): margins sized to the text only (callout cards)
  const pad = o.tight ? S * 0.75 : Math.max(w * 0.06, S * 0.9);
  const inner = w - pad * 2;
  const cardCol = '#f1e3c4';
  const parts = [];
  let y = pad * 0.8;
  if (o.status && keyOn) {
    const f = fullFit(ctx, o.status, {maxWidth: inner, size: S, weight: 800});
    parts.push(textBlock(f, {x: pad, y, fill: shade(linkColor(ctx), -0.2), name: `${P}-status`}));
    y += f.height + S * 0.5;
  }
  if (o.title && allOn) {
    const f = fullFit(ctx, o.title, {maxWidth: inner, size: S, weight: 700});
    parts.push(textBlock(f, {x: pad, y, fill: shade(th.accent2, -0.35)}));
    y += f.height + S * 0.35;
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: r(y), y2: r(y), stroke: shade(cardCol, -0.25), 'stroke-width': 1.6}));
  y += S * 0.5;
  if (o.reading && keyOn) {
    const f = fullFit(ctx, o.reading, {maxWidth: inner, size: S * 1.05, weight: 600, family: 'serif'});
    parts.push(textBlock(f, {x: pad, y, fill: INK, italic: true}));
    y += f.height + S * 0.45;
  }
  if (o.reading && !keyOn) {
    // labels hidden: the proposal's lines as placeholder bars (like the definition card beside it)
    const bar = Math.max(5, S * 0.3);
    for (let i = 0; i < 3; i++) parts.push(h('rect', {x: r(pad), y: r(y + S * 0.3 + i * bar * 2.6), width: r(inner * (i === 2 ? 0.55 : 0.92)), height: r(bar), rx: bar / 2, fill: shade(cardCol, -0.3)}));
    y += S * 0.3 + bar * 2.6 * 3;
  }
  if (o.source && allOn) {
    const f = fullFit(ctx, `— ${o.source}`, {maxWidth: inner, size: S, weight: 600});
    parts.push(textBlock(f, {x: w - pad, y, anchor: 'end', fill: th.inkSoft}));
    y += f.height;
  }
  const H = Math.max(o.minH || 0, y + pad * 0.8);
  const node = g({name: P},
    h('path', {d: roundRectPath(6, 9, w, H, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, H, 10), fill: cardCol, stroke: th.ink, 'stroke-width': 2.2}),
    parts);
  return {node, w, h: H};
}
