/**
 * "Exhibición de documento" kit (LAW-0301..0304, hearings-06): a generic, fictional hearing room drawn as a floor
 * plan, built for showing a document. Along the top wall hangs a DISPLAY BOARD with two places, in the order supplied
 * (a sequence as configured, illustrative): the place of the COMPLETE DOCUMENT (a page drawn as generic lines and
 * blocks, with its fictional reference on a tag, ● as supplied) and the place of the ENLARGED ZONE (◆ selected detail,
 * as supplied, with its caption). A presenter (the participant supplied as `presenter`; no rank implied) stands at a
 * lectern beside the board; the other participants sit at a shared table; the exhibits lie on a low cabinet by the
 * right wall; a wall clock is the support.
 *
 * The concrete action — "a documentary object appears with a reference and an enlarged zone": the presenter points to
 * the board; the document leaves its place on the cabinet, travels along the free lane under the board and settles on
 * its place, its reference tag arriving with it; a frame marks the supplied REGION of lines; an enlarged copy of that
 * region (lines and blocks only — never text) grows out of the frame into the zone's place, tethered to it.
 *
 * Nothing is assessed: no authenticity, admissibility, weight, admission, exclusion or ruling is shown or inferred.
 * The document's content is generic (lines and blocks); the region is only a supplied region; ● and ◆ are supplied
 * states of equal weight. Generic art comes from ./hearings-art.js and ../../courts/kits/courts-art.js; text, chip
 * placement and panel helpers from ./apertura-audiencia.js — all imported READ-ONLY.
 * @module animations/hearings/kits/exhibicion-documento
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {floorArea, wallRing, planChair, planPerson, planLectern, PERSON} from '../../courts/kits/courts-art.js';
import {hearingColors, stateGlyph, ovalTable, wallClock, exhibitBox, lowCabinet, plainDoor, facing, toWorld, reachRecords} from './hearings-art.js';
import {FONT, WALL, fitG, textAt, measureSpeakerChip, placeLabels, mapper, mapBox, legendGlyph, rowNode} from './apertura-audiencia.js';

const INK = '#1f2328';

/** Template sizes: the document page and the enlarged zone's panel. */
export const DOC = {w: 132, h: 176};
export const ZONE = {w: 216, h: 128};
/** The document as it lies on the cabinet (scale of the page). */
export const DOC_S0 = 0.36;

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: speakers, statements, exhibits, sequence). */
export const edFields = {
  hearing: obj('Generic, fictional hearing room', {room: str('Name of the room (fictional)', 60)}, ['room']),
  speakers: list('Participants (generic, fictional): one presents at the lectern beside the board, the others sit at the shared table on the same chairs. No rank, role rule or speaking order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 3, 4),
  presenter: int('Index in `speakers` of the participant at the lectern beside the board (generic)', 0, 3),
  statements: list('The two places on the board: the complete document (● with its fictional reference, as supplied) and the selected detail (◆ with the caption of its region, as supplied). Nothing is assessed', obj('Place', {
    kind: oneOf('document (the complete page, ●) or detail (the enlarged zone, ◆) — supplied states only', ['document', 'detail']),
    text: str('Reference of the document, or caption of the selected region (fictional, as supplied)', 60),
  }, ['kind', 'text']), 2, 2),
  exhibits: list('Exhibits on the low cabinet by the wall, each with its supplied tag', str('Exhibit tag (fictional)', 50), 1, 2),
  document: obj('The document shown (generic lines and blocks; no real content)', {
    exhibit: int('Index in `exhibits` of the exhibit the document comes from', 0, 1),
    lines: int('Number of generic lines on the page', 5, 12),
    region: obj('The supplied region (first and last line, counted from 1): only a region, nothing is inferred from it', {
      from: int('First line of the region', 1, 12),
      to: int('Last line of the region', 1, 12),
    }, ['from', 'to']),
  }, ['exhibit', 'lines', 'region']),
  sequence: list('Order of the two places along the board (indices in `statements`): a sequence as configured (illustrative), not a rule', int('Index in `statements`', 0, 1), 1, 2),
  states: obj('Captions of the two supplied states', {
    document: str('Caption of ● (complete document, as supplied)', 50),
    detail: str('Caption of ◆ (selected detail, as supplied)', 50),
  }, ['document', 'detail']),
  labels: obj('Editable captions', {
    frame: str('Caption of the region frame (only a supplied region)', 60),
    sequence: str('Caption of the order of the places (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['frame', 'sequence', 'key']),
};

export const ED_EN = {
  hearing: {room: 'Hearing room 6 (fictional)'},
  speakers: [{label: 'Presenter (fictional)'}, {label: 'Participant B'}, {label: 'Participant C'}],
  presenter: 0,
  statements: [
    {kind: 'document', text: 'Exhibit 1, page 2 (fictional)'},
    {kind: 'detail', text: 'Lines 4 to 6 (as supplied)'},
  ],
  exhibits: ['Exhibit 1: delivery note'],
  document: {exhibit: 0, lines: 9, region: {from: 4, to: 6}},
  sequence: [0, 1],
  states: {document: 'Complete document (as supplied)', detail: 'Selected detail (as supplied)'},
  labels: {frame: 'Selected region (as supplied)', sequence: 'Sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const ED_ES = {
  hearing: {room: 'Sala de audiencias 6 (ficticia)'},
  speakers: [{label: 'Quien presenta (ficticia)'}, {label: 'Participante B'}, {label: 'Participante C'}],
  presenter: 0,
  statements: [
    {kind: 'document', text: 'Prueba 1, página 2 (ficticia)'},
    {kind: 'detail', text: 'Líneas 4 a 6 (según lo aportado)'},
  ],
  exhibits: ['Prueba 1: albarán de entrega'],
  document: {exhibit: 0, lines: 9, region: {from: 4, to: 6}},
  sequence: [0, 1],
  states: {document: 'Documento completo (aportado)', detail: 'Detalle seleccionado (aportado)'},
  labels: {frame: 'Zona seleccionada (aportada)', sequence: 'Secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];

/**
 * Resolve the supplied content: participants (the presenter and the seated others), the two places (document ●,
 * detail ◆) in the configured order, the exhibit the document comes from, the page's lines and the region.
 * @param {any} ctx
 * @param {any} P localised params
 */
export function resolveEd(ctx, P) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  const presenter = clamp(P.presenter ?? 0, 0, n - 1);
  const listeners = speakers.map(sp => sp.index).filter(i => i !== presenter);
  const exhibits = (P.exhibits || []).slice(0, 2);
  const sts = (P.statements || []).slice(0, 2);
  // (the two places: the first supplied document and detail; missing kinds fall back to the other slot)
  let docI = sts.findIndex(s => s.kind === 'document'), detI = sts.findIndex(s => s.kind === 'detail');
  if (docI < 0) docI = detI === 0 ? 1 : 0;
  if (detI < 0 || detI === docI) detI = docI === 0 ? 1 : 0;
  const items = [0, 1].map(i => ({i, op: i === docI ? 'document' : 'detail', text: (sts[i] && sts[i].text) || '', form: i === docI ? 'open' : 'bounded'}));
  const order = [];
  for (const q of P.sequence || []) if (q < 2 && !order.includes(q)) order.push(q);
  for (const i of [0, 1]) if (!order.includes(i)) order.push(i);
  const rank = items.map(it => order.indexOf(it.i));
  const doc = P.document || ED_EN.document;
  const lines = clamp(Math.round(doc.lines ?? 9), 5, 12);
  const from = clamp(Math.round(doc.region ? doc.region.from : 1), 1, lines);
  const to = clamp(Math.round(doc.region ? doc.region.to : from), from, lines);
  const docEx = exhibits.length ? clamp(doc.exhibit ?? 0, 0, exhibits.length - 1) : null;
  return {n, speakers, presenter, listeners, exhibits, items, order, rank, docI, detI, docEx, lines, region: {from, to}};
}

/* ------------------------------------------------------------------ */
/* The page: generic lines and blocks (deterministic, no text)         */
/* ------------------------------------------------------------------ */

const frac = x => x - Math.floor(x);
/** Width fraction of line i (deterministic: the page looks the same at every seek and in every copy). */
const lineFrac = (i, n) => (i === n - 1 ? 0.48 : 0.64 + 0.3 * frac(Math.sin((i + 1) * 12.9898) * 43758.5453));

/**
 * The page's own geometry, relative to its top-left corner: a header block, generic lines, and the rectangle of a
 * region (lines from..to, counted from 1).
 */
export function pageLayout(lines) {
  const top = 46, bottom = 16;
  const ls = (DOC.h - top - bottom) / lines;
  const lineY = i => top + ls * (i + 0.5);
  const bars = Array.from({length: lines}, (_, i) => ({i, x: 14, y: lineY(i), w: (DOC.w - 28) * lineFrac(i, lines)}));
  const regionRect = (from, to) => ({x: 8, y: lineY(from - 1) - ls * 0.5, w: DOC.w - 16, h: ls * (to - from + 1)});
  return {ls, bars, regionRect, header: {x: 14, y: 14, w: DOC.w * 0.46, h: 16}, stamp: {x: DOC.w - 44, y: 12, w: 30, h: 20}};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {number} W
 * @param {number} H
 * @param {any} R resolveEd()
 * @param {{tagFit?:any, capFit?:any, dockH?:number, dockW?:number, dockBeside?:boolean, qGap?:number, Ft?:number|null}} [o] the reference tag's and the caption's text
 *   fits at template size (null: labels hidden — plates without text)
 */
export function edGeometry(W, H, R, o = {}) {
  const t = WALL;
  const pad = 14;
  // (a plate: its cue, then its text from x + 30 + the cue's size, and a margin of 14 at the right)
  const gsT = o.Ft ? o.Ft * 0.32 : 7;
  const plate = fit => (fit ? {w: 30 + gsT + fit.width * 1.06 + 18, h: fit.height + 14} : {w: 70, h: 24});
  const tag = plate(o.tagFit), cap = plate(o.capFit);
  const dockH = o.dockH || 0;
  // (`dockBeside`, inspect in portrait: the dock stands right of the caption plate instead of under it — the detail
  // place grows wider and shorter; the zone and the caption align left in it)
  const beside = !!(o.dockBeside && dockH);
  const dockWB = beside ? Math.max(o.dockW || 0, cap.w) : 0;
  const col = {document: Math.max(DOC.w, tag.w), detail: Math.max(ZONE.w, cap.w + (beside ? 10 + dockWB : 0))};
  const left = R.rank[R.docI] <= R.rank[R.detI] ? 'document' : 'detail';
  const right = left === 'document' ? 'detail' : 'document';
  const bw = pad * 2 + col[left] + 34 + col[right];
  // (a room wider than it needs: the board with the presenter beside it stands centred, the table under it follows)
  const groupW = bw + 86 + (o.qGap || 0) + PERSON.half + 40;
  const exW = R.exhibits.length ? 54 + 24 + 40 : 0;
  const board = {x: Math.max(34, Math.min((W - groupW) / 2, W - exW - groupW - 20)), y: 8, w: bw, h: 0};
  const colX = {[left]: board.x + pad, [right]: board.x + pad + col[left] + 34};
  const page = {x: colX.document + (col.document - DOC.w) / 2, y: board.y + pad, w: DOC.w, h: DOC.h};
  const tagBox = {x: colX.document + (col.document - tag.w) / 2, y: page.y + page.h + 8, ...tag};
  const zone = {x: beside ? colX.detail : colX.detail + (col.detail - ZONE.w) / 2, y: board.y + pad, w: ZONE.w, h: ZONE.h};
  const capBox = {x: beside ? colX.detail : colX.detail + (col.detail - cap.w) / 2, y: zone.y + zone.h + 8, ...cap};
  const dock = !dockH ? null : beside ? {x: capBox.x + cap.w + 10, y: capBox.y, w: dockWB, h: dockH} : {x: capBox.x, y: capBox.y + capBox.h + 8, w: Math.max(cap.w, o.dockW || 0), h: dockH};
  if (dock && !beside) dock.x = Math.min(dock.x, board.x + board.w - pad - dock.w);
  board.h = Math.max(tagBox.y + tagBox.h, dock ? dock.y + dock.h : capBox.y + capBox.h) + pad - board.y;
  const yB = board.y + board.h;
  const PL = pageLayout(R.lines);
  // the presenter beside the board's right end, facing the board's lower corner; the lectern in front
  const bx1 = board.x + board.w;
  // (`qGap`, mechanism: the presenter stands further from the board, leaving floor for the link between them)
  const qHome = {x: bx1 + 86 + (o.qGap || 0), y: board.y + 66};
  const qDeg = facing(qHome, {x: bx1 - 80, y: qHome.y + 40});
  // (pointing: the right hand raised in front, towards the board — within the arm's reach)
  const aim = toWorld({x: qHome.x, y: qHome.y, deg: qDeg}, {x: 30, y: -66});
  const lectern = {cx: qHome.x + 4, cy: qHome.y + 84, s: 58};
  // the lane under the board: the document travels along it (labels stay off it)
  const laneY = yB + 34;
  // the cabinet against the right wall, below the lane
  const ne = R.exhibits.length;
  const exS = 54;
  const cw = exS + 24, step = exS * 0.74 + 30;
  const cabH = ne * step + 14;
  const cabX = W - 10 - cw;
  const cab0Y = Math.max(laneY + 52, lectern.cy + 50);
  // the shared table of the other participants in the lower floor, left of the cabinet
  const nL = R.listeners.length;
  const B = 54;
  const A = Math.max(110, nL * 55 + 40);
  const angles = {1: [90], 2: [124, 56], 3: [150, 90, 30]}[nL] || [];
  const Cx = Math.max(40 + A + 38 + PERSON.half, Math.min(board.x + board.w / 2, (cabX - 40) - (A + 38 + PERSON.half)));
  const C0y = laneY + 70 + B;
  // the room's needs, with the table and the cabinet as high as they can stand
  const seatDrop = Math.max(0, ...angles.map(a => Math.sin((a * Math.PI) / 180) * (B + 46)));
  const groupBottom0 = Math.max(C0y + B + 16, C0y + seatDrop + PERSON.half + 26);
  // (needs from the compact arrangement: the board at the left wall)
  const bx1c = 34 + bw, Cxc = Math.max(40 + A + 38 + PERSON.half, 34 + bw / 2);
  const needW = Math.max(bx1c + 96 + (o.qGap || 0) + PERSON.half + 40 + cw + 30, Cxc + A + 38 + PERSON.half + 40 + cw + 20, 640);
  // (with labels, the seated participants' chips need floor below them)
  const needH = Math.max(groupBottom0 + (o.Ft ? 30 + o.Ft * 2.2 : 30), ne ? cab0Y + cabH + 110 : 0, lectern.cy + 60, 520);
  // a deeper room than needed: the table and the cabinet stand lower, sharing the free floor (never empty below)
  const spare = Math.max(0, H - needH);
  const C = {x: Cx, y: C0y + spare * 0.5};
  const cab = ne ? {x: cabX, y: cab0Y + spare * 0.45, w: cw, h: cabH} : null;
  const exhibits = ne ? R.exhibits.map((_, i) => ({cx: cab.x + cw / 2, cy: cab.y + 7 + step / 2 + i * step, deg: i % 2 ? 3 : -3, s: exS})) : [];
  const seats = [];
  R.listeners.forEach((pi, j) => {
    const th = (angles[j] * Math.PI) / 180;
    const sx = C.x + Math.cos(th) * (A + 38), sy = C.y + Math.sin(th) * (B + 46);
    seats[pi] = {x: sx, y: sy, deg: facing({x: sx, y: sy}, C), angle: angles[j]};
  });
  seats[R.presenter] = {x: qHome.x, y: qHome.y, deg: qDeg, angle: 200, standing: true};
  // (the clock on the left wall at the lane's height, left of the document's route: the floor by the seats stays free)
  const clock = {cx: 46, cy: laneY + 6, R: 28};
  const door = {a: Math.min(W - 150, Math.max(C.x + A + 60, W * 0.55)), b: Math.min(W - 70, Math.max(C.x + A + 140, W * 0.55 + 80))};
  const problems = [];
  if (W + 0.5 < needW) problems.push('room-width');
  if (H + 0.5 < needH) problems.push('room-height');
  // the document's resting place: its exhibit on the cabinet (or the lectern without exhibits)
  const rest = R.docEx !== null ? {x: exhibits[R.docEx].cx, y: exhibits[R.docEx].cy, deg: -8} : {x: lectern.cx, y: lectern.cy, deg: 0};
  const pageC = {x: page.x + page.w / 2, y: page.y + page.h / 2};
  // its route: up from the cabinet to the lane, along the lane, up into its place on the board
  const route = [rest, {x: rest.x, y: laneY}, {x: pageC.x, y: laneY}, pageC];
  // the two places (columns) on the board
  const places = {document: {x: colX.document, y: board.y + pad, w: col.document, h: board.h - 2 * pad}, detail: {x: colX.detail, y: board.y + pad, w: col.detail, h: board.h - 2 * pad}};
  return {W, H, t, board, page, tagBox, zone, capBox, dock, places, left, right, PL, yB, qHome, qDeg, aim, lectern, laneY, cab, exhibits, C, A, B, seats, clock, door, needW, needH, problems, rest, route, pageC,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t}};
}

/** Obstacles of the room for label placement (template units): board, lane, cabinet, lectern, clock, door, table. */
export function edObstacles(G, o = {}) {
  const out = [
    {x: G.board.x - 8, y: 0, w: G.board.w + 16, h: G.yB + 8},
    // the lane under the board (the document's route) and the drop into the cabinet
    {x: Math.min(G.pageC.x, G.route[1].x) - DOC.w * DOC_S0 / 2 - 10, y: G.laneY - DOC.h * DOC_S0 / 2 - 10, w: Math.abs(G.route[1].x - G.pageC.x) + DOC.w * DOC_S0 + 20, h: DOC.h * DOC_S0 + 20},
    {x: G.lectern.cx - 40, y: G.lectern.cy - 30, w: 80, h: 60},
    o.lifted ? null : {x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R - 6, w: 2 * G.clock.R + 12, h: 2 * G.clock.R + 12},
    {x: G.door.a, y: G.H - (G.door.b - G.door.a), w: G.door.b - G.door.a, h: G.door.b - G.door.a},
  ];
  if (G.cab && !o.lifted) {
    const nb = G.Ft ? G.Ft * 1.9 : 0;
    out.push({x: G.cab.x - 8 - nb, y: G.cab.y - 8, w: G.cab.w + 16 + nb, h: G.cab.h + 16});
    // (the rise from the exhibit to the lane)
    const a = G.route[0], b = G.route[1];
    out.push({x: Math.min(a.x, b.x) - 30, y: b.y, w: Math.abs(a.x - b.x) + 60, h: Math.max(0, a.y - b.y)});
  }
  return out.filter(Boolean);
}

export const personBox = s => ({x: s.x - PERSON.half - 8, y: s.y - PERSON.half - 8, w: PERSON.half * 2 + 16, h: PERSON.half * 2 + 16});

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/** ● / ◆ plate with its text (the reference tag, the region caption). */
function plateNode(ctx, name, box, fit, kind, Ft, textName) {
  const c = hearingColors(ctx);
  const gs = Ft ? Ft * 0.32 : 7;
  const gx = box.x + 14 + gs, gy = fit ? box.y + 7 + fit.size * 0.55 : box.y + box.h / 2;
  return g({name},
    h('path', {name: `${name}-body`, d: roundRectPath(box.x, box.y, box.w, box.h, 6), fill: c.card, stroke: INK, 'stroke-width': 2}),
    stateGlyph(ctx, {name: `${name}-g`, kind, cx: gx, cy: gy, s: gs}),
    fit ? g({name: textName}, textAt(fit, box.x + 30 + gs, box.y + 7, INK)) : h('path', {d: `M${r(box.x + 30)} ${r(box.y + box.h / 2)}H${r(box.x + box.w - 10)}`, stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}));
}

/** Generic page content (header block, stamp, lines) at a page's top-left corner. */
function pageContent(ctx, PL, x0, y0, name) {
  const c = hearingColors(ctx);
  return g({name},
    h('path', {d: roundRectPath(x0 + PL.header.x, y0 + PL.header.y, PL.header.w, PL.header.h, 3), fill: c.paperLine}),
    h('path', {d: roundRectPath(x0 + PL.stamp.x, y0 + PL.stamp.y, PL.stamp.w, PL.stamp.h, 4), fill: 'none', stroke: c.paperLine, 'stroke-width': 2.4}),
    h('path', {d: PL.bars.map(b => `M${r(x0 + b.x)} ${r(y0 + b.y)}H${r(x0 + b.x + b.w)}`).join(''), stroke: c.paperLine, 'stroke-width': 5, 'stroke-linecap': 'round'}));
}

/** The bars of a region (lines from..to) copied, relative to the region's top-left corner. */
function regionBars(PL, reg) {
  const rr = PL.regionRect(reg.from, reg.to);
  return {rr, d: PL.bars.filter(b => b.i >= reg.from - 1 && b.i <= reg.to - 1).map(b => `M${r(b.x - rr.x)} ${r(b.y - rr.y)}H${r(b.x - rr.x + b.w)}`).join('')};
}

/** Where the enlarged copy of a region sits in the zone (scale and offset), fitted inside the zone's inset. */
export function zoneFit(G, rr) {
  const inset = 14;
  const z = Math.min((G.zone.w - 2 * inset) / rr.w, (G.zone.h - 2 * inset) / rr.h);
  return {z, x: G.zone.x + (G.zone.w - rr.w * z) / 2, y: G.zone.y + (G.zone.h - rr.h * z) / 2};
}

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G edGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, tagFit?:any, capFit?:any, keep?:(b:any)=>boolean, lift?:boolean, datum?:any, noDetail?:boolean, zoneMark?:boolean}} o
 *   datum (inspect): {region: {before, after}, capFits: {before, after}, wasFit} — the region's frame, its enlarged copy
 *   and its caption exist in both values; the old caption moves, unchanged, to the dock under the caption plate
 */
export function edRoom(ctx, G, o) {
  const P = o.prefix;
  const c = hearingColors(ctx);
  const R = o.R;
  const {W, H, t} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const wrapLift = (key, items) => (o.lift ? g({name: `${P}-lift-${key}`, transform: 'translate(0 0)'}, items) : items);
  const parts = [];
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 64}));
  parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: [
    {side: 'bottom', a: G.door.a, b: G.door.b, kind: 'door'},
    {side: 'left', a: Math.max(G.yB + 20, H * 0.62), b: Math.max(G.yB + 90, H * 0.62 + 70), kind: 'window'},
  ]}));
  const door = plainDoor(ctx, {name: `${P}-door`, hinge: {x: G.door.b, y: H + t / 2}, width: G.door.b - G.door.a, closedDeg: 180, openDeg: 80});
  parts.push(door.node);
  const clock = wallClock(ctx, {name: `${P}-clock`, cx: G.clock.cx, cy: G.clock.cy, R: G.clock.R});
  if (keep(clock.box)) parts.push(wrapLift('clock', clock.node));
  // the display board along the top wall: its two places (outlined), the reference tag and the region caption
  const B0 = G.board;
  const datum = o.datum || null;
  const boardParts = [
    h('path', {d: roundRectPath(B0.x + 4, B0.y + 6, B0.w, B0.h, 10), fill: ctx.theme.shadow}),
    h('path', {name: `${P}-board-body`, d: roundRectPath(B0.x, B0.y, B0.w, B0.h, 10), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
    h('path', {name: `${P}-page-place`, d: roundRectPath(G.page.x - 4, G.page.y - 4, G.page.w + 8, G.page.h + 8, 6), fill: 'none', stroke: '#9aa4ae', 'stroke-width': 2}),
    h('path', {name: `${P}-zone-place`, d: roundRectPath(G.zone.x, G.zone.y, G.zone.w, G.zone.h, 8), fill: '#ffffff', stroke: '#9aa4ae', 'stroke-width': 2}),
  ];
  // the enlarged zone: the copied region (bars only) and its two tethers (drawn with the board, under the page)
  const zoneCopies = [];
  const regions = datum ? {before: datum.region.before, after: datum.region.after} : {main: R.region};
  // (a lens copy draws only what lies inside its crop: `keep` — never a text outside the window)
  const keepZone = keep(G.zone), keepCap = keep(G.capBox), keepDock = G.dock ? keep(G.dock) : false, keepDoc = keep({x: G.page.x, y: G.page.y, w: G.page.w, h: G.page.h});
  const keepTag = keep(G.tagBox);
  if (!o.noDetail && keepZone) for (const [key, reg] of Object.entries(regions)) {
    const rb = regionBars(G.PL, reg);
    zoneCopies.push(g({name: `${P}-zcopy-${key}`, opacity: 0, transform: 'translate(0 0) scale(1)'},
      h('path', {d: roundRectPath(0, 0, rb.rr.w, rb.rr.h, 3), fill: c.paper, stroke: c.paperLine, 'stroke-width': 1.2}),
      h('path', {d: rb.d, stroke: '#9b9384', 'stroke-width': 5, 'stroke-linecap': 'round'})));
  }
  boardParts.push(g({name: `${P}-zone`}, zoneCopies));
  // (`zoneMark`, contrast: a ◆ on the zone's place marks that a detail is selected there, as supplied)
  if (o.zoneMark) boardParts.push(g({name: `${P}-zmark`, opacity: 0},
    h('circle', {cx: r(G.zone.x + G.zone.w - 22), cy: r(G.zone.y + 22), r: 15, fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
    stateGlyph(ctx, {name: `${P}-zmark-g`, kind: 'diamond', cx: G.zone.x + G.zone.w - 22, cy: G.zone.y + 22, s: 7.5})));
  // (a cropped copy — the inspect lens — leaves the tethers out: they run to the page, which the crop never holds)
  const keepTethers = !o.keep || (keepZone && keepDoc);
  if (keepTethers) boardParts.push(h('path', {name: `${P}-tethers`, opacity: 0, d: 'M0 0', fill: 'none', stroke: ctx.theme.accent3, 'stroke-width': 2.6, 'stroke-linecap': 'round'}));
  // the region caption plate (◆): in both values when a datum is substituted; the dock under it holds the old value
  if ((!o.noDetail || datum) && keepCap) {
    if (datum) {
      // (the dock first: the old value, moved into it, stands above its background)
      if (G.dock && datum.capFits && keepDock) {
        boardParts.push(g({name: `${P}-dock`, opacity: 0},
          h('path', {d: roundRectPath(G.dock.x, G.dock.y, G.dock.w, G.dock.h, 6), fill: '#f3f4f5', stroke: '#9aa4ae', 'stroke-width': 1.6})));
        boardParts.push(g({name: `${P}-was`, opacity: 0}, textAt(datum.wasFit, G.dock.x + 10, G.dock.y + 6, '#57606a', {italic: true})));
      }
      boardParts.push(g({name: `${P}-cap`, opacity: 0},
        h('path', {name: `${P}-cap-body`, d: roundRectPath(G.capBox.x, G.capBox.y, G.capBox.w, G.capBox.h, 6), fill: c.card, stroke: INK, 'stroke-width': 2}),
        stateGlyph(ctx, {name: `${P}-cap-g`, kind: 'diamond', cx: G.capBox.x + 14 + (o.Ft ? o.Ft * 0.32 : 7), cy: datum.capFits ? G.capBox.y + 7 + datum.capFits.before.size * 0.55 : G.capBox.y + G.capBox.h / 2, s: o.Ft ? o.Ft * 0.32 : 7}),
        datum.capFits ? g({name: `${P}-cap-v-after`, opacity: 0, transform: 'translate(0 0)'},
          g({name: `${P}-cap-v-after-text`}, textAt(datum.capFits.after, G.capBox.x + 30 + (o.Ft ? o.Ft * 0.32 : 7), G.capBox.y + 7, INK))) : null));
      // (the old value is its own group, over the plate: it leaves the plate for the dock, unchanged)
      if (datum.capFits) boardParts.push(g({name: `${P}-cap-v-before`, opacity: 0, transform: 'translate(0 0)'},
        g({name: `${P}-cap-v-before-text`}, textAt(datum.capFits.before, G.capBox.x + 30 + (o.Ft ? o.Ft * 0.32 : 7), G.capBox.y + 7, INK))));
    } else boardParts.push(g({name: `${P}-cap`, opacity: 0}, plateNode(ctx, `${P}-capplate`, G.capBox, o.capFit, 'diamond', o.Ft, `${P}-cap-text`)));
  }
  parts.push(wrapLift('board', g({name: `${P}-board`}, boardParts)));
  // cabinet and exhibits (the exhibit the document comes from stays: the document lies on it at rest)
  if (G.cab && keep(G.cab)) {
    // (the number stands on the floor just left of the cabinet: the document lying on its exhibit never covers it)
    const bx = G.cab.x - (o.Ft || 0) * 0.95;
    const badge = (e, i) => (o.Ft ? g({name: `${P}-exnum${i}`},
      h('circle', {cx: r(bx), cy: r(e.cy), r: r(o.Ft * 0.78), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
      h('text', {x: r(bx), y: r(e.cy + o.Ft * 0.34), 'font-family': FONT, 'font-size': r(o.Ft, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(i + 1))) : null);
    parts.push(wrapLift('cab', g({name: `${P}-cab`}, lowCabinet(ctx, {name: `${P}-cabinet`, ...G.cab}),
      G.exhibits.map((e, i) => g(null, exhibitBox(ctx, {name: `${P}-exhibit${i}`, cx: e.cx, cy: e.cy, s: e.s, deg: e.deg}), badge(e, i))))));
  }
  // lectern
  const lecBox = {x: G.lectern.cx - G.lectern.s / 2, y: G.lectern.cy - G.lectern.s * 0.35, w: G.lectern.s, h: G.lectern.s * 0.7};
  if (keep(lecBox)) parts.push(wrapLift('lectern', g({name: `${P}-lectern`}, planLectern(ctx, {name: `${P}-lectern-top`, cx: G.lectern.cx, cy: G.lectern.cy, s: G.lectern.s, deg: 180}))));
  // the shared table and its chairs
  if (R.listeners.length) {
    const tb = {x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2};
    if (keep(tb)) parts.push(ovalTable(ctx, {name: `${P}-table`, cx: G.C.x, cy: G.C.y, a: G.A, b: G.B, seedKey: 'exhibit-room'}));
    R.listeners.forEach(i => { const s = G.seats[i]; if (keep(personBox(s))) parts.push(planChair(ctx, {name: `${P}-chair${i}`, cx: toWorld(s, {x: 0, y: 14}).x, cy: toWorld(s, {x: 0, y: 14}).y, deg: s.deg, s: 64})); });
  }
  // people
  const rigs = R.speakers.map(sp => (keep(personBox(G.seats[sp.index])) ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null));
  parts.push(rigs.filter(Boolean).map(rg => rg.node));
  // the document: the page (generic content), its region frame(s) and its reference tag (●), moving as one
  const pg = G.page;
  const frames = Object.entries(regions).map(([key, reg]) => {
    const rr = G.PL.regionRect(reg.from, reg.to);
    return h('path', {name: `${P}-frame-${key}`, opacity: 0, d: roundRectPath(pg.x + rr.x, pg.y + rr.y, rr.w, rr.h, 4), fill: 'none', stroke: ctx.theme.accent3, 'stroke-width': 4});
  });
  const docNode = g({name: `${P}-doc`, transform: 'translate(0 0) scale(1)', opacity: 1},
    h('path', {d: roundRectPath(pg.x + 3, pg.y + 5, pg.w, pg.h, 4), fill: ctx.theme.shadow}),
    h('path', {name: `${P}-doc-body`, d: roundRectPath(pg.x, pg.y, pg.w, pg.h, 4), fill: c.paper, stroke: INK, 'stroke-width': 2.2}),
    pageContent(ctx, G.PL, pg.x, pg.y, `${P}-doc-lines`),
    frames,
    keepTag ? g({name: `${P}-tag`, opacity: 0}, plateNode(ctx, `${P}-tagplate`, G.tagBox, o.tagFit, 'dot', o.Ft, `${P}-tag-text`)) : null);
  if (keepDoc || !o.keep) parts.push(wrapLift('doc', docNode));

  /**
   * @param {{clockDeg:number, doc:{x:number,y:number,s:number,deg:number}, tag:number, frame:number, zoom:number, cap:number,
   *   reach?:any, textK?:number, lift?:any, datum?:{move:number, newIn:number, cue:number, copy:number}}} st
   */
  function frame(st) {
    const nodes = {};
    Object.assign(nodes, door.frame(0));
    if (keep(clock.box)) Object.assign(nodes, clock.frame(st.clockDeg));
    if (o.lift) for (const key of ['clock', 'board', 'cab', 'lectern', 'doc']) {
      if (key === 'cab' && !G.cab) continue;
      const q = (st.lift && st.lift[key]) || null;
      nodes[`${P}-lift-${key}`] = {transform: q ? q.transform : 'translate(0 0)'};
    }
    const tk = st.textK ?? 1;
    if (G.cab && keep(G.cab) && o.Ft) G.exhibits.forEach((_, i) => { nodes[`${P}-exnum${i}`] = {opacity: r(tk, 3)}; });
    // the document: translate its centre to the stage position, scale and turn about the centre
    const d = st.doc;
    if (keepDoc || !o.keep) nodes[`${P}-doc`] = {transform: `${T(d.x - G.pageC.x, d.y - G.pageC.y)} ${aboutC(G.pageC, d.s, d.deg)}`, opacity: 1};
    if (keepTag && (keepDoc || !o.keep)) {
      nodes[`${P}-tag`] = {opacity: r(clamp(st.tag), 3)};
      if (o.tagFit) nodes[`${P}-tag-text`] = {opacity: r(tk, 3)};
    }
    // the region frame(s) and the enlarged copy
    const dm = st.datum || null;
    const keys = Object.keys(regions);
    for (const key of keys) {
      const w = key === 'main' ? 1 : key === 'before' ? 1 - clamp(dm ? dm.cue : 0) : clamp(dm ? dm.cue : 0);
      if (keepDoc || !o.keep) nodes[`${P}-frame-${key}`] = {opacity: r(clamp(st.frame) * w, 3)};
      if (o.noDetail || !keepZone) continue;
      const rr = G.PL.regionRect(regions[key].from, regions[key].to);
      const zf = zoneFit(G, rr);
      const q = ease.inOutCubic(clamp(st.zoom));
      const x0 = G.page.x + rr.x, y0 = G.page.y + rr.y;
      const sc = lerp(1, zf.z, q);
      nodes[`${P}-zcopy-${key}`] = {opacity: r(q > 0 ? w : 0, 3), transform: `${T(lerp(x0, zf.x, q), lerp(y0, zf.y, q))} scale(${r(sc, 4)})`};
    }
    if (!o.noDetail && keepTethers) {
      // tethers: from the region's corners (on the page) to the enlarged copy's corners
      const key = keys.length === 1 ? keys[0] : (dm && dm.cue >= 0.5 ? 'after' : 'before');
      const rr = G.PL.regionRect(regions[key].from, regions[key].to);
      const zf = zoneFit(G, rr);
      const q = ease.inOutCubic(clamp(st.zoom));
      const a0 = {x: G.page.x + rr.x + rr.w, y: G.page.y + rr.y}, a1 = {x: a0.x, y: a0.y + rr.h};
      const sc = lerp(1, zf.z, q);
      const bx = lerp(G.page.x + rr.x, zf.x, q), by = lerp(G.page.y + rr.y, zf.y, q);
      const toLeft = G.left === 'detail';
      const b0 = {x: toLeft ? bx + rr.w * sc : bx, y: by}, b1 = {x: b0.x, y: by + rr.h * sc};
      const a0x = toLeft ? G.page.x + rr.x : a0.x;
      nodes[`${P}-tethers`] = {opacity: r(q > 0.02 ? 1 : 0, 3), d: `M${r(a0x)} ${r(a0.y)}L${r(b0.x)} ${r(b0.y)}M${r(a0x)} ${r(a1.y)}L${r(b1.x)} ${r(b1.y)}`};
    }
    if (o.zoneMark) nodes[`${P}-zmark`] = {opacity: r(clamp(st.zmark ?? 0) * (1 - clamp(st.zoom)), 3)};
    if ((!o.noDetail || datum) && keepCap) {
      nodes[`${P}-cap`] = {opacity: r(clamp(st.cap), 3)};
      if (!datum && o.capFit) nodes[`${P}-cap-text`] = {opacity: r(tk, 3)};
      if (datum && datum.capFits) nodes[`${P}-cap-v-before`] = {opacity: r(clamp(st.cap), 3), transform: 'translate(0 0)'};
    }
    if (datum && datum.capFits && dm && keepCap) {
      const was = clamp(dm.move);
      const D = G.dock;
      const dx = D ? D.x + 10 + datum.wasFit.width + 8 - (G.capBox.x + 30 + (o.Ft ? o.Ft * 0.32 : 7)) : 0;
      const dy = D ? D.y + 6 - (G.capBox.y + 7) : 0;
      nodes[`${P}-cap-v-before`] = {opacity: r(clamp(st.cap) * clamp(dm.copy ?? 1), 3), transform: `translate(${r(dx * ease.inOutCubic(was))} ${r(dy * ease.inOutCubic(was))})`};
      nodes[`${P}-cap-v-after`] = {opacity: r(clamp(dm.newIn) * clamp(dm.copy ?? 1), 3), transform: 'translate(0 0)'};
      if (D && keepDock) { nodes[`${P}-dock`] = {opacity: r(clamp(dm.dockK ?? was) * clamp(dm.copy ?? 1), 3)}; nodes[`${P}-was`] = {opacity: r(clamp(dm.was ?? was) * clamp(dm.copy ?? 1), 3)}; }
    }
    // people: seated listeners at rest; the presenter points to the board when supplied
    let reached = true;
    const hands = [];
    rigs.forEach((rg, i) => {
      if (!rg) return;
      const s = G.seats[i];
      const pose = {x: s.x, y: s.y, deg: s.deg, seated: s.standing ? 0 : 1};
      Object.assign(nodes, rg.pose(pose));
      const rc = i === R.presenter ? st.reach : null;
      const rr = reachRecords({name: `${P}-p${i}`}, pose, rc ? rc.target : pose, {k: rc ? rc.k : 0});
      if (rc) Object.assign(nodes, rr.nodes);
      if (rc && !rr.reached && rc.k > 0) reached = false;
      hands[i] = rr.hand;
    });
    return {nodes, reached, hands};
  }
  return {node: g({name: `${P}-room`}, parts), frame, rigs, clock};
}

/** scale + turn about a point (svg transform string). */
function aboutC(c, s, deg) {
  return `translate(${r(c.x)} ${r(c.y)}) rotate(${r(deg, 2)}) scale(${r(s, 4)}) translate(${r(-c.x)} ${r(-c.y)})`;
}

/* ------------------------------------------------------------------ */
/* Stage: the document's travel, the frame, the enlarged zone          */
/* ------------------------------------------------------------------ */

/**
 * Timing (u) of the action inside [t0, t1]: the presenter points (cause), the document travels to its place and its
 * tag arrives, the region frame, the enlarged zone (and its caption).
 * @param {number} t0
 * @param {number} t1
 */
export function edTiming(t0, t1) {
  const L = t1 - t0;
  const at = f => t0 + L * f;
  return {point: [at(0), at(0.1)], travel: [at(0.1), at(0.42)], tag: [at(0.42), at(0.5)], frame: [at(0.52), at(0.62)], zoom: [at(0.64), at(0.88)], cap: [at(0.88), at(0.98)], lower: [at(0.4), at(0.5)], t0, t1};
}

/** Length-parametrised point on a polyline. */
function along(pts, q) {
  const L = pts.slice(1).reduce((acc, p, k) => acc + Math.hypot(p.x - pts[k].x, p.y - pts[k].y), 0);
  let d = clamp(q) * L;
  for (let k = 1; k < pts.length; k++) {
    const seg = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    if (d <= seg || k === pts.length - 1) { const t = seg ? clamp(d / seg) : 1; return {x: lerp(pts[k - 1].x, pts[k].x, t), y: lerp(pts[k - 1].y, pts[k].y, t)}; }
    d -= seg;
  }
  return pts[pts.length - 1];
}

/** The document's route from a supplied start (`from`, mechanism): see edStageAt. */
export function edFromWay(G, from) {
  // (down until the reduced document's top edge has passed below the exhibit's number, then along, then down)
  const yW = Math.max(-44, from.y + DOC.h * DOC_S0 / 2 + (G.Ft ? G.Ft * 0.78 : 0) + 8);
  return [from, {x: from.x, y: yW}, {x: G.pageC.x, y: yW}, G.pageC];
}

/**
 * The stage at u.
 * @param {any} G edGeometry()
 * @param {any} R resolveEd()
 * @param {any} TM edTiming()
 * @param {number} u
 * @param {{noDetail?:boolean, noHands?:boolean, from?:{x:number,y:number}}} [o]
 */
export function edStageAt(G, R, TM, u, o = {}) {
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  const e = ease.inOutCubic;
  const qT = e(pos(u, ...TM.travel));
  // (`from`, mechanism: the document starts from its exhibit lifted out of the room, straight down onto its place)
  // (down first — clear of the exhibit's number beside it — to just above the top wall, along it to above the page's
  // place, then down onto it: never over a person)
  const route = o.from ? edFromWay(G, o.from) : G.route;
  const p = along(route, qT);
  const doc = {x: p.x, y: p.y, s: lerp(DOC_S0, 1, e(pos(qT, 0.55, 1))), deg: lerp(G.rest.deg, 0, e(pos(qT, 0, 0.35)))};
  const docState = u < TM.travel[0] ? 'cabinet' : qT < 1 ? 'travelling' : 'placed';
  const tag = e(pos(u, ...TM.tag));
  const frame = o.noDetail ? 0 : e(pos(u, ...TM.frame));
  const zoom = o.noDetail ? 0 : pos(u, ...TM.zoom);
  const cap = o.noDetail ? 0 : e(pos(u, ...TM.cap));
  // the presenter points to the board (the cause), and lowers the hand once the document has arrived
  const k = o.noHands ? 0 : e(pos(u, ...TM.point)) * (1 - e(pos(u, TM.travel[1], TM.travel[1] + 0.05)));
  const reach = k > 0 ? {target: G.aim, k} : null;
  const zoneState = o.noDetail ? 'none' : zoom <= 0 ? (frame > 0 ? 'framed' : 'none') : zoom < 1 ? 'enlarging' : 'enlarged';
  return {doc, docState, tag, frame, zoom, cap, reach, k, zoneState, travel: qT};
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its chips (design units)   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolveEd()
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {number} F label text size (design units)
 * @param {{scale?:number, chips?:boolean, text?:boolean, qGap?:number, align?:any, reserve?:(G:any)=>any[], dock?:{wasText:string, capTexts:{before:string, after:string}}|null, dockBeside?:boolean, lifted?:boolean, extraH?:number}} [o]
 */
export function composeEd(ctx, P, R, box, F, o = {}) {
  const t = WALL;
  const sc = o.scale ?? 1;
  const ar = box.w / box.h;
  const withText = o.text !== false;
  const geoAt = (W, H, k) => {
    const Ft = F / k;
    // (the tag and the caption wrap to their place's own width: the board grows only for a very long word)
    const fitAt = (text, maxW) => {
      let f = null;
      for (const q of [1, 1.35, 1.7, 2.2, 2.8, 3.4]) { f = fitG(text, {maxWidth: Math.max(maxW * q, Ft * 4), size: Ft, minSize: Ft, maxLines: 5, weight: 600}); if (!f.truncated) break; }
      return f;
    };
    const tagW = DOC.w + 10 - 44 - Ft * 0.32, capW = ZONE.w - 44 - Ft * 0.32;
    const tagFit = withText ? fitAt(R.items[R.docI].text, tagW) : null;
    let capFit = withText ? fitAt(R.items[R.detI].text, capW) : null;
    let dockH = 0, dockW = 0, capFits = null, wasFit = null;
    if (withText && o.dock) {
      capFits = {before: fitAt(o.dock.capTexts.before, capW), after: fitAt(o.dock.capTexts.after, capW)};
      capFit = {...capFits.before, width: Math.max(capFits.before.width, capFits.after.width), height: Math.max(capFits.before.height, capFits.after.height)};
      wasFit = fitG(o.dock.wasText, {maxWidth: 200, size: Ft, minSize: Ft, maxLines: 1, weight: 500});
      dockH = capFits.before.height + 12;
      dockW = wasFit.width + 8 + capFits.before.width + 20;
    }
    const G = edGeometry(W, H, R, {tagFit, capFit, dockH, dockW, dockBeside: o.dockBeside, Ft: withText ? Ft : null, qGap: o.qGap});
    G.Ft = withText ? Ft : null;
    G.tagFit = tagFit; G.capFit = capFit; G.capFits = capFits; G.wasFit = wasFit;
    return G;
  };
  // the room's size: its needs at the current scale, widened or deepened to the box's aspect
  let k = box.w / 1200, G = null, W = 0, H = 0;
  for (let it = 0; it < 4; it++) {
    const G0 = geoAt(2000, 2000, k);
    W = Math.max(G0.needW * sc, 640 * sc);
    H = Math.max(G0.needH * sc + (o.extraH || 0), 520 * sc);
    if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
    const k2 = Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t));
    if (Math.abs(k2 - k) < 1e-4) { k = k2; break; }
    k = k2;
  }
  G = geoAt(W, H, k);
  // (the needs depend on the scale through the text sizes: grow the room, keeping the box's aspect, until it fits)
  for (let it = 0; it < 10 && (G.problems.includes('room-width') || G.problems.includes('room-height')); it++) {
    W = Math.max(W, G.needW + 1);
    H = Math.max(H, G.needH + 1);
    if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
    k = Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t));
    G = geoAt(W, H, k);
  }
  const E = G.extents;
  const al = o.align || {x: 0.5, y: 0.5};
  const ox = box.x + (box.w - E.w * k) * al.x - E.x * k;
  const oy = box.y + (box.h - E.h * k) * al.y - E.y * k;
  const toD = mapper(ox, oy, k);
  const bD = mapBox(ox, oy, k);
  const problems = [...G.problems];
  for (const f of [G.tagFit, G.capFit]) if (f && f.truncated) problems.push('plate-text');
  const rad = PERSON.half * k;
  const people = R.speakers.map(sp => ({...toD(G.seats[sp.index]), rad: rad + 4}));
  const bounds = {x: ox + 10 * k, y: oy + 10 * k, w: (W - 20) * k, h: (H - 20) * k};
  const equip = [...edObstacles(G, {lifted: o.lifted}), ...(o.reserve ? o.reserve(G) : [])].map(bD);
  const ellipse = R.listeners.length ? {c: toD(G.C), a: G.A * k, b: G.B * k} : null;
  const chips = [];
  const chipMaxW = o.chipMaxW ?? 340;
  if (o.chips) {
    const widths = [chipMaxW, chipMaxW * 0.8, chipMaxW * 0.64, chipMaxW * 0.52, chipMaxW * 0.44];
    const vs = R.speakers.map(sp => widths.map(mw => measureSpeakerChip(sp, 0, F, mw, {seqDisc: false, maxLines: 4})).filter(m => !m.truncated));
    if (vs.some(v => !v.length)) problems.push('chip-truncated');
    const owners = R.speakers.map(sp => toD(G.seats[sp.index]));
    const items = R.speakers.map(sp => {
      const i = sp.index;
      const pref = i === R.presenter ? 0 : G.seats[i].angle;
      return {key: `sp${i}`, i, variants: (vs[i].length ? vs[i] : [measureSpeakerChip(sp, 0, F, chipMaxW, {seqDisc: false, maxLines: 6})]).map(m => ({w: m.w, h: m.h, m})), at: toD(G.seats[i]), rad, rim: rad * 0.84, prefer: pref, owners, maxGap: 56};
    });
    const res = placeLabels(items, {bounds, circles: people, boxes: equip, ellipse: ellipse || {c: {x: -1e5, y: -1e5}, a: 1, b: 1}, placed: []});
    items.forEach((it, j) => { chips[it.i] = res.labels[j]; });
    for (const f of res.fails) problems.push(`chip-${f}`);
  }
  return {F, k, W, H, G, E, ox, oy, toD, bD, chips, exChips: [], problems, rad, box, people, equip, ellipse, bounds,
    planRect: {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k}};
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/** Legend rows: ● / ◆ (equal weight) and the region frame. */
export function edRows(R, P, prefix = 'lg', o = {}) {
  const rows = [];
  rows.push({kind: 'legend', glyphKind: 'started', text: P.states.document, name: `${prefix}-document`});
  if (!o.noDetail) {
    rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.detail, name: `${prefix}-detail`});
    rows.push({kind: 'legend', glyphKind: 'frame', text: P.labels.frame, name: `${prefix}-frame`});
  }
  return rows;
}

/** Panel row node: this motif's glyphs (region frame, board, page), else the shared rows. */
export function edRowNode(ctx, m, o = {}) {
  if (m.kind === 'legend' && ['frame', 'board', 'page'].includes(m.glyphKind)) {
    const th = ctx.theme;
    const c = hearingColors(ctx);
    const s = m.glyph;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    if (m.glyphKind === 'frame') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.3), y: r(-s * 0.38), width: r(s * 0.6), height: r(s * 0.76), rx: 2, fill: c.paper, stroke: INK, 'stroke-width': 1.6}),
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.1), width: r(s * 0.72), height: r(s * 0.24), rx: 2, fill: 'none', stroke: th.accent3, 'stroke-width': 3}));
    } else if (m.glyphKind === 'board') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.44), y: r(-s * 0.26), width: r(s * 0.88), height: r(s * 0.52), rx: 4, fill: '#e9edf1', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.18), width: r(s * 0.26), height: r(s * 0.36), rx: 1.5, fill: c.paper, stroke: INK, 'stroke-width': 1.2}),
        h('rect', {x: r(-s * 0.04), y: r(-s * 0.18), width: r(s * 0.4), height: r(s * 0.24), rx: 1.5, fill: '#ffffff', stroke: '#9aa4ae', 'stroke-width': 1.2}));
    } else {
      glyph = g({transform: T(gx, gy)}, legendGlyph(ctx, 'statement', s, o.look));
    }
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return rowNode(ctx, m, o);
}
