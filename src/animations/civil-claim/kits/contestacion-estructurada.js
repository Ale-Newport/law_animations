/**
 * Motif kit for "Contestación estructurada" (LAW-0257..0260): fields, fictional defaults, the board stage, its
 * choreography and its pose solver. Each entry owns its own timeline, layout, labels and semantics. Built on the
 * civil-claim kits (civil-claim-art.js, requerimiento-previo.js, presentacion-demanda.js), used read-only.
 *
 * The stage (side view of an office wall, stage units, floor at y = 0):
 *   at the left, Party A (claimant) seated at a low desk with two trays (the initial claim she sent, and the
 *   response tray) · the case file on a shelf and the calendar on the wall above · a pin board with the initial
 *   claim's numbered allegations (top sheet) and Party B's structured response (bottom sheet), one row per section ·
 *   at the right of the board a narrow channel for the links · Party B (respondent) standing beside it.
 * Action (clock c ∈ [0,1], `choreo`): Party B takes each response section's thread at its pin, carries it along the
 * channel and pins it to the allegation the section answers. The section's supplied state then shows on its link:
 * ● admitted (solid line) or ◆ disputed (dashed line), equal weight. The calendar marks the supplied response day.
 * Nothing here states an effect of admitting or disputing, a burden, a consequence or an outcome: the states are
 * supplied values of this fictional example.
 * @module animations/civil-claim/kits/contestacion-estructurada
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {str, int, list, obj, party, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {personRig} from '../../../primitives/person.js';
import {glue, fitG, caseFile, wallShelf, backWall, officeChair, seatedParty, letterTray, calendarStrip} from './civil-claim-art.js';
import {gchip, keyChip, hit, placeTag, partyCaption, looksOf} from './requerimiento-previo.js';
import {localizeDefaults} from './presentacion-demanda.js';

export {gchip, keyChip, hit, placeTag, partyCaption, looksOf, glue, fitG, localizeDefaults};

const INK = '#1f2328';
export const STATES = ['admitted', 'disputed'];

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

const sectionItem = obj('A section of the structured response (fictional, as supplied)', {
  label: str('Section text drawn on its row', 60),
  refers: int('Zero-based index of the allegation the section is linked to', 0, 3),
  state: oneOf('State supplied for the allegation in this section (descriptive only; no effect is inferred)', STATES),
}, ['label', 'refers', 'state']);

export const partiesField = list('Party B (writes the response) and Party A (filed the initial claim), in this order; fictional', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) on the shelf', {ref: str('Reference on the file tab', 30), title: str('Title on the file plate', 60)}, ['ref', 'title']),
  claim: obj('The initial claim (fictional)', {title: str('Title of the initial claim sheet', 50), allegations: list('Numbered allegations of the initial claim (as supplied)', str('Allegation', 60), 2, 4)}, ['title', 'allegations']),
  response: obj('The structured response (fictional)', {title: str('Title of the response sheet', 50), sections: list('Sections of the response, each linked to one allegation', sectionItem, 2, 4)}, ['title', 'sections']),
}, ['caseFile', 'claim', 'response']);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  window: list('Day labels of the calendar (as supplied)', str('Day label', 24), 2, 7),
  responseDay: int('Zero-based index of the calendar day marked as the response date (as supplied)', 0, 6),
}, ['window', 'responseDay']);
export const stagesField = obj('Captions of the supplied states (descriptive only)', {
  admitted: str('Caption of a fact marked admitted in this example', 50),
  disputed: str('Caption of a fact marked disputed in this example', 50),
  linked: str('Caption once every section is linked to an allegation', 50),
}, ['admitted', 'disputed', 'linked']);
export const propLabelProps = {
  calendar: str('Title on the calendar', 50),
  claimTray: str('Label plate on the tray holding the initial claim', 36),
  responseTray: str('Label plate on the response tray', 36),
};

export const CE_DEFAULTS = {
  parties: [{name: 'Party B', role: 'Respondent'}, {name: 'Party A', role: 'Claimant'}],
  documents: {
    caseFile: {ref: 'CF-0517', title: 'Case file · fictional claim'},
    claim: {title: 'Initial claim · Party A', allegations: ['The item was delivered on Day 1', 'The item was damaged', 'No repair was offered']},
    response: {title: 'Response · Party B', sections: [
      {label: 'Section 1 · on delivery', refers: 0, state: 'admitted'},
      {label: 'Section 2 · on the damage', refers: 1, state: 'disputed'},
      {label: 'Section 3 · on the repair', refers: 2, state: 'disputed'},
    ]},
  },
  dates: {window: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], responseDay: 3},
  stages: {admitted: 'Admitted fact (as supplied)', disputed: 'Disputed fact (as supplied)', linked: 'Each section linked to an allegation'},
  labels: {calendar: 'Calendar (as supplied)', claimTray: 'Initial claim · Party A', responseTray: 'Response · Party B'},
};
export const CE_DEFAULTS_ES = {
  parties: [{name: 'Parte B', role: 'Demandada'}, {name: 'Parte A', role: 'Demandante'}],
  documents: {
    caseFile: {ref: 'EXP-0517', title: 'Expediente · reclamación ficticia'},
    claim: {title: 'Demanda · Parte A', allegations: ['El objeto se entregó el día 1', 'El objeto llegó dañado', 'No se ofreció reparación']},
    response: {title: 'Contestación · Parte B', sections: [
      {label: 'Apartado 1 · sobre la entrega', refers: 0, state: 'admitted'},
      {label: 'Apartado 2 · sobre el daño', refers: 1, state: 'disputed'},
      {label: 'Apartado 3 · sobre la reparación', refers: 2, state: 'disputed'},
    ]},
  },
  dates: {window: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'], responseDay: 3},
  stages: {admitted: 'Hecho admitido (según lo aportado)', disputed: 'Hecho controvertido (según lo aportado)', linked: 'Cada apartado vinculado a una alegación'},
  labels: {calendar: 'Calendario (según lo aportado)', claimTray: 'Demanda · Parte A', responseTray: 'Contestación · Parte B'},
};
export const CE_COMMON_ES = {parties: CE_DEFAULTS_ES.parties, documents: CE_DEFAULTS_ES.documents, stages: CE_DEFAULTS_ES.stages, dates: CE_DEFAULTS_ES.dates};

export const CE_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied', sequence: 'Sequence as configured (illustrative)'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'según lo aportado', sequence: 'Secuencia según la configuración (ilustrativa)'},
};

/** The "● admitted · ◆ disputed" key text (the two supplied states, told apart by solid glyphs). */
export function stateKeyText(p) {
  return `● ${p.stages.admitted}  ·  ◆ ${p.stages.disputed}`;
}
/**
 * Width of the case file that keeps every word of its supplied title and reference whole (civil-claim-art caseFile
 * prints the title in w − 2.1·ts and the reference in 0.8·w − 0.6·ts).
 */
export function caseFileW(ctx, doc, ts, base) {
  const words = (t, fam) => Math.max(0, ...glue(t).split(' ').filter(Boolean).map(x => ctx.measure(x.replace(/\u00a0/g, ' '), ts, 700, fam)));
  return Math.max(base, words(doc.title, 'serif') + ts * 2.4, (words(doc.ref, 'mono') + ts * 0.8) / 0.8);
}
/** Sections clamped to the supplied allegations. */
export function sectionsOf(p) {
  const n = p.documents.claim.allegations.length;
  return p.documents.response.sections.map(s => ({...s, refers: Math.max(0, Math.min(n - 1, s.refers))}));
}

/* ======================================================================== */
/* Art: sheets, state badge                                                  */
/* ======================================================================== */

/**
 * A pinned sheet with a header and numbered rows; a pin at the right end of every row. Origin = top-left.
 * @returns {{node:any, w:number, h:number, rows:Array<{y:number,h:number}>, pins:Array<{x:number,y:number}>, fits:any[]}}
 */
export function boardSheet(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts, prefix} = o;
  const pad = ts * 0.45;
  const pinW = ts * 1.3;
  // (a bar-only sheet whose numbers are printed keeps them at numSize: their column and the rows grow to hold them)
  const nS = o.barsOnly && o.showText ? (o.numSize ?? ts) : ts;
  const marksTxt = o.rows.map((_, i) => `${o.marks ? o.marks[i] : i + 1}`);
  const numW = Math.max(ts * 1.5, Math.max(...marksTxt.map(t => ctx.measure(t, nS, 800, 'sans'))) + ts * 0.5);
  const textW = w - pad * 2 - numW - pinW;
  // (a left-side pin shifts the number and the text right by the pin's room)
  const x0 = o.pinSide === 'left' ? pinW * 0.7 : 0;
  const src = o.barsOnly ? {...o, title: 'Xxxxxxx xxxxx', rows: o.rows.map(() => 'Xxxxxxx xxx xxxx')} : o;
  const titleFit = fitG(src.title, {maxWidth: w - pad * 2, size: ts, minSize: ts, maxLines: 3, weight: 700});
  const rowFits = src.rows.map(t => fitG(t, {maxWidth: textW, size: ts, minSize: ts, maxLines: 4, weight: 600}));
  const headH = titleFit.height + pad * 1.2;
  const rows = [];
  let y = headH;
  for (const f of rowFits) {
    const rh = Math.max(ts * 1.5, f.height + pad * 1.1, nS * 1.4);
    rows.push({y, h: rh});
    y += rh;
  }
  const H = y + pad * 0.6;
  const parts = [
    h('path', {d: roundRectPath(6, 8, w, H, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, H, 6), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M0 ${r(headH)}H${r(w)}`, stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(2, 2, w - 4, headH - 3, 5), fill: o.headFill ?? th.paperShade}),
    ...rows.slice(1).map(q => h('path', {d: `M${r(pad)} ${r(q.y)}H${r(w - pad)}`, stroke: th.paperLine, 'stroke-width': 2})),
  ];
  if (o.showText && !o.barsOnly) {
    parts.push(textBlock(titleFit, {x: pad, y: (headH - titleFit.height) / 2, fill: INK, name: `${prefix}-title`}));
    rowFits.forEach((f, i) => {
      parts.push(textBlock(fitG(`${o.marks ? o.marks[i] : i + 1}`, {maxWidth: numW, size: ts, minSize: ts, maxLines: 1, weight: 800}), {x: x0 + pad, y: rows[i].y + (rows[i].h - ts * 1.2) / 2, fill: th.accent2, name: `${prefix}-n${i}`}));
      parts.push(textBlock(f, {x: x0 + pad + numW, y: rows[i].y + (rows[i].h - f.height) / 2, fill: INK, name: `${prefix}-r${i}`}));
    });
  } else {
    // (a bar-only sheet keeps its row numbers when its text is shown elsewhere: the links still read)
    if (o.showText) rowFits.forEach((f, i) => parts.push(textBlock(fitG(`${o.marks ? o.marks[i] : i + 1}`, {maxWidth: numW * 2, size: o.numSize ?? ts, minSize: o.numSize ?? ts, maxLines: 1, weight: 800}), {x: x0 + pad, y: rows[i].y + (rows[i].h - (o.numSize ?? ts) * 1.2) / 2, fill: th.accent2, name: `${prefix}-n${i}`})));
    parts.push(h('rect', {'data-bar': 1, x: r(pad), y: r(headH / 2 - ts * 0.2), width: r((w - pad * 2) * 0.6), height: r(ts * 0.4), rx: 3, fill: th.paperLine}));
    rowFits.forEach((f, i) => parts.push(h('rect', {'data-bar': 1, x: r(x0 + pad + numW), y: r(rows[i].y + rows[i].h / 2 - ts * 0.2), width: r(textW * (0.6 + 0.3 * ((i * 37) % 10) / 10)), height: r(ts * 0.4), rx: 3, fill: th.paperLine})));
  }
  const pins = rows.map(q => ({x: o.pinSide === 'left' ? pinW * 0.35 : w - pinW / 2, y: q.y + q.h / 2}));
  pins.forEach(q => parts.push(h('circle', {cx: r(q.x), cy: r(q.y), r: r(ts * 0.3), fill: th.metal, stroke: INK, 'stroke-width': 2})));
  return {node: g({name: prefix}, parts), w, h: H, rows, pins, fits: [titleFit, ...rowFits]};
}

/** A state badge: ● solid circle (admitted) or ◆ solid diamond (disputed), equal size and stroke. */
export function stateBadge(ctx, {name, state, x, y, R, opacity = 0}) {
  const th = ctx.theme;
  const shape = state === 'disputed'
    ? h('path', {d: `M${r(x)} ${r(y - R * 1.22)}L${r(x + R * 1.22)} ${r(y)}L${r(x)} ${r(y + R * 1.22)}L${r(x - R * 1.22)} ${r(y)}Z`, fill: th.accent3, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'})
    : h('circle', {cx: r(x), cy: r(y), r: r(R), fill: th.accent2, stroke: INK, 'stroke-width': 2.4});
  return g({name, opacity}, shape);
}
/** Link style per state: admitted solid, disputed dashed (the disputed marker); same width, same weight. */
export function linkStyle(ctx, state) {
  const th = ctx.theme;
  return state === 'disputed' ? {stroke: th.accent3, dash: '12 8'} : {stroke: th.accent2, dash: null};
}

/* ======================================================================== */
/* Stage                                                                     */
/* ======================================================================== */

export const PK0 = 1.3;
const STAGE_CACHE = new WeakMap();
const IDS = new WeakMap();
let seq = 0;
const idOf = v => (v && typeof v === 'object' ? (IDS.get(v) ?? (IDS.set(v, ++seq), seq)) : 0);

/**
 * Build the board stage (memoised per layout pass).
 * @param {any} ctx
 * @param {{prefix:string, ts:number, p:any, looks:{a:any,b:any}, showText:boolean, markIdx?:number, compact?:boolean,
 *   noCal?:boolean, noDesk?:boolean, peopleK?:number, lwK?:number, calCols?:number|null, sections?:any[], tight?:boolean,
 *   tuck?:boolean, calSide?:boolean, side?:boolean}} o
 *   sections: the sections to draw (default: the supplied ones); o.p.documents give the texts.
 */
export function boardStage(ctx, o) {
  let cache = STAGE_CACHE.get(ctx);
  if (!cache) { cache = new Map(); STAGE_CACHE.set(ctx, cache); }
  const key = JSON.stringify(Object.keys(o).sort().map(k => [k, k === 'p' || k === 'looks' || k === 'sections' ? idOf(o[k]) : typeof o[k] === 'number' ? Math.round(o[k] * 1e4) / 1e4 : o[k]]));
  if (cache.has(key)) return cache.get(key);
  const st = stageAt(ctx, o);
  // (a bounded memo: the solver's scan builds many sizes; only the recent ones are kept)
  if (cache.size > 24) cache.delete(cache.keys().next().value);
  cache.set(key, st);
  return st;
}

function stageAt(ctx, o) {
  const th = ctx.theme;
  const {prefix: P, ts, p, showText} = o;
  const secs = o.sections || sectionsOf(p);
  const nL = secs.length;
  // (o.compactTs: the compact board's own size — a contrast scene with large people keeps its board legible)
  const lts = o.compact ? Math.min(ts, o.compactTs ?? 20) : ts;
  // (props' size: compact props print no text, so they keep a fixed modest size)
  const pts = lts;
  // ---- the two sheets (same width), stacked on the board
  const LW = Math.max(lts * (o.lwK ?? 12), 240);
  const claim = boardSheet(ctx, {prefix: `${P}-cl`, w: LW, size: lts, title: p.documents.claim.title, rows: p.documents.claim.allegations, showText, barsOnly: Boolean(o.compact), numSize: ts});
  const resp = boardSheet(ctx, {prefix: `${P}-rs`, w: LW, size: lts, title: p.documents.response.title, rows: secs.map(s => s.label), marks: secs.map((s, i) => `§${i + 1}`), showText, barsOnly: Boolean(o.compact), numSize: ts, headFill: shade(th.accent2Soft, 0.02), pinSide: o.side ? 'left' : 'right'});
  const boardPad = lts * 0.6;
  // ---- the links' channel between the two sheets (one lane per section): claim at the left, response at the right
  const lane = lts * 0.95;
  const chan0 = lts * 0.9;
  const chanW = chan0 * 2 + lane * nL;
  // (default: the claim sheet above the response sheet, both pinned on their right edges, the channel at their right —
  // the pointer, coming from Party B at the right, never crosses a sheet; o.side: the sheets side by side)
  const gapS = o.side ? 0 : lts * 1.5;
  const boardW = (o.side ? LW * 2 : LW) + chanW + boardPad * 2;
  const boardH = (o.side ? Math.max(claim.h, resp.h) : claim.h + gapS + resp.h) + boardPad * 2;
  // ---- people: Party B stands right of the channel and carries each thread on the tip of a telescopic pointer (her hand
  // stays within reach; the pointer extends to cover the board)
  const reachOf = pk => (80 + 76 + 9) * pk * 0.96;
  const PK = PK0 * (o.peopleK ?? 1);
  const q = PK / PK0;
  // ---- vertical placement: the board's bottom at desk-top height, the board rising above it
  const shoulderY = -302 * PK;
  let boardTop = -150 * PK - boardH;
  // ---- horizontal: desk (Party A seated) · board · channel · Party B
  const SEAT = -132 * PK, TOP = -196 * PK;
  // (a tray is never narrower than its label's longest word: no word breaks inside the plate)
  const trayWord = Math.max(...[p.labels.claimTray, p.labels.responseTray].flatMap(t => glue(t).split(' ')).map(w => ctx.measure(w.replace(/\u00a0/g, ' '), pts, 700, 'sans')));
  const trayW = Math.max(pts * 7, 170, showText && !o.compact ? trayWord + pts * 3.2 : 0);
  const fileW = caseFileW(ctx, p.documents.caseFile, pts, Math.max(pts * 7.5, 180));
  const deskX0 = 44 * q;
  const noDesk = Boolean(o.noDesk);
  // (o.deskOnly: only the desk part — Party A, the desk, the case file, the trays and the calendar — for frames
  // that stage it on its own level under the board)
  const deskOnly = Boolean(o.deskOnly);
  // (the desk carries the case file, standing, and the two trays)
  const fileX = 150 * q;
  const trayX0 = fileX + fileW + 30 * q;
  const deskX1 = noDesk ? 0 : trayX0 + trayW * 2 + 30 * q;
  // (o.tuck: the board hangs on the wall above the desk, Party A seated under it — a compact, near-square stage)
  const tuck = Boolean(o.tuck) && !noDesk && !deskOnly;
  const days = p.dates.window;
  // (printed days set the cell width; a calendar without text keeps a nominal cell)
  const minCell = showText && !o.compact ? Math.max(...days.map(d => ctx.measure(glue(d).replace(/ /g, ' '), pts, 700, 'sans'))) + pts * 1.1 : pts * 3;
  // (hanging board: when the desk is wider than the board, the board sits at the desk's right end and the calendar
  // hangs beside it, to its left — no extra height; otherwise the calendar hangs above the board)
  const tuckRight = Math.max(deskX1 + 20 * q, 40 * q + boardW);
  const calSide = tuck && o.calSide !== false && (tuckRight - boardW) - 30 * q - (-60 * q) >= Math.max(pts * 9, minCell * 2);
  const boardX = calSide ? tuckRight - boardW : noDesk || tuck ? 40 * q : deskX1 + 50 * q;
  // ---- desk props: trays, Party A, shelf + case file, calendar
  const trays = noDesk ? [] : [
    letterTray(ctx, {prefix: `${P}-tc`, w: trayW, lipTop: -(pts * 1.6), rackTop: -(pts * 4), label: p.labels.claimTray, size: pts, showText: showText && !o.compact, icon: 'in', plain: Boolean(o.compact), noIcon: true}),
    letterTray(ctx, {prefix: `${P}-tr`, w: trayW, lipTop: -(pts * 1.6), rackTop: -(pts * 4), label: p.labels.responseTray, size: pts, showText: showText && !o.compact, icon: 'out', plain: Boolean(o.compact), noIcon: true}),
  ];
  const trayXs = [trayX0 + trayW / 2, trayX0 + trayW * 1.5 + 15 * q];
  const cf = noDesk ? null : caseFile(ctx, {prefix: `${P}-cf`, w: fileW, ref: p.documents.caseFile.ref, title: p.documents.caseFile.title, size: pts, showText: showText && !o.compact});
  const shelfY = TOP;
  // (the calendar hangs on the wall above the desk, as wide as the desk)
  const calX0 = calSide ? -60 * q : noDesk || tuck ? boardX : deskOnly ? trayX0 - 10 * q : 70 * q;
  const calX1 = calSide ? boardX - 30 * q : noDesk || tuck ? boardX + boardW : deskOnly ? deskX1 : boardX - 30 * q;
  const calW0 = Math.max(calX1 - calX0, pts * 9);
  let cols = o.calCols ?? days.length;
  while (cols > 1 && calW0 / cols < minCell) cols--;
  if (cols < days.length) cols = Math.ceil(days.length / Math.ceil(days.length / cols));
  const calOpt = {prefix: `${P}-cal`, x: calX0, w: calW0, cols, days, title: p.labels.calendar, size: pts, showText: showText && !o.compact, showTitle: !o.compact, slotH: pts * 1.5};
  const cal0 = o.noCal ? null : calendarStrip(ctx, {...calOpt, y: 0});
  // (the calendar hangs over the trays on a desk level, over the board on a board level or a hanging board)
  if (tuck) {
    // (the board’s bottom clears Party A’s head, the standing case file and the trays’ racks)
    const clearY = Math.min(SEAT - 176 * PK - 46 * PK - 8, cf ? TOP - cf.h : 0, TOP - pts * 4) - lts * 0.8;
    boardTop = clearY - boardH;
  }
  const calY = calSide ? boardTop + boardH - (cal0 ? cal0.h : 0) : noDesk || tuck ? boardTop - lts * 1.5 - (cal0 ? cal0.h : 0) : deskOnly ? TOP - pts * 5.2 - (cal0 ? cal0.h : 0) : Math.min(TOP - (cf ? cf.h : 0) - pts * 1.5, -410 * PK + 40) - (cal0 ? cal0.h : 0);
  const cal = o.noCal ? null : calendarStrip(ctx, {...calOpt, y: calY});
  const claimPos = {x: boardX + boardPad, y: boardTop + boardPad};
  const chanX = claimPos.x + LW;
  const respPos = o.side ? {x: chanX + chanW, y: boardTop + boardPad} : {x: claimPos.x, y: claimPos.y + claim.h + gapS};
  const xB = (tuck ? Math.max(boardX + boardW, deskX1 + 20 * q) : boardX + boardW) + 70 * PK;
  // ---- links: response pin → own lane → claim pin (rounded corners)
  const links = secs.map((s, i) => {
    const a = {x: respPos.x + resp.pins[i].x, y: respPos.y + resp.pins[i].y};
    const b = {x: claimPos.x + claim.pins[s.refers].x, y: claimPos.y + claim.pins[s.refers].y};
    const lx = chanX + chan0 + lane * i + lane / 2;
    const pts = [a, {x: lx, y: a.y}, {x: lx, y: b.y}, b];
    const d = `M${r(a.x)} ${r(a.y)}H${r(lx)}V${r(b.y)}H${r(b.x)}`;
    const poly = polyline(pts);
    // (the state badge sits on the link's own lane: in the gap between the stacked sheets — where no other link runs
    // level — or, side by side, between its two rows)
    const badge = {x: lx, y: o.side ? (a.y + b.y) / 2 : claimPos.y + claim.h + gapS / 2};
    return {i, state: s.state, refers: s.refers, a, b, lx, d, poly, badge};
  });
  // (o.wallExtra: the wall rises higher by this much — a taller room fills a tall frame's free height)
  const wallTop = -(o.wallExtra ?? 0) + (deskOnly ? Math.min(cal ? calY - pts * 1.2 : 0, cf ? shelfY - cf.h - 30 : 0, SEAT - 240 * PK) : Math.min(cal ? calY - pts * 1.2 : 0, boardTop - lts * 1.2, cf ? shelfY - cf.h - 30 : 0, -410 * PK - 30));
  const A = noDesk ? null : seatedParty(ctx, {name: `${P}-pa`, look: o.looks.b});
  const Brig = personRig(ctx, {name: `${P}-pb`, look: o.looks.a, pose: 'standing'});
  const x0 = noDesk ? 0 : -100 * q;
  // (o.wallExtraX: the wall runs further right by this much — a room that fills a box beside it)
  const x1 = (deskOnly ? deskX1 + 40 * q : xB + 90 * PK) + (o.wallExtraX ?? 0);
  const markIdx = o.markIdx ?? 0;
  const linkNodes = links.map(L => {
    const sty = linkStyle(ctx, L.state);
    const len = L.poly.total;
    return g({name: `${P}-lk${L.i}`},
      h('path', {name: `${P}-lk${L.i}-line`, d: L.d, fill: 'none', stroke: sty.stroke, 'stroke-width': lts * 0.22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
      sty.dash ? h('path', {name: `${P}-lk${L.i}-dash`, d: L.d, fill: 'none', stroke: th.paper, 'stroke-width': lts * 0.12, 'stroke-dasharray': sty.dash, opacity: 0}) : null);
  });
  const badges = links.map(L => stateBadge(ctx, {name: `${P}-bd${L.i}`, state: L.state, x: L.badge.x, y: L.badge.y, R: lts * 0.42}));
  // the pin board
  const boardG = deskOnly ? null : g(null,
      h('path', {d: roundRectPath(boardX + 6, boardTop + 8, boardW, boardH, 10), fill: th.shadow}),
      h('path', {d: roundRectPath(boardX, boardTop, boardW, boardH, 10), fill: '#c9a77a', stroke: INK, 'stroke-width': 2.6}),
      g({transform: T(claimPos.x, claimPos.y)}, claim.node),
      g({transform: T(respPos.x, respPos.y)}, resp.node),
      linkNodes,
      badges);
  // (o.boardOnly: the board alone — a lens copy that leaves out every piece its rim would cut)
  const node = o.boardOnly ? g({name: P}, boardG) : g({name: P},
    backWall(ctx, {x0, x1, top: wallTop, plantX: null}),
    boardG,
    cal ? cal.node(markIdx) : null,
    cf ? g({transform: T(fileX, shelfY)}, cf.node) : null,
    noDesk ? null : g({transform: T(0, SEAT)}, g({transform: `scale(${PK})`}, officeChair(ctx, {facing: 1}))),
    A ? A.body : null,
    noDesk ? null : deskNode(ctx, deskX0, deskX1, TOP, q),
    trays.map((t, k) => g({transform: T(trayXs[k], TOP)}, t.back, t.front)),
    A ? A.near : null,
    deskOnly ? null : Brig.node,
    deskOnly ? null : h('line', {name: `${P}-ptr`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: '#4a3a2c', 'stroke-width': 7 * q, 'stroke-linecap': 'round'}),
  );
  // ---- semantic geometry
  const heads = {a: noDesk ? null : {x: 6 * PK, y: SEAT - 176 * PK}, b: deskOnly ? null : {x: xB - 5 * PK, y: -366 * PK}};
  const R = 46 * PK;
  const box = (x, y, w, hh) => ({x, y, w, h: hh});
  const boxes = {
    headA: heads.a ? box(heads.a.x - R, heads.a.y - R - 8, 2 * R, 2 * R + 8) : box(0, 0, 0, 0),
    headB: heads.b ? box(heads.b.x - R, heads.b.y - R - 8, 2 * R, 2 * R + 8) : box(0, 0, 0, 0),
    personA: heads.a ? box(-80 * q, heads.a.y - R - 8, 210 * q, -heads.a.y + R + 8) : box(0, 0, 0, 0),
    personB: heads.b ? box(xB - 60 * PK, heads.b.y - R - 8, 120 * PK, -heads.b.y + R + 8) : box(0, 0, 0, 0),
    board: box(boardX, boardTop, boardW, boardH),
    claim: box(claimPos.x, claimPos.y, LW, claim.h),
    response: box(respPos.x, respPos.y, LW, resp.h),
    channel: box(chanX, boardTop, chanW, boardH),
    sheets: o.side ? box(claimPos.x, claimPos.y, LW * 2 + chanW, Math.max(claim.h, resp.h)) : box(claimPos.x, claimPos.y, LW, claim.h + gapS + resp.h),
    file: cf ? box(fileX, shelfY - cf.h, fileW + 8, cf.h) : box(0, 0, 0, 0),
    shelf: box(0, 0, 0, 0),
    cal: cal ? box(calX0, calY - pts * 0.9, calW0, cal.h + pts * 0.9) : box(0, 0, 0, 0),
    trays: trays.map((t, k) => box(trayXs[k] - trayW / 2 - 8, TOP - pts * 4 - 8, trayW + 16, pts * 4 + 8 + Math.max(0, t.plate.y + t.plate.h))),
    desk: noDesk ? box(0, 0, 0, 0) : box(deskX0, TOP, deskX1 - deskX0, -TOP),
  };
  const restB = {x: xB - 40 * PK, y: -180 * PK};
  // the pointer is telescopic: the hand stays within reach, short of the tip by at least PTR (the collapsed length)
  const shoulderB = {x: xB - 12 * PK, y: shoulderY};
  const PTR = 110 * PK;
  // (at rest the collapsed pointer hangs down in front of Party B, clear of the desk and its trays)
  const restTip = {x: restB.x - 10 * PK, y: restB.y + 90 * PK};
  // (free moves of the tip — reaching the next pin, returning to rest — run along the channel's outer edge, never
  // across a sheet)
  const wayX = o.side ? null : chanX + chanW - chan0 * 0.5;
  const G = {PK, ts: lts, LW, links, wayX, restB, restTip, PTR, shoulderB, reach: reachOf(PK), claimPos, respPos, claim, resp, chanX, chanW, boardTop, boardH, xB, nL};
  function pose(v) {
    const nodes = {};
    const handAt = deskOnly ? null : handFor(v.tip, shoulderB, PTR, reachOf(PK), 12 * PK, o.side ? -Infinity : chanX + chan0);
    const fb = deskOnly ? {nodes: {}, hands: {near: null}, head: null, reached: true} : Brig.frame({x: xB, y: 0, facing: -1, scale: PK, lean: 0, near: handAt, headTilt: 0});
    if (!deskOnly) nodes[`${P}-ptr`] = {x1: r(fb.hands.near.x), y1: r(fb.hands.near.y), x2: r(v.tip.x), y2: r(v.tip.y)};
    Object.assign(nodes, fb.nodes);
    let fa = null;
    if (A) { fa = A.frame({x: 0, y: SEAT, facing: 1, scale: PK, lean: 0, near: null, headTilt: 0}); Object.assign(nodes, fa.nodes); }
    if (!deskOnly) links.forEach((L, i) => {
      const t = v.drawn[i];
      nodes[`${P}-lk${i}-line`] = {'stroke-dashoffset': r(L.poly.total * (1 - t))};
      if (L.state === 'disputed') nodes[`${P}-lk${i}-dash`] = {opacity: t >= 1 ? 1 : 0};
      nodes[`${P}-bd${i}`] = {opacity: r(v.badge[i], 3)};
    });
    const cf2 = cal ? cal.frame(1, v.markP, markIdx) : null;
    if (cf2) Object.assign(nodes, cf2.nodes);
    return {nodes, semantic: {hand: fb.hands.near, tip: v.tip, grip: handAt, headB: fb.head, headA: fa ? fa.head : null, allReached: fb.reached, markP: r(v.markP, 3)}};
  }
  const em = o.compact ? 24 : lts * 0.6;
  const ext = {x: x0, y: wallTop - em, w: x1 - x0, h: -wallTop + em + 48};
  const fitsList = o.compact ? [] : [...(deskOnly ? [] : [...claim.fits, ...resp.fits]), ...(cf ? [cf.refFit, cf.titleFit] : []), ...(cal ? [cal.titleFit] : []), ...trays.map(t => t.fit), ...(cal ? cal.dayFits : [])];
  return {node, pose, G, boxes, heads, ext, fits: fitsList, cal, links, PK};
}

/**
 * Where the hand holds the telescopic pointer whose tip is at `tip`: on the shoulder–tip line, at least `L` short of
 * the tip, never beyond 0.9 of the reach nor closer than 0.4 of it; never higher than `lift` under the shoulder
 * (the hand stays clear of the head: the raised pointer, not the arm, reaches the high rows), nor left of `minX`.
 */
function handFor(tip, sh, L, reach, lift, minX = -Infinity) {
  const d = Math.hypot(tip.x - sh.x, tip.y - sh.y) || 1;
  const k = clamp(d - L, reach * 0.4, reach * 0.9);
  const hand = {x: sh.x + (tip.x - sh.x) * k / d, y: sh.y + (tip.y - sh.y) * k / d};
  if (hand.y < sh.y + lift) {
    hand.y = sh.y + lift;
    hand.x = sh.x + Math.sign(tip.x - sh.x || -1) * Math.sqrt(Math.max(0, k * k - lift * lift));
  }
  // (never left of the channel: the pointer then never crosses a sheet)
  hand.x = Math.max(hand.x, minX);
  return hand;
}

function deskNode(ctx, x0, x1, top, q) {
  const th = ctx.theme;
  const W = x1 - x0;
  return g(null,
    ...[x0 + 30 * q, x1 - 30 * q].map(x => h('rect', {x: r(x - 10), y: r(top + 16), width: 20, height: r(-top - 16), fill: shade(th.wood, -0.12), stroke: INK, 'stroke-width': 2.2})),
    h('rect', {x: r(x0), y: r(top), width: r(W), height: 18, rx: 6, fill: th.woodTop, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: r(x0 + 12), y: r(top + 18), width: r(W - 24), height: r(30 * q), fill: th.wood, stroke: INK, 'stroke-width': 2.2}),
  );
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

/**
 * Action values for clock c: Party B carries each section's thread from its pin, along its lane, to the allegation
 * it answers; the link's supplied state shows only once it is pinned (cause before effect).
 * @param {number} c 0..1
 * @param {any} G stage geometry
 * @param {{upTo?:number}} [o] upTo: number of links carried (the rest stay unlinked)
 */
export function choreo(c, G, o = {}) {
  const n = G.links.length;
  const upTo = o.upTo ?? n;
  // (free moves ease gently: the long reach from rest to a pin never strobes)
  const e = ease.inOutSine;
  const a0 = 0.04, a1 = 0.9;
  const w = (a1 - a0) / n;
  const drawn = [], badge = [];
  let hand = G.restTip, phase = 'rest', active = -1;
  let prevEnd = G.restTip;
  for (let i = 0; i < n; i++) {
    const L = G.links[i];
    const s0 = a0 + i * w;
    const goTo = [s0, s0 + w * 0.25], draw = [s0 + w * 0.25, s0 + w * 0.72], pin = [s0 + w * 0.72, s0 + w * 0.92];
    const doIt = i < upTo;
    drawn.push(doIt ? ease.inOutSine(seg(c, ...draw)) : 0);
    badge.push(doIt ? seg(c, ...pin) : 0);
    if (!doIt) continue;
    if (c >= goTo[0] && c < goTo[1]) { hand = via(G, prevEnd, L.a, e(seg(c, ...goTo))); phase = 'reach'; active = i; }
    else if (c >= draw[0] && c < draw[1]) { hand = L.poly.at(drawn[i]); phase = 'carry'; active = i; }
    else if (c >= draw[1] && c < s0 + w) { hand = L.b; phase = 'pin'; active = i; }
    prevEnd = L.b;
  }
  const last = Math.min(upTo, n) - 1;
  const back = [a1, a1 + 0.1];
  if (last >= 0 && c >= a0 + (last + 1) * w) { hand = via(G, G.links[last].b, G.restTip, e(seg(c, ...back))); phase = c >= back[1] ? 'rest' : 'return'; active = -1; }
  if (c < a0) { hand = G.restTip; phase = 'rest'; }
  const done = upTo >= n;
  // (`tip` is the pointer's tip, which carries the thread's end)
  return {tip: hand, drawn, badge, phase, active, markP: done ? seg(c, 0.93, 0.99) : 0, linked: drawn.filter(t => t >= 1).length};
}
const mix = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
/** A free move of the tip from p to q (t 0..1): out to the channel's outer edge, along it, then in. */
function via(G, p, q, t) {
  if (G.wayX === null || G.wayX === undefined) return mix(p, q, t);
  const pts = [p];
  if (p.x < G.wayX - 0.5) pts.push({x: G.wayX, y: p.y});
  if (q.x < G.wayX - 0.5) pts.push({x: G.wayX, y: q.y});
  pts.push(q);
  return polyline(pts).at(t);
}

/* ======================================================================== */
/* Fitting a stage into a box                                                */
/* ======================================================================== */

/**
 * Fit a board stage into a design box: the stage's text is sized in stage units (B·m / scale); the largest scale
 * that fits is found by scanning down and refining; long supplied text may step the text down (m ≥ 0.82 ≈ 16 px)
 * before the people would fall below `sMin`.
 * @param {any} ctx
 * @param {{B:number, availW:number, availH:number, sMin:number, opts:any}} o
 */
export function solveBoard(ctx, o) {
  let m = 1;
  const tsOf = sc => Math.round(((o.B * m) / sc) * 20) / 20;
  // (o.split: two levels — the board with Party B above, the desk with Party A under it — at one common scale)
  const build = sc => boardStage(ctx, {...o.opts, ts: tsOf(sc), ...(o.split ? {noDesk: true, noCal: true} : {})});
  const buildDesk = sc => boardStage(ctx, {...o.opts, ts: tsOf(sc), deskOnly: true, prefix: `${o.opts.prefix}d`});
  const gapL = 16;
  const fitsAt = sc => {
    const st = build(sc);
    if (!o.split) return st.ext.w * sc <= o.availW && (st.ext.h - 30) * sc <= o.availH;
    const dk = buildDesk(sc);
    return Math.max(st.ext.w, dk.ext.w) * sc <= o.availW && (st.ext.h - 30 + dk.ext.h - 30) * sc + gapL <= o.availH;
  };
  const solve = () => {
    let found = null, prev = null;
    // (a text-bound stage keeps the same drawn size at every scale: once shrinking stops helping, the scan stops)
    let lastW = Infinity, flat = 0;
    // (o.scMin: the smallest scale scanned — a compact stage, whose size is linear in the scale, may go lower)
    for (let sc = 1.6; sc >= (o.scMin ?? 0.2); prev = sc, sc *= 0.86) {
      if (fitsAt(sc)) { found = sc; break; }
      const st = build(sc), dk = o.split ? buildDesk(sc) : null;
      const wNow = Math.max(Math.max(st.ext.w, dk ? dk.ext.w : 0) * sc / o.availW, (st.ext.h - 30 + (dk ? dk.ext.h - 30 : 0)) * sc / o.availH);
      flat = wNow > lastW * 0.985 ? flat + 1 : 0;
      lastW = wNow;
      if (flat >= 2) break;
    }
    if (found === null) return 0;
    let lo = found, hi = prev ?? found / 0.86;
    for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (fitsAt(mid)) lo = mid; else hi = mid; }
    return lo;
  };
  const people = sc => (sc ? sc * build(sc).PK : 0);
  let sc = solve();
  if (!sc || people(sc) < o.sMin) {
    let best = {m: 1, sc};
    for (const mm of [0.94, 0.88, 0.82]) {
      m = mm;
      const s2 = solve();
      if (s2 && people(s2) > people(best.sc) + 1e-6) best = {m: mm, sc: s2};
      if (s2 && people(s2) >= o.sMin) { best = {m: mm, sc: s2}; break; }
    }
    m = best.m; sc = best.sc;
  }
  const fitted = Boolean(sc);
  if (!sc) sc = 0.2;
  let stage = build(sc);
  // (o.fillH: the wall rises into the free height above the stage, so the room fills the box)
  if (o.fillH && !o.split && fitted) {
    const spare = o.availH / sc - (stage.ext.h - 30);
    if (spare > 2) stage = boardStage(ctx, {...o.opts, ts: tsOf(sc), wallExtra: Math.round(spare)});
  }
  return {stage, desk: o.split ? buildDesk(sc) : null, s: sc, m, fitted, ts: tsOf(sc)};
}

/**
 * Place a solved board (and, on two levels, its desk) in the design box: the board level on top, its name-chip band
 * under its floor, then the desk level (with its own chip band); each level centred in the width; the whole block
 * centred in the free height. Returns the mappers of both levels and the mapped boxes, A's (desk) and B's (board).
 * @param {{stage:any, desk:any, s:number}} sol
 * @param {{x0:number, top0:number, availW:number, bottom:number, chipBand:number}} f
 */
export function placeBoard(sol, f) {
  const s = sol.s;
  const E1 = sol.stage.ext;
  const map = (ox, oy) => ({ox, oy, M: q => ({x: ox + q.x * s, y: oy + q.y * s}), Mb: b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s})});
  const h1 = (E1.h - 30) * s;
  const E2 = sol.desk ? sol.desk.ext : null;
  const h2 = E2 ? (E2.h - 30) * s + f.chipBand : 0;
  const total = h1 + f.chipBand + h2;
  const free = Math.max(0, f.bottom - f.top0 - total);
  const top = f.top0 + free / 2;
  const boardL = map(f.x0 + (f.availW - E1.w * s) / 2 - E1.x * s, top - E1.y * s + 2);
  const deskL = E2 ? map(f.x0 + (f.availW - E2.w * s) / 2 - E2.x * s, boardL.oy + f.chipBand + 4 - E2.y * s - 30 * s + 18 * s) : boardL;
  const bB = sol.stage.boxes, bA = sol.desk ? sol.desk.boxes : sol.stage.boxes;
  const boxes = {
    personA: deskL.Mb(bA.personA), headA: deskL.Mb(bA.headA), file: deskL.Mb(bA.file), cal: deskL.Mb(bA.cal), trays: bA.trays.map(deskL.Mb), desk: deskL.Mb(bA.desk),
    personB: boardL.Mb(bB.personB), headB: boardL.Mb(bB.headB), board: boardL.Mb(bB.board), channel: boardL.Mb(bB.channel), claim: boardL.Mb(bB.claim), response: boardL.Mb(bB.response), sheets: boardL.Mb(bB.sheets),
  };
  return {s, board: boardL, desk: deskL, boxes, split: Boolean(sol.desk), floorA: deskL.oy, floorB: boardL.oy};
}
