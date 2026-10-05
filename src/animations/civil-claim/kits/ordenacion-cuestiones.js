/**
 * Motif kit for "Ordenación de cuestiones" (LAW-0277..0280): fields, fictional defaults, the sorting stage, its
 * choreography and its solver. Each entry owns its own timeline, layout, labels and semantics. Copied from
 * intervencion-tercero.js (copied, not imported) and built on the civil-claim kits (civil-claim-art.js,
 * requerimiento-previo.js, presentacion-demanda.js, contestacion-estructurada.js, reconvencion-ilustrativa.js), used
 * read-only.
 *
 * The stage (side view of an open room, stage units, floor at y = 0):
 *   Party A standing at the left beside her tray (bandeja), which holds the third issue card — as supplied — with a push
 *   bar behind it · in the middle the case file (expediente) stands open on an easel as a sorting board: two columns
 *   headed by the two supplied states of an issue (● agreed issue, ◆ open issue — the same plate, glyph size and stroke)
 *   and two subject rows, each headed by its supplied subject (Subject A above, Subject B below). Issue 1 (●) and Issue 2
 *   (◆) already stand in the Subject A row; the Subject B row is empty, level with Party A's tray · the calendar hangs on
 *   the wall · Party B stands at the right.
 * Action (clock c ∈ [0,1], `choreo`): Party A's hand takes the push bar and pushes the third card rightwards out of the
 *   tray towards the board; she lets go at the tray's end and the card glides on into the Subject B row, into the column
 *   of its supplied state (the ● column is the nearer one, the ◆ column the farther one). Every card keeps its own label
 *   and is drawn exactly like the others.
 * Group marks (`pose(v)`: v.groupP): ONE frame and ONE spine round each subject row (its header and its cards) — the
 *   cards grouped by subject, both frames with the same stroke and weight. The third card's state glyph (v.aP ● /
 *   v.oP ◆ — never both) follows its supplied state.
 * Nothing here states a rule for ordering issues (no pre-trial procedure, no power of a court, no binding effect of an
 *   agreed issue, no time limit, no outcome): "agreed" only means the supplied list marks the issue as agreed between the
 *   parties; "open" is a neutral pending state; both have equal weight; nothing is decided or proven.
 * @module animations/civil-claim/kits/ordenacion-cuestiones
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
  // e.g. the "· ◆ Open issue" half of the state key; the fitter carries the no-break space as glue)
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
/** the group marks (subject frames and spines): one colour and one stroke for both subjects */
const MARK = '#35556b';
const MARK_W = 3.2;
export const PK0 = 1.3;
/** the moving card (the third issue) is the last card */
export const NEW = 2;
/** the glyph kind of each state (stateGlyph: ● 'initial', ◆ 'additional') */
export const KIND = {agreed: 'initial', open: 'additional'};
/** the column of each state on the board: ● agreed the nearer one, ◆ open the farther one */
export const COL = {agreed: 0, open: 1};

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

export const partiesField = list('Party A (at the left, beside her tray) and Party B (at the right), in this order', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) standing open on the easel as the sorting board', {ref: str('Reference on the case file', 30), title: str('Title on the case file', 60)}, ['ref', 'title']),
  issues: list('Labels of the three issue cards (generic and fictional, as supplied): Issue 1 (●, Subject A), Issue 2 (◆, Subject A) and the third card, which is brought to the Subject B row', str('Issue card label', 90), 3, 3),
  subjects: obj('The two supplied subjects the cards are grouped by', {a: str('Subject of the upper row (Issue 1 and Issue 2)', 60), b: str('Subject of the lower row (the third card)', 60)}, ['a', 'b']),
}, ['caseFile', 'issues', 'subjects']);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  window: list('Day labels of the calendar (as supplied)', str('Day label', 24), 2, 7),
  groupDay: int('Zero-based index of the day the cards are grouped (as supplied)', 0, 6),
}, ['window', 'groupDay']);
export const stagesField = obj('Captions of the two supplied states of an issue (descriptive only; equal weight)', {
  agreed: str('Caption of the state "agreed issue" (●: the supplied list marks the issue as agreed between the parties — nothing decided or proven)', 70),
  open: str('Caption of the state "open issue" (◆: a neutral pending state)', 70),
}, ['agreed', 'open']);
export const labelProps = {
  calendar: str('Title on the calendar', 50),
  trays: str('Label plate under Party A’s tray', 40),
};

export const OC_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Claimant'}, {name: 'Party B', role: 'Respondent'}],
  documents: {
    caseFile: {ref: 'CF-0960', title: 'Case file · fictional dispute'},
    issues: ['Issue 1 (as supplied)', 'Issue 2 (as supplied)', 'Issue 3 (as supplied)'],
    subjects: {a: 'Subject A (as supplied)', b: 'Subject B (as supplied)'},
  },
  dates: {window: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], groupDay: 2},
  stages: {agreed: 'Agreed issue (as supplied)', open: 'Open issue (as supplied)'},
  labels: {calendar: 'Calendar (as supplied)', trays: 'Party A · tray'},
};
export const OC_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Demandante'}, {name: 'Parte B', role: 'Demandada'}],
  documents: {
    caseFile: {ref: 'EXP-0960', title: 'Expediente · disputa ficticia'},
    issues: ['Cuestión 1 (aportada)', 'Cuestión 2 (aportada)', 'Cuestión 3 (aportada)'],
    subjects: {a: 'Asunto A (aportado)', b: 'Asunto B (aportado)'},
  },
  dates: {window: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'], groupDay: 2},
  stages: {agreed: 'Cuestión acordada (según lo aportado)', open: 'Cuestión por resolver (según lo aportado)'},
  labels: {calendar: 'Calendario (aportado)', trays: 'Parte A · bandeja'},
};
export const OC_COMMON_ES = {parties: OC_DEFAULTS_ES.parties, documents: OC_DEFAULTS_ES.documents, stages: OC_DEFAULTS_ES.stages, dates: OC_DEFAULTS_ES.dates};

export const OC_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied', sequence: 'Sequence as configured (illustrative)'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'aportado', sequence: 'Secuencia según la configuración (ilustrativa)'},
};

/** The "● agreed issue · ◆ open issue" key text (equal-weight solid glyphs). */
export function configKeyText(p) {
  // (single spaces: the separator stays glued to the caption before it, so no line starts with it)
  return `● ${p.stages.agreed} · ◆ ${p.stages.open}`;
}
/** The state caption with its glyph. */
export function stateText(p, st) {
  return st === 'open' ? `◆ ${p.stages.open}` : `● ${p.stages.agreed}`;
}
/** The grouping day index clamped to the supplied day labels. */
export function dayOf(p) {
  const n = p.dates.window.length;
  return Math.max(0, Math.min(n - 1, p.dates.groupDay));
}
/** The three issue cards' labels (the moving one last). */
export function cardTexts(p) {
  return p.documents.issues.slice(0, 3);
}
/** Seeded looks of the two people (overrides win). */
export function looksOf2(ctx, p) {
  return {a: actorLook(ctx, p.parties[0], 0), b: actorLook(ctx, p.parties[1], 1)};
}

/* ======================================================================== */
/* Art: standing case file                                                   */
/* ======================================================================== */

/**
 * Standing case file seen from the front (copied from intervencion-tercero.js `caseFileArt`, copied not imported). Its
 * cover's height follows `o.aspect` (default 1.05 × its width) and its texts are fitted with no one-word line. Local
 * origin = bottom-left corner of the front cover.
 * @param {any} ctx
 * @param {{prefix:string, w:number, ref:string, title:string, size:number, showText:boolean, color?:string, aspect?:number, minFree?:number}} o
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
  // (o.minFree: the room kept under the title plate, in text sizes — the mechanism's gather draws the grouping there)
  const bodyH = Math.max(w * (o.aspect ?? 1.05), plateH + ts * (o.minFree ?? 3.2));
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
/* Art: an issue card                                                        */
/* ======================================================================== */

/**
 * An issue card (a folder): a tab at its top left that carries the state glyph, its body and a white label sticker
 * with the card's own label (or filler bars when the text is printed elsewhere). All three cards are drawn alike.
 * Origin = top-left of the tab. `o.glyphs`: [{name, kind, opacity}] drawn on the tab.
 */
function folder(ctx, o) {
  const th = ctx.theme;
  const {w, hgt, size: ts, tabH, gR} = o;
  const pad = ts * 0.5;
  const sx = pad * 0.6, sy = tabH + pad * 0.45, sw = w - pad * 1.2, sh = hgt - tabH - pad * 0.9;
  const tabW = Math.max(w * 0.34, gR * 3.4);
  const gx = pad + tabW / 2, gy = tabH / 2 + 2;
  // (o.tight: the inspect's board — the label starts nearer the sticker's edge, so the cards stay narrow)
  const tx = sx + pad * (o.tight ? 0.2 : 0.5);
  const parts = [
    h('path', {d: roundRectPath(3, tabH + 4, w, hgt - tabH, 5), fill: th.shadow}),
    h('path', {d: roundRectPath(pad, 0, tabW, tabH + 8, 4), fill: FOLDER_TAB, stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(0, tabH, w, hgt - tabH, 5), fill: FOLDER, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(sx, sy, sw, sh, 4), fill: th.paper, stroke: INK, 'stroke-width': 1.4}),
    ...(o.glyphs || []).map(q => stateGlyph(ctx, {name: q.name, kind: q.kind, x: gx, y: gy, R: gR, opacity: q.opacity})),
  ];
  if (o.fit) parts.push(textBlock(o.fit, {x: tx, y: sy + (sh - o.fit.height) / 2, fill: INK, name: `${o.prefix}-text`}));
  else {
    const bw = sx + sw - pad * 0.5 - tx;
    parts.push(h('rect', {'data-bar': 1, x: r(tx), y: r(sy + sh / 2 - ts * 0.36), width: r(bw * 0.8), height: r(ts * 0.28), rx: 3, fill: th.paperLine}));
    parts.push(h('rect', {'data-bar': 1, x: r(tx), y: r(sy + sh / 2 + ts * 0.1), width: r(bw * 0.5), height: r(ts * 0.28), rx: 3, fill: th.paperLine}));
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
 * Build the sorting stage (memoised per layout pass).
 * @param {any} ctx
 * @param {{prefix:string, ts:number, p:any, looks:{a:any,b:any}, showText:boolean, compact?:boolean, compactTs?:number,
 *   peopleK?:number, lwK?:number, rowK?:number, boardOnly?:boolean|'focus', wallExtra?:number, wallExtraX?:number,
 *   wallExtraL?:number, calHigh?:boolean|'right', trayGap?:number, aGap?:number, trayPad?:number, rowK0?:number, barsOnly?:boolean, lensGeo?:boolean,
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
  // (o.lensGeo: the inspect's board — the geometry of its printed texts, as narrow as its cards allow, the column headers
  // carrying only their glyphs; o.barsOnly: those texts drawn as filler bars — the inspect's context, whose lens copy
  // prints them at the same coordinates)
  const lensGeo = Boolean(o.lensGeo);
  const printed = (o.showText && !o.compact) || lensGeo;
  const drawText = printed && !o.barsOnly;
  const PK = PK0 * (o.peopleK ?? 1);
  const q = PK / PK0;
  const d = p.documents;
  const cards = cardTexts(p);
  const n = cards.length;
  const subj = [d.subjects.a, d.subjects.b];
  const caps = [p.stages.agreed, p.stages.open];
  // ---- the cards (all the same width; never narrower than their longest word), each with its glyph spot
  const pad = lts * 0.5;
  const R = lts * (printed ? 0.5 : 0.66);
  const gR = lts * (printed ? 0.4 : 0.5);
  // (o.barsOnly: the column headers carry only their glyphs — the captions are on the state key — so the board is no
  // wider than its cards need)
  const glyphTop = lensGeo;
  // (the tab carries the card's state glyph: it is as tall as the glyph needs)
  const tabH = Math.max(lts * 0.55, gR * 2.3);
  const wordOf = t => Math.max(...glue(t).split(' ').filter(Boolean).map(w => ctx.measure(w.replace(/ /g, ' '), lts, 700, 'sans')));
  const wordW = printed ? Math.max(...[...cards, ...(lensGeo ? [] : caps)].map(wordOf)) : 0;
  const glyphW = 0;
  let SW = Math.max(lts * (o.lwK ?? 8), lensGeo ? 0 : o.compact ? 110 : 160, wordW + lts * (lensGeo ? 1.4 : 2.6) + glyphW);
  const cardOpt = sw => ({maxWidth: sw - pad * (lensGeo ? 1.1 : 2.2) - glyphW, size: lts, minSize: lts, maxLines: lensGeo ? 9 : 4, weight: lensGeo ? 400 : 600});
  // (the column header plates widen until their captions wrap with no one-word line; so do the cards)
  const hdOpt = sw => ({maxWidth: glyphTop ? sw - lts * 0.8 : sw - R * 3.2 - lts * 0.6, size: lts, minSize: lts, maxLines: 4, weight: 700});
  for (let i = 0; i < (lensGeo ? 30 : 8) && printed && ((!glyphTop && caps.some(t => hasLone(fitG(t, hdOpt(SW))))) || cards.some(t => hasLone(fitG(t, cardOpt(SW))))); i++) SW *= lensGeo ? 1.025 : 1.1;
  const fits = cards.map(t => (printed ? fitG(t, cardOpt(SW)) : null));
  const hdFits = caps.map(t => (printed && !glyphTop ? fitG(t, hdOpt(SW)) : null));
  // ---- vertical geometry: the board's column headers, then the Subject A row (cards 0 and 1), then the Subject B row
  // (the moving card's row, level with Party A's tray)
  // (o.rowK: taller blank cards on compact props — the contrast's rooms, where the cards print no text; o.rowK0: the
  // Subject A row's blank cards, when they may be shorter than the Subject B row's)
  const cellH = (f, k) => tabH + pad * 0.9 + (printed ? f.height + pad * 0.9 : lts * k);
  const rowH = [Math.max(cellH(fits[0], o.rowK0 ?? o.rowK ?? 1.5), cellH(fits[1], o.rowK0 ?? o.rowK ?? 1.5)), cellH(fits[2], o.rowK ?? 1.5)];
  const colGap = lensGeo ? Math.max(lts * 0.55, 10) : Math.max(lts * 0.9, 18);
  const spineW = lts * 0.9;
  const bp = lts * 0.7;
  const rowW = 2 * SW + colGap;
  const sjOpt = {maxWidth: rowW - lts * 1.2, size: lts, minSize: lts, maxLines: 3, weight: 700};
  const sjFits = subj.map(t => (printed ? fitG(t, sjOpt) : null));
  const sjH = sjFits.map(f => (printed ? f.height + lts * 0.5 : lts * 1.1));
  const hdH = glyphTop ? R * 2.8 : Math.max(printed ? Math.max(...hdFits.map(f => f.height)) + lts * 0.7 : lts * 1.2, R * 2.9);
  const g1 = lts * 0.3;
  const fr = 7;
  // (each group keeps room round it for its frame: a frame never touches a card, a header or the other frame)
  const gapR = Math.max(lts * 1.1, 26);
  const BW = bp * 2 + spineW + 10 + rowW;
  const cfFit = printed ? fitG(`${d.caseFile.ref} · ${d.caseFile.title}`, {maxWidth: BW - lts * 1.4, size: lts, minSize: lts, maxLines: 4, weight: 700}) : null;
  const cfHead = (printed ? cfFit.height : lts * 1.2) + lts * 0.8;
  let yK = -262 * PK;
  const layoutY = yk => {
    const c1Top = yk - rowH[1] / 2;
    const s1Top = c1Top - g1 - sjH[1];
    const c0Top = s1Top - gapR - rowH[0];
    const s0Top = c0Top - g1 - sjH[0];
    const hdTop = s0Top - gapR * 0.8 - hdH;
    const boardTop = hdTop - bp * 0.6 - cfHead;
    const boardBottom = c1Top + rowH[1] + fr + bp * 1.2;
    return {c1Top, s1Top, c0Top, s0Top, hdTop, boardTop, boardBottom};
  };
  let Y = layoutY(yK);
  // (a tall board never sinks to the floor: the board keeps its easel legs)
  const lift = Math.max(0, Y.boardBottom + 70 * q);
  if (lift > 0) { yK -= lift; Y = layoutY(yK); }
  const {c1Top, s1Top, c0Top, s0Top, hdTop, boardTop, boardBottom} = Y;
  const BH = boardBottom - boardTop;
  const cardY = [c0Top, c0Top, c1Top];
  const cardH = [rowH[0], rowH[0], rowH[1]];
  // ---- horizontal: Party A · her tray and push bar · board · calendar · Party B
  const reach = (80 + 76 + 9) * PK * 0.96;
  const shoulderY = -302 * PK;
  const dyG = Math.abs(yK - shoulderY);
  const reachX = Math.sqrt(Math.max(0, (reach * 0.92) ** 2 - dyG ** 2));
  const xA = 0;
  const shoulderA = {x: xA + 12 * PK, y: shoulderY};
  const pw = 11 * q;
  const trayW = SW + (o.trayPad ?? 30) * q;
  // (the tray stands clear of Party A's figure: a frame drawn round the tray and the board never crosses her)
  const trayX0 = xA + Math.max((o.trayGap ?? 72) * PK, 12 * PK + reachX * 0.45);
  const barX0 = trayX0 + 6 * q;
  const startX = barX0 + pw + 2 * q;
  const boardX0 = trayX0 + trayW + 8 * q;
  const spineX = boardX0 + bp;
  const colX = [spineX + spineW + 10, spineX + spineW + 10 + SW + colGap];
  const travelOf = {agreed: colX[0] - startX, open: colX[1] - startX};
  const startGrip = {x: barX0 + pw / 2, y: yK};
  const pushMax = Math.max(0, shoulderA.x + reachX - startGrip.x);
  // (the bar runs on the tray: it stops at the tray's end, past which the card glides on alone)
  const railMax = trayW - pw - 12 * q;
  const pushCap = Math.min(pushMax, railMax);
  const restP = {x: xA + 40 * PK, y: -180 * PK};
  let calX0 = o.calHigh ? trayX0 : boardX0 + BW + 18 * q;
  const days = p.dates.window;
  let calW = o.calHigh ? boardX0 + BW - trayX0 : Math.max(lts * 8.5, SW * 0.72);
  for (let i = 0; i < 6 && printed && hasLone(fitG(p.labels.calendar, {maxWidth: calW - lts * 2.4, size: lts, minSize: lts, maxLines: 3, weight: 700})); i++) calW *= 1.1;
  const xB = (o.calHigh ? boardX0 + BW + 10 * PK : calX0 + calW + 12 * PK) + (o.aGap ?? 62) * PK;
  // (o.calHigh 'right': the calendar hangs high on the wall above Party B instead — the wall above the board stays free)
  if (o.calHigh === 'right') { calW = Math.max(232 * PK, lts * 8.5); calX0 = xB - calW / 2; }
  // ---- Party A's tray and its plate
  const tyTop = c1Top - lts * 0.3, tyBot = c1Top + rowH[1] + lts * 0.3;
  const lipH = lts * 0.45;
  const trayBack = h('path', {d: roundRectPath(trayX0, tyTop, trayW, tyBot - tyTop, 6), fill: '#dfe7ec', stroke: INK, 'stroke-width': 2});
  const trayFront = h('rect', {x: r(trayX0 - 4), y: r(tyBot - 4), width: r(trayW + 8), height: r(lipH), rx: 3, fill: '#8aa2b1', stroke: INK, 'stroke-width': 2.2});
  const rackPosts = h('path', {d: `M${r(trayX0 + 6)} ${r(tyTop - 6)}V-2M${r(trayX0 + trayW - 6)} ${r(tyTop - 6)}V-2`, stroke: '#6b7f8c', 'stroke-width': r(8 * q), 'stroke-linecap': 'round'});
  const plTFit0 = printed ? fitG(p.labels.trays, {maxWidth: trayW - lts, size: lts, minSize: lts, maxLines: 3, weight: 700}) : null;
  const plTH = printed ? plTFit0.height + lts * 0.6 : lts * 1.2;
  const plTFit = drawText ? plTFit0 : null;
  const plTY = tyBot + lipH + lts * 0.5;
  const rackPlate = g({name: `${P}-plT`},
    h('rect', {x: r(trayX0 + 3), y: r(plTY + 3), width: r(trayW), height: r(plTH), rx: 5, fill: th.shadow}),
    h('rect', {x: r(trayX0), y: r(plTY), width: r(trayW), height: r(plTH), rx: 5, fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    plTFit ? textBlock(plTFit, {x: trayX0 + trayW / 2, y: plTY + (plTH - plTFit.height) / 2, anchor: 'middle', fill: INK, name: `${P}-plT-text`})
      : h('rect', {'data-bar': 1, x: r(trayX0 + trayW * 0.2), y: r(plTY + plTH / 2 - lts * 0.18), width: r(trayW * 0.6), height: r(lts * 0.36), rx: 3, fill: th.paperLine}));
  // ---- the push bar (stands in the tray behind the card; its grip level with the card's middle)
  const barTop = c1Top - lts * 0.5, barBot = c1Top + rowH[1] + lts * 0.5;
  const bar = g({name: `${P}-bar`},
    h('path', {d: roundRectPath(barX0, barTop, pw, barBot - barTop, pw / 2), fill: '#7a5a3a', stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(barX0 + pw / 2), cy: r(yK), r: r(pw * 0.9), fill: '#5c4128', stroke: INK, 'stroke-width': 2}));
  // ---- calendar
  let cols = days.length;
  const minCell = printed ? Math.max(...days.map(dd => ctx.measure(glue(dd).replace(/ /g, ' '), lts, 700, 'sans'))) + lts * 1.1 : lts * 3;
  while (cols > 1 && calW / cols < minCell - 0.5) cols--;
  if (cols < days.length) cols = Math.ceil(days.length / Math.ceil(days.length / cols));
  const calTitle = gluedFor(p.labels.calendar, {maxWidth: calW - lts * 2.4, size: lts, minSize: lts, maxLines: 3, weight: 700});
  const calOpts = {prefix: `${P}-cal`, x: calX0, w: calW, cols, days, title: calTitle, size: lts, showText: drawText, showTitle: !o.compact, slotH: lts * 1.5};
  const calY = o.calHigh === 'right' ? -420 * PK - lts * 1.4 - calendarStrip(ctx, {...calOpts, y: 0}).h : o.calHigh ? boardTop - lts * 1.6 - calendarStrip(ctx, {...calOpts, y: 0}).h : boardTop + lts * 1.2;
  const cal = calendarStrip(ctx, {...calOpts, y: calY});
  // ---- the group marks: ONE frame and ONE spine round each subject row (its header and its cards); the same stroke and
  // weight for both
  const x0F = spineX - 4, wF = colX[1] + SW + fr - spineX + 4;
  const grp = [[s0Top, c0Top + rowH[0]], [s1Top, c1Top + rowH[1]]];
  const groupFrame = ([y0, y1]) => [
    h('path', {d: roundRectPath(x0F, y0 - fr - 2, wF, y1 - y0 + 2 * fr + 4, 8), fill: 'none', stroke: MARK, 'stroke-width': MARK_W}),
    h('path', {d: roundRectPath(spineX + spineW * 0.2, y0 - 2, spineW * 0.6, y1 - y0 + 4, spineW * 0.3), fill: MARK, stroke: INK, 'stroke-width': 2}),
  ];
  const groupMarks = g({name: `${P}-mg`, opacity: 0}, grp.map(groupFrame));
  // ---- the column header plates (● agreed, ◆ open: the same plate, glyph size and stroke) and the subject strips
  const hdPlate = k => g({name: `${P}-hd${k}`},
    h('path', {d: roundRectPath(colX[k], hdTop, SW, hdH, 6), fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    glyphTop ? stateGlyph(ctx, {name: `${P}-hd${k}-glyph`, kind: k ? 'additional' : 'initial', x: colX[k] + SW / 2, y: hdTop + hdH / 2, R})
      : stateGlyph(ctx, {name: `${P}-hd${k}-glyph`, kind: k ? 'additional' : 'initial', x: colX[k] + R * 1.6, y: hdTop + hdH / 2, R}),
    glyphTop ? null
      : drawText ? textBlock(hdFits[k], {x: colX[k] + R * 3.2, y: hdTop + (hdH - hdFits[k].height) / 2, fill: INK, name: `${P}-hd${k}-text`})
        : h('rect', {'data-bar': 1, x: r(colX[k] + R * 3.2), y: r(hdTop + hdH / 2 - lts * 0.18), width: r((SW - R * 3.8) * 0.75), height: r(lts * 0.36), rx: 3, fill: th.paperLine}));
  const sjY = [s0Top, s1Top];
  const sjStrip = k => g({name: `${P}-sj${k}`},
    h('path', {d: roundRectPath(colX[0], sjY[k], rowW, sjH[k], 5), fill: '#e8d3a8', stroke: INK, 'stroke-width': 1.4}),
    drawText ? textBlock(sjFits[k], {x: colX[0] + lts * 0.6, y: sjY[k] + (sjH[k] - sjFits[k].height) / 2, fill: INK, name: `${P}-sj${k}-text`})
      : h('rect', {'data-bar': 1, x: r(colX[0] + lts * 0.6), y: r(sjY[k] + sjH[k] / 2 - lts * 0.18), width: r(rowW * 0.35), height: r(lts * 0.36), rx: 3, fill: '#b08a4e'}));
  // ---- the board (the open case file) and its easel
  const slot = (x, y, hh) => h('path', {d: roundRectPath(x - 2, y - 2, SW + 4, hh + 4, 5), fill: '#d9cfb8', stroke: INK, 'stroke-width': 1.2});
  const slots = [slot(colX[0], c0Top, rowH[0]), slot(colX[1], c0Top, rowH[0]), slot(colX[0], c1Top, rowH[1]), slot(colX[1], c1Top, rowH[1])];
  const spine = h('path', {d: roundRectPath(spineX, s0Top - 4, spineW, c1Top + rowH[1] - s0Top + 8, 5), fill: '#b48d50', stroke: INK, 'stroke-width': 1.2});
  const boardBody = [
    h('path', {d: roundRectPath(boardX0 + 6, boardTop + 8, BW, BH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(boardX0, boardTop, BW, BH, 10), fill: '#c9a15e', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(boardX0 + lts * 0.3, boardTop + lts * 0.3, BW - lts * 0.6, cfHead - lts * 0.4, 6), fill: '#e8d3a8', stroke: INK, 'stroke-width': 1.8}),
    drawText ? textBlock(cfFit, {x: boardX0 + BW / 2, y: boardTop + (cfHead - cfFit.height) / 2 + lts * 0.1, anchor: 'middle', fill: INK, name: `${P}-cf-text`})
      : h('rect', {'data-bar': 1, x: r(boardX0 + BW * 0.25), y: r(boardTop + cfHead / 2 - lts * 0.2), width: r(BW * 0.5), height: r(lts * 0.4), rx: 3, fill: '#b08a4e'}),
  ];
  const heads = [hdPlate(0), hdPlate(1), sjStrip(0), sjStrip(1)];
  const board = g({name: `${P}-board`},
    o.boardOnly ? null : h('path', {d: `M${r(boardX0 + BW * 0.2)} ${r(boardBottom - 6)}L${r(boardX0 + BW * 0.08)} 0M${r(boardX0 + BW * 0.8)} ${r(boardBottom - 6)}L${r(boardX0 + BW * 0.92)} 0`, stroke: '#7a5a3a', 'stroke-width': r(10 * q), 'stroke-linecap': 'round'}),
    boardBody, spine, heads, slots);
  // the cards: Issue 1 (●) and Issue 2 (◆) stand in the Subject A row from the start; the third card stands in Party A's
  // tray and is the one that moves (each with its own label); its glyph follows its supplied state
  const glyphsOf = i => (i === 0 ? [{name: `${P}-f0-ga`, kind: 'initial'}] : i === 1 ? [{name: `${P}-f1-go`, kind: 'additional'}]
    : [{name: `${P}-f2-ga`, kind: 'initial', opacity: 0}, {name: `${P}-f2-go`, kind: 'additional', opacity: 0}]);
  const homeX = [colX[0], colX[1], startX];
  const folders = cards.map((_, i) => g({name: `${P}-f${i}-g`, transform: T(homeX[i], cardY[i])}, folder(ctx, {prefix: `${P}-f${i}`, w: SW, hgt: cardH[i], size: lts, tabH, gR, fit: drawText ? fits[i] : null, glyphs: glyphsOf(i), tight: lensGeo})));
  // ---- people: Party A at the left, beside her tray; Party B at the right
  const rigA = personRig(ctx, {name: `${P}-pa`, look: o.looks.a, pose: 'standing'});
  const rigB = personRig(ctx, {name: `${P}-pb`, look: o.looks.b, pose: 'standing'});
  const R0 = 46 * PK;
  const headsAt = {a: {x: xA + 5 * PK, y: -366 * PK}, b: {x: xB - 5 * PK, y: -366 * PK}};
  const wallTop = -(o.wallExtra ?? 0) + Math.min(calY - lts * 1.4, boardTop - lts, -420 * PK);
  // (o.peopleMargin, in people units: a tightened wall never ends inside a person — Party A's back arm and hair at the
  // left, Party B's at the right stay inside the room by at least this half-width from their centres)
  const pm = o.peopleMargin ? o.peopleMargin * PK : 0;
  const calR = o.calHigh === 'right' ? calX0 + calW + 10 : -Infinity;
  const x0 = Math.min(-110 * PK - (o.wallExtraL ?? 0), pm ? xA - pm : Infinity), x1 = Math.max(xB + 110 * PK + (o.wallExtraX ?? 0), pm ? xB + pm : -Infinity, calR);
  // (o.boardOnly 'focus': the board's sorting grid — the column headers, both subject strips and every card in its cell —
  // on a piece of the board: a lens copy whose every piece lies wholly inside the region it shows; the spine and the
  // subject frames, which reach past it, are left out)
  const rowPanel = {x: spineX - bp, y: hdTop - bp, w: colX[1] + SW + fr + bp - (spineX - bp), h: c1Top + rowH[1] + fr + bp - (hdTop - bp)};
  const fm = lts * 0.18;
  const focusPanel = {x: colX[0] - fm, y: hdTop - fm, w: rowW + 2 * fm, h: c1Top + rowH[1] - hdTop + 2 * fm};
  const focusNode = g(null,
    h('path', {d: roundRectPath(focusPanel.x, focusPanel.y, focusPanel.w, focusPanel.h, 6), fill: '#c9a15e'}),
    heads, slots, folders);
  const node = o.boardOnly === 'focus' ? g({name: P}, focusNode) : g({name: P},
    backWall(ctx, {x0, x1, top: wallTop, plantX: null}),
    cal.node(dayOf(p)),
    rackPosts,
    trayBack,
    board,
    folders,
    trayFront,
    groupMarks,
    bar,
    rackPlate,
    rigA.node, rigB.node,
  );
  const box = (x, y, w, hh) => ({x, y, w, h: hh});
  const head = k => box(headsAt[k].x - R0, headsAt[k].y - R0 - 8, 2 * R0, 2 * R0 + 8);
  const person = x => box(x - 60 * PK, headsAt.a.y - R0 - 8, 120 * PK, -headsAt.a.y + R0 + 8);
  const boxes = {
    headA: head('a'), headB: head('b'),
    personA: person(xA), personB: person(xB),
    board: box(boardX0, boardTop, BW, BH + 8),
    legs: box(boardX0, boardBottom, BW, -boardBottom),
    rows: box(colX[0], hdTop, rowW, c1Top + rowH[1] - hdTop),
    colHdr: box(colX[0], hdTop, rowW, hdH),
    stripStart: box(barX0, c1Top - lts * 0.5, startX + SW - barX0, rowH[1] + lts),
    cal: box(calX0, calY - lts * 0.9, calW, cal.h + lts * 0.9),
    rack: box(trayX0 - 4, tyTop, trayW + 8, tyBot + lipH - tyTop),
    trays: [box(trayX0 - 4, tyTop, trayW + 8, tyBot - tyTop + lipH)],
    plates: [box(trayX0, plTY, trayW, plTH)],
    rowPanel: box(rowPanel.x, rowPanel.y, rowPanel.w, rowPanel.h),
    focusPanel: box(focusPanel.x, focusPanel.y, focusPanel.w, focusPanel.h),
    groupMarks: box(x0F, s0Top - fr - 2, wF, c1Top + rowH[1] - s0Top + 2 * fr + 4),
    groupB: box(x0F, s1Top - fr - 2, wF, c1Top + rowH[1] - s1Top + 2 * fr + 4),
    cells: [box(colX[0], c1Top, SW, rowH[1]), box(colX[1], c1Top, SW, rowH[1])],
  };
  const G = {PK, ts: lts, SW, n, yK, rowTops: cardY, rowHs: cardH, startX, colX, travelOf, pushCap, startGrip, restP, xA, xB, R, gR, pw, barX0, spineX, hdTop, hdH};
  function pose(v) {
    const nodes = {};
    const fa = rigA.frame({x: xA, y: 0, facing: 1, scale: PK, lean: 0, near: v.hand, headTilt: 0});
    Object.assign(nodes, fa.nodes);
    const fb = rigB.frame({x: xB, y: 0, facing: -1, scale: PK, lean: 0, near: null, headTilt: 0});
    Object.assign(nodes, fb.nodes);
    // (v.cardOp: the card's opacity — set only by an entry that hides it; then emitted in every frame)
    nodes[`${P}-f${NEW}-g`] = v.cardOp === undefined ? {transform: T(r(startX + v.sheetD), r(c1Top))} : {transform: T(r(startX + v.sheetD), r(c1Top)), opacity: r(clamp(v.cardOp), 3)};
    // (the bar follows the hand while it pushes; it stays at the tray's end once the hand lets go; v.barStill: no hand
    // pushes it — the card is placed as a datum — and the bar stays where it stands)
    const barD = v.barStill ? 0 : Math.min(v.sheetD, v.pushD ?? pushCap);
    nodes[`${P}-bar`] = {transform: T(r(barD), 0)};
    const aP = clamp(v.aP ?? 0), oP = clamp(v.oP ?? 0), gP = clamp(v.groupP ?? 0);
    nodes[`${P}-f2-ga`] = {opacity: r(aP, 3)};
    nodes[`${P}-f2-go`] = {opacity: r(oP, 3)};
    nodes[`${P}-mg`] = {opacity: r(gP, 3)};
    Object.assign(nodes, cal.frame(1, v.markP, dayOf(p)).nodes);
    return {nodes, semantic: {hand: fa.hands.near, grip: v.hand, headA: fa.head, headB: fb.head, allReached: fa.reached, markP: r(v.markP, 3), barD: r(barD, 2), aP: r(aP, 3), oP: r(oP, 3), groupP: r(gP, 3)}};
  }
  const em = o.compact ? 24 : lts * 0.6;
  const ext = {x: x0, y: wallTop - em, w: x1 - x0, h: -wallTop + em + 48};
  const fitsList = drawText ? [...fits, ...hdFits.filter(Boolean), ...sjFits, cfFit, plTFit, cal.titleFit, ...cal.dayFits].filter(Boolean) : [];
  return {node, pose, G, boxes, heads: headsAt, ext, fits: fitsList, cal, PK, wallExtra: o.wallExtra ?? 0};
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

/**
 * Action values for clock c: Party A's hand reaches the push bar, pushes the third card rightwards out of her tray as far
 * as the tray allows, lets go — the card glides on into the Subject B row, into the column of `state` — and comes back to
 * rest.
 */
export function choreo(c, G, state = 'open') {
  const e = ease.inOutSine;
  const mix = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
  const reach = [0.06, 0.22], push = [0.22, 0.48], glide = [0.48, 0.8], back = [0.5, 0.66];
  const travel = G.travelOf[state === 'agreed' ? 'agreed' : 'open'];
  const cap = Math.min(travel, G.pushCap);
  let hand = G.restP, phase = 'rest';
  const pushT = ease.inQuad(seg(c, ...push));
  const pushD = cap * pushT;
  const glideT = ease.outQuad(seg(c, ...glide));
  const sheetD = pushD + (travel - cap) * glideT;
  const grip = {x: G.startGrip.x + pushD, y: G.startGrip.y};
  if (c >= reach[0] && c < reach[1]) { hand = mix(G.restP, G.startGrip, e(seg(c, ...reach))); phase = 'reach'; }
  else if (c >= reach[1] && c < push[1]) { hand = grip; phase = 'push'; }
  else if (c >= push[1] && c < back[1]) { hand = mix(grip, G.restP, e(seg(c, ...back))); phase = c < glide[1] ? 'glide' : 'return'; }
  if (c >= back[1]) phase = c < glide[1] ? 'glide' : 'rest';
  return {hand, sheetD, pushD: cap, phase, slotted: glideT >= 1, travel, markP: seg(c, 0.84, 0.94), pushed: r(pushT, 3)};
}

/* ======================================================================== */
/* Fitting a stage into a box                                                */
/* ======================================================================== */

/** Fit a stage into a design box (largest scale that fits; long supplied text may step the text down, m ≥ 0.82). */
export function solveStage(ctx, o) {
  let m = 1;
  // (the stage text size is taken on a 1.2 % geometric grid: neighbouring scales share one stage build and its text
  // measurements — the search stays fast; the rendered text stays within 1.2 % of the requested size, never above it)
  const tsOf = sc => { const x = (o.B * m) / sc; return Math.round(Math.exp(Math.floor(Math.log(x) / Math.log(1.012)) * Math.log(1.012)) * 1e4) / 1e4; };
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
