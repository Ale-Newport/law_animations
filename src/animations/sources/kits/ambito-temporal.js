/**
 * Timeline-desk kit for the "Ámbito temporal" motif (LAW-0133..0136).
 *
 * Top-down reading desk (original vector art):
 *   editable hierarchy stand (a row of labelled compartments, one per
 *   user-supplied level) holding the source books · the open source book with
 *   the ARTICLE card lying on its right page · a long wooden TIMELINE RULER
 *   graduated in fictional relative units · FACT cards laid out around the
 *   ruler, each tied by a thread to a push-pin at its supplied day · the
 *   article card carries a spring TAPE: once the card is set against the
 *   ruler at the interval start, the tape is pulled along the ruler to the
 *   interval end, so the norm literally lies over the supplied interval.
 *
 * Content rules encoded here:
 *  - every text is a fictional placeholder; jurisdiction unspecified;
 *  - the hierarchy is only the order the author supplies (neutral labels);
 *    it never implies which source prevails;
 *  - the interval is SUPPLIED; the scene only compares positions on the
 *    ruler: strictly between the supplied ends = "inside the supplied
 *    interval", beyond them = "outside"; a fact ON a boundary day, or one the
 *    author marks "not-classified", stays "not classified" (the scene does
 *    not decide whether a boundary day counts);
 *  - readings are attributed to their fictional source, never endorsed.
 *
 * The kit owns geometry, art and pose solvers only; each entry owns its own
 * timeline, layout of editorial labels and semantics.
 * @module animations/sources/kits/ambito-temporal
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, roundRectPath, cubic, ik2} from '../../../core/geometry.js';
import {topArm} from '../../../primitives/desk.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, int, list, obj, oneOf, party} from '../../../schemas/fields.js';

export const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------------ */
/* Fields (the sources category has no shared field set yet)                */
/* ------------------------------------------------------------------------ */

export const FACT_ICONS = ['envelope', 'parcel', 'key', 'invoice', 'meeting'];

/** Category fields for "sources", specialised for the temporal-scope motif. */
export const scopeFields = {
  sources: list('Source books standing on the editable hierarchy stand (fictional titles)', obj('Source book', {
    label: str('Title printed on the book (fictional)', 60),
    level: int('Index of the user-supplied hierarchy level the book sits on (0 = first listed level)', 0, 2),
  }, ['label']), 1, 3),
  hierarchy: list('Labels of the editable hierarchy levels in the order the author supplies them. Neutral placeholders by default: no ordering rule between sources is implied.', str('Level label', 50), 1, 3),
  passages: list('Passages; the first is the article placed over the interval (simulated wording, fictional)', obj('Passage', {
    ref: str('Reference printed on the article card, e.g. "Art. 4 (fictional)"', 60),
    text: str('Simulated clause wording shown on the card', 90),
    source: int('Index of the source book that contains the passage', 0, 2),
  }, ['ref']), 1, 2),
  interpretations: list('Readings attributed to their fictional source; shown as attributed notes, never endorsed', obj('Reading', {
    by: str('Who proposes the reading (fictional)', 50),
    text: str('The reading as proposed (fictional wording)', 90),
  }, ['by', 'text']), 0, 2),
  timeline: obj('Relative time scale printed on the ruler (fictional units; no real dates)', {
    unit: str('Unit word printed before numbers, e.g. "Day"', 16),
    from: int('First unit on the ruler', -99, 999),
    to: int('Last unit on the ruler (greater than "from"; at most 120 units are drawn)', -98, 1000),
    step: int('A number is printed every `step` units (raised automatically when numbers would crowd)', 1, 20),
  }, ['unit', 'from', 'to']),
  interval: obj('Interval supplied by the author for the article (fictional relative units). The scene never computes or corrects it.', {
    start: int('Supplied first unit of the interval', -99, 1000),
    end: int('Supplied last unit of the interval', -99, 1000),
  }, ['start', 'end']),
  facts: list('Facts laid around the timeline (fictional). The pin position comes from the supplied day; a fact on a boundary day stays not classified.', obj('Fact', {
    label: str('Short description (fictional)', 60),
    day: int('Supplied day (same unit as the ruler)', -99, 1000),
    icon: oneOf('Icon printed on the fact card', FACT_ICONS),
    state: oneOf('"auto": inside / outside of the supplied interval by position; "not-classified": the author leaves the fact unclassified', ['auto', 'not-classified']),
  }, ['label', 'day']), 1, 5),
};

/** Two readers (story / contrast desks). */
export const readersField = {
  readers: list('Reader A (takes the article from the book) and reader B (lays it on the timeline); fictional', party, 2, 2),
};

/** Default category values (English, fictional, illustrative). */
export const SCOPE_DEFAULTS = {
  sources: [
    {label: 'Text 1 (fictional)', level: 0},
    {label: 'Text 2 (fictional)', level: 1},
    {label: 'Text 3 (fictional)', level: 2},
  ],
  hierarchy: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)', 'Level 3 (user-supplied)'],
  passages: [{ref: 'Art. 4 (fictional)', text: 'Simulated clause wording for the supplied interval.', source: 0}],
  interpretations: [{by: 'Commentary C (fictional)', text: 'Proposes a reading of the interval wording.'}],
  timeline: {unit: 'Day', from: 0, to: 20, step: 2},
  interval: {start: 5, end: 13},
  facts: [
    {label: 'Notice sent', day: 3, icon: 'envelope', state: 'auto'},
    {label: 'Goods delivered', day: 8, icon: 'parcel', state: 'auto'},
    {label: 'Keys handed over', day: 11, icon: 'key', state: 'auto'},
    {label: 'Invoice issued', day: 16, icon: 'invoice', state: 'auto'},
  ],
};

/** Spanish counterparts for presets. */
export const SCOPE_DEFAULTS_ES = {
  sources: [
    {label: 'Texto 1 (ficticio)', level: 0},
    {label: 'Texto 2 (ficticio)', level: 1},
    {label: 'Texto 3 (ficticio)', level: 2},
  ],
  hierarchy: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)', 'Nivel 3 (aportado)'],
  passages: [{ref: 'Art. 4 (ficticio)', text: 'Redacción simulada para el intervalo aportado.', source: 0}],
  interpretations: [{by: 'Comentario C (ficticio)', text: 'Propone una lectura de la redacción del intervalo.'}],
  timeline: {unit: 'Día', from: 0, to: 20, step: 2},
  interval: {start: 5, end: 13},
  facts: [
    {label: 'Aviso enviado', day: 3, icon: 'envelope', state: 'auto'},
    {label: 'Mercancía entregada', day: 8, icon: 'parcel', state: 'auto'},
    {label: 'Llaves entregadas', day: 11, icon: 'key', state: 'auto'},
    {label: 'Factura emitida', day: 16, icon: 'invoice', state: 'auto'},
  ],
};

/** Built-in strings (user content is never translated). */
export const SCOPE_STRINGS = {
  en: {
    inside: 'Inside',
    outside: 'Outside',
    unclassified: 'Not classified',
    insideLong: 'inside the supplied interval',
    outsideLong: 'outside the supplied interval',
    unclassifiedLong: 'not classified',
    suppliedInterval: 'Supplied interval',
    readingProposed: 'Reading proposed',
    by: 'by',
    stateMarked: 'Facts shown inside / outside the supplied interval',
    statePlaced: 'Interval placed · facts not classified',
    stateLifted: 'Article taken · not yet placed',
    timeline: 'Timeline',
    level: 'Level',
    boundary: 'on a boundary',
  },
  es: {
    inside: 'Dentro',
    outside: 'Fuera',
    unclassified: 'Sin clasificar',
    insideLong: 'dentro del intervalo aportado',
    outsideLong: 'fuera del intervalo aportado',
    unclassifiedLong: 'sin clasificar',
    suppliedInterval: 'Intervalo aportado',
    readingProposed: 'Lectura propuesta',
    by: 'por',
    stateMarked: 'Hechos dentro / fuera del intervalo aportado',
    statePlaced: 'Intervalo colocado · hechos sin clasificar',
    stateLifted: 'Artículo tomado · aún sin colocar',
    timeline: 'Línea de tiempo',
    level: 'Nivel',
    boundary: 'en un límite',
  },
};

/**
 * Position-only state of a fact against the supplied interval. A boundary
 * day, or a fact the author marks "not-classified", is left unclassified.
 * @returns {'inside'|'outside'|'unclassified'}
 */
export function factState(day, forced, start, end) {
  if (forced === 'not-classified') return 'unclassified';
  if (day === start || day === end) return 'unclassified';
  return day > start && day < end ? 'inside' : 'outside';
}

/**
 * Normalised scope data: ruler range, sorted/clamped interval, facts with
 * their position-only state. Nothing is inferred beyond the supplied numbers.
 * @param {any} p validated params
 */
export function scopeData(p) {
  let from = p.timeline.from;
  let to = p.timeline.to;
  if (to <= from) to = from + 1;
  if (to - from > 120) to = from + 120;
  const cl = d => Math.max(from, Math.min(to, d));
  const a = cl(p.interval.start), b = cl(p.interval.end);
  const start = Math.min(a, b), end = Math.max(a, b);
  const facts = p.facts.map((f, i) => ({
    i,
    label: f.label,
    day: cl(f.day),
    icon: f.icon || FACT_ICONS[i % FACT_ICONS.length],
    forced: f.state === 'not-classified',
    state: factState(cl(f.day), f.state, start, end),
    boundary: cl(f.day) === start || cl(f.day) === end,
  }));
  const article = p.passages[0];
  const sourceIndex = Math.max(0, Math.min(p.sources.length - 1, article.source ?? 0));
  const nLevels = p.hierarchy.length;
  const levelOf = s => Math.max(0, Math.min(nLevels - 1, s.level ?? 0));
  return {
    from, to, start, end,
    step: Math.max(1, p.timeline.step ?? 1),
    unit: p.timeline.unit,
    facts,
    article,
    sourceIndex,
    sources: p.sources.map((s, i) => ({label: s.label, level: levelOf(s), i})),
    levels: p.hierarchy,
    readings: p.interpretations || [],
    dayText: d => (p.timeline.unit ? `${p.timeline.unit} ${d}` : `${d}`),
  };
}


/* ------------------------------------------------------------------------ */
/* Text fitting that never breaks inside a word or a date                   */
/* ------------------------------------------------------------------------ */

/**
 * Like ctx.fit, but first shrinks (down to minSize) until the longest word
 * fits the width, so words are not broken character by character.
 */
export function fitWords(ctx, text, o) {
  const weight = o.weight ?? 400;
  const family = o.family ?? 'sans';
  const min = o.minSize ?? o.size * 0.72;
  // a word is never split: below minSize we keep shrinking (down to an absolute floor) until the longest word fits
  const floor = Math.min(min, o.floorSize ?? 14);
  let size = o.size;
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  while (size > floor && words.some(w => ctx.measure(w, size, weight, family) > o.maxWidth)) size = Math.max(floor, size - 0.5);
  return ctx.fit(text, {...o, size, minSize: Math.min(size, min)});
}

/**
 * Fit a sequence of unbreakable phrases (e.g. ["Day 5 –", "Day 13"]): one
 * line when it fits (shrinking down to minSize), otherwise lines break only
 * between phrases. Returns a FitResult-compatible object.
 */
export function fitPhrases(ctx, phrases, o) {
  const weight = o.weight ?? 400;
  const family = o.family ?? 'sans';
  const min = o.minSize ?? o.size * 0.72;
  const leading = o.leading ?? 1.18;
  const full = phrases.join(' ');
  const W = s2 => ctx.measure(full, s2, weight, family);
  let size = o.size;
  while (size > min && W(size) > o.maxWidth) size = Math.max(min, size - 0.5);
  let lines;
  if (W(size) <= o.maxWidth) lines = [full];
  else {
    size = o.size;
    while (size > min && phrases.some(ph => ctx.measure(ph, size, weight, family) > o.maxWidth)) size = Math.max(min, size - 0.5);
    lines = [];
    let cur = '';
    for (const ph of phrases) {
      const cand = cur ? `${cur} ${ph}` : ph;
      if (!cur || ctx.measure(cand, size, weight, family) <= o.maxWidth) cur = cand;
      else { lines.push(cur); cur = ph; }
    }
    if (cur) lines.push(cur);
  }
  const width = Math.max(...lines.map(l => ctx.measure(l, size, weight, family)));
  return {lines, size, lineHeight: size * leading, width, height: size * leading * (lines.length - 1) + size, truncated: false, full, weight, family};
}

/**
 * Prefer a single line (shrinking down to `oneLineMin` × size), otherwise
 * wrap by words (never inside a word).
 */
export function fitPreferOne(ctx, text, o) {
  const one = ctx.fit(text, {...o, maxLines: 1, minSize: o.size * (o.oneLineMin ?? 0.86)});
  if (!one.truncated) return one;
  return fitWords(ctx, text, o);
}

/**
 * Fit text inside a width × height box: the largest size (from `size` down to `minSize`) whose wrapped
 * lines (never broken inside a word) fit the height without truncation; at `minSize` it takes as many
 * lines as the height allows.
 */
export function fitInBox(ctx, text, o) {
  const leading = 1.18;
  let last = null;
  for (let size = o.size; size >= o.minSize - 0.01; size -= 0.5) {
    const lines = Math.max(1, Math.floor((o.maxHeight - size) / (size * leading)) + 1);
    const f = fitWords(ctx, text, {...o, size, minSize: size, floorSize: Math.min(size, o.floorSize ?? size), maxLines: lines});
    last = f;
    if (!f.truncated && f.height <= o.maxHeight + 0.5) return f;
  }
  return last;
}

/** Interval phrases: ["Day 5 –", "Day 13"]. */
export const intervalPhrases = (d, a, b) => [`${d.dayText(a)} –`, d.dayText(b)];

/**
 * Text sizes for a view whose on-screen scale is known (`pxu` = frame pixels per design unit at the
 * scene's reference resolution): key content (facts, days, states, plates, titles, reference, interval,
 * names) is raised to ≥ ~19.3 px and every other supplied text is floored at ≥ ~16.2 px. Without `pxu`
 * the sizes are returned unchanged.
 */
export function scaledText(txt, pxu) {
  if (!pxu) return {...txt};
  const key = 19.3 / pxu, body = 16.2 / pxu;
  const T0 = {...txt};
  for (const k of ['fact', 'day', 'strip', 'plate', 'book', 'ref', 'iv', 'chip']) if (T0[k] !== undefined) T0[k] = Math.max(T0[k], key);
  for (const k of ['pass', 'ivLab', 'num']) if (T0[k] !== undefined) T0[k] = Math.max(T0[k], body);
  T0.factMin = Math.max(T0.factMin ?? 0, body);
  T0.min = body;
  return T0;
}

/** Record the size of each drawn content fit in `sink` (content text sizes, for the text hierarchy). */
export function sinkSizes(sink, ...fits) {
  if (!sink) return;
  for (const f of fits) if (f && f.lines && f.lines.length) sink.push(f.size);
}

/* ------------------------------------------------------------------------ */
/* Colours                                                                  */
/* ------------------------------------------------------------------------ */

const BOOK_COLORS = ['#2f5d62', '#7a3b3b', '#4a5a7a', '#8c6d5a', '#3f6b4a', '#5b4a6e'];
export const RULER_WOOD = '#e2c48f';

/** State colours (no red/green verdict palette). */
export function stateColors(ctx) {
  const th = ctx.theme;
  return {
    tape: th.accent2,
    inside: th.accent2,
    insideSoft: th.accent2Soft,
    outside: th.inkFaint,
    unclassified: shade(th.accent3, -0.25),
    unclassifiedSoft: th.accent3Soft,
    neutral: th.metal,
  };
}

/* ------------------------------------------------------------------------ */
/* Art pieces                                                               */
/* ------------------------------------------------------------------------ */

/** Top-down open book. Local origin = top-left of the cover. */
export function openBook(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const color = o.color || BOOK_COLORS[0];
  const mid = w / 2;
  const pw = mid - 10;
  const lines = [];
  const lineRows = Math.max(3, Math.floor((hh - 40) / 16));
  // the title takes as many lines as the left page holds at the minimum size, so a long title (with its
  // "(fictional)" marker) wraps instead of being cut
  const titleFit = o.title && ctx.show('key') ? fitInBox(ctx, o.title, {maxWidth: pw - 22, maxHeight: hh - 12 - 12, size: o.titleSize ?? 22, minSize: o.titleMin ?? 17.5, floorSize: Math.min(16, o.titleMin ?? 16), weight: 700, family: 'serif'}) : null;
  sinkSizes(o.sink, titleFit);
  const titleH = titleFit ? titleFit.height + 12 : 26;
  // (o.titleRight: the title is printed on the right page and the left page carries the article card)
  const tR = Boolean(o.titleRight);
  for (let i = 0; i < lineRows; i++) {
    const yL = (tR ? 18 : 14 + titleH) + i * 16;
    if (yL < hh - 16) lines.push(h('rect', {x: 18, y: yL, width: r((pw - 30) * (0.7 + ctx.rng(`${o.seed || 'ob'}-l`, i) * 0.3)), height: 5, rx: 2.5, fill: th.paperLine}));
    const yR = (tR ? 14 + titleH : 18) + i * 16;
    if (yR < hh - 16) lines.push(h('rect', {x: mid + 12, y: yR, width: r((pw - 30) * (0.72 + ctx.rng(`${o.seed || 'ob'}-r`, i) * 0.28)), height: 5, rx: 2.5, fill: th.paperLine}));
  }
  const node = g({name: o.name, transform: o.x !== undefined ? T(o.x, o.y) : undefined},
    h('path', {d: roundRectPath(8, 11, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: color, stroke: th.ink, 'stroke-width': th.stroke}),
    // pages (slight curl towards the gutter)
    h('path', {d: `M8 10Q${r(mid * 0.5)} 4 ${r(mid - 3)} 12V${hh - 6}Q${r(mid * 0.5)} ${hh - 12} 8 ${hh - 8}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${w - 8} 10Q${r(mid * 1.5)} 4 ${r(mid + 3)} 12V${hh - 6}Q${r(mid * 1.5)} ${hh - 12} ${w - 8} ${hh - 8}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: mid - 9, y: 12, width: 18, height: hh - 18, fill: th.paperShade, opacity: 0.9}),
    h('line', {x1: mid, y1: 12, x2: mid, y2: hh - 6, stroke: th.ink, 'stroke-width': 1.6, opacity: 0.6}),
    lines,
    titleFit ? textBlock(titleFit, {x: tR ? mid + 12 : 18, y: 12, fill: th.ink}) : h('rect', {x: tR ? mid + 12 : 18, y: 14, width: pw * 0.6, height: 9, rx: 4, fill: th.ink, opacity: 0.7}),
    o.slotName ? h('path', {name: o.slotName, d: roundRectPath(o.slot.x, o.slot.y, o.slot.w, o.slot.h, 6), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 6', opacity: 0}) : null,
  );
  return {node, w, h: hh, leftPage: {x: 8, y: 10, w: pw, h: hh - 18}, rightPage: {x: mid + 3, y: 10, w: pw, h: hh - 18}};
}

/** Top-down closed book with a title plate. Local origin = top-left. */
export function closedBook(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const color = o.color || BOOK_COLORS[1];
  const plate = {x: 24, y: hh * 0.2, w: w - 34, h: hh * 0.6};
  const tSize = o.titleSize ?? 21;
  const fit = o.title && ctx.show('key') ? fitInBox(ctx, o.title, {maxWidth: plate.w - 12, maxHeight: hh - 14 - 16, size: tSize, minSize: Math.max(17.5, o.titleMin ?? 0), floorSize: Math.max(16, o.titleMin ?? 0), weight: 700, family: 'serif'}) : null;
  sinkSizes(o.sink, fit);
  if (fit) plate.h = Math.max(plate.h, fit.height + 18);
  plate.y = (hh - plate.h) / 2;
  return g({transform: o.x !== undefined ? T(o.x, o.y, o.rot || 0) : undefined},
    h('path', {d: roundRectPath(7, 10, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: color, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: w - 9, y: 6, width: 6, height: hh - 12, fill: th.paper, stroke: th.ink, 'stroke-width': 1.2}),
    h('rect', {x: 0, y: 0, width: 18, height: hh, rx: 6, fill: shade(color, -0.25), stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 5), fill: '#f3ead6', stroke: th.ink, 'stroke-width': 1.6}),
    fit ? textBlock(fit, {x: plate.x + plate.w / 2, y: plate.y + (plate.h - fit.height) / 2, anchor: 'middle', fill: th.ink})
      : [h('rect', {x: plate.x + 12, y: plate.y + plate.h * 0.3, width: plate.w - 24, height: 7, rx: 3, fill: th.ink, opacity: 0.6}),
        h('rect', {x: plate.x + 12, y: plate.y + plate.h * 0.58, width: (plate.w - 24) * 0.6, height: 7, rx: 3, fill: th.ink, opacity: 0.4})],
  );
}

/**
 * Editable hierarchy stand seen from above: wooden compartments, one per
 * user-supplied level, each with a label plate on its front lip and i + 1
 * notches on its back wall (the level index stays readable without text).
 * Compartment boxes are laid out by the caller.
 * @param {any} ctx
 * @param {{prefix?:string, comps:Array<{x:number,y:number,w:number,h:number,label:string,level:number}>, plateSize?:number}} o
 */
export function hierarchyStand(ctx, o) {
  const th = ctx.theme;
  const showKey = ctx.show('key');
  const plateSize = o.plateSize ?? 22;
  const parts = [];
  // (level labels are supplied content: they wrap to up to 3 lines before shrinking, and shrink only a little)
  const fits = o.comps.map(c => (showKey ? fitInBox(ctx, c.label, {maxWidth: Math.min(c.w - 52, c.plateMax ?? 1e9), maxHeight: plateSize * 1.18 * 2 + plateSize, size: plateSize, minSize: Math.max(plateSize * 0.88, o.plateMin ?? 0), floorSize: o.plateMin, weight: 700}) : null));
  sinkSizes(o.sink, ...fits);
  const compParts = [];
  const boxes = o.comps.map((c, i) => {
    const {x: cx, y, w, h: hh} = c;
    const f = fits[i];
    const start = parts.length;
    const lipH = Math.max(44, f ? f.height + 22 : 0);
    const floor = {x: cx + 12, y: y + 12, w: w - 24, h: hh - lipH - 18};
    parts.push(
      h('path', {d: roundRectPath(cx + 8, y + 12, w, hh, 14), fill: th.shadow}),
      h('path', {d: roundRectPath(cx, y, w, hh, 14), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
      h('path', {d: roundRectPath(floor.x, floor.y, floor.w, floor.h + 8, 8), fill: shade(th.wood, -0.12), stroke: shade(th.woodDark, -0.3), 'stroke-width': 1.5}),
      h('path', {d: roundRectPath(cx + 4, y + hh - lipH, w - 8, lipH - 4, 10), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
    );
    for (let k = 0; k <= c.level; k++) parts.push(h('rect', {x: cx + w - 26 - k * 13, y: y + 2, width: 8, height: 9, rx: 2, fill: th.woodTop, stroke: th.ink, 'stroke-width': 1.4}));
    let plate = null;
    if (f) {
      plate = {x: cx + 14, y: y + hh - lipH + 7, w: f.width + 22, h: f.height + 10};
      parts.push(
        h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 5), fill: '#f6f0e1', stroke: th.ink, 'stroke-width': 1.6}),
        textBlock(f, {x: cx + 25, y: y + hh - lipH + 12, fill: th.ink, name: o.prefix ? `${o.prefix}-lv${c.level}` : undefined}),
      );
    }
    compParts[c.level] = parts.slice(start);
    return {box: {x: cx, y, w, h: hh}, floor, lip: {x: cx, y: y + hh - lipH, w, h: lipH}, plate};
  });
  return {node: g(null, parts), boxes, compParts};
}

/**
 * Compartment boxes for the levels. `rows` lists level indices per row; the
 * source compartment gets `openW`, the others share the rest of their row.
 */
export function standLayout(org, nLevels, srcLevel) {
  const rows = org.split && nLevels > 1 ? [[0], Array.from({length: nLevels - 1}, (_, i) => i + 1)] : [Array.from({length: nLevels}, (_, i) => i)];
  const comps = [];
  let y = org.y;
  rows.forEach((row, ri) => {
    const rowW = (org.rowW && org.rowW[ri]) ?? org.w;
    const hasSrc = row.includes(srcLevel);
    const rh = hasSrc ? org.h : (org.closedH ?? org.h);
    const nClosed = row.length - (hasSrc ? 1 : 0);
    const closedW = nClosed ? Math.min(org.closedMax ?? 1e9, (rowW - (hasSrc ? org.openW + org.gap : 0) - org.gap * (nClosed - 1)) / nClosed) : 0;
    let x = org.x;
    row.forEach(level => {
      const w = level === srcLevel ? org.openW : closedW;
      comps[level] = {x, y, w, h: rh, level};
      x += w + org.gap;
    });
    y += rh + org.gap;
  });
  const xs = comps.map(c => c.x + c.w), ys = comps.map(c => c.y + c.h);
  return {comps, box: {x: org.x, y: org.y, w: Math.max(...xs) - org.x, h: Math.max(...ys) - org.y}, rows};
}

/**
 * Article card with its tape housing. Local origin = top-left of the card.
 * The housing sits on the edge that meets the ruler: top edge (horizontal
 * ruler) at x = hx, or right edge (vertical ruler) at y = hx.
 */
export function articleCard(ctx, o) {
  const th = ctx.theme;
  const C = stateColors(ctx);
  const w = o.w;
  const pad = 14;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const refFit = showKey ? fitPreferOne(ctx, o.ref, {maxWidth: w - pad * 2 - 30, size: o.refSize ?? 25, minSize: Math.max(18, o.refMin ?? 0), maxLines: o.refLines ?? 2, weight: 800, oneLineMin: o.refOneLineMin}) : null;
  const headH = refFit ? refFit.height + 20 : 42;
  // the simulated clause wording wraps to as many lines as it needs (never cut with an ellipsis)
  const passFit = showAll && o.text ? fitWords(ctx, o.text, {maxWidth: w - pad * 2, size: o.textSize ?? 19, minSize: (o.textSize ?? 19) * 0.97, floorSize: 16, maxLines: o.passLines ?? 6, weight: 400, family: 'serif'}) : null;
  // (o.ivMinK: how far the interval may shrink before it breaks between its two phrases)
  const ivFit = showKey ? fitPhrases(ctx, o.intervalPhrases, {maxWidth: w - pad * 2 - 36, size: o.ivSize ?? 25, minSize: (o.ivSize ?? 25) * (o.ivMinK ?? 0.8), weight: 800}) : null;
  // (the interval caption may be supplied: it wraps to two lines rather than shrinking below ~16 px)
  const ivLabFit = showAll ? fitWords(ctx, o.intervalLabel, {maxWidth: w - pad * 2, size: o.ivLabSize ?? 17, minSize: Math.max((o.ivLabSize ?? 17) * 0.94, o.refMin ?? 0), floorSize: Math.max(15, o.refMin ?? 0), maxLines: 2, weight: 600}) : null;
  sinkSizes(o.sink, refFit, passFit, ivFit, ivLabFit);
  let y = headH + 10;
  const parts = [];
  const body = [];
  if (passFit) {
    body.push(textBlock(passFit, {x: pad, y, fill: th.inkSoft, italic: true}));
    y += passFit.height + 12;
  } else {
    for (let i = 0; i < 2; i++) body.push(h('rect', {x: pad, y: y + i * 13 + 2, width: (w - pad * 2) * (i ? 0.62 : 0.94), height: 6, rx: 3, fill: th.paperLine}));
    y += 32;
  }
  const ivTop = y;
  if (ivLabFit) {
    body.push(textBlock(ivLabFit, {x: pad, y, fill: th.inkSoft}));
    y += ivLabFit.height + Math.round(ivLabFit.size * 0.34) + 2;
  }
  const ivRowH = ivFit ? Math.max(ivFit.height, o.ivAfterPhrases && showKey ? fitPhrases(ctx, o.ivAfterPhrases, {maxWidth: w - pad * 2 - 36, size: ivFit.size, minSize: ivFit.size * (o.ivMinK ?? 0.8), weight: 800}).height : 0) : 24;
  // bracket glyph [ ] in the tape colour
  const gx = pad, gy = y + ivRowH / 2;
  body.push(h('path', {d: `M${gx + 8} ${gy - 12}H${gx}V${gy + 12}H${gx + 8}M${gx + 20} ${gy - 12}H${gx + 28}V${gy + 12}H${gx + 20}`, fill: 'none', stroke: C.tape, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  body.push(h('rect', {x: gx + 4, y: gy - 5, width: 20, height: 10, rx: 2, fill: C.tape, opacity: 0.35}));
  const ivAfterFit = showKey && o.ivAfterPhrases ? fitPhrases(ctx, o.ivAfterPhrases, {maxWidth: w - pad * 2 - 36, size: ivFit ? ivFit.size : (o.ivSize ?? 25), minSize: (o.ivSize ?? 25) * (o.ivMinK ?? 0.8), weight: 800}) : null;
  if (ivFit) {
    body.push(g({name: o.ivName ? `${o.ivName}-0` : undefined}, textBlock(ivFit, {x: pad + 36, y, fill: shade(C.tape, -0.1)})));
    if (ivAfterFit) body.push(g({name: `${o.ivName}-1`, opacity: 0}, textBlock(ivAfterFit, {x: pad + 36, y, fill: shade(C.tape, -0.1)})));
  } else body.push(h('rect', {x: pad + 36, y: gy - 6, width: (w - pad * 2 - 40) * 0.7, height: 12, rx: 5, fill: C.tape, opacity: 0.7}));
  y += ivRowH + pad;
  const hh = Math.max(o.minH ?? 150, y);
  const hx = o.hx;
  const vertical = o.edge === 'right';
  const bottom = o.edge === 'bottom';
  parts.push(
    h('path', {d: roundRectPath(0, 0, w, hh, 9), fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: `M9 0H${w - 9}Q${w} 0 ${w} 9V${headH}H0V9Q0 0 9 0Z`, fill: th.accent2Soft, stroke: th.ink, 'stroke-width': th.stroke}),
    // paper-clip icon in the header (the article is an extract)
    h('path', {d: `M${w - pad - 12} ${10}v${r(headH - 26)}a6 6 0 0 0 12 0v${r(-(headH - 30))}a3.5 3.5 0 0 0 -7 0v${r(headH - 32)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    refFit ? textBlock(refFit, {x: pad, y: 10, fill: th.ink}) : h('rect', {x: pad, y: 14, width: (w - pad * 2) * 0.55, height: 13, rx: 5, fill: th.ink, opacity: 0.75}),
    body,
    h('line', {x1: pad, x2: w - pad, y1: ivTop - 6, y2: ivTop - 6, stroke: th.paperLine, 'stroke-width': 1.5}),
  );
  // tape housing (metal clip)
  const housing = bottom
    ? g(null,
      h('path', {d: roundRectPath(hx - 18, hh - 12, 36, 22, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
      h('line', {x1: hx - 11, y1: hh + 4, x2: hx + 11, y2: hh + 4, stroke: th.ink, 'stroke-width': 2}))
    : vertical
    ? g(null,
      h('path', {d: roundRectPath(w - 12, hx - 18, 22, 36, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
      h('line', {x1: w + 4, y1: hx - 11, x2: w + 4, y2: hx + 11, stroke: th.ink, 'stroke-width': 2}))
    : g(null,
      h('path', {d: roundRectPath(hx - 18, -10, 36, 22, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
      h('line', {x1: hx - 11, y1: -4, x2: hx + 11, y2: -4, stroke: th.ink, 'stroke-width': 2}));
  parts.push(housing);
  return {parts, w, h: hh, headH, ivSize: ivFit ? ivFit.size : null};
}

/** Small vector icon for a fact, drawn around (0,0) inside radius ~R. */
export function factIcon(ctx, kind, R, color) {
  const th = ctx.theme;
  const s = R / 20;
  const st = {fill: 'none', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
  let art;
  switch (kind) {
    case 'parcel':
      art = [h('rect', {x: -11 * s, y: -9 * s, width: 22 * s, height: 18 * s, rx: 2, fill: '#d9b877', stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: `M${-11 * s} ${-3 * s}H${11 * s}M0 ${-9 * s}V${9 * s}`, ...st})];
      break;
    case 'key':
      art = [h('circle', {cx: -6 * s, cy: 0, r: 6 * s, fill: '#e0a458', stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: `M0 0H${12 * s}M${8 * s} 0V${5 * s}M${12 * s} 0V${6 * s}`, ...st, 'stroke-width': 2.6})];
      break;
    case 'invoice':
      art = [h('path', {d: `M${-8 * s} ${-11 * s}H${4 * s}L${9 * s} ${-6 * s}V${11 * s}H${-8 * s}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
        h('path', {d: `M${-4 * s} ${-3 * s}H${5 * s}M${-4 * s} ${2 * s}H${5 * s}M${-4 * s} ${7 * s}H${2 * s}`, ...st, 'stroke-width': 1.6})];
      break;
    case 'meeting':
      art = [h('circle', {cx: -6 * s, cy: -4 * s, r: 4.5 * s, fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
        h('circle', {cx: 6 * s, cy: -4 * s, r: 4.5 * s, fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: `M${-13 * s} ${9 * s}Q${-6 * s} ${-1 * s} ${1 * s} ${9 * s}M${-1 * s} ${9 * s}Q${6 * s} ${-1 * s} ${13 * s} ${9 * s}`, ...st})];
      break;
    case 'envelope':
    default:
      art = [h('rect', {x: -11 * s, y: -8 * s, width: 22 * s, height: 16 * s, rx: 2, fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: `M${-11 * s} ${-8 * s}L0 ${2 * s}L${11 * s} ${-8 * s}`, ...st})];
  }
  return g(null, h('circle', {r: R, fill: color || th.paperShade, stroke: th.ink, 'stroke-width': 2}), art);
}

/** Height of a compact card's status strip: it grows with its text (the text box never leaves the strip). */
export function compactStripH(stripSize) {
  return Math.max(26, Math.round((stripSize ?? 21) + 4));
}

/**
 * Measure a fact card's content (so a row of cards can share one height).
 * @returns {{labelFit:any, dayFit:any, h:number}}
 */
export function measureFact(ctx, fact, o) {
  const pad = o.compact ? 8 : 12;
  const lsz = o.labelSize ?? 23;
  const labelFit = ctx.show('key') ? fitWords(ctx, fact.label, {maxWidth: o.w - pad * 2, size: lsz, minSize: Math.min(lsz, Math.max(17, o.labelMin ?? 0)), floorSize: Math.min(lsz, Math.max(14, o.labelMin ?? 0)), maxLines: 3, weight: 600}) : null;
  const dayFit = ctx.show('key') ? ctx.fit(o.dayText, {maxWidth: o.w - pad * 2 - 56, size: o.daySize ?? 22, minSize: 16, maxLines: 1, weight: 800}) : null;
  const labelH = labelFit ? labelFit.height : 24;
  const dayAfterFit = ctx.show('key') && o.dayAfterText ? ctx.fit(o.dayAfterText, {maxWidth: o.w - pad * 2 - 56, size: o.daySize ?? 22, minSize: 16, maxLines: 1, weight: 800}) : null;
  if (o.compact) return {labelFit, dayFit, dayAfterFit, compact: true, h: 6 + 34 + 4 + labelH + 10 + compactStripH(o.stripSize) + 6};
  return {labelFit, dayFit, dayAfterFit, h: pad + 46 + 8 + labelH + 12 + 36 + 10};
}

/**
 * Fact card. Local origin = top-left. Contains four state strips (neutral /
 * inside / outside / not classified) switched by opacity.
 */
export function factCard(ctx, o) {
  const th = ctx.theme;
  const C = stateColors(ctx);
  const t = o.t;
  const {w} = o;
  const hh = o.h;
  const m = o.measure;
  const cmp = Boolean(m.compact);
  const pad = cmp ? 6 : 12;
  const P = o.prefix;
  const SH = cmp ? compactStripH(o.stripSize) : 36;
  const stripY = hh - SH - (cmp ? 6 : 10);
  const IR = cmp ? 15 : 22;
  const rowH = cmp ? 34 : 46;
  const stripW = w - pad * 2;
  const stripText = (text, color) => {
    if (!ctx.show('key')) return null;
    const f = ctx.fit(text, {maxWidth: stripW - 16, size: o.stripSize ?? 21, minSize: 15, maxLines: 1, weight: 800});
    return textBlock(f, {x: pad + stripW / 2, y: stripY + (SH - f.size) / 2 - 1, anchor: 'middle', fill: color});
  };
  const hatch = [];
  for (let k = 0; k < stripW / 14 + 3; k++) hatch.push(`M${r(pad + k * 14 - 20)} ${r(stripY + SH)}L${r(pad + k * 14 + 14)} ${r(stripY)}`);
  const clipId = `${P}-sclip`;
  const parts = [
    h('path', {d: roundRectPath(5, 8, w, hh, 10), fill: th.shadow}),
    h('path', {name: `${P}-paper`, d: roundRectPath(0, 0, w, hh, 10), fill: th.card, stroke: th.ink, 'stroke-width': th.stroke}),
    g({transform: T(pad + IR, pad + IR)}, factIcon(ctx, o.fact.icon, IR, o.iconFill)),
    // day chip (optionally hidden until the fact is placed; a blank chip stands in for it)
    o.dayName ? h('path', {name: `${o.dayName}-blank`, d: roundRectPath(w - pad - 64, pad + 2, 64, (m.dayFit ? m.dayFit.size : 20) + (cmp ? 10 : 16), 8), fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 1.6, 'stroke-dasharray': '5 4'}) : null,
    m.dayFit
      ? g({name: o.dayName || (o.swapName ? `${o.swapName}-0` : undefined), opacity: o.dayName ? 0 : undefined},
        h('path', {d: roundRectPath(w - pad - m.dayFit.width - 20, pad + 2, m.dayFit.width + 20, m.dayFit.size + (cmp ? 8 : 16), 8), fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.6}),
        textBlock(m.dayFit, {x: w - pad - 10 - m.dayFit.width / 2, y: pad + (cmp ? 6 : 10), anchor: 'middle', fill: th.ink}))
      : h('path', {name: o.dayName, opacity: o.dayName ? 0 : undefined, d: roundRectPath(w - pad - 70, pad + 8, 70, 26, 8), fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.6}),
    // a second day chip for a substituted day (inspect), swapped by opacity
    m.dayAfterFit && o.swapName
      ? g({name: o.swapName, opacity: 0},
        h('path', {d: roundRectPath(w - pad - m.dayAfterFit.width - 20, pad + 2, m.dayAfterFit.width + 20, m.dayAfterFit.size + (cmp ? 8 : 16), 8), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2}),
        textBlock(m.dayAfterFit, {x: w - pad - 10 - m.dayAfterFit.width / 2, y: pad + (cmp ? 6 : 10), anchor: 'middle', fill: th.ink}))
      : null,
    m.labelFit ? textBlock(m.labelFit, {x: pad + (cmp ? 4 : 0), y: pad + rowH + (cmp ? 4 : 8), fill: th.ink}) : [h('rect', {x: pad, y: pad + 56, width: stripW * 0.9, height: 8, rx: 4, fill: th.paperLine}), h('rect', {x: pad, y: pad + 72, width: stripW * 0.6, height: 8, rx: 4, fill: th.paperLine})],
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {x: pad, y: stripY, width: stripW, height: SH, rx: 7}))),
    // neutral strip (before classification)
    h('path', {name: `${P}-s0`, d: roundRectPath(pad, stripY, stripW, SH, 7), fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '6 5'}),
    g({name: `${P}-s1`, opacity: 0},
      h('path', {d: roundRectPath(pad, stripY, stripW, SH, 7), fill: C.inside, stroke: th.ink, 'stroke-width': 2}),
      stripText(t.inside, '#ffffff')),
    g({name: `${P}-s2`, opacity: 0},
      h('path', {d: roundRectPath(pad, stripY, stripW, SH, 7), fill: th.card, stroke: C.outside, 'stroke-width': 2.4, 'stroke-dasharray': '7 5'}),
      stripText(t.outside, th.inkSoft)),
    g({name: `${P}-s3`, opacity: 0},
      h('path', {d: roundRectPath(pad, stripY, stripW, SH, 7), fill: C.unclassifiedSoft, stroke: C.unclassified, 'stroke-width': 2.2}),
      g({'clip-path': ctx.ref(clipId)}, h('path', {d: hatch.join(''), stroke: C.unclassified, 'stroke-width': 2, opacity: 0.35})),
      stripText(t.unclassified, shade(C.unclassified, -0.25))),
  ];
  return {parts, w, h: hh};
}

/** Push-pin with state overlays. Local origin = pin centre. */
export function pushPin(ctx, P, R = 11) {
  const th = ctx.theme;
  const C = stateColors(ctx);
  return g({name: P},
    h('circle', {cx: 3, cy: 4, r: R, fill: th.shadow}),
    h('circle', {r: R, fill: C.neutral, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {name: `${P}-in`, r: R, fill: C.inside, stroke: th.ink, 'stroke-width': 2, opacity: 0}),
    h('circle', {name: `${P}-out`, r: R, fill: '#ffffff', stroke: th.inkSoft, 'stroke-width': 2.4, opacity: 0}),
    g({name: `${P}-unc`, opacity: 0},
      h('circle', {r: R, fill: C.unclassifiedSoft, stroke: C.unclassified, 'stroke-width': 2.4}),
      h('path', {d: `M0 ${-R}A${R} ${R} 0 0 1 0 ${R}Z`, fill: C.unclassified})),
    h('circle', {cx: -R * 0.3, cy: -R * 0.35, r: R * 0.28, fill: '#ffffff', opacity: 0.6}),
  );
}

/* ------------------------------------------------------------------------ */
/* Timeline ruler + tape                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Ruler geometry helper.
 * @param {{o:'h'|'v', a0:number, a1:number, c:number, thick:number, pad:number}} R
 * @param {{from:number,to:number}} d
 */
export function rulerGeometry(R, d) {
  const span = d.to - d.from;
  const usable = R.a1 - R.a0 - R.pad * 2;
  const along = day => R.a0 + R.pad + ((day - d.from) / span) * usable;
  const hor = R.o === 'h';
  const e0 = R.c - R.thick / 2; // facts-side edge (top for h; right is +: we keep e0 as "min" coordinate)
  const e1 = R.c + R.thick / 2;
  /** world point at a day and a cross offset (0 = centre line) */
  const at = (day, cross = 0) => (hor ? {x: along(day), y: R.c + cross} : {x: R.c + cross, y: along(day)});
  // facts side: up (−y) for horizontal rulers, right (+x) for vertical ones
  const factSign = hor ? -1 : 1;
  return {hor, along, at, e0, e1, factSign, perUnit: usable / span, box: hor ? {x: R.a0, y: e0, w: R.a1 - R.a0, h: R.thick} : {x: e0, y: R.a0, w: R.thick, h: R.a1 - R.a0}};
}

/**
 * Ruler spec whose start cap is long enough to print the supplied unit word (e.g. "Day") at a readable
 * size next to the first number: the unit is supplied content, so it is never squeezed below ~16 px.
 * @param {any} ctx @param {any} R ruler spec @param {any} d scope data @param {number} numSize
 */
export function unitRuler(ctx, R, d, numSize) {
  const size = Math.max(Math.round(numSize * 0.85), 20);
  if (!d.unit || !ctx.show('key')) return {...R, unitSize: size, numSize};
  const w = ctx.measure(d.unit, size, 700, 'sans');
  const pad = R.o === 'h' ? Math.max(R.pad, w + 30) : Math.max(R.pad, size + 30);
  return {...R, pad, unitSize: size, numSize};
}

/**
 * Path of a tape clip (a C-shaped bracket straddling the ruler at along-coordinate `a`) that leaves a gap
 * where the ruler prints its numbers, so a clip never covers a number. `s` = +1 opens towards +along.
 */
export function clipPath(geo, R, a, s, ext = 12) {
  const ns = R.numSize ?? 22;
  // (the gap also leaves room for the bar's round caps: half its stroke width)
  if (geo.hor) {
    const g0 = R.c - ns * 0.72 - 7, g1 = R.c + ns * 0.62 + 7;
    return `M${r(a + 8 * s)} ${r(geo.e0 - ext)}H${r(a)}V${r(g0)}M${r(a)} ${r(g1)}V${r(geo.e1 + ext)}H${r(a + 8 * s)}`;
  }
  const g0 = R.c - 3 - ns * 0.85 - 7, g1 = R.c - 3 + ns * 0.85 + 7;
  return `M${r(geo.e0 - ext)} ${r(a + 8 * s)}V${r(a)}H${r(g0)}M${r(g1)} ${r(a)}H${r(geo.e1 + ext)}V${r(a + 8 * s)}`;
}

/**
 * Draws the wooden ruler with ticks and numbers.
 */
export function rulerArt(ctx, o) {
  const th = ctx.theme;
  const {R, d, geo} = o;
  const hor = geo.hor;
  const b = geo.box;
  const parts = [
    h('path', {d: roundRectPath(b.x + 7, b.y + 10, b.w, b.h, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: RULER_WOOD, stroke: th.ink, 'stroke-width': th.stroke}),
  ];
  // wood grain
  for (let k = 0; k < 3; k++) {
    const off = (k + 1) * (R.thick / 4);
    parts.push(hor
      ? h('path', {d: `M${b.x + 14} ${r(b.y + off)}C${r(b.x + b.w * 0.3)} ${r(b.y + off - 4)} ${r(b.x + b.w * 0.6)} ${r(b.y + off + 4)} ${b.x + b.w - 14} ${r(b.y + off - 2)}`, fill: 'none', stroke: shade(RULER_WOOD, -0.1), 'stroke-width': 1.5, opacity: 0.6})
      : h('path', {d: `M${r(b.x + off)} ${b.y + 14}C${r(b.x + off - 4)} ${r(b.y + b.h * 0.3)} ${r(b.x + off + 4)} ${r(b.y + b.h * 0.6)} ${r(b.x + off - 2)} ${b.y + b.h - 14}`, fill: 'none', stroke: shade(RULER_WOOD, -0.1), 'stroke-width': 1.5, opacity: 0.6}));
  }
  // numbers every `step` units (raised when they would crowd)
  const minGap = o.minLabelGap ?? 46;
  let step = Math.max(1, d.step);
  while (geo.perUnit * step < minGap) step++;
  const showKey = ctx.show('key');
  const numSize = o.numSize ?? 22;
  const cardEdge = geo.e0; // ticks along the card-side edge (top / left); pins sit on the facts side
  for (let day = d.from; day <= d.to; day++) {
    const major = (day - d.from) % step === 0;
    const tl = major ? 20 : 10;
    const p = geo.along(day);
    parts.push(hor
      ? h('line', {x1: r(p), x2: r(p), y1: cardEdge, y2: cardEdge + tl, stroke: th.ink, 'stroke-width': major ? 2.4 : 1.6})
      : h('line', {y1: r(p), y2: r(p), x1: cardEdge, x2: cardEdge + tl, stroke: th.ink, 'stroke-width': major ? 2.4 : 1.6}));
    if (major && showKey) {
      const f = ctx.fit(String(day), {maxWidth: 80, size: numSize, minSize: 14, maxLines: 1, weight: 700});
      parts.push(hor
        ? textBlock(f, {x: r(p), y: R.c - f.size * 0.5 - 1, anchor: 'middle', fill: th.ink})
        : textBlock(f, {x: R.c - 3, y: r(p) - f.size * 0.42, anchor: 'middle', fill: th.ink}));
    }
  }
  // unit plate at the start end
  if (showKey && d.unit) {
    const us = R.unitSize ?? 17;
    const f = ctx.fit(d.unit, {maxWidth: hor ? R.pad - 16 : R.thick - 8, size: us, minSize: Math.min(us, 16), maxLines: 1, weight: 700});
    parts.push(hor
      ? textBlock(f, {x: R.a0 + (R.pad - 10) / 2 + 2, y: R.c - f.size * 0.5, anchor: 'middle', fill: shade(RULER_WOOD, -0.6)})
      : textBlock(f, {x: R.c - 3, y: R.a0 + 8, anchor: 'middle', fill: shade(RULER_WOOD, -0.6)}));
  }
  return g({name: o.name}, parts);
}

/**
 * Tape laid along the ruler from the start day to a (moving) end day, with a
 * start clip and a movable end clip. Frame fn takes the current end position
 * (along-axis coordinate) and a visibility value.
 */
export function tapeArt(ctx, o) {
  const th = ctx.theme;
  const C = stateColors(ctx);
  const {geo, R, P} = o;
  const hor = geo.hor;
  const inset = 5;
  const c0 = geo.e0 + inset, c1 = geo.e1 - inset;
  const clip = (name, kind) => {
    // a C-shaped clip straddling the ruler; kind 'start' opens to +along, 'end' to −along
    const s = kind === 'start' ? 1 : -1;
    // (drawn at along = 0 and moved by its transform; the bar is split around the printed numbers)
    const d = clipPath(geo, R, 0, s);
    return g({name, opacity: 0},
      h('path', {d, fill: 'none', stroke: th.ink, 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d, fill: 'none', stroke: C.tape, 'stroke-width': 6.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    );
  };
  const node = g({name: P},
    h('path', {name: `${P}-band`, fill: C.tape, opacity: 0.3}),
    h('path', {name: `${P}-edge`, fill: 'none', stroke: C.tape, 'stroke-width': 3.5}),
    clip(`${P}-s`, 'start'),
    clip(`${P}-e`, 'end'),
  );
  /**
   * @param {number} startA along-axis coordinate of the start clip
   * @param {number} endA along-axis coordinate of the tape end
   * @param {number} vis 0..1 visibility of the tape (0 = retracted/hidden)
   */
  const frame = (startA, endA, vis) => {
    const a0 = Math.min(startA, endA), a1 = Math.max(startA, endA);
    const len = a1 - a0;
    const out = {};
    const shown = vis > 0 && len > 0.5;
    if (hor) {
      out[`${P}-band`] = {d: `M${r(a0)} ${r(c0)}H${r(a1)}V${r(c1)}H${r(a0)}Z`, opacity: shown ? r(0.3 * vis, 3) : 0};
      out[`${P}-edge`] = {d: `M${r(a0)} ${r(c0)}H${r(a1)}M${r(a0)} ${r(c1)}H${r(a1)}`, opacity: shown ? r(vis, 3) : 0};
      out[`${P}-s`] = {transform: T(startA, 0), opacity: r(vis, 3)};
      out[`${P}-e`] = {transform: T(endA, 0), opacity: shown ? r(vis, 3) : 0};
    } else {
      out[`${P}-band`] = {d: `M${r(c0)} ${r(a0)}V${r(a1)}H${r(c1)}V${r(a0)}Z`, opacity: shown ? r(0.3 * vis, 3) : 0};
      out[`${P}-edge`] = {d: `M${r(c0)} ${r(a0)}V${r(a1)}M${r(c1)} ${r(a0)}V${r(a1)}`, opacity: shown ? r(vis, 3) : 0};
      out[`${P}-s`] = {transform: T(0, startA), opacity: r(vis, 3)};
      out[`${P}-e`] = {transform: T(0, endA), opacity: shown ? r(vis, 3) : 0};
    }
    return out;
  };
  return {node, frame};
}

/* ------------------------------------------------------------------------ */
/* Layout helpers                                                           */
/* ------------------------------------------------------------------------ */

/**
 * 1-D non-overlapping placement: items with desired centre `c` and size `s`
 * are pushed apart (min gap) and kept within [lo, hi].
 * @param {Array<{c:number,s:number}>} items (any order; result keeps order)
 */
export function relax1d(items, gap, lo, hi) {
  const order = items.map((it, i) => ({...it, i})).sort((a, b) => a.c - b.c || a.i - b.i);
  const pos = order.map(it => it.c);
  for (let iter = 0; iter < 4; iter++) {
    for (let k = 0; k < order.length; k++) {
      const min = k === 0 ? lo + order[k].s / 2 : pos[k - 1] + order[k - 1].s / 2 + gap + order[k].s / 2;
      if (pos[k] < min) pos[k] = min;
    }
    for (let k = order.length - 1; k >= 0; k--) {
      const max = k === order.length - 1 ? hi - order[k].s / 2 : pos[k + 1] - order[k + 1].s / 2 - gap - order[k].s / 2;
      if (pos[k] > max) pos[k] = max;
    }
  }
  const out = new Array(items.length);
  order.forEach((it, k) => { out[it.i] = pos[k]; });
  return out;
}

/** Box overlap test. */
export function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Union of boxes. */
export function unionBox(list) {
  const xs = list.flatMap(b => [b.x, b.x + b.w]);
  const ys = list.flatMap(b => [b.y, b.y + b.h]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

/** Actor chip with a sleeve swatch (so a chip names the arm it belongs to). */
export function actorChip(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size ?? 24;
  // one line when it fits (shrinking to 0.8×), else two lines sized to the band height
  let f = ctx.fit(text, {maxWidth: o.maxWidth - 60, size, minSize: size * 0.8, maxLines: 1, weight: 700});
  if (f.truncated) {
    const s2 = o.maxH ? Math.min(size, (o.maxH - 16) / 2.18) : size;
    // break between the role and the name ("Reader A ·" / "Rin Park") when both halves fit a line
    const halves = String(text).split(' · ');
    const ph = halves.length === 2 ? fitPhrases(ctx, [`${halves[0]} ·`, halves[1]], {maxWidth: o.maxWidth - 60, size: s2, minSize: Math.min(s2, size * 0.8), weight: 700}) : null;
    const ml = o.maxLines ?? 2;
    f = ph && ph.lines.length <= ml && ph.width <= o.maxWidth - 60 + 0.5 ? ph
      : fitWords(ctx, text, {maxWidth: o.maxWidth - 60, size: s2, minSize: Math.min(s2, size * 0.72), maxLines: ml, weight: 700});
  }
  const w = f.width + 64;
  const hh = f.height + 16;
  const x = o.anchor === 'end' ? o.x - w : o.anchor === 'middle' ? o.x - w / 2 : o.x;
  const fitSize = f.size;
  const y = o.y;
  return {
    node: g({name: o.name},
      h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, 20)), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: x + 24, cy: y + hh / 2, r: 12, fill: o.swatch, stroke: th.ink, 'stroke-width': 2}),
      textBlock(f, {x: x + 44, y: y + 8, fill: th.ink})),
    box: {x, y, w, h: hh},
    truncated: Boolean(f.truncated),
    size: fitSize,
  };
}

/* ------------------------------------------------------------------------ */
/* The story desk                                                           */
/* ------------------------------------------------------------------------ */

/** Canonical stage sizes (design units) by axis. */
export const DESK = {horizontal: {w: 1840, h: 900}, square: {w: 1000, h: 880}, vertical: {w: 900, h: 1400}};

/**
 * Geometry per axis. Horizontal rulers: the article card lands ABOVE the
 * ruler and the facts lie BELOW it (so the hand-off band above the ruler is
 * free of text); vertical rulers: card on the left, facts on the right.
 * Shoulders sit outside the window and FOLLOW the hand along their edge (the
 * reader leans), so every target stays within reach; reach is checked by the
 * solver (`allReached`). `txt` holds per-axis text sizes (key labels ≥ ~20 px
 * at 1080p in every ratio).
 */
const GEO = {
  horizontal: {
    winH: 822, chipY: 836,
    // name plates lie on the desk beside the resting hand (the band under the window is only a fallback)
    platesLow: true,
    org: {x: 28, y: 18, w: 1180, h: 240, openW: 600, closedMax: 270, gap: 16, bookH: 170},
    ruler: {o: 'h', a0: 60, a1: 1780, c: 548, thick: 84, pad: 64},
    facts: {drop: 26, maxBottom: 814, w: 262, gap: 18, lo: 24, hi: 1816},
    card: {w: 300, hx: 32},
    arm: {upper: 450, lower: 430, width: 60, handScale: 1.3},
    A: {edge: 'top', fix: -400, off: 70, bend: 1},
    B: {edge: 'bottom', fix: 1180, off: 60, bend: -1},
    restA: [{x: 1690, y: 150}],
    restB: [{x: 1736, y: 772}, {x: 104, y: 772}],
    chips: {a: {x: 30, anchor: 'start'}, b: {x: 1810, anchor: 'end'}},
    txt: {fact: 26, factMin: 22, day: 24, strip: 24, num: 25, plate: 24, book: 24, ref: 28, iv: 28, pass: 24, ivLab: 24, chip: 26},
  },
  square: {
    winH: 806, chipY: 818, platesLow: true,
    // (a taller stand leaves the source books room for 3-line titles when the level plates wrap)
    org: {x: 16, y: 14, w: 968, h: 256, openW: 480, closedMax: 262, gap: 12, bookH: 150},
    // (a thinner ruler set lower: even a long-labels article card lies on it clear of the stand's level plates)
    ruler: {o: 'h', a0: 18, a1: 982, c: 540, thick: 64, pad: 44},
    facts: {drop: 28, maxBottom: 800, w: 186, gap: 9, lo: 12, hi: 900},
    card: {w: 270, hx: 30},
    arm: {upper: 420, lower: 400, width: 56, handScale: 1.3},
    A: {edge: 'left', fix: -400, off: 0, bend: 1},
    // B leans in from the right edge (resting in the free margin right of the fact row), so its arm reaches the
    // hand-off and the ruler over the desk above the facts — never across the fact row
    B: {edge: 'right', fix: 1060, off: 16, lean: 840, bend: -1},
    restA: [{x: 48, y: 772}, {x: 70, y: 330}],
    restB: [{x: 956, y: 712}],
    chips: {a: {x: 18, anchor: 'start'}, b: {x: 982, anchor: 'end'}},
    txt: {fact: 24, factMin: 22, day: 23.5, strip: 23.5, num: 23, plate: 23.5, book: 23.5, ref: 25, iv: 25, pass: 23, ivLab: 23.5, chip: 24},
  },
  vertical: {
    winH: 1316, chipY: 1328, platesLow: true,
    org: {x: 18, y: 18, split: true, rowW: [600, 864], h: 226, closedH: 214, openW: 600, closedMax: 420, gap: 12, bookH: 170},
    orgArms: {rowW: [600, 600]},
    ruler: {o: 'v', a0: 470, a1: 1302, c: 300, thick: 84, pad: 54},
    facts: {near: 420, w: 380, gap: 14, lo: 468, hi: 1308},
    card: {w: 238, hx: 32, refLines: 3},
    arm: {upper: 450, lower: 430, width: 58, handScale: 1.3},
    A: {edge: 'top', fix: -370, off: 70, lean: 860, bend: 1},
    B: {edge: 'left', fix: -420, off: 170, bend: -1},
    restA: [{x: 842, y: 122}],
    restB: [{x: 92, y: 1238}, {x: 92, y: 560}],
    chips: {a: {x: 20, anchor: 'start'}, b: {x: 880, anchor: 'end'}},
    txt: {fact: 26, day: 24, strip: 22, num: 25, plate: 22, book: 22, ref: 26, iv: 26, pass: 20, ivLab: 20, chip: 24},
  },
};

/**
 * Story desk: hierarchy stand + open book + article card + ruler + facts,
 * reader A and reader B.
 * @param {any} ctx
 * @param {{prefix:string, axis:'horizontal'|'square'|'vertical', d:any, readers?:any[], actorLabels?:{a:string,b:string}, arms?:boolean, placed?:boolean, intervalLabel?:string, facts?:any[], factDays?:number[]}} o
 *   placed: draw the article already on the ruler (inspect context; no arms)
 */
export function scopeDesk(ctx, o) {
  const th = ctx.theme;
  const C = stateColors(ctx);
  const t = ctx.t;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = DESK[axis];
  const d = o.d;
  const withArms = o.arms !== false;
  const hor = axis !== 'vertical';
  // (o.pxu: the desk's on-screen scale, when the entry knows it — key text ≥ ~19 px, all text ≥ ~16 px)
  const TX = scaledText(G.txt, o.pxu);
  /** reader A reaches in from the top edge: its hand is drawn above the carried card */
  const A_ABOVE = G.A.edge === 'top';

  // content text sizes actually drawn (cards, books, plates, facts): generic labels never exceed their minimum
  const sink = [];
  // ---- article card spec (built first: the source compartment is sized around it)
  const cardSpec = {
    w: G.card.w, hx: G.card.hx, edge: hor ? 'bottom' : 'right',
    ref: d.article.ref, text: d.article.text,
    intervalPhrases: intervalPhrases(d, d.start, d.end),
    intervalLabel: (o.intervalLabel || t.suppliedInterval),
    refSize: TX.ref, refLines: G.card.refLines ?? 3, refMin: TX.min, refOneLineMin: 0.97, ivSize: TX.iv, textSize: TX.pass, ivLabSize: TX.ivLab,
    ivAfterPhrases: o.swap && o.swap.kind === 'intervalEnd' ? intervalPhrases(d, d.start, o.swap.afterEnd) : undefined,
  };
  const probe = articleCard(ctx, {...cardSpec, sink});
  const CW = probe.w, CH = probe.h;

  // ---- hierarchy stand + books
  const nL = d.levels.length;
  const srcLevel = d.sources[d.sourceIndex].level;
  // with arms, the portrait stand keeps its second row as narrow as the first so the top-right corner
  // stays free for reader A's resting hand and name plate
  const ORG0 = withArms && G.orgArms ? {...G.org, ...G.orgArms} : G.org;
  // (vertical desks: the source row is tall enough for the resting card, so it never lies on the next row)
  let ORG = ORG0.split ? {...ORG0, h: Math.max(ORG0.h, CH + 26)} : ORG0;
  let lay, srcComp, openW, stand;
  const buildStand = sk => {
    lay = standLayout(ORG, nL, srcLevel);
    srcComp = lay.comps[srcLevel];
    // the open book leaves room for the card on its right page; the source level's plate stays under the
    // book's left page so the resting card never covers it
    openW = Math.min(2 * (srcComp.w - 24 - 20 - CW), srcComp.w - 24 - 20);
    // (o.plateFree — opt-in, desks without a resting card: the source plate may use the compartment's width)
    // (o.plateFree — opt-in, desks without a resting card: the source plate widens only as far as its longest
    // word needs at the minimum size, so a word such as "(user-supplied)" is never split)
    const srcPlateMax = () => {
      const base = openW / 2 - 14;
      if (!o.plateFree) return base;
      const minSz = Math.max(TX.plate * 0.88, TX.min ?? 0);
      const longest = Math.max(...String(d.levels[srcLevel] ?? '').split(/\s+/).map(wd => ctx.measure(wd, minSz, 700, 'sans')));
      return Math.max(base, longest + 6);
    };
    stand = hierarchyStand(ctx, {prefix: `${P}-st`, comps: lay.comps.map((c, i) => ({...c, label: d.levels[i], plateMax: i === srcLevel ? srcPlateMax() : undefined})), plateSize: TX.plate, plateMin: TX.min, sink: sk});
  };
  buildStand(null);
  // the compartments grow (never shrink) until every closed book can print its supplied title whole at the
  // minimum readable size (tall level plates otherwise leave the books too short)
  if (ctx.show('key')) {
    let grow = 0;
    d.sources.forEach(sv => {
      if (sv.i === d.sourceIndex) return;
      const fl = stand.boxes[sv.level].floor;
      const bw = Math.min(fl.w - 16, 240);
      const f = fitInBox(ctx, sv.label, {maxWidth: bw - 34 - 12, maxHeight: 1e4, size: TX.book, minSize: Math.max(17.5, TX.min ?? 0), floorSize: Math.max(16, TX.min ?? 0), weight: 700, family: 'serif'});
      grow = Math.max(grow, f.height + 30 + 12 - fl.h);
    });
    if (grow > 0) {
      ORG = {...ORG, h: ORG.h + grow, ...(ORG.closedH ? {closedH: ORG.closedH + grow} : {})};
      buildStand(null);
    }
  }
  buildStand(sink);
  const standBottom = lay.box.y + lay.box.h;
  let openBookInfo = null;
  const bookNodes = [];
  const bookLevels = [];
  d.levels.forEach((_, lv) => {
    const here = d.sources.filter(s => s.level === lv);
    const fl = stand.boxes[lv].floor;
    here.forEach(s => {
      const color = BOOK_COLORS[s.i % BOOK_COLORS.length];
      if (s.i === d.sourceIndex) {
        const bh = Math.min(fl.h - 8, ORG.bookH);
        openBookInfo = {x: fl.x + 10, y: fl.y + (fl.h - bh) / 2 + 3, w: openW, h: bh, color, title: s.label};
      } else {
        const others = here.filter(q => q.i !== d.sourceIndex);
        const idx = others.indexOf(s);
        const bw = Math.min(fl.w - 16, 240);
        const bh = Math.min(fl.h - 12, 150);
        const bx = fl.x + (fl.w - bw) / 2 + idx * 14 - (others.length - 1) * 7;
        const by = fl.y + (fl.h - bh) / 2 + idx * 10 - (others.length - 1) * 5;
        bookNodes.push(closedBook(ctx, {x: bx, y: by, w: bw, h: bh, color, title: s.label, rot: idx ? 3 : -1.5, titleSize: TX.book, titleMin: TX.min, sink}));
        bookLevels.push(lv);
      }
    });
  });

  // ---- ruler (below the stand when the stand has two rows)
  const RG = unitRuler(ctx, ORG.split ? {...G.ruler, a0: Math.max(G.ruler.a0, standBottom + 30)} : G.ruler, d, TX.num);
  const geo = rulerGeometry(RG, d);
  const ruler = rulerArt(ctx, {name: `${P}-ruler`, R: RG, d, geo, numSize: TX.num, minLabelGap: TX.num * 2.1});
  const startA = geo.along(d.start);
  const endA = geo.along(d.end);

  // destination: the housing meets the ruler's card-side edge at the start day
  // the card lies on the side of the start day AWAY from the tape (ending just before it on a horizontal
  // ruler, just above it on a vertical one — its tape housing sits on the card's corner at the start day), so
  // the tape and the hand pulling it never pass over the card; with no room before the start, it lies after it
  // (B pulling from below the ruler never passes over a card lying above it: there the card keeps its place
  // after the start day; the plates of the stand are never covered by the lying card)
  const pullOnCardSide = !hor || G.B.edge !== 'bottom';
  const platesBoxes = stand.boxes.map(b => b.plate).filter(Boolean);
  const cardOk = c => c.x >= 8 && c.y >= 8 && c.x + CW <= W - 8 && !platesBoxes.some(pb => overlaps({...c, w: CW, h: CH}, pb, 2));
  // positions along the ruler: from "just before the start day" (housing on the card's far corner) to
  // "the housing near the card's near edge"; ordered by preference, the first clear of every plate is used
  const along0 = hor ? CW : CH;
  const offs = [];
  for (let o2 = along0 + 4; o2 >= 18; o2 -= 8) offs.push(o2);
  const prefOff = pullOnCardSide ? along0 + 4 : G.card.hx;
  offs.sort((a, b) => Math.abs(a - prefOff) - Math.abs(b - prefOff));
  const at = o2 => (hor ? {x: startA - o2, y: geo.e0 - 6 - CH} : {x: geo.e0 - 6 - CW, y: startA - o2});
  const inRange = c => (hor ? c.x >= RG.a0 - 10 && c.x + CW <= RG.a1 + 10 : c.y >= standBottom + 8 && c.y + CH <= RG.a1 + 10);
  const found = offs.map(at).find(c => inRange(c) && cardOk(c));
  let cardDest = found || (hor ? {x: clamp(startA - G.card.hx, RG.a0 - 10, RG.a1 + 10 - CW), y: geo.e0 - 6 - CH}
    : {x: geo.e0 - 6 - CW, y: clamp(startA - G.card.hx, RG.a0 - 10, RG.a1 + 10 - CH)});
  const hxDest = hor ? startA - cardDest.x : startA - cardDest.y;
  const cardDestBox = {x: cardDest.x, y: cardDest.y, w: CW, h: CH};

  // ---- open book + resting card
  const ob = openBookInfo;
  const cardRestRot = -3;
  const srcBox = stand.boxes[srcLevel].box;
  const cardRest = ob
    ? {x: Math.max(ob.x + ob.w / 2 + 8, Math.min(ob.x + ob.w * 0.56, srcBox.x + srcBox.w - CW - 14)),
      y: clamp(ob.y + (ob.h - CH) / 2, srcBox.y + 6, srcBox.y + srcBox.h - CH - 8)}
    : {x: srcBox.x + 20, y: srcBox.y + 20};
  const slotLocal = ob ? {x: cardRest.x - ob.x + 6, y: Math.max(12, cardRest.y - ob.y + 4), w: Math.max(40, ob.w - (cardRest.x - ob.x) - 16), h: Math.min(CH - 8, ob.h - 24)} : null;
  const openBookNode = ob ? openBook(ctx, {x: ob.x, y: ob.y, w: ob.w, h: ob.h, color: ob.color, title: ob.title, seed: `${P}-ob`, slotName: `${P}-slot`, slot: slotLocal, titleSize: TX.book, titleMin: TX.min, sink}).node : null;
  const cardGroup = name => g({name},
    h('path', {name: `${name}-shadow`, d: roundRectPath(0, 0, CW, CH, 9), fill: th.shadow}),
    g({name: `${name}-body`}, ...articleCard(ctx, {...cardSpec, hx: hxDest, ivName: cardSpec.ivAfterPhrases ? `${name}-iv` : undefined}).parts),
  );
  const cardBook = cardGroup(`${P}-cardK`);
  const cardHigh = cardGroup(`${P}-cardH`);
  const cardDesk = cardGroup(`${P}-cardD`);

  // ---- tape
  const tape = tapeArt(ctx, {P: `${P}-tape`, geo, R: RG});
  // ghost of the substituted datum (inspect): the old end clip, or the old pin, kept traceable (dashed)
  let ghost = null;
  if (o.swap && o.swap.kind === 'intervalEnd') {
    const a = geo.along(o.swap.beforeEnd);
    const dd = clipPath(geo, RG, a, -1);
    ghost = g({name: `${P}-ghost`, opacity: 0},
      h('path', {d: dd, fill: 'none', stroke: C.tape, 'stroke-width': 5, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  }

  // (o.factW: an entry without arms may use wider fact cards, e.g. the inspect context desk in 1:1)
  const fw = (o.factW && o.factW[axis]) || G.facts.w;
  const factsTop = hor ? geo.e1 + G.facts.drop : 0;
  // vertical desks: the cards share the ruler's length; they never spill above it onto the stand's plates
  const vLo = Math.max(G.facts.lo, RG.a0 - 12);
  const avail = hor ? G.facts.maxBottom - factsTop : (G.facts.hi - vLo - (d.facts.length - 1) * G.facts.gap) / d.facts.length;
  let fsize = TX.fact;
  let compact = false;
  const swapFact = o.swap && o.swap.kind === 'factDay' ? o.swap.fact : -1;
  const measureAll = () => d.facts.map((f, i) => measureFact(ctx, f, {w: fw, dayText: d.dayText(f.day), labelSize: fsize, labelMin: TX.min, daySize: TX.day, stripSize: TX.strip, dayAfterText: i === swapFact ? d.dayText(o.swap.afterDay) : undefined, compact}));
  let measures = measureAll();
  if (!hor && Math.max(...measures.map(m => m.h)) > avail) { compact = true; measures = measureAll(); }
  while (Math.max(...measures.map(m => m.h)) > avail && fsize - 1 >= (TX.factMin ?? TX.fact * 0.78)) {
    fsize -= 1;
    measures = measureAll();
  }
  const fh = Math.max(...measures.map(m => m.h));
  // the smallest key-content text actually printed on the fact cards (labels, day chips, status strips), in
  // design units: generic labels (name chips here; callouts / tags / captions in the entries) never exceed it
  const stripFits = ctx.show('key') ? [t.inside, t.outside, t.unclassified].map(x => ctx.fit(x, {maxWidth: fw - (compact ? 12 : 24) - 16, size: TX.strip, minSize: 15, maxLines: 1, weight: 800}).size) : [];
  const factSizes = [...measures.flatMap(m => [m.labelFit && m.labelFit.size, m.dayFit && m.dayFit.size]), ...stripFits].filter(Boolean);
  sink.push(...factSizes);
  // (the smallest content text on the desk: cards, books, plates, facts)
  const factSize = sink.length ? Math.min(...sink) : null;
  // (reader names are supplied content: their chips keep their own size, never capped below the facts)
  const chipSize = TX.chip;
  const factPos = [];
  if (hor) {
    const xs = relax1d(d.facts.map(f => ({c: geo.along(f.day), s: fw})), G.facts.gap, G.facts.lo, G.facts.hi);
    d.facts.forEach((f, i) => factPos.push({x: xs[i] - fw / 2, y: factsTop, w: fw, h: fh}));
  } else {
    const ys = relax1d(d.facts.map(f => ({c: geo.along(f.day), s: fh})), G.facts.gap, vLo, G.facts.hi);
    d.facts.forEach((f, i) => factPos.push({x: G.facts.near, y: ys[i] - fh / 2, w: fw, h: fh}));
  }
  const pinCross = RG.thick / 2 - 13;
  const pins = d.facts.map(f => geo.at(f.day, pinCross));
  if (swapFact >= 0) {
    const q = pins[swapFact];
    ghost = g({name: `${P}-ghost`, opacity: 0},
      h('circle', {cx: r(q.x), cy: r(q.y), r: 13, fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '5 4'}));
  }
  const anchors = factPos.map(b => (hor ? {x: b.x + b.w / 2, y: b.y} : {x: b.x, y: b.y + b.h / 2}));
  const factNodes = d.facts.map((f, i) => {
    const fc = factCard(ctx, {prefix: `${P}-f${i}`, w: fw, h: fh, fact: f, measure: measures[i], t, stripSize: TX.strip, swapName: i === swapFact ? `${P}-fday${i}` : undefined});
    return g({name: `${P}-f${i}`, transform: T(factPos[i].x, factPos[i].y)}, fc.parts);
  });
  const threadNodes = d.facts.map((f, i) => g(null,
    h('line', {name: `${P}-th${i}`, x1: r(pins[i].x), y1: r(pins[i].y), x2: r(anchors[i].x), y2: r(anchors[i].y), stroke: th.inkSoft, 'stroke-width': 2.2}),
    h('line', {name: `${P}-thi${i}`, x1: r(pins[i].x), y1: r(pins[i].y), x2: r(anchors[i].x), y2: r(anchors[i].y), stroke: C.inside, 'stroke-width': 4, opacity: 0}),
    h('circle', {cx: r(anchors[i].x), cy: r(anchors[i].y), r: 5, fill: th.ink}),
  ));
  const pinNodes = d.facts.map((f, i) => g({transform: T(pins[i].x, pins[i].y)}, pushPin(ctx, `${P}-pin${i}`, 11)));

  // ---- arms
  const readers = o.readers || [{name: ''}, {name: ''}];
  const lookA = actorLook(ctx, readers[0], 0);
  const lookB = actorLook(ctx, readers[1], 1);
  const armA = withArms ? topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'left', ...G.arm}) : null;
  const armB = withArms ? topArm(ctx, {name: `${P}-armB`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'right', ...G.arm}) : null;

  // ---- resting hands: on free desk (never on the card, a fact card or the other hand); else parked off the edge
  const handBox = q => ({x: q.x - 44, y: q.y - 48, w: 88, h: 92});
  const factBoxes = factPos.map(b => ({...b}));
  const blockers = [cardDestBox, ...factBoxes, geo.box, ...lay.comps];
  const restA = G.restA.find(q => !blockers.some(b => overlaps(handBox(q), b, 4))) || parkedFor(G.A, G.restA[0]);
  // B (from the bottom edge on horizontal rulers) withdraws along the ruler and then straight down a
  // column that is clear of every fact card, so the retract never passes over a card; prefer such a
  // clear lane, then the side nearest the end of the tape
  const laneClear = q => !hor || !factBoxes.some(b => overlaps({x: q.x - 50, y: geo.e1, w: 100, h: q.y + 48 - geo.e1}, b, 2));
  // when neither edge offers a clear lane, a wide enough gap between two fact cards does
  const gapRests = [];
  if (hor) {
    const fb = factBoxes.slice().sort((a, b) => a.x - b.x);
    for (let i = 0; i + 1 < fb.length; i++) {
      const a0 = fb[i].x + fb[i].w, a1 = fb[i + 1].x;
      if (a1 - a0 >= 112) gapRests.push({x: (a0 + a1) / 2, y: G.restB[0].y, gap: a1 - a0});
    }
  }
  const restB = [...G.restB, ...gapRests]
    .filter(q => !blockers.some(b => overlaps(handBox(q), b, 4)) && !overlaps(handBox(q), handBox(restA), 6))
    // cost: how far the hand travels along the ruler, plus a penalty for a (narrow) gap between cards
    .map((q, i) => ({q, i, lane: laneClear(q), cost: (hor ? Math.abs(q.x - endA) : i) + (q.gap ? 200 + Math.max(0, 250 - q.gap) * 4 : 0)}))
    .sort((a, b) => (Number(b.lane) - Number(a.lane)) || (a.cost - b.cost))
    .map(c => c.q)[0] || parkedFor(G.B, G.restB[0]);
  function parkedFor(spec, q) {
    if (spec.edge === 'top') return {x: q.x, y: spec.fix - 300, parked: true};
    if (spec.edge === 'bottom') return {x: q.x, y: spec.fix + 300, parked: true};
    if (spec.edge === 'right') return {x: spec.fix + 300, y: q.y, parked: true};
    return {x: spec.fix - 300, y: q.y, parked: true};
  }

  // ---- actor chips: each chip sits beside ITS OWN arm. An arm resting near the bottom of the desk gets
  // its chip in the band below the window, on the side of its hand; an arm resting elsewhere gets a
  // name plate lying on the desk right next to its resting hand (clear of the arm itself, the books,
  // the ruler, the cards and the other hand).
  const chips = [];
  const plates = [];
  const chipOf = {};
  if (withArms && ctx.show('key') && o.actorLabels) {
    const maxW = W / 2 - 40;
    const nameA = readers[0].name ? `${o.actorLabels.a} · ${readers[0].name}` : o.actorLabels.a;
    const nameB = readers[1].name ? `${o.actorLabels.b} · ${readers[1].name}` : o.actorLabels.b;
    const bandH = H - G.chipY - 4;
    const margin = G.chips.a.x;
    const bandUsed = {start: margin, end: W - margin};
    const bandChip = (text, look, rest, name) => {
      // centred under the resting hand as far as the band allows (left / right of a chip already placed)
      const left = rest.x < W / 2;
      const probeC = actorChip(ctx, text, {name, x: 0, y: G.chipY, maxWidth: maxW, swatch: look.outfit, size: chipSize, maxH: bandH});
      const cw = probeC.box.w;
      const x0 = clamp(rest.x - cw / 2, bandUsed.start, Math.max(bandUsed.start, bandUsed.end - cw));
      const c = actorChip(ctx, text, {name, x: x0, y: G.chipY, maxWidth: maxW, swatch: look.outfit, size: chipSize, maxH: bandH});
      if (left) bandUsed.start = c.box.x + c.box.w + 16;
      else bandUsed.end = c.box.x - 16;
      chips.push(c);
      chipOf[name] = c.box;
    };
    const placeActor = (text, look, rest, spec, name, otherRest) => {
      const nearBottom = !rest.parked && rest.y > G.winH - 170;
      if (rest.parked || (nearBottom && !G.platesLow)) return bandChip(text, look, rest, name);
      const sh = spec.edge === 'top' && spec.lean ? {x: rest.x + spec.off, y: Math.min(-20, Math.max(spec.fix, rest.y - spec.lean))}
        : spec.edge === 'top' || spec.edge === 'bottom' ? {x: rest.x + spec.off, y: spec.fix}
        : spec.edge === 'right' && spec.lean ? {x: Math.max(spec.fix, rest.x + spec.lean), y: rest.y + spec.off} : {x: spec.fix, y: rest.y + spec.off};
      const pb = [...lay.comps, geo.box, cardDestBox, ...factBoxes, handBox(otherRest), plateHandoffBox()];
      for (const mw of [maxW, 330, 270, 230, 200]) {
        const c0 = actorChip(ctx, text, {name, x: 0, y: 0, maxWidth: mw, swatch: look.outfit, size: chipSize, maxLines: 5});
        // (a plate so narrow that the supplied name would fall below ~16 px is not used)
        if (c0.truncated || c0.size < Math.max(chipSize * 0.7, TX.min ?? 0)) continue;
        const {w: cw, h: chh} = c0.box;
        const cands = [
          {x: rest.x - cw / 2, y: rest.y + 50}, {x: rest.x + 44 - cw, y: rest.y + 50}, {x: rest.x - 44, y: rest.y + 50},
          {x: rest.x - cw / 2, y: rest.y - 54 - chh}, {x: rest.x - 56 - cw, y: rest.y - chh / 2},
        ].map(q => ({x: clamp(q.x, 14, W - 14 - cw), y: clamp(q.y, 14, G.winH - 14 - chh)}));
        const ok = cands.find(q => {
          const b = {x: q.x, y: q.y, w: cw, h: chh};
          return !overlaps(b, handBox(rest), 4) && !segmentHitsBox(rest, sh, b, G.arm.width * 0.6) && !pb.some(k => overlaps(b, k, 8));
        });
        if (ok) {
          const c = actorChip(ctx, text, {name, x: ok.x, y: ok.y, maxWidth: mw, swatch: look.outfit, size: chipSize, maxLines: 5});
          plates.push(c);
          chipOf[name] = c.box;
          return;
        }
      }
      bandChip(text, look, rest, name);
    };
    placeActor(nameB, lookB, restB, G.B, `${P}-chipB`, restA);
    placeActor(nameA, lookA, restA, G.A, `${P}-chipA`, restB);
  }
  /**
   * Hand-off centre: in the band between the stand and the ruler. A card taller than the band never covers the
   * ruler (its numbers): its top rises into the source compartment instead, kept within that compartment's
   * width, where the emptied right page and the plain lip carry no text.
   */
  function handoffCentre() {
    let hx = hor
      ? clamp(lerp(cardRest.x + CW / 2, cardDest.x + CW / 2, 0.5), CW * 0.53 + 16, W - CW * 0.53 - 16)
      : clamp(cardDest.x + CW / 2, CW * 0.53 + 16, geo.e0 - CW * 0.53 - 4);
    let hy;
    if (hor) {
      const lo = standBottom + CH * 0.53 + 14, hi = geo.e0 - CH * 0.53 - 8;
      hy = lo <= hi ? clamp((standBottom + geo.e0) / 2, lo, hi) : hi;
      if (lo > hi) {
        const sb = stand.boxes[srcLevel].box;
        hx = clamp(hx, sb.x + sb.w * 0.45 + CW * 0.53, sb.x + sb.w - CW * 0.53 - 4);
      }
    } else hy = standBottom + CH * 0.53 + 14;
    return {hx, hy};
  }
  /** hand-off area (the carried card passes there), computed from the same formula as the pose below */
  function plateHandoffBox() {
    const {hx: hx0, hy: hy0} = handoffCentre();
    return {x: hx0 - CW * 0.53 - 10, y: hy0 - CH * 0.53 - 10, w: CW * 1.06 + 20, h: CH * 1.06 + 20};
  }

  // ---- desk window
  const clipId = `${P}-clip`;
  const winH = G.winH;
  const grain = [];
  for (let i = 0; i < 9; i++) {
    const gy = ((i + 0.5) / 9) * winH + (ctx.rng(`${P}-grain`, i) - 0.5) * 24;
    const wob = 8 + ctx.rng(`${P}-wob`, i) * 12;
    grain.push(h('path', {d: `M0 ${r(gy)}C${r(W * 0.3)} ${r(gy - wob)} ${r(W * 0.62)} ${r(gy + wob)} ${W} ${r(gy - wob * 0.4)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.5}));
  }
  const node = g({name: P},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(0, 0, W, winH, 28)}))),
    h('path', {d: roundRectPath(0, 0, W, winH, 28), fill: th.woodTop}),
    g({'clip-path': ctx.ref(clipId)},
      grain,
      // (o.standGroups — opt-in: one named group per compartment with its books, so a view can hide one)
      o.standGroups
        ? g({name: `${P}-stand`}, d.levels.map((_, lv) => g({name: `${P}-comp${lv}`}, stand.compParts[lv], bookNodes.filter((_, k) => bookLevels[k] === lv), lv === srcLevel ? openBookNode : null)))
        : g({name: `${P}-stand`}, stand.node, bookNodes, openBookNode),
      cardBook,
      ruler,
      ghost,
      tape.node,
      threadNodes,
      pinNodes,
      factNodes,
      cardDesk,
      plates.map(c => c.node),
      armA && !A_ABOVE && [armA.arm, armA.palm],
      armB && [armB.arm, armB.palm],
      cardHigh,
      armA && A_ABOVE && [armA.arm, armA.palm],
      armA && armA.thumb,
      armB && armB.thumb,
    ),
    h('path', {d: roundRectPath(0, 0, W, winH, 28), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2}),
    chips.map(c => c.node),
  );

  // ----------------------------------------------------------------------
  // Pose helpers
  const rot = (p, deg) => {
    const a = (deg * Math.PI) / 180;
    return {x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a)};
  };
  /** world point of a card-local point for a card pose */
  const cardPoint = (cp, local) => {
    const c = {x: CW / 2, y: CH / 2};
    const q = rot({x: (local.x - c.x) * cp.k, y: (local.y - c.y) * cp.k}, cp.rot);
    return {x: cp.x + c.x + q.x, y: cp.y + c.y + q.y};
  };
  // grips: an arm from the TOP edge lays its hand on the card's upper-right corner (the paper-clip corner,
  // clear of the reference text) and is drawn ABOVE the carried card, so the whole grasp stays visible even
  // while the card is still at the top of the desk; an arm from the left pinches the card's left edge.
  // B holds the edge that faces it: the bottom edge (arm from the bottom), or the left edge (arm from the left).
  // (an arm from the left pinches the top-left corner: its thumb lies below the reference line)
  const gripA = A_ABOVE ? {x: CW - 16, y: Math.min(54, CH * 0.3)} : {x: -4, y: 18};
  const gripB = G.B.edge === 'bottom' ? {x: CW * 0.72, y: CH + 8} : G.B.edge === 'right' ? {x: CW + 30, y: CH * 0.3} : {x: 14, y: CH * 0.55};
  const restPose = {x: cardRest.x, y: cardRest.y, rot: cardRestRot, k: 1};
  const destPose = {x: cardDest.x, y: cardDest.y, rot: 0, k: 1};
  const liftPose = {...restPose, k: 1.05, y: restPose.y - 6};
  // hand-off: in the text-free band between the stand and the ruler, between the book and the destination
  const {hx: hoX, hy: hoY} = handoffCentre();
  const handoffPose = {x: hoX - CW / 2, y: hoY - CH / 2, rot: 0, k: 1.05};
  const tabPoint = a => (hor ? {x: a, y: RG.c} : {x: RG.c, y: a});
  // where B holds the tape clip while pulling: the clip's end on B's own side of the ruler (below it for an
  // arm from the bottom, above it for an arm from the right, left of it for an arm from the left), so the arm
  // never lies across the ruler's printed numbers
  // (the hand holds the clip's tab a little further along the pull, clear of a card lying before the start)
  // (fingers reach ~50 units past the grip towards the arm's far side: the tab is held that far along)
  const pullPoint = a => (hor ? {x: G.B.edge === 'bottom' ? a : a + 84, y: G.B.edge === 'bottom' ? geo.e1 + 40 : geo.e0 - 40} : {x: geo.e0 - 40, y: a + 56});

  const shoulderFor = (spec, hand) => {
    // (an arm from the top may lean in as well: the shoulder stays off-stage, within reach of the hand)
    if (spec.edge === 'top' && spec.lean) return {x: hand.x + spec.off, y: Math.min(-20, Math.max(spec.fix, hand.y - spec.lean))};
    if (spec.edge === 'top' || spec.edge === 'bottom') return {x: hand.x + spec.off, y: spec.fix};
    // (an arm from the right leans in: the shoulder stays off-stage, within reach of the hand)
    if (spec.edge === 'right' && spec.lean) return {x: Math.max(spec.fix, hand.x + spec.lean), y: hand.y + spec.off};
    return {x: spec.fix, y: hand.y + spec.off};
  };

  /**
   * Pose from action values in [0,1].
   * @param {{aReach:number, lift:number, aCarry:number, bReach:number, handoff:number, aBack:number,
   *   bCarry:number, bToTab:number, pull:number, bBack:number, classify?:number[], strips?:number[]}} v
   *   classify / strips: per-fact state reveal progress (0..1) for pins/threads and card strips
   */
  function pose(v) {
    const nodes = {};
    // ---- card pose & holder
    let cp = {...restPose};
    let holder = 'book';
    if (o.placed) {
      cp = {...destPose};
      holder = 'ruler';
    } else if (v.bCarry > 0) {
      const e = ease.inOutCubic(v.bCarry);
      const q = cubic(handoffPose, {x: lerp(handoffPose.x, destPose.x, 0.25), y: handoffPose.y - 20}, {x: destPose.x, y: destPose.y - 30}, destPose, e);
      cp = {x: q.x, y: q.y, rot: 0, k: lerp(1.05, 1, ease.inOutSine(v.bCarry))};
      holder = v.bCarry >= 1 ? 'ruler' : 'B';
      if (v.bCarry >= 1) cp = {...destPose};
    } else if (v.aCarry > 0) {
      const e = ease.inOutCubic(v.aCarry);
      const mid = {x: lerp(liftPose.x, handoffPose.x, 0.5), y: Math.min(liftPose.y, handoffPose.y) - 16};
      const q = cubic(liftPose, mid, {x: handoffPose.x, y: handoffPose.y - 20}, handoffPose, e);
      cp = {x: q.x, y: q.y, rot: lerp(cardRestRot, 0, e), k: 1.05};
      holder = v.aBack > 0 ? 'B' : v.handoff > 0 ? 'handoff' : 'A';
    } else if (v.lift > 0) {
      const e = ease.inOutSine(v.lift);
      cp = {x: restPose.x, y: lerp(restPose.y, liftPose.y, e), rot: cardRestRot, k: lerp(1, 1.05, e)};
      holder = 'A';
    }
    const lifted = holder === 'A' || holder === 'B' || holder === 'handoff';
    const liftAmt = holder === 'A' && v.aCarry <= 0 ? clamp(v.lift) : lifted ? 1 : 0;
    const cardT = `${T(cp.x + CW / 2, cp.y + CH / 2, cp.rot, cp.k)} ${T(-CW / 2, -CH / 2)}`;
    nodes[`${P}-cardK`] = {transform: cardT, opacity: holder === 'book' ? 1 : 0};
    nodes[`${P}-cardH`] = {transform: cardT, opacity: lifted ? 1 : 0};
    nodes[`${P}-cardD`] = {transform: cardT, opacity: holder === 'ruler' ? 1 : 0};
    const sh = 3 + 12 * liftAmt;
    nodes[`${P}-cardK-shadow`] = {transform: T(5, 7)};
    nodes[`${P}-cardD-shadow`] = {transform: T(5, 7)};
    nodes[`${P}-cardH-shadow`] = {transform: T(sh, sh * 1.4)};
    if (ob) nodes[`${P}-slot`] = {opacity: r(holder === 'book' ? 0 : o.placed ? 1 : clamp(((v.lift ?? 1) - 0.4) / 0.6), 3)};

    // ---- tape
    const pullP = o.placed ? 1 : clamp(v.pull);
    const endNow = v.endA !== undefined ? v.endA : endA;
    const tapeA = lerp(startA, endNow, ease.inOutCubic(pullP));
    const landed = o.placed || v.bCarry >= 1;
    Object.assign(nodes, tape.frame(startA, tapeA, landed ? 1 : 0));

    // ---- substitution (inspect): card interval text / fact day chip swap, moving pin + thread
    if (o.swap && v.swapP !== undefined) {
      const out = clamp(v.swapP * 2), inn = clamp(v.swapP * 2 - 1);
      const sw = (a, b) => {
        nodes[a] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-12 * out)})`};
        nodes[b] = {opacity: r(inn, 3), transform: `translate(0 ${r(12 * (1 - inn))})`};
      };
      if (o.swap.kind === 'intervalEnd' && ctx.show('key')) for (const nm of [`${P}-cardK`, `${P}-cardH`, `${P}-cardD`]) sw(`${nm}-iv-0`, `${nm}-iv-1`);
      if (o.swap.kind === 'factDay' && ctx.show('key')) sw(`${P}-fday${swapFact}-0`, `${P}-fday${swapFact}`);
    }
    if (ghost && v.ghost !== undefined) nodes[`${P}-ghost`] = {opacity: r(clamp(v.ghost), 3)};
    if (swapFact >= 0 && v.pinAlong !== undefined) {
      const q = geo.at(v.pinAlong === null ? d.facts[swapFact].day : v.pinAlong, pinCross);
      const q0 = pins[swapFact];
      nodes[`${P}-pin${swapFact}`] = {transform: T(q.x - q0.x, q.y - q0.y)};
      const an = anchors[swapFact];
      for (const nm of [`${P}-th${swapFact}`, `${P}-thi${swapFact}`]) nodes[nm] = {...(nodes[nm] || {}), x1: r(q.x), y1: r(q.y), x2: r(an.x), y2: r(an.y)};
    }

    // ---- facts: pins / threads / strips
    const factStates = [];
    d.facts.forEach((f, i) => {
      const cls = v.classify ? clamp(v.classify[i]) : 0;
      const strip = v.strips ? clamp(v.strips[i]) : 0;
      const st = v.states ? v.states[i] : f.state;
      nodes[`${P}-pin${i}-in`] = {opacity: st === 'inside' ? r(cls, 3) : 0};
      nodes[`${P}-pin${i}-out`] = {opacity: st === 'outside' ? r(cls, 3) : 0};
      nodes[`${P}-pin${i}-unc`] = {opacity: st === 'unclassified' ? r(cls, 3) : 0};
      nodes[`${P}-thi${i}`] = {...(nodes[`${P}-thi${i}`] || {}), opacity: st === 'inside' ? r(cls, 3) : 0};
      nodes[`${P}-th${i}`] = {...(nodes[`${P}-th${i}`] || {}), 'stroke-dasharray': st === 'outside' && cls > 0.5 ? '7 6' : 'none'};
      nodes[`${P}-f${i}-s1`] = {opacity: st === 'inside' ? r(strip, 3) : 0};
      nodes[`${P}-f${i}-s2`] = {opacity: st === 'outside' ? r(strip, 3) : 0};
      nodes[`${P}-f${i}-s3`] = {opacity: st === 'unclassified' ? r(strip, 3) : 0};
      nodes[`${P}-f${i}-s0`] = {opacity: r(1 - strip, 3)};
      factStates.push(strip >= 1 ? st : cls > 0 ? `${st}-marking` : 'neutral');
    });

    // ---- arms
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    let reachA = true, reachB = true;
    let handA = null, handB = null, segsB = null;
    const gA = cardPoint(cp, gripA);
    const gB = cardPoint(cp, gripB);
    if (armA) {
      const bookGrip = cardPoint(restPose, gripA);
      let target;
      // an arm resting low on the left edge travels up the free left margin (clear of the fact cards)
      // before crossing to the book, and comes back the same way
      const lowA = G.A.edge === 'left' && !restA.parked && restA.y > geo.e1;
      const cornerA = {x: restA.x - 6, y: geo.e0 - 70};
      const via = (p0, p1, e) => (lowA ? cubic(p0, cornerA, cornerA, p1, e) : mix(p0, p1, e));
      if (v.aBack > 0) target = via(cardPoint(handoffPose, gripA), restA, ease.inOutSine(v.aBack));
      else if (v.aCarry > 0 || v.lift > 0) target = gA;
      else target = via(restA, bookGrip, ease.inOutSine(clamp(v.aReach)));
      const sA = armA.pose(shoulderFor(G.A, target), target, G.A.bend);
      Object.assign(nodes, sA.nodes);
      reachA = sA.reached;
      handA = sA.hand;
    }
    if (armB) {
      const hoGripB = cardPoint(handoffPose, gripB);
      const destGripB = cardPoint(destPose, gripB);
      const tab0 = pullPoint(startA);
      let target;
      if (v.bBack > 0) {
        // withdraw along the ruler to the resting lane, then straight down it (horizontal rulers)
        const e = ease.inOutSine(v.bBack);
        const p0 = pullPoint(endNow);
        if (hor && !restB.parked) {
          const corner = {x: restB.x, y: p0.y};
          target = cubic(p0, corner, corner, restB, e);
        } else target = mix(p0, restB, e);
      }
      else if (v.pull > 0) target = pullPoint(tapeA);
      else if (v.bToTab > 0) {
        const e = ease.inOutCubic(v.bToTab);
        const lift = Math.sin(Math.PI * e) * 24;
        const q = mix(destGripB, tab0, e);
        target = hor ? {x: q.x, y: q.y - lift} : {x: q.x - lift, y: q.y};
      } else if (v.bCarry > 0 || v.handoff > 0 || v.aBack > 0) target = gB;
      else if (G.B.edge === 'right' && !restB.parked) {
        // up the free right margin to above the ruler first, then across to the hand-off (never over a fact)
        const corner = {x: restB.x, y: geo.e0 - 40};
        target = cubic(restB, corner, corner, hoGripB, ease.inOutSine(clamp(v.bReach)));
      } else target = mix(restB, hoGripB, ease.inOutSine(clamp(v.bReach)));
      const shB = shoulderFor(G.B, target);
      const sB = armB.pose(shB, target, G.B.bend);
      Object.assign(nodes, sB.nodes);
      reachB = sB.reached;
      handB = sB.hand;
      const up = sB.nodes[`${P}-armB-upper`];
      segsB = [[shB, {x: up.x2, y: up.y2}], [{x: up.x2, y: up.y2}, sB.wrist], [sB.wrist, sB.hand]];
    }
    return {
      nodes,
      semantic: {
        handA: handA && P2(handA),
        handB: handB && P2(handB),
        cardGripA: P2(gA),
        cardGripB: P2(gB),
        card: P2({x: cp.x + CW / 2, y: cp.y + CH / 2}),
        cardHolder: holder,
        tapeEnd: P2(pullPoint(tapeA)),
        tapeProgress: r(pullP, 3),
        tapeLaid: landed && pullP >= 1,
        factStates,
        reach: {A: reachA, B: reachB},
        allReached: reachA && reachB,
        // B's arm (inside the window) against the fact cards, when B leans in from the right edge
        armBOnFacts: segsB && G.B.edge === 'right' ? factBoxes.map((b, i) => (segsB.some(([a, q]) => {
          for (let k = 0; k <= 40; k++) {
            const x = a.x + (q.x - a.x) * (k / 40), y = a.y + (q.y - a.y) * (k / 40);
            if (x < 0 || x > W || y < 0 || y > G.winH) continue;
            if (Math.hypot(Math.max(b.x - x, 0, x - b.x - b.w), Math.max(b.y - y, 0, y - b.y - b.h)) < G.arm.width / 2) return true;
          }
          return false;
        }) ? i : -1)).filter(i => i >= 0) : null,
      },
    };
  }

  const row0 = lay.comps.filter(c => c.y === ORG.y);
  const row0Right = Math.max(...row0.map(c => c.x + c.w)) + 16;
  return {
    node, pose, W, H, axis, winH: G.winH, geo, R: RG,
    cardDestBox, cardRestBox: {x: cardRest.x, y: cardRest.y, w: CW, h: CH}, CW, CH,
    factBoxes, pins, anchors,
    standBox: lay.box, standBottom, standComps: lay.comps,
    /** free desk area right of the stand's first row (for labels) */
    topFree: {x: row0Right, y: 16, w: W - row0Right - 16, h: (hor ? standBottom : row0[0].y + row0[0].h) - 16},
    openBookBox: ob ? {x: ob.x, y: ob.y, w: ob.w, h: ob.h} : null,
    restA, restB,
    chipBoxes: [...chips, ...plates].map(c => c.box),
    /** each reader's name chip (null when labels are hidden) */
    chipA: chipOf[`${P}-chipA`] || null,
    chipB: chipOf[`${P}-chipB`] || null,
    handBoxOf: handBox,
    startA, endA,
    handoffPoint: {x: hoX, y: hoY},
    handoffBox: {x: handoffPose.x - 10, y: handoffPose.y - 10, w: CW * 1.05 + 20, h: CH * 1.05 + 20},
    handBoxes: withArms ? [restA, restB].filter(q => !q.parked).map(handBox) : [],
    tabPoint,
    stateAt: (i, day, end) => factState(day, d.facts[i].forced ? 'not-classified' : 'auto', d.start, end ?? d.end),
    factSize,
    /** the lying article card ends before the start day (the tape and the pulling hand never pass over it) */
    cardBeforeStart: hor ? cardDest.x + CW <= startA : cardDest.y + CH <= startA,
    /** B pulls the tape on the card's side of the ruler (so the card must lie before the start day) */
    pullOnCardSide,
    /** smallest reader-name text (name chips / plates), design units */
    nameSize: [...chips, ...plates].length ? Math.min(...[...chips, ...plates].map(c => c.size)) : null,
  };
}

/* ------------------------------------------------------------------------ */
/* Free-space placement for editorial labels                                */
/* ------------------------------------------------------------------------ */

/**
 * Find a position for a w×h box inside one of the zones that does not touch
 * any obstacle. Zones are tried in order; inside a zone the scan starts from
 * the corner named by `from` (default top-left) so results are stable.
 * @returns {{x:number,y:number}|null}
 */
export function findSpot(w, hh, zones, obstacles, o = {}) {
  const pad = o.pad ?? 10;
  const stepX = o.step ?? 12;
  for (const z of zones) {
    if (w > z.w || hh > z.h) continue;
    const xs = [];
    const ys = [];
    for (let x = z.x; x <= z.x + z.w - w + 0.01; x += stepX) xs.push(x);
    for (let y = z.y; y <= z.y + z.h - hh + 0.01; y += stepX) ys.push(y);
    if (z.fromRight) xs.reverse();
    if (z.fromBottom) ys.reverse();
    if (z.centerX) xs.sort((a, b) => Math.abs(a + w / 2 - z.centerX) - Math.abs(b + w / 2 - z.centerX));
    for (const y of ys) {
      for (const x of xs) {
        const b = {x, y, w, h: hh};
        if (!obstacles.some(q => overlaps(b, q, pad))) return {x, y};
      }
    }
  }
  return null;
}

/**
 * Callout chip + leader to a target, placed in free space. Returns null when
 * no free spot exists (the entry then drops the optional label).
 */
export function placeCallout(ctx, o) {
  const th = ctx.theme;
  const size = o.size ?? 24;
  const tg = o.target;
  // try the preferred width first, then narrower (taller) chips for tight zones
  const widths = [o.maxWidth, ...(o.altWidths ?? [340, 280, 230])].filter((v, i, a) => v <= o.maxWidth && a.indexOf(v) === i);
  let fit = null, w = 0, hh = 0, spot = null;
  for (const mw of widths) {
    fit = fitWords(ctx, o.text, {maxWidth: mw - size * 1.2, size, minSize: size * 0.8, maxLines: o.maxLines ?? 4, weight: 600});
    w = fit.width + size * 1.2;
    hh = fit.height + size * 0.76;
    spot = bestSpot(w, hh, o.zones, o.obstacles, tg, {pad: o.pad ?? 12, minLead: o.minLead ?? 24, maxLead: o.maxLead ?? 420, maxHostRun: o.maxHostRun ?? 36});
    if (spot) break;
  }
  if (!spot) return null;
  const box = {x: spot.x, y: spot.y, w, h: hh, cx: spot.x + w / 2, cy: spot.y + hh / 2};
  const from = leaderStart(box, tg);
  const len = Math.hypot(tg.x - from.x, tg.y - from.y);
  const color = o.color ?? th.ink;
  const node = g({name: o.name, opacity: 0},
    len > 6 ? h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(tg.x), y2: r(tg.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}) : null,
    h('circle', {name: `${o.name}-dot`, cx: r(tg.x), cy: r(tg.y), r: 7, fill: color, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
    g({name: `${o.name}-chip`},
      h('path', {d: roundRectPath(box.x, box.y, w, hh, Math.min(hh / 2, size * 0.7)), fill: th.card, stroke: color, 'stroke-width': 2}),
      textBlock(fit, {x: box.cx, y: box.y + size * 0.38, anchor: 'middle', fill: th.ink})),
  );
  const frame = p => {
    const out = {[o.name]: {opacity: p > 0 ? 1 : 0}, [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0}, [`${o.name}-chip`]: {opacity: r(clamp((p - 0.35) / 0.65), 3)}};
    if (len > 6) out[`${o.name}-lead`] = {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))};
    return out;
  };
  return {node, frame, box, leader: {from, to: tg}};
}

/** Leader start: the chip edge point nearest the target. */
export function leaderStart(box, tg) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  if (tg.y < box.y) return {x: clamp(tg.x, box.x + 14, box.x + box.w - 14), y: box.y};
  if (tg.y > box.y + box.h) return {x: clamp(tg.x, box.x + 14, box.x + box.w - 14), y: box.y + box.h};
  return {x: tg.x > cx ? box.x + box.w : box.x, y: clamp(tg.y, box.y + 8, box.y + box.h - 8)};
  // (cy kept for readability)
}

/** Does segment a→b cross box (expanded by pad)? Liang–Barsky clip test. */
export function segmentHitsBox(a, b, box, pad = 0) {
  const x0 = box.x - pad, y0 = box.y - pad, x1 = box.x + box.w + pad, y1 = box.y + box.h + pad;
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  const clip = (pp, q) => {
    if (pp === 0) return q >= 0;
    const tt = q / pp;
    if (pp < 0) { if (tt > t1) return false; if (tt > t0) t0 = tt; } else { if (tt < t0) return false; if (tt < t1) t1 = tt; }
    return true;
  };
  return clip(-dx, a.x - x0) && clip(dx, x1 - a.x) && clip(-dy, a.y - y0) && clip(dy, y1 - a.y) && t0 < t1;
}

/**
 * Best free spot for a w×h chip in the zones, closest to the target, whose
 * leader to the target does not cross any obstacle (obstacles containing the
 * target itself are allowed only for the last stretch).
 */
export function bestSpot(w, hh, zones, obstacles, tg, o = {}) {
  const pad = o.pad ?? 10;
  const step = o.step ?? 12;
  let best = null;
  const inside = (q, b) => q.x >= b.x && q.x <= b.x + b.w && q.y >= b.y && q.y <= b.y + b.h;
  const blockers = obstacles.filter(b => !inside(tg, b));
  const hosts = obstacles.filter(b => inside(tg, b));
  for (const z of zones) {
    if (w > z.w || hh > z.h) continue;
    for (let y = z.y; y <= z.y + z.h - hh + 0.01; y += step) {
      for (let x = z.x; x <= z.x + z.w - w + 0.01; x += step) {
        const b = {x, y, w, h: hh};
        if (obstacles.some(q => overlaps(b, q, pad))) continue;
        const from = leaderStart(b, tg);
        const len = Math.hypot(tg.x - from.x, tg.y - from.y);
        if (len < (o.minLead ?? 0) && !inside(tg, b)) continue;
        if (len > (o.maxLead ?? 1e9)) continue;
        if (!o.noLeader && blockers.some(q => segmentHitsBox(from, tg, q, 2))) continue;
        // inside the host (e.g. the ruler) the leader may only run a short way
        const hostRun = hosts.length ? hostPenalty(from, tg, hosts[0]) : 0;
        if (hostRun > (o.maxHostRun ?? 1e9)) continue;
        const score = len + hostRun * 3;
        if (!best || score < best.score) best = {x, y, score};
      }
    }
  }
  return best;
}

function hostPenalty(from, tg, host) {
  // length of the leader inside the host box (approximate by sampling)
  let inside = 0;
  const n = 20;
  for (let i = 1; i <= n; i++) {
    const q = {x: from.x + (tg.x - from.x) * (i / n), y: from.y + (tg.y - from.y) * (i / n)};
    if (q.x >= host.x && q.x <= host.x + host.w && q.y >= host.y && q.y <= host.y + host.h) inside++;
  }
  return (inside / n) * Math.hypot(tg.x - from.x, tg.y - from.y);
}

/**
 * Status tag (dot + words) with bounded wrapping. Local layout only.
 */
export function stateTag(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size ?? 26;
  const f = ctx.fit(text, {maxWidth: o.maxWidth - size * 2.2, size, minSize: size * 0.78, maxLines: o.maxLines ?? 2, weight: 800});
  const w = f.width + size * 2.2;
  const hh = f.height + size * 0.9;
  return {
    w, h: hh,
    build: (x, y) => g({name: o.name, opacity: 0},
      h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.9)), fill: th.card, stroke: o.color ?? th.ink, 'stroke-width': 2.5}),
      h('circle', {cx: x + size * 0.85, cy: y + hh / 2, r: size * 0.3, fill: o.color ?? th.ink}),
      textBlock(f, {x: x + size * 1.5, y: y + size * 0.45, fill: o.color ?? th.ink})),
  };
}

/* ------------------------------------------------------------------------ */
/* Diagram pieces (mechanism / inspect)                                     */
/* ------------------------------------------------------------------------ */

/**
 * Editable hierarchy drawn as a small ladder of level plates (front view).
 * The level holding the source is outlined. Local origin = top-left.
 * @returns {{node:any, w:number, h:number, rowCenter:(i:number)=>{x:number,y:number}}}
 */
export function levelLadder(ctx, o) {
  const th = ctx.theme;
  const {w} = o;
  const size = o.size ?? 22;
  const showKey = ctx.show('key');
  // text stays clear of the i + 1 index pips at the right of each plate
  const fits = o.levels.map((l, i) => (showKey ? fitWords(ctx, l, {maxWidth: w - 38 - 30 - (i + 1) * 11 - 8, size, minSize: size * 0.92, maxLines: 3, weight: 700}) : null));
  sinkSizes(o.sink, ...fits);
  const rowH = Math.max(56, ...fits.map(f => (f ? f.height + 24 : 0)));
  const gap = 12;
  const hh = o.levels.length * (rowH + gap) - gap + 28;
  const parts = [
    h('path', {d: roundRectPath(6, 9, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: 14, y: 8, width: 8, height: hh - 16, rx: 4, fill: shade(th.woodDark, -0.25)}),
    h('rect', {x: w - 22, y: 8, width: 8, height: hh - 16, rx: 4, fill: shade(th.woodDark, -0.25)}),
  ];
  o.levels.forEach((_, i) => {
    const y = 14 + i * (rowH + gap);
    const hl = i === o.highlight;
    parts.push(h('path', {d: roundRectPath(26, y, w - 52, rowH, 8), fill: hl ? '#fbf3dc' : th.woodTop, stroke: hl ? th.accent2 : th.ink, 'stroke-width': hl ? 4 : 2}));
    for (let k = 0; k <= i; k++) parts.push(h('rect', {x: w - 48 - k * 11, y: y + 8, width: 6, height: rowH - 16, rx: 3, fill: shade(th.woodDark, -0.1)}));
    if (fits[i]) parts.push(textBlock(fits[i], {x: 38, y: y + (rowH - fits[i].height) / 2, fill: th.ink}));
    else parts.push(h('rect', {x: 38, y: y + rowH / 2 - 5, width: (w - 110) * 0.7, height: 10, rx: 5, fill: th.ink, opacity: 0.55}));
  });
  return {node: g(null, parts), w, h: hh, rowCenter: i => ({x: w / 2, y: 14 + i * (rowH + gap) + rowH / 2})};
}

/** Attributed reading note (sticky note). Local origin = top-left. */
export function readingNote(ctx, o) {
  const th = ctx.theme;
  const {w} = o;
  const pad = 16;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const headFit = showKey ? fitWords(ctx, o.head, {maxWidth: w - pad * 2, size: o.size ?? 22, minSize: 17, maxLines: 2, weight: 800}) : null;
  const bySz = o.bySize ?? (o.size ?? 22) * 0.95;
  const byFit = showKey ? fitWords(ctx, o.by, {maxWidth: w - pad * 2, size: bySz, minSize: bySz * 0.95, floorSize: 17, maxLines: 3, weight: 600}) : null;
  // (the reading text is supplied: it keeps ≥ ~16 px and wraps to more lines instead of shrinking)
  const txSz = o.textSize ?? (o.size ?? 22) * 0.95;
  const txtFit = showAll && o.text ? fitWords(ctx, o.text, {maxWidth: w - pad * 2, size: txSz, minSize: txSz * 0.97, floorSize: 17, maxLines: 6, weight: 400, family: 'serif'}) : null;
  let y = pad;
  const body = [];
  // optional caption band: the part's supplied element label printed on the note itself (square layouts)
  let captionBand = null;
  if (o.caption && showKey) {
    const cf = fitWords(ctx, o.caption, {maxWidth: w - pad * 2, size: o.captionSize ?? 20, minSize: o.captionSize ?? 20, floorSize: o.captionSize ?? 20, maxLines: 3, weight: 800});
    body.push(textBlock(cf, {x: pad, y, fill: th.ink, name: o.bandName}));
    y += cf.height + 8;
    body.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: shade('#e0a458', -0.35), 'stroke-width': 2}));
    y += 10;
    captionBand = {size: cf.size, h: y, truncated: Boolean(cf.truncated)};
  }
  sinkSizes(o.sink, captionBand ? null : headFit, byFit, txtFit);
  // (with a caption band the built-in heading would repeat it: it is left out)
  if (headFit && !captionBand) { body.push(textBlock(headFit, {x: pad, y, fill: shade('#e0a458', -0.55)})); y += headFit.height + 8; }
  else if (!headFit && !captionBand) { body.push(h('rect', {x: pad, y: y + 2, width: w * 0.5, height: 10, rx: 5, fill: shade('#e0a458', -0.45)})); y += 22; }
  if (byFit) { body.push(textBlock(byFit, {x: pad, y, fill: th.ink})); y += byFit.height + 8; } else { body.push(h('rect', {x: pad, y: y + 2, width: w * 0.62, height: 8, rx: 4, fill: th.ink, opacity: 0.5})); y += 18; }
  if (txtFit) { body.push(textBlock(txtFit, {x: pad, y, fill: th.inkSoft, italic: true})); y += txtFit.height + 6; } else { for (let i = 0; i < 2; i++) body.push(h('rect', {x: pad, y: y + i * 14, width: (w - pad * 2) * (i ? 0.6 : 0.9), height: 6, rx: 3, fill: '#c9a45f'})); y += 30; }
  const hh = y + pad - 4;
  return {
    node: g(null,
      h('path', {d: roundRectPath(6, 9, w, hh, 6), fill: th.shadow}),
      h('path', {d: `M0 0H${w}V${hh - 26}L${w - 26} ${hh}H0Z`, fill: '#f8e3a3', stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${w} ${hh - 26}H${w - 22}Q${w - 26} ${hh - 26} ${w - 26} ${hh - 22}V${hh}Z`, fill: '#e8c877', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('rect', {x: w / 2 - 34, y: -10, width: 68, height: 20, rx: 3, fill: '#ffffff', opacity: 0.75, stroke: th.inkSoft, 'stroke-width': 1}),
      body),
    w, h: hh, captionBand,
  };
}

/** Magnifying glass (lupa). Local origin = lens centre; the handle points down-right. */
export function magnifier(ctx, name, R, o = {}) {
  const th = ctx.theme;
  const a = (o.handleDeg ?? 40) * Math.PI / 180;
  const hx = Math.cos(a), hy = Math.sin(a);
  const hl = R * 1.05;
  const p0 = {x: hx * R, y: hy * R};
  const p1 = {x: hx * (R + hl), y: hy * (R + hl)};
  return g({name, opacity: o.opacity},
    h('line', {x1: r(p0.x + 5), y1: r(p0.y + 8), x2: r(p1.x + 5), y2: r(p1.y + 8), stroke: th.shadow, 'stroke-width': R * 0.34, 'stroke-linecap': 'round'}),
    h('line', {x1: r(p0.x), y1: r(p0.y), x2: r(p1.x), y2: r(p1.y), stroke: th.ink, 'stroke-width': R * 0.3, 'stroke-linecap': 'round'}),
    h('line', {x1: r(p0.x + hx * R * 0.2), y1: r(p0.y + hy * R * 0.2), x2: r(p1.x), y2: r(p1.y), stroke: '#6d4c35', 'stroke-width': R * 0.22, 'stroke-linecap': 'round'}),
    h('circle', {r: R + 7, fill: 'none', stroke: th.ink, 'stroke-width': 16}),
    h('circle', {r: R + 7, fill: 'none', stroke: th.metal, 'stroke-width': 10}),
    h('circle', {r: R, fill: '#dff1ff', opacity: 0.18}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.28)}A${r(R * 0.68)} ${r(R * 0.68)} 0 0 1 ${r(-R * 0.18)} ${r(-R * 0.66)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.8}),
  );
}

/**
 * Compact fact tag for diagrams: icon, day chip and label. Local origin =
 * top-left. Returns the box and a strip area for state marks.
 */
export function factTag(ctx, o) {
  const th = ctx.theme;
  const {w, fact} = o;
  const pad = 10;
  const showKey = ctx.show('key');
  const size = o.size ?? 22;
  const dayFit = showKey ? ctx.fit(o.dayText, {maxWidth: w - 70, size: size * 0.95, minSize: 14, maxLines: 1, weight: 800}) : null;
  const labFit = showKey ? fitWords(ctx, fact.label, {maxWidth: w - pad * 2, size, minSize: size * 0.8, maxLines: 3, weight: 600}) : null;
  return {dayFit, labFit, h: pad + 40 + 6 + (labFit ? labFit.height : 22) + pad + 30 + 8};
}

/* ------------------------------------------------------------------------ */
/* Compact paired-comparison desk (contrast)                                */
/* ------------------------------------------------------------------------ */

/**
 * Panel geometry. 'h': horizontal ruler (book top-left, article lands above
 * the ruler, facts below); 'v': vertical ruler (book top-left, article lands
 * left of the ruler, facts on the right). Sizes in design units.
 */
export const PANEL = {
  // (txt.factMin: the fact text never shrinks below it — key content stays ≥ ~16 px at 1080p in every ratio)
  h: {w: 880, h: 560, book: {x: 14, y: 12, w: 370, h: 92}, ruler: {o: 'h', a0: 12, a1: 868, c: 356, thick: 60, pad: 46},
    facts: {drop: 20, w: 194, gap: 10, lo: 8, hi: 872, maxBottom: 555}, card: {w: 244, hx: 30}, hold: {x: 700, y: 222},
    arm: {upper: 400, lower: 380, width: 48, handScale: 1.2}, reach: {off: 70, dy: 700}, txt: {fact: 22, factMin: 20, day: 22, strip: 22, num: 22, ref: 23, iv: 27, book: 22, ivLab: 22, cardFloor: 19.8}},
  // (vertical lanes use the width the square box leaves free: the lanes are height-limited there)
  v: {w: 562, h: 726, book: {x: 12, y: 10, w: 430, h: 108}, ruler: {o: 'v', a0: 136, a1: 720, c: 262, thick: 58, pad: 40},
    facts: {near: 306, w: 250, gap: 4, lo: 140, hi: 720}, card: {w: 226, hx: 30}, hold: {x: 118, y: 636},
    arm: {upper: 400, lower: 380, width: 48, handScale: 1.2}, reach: {off: 70, dy: 700}, txt: {fact: 25.5, factMin: 22, day: 25.5, strip: 25.5, num: 23, ref: 25.5, iv: 28.5, book: 25.5, ivLab: 25.5, cardFloor: 21.6}},
};

/**
 * One complete compact desk for the paired comparison. The changed fact is
 * held by the reader at rest (same place in both panels) and pinned at its
 * panel's day; the slots of BOTH candidate days are reserved, so every other
 * fact card sits at exactly the same place in the two panels.
 * @param {any} ctx
 * @param {{prefix:string, orient:'h'|'v', d:any, changed:{index:number, dayA:number, dayB:number}, which:'A'|'B', reader?:any, intervalLabel?:string}} o
 */
export function scopePanel(ctx, o) {
  const th = ctx.theme;
  const C = stateColors(ctx);
  const t = ctx.t;
  const P = o.prefix;
  const G = PANEL[o.orient];
  const hor = o.orient === 'h';
  const TX = G.txt;
  const d = o.d;
  const W = G.w, H = G.h;
  const ci = o.changed.index;
  const dayOf = f => (f.i === ci ? (o.which === 'A' ? o.changed.dayA : o.changed.dayB) : f.day);
  const cl = v => Math.max(d.from, Math.min(d.to, v));
  const facts = d.facts.map(f => {
    const day = cl(dayOf(f));
    return {...f, day, state: factState(day, f.forced ? 'not-classified' : 'auto', d.start, d.end)};
  });

  // ---- article card spec (measured first: in vertical panels the ruler starts below the resting card)
  // (the compact panel card shows the article's simulated clause wording as filler lines — the schema's
  // "simulated clause wording" on the prop; the reference and the supplied interval are printed in full)
  // (horizontal panels: when the supplied start is close to the ruler's left end, the card narrows — never
  // below 200 units — so it can still lie before the start day, clear of the tape and of the pulling arm)
  let cardW = G.card.w;
  if (hor) {
    const s0 = rulerGeometry(unitRuler(ctx, G.ruler, d, TX.num), d).along(d.start);
    if (s0 - cardW - 4 < 4) cardW = Math.max(200, Math.floor(s0 - 8));
  }
  const mkCardSpec = k => ({w: cardW, hx: G.card.hx, edge: hor ? 'bottom' : 'right', ref: d.article.ref, text: '',
    intervalPhrases: intervalPhrases(d, d.start, d.end), intervalLabel: o.intervalLabel || t.suppliedInterval,
    refSize: Math.max(TX.ref * k, TX.cardFloor), ivSize: Math.max(TX.iv * k, TX.fact + 1.5), ivLabSize: Math.max(TX.ivLab * k, TX.cardFloor), minH: 120, refLines: 3, refOneLineMin: 0.97, refMin: TX.cardFloor, ivMinK: 0.97});
  // the card's reference and caption shrink a little (never below ~16 px; the supplied interval keeps its size,
  // the largest content text) until the card fits: under the open book (horizontal lanes: the card lies
  // before the start day) or above a fact column that holds every slot (vertical lanes)
  const Bt = G.book;
  const titleProbe0 = ctx.show('key') ? fitInBox(ctx, d.sources[d.sourceIndex].label, {maxWidth: Bt.w / 2 - 10 - 22, maxHeight: 1e4, size: TX.book, minSize: TX.book * 0.92, floorSize: TX.book * 0.92, weight: 700, family: 'serif'}) : null;
  const bookBottom0 = Bt.y + Math.min(170, Math.max(Bt.h, titleProbe0 ? titleProbe0.height + 30 : 0));
  let cardSpec = mkCardSpec(1);
  for (const k of [1, 0.94, 0.88, 0.82, 0.76, 0.7]) {
    cardSpec = mkCardSpec(k);
    const pr = articleCard(ctx, cardSpec);
    let ok;
    if (hor) {
      const g0 = rulerGeometry(unitRuler(ctx, G.ruler, d, TX.num), d);
      ok = g0.along(d.start) - pr.w - 4 < 2 || g0.e0 - 6 - pr.h >= bookBottom0 + 12;
    } else {
      // (vertical lanes: the card rests on the book's left page, above its own column; the ruler and the
      // facts start under the book, and the card must fit above the start day to lie before it)
      const a0 = Math.max(G.ruler.a0, bookBottom0 + 12);
      const s0 = rulerGeometry(unitRuler(ctx, {...G.ruler, a0}, d, TX.num), d).along(d.start);
      ok = s0 - pr.h - 4 >= Bt.y + 2;
    }
    if (ok) break;
  }
  const sink = [];
  const probe = articleCard(ctx, {...cardSpec, sink});
  const CW = probe.w, CH = probe.h;

  // ---- ruler, tape
  const RG = unitRuler(ctx, hor ? G.ruler : {...G.ruler, a0: Math.max(G.ruler.a0, bookBottom0 + 12)}, d, TX.num);
  const geo = rulerGeometry(RG, d);
  const ruler = rulerArt(ctx, {name: `${P}-ruler`, R: RG, d, geo, numSize: TX.num, minLabelGap: TX.num * 2.1});
  const startA = geo.along(d.start), endA = geo.along(d.end);
  const tape = tapeArt(ctx, {P: `${P}-tape`, geo, R: RG});
  // (as on the story desk: the card lies before the start day, the tape runs away from it)
  // (the open book grows to hold its supplied title at a readable size; never taller than 150 units)
  const B0 = G.book;
  const titleProbe = ctx.show('key') ? fitInBox(ctx, d.sources[d.sourceIndex].label, {maxWidth: B0.w / 2 - 10 - 22, maxHeight: 1e4, size: TX.book, minSize: TX.book * 0.92, floorSize: TX.book * 0.92, weight: 700, family: 'serif'}) : null;
  const B = {...B0, h: Math.min(170, Math.max(B0.h, titleProbe ? titleProbe.height + 30 : 0))};
  const cdx = startA - CW - 4, cdy = startA - CH - 4;
  const cBefore = hor ? {x: cdx, y: geo.e0 - 6 - CH} : {x: geo.e0 - 6 - CW, y: cdy};
  // horizontal panels: a card lying before the start day that would reach the open book moves the book to
  // its right (the book's supplied title stays uncovered, and the card stays clear of the tape and the arm)
  if (hor && cdx >= 2 && overlaps({...cBefore, w: CW, h: CH}, {x: B.x, y: B.y, w: B.w, h: B.h + 8}, 4)) B.x = cdx + CW + 16;
  // (never on the open book, whose supplied title stays readable)
  const bookWv = Math.min(B.w, 2 * (W - 14 - B.x - CW - 10));
  // (horizontal lanes: the whole book stays uncovered; vertical lanes: only its right page, which carries
  // the title — the left page is where the card rested)
  const bookBox0 = hor ? {x: B.x, y: B.y, w: B.w, h: B.h + 8} : {x: B.x + bookWv / 2 + 4, y: B.y, w: bookWv / 2 - 4, h: B.h + 8};
  const clearOfBook = c => !overlaps({...c, w: CW, h: CH}, bookBox0, hor ? 4 : 0);
  const cAfter = hor ? {x: clamp(startA - G.card.hx, RG.a0 - 6, RG.a1 + 6 - CW), y: geo.e0 - 6 - CH} : {x: geo.e0 - 6 - CW, y: clamp(startA - G.card.hx, RG.a0 - 6, RG.a1 + 6 - CH)};
  const cardDest = (hor ? cdx >= 2 : cdy >= B.y + 2) && clearOfBook(cBefore) ? cBefore : cAfter;
  const hxDest = hor ? startA - cardDest.x : startA - cardDest.y;

  const bookW = hor ? Math.min(B.w, 2 * (W - 16 - B.x - 10 - CW - 8)) : bookWv;
  // (horizontal lanes: the card rests on the book's right page; vertical lanes: on its left page, straight
  // above the card column — the ruler and the facts never start under a resting card)
  const cardRest = hor ? {x: B.x + bookW / 2 + 8, y: B.y + 2} : {x: Math.max(1, geo.e0 - 6 - CW), y: B.y + 2};
  const slotLocal = hor ? {x: cardRest.x - B.x + 4, y: 10, w: bookW - (cardRest.x - B.x) - 12, h: B.h - 22} : {x: 10, y: 10, w: bookW / 2 - 18, h: B.h - 22};
  const bookNode = openBook(ctx, {x: B.x, y: B.y, w: bookW, h: B.h, color: BOOK_COLORS[d.sourceIndex % BOOK_COLORS.length], title: d.sources[d.sourceIndex].label, seed: `${P}-ob`, titleSize: TX.book, titleMin: TX.book * 0.92, sink,
    titleRight: !hor, slotName: `${P}-slot`, slot: slotLocal}).node;
  const cardGroup = name => g({name},
    h('path', {name: `${name}-shadow`, d: roundRectPath(0, 0, CW, CH, 9), fill: th.shadow}),
    g(null, ...articleCard(ctx, {...cardSpec, hx: hxDest}).parts));

  // ---- facts: slots for every fact + both candidate days of the changed one
  const fw = G.facts.w;
  const all = [...d.facts.map(f => ({f, day: f.i === ci ? cl(o.changed.dayA) : f.day, key: f.i === ci ? 'A' : `f${f.i}`})), {f: d.facts[ci], day: cl(o.changed.dayB), key: 'B'}];
  let fsize = TX.fact;
  const cmp = true;
  const measureAll = () => d.facts.map(f => measureFact(ctx, f, {w: fw, dayText: d.dayText(dayOf(f)), labelSize: fsize, daySize: TX.day, stripSize: TX.strip, compact: cmp}));
  let measures = measureAll();
  // the changed card is measured with both day texts so it has the same size in both panels
  const mA = measureFact(ctx, d.facts[ci], {w: fw, dayText: d.dayText(cl(o.changed.dayA)), labelSize: fsize, daySize: TX.day, stripSize: TX.strip, compact: cmp});
  const mB = measureFact(ctx, d.facts[ci], {w: fw, dayText: d.dayText(cl(o.changed.dayB)), labelSize: fsize, daySize: TX.day, stripSize: TX.strip, compact: cmp});
  const factsTop = hor ? geo.e1 + G.facts.drop : 0;
  const avail = hor ? G.facts.maxBottom - factsTop : (G.facts.hi - Math.max(G.facts.lo, RG.a0 - 4) - (all.length - 1) * G.facts.gap) / all.length;
  let fh = Math.max(...measures.map(m => m.h), mA.h, mB.h);
  while (fh > avail && fsize > (TX.factMin ?? TX.fact * 0.78)) {
    fsize -= 1;
    measures = measureAll();
    fh = Math.max(...measures.map(m => m.h), measureFact(ctx, d.facts[ci], {w: fw, dayText: d.dayText(cl(o.changed.dayB)), labelSize: fsize, daySize: TX.day, stripSize: TX.strip, compact: cmp}).h);
  }
  const pos = hor
    ? relax1d(all.map(q => ({c: geo.along(q.day), s: fw})), G.facts.gap, G.facts.lo, G.facts.hi)
    : relax1d(all.map(q => ({c: geo.along(q.day), s: fh})), G.facts.gap, Math.max(G.facts.lo, RG.a0 - 4), G.facts.hi);
  const slotOf = key => {
    const k = all.findIndex(q => q.key === key);
    return hor ? {x: pos[k] - fw / 2, y: factsTop, w: fw, h: fh} : {x: G.facts.near, y: pos[k] - fh / 2, w: fw, h: fh};
  };
  const factBoxes = facts.map(f => slotOf(f.i === ci ? o.which : `f${f.i}`));
  const pinCross = RG.thick / 2 - 12;
  const pins = facts.map(f => geo.at(f.day, pinCross));
  const anchorOf = b => (hor ? {x: b.x + b.w / 2, y: b.y} : {x: b.x, y: b.y + b.h / 2});
  const factNodes = facts.map((f, i) => {
    const fc = factCard(ctx, {prefix: `${P}-f${i}`, w: fw, h: fh, fact: f, measure: measures[i], t, stripSize: TX.strip, dayName: i === ci ? `${P}-cday` : undefined});
    return fc.parts;
  });
  // the held (changed) fact: its card is a movable group; the others are static
  const holdX = hor ? G.hold.x : 8 + (fw * Math.min(1.04, (geo.e0 - 16) / fw)) / 2;
  const holdBox = {x: holdX - fw / 2, y: G.hold.y - fh / 2, w: fw, h: fh};
  const staticFacts = facts.map((f, i) => (i === ci ? null : g({name: `${P}-f${i}`, transform: T(factBoxes[i].x, factBoxes[i].y)}, factNodes[i])));
  const movingFact = g({name: `${P}-f${ci}`}, h('path', {name: `${P}-f${ci}-sh`, d: roundRectPath(0, 0, fw, fh, 10), fill: th.shadow}), factNodes[ci]);
  const threads = facts.map((f, i) => g({name: `${P}-thg${i}`, opacity: i === ci ? 0 : 1},
    h('line', {name: `${P}-th${i}`, x1: r(pins[i].x), y1: r(pins[i].y), x2: r(anchorOf(factBoxes[i]).x), y2: r(anchorOf(factBoxes[i]).y), stroke: th.inkSoft, 'stroke-width': 2.2}),
    h('line', {name: `${P}-thi${i}`, x1: r(pins[i].x), y1: r(pins[i].y), x2: r(anchorOf(factBoxes[i]).x), y2: r(anchorOf(factBoxes[i]).y), stroke: C.inside, 'stroke-width': 4, opacity: 0}),
    h('circle', {cx: r(anchorOf(factBoxes[i]).x), cy: r(anchorOf(factBoxes[i]).y), r: 5, fill: th.ink})));
  const pinNodes = facts.map((f, i) => g({name: `${P}-pg${i}`, transform: T(pins[i].x, pins[i].y), opacity: i === ci ? 0 : 1}, pushPin(ctx, `${P}-pin${i}`, 10)));

  // ---- arm
  const look = actorLook(ctx, o.reader, 0);
  const arm = topArm(ctx, {name: `${P}-arm`, skin: look.skin, sleeve: look.outfit, handed: 'right', ...G.arm});
  // The reader sits off-stage and LEANS: the shoulder stays at ~99.8 % of the arm's reach from the hand, so
  // the arm is almost straight (no folded V) and every target is reachable. Its direction depends on where
  // the hand works — horizontal panels: from the right, slightly above the hand, turning to come from the
  // upper right while the hand lays a card in the fact row (the card is held by its TOP edge), so the arm
  // never lies over — or sweeps across — the fact row; vertical panels: from below, turning to the
  // lower-left when the hand works in the fact column (the arm stays over the ruler / card column).
  const REACH = arm.reach * 0.998;
  const deg = Math.PI / 180;
  const factsNear = hor ? geo.e1 + G.facts.drop + 60 : G.facts.near + 40;
  const armDir = (q, holding) => {
    // while the hand holds the changed card (rest → laid in its slot) the arm keeps the fact-side direction
    // (vertical panels: from below while the card is held in the card column, turning to come from the left
    // while it slides across the ruler into its slot — `holding` is that slide's progress)
    if (holding !== false) { const kk = clamp(holding); return hor ? -50 * deg : lerp(90, 170, kk * kk * (3 - 2 * kk)) * deg; }
    // vertical panels: from below while the hand works on the card / the ruler; from the left (over the ruler
    // and the empty card column) while it works in the fact column or holds the changed card at the bottom-left
    const holdTop = G.hold.y - 120;
    const k = hor ? clamp((q.y - geo.e1 + 12) / 36) : Math.max(clamp((q.x - geo.e1) / (G.facts.near - geo.e1 + 1)), clamp((q.y - holdTop) / 60));
    const e = k * k * (3 - 2 * k);
    return hor ? lerp(0, -50, e) * deg : lerp(100, 170, e) * deg;
  };
  const shoulderFor = (q, holding = false) => {
    const a = armDir(q, holding);
    return {x: q.x + Math.cos(a) * REACH, y: q.y + Math.sin(a) * REACH};
  };
  // the elbow bends to the side away from the facts (up for horizontal panels, left for vertical ones);
  // the bend side is fixed per panel so the elbow never flips
  const bendSide = (() => {
    const q = hor ? {x: W * 0.5, y: RG.c} : {x: RG.c, y: H * 0.5};
    const el = b => ik2(shoulderFor(q), q, G.arm.upper, arm.reach - G.arm.upper, b).elbow;
    return hor ? (el(1).y < el(-1).y ? 1 : -1) : (el(1).x < el(-1).x ? 1 : -1);
  })();

  const clipId = `${P}-clip`;
  const grain = [];
  for (let i = 0; i < 6; i++) {
    const gy = ((i + 0.5) / 6) * H + (ctx.rng('panel-grain', i) - 0.5) * 20;
    const wob = 8 + ctx.rng('panel-wob', i) * 10;
    grain.push(h('path', {d: `M0 ${r(gy)}C${r(W * 0.3)} ${r(gy - wob)} ${r(W * 0.62)} ${r(gy + wob)} ${W} ${r(gy - wob * 0.4)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.5}));
  }
  const node = g({name: P},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(0, 0, W, H, 24)}))),
    h('path', {d: roundRectPath(0, 0, W, H, 24), fill: th.woodTop}),
    g({'clip-path': ctx.ref(clipId)},
      grain,
      g({name: `${P}-book`}, bookNode),
      cardGroup(`${P}-cardK`),
      ruler,
      tape.node,
      threads,
      pinNodes,
      staticFacts,
      cardGroup(`${P}-cardD`),
      // the hand pinches the carried card from beneath: palm and thumb under it, only the palm edge outside
      arm.arm, arm.palm, arm.thumb,
      movingFact,
      cardGroup(`${P}-cardH`),
    ),
    h('path', {d: roundRectPath(0, 0, W, H, 24), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2}),
  );

  // ---- poses
  // the reader pinches the fact card by its lower edge (the blank status strip), never over its label or day
  // horizontal panels: the changed card is pinched by its top edge above its icon (palm outside the card,
  // clear of its day chip, pin and thread); vertical panels: by its left edge, above the bottom strip (the palm
  // never reaches the card stacked below it). The article card: by its
  // right edge (horizontal), or by its bottom edge with the palm under it and the arm below it (vertical),
  // so the arm never lies over the card's own text.
  const factGrip = b => (hor ? {x: b.x + 30, y: b.y - 8} : {x: b.x + 14, y: b.y + b.h - 32});
  const cardGripHand = cp => (hor ? {x: cp.x + CW - 2, y: cp.y + CH * 0.5} : {x: cp.x + 12, y: cp.y + CH + 20});
  // (the reader pulls the clip by its end on the card side of the ruler: the arm never lies on the numbers)
  // (a card lying before the start leaves the band above the ruler free: the tab is held higher there; a card
  // lying after the start is passed with the hand close to the ruler's edge, clear of the card's text)
  const cardBeforeStart = hor ? cardDest.x + CW <= startA : cardDest.y + CH <= startA;
  // (horizontal lanes, card before the start: the hand holds the tab ~50 units along the pull, so its fingers
  // — pointing back towards the card — stay off the card's printed interval)
  const tabPoint = a => (hor ? {x: a + (cardBeforeStart ? 50 : 0), y: geo.e0 - (cardBeforeStart ? 30 : 14)} : {x: geo.e0 - 34, y: a + (cardBeforeStart ? 36 : 0)});
  const hk0 = hor ? 1.04 : Math.min(1.04, (geo.e0 - 16) / fw);
  const restHand = factGrip({x: holdBox.x + fw / 2 - (fw * hk0) / 2, y: holdBox.y + fh / 2 - (fh * hk0) / 2, w: fw * hk0, h: fh * hk0});
  const park = hor ? {x: W + 420, y: restHand.y} : {x: restHand.x, y: H + 420};
  const liftK = 1.05;

  /**
   * @param {{place:number, pin:number, toCard:number, carry:number, toTab:number, pull:number, back:number, classify?:number[], strips?:number[]}} v
   */
  function pose(v) {
    const nodes = {};
    // changed fact card: held → carried to its slot → lying
    const slot = factBoxes[ci];
    const pl = ease.inOutCubic(clamp(v.place));
    const liftF = Math.sin(Math.PI * pl) * 0.05;
    // (vertical panels: up the card column to the slot's height, then straight across the ruler into the slot,
    // so the carried card never passes over a neighbouring fact card)
    const s1 = ease.inOutSine(clamp(pl / 0.6)), s2 = ease.inOutSine(clamp((pl - 0.6) / 0.4));
    const fx = hor ? lerp(holdBox.x, slot.x, pl) : lerp(holdBox.x, slot.x, s2);
    const fy = hor ? lerp(holdBox.y, slot.y, pl) - Math.sin(Math.PI * pl) * 30 : lerp(holdBox.y, slot.y, s1);
    // (vertical panels: the held card is shown slightly smaller so it stays whole inside the card column)
    const heldK = hor ? 1.04 : Math.min(1.04, (geo.e0 - 16) / fw);
    const fk = v.place >= 1 ? 1 : hor ? 1.04 + liftF - 0.04 * pl : lerp(heldK, 1, s2);
    nodes[`${P}-f${ci}`] = {transform: `${T(fx + fw / 2, fy + fh / 2, 0, fk)} ${T(-fw / 2, -fh / 2)}`};
    nodes[`${P}-f${ci}-sh`] = {transform: T(v.place >= 1 ? 5 : 12, v.place >= 1 ? 8 : 16)};
    // its pin drops once the card lies in its slot, then the thread appears
    const pinP = clamp(v.pin);
    nodes[`${P}-pg${ci}`] = {opacity: r(clamp(pinP * 2), 3), transform: `${T(pins[ci].x, pins[ci].y - (1 - ease.outCubic(clamp(pinP * 2))) * 24)}`};
    nodes[`${P}-thg${ci}`] = {opacity: r(clamp(pinP * 2 - 1), 3)};
    nodes[`${P}-cday`] = {opacity: r(clamp(pinP * 2), 3)};
    nodes[`${P}-cday-blank`] = {opacity: r(1 - clamp(pinP * 2), 3)};

    // article card
    let cp = {x: cardRest.x, y: cardRest.y, k: 1};
    let holder = 'book';
    if (v.carry > 0) {
      const e = ease.inOutCubic(v.carry);
      const mid = {x: lerp(cardRest.x, cardDest.x, 0.5), y: Math.min(cardRest.y, cardDest.y) - 20};
      const q = cubic(cardRest, mid, {x: cardDest.x, y: cardDest.y - 20}, cardDest, e);
      cp = {x: q.x, y: q.y, k: v.carry >= 1 ? 1 : lerp(liftK, 1, seg(v.carry, 0.8, 1))};
      holder = v.carry >= 1 ? 'ruler' : 'hand';
    }
    const cardT = `${T(cp.x + CW / 2, cp.y + CH / 2, 0, cp.k)} ${T(-CW / 2, -CH / 2)}`;
    nodes[`${P}-cardK`] = {transform: cardT, opacity: holder === 'book' ? 1 : 0};
    nodes[`${P}-cardH`] = {transform: cardT, opacity: holder === 'hand' ? 1 : 0};
    nodes[`${P}-cardD`] = {transform: cardT, opacity: holder === 'ruler' ? 1 : 0};
    nodes[`${P}-cardH-shadow`] = {transform: T(12, 16)};
    nodes[`${P}-cardK-shadow`] = {transform: T(5, 7)};
    nodes[`${P}-cardD-shadow`] = {transform: T(5, 7)};
    nodes[`${P}-slot`] = {opacity: holder === 'book' ? 0 : 1};

    // tape
    const pullP = clamp(v.pull);
    const tapeA = lerp(startA, endA, ease.inOutCubic(pullP));
    Object.assign(nodes, tape.frame(startA, tapeA, v.carry >= 1 ? 1 : 0));

    // states
    const states = [];
    facts.forEach((f, i) => {
      const cls = v.classify ? clamp(v.classify[i]) : 0;
      const strip = v.strips ? clamp(v.strips[i]) : 0;
      const st = f.state;
      nodes[`${P}-pin${i}-in`] = {opacity: st === 'inside' ? r(cls, 3) : 0};
      nodes[`${P}-pin${i}-out`] = {opacity: st === 'outside' ? r(cls, 3) : 0};
      nodes[`${P}-pin${i}-unc`] = {opacity: st === 'unclassified' ? r(cls, 3) : 0};
      nodes[`${P}-thi${i}`] = {...(nodes[`${P}-thi${i}`] || {}), opacity: st === 'inside' ? r(cls, 3) : 0};
      nodes[`${P}-th${i}`] = {...(nodes[`${P}-th${i}`] || {}), 'stroke-dasharray': st === 'outside' && cls > 0.5 ? '7 6' : 'none'};
      nodes[`${P}-f${i}-s1`] = {opacity: st === 'inside' ? r(strip, 3) : 0};
      nodes[`${P}-f${i}-s2`] = {opacity: st === 'outside' ? r(strip, 3) : 0};
      nodes[`${P}-f${i}-s3`] = {opacity: st === 'unclassified' ? r(strip, 3) : 0};
      nodes[`${P}-f${i}-s0`] = {opacity: r(1 - strip, 3)};
      states.push(strip >= 1 ? st : 'neutral');
    });

    // hand
    // the grip sits on the card as drawn (scaled about its centre)
    const fGripNow = factGrip({x: fx + fw / 2 - (fw * fk) / 2, y: fy + fh / 2 - (fh * fk) / 2, w: fw * fk, h: fh * fk});
    const bookGrip = cardGripHand(cardRest);
    let target;
    if (v.back > 0) target = mix(tabPoint(endA), park, ease.inOutSine(v.back));
    else if (v.pull > 0) target = tabPoint(tapeA);
    else if (v.toTab > 0) {
      const e = ease.inOutCubic(v.toTab);
      {
        // horizontal: down the card's right edge onto the ruler, then along the ruler to the start clip;
        // vertical: along under the card to the ruler, then up the ruler — never across the card
        // (horizontal lanes: first sideways off the card, then down to the tab — never down the card's edge)
        const p0 = cardGripHand(cardDest), p2 = tabPoint(startA);
        // (vertical lanes: first down, away from the card's bottom edge where its interval is printed)
        const pts = hor ? [p0, {x: Math.max(p0.x + 50, p2.x), y: p0.y}, {x: Math.max(p0.x + 50, p2.x), y: p2.y}, p2]
          : [p0, {x: p0.x, y: Math.max(p0.y + 44, p2.y)}, {x: p2.x, y: Math.max(p0.y + 44, p2.y)}, p2];
        const lens = pts.slice(1).map((q, k) => Math.hypot(q.x - pts[k].x, q.y - pts[k].y));
        let at = e * lens.reduce((a2, b2) => a2 + b2, 0);
        let k = 0;
        while (k < lens.length - 1 && at > lens[k]) { at -= lens[k]; k++; }
        target = mix(pts[k], pts[k + 1], lens[k] ? Math.min(1, at / lens[k]) : 1);
      }
    } else if (v.carry > 0) target = cardGripHand(cp);
    else if (v.toCard > 0) {
      // vertical panels: out of the fact column to the card side of the ruler first, then up to the book
      const a = factGrip(slot), e = ease.inOutSine(v.toCard);
      if (hor) target = mix(a, bookGrip, e);
      else { const c = {x: geo.e0 - 22, y: a.y}; target = cubic(a, c, {x: c.x, y: lerp(c.y, bookGrip.y, 0.6)}, bookGrip, e); }
    }
    else target = fGripNow;
    const holdingFact = !(v.back > 0 || v.pull > 0 || v.toTab > 0 || v.carry > 0 || v.toCard > 0);
    const shoulder = shoulderFor(target, holdingFact ? (v.place >= 1 ? 1 : s2) : false);
    const sol = arm.pose(shoulder, target, bendSide);
    Object.assign(nodes, sol.nodes);
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const up = sol.nodes[`${P}-arm-upper`];
    const elbow = {x: up.x2, y: up.y2};
    // the parts of the arm drawn inside the panel, as segments (for the "arm over the facts" checks)
    const armSegs = [[shoulder, elbow], [elbow, sol.wrist], [sol.wrist, sol.hand]].map(([a, b]) => ({a: P2(a), b: P2(b)}));
    return {
      nodes,
      semantic: {
        hand: P2(sol.hand),
        factGrip: P2(fGripNow),
        cardGrip: P2(cardGripHand(cp)),
        card: P2({x: cp.x + CW / 2, y: cp.y + CH / 2}),
        changedCard: P2({x: fx + fw / 2, y: fy + fh / 2}),
        changedHolder: v.place <= 0 ? 'hand' : v.place < 1 ? 'moving' : pinP >= 0.5 ? 'pinned' : 'lying',
        changedDay: facts[ci].day,
        changedState: facts[ci].state,
        cardHolder: holder,
        tapeEnd: P2(tabPoint(tapeA)),
        tapeProgress: r(pullP, 3),
        factStates: states,
        otherSlots: factBoxes.filter((_, i) => i !== ci).map(b => P2(b)),
        reached: sol.reached,
        elbow: P2(elbow),
        armSegs,
        armHalfWidth: G.arm.width / 2,
      },
    };
  }

  // the smallest key-content text actually used on the fact cards (labels and day chips), in design units:
  // the entry keeps every generic caption at or below it
  const stripSizes = ctx.show('key') ? [t.inside, t.outside, t.unclassified].map(x => ctx.fit(x, {maxWidth: fw - 12 - 16, size: TX.strip, minSize: 15, maxLines: 1, weight: 800}).size) : [];
  const sizes = [...measures.flatMap(m => [m.labelFit && m.labelFit.size, m.dayFit && m.dayFit.size]), ...stripSizes].filter(Boolean);
  sink.push(...sizes);
  const factSize = sink.length ? Math.min(...sink) : null;
  // the card's printed interval (the changed datum's frame of reference) and the largest other content text
  const ivSize = probe.ivSize ?? null;
  const contentMax = Math.max(...sink.filter(v => v !== ivSize), 0);
  return {node, pose, W, H, geo, facts, factBoxes, pins, cardDestBox: {x: cardDest.x, y: cardDest.y, w: CW, h: CH}, startA, endA, changedBox: factBoxes[ci], changedIndex: ci, factSize, ivSize, contentMax};
}
