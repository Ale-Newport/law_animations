/**
 * "Interpretaciones concurrentes" kit (LAW-0153..0156), category sources.
 * One passage gives rise to two labelled, separated readings.
 *
 * Physical metaphor (original vector art, top-down):
 *  - light table: a metal-framed glass panel that lights up from below;
 *  - passage slip (the "artículo"): a paper strip carrying the supplied
 *    reference and the supplied passage, laid on the glass;
 *  - tracing overlays: two vellum sheets, A and B, each with a pull tab on
 *    its outer side. Laid on the lit passage, each one is traced (the words
 *    show through and are copied) and carries its OWN highlight pattern:
 *    the words the attributed reading focuses on. A and B are the same
 *    passage with different highlights — never one "right" copy;
 *  - reading trays: two equal in-trays, each holding its overlay and an
 *    attributed reading card ("proposed (as supplied)");
 *  - libro: the open source book (anchor) with the passage band marked on
 *    its right page and a ribbon to the slip;
 *  - jerarquía editable: a small board whose rows carry the AUTHOR's level
 *    labels and the source tokens placed on them — displayed, never applied;
 *  - lupa: a hand magnifier.
 *
 * The kit owns fields, defaults, strings, measured text/passage layout and
 * the art; every entry owns its own composition, timeline and semantics.
 *
 * Legal content: every text is a fictional placeholder, jurisdiction
 * unspecified. Both readings are attributed to fictional sources and shown
 * with equal weight; nothing is ranked, scored, resolved or marked correct.
 * @module animations/sources/kits/interpretaciones-concurrentes
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {FONTS} from '../../../core/text.js';
import {fitDesign} from '../../../core/layout.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {str, int, list, obj} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Parameters                                                          */
/* ------------------------------------------------------------------ */

export const MAX_SOURCES = 3;
export const MAX_LEVELS = 3;

const reading = letter => obj(`Reading ${letter}: attributed to a fictional source; shown as "proposed (as supplied)", never endorsed, ranked or resolved`, {
  label: str(`Label of reading ${letter} (e.g. "Interpretation ${letter}")`, 48),
  source: int('Index of the source (in `sources`) the reading is attributed to; its title is printed as the attribution', 0, MAX_SOURCES - 1),
  text: str('The reading as supplied (quoted on its card)', 110),
  focus: str('Words of the passage this reading focuses on; highlighted on its tracing overlay (matched word by word, case- and accent-insensitive). If they do not occur in the passage, the whole passage is bracketed instead', 90),
}, ['label', 'source', 'text', 'focus']);

/**
 * Category field set (sources): sources, hierarchy, passages, interpretations.
 * Built only from the shared builders in schemas/fields.js.
 */
export const icFields = {
  sources: list('Fictional sources. The FIRST is the book that holds the passage; the readings are attributed to sources by index. Each source is placed on a row of the editable hierarchy', obj('Source', {
    id: str('Short identifier printed on its hierarchy token (e.g. "T1", "CA")', 6),
    title: str('Fictional title (printed on the book or as a reading attribution)', 60),
    level: int('Row of the supplied ordering this source is placed on (0 = first row). Displayed only; no ordering rule is applied', 0, MAX_LEVELS - 1),
  }, ['id', 'title', 'level']), 1, MAX_SOURCES),
  hierarchy: obj('Editable hierarchy: an ordering of sources SUPPLIED by the author, drawn as the rows of a board. Displayed, never applied; it decides nothing about the readings', {
    levels: list('Row labels, first to last (user-supplied, neutral)', str('Row label', 48), 2, MAX_LEVELS),
    caption: str('Caption printed at the foot of the board', 60),
  }, ['levels', 'caption']),
  passages: obj('The passage that gives rise to the two readings (simulated, fictional wording)', {
    ref: str('Reference printed above the passage, e.g. "Text 1 · Art. 7 (fictional)"', 64),
    text: str('Passage wording (fictional)', 180),
  }, ['ref', 'text']),
  interpretations: list('Exactly two readings of the same passage, A and B, attributed to fictional sources', reading('A / B'), 2, 2),
};

/** Fictional English defaults shared by the four entries. */
export const IC_DEFAULTS = {
  sources: [
    {id: 'T1', title: 'Text 1 (fictional)', level: 0},
    {id: 'CA', title: 'Commentary A (fictional)', level: 1},
    {id: 'CB', title: 'Commentary B (fictional)', level: 1},
  ],
  hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'], caption: 'Order as supplied, not applied'},
  passages: {ref: 'Text 1 · Art. 7 (fictional)', text: 'Members may inspect the register and the minutes kept by the secretary.'},
  interpretations: [
    {label: 'Interpretation A', source: 1, text: '“kept by the secretary” covers the minutes only', focus: 'the minutes kept by the secretary'},
    {label: 'Interpretation B', source: 2, text: '“kept by the secretary” covers the register and the minutes', focus: 'the register and the minutes kept by the secretary'},
  ],
};

/** Fictional Spanish defaults (baseline-es presets). */
export const IC_DEFAULTS_ES = {
  sources: [
    {id: 'T1', title: 'Texto 1 (ficticio)', level: 0},
    {id: 'CA', title: 'Comentario A (ficticio)', level: 1},
    {id: 'CB', title: 'Comentario B (ficticio)', level: 1},
  ],
  hierarchy: {levels: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)'], caption: 'Orden aportado, no aplicado'},
  passages: {ref: 'Texto 1 · Art. 7 (ficticio)', text: 'Los miembros pueden consultar el registro y las actas que lleva la secretaría.'},
  interpretations: [
    {label: 'Interpretación A', source: 1, text: '«que lleva la secretaría» abarca solo las actas', focus: 'las actas que lleva la secretaría'},
    {label: 'Interpretación B', source: 2, text: '«que lleva la secretaría» abarca el registro y las actas', focus: 'el registro y las actas que lleva la secretaría'},
  ],
};

/** Substantive alternative content (contrast-or-alternative presets). */
export const IC_ALT = {
  sources: [
    {id: 'T2', title: 'Text 2 (fictional)', level: 0},
    {id: 'CC', title: 'Commentary C (fictional)', level: 1},
    {id: 'CD', title: 'Commentary D (fictional)', level: 1},
  ],
  hierarchy: {levels: ['Row 1 (user-supplied)', 'Row 2 (user-supplied)', 'Row 3 (user-supplied)'], caption: 'Rows as supplied, displayed only'},
  passages: {ref: 'Text 2 · Art. 3 (fictional)', text: 'Visitors sign the book at the gate before noon on working days.'},
  interpretations: [
    {label: 'Interpretation A', source: 1, text: '“before noon” sets the time on every day', focus: 'before noon'},
    {label: 'Interpretation B', source: 2, text: '“on working days” limits when the time applies', focus: 'before noon on working days'},
  ],
};

/** Long-label stress content (every string at least as long as the baseline). */
export const IC_LONG = {
  sources: [
    {id: 'T1-ab', title: 'Text 1: Consolidated Rules of the Example Club (fictional)', level: 0},
    {id: 'CA-1', title: 'Commentary A on the Consolidated Rules (fictional)', level: 1},
    {id: 'CB-2', title: 'Commentary B on the Consolidated Rules (fictional)', level: 1},
  ],
  hierarchy: {
    levels: ['Level 1 as supplied by the author (example)', 'Level 2 as supplied by the author (example)', 'Level 3 as supplied by the author (example)'],
    caption: 'Order supplied by the author; displayed, never applied',
  },
  passages: {
    ref: 'Text 1 · Article 7, paragraph 2, second sentence (fictional)',
    text: 'Members of the club may inspect, on any working day and without charge, the register and the minutes of the general meetings kept by the secretary.',
  },
  interpretations: [
    {label: 'Interpretation A (first commentary)', source: 1, text: '“kept by the secretary” covers only the minutes of the general meetings, not the register itself', focus: 'the minutes of the general meetings kept by the secretary'},
    {label: 'Interpretation B (second commentary)', source: 2, text: '“kept by the secretary” covers both the register and the minutes of the general meetings', focus: 'the register and the minutes of the general meetings kept by the secretary'},
  ],
};

/** Built-in strings of the kit. */
export const IC_STRINGS = {
  en: {
    proposed: 'Proposed (as supplied)',
    key: 'As supplied · no conclusion drawn',
    hierarchy: 'Editable hierarchy',
    notApplied: 'displayed, not applied',
    stateSeparated: 'Two readings proposed, kept apart',
    stateTraced: 'Two readings traced on one passage',
    statePlaced: 'Overlays laid on the passage',
    passage: 'Passage',
    sameSlip: 'Same passage in A and B',
    focusOn: 'Focus',
    before: 'Before',
    after: 'After',
  },
  es: {
    proposed: 'Propuesta (según lo aportado)',
    key: 'Según lo aportado · sin conclusión',
    hierarchy: 'Jerarquía editable',
    notApplied: 'se muestra, no se aplica',
    stateSeparated: 'Dos lecturas propuestas, separadas',
    stateTraced: 'Dos lecturas calcadas sobre un pasaje',
    statePlaced: 'Calcos colocados sobre el pasaje',
    passage: 'Pasaje',
    sameSlip: 'Mismo pasaje en A y B',
    focusOn: 'Foco',
    before: 'Antes',
    after: 'Después',
  },
};

/** Kit strings for a context (scene strings merged over the kit's). */
export const kitT = ctx => ({...IC_STRINGS.en, ...(IC_STRINGS[ctx.params.locale] || {}), ...ctx.t});

/** Source index a reading is attributed to (clamped to the supplied list). */
export const sourceOf = (p, k) => Math.min(p.sources.length - 1, Math.max(0, p.interpretations[k].source));
/** Hierarchy row of a source (clamped to the supplied rows). */
export const levelOf = (p, i) => Math.min(p.hierarchy.levels.length - 1, Math.max(0, p.sources[i].level));

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

/**
 * Motif colours derived from the palette. Lane A and lane B have equal
 * weight: same lightness roles, different hue; neither is an alarm colour.
 */
/** Relative luminance (WCAG) of a #rrggbb colour. */
export function luminance(hex) {
  const c = [1, 3, 5].map(i => parseInt(String(hex).slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** WCAG contrast ratio of two #rrggbb colours. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** The shade of `hex` whose luminance is closest to `target` (equal-weight highlight bands). */
function shadeToLuminance(hex, target) {
  let best = 0, d = Infinity;
  for (let i = -120; i <= 190; i++) {
    const e = Math.abs(luminance(shade(hex, i / 200)) - target);
    if (e < d) { d = e; best = i / 200; }
  }
  return shade(hex, best);
}
const colorCache = new Map();

export function icColors(ctx) {
  const th = ctx.theme;
  const ck = `${th.accent3}|${th.accent2}`;
  if (!colorCache.has(ck)) {
    // both readings' highlight bands get the SAME luminance (equal contrast against glass, film and ink)
    const target = luminance(shade(th.accent3, 0.32));
    colorCache.set(ck, [shadeToLuminance(th.accent3, target), shadeToLuminance(th.accent2, target)]);
  }
  const [bandA, bandB] = colorCache.get(ck);
  const lane = (c, soft, band, inkK) => ({color: c, soft, band, ink: shade(c, inkK)});
  return {
    a: lane(th.accent3, th.accent3Soft, bandA, -0.5),
    b: lane(th.accent2, th.accent2Soft, bandB, -0.2),
    book: th.accent4,
    neutral: '#7d858f',
    frame: '#aab3bb',
    frameDark: '#5b646c',
    glassOff: '#cfd6dc',
    glassOn: '#fff8df',
    glow: '#ffe9a8',
    slip: '#fffdf8',
    film: '#f3f7fa',
    pencil: '#4a525c',
    board: '#b8895b',
    boardDark: '#7d5a3a',
    groove: '#5f452e',
    card: '#fffdf6',
    line: '#d7dde3',
  };
}

/** Lane record for reading k (0 = A, 1 = B). */
export const laneOf = (ctx, k) => (k ? icColors(ctx).b : icColors(ctx).a);

/**
 * Opt-in marking of placeholder bars: a scene that sets `ctx.icMarkBars = true` gets a
 * `data-bar` attribute on every word / label placeholder bar (for rendered text-over-bar tests).
 * Without the flag the markup is unchanged.
 */
const barMark = ctx => (ctx && ctx.icMarkBars ? {'data-bar': 1} : null);

/** Colour of source i's token: the lane of the reading attributed to it, else neutral/book. */
export function sourceColor(ctx, p, i) {
  const C = icColors(ctx);
  if (i === sourceOf(p, 0)) return C.a.color;
  if (i === sourceOf(p, 1)) return C.b.color;
  return i === 0 ? C.book : C.neutral;
}

/* ------------------------------------------------------------------ */
/* Measurement helpers                                                 */
/* ------------------------------------------------------------------ */

/** Pixels at 1080p per design unit for the current view (for text sizing). */
export function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return (f.scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
}

/**
 * Fit text without ever breaking a word: the size only shrinks (bounded)
 * while the longest word is wider than the box, then words wrap.
 */
export function fitWords(ctx, text, o) {
  const weight = o.weight ?? 500, family = o.family ?? 'sans';
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const min = o.minSize ?? o.size;
  let size = o.size;
  const longest = s => Math.max(0, ...words.map(wd => ctx.measure(wd, s, weight, family)));
  while (size > min && longest(size) > o.maxWidth) size = Math.max(min, size - 0.5);
  return ctx.fit(text, {maxWidth: o.maxWidth, size, minSize: size, maxLines: o.maxLines ?? 8, weight, family, leading: o.leading});
}

/** True when a fit wraps a word across lines (a word wider than the box). */
export function breaksWord(ctx, f, maxWidth) {
  if (!f) return false;
  return String(f.full || '').split(/\s+/).filter(Boolean).some(wd => ctx.measure(wd, f.size, f.weight, f.family) > maxWidth + 0.5);
}

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export const inside = (a, b, pad = 0) => a.x >= b.x - pad && a.y >= b.y - pad && a.x + a.w <= b.x + b.w + pad && a.y + a.h <= b.y + b.h + pad;
export function unionBox(list) {
  const xs = list.flatMap(b => [b.x, b.x + b.w]), ys = list.flatMap(b => [b.y, b.y + b.h]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}
export const shift = (b, dx, dy) => ({...b, x: b.x + dx, y: b.y + dy});

/** Does segment p→q cross box b (with padding)? */
export function segmentHits(p, q, b, pad = 0) {
  const x0 = b.x - pad, y0 = b.y - pad, x1 = b.x + b.w + pad, y1 = b.y + b.h + pad;
  let t0 = 0, t1 = 1;
  const dx = q.x - p.x, dy = q.y - p.y;
  for (const [pp, qq] of [[-dx, p.x - x0], [dx, x1 - p.x], [-dy, p.y - y0], [dy, y1 - p.y]]) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}

/* ------------------------------------------------------------------ */
/* Passage layout (word boxes shared by the slip and the overlays)     */
/* ------------------------------------------------------------------ */

const WORD_EDGE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
/** Lower-case, accent-free token without edge punctuation. */
export function foldToken(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(WORD_EDGE, '');
}

/**
 * Measure the passage into lines of positioned words (greedy wrap between
 * words, never inside one). The slip and both overlays use the SAME layout,
 * so a tracing registers exactly on the passage.
 * Coordinates: origin = top-left of the text block; `line.y` = top of a line.
 * @param {any} ctx
 * @param {string} text
 * @param {{w:number, size:number, family?:'serif'|'sans', weight?:number, leading?:number}} o
 */
export function passageLayout(ctx, text, o) {
  const family = o.family ?? 'serif', weight = o.weight ?? 400, size = o.size;
  const lh = size * (o.leading ?? 1.36);
  const tokens = String(text ?? '').split(/\s+/).filter(Boolean);
  const space = ctx.measure(' ', size, weight, family);
  const lines = [];
  let cur = [], x = 0, maxW = 0, widest = 0;
  tokens.forEach((t, i) => {
    const tw = ctx.measure(t, size, weight, family);
    widest = Math.max(widest, tw);
    if (cur.length && x + space + tw > o.w) {
      lines.push(cur);
      cur = [];
      x = 0;
    }
    const wx = cur.length ? x + space : 0;
    cur.push({t, i, x: wx, w: tw});
    x = wx + tw;
    maxW = Math.max(maxW, x);
  });
  if (cur.length) lines.push(cur);
  const out = lines.map((words, li) => ({words, y: li * lh, text: words.map(wd => wd.t).join(' '), width: words.length ? words[words.length - 1].x + words[words.length - 1].w : 0}));
  if (!out.length) out.push({words: [], y: 0, text: '', width: 0});
  return {lines: out, size, lh, family, weight, w: o.w, used: maxW, widest, fitsWords: widest <= o.w + 0.5, h: (out.length - 1) * lh + size * 1.2, tokens, text: String(text ?? '')};
}

/** Token span [i0, i1] of `phrase` inside the layout (first occurrence), or null. */
export function phraseSpan(PL, phrase) {
  const P = String(phrase ?? '').split(/\s+/).map(foldToken).filter(Boolean);
  const Tk = PL.tokens.map(foldToken);
  if (!P.length) return null;
  for (let i = 0; i + P.length <= Tk.length; i++) {
    let ok = true;
    for (let j = 0; j < P.length && ok; j++) ok = Tk[i + j] === P[j];
    if (ok) return {i0: i, i1: i + P.length - 1};
  }
  return null;
}

/**
 * Per-line rectangles covering a token span (text-block coordinates). A
 * missing span (null) covers the whole passage (the bracket fallback).
 */
export function spanRects(PL, span, padX = 0) {
  const i0 = span ? span.i0 : 0, i1 = span ? span.i1 : PL.tokens.length - 1;
  const out = [];
  for (const line of PL.lines) {
    const ws = line.words.filter(wd => wd.i >= i0 && wd.i <= i1);
    if (!ws.length) continue;
    const x0 = ws[0].x - padX, x1 = ws[ws.length - 1].x + ws[ws.length - 1].w + padX;
    out.push({x: x0, y: line.y - PL.size * 0.08, w: x1 - x0, h: PL.size * 1.2, line: PL.lines.indexOf(line)});
  }
  return out;
}

/** Text of a token span (for labels). */
export const spanText = (PL, span) => (span ? PL.tokens.slice(span.i0, span.i1 + 1).join(' ') : PL.text);

/** Zero-width mark on traced copies: tests tell a tracing overprint from an accidental collision. */
export const TRACE_MARK = '​';

/**
 * Passage text node (one <text>, one tspan per line) or, with labels
 * hidden, one bar per word at the measured word boxes.
 */
export function passageText(ctx, PL, {x = 0, y = 0, fill, name, mark = '', show = ctx.show('all'), italic = false, barColor}) {
  if (!show) {
    return g({name, transform: T(x, y)}, PL.lines.flatMap(line => line.words.map(wd => h('rect', {
      ...barMark(ctx),
      x: r(wd.x), y: r(line.y + PL.size * 0.3), width: r(Math.max(4, wd.w)), height: r(PL.size * 0.46), rx: r(PL.size * 0.2), fill: barColor ?? fill, opacity: 0.55,
    }))));
  }
  const fit = {lines: PL.lines.map((l, i) => (i === 0 ? mark : '') + l.text), size: PL.size, lineHeight: PL.lh, family: PL.family, weight: PL.weight, truncated: false};
  return g({name}, textBlock(fit, {x, y, fill, italic}));
}

/** Text block or placeholder bars (for labels hidden). */
export function textOrBars(ctx, fit, show, o) {
  if (show) return textBlock(fit, o);
  return g(null, fit.lines.map((line, i) => {
    const w = Math.max(8, ctx.measure(line, fit.size, fit.weight, fit.family));
    const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
    return h('rect', {...barMark(ctx), x: r(x), y: r(o.y + i * fit.lineHeight + fit.size * 0.28), width: r(w), height: r(fit.size * 0.46), rx: r(fit.size * 0.2), fill: o.barFill ?? o.fill, opacity: 0.4});
  }));
}

/* ------------------------------------------------------------------ */
/* Art: light table                                                    */
/* ------------------------------------------------------------------ */

/**
 * Light table seen from above: metal frame, glass panel, glow layer and a
 * rocker switch on the frame. Local origin = top-left. The frame label
 * (supplied object label) sits on the bottom rail.
 * Named: `${P}-glow` (opacity), `${P}-halo` (opacity), `${P}-switch` (transform).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, rail:number, label?:string|null, F:number}} o
 */
export function lightTable(ctx, o) {
  const th = ctx.theme;
  const C = icColors(ctx);
  const P = o.prefix;
  const {w, h: hh, rail} = o;
  const gx = rail, gy = rail, gw = w - rail * 2, gh = hh - rail * 2;
  // rocker switch on the top rail, near the left corner (where reader A reaches it)
  const sx = rail * 1.3;
  const sy = o.switchBottom ? hh - rail * 0.5 : rail * 0.5;
  const parts = [];
  // soft halo around the frame when lit
  parts.push(g({name: `${P}-halo`, opacity: 0},
    [26, 18, 10].map((k, i) => h('path', {d: roundRectPath(-k, -k, w + k * 2, hh + k * 2, 20 + k), fill: C.glow, opacity: 0.16 + i * 0.1}))));
  parts.push(h('path', {d: roundRectPath(8, 11, w, hh, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 16), fill: C.frame, stroke: th.ink, 'stroke-width': 2.5}));
  parts.push(h('path', {d: roundRectPath(4, 4, w - 8, hh - 8, 13), fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0.45}));
  parts.push(h('path', {d: roundRectPath(gx, gy, gw, gh, 8), fill: C.glassOff, stroke: C.frameDark, 'stroke-width': 2}));
  parts.push(h('path', {name: `${P}-glow`, d: roundRectPath(gx, gy, gw, gh, 8), fill: C.glassOn, opacity: 0}));
  // glass sheen
  parts.push(h('path', {d: `M${r(gx + gw * 0.62)} ${r(gy + 4)}L${r(gx + gw * 0.74)} ${r(gy + 4)}L${r(gx + gw * 0.5)} ${r(gy + gh - 4)}L${r(gx + gw * 0.38)} ${r(gy + gh - 4)}Z`, fill: '#fff', opacity: 0.18}));
  // screws
  for (const [cx, cy] of [[rail * 0.5, rail * 0.5], [w - rail * 0.5, rail * 0.5], [rail * 0.5, hh - rail * 0.5], [w - rail * 0.5, hh - rail * 0.5]]) {
    parts.push(h('circle', {cx: r(cx), cy: r(cy), r: r(Math.max(3, rail * 0.16)), fill: C.frameDark}));
  }
  // rocker switch
  parts.push(g({transform: T(sx, sy)},
    h('rect', {x: 0, y: r(-rail * 0.32), width: r(rail * 1.4), height: r(rail * 0.64), rx: r(rail * 0.2), fill: '#3d444b', stroke: th.ink, 'stroke-width': 1.5}),
    g({name: `${P}-switch`, transform: T(rail * 0.35, 0)},
      h('rect', {x: r(-rail * 0.22), y: r(-rail * 0.22), width: r(rail * 0.44), height: r(rail * 0.44), rx: r(rail * 0.1), fill: '#eef1f3', stroke: th.ink, 'stroke-width': 1.2}))));
  let labelBox = null;
  if (o.label && ctx.show('all')) {
    const lf = fitWords(ctx, o.label, {maxWidth: gw * 0.66, size: o.F, minSize: o.F * 0.9, maxLines: 1, weight: 700});
    const lw = lf.width + o.F * 0.9;
    const lx = w - rail * 1.2 - lw;
    const ly = o.switchBottom ? (rail - lf.height - 6) / 2 : hh - rail + (rail - lf.height - 6) / 2;
    labelBox = {x: lx, y: ly - 2, w: lw, h: lf.height + 10};
    parts.push(h('path', {d: roundRectPath(lx, ly - 2, lw, lf.height + 10, 5), fill: '#e7ebee', stroke: C.frameDark, 'stroke-width': 1.5}));
    parts.push(textBlock(lf, {x: lx + lw / 2, y: ly + 3, anchor: 'middle', fill: th.ink}));
  }
  return {node: g(null, parts), w, h: hh, glass: {x: gx, y: gy, w: gw, h: gh}, switchAt: {x: sx + rail * 0.7, y: sy}, labelBox};
}

/** Frame props for the light table: glow 0..1, switch 0 (off) → 1 (on). */
export function lightTableFrame(P, glow, sw, rail) {
  return {
    [`${P}-glow`]: {opacity: r(clamp(glow) * 0.95, 3)},
    [`${P}-halo`]: {opacity: r(clamp(glow), 3)},
    [`${P}-switch`]: {transform: T(rail * (0.35 + 0.7 * clamp(sw)), 0)},
  };
}

/* ------------------------------------------------------------------ */
/* Art: passage slip                                                   */
/* ------------------------------------------------------------------ */

/**
 * Paper slip carrying the supplied reference and the passage. Local origin
 * = top-left. `text` = origin of the passage block (slip coordinates).
 * Named: `${P}-text` (passage group; opacity).
 * @param {any} ctx
 * @param {{prefix:string, PL:any, ref:string, F:number, color:string, pad?:number}} o
 */
export function passageSlip(ctx, o) {
  const th = ctx.theme;
  const C = icColors(ctx);
  const P = o.prefix;
  const F = o.F;
  const edge = Math.max(10, F * 0.45);
  const pad = o.pad ?? F * 0.8;
  const w = o.PL.w + edge + pad * 2;
  const refFit = fitWords(ctx, o.ref, {maxWidth: o.PL.w, size: F, minSize: F * 0.9, maxLines: 6, weight: 800});
  const top = pad * 0.75;
  const tx = edge + pad, ty = top + refFit.height + F * 0.7;
  const hh = ty + o.PL.h + pad * 0.8;
  const teeth = Math.max(8, Math.round(w / 34));
  const bottom = Array.from({length: teeth + 1}, (_, i) => `${r(w - (w * i) / teeth)} ${r(hh + (i % 2 ? 6 : 0))}`).join('L');
  const d = `M4 0H${r(w - 4)}Q${r(w)} 0 ${r(w)} 4V${r(hh)}L${bottom}Z`;
  const node = g(null,
    h('path', {d, transform: 'translate(7 9)', fill: th.shadow}),
    h('path', {d, fill: C.slip, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('rect', {x: 0, y: 0, width: r(edge), height: r(hh), fill: o.color, stroke: th.ink, 'stroke-width': 1.6}),
    h('line', {x1: r(tx), x2: r(w - pad), y1: r(ty - F * 0.36), y2: r(ty - F * 0.36), stroke: th.paperLine, 'stroke-width': 1.5}),
    textOrBars(ctx, refFit, ctx.show('all'), {x: tx, y: top, fill: th.ink, barFill: th.inkSoft}),
    passageText(ctx, o.PL, {x: tx, y: ty, fill: th.ink, name: `${P}-text`, barColor: th.inkSoft}),
  );
  return {node, w, h: hh, text: {x: tx, y: ty}, refFit, refBox: {x: tx, y: top, w: refFit.width, h: refFit.height}};
}

/* ------------------------------------------------------------------ */
/* Art: tracing overlay                                                */
/* ------------------------------------------------------------------ */

/** Highlight band opacity (one value for every reading: equal weight). */
export const BAND_OPACITY = 0.9;
/** Interleaved stripes: each covers exactly half the line height (A the upper, B the lower half), so neither covers the other. */
export const STRIPE = {h: 0.5, from: 0.5};

/**
 * Trace of a reading's emphasis only: pencil bars at every word box, except
 * the focus words, which are printed legibly (one <text>, a tspan per line
 * segment, so the phrase stays one searchable string). With labels hidden
 * the focus words are darker bars.
 */
export function focusTrace(ctx, PL, span, {x, y, fill, legible = true, weight = 600}) {
  const i0 = span ? span.i0 : -1, i1 = span ? span.i1 : -2;
  const bars = [];
  const segs = [];
  const show = legible && ctx.show('all');
  PL.lines.forEach(line => {
    const inSpan = line.words.filter(wd => wd.i >= i0 && wd.i <= i1);
    line.words.forEach(wd => {
      const focus = wd.i >= i0 && wd.i <= i1;
      if (focus && show) return;
      bars.push(h('rect', {...barMark(ctx), x: r(x + wd.x), y: r(y + line.y + PL.size * 0.34), width: r(Math.max(4, wd.w)), height: r(PL.size * (focus ? 0.5 : 0.36)), rx: r(PL.size * 0.18), fill, opacity: focus ? 0.8 : 0.35}));
    });
    if (inSpan.length) segs.push({x: x + inSpan[0].x, y: y + line.y, text: inSpan.map(wd => wd.t).join(' ')});
  });
  const text = show && segs.length ? h('text', {'font-family': FONTS[PL.family] || FONTS.serif, 'font-size': r(PL.size, 2), 'font-weight': weight, fill},
    segs.map((sg, i) => h('tspan', {x: r(sg.x), y: r(sg.y + PL.size * 0.8)}, (i === 0 ? TRACE_MARK : '') + sg.text))) : null;
  return g(null, bars, text);
}

/**
 * Vellum tracing overlay with a pull tab on its outer side (A: left,
 * B: right), registration marks, a traced copy of the passage (revealed by
 * a scan from top to bottom) and the reading's highlight band over its focus
 * words (drawn line by line). A's band has square ends, B's round ends, so
 * the two patterns stay distinct in any palette and with labels hidden.
 * Local origin = top-left of the sheet (the tab sticks out sideways).
 * Named: `${P}-sheet` (fill-opacity), `${P}-traceclip` (height), `${P}-scan`
 * (transform, opacity), `${P}-band${i}` (width), `${P}-caps` (opacity).
 * @param {any} ctx
 * @param {{prefix:string, PL:any, F:number, lane:any, letter:string, side:'left'|'right', span:any, round?:boolean, pad?:number, padTop?:number}} o
 */
export function overlayArt(ctx, o) {
  const th = ctx.theme;
  const C = icColors(ctx);
  const P = o.prefix, F = o.F, PL = o.PL, lane = o.lane;
  // `bandLane`: colour of the highlight (defaults to the sheet's lane colour)
  const bandLane = o.bandLane ?? lane;
  const padX = o.pad ?? F * 0.8;
  const padT = o.padTop ?? F * 0.6;
  const w = PL.w + padX * 2;
  const hh = PL.h + padT + F * 0.55;
  // side tab (left / right, vertical) or a tab on the near edge (`side: 'bottom'`, at `tabAt` of the width)
  const bottomTab = o.side === 'bottom';
  const tabLong = Math.min(bottomTab ? w * 0.4 : hh * 0.8, Math.max(F * 2.4, 56)), tabShort = Math.max(F * 1.5, 30);
  const tabW = bottomTab ? tabLong : tabShort, tabH = bottomTab ? tabShort : tabLong;
  const tabX = bottomTab ? w * (o.tabAt ?? 0.5) - tabW / 2 : o.side === 'left' ? -tabW + 4 : w - 4;
  const tabY = bottomTab ? hh - 4 : (hh - tabH) / 2;
  // `bandless`: no highlight of its own (the entry draws its bands over the sheet)
  const rects = o.bandless ? [] : spanRects(PL, o.span, F * 0.18).map(q => ({...q, x: q.x + padX, y: q.y + padT}));
  const clip = `${P}-tclip`;
  const bandClip = `${P}-bclip`;
  const regs = [[F * 0.45, F * 0.45], [w - F * 0.45, hh - F * 0.45]].map(([cx, cy]) => g(null,
    h('circle', {cx: r(cx), cy: r(cy), r: r(F * 0.22), fill: 'none', stroke: lane.ink, 'stroke-width': 1.5, opacity: 0.7}),
    h('path', {d: `M${r(cx - F * 0.34)} ${r(cy)}H${r(cx + F * 0.34)}M${r(cx)} ${r(cy - F * 0.34)}V${r(cy + F * 0.34)}`, stroke: lane.ink, 'stroke-width': 1.3, opacity: 0.7})));
  const round = o.round ?? o.letter === 'B';
  const caps = rects.length ? [rects[0], rects[rects.length - 1]].map((q, i) => {
    const x = i === 0 ? q.x : q.x + q.w;
    const s = i === 0 ? 1 : -1;
    const d = round
      ? `M${r(x + s * F * 0.28)} ${r(q.y - 2)}Q${r(x - s * F * 0.12)} ${r(q.y + q.h / 2)} ${r(x + s * F * 0.28)} ${r(q.y + q.h + 2)}`
      : `M${r(x + s * F * 0.3)} ${r(q.y - 2)}H${r(x)}V${r(q.y + q.h + 2)}H${r(x + s * F * 0.3)}`;
    return h('path', {d, fill: 'none', stroke: bandLane.ink, 'stroke-width': r(Math.max(2.5, F * 0.12)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  }) : [];
  const letterShow = ctx.show('key') && !o.marksOnly;
  // (opt-in `tabName`: a scene handle on the tab group, e.g. for rendered collision tests)
  const tab = g(o.tabName ? {name: o.tabName} : null,
    h('path', {d: roundRectPath(tabX, tabY, tabW, tabH, 8), fill: lane.color, stroke: th.ink, 'stroke-width': 2}),
    // grip ridges (text-free cue of the tab)
    bottomTab
      ? [0.2, 0.8].map(k => h('line', {x1: r(tabX + tabW * k), x2: r(tabX + tabW * k), y1: r(tabY + tabH * 0.3), y2: r(tabY + tabH * 0.7), stroke: '#fff', 'stroke-width': 2, opacity: 0.6}))
      : [0.2, 0.8].map(k => h('line', {x1: r(tabX + tabW * 0.3), x2: r(tabX + tabW * 0.7), y1: r(tabY + tabH * k), y2: r(tabY + tabH * k), stroke: '#fff', 'stroke-width': 2, opacity: 0.6})),
    letterShow ? h('text', {x: r(tabX + tabW / 2), y: r(tabY + tabH / 2 + F * 0.38), 'text-anchor': 'middle', 'font-size': r(F * 1.05), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.letter) : null,
  );
  const node = g(null,
    h('path', {d: roundRectPath(6, 8, w, hh, 6), fill: th.shadow, opacity: 0.6}),
    tab,
    h('path', {name: `${P}-sheet`, d: roundRectPath(0, 0, w, hh, 6), fill: C.film, 'fill-opacity': 0.85, stroke: lane.ink, 'stroke-width': 2}),
    h('rect', {x: 0, y: 0, width: r(w), height: r(Math.max(6, F * 0.24)), rx: 3, fill: lane.color, opacity: 0.85}),
    regs,
    h('defs', null,
      h('clipPath', {id: ctx.id(clip)}, h('rect', {name: `${P}-traceclip`, x: 0, y: 0, width: r(w), height: 0})),
      h('clipPath', {id: ctx.id(bandClip)}, rects.map((q, i) => h('rect', {name: `${P}-band${i}`, x: r(q.x), y: r(q.y), width: 0, height: r(q.h)})))),
    g({'clip-path': ctx.ref(bandClip)},
      rects.map(q => {
        // `stripe`: 'top' / 'bottom' draws the band on one half of the line (equal height and opacity
        // for A and B), so two stacked overlays show BOTH patterns side by side, interleaved
        const sy = o.stripe === 'bottom' ? q.y + q.h * STRIPE.from : q.y;
        const sh = o.stripe ? q.h * STRIPE.h : q.h;
        return h('rect', {x: r(q.x), y: r(sy), width: r(q.w), height: r(sh), rx: r(round ? sh / 2 : 3), fill: bandLane.band, opacity: BAND_OPACITY});
      })),
    g({name: `${P}-caps`, opacity: 0}, caps),
    // `underText`: extra marks drawn under the traced words (e.g. an entry's own bands)
    o.underText || null,
    g({'clip-path': ctx.ref(clip)},
      o.focusOnly ? focusTrace(ctx, PL, o.span, {x: padX, y: padT, fill: C.pencil, legible: !o.marksOnly, weight: o.focusWeight}) : passageText(ctx, PL, {x: padX, y: padT, fill: C.pencil, mark: TRACE_MARK, barColor: C.pencil})),
    h('rect', {name: `${P}-scan`, x: 2, y: -3, width: r(w - 4), height: 6, rx: 3, fill: C.glow, opacity: 0}),
  );
  const grip = {x: tabX + tabW / 2, y: tabY + tabH / 2};
  // style facts (tests assert A and B get identical visual treatment)
  const style = {bandOpacity: BAND_OPACITY, bandH: rects.length ? r(rects[0].h * (o.stripe ? STRIPE.h : 1), 2) : 0, capStroke: r(Math.max(2.5, F * 0.12), 2), sheetStroke: 2, tabW: r(tabW, 2), tabH: r(tabH, 2)};
  return {node, prefix: P, w, h: hh, text: {x: padX, y: padT}, rects, grip, tabBox: {x: tabX, y: tabY, w: tabW, h: tabH}, bands: rects.length, found: Boolean(o.span), style, stripe: o.stripe || null};
}

/**
 * Frame props for an overlay: sheet opacity (translucent when lit), trace
 * progress (scan from top to bottom), band progress (line by line).
 * @param {{prefix:string, w:number, h:number, rects:any[]}} ov
 * @param {{lit:number, trace:number, band:number}} s
 */
export function overlayFrame(ov, s) {
  const P = ov.prefix;
  const out = {
    [`${P}-sheet`]: {'fill-opacity': r(0.86 - 0.74 * clamp(s.lit), 3)},
    [`${P}-traceclip`]: {height: r(ov.h * clamp(s.trace))},
    [`${P}-scan`]: {transform: T(0, ov.h * clamp(s.trace)), opacity: s.trace > 0 && s.trace < 1 ? 0.9 : 0},
    [`${P}-caps`]: {opacity: r(clamp((s.band - 0.85) / 0.15), 3)},
  };
  const n = ov.rects.length;
  const total = ov.rects.reduce((a, q) => a + q.w, 0) || 1;
  let acc = 0;
  ov.rects.forEach((q, i) => {
    const a = acc / total, b = (acc + q.w) / total;
    acc += q.w;
    const k = n ? clamp((clamp(s.band) - a) / Math.max(1e-6, b - a)) : 0;
    out[`${P}-band${i}`] = {width: r(q.w * k)};
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Art: tray, reading card                                              */
/* ------------------------------------------------------------------ */

/**
 * Reading tray (top-down in-tray): lane-tinted rim, floor, and a front lip
 * with a letter disc and the supplied label (the reader the tray belongs
 * to). Local origin = top-left.
 * @param {any} ctx
 * @param {{w:number, h:number, lane:any, letter:string, label:string, F:number, rim?:number}} o
 */
export function trayArt(ctx, o) {
  const th = ctx.theme;
  const rim = o.rim ?? Math.max(14, o.F * 0.6);
  const {w, h: hh, lane} = o;
  const key = ctx.show('key');
  const R = o.F * 0.62;
  // a null label draws a plain lip (no text, no letter)
  const lf = o.label ? fitWords(ctx, o.label, {maxWidth: w - rim * 4 - R * 2 - o.F * 0.6, size: o.F, minSize: o.F, maxLines: 2, weight: 800}) : null;
  const lipH = lf ? Math.max(rim * 1.6, Math.max(lf.height, R * 2) + 18) : rim * 1.6;
  const floor = {x: rim, y: rim, w: w - rim * 2, h: hh - rim - lipH};
  const lipY = hh - lipH + 4, lipIn = lipH - 10;
  const groupW = lf ? R * 2 + o.F * 0.45 + lf.width : 0;
  const gx = w / 2 - groupW / 2;
  const node = g(null,
    h('path', {d: roundRectPath(8, 11, w, hh, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 18), fill: shade(lane.soft, -0.04), stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(floor.x, floor.y, floor.w, floor.h, 10), fill: shade(lane.soft, 0.35), stroke: shade(lane.color, -0.2), 'stroke-width': 1.8}),
    h('rect', {x: r(floor.x + 6), y: r(floor.y + 4), width: r(floor.w - 12), height: 5, rx: 2.5, fill: '#000', opacity: 0.08}),
    // front lip with the label plate
    h('path', {d: roundRectPath(rim * 1.4, lipY, w - rim * 2.8, lipIn, 8), fill: shade(lane.color, 0.6), stroke: shade(lane.color, -0.25), 'stroke-width': 1.8}),
    lf ? h('circle', {cx: r(gx + R), cy: r(lipY + lipIn / 2), r: r(R), fill: lane.color, stroke: th.ink, 'stroke-width': 1.5}) : null,
    lf && key ? h('text', {x: r(gx + R), y: r(lipY + lipIn / 2 + R * 0.4), 'text-anchor': 'middle', 'font-size': r(o.F * 0.88), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.letter) : null,
    lf ? textOrBars(ctx, lf, key, {x: gx + R * 2 + o.F * 0.45, y: lipY + (lipIn - lf.height) / 2, fill: lane.ink}) : null,
  );
  return {node, w, h: hh, floor, lipH, labelFit: lf};
}

/** Height of a tray lip for a label at size F (without building the tray). */
export function trayLipH(ctx, {w, F, label, rim}) {
  const R = F * 0.62;
  const rr = rim ?? Math.max(14, F * 0.6);
  if (!label) return rr * 1.6;
  const lf = fitWords(ctx, label, {maxWidth: w - rr * 4 - R * 2 - F * 0.6, size: F, minSize: F, maxLines: 2, weight: 800});
  return Math.max(rr * 1.6, Math.max(lf.height, R * 2) + 18);
}

/**
 * Attributed reading card: letter disc + label, "proposed (as supplied)",
 * the quoted reading and its attribution. A and B cards share one layout and
 * one set of sizes (equal weight); only the lane hue differs.
 * Local origin = top-left.
 * @param {any} ctx
 * @param {{w:number, F:number, lane:any, letter:string, label:string, text:string, by:string, proposed:string, minH?:number, inlineSub?:boolean, focus?:string, round?:boolean, compact?:boolean}} o
 */
export function readingCardArt(ctx, o) {
  const th = ctx.theme;
  const C = icColors(ctx);
  const F = o.F;
  const pad = F * (o.compact ? 0.45 : 0.62);
  const R = F * 0.72;
  const iw = o.w - pad * 2;
  const key = ctx.show('key'), all = ctx.show('all');
  // header units stay whole: one line (down to 0.86 F) whenever that fits, wrapping only when it cannot
  // (the supplied label keeps its full size; the generic "proposed" tag may shrink to 0.86 F as before)
  const oneLine = (text, maxWidth, size, weight, minSize = F * 0.86) => {
    const f = ctx.fit(text, {maxWidth, size, minSize, maxLines: 1, weight, family: 'sans'});
    return f.truncated ? null : f;
  };
  // a wrapped label never leaves a short token ("A", "B", "1") alone on its last line
  const orphan = f => f.lines.length > 1 && f.lines[f.lines.length - 1].trim().split(/\s+/).length === 1 && f.lines[f.lines.length - 1].trim().length <= 2;
  // (opt-in `labelMaxWidth`: a narrower shared wrap width, so two compared cards get the same header lines)
  const labW = Math.min(iw - R * 2 - F * 0.5, o.labelMaxWidth ?? Infinity);
  let lab = oneLine(o.label, labW, F, 800, F);
  if (!lab) {
    lab = fitWords(ctx, o.label, {maxWidth: labW, size: F, minSize: F * 0.86, maxLines: 3, weight: 800});
    for (let k = 0.95; orphan(lab) && k >= 0.6; k -= 0.05) {
      const f = fitWords(ctx, o.label, {maxWidth: labW * k, size: F, minSize: F * 0.86, maxLines: 3, weight: 800});
      if (!f.truncated && f.size >= lab.size) lab = f;
    }
  }
  // "proposed (as supplied)": one line, else broken only before its parenthesis
  let sub = oneLine(o.proposed, iw, F * 0.88, 600);
  let subParen = false;
  const pi = String(o.proposed).indexOf(' (');
  if (!sub && pi > 0) {
    const parts = [o.proposed.slice(0, pi), o.proposed.slice(pi + 1)].map(t0 => oneLine(t0, iw, F * 0.88, 600));
    if (parts.every(Boolean)) {
      const size = Math.min(...parts.map(q => q.size));
      const [a, b] = [o.proposed.slice(0, pi), o.proposed.slice(pi + 1)].map(t0 => ctx.fit(t0, {maxWidth: iw, size, minSize: size, maxLines: 1, weight: 600, family: 'sans'}));
      sub = {...a, lines: [a.lines[0], b.lines[0]], width: Math.max(a.width, b.width), height: a.lineHeight + a.size, full: o.proposed};
      subParen = true;
    }
  }
  if (!sub) sub = fitWords(ctx, o.proposed, {maxWidth: iw, size: F * 0.88, minSize: F * 0.86, maxLines: 2, weight: 600});
  const txt = fitWords(ctx, o.text, {maxWidth: iw, size: F, minSize: F, maxLines: 10, weight: 400, family: 'serif'});
  const by = fitWords(ctx, `— ${o.by}`, {maxWidth: iw, size: F, minSize: F, maxLines: 4, weight: 600});
  // optional: the words this reading highlights, printed on the card
  const foc = o.focus ? fitWords(ctx, o.focus, {maxWidth: iw - F * 0.6, size: F, minSize: F, maxLines: 4, weight: 600, family: 'serif'}) : null;
  // `inlineSub`: "proposed (as supplied)" shares the header row when it fits there
  const subW = ctx.measure(o.proposed, F * 0.88, 600, 'sans');
  const inline = o.inlineSub && lab.lines.length === 1 && lab.width + subW + R * 2 + F * 1.05 <= iw;
  const headH = Math.max(R * 2, lab.height);
  let y = pad;
  const parts = [];
  parts.push(h('circle', {cx: r(pad + R), cy: r(y + headH / 2), r: r(R), fill: o.lane.color, stroke: th.ink, 'stroke-width': 2}));
  if (key) parts.push(h('text', {x: r(pad + R), y: r(y + headH / 2 + R * 0.4), 'text-anchor': 'middle', 'font-size': r(F * 0.9), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.letter));
  parts.push(textOrBars(ctx, lab, key, {x: pad + R * 2 + F * 0.5, y: y + (headH - lab.height) / 2, fill: o.lane.ink}));
  if (inline) {
    parts.push(textOrBars(ctx, sub, all, {x: o.w - pad, y: y + (headH - sub.height) / 2, anchor: 'end', fill: th.inkSoft}));
    y += headH + F * 0.4;
  } else {
    y += headH + F * 0.35;
    parts.push(textOrBars(ctx, sub, all, {x: pad, y, fill: th.inkSoft}));
    y += sub.height + F * 0.4;
  }
  const ruleY = y - F * 0.18;
  parts.push(textOrBars(ctx, txt, all, {x: pad, y, fill: th.ink, italic: true}));
  y += txt.height + F * 0.45;
  if (foc) {
    parts.push(h('path', {d: roundRectPath(pad, y - F * 0.12, foc.width + F * 0.6, foc.height + F * 0.24, o.round ? (foc.height + F * 0.24) / 2 : 4), fill: o.lane.band}));
    parts.push(textOrBars(ctx, foc, all, {x: pad + F * 0.3, y, fill: th.ink}));
    y += foc.height + F * 0.5;
  }
  parts.push(textOrBars(ctx, by, all, {x: pad, y, fill: th.inkSoft}));
  y += by.height + pad;
  const natural = y;
  const hh = Math.max(y, o.minH ?? 0);
  const node = g(null,
    h('path', {d: roundRectPath(6, 8, o.w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, o.w, hh, 10), fill: C.card, stroke: shade(o.lane.color, -0.25), 'stroke-width': 2.2}),
    h('path', {d: `M0 10Q0 0 10 0H${r(o.w - 10)}Q${r(o.w)} 0 ${r(o.w)} 10V${r(pad + headH + F * 0.1)}H0Z`, fill: o.lane.soft}),
    h('line', {x1: r(pad), x2: r(o.w - pad), y1: r(ruleY), y2: r(ruleY), stroke: o.lane.color, 'stroke-width': 2, opacity: 0.7}),
    parts,
  );
  // header units ("Interpretation A", "proposed (as supplied)") stay on one line whenever one line of the card can hold them
  const labOne = ctx.measure(o.label, F, 800, 'sans'), subOne = ctx.measure(o.proposed, F * 0.86, 600, 'sans');
  const headerWhole = (lab.lines.length === 1 || (labOne > labW && !orphan(lab) && !breaksWord(ctx, lab, labW))) && (inline || sub.lines.length === 1 || subParen || subOne > iw);
  return {node, w: o.w, h: hh, natural, fits: [lab, sub, txt, by, foc].filter(Boolean), minSupplied: Math.min(lab.size, txt.size, by.size), headerWhole, headLines: lab.lines.length, subLines: inline ? 1 : sub.lines.length, subParen: inline || sub.lines.length === 1 || subParen, inline, labSize: lab.size};
}

/* ------------------------------------------------------------------ */
/* Art: open book, hierarchy board, magnifier                          */
/* ------------------------------------------------------------------ */

/**
 * Open book seen from above: cloth covers, page blocks, curved pages, gutter
 * shade. First page: the source's id tab and title. Second page: simulated
 * wording bars with the passage band marked. `orient` 'h' = pages side by
 * side (spine vertical), 'v' = pages stacked (spine horizontal, for narrow
 * columns). Local origin = top-left.
 * Named: `${P}-band` (opacity of the passage mark).
 * @param {any} ctx
 * @param {{prefix:string, w:number, F:number, title:string, id:string, color:string, minH?:number, orient?:'h'|'v'}} o
 */
export function openBook(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix, F = o.F, w = o.w;
  const m = Math.max(10, F * 0.45);
  const pad = F * 0.55;
  // pages stacked when a title word would not fit a side-by-side page
  const longest = Math.max(0, ...String(o.title).split(/\s+/).map(wd => ctx.measure(wd, F, 700, 'sans')));
  const v = o.orient === 'v' || (o.orient !== 'h' && longest > w / 2 - m - pad * 2);
  const pw = v ? w - m * 2 : w / 2 - m;
  const idFit = fitWords(ctx, o.id, {maxWidth: pw - pad * 2, size: F, minSize: F * 0.9, maxLines: 1, weight: 800});
  const tFit = fitWords(ctx, o.title, {maxWidth: pw - pad * 2, size: F, minSize: F, maxLines: 8, weight: 700});
  const tabH = idFit.height + 10, tabW = idFit.width + F * 0.8;
  const firstH = pad + tabH + F * 0.35 + tFit.height + pad;
  let pageH, hh;
  if (v) {
    pageH = Math.max(firstH, F * 3.6);
    hh = Math.max(o.minH ?? 0, pageH * 2 + m * 2);
    pageH = (hh - m * 2) / 2;
  } else {
    hh = Math.max(o.minH ?? 0, firstH + m * 2, F * 5.2);
    pageH = hh - m * 2;
  }
  const p1 = {x: m, y: m, w: pw, h: pageH};
  const p2 = v ? {x: m, y: m + pageH, w: pw, h: pageH} : {x: w / 2, y: m, w: pw, h: pageH};
  const rows = [];
  const barH = Math.max(5, F * 0.26), gap = F * 0.5;
  const n = Math.max(3, Math.floor((p2.h - pad * 2 + gap) / (barH + gap)));
  const bandRow = n >= 4 ? 1 : 0;
  const by0 = p2.y + pad + bandRow * (barH + gap) - gap * 0.4;
  const band = {x: p2.x + pad - 6, y: by0, w: p2.w - pad * 2 + 12, h: (barH + gap) * Math.min(2, n - bandRow) + gap * 0.05};
  for (let i = 0; i < n; i++) {
    const yy = p2.y + pad + i * (barH + gap);
    if (yy + barH > p2.y + p2.h - pad * 0.6) break;
    const k = ctx.rng(`${P}-bar`, i);
    const bw = (p2.w - pad * 2) * (i === n - 1 ? 0.45 : 0.82 + k * 0.18);
    rows.push(h('rect', {...barMark(ctx), x: r(p2.x + pad), y: r(yy), width: r(bw), height: r(barH), rx: r(barH / 2), fill: th.paperLine}));
  }
  const show = ctx.show('all');
  const stacks = pg => [3, 6].map(k => h('path', {d: roundRectPath(pg.x + (v ? k * 0.3 : (pg === p1 ? -k * 0.6 : k * 0.6)), pg.y + k * (v ? (pg === p1 ? -0.4 : 0.8) : 0.7), pg.w, pg.h, 6), fill: shade(th.paper, -0.06), stroke: th.paperLine, 'stroke-width': 1}));
  const gutter = v
    ? [h('rect', {x: r(m), y: r(m + pageH - 12), width: r(pw), height: 24, fill: '#000', opacity: 0.07}),
      h('line', {x1: r(m), x2: r(m + pw), y1: r(m + pageH), y2: r(m + pageH), stroke: th.ink, 'stroke-width': 1.5, opacity: 0.6})]
    : [h('rect', {x: r(w / 2 - 14), y: r(m), width: 28, height: r(pageH), fill: '#000', opacity: 0.07}),
      h('line', {x1: r(w / 2), x2: r(w / 2), y1: r(m), y2: r(m + pageH), stroke: th.ink, 'stroke-width': 1.5, opacity: 0.6})];
  const node = g(null,
    h('path', {d: roundRectPath(8, 11, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(5, 5, w - 10, hh - 10, 9), fill: 'none', stroke: shade(o.color, 0.3), 'stroke-width': 2, opacity: 0.5}),
    stacks(p1), stacks(p2),
    h('path', {d: roundRectPath(p1.x, p1.y, p1.w, p1.h, 6), fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(p2.x, p2.y, p2.w, p2.h, 6), fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}),
    gutter,
    // first page: id tab + title
    h('path', {d: roundRectPath(p1.x + pad, p1.y + pad, tabW, tabH, 6), fill: o.color, stroke: th.ink, 'stroke-width': 1.5}),
    ctx.show('key') ? textBlock(idFit, {x: p1.x + pad + tabW / 2, y: p1.y + pad + 5, anchor: 'middle', fill: '#fff'}) : null,
    textOrBars(ctx, tFit, show, {x: p1.x + pad, y: p1.y + pad + tabH + F * 0.35, fill: th.ink}),
    // second page: simulated wording with the passage band
    rows,
    h('path', {name: `${P}-band`, d: roundRectPath(band.x, band.y, band.w, band.h, 6), fill: th.highlight, opacity: 0.6, stroke: shade(th.highlight, -0.45), 'stroke-width': 2, 'stroke-dasharray': '6 5'}),
  );
  return {node, w, h: hh, band, titleFit: tFit, idFit, page1: p1, page2: p2};
}

/**
 * Bookmark ribbon from the book's passage band to the slip (provenance
 * cue): a cloth strip along a cubic curve with a notched end.
 * @param {any} ctx
 * @param {{from:{x:number,y:number}, to:{x:number,y:number}, color:string, width?:number, c1?:any, c2?:any, name?:string}} o
 */
export function ribbonArt(ctx, o) {
  const th = ctx.theme;
  const wd = o.width ?? 9;
  const {from, to} = o;
  const c1 = o.c1 ?? {x: from.x, y: from.y + (to.y - from.y) * 0.6};
  const c2 = o.c2 ?? {x: to.x, y: to.y - (to.y - from.y) * 0.4};
  const d = `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`;
  return g({name: o.name},
    h('path', {d, fill: 'none', stroke: th.shadow, 'stroke-width': wd + 4, transform: 'translate(4 5)', 'stroke-linecap': 'round'}),
    h('path', {d, fill: 'none', stroke: th.ink, 'stroke-width': wd + 3, 'stroke-linecap': 'butt'}),
    h('path', {d, fill: 'none', stroke: o.color, 'stroke-width': wd, 'stroke-linecap': 'butt'}),
    h('path', {d, fill: 'none', stroke: '#fff', 'stroke-width': 1.2, 'stroke-dasharray': '3 6', opacity: 0.6}),
    h('circle', {cx: r(from.x), cy: r(from.y), r: r(wd * 0.75), fill: o.color, stroke: th.ink, 'stroke-width': 1.5}),
  );
}

/**
 * Editable hierarchy board: a wooden board whose rows carry the AUTHOR's
 * row labels; each source token sits on its supplied row. Header (built-in)
 * and caption (supplied). Local origin = top-left.
 * Named: `${P}-tok${i}` (token groups, for glows).
 * @param {any} ctx
 * @param {{prefix:string, w:number, F:number, p:any, t:any, stack?:boolean}} o
 */
export function hierarchyBoard(ctx, o) {
  const th = ctx.theme;
  const C = icColors(ctx);
  const P = o.prefix, F = o.F, w = o.w, p = o.p;
  const pad = F * 0.55;
  const key = ctx.show('key'), all = ctx.show('all');
  const head = fitWords(ctx, o.t.hierarchy, {maxWidth: w - pad * 2 - F * 1.2, size: o.headSize ?? F * 0.88, minSize: (o.headSize ?? F * 0.88) * 0.98, maxLines: 4, weight: 800});
  const tokFits = p.sources.map(s => fitWords(ctx, s.id, {maxWidth: w * 0.4, size: F, minSize: F * 0.8, maxLines: 1, weight: 800}));
  const tokW = tokFits.map(f => f.width + F * 0.8), tokH = F * 1.45;
  const levels = p.hierarchy.levels;
  const rowsOf = levels.map((_, li) => p.sources.map((_, i) => i).filter(i => levelOf(p, i) === li));
  const parts = [];
  let y = pad;
  parts.push(g({transform: T(pad, y + head.height / 2 - F * 0.45)},
    // pencil glyph: the board is editable
    h('path', {d: `M0 ${r(F * 0.8)}L${r(F * 0.16)} ${r(F * 0.36)}L${r(F * 0.62)} ${r(-F * 0.1)}L${r(F * 0.86)} ${r(F * 0.14)}L${r(F * 0.4)} ${r(F * 0.6)}Z`, fill: '#f1c86b', stroke: th.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round'})));
  parts.push(textOrBars(ctx, head, all, {x: pad + F * 1.2, y, fill: '#fff8ea'}));
  y += head.height + pad * 0.8;
  const tokens = [];
  const rowBoxes = [];
  const labFits = [];
  const drawToken = (i, b) => {
    const col = sourceColor(ctx, p, i);
    tokens[i] = b;
    parts.push(g({name: `${P}-tok${i}`},
      h('path', {d: roundRectPath(b.x + 3, b.y + 4, b.w, b.h, tokH * 0.3), fill: th.shadow}),
      h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, tokH * 0.3), fill: col, stroke: th.ink, 'stroke-width': 1.8}),
      key ? textBlock(tokFits[i], {x: b.x + b.w / 2, y: b.y + (tokH - tokFits[i].height) / 2, anchor: 'middle', fill: '#fff'}) : h('rect', {...barMark(ctx), x: r(b.x + b.w * 0.25), y: r(b.y + tokH * 0.42), width: r(b.w * 0.5), height: r(tokH * 0.16), rx: 2, fill: '#fff', opacity: 0.7})));
  };
  let broken = false;
  if (o.columns) {
    // levels side by side (first → last, left → right): a compact board for wide, low slots
    const n = levels.length;
    const gapC = pad * 0.4;
    const cw = (w - pad * 1.2 - gapC * (n - 1)) / n;
    const cells = levels.map((lab, li) => {
      const lf = fitWords(ctx, lab, {maxWidth: cw - pad * 1.2, size: F, minSize: F, maxLines: 5, weight: 600});
      if (lf.truncated || breaksWord(ctx, lf, cw - pad * 1.2)) broken = true;
      // tokens flow in rows inside the cell
      const rows = [[]];
      let rx = 0;
      rowsOf[li].forEach(i => {
        if (rows[rows.length - 1].length && rx + tokW[i] > cw - pad * 1.2) { rows.push([]); rx = 0; }
        rows[rows.length - 1].push(i);
        rx += tokW[i] + F * 0.3;
      });
      const tokRows = rowsOf[li].length ? rows.length : 0;
      return {lf, rows, hh: pad * 0.55 + lf.height + (tokRows ? F * 0.35 + tokRows * tokH + (tokRows - 1) * F * 0.25 : 0) + pad * 0.55};
    });
    const cellH = Math.max(...cells.map(c => c.hh));
    cells.forEach((c, li) => {
      labFits.push(c.lf);
      const rb = {x: pad * 0.6 + li * (cw + gapC), y, w: cw, h: cellH};
      rowBoxes.push(rb);
      parts.push(h('path', {d: roundRectPath(rb.x, rb.y, rb.w, rb.h, 7), fill: '#f6efdf', stroke: C.groove, 'stroke-width': 1.8}));
      parts.push(textOrBars(ctx, c.lf, all, {x: rb.x + pad * 0.6, y: rb.y + pad * 0.55, fill: th.ink}));
      let ty = rb.y + pad * 0.55 + c.lf.height + F * 0.35;
      c.rows.forEach(rowIds => {
        let tx = rb.x + pad * 0.6;
        rowIds.forEach(i => { drawToken(i, {x: tx, y: ty, w: tokW[i], h: tokH}); tx += tokW[i] + F * 0.3; });
        ty += tokH + F * 0.25;
      });
    });
    y += cellH + pad * 0.45;
  }
  (o.columns ? [] : levels).forEach((lab, li) => {
    const ids = rowsOf[li];
    const tw = ids.reduce((a, i) => a + tokW[i] + F * 0.3, 0);
    const longest = Math.max(0, ...String(lab).split(/\s+/).map(wd => ctx.measure(wd, F, 600, 'sans')));
    const side = !o.stack && w - pad * 3 - tw >= w * 0.46 && longest <= w - pad * 3 - tw - F * 0.2;
    const labW = side ? w - pad * 3 - tw - F * 0.2 : w - pad * 3;
    const lf = fitWords(ctx, lab, {maxWidth: labW, size: F, minSize: F, maxLines: 4, weight: 600});
    labFits.push(lf);
    const inner = side ? Math.max(lf.height, tokH) : lf.height + (ids.length ? F * 0.35 + tokH : 0);
    const rowH = inner + pad * 1.1;
    const rb = {x: pad * 0.6, y, w: w - pad * 1.2, h: rowH};
    rowBoxes.push(rb);
    parts.push(h('path', {d: roundRectPath(rb.x, rb.y, rb.w, rb.h, 7), fill: '#f6efdf', stroke: C.groove, 'stroke-width': 1.8}));
    parts.push(textOrBars(ctx, lf, all, {x: rb.x + pad * 0.7, y: rb.y + (side ? (rowH - lf.height) / 2 : pad * 0.55), fill: th.ink}));
    let tx = side ? rb.x + rb.w - pad * 0.6 - tw + F * 0.3 : rb.x + pad * 0.7;
    const ty = side ? rb.y + (rowH - tokH) / 2 : rb.y + pad * 0.55 + lf.height + F * 0.35;
    ids.forEach(i => {
      const col = sourceColor(ctx, p, i);
      const b = {x: tx, y: ty, w: tokW[i], h: tokH};
      tokens[i] = b;
      parts.push(g({name: `${P}-tok${i}`},
        h('path', {d: roundRectPath(b.x + 3, b.y + 4, b.w, b.h, tokH * 0.3), fill: th.shadow}),
        h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, tokH * 0.3), fill: col, stroke: th.ink, 'stroke-width': 1.8}),
        key ? textBlock(tokFits[i], {x: b.x + b.w / 2, y: b.y + (tokH - tokFits[i].height) / 2, anchor: 'middle', fill: '#fff'}) : h('rect', {...barMark(ctx), x: r(b.x + b.w * 0.25), y: r(b.y + tokH * 0.42), width: r(b.w * 0.5), height: r(tokH * 0.16), rx: 2, fill: '#fff', opacity: 0.7})));
      tx += tokW[i] + F * 0.3;
    });
    y += rowH + pad * 0.45;
  });
  const cap = fitWords(ctx, p.hierarchy.caption, {maxWidth: w - pad * 2, size: F, minSize: F, maxLines: 4, weight: 500});
  y += pad * 0.2;
  parts.push(textOrBars(ctx, cap, all, {x: w / 2, y, anchor: 'middle', fill: '#fff8ea'}));
  y += cap.height + pad;
  const hh = y;
  const node = g(null,
    h('path', {d: roundRectPath(8, 11, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: C.board, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(4, 4, w - 8, hh - 8, 9), fill: 'none', stroke: shade(C.board, 0.25), 'stroke-width': 2, opacity: 0.6}),
    parts,
  );
  return {node, w, h: hh, tokens, rowBoxes, fits: [head, ...labFits, cap], minSupplied: Math.min(...labFits.map(f => f.size), cap.size), truncated: broken || [head, ...labFits, cap].some(f => f.truncated)};
}

/**
 * Hand magnifier. Local origin = lens centre; the handle points along
 * `angle` degrees. `grip` = the handle point a hand holds (local coords).
 */
export function magnifier(ctx, {R, angle = 45, handle = 1.5}) {
  const th = ctx.theme;
  const rim = Math.max(7, R * 0.16);
  const fer = R * 0.34;
  const hl = R * handle;
  const hw = R * 0.36;
  const gripD = R + rim * 0.3 + fer + hl * 0.45;
  const a = (angle * Math.PI) / 180;
  const node = g(null,
    g({transform: `rotate(${r(angle)})`},
      h('path', {d: roundRectPath(R, -hw / 2 + 6, fer + hl, hw, hw / 2), fill: th.shadow}),
      h('path', {d: roundRectPath(R + rim * 0.3, -hw * 0.44, fer + 6, hw * 0.88, 4), fill: th.metal, stroke: th.ink, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(R + rim * 0.3 + fer, -hw / 2, hl, hw, hw / 2), fill: '#6d4a32', stroke: th.ink, 'stroke-width': 2.2}),
      h('line', {x1: r(R + rim * 0.3 + fer + hw * 0.5), x2: r(R + rim * 0.3 + fer + hl - hw * 0.5), y1: r(-hw * 0.2), y2: r(-hw * 0.2), stroke: '#a57b58', 'stroke-width': r(hw * 0.16), 'stroke-linecap': 'round'})),
    h('circle', {cx: 8, cy: 10, r: r(R + rim * 0.5), fill: th.shadow}),
    h('circle', {r: r(R - rim * 0.4), fill: '#d7ecf8', opacity: 0.3}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.28)}A${r(R * 0.68)} ${r(R * 0.68)} 0 0 1 ${r(-R * 0.28)} ${r(-R * 0.62)}`, fill: 'none', stroke: '#fff', 'stroke-width': r(R * 0.08), 'stroke-linecap': 'round', opacity: 0.85}),
    h('circle', {r: r(R), fill: 'none', stroke: th.ink, 'stroke-width': r(rim + 4)}),
    h('circle', {r: r(R), fill: 'none', stroke: '#3f4a55', 'stroke-width': r(rim)}),
    h('circle', {r: r(R + rim * 0.18), fill: 'none', stroke: '#9aa6b0', 'stroke-width': r(rim * 0.28)}),
  );
  return {node, R, rim, grip: {x: Math.cos(a) * gripD, y: Math.sin(a) * gripD}, reachEnd: R + rim * 0.3 + fer + hl};
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

/**
 * Neutral key / state chip: fitted text in a rounded plate with a small
 * neutral glyph (outlined dot). Local coords are absolute (x,y = top-left).
 * @param {any} ctx
 * @param {{text:string, x:number, y:number, maxWidth:number, size:number, name?:string, color?:string, weight?:number, maxLines?:number, dash?:boolean, level?:'key'|'all'}} o
 */
export function notePlate(ctx, o) {
  const th = ctx.theme;
  const show = ctx.show(o.level ?? 'all');
  const pad = o.size * 0.6;
  const dot = o.size * 0.32;
  const f = fitWords(ctx, o.text, {maxWidth: o.maxWidth - pad * 2 - dot * 3, size: o.size, minSize: o.size * 0.95, maxLines: o.maxLines ?? 3, weight: o.weight ?? 600});
  const w = f.width + pad * 2 + dot * 3;
  const hh = f.height + pad * 1.3;
  const col = o.color ?? th.inkSoft;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(o.x + 5, o.y + 7, w, hh, Math.min(hh / 2, 16)), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, w, hh, Math.min(hh / 2, 16)), fill: th.card, stroke: col, 'stroke-width': 2, 'stroke-dasharray': o.dash ? '7 5' : undefined}),
    h('circle', {cx: r(o.x + pad + dot), cy: r(o.y + hh / 2), r: r(dot), fill: 'none', stroke: col, 'stroke-width': 2.5}),
    textOrBars(ctx, f, show, {x: o.x + pad + dot * 3, y: o.y + (hh - f.height) / 2, fill: th.ink}),
  );
  return {node, box: {x: o.x, y: o.y, w, h: hh}, fit: f};
}

/** Width/height a notePlate would take (without building it). */
export function measureNote(ctx, text, {maxWidth, size, weight = 600, maxLines = 3}) {
  const pad = size * 0.6, dot = size * 0.32;
  const f = fitWords(ctx, text, {maxWidth: maxWidth - pad * 2 - dot * 3, size, minSize: size * 0.95, maxLines, weight});
  return {w: f.width + pad * 2 + dot * 3, h: f.height + pad * 1.3, fit: f};
}
