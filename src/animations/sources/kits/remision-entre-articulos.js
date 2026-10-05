/**
 * "Remisión entre artículos" kit (LAW-0149..0152): a cross-reference between
 * articles of one bound volume, followed by a page flag that hops from the
 * referring provision to the text it refers to.
 *
 * Spatial logic (top-down view of a reading desk, original vector art):
 *  - the BOOK is one open bound volume ("Text 1 (fictional)"). Its two pages
 *    are the two divisions of the EDITABLE HIERARCHY: each page carries an
 *    index tab with the user-supplied division label; the order is displayed
 *    only and states no rule, priority or outcome;
 *  - each ARTICLE is a printed block (heading + simulated wording bars). An
 *    article may print a cross-reference phrase (the "cue"), exactly as
 *    supplied, in a highlighted pill; the scene never reads or resolves it;
 *  - the MARKER is a sticky page flag lying in the outer margin of a page,
 *    its tip pointing at a cue or a heading. It hops along the SUPPLIED path
 *    only (a list of article indices): one hop = direct reference, several
 *    hops = chain of references. Hops leave a dashed trail with a small
 *    arrowhead (direction of the reference, not causation);
 *  - the LUPA (inspect) is a detail window that enlarges one cue.
 * States are descriptive: "marker on the referenced text (as supplied)". The
 * kit never states what a referenced article says or that it applies.
 *
 * The kit owns fields, defaults, strings, geometry, art and routes; each entry
 * owns its own timeline, composition and semantics.
 * @module animations/sources/kits/remision-entre-articulos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath, cubicPolyline, polyline, catmullRom} from '../../../core/geometry.js';
import {fitDesign} from '../../../core/layout.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {str, list, obj, int} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Fields (category "sources" + this motif)                            */
/* ------------------------------------------------------------------ */

/** Category field set (brief: sources, hierarchy, passages, interpretations). */
export const sourcesFields = {
  sources: list('The bound volume (fictional placeholder); its title is printed as the running head of the first page', obj('Source text (fictional placeholder)', {
    title: str('Title of the volume, e.g. "Text 1 (fictional)"', 60),
  }, ['title']), 1, 1),
  hierarchy: obj('Editable hierarchy: user-supplied divisions of the volume, drawn as the index tabs of its two pages (first page first). Displayed only; the order states no rule, priority or outcome', {
    levels: list('Division labels, one per page (user-supplied)', str('Division label', 48), 2, 2),
  }, ['levels']),
  passages: list('Articles printed in the volume (simulated wording). Each may print a cross-reference phrase exactly as supplied; the scene never reads, interprets or resolves it', obj('Article (fictional)', {
    ref: str('Reference printed as the article heading, e.g. "Text 1 · Art. 4 (fictional)"', 60),
    cue: str('Cross-reference phrase printed in the article, as supplied (empty = the article prints none)', 70),
    level: int('Division (page) that holds the article: 0 = first page, 1 = second page', 0, 1),
  }, ['ref', 'cue', 'level']), 2, 4),
  interpretations: list('Readings of the reference attributed to a fictional source; drawn as an attributed note, never applied or endorsed', obj('Attributed reading', {
    by: str('Fictional source of the reading', 40),
    text: str('The reading as proposed (descriptive)', 90),
  }, ['by', 'text']), 0, 1),
};

/** The supplied reference path (indices into passages). */
export const pathField = list('The supplied reference path: indices of the articles the marker visits, in order. Two entries = a direct reference, three or four = a chain of references. Nothing is inferred from the cue wording', int('Article index (0-based)', 0, 3), 2, 4);

/** Built-in strings of this kit (merged into ctx.t). */
export const RA_STRINGS = {
  en: {
    direct: 'Direct reference',
    chain: 'Chain of references',
    keyNote: 'Path as supplied · no conclusion drawn',
    marker: 'Reference marker',
    trail: 'Hop followed (as supplied)',
    referenced: 'Referenced text',
    reader: 'Reader',
    landed: 'Marker on the referenced text · as supplied',
    firstStop: 'Marker at the first referenced article · as supplied',
    attributed: 'attributed · not applied',
    hops: 'hops',
    hop: 'hop',
  },
  es: {
    direct: 'Remisión directa',
    chain: 'Cadena de remisiones',
    keyNote: 'Recorrido tal como se aportó · sin conclusión',
    marker: 'Marcador de remisión',
    trail: 'Salto seguido (según lo aportado)',
    referenced: 'Texto remitido',
    reader: 'Lectora',
    landed: 'Marcador en el texto remitido · según lo aportado',
    firstStop: 'Marcador en el primer artículo remitido · según lo aportado',
    attributed: 'atribuida · no aplicada',
    hops: 'saltos',
    hop: 'salto',
  },
};

/** Fictional, illustrative default content (English, direct reference). */
export const CONTENT_EN = {
  sources: [{title: 'Text 1 (fictional)'}],
  hierarchy: {levels: ['Part 1 (user-supplied)', 'Part 2 (user-supplied)']},
  passages: [
    {ref: 'Text 1 · Art. 4 (fictional)', cue: 'as set out in Art. 9', level: 0},
    {ref: 'Art. 6 (fictional)', cue: '', level: 0},
    {ref: 'Art. 9 (fictional)', cue: '', level: 1},
    {ref: 'Art. 12 (fictional)', cue: '', level: 1},
  ],
  interpretations: [],
  path: [0, 2],
};

/** Chain variant (English): Art. 9 itself prints an onward reference. */
export const CHAIN_EN = {
  passages: [
    {ref: 'Text 1 · Art. 4 (fictional)', cue: 'as set out in Art. 9', level: 0},
    {ref: 'Art. 6 (fictional)', cue: '', level: 0},
    {ref: 'Art. 9 (fictional)', cue: 'see Art. 12', level: 1},
    {ref: 'Art. 12 (fictional)', cue: '', level: 1},
  ],
  path: [0, 2, 3],
};

/** Spanish default content (fictional, same structure, direct reference). */
export const CONTENT_ES = {
  sources: [{title: 'Texto 1 (ficticio)'}],
  hierarchy: {levels: ['Parte 1 (aportada)', 'Parte 2 (aportada)']},
  passages: [
    {ref: 'Texto 1 · Art. 4 (ficticio)', cue: 'según lo previsto en el art. 9', level: 0},
    {ref: 'Art. 6 (ficticio)', cue: '', level: 0},
    {ref: 'Art. 9 (ficticio)', cue: '', level: 1},
    {ref: 'Art. 12 (ficticio)', cue: '', level: 1},
  ],
  interpretations: [],
  path: [0, 2],
};

/** Spanish chain variant. */
export const CHAIN_ES = {
  passages: [
    {ref: 'Texto 1 · Art. 4 (ficticio)', cue: 'según lo previsto en el art. 9', level: 0},
    {ref: 'Art. 6 (ficticio)', cue: '', level: 0},
    {ref: 'Art. 9 (ficticio)', cue: 'véase el art. 12', level: 1},
    {ref: 'Art. 12 (ficticio)', cue: '', level: 1},
  ],
  path: [0, 2, 3],
};

/** Long-label stress content (fictional; every field at least as long as the baseline). */
export const CONTENT_LONG = {
  sources: [{title: 'Text 1: Consolidated Register Rules, annotated (fictional)'}],
  hierarchy: {levels: ['Part 1 — general provisions (user-supplied)', 'Part 2 — annexed provisions (user-supplied)']},
  passages: [
    {ref: 'Text 1 · Article 4, paragraph 2 (fictional wording)', cue: 'as set out in Article 9, paragraph 1, of this text', level: 0},
    {ref: 'Article 6, paragraphs 1 to 3 (fictional wording)', cue: '', level: 0},
    {ref: 'Article 9, paragraph 1 (fictional wording)', cue: 'see also Article 12, paragraph 3, of this text', level: 1},
    {ref: 'Article 12, paragraph 3 (fictional wording)', cue: '', level: 1},
  ],
  interpretations: [{by: 'Commentary 1 (fictional, second edition)', text: 'Reads the phrase in Article 4 as pointing to Article 9 of the same volume'}],
  path: [0, 2, 3],
};

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

/**
 * Sanitize the supplied path: indices must exist and consecutive entries must
 * differ. Falls back to [0, 1] when fewer than two stops remain.
 * @param {number[]} path
 * @param {number} n number of passages
 */
export function cleanPath(path, n) {
  const out = [];
  for (const i of path || []) {
    if (Number.isInteger(i) && i >= 0 && i < n && out[out.length - 1] !== i) out.push(i);
  }
  return out.length >= 2 ? out : [0, Math.min(1, n - 1)];
}

/** "direct" for one hop, "chain" for several (a description of the supplied path). */
export const pathKind = path => (path.length > 2 ? 'chain' : 'direct');

/** Design-unit size for a target rendered size in px at 1080p. */
export function pxScale(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  const k = 1080 / Math.min(ctx.view.width, ctx.view.height);
  return f.scale * k;
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** True when a fitted text had to break a word across lines. */
export function brokeWord(fit) {
  const full = String(fit.full).replace(/\s+/g, ' ').trim();
  const joined = fit.lines.join(' ').replace(/…$/, '');
  return fit.truncated ? !full.startsWith(joined) : joined !== full;
}

/**
 * ctx.fit that shrinks (down to minSize) rather than break a word, and
 * balances multi-line results so no word is left orphaned.
 */
export function fitWords(ctx, text, o) {
  let f = ctx.fit(text, o);
  if (brokeWord(f) || f.truncated) {
    const min = o.minSize ?? o.size * 0.72;
    const step = Math.max(0.5, o.size * 0.04);
    for (let s = o.size - step; s >= min - 1e-6; s -= step) {
      const c = ctx.fit(text, {...o, size: s, minSize: Math.min(s, min)});
      if (!brokeWord(c) && !c.truncated) {
        f = c;
        break;
      }
    }
  }
  if (f.truncated || f.lines.length < 2 || brokeWord(f)) return f;
  const n = f.lines.length;
  let lo = f.width / n, hi = f.width, best = f;
  for (let i = 0; i < 12 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    const c = ctx.fit(text, {...o, size: f.size, minSize: f.size, maxWidth: mid, maxLines: n});
    if (!c.truncated && c.lines.length === n && !brokeWord(c)) {
      best = c;
      hi = mid;
    } else lo = mid;
  }
  return best;
}

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

/** Colour of a hierarchy division (tab); neutral hues, no verdict. */
export function levelColor(ctx, i) {
  const th = ctx.theme;
  return [th.accent4, th.cloth[3]][i % 2];
}
/** Page flag colour and its darker ink (trail, outlines). */
export const flagColor = ctx => ctx.theme.accent3;
export const flagInk = ctx => shade(ctx.theme.accent3, -0.42);
/** Ring around the referenced text. */
export const ringColor = ctx => ctx.theme.accent2;

const COVER = '#2f4a6b';
const PILL = '#fbe7a6';

/* ------------------------------------------------------------------ */
/* Article block                                                       */
/* ------------------------------------------------------------------ */

/**
 * Printed article block. Local = stage coordinates.
 * @param {any} ctx
 * @param {{prefix:string, i:number, ref:string, cue:string, x:number, y:number, w:number, px:any, side:'left'|'right', seedKey:string, showText:boolean, cueSlot?:boolean}} o
 *   cueSlot: reserve a cue row even without a cue (contrast: the slot where the onward reference is introduced)
 */
export function articleBlock(ctx, o) {
  const th = ctx.theme;
  const {x, w, px} = o;
  const compact = o.compact || 0;
  let y = o.y;
  const parts = [];
  const text = [];
  const rng = k => ctx.rng(`${o.seedKey}-a${o.i}`, k);
  let minText = Infinity;
  // heading
  let headH;
  if (o.showText) {
    const f = fitWords(ctx, o.ref, {maxWidth: w, size: px.head, minSize: Math.min(px.head, px.min), maxLines: 3, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x, y, fill: th.ink, name: `${o.prefix}-head${o.i}`}));
    headH = f.height;
    minText = Math.min(minText, f.size);
    text.push({x, y, w: f.width, h: f.height});
  } else {
    headH = px.head * 0.8;
    parts.push(h('rect', {x, y: r(y + px.head * 0.1), width: r(Math.min(w, 90 + o.ref.length * px.head * 0.32)), height: r(px.head * 0.62), rx: 5, fill: th.ink, opacity: 0.78}));
  }
  const headRow = {y, h: headH, cy: y + Math.min(headH, px.head * 1.18) / 2};
  y += headH + px.head * (compact >= 2 ? 0.36 : 0.5);
  const bar = (bx, by, bw) => h('rect', {x: r(bx), y: r(by), width: r(Math.max(10, bw)), height: 9, rx: 4.5, fill: th.paperLine});
  if (compact < 1) {
    parts.push(bar(x, y, w * (0.86 + 0.12 * rng(0))));
    y += 22;
  }
  let cueRow = null;
  let pill = null;
  if (o.cue || o.cueSlot) {
    let f = null;
    let pw, ph;
    if (o.cue && o.showText) {
      f = fitWords(ctx, o.cue, {maxWidth: w - 26, size: px.cue, minSize: Math.min(px.cue, px.min), maxLines: 3, weight: 600});
      minText = Math.min(minText, f.size);
      pw = f.width + 26;
      ph = f.height + 14;
    } else {
      pw = Math.min(w, o.cue ? 60 + o.cue.length * px.cue * 0.34 : w * 0.56);
      ph = px.cue + 14;
    }
    const pxl = o.side === 'right' ? x + w - pw : x;
    pill = {x: pxl, y, w: pw, h: ph, fit: f};
    const rest = w - pw - 14;
    if (rest >= 50) parts.push(bar(o.side === 'right' ? x : x + pw + 14, y + ph / 2 - 4.5, rest * (0.7 + 0.3 * rng(1))));
    cueRow = {y, h: ph, cy: y + ph / 2};
    y += ph + (compact >= 2 ? 8 : 12);
  } else {
    parts.push(bar(x, y, w * (0.7 + 0.2 * rng(2))));
    y += 22;
  }
  for (let e = 0; e < (o.extraBars || 0); e++) {
    parts.push(bar(x, y, w * (0.8 + 0.18 * rng(10 + e))));
    y += 22;
  }
  if (compact < 2) {
    parts.push(bar(x, y, w * (0.42 + 0.3 * rng(3))));
    y += 9;
  } else y -= 8;
  const box = {x: x - 12, y: o.y - 10, w: w + 24, h: y - o.y + 20};
  return {parts, pill, h: y - o.y, box, headRow, cueRow, text, minText};
}

/**
 * Cue pill (printed cross-reference phrase). Drawn as its own named node so
 * entries can fade / substitute it.
 */
export function cuePill(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: ph, fit} = o.pill;
  return g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, y, w, ph, Math.min(12, ph / 2)), fill: o.fill ?? PILL, stroke: o.stroke ?? shade(PILL, -0.35), 'stroke-width': 1.6}),
    fit ? textBlock(fit, {x: x + w / 2, y: y + 7, anchor: 'middle', fill: th.ink, name: o.textName})
      : h('rect', {x: x + 12, y: y + ph / 2 - 5, width: Math.max(10, w - 24), height: 10, rx: 5, fill: shade(PILL, -0.45)}));
}

/* ------------------------------------------------------------------ */
/* The bound volume                                                    */
/* ------------------------------------------------------------------ */

/**
 * Open bound volume seen from above. 'h': two pages side by side (spine
 * vertical), index tabs hanging from the pages' bottom edges and a clear lane
 * above the pages (hops between the pages travel along it, never over text);
 * 'v': two pages stacked (spine horizontal, the book turned a quarter), tabs on
 * the outer (top / bottom) edges. Page p holds the articles whose level is p
 * and carries the index tab of hierarchy level p. Flags live in the OUTER
 * margin of each page: side 'left' for the left page in 'h', else 'right'.
 * Long content is fitted by dropping decorative bars, then shrinking text in
 * bounded steps (never below px.min), never by cutting supplied text.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, orient:'h'|'v', articles:Array<{i:number, ref:string, cue:string, level:number}>,
 *   levels:string[], title:string, px:{head:number, cue:number, tab:number, run:number, min:number}, seedKey?:string, cueSlots?:number[], pillNodes?:boolean, outerPad?:number, noTitle?:boolean, tabText?:boolean, grow?:number, maxExtraBars?:number}} o
 *   tabText: false = tabs show level pips only (the entry prints the division labels once elsewhere)
 *   noTitle: no running head (the entry prints the volume title once elsewhere)
 *   pillNodes: cue pills are NOT drawn in the static art (the entry draws them as named nodes from `pills`)
 */
export function volumeArt(ctx, o) {
  const ks = [];
  for (let k = o.grow ?? 1; k > 1.001; k -= 0.05) ks.push(k);
  ks.push(1, 0.95, 0.9, 0.85, 0.8, 0.76, 0.72);
  let best = null;
  for (const k of ks) {
    for (const compact of [0, 1, 2]) {
      const px = {...o.px, head: Math.max(o.px.min, o.px.head * k), cue: Math.max(o.px.min, o.px.cue * k), run: Math.max(o.px.min, o.px.run * Math.min(k, 1.15)), tab: Math.max(o.px.min, o.px.tab * Math.min(Math.max(k, 0.9), 1.15))};
      const v = volumeOnce(ctx, {...o, px}, compact, 0);
      best = v;
      if (!v.overflow) {
        // fill the pages with simulated wording (decorative bars) where room is left
        for (let extra = o.maxExtraBars ?? 3; extra > 0; extra--) {
          const f = volumeOnce(ctx, {...o, px}, compact, extra);
          if (!f.overflow && f.fill <= 0.94) return f;
        }
        return v;
      }
    }
  }
  return best;
}

function volumeOnce(ctx, o, compact, extraBars) {
  const th = ctx.theme;
  const P = o.prefix;
  const showText = ctx.show('key');
  const tabText = showText && o.tabText !== false;
  const seedKey = o.seedKey || P;
  const {x, y, w, h: H, px} = o;
  // tab labels may take two lines; every tab gets the height of the tallest
  const tabFits = [0, 1].map(p => (tabText ? fitWords(ctx, o.levels[p] || '', {maxWidth: (o.orient === 'h' ? (w - 24) / 2 : w - 24) - 110, size: px.tab, minSize: Math.min(px.tab, px.min), maxLines: 2, weight: 700}) : null));
  const tabH = tabText ? Math.round(Math.max(...tabFits.map(f => f.height)) + px.tab * 0.95) : (showText ? 30 : 34);
  const m = 12;
  const lane = o.orient === 'h' ? 40 : 0;
  let pages, cover;
  if (o.orient === 'h') {
    cover = {x, y, w, h: H - tabH + 14};
    const top = y + lane, bot = y + H - tabH;
    const pw = (w - 2 * m) / 2;
    pages = [
      {x: x + m, y: top, w: pw, h: bot - top, side: 'left', gutter: 'right'},
      {x: x + m + pw, y: top, w: pw, h: bot - top, side: 'right', gutter: 'left'},
    ];
  } else {
    cover = {x, y: y + tabH - 14, w, h: H - 2 * tabH + 28};
    const top = y + tabH, bot = y + H - tabH;
    // page heights follow their content (the page with more articles gets more room)
    const colW = w - 2 * m - (o.outerPad ?? 78) - 34;
    const need = [0, 1].map(pp => {
      const arts = o.articles.filter(a => a.level === pp);
      let hh = arts.reduce((s0, a) => s0 + articleBlock(ctx, {prefix: 'probe', i: a.i, ref: a.ref, cue: a.cue, x: 0, y: 0, w: colW, px, side: 'right', seedKey: 'probe', showText, compact, extraBars: 0, cueSlot: (o.cueSlots || []).includes(a.i)}).h + 30, 0) + 30;
      if (pp === 0 && !o.noTitle) hh += px.run * 1.3 * (showText ? Math.ceil(ctx.measure(o.title, px.run, 600, 'serif') / colW + 0.05) : 1) + 30;
      return hh;
    });
    const split = clamp(need[0] / (need[0] + need[1]), 0.3, 0.7);
    const ph0 = (bot - top) * split;
    pages = [
      {x: x + m, y: top, w: w - 2 * m, h: ph0, side: 'right', gutter: 'bottom'},
      {x: x + m, y: top + ph0, w: w - 2 * m, h: bot - top - ph0, side: 'right', gutter: 'top'},
    ];
  }
  const outerPad = o.outerPad ?? 78;
  const innerPad = 34;
  const parts = [];
  const tabParts = [];
  parts.push(h('path', {d: roundRectPath(cover.x + 8, cover.y + 12, cover.w, cover.h, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(cover.x, cover.y, cover.w, cover.h, 16), fill: COVER, stroke: th.ink, 'stroke-width': 2.6}));
  const tabs = [];
  pages.forEach((pg, p) => {
    const col = levelColor(ctx, p);
    const tf = tabFits[p];
    const tw = tf ? tf.width + 40 : 120;
    // down = the tab hangs below the page's bottom edge
    const down = o.orient === 'h' || p === 1;
    const tx = o.orient === 'h' && p === 1 ? pg.x + pg.w - 26 - tw : pg.x + 26;
    const ty = down ? pg.y + pg.h - 6 : pg.y - tabH + 6;
    const d = down
      ? `M${r(tx)} ${r(ty)}V${r(ty + tabH - 8)}Q${r(tx)} ${r(ty + tabH)} ${r(tx + 8)} ${r(ty + tabH)}H${r(tx + tw - 8)}Q${r(tx + tw)} ${r(ty + tabH)} ${r(tx + tw)} ${r(ty + tabH - 8)}V${r(ty)}Z`
      : `M${r(tx)} ${r(ty + tabH)}V${r(ty + 8)}Q${r(tx)} ${r(ty)} ${r(tx + 8)} ${r(ty)}H${r(tx + tw - 8)}Q${r(tx + tw)} ${r(ty)} ${r(tx + tw)} ${r(ty + 8)}V${r(ty + tabH)}Z`;
    const tabNode = [h('path', {d, fill: col, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'})];
    const inner = down ? {y: ty + 6, h: tabH - 6} : {y: ty, h: tabH - 6};
    const textY = inner.y + (inner.h - (tf ? tf.height : 0)) / 2;
    if (tf) tabNode.push(textBlock(tf, {x: tx + tw / 2, y: textY, anchor: 'middle', fill: '#ffffff', name: `${P}-tabtext${p}`}));
    else tabNode.push(...Array.from({length: p + 1}, (_, k) => h('circle', {cx: r(tx + tw / 2 + (k - p / 2) * 18), cy: r(inner.y + inner.h / 2), r: 5, fill: '#ffffff'})));
    tabParts.push(g({name: `${P}-tab${p}`}, tabNode));
    tabs.push({box: {x: tx, y: down ? ty + 6 : ty, w: tw, h: tabH - 6}, color: col, down, text: tf ? {x: tx + tw / 2 - tf.width / 2, y: textY, w: tf.width, h: tf.height} : null});
  });
  // page stack edges (thickness) on the outer sides
  pages.forEach(pg => {
    for (let k = 3; k >= 1; k--) {
      const dx = o.orient === 'h' ? (pg.side === 'left' ? -k * 3 : k * 3) : k * 2.5;
      const dy = o.orient === 'v' ? (pg.gutter === 'bottom' ? -k * 3 : k * 3) : k * 2;
      parts.push(h('path', {d: roundRectPath(pg.x + dx, pg.y + dy, pg.w, pg.h, 6), fill: shade(th.paper, -0.05 * k), stroke: th.ink, 'stroke-width': 1.2}));
    }
  });
  const stackEnd = parts.length;
  pages.forEach(pg => parts.push(h('path', {d: roundRectPath(pg.x, pg.y, pg.w, pg.h, 6), fill: th.paper, stroke: th.ink, 'stroke-width': 2})));
  if (o.orient === 'h') {
    const gx = pages[1].x;
    parts.push(h('rect', {x: r(gx - 26), y: r(pages[0].y + 2), width: 26, height: r(pages[0].h - 4), fill: '#000', opacity: 0.05}));
    parts.push(h('rect', {x: r(gx), y: r(pages[0].y + 2), width: 18, height: r(pages[0].h - 4), fill: '#000', opacity: 0.04}));
    parts.push(h('path', {d: `M${r(gx)} ${r(pages[0].y)}V${r(pages[0].y + pages[0].h)}`, stroke: th.ink, 'stroke-width': 1.8}));
  } else {
    const gy = pages[1].y;
    parts.push(h('rect', {x: r(pages[0].x + 2), y: r(gy - 22), width: r(pages[0].w - 4), height: 22, fill: '#000', opacity: 0.05}));
    parts.push(h('rect', {x: r(pages[0].x + 2), y: r(gy), width: r(pages[0].w - 4), height: 16, fill: '#000', opacity: 0.04}));
    parts.push(h('path', {d: `M${r(pages[0].x)} ${r(gy)}H${r(pages[0].x + pages[0].w)}`, stroke: th.ink, 'stroke-width': 1.8}));
  }
  const text = [];
  const colOf = pg => ({x: pg.side === 'left' ? pg.x + outerPad : pg.x + innerPad, w: pg.w - outerPad - innerPad});
  // running head (volume title) on the first page
  let runH = -8;
  let runSize = Infinity;
  if (!o.noTitle) {
    const pg0 = pages[0];
    const c = colOf(pg0);
    const ry = pg0.y + (compact >= 2 ? 12 : 16);
    if (showText) {
      const f = fitWords(ctx, o.title, {maxWidth: c.w, size: px.run, minSize: Math.min(px.run, px.min), maxLines: 3, weight: 600, family: 'serif'});
      runSize = f.size;
      parts.push(textBlock(f, {x: c.x, y: ry, fill: th.inkSoft, italic: true, name: `${P}-title`}));
      runH = ry - pg0.y + f.height;
      text.push({x: c.x, y: ry, w: f.width, h: f.height});
    } else {
      parts.push(h('rect', {x: r(c.x), y: r(ry + 2), width: r(c.w * 0.5), height: 12, rx: 6, fill: th.inkSoft, opacity: 0.5}));
      runH = ry - pg0.y + 16;
    }
    parts.push(h('path', {d: `M${r(c.x)} ${r(pg0.y + runH + 7)}H${r(c.x + c.w)}`, stroke: th.paperLine, 'stroke-width': 1.6}));
    runH += 7;
  }
  const blocks = {};
  const pills = [];
  let overflow = false;
  let fill = 0;
  let minText = Math.min(...tabFits.filter(Boolean).map(f => f.size), runSize);
  pages.forEach((pg, p) => {
    const arts = o.articles.filter(a => a.level === p);
    const c = colOf(pg);
    const top = pg.y + (p === 0 ? runH + 14 : 16);
    const bottom = pg.y + pg.h - 12;
    const area = bottom - top;
    const build = (k, yy) => articleBlock(ctx, {prefix: P, i: arts[k].i, ref: arts[k].ref, cue: arts[k].cue, x: c.x, y: yy, w: c.w, px, side: pg.side, seedKey, showText, compact, extraBars, cueSlot: (o.cueSlots || []).includes(arts[k].i)});
    const probe = arts.map((a, k) => build(k, 0));
    const total = probe.reduce((s, b) => s + b.h, 0);
    const minGap = compact >= 2 ? 14 : 30;
    if (total + minGap * arts.length > area + 0.5) overflow = true;
    fill = Math.max(fill, (total + minGap * arts.length) / Math.max(1, area));
    const gap = arts.length ? clamp((area - total) / arts.length, minGap, 70) : 0;
    let yy = top + gap * 0.45;
    arts.forEach((a, k) => {
      const b = build(k, yy);
      parts.push(...b.parts);
      if (b.pill && a.cue && !o.pillNodes) parts.push(cuePill(ctx, {pill: b.pill}));
      if (b.pill) pills.push({i: a.i, pill: b.pill});
      text.push(...b.text);
      minText = Math.min(minText, b.minText);
      if (b.pill && b.pill.fit) text.push({x: b.pill.x + 13, y: b.pill.y + 7, w: b.pill.fit.width, h: b.pill.fit.height});
      const tipX = pg.side === 'right' ? b.box.x + b.box.w + 6 : b.box.x - 6;
      const gripX = pg.side === 'right' ? tipX + FLAG.L / 2 : tipX - FLAG.L / 2;
      blocks[a.i] = {
        ...b, page: p, side: pg.side,
        headSpot: {x: gripX, y: b.headRow.cy, side: pg.side},
        cueSpot: b.cueRow ? {x: gripX, y: b.cueRow.cy, side: pg.side} : null,
      };
      yy += b.h + gap;
    });
  });
  const node = g({name: `${P}`}, parts.slice(0, stackEnd), g({name: `${P}-tabs`}, tabParts), parts.slice(stackEnd));
  const pagesTop = pages[0].y;
  return {node, pages, blocks, tabs, pills, text, cover, bbox: {x, y, w, h: H}, lane: o.orient === 'h' ? y + lane / 2 + 2 : null, pagesTop, overflow, fill, px, compact, minText};
}

/* ------------------------------------------------------------------ */
/* Marks on the book: rings and cue highlights                         */
/* ------------------------------------------------------------------ */

/** Ring drawn around an article block (draw-on). */
export function ringArt(ctx, {name, box, color, width = 4}) {
  const per = 2 * (box.w + box.h);
  return {
    node: h('path', {name, d: roundRectPath(box.x, box.y, box.w, box.h, 14), fill: 'none', stroke: color, 'stroke-width': width, 'stroke-dasharray': `${r(per)} ${r(per + 20)}`, 'stroke-dashoffset': r(per), opacity: 0}),
    frame: p => ({[name]: {'stroke-dashoffset': r(per * (1 - clamp(p))), opacity: p > 0 ? 1 : 0}}),
  };
}

/** Outline that marks a cue as being read. */
export function cueOutline(ctx, {name, pill, color}) {
  return h('path', {name, d: roundRectPath(pill.x - 5, pill.y - 5, pill.w + 10, pill.h + 10, Math.min(16, pill.h / 2 + 5)), fill: 'none', stroke: color, 'stroke-width': 3.5, opacity: 0});
}

/* ------------------------------------------------------------------ */
/* Page flag (the marker)                                              */
/* ------------------------------------------------------------------ */

export const FLAG = {L: 104, H: 40, tip: 24};

/**
 * Sticky page flag. Local origin = grip (centre of the body); at sx = 1 the
 * tip points to −x (a flag in a right-hand margin), at sx = −1 to +x.
 * Returns the flag node and its shadow node (posed separately).
 */
export function flagArt(ctx, {name, color, ink}) {
  const th = ctx.theme;
  const c = color || flagColor(ctx);
  const {L, H: FH, tip} = FLAG;
  const x0 = -L / 2, x1 = L / 2;
  const shape = `M${x0} 0L${x0 + tip} ${-FH / 2}H${x1 - 7}Q${x1} ${-FH / 2} ${x1} ${-FH / 2 + 7}V${FH / 2 - 7}Q${x1} ${FH / 2} ${x1 - 7} ${FH / 2}H${x0 + tip}Z`;
  const shadow = h('path', {name: `${name}-sh`, d: shape, fill: th.dark ? 'rgba(0,0,0,0.45)' : 'rgba(31,35,40,0.2)'});
  const flag = g({name},
    h('path', {d: shape, fill: c, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    // clear adhesive end + sheen
    h('path', {d: `M${x1 - 30} ${-FH / 2 + 1.5}H${x1 - 7}Q${x1 - 1.5} ${-FH / 2 + 1.5} ${x1 - 1.5} ${-FH / 2 + 7}V${FH / 2 - 7}Q${x1 - 1.5} ${FH / 2 - 1.5} ${x1 - 7} ${FH / 2 - 1.5}H${x1 - 30}Z`, fill: '#ffffff', opacity: 0.42}),
    h('path', {d: `M${x0 + tip + 6} ${-FH / 2 + 8}H${x1 - 38}`, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.55}),
    h('path', {d: `M${x0 + tip + 10} ${FH / 2 - 9}H${x1 - 44}`, stroke: ink || shade(c, -0.3), 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5}),
  );
  return {flag, shadow};
}

/**
 * Pose the flag. lift in [0,1] raises it (larger, shadow offset).
 * @param {string} name
 * @param {{x:number,y:number,sx?:number,rot?:number,lift?:number,opacity?:number,scale?:number}} s  scale: base size (1 = page flag; the mechanism's tracer uses a smaller one)
 */
export function flagPose(name, s) {
  const k = (s.scale ?? 1) * (1 + 0.22 * (s.lift || 0));
  const sx = (s.sx ?? 1) * k;
  const off = {x: 5 + 26 * (s.lift || 0), y: 7 + 30 * (s.lift || 0)};
  const op = s.opacity ?? 1;
  return {
    [name]: {transform: T(s.x, s.y, s.rot || 0, sx, k), opacity: r(op, 3)},
    [`${name}-sh`]: {transform: T(s.x + off.x, s.y + off.y, s.rot || 0, sx, k), opacity: r(op * (1 - 0.35 * (s.lift || 0)), 3)},
  };
}

/** Axis-aligned box of a flag stuck at a spot (for clearance checks). */
export function flagBox(spot) {
  return {x: spot.x - FLAG.L / 2, y: spot.y - FLAG.H / 2, w: FLAG.L, h: FLAG.H};
}

/* ------------------------------------------------------------------ */
/* Hop routes and trails                                               */
/* ------------------------------------------------------------------ */

/**
 * Route of the flag's grip between two spots. Same margin column: an arc
 * bulging outward (off the page text). Different sides ('h' spread): up the
 * outer margin, along the clear lane above the pages, and down the other
 * outer margin — so the flag and its trail never pass over printed text.
 * @param {{x:number,y:number,side:'left'|'right'}} A
 * @param {{x:number,y:number,side:'left'|'right'}} B
 * @param {{lane?:number|null, bulge?:number}} o lane: y of the clear lane above the pages ('h')
 */
export function hopRoute(A, B, o) {
  const out = s => (s === 'right' ? 1 : -1);
  if (A.side === B.side || o.lane == null) {
    // same margin column: the trail runs down a lane just outside the flags' tails, so it stays
    // long and visible even for a short hop, and never crosses the page text
    const dir = out(A.side);
    const dy = B.y - A.y;
    const sg = Math.sign(dy) || 1;
    const edge = dir > 0 ? Math.max(A.x, B.x) : Math.min(A.x, B.x);
    const laneX = edge + dir * (FLAG.L / 2 + (o.laneGap ?? 26));
    const k = Math.min(26, Math.abs(dy) * 0.18);
    const pts = [A, {x: A.x + dir * FLAG.L * 0.42, y: A.y + sg * 4}, {x: laneX, y: A.y + sg * k}, {x: laneX, y: B.y - sg * k}, {x: B.x + dir * FLAG.L * 0.42, y: B.y - sg * 4}, B];
    return polyline(catmullRom(pts, 14));
  }
  const L = o.lane;
  const sg = Math.sign(B.x - A.x) || 1;
  const pts = [
    A,
    {x: A.x + out(A.side) * 6, y: A.y + (L - A.y) * 0.55},
    {x: A.x + sg * 70, y: L},
    {x: (A.x + B.x) / 2, y: L - 6},
    {x: B.x - sg * 70, y: L},
    {x: B.x + out(B.side) * 6, y: B.y + (L - B.y) * 0.55},
    B,
  ];
  return polyline(catmullRom(pts, 16));
}

/** Sub-polyline between arc-length fractions. */
function subPoly(poly, t0, t1, n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(poly.at(t0 + (t1 - t0) * (i / n)));
  return polyline(pts.map(p => ({x: p.x, y: p.y})));
}

/**
 * Dashed trail along a hop route, trimmed where it leaves the flag at the
 * start and where it meets the flag at the end, with an arrowhead at the end
 * (the direction of the supplied reference — not causation).
 */
export function trailArt(ctx, {name, route, from, to, color, bold = false}) {
  const c = color || flagInk(ctx);
  const inFlag = (p, s) => Math.abs(p.x - s.x) <= FLAG.L / 2 + 8 && Math.abs(p.y - s.y) <= FLAG.H / 2 + 8;
  let t0 = 0, t1 = 1;
  for (let i = 0; i <= 200; i++) { const t = i / 200; if (!inFlag(route.at(t), from)) { t0 = t; break; } }
  for (let i = 200; i >= 0; i--) { const t = i / 200; if (!inFlag(route.at(t), to)) { t1 = t; break; } }
  if (t1 - t0 < 0.1) { t0 = 0.2; t1 = 0.8; }
  const poly = subPoly(route, t0, t1);
  const total = poly.total;
  const d = poly.d(1);
  const end = poly.at(1);
  const head = bold ? 19 : 15;
  const xs = poly.pts.map(p => p.x), ys = poly.pts.map(p => p.y);
  const pad = 30;
  const mx = Math.min(...xs) - pad, my = Math.min(...ys) - pad;
  const node = g({name, opacity: 0},
    h('defs', null, h('mask', {id: ctx.id(`${name}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...xs) - mx + pad), height: r(Math.max(...ys) - my + pad)},
      h('path', {name: `${name}-masker`, d, fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}))),
    h('path', {d, fill: 'none', stroke: ctx.theme.paper, 'stroke-width': bold ? 11 : 8, 'stroke-linecap': 'round', opacity: 0.55, mask: ctx.ref(`${name}-mask`)}),
    h('path', {d, fill: 'none', stroke: c, 'stroke-width': bold ? 7 : 5, 'stroke-linecap': 'round', 'stroke-dasharray': bold ? '15 8' : '13 9', mask: ctx.ref(`${name}-mask`)}),
    h('path', {name: `${name}-head`, d: `M0 0L${-head} ${r(-head * 0.6)}L${r(-head * 0.72)} 0L${-head} ${r(head * 0.6)}Z`, fill: c, stroke: c, 'stroke-width': 1.5, 'stroke-linejoin': 'round', transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0}),
  );
  const frame = p => ({
    [name]: {opacity: p > 0 ? 1 : 0},
    [`${name}-masker`]: {'stroke-dashoffset': r(total * (1 - clamp(p)))},
    [`${name}-head`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame, poly, total, t0, t1, apex: poly.at(0.5), bounds: {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}};
}

/** Small numbered hop badge (number hidden with labels off). */
export function hopBadge(ctx, {name, x, y, n, size = 20, color}) {
  const c = color || flagInk(ctx);
  const R = size * 0.8;
  return g({name, opacity: 0, transform: T(x, y)},
    h('circle', {r: r(R), fill: ctx.theme.card, stroke: c, 'stroke-width': 3}),
    ctx.show('all') ? h('text', {x: 0, y: r(size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: c}, String(n))
      : h('circle', {r: r(R * 0.35), fill: c}));
}

/**
 * Place a hop badge beside its trail (never on it): tries both sides of the trail near its middle and
 * keeps the first spot clear of the trail, the given obstacles (text, flags) and inside the bounds.
 * @param {any} trail from trailArt
 * @param {{R:number, obstacles?:Array<{x:number,y:number,w:number,h:number}>, bounds?:{x:number,y:number,w:number,h:number}}} o
 */
export function badgeSpot(trail, o) {
  const R = o.R;
  const pts = trail.poly.pts;
  const clearOfTrail = c => pts.every(q => Math.hypot(q.x - c.x, q.y - c.y) >= R + 4);
  const B = o.bounds;
  const inB = c => !B || (c.x - R >= B.x && c.y - R >= B.y && c.x + R <= B.x + B.w && c.y + R <= B.y + B.h);
  const free = c => !(o.obstacles || []).some(b => overlaps({x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R}, b, 3));
  for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
    const a = trail.poly.at(t);
    const nx = -Math.sin(a.a), ny = Math.cos(a.a);
    for (const d of [R + 9, R + 16, R + 26]) {
      for (const sgn of [1, -1]) {
        const c = {x: a.x + nx * d * sgn, y: a.y + ny * d * sgn};
        if (inB(c) && free(c) && clearOfTrail(c)) return {...c, clear: true};
      }
    }
  }
  const a = trail.poly.at(0.5);
  return {x: a.x, y: a.y, clear: false};
}

/** Visible length of a trail (its drawn part, between the two flags). */
export const trailLength = trail => trail.total;

/* ------------------------------------------------------------------ */
/* Key card (legend)                                                   */
/* ------------------------------------------------------------------ */

function iconFor(ctx, kind, s, look) {
  const th = ctx.theme;
  switch (kind) {
    case 'flag': {
      const k = s / 40;
      return g({transform: `scale(${r(k, 3)})`},
        h('path', {d: 'M-26 0L-14 -10H24Q27 -10 27 -7V7Q27 10 24 10H-14Z', fill: flagColor(ctx), stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
    }
    case 'trail': {
      const k = s / 40;
      return g({transform: `scale(${r(k, 3)})`},
        h('path', {d: 'M-26 8Q0 -22 22 4', fill: 'none', stroke: flagInk(ctx), 'stroke-width': 3.2, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round'}),
        h('path', {d: 'M28 12L16 8L22 -1Z', fill: flagInk(ctx)}));
    }
    case 'ring': {
      const k = s / 40;
      return g({transform: `scale(${r(k, 3)})`},
        h('rect', {x: -24, y: -14, width: 48, height: 28, rx: 7, fill: th.paper, stroke: ringColor(ctx), 'stroke-width': 3.4}),
        h('rect', {x: -16, y: -6, width: 30, height: 4, rx: 2, fill: th.inkSoft}),
        h('rect', {x: -16, y: 3, width: 22, height: 4, rx: 2, fill: th.paperLine}));
    }
    case 'hand': {
      const k = s / 40;
      return g({transform: `scale(${r(k, 3)})`},
        h('line', {x1: -30, y1: 10, x2: -6, y2: 2, stroke: th.ink, 'stroke-width': 17, 'stroke-linecap': 'round'}),
        h('line', {x1: -30, y1: 10, x2: -6, y2: 2, stroke: (look && look.outfit) || th.cloth[0], 'stroke-width': 13, 'stroke-linecap': 'round'}),
        h('path', {d: 'M-6 -7C6 -12 22 -8 24 0C25 8 12 11 0 10C-6 9 -9 -4 -6 -7Z', fill: (look && look.skin) || '#e0ac85', stroke: th.ink, 'stroke-width': 2}));
    }
    case 'pill': {
      const k = s / 40;
      return g({transform: `scale(${r(k, 3)})`},
        h('rect', {x: -26, y: -11, width: 52, height: 22, rx: 11, fill: PILL, stroke: shade(PILL, -0.35), 'stroke-width': 1.6}),
        h('rect', {x: -17, y: -3, width: 34, height: 6, rx: 3, fill: shade(PILL, -0.45)}));
    }
    case 'tab': {
      const k = s / 40;
      return g({transform: `scale(${r(k, 3)})`},
        h('path', {d: 'M-24 12V-6Q-24 -12 -18 -12H18Q24 -12 24 -6V12Z', fill: levelColor(ctx, 0), stroke: th.ink, 'stroke-width': 2}),
        h('rect', {x: -30, y: 8, width: 60, height: 8, fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}));
    }
    default:
      return null;
  }
}

/**
 * Key card: a header line (bold), legend rows (icon + text) and the neutral
 * "as supplied · no conclusion drawn" note. All text fitted; nothing cut.
 * flow: legend items are laid out inline and wrap (wide, short panels).
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, size:number, min:number, header?:string, rows:Array<{icon:string, text:string}>, note:string, look?:any, opacity?:number, flow?:boolean}} o
 */
export function keyCard(ctx, o) {
  const th = ctx.theme;
  const pad = o.size * 0.7;
  const iconW = o.size * 2.2;
  const parts = [];
  const text = [];
  let y = o.y + pad;
  const inner = o.w - pad * 2;
  if (o.header) {
    const f = fitWords(ctx, o.header, {maxWidth: inner, size: o.size * 1.04, minSize: Math.min(o.min, o.size * 1.04), maxLines: 2, weight: 700});
    parts.push(textBlock(f, {x: o.x + pad, y, fill: th.ink, name: `${o.name}-header`}));
    text.push({x: o.x + pad, y, w: f.width, h: f.height});
    y += f.height + o.size * 0.55;
    parts.push(h('path', {d: `M${r(o.x + pad)} ${r(y - o.size * 0.3)}H${r(o.x + o.w - pad)}`, stroke: th.paperLine, 'stroke-width': 1.6}));
  }
  const place = (row, i, x0, y0, f, rh) => {
    const icon = iconFor(ctx, row.icon, o.size * 1.5, o.look);
    if (icon) parts.push(g({transform: T(x0 + iconW * 0.42, y0 + rh / 2)}, icon));
    parts.push(textBlock(f, {x: x0 + iconW, y: y0 + (rh - f.height) / 2, fill: th.ink, name: `${o.name}-row${i}`}));
    text.push({x: x0 + iconW, y: y0 + (rh - f.height) / 2, w: f.width, h: f.height});
  };
  if (o.flow) {
    const gapX = o.size * 1.1;
    let cx = o.x + pad;
    let lineH = 0;
    o.rows.forEach((row, i) => {
      let f = fitWords(ctx, row.text, {maxWidth: inner - iconW, size: o.size, minSize: Math.min(o.min, o.size), maxLines: 1, weight: 600});
      if (f.truncated) f = fitWords(ctx, row.text, {maxWidth: inner - iconW, size: o.size, minSize: Math.min(o.min, o.size), maxLines: 2, weight: 600});
      const iw = iconW + f.width;
      if (cx > o.x + pad + 1 && cx + iw > o.x + o.w - pad) {
        y += lineH + o.size * 0.35;
        cx = o.x + pad;
        lineH = 0;
      }
      const rh = Math.max(o.size * 1.5, f.height);
      place(row, i, cx, y, f, rh);
      cx += iw + gapX;
      lineH = Math.max(lineH, rh);
    });
    y += lineH + o.size * 0.35;
  } else {
    o.rows.forEach((row, i) => {
      const f = fitWords(ctx, row.text, {maxWidth: inner - iconW, size: o.size, minSize: Math.min(o.min, o.size), maxLines: 3, weight: 600});
      const rh = Math.max(o.size * 1.5, f.height);
      place(row, i, o.x + pad, y, f, rh);
      y += rh + o.size * 0.35;
    });
  }
  const ns = Math.min(o.size * 0.95, o.noteSize ?? Infinity);
  const nf = fitWords(ctx, o.note, {maxWidth: inner, size: ns, minSize: Math.min(o.min, ns), maxLines: 3, weight: 500});
  y += o.size * 0.15;
  parts.push(textBlock(nf, {x: o.x + pad, y, fill: th.inkSoft, italic: true, name: `${o.name}-note`}));
  text.push({x: o.x + pad, y, w: nf.width, h: nf.height});
  y += nf.height + pad;
  const H = y - o.y;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(o.x + 5, o.y + 7, o.w, H, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, H, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    parts);
  return {node, box: {x: o.x, y: o.y, w: o.w, h: H}, text};
}

/**
 * Plain card with a header and wrapped body (attributed notes, captions).
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, size:number, min:number, title?:string, body:string, sub?:string, accent?:string, opacity?:number, italicBody?:boolean}} o
 */
export function noteCard(ctx, o) {
  const th = ctx.theme;
  const pad = o.size * 0.65;
  const parts = [];
  let y = o.y + pad;
  const inner = o.w - pad * 2 - 8;
  if (o.title) {
    const f = fitWords(ctx, o.title, {maxWidth: inner, size: o.size, minSize: o.min, maxLines: 2, weight: 700});
    parts.push(textBlock(f, {x: o.x + pad + 8, y, fill: th.ink, name: `${o.name}-title`}));
    y += f.height + o.size * 0.35;
  }
  const bf = fitWords(ctx, o.body, {maxWidth: inner, size: o.size, minSize: o.min, maxLines: 4, weight: 500});
  parts.push(textBlock(bf, {x: o.x + pad + 8, y, fill: th.ink, italic: o.italicBody, name: `${o.name}-body`}));
  y += bf.height;
  if (o.sub) {
    y += o.size * 0.3;
    const sf = fitWords(ctx, o.sub, {maxWidth: inner, size: o.size * 0.92, minSize: Math.min(o.min, o.size * 0.92), maxLines: 2, weight: 500});
    parts.push(textBlock(sf, {x: o.x + pad + 8, y, fill: th.inkSoft, name: `${o.name}-sub`}));
    y += sf.height;
  }
  y += pad;
  const H = y - o.y;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(o.x + 4, o.y + 6, o.w, H, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, H, 12), fill: th.card, stroke: o.accent || th.ink, 'stroke-width': 2}),
    h('rect', {x: o.x + 7, y: o.y + 8, width: 5, height: H - 16, rx: 2.5, fill: o.accent || th.inkSoft}),
    parts);
  return {node, box: {x: o.x, y: o.y, w: o.w, h: H}};
}

/** Lettered square pin pairing an annotation chip with its target (letters: numbers mean hop order only). */
export function letterPin(ctx, {name, x, y, letter, size = 19, color}) {
  const c = color || ctx.theme.inkSoft;
  const R = size * 0.8;
  return g({name, opacity: 0, transform: T(x, y)},
    h('rect', {x: r(-R - 1), y: r(-R - 1), width: r(2 * R + 2), height: r(2 * R + 2), rx: 5, fill: ctx.theme.card, stroke: c, 'stroke-width': 2.5}),
    h('text', {x: 0, y: r(size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: c}, letter));
}

/** Numbered pin used to pair an annotation chip with its target (no leader across text). */
export function numberPin(ctx, {name, x, y, n, size = 19, color}) {
  const c = color || ctx.theme.inkSoft;
  const R = size * 0.78;
  return g({name, opacity: 0, transform: T(x, y)},
    h('circle', {r: r(R + 2), fill: ctx.theme.card, stroke: c, 'stroke-width': 2.5}),
    h('text', {x: 0, y: r(size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: c}, String(n)));
}
