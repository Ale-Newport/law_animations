/**
 * "Revisión de documentos" kit (LAW-0337..0340, review-05): a generic, fictional filing room drawn as a floor plan, in
 * which the ORIGINAL FILE and the NEW PIECES are kept apart — a neutral filing arrangement only.
 *
 * Legal care (the brief: "keep it a neutral filing/organising process — no rule on admissibility of new material"):
 *  - the original file (folder A, with the decision sheet — a placeholder "resolución" whose content is never shown —
 *    on top) and the separate folder for the proposed additional pieces (folder B) are drawn at the SAME size, with the
 *    same stroke and equal weight; they differ only by their lane colour (A blue accent2, B amber accent3 — never red or
 *    green) and their place on either side of a neutral divider;
 *  - the divider ("filtro / separador") is a plain standing panel between the folders: it decides nothing (no gate, no
 *    admission, no criterion); nothing passes through it;
 *  - the new pieces are fictional placeholder sheets (filler bars only); the reason noted by whoever proposes them
 *    (`grounds`) is shown as supplied and never assessed;
 *  - no time limit, outcome, admissibility rule, validity or jurisdiction is drawn or implied. The wall calendar is a
 *    fixture only (no date marked).
 *
 * The concrete action — "el expediente original y nuevas piezas se mantienen separados": a generic participant closes
 * the original file in its folder, then takes each new piece from the intake tray and files it in the separate folder
 * on the other side of the divider (row arrangement: one counter; stack arrangement: the intake tray on a lower counter
 * — the participant turns round with the piece).
 *
 * The kit owns fields, defaults, the room geometry (template units: a plan person is 100 units across the shoulders),
 * the room art and per-frame records, the action planner (person poses, hands, carried sheet, folder covers) and the
 * panel glyphs. Each entry owns its timeline, composition and semantics. Generic art comes from
 * ../../courts/kits/courts-art.js and ../../hearings/kits/hearings-art.js, text/panel helpers from
 * ../../hearings/kits/apertura-audiencia.js and ./solicitud-autorizacion.js — all imported READ-ONLY.
 * @module animations/review/kits/revision-de-documentos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {changedMarker} from '../../../primitives/markers.js';
import {floorArea, wallRing, planPerson, PERSON} from '../../courts/kits/courts-art.js';
import {reachRecords, toWorld} from '../../hearings/kits/hearings-art.js';
import {FONT, WALL, textAt, rowNode, legendGlyph, localised, mapper, mapBox} from '../../hearings/kits/apertura-audiencia.js';
import {statusDisc, LINE, linkColor} from './solicitud-autorizacion.js';

export {PERSON, WALL};
export const INK = '#1f2328';
/** A sheet at docK = 1 (template units). */
export const DOC = {w: 64, h: 84};
/** The participant holds a sheet HOLD_GAP below its lower edge (its hands on that edge). */
const HOLD_GAP = 58;
const LIFT = 1.06;
const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];
export const KINDS = ['a', 'b'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/* ------------------------------------------------------------------ */
/* Fields, defaults                                                    */
/* ------------------------------------------------------------------ */

/** Fields shared by the four entries (brief: decisions, grounds, routes, outcomes — outcomes are per entry). */
export const rdFields = {
  decisions: obj('The decision sheet ("resolución") lying on top of the original file — a fictional placeholder; its content is never shown', {
    title: str('Name of the decision sheet (fictional, as supplied)', 100),
  }, ['title']),
  grounds: str('Reason noted by whoever proposes the additional pieces (as supplied; shown, never assessed)', 130),
  routes: obj('Where each kind of material is kept (as configured): a filing arrangement only — nothing is decided about the material', {
    original: str('Caption of folder A: the original file', 100),
    additional: str('Caption of folder B: the separate folder for the proposed additional pieces', 100),
    divider: str('Caption of the neutral divider standing between the two folders (it decides nothing)', 110),
  }, ['original', 'additional', 'divider']),
  pieces: list('Proposed additional pieces (fictional placeholder sheets), in the order they are handled', str('Label of a piece (fictional)', 48), 1, 4),
  labels: obj('Editable captions', {
    heading: str('Heading of the panel (keep "as supplied")', 90),
    pieces: str('Caption introducing the list of new pieces', 70),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['heading', 'pieces', 'key']),
};

export const courierField = obj('The generic participant who files the pieces (fictional; no role, rank or duty implied)', {
  label: str('Label of the participant (as supplied)', 60),
  appearance,
}, ['label']);

export const RD_EN = {
  decisions: {title: 'Decision under review (fictional; content not shown)'},
  grounds: 'Reason noted by the proposer: “later documents” (as supplied)',
  routes: {original: 'A · Original file (material original)', additional: 'B · Separate folder: proposed additional material', divider: 'Divider between the folders (neutral; it decides nothing)'},
  pieces: ['N1 (fictional)', 'N2 (fictional)', 'N3 (fictional)'],
  labels: {heading: 'Document review (as supplied)', pieces: 'New pieces', key: 'As supplied · no conclusion drawn'},
};

export const RD_ES = {
  decisions: {title: 'Resolución revisada (ficticia; contenido no mostrado)'},
  grounds: 'Motivo anotado por quien la propone: «documentos posteriores» (según lo aportado)',
  routes: {original: 'A · Expediente original (material original)', additional: 'B · Carpeta aparte: material adicional propuesto', divider: 'Separador entre las carpetas (neutro; no decide nada)'},
  pieces: ['N1 (ficticia)', 'N2 (ficticia)', 'N3 (ficticia)'],
  labels: {heading: 'Revisión de documentos (según lo aportado)', pieces: 'Piezas nuevas', key: 'Según lo aportado · sin conclusión'},
};

export const COURIER_EN = {label: 'Participant filing the pieces (fictional)'};
export const COURIER_ES = {label: 'Participante que archiva las piezas (ficticio)'};

/** Localise (untouched defaults follow locale = es). */
export function localisedRd(ctx, EN, ES) {
  return {...localised(ctx, EN, ES)};
}

/** Resolve the supplied content: pieces (1–4) and the courier's look. */
export function resolveRd(ctx, P) {
  const pieces = (P.pieces || []).slice(0, 4).map((label, i) => ({index: i, label}));
  let courier = null;
  if (P.courier) {
    const ap = {...(P.courier.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length) % SAFE_OUTFITS.length];
    courier = {label: P.courier.label, look: actorLook(ctx, {appearance: ap}, 0)};
  }
  return {n: Math.max(1, pieces.length), pieces, courier};
}

/** Lane colours (A original, B additional) and folder tints — equal weight, never red / green. */
export function laneColors(ctx) {
  const th = ctx.theme;
  return {a: th.accent2, b: th.accent3, aSoft: th.accent2Soft, bSoft: th.accent3Soft};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {any} R resolveRd()
 * @param {{arr?:'row'|'stack', docK?:number, n?:number, person?:boolean, intake?:boolean, sign?:boolean, calendar?:boolean,
 *   board?:{w:number,h:number}|null, W?:number, H?:number, aside?:boolean}} o
 *   arr 'row': one counter (folder A · divider · folder B · intake tray); 'stack': the intake tray on a lower counter, the
 *   participant's lane between the two counters. W/H: the interior to lay the room out in (≥ its need; the content is
 *   centred, the sign and calendar stay on the left wall).
 */
export function rdGeometry(R, o = {}) {
  const t = WALL;
  const arr = o.arr || 'row';
  const docK = o.docK || 1.4;
  const n = o.n ?? R.n;
  const DW = DOC.w * docK, DH = DOC.h * docK;
  const FW = DW + 30, FH = DH + 26;
  const TW = DW + 34, TH = DH + 30;
  const pad = 22, gap = 34, dvW = 18;
  const HOLD = DH / 2 + HOLD_GAP;
  const intake = o.intake !== false;
  const person = !!o.person;
  const wallCol = o.sign || o.calendar !== false;
  const mL = wallCol ? 122 : 40, mR = 40;
  const yTop = 30;
  const CH = FH + 2 * pad;
  const rowIntake = intake && arr === 'row';
  const counterW = pad + 2 * FW + gap + dvW + gap + 2 * FW + (rowIntake ? gap + TW : 0) + pad;
  // natural layout (dx/dy shift added below)
  const L = {};
  L.counter = {x: mL, y: yTop, w: counterW, h: CH};
  L.folderO = {x: mL + pad + FW, y: yTop + pad, w: FW, h: FH};
  L.divider = {x: L.folderO.x + FW + gap, y: yTop + 12, w: dvW, h: CH - 24};
  L.folderN = {x: L.divider.x + dvW + gap + FW, y: yTop + pad, w: FW, h: FH};
  const yS = yTop + CH / 2;
  const personY = yS + HOLD;
  let needH;
  let trayRot = 0;
  if (rowIntake) {
    L.tray = {x: L.folderN.x + FW + gap, y: yS - TH / 2, w: TW, h: TH};
    needH = person ? personY + PERSON.half + 30 : yTop + CH + 30;
  } else if (intake) {
    // stack: the intake tray lies on a lower counter; the participant faces it (turned round) to take a piece
    trayRot = 180;
    const yI = personY + HOLD;
    const tcx = L.folderN.x - FW * 0.2;
    L.tray = {x: tcx - TW / 2, y: yI - TH / 2, w: TW, h: TH};
    L.counter2 = {x: L.tray.x - pad - 46, y: L.tray.y - pad, w: TW + 2 * pad + 92, h: TH + 2 * pad};
    needH = L.counter2.y + L.counter2.h + 30;
  } else {
    needH = person ? personY + PERSON.half + 30 : yTop + CH + 30;
  }
  // the register board (inspect) below the counter, in the free lane
  const bd = o.board || null;
  if (bd) {
    L.board = {x: L.counter.x + (counterW - bd.w) / 2, y: yTop + CH + 34, w: bd.w, h: bd.h};
    needH = Math.max(needH, L.board.y + bd.h + 30);
  }
  // left wall: the status sign at the top and the wall calendar under it
  const signW = 92, signH = 124;
  const sign = o.sign ? {x: 18, y: 22, w: signW, h: signH} : null;
  const cal = o.calendar !== false ? {cx: 18 + signW / 2, cy: (sign ? sign.y + signH + 26 : 22) + 34, R: 30} : null;
  if (cal) needH = Math.max(needH, cal.cy + cal.R * 1.1 + 26);
  const contentR = Math.max(L.counter.x + counterW, L.counter2 ? L.counter2.x + L.counter2.w : 0, L.board ? L.board.x + L.board.w : 0);
  const needW = Math.ceil((contentR + mR) / 2) * 2;
  needH = Math.ceil(needH / 2) * 2;
  const W = Math.max(o.W || 0, needW), H = Math.max(o.H || 0, needH);
  const dx = (W - needW) / 2 + (wallCol ? (W - needW) / 2 * 0.25 : 0);
  const dy = (H - needH) / 2;
  const sh = b => (b ? {...b, x: b.x + dx, y: b.y + dy} : null);
  const counter = sh(L.counter), folderO = sh(L.folderO), folderN = sh(L.folderN), divider = sh(L.divider), tray = sh(L.tray), counter2 = sh(L.counter2), board = sh(L.board);
  const ySS = yS + dy, pY = personY + dy;
  const cx = b => b.x + b.w / 2, cy = b => b.y + b.h / 2;
  // sheet places (centres): the decision sheet and the original stack in folder A; slots in folder B (in filing order,
  // each a little up and to the right of the previous one); the intake stack (piece 0 on top: it is taken first)
  const slotN = j => ({x: cx(folderN) - 9 + 6 * j, y: cy(folderN) + 6 - 4 * j, rot: 0});
  const slotO = () => ({x: cx(folderO) - 7, y: cy(folderO) - 7, rot: 0});
  const trayAt = i => {
    const q = n - 1 - i;
    const sgn = trayRot ? -1 : 1;
    return tray ? {x: cx(tray) + sgn * (-6 + 4 * q), y: cy(tray) + sgn * (5 - 3.5 * q), rot: trayRot} : null;
  };
  const rest = {x: cx(divider), y: pY, deg: 0};
  // the participant's pose for a sheet place: it stands HOLD from the sheet's centre, facing it
  const poseFor = q => ({x: q.x - Math.sin((q.rot * Math.PI) / 180) * HOLD, y: q.y + Math.cos((q.rot * Math.PI) / 180) * HOLD, deg: q.rot});
  // a folder's front cover: hinged on the folder's left edge; sx −1 = open (lying to the left), 1 = closed
  const coverEdge = (F, sx) => ({x: F.x + F.w * sx, y: F.y + F.h - 8});
  // (the participant walks along with the cover's edge, holding it with the LEFT hand, standing to the right of it — so
  // it stays clear of the wall calendar and sign on the left wall)
  const coverPose = (F, sx) => ({x: coverEdge(F, sx).x + 30, y: pY, deg: 0});
  const problems = [];
  if ((o.W || 0) > 0 && o.W + 0.5 < needW) problems.push('room-width');
  if ((o.H || 0) > 0 && o.H + 0.5 < needH) problems.push('room-height');
  return {
    W, H, t, arr, docK, n, DW, DH, FW, FH, TW, TH, HOLD, CH, pad, gap, dvW, yS: ySS, personY: pY, person, intake, trayRot,
    counter, counter2, folderO, folderN, divider, tray, board, sign: sign, cal: cal ? {...cal} : null,
    needW, needH, problems, slotN, slotO, trayAt, rest, poseFor, coverEdge, coverPose,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t},
  };
}

/** Obstacle boxes of the room (template units): counters, folders (with their open covers), divider, tray, calendar, sign. */
export function rdTargets(G) {
  const fold = F => ({x: F.x - F.w, y: F.y - 14, w: F.w * 2, h: F.h + 14});
  const out = {original: fold(G.folderO), additional: fold(G.folderN), divider: {...G.divider}};
  if (G.cal) out.calendar = {x: G.cal.cx - G.cal.R, y: G.cal.cy - G.cal.R * 1.1 - 6, w: 2 * G.cal.R, h: 2.2 * G.cal.R + 6};
  if (G.tray) out.intake = {...G.tray};
  if (G.sign) out.sign = {...G.sign};
  return out;
}

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

/**
 * A placeholder sheet from above, centred on the origin: white paper, folded corner, filler lines and — for a piece —
 * a coloured strip along its left edge (stripe: a colour, or null for a plain sheet). Nothing is written on it.
 */
export function sheetArt(ctx, w, hh, o = {}) {
  const lines = [];
  for (let i = 0; i < 4; i++) lines.push(`M${r(-w / 2 + 14)} ${r(-hh / 2 + hh * 0.3 + i * hh * 0.15)}H${r(w / 2 - 10 - (i === 3 ? w * 0.3 : 0))}`);
  const fold = Math.min(w, hh) * 0.2;
  return [
    o.noShadow ? null : h('rect', {x: r(-w / 2 + 4), y: r(-hh / 2 + 5), width: r(w), height: r(hh), rx: 3, fill: ctx.theme.shadow}),
    h('path', {d: `M${r(-w / 2)} ${r(-hh / 2)}H${r(w / 2 - fold)}L${r(w / 2)} ${r(-hh / 2 + fold)}V${r(hh / 2)}H${r(-w / 2)}Z`, fill: '#ffffff', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w / 2 - fold)} ${r(-hh / 2)}V${r(-hh / 2 + fold)}H${r(w / 2)}`, fill: '#e3e7eb', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('path', {d: lines.join(''), stroke: '#c9c2b4', 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
  ];
}

/** The coloured strip of a piece (a separate layer so a scene can switch it on). */
export function stripeArt(w, hh, color, name, opacity) {
  return h('rect', {name, x: r(-w / 2 + 3), y: r(-hh / 2 + 3), width: r(Math.max(6, w * 0.11)), height: r(hh - 6), rx: 2, fill: color, opacity});
}

/**
 * The decision sheet ("resolución", a placeholder) from above, centred: a grey header band, a plain round seal outline
 * and filler lines — its content is never shown.
 */
export function decisionArt(ctx, w, hh, o = {}) {
  const lines = [];
  for (let i = 0; i < 3; i++) lines.push(`M${r(-w / 2 + 10)} ${r(-hh / 2 + hh * 0.36 + i * hh * 0.14)}H${r(w / 2 - 10 - (i === 2 ? w * 0.34 : 0))}`);
  return [
    o.noShadow ? null : h('rect', {x: r(-w / 2 + 4), y: r(-hh / 2 + 5), width: r(w), height: r(hh), rx: 3, fill: ctx.theme.shadow}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh * 0.18), rx: 3, fill: '#9aa4ae', stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: lines.join(''), stroke: '#c9c2b4', 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(w * 0.22), cy: r(hh * 0.3), r: r(Math.min(w, hh) * 0.13), fill: 'none', stroke: '#7c8792', 'stroke-width': 2.2}),
    h('circle', {cx: r(w * 0.22), cy: r(hh * 0.3), r: r(Math.min(w, hh) * 0.07), fill: 'none', stroke: '#7c8792', 'stroke-width': 1.6}),
  ];
}

/** Folder back cover from above (template units, absolute): tinted board with a lane-coloured tab on its top edge. */
function folderBack(F, tint, color) {
  const tabW = F.w * 0.34, tabX = F.x + F.w * 0.56;
  return [
    h('path', {d: roundRectPath(F.x + 5, F.y + 7, F.w, F.h, 7), fill: 'rgba(31,35,40,0.12)'}),
    h('path', {d: `M${r(tabX)} ${r(F.y + 2)}V${r(F.y - 9)}Q${r(tabX)} ${r(F.y - 13)} ${r(tabX + 4)} ${r(F.y - 13)}H${r(tabX + tabW - 4)}Q${r(tabX + tabW)} ${r(F.y - 13)} ${r(tabX + tabW)} ${r(F.y - 9)}V${r(F.y + 2)}Z`, fill: color, stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(F.x, F.y, F.w, F.h, 7), fill: tint, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(F.x + 8, F.y + 8, F.w - 16, F.h - 16, 4), fill: 'none', stroke: color, 'stroke-width': 2, opacity: 0.55}),
  ];
}

/** A folder's front cover (hinged on its left edge): outer face (closed) and inner face (open) as two layers. */
function folderCover(F, tint, color, name) {
  const outer = g({name: `${name}-out`},
    h('path', {d: roundRectPath(F.x, F.y, F.w, F.h, 7), fill: tint, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(F.x)} ${r(F.y + 10)}V${r(F.y + F.h - 10)}`, stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round'}),
    h('rect', {x: r(F.x + F.w * 0.24), y: r(F.y + F.h * 0.38), width: r(F.w * 0.56), height: r(F.h * 0.22), rx: 4, fill: '#ffffff', stroke: INK, 'stroke-width': 1.6}),
    h('rect', {x: r(F.x + F.w * 0.24), y: r(F.y + F.h * 0.38), width: r(F.w * 0.1), height: r(F.h * 0.22), rx: 2, fill: color}));
  const inner = g({name: `${name}-in`},
    h('path', {d: roundRectPath(F.x, F.y, F.w, F.h, 7), fill: '#f6f2ea', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(F.x + 8, F.y + 8, F.w - 16, F.h - 16, 4), fill: 'none', stroke: color, 'stroke-width': 2, opacity: 0.55}));
  return g({name, transform: 'translate(0 0)'}, inner, outer);
}

/** The neutral divider from above: a standing grey panel on two feet, with plain slots (it decides nothing). */
function dividerArt(D) {
  const slots = [];
  for (let i = 1; i <= 3; i++) slots.push(`M${r(D.x + 5)} ${r(D.y + (D.h * i) / 4)}H${r(D.x + D.w - 5)}`);
  return [
    h('rect', {x: r(D.x + 6), y: r(D.y + 6), width: r(D.w), height: r(D.h), rx: 4, fill: 'rgba(31,35,40,0.16)'}),
    h('rect', {x: r(D.x - 9), y: r(D.y - 4), width: r(D.w + 18), height: 12, rx: 4, fill: '#8f98a1', stroke: INK, 'stroke-width': 2}),
    h('rect', {x: r(D.x - 9), y: r(D.y + D.h - 8), width: r(D.w + 18), height: 12, rx: 4, fill: '#8f98a1', stroke: INK, 'stroke-width': 2}),
    h('rect', {x: r(D.x), y: r(D.y), width: r(D.w), height: r(D.h), rx: 4, fill: '#b9c1c9', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: slots.join(''), stroke: '#6f7a85', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
  ];
}

/** A wooden counter from above. */
function counterArt(ctx, C) {
  return [
    h('path', {d: roundRectPath(C.x + 6, C.y + 9, C.w, C.h, 10), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, 10), fill: '#caa075', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: `M${r(C.x + 14)} ${r(C.y + C.h * 0.3)}C${r(C.x + C.w * 0.3)} ${r(C.y + C.h * 0.24)} ${r(C.x + C.w * 0.6)} ${r(C.y + C.h * 0.38)} ${r(C.x + C.w - 14)} ${r(C.y + C.h * 0.3)}M${r(C.x + 14)} ${r(C.y + C.h * 0.72)}C${r(C.x + C.w * 0.4)} ${r(C.y + C.h * 0.66)} ${r(C.x + C.w * 0.7)} ${r(C.y + C.h * 0.8)} ${r(C.x + C.w - 14)} ${r(C.y + C.h * 0.7)}`, fill: 'none', stroke: '#b38a62', 'stroke-width': 2}),
  ];
}

/** The intake tray from above. */
function trayArt(Tr) {
  return [
    h('path', {d: roundRectPath(Tr.x + 4, Tr.y + 6, Tr.w, Tr.h, 8), fill: 'rgba(31,35,40,0.12)'}),
    h('path', {d: roundRectPath(Tr.x, Tr.y, Tr.w, Tr.h, 8), fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(Tr.x + 7, Tr.y + 7, Tr.w - 14, Tr.h - 14, 5), fill: 'none', stroke: '#aab3bc', 'stroke-width': 2}),
  ];
}

/** A blank wall calendar (a fixture only): header band and an empty grid; no date is marked. */
export function wallCalendar(ctx, {name, cx, cy, R}) {
  const w = R * 1.9, hh = R * 2.1;
  const x0 = cx - w / 2, y0 = cy - hh / 2;
  const grid = [];
  const gx0 = x0 + 6, gx1 = x0 + w - 6, gy0 = y0 + hh * 0.36, gy1 = y0 + hh - 6;
  for (let i = 0; i <= 4; i++) { const x = lerp(gx0, gx1, i / 4); grid.push(`M${r(x)} ${r(gy0)}V${r(gy1)}`); }
  for (let j = 0; j <= 3; j++) { const y = lerp(gy0, gy1, j / 3); grid.push(`M${r(gx0)} ${r(y)}H${r(gx1)}`); }
  return g({name},
    h('rect', {x: r(x0 + 3), y: r(y0 + 5), width: r(w), height: r(hh), rx: 4, fill: ctx.theme.shadow}),
    h('rect', {x: r(x0), y: r(y0), width: r(w), height: r(hh), rx: 4, fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: r(x0), y: r(y0), width: r(w), height: r(hh * 0.28), rx: 4, fill: '#9aa4ae', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(cx - w * 0.22)} ${r(y0 - 4)}V${r(y0 + 7)}M${r(cx + w * 0.22)} ${r(y0 - 4)}V${r(y0 + 7)}`, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('path', {d: grid.join(''), stroke: '#b9c1c9', 'stroke-width': 1.6}));
}

/**
 * The supplied state's icon (sign): two folders side by side with the divider between them — a: both closed; b: folder
 * B open (a sheet showing). The same art and ink weights for both.
 */
export function stateIcon(ctx, {x, y, w, kind}) {
  const c = laneColors(ctx);
  const fw = w * 0.36, fh = fw * 1.15;
  const fA = {x, y: y - fh / 2}, fB = {x: x + w - fw, y: y - fh / 2};
  const box = (q, col) => h('rect', {x: r(q.x), y: r(q.y), width: r(fw), height: r(fh), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8});
  return [
    box(fA, c.a), h('rect', {x: r(fA.x), y: r(fA.y), width: r(fw * 0.2), height: r(fh), rx: 2, fill: c.a}),
    box(fB, c.b), h('rect', {x: r(fB.x), y: r(fB.y), width: r(fw * 0.2), height: r(fh), rx: 2, fill: c.b}),
    kind === 'b' ? h('rect', {x: r(fB.x + fw * 0.32), y: r(fB.y + fh * 0.18), width: r(fw * 0.52), height: r(fh * 0.64), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.4}) : null,
    h('rect', {x: r(x + w / 2 - 2.5), y: r(y - fh * 0.62), width: 5, height: r(fh * 1.24), rx: 2, fill: '#8f98a1'}),
  ];
}

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} G rdGeometry()
 * @param {{prefix:string, R:any, origSheets?:number, slotsN?:number, slotO?:boolean, trayStripes?:boolean,
 *   heldKinds?:string[], person?:boolean, keep?:(b:any)=>boolean, slotKind?:string, board?:any}} o
 *   slotsN: how many slot sheets folder B can show; slotO: a slot sheet on top of folder A (a piece filed with the
 *   original material); trayStripes: the intake pieces carry switchable strips (contrast: plain until the change beat).
 */
export function rdRoom(ctx, G, o) {
  const P = o.prefix;
  const th = ctx.theme;
  const c = laneColors(ctx);
  const {W, H, t} = G;
  const parts = [];
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 64}));
  parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: []}));
  if (G.cal) parts.push(wallCalendar(ctx, {name: `${P}-cal`, cx: G.cal.cx, cy: G.cal.cy, R: G.cal.R}));
  const S = G.sign;
  if (S) {
    const sR = Math.min(S.w * 0.34, 30);
    const sx = S.x + S.w / 2, sy = S.y + 12 + sR;
    parts.push(g({name: `${P}-sign`},
      h('path', {d: roundRectPath(S.x + 3, S.y + 5, S.w, S.h, 9), fill: th.shadow}),
      h('path', {name: `${P}-sign-body`, d: roundRectPath(S.x, S.y, S.w, S.h, 9), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
      KINDS.map(k => g({name: `${P}-sign-${k}`, opacity: 0},
        statusDisc(ctx, {name: `${P}-sign-${k}-d`, kind: k, cx: sx, cy: sy, R: sR}),
        stateIcon(ctx, {x: S.x + 10, y: sy + sR + 14 + (S.w - 20) * 0.22, w: S.w - 20, kind: k})))));
  }
  parts.push(g({name: `${P}-counter`}, counterArt(ctx, G.counter)));
  if (G.counter2) parts.push(g({name: `${P}-counter2`}, counterArt(ctx, G.counter2)));
  if (G.tray) parts.push(g({name: `${P}-tray`}, trayArt(G.tray)));
  const {DW, DH} = G;
  const at = (q, extra = {}) => ({transform: T(q.x, q.y, q.rot || 0), ...extra});
  // folder A: back, the original stack (two sheets under the decision sheet), optional slot, front cover
  const fo = G.folderO, fn = G.folderN;
  const oc = {x: fo.x + fo.w / 2, y: fo.y + fo.h / 2};
  parts.push(g({name: `${P}-folderA`},
    folderBack(fo, c.aSoft, c.a),
    g({transform: T(oc.x + 6, oc.y + 5)}, sheetArt(ctx, DW, DH, {noShadow: true})),
    g({transform: T(oc.x + 2, oc.y + 1)}, sheetArt(ctx, DW, DH, {noShadow: true})),
    g({name: `${P}-decision`, transform: T(oc.x - 2, oc.y - 2)}, decisionArt(ctx, DW, DH))));
  const pieceNode = (name, q, kind, opacity) => g({name, ...at(q), opacity},
    sheetArt(ctx, DW, DH),
    stripeArt(DW, DH, kind === 'a' ? c.a : c.b, undefined, 1));
  if (o.slotO) parts.push(pieceNode(`${P}-slotO`, G.slotO(), 'a', 0));
  parts.push(folderCover(fo, c.aSoft, c.a, `${P}-coverA`));
  // folder B: back, slot sheets (filing order), front cover
  parts.push(g({name: `${P}-folderB`}, folderBack(fn, c.bSoft, c.b)));
  const nS = o.slotsN ?? G.n;
  for (let j = 0; j < nS; j++) parts.push(pieceNode(`${P}-slotN${j}`, G.slotN(j), o.slotKind || 'b', 0));
  parts.push(folderCover(fn, c.bSoft, c.b, `${P}-coverB`));
  parts.push(g({name: `${P}-divider`}, dividerArt(G.divider)));
  // intake pieces (piece 0 drawn last: on top, taken first)
  if (G.tray) {
    for (let i = G.n - 1; i >= 0; i--) {
      const q = G.trayAt(i);
      parts.push(g({name: `${P}-tray${i}`, ...at(q), opacity: 1},
        sheetArt(ctx, DW, DH),
        o.trayStripes ? KINDS.map(k => stripeArt(DW, DH, c[k], `${P}-tray${i}-s${k}`, 0)) : stripeArt(DW, DH, c.b, undefined, 1)));
    }
  }
  if (o.board) parts.push(o.board);
  const rig = o.person && G.person && o.R.courier ? planPerson(ctx, {name: `${P}-p0`, look: o.R.courier.look}) : null;
  if (rig) parts.push(rig.node);
  // the carried sheet (one node; it takes over from a tray / slot sheet at the same place, so nothing jumps)
  const heldKinds = o.heldKinds || ['b'];
  parts.push(g({name: `${P}-held`, transform: 'translate(0 0)', opacity: 0},
    g({name: `${P}-held-k`, transform: 'scale(1)'}, sheetArt(ctx, DW, DH),
      heldKinds.map(k => stripeArt(DW, DH, c[k], `${P}-held-s${k}`, k === heldKinds[0] ? 1 : 0)))));
  // markers drawn over the room (changed marker, pins) are added by the entries

  /**
   * @param {{coverA?:number, coverB?:number, tray?:number[], trayStripe?:Array<{a?:number,b?:number}>, slotN?:number[],
   *   slotO?:number, held?:{x:number,y:number,rot?:number,s?:number,op:number,kind?:string}|null, person?:any, reach?:any,
   *   sign?:{a?:number,b?:number}}} st
   */
  function frame(st) {
    const nodes = {};
    for (const [key, F, sx0] of [['A', fo, st.coverA ?? -1], ['B', fn, st.coverB ?? -1]]) {
      const sx = clamp(sx0, -1, 1);
      const s = Math.abs(sx) < 0.02 ? (sx < 0 ? -0.02 : 0.02) : sx;
      nodes[`${P}-cover${key}`] = {transform: `translate(${r(F.x, 2)} 0) scale(${r(s, 4)} 1) translate(${r(-F.x, 2)} 0)`};
      nodes[`${P}-cover${key}-out`] = {opacity: sx > 0 ? 1 : 0};
      nodes[`${P}-cover${key}-in`] = {opacity: sx > 0 ? 0 : 1};
    }
    if (G.tray) for (let i = 0; i < G.n; i++) {
      nodes[`${P}-tray${i}`] = {opacity: r(clamp(st.tray ? st.tray[i] ?? 1 : 1), 3)};
      if (o.trayStripes) for (const k of KINDS) nodes[`${P}-tray${i}-s${k}`] = {opacity: r(clamp(st.trayStripe && st.trayStripe[i] ? st.trayStripe[i][k] ?? 0 : 0), 3)};
    }
    for (let j = 0; j < nS; j++) nodes[`${P}-slotN${j}`] = {opacity: r(clamp(st.slotN ? st.slotN[j] ?? 0 : 0), 3)};
    if (o.slotO) nodes[`${P}-slotO`] = {opacity: r(clamp(st.slotO ?? 0), 3)};
    const hd = st.held;
    nodes[`${P}-held`] = hd ? {transform: T(hd.x, hd.y, hd.rot || 0), opacity: r(clamp(hd.op), 3)} : {transform: T(G.rest.x, G.rest.y), opacity: 0};
    nodes[`${P}-held-k`] = {transform: `scale(${r(hd ? hd.s ?? 1 : 1, 4)})`};
    for (const k of heldKinds) nodes[`${P}-held-s${k}`] = {opacity: (hd ? hd.kind ?? heldKinds[0] : heldKinds[0]) === k ? 1 : 0};
    if (S) for (const k of KINDS) nodes[`${P}-sign-${k}`] = {opacity: r(clamp(st.sign ? st.sign[k] ?? 0 : 0), 3)};
    let reached = true, hand = null, handL = null;
    if (rig) {
      const ps = st.person || G.rest;
      const pose = {x: ps.x, y: ps.y, deg: ps.deg ?? 0, seated: 0, walk: ps.walk ?? 0, phase: ps.phase ?? 0};
      Object.assign(nodes, rig.pose(pose));
      const rc = st.reach;
      for (const [arm, ti] of [['armR', 0], ['armL', 1]]) {
        const tg = rc && rc.targets[ti] ? rc.targets[ti] : null;
        const rr = reachRecords({name: `${P}-p0`}, pose, tg || pose, {k: tg ? rc.k : 0, arm});
        // (the rig's own pose already wrote the hanging arm; a reach overrides it — every frame writes the same keys)
        Object.assign(nodes, rr.nodes);
        if (tg && rc.k > 0 && !rr.reached) reached = false;
        if (arm === 'armR') hand = rr.hand; else handL = rr.hand;
      }
    }
    return {nodes, reached, hand, handL};
  }
  return {node: g({name: `${P}-room`}, parts), frame, rig};
}

/* ------------------------------------------------------------------ */
/* The action planner                                                  */
/* ------------------------------------------------------------------ */

const angDiff = (a, b) => Math.abs(b - a);

/**
 * Build a plan of the participant's steps inside a window [u0, u1]. Steps:
 *  {type:'walk', to:pose}            walk (a carried sheet follows the hands)
 *  {type:'reach', dur, mode:'sheet'|'cover', cover?:'A'|'B'}  hands go to the sheet's lower edge / the cover's edge
 *  {type:'lift', dur, piece, from:{kind:'tray'|'slotN'|'slotO', i}}  the sheet leaves its place, in the hands
 *  {type:'put', dur, to:{kind:'slotN'|'slotO', i}}   the sheet is laid in its place
 *  {type:'release', dur}             hands let go
 *  {type:'close', dur, cover:'A'|'B'}  the hand swings the cover over (the participant walks along with its edge)
 *  {type:'wait', dur}
 * Walk durations share the time left by the fixed steps in proportion to their length (turning counts as distance).
 * @param {any} G rdGeometry()
 * @param {{x:number,y:number,deg:number}} start
 * @param {any[]} specs
 * @param {[number, number]} win
 * @param {{kind?:string}} [o] kind of the sheets handled ('a' | 'b')
 */
export function makePlan(G, start, specs, win, o = {}) {
  const steps = [];
  let pose = {...start};
  let fixed = 0, dist = 0;
  for (const s0 of specs) {
    const s = {...s0};
    if (s.type === 'walk') {
      s.from = {...pose};
      // (turning counts as the arc swept by what turns with the participant: a held sheet (radius HOLD) never outruns
      // the walk; empty-handed, only the hands swing round (radius ~ PERSON.half))
      const held = steps.some(q => q.type === 'lift') && !steps.slice().reverse().find(q => q.type === 'lift' || q.type === 'put')?.to;
      s.d = Math.hypot(s.to.x - pose.x, s.to.y - pose.y) + (angDiff(pose.deg, s.to.deg) * Math.PI / 180) * (held ? G.HOLD : PERSON.half);
      dist += s.d;
      pose = {...s.to};
    } else if (s.type === 'close') {
      const F = s.cover === 'A' ? G.folderO : G.folderN;
      s.from = G.coverPose(F, -1);
      s.to = G.coverPose(F, 1);
      s.F = F;
      s.d = Math.abs(s.to.x - s.from.x);
      fixed += s.dur;
      pose = {...s.to};
    } else fixed += s.dur || 0;
    steps.push(s);
  }
  const span = win[1] - win[0];
  let fk = 1;
  if (fixed > span * 0.85 && dist > 0) fk = (span * 0.85) / fixed;
  if (dist === 0 && fixed > span) fk = span / fixed;
  const perD = dist > 0 ? (span - fixed * fk) / dist : 0;
  let u = win[0];
  // snapshots: the state before each step
  let st = {pose: {...start}, k: 0, mode: 'none', cover: null, carried: -1, lift: 0, from: null, loc: {}, cA: -1, cB: -1, travelled: 0};
  for (let i = 0; i < G.n; i++) st.loc[i] = {kind: 'tray', i};
  for (const s of steps) {
    const dur = s.type === 'walk' ? s.d * perD : (s.dur || 0) * fk;
    s.u0 = u; s.u1 = u + dur; u += dur;
    s.snap = JSON.parse(JSON.stringify(st));
    // the state after the step
    if (s.type === 'walk') { st.pose = {...s.to}; st.travelled += s.d; }
    if (s.type === 'reach') { st.k = 1; st.mode = s.mode; st.cover = s.cover || null; }
    if (s.type === 'lift') { st.carried = s.piece; st.lift = 1; st.loc[s.piece] = {kind: 'hand'}; st.from = s.from; }
    if (s.type === 'put') { st.loc[st.carried] = {...s.to}; st.carried = -1; st.lift = 0; }
    if (s.type === 'release') { st.k = 0; st.mode = 'none'; st.cover = null; }
    if (s.type === 'close') { st.pose = {...s.to}; st.travelled += s.d; if (s.cover === 'A') st.cA = 1; else st.cB = 1; }
  }
  return {steps, end: st, start: {...start}, win, kind: o.kind || 'b'};
}

/**
 * Walk progress: a smooth start, an even pace and a smooth stop (peak speed 1.25× the average — an eased sine would
 * peak at 1.57×).
 */
export function walkEase(q) {
  const a = 0.2;
  const vmax = 1 / (1 - a);
  if (q <= a) return (vmax * q * q) / (2 * a);
  if (q >= 1 - a) { const z = 1 - q; return 1 - (vmax * z * z) / (2 * a); }
  return (vmax * a) / 2 + vmax * (q - a);
}

/** Pose interpolation (deg linear, shortest of the supplied values). */
function lerpPose(a, b, q) {
  return {x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), deg: lerp(a.deg, b.deg, q)};
}

/** Where a held sheet is for a pose (straight in front of the participant, HOLD from its centre). */
export function heldAt(G, pose) {
  const p = toWorld(pose, {x: 0, y: -G.HOLD});
  return {x: p.x, y: p.y, rot: pose.deg};
}

/**
 * Evaluate a plan at u: the participant's pose (walk amplitude and phase), the hands (targets and blend), the carried
 * sheet, every piece's place and both covers.
 */
export function evalPlan(G, plan, u) {
  const e = ease.inOutCubic;
  const ss = plan.steps;
  let st, s = null, q = 0;
  if (!ss.length || u < ss[0].u0) st = ss.length ? ss[0].snap : plan.end;
  else if (u >= ss[ss.length - 1].u1) st = plan.end;
  else {
    for (const x of ss) if (u >= x.u0 && u < x.u1) { s = x; break; }
    if (!s) s = ss.find(x => u < x.u1) || ss[ss.length - 1];
    st = s.snap;
    q = clamp((u - s.u0) / Math.max(1e-9, s.u1 - s.u0));
  }
  let pose = {...st.pose}, k = st.k, mode = st.mode, cover = st.cover, carried = st.carried, lift = st.lift;
  const loc = {...st.loc};
  let cA = st.cA, cB = st.cB, walk = 0, travelled = st.travelled, phase = 'rest';
  if (s) {
    if (s.type === 'walk') {
      const qe = walkEase(q);
      pose = lerpPose(s.from, s.to, qe);
      walk = s.d > 2 ? Math.sin(Math.PI * q) : 0;
      travelled += s.d * qe;
      phase = carried >= 0 ? 'carrying' : 'walking';
    } else if (s.type === 'reach') { k = ease.inOutSine(q); mode = s.mode; cover = s.cover || null; phase = 'reaching'; }
    else if (s.type === 'lift') { if (q > 0) { carried = s.piece; loc[s.piece] = {kind: 'hand'}; lift = e(q); } phase = 'lifting'; }
    else if (s.type === 'put') { lift = 1 - e(q); phase = 'laying'; if (q >= 1) { loc[carried] = {...s.to}; carried = -1; } }
    else if (s.type === 'release') { k = 1 - ease.inOutSine(q); phase = 'releasing'; }
    else if (s.type === 'close') {
      const qe = walkEase(q);
      const sx = lerp(-1, 1, qe);
      if (s.cover === 'A') cA = sx; else cB = sx;
      pose = G.coverPose(s.F, sx);
      walk = Math.sin(Math.PI * q) * 0.7;
      travelled += s.d * qe;
      phase = 'closing';
    } else phase = 'waiting';
  } else if (u >= (ss.length ? ss[ss.length - 1].u1 : 0)) phase = 'done';
  // hands
  let targets = null;
  if (k > 0 && mode === 'sheet') {
    const sc = lerp(1, LIFT, lift);
    const yE = -G.HOLD + (G.DH / 2) * sc - 6;
    targets = [toWorld(pose, {x: G.DW * 0.22, y: yE}), toWorld(pose, {x: -G.DW * 0.22, y: yE})];
  } else if (k > 0 && mode === 'cover') {
    const F = cover === 'A' ? G.folderO : G.folderN;
    targets = [null, G.coverEdge(F, cover === 'A' ? cA : cB)];
  }
  const held = carried >= 0 ? {...heldAt(G, pose), s: lerp(1, LIFT, lift), op: 1, kind: plan.kind} : null;
  return {pose: {...pose, walk, phase: travelled / 15}, k, mode, targets, carried, lift, held, loc, cA, cB, phase, step: s ? s.type : null};
}

/** Room-frame record of a plan state (tray pieces, slots, held sheet, covers, person, reach). */
export function planRecord(G, ps, {slotsN = G.n} = {}) {
  const tray = [], slotN = new Array(slotsN).fill(0);
  let slotO = 0;
  for (let i = 0; i < G.n; i++) {
    const l = ps.loc[i];
    tray[i] = l && l.kind === 'tray' ? 1 : 0;
    if (l && l.kind === 'slotN' && l.i < slotsN) slotN[l.i] = 1;
    if (l && l.kind === 'slotO') slotO = 1;
  }
  return {tray, slotN, slotO, held: ps.held, coverA: ps.cA, coverB: ps.cB, person: ps.pose, reach: ps.targets ? {targets: ps.targets, k: ps.k} : null};
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box (design units)                   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} R resolveRd()
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {any} o rdGeometry options + {crop?:number, align?:{x:number,y:number}, minK?:number}
 */
export function composeRd(ctx, R, box, o = {}) {
  const t = WALL;
  const G0 = rdGeometry(R, o);
  const ar = box.w / box.h;
  let W = G0.needW, H = G0.needH;
  const crop = o.crop ?? 1.15;
  if ((W + 2 * t) / (H + 2 * t) < ar) W = Math.min(W * crop, ar * (H + 2 * t) - 2 * t);
  else H = Math.min(H * crop, (W + 2 * t) / ar - 2 * t);
  const G = rdGeometry(R, {...o, W, H});
  const E = G.extents;
  // (maxK: an upper bound on the scale — a very large room would hurry its walks on screen, item 19)
  const k = Math.max(1e-6, Math.min(box.w / E.w, box.h / E.h, o.maxK ?? Infinity));
  const al = o.align || {x: 0.5, y: 0.5};
  const ox = box.x + (box.w - E.w * k) * al.x - E.x * k;
  const oy = box.y + (box.h - E.h * k) * al.y - E.y * k;
  const problems = [...G.problems];
  if (k < (o.minK ?? 0.3)) problems.push('room-tiny');
  return {k, G, E, ox, oy, toD: mapper(ox, oy, k), bD: mapBox(ox, oy, k), problems, box, planRect: {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k}};
}

/* ------------------------------------------------------------------ */
/* Mechanism art (front elevation of a two-compartment file box)       */
/* ------------------------------------------------------------------ */

/**
 * A bundle of standing sheets seen face-on (front elevation), in box B = {x, y, w, h}: a lane-coloured backing board
 * and `n` sheets staggered in front of it; kind 'a' puts the decision sheet (grey header band, plain seal outline) in
 * front, kind 'b' gives every sheet a lane-coloured strip. Nothing is written on them.
 */
export function bundleArt(ctx, B, kind, n = 3) {
  const c = laneColors(ctx);
  const col = kind === 'a' ? c.a : c.b, tint = kind === 'a' ? c.aSoft : c.bSoft;
  const parts = [
    h('path', {d: roundRectPath(B.x + 6, B.y + 8, B.w, B.h, 8), fill: 'rgba(31,35,40,0.12)'}),
    h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 8), fill: tint, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(B.x), y: r(B.y), width: r(B.w * 0.08), height: r(B.h), rx: 4, fill: col}),
  ];
  const m = Math.max(1, Math.min(4, n));
  const sw = B.w * 0.62, sh = B.h * 0.8;
  for (let i = 0; i < m; i++) {
    const last = i === m - 1;
    const x = B.x + B.w * 0.16 + (i * B.w * 0.14) / Math.max(1, m - 1) * (m > 1 ? 1 : 0);
    const y = B.y + B.h * 0.14 - i * 6 + (m - 1) * 6;
    const cx = x + sw / 2, cy = y + sh / 2;
    if (kind === 'a' && last) parts.push(g({transform: T(cx, cy)}, decisionArt(ctx, sw, sh, {noShadow: true})));
    else parts.push(g({transform: T(cx, cy)}, sheetArt(ctx, sw, sh, {noShadow: true}), kind === 'b' ? stripeArt(sw, sh, col, undefined, 1) : null));
  }
  return parts;
}

/** The divider plate seen face-on: a tall grey plate with plain slots (it decides nothing). */
export function plateArt(D) {
  const slots = [];
  for (let i = 1; i <= 4; i++) slots.push(`M${r(D.x + D.w * 0.25)} ${r(D.y + (D.h * i) / 5)}H${r(D.x + D.w * 0.75)}`);
  return [
    h('rect', {x: r(D.x + 5), y: r(D.y + 7), width: r(D.w), height: r(D.h), rx: 5, fill: 'rgba(31,35,40,0.14)'}),
    h('rect', {x: r(D.x), y: r(D.y), width: r(D.w), height: r(D.h), rx: 5, fill: '#b9c1c9', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: slots.join(''), stroke: '#6f7a85', 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
  ];
}

/** The open file box seen face-on: back wall (drawn first), and the front panel (drawn over the bundles). */
export function fileBoxArt(ctx, Bx, slotX) {
  const c = laneColors(ctx);
  const lip = 26;
  const back = [
    h('path', {d: roundRectPath(Bx.x + 8, Bx.y + 10, Bx.w, Bx.h, 10), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(Bx.x, Bx.y - lip, Bx.w, Bx.h + lip, 10), fill: '#9c7a57', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: `M${r(slotX)} ${r(Bx.y - lip + 6)}V${r(Bx.y + 4)}`, stroke: '#6b5139', 'stroke-width': 8, 'stroke-linecap': 'round'}),
  ];
  const front = [
    h('path', {d: roundRectPath(Bx.x, Bx.y, Bx.w, Bx.h, 10), fill: '#caa075', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: `M${r(slotX)} ${r(Bx.y + 8)}V${r(Bx.y + Bx.h - 8)}`, stroke: '#8e6441', 'stroke-width': 3}),
    h('rect', {x: r(Bx.x + Bx.w * 0.12), y: r(Bx.y + Bx.h * 0.32), width: r(Bx.w * 0.22), height: r(Bx.h * 0.36), rx: 5, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(Bx.x + Bx.w * 0.12), y: r(Bx.y + Bx.h * 0.32), width: r(Bx.w * 0.05), height: r(Bx.h * 0.36), rx: 2, fill: c.a}),
    h('rect', {x: r(Bx.x + Bx.w * 0.66), y: r(Bx.y + Bx.h * 0.32), width: r(Bx.w * 0.22), height: r(Bx.h * 0.36), rx: 5, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(Bx.x + Bx.w * 0.66), y: r(Bx.y + Bx.h * 0.32), width: r(Bx.w * 0.05), height: r(Bx.h * 0.36), rx: 2, fill: c.b}),
  ];
  return {back, front};
}

/** The index card of the pieces (front view): a card with two plain columns of rows — blue strips (A) and amber strips (B); no text. */
export function indexCardArt(ctx, Cd, nA = 3, nB = 3) {
  const c = laneColors(ctx);
  const rows = [];
  const colW = (Cd.w - 36) / 2;
  const rh = Math.min(16, (Cd.h - 44) / Math.max(nA, nB, 1) - 6);
  for (const [k, n0, x0] of [['a', nA, Cd.x + 12], ['b', nB, Cd.x + 24 + colW]]) {
    for (let i = 0; i < n0; i++) {
      const y = Cd.y + 34 + i * (rh + 6);
      rows.push(h('rect', {x: r(x0), y: r(y), width: 7, height: r(rh), rx: 2, fill: c[k]}));
      rows.push(h('path', {d: `M${r(x0 + 13)} ${r(y + rh / 2)}H${r(x0 + colW - 4 - (i % 2) * colW * 0.25)}`, stroke: '#b9c1c9', 'stroke-width': 3, 'stroke-linecap': 'round'}));
    }
  }
  return [
    h('path', {d: roundRectPath(Cd.x + 5, Cd.y + 7, Cd.w, Cd.h, 8), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(Cd.x, Cd.y, Cd.w, Cd.h, 8), fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(Cd.x), y: r(Cd.y), width: r(Cd.w), height: 22, rx: 8, fill: '#9aa4ae', stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: `M${r(Cd.x + Cd.w / 2)} ${r(Cd.y + 28)}V${r(Cd.y + Cd.h - 10)}`, stroke: '#d0d6dc', 'stroke-width': 2}),
    rows,
  ];
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/** Panel row node: this motif's glyphs (folders A/B, decision sheet, piece, divider, tray, calendar, sign), else the shared rows. */
export function rdRowNode(ctx, m, o = {}) {
  const MINE = ['folderA', 'folderB', 'decision', 'piece', 'pieceA', 'divider', 'tray', 'calendar', 'sign', 'grounds', 'index', 'tracer', 'kind-relation', 'kind-communication', 'kind-sequence', 'kind-causal', 'delta'];
  if (m.kind === 'legend' && MINE.includes(m.glyphKind)) {
    const th = ctx.theme;
    const c = laneColors(ctx);
    const s = m.glyph;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    const k = m.glyphKind;
    if (k === 'folderA' || k === 'folderB') {
      const col = k === 'folderA' ? c.a : c.b, tint = k === 'folderA' ? c.aSoft : c.bSoft;
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(s * 0.02), y: r(-s * 0.36), width: r(s * 0.18), height: r(s * 0.1), rx: 2, fill: col, stroke: INK, 'stroke-width': 1.4}),
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.28), width: r(s * 0.72), height: r(s * 0.6), rx: 3, fill: tint, stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.28), width: r(s * 0.1), height: r(s * 0.6), rx: 2, fill: col}));
    } else if (k === 'decision') {
      glyph = g({transform: `${T(gx, gy)} scale(${r(s / 110, 4)})`}, decisionArt(ctx, 56, 74, {noShadow: true}));
    } else if (k === 'piece' || k === 'pieceA') {
      glyph = g({transform: `${T(gx, gy)} scale(${r(s / 110, 4)})`}, sheetArt(ctx, 56, 74, {noShadow: true}), stripeArt(56, 74, k === 'pieceA' ? c.a : c.b, undefined, 1));
    } else if (k === 'divider') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.2), y: r(-s * 0.4), width: r(s * 0.4), height: r(s * 0.1), rx: 2, fill: '#8f98a1', stroke: INK, 'stroke-width': 1.4}),
        h('rect', {x: r(-s * 0.2), y: r(s * 0.3), width: r(s * 0.4), height: r(s * 0.1), rx: 2, fill: '#8f98a1', stroke: INK, 'stroke-width': 1.4}),
        h('rect', {x: r(-s * 0.08), y: r(-s * 0.38), width: r(s * 0.16), height: r(s * 0.76), rx: 2, fill: '#b9c1c9', stroke: INK, 'stroke-width': 1.6}));
    } else if (k === 'tray') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.4), y: r(-s * 0.3), width: r(s * 0.8), height: r(s * 0.6), rx: 4, fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.2), y: r(-s * 0.22), width: r(s * 0.4), height: r(s * 0.44), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.4}),
        h('rect', {x: r(-s * 0.2), y: r(-s * 0.22), width: r(s * 0.06), height: r(s * 0.44), rx: 1, fill: c.b}));
    } else if (k === 'calendar') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.34), y: r(-s * 0.38), width: r(s * 0.68), height: r(s * 0.76), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.34), y: r(-s * 0.38), width: r(s * 0.68), height: r(s * 0.2), rx: 3, fill: '#9aa4ae', stroke: INK, 'stroke-width': 1.4}),
        h('path', {d: `M${r(-s * 0.12)} ${r(-s * 0.14)}V${r(s * 0.32)}M${r(s * 0.12)} ${r(-s * 0.14)}V${r(s * 0.32)}M${r(-s * 0.28)} ${r(s * 0.1)}H${r(s * 0.28)}`, stroke: '#b9c1c9', 'stroke-width': 1.4}));
    } else if (k === 'sign') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.46), y: r(-s * 0.3), width: r(s * 0.92), height: r(s * 0.6), rx: 4, fill: '#e9edf1', stroke: INK, 'stroke-width': 1.8}),
        h('circle', {cx: r(-s * 0.2), cy: 0, r: r(s * 0.16), fill: '#ffffff', stroke: LINE.color, 'stroke-width': 1.6}),
        h('rect', {x: r(0), y: r(-s * 0.12), width: r(s * 0.32), height: r(s * 0.24), rx: 2, fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 1.4}));
    } else if (k === 'grounds') {
      glyph = g({transform: T(gx, gy)},
        h('path', {d: `M${r(-s * 0.36)} ${r(-s * 0.26)}H${r(s * 0.36)}V${r(s * 0.16)}H${r(-s * 0.06)}L${r(-s * 0.22)} ${r(s * 0.32)}V${r(s * 0.16)}H${r(-s * 0.36)}Z`, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
        h('path', {d: `M${r(-s * 0.24)} ${r(-s * 0.1)}H${r(s * 0.24)}M${r(-s * 0.24)} ${r(s * 0.02)}H${r(s * 0.1)}`, stroke: '#9aa4ae', 'stroke-width': 1.8, 'stroke-linecap': 'round'}));
    } else if (k === 'index') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.32), width: r(s * 0.72), height: r(s * 0.64), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.32), width: r(s * 0.72), height: r(s * 0.14), rx: 3, fill: '#9aa4ae'}),
        h('rect', {x: r(-s * 0.28), y: r(-s * 0.08), width: r(s * 0.08), height: r(s * 0.1), fill: c.a}),
        h('rect', {x: r(-s * 0.28), y: r(s * 0.1), width: r(s * 0.08), height: r(s * 0.1), fill: c.a}),
        h('rect', {x: r(s * 0.06), y: r(-s * 0.08), width: r(s * 0.08), height: r(s * 0.1), fill: c.b}),
        h('rect', {x: r(s * 0.06), y: r(s * 0.1), width: r(s * 0.08), height: r(s * 0.1), fill: c.b}));
    } else if (k === 'tracer') {
      glyph = g({transform: T(gx, gy)}, h('circle', {r: r(s * 0.3), fill: th.accent2, opacity: 0.22}), h('circle', {r: r(s * 0.16), fill: th.accent2, stroke: th.paper, 'stroke-width': 2.4}));
    } else if (k === 'delta') {
      glyph = g({transform: T(gx, gy)}, changedMarker(ctx, {radius: s * 0.3}));
    } else {
      const kind = k.slice(5);
      const col = linkColor(th, kind);
      const x0 = -s * 0.42, x1 = s * 0.42;
      const ends = kind === 'relation' ? [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('circle', {cx: r(x1), cy: 0, r: 3.6, fill: col})]
        : kind === 'communication' ? [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('circle', {cx: r(x1), cy: 0, r: 4.4, fill: th.card, stroke: col, 'stroke-width': 2.2})]
          : kind === 'sequence' ? [h('rect', {x: r(x0 - 3.5), y: -3.5, width: 7, height: 7, fill: col}), h('path', {d: `M${r(x1 + 2)} 0L${r(x1 - 9)} -6L${r(x1 - 9)} 6Z`, fill: col})]
            : [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('path', {d: `M${r(x1 + 2)} 0L${r(x1 - 9)} -6L${r(x1 - 9)} 6Z`, fill: col})];
      glyph = g({transform: T(gx, gy)}, h('path', {d: `M${r(x0)} 0H${r(x1)}`, stroke: col, 'stroke-width': 3.4, 'stroke-linecap': 'round'}), ends);
    }
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return rowNode(ctx, m, o);
}

export {legendGlyph, FONT};
