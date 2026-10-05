/**
 * Motif kit for "Conflicto entre textos" (LAW-0129..0132), category sources.
 *
 * Objects (original vector art, top-down unless noted):
 *  - libro: an open book (the first text, the anchor). Its provision passage
 *    sits on the right page with the tension phrase on its own highlighted
 *    line; an index tab carries the source id and a ribbon hangs from it.
 *  - artículo: a printed article sheet (the second text) with a coloured
 *    header band, its own index tab, the provision passage and body columns.
 *  - jerarquía editable: a slotted board whose rows carry slide-in level
 *    cards with USER-SUPPLIED labels and coloured tokens for the two texts.
 *    It is only displayed; nothing in this kit applies it as an ordering rule.
 *  - lupa: a hand lens whose glass shows a real enlarged copy of what lies
 *    under it (same coordinates, scaled about the lens centre).
 *  - the zone of tension: a band joining the two highlighted phrases, drawn
 *    as a jagged spark (conflict flagged), calm double rule (compatible
 *    application) or a plain band (highlighted only) — always the SUPPLIED
 *    state; no conflict is ever resolved, no text "prevails".
 *  - markers: a pennant pin (conflict flagged) and a paper clip (compatible
 *    application), kept in a cup until a hand places them.
 *
 * The kit owns fields, defaults, strings, geometry, art and a pose solver
 * for the desk stage (action values → node props + semantics). Every entry
 * owns its own timeline, composition and assertions.
 * @module animations/sources/kits/conflicto-entre-textos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath, mix, dist, rad} from '../../../core/geometry.js';
import {FONTS} from '../../../core/text.js';
import {str, int, list, obj, oneOf} from '../../../schemas/fields.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';

/* ------------------------------------------------------------------------ */
/* Fields, defaults and strings                                              */
/* ------------------------------------------------------------------------ */

export const MAX_LEVELS = 3;
/** Supplied states the zone of tension can show (never inferred). */
export const ZONE_STATES = ['conflict-flagged', 'compatible-application', 'tension-highlighted'];

/**
 * Category field set for "sources" (Fuentes e interpretación) as used by
 * this motif: the two texts, the user-supplied hierarchy, the passages and
 * attributed interpretations.
 */
export const sourcesFields = {
  sources: list('The two fictional texts brought together: the first is the book (anchor), the second the article', obj('Source text', {
    id: str('Short identifier printed on the index tab and on its hierarchy token', 4),
    title: str('Title printed on the text (fictional)', 64),
    provision: str('Provision reference printed above its passage (fictional)', 32),
  }, ['id', 'title', 'provision']), 2, 2),
  hierarchy: obj('Editable hierarchy: a user-supplied ordering of the two texts shown on a slotted board. Neutral labels by default; it is displayed, never applied as an ordering rule and never used to resolve the conflict', {
    levels: list('Level labels, top to bottom (user-supplied, neutral)', str('Level label', 36), 1, MAX_LEVELS),
    placement: list('Level of each text (0 = first level), same order as sources; values beyond the last level use the last level', int('Level index', 0, MAX_LEVELS - 1), 2, 2),
    caption: str('Caption printed at the foot of the board', 60),
  }, ['levels', 'placement']),
  passages: list('Simulated wording of each provision (same order as sources) and the phrase highlighted as its zone of tension', obj('Passage', {
    text: str('Simulated clause wording (fictional)', 130),
    tension: str('Phrase of that wording highlighted as the zone of tension; if it does not occur in the wording it is shown as a separate marked line', 60),
  }, ['text', 'tension']), 2, 2),
  interpretations: list('Readings attributed to fictional sources; shown as attributed notes ("reading proposed"), never endorsed', obj('Interpretation', {
    by: str('Fictional source the reading is attributed to', 64),
    text: str('Reading as proposed by that source', 90),
  }, ['by', 'text']), 0, 2),
};

export const SOURCES_DEFAULTS = {
  sources: [
    {id: 'T1', title: 'Text 1 (fictional)', provision: 'Art. 4'},
    {id: 'T2', title: 'Text 2 (fictional)', provision: 'Art. 9'},
  ],
  hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'], placement: [0, 1], caption: 'Order as supplied'},
  passages: [
    {text: 'Each notice of change is delivered in writing to every member.', tension: 'in writing'},
    {text: 'A notice of change may be announced orally at the next meeting.', tension: 'announced orally'},
  ],
  interpretations: [{by: 'Commentary C (fictional)', text: 'Reads Art. 9 as limited to meetings'}],
};

export const SOURCES_DEFAULTS_ES = {
  sources: [
    {id: 'T1', title: 'Texto 1 (ficticio)', provision: 'Art. 4'},
    {id: 'T2', title: 'Texto 2 (ficticio)', provision: 'Art. 9'},
  ],
  hierarchy: {levels: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)'], placement: [0, 1], caption: 'Orden aportado'},
  passages: [
    {text: 'Cada aviso de cambio se entrega por escrito a todos los miembros.', tension: 'por escrito'},
    {text: 'Un aviso de cambio puede anunciarse oralmente en la próxima reunión.', tension: 'anunciarse oralmente'},
  ],
  interpretations: [{by: 'Comentario C (ficticio)', text: 'Lee el Art. 9 como limitado a reuniones'}],
};

/** Long-label stress content shared by the four entries' presets. */
export const SOURCES_LONG = {
  sources: [
    {id: 'T1-a', title: 'Consolidated Illustrative Text on Notices (fictional)', provision: 'Article 4, paragraph 2'},
    {id: 'T2-b', title: 'Second Illustrative Text on Meetings (fictional)', provision: 'Article 9, second sentence'},
  ],
  hierarchy: {levels: ['Level one as supplied by the author', 'Level two as supplied by the author', 'Level three as supplied'], placement: [0, 2], caption: 'Ordering entered by the author, displayed only'},
  passages: [
    {text: 'Each written notice of a change to the internal rules is delivered in writing to every member before it is circulated.', tension: 'delivered in writing to every member'},
    {text: 'A notice of change to the internal rules may instead be announced orally by the chair at the next ordinary meeting.', tension: 'announced orally by the chair at the next'},
  ],
  interpretations: [{by: 'Commentary on the second illustrative text (fictional)', text: 'Reads the second sentence of Article 9 as limited to ordinary meetings only'}],
};

export const KIT_STRINGS = {
  en: {
    conflictFlagged: 'Conflict flagged',
    compatibleApplication: 'Compatible application',
    tensionHighlighted: 'Zone of tension highlighted',
    readingProposed: 'Reading proposed',
    notClassified: 'State not supplied',
    asSupplied: 'as supplied',
    zone: 'Zone of tension',
    hierarchy: 'Editable hierarchy',
    displayedOnly: 'displayed, not applied',
    simulated: 'Simulated wording',
    changedDatum: 'Changed datum',
    before: 'Before',
    after: 'After',
    reader: 'Reader',
    assistant: 'Assistant',
    noPrevail: 'No text is shown to prevail',
  },
  es: {
    conflictFlagged: 'Conflicto señalado',
    compatibleApplication: 'Aplicación compatible',
    tensionHighlighted: 'Zona de tensión resaltada',
    readingProposed: 'Lectura propuesta',
    notClassified: 'Estado no aportado',
    asSupplied: 'según lo aportado',
    zone: 'Zona de tensión',
    hierarchy: 'Jerarquía editable',
    displayedOnly: 'se muestra, no se aplica',
    simulated: 'Redacción simulada',
    changedDatum: 'Dato cambiado',
    before: 'Antes',
    after: 'Después',
    reader: 'Lectora',
    assistant: 'Asistente',
    noPrevail: 'No se muestra que ningún texto prevalezca',
  },
};

/** Kit strings for a context (scene strings merged over built-ins). */
export const kitT = ctx => ({...KIT_STRINGS.en, ...(KIT_STRINGS[ctx.params.locale] || {}), ...ctx.t});

/** Label of a supplied zone state. */
export function stateLabel(ctx, state, withSupplied = true) {
  const t = kitT(ctx);
  const base = state === 'conflict-flagged' ? t.conflictFlagged
    : state === 'compatible-application' ? t.compatibleApplication
      : state === 'reading-proposed' ? t.readingProposed
        : state === 'not-classified' ? t.notClassified
          : t.tensionHighlighted;
  return withSupplied && state !== 'not-classified' && state !== 'tension-highlighted' ? `${base} · ${t.asSupplied}` : base;
}

/** Motif colours (derived from the palette so mono/slate/warm stay coherent). */
export function motifColors(ctx) {
  const th = ctx.theme;
  const mono = ctx.params.palette === 'mono';
  return {
    src: [th.accent2, mono ? '#4a4a4a' : th.cloth[3]],
    flag: th.accent,
    zoneSoft: mono ? '#d9d9d9' : th.accentSoft,
    calm: th.inkSoft,
    hl: th.highlight,
    wood: '#b8895b',
    woodDark: '#7d5a3a',
    groove: '#5f452e',
    slip: '#f6efdf',
    card: '#fbf5e6',
    cardRule: '#d98b7a',
    cardLine: '#c9d6e3',
    metal: '#aab3bb',
    metalDark: '#5b646c',
  };
}

/** Level index clamped to the supplied levels. */
export const levelOf = (hier, i) => Math.min(hier.levels.length - 1, Math.max(0, hier.placement[i] ?? 0));

/* ------------------------------------------------------------------------ */
/* Text helpers                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Split a passage into the wording before the tension phrase, the phrase
 * and the wording after it (case-insensitive). A phrase that does not occur
 * is kept as a separate marked line after the wording.
 */
export function splitPassage(text, phrase) {
  const t = String(text || '').trim();
  const p = String(phrase || '').trim();
  if (!p) return {pre: t, phrase: '', post: '', found: false};
  const i = t.toLowerCase().indexOf(p.toLowerCase());
  if (i < 0) return {pre: t, phrase: p, post: '', found: false};
  return {pre: t.slice(0, i).trim(), phrase: t.slice(i, i + p.length), post: t.slice(i + p.length).trim(), found: true};
}

/** Text lines as named <tspan>s of one <text> element (each line can be driven per frame). */
function lineTexts(fit, o) {
  return h('text', {
    name: o.name, x: o.x, y: r(o.y + fit.size * 0.8),
    'font-family': FONTS[fit.family] || FONTS.sans, 'font-size': r(fit.size), 'font-weight': fit.weight,
    'font-style': o.italic ? 'italic' : undefined, 'text-anchor': o.anchor || 'start', fill: o.fill, opacity: o.opacity,
  }, fit.truncated ? h('title', null, fit.full) : null,
  fit.lines.map((line, i) => h('tspan', {name: o.name ? `${o.name}-${i}` : undefined, x: o.x, dy: i === 0 ? 0 : r(fit.lineHeight)}, line)));
}

/** Bars standing in for text lines when labels are hidden (same geometry). */
function lineBars(ctx, fit, o) {
  const bh = Math.max(3, fit.size * 0.34);
  return fit.lines.map((line, i) => {
    const w = Math.max(fit.size, ctx.measure(line, fit.size, fit.weight, fit.family));
    const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
    return h('rect', {name: o.name ? `${o.name}-${i}` : undefined, x: r(x), y: r(o.y + fit.size * 0.34 + i * fit.lineHeight), width: r(w), height: r(bh), rx: bh / 2, fill: o.fill, opacity: o.opacity ?? 0.55});
  });
}

/** Text block when shown, bars otherwise. */
export function textOrBars(ctx, fit, show, o) {
  return show ? textBlock(fit, o) : lineBars(ctx, fit, o);
}

/**
 * Text block drawn as one <text> per line (tight boxes, so text flowing
 * around an inline phrase never reports a false overlap); bars otherwise.
 */
function linesOrBars(ctx, fit, show, o) {
  if (!show) return lineBars(ctx, fit, o);
  return fit.lines.map((line, i) => textBlock({...fit, lines: [line], height: fit.size}, {...o, y: o.y + i * fit.lineHeight}));
}

/** Fit without breaking words when a smaller size still fits them. */
export function fitWords(ctx, text, o) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const weight = o.weight ?? 600, family = o.family ?? 'sans';
  const minSize = o.minSize ?? o.size * 0.72;
  let size = o.size;
  const longest = sz => Math.max(0, ...words.map(wd => ctx.measure(wd, sz, weight, family)));
  while (size > minSize && longest(size) > o.maxWidth) size = Math.max(minSize, size * 0.95);
  return ctx.fit(text, {...o, size, minSize: Math.min(size, minSize)});
}

/** Filler text bars (simulated body text) in a box. */
function fillerBars(ctx, {x, y, w, h: hh, bar, gap, key, color, indentFirst = true, lastShort = true}) {
  const out = [];
  const n = Math.max(0, Math.floor((hh + gap - bar) / (bar + gap)) + (hh >= bar ? 1 : 0));
  for (let i = 0; i < n; i++) {
    const yy = y + i * (bar + gap);
    if (yy + bar > y + hh + 0.5) break;
    const k = ctx.rng(key, i);
    const last = lastShort && (i === n - 1 || k > 0.86);
    const ind = indentFirst && i === 0 ? w * 0.08 : 0;
    const bw = (w - ind) * (last ? 0.35 + k * 0.3 : 0.9 + k * 0.1);
    out.push(h('rect', {x: r(x + ind), y: r(yy), width: r(bw), height: r(bar), rx: bar / 2, fill: color}));
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* Passage block                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Same line count and size as `fit`, at the narrowest width that keeps them:
 * avoids a lone orphan word on the last line.
 */
export function balanceFit(ctx, text, fit, o) {
  if (!fit || fit.lines.length < 2 || fit.truncated) return fit;
  let lo = o.maxWidth * 0.45, hi = o.maxWidth, best = fit;
  for (let k = 0; k < 12; k++) {
    const mid = (lo + hi) / 2;
    const f = ctx.fit(text, {...o, maxWidth: mid, size: fit.size, minSize: fit.size});
    if (!f.truncated && f.lines.length === fit.lines.length && Math.abs(f.size - fit.size) < 0.01) { best = f; hi = mid; } else lo = mid;
  }
  return best;
}

/** Greedy word flow whose first line starts at x0 (remaining width W - x0) and later lines at 0. */
function flowLines(ctx, text, {x0, W, size, weight, family}) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '', x = x0;
  for (const wd of words) {
    const cand = cur ? `${cur} ${wd}` : wd;
    if (ctx.measure(cand, size, weight, family) <= W - x || (!cur && x === 0)) cur = cand;
    else {
      lines.push({text: cur, x});
      cur = wd;
      x = 0;
    }
  }
  if (cur) lines.push({text: cur, x});
  // a first line with no word in it means the flow starts on the next line
  return lines.filter(l => l.text);
}

/**
 * Provision passage with the tension phrase highlighted IN the running text.
 * When the phrase is fixed (no alternative wording, ring or written slot) it
 * flows inline: it follows the wording before it on the same line
 * (`inlineBefore`) and the wording after it continues on the phrase's line
 * (`inlineAfter`). A variable slot (paired / substituted wording) keeps the
 * phrase on its own line, aligned with the text column, with the wording
 * before it balanced (no orphan word). Local origin = top-left of the text
 * column. Named nodes: `${P}-hl` (highlight), `${P}-ul`, `${P}-ph-i`
 * (phrase lines), `${P}-alt-i` (alternative phrase lines), `${P}-ghost`,
 * `${P}-ring`.
 * @param {any} ctx
 * @param {{prefix:string, text:string, phrase:string, alt?:string|null, w:number, size:number, family?:'serif'|'sans', maxPre?:number, maxPost?:number, showText?:boolean, color?:string, slotMin?:number, inlineBefore?:boolean, inlineAfter?:boolean}} o
 */
export function passageBlock(ctx, o) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const P = o.prefix;
  const size = o.size;
  const fam = o.family ?? 'serif';
  const show = o.showText ?? ctx.show('all');
  // `showSlot`: the phrase slot may be legible while the rest of the wording is drawn as bars
  const showPh = o.showSlot === undefined ? show : (o.showSlot && ctx.show('all'));
  const ink = o.color ?? th.ink;
  const parts = splitPassage(o.text, o.phrase);
  // slotText: the slot is located by the supplied phrase but shows another wording (paired scenes)
  if (o.slotText != null) parts.phrase = o.slotText;
  const W = o.w;
  const hlPad = size * 0.24;
  const padY = size * 0.2;
  const spaceW = size * 0.32;
  const preOpts = {maxWidth: W, size, minSize: size * 0.8, maxLines: o.maxPre ?? 3, weight: 400, family: fam};
  const postOpts = {maxWidth: W, size, minSize: size * 0.8, maxLines: o.maxPost ?? 2, weight: 400, family: fam};
  // `slotLines`: a slot that is the one legible text on its page may wrap to more lines instead of shrinking
  const phFit = t => fitWords(ctx, t || '', {maxWidth: W - hlPad * 2, size, minSize: size * (o.slotLines ? 0.95 : 0.78), maxLines: o.slotLines ?? 3, weight: 700, family: fam});
  const ph = phFit(parts.phrase);
  const alt = o.alt != null ? phFit(o.alt) : null;
  const also = (o.slotAlso || []).map(t => phFit(t));
  const slotLines = Math.max(ph.lines.length, alt ? alt.lines.length : 1, o.slotMin ?? 1, ...also.map(f => f.lines.length));
  const variable = Boolean(alt || also.length || o.ring || o.slotText != null || !parts.found);
  const single = slotLines === 1;
  const flowBefore = (o.inlineBefore ?? true) && single && !variable;
  const flowAfter = (o.inlineAfter ?? true) && single && !variable;

  // --- wording before the phrase
  let pre = parts.pre ? fitWords(ctx, parts.pre, preOpts) : null;
  let inlinePre = false;
  if (pre && flowBefore) {
    const lastW = ctx.measure(pre.lines[pre.lines.length - 1], pre.size, pre.weight, pre.family);
    inlinePre = Math.abs(pre.size - ph.size) < 0.6 && lastW + spaceW + hlPad + ph.width <= W;
    if (inlinePre) pre = {...pre, lastW};
  }
  if (pre && !inlinePre) pre = balanceFit(ctx, parts.pre, pre, {...preOpts, size: pre.size});

  // --- the phrase slot
  let phX, phTop;
  if (inlinePre) {
    phTop = (pre.lines.length - 1) * pre.lineHeight;
    phX = pre.lastW + spaceW;
  } else {
    phTop = (pre ? pre.height + size * 0.28 : 0) + padY;
    phX = 0;
  }
  const slotY = phTop - padY;
  const slotH = ph.lineHeight * (slotLines - 1) + ph.size + padY * 2;
  const phW = ph.width + hlPad * 2;
  const altW = alt ? alt.width + hlPad * 2 : phW;
  const slotW = Math.max(phW, altW, ...also.map(f => f.width + hlPad * 2));
  const nodes = [];
  // a fixed phrase is set IN the running text: pre, phrase and post are tspans of one <text>
  const combine = show && !variable && single;
  const runs = [];
  if (pre && combine) pre.lines.forEach((line, i) => runs.push({text: line, x: 0, y: i * pre.lineHeight, size: pre.size, weight: 400}));
  else if (pre) nodes.push(textOrBars(ctx, pre, show, {x: 0, y: 0, fill: ink}));
  const hx = phX - hlPad;
  nodes.push(h('rect', {name: `${P}-ghost`, x: r(hx), y: r(slotY), width: r(variable ? W + hlPad * 2 : slotW), height: r(slotH), rx: 5, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '7 6', opacity: 0}));
  nodes.push(h('rect', {name: `${P}-hl`, x: r(hx), y: r(slotY), width: 0, height: r(slotH), rx: 5, fill: C.hl, opacity: 0.95}));
  // underline mark of the highlighter's edge (reads as "marked" with labels hidden)
  nodes.push(h('rect', {name: `${P}-ul`, x: r(hx), y: r(slotY + slotH - 4), width: 0, height: 4, rx: 2, fill: shade(C.hl, -0.35)}));
  let ringBox = null;
  const badgeR = size * 0.85;
  if (o.ring) {
    // the ring spans the phrase line of the column; its letter badge sits past the column's right edge
    const rg = {x: hx - 6, y: slotY - padY * 0.8, w: W + hlPad * 2 + 12, h: slotH + padY * 1.6};
    ringBox = rg;
    const rc = o.ring.color || th.accent;
    // `ring.side: 'left'` puts the letter badge on the ring's left end (default: right end)
    const bx = o.ring.side === 'left' ? rg.x - badgeR * 0.55 : rg.x + rg.w + badgeR * 0.55;
    nodes.push(g({name: `${P}-ring`, opacity: 0},
      h('path', {d: roundRectPath(rg.x, rg.y, rg.w, rg.h, 10), fill: 'none', stroke: rc, 'stroke-width': 4.5}),
      // `ring.badge: {color, soft}` (opt-in): a lane-coloured letter badge (tinted disc, coloured
      // inner ring, ink letter) instead of a disc in the ring colour
      ...(o.ring.badge ? [
        h('circle', {cx: bx, cy: rg.y + rg.h / 2, r: badgeR, fill: o.ring.badge.soft, stroke: th.ink, 'stroke-width': 2}),
        h('circle', {cx: bx, cy: rg.y + rg.h / 2, r: r(badgeR * 0.8), fill: 'none', stroke: o.ring.badge.color, 'stroke-width': r(badgeR * 0.24, 2)}),
        ctx.show('key') ? h('text', {x: r(bx), y: r(rg.y + rg.h / 2 + size * 0.34), 'text-anchor': 'middle', 'font-size': r(size * 0.92), 'font-weight': 800, 'font-family': FONTS.sans, fill: th.ink}, o.ring.letter) : null,
      ] : [
        h('circle', {cx: bx, cy: rg.y + rg.h / 2, r: badgeR, fill: rc, stroke: th.ink, 'stroke-width': 2}),
        ctx.show('key') ? h('text', {x: r(bx), y: r(rg.y + rg.h / 2 + size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.ring.letter) : null,
      ])));
  }
  if (combine) ph.lines.forEach((line, i) => runs.push({text: line, x: phX, y: phTop + i * ph.lineHeight, size: ph.size, weight: 700, name: `${P}-ph-${i}`}));
  else if (showPh) {
    nodes.push(lineTexts(ph, {x: r(phX), y: phTop, fill: ink, name: `${P}-ph`}));
    if (alt) nodes.push(lineTexts(alt, {x: r(phX), y: phTop, fill: ink, name: `${P}-alt`, opacity: 0}));
  } else {
    nodes.push(lineBars(ctx, ph, {x: r(phX), y: phTop, fill: ink, name: `${P}-ph`, opacity: 0.8}));
    if (alt) nodes.push(lineBars(ctx, alt, {x: r(phX), y: phTop, fill: ink, name: `${P}-alt`, opacity: 0}));
  }

  // --- wording after the phrase
  let bottom = slotY + slotH;
  if (parts.post) {
    let flowed = null;
    if (flowAfter) {
      const psize = ph.size;
      const lines = flowLines(ctx, parts.post, {x0: phX + ph.width + spaceW, W, size: psize, weight: 400, family: fam});
      const maxL = (o.maxPost ?? 2) + (lines[0] && lines[0].x > 0 ? 1 : 0);
      if (lines.length <= maxL && lines.every(l => ctx.measure(l.text, psize, 400, fam) <= W - l.x + 0.5)) {
        const lh = psize * 1.18;
        let y = phTop, onPhrase = true;
        flowed = lines.map((l, i) => {
          if (!(i === 0 && l.x > 0)) {
            y += onPhrase ? slotH - padY + size * 0.12 : lh;
            onPhrase = false;
          }
          return {...l, y};
        });
        if (combine) flowed.forEach(l => runs.push({text: l.text, x: l.x, y: l.y, size: psize, weight: 400}));
        else nodes.push(show
          ? flowed.map(l => h('text', {x: r(l.x), y: r(l.y + psize * 0.8), 'font-family': FONTS[fam] || FONTS.sans, 'font-size': r(psize), 'font-weight': 400, fill: ink}, l.text))
          : flowed.map(l => h('rect', {x: r(l.x), y: r(l.y + psize * 0.34), width: r(Math.max(psize, ctx.measure(l.text, psize, 400, fam))), height: r(Math.max(3, psize * 0.34)), rx: Math.max(3, psize * 0.34) / 2, fill: ink, opacity: 0.55})));
        const last = flowed[flowed.length - 1];
        bottom = Math.max(bottom, last.y + psize);
      }
    }
    if (!flowed) {
      const post = balanceFit(ctx, parts.post, fitWords(ctx, parts.post, postOpts), postOpts);
      const y = slotY + slotH + size * 0.28;
      if (combine) post.lines.forEach((line, i) => runs.push({text: line, x: 0, y: y + i * post.lineHeight, size: post.size, weight: 400}));
      else nodes.push(textOrBars(ctx, post, show, {x: 0, y, fill: ink}));
      bottom = y + post.height;
    }
  }
  if (combine) {
    // the base font-size on <text> matches the runs (each tspan still sets its own size)
    nodes.push(h('text', {name: `${P}-ph`, 'font-family': FONTS[fam] || FONTS.sans, 'font-size': r(size), fill: ink},
      runs.map(q => h('tspan', {name: q.name, x: r(q.x), y: r(q.y + q.size * 0.8), 'font-size': r(q.size), 'font-weight': q.weight}, q.text))));
  }
  const y = bottom;
  const phraseBox = {x: hx, y: slotY, w: phW, h: slotH};
  const altBox = {x: hx, y: slotY, w: altW, h: slotH};
  const lineChars = ph.lines.map(l => l.length);
  const totalChars = lineChars.reduce((a, b) => a + b, 0) || 1;

  /**
   * @param {{hl?:number, write?:number, swap?:number, ghost?:number, ring?:number}} s
   *   hl: highlight sweep 0..1; write: typewriter reveal of the phrase 0..1
   *   (1 = complete); swap: before → alternative phrase 0..1; ghost: empty
   *   slot outline opacity.
   */
  function frame(s) {
    const out = {};
    const hl = clamp(s.hl ?? 0);
    const sw = clamp(s.swap ?? 0);
    const wr = clamp(s.write ?? 1);
    const fullW = lerp(phW, altW, ease.inOutCubic(sw));
    const wHl = fullW * ease.inOutSine(hl) * (s.write !== undefined ? Math.min(1, 0.15 + wr) : 1);
    out[`${P}-hl`] = {width: r(wHl)};
    out[`${P}-ul`] = {width: r(wHl)};
    out[`${P}-ghost`] = {opacity: r(clamp(s.ghost ?? 0), 3)};
    if (o.ring) out[`${P}-ring`] = {opacity: r(clamp(s.ring ?? 0), 3)};
    // phrase lines: typewriter, then lift-and-fade when swapped out
    const outP = clamp(sw * 2), inP = clamp(sw * 2 - 1);
    let left = Math.round(totalChars * wr);
    const lift = outP > 0 ? `translate(0 ${r(-size * 0.6 * outP)})` : '';
    if (showPh) out[`${P}-ph`] = {opacity: r((wr > 0 ? 1 : 0) * (1 - outP), 3), transform: lift};
    ph.lines.forEach((line, i) => {
      let n = Math.max(0, Math.min(line.length, left));
      left -= line.length;
      // `wordReveal`: the typewriter shows whole words only (no word fragments on screen)
      if (o.wordReveal && n < line.length) n = Math.max(0, line.lastIndexOf(' ', n));
      if (showPh && s.write !== undefined) out[`${P}-ph-${i}`] = {text: line.slice(0, n)};
      else out[`${P}-ph-${i}`] = {opacity: r((n > 0 ? 0.8 : 0) * (1 - outP), 3), transform: lift, width: r(Math.max(0, ctx.measure(line.slice(0, n), ph.size, ph.weight, ph.family)))};
    });
    if (alt) {
      const rise = inP < 1 ? `translate(0 ${r(size * 0.6 * (1 - inP))})` : '';
      if (showPh) out[`${P}-alt`] = {opacity: r(inP, 3), transform: rise};
      else alt.lines.forEach((_, i) => { out[`${P}-alt-${i}`] = {opacity: r(inP * 0.8, 3), transform: rise}; });
    }
    return out;
  }
  return {node: g(null, nodes), h: y, w: W, slotY, slotH, phraseBox, altBox, ringBox, badgeR, badgeX: ringBox ? (o.ring.side === 'left' ? ringBox.x - badgeR * 0.55 : ringBox.x + ringBox.w + badgeR * 0.55) : null, phFit: ph, altFit: alt, found: parts.found, inline: inlinePre, frame, P};
}

/* ------------------------------------------------------------------------ */
/* Objects                                                                   */
/* ------------------------------------------------------------------------ */

/** Page outline (top-down, slight curl at the gutter). s = -1 left, 1 right. */
function pageD(s, pw, top, bot) {
  return `M0 ${r(top + 7)}Q${r(s * pw * 0.45)} ${r(top - 5)} ${r(s * pw)} ${r(top)}V${r(bot)}Q${r(s * pw * 0.45)} ${r(bot + 5)} 0 ${r(bot - 3)}Z`;
}

/**
 * Open book, top-down. Local origin = centre of the gutter; the right page
 * spans x ∈ [0, pw], y ∈ [-ph/2, ph/2]. The provision passage sits on the
 * right page at `passageAt` (0 = top of the text area, 1 = bottom).
 * @param {any} ctx
 * @param {{prefix:string, pw:number, ph:number, color:string, src:{id:string,title:string,provision:string}, passage:{text:string,tension:string}, alt?:string|null, passageAt?:number, size?:number, seedKey?:string}} o
 */
export function openBook(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {pw, ph} = o;
  const top = -ph / 2, bot = ph / 2;
  const col = o.color;
  const showText = ctx.show('all');
  const showKey = ctx.show('key');
  const m = pw * 0.1;
  const inner = pw - m * 2;
  const seed = o.seedKey || 'cet-book';
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
  const titleFit = fitWords(ctx, o.src.title, {maxWidth: inner, size: size * 1.28, minSize: size * 0.82, maxLines: 4, weight: 700, family: 'serif'});
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
  const pass = passageBlock(ctx, {prefix: `${P}-pa`, text: o.passage.text, phrase: o.passage.tension, alt: o.alt ?? null, w: inner, size: o.passSize ?? size, family: 'serif', maxPre: o.maxPre ?? 3, maxPost: o.maxPost ?? 2, slotText: o.slotText, slotAlso: o.slotAlso, ring: o.ring, showText: o.quiet ? false : undefined, showSlot: o.showSlot, inlineAfter: false});
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
  const ribbon = h('path', {d: `M8 ${r(bot - ph * 0.3)}H24V${r(bot + 44)}L16 ${r(bot + 34)}L8 ${r(bot + 44)}Z`, fill: rib, stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'});

  const node = g({name: P}, parts, tabNode, ribbon);
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
    outer: {x: -pw - 14, y: top - 12, w: pw * 2 + 28, h: ph + 24},
    toLocal,
    frame: s => pass.frame(s),
  };
}

/**
 * Printed article sheet (the second text). Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, color:string, src:{id:string,title:string,provision:string}, passage:{text:string,tension:string}, phrase?:string, alt?:string|null, passageAt?:number, size?:number, seedKey?:string, slotMin?:number}} o
 */
export function articleSheet(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const col = o.color;
  const showText = ctx.show('all');
  const showKey = ctx.show('key');
  const pad = w * 0.09;
  const inner = w - pad * 2;
  const size = o.size ?? Math.max(16, w * 0.072);
  const bar = Math.max(4, size * 0.3);
  const gap = size * 0.62;
  const seed = o.seedKey || 'cet-article';
  // `titleLines` (opt-in): the title keeps its size on up to that many lines and the band grows to fit
  const titleFit = o.titleLines
    ? fitWords(ctx, o.src.title, {maxWidth: inner, size: size * 1.05, minSize: size, maxLines: o.titleLines, weight: 700})
    : fitWords(ctx, o.src.title, {maxWidth: inner, size: size * 1.05, minSize: size * 0.72, maxLines: 2, weight: 700});
  const band = o.titleLines ? Math.max(size * 2.4, hh * 0.12, titleFit.height + 20) : Math.max(size * 2.4, hh * 0.12);
  const fold = w * 0.1;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(8, 11, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: `M0 5Q0 0 5 0H${r(w - 5)}Q${w} 0 ${w} 5V${r(hh - fold)}L${r(w - fold)} ${hh}H5Q0 ${hh} 0 ${r(hh - 5)}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${w} ${r(hh - fold)}L${r(w - fold * 0.86)} ${r(hh - fold * 0.86)}Q${r(w - fold)} ${r(hh - fold)} ${r(w - fold)} ${r(hh - fold * 0.8)}V${hh}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}));
  // header band
  parts.push(h('path', {d: `M0 5Q0 0 5 0H${r(w - 5)}Q${w} 0 ${w} 5V${r(band)}H0Z`, fill: col, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('rect', {x: 0, y: r(band - 5), width: w, height: 5, fill: shade(col, -0.25)}));
  parts.push(textOrBars(ctx, titleFit, showKey && !o.titleBars, {x: pad, y: (band - 5 - titleFit.height) / 2, fill: '#fff', name: `${P}-title`}));
  // meta line (author / date placeholders) and page number
  let y = band + size * 0.7;
  parts.push(h('rect', {x: pad, y: r(y), width: r(inner * 0.34), height: r(bar), rx: bar / 2, fill: th.inkSoft, opacity: 0.45}));
  parts.push(h('rect', {x: r(pad + inner * 0.4), y: r(y), width: r(inner * 0.2), height: r(bar), rx: bar / 2, fill: th.paperLine}));
  y += bar + size * 0.7;
  parts.push(h('line', {x1: pad, x2: w - pad, y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 1.6}));
  const areaTop = y + size * 0.6;
  const areaBot = hh - pad * 1.2;
  const pass = passageBlock(ctx, {prefix: `${P}-pa`, text: o.passage.text, phrase: o.passage.tension, alt: o.alt ?? null, w: inner, size: o.passSize ?? size, family: 'serif', maxPre: o.maxPre ?? 3, maxPost: o.maxPost ?? 2, slotMin: o.slotMin, slotAlso: o.slotAlso, slotText: o.slotText, ring: o.ring, showText: o.quiet ? false : undefined, showSlot: o.showSlot, slotLines: o.slotLines, wordReveal: o.wordReveal, inlineBefore: false});
  const provFit = fitWords(ctx, `§ ${o.src.provision}`, {maxWidth: inner, size: size * 1.12, minSize: size * 0.85, maxLines: 2, weight: 700, family: 'serif'});
  const headH = provFit.height + size * 0.45;
  const blockH = headH + pass.h;
  const pAt = clamp(o.passageAt ?? 0);
  const provY = areaTop + Math.max(0, (areaBot - areaTop - blockH) * pAt);
  const passY = provY + headH;
  if (provY - areaTop > bar * 2) parts.push(fillerBars(ctx, {x: pad, y: areaTop, w: inner, h: provY - areaTop - gap, bar, gap, key: `${seed}-A`, color: th.paperLine}));
  parts.push(textOrBars(ctx, provFit, showText && !o.quiet, {x: pad, y: provY, fill: th.ink, name: o.provName ? `${P}-prov` : undefined}));
  parts.push(g({transform: T(pad, passY)}, pass.node));
  // body in two columns below the passage
  const bodyY = passY + pass.h + gap * 1.2;
  const colW = (inner - pad * 0.6) / 2;
  if (areaBot - bodyY > bar) {
    parts.push(fillerBars(ctx, {x: pad, y: bodyY, w: colW, h: areaBot - bodyY, bar, gap, key: `${seed}-c1`, color: th.paperLine}));
    parts.push(fillerBars(ctx, {x: pad + colW + pad * 0.6, y: bodyY, w: colW * 0.92, h: areaBot - bodyY - fold * 0.8, bar, gap, key: `${seed}-c2`, color: th.paperLine, indentFirst: false}));
  }
  // staple
  parts.push(h('path', {d: `M${r(pad * 0.45)} ${r(band + 6)}l${r(pad * 0.7)} ${r(-pad * 0.5)}`, stroke: '#7c858d', 'stroke-width': 4, 'stroke-linecap': 'round'}));
  // index tab with the source id (top edge, left of centre)
  // `idMin`: floor for the id size on the tab (legible on a phone at small scene scales)
  const idSz = Math.min(34, Math.max(size * 0.95, o.idMin ?? 0));
  const tabW = Math.max(58, Math.min(Math.max(inner * 0.5, ctx.measure(o.src.id, idSz, 800, 'sans') + 28), ctx.measure(o.src.id, idSz, 800, 'sans') + 28));
  const tab = {x: pad + inner * 0.18, y: -40, w: tabW, h: 46};
  const idFit = ctx.fit(o.src.id, {maxWidth: tabW - 14, size: idSz, minSize: 12, maxLines: 1, weight: 800});
  const tabNode = g(null,
    h('path', {d: `M${r(tab.x)} 4V${r(tab.y + 8)}Q${r(tab.x)} ${r(tab.y)} ${r(tab.x + 8)} ${r(tab.y)}H${r(tab.x + tab.w - 8)}Q${r(tab.x + tab.w)} ${r(tab.y)} ${r(tab.x + tab.w)} ${r(tab.y + 8)}V4Z`, fill: shade(col, -0.1), stroke: th.ink, 'stroke-width': 2}),
    showKey ? textBlock(idFit, {x: tab.x + tab.w / 2, y: tab.y + Math.max(2, (36 - idFit.size) / 2), anchor: 'middle', fill: '#fff'}) : h('rect', {x: tab.x + tab.w * 0.3, y: tab.y + 12, width: tab.w * 0.4, height: 7, rx: 3.5, fill: '#fff', opacity: 0.8}),
  );
  const node = g({name: P}, tabNode, parts);
  const pb = pass.phraseBox;
  return {
    node, w, h: hh,
    pass,
    passOrigin: {x: pad, y: passY},
    phraseBox: {x: pad + pb.x, y: passY + pb.y, w: pb.w, h: pb.h},
    altBox: {x: pad + pass.altBox.x, y: passY + pass.altBox.y, w: pass.altBox.w, h: pass.altBox.h},
    textBox: {x: pad, y: passY, w: inner, h: pass.h},
    provBox: {x: pad, y: provY, w: provFit.width, h: provFit.height},
    tab,
    bounds: {x: 0, y: -40, w: w + 8, h: hh + 51},
    pad,
    frame: s => pass.frame(s),
  };
}

/**
 * Editable hierarchy board (top-down). Rows are grooves with slide-in level
 * cards carrying the user-supplied labels; each text has a coloured token
 * seated in the row supplied for it. Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, hier:{levels:string[], placement:number[], caption?:string}, ids:string[], colors:string[], header:string, rowH?:number, size?:number}} o
 */
export function hierarchyBoard(ctx, o) {
  const th = ctx.theme;
  const C = motifColors(ctx);
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
  const tokH = size * 1.9 * ts;
  const perRow = Math.max(1, ...levels.map((_, lv) => o.ids.filter((_, k) => levelOf(o.hier, k) === lv).length));
  const slipW = w - pad * 2 - 16 - tokW * perRow - 8 * (perRow - 1) - 22;
  const labFits = levels.map(l => fitWords(ctx, l, {maxWidth: slipW - 26, size: size * 0.92, minSize: size * 0.68, maxLines: 2, weight: 600}));
  // `fitRows` (opt-in): every row is tall enough for its wrapped level card (card = row - 24, 4 px air)
  const rowH = o.rowH ?? (o.fitRows ? Math.max(tokH + 16, ...labFits.map(f => f.height + 32)) : Math.max(tokH + 16, ...labFits.map(f => f.height + 26 * ts)));
  const headFit = fitWords(ctx, o.header, {maxWidth: w - pad * 2 - 44, size: size * 1.02, minSize: size * 0.7, maxLines: 2, weight: 700});
  const headH = headFit.height + 26;
  const capFit = o.hier.caption ? fitWords(ctx, o.hier.caption, {maxWidth: w - pad * 2, size: size * 0.9, minSize: size * 0.7, maxLines: 2, weight: 500}) : null;
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

/**
 * Hand lens. Local origin = lens centre; the handle extends at `angle`
 * degrees. `grip` is the handle point held by a hand (local coords).
 */
export function lupa(ctx, {name, R, handleLen, angle}) {
  const th = ctx.theme;
  const HL = handleLen ?? R * 1.7;
  const rim = '#3b3f45';
  const gd = R + HL * 0.66;
  const a = rad(angle);
  const node = g({name},
    h('ellipse', {name: `${name}-shadow`, cx: 10, cy: 14, rx: R + 10, ry: R + 8, fill: th.shadow}),
    g({transform: `rotate(${r(angle)})`},
      h('rect', {x: R * 0.96, y: -R * 0.13, width: HL * 0.28, height: R * 0.26, rx: 3, fill: '#c3cbd2', stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: R * 0.96 + HL * 0.26, y: -R * 0.19, width: HL * 0.78, height: R * 0.38, rx: R * 0.19, fill: '#40332a', stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: R * 0.96 + HL * 0.3, y: -R * 0.13, width: HL * 0.66, height: R * 0.08, rx: R * 0.04, fill: '#fff', opacity: 0.18})),
    h('circle', {r: R, fill: '#dcebf6', 'fill-opacity': 0.14}),
    h('circle', {r: R, fill: 'none', stroke: rim, 'stroke-width': R * 0.15}),
    h('circle', {r: R + R * 0.08, fill: 'none', stroke: th.ink, 'stroke-width': 2}),
    h('circle', {r: R - R * 0.08, fill: 'none', stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: `M${r(-R * 0.84)} ${r(-R * 0.4)}A${r(R * 0.93)} ${r(R * 0.93)} 0 0 1 ${r(-R * 0.4)} ${r(-R * 0.84)}`, fill: 'none', stroke: '#fff', 'stroke-width': Math.max(2.5, R * 0.045), 'stroke-linecap': 'round', opacity: 0.5}),
  );
  return {node, R, grip: {x: Math.cos(a) * gd, y: Math.sin(a) * gd}, gripDist: gd, angle};
}

/**
 * Real magnified view inside a circular lens: `content` is drawn in the SAME
 * coordinates as the scene and scaled by `k` about the lens centre. Named
 * nodes: `${name}` (position + visibility) and `${name}-inner` (scale).
 */
export function lensView(ctx, {name, R, content, k = 1.8}) {
  const th = ctx.theme;
  const clip = `${name}-clip`;
  const node = g({name, opacity: 0},
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('circle', {r: R}))),
    g({'clip-path': ctx.ref(clip)},
      h('circle', {r: R + 2, fill: th.woodTop}),
      g({name: `${name}-inner`}, content)),
  );
  /** @param {{x:number,y:number}} c lens centre (scene coords) @param {number} on visibility */
  const frame = (c, on = 1) => ({
    [name]: {transform: T(c.x, c.y), opacity: on ? 1 : 0},
    [`${name}-inner`]: {transform: `scale(${r(k, 4)}) translate(${r(-c.x)} ${r(-c.y)})`},
  });
  return {node, frame, k};
}

/** Pennant pin (conflict flagged). Local origin = the pin point; grip on the pole. */
export function flagPin(ctx, {name, color, s = 1}) {
  const th = ctx.theme;
  const pole = 58 * s;
  return {
    grip: {x: 0, y: -pole * 0.55},
    node: g({name},
      h('ellipse', {name: `${name}-shadow`, cx: 8 * s, cy: 5 * s, rx: 14 * s, ry: 6 * s, fill: th.shadow}),
      h('line', {x1: 0, y1: 0, x2: 0, y2: -pole, stroke: '#4a4f55', 'stroke-width': 4 * s, 'stroke-linecap': 'round'}),
      h('path', {d: `M0 ${r(-pole)}L${r(38 * s)} ${r(-pole + 13 * s)}L0 ${r(-pole + 27 * s)}Z`, fill: color, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      // exclamation glyph drawn as shapes (not text)
      h('rect', {x: 9 * s, y: -pole + 7 * s, width: 5 * s, height: 10 * s, rx: 2 * s, fill: '#fff'}),
      h('circle', {cx: 11.5 * s, cy: -pole + 21 * s, r: 2.8 * s, fill: '#fff'}),
      h('circle', {cy: -pole, r: 6 * s, fill: shade(color, -0.2), stroke: th.ink, 'stroke-width': 2}),
      h('circle', {r: 4.5 * s, fill: '#2b2f33'}),
    ),
  };
}

/** Paper clip lying flat (compatible application). Local origin = centre, long axis along x. */
export function linkClip(ctx, {name, len = 96, vertical = false}) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const L = len, H = len * 0.3;
  const d = `M${r(-L * 0.36)} ${r(H * 0.2)}H${r(L * 0.34)}A${r(H * 0.3)} ${r(H * 0.3)} 0 0 0 ${r(L * 0.34)} ${r(-H * 0.4)}H${r(-L * 0.42)}A${r(H * 0.5)} ${r(H * 0.5)} 0 0 0 ${r(-L * 0.42)} ${r(H * 0.6)}H${r(L * 0.44)}`;
  // vertical: the clip lies along the seam between the two texts (it never covers their wording)
  return {
    grip: vertical ? {x: H * 0.1, y: -L * 0.42} : {x: L * 0.42, y: H * 0.1},
    node: g({name}, vertical ? g({transform: 'rotate(-90)'},
      h('path', {d, transform: 'translate(-7 5)', fill: 'none', stroke: th.shadow, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d, fill: 'none', stroke: C.metalDark, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d, fill: 'none', stroke: C.metal, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    ) : null, vertical ? null : [
      h('path', {d, transform: 'translate(5 7)', fill: 'none', stroke: th.shadow, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d, fill: 'none', stroke: C.metalDark, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d, fill: 'none', stroke: C.metal, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    ]),
  };
}

/**
 * Pin tray (top-down) holding spare pennant pins and paper clips: an open
 * shallow tray whose flag sticks and clips are visible. Local origin =
 * centre (where the hand picks the marker up).
 */
export function markerCup(ctx, {name, R = 46, flagColor}) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const w = R * 2.5, hh = R * 1.6;
  const tray = '#e6ded0', inner = '#d3c8b6';
  const pin = (x, y, deg, s) => g({transform: T(x, y, deg)},
    h('line', {x1: 0, y1: 0, x2: 0, y2: -44 * s, stroke: '#4a4f55', 'stroke-width': 3.2 * s, 'stroke-linecap': 'round'}),
    h('path', {d: `M0 ${r(-44 * s)}L${r(26 * s)} ${r(-35 * s)}L0 ${r(-26 * s)}Z`, fill: flagColor, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
    h('circle', {cy: -44 * s, r: 4 * s, fill: shade(flagColor, -0.2), stroke: th.ink, 'stroke-width': 1.4}),
    h('circle', {r: 3.2 * s, fill: '#2b2f33'}));
  const cl = R * 0.62;
  const clipD = `M${r(-cl * 0.36)} ${r(cl * 0.06)}H${r(cl * 0.34)}A${r(cl * 0.09)} ${r(cl * 0.09)} 0 0 0 ${r(cl * 0.34)} ${r(-cl * 0.12)}H${r(-cl * 0.42)}A${r(cl * 0.15)} ${r(cl * 0.15)} 0 0 0 ${r(-cl * 0.42)} ${r(cl * 0.18)}H${r(cl * 0.44)}`;
  const s = R / 46;
  return g({name},
    h('path', {d: roundRectPath(-w / 2 + 7, -hh / 2 + 10, w, hh, hh * 0.3), fill: th.shadow}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, hh * 0.3), fill: tray, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(-w / 2 + 8, -hh / 2 + 8, w - 16, hh - 16, hh * 0.22), fill: inner, stroke: shade(inner, -0.25), 'stroke-width': 1.5}),
    h('rect', {x: -w / 2 + 12, y: -hh / 2 + 10, width: w - 24, height: 5, rx: 2.5, fill: '#000', opacity: 0.12}),
    // spare pennant pins lying in the tray, a spare clip beside them
    pin(-w * 0.3, hh * 0.28, 62, s),
    pin(-w * 0.18, hh * 0.3, 78, s),
    g({transform: T(w * 0.22, hh * 0.08, -18)},
      h('path', {d: clipD, fill: 'none', stroke: C.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d: clipD, fill: 'none', stroke: C.metal, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})),
  );
}

/**
 * Index card with an attributed reading ("reading proposed"). Local origin
 * = top-left. Returns its height.
 */
export function readingCard(ctx, {prefix, w, interp, size = 22, heading, roomy = false}) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const show = ctx.show('all');
  const pad = size * 0.7;
  // `roomy` (opt-in): long readings wrap to more lines instead of shrinking
  const headFit = fitWords(ctx, heading, {maxWidth: w - pad * 2, size: size * 0.92, minSize: size * 0.8, maxLines: roomy ? 3 : 2, weight: 800});
  const byFit = fitWords(ctx, `— ${interp.by}`, {maxWidth: w - pad * 2, size: size * (roomy ? 0.95 : 0.86), minSize: size * (roomy ? 0.9 : 0.75), maxLines: roomy ? 3 : 2, weight: 600});
  const txFit = fitWords(ctx, `“${interp.text}”`, {maxWidth: w - pad * 2, size, minSize: size * (roomy ? 0.92 : 0.72), maxLines: roomy ? 7 : 4, weight: 400, family: 'serif'});
  let y = pad * 0.8;
  const nodes = [];
  nodes.push(textOrBars(ctx, headFit, show, {x: pad, y, fill: shade(C.cardRule, -0.35)}));
  y += headFit.height + size * 0.42;
  const ruleY = y;
  y += size * 0.35;
  nodes.push(textOrBars(ctx, txFit, show, {x: pad, y, fill: th.ink, italic: true}));
  y += txFit.height + size * 0.35;
  nodes.push(textOrBars(ctx, byFit, show, {x: w - pad, y, anchor: 'end', fill: th.inkSoft}));
  y += byFit.height + pad * 0.8;
  const hh = y;
  const lines = [];
  for (let ly = ruleY + size * 1.2; ly < hh - 6; ly += size * 1.2) lines.push(h('line', {x1: 6, x2: w - 6, y1: r(ly), y2: r(ly), stroke: C.cardLine, 'stroke-width': 1.2}));
  const node = g({name: prefix},
    h('path', {d: roundRectPath(7, 9, w, hh, 5), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 5), fill: C.card, stroke: th.ink, 'stroke-width': 2}),
    lines,
    h('line', {x1: 6, x2: w - 6, y1: r(ruleY), y2: r(ruleY), stroke: C.cardRule, 'stroke-width': 2}),
    nodes,
  );
  return {node, w, h: hh};
}

/**
 * Zone of tension between two facing highlight edges. Supplied mode:
 * 'conflict' (jagged spark), 'compatible' (calm double rule) or 'plain'
 * (band only). Named `${name}` (+ `-band`, `-mark`, `-mark2`).
 * @param {{name:string, a:{x1:number,y1:number,x2:number,y2:number}, b:{x1:number,y1:number,x2:number,y2:number}, mode:'conflict'|'compatible'|'plain'}} o
 */
export function tensionZone(ctx, o) {
  const th = ctx.theme;
  const C = motifColors(ctx);
  const {a, b} = o;
  const N = o.name;
  const ma = {x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2};
  const mb = {x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2};
  const L = Math.max(1, dist(ma, mb));
  const ux = (mb.x - ma.x) / L, uy = (mb.y - ma.y) / L;
  const nx = -uy, ny = ux;
  const halfA = Math.hypot(a.x2 - a.x1, a.y2 - a.y1) / 2;
  const halfB = Math.hypot(b.x2 - b.x1, b.y2 - b.y1) / 2;
  const band = `M${r(a.x1)} ${r(a.y1)}L${r(b.x1)} ${r(b.y1)}L${r(b.x2)} ${r(b.y2)}L${r(a.x2)} ${r(a.y2)}Z`;
  const amp = Math.max(6, Math.min(halfA, halfB) * 0.55);
  let mark = null, mark2 = null, markLen = 0;
  if (o.mode === 'conflict') {
    const teeth = Math.max(4, Math.round(L / 22));
    const pts = [ma];
    for (let i = 1; i < teeth; i++) {
      const t = i / teeth;
      const s = i % 2 ? 1 : -1;
      pts.push({x: ma.x + ux * L * t + nx * amp * s, y: ma.y + uy * L * t + ny * amp * s});
    }
    pts.push(mb);
    mark = pts.map((p, i) => `${i ? 'L' : 'M'}${r(p.x)} ${r(p.y)}`).join('');
    for (let i = 1; i < pts.length; i++) markLen += dist(pts[i - 1], pts[i]);
  } else if (o.mode === 'compatible') {
    const off = Math.max(4, Math.min(halfA, halfB) * 0.28);
    const line = s => `M${r(ma.x + nx * off * s)} ${r(ma.y + ny * off * s)}L${r(mb.x + nx * off * s)} ${r(mb.y + ny * off * s)}`;
    mark = line(1);
    mark2 = line(-1);
    markLen = L;
  }
  const color = o.mode === 'conflict' ? C.flag : C.calm;
  const node = g({name: N, opacity: 0},
    h('path', {name: `${N}-band`, d: band, fill: o.mode === 'plain' ? C.hl : C.zoneSoft, opacity: 0.9, stroke: o.mode === 'plain' ? shade(C.hl, -0.35) : color, 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-linejoin': 'round'}),
    mark ? h('path', {name: `${N}-mark`, d: mark, fill: 'none', stroke: color, 'stroke-width': o.mode === 'conflict' ? 5 : 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(markLen)} ${r(markLen + 10)}`, 'stroke-dashoffset': r(markLen)}) : null,
    mark2 ? h('path', {name: `${N}-mark2`, d: mark2, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(markLen)} ${r(markLen + 10)}`, 'stroke-dashoffset': r(markLen)}) : null,
  );
  const xs = [a.x1, a.x2, b.x1, b.x2], ys = [a.y1, a.y2, b.y1, b.y2];
  const box = {x: Math.min(...xs) - amp, y: Math.min(...ys) - amp, w: Math.max(...xs) - Math.min(...xs) + amp * 2, h: Math.max(...ys) - Math.min(...ys) + amp * 2};
  /** @param {number} p draw progress */
  const frame = p => {
    const band = clamp(p * 2.2);
    const m = clamp((p - 0.3) / 0.7);
    const out = {[N]: {opacity: p > 0 ? 1 : 0}, [`${N}-band`]: {opacity: r(0.9 * band, 3)}};
    if (mark) out[`${N}-mark`] = {'stroke-dashoffset': r(markLen * (1 - m))};
    if (mark2) out[`${N}-mark2`] = {'stroke-dashoffset': r(markLen * (1 - m))};
    return out;
  };
  return {node, frame, center: {x: (ma.x + mb.x) / 2, y: (ma.y + mb.y) / 2}, box, ma, mb, mode: o.mode};
}

/**
 * Provision slip: the passage pulled out of its text as a strip of paper,
 * with a coloured edge and index tab of its source, the provision heading
 * and the passage block. Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, color:string, src:{id:string,provision:string}, passage:{text:string,tension:string}, size?:number}} o
 */
export function provisionSlip(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const size = o.size ?? 24;
  const edge = 12;
  const pad = size * 0.75;
  const inner = o.w - edge - pad * 2;
  const idSz = Math.max(size * 0.8, o.idMin ?? 0);
  const tabW = Math.max(52, ctx.measure(o.src.id, idSz, 800, 'sans') + 24);
  const tabH = Math.max(size * 1.3, idSz * 1.4);
  const idFit = ctx.fit(o.src.id, {maxWidth: tabW - 12, size: idSz, minSize: 11, maxLines: 1, weight: 800});
  // the provision reference is key text: it wraps to a third line on narrow slips rather than losing words
  const provFit = fitWords(ctx, `§ ${o.src.provision}`, {maxWidth: inner - tabW - 10, size: size * 1.08, minSize: size * 0.8, maxLines: 3, weight: 700, family: 'serif'});
  const pass = passageBlock(ctx, {prefix: `${P}-pa`, text: o.passage.text, phrase: o.passage.tension, w: inner, size, family: 'serif', maxPre: 3, maxPost: 2});
  const top = pad * 0.9;
  const passY = top + Math.max(provFit.height, tabH - 2) + size * 0.45;
  const hh = passY + pass.h + pad;
  const teeth = 16;
  const bottom = Array.from({length: teeth + 1}, (_, i) => `${r(o.w - (o.w * i) / teeth)} ${r(hh + (i % 2 ? 7 : 0))}`).join('L');
  const d = `M4 0H${r(o.w - 4)}Q${o.w} 0 ${o.w} 4V${r(hh)}L${bottom}Z`;
  const node = g({name: P},
    h('path', {d, transform: 'translate(7 10)', fill: th.shadow}),
    h('path', {d, fill: th.paper, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('rect', {x: 0, y: 0, width: edge, height: hh, fill: o.color, stroke: th.ink, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(o.w - pad - tabW, top - 2, tabW, tabH, size * 0.4), fill: o.color, stroke: th.ink, 'stroke-width': 1.6}),
    ctx.show('key') ? textBlock(idFit, {x: o.w - pad - tabW / 2, y: top - 2 + (tabH - idFit.size) / 2 - 1, anchor: 'middle', fill: '#fff'}) : null,
    textOrBars(ctx, provFit, ctx.show('all'), {x: edge + pad, y: top, fill: th.ink}),
    g({transform: T(edge + pad, passY)}, pass.node),
  );
  const pb = pass.phraseBox;
  return {node, w: o.w, h: hh, pass, phraseBox: {x: edge + pad + pb.x, y: passY + pb.y, w: pb.w, h: pb.h}, truncated: provFit.truncated || pass.truncated, frame: s => pass.frame(s)};
}

/** Zone drawing mode for a supplied state. */
export const zoneMode = state => (state === 'conflict-flagged' ? 'conflict' : state === 'compatible-application' ? 'compatible' : 'plain');

/* ------------------------------------------------------------------------ */
/* Lens clones                                                               */
/* ------------------------------------------------------------------------ */

const ZWSP = '​';

/**
 * Deep copy of a virtual subtree with every node name prefixed and SVG ids
 * rejected (the art used inside lenses carries no ids). Text copies start
 * with a zero-width space so tests can tell a lens overprint (an intentional
 * magnified copy drawn over the original) from an accidental collision.
 */
export function cloneForLens(node, prefix) {
  if (!node || typeof node !== 'object') return typeof node === 'string' ? node : node;
  const attrs = {...node.attrs};
  if (attrs.id) throw new Error('Lens clones cannot contain SVG ids');
  if (attrs.name) attrs.name = `${prefix}${attrs.name}`;
  const children = node.children.map(c => (typeof c === 'string' ? (node.tag === 'text' || node.tag === 'tspan' ? ZWSP + c : c) : cloneForLens(c, prefix)));
  return {tag: node.tag, attrs, children};
}
export const LENS_MARK = ZWSP;

/** All node names inside a virtual subtree. */
export function namesIn(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.attrs && node.attrs.name) out.push(node.attrs.name);
  for (const c of node.children || []) namesIn(c, out);
  return out;
}

/** Mirror frame props of `names` onto their lens copies. Text copies keep the lens mark. */
export function mirror(nodes, names, prefix) {
  const out = {};
  for (const n of names) {
    const v = nodes[n];
    if (!v) continue;
    out[`${prefix}${n}`] = v.text !== undefined ? {...v, text: ZWSP + v.text} : v;
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* Desk stage (story; compact panels for contrast; context for inspect)      */
/* ------------------------------------------------------------------------ */

export const DESK = {
  horizontal: {W: 1760, H: 900},
  square: {W: 1300, H: 1120},
  vertical: {W: 1000, H: 1450},
  hPanel: {W: 1000, H: 700},
  wPanel: {W: 1300, H: 460},
  // quiet contrast lanes (wording printed once elsewhere): wide lane and square lane
  qhPanel: {W: 1000, H: 580},
  qsPanel: {W: 640, H: 580},
};

/**
 * Geometry per layout (stage units). The texts always meet side by side so
 * the zone of tension only crosses margins, never body text. `book` = gutter
 * centre; the article's final position is solved so the phrases face each
 * other across the seam. Shoulders sit outside the desk window; rest poses
 * keep the arms fully off the desk (nearly straight, so no elbow pokes in).
 * `chipA` / `chipR` are candidate spots for the actor captions.
 */
const GEO = {
  horizontal: {
    pw: 330, ph: 520, book: {x: 810, y: 492}, aw: 370, ah: 520, gap: 40, rest: {dx: 165, dy: -26, rot: 4.5},
    // the lens rests in the free bottom-right corner (below the article at rest and at the end),
    // handle level; it turns to its working angle while it is carried to the seam
    size: 26, board: {x: 30, y: 36, w: 396}, boardSize: 1.08, note: {x: 30, y: 'below-board', w: 396}, noteSize: 1.08, cup: {x: 1560, y: 92}, lupa: {x: 1452, y: 827, R: 62, angle: 180, hold: 160},
    // the assistant pulls the article by its index tab and reaches the seam from straight above
    // (elbow over the seam), so the forearm never crosses the article's header
    shA: {x: 1000, y: -250}, shR: {x: 700, y: 1100}, arm: {upper: 350, lower: 340, width: 50}, armA: {upper: 351, lower: 420}, gripA: [0.33, -0.06], bendA: 1, bendR: -1,
    restA: {x: 1100, y: -900}, restR: {x: 1320, y: 1150}, passAtBook: 0.42, passAtArt: 0.22, maxPre: 3, maxPost: 2, flagS: 1.2,
    chipA: [{x: 870, y: 16, anchor: 'end'}], chipR: [{x: 1010, y: 'bottom', anchor: 'end'}, {x: 760, y: 'bottom', anchor: 'start'}, {x: 640, y: 'bottom', anchor: 'end'}],
  },
  square: {
    pw: 270, ph: 480, book: {x: 430, y: 622}, aw: 310, ah: 480, gap: 38, rest: {dx: 150, dy: -24, rot: 4},
    // the lens rests below the book with its handle pointing down-right (fully on the desk), and turns
    // to point down-left while it is held over the seam; the reader's shoulder sits right of the
    // reading card so the forearm never crosses it
    size: 24, board: {x: 30, y: 36, w: 600}, boardSize: 1.1, boardTok: 0.82, note: {x: 34, y: 'bottom', w: 380}, noteSize: 1.06, cup: {x: 1200, y: 870}, lupa: {x: 584, y: 972, R: 70, angle: 30, hold: 120},
    shA: {x: 1390, y: 480}, shR: {x: 690, y: 1330}, arm: {upper: 350, lower: 345, width: 50}, armA: {upper: 340, lower: 330}, gripA: [0.95, 0.5], bendA: -1, bendR: -1,
    restA: {x: 2050, y: 480}, restR: {x: 60, y: 1390}, passAtBook: 0.45, passAtArt: 0.24, maxPre: 3, maxPost: 3, flagS: 1.15,
    chipA: [{x: 1270, y: 36, anchor: 'end'}, {x: 1270, y: 'above-cup', anchor: 'end'}], chipR: [{x: 800, y: 'bottom', anchor: 'start'}, {x: 470, y: 'bottom', anchor: 'end'}],
  },
  vertical: {
    pw: 212, ph: 640, book: {x: 272, y: 880}, aw: 262, ah: 640, gap: 36, rest: {dx: 140, dy: -24, rot: 4},
    size: 22, board: {x: 36, y: 40, w: 440}, note: {x: 516, y: 40, w: 448}, cup: {x: 860, y: 1330}, lupa: {x: 250, y: 1320, R: 66, angle: 30},
    shA: {x: 1160, y: 1060}, shR: {x: 560, y: 1620}, arm: {upper: 350, lower: 340, width: 50}, gripA: [0.95, 0.5], bendA: 1, bendR: 1,
    restA: {x: 1820, y: 1060}, restR: {x: 560, y: 2300}, passAtBook: 0.4, passAtArt: 0.3, maxPre: 4, maxPost: 3, flagS: 1.1,
    chipA: [{x: 974, y: 'above-cup', anchor: 'end'}], chipR: [{x: 520, y: 'bottom', anchor: 'end'}, {x: 436, y: 'bottom', anchor: 'start'}],
  },
  // contrast panels (one arm; no reader, no reading card)
  hPanel: {
    pw: 215, ph: 400, book: {x: 270, y: 280}, aw: 250, ah: 400, gap: 36, rest: {dx: 110, dy: -20, rot: 4},
    // no reader in the contrast: the lens is parked off the desk; the scenario plate sits bottom-left
    // `slotSize`/`plateMaxH`: used when the scene draws the desk's wording quietly (LAW-0131)
    size: 22, slotSize: 26, plateMaxH: 190, board: {x: 640, y: 'bottom', w: 340}, boardSize: 1, cup: {x: 940, y: 64}, lupa: {x: -400, y: -400, R: 46, angle: 200},
    plate: {x: 20, y: 'bottom', w: 590},
    // the arm comes in low from the right so the forearm stays below the article's passage
    shA: {x: 1180, y: 470}, shR: null, arm: {upper: 370, lower: 360, width: 48}, gripA: [0.97, 0.92], bendA: -1,
    restA: {x: 1880, y: 470}, passAtBook: 0.42, passAtArt: 0.3, maxPre: 3, maxPost: 2, flagS: 1.05, cupR: 32,
  },
  // quiet lanes (LAW-0131 draws the shared wording once, off the desks): a small quiet book, a
  // wider article whose phrase slot is the one legible text, the scenario plate along the bottom
  qhPanel: {
    pw: 150, ph: 280, book: {x: 200, y: 196}, aw: 360, ah: 372, gap: 36, rest: {dx: 100, dy: -18, rot: 3.5},
    size: 22, slotSize: 28, plateMaxH: 200, idMin: 27, anchorSize: 26, gripHigh: true, clipGripDx: 16, fetchOut: 90, board: {x: 640, y: 'bottom', w: 340}, boardSize: 1, cup: {x: 930, y: 300}, lupa: {x: -400, y: -400, R: 46, angle: 200},
    plate: {x: 20, y: 'bottom', w: 600},
    // the arm reaches in from ABOVE (it takes the article by its top corner and sets the marker from
    // above), so the hand never covers the phrase slot
    shA: {x: 900, y: -300}, shR: null, arm: {upper: 400, lower: 390, width: 48}, gripA: [0.97, 0.05], bendA: 1,
    restA: {x: 900, y: -1080}, passAtBook: 0.42, passAtArt: 0.36, maxPre: 2, maxPost: 1, flagS: 1.05, cupR: 30,
  },
  qsPanel: {
    pw: 110, ph: 262, book: {x: 146, y: 186}, aw: 300, ah: 372, gap: 28, rest: {dx: 30, dy: -12, rot: 3},
    size: 20, slotSize: 28, plateMaxH: 205, idMin: 30, anchorSize: 26, gripHigh: true, clipGripDx: 10, clipGripDy: -10, fetchOut: 90, carryOut: 90, board: {x: 400, y: 'bottom', w: 200}, boardSize: 1, cup: {x: 598, y: 452}, lupa: {x: -400, y: -400, R: 40, angle: 200},
    plate: {x: 16, y: 'bottom', w: 530},
    // the arm reaches in from ABOVE (top corner grip, marker set from above): the hand never covers
    // the article's phrase slot
    shA: {x: 560, y: -300}, shR: null, arm: {upper: 400, lower: 390, width: 44}, gripA: [0.95, 0.04], bendA: 1,
    restA: {x: 560, y: -1080}, passAtBook: 0.4, passAtArt: 0.36, maxPre: 2, maxPost: 1, flagS: 0.95, cupR: 24,
  },
  wPanel: {
    pw: 230, ph: 350, book: {x: 620, y: 272}, aw: 270, ah: 360, gap: 36, rest: {dx: 100, dy: -8, rot: 3.5},
    size: 25, idMin: 26, slotSize: 28, board: {x: 20, y: 'bottom', w: 320}, boardSize: 0.92, cup: {x: 1236, y: 416}, lupa: {x: -400, y: -400, R: 44, angle: 200},
    plate: {x: 20, y: 18, w: 320},
    shA: {x: 1480, y: 400}, shR: null, arm: {upper: 360, lower: 350, width: 48}, gripA: [0.97, 0.94], bendA: -1,
    restA: {x: 2180, y: 400}, passAtBook: 0.36, passAtArt: 0.42, maxPre: 3, maxPost: 2, flagS: 1.1, cupR: 32,
  },
};

/** Axis-aligned box overlap. */
export const boxesOverlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** Whether segment p→q passes through box b (sampled). */
export function segmentHits(p, q, b, pad = 0) {
  const n = Math.max(8, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 10));
  for (let i = 1; i < n; i++) {
    const x = p.x + (q.x - p.x) * (i / n), y = p.y + (q.y - p.y) * (i / n);
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
  }
  return false;
}

/**
 * Footprint of a lens (see `lupa`) centred at `c` with its handle at `angle`
 * degrees: the rim circle and the handle as a thick segment, plus their
 * bounding box. Used to park the lens clear of objects and inside the desk.
 */
export function lensFootprint(c, R, angle, handleLen) {
  const HL = handleLen ?? R * 1.75;
  const a = rad(angle);
  const rr = R * 1.08 + 1;
  const e = R * 0.96 + HL * 1.04;
  const hw = R * 0.19 + 1;
  const p0 = {x: c.x + Math.cos(a) * R, y: c.y + Math.sin(a) * R};
  const p1 = {x: c.x + Math.cos(a) * e, y: c.y + Math.sin(a) * e};
  const x0 = Math.min(c.x - rr, p1.x - hw), x1 = Math.max(c.x + rr, p1.x + hw);
  const y0 = Math.min(c.y - rr, p1.y - hw), y1 = Math.max(c.y + rr, p1.y + hw);
  const hb = {x: Math.min(p0.x, p1.x) - hw, y: Math.min(p0.y, p1.y) - hw, w: Math.abs(p1.x - p0.x) + hw * 2, h: Math.abs(p1.y - p0.y) + hw * 2};
  // `boxes`: glass and handle as two tighter boxes (for placing captions close to the lens)
  return {c: {x: c.x, y: c.y}, r: rr, p0, p1, hw, box: {x: x0, y: y0, w: x1 - x0, h: y1 - y0}, boxes: [{x: c.x - rr, y: c.y - rr, w: rr * 2, h: rr * 2}, hb]};
}

/** Whether a lens footprint lies fully inside `rect` (with `margin`). */
export function footprintInside(fp, rect, margin = 0) {
  const inX = (x, d) => x - d >= rect.x + margin && x + d <= rect.x + rect.w - margin;
  const inY = (y, d) => y - d >= rect.y + margin && y + d <= rect.y + rect.h - margin;
  return inX(fp.c.x, fp.r) && inY(fp.c.y, fp.r) && inX(fp.p1.x, fp.hw) && inY(fp.p1.y, fp.hw);
}

/** Whether a lens footprint touches box `b` (grown by `pad`). */
export function footprintHits(fp, b, pad = 0) {
  const nx = Math.max(b.x - pad, Math.min(fp.c.x, b.x + b.w + pad));
  const ny = Math.max(b.y - pad, Math.min(fp.c.y, b.y + b.h + pad));
  if (Math.hypot(nx - fp.c.x, ny - fp.c.y) < fp.r) return true;
  return segmentHits(fp.p0, fp.p1, b, pad + fp.hw) || [fp.p0, fp.p1].some(q => q.x > b.x - pad - fp.hw && q.x < b.x + b.w + pad + fp.hw && q.y > b.y - pad - fp.hw && q.y < b.y + b.h + pad + fp.hw);
}

/**
 * Place an editorial callout near its target: tries a ring of chip
 * positions around the target box (then optional fallbacks) and keeps the
 * first whose chip stays inside `bounds`, clear of `obstacles`, and whose
 * leader does not cross any obstacle except the target's own box.
 * @param {any} ctx
 * @param {{name:string, text:string, target:{x:number,y:number}, targetBox?:any, obstacles:any[], bounds:{x:number,y:number,w:number,h:number}, size?:number, maxWidth:number, maxLines?:number, make:(o:any)=>any}} o
 */
export function placeCallout(ctx, o) {
  const B = o.bounds;
  const tb = o.targetBox || {x: o.target.x - 4, y: o.target.y - 4, w: 8, h: 8};
  const probe = o.make({chipAt: {x: 0, y: 0}, anchor: 'start'});
  const cw = probe.box.w, ch = probe.box.h;
  const cands = [];
  for (const d of [24, 60, 110, 170, 240, 320, 420, 520]) {
    cands.push({x: tb.x + tb.w + d, y: tb.y + tb.h / 2 - ch / 2, anchor: 'start'});
    cands.push({x: tb.x + tb.w + d, y: tb.y, anchor: 'start'});
    cands.push({x: tb.x + tb.w + d, y: tb.y + tb.h - ch, anchor: 'start'});
    cands.push({x: tb.x - d, y: tb.y, anchor: 'end'});
    cands.push({x: tb.x - d, y: tb.y + tb.h - ch, anchor: 'end'});
    cands.push({x: tb.x - d, y: tb.y + tb.h / 2 - ch / 2, anchor: 'end'});
    cands.push({x: tb.x + tb.w / 2, y: tb.y + tb.h + d, anchor: 'middle'});
    cands.push({x: tb.x + tb.w / 2, y: tb.y - d - ch, anchor: 'middle'});
    cands.push({x: tb.x + tb.w + d, y: tb.y + tb.h + d * 0.6, anchor: 'start'});
    cands.push({x: tb.x - d, y: tb.y + tb.h + d * 0.6, anchor: 'end'});
    cands.push({x: tb.x + tb.w + d, y: tb.y - d * 0.6 - ch, anchor: 'start'});
    cands.push({x: tb.x - d, y: tb.y - d * 0.6 - ch, anchor: 'end'});
    // hanging below / above the target box, flush with one of its sides
    cands.push({x: tb.x + tb.w + d, y: tb.y + tb.h + 16, anchor: 'end'});
    cands.push({x: tb.x - d, y: tb.y + tb.h + 16, anchor: 'start'});
    cands.push({x: tb.x + tb.w + d, y: tb.y - 16 - ch, anchor: 'end'});
    cands.push({x: tb.x - d, y: tb.y - 16 - ch, anchor: 'start'});
  }
  let best = null;
  for (const c of cands) {
    const bx = c.anchor === 'middle' ? c.x - cw / 2 : c.anchor === 'end' ? c.x - cw : c.x;
    const box = {x: bx, y: c.y, w: cw, h: ch};
    if (box.x < B.x || box.y < B.y || box.x + box.w > B.x + B.w || box.y + box.h > B.y + B.h) continue;
    const hits = o.obstacles.filter(b => b !== o.targetBox && boxesOverlap(box, b, 8)).length;
    const from = {x: Math.max(box.x, Math.min(o.target.x, box.x + box.w)), y: Math.max(box.y, Math.min(o.target.y, box.y + box.h))};
    const crosses = o.obstacles.filter(b => b !== o.targetBox && segmentHits(from, o.target, b, 2)).length;
    const score = hits * 1000 + crosses * 100 + Math.hypot(from.x - o.target.x, from.y - o.target.y) / 100;
    if (score < 1) return o.make({chipAt: {x: c.x, y: c.y}, anchor: c.anchor});
    if (!best || score < best.score) best = {score, c};
  }
  if (o.strict) return null;
  return best ? o.make({chipAt: {x: best.c.x, y: best.c.y}, anchor: best.c.anchor}) : null;
}

/** placeCallout over decreasing chip widths (strict), then the least-bad placement at the first width. */
export function placeCalloutWidths(ctx, o, widths) {
  for (const w of widths) {
    // widths that would truncate or visibly shrink the text are not acceptable
    if (o.text && ctx.fit(o.text, {maxWidth: w - o.size * 1.2, size: o.size, minSize: o.size * 0.92, maxLines: o.maxLines ?? 3, weight: 600}).truncated) continue;
    const got = placeCallout(ctx, {...o, strict: true, make: q => o.make({...q, maxWidth: w})});
    if (got) return got;
  }
  return placeCallout(ctx, {...o, make: q => o.make({...q, maxWidth: widths[0]})});
}

/** First candidate chip (from `cands`) that is clear of obstacles and inside bounds. */
export function placeChip(ctx, text, cands, o) {
  // key captions wrap onto a second line rather than losing words to an ellipsis
  const opts = {maxWidth: o.maxWidth, size: o.size, minSize: o.size * 0.86, maxLines: o.maxLines ?? 2, name: o.name};
  for (const c of cands) {
    const made = chip(ctx, text, {...c, ...opts});
    const b = made.box;
    const B = o.bounds;
    if (b.x < B.x || b.y < B.y || b.x + b.w > B.x + B.w || b.y + b.h > B.y + B.h) continue;
    if (!o.obstacles.some(q => boxesOverlap(b, q, 6))) return made;
  }
  return chip(ctx, text, {...cands[0], ...opts});
}

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {'horizontal'|'vertical'|'hCompact'|'vCompact'} o.layout
 * @param {{sources:any[], passages:any[], hierarchy:any, interpretations:any[]}} o.content
 * @param {string} o.hierarchyLabel
 * @param {string} [o.phraseB]         override of the article's tension phrase (contrast)
 * @param {string|null} [o.altA]       alternative phrase for the book (inspect)
 * @param {string|null} [o.altB]       alternative phrase for the article (inspect)
 * @param {boolean} [o.assistant=true] assistant arm (slides the article, places the marker)
 * @param {boolean} [o.reader=true]    reader arm (brings the lens)
 * @param {'flag'|'clip'|'none'} [o.marker]
 * @param {'conflict'|'compatible'|'plain'} [o.zoneMode]
 * @param {number} [o.gap]             final gap between the two texts
 * @param {number} [o.contactGap]      gap at contact before a recoil
 * @param {boolean} [o.note]           attributed reading card on the desk
 * @param {boolean} [o.lens]           lens shows a magnified copy
 * @param {{a?:string,b?:string}} [o.chips] actor captions
 * @param {string} [o.seedKey]
 */
export function conflictDesk(ctx, o) {
  const C = motifColors(ctx);
  const P = o.prefix;
  const G = GEO[o.layout];
  // `deskH` / `deskW` (opt-in): a shorter/taller or wider desk than the layout's default (the texts
  // keep their places); `cupAt` (opt-in) moves the pin cup
  const W = o.deskW ?? DESK[o.layout].W;
  const H = o.deskH ?? DESK[o.layout].H;
  const content = o.content;
  const seedKey = o.seedKey || 'cet';
  const col = C.src;
  const compact = o.layout === 'hPanel' || o.layout === 'wPanel' || o.layout === 'qhPanel' || o.layout === 'qsPanel';

  // --- the two texts
  // `quietTexts` (opt-in): titles and wording on the desk are drawn as bars — the scene prints the
  // shared wording once elsewhere — and only the article's phrase slot stays legible, at `G.slotSize`
  const qt = Boolean(o.quietTexts);
  const quietOpts = qt ? {quiet: true, titleBars: true} : {};
  const book = openBook(ctx, {prefix: `${P}-book`, pw: G.pw, ph: G.ph, color: col[0], src: content.sources[0], passage: content.passages[0], alt: o.altA ?? null, slotText: o.phraseA ?? null, slotAlso: o.slotAlsoA, ring: o.ringA ?? null, passageAt: G.passAtBook, size: G.size, seedKey: `${seedKey}-book`, maxPre: qt ? 2 : G.maxPre, maxPost: qt ? 1 : G.maxPost, idMin: G.idMin, provName: o.provNames, ...quietOpts, ...(qt && G.anchorSize ? {provText: G.anchorSize} : {})});
  const art = articleSheet(ctx, {prefix: `${P}-art`, w: G.aw, h: G.ah, color: col[1], src: content.sources[1], passage: content.passages[1], slotText: o.phraseB ?? null, ring: o.ringB ?? null, alt: o.altB ?? null, passageAt: G.passAtArt, size: G.size, seedKey: `${seedKey}-art`, slotMin: o.slotMinB, slotAlso: o.slotAlsoB, maxPre: qt ? 1 : G.maxPre, maxPost: qt ? 1 : G.maxPost, idMin: G.idMin, provName: o.provNames, ...quietOpts, ...(qt ? {showSlot: true, passSize: G.slotSize ?? G.size, slotLines: 5, wordReveal: true} : {})});
  const bookC = {x: G.book.x, y: G.book.y};
  const bookPt = q => ({x: bookC.x + q.x, y: bookC.y + q.y});
  const pa = bookPt(book.phraseBox);
  const phA = {x: pa.x, y: pa.y, w: book.phraseBox.w, h: book.phraseBox.h};
  const bookRight = bookC.x + book.outer.x + book.outer.w;
  const gapFinal = o.gap ?? G.gap;
  const contactGap = o.contactGap ?? gapFinal;
  const recoil = contactGap !== gapFinal;
  // Article positions (top-left): the phrases face each other across the seam.
  const artY = phA.y + phA.h / 2 - (art.phraseBox.y + art.phraseBox.h / 2);
  const artAt = gap => ({x: bookRight + gap, y: artY});
  const artFinal = artAt(gapFinal);
  const artContact = artAt(contactGap);
  // rest pose is anchored to the layout's nominal gap, so paired scenes with different final gaps start identical
  const artRest = {x: artAt(G.gap).x + G.rest.dx, y: artFinal.y + G.rest.dy};
  const artCenterLocal = {x: art.w / 2, y: art.h / 2};
  /** article local (top-left origin) → stage, for a pose {x,y,rot} (rotation about the sheet centre) */
  const artWorld = (pose, q) => {
    const a = rad(pose.rot);
    const dx = q.x - artCenterLocal.x, dy = q.y - artCenterLocal.y;
    return {x: pose.x + artCenterLocal.x + dx * Math.cos(a) - dy * Math.sin(a), y: pose.y + artCenterLocal.y + dx * Math.sin(a) + dy * Math.cos(a)};
  };
  const artTransform = pose => `${T(pose.x + artCenterLocal.x, pose.y + artCenterLocal.y, pose.rot)} translate(${r(-artCenterLocal.x)} ${r(-artCenterLocal.y)})`;
  const phB = {x: artFinal.x + art.phraseBox.x, y: artFinal.y + art.phraseBox.y, w: art.phraseBox.w, h: art.phraseBox.h};

  // --- zone of tension between the facing highlight edges (final layout)
  const zm = o.zoneMode ?? 'conflict';
  const zoneA = {x1: phA.x + phA.w, y1: phA.y + 3, x2: phA.x + phA.w, y2: phA.y + phA.h - 3};
  const zoneB = {x1: phB.x, y1: phB.y + 3, x2: phB.x, y2: phB.y + phB.h - 3};
  const zone = tensionZone(ctx, {name: `${P}-zone`, a: zoneA, b: zoneB, mode: zm});
  const zc = zone.center;
  // seam point between the two texts (markers are placed across it)
  const seam = {x: bookRight + gapFinal / 2, y: zc.y};

  // --- hierarchy board
  const boardAt = {x: G.board.x, y: G.board.y};
  // Height budget: when the board sits above the texts it must end before the book's index tab.
  const bookTop = bookC.y + book.bounds.y;
  const aboveTexts = G.board.x < bookC.x + book.bounds.x + book.bounds.w && G.board.x + G.board.w > bookC.x + book.bounds.x;
  const budget = aboveTexts ? bookTop - boardAt.y - 18 : Infinity;
  let bsize = G.size * (G.boardSize ?? (compact ? 0.9 : 0.95));
  const makeBoard = sz => hierarchyBoard(ctx, {prefix: `${P}-board`, w: G.board.w, hier: content.hierarchy, ids: content.sources.map(s => s.id), colors: col, header: o.hierarchyLabel, size: sz, tokScale: G.boardTok});
  // `board: false` leaves the hierarchy board off the desk (a scene may draw one shared board instead)
  const withBoard = o.board !== false;
  let board = makeBoard(bsize);
  while (board.h > budget && bsize > G.size * 0.62) {
    bsize *= 0.93;
    board = makeBoard(bsize);
  }
  if (G.board.y === 'bottom') {
    // bottom-anchored boards shrink until they clear the texts above them
    const bx0 = bookC.x + book.bounds.x, bx1 = bx0 + book.bounds.w;
    const overBook = G.board.x < bx1 && G.board.x + G.board.w > bx0;
    const textsBottom = Math.max(overBook ? bookC.y + book.bounds.y + book.bounds.h : 0, artAt(gapFinal).y + art.h + 14);
    while (H - 16 - board.h < textsBottom && bsize > G.size * 0.62) {
      bsize *= 0.93;
      board = makeBoard(bsize);
    }
    boardAt.y = H - 16 - board.h;
  }

  // --- reading card
  let note = null;
  let noteAt = null;
  if (o.note && content.interpretations.length && G.note) {
    let nsz = G.size * (G.noteSize ?? 0.9);
    const mkNote = () => readingCard(ctx, {prefix: `${P}-note`, w: G.note.w, interp: content.interpretations[0], size: nsz, heading: kitT(ctx).readingProposed});
    note = mkNote();
    const nyOf = () => (G.note.y === 'below-board' ? boardAt.y + board.h + 30 + (o.noteGap || 0) : G.note.y === 'bottom' ? H - note.h - 40 : G.note.y);
    // the card never runs off the desk: it shrinks (bounded) when a long reading needs it
    while (nyOf() + note.h > H - 16 && nsz > G.size * 0.72) {
      nsz *= 0.95;
      note = mkNote();
    }
    const ny = nyOf();
    noteAt = {x: G.note.x, y: ny};
  }

  // --- markers, cup and lens
  const marker = o.marker ?? 'flag';
  const flag = flagPin(ctx, {name: `${P}-flag`, color: C.flag, s: G.flagS ?? 1});
  const clip = linkClip(ctx, {name: `${P}-clip`, len: compact ? 74 : 104, vertical: true});
  const cup = markerCup(ctx, {name: `${P}-cup`, R: G.cupR ?? 44, flagColor: C.flag});
  const cupC = o.cupAt ? {x: o.cupAt.x, y: o.cupAt.y} : {x: G.cup.x, y: G.cup.y};
  const markerRest = {x: cupC.x - 6, y: cupC.y + 4};
  // the pennant flies over the right-hand margin strip; the pin sits just left of the seam so it never covers text
  const markerSpot = marker === 'flag' ? {x: seam.x - 10 * (G.flagS ?? 1), y: seam.y} : {x: seam.x, y: seam.y};
  const lp = lupa(ctx, {name: `${P}-lupa`, R: G.lupa.R, handleLen: G.lupa.R * 1.75, angle: G.lupa.angle});
  // the lens is parked at a fixed free spot of the desk (never moved onto the desk edge);
  // it turns from its resting angle to its working angle while it is carried
  const lensRest = {x: G.lupa.x, y: G.lupa.y};
  const lensSpot = {x: seam.x, y: zc.y};
  const lensTurn = (G.lupa.hold ?? G.lupa.angle) - G.lupa.angle;
  const lensFp = lensFootprint(lensRest, G.lupa.R, G.lupa.angle, G.lupa.R * 1.75);

  // --- desk and arms
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, seedKey: `${seedKey}-desk`});
  const lookA = actorLook(ctx, o.assistantParty || null, 1);
  const lookR = actorLook(ctx, o.readerParty || null, 0);
  const armSpec = {...G.arm, handScale: 1.28};
  const withA = o.assistant !== false;
  const withR = o.reader !== false && Boolean(G.shR);
  const armA = withA ? topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', ...armSpec, ...(G.armA || {})}) : null;
  const armR = withR ? topArm(ctx, {name: `${P}-armR`, skin: lookR.skin, sleeve: lookR.outfit, handed: 'left', ...armSpec}) : null;
  const shA = G.shA, shR = G.shR;
  const gripA = {x: art.w * G.gripA[0], y: art.h * G.gripA[1]};

  // --- lens content (magnified copy of the texts, zone and markers)
  let lens = null;
  let lensNames = [];
  const LZ = `${P}-lz-`;
  if (o.lens !== false && withR) {
    const cloneSrc = g(null, g({name: `${P}-bookg`, transform: T(bookC.x, bookC.y)}, book.node), g({name: `${P}-artg`}, art.node), zone.node, g({name: `${P}-markers`}, flag.node, clip.node));
    lensNames = namesIn(cloneSrc);
    lens = lensView(ctx, {name: `${P}-lens`, R: G.lupa.R * 0.92, content: cloneForLens(cloneSrc, LZ), k: 1.75});
  }

  // --- actor chips (next to where each arm enters the desk), clear of the objects
  const chipSize = compact ? 26 : 28;
  const chips = [];
  const chipBoxes = [];
  const bookBoxW = {x: bookC.x + book.bounds.x, y: bookC.y + book.bounds.y, w: book.bounds.w, h: book.bounds.h};
  const artSweep = {x: artFinal.x, y: Math.min(artFinal.y, artRest.y) - 44, w: artRest.x + art.w + 10 - artFinal.x, h: art.h + Math.abs(artRest.y - artFinal.y) + 50};
  const cupBox = {x: cupC.x - 50, y: cupC.y - 50, w: 100, h: 100};
  const boardBox = withBoard ? {x: boardAt.x, y: boardAt.y, w: board.w, h: board.h} : {x: -9999, y: -9999, w: 0, h: 0};
  const noteBox = note ? {x: noteAt.x, y: noteAt.y, w: note.w, h: note.h} : null;
  // `parkedLens: false` leaves the small lens off the desk (scenes that bring their own lens)
  const lensDrawn = o.parkedLens !== false;
  const objBoxes = [bookBoxW, artSweep, boardBox, cupBox, ...(lensDrawn ? [lensFp.box] : [])];
  if (noteBox) objBoxes.push(noteBox);
  const chipY = (c, hgt) => (c.y === 'bottom' ? H - 20 - hgt : c.y === 'above-cup' ? cupC.y - 64 - hgt : c.y);
  const chipBounds = {x: 14, y: 10, w: W - 28, h: H - 20};
  const chipFits = [];
  if (ctx.show('key') && o.chips) {
    for (const [text, cands, name, on] of [[o.chips.b, G.chipA, `${P}-chipA`, withA], [o.chips.a, G.chipR, `${P}-chipR`, withR]]) {
      if (!text || !on || !cands) continue;
      const hgt = chip(ctx, text, {x: 0, y: 0, maxWidth: W * 0.34, size: chipSize, minSize: chipSize * 0.86, maxLines: 2}).box.h;
      const c = placeChip(ctx, text, cands.map(q => ({x: q.x, y: chipY(q, hgt), anchor: q.anchor})), {maxWidth: W * 0.34, size: chipSize, name, obstacles: [...objBoxes, ...chipBoxes], bounds: chipBounds});
      chips.push(c.node);
      chipBoxes.push(c.box);
      chipFits.push(c.fit);
    }
  }
  // the parked lens (lens and handle) lies inside the desk and clear of every object and caption
  const artRestCorners = [[0, 0], [art.w, 0], [art.w, art.h], [0, art.h], [art.tab.x, art.tab.y], [art.tab.x + art.tab.w, art.tab.y]].map(([x, y]) => artWorld({...artRest, rot: G.rest.rot}, {x, y}));
  const artRestBox = {x: Math.min(...artRestCorners.map(q => q.x)), y: Math.min(...artRestCorners.map(q => q.y)), w: 0, h: 0};
  artRestBox.w = Math.max(...artRestCorners.map(q => q.x)) - artRestBox.x;
  artRestBox.h = Math.max(...artRestCorners.map(q => q.y)) - artRestBox.y;
  const artFinalBox = {x: artFinal.x, y: artFinal.y + art.tab.y, w: art.w, h: art.h - art.tab.y};
  // the book: cover (with its index tab) and the ribbon hanging from the gutter
  const bookCover = {x: bookC.x + book.outer.x, y: bookC.y + book.tab.y, w: book.outer.w, h: book.outer.y + book.outer.h - book.tab.y};
  const ribbonBox = {x: bookC.x + 8, y: bookC.y + book.bot - book.ph * 0.3, w: 16, h: book.ph * 0.3 + 44};
  const lensClearOf = [bookCover, ribbonBox, artFinalBox, artRestBox, boardBox, cupBox, noteBox, ...chipBoxes].filter(Boolean);
  const lensParked = {inDesk: footprintInside(lensFp, {x: 0, y: 0, w: W, h: H}, 4), clear: !lensClearOf.some(b => footprintHits(lensFp, b, 4))};

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      withBoard ? g({transform: T(boardAt.x, boardAt.y)}, board.node) : null,
      note ? g({transform: T(noteAt.x, noteAt.y)}, note.node) : null,
      g({transform: T(cupC.x, cupC.y)}, cup),
      g({name: `${P}-bookg`, transform: T(bookC.x, bookC.y)}, book.node),
      g({name: `${P}-artg`}, art.node),
      zone.node,
      g({name: `${P}-markers`}, marker === 'flag' ? flag.node : null, marker === 'clip' ? clip.node : null),
      lens ? lens.node : null,
      armR ? [armR.arm, armR.palm] : null,
      lensDrawn ? lp.node : null,
      armR ? armR.thumb : null,
      armA ? [armA.arm, armA.palm] : null,
      armA ? armA.thumb : null,
    ),
    desk.frame,
    chips,
  );
  // markers never render twice: the unused one lives only (hidden) in the lens clone
  const hiddenMarker = marker === 'clip' ? `${P}-flag` : `${P}-clip`;
  // `G.gripHigh` (opt-in): the hand holds the marker by its top end (pennant / clip head), so while it
  // sets the marker on the seam the hand stays above the phrase line (`G.clipGripDx`: the clip is held
  // by its right shoulder, keeping the palm off the book's anchor heading)
  const markerGrip = G.gripHigh
    ? (marker === 'clip' ? {x: clip.grip.x + (G.clipGripDx ?? 0), y: -(compact ? 74 : 104) * 1.25 + (G.clipGripDy ?? 0)} : {x: flag.grip.x + 8 * (G.flagS ?? 1), y: -58 * (G.flagS ?? 1) * 1.7})
    : (marker === 'clip' ? clip.grip : flag.grip);
  const markerOn = marker !== 'none';

  /**
   * Pose the stage from action values in [0,1].
   * @param {object} s
   * @param {number} [s.grab]     assistant hand from rest to the article grip
   * @param {number} [s.slide]    article from rest to contact (hand-carried)
   * @param {number} [s.recoil]   article from contact back to its final gap
   * @param {number} [s.release]  hand lets go (to the cup, or away when no marker)
   * @param {number} [s.fetch]    hand takes the marker out of the cup
   * @param {number} [s.carry]    marker carried to the seam
   * @param {number} [s.place]    marker pressed down
   * @param {number} [s.back]     empty hand withdraws
   * @param {number} [s.hl]       highlight sweep on both phrases
   * @param {number} [s.zone]     zone draw
   * @param {number} [s.lensGrab] reader hand reaches the lens
   * @param {number} [s.lensCarry] lens carried over the zone
   * @param {number} [s.lensBack] lens carried back to its rest
   * @param {number} [s.lensRelease] reader hand lets go and withdraws
   * @param {number} [s.writeB]   typewriter reveal of the article phrase
   * @param {number} [s.ghostB]   empty slot outline on the article
   * @param {number} [s.swapA]    inspect: book phrase before → after
   * @param {number} [s.swapB]    inspect: article phrase before → after
   * @param {number[]} [s.glow]   hierarchy token glow
   */
  function pose(s) {
    const nodes = {};
    const v = k => clamp(s[k] ?? 0);
    // article path: rest → contact (hand-carried) → final (recoil)
    let pos = mix(artRest, artContact, ease.inOutCubic(v('slide')));
    if (recoil && v('recoil') > 0) pos = mix(artContact, artFinal, ctx.reduced ? ease.outCubic(v('recoil')) : ease.outBack(v('recoil')));
    const rot = lerp(G.rest.rot, 0, ease.inOutCubic(clamp(v('slide') * 1.15)));
    const artPose = {x: pos.x, y: pos.y, rot};
    nodes[`${P}-artg`] = {transform: artTransform(artPose)};
    Object.assign(nodes, book.frame({hl: v('hl'), swap: v('swapA'), ring: s.ringA}));
    Object.assign(nodes, art.frame({hl: v('hl'), swap: v('swapB'), write: s.writeB, ghost: s.ghostB, ring: s.ringB}));
    Object.assign(nodes, zone.frame(v('zone')));
    if (withBoard) Object.assign(nodes, board.frame({glow: s.glow}));

    // --- assistant: grab, push (and recoil), release, fetch the marker, carry, place, withdraw
    const gripW = artWorld(artPose, gripA);
    let handA = null;
    let markerPos = markerRest;
    let markerHolder = 'cup';
    const holding = withA && v('grab') >= 1 && v('release') === 0;
    if (withA) {
      const restA = G.restA;
      const cupGrip = {x: markerRest.x + markerGrip.x, y: markerRest.y + markerGrip.y};
      const spotGrip = {x: markerSpot.x + markerGrip.x, y: markerSpot.y + markerGrip.y};
      if (v('back') > 0) handA = mix(spotGrip, restA, ease.inOutSine(v('back')));
      else if (v('place') > 0 || v('carry') > 0) {
        // the marker travels on an arc that leaves the tray and comes down onto the seam
        // from the shoulder's side, so the hand never sweeps across the texts' headings
        const cp = ease.inOutSine(v('carry'));
        const toSh = q => {
          const dx = shA.x - q.x, dy = shA.y - q.y, L = Math.hypot(dx, dy) || 1;
          return {x: dx / L, y: dy / L};
        };
        const a1 = toSh(cupGrip), a2 = toSh(spotGrip);
        // `G.carryOut` (opt-in): from a cup below the article the hand first swings out past the
        // article's outer edge and comes down onto the seam from above (never across the phrase slot)
        const c1 = G.carryOut ? {x: Math.max(cupGrip.x, artPose.x + art.w) + G.carryOut, y: Math.min(cupGrip.y, spotGrip.y) - 60} : {x: cupGrip.x + a1.x * 110, y: cupGrip.y + a1.y * 110};
        const c2 = G.carryOut ? {x: spotGrip.x + 60, y: spotGrip.y - 300} : {x: spotGrip.x + a2.x * 380, y: spotGrip.y + a2.y * 380};
        const k = 1 - cp;
        handA = {
          x: k * k * k * cupGrip.x + 3 * k * k * cp * c1.x + 3 * k * cp * cp * c2.x + cp * cp * cp * spotGrip.x,
          y: k * k * k * cupGrip.y + 3 * k * k * cp * c1.y + 3 * k * cp * cp * c2.y + cp * cp * cp * spotGrip.y,
        };
      } else if (v('fetch') > 0) {
        const f = ease.inOutCubic(v('fetch'));
        if (G.fetchOut) {
          // (opt-in) the empty hand swings out past the article's outer edge on its way to the cup
          const c = {x: Math.max(gripW.x, cupGrip.x) + G.fetchOut, y: (gripW.y + cupGrip.y) / 2};
          const k = 1 - f;
          handA = {x: k * k * gripW.x + 2 * k * f * c.x + f * f * cupGrip.x, y: k * k * gripW.y + 2 * k * f * c.y + f * f * cupGrip.y};
        } else handA = mix(gripW, cupGrip, f);
      }
      else if (v('release') > 0) handA = markerOn ? gripW : mix(gripW, restA, ease.inOutSine(v('release')));
      else handA = mix(restA, gripW, ease.inOutSine(v('grab')));
      if (markerOn) {
        if (v('back') > 0) markerHolder = 'desk';
        else if (v('place') > 0 || v('carry') > 0 || v('fetch') >= 1) markerHolder = 'hand';
      }
    }
    let solvedA = null;
    if (armA) {
      // the hand dips slightly as the marker goes down
      const press = v('place') > 0 && v('back') === 0 ? Math.sin(Math.PI * v('place')) * 6 : 0;
      solvedA = armA.pose(shA, {x: handA.x, y: handA.y + press}, G.bendA);
      Object.assign(nodes, solvedA.nodes);
    }
    if (markerHolder === 'hand') {
      const hp = solvedA ? solvedA.hand : handA;
      markerPos = v('place') > 0 ? markerSpot : {x: hp.x - markerGrip.x, y: hp.y - markerGrip.y};
    } else if (markerHolder === 'desk') markerPos = markerSpot;
    const markerNode = marker === 'clip' ? `${P}-clip` : `${P}-flag`;
    const lifted = markerHolder === 'hand' && v('place') === 0;
    if (markerOn) {
      // inside the cup the marker is one of the spares drawn in it; it appears once the hand takes it
      nodes[markerNode] = {transform: T(markerPos.x, markerPos.y, 0, lifted ? 1.08 : 1), opacity: markerHolder === 'cup' ? 0 : 1};
      if (marker === 'flag') nodes[`${markerNode}-shadow`] = {opacity: lifted ? 0.4 : 1};
    }

    // --- reader: reach the lens, carry it over the zone, hold it
    let lensC = lensRest;
    let lensHolder = 'desk';
    let solvedR = null;
    // the lens turns about its centre from the resting angle to the working angle while carried
    let lensRot = 0;
    if (armR && v('lensRelease') === 0) {
      if (v('lensBack') > 0) lensRot = lensTurn * (1 - ease.inOutSine(v('lensBack')));
      else if (v('lensCarry') > 0) lensRot = lensTurn * ease.inOutSine(v('lensCarry'));
    }
    const ra = rad(lensRot);
    const gripOff = {x: lp.grip.x * Math.cos(ra) - lp.grip.y * Math.sin(ra), y: lp.grip.x * Math.sin(ra) + lp.grip.y * Math.cos(ra)};
    if (armR) {
      let handR;
      const restGrip = {x: lensRest.x + lp.grip.x, y: lensRest.y + lp.grip.y};
      if (v('lensRelease') > 0) {
        handR = mix(restGrip, G.restR, ease.inOutSine(v('lensRelease')));
      } else if (v('lensBack') > 0) {
        const cp = ease.inOutSine(v('lensBack'));
        const m = mix(lensSpot, lensRest, cp);
        handR = {x: m.x + gripOff.x, y: m.y - Math.sin(Math.PI * cp) * 18 + gripOff.y};
        lensHolder = 'hand';
      } else if (v('lensCarry') > 0) {
        const cp = ease.inOutSine(v('lensCarry'));
        const m = mix(lensRest, lensSpot, cp);
        handR = {x: m.x + gripOff.x, y: m.y - Math.sin(Math.PI * cp) * 18 + gripOff.y};
        lensHolder = 'hand';
      } else {
        handR = mix(G.restR, {x: lensRest.x + gripOff.x, y: lensRest.y + gripOff.y}, ease.inOutSine(v('lensGrab')));
        lensHolder = v('lensGrab') >= 1 ? 'hand' : 'desk';
      }
      solvedR = armR.pose(shR, handR, G.bendR);
      Object.assign(nodes, solvedR.nodes);
      if (lensHolder === 'hand') lensC = {x: solvedR.hand.x - gripOff.x, y: solvedR.hand.y - gripOff.y};
    }
    const lifting = lensHolder === 'hand' ? 1 : 0;
    if (lensDrawn) {
      nodes[`${P}-lupa`] = {transform: T(lensC.x, lensC.y, lensRot, 1 + 0.05 * lifting)};
      // the shadow keeps its world offset while the lens turns
      nodes[`${P}-lupa-shadow`] = {opacity: lifting ? 0.5 : 1, transform: `rotate(${r(-lensRot, 3)})`};
    }
    const lensOn = Boolean(lens) && v('lensCarry') > 0.5 && v('lensBack') < 0.5;
    if (lens) {
      Object.assign(nodes, mirror(nodes, lensNames, LZ));
      nodes[`${LZ}${hiddenMarker}`] = {opacity: 0};
      Object.assign(nodes, lens.frame(lensC, lensOn ? 1 : 0));
    }

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const reachA = solvedA ? solvedA.reached : true;
    const reachR = solvedR ? solvedR.reached : true;
    return {
      nodes,
      semantic: {
        article: P2(artWorld(artPose, artCenterLocal)),
        articleRot: r(rot),
        articleGrip: P2(gripW),
        articleHolder: holding ? 'hand' : 'desk',
        gap: r(artPose.x - bookRight),
        handA: solvedA ? P2(solvedA.hand) : null,
        marker: P2(markerPos),
        markerGrip: P2({x: markerPos.x + markerGrip.x, y: markerPos.y + markerGrip.y}),
        markerHolder: markerOn ? markerHolder : 'none',
        markerPlaced: markerOn && v('place') >= 1,
        handR: solvedR ? P2(solvedR.hand) : null,
        lens: P2(lensC),
        lensGrip: P2({x: lensC.x + gripOff.x, y: lensC.y + gripOff.y}),
        lensHolder,
        lensOverZone: dist(lensC, lensSpot) < 2,
        lensShowsCopy: lensOn,
        lensRot: r(lensRot, 3),
        lensParkedInDesk: !lensDrawn || lensParked.inDesk,
        lensParkedClear: !lensDrawn || lensParked.clear,
        keyChipsWhole: chipFits.every(f => !f.truncated),
        // (quiet lanes only) the assistant's hand (≈ its palm disc) stays off the article's phrase slot
        ...(qt ? {handOffPhrase: !solvedA || !(v('grab') > 0 && v('back') < 1) || (() => {
          const pb = art.phraseBox, sl = {x: artPose.x + pb.x, y: artPose.y + pb.y, w: Math.max(pb.w, art.altBox.w), h: pb.h};
          const hd = solvedA.hand, rr = (G.arm.width ?? 48) * 0.55;
          const nx = Math.max(sl.x, Math.min(hd.x, sl.x + sl.w)), ny = Math.max(sl.y, Math.min(hd.y, sl.y + sl.h));
          return Math.hypot(nx - hd.x, ny - hd.y) >= rr;
        })()} : {}),
        highlight: r(v('hl'), 3),
        zoneDrawn: r(v('zone'), 3),
        reach: {A: reachA, R: reachR},
        allReached: reachA && reachR,
      },
    };
  }

  return {
    node, pose, W, H, G,
    plate: G.plate || null,
    book, art, board, boardAt, note, noteAt, zone, seam, bookC, cupC, lensRest, lensSpot,
    phA, phB, artFinal, artRest, artContact, bookRight,
    chipBoxes,
    objBoxes,
    lensFp, lensParked, lensClearOf,
    flagNode: flag.node, clipNode: clip.node, markerSpot, flagGrip: flag.grip,
    /** virtual tree of the texts, zone and markers in stage coords (for lens copies) */
    lensSource: extra => g(null, g({name: `${P}-bookg`, transform: T(bookC.x, bookC.y)}, book.node), g({name: `${P}-artg`}, art.node), zone.node, g({name: `${P}-markers`}, flag.node, clip.node), extra || null),
    /** article-local point at the final pose → stage */
    artPt: q => artWorld({...artFinal, rot: 0}, q),
    bookPt,
    marker,
  };
}
