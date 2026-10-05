/**
 * "Pausa de audiencia" kit (LAW-0309..0312, hearings-08): a generic, fictional hearing room drawn as a floor plan, built
 * for a pause of the session. Along the top wall hangs a SESSION PANEL with two places, in the order supplied (a
 * sequence as configured, illustrative): the place of the SESSION CLOCK (a dial in a bezel, its hands showing a fictional
 * session time, as supplied; its plate ●, "session active") and the place of the RECESS CARD (◆, "recess", with its
 * caption, as supplied). The participant supplied as `operator` stands at the lectern beside the panel (no rank implied);
 * the others sit at a shared table; the exhibits lie on a low cabinet by the right wall; a wall clock is the support.
 *
 * The concrete action — "the session time stops while the actors keep their positions": the operator raises a hand
 * towards the panel (the cause); the session clock's hands slow down and stop at the supplied time and a neutral pause
 * badge (‖) appears on its bezel — the wall clock keeps running, so the paused clock never reads as broken; the recess
 * card comes out from the operator's hand to its place (a small copy of the stopped dial and a ‖ — never text), a
 * connector draws from the session clock to the card, and the ◆ caption arrives; then a floor ring marks every
 * participant's position: nobody moves.
 *
 * Nothing is ruled: no adjournment rule, permitted duration, time limit, consequence or end of the proceedings is shown
 * or inferred; the recess is neither a problem nor a penalty. ● and ◆ are supplied states of equal weight. Generic art
 * comes from ./hearings-art.js and ../../courts/kits/courts-art.js; text, chip placement and panel helpers from
 * ./apertura-audiencia.js — all imported READ-ONLY. The room geometry follows ./declaracion-experta.js (copied here,
 * never imported, so that kit stays unchanged).
 * @module animations/hearings/kits/pausa-audiencia
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

/** Template sizes: the session clock's place (bezel) and the recess card's place. */
export const DOC = {w: 136, h: 136};
export const ZONE = {w: 216, h: 128};
/** Where the recess card starts (scale), at the operator's hand. */
export const CARD_S0 = 0.16;
/** The session clock: dial centre and radius inside its bezel (template units, relative to the bezel's corner). */
export const DIAL = {cx: 68, cy: 68, R: 54};
/** The small dial on the recess card (card-local). */
const CDIAL = {cx: 58, cy: 64, R: 42};
/** How far the session clock's minute hand runs (degrees) before it stops at the supplied time. */
export const RUN_DEG = 72;

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

const timeField = (d) => obj(d, {hour: int('Hour shown by the hands (fictional, 0–23)', 0, 23), minute: int('Minute shown by the hands (fictional)', 0, 59)}, ['hour', 'minute']);

/** Category fields shared by the four entries (brief: speakers, statements, exhibits, sequence). */
export const pzFields = {
  hearing: obj('Generic, fictional hearing room', {room: str('Name of the room (fictional)', 60)}, ['room']),
  speakers: list('Participants (generic, fictional): one stands at the lectern beside the session panel, the others sit at the shared table on the same chairs. No rank, role rule or speaking order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 3, 4),
  operator: int('Index in `speakers` of the participant at the lectern who signals the recess at the panel (generic; no rank implied)', 0, 3),
  statements: list('The two places on the session panel: the session clock (● session active, its plate as supplied) and the recess card (◆ recess, its caption as supplied). Neither is a rule, a problem or an end of the proceedings', obj('Place', {
    kind: oneOf('active (the session clock, ●) or recess (the recess card, ◆) — supplied states only', ['active', 'recess']),
    text: str('Plate of the session clock, or caption of the recess (fictional, as supplied)', 60),
  }, ['kind', 'text']), 2, 2),
  exhibits: list('Exhibits on the low cabinet by the wall, each with its supplied tag (they stay where they lie)', str('Exhibit tag (fictional)', 50), 1, 2),
  clock: timeField('The session clock (fictional time, as supplied): its hands run and stop at this time'),
  sequence: list('Order of the two places along the panel (indices in `statements`): a sequence as configured (illustrative), not a rule', int('Index in `statements`', 0, 1), 1, 2),
  states: obj('Captions of the two supplied states', {
    active: str('Caption of ● (session active, as supplied)', 50),
    recess: str('Caption of ◆ (recess, as supplied)', 50),
  }, ['active', 'recess']),
  labels: obj('Editable captions', {
    positions: str('Caption of the floor rings (the participants keep their positions, as supplied)', 60),
    sequence: str('Caption of the order of the places (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['positions', 'sequence', 'key']),
};

export const PZ_EN = {
  hearing: {room: 'Hearing room 4 (fictional)'},
  speakers: [{label: 'Participant A'}, {label: 'Participant B'}, {label: 'Participant C'}],
  operator: 0,
  statements: [
    {kind: 'active', text: 'Session clock (as supplied)'},
    {kind: 'recess', text: 'Recess from 10:40 (as supplied)'},
  ],
  exhibits: ['Exhibit 1: binder of papers'],
  clock: {hour: 10, minute: 40},
  sequence: [0, 1],
  states: {active: 'Session active (as supplied)', recess: 'Recess (as supplied)'},
  labels: {positions: 'Positions kept (as supplied)', sequence: 'Sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const PZ_ES = {
  hearing: {room: 'Sala de audiencias 4 (ficticia)'},
  speakers: [{label: 'Participante A'}, {label: 'Participante B'}, {label: 'Participante C'}],
  operator: 0,
  statements: [
    {kind: 'active', text: 'Reloj de sesión (aportado)'},
    {kind: 'recess', text: 'Receso desde las 10:40 (aportado)'},
  ],
  exhibits: ['Prueba 1: carpeta de documentos'],
  clock: {hour: 10, minute: 40},
  sequence: [0, 1],
  states: {active: 'Sesión activa (aportada)', recess: 'Receso (aportado)'},
  labels: {positions: 'Posiciones conservadas (aportadas)', sequence: 'Secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];

/** Hand angles (degrees, clockwise from 12) of a supplied time. */
export function handAngles(t) {
  const hh = ((Math.round(t.hour ?? 0) % 12) + 12) % 12, mm = clamp(Math.round(t.minute ?? 0), 0, 59);
  return {min: mm * 6, hour: hh * 30 + mm * 0.5};
}

/**
 * Resolve the supplied content: participants (the operator and the seated others), the two places (active ●, recess ◆)
 * in the configured order, the exhibits and the stop time. Internally the session clock's place is the "document"
 * column and the recess card's the "detail" column.
 * @param {any} ctx
 * @param {any} P localised params
 */
export function resolvePz(ctx, P) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  const presenter = clamp(P.operator ?? 0, 0, n - 1);
  const listeners = speakers.map(sp => sp.index).filter(i => i !== presenter);
  const exhibits = (P.exhibits || []).slice(0, 2);
  const sts = (P.statements || []).slice(0, 2);
  let docI = sts.findIndex(s => s.kind === 'active'), detI = sts.findIndex(s => s.kind === 'recess');
  if (docI < 0) docI = detI === 0 ? 1 : 0;
  if (detI < 0 || detI === docI) detI = docI === 0 ? 1 : 0;
  const items = [0, 1].map(i => ({i, op: i === docI ? 'active' : 'recess', text: (sts[i] && sts[i].text) || ''}));
  const order = [];
  for (const q of P.sequence || []) if (q < 2 && !order.includes(q)) order.push(q);
  for (const i of [0, 1]) if (!order.includes(i)) order.push(i);
  const rank = items.map(it => order.indexOf(it.i));
  const ck = P.clock || PZ_EN.clock;
  const stop = {hour: clamp(Math.round(ck.hour ?? 10), 0, 23), minute: clamp(Math.round(ck.minute ?? 0), 0, 59)};
  return {n, speakers, presenter, listeners, exhibits, items, order, rank, docI, detI, stop};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {number} W
 * @param {number} H
 * @param {any} R resolvePz()
 * @param {{tagFit?:any, capFit?:any, dockH?:number, dockW?:number, dockBeside?:boolean, qGap?:number, Ft?:number|null}} [o]
 */
export function pzGeometry(W, H, R, o = {}) {
  const t = WALL;
  const pad = 14;
  const gsT = o.Ft ? o.Ft * 0.32 : 7;
  const plate = fit => (fit ? {w: 30 + gsT + fit.width * 1.06 + 18, h: fit.height + 14} : {w: 70, h: 24});
  const tag = plate(o.tagFit), cap = plate(o.capFit);
  const dockH = o.dockH || 0;
  const beside = !!(o.dockBeside && dockH);
  const dockWB = beside ? Math.max(o.dockW || 0, cap.w) : 0;
  // (`markR`, inspect: a free strip at the right of the card's column for the changed-datum marker, off every plate)
  const markR = o.markR || 0;
  const col = {document: Math.max(DOC.w, tag.w), detail: Math.max(ZONE.w, cap.w + (beside ? 10 + dockWB : 0), o.dockW && !beside ? o.dockW : 0) + markR};
  const left = R.rank[R.docI] <= R.rank[R.detI] ? 'document' : 'detail';
  const right = left === 'document' ? 'detail' : 'document';
  const bw = pad * 2 + col[left] + 34 + col[right];
  const groupW = bw + 86 + (o.qGap || 0) + PERSON.half + 40;
  const exW = R.exhibits.length ? 54 + 24 + 40 : 0;
  const board = {x: Math.max(34, Math.min((W - groupW) / 2, W - exW - groupW - 20)), y: 8, w: bw, h: 0};
  const colX = {[left]: board.x + pad, [right]: board.x + pad + col[left] + 34};
  const page = {x: colX.document + (col.document - DOC.w) / 2, y: board.y + pad, w: DOC.w, h: DOC.h};
  const tagBox = {x: colX.document + (col.document - tag.w) / 2, y: page.y + page.h + 8, ...tag};
  // (the card's speech tail sticks out 11 units on its right, towards the operator, inside the panel's margin)
  const inner = col.detail - markR;
  const zone = {x: colX.detail + (inner - ZONE.w) / 2, y: board.y + pad, w: ZONE.w, h: ZONE.h};
  const capBox = {x: beside ? colX.detail : colX.detail + (inner - cap.w) / 2, y: zone.y + zone.h + 8, ...cap};
  const dock = !dockH ? null : beside ? {x: capBox.x + cap.w + 10, y: capBox.y, w: dockWB, h: dockH} : {x: capBox.x, y: capBox.y + capBox.h + 8, w: Math.max(cap.w, o.dockW || 0), h: dockH};
  if (dock && !beside) dock.x = Math.min(dock.x, colX.detail + inner - dock.w);
  board.h = Math.max(tagBox.y + tagBox.h, dock ? dock.y + dock.h : capBox.y + capBox.h) + pad - board.y;
  const yB = board.y + board.h;
  const bx1 = board.x + board.w;
  const qHome = {x: bx1 + 86 + (o.qGap || 0), y: board.y + 66};
  const qDeg = facing(qHome, {x: bx1 - 80, y: qHome.y + 40});
  // (signalling: the right hand raised in front, towards the panel — within the arm's reach)
  const aim = toWorld({x: qHome.x, y: qHome.y, deg: qDeg}, {x: 30, y: -66});
  const lectern = {cx: qHome.x + 4, cy: qHome.y + 84, s: 58};
  const laneY = yB + 34;
  const ne = R.exhibits.length;
  const exS = 54;
  const cw = exS + 24, step = exS * 0.74 + 30;
  const cabH = ne * step + 14;
  const cabX = W - 10 - cw;
  // (the cabinet stands well below the lectern: the floor right of the operator stays free for a label)
  const cab0Y = Math.max(laneY + 92, lectern.cy + 50);
  const nL = R.listeners.length;
  const B = 54;
  const A = Math.max(110, nL * 55 + 40);
  const angles = {1: [90], 2: [124, 56], 3: [150, 90, 30]}[nL] || [];
  const Cx = Math.max(40 + A + 38 + PERSON.half, Math.min(board.x + board.w / 2, (cabX - 40) - (A + 38 + PERSON.half)));
  const C0y = laneY + 70 + B;
  const seatDrop = Math.max(0, ...angles.map(a => Math.sin((a * Math.PI) / 180) * (B + 46)));
  const groupBottom0 = Math.max(C0y + B + 16, C0y + seatDrop + PERSON.half + 26);
  const bx1c = 34 + bw, Cxc = Math.max(40 + A + 38 + PERSON.half, 34 + bw / 2);
  const needW = Math.max(bx1c + 96 + (o.qGap || 0) + PERSON.half + 40 + cw + 30, Cxc + A + 38 + PERSON.half + 40 + cw + 20, 640);
  const needH = Math.max(groupBottom0 + (o.Ft ? 30 + o.Ft * 2.2 : 30), ne ? cab0Y + cabH + 110 : 0, lectern.cy + 60, 520);
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
  const clock = {cx: 46, cy: laneY + 6, R: 28};
  const door = {a: Math.min(W - 150, Math.max(C.x + A + 60, W * 0.55)), b: Math.min(W - 70, Math.max(C.x + A + 140, W * 0.55 + 80))};
  const problems = [];
  if (W + 0.5 < needW) problems.push('room-width');
  if (H + 0.5 < needH) problems.push('room-height');
  const pageC = {x: page.x + page.w / 2, y: page.y + page.h / 2};
  const places = {document: {x: colX.document, y: board.y + pad, w: col.document, h: board.h - 2 * pad}, detail: {x: colX.detail, y: board.y + pad, w: col.detail, h: board.h - 2 * pad}};
  const markC = markR ? {x: colX.detail + inner + markR / 2, y: capBox.y + capBox.h / 2} : null;
  return {W, H, t, board, page, tagBox, zone, capBox, dock, places, left, right, markC, yB, qHome, qDeg, aim, lectern, laneY, cab, exhibits, C, A, B, seats, clock, door, needW, needH, problems, pageC,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t}};
}

/** Obstacles of the room for label placement (template units): panel, lectern, clock, door, cabinet. */
export function pzObstacles(G, o = {}) {
  const out = [
    {x: G.board.x - 8, y: 0, w: G.board.w + 16, h: G.yB + 8},
    {x: G.lectern.cx - 40, y: G.lectern.cy - 30, w: 80, h: 60},
    o.lifted ? null : {x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R - 6, w: 2 * G.clock.R + 12, h: 2 * G.clock.R + 12},
    {x: G.door.a, y: G.H - (G.door.b - G.door.a), w: G.door.b - G.door.a, h: G.door.b - G.door.a},
  ];
  if (G.cab && !o.lifted) {
    const nb = G.Ft ? G.Ft * 1.9 : 0;
    out.push({x: G.cab.x - 8 - nb, y: G.cab.y - 8, w: G.cab.w + 16 + nb, h: G.cab.h + 16});
  }
  return out.filter(Boolean);
}

export const personBox = s => ({x: s.x - PERSON.half - 8, y: s.y - PERSON.half - 8, w: PERSON.half * 2 + 16, h: PERSON.half * 2 + 16});

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/** ● / ◆ plate with its text (the session clock's plate, the recess caption). */
function plateNode(ctx, name, box, fit, kind, Ft, textName, swap = false) {
  const c = hearingColors(ctx);
  const gs = Ft ? Ft * 0.32 : 7;
  const gx = box.x + 14 + gs, gy = fit ? box.y + 7 + fit.size * 0.55 : box.y + box.h / 2;
  return g({name},
    h('path', {name: `${name}-body`, d: roundRectPath(box.x, box.y, box.w, box.h, 6), fill: c.card, stroke: INK, 'stroke-width': 2}),
    stateGlyph(ctx, {name: `${name}-g`, kind, cx: gx, cy: gy, s: gs}),
    // (`swap`, the session clock's plate: the glyph follows the state — ● while the session is active, ◆ once paused)
    swap ? stateGlyph(ctx, {name: `${name}-g2`, kind: 'diamond', cx: gx, cy: gy, s: gs, opacity: 0}) : null,
    fit ? g({name: textName}, textAt(fit, box.x + 30 + gs, box.y + 7, INK)) : h('path', {d: `M${r(box.x + 30)} ${r(box.y + box.h / 2)}H${r(box.x + box.w - 10)}`, stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}));
}

/** Dial ticks (12) around (cx, cy). */
function ticksPath(cx, cy, R, wMain = 1) {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? R * 0.72 : R * 0.8, r1 = R * 0.9;
    out.push(`M${r(cx + Math.sin(a) * r0)} ${r(cy - Math.cos(a) * r0)}L${r(cx + Math.sin(a) * r1)} ${r(cy - Math.cos(a) * r1)}`);
  }
  void wMain;
  return out.join('');
}

/** A hand (line from the centre, rotated by `deg`). */
const hand = (name, cx, cy, len, deg, width) => h('line', {name, x1: r(cx), y1: r(cy), x2: r(cx), y2: r(cy - len), stroke: INK, 'stroke-width': width, 'stroke-linecap': 'round', transform: `rotate(${r(deg, 2)} ${r(cx)} ${r(cy)})`});

/** The pause badge ‖ in a white disc (neutral: ink bars, no colour that reads as an alarm). */
export function pauseBadge(name, cx, cy, R, o = {}) {
  const bw = R * 0.28, bh = R * 1.0, gap = R * 0.22;
  return g({name, opacity: o.opacity},
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: '#ffffff', stroke: INK, 'stroke-width': r(Math.max(1.6, R * 0.14), 2)}),
    h('path', {d: roundRectPath(cx - gap / 2 - bw, cy - bh / 2, bw, bh, bw * 0.3) + roundRectPath(cx + gap / 2, cy - bh / 2, bw, bh, bw * 0.3), fill: INK}));
}

/** The recess card (card-local units, 0..ZONE): a speech card with a small copy of the stopped dial and a ‖ — no text. */
function cardContent(ctx, stop, flip) {
  const W0 = ZONE.w, H0 = ZONE.h;
  const a = handAngles(stop);
  // (a speech card: rounded, its short tail on the right edge, towards the operator; the dial faces the session clock)
  const tailR = `M10 0H${W0 - 10}Q${W0} 0 ${W0} 10V40L${W0 + 11} 52L${W0} 62V${H0 - 10}Q${W0} ${H0} ${W0 - 10} ${H0}H10Q0 ${H0} 0 ${H0 - 10}V10Q0 0 10 0Z`;
  const dx = flip ? W0 - CDIAL.cx : CDIAL.cx;
  const px = flip ? 62 : W0 - 62;
  return g(null,
    h('path', {d: tailR, fill: '#ffffff', stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(dx), cy: CDIAL.cy, r: CDIAL.R, fill: '#f5f7fa', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: ticksPath(dx, CDIAL.cy, CDIAL.R), stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round'}),
    hand(null, dx, CDIAL.cy, CDIAL.R * 0.5, a.hour, 4),
    hand(null, dx, CDIAL.cy, CDIAL.R * 0.78, a.min, 3),
    h('circle', {cx: r(dx), cy: CDIAL.cy, r: 3, fill: INK}),
    h('path', {d: roundRectPath(px - 22, CDIAL.cy - 30, 16, 60, 5) + roundRectPath(px + 6, CDIAL.cy - 30, 16, 60, 5), fill: ctx.theme.accent2}));
}

/** The small dial's edge on the card that faces the session clock (template units, card at its place). */
export function cardDialEdge(G) {
  const flip = G.left === 'detail';
  const dx = flip ? ZONE.w - CDIAL.cx : CDIAL.cx;
  return {x: G.zone.x + dx + (flip ? CDIAL.R : -CDIAL.R), y: G.zone.y + CDIAL.cy};
}

/** The recess card's whole box (template units): its place and the speech tail. */
export const cardBox = G => ({x: G.zone.x, y: G.zone.y, w: G.zone.w + 12, h: G.zone.h});

/** Where the minute hand's tip stands (template units) at minute angle `deg`. */
export function minuteTip(G, deg) {
  const a = (deg * Math.PI) / 180;
  return {x: G.page.x + DIAL.cx + Math.sin(a) * DIAL.R * 0.8, y: G.page.y + DIAL.cy - Math.cos(a) * DIAL.R * 0.8};
}

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G pzGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, tagFit?:any, capFit?:any, keep?:(b:any)=>boolean, lift?:boolean, datum?:any, noDetail?:boolean, zoneMark?:boolean, pins?:boolean}} o
 *   datum (inspect): {stops: {before, after}, capFits: {before, after}, wasFit} — the recess card exists for both times; the
 *   old caption moves, unchanged, to the dock under (or beside) the caption plate
 */
export function pzRoom(ctx, G, o) {
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
  const B0 = G.board;
  const datum = o.datum || null;
  const stops = datum ? {before: datum.stops.before, after: datum.stops.after} : {main: R.stop};
  const boardParts = [
    h('path', {d: roundRectPath(B0.x + 4, B0.y + 6, B0.w, B0.h, 10), fill: ctx.theme.shadow}),
    h('path', {name: `${P}-board-body`, d: roundRectPath(B0.x, B0.y, B0.w, B0.h, 10), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
    h('path', {name: `${P}-zone-place`, d: roundRectPath(G.zone.x, G.zone.y, G.zone.w, G.zone.h, 8), fill: '#ffffff', stroke: '#9aa4ae', 'stroke-width': 2}),
  ];
  const keepZone = keep(cardBox(G)), keepCap = keep(G.capBox), keepDock = G.dock ? keep(G.dock) : false;
  const keepDoc = keep({x: G.page.x, y: G.page.y, w: G.page.w, h: G.page.h});
  const keepTag = keep(G.tagBox);
  // the session clock: a bezel, its dial and its two hands (named: they run and stop), the pause ring and badge
  const pg = G.page;
  const dc = {x: pg.x + DIAL.cx, y: pg.y + DIAL.cy};
  const a0 = handAngles(R.stop);
  if (keepDoc || !o.keep) {
    boardParts.push(g({name: `${P}-sclock`},
      h('path', {d: roundRectPath(pg.x + 3, pg.y + 5, pg.w, pg.h, 18), fill: ctx.theme.shadow}),
      h('path', {name: `${P}-sclock-body`, d: roundRectPath(pg.x, pg.y, pg.w, pg.h, 18), fill: '#3b4550', stroke: INK, 'stroke-width': 2.4}),
      h('circle', {cx: r(dc.x), cy: r(dc.y), r: DIAL.R, fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: ticksPath(dc.x, dc.y, DIAL.R), stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
      h('path', {name: `${P}-pause-ring`, opacity: 0, d: `M${r(dc.x - DIAL.R - 4)} ${r(dc.y)}a${DIAL.R + 4} ${DIAL.R + 4} 0 1 0 ${2 * (DIAL.R + 4)} 0a${DIAL.R + 4} ${DIAL.R + 4} 0 1 0 ${-2 * (DIAL.R + 4)} 0`, fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': 5}),
      hand(`${P}-sclock-hr`, dc.x, dc.y, DIAL.R * 0.5, a0.hour, 6),
      hand(`${P}-sclock-min`, dc.x, dc.y, DIAL.R * 0.8, a0.min, 4),
      h('circle', {cx: r(dc.x), cy: r(dc.y), r: 4.5, fill: INK}),
      pauseBadge(`${P}-pause`, pg.x + pg.w - 15, pg.y + pg.h - 15, 14, {opacity: 0})));
  }
  // the recess card (a copy of the stopped dial and a ‖ — never text) and the connector from the clock
  const zoneCopies = [];
  if (!o.noDetail && keepZone) for (const [key, stp] of Object.entries(stops)) {
    zoneCopies.push(g({name: `${P}-zcopy-${key}`, opacity: 0, transform: 'translate(0 0) scale(1)'}, cardContent(ctx, stp, G.left === 'detail')));
  }
  boardParts.push(g({name: `${P}-zone`}, zoneCopies));
  if (o.zoneMark) boardParts.push(g({name: `${P}-zmark`, opacity: 0},
    h('circle', {cx: r(G.zone.x + G.zone.w / 2), cy: r(G.zone.y + G.zone.h / 2), r: 17, fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
    stateGlyph(ctx, {name: `${P}-zmark-g`, kind: 'diamond', cx: G.zone.x + G.zone.w / 2, cy: G.zone.y + G.zone.h / 2, s: 8.5})));
  const keepTethers = !o.keep || (keepZone && keepDoc);
  if (keepTethers && !o.noDetail) boardParts.push(h('path', {name: `${P}-tethers`, opacity: 0, d: 'M0 0', fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': 3.2, 'stroke-linecap': 'round'}));
  // the ● plate of the session clock
  if (keepTag && (keepDoc || !o.keep)) boardParts.push(g({name: `${P}-tag`, opacity: 0}, plateNode(ctx, `${P}-tagplate`, G.tagBox, o.tagFit, 'dot', o.Ft, `${P}-tag-text`, true)));
  // the ◆ caption plate: in both values when a datum is substituted; the dock holds the old value
  if ((!o.noDetail || datum) && keepCap) {
    if (datum) {
      if (G.dock && datum.capFits && keepDock) {
        boardParts.push(g({name: `${P}-dock`, opacity: 0},
          h('path', {d: roundRectPath(G.dock.x, G.dock.y, G.dock.w, G.dock.h, 6), fill: '#f3f4f5', stroke: '#9aa4ae', 'stroke-width': 1.6})));
        boardParts.push(g({name: `${P}-was`, opacity: 0}, textAt(datum.wasFit, G.dock.x + 10, G.dock.y + 6, '#57606a', {italic: true})));
      }
      const gs = o.Ft ? o.Ft * 0.32 : 7;
      boardParts.push(g({name: `${P}-cap`, opacity: 0},
        h('path', {name: `${P}-cap-body`, d: roundRectPath(G.capBox.x, G.capBox.y, G.capBox.w, G.capBox.h, 6), fill: c.card, stroke: INK, 'stroke-width': 2}),
        stateGlyph(ctx, {name: `${P}-cap-g`, kind: 'diamond', cx: G.capBox.x + 14 + gs, cy: datum.capFits ? G.capBox.y + 7 + datum.capFits.before.size * 0.55 : G.capBox.y + G.capBox.h / 2, s: gs}),
        datum.capFits ? g({name: `${P}-cap-v-after`, opacity: 0, transform: 'translate(0 0)'},
          g({name: `${P}-cap-v-after-text`}, textAt(datum.capFits.after, G.capBox.x + 30 + gs, G.capBox.y + 7, INK))) : null));
      if (datum.capFits) boardParts.push(g({name: `${P}-cap-v-before`, opacity: 0, transform: 'translate(0 0)'},
        g({name: `${P}-cap-v-before-text`}, textAt(datum.capFits.before, G.capBox.x + 30 + gs, G.capBox.y + 7, INK))));
    } else boardParts.push(g({name: `${P}-cap`, opacity: 0}, plateNode(ctx, `${P}-capplate`, G.capBox, o.capFit, 'diamond', o.Ft, `${P}-cap-text`)));
  }
  parts.push(wrapLift('board', g({name: `${P}-board`}, boardParts)));
  // cabinet and exhibits (they stay where they lie)
  if (G.cab && keep(G.cab)) {
    const bx = G.cab.x - (o.Ft || 0) * 0.95;
    const badge = (e, i) => (o.Ft ? g({name: `${P}-exnum${i}`},
      h('circle', {cx: r(bx), cy: r(e.cy), r: r(o.Ft * 0.78), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
      h('text', {x: r(bx), y: r(e.cy + o.Ft * 0.34), 'font-family': FONT, 'font-size': r(o.Ft, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(i + 1))) : null);
    parts.push(wrapLift('cab', g({name: `${P}-cab`}, lowCabinet(ctx, {name: `${P}-cabinet`, ...G.cab}),
      G.exhibits.map((e, i) => g(null, exhibitBox(ctx, {name: `${P}-exhibit${i}`, cx: e.cx, cy: e.cy, s: e.s, deg: e.deg}), badge(e, i))))));
  }
  const lecBox = {x: G.lectern.cx - G.lectern.s / 2, y: G.lectern.cy - G.lectern.s * 0.35, w: G.lectern.s, h: G.lectern.s * 0.7};
  if (keep(lecBox)) parts.push(wrapLift('lectern', g({name: `${P}-lectern`}, planLectern(ctx, {name: `${P}-lectern-top`, cx: G.lectern.cx, cy: G.lectern.cy, s: G.lectern.s, deg: 180}))));
  if (R.listeners.length) {
    const tb = {x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2};
    if (keep(tb)) parts.push(ovalTable(ctx, {name: `${P}-table`, cx: G.C.x, cy: G.C.y, a: G.A, b: G.B, seedKey: 'pause-room'}));
    R.listeners.forEach(i => { const s = G.seats[i]; if (keep(personBox(s))) parts.push(planChair(ctx, {name: `${P}-chair${i}`, cx: toWorld(s, {x: 0, y: 14}).x, cy: toWorld(s, {x: 0, y: 14}).y, deg: s.deg, s: 64})); });
  }
  // the floor rings of the kept positions (solid arcs, under each person: nobody moves)
  const pinR = PERSON.half + 2;
  const arcs = (cx, cy) => [0, 90, 180, 270].map(a0d => {
    const a1 = ((a0d + 12) * Math.PI) / 180, a2 = ((a0d + 78) * Math.PI) / 180;
    return `M${r(cx + Math.cos(a1) * pinR)} ${r(cy + Math.sin(a1) * pinR)}A${pinR} ${pinR} 0 0 1 ${r(cx + Math.cos(a2) * pinR)} ${r(cy + Math.sin(a2) * pinR)}`;
  }).join('');
  if (o.pins !== false) R.speakers.forEach(sp => {
    const s = G.seats[sp.index];
    if (!keep(personBox(s))) return;
    parts.push(h('path', {name: `${P}-pin${sp.index}`, opacity: 0, d: arcs(s.x, s.y), fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': 4, 'stroke-linecap': 'round'}));
  });
  const rigs = R.speakers.map(sp => (keep(personBox(G.seats[sp.index])) ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null));
  parts.push(rigs.filter(Boolean).map(rg => rg.node));

  /**
   * @param {{clockDeg:number, run:number, tag:number, pause:number, zoom:number, cap:number, link?:number, pins?:number,
   *   reach?:any, textK?:number, lift?:any, zmark?:number, datum?:{move:number, newIn:number, cue:number, copy?:number, was?:number, dockK?:number}}} st
   *   run: the session clock's progress towards the stop (1 = stopped at the supplied time)
   */
  function frame(st) {
    const nodes = {};
    Object.assign(nodes, door.frame(0));
    if (keep(clock.box)) Object.assign(nodes, clock.frame(st.clockDeg));
    if (o.lift) for (const key of ['clock', 'board', 'cab', 'lectern']) {
      if (key === 'cab' && !G.cab) continue;
      const q = (st.lift && st.lift[key]) || null;
      nodes[`${P}-lift-${key}`] = {transform: q ? q.transform : 'translate(0 0)'};
    }
    const tk = st.textK ?? 1;
    if (G.cab && keep(G.cab) && o.Ft) G.exhibits.forEach((_, i) => { nodes[`${P}-exnum${i}`] = {opacity: r(tk, 3)}; });
    const dm = st.datum || null;
    // the session clock's hands: before the stop they run up to the stop time; when a datum is substituted they turn
    // from the before time to the after time (`cue`)
    const sa = datum ? handAngles(stops.before) : handAngles(R.stop);
    const sb = datum ? handAngles(stops.after) : sa;
    const cue = dm ? clamp(dm.cue) : 0;
    const qc = cue; // (the caller eases `cue`)
    // (the hands take the shorter way round the dial to the substituted time — forwards or backwards, never a full spin)
    let dM = datum ? (stops.after.hour * 60 + stops.after.minute) - (stops.before.hour * 60 + stops.before.minute) : 0;
    dM = ((dM % 720) + 720) % 720;
    if (dM > 360) dM -= 720;
    // (a session that stays active runs past the supplied time: `run` above 1 turns the hands on)
    const back = RUN_DEG * (1 - Math.max(0, st.run));
    const minDeg = sa.min - back + dM * 6 * qc;
    const hourDeg = sa.hour - back / 12 + dM * 0.5 * qc;
    void sb;
    if (keepDoc || !o.keep) {
      nodes[`${P}-sclock-min`] = {transform: `rotate(${r(minDeg, 2)} ${r(dc.x)} ${r(dc.y)})`};
      nodes[`${P}-sclock-hr`] = {transform: `rotate(${r(hourDeg, 2)} ${r(dc.x)} ${r(dc.y)})`};
      nodes[`${P}-pause`] = {opacity: r(clamp(st.pause), 3)};
      nodes[`${P}-pause-ring`] = {opacity: r(clamp(st.pause), 3)};
    }
    if (keepTag && (keepDoc || !o.keep)) {
      nodes[`${P}-tag`] = {opacity: r(clamp(st.tag), 3)};
      // (the glyph follows the state: ● leaves in the first half of the pause, ◆ arrives in the second — never both)
      const pz = clamp(st.pause);
      nodes[`${P}-tagplate-g`] = {opacity: r(1 - clamp(pz / 0.5), 3)};
      nodes[`${P}-tagplate-g2`] = {opacity: r(clamp((pz - 0.5) / 0.5), 3)};
      if (o.tagFit) nodes[`${P}-tag-text`] = {opacity: r(tk, 3)};
    }
    const keys = Object.keys(stops);
    for (const key of keys) {
      if (o.noDetail || !keepZone) continue;
      const w = key === 'main' ? 1 : key === 'before' ? 1 - cue : cue;
      // (the card comes out from the operator's raised hand, growing, to its place on the panel)
      const q = ease.inOutCubic(clamp(st.zoom));
      const o0 = G.aim;
      const sc = lerp(CARD_S0, 1, q);
      nodes[`${P}-zcopy-${key}`] = {opacity: r(q > 0 ? w : 0, 3), transform: `${T(lerp(o0.x - ZONE.w * CARD_S0 * 0.5, G.zone.x, q), lerp(o0.y - ZONE.h * CARD_S0 * 0.5, G.zone.y, q))} scale(${r(sc, 4)})`};
    }
    if (!o.noDetail && keepTethers) {
      // the connector: from the session clock's bezel edge (at the height of the minute hand's tip) to the small dial
      // on the card, drawn out from the clock once the card has arrived
      const q = ease.inOutCubic(clamp(st.link ?? 0));
      const toLeft = G.left === 'detail';
      const tip = minuteTip(G, minDeg);
      const ax = toLeft ? G.page.x : G.page.x + G.page.w;
      const a1 = {x: ax, y: clamp(tip.y, G.page.y + 20, G.page.y + G.page.h - 20)};
      const b1 = cardDialEdge(G);
      const e1 = {x: lerp(a1.x, b1.x, q), y: lerp(a1.y, b1.y, q)};
      nodes[`${P}-tethers`] = {opacity: r(q > 0.02 ? 1 : 0, 3), d: `M${r(a1.x)} ${r(a1.y)}L${r(e1.x)} ${r(e1.y)}`};
    }
    if (o.zoneMark) nodes[`${P}-zmark`] = {opacity: r(clamp(st.zmark ?? 0) * (1 - clamp(st.zoom * 4)), 3)};
    if ((!o.noDetail || datum) && keepCap) {
      nodes[`${P}-cap`] = {opacity: r(clamp(st.cap), 3)};
      if (!datum && o.capFit) nodes[`${P}-cap-text`] = {opacity: r(tk, 3)};
      if (datum && datum.capFits) nodes[`${P}-cap-v-before`] = {opacity: r(clamp(st.cap), 3), transform: 'translate(0 0)'};
    }
    if (datum && datum.capFits && dm && keepCap) {
      const was = clamp(dm.move);
      const D = G.dock;
      const gs = o.Ft ? o.Ft * 0.32 : 7;
      const dx = D ? D.x + 10 + datum.wasFit.width + 8 - (G.capBox.x + 30 + gs) : 0;
      const dy = D ? D.y + 6 - (G.capBox.y + 7) : 0;
      nodes[`${P}-cap-v-before`] = {opacity: r(clamp(st.cap) * clamp(dm.copy ?? 1), 3), transform: `translate(${r(dx * ease.inOutCubic(was))} ${r(dy * ease.inOutCubic(was))})`};
      nodes[`${P}-cap-v-after`] = {opacity: r(clamp(dm.newIn) * clamp(dm.copy ?? 1), 3), transform: 'translate(0 0)'};
      if (D && keepDock) { nodes[`${P}-dock`] = {opacity: r(clamp(dm.dockK ?? was) * clamp(dm.copy ?? 1), 3)}; nodes[`${P}-was`] = {opacity: r(clamp(dm.was ?? was) * clamp(dm.copy ?? 1), 3)}; }
    }
    if (o.pins !== false) R.speakers.forEach(sp => { if (keep(personBox(G.seats[sp.index]))) nodes[`${P}-pin${sp.index}`] = {opacity: r(clamp(st.pins ?? 0), 3)}; });
    // people: everybody keeps the same place at every u; the operator raises a hand towards the panel when supplied
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
    return {nodes, reached, hands, minDeg, hourDeg};
  }
  return {node: g({name: `${P}-room`}, parts), frame, rigs, clock};
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */

/**
 * Timing (u) of the action inside [t0, t1]: the operator signals (cause), the session clock slows down and stops, the
 * pause badge, the hand rises again and the recess card comes out, the connector, its caption, the floor rings.
 * @param {number} t0
 * @param {number} t1
 */
export function pzTiming(t0, t1) {
  const L = t1 - t0;
  const at = f => t0 + L * f;
  return {point: [at(0), at(0.1)], stop: [at(0.1), at(0.36)], pause: [at(0.36), at(0.44)], gesture: [at(0.46), at(0.51)], zoom: [at(0.51), at(0.7)], link: [at(0.71), at(0.79)], cap: [at(0.79), at(0.87)], pins: [at(0.88), at(0.98)], t0, t1};
}

/**
 * The session clock's progress (0..1) at u: it runs at a constant speed from u = 0, then slows down smoothly (no jump
 * in speed) and stops at the end of the stop window.
 */
export function runAt(TM, u, o = {}) {
  const s0 = TM.stop[0], s1 = TM.stop[1];
  if (o.never) {
    // (a session that stays active: the same constant speed, never stopping — scaled to the same speed)
    const v = 1 / (s0 + (s1 - s0) / 2);
    return u * v;
  }
  const v = 1 / (s0 + (s1 - s0) / 2);
  if (u <= s0) return u * v;
  const q = clamp((u - s0) / (s1 - s0));
  return clamp(s0 * v + v * (s1 - s0) * (q - q * q / 2));
}

/**
 * The stage at u.
 * @param {any} G pzGeometry()
 * @param {any} R resolvePz()
 * @param {any} TM pzTiming()
 * @param {number} u
 * @param {{noDetail?:boolean, noHands?:boolean}} [o]
 */
export function pzStageAt(G, R, TM, u, o = {}) {
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  const e = ease.inOutCubic;
  const run = runAt(TM, u, {never: o.noDetail});
  const stopped = !o.noDetail && u >= TM.stop[1];
  const clockState = o.noDetail ? 'running' : u < TM.stop[0] ? 'running' : stopped ? 'stopped' : 'slowing';
  const pause = o.noDetail ? 0 : e(pos(u, ...TM.pause));
  const zoom = o.noDetail ? 0 : pos(u, ...TM.zoom);
  const link = o.noDetail ? 0 : pos(u, ...TM.link);
  const cap = o.noDetail ? 0 : e(pos(u, ...TM.cap));
  const pins = o.noDetail ? 0 : e(pos(u, ...TM.pins));
  // the operator signals towards the panel (the cause) and lowers the hand once the clock has stopped; then raises it
  // again: the recess card comes out from the raised hand, and the hand lowers once the card has arrived
  const k1 = o.noDetail ? 0 : e(pos(u, ...TM.point)) * (1 - e(pos(u, TM.stop[1], TM.stop[1] + 0.04)));
  const k2 = o.noDetail ? 0 : e(pos(u, ...TM.gesture)) * (1 - e(pos(u, TM.zoom[1], TM.zoom[1] + 0.04)));
  const k = o.noHands ? 0 : Math.max(k1, k2);
  const reach = k > 0 ? {target: G.aim, k} : null;
  const cardState = o.noDetail ? 'none' : zoom <= 0 ? 'none' : zoom < 1 ? 'coming' : link < 1 ? 'connecting' : 'connected';
  return {run, clockState, pause, zoom, link, cap, pins, reach, k, cardState, gesture: o.noHands ? 0 : k2, point: o.noHands ? 0 : k1};
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its chips (design units)   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolvePz()
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {number} F label text size (design units)
 * @param {{scale?:number, chips?:boolean, text?:boolean, qGap?:number, align?:any, reserve?:(G:any)=>any[], dock?:{wasText:string, capTexts:{before:string, after:string}}|null, dockBeside?:boolean, lifted?:boolean, extraH?:number, chipMaxW?:number}} [o]
 */
export function composePz(ctx, P, R, box, F, o = {}) {
  const t = WALL;
  const sc = o.scale ?? 1;
  const ar = box.w / box.h;
  const withText = o.text !== false;
  const geoAt = (W, H, k) => {
    const Ft = F / k;
    // (plates wrap into at most three lines, or four without a lone short word on a line — item 13: the plate widens
    // instead; the first untruncated fit is the fallback)
    const lone = f => f.lines.length > 1 && f.lines.some(ln => ln.trim().split(/\s+/).length === 1 && ln.trim().length <= 4);
    const fitAt = (text, maxW) => {
      let f = null, first = null;
      for (const q of [1, 1.2, 1.35, 1.5, 1.7, 1.9, 2.2, 2.5, 2.8, 3.4, 4.2]) {
        f = fitG(text, {maxWidth: Math.max(maxW * q, Ft * 4), size: Ft, minSize: Ft, maxLines: 5, weight: 600});
        if (f.truncated) continue;
        if (!first) first = f;
        if (f.lines.length <= 3 || (f.lines.length === 4 && !lone(f))) return f;
      }
      return first || f;
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
    const G = pzGeometry(W, H, R, {tagFit, capFit, dockH, dockW, dockBeside: o.dockBeside, Ft: withText ? Ft : null, qGap: o.qGap, markR: o.marker ? (withText ? Ft * 2.6 : 60) : 0});
    G.Ft = withText ? Ft : null;
    G.tagFit = tagFit; G.capFit = capFit; G.capFits = capFits; G.wasFit = wasFit;
    return G;
  };
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
  const equip = [...pzObstacles(G, {lifted: o.lifted}), ...(o.reserve ? o.reserve(G) : [])].map(bD);
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

/** Legend rows: ● / ◆ (equal weight) and the kept positions. */
export function pzRows(R, P, prefix = 'lg', o = {}) {
  const rows = [];
  rows.push({kind: 'legend', glyphKind: 'started', text: P.states.active, name: `${prefix}-active`});
  if (!o.noDetail) {
    rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.recess, name: `${prefix}-recess`});
    rows.push({kind: 'legend', glyphKind: 'pos', text: P.labels.positions, name: `${prefix}-positions`});
  }
  return rows;
}

/** Panel row node: this motif's glyphs (kept position, session clock, recess card, panel), else the shared rows. */
export function pzRowNode(ctx, m, o = {}) {
  if (m.kind === 'legend' && ['pos', 'sclock', 'rcard', 'board'].includes(m.glyphKind)) {
    const th = ctx.theme;
    const s = m.glyph;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    if (m.glyphKind === 'pos') {
      const R0 = s * 0.38;
      const arc = a0d => { const a1 = ((a0d + 12) * Math.PI) / 180, a2 = ((a0d + 78) * Math.PI) / 180; return `M${r(Math.cos(a1) * R0)} ${r(Math.sin(a1) * R0)}A${r(R0)} ${r(R0)} 0 0 1 ${r(Math.cos(a2) * R0)} ${r(Math.sin(a2) * R0)}`; };
      glyph = g({transform: T(gx, gy)},
        h('circle', {r: r(s * 0.2), fill: '#8c96a0', stroke: INK, 'stroke-width': 1.4}),
        h('path', {d: [0, 90, 180, 270].map(arc).join(''), fill: 'none', stroke: th.accent2, 'stroke-width': 2.6, 'stroke-linecap': 'round'}));
    } else if (m.glyphKind === 'sclock') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.4), y: r(-s * 0.4), width: r(s * 0.8), height: r(s * 0.8), rx: r(s * 0.12), fill: '#3b4550', stroke: INK, 'stroke-width': 1.6}),
        h('circle', {r: r(s * 0.3), fill: '#ffffff', stroke: INK, 'stroke-width': 1.4}),
        h('path', {d: `M0 0V${r(-s * 0.22)}M0 0L${r(s * 0.14)} ${r(s * 0.06)}`, stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round'}));
    } else if (m.glyphKind === 'rcard') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.44), y: r(-s * 0.28), width: r(s * 0.88), height: r(s * 0.56), rx: 4, fill: '#ffffff', stroke: INK, 'stroke-width': 1.6}),
        h('path', {d: roundRectPath(-s * 0.08, -s * 0.18, s * 0.1, s * 0.36, 2) + roundRectPath(s * 0.1, -s * 0.18, s * 0.1, s * 0.36, 2), fill: th.accent2}),
        h('circle', {cx: r(-s * 0.26), cy: 0, r: r(s * 0.14), fill: '#f5f7fa', stroke: INK, 'stroke-width': 1.2}));
    } else {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.44), y: r(-s * 0.26), width: r(s * 0.88), height: r(s * 0.52), rx: 4, fill: '#e9edf1', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.18), width: r(s * 0.3), height: r(s * 0.36), rx: 3, fill: '#3b4550', stroke: INK, 'stroke-width': 1.2}),
        h('rect', {x: r(0), y: r(-s * 0.18), width: r(s * 0.36), height: r(s * 0.24), rx: 1.5, fill: '#ffffff', stroke: '#9aa4ae', 'stroke-width': 1.2}));
    }
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return rowNode(ctx, m, o);
}

export {legendGlyph};
