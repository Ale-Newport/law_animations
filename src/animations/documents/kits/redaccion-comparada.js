/**
 * Kit for the "Redacción comparada" motif (LAW-0013..0016): two versions of
 * the same document laid side by side with their clause rows ALIGNED, and a
 * pen that circles each modified word in the original, carries a leader
 * across the gutter and circles its replacement in the revised text.
 *
 * What lives here (geometry only; every entry owns its timeline, layout and
 * semantics):
 *  - a word-level change model built from the original clause wording plus a
 *    list of edits (`buildDiff`), with real word tokens and punctuation;
 *  - a shared, row-aligned layout for both versions (`alignedLayout`): one
 *    body font size, clause rows sized to the longer version so row N starts
 *    at the same height on both sheets;
 *  - a version sheet drawer (`sheetNode`) with a version tab, clause numbers,
 *    word tokens (or word-shaped bars when labels are hidden), highlight
 *    groups per change and redaction bars;
 *  - hand-drawn pen marks: loop around word A → leader through the line gap
 *    and across the gutter → loop around word B (`linkPoints`), and a row
 *    check mark (`tickPoints`); `penPlan` schedules the pen over those marks
 *    so the pen tip IS the end of the ink stroke while drawing;
 *  - an open folder spread and the top-down review desk used by the story and
 *    contrast treatments (`compareDesk`, with IK arms).
 * @module animations/documents/kits/redaccion-comparada
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, dist, polyline, cubic, catmullRom, roundRectPath} from '../../../core/geometry.js';
import {FONTS} from '../../../core/text.js';
import {pen as penTool, stampTool, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';
import {documentsFields, party, str, int, list, obj} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ fields */

/** One wording change between the original (A) and the revised (B) text. */
export const editField = obj('One wording change between the two versions', {
  clause: int('Zero-based index of the clause that changes', 0, 3),
  from: str('Words of the original clause that were modified; they must appear verbatim in that clause', 40, {minLength: 1}),
  to: str('Replacement words in the revised version (an empty string marks a deletion)', 40),
}, ['clause', 'from', 'to']);

/** Document fields for this motif (category documents + the edit list). */
export const comparedFields = {
  ...documentsFields,
  signers: list('Drafting party who brings the revised version (first) and reviewer who compares it (second)', party, 2, 2),
  clauses: list('Original wording of each clause (version A). The revised version (B) is derived by applying `edits`; clause rows stay aligned across both versions', str('Clause wording', 90, {minLength: 1}), 1, 4),
  edits: list('Wording changes that turn the original text into the revised text. An edit whose `from` words are not found in its clause is ignored and reported in the scene state (unmatchedEdits)', editField, 0, 4),
  redactions: list('Zero-based clause indices whose wording is withheld by redaction bars in both versions (changes inside them are not linked)', int('Clause index', 0, 3), 0, 4),
};

/** Scene-specific built-in strings shared by the four entries. */
export const COMPARE_STRINGS = {
  en: {original: 'Original text', revised: 'Revised text', compared: 'Compared', linked: 'Changes linked', aligned: 'Aligned — no links drawn', unchanged: 'Same wording', row: 'Row'},
  es: {original: 'Texto original', revised: 'Texto revisado', compared: 'Cotejado', linked: 'Cambios enlazados', aligned: 'Alineado — sin enlaces', unchanged: 'Misma redacción', row: 'Fila'},
};

/* ------------------------------------------------------------ change model */

const WORDCH = /[\p{L}\p{N}]/u;

/** First non-overlapping occurrence, preferring whole-word matches. */
function findPhrase(text, phrase, taken) {
  const free = at => !taken.some(t => at < t.end && at + phrase.length > t.at);
  let fallback = -1;
  for (let at = text.indexOf(phrase); at >= 0; at = text.indexOf(phrase, at + 1)) {
    if (!free(at)) continue;
    const before = at > 0 ? text[at - 1] : ' ';
    const after = at + phrase.length < text.length ? text[at + phrase.length] : ' ';
    const okL = !(WORDCH.test(before) && WORDCH.test(phrase[0]));
    const okR = !(WORDCH.test(after) && WORDCH.test(phrase[phrase.length - 1]));
    if (okL && okR) return at;
    if (fallback < 0) fallback = at;
  }
  return fallback;
}

/** Split text segments into word tokens that remember the space before them. */
function tokenize(segs) {
  const out = [];
  let ws = false;
  for (const s of segs) {
    if (s.gap) {
      out.push({text: '', change: s.change, gap: true, space: true});
      ws = true;
      continue;
    }
    const re = /(\s+)|(\S+)/g;
    let m;
    while ((m = re.exec(s.text))) {
      if (m[1]) ws = true;
      else {
        out.push({text: m[2], change: s.change, space: ws});
        ws = false;
      }
    }
  }
  if (out.length) out[0].space = false;
  return out;
}

/**
 * Word-level change model. Each clause row gets the original tokens (A) and
 * the revised tokens (B); tokens of an edited phrase carry the edit index.
 * @param {string[]} clauses original wording
 * @param {Array<{clause:number, from:string, to:string}>} edits
 * @param {number[]} [redactions]
 */
export function buildDiff(clauses, edits, redactions = []) {
  const red = new Set(redactions.filter(i => i < clauses.length));
  const changes = edits.map((e, i) => ({i, clause: e.clause, from: String(e.from).trim(), to: String(e.to ?? '').trim(), matched: false, redacted: red.has(e.clause)}));
  const rows = clauses.map((text, ci) => {
    const found = [];
    if (!red.has(ci)) {
      for (const c of changes) {
        if (c.clause !== ci || !c.from) continue;
        const at = findPhrase(text, c.from, found);
        if (at < 0) continue;
        c.matched = true;
        found.push({at, end: at + c.from.length, c});
      }
    }
    found.sort((a, b) => a.at - b.at);
    const A = [];
    const B = [];
    let pos = 0;
    for (const f of found) {
      if (f.at > pos) {
        A.push({text: text.slice(pos, f.at), change: -1});
        B.push({text: text.slice(pos, f.at), change: -1});
      }
      A.push({text: f.c.from, change: f.c.i});
      B.push(f.c.to ? {text: f.c.to, change: f.c.i} : {gap: true, change: f.c.i});
      pos = f.end;
    }
    if (pos < text.length) {
      A.push({text: text.slice(pos), change: -1});
      B.push({text: text.slice(pos), change: -1});
    }
    return {text, redacted: red.has(ci), A: tokenize(A), B: tokenize(B), changes: found.map(f => f.c.i)};
  });
  // Linked marks run in reading order (row, then position in the row).
  const order = [];
  rows.forEach(row => row.changes.forEach(i => order.push(i)));
  return {
    rows,
    changes,
    order,
    unmatched: changes.filter(c => !c.matched && !c.redacted).map(c => c.i),
  };
}

/**
 * Replace the text of one edited phrase (used by the inspect treatment).
 * @param {any[]} tokens
 * @param {number} change
 * @param {string} text
 */
export function replacePhrase(tokens, change, text) {
  const out = [];
  let done = false;
  for (const t of tokens) {
    if (t.change !== change) {
      out.push(t);
      continue;
    }
    if (done) continue;
    done = true;
    const words = tokenize([{text: String(text).trim(), change}]);
    if (!words.length) out.push({text: '', change, gap: true, space: true});
    words.forEach((w, k) => out.push({...w, space: k === 0 ? t.space : w.space}));
  }
  return out;
}

/* ----------------------------------------------------------- word flowing */

const BODY = {weight: 400, family: 'serif'};

/**
 * Greedy flow of tokens into lines of `width`. The words of one edited phrase
 * stay together when they fit on a line, and trailing punctuation never
 * starts a line on its own.
 */
export function flowTokens(ctx, tokens, width, size) {
  const m = t => (t.gap ? size * 0.95 : ctx.measure(t.text, size, BODY.weight, BODY.family));
  const sp = ctx.measure('a a', size, BODY.weight, BODY.family) - ctx.measure('aa', size, BODY.weight, BODY.family) || size * 0.26;
  const ws = tokens.map(m);
  const place = new Array(tokens.length);
  let x = 0;
  let line = 0;
  let tooWide = false;
  const put = k => {
    const lead = x > 0 && tokens[k].space ? sp : 0;
    if (x > 0 && x + lead + ws[k] > width) {
      line++;
      x = 0;
    } else x += lead;
    place[k] = {x, line, w: ws[k]};
    x += ws[k];
  };
  let i = 0;
  while (i < tokens.length) {
    let j = i + 1;
    if (tokens[i].change >= 0) while (j < tokens.length && tokens[j].change === tokens[i].change) j++;
    let unitW = 0;
    for (let k = i; k < j; k++) unitW += ws[k] + (k > i && tokens[k].space ? sp : 0);
    let tail = 0;
    for (let k = j; k < tokens.length && !tokens[k].space; k++) tail += ws[k];
    for (let k = i; k < j; k++) if (ws[k] > width) tooWide = true;
    if (unitW + tail <= width) {
      const lead = x > 0 && tokens[i].space ? sp : 0;
      if (x > 0 && x + lead + unitW + tail > width) {
        line++;
        x = 0;
      }
      for (let k = i; k < j; k++) {
        x += x > 0 && tokens[k].space ? sp : 0;
        place[k] = {x, line, w: ws[k]};
        x += ws[k];
      }
    } else {
      for (let k = i; k < j; k++) put(k);
    }
    i = j;
  }
  return {place, lines: tokens.length ? line + 1 : 1, tooWide};
}

/* ------------------------------------------------------- aligned layout */

/**
 * Row-aligned layout of both versions on sheets of w × h (sheet-local
 * coordinates, origin top-left). The body size is the largest size ≤ `size`
 * (≥ `minSize`) at which every row of every variant fits.
 *
 * `leading` (line pitch / body size, default 1.5): sheets that carry pen links
 * ask for a wider pitch (LINK_LEADING) so a leader running through a line gap
 * clears the loops of the lines above and below it. The wide pitch is kept
 * while the body can stay ≥ 86% of `size`; otherwise a medium pitch is tried
 * down to `minSize`, and only then the plain 1.5 pitch.
 * @param {any} ctx
 * @param {{w:number, h:number, rows:any[], size:number, minSize:number, docId?:string, title?:string, footer?:number, extra?:Record<number, any[][]>, leading?:number}} o
 *   `extra[row]` = additional token lists whose line count the row must also
 *   reserve (e.g. a substituted datum).
 */
export function alignedLayout(ctx, o) {
  const {w, h: hh} = o;
  const pad = Math.round(w * 0.075);
  const fold = w * 0.09;
  const idSize = Math.max(13, w * 0.03);
  const titleSize = Math.max(17, w * 0.048);
  const idFit = ctx.fit(o.docId || ' ', {maxWidth: w - pad * 2 - fold, size: idSize, minSize: 11, maxLines: 1, weight: 600, family: 'mono'});
  const titleFit = ctx.fit(o.title || ' ', {maxWidth: w - pad * 2 - fold * 0.5, size: titleSize, minSize: titleSize * 0.72, maxLines: 2, weight: 700, family: 'serif'});
  let y = pad * 0.78;
  const idY = y;
  y += idSize * 1.72;
  const titleY = y;
  y += Math.max(titleFit.height, titleSize * 1.1) + titleSize * 0.35;
  const ruleY = y;
  y += titleSize * 0.62;
  const bodyTop = y;
  const footerY = hh - hh * (o.footer ?? 0.12);
  const avail = footerY - bodyTop - 4;

  const attempt = (size, lead) => {
    const numW = size * 1.5;
    const textW = w - pad * 2 - numW;
    const lineH = size * lead;
    const gap = size * 0.62;
    let total = 0;
    let fits = true;
    const flows = o.rows.map((row, ci) => {
      const variants = [row.A, row.B, ...((o.extra && o.extra[ci]) || [])];
      const fl = variants.map(tk => flowTokens(ctx, tk, textW, size));
      if (fl.some(f => f.tooWide)) fits = false;
      const lines = Math.max(...fl.map(f => f.lines));
      total += lines * lineH;
      return {fl, lines};
    });
    total += gap * Math.max(0, o.rows.length - 1);
    return {size, numW, textW, lineH, gap, flows, total, lead, fits: fits && total <= avail};
  };
  const lead0 = Math.max(1.5, o.leading ?? 1.5);
  const leads = lead0 > 1.5 ? [lead0, (lead0 + 1.5) / 2, 1.5] : [1.5];
  let pick = null;
  for (let li = 0; li < leads.length && !pick; li++) {
    const floor = li === 0 && leads.length > 1 ? Math.max(o.minSize, o.size * 0.86) : o.minSize;
    for (let s = o.size; s >= floor - 1e-6; s -= 0.5) {
      const a = attempt(s, leads[li]);
      if (a.fits) {
        pick = a;
        break;
      }
    }
  }
  if (!pick) pick = attempt(o.minSize, 1.5);
  const {size, numW, textW, lineH, gap, flows} = pick;
  // words sit in the middle of their (possibly wider) line pitch
  const lo = (lineH - size * 1.5) / 2;
  const textX = pad + numW;
  // Spread spare height a little so short texts do not huddle at the top.
  const spare = Math.max(0, avail - pick.total);
  const extraGap = o.rows.length > 1 ? Math.min(spare * 0.35, size * 0.9) / (o.rows.length - 1) : 0;
  const top0 = bodyTop + Math.min(spare * 0.12, size * 0.6);
  let yy = top0;
  const rows = [];
  const place = [];
  o.rows.forEach((row, ci) => {
    const f = flows[ci];
    const tops = yy;
    const mk = (tokens, fl) => tokens.map((t, k) => ({...t, x: textX + fl.place[k].x, y: tops + lo + fl.place[k].line * lineH, w: fl.place[k].w, line: fl.place[k].line, row: ci}));
    place.push({A: mk(row.A, f.fl[0]), B: mk(row.B, f.fl[1]), extra: (f.fl.slice(2)).map((fl, k) => mk(o.extra[ci][k], fl))});
    rows.push({top: tops, h: f.lines * lineH, lines: f.lines, redacted: row.redacted});
    yy += f.lines * lineH + gap + extraGap;
  });
  const L = {
    w, h: hh, pad, fold, size, lineH, lo, numW, textX, textW, rows, place,
    idFit, titleFit, idY, titleY, ruleY, idSize, titleSize, bodyTop, footerY,
    /** glyph box of a placed token list's change (merged per line) */
    segs: (tokens, change) => segments(tokens, change, size),
    baseline: lineTop => lineTop + size * 0.92,
  };
  return L;
}

/** Merge the tokens of one change into glyph boxes, one per line. */
export function segments(tokens, change, size) {
  const out = [];
  for (const t of tokens) {
    if (t.change !== change) continue;
    const last = out[out.length - 1];
    if (last && last.line === t.line && last.row === t.row) {
      last.w = t.x + t.w - last.x;
    } else out.push({x: t.x, lineTop: t.y, line: t.line, row: t.row, w: t.w});
  }
  return out.map(s => ({...s, y: s.lineTop + size * 0.16, h: size * 1.0}));
}

/* ---------------------------------------------------------- sheet drawing */

const barColor = th => shade(th.paperLine, -0.14);

/** Version colours: A = original (warm), B = revised (cool). */
export function versionStyle(ctx, side) {
  const th = ctx.theme;
  return side === 'A'
    ? {tab: th.accent3, tabText: th.ink, fill: th.accentSoft, line: th.accent}
    : {tab: th.accent2, tabText: '#ffffff', fill: th.accent2Soft, line: th.accent2};
}

/**
 * One version sheet. Local origin = top-left of the sheet.
 * Named nodes: `${prefix}` (group), `${prefix}-hl-${i}` (highlight of change
 * i), `${prefix}-shadow` (drop shadow, for lifting).
 * @param {any} ctx
 * @param {any} L  alignedLayout result
 * @param {{prefix:string, tokens:any[][], side:'A'|'B', tab?:string, tabSize?:number, tabLines?:number, tabMax?:number, showText:boolean, showKey:boolean, hlOpacity?:number, omitRows?:number[], skipHl?:number[], morph?:{tokens:any[][], rows:number[]}}} o
 *   `tokens[row]` = placed tokens to draw; `omitRows` rows the entry draws itself;
 *   `morph` rows are rewritten in place: their modified words are drawn twice
 *   (`${prefix}-mo0-${row}` base wording, `${prefix}-mo1-${row}` final wording)
 *   and every unchanged word that has to move to make room is its own node
 *   (listed in the returned `moves` with its offset), so an entry can lift the
 *   old words out, glide the rest of the line and settle the new words.
 */
export function sheetNode(ctx, L, o) {
  const th = ctx.theme;
  const {w, h: hh, pad, fold, size} = L;
  const P = o.prefix;
  const parts = [];
  if (o.tab !== undefined) parts.push(tabNode(ctx, L, o.tab, o.side, o.showKey, o.tabSize, o.tabLines, o.tabMax));
  parts.push(h('path', {name: `${P}-shadow`, d: roundRectPath(0, 0, w, hh, 6), fill: th.shadow, transform: T(7, 10)}));
  parts.push(h('path', {d: `M0 4Q0 0 4 0H${r(w - fold)}L${w} ${r(fold)}V${hh - 4}Q${w} ${hh} ${w - 4} ${hh}H4Q0 ${hh} 0 ${hh - 4}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  // header: document id + title (same on both versions)
  if (o.showKey) {
    parts.push(textBlock(L.idFit, {x: pad, y: L.idY, fill: th.inkSoft}));
    parts.push(textBlock(L.titleFit, {x: pad, y: L.titleY, fill: th.ink}));
  } else {
    parts.push(h('rect', {x: pad, y: L.idY + 2, width: r(Math.min(L.idFit.width, w * 0.3)), height: r(L.idSize * 0.6), rx: 3, fill: th.paperLine}));
    L.titleFit.lines.forEach((ln, k) => parts.push(h('rect', {x: pad, y: r(L.titleY + k * L.titleFit.lineHeight + L.titleSize * 0.18), width: r(Math.min(ctx.measure(ln, L.titleFit.size, 700, 'serif'), w - pad * 2)), height: r(L.titleSize * 0.62), rx: 4, fill: th.ink, opacity: 0.78})));
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: r(L.ruleY), y2: r(L.ruleY), stroke: th.paperLine, 'stroke-width': 2}));

  // highlights behind the words
  const omit = new Set(o.omitRows || []);
  const skip = new Set(o.skipHl || []);
  const changesDrawn = new Set();
  o.tokens.forEach((row, ci) => {
    if (omit.has(ci) || L.rows[ci].redacted) return;
    row.forEach(t => { if (t.change >= 0 && !skip.has(t.change)) changesDrawn.add(t.change); });
  });
  for (const i of changesDrawn) {
    const all = o.tokens.flat().filter(t => t.change === i);
    parts.push(highlightNode(ctx, L, `${P}-hl-${i}`, segments(all, i, size), o.side, o.hlOpacity ?? 0, all.some(t => t.gap)));
  }

  // clause rows
  const moves = [];
  L.rows.forEach((row, ci) => {
    const lineTop = row.top + (L.lo || 0);
    const cy = lineTop + size * 0.62;
    parts.push(h('circle', {cx: r(pad + size * 0.52), cy: r(cy), r: r(size * 0.5), fill: 'none', stroke: th.paperLine, 'stroke-width': 2}));
    if (o.showKey) parts.push(h('text', {x: r(pad + size * 0.52), y: r(cy + size * 0.22), 'text-anchor': 'middle', 'font-size': r(size * 0.6), 'font-weight': 700, 'font-family': FONTS.sans, fill: th.inkSoft}, String(ci + 1)));
    if (omit.has(ci)) return;
    const toks = o.tokens[ci] || [];
    if (row.redacted) {
      for (let ln = 0; ln < row.lines; ln++) {
        const onLine = toks.filter(t => t.line === ln);
        const x1 = onLine.length ? Math.max(...onLine.map(t => t.x + t.w)) : L.textX + L.textW * 0.6;
        parts.push(h('rect', {x: r(L.textX - 3), y: r(lineTop + ln * L.lineH + size * 0.1), width: r(Math.max(size * 3, x1 - L.textX + 6)), height: r(size * 1.02), rx: 3, fill: th.ink}));
      }
      return;
    }
    if (o.morph && o.morph.rows.includes(ci)) {
      // this row is rewritten in place: only the modified words are swapped;
      // unchanged words keep their identity and glide to their new place
      const from = o.morph.tokens[ci] || [];
      const fu = from.filter(t => t.change < 0 && !t.gap);
      const tu = toks.filter(t => t.change < 0 && !t.gap);
      const still = [];
      fu.forEach((t, k) => {
        const d = tu[k];
        const dx = d ? d.x - t.x : 0, dy = d ? d.y - t.y : 0;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          still.push(t);
          return;
        }
        const name = `${P}-mw-${ci}-${k}`;
        moves.push({name, dx, dy});
        parts.push(tokensNode(ctx, L, [t], o.showText, {name}));
      });
      parts.push(tokensNode(ctx, L, still, o.showText));
      parts.push(tokensNode(ctx, L, from.filter(t => t.change >= 0), o.showText, {name: `${P}-mo0-${ci}`}));
      parts.push(tokensNode(ctx, L, toks.filter(t => t.change >= 0), o.showText, {name: `${P}-mo1-${ci}`, opacity: 0}));
      return;
    }
    parts.push(tokensNode(ctx, L, toks, o.showText));
  });
  // footer rule + page marker
  parts.push(h('line', {x1: pad, x2: w - pad, y1: r(L.footerY + size * 0.4), y2: r(L.footerY + size * 0.4), stroke: th.paperLine, 'stroke-width': 1.6}));
  parts.push(h('rect', {x: r(w - pad - size * 1.6), y: r(L.footerY + size * 0.9), width: r(size * 1.6), height: r(size * 0.36), rx: 2, fill: th.paperLine}));
  return {node: g({name: P}, parts), hl: [...changesDrawn], moves};
}

/** Word tokens as text nodes, or as word-shaped bars when text is hidden. */
export function tokensNode(ctx, L, toks, showText, attrs = {}) {
  const th = ctx.theme;
  const size = L.size;
  if (showText) {
    return g(attrs, toks.filter(t => !t.gap).map(t => h('text', {x: r(t.x), y: r(L.baseline(t.y)), 'font-size': r(size, 2), 'font-family': FONTS.serif, fill: th.ink}, t.text)));
  }
  return g(attrs, toks.filter(t => !t.gap).map(t => h('rect', {x: r(t.x), y: r(t.y + size * 0.42), width: r(Math.max(4, t.w)), height: r(size * 0.42), rx: r(size * 0.2), fill: barColor(th)})));
}

/**
 * Highlight group of one change on one side: tinted boxes, a strike line on
 * the original (A) or an underline on the revised text (B), and a caret for a
 * deletion.
 */
export function highlightNode(ctx, L, name, segs, side, opacity, isGap) {
  const st = versionStyle(ctx, side);
  const size = L.size;
  const parts = [];
  for (const s of segs) {
    parts.push(h('rect', {x: r(s.x - size * 0.14), y: r(s.lineTop + size * 0.12), width: r(s.w + size * 0.28), height: r(size * 1.08), rx: r(size * 0.18), fill: st.fill}));
    if (side === 'A') parts.push(h('line', {x1: r(s.x - 2), x2: r(s.x + s.w + 2), y1: r(s.lineTop + size * 0.62), y2: r(s.lineTop + size * 0.62), stroke: st.line, 'stroke-width': r(Math.max(2, size * 0.09), 2), 'stroke-linecap': 'round'}));
    else if (isGap) {
      const cx = s.x + s.w / 2;
      const by = s.lineTop + size * 0.98;
      parts.push(h('path', {d: `M${r(cx - size * 0.3)} ${r(by)}L${r(cx)} ${r(by - size * 0.55)}L${r(cx + size * 0.3)} ${r(by)}`, fill: 'none', stroke: st.line, 'stroke-width': r(Math.max(2.5, size * 0.11), 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    } else parts.push(h('line', {x1: r(s.x), x2: r(s.x + s.w), y1: r(s.lineTop + size * 1.12), y2: r(s.lineTop + size * 1.12), stroke: st.line, 'stroke-width': r(Math.max(2.5, size * 0.1), 2), 'stroke-linecap': 'round'}));
  }
  return g({name, opacity}, parts);
}

/**
 * Geometry of the version tab sticking out of a sheet's top edge (sheet-local):
 * `box` = the part visible above the sheet. `lines` / `maxFrac` let a scene
 * give a long tab label two lines and more of the sheet width.
 */
export function tabGeometry(ctx, L, label, tabSize, lines = 1, maxFrac = 0.62) {
  const size = tabSize ?? Math.max(14, L.titleSize * 0.6);
  const x = L.pad * 0.8;
  const maxWidth = lines > 1 ? Math.min(L.w * maxFrac, L.w - x - L.fold - 6) - size * 1.6 : L.w * maxFrac;
  const fit = ctx.fit(label || ' ', {maxWidth, size, minSize: size * 0.72, maxLines: lines, weight: 700});
  const tw = Math.max(L.w * 0.26, fit.width + size * 1.6);
  const th2 = size * 2.1 + (fit.lines.length - 1) * fit.lineHeight;
  const y = -(th2 - size * 0.46);
  return {fit, size, x, y, tw, th2, box: {x, y, w: tw, h: -y}};
}

/** Version tab sticking out of the sheet's top edge. */
function tabNode(ctx, L, label, side, showKey, tabSize, lines, maxFrac) {
  const th = ctx.theme;
  const st = versionStyle(ctx, side);
  const {fit, size, x, y, tw, th2} = tabGeometry(ctx, L, label, tabSize, lines, maxFrac);
  const parts = [
    h('path', {d: `M${r(x)} ${r(y + th2)}V${r(y + 8)}Q${r(x)} ${r(y)} ${r(x + 8)} ${r(y)}H${r(x + tw - 8)}Q${r(x + tw)} ${r(y)} ${r(x + tw)} ${r(y + 8)}V${r(y + th2)}Z`, fill: st.tab, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
  ];
  if (showKey && label) parts.push(textBlock(fit, {x: x + tw / 2, y: y + (-y - fit.size - (fit.lines.length - 1) * fit.lineHeight) / 2 - 1, anchor: 'middle', fill: st.tabText}));
  else {
    const gy = y / 2; // middle of the part visible above the sheet
    parts.push(side === 'A'
      ? h('circle', {cx: r(x + tw / 2), cy: r(gy), r: r(size * 0.32), fill: st.tabText})
      : h('path', {d: `M${r(x + tw / 2 - size * 0.4)} ${r(gy)}L${r(x + tw / 2)} ${r(gy - size * 0.34)}L${r(x + tw / 2 + size * 0.4)} ${r(gy)}L${r(x + tw / 2)} ${r(gy + size * 0.34)}Z`, fill: st.tabText}));
  }
  return g(null, parts);
}

/* ------------------------------------------------------------ pen marks */

/**
 * Pen loop proportions (× body size): a loop hugs a word box (glyph box of
 * height 1.0 starting 0.16 below the line top) and stays inside
 * [line top + LOOP.top, line top + LOOP.bottom] including its hand wobble.
 */
export const LOOP = {rx: 0.32, ry: 0.56, top: 0.06, bottom: 1.26};
/**
 * Line pitch (× body size) asked for by sheets that carry pen links: the gap
 * between the loops of two lines is then wide enough for a leader to run
 * through it with visible paper on both sides.
 */
export const LINK_LEADING = 1.86;

/**
 * Hand-drawn loop around a word: a superellipse (exponent 3) — boxier than an
 * ellipse, so it encloses a word without bulging into the neighbouring line
 * gaps — with a slight wobble and an overshoot past its start.
 */
function loopPts(ctx, c, rx, ry, key, start = -90, sweep = 385, n = 56) {
  const pts = [];
  const ph = ctx.rng(key, 0) * Math.PI * 2;
  const e = 2 / 3;
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const a = rad(start + sweep * t);
    const f = 1 + 0.022 * Math.sin(3 * a + ph) + 0.04 * t;
    const ca = Math.cos(a), sa = Math.sin(a);
    pts.push({x: c.x + rx * f * Math.sign(ca) * Math.abs(ca) ** e, y: c.y + ry * f * Math.sign(sa) * Math.abs(sa) ** e});
  }
  return pts;
}

function cubicPts(p0, p1, p2, p3, n = 16) {
  const out = [];
  for (let k = 1; k <= n; k++) out.push(cubic(p0, p1, p2, p3, k / n));
  return out;
}

/**
 * Y (sheet-local) of the free lane in the gap above — or below — a word's
 * line: halfway between the loop band of that line and the loop band of the
 * neighbouring line (or the row/sheet edge), so a leader in the lane clears
 * every loop drawn on either line.
 * @param {any} L alignedLayout result
 * @param {{row:number, line:number, lineTop:number}} sg segment (sheet-local)
 * @param {boolean} below
 */
export function laneY(L, sg, below) {
  const s = L.size;
  const row = L.rows[sg.row];
  const ty = sg.lineTop;
  const lo = L.lo || 0;
  if (below) {
    const next = sg.line < row.lines - 1 ? ty + L.lineH : sg.row < L.rows.length - 1 ? L.rows[sg.row + 1].top + lo : null;
    const a = ty + LOOP.bottom * s;
    const b = next !== null ? next + LOOP.top * s : Math.min(a + s * 0.7, L.footerY + s * 0.3);
    return (a + b) / 2;
  }
  const pr = sg.row > 0 ? L.rows[sg.row - 1] : null;
  const prev = sg.line > 0 ? ty - L.lineH : pr ? pr.top + lo + (pr.lines - 1) * L.lineH : null;
  const b = ty + LOOP.top * s;
  const a = prev !== null ? prev + LOOP.bottom * s : Math.max(b - s * 0.7, L.ruleY + s * 0.2);
  return (a + b) / 2;
}

/**
 * Hand-drawn link between the same change on two aligned sheets:
 * loop around word A → rise into the line gap → run to the margin → cross the
 * gutter → run along B's line gap → loop around word B. World coordinates.
 * @param {any} ctx
 * @param {{x:number,y:number,w:number,h:number,lineTop:number}} A glyph box (world)
 * @param {{x:number,y:number,w:number,h:number,lineTop:number}} B glyph box (world)
 * @param {{size:number, xR:number, xL:number, key:string, lane?:'above'|'below', laneSideA?:'above'|'below', laneSideB?:'above'|'below', laneA?:number, laneB?:number, lineH?:number}} o
 *   xR = A's right margin, xL = B's left margin; laneA / laneB = world y of the
 *   free lanes (see `laneY`) the leader runs in on each sheet; laneSideA /
 *   laneSideB (default `lane`) = on which side of its word's line each loop
 *   is left or entered.
 */
export function linkPoints(ctx, A, B, o) {
  const s = o.size;
  // each sheet may use its own lane side (see `assignLanes`)
  const belowA = (o.laneSideA ?? o.lane) === 'below';
  const belowB = (o.laneSideB ?? o.lane) === 'below';
  const lineH = o.lineH ?? s * 1.5;
  const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2};
  const cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
  const ryx = (LOOP.ry - 0.5) * s;
  const rxa = A.w / 2 + LOOP.rx * s, rya = A.h / 2 + ryx;
  const rxb = B.w / 2 + LOOP.rx * s, ryb = B.h / 2 + ryx;
  // above lane: loops start at the top and run clockwise; below lane: start at
  // the bottom and run counter-clockwise — either way the pen leaves each loop
  // heading right, toward the gutter.
  const startOf = below => (below ? 90 : -90);
  const sweepOf = below => (below ? -385 : 385);
  const e1 = loopPts(ctx, ca, rxa, rya, `${o.key}-a`, startOf(belowA), sweepOf(belowA));
  const E = e1[e1.length - 1];
  const ygA = o.laneA ?? (belowA ? A.lineTop + lineH - s * 0.08 : A.lineTop - s * 0.08);
  const ygB = o.laneB ?? (belowB ? B.lineTop + lineH - s * 0.08 : B.lineTop - s * 0.08);
  const x1 = E.x + s * 0.9;
  const entryB = {x: cb.x, y: belowB ? cb.y + ryb : cb.y - ryb};
  const xb0 = cb.x - s * 1.1;
  const xR = Math.max(o.xR, x1 + 1);
  const xL = Math.min(o.xL, xb0 - 1);
  const pts = [...e1];
  pts.push(...cubicPts(E, {x: E.x + s * 0.5, y: E.y}, {x: x1 - s * 0.45, y: ygA}, {x: x1, y: ygA}, 8));
  if (xR > x1 + 1) pts.push({x: xR, y: ygA});
  const gw = Math.max(20, xL - xR);
  const gut = [{x: xR, y: ygA}, {x: xR + gw * 0.55, y: ygA}, {x: xL - gw * 0.55, y: ygB}, {x: xL, y: ygB}];
  pts.push(...cubicPts(gut[0], gut[1], gut[2], gut[3], 22));
  if (xb0 > xL + 1) pts.push({x: xb0, y: ygB});
  pts.push(...cubicPts({x: xb0, y: ygB}, {x: xb0 + s * 0.5, y: ygB}, {x: entryB.x - s * 0.5, y: entryB.y}, entryB, 8));
  const nBefore = pts.length;
  const e2 = loopPts(ctx, cb, rxb, ryb, `${o.key}-b`, startOf(belowB), sweepOf(belowB));
  pts.push(...e2.slice(1));
  const poly = polyline(pts);
  const cum = arcAt(pts);
  const a1 = cum[e1.length - 1] / poly.total;
  const a2 = cum[nBefore - 1] / poly.total;
  return {
    poly, a1, a2, ca, cb, lane: belowA ? 'below' : 'above', laneSides: {A: belowA ? 'below' : 'above', B: belowB ? 'below' : 'above'}, laneA: ygA, laneB: ygB,
    focusX: p => (p <= a1 ? ca.x : p >= a2 ? cb.x : lerp(ca.x, cb.x, ease.inOutSine((p - a1) / (a2 - a1)))),
    gutterMid: cubic(gut[0], gut[1], gut[2], gut[3], 0.5),
  };
}

function arcAt(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  return cum;
}

/**
 * Lane plan for all links between two row-aligned sheets drawn with the same
 * layout `L` at the same height. Each link picks, on EACH sheet, the line gap
 * above or below its words; the plan minimises (exhaustively — at most four
 * links, so ≤ 256 plans):
 *  - two leaders sharing one gap on a sheet (they would run on top of each
 *    other, since all leaders head for the gutter) — forbidden in practice;
 *  - a leader running past another linked word's loop through a narrow
 *    line gap inside a clause row (it would graze that loop); passing it
 *    through a wide gap (between rows, or under the header) costs little;
 *  - two leaders crossing each other in the gutter (an open, readable X);
 *  - and, as a tie-break, lanes below the words.
 * @param {any} L alignedLayout result
 * @param {Array<{sa:any, sb:any}>} links sheet-local segments of each link's words on A and on B
 * @returns {Array<{A:'above'|'below', B:'above'|'below', laneA:number, laneB:number}>} laneA / laneB sheet-local lane y
 */
export function assignLanes(L, links) {
  const n = links.length;
  if (!n) return [];
  const s = L.size;
  const gapOf = (sg, below) => {
    const row = L.rows[sg.row];
    const narrow = below ? sg.line < row.lines - 1 : sg.line > 0;
    const other = below
      ? (sg.line < row.lines - 1 ? [sg.row, sg.line + 1] : sg.row < L.rows.length - 1 ? [sg.row + 1, 0] : null)
      : (sg.line > 0 ? [sg.row, sg.line - 1] : sg.row > 0 ? [sg.row - 1, L.rows[sg.row - 1].lines - 1] : null);
    const y = laneY(L, sg, below);
    return {below, y, key: Math.round(y), narrow, adj: [[sg.row, sg.line], other].filter(Boolean)};
  };
  // a leader leaves A's word toward the right margin and reaches B's word from the left margin
  const opts = links.map(k => ({
    A: [false, true].map(b => ({...gapOf(k.sa, b), span: [k.sa.x + k.sa.w / 2, L.w]})),
    B: [false, true].map(b => ({...gapOf(k.sb, b), span: [0, k.sb.x + k.sb.w / 2]})),
  }));
  const passCost = (side, j, o) => {
    let c = 0;
    links.forEach((k, m) => {
      if (m === j) return;
      const sg = side === 'A' ? k.sa : k.sb;
      if (!o.adj.some(([rw, ln]) => rw === sg.row && ln === sg.line)) return;
      const x0 = sg.x - LOOP.rx * s, x1 = sg.x + sg.w + LOOP.rx * s;
      if (x1 < o.span[0] || x0 > o.span[1]) return;
      c += o.narrow ? 5 : 0.5;
    });
    return c;
  };
  let best = null;
  for (let code = 0; code < 4 ** n; code++) {
    const pick = [];
    for (let j = 0; j < n; j++) {
      const q = Math.floor(code / 4 ** j) % 4;
      pick.push({A: opts[j].A[q % 2], B: opts[j].B[q >> 1]});
    }
    let cost = 0;
    for (const side of ['A', 'B']) {
      const seen = new Map();
      pick.forEach(p => seen.set(p[side].key, (seen.get(p[side].key) || 0) + 1));
      for (const v of seen.values()) cost += 100 * (v - 1);
    }
    for (let j = 0; j < n; j++) {
      for (let m = j + 1; m < n; m++) if ((pick[j].A.y - pick[m].A.y) * (pick[j].B.y - pick[m].B.y) < 0) cost += 3;
    }
    pick.forEach((p, j) => { cost += passCost('A', j, p.A) + passCost('B', j, p.B) + (p.A.below ? 0.1 : 0) + (p.B.below ? 0.1 : 0); });
    if (!best || cost < best.cost - 1e-9) best = {cost, pick};
  }
  return best.pick.map(p => ({A: p.A.below ? 'below' : 'above', B: p.B.below ? 'below' : 'above', laneA: p.A.y, laneB: p.B.y}));
}

/** Single-stroke check mark at (x, y): "row compared, same wording". */
export function tickPoints(x, y, s) {
  const pts = catmullRom([{x: x - s * 0.55, y: y - s * 0.02}, {x: x - s * 0.18, y: y + s * 0.4}, {x: x + s * 0.62, y: y - s * 0.52}], 10);
  const poly = polyline(pts);
  return {poly, a1: 0, a2: 1, ca: {x, y}, cb: {x, y}, focusX: () => x, gutterMid: {x, y}};
}

/** Ink stroke node for a mark (draw-on through dash offset). */
export function markNode(name, mark, color, width) {
  const total = mark.poly.total;
  return h('path', {name, d: mark.poly.d(1), fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 24)}`, 'stroke-dashoffset': r(total), opacity: 0});
}

/** Frame record for a mark drawn to fraction p. */
export function markFrame(name, mark, p) {
  return {[name]: {'stroke-dashoffset': r(mark.poly.total * (1 - p)), opacity: p > 0 ? 1 : 0}};
}

/**
 * Schedule a pen over a list of marks: travel (lifted) → draw → travel …,
 * starting and ending at `rest`. `at(q)` gives the tip for plan progress q.
 * While drawing, the tip is exactly the end of the ink stroke.
 * @param {Array<{poly:any, focusX:(p:number)=>number}>} marks
 * @param {{x:number,y:number}} rest
 */
const TRAVEL_PACE = 1350; // relative pace: lifted travel is a little quicker than inking
const DRAW_PACE = 1500;
/** Near-constant inking speed with soft start/stop (peak speed ≈ 1.17×). */
const drawEase = t => 0.7 * t + 0.3 * ease.inOutSine(t);

export function penPlan(marks, rest) {
  const segs = [];
  let prev = rest;
  let prevF = rest.x;
  marks.forEach((m, j) => {
    const s0 = m.poly.at(0);
    segs.push({kind: 'travel', from: prev, to: s0, f0: prevF, f1: m.focusX(0), w: 0.06 + dist(prev, s0) / TRAVEL_PACE});
    segs.push({kind: 'draw', j, m, w: 0.04 + m.poly.total / DRAW_PACE});
    const e = m.poly.at(1);
    prev = {x: e.x, y: e.y};
    prevF = m.focusX(1);
  });
  segs.push({kind: 'travel', from: prev, to: rest, f0: prevF, f1: rest.x, w: 0.06 + dist(prev, rest) / TRAVEL_PACE, home: true});
  const tot = segs.reduce((a, s) => a + s.w, 0);
  let acc = 0;
  for (const s of segs) {
    s.a = acc / tot;
    acc += s.w;
    s.b = acc / tot;
  }
  /** @param {number} q plan progress 0..1 */
  function at(q) {
    const progress = marks.map(() => 0);
    let active = segs[segs.length - 1];
    for (const s of segs) {
      if (s.kind === 'draw') progress[s.j] = drawEase(seg(q, s.a, s.b));
    }
    for (const s of segs) if (q <= s.b) { active = s; break; }
    let tip;
    let lift = 0;
    let focus;
    let touching = false;
    if (active.kind === 'travel') {
      const l = seg(q, active.a, active.b);
      const k = ease.inOutSine(l);
      tip = mix(active.from, active.to, k);
      lift = Math.sin(Math.PI * l);
      focus = lerp(active.f0, active.f1, k);
    } else {
      const p = progress[active.j];
      const t = active.m.poly.at(p);
      tip = {x: t.x, y: t.y};
      touching = q > active.a && q < active.b;
      focus = active.m.focusX(p);
    }
    return {tip, lift, focus, touching, progress, drawing: active.kind === 'draw' ? active.j : -1, home: Boolean(active.home) && q > active.a};
  }
  return {at, segs};
}

/* ------------------------------------------------------------ folder spread */

/**
 * Open folder lying flat (top-down): two panels, centre spine, a label tab on
 * the left panel. Local origin = top-left of the spread.
 */
export function folderSpread(ctx, {w, h: hh, color, label, showKey, spineX}) {
  const th = ctx.theme;
  const c = color || '#d8b878';
  const sx = spineX ?? w / 2;
  const tabW = Math.min(w * 0.3, 300);
  const tabH = 34;
  const parts = [
    h('path', {d: roundRectPath(10, 14, w, hh, 16), fill: th.shadow}),
    h('path', {d: `M${r(w * 0.06)} ${-tabH + 10}Q${r(w * 0.06)} ${-tabH} ${r(w * 0.06 + 10)} ${-tabH}H${r(w * 0.06 + tabW - 22)}L${r(w * 0.06 + tabW)} 2V14H${r(w * 0.06)}Z`, fill: shade(c, -0.08), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(0, 0, w, hh, 16), fill: c, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(sx - 14), y: 3, width: 28, height: hh - 6, fill: shade(c, -0.1), opacity: 0.8}),
    h('line', {x1: r(sx), x2: r(sx), y1: 3, y2: hh - 3, stroke: shade(c, -0.32), 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(16, 16, sx - 34, hh - 32, 10), fill: 'none', stroke: shade(c, -0.16), 'stroke-width': 2, opacity: 0.8}),
    h('path', {d: roundRectPath(sx + 18, 16, w - sx - 34, hh - 32, 10), fill: 'none', stroke: shade(c, -0.16), 'stroke-width': 2, opacity: 0.8}),
  ];
  if (showKey && label) {
    const f = ctx.fit(label, {maxWidth: tabW - 40, size: 20, minSize: 13, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: w * 0.06 + 14, y: -tabH + (tabH - 6 - f.size) / 2 + 2, fill: th.ink}));
  }
  return g(null, parts);
}

/* ------------------------------------------------------- stamp impression */

/**
 * Comparison stamp impression pressed across the gutter (double ink frame,
 * spaced capitals). Unlike the generic impression, the label is fitted with
 * its letter spacing counted and may take two lines, so a long label stays
 * inside the frame without making the stamp taller than the sheets' footer.
 * A faint wash covers the part of the frame that lies over the gutter, so the
 * letters stay legible where they cross the folder spine.
 * Local origin = centre of the impression (unrotated stage axes).
 * @param {any} ctx
 * @param {{name:string, text:string, w:number, gutter?:number, color:string, showText:boolean, rotate?:number}} o
 */
export function comparisonImpression(ctx, o) {
  const c = o.color;
  const w = o.w;
  const hh = w * 0.36;
  const rot = o.rotate ?? -5;
  const text = String(o.text || ' ');
  const margin = Math.max(10, w * 0.04);
  const spacing = 2;
  const inner = w - 14 - margin * 2;
  const words = text.trim().split(/\s+/);
  const lineW = (ln, sz) => ctx.measure(ln, sz, 800, 'sans') + spacing * ln.length;
  // largest size at which the label fits on one line, or on two lines without
  // breaking a word (letter spacing counted); the frame never grows
  let fit = null;
  for (let sz = w * 0.15; sz >= w * 0.07 - 1e-6 && !fit; sz -= 0.5) {
    if (words.some(wd => lineW(wd, sz) > inner)) continue;
    for (const lines of [1, 2]) {
      const mw = inner - spacing * Math.ceil(text.length / lines) - 2;
      if (words.some(wd => ctx.measure(wd, sz, 800, 'sans') > mw)) continue;
      const f = ctx.fit(text, {maxWidth: mw, size: sz, minSize: sz, maxLines: lines, weight: 800});
      if (!f.truncated && f.lines.length <= lines && f.lines.join(' ') === words.join(' ') && f.lines.every(ln => lineW(ln, sz) <= inner)) {
        fit = f;
        break;
      }
    }
  }
  if (!fit) fit = ctx.fit(text, {maxWidth: inner - spacing * text.length, size: w * 0.07, minSize: w * 0.07, maxLines: 2, weight: 800});
  const parts = [];
  const gw = Math.max(0, Math.min((o.gutter ?? 0) - 6, w - 30));
  if (gw > 0) {
    // wash = the vertical gutter strip clipped to the (rotated) inner frame
    const a = rad(rot);
    const edgeY = (x, v) => {
      const u = (x + v * Math.sin(a)) / Math.cos(a);
      return u * Math.sin(a) + v * Math.cos(a);
    };
    const v = hh / 2 - 7;
    const x0 = -gw / 2, x1 = gw / 2;
    parts.push(h('path', {d: `M${r(x0)} ${r(edgeY(x0, -v))}L${r(x1)} ${r(edgeY(x1, -v))}L${r(x1)} ${r(edgeY(x1, v))}L${r(x0)} ${r(edgeY(x0, v))}Z`, fill: ctx.theme.paper, opacity: 0.58}));
  }
  const top = -((fit.lines.length - 1) * fit.lineHeight + fit.size) / 2;
  parts.push(g({transform: T(0, 0, rot)},
    h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 8, fill: 'none', stroke: c, 'stroke-width': 4}),
    h('rect', {x: -w / 2 + 7, y: -hh / 2 + 7, width: w - 14, height: hh - 14, rx: 5, fill: 'none', stroke: c, 'stroke-width': 1.8}),
    o.showText
      ? textBlock(fit, {x: 0, y: top, anchor: 'middle', fill: c, letterSpacing: spacing})
      : h('path', {d: `M${r(-w * 0.3)} 0H${r(w * 0.3)}M${r(-w * 0.2)} ${r(hh * 0.18)}H${r(w * 0.2)}`, stroke: c, 'stroke-width': hh * 0.12, 'stroke-linecap': 'round'}),
  ));
  return g({name: o.name, opacity: 0}, parts);
}

/* ------------------------------------------------------------ review desk */

/**
 * Stage geometry per layout shape. Positions in stage units; sheets are
 * given by centre. `inStart` = incoming sheet held by the drafter at rest.
 */
export const STAGE = {
  landscape: {w: 1600, h: 980, sheet: [560, 578], A: [470, 570], B: [1130, 570], folder: [150, 232, 1300, 668],
    inStart: [1268, 462, 6.5], drafter: {shoulder: [1340, -170], rest: [1395, 70]}, pen: {rest: [1488, 770], shoulderY: 1095, lean: 250, min: 560, max: 1760},
    stamp: {rest: [92, 880], shoulder: [300, 1120], size: 96}, body: [30, 25], arm: {upper: 405, lower: 385, width: 50}},
  square: {w: 1200, h: 1100, sheet: [470, 640], A: [318, 600], B: [882, 600], folder: [42, 245, 1116, 710],
    inStart: [955, 470, 6], drafter: {shoulder: [1000, -250], rest: [1060, 70]}, pen: {rest: [1004, 920], shoulderY: 1170, lean: 240, min: 430, max: 1320},
    stamp: {rest: [90, 1015], shoulder: [240, 1250], size: 92}, body: [28, 22], arm: {upper: 410, lower: 390, width: 50}},
  portrait: {w: 900, h: 1400, sheet: [392, 736], A: [215, 912], B: [685, 912], folder: [8, 510, 884, 806],
    inStart: [575, 470, -5], drafter: {shoulder: [690, -110], rest: [760, 72]}, pen: {rest: [726, 1200], shoulderY: 1452, lean: 210, min: 380, max: 1060},
    stamp: {rest: [84, 1340], shoulder: [230, 1545], size: 86}, body: [28, 20], arm: {upper: 405, lower: 385, width: 46}},
};

/**
 * Top-down review desk: an open folder holds the filed version (left); the
 * drafting party (arm from the top edge) lays the incoming version beside it
 * so the clause rows align; the reviewer (arms from the bottom edge) links
 * the modified words with a pen and stamps the pair across the gutter.
 *
 * Attachments enforced here and exposed through `pose().semantic`:
 *  - the incoming sheet follows the drafter's SOLVED hand while carried
 *    (`handDrafter` = `gripIncoming`);
 *  - the pen is positioned from the reviewer's solved hand while held; its
 *    tip is the end of the ink stroke while drawing (`penTip` = `strokeEnd`);
 *  - the stamp follows the reviewer's other solved hand (`stampTool`).
 * @param {any} ctx
 * @param {{prefix:string, shape:'landscape'|'square'|'portrait', diff:any, L?:any, incoming:'A'|'B', ticks?:boolean,
 *   doc:{docId:string,title:string}, labels:{filed:string, incoming:string, folder?:string, stamp:string},
 *   signers:any[], actorLabels?:{a?:string,b?:string}, withStamp?:boolean, chips?:boolean, bands?:boolean}} o
 */
export function compareDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = STAGE[o.shape];
  const W = G.w, H = G.h;
  const [sw, sh] = G.sheet;
  const showKey = ctx.show('key');
  const L = o.L || alignedLayout(ctx, {w: sw, h: sh, rows: o.diff.rows, size: G.body[0], minSize: G.body[1] * 0.8, docId: o.doc.docId, title: o.doc.title, leading: LINK_LEADING});
  const aTL = {x: G.A[0] - sw / 2, y: G.A[1] - sh / 2};
  const bTL = {x: G.B[0] - sw / 2, y: G.B[1] - sh / 2};
  const incomingKey = o.incoming || 'B';
  const rowsTok = key => L.place.map(p => p[key]);

  // --- folder + sheets
  const [fx, fy, fw, fh] = G.folder;
  const spineX = (aTL.x + sw + bTL.x) / 2 - fx;
  const folder = g({transform: T(fx, fy)}, folderSpread(ctx, {w: fw, h: fh, label: o.labels.folder, showKey, spineX}));
  const sheetA = sheetNode(ctx, L, {prefix: `${P}-filed`, tokens: rowsTok('A'), side: 'A', tab: o.labels.filed, showText: showKey, showKey});
  const morphRows = o.morph && incomingKey === 'B' ? o.diff.rows.map((row, ci) => (row.changes.length && !row.redacted ? ci : -1)).filter(ci => ci >= 0) : [];
  const sheetB = sheetNode(ctx, L, {prefix: `${P}-inc`, tokens: rowsTok(incomingKey), side: o.incomingStyle || (incomingKey === 'B' ? 'B' : 'A'), tab: o.labels.incoming, showText: showKey, showKey,
    morph: morphRows.length ? {tokens: rowsTok('A'), rows: morphRows} : undefined});
  const incNode = g({name: `${P}-incg`}, g({transform: T(-sw / 2, -sh / 2)}, sheetB.node));

  // --- aligned-row bands (drawn over both sheets once aligned)
  const bandX0 = aTL.x + L.pad * 0.5;
  const bandX1 = bTL.x + sw - L.pad * 0.5;
  const bands = g({name: `${P}-bands`, opacity: 0}, L.rows.map((row, ci) => h('rect', {x: r(bandX0), y: r(aTL.y + row.top - L.size * 0.22), width: r(bandX1 - bandX0), height: r(row.h + L.size * 0.1), rx: 8, fill: ci % 2 ? th.accent2Soft : th.accent3Soft, opacity: 0.34})));

  // --- marks: links for changes present on the incoming sheet (+ optional row ticks)
  const linked = incomingKey === 'B' ? o.diff.order.filter(i => L.segs(L.place.flatMap(p => p.A), i).length && L.segs(L.place.flatMap(p => p.B), i).length) : [];
  const tokA = L.place.flatMap(p => p.A);
  const tokB = L.place.flatMap(p => p.B);
  const world = (tl, b) => ({x: tl.x + b.x, y: tl.y + b.y, w: b.w, h: b.h, lineTop: tl.y + b.lineTop});
  const xR = aTL.x + sw - L.pad * 0.3;
  const xL = bTL.x + L.pad * 0.3;
  const gx = (aTL.x + sw + bTL.x) / 2;
  const marks = [];
  const rowsWithLinks = new Set();
  const segPairs = linked.map(i => ({i, sa: L.segs(tokA, i)[0], sb: L.segs(tokB, i)[0]}));
  const lanes = assignLanes(L, segPairs);
  segPairs.forEach(({i, sa, sb}, k) => {
    const ln = lanes[k];
    const m = linkPoints(ctx, world(aTL, sa), world(bTL, sb), {size: L.size, xR, xL, laneSideA: ln.A, laneSideB: ln.B, laneA: aTL.y + ln.laneA, laneB: bTL.y + ln.laneB, key: `${P}-link${i}`});
    rowsWithLinks.add(sa.row);
    marks.push({kind: 'link', change: i, row: sa.row, ...m});
  });
  if (o.ticks) {
    L.rows.forEach((row, ci) => {
      if (rowsWithLinks.has(ci) || row.redacted) return;
      const m = tickPoints(gx, aTL.y + row.top + row.h / 2, L.size * 0.9);
      marks.push({kind: 'tick', row: ci, ...m});
    });
    // pen works down the rows: order by row, links before ticks never mix within a row
    marks.sort((a, b) => a.row - b.row);
  }
  const inkColor = th.accent;
  const markNodes = marks.map((m, j) => markNode(`${P}-mark${j}`, m, inkColor, Math.max(3, L.size * 0.13)));

  // --- props
  const pen = penTool(ctx, {name: `${P}-pen`, length: Math.round(sw * 0.36), body: th.accent});
  const penAngle = 62;
  const penDir = {x: Math.cos(rad(penAngle)), y: Math.sin(rad(penAngle))};
  const restTip = {x: G.pen.rest[0], y: G.pen.rest[1]};
  const plan = penPlan(marks, restTip);
  const withStamp = o.withStamp !== false;
  const stampNode = stampTool(ctx, {name: `${P}-stamp`, size: G.stamp.size, color: th.accent4});
  const stampSpot = {x: gx, y: aTL.y + L.footerY + (sh - L.footerY) * 0.5};
  const impW = Math.min(260, (bTL.x + sw - aTL.x) * 0.2 + 70);
  const impRot = -5;
  const impression = comparisonImpression(ctx, {name: `${P}-impr`, text: o.labels.stamp || ' ', w: impW, rotate: impRot, gutter: bTL.x - (aTL.x + sw), color: th.accent4, showText: showKey});
  const stampRest = {x: G.stamp.rest[0], y: G.stamp.rest[1]};

  // --- actors
  const lookA = actorLook(ctx, o.signers[0], 0);
  const lookB = actorLook(ctx, o.signers[1], 1);
  const armSpec = {...G.arm, handScale: 1.3};
  const armD = topArm(ctx, {name: `${P}-armD`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'left', ...armSpec});
  const armP = topArm(ctx, {name: `${P}-armP`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'right', ...armSpec});
  const armS = topArm(ctx, {name: `${P}-armS`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'left', ...armSpec});
  const shoulderD = {x: G.drafter.shoulder[0], y: G.drafter.shoulder[1]};
  const shoulderS = {x: G.stamp.shoulder[0], y: G.stamp.shoulder[1]};
  const restD = {x: G.drafter.rest[0], y: G.drafter.rest[1]};

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30});
  const chipSize = o.shape === 'portrait' ? 30 : 28;
  const cap = (p, role) => (role ? `${p.name} · ${role}` : p.name);
  const roleA = (o.actorLabels && o.actorLabels.a) || o.signers[0].role;
  const roleB = (o.actorLabels && o.actorLabels.b) || o.signers[1].role;
  // actor captions: one line when it fits, else two (a long name is not cut to a stub)
  const actorChip = (text, spec) => {
    const one = chip(ctx, text, {...spec, maxLines: 1});
    return one.fit.truncated ? chip(ctx, text, {...spec, maxLines: 2, minSize: chipSize * 0.72}) : one;
  };
  const chipA = o.chips !== false && showKey
    ? actorChip(cap(o.signers[0], roleA), o.shape === 'portrait'
      ? {x: 30, y: 22, anchor: 'start', maxWidth: W * 0.62, size: chipSize, name: `${P}-chipA`}
      : {x: shoulderD.x - 110, y: 22, anchor: 'end', maxWidth: W * 0.5, size: chipSize, name: `${P}-chipA`})
    : null;
  const bSpec = {x: W / 2 + (o.shape === 'portrait' ? 60 : 0), y: 0, anchor: 'middle', maxWidth: W * (o.shape === 'portrait' ? 0.5 : 0.46), size: chipSize, name: `${P}-chipB`};
  const chipB0 = o.chips !== false && showKey ? actorChip(cap(o.signers[1], roleB), bSpec) : null;
  const chipB = chipB0 && actorChip(cap(o.signers[1], roleB), {...bSpec, y: H - 22 - chipB0.box.h});

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      folder,
      g({transform: T(aTL.x, aTL.y)}, sheetA.node),
      incNode,
      bands,
      markNodes,
      withStamp ? g({transform: T(stampSpot.x, stampSpot.y)}, impression) : null,
      pen.node,
      armP.arm, armP.palm, armP.thumb,
      withStamp ? [stampNode, armS.arm, armS.palm, armS.thumb] : null,
      armD.arm, armD.palm, armD.thumb,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  const inStart = {x: G.inStart[0], y: G.inStart[1], rot: G.inStart[2], k: 1.045};
  const inEnd = {x: G.B[0], y: G.B[1], rot: 0, k: 1};
  const gripLocal = {x: sw * 0.12, y: -sh / 2 + 26};
  const rotAt = (pose, q) => {
    const a = rad(pose.rot);
    return {x: pose.x + (q.x * Math.cos(a) - q.y * Math.sin(a)) * pose.k, y: pose.y + (q.x * Math.sin(a) + q.y * Math.cos(a)) * pose.k};
  };

  /**
   * @param {{place:number, release:number, bands:number, pen:number, withdraw:number, stamp:number, morph?:number, flash?:number}} s
   *   place: drafter lays the incoming sheet into alignment; release: drafter lets go
   *   and withdraws; bands: aligned-row tint; pen: pen-plan progress (links/ticks);
   *   withdraw: reviewer's hand leaves the laid-down pen; stamp: carry–press–return;
   *   morph (with `o.morph`): the incoming copy's changed rows are rewritten from the
   *   original to the revised wording (default 1 = revised); flash: highlight pulse.
   */
  function pose(s) {
    const nodes = {};
    // incoming sheet
    const kp = ease.inOutCubic(clamp(s.place));
    const sp = {x: lerp(inStart.x, inEnd.x, kp), y: lerp(inStart.y, inEnd.y, kp), rot: lerp(inStart.rot, inEnd.rot, kp), k: lerp(inStart.k, inEnd.k, ease.inQuad(kp))};
    const lifted = 1 - ease.inQuad(kp);
    nodes[`${P}-incg`] = {transform: T(sp.x, sp.y, sp.rot, sp.k)};
    nodes[`${P}-inc-shadow`] = {transform: T(7 + 16 * lifted, 10 + 22 * lifted)};
    const grip = rotAt(sp, gripLocal);
    const handDTarget = s.release > 0 ? mix(grip, restD, ease.inOutCubic(s.release)) : grip;
    const solvedD = armD.pose(shoulderD, handDTarget, 1);
    Object.assign(nodes, solvedD.nodes);
    nodes[`${P}-bands`] = {opacity: r(clamp(s.bands), 3)};

    // pen + reviewer's pen hand
    const pl = plan.at(clamp(s.pen));
    marks.forEach((m, j) => Object.assign(nodes, markFrame(`${P}-mark${j}`, m, pl.progress[j])));
    // highlights: A as soon as its loop closes, B when the second loop closes
    const flash = Math.sin(Math.PI * clamp(s.flash || 0)) * 0.9;
    marks.forEach(m => {
      if (m.kind !== 'link') return;
      const p = pl.progress[marks.indexOf(m)];
      nodes[`${P}-filed-hl-${m.change}`] = {opacity: r(clamp((p - m.a1 * 0.9) / 0.06), 3)};
      nodes[`${P}-inc-hl-${m.change}`] = {opacity: r(Math.max(flash, clamp((p - 0.94) / 0.06)), 3)};
    });
    // morph: old words lift out, the rest of the line glides, new words settle
    const mo = clamp(s.morph ?? 1);
    const out = ease.inOutSine(seg(mo, 0, 0.42));
    const glide = ease.inOutCubic(seg(mo, 0.22, 0.78));
    const settle = ease.inOutSine(seg(mo, 0.58, 1));
    const lift = ctx.reduced ? 0 : L.size * 0.45;
    morphRows.forEach(ci => {
      nodes[`${P}-inc-mo0-${ci}`] = {opacity: r(1 - out, 3), transform: T(0, -lift * out)};
      nodes[`${P}-inc-mo1-${ci}`] = {opacity: r(settle, 3), transform: T(0, lift * (1 - settle))};
    });
    sheetB.moves.forEach(mv => { nodes[mv.name] = {transform: T(mv.dx * glide, mv.dy * glide)}; });
    const reduced = ctx.reduced;
    const liftAmt = reduced ? 0 : pl.lift;
    const penTip = {x: pl.tip.x - 5 * liftAmt, y: pl.tip.y - 14 * liftAmt};
    const held = s.withdraw <= 0;
    const gripPt = {x: penTip.x + penDir.x * pen.grip, y: penTip.y + penDir.y * pen.grip};
    const handRest = {x: restTip.x + penDir.x * pen.grip + 40, y: restTip.y + penDir.y * pen.grip + 120};
    const handP = held ? gripPt : mix(gripPt, handRest, ease.inOutCubic(s.withdraw));
    const shoulderP = {x: clamp(pl.focus + G.pen.lean, G.pen.min, G.pen.max), y: G.pen.shoulderY};
    const solvedP = armP.pose(shoulderP, handP, -1);
    Object.assign(nodes, solvedP.nodes);
    const penPos = held ? {x: solvedP.hand.x - penDir.x * pen.grip, y: solvedP.hand.y - penDir.y * pen.grip} : penTip;
    nodes[`${P}-pen`] = {transform: T(penPos.x, penPos.y, penAngle, 1 + 0.05 * liftAmt)};

    // stamp: carried over the gutter, pressed across both footers, returned
    let press = 0;
    let stampPos = stampRest;
    let solvedS = null;
    if (withStamp) {
      const st = clamp(s.stamp);
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
    const active = pl.drawing >= 0 ? marks[pl.drawing] : null;
    const strokeEnd = active ? active.poly.at(pl.progress[pl.drawing]) : null;
    const allReached = solvedD.reached && solvedP.reached && (!solvedS || solvedS.reached);
    return {
      nodes,
      semantic: {
        incomingCenter: R2(sp),
        incomingRotation: r(sp.rot),
        incomingPlaced: s.place >= 1,
        handDrafter: R2(solvedD.hand),
        gripIncoming: R2(grip),
        drafterHolding: s.release <= 0,
        penTip: R2(penTip),
        strokeEnd: strokeEnd ? R2(strokeEnd) : null,
        penTouching: pl.touching,
        penHeld: held,
        handPen: R2(solvedP.hand),
        marks: marks.map((m, j) => ({kind: m.kind, change: m.change ?? null, row: m.row, p: r(pl.progress[j], 3)})),
        linksDrawn: marks.filter((m, j) => m.kind === 'link' && pl.progress[j] >= 1).length,
        ticksDrawn: marks.filter((m, j) => m.kind === 'tick' && pl.progress[j] >= 1).length,
        incomingWording: incomingKey === 'A' ? 'original' : mo >= 1 || !morphRows.length ? 'revised' : mo <= 0 ? 'original' : 'changing',
        stampTool: R2(stampPos),
        stampSpot: R2(stampSpot),
        stampPressed: press > 0.5,
        stampApplied: withStamp && clamp(s.stamp) >= 0.5,
        reach: {drafter: solvedD.reached, pen: solvedP.reached, stamp: solvedS ? solvedS.reached : true},
        allReached,
      },
    };
  }

  return {
    node, pose, L, W, H, marks, plan,
    aTL, bTL, sw, sh, gx, stampSpot,
    /** pressed impression (stage units): centre, outer frame size and rotation in degrees */
    stampBox: withStamp ? {cx: stampSpot.x, cy: stampSpot.y, w: impW, h: impW * 0.36, rot: impRot} : null,
    chipBoxes: {a: chipA ? chipA.box : null, b: chipB ? chipB.box : null},
    /** stage point of a sheet-local point on the filed (A) or placed incoming (B) sheet */
    sheetPoint: (side, q) => (side === 'A' ? {x: aTL.x + q.x, y: aTL.y + q.y} : {x: bTL.x + q.x, y: bTL.y + q.y}),
  };
}
