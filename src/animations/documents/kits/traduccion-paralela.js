/**
 * Kit for the "Traducción paralela" motif (LAW-0025..0028).
 *
 * Objects of this motif (original vector art, geometry only — every entry owns
 * its own timeline, layout and semantics):
 *  - a bilingual SPREAD: the source page and its translation lie side by side
 *    on an open folder with a WIDE gutter between them. Segments are NOT row
 *    aligned: each translated segment has its own length, so segment N sits at
 *    a different height on each page (`parallelLayout`).
 *  - numbered segment badges in the gutter-side margin of each page;
 *  - GUIDES: one pen-drawn S-curve per segment pair across the gutter, plus a
 *    bracket on each page edge that grows to the full extent of the segment
 *    it belongs to (`linkGeometry`) — the visible statement "these two
 *    segments are equivalent", whatever their length;
 *  - the TERM SLOT: one key term highlighted in a source segment and, in the
 *    translated segment, either the equivalent (highlighted, "translation
 *    available"), a dashed box that retains the source term plus a pen-drawn
 *    question mark ("term without confirmed equivalent"), or a blank slot;
 *  - pen marks (underline / question mark / handwriting sweep) whose tip IS
 *    the end of the ink stroke while drawing;
 *  - a top-down translation desk (`translationDesk`) with the translator's
 *    IK arm holding the pen (bottom edge) and the reviewer's IK arm carrying
 *    the stamp (top edge) that marks the translation header;
 *  - mechanism parts: a lifted segment strip (`segmentStrip`), a term record
 *    card (`termCard`) and a closed file folder (`fileFolder`).
 *
 * Nothing here states a rule of law, validity or outcome: the states are
 * descriptive workflow states (linked / equivalent available / not confirmed).
 * @module animations/documents/kits/traduccion-paralela
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, r, seg} from '../../../core/time.js';
import {mix, rad, dist, polyline, cubicPolyline, catmullRom, roundRectPath} from '../../../core/geometry.js';
import {FONTS} from '../../../core/text.js';
import {pen as penTool, stampTool, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';
import {party, str, int, list, obj} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ fields */

/** Category (documents) fields, specialised for a bilingual parallel text. */
export const translationFields = {
  documentId: str('Identifier printed in the footer of both pages (fictional)', 32),
  documentTitle: str('Title printed on the source page (original language)', 100),
  targetTitle: str('Title printed on the translated page', 100),
  languages: obj('Language tags printed in each page header (labels only; they imply no jurisdiction)', {
    source: str('Tag of the source page, e.g. ES', 14, {minLength: 1}),
    target: str('Tag of the translated page, e.g. EN', 14, {minLength: 1}),
  }, ['source', 'target']),
  clauses: list('Source segments (original wording) in reading order; each one is an alignment unit', str('Source segment', 110, {minLength: 1}), 2, 4),
  translations: list('Translated segments in the same order: translated segment N is the equivalent of source segment N (extra items stay unlinked)', str('Translated segment', 110, {minLength: 1}), 2, 4),
  term: obj('Key term examined inside one segment pair', {
    segment: int('Zero-based index of the segment pair that contains the term', 0, 3),
    source: str('Term as written in the source segment (highlighted where it appears verbatim)', 36, {minLength: 1}),
    target: str('Equivalent as written in the translated segment; the slot replaces these words (or is appended when they do not appear)', 36, {minLength: 1}),
  }, ['segment', 'source', 'target']),
  signers: list('Translator who draws the guides (first) and reviewer who stamps the translation (second)', party, 2, 2),
  redactions: list('Zero-based segment indices whose wording is withheld by redaction bars on both pages (their guides are still drawn)', int('Segment index', 0, 3), 0, 4),
};

/** Built-in strings shared by the four entries. */
export const TP_STRINGS = {
  en: {
    original: 'Original', translation: 'Translation', aligned: 'Segments linked',
    available: 'Translation available', unconfirmed: 'Term without confirmed equivalent',
    equivalent: 'Equivalent', term: 'Term', segment: 'Segment', notConfirmed: 'not confirmed',
    record: 'Term record', blank: 'blank',
  },
  es: {
    original: 'Original', translation: 'Traducción', aligned: 'Segmentos enlazados',
    available: 'Traducción disponible', unconfirmed: 'Término sin equivalencia confirmada',
    equivalent: 'Equivalente', term: 'Término', segment: 'Segmento', notConfirmed: 'sin confirmar',
    record: 'Ficha terminológica', blank: 'en blanco',
  },
};

/* ----------------------------------------------------------------- colours */

/** Colour of segment pair i (consistent across the four entries). */
export function pairColor(ctx, i) {
  const th = ctx.theme;
  const list4 = [
    [th.accent2, th.accent2Soft],
    [th.accent4, th.accent4Soft],
    [th.cloth[3], shade(th.cloth[3], 0.8)],
    [shade(th.accent3, -0.3), th.accent3Soft],
  ];
  const [c, soft] = list4[i % list4.length];
  return {c, soft};
}

/** Folder colour of this motif (sage, distinct from the kraft folders of other motifs). */
export const FOLDER_COLOR = '#a9c2b0';

/* -------------------------------------------------------------- text flow */

/** Index of `term` inside `text` (exact, then case-insensitive), or -1. */
export function findTerm(text, term) {
  if (!term) return -1;
  const i = text.indexOf(term);
  return i >= 0 ? i : text.toLowerCase().indexOf(term.toLowerCase());
}

const splitWords = s => String(s).split(/\s+/).filter(Boolean);

/**
 * Greedy word flow for one segment with an optional atomic token (the term
 * highlight or the equivalent slot). Punctuation glued to the atomic token
 * stays on its line.
 * @param {any} ctx
 * @param {string} text
 * @param {{size:number, maxWidth:number, family?:'serif'|'sans', weight?:number,
 *   special?:{match:string, w:number, append?:boolean}}} o
 */
export function flowSegment(ctx, text, o) {
  const fam = o.family || 'serif';
  const wt = o.weight || 400;
  const M = s => ctx.measure(s, o.size, wt, fam);
  const space = M(' ') || o.size * 0.26;
  const full = String(text);
  const tokens = [];
  const push = (s, glueFirst) => splitWords(s).forEach((w, i) => tokens.push({kind: 'w', text: w, glue: i === 0 && glueFirst}));
  let found = false;
  const sp = o.special;
  if (sp) {
    const idx = findTerm(full, sp.match);
    if (idx >= 0) {
      found = true;
      const before = full.slice(0, idx);
      const after = full.slice(idx + sp.match.length);
      push(before, false);
      tokens.push({kind: 'special', text: full.slice(idx, idx + sp.match.length), w: sp.w, lines: sp.lines || 1, glue: before.length > 0 && !/\s$/.test(before)});
      push(after, /^\S/.test(after));
    } else if (sp.append) {
      push(full, false);
      tokens.push({kind: 'special', text: sp.match, w: sp.w, lines: sp.lines || 1, glue: false});
      found = 'appended';
    } else push(full, false);
  } else push(full, false);
  // measure; split words that are wider than the column
  const measured = [];
  for (const t of tokens) {
    if (t.kind !== 'w') { measured.push({...t, w: Math.min(t.w, o.maxWidth)}); continue; }
    const w = M(t.text);
    if (w <= o.maxWidth) { measured.push({...t, w}); continue; }
    let cur = '';
    const chunks = [];
    for (const ch of t.text) {
      if (cur && M(cur + ch) > o.maxWidth) { chunks.push(cur); cur = ch; } else cur += ch;
    }
    if (cur) chunks.push(cur);
    chunks.forEach((c, i) => measured.push({kind: 'w', text: c, glue: i === 0 ? t.glue : false, w: M(c)}));
  }
  const units = [];
  measured.forEach(t => { if (t.glue && units.length) units[units.length - 1].push(t); else units.push([t]); });
  const isTall = t => t.kind === 'special' && t.lines > 1;
  // a two-line special gets whole lines: it leaves room for the punctuation glued to it
  units.forEach(u => {
    const sp2 = u.find(isTall);
    if (sp2) sp2.w = Math.max(o.maxWidth * 0.5, Math.min(sp2.w, o.maxWidth - u.reduce((a, t) => a + (t === sp2 ? 0 : t.w), 0)));
  });
  const lines = [];
  let cur = [];
  let curW = 0;
  for (const u of units) {
    const w = u.reduce((a, t) => a + t.w, 0);
    if (u.some(isTall)) {
      // the two-line special starts a line; the next line is its second line
      if (cur.length) lines.push(cur);
      lines.push([u], []);
      cur = []; curW = 0;
      continue;
    }
    const add = cur.length ? space + w : w;
    if (cur.length && curW + add > o.maxWidth) { lines.push(cur); cur = [u]; curW = w; } else { cur.push(u); curW += add; }
  }
  if (cur.length) lines.push(cur);
  const out = lines.map(line => {
    let x = 0;
    const items = [];
    line.forEach((u, ui) => {
      if (ui) x += space;
      u.forEach(t => { items.push({...t, x}); x += t.w; });
    });
    return {items, w: x};
  });
  // punctuation glued after a two-line special closes its SECOND line
  out.forEach((ln, li) => {
    const si = ln.items.findIndex(isTall);
    if (si < 0 || !out[li + 1]) return;
    const tail = ln.items.slice(si + 1);
    ln.items = ln.items.slice(0, si + 1);
    ln.w = ln.items[si].x + ln.items[si].w;
    out[li + 1].items = tail;
    out[li + 1].w = tail.length ? tail[tail.length - 1].x + tail[tail.length - 1].w : 0;
  });
  return {lines: out.length ? out : [{items: [], w: 0}], found, space};
}

/* ---------------------------------------------------------- page layout */

/**
 * Shared layout of the two pages: one body size for both, header + title,
 * segment blocks (each at its own height), the slot of the key term and the
 * stamp zone in the translation header.
 * @param {any} ctx
 * @param {{pageW:number, pageH:number, size:[number,number], docId:string,
 *   source:{title:string, lang:string, segments:string[]}, target:{title:string, lang:string, segments:string[]},
 *   term:{segment:number, source:string, target:string}, slotTexts?:string[], showText:boolean}} o
 */
export function parallelLayout(ctx, o) {
  for (let s = o.size[0]; s >= o.size[1]; s -= 1) {
    const L = attemptLayout(ctx, o, s, false);
    if (L.fits) return L;
  }
  return attemptLayout(ctx, o, o.size[1], true);
}

function attemptLayout(ctx, o, s, truncate) {
  const PW = o.pageW, PH = o.pageH;
  const pad = Math.max(20, PW * 0.06);
  const badgeCol = s * 1.45;
  const gpad = pad + badgeCol;
  const textW = PW - pad - gpad;
  const lead = s * 1.5;
  const tagSize = Math.max(14, s * 0.78);
  const headerY = pad * 0.7;
  const stampW = Math.min(180, PW * 0.36);
  const stampH = stampW * 0.36;
  const headerH = Math.max(tagSize * 1.76, stampH + 6);
  const titleSize = Math.max(15, s * 1.12);
  const idSize = Math.max(12, s * 0.62);
  const footerY = PH - pad * 0.65 - idSize;
  const limit = footerY - s * 0.7;
  const hpad = s * 0.2;
  const qW = s * 0.95;
  const n = Math.min(o.source.segments.length, o.target.segments.length);
  const k = o.term.segment < n ? o.term.segment : -1;
  const M = (t, wt = 400) => ctx.measure(t, s, wt, 'serif');
  const termW = M(o.term.source, 600) + hpad * 2;
  const uncText = `«${o.term.source}»`;
  const slotTexts = o.slotTexts && o.slotTexts.length ? o.slotTexts : [o.term.target];
  const slotNeed = Math.max(...slotTexts.map(t => M(t, 600) + hpad * 2), M(uncText) + hpad * 2 + qW * 1.25);
  // a value that would have to shrink below ~80 % of the body size to stay on
  // one line wraps onto a second line of the slot instead (never an ellipsis)
  const slotLines = slotNeed * 0.8 > textW ? 2 : 1;
  const slotW = slotLines > 1 ? textW : Math.min(textW, slotNeed);

  const page = side => {
    const src = side === 'source';
    const colX = src ? pad : gpad;
    const titleMax = textW;
    let title = ctx.fit(o[side].title || ' ', {maxWidth: titleMax, size: titleSize, minSize: Math.max(13, titleSize * 0.78), maxLines: 2, weight: 700, family: 'serif'});
    if (title.truncated) title = ctx.fit(o[side].title, {maxWidth: titleMax, size: titleSize * 0.9, minSize: Math.max(13, titleSize * 0.7), maxLines: 3, weight: 700, family: 'serif'});
    const titleY = headerY + headerH + s * 0.45;
    const ruleY = titleY + title.height + s * 0.5;
    let y = ruleY + s * 0.85;
    const segs = [];
    const texts = o[side].segments;
    for (let i = 0; i < texts.length; i++) {
      const special = i === k
        ? (src ? {match: o.term.source, w: termW} : {match: o.term.target, w: slotW, append: true, lines: slotLines})
        : null;
      const flow = flowSegment(ctx, texts[i], {size: s, maxWidth: textW, special});
      const lines = flow.lines.map((ln, li) => ({...ln, y: y + li * lead}));
      const hgt = (lines.length - 1) * lead + s;
      segs.push({i, top: y, bottom: y + hgt, lines, found: flow.found, linked: i < n});
      y += hgt + s * 1.0;
    }
    return {colX, title, titleY, ruleY, segs, end: segs.length ? segs[segs.length - 1].bottom : ruleY};
  };
  let pages = {source: page('source'), target: page('target')};
  let fits = pages.source.end <= limit && pages.target.end <= limit;
  if (fits) {
    // spread the segments over the page: extra gap per segment, bounded
    for (const side of ['source', 'target']) {
      const pg = pages[side];
      const slack = limit - pg.end;
      const extra = Math.min(slack / Math.max(1, pg.segs.length), s * 1.3);
      pg.segs.forEach((sg, i) => {
        const dy = extra * i + extra * 0.35;
        sg.top += dy; sg.bottom += dy;
        sg.lines = sg.lines.map(ln => ({...ln, y: ln.y + dy}));
      });
      pg.end = pg.segs.length ? pg.segs[pg.segs.length - 1].bottom : pg.end;
    }
  }
  let truncated = false;
  if (!fits && truncate) {
    truncated = true;
    for (const side of ['source', 'target']) pages[side] = truncatePage(pages[side], limit, lead, s);
    fits = true;
  }
  // special (term / slot) placement in page-local coordinates
  const specialOf = side => {
    const pg = pages[side];
    const sg = pg.segs[k];
    if (!sg) return null;
    for (const ln of sg.lines) {
      const it = ln.items.find(t => t.kind === 'special');
      if (it) return {x: pg.colX + it.x, y: ln.y, w: it.w, h: s, text: it.text, lines: it.lines || 1};
    }
    return null;
  };
  const stamp = {x: PW - pad - stampW / 2 - 4, y: headerY + headerH / 2, w: stampW, h: stampH};
  const slot = specialOf('target');
  return {
    s, lead, pad, gpad, badgeCol, textW, headerY, headerH, tagSize, titleSize, idSize, footerY, hpad, qW,
    // a two-line slot may leave room for punctuation glued to it
    slotW: slot ? slot.w : slotW, slotLines: slot ? slot.lines : 1, termW,
    pageW: PW, pageH: PH, n, k, pages, fits, truncated,
    term: specialOf('source'), slot, uncText, stamp,
  };
}

function truncatePage(pg, limit, lead, s) {
  const segs = pg.segs.map(sg => ({...sg, lines: sg.lines.slice()}));
  const relayout = () => {
    let y = segs.length ? segs[0].top : 0;
    for (const sg of segs) {
      sg.top = y;
      sg.lines = sg.lines.map((ln, li) => ({...ln, y: y + li * lead}));
      sg.bottom = y + (sg.lines.length - 1) * lead + s;
      y = sg.bottom + s;
    }
    return segs.length ? segs[segs.length - 1].bottom : 0;
  };
  let end = relayout();
  let guard = 0;
  // never cut the second line of a two-line slot away from its first line
  const cuttable = sg => sg.lines.length > 1 && !sg.lines[sg.lines.length - 2].items.some(t => t.kind === 'special' && t.lines > 1);
  while (end > limit && guard++ < 40) {
    const cands = segs.filter(cuttable);
    if (!cands.length) break;
    const longest = cands.reduce((a, b) => (b.lines.length > a.lines.length ? b : a));
    longest.lines.pop();
    const last = longest.lines[longest.lines.length - 1];
    longest.cut = true;
    last.cut = true;
    end = relayout();
  }
  return {...pg, segs, end};
}

/* ------------------------------------------------------------ page drawing */

/** Question-mark stroke (pen glyph) inside a box; the dot is separate. */
export function questionPoly(box) {
  const {x, y, w, h: hh} = box;
  const pts = [
    {x: x + w * 0.2, y: y + hh * 0.3},
    {x: x + w * 0.32, y: y + hh * 0.1},
    {x: x + w * 0.55, y: y + hh * 0.04},
    {x: x + w * 0.78, y: y + hh * 0.16},
    {x: x + w * 0.76, y: y + hh * 0.38},
    {x: x + w * 0.54, y: y + hh * 0.52},
    {x: x + w * 0.5, y: y + hh * 0.72},
  ];
  return {poly: polyline(catmullRom(pts, 8)), dot: {x: x + w * 0.5, y: y + hh * 0.92}};
}

/** Slightly wavy underline from x0 to x1 at y. */
export function underlinePoly(x0, x1, y, amp = 1.6) {
  const n = Math.max(3, Math.round((x1 - x0) / 22));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push({x: x0 + ((x1 - x0) * i) / n, y: y + (i % 2 ? amp : -amp) * (i === 0 || i === n ? 0 : 1)});
  return polyline(catmullRom(pts, 6));
}

/**
 * Handwriting sweep across a slot (the pen writes the word; the stroke itself
 * is not inked). A two-line slot is written line by line.
 */
export function writePoly(x0, x1, yTop, s, lines = 1, lead = s * 1.5) {
  const n = Math.max(4, Math.round((x1 - x0) / (s * 0.42)));
  const pts = [];
  for (let li = 0; li < lines; li++) {
    for (let i = 0; i <= n; i++) pts.push({x: x0 + ((x1 - x0) * i) / n, y: yTop + li * lead + s * (i % 2 ? 0.34 : 0.78)});
  }
  return polyline(catmullRom(pts, 5));
}

const FAM = f => FONTS[f] || FONTS.sans;

function textNode(o) {
  return h('text', {
    name: o.name, x: r(o.x), y: r(o.y + o.size * 0.8), 'font-family': FAM(o.family || 'serif'), 'font-size': r(o.size, 2),
    'font-weight': o.weight || 400, 'font-style': o.italic ? 'italic' : undefined, fill: o.fill, 'text-anchor': o.anchor, opacity: o.opacity,
  }, o.text);
}

/** Group consecutive word items of a line into text runs. */
function runsOf(items) {
  const runs = [];
  let cur = null;
  for (const it of items) {
    if (it.kind !== 'w') { cur = null; continue; }
    if (cur) cur.text += (it.glue ? '' : ' ') + it.text;
    else runs.push(cur = {x: it.x, text: it.text});
  }
  return runs;
}

/**
 * One page of the spread (local origin = top-left of the sheet).
 * Named nodes: `${P}-tint-i`, `${P}-badge-i` (fill), and on the translation
 * page the slot variants `${P}-slot-<key>`, the reveal clip `${P}-clip`,
 * the pen marks `${P}-q`, `${P}-qdot`, `${P}-ul`.
 * @param {any} ctx
 * @param {ReturnType<typeof parallelLayout>} L
 * @param {'source'|'target'} side
 * @param {{prefix:string, showText:boolean, lang:string, langLabel:string, docId:string, redactions?:number[],
 *   slotVariants?:Array<{key:string, kind:'avail'|'unc'|'blank', text?:string}>, marks?:boolean}} o
 */
export function pageNode(ctx, L, side, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const pg = L.pages[side];
  const PW = L.pageW, PH = L.pageH;
  const s = L.s;
  const src = side === 'source';
  const show = o.showText;
  const red = new Set(o.redactions || []);
  const parts = [];
  // sheet with a soft outer-bottom page curl
  parts.push(h('path', {d: roundRectPath(7, 10, PW, PH, 8), fill: th.shadow}));
  const c = 34;
  const sheet = src
    ? `M6 0H${PW - 6}Q${PW} 0 ${PW} 6V${PH - 6}Q${PW} ${PH} ${PW - 6} ${PH}H${c}L0 ${PH - c}V6Q0 0 6 0Z`
    : `M6 0H${PW - 6}Q${PW} 0 ${PW} 6V${PH - c}L${PW - c} ${PH}H6Q0 ${PH} 0 ${PH - 6}V6Q0 0 6 0Z`;
  parts.push(h('path', {d: sheet, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: src ? `M${c} ${PH}Q${c * 0.3} ${PH - c * 0.3} 0 ${PH - c}Q${c * 0.8} ${PH - c * 0.8} ${c} ${PH}Z` : `M${PW - c} ${PH}Q${PW - c * 0.3} ${PH - c * 0.3} ${PW} ${PH - c}Q${PW - c * 0.8} ${PH - c * 0.8} ${PW - c} ${PH}Z`,
    fill: th.paperShade, stroke: th.ink, 'stroke-width': th.strokeThin, 'stroke-linejoin': 'round'}));

  // header: language tag chip
  const tagColor = src ? th.inkSoft : th.accent2;
  const tagX = src ? pg.colX : L.pad;
  const tagH = L.tagSize * 1.76;
  const tagY = L.headerY + (L.headerH - tagH) / 2;
  if (show) {
    const code = ctx.fit(o.lang, {maxWidth: PW * 0.2, size: L.tagSize, minSize: 11, maxLines: 1, weight: 800});
    const lab = ctx.fit(o.langLabel, {maxWidth: (src ? L.textW : L.pageW - L.stamp.w - L.pad - tagX - 12) - code.width - L.tagSize * 2.2, size: L.tagSize, minSize: Math.max(12, L.tagSize * 0.8), maxLines: 1, weight: 600});
    const codeW = code.width + L.tagSize * 1.1;
    const withLabel = !lab.truncated;
    const w = withLabel ? codeW + lab.width + L.tagSize * 1.3 : codeW;
    if (withLabel) parts.push(h('path', {d: roundRectPath(tagX, tagY, w, tagH, tagH / 2), fill: th.card, stroke: tagColor, 'stroke-width': 2}));
    parts.push(h('path', {d: roundRectPath(tagX, tagY, codeW, tagH, tagH / 2), fill: tagColor}));
    parts.push(textBlock(code, {x: tagX + codeW / 2, y: tagY + (tagH - code.size) / 2 + 1, anchor: 'middle', fill: '#fff', letterSpacing: 1}));
    if (withLabel) parts.push(textBlock(lab, {x: tagX + codeW + L.tagSize * 0.55, y: tagY + (tagH - lab.size) / 2 + 1, fill: tagColor}));
  } else {
    parts.push(h('path', {d: roundRectPath(tagX, tagY, L.tagSize * 3.2, tagH, tagH / 2), fill: tagColor}));
  }

  // title + rule
  if (show) parts.push(textBlock(pg.title, {x: pg.colX, y: pg.titleY, fill: th.ink}));
  else {
    const tw = Math.min(L.textW, pg.title.width);
    parts.push(h('rect', {x: pg.colX, y: pg.titleY + L.titleSize * 0.18, width: r(tw * 0.9), height: r(L.titleSize * 0.62), rx: 4, fill: th.ink, opacity: 0.78}));
  }
  parts.push(h('line', {x1: pg.colX, x2: pg.colX + L.textW, y1: pg.ruleY, y2: pg.ruleY, stroke: th.paperLine, 'stroke-width': 2}));

  // segments
  pg.segs.forEach((sg, i) => {
    const col = pairColor(ctx, i);
    parts.push(h('rect', {name: `${P}-tint-${i}`, x: r(pg.colX - 8), y: r(sg.top - s * 0.28), width: r(L.textW + 16), height: r(sg.bottom - sg.top + s * 0.56), rx: 8, fill: col.soft, opacity: 0}));
    // badge in the gutter-side margin, at the first line
    const bx = src ? PW - L.pad - L.badgeCol / 2 + 2 : L.pad + L.badgeCol / 2 - 2;
    const by = sg.top + s * 0.45;
    const br = s * 0.56;
    parts.push(h('circle', {name: `${P}-badge-${i}`, cx: r(bx), cy: r(by), r: r(br), fill: th.card, stroke: th.ink, 'stroke-width': 2}));
    if (show) parts.push(h('text', {name: `${P}-badgen-${i}`, x: r(bx), y: r(by + br * 0.42), 'text-anchor': 'middle', 'font-family': FAM('sans'), 'font-size': r(br * 1.15, 2), 'font-weight': 800, fill: th.ink}, String(i + 1)));
    const redacted = red.has(i);
    sg.lines.forEach((ln, li) => {
      if (redacted) {
        parts.push(h('rect', {x: r(pg.colX), y: r(ln.y + s * 0.02), width: r(Math.max(s * 2, ln.w)), height: r(s * 0.95), rx: 3, fill: th.ink}));
        return;
      }
      if (show) {
        runsOf(ln.items).forEach((run, ri) => {
          const isLast = ln.cut && ri === runsOf(ln.items).length - 1;
          parts.push(textNode({x: pg.colX + run.x, y: ln.y, size: s, text: isLast ? `${run.text}…` : run.text, fill: th.ink}));
        });
      } else {
        ln.items.forEach(it => {
          if (it.kind !== 'w') return;
          parts.push(h('rect', {x: r(pg.colX + it.x), y: r(ln.y + s * 0.32), width: r(Math.max(4, it.w - 2)), height: r(s * 0.4), rx: r(s * 0.2), fill: th.paperLine}));
        });
      }
    });
  });

  // term highlight on the source page (always visible: it marks the term being examined)
  if (src && L.term && !red.has(L.k)) {
    const t = L.term;
    parts.push(h('rect', {name: `${P}-term`, x: r(t.x), y: r(t.y - s * 0.12), width: r(t.w), height: r(s * 1.2), rx: 5, fill: th.highlight, stroke: shade('#e0b800', -0.1), 'stroke-width': 1.5}));
    if (show) parts.push(textNode({x: t.x + L.hpad, y: t.y, size: s, weight: 600, text: t.text, fill: th.ink}));
    else parts.push(h('rect', {x: r(t.x + L.hpad), y: r(t.y + s * 0.3), width: r(t.w - L.hpad * 2), height: r(s * 0.42), rx: r(s * 0.2), fill: th.ink, opacity: 0.55}));
  }

  // equivalent slot on the translated page
  let marks = null;
  if (!src && L.slot && !red.has(L.k)) {
    const sl = L.slot;
    const nl = L.slotLines || 1;
    // a two-line slot spans its line and the next one (one lead lower)
    const extra = L.lead * (nl - 1);
    const slotH = s * 1.2 + extra;
    const fitSlot = (text, weight, room) => {
      const f = ctx.fit(text || '', {maxWidth: room, size: s, minSize: s * 0.7, maxLines: nl, weight, family: 'serif'});
      return nl > 1 ? {...f, lineHeight: L.lead} : f;
    };
    const variants = o.slotVariants || [{key: 'av', kind: 'avail', text: sl.text}];
    const clipId = `${P}-clipdef`;
    parts.push(h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${P}-clip`, x: r(sl.x - 4), y: r(sl.y - s * 0.3), width: r(L.slotW + 8), height: r(s * 1.6 + extra)}))));
    variants.forEach(v => {
      const vp = [];
      if (v.kind === 'avail') {
        vp.push(h('rect', {x: r(sl.x), y: r(sl.y - s * 0.12), width: r(L.slotW), height: r(slotH), rx: 5, fill: th.highlight, stroke: shade('#e0b800', -0.1), 'stroke-width': 1.5}));
        const f = fitSlot(v.text, 600, L.slotW - L.hpad * 2);
        if (show) vp.push(textBlock(f, {x: sl.x + L.hpad, y: sl.y + (s - f.size) * 0.5, fill: th.ink}));
        else vp.push(h('rect', {x: r(sl.x + L.hpad), y: r(sl.y + s * 0.3), width: r(Math.max(8, f.width)), height: r(s * 0.42), rx: r(s * 0.2), fill: th.ink, opacity: 0.55}));
      } else if (v.kind === 'unc') {
        vp.push(h('rect', {x: r(sl.x), y: r(sl.y - s * 0.12), width: r(L.slotW), height: r(slotH), rx: 5, fill: th.accentSoft, 'fill-opacity': 0.55, stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '7 5'}));
        const f = fitSlot(L.uncText, 400, L.slotW - L.hpad * 2 - L.qW * 1.2);
        if (show) vp.push(textBlock(f, {x: sl.x + L.hpad, y: sl.y + (s - f.size) * 0.5, fill: th.inkSoft, italic: true}));
        else vp.push(h('rect', {x: r(sl.x + L.hpad), y: r(sl.y + s * 0.3), width: r(Math.max(8, f.width)), height: r(s * 0.42), rx: r(s * 0.2), fill: th.inkSoft, opacity: 0.5}));
      } else {
        vp.push(h('rect', {x: r(sl.x), y: r(sl.y - s * 0.12), width: r(L.slotW), height: r(slotH), rx: 5, fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 1.5}));
        for (let li = 0; li < nl; li++) vp.push(h('line', {x1: r(sl.x + L.hpad), x2: r(sl.x + L.slotW - L.hpad), y1: r(sl.y + li * L.lead + s * 0.92), y2: r(sl.y + li * L.lead + s * 0.92), stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}));
      }
      const clipped = v.kind !== 'blank' && o.reveal;
      parts.push(g({name: `${P}-slot-${v.key}`, opacity: v.initial ?? 1, 'clip-path': clipped ? ctx.ref(clipId) : undefined}, vp));
    });
    // pen marks: question mark (right end of the slot's last line) and
    // underline (under the last line of the equivalent, as wide as its widest line)
    // the question mark sits inside the slot's right end, clear of its border
    const qBox = {x: sl.x + L.slotW - L.qW * 1.12, y: sl.y + extra - s * 0.05, w: L.qW * 0.8, h: s * 1.05};
    const q = questionPoly(qBox);
    const avText = (variants.find(v => v.kind === 'avail') || {}).text || sl.text;
    const avW = Math.min(L.slotW - L.hpad * 2, fitSlot(avText, 600, L.slotW - L.hpad * 2).width);
    const ul = underlinePoly(sl.x + L.hpad * 0.6, sl.x + L.hpad + avW + L.hpad * 0.4, sl.y + extra + s * 1.2);
    const ink = '#1d3f8f';
    parts.push(h('path', {name: `${P}-q`, d: q.poly.d(1), fill: 'none', stroke: th.accent, 'stroke-width': Math.max(3, s * 0.13), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(q.poly.total)} ${r(q.poly.total + 20)}`, 'stroke-dashoffset': r(q.poly.total)}));
    parts.push(h('circle', {name: `${P}-qdot`, cx: r(q.dot.x), cy: r(q.dot.y), r: r(Math.max(2.5, s * 0.1)), fill: th.accent, opacity: 0}));
    parts.push(h('path', {name: `${P}-ul`, d: ul.d(1), fill: 'none', stroke: ink, 'stroke-width': Math.max(3, s * 0.12), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(ul.total)} ${r(ul.total + 20)}`, 'stroke-dashoffset': r(ul.total)}));
    const wr = writePoly(sl.x + L.hpad * 0.6, sl.x + L.slotW - L.hpad * 0.6, sl.y, s, nl, L.lead);
    marks = {q: q.poly, qDot: q.dot, ul, write: wr, qBox};
  }

  // footer: document id
  if (show && o.docId) {
    const f = ctx.fit(o.docId, {maxWidth: PW * 0.5, size: L.idSize, minSize: 11, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textBlock(f, {x: src ? PW - L.pad : L.pad + 4, y: L.footerY, anchor: src ? 'end' : 'start', fill: th.inkSoft}));
  } else {
    parts.push(h('rect', {x: r(src ? PW - L.pad - PW * 0.2 : L.pad + 4), y: r(L.footerY + 3), width: r(PW * 0.2), height: r(L.idSize * 0.55), rx: 3, fill: th.paperLine}));
  }
  return {node: g({name: P}, parts), marks};
}

/* --------------------------------------------------------------- guides */

/**
 * Guide geometry for segment pair i in stage coordinates.
 * @param {ReturnType<typeof parallelLayout>} L
 * @param {number} i
 * @param {{x:number,y:number}} srcTL top-left of the source page
 * @param {{x:number,y:number}} tgtTL top-left of the translated page
 */
export function linkGeometry(L, i, srcTL, tgtTL) {
  const s = L.s;
  const a = L.pages.source.segs[i];
  const b = L.pages.target.segs[i];
  const xs = srcTL.x + L.pageW;
  const xt = tgtTL.x;
  const gap = xt - xs;
  const bo = Math.max(10, Math.min(20, gap * 0.12));
  const ys0 = srcTL.y + a.top - s * 0.2, ys1 = srcTL.y + a.bottom + s * 0.2;
  const yt0 = tgtTL.y + b.top - s * 0.2, yt1 = tgtTL.y + b.bottom + s * 0.2;
  const A = {x: xs + bo, y: (ys0 + ys1) / 2};
  const B = {x: xt - bo, y: (yt0 + yt1) / 2};
  const k = (B.x - A.x) * 0.55;
  const c1 = {x: A.x + k, y: A.y}, c2 = {x: B.x - k, y: B.y};
  return {
    A, B, c1, c2, poly: cubicPolyline(A, c1, c2, B, 40),
    srcBracket: {x: xs + bo, y0: ys0, y1: ys1, d: `M${r(xs + 3)} ${r(ys0)}H${r(xs + bo)}V${r(ys1)}H${r(xs + 3)}`},
    tgtBracket: {x: xt - bo, y0: yt0, y1: yt1, d: `M${r(xt - 3)} ${r(yt0)}H${r(xt - bo)}V${r(yt1)}H${r(xt - 3)}`},
  };
}

/**
 * Nodes for one guide: the pen-drawn curve, the end dots and the brackets
 * (solid; plus a dashed target bracket when `dashedTarget`).
 */
export function linkNodes(ctx, name, geo, color, o = {}) {
  const w = o.width ?? 5;
  const total = geo.poly.total;
  const sm = (b, key, dashed) => h('path', {name: `${name}-${key}`, d: b.d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke', 'stroke-dasharray': dashed ? '9 7' : undefined, transform: scaleAbout(b.x, (b.y0 + b.y1) / 2, 1, 0.001)});
  return g({name},
    sm(geo.srcBracket, 'bs', false),
    sm(geo.tgtBracket, 'bt', false),
    o.dashedTarget ? sm(geo.tgtBracket, 'btd', true) : null,
    h('path', {name: `${name}-line`, d: geo.poly.d(1), fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dA`, cx: r(geo.A.x), cy: r(geo.A.y), r: w * 1.5, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dB`, cx: r(geo.B.x), cy: r(geo.B.y), r: w * 1.5, fill: color, opacity: 0}),
  );
}

/**
 * Frame props of a guide: `line` = curve drawing progress; `brackets` =
 * bracket growth; `dashed` = 0 solid target bracket … 1 dashed.
 */
export function linkFrame(name, geo, line, brackets, dashed = 0, hasDashed = false) {
  const total = geo.poly.total;
  const b = Math.max(0.001, ease.outCubic(clamp(brackets)));
  const out = {
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - clamp(line)))},
    [`${name}-dA`]: {opacity: line > 0 ? 1 : 0},
    [`${name}-dB`]: {opacity: line >= 0.985 ? 1 : 0},
    [`${name}-bs`]: {transform: scaleAbout(geo.srcBracket.x, (geo.srcBracket.y0 + geo.srcBracket.y1) / 2, 1, b), opacity: brackets > 0 ? 1 : 0},
    [`${name}-bt`]: {transform: scaleAbout(geo.tgtBracket.x, (geo.tgtBracket.y0 + geo.tgtBracket.y1) / 2, 1, b), opacity: brackets > 0 ? r(1 - clamp(dashed), 3) : 0},
  };
  if (hasDashed) out[`${name}-btd`] = {transform: scaleAbout(geo.tgtBracket.x, (geo.tgtBracket.y0 + geo.tgtBracket.y1) / 2, 1, b), opacity: brackets > 0 ? r(clamp(dashed), 3) : 0};
  return out;
}

/* --------------------------------------------------------------- folders */

/**
 * Open folder spread under both pages (local origin top-left), with a tab
 * label. The tab grows (width, then a second line and height) to hold the
 * whole label instead of truncating it.
 */
export function folderSpread(ctx, {w, h: hh, spineX, label, showKey, size = 24, tabMax = Infinity}) {
  const th = ctx.theme;
  const c = FOLDER_COLOR;
  // tabMax = right limit of the tab (folder-local x), e.g. to stay clear of a note over the gutter
  const f = showKey && label
    ? ctx.fit(label, {maxWidth: Math.min(w * 0.46, 520, tabMax - 30) - 50, size, minSize: size * 0.84, maxLines: 2, weight: 700})
    : null;
  const tabW = Math.max(Math.min(w * 0.32, 320), f ? f.width + 50 : 0);
  const tabH = Math.max(40, f ? f.height + 18 : 0);
  const parts = [
    h('path', {d: roundRectPath(10, 14, w, hh, 18), fill: th.shadow}),
    h('path', {d: `M30 ${-tabH + 16}Q30 ${-tabH} 46 ${-tabH}H${r(tabW + 10)}Q${r(tabW + 30)} ${-tabH} ${r(tabW + 30)} ${-tabH + 10}V12H30Z`, fill: shade(c, -0.08), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(0, 0, w, hh, 18), fill: c, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(spineX - 16), y: 3, width: 32, height: hh - 6, fill: shade(c, -0.1), opacity: 0.8}),
    h('line', {x1: r(spineX), x2: r(spineX), y1: 3, y2: hh - 3, stroke: shade(c, -0.35), 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(14, 14, spineX - 30, hh - 28, 12), fill: 'none', stroke: shade(c, -0.18), 'stroke-width': 2, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(spineX + 16, 14, w - spineX - 30, hh - 28, 12), fill: 'none', stroke: shade(c, -0.18), 'stroke-width': 2, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round'}),
  ];
  if (f) parts.push(textBlock(f, {x: 52, y: -tabH + (tabH - 6 - f.height) / 2 + 1, fill: th.ink}));
  return {node: g(null, parts), tabH, tabW: tabW + 30};
}

/** Closed file folder with two sheet edges (mechanism). Local origin = centre. */
export function fileFolder(ctx, {name, w, h: hh, label, showKey, filled}) {
  const th = ctx.theme;
  const c = FOLDER_COLOR;
  const tabW = w * 0.36;
  return g({name},
    h('path', {d: roundRectPath(-w / 2 + 8, -hh / 2 + 12, w, hh, 12), fill: th.shadow}),
    h('path', {d: `M${-w / 2} ${-hh / 2 + 10}Q${-w / 2} ${-hh / 2} ${-w / 2 + 10} ${-hh / 2}H${r(-w / 2 + tabW)}L${r(-w / 2 + tabW + 18)} ${-hh / 2 + 18}H${w / 2 - 10}Q${w / 2} ${-hh / 2 + 18} ${w / 2} ${-hh / 2 + 28}V${hh / 2 - 10}Q${w / 2} ${hh / 2} ${w / 2 - 10} ${hh / 2}H${-w / 2 + 10}Q${-w / 2} ${hh / 2} ${-w / 2} ${hh / 2 - 10}Z`, fill: shade(c, -0.08), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    g({name: `${name}-sheets`, opacity: filled ? 1 : 0},
      h('rect', {x: -w * 0.4, y: -hh * 0.36, width: w * 0.38, height: hh * 0.62, rx: 3, fill: th.paper, stroke: th.ink, 'stroke-width': 1.8, transform: 'rotate(-3)'}),
      h('rect', {x: w * 0.02, y: -hh * 0.38, width: w * 0.38, height: hh * 0.62, rx: 3, fill: th.paper, stroke: th.ink, 'stroke-width': 1.8, transform: 'rotate(2)'})),
    h('path', {d: roundRectPath(-w / 2, -hh / 2 + 44, w, hh - 44, 10), fill: c, stroke: th.ink, 'stroke-width': th.stroke}),
    showKey && label ? (f => textBlock(f, {x: 0, y: 22 + (hh / 2 - 22 - f.height) / 2, anchor: 'middle', fill: th.ink}))(ctx.fit(label, {maxWidth: w - 40, size: 28, minSize: 21, maxLines: 2, weight: 700})) : h('rect', {x: -w * 0.25, y: 14, width: w * 0.5, height: 14, rx: 7, fill: shade(c, -0.3)}),
  );
}

/* --------------------------------------------------------- mechanism parts */

/**
 * Lifted segment strip: a paper strip with its segment number, language tag
 * and the flowed segment text (term highlight or equivalent slot).
 * Local origin = centre. Named: `${P}-slot-<key>` variants, `${P}-clip`, `${P}-q`, `${P}-qdot`.
 */
export function segmentStrip(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const s = o.size;
  const show = o.showText;
  const pad = s * 0.7;
  const numCol = s * 1.9;
  const textW = o.w - pad * 2 - numCol;
  const hpad = s * 0.2;
  const qW = s * 0.95;
  const col = pairColor(ctx, o.index);
  const uncText = `«${o.term.source}»`;
  const M = (t, wt = 400) => ctx.measure(t, s, wt, 'serif');
  let special = null;
  let slotW = 0;
  if (o.side === 'source') special = {match: o.term.source, w: M(o.term.source, 600) + hpad * 2};
  else {
    slotW = Math.min(textW, Math.max(...(o.slotTexts || [o.term.target]).map(t => M(t, 600) + hpad * 2), M(uncText) + hpad * 2 + qW));
    special = {match: o.term.target, w: slotW, append: true};
  }
  const lead = s * 1.5;
  const flow = flowSegment(ctx, o.text, {size: s, maxWidth: textW, special});
  const lines = flow.lines.slice(0, o.maxLines || 4);
  // header: language code chip + the element label (a key label)
  const tagColor = o.side === 'source' ? th.inkSoft : th.accent2;
  const codeF = ctx.fit(o.lang || ' ', {maxWidth: s * 3, size: s * 0.62, minSize: 11, maxLines: 1, weight: 800});
  const codeW = codeF.width + s * 0.8;
  const labF = o.showKey && o.label ? ctx.fit(o.label, {maxWidth: textW - codeW - s * 0.5, size: s * 0.78, minSize: s * 0.62, maxLines: 2, weight: 700}) : null;
  const tagH = Math.max(s * 1.15, labF ? labF.height + 8 : 0);
  const bodyH = (lines.length - 1) * lead + s;
  const hh = pad * 0.8 + tagH + s * 0.5 + bodyH + pad;
  const w = o.w;
  const x0 = -w / 2, y0 = -hh / 2;
  const tx = x0 + pad + numCol;
  const ty = y0 + pad * 0.8 + tagH + s * 0.5;
  const hy = y0 + pad * 0.8;
  const chipH = s * 1.05;
  const parts = [
    h('path', {d: roundRectPath(x0 + 6, y0 + 9, w, hh, 6), fill: th.shadow}),
    h('path', {d: `M${r(x0)} ${r(y0 + 4)}L${r(x0 + w * 0.25)} ${r(y0)}L${r(x0 + w * 0.5)} ${r(y0 + 3)}L${r(x0 + w * 0.75)} ${r(y0)}L${r(x0 + w)} ${r(y0 + 4)}V${r(y0 + hh - 4)}L${r(x0 + w * 0.7)} ${r(y0 + hh)}L${r(x0 + w * 0.35)} ${r(y0 + hh - 3)}L${r(x0)} ${r(y0 + hh)}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(x0 + 3), y: r(y0 + 4), width: r(numCol * 0.72), height: r(hh - 8), fill: col.soft}),
    h('circle', {cx: r(x0 + pad * 0.3 + numCol * 0.36), cy: r(ty + s * 0.45), r: r(s * 0.62), fill: col.c, stroke: th.ink, 'stroke-width': 2}),
    show ? h('text', {x: r(x0 + pad * 0.3 + numCol * 0.36), y: r(ty + s * 0.45 + s * 0.26), 'text-anchor': 'middle', 'font-family': FAM('sans'), 'font-size': r(s * 0.72, 2), 'font-weight': 800, fill: '#fff'}, String(o.index + 1)) : null,
    h('path', {d: roundRectPath(tx, hy + (tagH - chipH) / 2, codeW, chipH, chipH / 2), fill: tagColor}),
    show ? textBlock(codeF, {x: tx + codeW / 2, y: hy + (tagH - codeF.size) / 2 + 1, anchor: 'middle', fill: '#fff'}) : null,
    labF ? textBlock(labF, {x: tx + codeW + s * 0.4, y: hy + (tagH - labF.height) / 2, fill: th.ink}) : null,
  ];
  lines.forEach((ln, li) => {
    const y = ty + li * lead;
    if (o.redacted) { parts.push(h('rect', {x: r(tx), y: r(y + s * 0.02), width: r(Math.max(s * 2, ln.w)), height: r(s * 0.95), rx: 3, fill: th.ink})); return; }
    if (show) runsOf(ln.items).forEach(run => parts.push(textNode({x: tx + run.x, y, size: s, text: run.text, fill: th.ink})));
    else ln.items.forEach(it => { if (it.kind === 'w') parts.push(h('rect', {x: r(tx + it.x), y: r(y + s * 0.32), width: r(Math.max(4, it.w - 2)), height: r(s * 0.4), rx: r(s * 0.2), fill: th.paperLine})); });
  });
  let spot = null;
  if (!o.redacted) {
    lines.forEach((ln, li) => {
      const it = ln.items.find(t => t.kind === 'special');
      if (it) spot = {x: tx + it.x, y: ty + li * lead, w: it.w, text: it.text};
    });
  }
  let marks = null;
  if (spot && o.side === 'source') {
    parts.push(h('rect', {x: r(spot.x), y: r(spot.y - s * 0.12), width: r(spot.w), height: r(s * 1.2), rx: 5, fill: th.highlight, stroke: shade('#e0b800', -0.1), 'stroke-width': 1.5}));
    if (show) parts.push(textNode({x: spot.x + hpad, y: spot.y, size: s, weight: 600, text: spot.text, fill: th.ink}));
    else parts.push(h('rect', {x: r(spot.x + hpad), y: r(spot.y + s * 0.3), width: r(spot.w - hpad * 2), height: r(s * 0.42), rx: r(s * 0.2), fill: th.ink, opacity: 0.55}));
  } else if (spot) {
    const clipId = `${P}-clipdef`;
    parts.push(h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${P}-clip`, x: r(spot.x - 4), y: r(spot.y - s * 0.3), width: r(slotW + 8), height: r(s * 1.6)}))));
    (o.slotVariants || []).forEach(v => {
      const vp = [];
      if (v.kind === 'avail') {
        vp.push(h('rect', {x: r(spot.x), y: r(spot.y - s * 0.12), width: r(slotW), height: r(s * 1.2), rx: 5, fill: th.highlight, stroke: shade('#e0b800', -0.1), 'stroke-width': 1.5}));
        const f = ctx.fit(v.text || '', {maxWidth: slotW - hpad * 2, size: s, minSize: s * 0.7, maxLines: 1, weight: 600, family: 'serif'});
        if (show) vp.push(textBlock(f, {x: spot.x + hpad, y: spot.y + (s - f.size) * 0.5, fill: th.ink}));
        else vp.push(h('rect', {x: r(spot.x + hpad), y: r(spot.y + s * 0.3), width: r(Math.max(8, f.width)), height: r(s * 0.42), rx: r(s * 0.2), fill: th.ink, opacity: 0.55}));
      } else if (v.kind === 'unc') {
        vp.push(h('rect', {x: r(spot.x), y: r(spot.y - s * 0.12), width: r(slotW), height: r(s * 1.2), rx: 5, fill: th.accentSoft, 'fill-opacity': 0.55, stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '7 5'}));
        const f = ctx.fit(uncText, {maxWidth: slotW - hpad * 2 - qW, size: s, minSize: s * 0.7, maxLines: 1, weight: 400, family: 'serif'});
        if (show) vp.push(h('text', {x: r(spot.x + hpad), y: r(spot.y + (s - f.size) * 0.5 + f.size * 0.8), 'font-family': FAM('serif'), 'font-size': r(f.size, 2), 'font-style': 'italic', fill: th.inkSoft}, f.lines[0]));
        else vp.push(h('rect', {x: r(spot.x + hpad), y: r(spot.y + s * 0.3), width: r(Math.max(8, f.width)), height: r(s * 0.42), rx: r(s * 0.2), fill: th.inkSoft, opacity: 0.5}));
        const q = questionPoly({x: spot.x + slotW - qW * 0.92, y: spot.y - s * 0.05, w: qW * 0.8, h: s * 1.05});
        vp.push(h('path', {d: q.poly.d(1), fill: 'none', stroke: th.accent, 'stroke-width': Math.max(3, s * 0.12), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
        vp.push(h('circle', {cx: r(q.dot.x), cy: r(q.dot.y), r: r(Math.max(2.5, s * 0.1)), fill: th.accent}));
      } else {
        vp.push(h('rect', {x: r(spot.x), y: r(spot.y - s * 0.12), width: r(slotW), height: r(s * 1.2), rx: 5, fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 1.5}));
        vp.push(h('line', {x1: r(spot.x + hpad), x2: r(spot.x + slotW - hpad), y1: r(spot.y + s * 0.92), y2: r(spot.y + s * 0.92), stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}));
      }
      parts.push(g({name: `${P}-slot-${v.key}`, opacity: v.initial ?? 1, 'clip-path': v.kind !== 'blank' && o.reveal ? ctx.ref(clipId) : undefined}, vp));
    });
    marks = {slotW};
  }
  return {node: g({name: P}, parts), w, h: hh, spot, slotW, marks, box: {x: x0, y: y0, w, h: hh}};
}

/**
 * Term record card (index card): source tag + term, target tag + equivalent
 * (or a dashed "?" when the equivalent is not confirmed). Local origin = centre.
 * Named: `${P}-eq-<key>` variants.
 */
export function termCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const show = o.showText;
  const s = o.size;
  const x0 = -w / 2, y0 = -hh / 2;
  // title band grows to a second line rather than truncating the element label
  const tf = o.showKey && o.title ? ctx.fit(o.title, {maxWidth: w - s * 2.2, size: s * 0.82, minSize: s * 0.64, maxLines: 2, weight: 700}) : null;
  const headH = Math.max(s * 1.6, tf ? tf.height + s * 0.62 : 0);
  const rowH = (hh - headH - s * 0.3 - (o.footer ? s * 0.5 : 0)) / 2;
  const tagW = s * 2.6;
  const parts = [
    h('path', {d: roundRectPath(x0 + 7, y0 + 10, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 10), fill: '#fbf8ef', stroke: th.ink, 'stroke-width': th.stroke}),
    h('line', {x1: x0 + 10, x2: x0 + w - 10, y1: y0 + headH, y2: y0 + headH, stroke: th.accent, 'stroke-width': 2.5}),
    h('line', {x1: x0 + 10, x2: x0 + w - 10, y1: y0 + headH + rowH, y2: y0 + headH + rowH, stroke: '#9cc0dd', 'stroke-width': 1.6}),
    h('circle', {cx: x0 + w - s * 0.9, cy: y0 + s * 0.8, r: s * 0.3, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.5}),
  ];
  if (tf) parts.push(textBlock(tf, {x: x0 + s * 0.6, y: y0 + (headH - tf.height) / 2, fill: th.ink}));
  else parts.push(h('rect', {x: x0 + s * 0.6, y: y0 + s * 0.55, width: w * 0.4, height: s * 0.4, rx: 4, fill: th.inkSoft, opacity: 0.6}));
  if (show && o.footer) {
    const ff = ctx.fit(o.footer, {maxWidth: w * 0.6, size: s * 0.55, minSize: 11, maxLines: 1, weight: 500});
    parts.push(textBlock(ff, {x: x0 + w - s * 0.5, y: y0 + hh - ff.size - 6, anchor: 'end', fill: th.inkSoft}));
  }
  const row = (i, tag, color) => {
    const cy = y0 + headH + rowH * (i + 0.5);
    parts.push(h('path', {d: roundRectPath(x0 + s * 0.6, cy - s * 0.62, tagW, s * 1.24, s * 0.62), fill: color}));
    if (show) {
      const f = ctx.fit(tag, {maxWidth: tagW - 10, size: s * 0.72, minSize: 10, maxLines: 1, weight: 800});
      parts.push(textBlock(f, {x: x0 + s * 0.6 + tagW / 2, y: cy - f.size / 2, anchor: 'middle', fill: '#fff'}));
    }
    return cy;
  };
  const cy0 = row(0, o.langs.source, th.inkSoft);
  const cy1 = row(1, o.langs.target, th.accent2);
  const vx = x0 + s * 0.6 + tagW + s * 0.5;
  const vw = w - (vx - x0) - s * 0.6;
  const val = (text, cy, weight, name, extra = {}) => {
    const f = ctx.fit(text, {maxWidth: vw - s * 0.4, size: s, minSize: s * 0.62, maxLines: 1, weight, family: 'serif'});
    return show
      ? h('text', {name, x: r(vx + s * 0.2), y: r(cy + f.size * 0.33), 'font-family': FAM('serif'), 'font-size': r(f.size, 2), 'font-weight': weight, fill: th.ink, ...extra}, f.lines[0])
      : h('rect', {name, x: r(vx + s * 0.2), y: r(cy - s * 0.2), width: r(Math.max(10, f.width)), height: r(s * 0.42), rx: r(s * 0.2), fill: th.ink, opacity: 0.55});
  };
  parts.push(h('rect', {x: r(vx), y: r(cy0 - s * 0.6), width: r(Math.min(vw, ctx.measure(o.term, s, 600, 'serif') + s * 0.4)), height: r(s * 1.2), rx: 5, fill: th.highlight}));
  parts.push(val(o.term, cy0, 600));
  (o.variants || []).forEach(v => {
    const vp = [];
    if (v.kind === 'avail') {
      vp.push(h('rect', {x: r(vx), y: r(cy1 - s * 0.6), width: r(Math.min(vw, ctx.measure(v.text, s, 600, 'serif') + s * 0.4)), height: r(s * 1.2), rx: 5, fill: th.highlight}));
      vp.push(val(v.text, cy1, 600));
    } else if (v.kind === 'unc') {
      vp.push(h('rect', {x: r(vx), y: r(cy1 - s * 0.6), width: r(s * 2.2), height: r(s * 1.2), rx: 5, fill: th.accentSoft, stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '7 5'}));
      const q = questionPoly({x: vx + s * 0.7, y: cy1 - s * 0.55, w: s * 0.8, h: s * 1.05});
      vp.push(h('path', {d: q.poly.d(1), fill: 'none', stroke: th.accent, 'stroke-width': Math.max(3, s * 0.12), 'stroke-linecap': 'round'}));
      vp.push(h('circle', {cx: r(q.dot.x), cy: r(q.dot.y), r: r(Math.max(2.5, s * 0.1)), fill: th.accent}));
    } else {
      vp.push(h('line', {x1: r(vx + s * 0.2), x2: r(vx + vw - s * 0.4), y1: r(cy1 + s * 0.4), y2: r(cy1 + s * 0.4), stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}));
    }
    parts.push(g({name: `${P}-eq-${v.key}`, opacity: v.initial ?? 1}, vp));
  });
  return {node: g({name: P}, parts), box: {x: x0, y: y0, w, h: hh}, rows: [cy0, cy1], vx};
}

/**
 * Miniature page (mechanism): sheet, language tag, title and segment bars;
 * segment `k` is drawn as the slot its strip was lifted from (named
 * `${P}-ghost`, dashed outline) so the strip's origin stays visible.
 * Local origin = centre.
 */
export function miniPage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const x0 = -w / 2, y0 = -hh / 2;
  const pad = w * 0.09;
  const show = o.showText;
  const tagColor = o.side === 'source' ? th.inkSoft : th.accent2;
  const parts = [
    h('path', {d: roundRectPath(x0 + 6, y0 + 9, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 6), fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}),
  ];
  const tagH = 30;
  let y = y0 + pad * 0.7;
  if (show) {
    const f = ctx.fit(o.lang, {maxWidth: w * 0.4, size: 20, minSize: 12, maxLines: 1, weight: 800});
    parts.push(h('path', {d: roundRectPath(x0 + pad, y, f.width + 22, tagH, tagH / 2), fill: tagColor}));
    parts.push(textBlock(f, {x: x0 + pad + (f.width + 22) / 2, y: y + (tagH - f.size) / 2 + 1, anchor: 'middle', fill: '#fff'}));
  } else parts.push(h('path', {d: roundRectPath(x0 + pad, y, 56, tagH, tagH / 2), fill: tagColor}));
  y += tagH + 12;
  if (show && o.title) {
    const f = ctx.fit(o.title, {maxWidth: w - pad * 2, size: 22, minSize: 14, maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x: x0 + pad, y, fill: th.ink}));
    y += f.height + 12;
  } else {
    parts.push(h('rect', {x: x0 + pad, y: y + 4, width: (w - pad * 2) * 0.7, height: 14, rx: 4, fill: th.ink, opacity: 0.75}));
    y += 30;
  }
  parts.push(h('line', {x1: x0 + pad, x2: x0 + w - pad, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 2}));
  y += 16;
  const n = o.count;
  const avail = y0 + hh - pad - y;
  const each = avail / n;
  const slots = [];
  for (let i = 0; i < n; i++) {
    const sy = y + i * each;
    const box = {x: x0 + pad - 6, y: sy - 4, w: w - pad * 2 + 12, h: each - 12};
    slots.push(box);
    const col = pairColor(ctx, i);
    if (i === o.k) {
      parts.push(h('path', {name: `${P}-ghost`, d: roundRectPath(box.x, box.y, box.w, box.h, 6), fill: col.soft, stroke: col.c, 'stroke-width': 2.5, 'stroke-dasharray': '7 6'}));
      continue;
    }
    const lines = Math.max(1, Math.min(3, Math.floor((each - 16) / 16)));
    for (let l = 0; l < lines; l++) {
      const lw = (w - pad * 2) * (l === lines - 1 ? 0.55 + ctx.rng(`${P}-bar`, i * 5 + l) * 0.3 : 0.9);
      parts.push(h('rect', {x: x0 + pad, y: sy + l * 16, width: r(lw), height: 7, rx: 3.5, fill: th.paperLine}));
    }
    parts.push(h('circle', {cx: o.side === 'source' ? x0 + w - pad * 0.45 : x0 + pad * 0.45, cy: sy + 4, r: 5, fill: col.c}));
  }
  return {node: g({name: P}, parts), box: {x: x0, y: y0, w, h: hh}, slot: slots[o.k] || null};
}

/* ------------------------------------------------------------- pen plans */

/**
 * Pen plan: the pen travels (lifted) from its rest point to each mark,
 * draws it (tip on the stroke), and returns to rest. Durations are weighted
 * by path length. `at(p)` gives the tip, lift and per-mark progress.
 * @param {Array<{key:string, poly:any, speed?:number}>} marks
 * @param {{x:number,y:number}} rest
 */
export function penPlan(marks, rest) {
  const steps = [];
  let from = rest;
  marks.forEach((m, j) => {
    const start = m.poly.at(0);
    steps.push({kind: 'travel', a: from, b: start, w: 80 + dist(from, start) * 0.45});
    steps.push({kind: 'draw', j, w: 60 + m.poly.total * (m.speed ?? 1)});
    from = m.poly.at(1);
  });
  steps.push({kind: 'travel', a: from, b: rest, w: 80 + dist(from, rest) * 0.45});
  const total = steps.reduce((a, st) => a + st.w, 0);
  let acc = 0;
  steps.forEach(st => { st.t0 = acc / total; acc += st.w; st.t1 = acc / total; });
  const checkpoints = marks.map((m, j) => {
    const d = steps.find(st => st.kind === 'draw' && st.j === j);
    return {key: m.key, start: d.t0, end: d.t1};
  });
  function at(p) {
    const q = clamp(p);
    let idx = steps.findIndex(st => q <= st.t1);
    if (idx < 0) idx = steps.length - 1;
    const st = steps[idx];
    const local = st.t1 > st.t0 ? clamp((q - st.t0) / (st.t1 - st.t0)) : 1;
    const progress = marks.map((m, j) => {
      const d = steps.findIndex(x => x.kind === 'draw' && x.j === j);
      return d < idx ? 1 : d > idx ? 0 : local;
    });
    if (st.kind === 'travel') {
      const k = ease.inOutSine(local);
      const lift = (p <= 0 || p >= 1) ? 0 : Math.sin(Math.PI * Math.min(1, local * 1.0)) ** 0.6;
      return {tip: mix(st.a, st.b, k), lift, drawing: -1, progress};
    }
    return {tip: marks[st.j].poly.at(local), lift: 0, drawing: st.j, progress};
  }
  return {at, checkpoints, total};
}

/* ------------------------------------------------------ translation desk */

/**
 * Stage geometry per shape. `spread` = top-left of the source page; the
 * translated page sits one gutter to its right.
 */
export const DESK = {
  // pen.rest = nib at rest; the hand (grip) and the whole pen stay inside the
  // desk window in every shape. pen.angle = barrel direction (nib → cap).
  landscape: {W: 1920, H: 1000, page: [570, 750], gutter: 196, spread: [58, 150], size: [36, 20],
    pen: {rest: [1620, 820], angle: 40, shoulderY: 1150, lean: 20, min: 420, max: 1840, len: 230},
    rev: {shoulder: [1680, -300], rest: [1800, 118]}, arm: {upper: 430, lower: 410, width: 50}, stamp: 96, chip: 28, folderLabel: 28},
  square: {W: 1440, H: 1220, page: [480, 740], gutter: 150, spread: [95, 320], size: [32, 18],
    pen: {rest: [1236, 1000], angle: 40, shoulderY: 1300, lean: 10, min: 380, max: 1420, len: 220},
    rev: {shoulder: [1290, -330], rest: [1350, 112]}, arm: {upper: 430, lower: 410, width: 50}, stamp: 88, chip: 34, folderLabel: 36},
  portrait: {W: 900, H: 1430, page: [386, 800], gutter: 104, spread: [12, 460], size: [29, 17],
    pen: {rest: [680, 1268], angle: 40, shoulderY: 1500, lean: 0, min: 300, max: 960, len: 205},
    rev: {shoulder: [720, -300], rest: [810, 118]}, arm: {upper: 420, lower: 400, width: 46}, stamp: 84, chip: 30, folderLabel: 24},
  // contrast panels: compact desks (row / column arrangement) and a tall desk
  // for square side-by-side; each keeps a free strip where the pen rests
  panel: {W: 1200, H: 790, page: [430, 612], gutter: 140, spread: [40, 118], size: [27, 16],
    pen: {rest: [1066, 590], angle: 50, shoulderY: 980, lean: 10, min: 300, max: 1190, len: 195},
    rev: {shoulder: [1060, -300], rest: [1128, 96]}, arm: {upper: 400, lower: 380, width: 44}, stamp: 76, chip: 30, folderLabel: 24},
  panelTall: {W: 760, H: 1000, page: [304, 662], gutter: 112, spread: [20, 150], size: [26, 14],
    pen: {rest: [552, 846], angle: 42, shoulderY: 1170, lean: 0, min: 200, max: 760, len: 185},
    rev: {shoulder: [640, -300], rest: [690, 70]}, arm: {upper: 400, lower: 380, width: 42}, stamp: 72, chip: 30, folderLabel: 24},
};

/**
 * Desk geometry with an optional extra band at the top (bounded reflow for
 * long editorial notes): everything below the band — spread, rests and
 * shoulders — moves down with it, so poses are unchanged relative to the pages.
 * @param {keyof DESK} key
 * @param {number} [extraTop]
 */
export function deskGeometry(key, extraTop = 0) {
  const G = DESK[key];
  const e = Math.max(0, extraTop);
  if (!e) return G;
  return {
    ...G, H: G.H + e, spread: [G.spread[0], G.spread[1] + e],
    pen: {...G.pen, rest: [G.pen.rest[0], G.pen.rest[1] + e], shoulderY: G.pen.shoulderY + e},
    rev: {shoulder: [G.rev.shoulder[0], G.rev.shoulder[1] + e], rest: [G.rev.rest[0], G.rev.rest[1] + e]},
  };
}

/** Build the page layout for a desk geometry from params. */
export function deskLayout(ctx, key, p, extra = {}) {
  const G = DESK[key];
  return parallelLayout(ctx, {
    pageW: G.page[0], pageH: G.page[1], size: G.size, docId: p.documentId,
    source: {title: p.documentTitle, lang: p.languages.source, segments: p.clauses},
    target: {title: p.targetTitle, lang: p.languages.target, segments: p.translations},
    term: p.term, slotTexts: extra.slotTexts, showText: ctx.show('all'),
  });
}

/**
 * Top-down translation desk. The translator (arm from the bottom edge)
 * draws the guides and the term mark with a pen; the reviewer (arm from the
 * top edge) stamps the translation header.
 *
 * Attachments exposed through `pose().semantic`:
 *  - `penTip` is computed from the translator's SOLVED hand; while a mark is
 *    being drawn it equals `strokeEnd` (the end of the ink);
 *  - the stamp is positioned from the reviewer's solved hand; `stampTool`
 *    equals `stampSpot` while it presses.
 * @param {any} ctx
 * @param {{prefix:string, key:keyof DESK, p:any, L?:any, slotVariants:Array<any>, reveal?:boolean,
 *   plans:Array<string[]>, withStamp?:boolean, chips?:boolean, stampLabel:string, folderLabel?:string,
 *   dashedTarget?:boolean}} o
 */
export function translationDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = deskGeometry(o.key, o.extraTop || 0);
  const {W, H} = G;
  const p = o.p;
  const t = ctx.t;
  const show = ctx.show('all');
  const showKey = ctx.show('key');
  const L = o.L || deskLayout(ctx, o.key, p);
  const PW = L.pageW, PH = L.pageH;
  const srcTL = {x: G.spread[0], y: G.spread[1]};
  const tgtTL = {x: G.spread[0] + PW + G.gutter, y: G.spread[1]};
  const pageOpts = {showText: show, docId: p.documentId, redactions: p.redactions};
  const srcPage = pageNode(ctx, L, 'source', {...pageOpts, prefix: `${P}-src`, lang: p.languages.source, langLabel: t.original});
  const tgtPage = pageNode(ctx, L, 'target', {...pageOpts, prefix: `${P}-tgt`, lang: p.languages.target, langLabel: t.translation, slotVariants: o.slotVariants, reveal: o.reveal});
  const links = [];
  for (let i = 0; i < L.n; i++) {
    const geo = linkGeometry(L, i, srcTL, tgtTL);
    const dashed = i === L.k && o.dashedTarget;
    links.push({i, geo, dashed, name: `${P}-lk${i}`, color: pairColor(ctx, i).c});
  }
  const linkGroup = g(null, links.map(lk => linkNodes(ctx, lk.name, lk.geo, lk.color, {dashedTarget: lk.dashed || o.bothBrackets, width: G.page[0] > 450 ? 5 : 4.5})));

  // folder spread under both pages
  const fx = srcTL.x - 30, fy = srcTL.y - 34;
  const fw = PW * 2 + G.gutter + 60, fh = PH + 60;
  const folder = folderSpread(ctx, {w: fw, h: fh, spineX: PW + 30 + G.gutter / 2, label: o.folderLabel, showKey, size: G.folderLabel, tabMax: (o.folderTabMax ?? Infinity) - fx});
  const folderNode = g({transform: T(fx, fy)}, folder.node);
  /** top of the folder tab (stage y): editorial notes above the folder must end above it */
  const folderTop = fy - folder.tabH;

  // stamp + impression (translation header)
  const withStamp = o.withStamp !== false;
  const stampSpot = {x: tgtTL.x + L.stamp.x, y: tgtTL.y + L.stamp.y};
  const impression = alignImpression(ctx, {name: `${P}-impr`, text: o.stampLabel, w: L.stamp.w, color: th.accent4, showText: showKey});
  const stampNode = stampTool(ctx, {name: `${P}-stamp`, size: G.stamp, color: th.accent4});
  const stampRest = {x: G.rev.rest[0], y: G.rev.rest[1]};

  // pen + arms
  const lookA = actorLook(ctx, p.signers[0], 0);
  const lookB = actorLook(ctx, p.signers[1], 1);
  const armSpec = {...G.arm, handScale: 1.3};
  const armP = topArm(ctx, {name: `${P}-armP`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', ...armSpec});
  const armS = topArm(ctx, {name: `${P}-armS`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'left', ...armSpec});
  const penProp = penTool(ctx, {name: `${P}-pen`, length: G.pen.len, body: th.accent2});
  const penAngle = G.pen.angle;
  // index finger pressing on the grip section (pen-local coordinates): the
  // pen lies over the palm and under this finger and the thumb, so its barrel
  // stays visible past the hand while it is clearly held
  const fl = G.pen.len;
  const fw0 = fl * 0.1;
  const penFinger = g({name: `${P}-penfinger`},
    h('path', {d: `M${r(fl * 0.17)} ${r(-fw0 * 0.1)}C${r(fl * 0.17)} ${r(-fw0 * 0.75)} ${r(fl * 0.25)} ${r(-fw0 * 0.9)} ${r(fl * 0.32)} ${r(-fw0 * 0.8)}L${r(fl * 0.4)} ${r(-fw0 * 0.62)}L${r(fl * 0.4)} ${r(fw0 * 0.3)}L${r(fl * 0.3)} ${r(fw0 * 0.36)}C${r(fl * 0.22)} ${r(fw0 * 0.4)} ${r(fl * 0.17)} ${r(fw0 * 0.35)} ${r(fl * 0.17)} ${r(-fw0 * 0.1)}Z`,
      fill: lookA.skin, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(fl * 0.19)} ${r(-fw0 * 0.5)}Q${r(fl * 0.215)} ${r(-fw0 * 0.72)} ${r(fl * 0.245)} ${r(-fw0 * 0.62)}`, fill: 'none', stroke: shade(lookA.skin, -0.3), 'stroke-width': 1.6, 'stroke-linecap': 'round'}));
  /**
   * Pen angle for a tip position: the base angle, turned toward vertical (a
   * wrist rotation, continuous in x) just enough to keep the whole barrel
   * inside the desk window when the nib works near the right edge.
   */
  const reachX = W - 26;
  const angleAt = tip => {
    const room = (reachX - tip.x) / (G.pen.len * 0.97);
    const need = room >= 1 ? 0 : room <= 0 ? 90 : (Math.acos(room) * 180) / Math.PI;
    return Math.min(84, Math.max(penAngle, need));
  };
  const restTip = {x: G.pen.rest[0], y: G.pen.rest[1]};
  const shoulderS = {x: G.rev.shoulder[0], y: G.rev.shoulder[1]};

  // marks in stage coordinates
  const tm = tgtPage.marks;
  const off = q => ({x: q.x + tgtTL.x, y: q.y + tgtTL.y});
  const shift = poly => polyline(poly.pts.map(off));
  const markPolys = {};
  links.forEach(lk => { markPolys[`link${lk.i}`] = {key: `link${lk.i}`, poly: lk.geo.poly, speed: 1.15}; });
  if (tm) {
    markPolys.ul = {key: 'ul', poly: shift(tm.ul), speed: 1.3};
    markPolys.q = {key: 'q', poly: shift(tm.q), speed: 2.2};
    markPolys.write = {key: 'write', poly: shift(tm.write), speed: 1.6};
  }
  const plans = (o.plans || [[]]).map(keys => penPlan(keys.map(k => markPolys[k]).filter(Boolean), restTip));

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, seedKey: `tp-desk-${o.key}`});

  // actor chips near each arm's entry edge; a name and role that do not fit
  // on one line are stacked (name, then role) instead of being truncated
  const chipSize = G.chip;
  const roleA = (o.actorLabels && o.actorLabels.a) || p.signers[0].role;
  const roleB = (o.actorLabels && o.actorLabels.b) || p.signers[1].role;
  const chipAx = o.chipAx ?? G.pen.rest[0] - 60;
  const chipA = o.chips !== false && showKey
    ? actorChip(ctx, p.signers[0].name, roleA, {x: chipAx, bottom: H - 16, anchor: 'end', maxWidth: Math.min(W * 0.62, chipAx - 30), size: chipSize, name: `${P}-chipA`})
    : null;
  const chipB = o.chips !== false && showKey
    ? actorChip(ctx, p.signers[1].name, roleB, o.chipBAt
      ? {...o.chipBAt, size: chipSize, name: `${P}-chipB`}
      : {x: shoulderS.x - 150, y: 18, anchor: 'end', maxWidth: Math.min(W * 0.46, shoulderS.x - 150 - (o.chipBMinX ?? 0)), size: chipSize, name: `${P}-chipB`})
    : null;

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      folderNode,
      g({transform: T(srcTL.x, srcTL.y)}, srcPage.node),
      g({transform: T(tgtTL.x, tgtTL.y)}, tgtPage.node, withStamp ? g({transform: T(L.stamp.x, L.stamp.y)}, impression) : null),
      linkGroup,
      armP.arm, armP.palm,
      penProp.node, penFinger,
      armP.thumb,
      withStamp ? [stampNode, armS.arm, armS.palm, armS.thumb] : null,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  /**
   * @param {{pen:number[], stamp?:number, slot?:Record<string,number>, clip?:number, dashed?:number, tints?:number}} s
   *   pen: progress of each plan (the last plan with progress > 0 drives the pen);
   *   slot: opacity of each slot variant; clip: reveal of the slot content (0..1);
   *   dashed: target bracket of the term pair, 0 solid … 1 dashed.
   */
  function pose(s) {
    const nodes = {};
    const reduced = ctx.reduced;
    // --- active pen plan
    let active = 0;
    s.pen.forEach((v, i) => { if (v > 0) active = i; });
    const pl = plans[active].at(s.pen[active] || 0);
    // per-mark progress across plans
    const prog = {};
    plans.forEach((plan, pi) => {
      const st = pi === active ? pl : plan.at(s.pen[pi] || 0);
      (o.plans[pi] || []).filter(k => markPolys[k]).forEach((k, j) => { prog[k] = st.progress[j]; });
    });
    const cps = {};
    plans.forEach((plan, pi) => plan.checkpoints.forEach(c => { cps[c.key] = {...c, plan: pi}; }));
    const afterMark = (key, span) => {
      const c = cps[key];
      if (!c) return 0;
      const v = s.pen[c.plan] || 0;
      return clamp((v - c.end) / span);
    };
    // guides
    links.forEach(lk => {
      const key = `link${lk.i}`;
      const lp = prog[key] ?? 0;
      const bp = afterMark(key, 0.06);
      const dashed = lk.i === L.k ? (s.dashed ?? (lk.dashed ? 1 : 0)) : 0;
      Object.assign(nodes, linkFrame(lk.name, lk.geo, lp, bp, dashed, lk.dashed || o.bothBrackets));
      const tint = ease.inOutSine(clamp(bp * 1.4)) * 0.55 * (s.tints ?? 1);
      nodes[`${P}-src-tint-${lk.i}`] = {opacity: r(tint, 3)};
      nodes[`${P}-tgt-tint-${lk.i}`] = {opacity: r(tint, 3)};
      const col = bp > 0.2 ? lk.color : th.card;
      nodes[`${P}-src-badge-${lk.i}`] = {fill: col};
      nodes[`${P}-tgt-badge-${lk.i}`] = {fill: col};
      if (show) {
        nodes[`${P}-src-badgen-${lk.i}`] = {fill: bp > 0.2 ? '#fff' : th.ink};
        nodes[`${P}-tgt-badgen-${lk.i}`] = {fill: bp > 0.2 ? '#fff' : th.ink};
      }
    });
    // term marks and slot
    if (tm) {
      const ulp = s.marks && s.marks.ul !== undefined ? s.marks.ul : prog.ul ?? 0;
      const qp = s.marks && s.marks.q !== undefined ? s.marks.q : prog.q ?? 0;
      nodes[`${P}-tgt-ul`] = {'stroke-dashoffset': r(tm.ul.total * (1 - ulp))};
      nodes[`${P}-tgt-q`] = {'stroke-dashoffset': r(tm.q.total * (1 - qp))};
      nodes[`${P}-tgt-qdot`] = {opacity: qp >= 0.98 ? 1 : 0};
      Object.entries(s.slot || {}).forEach(([k, v]) => { nodes[`${P}-tgt-slot-${k}`] = {opacity: r(clamp(v), 3)}; });
      if (o.reveal) {
        const wp = s.clip ?? prog.write ?? 1;
        nodes[`${P}-tgt-clip`] = {width: r(Math.max(0.01, (L.slotW + 8) * clamp(wp)))};
      }
    }
    // pen hand
    const liftAmt = reduced ? 0 : pl.lift;
    const tipT = {x: pl.tip.x - 5 * liftAmt, y: pl.tip.y - 14 * liftAmt};
    const ang = angleAt(tipT);
    const penDir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
    const grip = {x: tipT.x + penDir.x * penProp.grip, y: tipT.y + penDir.y * penProp.grip};
    const sx = clamp(pl.tip.x + G.pen.lean, G.pen.min, G.pen.max);
    const want = armP.reach * 0.9;
    const dxs = Math.min(Math.abs(grip.x - sx), want * 0.9);
    const shoulderP = {x: sx, y: Math.max(G.pen.shoulderY, grip.y + Math.sqrt(want * want - dxs * dxs))};
    const solvedP = armP.pose(shoulderP, grip, -1);
    Object.assign(nodes, solvedP.nodes);
    const penTip = {x: solvedP.hand.x - penDir.x * penProp.grip, y: solvedP.hand.y - penDir.y * penProp.grip};
    nodes[`${P}-pen`] = {transform: T(penTip.x, penTip.y, r(ang, 2), 1 + 0.05 * liftAmt)};
    nodes[`${P}-penfinger`] = {transform: T(penTip.x, penTip.y, r(ang, 2), 1 + 0.05 * liftAmt)};

    // stamp
    let press = 0;
    let stampPos = stampRest;
    let solvedS = null;
    if (withStamp) {
      const st = clamp(s.stamp ?? 0);
      const go = seg(st, 0, 0.4), down = seg(st, 0.4, 0.5), up = seg(st, 0.5, 0.6), back = seg(st, 0.6, 1);
      const target = back > 0 ? mix(stampSpot, stampRest, ease.inOutSine(back)) : mix(stampRest, stampSpot, ease.inOutSine(go));
      press = down > 0 && up < 1 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
      const carried = st > 0 && st < 1 ? 1 - press : 0;
      solvedS = armS.pose(shoulderS, target, 1);
      stampPos = solvedS.hand;
      nodes[`${P}-stamp`] = {transform: T(stampPos.x, stampPos.y, 0, (1 + 0.07 * carried) * (1 - 0.08 * press))};
      nodes[`${P}-stamp-shadow`] = {opacity: r(1 - press * 0.85, 3)};
      Object.assign(nodes, solvedS.nodes);
      nodes[`${P}-impr`] = {opacity: st >= 0.5 ? 0.92 : 0};
    }
    const R2 = q => ({x: r(q.x), y: r(q.y)});
    const drawingKey = pl.drawing >= 0 ? (o.plans[active].filter(k => markPolys[k])[pl.drawing]) : null;
    const strokeEnd = drawingKey ? markPolys[drawingKey].poly.at(prog[drawingKey]) : null;
    const linkProgress = links.map(lk => r(prog[`link${lk.i}`] ?? 0, 3));
    return {
      nodes,
      semantic: {
        penTip: R2(penTip),
        handPen: R2(solvedP.hand),
        penGrip: R2(grip),
        strokeEnd: strokeEnd ? R2(strokeEnd) : null,
        drawing: drawingKey,
        links: linkProgress,
        linked: linkProgress.filter(v => v >= 1).length,
        underline: r(s.marks && s.marks.ul !== undefined ? s.marks.ul : prog.ul ?? 0, 3),
        question: r(s.marks && s.marks.q !== undefined ? s.marks.q : prog.q ?? 0, 3),
        write: r(prog.write ?? 0, 3),
        stampTool: R2(stampPos),
        stampSpot: press > 0.5 ? R2(stampSpot) : null,
        stampPressed: press > 0.5,
        stampApplied: withStamp && (s.stamp ?? 0) >= 0.5,
        reach: {pen: solvedP.reached, stamp: solvedS ? solvedS.reached : true},
        allReached: solvedP.reached && (!solvedS || solvedS.reached),
      },
    };
  }

  return {
    node, pose, L, W, H, srcTL, tgtTL, links, plans, markPolys, stampSpot, penRest: restTip, folderTop, chipA, chipB,
    /** stage point of the slot (translated page) */
    slotBox: L.slot ? {x: tgtTL.x + L.slot.x, y: tgtTL.y + L.slot.y - L.s * 0.12, w: L.slotW, h: L.s * 1.2 + L.lead * ((L.slotLines || 1) - 1)} : null,
    termBox: L.term ? {x: srcTL.x + L.term.x, y: srcTL.y + L.term.y - L.s * 0.12, w: L.term.w, h: L.s * 1.2} : null,
  };
}

/**
 * Fit text by wrapping at spaces only — a word is never split across lines —
 * with letter-spacing included in every measurement. The size shrinks (down
 * to `minSize`) until every line fits `maxWidth` within `maxLines` and
 * `maxHeight`. When even `minSize` cannot hold the longest word, the result
 * reports the width it needs (`needW`) so the caller can widen its box.
 * Returns a FitResult-compatible object (usable by `textBlock`).
 * @param {any} ctx
 * @param {string} text
 * @param {{maxWidth:number, maxHeight?:number, size:number, minSize:number, maxLines?:number,
 *   weight?:number, family?:'sans'|'serif'|'mono', ls?:number, leading?:number}} o
 */
export function fitWords(ctx, text, o) {
  const weight = o.weight ?? 700;
  const family = o.family ?? 'sans';
  const ls = o.ls ?? 0;
  const leading = o.leading ?? 1.18;
  const maxLines = o.maxLines ?? 2;
  const maxHeight = o.maxHeight ?? Infinity;
  const full = String(text ?? '');
  const words = full.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  // letter-spacing is added after every glyph (the trailing one included)
  const W = (s, sz) => ctx.measure(s, sz, weight, family) + ls * [...s].length;
  const wrapAt = sz => {
    const lines = [];
    let cur = '';
    for (const w of words) {
      const cand = cur ? `${cur} ${w}` : w;
      if (!cur || W(cand, sz) <= o.maxWidth) cur = cand;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  };
  const result = (lines, sz, fits) => {
    const width = Math.max(...lines.map(l => W(l, sz)));
    return {lines, size: sz, lineHeight: sz * leading, width, height: sz * leading * (lines.length - 1) + sz, truncated: false, full, weight, family, fits, needW: width};
  };
  for (let sz = o.size; sz >= o.minSize - 1e-6; sz -= 0.5) {
    if (words.some(w => W(w, sz) > o.maxWidth)) continue;
    const lines = wrapAt(sz);
    const hh = sz * leading * (lines.length - 1) + sz;
    if (lines.length <= maxLines && hh <= maxHeight) return result(lines, sz, true);
  }
  // nothing fits: keep whole words at minSize, one word group per line, and report the width needed
  const sz = o.minSize;
  const lines = [];
  let cur = '';
  const cap = Math.max(o.maxWidth, ...words.map(w => W(w, sz)));
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (!cur || W(cand, sz) <= cap) cur = cand;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return result(lines.length ? lines.slice(0, Math.max(maxLines, 1)) : [''], sz, false);
}

/** "Aligned" stamp impression: double frame, two linked brackets icon and label. Local origin = centre. */
export function alignImpression(ctx, {name, text, w: w0, color, showText, rotate = -7}) {
  const hh = w0 * 0.36;
  const ls = 1.2;
  // the label never breaks inside a word: it shrinks, wraps at spaces, and as
  // a last resort the impression grows to the measured width of its longest
  // word. The bracket icon gives up width first so the label stays as large
  // as possible (it is the readable part of the stamp).
  let icon = hh * 0.62;
  let f = null;
  for (const k of [1, 0.8, 0.62]) {
    icon = hh * 0.62 * k;
    f = fitWords(ctx, text || ' ', {maxWidth: w0 - icon - hh * 0.5, maxHeight: hh - 14, size: hh * 0.44, minSize: hh * 0.3, maxLines: 2, weight: 800, ls});
    if (f.fits) break;
  }
  if (!f.fits) f = fitWords(ctx, text || ' ', {maxWidth: w0 - icon - hh * 0.5, maxHeight: hh - 14, size: hh * 0.3, minSize: 9, maxLines: 2, weight: 800, ls});
  const w = f.fits ? w0 : Math.max(w0, f.needW + icon + hh * 0.5);
  const ix = -w / 2 + hh * 0.2;
  const tx = ix + icon + hh * 0.18 + (w / 2 - hh * 0.12 - (ix + icon + hh * 0.18)) / 2;
  return g({name, opacity: 0, transform: T(0, 0, rotate)},
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 8, fill: 'none', stroke: color, 'stroke-width': 4}),
    h('rect', {x: r(-w / 2 + 6), y: r(-hh / 2 + 6), width: r(w - 12), height: r(hh - 12), rx: 5, fill: 'none', stroke: color, 'stroke-width': 1.6}),
    h('path', {d: `M${r(ix + icon * 0.28)} ${r(-icon * 0.42)}H${r(ix + icon * 0.08)}V${r(icon * 0.42)}H${r(ix + icon * 0.28)}M${r(ix + icon * 0.72)} ${r(-icon * 0.42)}H${r(ix + icon * 0.92)}V${r(icon * 0.42)}H${r(ix + icon * 0.72)}M${r(ix + icon * 0.08)} ${r(-icon * 0.05)}C${r(ix + icon * 0.5)} ${r(-icon * 0.05)} ${r(ix + icon * 0.5)} ${r(icon * 0.1)} ${r(ix + icon * 0.92)} ${r(icon * 0.1)}`, fill: 'none', stroke: color, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    showText
      // text-anchor middle centres the advance, which includes the trailing letter-space: shift it back
      ? textBlock(f, {x: r(tx + ls / 2), y: -f.height / 2, anchor: 'middle', fill: color, letterSpacing: ls})
      : h('path', {d: `M${r(tx - w * 0.2)} ${r(-hh * 0.08)}H${r(tx + w * 0.2)}M${r(tx - w * 0.13)} ${r(hh * 0.16)}H${r(tx + w * 0.13)}`, stroke: color, 'stroke-width': hh * 0.11, 'stroke-linecap': 'round'}),
  );
}

/**
 * Actor label chip: "Name · Role" on one line when it fits; otherwise the
 * name and the role each get their own block (up to two lines each) so no
 * part of the meaning is lost to an ellipsis.
 * @param {any} ctx
 * @param {string} name
 * @param {string} role
 * @param {{x:number, y?:number, bottom?:number, anchor?:'start'|'middle'|'end', maxWidth:number, size:number, name:string}} o
 */
export function actorChip(ctx, name, role, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = size * 0.6, padY = size * 0.38;
  const inner = o.maxWidth - padX * 2;
  const one = ctx.fit(role ? `${name} · ${role}` : name, {maxWidth: inner, size, minSize: size * 0.88, maxLines: 1, weight: 600});
  const blocks = [];
  if (!one.truncated) blocks.push({f: one, color: th.ink});
  else {
    blocks.push({f: ctx.fit(name, {maxWidth: inner, size, minSize: size * 0.8, maxLines: 2, weight: 700}), color: th.ink});
    if (role) blocks.push({f: ctx.fit(role, {maxWidth: inner, size: size * 0.86, minSize: size * 0.72, maxLines: 2, weight: 500}), color: th.inkSoft});
  }
  // stacked name / role blocks keep a clear gap (their glyph boxes never touch)
  const gap = size * 0.42;
  const w = Math.max(...blocks.map(b => b.f.width)) + padX * 2;
  const hh = blocks.reduce((a, b) => a + b.f.height, 0) + gap * (blocks.length - 1) + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const y = o.bottom !== undefined ? o.bottom - hh : o.y;
  let ty = y + padY;
  const texts = blocks.map(b => { const n = textBlock(b.f, {x: x + w / 2, y: ty, anchor: 'middle', fill: b.color}); ty += b.f.height + gap; return n; });
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    texts);
  return {node, box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2}};
}

/**
 * Elbow leader callout: chip + polyline leader (routed by the caller through
 * text-free lanes) + end dot. frame(p) draws the leader then shows the chip.
 */
export function routedCallout(ctx, o) {
  const th = ctx.theme;
  const c = chip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size ?? 28, maxLines: o.maxLines ?? 3, fill: th.card, stroke: o.color ?? th.ink, name: `${o.name}-chip`});
  const pts = o.route(c.box);
  const pl = polyline(pts);
  const color = o.color ?? th.ink;
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  const end = pts[pts.length - 1];
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-lead`, d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(pl.total)} ${r(pl.total + 6)}`, 'stroke-dashoffset': r(pl.total)}),
    h('circle', {name: `${o.name}-dot`, cx: r(end.x), cy: r(end.y), r: 7, fill: color, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
    c.node,
  );
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(pl.total * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: r(clamp((p - 0.45) / 0.55), 3)},
  });
  return {node, frame, box: c.box, end};
}

/**
 * Descriptive state chip: coloured dot + one or two fitted lines (no verdict).
 * @param {any} ctx
 * @param {string[]} lines
 * @param {{x:number, y:number, maxWidth:number, size:number, color:string, name:string, anchor?:'start'|'middle'|'end'}} o
 */
export function stateChip(ctx, lines, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = size * 0.6, padY = size * 0.4;
  const dotR = size * 0.26;
  const textX0 = padX + dotR * 2 + size * 0.4;
  const fits = lines.filter(Boolean).map((t, i) => ctx.fit(t, {maxWidth: o.maxWidth - textX0 - padX, size: i ? size * 0.86 : size, minSize: size * 0.7, maxLines: 2, weight: i ? 600 : 700}));
  const w = Math.max(...fits.map(f => f.width)) + textX0 + padX;
  let hh = padY;
  const lg = size * 0.36;
  const blocks = fits.map(f => { const y = hh; hh += f.height + lg; return {f, y}; });
  hh += padY - lg;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const node = g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.8)), fill: th.card, stroke: o.color, 'stroke-width': 2.5}),
    h('circle', {cx: r(x + padX + dotR), cy: r(o.y + padY + size * 0.5), r: r(dotR), fill: o.color}),
    blocks.map((b, i) => textBlock(b.f, {x: x + textX0, y: o.y + b.y, fill: i ? th.inkSoft : o.color})),
  );
  return {node, box: {x, y: o.y, w, h: hh}};
}

export {dist};
