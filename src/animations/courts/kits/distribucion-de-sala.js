/**
 * "Distribución de una sala" kit (LAW-0201..0204): a generic, fictional room
 * inside a generic building, drawn as a floor plan. Participants wait in the
 * corridor, walk through a door along an aisle route to their seat, turn and
 * sit; each seat's editable label is revealed as its occupant lands.
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md): the building and the room are
 * fictional placeholders; seat positions and their labels are SUPPLIED by
 * the author ("Presiding seat (as supplied)", "Participant A" …). Nothing here
 * states that a jurisdiction requires a seating, that a position has legal
 * significance, or any procedure, hierarchy, time limit or outcome.
 *
 * The kit owns fields, defaults, strings, the room geometry (template units),
 * route planning, the walker solver and seat-label placement. Each entry owns
 * its own timeline, composition and semantics. Generic art comes from
 * ./courts-art.js (shared by the whole courts category).
 * @module animations/courts/kits/distribucion-de-sala
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {fitDesign} from '../../../core/layout.js';
import {measure} from '../../../core/text.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {fitWords, wchip} from '../../roles/kits/mediation-labels.js';
import {
  planColors, floorArea, wallRing, planDoor, planPlatform, planTable, planChair, planBench, planPlant,
  planPerson, routeTrail, seatRing, PERSON,
} from './courts-art.js';

export {fitWords, wchip};

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

/** Seat positions of the generic room (plan slots). */
export const SLOTS = ['front', 'left1', 'left2', 'right1', 'right2', 'back1', 'back2'];
export const DOORS = ['main', 'side'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: courts, routes, seats, labels). */
export const salaFields = {
  courts: obj('Generic, fictional building and room (no real court, building shape or emblem)', {
    building: str('Name printed under the generic building (fictional)', 60),
    room: str('Name of the room drawn as a plan (fictional)', 60),
  }, ['building', 'room']),
  seats: list('Seats of the plan: a fixed position in the generic room and its editable label, revealed when the seat is taken. Positions and labels are as supplied; a position carries no legal meaning', obj('Seat', {
    slot: oneOf('Position in the generic room: front (behind the front desk), left1/left2 and right1/right2 (the two tables), back1/back2 (the back bench)', SLOTS),
    label: str('Editable label of the seat (as supplied)', 60),
  }, ['slot', 'label']), 2, 6),
  routes: list('Who walks to which seat, in entrance order (as supplied). A route to an unknown or already taken seat is ignored', obj('Route', {
    seat: int('Index of the seat in `seats`', 0, 5),
    door: oneOf('Door used to enter the room: main (bottom wall) or side (right wall)', DOORS),
  }, ['seat', 'door']), 1, 6),
  labels: obj('Editable built-in captions', {
    mainDoor: str('Caption of the main door', 30),
    sideDoor: str('Caption of the side door', 30),
    key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 90),
  }),
  people: list('Optional appearance of the person on each route, in route order', obj('Person', {appearance}), 0, 6),
};

export const SALA_EN = {
  courts: {building: 'Civic building (fictional)', room: 'Room 2 (fictional)'},
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'right1', label: 'Participant B'},
    {slot: 'right2', label: 'Participant C'},
    {slot: 'back1', label: 'Public seat'},
  ],
  routes: [
    {seat: 1, door: 'main'},
    {seat: 2, door: 'main'},
    {seat: 0, door: 'side'},
    {seat: 3, door: 'main'},
    {seat: 4, door: 'main'},
  ],
  labels: {mainDoor: 'Main door', sideDoor: 'Side door', key: 'Positions and labels as supplied · no conclusion drawn'},
  people: [],
};

export const SALA_ES = {
  courts: {building: 'Edificio cívico (ficticio)', room: 'Sala 2 (ficticia)'},
  seats: [
    {slot: 'front', label: 'Asiento de presidencia (según lo aportado)'},
    {slot: 'left1', label: 'Participante A'},
    {slot: 'right1', label: 'Participante B'},
    {slot: 'right2', label: 'Participante C'},
    {slot: 'back1', label: 'Asiento del público'},
  ],
  routes: SALA_EN.routes,
  labels: {mainDoor: 'Puerta principal', sideDoor: 'Puerta lateral', key: 'Posiciones y etiquetas según lo aportado · sin conclusión'},
  people: [],
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const SALA_LONG = {
  courts: {building: 'Municipal civic services building, east wing (fictional)', room: 'Multipurpose hearing room 2, first floor (fictional)'},
  seats: [
    {slot: 'front', label: 'Presiding seat behind the front desk (as supplied)'},
    {slot: 'left1', label: 'Participant A, seated at the left-hand table'},
    {slot: 'left2', label: 'Representative of participant A (as supplied)'},
    {slot: 'right1', label: 'Participant B, seated at the right-hand table'},
    {slot: 'right2', label: 'Representative of participant B (as supplied)'},
    {slot: 'back1', label: 'Member of the public on the back bench'},
  ],
  routes: [
    {seat: 1, door: 'main'},
    {seat: 2, door: 'main'},
    {seat: 3, door: 'main'},
    {seat: 0, door: 'side'},
    {seat: 4, door: 'side'},
    {seat: 5, door: 'main'},
  ],
  labels: {mainDoor: 'Main door from the corridor', sideDoor: 'Side door from the corridor', key: 'Positions and labels are shown as supplied by the author · no conclusion drawn'},
  people: [],
};

export const SALA_STRINGS = {
  en: {seated: 'seated', waiting: 'waiting', allSeated: 'Everyone seated (as supplied)', lastWaiting: 'Last person still at the door (as supplied)', was: 'was'},
  es: {seated: 'sentado', waiting: 'esperando', allSeated: 'Todos sentados (según lo aportado)', lastWaiting: 'La última persona sigue en la puerta (según lo aportado)', was: 'antes'},
};

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Keep numbers with the word before them ("Room 2", "Sala 2", "floor 1") and
 * short closing words with their neighbour, so wrapping never tears "2" from
 * "Room" (harness warning orphan-fragment). Uses U+00A0, which fitWords keeps
 * together while it fits.
 */
export function glue(text) {
  return String(text ?? '')
    .replace(/(\S)\s+(\d[\d.,:]*[)\]]?)(?=[\s,.;:)]|$)/g, '$1 $2')
    // a single closing letter stays with its word ("Participant A", "Participante B")
    .replace(/(\S)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ])(?=[\s,.;:)]|$)/g, '$1 $2')
    // a short word (1–2 letters: "of", "de", "a") never ends a line on its own: it travels with the next word
    .replace(/(^|\s)(\p{L}{1,2})\s+(?=\S)/gu, '$1$2 ')
    .replace(/(\S)\s+([·–—])\s+/g, '$1 $2 ');
}

/** Design units → px at 1080p (for text floors). */
export function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return (f.scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
}

/** Box helpers. */
export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
export const inside = (a, b, pad = 0) => a.x >= b.x + pad && a.y >= b.y + pad && a.x + a.w <= b.x + b.w - pad && a.y + a.h <= b.y + b.h - pad;
const boxDist = (b, p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h)));
function segBox(p, q, b, pad = 0) {
  // does segment p-q pass through box b (+pad)?
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
  }
  return false;
}
export {segBox};

/* ------------------------------------------------------------------ */
/* Resolved params                                                     */
/* ------------------------------------------------------------------ */

/**
 * Valid seats (first use of a slot wins) and valid routes (known seat, first
 * route to a seat wins), with each walker's look.
 */
export function resolveSala(ctx, p) {
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

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

export const WALL = 18;
export const CORRIDOR = 150;

/** Smallest interior that keeps every aisle clear of seated people. */
export const ROOM_MIN = {W: 720, H: 620};
/** Template extents around the interior (walls + corridor). */
export const EXTRA = WALL * 3 + CORRIDOR;

/**
 * Interior size whose extents (room + corridor) match a box aspect, so the
 * plan fills the box: returns {W, H, k} with k = design units per template
 * unit. `corridor: false` drops the corridor (walls only).
 */
export function fitRoom(box, {corridor = true, min = ROOM_MIN} = {}) {
  const ex = corridor ? EXTRA : WALL * 2;
  const ar = box.w / box.h;
  let W = min.W, H = min.H;
  if (ar > (min.W + ex) / (min.H + ex)) W = Math.round(ar * (min.H + ex) - ex);
  else H = Math.round((min.W + ex) / ar - ex);
  W = Math.min(W, 1500);
  H = Math.min(H, 1200);
  const k = Math.min(box.w / (W + ex), box.h / (H + ex));
  return {W, H, k};
}

/**
 * Geometry of the generic room plus the corridor that wraps its right and
 * bottom sides (the building). Interior origin = top-left of the room floor,
 * front of the room at the top.
 * @param {number} W interior width (≥ ROOM_MIN.W)
 * @param {number} H interior height (≥ ROOM_MIN.H)
 */
export function roomGeometry(W, H) {
  const t = WALL, cw = CORRIDOR;
  const tableW = W >= 900 ? 230 : 212;
  const tableH = 56;
  const tableY = Math.round(185 + (H - 185) * 0.33);
  const chairY = tableY + 64;
  const aisle = 132;
  const lx = W / 2 - aisle / 2 - tableW / 2, rx = W / 2 + aisle / 2 + tableW / 2;
  // chairs towards the table ends, so a label centred on its own person never reaches over the neighbouring chair
  const seatOff = tableW / 2 - 24;
  const benchY = H - 56;
  const benchW = Math.min(360, W * 0.42);
  const benchX = Math.max(benchW / 2 + 40, W * 0.3);
  const deskW = Math.min(300, W * 0.36);
  const slots = {
    front: {x: W / 2, y: 56, deg: 180, kind: 'desk'},
    left1: {x: lx - seatOff, y: chairY, deg: 0, kind: 'table'},
    left2: {x: lx + seatOff, y: chairY, deg: 0, kind: 'table'},
    right1: {x: rx - seatOff, y: chairY, deg: 0, kind: 'table'},
    right2: {x: rx + seatOff, y: chairY, deg: 0, kind: 'table'},
    back1: {x: benchX - benchW * 0.32, y: benchY - 14, deg: 0, kind: 'bench'},
    back2: {x: benchX + benchW * 0.32, y: benchY - 14, deg: 0, kind: 'bench'},
  };
  const platform = {x: W / 2 - Math.min(250, W * 0.33), y: 0, w: Math.min(500, W * 0.66), h: 150};
  const desk = {cx: W / 2, cy: 116, w: deskW, h: 50};
  const tables = [{cx: lx, cy: tableY, w: tableW, h: tableH}, {cx: rx, cy: tableY, w: tableW, h: tableH}];
  const bench = {cx: benchX, cy: benchY, w: benchW, d: 58};
  // aisles
  const yF = Math.round((platform.h + 22 + tableY - tableH / 2) / 2);
  // back aisle: close to the bench on deep rooms, so the band under the chairs stays free for labels
  const yB = Math.round(Math.max((chairY + 34 + benchY - 42) / 2, benchY - 100));
  const mainDoor = {a: Math.round(W * 0.72), b: Math.round(W * 0.72) + 116};
  const sideDoor = {a: 176, b: 292};
  const mdx = (mainDoor.a + mainDoor.b) / 2, sdy = (sideDoor.a + sideDoor.b) / 2;
  const doors = {
    main: {out: {x: mdx, y: H + t + cw / 2}, gate: {x: mdx, y: H + t / 2}, in: {x: mdx, y: H - 58}, side: 'bottom', a: mainDoor.a, b: mainDoor.b},
    side: {out: {x: W + t + cw / 2, y: sdy}, gate: {x: W + t / 2, y: sdy}, in: {x: W - 62, y: sdy}, side: 'right', a: sideDoor.a, b: sideDoor.b},
  };
  // waiting spots in the corridor, nearest to each door first
  const spots = {main: [], side: []};
  const cy = H + t + cw / 2, cx = W + t + cw / 2;
  for (let i = 1; i <= 6; i++) {
    const x = mdx - i * 118;
    if (x > 60) spots.main.push({x, y: cy, deg: 90});
  }
  for (let i = 1; i <= 3; i++) {
    const x = mdx + i * 118;
    if (x < cx + 10) spots.main.push({x, y: cy, deg: 270});
  }
  for (let i = 1; i <= 6; i++) {
    const y = sdy + i * 118;
    if (y < cy - 60) spots.side.push({x: cx, y, deg: 0});
  }
  spots.side.push({x: cx, y: cy, deg: 0});
  const room = {x: 0, y: 0, w: W, h: H};
  const extents = {x: -t, y: -t, w: W + 2 * t + cw + t, h: H + 2 * t + cw + t};
  const plants = [{x: 44, y: 44}, {x: W - 44, y: 44}, {x: W + t + cw / 2, y: 44}];
  const lobbyDoor = {a: 40, b: 156};
  return {W, H, t, cw, slots, platform, desk, tables, bench, yF, yB, doors, spots, room, extents, plants, lobbyDoor, mainDoor, sideDoor, aisleX: W / 2};
}

/** Furniture boxes (template units) — obstacles for labels. */
export function furnitureBoxes(G) {
  const out = [];
  out.push({kind: 'desk', x: G.desk.cx - G.desk.w / 2, y: G.desk.cy - G.desk.h / 2, w: G.desk.w, h: G.desk.h});
  for (const tb of G.tables) out.push({kind: 'table', x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h});
  out.push({kind: 'bench', x: G.bench.cx - G.bench.w / 2, y: G.bench.cy - G.bench.d / 2, w: G.bench.w, h: G.bench.d});
  for (const [name, s] of Object.entries(G.slots)) out.push({kind: 'chair', slot: name, x: s.x - 34, y: s.y - 34, w: 68, h: 68});
  for (const pl of G.plants) out.push({kind: 'plant', x: pl.x - 26, y: pl.y - 26, w: 52, h: 52});
  return out;
}

/** Route (template units) from a waiting spot through a door to a seat. */
export function planRoute(G, slot, door, spot) {
  const S = G.slots[slot];
  const D = G.doors[door];
  const pts = [{x: spot.x, y: spot.y}];
  if (door === 'main') {
    if (Math.abs(spot.y - D.out.y) > 2 || Math.abs(spot.x - D.out.x) > 2) pts.push({...D.out});
    pts.push({...D.gate}, {...D.in});
    const base = {x: D.in.x, y: G.yB};
    pts.push(base);
    if (S.kind === 'desk') {
      const sideX = G.W / 2 + G.desk.w / 2 + 60;
      pts.push({x: G.aisleX, y: G.yB}, {x: G.aisleX, y: G.yF}, {x: sideX, y: G.yF}, {x: sideX, y: S.y}, {x: S.x, y: S.y});
    } else if (S.kind === 'table') {
      pts.push({x: S.x, y: G.yB}, {x: S.x, y: S.y});
    } else {
      pts.push({x: S.x, y: G.yB}, {x: S.x, y: S.y});
    }
  } else {
    if (Math.abs(spot.x - D.out.x) > 2 || Math.abs(spot.y - D.out.y) > 2) pts.push({...D.out});
    pts.push({...D.gate}, {...D.in});
    if (S.kind === 'desk') {
      const sideX = G.W / 2 + G.desk.w / 2 + 60;
      pts.push({x: D.in.x, y: G.yF}, {x: sideX, y: G.yF}, {x: sideX, y: S.y}, {x: S.x, y: S.y});
    } else {
      // along the front aisle to the centre aisle, down it, then along the back aisle
      pts.push({x: D.in.x, y: G.yF}, {x: G.aisleX, y: G.yF}, {x: G.aisleX, y: G.yB}, {x: S.x, y: G.yB}, {x: S.x, y: S.y});
    }
  }
  return roundCorners(dedupe(pts), 46);
}

function dedupe(pts) {
  const out = [];
  for (const q of pts) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(q.x - last.x, q.y - last.y) > 1) out.push(q);
  }
  // drop collinear middle points
  const res = [out[0]];
  for (let i = 1; i < out.length - 1; i++) {
    const a = res[res.length - 1], b = out[i], c = out[i + 1];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) > 1e-6) res.push(b);
  }
  if (out.length > 1) res.push(out[out.length - 1]);
  return res;
}

/** Replace each interior corner with a short quadratic fillet. */
export function roundCorners(pts, rad) {
  if (pts.length < 3) return pts.slice();
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, l1 / 2, l2 / 2);
    const p = {x: b.x + ((a.x - b.x) / l1) * rr, y: b.y + ((a.y - b.y) / l1) * rr};
    const q = {x: b.x + ((c.x - b.x) / l2) * rr, y: b.y + ((c.y - b.y) / l2) * rr};
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, u = 1 - t;
      out.push({x: u * u * p.x + 2 * u * t * b.x + t * t * q.x, y: u * u * p.y + 2 * u * t * b.y + t * t * q.y});
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* ------------------------------------------------------------------ */
/* Walkers                                                             */
/* ------------------------------------------------------------------ */

const STRIDE = 36; // template units per half step
const angDiff = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;

/**
 * Walker state at local progress q ∈ [0, 1]: walk along the route
 * (0 → walkEnd), then turn to the seat's facing and sit (walkEnd → 1).
 * @param {{poly:any, spot:{deg:number}, seat:{x:number,y:number,deg:number}}} w
 * @param {number} q
 * @param {{walkEnd?:number, reduced?:boolean}} [o]
 */
export function walkerAt(w, q, o = {}) {
  const walkEnd = o.walkEnd ?? 0.84;
  const poly = w.poly;
  const qw = clamp(q / walkEnd);
  const s = ease.inOutSine(qw);
  const p = poly.at(s);
  const dist = s * poly.total;
  // heading: travel direction, blended from the waiting facing at the start
  const head = (a => (a * 180) / Math.PI + 90)(poly.at(Math.min(1, s + 0.004)).a);
  const startHead = w.spot.deg;
  let deg = head;
  if (qw < 0.08) deg = startHead + angDiff(startHead, head) * ease.inOutSine(qw / 0.08);
  const qt = clamp((q - walkEnd) / (1 - walkEnd));
  if (q >= walkEnd) {
    const endHead = (poly.at(0.999).a * 180) / Math.PI + 90;
    deg = endHead + angDiff(endHead, w.seat.deg) * ease.inOutCubic(clamp(qt / 0.6));
  }
  const seated = q >= walkEnd ? ease.inOutCubic(clamp((qt - 0.35) / 0.65)) : 0;
  const moving = qw > 0 && qw < 1;
  const walkAmp = moving ? Math.min(1, qw / 0.06, (1 - qw) / 0.06) : 0;
  return {x: p.x, y: p.y, deg: norm360(deg), phase: (dist / STRIDE) * Math.PI, walk: o.reduced ? walkAmp * 0.6 : walkAmp, seated, state: q <= 0 ? 'waiting' : q >= 1 ? 'seated' : qw < 1 ? 'walking' : 'sitting'};
}
const norm360 = a => ((a % 360) + 360) % 360;

/**
 * Plan the walkers of a room: waiting spot per door (in route order), route
 * polyline and the time window of each walk inside [a, b] (normalized time).
 * Speed is shared; starts are staggered; everyone has landed by b.
 */
export function planWalkers(G, routes, {a, b, minGap = 0.05}) {
  const used = {main: 0, side: 0};
  const walkers = routes.map((rt, i) => {
    const list = G.spots[rt.door];
    const spot = list[Math.min(used[rt.door]++, list.length - 1)];
    const pts = planRoute(G, rt.slot, rt.door, spot);
    const poly = polyline(pts);
    const S = G.slots[rt.slot];
    return {i, route: rt, spot, pts, poly, seat: {x: S.x, y: S.y, deg: S.deg}, slot: rt.slot, door: rt.door};
  });
  const n = walkers.length;
  if (!n) return walkers;
  // durations proportional to length (+ turn/sit), then fit the stagger into [a, b]
  const span = b - a;
  const maxLen = Math.max(...walkers.map(w => w.poly.total));
  const maxDur = Math.min(0.26, span);
  let dur = walkers.map(w => maxDur * (0.3 + 0.7 * (w.poly.total / maxLen)));
  // the largest stagger (≤ 0.13) that lets every walk end by b
  let gap = 0;
  if (n > 1) {
    gap = 0.13;
    for (let i = 1; i < n; i++) gap = Math.min(gap, (span - dur[i]) / i);
    gap = Math.max(minGap, gap);
    dur = dur.map((d, i) => Math.min(d, span - i * gap));
  }
  walkers.forEach((w, i) => {
    w.start = a + i * gap;
    w.end = Math.min(b, w.start + Math.max(0.04, dur[i]));
  });
  return walkers;
}

/** Door opening 0..1 from the nearest walker around a door gate (template units). */
export function doorOpen(G, door, positions) {
  const gate = G.doors[door].gate;
  let k = 0;
  // only people on the move open a door (someone waiting beside it does not)
  for (const p of positions.filter(q => q.walk > 0 || q.state === 'walking')) {
    const d = Math.hypot(p.x - gate.x, p.y - gate.y);
    k = Math.max(k, clamp(1 - (d - 70) / 110));
  }
  return ease.inOutSine(k);
}

/* ------------------------------------------------------------------ */
/* Room art (template units)                                           */
/* ------------------------------------------------------------------ */

/**
 * Draw the room, the corridor (building) and the furniture. Returns the node
 * and door handles (frame(k)).
 * @param {any} ctx
 * @param {any} G roomGeometry()
 * @param {{prefix:string, corridor?:boolean, sideDoor?:boolean, highlightSlots?:string[], emptyRings?:string[]}} o
 */
export function roomArt(ctx, G, o) {
  const P = o.prefix;
  const c = planColors(ctx);
  const {W, H, t, cw} = G;
  const corridor = o.corridor !== false;
  const parts = [];
  if (corridor) {
    // corridor floor wraps the right and bottom sides (the building)
    parts.push(floorArea(ctx, {name: `${P}-corr-r`, x: W + t, y: 0, w: cw, h: H + t + cw, kind: 'planks'}));
    parts.push(floorArea(ctx, {name: `${P}-corr-b`, x: 0, y: H + t, w: W + t, h: cw, kind: 'planks'}));
  }
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 62}));
  parts.push(planPlatform(ctx, {name: `${P}-platform`, ...G.platform}));
  // walls: the room ring (with the doors) and the building's outer ring
  const roomGaps = [
    {side: 'bottom', a: G.mainDoor.a, b: G.mainDoor.b, kind: 'door'},
    {side: 'top', a: W * 0.1, b: W * 0.24, kind: 'window'},
    {side: 'top', a: W * 0.76, b: W * 0.9, kind: 'window'},
    {side: 'left', a: H * 0.3, b: H * 0.46, kind: 'window'},
    {side: 'left', a: H * 0.62, b: H * 0.78, kind: 'window'},
  ];
  if (o.sideDoor !== false) roomGaps.push({side: 'right', a: G.sideDoor.a, b: G.sideDoor.b, kind: 'door'});
  if (corridor) {
    parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: roomGaps}));
    parts.push(wallRing(ctx, {name: `${P}-outer`, x: 0, y: 0, w: W + t + cw, h: H + t + cw, t, sides: ['top', 'right', 'bottom'],
      gaps: [{side: 'bottom', a: G.lobbyDoor.a, b: G.lobbyDoor.b, kind: 'open'}, {side: 'right', a: H * 0.35, b: H * 0.55, kind: 'window'}]}));
    parts.push(wallRing(ctx, {name: `${P}-outerL`, x: 0, y: H + t, w: W + t + cw, h: cw, t, sides: ['left']}));
  } else {
    parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: roomGaps}));
  }
  // furniture (o.keep(box) — a template box — decides, per piece, whether it is drawn at all: a lens copy
  // draws each piece whole or not at all, never a fragment cut by its rim)
  const keep = b => (o.keep ? o.keep(b) : true);
  const deskB = {x: G.desk.cx - G.desk.w / 2, y: G.desk.cy - G.desk.h / 2, w: G.desk.w, h: G.desk.h};
  if (keep(deskB)) parts.push(planTable(ctx, {name: `${P}-desk`, cx: G.desk.cx, cy: G.desk.cy, w: G.desk.w, h: G.desk.h, front: 'bottom', seedKey: 'desk'}));
  G.tables.forEach((tb, i) => { if (keep({x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h})) parts.push(planTable(ctx, {name: `${P}-table${i}`, ...tb, seedKey: `table${i}`})); });
  if (keep({x: G.bench.cx - G.bench.w / 2, y: G.bench.cy - G.bench.d / 2 + 4, w: G.bench.w, h: G.bench.d})) parts.push(planBench(ctx, {name: `${P}-bench`, cx: G.bench.cx, cy: G.bench.cy + 4, w: G.bench.w, d: G.bench.d}));
  for (const [name, s] of Object.entries(G.slots)) {
    if (s.kind === 'bench') continue;
    if (keep({x: s.x - 34, y: s.y - 34, w: 68, h: 68})) parts.push(planChair(ctx, {name: `${P}-chair-${name}`, cx: s.x, cy: s.y, deg: s.deg, s: 62}));
  }
  G.plants.forEach((pl, i) => { if ((corridor || pl.x < W) && keep({x: pl.x - 26, y: pl.y - 26, w: 52, h: 52})) parts.push(planPlant(ctx, {name: `${P}-plant${i}`, cx: pl.x, cy: pl.y, s: 46, seedKey: `plant${i}`})); });
  // doors
  const doors = {};
  const md = G.doors.main;
  doors.main = planDoor(ctx, {name: `${P}-door-main`, hinge: {x: md.b, y: H + t / 2}, width: md.b - md.a, closedDeg: 180, openDeg: 90});
  if (o.sideDoor !== false) {
    const sd = G.doors.side;
    doors.side = planDoor(ctx, {name: `${P}-door-side`, hinge: {x: W + t / 2, y: sd.a}, width: sd.b - sd.a, closedDeg: 90, openDeg: 90});
  }
  parts.push(doors.main.node, doors.side ? doors.side.node : null);
  // empty-seat rings (the seats that will be taken)
  const rings = (o.emptyRings || []).map(slot => seatRing(ctx, {name: `${P}-ring-${slot}`, cx: G.slots[slot].x, cy: G.slots[slot].y, rad: 44}));
  return {node: g({name: `${P}-room`}, parts, rings), doors, colors: c};
}

/* ------------------------------------------------------------------ */
/* Seat labels (design units)                                          */
/* ------------------------------------------------------------------ */

/**
 * Place one chip per seat beside its occupant, with a short leader to the
 * person's edge. Candidate positions ring the person; a position is rejected
 * if the chip covers a person (any seated person, any waiting spot or a later
 * walker's route corridor), another chip, leaves the bounds, or is further
 * than `maxGap` from the person. Among valid ones, the least furniture
 * overlap and the shortest gap win.
 * @param {any} ctx
 * @param {{items:Array<{key:string, text:string, at:{x:number,y:number}, rad:number, avoidPaths?:Array<Array<{x:number,y:number}>>}>,
 *   people:Array<{x:number,y:number,rad:number}>, furniture:Array<{x:number,y:number,w:number,h:number}>, bounds:{x:number,y:number,w:number,h:number},
 *   size:number, minSize:number, maxWidth:number, maxLines?:number, maxGap?:number, pathPad?:number, extra?:Array<any>}} o
 */
/** Clearance from a chip to a person: an oriented body box (hw × hh) when given, else a disc of radius rad. */
const personClear = (box, q, pad = 4) => {
  if (q.hw) {
    const dx = Math.abs(box.x + box.w / 2 - q.x) - (box.w / 2 + q.hw), dy = Math.abs(box.y + box.h / 2 - q.y) - (box.h / 2 + q.hh);
    return Math.max(dx, dy) >= pad;
  }
  return boxDist(box, q) >= q.rad + pad;
};
export {personClear};

export function placeSeatLabels(ctx, o) {
  // placement order matters (earlier chips block later ones): if some item fails, retry with the
  // failing items placed first; the labels come back in the original item order
  const idx = o.items.map((_, i) => i);
  let res = placeInOrder(ctx, o, idx);
  for (let tries = 0; tries < 3 && res.fails.length; tries++) {
    const failIdx = idx.filter(i => res.fails.includes(o.items[i].key));
    const order = [...failIdx, ...idx.filter(i => !failIdx.includes(i))];
    const next = placeInOrder(ctx, o, order);
    if (next.fails.length < res.fails.length) res = next; else break;
  }
  // still failing: try the reverse order and each item first
  const perms = a => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(q => [x, ...q])));
  const orders = idx.length <= 4 ? perms(idx) : [[...idx].reverse(), ...idx.map(i => [i, ...idx.filter(j => j !== i)]), ...idx.map(i => [...idx.filter(j => j !== i).reverse(), i])];
  for (const order of orders) {
    if (!res.fails.length) break;
    const next = placeInOrder(ctx, o, order);
    if (next.fails.length < res.fails.length) res = next;
  }
  return res;
}

function placeInOrder(ctx, o0, order) {
  const o = {...o0, items: order.map(i => o0.items[i])};
  const out = placeInOrder0(ctx, o);
  const labels = [];
  order.forEach((i, j) => { labels[i] = out.labels[j]; });
  return {labels, fails: out.fails};
}

function placeInOrder0(ctx, o) {
  const placed = [];
  const results = [];
  const maxGap = o.maxGap ?? 34;
  const fails = [];
  // owner proximity: the chip is nearer its own seat than any other seat or chair
  const seatPts = o.seatPoints || [];
  const ownsIt = (box, it) => {
    const own = boxDist(box, it.at);
    return seatPts.every(q => Math.hypot(q.x - it.at.x, q.y - it.at.y) < 1 || boxDist(box, q) > own + (o.ownMargin ?? 8));
  };
  for (const it of o.items) {
    let best = null;
    // level 0: furniture and empty chairs are obstacles; level 1: furniture only costs (empty chairs stay obstacles)
    for (const level of [0, 1]) {
    if (best) break;
    const hard = [...(o.hardAlways || []), ...(level === 0 ? (o.hard || []) : [])];
    for (const [wk, lines] of [[1, o.maxLines ?? 3], [0.8, o.maxLines ?? 3], [0.66, (o.maxLines ?? 3) + 1], [0.52, (o.maxLines ?? 3) + 1], [0.44, (o.maxLines ?? 3) + 2]]) {
      const mw = o.maxWidth * wk - o.size * 1.2;
      // never break a word: skip widths narrower than the widest word
      if (Math.max(...glue(it.text).split(/[ \t\n]+/).map(wd => measure(wd, o.minSize, 600, 'sans'))) > mw) continue;
      const fit = fitWords(glue(it.text), {maxWidth: mw, size: o.size, minSize: o.minSize, maxLines: lines, weight: 600});
      if (fit.truncated) continue;
      const padX = o.size * 0.6, padY = o.size * 0.38;
      const w = fit.width + padX * 2, hh = fit.height + padY * 2;
      const R = it.rad;
      const cands = [];
      for (const gap of [...new Set([10, 20, (20 + maxGap) / 2, maxGap, maxGap * 0.33, maxGap * 0.66, maxGap * 0.85].filter(v => v <= maxGap))]) {
        for (const f of [0, -0.3, 0.3, -0.5, 0.5, -0.75, 0.75]) {
          cands.push({x: it.at.x + R + gap, y: it.at.y - hh / 2 + f * hh}, {x: it.at.x - R - gap - w, y: it.at.y - hh / 2 + f * hh});
          cands.push({x: it.at.x - w / 2 + f * w, y: it.at.y + R + gap}, {x: it.at.x - w / 2 + f * w, y: it.at.y - R - gap - hh});
        }
        const d = (R + gap) * 0.72;
        cands.push({x: it.at.x + d, y: it.at.y + d}, {x: it.at.x - d - w, y: it.at.y + d}, {x: it.at.x + d, y: it.at.y - d - hh}, {x: it.at.x - d - w, y: it.at.y - d - hh});
      }
      if (level === 1) {
        // finer ring scan: every box position whose gap to the person stays within maxGap
        const reach = R + maxGap;
        for (let y = it.at.y - reach - hh; y <= it.at.y + reach; y += 8) {
          for (let x = it.at.x - reach - w; x <= it.at.x + reach; x += 8) cands.push({x, y});
        }
      }
      const why = o.debug ? (o.debug[it.key] = o.debug[it.key] || {}) : null;
      const rej = k2 => { if (why) why[k2] = (why[k2] || 0) + 1; };
      for (const cnd of cands) {
        const box = {x: cnd.x, y: cnd.y, w, h: hh};
        if (!inside(box, o.bounds)) { rej('bounds'); continue; }
        const dPerson = boxDist(box, it.at) - R;
        if (dPerson > maxGap + 0.5 || dPerson < 4) { rej('gap'); continue; }
        if (o.people.some(q => !personClear(box, q))) { rej('people'); continue; }
        if (placed.some(q => overlaps(box, q, 10))) { rej('placed'); continue; }
        if ((o.extra || []).some(q => overlaps(box, q, 8))) { rej('extra'); continue; }
        const pad = o.pathPad ?? 46;
        if ((it.avoidPaths || []).some(path => path.some((q, j) => j && segBox(path[j - 1], q, box, pad)))) { rej('paths'); continue; }
        if (hard.some(q => overlaps(box, q, 3))) { rej('hard'); continue; }
        if (!ownsIt(box, it)) { rej('owner'); continue; }
        let cost = 0;
        for (const f of o.furniture) {
          if (!overlaps(box, f)) continue;
          cost += (Math.min(box.x + box.w, f.x + f.w) - Math.max(box.x, f.x)) * (Math.min(box.y + box.h, f.y + f.h) - Math.max(box.y, f.y));
        }
        cost = cost * 0.02 + dPerson * 1.5 + (1 - wk) * 60;
        if (!best || cost < best.cost) best = {box, fit, cost};
      }
      if (best) break;
    }
    }
    if (!best) {
      // fallback: nearest spot inside the bounds clear of people and chips (may exceed maxGap)
      const fit = fitWords(glue(it.text), {maxWidth: o.maxWidth - o.size * 1.2, size: o.size, minSize: o.minSize, maxLines: 4, weight: 600});
      const padX = o.size * 0.6, padY = o.size * 0.38;
      const w = fit.width + padX * 2, hh = fit.height + padY * 2;
      let bd = Infinity;
      const pad = o.pathPad ?? 46;
      for (const usePaths of o.strictPaths ? [true] : [true, false]) {
        for (let y = o.bounds.y; y <= o.bounds.y + o.bounds.h - hh; y += 12) {
          for (let x = o.bounds.x; x <= o.bounds.x + o.bounds.w - w; x += 12) {
            const box = {x, y, w, h: hh};
            if (o.people.some(q => !personClear(box, q)) || placed.some(q => overlaps(box, q, 10)) || (o.extra || []).some(q => overlaps(box, q, 8))) continue;
            if ((o.hardAlways || []).some(q => overlaps(box, q, 3)) || !ownsIt(box, it)) continue;
            if (usePaths && (it.avoidPaths || []).some(path => path.some((q, j) => j && segBox(path[j - 1], q, box, pad)))) continue;
            const d = boxDist(box, it.at);
            if (d < bd) { bd = d; best = {box, fit, cost: 1e6}; }
          }
        }
        if (best) break;
      }
      fails.push(it.key);
      if (!best) best = {box: {x: it.at.x + it.rad + 10, y: it.at.y, w, h: hh}, fit, cost: 1e9, none: true};
    }
    placed.push(best.box);
    // leader from the chip edge nearest the person to the person's rim
    const b = best.box;
    const near = {x: clamp(it.at.x, b.x, b.x + b.w), y: clamp(it.at.y, b.y, b.y + b.h)};
    const dx = near.x - it.at.x, dy = near.y - it.at.y;
    const L = Math.hypot(dx, dy) || 1;
    const rim = {x: it.at.x + (dx / L) * (it.rad - 6), y: it.at.y + (dy / L) * (it.rad - 6)};
    results.push({key: it.key, box: b, fit: best.fit, from: near, to: rim, gap: boxDist(b, it.at) - it.rad, none: Boolean(best.none)});
  }
  return {labels: results, fails};
}

/**
 * Caption beside a part (opt-in; used by element captions): tries the sides in `order` (with small slides
 * along each side) and keeps the cheapest box. Hard obstacles — texts, other parts AND furniture
 * (`hard`) — are never covered when any side is clear; connector rays (`rays`, segments leaving the part)
 * are avoided at a cost. Returns {box, side, clear}.
 * @param {{part:any, w:number, h:number, order:string[], gap?:number, frame:{w:number,h:number}, hard?:any[], rays?:any[][]}} o
 */
export function sideCaption(o) {
  const {part, w, h: hh, order, frame} = o;
  const gap = o.gap ?? 10;
  const cx = part.x + part.w / 2, cy = part.y + part.h / 2;
  const pos = {below: {x: cx - w / 2, y: part.y + part.h + gap}, above: {x: cx - w / 2, y: part.y - gap - hh}, right: {x: part.x + part.w + gap, y: cy - hh / 2}, left: {x: part.x - gap - w, y: cy - hh / 2}};
  let best = null;
  order.forEach((sd, oi) => {
    for (const sh of [0, -0.25, 0.25, -0.45, 0.45]) {
      const c0 = pos[sd];
      const box = sd === 'below' || sd === 'above' ? {x: c0.x + sh * w, y: c0.y, w, h: hh} : {x: c0.x, y: c0.y + sh * hh, w, h: hh};
      box.x = clamp(box.x, 2, frame.w - 2 - w);
      if (box.y < 2 || box.y + hh > frame.h - 2 || overlaps(box, part, 2)) continue;
      let cost = oi * 3 + Math.abs(sh) * 4;
      const hit = (o.hard || []).some(q => overlaps(box, q, 4));
      if (hit) cost += 1000;
      for (const [a0, b0] of o.rays || []) {
        for (let j = 1; j < 24; j++) {
          const z = {x: a0.x + ((b0.x - a0.x) * j) / 24, y: a0.y + ((b0.y - a0.y) * j) / 24};
          if (z.x > box.x - 10 && z.x < box.x + w + 10 && z.y > box.y - 10 && z.y < box.y + hh + 10) { cost += 40; break; }
        }
      }
      if (!best || cost < best.cost) best = {box, cost, side: sd, clear: !hit};
    }
  });
  return best || {box: {...pos[order[0]], w, h: hh}, side: order[0], clear: false};
}

/**
 * First clear spot (scan order: rows from `prefer` corner) for a box of size
 * w × h inside `bounds`: clear of people, chips/extra boxes and route
 * corridors; least furniture overlap wins among the first clear rows.
 * @returns {{x:number,y:number,w:number,h:number}|null}
 */
export function placeFree({w, h: hh, bounds, people = [], extra = [], paths = [], pathPad = 40, furniture = [], prefer = 'top-left', step = 10}) {
  let best = null;
  const xs = [], ys = [];
  for (let x = bounds.x; x <= bounds.x + bounds.w - w + 0.01; x += step) xs.push(x);
  for (let y = bounds.y; y <= bounds.y + bounds.h - hh + 0.01; y += step) ys.push(y);
  if (/right/.test(prefer)) xs.reverse();
  if (/bottom/.test(prefer)) ys.reverse();
  for (const y of ys) {
    for (const x of xs) {
      const box = {x, y, w, h: hh};
      if (people.some(q => boxDist(box, q) < q.rad + 6)) continue;
      if (extra.some(q => overlaps(box, q, 10))) continue;
      if (paths.some(path => path.some((q, j) => j && segBox(path[j - 1], q, box, pathPad)))) continue;
      let cost = 0;
      for (const f of furniture) if (overlaps(box, f)) cost += (Math.min(box.x + box.w, f.x + f.w) - Math.max(box.x, f.x)) * (Math.min(box.y + box.h, f.y + f.h) - Math.max(box.y, f.y));
      const score = cost * 0.05 + Math.abs(y - ys[0]) * 0.6 + Math.abs(x - xs[0]) * 0.3;
      if (!best || score < best.score) best = {box, score};
    }
  }
  return best ? best.box : null;
}

/**
 * Chip node for a placed seat label (+ leader). Named `${name}` (group),
 * `${name}-body` (chip), `${name}-text`, `${name}-lead`.
 * `dashed` draws the outline dashed (seat supplied but not taken).
 */
export function seatLabelNode(ctx, L, {name, size, dashed = false, color, owner, seat}) {
  const th = ctx.theme;
  const b = L.box;
  const col = color ?? th.ink;
  const padY = (b.h - L.fit.height) / 2;
  const tb = L.fit;
  const baseline = b.y + padY + tb.size * 0.8;
  return g({name, opacity: 0, 'data-owner': owner, 'data-seat': seat},
    h('line', {name: `${name}-lead`, x1: r(L.from.x), y1: r(L.from.y), x2: r(L.to.x), y2: r(L.to.y), stroke: col, 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(L.to.x), cy: r(L.to.y), r: 4.5, fill: col}),
    h('path', {name: `${name}-body`, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2, size * 0.7)), fill: th.card, stroke: col, 'stroke-width': 2.2, 'stroke-dasharray': dashed ? '7 6' : undefined}),
    h('text', {name: `${name}-text`, x: r(b.x + b.w / 2), y: r(baseline), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(tb.size, 2), 'font-weight': tb.weight, 'text-anchor': 'middle', fill: th.ink},
      tb.lines.map((ln, i) => h('tspan', {x: r(b.x + b.w / 2), dy: i === 0 ? 0 : r(tb.lineHeight, 2)}, ln))),
  );
}

/** A fitted chip (whole-word wrapping, numbers glued). */
export function gchip(ctx, text, o) {
  return wchip(ctx, glue(text), o);
}

/**
 * Small legend glyphs (design units), local origin at the glyph centre.
 */
export function legendGlyph(ctx, kind, s, look) {
  const c = planColors(ctx);
  if (kind === 'person') {
    const pp = planPerson(ctx, {name: 'lg-person', look});
    const nodes = pp.pose({x: 0, y: 0, deg: 0, scale: s / 100});
    return g(null, applyStatic(pp.node, nodes));
  }
  if (kind === 'route') {
    return h('path', {d: `M${r(-s * 0.45)} ${r(s * 0.1)}Q0 ${r(-s * 0.3)} ${r(s * 0.45)} ${r(s * 0.1)}`, fill: 'none', stroke: c.route, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': `0.1 ${r(6 * 2.6)}`});
  }
  if (kind === 'seat') return planChair(ctx, {cx: 0, cy: 0, deg: 0, s: s * 0.62});
  if (kind === 'door') {
    return g(null,
      h('path', {d: `M${r(-s * 0.45)} ${r(s * 0.3)}H${r(-s * 0.3)}M${r(s * 0.3)} ${r(s * 0.3)}H${r(s * 0.45)}`, stroke: c.wall, 'stroke-width': 10}),
      h('path', {d: `M${r(-s * 0.3)} ${r(s * 0.3)}A${r(s * 0.6)} ${r(s * 0.6)} 0 0 1 ${r(s * 0.3)} ${r(-s * 0.3)}`, fill: 'none', stroke: c.frame, 'stroke-width': 1.6, 'stroke-dasharray': '5 5'}),
      h('rect', {x: r(s * 0.26), y: r(-s * 0.3), width: 7, height: r(s * 0.6), fill: c.woodDark, stroke: '#1f2328', 'stroke-width': 1.4}));
  }
  return null;
}

/** Bake a pose record into a (name-less) node tree for static glyphs. */
function applyStatic(node, nodes) {
  const walk = n => {
    if (!n || typeof n === 'string') return n;
    const attrs = {...n.attrs};
    const rec = attrs.name ? nodes[attrs.name] : null;
    delete attrs.name;
    if (rec) for (const [k, v] of Object.entries(rec)) attrs[k] = v;
    return {tag: n.tag, attrs, children: n.children.map(walk)};
  };
  return walk(node);
}
export {applyStatic};

/** Common person radius (template units) for collision with labels. */
export const PERSON_RAD = PERSON.half;

/** Serialize a point for semantic state. */
export const R2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);

/** Lerp between two points. */
export const mixP = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});

/* ------------------------------------------------------------------ */
/* Movable tables (contrast): layouts of the two table units           */
/* ------------------------------------------------------------------ */

/** Supplied table arrangements (a layout carries no legal meaning). */
export const TABLE_LAYOUTS = ['side-by-side', 'facing', 'angled'];
/** Length of a movable table (template units) in every arrangement. */
export const UNIT_LEN = 190;

/**
 * Poses of the two table units (each = a table and its two chairs) for an
 * arrangement, plus the resulting chair slots. 'joined' is the shared start
 * pose (both tables pushed together in the middle of the room).
 * @param {any} G roomGeometry()
 * @param {'joined'|'side-by-side'|'facing'|'angled'} layout
 */
export function tableUnits(G, layout) {
  const [L, R] = G.tables;
  const half = UNIT_LEN / 2;
  const my = (G.yF + G.yB) / 2;
  let units;
  if (layout === 'joined') units = [{x: G.W / 2 - half - 2, y: L.cy, a: 0}, {x: G.W / 2 + half + 2, y: R.cy, a: 0}];
  else if (layout === 'facing') units = [{x: G.W / 2 - 88, y: my, a: 90}, {x: G.W / 2 + 88, y: my, a: -90}];
  else if (layout === 'angled') units = [{x: L.cx, y: L.cy, a: 16}, {x: R.cx, y: R.cy, a: -16}];
  else units = [{x: L.cx, y: L.cy, a: 0}, {x: R.cx, y: R.cy, a: 0}];
  const seat = (u, sx) => {
    const a = (u.a * Math.PI) / 180;
    const lx = sx, ly = 64;
    return {x: u.x + lx * Math.cos(a) - ly * Math.sin(a), y: u.y + lx * Math.sin(a) + ly * Math.cos(a), deg: ((u.a % 360) + 360) % 360, kind: 'table'};
  };
  const off = UNIT_LEN / 2 - 22;
  return {units, slots: {left1: seat(units[0], -off), left2: seat(units[0], off), right1: seat(units[1], -off), right2: seat(units[1], off)}};
}

/** Interpolated unit pose between two layouts (rotation by the shortest turn). */
export function mixUnits(a, b, t) {
  return a.units.map((u, i) => {
    const v = b.units[i];
    const da = ((((v.a - u.a) % 360) + 540) % 360) - 180;
    return {x: lerp(u.x, v.x, t), y: lerp(u.y, v.y, t), a: u.a + da * t};
  });
}

/**
 * The part of a walker's route still ahead at normalized time t (for label
 * placement: a label that appears at t only has to stay clear of what others
 * still walk after t). Returns template-unit points.
 */
export function remainingPath(w, t, walkEnd = 0.84) {
  const q = w.end > w.start ? clamp((t - w.start) / (w.end - w.start)) : t >= w.end ? 1 : 0;
  const s = ease.inOutSine(clamp(q / walkEnd));
  if (s >= 1) return [];
  const n = 60;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const f = s + ((1 - s) * i) / n;
    const p = w.poly.at(f);
    out.push({x: p.x, y: p.y});
  }
  return out;
}

/**
 * Obstacles for the label placer in design units: `hard` (desk, tables,
 * bench, plants), `hardAlways` (empty chairs — a chip on an empty chair reads
 * as that chair's label) and `seatPoints` (every chair/seat centre, for the
 * owner-proximity rule). `mapPt` maps template → design coordinates (it may
 * rotate); slots override lets moved tables supply their chair positions.
 */
export function seatObstacles(G, mapPt, occupied, {slots = G.slots, tables = null} = {}) {
  const mapBox = b => {
    const pts = [mapPt({x: b.x, y: b.y}), mapPt({x: b.x + b.w, y: b.y}), mapPt({x: b.x, y: b.y + b.h}), mapPt({x: b.x + b.w, y: b.y + b.h})];
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  };
  const furn = furnitureBoxes(G).filter(f => f.kind !== 'chair' && (tables ? f.kind !== 'table' : true));
  const hard = [...furn.map(mapBox), ...(tables || []).map(mapBox)];
  const hardAlways = Object.entries(slots).filter(([nm, s]) => s.kind !== 'bench' && !occupied.has(nm)).map(([, s]) => mapBox({x: s.x - 31, y: s.y - 31, w: 62, h: 62}));
  // an empty place on the bench is not a chair: a chip may rest on the free end of its owner's bench
  const seatPoints = Object.entries(slots).filter(([nm, s]) => s.kind !== 'bench' || occupied.has(nm)).map(([, s]) => mapPt(s));
  return {hard, hardAlways, seatPoints, mapBox};
}

/** Oriented body box of a seated/standing person seen from above (design units). */
export function bodyBox(pt, deg, rad) {
  const side = Math.abs(Math.sin((deg * Math.PI) / 180)) > 0.7;
  return side ? {x: pt.x, y: pt.y, rad, hw: rad * 0.62, hh: rad} : {x: pt.x, y: pt.y, rad, hw: rad, hh: rad * 0.62};
}
