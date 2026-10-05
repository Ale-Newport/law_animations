/**
 * "Exposición inicial" kit (LAW-0285..0288, hearings-02): a generic, fictional
 * hearing room drawn as a floor plan. One participant (the one supplied as
 * `presenter`, no rank or speaking order implied) stands at a lectern; along
 * the top wall runs a long PRESENTATION TABLE. The presenter takes one folded
 * slip at a time from the lectern, walks along the table, sets the slip down
 * and UNFOLDS it into a card (a fact or a question, as supplied) — the
 * concrete action "a party lays out facts and questions beside their lectern".
 * The other participants sit at a shared table facing the presentation table.
 *
 * Each fact card carries its SUPPLIED state with an equal-weight solid cue:
 * ● "claim made" or ◆ "support supplied". A fact with support supplied is
 * linked by a thin solid line, along a lane behind the cards, to the exhibit
 * it refers to (as supplied) on the low cabinet by the wall. Nothing is
 * assessed: no proof, weight, burden, sufficiency or outcome is shown or
 * inferred; the two states are only supplied states of this fictional
 * example. Questions carry a neutral "?" cue. The order of the cards along
 * the table is a SEQUENCE AS CONFIGURED (illustrative), not a rule.
 *
 * The kit owns fields, defaults (en/es), the room geometry (template units),
 * the room builder (nodes + per-frame records), the presenter's choreography,
 * the composer (room fitted in a box + label chips) and the panel glyphs.
 * Generic art comes from ./hearings-art.js and ../../courts/kits/courts-art.js;
 * text, chip placement and panel helpers from ./apertura-audiencia.js — all
 * imported READ-ONLY (nothing in those kits changes).
 * @module animations/hearings/kits/exposicion-inicial
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {floorArea, wallRing, planChair, planPerson, planLectern, PERSON} from '../../courts/kits/courts-art.js';
import {
  hearingColors, stateGlyph, ovalTable, wallClock, exhibitBox, lowCabinet, plainDoor, paperSheet, facing, toWorld, reachRecords,
} from './hearings-art.js';
import {
  FONT, WALL, fitG, textAt, measureSpeakerChip, placeLabels, overlaps, mapper, mapBox, legendGlyph, rowNode, measureRow,
} from './apertura-audiencia.js';

const INK = '#1f2328';

/** Memoised text fits (layout searches fit the same texts at the same sizes many times; results are pure). */
const FIT_CACHE = new Map();
export function fitM(text, o) {
  const key = `${text}|${o.maxWidth}|${o.size}|${o.minSize}|${o.maxLines}|${o.weight}`;
  let f = FIT_CACHE.get(key);
  if (!f) { f = fitG(text, o); if (FIT_CACHE.size > 20000) FIT_CACHE.clear(); FIT_CACHE.set(key, f); }
  return f;
}
const ROW_CACHE = new Map();
/** Memoised panel row measure (same pure inputs → same result). */
export function measureRowM(row, F, w) {
  const key = `${row.kind}|${row.glyphKind || ''}|${row.text}|${F}|${w}|${row.bold ? 1 : 0}`;
  let m = ROW_CACHE.get(key);
  if (!m) { m = measureRow(row, F, w); if (ROW_CACHE.size > 20000) ROW_CACHE.clear(); ROW_CACHE.set(key, m); }
  return {...m, ...row, fit: m.fit};
}

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: speakers, statements, exhibits, sequence). */
export const expoFields = {
  hearing: obj('Generic, fictional hearing room', {
    room: str('Name of the room (fictional)', 60),
  }, ['room']),
  speakers: list('Participants (generic, fictional). One of them lays out the items; the others sit at the shared table. No role, rank or speaking order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 2, 4),
  presenter: int('Index in `speakers` of the participant who lays out the facts and questions beside the lectern (no speaking order is implied)', 0, 3),
  statements: list('Facts and questions laid out on the presentation table, each with its supplied state. Nothing is assessed', obj('Item', {
    kind: oneOf('fact or question', ['fact', 'question']),
    text: str('Text of the fact or question (fictional)', 60),
    state: oneOf('For a fact: "claim" (claim made, ●) or "support" (support supplied, ◆) — supplied states only, never an assessment', ['claim', 'support']),
    exhibit: int('For a fact with support supplied: index in `exhibits` it refers to (as supplied)', 0, 1),
  }, ['kind', 'text']), 1, 5),
  exhibits: list('Exhibits on the low cabinet by the wall, each with its supplied tag', str('Exhibit tag (fictional)', 50), 0, 2),
  sequence: list('Order in which the items are laid out along the table (indices in `statements`): a sequence as configured (illustrative), not a rule. Items left out follow in list order', int('Index in `statements`', 0, 4), 1, 5),
  states: obj('Captions of the two supplied states of a fact', {
    claim: str('Caption of ● (claim made, as supplied)', 50),
    support: str('Caption of ◆ (support supplied, as supplied)', 50),
  }, ['claim', 'support']),
  labels: obj('Editable captions', {
    question: str('Caption of the question cue', 50),
    sequence: str('Caption of the order of the cards (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['question', 'sequence', 'key']),
};

export const EXPO_EN = {
  hearing: {room: 'Hearing room 2 (fictional)'},
  speakers: [{label: 'Participant A'}, {label: 'Participant B'}, {label: 'Participant C'}],
  presenter: 0,
  statements: [
    {kind: 'fact', text: 'The parcel arrived on 3 May', state: 'claim'},
    {kind: 'fact', text: 'It was opened at the front desk', state: 'support', exhibit: 0},
    {kind: 'question', text: 'Who signed the receipt?'},
  ],
  exhibits: ['Exhibit 1: delivery note'],
  sequence: [0, 1, 2],
  states: {claim: 'Claim made', support: 'Support supplied'},
  labels: {question: 'Question (as supplied)', sequence: 'Order on the table: sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const EXPO_ES = {
  hearing: {room: 'Sala de audiencias 2 (ficticia)'},
  speakers: [{label: 'Participante A'}, {label: 'Participante B'}, {label: 'Participante C'}],
  presenter: 0,
  statements: [
    {kind: 'fact', text: 'El paquete llegó el 3 de mayo', state: 'claim'},
    {kind: 'fact', text: 'Se abrió en el mostrador', state: 'support', exhibit: 0},
    {kind: 'question', text: '¿Quién firmó el recibo?'},
  ],
  exhibits: ['Prueba 1: albarán'],
  sequence: [0, 1, 2],
  states: {claim: 'Afirmación formulada', support: 'Apoyo aportado'},
  labels: {question: 'Pregunta (según lo aportado)', sequence: 'Orden en la mesa: secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

/* ------------------------------------------------------------------ */
/* Resolved params                                                     */
/* ------------------------------------------------------------------ */

/** Outfit colours used by default (no red-ish cloth in this motif). */
const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];

/**
 * Participants with their look; the presenter and the seated participants; the items with their supplied state, the
 * exhibit each support refers to, and the configured order of the cards.
 * @param {any} ctx
 * @param {any} P localised params
 */
export function resolveExpo(ctx, P) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  const presenter = P.presenter < n ? P.presenter : 0;
  const listeners = speakers.map(s => s.index).filter(i => i !== presenter);
  const exhibits = (P.exhibits || []).slice(0, 2);
  const items = (P.statements || []).map((s, i) => {
    const fact = s.kind !== 'question';
    const state = fact ? (s.state === 'support' ? 'support' : 'claim') : null;
    const ex = fact && state === 'support' && exhibits.length ? Math.min(exhibits.length - 1, s.exhibit ?? 0) : null;
    return {i, kind: fact ? 'fact' : 'question', text: s.text, state, exhibit: ex};
  });
  const order = [];
  for (const q of P.sequence || []) if (q < items.length && !order.includes(q)) order.push(q);
  for (let i = 0; i < items.length; i++) if (!order.includes(i)) order.push(i);
  const rank = items.map(it => order.indexOf(it.i));
  return {n, speakers, presenter, listeners, items, order, rank, exhibits};
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/** Folded slip size (template units): what the presenter carries before unfolding it on the table. */
export const SLIP = {w: 34, h: 26};

/**
 * One card's content at template text size Ft and a maximum card width: the cue (● / ◆ / ?) at the left, the
 * supplied text beside it. Without text (labels hidden) the card is a plain sheet with ruled lines.
 * `stateTexts` (inspect) adds the supplied state as the card's last line (both values fitted at the card's width).
 */
export function measureCard(it, Ft, maxW, o = {}) {
  const gS = Ft * 0.36;
  const padX = Ft * 0.55, padY = Ft * 0.45;
  const glyphW = gS * 2.6 + Ft * 0.4;
  if (!o.text) return {w: 104, h: 76, padX: 12, padY: 12, gS: 9, glyphW: 30, fit: null, stateFit: null, truncated: false};
  const inner = Math.max(40, maxW - padX * 2 - glyphW);
  const fit = fitM(o.label ? o.label(it) : it.text, {maxWidth: inner, size: Ft, minSize: Ft, maxLines: 7, weight: o.label ? 700 : 600});
  // (inspect) the two supplied state values are fitted at the card's own width (the card never widens for them)
  let stateFit = null, stateFits = null;
  if (o.stateTexts && it.kind === 'fact') {
    const so = {maxWidth: inner, size: Ft, minSize: Ft, maxLines: 7, weight: 700};
    stateFits = {claim: fitM(o.stateTexts.claim, so), support: fitM(o.stateTexts.support, so)};
    stateFit = {...stateFits.claim, width: Math.max(stateFits.claim.width, stateFits.support.width), height: Math.max(stateFits.claim.height, stateFits.support.height)};
  }
  const textW = Math.max(fit.width, stateFit ? stateFit.width : 0);
  const textH = fit.height + (stateFit ? stateFit.height + Ft * 0.55 : 0);
  return {w: padX * 2 + glyphW + textW, h: Math.max(textH, gS * 2.6) + padY * 2, padX, padY, gS, glyphW, fit, stateFit, stateFits, truncated: fit.truncated || (stateFits ? stateFits.claim.truncated || stateFits.support.truncated : false)};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

const LEDGE_X0 = 26;
/** Listener seats around the shared table (angles, screen coordinates, 90 = below the table). */
const LISTEN_ANGLES = {1: [90], 2: [124, 56], 3: [142, 90, 38]};
/** … and at its two ends when the table stands beside the lectern (a lower group in wide rooms). */
const LISTEN_SIDE = {1: [90], 2: [180, 0], 3: [180, 0, 90]};

/**
 * Geometry of the room. Interior origin = top-left of the floor; the presentation table runs along the top wall
 * (exhibit cabinet against the right wall under its right end, the wall clock under the cabinet); the walkway in front of it; the lectern under the walkway's left
 * end; the shared table of the seated participants below.
 * @param {number} W
 * @param {number} H
 * @param {any} R resolveExpo()
 * @param {(maxW:number)=>Array<any>} cardsFor measured cards (index = item index) for a maximum card width
 * @param {{reserveDock?:number}} [o]
 */
export function expoGeometry(W, H, R, cardsFor, o = {}) {
  const t = WALL;
  const ne = R.exhibits.length;
  const tethered = R.items.filter(it => it.exhibit !== null);
  const nT = tethered.length;
  const exS = o.exS ?? 54;
  const cw = exS + 24, step = exS * 0.74 + 30;
  // the presentation table runs along the whole top wall (the tethers drop down its right end to the cabinet)
  const x0 = LEDGE_X0;
  const laneX = j => W - 18 - j * 12;
  const x1 = (nT ? laneX(nT - 1) - 12 : W - 26);
  const m = R.items.length;
  const gapC = 16;
  const avail = x1 - x0 - gapC * (m + 1);
  const cards = cardsFor(Math.max(60, avail / Math.max(1, m)));
  // cards in the configured order, left to right; bottoms on the table's front edge
  const chanH = nT ? 14 + nT * 14 : 12;
  const maxH = Math.max(...cards.map(c => c.h));
  const ledge = {x: x0, y: 8, w: x1 - x0, h: chanH + maxH + 14};
  const yF = ledge.y + ledge.h;
  // the exhibit cabinet against the right wall under the table's right end (left of the tether drops)
  const cabX = (nT ? laneX(nT - 1) - 14 : W - 10) - cw;
  // (below the walkway: the presenter never walks over it)
  const cab = ne ? {x: cabX, y: yF + 52 + (o.homeDrop || 0) + PERSON.half + 14, w: cw, h: ne * step + 14} : null;
  const exhibits = ne ? R.exhibits.map((_, i) => ({cx: cab.x + cw / 2, cy: cab.y + 7 + step / 2 + i * step, deg: i % 2 ? 3 : -3, s: exS})) : [];
  // the wall clock (support) under the cabinet, on the right wall
  // (the clock's place is settled once the table group is placed: under the cabinet, or in the corner under the lectern)
  let clock = {cx: W - 44, cy: (cab ? cab.y + cab.h : yF + 52 + (o.homeDrop || 0) + PERSON.half) + 52, R: 30};
  const usedW = R.order.reduce((acc, i) => acc + cards[i].w, 0) + gapC * (m + 1);
  const spare = Math.max(0, ledge.w - usedW);
  const gapX = gapC + spare / (m + 1);
  let cx = x0 + gapX;
  const slots = [];
  for (const i of R.order) {
    const c = cards[i];
    slots[i] = {x: cx, y: yF - 10 - c.h, w: c.w, h: c.h, cx: cx + c.w / 2, bottom: yF - 10};
    cx += c.w + gapX;
  }
  // tether lanes behind the cards: from the card's top edge along its lane to the table's right end, down the
  // right wall and in to its exhibit's right side
  const lanes = tethered.map((it, j) => ({i: it.i, ex: it.exhibit, y: ledge.y + 9 + j * 14}));
  const tethers = lanes.map((ln, j) => {
    const s = slots[ln.i];
    const e = exhibits[ln.ex];
    const xv = laneX(j);
    const ax = s.cx + (j % 2 ? -s.w * 0.18 : s.w * 0.18);
    return {i: ln.i, ex: ln.ex, pts: [{x: ax, y: s.y}, {x: ax, y: ln.y}, {x: xv, y: ln.y}, {x: xv, y: e.cy}, {x: e.cx + e.s / 2 + 8, y: e.cy}]};
  });
  // walkway, presenter's home (behind the lectern, facing the room) and standing places at each card
  // (yP: the presenter's centre; from there the hand reaches a slip's place on the front edge and the lectern's stack)
  const yP = yF + 52 + (o.homeDrop || 0);
  const home = {x: x0 + 48 + (o.homeShift || 0), y: yP};
  const lectern = {cx: home.x, cy: yP + 76, s: 62};
  const stack = {x: home.x + 10, y: lectern.cy - 10};
  const stands = [];
  R.items.forEach(it => { const s = slots[it.i]; stands[it.i] = {x: Math.max(60, s.cx - 34), y: yP}; });
  // the shared table of the seated participants, centred under the free floor right of the lectern
  const nL = R.listeners.length;
  let A = Math.max(120, nL * 74 + 30);
  const B = 58;
  // the table stands right of the lectern, just under the walkway (or under the lectern when the room is narrow)
  const rightEdge = (cab ? cab.x : W - 44 - 30) - 24;
  // beside the lectern the seated participants sit at the table's ends (a lower group); end seats need their room
  const endGap = nL >= 2 ? 30 + PERSON.half + 10 : 0;
  // (with the ends taken, a shorter table is enough)
  const Aside = Math.max(105, nL === 3 ? 150 : 105);
  const besideX = lectern.cx + lectern.s / 2 + 40 + endGap + Aside;
  const beside = besideX + Aside + endGap + 30 <= rightEdge;
  if (beside) A = Aside;
  const angles = beside ? LISTEN_SIDE[nL] : LISTEN_ANGLES[nL];
  const tableTop = beside ? yP + 56 + 22 : lectern.cy + lectern.s * 0.35 + 64;
  // the table group (table, seats, people) is centred in the floor left under the lectern (never above its minimum)
  const groupH = beside && nL === 2 ? 2 * B + 30 : 2 * B + 46 + PERSON.half + 22;
  const yMid = (tableTop + H - 24) / 2;
  const C = {x: beside ? Math.min(Math.max(besideX, W / 2 + 20), rightEdge - A - endGap - 30) : Math.min(Math.max(home.x + 70 + A, W / 2 + 20), W - A - 70), y: Math.max(tableTop + B, yMid - groupH / 2 + B)};
  const Cmin = tableTop + B;
  const seats = [];
  R.listeners.forEach((pi, j) => {
    const ang = angles[j];
    const th = (ang * Math.PI) / 180;
    const sx = C.x + Math.cos(th) * (A + (beside && (ang === 0 || ang === 180) ? 30 : 38)), sy = C.y + Math.sin(th) * (B + 46);
    seats[pi] = {x: sx, y: sy, deg: facing({x: sx, y: sy}, C), angle: ang};
  });
  const seatBottom = Math.max(C.y + B + 16, ...R.listeners.map(pi => seats[pi].y + PERSON.half + 22)) - (C.y - Cmin);
  // beside: the wall clock (support) hangs on the left wall's lower corner under the lectern (free floor)
  if (beside && o.clockAt !== 'right') clock = {cx: 46, cy: Math.max(lectern.cy + lectern.s * 0.35 + 54, H - 50), R: 28};
  const needH = Math.max(seatBottom + 34, lectern.cy + 60, beside && o.clockAt !== 'right' ? lectern.cy + lectern.s * 0.35 + 54 + 28 + 22 : clock.cy + clock.R + 30);
  const needW = Math.max(beside ? lectern.cx + lectern.s / 2 + 40 + 2 * (A + endGap) + 30 + (W - rightEdge) : home.x + 70 + 2 * Math.max(120, nL * 74 + 30) + 40 + (W - rightEdge), ...R.listeners.map(pi => seats[pi].x + PERSON.half + 40), usedW > ledge.w ? W + (usedW - ledge.w) : W);
  const door = {a: W - 170, b: W - 92};
  const problems = [];
  if (usedW > ledge.w + 0.5) problems.push('ledge-width');
  if (cards.some(c => c.truncated)) problems.push('card-text');
  if (needH > H + 0.5) problems.push('room-height');
  if (C.x + A + 40 > W) problems.push('room-width');
  if (R.listeners.some(pi => seats[pi].x + PERSON.half + 10 > (beside ? rightEdge + 24 : W - 10))) problems.push('seat-cabinet');
  const lamps = [];
  return {
    W, H, t, clock, cab, exhibits, ledge, yF, slots, cards, lanes, tethers, yP, home, lectern, stack, stands, C, A, B, seats, door, lamps,
    needW: Math.max(needW, x0 + usedW + 26 + nT * 12), needH,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t},
    problems,
  };
}

/** Obstacles of the room (template units) for label placement: furniture, the walkway, the cabinet, the clock. */
export function expoObstacles(G, R, o = {}) {
  const out = [
    {x: G.ledge.x - 6, y: 0, w: G.ledge.w + 12, h: G.ledge.h + 14},
    {x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R - 6, w: 2 * G.clock.R + 12, h: 2 * G.clock.R + 12},
    {x: G.lectern.cx - 40, y: G.lectern.cy - 30, w: 80, h: 60},
    // the walkway: where the presenter walks to the cards and back (kept free unless the presenter stays put)
    o.walkway === false ? null : {x: Math.min(G.home.x, ...R.items.map(it => G.stands[it.i].x)) - 58, y: G.yF, w: Math.max(G.home.x, ...R.items.map(it => G.stands[it.i].x)) - Math.min(G.home.x, ...R.items.map(it => G.stands[it.i].x)) + 116 + 40, h: G.yP + 56 - G.yF},
  ];
  if (G.cab) out.push({x: G.cab.x - 8, y: G.cab.y - 8, w: G.cab.w + 16, h: G.cab.h + 16});
  for (let i = out.length - 1; i >= 0; i--) if (!out[i]) out.splice(i, 1);
  // each tether segment (not the tether's whole bounding box)
  if (o.tethers !== false) for (const tt of G.tethers) for (let j = 1; j < tt.pts.length; j++) {
    const a = tt.pts[j - 1], b = tt.pts[j];
    out.push({x: Math.min(a.x, b.x) - 6, y: Math.min(a.y, b.y) - 6, w: Math.abs(b.x - a.x) + 12, h: Math.abs(b.y - a.y) + 12});
  }
  return out;
}

/** Box of a person (template units). */
export const personBox = s => ({x: s.x - PERSON.half - 8, y: s.y - PERSON.half - 8, w: PERSON.half * 2 + 16, h: PERSON.half * 2 + 16});

/* ------------------------------------------------------------------ */
/* Presenter choreography                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G expoGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, keep?:(b:any)=>boolean, lift?:boolean, datum?:any, states?:any}} o
 */
export function expoRoom(ctx, G, o) {
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
    {side: 'left', a: H * 0.6, b: H * 0.78, kind: 'window'},
    {side: 'right', a: H * 0.6, b: H * 0.78, kind: 'window'},
  ]}));
  const door = plainDoor(ctx, {name: `${P}-door`, hinge: {x: G.door.b, y: H + t / 2}, width: G.door.b - G.door.a, closedDeg: 180, openDeg: 80});
  parts.push(door.node);
  const clock = wallClock(ctx, {name: `${P}-clock`, cx: G.clock.cx, cy: G.clock.cy, R: G.clock.R});
  if (keep(clock.box)) parts.push(wrapLift('clock', clock.node));
  // presentation table along the top wall
  const L = G.ledge;
  // (the table itself is furniture: a lens copy shows the part of it under its crop)
  if (keep(L) || o.keep) {
    parts.push(wrapLift('ledge', g({name: `${P}-ledge`},
      h('path', {d: roundRectPath(L.x + 4, L.y + 7, L.w, L.h, 8), fill: ctx.theme.shadow}),
      h('path', {d: roundRectPath(L.x, L.y, L.w, L.h, 8), fill: c.wood, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M${r(L.x + 8)} ${r(L.y + L.h - 6)}H${r(L.x + L.w - 8)}`, stroke: c.woodEdge, 'stroke-width': 3, 'stroke-linecap': 'round'}))));
  }
  // cabinet and exhibits
  if (G.cab && keep(G.cab)) {
    // each exhibit carries its number (keyed to its tag in the panel) when labels are shown
    const badge = (e, i) => (o.Ft ? g({name: `${P}-exnum${i}`},
      h('circle', {cx: r(e.cx), cy: r(e.cy), r: r(o.Ft * 0.78), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
      h('text', {x: r(e.cx), y: r(e.cy + o.Ft * 0.36), 'font-family': FONT, 'font-size': r(o.Ft, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(i + 1))) : null);
    parts.push(wrapLift('cab', g({name: `${P}-cab`}, lowCabinet(ctx, {name: `${P}-cabinet`, ...G.cab}),
      G.exhibits.map((e, i) => g(null, exhibitBox(ctx, {name: `${P}-exhibit${i}`, cx: e.cx, cy: e.cy, s: e.s, deg: e.deg}), badge(e, i))))));
  }
  // tethers (support supplied → its exhibit, as supplied): solid, drawn on; ends are small solid dots
  const tethers = G.tethers.map((tt, j) => {
    if (o.noTether && o.noTether.includes(tt.i)) return null;
    const poly = polyline(tt.pts);
    const xs = tt.pts.map(p => p.x), ys = tt.pts.map(p => p.y);
    const bb = {x: Math.min(...xs) - 4, y: Math.min(...ys) - 4, w: Math.max(...xs) - Math.min(...xs) + 8, h: Math.max(...ys) - Math.min(...ys) + 8};
    if (!keep(bb)) return null;
    const a = tt.pts[0], b = tt.pts[tt.pts.length - 1];
    return {i: tt.i, poly, node: g({name: `${P}-tether${tt.i}`, opacity: 0},
      h('path', {name: `${P}-tether${tt.i}-line`, 'data-draw': 1, d: poly.d(1), fill: 'none', stroke: c.screenEdge, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(poly.total)} ${r(poly.total + 10)}`, 'stroke-dashoffset': r(poly.total)}),
      g({name: `${P}-tether${tt.i}-ends`, opacity: 0},
        h('circle', {cx: r(a.x), cy: r(a.y), r: 5, fill: c.screenEdge}),
        h('circle', {cx: r(b.x), cy: r(b.y), r: 5, fill: c.screenEdge})))};
  });
  parts.push(tethers.filter(Boolean).map(q => q.node));
  // cards (each: a body, its cue and its text; it unfolds from a slip about its front edge)
  let datumInfo = null;
  const cards = R.items.map(it => {
    const s = G.slots[it.i], m = G.cards[it.i];
    if (!keep({x: s.x, y: s.y, w: s.w, h: s.h})) return null;
    const N = `${P}-card${it.i}`;
    const gx = s.x + m.padX + m.gS * 1.3;
    // (the supplied state line, when shown, is the card's LAST line: substituted, it leaves downwards over no text)
    const lineY = s.y + m.padY;
    const gy = m.fit ? lineY + m.fit.size * 0.55 : s.y + s.h / 2;
    const tx = s.x + m.padX + m.glyphW;
    const cue = it.kind === 'fact'
      ? g({name: `${N}-cue`}, stateCue(ctx, it.state, N, gx, gy, m.gS, o.datum && o.datum.i === it.i ? o.datum : null))
      : questionCue(ctx, `${N}-cue`, gx, gy, m.gS, m.fit ? m.fit.size : 20);
    const ruled = [];
    if (!m.fit) for (let q = 0; q < 3; q++) ruled.push(`M${r(s.x + m.glyphW + 8)} ${r(s.y + 22 + q * 16)}H${r(s.x + s.w - 12 - (q === 2 ? 22 : 0))}`);
    let stateNode = null;
    if (m.stateFit && o.datum && o.datum.i === it.i) {
      const D = o.datum.dock;
      datumInfo = {...o.datum, tx, ty: s.y + m.padY + m.fit.height + m.fit.size * 0.55};
      datumInfo.dx = D.x + D.padX + D.wasW + D.gap - tx;
      datumInfo.dy = D.y + D.padY - datumInfo.ty;
      stateNode = datumNodes(ctx, N, datumInfo, tx, datumInfo.ty);
    }
    return {i: it.i, N, s, m, node: g({name: N, transform: 'translate(0 0) scale(1)', opacity: 0},
      h('path', {d: roundRectPath(s.x + 3, s.y + 5, s.w, s.h, 6), fill: ctx.theme.shadow}),
      h('path', {name: `${N}-body`, d: roundRectPath(s.x, s.y, s.w, s.h, 6), fill: c.paper, stroke: INK, 'stroke-width': 2.2}),
      ruled.length ? h('path', {d: ruled.join(''), stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}) : null,
      cue,
      stateNode,
      m.fit ? g({name: `${N}-text`, opacity: 0}, textAt(m.fit, tx, lineY, INK)) : null)};
  });
  parts.push(wrapLift('cards', cards.filter(Boolean).map(cd => cd.node)));
  // lectern and its stack of folded slips
  const lecBox = {x: G.lectern.cx - G.lectern.s / 2, y: G.lectern.cy - G.lectern.s * 0.35, w: G.lectern.s, h: G.lectern.s * 0.7};
  if (keep(lecBox)) {
    parts.push(wrapLift('lectern', g({name: `${P}-lectern`}, planLectern(ctx, {name: `${P}-lectern-top`, cx: G.lectern.cx, cy: G.lectern.cy, s: G.lectern.s, deg: 180}))));
  }
  // the shared table and its chairs
  const tb = {x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2};
  if (keep(tb)) parts.push(ovalTable(ctx, {name: `${P}-table`, cx: G.C.x, cy: G.C.y, a: G.A, b: G.B, seedKey: 'expo'}));
  R.listeners.forEach(i => { const s = G.seats[i]; if (keep(personBox(s))) parts.push(planChair(ctx, {name: `${P}-chair${i}`, cx: toWorld(s, {x: 0, y: 14}).x, cy: toWorld(s, {x: 0, y: 14}).y, deg: s.deg, s: 64})); });
  // people (presenter standing; the others seated)
  const keepPresenter = o.keep ? false : true;
  const rigs = R.speakers.map(sp => {
    if (sp.index === R.presenter) return keepPresenter ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null;
    return keep(personBox(G.seats[sp.index])) ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null;
  });
  parts.push(rigs.filter(Boolean).map(rg => rg.node));
  // slips (above the people: one is in the presenter's hand)
  const slips = R.items.map(it => (o.keep ? null : {i: it.i, node: paperSheet(ctx, {name: `${P}-slip${it.i}`, cx: 0, cy: 0, w: SLIP.w, h: SLIP.h, deg: 0})}));
  // (contrast) the contrasted slip carries its supplied state's cue (● / ◆, same ink) once it is introduced
  const cueOf = i => (o.slipCue && o.slipCue.i === i ? g({name: `${P}-slipcue${i}`, opacity: 0},
    h('circle', {cx: 0, cy: 0, r: 15, fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
    stateGlyph(ctx, {name: `${P}-slipcue${i}-g`, kind: o.slipCue.kind, cx: 0, cy: 0, s: 7.5})) : null);
  parts.push(slips.filter(Boolean).map(sl => g({name: `${P}-slipwrap${sl.i}`, transform: 'translate(0 0)', opacity: 0}, sl.node, cueOf(sl.i))));

  /**
   * @param {{clockDeg:number, presenter:{pose:any, reach:any}|null, cards:Array<{open:number,text:number,shown:number}>,
   *   slips:Array<{x:number,y:number,deg:number,opacity:number}|null>, tethers:Array<number>, datum?:any, lift?:any}} st
   */
  function frame(st) {
    const nodes = {};
    Object.assign(nodes, door.frame(0));
    if (keep(clock.box)) Object.assign(nodes, clock.frame(st.clockDeg));
    if (o.lift) for (const key of ['clock', 'ledge', 'cab', 'cards', 'lectern']) {
      const q = (st.lift && st.lift[key]) || null;
      if (key === 'cab' && !G.cab) continue;
      nodes[`${P}-lift-${key}`] = {transform: q ? q.transform : 'translate(0 0)'};
    }
    if (G.cab && keep(G.cab) && o.Ft) G.exhibits.forEach((_, i) => { nodes[`${P}-exnum${i}`] = {opacity: r(st.textK ?? 1, 3)}; });
    cards.forEach(cd => {
      if (!cd) return;
      const cs = st.cards[cd.i] || {open: 1, text: 1, shown: 1};
      const op = clamp(cs.open);
      // (uniform: the card grows from the slip's size about its front edge)
      const s0 = Math.min(SLIP.w / cd.s.w, SLIP.h / cd.s.h);
      const sx = lerp(s0, 1, op), sy = sx;
      const ax = cd.s.cx, ay = cd.s.bottom;
      nodes[cd.N] = {transform: `translate(${r(ax - ax * sx)} ${r(ay - ay * sy)}) scale(${r(sx, 4)} ${r(sy, 4)})`, opacity: r(cs.shown && op > 0 ? 1 : 0, 3)};
      if (cd.m.fit) nodes[`${cd.N}-text`] = {opacity: r(clamp(cs.text) * (st.textK ?? 1), 3)};
      if (datumInfo && datumInfo.i === cd.i) Object.assign(nodes, datumFrame(cd.N, datumInfo, st.datum));
      else if (o.datum && o.datum.i === cd.i && st.datum) {
        // (no state text) the cue alone changes
        nodes[`${cd.N}-g-${o.datum.before}`] = {opacity: r(1 - clamp(st.datum.cue), 3)};
        nodes[`${cd.N}-g-${o.datum.after}`] = {opacity: r(clamp(st.datum.cue), 3)};
      }
    });
    tethers.forEach(tt => {
      if (!tt) return;
      const p = clamp(st.tethers[tt.i] ?? 0);
      nodes[`${P}-tether${tt.i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`${P}-tether${tt.i}-line`] = {'stroke-dashoffset': r(tt.poly.total * (1 - ease.inOutSine(p)))};
      nodes[`${P}-tether${tt.i}-ends`] = {opacity: r(clamp((p - 0.85) / 0.15), 3)};
    });
    let reached = true;
    const hands = [];
    rigs.forEach((rg, i) => {
      if (!rg) return;
      let pose, rc = null;
      if (i === R.presenter) {
        pose = st.presenter.pose;
        rc = st.presenter.reach;
      } else {
        const s = G.seats[i];
        pose = {x: s.x, y: s.y, deg: s.deg, seated: 1};
      }
      Object.assign(nodes, rg.pose(pose));
      const rr = reachRecords({name: `${P}-p${i}`}, pose, rc ? rc.target : pose, {k: rc ? rc.k : 0});
      if (rc) Object.assign(nodes, rr.nodes);
      if (rc && !rr.reached && rc.k > 0) reached = false;
      const rl = i === R.presenter ? st.presenter.reachL : null;
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
  return {node: g({name: `${P}-room`}, parts), frame, rigs, cards, tethers, clock};
}

/** ● (claim made) or ◆ (support supplied): equal ink area, same fill (hearings-art stateGlyph). */
export function stateCue(ctx, state, N, gx, gy, s, datum) {
  if (datum) {
    // (inspect) both cues are drawn; the frame shows one at a time
    return [
      stateGlyph(ctx, {name: `${N}-g-claim`, kind: 'dot', cx: gx, cy: gy, s, opacity: datum.before === 'claim' ? 1 : 0}),
      stateGlyph(ctx, {name: `${N}-g-support`, kind: 'diamond', cx: gx, cy: gy, s, opacity: datum.before === 'support' ? 1 : 0}),
    ];
  }
  return stateGlyph(ctx, {name: `${N}-g-${state}`, kind: state === 'support' ? 'diamond' : 'dot', cx: gx, cy: gy, s});
}

/** Neutral question cue: a ring with a "?" drawn as strokes (not part of the compared pair; no text node). */
export function questionCue(ctx, name, cx, cy, s, size) {
  const q = s * 0.62;
  return g({name},
    h('circle', {cx: r(cx), cy: r(cy), r: r(s * 1.25), fill: '#ffffff', stroke: INK, 'stroke-width': r(Math.max(2, s * 0.2), 2)}),
    h('path', {d: `M${r(cx - q * 0.62)} ${r(cy - q * 0.42)}A${r(q * 0.64)} ${r(q * 0.64)} 0 1 1 ${r(cx + q * 0.12)} ${r(cy + q * 0.2)}Q${r(cx)} ${r(cy + q * 0.3)} ${r(cx)} ${r(cy + q * 0.62)}`, fill: 'none', stroke: INK, 'stroke-width': r(Math.max(2.4, s * 0.26), 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(cx), cy: r(cy + q * 1.08), r: r(Math.max(1.6, s * 0.16)), fill: INK}));
}

/* ------------------------------------------------------------------ */
/* Datum overlay (inspect): the state line of the focus card            */
/* ------------------------------------------------------------------ */

/**
 * The focus card's first line is its supplied state ("Claim made" / "Support supplied"): both values are drawn
 * (one shown at a time); the old one can be struck and moved down to the dock under the table's front edge.
 * datum: {i, before, after, fits:{claim, support}, dock:{x,y,w,h,padX,padY,wasFit,gap}, wasText}
 */
function datumNodes(ctx, N, d, tx, ty) {
  const th = ctx.theme;
  const out = [];
  for (const st of ['claim', 'support']) {
    const fit = d.fits[st];
    const strikes = st === d.before ? fit.lines.map((ln, i) => h('line', {name: `${N}-strike${i}`, opacity: 0, x1: r(tx - 3), y1: r(ty + fit.size * 0.5 + i * fit.lineHeight), x2: r(tx - 3), y2: r(ty + fit.size * 0.5 + i * fit.lineHeight), stroke: INK, 'stroke-width': r(Math.max(2.5, fit.size * 0.1), 2), 'stroke-linecap': 'round'})) : [];
    const slip = st === d.before ? h('path', {name: `${N}-dslip`, opacity: 0, d: roundRectPath(tx - 5, ty - 4, fit.width + 10, fit.height + 8, Math.min(fit.size * 0.5, (fit.height + 8) / 2)), fill: '#f3f4f5'}) : null;
    out.push(g({name: `${N}-v-${st}`, opacity: st === d.before ? 1 : 0, transform: 'translate(0 0)'}, slip, textAt(fit, tx, ty, INK, {name: `${N}-v-${st}-text`}), strikes));
  }
  const D = d.dock;
  out.unshift(g({name: `${N}-dock`, opacity: 0}, h('path', {d: roundRectPath(D.x, D.y, D.w, D.h, Math.min(D.h / 2, d.fits[d.before].size * 0.7)), fill: '#f3f4f5', stroke: th.inkSoft, 'stroke-width': r(2.2 * d.fits[d.before].size / 20, 2)})));
  out.push(g({name: `${N}-was`, opacity: 0}, textAt(D.wasFit, D.x + D.padX, D.y + D.padY, '#57606a', {italic: true})));
  return g({name: `${N}-datum`}, out);
}

function datumFrame(N, d, dm0) {
  const dm = dm0 || {strike: 0, move: 0, chip: 0, was: 0, newIn: 0, cue: 0, copy: 1};
  const nodes = {};
  const fit = d.fits[d.before];
  fit.lines.forEach((ln, i) => {
    const w = d.lineW[i];
    nodes[`${N}-strike${i}`] = {x2: r(d.tx - 3 + (w + 6) * clamp(dm.strike)), opacity: dm.strike > 0 ? 1 : 0};
  });
  nodes[`${N}-v-${d.before}`] = {opacity: r(clamp(dm.copy), 3), transform: `translate(${r(d.dx * clamp(dm.move))} ${r(d.dy * clamp(dm.move))})`};
  nodes[`${N}-v-${d.after}`] = {opacity: r(clamp(dm.newIn) * clamp(dm.copy), 3), transform: 'translate(0 0)'};
  nodes[`${N}-dslip`] = {opacity: r(clamp(dm.move * 12) * (1 - clamp((dm.move - 0.8) / 0.2)), 3)};
  nodes[`${N}-dock`] = {opacity: r(clamp(dm.chip) * clamp(dm.copy), 3)};
  nodes[`${N}-was`] = {opacity: r(clamp(dm.was) * clamp(dm.copy), 3)};
  nodes[`${N}-g-${d.before}`] = {opacity: r(1 - clamp(dm.cue), 3)};
  nodes[`${N}-g-${d.after}`] = {opacity: r(clamp(dm.cue), 3)};
  return nodes;
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its chips (design units)   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolveExpo()
 * @param {{x:number,y:number,w:number,h:number}} box room box (design units)
 * @param {number} F label text size (design units)
 * @param {{chips?:boolean, exhibitChips?:boolean, cardText?:boolean, scale?:number, align?:{x:number,y:number}, stateLineFor?:number|null, stateTexts?:{claim:string,support:string}, reserve?:(G:any)=>Array<any>, chipMaxW?:number, extraH?:number, extraTop?:number}} o
 */
export function composeExpo(ctx, P, R, box, F, o = {}) {
  const t = WALL;
  const sc = o.scale ?? 1;
  const cardText = o.cardText !== false;
  // the widest a card may be (design units): the box's width shared by the cards (they wrap to more lines on narrow frames)
  const cardMaxD = o.cardMaxD ?? Math.min(360, Math.max(120, (box.w - 130) / Math.max(1, R.items.length)));
  // the room's width is searched (wider rooms let the cards wrap less and the table sit lower); for each width the
  // scale is set by whichever of the box's width and height binds; the widest scale wins
  const ar = box.w / box.h;
  // cards are measured in DESIGN units (scale-free, so the fits repeat across the width search) and scaled to template
  const scaleFit = (f, q) => (f ? {...f, size: f.size * q, lineHeight: f.lineHeight * q, width: f.width * q, height: f.height * q} : f);
  const withState = o.stateLineFor !== undefined && o.stateLineFor !== null && cardText && o.stateTexts;
  const geoAt = (W, H, k) => {
    const Ft = F / k;
    const q = 1 / k;
    const cardsFor = maxW => R.items.map(item => {
      const mw = Math.round(Math.min(maxW * k, cardMaxD) / 2) * 2;
      const m = measureCard(item, F, mw, {text: cardText, label: o.cardLabel, stateTexts: withState && item.i === o.stateLineFor ? o.stateTexts : null});
      if (!cardText) return m;
      return {...m, w: m.w * q, h: m.h * q, padX: m.padX * q, padY: m.padY * q, gS: m.gS * q, glyphW: m.glyphW * q, fit: scaleFit(m.fit, q), stateFit: scaleFit(m.stateFit, q), stateFits: m.stateFits ? {claim: scaleFit(m.stateFits.claim, q), support: scaleFit(m.stateFits.support, q)} : null};
    });
    const G = expoGeometry(W, H, R, cardsFor, {...o, exS: cardText ? Math.max(54, Ft * 1.75) : 54});
    G.Ft = cardText ? Ft : null;
    const fc = withState ? G.cards[o.stateLineFor] : null;
    G.stateLine = fc && fc.stateFits ? {fits: fc.stateFits, maxFit: fc.stateFit} : null;
    return G;
  };
  let pick = null;
  const Ws = [];
  for (let W0 = 680 * sc; W0 <= 2600; W0 *= 1.16) Ws.push(W0);
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
    const bad = G0.problems.filter(q => q === 'ledge-width' || q === 'card-text').length + (G0.needW > W0 + 1 ? 1 : 0);
    const cand = {W: W0, k, bad};
    if (!pick || (cand.bad < pick.bad) || (cand.bad === pick.bad && cand.k > pick.k + 1e-6)) pick = cand;
  };
  Ws.forEach(tryW);
  // refine around the best width (the scale changes fast where the table group moves beside the lectern)
  const W1 = pick.W;
  for (const f of [0.9, 0.94, 0.97, 1.03, 1.06, 1.1]) if (W1 * f >= 600 * sc) tryW(W1 * f);
  let W = pick.W, k = pick.k;
  let G = geoAt(W, 600, k);
  let H = Math.max(G.needH + (o.extraH || 0), 520 * sc);
  // the room fills the box's aspect (extra floor rather than empty frame), then the final geometry
  if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
  k = Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t));
  G = geoAt(W, H, k);
  const E = G.extents;
  const al = o.align || {x: 0.5, y: 0.5};
  const ox = box.x + (box.w - E.w * k) * al.x - E.x * k;
  const oy = box.y + (box.h - E.h * k) * al.y - E.y * k;
  const toD = mapper(ox, oy, k);
  const bD = mapBox(ox, oy, k);
  const problems = [...G.problems];
  const rad = PERSON.half * k;
  const posOf = i => (i === R.presenter ? G.home : G.seats[i]);
  const people = R.speakers.map(sp => ({...toD(posOf(sp.index)), rad: rad + 4}));
  const bounds = {x: ox + 10 * k, y: oy + 10 * k, w: (W - 20) * k, h: (H - 20) * k};
  const equip = [...expoObstacles(G, R, {walkway: o.walkway, tethers: o.tethers}), ...(o.reserve ? o.reserve(G) : [])].map(bD);
  const ellipse = {c: toD(G.C), a: G.A * k, b: G.B * k};
  const chips = [];
  const exChips = [];
  const chipMaxW = o.chipMaxW ?? 340;
  const spItems = [];
  const exItems = [];
  if (o.chips) {
    const widths = [chipMaxW, chipMaxW * 0.8, chipMaxW * 0.64, chipMaxW * 0.52, chipMaxW * 0.44];
    const vs = R.speakers.map(sp => widths.map(mw => measureSpeakerChip(sp, 0, F, mw, {seqDisc: false, maxLines: 4})).filter(m => !m.truncated));
    if (vs.some(v => !v.length)) problems.push('chip-truncated');
    const owners = R.speakers.map(sp => toD(posOf(sp.index)));
    for (const sp of R.speakers) {
      const i = sp.index;
      const pref = i === R.presenter ? 180 : G.seats[i].angle;
      spItems.push({key: `sp${i}`, i, variants: (vs[i].length ? vs[i] : [measureSpeakerChip(sp, 0, F, chipMaxW, {seqDisc: false, maxLines: 6})]).map(m => ({w: m.w, h: m.h, m})), at: toD(posOf(i)), rad, rim: rad * 0.84, prefer: pref, owners, maxGap: 56});
    }
  }
  if (o.exhibitChips && R.exhibits.length) {
    const vs = R.exhibits.map((tx, i) => [chipMaxW, chipMaxW * 0.75, chipMaxW * 0.55].map(mw => {
      const padX = F * 0.55, padY = F * 0.34;
      const fit = fitG(tx, {maxWidth: mw - padX * 2, size: F, minSize: F, maxLines: 4, weight: 600});
      return {i, fit, w: fit.width + padX * 2, h: fit.height + padY * 2, padX, padY};
    }).filter(m => !m.fit.truncated));
    if (vs.some(v => !v.length)) problems.push('exhibit-truncated');
    const owners = G.exhibits.map(e => toD({x: e.cx, y: e.cy}));
    vs.forEach((v, i) => exItems.push({key: `ex${i}`, ex: i, variants: v.map(m => ({w: m.w, h: m.h, m})), at: toD({x: G.exhibits[i].cx, y: G.exhibits[i].cy}), rad: 30 * k, rim: 22 * k, prefer: 120, owners, maxGap: 150, gaps: [12, 24, 40, 60, 80, 100, 125, 150]}));
  }
  // the cabinet's own box is not an obstacle for its tags' leaders (they start beside it): drop it for the tags
  const orders = [[...spItems, ...exItems], [...exItems, ...spItems]];
  if (exItems.length > 1) orders.push([...spItems, ...[...exItems].reverse()]);
  let res = null;
  for (const ord of orders) {
    const r0 = placeLabels(ord, {bounds, circles: people, boxes: equip, ellipse, placed: []});
    if (!res || r0.fails.length < res.r0.fails.length) res = {ord, r0};
    if (!r0.fails.length) break;
  }
  if (res) {
    res.ord.forEach((it, j) => {
      const L = res.r0.labels[j];
      if (it.ex !== undefined) exChips[it.ex] = L; else chips[it.i] = L;
    });
    for (const f of res.r0.fails) problems.push(`chip-${f}`);
  }
  return {F, k, W, H, G, E, ox, oy, toD, bD, chips, exChips, problems, rad, box, people, equip, ellipse, bounds,
    planRect: {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k}};
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/** Panel row node: the motif's own glyphs (claim ●, support ◆, question, lectern), else the shared rows. */
export function expoRowNode(ctx, m, o = {}) {
  if (m.kind === 'legend' && (m.glyphKind === 'question' || m.glyphKind === 'lectern' || m.glyphKind === 'tether' || m.glyphKind === 'support' || m.glyphKind === 'itemcard')) {
    const th = ctx.theme;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    if (m.glyphKind === 'question') glyph = questionCue(ctx, null, gx, gy, m.glyph * 0.26, m.fit.size * 0.9);
    else if (m.glyphKind === 'itemcard') {
      // an item card with its number (keyed to the numbered cards on the presentation tables)
      const w = m.glyph * 0.9, hh = m.glyph * 0.8;
      glyph = g(null, h('path', {d: roundRectPath(gx - w / 2, gy - hh / 2, w, hh, 4), fill: hearingColors(ctx).paper, stroke: INK, 'stroke-width': 2}),
        h('text', {x: r(gx), y: r(gy + m.fit.size * 0.36), 'font-family': FONT, 'font-size': r(m.fit.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, m.seqNumber));
    } else if (m.glyphKind === 'support') {
      // ◆ (same ink area as ●) with its line to an exhibit: the legend of a fact with support supplied
      const sG = m.glyph * 0.26;
      const ink = th.dark ? th.fg : INK;
      glyph = g(null, stateGlyph(ctx, {kind: 'diamond', cx: gx - m.glyph * 0.12, cy: gy, s: sG, fill: ink}),
        h('path', {d: `M${r(gx - m.glyph * 0.12 + sG * 1.3)} ${r(gy)}H${r(gx + m.glyph * 0.46)}`, stroke: hearingColors(ctx).screenEdge, 'stroke-width': 3, 'stroke-linecap': 'round'}),
        h('circle', {cx: r(gx + m.glyph * 0.46), cy: r(gy), r: 3.5, fill: hearingColors(ctx).screenEdge}));
    } else if (m.glyphKind === 'lectern') glyph = g({transform: T(gx, gy)}, planLectern(ctx, {name: null, cx: 0, cy: 0, s: m.glyph * 0.8, deg: 180}));
    else glyph = g(null, h('path', {d: `M${r(gx - m.glyph * 0.4)} ${r(gy + m.glyph * 0.2)}V${r(gy - m.glyph * 0.15)}H${r(gx + m.glyph * 0.4)}`, fill: 'none', stroke: hearingColors(ctx).screenEdge, 'stroke-width': 3.2, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(gx - m.glyph * 0.4), cy: r(gy + m.glyph * 0.2), r: 4, fill: hearingColors(ctx).screenEdge}),
      h('circle', {cx: r(gx + m.glyph * 0.4), cy: r(gy - m.glyph * 0.15), r: 4, fill: hearingColors(ctx).screenEdge}));
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return rowNode(ctx, m, o);
}

/** Legend glyph helper for rows kinds 'claim' / 'support' map onto the shared ● / ◆ glyphs. */
export const CUE_ROW = {claim: 'started', support: 'support'};
export {legendGlyph, overlaps};


/* ------------------------------------------------------------------ */
/* Presenter choreography: one schedule for the whole laying out        */
/* ------------------------------------------------------------------ */

/** Where the left hand holds the stack of slips (presenter's local frame, in front of the chest). */
const HOLD = {x: -16, y: -46};

/**
 * Schedule (u) of the laying out between t0 and t1: the presenter lifts the stack of folded slips from the lectern
 * with the left hand, turns, walks along the table and, at each card's place in the configured sequence, turns to the
 * table, takes the top slip with the right hand, sets it down at its place (where it unfolds into the card and its text
 * arrives once open; a support's line to its exhibit is drawn after its text), turns back and walks on; at the end
 * walks back to the lectern and faces the room again. Walking time is shared in proportion to distance.
 * @param {any} G
 * @param {any} R
 * @param {number} t0
 * @param {number} t1
 * @param {{waiting?:number}} [o] an item left folded on the lectern (supplied final state)
 */
export function expoSchedule(G, R, t0, t1, o = {}) {
  const waiting = o.waiting ?? -1;
  const seq = R.order.filter(i => i !== waiting);
  const T = t1 - t0;
  const B = {pick: 0.05, turn: 0.016, turnIn: 0.016, fetch: 0.02, carry: 0.024, set: 0.008, back: 0.016, turnOut: 0.014, end: 0.03};
  const per = B.turnIn + B.fetch + B.carry + B.set + B.back + B.turnOut;
  const fixed0 = B.pick + B.turn + per * seq.length + B.end;
  const f = Math.min(1, (0.66 * T) / fixed0);
  const xs = [G.home.x, ...seq.map(i => G.stands[i].x), G.home.x];
  let D = 0;
  for (let j = 1; j < xs.length; j++) D += Math.abs(xs[j] - xs[j - 1]);
  const walkT = T - fixed0 * f;
  const segs = [];
  let u = t0, x = G.home.x, cum = 0;
  const dirOf = (a, b) => (b >= a ? 90 : -90);
  let dir = dirOf(G.home.x, xs[1]);
  const add = (kind, dur, d) => { segs.push({kind, a: u, b: u + dur, ...d}); u += dur; };
  add('pick', B.pick * f, {x, deg0: 180, deg1: 180});
  add('turn', B.turn * f, {x, deg0: 180, deg1: dir});
  const items = {};
  seq.forEach((i, j) => {
    const to = G.stands[i].x;
    const d = Math.abs(to - x);
    dir = d > 1 ? dirOf(x, to) : dir;
    add('walk', D > 0 ? (walkT * d) / D : 0, {x0: x, x1: to, deg0: dir, deg1: dir, cum0: cum});
    cum += d; x = to;
    add('turnIn', B.turnIn * f, {x, deg0: dir, deg1: 0, i});
    const fetchA = u;
    add('fetch', B.fetch * f, {x, deg0: 0, deg1: 0, i});
    add('carry', B.carry * f, {x, deg0: 0, deg1: 0, i});
    add('set', B.set * f, {x, deg0: 0, deg1: 0, i});
    const setEnd = u;
    add('back', B.back * f, {x, deg0: 0, deg1: 0, i});
    const next = j + 1 < seq.length ? G.stands[seq[j + 1]].x : G.home.x;
    const nd = Math.abs(next - x) > 1 ? dirOf(x, next) : dir;
    add('turnOut', B.turnOut * f, {x, deg0: 0, deg1: nd, i});
    dir = nd;
    const open = [setEnd, setEnd + 0.045 * Math.max(f, 0.6)];
    const text = [open[1], open[1] + 0.03];
    items[i] = {fetchA, carryA: fetchA + B.fetch * f, setEnd, open, text, tether: [text[1] + 0.004, text[1] + 0.06], last: j === seq.length - 1};
  });
  const back = Math.abs(G.home.x - x);
  add('walk', D > 0 ? (walkT * back) / D : 0, {x0: x, x1: G.home.x, deg0: dir, deg1: dir, cum0: cum, final: true});
  add('end', B.end * f, {x: G.home.x, deg0: dir, deg1: dir > 0 ? 180 : -180});
  return {segs, items, seq, waiting, t0, t1: u, f};
}

/**
 * The stage at u from a schedule: the presenter's pose and both hands, every slip, card and line.
 * @param {any} G
 * @param {any} R
 * @param {any} S expoSchedule()
 * @param {number} u
 * @param {{reduced?:boolean}} [o]
 */
export function stageAt(G, R, S, u, o = {}) {
  const e = ease.inOutCubic;
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  let seg = null;
  for (const sg of S.segs) if (u >= sg.a && u < sg.b) { seg = sg; break; }
  const before = u < S.segs[0].a, after = !seg && !before;
  const home = {x: G.home.x, y: G.home.y, deg: 180, walk: 0, phase: 0, seated: 0};
  let pose = home;
  if (seg) {
    const q = pos(u, seg.a, seg.b);
    if (seg.kind === 'walk') {
      const qq = e(q);
      const xx = lerp(seg.x0, seg.x1, qq);
      pose = {x: xx, y: G.home.y, deg: seg.deg0, walk: o.reduced || Math.abs(seg.x1 - seg.x0) < 2 ? 0 : 1, phase: (seg.cum0 + Math.abs(xx - seg.x0)) / 16, seated: 0};
    } else {
      pose = {x: seg.x, y: G.home.y, deg: lerp(seg.deg0, seg.deg1, e(q)), walk: 0, phase: 0, seated: 0};
    }
  }
  // the left hand: reaches the stack on the lectern, then holds the stack in front of the chest until the last slip
  // has been taken; empty, it comes back to rest
  const pick = S.segs[0];
  const stackW = {x: G.stack.x, y: G.stack.y};
  const holdW = toWorld(pose, HOLD);
  let reachL = null;
  const nLeft = S.seq.filter(i => u < S.items[i].carryA).length;
  const lastCarry = S.seq.length ? S.items[S.seq[S.seq.length - 1]].carryA : pick.b;
  if (S.seq.length && u >= pick.a && u < lastCarry + 0.03) {
    if (u < (pick.a + pick.b) / 2) reachL = {target: stackW, k: e(pos(u, pick.a, (pick.a + pick.b) / 2))};
    else if (u < pick.b) {
      const q = e(pos(u, (pick.a + pick.b) / 2, pick.b));
      reachL = {target: {x: lerp(stackW.x, holdW.x, q), y: lerp(stackW.y, holdW.y, q)}, k: 1};
    } else if (u < lastCarry) reachL = {target: holdW, k: 1};
    else reachL = {target: holdW, k: 1 - e(pos(u, lastCarry, lastCarry + 0.03))};
  }
  // the right hand: takes the top slip from the stack, carries it to its place, sets it down, comes back
  let reachR = null, inHand = null, active = null;
  for (const i of S.seq) {
    const it = S.items[i];
    const sg = S.segs.filter(q => q.i === i);
    const fetch = sg.find(q => q.kind === 'fetch'), carry = sg.find(q => q.kind === 'carry'), set = sg.find(q => q.kind === 'set'), bk = sg.find(q => q.kind === 'back');
    const slot = G.slots[i];
    const slotT = {x: slot.cx, y: slot.bottom - SLIP.h / 2};
    if (u >= fetch.a && u < fetch.b) { reachR = {target: holdW, k: e(pos(u, fetch.a, fetch.b))}; active = i; }
    else if (u >= carry.a && u < carry.b) { const q = e(pos(u, carry.a, carry.b)); reachR = {target: {x: lerp(holdW.x, slotT.x, q), y: lerp(holdW.y, slotT.y, q)}, k: 1}; inHand = i; active = i; }
    else if (u >= set.a && u < set.b) { reachR = {target: slotT, k: 1}; active = i; }
    else if (u >= bk.a && u < bk.b) { reachR = {target: slotT, k: 1 - e(pos(u, bk.a, bk.b))}; active = i; }
    else if (u >= it.open[0] && u < it.text[1]) active = active ?? i;
  }
  const handR = handOf(pose, reachR, 'armR');
  const handL = handOf(pose, reachL, 'armL');
  // slips: on the lectern (before the pick), then stacked in the left hand, then in the right hand, then placed
  const slips = [];
  const cards = [];
  const tethers = [];
  const states = [];
  let rank = 0;
  for (const i of R.order) {
    const it = S.items[i];
    if (!it) {
      // a slip left on the lectern (supplied final state)
      slips[i] = {x: G.stack.x + 3, y: G.stack.y + 3, deg: 176, opacity: 1};
      cards[i] = {open: 0, text: 0, shown: 0}; tethers[i] = 0; states[i] = 'stack';
      continue;
    }
    const open = e(pos(u, it.open[0], it.open[1]));
    const text = pos(u, it.text[0], it.text[1]);
    let st;
    if (u < it.carryA) {
      st = 'stack';
      const inLeft = u >= (pick.a + pick.b) / 2;
      const base = inLeft ? (u < pick.b ? {x: lerp(stackW.x, holdW.x, e(pos(u, (pick.a + pick.b) / 2, pick.b))), y: lerp(stackW.y, holdW.y, e(pos(u, (pick.a + pick.b) / 2, pick.b)))} : holdW) : stackW;
      slips[i] = {x: base.x + rank * 2, y: base.y - rank * 2, deg: (inLeft ? pose.deg : 180) + (rank % 2 ? 4 : -3), opacity: 1};
      rank++;
    } else if (inHand === i) { st = 'carried'; slips[i] = {x: handR.x, y: handR.y, deg: pose.deg, opacity: 1}; }
    else if (open <= 0) { st = 'placed'; slips[i] = {x: G.slots[i].cx, y: G.slots[i].bottom - SLIP.h / 2, deg: 0, opacity: 1}; }
    else { st = open < 1 ? 'unfolding' : 'open'; slips[i] = null; }
    states[i] = st;
    cards[i] = {open, text, shown: open > 0 ? 1 : 0};
    tethers[i] = pos(u, it.tether[0], it.tether[1]);
  }
  return {presenter: {pose, reach: reachR, reachL}, slips, cards, tethers, states, held: inHand, active, hand: handR, handL, left: nLeft, before, after};
}

/** A hand (world) for a pose and an optional reach. */
export function handOf(pose, reach, arm = 'armR') {
  return reachRecords({name: '_'}, pose, reach ? reach.target : pose, {k: reach ? reach.k : 0, arm}).hand;
}
