/**
 * "Adaptación de accesibilidad" kit (LAW-0237..0240): the ground floor of a
 * generic, fictional civic building drawn as a floor plan — the pavement in
 * front of it, the main entrance with a landing, steps and (when supplied) a
 * ramp beside the steps with handrails, a level side entrance, a corridor with
 * a tactile guidance strip, a wall sign beside the hearing-room door and the
 * hearing room itself (the bench on its platform and a table with places).
 * The concrete action: participants reach the room along the configured route
 * with the help of the visual and physical supports (ramp, handrails, tactile
 * strip, sign).
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md, docs/AUTHORING.md): the building,
 * the room, the people and the supports are fictional placeholders. Which
 * supports exist and which route is taken are SUPPLIED by the author. Nothing
 * here states an accessibility standard, obligation, measurement, right,
 * compliance or consequence. "Barrier detected" is only a supplied
 * observation in the configured example: it is never drawn as a violation
 * (no red, no cross, no alarm glyph). People with disabilities are drawn as
 * active participants, at the same size and detail as everyone else, with no
 * medical framing; the wheelchair and the cane are drawn as their own
 * equipment.
 *
 * The kit owns fields, defaults, strings, the template geometry, the art, the
 * people rigs (a wheelchair user, a person walking with a long cane, a person
 * walking), route solving and a chip placer. Each entry owns its timeline,
 * composition and semantics. Generic plan art comes from ./courts-art.js;
 * text helpers are imported read-only from ./distribucion-de-sala.js and
 * ./presentacion-de-prueba.js.
 * @module animations/courts/kits/adaptacion-accesibilidad
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {planColors, floorArea, wallRing, planDoor, planPlatform, planTable, planChair, planBench, planPlant, planPerson, buildingElevation} from './courts-art.js';
import {roundCorners, applyStatic, glue, fitWords, pxPerUnit, overlaps, R2} from './distribucion-de-sala.js';
import {textAt, planFrame, headTurn, lookAngle} from './presentacion-de-prueba.js';

export {glue, fitWords, pxPerUnit, overlaps, R2, textAt, planFrame, headTurn, lookAngle, applyStatic, buildingElevation, planPerson, planColors};

const INK = '#1f2328';
export const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

/** How a participant moves (drawn as their own equipment; no medical meaning). */
export const MODES = ['wheelchair', 'cane', 'walking'];
/** Places at the table in the hearing room (left, middle, right). */
export const PLACES = ['left', 'mid', 'right'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: courts, routes, seats, labels). */
export const aaFields = {
  courts: obj('Generic, fictional building and hearing room (no real court, building shape or emblem)', {
    building: str('Name printed under the generic building (fictional)', 60),
    room: str('Name of the hearing room (fictional)', 60),
  }, ['building', 'room']),
  seats: list('Participants who reach the room, as supplied: how each one moves (drawn as their own equipment, never as a diagnosis) and their place at the table. Every participant is drawn at the same size', obj('Participant', {
    label: str('Editable label of the participant (as supplied)', 60),
    mode: oneOf('How the participant moves: wheelchair, cane (walks with a long cane) or walking', MODES),
    place: oneOf('Place at the table in the room (left, middle or right)', PLACES),
  }, ['label', 'mode', 'place']), 1, 3),
  routes: list('Arrival order (as supplied), as participant indices; unknown or repeated indices are ignored and unlisted participants follow in list order. The order is shown with the caption "sequence as configured (illustrative)"', obj('Route', {
    seat: int('Index of the participant in `seats`', 0, 2),
  }, ['seat']), 1, 3),
  labels: obj('Editable built-in captions', {
    ramp: str('Caption of the ramp beside the steps (with its handrails)', 60),
    tactile: str('Caption of the tactile guidance strip', 60),
    sign: str('Caption of the wall sign beside the room door', 60),
    key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 90),
  }),
  people: list('Optional appearance of each participant, in order', obj('Person', {appearance}), 0, 3),
};

export const AA_EN = {
  courts: {building: 'Civic building (fictional)', room: 'Hearing room 2 (fictional)'},
  seats: [
    {label: 'Participant A', mode: 'wheelchair', place: 'left'},
    {label: 'Participant B', mode: 'cane', place: 'right'},
  ],
  routes: [{seat: 0}, {seat: 1}],
  labels: {ramp: 'Ramp with handrails', tactile: 'Tactile guidance strip', sign: 'Wall sign by the door', key: 'As supplied · no conclusion drawn'},
  people: [],
};

export const AA_ES = {
  courts: {building: 'Edificio cívico (ficticio)', room: 'Sala de vistas 2 (ficticia)'},
  seats: [
    {label: 'Participante A', mode: 'wheelchair', place: 'left'},
    {label: 'Participante B', mode: 'cane', place: 'right'},
  ],
  routes: AA_EN.routes,
  labels: {ramp: 'Rampa con pasamanos', tactile: 'Franja táctil de guía', sign: 'Señal junto a la puerta', key: 'Según lo aportado · sin conclusión'},
  people: [],
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const AA_LONG = {
  courts: {building: 'Municipal civic services building, east wing (fictional)', room: 'Multipurpose hearing room 2, ground floor (fictional)'},
  seats: [
    {label: 'Participant A, arriving from the pavement', mode: 'wheelchair', place: 'left'},
    {label: 'Participant B, arriving with a long cane', mode: 'cane', place: 'right'},
    {label: 'Participant C, arriving on foot (as supplied)', mode: 'walking', place: 'mid'},
  ],
  routes: [{seat: 0}, {seat: 1}, {seat: 2}],
  labels: {ramp: 'Ramp beside the entrance steps, with handrails', tactile: 'Tactile guidance strip from the door to the room', sign: 'Wall sign with a pictogram beside the room door', key: 'Places, routes and supports are shown as supplied by the author · no conclusion drawn'},
  people: [],
};

export const AA_STRINGS = {
  en: {seq: 'Sequence as configured (illustrative)', was: 'was', wheelchair: 'Moves with a wheelchair', cane: 'Walks with a long cane', walking: 'Walks'},
  es: {seq: 'Secuencia según lo configurado (ilustrativa)', was: 'antes', wheelchair: 'Se desplaza en silla de ruedas', cane: 'Camina con bastón largo', walking: 'Camina'},
};

/**
 * Valid participants (the first use of a place wins; a repeated place takes the next free one), their look,
 * and the arrival order (known index, first use wins; the unlisted follow in list order).
 */
export function resolveAA(ctx, p) {
  const used = new Set();
  const seats = [];
  (p.seats || []).forEach((s, i) => {
    let place = PLACES.includes(s.place) ? s.place : 'mid';
    if (used.has(place)) place = PLACES.find(q => !used.has(q));
    if (!place) return;
    used.add(place);
    seats.push({...s, place, mode: MODES.includes(s.mode) ? s.mode : 'walking', index: i, look: actorLook(ctx, (p.people || [])[i], i)});
  });
  const byIndex = new Map(seats.map(s => [s.index, s]));
  const order = [];
  for (const rt of p.routes || []) { const s = byIndex.get(rt.seat); if (s && !order.includes(s)) order.push(s); }
  for (const s of seats) if (!order.includes(s)) order.push(s);
  seats.forEach(s => { s.rank = order.indexOf(s); });
  return {seats, order};
}

/* ------------------------------------------------------------------ */
/* Geometry (template units; building interior origin top-left)        */
/* ------------------------------------------------------------------ */

export const WALL_T = 18;
/** Smallest template that keeps the entrance, the corridor and the room clear. */
export const AA_MIN = {W: 900, H: 830};
const OUT_MIN = 210;  // least pavement depth in front of the facade (landing + steps + pavement)
const CW_MIN = 156;   // least corridor width
/** Smallest template of a compact plan (two plans side by side). */
export const AA_MIN_COMPACT = {W: 700, H: 640};
const RAMP_L = 270;   // ramp length (drawn, not a requirement)
const RAMP_W = 92;

/** Template size whose extents match a box aspect (so the plan fills it) with k (design units per template unit). */
export function fitAA(box, min = AA_MIN, max = {W: 1700, H: 1500}) {
  const ex = WALL_T * 2;
  const ar = box.w / box.h;
  let W = min.W, H = min.H;
  if (ar > (min.W + ex) / (min.H + WALL_T)) W = Math.round(ar * (min.H + WALL_T) - ex);
  else H = Math.round((min.W + ex) / ar - WALL_T);
  W = Math.min(W, max.W);
  H = Math.min(H, max.H);
  const k = Math.min(box.w / (W + ex), box.h / (H + WALL_T));
  return {W, H, k};
}

/**
 * Plan geometry. `W`, `H` are the drawn extents inside the side walls (interior + pavement).
 * @param {number} W
 * @param {number} H
 */
export function aaGeometry(W, H, {compact = false} = {}) {
  const t = WALL_T;
  // (compact: a shallower pavement and corridor, for two plans side by side)
  const OUT0 = compact ? 196 : OUT_MIN, CW0 = compact ? 146 : CW_MIN;
  const RL = compact ? 180 : RAMP_L, SW = compact ? 150 : 164;
  // (a tall plan gives the pavement and the corridor more depth, so the room does not become an empty hall)
  const OUT = compact ? OUT0 : Math.round(clamp(H * 0.24, OUT0, 330));
  const CW = compact ? CW0 : Math.round(clamp(H * 0.19, CW0, 250));
  const Hi = H - OUT - t;                 // inner face of the facade wall
  const facade = {y0: Hi, y1: Hi + t};
  const out = {x: 0, y: Hi + t, w: W, h: OUT};
  const ex = Math.max(RL + SW / 2 + (compact ? 90 : 110), Math.round(W * 0.4));  // main entrance centre (room for the ramp's approach)
  const doorW = 130;
  const landing = {x: ex - SW / 2, y: Hi + t, w: SW, h: 52};
  const steps = {x: ex - SW / 2, y: landing.y + landing.h, w: SW, h: compact ? 76 : 84, n: 3};
  const ramp = {x: landing.x - RL, y: Hi + t, w: RL, h: RAMP_W, low: 'left'};
  const rails = [
    {a: {x: ramp.x + 6, y: ramp.y + 6}, b: {x: ramp.x + ramp.w, y: ramp.y + 6}},
    {a: {x: ramp.x + 6, y: ramp.y + ramp.h - 6}, b: {x: ramp.x + ramp.w, y: ramp.y + ramp.h - 6}},
    {a: {x: steps.x - 6, y: steps.y + 4}, b: {x: steps.x - 6, y: steps.y + steps.h - 4}},
    {a: {x: steps.x + steps.w + 6, y: steps.y + 4}, b: {x: steps.x + steps.w + 6, y: steps.y + steps.h - 4}},
  ];
  const side = {x: W - (compact ? 100 : 110), w: 120};      // level side entrance (centre, gap width)
  // corridor inside the facade; the room above it on the right, a waiting area on the left
  const corridor = {x: 0, y: Hi - CW, w: W, h: CW};
  const RH = Hi - CW - t;                 // room interior height (y 0..RH)
  const rx0 = compact ? Math.max(116, Math.round(W * 0.14)) : Math.max(150, Math.round(W * 0.16)); // room left wall inner face (a narrow waiting area on its left)
  const room = {x: rx0, y: 0, w: W - rx0, h: RH};
  // room door centre (right of the strip's turn, left of the sign; compact: near the right-hand wall, the sign on its left)
  const rdx = compact ? Math.max(ex + 130, W - 150) : Math.min(ex + 170, W - 250);
  const rdW = 116;
  const roomDoor = {x: rdx, w: rdW, y: RH};
  // the sign: a plate on the corridor face of the room wall, right of the door (face-on, like a plan tile)
  const sign = compact ? {x: rdx - rdW / 2 - 26 - 96, y: RH + t + 6, w: 96, h: 56} : {x: rdx + rdW / 2 + 34, y: RH + t + 6, w: 112, h: 66};
  // the tactile strip: from the main door up to the corridor's upper lane, along it, up to the room door
  const laneT = Hi - CW * (compact ? 0.42 : 0.64), laneW = Hi - CW * (compact ? 0.17 : 0.27);
  const strip = [
    {x: ex + 30, y: landing.y + landing.h - 8},
    {x: ex + 30, y: laneT},
    {x: rdx + 30, y: laneT},
    {x: rdx + 30, y: RH + t + 2},
  ];
  // the room: the bench on its platform, a table with three places facing the bench
  const platform = {x: rx0 + 40, y: 0, w: W - rx0 - 80, h: Math.min(116, RH * (compact ? 0.2 : 0.24))};
  // (the bench desk stands towards the right end of the platform, leaving the left part free for the room name)
  const desk = {cx: platform.x + platform.w - Math.min(250, platform.w * 0.4) / 2 - 30, cy: platform.h * 0.62, w: Math.min(250, platform.w * 0.4), h: 46};
  // the table and its three places stay clear of the room door's swing: beside it when the room is wide enough,
  // otherwise far enough above it
  const tableW = compact ? 310 : 370, half = compact ? 155 : 190;
  const lo = rx0 + half + 40, hi = W - half - 40;
  const leftMax = rdx - rdW / 2 - half - 16, rightMin = rdx + rdW / 2 + half + 16;
  let tcx, placeY;
  // (compact: the places near the bottom of the room, the table just in front of them)
  const yWide = compact ? Math.max(platform.h + 150, RH - 72) : Math.min(RH - 110, Math.max(platform.h + 165, RH * 0.55));
  if (hi >= rightMin && hi - rightMin >= leftMax - lo) { tcx = clamp((rightMin + hi) / 2, rightMin, hi); placeY = yWide; }
  else if (leftMax >= lo) { tcx = clamp((lo + leftMax) / 2, lo, leftMax); placeY = yWide; }
  else { tcx = clamp((rx0 + W) / 2, lo, hi); placeY = Math.min(RH - rdW - 150, Math.max(platform.h + 190, RH * 0.5)); }
  const table = {cx: tcx, cy: placeY - (compact ? 62 : 68), w: tableW, h: compact ? 48 : 56};
  const places = {
    left: {x: tcx - (compact ? 110 : 130), y: placeY, deg: 0},
    mid: {x: tcx, y: placeY, deg: 0},
    right: {x: tcx + (compact ? 110 : 130), y: placeY, deg: 0},
  };
  // the waiting area (left of the room): a bench and a plant
  const bench = {cx: (rx0 - t) / 2 + 6, cy: RH * 0.45, w: Math.min(240, RH * 0.45), deg: 90};
  const plants = [{x: (rx0 - t) / 2, y: 50}, {x: W - 50, y: Hi - CW - 60 > 60 ? Hi - 50 : Hi - 50}];
  const extents = {x: -t, y: -t, w: W + 2 * t, h: H + t};
  return {W, H, t, OUT, CW, Hi, facade, out, ex, doorW, landing, steps, ramp, rails, side, corridor, RH, room, rx0, roomDoor, sign, laneT, laneW, strip, platform, desk, table, places, bench, plants, extents, pavementY: Hi + t + OUT - Math.min(90, OUT * 0.3)};
}

/** Where a participant starts outside (by mode and arrival rank) — spread along the pavement, never on the ramp. */
export function startPoint(G, s, via, {footHigh = false} = {}) {
  const y = G.pavementY;
  // (footHigh — someone takes the lane below the steps to the level side entrance while people on foot still wait:
  // those wait close to the facade right of the steps, clear of that lane)
  const yFoot = footHigh ? Math.min(y, G.Hi + G.t + 74) : y;
  if (s.mode === 'wheelchair') return via === 'side' ? {x: G.side.x - 150 - s.rank * 20, y} : {x: Math.max(62, G.ramp.x - 70), y: G.ramp.y + G.ramp.h + 60};
  // (on foot: to the right of the steps, clear of them, so their label has room)
  // (the cane user nearer the steps, the walking participant one body plus a gap to their right — never on top of
  // each other, even where the side entrance leaves little room)
  // (both clear of the column in front of the level side entrance, which a wheelchair user may take)
  const sideClear = G.side.x - SEP_MIN - 10;
  const cane = Math.max(G.steps.x + G.steps.w + 70, Math.min(G.side.x - 90, G.ex + 190, G.W - 60 - 150, sideClear - 150));
  const walk = Math.min(G.W - 60, Math.max(cane + 150, Math.min(sideClear, G.ex + 310)));
  return {x: s.mode === 'walking' ? walk : cane, y: yFoot};
}

/**
 * Route of one participant (template units) from the pavement to their place.
 * via: 'ramp' (main entrance up the ramp), 'steps' (main entrance up the steps; the long cane follows the strip)
 * or 'side' (the level side entrance).
 */
/**
 * Waiting places in the corridor in front of the room door, as a queue in arrival order (x centres): the first to
 * arrive stands furthest along, nearest the door; each later arrival stops short of the ones already waiting, so
 * nobody passes anybody. Bodies keep clear of the wall sign, the plant, the corridor's end walls and the column in
 * front of the main entrance where later arrivals come in (the queue continues on the far side of it when needed).
 */
export function doorSlots(G) {
  const R = 54, step = 108;
  // (the corridor's plant stands in its lower right corner)
  const lo = G.t + R + 4, hi = Math.min(G.W - G.t - R - 4, G.plants[1].x - 30 - R);
  const colL = G.ex - 30 - SEP_MIN, colR = G.ex + 60 + SEP_MIN;
  const ok = x => x >= lo && x <= hi && !(x + R > G.sign.x - 20 && x - R < G.sign.x + G.sign.w + 20);
  const right = [], left = [];
  for (let j = -3; j <= 12; j++) {
    const x = G.roomDoor.x - j * step;
    if (!ok(x)) continue;
    if (x >= colR && Math.abs(x - G.roomDoor.x) <= 2 * step + 1) right.push(x);
    else if (x <= colL) left.push(x);
  }
  // (right of the entrance column: rightmost first; then left of it, nearest the column first)
  return [...right.sort((a, b) => b - a), ...left.sort((a, b) => b - a)];
}

export function routeFor(G, s, via, {stop = 'place', startVia = null, footHigh = false} = {}) {
  const P = G.places[s.place];
  // (startVia: start where a participant taking that way would wait — e.g. two scenes that begin identically)
  const st = startPoint(G, s, startVia || via, {footHigh});
  const lane = s.mode === 'cane' ? G.laneT : G.laneW;
  const doorX = s.mode === 'cane' ? G.roomDoor.x + 30 : G.roomDoor.x - 26;
  let pts;
  // stop 'door': wait in the corridor in front of the room door (side by side, by place)
  const inRoom = stop === 'door'
    ? [{x: (q => q[Math.min(s.rank ?? 0, q.length - 1)] ?? G.roomDoor.x)(doorSlots(G)), y: G.RH + G.t + 66}]
    // (inside the room: up from the door to a row about a body below the seats, across, then up to the place — so
    // nobody brushes past someone already seated)
    : (() => { const yh = Math.max(Math.min(G.RH - 40, P.y + 120), P.y + 40); return [{x: doorX, y: G.RH + G.t + 30}, {x: doorX, y: yh}, {x: P.x, y: yh}, {x: P.x, y: P.y}]; })();
  if (via === 'side') {
    // (along the pavement below the steps, clear of them)
    const py = Math.max(st.y, G.steps.y + G.steps.h + 62);
    if (py > st.y + 1) pts = [st, {x: st.x, y: py}, {x: G.side.x, y: py}]; else pts = [st, {x: G.side.x, y: st.y}];
    pts = [...pts, {x: G.side.x, y: G.Hi + G.t + 10}, {x: G.side.x, y: lane}, ...(stop === 'door' ? [] : [{x: doorX, y: lane}]), ...inRoom];
  } else if (via === 'ramp') {
    const cy = G.ramp.y + G.ramp.h / 2;
    const x = G.ex - 30;
    pts = [st, {x: G.ramp.x - 40, y: cy}, {x: G.landing.x + 30, y: cy}, {x, y: cy}, {x, y: G.Hi - 10}, {x, y: lane}, ...(stop === 'door' ? [] : [{x: doorX, y: lane}]), ...inRoom];
  } else {
    const x = s.mode === 'cane' ? G.ex + 30 : G.ex + 60;
    // (from beside the facade: down past the foot of the steps, then up them)
    const foot = G.steps.y + G.steps.h;
    const below = st.y < foot ? [{x: st.x, y: foot + 34}, {x, y: foot + 34}] : [{x, y: st.y}];
    pts = [st, ...below, {x, y: foot}, {x, y: G.Hi - 10}, {x, y: lane}, ...(stop === 'door' ? [] : [{x: doorX, y: lane}]), ...inRoom];
  }
  // (no zero-length legs)
  const clean = pts.filter((q, i) => i === 0 || Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) > 1);
  const rounded = roundCorners(clean, 46);
  return {pts: clean, poly: polyline(rounded), via};
}

const lerpDeg = (a, b, t) => { const d = ((((b - a) % 360) + 540) % 360) - 180; return a + d * t; };

/**
 * State of a mover at local progress q ∈ [0,1] along its route: turns from facing the building to the path at the
 * start, heads along the path, turns to face the bench at the end; a steady cadence.
 */
/**
 * The smallest centre distance (template units) between any two participants over u in [0, 1], given their routes and
 * time windows [start, end] (a participant waits at the route start before it and at its end after it).
 */
export function minSeparation(routes, windows, n = 400) {
  let best = Infinity;
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const pts = routes.map((rt, i) => moverAt(rt, clamp((u - windows[i][0]) / Math.max(1e-6, windows[i][1] - windows[i][0]))));
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) best = Math.min(best, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
  }
  return best;
}
/**
 * A yielding schedule (precomputed, deterministic): each participant, in the given priority order, advances along
 * their route at their own nominal pace from their window start, but holds where they are while one more step would
 * bring them closer than `sep` to someone ahead of them in the order — as people wait at a doorway for someone to
 * pass. Returns `at(i, u)` → {q, speed} (q for moverAt; speed 0..1 of the nominal pace), the actual end u of each
 * participant and the smallest centre distance reached.
 */
export function yieldSchedule(routes, windows, order, {n = 1440, sep = SEP_PLAN} = {}) {
  const qs = routes.map(() => new Float64Array(n + 1));
  const pos = (i, q) => moverAt(routes[i], q);
  const done = [];
  for (const i of order) {
    const w = windows[i], rate = 1 / n / Math.max(1e-6, w[1] - w[0]);
    let q = 0;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      if (k > 0 && u > w[0] && q < 1) {
        const cand = Math.min(1, q + rate);
        const a = pos(i, q), b = pos(i, cand);
        // (blocked by someone ahead who is still moving or yet to move: wait; someone who has arrived for good never
        // moves again, so waiting for them would be for ever — then go on)
        const blocked = done.some(j => {
          const qj = qs[j][k], pj = pos(j, qj);
          const dNew = Math.hypot(b.x - pj.x, b.y - pj.y), dOld = Math.hypot(a.x - pj.x, a.y - pj.y);
          return dNew < sep && dNew < dOld - 1e-6 && qj < 1;
        });
        if (!blocked) q = cand;
      }
      qs[i][k] = q;
    }
    done.push(i);
  }
  const at = (i, u) => {
    const x = clamp(u) * n, k = Math.min(n - 1, Math.floor(x)), f = x - k;
    return qs[i][k] + (qs[i][k + 1] - qs[i][k]) * f;
  };
  const ends = routes.map((rt, i) => { for (let k = 0; k <= n; k++) if (qs[i][k] >= 1) return k / n; return 1; });
  let minSep = Infinity;
  for (let k = 0; k <= n; k += 2) {
    const ps = routes.map((rt, i) => pos(i, qs[i][k]));
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) minSep = Math.min(minSep, Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y));
  }
  return {
    at: (i, u) => {
      const q = at(i, u), e = 0.006, w = windows[i];
      const speed = clamp(((at(i, u + e) - at(i, u - e)) / (2 * e)) * (w[1] - w[0]));
      return {q, speed};
    },
    ends, minSep,
  };
}

/** Participants keep at least this centre distance apart while they move (one body plus a little air). */
export const SEP_MIN = 104;
/** Scheduling target (a margin over SEP_MIN, so the rendered distance at any frame rate stays >= SEP_MIN). */
export const SEP_PLAN = 112;

export function moverAt(route, q) {
  const poly = route.poly;
  const turnIn = 0.05, turnOut = 0.08;
  const qw = clamp((q - turnIn) / (1 - turnIn - turnOut));
  const s = ease.inOutSine(qw);
  const p = poly.at(s);
  const head = (poly.at(Math.min(0.998, Math.max(0.002, s))).a * 180) / Math.PI + 90;
  const first = (poly.at(0.002).a * 180) / Math.PI + 90, last = (poly.at(0.998).a * 180) / Math.PI + 90;
  let deg = head;
  if (q < turnIn) deg = lerpDeg(0, first, ease.inOutSine(q / turnIn));
  else if (q > 1 - turnOut) deg = lerpDeg(last, 0, ease.inOutSine((q - (1 - turnOut)) / turnOut));
  const moving = qw > 0 && qw < 1;
  return {x: p.x, y: p.y, deg, dist: s * poly.total, phase: ((s * poly.total) / 36) * Math.PI, walk: moving ? Math.min(1, qw / 0.05, (1 - qw) / 0.05) : 0, moving};
}

/** Boxes of the drawn props (template units), for chip placement and tests. */
export function aaProps(G, {ramp = true, sign = true} = {}) {
  const out = [
    {kind: 'steps', ...G.steps},
    {kind: 'landing', ...G.landing},
    {kind: 'table', x: G.table.cx - G.table.w / 2, y: G.table.cy - G.table.h / 2, w: G.table.w, h: G.table.h},
    // (the platform is a raised floor: chips may rest on it; the bench desk on it is a prop)
    {kind: 'desk', x: G.desk.cx - G.desk.w / 2, y: G.desk.cy - G.desk.h / 2, w: G.desk.w, h: G.desk.h},
    {kind: 'bench', x: G.bench.cx - 30, y: G.bench.cy - G.bench.w / 2, w: 60, h: G.bench.w},
  ];
  if (ramp) out.push({kind: 'ramp', ...G.ramp});
  if (sign) out.push({kind: 'sign', ...G.sign});
  for (const q of G.plants) out.push({kind: 'plant', x: q.x - 24, y: q.y - 24, w: 48, h: 48});
  // the room walls and the facade (chips never sit on a wall)
  const t = G.t;
  out.push({kind: 'wall', x: G.rx0 - t, y: 0, w: t, h: G.RH + t});
  out.push({kind: 'wall', x: G.rx0 - t, y: G.RH, w: G.roomDoor.x - G.roomDoor.w / 2 - G.rx0 + t, h: t});
  out.push({kind: 'wall', x: G.roomDoor.x + G.roomDoor.w / 2, y: G.RH, w: G.W - G.roomDoor.x - G.roomDoor.w / 2, h: t});
  out.push({kind: 'wall', x: 0, y: G.Hi, w: G.W, h: t});
  out.push({kind: 'wall', x: -t, y: -t, w: G.W + 2 * t, h: t});
  out.push({kind: 'wall', x: -t, y: -t, w: t, h: G.Hi + 2 * t});
  out.push({kind: 'wall', x: G.W, y: -t, w: t, h: G.Hi + 2 * t});
  // the tactile strip, as boxes along its legs
  const sw = 30;
  for (let i = 1; i < G.strip.length; i++) {
    const a = G.strip[i - 1], b = G.strip[i];
    out.push({kind: 'strip', x: Math.min(a.x, b.x) - sw / 2, y: Math.min(a.y, b.y) - sw / 2, w: Math.abs(b.x - a.x) + sw, h: Math.abs(b.y - a.y) + sw});
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

export const AA_COL = {
  pavement: '#e4ddd0', paveLine: '#d2c8b7',
  stone: '#e9dfca', stoneEdge: '#b9aa8b',
  ramp: '#dcd6ca', rampLine: '#bdb4a2', rampEdge: '#9d9383',
  rail: '#4f5a66',
  tactile: '#d8a93a', tactileDk: '#9c7418',
  sign: '#2f5b86', signInk: '#f4f1ea',
  chair: '#4b5560', tyre: '#262b31', rim: '#aab3bb',
  cane: '#f6f4ef', caneTip: '#3b4148',
};

/**
 * The plan (one `g` named `${prefix}-plan-art`): walls, floors, the entrance (landing, steps, ramp + handrails when
 * `ramp`), the side entrance, the corridor, the tactile strip (`${prefix}-tactile`), the sign (`${prefix}-sign`, when
 * `sign`), the room (platform, desk, table, the chairs at places not taken by a wheelchair user), the doors.
 * `keep(box)` (template units) filters the pieces drawn (for a lens copy: only pieces wholly inside).
 * Returns {node, doors: {main, side, room}, rampNode?} — doors expose frame(k).
 */
export function aaPlanArt(ctx, G, {prefix, ramp = true, sign = true, wheelchairPlaces = [], keep = null, rampName = null, signName = null}) {
  const c = planColors(ctx);
  const t = G.t;
  const K = b => !keep || keep(b);
  const P = `${prefix}`;
  // pavement with a paver grid
  const pave = [];
  for (let x = 60; x < G.W; x += 60) pave.push(`M${r(x)} ${r(G.out.y)}V${r(G.out.y + G.out.h)}`);
  for (let y = G.out.y + 50; y < G.out.y + G.out.h; y += 50) pave.push(`M0 ${r(y)}H${r(G.W)}`);
  const floorInt = floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: G.W, h: G.Hi, kind: 'tiles', cell: 60});
  const corridor = floorArea(ctx, {name: `${P}-corr`, x: 0, y: G.corridor.y, w: G.W, h: G.corridor.h, kind: 'planks', cell: 70});
  const roomFloor = floorArea(ctx, {name: `${P}-roomfl`, x: G.room.x, y: 0, w: G.room.w, h: G.RH, kind: 'planks', cell: 64, fill: '#efe6d6', line: '#e0d5c1'});
  // walls: outer (left/right/top), the facade with the two entrances, the room walls with the room door
  const gapsFacade = [{side: 'bottom', a: G.ex - G.doorW / 2, b: G.ex + G.doorW / 2}, {side: 'bottom', a: G.side.x - G.side.w / 2, b: G.side.x + G.side.w / 2}];
  const outer = wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: G.W, h: G.Hi, t, gaps: [...gapsFacade, {side: 'left', a: G.corridor.y + 40, b: G.corridor.y + 130, kind: 'window'}, {side: 'top', a: G.W * 0.18, b: G.W * 0.18 + 120, kind: 'window'}]});
  const roomWalls = wallRing(ctx, {name: `${P}-rwalls`, x: G.room.x, y: 0, w: G.room.w, h: G.RH, t, sides: ['left', 'bottom'], gaps: [{side: 'bottom', a: G.roomDoor.x - G.roomDoor.w / 2, b: G.roomDoor.x + G.roomDoor.w / 2}]});
  // entrance: landing, steps (treads + nosing), handrails beside the steps
  const L = G.landing, S = G.steps;
  const treads = [];
  for (let i = 1; i < S.n; i++) treads.push(`M${r(S.x)} ${r(S.y + (S.h * i) / S.n)}H${r(S.x + S.w)}`);
  const stepsNode = K(S) ? g({name: `${P}-steps`},
    h('rect', {x: r(L.x), y: r(L.y), width: r(L.w), height: r(L.h), fill: AA_COL.stone, stroke: AA_COL.stoneEdge, 'stroke-width': 2}),
    h('rect', {x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), fill: shade(AA_COL.stone, -0.04), stroke: AA_COL.stoneEdge, 'stroke-width': 2}),
    h('path', {d: treads.join(''), stroke: AA_COL.stoneEdge, 'stroke-width': 3}),
    // the tactile warning band at the top of the steps (dots)
    dotsBand(L.x + 8, L.y + L.h - 16, L.w - 16, 12),
    g({name: `${P}-srails`}, G.rails.slice(2).map(q => railNode(q)))) : null;
  // the ramp with its two handrails and its grooves (drawn only when supplied)
  const R = G.ramp;
  const grooves = [];
  for (let x = R.x + 24; x < R.x + R.w - 6; x += 22) grooves.push(`M${r(x)} ${r(R.y + 12)}V${r(R.y + R.h - 12)}`);
  const rampNode = ramp && K(R) ? g({name: rampName ?? `${P}-ramp`},
    h('path', {d: `M${r(R.x)} ${r(R.y)}H${r(R.x + R.w)}V${r(R.y + R.h)}H${r(R.x)}Z`, fill: AA_COL.ramp, stroke: AA_COL.rampEdge, 'stroke-width': 2.2}),
    h('path', {d: grooves.join(''), stroke: AA_COL.rampLine, 'stroke-width': 2}),
    G.rails.slice(0, 2).map(q => railNode(q))) : null;
  // the tactile strip (solid ochre, guidance bars along it; dot tiles at the turns)
  const strip = stripNode(G.strip, `${P}-tactile`);
  // (a lens copy leaves the strip out unless it lies wholly inside the crop: no prop is drawn cut by the rim)
  const sx = G.strip.map(q => q.x), sy = G.strip.map(q => q.y);
  const stripBox = {x: Math.min(...sx) - 17, y: Math.min(...sy) - 17, w: Math.max(...sx) - Math.min(...sx) + 34, h: Math.max(...sy) - Math.min(...sy) + 34};
  const stripShown = K(stripBox);
  // the sign (face-on plate on the corridor face of the room wall): a door glyph and a wheelchair pictogram
  const signNode = sign && K(G.sign) ? signArt(G.sign, signName ?? `${P}-sign`) : null;
  // room furniture
  const taken = new Set(wheelchairPlaces);
  const chairs = PLACES.filter(pl => !taken.has(pl)).map(pl => planChair(ctx, {name: `${P}-chair-${pl}`, cx: G.places[pl].x, cy: G.places[pl].y + 4, deg: 0, s: 60}));
  const doors = {
    main: slidingDoors(ctx, `${P}-dmain`, G.ex, G.Hi, G.doorW, t),
    side: slidingDoors(ctx, `${P}-dside`, G.side.x, G.Hi, G.side.w, t),
    room: planDoor(ctx, {name: `${P}-droom`, hinge: {x: G.roomDoor.x - G.roomDoor.w / 2, y: G.RH + t / 2}, width: G.roomDoor.w, closedDeg: 0, openDeg: -80}),
  };
  // (a lens copy leaves out any door not wholly inside the crop; its frame() then sets nothing)
  const doorShown = {
    main: K({x: G.ex - G.doorW / 2, y: G.Hi - 4, w: G.doorW, h: t + 8}),
    side: K({x: G.side.x - G.side.w / 2, y: G.Hi - 4, w: G.side.w, h: t + 8}),
    room: K({x: G.roomDoor.x - G.roomDoor.w / 2, y: G.RH - G.roomDoor.w, w: G.roomDoor.w, h: G.roomDoor.w + t}),
  };
  for (const kd of ['main', 'side', 'room']) if (!doorShown[kd]) doors[kd] = {...doors[kd], frame: () => ({})};
  const tableBox = {x: G.table.cx - G.table.w / 2, y: G.table.cy - G.table.h / 2, w: G.table.w, h: G.table.h};
  const benchBox = {x: G.bench.cx - 30, y: G.bench.cy - G.bench.w / 2, w: 60, h: G.bench.w};
  const node = g({name: `${P}-plan-art`},
    h('rect', {x: 0, y: r(G.out.y), width: r(G.W), height: r(G.out.h), fill: AA_COL.pavement}),
    h('path', {d: pave.join(''), stroke: AA_COL.paveLine, 'stroke-width': 1.4}),
    floorInt, corridor, roomFloor,
    K(G.platform) ? planPlatform(ctx, {name: `${P}-platform`, ...G.platform, edge: 'bottom'}) : null,
    K(G.platform) ? planTable(ctx, {name: `${P}-desk`, cx: G.desk.cx, cy: G.desk.cy, w: G.desk.w, h: G.desk.h, front: 'bottom', seedKey: `${P}-dk`}) : null,
    K(tableBox) ? planTable(ctx, {name: `${P}-table`, cx: G.table.cx, cy: G.table.cy, w: G.table.w, h: G.table.h, front: 'bottom', seedKey: `${P}-tb`}) : null,
    K(tableBox) ? chairs : null,
    K(benchBox) ? planBench(ctx, {name: `${P}-bench`, cx: G.bench.cx, cy: G.bench.cy, w: G.bench.w, deg: G.bench.deg}) : null,
    G.plants.map((q, i) => (K({x: q.x - 24, y: q.y - 24, w: 48, h: 48}) ? planPlant(ctx, {name: `${P}-plant${i}`, cx: q.x, cy: q.y, s: 46, seedKey: `${P}-pl${i}`}) : null)),
    stripShown ? strip.node : null,
    stepsNode, rampNode,
    outer, roomWalls,
    doorShown.main ? doors.main.node : null, doorShown.side ? doors.side.node : null, doorShown.room ? doors.room.node : null,
    signNode,
  );
  return {node, doors, stripPoly: strip.poly};
}

function railNode(q) {
  const posts = [];
  const L = Math.hypot(q.b.x - q.a.x, q.b.y - q.a.y);
  const n = Math.max(2, Math.round(L / 70));
  for (let i = 0; i <= n; i++) posts.push(h('circle', {cx: r(lerp(q.a.x, q.b.x, i / n)), cy: r(lerp(q.a.y, q.b.y, i / n)), r: 5, fill: AA_COL.rail}));
  return g(null,
    h('line', {x1: r(q.a.x), y1: r(q.a.y), x2: r(q.b.x), y2: r(q.b.y), stroke: AA_COL.rail, 'stroke-width': 5.5, 'stroke-linecap': 'round'}),
    posts);
}

function dotsBand(x, y, w, hh) {
  const dots = [];
  for (let xx = x + 6; xx < x + w - 2; xx += 12) dots.push(h('circle', {cx: r(xx), cy: r(y + hh / 2), r: 2.6, fill: AA_COL.tactileDk}));
  return g(null, h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 2, fill: AA_COL.tactile}), dots);
}

/** The tactile strip: a solid ochre band with guidance bars along each leg and dot tiles at the corners. */
export function stripNode(pts, name) {
  const w = 30;
  const parts = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const hor = Math.abs(b.y - a.y) < 1;
    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
    const box = hor ? {x: x0 - w / 2, y: a.y - w / 2, w: Math.abs(b.x - a.x) + w, h: w} : {x: a.x - w / 2, y: y0 - w / 2, w, h: Math.abs(b.y - a.y) + w};
    parts.push(h('rect', {x: r(box.x), y: r(box.y), width: r(box.w), height: r(box.h), fill: AA_COL.tactile, stroke: AA_COL.tactileDk, 'stroke-width': 1.4}));
    // guidance ribs: continuous solid lines along the direction of travel (never a dash pattern)
    const ribs = [];
    const len = hor ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y);
    if (len > 24) {
      for (const off of [-7, 7]) {
        if (hor) ribs.push(`M${r(x0 + 12)} ${r(a.y + off)}H${r(x0 + len - 12)}`);
        else ribs.push(`M${r(a.x + off)} ${r(y0 + 12)}V${r(y0 + len - 12)}`);
      }
    }
    parts.push(h('path', {d: ribs.join(''), stroke: AA_COL.tactileDk, 'stroke-width': 3.2, 'stroke-linecap': 'round'}));
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const q = pts[i];
    const dots = [];
    for (let dx = -9; dx <= 9; dx += 9) for (let dy = -9; dy <= 9; dy += 9) dots.push(h('circle', {cx: r(q.x + dx), cy: r(q.y + dy), r: 2.8, fill: AA_COL.tactileDk}));
    parts.push(h('rect', {x: r(q.x - w / 2 - 2), y: r(q.y - w / 2 - 2), width: w + 4, height: w + 4, fill: AA_COL.tactile, stroke: AA_COL.tactileDk, 'stroke-width': 1.4}), dots);
  }
  return {node: g({name}, parts), poly: polyline(pts)};
}

/** Wall sign (face-on): a blue plate with a door glyph and a wheelchair pictogram; no text. */
export function signArt(S, name) {
  const cx1 = S.x + S.w * 0.3, cx2 = S.x + S.w * 0.7, cy = S.y + S.h / 2;
  const u = S.h / 66;
  return g({name},
    h('path', {d: roundRectPath(S.x + 3, S.y + 5, S.w, S.h, 8), fill: 'rgba(0,0,0,0.18)'}),
    h('path', {d: roundRectPath(S.x, S.y, S.w, S.h, 8), fill: AA_COL.sign, stroke: INK, 'stroke-width': 2.2}),
    // door glyph
    h('rect', {x: r(cx1 - 12 * u), y: r(cy - 20 * u), width: r(24 * u), height: r(40 * u), rx: 2, fill: 'none', stroke: AA_COL.signInk, 'stroke-width': r(3.4 * u, 2)}),
    h('circle', {cx: r(cx1 + 6 * u), cy: r(cy + 2 * u), r: r(2.6 * u, 2), fill: AA_COL.signInk}),
    // wheelchair pictogram (head, seat and back, wheel)
    h('circle', {cx: r(cx2 - 3 * u), cy: r(cy - 19 * u), r: r(4.2 * u, 2), fill: AA_COL.signInk}),
    h('path', {d: `M${r(cx2 - 5 * u)} ${r(cy - 12 * u)}V${r(cy + 2 * u)}H${r(cx2 + 9 * u)}L${r(cx2 + 13 * u)} ${r(cy + 14 * u)}`, fill: 'none', stroke: AA_COL.signInk, 'stroke-width': r(3.6 * u, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(cx2 - 5 * u)} ${r(cy - 5 * u)}H${r(cx2 + 6 * u)}`, stroke: AA_COL.signInk, 'stroke-width': r(3.2 * u, 2), 'stroke-linecap': 'round'}),
    h('circle', {cx: r(cx2 - 1 * u), cy: r(cy + 9 * u), r: r(11 * u, 2), fill: 'none', stroke: AA_COL.signInk, 'stroke-width': r(3.2 * u, 2)}),
  );
}

/** Two sliding leaves in a facade gap; frame(k) opens them (k ∈ [0,1]). */
function slidingDoors(ctx, name, cx, y, w, t) {
  const c = planColors(ctx);
  const leaf = side => h('rect', {name: `${name}-${side}`, x: r(side === 'l' ? cx - w / 2 : cx), y: r(y + t / 2 - 4), width: r(w / 2), height: 8, rx: 2, fill: c.glass, stroke: INK, 'stroke-width': 1.6, transform: 'translate(0 0)'});
  const node = g({name}, leaf('l'), leaf('r'));
  const frame = k => ({[`${name}-l`]: {transform: `translate(${r(-k * w * 0.42)} 0)`}, [`${name}-r`]: {transform: `translate(${r(k * w * 0.42)} 0)`}});
  return {node, frame};
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

/**
 * A participant rig: the plan person plus their own equipment (a wheelchair, a long cane) in one moving group
 * `${name}-at`. The person node is `${name}` (head `${name}-head`) at the group's origin.
 * pose({x, y, deg, phase, walk, seated}) → node records.
 */
export function aaPerson(ctx, {name, look, mode}) {
  const pp = planPerson(ctx, {name, look});
  let under = null, over = null;
  if (mode === 'wheelchair') {
    const wheel = side => g(null,
      h('rect', {x: r(side * 47 - 7), y: -40, width: 14, height: 78, rx: 7, fill: AA_COL.tyre}),
      h('rect', {x: r(side * 47 - 2.5), y: -34, width: 5, height: 66, rx: 2.5, fill: AA_COL.rim}));
    under = g({name: `${name}-wc`},
      h('ellipse', {cx: 3, cy: 6, rx: 60, ry: 52, fill: ctx.theme.shadow}),
      // frame, seat, backrest, footrest, casters
      h('path', {d: roundRectPath(-38, -34, 76, 70, 8), fill: AA_COL.chair, stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(-40, 26, 80, 14, 5), fill: shade(AA_COL.chair, -0.3), stroke: INK, 'stroke-width': 2}),
      h('path', {d: 'M-22 -36V-58M22 -36V-58', stroke: AA_COL.chair, 'stroke-width': 5, 'stroke-linecap': 'round'}),
      h('path', {d: roundRectPath(-26, -64, 52, 10, 3), fill: shade(AA_COL.chair, -0.2), stroke: INK, 'stroke-width': 1.6}),
      h('circle', {cx: -30, cy: -50, r: 6, fill: AA_COL.tyre}), h('circle', {cx: 30, cy: -50, r: 6, fill: AA_COL.tyre}),
      wheel(-1), wheel(1));
  } else if (mode === 'cane') {
    over = h('line', {name: `${name}-cane`, x1: 30, y1: -44, x2: 40, y2: -128, stroke: AA_COL.cane, 'stroke-width': 5, 'stroke-linecap': 'round'});
    under = h('line', {name: `${name}-cane-o`, x1: 30, y1: -44, x2: 40, y2: -128, stroke: INK, 'stroke-width': 8.5, 'stroke-linecap': 'round'});
  }
  const tip = mode === 'cane' ? h('circle', {name: `${name}-tip`, cx: 40, cy: -128, r: 4.5, fill: AA_COL.caneTip}) : null;
  const node = g({name: `${name}-at`, transform: 'translate(0 0)'}, under, pp.node, mode === 'cane' ? g(null, over, tip) : null);
  function pose(s) {
    const rec = {};
    const seated = mode === 'wheelchair' ? 1 : (s.seated ?? 0);
    Object.assign(rec, pp.pose({x: 0, y: mode === 'wheelchair' ? 4 : 0, deg: 0, phase: s.phase ?? 0, walk: s.walk ?? 0, seated}));
    rec[`${name}-at`] = {transform: T(s.x, s.y, s.deg ?? 0, s.scale ?? 1)};
    if (mode === 'wheelchair') {
      // hands on the push rims; a push stroke while moving
      const push = (s.walk ?? 0) > 0 ? Math.sin(s.phase ?? 0) : 0;
      for (const [key, side] of [['armL', -1], ['armR', 1]]) {
        const hx = side * 44, hy = -8 + 14 * push * (s.walk ?? 0);
        const line = {x1: r(side * 32), y1: -4, x2: r(hx), y2: r(hy)};
        rec[`${name}-${key}-o`] = line;
        rec[`${name}-${key}-i`] = line;
        rec[`${name}-${key}-h`] = {cx: r(hx), cy: r(hy)};
      }
    } else if (mode === 'cane') {
      // right hand forward holding the long cane; the tip sweeps along the path while walking, rests beside the chair when seated
      // (s.hold: standing still — e.g. waiting at the room door — the cane is held close, its tip beside the feet)
      const held = Math.max(seated, clamp(s.hold ?? 0));
      const w = (s.walk ?? 0) * (1 - held);
      const hand = {x: lerp(30, 40, held), y: lerp(-40, -8, held)};
      const sweep = Math.sin((s.phase ?? 0) / 2) * 30 * w;
      const tipP = {x: lerp(34 + sweep, 58, held), y: lerp(-128, seated ? -64 : -52, held)};
      const line = {x1: r(hand.x), y1: r(hand.y), x2: r(tipP.x), y2: r(tipP.y)};
      rec[`${name}-armR-o`] = {x1: 30, y1: -2, x2: r(hand.x), y2: r(hand.y)};
      rec[`${name}-armR-i`] = {x1: 30, y1: -2, x2: r(hand.x), y2: r(hand.y)};
      rec[`${name}-armR-h`] = {cx: r(hand.x), cy: r(hand.y)};
      rec[`${name}-cane`] = line;
      rec[`${name}-cane-o`] = line;
      rec[`${name}-tip`] = {cx: r(tipP.x), cy: r(tipP.y)};
    }
    return rec;
  }
  return {node, pose, mode};
}

/* ------------------------------------------------------------------ */
/* Legend glyphs (design units, origin at the glyph centre)            */
/* ------------------------------------------------------------------ */

export function aaGlyph(ctx, kind, s, look) {
  if (kind === 'wheelchair' || kind === 'cane' || kind === 'walking') {
    const pp = aaPerson(ctx, {name: 'lg-p', look, mode: kind});
    const rec = pp.pose({x: 0, y: kind === 'cane' ? s * 0.18 : 0, deg: 0, scale: s / (kind === 'cane' ? 150 : 118), phase: 1.2, walk: kind === 'walking' ? 0.6 : 0.5});
    return applyStatic(pp.node, rec);
  }
  if (kind === 'ramp') {
    const w = s * 1.1, hh = s * 0.5;
    const lines = [];
    for (let x = -w / 2 + 8; x < w / 2 - 3; x += 8) lines.push(`M${r(x)} ${r(-hh / 2 + 5)}V${r(hh / 2 - 5)}`);
    return g(null,
      h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), fill: AA_COL.ramp, stroke: AA_COL.rampEdge, 'stroke-width': 1.6}),
      h('path', {d: lines.join(''), stroke: AA_COL.rampLine, 'stroke-width': 1.5}),
      h('path', {d: `M${r(-w / 2 + 2)} ${r(-hh / 2 + 3)}H${r(w / 2)}M${r(-w / 2 + 2)} ${r(hh / 2 - 3)}H${r(w / 2)}`, stroke: AA_COL.rail, 'stroke-width': 3.2, 'stroke-linecap': 'round'}));
  }
  if (kind === 'tactile') return g({transform: T(0, 0, 0, s / 60)}, stripNode([{x: -26, y: 0}, {x: 26, y: 0}], 'lg-t').node);
  if (kind === 'sign') return signArt({x: -s * 0.55, y: -s * 0.33, w: s * 1.1, h: s * 0.66}, 'lg-s');
  if (kind === 'steps') {
    const w = s * 0.9, hh = s * 0.6;
    return g(null,
      h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), fill: AA_COL.stone, stroke: AA_COL.stoneEdge, 'stroke-width': 1.6}),
      h('path', {d: `M${r(-w / 2)} ${r(-hh / 6)}H${r(w / 2)}M${r(-w / 2)} ${r(hh / 6)}H${r(w / 2)}`, stroke: AA_COL.stoneEdge, 'stroke-width': 2}));
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Chip placement near an anchor (design units)                        */
/* ------------------------------------------------------------------ */

// (exact segment / rectangle test — Liang–Barsky clipping — so a long leader never steps over a thin wall; the
// segment's own end points are excluded by a hair so a leader may start or end on a box's edge)
const segHitsBox = (a, b, q, pad = 0) => {
  const x0 = q.x - pad, x1 = q.x + q.w + pad, y0 = q.y - pad, y1 = q.y + q.h + pad;
  const dx = b.x - a.x, dy = b.y - a.y;
  let t0 = 0.001, t1 = 0.999;
  for (const [pp, qq] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]]) {
    if (pp === 0) { if (qq <= 0) return false; continue; }
    const r0 = qq / pp;
    if (pp < 0) { if (r0 > t1) return false; if (r0 > t0) t0 = r0; } else { if (r0 < t0) return false; if (r0 < t1) t1 = r0; }
  }
  return t0 < t1;
};
export {segHitsBox};

/**
 * Place a w × h chip near an anchor circle {x, y, rad}: candidates on 16 directions at growing gaps; rejected when
 * outside `bounds`, over a `hard` box, or when the leader crosses a `hard` box; `soft` boxes add cost. The nearest
 * clear candidate wins. Returns {box, from, to, gap, clear}.
 */
export function placeChip({w, h: hh, anchor, bounds, hard = [], soft = [], gaps = [10, 20, 34, 52, 76, 104, 140, 180, 230, 290, 360], prefer = null, stats = null, leadHard = null, accept = null}) {
  let best = null;
  for (const gap of gaps) {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      // chip centre so that its nearest edge is `gap` beyond the anchor circle
      const ex = Math.abs(dx) * w / 2 + Math.abs(dy) * hh / 2;
      const d = anchor.rad + gap + ex;
      const box = {x: anchor.x + dx * d - w / 2, y: anchor.y + dy * d - hh / 2, w, h: hh};
      if (box.x < bounds.x || box.y < bounds.y || box.x + w > bounds.x + bounds.w || box.y + hh > bounds.y + bounds.h) { if (stats) stats.out = (stats.out || 0) + 1; continue; }
      const hit = hard.find(q => overlaps(box, q, 3));
      if (hit) { if (stats) { const kk = hit.kind || 'other'; stats[kk] = (stats[kk] || 0) + 1; } continue; }
      const from = {x: clamp(anchor.x, box.x + 8, box.x + w - 8), y: clamp(anchor.y, box.y + 6, box.y + hh - 6)};
      if (anchor.y > box.y + hh) from.y = box.y + hh; else if (anchor.y < box.y) from.y = box.y; else from.x = anchor.x > box.x + w / 2 ? box.x + w : box.x;
      const len = Math.hypot(anchor.x - from.x, anchor.y - from.y) || 1;
      const to = {x: anchor.x - ((anchor.x - from.x) / len) * anchor.rad * 0.9, y: anchor.y - ((anchor.y - from.y) / len) * anchor.rad * 0.9};
      // (the leader ends inside the anchor's own circle: a box holding the anchor centre — its own head — is exempt)
      const own = q => anchor.x >= q.x && anchor.x <= q.x + q.w && anchor.y >= q.y && anchor.y <= q.y + q.h;
      if ((leadHard || hard).some(q => !own(q) && segHitsBox(from, to, q, 0))) { if (stats) stats.lead = (stats.lead || 0) + 1; continue; }
      if (accept && !accept(box)) { if (stats) stats.accept = (stats.accept || 0) + 1; continue; }
      let cost = gap + (prefer != null ? Math.abs(((((a * 180) / Math.PI - prefer) % 360) + 540) % 360 - 180) * 0.15 : 0);
      for (const q of soft) if (overlaps(box, q, 2)) cost += 60;
      if (!best || cost < best.cost) best = {box, from, to, gap, cost, clear: true};
    }
    if (best) break;
  }
  return best;
}

/** A chip with a leader (group `${name}`, body `${name}-body`, text `${name}-text`, leader `${name}-lead`). */
export function chipNode(ctx, P, {name, fit, owner}) {
  const th = ctx.theme;
  const b = P.box;
  const baseline = b.y + (b.h - fit.height) / 2 + fit.size * 0.8;
  return g({name, opacity: 0, 'data-owner': owner},
    P.from ? h('line', {name: `${name}-lead`, x1: r(P.from.x), y1: r(P.from.y), x2: r(P.to.x), y2: r(P.to.y), stroke: th.ink, 'stroke-width': 2.5, 'stroke-linecap': 'round'}) : null,
    P.from ? h('circle', {cx: r(P.to.x), cy: r(P.to.y), r: 4.5, fill: th.ink}) : null,
    h('path', {name: `${name}-body`, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2, fit.size * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
    h('text', {name: `${name}-text`, x: r(b.x + b.w / 2), y: r(baseline), 'font-family': FONT, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'text-anchor': 'middle', fill: th.ink},
      fit.lines.map((ln, i) => h('tspan', {x: r(b.x + b.w / 2), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln))),
  );
}

/** Fit a chip text: whole words, glued numbers, up to `lines` lines. */
export function chipFit(text, F, maxW, lines = 3, weight = 600) {
  const fit = fitWords(glue(text), {maxWidth: maxW, size: F, minSize: F, maxLines: lines, weight});
  return {fit, w: fit.width + F * 1.1, h: fit.height + F * 0.62};
}

export {INK, shade, T};

/* ------------------------------------------------------------------ */
/* Side panel (column beside the plan, or band above/below it)         */
/* ------------------------------------------------------------------ */

/**
 * Measure a panel: the generic building (+ its name chip) and a stack of items:
 *  {type:'legend', kind, text, look?} glyph + caption · {type:'note', i, text} solid neutral ring + note ·
 *  {type:'caption', text} italic caption · {type:'state', text} state chip · {type:'key', text} rule + italic key.
 * Column: building on top, then the name, then the items. Band: building (and name) on the left, items right.
 * Returns {ok, box, …} for aaPanelNodes; ok = nothing truncated and everything fits.
 */
export function aaPanelMeasure(ctx, {flow, box, F, items, nameText, minBld = 0.08, legendCols = 1}) {
  const th = ctx.theme;
  const gap = F * 0.62;
  const textW = flow === 'column' ? box.w : box.w * 0.62;
  const glyph = F * 2.1;
  const colGap = F * 0.8;
  const legW = legendCols === 2 ? (textW - colGap) / 2 : textW;
  const fitT = (t, w, lines = 3, weight = 500) => fitWords(glue(t), {maxWidth: w, size: F, minSize: F, maxLines: lines, weight});
  const its = items.map(it => {
    if (it.type === 'legend') return {...it, glyph, fit: fitT(it.text, legW - glyph - 12, it.sub ? 2 : 3, it.sub ? 700 : 500), fit2: it.sub ? fitT(it.sub, legW - glyph - 12, 3) : null};
    if (it.type === 'note') return {...it, fit: fitT(it.text, textW - F * 1.9 - 12, 4)};
    if (it.type === 'caption') return {...it, fit: fitT(it.text, textW, 3, 500)};
    if (it.type === 'state') return {...it, fit: fitT(it.text, textW - F * 1.2, 3, 700)};
    return {...it, fit: fitT(it.text, textW - 12, 4)};
  });
  const hOne = it => (it.type === 'legend' ? Math.max(it.glyph, it.fit.height + (it.fit2 ? it.fit2.height + F * 0.34 : 0)) : it.type === 'state' ? it.fit.height + F * 0.76 : it.type === 'key' ? it.fit.height + F * 0.45 : it.fit.height);
  // two legend columns: consecutive legend items pair up in rows
  if (legendCols === 2) {
    const rows = [];
    for (let i = 0; i < its.length; i++) {
      const it = its[i];
      if (it.type === 'legend' && its[i + 1] && its[i + 1].type === 'legend') { rows.push({type: 'pair', a: it, b: its[i + 1]}); i++; } else rows.push(it);
    }
    its.length = 0; its.push(...rows);
  }
  const hOf = it => (it.type === 'pair' ? Math.max(hOne(it.a), hOne(it.b)) : hOne(it));
  const nameW = flow === 'column' ? box.w : box.w - textW - 24;
  const nameFit = nameText ? fitT(nameText, nameW - F * 1.2, 3, 600) : null;
  const nameH = nameFit ? nameFit.height + F * 0.76 : 0;
  const tr = it => it.fit.truncated || (it.fit2 && it.fit2.truncated);
  const truncated = its.some(it => (it.type === 'pair' ? tr(it.a) || tr(it.b) : tr(it))) || (nameFit && nameFit.truncated);
  const textH = its.reduce((a, it) => a + hOf(it) + gap, 0) - (its.length ? gap : 0);
  let bld, ok;
  if (flow === 'column') {
    const bh = Math.min(box.h - textH - nameH - gap * 2 - F * 0.6, box.w * 0.95, box.h * 0.46);
    bld = {w: Math.min(box.w, bh / 0.9), h: bh};
    ok = !truncated && bh >= Math.min(110, box.h * minBld);
  } else {
    const bw = Math.min(nameW, box.h * 1.15);
    const bh = Math.min(bw * 0.95, box.h - nameH - gap);
    bld = {w: bh / 0.95, h: bh};
    ok = !truncated && textH <= box.h - F * 0.4 && bh >= box.h * 0.4;
  }
  void th;
  return {flow, box, items: its, nameFit, nameW, bld, ok, gap, textW, hOf, textH, F, legW, colGap};
}

/** Nodes of a measured panel: {nodes, bldBox, stateNode, itemBoxes}. The building itself is drawn by the caller in bldBox. */
export function aaPanelNodes(ctx, pan, {noteColor, look}) {
  const th = ctx.theme;
  const F = pan.F;
  const nodes = [];
  let stateNode = null;
  const B = pan.box;
  const itemBoxes = [];
  const nameChip = (cx, y) => {
    const f = pan.nameFit;
    const w = f.width + F * 1.2, hh = f.height + F * 0.76;
    const b = {x: cx - w / 2, y, w, h: hh};
    nodes.push(g({name: 'bld-name'},
      h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(hh / 2, F * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
      textAt(f, cx, y + F * 0.38, th.ink, {anchor: 'middle', weight: 600})));
    return b;
  };
  const place = (it, x, y) => {
    const hh = pan.hOf(it);
    if (it.type === 'pair') {
      place({...it.a, rowH: hh}, x, y);
      place({...it.b, rowH: hh}, x + pan.legW + pan.colGap, y);
      itemBoxes.pop(); itemBoxes.pop();
      itemBoxes.push({type: 'pair', x, y, w: pan.textW, h: hh});
      return;
    }
    if (it.type === 'legend') {
      const hh2 = it.rowH ?? hh;
      const gl = aaGlyph(ctx, it.kind, it.glyph, it.look || look);
      const th2 = it.fit.height + (it.fit2 ? it.fit2.height + F * 0.34 : 0);
      const ty = y + (hh2 - th2) / 2;
      nodes.push(g({name: `legend-${it.key || it.kind}`},
        g({transform: T(x + it.glyph / 2, y + hh2 / 2)}, gl),
        textAt(it.fit, x + it.glyph + 12, ty, th.fg),
        it.fit2 ? textAt(it.fit2, x + it.glyph + 12, ty + it.fit.height + F * 0.34, th.fg) : null));
    } else if (it.type === 'note') {
      const rr = F * 0.62;
      nodes.push(g({name: `note${it.i}`, opacity: 0},
        h('circle', {cx: r(x + rr + 2), cy: r(y + F * 0.55), r: r(rr), fill: 'none', stroke: noteColor, 'stroke-width': 4}),
        textAt(it.fit, x + F * 1.9 + 12, y, th.fg)));
    } else if (it.type === 'caption') {
      nodes.push(g({name: `cap-${it.key || 'seq'}`}, textAt(it.fit, x, y, th.fgSoft, {italic: true})));
    } else if (it.type === 'state') {
      const w = it.fit.width + F * 1.2;
      stateNode = g(null,
        h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, F * 0.7)), fill: th.card, stroke: th.accent4, 'stroke-width': 2.4}),
        textAt(it.fit, x + w / 2, y + F * 0.38, th.ink, {anchor: 'middle', weight: 700}));
    } else {
      nodes.push(g({name: 'key'},
        h('path', {d: `M${r(x)} ${r(y)}H${r(x + Math.min(pan.textW, it.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
        textAt(it.fit, x, y + F * 0.45, th.fgSoft, {italic: true})));
    }
    itemBoxes.push({type: it.type, x, y, w: pan.textW, h: hh});
  };
  let bldBox;
  if (pan.flow === 'column') {
    let y = B.y;
    bldBox = {x: B.x + (B.w - pan.bld.w) / 2, y, w: pan.bld.w, h: pan.bld.h};
    y += pan.bld.h + pan.gap;
    if (pan.nameFit) { const b = nameChip(B.x + B.w / 2, y); y += b.h + pan.gap; }
    y += Math.max(0, (B.y + B.h - y - pan.textH) * 0.3);
    for (const it of pan.items) { place(it, B.x, y); y += pan.hOf(it) + pan.gap; }
  } else {
    bldBox = {x: B.x + (pan.nameW - pan.bld.w) / 2, y: B.y, w: pan.bld.w, h: pan.bld.h};
    if (pan.nameFit) nameChip(B.x + pan.nameW / 2, B.y + pan.bld.h + pan.gap * 0.6);
    const tx = B.x + B.w - pan.textW;
    let y = B.y + Math.max(0, (B.h - pan.textH) / 2);
    for (const it of pan.items) { place(it, tx, y); y += pan.hOf(it) + pan.gap; }
  }
  return {nodes, bldBox, stateNode, itemBoxes};
}

/**
 * A grid of legend items (glyph + caption) in `cols` columns inside `box` (a strip under or over the plan).
 * Returns {ok, h, nodes(y0)} — nodes laid from y0.
 */
export function aaGrid(ctx, {box, F, items, cols, look}) {
  const th = ctx.theme;
  const colGap = F * 0.9, rowGap = F * 0.5;
  const glyph = F * 2.1;
  const cw = (box.w - (cols - 1) * colGap) / cols;
  const its = items.map(it => ({...it, fit: fitWords(glue(it.text), {maxWidth: cw - glyph - 12, size: F, minSize: F, maxLines: 3, weight: 500})}));
  const rows = [];
  for (let i = 0; i < its.length; i += cols) rows.push(its.slice(i, i + cols));
  const rh = rows.map(rw => Math.max(glyph, ...rw.map(it => it.fit.height)));
  const hh = rh.reduce((a, v) => a + v + rowGap, 0) - rowGap;
  const ok = !its.some(it => it.fit.truncated) && hh <= box.h + 0.5;
  const nodes = y0 => {
    const out = [];
    let y = y0;
    rows.forEach((rw, ri) => {
      rw.forEach((it, ci) => {
        const x = box.x + ci * (cw + colGap);
        out.push(g({name: `legend-${it.key || it.kind}`},
          g({transform: T(x + glyph / 2, y + rh[ri] / 2)}, aaGlyph(ctx, it.kind, glyph, it.look || look)),
          textAt(it.fit, x + glyph + 12, y + (rh[ri] - it.fit.height) / 2, th.fg)));
      });
      y += rh[ri] + rowGap;
    });
    return out;
  };
  return {ok, h: hh, nodes};
}

/* ------------------------------------------------------------------ */
/* Exploded parts (mechanism): each drawn in its own local units       */
/* ------------------------------------------------------------------ */

/**
 * The entrance lifted out of the plan: a stretch of facade with the door, the landing, the steps with a handrail on
 * each side and (when supplied) the ramp beside them with its two handrails. Local box {x, y, w, h}.
 */
export function entrancePiece(ctx, {name, ramp = true}) {
  const c = planColors(ctx);
  const landing = {x: 190, y: 0, w: 140, h: 46}, steps = {x: 190, y: 46, w: 140, h: 74, n: 3};
  const R = {x: 8, y: 0, w: 182, h: 92};
  const treads = [];
  for (let i = 1; i < steps.n; i++) treads.push(`M${steps.x} ${r(steps.y + (steps.h * i) / steps.n)}H${steps.x + steps.w}`);
  const grooves = [];
  for (let x = R.x + 24; x < R.x + R.w - 6; x += 22) grooves.push(`M${r(x)} ${R.y + 12}V${R.y + R.h - 12}`);
  const pave = [];
  for (let x = 40; x < 350; x += 50) pave.push(`M${x} 138V238`);
  for (let y = 172; y < 238; y += 34) pave.push(`M0 ${y}H350`);
  const node = g({name},
    // the pavement in front of the entrance (pavers)
    h('rect', {x: 0, y: 138, width: 350, height: 100, rx: 6, fill: AA_COL.pavement}),
    h('path', {d: pave.join(''), stroke: AA_COL.paveLine, 'stroke-width': 1.4}),
    // a stretch of facade with the entrance door (open)
    h('path', {d: 'M170 -18H206V0H170ZM314 -18H350V0H314Z', fill: c.wall, stroke: c.wallEdge, 'stroke-width': 1.5}),
    h('rect', {x: 206, y: -13, width: 20, height: 8, rx: 2, fill: c.glass, stroke: INK, 'stroke-width': 1.4}),
    h('rect', {x: 294, y: -13, width: 20, height: 8, rx: 2, fill: c.glass, stroke: INK, 'stroke-width': 1.4}),
    h('rect', {x: landing.x, y: landing.y, width: landing.w, height: landing.h, fill: AA_COL.stone, stroke: AA_COL.stoneEdge, 'stroke-width': 2}),
    h('rect', {x: steps.x, y: steps.y, width: steps.w, height: steps.h, fill: shade(AA_COL.stone, -0.04), stroke: AA_COL.stoneEdge, 'stroke-width': 2}),
    h('path', {d: treads.join(''), stroke: AA_COL.stoneEdge, 'stroke-width': 3}),
    dotsBand(landing.x + 8, landing.y + landing.h - 16, landing.w - 16, 12),
    railNode({a: {x: steps.x - 6, y: steps.y + 4}, b: {x: steps.x - 6, y: steps.y + steps.h - 4}}),
    railNode({a: {x: steps.x + steps.w + 6, y: steps.y + 4}, b: {x: steps.x + steps.w + 6, y: steps.y + steps.h - 4}}),
    ramp ? g({name: `${name}-ramp`},
      h('rect', {x: R.x, y: R.y, width: R.w, height: R.h, fill: AA_COL.ramp, stroke: AA_COL.rampEdge, 'stroke-width': 2.2}),
      h('path', {d: grooves.join(''), stroke: AA_COL.rampLine, 'stroke-width': 2}),
      railNode({a: {x: R.x + 6, y: R.y + 6}, b: {x: R.x + R.w, y: R.y + 6}}),
      railNode({a: {x: R.x + 6, y: R.y + R.h - 6}, b: {x: R.x + R.w, y: R.y + R.h - 6}})) : null,
  );
  return {node, box: {x: 0, y: -18, w: 350, h: 256}, rampBox: R, landing, steps, rampMid: {x: R.x + R.w * 0.52, y: R.y + R.h / 2}, door: {x: 260, y: -9}};
}

/** A stretch of the tactile strip (an L: up from the entrance door, then along the corridor). Local box. */
export function stripPiece(ctx, {name}) {
  const pts = [{x: 30, y: 220}, {x: 30, y: 30}, {x: 230, y: 30}];
  const s = stripNode(pts, name);
  return {node: s.node, box: {x: 0, y: 0, w: 260, h: 250}, pts, walkAt: {x: 30, y: 150}};
}

/** The wall sign lifted out with its stretch of wall. Local box. */
export function signPiece(ctx, {name}) {
  const c = planColors(ctx);
  const S = {x: 170, y: 26, w: 112, h: 66};
  const node = g(null,
    // a stretch of the corridor floor, the room wall with its door and the sign beside it
    floorArea(ctx, {name: `${name}-fl`, x: 0, y: 18, w: 300, h: 150, kind: 'planks', cell: 70}),
    h('path', {d: 'M0 0H10V18H0ZM118 0H300V18H118Z', fill: c.wall, stroke: c.wallEdge, 'stroke-width': 1.5}),
    signArt(S, name));
  return {node, box: {x: 0, y: 0, w: 300, h: 168}, plate: S};
}

/**
 * The hearing room lifted out: walls with the door in the bottom wall, the platform with the bench desk, a table with
 * three places (no chair at the places given to a wheelchair user). Local box (walls included).
 */
export function roomPiece(ctx, {name, wheelchairPlaces = []}) {
  const t = WALL_T;
  const W0 = 330, H0 = 230;
  const door = {a: 190, b: 290};
  const walls = wallRing(ctx, {name: `${name}-walls`, x: 0, y: 0, w: W0, h: H0, t, gaps: [{side: 'bottom', a: door.a, b: door.b}]});
  const places = {left: {x: 70, y: 180}, mid: {x: 165, y: 180}, right: {x: 260, y: 180}};
  const taken = new Set(wheelchairPlaces);
  const node = g({name},
    floorArea(ctx, {name: `${name}-floor`, x: 0, y: 0, w: W0, h: H0, kind: 'planks', cell: 64, fill: '#efe6d6', line: '#e0d5c1'}),
    planPlatform(ctx, {name: `${name}-platform`, x: 24, y: 0, w: 282, h: 62, edge: 'bottom'}),
    planTable(ctx, {name: `${name}-desk`, cx: 220, cy: 36, w: 150, h: 36, front: 'bottom', seedKey: `${name}-dk`}),
    planTable(ctx, {name: `${name}-table`, cx: 165, cy: 122, w: 280, h: 46, front: 'bottom', seedKey: `${name}-tb`}),
    PLACES.filter(pl => !taken.has(pl)).map(pl => planChair(ctx, {name: `${name}-chair-${pl}`, cx: places[pl].x, cy: places[pl].y + 4, deg: 0, s: 58})),
    walls,
  );
  return {node, box: {x: -t, y: -t, w: W0 + 2 * t, h: H0 + 2 * t}, places, door: {x: (door.a + door.b) / 2, y: H0 + t / 2}, tableBox: {x: 25, y: 99, w: 280, h: 46}, deskBox: {x: 145, y: 18, w: 150, h: 36}};
}

/* ------------------------------------------------------------------ */
/* Locale defaults                                                     */
/* ------------------------------------------------------------------ */

/**
 * Wrap a scene so that, with locale "es", every top-level param still equal to its English default is replaced by
 * its Spanish default. A value the author supplied (anything that differs from the default) is never replaced; other
 * locales render as before. layout, build and frame all see the same localised params.
 */
export function localizeAA(scene, defaults, es) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const cache = new WeakMap();
  const view = ctx => {
    const p = ctx.params;
    if (!p || p.locale !== 'es') return ctx;
    let c = cache.get(ctx);
    if (c) return c;
    const q = {...p};
    let changed = false;
    for (const [k, v] of Object.entries(es)) if (k in defaults && same(p[k], defaults[k])) { q[k] = v; changed = true; }
    c = changed ? {...ctx, params: q} : ctx;
    cache.set(ctx, c);
    return c;
  };
  return {
    ...scene,
    layout: (ctx, ...a) => scene.layout(view(ctx), ...a),
    build: (ctx, ...a) => scene.build(view(ctx), ...a),
    frame: (ctx, ...a) => scene.frame(view(ctx), ...a),
  };
}
