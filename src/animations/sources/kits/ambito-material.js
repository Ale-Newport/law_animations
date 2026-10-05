/**
 * "Ámbito material" kit (LAW-0137..0140): a subject filter keyed by a
 * fictional article, and a collection of activity cards passing through it.
 *
 * Spatial logic (front elevation of a workshop wall, original vector art):
 *  - the EDITABLE HIERARCHY is a two-shelf rack whose shelf plates carry the
 *    user-supplied level labels; the sources stand on the shelf the author
 *    supplied (the order states no rule and resolves nothing);
 *  - the BOOK (Text 1, fictional) lies open on its shelf; its right page holds
 *    the ARTICLE, a slip with a tab listing the subjects of the (simulated)
 *    passage, each with a mark (● ▲ ■ ◆);
 *  - the FILTER is a sloping rail with one double-leaf gate per listed
 *    subject; under each gate hangs a glass bin whose plate has an empty key
 *    socket until the article is clipped into the filter holder and the marks
 *    of its rows fly into the sockets;
 *  - the COLLECTION of activity cards waits in a clear magazine at the upper
 *    end of the rail; each card carries the subject tag supplied for it. A
 *    card slides down the rail; the gate whose key matches its tag opens and
 *    the card drops into that bin. A card whose tag matches no listed subject
 *    rolls off the end into the side bin ("subject not classified");
 *  - the LUPA (magnifier) stands in a cup and is used to read a tag.
 * The comparison is a verbatim match of supplied strings: the kit never
 * decides whether a text applies, never ranks sources and never resolves a
 * conflict. States are descriptive: "subject included" (listed in the
 * supplied passage) / "subject not classified".
 *
 * The kit owns fields, defaults, strings, geometry, art and a pose solver;
 * each entry owns its own timeline, composition and semantics.
 * @module animations/sources/kits/ambito-material
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath, catmullRom, polyline} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj, int} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Fields (category "sources" + this motif)                            */
/* ------------------------------------------------------------------ */

/** Category field set for sources motifs of this kit (brief: sources, hierarchy, passages, interpretations). */
export const sourcesFields = {
  sources: list('Fictional source texts drawn as books: [0] is the open book that holds the passage (the anchor); [1] (optional) is a second, closed text on the stand', obj('Source text (fictional placeholder)', {
    title: str('Title printed on the book, e.g. "Text 1 (fictional)"', 60),
    note: str('Short descriptive line printed under the title (e.g. "simulated wording")', 40),
  }, ['title']), 1, 2),
  hierarchy: obj('Editable hierarchy: a user-supplied ordering drawn as the shelves of the stand. The labels are neutral placeholders; the order is displayed only and states no rule, priority or outcome', {
    levels: list('Shelf labels, top shelf first (user-supplied)', str('Level label', 40), 1, 2),
    placement: list('Shelf index (0 = top shelf) of each source, in source order (user-supplied)', int('Shelf index', 0, 1), 1, 2),
  }, ['levels', 'placement']),
  passages: list('Simulated passages: [0] is the article whose subject list keys the filter (fictional wording)', obj('Passage (simulated)', {
    ref: str('Reference printed on the article, e.g. "Text 1 · Art. 2 (fictional)"', 50),
    heading: str('Heading of the article (simulated wording)', 50),
    subjects: list('Subjects listed by the article, in order; each keys one gate of the filter', str('Listed subject', 32), 1, 4),
  }, ['ref', 'heading', 'subjects']), 1, 1),
  interpretations: list('Readings attributed to a fictional source, drawn as an attributed note; never applied by the filter and never endorsed', obj('Attributed reading', {
    by: str('Fictional source of the reading', 40),
    text: str('The reading as proposed (descriptive)', 90),
  }, ['by', 'text']), 0, 1),
};

/** The collection of activities (this motif). */
export const activitiesField = list('The collection of activities, in the order they enter the filter. Each carries the subject tag supplied for it, compared verbatim (case-insensitive) with the listed subjects; an empty tag means no subject was supplied', obj('Activity (fictional)', {
  label: str('Activity label', 40),
  subject: str('Subject tag supplied for the activity', 32),
}, ['label', 'subject']), 1, 5);

/** Built-in strings of this kit. */
export const KIT_STRINGS = {
  en: {
    reader: 'Reader', filter: 'Subject filter', included: 'Subject included', unclassified: 'Subject not classified',
    noSubject: 'No tag', activities: 'Activities', reading: 'Reading proposed', attributed: 'attributed · not applied',
    key: 'key', listedKey: 'Listed subject', noKey: 'No listed key', tagRead: 'Tag read',
  },
  es: {
    reader: 'Lectora', filter: 'Filtro de materias', included: 'Materia incluida', unclassified: 'Materia no clasificada',
    noSubject: 'Sin etiqueta', activities: 'Actividades', reading: 'Lectura propuesta', attributed: 'atribuida · no aplicada',
    key: 'clave', listedKey: 'Materia listada', noKey: 'Sin clave listada', tagRead: 'Etiqueta leída',
  },
};

/** Kit strings for a locale. */
export const kitStrings = locale => ({...KIT_STRINGS.en, ...(KIT_STRINGS[locale] || {})});

/** Fictional, illustrative default content (English). */
export const CONTENT_EN = {
  sources: [{title: 'Text 1 (fictional)', note: 'Simulated wording'}, {title: 'Text 2 (fictional)', note: 'Simulated wording'}],
  hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'], placement: [0, 1]},
  passages: [{ref: 'Text 1 · Art. 2 (fictional)', heading: 'Material scope (simulated wording)', subjects: ['Transport', 'Housing', 'Farming']}],
  interpretations: [],
  activities: [
    {label: 'Bicycle rental', subject: 'Transport'},
    {label: 'Roof repair', subject: 'Housing'},
    {label: 'Street concert', subject: 'Culture'},
    {label: 'Seed exchange', subject: 'Farming'},
  ],
};

/** Spanish default content (fictional, same structure). */
export const CONTENT_ES = {
  sources: [{title: 'Texto 1 (ficticio)', note: 'Redacción simulada'}, {title: 'Texto 2 (ficticio)', note: 'Redacción simulada'}],
  hierarchy: {levels: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)'], placement: [0, 1]},
  passages: [{ref: 'Texto 1 · Art. 2 (ficticio)', heading: 'Ámbito material (redacción simulada)', subjects: ['Transporte', 'Vivienda', 'Agricultura']}],
  interpretations: [],
  activities: [
    {label: 'Alquiler de bicicletas', subject: 'Transporte'},
    {label: 'Reparación de tejado', subject: 'Vivienda'},
    {label: 'Concierto callejero', subject: 'Cultura'},
    {label: 'Intercambio de semillas', subject: 'Agricultura'},
  ],
};

/** Long-label stress content (fictional). */
export const CONTENT_LONG = {
  sources: [{title: 'Consolidated Illustrative Text Number One (fictional)', note: 'Simulated wording for teaching'}, {title: 'Supplementary Text Two (fictional)', note: 'Simulated wording'}],
  hierarchy: {levels: ['First level as supplied by the author', 'Second level as supplied by the author'], placement: [0, 1]},
  passages: [{ref: 'Consolidated Text 1 · Article 2 (fictional)', heading: 'Material scope of the text (simulated wording)', subjects: ['Community transport services', 'Housing maintenance', 'Farming cooperatives']}],
  interpretations: [],
  activities: [
    {label: 'Weekend bicycle rental for residents', subject: 'Community transport services'},
    {label: 'Emergency roof repair after a storm', subject: 'Housing maintenance'},
    {label: 'Open-air street concert in the square', subject: 'Cultural events in public spaces'},
    {label: 'Seasonal seed exchange between growers', subject: 'Farming cooperatives'},
  ],
};

/* ------------------------------------------------------------------ */
/* Resolution: marks, colours, states                                  */
/* ------------------------------------------------------------------ */

export const LISTED_MARKS = ['circle', 'triangle', 'square', 'diamond'];
export const OFF_MARKS = ['star', 'hexagon'];
/** Neutral grey used for tags that match no listed subject (a state colour, not a verdict). */
export const NEUTRAL = '#7d858f';
const norm = s => String(s || '').trim().toLowerCase();

/** Colour of the j-th listed subject. */
export function listedColor(ctx, j) {
  const th = ctx.theme;
  return [th.accent2, th.accent4, shade(th.accent3, -0.34), th.cloth[3]][j % 4];
}

/**
 * Resolve the listed subjects (gate keys) and each activity's tag.
 * `overrides[i]` replaces the subject of activity i (used by inspect / contrast).
 * `tagFor` keeps assigning distinct marks to further unlisted subjects.
 * @param {any} ctx
 * @param {any} p params
 * @param {Record<number,string>} [overrides]
 */
export function resolveScope(ctx, p, overrides = {}) {
  const passage = p.passages[0];
  const listed = passage.subjects.map((name, j) => ({j, name, key: norm(name), mark: LISTED_MARKS[j % 4], color: listedColor(ctx, j)}));
  const off = [];
  const tagFor = subject => {
    const key = norm(subject);
    const li = key ? listed.findIndex(s => s.key === key) : -1;
    if (li >= 0) return {subject: String(subject), key, listedIdx: li, state: 'included', mark: listed[li].mark, color: listed[li].color};
    if (!key) return {subject: '', key, listedIdx: -1, state: 'unclassified', mark: 'blank', color: NEUTRAL};
    let j = off.indexOf(key);
    if (j < 0) {
      off.push(key);
      j = off.length - 1;
    }
    return {subject: String(subject), key, listedIdx: -1, state: 'unclassified', mark: OFF_MARKS[j % OFF_MARKS.length], color: NEUTRAL};
  };
  const acts = p.activities.map((a, i) => ({i, num: i + 1, label: a.label, ...tagFor(overrides[i] !== undefined ? overrides[i] : a.subject)}));
  return {listed, acts, tagFor, passage};
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
 * ctx.fit that shrinks (down to minSize) rather than break a word across
 * lines, and balances multi-line results so no word is left orphaned.
 */
export function fitWords(ctx, text, o) {
  let f = ctx.fit(text, o);
  if (brokeWord(f)) {
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
  // balance: narrowest width at the same size that keeps the line count
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

/** Lighten a colour into a soft tint. */
export const tint = (c, k = 0.8) => shade(c, k);

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

/** Path of a subject mark centred on (0,0) fitting radius R. */
export function markPath(shape, R) {
  const f = v => r(v, 2);
  const poly = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') + 'Z';
  const ring = (n, rr, a0, alt) => Array.from({length: n}, (_, i) => {
    const rad = alt && i % 2 ? alt : rr;
    const a = a0 + (i * Math.PI * 2) / n;
    return [Math.cos(a) * rad, Math.sin(a) * rad];
  });
  switch (shape) {
    case 'triangle': {
      const k = R * 1.2;
      return poly([[0, -k + R * 0.14], [k * 0.87, k * 0.5 + R * 0.14], [-k * 0.87, k * 0.5 + R * 0.14]]);
    }
    case 'square': {
      const s = R * 0.84;
      return `M${f(-s)} ${f(-s)}H${f(s)}V${f(s)}H${f(-s)}Z`;
    }
    case 'diamond': {
      const k = R * 1.16;
      return poly([[0, -k], [k, 0], [0, k], [-k, 0]]);
    }
    case 'star':
      return poly(ring(10, R * 1.18, -Math.PI / 2, R * 0.5));
    case 'hexagon':
      return poly(ring(6, R * 1.04, 0));
    case 'circle':
    default:
      return `M${f(-R)} 0A${f(R)} ${f(R)} 0 1 0 ${f(R)} 0A${f(R)} ${f(R)} 0 1 0 ${f(-R)} 0Z`;
  }
}

/**
 * Round key disc with a white mark (local origin = centre). 'blank' is an
 * empty dashed ring (no subject tag supplied).
 */
export function markDisc(ctx, {shape, color, R, name, opacity, transform}) {
  const th = ctx.theme;
  if (shape === 'blank') {
    return g({name, opacity, transform},
      h('circle', {r: r(R), fill: th.card, stroke: NEUTRAL, 'stroke-width': r(Math.max(2, R * 0.14)), 'stroke-dasharray': `${r(R * 0.42)} ${r(R * 0.3)}`}));
  }
  return g({name, opacity, transform},
    h('circle', {r: r(R), fill: color, stroke: th.ink, 'stroke-width': r(Math.max(1.6, R * 0.1))}),
    h('path', {d: markPath(shape, R * 0.55), fill: '#ffffff'}));
}

/** Empty key socket (dashed ring with a dark centre). */
export function keySocket(ctx, R) {
  const th = ctx.theme;
  return g(null,
    h('circle', {r: r(R + 3), fill: shade(th.paperShade, -0.1), stroke: th.ink, 'stroke-width': 1.6}),
    h('circle', {r: r(R - 2), fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.8, 'stroke-dasharray': '5 4'}));
}

/* ------------------------------------------------------------------ */
/* Activity card                                                       */
/* ------------------------------------------------------------------ */

export const CARD_W = 190;
const CARD_PAPER = '#fffdf8';

/**
 * Shared layout of the activity cards (one height for the collection).
 * `extraTags` are further subject texts that may appear on a card (inspect).
 * @param {any} ctx
 * @param {any[]} acts resolved activities
 * @param {string[]} [extraTags]
 * @param {{tagMin?:number, tagLines?:number, tagWidth?:number}} [opts]  tagWidth: text width inside the chip (the default 104 leaves no inner padding)
 */
export function cardLayout(ctx, acts, extraTags = [], opts = {}) {
  const t = kitStrings(ctx.params.locale);
  const showKey = ctx.show('key');
  // opts (opt-in, used by the inspect entry): smaller minimum / more lines so long tags are never cut
  const tagFit = s => fitWords(ctx, s || t.noSubject, {maxWidth: opts.tagWidth ?? 104, size: 19, minSize: opts.tagMin ?? 14, maxLines: opts.tagLines ?? 2, weight: 700});
  const fits = acts.map(a => ({
    tag: showKey ? tagFit(a.subject) : null,
    label: showKey ? fitWords(ctx, a.label, {maxWidth: CARD_W - 26, size: 22, minSize: 16, maxLines: 3, weight: 600}) : null,
  }));
  const extra = showKey ? extraTags.map(tagFit) : [];
  const stripH = Math.max(46, ...[...fits.map(f => f.tag), ...extra].filter(Boolean).map(f => f.height + 20));
  const labelH = Math.max(50, ...fits.map(f => (f.label ? f.label.height : 0)));
  return {W: CARD_W, H: r(stripH + labelH + 24, 1), stripH, fits, tagFit};
}

/**
 * The strip + tag chip of a card (local coordinates of the card, origin =
 * card centre). Returned as its own group so a tag can be swapped.
 */
function cardTag(ctx, o) {
  const th = ctx.theme;
  const {W, H, stripH} = o.CL;
  const x0 = -W / 2, y0 = -H / 2;
  const tag = o.tag;
  const soft = tag.mark === 'blank' ? '#f1f2f3' : tag.listedIdx >= 0 ? tint(tag.color, 0.8) : '#e6e8eb';
  const parts = [
    h('path', {d: `M${r(x0 + 1.5)} ${r(y0 + stripH)}V${r(y0 + 11)}Q${r(x0 + 1.5)} ${r(y0 + 1.5)} ${r(x0 + 11)} ${r(y0 + 1.5)}H${r(x0 + W - 11)}Q${r(x0 + W - 1.5)} ${r(y0 + 1.5)} ${r(x0 + W - 1.5)} ${r(y0 + 11)}V${r(y0 + stripH)}Z`, fill: soft}),
  ];
  const cx0 = x0 + 44, cw = W - 52, cy0 = y0 + 7, chH = stripH - 14;
  const fit = o.fit;
  let mark;
  if (fit && !o.noText) {
    parts.push(h('path', {d: roundRectPath(cx0, cy0, cw, chH, Math.min(14, chH / 2)), fill: th.card, stroke: tag.mark === 'blank' ? NEUTRAL : tag.color, 'stroke-width': 2, 'stroke-dasharray': tag.mark === 'blank' ? '6 4' : null}));
    mark = {x: cx0 + 17, y: cy0 + chH / 2};
    parts.push(markDisc(ctx, {shape: tag.mark, color: tag.color, R: 12, transform: T(mark.x, mark.y)}));
    if (!o.ghost) parts.push(textBlock(fit, {x: cx0 + 33 + (cw - 37) / 2, y: cy0 + (chH - fit.height) / 2, anchor: 'middle', fill: tag.mark === 'blank' ? th.inkSoft : th.ink, name: `${o.name}-t`}));
    else parts.push(h('rect', {x: r(cx0 + 36), y: r(cy0 + chH / 2 - 4), width: r(Math.max(10, fit.width * 0.8)), height: 8, rx: 4, fill: th.paperLine}));
  } else {
    mark = {x: cx0 + cw / 2, y: y0 + stripH / 2};
    parts.push(markDisc(ctx, {shape: tag.mark, color: tag.color, R: 15, transform: T(mark.x, mark.y)}));
  }
  return {node: g({name: o.name, opacity: o.opacity}, parts), mark};
}

/**
 * Activity card, local origin = centre. Base size CARD_W × CL.H (the stage
 * scales it). Nodes: `${prefix}` (the card), `${prefix}-tag` (strip + tag),
 * optional `${prefix}-tagB` (alternative tag, hidden) when `alt` is given.
 * @param {any} ctx
 * @param {{prefix:string, act:any, CL:any, fit?:any, alt?:{tag:any, fit:any}, noText?:boolean, name?:string|null}} o
 */
export function activityCard(ctx, o) {
  const th = ctx.theme;
  const {W, H, stripH} = o.CL;
  const x0 = -W / 2, y0 = -H / 2;
  const fits = o.fit || {};
  const showText = !o.noText && ctx.show('key');
  const body = [
    h('path', {d: roundRectPath(x0 + 4, y0 + 7, W, H, 11), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, W, H, 11), fill: CARD_PAPER, stroke: th.ink, 'stroke-width': 2.4}),
  ];
  const tagA = cardTag(ctx, {name: `${o.prefix}-tag`, CL: o.CL, tag: o.act, fit: showText || (o.ghost && ctx.show('key')) ? fits.tag : null, noText: !showText && !o.ghost, ghost: o.ghost});
  const tagB = o.alt ? cardTag(ctx, {name: `${o.prefix}-tagB`, CL: o.CL, tag: o.alt.tag, fit: showText ? o.alt.fit : null, noText: !showText, opacity: 0}) : null;
  const over = [
    h('path', {d: `M${r(x0 + 1)} ${r(y0 + stripH)}H${r(x0 + W - 1)}`, stroke: th.ink, 'stroke-width': 1.6, opacity: 0.55}),
    h('circle', {cx: r(x0 + 22), cy: r(y0 + stripH / 2), r: 14, fill: th.ink}),
  ];
  if (showText && !o.ghost) {
    over.push(h('text', {name: `${o.prefix}-num`, x: r(x0 + 22), y: r(y0 + stripH / 2 + 6.2), 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: '#ffffff'}, String(o.act.num)));
    if (fits.label) over.push(textBlock(fits.label, {x: r(x0 + 13), y: r(y0 + stripH + 10), fill: th.ink, name: `${o.prefix}-label`}));
  } else if (!o.ghost) {
    const ly = y0 + stripH + 16;
    const bars = [0.84, 0.66, 0.44];
    bars.forEach((f, i) => { if (ly + i * 17 + 8 < y0 + H - 8) over.push(h('rect', {x: r(x0 + 14), y: r(ly + i * 17), width: r((W - 28) * f), height: 8, rx: 4, fill: th.paperLine})); });
  }
  const node = g({name: o.name === null ? undefined : (o.name ?? o.prefix)}, body, tagA.node, tagB && tagB.node, over);
  const texts = showText ? {num: `${o.prefix}-num`, label: fits.label ? `${o.prefix}-label` : null, tag: fits.tag ? `${o.prefix}-tag-t` : null, tagB: o.alt && o.alt.fit ? `${o.prefix}-tagB-t` : null} : null;
  return {node, W, H, stripH, mark: tagA.mark, texts, labelH: fits.label ? fits.label.height : 0};
}

/* ------------------------------------------------------------------ */
/* Article slip                                                        */
/* ------------------------------------------------------------------ */

export const ART_W = 440;

/**
 * Article slip listing the subjects of the passage. Local origin = top-left
 * of the slip body; a tab sticks up at its top-left (the hand's grip).
 * Each row has a key disc (the mark that keys one gate).
 * @param {any} ctx
 * @param {{prefix:string, passage:any, listed:any[], noText?:boolean}} o
 */
export function articleSlip(ctx, o) {
  const th = ctx.theme;
  const W = ART_W;
  const pad = 20;
  const showText = !o.noText && ctx.show('key');
  const head = th.accent2Soft;
  const refFit = showText ? fitWords(ctx, o.passage.ref, {maxWidth: W - pad * 2, size: 23, minSize: 16, maxLines: 1, weight: 700}) : null;
  const headingFit = showText ? fitWords(ctx, o.passage.heading, {maxWidth: W - pad * 2, size: 22, minSize: 16, maxLines: 2, weight: 600, family: 'serif'}) : null;
  const rowFits = o.listed.map(s => (showText ? fitWords(ctx, s.name, {maxWidth: W - 96, size: 25, minSize: 17, maxLines: 2, weight: 700}) : null));
  const headH = 48;
  const parts = [];
  let y = headH + 12;
  const headingH = headingFit ? headingFit.height : 20;
  const headingY = y;
  y += headingH + 14;
  const ruleY = y;
  y += 10;
  const rows = o.listed.map((s, j) => {
    const fh = rowFits[j] ? rowFits[j].height : 22;
    const rh = Math.max(50, fh + 18);
    const row = {y0: y, h: rh, mark: {x: pad + 18, y: y + rh / 2}, R: 16, fit: rowFits[j]};
    y += rh;
    return row;
  });
  const H = y + 14;
  const tab = {x: 22, w: 104, h: 30};
  // shadow, tab, body
  parts.push(h('path', {d: roundRectPath(6, 9, W, H, 12), fill: th.shadow}));
  parts.push(h('path', {d: `M${tab.x} 2V${r(-tab.h + 10)}Q${tab.x} ${-tab.h} ${tab.x + 10} ${-tab.h}H${tab.x + tab.w - 10}Q${tab.x + tab.w} ${-tab.h} ${tab.x + tab.w} ${r(-tab.h + 10)}V2Z`, fill: head, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${tab.x + 26} ${-tab.h + 11}H${tab.x + tab.w - 26}M${tab.x + 26} ${-tab.h + 18}H${tab.x + tab.w - 26}`, stroke: shade(head, -0.35), 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
  parts.push(h('path', {d: roundRectPath(0, 0, W, H, 12), fill: th.paper, stroke: th.ink, 'stroke-width': 2.4}));
  parts.push(h('path', {d: `M1.2 ${headH}V12Q1.2 1.2 12 1.2H${W - 12}Q${W - 1.2} 1.2 ${W - 1.2} 12V${headH}Z`, fill: head}));
  parts.push(h('path', {d: `M0 ${headH}H${W}`, stroke: th.ink, 'stroke-width': 1.6}));
  if (refFit) parts.push(textBlock(refFit, {x: pad, y: (headH - refFit.height) / 2, fill: th.ink}));
  else parts.push(h('rect', {x: pad, y: headH / 2 - 6, width: W * 0.5, height: 12, rx: 6, fill: shade(head, -0.3)}));
  if (headingFit) parts.push(textBlock(headingFit, {x: pad, y: headingY, fill: th.inkSoft, italic: true}));
  else parts.push(h('rect', {x: pad, y: headingY + 4, width: W * 0.62, height: 11, rx: 5, fill: th.paperLine}));
  parts.push(h('path', {d: `M${pad} ${r(ruleY)}H${W - pad}`, stroke: th.paperLine, 'stroke-width': 2}));
  rows.forEach((row, j) => {
    const s = o.listed[j];
    if (j) parts.push(h('path', {d: `M${pad + 40} ${r(row.y0)}H${W - pad}`, stroke: th.paperLine, 'stroke-width': 1.2, 'stroke-dasharray': '3 5'}));
    parts.push(markDisc(ctx, {shape: s.mark, color: s.color, R: row.R, transform: T(row.mark.x, row.mark.y), name: `${o.prefix}-row${j}`}));
    if (row.fit) parts.push(textBlock(row.fit, {x: pad + 46, y: row.y0 + (row.h - row.fit.height) / 2, fill: th.ink}));
    else parts.push(h('rect', {x: pad + 46, y: row.mark.y - 6, width: (W - 110) * (0.7 - j * 0.1), height: 12, rx: 6, fill: th.paperLine}));
  });
  return {node: g({name: o.prefix}, parts), W, H, rows, grip: {x: tab.x + tab.w / 2, y: -tab.h / 2 + 2}, tab};
}

/* ------------------------------------------------------------------ */
/* Books and the stand (editable hierarchy)                            */
/* ------------------------------------------------------------------ */

const COVER = '#2f4a6b';
const COVER2 = '#6b3f4f';

/**
 * Open book standing on a small easel, pages facing the viewer. Local
 * origin = top-left of the cover box (w × h). `slot` is the area of the
 * right page where the article slip sits (top-left + scale).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, source:{title:string, note?:string}, seedKey?:string, titleLines?:number}} o
 */
export function openBook(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const showText = ctx.show('key');
  const pageW = w / 2 - 14;
  const pad = 16;
  const parts = [];
  // easel legs behind the book
  parts.push(h('path', {d: `M${r(w * 0.22)} ${r(hh - 20)}L${r(w * 0.16)} ${r(hh + 14)}M${r(w * 0.78)} ${r(hh - 20)}L${r(w * 0.84)} ${r(hh + 14)}`, stroke: th.woodDark, 'stroke-width': 10, 'stroke-linecap': 'round'}));
  parts.push(h('path', {d: roundRectPath(8, 12, w, hh, 12), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: COVER, stroke: th.ink, 'stroke-width': 2.6}));
  // pages (slightly curved tops meeting at the gutter)
  const lp = `M12 ${hh - 12}V22Q${r(pageW * 0.5)} 8 ${r(w / 2 - 2)} 18V${hh - 8}Q${r(pageW * 0.5)} ${hh - 20} 12 ${hh - 12}Z`;
  const rp = `M${w - 12} ${hh - 12}V22Q${r(w - pageW * 0.5)} 8 ${r(w / 2 + 2)} 18V${hh - 8}Q${r(w - pageW * 0.5)} ${hh - 20} ${w - 12} ${hh - 12}Z`;
  parts.push(h('path', {d: lp, fill: th.paper, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: rp, fill: th.paper, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: `M${r(w / 2 - 14)} 20V${hh - 10}`, stroke: th.paperShade, 'stroke-width': 10, opacity: 0.8}));
  parts.push(h('path', {d: `M${r(w / 2)} 16V${hh - 6}`, stroke: th.ink, 'stroke-width': 1.6}));
  // left page: title + note + lines
  let y = 32;
  if (showText) {
    let tf = fitWords(ctx, o.source.title, {maxWidth: pageW - pad * 2, size: 24, minSize: 16, maxLines: 3, weight: 700, family: 'serif'});
    // a narrow page: shrink further rather than split a word
    if (brokeWord(tf)) tf = fitWords(ctx, o.source.title, {maxWidth: pageW - pad * 2, size: 16, minSize: 10, maxLines: 4, weight: 700, family: 'serif'});
    // opt-in (o.titleLines): a long title may take more lines rather than be cut
    if (o.titleLines && tf.truncated) tf = fitWords(ctx, o.source.title, {maxWidth: pageW - pad * 2, size: 18, minSize: 12, maxLines: o.titleLines, weight: 700, family: 'serif'});
    parts.push(textBlock(tf, {x: 12 + pad, y, fill: th.ink}));
    y += tf.height + 10;
    if (o.source.note && ctx.show('all')) {
      const nf = fitWords(ctx, o.source.note, {maxWidth: pageW - pad * 2, size: 17, minSize: 13, maxLines: 2, weight: 500});
      parts.push(textBlock(nf, {x: 12 + pad, y, fill: th.inkSoft, italic: true}));
      y += nf.height + 12;
    }
  } else {
    parts.push(h('rect', {x: 12 + pad, y, width: pageW * 0.7, height: 16, rx: 6, fill: th.ink, opacity: 0.75}));
    y += 34;
  }
  for (let i = 0; y + 10 < hh - 22; i++, y += 20) {
    const f = 0.62 + 0.3 * ctx.rng(`${o.seedKey || o.prefix}-l`, i);
    parts.push(h('rect', {x: 12 + pad, y, width: r((pageW - pad * 2) * f), height: 7, rx: 3.5, fill: th.paperLine}));
  }
  // right page: a few lines above the slot
  const rx0 = w / 2 + 2 + 12;
  parts.push(h('rect', {x: r(rx0), y: 30, width: r((pageW - 24) * 0.8), height: 7, rx: 3.5, fill: th.paperLine}));
  parts.push(h('rect', {x: r(rx0), y: 46, width: r((pageW - 24) * 0.55), height: 7, rx: 3.5, fill: th.paperLine}));
  const slotW = pageW - 24;
  const slot = {x: rx0 - 2, y: 70, k: slotW / ART_W};
  // dashed outline where the slip rests (visible once it is lifted)
  parts.push(h('path', {name: `${o.prefix}-slot`, d: roundRectPath(slot.x, slot.y, slotW, Math.min(hh - 84, 180 * slot.k + 60), 8), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '6 5', opacity: 0.9}));
  // ribbon
  parts.push(h('path', {d: `M${r(w / 2 + 6)} 16V${hh + 6}l7 -7l7 7V16Z`, fill: th.accent, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}));
  return {node: g({name: o.prefix}, parts), slot, pageW};
}

/**
 * Closed book standing with its cover to the viewer. Local origin =
 * bottom-left (it stands on a shelf).
 */
export function closedBook(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const c = o.color || COVER2;
  const parts = [
    h('path', {d: roundRectPath(6, -hh + 8, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, -hh, w, hh, 8), fill: c, stroke: th.ink, 'stroke-width': 2.4}),
    h('rect', {x: 0, y: -hh, width: 16, height: hh, rx: 6, fill: shade(c, -0.25)}),
    h('path', {d: `M16 ${-hh + 1}V-1`, stroke: th.ink, 'stroke-width': 1.4}),
  ];
  const lx = 26, lw = w - 34;
  parts.push(h('path', {d: roundRectPath(lx, -hh + 18, lw, hh * 0.56, 6), fill: '#f4ecd8', stroke: shade(c, -0.35), 'stroke-width': 1.6}));
  if (ctx.show('key')) {
    // the title stays inside the cover label: as many lines as its height holds, shrinking before truncating
    const areaH = hh * 0.56 - 8;
    let tf = null;
    for (let size = o.titleSize ?? 19; size >= 9; size -= 1) {
      const lines = Math.max(1, Math.floor((areaH - size) / (size * 1.2)) + 1);
      tf = fitWords(ctx, o.title, {maxWidth: lw - 12, size, minSize: size, maxLines: Math.min(lines, 6), weight: 700, family: 'serif'});
      if (!tf.truncated && !brokeWord(tf) && tf.height <= areaH) break;
    }
    parts.push(textBlock(tf, {x: lx + lw / 2, y: -hh + 18 + (hh * 0.56 - tf.height) / 2, anchor: 'middle', fill: th.ink}));
  } else {
    parts.push(h('rect', {x: lx + 10, y: -hh + 18 + hh * 0.2, width: lw - 20, height: 12, rx: 5, fill: shade(c, -0.1), opacity: 0.6}));
  }
  parts.push(h('path', {d: `M${lx + 8} ${r(-hh * 0.22)}H${w - 12}M${lx + 8} ${r(-hh * 0.14)}H${w - 20}`, stroke: '#e6c77a', 'stroke-width': 3, 'stroke-linecap': 'round'}));
  return {node: g({name: o.prefix, transform: T(o.x, o.y)}, parts)};
}

/**
 * The editable hierarchy: a two-shelf wall rack whose shelf plates carry
 * the user-supplied level labels. Local = stage coordinates.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, bottom:number, shelves:number[], levels:string[], fs?:number}} o
 */
export function hierarchyRack(ctx, o) {
  const th = ctx.theme;
  const {x, y, w} = o;
  const plank = 34;
  const parts = [];
  const plates = [];
  o.shelves.forEach((sy, i) => {
    parts.push(h('path', {d: roundRectPath(x - 6, sy, w + 12, plank, 5), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.4}));
    parts.push(h('path', {d: `M${x - 4} ${sy + plank - 7}H${x + w + 4}`, stroke: th.woodDark, 'stroke-width': 3, opacity: 0.55}));
    const label = o.levels[i];
    if (label !== undefined && ctx.show('key')) {
      const size = 20 * (o.fs ?? 1);
      const f = fitWords(ctx, label, {maxWidth: w - 64, size, minSize: 14, maxLines: 2, weight: 700});
      const pw = f.width + 44, ph = Math.max(plank - 6, f.height + 10);
      // a plate taller than the plank hangs from it (never rises into the books standing on the shelf)
      const px = x + w / 2 - pw / 2, py = ph > plank - 6 ? sy + 3 : sy + plank / 2 - ph / 2;
      const node = g({name: `${o.prefix}-plate${i}`},
        h('path', {d: roundRectPath(px, py, pw, ph, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}),
        h('circle', {cx: px + 10, cy: py + ph / 2, r: 3.2, fill: '#6c4f1a'}),
        h('circle', {cx: px + pw - 10, cy: py + ph / 2, r: 3.2, fill: '#6c4f1a'}),
        textBlock(f, {x: px + pw / 2, y: py + (ph - f.height) / 2, anchor: 'middle', fill: '#3d2c0c'}));
      parts.push(node);
      plates.push({x: px, y: py, w: pw, h: ph});
    } else if (label !== undefined) {
      // labels hidden: the plate stays as a blank brass plaque with level pips
      const pw = 120, ph = plank - 8, px = x + w / 2 - pw / 2, py = sy + 4;
      parts.push(g({name: `${o.prefix}-plate${i}`},
        h('path', {d: roundRectPath(px, py, pw, ph, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}),
        ...Array.from({length: i + 1}, (_, k) => h('circle', {cx: px + pw / 2 + (k - i / 2) * 16, cy: py + ph / 2, r: 4.5, fill: '#6c4f1a'}))));
      plates.push({x: px, y: py, w: pw, h: ph});
    }
  });
  // the stand reaches below a plate hanging from its lowest shelf
  const bottom = Math.max(o.bottom, ...plates.map(q => q.y + q.h + 8));
  parts.unshift(
    h('path', {d: roundRectPath(x + 6, y + 8, w, bottom - y, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, bottom - y, 10), fill: '#e9dcc4', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(x + 12, y + 12, w - 24, bottom - y - 24, 6), fill: '#e1d2b6', opacity: 0.8}));
  return {node: g({name: o.prefix}, parts), plates, plank, bottom};
}

/* ------------------------------------------------------------------ */
/* Magnifier                                                           */
/* ------------------------------------------------------------------ */

export const LUPA = {R: 58, L: 118};

/**
 * Magnifier in two layers around a lens centred on (0,0) with the handle
 * along +y: `${prefix}-back` (glass) and `${prefix}-front` (rim, handle).
 * Scenes place magnified content between the two layers.
 */
export function lupaArt(ctx, {prefix, R = LUPA.R, L = LUPA.L}) {
  const th = ctx.theme;
  const back = g({name: `${prefix}-back`},
    h('circle', {cx: 5, cy: 8, r: R + 6, fill: th.shadow}),
    h('circle', {r: R, fill: '#e8f2f7', opacity: 0.94}));
  const front = g({name: `${prefix}-front`},
    h('rect', {x: -10, y: R + 12, width: 20, height: L, rx: 10, fill: '#5a3d2b', stroke: th.ink, 'stroke-width': 2.4}),
    h('rect', {x: -4, y: R + 26, width: 5, height: L - 30, rx: 2.5, fill: '#ffffff', opacity: 0.18}),
    h('rect', {x: -13, y: R + 2, width: 26, height: 18, rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': 2.2}),
    h('circle', {r: R + 4, fill: 'none', stroke: th.ink, 'stroke-width': 3}),
    h('circle', {r: R, fill: 'none', stroke: th.metalDark, 'stroke-width': 9}),
    h('circle', {r: R - 5, fill: 'none', stroke: th.ink, 'stroke-width': 1.6}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.18)}A${r(R * 0.66)} ${r(R * 0.66)} 0 0 1 ${r(-R * 0.1)} ${r(-R * 0.64)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.75}));
  return {back, front, R, L, grip: {x: 0, y: R + 12 + L * 0.6}};
}

/** World point of a lupa-local point for a lens pose {x,y,rot}. */
export function lupaPoint(pose, q) {
  const a = (pose.rot * Math.PI) / 180;
  return {x: pose.x + q.x * Math.cos(a) - q.y * Math.sin(a), y: pose.y + q.x * Math.sin(a) + q.y * Math.cos(a)};
}

/* ------------------------------------------------------------------ */
/* Filter hardware: rail + gates, bins, magazine, holder               */
/* ------------------------------------------------------------------ */

const GLASS = 'rgba(255,255,255,0.3)';
const BIN_BACK = '#d9e3e8';

/**
 * Glass bin: `back` (behind the cards) and `front` (glass, lip, base).
 * `side` bins (no key) carry a small dashed ring on their base.
 */
export function binArt(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o;
  const back = g({name: `${o.prefix}-back`},
    h('path', {d: roundRectPath(x + 6, y + 8, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 10), fill: o.side ? '#e3e5e8' : BIN_BACK, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(x + 8, y + hh - 22, w - 16, 12, 4), fill: '#000', opacity: 0.06}));
  const parts = [
    h('path', {d: roundRectPath(x, y, w, hh, 10), fill: GLASS, stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: `M${r(x + w - 26)} ${r(y + 16)}L${r(x + w - 44)} ${r(y + hh - 16)}M${r(x + w - 14)} ${r(y + 30)}L${r(x + w - 24)} ${r(y + hh - 50)}`, stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.6}),
    h('path', {d: roundRectPath(x - 6, y + hh - 8, w + 12, 18, 6), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(x - 5, y - 5, w + 10, 12, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
  ];
  if (o.side) parts.push(h('circle', {cx: r(x + w / 2), cy: r(y + hh + 1), r: 6, fill: th.card, stroke: NEUTRAL, 'stroke-width': 2, 'stroke-dasharray': '3 2.5'}));
  return {back, front: g({name: `${o.prefix}-front`}, parts), box: {x, y, w, h: hh}};
}

/**
 * Key plate hanging under a gate: an empty key socket (left) and the subject
 * name (named `${name}-name`, hidden until the key lands). Local = stage.
 */
export function keyPlate(ctx, {name, x, y, w, h: ph, fit, color}) {
  const th = ctx.theme;
  const socket = {x: x + 25, y: y + ph / 2, R: 16};
  const node = g({name},
    h('path', {d: roundRectPath(x + 3, y + 5, w, ph, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, ph, 10), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: x + w / 2, cy: y - 4, r: 4, fill: th.metalDark}),
    g({transform: T(socket.x, socket.y)}, keySocket(ctx, socket.R)),
    fit ? textBlock(fit, {x: x + 48 + (w - 54) / 2, y: y + (ph - fit.height) / 2, anchor: 'middle', fill: th.ink, name: `${name}-name`, opacity: 0})
      : h('rect', {name: `${name}-name`, x: x + 50, y: y + ph / 2 - 5, width: Math.max(10, w - 64), height: 10, rx: 5, fill: color, opacity: 0}));
  return {node, socket, box: {x, y, w, h: ph}};
}

/** Rail geometry helper: top-line y at x, angle in degrees. */
export function railGeo(p0, p1) {
  const slope = (p1.y - p0.y) / (p1.x - p0.x);
  const dir = p1.x > p0.x ? 1 : -1;
  return {
    p0, p1, slope, dir,
    y: x => p0.y + (x - p0.x) * slope,
    angle: (Math.atan(slope) * 180) / Math.PI,
  };
}

/**
 * Rail with double-leaf gates. Static segments + one leaf pair per gate
 * (`${prefix}-g${j}-L` / `-R`, local origin at each hinge).
 */
export function railArt(ctx, o) {
  const th = ctx.theme;
  const G = o.geo;
  const t = o.thick ?? 26;
  const xs0 = Math.min(G.p0.x, G.p1.x), xs1 = Math.max(G.p0.x, G.p1.x);
  const cuts = o.gates.map(gt => [gt.cx - gt.w / 2, gt.cx + gt.w / 2]).sort((a, b) => a[0] - b[0]);
  const segs = [];
  let cur = xs0;
  for (const [a, b] of cuts) {
    if (a > cur) segs.push([cur, a]);
    cur = b;
  }
  if (xs1 > cur) segs.push([cur, xs1]);
  const plankPath = (a, b) => `M${r(a)} ${r(G.y(a))}L${r(b)} ${r(G.y(b))}L${r(b)} ${r(G.y(b) + t)}L${r(a)} ${r(G.y(a) + t)}Z`;
  const brackets = [];
  segs.forEach(([a, b]) => {
    const m = (a + b) / 2;
    if (b - a > 30) brackets.push(h('path', {d: `M${r(m - 12)} ${r(G.y(m) + t)}L${r(m)} ${r(G.y(m) + t + 26)}L${r(m + 12)} ${r(G.y(m) + t)}Z`, fill: th.metal, stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}));
  });
  const stat = g({name: `${o.prefix}-static`},
    brackets,
    segs.map(([a, b]) => h('path', {d: plankPath(a, b), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'})),
    segs.map(([a, b]) => h('path', {d: `M${r(a + 2)} ${r(G.y(a + 2) + 6)}L${r(b - 2)} ${r(G.y(b - 2) + 6)}`, stroke: '#ffffff', 'stroke-width': 3, opacity: 0.3})),
    // stop at the upper end
    h('path', {d: roundRectPath(G.p0.x - (G.dir > 0 ? 10 : -2), G.y(G.p0.x) - 40, 12, 40 + t, 4), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}),
  );
  const leaves = o.gates.map((gt, j) => {
    const half = gt.w / 2 - 2;
    const mk = (side, sign) => h('g', {name: `${o.prefix}-g${j}-${side}`},
      h('path', {d: sign > 0 ? `M0 0H${r(half)}V${t}H0Z` : `M0 0H${r(-half)}V${t}H0Z`, fill: shade(th.woodTop, 0.08), stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('circle', {cx: 0, cy: 5, r: 4.5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.4}));
    return [mk('L', 1), mk('R', -1)];
  });
  return {stat, leaves: g({name: `${o.prefix}-gates`}, leaves), thick: t};
}

/**
 * Clear magazine holding the collection, bottom on the rail. Local = stage.
 * `${prefix}-flap` (downstream door, hinge at its top) opens by rotation.
 */
export function magazineArt(ctx, o) {
  const th = ctx.theme;
  const {cx, bottom, w, hh} = o;
  const x = cx - w / 2, y = bottom - hh;
  const back = g({name: `${o.prefix}-back`},
    h('path', {d: roundRectPath(x + 6, y + 8, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 10), fill: '#dde8ee', stroke: th.ink, 'stroke-width': 2.2, opacity: 0.95}));
  const flapH = o.flapH;
  const hx = o.dir > 0 ? x + w : x;
  const flap = g({name: `${o.prefix}-flap`, transform: T(hx, bottom - flapH)},
    h('path', {d: roundRectPath(-5, 0, 10, flapH - 4, 4), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: 0, r: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 1.6}));
  const frontParts = [
    h('path', {d: roundRectPath(x, y, w, hh, 10), fill: 'rgba(255,255,255,0.16)', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: `M${r(x + 16)} ${r(y + 20)}V${r(bottom - 30)}`, stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.45}),
    // side posts; the downstream post stops above the flap
    h('rect', {x: r(x - 5), y: r(y - 4), width: 10, height: r(o.dir > 0 ? hh + 4 : hh - flapH + 4), rx: 4, fill: th.woodDark, stroke: th.ink, 'stroke-width': 1.8}),
    h('rect', {x: r(x + w - 5), y: r(y - 4), width: 10, height: r(o.dir > 0 ? hh - flapH + 4 : hh + 4), rx: 4, fill: th.woodDark, stroke: th.ink, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(x - 8, y - 12, w + 16, 16, 5), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
  ];
  return {back, front: g({name: `${o.prefix}-front`}, frontParts), flap, box: {x, y, w, h: hh}, hinge: {x: hx, y: bottom - flapH}};
}

/**
 * Filter holder (a frame with a clear pocket) on the wall. Local = stage.
 * `label` is printed on its plate under the pocket.
 */
export function holderArt(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o;
  const back = g({name: `${o.prefix}-back`},
    h('path', {d: roundRectPath(x + 6, y + 8, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 12), fill: '#6d5a4b', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(x + 10, y + 10, w - 20, o.pocketH, 8), fill: '#4f4035'}));
  const lipY = y + 10 + o.pocketH - 26;
  const frontParts = [
    h('path', {d: roundRectPath(x + 8, lipY, w - 16, 26, 6), fill: 'rgba(255,255,255,0.28)', stroke: th.ink, 'stroke-width': 1.8}),
    h('rect', {x: x + 18, y: y + 2, width: 22, height: 26, rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.8}),
    h('rect', {x: x + w - 40, y: y + 2, width: 22, height: 26, rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.8}),
  ];
  let labelBox = null;
  const plateY = y + 10 + o.pocketH + 8;
  if (o.label && ctx.show('key')) {
    const f = fitWords(ctx, o.label, {maxWidth: w - 60, size: 21 * (o.fs ?? 1), minSize: 15, maxLines: 1, weight: 700});
    const pw = f.width + 40;
    frontParts.push(h('path', {d: roundRectPath(x + w / 2 - pw / 2, plateY, pw, f.height + 12, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}));
    frontParts.push(textBlock(f, {x: x + w / 2, y: plateY + 6, anchor: 'middle', fill: '#3d2c0c'}));
    labelBox = {x: x + w / 2 - pw / 2, y: plateY, w: pw, h: f.height + 12};
  } else {
    frontParts.push(h('path', {d: roundRectPath(x + w / 2 - 60, plateY, 120, 26, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}));
  }
  return {back, front: g({name: `${o.prefix}-front`}, frontParts), labelBox};
}

/** Small wall ledge with a cup in which the magnifier stands (handle down). */
export function cupArt(ctx, {prefix, x, y, ch = 62, ledge = true}) {
  const th = ctx.theme;
  const back = !ledge ? g({name: `${prefix}-back`}) : g({name: `${prefix}-back`},
    h('path', {d: roundRectPath(x - 66, y, 132, 14, 5), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${x - 40} ${y + 14}l14 26h8l-4 -26Z M${x + 40} ${y + 14}l-14 26h-8l4 -26Z`, fill: th.woodDark, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}));
  const front = g({name: `${prefix}-front`},
    h('path', {d: `M${x - 26} ${y - ch}H${x + 26}L${x + 21} ${y}H${x - 21}Z`, fill: '#8aa7b5', stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${x - 26} ${y - ch}H${x + 26}`, stroke: th.ink, 'stroke-width': 3}),
    h('path', {d: `M${x - 14} ${y - ch + 10}V${y - 10}`, stroke: '#ffffff', 'stroke-width': 3, opacity: 0.4, 'stroke-linecap': 'round'}));
  return {back, front, top: {x, y: y - ch}};
}

/** Pegboard wall inside a rounded window (clip id `${prefix}-clip`). */
export function pegWall(ctx, {prefix, W, H}) {
  const clipId = `${prefix}-clip`;
  const path = roundRectPath(0, 0, W, H, 30);
  const dots = [];
  for (let y = 36; y < H; y += 48) for (let x = 36 + ((y / 48) % 2) * 24; x < W; x += 48) dots.push(`M${x} ${y}h0.01`);
  return {
    clipId,
    path,
    node: g(null,
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: path}))),
      h('path', {d: path, fill: '#ece3d1'}),
      h('path', {d: dots.join(''), stroke: '#d8ccb4', 'stroke-width': 7, 'stroke-linecap': 'round', 'clip-path': ctx.ref(clipId)})),
  };
}

/** Distance from p along unit direction d until it leaves [0,W]×[0,H]. */
export function exitDistance(p, d, W, H) {
  const ts = [];
  if (d.x > 1e-6) ts.push((W - p.x) / d.x);
  if (d.x < -1e-6) ts.push(-p.x / d.x);
  if (d.y > 1e-6) ts.push((H - p.y) / d.y);
  if (d.y < -1e-6) ts.push(-p.y / d.y);
  return Math.max(0, Math.min(...ts));
}

export const unit = (a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  return {x: dx / l, y: dy / l};
};

/** Arc route (catmull-rom through a lifted midpoint). */
export function arcRoute(a, b, lift) {
  const m = {x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift};
  return polyline(catmullRom([a, m, b], 16));
}

/* ------------------------------------------------------------------ */
/* Sorter stage (story; context of the inspect)                        */
/* ------------------------------------------------------------------ */

/** Design size of the sorter stage per layout shape. */
export const STAGE = {landscape: {w: 1840, h: 800}, portrait: {w: 1000, h: 1430}, square: {w: 1160, h: 924}};

/**
 * Geometry per shape (absolute stage units). The rail always runs from the
 * magazine (upstream) down to the side bin; gates share the span `gates`.
 * `arms`: which arm performs which task; shoulders are anchored far outside
 * the window so the arms always enter from its edge.
 */
const GEO = {
  landscape: {
    fs: 1, rack: {x: 16, y: 16, w: 500}, rackFoot: 22, book: {x: 30, w: 472, h: 290}, shelves: [330, 666], text2: {x: 60, w: 150, h: 200},
    holder: {x: 1010, y: 54, k: 0.86}, cup: {x: 1752, y: 372},
    rail: {p0: {x: 548, y: 458}, p1: {x: 1606, y: 500}}, magX: 662, gates: [796, 1594],
    side: {x: 1616, w: 204, top: 572}, plateDrop: 8, binDrop: 56, binBottom: 724, lupaRot: -150, parkRot: 150, parkDx: 0,
    arms: [{tasks: ['article'], side: 'left', anchor: {x: 820, y: 2200}}, {tasks: ['lupa'], side: 'right', anchor: {x: 1820, y: 2200}}],
    chip: {x: 266, anchor: 'middle', maxWidth: 440, y: 740}, statusY: 740,
  },
  portrait: {
    fs: 1, rack: {x: 16, y: 16, w: 520}, rackFoot: 16, book: {x: 28, w: 496, h: 270}, shelves: [314, 572], text2: {x: 56, w: 140, h: 190},
    holder: {x: 556, y: 54, k: 0.96}, cup: {x: 900, y: 690},
    rail: {p0: {x: 16, y: 1000}, p1: {x: 786, y: 1030}}, magX: 106, gates: [206, 778],
    side: {x: 794, w: 190, top: 1100}, plateDrop: 8, binDrop: 56, binBottom: 1318, lupaRot: -155, parkRot: -165, parkDx: 0,
    // the article arm reaches down from the top edge (it never crosses the shelf column or the rail)
    arms: [{tasks: ['article'], side: 'right', anchor: {x: 760, y: -2600}, width: 50}, {tasks: ['lupa'], side: 'right', anchor: {x: 1020, y: 2900}}],
    chip: {x: 500, anchor: 'middle', maxWidth: 600, y: 1384}, statusY: 1332,
  },
  square: {
    fs: 1.05, rack: {x: 690, y: 16, w: 454}, rackFoot: 16, book: {x: 702, w: 430, h: 250}, shelves: [292, 536], text2: {x: 716, w: 124, h: 180},
    holder: {x: 256, y: 44, k: 0.84}, cup: {x: 1080, y: 536, onShelf: true, ch: 50}, lupa: {R: 48, L: 86},
    rail: {p0: {x: 16, y: 586}, p1: {x: 928, y: 622}}, magX: 114, gates: [226, 920],
    side: {x: 936, w: 208, top: 690}, plateDrop: 8, binDrop: 56, binBottom: 846, lupaRot: -120, parkRot: 180, parkDx: 20,
    arms: [{tasks: ['article', 'lupa'], side: 'right', anchor: {x: 1040, y: 2300}}],
    chip: {x: 16, anchor: 'start', maxWidth: 300, y: 860}, statusY: 858,
  },
};
export const STORY_GEO = GEO;

const ARM_W = 56;
const ARM_EXT = 0.94;
const PLATE_H = 46;

/**
 * The sorter wall: stand with the books, filter holder, magazine with the
 * collection, rail with keyed gates, bins, side bin and the magnifier cup,
 * plus (optionally) the reader's arms.
 * @param {any} ctx
 * @param {{prefix:string, shape:'landscape'|'portrait'|'square', params:any, scope:any, arms?:boolean, focus?:{index:number, alt:any}, examine?:number|null, statusTags?:boolean, magnify?:boolean, cardText?:{tagMin?:number, tagLines?:number, tagWidth?:number}, plateText?:{minSize?:number, maxLines?:number}, bookTitleLines?:number}} o
 */
export function sorterStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const shape = o.shape;
  const G = GEO[shape];
  const {w: W, h: H} = STAGE[shape];
  const p = o.params;
  const t = kitStrings(p.locale);
  const S = o.scope;
  const fs = G.fs;
  const showKey = ctx.show('key');

  /* --- wall, rack, books -------------------------------------------- */
  const wall = pegWall(ctx, {prefix: P, W, H});
  const nLevels = Math.max(1, Math.min(2, p.hierarchy.levels.length));
  const shelves = G.shelves.slice(0, nLevels);
  const rackBottom = shelves[shelves.length - 1] + 34 + G.rackFoot;
  const rack = hierarchyRack(ctx, {prefix: `${P}-rack`, x: G.rack.x, y: G.rack.y, w: G.rack.w, bottom: rackBottom, shelves, levels: p.hierarchy.levels.slice(0, nLevels), fs});
  const place = i => clamp(Math.round(p.hierarchy.placement[i] ?? Math.min(i, nLevels - 1)), 0, nLevels - 1);
  const bookShelf = place(0);
  const hasT2 = p.sources.length > 1;
  const t2Shelf = hasT2 ? place(1) : -1;
  const share = hasT2 && t2Shelf === bookShelf;
  // a shelf's space starts below the plank above it and below the level plate hanging from that plank
  const spaceTop = sh => (sh === 0 ? G.rack.y + 18 : Math.max(shelves[sh - 1] + 34 + 18, rack.plates[sh - 1] ? rack.plates[sh - 1].y + rack.plates[sh - 1].h + 10 : 0));
  const bookW = share ? G.book.w - G.text2.w - 26 : G.book.w;
  const bookH = Math.min(G.book.h, shelves[bookShelf] - 16 - spaceTop(bookShelf));
  const bookPos = {x: G.book.x, y: shelves[bookShelf] - 16 - bookH};
  const book = openBook(ctx, {prefix: `${P}-book`, w: bookW, h: bookH, source: p.sources[0], seedKey: 'am-book', titleLines: o.bookTitleLines});
  let t2 = null, text2Box = null;
  if (hasT2) {
    const sy = shelves[t2Shelf];
    const x2 = share ? G.rack.x + G.rack.w - 18 - G.text2.w : G.text2.x;
    const h2 = Math.min(G.text2.h, sy - spaceTop(t2Shelf));
    t2 = closedBook(ctx, {prefix: `${P}-text2`, x: x2, y: sy, w: G.text2.w, h: h2, title: p.sources[1].title});
    text2Box = {x: x2, y: sy - h2, w: G.text2.w + 6, h: h2};
  }
  // magnifier cup: on a wall ledge, or (square) on the rack shelf not used by the open book
  let cupPos = {x: G.cup.x, y: G.cup.y};
  if (G.cup.onShelf) {
    const free = nLevels > 1 ? 1 - bookShelf : bookShelf;
    cupPos = {x: G.rack.x + G.rack.w - 40, y: shelves[free]};
  }
  const cup = cupArt(ctx, {prefix: `${P}-cup`, x: cupPos.x, y: cupPos.y, ch: G.cup.ch ?? 62, ledge: !G.cup.onShelf});
  const lupa = lupaArt(ctx, {prefix: `${P}-lupa`, R: G.lupa ? G.lupa.R : LUPA.R, L: G.lupa ? G.lupa.L : LUPA.L});
  const lupaRest = {x: cup.top.x, y: cup.top.y + 44 - (lupa.R + 12 + lupa.L), rot: 0};
  // highest the lens centre may go (the rim stays inside the stage window)
  const lupaTopY = lupa.R + 26;

  /* --- article + holder -------------------------------------------- */
  const art = articleSlip(ctx, {prefix: `${P}-art`, passage: S.passage, listed: S.listed});
  const kB = book.slot.k;
  const artRest = {x: bookPos.x + book.slot.x, y: bookPos.y + book.slot.y, k: kB, rot: 0};
  const kH = G.holder.k;
  const pocketH = art.H * kH + 22;
  const holderBox = {x: G.holder.x - 16, y: G.holder.y - 12, w: art.W * kH + 32, h: pocketH + 58};
  const holder = holderArt(ctx, {prefix: `${P}-holder`, x: holderBox.x, y: holderBox.y, w: holderBox.w, h: holderBox.h, pocketH, label: p.actorLabels && p.actorLabels.b !== undefined ? p.actorLabels.b : t.filter, fs});
  const artHold = {x: G.holder.x, y: G.holder.y + 8, k: kH, rot: 0};
  // the slip (with its tab) never rises past the top of the stage window
  const artMinY = k => 10 + art.tab.h * k;
  const artAbove = {...artHold, y: Math.max(artMinY(kH), artHold.y - 44)};
  const artWorld = (pose, q) => {
    const a = (pose.rot * Math.PI) / 180;
    const x = q.x * pose.k, y = q.y * pose.k;
    return {x: pose.x + x * Math.cos(a) - y * Math.sin(a), y: pose.y + x * Math.sin(a) + y * Math.cos(a)};
  };

  /* --- rail, gates, bins -------------------------------------------- */
  const RG = railGeo(G.rail.p0, G.rail.p1);
  const nG = S.listed.length;
  const [g0, g1] = G.gates;
  const pitch = Math.abs(g1 - g0) / nG;
  const gates = S.listed.map((s, j) => {
    const cx = g0 + RG.dir * pitch * (j + 0.5);
    return {j, cx, w: pitch - 14};
  });
  const cardsL = cardLayout(ctx, S.acts, o.focus ? [o.focus.alt.subject] : [], o.cardText || {});
  const plateY = gx => RG.y(gx) + 26 + G.plateDrop;
  const binTop = gx => RG.y(gx) + G.binDrop;
  // usable bin height: below the hanging plate
  const binHmin = Math.min(...gates.map(gt => G.binBottom - (plateY(gt.cx) + PLATE_H)));
  const sideH = G.binBottom - G.side.top;
  const magW0 = Math.abs(gates[0].cx - gates[0].w / 2 - G.rail.p0.x) - 26;
  const s = Math.min(1, (pitch - 14 - 20) / CARD_W, (G.side.w - 22) / CARD_W, magW0 / CARD_W, (binHmin - 24) / cardsL.H, (sideH - 22) / cardsL.H);
  const cw = CARD_W * s, chh = cardsL.H * s;
  const nameFits = S.listed.map(ls => (showKey ? fitWords(ctx, ls.name, {maxWidth: Math.min(pitch - 14, cw + 30) - 20 - 54, size: 19 * fs, minSize: o.plateText?.minSize ?? 13, maxLines: o.plateText?.maxLines ?? 2, weight: 700}) : null));
  const plateH = Math.max(PLATE_H, ...nameFits.filter(Boolean).map(f => f.height + 14));
  const bins = gates.map((gt, j) => {
    const bw = Math.min(pitch - 12, cw + 34);
    const top = binTop(gt.cx);
    const b = binArt(ctx, {prefix: `${P}-bin${j}`, x: gt.cx - bw / 2, y: top, w: bw, h: G.binBottom - top});
    return b;
  });
  // key plates hang on the wall between the gate and its bin
  const plates = gates.map((gt, j) => {
    const bw = Math.min(pitch - 12, cw + 34);
    return keyPlate(ctx, {name: `${P}-plate${j}`, x: gt.cx - bw / 2 + 4, y: plateY(gt.cx), w: bw - 8, h: plateH, fit: nameFits[j], color: S.listed[j].color});
  });
  const sideBin = binArt(ctx, {prefix: `${P}-side`, x: G.side.x, y: G.side.top, w: G.side.w, h: sideH, side: true});
  const rail = railArt(ctx, {prefix: `${P}-rail`, geo: RG, gates});
  const aRad = Math.atan(RG.slope);
  const nrm = {x: Math.sin(aRad), y: -Math.cos(aRad)};
  const onRail = x => ({x: x + nrm.x * chh / 2, y: RG.y(x) + nrm.y * chh / 2});

  /* --- magazine + cards --------------------------------------------- */
  const nA = S.acts.length;
  // fan: every strip shows; tighter only if the stand above would be touched
  const room = RG.y(G.magX) - (G.rack.x < G.magX + cw / 2 + 12 && G.rack.x + G.rack.w > G.magX - cw / 2 - 12 ? rackBottom + 30 : 90) - chh - 26;
  const offset = Math.max(Math.min(cardsL.stripH * s + 4, room / Math.max(1, nA - 1)), 26 * s);
  const magHH = chh + (nA - 1) * offset + 26;
  const mag = magazineArt(ctx, {prefix: `${P}-mag`, cx: G.magX, bottom: RG.y(G.magX) + 2, w: cw + 22, hh: magHH, flapH: chh * 0.9, dir: RG.dir});
  let magLabel = null;
  if (showKey) {
    const text = (p.objectLabels && p.objectLabels.collection) || t.activities;
    const opts = {size: 20 * fs, minSize: 15, maxLines: 1, fill: th.card, name: `${P}-maglabel`};
    magLabel = chip(ctx, text, {...opts, x: G.magX, y: mag.box.y - 58, anchor: 'middle', maxWidth: Math.max(cw + 60, 220)});
    const rk = {x: G.rack.x - 8, y: G.rack.y, w: G.rack.w + 16, h: rackBottom - G.rack.y + 8};
    const b = magLabel.box;
    if (b.x < rk.x + rk.w && b.x + b.w > rk.x && b.y < rk.y + rk.h && b.y + b.h > rk.y) {
      // the stand is above the magazine: the label sits beside the magazine's top instead
      magLabel = chip(ctx, text, {...opts, x: mag.box.x + mag.box.w + 14, y: Math.max(mag.box.y + 4, rackBottom + 14), anchor: 'start', maxWidth: 300, maxLines: 2});
    }
  }

  // containers: listed j -> bin j, otherwise the side bin
  const contBox = c => (c === 'side' ? sideBin.box : bins[c].box);
  const restIn = (c, k) => {
    const b = contBox(c);
    return {x: b.x + b.w / 2 + (k % 2 ? 12 : k ? -12 : 0) * s, y: b.y + b.h - 12 - chh / 2 - k * 9 * s, rot: k % 2 ? 3 : k ? -3 : -1};
  };
  const plans = S.acts.map(a => ({container: a.listedIdx >= 0 ? a.listedIdx : 'side'}));
  const counts = {};
  plans.forEach(pl => {
    const key = String(pl.container);
    pl.stack = counts[key] || 0;
    counts[key] = pl.stack + 1;
  });
  // focus (inspect): the card's container after the substitution (placed on top of that pile)
  let focusAfter = null;
  if (o.focus) {
    const alt = o.focus.alt;
    const c = alt.listedIdx >= 0 ? alt.listedIdx : 'side';
    const same = String(c) === String(plans[o.focus.index].container);
    focusAfter = {container: c, stack: same ? plans[o.focus.index].stack : counts[String(c)] || 0};
  }
  const endX = RG.p1.x + RG.dir * 12;
  plans.forEach((pl, i) => {
    pl.targetX = pl.container === 'side' ? endX : gates[pl.container].cx;
    pl.dist = Math.abs(pl.targetX - G.magX);
    pl.rest = restIn(pl.container, pl.stack);
    pl.railEnd = {...onRail(pl.targetX), rot: RG.angle};
  });

  const cards = S.acts.map((a, i) => activityCard(ctx, {
    prefix: `${P}-card${i}`, act: a, CL: cardsL, fit: cardsL.fits[i],
    alt: o.focus && o.focus.index === i ? {tag: o.focus.alt, fit: showKey ? cardsL.tagFit(o.focus.alt.subject) : null} : null,
  }));

  // lower cards in front of the upper ones in the fanned stack; a focus card
  // (inspect) is drawn above all so it lies on top wherever it is re-sorted
  const cardOrder = cards.map((_, i) => i).reverse();
  if (o.focus) cardOrder.push(...cardOrder.splice(cardOrder.indexOf(o.focus.index), 1));

  /* --- keys (tokens flying from the article rows into the plate sockets) */
  const keys = S.listed.map((ls, j) => markDisc(ctx, {shape: ls.mark, color: ls.color, R: 16, name: `${P}-key${j}`, opacity: 0}));
  const keyFrom = j => artWorld(artHold, art.rows[j].mark);
  const keyRoutes = S.listed.map((ls, j) => arcRoute(keyFrom(j), plates[j].socket, 60));
  // each flying key stays tethered to its row of the article by a dashed cord until it seats
  const tethers = S.listed.map((ls, j) => h('path', {name: `${P}-tether${j}`, d: '', fill: 'none', stroke: ls.color, 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round', opacity: 0}));

  /* --- magnified copy for the lupa ---------------------------------- */
  const exIdx = o.examine ?? null;
  let magNode = null;
  if (exIdx !== null && o.magnify !== false) {
    // a text-free copy with the same layout: the lens enlarges the tag's mark
    const copy = activityCard(ctx, {prefix: `${P}-magcard`, act: S.acts[exIdx], CL: cardsL, fit: cardsL.fits[exIdx], ghost: true, noText: true});
    magNode = g({name: `${P}-mag`, opacity: 0},
      h('defs', null, h('clipPath', {id: ctx.id(`${P}-magclip`)}, h('circle', {name: `${P}-magc`, r: lupa.R - 6}))),
      g({'clip-path': ctx.ref(`${P}-magclip`)},
        g({name: `${P}-magzoom`}, g({name: `${P}-magcard-pose`}, copy.node))));
  }

  /* --- status tags ---------------------------------------------------- */
  let stIn = null, stUn = null;
  if (o.statusTags !== false && showKey) {
    const size = 21 * fs;
    const bx0 = Math.min(...bins.map(b => b.box.x)), bx1 = Math.max(...bins.map(b => b.box.x + b.box.w));
    const tagIn = chipStatus(ctx, t.included, {x: (bx0 + bx1) / 2, y: G.statusY, size, maxWidth: bx1 - bx0 - 20, color: th.ink, name: `${P}-st-in`});
    stIn = g({name: `${P}-st-in-g`, opacity: 0},
      h('path', {d: `M${r(bx0 + 6)} ${G.statusY - 4}V${G.statusY + 8}H${r(bx1 - 6)}V${G.statusY - 4}`, fill: 'none', stroke: th.fg, 'stroke-width': 2.2, opacity: 0.6}),
      tagIn.node);
    const sx0 = G.side.x, sx1 = G.side.x + G.side.w;
    const tagUn = chipStatus(ctx, t.unclassified, {x: sx1 - 2, anchor: 'end', y: G.statusY, size, maxWidth: Math.min(W - 24, sx1 - sx0 + 230), color: th.ink, dashed: true, name: `${P}-st-un`});
    stUn = g({name: `${P}-st-un-g`, opacity: 0}, tagUn.node);
  }

  /* --- arms ----------------------------------------------------------- */
  const look = actorLook(ctx, p.reader || {appearance: {skin: 3, outfit: 0}}, 0);
  const artGripRest = artWorld(artRest, art.grip);
  const artGripHold = artWorld(artHold, art.grip);
  const lupaGripRest = lupaPoint(lupaRest, lupa.grip);
  // examination pose: lens over the examined card's tag mark (card at rest)
  let lupaExam = null, lupaLay = null, exMark = null;
  if (exIdx !== null) {
    const pl = plans[exIdx];
    exMark = cardPoint(pl.rest, cards[exIdx].mark, s);
    lupaExam = {x: exMark.x, y: exMark.y - 8, rot: G.lupaRot};
    // after reading, the magnifier is set down on the rim of that card's container, just above the
    // card (the card's name stays visible) and keeps showing the enlarged tag
    const cb = contBox(pl.container);
    // turned the short way round from the reading pose (the hand never swings through a full turn)
    const pr = G.parkRot ?? G.lupaRot;
    lupaLay = {x: cb.x + cb.w / 2 + (G.parkDx ?? 0), y: cb.y - 5 - (lupa.R + 4), rot: G.lupaRot + ((((pr - G.lupaRot) % 360) + 540) % 360) - 180};
  }
  // the magnifier rises out of its cup (never past the top of the window), then travels to the examined tag
  // and goes round its cup (never through it) on the side facing the examined card
  let lupaRoute = null;
  if (lupaExam) {
    const up = {x: lupaRest.x, y: Math.max(lupaTopY, lupaRest.y - 80)};
    const side = lupaExam.x < lupaRest.x ? -1 : 1;
    const wx = clamp(cup.top.x + side * (lupa.R + 84), lupa.R + 16, W - lupa.R - 16);
    lupaRoute = polyline(catmullRom([lupaRest, up, {x: (up.x + wx) / 2, y: up.y + 10}, {x: wx, y: Math.max(up.y + 60, cupPos.y + 10)}, lupaExam], 16));
  }
  const parkRoute = lupaExam ? polyline(catmullRom([lupaExam, {x: (lupaExam.x + lupaLay.x) / 2, y: Math.min(lupaExam.y, lupaLay.y) - 36}, lupaLay], 12)) : null;
  // leader from the parked lens to the tag it read
  const lupaLead = exMark ? g({name: `${P}-lupa-lead`, opacity: 0},
    h('path', {name: `${P}-lupa-lead-l`, d: '', stroke: th.ink, 'stroke-width': 2.4, 'stroke-dasharray': '5 4', fill: 'none'}),
    h('circle', {cx: r(exMark.x), cy: r(exMark.y), r: 17, fill: 'none', stroke: th.ink, 'stroke-width': 2.4})) : null;
  const armSpecs = o.arms === false ? [] : G.arms;
  const arms = armSpecs.map((spec, ai) => {
    const anchor = spec.anchor;
    const targets = [];
    if (spec.tasks.includes('article')) targets.push(artGripRest, artGripHold, artWorld({...artAbove, x: (artRest.x + artAbove.x) / 2, y: Math.min(artRest.y, artAbove.y) - 60}, art.grip));
    if (spec.tasks.includes('lupa') && lupaExam) targets.push(lupaGripRest, lupaPoint(lupaExam, lupa.grip), lupaPoint(lupaLay, lupa.grip));
    const lenFor = q => (exitDistance(q, unit(q, anchor), W, H) + ARM_W * 1.6) / ARM_EXT;
    const len = Math.max(400, ...targets.map(lenFor));
    const aw = spec.width ?? ARM_W;
    const HAND = 24 * 1.3 * (aw / 46);
    const rig = topArm(ctx, {name: `${P}-arm${ai}`, skin: look.skin, sleeve: look.outfit, handed: spec.side === 'left' ? 'left' : 'right', upper: (len - HAND) * 0.52, lower: (len - HAND) * 0.48, width: aw, handScale: 1.3});
    return {spec, anchor, len, rig, bend: spec.side === 'left' ? 1 : -1};
  });
  const armFor = task => arms.find(a => a.spec.tasks.includes(task)) || null;
  const outPoint = (q, anchor) => {
    const d = unit(q, anchor);
    const dd = exitDistance(q, d, W, H) + ARM_W * 2.6;
    return {x: q.x + d.x * dd, y: q.y + d.y * dd};
  };

  // reader chip
  let chipNode = null;
  if (arms.length && showKey && G.chip) {
    const text = (p.actorLabels && p.actorLabels.a) || t.reader;
    const probe = chip(ctx, text, {x: G.chip.x, y: 0, anchor: G.chip.anchor, maxWidth: G.chip.maxWidth, size: 21 * fs, minSize: 16, maxLines: 1});
    const cy = G.chip.y > H / 2 ? Math.min(G.chip.y, H - 8 - probe.box.h) : G.chip.y;
    chipNode = chip(ctx, text, {x: G.chip.x, y: cy, anchor: G.chip.anchor, maxWidth: G.chip.maxWidth, size: 21 * fs, minSize: 16, maxLines: 1, name: `${P}-chip`});
  }

  /* --- node tree ------------------------------------------------------ */
  const armA = armFor('article'), armB = armFor('lupa');
  const single = Boolean(armA && armA === armB);
  const node = g({name: P},
    wall.node,
    g({'clip-path': ctx.ref(wall.clipId)},
      rack.node,
      g({transform: T(bookPos.x, bookPos.y)}, book.node),
      t2 && t2.node,
      holder.back,
      cup.back,
      bins.map(b => b.back), sideBin.back,
      rail.leaves, rail.stat,
      mag.back,
      // lower cards in front of the upper ones (the fanned stack shows every strip)
      g({name: `${P}-cards`}, cardOrder.map(i => cards[i].node)),
      mag.front, mag.flap,
      bins.map(b => b.front), sideBin.front,
      plates.map(pl => pl.node),
      tethers,
      keys,
      // article in the hand: palm below, thumb above (one arm: its palm lies under both props)
      armA ? armA.rig.palm : null,
      art.node,
      holder.front,
      armA && !single ? armA.rig.thumb : null,
      armA && !single ? armA.rig.arm : null,
      // magnifier in the hand
      armB && !single ? armB.rig.palm : null,
      lupa.back, magNode, lupa.front,
      cup.front,
      lupaLead,
      armB ? armB.rig.thumb : null,
      armB ? armB.rig.arm : null,
      stIn, stUn,
    ),
    h('path', {d: wall.path, fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2}),
    magLabel && magLabel.node,
    chipNode && chipNode.node,
  );

  /* --- pose ------------------------------------------------------------ */
  /**
   * @param {{a?:{reach:number,pull:number,carry:number,insert:number,out:number}, keys?:number[], flap?:number,
   *          cards?:Array<{slide:number,fall:number,gate:number}>, b?:{reach:number,carry:number,exam:number,lay:number,out:number},
   *          swap?:number, move?:number, statusIn?:number, statusUn?:number}} v
   */
  function pose(v) {
    const nodes = {};
    const A = v.a || {reach: 1, pull: 1, carry: 1, insert: 1, out: 1};
    const B = v.b || {reach: 0, carry: 0, exam: 0, lay: 0, out: 0};
    /* article pose */
    let artPose;
    let artHolder = 'book';
    if (A.insert > 0) {
      const e = ease.inOutCubic(A.insert);
      artPose = {x: artAbove.x, y: lerp(artAbove.y, artHold.y, e), k: kH, rot: 0};
      artHolder = A.insert >= 1 && A.out > 0 ? 'holder' : 'hand';
      if (A.insert >= 1 && !armA) artHolder = 'holder';
    } else if (A.carry > 0) {
      const e = ease.inOutSine(A.carry);
      const lifted = {...artRest, y: artRest.y - 110};
      const lift = Math.sin(e * Math.PI) * 70;
      artPose = {x: lerp(lifted.x, artAbove.x, e), y: lerp(lifted.y, artAbove.y, e) - lift, k: lerp(kB, kH, e), rot: Math.sin(e * Math.PI) * 5};
      artHolder = 'hand';
    } else if (A.pull > 0) {
      const e = ease.inOutQuad(A.pull);
      artPose = {x: artRest.x, y: artRest.y - 110 * e, k: kB, rot: 0};
      artHolder = 'hand';
    } else artPose = {...artRest};
    artPose = {...artPose, y: Math.max(artPose.y, Math.min(artRest.y, artMinY(artPose.k)))};
    if (A.insert >= 1 && (A.out > 0 || !armA)) artHolder = 'holder';
    const artHeld = armA ? A.reach >= 1 && A.out <= 0 && A.insert < 1 + 1e-9 && artHolder !== 'book' : false;

    /* lupa pose */
    let lPose = {...lupaRest};
    let lupaHolder = 'cup';
    const rotB = lupaExam ? lupaExam.rot : 0;
    if (lupaExam && B.lay > 0) {
      // lifted off the tag and set down on the container rim
      const e = ease.inOutCubic(B.lay);
      const q = parkRoute.at(e);
      lPose = {x: q.x, y: q.y, rot: lerp(rotB, lupaLay.rot, e)};
      lupaHolder = B.lay >= 1 && B.out > 0 ? 'rim' : 'hand';
    } else if (lupaExam && B.exam > 0) {
      const wob = ctx.reduced ? 0 : Math.sin(B.exam * Math.PI * 2) * 5;
      lPose = {x: lupaExam.x + wob, y: lupaExam.y - Math.sin(B.exam * Math.PI) * 4, rot: rotB};
      lupaHolder = 'hand';
    } else if (lupaExam && B.carry > 0) {
      const e = ease.inOutSine(B.carry);
      const q = lupaRoute.at(e);
      // it turns only once it is on its way down (the handle never swings above the window)
      lPose = {x: q.x, y: q.y, rot: lerp(0, rotB, ease.inOutSine(clamp((e - 0.45) / 0.55)))};
      lupaHolder = 'hand';
    } else if (lupaExam && B.reach >= 1) {
      lupaHolder = 'hand';
    }
    if (lupaExam && B.lay >= 1 && (B.out > 0 || !armB)) lupaHolder = 'rim';

    /* arms */
    let handA = null, handB = null;
    let reachedAll = true;
    const solveArm = (arm, target) => {
      const d = unit(target, arm.anchor);
      const shoulder = {x: target.x + d.x * arm.len * ARM_EXT, y: target.y + d.y * arm.len * ARM_EXT};
      const sol = arm.rig.pose(shoulder, target, arm.bend);
      Object.assign(nodes, sol.nodes);
      if (!sol.reached) reachedAll = false;
      return sol;
    };
    const artGripNow = artWorld(artPose, art.grip);
    const lupaGripNow = lupaPoint(lPose, lupa.grip);
    const outA = armA ? outPoint(artGripRest, armA.anchor) : null;
    const outAHold = armA ? outPoint(artGripHold, armA.anchor) : null;
    const targetA = () => {
      if (A.out > 0) return mixP(artGripHold, outAHold, ease.inOutSine(A.out));
      if (A.reach < 1) return mixP(outA, artGripRest, ease.inOutSine(A.reach));
      return artGripNow;
    };
    const outB = armB ? outPoint(lupaGripRest, armB.anchor) : null;
    const lupaFinalGrip = lupaLay && armB ? lupaPoint(lupaLay, lupa.grip) : null;
    const outBEnd = armB && lupaFinalGrip ? outPoint(lupaFinalGrip, armB.anchor) : null;
    const targetB = () => {
      if (B.out > 0) return mixP(lupaFinalGrip, outBEnd, ease.inOutSine(B.out));
      if (B.reach < 1) {
        const from = armA === armB && A.out >= 1 ? outAHold : outB;
        return mixP(from, lupaGripRest, ease.inOutSine(B.reach));
      }
      return lupaGripNow;
    };
    if (armA && armA === armB) {
      // one arm, two tasks: the lupa task takes over once the article task is done
      const useB = lupaExam && A.out >= 1 && B.reach > 0;
      const sol = solveArm(armA, useB ? targetB() : targetA());
      if (useB) handB = sol.hand; else handA = sol.hand;
      if (!useB && A.out >= 1) handA = null;
    } else {
      if (armA) handA = solveArm(armA, targetA()).hand;
      if (armB) handB = lupaExam ? solveArm(armB, B.reach > 0 ? targetB() : outB).hand : solveArm(armB, outB).hand;
    }
    // props follow the SOLVED hands while held
    if (artHeld && handA) {
      const d = {x: handA.x - artGripNow.x, y: handA.y - artGripNow.y};
      artPose = {...artPose, x: artPose.x + d.x, y: artPose.y + d.y};
    }
    const lupaHeld = Boolean(armB && lupaExam && B.reach >= 1 && B.out <= 0 && handB);
    if (lupaHeld) {
      const gNow = lupaPoint(lPose, lupa.grip);
      lPose = {...lPose, x: lPose.x + handB.x - gNow.x, y: lPose.y + handB.y - gNow.y};
    }
    nodes[`${P}-art`] = {transform: T(artPose.x, artPose.y, artPose.rot, artPose.k)};
    const lupaT = T(lPose.x, lPose.y, lPose.rot);
    nodes[`${P}-lupa-back`] = {transform: lupaT};
    nodes[`${P}-lupa-front`] = {transform: lupaT};

    /* keys, plates */
    const keyP = S.listed.map((_, j) => clamp((v.keys && v.keys[j]) || 0));
    S.listed.forEach((ls, j) => {
      const kp = keyP[j];
      const e = ease.inOutSine(kp);
      const pos = keyRoutes[j].at(e);
      const sc = lerp((art.rows[j].R * kH) / 16, 1, e) * (1 + Math.sin(e * Math.PI) * 0.18);
      nodes[`${P}-key${j}`] = {transform: T(pos.x, pos.y, 0, sc), opacity: kp > 0 ? 1 : 0};
      // the cord runs from the article row to the key while it flies, then is reeled away
      const n = 24;
      const cord = kp > 0 && kp < 1 ? Array.from({length: n + 1}, (_, i) => keyRoutes[j].at((e * i) / n)) : [];
      nodes[`${P}-tether${j}`] = {d: cord.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), opacity: kp > 0 && kp < 1 ? r(1 - clamp((kp - 0.85) / 0.15), 3) : 0};
      nodes[`${P}-plate${j}-name`] = {opacity: r(clamp((kp - 0.8) / 0.2), 3)};
    });

    /* magazine flap */
    const flap = clamp(v.flap ?? 0);
    nodes[`${P}-mag-flap`] = {transform: T(mag.hinge.x, mag.hinge.y - flap * chh * 0.86)};

    /* cards */
    const cv = v.cards || S.acts.map(() => ({slide: 0, fall: 0, gate: 0}));
    const cardPos = [];
    const holders = [];
    const gateOpen = gates.map(() => 0);
    const cleared = plans.map((pl, i) => clamp(((cv[i].slide * pl.dist) - (cw + 16)) / 110));
    plans.forEach((pl, i) => {
      const c = cv[i];
      let pose;
      let holder;
      if (c.fall > 0) {
        const e = c.fall;
        const eIn = e * e;
        const from = pl.railEnd;
        const to = pl.rest;
        if (pl.container === 'side') {
          const tip = Math.sin(clamp(e * 1.4) * Math.PI / 2);
          pose = {x: lerp(from.x, to.x, ease.outQuad(e)), y: lerp(from.y, to.y, eIn), rot: lerp(from.rot, to.rot, e) + RG.dir * 26 * tip * (1 - e)};
        } else {
          pose = {x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, eIn), rot: lerp(from.rot, to.rot, e)};
        }
        holder = e >= 1 ? (pl.container === 'side' ? 'side' : `bin${pl.container}`) : 'falling';
        if (pl.container !== 'side') gateOpen[pl.container] = Math.max(gateOpen[pl.container], c.gate);
      } else if (c.slide > 0) {
        const x = G.magX + RG.dir * pl.dist * c.slide;
        pose = {...onRail(x), rot: RG.angle};
        holder = 'rail';
        if (pl.container !== 'side') gateOpen[pl.container] = Math.max(gateOpen[pl.container], c.gate);
      } else {
        // in the magazine: slot drops as the cards below leave
        let slot = i;
        for (let j = 0; j < i; j++) slot -= cleared[j];
        const base = onRail(G.magX);
        pose = {x: base.x + nrm.x * slot * offset, y: base.y + nrm.y * slot * offset, rot: RG.angle};
        holder = 'magazine';
      }
      // inspect: relocation of the focused card after the substitution
      if (o.focus && o.focus.index === i && (v.move ?? 0) > 0 && focusAfter) {
        // lifted out, carried above the rail, lowered into its new place
        const m = ease.inOutSine(v.move);
        const to = restIn(focusAfter.container, focusAfter.stack);
        if (String(focusAfter.container) === String(pl.container)) {
          pose = {x: lerp(pose.x, to.x, m), y: lerp(pose.y, to.y, m), rot: lerp(pose.rot, to.rot, m)};
        } else {
          const high = x => RG.y(x) - chh / 2 - 26;
          const route = polyline(catmullRom([{x: pose.x, y: pose.y}, {x: pose.x, y: high(pose.x)}, {x: to.x, y: high(to.x)}, {x: to.x, y: to.y}], 14));
          const q = route.at(m);
          pose = {x: q.x, y: q.y, rot: lerp(pose.rot, to.rot, m)};
        }
        holder = m >= 1 ? (focusAfter.container === 'side' ? 'side' : `bin${focusAfter.container}`) : 'moving';
      }
      nodes[`${P}-card${i}`] = {transform: T(pose.x, pose.y, pose.rot, s)};
      cardPos.push(pose);
      holders.push(holder);
      // texts hidden only where an opaque part covers them (the stack in the
      // magazine, the key plate a card falls behind): never read as overprints
      const tx = cards[i].texts;
      if (tx) {
        const top = pose.y - chh / 2;
        const stripB = top + cardsL.stripH * s;
        const labT = stripB + 10 * s, labB = labT + cards[i].labelH * s;
        let hideLabel = holder === 'magazine' && i > 0 && cleared.slice(0, i).reduce((acc, q) => acc - q, i) > 0.5;
        let hideStrip = false;
        // in a pile the earlier card lies in front; a card resting behind it keeps only its edges visible
        const fIdx = o.focus ? o.focus.index : -1;
        if (i !== fIdx && /^bin|^side/.test(holder) && holders.some((hq, k) => k < i && k !== fIdx && hq === holder)) hideLabel = hideStrip = true;
        if ((holder === 'falling' && pl.container !== 'side') || holder === 'moving') {
          // behind a key plate (opaque): texts under it are hidden
          const cxL = pose.x - cw / 2, cxR = pose.x + cw / 2;
          for (const q of plates) {
            const pb = q.box;
            if (cxR <= pb.x || cxL >= pb.x + pb.w) continue;
            hideStrip = hideStrip || (stripB > pb.y && top < pb.y + pb.h);
            hideLabel = hideLabel || (labB > pb.y && labT < pb.y + pb.h);
          }
        }
        if (tx.label) nodes[tx.label] = {opacity: hideLabel ? 0 : 1};
        nodes[tx.num] = {opacity: hideStrip ? 0 : 1};
        if (tx.tag) nodes[tx.tag] = {opacity: hideStrip ? 0 : 1};
        if (tx.tagB) nodes[tx.tagB] = {opacity: hideStrip ? 0 : 1};
      }
    });
    if (o.focus && /^bin|^side/.test(holders[o.focus.index])) {
      holders.forEach((hq, i) => {
        const tx = cards[i].texts;
        if (i === o.focus.index || !tx || hq !== holders[o.focus.index]) return;
        if (tx.label) nodes[tx.label] = {opacity: 0};
        nodes[tx.num] = {opacity: 0};
        if (tx.tag) nodes[tx.tag] = {opacity: 0};
      });
    }
    // gate leaves (opening only for the card whose tag matches the key)
    gates.forEach((gt, j) => {
      const op = ease.inOutSine(clamp(gateOpen[j]));
      const hl = {x: gt.cx - gt.w / 2, y: RG.y(gt.cx - gt.w / 2)};
      const hr = {x: gt.cx + gt.w / 2, y: RG.y(gt.cx + gt.w / 2)};
      nodes[`${P}-rail-g${j}-L`] = {transform: T(hl.x, hl.y, RG.angle + op * 80)};
      nodes[`${P}-rail-g${j}-R`] = {transform: T(hr.x, hr.y, RG.angle - op * 80)};
    });
    // tag swap (inspect)
    if (o.focus) {
      const sw = clamp(v.swap ?? 0);
      const out = clamp(sw * 2), inn = clamp(sw * 2 - 1);
      nodes[`${P}-card${o.focus.index}-tag`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
      nodes[`${P}-card${o.focus.index}-tagB`] = {opacity: r(inn, 3), transform: `translate(0 ${r(10 * (1 - inn))})`};
    }

    /* magnified copy */
    if (magNode) {
      const pl = plans[exIdx];
      const cp = cardPos[exIdx];
      const markW = cardPoint(cp, cards[exIdx].mark, s);
      const dist = Math.hypot(lPose.x - markW.x, lPose.y - markW.y);
      const landed = holders[exIdx] === (pl.container === 'side' ? 'side' : `bin${pl.container}`);
      // over the tag it enlarges what lies under it; once set down it keeps the enlarged tag in view
      const lay = lupaExam ? ease.inOutCubic(B.lay) : 0;
      const vis = landed ? (lay > 0 ? 1 : clamp(1 - (dist - 10) / 50)) : 0;
      const look = {x: lerp(lPose.x, markW.x, lay), y: lerp(lPose.y, markW.y, lay)};
      nodes[`${P}-mag`] = {opacity: r(vis, 3)};
      nodes[`${P}-magc`] = {cx: r(lPose.x), cy: r(lPose.y)};
      nodes[`${P}-magzoom`] = {transform: `translate(${r(lPose.x)} ${r(lPose.y)}) scale(1.9) translate(${r(-look.x)} ${r(-look.y)})`};
      nodes[`${P}-magcard-pose`] = {transform: T(cp.x, cp.y, cp.rot, s)};
    }
    if (lupaLead) {
      const lay = ease.inOutCubic(B.lay);
      const d = unit(lPose, exMark);
      const from = {x: lPose.x + d.x * (lupa.R + 8), y: lPose.y + d.y * (lupa.R + 8)};
      const to = {x: exMark.x - d.x * 18, y: exMark.y - d.y * 18};
      nodes[`${P}-lupa-lead`] = {opacity: r(clamp((lay - 0.7) / 0.3), 3)};
      nodes[`${P}-lupa-lead-l`] = {d: `M${r(from.x)} ${r(from.y)}L${r(to.x)} ${r(to.y)}`};
    }
    if (stIn) nodes[`${P}-st-in-g`] = {opacity: r(clamp(v.statusIn ?? 0), 3)};
    if (stUn) nodes[`${P}-st-un-g`] = {opacity: r(clamp(v.statusUn ?? 0), 3)};

    const R2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    return {
      nodes,
      semantic: {
        article: R2(artPose), articleScale: r(artPose.k, 3), articleHolder: artHolder,
        artGrip: R2(artWorld(artPose, art.grip)), handA: R2(handA),
        lupa: R2(lPose), lupaGrip: R2(lupaPoint(lPose, lupa.grip)), handB: R2(handB), lupaHolder,
        keys: keyP.map(k => r(k, 3)), keyed: keyP.map(k => k >= 1), flap: r(flap, 3),
        cards: cardPos.map(R2), holders, gates: gateOpen.map(v2 => r(v2, 3)),
        allReached: reachedAll,
        // the lens (rim included) lies wholly above the examined card: its name is never covered
        lensClearOfCard: exIdx !== null ? lPose.y + lupa.R + 6 <= cardPos[exIdx].y - chh / 2 + 1 : null,
        ...Object.fromEntries(cardPos.map((q, i) => [`c${i}`, R2(q)])),
      },
    };
  }

  return {
    bookBox: {x: bookPos.x, y: bookPos.y, w: bookW + 8, h: bookH + 14}, text2Box, rackBottom: rack.bottom,
    node, pose, W, H, G, RG, gates, bins, plates, sideBin, plans, cards, cardsL, s, cw, chh, art, artHold, artRest, book, bookPos, rack, holder, holderBox, mag, magLabel,
    lupa, lupaRest, lupaExam, lupaPark: lupaLay, examined: exIdx, cupPos, exMark, arms, focusAfter, restIn, onRail, chipBox: chipNode ? chipNode.box : null,
    statusBoxes: {y: G.statusY},
    /** stage point of a card-local point for a card pose */
    cardPoint: (pose, q) => cardPoint(pose, q, s),
    /** build another copy of card i (for lens content) */
    cardCopy: (prefix, i, extra = {}) => activityCard(ctx, {prefix, act: S.acts[i], CL: cardsL, fit: cardsL.fits[i], ...extra}),
    strings: t,
  };
}

/** Stage point of a card-local point for a card pose {x,y,rot} at scale s. */
function cardPoint(pose, q, s) {
  const a = (pose.rot * Math.PI) / 180;
  const x = q.x * s, y = q.y * s;
  return {x: pose.x + x * Math.cos(a) - y * Math.sin(a), y: pose.y + x * Math.sin(a) + y * Math.cos(a)};
}

const mixP = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

/** Status tag with a dot (solid) or dashed ring (not classified). */
export function chipStatus(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size ?? 21;
  const f = fitWords(ctx, text, {maxWidth: (o.maxWidth ?? 360) - size * 2.2, size, minSize: size * 0.75, maxLines: 1, weight: 700});
  const padX = size * 0.7;
  const w = f.width + padX * 2 + size * 1.1;
  const hh = size * 1.8;
  const x = o.anchor === 'end' ? o.x - w : o.anchor === 'start' ? o.x : o.x - w / 2;
  const node = g({name: o.name},
    h('rect', {x: r(x), y: r(o.y), width: r(w), height: r(hh), rx: r(hh / 2), fill: th.card, stroke: o.color ?? th.ink, 'stroke-width': 2, 'stroke-dasharray': o.dashed ? '7 5' : null}),
    o.dashed
      ? h('circle', {cx: r(x + padX + size * 0.3), cy: r(o.y + hh / 2), r: r(size * 0.3), fill: 'none', stroke: NEUTRAL, 'stroke-width': 2.4, 'stroke-dasharray': '3 2.5'})
      : h('circle', {cx: r(x + padX + size * 0.3), cy: r(o.y + hh / 2), r: r(size * 0.3), fill: th.accent4}),
    textBlock(f, {x: r(x + padX + size * 0.9), y: r(o.y + (hh - f.height) / 2), fill: th.ink}));
  return {node, box: {x, y: o.y, w, h: hh}};
}

/* ------------------------------------------------------------------ */
/* Card schedule (shared by the entries)                               */
/* ------------------------------------------------------------------ */

/**
 * One card after another: each slide lasts in proportion to its distance
 * (same speed for every card), then the card falls into its container.
 * @param {{plans:any[]}} stage
 * @param {{t0:number, stagger:number, slideSpan:number, fallSpan:number}} o
 */
export function cardSchedule(stage, o) {
  const maxD = Math.max(1, ...stage.plans.map(pl => pl.dist));
  return stage.plans.map((pl, i) => {
    const start = o.t0 + i * o.stagger;
    const slideEnd = start + Math.max(0.03, (o.slideSpan * pl.dist) / maxD);
    const fallEnd = slideEnd + o.fallSpan * (pl.container === 'side' ? 1.3 : 1);
    return {start, slideEnd, fallEnd, gated: pl.container !== 'side'};
  });
}

/** Per-card {slide, fall, gate} values at time u for a schedule. */
export function cardValues(u, sched) {
  return sched.map(q => ({
    slide: ease.inOutSine(seg(u, q.start, q.slideEnd)),
    fall: seg(u, q.slideEnd, q.fallEnd),
    gate: q.gated ? seg(u, q.slideEnd - 0.016, q.slideEnd) * (1 - seg(u, q.fallEnd + 0.004, q.fallEnd + 0.03)) : 0,
  }));
}

/* ------------------------------------------------------------------ */
/* Attributed reading (interpretations)                                */
/* ------------------------------------------------------------------ */

/**
 * Pick the note position: clear of every obstacle, with a leader (edge of
 * the note → target) that crosses no leader obstacle, and the shortest leader.
 * A target may carry `alt` / `alts` (further anchors on the same object, e.g. the
 * other edge of a card, or the lens showing it): the leader goes to whichever
 * anchor gives the better line.
 * `build(c, target)` returns {box}. Falls back to the clear spot whose leader
 * crosses the fewest obstacles (then the shortest), then to the first
 * candidate. The result carries the chosen `target`.
 */
export function pickSpot(cands, build, obstacles, target, leadObstacles = obstacles) {
  const tgts = [target, ...(target.alt ? [target.alt] : []), ...(target.alts || [])];
  let best = null, bestScore = Infinity, fallback = null, fbScore = Infinity;
  for (const c of cands) {
    for (const tg of tgts) {
      const b = build(c, tg);
      if (obstacles.some(q => boxHit(b.box, q))) continue;
      const from = leaderFrom(b.box, tg);
      const len = Math.hypot(tg.x - from.x, tg.y - from.y);
      const crossN = leadObstacles.filter(q => segHitsBox(from, tg, q)).length;
      if (!crossN && len < bestScore) { best = {...b, target: tg, score: len}; bestScore = len; }
      if (crossN * 1e5 + len < fbScore) { fallback = {...b, target: tg, score: crossN * 1e5 + len}; fbScore = crossN * 1e5 + len; }
    }
  }
  return best || fallback || {...build(cands[0], target), target, score: 1e9};
}

/** Start of a leader on a box edge, toward a target (as callout() does). */
export function leaderFrom(b, t) {
  const from = {x: Math.max(b.x, Math.min(t.x, b.x + b.w)), y: t.y > b.y + b.h ? b.y + b.h : t.y < b.y ? b.y : b.y + b.h / 2};
  if (from.y === b.y + b.h / 2) from.x = t.x > b.x + b.w / 2 ? b.x + b.w : b.x;
  return from;
}

/** Whether segment a→b passes through box q (the last 26 units near b are ignored). */
function segHitsBox(a, b, q) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(2, Math.ceil(L / 8));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (L * (1 - t) < 26) break;
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    if (x > q.x + 2 && x < q.x + q.w - 2 && y > q.y + 2 && y < q.y + q.h - 2) return true;
  }
  return false;
}

const boxHit = (a, b, pad = 6) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/**
 * Sticky note carrying a reading attributed to its (fictional) source, with
 * a dashed leader to what it refers to. It is never applied by the filter.
 * Placed at the first candidate clear of the obstacles (else the first).
 * @param {any} ctx
 * @param {{name:string, by:string, text:string, heading:string, tagline:string, cands:any[], obstacles:any[], target:{x:number,y:number}, size?:number}} o
 */
export function attributedNote(ctx, o) {
  const th = ctx.theme;
  const size = o.size ?? 19;
  const build = c => {
    const maxW = Math.min(c.maxWidth, 400);
    const f1 = fitWords(ctx, `${o.heading} · ${o.by}`, {maxWidth: maxW - 30, size: size * 0.92, minSize: 13, maxLines: 2, weight: 700});
    const f2 = fitWords(ctx, `“${o.text}”`, {maxWidth: maxW - 30, size, minSize: 14, maxLines: 4, weight: 500});
    const f3 = fitWords(ctx, o.tagline, {maxWidth: maxW - 30, size: size * 0.8, minSize: 12, maxLines: 1, weight: 600});
    const w = Math.max(f1.width, f2.width, f3.width) + 30;
    const hh = f1.height + f2.height + f3.height + 44;
    const x = c.anchor === 'middle' ? c.x - w / 2 : c.anchor === 'end' ? c.x - w : c.x;
    return {box: {x, y: c.y, w, h: hh}, f1, f2, f3};
  };
  const pick = pickSpot(o.cands, build, o.obstacles, o.target, o.leadObstacles || o.obstacles);
  const {box, f1, f2, f3} = pick;
  const tgt = {x: pick.target.x, y: pick.target.y};
  const yellow = '#fbe7a1';
  const from = leaderFrom(box, tgt);
  const node = g({name: o.name, opacity: 0},
    h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(tgt.x)} ${r(tgt.y)}`, stroke: th.fgSoft, 'stroke-width': 2.4, 'stroke-dasharray': '7 6', fill: 'none'}),
    h('circle', {cx: r(tgt.x), cy: r(tgt.y), r: 6, fill: th.fgSoft}),
    h('path', {d: roundRectPath(box.x + 5, box.y + 7, box.w, box.h, 6), fill: th.shadow}),
    h('path', {d: `M${r(box.x)} ${r(box.y)}H${r(box.x + box.w)}V${r(box.y + box.h - 18)}L${r(box.x + box.w - 18)} ${r(box.y + box.h)}H${r(box.x)}Z`, fill: yellow, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(box.x + box.w)} ${r(box.y + box.h - 18)}H${r(box.x + box.w - 18)}V${r(box.y + box.h)}Z`, fill: shade(yellow, -0.12), stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
    textBlock(f1, {x: box.x + 15, y: box.y + 12, fill: th.ink}),
    textBlock(f2, {x: box.x + 15, y: box.y + 12 + f1.height + 10, fill: th.ink, italic: true}),
    textBlock(f3, {x: box.x + 15, y: box.y + 12 + f1.height + 10 + f2.height + 10, fill: th.inkSoft}),
  );
  return {node, box, score: pick.score, frame: q => ({[o.name]: {opacity: r(clamp((q - 0.3) / 0.4), 3)}})};
}
