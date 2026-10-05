/**
 * "Texto y contexto" kit (LAW-0121..0124) — first motif of the sources
 * category (Fuentes e interpretación). Original vector art and geometry for
 * a key word that is enlarged under a hand magnifier and put back into its
 * full article; the article belongs to a book, and the book to a place in an
 * ordering of sources that the AUTHOR supplies (the "editable hierarchy").
 *
 * Art (all original geometry, no third-party assets):
 *  - articleLayout()/articleArt(): the article as simulated clause wording,
 *    wrapped and measured word by word so every occurrence of the key word
 *    has an exact box (text or, with labels hidden, word bars of the same
 *    widths); occurrences are found in the SUPPLIED text only;
 *  - openBookArt(): top-down open book (covers, page stacks, curved pages,
 *    gutter shading, running headers) carrying the article on its right page;
 *  - rackArt(): the editable hierarchy as a wooden rack whose rows carry the
 *    author's neutral labels ("Level 1 (user-supplied)") and closed books
 *    (Source A/B/C); the book being read leaves an empty slot in its row;
 *  - lupaArt(): hand magnifier (rim, glass, ferrule, wooden handle) whose
 *    glass shows a REAL magnified copy of the scene below it;
 *  - readingCard(): an attributed reading ("reading proposed by …"), never an
 *    endorsement; isolated (amber, ring icon) and contextual (blue, page icon)
 *    cards have equal visual weight;
 *  - deskStage(): top-down reading desk (rack, book, magnifier, one IK arm)
 *    with a pose solver. It owns geometry and attachment only; each entry
 *    owns its own timeline, labels and semantics.
 *
 * Attachment rules (asserted by the tests through semantics):
 *  - while held, the magnifier is placed from the SOLVED hand (lensGrip ≡
 *    hand); at rest it lies where the hand released it;
 *  - raising the magnifier scales it about the grip, so the hand never slides
 *    along the handle; the glass copy is magnified about the lens centre.
 *
 * Legal content: every text is a fictional placeholder, jurisdiction
 * unspecified. The rack order is the author's; no rule, hierarchy of norms,
 * winner or "correct" reading is derived from it.
 * @module animations/sources/kits/texto-y-contexto
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, roundRectPath, edgeAnchor} from '../../../core/geometry.js';
import {wrap, measure, FONTS} from '../../../core/text.js';
import {textBlock, chip, connector} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, int, list, obj} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Parameters                                                          */
/* ------------------------------------------------------------------ */

const reading = description => obj(description, {
  text: str('The reading as supplied (quoted, attributed; never marked correct)', 80),
  by: str('Fictional source the reading is attributed to', 44),
}, ['text', 'by']);

/**
 * Category field set (sources): sources, hierarchy, passages, interpretations.
 * Built only from the shared builders in schemas/fields.js; it can be promoted
 * there when another sources motif needs the same shape.
 */
export const sourcesFields = {
  sources: list('Sources kept on the rack (fictional, neutral identifiers). The FIRST source is the book that is read: it lies open on the desk and leaves an empty slot in its row', obj('Source', {
    name: str('Neutral identifier printed on the plate/spine, e.g. "Source A"', 32),
    title: str('Fictional title printed on the left page, e.g. "Text 1 (fictional)"', 60),
    level: int('Row of the supplied ordering this source is placed on (0 = first row). The placement is the author’s; no ordering rule is applied', 0, 3),
  }, ['name', 'title', 'level']), 1, 3),
  hierarchy: obj('Editable hierarchy: an ordering of sources SUPPLIED by the author, drawn as the rows of a rack. Labels are neutral placeholders; nothing prevails and no rule is derived from the order', {
    levels: list('Row labels, first to last (user-supplied)', str('Row label', 56), 2, 4),
    caption: str('Caption printed on the rack', 60),
  }, ['levels']),
  passages: obj('The article that is read (simulated, fictional clause wording)', {
    heading: str('Article heading, e.g. "Text 1 · Art. 4 (fictional)"', 56),
    lines: list('Passages of the article (simulated wording)', str('Passage', 110), 2, 4),
    word: str('Key word that is enlarged and put back. Its other occurrences are found in the supplied passages (whole-word, case- and accent-insensitive)', 24),
    wordPassage: int('Passage (0-based) whose occurrence of the key word is enlarged', 0, 3),
  }, ['heading', 'lines', 'word']),
  interpretations: obj('Readings attributed to their (fictional) sources; shown as “reading proposed”, never endorsed, ranked or resolved', {
    isolated: reading('Reading proposed for the word read on its own'),
    contextual: reading('Reading proposed for the word read within the whole article'),
  }, ['isolated', 'contextual']),
};

/** Fictional English defaults shared by the four entries. */
export const TC_DEFAULTS = {
  sources: [
    {name: 'Source A', title: 'Text 1 (fictional)', level: 1},
    {name: 'Source B', title: 'Text 2 (fictional)', level: 0},
    {name: 'Source C', title: 'Text 3 (fictional)', level: 2},
  ],
  hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)', 'Level 3 (user-supplied)'], caption: 'Ordering supplied by the author'},
  passages: {
    heading: 'Text 1 · Art. 4 (fictional)',
    lines: ['Each unit keeps a register of entries.', 'In this article, a unit is a room listed in Text 2.', 'The register stays at the entrance of the unit.'],
    word: 'unit',
    wordPassage: 0,
  },
  interpretations: {
    isolated: {text: '“unit” as any single item', by: 'Commentary 1 (fictional)'},
    contextual: {text: '“unit” as a room listed in Text 2', by: 'Commentary 2 (fictional)'},
  },
};

/** Fictional Spanish defaults (presets). */
export const TC_DEFAULTS_ES = {
  sources: [
    {name: 'Fuente A', title: 'Texto 1 (ficticio)', level: 1},
    {name: 'Fuente B', title: 'Texto 2 (ficticio)', level: 0},
    {name: 'Fuente C', title: 'Texto 3 (ficticio)', level: 2},
  ],
  hierarchy: {levels: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)', 'Nivel 3 (aportado)'], caption: 'Orden aportado por el autor'},
  passages: {
    heading: 'Texto 1 · Art. 4 (ficticio)',
    lines: ['Cada unidad lleva un registro de entradas.', 'En este artículo, una unidad es una sala incluida en el Texto 2.', 'El registro queda a la entrada de la unidad.'],
    word: 'unidad',
    wordPassage: 0,
  },
  interpretations: {
    isolated: {text: '«unidad» como cualquier elemento suelto', by: 'Comentario 1 (ficticio)'},
    contextual: {text: '«unidad» como una sala incluida en el Texto 2', by: 'Comentario 2 (ficticio)'},
  },
};

/** Long-label content for stress presets (fictional). */
export const TC_LONG = {
  sources: [
    {name: 'Source A — consolidated edition', title: 'Text 1: Consolidated Register Rules (fictional)', level: 1},
    {name: 'Source B — annex volume', title: 'Text 2: Annex of Listed Rooms and Spaces (fictional)', level: 0},
    {name: 'Source C — explanatory notes', title: 'Text 3: Explanatory Notes (fictional)', level: 2},
  ],
  hierarchy: {
    levels: ['Level 1 as supplied by the author for this example', 'Level 2 as supplied by the author for this example', 'Level 3 as supplied by the author for this example'],
    caption: 'Ordering of sources supplied by the author (not a rule)',
  },
  passages: {
    heading: 'Text 1 · Article 4, paragraphs 1 to 3 (fictional)',
    lines: [
      'Each storage unit keeps a bound register of all entries made during the working day.',
      'In this article, a storage unit is a room or enclosed space listed in the annex of Text 2.',
      'The register stays at the entrance of the storage unit and is shown on request.',
    ],
    word: 'unit',
    wordPassage: 0,
  },
  interpretations: {
    isolated: {text: '“unit” as any single item, measure or piece counted on its own', by: 'Commentary 1 (fictional, first edition)'},
    contextual: {text: '“unit” as a room or enclosed space listed in the annex of Text 2', by: 'Commentary 2 (fictional, second edition)'},
  },
};

/** Built-in strings of the kit. */
export const TC_STRINGS = {
  en: {
    isolated: 'Isolated reading', contextual: 'Contextual reading', proposedBy: 'Reading proposed by',
    reader: 'Reader', fullArticle: 'Full article', onDesk: 'open on the desk', suppliedFor: 'Supplied for',
    stateEnlarged: 'Word enlarged, read on its own', stateReturned: 'Word back in its article', stateInContext: 'Word read within the full article',
    sameWord: 'same word in the article', noOther: 'no other occurrence in the article',
  },
  es: {
    isolated: 'Lectura aislada', contextual: 'Lectura contextual', proposedBy: 'Lectura propuesta por',
    reader: 'Lectora', fullArticle: 'Artículo completo', onDesk: 'abierto en la mesa', suppliedFor: 'Aportada para',
    stateEnlarged: 'Palabra ampliada, leída sola', stateReturned: 'Palabra de vuelta en su artículo', stateInContext: 'Palabra leída en el artículo completo',
    sameWord: 'misma palabra en el artículo', noOther: 'sin otra aparición en el artículo',
  },
};

/** Kit strings merged over English for a locale. */
export const kitStrings = locale => ({...TC_STRINGS.en, ...(TC_STRINGS[locale] || {})});

/* ------------------------------------------------------------------ */
/* Text matching (supplied text only)                                  */
/* ------------------------------------------------------------------ */

const WORD_CH = /[\p{L}\p{N}]/u;

/** Lower-case, accent-free copy of a string with the SAME UTF-16 length. */
export function fold(s) {
  let out = '';
  for (const c of String(s)) {
    if (c.length === 1) out += (c.normalize('NFD')[0] || c).toLowerCase()[0] || c;
    else out += c;
  }
  return out;
}

/** Start indices of whole-word occurrences of `word` in `line`. */
export function findAll(line, word) {
  const L = fold(line);
  const W = fold(String(word).trim());
  if (!W) return [];
  const out = [];
  let i = L.indexOf(W);
  while (i >= 0) {
    const before = i > 0 ? L[i - 1] : '';
    const after = L[i + W.length] || '';
    if (!(before && WORD_CH.test(before)) && !(after && WORD_CH.test(after))) out.push(i);
    i = L.indexOf(W, i + 1);
  }
  return out;
}

/** Count whole-word occurrences of a word in a list of passages. */
export function countOccurrences(lines, word) {
  return lines.reduce((n, t) => n + findAll(String(t).replace(/\s+/g, ' '), word).length, 0);
}

/* ------------------------------------------------------------------ */
/* Article layout + art                                                */
/* ------------------------------------------------------------------ */

const LEAD = 1.5;
const PGAP = 0.62;

/**
 * Lay out an article (heading + numbered passages) inside a box. Pure.
 * Each occurrence of the key word gets its exact box (measured per word).
 * @param {any} ctx
 * @param {{x:number,y:number,w:number,h:number,heading:string,lines:string[],word:string,wordPassage?:number,size?:number,reserve?:Record<number,number>,replaceKey?:string}} o
 *   `reserve[i]` keeps at least that many line slots for passage i (so a
 *   substituted passage never pushes the others); `replaceKey` prints another
 *   text at the key occurrence (inspect substitution).
 */
export function articleLayout(ctx, o) {
  const {x, y, w, h: hh} = o;
  const size0 = o.size ?? 24;
  const numW = Math.round(size0 * 1.15);
  const headSize = o.headSize ?? size0 * 1.1;
  const lines = o.lines.map(t => String(t).replace(/\s+/g, ' ').trim());
  const kp = clamp(o.wordPassage ?? 0, 0, lines.length - 1);
  const head = o.heading === null
    ? {lines: [], height: 0, size: headSize, lineHeight: headSize, width: 0, truncated: false, full: '', weight: 700, family: 'serif'}
    : ctx.fit(o.heading, {maxWidth: w, size: headSize, minSize: o.headMin ?? Math.max(12, headSize * 0.72), maxLines: o.headLines ?? 2, weight: 700, family: 'serif'});
  const headGap = o.heading === null ? 0 : size0 * 0.95;
  const reserve = o.reserve || {};
  const tw = w - numW;
  const avail = hh - head.height - headGap;
  const minSize = Math.max(11, size0 * 0.7);
  const wrapAll = s => lines.map(t => wrap(t, tw, s, 400, 'serif'));
  const heightOf = (wr, s) => wr.reduce((a, ls, i) => a + Math.max(ls.length, reserve[i] || 0), 0) * s * LEAD + (lines.length - 1) * s * PGAP;
  let size = size0;
  let wrapped = wrapAll(size);
  while (heightOf(wrapped, size) > avail && size > minSize) {
    size = Math.max(minSize, size - 0.5);
    wrapped = wrapAll(size);
  }
  // still too tall: shorten the longest passages (ellipsis; full text kept in <title>)
  let truncated = false;
  while (heightOf(wrapped, size) > avail) {
    let li = 0;
    wrapped.forEach((ls, i) => { if (ls.length > wrapped[li].length) li = i; });
    if (wrapped[li].length <= 1) break;
    const keep = wrapped[li].slice(0, -1);
    let last = keep[keep.length - 1];
    while (last.length > 1 && measure(`${last}…`, size, 400, 'serif') > tw) last = last.slice(0, -1).trimEnd();
    keep[keep.length - 1] = `${last}…`;
    wrapped[li] = keep;
    truncated = true;
  }
  const pitch = size * LEAD;
  const headY = y;
  let cursor = y + head.height + headGap;
  const passages = [];
  const occ = [];
  lines.forEach((full, i) => {
    let ls = wrapped[i];
    // print a replacement at the key occurrence (inspect): wrap the passage with it
    const slots = Math.max(ls.length, reserve[i] || 0);
    const y0 = cursor;
    const lineRecs = ls.map((text, j) => {
      const top = y0 + j * pitch;
      const lx = x + numW;
      const found = findAll(text, o.word).map(idx => ({idx, len: String(o.word).trim().length}));
      const rec = {text, x: lx, y: top, w: measure(text, size, 400, 'serif'), occ: []};
      for (const f of found) {
        const piece = text.slice(f.idx, f.idx + f.len);
        const ox = lx + measure(text.slice(0, f.idx), size, 400, 'serif');
        const ow = measure(piece, size, 400, 'serif');
        const item = {p: i, j, idx: f.idx, len: f.len, x: ox, y: top, w: ow, h: size, cx: ox + ow / 2, cy: top + size * 0.45, text: piece, key: false};
        rec.occ.push(occ.length);
        occ.push(item);
      }
      return rec;
    });
    const maxW = Math.max(...lineRecs.map(l => l.w));
    const yEnd = y0 + (ls.length - 1) * pitch + size;
    passages.push({i, y0, y1: yEnd, yReserved: y0 + (slots - 1) * pitch + size, lines: lineRecs, box: {x: x + numW, y: y0 - size * 0.25, w: maxW, h: yEnd - y0 + size * 0.5}, full});
    cursor = y0 + slots * pitch + size * PGAP;
  });
  // key occurrence: first one inside the chosen passage, else the first one
  let key = occ.find(q => q.p === kp) || occ[0] || null;
  let found = Boolean(key);
  if (!key) {
    // no occurrence in the supplied text: mark the first word of the passage
    const L0 = passages[kp].lines[0];
    const first = (L0.text.match(/^\S+/) || [''])[0];
    const ow = measure(first, size, 400, 'serif');
    key = {p: kp, j: 0, idx: 0, len: first.length, x: L0.x, y: L0.y, w: ow, h: size, cx: L0.x + ow / 2, cy: L0.y + size * 0.45, text: first, key: true, synthetic: true};
    occ.push(key);
    L0.occ.push(occ.length - 1);
  }
  key.key = true;
  const bottom = cursor - size * PGAP;
  const box = {x, y, w, h: bottom - y};
  return {x, y, w, h: hh, size, pitch, numW, head, headY, passages, occ, key, keyIndex: occ.indexOf(key), found, truncated, box, kp};
}

/** Word bars used when labels are hidden: same positions and widths as the words. */
function wordBars(text, x, y, size, family, weight, fill) {
  const out = [];
  const space = measure(' ', size, weight, family);
  let cx = x;
  for (const word of String(text).split(' ')) {
    if (!word) { cx += space; continue; }
    const w = measure(word, size, weight, family);
    out.push(h('rect', {x: r(cx), y: r(y + size * 0.3), width: r(Math.max(4, w)), height: r(size * 0.46), rx: r(size * 0.2), fill}));
    cx += w + space;
  }
  return out;
}

/**
 * Zero-width marker prefixed to text inside magnified copies (glass/lens), so
 * layout checks can tell an intentional optical overprint from a collision.
 */
export const COPY_MARK = '\u200B';
const markFit = (fit, mark) => (mark ? {...fit, lines: fit.lines.map(l => mark + l)} : fit);

const piecePlain = (text, x, y, size, fill, weight = 400, family = 'serif') => h('text', {
  x: r(x), y: r(y + size * 0.8), 'font-family': FONTS[family], 'font-size': r(size), 'font-weight': weight, fill,
}, text);

/**
 * Render an article layout. Returns separate layers so a stage can put the
 * highlight rectangles under the words and fade/replace parts.
 * Named nodes (prefix P): `${P}-rest` (everything but the key word),
 * `${P}-kw` (key word), `${P}-h${i}` (highlight of occurrence i),
 * `${P}-num${i}` passage numbers are part of rest.
 * @param {any} ctx
 * @param {ReturnType<typeof articleLayout>} AL
 * @param {{prefix:string, only?:number[], heading?:boolean, keyFill?:string, keyText?:string}} o
 */
export function articleArt(ctx, AL, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const showAll = ctx.show('all') && !o.bars;
  const showKey = ctx.show('key') && !o.bars;
  const size = AL.size;
  const only = o.only ? new Set(o.only) : null;
  const mk = o.mark || '';
  const rest = [];
  const hl = [];
  let keyNode = null;
  const barFill = th.paperLine;
  const inkBar = shade(th.paperLine, -0.25);
  if (o.heading !== false && AL.head.lines.length) {
    if (showAll) rest.push(textBlock(markFit(AL.head, mk), {x: AL.x, y: AL.headY, fill: th.ink}));
    else AL.head.lines.forEach((ln, j) => rest.push(...wordBars(ln, AL.x, AL.headY + j * AL.head.lineHeight, AL.head.size, 'serif', 700, inkBar)));
  }
  for (const pas of AL.passages) {
    if (only && !only.has(pas.i)) continue;
    const L0 = pas.lines[0];
    if (o.numbers === false) { /* no passage number */ } else if (showAll) rest.push(h('text', {x: r(AL.x + AL.numW * 0.1), y: r(L0.y + size * 0.8), 'font-family': FONTS.sans, 'font-size': r(size * (o.numScale ?? 0.78)), 'font-weight': 700, fill: th.inkSoft}, `${mk}${pas.i + 1}`));
    else rest.push(h('circle', {cx: r(AL.x + AL.numW * 0.32), cy: r(L0.y + size * 0.52), r: r(size * 0.17), fill: inkBar}));
    for (const ln of pas.lines) {
      // split the line into plain pieces and occurrence pieces
      const cuts = ln.occ.map(k => AL.occ[k]).sort((a, b) => a.idx - b.idx);
      let at = 0;
      const pieces = [];
      for (const q of cuts) {
        if (q.idx > at) pieces.push({a: at, b: q.idx});
        pieces.push({a: q.idx, b: q.idx + q.len, q});
        at = q.idx + q.len;
      }
      if (at < ln.text.length) pieces.push({a: at, b: ln.text.length});
      for (const pc of pieces) {
        const raw = ln.text.slice(pc.a, pc.b);
        const lead = raw.length - raw.trimStart().length;
        const text = raw.trim();
        if (!text) continue;
        const px = ln.x + measure(ln.text.slice(0, pc.a + lead), size, 400, 'serif');
        const qi = pc.q ? AL.occ.indexOf(pc.q) : -1;
        if (pc.q) {
          const isKey = pc.q.key;
          hl.push(h('rect', {name: `${P}-h${qi}`, x: r(pc.q.x - 4), y: r(pc.q.y - size * 0.12), width: r(pc.q.w + 8), height: r(size * 1.18), rx: r(size * 0.22),
            fill: isKey ? (o.keyFill || th.accent3Soft) : th.accent2Soft, stroke: isKey ? shade(th.accent3, -0.1) : th.accent2, 'stroke-width': 1.6, opacity: 0}));
          if (isKey) {
            const shown = o.keyText ?? text;
            keyNode = g({name: `${P}-kw`},
              showKey ? piecePlain(mk + shown, px, ln.y, size, th.ink, 400) : wordBars(shown, px, ln.y, size, 'serif', 400, shade(th.accent3, -0.35)));
            continue;
          }
          if (showAll) rest.push(piecePlain(mk + text, px, ln.y, size, th.ink));
          else rest.push(...wordBars(text, px, ln.y, size, 'serif', 400, inkBar));
          continue;
        }
        if (showAll) rest.push(piecePlain(mk + text, px, ln.y, size, th.ink));
        else rest.push(...wordBars(text, px, ln.y, size, 'serif', 400, barFill));
      }
    }
    if (showAll && pas.full && pas.lines[pas.lines.length - 1].text.endsWith('…')) rest.push(h('title', null, pas.full));
  }
  return {hl: g(null, hl), rest: g({name: `${P}-rest`}, rest), key: keyNode || g({name: `${P}-kw`})};
}

/* ------------------------------------------------------------------ */
/* Open book (top-down)                                                */
/* ------------------------------------------------------------------ */

/** Page geometry of an open book whose covers fill (x,y,w,h). */
export function bookPages(x, y, w, hh, m = 16) {
  const pw = (w - 2 * m) / 2;
  const ph = hh - 2 * m;
  const left = {x: x + m, y: y + m, w: pw, h: ph};
  const right = {x: x + m + pw, y: y + m, w: pw, h: ph};
  return {left, right, gutterX: x + m + pw, box: {x, y, w, h: hh}, m};
}

/**
 * Top-down open book. Local coordinates are world (stage) coordinates.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, color:string, source:{name:string,title:string}, art?:{hl:any,rest:any,key:any}, headerSize?:number}} o
 */
export function openBookArt(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const pg = bookPages(o.x, o.y, o.w, o.h);
  const {left: Lp, right: Rp, gutterX: gx} = pg;
  // o.pageText === false: the page identity (name, title, running header) is
  // drawn as bars, e.g. on a small book whose identity is on its own caption
  const showAll = ctx.show('all') && o.pageText !== false;
  const cover = o.color;
  const mk = o.mark || '';
  const hs = o.headerSize ?? Math.max(14, Rp.w * 0.042);
  const parts = [];
  parts.push(h('path', {d: roundRectPath(o.x + 10, o.y + 14, o.w, o.h, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 16), fill: cover, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('path', {d: roundRectPath(o.x + 6, o.y + 6, o.w - 12, o.h - 12, 12), fill: 'none', stroke: shade(cover, -0.3), 'stroke-width': 2}));
  // page stacks under both pages
  for (const k of [3, 2, 1]) {
    parts.push(h('rect', {x: r(Lp.x - k * 2.6), y: r(Lp.y + k * 1.6), width: r(Lp.w), height: r(Lp.h), rx: 3, fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 1.2}));
    parts.push(h('rect', {x: r(Rp.x + k * 2.6), y: r(Rp.y + k * 1.6), width: r(Rp.w), height: r(Rp.h), rx: 3, fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 1.2}));
  }
  const dip = Math.min(10, Lp.h * 0.014);
  const leftD = `M${r(gx)} ${r(Lp.y + dip)}Q${r(gx - Lp.w * 0.4)} ${r(Lp.y - 3)} ${r(Lp.x + 4)} ${r(Lp.y)}Q${r(Lp.x)} ${r(Lp.y)} ${r(Lp.x)} ${r(Lp.y + 4)}V${r(Lp.y + Lp.h - 4)}Q${r(Lp.x)} ${r(Lp.y + Lp.h)} ${r(Lp.x + 4)} ${r(Lp.y + Lp.h)}Q${r(gx - Lp.w * 0.4)} ${r(Lp.y + Lp.h + 3)} ${r(gx)} ${r(Lp.y + Lp.h - dip * 0.6)}Z`;
  const rightD = `M${r(gx)} ${r(Rp.y + dip)}Q${r(gx + Rp.w * 0.4)} ${r(Rp.y - 3)} ${r(Rp.x + Rp.w - 4)} ${r(Rp.y)}Q${r(Rp.x + Rp.w)} ${r(Rp.y)} ${r(Rp.x + Rp.w)} ${r(Rp.y + 4)}V${r(Rp.y + Rp.h - 4)}Q${r(Rp.x + Rp.w)} ${r(Rp.y + Rp.h)} ${r(Rp.x + Rp.w - 4)} ${r(Rp.y + Rp.h)}Q${r(gx + Rp.w * 0.4)} ${r(Rp.y + Rp.h + 3)} ${r(gx)} ${r(Rp.y + Rp.h - dip * 0.6)}Z`;
  parts.push(h('path', {d: leftD, fill: th.paper, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: rightD, fill: th.paper, stroke: th.ink, 'stroke-width': 2}));
  // gutter shading
  const gid = `${P}-gut`;
  parts.push(h('defs', null, h('linearGradient', {id: ctx.id(gid), x1: 0, x2: 1, y1: 0, y2: 0},
    h('stop', {offset: 0, 'stop-color': th.ink, 'stop-opacity': 0}),
    h('stop', {offset: 0.42, 'stop-color': th.ink, 'stop-opacity': 0.1}),
    h('stop', {offset: 0.5, 'stop-color': th.ink, 'stop-opacity': 0.2}),
    h('stop', {offset: 0.58, 'stop-color': th.ink, 'stop-opacity': 0.1}),
    h('stop', {offset: 1, 'stop-color': th.ink, 'stop-opacity': 0}))));
  parts.push(h('rect', {x: r(gx - 44), y: r(Lp.y + dip), width: 88, height: r(Lp.h - dip * 1.8), fill: ctx.ref(gid)}));
  parts.push(h('line', {x1: r(gx), y1: r(Lp.y + dip), x2: r(gx), y2: r(Lp.y + Lp.h - dip * 0.6), stroke: th.paperLine, 'stroke-width': 1.5}));
  // left page: source identity + a previous article in bars (decorative)
  const lx = Lp.x + Lp.w * 0.12;
  const lw = Lp.w * 0.74;
  let ly = Lp.y + Lp.h * 0.07;
  if (o.pageText === false) {
    // identity printed elsewhere (a readable plate): the page shows filler only
    ly += hs * 0.4;
  } else if (showAll) {
    // never cut the source name: one line, else two (whole words)
    let nf = ctx.fit(o.source.name, {maxWidth: lw, size: hs * 1.05, minSize: 11, maxLines: 1, weight: 700});
    if (nf.truncated) nf = ctx.fit(o.source.name, {maxWidth: lw, size: hs * 1.05, minSize: 9, maxLines: 2, weight: 700});
    parts.push(textBlock(markFit(nf, mk), {x: lx, y: ly, fill: th.inkSoft, letterSpacing: 1}));
    ly += nf.height + hs * 0.8;
    const tf = ctx.fit(o.source.title, {maxWidth: lw, size: Math.max(16, Lp.w * 0.07), minSize: 13, maxLines: 3, weight: 700, family: 'serif'});
    parts.push(textBlock(markFit(tf, mk), {x: lx, y: ly, fill: th.ink}));
    ly += tf.height + hs * 0.9;
  } else {
    parts.push(h('rect', {x: r(lx), y: r(ly), width: r(lw * 0.42), height: r(hs * 0.7), rx: 3, fill: th.paperLine}));
    ly += hs * 1.9;
    parts.push(h('rect', {x: r(lx), y: r(ly), width: r(lw * 0.8), height: r(Lp.w * 0.05), rx: 4, fill: shade(th.paperLine, -0.25)}));
    ly += Lp.w * 0.05 + hs * 1.6;
  }
  parts.push(h('line', {x1: r(lx), x2: r(lx + lw), y1: r(ly), y2: r(ly), stroke: th.paperLine, 'stroke-width': 2}));
  const titleBottom = ly;
  ly += hs * 1.3;
  const barH = Math.max(5, Lp.w * 0.016);
  const pitch = barH * 2.9;
  let k = 0;
  while (ly < Lp.y + Lp.h * 0.9 - pitch) {
    const para = k % 5 === 0;
    const wFrac = para ? 0.36 : (k % 5 === 4 ? 0.5 + ctx.rng(`${P}-lbar`, k) * 0.25 : 0.86 + ctx.rng(`${P}-lbar`, k) * 0.14);
    parts.push(h('rect', {x: r(lx + (para ? 0 : 0)), y: r(ly), width: r(lw * wFrac), height: r(para ? barH * 1.4 : barH), rx: r(barH / 2), fill: para ? shade(th.paperLine, -0.22) : th.paperLine}));
    ly += para ? pitch * 1.25 : pitch;
    k += 1;
  }
  // running header on the right page + page numbers (bars)
  const rhY = Rp.y + Rp.h * 0.045;
  // running header (decorative): printed only when it fits whole on one line
  const rf = showAll ? ctx.fit(o.source.name, {maxWidth: Rp.w * 0.76, size: hs * 0.92, minSize: 9, maxLines: 1, weight: 600}) : null;
  if (o.pageText === false) {
    /* no running header */
  } else if (rf && !rf.truncated) {
    parts.push(textBlock(markFit(rf, mk), {x: Rp.x + Rp.w * 0.86, y: rhY, anchor: 'end', fill: th.inkSoft}));
  } else parts.push(h('rect', {x: r(Rp.x + Rp.w * 0.62), y: r(rhY + 2), width: r(Rp.w * 0.28), height: r(hs * 0.55), rx: 3, fill: th.paperLine}));
  parts.push(h('line', {x1: r(Rp.x + Rp.w * 0.1), x2: r(Rp.x + Rp.w * 0.9), y1: r(rhY + hs * 1.45), y2: r(rhY + hs * 1.45), stroke: th.paperLine, 'stroke-width': 1.5}));
  parts.push(h('rect', {x: r(Lp.x + Lp.w * 0.47), y: r(Lp.y + Lp.h * 0.955), width: r(Lp.w * 0.06), height: r(barH), rx: 2, fill: th.paperLine}));
  parts.push(h('rect', {x: r(Rp.x + Rp.w * 0.47), y: r(Rp.y + Rp.h * 0.955), width: r(Rp.w * 0.06), height: r(barH), rx: 2, fill: th.paperLine}));
  const node = g({name: P}, parts, o.art ? [o.art.hl, o.art.rest, o.art.key] : null);
  return {node, pages: pg, rhBottom: rhY + hs * 1.45, titleBottom};
}

/* ------------------------------------------------------------------ */
/* Closed book cover (top-down), rack                                  */
/* ------------------------------------------------------------------ */

/**
 * Fit a decorative label without ever splitting a word: the size is capped so
 * the longest word fits the width; returns null when that would drop below
 * `minSize` or the block would not fit the height (callers then draw bars).
 */
function wholeWordFit(ctx, label, {maxWidth, size, minSize, maxLines, maxHeight, weight = 700}) {
  const words = String(label || '').split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const longest = Math.max(...words.map(wd => measure(wd, 1, weight, 'sans')), 1);
  const sz = Math.min(size, (maxWidth - 2) / longest);
  if (sz < minSize) return null;
  const f = ctx.fit(label, {maxWidth, size: sz, minSize, maxLines, weight});
  const whole = f.lines.every((ln, li) => {
    const cut = ln.endsWith('…') && li === f.lines.length - 1;
    const toks = ln.replace(/…$/, '').split(' ').filter(Boolean);
    return toks.every((wd, ti) => words.includes(wd) || (cut && ti === toks.length - 1 && words.some(x => x.startsWith(wd))));
  });
  return whole && !f.truncated && f.height <= maxHeight + 2 ? f : null;
}

/** Closed book lying cover-up. Local origin = top-left. */
export function closedBook(ctx, {w, h: hh, color, label, name, minText}) {
  const th = ctx.theme;
  const parts = [
    h('rect', {x: 5, y: 7, width: r(w), height: r(hh), rx: 5, fill: th.shadow}),
    h('rect', {x: 4, y: 3, width: r(w - 4), height: r(hh - 3), rx: 4, fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}),
    h('line', {x1: 8, x2: r(w - 3), y1: r(hh - 3), y2: r(hh - 3), stroke: th.paperLine, 'stroke-width': 1.2}),
    h('rect', {x: 0, y: 0, width: r(w - 5), height: r(hh - 5), rx: 5, fill: color, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: 0, y: 0, width: r(Math.max(8, w * 0.13)), height: r(hh - 5), rx: 4, fill: shade(color, -0.28)}),
    h('line', {x1: r(w * 0.2), x2: r(w - 12), y1: r(hh * 0.1), y2: r(hh * 0.1), stroke: shade(color, 0.35), 'stroke-width': 2}),
    h('line', {x1: r(w * 0.2), x2: r(w - 12), y1: r(hh * 0.86), y2: r(hh * 0.86), stroke: shade(color, 0.35), 'stroke-width': 2}),
  ];
  const plate = {x: w * 0.19, y: hh * 0.2, w: w * 0.74, h: hh * 0.54};
  parts.push(h('rect', {x: r(plate.x), y: r(plate.y), width: r(plate.w), height: r(plate.h), rx: 3, fill: th.paper, stroke: shade(color, -0.35), 'stroke-width': 1.4}));
  // never split a word; a plate too small for legible whole words shows bars (decorative)
  const f = label && ctx.show('all') ? wholeWordFit(ctx, label, {maxWidth: plate.w - 8, size: Math.min(22, plate.h * 0.42, plate.w * 0.24), minSize: minText ?? 9, maxLines: 3, maxHeight: plate.h}) : null;
  if (f) {
    parts.push(textBlock(f, {x: plate.x + plate.w / 2, y: plate.y + (plate.h - f.height) / 2, anchor: 'middle', fill: th.ink}));
  } else {
    parts.push(h('rect', {x: r(plate.x + plate.w * 0.15), y: r(plate.y + plate.h * 0.3), width: r(plate.w * 0.7), height: r(plate.h * 0.16), rx: 2, fill: th.paperLine}));
    parts.push(h('rect', {x: r(plate.x + plate.w * 0.25), y: r(plate.y + plate.h * 0.58), width: r(plate.w * 0.5), height: r(plate.h * 0.14), rx: 2, fill: th.paperLine}));
  }
  return g({name}, parts);
}

/** Source colours (book covers), by source index. */
export function sourceColor(ctx, i) {
  const c = ctx.theme.cloth;
  return [c[6], c[3], c[2], c[5]][i % 4];
}

/**
 * Editable hierarchy: a rack whose rows are labelled by the author. Rows are
 * listed first→last from top to bottom; each row holds the closed books placed
 * on it; the book being read (sources[0]) leaves a dashed empty slot.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, levels:string[], sources:Array<{name:string,title:string,level:number}>, caption?:string, plateSize?:number}} o
 */
export function rackArt(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w, h: hh} = o;
  const showAll = ctx.show('all');
  const n = o.levels.length;
  const pad = 14;
  const ps = o.plateSize ?? 21;
  const parts = [];
  const frame = shade(th.wood, -0.12);
  parts.push(h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, hh, 16), fill: frame, stroke: th.ink, 'stroke-width': th.stroke}));
  // caption plate
  let top = y + pad;
  let capNode = null;
  let capBox;
  if (o.caption && showAll) {
    const cf = ctx.fit(o.caption, {maxWidth: w - pad * 2 - 24, size: ps, minSize: 12, maxLines: 3, weight: 700});
    const ch = cf.height + 16;
    capBox = {x: x + pad, y: top, w: w - pad * 2, h: ch};
    capNode = g(null,
      h('path', {d: roundRectPath(x + pad, top, w - pad * 2, ch, 8), fill: shade(th.paper, -0.02), stroke: th.ink, 'stroke-width': 1.6}),
      textBlock(cf, {x: x + w / 2, y: top + 8, anchor: 'middle', fill: th.ink}));
    top += ch + 10;
  } else {
    capBox = {x: x + pad, y: top, w: w - pad * 2, h: 26};
    capNode = h('path', {d: roundRectPath(x + pad, top, w - pad * 2, 26, 8), fill: shade(th.paper, -0.02), stroke: th.ink, 'stroke-width': 1.6});
    top += 36;
  }
  parts.push(capNode);
  const rowsH = y + hh - pad - top;
  const rowH = rowsH / n;
  const rows = [];
  const src = o.sources.map((s, i) => ({...s, i, level: clamp(s.level, 0, n - 1)}));
  let slotBox = null;
  const books = [];
  for (let li = 0; li < n; li++) {
    const ry = top + li * rowH;
    const box = {x: x + pad, y: ry, w: w - pad * 2, h: rowH - 8};
    // tray: recessed floor + front lip
    parts.push(h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 8), fill: shade(th.woodTop, -0.05), stroke: th.ink, 'stroke-width': 1.8}));
    parts.push(h('rect', {x: r(box.x + 3), y: r(box.y + 3), width: r(box.w - 6), height: 7, rx: 3, fill: shade(th.woodTop, -0.2), opacity: 0.6}));
    parts.push(h('rect', {x: r(box.x), y: r(box.y + box.h - 9), width: r(box.w), height: 9, rx: 4, fill: shade(th.wood, -0.05), stroke: th.ink, 'stroke-width': 1.5}));
    const side = box.w / box.h > 2.4;
    // label plate (the author's level label)
    let plate;
    if (side) plate = {x: box.x + 10, y: box.y + 10, w: Math.min(box.w * (o.plateFrac ?? 0.56), 340), h: box.h - 26};
    else plate = {x: box.x + 10, y: box.y + 10, w: box.w - 20, h: Math.min(box.h * 0.38, ps * 3.4)};
    parts.push(h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 5), fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}));
    parts.push(h('circle', {cx: r(plate.x + 8), cy: r(plate.y + plate.h / 2), r: 3.2, fill: th.metalDark}));
    parts.push(h('circle', {cx: r(plate.x + plate.w - 8), cy: r(plate.y + plate.h / 2), r: 3.2, fill: th.metalDark}));
    if (showAll) {
      const lf = ctx.fit(o.levels[li], {maxWidth: plate.w - 28, size: ps * 0.95, minSize: 11, maxLines: Math.max(2, Math.min(3, Math.floor((plate.h - 4) / (ps * 0.95)))), weight: 600});
      parts.push(textBlock(lf, {x: plate.x + plate.w / 2, y: plate.y + (plate.h - lf.height) / 2, anchor: 'middle', fill: th.ink}));
    } else {
      parts.push(h('rect', {x: r(plate.x + plate.w * 0.2), y: r(plate.y + plate.h * 0.4), width: r(plate.w * 0.6), height: r(Math.max(5, plate.h * 0.18)), rx: 3, fill: th.paperLine}));
    }
    // books of this row
    const area = side
      ? {x: plate.x + plate.w + 14, y: box.y + 10, w: box.x + box.w - (plate.x + plate.w + 14) - 10, h: box.h - 26}
      : {x: box.x + 10, y: plate.y + plate.h + 10, w: box.w - 20, h: box.y + box.h - 16 - (plate.y + plate.h + 10)};
    const here = src.filter(s => s.level === li);
    const c = Math.max(1, here.length);
    const gap = 12;
    let bh = Math.min(area.h, 130);
    let bw = bh * 1.38;
    if (c * bw + (c - 1) * gap > area.w) {
      bw = (area.w - (c - 1) * gap) / c;
      bh = Math.min(bh, bw / 1.38);
    }
    const x0 = area.x + (area.w - (c * bw + (c - 1) * gap)) / 2;
    here.forEach((s, k) => {
      const bx = x0 + k * (bw + gap);
      const by = area.y + (area.h - bh) / 2;
      const bbox = {x: bx, y: by, w: bw, h: bh};
      if (s.i === 0) {
        slotBox = bbox;
        parts.push(h('path', {name: `${P}-slotFill`, d: roundRectPath(bx, by, bw, bh, 6), fill: th.accentSoft, opacity: 0}));
        parts.push(h('path', {name: `${P}-slot`, d: roundRectPath(bx, by, bw, bh, 6), fill: 'none', stroke: shade(th.woodTop, -0.45), 'stroke-width': 2.4, 'stroke-dasharray': '8 6'}));
        const sf = showAll ? wholeWordFit(ctx, s.name, {maxWidth: bw - 14, size: Math.max(Math.min(20, bh * 0.26), o.bookMin ?? 0), minSize: o.bookMin ?? 9, maxLines: 3, maxHeight: bh - 8, weight: 600}) : null;
        if (sf) parts.push(textBlock(sf, {x: bx + bw / 2, y: by + (bh - sf.height) / 2, anchor: 'middle', fill: shade(th.woodTop, -0.5)}));
      } else {
        parts.push(g({transform: T(bx, by)}, closedBook(ctx, {w: bw, h: bh, color: sourceColor(ctx, s.i), label: s.name, minText: o.bookMin})));
      }
      books.push({i: s.i, box: bbox});
    });
    rows.push({box, plate, side});
  }
  const slotRow = slotBox ? rows.findIndex(q => slotBox.y >= q.box.y - 1 && slotBox.y + slotBox.h <= q.box.y + q.box.h + 1) : -1;
  return {node: g({name: P}, parts), rows, slotBox, slotRow, books, capBox, box: {x, y, w, h: hh}};
}

/**
 * Editable hierarchy as a shelf whose every supplied text stays readable: each
 * row carries the author's level label on a plate across the row, and under it
 * each book of the row as a small cover with its NAME printed beside it at the
 * same size (never shrunk onto a tiny cover plate). The book being read
 * (sources[0]) leaves a dashed empty slot, its name beside it in a muted tone.
 * Height follows the text: `needH` is returned; callers pick `size` so the
 * shelf fits. Node names match rackArt (`${P}-slot`, `${P}-slotFill`).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, levels:string[], sources:Array<{name:string,level:number}>, caption?:string, size:number, capSize?:number}} o
 */
export function shelfArt(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w} = o;
  const S = o.size;
  const showAll = ctx.show('all');
  const pad = 14;
  const n = o.levels.length;
  const parts = [];
  const body = [];
  let top = y + pad;
  let capBox = null;
  if (o.caption && showAll) {
    const cf = ctx.fit(o.caption, {maxWidth: w - pad * 2 - 24, size: o.capSize ?? S, minSize: (o.capSize ?? S) * 0.9, maxLines: 3, weight: 700});
    capBox = {x: x + pad, y: top, w: w - pad * 2, h: cf.height + 16};
    body.push(h('path', {d: roundRectPath(capBox.x, capBox.y, capBox.w, capBox.h, 8), fill: shade(th.paper, -0.02), stroke: th.ink, 'stroke-width': 1.6}));
    body.push(textBlock(cf, {x: x + w / 2, y: top + 8, anchor: 'middle', fill: th.ink}));
  } else {
    capBox = {x: x + pad, y: top, w: w - pad * 2, h: 26};
    body.push(h('path', {d: roundRectPath(capBox.x, capBox.y, capBox.w, capBox.h, 8), fill: shade(th.paper, -0.02), stroke: th.ink, 'stroke-width': 1.6}));
  }
  top += capBox.h + 10;
  const src = o.sources.map((q, i) => ({...q, i, level: clamp(q.level, 0, n - 1)}));
  const rows = [];
  const books = [];
  let slotBox = null;
  let slotRow = -1;
  const coverW = Math.round(S * 2.1), coverH = Math.round(S * 1.5);
  for (let li = 0; li < n; li++) {
    const box = {x: x + pad, y: top, w: w - pad * 2, h: 0};
    const plate = {x: box.x + 10, y: top + 10, w: box.w - 20, h: 0};
    const lf = showAll ? ctx.fit(o.levels[li], {maxWidth: plate.w - 28, size: S, minSize: S, maxLines: 4, weight: 600}) : null;
    plate.h = lf ? lf.height + 14 : Math.round(S * 1.4);
    let cy = plate.y + plate.h + 10;
    const items = [];
    for (const q of src.filter(q0 => q0.level === li)) {
      const nameW = box.w - 20 - coverW - 14;
      const nf = showAll ? ctx.fit(q.name, {maxWidth: nameW, size: S, minSize: S, maxLines: 4, weight: 700}) : null;
      const ih = Math.max(coverH, nf ? nf.height : 0) + 4;
      items.push({q, nf, bx: box.x + 10, by: cy + (ih - coverH) / 2, ty: cy + (ih - (nf ? nf.height : 0)) / 2, tx: box.x + 10 + coverW + 14, ih});
      cy += ih + 8;
    }
    if (!items.length) cy += 4;
    box.h = cy - top + 10;
    rows.push({box, plate, items});
    top += box.h + 8;
  }
  const needH = top - y + pad - 8;
  parts.push(h('path', {d: roundRectPath(x + 8, y + 12, w, needH, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, needH, 16), fill: shade(th.wood, -0.12), stroke: th.ink, 'stroke-width': th.stroke}));
  rows.forEach((row, li) => {
    const {box, plate} = row;
    body.push(h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 8), fill: shade(th.woodTop, -0.05), stroke: th.ink, 'stroke-width': 1.8}));
    body.push(h('rect', {x: r(box.x), y: r(box.y + box.h - 9), width: r(box.w), height: 9, rx: 4, fill: shade(th.wood, -0.05), stroke: th.ink, 'stroke-width': 1.5}));
    body.push(h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 5), fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}));
    body.push(h('circle', {cx: r(plate.x + 8), cy: r(plate.y + plate.h / 2), r: 3.2, fill: th.metalDark}));
    body.push(h('circle', {cx: r(plate.x + plate.w - 8), cy: r(plate.y + plate.h / 2), r: 3.2, fill: th.metalDark}));
    if (showAll) {
      const lf = ctx.fit(o.levels[li], {maxWidth: plate.w - 28, size: S, minSize: S, maxLines: 4, weight: 600});
      body.push(textBlock(lf, {x: plate.x + plate.w / 2, y: plate.y + 7, anchor: 'middle', fill: th.ink}));
    } else {
      body.push(h('rect', {x: r(plate.x + plate.w * 0.2), y: r(plate.y + plate.h * 0.4), width: r(plate.w * 0.6), height: r(Math.max(5, plate.h * 0.2)), rx: 3, fill: th.paperLine}));
    }
    for (const it of row.items) {
      const bbox = {x: it.bx, y: it.by, w: coverW, h: coverH};
      if (it.q.i === 0) {
        slotBox = bbox;
        slotRow = li;
        body.push(h('path', {name: `${P}-slotFill`, d: roundRectPath(bbox.x, bbox.y, bbox.w, bbox.h, 6), fill: th.accentSoft, opacity: 0}));
        body.push(h('path', {name: `${P}-slot`, d: roundRectPath(bbox.x, bbox.y, bbox.w, bbox.h, 6), fill: 'none', stroke: shade(th.woodTop, -0.45), 'stroke-width': 2.4, 'stroke-dasharray': '8 6'}));
        if (it.nf) body.push(textBlock(it.nf, {x: it.tx, y: it.ty, fill: shade(th.woodTop, -0.6)}));
      } else {
        body.push(g({transform: T(bbox.x, bbox.y)}, closedBook(ctx, {w: coverW, h: coverH, color: sourceColor(ctx, it.q.i), label: null})));
        if (it.nf) body.push(textBlock(it.nf, {x: it.tx, y: it.ty, fill: th.ink}));
      }
      // the name belongs to its book: the book box spans cover + name
      books.push({i: it.q.i, box: bbox, nameBox: it.nf ? {x: it.tx, y: it.ty, w: it.nf.width, h: it.nf.height} : null});
    }
  });
  return {node: g({name: P}, parts, body), rows, slotBox, slotRow, books, capBox, box: {x, y, w, h: needH}, needH};
}

/**
 * Editable hierarchy as a low, wide shelf: the author's caption on a plaque at
 * the left, then one compartment per supplied level, first → last from left to
 * right. Each compartment carries its books at the top (small cover + NAME at
 * the content size) and the author's level label on a plate below them. The
 * book being read (sources[0]) leaves a dashed empty slot at the top of its
 * compartment, so a ribbon can enter it straight from above. Every supplied
 * text is printed at `size`; the height follows the text (`needH`).
 * Node names match rackArt (`${P}-slot`, `${P}-slotFill`).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, levels:string[], sources:Array<{name:string,level:number}>, caption?:string, size:number, capW:number}} o
 */
export function shelfRowArt(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w} = o;
  const S = o.size;
  const showAll = ctx.show('all');
  const pad = 12;
  const n = o.levels.length;
  const gapC = 10;
  const capW = o.capW;
  const cw = (w - pad * 2 - capW - gapC * n) / n;
  const coverW = Math.round(S * 1.9), coverH = Math.round(S * 1.4);
  const src = o.sources.map((q, i) => ({...q, i, level: clamp(q.level, 0, n - 1)}));
  const cols = [];
  for (let li = 0; li < n; li++) {
    const cx0 = x + pad + capW + gapC + li * (cw + gapC);
    const items = [];
    let cy = y + pad + 10;
    for (const q of src.filter(q0 => q0.level === li)) {
      const nf = showAll ? ctx.fit(q.name, {maxWidth: cw - 24 - coverW - 10, size: S, minSize: S, maxLines: 4, weight: 700}) : null;
      const ih = Math.max(coverH, nf ? nf.height : 0);
      items.push({q, nf, bx: cx0 + 10, by: cy + (ih - coverH) / 2, tx: cx0 + 10 + coverW + 10, ty: cy + (ih - (nf ? nf.height : 0)) / 2});
      cy += ih + 8;
    }
    if (!items.length) cy += coverH + 8;
    const lf = showAll ? ctx.fit(o.levels[li], {maxWidth: cw - 36, size: S, minSize: S, maxLines: 5, weight: 600}) : null;
    const plateH = lf ? lf.height + 14 : Math.round(S * 1.4);
    cols.push({cx0, items, lf, plateY: cy + 4, plateH, bottom: cy + 4 + plateH + 10});
  }
  let capF = null;
  if (o.caption && showAll) capF = ctx.fit(o.caption, {maxWidth: capW - 24, size: S, minSize: S, maxLines: 6, weight: 700});
  const innerBottom = Math.max(...cols.map(c => c.bottom), y + pad + (capF ? capF.height + 16 : 40));
  const needH = innerBottom + 9 + pad - y;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(x + 8, y + 12, w, needH, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, needH, 16), fill: shade(th.wood, -0.12), stroke: th.ink, 'stroke-width': th.stroke}));
  const capBox = {x: x + pad, y: y + pad, w: capW, h: needH - pad * 2};
  parts.push(h('path', {d: roundRectPath(capBox.x, capBox.y, capBox.w, capBox.h, 8), fill: shade(th.paper, -0.02), stroke: th.ink, 'stroke-width': 1.6}));
  if (capF) parts.push(textBlock(capF, {x: capBox.x + capW / 2, y: capBox.y + (capBox.h - capF.height) / 2, anchor: 'middle', fill: th.ink}));
  else parts.push(h('rect', {x: r(capBox.x + capW * 0.2), y: r(capBox.y + capBox.h / 2 - 4), width: r(capW * 0.6), height: 8, rx: 4, fill: th.paperLine}));
  const rows = [];
  const books = [];
  let slotBox = null, slotRow = -1;
  cols.forEach((c, li) => {
    const box = {x: c.cx0, y: y + pad, w: cw, h: needH - pad * 2};
    parts.push(h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 8), fill: shade(th.woodTop, -0.05), stroke: th.ink, 'stroke-width': 1.8}));
    parts.push(h('rect', {x: r(box.x), y: r(box.y + box.h - 9), width: r(box.w), height: 9, rx: 4, fill: shade(th.wood, -0.05), stroke: th.ink, 'stroke-width': 1.5}));
    const plate = {x: box.x + 8, y: c.plateY, w: box.w - 16, h: c.plateH};
    parts.push(h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 5), fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}));
    parts.push(h('circle', {cx: r(plate.x + 8), cy: r(plate.y + plate.h / 2), r: 3.2, fill: th.metalDark}));
    parts.push(h('circle', {cx: r(plate.x + plate.w - 8), cy: r(plate.y + plate.h / 2), r: 3.2, fill: th.metalDark}));
    if (c.lf) parts.push(textBlock(c.lf, {x: plate.x + plate.w / 2, y: plate.y + 7, anchor: 'middle', fill: th.ink}));
    else parts.push(h('rect', {x: r(plate.x + plate.w * 0.2), y: r(plate.y + plate.h * 0.4), width: r(plate.w * 0.6), height: r(Math.max(5, plate.h * 0.2)), rx: 3, fill: th.paperLine}));
    for (const it of c.items) {
      const bbox = {x: it.bx, y: it.by, w: coverW, h: coverH};
      if (it.q.i === 0) {
        slotBox = bbox;
        slotRow = li;
        parts.push(h('path', {name: `${P}-slotFill`, d: roundRectPath(bbox.x, bbox.y, bbox.w, bbox.h, 6), fill: th.accentSoft, opacity: 0}));
        parts.push(h('path', {name: `${P}-slot`, d: roundRectPath(bbox.x, bbox.y, bbox.w, bbox.h, 6), fill: 'none', stroke: shade(th.woodTop, -0.45), 'stroke-width': 2.4, 'stroke-dasharray': '8 6'}));
        if (it.nf) parts.push(textBlock(it.nf, {x: it.tx, y: it.ty, fill: shade(th.woodTop, -0.6)}));
      } else {
        parts.push(g({transform: T(bbox.x, bbox.y)}, closedBook(ctx, {w: coverW, h: coverH, color: sourceColor(ctx, it.q.i), label: null})));
        if (it.nf) parts.push(textBlock(it.nf, {x: it.tx, y: it.ty, fill: th.ink}));
      }
      books.push({i: it.q.i, box: bbox, nameBox: it.nf ? {x: it.tx, y: it.ty, w: it.nf.width, h: it.nf.height} : null});
    }
    rows.push({box, plate});
  });
  return {node: g({name: P}, parts), rows, slotBox, slotRow, books, capBox, box: {x, y, w, h: needH}, needH};
}

/** Name plate for a book whose page identity is not printed on its small pages. */
export function bookPlate(ctx, o) {
  const th = ctx.theme;
  const lines = [o.source.name, o.source.title].filter(Boolean);
  const nf = ctx.fit(lines[0] || '', {maxWidth: o.w - 24, size: o.size, minSize: o.size, maxLines: 3, weight: 700});
  const tf = lines[1] ? ctx.fit(lines[1], {maxWidth: o.w - 24, size: o.size, minSize: o.size, maxLines: 4, weight: 600, family: 'serif'}) : null;
  const gap = o.size * 0.4;
  const hh = 12 + nf.height + (tf ? gap + tf.height : 0) + 12;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(o.x + 4, o.y + 6, o.w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, hh, 8), fill: th.paper, stroke: shade(o.color, -0.2), 'stroke-width': 2.5}),
    h('rect', {x: r(o.x), y: r(o.y), width: 8, height: r(hh), rx: 4, fill: o.color}),
    ctx.show('all') ? textBlock(nf, {x: o.x + 18, y: o.y + 12, fill: th.inkSoft}) : null,
    ctx.show('all') && tf ? textBlock(tf, {x: o.x + 18, y: o.y + 12 + gap + nf.height, fill: th.ink}) : null,
    // labels hidden: the plate keeps two bars where its name and title are
    ctx.show('all') ? null : g(null,
      h('rect', {x: r(o.x + 18), y: r(o.y + 12 + nf.height * 0.3), width: r(Math.min(o.w - 36, o.size * 4)), height: r(o.size * 0.45), rx: 4, fill: th.paperLine}),
      tf ? h('rect', {x: r(o.x + 18), y: r(o.y + 12 + gap + nf.height + tf.lineHeight * 0.3), width: r(Math.min(o.w - 36, o.size * 7)), height: r(o.size * 0.45), rx: 4, fill: shade(th.paperLine, -0.2)}) : null));
  return {node, box: {x: o.x, y: o.y, w: o.w, h: hh}};
}

/* ------------------------------------------------------------------ */
/* Magnifier                                                            */
/* ------------------------------------------------------------------ */

/**
 * Hand magnifier drawn around its lens centre, handle along local +x.
 * Returns the head (glass tint + rim) and handle as separate layers so the
 * stage can draw the magnified copy between them and put the thumb on top.
 * @param {any} ctx
 * @param {{name:string, R:number}} o
 */
export function lupaArt(ctx, o) {
  const th = ctx.theme;
  const R = o.R;
  const rim = Math.max(8, R * 0.17);
  const fer = R * 0.32;
  const hl = R * (o.handle ?? 1.6);
  const hw = R * 0.34;
  const arc = (rad, a0, a1) => {
    const p = a => ({x: Math.cos((a * Math.PI) / 180) * rad, y: Math.sin((a * Math.PI) / 180) * rad});
    const s = p(a0), e = p(a1);
    return `M${r(s.x)} ${r(s.y)}A${r(rad)} ${r(rad)} 0 0 1 ${r(e.x)} ${r(e.y)}`;
  };
  const tint = g(null,
    h('circle', {r: r(R - rim * 0.4), fill: '#d7ecf8', opacity: 0.2}),
    h('path', {d: arc(R * 0.7, 196, 246), fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.075), 'stroke-linecap': 'round', opacity: 0.8}),
    h('path', {d: arc(R * 0.7, 256, 266), fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.075), 'stroke-linecap': 'round', opacity: 0.8}),
  );
  const ring = g(null,
    h('circle', {r: r(R), fill: 'none', stroke: th.ink, 'stroke-width': r(rim + 4.5)}),
    h('circle', {r: r(R), fill: 'none', stroke: '#3f4a55', 'stroke-width': r(rim)}),
    h('circle', {r: r(R + rim * 0.18), fill: 'none', stroke: '#9aa6b0', 'stroke-width': r(rim * 0.28)}),
    h('circle', {r: r(R - rim * 0.36), fill: 'none', stroke: '#2a3138', 'stroke-width': 1.5}),
  );
  const handle = g(null,
    h('path', {d: roundRectPath(R + rim * 0.3, -hw * 0.44, fer + 6, hw * 0.88, 4), fill: th.metal, stroke: th.ink, 'stroke-width': 2.4}),
    h('line', {x1: r(R + rim * 0.3 + fer * 0.35), x2: r(R + rim * 0.3 + fer * 0.35), y1: r(-hw * 0.44), y2: r(hw * 0.44), stroke: th.metalDark, 'stroke-width': 2}),
    h('path', {d: roundRectPath(R + rim * 0.3 + fer, -hw / 2, hl, hw, hw / 2), fill: '#6d4a32', stroke: th.ink, 'stroke-width': 2.4}),
    h('line', {x1: r(R + rim * 0.3 + fer + hw * 0.5), x2: r(R + rim * 0.3 + fer + hl - hw * 0.5), y1: r(-hw * 0.2), y2: r(-hw * 0.2), stroke: '#a57b58', 'stroke-width': r(hw * 0.16), 'stroke-linecap': 'round'}),
  );
  const shadow = g(null,
    h('circle', {r: r(R + rim * 0.5), fill: th.shadow}),
    h('path', {d: roundRectPath(R, -hw / 2, fer + hl, hw, hw / 2), fill: th.shadow}),
  );
  return {tint, ring, handle, shadow, R, glassR: R - rim * 0.45, grip: R + rim * 0.3 + fer + hl * 0.4, length: R + rim * 0.3 + fer + hl};
}

/* ------------------------------------------------------------------ */
/* Reading card                                                         */
/* ------------------------------------------------------------------ */

/** Small icon: isolated = ring around one word bar; contextual = page of bars with a frame. */
function readingIcon(ctx, kind, s, color) {
  const th = ctx.theme;
  if (kind === 'isolated') {
    return g(null,
      h('circle', {cx: s / 2, cy: s / 2, r: r(s * 0.46), fill: th.paper, stroke: color, 'stroke-width': 3}),
      h('rect', {x: r(s * 0.24), y: r(s * 0.42), width: r(s * 0.52), height: r(s * 0.16), rx: r(s * 0.08), fill: shade(color, -0.2)}),
    );
  }
  return g(null,
    h('rect', {x: r(s * 0.12), y: r(s * 0.04), width: r(s * 0.76), height: r(s * 0.92), rx: 3, fill: th.paper, stroke: color, 'stroke-width': 3}),
    [0.22, 0.38, 0.54, 0.7].map((yy, i) => h('rect', {x: r(s * 0.24), y: r(s * yy), width: r(s * (i === 1 ? 0.24 : 0.52)), height: r(s * 0.08), rx: 1.5, fill: i === 1 ? shade(color, -0.2) : th.paperLine})),
    h('rect', {x: r(s * 0.5), y: r(s * 0.38), width: r(s * 0.26), height: r(s * 0.08), rx: 1.5, fill: th.paperLine}),
  );
}

/**
 * Attributed reading card. Title = key label; reading + attribution = all.
 * With labels hidden it keeps its colour, icon and bars.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, kind:'isolated'|'contextual', title:string, text:string, by:string, proposedBy:string, color:string, soft:string, size?:number, maxLines?:number}} o
 */
export function readingCard(ctx, o) {
  const th = ctx.theme;
  const S = o.size ?? 26;
  const pad = S * 0.6;
  const icon = S * 1.5;
  const innerW = o.w - pad * 2;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const parts = [];
  let y = pad;
  // o.noTitle (opt-in): no title row (the card hangs under a header that names it)
  const tf = showKey && !o.noTitle ? ctx.fit(o.title, {maxWidth: innerW - icon - S * 0.5, size: S, minSize: S * 0.78, maxLines: 2, weight: 700}) : null;
  const titleH = o.noTitle ? 0 : Math.max(icon, tf ? tf.height : 0);
  const body = [];
  if (!o.noTitle) {
    if (tf) body.push(textBlock(tf, {x: pad + icon + S * 0.5, y: y + (titleH - tf.height) / 2, fill: shade(o.color, -0.35)}));
    else body.push(h('rect', {x: r(pad + icon + S * 0.5), y: r(y + titleH * 0.35), width: r(innerW * 0.5), height: r(S * 0.5), rx: 4, fill: shade(o.color, -0.1)}));
    body.push(g({transform: T(pad, y + (titleH - icon) / 2)}, readingIcon(ctx, o.kind, icon, o.color)));
    y += titleH + S * 0.45;
    body.push(h('line', {x1: r(pad), x2: r(o.w - pad), y1: r(y - S * 0.2), y2: r(y - S * 0.2), stroke: o.color, 'stroke-width': 2, opacity: 0.6}));
  }
  if (showAll) {
    const rf = ctx.fit(o.text, {maxWidth: innerW, size: S * 0.95, minSize: S * (o.textMin ?? 0.72), maxLines: o.maxLines ?? 3, weight: 500, family: 'serif'});
    body.push(textBlock(rf, {x: pad, y: y + S * 0.1, fill: th.ink, italic: true}));
    y += rf.height + S * 0.55;
    const bf = ctx.fit(`${o.proposedBy} ${o.by}`, {maxWidth: innerW, size: S * (o.bySize ?? 0.86), minSize: S * (o.byMin ?? 0.7), maxLines: o.byLines ?? 2, weight: 500});
    body.push(textBlock(bf, {x: pad, y, fill: th.inkSoft}));
    y += bf.height + (o.extra ? S * 0.45 : pad);
    if (o.extra) {
      const ef = ctx.fit(o.extra, {maxWidth: innerW, size: S * 0.86, minSize: S * 0.7, maxLines: 2, weight: 700});
      body.push(textBlock(ef, {x: pad, y, fill: shade(o.extraColor || o.color, -0.3)}));
      y += ef.height + pad;
    }
  } else {
    body.push(h('rect', {x: r(pad), y: r(y + S * 0.2), width: r(innerW * 0.9), height: r(S * 0.4), rx: 4, fill: th.paperLine}));
    body.push(h('rect', {x: r(pad), y: r(y + S * 0.95), width: r(innerW * 0.6), height: r(S * 0.4), rx: 4, fill: th.paperLine}));
    y += S * 1.7 + pad;
  }
  const hh = y;
  parts.push(h('path', {d: roundRectPath(6, 9, o.w, hh, 12), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, o.w, hh, 12), fill: th.card, stroke: shade(o.color, -0.25), 'stroke-width': 2.5}));
  if (o.noTitle) parts.push(h('path', {d: `M0 12Q0 0 12 0H${r(o.w - 12)}Q${r(o.w)} 0 ${r(o.w)} 12V${r(Math.min(hh, 16))}H0Z`, fill: o.soft, opacity: 0.9}));
  else parts.push(h('path', {d: `M0 12Q0 0 12 0H${r(o.w - 12)}Q${r(o.w)} 0 ${r(o.w)} 12V${r(Math.min(hh, titleH + pad * 1.6))}H0Z`, fill: o.soft, opacity: 0.9}));
  const node = g({name: o.name, transform: T(o.x, o.y), opacity: 0}, parts, body);
  return {node, box: {x: o.x, y: o.y, w: o.w, h: hh}, h: hh};
}

/* ------------------------------------------------------------------ */
/* Small draw-on helpers                                                */
/* ------------------------------------------------------------------ */

/** A rounded-rect outline that draws on (stroke-dashoffset). */
export function drawRect(name, box, rad, stroke, width = 3, dash = null) {
  const per = 2 * (box.w + box.h);
  const d = roundRectPath(box.x, box.y, box.w, box.h, rad);
  return {
    node: h('path', {name, d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-dasharray': dash ? undefined : `${r(per)} ${r(per + 20)}`, 'stroke-dashoffset': dash ? undefined : r(per), opacity: 0}),
    frame: p => (dash ? {[name]: {opacity: clamp(p * 3)}} : {[name]: {'stroke-dashoffset': r(per * (1 - clamp(p))), opacity: p > 0 ? 1 : 0}}),
  };
}

/** Leader line from a box edge to a target point, drawn on. */
export function leader(name, fromBox, target, color, width = 2.5, side = null) {
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const B = fromBox;
  const from = side === 'left' ? {x: B.x - 2, y: cl(target.y, B.y + 18, B.y + B.h - 18)}
    : side === 'right' ? {x: B.x + B.w + 2, y: cl(target.y, B.y + 18, B.y + B.h - 18)}
    : side === 'top' ? {x: cl(target.x, B.x + 18, B.x + B.w - 18), y: B.y - 2}
    : side === 'bottom' ? {x: cl(target.x, B.x + 18, B.x + B.w - 18), y: B.y + B.h + 2}
    : edgeAnchor(fromBox, target, 2);
  const len = Math.hypot(target.x - from.x, target.y - from.y);
  return {
    node: g({name, opacity: 0},
      h('line', {name: `${name}-l`, x1: r(from.x), y1: r(from.y), x2: r(target.x), y2: r(target.y), stroke: color, 'stroke-width': width, 'stroke-dasharray': `${r(len)} ${r(len + 8)}`, 'stroke-dashoffset': r(len)}),
      h('circle', {name: `${name}-d`, cx: r(target.x), cy: r(target.y), r: 6.5, fill: color, stroke: '#ffffff', 'stroke-width': 2.2, opacity: 0})),
    frame: p => ({[name]: {opacity: p > 0 ? 1 : 0}, [`${name}-l`]: {'stroke-dashoffset': r(len * (1 - clamp(p)))}, [`${name}-d`]: {opacity: p >= 0.98 ? 1 : 0}}),
    from,
    pts: [from, target],
    length: len,
  };
}

/** Elbow leader through points (first = chip edge), drawn on. */
export function polyLeader(name, pts, color, width = 2.5, dotR = 6.5) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  const end = pts[pts.length - 1];
  return {
    node: g({name, opacity: 0},
      h('path', {name: `${name}-l`, d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 8)}`, 'stroke-dashoffset': r(len)}),
      h('circle', {name: `${name}-d`, cx: r(end.x), cy: r(end.y), r: dotR, fill: color, stroke: '#ffffff', 'stroke-width': 2.2, opacity: 0})),
    frame: p => ({[name]: {opacity: p > 0 ? 1 : 0}, [`${name}-l`]: {'stroke-dashoffset': r(len * (1 - clamp(p)))}, [`${name}-d`]: {opacity: p >= 0.98 ? 1 : 0}}),
    pts,
    length: len,
  };
}

/* ------------------------------------------------------------------ */
/* Compact desk article (opt-in): key line as text, the rest as props   */
/* ------------------------------------------------------------------ */

/**
 * Article laid out for a small desk prop: the line that holds the key word is
 * real text at `size`; every other line (heading, the rest of the key
 * passage, the other passages) is a simulated prop line (word bars at the
 * same word positions), drawn smaller when space is short. The full supplied
 * wording must be readable elsewhere (e.g. a shared strip). Occurrence boxes
 * are exact at each line's own size. Same shape as articleLayout().
 * @param {any} ctx
 * @param {{x:number,y:number,w:number,h:number,heading:string,lines:string[],word:string,wordPassage?:number,size:number}} o
 */
export function compactArticleLayout(ctx, o) {
  const {x, y, w, h: hh} = o;
  const S = o.size;
  // (passage numbers are small dots on the prop page: a narrow gutter)
  const numW = Math.round(S * 0.7);
  const tw = w - numW;
  const lines = o.lines.map(t => String(t).replace(/\s+/g, ' ').trim());
  const kp = clamp(o.wordPassage ?? 0, 0, lines.length - 1);
  const keyWrap = wrap(lines[kp], tw, S, 400, 'serif');
  const hasKey = keyWrap.some(t => findAll(t, o.word).length);
  const keyJ = Math.max(0, keyWrap.findIndex(t => findAll(t, o.word).length));
  // only the key line is large text; the rest of its passage (before / after
  // it) and every other passage are prop lines at the bar size bs
  const plan = bs => {
    const head = o.heading ? wrap(o.heading, w, bs * 1.15, 700, 'serif').slice(0, 2) : [];
    const pass = lines.map((t, i) => {
      if (i !== kp) return wrap(t, tw, bs, 400, 'serif').map(text => ({text, size: bs}));
      const pre = keyWrap.slice(0, keyJ).join(' '), post = keyWrap.slice(keyJ + 1).join(' ');
      return [...(pre ? wrap(pre, tw, bs, 400, 'serif') : []).map(text => ({text, size: bs})), {text: keyWrap[keyJ], size: S, isKey: true},
        ...(post ? wrap(post, tw, bs, 400, 'serif') : []).map(text => ({text, size: bs}))];
    });
    const headH = head.length ? head.length * bs * 1.15 * 1.3 + S * 0.5 : 0;
    const height = () => headH + pass.reduce((a, ls) => a + ls.reduce((b, l) => b + l.size * LEAD, 0), 0) + (lines.length - 1) * S * PGAP * 0.7;
    return {head, pass, headH, height};
  };
  let bs = S * 0.62;
  let pl = plan(bs);
  while (pl.height() > hh && bs > S * 0.36) { bs -= 0.5; pl = plan(bs); }
  // still too tall: drop prop lines from the longest passage (never the key line)
  while (pl.height() > hh) {
    let li = -1;
    pl.pass.forEach((ls, i) => { if (ls.filter(l => !l.isKey).length > (i === kp ? 0 : 1) && (li < 0 || ls.length > pl.pass[li].length)) li = i; });
    if (li < 0) break;
    const ls = pl.pass[li];
    const j = ls.length - 1 - [...ls].reverse().findIndex(l => !l.isKey);
    ls.splice(j, 1);
  }
  const headSize = bs * 1.15;
  const head = {lines: pl.head, height: pl.head.length * headSize * 1.3, size: headSize, lineHeight: headSize * 1.3, width: Math.max(0, ...pl.head.map(t => measure(t, headSize, 700, 'serif'))), truncated: false, full: o.heading || '', weight: 700, family: 'serif'};
  let cursor = y + pl.headH;
  const passages = [];
  const occ = [];
  pl.pass.forEach((ls, i) => {
    const y0 = cursor;
    let top = y0;
    const recs = ls.map((ln, j) => {
      const sz = ln.size;
      const lx = x + numW;
      const rec = {text: ln.text, x: lx, y: top, w: measure(ln.text, sz, 400, 'serif'), occ: [], size: sz, isKey: Boolean(ln.isKey)};
      for (const idx of findAll(ln.text, o.word)) {
        const len = String(o.word).trim().length;
        const ox = lx + measure(ln.text.slice(0, idx), sz, 400, 'serif');
        const ow = measure(ln.text.slice(idx, idx + len), sz, 400, 'serif');
        rec.occ.push(occ.length);
        occ.push({p: i, j, idx, len, x: ox, y: top, w: ow, h: sz, cx: ox + ow / 2, cy: top + sz * 0.45, text: ln.text.slice(idx, idx + len), key: false, size: sz, onKeyLine: Boolean(ln.isKey)});
      }
      top += sz * LEAD;
      return rec;
    });
    const maxW = Math.max(...recs.map(l => l.w));
    const last = recs[recs.length - 1];
    const yEnd = last.y + last.size;
    passages.push({i, y0, y1: yEnd, yReserved: yEnd, lines: recs, box: {x: x + numW, y: y0 - recs[0].size * 0.25, w: maxW, h: yEnd - y0 + recs[0].size * 0.5}, full: lines[i], size: recs[0].size});
    cursor = top + S * PGAP * 0.7;
  });
  let key = occ.find(q => q.onKeyLine) || null;
  if (!key) {
    const KL = passages[kp].lines.find(l => l.isKey) || passages[kp].lines[0];
    const first = (KL.text.match(/^\S+/) || [''])[0];
    const ow = measure(first, KL.size, 400, 'serif');
    key = {p: kp, j: 0, idx: 0, len: first.length, x: KL.x, y: KL.y, w: ow, h: KL.size, cx: KL.x + ow / 2, cy: KL.y + KL.size * 0.45, text: first, synthetic: true, size: KL.size};
    occ.push(key);
    KL.occ.push(occ.length - 1);
  }
  key.key = true;
  const bottom = cursor - S * PGAP * 0.7;
  return {x, y, w, h: hh, size: S, barSize: bs, pitch: S * LEAD, numW, head, headY: y, passages, occ, key, keyIndex: occ.indexOf(key), found: hasKey, truncated: false, box: {x, y, w, h: bottom - y}, kp, compact: true};
}

/**
 * Art for compactArticleLayout(): the key line as text (key word node
 * `${P}-kw`), all other lines, the heading and the passage numbers as prop
 * bars; occurrence highlights `${P}-h${i}` under the text.
 */
export function compactArticleArt(ctx, AL, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const mk = o.mark || '';
  const rest = [];
  const hl = [];
  let keyNode = null;
  const barFill = th.paperLine;
  const inkBar = shade(th.paperLine, -0.25);
  AL.head.lines.forEach((ln, j) => rest.push(...wordBars(ln, AL.x, AL.headY + j * AL.head.lineHeight, AL.head.size, 'serif', 700, inkBar)));
  for (const pas of AL.passages) {
    const L0 = pas.lines[0];
    rest.push(h('circle', {cx: r(AL.x + AL.numW * 0.32), cy: r(L0.y + L0.size * 0.52), r: r(Math.max(2.5, L0.size * 0.17)), fill: inkBar}));
    for (const ln of pas.lines) {
      const sz = ln.size;
      const cuts = ln.occ.map(k => AL.occ[k]).sort((a, b) => a.idx - b.idx);
      let at = 0;
      const pieces = [];
      for (const q of cuts) {
        if (q.idx > at) pieces.push({a: at, b: q.idx});
        pieces.push({a: q.idx, b: q.idx + q.len, q});
        at = q.idx + q.len;
      }
      if (at < ln.text.length) pieces.push({a: at, b: ln.text.length});
      for (const pc of pieces) {
        const raw = ln.text.slice(pc.a, pc.b);
        const lead = raw.length - raw.trimStart().length;
        const text = raw.trim();
        if (!text) continue;
        const px = ln.x + measure(ln.text.slice(0, pc.a + lead), sz, 400, 'serif');
        if (pc.q) {
          const qi = AL.occ.indexOf(pc.q);
          const isKey = pc.q.key;
          hl.push(h('rect', {name: `${P}-h${qi}`, x: r(pc.q.x - 4), y: r(pc.q.y - sz * 0.12), width: r(pc.q.w + 8), height: r(sz * 1.18), rx: r(sz * 0.22),
            fill: isKey ? th.accent3Soft : th.accent2Soft, stroke: isKey ? shade(th.accent3, -0.1) : th.accent2, 'stroke-width': 1.6, opacity: 0}));
          if (isKey) {
            keyNode = g({name: `${P}-kw`}, showKey ? piecePlain(mk + text, px, ln.y, sz, th.ink, 400) : wordBars(text, px, ln.y, sz, 'serif', 400, shade(th.accent3, -0.35)));
            continue;
          }
          if (ln.isKey && showAll) rest.push(piecePlain(mk + text, px, ln.y, sz, th.ink));
          else rest.push(...wordBars(text, px, ln.y, sz, 'serif', 400, inkBar));
          continue;
        }
        if (ln.isKey && showAll) rest.push(piecePlain(mk + text, px, ln.y, sz, th.ink));
        else rest.push(...wordBars(text, px, ln.y, sz, 'serif', 400, barFill));
      }
    }
  }
  return {hl: g(null, hl), rest: g({name: `${P}-rest`}, rest), key: keyNode || g({name: `${P}-kw`})};
}

/* ------------------------------------------------------------------ */
/* Leader geometry checks (used by layouts and asserted by the tests)   */
/* ------------------------------------------------------------------ */

/** Whether segment a→b meets box B (inflated by pad). Liang–Barsky clip. */
export function segHitsBox(a, b, B, pad = 0) {
  const x0 = B.x - pad, x1 = B.x + B.w + pad, y0 = B.y - pad, y1 = B.y + B.h + pad;
  const dx = b.x - a.x, dy = b.y - a.y;
  let t0 = 0, t1 = 1;
  for (const [pp, q] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]]) {
    if (pp === 0) { if (q < 0) return false; continue; }
    const t = q / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}

/** Number of (segment, box) contacts of a polyline with a list of boxes. */
export function pathHits(pts, boxes, pad = 0) {
  let n = 0;
  for (let i = 1; i < pts.length; i++) for (const B of boxes) if (segHitsBox(pts[i - 1], pts[i], B, pad)) n++;
  return n;
}

/**
 * Glyph boxes of an article layout: heading block, passage numbers and every
 * printed line (from the cap height to the descenders), in layout coordinates.
 */
export function articleTextBoxes(AL) {
  const s = AL.size;
  const out = [];
  if (AL.head.lines.length) out.push({x: AL.x, y: AL.headY, w: AL.head.width, h: AL.head.height, kind: 'heading'});
  for (const pas of AL.passages) {
    const L0 = pas.lines[0];
    out.push({x: AL.x + AL.numW * 0.1, y: L0.y + s * 0.2, w: s * 0.5, h: s * 0.62, kind: 'number', p: pas.i});
    pas.lines.forEach((ln, j) => out.push({x: ln.x, y: ln.y + s * 0.06, w: ln.w, h: s * 0.97, kind: 'line', p: pas.i, j}));
  }
  return out;
}

/**
 * Leader from a label placed on the LEFT page to the key word of the stage's
 * article that never crosses article text: it crosses the gutter in a lane
 * left of the article frame and reaches the word through the blank band under
 * its line, ending right under the word. When the word sits on the last line
 * of its passage (the passage ring hugs that line), the band under the ring is
 * used and the leader ends on the ring edge right under the word.
 * @param {{AL:any, pg:any, aBox:any}} stage
 * @param {{x:number,y:number,w:number,h:number}} box label box (left of the gutter)
 */
export function wordLeaderPts(stage, box) {
  const AL = stage.AL;
  const k = AL.key;
  const s = AL.size;
  const pas = AL.passages[k.p];
  const last = k.j === pas.lines.length - 1;
  const ringBottom = pas.box.y + pas.box.h + 4;
  const next = AL.passages[k.p + 1];
  const nextTop = next ? next.y0 + s * 0.06 : ringBottom + s * 0.9;
  const yg = last ? (ringBottom + nextTop) / 2 : k.y + s * 1.3;
  const laneX = (stage.pg.gutterX + stage.aBox.x) / 2;
  const y0 = clamp(yg, box.y + 14, box.y + box.h - 14);
  const pts = [{x: box.x + box.w + 2, y: y0}];
  if (Math.abs(y0 - yg) > 1) pts.push({x: laneX, y: y0}, {x: laneX, y: yg});
  pts.push({x: k.cx, y: yg});
  if (last) pts.push({x: k.cx, y: ringBottom + 1.5});
  return pts;
}

/* ------------------------------------------------------------------ */
/* Reading desk stage                                                   */
/* ------------------------------------------------------------------ */

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {
  horizontal: {w: 1900, h: 900},
  square: {w: 1180, h: 960},
  vertical: {w: 1000, h: 1420},
  panelWide: {w: 920, h: 660},
  panelNarrow: {w: 640, h: 900},
  // wide panel with a shallower lower band (stacked contrast panels on tall frames)
  panelTall: {w: 920, h: 584},
  // contrast lanes (opt-in): side by side on wide frames, stacked on tall ones,
  // a long low band when stacked on square frames
  laneWide: {w: 920, h: 440},
  laneTall: {w: 1000, h: 440},
  laneBand: {w: 1240, h: 340},
  laneSquare: {w: 920, h: 560},
};

/**
 * Geometry per axis. rack/book: [x,y,w,h]; lupa: rest centre; R: lens
 * radius; handRest: free hand position; shoulder: off-frame shoulder;
 * size: article body size; bend: elbow side.
 */
const GEO = {
  horizontal: {rack: [34, 60, 318, 720], book: [384, 58, 910, 700], lupa: [1450, 640], R: 82, restAngle: 42, handRest: [1620, 760], shoulder: [1600, 1060], size: 31, bend: 1,
    arm: {upper: 430, lower: 400, width: 58, handScale: 1.35}, cards: [1340, 40, 526]},
  square: {rack: [24, 40, 252, 560], book: [296, 40, 860, 560], lupa: [1004, 790], R: 70, restAngle: 40, restSlide: 34, shoulder: [1120, 1100], size: 27, bend: 1,
    arm: {upper: 400, lower: 380, width: 54, handScale: 1.3}, cards: [24, 626, 440]},
  // portrait: the arm comes in from the bottom-right corner (shoulder off-frame
  // below the desk), never over the book; at rest the lens lies right of the
  // rack with its handle pointing at that corner, fully inside the desk
  vertical: {rack: [28, 1000, 560, 400], book: [36, 250, 928, 640], lupa: [736, 1056], R: 78, restAngle: 32, restSlide: 36, shoulder: [1110, 1460], size: 30, bend: -1,
    arm: {upper: 470, lower: 440, width: 56, handScale: 1.3}, cards: [28, 26, 460]},
  panelWide: {rack: [14, 14, 236, 430], book: [262, 14, 644, 430], lupa: [735, 560], R: 50, restAngle: 15, handRest: [860, 612], shoulder: [990, 790], size: 21, bend: 1,
    arm: {upper: 350, lower: 330, width: 42, handScale: 1.25}, card: [14, 462, 600]},
  panelTall: {rack: [14, 14, 236, 430], book: [262, 14, 644, 430], lupa: [770, 516], R: 48, restAngle: 18, restSlide: 30, shoulder: [1010, 730], size: 21, bend: 1,
    arm: {upper: 350, lower: 330, width: 42, handScale: 1.25}, card: [14, 450, 660]},
  panelNarrow: {rack: [14, 450, 360, 298], book: [14, 14, 612, 430], lupa: [486, 556], R: 48, restAngle: 30, restSlide: 30, shoulder: [830, 660], size: 20, bend: -1, plateFrac: 0.68, plateSize: 16,
    arm: {upper: 300, lower: 280, width: 42, handScale: 1.25}, card: [14, 758, 612]},
  // (lane desks: the reader's arm comes in from the right edge at desk height,
  // so the hand stays inside the desk while raising, sweeping and resting)
  laneWide: {rack: [14, 14, 170, 412], book: [196, 14, 560, 412], lupa: [835, 300], R: 58, restAngle: 25, restSlide: 20, shoulder: [1200, 290], size: 22, bend: -1,
    arm: {upper: 400, lower: 380, width: 42, handScale: 1.25}},
  laneTall: {rack: [14, 14, 180, 412], book: [212, 14, 620, 412], lupa: [908, 290], R: 58, restAngle: 25, restSlide: 20, shoulder: [1280, 290], size: 22, bend: -1,
    arm: {upper: 420, lower: 400, width: 44, handScale: 1.25}},
  laneSquare: {rack: [14, 14, 170, 532], book: [196, 14, 560, 532], lupa: [835, 380], R: 58, restAngle: 25, restSlide: 20, shoulder: [1200, 370], size: 22, bend: -1,
    arm: {upper: 420, lower: 400, width: 42, handScale: 1.25}},
  laneBand: {rack: [14, 14, 170, 312], book: [198, 14, 800, 312], lupa: [1100, 190], R: 58, restAngle: 80, restSlide: 16, shoulder: [1080, 700], size: 22, bend: 1,
    arm: {upper: 420, lower: 400, width: 44, handScale: 1.25}},
};

/**
 * Top-down reading desk: rack (editable hierarchy), open book with the
 * article, a hand magnifier and one reader arm. Geometry and pose solver only.
 * @param {any} ctx
 * @param {{prefix:string, axis:keyof STAGE, params:any, readerLabel?:string, articleLabel?:string, wordOverride?:string}} o
 */
export function deskStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  // o.rackW (opt-in): a wider rack; the book moves right and narrows to match
  const G0 = GEO[axis];
  const dR = o.rackW ? Math.max(0, o.rackW - G0.rack[2]) : 0;
  const G1 = dR ? {...G0, rack: [G0.rack[0], G0.rack[1], G0.rack[2] + dR, G0.rack[3]], book: [G0.book[0] + dR, G0.book[1], G0.book[2] - dR, G0.book[3]]} : G0;
  // o.bookRight (opt-in): the book ends at this x (a parking bay beside it)
  const G = o.bookRight && G1.book[0] + G1.book[2] > o.bookRight ? {...G1, book: [G1.book[0], G1.book[1], o.bookRight - G1.book[0], G1.book[3]]} : G1;
  const {w: W, h: H} = STAGE[axis];
  const p = o.params;
  const t = kitStrings(p.locale);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const src = p.sources;
  const read = src[0];
  const bookColor = sourceColor(ctx, 0);

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 28, seedKey: `tc-desk-${axis}`});
  const deskCopy = deskWindow(ctx, {prefix: `${P}-lcdesk`, x: 0, y: 0, w: W, h: H, radius: 28, seedKey: `tc-desk-${axis}`});
  // o.rackBars (opt-in): the rack's labels are prop bars (the supplied
  // ordering is then printed readably elsewhere, e.g. a shared strip)
  const rctx = o.rackBars ? Object.assign(Object.create(ctx), {show: () => false}) : ctx;
  const rack = rackArt(rctx, {prefix: `${P}-rack`, x: G.rack[0], y: G.rack[1], w: G.rack[2], h: G.rack[3], levels: p.hierarchy.levels, sources: src, caption: p.hierarchy.caption, plateSize: G.plateSize ?? (axis.startsWith('panel') ? 18.5 : 21), plateFrac: G.plateFrac});

  const [bx, by, bw, bh] = G.book;
  const pg = bookPages(bx, by, bw, bh);
  const Rp = pg.right;
  const hs = Math.max(14, Rp.w * 0.042);
  const railW = Math.max(30, Rp.w * 0.09);
  const artBox = {x: Rp.x + Rp.w * 0.075, y: Rp.y + Rp.h * 0.045 + hs * 2.4, w: Rp.w * 0.925 - Rp.w * 0.075 - railW, h: Rp.h * 0.9 - (Rp.h * 0.045 + hs * 2.4)};
  // o.artBand (opt-in): keep the article between these desk y values (a lens
  // over any of its words then stays on the desk)
  if (o.artBand) {
    const y1 = Math.min(artBox.y + artBox.h, o.artBand[1]);
    artBox.y = Math.max(artBox.y, o.artBand[0]);
    artBox.h = Math.max(40, y1 - artBox.y);
  }
  // o.compact (opt-in): only the key word's line is text on the desk prop
  const layoutFn = o.compact ? compactArticleLayout : articleLayout;
  const artFn = o.compact ? compactArticleArt : articleArt;
  const AL = layoutFn(ctx, {...artBox, heading: p.passages.heading, lines: p.passages.lines, word: p.passages.word, wordPassage: p.passages.wordPassage ?? 0, size: o.size ?? G.size, reserve: o.reserve});
  const art = artFn(ctx, AL, {prefix: `${P}-art`});
  const artCopy = artFn(ctx, AL, {prefix: `${P}-lca`, mark: COPY_MARK});
  const pageOpt = o.pageText === false ? {pageText: false} : {};
  const book = openBookArt(ctx, {prefix: `${P}-book`, x: bx, y: by, w: bw, h: bh, color: bookColor, source: read, art, ...pageOpt});
  const bookCopy = openBookArt(ctx, {prefix: `${P}-lcb`, x: bx, y: by, w: bw, h: bh, color: bookColor, source: read, art: artCopy, mark: COPY_MARK, ...pageOpt});

  // context marks: passage ring, article ring (+ tab), margin rail, ribbon to the rack slot
  const key = AL.key;
  const kpas = AL.passages[key.p];
  const ringP = drawRect(`${P}-ringP`, {x: kpas.box.x - 10, y: kpas.box.y - 4, w: kpas.box.w + 20, h: kpas.box.h + 8}, 10, th.accent2, 3);
  const aBox = {x: AL.x - 14, y: AL.y - AL.size * 0.5, w: Rp.x + Rp.w * 0.955 - (AL.x - 14), h: AL.box.h + AL.size * 0.95};
  const ringA = drawRect(`${P}-ringA`, aBox, 14, th.accent2, 3.5);
  let tabA = null;
  if (showKey && o.articleLabel) {
    tabA = chip(ctx, o.articleLabel, {x: aBox.x + aBox.w - 10, y: aBox.y + aBox.h - 4, anchor: 'end', maxWidth: Math.min(aBox.w - 20, 360), size: axis.startsWith('panel') ? 18 : 22, maxLines: 1, fill: th.accent2Soft, stroke: th.accent2, name: `${P}-tabA`});
    tabA.node.attrs.opacity = 0;
  }
  const others = AL.occ.filter(q => !q.key);
  const railX = Rp.x + Rp.w * 0.925 - railW * 0.45;
  const railPts = [key, ...others].map(q => ({x: railX, y: q.cy, q}));
  railPts.sort((a, b) => a.y - b.y);
  let rail = null;
  if (others.length) {
    const y0 = railPts[0].y, y1 = railPts[railPts.length - 1].y;
    const len = y1 - y0;
    const tick = railW * 0.32;
    rail = {
      node: g({name: `${P}-rail`, opacity: 0},
        h('line', {name: `${P}-railL`, x1: r(railX), x2: r(railX), y1: r(y0), y2: r(y1), stroke: th.accent2, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 8)}`, 'stroke-dashoffset': r(len)}),
        railPts.map((q, i) => g({name: `${P}-railD${i}`, opacity: 0},
          h('line', {x1: r(railX - tick), x2: r(railX), y1: r(q.y), y2: r(q.y), stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round'}),
          h('circle', {cx: r(railX), cy: r(q.y), r: q.q.key ? 7.5 : 6, fill: q.q.key ? th.accent3 : th.accent2, stroke: th.paper, 'stroke-width': 2})))),
      frame: pr => {
        const out = {[`${P}-rail`]: {opacity: pr > 0 ? 1 : 0}, [`${P}-railL`]: {'stroke-dashoffset': r(len * (1 - clamp(pr)))}};
        railPts.forEach((q, i) => { out[`${P}-railD${i}`] = {opacity: len ? clamp((pr * len - (q.y - y0)) / 12 + 1) : (pr > 0 ? 1 : 0)}; });
        return out;
      },
    };
  }
  // amber margin marker of the key word (shown while it is read on its own)
  const keyDotPt = {x: railX, y: key.cy};
  const keyDot = g({name: `${P}-keyDot`, opacity: 0},
    h('line', {x1: r(railX - railW * 0.32), x2: r(railX), y1: r(key.cy), y2: r(key.cy), stroke: th.accent3, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(railX), cy: r(key.cy), r: 7.5, fill: th.accent3, stroke: th.paper, 'stroke-width': 2}));
  // ribbon: book cover edge → rack slot (relation: placed there by the author)
  const bookBox = {x: bx, y: by, w: bw, h: bh};
  const slot = rack.slotBox;
  let ribbon = null;
  if (slot) {
    const sc = {x: slot.x + slot.w / 2, y: slot.y + slot.h / 2};
    const bc = {x: bx + bw / 2, y: by + bh / 2};
    let from = edgeAnchor(bookBox, sc, 4);
    let to = edgeAnchor(slot, bc, 6);
    let c1, c2;
    const rb = rack.box;
    if (o.ribbonSide === 'right' && rb.x + rb.w <= bx) {
      // (opt-in) level from the book's left edge into the slot's right side,
      // clear of the drawer plate above the slot
      const sy = slot.y + slot.h / 2;
      from = {x: bx - 4, y: clamp(sy, by + 24, by + bh - 24)};
      to = {x: slot.x + slot.w + 6, y: sy};
      c1 = {x: from.x - (from.x - to.x) * 0.4, y: from.y};
      c2 = {x: to.x + (from.x - to.x) * 0.4, y: to.y};
    } else if (rb.y > by + bh) {
      // rack below the book (portrait desk, narrow contrast panel): the ribbon
      // leaves the book's bottom edge just right of the rack, runs down through
      // free desk space beside it and enters the slot from its right side
      // (never over the rack caption, another row or another book)
      const x0 = Math.min(bx + bw - 40, rb.x + rb.w + 14);
      from = {x: x0, y: by + bh + 4};
      to = {x: slot.x + slot.w + 6, y: slot.y + slot.h / 2};
      c1 = {x: x0, y: from.y + (to.y - from.y) * 0.75};
      c2 = {x: x0 - 10, y: to.y};
    }
    ribbon = connector(ctx, {name: `${P}-rib`, from, to, c1, c2, kind: 'relation', bend: axis === 'vertical' ? -0.18 : 0.18, color: th.accent2});
    ribbon.ends = {from, to};
    // samples of the ribbon that fall on the rack caption, on another row or on
    // another book (the slot's own row may be crossed only to reach the slot)
    const blocked = [rack.capBox, ...rack.rows.filter((q, i) => i !== rack.slotRow).map(q => q.box), ...rack.books.filter(q => q.i !== 0).map(q => q.box)].filter(Boolean);
    let hits = 0;
    for (let i = 0; i <= 80; i++) {
      const q = ribbon.at(i / 80);
      if (blocked.some(B => q.x > B.x && q.x < B.x + B.w && q.y > B.y && q.y < B.y + B.h)) hits++;
    }
    ribbon.hits = hits;
  }

  // magnifier + arm
  const look = actorLook(ctx, undefined, 0);
  const arm = topArm(ctx, {name: `${P}-arm`, skin: look.skin, sleeve: look.outfit, handed: 'right', ...G.arm});
  // o.lensR (opt-in): a larger lens for a larger key word
  const lupa = lupaArt(ctx, {name: `${P}-lupa`, R: o.lensR ?? G.R});
  const clipId = `${P}-lclip`;
  const lensContent = g({name: `${P}-lcont`}, deskCopy.surface, bookCopy.node);
  const lupaNodes = {
    shadow: g({name: `${P}-lshadow`, opacity: 0.9}, lupa.shadow),
    handle: g({name: `${P}-lhandle`}, lupa.handle),
    glass: g(null,
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${P}-lclipc`, cx: 0, cy: 0, r: r(lupa.glassR)}))),
      g({'clip-path': ctx.ref(clipId)}, lensContent)),
    head: g({name: `${P}-lhead`}, lupa.tint, lupa.ring),
  };
  const dim = h('rect', {name: `${P}-dim`, x: 0, y: 0, width: W, height: H, fill: th.ink, opacity: 0});

  // o.restAt (opt-in): where the magnifier is laid down
  const rest = o.restAt ? {x: o.restAt.x, y: o.restAt.y} : {x: G.lupa[0], y: G.lupa[1]};
  // free hand: explicit, or resting ON the handle end (restSlide beyond the grip)
  // o.restAngle (opt-in): handle direction of the magnifier at rest
  const restA = o.restAngle ?? G.restAngle;
  const restDir = {x: Math.cos((restA * Math.PI) / 180), y: Math.sin((restA * Math.PI) / 180)};
  const handRest = G.handRest ? {x: G.handRest[0], y: G.handRest[1]}
    : {x: rest.x + restDir.x * (lupa.grip + G.restSlide), y: rest.y + restDir.y * (lupa.grip + G.restSlide)};
  const shoulder = {x: G.shoulder[0], y: G.shoulder[1]};
  const deg = a => (a * 180) / Math.PI;
  const rad = d => (d * Math.PI) / 180;
  const dirOf = a => ({x: Math.cos(a), y: Math.sin(a)});
  // handle direction (from lens to hand): at rest, a fixed angle; at work, aligned
  // with the forearm solved for the working pose (static, computed once).
  const thetaRest = rad(restA);
  const kwC = {x: key.cx, y: key.cy};
  const K_CARRY = 1.08, K_LIFT = 1.42;
  // the raised lens magnifies up to 2.75×, less when the word would overflow the glass
  // (o.minLift, opt-in: a lower floor for the raised magnification)
  const M_LIFT = clamp((0.84 * 2 * lupa.glassR * K_LIFT) / Math.max(1, key.w), o.minLift ?? 1.9, 2.75);
  let thetaWork = Math.atan2(shoulder.y - kwC.y, shoulder.x - kwC.x);
  for (let i = 0; i < 4; i++) {
    const hand = {x: kwC.x + Math.cos(thetaWork) * lupa.grip * K_LIFT, y: kwC.y + Math.sin(thetaWork) * lupa.grip * K_LIFT};
    const s = arm.pose(shoulder, hand, G.bend);
    thetaWork = s.angle + Math.PI;
  }
  // angle interpolation along the short way
  const lerpAngle = (a, b, tt) => {
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return a + d * tt;
  };
  const gripAt = (C, theta, k) => ({x: C.x + Math.cos(theta) * lupa.grip * k, y: C.y + Math.sin(theta) * lupa.grip * k});
  const gripRest = gripAt(rest, thetaRest, 1);

  // sweep route over the other occurrences (contrast B)
  const sweepPts = [kwC, ...others.map(q => ({x: q.cx, y: q.cy}))];

  // actor chip: the reader, near the resting hand
  // reader tag: beside the resting hand; it fades while the hand is away
  let readerChip = null;
  if (showKey && o.readerLabel) {
    const cs = axis.startsWith('panel') ? 18 : 23;
    const at = {
      horizontal: {x: handRest.x - 70, y: H - 16 - cs * 1.8, anchor: 'end'},
      square: {x: handRest.x - 64, y: H - 16 - cs * 1.8, anchor: 'end'},
      vertical: {x: W - 20, y: handRest.y + 64, anchor: 'end'},
      panelWide: {x: handRest.x - 50, y: H - 12 - cs * 1.8, anchor: 'end'},
      panelNarrow: {x: handRest.x - 50, y: H - 12 - cs * 1.8, anchor: 'end'},
      panelTall: {x: handRest.x - 50, y: H - 12 - cs * 1.8, anchor: 'end'},
    }[axis];
    readerChip = chip(ctx, o.readerLabel, {...at, maxWidth: axis.startsWith('panel') ? 200 : 300, size: cs, maxLines: 1, name: `${P}-reader`, fill: th.card});
  }
  const railRight = Rp.x + Rp.w - 10;

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      rack.node,
      book.node,
      ringP.node,
      ringA.node,
      rail && rail.node,
      ribbon && ribbon.node,
      dim,
      keyDot,
      lupaNodes.shadow,
      arm.arm, arm.palm,
      lupaNodes.handle,
      lupaNodes.glass,
      lupaNodes.head,
      arm.thumb,
    ),
    desk.frame,
    tabA && tabA.node,
    readerChip && readerChip.node,
  );

  /**
   * Pose the stage from action values in [0,1].
   * @param {{grab:number, carry:number, lift:number, lower:number, sweep?:number, back:number, release:number, dim?:number, ringP?:number, ringA?:number, rail?:number, ribbon?:number, hlKey?:number, hlOthers?:number, isolate?:number}} v
   */
  function pose(v) {
    const nodes = {};
    const reduced = ctx.reduced;
    const sweep = v.sweep ?? 0;
    // --- lens centre, scale, magnification, handle angle
    let C = rest;
    let k = 1;
    let m = 1;
    let theta = thetaRest;
    let held = false;
    const pick = seg(v.carry, 0, 0.3);
    if (v.back > 0) {
      const from = sweep > 0 ? sweepPts[sweepPts.length - 1] : kwC;
      const e = ease.inOutCubic(v.back);
      C = mix(from, rest, e);
      C = {x: C.x, y: C.y - Math.sin(Math.PI * e) * 26};
      theta = lerpAngle(thetaWork, thetaRest, e);
      k = lerp(K_CARRY, 1, seg(v.back, 0.7, 1));
      m = lerp(1.6, 1, seg(v.back, 0.65, 1));
      held = v.back < 1 || v.release === 0;
    } else if (sweep > 0) {
      const n = sweepPts.length - 1;
      const f = ease.inOutSine(sweep) * n;
      const i = Math.min(n - 1, Math.floor(f));
      C = n > 0 ? mix(sweepPts[i], sweepPts[i + 1], ease.inOutCubic(f - i)) : kwC;
      theta = thetaWork;
      k = K_CARRY;
      m = 1.6;
      held = true;
    } else if (v.lift > 0 || v.lower > 0) {
      const l = ease.inOutCubic(v.lift) * (1 - ease.inOutCubic(v.lower));
      C = kwC;
      theta = thetaWork;
      k = lerp(K_CARRY, K_LIFT, l);
      m = lerp(1.6, M_LIFT, l);
      held = true;
    } else if (v.carry > 0) {
      const e = ease.inOutCubic(v.carry);
      C = mix(rest, kwC, e);
      C = {x: C.x, y: C.y - Math.sin(Math.PI * e) * 30};
      theta = lerpAngle(thetaRest, thetaWork, e);
      k = lerp(1, K_CARRY, pick);
      m = lerp(1, 1.6, seg(v.carry, 0, 0.35));
      held = true;
    } else {
      held = v.grab >= 1 && v.release === 0;
    }
    
    // --- hand
    let handT;
    const grip = gripAt(C, theta, k);
    if (v.release > 0) handT = mix(gripRest, handRest, ease.inOutCubic(v.release));
    else if (v.grab < 1) handT = mix(handRest, gripRest, ease.inOutCubic(v.grab));
    else handT = grip;
    const solved = arm.pose(shoulder, handT, G.bend);
    Object.assign(nodes, solved.nodes);
    if (readerChip) nodes[`${P}-reader`] = {opacity: r(clamp(1 - Math.hypot(solved.hand.x - handRest.x, solved.hand.y - handRest.y) / 140), 3)};
    // the magnifier follows the SOLVED hand while held
    let Cw = C;
    if (held && v.release === 0 && v.grab >= 1) {
      Cw = {x: solved.hand.x - Math.cos(theta) * lupa.grip * k, y: solved.hand.y - Math.sin(theta) * lupa.grip * k};
    }
    const lift01 = (k - 1) / (K_LIFT - 1);
    const lensT = T(Cw.x, Cw.y, deg(theta), k);
    nodes[`${P}-lhandle`] = {transform: lensT};
    nodes[`${P}-lhead`] = {transform: lensT};
    nodes[`${P}-lshadow`] = {transform: T(Cw.x + 8 + 34 * lift01, Cw.y + 10 + 46 * lift01, deg(theta), k * (1 + 0.04 * lift01)), opacity: r(0.9 - 0.45 * lift01, 3)};
    nodes[`${P}-lclipc`] = {cx: r(Cw.x), cy: r(Cw.y), r: r(lupa.glassR * k)};
    nodes[`${P}-lcont`] = {transform: `translate(${r(Cw.x)} ${r(Cw.y)}) scale(${r(m, 4)}) translate(${r(-Cw.x)} ${r(-Cw.y)})`};
    // --- isolation inside the glass: context words fade, the key word stays inked
    const iso = clamp(v.isolate ?? 0);
    nodes[`${P}-lca-rest`] = {opacity: r(1 - 0.72 * iso, 3)};
    nodes[`${P}-dim`] = {opacity: r(0.3 * clamp(v.dim ?? 0), 3)};
    // --- highlights (mirrored in the glass copy)
    const hk = clamp(v.hlKey ?? 1);
    const ho = clamp(v.hlOthers ?? 0);
    AL.occ.forEach((q, i) => {
      const op = q.key ? hk : ho;
      nodes[`${P}-art-h${i}`] = {opacity: r(op, 3)};
      nodes[`${P}-lca-h${i}`] = {opacity: r(op, 3)};
    });
    // --- context marks
    Object.assign(nodes, ringP.frame(v.ringP ?? 0));
    Object.assign(nodes, ringA.frame(v.ringA ?? 0));
    if (tabA) nodes[`${P}-tabA`] = {opacity: r(seg(v.ringA ?? 0, 0.7, 1), 3)};
    if (rail) Object.assign(nodes, rail.frame(v.rail ?? 0));
    nodes[`${P}-keyDot`] = {opacity: r(clamp(v.keyDot ?? 0), 3)};
    if (ribbon) {
      const rb = v.ribbon ?? 0;
      Object.assign(nodes, ribbon.frame(rb, rb > 0 ? 1 : 0));
      nodes[`${P}-rack-slot`] = {stroke: rb >= 1 ? th.accent2 : shade(th.woodTop, -0.45)};
      nodes[`${P}-rack-slotFill`] = {opacity: r(0.8 * seg(rb, 0.85, 1), 3)};
    }
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const lensGrip = gripAt(Cw, theta, k);
    return {
      nodes,
      semantic: {
        lens: P2(Cw),
        hand: P2(solved.hand),
        lensGrip: P2(lensGrip),
        lensHeld: held && v.grab >= 1 && v.release === 0,
        lensScale: r(k, 3),
        magnification: r(m, 3),
        lensOnWord: Math.hypot(Cw.x - kwC.x, Cw.y - kwC.y) < 6,
        wordApparentScale: r(m, 3),
        allReached: solved.reached,
      },
    };
  }

  return {
    node, pose, W, H, axis, AL, key, kwC, others, rack, book, pg, aBox, bookBox, slot, rest, handRest, shoulder,
    lupa, ringP, ringA, rail, ribbon, sweepPts, readerChip, tabA, keyDotPt, railRight,
    /** samples of the book→slot ribbon lying on the rack caption / other rows / other books */
    ribbonHits: ribbon ? ribbon.hits : 0,
    /** article glyph boxes (stage coordinates) */
    textBoxes: articleTextBoxes(AL),
    titleBottom: book.titleBottom,
    /** positions useful to entries (stage coordinates) */
    cardsAt: G.cards,
    cardSlot: G.card,
  };
}

/* ------------------------------------------------------------------ */
/* Exploded-view pieces (mechanism): loose sheet, passage strip, token  */
/* ------------------------------------------------------------------ */

/**
 * Loose article sheet (the article lifted off the book page). Local origin =
 * top-left; the article art is drawn in sheet-local coordinates.
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, header?:string, art:{hl:any,rest:any,key:any}, mark?:string}} o
 */
export function paperSheet(ctx, o) {
  const th = ctx.theme;
  const fold = Math.min(34, o.w * 0.08);
  const parts = [
    h('path', {d: roundRectPath(8, 11, o.w, o.h, 6), fill: th.shadow}),
    h('path', {d: `M0 5Q0 0 5 0H${r(o.w - fold)}L${r(o.w)} ${r(fold)}V${r(o.h - 5)}Q${r(o.w)} ${r(o.h)} ${r(o.w - 5)} ${r(o.h)}H5Q0 ${r(o.h)} 0 ${r(o.h - 5)}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(o.w - fold)} 0V${r(fold * 0.85)}Q${r(o.w - fold)} ${r(fold)} ${r(o.w - fold * 0.85)} ${r(fold)}H${r(o.w)}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
  return g({name: o.name}, parts, o.art.hl, o.art.rest, o.art.key);
}

/**
 * Paper strip holding one passage. Local origin = top-left.
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, art:{hl:any,rest:any,key:any}}} o
 */
export function paperStrip(ctx, o) {
  const th = ctx.theme;
  const jag = [];
  const n = Math.max(6, Math.round(o.h / 14));
  for (let i = 0; i <= n; i++) jag.push(`${r(o.w + (i % 2 ? 5 : 0))} ${r((i / n) * o.h)}`);
  const d = `M0 0H${r(o.w)}L${jag.join('L')}H0Z`;
  return g({name: o.name},
    h('path', {d, fill: th.shadow, transform: 'translate(7 10)'}),
    h('path', {d, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    o.art.hl, o.art.rest, o.art.key);
}

/**
 * The key word as a paper token (enlarged). Local origin = centre.
 * @param {any} ctx
 * @param {{name:string, text:string, size:number, maxW:number}} o
 */
export function wordToken(ctx, o) {
  const th = ctx.theme;
  const f = ctx.fit(o.text, {maxWidth: o.maxW, size: o.size, minSize: o.size * 0.5, maxLines: 1, weight: 500, family: 'serif'});
  const w = Math.max(f.width, o.size * 1.6) + o.size * 0.9;
  const hh = f.size * 1.5;
  const parts = [
    h('path', {d: roundRectPath(-w / 2 + 7, -hh / 2 + 10, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 8), fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(-w / 2 + hh * 0.12, -hh / 2 + hh * 0.12, w - hh * 0.24, hh * 0.76, 6), fill: th.accent3Soft, stroke: shade(th.accent3, -0.1), 'stroke-width': 2}),
  ];
  if (ctx.show('key')) parts.push(textBlock(f, {x: 0, y: -f.size * 0.55, anchor: 'middle', fill: th.ink}));
  else parts.push(h('rect', {x: r(-f.width / 2), y: r(-f.size * 0.2), width: r(Math.max(10, f.width)), height: r(f.size * 0.42), rx: r(f.size * 0.18), fill: shade(th.accent3, -0.35)}));
  return {node: g({name: o.name}, parts), w, h: hh};
}

/** Element ids of the mechanism, nested from the word outwards. */
export const MECH_IDS = ['word', 'passage', 'article', 'book', 'rack'];

/** Mechanism field set (elements / relationships / focus / labels / order). */
export const tcMechanismFields = {
  elements: list('Component captions; ids are fixed by the scene (word ⊂ passage ⊂ article ⊂ book ⊂ rack), captions are editable', obj('Component', {
    id: {type: 'string', enum: MECH_IDS, description: 'Component id'},
    label: str('Visible caption', 50),
  }, ['id', 'label']), 2, MECH_IDS.length),
  relationships: list('Explicit relationships; kind sets the line style (relation = no arrow; causal only when supplied). Lines are anchored to the edge of each component, at the place the part came from', obj('Relationship', {
    from: {type: 'string', enum: MECH_IDS, description: 'Source component id'},
    to: {type: 'string', enum: MECH_IDS, description: 'Target component id'},
    kind: {type: 'string', enum: ['relation', 'communication', 'sequence', 'causal'], description: 'relation | communication | sequence | causal (causal only when the author supplies it)'},
    label: str('Optional caption on this line (else the caption of its kind)', 50),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: {type: 'string', enum: MECH_IDS, description: 'Component enlarged while the tracer passes'},
  relationLabels: obj('Caption used for each relation kind when a line has no caption of its own', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', {type: 'string', enum: MECH_IDS, description: 'Component id'}, 2, 8),
};

/* ------------------------------------------------------------------ */
/* Port-to-port relation line (mechanism)                              */
/* ------------------------------------------------------------------ */

const REL_STYLE = {
  relation: {arrow: false, dash: null},
  communication: {arrow: true, dash: '16 11'},
  sequence: {arrow: true, dash: null},
  causal: {arrow: true, dash: null},
};

/**
 * A thick, cased relation line between two ports on component edges.
 * Both ends carry a port (ring + dot) so the line visibly lands on each
 * component; an arrowhead is drawn only for kinds that carry direction
 * (never for a plain relation). Draws on with `frame(p)`.
 * @param {any} ctx
 * @param {{name:string, from:{x:number,y:number}, to:{x:number,y:number}, kind:string, color:string, bend?:number, width?:number}} o
 */
export function relLine(ctx, o) {
  const th = ctx.theme;
  const st = REL_STYLE[o.kind] || REL_STYLE.relation;
  const wid = o.width ?? 6;
  const {from, to} = o;
  const dx = to.x - from.x, dy = to.y - from.y;
  const bend = o.bend ?? 0.1;
  const c1 = {x: from.x + dx * 0.3 - dy * bend, y: from.y + dy * 0.3 + dx * bend};
  const c2 = {x: from.x + dx * 0.7 - dy * bend, y: from.y + dy * 0.7 + dx * bend};
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, u = 1 - t;
    pts.push({x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x, y: u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y});
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const at = t => {
    const d = clamp(t) * total;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const f = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
    return {x: lerp(pts[i - 1].x, pts[i].x, f), y: lerp(pts[i - 1].y, pts[i].y, f), a};
  };
  const headLen = wid * 3.6;
  // the visible line stops short of the arrow tip so the head is not blunted
  const d = `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`;
  const end = at(1);
  const n = o.name;
  const port = (q, key) => g({name: `${n}-${key}`, opacity: 0},
    h('circle', {cx: r(q.x), cy: r(q.y), r: r(wid * 1.75), fill: th.paper, stroke: o.color, 'stroke-width': r(wid * 0.6)}),
    h('circle', {cx: r(q.x), cy: r(q.y), r: r(wid * 0.7), fill: o.color}));
  const node = g({name: n, opacity: 0},
    h('path', {name: `${n}-case`, d, fill: 'none', stroke: th.paper, 'stroke-width': r(wid + 7), 'stroke-linecap': 'round', opacity: 0.9, 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    st.dash
      ? h('path', {name: `${n}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': r(wid), 'stroke-linecap': 'butt', 'stroke-dasharray': st.dash, opacity: 0})
      : h('path', {name: `${n}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': r(wid), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    port(from, 'pa'),
    st.arrow
      ? h('path', {name: `${n}-pb`, d: `M0 0L${r(-headLen)} ${r(-headLen * 0.6)}L${r(-headLen * 0.72)} 0L${r(-headLen)} ${r(headLen * 0.6)}Z`, fill: o.color, stroke: th.paper, 'stroke-width': 2, transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0})
      : port(to, 'pb'));
  const frame = p => {
    const q = clamp(p);
    const out = {[n]: {opacity: q > 0 ? 1 : 0}, [`${n}-case`]: {'stroke-dashoffset': r(total * (1 - q))}, [`${n}-pa`]: {opacity: q > 0 ? 1 : 0}, [`${n}-pb`]: {opacity: q >= 0.98 ? 1 : 0}};
    out[`${n}-line`] = st.dash ? {opacity: r(q, 3)} : {'stroke-dashoffset': r(total * (1 - q))};
    return out;
  };
  return {node, frame, at, total, mid: at(0.5), from, to, pts, arrow: st.arrow};
}
