/**
 * "Interrogatorio directo" kit (LAW-0289..0292, hearings-03): a generic,
 * fictional hearing room drawn as a floor plan. A WITNESS sits in a witness
 * box in the upper right; a QUESTIONER (generic; no rank, role rules or
 * speaking order implied) stands beside the box's counter. On the counter
 * between them lies a small TURN TRAY. Along the top wall runs a TURN RAIL.
 *
 * The concrete action — "questions and answers advance one by one beside the
 * witness": for each turn in the configured sequence, whoever gives it (the
 * questioner for a question, the witness for an answer, as supplied) takes a
 * folded slip, sets it on the tray beside the witness; the slip slides up the
 * guide onto the rail's entry place and unfolds into a card; before the next
 * turn enters, every card on the rail ADVANCES one place along it. At the end
 * the rail shows the turns in the configured sequence (illustrative).
 *
 * Each turn carries its SUPPLIED form with an equal-weight solid cue:
 * ● "open question" or ◆ "bounded answer"; a turn whose form is not marked
 * carries a neutral cue (a "?" ring for a question, a lined ring for an
 * answer). Nothing is assessed: no examination rules (leading questions,
 * objections, admissibility), no credibility, weight or outcome; the two
 * forms are only supplied forms of a turn in this fictional example.
 *
 * Generic art comes from ./hearings-art.js and ../../courts/kits/courts-art.js;
 * text, chip placement and panel helpers from ./apertura-audiencia.js; memoised
 * fits, the question cue and hands from ./exposicion-inicial.js — all imported
 * READ-ONLY (nothing in those kits changes).
 * @module animations/hearings/kits/interrogatorio-directo
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {floorArea, wallRing, planChair, planPerson, planLectern, PERSON} from '../../courts/kits/courts-art.js';
import {hearingColors, stateGlyph, ovalTable, wallClock, exhibitBox, lowCabinet, plainDoor, paperSheet, facing, toWorld, reachRecords} from './hearings-art.js';
import {FONT, WALL, fitG, textAt, measureSpeakerChip, placeLabels, overlaps, mapper, mapBox, legendGlyph, rowNode, measureRow} from './apertura-audiencia.js';
import {fitM, measureRowM, questionCue, handOf, personBox, SLIP} from './exposicion-inicial.js';

export {fitM, measureRowM, personBox, SLIP, handOf, overlaps, legendGlyph};

const INK = '#1f2328';

/* ------------------------------------------------------------------ */
/* Fields, defaults                                                    */
/* ------------------------------------------------------------------ */

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: speakers, statements, exhibits, sequence). */
export const itFields = {
  hearing: obj('Generic, fictional hearing room', {room: str('Name of the room (fictional)', 60)}, ['room']),
  speakers: list('Participants (generic, fictional): one asks, one answers from the witness box, the others sit at the shared table. No rank, role rules or speaking order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 2, 4),
  questioner: int('Index in `speakers` of the participant who puts the questions (generic)', 0, 3),
  witness: int('Index in `speakers` of the participant in the witness box who gives the answers (generic)', 0, 3),
  statements: list('Turns, each a question or an answer with its supplied form. Nothing is assessed', obj('Turn', {
    kind: oneOf('question (given by the questioner) or answer (given by the witness)', ['question', 'answer']),
    text: str('Text of the turn (fictional)', 60),
    form: oneOf('Supplied form: "open" (open question, ●; questions only), "bounded" (bounded answer, ◆; answers only) or "plain" (form not marked) — supplied forms only, never an assessment', ['open', 'bounded', 'plain']),
    exhibit: int('Optional: index in `exhibits` this turn refers to (as supplied)', 0, 1),
  }, ['kind', 'text']), 1, 6),
  exhibits: list('Exhibits on the low cabinet by the wall, each with its supplied tag', str('Exhibit tag (fictional)', 50), 0, 2),
  sequence: list('Order in which the turns are given (indices in `statements`): a sequence as configured (illustrative), not a rule. Turns left out follow in list order', int('Index in `statements`', 0, 5), 1, 6),
  states: obj('Captions of the two supplied forms of a turn', {
    open: str('Caption of ● (open question, as supplied)', 50),
    bounded: str('Caption of ◆ (bounded answer, as supplied)', 50),
  }, ['open', 'bounded']),
  labels: obj('Editable captions', {
    question: str('Caption of a question whose form is not marked', 50),
    answer: str('Caption of an answer whose form is not marked', 50),
    sequence: str('Caption of the order of the turns (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['question', 'answer', 'sequence', 'key']),
};

export const IT_EN = {
  hearing: {room: 'Hearing room 3 (fictional)'},
  speakers: [{label: 'Questioner (fictional)'}, {label: 'Witness (fictional)'}, {label: 'Participant C'}],
  questioner: 0,
  witness: 1,
  statements: [
    {kind: 'question', text: 'What did you see that morning?', form: 'open'},
    {kind: 'answer', text: 'A grey van at the gate', form: 'bounded'},
    {kind: 'question', text: 'Where were you standing?', form: 'plain'},
    {kind: 'answer', text: 'By the side door', form: 'plain', exhibit: 0},
  ],
  exhibits: ['Exhibit 1: site plan'],
  sequence: [0, 1, 2, 3],
  states: {open: 'Open question', bounded: 'Bounded answer'},
  labels: {question: 'Question (as supplied)', answer: 'Answer (as supplied)', sequence: 'Turns on the rail: sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const IT_ES = {
  hearing: {room: 'Sala de audiencias 3 (ficticia)'},
  speakers: [{label: 'Persona que pregunta (ficticia)'}, {label: 'Testigo (ficticio)'}, {label: 'Participante C'}],
  questioner: 0,
  witness: 1,
  statements: [
    {kind: 'question', text: '¿Qué vio aquella mañana?', form: 'open'},
    {kind: 'answer', text: 'Una furgoneta gris en la verja', form: 'bounded'},
    {kind: 'question', text: '¿Dónde se encontraba?', form: 'plain'},
    {kind: 'answer', text: 'Junto a la puerta lateral', form: 'plain', exhibit: 0},
  ],
  exhibits: ['Prueba 1: plano del lugar'],
  sequence: [0, 1, 2, 3],
  states: {open: 'Pregunta abierta', bounded: 'Respuesta delimitada'},
  labels: {question: 'Pregunta (según lo aportado)', answer: 'Respuesta (según lo aportado)', sequence: 'Turnos en el riel: secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

/* ------------------------------------------------------------------ */
/* Resolved params                                                     */
/* ------------------------------------------------------------------ */

const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];

/** The form a turn can carry: ● open (questions), ◆ bounded (answers), else plain. */
export const formOf = (kind, form) => (kind === 'question' && form === 'open' ? 'open' : kind === 'answer' && form === 'bounded' ? 'bounded' : 'plain');

/**
 * Participants with their look; questioner, witness and the seated participants; the turns with their supplied form
 * (and who gives each), the exhibit a turn refers to and the configured order.
 * @param {any} ctx
 * @param {any} P localised params
 */
export function resolveIt(ctx, P) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  const questioner = P.questioner < n ? P.questioner : 0;
  let witness = P.witness < n ? P.witness : 1;
  if (witness === questioner) witness = (questioner + 1) % n;
  const listeners = speakers.map(s => s.index).filter(i => i !== questioner && i !== witness);
  const exhibits = (P.exhibits || []).slice(0, 2);
  const items = (P.statements || []).map((s, i) => {
    const kind = s.kind === 'answer' ? 'answer' : 'question';
    const ex = exhibits.length && s.exhibit !== undefined && s.exhibit !== null ? Math.min(exhibits.length - 1, s.exhibit) : null;
    return {i, kind, text: s.text, form: formOf(kind, s.form), exhibit: ex, by: kind === 'question' ? questioner : witness};
  });
  const order = [];
  for (const q of P.sequence || []) if (q < items.length && !order.includes(q)) order.push(q);
  for (let i = 0; i < items.length; i++) if (!order.includes(i)) order.push(i);
  const rank = items.map(it => order.indexOf(it.i));
  return {n, speakers, questioner, witness, listeners, items, order, rank, exhibits};
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/**
 * One turn card's content at template text size Ft and a maximum card width: the cue at the left, the supplied text
 * beside it, an exhibit number tag at the right when the turn refers to one. Without text (labels hidden) the card is
 * a plain sheet with ruled lines. `stateTexts` (inspect) adds the supplied form as the card's last line (both values
 * fitted at the card's own width).
 */
export function measureTurn(it, Ft, maxW, o = {}) {
  const gS = Ft * 0.36;
  const padX = Ft * 0.55, padY = Ft * 0.45;
  const glyphW = gS * 2.6 + Ft * 0.4;
  // (`noExTag`: numbered cards without the exhibit tag — the contrast's narrow rooms)
  const exW = it.exhibit !== null && o.text && !o.noExTag ? Ft * 1.7 : 0;
  if (!o.text) return {w: 104, h: 76, padX: 12, padY: 12, gS: 9, glyphW: 30, exW: 0, fit: null, stateFit: null, truncated: false};
  const inner = Math.max(40, maxW - padX * 2 - glyphW - exW);
  const fit = fitM(o.label ? o.label(it) : it.text, {maxWidth: inner, size: Ft, minSize: Ft, maxLines: 7, weight: o.label ? 700 : 600});
  let stateFit = null, stateFits = null;
  if (o.stateTexts) {
    const so = {maxWidth: inner, size: Ft, minSize: Ft, maxLines: 7, weight: 700};
    stateFits = {before: fitM(o.stateTexts.before, so), after: fitM(o.stateTexts.after, so)};
    stateFit = {...stateFits.before, width: Math.max(stateFits.before.width, stateFits.after.width), height: Math.max(stateFits.before.height, stateFits.after.height)};
  }
  const textW = Math.max(fit.width, stateFit ? stateFit.width : 0);
  const textH = fit.height + (stateFit ? stateFit.height + Ft * 0.55 : 0);
  return {w: padX * 2 + glyphW + textW + exW, h: Math.max(textH, gS * 2.6) + padY * 2, padX, padY, gS, glyphW, exW, fit, stateFit, stateFits, truncated: fit.truncated || (stateFits ? stateFits.before.truncated || stateFits.after.truncated : false)};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

const RAIL_X0 = 26;
/** Seats of the other participants around the shared table (angles, 90 = below the table). */
const LISTEN_ANGLES = {0: [], 1: [90], 2: [124, 56]};
/** Tray size, offsets of the questioner and the witness from the tray (reach ≤ 74 from each right shoulder). */
export const TRAY = {w: 54, h: 44};
const Q_OFF = {x: -76, y: -30};
const W_OFF = {x: 76, y: 30};

/**
 * Geometry of the room. Interior origin = top-left of the floor. The turn rail runs along the top wall; the entry
 * place (where each new card arrives) is its right end, right above the tray; the witness box stands under the rail's
 * right end; the questioner beside the box's counter; the lectern below the questioner; the shared table of the other
 * participants in the lower floor; the exhibit cabinet against the right wall below the witness box.
 * @param {number} W
 * @param {number} H
 * @param {any} R resolveIt()
 * @param {(maxW:number)=>Array<any>} cardsFor measured cards (index = item index) for a maximum card width
 * @param {any} [o]
 */
export function itGeometry(W, H, R, cardsFor, o = {}) {
  const t = WALL;
  const ne = R.exhibits.length;
  const exS = o.exS ?? 54;
  const cw = exS + 24, step = exS * 0.74 + 30;
  const m = R.items.length;
  const gapC = 16;
  const x0 = RAIL_X0;
  const railEnd = W - 26;
  const avail = railEnd - x0 - gapC * (m + 1);
  const cards = cardsFor(Math.max(60, avail / Math.max(1, m)));
  const cwMax = Math.max(...cards.map(c => c.w));
  const maxH = Math.max(...cards.map(c => c.h));
  const pitch = cwMax + gapC;
  // the entry place: the rail's right end (but never further right than the witness box allows)
  // (`rightFloor`: free floor right of the witness box, for the witness's label)
  const rf = o.rightFloor || 0;
  const ex = Math.min(W - 200 - rf, railEnd - gapC - cwMax / 2);
  const ledge = {x: x0, y: 8, w: railEnd - x0, h: maxH + 24};
  const yF = ledge.y + ledge.h;
  const slots = [];
  R.items.forEach(it => {
    const c = cards[it.i];
    const cx = ex - (m - 1 - R.rank[it.i]) * pitch;
    slots[it.i] = {x: cx - c.w / 2, y: yF - 10 - c.h, w: c.w, h: c.h, cx, bottom: yF - 10};
  });
  const leftmost = ex - (m - 1) * pitch - cwMax / 2;
  // the tray on the witness box's counter; the questioner and the witness on either side of it
  const tray = {cx: ex, cy: yF + 86 + (o.trayDrop || 0), ...TRAY};
  // (mechanism: `qShift` stands the questioner back from the counter, leaving floor for a link between them)
  const qShift = o.qShift === 'auto' ? clamp(W * 0.24, 230, 320) : (o.qShift || 0);
  // (`qDrop`, mechanism without hands: the questioner and the lectern stand lower, leaving floor under the rail)
  const qHome = {x: tray.cx + Q_OFF.x - qShift, y: tray.cy + Q_OFF.y + (o.qDrop || 0)};
  const wSeat = {x: tray.cx + W_OFF.x, y: tray.cy + W_OFF.y, deg: -90};
  const counter = {x: tray.cx - 36, y: tray.cy - 30, w: 84, h: 94};
  const wbox = {x: tray.cx + 22, y: tray.cy - 50, w: 150, h: 170};
  // the witness's own answer slips lie on the counter, right below the tray
  const wStack = {x: tray.cx + 22, y: tray.cy + 40};
  const lectern = {cx: qHome.x, cy: qHome.y + 76, s: 60};
  const qStack = {x: lectern.cx + 10, y: lectern.cy - 8};
  // the guide from the tray up to the rail's entry place
  const guide = {x: ex, y0: tray.cy - TRAY.h / 2, y1: yF - 4};
  // exhibits: a low cabinet against the right wall under the witness box
  // (tall rooms: the cabinet stands halfway down the free wall between the box and the door)
  const cabH = ne * step + 14;
  const cab = ne ? {x: W - 10 - cw, y: Math.max(wbox.y + wbox.h + 24, (wbox.y + wbox.h + H - 30 - cabH) / 2), w: cw, h: cabH} : null;
  const exhibits = ne ? R.exhibits.map((_, i) => ({cx: cab.x + cw / 2, cy: cab.y + 7 + step / 2 + i * step, deg: i % 2 ? 3 : -3, s: exS})) : [];
  // the other participants: a shared table in the lower floor, left of the cabinet
  const nL = R.listeners.length;
  const B = 54;
  const clusterBottom = Math.max(lectern.cy + lectern.s * 0.35, wbox.y + wbox.h);
  // BESIDE: when the floor left of the questioner is free (wide rooms), the shared table stands there, level with the
  // witness box (two participants at its ends, one below it); otherwise BELOW the box, centred in the free floor
  const qLeft = Math.min(qHome.x - PERSON.half, lectern.cx - lectern.s / 2) - 150;
  const sideAngles = {0: [], 1: [90], 2: [180, 0]};
  const Aside = 105;
  const sideW = nL === 2 ? 2 * Aside + 2 * (30 + PERSON.half + 12) : 2 * Aside + 40;
  const beside = nL > 0 && !o.noBeside && x0 + 20 + sideW <= qLeft;
  const A = beside ? Aside : Math.max(110, nL * 70 + 30);
  const angles = beside ? sideAngles[nL] : LISTEN_ANGLES[nL];
  // (below: the door's swing and the cabinet keep the right part of the lower floor)
  const rightEdge = W - 200;
  let C;
  if (beside) {
    const gH = nL === 2 ? 2 * B + 30 : 2 * B + 46 + PERSON.half + 22;
    // (`besideDrop`, inspect: the table stands lower, leaving the floor in front of the rail free)
    const yTop = yF + 26 + (o.besideDrop || 0);
    C = {x: (x0 + 20 + qLeft) / 2, y: Math.max(yTop + B, (yTop + Math.max(clusterBottom, H - 110)) / 2 - gH / 2 + B)};
  } else {
    const top = clusterBottom + 34;
    const groupH = 2 * B + 46 + PERSON.half + 22;
    // (`tableLeft`, mechanism: the table keeps to the left, leaving the floor under the witness box for its label)
    C = {x: o.tableLeft ? 132 + A : Math.max(132 + A, Math.min((132 + rightEdge) / 2, rightEdge - A - 40)), y: Math.max(top + B, (top + H - 30) / 2 - groupH / 2 + B)};
  }
  const seats = [];
  R.listeners.forEach((pi, j) => {
    const ang = angles[j];
    const th = (ang * Math.PI) / 180;
    const sx = C.x + Math.cos(th) * (A + (beside && (ang === 0 || ang === 180) ? 30 : 38)), sy = C.y + Math.sin(th) * (B + 46);
    seats[pi] = {x: sx, y: sy, deg: facing({x: sx, y: sy}, C), angle: ang};
  });
  seats[R.witness] = {...wSeat, angle: 0};
  const groupBottom = nL ? Math.max(C.y + B + 16, ...R.listeners.map(pi => seats[pi].y + PERSON.half + 22)) : 0;
  const groupNeed = !nL ? 0 : beside ? Math.max(groupBottom - (C.y - (yF + 26 + (o.besideDrop || 0) + B)), 0) : (clusterBottom + 34 + 2 * B + 46 + PERSON.half + 22 + 16);
  // the wall clock (support) on the left wall's lower corner; the door in the bottom wall, left of the cabinet
  const clock = {cx: 48, cy: H - 52, R: 28};
  const door = {a: W - (cab ? cw + 10 : 10) - 100, b: W - (cab ? cw + 10 : 10) - 22};
  const needH = Math.max(groupNeed + 34, cab ? wbox.y + wbox.h + 24 + cab.h + 30 : 0, wbox.y + wbox.h + 96, lectern.cy + lectern.s * 0.35 + 96);
  const needW = Math.max(x0 + gapC + (m - 1) * pitch + cwMax / 2 + Math.max(200 + rf, gapC + 26 + cwMax / 2), x0 + 30 + PERSON.half + 10 - Q_OFF.x + qShift + 200 + rf, nL && !beside ? 2 * A + 372 : 0);
  const problems = [];
  if (leftmost < x0 + gapC - 0.5) problems.push('rail-width');
  if (cards.some(c => c.truncated)) problems.push('card-text');
  if (needH > H + 0.5) problems.push('room-height');
  if (needW > W + 0.5) problems.push('room-width');
  if (nL && R.listeners.some(pi => Math.hypot(seats[pi].x - clock.cx, seats[pi].y - clock.cy) < PERSON.half + clock.R + 12)) problems.push('seat-clock');
  if (nL && !beside && R.listeners.some(pi => seats[pi].x + PERSON.half + 10 > rightEdge + 30)) problems.push('seat-door');
  return {
    W, H, t, clock, cab, exhibits, ledge, yF, slots, cards, pitch, ex, tray, qHome, wSeat, counter, wbox, wStack, lectern, qStack, guide, C, A, B, seats, door, beside,
    needW, needH,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t},
    problems,
  };
}

/** Obstacles of the room (template units) for label placement. */
export function itObstacles(G, o = {}) {
  // (`lifted`: the clock and the cabinet have been lifted out of the room — their homes are free floor)
  const out = [
    {x: G.ledge.x - 6, y: 0, w: G.ledge.w + 12, h: G.ledge.h + 14},
    o.lifted ? null : {x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R - 6, w: 2 * G.clock.R + 12, h: 2 * G.clock.R + 12},
    {x: G.lectern.cx - 40, y: G.lectern.cy - 30, w: 80, h: 60},
    {x: G.counter.x - 6, y: G.counter.y - 6, w: G.counter.w + 12, h: G.counter.h + 12},
    // the witness box's three low walls (the floor inside is the witness's own place)
    {x: G.wbox.x - 6, y: G.wbox.y - 12, w: G.wbox.w + 12, h: 24},
    {x: G.wbox.x + G.wbox.w - 12, y: G.wbox.y - 6, w: 24, h: G.wbox.h + 12},
    {x: G.wbox.x - 6, y: G.wbox.y + G.wbox.h - 12, w: G.wbox.w + 12, h: 24},
    // the guide up to the rail (slips slide along it)
    {x: G.guide.x - SLIP.w / 2 - 8, y: G.guide.y1, w: SLIP.w + 16, h: G.guide.y0 - G.guide.y1 + 8},
  ];
  if (G.cab && !o.lifted) out.push({x: G.cab.x - 8, y: G.cab.y - 8, w: G.cab.w + 16, h: G.cab.h + 16});
  return out.filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Cues                                                                */
/* ------------------------------------------------------------------ */

/** Neutral answer cue: a ring with two short lines (not part of the compared pair; no text node). */
export function answerCue(ctx, name, cx, cy, s) {
  const q = s * 0.62;
  return g({name},
    h('circle', {cx: r(cx), cy: r(cy), r: r(s * 1.25), fill: '#ffffff', stroke: INK, 'stroke-width': r(Math.max(2, s * 0.2), 2)}),
    h('path', {d: `M${r(cx - q * 0.9)} ${r(cy - q * 0.36)}H${r(cx + q * 0.9)}M${r(cx - q * 0.9)} ${r(cy + q * 0.42)}H${r(cx + q * 0.4)}`, stroke: INK, 'stroke-width': r(Math.max(2.4, s * 0.26), 2), 'stroke-linecap': 'round'}));
}

/** ● (open question), ◆ (bounded answer) — equal ink — or the neutral cue of a plain question / answer. */
export function turnCue(ctx, form, kind, N, gx, gy, s, size) {
  if (form === 'open') return stateGlyph(ctx, {name: `${N}-g-open`, kind: 'dot', cx: gx, cy: gy, s});
  if (form === 'bounded') return stateGlyph(ctx, {name: `${N}-g-bounded`, kind: 'diamond', cx: gx, cy: gy, s});
  return kind === 'question' ? questionCue(ctx, `${N}-g-plain`, gx, gy, s, size) : answerCue(ctx, `${N}-g-plain`, gx, gy, s);
}

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G itGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, keep?:(b:any)=>boolean, lift?:boolean, datum?:any, slipCue?:any}} o
 */
export function itRoom(ctx, G, o) {
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
    {side: 'left', a: H * 0.36, b: H * 0.52, kind: 'window'},
  ]}));
  const door = plainDoor(ctx, {name: `${P}-door`, hinge: {x: G.door.b, y: H + t / 2}, width: G.door.b - G.door.a, closedDeg: 180, openDeg: 80});
  parts.push(door.node);
  const clock = wallClock(ctx, {name: `${P}-clock`, cx: G.clock.cx, cy: G.clock.cy, R: G.clock.R});
  if (keep(clock.box)) parts.push(wrapLift('clock', clock.node));
  // the turn rail along the top wall, with its groove
  const L = G.ledge;
  if (keep(L) || o.keep) {
    parts.push(wrapLift('rail', g({name: `${P}-rail`},
      h('path', {d: roundRectPath(L.x + 4, L.y + 7, L.w, L.h, 8), fill: ctx.theme.shadow}),
      h('path', {d: roundRectPath(L.x, L.y, L.w, L.h, 8), fill: c.wood, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M${r(L.x + 8)} ${r(L.y + L.h - 6)}H${r(L.x + L.w - 8)}`, stroke: c.woodEdge, 'stroke-width': 3, 'stroke-linecap': 'round'}))));
  }
  // the guide from the tray to the rail's entry place (a shallow groove)
  const gd = G.guide;
  const guideBox = {x: gd.x - 14, y: gd.y1, w: 28, h: gd.y0 - gd.y1};
  if (keep(guideBox)) parts.push(wrapLift('box', g({name: `${P}-guide`},
    h('path', {d: roundRectPath(gd.x - 11, gd.y1, 22, gd.y0 - gd.y1 + 4, 5), fill: shade(c.wood, 0.25), stroke: INK, 'stroke-width': 1.6, opacity: 0.9}))));
  // the witness box (low wall on three sides) and its counter with the tray
  const wb = G.wbox, cn = G.counter;
  const boxAll = {x: cn.x, y: wb.y, w: wb.x + wb.w - cn.x, h: wb.h};
  if (keep(boxAll)) {
    parts.push(wrapLift('wbox', g({name: `${P}-wbox`},
      h('path', {d: `M${r(wb.x)} ${r(wb.y)}H${r(wb.x + wb.w)}V${r(wb.y + wb.h)}H${r(wb.x)}`, fill: 'none', stroke: c.cabinet, 'stroke-width': 12, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(wb.x)} ${r(wb.y)}H${r(wb.x + wb.w)}V${r(wb.y + wb.h)}H${r(wb.x)}`, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', opacity: 0.55}),
      h('path', {d: roundRectPath(cn.x + 3, cn.y + 5, cn.w, cn.h, 8), fill: ctx.theme.shadow}),
      h('path', {name: `${P}-counter`, d: roundRectPath(cn.x, cn.y, cn.w, cn.h, 8), fill: c.wood, stroke: INK, 'stroke-width': 2.2}),
      g({name: `${P}-tray`, transform: T(G.tray.cx, G.tray.cy)},
        h('path', {d: roundRectPath(-TRAY.w / 2, -TRAY.h / 2, TRAY.w, TRAY.h, 6), fill: c.tray, stroke: INK, 'stroke-width': 2}),
        h('path', {d: roundRectPath(-TRAY.w / 2 + 5, -TRAY.h / 2 + 5, TRAY.w - 10, TRAY.h - 10, 4), fill: shade(c.tray, 0.28)})))));
    parts.push(planChair(ctx, {name: `${P}-wchair`, cx: toWorld(G.wSeat, {x: 0, y: 14}).x, cy: toWorld(G.wSeat, {x: 0, y: 14}).y, deg: G.wSeat.deg, s: 64}));
  }
  // cabinet and exhibits
  if (G.cab && keep(G.cab)) {
    const badge = (e, i) => (o.Ft ? g({name: `${P}-exnum${i}`},
      h('circle', {cx: r(e.cx), cy: r(e.cy), r: r(o.Ft * 0.78), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
      h('text', {x: r(e.cx), y: r(e.cy + o.Ft * 0.36), 'font-family': FONT, 'font-size': r(o.Ft, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(i + 1))) : null);
    parts.push(wrapLift('cab', g({name: `${P}-cab`}, lowCabinet(ctx, {name: `${P}-cabinet`, ...G.cab}),
      G.exhibits.map((e, i) => g(null, exhibitBox(ctx, {name: `${P}-exhibit${i}`, cx: e.cx, cy: e.cy, s: e.s, deg: e.deg}), badge(e, i))))));
  }
  // lectern
  const lecBox = {x: G.lectern.cx - G.lectern.s / 2, y: G.lectern.cy - G.lectern.s * 0.35, w: G.lectern.s, h: G.lectern.s * 0.7};
  if (keep(lecBox)) parts.push(wrapLift('lectern', g({name: `${P}-lectern`}, planLectern(ctx, {name: `${P}-lectern-top`, cx: G.lectern.cx, cy: G.lectern.cy, s: G.lectern.s, deg: 180}))));
  // the shared table and its chairs
  if (R.listeners.length) {
    const tb = {x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2};
    if (keep(tb)) parts.push(ovalTable(ctx, {name: `${P}-table`, cx: G.C.x, cy: G.C.y, a: G.A, b: G.B, seedKey: 'turns'}));
    R.listeners.forEach(i => { const s = G.seats[i]; if (keep(personBox(s))) parts.push(planChair(ctx, {name: `${P}-chair${i}`, cx: toWorld(s, {x: 0, y: 14}).x, cy: toWorld(s, {x: 0, y: 14}).y, deg: s.deg, s: 64})); });
  }
  // cards (each: a body, its cue, its text and its exhibit tag; it arrives at the entry place and advances along)
  let datumInfo = null;
  const cards = R.items.map(it => {
    const s = G.slots[it.i], m = G.cards[it.i];
    if (!keep({x: s.x, y: s.y, w: s.w, h: s.h})) return null;
    const N = `${P}-card${it.i}`;
    const gx = s.x + m.padX + m.gS * 1.3;
    const lineY = s.y + m.padY;
    const gy = m.fit ? lineY + m.fit.size * 0.55 : s.y + s.h / 2;
    const tx = s.x + m.padX + m.glyphW;
    let cue;
    if (o.datum && o.datum.i === it.i) {
      cue = g({name: `${N}-cue`}, ['before', 'after'].map(k => g({name: `${N}-g-${k}`, opacity: k === 'before' ? 1 : 0}, turnCue(ctx, o.datum[k], it.kind, `${N}-${k}`, gx, gy, m.gS, m.fit ? m.fit.size : 20))));
    } else cue = g({name: `${N}-cue`}, turnCue(ctx, it.form, it.kind, N, gx, gy, m.gS, m.fit ? m.fit.size : 20));
    const ruled = [];
    if (!m.fit) for (let q = 0; q < 3; q++) ruled.push(`M${r(s.x + m.glyphW + 8)} ${r(s.y + 22 + q * 16)}H${r(s.x + s.w - 12 - (q === 2 ? 22 : 0))}`);
    // the exhibit this turn refers to (as supplied): a small numbered tag at the card's right
    const exTag = m.exW && it.exhibit !== null ? g({name: `${N}-ex`},
      h('path', {d: roundRectPath(s.x + s.w - m.padX - m.exW * 0.78, gy - m.exW * 0.36, m.exW * 0.78, m.exW * 0.72, 3), fill: c.box, stroke: INK, 'stroke-width': 1.6}),
      h('text', {x: r(s.x + s.w - m.padX - m.exW * 0.39), y: r(gy + m.fit.size * 0.34), 'font-family': FONT, 'font-size': r(m.fit.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(it.exhibit + 1))) : null;
    let stateNode = null;
    if (m.stateFit && o.datum && o.datum.i === it.i) {
      const D = o.datum.dock;
      datumInfo = {...o.datum, tx, ty: s.y + m.padY + m.fit.height + m.fit.size * 0.55};
      // (a stacked dock: "was" above the old value, no wider than the card)
      datumInfo.dx = D.x + D.padX + (D.stack ? 0 : D.wasW + D.gap) - tx;
      datumInfo.dy = D.y + D.padY + (D.stack ? D.wasFit.height + D.gap : 0) - datumInfo.ty;
      stateNode = datumNodes(ctx, N, datumInfo, tx, datumInfo.ty);
    }
    return {i: it.i, N, s, m, node: g({name: N, transform: 'translate(0 0) scale(1)', opacity: 0},
      h('path', {d: roundRectPath(s.x + 3, s.y + 5, s.w, s.h, 6), fill: ctx.theme.shadow}),
      h('path', {name: `${N}-body`, d: roundRectPath(s.x, s.y, s.w, s.h, 6), fill: c.paper, stroke: INK, 'stroke-width': 2.2}),
      ruled.length ? h('path', {d: ruled.join(''), stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}) : null,
      cue,
      exTag,
      stateNode,
      m.fit ? g({name: `${N}-text`, opacity: 0}, textAt(m.fit, tx, lineY, INK)) : null)};
  });
  parts.push(wrapLift('cards', cards.filter(Boolean).map(cd => cd.node)));
  // people (questioner standing; witness and the others seated)
  const keepMovers = o.keep ? false : true;
  const rigs = R.speakers.map(sp => {
    if (sp.index === R.questioner) return keepMovers ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null;
    return keep(personBox(G.seats[sp.index])) ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null;
  });
  parts.push(rigs.filter(Boolean).map(rg => rg.node));
  // slips (above the people: one may be in a hand)
  const cueOf = i => (o.slipCue && o.slipCue.i === i ? g({name: `${P}-slipcue${i}`, opacity: 0},
    h('circle', {cx: 0, cy: 0, r: 15, fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
    stateGlyph(ctx, {name: `${P}-slipcue${i}-g`, kind: o.slipCue.kind, cx: 0, cy: 0, s: 7.5})) : null);
  const slips = R.items.map(it => (o.keep ? null : {i: it.i, node: paperSheet(ctx, {name: `${P}-slip${it.i}`, cx: 0, cy: 0, w: SLIP.w, h: SLIP.h, deg: 0})}));
  parts.push(slips.filter(Boolean).map(sl => g({name: `${P}-slipwrap${sl.i}`, transform: 'translate(0 0)', opacity: 0}, sl.node, cueOf(sl.i))));

  /**
   * @param {{clockDeg:number, q:any, w:any, cards:Array<any>, slips:Array<any>, textK?:number, datum?:any, lift?:any, slipCue?:number}} st
   */
  function frame(st) {
    const nodes = {};
    Object.assign(nodes, door.frame(0));
    if (keep(clock.box)) Object.assign(nodes, clock.frame(st.clockDeg));
    if (o.lift) for (const key of ['clock', 'rail', 'box', 'wbox', 'cab', 'cards', 'lectern']) {
      if (key === 'cab' && !G.cab) continue;
      const q = (st.lift && st.lift[key]) || null;
      nodes[`${P}-lift-${key}`] = {transform: q ? q.transform : 'translate(0 0)'};
    }
    if (G.cab && keep(G.cab) && o.Ft) G.exhibits.forEach((_, i) => { nodes[`${P}-exnum${i}`] = {opacity: r(st.textK ?? 1, 3)}; });
    cards.forEach(cd => {
      if (!cd) return;
      const cs = st.cards[cd.i] || {open: 1, text: 1, shown: 1, dx: 0};
      const op = clamp(cs.open);
      const s0 = Math.min(SLIP.w / cd.s.w, SLIP.h / cd.s.h);
      const sx = lerp(s0, 1, op);
      const ax = cd.s.cx, ay = cd.s.bottom;
      nodes[cd.N] = {transform: `translate(${r(ax - ax * sx + (cs.dx || 0))} ${r(ay - ay * sx)}) scale(${r(sx, 4)} ${r(sx, 4)})`, opacity: r(cs.shown && op > 0 ? 1 : 0, 3)};
      if (cd.m.fit) nodes[`${cd.N}-text`] = {opacity: r(clamp(cs.text) * (st.textK ?? 1), 3)};
      if (cd.m.exW) nodes[`${cd.N}-ex`] = {opacity: r(clamp(cs.text) * (st.textK ?? 1), 3)};
      if (datumInfo && datumInfo.i === cd.i) Object.assign(nodes, datumFrame(cd.N, datumInfo, st.datum));
      else if (o.datum && o.datum.i === cd.i) {
        const cue = st.datum ? clamp(st.datum.cue) : 0;
        nodes[`${cd.N}-g-before`] = {opacity: r(1 - cue, 3)};
        nodes[`${cd.N}-g-after`] = {opacity: r(cue, 3)};
      }
    });
    let reached = true;
    const hands = [];
    rigs.forEach((rg, i) => {
      if (!rg) return;
      let pose, rc = null, rl = null;
      if (i === R.questioner) { pose = st.q.pose; rc = st.q.reach; rl = st.q.reachL; }
      else if (i === R.witness) { pose = {...G.wSeat, seated: 1}; rc = st.w ? st.w.reach : null; }
      else { const s = G.seats[i]; pose = {x: s.x, y: s.y, deg: s.deg, seated: 1}; }
      Object.assign(nodes, rg.pose(pose));
      const rr = reachRecords({name: `${P}-p${i}`}, pose, rc ? rc.target : pose, {k: rc ? rc.k : 0});
      if (rc) Object.assign(nodes, rr.nodes);
      if (rc && !rr.reached && rc.k > 0) reached = false;
      if (rl) {
        const r2 = reachRecords({name: `${P}-p${i}`}, pose, rl.target, {k: rl.k, arm: 'armL'});
        Object.assign(nodes, r2.nodes);
        if (!r2.reached && rl.k > 0) reached = false;
      }
      hands[i] = rr.hand;
    });
    slips.forEach(sl => {
      if (!sl) return;
      const s = st.slips[sl.i];
      nodes[`${P}-slipwrap${sl.i}`] = s ? {transform: T(s.x, s.y, s.deg), opacity: r(s.opacity, 3)} : {transform: 'translate(0 0)', opacity: 0};
      if (o.slipCue && o.slipCue.i === sl.i) nodes[`${P}-slipcue${sl.i}`] = {opacity: r(clamp(st.slipCue ?? 0), 3)};
    });
    return {nodes, reached, hands};
  }
  return {node: g({name: `${P}-room`}, parts), frame, rigs, cards, clock};
}

/** Lighter / darker hex (local helper). */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => { const v = (n >> s) & 255; return Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)); };
  return `#${[16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/* ------------------------------------------------------------------ */
/* Datum overlay (inspect): the form line of the focus card            */
/* ------------------------------------------------------------------ */

function datumNodes(ctx, N, d, tx, ty) {
  const th = ctx.theme;
  const out = [];
  for (const st of ['before', 'after']) {
    const fit = d.fits[st];
    const strikes = st === 'before' ? fit.lines.map((ln, i) => h('line', {name: `${N}-strike${i}`, opacity: 0, x1: r(tx - 3), y1: r(ty + fit.size * 0.5 + i * fit.lineHeight), x2: r(tx - 3), y2: r(ty + fit.size * 0.5 + i * fit.lineHeight), stroke: INK, 'stroke-width': r(Math.max(2.5, fit.size * 0.1), 2), 'stroke-linecap': 'round'})) : [];
    const slip = st === 'before' ? h('path', {name: `${N}-dslip`, opacity: 0, d: roundRectPath(tx - 5, ty - 4, fit.width + 10, fit.height + 8, Math.min(fit.size * 0.5, (fit.height + 8) / 2)), fill: '#f3f4f5'}) : null;
    out.push(g({name: `${N}-v-${st}`, opacity: st === 'before' ? 1 : 0, transform: 'translate(0 0)'}, slip, textAt(fit, tx, ty, INK, {name: `${N}-v-${st}-text`}), strikes));
  }
  const D = d.dock;
  out.unshift(g({name: `${N}-dock`, opacity: 0}, h('path', {d: roundRectPath(D.x, D.y, D.w, D.h, Math.min(D.h / 2, d.fits.before.size * 0.7)), fill: '#f3f4f5', stroke: th.inkSoft, 'stroke-width': r(2.2 * d.fits.before.size / 20, 2)})));
  out.push(g({name: `${N}-was`, opacity: 0}, textAt(D.wasFit, D.x + D.padX, D.y + D.padY, '#57606a', {italic: true})));
  return g({name: `${N}-datum`}, out);
}

function datumFrame(N, d, dm0) {
  const dm = dm0 || {strike: 0, move: 0, chip: 0, was: 0, newIn: 0, cue: 0, copy: 1};
  const nodes = {};
  d.fits.before.lines.forEach((ln, i) => {
    const w = d.lineW[i];
    nodes[`${N}-strike${i}`] = {x2: r(d.tx - 3 + (w + 6) * clamp(dm.strike)), opacity: dm.strike > 0 ? 1 : 0};
  });
  nodes[`${N}-v-before`] = {opacity: r(clamp(dm.copy), 3), transform: `translate(${r(d.dx * clamp(dm.move))} ${r(d.dy * clamp(dm.move))})`};
  nodes[`${N}-v-after`] = {opacity: r(clamp(dm.newIn) * clamp(dm.copy), 3), transform: 'translate(0 0)'};
  nodes[`${N}-dslip`] = {opacity: r(clamp(dm.move * 12) * (1 - clamp((dm.move - 0.8) / 0.2)), 3)};
  nodes[`${N}-dock`] = {opacity: r(clamp(dm.chip) * clamp(dm.copy), 3)};
  nodes[`${N}-was`] = {opacity: r(clamp(dm.was) * clamp(dm.copy), 3)};
  nodes[`${N}-g-before`] = {opacity: r(1 - clamp(dm.cue), 3)};
  nodes[`${N}-g-after`] = {opacity: r(clamp(dm.cue), 3)};
  return nodes;
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its chips (design units)   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolveIt()
 * @param {{x:number,y:number,w:number,h:number}} box room box (design units)
 * @param {number} F label text size (design units)
 * @param {any} o
 */
export function composeIt(ctx, P, R, box, F, o = {}) {
  const t = WALL;
  const sc = o.scale ?? 1;
  const cardText = o.cardText !== false;
  let cardMaxD = o.cardMaxD ?? Math.min(360, Math.max(120, (box.w - 130) / Math.max(1, R.items.length)));
  const ar = box.w / box.h;
  const scaleFit = (f, q) => (f ? {...f, size: f.size * q, lineHeight: f.lineHeight * q, width: f.width * q, height: f.height * q} : f);
  const withState = o.stateLineFor !== undefined && o.stateLineFor !== null && cardText && o.stateTexts;
  const geoAt = (W, H, k) => {
    const Ft = F / k;
    const q = 1 / k;
    const cardsFor = maxW => R.items.map(item => {
      const mw = Math.round(Math.min(maxW * k, cardMaxD) / 2) * 2;
      const m = measureTurn(item, F, mw, {text: cardText, label: o.cardLabel, noExTag: o.noExTag, stateTexts: withState && item.i === o.stateLineFor ? o.stateTexts : null});
      if (!cardText) return m;
      return {...m, w: m.w * q, h: m.h * q, padX: m.padX * q, padY: m.padY * q, gS: m.gS * q, glyphW: m.glyphW * q, exW: m.exW * q, fit: scaleFit(m.fit, q), stateFit: scaleFit(m.stateFit, q), stateFits: m.stateFits ? {before: scaleFit(m.stateFits.before, q), after: scaleFit(m.stateFits.after, q)} : null};
    });
    const G = itGeometry(W, H, R, cardsFor, {...o, exS: cardText ? Math.max(54, Ft * 1.75) : 54});
    G.Ft = cardText ? Ft : null;
    const fc = withState ? G.cards[o.stateLineFor] : null;
    G.stateLine = fc && fc.stateFits ? {fits: fc.stateFits, maxFit: fc.stateFit} : null;
    return G;
  };
  let pick = null;
  const minW = (o.minW ?? 600) * sc;
  const tryW = W0 => {
    let k = box.w / (W0 + 2 * t);
    let G0 = geoAt(W0, 600, k);
    for (let it = 0; it < 3; it++) {
      const kh = box.h / (Math.max(G0.needH + (o.extraH || 0), 520 * sc) + 2 * t);
      const k2 = Math.min(box.w / (W0 + 2 * t), kh);
      if (Math.abs(k2 - k) < 0.002) break;
      k = k2;
      G0 = geoAt(W0, 600, k);
    }
    const bad = G0.problems.filter(q => q === 'rail-width' || q === 'card-text').length + (G0.needW > W0 + 1 ? 1 : 0);
    const cand = {W: W0, k, bad};
    if (!pick || (cand.bad < pick.bad) || (cand.bad === pick.bad && cand.k > pick.k + 1e-6)) pick = cand;
  };
  for (let W0 = minW; W0 <= 2800; W0 *= 1.16) tryW(W0);
  // (when the rail cannot hold the cards at any width, they wrap narrower — more lines, a deeper rail)
  for (const fct of [0.8, 0.64, 0.5]) {
    if (!pick.bad || o.cardMaxD) break;
    cardMaxD = Math.max(100, cardMaxD * fct);
    pick = null;
    for (let W0 = minW; W0 <= 2800; W0 *= 1.16) tryW(W0);
  }
  const W1 = pick.W;
  for (const f of [0.9, 0.94, 0.97, 1.03, 1.06, 1.1]) if (W1 * f >= minW * 0.9) tryW(W1 * f);
  let W = pick.W, k = pick.k;
  let G = geoAt(W, 600, k);
  let H = Math.max(G.needH + (o.extraH || 0), 520 * sc);
  if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
  k = Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t));
  G = geoAt(W, H, k);
  // (the final scale can differ from the searched one — the cards are measured at the text size — so the room widens
  // until its rail holds them, keeping the box's aspect)
  for (let it = 0; it < 8 && (G.problems.includes('rail-width') || G.problems.includes('room-width') || G.problems.includes('room-height')); it++) {
    W = Math.max(W * 1.05, G.needW + 1);
    H = Math.max(H, G.needH + 1, (W + 2 * t) / ar - 2 * t);
    if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t;
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
  const rad = PERSON.half * k;
  const posOf = i => (i === R.questioner ? G.qHome : G.seats[i]);
  const people = R.speakers.map(sp => ({...toD(posOf(sp.index)), rad: rad + 4}));
  const bounds = {x: ox + 10 * k, y: oy + 10 * k, w: (W - 20) * k, h: (H - 20) * k};
  const equip = [...itObstacles(G, {lifted: o.lifted}), ...(o.reserve ? o.reserve(G) : [])].map(bD);
  const ellipse = R.listeners.length ? {c: toD(G.C), a: G.A * k, b: G.B * k} : null;
  const chips = [];
  const chipMaxW = o.chipMaxW ?? 340;
  if (o.chips) {
    const widths = [chipMaxW, chipMaxW * 0.8, chipMaxW * 0.64, chipMaxW * 0.52, chipMaxW * 0.44];
    const vs = R.speakers.map(sp => widths.map(mw => measureSpeakerChip(sp, 0, F, mw, {seqDisc: false, maxLines: 4})).filter(m => !m.truncated));
    if (vs.some(v => !v.length)) problems.push('chip-truncated');
    const owners = R.speakers.map(sp => toD(posOf(sp.index)));
    const items = R.speakers.map(sp => {
      const i = sp.index;
      const pref = i === R.questioner ? 200 : i === R.witness ? 90 : G.seats[i].angle;
      // (the witness sits inside the walled box: its chip may stand a little further out, beyond the wall)
      return {key: `sp${i}`, i, variants: (vs[i].length ? vs[i] : [measureSpeakerChip(sp, 0, F, chipMaxW, {seqDisc: false, maxLines: 6})]).map(m => ({w: m.w, h: m.h, m})), at: toD(posOf(i)), rad, rim: rad * 0.84, prefer: pref, owners, ...(i === R.witness ? {maxGap: 96, gaps: [8, 16, 24, 36, 48, 56, 72, 84, 96]} : {maxGap: 56})};
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

/** Panel row node: the motif's own glyphs (plain question / answer cues, numbered turn card, witness box), else shared. */
export function itRowNode(ctx, m, o = {}) {
  if (m.kind === 'legend' && ['qplain', 'aplain', 'turncard', 'wbox', 'lectern'].includes(m.glyphKind)) {
    const th = ctx.theme;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    if (m.glyphKind === 'qplain') glyph = questionCue(ctx, null, gx, gy, m.glyph * 0.26, m.fit.size * 0.9);
    else if (m.glyphKind === 'aplain') glyph = answerCue(ctx, null, gx, gy, m.glyph * 0.26);
    else if (m.glyphKind === 'turncard') {
      const w = m.glyph * 0.9, hh = m.glyph * 0.8;
      glyph = g(null, h('path', {d: roundRectPath(gx - w / 2, gy - hh / 2, w, hh, 4), fill: hearingColors(ctx).paper, stroke: INK, 'stroke-width': 2}),
        h('text', {x: r(gx), y: r(gy + m.fit.size * 0.36), 'font-family': FONT, 'font-size': r(m.fit.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, m.seqNumber));
    } else if (m.glyphKind === 'lectern') glyph = g({transform: T(gx, gy)}, planLectern(ctx, {name: null, cx: 0, cy: 0, s: m.glyph * 0.8, deg: 180}));
    else {
      // witness box: low wall on three sides around a chair, with the counter and its tray
      const s = m.glyph * 0.42;
      const c = hearingColors(ctx);
      glyph = g(null,
        h('path', {d: `M${r(gx - s * 0.3)} ${r(gy - s)}H${r(gx + s)}V${r(gy + s)}H${r(gx - s * 0.3)}`, fill: 'none', stroke: c.cabinet, 'stroke-width': 5}),
        h('path', {d: roundRectPath(gx - s, gy - s * 0.7, s * 0.8, s * 1.4, 3), fill: c.wood, stroke: INK, 'stroke-width': 1.6}),
        h('path', {d: roundRectPath(gx - s * 0.86, gy - s * 0.3, s * 0.52, s * 0.6, 2), fill: c.tray, stroke: INK, 'stroke-width': 1.2}));
    }
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return rowNode(ctx, m, o);
}

/** Legend rows of the forms present (● / ◆ first, equal weight), then the neutral cues. */
export function formRows(R, P, prefix = 'lg') {
  const rows = [];
  if (R.items.some(it => it.form === 'open')) rows.push({kind: 'legend', glyphKind: 'started', text: P.states.open, name: `${prefix}-open`});
  if (R.items.some(it => it.form === 'bounded')) rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.bounded, name: `${prefix}-bounded`});
  if (R.items.some(it => it.form === 'plain' && it.kind === 'question')) rows.push({kind: 'legend', glyphKind: 'qplain', text: P.labels.question, name: `${prefix}-qplain`});
  if (R.items.some(it => it.form === 'plain' && it.kind === 'answer')) rows.push({kind: 'legend', glyphKind: 'aplain', text: P.labels.answer, name: `${prefix}-aplain`});
  return rows;
}

/* ------------------------------------------------------------------ */
/* Choreography: one schedule for the whole exchange                   */
/* ------------------------------------------------------------------ */

/** Where the questioner's left hand holds the stack of question slips (local frame, front-left of the chest). */
const HOLD = {x: -30, y: -38};

/**
 * Schedule (u) of the exchange between t0 and t1: the questioner lifts the question slips from the lectern with the
 * left hand and turns to the witness; then, turn by turn in the configured sequence, whoever gives the turn takes a
 * slip with the right hand (the questioner from the left hand, the witness from the stack on the counter), sets it on
 * the tray beside the witness; the slip slides up the guide to the rail's entry place and unfolds into the card; its
 * text arrives once it is open. Before each following turn reaches the rail, every card on the rail advances one place.
 * At the end the questioner turns back to the room.
 * @param {any} G
 * @param {any} R
 * @param {number} t0
 * @param {number} t1
 * @param {{waiting?:number}} [o] a turn not given (supplied final state)
 */
export function itSchedule(G, R, t0, t1, o = {}) {
  const waiting = o.waiting ?? -1;
  const seq = R.order.filter(i => i !== waiting);
  const anyQ = seq.some(i => R.items[i].kind === 'question');
  const B = {pick: anyQ ? 0.04 : 0, turn: 0.016, fetch: 0.018, carry: 0.022, set: 0.008, back: 0.014, slide: 0.03, open: 0.032, text: 0.026, adv: 0.024, end: 0.02};
  const per = B.fetch + B.carry + B.set + B.slide + B.open + B.text;
  const total = B.pick + B.turn + per * seq.length + B.end;
  const f = Math.min(1, (t1 - t0) / total);
  let u = t0;
  const pick = {a: u, b: u + B.pick * f}; u = pick.b;
  const turn = {a: u, b: u + B.turn * f}; u = turn.b;
  const items = {};
  seq.forEach((i, j) => {
    const it = {};
    it.by = R.items[i].by;
    it.fetch = [u, u + B.fetch * f]; u = it.fetch[1];
    it.carry = [u, u + B.carry * f]; u = it.carry[1];
    it.set = [u, u + B.set * f]; u = it.set[1];
    it.back = [u, u + B.back * f];
    it.slide = [u, u + B.slide * f]; u = it.slide[1];
    it.open = [u, u + B.open * f]; u = it.open[1];
    it.text = [u, u + B.text * f]; u = it.text[1];
    // the cards on the rail advance one place while the NEXT turn's slip is fetched and carried (done before it slides)
    it.adv = j > 0 ? [it.fetch[0], it.fetch[0] + Math.min(B.adv * f, it.slide[0] - it.fetch[0])] : null;
    it.rank = j;
    items[i] = it;
  });
  const end = {a: u, b: u + B.end * f}; u = end.b;
  return {pick, turn, end, items, seq, waiting, t0, t1: u, f, anyQ};
}

/**
 * The stage at u: the questioner's pose and hands, the witness's hand, every slip and card.
 * @param {any} G
 * @param {any} R
 * @param {any} S itSchedule()
 * @param {number} u
 */
export function itStageAt(G, R, S, u, o = {}) {
  const e = ease.inOutCubic;
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  // questioner: faces the room (180) at rest; turns to the witness (90) after lifting the slips; turns back at the end
  // (noHands, mechanism: the slips travel on their own from where they lie; nobody turns or reaches)
  const noHands = Boolean(o.noHands);
  let deg = 180;
  if (!noHands && u >= S.turn.a) deg = lerp(180, 90, e(pos(u, S.turn.a, S.turn.b)));
  if (!noHands && u >= S.end.a) deg = lerp(90, 180, e(pos(u, S.end.a, S.end.b)));
  const qPose = {x: G.qHome.x, y: G.qHome.y, deg, walk: 0, phase: 0, seated: 0};
  const wPose = {...G.wSeat, seated: 1};
  const holdW = toWorld(qPose, HOLD);
  const qStackW = {x: G.qStack.x, y: G.qStack.y};
  const qSeq = S.seq.filter(i => R.items[i].kind === 'question');
  const lastQCarry = qSeq.length ? S.items[qSeq[qSeq.length - 1]].carry[0] : S.pick.b;
  const qWaiting = S.waiting >= 0 && R.items[S.waiting].kind === 'question';
  // the left hand: reaches the slips on the lectern, holds them in front of the chest until the last question slip has
  // been taken (or keeps holding a question that is not given)
  let reachL = null;
  if (!noHands && S.anyQ && u >= S.pick.a) {
    const mid = (S.pick.a + S.pick.b) / 2;
    if (u < mid) reachL = {target: qStackW, k: e(pos(u, S.pick.a, mid))};
    else if (u < S.pick.b) { const q = e(pos(u, mid, S.pick.b)); reachL = {target: {x: lerp(qStackW.x, holdW.x, q), y: lerp(qStackW.y, holdW.y, q)}, k: 1}; }
    else if (qWaiting || u < lastQCarry) reachL = {target: holdW, k: 1};
    else reachL = {target: holdW, k: 1 - e(pos(u, lastQCarry, lastQCarry + 0.03))};
    if (reachL && reachL.k <= 0) reachL = null;
  }
  const trayT = {x: G.tray.cx, y: G.tray.cy};
  let qReach = null, wReach = null, inHand = null, active = null, carrier = null;
  for (const i of S.seq) {
    const it = S.items[i];
    const isQ = it.by === R.questioner;
    const src = noHands ? (isQ ? qStackW : {x: G.wStack.x, y: G.wStack.y}) : isQ ? holdW : {x: G.wStack.x, y: G.wStack.y};
    if (noHands) {
      if (u >= it.fetch[0] && u < it.text[1]) active = active ?? i;
      continue;
    }
    let rc = null;
    if (u >= it.fetch[0] && u < it.fetch[1]) { rc = {target: src, k: e(pos(u, ...it.fetch))}; active = i; }
    else if (u >= it.carry[0] && u < it.carry[1]) { const q = e(pos(u, ...it.carry)); rc = {target: {x: lerp(src.x, trayT.x, q), y: lerp(src.y, trayT.y, q)}, k: 1}; inHand = i; active = i; carrier = it.by; }
    else if (u >= it.set[0] && u < it.set[1]) { rc = {target: trayT, k: 1}; active = i; }
    else if (u >= it.back[0] && u < it.back[1]) { rc = {target: trayT, k: 1 - e(pos(u, ...it.back))}; active = active ?? i; }
    else if (u >= it.slide[0] && u < it.text[1]) active = active ?? i;
    if (rc) { if (isQ) qReach = rc; else wReach = rc; }
  }
  const handQ = handOf(qPose, qReach, 'armR');
  const handW = handOf(wPose, wReach, 'armR');
  const handL = handOf(qPose, reachL, 'armL');
  // how many advances have run (fractionally) since each turn entered the rail
  const advDone = j => S.seq.reduce((acc, i2) => { const it2 = S.items[i2]; return acc + (it2.rank > j && it2.adv ? e(pos(u, ...it2.adv)) : 0); }, 0);
  const m = R.items.length;
  const slips = [], cards = [], states = [];
  let qRank = 0, wRank = 0;
  for (const i of R.order) {
    const it = S.items[i];
    const item = R.items[i];
    const slot = G.slots[i];
    if (!it) {
      // a turn not given (supplied final state): its slip stays with whoever would give it
      if (item.kind === 'question') {
        const base = !noHands && u >= (S.pick.a + S.pick.b) / 2 && S.anyQ ? (u < S.pick.b ? {x: lerp(qStackW.x, holdW.x, e(pos(u, (S.pick.a + S.pick.b) / 2, S.pick.b))), y: lerp(qStackW.y, holdW.y, e(pos(u, (S.pick.a + S.pick.b) / 2, S.pick.b)))} : holdW) : qStackW;
        slips[i] = {x: base.x + qRank * 2, y: base.y - qRank * 2, deg: (!noHands && u >= S.pick.b ? qPose.deg : 180) + (qRank % 2 ? 4 : -3), opacity: 1};
        qRank++;
      } else { slips[i] = {x: G.wStack.x + wRank * 2, y: G.wStack.y - wRank * 2, deg: wRank % 2 ? 4 : -3, opacity: 1}; wRank++; }
      cards[i] = {open: 0, text: 0, shown: 0, dx: 0}; states[i] = 'stack';
      continue;
    }
    const open = e(pos(u, ...it.open));
    const text = pos(u, ...it.text);
    // rail position: the card enters at the entry place and advances one place per later turn
    const entryDx = (m - 1 - R.rank[i]) * G.pitch;
    const dx = entryDx - advDone(it.rank) * G.pitch;
    let st;
    if (noHands && u >= it.fetch[0] && u < it.slide[0]) {
      const src = item.kind === 'question' ? qStackW : {x: G.wStack.x, y: G.wStack.y};
      const q = e(pos(u, it.fetch[0], it.set[1]));
      st = q >= 1 ? 'tray' : 'carried';
      slips[i] = {x: lerp(src.x, trayT.x, q), y: lerp(src.y, trayT.y, q), deg: lerp(item.kind === 'question' ? 180 : 0, 360, q), opacity: 1};
      if (item.kind === 'question') qRank++; else wRank++;
      if (q < 1) { states[i] = st; cards[i] = {open: 0, text: 0, shown: 0, dx: (m - 1 - R.rank[i]) * G.pitch}; continue; }
    } else if (u < it.carry[0]) {
      st = 'stack';
      if (item.kind === 'question') {
        const inLeft = !noHands && S.anyQ && u >= (S.pick.a + S.pick.b) / 2;
        const base = inLeft ? (u < S.pick.b ? {x: lerp(qStackW.x, holdW.x, e(pos(u, (S.pick.a + S.pick.b) / 2, S.pick.b))), y: lerp(qStackW.y, holdW.y, e(pos(u, (S.pick.a + S.pick.b) / 2, S.pick.b)))} : holdW) : qStackW;
        slips[i] = {x: base.x + qRank * 2, y: base.y - qRank * 2, deg: (inLeft ? qPose.deg : 180) + (qRank % 2 ? 4 : -3), opacity: 1};
        qRank++;
      } else {
        slips[i] = {x: G.wStack.x + wRank * 2, y: G.wStack.y - wRank * 2, deg: wRank % 2 ? 4 : -3, opacity: 1};
        wRank++;
      }
    } else if (inHand === i) { st = 'carried'; const hd = it.by === R.questioner ? handQ : handW; slips[i] = {x: hd.x, y: hd.y, deg: it.by === R.questioner ? qPose.deg : wPose.deg, opacity: 1}; }
    else if (u < it.slide[0]) { st = 'tray'; slips[i] = {x: trayT.x, y: trayT.y, deg: 0, opacity: 1}; }
    else if (u < it.slide[1]) {
      st = 'sliding';
      const q = e(pos(u, ...it.slide));
      slips[i] = {x: trayT.x, y: lerp(trayT.y, slot.bottom - SLIP.h / 2, q), deg: 0, opacity: 1};
    } else if (open <= 0) { st = 'entered'; slips[i] = {x: slot.cx + dx, y: slot.bottom - SLIP.h / 2, deg: 0, opacity: 1}; }
    else { st = open < 1 ? 'unfolding' : 'open'; slips[i] = null; }
    states[i] = st;
    cards[i] = {open, text, shown: open > 0 ? 1 : 0, dx};
  }
  const hand = carrier === R.witness ? handW : handQ;
  return {q: {pose: qPose, reach: qReach, reachL}, w: {pose: wPose, reach: wReach}, slips, cards, states, held: inHand, active, carrier, hand, handQ, handW, handL};
}
