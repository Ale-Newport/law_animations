/**
 * Motif kit for "Intervención de tercero" (LAW-0273..0276): fields, fictional defaults, the relation stage, its
 * choreography and its solver. Each entry owns its own timeline, layout, labels and semantics. Copied from
 * acumulacion-pretensiones.js (copied, not imported) and built on the civil-claim kits (civil-claim-art.js,
 * requerimiento-previo.js, presentacion-demanda.js, contestacion-estructurada.js, reconvencion-ilustrativa.js), used
 * read-only.
 *
 * The stage (side view of an open room, stage units, floor at y = 0):
 *   Party C (the newcomer, a fictional third party) standing at the left beside her tray (bandeja), which holds her card
 *   — the request to intervene, as supplied — with a push bar behind it · in the middle the case file (expediente) stands
 *   open on an easel: it represents the procedural relation, with one slot per card — Party A's and Party B's cards stand
 *   in theirs from the start, the third slot is empty, level with Party C's tray · the calendar hangs on the wall to the
 *   right of the easel · Party A and Party B stand at the right.
 * Action (clock c ∈ [0,1], `choreo`): Party C's hand takes the push bar and pushes her card rightwards out of the tray
 *   towards the case file; she lets go at the tray's end and the card glides on into the empty slot. Every card keeps its
 *   own label; the newcomer's card is drawn exactly like the others (same size, colour and stroke).
 * Configuration marks (`pose(v)`: v.initP, v.reqP — never both at once): "initial relation" (●) draws ONE frame and ONE
 *   spine round Party A's and Party B's cards; "intervention requested" (◆) draws ONE frame and ONE spine round all three
 *   slots. Both are supplied configurations drawn with the same stroke and weight; the plate at the foot of the board
 *   names the one shown, with its glyph.
 * Nothing here states a rule for intervention (standing, interest, types, admission or refusal, effects, outcomes): the
 *   request is shown only as supplied — never as granted or refused — and both configurations are supplied values of
 *   this fictional example, shown with equal weight.
 * @module animations/civil-claim/kits/intervencion-tercero
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {glue, backWall} from './civil-claim-art.js';
import {hit, partyCaption} from './requerimiento-previo.js';
import {actorLook} from '../../../primitives/people-style.js';
import {wchip, fitWords} from '../../roles/kits/mediation-labels.js';
import {localizeDefaults} from './presentacion-demanda.js';
import {caseFileW} from './contestacion-estructurada.js';
import {calendarStrip} from './civil-claim-art.js';
import {stateGlyph, claimSheet} from './reconvencion-ilustrativa.js';

export {hit, partyCaption, glue, localizeDefaults, caseFileW, stateGlyph, claimSheet};

/* ======================================================================== */
/* Wrapping without one-word lines                                           */
/* ======================================================================== */

/** Whether a wrapped line holds a single word (no space, plain or non-breaking). */
const lone = ln => !/[\s\u00a0]/.test(String(ln).trim());
/**
 * Re-glue a (glued) text until its wrap leaves no one-word line: the lone word is joined by a non-breaking space to the
 * word before it (or, on the first line, to the word after it), and the text is wrapped again; a join that would cut
 * the text or overflow the box is not taken. `fitOf(text)` returns {lines, truncated, width}; `maxW` bounds the width.
 * @param {string} text  already glued
 * @param {(t:string)=>any} fitOf
 * @param {number} maxW
 */
export function noLone(text, fitOf, maxW) {
  // (a glyph — ●, ◆, Δ, ◦ — always stays with the word after it, at the start of the text or anywhere inside it,
  // e.g. the "· ◆ Intervention requested" half of the configuration key; the fitter carries the no-break space as glue)
  // (and a lone separator — ·, –, : — stays with the word before it, as the fitter keeps it)
  let t = String(text).replace(/(^|[\s\u00a0])([●◆Δ◦])[ \u00a0]+/gu, '$1$2\u00a0').replace(/ ([·•–—|:])(?= |$)/gu, '\u00a0$1'), f = fitOf(t);
  for (let it = 0; it < 8; it++) {
    const lines = f.lines || [];
    if (lines.length < 2 || f.truncated) return t;
    const i = lines.findIndex(lone);
    if (i < 0) return t;
    const toks = t.split(' ');
    // (the lines are shown with plain spaces: the tokens of the lines before the lone one are counted by matching them)
    let k = 0;
    for (const ln of lines.slice(0, i)) {
      const want = String(ln).trim();
      let acc = '';
      while (k < toks.length && acc !== want) { const d = toks[k].replace(/\u00a0/g, ' '); acc = acc ? `${acc} ${d}` : d; k++; }
    }
    let done = false;
    for (const j of k > 0 ? [k - 1, k] : [k]) {
      if (j < 0 || j + 1 >= toks.length) continue;
      const t2 = [...toks.slice(0, j), `${toks[j]}\u00a0${toks[j + 1]}`, ...toks.slice(j + 2)].join(' ');
      const f2 = fitOf(t2);
      if (!f2.truncated && f2.width <= maxW + 0.5) { t = t2; f = f2; done = true; break; }
    }
    if (!done) return t;
  }
  return t;
}
/** fitWords with glued numbers and no one-word line (same result shape as core fitText). */
export function fitG(text, o) {
  const f = s => fitWords(s, o);
  return f(noLone(glue(text), f, o.maxWidth));
}
/** The glued text a fitter with these options wraps without a one-word line (for props that fit their own text). */
export function gluedFor(text, o) {
  const f = s => fitWords(s, o);
  return noLone(glue(text), f, o.maxWidth);
}
/** Whether a fit still has a one-word line. */
export function hasLone(f) {
  return (f.lines || []).length > 1 && f.lines.some(lone);
}
/** Chip with glued text and no one-word line. */
export function gchip(ctx, text, o) {
  const f = s => wchip(ctx, s, {...o, name: undefined}).fit;
  return wchip(ctx, noLone(glue(text), f, o.maxWidth), o);
}
/** The neutral "as supplied · no conclusion drawn" key chip. */
export function keyChip(ctx, o) {
  const th = ctx.theme;
  return gchip(ctx, `◦ ${ctx.t.key}`, {x: o.x, y: o.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: o.name ?? 'key'});
}
const TAG_PROBES = new WeakMap();
/** Measured size of a tag chip at one width (memoised per layout pass). */
function probeTag(ctx, o, mw, mkW) {
  let m = TAG_PROBES.get(ctx);
  if (!m) { m = new Map(); TAG_PROBES.set(ctx, m); }
  const key = `${o.text}\u0000${o.size}\u0000${mw}\u0000${o.maxLines ?? 5}`;
  if (!m.has(key)) { const c = mkW(0, 0, mw); m.set(key, {w: c.box.w, h: c.box.h, truncated: c.fit.truncated, lone: hasLone(c.fit)}); }
  return m.get(key);
}
/**
 * A tag chip placed beside an anchor, clear of occupied boxes, with a dotted leader (copied from
 * requerimiento-previo.js `placeTag`, using this kit's chips: no one-word line).
 */
export function placeTag(ctx, o) {
  const th = ctx.theme;
  const mkW = (x, y, mw) => gchip(ctx, o.text, {x, y, anchor: 'start', maxWidth: mw, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 5, fill: th.card, stroke: o.color, color: th.ink, weight: 700, name: `${o.name}-chip`});
  const A = o.anchor;
  const maxLead = o.maxLead ?? 34;
  const inside = b => b.x >= o.bounds.x && b.y >= o.bounds.y && b.x + b.w <= o.bounds.x + o.bounds.w && b.y + b.h <= o.bounds.y + o.bounds.h;
  const nearest = b => ({x: clamp(A.x, b.x, b.x + b.w), y: clamp(A.y, b.y, b.y + b.h)});
  let best = null, bestHits = Infinity, mwBest = o.maxWidth;
  const widestGroup = Math.max(...glue(o.text).split(' ').filter(Boolean).map(t => ctx.measure(t.replace(/\u00a0/g, ' '), o.size, 700, 'sans'))) + o.size * 1.8;
  const widths = (o.narrow ? [1, 0.72, 0.52, 0.4, 0.3] : [1, 0.72, 0.52]).map(f => Math.max(o.size * (o.narrow ? 4 : 5), o.maxWidth * f, Math.min(o.maxWidth, widestGroup)));
  // (widths that leave a one-word line are passed over, unless every width does)
  const noLoneW = widths.filter(mw => !probeTag(ctx, o, mw, mkW).lone);
  for (const mw of noLoneW.length ? noLoneW : widths) {
    const probe = probeTag(ctx, o, mw, mkW);
    if (probe.truncated) continue;
    const w = probe.w, hh = probe.h;
    const Rx = maxLead + w + 10, Ry = maxLead + hh + 10;
    const occ = o.occupied.filter(z => z.x < A.x + Rx && z.x + z.w > A.x - Rx && z.y < A.y + Ry && z.y + z.h > A.y - Ry);
    for (let d = 6; d <= maxLead + 1e-6; d += 4) {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const cx = A.x + Math.cos(a) * (d + w / 2 * Math.abs(Math.cos(a)));
        const cy = A.y + Math.sin(a) * (d + hh / 2);
        const b = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
        const q = nearest(b);
        const lead = Math.hypot(q.x - A.x, q.y - A.y);
        if (lead > maxLead || lead < 4) continue;
        if (!inside(b)) continue;
        const inB = (pt, z) => pt.x > z.x + 1 && pt.x < z.x + z.w - 1 && pt.y > z.y + 1 && pt.y < z.y + z.h - 1;
        const leadHits = occ.filter(z => !inB(A, z) && [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].some(t => inB({x: q.x + (A.x - q.x) * t, y: q.y + (A.y - q.y) * t}, z))).length;
        const hits = occ.filter(z => hit(b, z, 6)).length + leadHits;
        if (hits === 0) { best = {b, lead}; bestHits = 0; mwBest = mw; break; }
        if (hits < bestHits) { bestHits = hits; best = {b, lead}; mwBest = mw; }
      }
      if (bestHits === 0) break;
    }
    if (bestHits === 0) break;
  }
  const mk = (x, y) => mkW(x, y, mwBest);
  const probe = mk(0, 0);
  const w = probe.box.w, hh = probe.box.h;
  if (!best) best = {b: {x: clamp(A.x + 10, o.bounds.x, o.bounds.x + o.bounds.w - w), y: clamp(A.y - hh - 10, o.bounds.y, o.bounds.y + o.bounds.h - hh), w, h: hh}, lead: 0};
  const c = mk(best.b.x, best.b.y);
  const b = c.box;
  const q = nearest(b);
  const lead = Math.hypot(q.x - A.x, q.y - A.y);
  const node = g({name: o.name, opacity: 0},
    lead > 3 ? h('path', {d: `M${r(q.x)} ${r(q.y)}L${r(A.x)} ${r(A.y)}`, stroke: o.color, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}) : null,
    h('circle', {cx: r(A.x), cy: r(A.y), r: 5.5, fill: o.color, stroke: th.card, 'stroke-width': 2}),
    c.node);
  return {node, box: b, fit: c.fit, lead, clear: bestHits === 0, anchor: A};
}

const INK = '#1f2328';
const FOLDER = '#f0d58c';
const FOLDER_TAB = '#e2bf6a';
/** the configuration marks (relation frames and spines): one colour and one stroke for both configurations */
const MARK = '#35556b';
const MARK_W = 3.2;
export const PK0 = 1.3;
/** the newcomer's card is the last row of the represented relation */
export const NEW = 2;

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

export const partiesField = list('Party A, Party B (the initial relation) and Party C (the newcomer, a fictional third party), in this order', party, 3, 3);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) standing open on the easel: it represents the procedural relation', {ref: str('Reference on the case file', 30), title: str('Title on the case file', 60)}, ['ref', 'title']),
  request: str('Label of Party C’s card: the request to intervene, shown as supplied (never as granted or refused)', 80),
}, ['caseFile', 'request']);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  window: list('Day labels of the calendar (as supplied)', str('Day label', 24), 2, 7),
  requestDay: int('Zero-based index of the day Party C’s card is brought to the case file (as supplied)', 0, 6),
}, ['window', 'requestDay']);
export const stagesField = obj('Captions of the two supplied configurations of the represented relation (descriptive only)', {
  initial: str('Caption of the configuration "initial relation" (●: one frame round Party A and Party B)', 60),
  requested: str('Caption of the configuration "intervention requested" (◆: one frame round Party A, Party B and Party C’s card)', 60),
}, ['initial', 'requested']);
export const labelProps = {
  calendar: str('Title on the calendar', 50),
  trays: str('Label plate under Party C’s tray', 40),
};

export const IT_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Claimant'}, {name: 'Party B', role: 'Respondent'}, {name: 'Party C', role: 'Third party (fictional)'}],
  documents: {
    caseFile: {ref: 'CF-0915', title: 'Case file · fictional dispute'},
    request: 'Party C · request to intervene (as supplied)',
  },
  dates: {window: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], requestDay: 2},
  stages: {initial: 'Initial relation (as supplied)', requested: 'Intervention requested (as supplied)'},
  labels: {calendar: 'Calendar (as supplied)', trays: 'Party C · tray'},
};
export const IT_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Demandante'}, {name: 'Parte B', role: 'Demandada'}, {name: 'Parte C', role: 'Tercero (ficticio)'}],
  documents: {
    caseFile: {ref: 'EXP-0915', title: 'Expediente · disputa ficticia'},
    request: 'Parte C · solicitud de intervención (aportada)',
  },
  dates: {window: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'], requestDay: 2},
  stages: {initial: 'Relación inicial (aportada)', requested: 'Intervención solicitada (aportada)'},
  labels: {calendar: 'Calendario (aportado)', trays: 'Parte C · bandeja'},
};
export const IT_COMMON_ES = {parties: IT_DEFAULTS_ES.parties, documents: IT_DEFAULTS_ES.documents, stages: IT_DEFAULTS_ES.stages, dates: IT_DEFAULTS_ES.dates};

export const IT_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied', sequence: 'Sequence as configured (illustrative)'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'aportado', sequence: 'Secuencia según la configuración (ilustrativa)'},
};

/** The "● initial relation · ◆ intervention requested" key text (equal-weight solid glyphs). */
export function configKeyText(p) {
  // (single spaces: the separator stays glued to the caption before it, so no line starts with it)
  return `● ${p.stages.initial} · ◆ ${p.stages.requested}`;
}
/** The request day index clamped to the supplied day labels. */
export function dayOf(p) {
  const n = p.dates.window.length;
  return Math.max(0, Math.min(n - 1, p.dates.requestDay));
}
/** The three cards of the represented relation: Party A's, Party B's and Party C's request card (the newcomer, last). */
export function cardTexts(p) {
  return [p.parties[0].name, p.parties[1].name, p.documents.request];
}
/** Seeded looks of the three people (overrides win). */
export function looksOf3(ctx, p) {
  return {a: actorLook(ctx, p.parties[0], 0), b: actorLook(ctx, p.parties[1], 1), c: actorLook(ctx, p.parties[2], 2)};
}

/* ======================================================================== */
/* Art: standing case file                                                   */
/* ======================================================================== */

/**
 * Standing case file seen from the front (copied from civil-claim-art.js `caseFile`, copied not imported). Here its
 * cover's height follows `o.aspect` (default 1.05 × its width) — a wide cover, widened so that its title wraps with no
 * one-word line, need not grow as tall — and its texts are fitted with no one-word line. Local origin = bottom-left
 * corner of the front cover.
 * @param {any} ctx
 * @param {{prefix:string, w:number, ref:string, title:string, size:number, showText:boolean, color?:string, aspect?:number}} o
 */
export function caseFileArt(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts} = o;
  const c = o.color || '#c9a15e';
  const pad = ts * 0.55;
  const inner = w - pad * 2 - ts * 0.6;
  const refFit = fitG(o.ref, {maxWidth: w * 0.8 - ts * 0.6, size: ts, minSize: ts, maxLines: 3, weight: 700, family: 'mono'});
  const titleFit = fitG(o.title, {maxWidth: inner - ts * 0.4, size: ts, minSize: ts, maxLines: 7, weight: 700, family: 'serif'});
  const tabH = refFit.height + ts * 0.7;
  const tabW = Math.max(w * 0.46, refFit.width + ts * 1.1);
  const plateH = titleFit.height + ts * 0.9;
  const bodyH = Math.max(w * (o.aspect ?? 1.05), plateH + ts * 3.2);
  const H = bodyH + tabH;
  const top = -bodyH;
  const px = ts * 0.9, py = top + ts * 1.1;
  const bar = (x, y, ww) => h('rect', {'data-bar': 1, x: r(x), y: r(y), width: r(ww), height: r(ts * 0.3), rx: 3, fill: th.paperLine});
  const parts = [
    h('path', {d: roundRectPath(8, top - 4, w, bodyH + 4, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(ts * 0.35, top - ts * 0.45, w, bodyH, 9), fill: shade(c, -0.22), stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(ts * 0.5), y: r(top - ts * 0.3), width: r(w - ts * 0.4), height: r(ts * 0.5), rx: 3, fill: th.paper, stroke: INK, 'stroke-width': 1.4}),
    h('rect', {x: r(ts * 0.62), y: r(top - ts * 0.18), width: r(w - ts * 0.6), height: r(ts * 0.45), rx: 3, fill: th.paperShade, stroke: INK, 'stroke-width': 1.2}),
    h('path', {d: `M${r(w - tabW - 6)} ${r(top + 2)}V${r(top - tabH + 8)}Q${r(w - tabW - 6)} ${r(top - tabH)} ${r(w - tabW + 2)} ${r(top - tabH)}H${r(w - 14)}Q${r(w - 6)} ${r(top - tabH)} ${r(w - 6)} ${r(top - tabH + 8)}V${r(top + 2)}Z`, fill: shade(c, 0.1), stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(0, top, w, bodyH, 9), fill: c, stroke: INK, 'stroke-width': 2.8}),
    h('rect', {x: 0, y: r(top), width: r(ts * 0.6), height: r(bodyH), rx: 4, fill: shade(c, -0.18)}),
    h('path', {d: roundRectPath(0, top, w, bodyH, 9), fill: 'none', stroke: INK, 'stroke-width': 2.8}),
    h('rect', {x: r(w - ts * 1.1), y: r(top), width: r(ts * 0.34), height: r(bodyH), fill: '#5b4b6b', opacity: 0.85}),
    h('path', {d: roundRectPath(px, py, inner, plateH, 6), fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(px), y: r(py + plateH + ts * 0.5), width: r(inner * 0.6), height: r(ts * 0.3), rx: 2, fill: shade(c, -0.14)}),
  ];
  if (o.showText) {
    parts.push(textBlock(refFit, {x: w - tabW - 6 + (tabW - 8) / 2, y: top - tabH + ts * 0.35, anchor: 'middle', fill: INK, name: `${o.prefix}-ref`}));
    parts.push(textBlock(titleFit, {x: px + ts * 0.2, y: py + ts * 0.45, fill: INK, name: `${o.prefix}-title`}));
  } else {
    parts.push(bar(w - tabW + ts * 0.2, top - tabH + ts * 0.5, (tabW - ts * 1.2) * 0.8));
    titleFit.lines.forEach((_, i) => parts.push(bar(px + ts * 0.2, py + ts * 0.5 + i * ts * 1.18, (inner - ts * 0.4) * (i % 2 ? 0.6 : 0.85))));
  }
  return {node: g({name: o.prefix}, parts), w, h: H, bodyH, box: {x: 0, y: -H, w: w + ts * 0.4, h: H}, refFit, titleFit};
}

/* ======================================================================== */
/* Art: a party card                                                         */
/* ======================================================================== */

/**
 * A party card (a folder): a tab at its top left, its body and a white label sticker that carries the card's own label
 * (or filler bars when the text is printed elsewhere). All three cards are drawn alike: the newcomer's card has the same
 * size, colour and stroke as the others. Origin = top-left of the tab.
 */
function folder(ctx, o) {
  const th = ctx.theme;
  const {w, hgt, size: ts, tabH} = o;
  const pad = ts * 0.5;
  const sx = pad * 0.6, sy = tabH + pad * 0.45, sw = w - pad * 1.2, sh = hgt - tabH - pad * 0.9;
  const parts = [
    h('path', {d: roundRectPath(3, tabH + 4, w, hgt - tabH, 5), fill: th.shadow}),
    h('path', {d: roundRectPath(pad, 0, w * 0.34, tabH + 8, 4), fill: FOLDER_TAB, stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(0, tabH, w, hgt - tabH, 5), fill: FOLDER, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(sx, sy, sw, sh, 4), fill: th.paper, stroke: INK, 'stroke-width': 1.4}),
  ];
  if (o.fit) parts.push(textBlock(o.fit, {x: sx + pad * 0.5, y: sy + (sh - o.fit.height) / 2, fill: INK, name: `${o.prefix}-text`}));
  else {
    parts.push(h('rect', {'data-bar': 1, x: r(sx + pad * 0.5), y: r(sy + sh / 2 - ts * 0.36), width: r((sw - pad) * 0.8), height: r(ts * 0.28), rx: 3, fill: th.paperLine}));
    parts.push(h('rect', {'data-bar': 1, x: r(sx + pad * 0.5), y: r(sy + sh / 2 + ts * 0.1), width: r((sw - pad) * 0.5), height: r(ts * 0.28), rx: 3, fill: th.paperLine}));
  }
  return g({name: o.prefix}, parts);
}

/* ======================================================================== */
/* Stage                                                                     */
/* ======================================================================== */

const STAGE_CACHE = new WeakMap();
const IDS = new WeakMap();
let seq = 0;
const idOf = v => (v && typeof v === 'object' ? (IDS.get(v) ?? (IDS.set(v, ++seq), seq)) : 0);

/**
 * Build the relation stage (memoised per layout pass).
 * @param {any} ctx
 * @param {{prefix:string, ts:number, p:any, looks:{a:any,b:any,c:any}, showText:boolean, compact?:boolean, compactTs?:number,
 *   peopleK?:number, lwK?:number, rowK?:number, boardOnly?:boolean|'focus', wallExtra?:number, wallExtraX?:number,
 *   wallExtraL?:number, calHigh?:boolean|'right', trayGap?:number, aGap?:number, abGap?:number, trayPad?:number,
 *   peopleMargin?:number}} o
 */
export function deskStage(ctx, o) {
  let cache = STAGE_CACHE.get(ctx);
  if (!cache) { cache = new Map(); STAGE_CACHE.set(ctx, cache); }
  const key = JSON.stringify(Object.keys(o).sort().map(k => [k, k === 'p' || k === 'looks' ? idOf(o[k]) : typeof o[k] === 'number' ? Math.round(o[k] * 1e4) / 1e4 : o[k]]));
  if (cache.has(key)) return cache.get(key);
  const st = stageAt(ctx, o);
  if (cache.size > 24) cache.delete(cache.keys().next().value);
  cache.set(key, st);
  return st;
}

function stageAt(ctx, o) {
  const th = ctx.theme;
  const {prefix: P, ts, p} = o;
  const lts = o.compact ? Math.min(ts, o.compactTs ?? 20) : ts;
  const printed = o.showText && !o.compact;
  const PK = PK0 * (o.peopleK ?? 1);
  const q = PK / PK0;
  const d = p.documents;
  const cards = cardTexts(p);
  const n = cards.length;
  // ---- the cards (all the same width; never narrower than their longest word)
  const pad = lts * 0.5;
  const R = lts * (printed ? 0.5 : 0.66);
  const tabH = lts * 0.55;
  const wordW = printed ? Math.max(...[...cards, p.stages.initial, p.stages.requested].flatMap(t => glue(t).split(' ')).map(w => ctx.measure(w.replace(/ /g, ' '), lts, 700, 'sans'))) : 0;
  let SW = Math.max(lts * (o.lwK ?? 9), o.compact ? 130 : 200, wordW + lts * 2.6);
  // (the cards widen until the plate's captions wrap with no one-word line)
  const plOpt = sw => ({maxWidth: sw + lts * 1.1 + 10 - R * 3.2 - lts * 0.6, size: lts, minSize: lts, maxLines: 3, weight: 700});
  for (let i = 0; i < 8 && printed && [p.stages.initial, p.stages.requested].some(t => hasLone(fitG(t, plOpt(SW)))); i++) SW *= 1.1;
  const textW = SW - pad * 2.2;
  const fits = cards.map(t => (printed ? fitG(t, {maxWidth: textW, size: lts, minSize: lts, maxLines: 4, weight: 600}) : null));
  // (o.rowK: taller blank cards on compact props — the contrast's rooms, where the cards print no text)
  const rowHs = fits.map(f => tabH + pad * 0.9 + (printed ? f.height + pad * 0.9 : lts * (o.rowK ?? 1.5)));
  // (each slot keeps room round it for the frames: a frame never touches a card)
  const gapR = Math.max(lts * 1.1, 26);
  const colH = rowHs.reduce((a, b) => a + b, 0) + gapR * (n - 1);
  const rowTop0 = rowHs.map((_, i) => rowHs.slice(0, i).reduce((a, b) => a + b, 0) + gapR * i);
  // ---- the board: header (case file), the slots column (spine strip at its left), the configuration plate
  const bp = lts * 0.7;
  const spineW = lts * 1.1;
  const BW = SW + bp * 2 + spineW + 10;
  const cfFit = printed ? fitG(`${d.caseFile.ref} · ${d.caseFile.title}`, {maxWidth: BW - lts * 1.4, size: lts, minSize: lts, maxLines: 4, weight: 700}) : null;
  const cfHead = (printed ? cfFit.height : lts * 1.2) + lts * 0.8;
  const plW = BW - bp * 2;
  const plFits = [p.stages.initial, p.stages.requested].map(t => (printed ? fitG(t, {maxWidth: plW - R * 3.2 - lts * 0.6, size: lts, minSize: lts, maxLines: 3, weight: 700}) : null));
  const plH = Math.max(printed ? Math.max(...plFits.map(f => f.height)) + lts * 0.7 : lts * 1.2, R * 2.9);
  // vertical: the newcomer's row (the last) at about chest height (the hand pushes the bar level with it)
  let yK = -262 * PK;
  let colTop = yK - rowTop0[NEW] - rowHs[NEW] / 2;
  let plateY = colTop + colH + bp * 1.4;
  let boardBottom = plateY + plH + bp * 0.7;
  // (a tall column never sinks to the floor: the board keeps its easel legs)
  const lift = Math.max(0, boardBottom + 70 * q);
  yK -= lift; colTop -= lift; plateY -= lift; boardBottom -= lift;
  const colBot = colTop + colH;
  const boardTop = colTop - bp - cfHead;
  const BH = boardBottom - boardTop;
  const rowTop = i => colTop + rowTop0[i];
  // ---- horizontal: C · her tray and push bar · board · calendar · A · B
  const reach = (80 + 76 + 9) * PK * 0.96;
  const shoulderY = -302 * PK;
  const dyG = Math.abs(yK - shoulderY);
  const reachX = Math.sqrt(Math.max(0, (reach * 0.92) ** 2 - dyG ** 2));
  const xC = 0;
  const shoulderC = {x: xC + 12 * PK, y: shoulderY};
  const pw = 11 * q;
  const trayW = SW + (o.trayPad ?? 30) * q;
  // (the tray stands clear of Party C's figure: a frame drawn round the tray and the board never crosses her)
  const trayX0 = xC + Math.max((o.trayGap ?? 72) * PK, 12 * PK + reachX * 0.45);
  const barX0 = trayX0 + 6 * q;
  const startX = barX0 + pw + 2 * q;
  const boardX0 = trayX0 + trayW + 8 * q;
  const spineX = boardX0 + bp;
  const rowX = spineX + spineW + 10;
  const travel = rowX - startX;
  const startGrip = {x: barX0 + pw / 2, y: yK};
  const pushMax = Math.max(0, shoulderC.x + reachX - startGrip.x);
  // (the bar runs on the tray: it stops at the tray's end, past which the card glides on alone)
  const railMax = trayW - pw - 12 * q;
  const pushD = Math.min(travel, pushMax, railMax);
  const restP = {x: xC + 40 * PK, y: -180 * PK};
  // (o.calHigh: the calendar hangs high on the wall above the tray and the board — a narrower room, larger people)
  let calX0 = o.calHigh ? trayX0 : boardX0 + BW + 18 * q;
  const days = p.dates.window;
  let calW = o.calHigh ? boardX0 + BW - trayX0 : Math.max(lts * 8.5, SW * 0.72);
  // (the calendar widens until its title wraps with no one-word line)
  for (let i = 0; i < 6 && printed && hasLone(fitG(p.labels.calendar, {maxWidth: calW - lts * 2.4, size: lts, minSize: lts, maxLines: 3, weight: 700})); i++) calW *= 1.1;
  const xA = (o.calHigh ? boardX0 + BW + 10 * PK : calX0 + calW) + (o.aGap ?? 62) * PK;
  const xB = xA + (o.abGap ?? 132) * PK;
  // (o.calHigh 'right': the calendar hangs high on the wall above Party A and Party B instead — the wall above the board
  // stays free)
  if (o.calHigh === 'right') { calX0 = xA - 50 * PK; calW = xB - xA + 100 * PK; }
  // ---- Party C's tray and its plate
  const tyTop = rowTop(NEW) - lts * 0.3, tyBot = rowTop(NEW) + rowHs[NEW] + lts * 0.3;
  const lipH = lts * 0.45;
  const trayBack = h('path', {d: roundRectPath(trayX0, tyTop, trayW, tyBot - tyTop, 6), fill: '#dfe7ec', stroke: INK, 'stroke-width': 2});
  const trayFront = h('rect', {x: r(trayX0 - 4), y: r(tyBot - 4), width: r(trayW + 8), height: r(lipH), rx: 3, fill: '#8aa2b1', stroke: INK, 'stroke-width': 2.2});
  const rackPosts = h('path', {d: `M${r(trayX0 + 6)} ${r(tyTop - 6)}V-2M${r(trayX0 + trayW - 6)} ${r(tyTop - 6)}V-2`, stroke: '#6b7f8c', 'stroke-width': r(8 * q), 'stroke-linecap': 'round'});
  const plTFit = printed ? fitG(p.labels.trays, {maxWidth: trayW - lts, size: lts, minSize: lts, maxLines: 3, weight: 700}) : null;
  const plTH = printed ? plTFit.height + lts * 0.6 : lts * 1.2;
  const plTY = tyBot + lipH + lts * 0.5;
  const rackPlate = g({name: `${P}-plT`},
    h('rect', {x: r(trayX0 + 3), y: r(plTY + 3), width: r(trayW), height: r(plTH), rx: 5, fill: th.shadow}),
    h('rect', {x: r(trayX0), y: r(plTY), width: r(trayW), height: r(plTH), rx: 5, fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    plTFit ? textBlock(plTFit, {x: trayX0 + trayW / 2, y: plTY + (plTH - plTFit.height) / 2, anchor: 'middle', fill: INK, name: `${P}-plT-text`})
      : h('rect', {'data-bar': 1, x: r(trayX0 + trayW * 0.2), y: r(plTY + plTH / 2 - lts * 0.18), width: r(trayW * 0.6), height: r(lts * 0.36), rx: 3, fill: th.paperLine}));
  // ---- the push bar (stands in the tray behind the card; its grip level with the card's middle)
  const barTop = rowTop(NEW) - lts * 0.5, barBot = rowTop(NEW) + rowHs[NEW] + lts * 0.5;
  const bar = g({name: `${P}-bar`},
    h('path', {d: roundRectPath(barX0, barTop, pw, barBot - barTop, pw / 2), fill: '#7a5a3a', stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(barX0 + pw / 2), cy: r(yK), r: r(pw * 0.9), fill: '#5c4128', stroke: INK, 'stroke-width': 2}));
  // ---- calendar on the wall right of the board
  let cols = days.length;
  const minCell = printed ? Math.max(...days.map(dd => ctx.measure(glue(dd).replace(/ /g, ' '), lts, 700, 'sans'))) + lts * 1.1 : lts * 3;
  while (cols > 1 && calW / cols < minCell - 0.5) cols--;
  if (cols < days.length) cols = Math.ceil(days.length / Math.ceil(days.length / cols));
  const calTitle = gluedFor(p.labels.calendar, {maxWidth: calW - lts * 2.4, size: lts, minSize: lts, maxLines: 3, weight: 700});
  const calOpts = {prefix: `${P}-cal`, x: calX0, w: calW, cols, days, title: calTitle, size: lts, showText: printed, showTitle: !o.compact, slotH: lts * 1.5};
  const calY = o.calHigh === 'right' ? -420 * PK - lts * 1.4 - calendarStrip(ctx, {...calOpts, y: 0}).h : o.calHigh ? boardTop - lts * 1.6 - calendarStrip(ctx, {...calOpts, y: 0}).h : boardTop + lts * 1.2;
  const cal = calendarStrip(ctx, {...calOpts, y: calY});
  // ---- the configuration marks: ● one frame and one spine round Party A's and Party B's cards (the initial relation);
  // ◆ one frame and one spine round all three slots (the intervention requested). The same stroke and weight.
  const fr = 7;
  const spanFrame = (i0, i1) => {
    const y0 = rowTop(i0), y1 = rowTop(i1) + rowHs[i1];
    return [
      h('path', {d: roundRectPath(spineX - 4, y0 - fr - 2, rowX + SW + fr - spineX + 4, y1 - y0 + 2 * fr + 4, 8), fill: 'none', stroke: MARK, 'stroke-width': MARK_W}),
      h('path', {d: roundRectPath(spineX + spineW * 0.2, y0 - 2, spineW * 0.6, y1 - y0 + 4, spineW * 0.3), fill: MARK, stroke: INK, 'stroke-width': 2}),
    ];
  };
  const initMarks = g({name: `${P}-mi`, opacity: 0}, spanFrame(0, 1));
  const reqMarks = g({name: `${P}-mr`, opacity: 0}, spanFrame(0, n - 1));
  // the plate at the foot of the board: blank until a configuration is shown; its glyph and caption
  const plX = boardX0 + bp;
  const plateText = (k, kind) => g({name: `${P}-p${k}`, opacity: 0},
    stateGlyph(ctx, {name: `${P}-p${k}-glyph`, kind, x: plX + R * 1.6, y: plateY + plH / 2, R}),
    printed ? textBlock(plFits[k === 'i' ? 0 : 1], {x: plX + R * 3.2, y: plateY + (plH - plFits[k === 'i' ? 0 : 1].height) / 2, fill: INK, name: `${P}-p${k}-text`}) : null);
  const plate = g(null,
    h('path', {d: roundRectPath(plX, plateY, plW, plH, 6), fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    plateText('i', 'initial'), plateText('r', 'additional'));
  // ---- the board (the open case file) and its easel
  const slots = cards.map((_, i) => h('path', {d: roundRectPath(rowX - 2, rowTop(i) - 2, SW + 4, rowHs[i] + 4, 5), fill: '#d9cfb8', stroke: INK, 'stroke-width': 1.2}));
  const boardBody = [
    h('path', {d: roundRectPath(boardX0 + 6, boardTop + 8, BW, BH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(boardX0, boardTop, BW, BH, 10), fill: '#c9a15e', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(boardX0 + lts * 0.3, boardTop + lts * 0.3, BW - lts * 0.6, cfHead - lts * 0.4, 6), fill: '#e8d3a8', stroke: INK, 'stroke-width': 1.8}),
    printed ? textBlock(cfFit, {x: boardX0 + BW / 2, y: boardTop + (cfHead - cfFit.height) / 2 + lts * 0.1, anchor: 'middle', fill: INK, name: `${P}-cf-text`})
      : h('rect', {'data-bar': 1, x: r(boardX0 + BW * 0.25), y: r(boardTop + cfHead / 2 - lts * 0.2), width: r(BW * 0.5), height: r(lts * 0.4), rx: 3, fill: '#b08a4e'}),
    h('path', {d: roundRectPath(spineX, colTop - 4, spineW, colH + 8, 5), fill: '#b48d50', stroke: INK, 'stroke-width': 1.2}),
    slots,
  ];
  const board = g({name: `${P}-board`},
    o.boardOnly ? null : h('path', {d: `M${r(boardX0 + BW * 0.2)} ${r(boardBottom - 6)}L${r(boardX0 + BW * 0.08)} 0M${r(boardX0 + BW * 0.8)} ${r(boardBottom - 6)}L${r(boardX0 + BW * 0.92)} 0`, stroke: '#7a5a3a', 'stroke-width': r(10 * q), 'stroke-linecap': 'round'}),
    boardBody, plate);
  // the cards: Party A's and Party B's stand in their slots from the start; Party C's card stands in her tray and is
  // the one that moves (each with its own label)
  const folders = cards.map((_, i) => g({name: `${P}-f${i}-g`, transform: T(i === NEW ? startX : rowX, rowTop(i))}, folder(ctx, {prefix: `${P}-f${i}`, w: SW, hgt: rowHs[i], size: lts, tabH, fit: fits[i]})));
  // ---- people: Party C (the newcomer) at the left, beside her tray; Party A and Party B at the right
  const rigA = personRig(ctx, {name: `${P}-pa`, look: o.looks.a, pose: 'standing'});
  const rigB = personRig(ctx, {name: `${P}-pb`, look: o.looks.b, pose: 'standing'});
  const rigC = personRig(ctx, {name: `${P}-pc`, look: o.looks.c, pose: 'standing'});
  const R0 = 46 * PK;
  const heads = {a: {x: xA - 5 * PK, y: -366 * PK}, b: {x: xB - 5 * PK, y: -366 * PK}, c: {x: xC + 5 * PK, y: -366 * PK}};
  const wallTop = -(o.wallExtra ?? 0) + Math.min(calY - lts * 1.4, boardTop - lts, -420 * PK);
  // (o.peopleMargin, in people units: a tightened wall never ends inside a person — Party C's back arm and hair at the
  // left, Party B's at the right stay inside the room by at least this half-width from their centres)
  const pm = o.peopleMargin ? o.peopleMargin * PK : 0;
  const x0 = Math.min(-110 * PK - (o.wallExtraL ?? 0), pm ? xC - pm : Infinity), x1 = Math.max(xB + 110 * PK + (o.wallExtraX ?? 0), pm ? xB + pm : -Infinity);
  // (o.boardOnly 'focus': Party C's tray with its bar and card, and the slots column, its marks and the plate on a piece
  // of the board — a lens copy whose every piece lies wholly inside the region it shows)
  const rowPanel = {x: spineX - bp, y: colTop - bp, w: rowX + SW + bp - (spineX - bp), h: plateY + plH + bp * 0.6 - (colTop - bp)};
  const focusPanel = {x: trayX0 - 10, y: rowPanel.y, w: rowPanel.x + rowPanel.w - (trayX0 - 10), h: Math.max(rowPanel.h, tyBot + lipH + 6 - rowPanel.y)};
  const focusNode = g(null,
    trayBack,
    h('path', {d: roundRectPath(rowPanel.x, rowPanel.y, rowPanel.w, rowPanel.h, 8), fill: '#c9a15e', stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(spineX, colTop - 4, spineW, colH + 8, 5), fill: '#b48d50', stroke: INK, 'stroke-width': 1.2}),
    slots, plate, folders, trayFront, initMarks, reqMarks, bar);
  const node = o.boardOnly === 'focus' ? g({name: P}, focusNode) : g({name: P},
    backWall(ctx, {x0, x1, top: wallTop, plantX: null}),
    cal.node(dayOf(p)),
    rackPosts,
    trayBack,
    board,
    folders,
    trayFront,
    initMarks, reqMarks,
    bar,
    rackPlate,
    rigC.node, rigA.node, rigB.node,
  );
  const box = (x, y, w, hh) => ({x, y, w, h: hh});
  const head = k => box(heads[k].x - R0, heads[k].y - R0 - 8, 2 * R0, 2 * R0 + 8);
  const person = x => box(x - 60 * PK, heads.a.y - R0 - 8, 120 * PK, -heads.a.y + R0 + 8);
  const boxes = {
    headA: head('a'), headB: head('b'), headC: head('c'),
    personA: person(xA), personB: person(xB), personC: person(xC),
    board: box(boardX0, boardTop, BW, BH + 8),
    legs: box(boardX0, boardBottom, BW, -boardBottom),
    rows: box(rowX, colTop, SW, colH),
    stripStart: box(barX0, rowTop(NEW) - lts * 0.5, startX + SW - barX0, rowHs[NEW] + lts),
    cal: box(calX0, calY - lts * 0.9, calW, cal.h + lts * 0.9),
    rack: box(trayX0 - 4, tyTop, trayW + 8, tyBot + lipH - tyTop),
    trays: [box(trayX0 - 4, tyTop, trayW + 8, tyBot - tyTop + lipH)],
    plates: [box(trayX0, plTY, trayW, plTH), box(plX, plateY, plW, plH)],
    rowPanel: box(rowPanel.x, rowPanel.y, rowPanel.w, rowPanel.h),
    focusPanel: box(focusPanel.x, focusPanel.y, focusPanel.w, focusPanel.h),
    initMarks: box(spineX - 4, rowTop(0) - fr - 2, rowX + SW + fr - spineX + 4, rowTop(1) + rowHs[1] - rowTop(0) + 2 * fr + 4),
    reqMarks: box(spineX - 4, rowTop(0) - fr - 2, rowX + SW + fr - spineX + 4, colH + 2 * fr + 4),
  };
  const G = {PK, ts: lts, SW, n, yK, colTop, colBot, rowTops: cards.map((_, i) => rowTop(i)), rowHs, startX, rowX, travel, pushD, startGrip, restP, xA, xB, xC, R, pw, barX0, spineX, plateY, plH, plX, plW};
  function pose(v) {
    const nodes = {};
    const fc = rigC.frame({x: xC, y: 0, facing: 1, scale: PK, lean: 0, near: v.hand, headTilt: 0});
    Object.assign(nodes, fc.nodes);
    const fa = rigA.frame({x: xA, y: 0, facing: -1, scale: PK, lean: 0, near: null, headTilt: 0});
    Object.assign(nodes, fa.nodes);
    const fb = rigB.frame({x: xB, y: 0, facing: -1, scale: PK, lean: 0, near: null, headTilt: 0});
    Object.assign(nodes, fb.nodes);
    // (v.cardOp: the card's opacity — set only by an entry that hides it; then emitted in every frame)
    nodes[`${P}-f${NEW}-g`] = v.cardOp === undefined ? {transform: T(r(startX + v.sheetD), r(rowTop(NEW)))} : {transform: T(r(startX + v.sheetD), r(rowTop(NEW))), opacity: r(clamp(v.cardOp), 3)};
    // (the bar follows the hand while it pushes; it stays at the tray's end once the hand lets go; v.barStill: no hand
    // pushes it — the card is placed as a datum — and the bar stays where it stands)
    const barD = v.barStill ? 0 : Math.min(v.sheetD, pushD);
    nodes[`${P}-bar`] = {transform: T(r(barD), 0)};
    const iP = clamp(v.initP ?? 0), rP = clamp(v.reqP ?? 0);
    nodes[`${P}-mi`] = {opacity: r(iP, 3)};
    nodes[`${P}-mr`] = {opacity: r(rP, 3)};
    nodes[`${P}-pi`] = {opacity: r(iP, 3)};
    nodes[`${P}-pr`] = {opacity: r(rP, 3)};
    Object.assign(nodes, cal.frame(1, v.markP, dayOf(p)).nodes);
    return {nodes, semantic: {hand: fc.hands.near, grip: v.hand, headA: fa.head, headB: fb.head, headC: fc.head, allReached: fc.reached, markP: r(v.markP, 3), barD: r(barD, 2), initP: r(iP, 3), reqP: r(rP, 3)}};
  }
  const em = o.compact ? 24 : lts * 0.6;
  const ext = {x: x0, y: wallTop - em, w: x1 - x0, h: -wallTop + em + 48};
  const fitsList = printed ? [...fits, ...plFits, cfFit, plTFit, cal.titleFit, ...cal.dayFits].filter(Boolean) : [];
  return {node, pose, G, boxes, heads, ext, fits: fitsList, cal, PK, wallExtra: o.wallExtra ?? 0};
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

/**
 * Action values for clock c: Party C's hand reaches the push bar, pushes her card rightwards out of her tray as far as
 * the tray allows, lets go — the card glides on into the empty slot of the represented relation — and comes back to rest.
 */
export function choreo(c, G) {
  const e = ease.inOutSine;
  const mix = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
  const reach = [0.06, 0.22], push = [0.22, 0.48], glide = [0.48, 0.8], back = [0.5, 0.66];
  let hand = G.restP, phase = 'rest';
  const pushT = ease.inQuad(seg(c, ...push));
  const pushD = G.pushD * pushT;
  const glideT = ease.outQuad(seg(c, ...glide));
  const sheetD = pushD + (G.travel - G.pushD) * glideT;
  const grip = {x: G.startGrip.x + pushD, y: G.startGrip.y};
  if (c >= reach[0] && c < reach[1]) { hand = mix(G.restP, G.startGrip, e(seg(c, ...reach))); phase = 'reach'; }
  else if (c >= reach[1] && c < push[1]) { hand = grip; phase = 'push'; }
  else if (c >= push[1] && c < back[1]) { hand = mix(grip, G.restP, e(seg(c, ...back))); phase = c < glide[1] ? 'glide' : 'return'; }
  if (c >= back[1]) phase = c < glide[1] ? 'glide' : 'rest';
  return {hand, sheetD, phase, slotted: glideT >= 1, markP: seg(c, 0.84, 0.94), pushed: r(pushT, 3)};
}

/* ======================================================================== */
/* Fitting a stage into a box                                                */
/* ======================================================================== */

/** Fit a stage into a design box (largest scale that fits; long supplied text may step the text down, m ≥ 0.82). */
export function solveStage(ctx, o) {
  let m = 1;
  const tsOf = sc => Math.round(((o.B * m) / sc) * 20) / 20;
  const build = sc => deskStage(ctx, {...o.opts, ts: tsOf(sc)});
  const fitsAt = sc => { const st = build(sc); return st.ext.w * sc <= o.availW && (st.ext.h - 30) * sc <= o.availH; };
  const solve = () => {
    let found = null, prev = null, lastW = Infinity, flat = 0;
    for (let sc = 1.6; sc >= (o.scMin ?? 0.2); prev = sc, sc *= 0.86) {
      if (fitsAt(sc)) { found = sc; break; }
      const st = build(sc);
      const wNow = Math.max(st.ext.w * sc / o.availW, (st.ext.h - 30) * sc / o.availH);
      flat = wNow > lastW * 0.985 ? flat + 1 : 0;
      lastW = wNow;
      if (flat >= 2) break;
    }
    if (found === null) return 0;
    let lo = found, hi = prev ?? found / 0.86;
    for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (fitsAt(mid)) lo = mid; else hi = mid; }
    return lo;
  };
  let sc = solve();
  if (!sc) {
    for (const mm of [0.94, 0.88, 0.82]) { m = mm; sc = solve(); if (sc) break; }
  }
  const fitted = Boolean(sc);
  if (!sc) sc = 0.2;
  let stage = build(sc);
  if (o.fillH && fitted) {
    const spare = o.availH / sc - (stage.ext.h - 30);
    if (spare > 2) stage = deskStage(ctx, {...o.opts, ts: tsOf(sc), wallExtra: Math.round(spare)});
  }
  return {stage, s: sc, m, fitted, ts: tsOf(sc)};
}

/** Place a solved stage in a box (centred in width, bottom-aligned above the chip band). */
export function placeStage(sol, f) {
  const s = sol.s;
  const E = sol.stage.ext;
  const h1 = (E.h - 30) * s;
  const free = Math.max(0, f.bottom - f.chipBand - f.top0 - h1);
  const top = f.top0 + free / 2;
  const ox = f.x0 + (f.availW - E.w * s) / 2 - E.x * s, oy = top - E.y * s + 2;
  const M = q2 => ({x: ox + q2.x * s, y: oy + q2.y * s});
  const Mb = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
  const bx = sol.stage.boxes;
  const boxes = Object.fromEntries(Object.entries(bx).map(([k, v]) => [k, Array.isArray(v) ? v.map(Mb) : Mb(v)]));
  return {s, ox, oy, M, Mb, boxes, floor: oy};
}
