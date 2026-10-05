/**
 * Motif kit for "Modificación del escrito" (LAW-0265..0268): fields, fictional defaults, the writing-board stage, its
 * choreography and its solver. Each entry owns its own timeline, layout, labels and semantics. Built on the civil-claim
 * kits (civil-claim-art.js, requerimiento-previo.js, presentacion-demanda.js, contestacion-estructurada.js,
 * reconvencion-ilustrativa.js), used read-only.
 *
 * The stage (side view of an open room, stage units, floor at y = 0):
 *   Party A (who filed the writing) standing at the left, Party B standing at the right · in the middle the case file
 *   stands open on an easel; the writing (escrito) is pinned on it, a title and its numbered sections, one strip per
 *   section · at the height of the section to be replaced a tray is fixed on each side of the board: on the left
 *   Party A's tray, holding the proposed new text (◆ strip); on the right the change-history tray ("was:") · the
 *   calendar hangs on the wall above the history tray.
 * Action (clock c ∈ [0,1], `choreo`): Party A's hand pushes the proposed strip rightwards out of her tray into the
 *   section's row; only when it touches the earlier strip (● initial version) does that strip move, pushed out on the
 *   other side into the history tray, where it stays whole and readable — a neutral line joins it to its row. The
 *   calendar marks the supplied day. finalState "held": the proposal stays in Party A's tray; nothing is replaced.
 * Nothing here states a rule for amending (permission, time limits, admissibility) or any effect: both texts are
 * supplied values of this fictional example, shown with equal weight; the proposal is only proposed.
 * @module animations/civil-claim/kits/modificacion-escrito
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {personRig} from '../../../primitives/person.js';
import {glue, fitG, backWall, calendarStrip} from './civil-claim-art.js';
import {gchip, keyChip, hit, placeTag, partyCaption, looksOf} from './requerimiento-previo.js';
import {localizeDefaults} from './presentacion-demanda.js';
import {caseFileW} from './contestacion-estructurada.js';
import {stateGlyph, claimSheet} from './reconvencion-ilustrativa.js';

export {gchip, keyChip, hit, placeTag, partyCaption, looksOf, glue, fitG, localizeDefaults, caseFileW, stateGlyph, claimSheet};

const INK = '#1f2328';
export const PK0 = 1.3;

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

export const partiesField = list('Party A (filed the writing and proposes the modification) and Party B, in this order; fictional', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) standing open on the easel', {ref: str('Reference on the case file', 30), title: str('Title on the case file', 60)}, ['ref', 'title']),
  writing: obj('The writing (escrito) pinned on the case file', {
    title: str('Title of the writing', 50),
    sections: list('Its sections, in order (the initial version of each)', str('Section text', 70), 2, 4),
  }, ['title', 'sections']),
  modification: obj('The proposed modification (as supplied; only proposed)', {
    section: int('Zero-based index of the section it would replace', 0, 3),
    text: str('Proposed new text of that section', 70),
  }, ['section', 'text']),
}, ['caseFile', 'writing', 'modification']);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  window: list('Day labels of the calendar (as supplied)', str('Day label', 24), 2, 7),
  writingDay: int('Zero-based index of the day of the writing (as supplied)', 0, 6),
  modificationDay: int('Zero-based index of the day of the proposed modification (as supplied)', 0, 6),
}, ['window', 'writingDay', 'modificationDay']);
export const stagesField = obj('Captions of the supplied states (descriptive only)', {
  initial: str('Caption of the initial version', 50),
  proposed: str('Caption of the proposed modification', 50),
  history: str('Caption once the earlier text is in the history', 60),
}, ['initial', 'proposed', 'history']);
export const labelProps = {
  calendar: str('Title on the calendar', 50),
  trayA: str('Label plate on Party A’s tray', 40),
  history: str('Label plate on the change-history tray', 40),
};

export const ME_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Claimant'}, {name: 'Party B', role: 'Respondent'}],
  documents: {
    caseFile: {ref: 'CF-0655', title: 'Case file · fictional dispute'},
    writing: {title: 'Claim · Party A', sections: ['§1 Facts: a bicycle was lent', '§2 Request: return of the bicycle', '§3 Documents: a receipt']},
    modification: {section: 1, text: '§2 Request: return of the bicycle and its lock'},
  },
  dates: {window: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], writingDay: 0, modificationDay: 3},
  stages: {initial: 'Initial version (as supplied)', proposed: 'Proposed modification (as supplied)', history: 'Earlier text kept in the history'},
  labels: {calendar: 'Calendar (as supplied)', trayA: 'Party A · proposals', history: 'History · was:'},
};
export const ME_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Demandante'}, {name: 'Parte B', role: 'Demandada'}],
  documents: {
    caseFile: {ref: 'EXP-0655', title: 'Expediente · disputa ficticia'},
    writing: {title: 'Demanda · Parte A', sections: ['§1 Hechos: se prestó una bicicleta', '§2 Petición: devolución de la bicicleta', '§3 Documentos: un recibo']},
    modification: {section: 1, text: '§2 Petición: devolución de la bicicleta y su candado'},
  },
  dates: {window: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'], writingDay: 0, modificationDay: 3},
  stages: {initial: 'Versión inicial (según lo aportado)', proposed: 'Modificación propuesta (según lo aportado)', history: 'El texto anterior se conserva en el historial'},
  labels: {calendar: 'Calendario (según lo aportado)', trayA: 'Parte A · propuestas', history: 'Historial · antes:'},
};
export const ME_COMMON_ES = {parties: ME_DEFAULTS_ES.parties, documents: ME_DEFAULTS_ES.documents, stages: ME_DEFAULTS_ES.stages, dates: ME_DEFAULTS_ES.dates};

export const ME_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied', sequence: 'Sequence as configured (illustrative)', was: 'was:'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'según lo aportado', sequence: 'Secuencia según la configuración (ilustrativa)', was: 'antes:'},
};

/** The "● initial version · ◆ proposed modification" key text (equal-weight solid glyphs). */
export function versionKeyText(p) {
  return `● ${p.stages.initial}  ·  ◆ ${p.stages.proposed}`;
}
/** Day indexes clamped to the supplied day labels (k: 0 the writing's day, 1 the modification's day). */
export function dayOf(p, k) {
  const n = p.dates.window.length;
  return Math.max(0, Math.min(n - 1, k ? p.dates.modificationDay : p.dates.writingDay));
}
/** The replaced section's index, clamped to the supplied sections. */
export function sectionOf(p) {
  return Math.max(0, Math.min(p.documents.writing.sections.length - 1, p.documents.modification.section));
}

/* ======================================================================== */
/* Art: section strip                                                        */
/* ======================================================================== */

/**
 * A section strip of the writing: paper, an optional glyph at its left (● initial version, ◆ proposed modification —
 * the same size and stroke), its text (or filler bars when the text is printed elsewhere). Origin = top-left.
 */
function strip(ctx, o) {
  const th = ctx.theme;
  const {w, hgt, size: ts, kind} = o;
  const pad = ts * 0.5;
  const R = o.R;
  const gx = kind ? R * 2.7 : 0;
  // (the proposal's glyph band sits at its right end: the hand that pushes it holds its left edge)
  const right = kind === 'proposed';
  const gx0 = right ? w - gx : 0;
  const tx = right ? pad : gx + pad;
  const parts = [
    h('path', {d: roundRectPath(3, 4, w, hgt, 4), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hgt, 4), fill: th.paper, stroke: INK, 'stroke-width': kind ? 2.4 : 1.6}),
  ];
  if (kind) {
    parts.push(h('path', {d: roundRectPath(gx0 + 2, 2, gx - 4, hgt - 4, 3), fill: right ? th.accent3 : th.accent2, opacity: 0.32}));
    parts.push(stateGlyph(ctx, {name: `${o.prefix}-glyph`, kind: right ? 'additional' : 'initial', x: gx0 + gx / 2, y: hgt / 2, R}));
  }
  if (o.fit) parts.push(textBlock(o.fit, {x: tx, y: (hgt - o.fit.height) / 2, fill: INK, name: `${o.prefix}-text`}));
  else {
    parts.push(h('rect', {'data-bar': 1, x: r(tx), y: r(hgt / 2 - ts * 0.38), width: r((w - gx - pad * 2) * 0.8), height: r(ts * 0.3), rx: 3, fill: th.paperLine}));
    parts.push(h('rect', {'data-bar': 1, x: r(tx), y: r(hgt / 2 + ts * 0.12), width: r((w - gx - pad * 2) * 0.5), height: r(ts * 0.3), rx: 3, fill: th.paperLine}));
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
 * Build the writing-board stage (memoised per layout pass).
 * @param {any} ctx
 * @param {{prefix:string, ts:number, p:any, looks:{a:any,b:any}, showText:boolean, compact?:boolean, compactTs?:number,
 *   peopleK?:number, lwK?:number, withProposal?:boolean, boardOnly?:boolean, withCal?:boolean, wallExtra?:number,
 *   wallExtraX?:number, wallExtraL?:number}} o
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
  const withProp = o.withProposal !== false;
  const d = p.documents;
  const secs = d.writing.sections;
  const n = secs.length;
  const k = sectionOf(p);
  const oldText = secs[k], newText = d.modification.text;
  // ---- the strips (all the same width; never narrower than their longest word)
  const pad = lts * 0.5;
  const R = lts * (printed ? 0.5 : 0.66);
  const gx = R * 2.7;
  const words = [d.writing.title, ...secs, newText];
  const wordW = printed ? Math.max(...words.flatMap(t => glue(t).split(' ')).map(w => ctx.measure(w.replace(/ /g, ' '), lts, 700, 'sans'))) : 0;
  const SW = Math.max(lts * (o.lwK ?? 9), o.compact ? 130 : 200, wordW + gx + lts * 1.6);
  const fitOf = (t, kind) => (printed ? fitG(t, {maxWidth: SW - pad * 2 - (kind ? gx : 0), size: lts, minSize: lts, maxLines: 4, weight: 600}) : null);
  const fits = secs.map((t, i) => fitOf(t, i === k ? 'initial' : null));
  const newFit = fitOf(newText, 'proposed');
  const hOf = (f, kind) => Math.max(printed ? f.height + pad * 1.4 : lts * 1.7, kind ? R * 2.7 : 0);
  const rowHs = secs.map((t, i) => (i === k ? Math.max(hOf(fits[i], 'initial'), hOf(newFit, 'proposed')) : hOf(fits[i], null)));
  const rowK = rowHs[k];
  // ---- the writing (title + rows) on the case file board
  const titleFit = printed ? fitG(d.writing.title, {maxWidth: SW, size: lts, minSize: lts, maxLines: 3, weight: 700}) : null;
  const headH = (printed ? titleFit.height : lts * 1.2) + pad * 1.4;
  const gapR = lts * 0.3;
  const DW = SW + pad * 2;
  const DH = headH + rowHs.reduce((a, b) => a + b, 0) + gapR * (n - 1) + pad * 2;
  const bp = lts * 0.7;
  const cfFit = printed ? fitG(`${d.caseFile.ref} · ${d.caseFile.title}`, {maxWidth: DW + bp * 2 - lts, size: lts, minSize: lts, maxLines: 4, weight: 700}) : null;
  const cfHead = (printed ? cfFit.height : lts * 1.2) + lts * 0.8;
  const BW = DW + bp * 2;
  // vertical: the replaced row at about shoulder height (the hand pushes the strip level with the shoulder)
  const before = rowHs.slice(0, k).reduce((a, b) => a + b, 0) + gapR * k;
  let yK = -282 * PK;
  let docTop = yK - rowK / 2 - pad - headH - before;
  let boardBottom = docTop + DH + bp;
  // (a tall writing never sinks to the floor: the board keeps its easel legs)
  const lift = Math.max(0, boardBottom + 70 * q);
  yK -= lift; docTop -= lift; boardBottom -= lift;
  const boardTop = docTop - cfHead - bp;
  const BH = boardBottom - boardTop;
  const rowTop = i => docTop + pad + headH + rowHs.slice(0, i).reduce((a, b) => a + b, 0) + gapR * i;
  // ---- horizontal: A · tray A · board · history tray · B
  const reach = (80 + 76 + 9) * PK * 0.96;
  const shoulderY = -302 * PK;
  const dyG = Math.abs(yK - shoulderY);
  const reachX = Math.sqrt(Math.max(0, (reach * 0.92) ** 2 - dyG ** 2));
  const xA = 0;
  const shoulderA = {x: xA + 12 * PK, y: shoulderY};
  const trayW = SW + 26 * q;
  const trayX0 = xA + Math.max(44 * PK, 12 * PK + reachX * 0.45);
  const startX = trayX0 + 10 * q;
  const boardX0 = trayX0 + trayW;
  const docX = boardX0 + bp;
  const rowX = docX + pad;
  const travel = rowX - startX;
  const histX0 = boardX0 + BW;
  const histSlot = histX0 + 10 * q;
  const oldTravel = histSlot - rowX;
  const xB = histX0 + trayW + 62 * PK;
  const startGrip = {x: startX, y: yK};
  const pushMax = Math.max(0, shoulderA.x + reachX - startGrip.x);
  const pushD = Math.min(travel, pushMax);
  const restA = {x: xA + 40 * PK, y: -180 * PK};
  // ---- trays (fixed to the board's sides, level with the replaced row) and their plates
  const tyTop = yK - rowK / 2 - lts * 0.5, tyBot = yK + rowK / 2 + lts * 0.35;
  const plateFit = t => (printed ? fitG(t, {maxWidth: trayW - lts, size: lts, minSize: lts, maxLines: 3, weight: 700}) : null);
  const plA = plateFit(p.labels.trayA), plH = plateFit(p.labels.history);
  const plateH = f => (printed ? f.height + lts * 0.6 : lts * 1.2);
  const plAH = plateH(plA), plHH = plateH(plH);
  const trayBack = (x0, name) => g({name},
    h('path', {d: roundRectPath(x0, tyTop, trayW, tyBot - tyTop, 6), fill: '#dfe7ec', stroke: INK, 'stroke-width': 2}),
    ...[0.25, 0.5, 0.75].map(f => h('line', {x1: r(x0 + trayW * f), x2: r(x0 + trayW * f), y1: r(tyTop + 6), y2: r(tyBot - 6), stroke: '#5f7482', 'stroke-width': 2.5, opacity: 0.5})));
  const trayFront = (x0, name) => g({name},
    h('rect', {x: r(x0 - 4), y: r(tyBot - 4), width: r(trayW + 8), height: r(lts * 0.45), rx: 3, fill: '#8aa2b1', stroke: INK, 'stroke-width': 2.2}));
  // plates: Party A's under its tray; the history plate above its tray
  const plate = (x0, y0, f, hh, name) => g({name},
    h('rect', {x: r(x0 + 3), y: r(y0 + 3), width: r(trayW), height: r(hh), rx: 5, fill: th.shadow}),
    h('rect', {x: r(x0), y: r(y0), width: r(trayW), height: r(hh), rx: 5, fill: th.paper, stroke: INK, 'stroke-width': 1.8}),
    f ? textBlock(f, {x: x0 + trayW / 2, y: y0 + (hh - f.height) / 2, anchor: 'middle', fill: INK, name: `${name}-text`})
      : h('rect', {'data-bar': 1, x: r(x0 + trayW * 0.2), y: r(y0 + hh / 2 - lts * 0.18), width: r(trayW * 0.6), height: r(lts * 0.36), rx: 3, fill: th.paperLine}));
  const plAY = tyBot + lts * 0.6, plHY = tyTop - lts * 0.4 - plHH;
  // ---- calendar on the wall above the history plate
  const days = p.dates.window;
  const calX0 = histX0, calW = Math.max(trayW, lts * 9);
  const minCell = printed ? Math.max(...days.map(dd => ctx.measure(glue(dd).replace(/ /g, ' '), lts, 700, 'sans'))) + lts * 1.1 : lts * 3;
  let cols = days.length;
  while (cols > 1 && calW / cols < minCell - 0.5) cols--;
  if (cols < days.length) cols = Math.ceil(days.length / Math.ceil(days.length / cols));
  const calOpt = {prefix: `${P}-cal`, x: calX0, w: calW, cols, days, title: p.labels.calendar, size: lts, showText: printed, showTitle: !o.compact, slotH: lts * 1.5};
  const cal0 = calendarStrip(ctx, {...calOpt, y: 0});
  const calY = plHY - lts * 1.6 - cal0.h;
  const cal = calendarStrip(ctx, {...calOpt, y: calY});
  // ---- the board (the open case file) and its easel
  const board = g({name: `${P}-board`},
    // easel legs to the floor (not in a board-only copy)
    o.boardOnly ? null : h('path', {d: `M${r(boardX0 + BW * 0.2)} ${r(boardBottom - 6)}L${r(boardX0 + BW * 0.08)} 0M${r(boardX0 + BW * 0.8)} ${r(boardBottom - 6)}L${r(boardX0 + BW * 0.92)} 0`, stroke: '#7a5a3a', 'stroke-width': r(10 * q), 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(boardX0 + 6, boardTop + 8, BW, BH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(boardX0, boardTop, BW, BH, 10), fill: '#c9a15e', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(boardX0 + lts * 0.3, boardTop + lts * 0.3, BW - lts * 0.6, cfHead - lts * 0.4, 6), fill: '#e8d3a8', stroke: INK, 'stroke-width': 1.8}),
    printed ? textBlock(cfFit, {x: boardX0 + BW / 2, y: boardTop + (cfHead - cfFit.height) / 2 + lts * 0.1, anchor: 'middle', fill: INK, name: `${P}-cf-text`})
      : h('rect', {'data-bar': 1, x: r(boardX0 + BW * 0.25), y: r(boardTop + cfHead / 2 - lts * 0.2), width: r(BW * 0.5), height: r(lts * 0.4), rx: 3, fill: '#b08a4e'}),
    // the writing's sheet and its title
    h('path', {d: roundRectPath(docX, docTop, DW, DH, 6), fill: th.paperShade, stroke: INK, 'stroke-width': 2}),
    printed ? textBlock(titleFit, {x: docX + pad, y: docTop + pad + (headH - pad * 1.4 - titleFit.height) / 2 + pad * 0.2, fill: INK, name: `${P}-title`})
      : h('rect', {'data-bar': 1, x: r(docX + pad), y: r(docTop + pad + headH / 2 - lts * 0.4), width: r(SW * 0.6), height: r(lts * 0.4), rx: 3, fill: th.paperLine}),
    // the empty row behind the replaced strip (an outline of the row, drawn plain)
    h('path', {d: roundRectPath(rowX - 2, rowTop(k) - 2, SW + 4, rowK + 4, 5), fill: '#d9cfb8', stroke: INK, 'stroke-width': 1.2}),
    // the other rows
    secs.map((t, i) => (i === k ? null : g({transform: T(rowX, rowTop(i))}, strip(ctx, {prefix: `${P}-row${i}`, w: SW, hgt: rowHs[i], size: lts, kind: null, R, fit: fits[i]})))),
  );
  // the strips that move: the earlier one (● initial version) and the proposal (◆)
  const oldG = g({name: `${P}-old-g`, transform: T(rowX, rowTop(k))}, strip(ctx, {prefix: `${P}-old`, w: SW, hgt: rowK, size: lts, kind: 'initial', R, fit: fits[k]}));
  const newG = withProp ? g({name: `${P}-new-g`, transform: T(startX, rowTop(k))}, strip(ctx, {prefix: `${P}-new`, w: SW, hgt: rowK, size: lts, kind: 'proposed', R, fit: newFit})) : null;
  // the neutral line that joins the kept strip to its row (no strike, no colour): drawn as the strip moves
  const linkY = tyBot + lts * 0.1;
  const link = h('path', {name: `${P}-link`, d: `M${r(docX + DW - pad)} ${r(linkY)}H${r(histSlot + SW * 0.5)}`, stroke: th.inkSoft, 'stroke-width': 2.5, fill: 'none', opacity: 0});
  // ---- people
  const rigA = personRig(ctx, {name: `${P}-pa`, look: o.looks.a, pose: 'standing'});
  const rigB = personRig(ctx, {name: `${P}-pb`, look: o.looks.b, pose: 'standing'});
  const R0 = 46 * PK;
  const heads = {a: {x: xA + 5 * PK, y: -366 * PK}, b: {x: xB - 5 * PK, y: -366 * PK}};
  const wallTop = -(o.wallExtra ?? 0) + Math.min(calY - lts * 1.4, boardTop - lts, -420 * PK);
  const x0 = -110 * PK - (o.wallExtraL ?? 0), x1 = xB + 110 * PK + (o.wallExtraX ?? 0);
  const boardOnlyNode = g(null, o.withCal ? cal.node(dayOf(p, 1)) : null, board, trayBack(trayX0, `${P}-trA-back`), trayBack(histX0, `${P}-trH-back`), link, oldG, newG, trayFront(trayX0, `${P}-trA-front`), trayFront(histX0, `${P}-trH-front`));
  // (o.boardOnly 'focus': only the replaced row on a piece of the board, the history tray and the calendar — a lens copy
  // whose every piece lies wholly inside the region it shows)
  const rowPanel = {x: rowX - bp, y: rowTop(k) - bp, w: SW + bp * 2, h: rowK + bp * 2};
  const focusNode = g(null, o.withCal ? cal.node(dayOf(p, 1)) : null,
    h('path', {d: roundRectPath(rowPanel.x, rowPanel.y, rowPanel.w, rowPanel.h, 8), fill: '#c9a15e', stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(rowX - 2, rowTop(k) - 2, SW + 4, rowK + 4, 5), fill: '#d9cfb8', stroke: INK, 'stroke-width': 1.2}),
    trayBack(histX0, `${P}-trH-back`), link, oldG, newG, trayFront(histX0, `${P}-trH-front`));
  const node = o.boardOnly === 'focus' ? g({name: P}, focusNode) : o.boardOnly ? g({name: P}, boardOnlyNode) : g({name: P},
    backWall(ctx, {x0, x1, top: wallTop, plantX: null}),
    cal.node(dayOf(p, 1)),
    trayBack(trayX0, `${P}-trA-back`), trayBack(histX0, `${P}-trH-back`),
    board, link, oldG, newG,
    trayFront(trayX0, `${P}-trA-front`), trayFront(histX0, `${P}-trH-front`),
    plate(trayX0, plAY, plA, plAH, `${P}-plA`), plate(histX0, plHY, plH, plHH, `${P}-plH`),
    rigA.node, rigB.node,
  );
  const box = (x, y, w, hh) => ({x, y, w, h: hh});
  const boxes = {
    headA: box(heads.a.x - R0, heads.a.y - R0 - 8, 2 * R0, 2 * R0 + 8),
    headB: box(heads.b.x - R0, heads.b.y - R0 - 8, 2 * R0, 2 * R0 + 8),
    personA: box(xA - 60 * PK, heads.a.y - R0 - 8, 120 * PK, -heads.a.y + R0 + 8),
    personB: box(xB - 60 * PK, heads.b.y - R0 - 8, 120 * PK, -heads.b.y + R0 + 8),
    board: box(boardX0, boardTop, BW, BH + 8),
    legs: box(boardX0, boardBottom, BW, -boardBottom),
    row: box(rowX, rowTop(k), SW, rowK),
    stripStart: box(startX, rowTop(k), SW, rowK),
    history: box(histSlot, rowTop(k), SW, rowK),
    cal: box(calX0, calY - lts * 0.9, calW, cal.h + lts * 0.9),
    trays: [box(trayX0 - 4, tyTop, trayW + 8, tyBot - tyTop + lts * 0.45), box(histX0 - 4, tyTop, trayW + 8, tyBot - tyTop + lts * 0.45)],
    plates: [box(trayX0, plAY, trayW, plAH), box(histX0, plHY, trayW, plHH)],
    rowPanel: box(rowX - bp, rowTop(k) - bp, SW + bp * 2, rowK + bp * 2),
  };
  const G = {PK, ts: lts, SW, rowK, yK, rowTopK: rowTop(k), startX, rowX, histSlot, travel, oldTravel, pushD, startGrip, restA, xA, xB, withProp, k, n, R};
  function pose(v) {
    const nodes = {};
    const fa = rigA.frame({x: xA, y: 0, facing: 1, scale: PK, lean: 0, near: v.hand, headTilt: 0});
    Object.assign(nodes, fa.nodes);
    const fb = rigB.frame({x: xB, y: 0, facing: -1, scale: PK, lean: 0, near: null, headTilt: 0});
    Object.assign(nodes, fb.nodes);
    if (withProp) nodes[`${P}-new-g`] = {transform: T(r(startX + v.sheetD), r(rowTop(k)))};
    // the earlier strip moves only once the proposal touches it, and on into the history tray
    const contact = withProp ? clamp((startX + v.sheetD + SW - rowX) / SW) : 0;
    nodes[`${P}-old-g`] = {transform: T(r(rowX + oldTravel * contact), r(rowTop(k)))};
    nodes[`${P}-link`] = {opacity: r(seg(contact, 0.85, 1), 3)};
    Object.assign(nodes, cal.frame(1, v.markP, dayOf(p, 1)).nodes);
    return {nodes, semantic: {hand: fa.hands.near, grip: v.hand, headA: fa.head, headB: fb.head, allReached: fa.reached, markP: r(v.markP, 3), oldShift: r(oldTravel * contact, 2), contact: r(contact, 3)}};
  }
  const em = o.compact ? 24 : lts * 0.6;
  const ext = {x: x0, y: wallTop - em, w: x1 - x0, h: -wallTop + em + 48};
  const fitsList = printed ? [...fits, newFit, titleFit, cfFit, plA, plH, cal.titleFit, ...cal.dayFits].filter(Boolean) : [];
  return {node, pose, G, boxes, heads, ext, fits: fitsList, cal, PK, wallExtra: o.wallExtra ?? 0};
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

/**
 * Action values for clock c: Party A's hand reaches the proposal's left edge, pushes it rightwards out of her tray as
 * far as the reach allows, lets go — the strip glides on into the row — and comes back to rest. finalState "held":
 * the hand rests on the proposal in the tray; nothing is replaced.
 */
export function choreo(c, G, o = {}) {
  const e = ease.inOutSine;
  const mix = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
  if (!G.withProp) return {hand: G.restA, sheetD: 0, phase: 'rest', slotted: false, markP: 0, pushed: 0};
  const reach = [0.06, 0.22], push = [0.22, 0.48], glide = [0.48, 0.8], back = [0.5, 0.66];
  let hand = G.restA, phase = 'rest';
  const pushT = o.held ? 0 : ease.inQuad(seg(c, ...push));
  const pushD = G.pushD * pushT;
  const glideT = o.held ? 0 : ease.outQuad(seg(c, ...glide));
  const sheetD = pushD + (G.travel - G.pushD) * glideT;
  const grip = {x: G.startGrip.x + pushD, y: G.startGrip.y};
  if (c >= reach[0] && c < reach[1]) { hand = mix(G.restA, G.startGrip, e(seg(c, ...reach))); phase = 'reach'; }
  else if (c >= reach[1] && (o.held || c < push[1])) { hand = grip; phase = o.held ? 'hold' : 'push'; }
  else if (!o.held && c >= push[1] && c < back[1]) { hand = mix(grip, G.restA, e(seg(c, ...back))); phase = c < glide[1] ? 'glide' : 'return'; }
  if (!o.held && c >= back[1]) phase = c < glide[1] ? 'glide' : 'rest';
  return {hand, sheetD, phase, slotted: !o.held && glideT >= 1, markP: o.held ? 0 : seg(c, 0.82, 0.92), pushed: r(pushT, 3)};
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
