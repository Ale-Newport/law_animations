/**
 * "Acceso a sala" kit (LAW-0217..0220): a generic, fictional room inside a
 * generic building, drawn as a floor plan, with TWO separate supplied access
 * routes: a corridor along the bottom wall with its door ("Public access") and
 * a corridor along the left wall with its door ("Restricted access as
 * configured"). Both corridors start at the same entrance hall (the lobby in
 * the bottom-left corner). Participants wait in the corridors (or the lobby),
 * walk along their supplied route through their door to their supplied seat,
 * turn and sit; each seat's editable label arrives as its occupant lands.
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md, AUTHORING "Legal content"):
 *  - the building, the room, the routes, the seats and every label are
 *    SUPPLIED and fictional; the scene shows only which route each supplied
 *    participant uses and which seat they reach, as supplied;
 *  - nothing states or implies who may attend, security rules, exclusion,
 *    privacy law, time limits or any outcome;
 *  - the two routes have EQUAL visual weight: same corridor width and floor,
 *    same door leaf, same solid route line weight, same badge size; they are
 *    told apart by symmetric cues only (a solid ● or ◆ glyph in a badge and the
 *    lane colours accent2 / accent4). No lock, no red, no "denied" wording, and
 *    no dashes or faded strokes (dashes mean disputed/pending in this library):
 *    the door swing arcs and route lines are solid for both routes.
 *
 * The kit owns fields, defaults, strings, the plan geometry (template units),
 * route planning, walker timing, the plan art and legend glyphs. Each entry
 * owns its own timeline, composition and semantics. Generic art comes from
 * ./courts-art.js; the walker solver, label placer, side captions and the
 * glue-aware fitting come from ./distribucion-de-sala.js (read-only imports).
 * @module animations/courts/kits/acceso-a-sala
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {chip} from '../../../primitives/annotate.js';
import {
  planColors, floorArea, planTable, planChair, planBench, planPlant, planPerson, PERSON,
} from './courts-art.js';
import {roundCorners, glue, fitWords, applyStatic} from './distribucion-de-sala.js';

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

/** Seat positions of the generic room: two tables (front row) and two benches (back row). */
export const SLOTS = ['front1', 'front2', 'front3', 'front4', 'back1', 'back2', 'back3', 'back4'];
/** The two supplied access routes. */
export const ACCESS = ['public', 'restricted'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a route or role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: courts, routes, seats, labels). */
export const accessFields = {
  courts: obj('Generic, fictional building and room (no real court, building shape or emblem)', {
    building: str('Name printed under the generic building (fictional)', 60),
    room: str('Name of the room drawn as a plan (fictional)', 60),
  }, ['building', 'room']),
  seats: list('Seats of the plan: a fixed position in the generic room and the editable label of its occupant, revealed when the seat is taken. Positions and labels are as supplied and carry no legal meaning', obj('Seat', {
    slot: oneOf('Position in the generic room: front1–front4 (the two tables) or back1–back4 (the two benches)', SLOTS),
    label: str('Editable label of the participant on this seat (as supplied)', 60),
  }, ['slot', 'label']), 2, 6),
  routes: list('Who walks to which seat by which supplied access route, in entrance order (as supplied). A route to an unknown or already taken seat is ignored', obj('Route', {
    seat: int('Index of the seat in `seats`', 0, 5),
    access: oneOf('Supplied access route: public (corridor and door on the bottom wall) or restricted (corridor and door on the left wall, restricted access as configured)', ACCESS),
  }, ['seat', 'access']), 1, 6),
  labels: obj('Editable built-in captions', {
    publicAccess: str('Caption of the public access route and its door', 50),
    restrictedAccess: str('Caption of the restricted access route and its door (as configured)', 60),
    key: str('Neutral key shown with the labels (must say that the data are as supplied and no conclusion is drawn)', 100),
  }),
  people: list('Optional appearance of the person on each route, in route order', obj('Person', {appearance}), 0, 6),
};

export const ACCESS_EN = {
  courts: {building: 'Civic building (fictional)', room: 'Room 3 (fictional)'},
  seats: [
    {slot: 'front1', label: 'Participant A'},
    {slot: 'front3', label: 'Participant B'},
    {slot: 'back1', label: 'Participant C'},
    {slot: 'back4', label: 'Participant D'},
  ],
  routes: [
    {seat: 0, access: 'restricted'},
    {seat: 1, access: 'public'},
    {seat: 2, access: 'public'},
    {seat: 3, access: 'restricted'},
  ],
  labels: {publicAccess: 'Public access', restrictedAccess: 'Restricted access as configured', key: 'Routes, seats and labels as supplied · no conclusion drawn'},
  people: [],
};

export const ACCESS_ES = {
  courts: {building: 'Edificio cívico (ficticio)', room: 'Sala 3 (ficticia)'},
  seats: [
    {slot: 'front1', label: 'Participante A'},
    {slot: 'front3', label: 'Participante B'},
    {slot: 'back1', label: 'Participante C'},
    {slot: 'back4', label: 'Participante D'},
  ],
  routes: ACCESS_EN.routes,
  labels: {publicAccess: 'Acceso público', restrictedAccess: 'Acceso restringido configurado', key: 'Recorridos, asientos y etiquetas según lo aportado · sin conclusión'},
  people: [],
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const ACCESS_LONG = {
  courts: {building: 'Municipal civic services building, east wing (fictional)', room: 'Multipurpose room 3 on the ground floor (fictional)'},
  seats: [
    {slot: 'front1', label: 'Participant A at the left-hand table (as supplied)'},
    {slot: 'front2', label: 'Representative of participant A (as supplied)'},
    {slot: 'front3', label: 'Participant B at the right-hand table (as supplied)'},
    {slot: 'front4', label: 'Representative of participant B (as supplied)'},
    {slot: 'back1', label: 'Participant C on the left-hand bench (as supplied)'},
    {slot: 'back4', label: 'Participant D on the right-hand bench (as supplied)'},
  ],
  routes: [
    {seat: 0, access: 'restricted'},
    {seat: 2, access: 'public'},
    {seat: 1, access: 'restricted'},
    {seat: 4, access: 'public'},
    {seat: 3, access: 'public'},
    {seat: 5, access: 'restricted'},
  ],
  labels: {
    publicAccess: 'Public access from the entrance hall (as supplied)',
    restrictedAccess: 'Restricted access as configured from the entrance hall',
    key: 'Routes, seats and labels are shown as supplied by the author · no conclusion drawn',
  },
  people: [],
};

export const ACCESS_STRINGS = {
  en: {seated: 'seated', waiting: 'waiting', allSeated: 'Everyone seated (as supplied)', lastWaiting: 'Last person still waiting (as supplied)', was: 'was'},
  es: {seated: 'sentado', waiting: 'esperando', allSeated: 'Todos sentados (según lo aportado)', lastWaiting: 'La última persona sigue esperando (según lo aportado)', was: 'antes'},
};

/* ------------------------------------------------------------------ */
/* Resolved params                                                     */
/* ------------------------------------------------------------------ */

/**
 * Valid seats (first use of a slot wins) and valid routes (known seat, first
 * route to a seat wins), with each walker's look.
 */
export function resolveAccess(ctx, p) {
  const seen = new Set();
  const seats = [];
  p.seats.forEach((s, i) => {
    if (seen.has(s.slot)) return;
    seen.add(s.slot);
    seats.push({...s, index: i});
  });
  const bySeatIndex = new Map(seats.map(s => [s.index, s]));
  const taken = new Set();
  const routes = [];
  p.routes.forEach((rt, i) => {
    const seat = bySeatIndex.get(rt.seat);
    if (!seat || taken.has(rt.seat)) return;
    taken.add(rt.seat);
    routes.push({...rt, index: i, slot: seat.slot, label: seat.label, look: actorLook(ctx, (p.people || [])[routes.length], routes.length)});
  });
  return {seats, routes};
}

/** Lane colour of an access route (symmetric: both are solid, same weight). */
export const accessColor = (ctx, access) => (access === 'public' ? ctx.theme.accent2 : ctx.theme.accent4);

/* ------------------------------------------------------------------ */
/* Plan geometry (template units)                                      */
/* ------------------------------------------------------------------ */

export const WALL = 18;
export const CORR = 150;
/** Smallest room interior that keeps two seat rows, the aisles and the doors clear. */
export const ROOM_MIN = {W: 760, H: 680};
/** Compact plan (paired scenes): narrower corridors and margins, same person size and zones for labels. */
export const COMPACT = {cw: 112, t: 14, margin: 46, min: {W: 600, H: 560}};
const SPACING = 98;

/** Template extents around the room interior (left corridor + bottom corridor + walls). */
export const extra = ({cw = CORR, t = WALL} = {}) => 3 * t + cw;

/**
 * Interior size whose plan extents match a box aspect, so the plan fills the
 * box: {W, H, k} with k = design units per template unit.
 */
export function fitAccess(box, {cw = CORR, t = WALL, min = ROOM_MIN, maxW = 1500, maxH = 1300} = {}) {
  const ex = extra({cw, t});
  const ar = box.w / box.h;
  let W = min.W, H = min.H;
  if (ar > (min.W + ex) / (min.H + ex)) W = Math.round(ar * (min.H + ex) - ex);
  else H = Math.round((min.W + ex) / ar - ex);
  W = Math.min(W, maxW);
  H = Math.min(H, maxH);
  const k = Math.min(box.w / (W + ex), box.h / (H + ex));
  return {W, H, k};
}

/**
 * Geometry of the room (interior origin = its top-left, front at the top), the
 * restricted corridor along its left wall, the public corridor along its
 * bottom wall and the lobby in the corner where both corridors start.
 * @param {number} W interior width (>= ROOM_MIN.W)
 * @param {number} H interior height (>= ROOM_MIN.H)
 */
export function accessGeometry(W, H, {cw = CORR, t = WALL, margin = 72, min = ROOM_MIN} = {}) {
  // wide rooms spread their furniture (wider centre aisle and tables) instead of leaving an empty floor
  const aisle = Math.round(Math.min(230, Math.max(140, W * 0.18)));
  const tableW = Math.round(Math.min(300, Math.max(176, (W - aisle - 2 * margin) / 2)));
  const tableH = 54;
  // zones (front to back): a front zone above the tables, the chair row, the middle aisle with one lane per route,
  // the bench row and a back zone behind the benches; the front and back zones hold the seat labels
  const extraH = Math.max(0, H - min.H);
  const tableY = Math.round(178 - (ROOM_MIN.H - min.H) * 0.5 + extraH * 0.22);
  const chairY = tableY + 64;
  const benchY = Math.round(H - 172 + (ROOM_MIN.H - min.H) * 0.5 - extraH * 0.22);
  const benchD = 56;
  const lx = W / 2 - aisle / 2 - tableW / 2, rx = W / 2 + aisle / 2 + tableW / 2;
  // chairs at the table ends, so a label centred on its own person never reaches over the neighbouring chair
  const seatOff = tableW / 2 - 20;
  const benchOff = tableW / 2 - 26;
  const slots = {
    front1: {x: lx - seatOff, y: chairY, deg: 0, kind: 'chair'},
    front2: {x: lx + seatOff, y: chairY, deg: 0, kind: 'chair'},
    front3: {x: rx - seatOff, y: chairY, deg: 0, kind: 'chair'},
    front4: {x: rx + seatOff, y: chairY, deg: 0, kind: 'chair'},
    back1: {x: lx - benchOff, y: benchY - 14, deg: 0, kind: 'bench'},
    back2: {x: lx + benchOff, y: benchY - 14, deg: 0, kind: 'bench'},
    back3: {x: rx - benchOff, y: benchY - 14, deg: 0, kind: 'bench'},
    back4: {x: rx + benchOff, y: benchY - 14, deg: 0, kind: 'bench'},
  };
  const tables = [{cx: lx, cy: tableY, w: tableW, h: tableH}, {cx: rx, cy: tableY, w: tableW, h: tableH}];
  const benches = [{cx: lx, cy: benchY, w: tableW, d: benchD}, {cx: rx, cy: benchY, w: tableW, d: benchD}];
  // the middle aisle between the chair row and the bench row; each route keeps its own lane in it
  const yM = Math.round((chairY + 50 + benchY - 14 - 50) / 2);
  const yR = yM - 14, yP = yM + 14;
  const half = 58;
  const rc = {x: -t - cw, y: 0, w: cw, h: H};
  const pc = {x: 0, y: H + t, w: W, h: cw};
  const lobby = {x: -t - cw, y: H + t, w: cw, h: cw};
  const rcx = rc.x + cw / 2, pcy = pc.y + cw / 2;
  const doors = {
    restricted: {side: 'left', a: yR - half, b: yR + half, gate: {x: -t / 2, y: yR}, out: {x: rcx, y: yR}, in: {x: 66, y: yR}},
    public: {side: 'bottom', a: W / 2 - half, b: W / 2 + half, gate: {x: W / 2, y: H + t / 2}, out: {x: W / 2, y: pcy}, in: {x: W / 2, y: H - 66}},
  };
  // waiting spots along each corridor, nearest to its door first (alternating sides)
  const spots = {restricted: [], public: []};
  {
    const below = [], above = [];
    for (let i = 1; i < 12; i++) { const y = yR + i * SPACING; if (y <= H - 50) below.push({x: rcx, y, deg: 0}); }
    for (let i = 1; i < 12; i++) { const y = yR - i * SPACING; if (y >= 50) above.push({x: rcx, y, deg: 180}); }
    for (let i = 0; i < 12; i++) { if (below[i]) spots.restricted.push(below[i]); if (above[i]) spots.restricted.push(above[i]); }
    const left = [], right = [];
    for (let i = 1; i < 16; i++) { const x = W / 2 - i * SPACING; if (x >= 50) left.push({x, y: pcy, deg: 90}); }
    for (let i = 1; i < 16; i++) { const x = W / 2 + i * SPACING; if (x <= W - 50) right.push({x, y: pcy, deg: 270}); }
    for (let i = 0; i < 16; i++) { if (left[i]) spots.public.push(left[i]); if (right[i]) spots.public.push(right[i]); }
  }
  const lobbySpot = {x: rcx, y: pcy, deg: 45};
  // openings between the lobby and each corridor (the lobby is the shared entrance hall)
  const openings = {restricted: {x: rcx, y: H + t / 2}, public: {x: -t / 2, y: pcy}};
  const room = {x: 0, y: 0, w: W, h: H};
  const extents = {x: -2 * t - cw, y: -t, w: W + 3 * t + cw, h: H + 3 * t + cw};
  const plants = [{x: 44, y: 44}, {x: W - 44, y: 44}];
  const badges = {
    restricted: {x: -t / 2, y: yR - half - 34},
    public: {x: W / 2 - half - 34, y: H + t / 2},
  };
  return {W, H, t, cw, aisle, tableW, tableH, tableY, chairY, benchY, benchD, lx, rx, slots, tables, benches, yM, yR, yP, rc, pc, lobby, doors, spots, lobbySpot, openings, room, extents, plants, badges, half};
}

/** Furniture boxes (template units) — obstacles for labels. */
export function furnitureBoxes(G, chairs = null) {
  const out = [];
  for (const tb of G.tables) out.push({kind: 'table', x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h});
  for (const bn of G.benches) out.push({kind: 'bench', x: bn.cx - bn.w / 2, y: bn.cy - bn.d / 2, w: bn.w, h: bn.d});
  for (const [name, s] of Object.entries(G.slots)) if (s.kind === 'chair' && (!chairs || chairs.has(name))) out.push({kind: 'chair', slot: name, x: s.x - 33, y: s.y - 33, w: 66, h: 66});
  for (const pl of G.plants) out.push({kind: 'plant', x: pl.x - 25, y: pl.y - 25, w: 50, h: 50});
  return out;
}

/**
 * Route (template units) from a waiting spot along the supplied access route,
 * through its door, along its own lane of the middle aisle, to the seat.
 */
export function accessRoute(G, slot, access, spot, fromLobby = false, map = null) {
  const S = G.slots[slot];
  const D = G.doors[access];
  const pts = [{x: spot.x, y: spot.y}];
  if (access === 'restricted') {
    if (fromLobby) pts.push({...G.openings.restricted});
    pts.push({...D.out}, {...D.gate}, {...D.in}, {x: S.x, y: G.yR}, {x: S.x, y: S.y});
  } else {
    if (fromLobby) pts.push({...G.openings.public});
    pts.push({...D.out}, {...D.gate}, {...D.in}, {x: G.W / 2, y: G.yP}, {x: S.x, y: G.yP}, {x: S.x, y: S.y});
  }
  // `map` moves each corner into an exploded plan (each part keeps its own offset; the straight segment between the
  // last point of one part and the first of the next crosses the gap along the passage)
  return roundCorners(dedupe(map ? pts.map(map) : pts), 44);
}

/** The part of the plan a template point belongs to: lobby, rc (restricted corridor), pc (public corridor) or room. */
export function partOf(G, q) {
  const {H, t} = G;
  if ((q.y > H && q.x < -t) || (q.y > H + t && q.x < 0)) return 'lobby';
  if (q.x < -t) return 'rc';
  if (q.y > H + t) return 'pc';
  return 'room';
}

/** Unit offsets of the parts in the exploded plan (multiplied by the gap). */
export const EXPLODE = {room: {x: 0, y: 0}, rc: {x: -1, y: 0}, pc: {x: 0, y: 1}, lobby: {x: -1, y: 1}};

function dedupe(pts) {
  const out = [];
  for (const q of pts) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(q.x - last.x, q.y - last.y) > 1) out.push(q);
  }
  const res = [out[0]];
  for (let i = 1; i < out.length - 1; i++) {
    const a = res[res.length - 1], b = out[i], c = out[i + 1];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    const back = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y) < 0;
    if (Math.abs(cross) > 1e-6 || back) res.push(b);
  }
  if (out.length > 1) res.push(out[out.length - 1]);
  return res;
}

/**
 * Plan the walkers: a waiting spot per access route (nearest its door first,
 * in route order; `lobby` lists route positions that wait in the lobby
 * instead), the route polyline and each walk's window inside [a, b].
 * `access(i)` may override the supplied access of walker i (contrast scenes).
 * Speed is shared; starts are staggered; everyone has landed by b.
 */
export function planAccessWalkers(G, routes, {a, b, lobby = [], access = null, windows = null, map = null, clearLobbyPath = false}) {
  const used = {restricted: 0, public: 0};
  // opt-in: when someone starts in the hall, the queues wait beyond their doors (never on the hall's way to a door)
  const spotsOf = acc => (clearLobbyPath && lobby.length
    ? (acc === 'restricted' ? G.spots.restricted.filter(q => q.y < G.yR) : G.spots.public.filter(q => q.x > G.W / 2))
    : G.spots[acc]);
  const walkers = routes.map((rt, i) => {
    const acc = access ? access(i) : rt.access;
    const inLobby = lobby.includes(i);
    let spot;
    if (inLobby) spot = G.lobbySpot;
    else {
      const list0 = spotsOf(acc).length ? spotsOf(acc) : G.spots[acc];
      spot = list0[Math.min(used[acc]++, list0.length - 1)];
    }
    const pts = accessRoute(G, rt.slot, acc, spot, inLobby, map);
    const poly = polyline(pts);
    const S = map ? map(G.slots[rt.slot]) : G.slots[rt.slot];
    const sp = map ? {...map(spot), deg: spot.deg} : spot;
    return {i, route: rt, access: acc, spot: sp, pts, poly, seat: {x: S.x, y: S.y, deg: G.slots[rt.slot].deg}, slot: rt.slot, inLobby};
  });
  if (!walkers.length) return walkers;
  const win = windows || walkWindows(walkers.map(w => w.poly.total), a, b);
  walkers.forEach((w, i) => { w.start = win[i][0]; w.end = win[i][1]; });
  return walkers;
}

/**
 * Walk windows inside [a, b] for route lengths: durations proportional to
 * length (shared speed), starts staggered, everyone landed by b.
 */
export function walkWindows(lengths, a, b) {
  const n = lengths.length;
  const span = b - a;
  const maxLen = Math.max(...lengths);
  const maxDur = Math.min(0.26, span);
  let dur = lengths.map(l => maxDur * (0.3 + 0.7 * (l / maxLen)));
  let gap = 0;
  if (n > 1) {
    gap = 0.12;
    for (let i = 1; i < n; i++) gap = Math.min(gap, (span - dur[i]) / i);
    gap = Math.max(0.04, gap);
    dur = dur.map((d, i) => Math.min(d, span - i * gap));
  }
  return dur.map((d, i) => [a + i * gap, Math.min(b, a + i * gap + Math.max(0.04, d))]);
}

/** Door opening 0..1 from the nearest moving walker around a door gate (template units). */
export function doorOpen(G, access, positions) {
  const gate = G.doors[access].gate;
  let k = 0;
  for (const p of positions.filter(q => q.walk > 0 || q.state === 'walking')) {
    const d = Math.hypot(p.x - gate.x, p.y - gate.y);
    k = Math.max(k, clamp(1 - (d - 70) / 110));
  }
  return ease.inOutSine(k);
}

/** Drop points that keep a polyline within tol (Ramer–Douglas–Peucker); keeps the label placer fast. */
export function simplify(pts, tol = 2) {
  if (pts.length < 3) return pts.slice();
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = -1, mi = -1;
    const A = pts[a], B = pts[b];
    const dx = B.x - A.x, dy = B.y - A.y;
    const L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i].x - A.x) - dx * (pts[i].y - A.y)) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol) { keep[mi] = true; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Does a polyline pass within tol of a point? */
export function passesNear(pts, q, tol) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L2 = dx * dx + dy * dy || 1;
    const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / L2);
    if (Math.hypot(a.x + dx * t - q.x, a.y + dy * t - q.y) <= tol) return true;
  }
  return false;
}

/** Is a template point inside the room interior? */
export const inRoom = (G, q) => q.x > 0 && q.x < G.W && q.y > 0 && q.y < G.H;
/** Is a template point at one of the two door gaps? */
export const atDoor = (G, q) => Object.values(G.doors).some(d => Math.hypot(q.x - d.gate.x, q.y - d.gate.y) < 90);

/* ------------------------------------------------------------------ */
/* Art (template units)                                                */
/* ------------------------------------------------------------------ */

/** Solid wall pieces (poché) from template rectangles. */
function walls(ctx, name, rects) {
  const c = planColors(ctx);
  const d = rects.filter(q => q.w > 0.5 && q.h > 0.5).map(q => `M${r(q.x)} ${r(q.y)}h${r(q.w)}v${r(q.h)}h${r(-q.w)}Z`).join('');
  return h('path', {name, d, fill: c.wall, stroke: c.wallEdge, 'stroke-width': 1.5, 'stroke-linejoin': 'round'});
}

/** Horizontal/vertical wall run with gaps: [{a,b}] along the run. */
function run(x0, y0, len, thick, horizontal, gaps) {
  const out = [];
  let cur = horizontal ? x0 : y0;
  const end = cur + len;
  for (const q of gaps.slice().sort((p, q2) => p.a - q2.a)) {
    if (q.a > cur) out.push(horizontal ? {x: cur, y: y0, w: q.a - cur, h: thick} : {x: x0, y: cur, w: thick, h: q.a - cur});
    cur = Math.max(cur, q.b);
  }
  if (cur < end) out.push(horizontal ? {x: cur, y: y0, w: end - cur, h: thick} : {x: x0, y: cur, w: thick, h: end - cur});
  return out;
}

/** Glass in a wall gap (window). */
function windowGlass(ctx, q, horizontal) {
  const c = planColors(ctx);
  return g(null,
    h('rect', {x: r(q.x), y: r(q.y), width: r(q.w), height: r(q.h), fill: c.glass, stroke: c.wallEdge, 'stroke-width': 1.5}),
    h('path', {d: horizontal ? `M${r(q.x)} ${r(q.y + q.h / 2)}H${r(q.x + q.w)}` : `M${r(q.x + q.w / 2)} ${r(q.y)}V${r(q.y + q.h)}`, stroke: c.wallEdge, 'stroke-width': 1.2}));
}

/**
 * Door leaf on a hinge with a SOLID thin swing arc (the same for both routes;
 * no dashes). frame(k) sets the open fraction k ∈ [0, 1].
 */
export function accessDoor(ctx, o) {
  const c = planColors(ctx);
  const {hinge, width} = o;
  const a0 = (o.closedDeg * Math.PI) / 180;
  const a1 = ((o.closedDeg + o.openDeg) * Math.PI) / 180;
  const P = a => ({x: hinge.x + Math.cos(a) * width, y: hinge.y + Math.sin(a) * width});
  const p0 = P(a0), p1 = P(a1);
  const sweep = o.openDeg > 0 ? 1 : 0;
  const node = g({name: o.name},
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}A${r(width)} ${r(width)} 0 0 ${sweep} ${r(p1.x)} ${r(p1.y)}`, fill: 'none', stroke: c.frame, 'stroke-width': 1.8, opacity: 0.55}),
    g({name: `${o.name}-leaf`, transform: `rotate(0 ${r(hinge.x)} ${r(hinge.y)})`},
      h('rect', {x: r(hinge.x), y: r(hinge.y - 4.5), width: r(width), height: 9, rx: 3, fill: c.woodDark, stroke: '#1f2328', 'stroke-width': 1.6, transform: `rotate(${r(o.closedDeg)} ${r(hinge.x)} ${r(hinge.y)})`})),
    h('circle', {cx: r(hinge.x), cy: r(hinge.y), r: 5.5, fill: c.wallEdge}),
  );
  const frame = k => ({[`${o.name}-leaf`]: {transform: `rotate(${r(o.openDeg * clamp(k))} ${r(hinge.x)} ${r(hinge.y)})`}});
  return {node, frame};
}

/**
 * Route badge: a white disc with a ring in the lane colour and a solid glyph —
 * ● for the public route, ◆ for the restricted route as configured (equal ink
 * area, equal stroke weight). Local origin = disc centre.
 */
export function routeGlyph(ctx, access, {x = 0, y = 0, R = 24, name, opacity} = {}) {
  const col = accessColor(ctx, access);
  const inner = access === 'public'
    ? h('circle', {cx: r(x), cy: r(y), r: r(R * 0.44), fill: col})
    : h('path', {d: `M${r(x)} ${r(y - R * 0.55)}L${r(x + R * 0.55)} ${r(y)}L${r(x)} ${r(y + R * 0.55)}L${r(x - R * 0.55)} ${r(y)}Z`, fill: col});
  return g({name, opacity},
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: '#ffffff', stroke: col, 'stroke-width': r(Math.max(3, R * 0.16), 2)}),
    inner);
}

/**
 * The plan art: floors, walls, windows, both corridors, the lobby, furniture,
 * the two doors and their route badges. Returned as four groups (room,
 * restricted corridor, public corridor, lobby) so a mechanism can pull them
 * apart; without offsets they join into one plan.
 * @param {any} ctx
 * @param {any} G accessGeometry()
 * @param {{prefix:string, keep?:(b:any)=>boolean, badges?:boolean, chairs?:Set<string>, hallBadges?:boolean}} o
 *   `chairs`: draw only these chair slots (the supplied seats); default every chair
 */
export function accessArt(ctx, G, o) {
  const P = o.prefix;
  const c = planColors(ctx);
  const {W, H, t, cw} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const D = G.doors;
  // ---- room: floor, walls with the two door gaps and windows, furniture, doors and badges
  const room = [];
  room.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 62}));
  const winTop = [{a: W * 0.12, b: W * 0.27}, {a: W * 0.73, b: W * 0.88}];
  const winRight = [{a: H * 0.22, b: H * 0.38}, {a: H * 0.6, b: H * 0.76}];
  const roomWalls = [
    ...run(-t, -t, W + 2 * t, t, true, winTop),
    ...run(-t, H, W + 2 * t, t, true, [{a: D.public.a, b: D.public.b}]),
    ...run(-t, 0, H, t, false, [{a: D.restricted.a, b: D.restricted.b}]),
    ...run(W, 0, H, t, false, winRight),
  ];
  room.push(walls(ctx, `${P}-walls`, roomWalls));
  winTop.forEach(q => room.push(windowGlass(ctx, {x: q.a, y: -t, w: q.b - q.a, h: t}, true)));
  winRight.forEach(q => room.push(windowGlass(ctx, {x: W, y: q.a, w: t, h: q.b - q.a}, false)));
  G.tables.forEach((tb, i) => { if (keep({x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h})) room.push(planTable(ctx, {name: `${P}-table${i}`, ...tb, seedKey: `atable${i}`})); });
  G.benches.forEach((bn, i) => { if (keep({x: bn.cx - bn.w / 2, y: bn.cy - bn.d / 2 + 4, w: bn.w, h: bn.d})) room.push(planBench(ctx, {name: `${P}-bench${i}`, cx: bn.cx, cy: bn.cy + 4, w: bn.w, d: bn.d})); });
  for (const [name, s] of Object.entries(G.slots)) {
    if (s.kind !== 'chair' || (o.chairs && !o.chairs.has(name))) continue;
    if (keep({x: s.x - 33, y: s.y - 33, w: 66, h: 66})) room.push(planChair(ctx, {name: `${P}-chair-${name}`, cx: s.x, cy: s.y, deg: s.deg, s: 60}));
  }
  G.plants.forEach((pl, i) => { if (keep({x: pl.x - 25, y: pl.y - 25, w: 50, h: 50})) room.push(planPlant(ctx, {name: `${P}-plant${i}`, cx: pl.x, cy: pl.y, s: 44, seedKey: `aplant${i}`})); });
  const doors = {
    restricted: accessDoor(ctx, {name: `${P}-door-restricted`, hinge: {x: -t / 2, y: D.restricted.a}, width: D.restricted.b - D.restricted.a, closedDeg: 90, openDeg: -90}),
    public: accessDoor(ctx, {name: `${P}-door-public`, hinge: {x: D.public.b, y: H + t / 2}, width: D.public.b - D.public.a, closedDeg: 180, openDeg: 90}),
  };
  room.push(doors.restricted.node, doors.public.node);
  if (o.badges !== false) {
    room.push(routeGlyph(ctx, 'restricted', {...G.badges.restricted, R: 25, name: `${P}-badge-restricted`}));
    room.push(routeGlyph(ctx, 'public', {...G.badges.public, R: 25, name: `${P}-badge-public`}));
  }
  // ---- restricted corridor (left): planks, outer wall on its left and its top end
  const rcG = [
    floorArea(ctx, {name: `${P}-corr-r`, x: G.rc.x, y: G.rc.y, w: cw, h: H, kind: 'planks'}),
    walls(ctx, `${P}-corr-r-walls`, [{x: -2 * t - cw, y: -t, w: t, h: H + t}, {x: -2 * t - cw, y: -t, w: cw + t, h: t}]),
  ];
  // ---- public corridor (bottom): planks, outer wall below and its right end
  const pcG = [
    floorArea(ctx, {name: `${P}-corr-p`, x: 0, y: G.pc.y, w: W, h: cw, kind: 'planks'}),
    walls(ctx, `${P}-corr-p-walls`, [{x: 0, y: H + t + cw, w: W + t, h: t}, {x: W, y: H + t, w: t, h: cw}]),
  ];
  // ---- lobby: plain floor with a mat, the outer corner and the partitions with their openings (no doors)
  const L = G.lobby;
  const oR = G.openings.restricted, oP = G.openings.public;
  const lobbyG = [
    floorArea(ctx, {name: `${P}-lobby-floor`, x: L.x, y: L.y, w: cw, h: cw, kind: 'tiles', cell: 50, fill: shade(c.floor, -0.02)}),
    h('path', {d: roundRectPath(L.x + cw * 0.22, L.y + cw - 34, cw * 0.56, 26, 5), fill: shade(c.corridor, -0.12), stroke: c.corridorLine, 'stroke-width': 1.5}),
    walls(ctx, `${P}-lobby-walls`, [
      // outer left and bottom walls of the lobby (the entrance gap in the bottom wall)
      {x: -2 * t - cw, y: H, w: t, h: cw + 2 * t},
      ...run(-2 * t - cw, H + t + cw, cw + 2 * t, t, true, [{a: L.x + cw * 0.22, b: L.x + cw * 0.78}]),
      // partitions towards each corridor, each with a wide opening
      ...run(L.x, H, cw, t, true, [{a: oR.x - 56, b: oR.x + 56}]),
      ...run(-t, H + t, cw, t, false, [{a: oP.y - 56, b: oP.y + 56}]),
      {x: -t, y: H, w: t, h: t},
    ]),
  ];
  // optional: the same route badges on the hall's two openings (where the routes part)
  if (o.hallBadges) {
    // each on the wall beside its own opening, on the side away from the other opening (well apart)
    lobbyG.push(routeGlyph(ctx, 'restricted', {x: oR.x - 56 - 20, y: H + t / 2, R: 20, name: `${P}-hall-badge-restricted`}));
    lobbyG.push(routeGlyph(ctx, 'public', {x: -t / 2, y: oP.y + 56 + 20, R: 20, name: `${P}-hall-badge-public`}));
  }
  const node = g({name: `${P}-plan-art`},
    g({name: `${P}-g-rc`}, rcG),
    g({name: `${P}-g-pc`}, pcG),
    g({name: `${P}-g-lobby`}, lobbyG),
    g({name: `${P}-g-room`}, room));
  return {node, doors, colors: c};
}

/**
 * Solid route line with draw-on (the same for both routes: only the lane
 * colour differs). A pale casing keeps it legible on the plank floors.
 * frame(p, opacity).
 */
export function accessTrail(ctx, o) {
  const poly = polyline(o.pts);
  const d = poly.d(1);
  const total = poly.total;
  const w = o.width ?? 7;
  const dash = `${r(total)} ${r(total + 20)}`;
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-case`, d, fill: 'none', stroke: '#ffffff', 'stroke-width': w + 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.75, 'stroke-dasharray': dash, 'stroke-dashoffset': r(total)}),
    h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dash, 'stroke-dashoffset': r(total)}),
  );
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - clamp(p)));
    return {
      [o.name]: {opacity: r(p > 0 ? opacity : 0, 3)},
      [`${o.name}-case`]: {'stroke-dashoffset': off, 'stroke-dasharray': dash},
      [`${o.name}-line`]: {'stroke-dashoffset': off, 'stroke-dasharray': dash},
    };
  };
  /** Retract from the start: the visible part is [p0, 1]. */
  const frameTail = (p0, opacity = 1) => {
    const s = clamp(p0);
    const dashT = `0 ${r(total * s)} ${r(total * (1 - s) + 0.01)} ${r(total + 20)}`;
    return {
      [o.name]: {opacity: r(s < 1 ? opacity : 0, 3)},
      [`${o.name}-case`]: {'stroke-dashoffset': 0, 'stroke-dasharray': dashT},
      [`${o.name}-line`]: {'stroke-dashoffset': 0, 'stroke-dasharray': dashT},
    };
  };
  return {node, frame, frameTail, poly, total, dash};
}

/** Person rig (courts-art) + walker pose helper. */
export function accessPerson(ctx, name, look) {
  return planPerson(ctx, {name, look});
}

/* ------------------------------------------------------------------ */
/* Label obstacles (design units)                                      */
/* ------------------------------------------------------------------ */

/**
 * Obstacles for the seat-label placer in design units: `hard` (tables,
 * benches, plants, badges), `hardAlways` (empty chairs) and `seatPoints`
 * (every chair/seat centre, for the owner-proximity rule).
 */
export function accessObstacles(G, mapPt, occupied, chairs = null) {
  const mapBox = b => {
    const pts = [mapPt({x: b.x, y: b.y}), mapPt({x: b.x + b.w, y: b.y + b.h})];
    return {x: Math.min(pts[0].x, pts[1].x), y: Math.min(pts[0].y, pts[1].y), w: Math.abs(pts[1].x - pts[0].x), h: Math.abs(pts[1].y - pts[0].y)};
  };
  const furn = furnitureBoxes(G).filter(f => f.kind !== 'chair');
  const badges = Object.values(G.badges).map(q => ({x: q.x - 28, y: q.y - 28, w: 56, h: 56}));
  const hard = [...furn, ...badges].map(mapBox);
  const drawn = nm => !chairs || chairs.has(nm);
  const hardAlways = Object.entries(G.slots).filter(([nm, s]) => s.kind === 'chair' && drawn(nm) && !occupied.has(nm)).map(([, s]) => mapBox({x: s.x - 30, y: s.y - 30, w: 60, h: 60}));
  const seatPoints = Object.entries(G.slots).filter(([nm, s]) => (s.kind === 'chair' && drawn(nm)) || occupied.has(nm)).map(([, s]) => mapPt(s));
  return {hard, hardAlways, seatPoints, mapBox};
}

/* ------------------------------------------------------------------ */
/* Legend glyphs and text                                              */
/* ------------------------------------------------------------------ */

/** Small legend glyphs (design units), local origin at the glyph centre. */
export function accessLegendGlyph(ctx, kind, s, look) {
  const c = planColors(ctx);
  if (kind === 'person') {
    const pp = planPerson(ctx, {name: 'lg-person', look});
    const nodes = pp.pose({x: 0, y: 0, deg: 0, scale: s / 100});
    return g(null, applyStatic(pp.node, nodes));
  }
  if (kind === 'route') {
    return g(null,
      h('path', {d: `M${r(-s * 0.45)} ${r(-s * 0.12)}H${r(s * 0.45)}`, stroke: accessColor(ctx, 'public'), 'stroke-width': 6, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(-s * 0.45)} ${r(s * 0.16)}H${r(s * 0.45)}`, stroke: accessColor(ctx, 'restricted'), 'stroke-width': 6, 'stroke-linecap': 'round'}));
  }
  if (kind === 'seat') return planChair(ctx, {cx: 0, cy: 0, deg: 0, s: s * 0.62});
  if (kind === 'door') {
    return g(null,
      h('path', {d: `M${r(-s * 0.45)} ${r(s * 0.3)}H${r(-s * 0.3)}M${r(s * 0.3)} ${r(s * 0.3)}H${r(s * 0.45)}`, stroke: c.wall, 'stroke-width': 10}),
      h('path', {d: `M${r(-s * 0.3)} ${r(s * 0.3)}A${r(s * 0.6)} ${r(s * 0.6)} 0 0 1 ${r(s * 0.3)} ${r(-s * 0.3)}`, fill: 'none', stroke: c.frame, 'stroke-width': 1.8, opacity: 0.6}),
      h('rect', {x: r(s * 0.26), y: r(-s * 0.3), width: 7, height: r(s * 0.6), fill: c.woodDark, stroke: '#1f2328', 'stroke-width': 1.4}));
  }
  if (kind === 'public' || kind === 'restricted') return routeGlyph(ctx, kind, {R: s * 0.36});
  return null;
}

const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Fitted text block at (x, y = top). */
export function textAt(fit, x, y, fill, o = {}) {
  return h('text', {name: o.name, x: r(x), y: r(y + fit.size * 0.8), 'font-family': SANS, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': o.italic ? 'italic' : undefined, 'text-anchor': o.anchor, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

/** Glue-aware fit (numbers and short words kept with their neighbours). */
export const fitG = (text, o) => fitWords(glue(text), o);

/** Widest single word of a text (px at a size), for "never break a word" checks. */
export function widestWord(ctx, text, size, weight = 600) {
  // single words only (a glued group may still wrap between its words; only a word torn in two is a split)
  return Math.max(0, ...String(text ?? '').split(/[\s\u00a0]+/).filter(Boolean).map(wd => ctx.measure(wd, size, weight, 'sans')));
}

/** Person radius (template units) for label collisions. */
export const PERSON_RAD = PERSON.half;

/** Transform helper re-export for entries. */
export {T};

/* ------------------------------------------------------------------ */
/* Info panel stacks (design units)                                    */
/* ------------------------------------------------------------------ */

/**
 * Measure a vertical stack of panel items at width w and text size F.
 * Item types: chip {text, stroke?, weight?, name}, legend {kind, text, weight?, name},
 * note {text, color, name}, key {text, name}, text {text, weight?, name, italic?}.
 * Every text is fitted whole-word (glue-aware) with up to 4 lines; `truncated`
 * reports any ellipsis (the caller then tries a larger width or smaller F).
 */
export function measureStack(ctx, items, w, F) {
  const th = ctx.theme;
  const gap = F * 0.6;
  const glyph = F * 2.1;
  const rows = [];
  let truncated = false;
  for (const it of items) {
    let row;
    if (it.type === 'chip') {
      const c = gchipK(ctx, it.text, {x: 0, y: 0, anchor: 'middle', maxWidth: w, size: F, minSize: F, maxLines: 5, fill: th.card, stroke: it.stroke ?? th.ink, weight: it.weight ?? 600});
      row = {it, h: c.box.h, fit: c.fit};
    } else if (it.type === 'legend') {
      const fit = fitG(it.text, {maxWidth: w - glyph - 14, size: F, minSize: F, maxLines: 4, weight: it.weight ?? 500});
      row = {it, h: Math.max(glyph, fit.height), fit, glyph};
    } else if (it.type === 'note') {
      const fit = fitG(it.text, {maxWidth: w - F * 1.9 - 12, size: F, minSize: F, maxLines: 5, weight: 500});
      row = {it, h: fit.height, fit};
    } else if (it.type === 'key') {
      const fit = fitG(it.text, {maxWidth: w - 12, size: F, minSize: F, maxLines: 4, weight: 500});
      row = {it, h: fit.height + F * 0.45, fit};
    } else {
      const fit = fitG(it.text, {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: it.weight ?? 500});
      row = {it, h: fit.height, fit};
    }
    if (row.fit.truncated) truncated = true;
    // a word wider than its line would be broken mid-word (harness warning split-word): treat it as not fitting
    const avail = it.type === 'chip' ? w - F * 1.2 : it.type === 'legend' ? w - glyph - 14 : it.type === 'note' ? w - F * 1.9 - 12 : it.type === 'key' ? w - 12 : w;
    if (widestWord(ctx, it.text, F, it.type === 'chip' ? (it.weight ?? 600) : (it.weight ?? 500)) > avail + 0.5) truncated = true;
    rows.push(row);
  }
  // + a descender allowance under the last line, so the drawn glyphs stay inside the measured box
  const height = rows.length ? rows.reduce((a, q) => a + q.h, 0) + gap * (rows.length - 1) + F * 0.28 : 0;
  return {rows, height, gap, w, F, truncated, glyph};
}

/** Draw a measured stack at (x, y = top); returns [{name, type, node, box}]. */
export function drawStack(ctx, m, x, y, o = {}) {
  const th = ctx.theme;
  const out = [];
  let yy = y;
  const look = {skin: '#c68863', hair: 'short', hairColor: '#4a3122', outfit: th.cloth[3], glasses: false};
  for (const row of m.rows) {
    const it = row.it;
    let node;
    if (it.type === 'chip') {
      node = gchipK(ctx, it.text, {x: x + m.w / 2, y: yy, anchor: 'middle', maxWidth: m.w, size: m.F, minSize: m.F, maxLines: 5, fill: th.card, stroke: it.stroke ?? th.ink, weight: it.weight ?? 600}).node;
    } else if (it.type === 'legend') {
      const gl = accessLegendGlyph(ctx, it.kind, row.glyph, look);
      node = g(null,
        g({transform: T(x + row.glyph / 2, yy + row.h / 2)}, gl),
        textAt(row.fit, x + row.glyph + 14, yy + (row.h - row.fit.height) / 2, th.fg));
    } else if (it.type === 'note') {
      const rr = m.F * 0.62;
      node = g(null,
        h('circle', {cx: r(x + rr + 2), cy: r(yy + m.F * 0.55), r: r(rr), fill: 'none', stroke: it.color, 'stroke-width': 4}),
        textAt(row.fit, x + m.F * 1.9 + 12, yy, th.fg));
    } else if (it.type === 'key') {
      node = g(null,
        h('path', {d: `M${r(x)} ${r(yy)}H${r(x + Math.min(m.w, row.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
        textAt(row.fit, x, yy + m.F * 0.45, th.fgSoft, {italic: true}));
    } else {
      node = textAt(row.fit, x, yy, th.fg, {italic: it.italic});
    }
    const box = {x, y: yy, w: m.w, h: row.h};
    out.push({name: it.name, type: it.type, node: g({name: it.name, opacity: o.hidden && o.hidden(it) ? 0 : undefined}, node), box});
    yy += row.h + m.gap;
  }
  return out;
}

/** gchip with the kit's glue-aware fit. */
function gchipK(ctx, text, o) {
  return chip({theme: ctx.theme, fit: fitWords}, glue(text), o);
}

/**
 * Split an ordered item list into `n` columns of width w (contiguous, reading
 * order kept) with the lowest tallest column. Returns [{m}] or null when a
 * column would truncate.
 */
export function balanceColumns(ctx, items, n, w, F) {
  const cache = new Map();
  const ms = (a, b) => {
    const key = `${a}:${b}`;
    if (!cache.has(key)) cache.set(key, measureStack(ctx, items.slice(a, b), w, F));
    return cache.get(key);
  };
  const N = items.length;
  let best = null;
  const cuts = (start, left, acc) => {
    if (left === 1) {
      const all = [...acc, [start, N]];
      const m = all.map(([a, b]) => ms(a, b));
      if (m.some(q => q.truncated)) return;
      const hmax = Math.max(...m.map(q => q.height));
      if (!best || hmax < best.h) best = {h: hmax, cols: m};
      return;
    }
    for (let c = start; c <= N; c++) {
      // items of one group (e.g. the two route legend rows) stay in the same column
      if (c > 0 && c < N && items[c - 1].group && items[c - 1].group === items[c].group) continue;
      cuts(c, left - 1, [...acc, [start, c]]);
    }
  };
  cuts(0, n, []);
  return best;
}


/**
 * Opt-in: shift walk windows so no two people ever come closer than `minD`
 * (template units, centre to centre) — walking, waiting or seated — in any of
 * the given walker sets (paired scenes share one timing). Starts keep the
 * route order; when the last walk would end after b, every walk is sped up and
 * the search restarts. Mutates start/end of every set; returns the minimum
 * distance found.
 */
export function deconflict(sets, a, b, {minD = 72, step = 0.004, minGap = 0.03, walkEnd = 0.84} = {}) {
  const n = sets[0].length;
  if (n < 2) return Infinity;
  const base = sets[0].map((w, i) => Math.max(...sets.map(S => S[i].end - S[i].start)));
  const pos = (w, u) => {
    const q = w.end > w.start ? clamp((u - w.start) / (w.end - w.start)) : u >= w.end ? 1 : 0;
    const s = ease.inOutSine(clamp(q / walkEnd));
    return q <= 0 ? w.spot : q >= walkEnd ? w.seat : w.poly.at(s);
  };
  const clash = j => {
    for (const S of sets) {
      for (let u = a - step; u <= b + 0.03; u += step) {
        const pj = pos(S[j], u);
        for (let i = 0; i < j; i++) { const pi = pos(S[i], u); if (Math.hypot(pi.x - pj.x, pi.y - pj.y) < minD) return true; }
        // a later walker must not pass someone still waiting either
        for (let i = j + 1; i < n; i++) { if (u >= S[i].start) continue; const pi = S[i].spot; if (Math.hypot(pi.x - pj.x, pi.y - pj.y) < minD) return true; }
      }
    }
    return false;
  };
  for (let f = 1; f >= 0.35; f *= 0.9) {
    let ok = true;
    let t0 = a;
    for (let j = 0; j < n && ok; j++) {
      const d = base[j] * f;
      let s0 = j === 0 ? a : t0 + minGap;
      let placed = false;
      for (; s0 + d <= b + 1e-9; s0 += 0.004) {
        for (const S of sets) { S[j].start = s0; S[j].end = s0 + d; }
        for (let k = j + 1; k < n; k++) for (const S of sets) { S[k].start = 9; S[k].end = 9.5; }
        if (!clash(j)) { placed = true; break; }
      }
      if (!placed) ok = false;
      t0 = s0;
    }
    if (ok) {
      let m = Infinity;
      for (const S of sets) for (let u = a; u <= b + 0.03; u += step) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const p1 = pos(S[i], u), p2 = pos(S[j], u); m = Math.min(m, Math.hypot(p1.x - p2.x, p1.y - p2.y)); }
      return m;
    }
  }
  return 0;
}
