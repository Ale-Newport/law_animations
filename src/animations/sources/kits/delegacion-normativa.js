/**
 * Motif kit for "Delegación normativa" (LAW-0145..0148), category sources.
 *
 * Concrete action (brief): an instrument is linked to the document that
 * describes its enabling authorization. The physical metaphor used by all
 * four entries: a clerk takes the loose end of a gold link cord that is
 * threaded through an eyelet next to the instrument's basis clause, carries
 * it across the desk and fastens it with a binder clip to the edge of the
 * enabling page of a bound volume (the passage of Text 1 · Art. 12). A
 * paper tag threaded on the cord carries the SUPPLIED link state.
 *
 * Objects (original vector art, top-down):
 *  - libro: the bound volume, open at the enabling page (the conflicto kit's
 *    open book, imported read-only), the enabling passage on the right page.
 *  - artículo: the instrument sheet (new art here): coloured title band,
 *    index tab, basis-clause heading and wording with the reference phrase,
 *    a metal eyelet beside that phrase where the link cord is threaded.
 *  - jerarquía editable: the slotted board of the conflicto kit, showing a
 *    USER-SUPPLIED ordering of the two texts; it is displayed, never applied.
 *  - lupa: the hand lens of the conflicto kit (its glass shows a real
 *    enlarged copy of what lies under it).
 *  - link cord + binder clip + tag (new art here). The cord keeps its length:
 *    its slack is solved from the distance between its two ends.
 *
 * Supplied link states (never inferred, no validity is stated):
 *  - authorization-supplied: the clip is clamped on the enabling page, the
 *    cord runs nearly taut and the passage is highlighted;
 *  - authorization-to-be-checked: the clip is laid OPEN on the desk beside
 *    the page edge (not fastened), the cord stays slack and the passage only
 *    gets a dashed pencil outline.
 * The tag shows the state as text (and, labels hidden, as a solid band vs a
 * dashed border with a pencil). No tick, cross or alarm glyph is used.
 *
 * The kit owns fields, defaults, strings, art and a pose solver for the desk
 * stage; every entry owns its own timeline, composition and assertions.
 * @module animations/sources/kits/delegacion-normativa
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath, mix, dist, rad, cubicPolyline} from '../../../core/geometry.js';
import {str, int, list, obj} from '../../../schemas/fields.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {
  openBook, passageBlock as cetPassageBlock, hierarchyBoard, readingCard, lupa, lensView, cloneForLens, namesIn, mirror,
  fitWords, textOrBars, placeChip, boxesOverlap, segmentHits, lensFootprint, footprintInside, footprintHits,
  motifColors as cetColors, levelOf,
} from './conflicto-entre-textos.js';

export {fitWords, textOrBars, hierarchyBoard, readingCard, boxesOverlap, segmentHits, cloneForLens, namesIn, mirror, openBook, placeChip, lupa};

/* ------------------------------------------------------------------------ */
/* Whole-word wrapping                                                       */
/* ------------------------------------------------------------------------ */

/** Closing punctuation that must stay with the word before it. */
const CLOSE_P = '.,;:!?)\\]}»”’…%';
const OPEN_P = '(\\[{«“‘¿¡';
const GLUE_CLOSE = new RegExp(`\\s+([${CLOSE_P}]+)(?=\\s|$)`, 'g');
const GLUE_OPEN = new RegExp(`(^|\\s)([${OPEN_P}]+)\\s+`, 'g');

/** Text with stray punctuation tokens glued to their word (" ." → ".", "( a" → "(a"). */
export const gluePunct = text => String(text ?? '').replace(GLUE_CLOSE, '$1').replace(GLUE_OPEN, '$1$2');

/**
 * A layout context whose `fit` wraps between words only: brackets and final
 * punctuation stay with their word, and when one word is wider than the box the
 * text steps down in size (below `minSize` if it must, never under 80 % of it)
 * instead of splitting the word. Everything else is the host context.
 * @param {any} ctx
 */
export function wordSafe(ctx) {
  if (ctx.wordSafe) return ctx;
  const base0 = ctx.fit;
  // a continuation line of one or two characters ("in", "7.") reads as a fragment: narrow the wrap width
  // at the same size so the word before it comes down too (never more lines than allowed)
  const shortCont = f => f.lines.slice(1).some(l => { const q = l.trim(); return q.length > 0 && q.length <= 2 && !/^\d+$/.test(q); });
  const base = (s, o) => {
    const f = base0(s, o);
    if (f.truncated || !shortCont(f)) return f;
    const words = new Set(String(s).split(/\s+/).filter(Boolean));
    const whole = c => c.lines.every(l => l.split(' ').filter(Boolean).every(t => words.has(t)));
    for (let w = o.maxWidth * 0.96; w >= o.maxWidth * 0.45; w *= 0.96) {
      const c = base0(s, {...o, maxWidth: w, size: f.size, minSize: f.size});
      if (c.truncated || c.size !== f.size || !whole(c)) break;
      if (!shortCont(c)) return c;
    }
    return f;
  };
  const fit = (text, o) => {
    const s = gluePunct(text);
    const words = s.split(/\s+/).filter(Boolean);
    const weight = o.weight ?? 400, family = o.family ?? 'sans';
    const maxW = Math.max(10, o.maxWidth);
    const widest = sz => Math.max(0, ...words.map(w => ctx.measure(w, sz, weight, family)));
    let size = o.size;
    if (widest(size) <= maxW) return base(s, o);
    const min = o.minSize ?? o.size * 0.72;
    const floor = Math.max(9, Math.min(min, o.size) * 0.8);
    while (size > floor && widest(size) > maxW) size = Math.max(floor, size - Math.max(0.25, o.size * 0.02));
    return base(s, {...o, size, minSize: Math.min(size, min)});
  };
  return {...ctx, fit, wordSafe: true};
}

/**
 * Passage block (conflicto kit) whose highlighted phrase keeps the punctuation
 * that closes it (and a bracket that opens it), so no line starts with a lone
 * mark.
 * @param {any} ctx
 * @param {any} o  passageBlock options
 */
export function passageBlock(ctx, o) {
  const text = String(o.text ?? '');
  const ph = String(o.phrase ?? '');
  const i = ph ? text.toLowerCase().indexOf(ph.toLowerCase()) : -1;
  if (i < 0) return cetPassageBlock(wordSafe(ctx), o);
  let a = i, b = i + ph.length;
  while (b < text.length && CLOSE_P.includes(text[b])) b++;
  while (a > 0 && OPEN_P.includes(text[a - 1])) a--;
  const oo = {...o, phrase: text.slice(a, b)};
  const out = cetPassageBlock(wordSafe(ctx), oo);
  // a run of one or two characters after the first on a text ("on" flowed after the phrase) reads as a
  // fragment: the wording after the phrase then starts on its own line instead
  if (oo.inlineAfter !== false && shortRun(out.node)) {
    const alt = cetPassageBlock(wordSafe(ctx), {...oo, inlineAfter: false});
    if (!shortRun(alt.node)) return alt;
  }
  return out;
}

/** Whether a virtual text element has a later tspan of only one or two characters. */
function shortRun(node) {
  let hit = false;
  const txt = n => (typeof n === 'string' ? n : (n.children || []).map(txt).join(''));
  const walk = n => {
    if (hit || !n || typeof n === 'string') return;
    if (n.tag === 'text') {
      const spans = (n.children || []).filter(c => c && c.tag === 'tspan');
      spans.slice(1).forEach(sp => { const q = txt(sp).trim(); if (q.length > 0 && q.length <= 2 && !/^\d+$/.test(q)) hit = true; });
    }
    (n.children || []).forEach(walk);
  };
  walk(node);
  return hit;
}

/* ------------------------------------------------------------------------ */
/* Fields, defaults and strings                                              */
/* ------------------------------------------------------------------------ */

export const MAX_LEVELS = 3;
/** Link states the author can supply (never inferred). */
export const LINK_STATES = ['authorization-supplied', 'authorization-to-be-checked'];

/**
 * Category field set for "sources" as used by this motif: the enabling
 * document and the instrument, the user-supplied hierarchy, the two passages
 * the link joins and attributed interpretations.
 */
export const sourcesFields = {
  sources: list('The two fictional texts: first the enabling document (the bound volume), then the instrument that refers to it', obj('Source text', {
    id: str('Short identifier printed on the index tab and on its hierarchy token', 4),
    title: str('Title printed on the text (fictional)', 64),
    provision: str('Provision reference printed above its passage (fictional)', 32),
  }, ['id', 'title', 'provision']), 2, 2),
  hierarchy: obj('Editable hierarchy: a user-supplied ordering of the two texts on a slotted board. Neutral labels by default; it is displayed only, never applied and never stated as a fact', {
    levels: list('Level labels, top to bottom (user-supplied, neutral)', str('Level label', 36), 1, MAX_LEVELS),
    placement: list('Level of each text (0 = first level), same order as sources; values beyond the last level use the last level', int('Level index', 0, MAX_LEVELS - 1), 2, 2),
    caption: str('Caption printed at the foot of the board', 60),
  }, ['levels', 'placement']),
  passages: list('Simulated wording (same order as sources): the enabling passage of the document and the basis clause of the instrument, each with the phrase the link cord joins', obj('Passage', {
    text: str('Simulated wording (fictional)', 130),
    phrase: str('Phrase of that wording marked where the link attaches; if it does not occur in the wording it is shown as a separate marked line', 60),
  }, ['text', 'phrase']), 2, 2),
  interpretations: list('Readings attributed to fictional sources; shown as attributed notes ("reading proposed"), never endorsed', obj('Interpretation', {
    by: str('Fictional source the reading is attributed to', 64),
    text: str('Reading as proposed by that source', 90),
  }, ['by', 'text']), 0, 2),
};

export const SOURCES_DEFAULTS = {
  sources: [
    {id: 'T1', title: 'Text 1 (fictional)', provision: 'Art. 12'},
    {id: 'I3', title: 'Instrument 3 (fictional)', provision: 'Basis clause'},
  ],
  hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'], placement: [0, 1], caption: 'Order as supplied, not applied'},
  passages: [
    {text: 'The board may set detailed rules on notices in a separate instrument.', phrase: 'detailed rules on notices'},
    {text: 'This instrument is made under the power described in Text 1 · Art. 12.', phrase: 'Text 1 · Art. 12'},
  ],
  interpretations: [{by: 'Commentary C (fictional)', text: 'Reads Art. 12 as covering notices only'}],
};

export const SOURCES_DEFAULTS_ES = {
  sources: [
    {id: 'T1', title: 'Texto 1 (ficticio)', provision: 'Art. 12'},
    {id: 'I3', title: 'Instrumento 3 (ficticio)', provision: 'Cláusula de base'},
  ],
  hierarchy: {levels: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)'], placement: [0, 1], caption: 'Orden aportado, no se aplica'},
  passages: [
    {text: 'La junta puede fijar reglas detalladas sobre avisos en un instrumento separado.', phrase: 'reglas detalladas sobre avisos'},
    {text: 'Este instrumento se dicta con la facultad descrita en Texto 1 · Art. 12.', phrase: 'Texto 1 · Art. 12'},
  ],
  interpretations: [{by: 'Comentario C (ficticio)', text: 'Lee el Art. 12 como limitado a avisos'}],
};

/** Long-label stress content shared by the four entries' presets (at least as long as the baseline in every field). */
export const SOURCES_LONG = {
  sources: [
    {id: 'T1-a', title: 'Consolidated Illustrative Enabling Text on Notices (fictional)', provision: 'Article 12, paragraph 3'},
    {id: 'I3-b', title: 'Illustrative Instrument No. 3 on Notice Rules (fictional)', provision: 'Basis clause, second recital'},
  ],
  hierarchy: {levels: ['Level one as supplied by the author', 'Level two as supplied by the author', 'Level three as supplied'], placement: [0, 1], caption: 'Ordering entered by the author, displayed only'},
  passages: [
    {text: 'The board may set detailed rules on the form and timing of notices to members in a separate written instrument adopted later.', phrase: 'detailed rules on the form and timing of notices'},
    {text: 'This illustrative instrument states that it is made under the power described in Text 1 · Article 12, paragraph 3 (fictional).', phrase: 'Text 1 · Article 12, paragraph 3'},
  ],
  interpretations: [{by: 'Commentary on the illustrative enabling text (fictional)', text: 'Reads Article 12, paragraph 3 as covering the form of notices but not their timing'}],
};

export const KIT_STRINGS = {
  en: {
    authSupplied: 'Authorization supplied',
    authToCheck: 'Authorization to be checked',
    keyNote: 'As supplied · no conclusion drawn',
    hierarchy: 'Editable hierarchy',
    readingProposed: 'Reading proposed',
    changedDatum: 'Changed datum',
    before: 'Before',
    after: 'After',
    link: 'Link',
    clerk: 'Clerk',
    reader: 'Reader',
    tagSupplied: 'Given',
    tagToCheck: 'To check',
  },
  es: {
    authSupplied: 'Habilitación aportada',
    authToCheck: 'Habilitación por comprobar',
    keyNote: 'Según lo aportado · sin conclusión',
    hierarchy: 'Jerarquía editable',
    readingProposed: 'Lectura propuesta',
    changedDatum: 'Dato cambiado',
    before: 'Antes',
    after: 'Después',
    link: 'Enlace',
    clerk: 'Oficial',
    reader: 'Lectora',
    tagSupplied: 'Facilitada',
    tagToCheck: 'A comprobar',
  },
};

/** Kit strings for a context (scene strings merged over built-ins). */
export const kitT = ctx => ({...KIT_STRINGS.en, ...(KIT_STRINGS[ctx.params.locale] || {}), ...ctx.t});

/** Label of a supplied link state. */
export function stateLabel(ctx, state) {
  const t = kitT(ctx);
  return state === 'authorization-to-be-checked' ? t.authToCheck : t.authSupplied;
}

/** Motif colours (palette-derived where it matters so mono stays coherent). */
export function motifColors(ctx) {
  const th = ctx.theme;
  const mono = ctx.params.palette === 'mono';
  return {
    book: mono ? '#5a5a5a' : '#8a4b32',
    inst: mono ? '#3f3f3f' : '#3d5a6c',
    src: mono ? ['#5a5a5a', '#3f3f3f'] : ['#8a4b32', '#3d5a6c'],
    cord: mono ? '#8c8c8c' : '#c8952c',
    cordDark: mono ? '#4a4a4a' : '#7d5a14',
    tag: '#f4e4b8',
    tagEdge: '#b99a5a',
    steel: '#2f3337',
    wire: '#b9c1c8',
    pencil: th.inkSoft,
    hl: th.highlight,
  };
}

/* ------------------------------------------------------------------------ */
/* Objects                                                                   */
/* ------------------------------------------------------------------------ */

/** Metal eyelet (grommet). Local origin = centre. */
function eyeletNode(ctx, R) {
  const th = ctx.theme;
  return g(null,
    h('circle', {r: r(R + 1.5), fill: '#9aa3ab', stroke: th.ink, 'stroke-width': 1.8}),
    h('circle', {r: r(R * 0.55), fill: '#4b4f55', stroke: th.ink, 'stroke-width': 1.2}),
    h('path', {d: `M${r(-R * 0.75)} ${r(-R * 0.35)}A${r(R * 0.85)} ${r(R * 0.85)} 0 0 1 ${r(R * 0.2)} ${r(-R * 0.82)}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, opacity: 0.6}),
  );
}

/**
 * Instrument sheet (the "artículo" of the brief). Local origin = top-left.
 * The basis clause's reference phrase gets an eyelet at the sheet edge
 * (`eyelet.side`: 'left' | 'right'), level with the phrase, where the link
 * cord is threaded.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, color:string, src:{id:string,title:string,provision:string}, passage:{text:string,phrase:string}, size?:number, passageAt?:number, eyelet?:{side:'left'|'right'}, quiet?:boolean, seedKey?:string, maxPre?:number, maxPost?:number, idMin?:number}} o
 */
export function instrumentSheet(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const col = o.color;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const quiet = Boolean(o.quiet);
  const pad = Math.max(30, w * 0.1);
  const inner = w - pad * 2;
  const size = o.size ?? 22;
  const bar = Math.max(4, size * 0.3);
  const gap = size * 0.62;
  const seed = o.seedKey || 'dn-inst';
  const fold = w * 0.1;
  const titleFit = fitWords(ctx, o.src.title, {maxWidth: inner, size: size * 1.04, minSize: size * 0.92, maxLines: 4, weight: 700});
  const band = titleFit.height + size * 1.1;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(8, 11, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: `M0 5Q0 0 5 0H${r(w - 5)}Q${w} 0 ${w} 5V${r(hh - fold)}L${r(w - fold)} ${hh}H5Q0 ${hh} 0 ${r(hh - 5)}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${w} ${r(hh - fold)}L${r(w - fold * 0.86)} ${r(hh - fold * 0.86)}Q${r(w - fold)} ${r(hh - fold)} ${r(w - fold)} ${r(hh - fold * 0.8)}V${hh}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}));
  // title band with a thin double rule under it (an "official sheet" look without any real emblem)
  parts.push(h('path', {d: `M0 5Q0 0 5 0H${r(w - 5)}Q${w} 0 ${w} 5V${r(band)}H0Z`, fill: col, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('line', {x1: pad * 0.5, x2: w - pad * 0.5, y1: r(band + 6), y2: r(band + 6), stroke: col, 'stroke-width': 2}));
  parts.push(h('line', {x1: pad * 0.5, x2: w - pad * 0.5, y1: r(band + 11), y2: r(band + 11), stroke: col, 'stroke-width': 1}));
  parts.push(textOrBars(ctx, titleFit, showKey && !o.titleBars, {x: pad, y: (band - titleFit.height) / 2, fill: '#fff', name: `${P}-title`}));
  let y = band + size * 1.1;
  // basis-clause heading and wording (reference phrase marked)
  const provFit = fitWords(ctx, o.src.provision, {maxWidth: inner, size: size * 1.02, minSize: size * 0.92, maxLines: 2, weight: 700, family: 'serif'});
  const pass = passageBlock(ctx, {prefix: `${P}-pa`, text: o.passage.text, phrase: o.passage.phrase, w: inner, size, family: 'serif', maxPre: o.maxPre ?? 3, maxPost: o.maxPost ?? 2, showText: quiet ? false : undefined, inlineBefore: true, inlineAfter: true, slotLines: o.slotLines ?? 5});
  const headH = provFit.height + size * 0.45;
  const areaTop = y;
  const sigH = size * 2.4;
  const areaBot = hh - sigH - pad * 0.6;
  const blockH = headH + pass.h;
  const provY = areaTop + Math.max(0, (areaBot - areaTop - blockH) * clamp(o.passageAt ?? 0.15));
  const passY = provY + headH;
  if (provY - areaTop > bar * 2) parts.push(fillerBars(ctx, {x: pad, y: areaTop, w: inner, h: provY - areaTop - gap, bar, gap, key: `${seed}-a`, color: th.paperLine}));
  parts.push(textOrBars(ctx, provFit, showAll && !quiet, {x: pad, y: provY, fill: th.ink, name: `${P}-prov`}));
  parts.push(g({transform: T(pad, passY)}, pass.node));
  const bodyY = passY + pass.h + gap * 1.1;
  if (areaBot - bodyY > bar) parts.push(fillerBars(ctx, {x: pad, y: bodyY, w: inner, h: areaBot - bodyY, bar, gap, key: `${seed}-b`, color: th.paperLine}));
  // signature block (simulated): a short rule and a pen stroke
  const sy = hh - pad * 0.9;
  parts.push(h('line', {x1: pad, x2: pad + inner * 0.55, y1: r(sy), y2: r(sy), stroke: th.inkSoft, 'stroke-width': 2}));
  parts.push(h('path', {d: `M${r(pad + 6)} ${r(sy - 6)}c${r(inner * 0.06)} ${r(-size * 0.9)} ${r(inner * 0.1)} ${r(-size * 0.2)} ${r(inner * 0.14)} ${r(-size * 0.3)}s${r(inner * 0.08)} ${r(-size * 0.6)} ${r(inner * 0.12)} ${r(-size * 0.1)}s${r(inner * 0.1)} ${r(-size * 0.4)} ${r(inner * 0.16)} ${r(-size * 0.2)}`, fill: 'none', stroke: '#1c3f8c', 'stroke-width': 2.4, 'stroke-linecap': 'round'}));
  // index tab with the id (top edge, right side)
  const idSz = Math.min(34, Math.max(size * 0.95, o.idMin ?? 0));
  const tabW = Math.max(58, ctx.measure(o.src.id, idSz, 800, 'sans') + 28);
  const tab = {x: w - pad - tabW, y: -40, w: tabW, h: 46};
  const idFit = ctx.fit(o.src.id, {maxWidth: tabW - 14, size: idSz, minSize: 12, maxLines: 1, weight: 800});
  const tabNode = g(null,
    h('path', {d: `M${r(tab.x)} 4V${r(tab.y + 8)}Q${r(tab.x)} ${r(tab.y)} ${r(tab.x + 8)} ${r(tab.y)}H${r(tab.x + tab.w - 8)}Q${r(tab.x + tab.w)} ${r(tab.y)} ${r(tab.x + tab.w)} ${r(tab.y + 8)}V4Z`, fill: shade(col, -0.1), stroke: th.ink, 'stroke-width': 2}),
    showKey ? textBlock(idFit, {x: tab.x + tab.w / 2, y: tab.y + Math.max(2, (36 - idFit.size) / 2), anchor: 'middle', fill: '#fff'}) : h('rect', {x: tab.x + tab.w * 0.3, y: tab.y + 12, width: tab.w * 0.4, height: 7, rx: 3.5, fill: '#fff', opacity: 0.8}),
  );
  // eyelet beside the reference phrase, on the sheet margin
  const pb = pass.phraseBox;
  const side = (o.eyelet && o.eyelet.side) || 'left';
  const eyR = Math.max(7, Math.min(10, pad * 0.26));
  const eyelet = {x: side === 'left' ? pad * 0.45 : w - pad * 0.45, y: passY + pb.y + pb.h / 2};
  const node = g({name: P}, tabNode, parts, g({transform: T(eyelet.x, eyelet.y)}, eyeletNode(ctx, eyR)));
  return {
    node, w, h: hh, pass, pad,
    phraseBox: {x: pad + pb.x, y: passY + pb.y, w: pb.w, h: pb.h},
    textBox: {x: pad, y: passY, w: inner, h: pass.h},
    provBox: {x: pad, y: provY, w: provFit.width, h: provFit.height},
    titleFit, provFit,
    eyelet, eyeR: eyR, outward: {x: side === 'left' ? -1 : 1, y: 0},
    tab,
    bounds: {x: 0, y: -40, w: w + 8, h: hh + 51},
    /** sheet height that holds the band, the clause and a little body text without cutting */
    need: band + size * 1.1 + headH + pass.h + gap * 1.1 + (bar + gap) * 2 + sigH + pad * 0.6,
    minTextSize: Math.min(titleFit.size, provFit.size, pass.phFit.size),
    truncated: titleFit.truncated || provFit.truncated,
    frame: s => pass.frame(s),
  };
}

/** Page outline (top-down, slight curl at the gutter). s = -1 left, 1 right. */
function pageD(s, pw, top, bot) {
  return `M0 ${r(top + 7)}Q${r(s * pw * 0.45)} ${r(top - 5)} ${r(s * pw)} ${r(top)}V${r(bot)}Q${r(s * pw * 0.45)} ${r(bot + 5)} 0 ${r(bot - 3)}Z`;
}

/**
 * Bound volume open at the enabling page, top-down (adapted from the
 * conflicto kit's open book: longer titles and passages wrap instead of
 * being cut). Local origin = centre of the gutter; the right page
 * spans x ∈ [0, pw], y ∈ [-ph/2, ph/2]. The provision passage sits on the
 * right page at `passageAt` (0 = top of the text area, 1 = bottom).
 * @param {any} ctx
 * @param {{prefix:string, pw:number, ph:number, color:string, src:{id:string,title:string,provision:string}, passage:{text:string,tension:string}, alt?:string|null, passageAt?:number, size?:number, seedKey?:string}} o
 */
export function boundVolume(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {pw, ph} = o;
  const top = -ph / 2, bot = ph / 2;
  const col = o.color;
  const showText = ctx.show('all');
  const showKey = ctx.show('key');
  const m = pw * 0.1;
  const inner = pw - m * 2;
  const seed = o.seedKey || 'dn-book';
  const size = o.size ?? Math.max(16, pw * 0.08);
  const bar = Math.max(4, size * 0.3);
  const gap = size * 0.62;
  const parts = [];
  // shadow, cover boards, head bands
  parts.push(h('path', {d: roundRectPath(-pw - 14 + 9, top - 12 + 13, pw * 2 + 28, ph + 24, 12), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(-pw - 14, top - 12, pw * 2 + 28, ph + 24, 12), fill: col, stroke: th.ink, 'stroke-width': 2.5}));
  parts.push(h('path', {d: roundRectPath(-pw - 8, top - 7, pw * 2 + 16, ph + 14, 8), fill: 'none', stroke: shade(col, 0.3), 'stroke-width': 1.5, opacity: 0.7}));
  parts.push(h('rect', {x: -9, y: top - 12, width: 18, height: ph + 24, fill: shade(col, -0.22)}));
  // page block thickness at the outer edges
  for (let k = 3; k >= 1; k--) {
    for (const s of [-1, 1]) parts.push(h('path', {d: pageD(s, pw + k * 2.4, top + k * 1.3, bot + k * 1.8), fill: k % 2 ? th.paperShade : th.paper, stroke: th.ink, 'stroke-width': 1}));
  }
  for (const s of [-1, 1]) parts.push(h('path', {d: pageD(s, pw, top, bot), fill: th.paper, stroke: th.ink, 'stroke-width': 2}));
  // gutter shading (stacked translucent strips read as a soft gradient)
  for (const [fw, op] of [[0.16, 0.035], [0.08, 0.05], [0.03, 0.07]]) {
    parts.push(h('rect', {x: r(-pw * fw), y: r(top + 9), width: r(pw * fw * 2), height: r(ph - 13), fill: '#3a2a1a', opacity: op}));
  }
  parts.push(h('line', {x1: 0, x2: 0, y1: top + 8, y2: bot - 4, stroke: th.ink, 'stroke-width': 1.6, opacity: 0.55}));

  // --- left page: title of the text, "simulated wording" line, body bars
  const lx = -pw + m;
  const titleFit = fitWords(ctx, o.src.title, {maxWidth: inner, size: size * 1.28, minSize: size * 0.9, maxLines: o.titleLines ?? 6, weight: 700, family: 'serif'});
  let ly = top + m * 1.05;
  // `titleBars`: the title is drawn as bars (a scene that prints the shared wording once elsewhere)
  parts.push(textOrBars(ctx, titleFit, showKey && !o.titleBars, {x: lx, y: ly, fill: th.ink, name: `${P}-title`}));
  ly += titleFit.height + size * 0.5;
  parts.push(h('rect', {x: lx, y: r(ly), width: r(inner * 0.32), height: 3, rx: 1.5, fill: col}));
  ly += size * 0.7;
  parts.push(fillerBars(ctx, {x: lx, y: ly, w: inner, h: bot - m - ly, bar, gap, key: `${seed}-L`, color: th.paperLine}));

  // --- right page: running head, provision heading, passage, filler
  const rx0 = m;
  // `passSize`: the passage may be set smaller than the page's other text (e.g. a quiet page whose slot is drawn as bars)
  const pass = passageBlock(ctx, {prefix: `${P}-pa`, text: o.passage.text, phrase: o.passage.tension, alt: o.alt ?? null, w: inner, size: o.passSize ?? size, family: 'serif', maxPre: o.maxPre ?? 4, maxPost: o.maxPost ?? 5, slotText: o.slotText, slotAlso: o.slotAlso, ring: o.ring, showText: o.quiet ? false : undefined, showSlot: o.showSlot, inlineAfter: false, slotLines: o.slotLines ?? 5});
  // `provText` (opt-in): on a quiet page the provision reference (the anchor the markers attach to)
  // is still printed, at `provText` size, wrapping instead of shrinking
  // (printed only when it fits on one line — never with its number orphaned)
  const anchorFit = o.provText ? fitWords(ctx, `§ ${o.src.provision}`, {maxWidth: inner, size: o.provText, minSize: o.provText * 0.85, maxLines: 1, weight: 700, family: 'serif'}) : null;
  const anchorShown = Boolean(anchorFit && !anchorFit.truncated);
  const provFit = anchorShown ? anchorFit
    : fitWords(ctx, `§ ${o.src.provision}`, {maxWidth: inner, size: size * 1.12, minSize: size * 0.85, maxLines: 2, weight: 700, family: 'serif'});
  const headH = provFit.height + size * 0.45;
  const areaTop = top + m * 1.7, areaBot = bot - m * 0.9;
  const blockH = headH + pass.h;
  const pAt = clamp(o.passageAt ?? 0.45);
  const provY = areaTop + Math.max(0, (areaBot - areaTop - blockH) * pAt);
  const passY = provY + headH;
  // running head
  parts.push(h('rect', {x: rx0, y: r(top + m * 0.75), width: r(inner * 0.28), height: r(bar), rx: bar / 2, fill: th.paperLine}));
  parts.push(h('rect', {x: r(pw - m - inner * 0.1), y: r(top + m * 0.75), width: r(inner * 0.1), height: r(bar), rx: bar / 2, fill: th.inkSoft, opacity: 0.6}));
  // filler above and below
  if (provY - areaTop > bar * 2) parts.push(fillerBars(ctx, {x: rx0, y: areaTop, w: inner, h: provY - areaTop - gap, bar, gap, key: `${seed}-R0`, color: th.paperLine}));
  const belowY = passY + pass.h + gap;
  if (areaBot - belowY > bar) parts.push(fillerBars(ctx, {x: rx0, y: belowY, w: inner, h: areaBot - belowY, bar, gap, key: `${seed}-R1`, color: th.paperLine}));
  // `provName` (opt-in) names the provision heading so a scene can drive it (e.g. its lens copy)
  // (a reference too long for the quiet page keeps its bars there: it is printed in full elsewhere)
  parts.push(textOrBars(ctx, provFit, showText && (!o.quiet || anchorShown), {x: rx0, y: provY, fill: th.ink, name: o.provName ? `${P}-prov` : undefined}));
  parts.push(g({transform: T(rx0, passY)}, pass.node));

  // index tab with the source id (protrudes above the cover)
  // `idMin`: floor for the id size on the tab (legible on a phone at small scene scales)
  const idSz = Math.min(34, Math.max(size * 0.95, o.idMin ?? 0));
  const tabW = Math.max(58, Math.min(Math.max(inner * 0.5, ctx.measure(o.src.id, idSz, 800, 'sans') + 28), ctx.measure(o.src.id, idSz, 800, 'sans') + 28));
  const tab = {x: pw - m - tabW, y: top - 40, w: tabW, h: 46};
  const idFit = ctx.fit(o.src.id, {maxWidth: tabW - 14, size: idSz, minSize: 12, maxLines: 1, weight: 800});
  const tabNode = g(null,
    h('path', {d: `M${r(tab.x)} ${r(top + 4)}V${r(tab.y + 8)}Q${r(tab.x)} ${r(tab.y)} ${r(tab.x + 8)} ${r(tab.y)}H${r(tab.x + tab.w - 8)}Q${r(tab.x + tab.w)} ${r(tab.y)} ${r(tab.x + tab.w)} ${r(tab.y + 8)}V${r(top + 4)}Z`, fill: col, stroke: th.ink, 'stroke-width': 2}),
    showKey ? textBlock(idFit, {x: tab.x + tab.w / 2, y: tab.y + Math.max(2, (36 - idFit.size) / 2), anchor: 'middle', fill: '#fff'}) : h('rect', {x: tab.x + tab.w * 0.3, y: tab.y + 12, width: tab.w * 0.4, height: 7, rx: 3.5, fill: '#fff', opacity: 0.8}),
  );
  // ribbon bookmark lying along the gutter on the right page
  const rib = shade(col, 0.35);
  const ribbon = h('path', {d: `M-24 ${r(bot - ph * 0.3)}H-8V${r(bot + 44)}L-16 ${r(bot + 34)}L-24 ${r(bot + 44)}Z`, fill: rib, stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'});

  const node = g({name: P}, parts, tabNode, o.ribbon === false ? null : ribbon);
  const toLocal = q => ({x: rx0 + q.x, y: passY + q.y});
  const pb = pass.phraseBox;
  return {
    node, pw, ph, top, bot,
    pass,
    passOrigin: {x: rx0, y: passY},
    phraseBox: {x: rx0 + pb.x, y: passY + pb.y, w: pb.w, h: pb.h},
    altBox: {x: rx0 + pass.altBox.x, y: passY + pass.altBox.y, w: pass.altBox.w, h: pass.altBox.h},
    textBox: {x: rx0, y: passY, w: inner, h: pass.h},
    provBox: {x: rx0, y: provY, w: provFit.width, h: provFit.height},
    titleBox: {x: lx, y: top + m * 1.05, w: titleFit.width, h: titleFit.height},
    colL: {x: lx, w: inner},
    tab,
    bounds: {x: -pw - 14, y: top - 40, w: pw * 2 + 28, h: ph + 12 + 40 + 44},
    /** page height that holds the title (left) and the passage (right) with some body text */
    need: Math.max(m * 1.05 + titleFit.height + size * 1.2 + gap * 3, m * 1.7 + headH + pass.h + m * 0.9 + gap * 2),
    outer: {x: -pw - 14, y: top - 12, w: pw * 2 + 28, h: ph + 24},
    toLocal,
    frame: s => pass.frame(s),
  };
}

/**
 * Editable hierarchy board (adapted from the conflicto kit: level labels, header and caption
 * wrap onto more lines instead of shrinking, so they never get smaller than the rest).
 * Editable hierarchy board (top-down). Rows are grooves with slide-in level
 * cards carrying the user-supplied labels; each text has a coloured token
 * seated in the row supplied for it. Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, hier:{levels:string[], placement:number[], caption?:string}, ids:string[], colors:string[], header:string, rowH?:number, size?:number}} o
 */
export function levelBoard(ctx, o) {
  const th = ctx.theme;
  const C = cetColors(ctx);
  const P = o.prefix;
  const w = o.w;
  const size = o.size ?? 22;
  const showText = ctx.show('all');
  const showKey = ctx.show('key');
  const levels = o.hier.levels;
  const n = levels.length;
  const pad = 16;
  // `tokScale` < 1 gives slimmer tokens and rows (a wide, short board)
  const ts = o.tokScale ?? 1;
  const tokW = Math.max(62, Math.min(110 * ts + 30, Math.max(...o.ids.map(id => ctx.measure(id, size * 0.95, 800, 'sans'))) + 30));
  const perRow = Math.max(1, ...levels.map((_, lv) => o.ids.filter((_, k) => levelOf(o.hier, k) === lv).length));
  // `stackTokens` (opt-in): tokens sharing a level stand one above the other, so the level card keeps
  // its width (whole words at full size) instead of giving it to a second token
  const stackT = Boolean(o.stackTokens) && perRow > 1;
  const tokH = size * 1.9 * ts * (stackT ? 0.8 : 1);
  const cols = stackT ? 1 : perRow;
  const slipW = w - pad * 2 - 16 - tokW * cols - 8 * (cols - 1) - 22;
  const labFits = levels.map(l => fitWords(ctx, l, {maxWidth: slipW - 26, size: size * 0.92, minSize: size * 0.9, maxLines: 4, weight: 600}));
  // `fitRows` (opt-in): every row is tall enough for its wrapped level card (card = row - 24, 4 px air)
  const tokNeed = stackT ? perRow * (tokH + 6) + 22 : tokH + 16;
  const rowH = o.rowH ?? (o.fitRows ? Math.max(tokNeed, ...labFits.map(f => f.height + 32)) : Math.max(tokNeed, ...labFits.map(f => f.height + 26 * ts)));
  const headFit = fitWords(ctx, o.header, {maxWidth: w - pad * 2 - 44, size: size * 0.89, minSize: size * 0.89, maxLines: 3, weight: 700});
  const headH = headFit.height + 26;
  const capFit = o.hier.caption ? fitWords(ctx, o.hier.caption, {maxWidth: w - pad * 2, size: size * 0.9, minSize: size * 0.88, maxLines: 3, weight: 500}) : null;
  const footH = capFit ? capFit.height + 22 : 16;
  const hh = headH + n * rowH + footH + 6;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(8, 11, w, hh, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 16), fill: C.wood, stroke: th.ink, 'stroke-width': 2.5}));
  parts.push(h('path', {d: roundRectPath(7, 7, w - 14, hh - 14, 11), fill: shade(C.wood, 0.1), stroke: shade(C.wood, -0.3), 'stroke-width': 1.5}));
  // grain
  for (let i = 0; i < 5; i++) {
    const gy = 14 + ((i + 0.5) / 5) * (hh - 28);
    const wob = 4 + ctx.rng(`${P}-grain`, i) * 6;
    parts.push(h('path', {d: `M12 ${r(gy)}C${r(w * 0.3)} ${r(gy - wob)} ${r(w * 0.6)} ${r(gy + wob)} ${r(w - 12)} ${r(gy - wob * 0.4)}`, fill: 'none', stroke: shade(C.wood, -0.15), 'stroke-width': 1.5, opacity: 0.5}));
  }
  // header plate with an editing pencil glyph
  parts.push(h('path', {d: roundRectPath(pad, 12, w - pad * 2, headH - 12, 8), fill: shade(C.wood, -0.28), stroke: th.ink, 'stroke-width': 1.6}));
  parts.push(showKey ? textBlock(headFit, {x: pad + 12, y: 12 + (headH - 12 - headFit.height) / 2, fill: '#fff8ea'}) : h('rect', {x: pad + 12, y: 12 + (headH - 12) / 2 - 4, width: (w - pad * 2) * 0.5, height: 8, rx: 4, fill: '#fff8ea', opacity: 0.7}));
  const pcx = w - pad - 22, pcy = 12 + (headH - 12) / 2;
  parts.push(g({transform: T(pcx, pcy, -40)},
    h('rect', {x: -16, y: -5, width: 26, height: 10, rx: 2, fill: '#e3b341', stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: 'M10 -5L18 0L10 5Z', fill: '#f2d9b0', stroke: th.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round'}),
    h('rect', {x: -21, y: -5, width: 6, height: 10, rx: 2, fill: '#e38b8b', stroke: th.ink, 'stroke-width': 1.5})));
  // rows
  const rows = [];
  for (let i = 0; i < n; i++) {
    const ry = headH + 6 + i * rowH;
    const gx = pad, gw = w - pad * 2, gh = rowH - 12;
    rows.push({x: gx, y: ry, w: gw, h: gh});
    parts.push(h('path', {d: roundRectPath(gx, ry, gw, gh, 9), fill: C.groove, stroke: th.ink, 'stroke-width': 1.8}));
    parts.push(h('rect', {x: gx + 4, y: ry + 3, width: gw - 8, height: 4, rx: 2, fill: '#000', opacity: 0.25}));
    // slide-in level card with a finger notch
    const sx = gx + 8, sy = ry + 6, sh = gh - 12;
    parts.push(h('path', {d: `M${r(sx + 4)} ${r(sy)}H${r(sx + slipW)}V${r(sy + sh * 0.3)}A${r(sh * 0.2)} ${r(sh * 0.2)} 0 0 0 ${r(sx + slipW)} ${r(sy + sh * 0.7)}V${r(sy + sh)}H${r(sx + 4)}Q${r(sx)} ${r(sy + sh)} ${r(sx)} ${r(sy + sh - 4)}V${r(sy + 4)}Q${r(sx)} ${r(sy)} ${r(sx + 4)} ${r(sy)}Z`, fill: C.slip, stroke: th.ink, 'stroke-width': 1.5}));
    const lf = labFits[i];
    parts.push(textOrBars(ctx, lf, showText, {x: sx + 12, y: sy + (sh - lf.height) / 2, fill: th.ink, name: `${P}-lvl${i}`}));
  }
  // tokens (seated in their supplied rows)
  const tokens = o.ids.map((id, k) => {
    const lv = levelOf(o.hier, k);
    const row = rows[lv];
    const same = o.ids.map((_, j) => levelOf(o.hier, j)).filter(v => v === lv).length > 1;
    if (stackT) {
      const mates = o.ids.map((_, j) => j).filter(j => levelOf(o.hier, j) === lv);
      const m = mates.indexOf(k);
      return {id, cx: row.x + row.w - 10 - tokW / 2, cy: row.y + row.h / 2 + (m - (mates.length - 1) / 2) * (tokH + 6), lv};
    }
    const slot = same ? k : perRow - 1;
    const cx = row.x + row.w - 10 - tokW / 2 - (perRow - 1 - slot) * (tokW + 8);
    const cy = row.y + row.h / 2;
    return {id, cx, cy, lv};
  });
  const tokenNodes = tokens.map((tk, k) => {
    const f = ctx.fit(tk.id, {maxWidth: tokW - 16, size: size * 0.95, minSize: 11, maxLines: 1, weight: 800});
    return g({name: `${P}-tok${k}`, transform: T(tk.cx, tk.cy)},
      h('rect', {name: `${P}-tokring${k}`, x: -tokW / 2 - 7, y: -tokH / 2 - 7, width: tokW + 14, height: tokH + 14, rx: tokH / 2 + 5, fill: 'none', stroke: '#fff4c2', 'stroke-width': 5, opacity: 0}),
      h('rect', {x: -tokW / 2 + 3, y: -tokH / 2 + 5, width: tokW, height: tokH, rx: tokH / 2, fill: '#000', opacity: 0.3}),
      h('rect', {x: -tokW / 2, y: -tokH / 2, width: tokW, height: tokH, rx: tokH / 2, fill: o.colors[k], stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: -tokW / 2 + 8, y: -tokH / 2 + 4, width: tokW - 16, height: tokH * 0.22, rx: tokH * 0.11, fill: '#fff', opacity: 0.25}),
      showKey ? textBlock(f, {x: 0, y: -f.size / 2 - 1, anchor: 'middle', fill: '#fff'}) : h('circle', {r: tokH * 0.16, fill: '#fff', opacity: 0.85}));
  });
  if (capFit) parts.push(textOrBars(ctx, capFit, showText, {x: w / 2, y: hh - footH + 6, anchor: 'middle', fill: '#fff8ea', italic: true}));
  const node = g({name: P}, parts, tokenNodes);
  return {
    node, w, h: hh, rows, tokens, tokW, tokH,
    /** smallest rendered text size on the board (stage units; header, level cards, caption) */
    minTextSize: Math.min(headFit.size, ...labFits.map(f => f.size), capFit ? capFit.size : Infinity),
    labelTextSize: Math.min(headFit.size, ...labFits.map(f => f.size)),
    /** whether every level label lies inside its slide-in card (card height = row - 24) */
    rowsFit: labFits.every(f => f.height <= rowH - 24),
    truncated: [headFit, ...labFits, capFit].some(f => f && f.truncated),
    tokenBox: k => ({x: tokens[k].cx - tokW / 2, y: tokens[k].cy - tokH / 2, w: tokW, h: tokH}),
    /** @param {{glow?:number[]}} s */
    frame: s => Object.fromEntries(tokens.map((_, k) => [`${P}-tokring${k}`, {opacity: r(clamp((s.glow || [])[k] ?? 0), 3)}])),
  };
}

/** Filler text bars (simulated body text) in a box. */
function fillerBars(ctx, {x, y, w, h: hh, bar, gap, key, color}) {
  const out = [];
  const n = Math.max(0, Math.floor((hh - bar) / (bar + gap)) + 1);
  for (let i = 0; i < n; i++) {
    const yy = y + i * (bar + gap);
    if (yy + bar > y + hh + 0.5) break;
    const k = ctx.rng(key, i);
    const last = i === n - 1 || k > 0.86;
    const ind = i === 0 ? w * 0.08 : 0;
    const bw = (w - ind) * (last ? 0.35 + k * 0.3 : 0.9 + k * 0.1);
    out.push(h('rect', {x: r(x + ind), y: r(yy), width: r(bw), height: r(bar), rx: bar / 2, fill: color}));
  }
  return out;
}

/**
 * Binder clip, top-down. Local origin = the jaw edge centre (the point that
 * grips a page edge); +x points away from the page (towards the cord). The
 * cord ties to the wire loop at `cordAt`. `frame(open)`: 0 = clamped (the
 * wire handles folded out flat), 1 = open (handles squeezed together, the
 * jaw gap visible).
 */
export function bindingClip(ctx, {name, s = 1}) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const bw = 34 * s, bh = 40 * s;
  const body = `M${r(-bw)} ${r(-bh / 2)}H${r(2 * s)}Q${r(6 * s)} ${r(-bh / 2)} ${r(6 * s)} ${r(-bh / 2 + 4 * s)}V${r(bh / 2 - 4 * s)}Q${r(6 * s)} ${r(bh / 2)} ${r(2 * s)} ${r(bh / 2)}H${r(-bw)}Z`;
  const node = g({name},
    h('ellipse', {name: `${name}-shadow`, cx: r(-bw * 0.35 + 6 * s), cy: r(9 * s), rx: r(bw * 0.8), ry: r(bh * 0.55), fill: th.shadow}),
    // clamped handles: one flat U loop out to the cord
    g({name: `${name}-wireC`},
      h('path', {d: `M${r(2 * s)} ${r(-bh * 0.34)}L${r(30 * s)} ${r(-5 * s)}Q${r(35 * s)} 0 ${r(30 * s)} ${r(5 * s)}L${r(2 * s)} ${r(bh * 0.34)}`, fill: 'none', stroke: th.ink, 'stroke-width': r(5.4 * s), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(2 * s)} ${r(-bh * 0.34)}L${r(30 * s)} ${r(-5 * s)}Q${r(35 * s)} 0 ${r(30 * s)} ${r(5 * s)}L${r(2 * s)} ${r(bh * 0.34)}`, fill: 'none', stroke: C.wire, 'stroke-width': r(3 * s), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})),
    // open handles: squeezed, raised (shorter, closer together)
    g({name: `${name}-wireO`, opacity: 0},
      h('path', {d: `M${r(-6 * s)} ${r(-bh * 0.3)}L${r(26 * s)} ${r(-3 * s)}M${r(-6 * s)} ${r(bh * 0.3)}L${r(26 * s)} ${r(3 * s)}`, fill: 'none', stroke: th.ink, 'stroke-width': r(5.4 * s), 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(-6 * s)} ${r(-bh * 0.3)}L${r(26 * s)} ${r(-3 * s)}M${r(-6 * s)} ${r(bh * 0.3)}L${r(26 * s)} ${r(3 * s)}`, fill: 'none', stroke: C.wire, 'stroke-width': r(3 * s), 'stroke-linecap': 'round'}),
      h('circle', {cx: r(29 * s), cy: 0, r: r(4.5 * s), fill: 'none', stroke: C.wire, 'stroke-width': r(2.4 * s)})),
    h('path', {d: body, fill: C.steel, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-bw + 5 * s)} ${r(-bh / 2 + 5 * s)}H${r(-2 * s)}`, stroke: '#fff', 'stroke-width': r(2.2 * s), opacity: 0.35, 'stroke-linecap': 'round'}),
    h('line', {x1: r(-bw * 0.45), x2: r(-bw * 0.45), y1: r(-bh / 2 + 3 * s), y2: r(bh / 2 - 3 * s), stroke: '#000', 'stroke-width': r(1.6 * s), opacity: 0.5}),
    // jaw gap (visible when open)
    h('path', {name: `${name}-gap`, d: `M${r(-bw)} ${r(-bh / 2 + 3 * s)}V${r(bh / 2 - 3 * s)}`, stroke: '#e8ecef', 'stroke-width': r(3.5 * s), 'stroke-linecap': 'round', opacity: 0}),
  );
  const frame = open => {
    const o2 = clamp(open);
    return {
      [`${name}-wireC`]: {opacity: r(1 - o2, 3)},
      [`${name}-wireO`]: {opacity: r(o2, 3)},
      [`${name}-gap`]: {opacity: r(o2, 3)},
    };
  };
  return {node, frame, cordAt: {x: 32 * s, y: 0}, grip: {x: -bw * 0.45, y: 0}, body: {x: -bw, y: -bh / 2, w: bw + 6 * s, h: bh}, s};
}

/**
 * Link cord: a twisted gold cord whose two ends are A (threaded through the
 * instrument's eyelet) and E (tied to the clip). It keeps its length L: the
 * lateral slack `bulge` is solved from the distance between its ends (on
 * the `side` given, +1/-1). Named `${name}` (+ -sh, -o, -c, -t, -knot).
 */
export function linkCord(ctx, o) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const wdt = o.width ?? 9;
  const N = o.name;
  const node = g({name: N},
    h('path', {name: `${N}-sh`, fill: 'none', stroke: th.shadow, 'stroke-width': r(wdt + 3), 'stroke-linecap': 'round', transform: 'translate(4 7)'}),
    h('path', {name: `${N}-o`, fill: 'none', stroke: C.cordDark, 'stroke-width': r(wdt + 4), 'stroke-linecap': 'round'}),
    h('path', {name: `${N}-c`, fill: 'none', stroke: C.cord, 'stroke-width': r(wdt), 'stroke-linecap': 'round'}),
    h('path', {name: `${N}-t`, fill: 'none', stroke: shade(C.cord, 0.5), 'stroke-width': r(wdt * 0.32), 'stroke-dasharray': `${r(wdt * 0.8)} ${r(wdt * 1.1)}`, 'stroke-linecap': 'round'}),
  );
  const knot = g({name: `${N}-knot`},
    h('circle', {r: r(wdt * 0.95), fill: C.cord, stroke: C.cordDark, 'stroke-width': 2.4}),
    h('path', {d: `M${r(-wdt * 0.5)} ${r(-wdt * 0.2)}Q0 ${r(-wdt * 0.8)} ${r(wdt * 0.5)} ${r(-wdt * 0.1)}`, fill: 'none', stroke: C.cordDark, 'stroke-width': 1.6}));
  const ctrl = (A, E, b, side) => {
    const d = dist(A, E);
    const u = d > 1e-6 ? {x: (E.x - A.x) / d, y: (E.y - A.y) / d} : {x: 1, y: 0};
    const n = {x: -u.y * side, y: u.x * side};
    return {
      c1: {x: A.x + u.x * d * 0.22 + n.x * b, y: A.y + u.y * d * 0.22 + n.y * b},
      c2: {x: A.x + u.x * d * 0.78 + n.x * b, y: A.y + u.y * d * 0.78 + n.y * b},
    };
  };
  const lenOf = (A, E, b, side) => {
    const {c1, c2} = ctrl(A, E, b, side);
    return cubicPolyline(A, c1, c2, E, 28).total;
  };
  /**
   * @param {{x:number,y:number}} A @param {{x:number,y:number}} E @param {number} L cord length @param {1|-1} side
   */
  function shape(A, E, L, side = 1) {
    const d = dist(A, E);
    let b = 0;
    if (L > d + 0.5) {
      let lo = 0, hi = Math.max(L * 0.8, 10);
      for (let k = 0; k < 22; k++) {
        const mid = (lo + hi) / 2;
        if (lenOf(A, E, mid, side) < L) lo = mid; else hi = mid;
      }
      b = lo;
    }
    b = Math.min(b, o.maxBulge ?? Infinity);
    const {c1, c2} = ctrl(A, E, b, side);
    const poly = cubicPolyline(A, c1, c2, E, 48);
    const dd = `M${r(A.x)} ${r(A.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(E.x)} ${r(E.y)}`;
    return {d: dd, poly, bulge: b, c1, c2, len: poly.total};
  }
  const frame = (A, E, L, side = 1) => {
    const sh = shape(A, E, L, side);
    return {
      nodes: {
        [`${N}-sh`]: {d: sh.d},
        [`${N}-o`]: {d: sh.d},
        [`${N}-c`]: {d: sh.d},
        [`${N}-t`]: {d: sh.d},
        [`${N}-knot`]: {transform: T(A.x, A.y)},
      },
      shape: sh,
    };
  };
  return {node, knot, frame, shape, width: wdt};
}

/**
 * Paper tag threaded on the cord. Local origin = the reinforced hole; the
 * tag body hangs along +y. Two faces: `-blank` (ruled, nothing written) and
 * `-front` (the supplied state: text + state glyph — a solid cord-coloured
 * band for "authorization supplied", a dashed border with a pencil for
 * "authorization to be checked"). An optional second front (`-front2`,
 * `text2`/`state2`) is used when a datum is substituted (inspect).
 * `frame({flip, swap, P, hang})` positions the tag at the cord point P.
 */
export function linkTag(ctx, o) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const N = o.name;
  const size = o.size ?? 22;
  const w = o.w;
  const pad = size * 0.55;
  const top = size * 1.25; // band / hole zone
  const showKey = ctx.show('key');
  const fits = [o.text, o.text2].filter(t => t != null).map(t => fitWords(ctx, t, {maxWidth: w - pad * 2, size, minSize: size * (o.minK ?? 0.9), maxLines: o.maxLines ?? 7, weight: 700}));
  const textH = Math.max(...fits.map(f => f.height));
  const hh = top + textH + pad * 1.2;
  const shapeD = `M${r(-w / 2 + 12)} ${r(-size * 0.55)}H${r(w / 2 - 12)}L${r(w / 2)} ${r(-size * 0.55 + 12)}V${r(hh)}H${r(-w / 2)}V${r(-size * 0.55 + 12)}Z`;
  const face = (key, state, fit, visible) => {
    const supplied = state !== 'authorization-to-be-checked';
    return g({name: `${N}-${key}`, opacity: visible ? 1 : 0},
      supplied
        ? h('rect', {x: r(-w / 2 + 3), y: r(size * 0.35), width: r(w - 6), height: r(size * 0.32), fill: C.cord, stroke: C.cordDark, 'stroke-width': 1.2})
        : g(null,
          h('rect', {x: r(-w / 2 + 7), y: r(size * 0.3), width: r(w - 14), height: r(hh - size * 0.3 - 7), rx: 4, fill: 'none', stroke: C.pencil, 'stroke-width': 2.2, 'stroke-dasharray': '7 6'}),
          // pencil glyph lying on the tag's top-right corner
          g({transform: T(w / 2 - size * 1.05, size * 0.05, -28)},
            h('rect', {x: -size * 0.75, y: -size * 0.13, width: size * 1.2, height: size * 0.26, rx: 2, fill: '#e3b341', stroke: th.ink, 'stroke-width': 1.3}),
            h('path', {d: `M${r(size * 0.45)} ${r(-size * 0.13)}L${r(size * 0.72)} 0L${r(size * 0.45)} ${r(size * 0.13)}Z`, fill: '#f2d9b0', stroke: th.ink, 'stroke-width': 1.2, 'stroke-linejoin': 'round'}))),
      fit ? textOrBars(ctx, fit, showKey, {x: 0, y: top + (textH - fit.height) / 2, anchor: 'middle', fill: th.ink, name: `${N}-${key}-t`}) : null,
    );
  };
  const blankLines = [];
  for (let yy = top + size * 0.4; yy < hh - pad * 0.6; yy += size * 0.9) blankLines.push(h('line', {x1: r(-w / 2 + pad), x2: r(w / 2 - pad), y1: r(yy), y2: r(yy), stroke: '#d6c79e', 'stroke-width': 1.4}));
  const card = g({name: `${N}-card`},
    h('path', {d: shapeD, transform: 'translate(5 7)', fill: th.shadow}),
    h('path', {d: shapeD, fill: C.tag, stroke: C.tagEdge, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    g({name: `${N}-blank`}, blankLines),
    face('front', o.state, fits[0], false),
    o.text2 != null ? face('front2', o.state2 ?? o.state, fits[1], false) : null,
    // reinforced hole
    h('circle', {r: r(size * 0.36), fill: '#e2c98f', stroke: C.tagEdge, 'stroke-width': 1.6}),
    h('circle', {r: r(size * 0.17), fill: '#6b5a3a'}),
  );
  const node = g(null,
    h('path', {name: `${N}-string`, fill: 'none', stroke: C.cordDark, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
    g({name: N}, card));
  const strLen = o.stringLen ?? size * 1.1;
  /**
   * @param {{P:{x:number,y:number}, flip?:number, swap?:number, hang?:{x:number,y:number}, lift?:number}} s
   */
  const frame = s => {
    const hang = s.hang || {x: 0, y: 1};
    const L = Math.hypot(hang.x, hang.y) || 1;
    const hx = hang.x / L, hy = hang.y / L;
    const sft = typeof s.shift === 'object' && s.shift ? s.shift : {x: s.shift ?? 0, y: 0};
    const Hp = {x: s.P.x + hx * strLen + sft.x, y: s.P.y + hy * strLen + sft.y};
    const ang = (Math.atan2(hy, hx) * 180) / Math.PI - 90;
    const fl = clamp(s.flip ?? 0);
    const sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * fl)));
    const shown = fl >= 0.5;
    const sw = clamp(s.swap ?? 0);
    const out = {
      [`${N}-string`]: {d: `M${r(s.P.x)} ${r(s.P.y)}Q${r((s.P.x + Hp.x) / 2 + hy * 4)} ${r((s.P.y + Hp.y) / 2 - hx * 4)} ${r(Hp.x)} ${r(Hp.y)}`},
      [N]: {transform: T(Hp.x, Hp.y, ang)},
      [`${N}-card`]: {transform: `scale(${r(sx, 4)} 1)`},
      [`${N}-blank`]: {opacity: shown ? 0 : 1},
      [`${N}-front`]: {opacity: shown ? r(1 - clamp(sw * 2), 3) : 0, transform: sw > 0 ? `translate(0 ${r(-size * 0.5 * clamp(sw * 2))})` : ''},
    };
    if (o.text2 != null) out[`${N}-front2`] = {opacity: shown ? r(clamp(sw * 2 - 1), 3) : 0, transform: sw < 1 ? `translate(0 ${r(size * 0.5 * (1 - clamp(sw * 2 - 1)))})` : ''};
    return out;
  };
  /** world box of the tag body for a hang at cord point P */
  const boxAt = (P, hang = {x: 0, y: 1}, shift = 0) => {
    const L = Math.hypot(hang.x, hang.y) || 1;
    const sft = typeof shift === 'object' && shift ? shift : {x: shift, y: 0};
    const Hp = {x: P.x + (hang.x / L) * strLen + sft.x, y: P.y + (hang.y / L) * strLen + sft.y};
    return {x: Hp.x - w / 2, y: Hp.y - size * 0.55, w, h: hh + size * 0.55};
  };
  return {node, frame, w, h: hh, boxAt, fits, strLen, textSize: Math.min(...fits.map(f => f.size)), truncated: fits.some(f => f.truncated)};
}

/**
 * Place an editorial callout in free space: scans a grid of chip positions
 * (several widths) inside `bounds`, keeps those clear of every obstacle whose
 * leader (chip edge → target) crosses no obstacle except the target's own
 * box, and returns the one with the shortest leader (null when none).
 * @param {any} ctx
 * @param {{text:string, target:{x:number,y:number}, targetBox?:any, obstacles:any[], bounds:any, widths:number[], size:number, maxLines?:number, make:(q:any)=>any, step?:number}} o
 */
export function placeFree(ctx, o) {
  const B = o.bounds;
  const step = o.step ?? 18;
  let best = null;
  for (const mw of o.widths) {
    const probe = o.make({chipAt: {x: 0, y: 0}, anchor: 'start', maxWidth: mw});
    if (probe.fit && probe.fit.truncated) continue;
    const cw = probe.box.w, ch = probe.box.h;
    for (let y = B.y; y + ch <= B.y + B.h; y += step) {
      for (let x = B.x; x + cw <= B.x + B.w; x += step) {
        const box = {x, y, w: cw, h: ch};
        if (o.obstacles.some(b => b && boxesOverlap(box, b, 8))) continue;
        const from = {x: Math.max(x, Math.min(o.target.x, x + cw)), y: Math.max(y, Math.min(o.target.y, y + ch))};
        const len = Math.hypot(from.x - o.target.x, from.y - o.target.y);
        if (best && len >= best.len) continue;
        if (!o.noLeader && o.obstacles.some(b => b && b !== o.targetBox && !(o.leaderMayCross && o.leaderMayCross.includes(b)) && segmentHits(from, o.target, b, o.leaderPad ?? 3))) continue;
        best = {len, x, y, mw};
      }
    }
    if (best && best.len < (o.goodEnough ?? 140)) break;
  }
  return best ? o.make({chipAt: {x: best.x, y: best.y}, anchor: 'start', maxWidth: best.mw}) : null;
}

/**
 * Passage slip: a provision pulled out of its text as a strip of paper, with
 * the coloured edge and id tab of its source, the provision heading and the
 * wording (the linked phrase marked). Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, color:string, src:{id:string,provision:string}, passage:{text:string,phrase:string}, size?:number, heading?:string}} o
 */
export function passageSlip(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const size = o.size ?? 22;
  const edge = 12;
  const pad = size * 0.7;
  const inner = o.w - edge - pad * 2;
  const idSz = o.idSize ?? size * 0.9;
  const tabW = Math.max(52, ctx.measure(o.src.id, idSz, 800, 'sans') + 24);
  const tabH = idSz * 1.5;
  const idFit = ctx.fit(o.src.id, {maxWidth: tabW - 12, size: idSz, minSize: 12, maxLines: 1, weight: 800});
  const headFit = fitWords(ctx, o.heading ?? o.src.provision, {maxWidth: inner - tabW - 10, size: size * 1.02, minSize: size * 0.92, maxLines: 5, weight: 700, family: 'serif'});
  const pass = passageBlock(ctx, {prefix: `${P}-pa`, text: o.passage.text, phrase: o.passage.phrase, w: inner, size, family: 'serif', maxPre: 5, maxPost: 5, slotLines: 5});
  const top = pad * 0.8;
  const passY = top + Math.max(headFit.height, tabH) + size * 0.45;
  const hh = passY + pass.h + pad;
  const teeth = 14;
  const bottom = Array.from({length: teeth + 1}, (_, i) => `${r(o.w - (o.w * i) / teeth)} ${r(hh + (i % 2 ? 6 : 0))}`).join('L');
  const d = `M4 0H${r(o.w - 4)}Q${o.w} 0 ${o.w} 4V${r(hh)}L${bottom}Z`;
  const node = g({name: P},
    h('path', {d, transform: 'translate(7 10)', fill: th.shadow}),
    h('path', {d, fill: th.paper, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('rect', {x: 0, y: 0, width: edge, height: hh, fill: o.color, stroke: th.ink, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(o.w - pad - tabW, top - 2, tabW, tabH, size * 0.35), fill: o.color, stroke: th.ink, 'stroke-width': 1.6}),
    ctx.show('key') ? textBlock(idFit, {x: o.w - pad - tabW / 2, y: top - 2 + (tabH - idFit.size) / 2 - 1, anchor: 'middle', fill: '#fff'}) : null,
    textOrBars(ctx, headFit, ctx.show('all'), {x: edge + pad, y: top, fill: th.ink}),
    g({transform: T(edge + pad, passY)}, pass.node),
  );
  const pb = pass.phraseBox;
  return {node, w: o.w, h: hh + 6, pass, phraseBox: {x: edge + pad + pb.x, y: passY + pb.y, w: pb.w, h: pb.h}, textBox: {x: edge + pad, y: top, w: inner, h: hh - top}, minTextSize: Math.min(headFit.size, pass.phFit.size), frame: s => pass.frame(s)};
}

/* ------------------------------------------------------------------------ */
/* Desk stage                                                                */
/* ------------------------------------------------------------------------ */

export const DESK = {
  horizontal: {W: 1690, H: 800},
  square: {W: 950, H: 800},
  vertical: {W: 950, H: 1420},
  // compact contrast lanes (quiet texts: the shared wording is printed once off the desks)
  panelH: {W: 1060, H: 480},
  panelV: {W: 620, H: 730},
  panelS: {W: 700, H: 372},
};

/**
 * Geometry per layout (stage units ≈ output px at 1080p with the default
 * safe area). book = gutter centre; inst = instrument top-left; clip: 'side'
 * (the clip grips the outer edge of the right page level with the passage)
 * or 'foot' (the bottom edge under it). endRest = where the clip rests at
 * the start. Shoulders sit outside the desk window.
 */
const GEO = {
  // contrast lane, wide: book left, instrument right, the clerk reaches in from above
  panelH: {
    pw: 190, ph: 320, book: {x: 236, y: 214}, size: 20, passageAt: 0.2, quiet: true, tagSize: 30, tagW: 260, cordK: 1.04, cordAdd: 20,
    inst: {x: 770, y: 70, w: 262, h: 300}, eyelet: 'left', instPassAt: 0.1, clip: 'side', offDir: {x: 0.35, y: 0.94},
    board: {x: 0, y: 0, w: 10}, note: null, lupa: {x: -400, y: -400, R: 40, angle: 180},
    shC: {x: 640, y: -260}, restC: {x: 640, y: -900}, armC: {upper: 330, lower: 320, width: 46}, bendC: 1,
    shR: null, endRest: {x: 660, y: 130, rot: 200}, cordSide: -1, tagAt: 0.5, carryLift: 50, tagString: 30,
  },
  // contrast lane for square frames: a short wide desk (two side by side keep >= 40 % of the width each)
  panelS: {
    pw: 110, ph: 170, book: {x: 150, y: 138}, size: 18, passageAt: 0.25, quiet: true, tagSize: 27, tagW: 262, idMin: 30,
    inst: {x: 466, y: 50, w: 214, h: 180}, eyelet: 'left', instPassAt: 0.1, clip: 'side', offDir: {x: 0.8, y: 0.6},
    board: {x: 0, y: 0, w: 10}, note: null, lupa: {x: -400, y: -400, R: 40, angle: 180},
    shC: {x: 410, y: -230}, restC: {x: 410, y: -800}, armC: {upper: 250, lower: 240, width: 40}, bendC: 1,
    shR: null, endRest: {x: 390, y: 80, rot: 200}, cordSide: -1, tagAt: 0.5, carryLift: 30, tagString: 16, cordK: 1.0, cordAdd: 6,
  },
  // contrast lane, square frames (two lanes side by side): book above, instrument below-left
  panelV: {
    pw: 150, ph: 280, book: {x: 310, y: 220}, size: 20, passageAt: 1, quiet: true, tagSize: 36, tagW: 300, idMin: 34,
    inst: {x: 24, y: 450, w: 250, h: 226}, eyelet: 'right', instPassAt: 0.2, clip: 'foot', offDir: {x: 0.6, y: 0.8},
    board: {x: 0, y: 0, w: 10}, note: null, lupa: {x: -400, y: -400, R: 40, angle: 180},
    shC: {x: 860, y: 520}, restC: {x: 1500, y: 520}, armC: {upper: 300, lower: 290, width: 44}, bendC: -1,
    shR: null, endRest: {x: 330, y: 560, rot: 80}, cordSide: -1, tagAt: 0.6, carryLift: 40, tagString: 30,
  },
  horizontal: {
    pw: 250, ph: 560, book: {x: 680, y: 432}, size: 22, passageAt: 0.42,
    inst: {x: 1210, y: 196, w: 336, h: 470}, eyelet: 'left', instPassAt: 0.2, clip: 'side',
    board: {x: 20, y: 26, w: 392}, boardSize: 24, note: {x: 20, y: 'bottom', w: 392}, noteSize: 23,
    lupa: {x: 1616, y: 520, R: 46, angle: 90}, lupaSpotDy: 0, tagString: 58,
    shC: {x: 1085, y: -210}, restC: {x: 1085, y: -900}, armC: {upper: 330, lower: 320, width: 48}, bendC: 1,
    shR: {x: 1560, y: 1090}, restR: {x: 1640, y: 1700}, armR: {upper: 340, lower: 330, width: 48}, bendR: -1,
    endRest: {x: 1110, y: 300, rot: 200}, cordSide: -1, tagAt: 0.52, carryLift: 70,
    chipC: [{x: 1060, y: 14, anchor: 'end'}, {x: 1110, y: 14, anchor: 'start'}], chipR: [{x: 1400, y: 'bottom', anchor: 'end'}],
  },
  square: {
    pw: 180, ph: 440, book: {x: 212, y: 548}, size: 24, passageAt: 0.5,
    inst: {x: 684, y: 318, w: 252, h: 430}, eyelet: 'left', instPassAt: 0.15, clip: 'side',
    board: {x: 18, y: 16, w: 446}, boardSize: 25.5, note: {x: 480, y: 16, w: 318}, noteSize: 24,
    lupa: {x: 878, y: 110, R: 42, angle: 90}, lupaSpotDy: 0, stackTop: true, lupaTop: true, offDir: {x: 0.3, y: 0.95}, tagW: 196,
    shC: {x: 560, y: 1060}, restC: {x: 560, y: 1700}, armC: {upper: 290, lower: 280, width: 44}, bendC: -1,
    shR: {x: 1150, y: 560}, restR: {x: 1900, y: 700}, armR: {upper: 300, lower: 290, width: 44}, bendR: 1,
    endRest: {x: 560, y: 720, rot: 110}, cordSide: 1, tagAt: 0.5, carryLift: 50,
    chipC: [{x: 590, y: 'bottom', anchor: 'start'}, {x: 530, y: 'bottom', anchor: 'end'}, {x: 936, y: 'bottom', anchor: 'end'}], chipR: [{x: 936, y: 'above-note', anchor: 'end'}, {x: 936, y: 230, anchor: 'end'}],
  },
  vertical: {
    pw: 396, ph: 520, book: {x: 475, y: 580}, size: 22, passageAt: 1, stackTop: true,
    inst: {x: 28, y: 964, w: 440, h: 420}, eyelet: 'right', instPassAt: 0.1, clip: 'foot',
    board: {x: 20, y: 20, w: 450}, boardSize: 24, note: {x: 490, y: 20, w: 440}, noteSize: 22,
    lupa: {x: 830, y: 1330, R: 50, angle: 180}, lupaSpotDy: 0,
    shC: {x: 1180, y: 900}, restC: {x: 1850, y: 900}, armC: {upper: 330, lower: 320, width: 46}, bendC: -1,
    shR: {x: 600, y: 1700}, restR: {x: 700, y: 2400}, armR: {upper: 390, lower: 380, width: 46}, bendR: 1,
    endRest: {x: 590, y: 1180, rot: 70}, cordSide: -1, tagAt: 0.74, carryLift: 60,
    chipC: [{x: 936, y: {sh: 'C', dy: -80}, anchor: 'end'}, {x: 936, y: {sh: 'C', dy: 40}, anchor: 'end'}, {x: 936, y: {sh: 'C', dy: 110}, anchor: 'end'}, {x: 936, y: {sh: 'C', dy: 200}, anchor: 'end'}, {x: 936, y: {sh: 'C', dy: 280}, anchor: 'end'}], chipR: [{x: 936, y: 'bottom', anchor: 'end'}, {x: 740, y: 'bottom', anchor: 'end'}],
  },
};

/** Rotate a local vector by deg. */
const rot = (q, deg) => {
  const a = rad(deg);
  return {x: q.x * Math.cos(a) - q.y * Math.sin(a), y: q.x * Math.sin(a) + q.y * Math.cos(a)};
};

/**
 * Desk stage: bound volume, instrument, link cord + clip + tag, hierarchy
 * board, reading card, lens, and the clerk's / reader's arms.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {'horizontal'|'square'|'vertical'} o.layout
 * @param {any} o.content              params with sources/passages/hierarchy/interpretations
 * @param {string} o.hierarchyLabel
 * @param {string} o.state             supplied link state (final)
 * @param {string} [o.state2]          (inspect) substituted state
 * @param {string} [o.tagText]         tag text (default: the state label)
 * @param {number} [o.tagSize]         tag text size override (default: the layout's)
 * @param {boolean} [o.gripWire]      the hand holds the clip by its wire loop (body visible)
 * @param {number} [o.textFloor]       smallest size (stage units) for ids, board, card and tag text
 * @param {string} [o.tagText2]        (inspect) substituted tag text
 * @param {boolean} [o.clerk=true]
 * @param {boolean} [o.reader=true]
 * @param {boolean} [o.note=true]      reading card
 * @param {{a?:string,b?:string}} [o.chips] actor captions (a = reader, b = clerk)
 * @param {string} [o.seedKey]
 */
export function linkDesk(ctx, o) {
  // Long wording makes the desk taller; when it does, the desk is also widened (pages and sheet
  // get wider, so they need fewer lines) until its shape matches the frame again: the whole stage
  // then scales uniformly and the text keeps its size best.
  if (o._f === undefined) {
    const W0 = o.deskW ?? DESK[o.layout].W, H0 = o.deskH ?? DESK[o.layout].H;
    let best = null;
    for (let f = 1; f <= 1.45; f += 0.05) {
      const st = linkDesk(ctx, {...o, _f: f});
      const k = Math.max(st.W / W0, st.H / H0);
      if (!best || k < best.k - 1e-3) best = {k, st};
      if (st.H / H0 <= st.W / W0 + 1e-6) break;
    }
    return best.st;
  }
  const th = ctx.theme;
  const C = motifColors(ctx);
  const P = o.prefix;
  const f = o._f;
  const G = {...GEO[o.layout], ...(o.geo || {})};
  G.book = {...G.book}; G.inst = {...G.inst};
  if (f !== 1) {
    const sx = q => (q ? {...q, x: q.x * f} : q);
    G.pw *= f;
    G.book = sx(G.book);
    G.inst = {...sx(G.inst), w: G.inst.w * f};
    G.board = {...sx(G.board), w: G.board.w * f};
    if (G.note) G.note = {...sx(G.note), w: G.note.w * f};
    G.lupa = sx(G.lupa);
    G.shC = sx(G.shC); G.shR = sx(G.shR); G.restC = sx(G.restC); G.restR = sx(G.restR); G.endRest = sx(G.endRest);
    G.chipC = (G.chipC || []).map(sx); G.chipR = (G.chipR || []).map(sx);
  }
  const W = (o.deskW ?? DESK[o.layout].W) * f;
  let H = o.deskH ?? DESK[o.layout].H;
  const content = o.content;
  const seedKey = o.seedKey || 'dn';
  const t = kitT(ctx);
  const size = G.size;
  // `textFloor` (stage units): no caption, id or card text is set smaller than this (the entry derives
  // it from the stage scale so small print stays >= 16 px at 1080p)
  const TF = o.textFloor ?? 0;
  if (TF) {
    G.idMin = Math.max(G.idMin ?? 0, TF);
    G.boardSize = Math.max(G.boardSize ?? size, TF / 0.88);
    G.noteSize = Math.max(G.noteSize ?? size, TF / 0.9);
    if (G.tagSize) G.tagSize = Math.max(G.tagSize, TF / 0.9);
  }

  // --- hierarchy board and reading card (laid out first: the texts adapt to them)
  const withBoard = o.board !== false;
  let board = null;
  const boardAt = {x: G.board.x, y: G.board.y};
  if (withBoard) board = levelBoard(ctx, {prefix: `${P}-board`, w: G.board.w, hier: content.hierarchy, ids: content.sources.map(s => s.id), colors: C.src, header: o.hierarchyLabel ?? t.hierarchy, size: G.boardSize ?? size, fitRows: true});
  let note = null, noteAt = null;
  if (o.note !== false && content.interpretations.length && G.note) {
    note = readingCard(ctx, {prefix: `${P}-note`, w: G.note.w, interp: content.interpretations[0], size: G.noteSize ?? size, heading: t.readingProposed, roomy: true});
    const ny = G.note.y === 'below-board' ? boardAt.y + (board ? board.h : 0) + 24 : G.note.y === 'bottom' ? H - 14 - note.h : G.note.y;
    noteAt = {x: G.note.x, y: ny};
  }
  // content-driven heights: the page and the sheet grow to hold their wording (never cut); the
  // desk grows with them (the entry then scales the whole stage, keeping text >= 16 px)
  // quiet lanes draw their wording as bars; the bars follow the default wording so every preset gets
  // the same desk geometry (the supplied wording is printed legibly elsewhere by the entry)
  const qp = G.quiet ? SOURCES_DEFAULTS.passages : content.passages;
  const qs = G.quiet ? content.sources.map((q, i) => ({...q, title: SOURCES_DEFAULTS.sources[i].title, provision: SOURCES_DEFAULTS.sources[i].provision})) : content.sources;
  const bookArgs = {
    prefix: `${P}-book`, pw: G.pw, color: C.book, src: qs[0],
    passage: {text: qp[0].text, tension: qp[0].phrase},
    passageAt: G.passageAt, size, seedKey: `${seedKey}-book`, maxPre: G.maxPre ?? 4, maxPost: G.maxPost ?? 5, idMin: TF || undefined,
    ...(G.quiet ? {quiet: true, titleBars: true, slotLines: 2, maxPre: 2, maxPost: 2, idMin: G.idMin ?? 26, ribbon: false} : {}),
  };
  const instArgs = {
    prefix: `${P}-inst`, color: C.inst, src: qs[1], passage: qp[1],
    size, passageAt: G.instPassAt, eyelet: {side: G.eyelet}, seedKey: `${seedKey}-inst`, maxPre: 4, maxPost: 5, idMin: TF || undefined,
    ...(G.quiet ? {quiet: true, titleBars: true, slotLines: 2, maxPre: 2, maxPost: 2, idMin: G.idMin ?? 26} : {}),
  };
  const phNeed = boundVolume(ctx, {...bookArgs, ph: 3000}).need;
  const ihNeed = instrumentSheet(ctx, {...instArgs, w: G.inst.w, h: 3000}).need;
  const H0 = H;
  if (o.layout === 'horizontal') {
    const ph = Math.max(G.ph, phNeed);
    const ih = Math.max(G.inst.h, ihNeed);
    const col = (board ? board.h : 0) + (note ? note.h + 24 : 0) + (G.reserveCol ?? 80) + 40;
    H = Math.max(H, ph + 24 + 96, ih + 110, col);
    const dy = (H - H0) / 2 + (ph - G.ph) * 0;
    G.ph = ph;
    G.book = {x: G.book.x, y: G.book.y + dy};
    G.inst = {...G.inst, y: Math.min(G.inst.y + dy, H - 24 - ih), h: ih};
    G.endRest = {...G.endRest, y: G.endRest.y + dy};
    G.lupa = {...G.lupa, y: G.lupa.y + dy};
    G.shR = {...G.shR, y: G.shR.y + (H - H0)};
    if (note && G.note.y === 'bottom') noteAt.y = H - 14 - note.h;
  } else if (G.stackTop) {
    const topBottom = Math.max(board ? boardAt.y + board.h : 0, note && typeof G.note.y === 'number' ? noteAt.y + note.h : 0);
    const top0 = G.book.y - G.ph / 2;
    const top = Math.max(top0, topBottom + 56 + (o.reserveTop ?? 0));
    const ph = Math.max(G.ph - (top - top0), G.minPh ?? 0, phNeed);
    const dBottom = (top + ph) - (top0 + G.ph);
    const ih = Math.max(G.inst.h, ihNeed);
    if (G.clip === 'foot') {
      // the instrument lies under the book: it moves down with the book's bottom edge
      const iy = G.inst.y + Math.max(0, dBottom);
      H = Math.max(H, iy + ih + 30);
      G.inst = {...G.inst, y: iy, h: ih};
      const d = iy - GEO[o.layout].inst.y;
      G.endRest = {...G.endRest, y: G.endRest.y + d};
      G.lupa = {...G.lupa, y: G.lupa.y + (H - H0)};
      G.shR = {...G.shR, y: G.shR.y + (H - H0)};
      G.shC = {...G.shC, y: G.shC.y + d};
    } else {
      const iy = Math.max(G.inst.y, top + 40);
      H = Math.max(H, top + ph + 52, iy + ih + 20);
      G.inst = {...G.inst, y: iy, h: Math.max(ih, Math.min(G.inst.h, H - 24 - iy))};
      G.endRest = {...G.endRest, y: G.endRest.y + (H - H0)};
      G.shC = {...G.shC, y: G.shC.y + (H - H0)};
    }
    G.book = {x: G.book.x, y: top + ph / 2};
    G.ph = ph;
  }

  // --- the bound volume (enabling document) and the instrument
  const book = boundVolume(ctx, {...bookArgs, ph: G.ph});
  const inst = instrumentSheet(ctx, {...instArgs, w: G.inst.w, h: G.inst.h});
  const bookC = {x: G.book.x, y: G.book.y};
  const bookPt = q => ({x: bookC.x + q.x, y: bookC.y + q.y});
  const instAt = {x: G.inst.x, y: G.inst.y};
  const instPt = q => ({x: instAt.x + q.x, y: instAt.y + q.y});
  const phA = (() => { const q = bookPt(book.phraseBox); return {x: q.x, y: q.y, w: book.phraseBox.w, h: book.phraseBox.h}; })();
  const phI = (() => { const q = instPt(inst.phraseBox); return {x: q.x, y: q.y, w: inst.phraseBox.w, h: inst.phraseBox.h}; })();
  const bookOuter = {x: bookC.x + book.outer.x, y: bookC.y + book.outer.y, w: book.outer.w, h: book.outer.h};
  const bookBox = {x: bookC.x + book.bounds.x, y: bookC.y + book.bounds.y, w: book.bounds.w, h: book.bounds.h};
  const instBox = {x: instAt.x + inst.bounds.x, y: instAt.y + inst.bounds.y, w: inst.bounds.w, h: inst.bounds.h};

  // --- clip spots: fastened on the enabling page edge / laid open beside it
  const clip = bindingClip(ctx, {name: `${P}-clip`, s: G.clipS ?? 1});
  const passText = {x: bookC.x + book.textBox.x, y: bookC.y + book.textBox.y, w: book.textBox.w, h: book.textBox.h};
  let clipSpot, clipRot, outward;
  if (G.clip === 'foot') {
    clipSpot = {x: passText.x + passText.w * 0.5, y: bookOuter.y + bookOuter.h + 6};
    clipRot = 90;
    outward = {x: 0, y: 1};
  } else {
    clipSpot = {x: bookOuter.x + bookOuter.w + 6, y: phA.y + phA.h / 2};
    clipRot = 0;
    outward = {x: 1, y: 0};
  }
  const offPage = (clip.body.w + 54) * (G.clipS ?? 1);
  // "to be checked": the clip slides off the page edge and is laid down beside it, below the passage line
  const offDir = G.offDir ?? (G.clip === 'foot' ? {x: 0.5, y: 0.87} : {x: 0.55, y: 0.84});
  const checkSpot = {x: clipSpot.x + offDir.x * offPage, y: clipSpot.y + offDir.y * offPage};
  const checkRot = clipRot + (G.clip === 'foot' ? -14 : 14);
  const endRest = {x: G.endRest.x, y: G.endRest.y};
  const restRot = G.endRest.rot;

  // --- cord (keeps its length; slack solved per frame)
  const cord = linkCord(ctx, {name: `${P}-cord`, width: G.cordW ?? 9});
  const A = instPt(inst.eyelet);
  const cordEndOf = (pos, deg) => { const q = rot(clip.cordAt, deg); return {x: pos.x + q.x, y: pos.y + q.y}; };
  const cordL = dist(A, cordEndOf(clipSpot, clipRot)) * (G.cordK ?? 1.06) + (G.cordAdd ?? 36);

  // --- tag threaded on the cord
  const tagSize = o.tagSize ?? G.tagSize ?? size;
  const tag = linkTag(ctx, {name: `${P}-tag`, w: G.tagW ?? 210, size: tagSize, stringLen: G.tagString, text: o.tagText ?? stateLabel(ctx, o.state), state: o.state, text2: o.tagText2 ?? null, state2: o.state2 ?? null});

  // --- lens
  const withReader = o.reader !== false && Boolean(G.shR);
  const lp = lupa(ctx, {name: `${P}-lupa`, R: G.lupa.R, handleLen: G.lupa.R * 1.75, angle: G.lupa.angle});
  const lensRest = {x: G.lupa.x, y: G.lupa.y};
  const lensSpot = {x: phI.x + phI.w / 2, y: phI.y + phI.h / 2 + (G.lupaSpotDy ?? 0)};
  const lensFp = lensFootprint(lensRest, G.lupa.R, G.lupa.angle, G.lupa.R * 1.75);
  const LZ = `${P}-lz-`;
  let lens = null, lensNames = [];
  if (withReader && o.lens !== false) {
    const src = g({name: `${P}-instg`, transform: T(instAt.x, instAt.y)}, inst.node);
    lensNames = namesIn(src);
    lens = lensView(ctx, {name: `${P}-lens`, R: G.lupa.R * 0.9, content: cloneForLens(src, LZ), k: 1.7});
  }

  // --- arms
  const withClerk = o.clerk !== false;
  const lookC = actorLook(ctx, null, 1);
  const lookR = actorLook(ctx, null, 0);
  const armC = withClerk ? topArm(ctx, {name: `${P}-armC`, skin: lookC.skin, sleeve: lookC.outfit, handed: 'right', handScale: 1.25, ...G.armC}) : null;
  const armR = withReader ? topArm(ctx, {name: `${P}-armR`, skin: lookR.skin, sleeve: lookR.outfit, handed: 'left', handScale: 1.25, ...G.armR}) : null;
  // rest poses: the hand lies out along the given direction, within reach (arm nearly straight, off the desk)
  const restAt = (sh, rest, arm) => {
    const d = dist(sh, rest) || 1;
    const k = Math.min(1, (arm.reach * 0.93) / d);
    return {x: sh.x + (rest.x - sh.x) * k, y: sh.y + (rest.y - sh.y) * k};
  };
  if (armC) G.restC = restAt(G.shC, G.restC, armC);
  if (armR) G.restR = restAt(G.shR, G.restR, armR);

  // --- actor chips (clear of the objects)
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, seedKey: `${seedKey}-desk`});
  const boardBox = board ? {x: boardAt.x, y: boardAt.y, w: board.w, h: board.h} : null;
  const noteBox = note ? {x: noteAt.x, y: noteAt.y, w: note.w, h: note.h} : null;
  // the tag hangs where it clears both texts and the clip in the final pose(s): position along the
  // cord and a sideways lean of its string are chosen together
  const clipBoxAt = stt => {
    const pos = stt === 'authorization-to-be-checked' ? checkSpot : clipSpot;
    return G.clip === 'foot' ? {x: pos.x - 26, y: pos.y - 36, w: 52, h: 78} : {x: pos.x - 36, y: pos.y - 26, w: 78, h: 52};
  };
  {
    const states = [o.state, o.state2 ?? o.state];
    const clearOne = (stt, tt, sh) => {
      const chk = stt === 'authorization-to-be-checked';
      const shp = cord.shape(A, cordEndOf(chk ? checkSpot : clipSpot, chk ? checkRot : clipRot), cordL, G.cordSide ?? 1);
      const b = tag.boxAt(shp.poly.at(tt), G.tagHang, sh);
      return !boxesOverlap(b, bookOuter, 8) && !boxesOverlap(b, instBox, 8) && b.y + b.h < H - 8 && b.x > 8 && b.x + b.w < W - 8
        && states.every(s2 => !boxesOverlap(b, clipBoxAt(s2), 4));
    };
    const base = G.tagAt ?? 0.5;
    const ts = [0, -0.05, 0.05, -0.1, 0.1, -0.15, 0.15, -0.2, 0.2, -0.25, 0.25, -0.3, 0.3].map(d => base + d).filter(tt => tt > 0.1 && tt < 0.9);
    const SHIFTS = [];
    for (const dy of [0, 30, 60, 90]) for (const dx of [0, 20, -20, 40, -40, 60, -60, 80, -80, 100, -100, 130, -130, 160, -160, 200, -200]) SHIFTS.push({x: dx, y: dy});
    let found = null;
    for (const tt of ts) {
      const sh = states.map(stt => SHIFTS.find(q => clearOne(stt, tt, q)));
      if (sh.every(q => q !== undefined)) {
        const cost = sh.reduce((a, q) => a + Math.abs(q.x) + q.y * 1.5, 0) + Math.abs(tt - base) * 200;
        if (!found || cost < found.cost) found = {tt, sh, cost};
      }
    }
    G.tagAt = found ? found.tt : base;
    G.tagShifts = found ? found.sh : [{x: 0, y: 0}, {x: 0, y: 0}];
    G.tagClear = Boolean(found);
  }
  const shiftFor = stt => (stt === (o.state2 ?? o.state) && stt !== o.state ? G.tagShifts[1] : G.tagShifts[0]);
  G.tagShift = G.tagShifts[0];
  const tagFinal = tag.boxAt(cord.shape(A, cordEndOf(o.state === 'authorization-to-be-checked' ? checkSpot : clipSpot, o.state === 'authorization-to-be-checked' ? checkRot : clipRot), cordL, G.cordSide ?? 1).poly.at(G.tagAt), G.tagHang, G.tagShift);
  const chips = [], chipBoxes = [], chipFits = [];
  const chipSize = G.chipSize ?? size;
  const objBoxes = [bookBox, instBox, boardBox, noteBox, lensFp.box, tagFinal].filter(Boolean);
  if (ctx.show('key') && o.chips) {
    const chipY = (c, hgt) => (c.y === 'bottom' ? H - 16 - hgt : c.y === 'above-note' ? (noteBox ? noteBox.y + noteBox.h + 14 : 200) : typeof c.y === 'object' ? (c.y.sh === 'C' ? G.shC.y : G.shR.y) + c.y.dy : c.y);
    for (const [text, cands, name, on] of [[o.chips.b, G.chipC, `${P}-chipC`, withClerk], [o.chips.a, G.chipR, `${P}-chipR`, withReader]]) {
      if (!text || !on || !cands) continue;
      const mw = Math.min(W * 0.4, 380);
      const probe = placeChip(ctx, text, [{x: 0, y: 0}], {maxWidth: mw, size: chipSize, name: 'probe', obstacles: [], bounds: {x: -1e5, y: -1e5, w: 2e5, h: 2e5}});
      const obst = [...objBoxes, ...chipBoxes];
      const bnd = {x: 12, y: 8, w: W - 24, h: H - 16};
      let c = placeChip(ctx, text, cands.map(q => ({x: q.x, y: chipY(q, probe.box.h), anchor: q.anchor})), {maxWidth: mw, size: chipSize, name, obstacles: obst, bounds: bnd});
      if (obst.some(b => boxesOverlap(c.box, b, 4)) || c.box.x < bnd.x || c.box.y < bnd.y || c.box.x + c.box.w > bnd.x + bnd.w || c.box.y + c.box.h > bnd.y + bnd.h) {
        // none of the preferred spots is free: the nearest free spot to where the arm enters the desk
        const sh = name.endsWith('chipC') ? G.shC : G.shR;
        const entry = {x: Math.max(0, Math.min(W, sh.x)), y: Math.max(0, Math.min(H, sh.y))};
        const alt = placeFree(ctx, {target: entry, obstacles: obst, bounds: bnd, widths: [mw], size: chipSize, noLeader: true, goodEnough: 1e9,
          make: q => chip(ctx, text, {x: q.chipAt.x, y: q.chipAt.y, anchor: 'start', maxWidth: q.maxWidth, size: chipSize, minSize: chipSize * 0.86, maxLines: 2, name})});
        if (alt) c = alt;
      }
      chips.push(c.node);
      chipBoxes.push(c.box);
      chipFits.push(c.fit);
    }
  }

  const lensDrawn = o.parkedLens !== false && (withReader || Boolean(o.lupaParked));
  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      board ? g({transform: T(boardAt.x, boardAt.y)}, board.node) : null,
      note ? g({transform: T(noteAt.x, noteAt.y)}, note.node) : null,
      g({name: `${P}-bookg`, transform: T(bookC.x, bookC.y)}, book.node),
      g({name: `${P}-instg`, transform: T(instAt.x, instAt.y)}, inst.node),
      cord.node,
      cord.knot,
      tag.node,
      clip.node,
      lens ? lens.node : null,
      armR ? [armR.arm, armR.palm] : null,
      lensDrawn ? lp.node : null,
      armR ? armR.thumb : null,
      armC ? [armC.arm, armC.palm, armC.thumb] : null,
      o.extra || null,
    ),
    desk.frame,
    chips,
  );

  /** clip world pose from its position and angle */
  // `gripWire`: the hand pinches the clip by its wire loop, so the steel body stays in view beside the fist
  const gripPt = o.gripWire ? {x: 26 * clip.s, y: 0} : clip.grip;
  const gripOf = (pos, deg) => { const q = rot(gripPt, deg); return {x: pos.x + q.x, y: pos.y + q.y}; };

  /**
   * Pose the stage from action values in [0,1].
   * @param {object} s
   * @param {number} [s.grab]      clerk's hand from rest to the clip at its rest spot
   * @param {number} [s.carry]     clip carried to the page (on an arc)
   * @param {number} [s.place]     clip clamped (supplied) / laid open (to be checked)
   * @param {number} [s.back]      empty hand withdraws
   * @param {number} [s.stateMix]  0 = final geometry of `state`, 1 = of `state2` (inspect substitution)
   * @param {number} [s.hlRef]     highlight of the instrument's reference phrase
   * @param {number} [s.hlArt]     highlight of the enabling passage (supplied) / pencil outline (to be checked)
   * @param {number} [s.flip]      tag turned to its written face
   * @param {number} [s.swap]      (inspect) tag text before → after
   * @param {number} [s.lensGrab] / lensCarry / lensBack / lensRelease  reader and lens
   */
  function pose(s) {
    const nodes = {};
    const v = k => clamp(s[k] ?? 0);
    const mixS = v('stateMix');
    const isChk = st => st === 'authorization-to-be-checked';
    const chk0 = isChk(o.state) ? 1 : 0;
    const chk1 = isChk(o.state2 ?? o.state) ? 1 : 0;
    const chk = lerp(chk0, chk1, ease.inOutCubic(mixS));
    const target = mix(clipSpot, checkSpot, chk);
    const targetRot = lerp(clipRot, checkRot, chk);

    // --- clip position (rest → carried → placed)
    let clipPos = endRest, clipDeg = restRot, clipOpen = 1, holder = 'desk';
    const carry = ease.inOutSine(v('carry'));
    const lift = Math.sin(Math.PI * carry) * (G.carryLift ?? 60);
    if (v('carry') > 0 || v('place') > 0 || v('back') > 0 || s.placed) {
      const m = mix(endRest, target, carry);
      // lift the clip on an arc away from the cord's side
      clipPos = {x: m.x, y: m.y - lift};
      clipDeg = lerp(restRot, targetRot, carry);
    }
    if (s.placed) { clipPos = target; clipDeg = targetRot; }
    if (withClerk && v('grab') >= 1 && v('back') === 0) holder = 'hand';
    const placed = v('place');
    // supplied: the jaws close on the page edge while placing; to be checked: they stay open
    clipOpen = v('carry') >= 1 || s.placed ? lerp(1, chk, ease.inOutCubic(s.placed ? 1 : placed)) : 1;
    if (s.placed) clipOpen = chk;
    Object.assign(nodes, clip.frame(clipOpen));
    const lifted = holder === 'hand' && placed === 0 && v('grab') >= 1;
    nodes[`${P}-clip`] = {transform: T(clipPos.x, clipPos.y, clipDeg, lifted ? 1.06 : 1)};
    nodes[`${P}-clip-shadow`] = {opacity: lifted ? 0.45 : 1};

    // --- clerk's hand
    let handC = null, solvedC = null;
    const grip = gripOf(clipPos, clipDeg);
    if (armC) {
      const restGrip = gripOf(endRest, restRot);
      if (v('back') > 0) handC = mix(gripOf(target, targetRot), G.restC, ease.inOutSine(v('back')));
      else if (v('grab') >= 1) handC = grip;
      else handC = mix(G.restC, restGrip, ease.inOutSine(v('grab')));
      const press = placed > 0 && v('back') === 0 ? Math.sin(Math.PI * placed) * 5 : 0;
      solvedC = armC.pose(G.shC, {x: handC.x, y: handC.y + press}, G.bendC);
      Object.assign(nodes, solvedC.nodes);
    }

    // --- cord and tag
    const E = cordEndOf(clipPos, clipDeg);
    const cf = cord.frame(A, E, cordL, G.cordSide ?? 1);
    Object.assign(nodes, cf.nodes);
    const tagP = cf.shape.poly.at(G.tagAt ?? 0.5);
    // the tag swings to its clear spot as the clip is carried (at rest every lane hangs it the same way)
    const swing = s.placed ? 1 : carry;
    const tagShift = {x: swing * lerp(G.tagShifts[0].x, G.tagShifts[1].x, ease.inOutCubic(mixS)), y: swing * lerp(G.tagShifts[0].y, G.tagShifts[1].y, ease.inOutCubic(mixS))};
    Object.assign(nodes, tag.frame({P: tagP, flip: v('flip'), swap: v('swap'), hang: G.tagHang, shift: tagShift}));

    // --- highlights
    const hlArt = v('hlArt');
    Object.assign(nodes, inst.frame({hl: v('hlRef')}));
    // supplied → marker sweep; to be checked → dashed pencil outline (the link is not fastened)
    Object.assign(nodes, book.frame({hl: hlArt * (1 - chk), ghost: hlArt * chk}));

    // --- reader: lens over the instrument's reference phrase
    let lensC = lensRest, lensHolder = 'desk', solvedR = null;
    if (armR) {
      const restGrip = {x: lensRest.x + lp.grip.x, y: lensRest.y + lp.grip.y};
      let handR;
      if (v('lensRelease') > 0) handR = mix(restGrip, G.restR, ease.inOutSine(v('lensRelease')));
      else if (v('lensBack') > 0) {
        const cp = ease.inOutSine(v('lensBack'));
        const m = mix(lensSpot, lensRest, cp);
        handR = {x: m.x + lp.grip.x, y: m.y - Math.sin(Math.PI * cp) * 16 + lp.grip.y};
        lensHolder = 'hand';
      } else if (v('lensCarry') > 0) {
        const cp = ease.inOutSine(v('lensCarry'));
        const m = mix(lensRest, lensSpot, cp);
        handR = {x: m.x + lp.grip.x, y: m.y - Math.sin(Math.PI * cp) * 16 + lp.grip.y};
        lensHolder = 'hand';
      } else {
        handR = mix(G.restR, restGrip, ease.inOutSine(v('lensGrab')));
        lensHolder = v('lensGrab') >= 1 ? 'hand' : 'desk';
      }
      solvedR = armR.pose(G.shR, handR, G.bendR);
      Object.assign(nodes, solvedR.nodes);
      if (lensHolder === 'hand') lensC = {x: solvedR.hand.x - lp.grip.x, y: solvedR.hand.y - lp.grip.y};
    }
    if (lensDrawn) {
      nodes[`${P}-lupa`] = {transform: T(lensC.x, lensC.y, 0, lensHolder === 'hand' ? 1.05 : 1)};
      nodes[`${P}-lupa-shadow`] = {opacity: lensHolder === 'hand' ? 0.5 : 1};
    }
    const lensOn = Boolean(lens) && v('lensCarry') > 0.5 && v('lensBack') < 0.5;
    if (lens) {
      Object.assign(nodes, mirror(nodes, lensNames, LZ));
      Object.assign(nodes, lens.frame(lensC, lensOn ? 1 : 0));
    }

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const reachC = solvedC ? solvedC.reached : true;
    const reachR = solvedR ? solvedR.reached : true;
    const onPage = dist(clipPos, clipSpot) < 1 && clipOpen < 0.02;
    const tagBox = tag.boxAt(tagP, G.tagHang, tagShift);
    return {
      nodes,
      semantic: {
        clip: P2(clipPos),
        clipGrip: P2(grip),
        clipHolder: holder,
        clipOpen: r(clipOpen, 3),
        clipFastened: onPage,
        clipOffPage: dist(clipPos, checkSpot) < 1,
        cordEnd: P2(E),
        cordLen: r(cf.shape.len, 1),
        cordBulge: r(cf.shape.bulge, 1),
        cordTarget: r(cordL, 1),
        handC: solvedC ? P2(solvedC.hand) : null,
        handR: solvedR ? P2(solvedR.hand) : null,
        lens: P2(lensC),
        lensGrip: P2({x: lensC.x + lp.grip.x, y: lensC.y + lp.grip.y}),
        lensHolder,
        lensOverRef: dist(lensC, lensSpot) < 2,
        lensShowsCopy: lensOn,
        tag: P2(tagP),
        tagBox: {x: r(tagBox.x), y: r(tagBox.y), w: r(tagBox.w), h: r(tagBox.h)},
        tagFlip: r(v('flip'), 3),
        hlRef: r(v('hlRef'), 3),
        hlArt: r(hlArt * (1 - chk), 3),
        pencilArt: r(hlArt * chk, 3),
        reach: {C: reachC, R: reachR},
        allReached: reachC && reachR,
        tagClear: G.tagClear,
      },
    };
  }

  return {
    node, pose, W, H, G,
    book, inst, board, boardAt, note, noteAt, tag, clip, cord, lp,
    bookC, instAt, phA, phI, bookBox, instBox, bookOuter, boardBox, noteBox, lensFp, lensRest, lensSpot,
    clipSpot, checkSpot, clipRot, checkRot, endRest, eyelet: A, cordL,
    chipBoxes, chipFits, objBoxes, tagFinal,
    lensDrawn,
    /** virtual tree of the texts, cord, tag and clip in stage coords (for detail copies; no SVG ids) */
    lensSource: () => g(null,
      g({name: `${P}-bookg`, transform: T(bookC.x, bookC.y)}, book.node),
      g({name: `${P}-instg`, transform: T(instAt.x, instAt.y)}, inst.node),
      cord.node, cord.knot, tag.node, clip.node),
    /** tag box at the final pose of a state */
    tagBoxFor: state => {
      const chk = state === 'authorization-to-be-checked';
      const pos = chk ? checkSpot : clipSpot, deg = chk ? checkRot : clipRot;
      const sh = cord.shape(A, cordEndOf(pos, deg), cordL, G.cordSide ?? 1);
      return tag.boxAt(sh.poly.at(G.tagAt ?? 0.5), G.tagHang, shiftFor(state));
    },
    /** cord polyline at the final pose of a state */
    cordFor: state => {
      const chk = state === 'authorization-to-be-checked';
      const pos = chk ? checkSpot : clipSpot, deg = chk ? checkRot : clipRot;
      return cord.shape(A, cordEndOf(pos, deg), cordL, G.cordSide ?? 1);
    },
    clipBoxFor: state => {
      const chk = state === 'authorization-to-be-checked';
      const pos = chk ? checkSpot : clipSpot;
      return clipBoxAt(state);
    },
    lensParked: {inDesk: footprintInside(lensFp, {x: 0, y: 0, w: W, h: H}, 4), clear: ![bookBox, instBox, boardBox, noteBox, ...chipBoxes].filter(Boolean).some(b => footprintHits(lensFp, b, 4))},
    segmentHits,
  };
}
