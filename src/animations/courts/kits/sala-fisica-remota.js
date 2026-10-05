/**
 * "Sala física y remota" kit (LAW-0213..0216): a generic, fictional hearing
 * room drawn as a floor plan, with a bench (a judicial table on a platform)
 * and generic remote-participant WINDOWS around the room edge. Each window is
 * a plain screen (dark bezel, a small camera dot, no platform logo or UI)
 * showing a participant at a desk in their own place, drawn in the same plan
 * language and at the SAME size as the people in the room.
 *
 * The concrete action: the bench connects with the windows. A solid link line
 * is drawn from a small link hub on the bench to the window's room-facing
 * edge; when it lands the window's camera dot lights and the participant in
 * the window takes their seat. Participants who appear in the room walk from
 * the corridor through the door and sit (walkers from the courts pilot).
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md, docs/AUTHORING.md): the building,
 * room, seats and windows are fictional placeholders; WHERE each participant
 * appears (a seat in the room or a window) is SUPPLIED by the author. Nothing
 * here states or implies that appearing remotely is allowed, required, valid,
 * equivalent or lesser, nor any rule, time limit or outcome. In-room and remote
 * participants get the same person size, label size and stroke style; links
 * are solid (dashes mean disputed/pending in this library and are never used
 * to tell the two apart).
 *
 * The kit owns fields, defaults, strings, the template geometry (room +
 * corridor + window slots), the link paths, the schedule of arrivals and the
 * shared art. Each entry owns its timeline, composition and semantics.
 * Generic art comes from ./courts-art.js; walkers, label placement and text
 * helpers are imported read-only from ./distribucion-de-sala.js.
 * @module animations/courts/kits/sala-fisica-remota
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {
  planColors, floorArea, wallRing, planDoor, planPlatform, planTable, planChair, planPlant, planPerson,
} from './courts-art.js';
import {planWalkers, walkerAt, doorOpen, roundCorners, applyStatic, WALL} from './distribucion-de-sala.js';

export {
  walkerAt, doorOpen, placeSeatLabels, seatLabelNode, placeFree, sideCaption, remainingPath, bodyBox, personClear, segBox,
  gchip, glue, fitWords, pxPerUnit, overlaps, inside, R2, PERSON_RAD, mixP, applyStatic, roundCorners, WALL,
} from './distribucion-de-sala.js';

const INK = '#1f2328';

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

/** Places in the generic room (front = behind the bench). */
export const ROOM_SLOTS = ['front', 'left1', 'left2', 'right1', 'right2'];
/** Remote windows around the room edge: 1/2 on the left wall (upper, lower), 3/4 on the right wall. */
export const WIN_SLOTS = ['win1', 'win2', 'win3', 'win4'];
export const SLOTS = [...ROOM_SLOTS, ...WIN_SLOTS];
export const isWin = slot => /^win\d$/.test(slot);

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role or to where a person appears)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: courts, routes, seats, labels). */
export const sfrFields = {
  courts: obj('Generic, fictional building and hearing room (no real court, building shape, emblem or platform)', {
    building: str('Name printed under the generic building (fictional)', 60),
    room: str('Name of the room drawn as a plan (fictional)', 60),
  }, ['building', 'room']),
  seats: list('Places of the participants, as supplied: a seat in the generic room (front, left1/left2, right1/right2) or a remote window around the room edge (win1/win2 on the left wall, win3/win4 on the right wall), each with its editable label. Where a participant appears is as supplied and carries no legal meaning', obj('Place', {
    slot: oneOf('Place: a room seat (front = behind the bench; left1/left2 and right1/right2 = the two tables) or a remote window (win1–win4)', SLOTS),
    label: str('Editable label of the participant at this place (as supplied)', 60),
  }, ['slot', 'label']), 2, 6),
  routes: list('Arrival order (as supplied): a place in the room is reached by walking through the main door; a window is reached by the bench drawing a link to it. A route to an unknown or already used place is ignored', obj('Route', {
    seat: int('Index of the place in `seats`', 0, 5),
  }, ['seat']), 1, 6),
  labels: obj('Editable built-in captions', {
    mainDoor: str('Caption of the main door', 30),
    key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 90),
  }),
  people: list('Optional appearance of the person on each route, in route order', obj('Person', {appearance}), 0, 6),
};

export const SFR_EN = {
  courts: {building: 'Civic building (fictional)', room: 'Hearing room 3 (fictional)'},
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'win1', label: 'Participant B'},
    {slot: 'right1', label: 'Participant C'},
    {slot: 'win2', label: 'Participant D'},
  ],
  routes: [{seat: 0}, {seat: 1}, {seat: 2}, {seat: 3}, {seat: 4}],
  labels: {mainDoor: 'Main door', key: 'Places and labels as supplied · no conclusion drawn'},
  people: [],
};

export const SFR_ES = {
  courts: {building: 'Edificio cívico (ficticio)', room: 'Sala de vistas 3 (ficticia)'},
  seats: [
    {slot: 'front', label: 'Asiento de presidencia (según lo aportado)'},
    {slot: 'left1', label: 'Participante A'},
    {slot: 'win1', label: 'Participante B'},
    {slot: 'right1', label: 'Participante C'},
    {slot: 'win2', label: 'Participante D'},
  ],
  routes: SFR_EN.routes,
  labels: {mainDoor: 'Puerta principal', key: 'Lugares y etiquetas según lo aportado · sin conclusión'},
  people: [],
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const SFR_LONG = {
  courts: {building: 'Municipal civic services building, east wing (fictional)', room: 'Multipurpose hearing room 3, first floor (fictional)'},
  seats: [
    {slot: 'front', label: 'Presiding seat behind the bench (as supplied)'},
    {slot: 'left1', label: 'Participant A, seated at the left-hand table'},
    {slot: 'win1', label: 'Participant B, shown in the upper left window'},
    {slot: 'right1', label: 'Participant C, seated at the right-hand table'},
    {slot: 'win2', label: 'Participant D, shown in the lower left window'},
    {slot: 'win3', label: 'Participant E, shown in the upper right window'},
  ],
  routes: [{seat: 0}, {seat: 1}, {seat: 2}, {seat: 3}, {seat: 4}, {seat: 5}],
  labels: {mainDoor: 'Main door from the corridor', key: 'Places and labels are shown as supplied by the author · no conclusion drawn'},
  people: [],
};

export const SFR_STRINGS = {
  en: {seated: 'seated', waiting: 'waiting', linked: 'linked', allPlaced: 'Everyone in place (as supplied)', lastWaiting: 'The last participant is not yet in place (as supplied)', was: 'was'},
  es: {seated: 'sentado', waiting: 'esperando', linked: 'enlazado', allPlaced: 'Todos en su lugar (según lo aportado)', lastWaiting: 'La última persona aún no está en su lugar (según lo aportado)', was: 'antes'},
};

/* ------------------------------------------------------------------ */
/* Resolved params                                                     */
/* ------------------------------------------------------------------ */

/**
 * Valid places (first use of a slot wins) and valid routes (known place,
 * first route to a place wins), each with its kind ('room' | 'window') and the
 * participant's look (seeded by arrival order, never by kind).
 */
export function resolveSfr(ctx, p) {
  const seen = new Set();
  const seats = [];
  p.seats.forEach((s, i) => {
    if (seen.has(s.slot)) return;
    seen.add(s.slot);
    seats.push({...s, index: i, kind: isWin(s.slot) ? 'window' : 'room'});
  });
  const bySeat = new Map(seats.map(s => [s.index, s]));
  const taken = new Set();
  const routes = [];
  p.routes.forEach((rt, i) => {
    const seat = bySeat.get(rt.seat);
    if (!seat || taken.has(rt.seat)) return;
    taken.add(rt.seat);
    routes.push({seat: rt.seat, door: 'main', index: i, slot: seat.slot, label: seat.label, kind: seat.kind, look: actorLook(ctx, (p.people || [])[routes.length], routes.length)});
  });
  return {seats, routes};
}

/* ------------------------------------------------------------------ */
/* Template geometry                                                   */
/* ------------------------------------------------------------------ */

export const CORRIDOR = 150;
/** Remote window tile (template units): bezel included. */
export const TILE = {w: 190, h: 176, bezel: 12, gap: 100, channel: 42};
/** Room above the upper windows and below the lowest one for their labels (template units). */
export const LABEL_TOP = 64;
export const LABEL_BOTTOM = 70;
export const ROOM_MIN = {W: 680, H: 600};
/** Link hub box on the bench (template units). */
export const HUB = {w: 40, h: 28};
/** Bench centre line (template y) — the upper windows are level with it. */
export const DESK_CY = 114;
const Y1 = DESK_CY - TILE.h / 2;
/** Window arrangements around the room edge: one column on the left wall, or split over both side walls. */
export const ARRANGEMENTS = ['column', 'split', 'right'];
/** Arrangements that keep every window within two rows of the bench (so each link runs clear of the tables). */
export const arrangementsFor = n => (n <= 2 ? ['column', 'split'] : ['split']);

/**
 * Where each drawn window goes (a layout decision, not supplied data): in slot
 * order, 'column' stacks every window on the left wall; 'split' alternates
 * left and right, row by row. Returns {slot: {side, row}}.
 */
export function winPlaces(winSlots, arrangement = 'column') {
  const out = {};
  WIN_SLOTS.filter(s => winSlots.includes(s)).forEach((s, i) => {
    out[s] = arrangement === 'split' ? {side: i % 2 ? 'right' : 'left', row: Math.floor(i / 2)} : {side: arrangement === 'right' ? 'right' : 'left', row: i};
  });
  return out;
}

function sideRows(places) {
  const rows = {left: 0, right: 0};
  for (const q of Object.values(places)) rows[q.side] = Math.max(rows[q.side], q.row + 1);
  return rows;
}

const tileTop = row => Y1 + row * (TILE.h + TILE.gap);
/** Margin beyond the outer edge of the windows for their labels when the plan is drawn turned (template units). */
export const outerPad = rot => (rot ? 64 : 0);
/** Space above the room interior: the wall, or (with windows) room for their labels. */
export const topPad = anyWin => (anyWin ? Math.max(WALL, LABEL_TOP - Y1) : WALL);

/** Non-room template extents (added to W and H) and the smallest H for the windows drawn. */
export function extras(winSlots, arrangement = 'column', outer = 0) {
  const rows = sideRows(winPlaces(winSlots, arrangement));
  const side = WALL + TILE.channel + TILE.w + outer;
  const n = Math.max(rows.left, rows.right);
  const bottom = n ? tileTop(n - 1) + TILE.h + LABEL_BOTTOM : 0;
  return {
    x: (rows.left ? side : WALL) + (rows.right ? side : WALL),
    y: topPad(n > 0) + WALL + CORRIDOR + WALL,
    minH: Math.max(ROOM_MIN.H, Math.ceil(bottom - (2 * WALL + CORRIDOR))),
  };
}

/**
 * Room interior W × H whose plan (room + corridor + windows) matches a box
 * aspect (rot = -90 draws the plan turned a quarter, so its aspect inverts).
 * Returns {W, H, k} with k = design units per template unit.
 */
export function fitSfr(box, winSlots, rot = 0, arrangement = 'column', depth = 0) {
  const ex = extras(winSlots, arrangement, outerPad(rot));
  ex.minH += depth;
  const ar = rot ? box.h / box.w : box.w / box.h; // template aspect wanted
  let W = ROOM_MIN.W, H = ex.minH;
  if (ar > (W + ex.x) / (H + ex.y)) W = Math.round(ar * (H + ex.y) - ex.x);
  else H = Math.round((W + ex.x) / ar - ex.y);
  W = Math.min(W, 1400);
  H = Math.max(ex.minH, Math.min(H, 1100));
  const ew = W + ex.x, eh = H + ex.y;
  const k = rot ? Math.min(box.w / eh, box.h / ew) : Math.min(box.w / ew, box.h / eh);
  return {W, H, k};
}

/**
 * Geometry of the generic hearing room, its corridor and the windows drawn.
 * Interior origin = top-left of the room floor; the bench is at the top.
 * Compatible with the pilot walkers (planWalkers / doorOpen): slots with
 * `kind`, doors.main {out, gate, in}, spots.main, yF, yB, aisleX, desk, W.
 * @param {number} W
 * @param {number} H
 * @param {string[]} winSlots windows drawn (their tiles and hubs)
 * @param {'column'|'split'} [arrangement]
 */
export function sfrGeometry(W, H, winSlots = [], arrangement = 'column', outer = 0, opts = {}) {
  const t = WALL, cw = opts.corridor ?? CORRIDOR;
  const compact = Boolean(opts.compact);
  const tableW = W >= 900 ? 236 : 214;
  const tableH = 56;
  const tableY = Math.round(185 + (Math.min(H, 820) - 185) * 0.33);
  const chairY = tableY + 64;
  const aisle = 136;
  // compact: one table in the middle of a smaller room (its two chairs are left1 / left2)
  const lx = compact ? W / 2 : W / 2 - aisle / 2 - tableW / 2, rx = W / 2 + aisle / 2 + tableW / 2;
  const seatOff = tableW / 2 - 26;
  const deskW = Math.min(310, W * 0.38);
  const desk = {cx: W / 2, cy: DESK_CY, w: deskW, h: 52};
  const slots = {
    front: {x: W / 2, y: 54, deg: 180, kind: 'desk'},
    left1: {x: lx - seatOff, y: chairY, deg: 0, kind: 'table'},
    left2: {x: lx + seatOff, y: chairY, deg: 0, kind: 'table'},
  };
  if (!compact) {
    slots.right1 = {x: rx - seatOff, y: chairY, deg: 0, kind: 'table'};
    slots.right2 = {x: rx + seatOff, y: chairY, deg: 0, kind: 'table'};
  }
  const platform = {x: W / 2 - Math.min(270, W * 0.36), y: 0, w: Math.min(540, W * 0.72), h: 158};
  const tables = compact ? [{cx: lx, cy: tableY, w: tableW, h: tableH}] : [{cx: lx, cy: tableY, w: tableW, h: tableH}, {cx: rx, cy: tableY, w: tableW, h: tableH}];
  const yF = Math.round((platform.h + 22 + tableY - tableH / 2) / 2);
  const yB = Math.round((chairY + 40 + H - 58) / 2);
  const mdA = Math.round(W * 0.66);
  const mainDoor = {a: mdA, b: mdA + 116};
  const mdx = (mainDoor.a + mainDoor.b) / 2;
  const doors = {main: {out: {x: mdx, y: H + t + cw / 2}, gate: {x: mdx, y: H + t / 2}, in: {x: mdx, y: H - 58}, side: 'bottom', a: mainDoor.a, b: mainDoor.b}};
  const cy = H + t + cw / 2;
  const spots = {main: []};
  for (let i = 1; i <= 6; i++) { const x = mdx - i * 116; if (x > 64) spots.main.push({x, y: cy, deg: 90}); }
  for (let i = 1; i <= 4; i++) { const x = mdx + i * 116; if (x < W - 64) spots.main.push({x, y: cy, deg: 270}); }
  // windows: tile boxes beside the room walls, the first row level with the bench
  const places = winPlaces(winSlots, arrangement);
  const rows = sideRows(places);
  const tw = TILE.w, th = TILE.h;
  const xl = -t - TILE.channel - tw, xr = W + t + TILE.channel;
  const win = {};
  for (const [slot, q] of Object.entries(places)) {
    const x = q.side === 'left' ? xl : xr, y = tileTop(q.row);
    const cxT = x + tw / 2, cyT = y + th / 2;
    const toward = q.side === 'left' ? 1 : -1; // +x = towards the room for a left window
    win[slot] = {
      slot, side: q.side, row: q.row, box: {x, y, w: tw, h: th},
      inner: {x: x + TILE.bezel, y: y + TILE.bezel, w: tw - 2 * TILE.bezel, h: th - 2 * TILE.bezel},
      port: {x: q.side === 'left' ? x + tw : x, y: cyT},
      seat: {x: cxT - 24 * toward, y: cyT, deg: q.side === 'left' ? 90 : 270},
      desk: {cx: cxT + 36 * toward, cy: cyT, w: 124, h: 40, deg: 90},
    };
  }
  const used = {left: rows.left > 0, right: rows.right > 0};
  // link hubs on the bench ends (only on the sides that have windows)
  const hubs = {left: {x: desk.cx - desk.w / 2 + 30, y: desk.cy}, right: {x: desk.cx + desk.w / 2 - 30, y: desk.cy}};
  const room = {x: 0, y: 0, w: W, h: H};
  const sideW = t + TILE.channel + tw + outer;
  const n = Math.max(rows.left, rows.right);
  const tp = topPad(n > 0);
  const bottom = Math.max(H + t + cw + t, n ? tileTop(n - 1) + th + LABEL_BOTTOM : 0);
  const extents = {x: used.left ? -sideW : -t, y: -tp, w: W + (used.left ? sideW : t) + (used.right ? sideW : t), h: bottom + tp};
  const plants = [{x: 42, y: 42}, {x: W - 42, y: 42}];
  const lobbyDoor = {a: 40, b: 156};
  return {W, H, t, cw, slots, platform, desk, tables, yF, yB, doors, spots, room, extents, plants, lobbyDoor, mainDoor, aisleX: compact ? W / 2 + 150 : W / 2, win, hubs, used, chairY, tableY, arrangement, compact};
}

/** Furniture boxes (template units): desk, tables, chairs, plants, hubs; window screens separately. */
export function furnitureBoxes(G) {
  const out = [];
  out.push({kind: 'desk', x: G.desk.cx - G.desk.w / 2, y: G.desk.cy - G.desk.h / 2, w: G.desk.w, h: G.desk.h});
  for (const tb of G.tables) out.push({kind: 'table', x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h});
  for (const [name, s] of Object.entries(G.slots)) out.push({kind: 'chair', slot: name, x: s.x - 34, y: s.y - 34, w: 68, h: 68});
  for (const pl of G.plants) out.push({kind: 'plant', x: pl.x - 26, y: pl.y - 26, w: 52, h: 52});
  return out;
}

/**
 * Link path (template units) from the bench hub on the window's side to the
 * window's room-facing edge: straight when level with the hub, otherwise one
 * diagonal run and a short level entry into the port.
 */
export function linkPath(G, slot) {
  const w = G.win[slot];
  const hub = G.hubs[w.side];
  const port = w.port;
  // each link leaves the hub box from its own edge point, towards its first leg
  const start = dir => {
    const L = Math.hypot(dir.x, dir.y) || 1;
    const ux = dir.x / L, uy = dir.y / L;
    const t = Math.min(HUB.w / 2 / Math.max(Math.abs(ux), 1e-6), HUB.h / 2 / Math.max(Math.abs(uy), 1e-6));
    return {x: hub.x + ux * t, y: hub.y + uy * t};
  };
  if (Math.abs(port.y - hub.y) < 2) return [start({x: port.x - hub.x, y: 0}), {...port}];
  const entry = {x: port.x + (w.side === 'left' ? 40 : -40), y: port.y};
  return roundCorners([start({x: entry.x - hub.x, y: entry.y - hub.y}), entry, {...port}], 34);
}

/* ------------------------------------------------------------------ */
/* Schedule of arrivals                                                */
/* ------------------------------------------------------------------ */

/**
 * Time windows of every arrival inside [a, b] (normalized time), in route
 * order: a room route is a walk (duration ∝ its length, pilot walkers), a
 * window route is a link draw plus the participant sitting down. Starts are
 * staggered and everyone is in place by b.
 * @returns {Array<any>} items {i, route, kind, start, end, walker?, link?}
 */
export function scheduleArrivals(G, routes, {a, b, linkDur = 0.12, minGap = 0.045}) {
  const roomRoutes = routes.filter(rt => rt.kind === 'room');
  const walkers = planWalkers(G, roomRoutes.map(rt => ({...rt, door: 'main'})), {a, b});
  const items = routes.map((rt, i) => {
    if (rt.kind === 'room') {
      const w = walkers[roomRoutes.indexOf(rt)];
      return {i, route: rt, kind: 'room', walker: w, len: w.poly.total};
    }
    const pts = linkPath(G, rt.slot);
    return {i, route: rt, kind: 'window', link: {pts, poly: polyline(pts)}};
  });
  const n = items.length;
  if (!n) return items;
  const span = b - a;
  const maxLen = Math.max(1, ...items.filter(q => q.kind === 'room').map(q => q.len));
  const maxDur = Math.min(0.26, span);
  let dur = items.map(q => (q.kind === 'room' ? maxDur * (0.3 + 0.7 * (q.len / maxLen)) : Math.min(linkDur, span)));
  let gap = 0;
  if (n > 1) {
    gap = 0.13;
    for (let i = 1; i < n; i++) gap = Math.min(gap, (span - dur[i]) / i);
    gap = Math.max(minGap, gap);
    dur = dur.map((d, i) => Math.min(d, span - i * gap));
  }
  items.forEach((q, i) => {
    q.start = a + i * gap;
    q.end = Math.min(b, q.start + Math.max(0.04, dur[i]));
    if (q.walker) { q.walker.start = q.start; q.walker.end = q.end; }
  });
  return items;
}

/**
 * State of a window arrival at local progress q ∈ [0, 1]: the link draws
 * (0 → 0.62), the camera dot lights as it lands, then the participant sits
 * (0.66 → 1).
 */
export function linkAt(q) {
  const draw = ease.inOutSine(clamp(q / 0.62));
  const landed = q >= 0.62;
  const seated = ease.inOutCubic(clamp((q - 0.66) / 0.34));
  return {draw, landed, seated, state: q <= 0 ? 'waiting' : q >= 1 ? 'seated' : landed ? 'sitting' : 'linking'};
}

/* ------------------------------------------------------------------ */
/* Plan frame (template → design, optionally a quarter turn)            */
/* ------------------------------------------------------------------ */

/**
 * Place the plan extents E in a design box, centred, at scale k, turned by
 * rot (0 or -90). Returns the group transform and point/box mappers.
 */
export function planFrame(E, box, k, rot = 0) {
  let ox, oy, toD;
  if (!rot) {
    ox = box.x + (box.w - E.w * k) / 2 - E.x * k;
    oy = box.y + (box.h - E.h * k) / 2 - E.y * k;
    toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
  } else {
    // rotate(-90): (x, y) → (y, -x)
    ox = box.x + (box.w - E.h * k) / 2 - E.y * k;
    oy = box.y + (box.h - E.w * k) / 2 + (E.x + E.w) * k;
    toD = q => ({x: ox + q.y * k, y: oy - q.x * k});
  }
  const mapBox = b => {
    const pts = [toD({x: b.x, y: b.y}), toD({x: b.x + b.w, y: b.y + b.h})];
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  };
  return {ox, oy, k, rot, toD, mapBox, transform: T(ox, oy, rot, k), rect: mapBox(E)};
}

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

/**
 * The room, its corridor, the bench (with link hubs), tables, chairs and the
 * main door. o.keep(box) decides per piece whether it is drawn (lens copies
 * draw each piece whole or not at all). o.rings: slots that get an empty-seat
 * ring. Returns {node, doors}.
 */
export function roomArt(ctx, G, o) {
  const P = o.prefix;
  const c = planColors(ctx);
  const {W, H, t, cw} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const parts = [];
  parts.push(floorArea(ctx, {name: `${P}-corr`, x: 0, y: H + t, w: W, h: cw, kind: 'planks'}));
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 62}));
  parts.push(planPlatform(ctx, {name: `${P}-platform`, ...G.platform}));
  parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: [{side: 'bottom', a: G.mainDoor.a, b: G.mainDoor.b, kind: 'door'}]}));
  parts.push(wallRing(ctx, {name: `${P}-outer`, x: 0, y: H + t, w: W, h: cw, t, sides: ['left', 'right', 'bottom'], gaps: [{side: 'bottom', a: G.lobbyDoor.a, b: G.lobbyDoor.b, kind: 'open'}, ...(o.corrGaps || [])]}));
  const deskB = {x: G.desk.cx - G.desk.w / 2, y: G.desk.cy - G.desk.h / 2, w: G.desk.w, h: G.desk.h};
  if (keep(deskB)) {
    parts.push(planTable(ctx, {name: `${P}-desk`, cx: G.desk.cx, cy: G.desk.cy, w: G.desk.w, h: G.desk.h, front: 'bottom', seedKey: 'bench'}));
    for (const side of ['left', 'right']) if (G.used[side]) parts.push(linkHub(ctx, {name: `${P}-hub-${side}`, ...G.hubs[side]}));
  }
  G.tables.forEach((tb, i) => { if (keep({x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h})) parts.push(planTable(ctx, {name: `${P}-table${i}`, ...tb, seedKey: `table${i}`})); });
  for (const [name, s] of Object.entries(G.slots)) {
    if (keep({x: s.x - 34, y: s.y - 34, w: 68, h: 68})) parts.push(planChair(ctx, {name: `${P}-chair-${name}`, cx: s.x, cy: s.y, deg: s.deg, s: 62}));
  }
  G.plants.forEach((pl, i) => { if (keep({x: pl.x - 26, y: pl.y - 26, w: 52, h: 52})) parts.push(planPlant(ctx, {name: `${P}-plant${i}`, cx: pl.x, cy: pl.y, s: 46, seedKey: `plant${i}`})); });
  const md = G.doors.main;
  const doors = {main: planDoor(ctx, {name: `${P}-door-main`, hinge: {x: md.b, y: H + t / 2}, width: md.b - md.a, closedDeg: 180, openDeg: 90})};
  parts.push(doors.main.node);
  const rings = (o.rings || []).map(slot => h('circle', {name: `${P}-ring-${slot}`, cx: r(G.slots[slot].x), cy: r(G.slots[slot].y), r: 44, fill: 'none', stroke: c.frame, 'stroke-width': 2.5, 'stroke-dasharray': '7 7'}));
  return {node: g({name: `${P}-room`}, parts, rings), doors, colors: c};
}

/** Small link hub on the bench (a dark box with a lens), neutral. */
export function linkHub(ctx, {name, x, y, w = HUB.w, hh = HUB.h}) {
  const c = planColors(ctx);
  return g({name, transform: T(x, y)},
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 6), fill: c.wallEdge, stroke: INK, 'stroke-width': 1.8}),
    h('circle', {cx: r(-w * 0.18), r: r(hh * 0.2), fill: '#9fb3c2', stroke: INK, 'stroke-width': 1.2}),
    h('circle', {cx: r(w * 0.18), r: r(hh * 0.2), fill: '#9fb3c2', stroke: INK, 'stroke-width': 1.2}));
}

/**
 * A remote window (template units): a plain screen — dark bezel, a camera dot
 * on the room-facing edge, a faint glare line — showing the participant's own
 * place: a floor, a desk and a chair (the person is drawn by the entry, at the
 * same size as the people in the room). Named parts: `${name}` (group),
 * `${name}-cam` (the camera dot; lit when linked).
 */
export function windowArt(ctx, G, slot, {name}) {
  const c = planColors(ctx);
  const w = G.win[slot];
  const b = w.box, inn = w.inner;
  const lines = [];
  for (let gx = inn.x + 44; gx < inn.x + inn.w - 2; gx += 44) lines.push(`M${r(gx)} ${r(inn.y)}V${r(inn.y + inn.h)}`);
  for (let gy = inn.y + 44; gy < inn.y + inn.h - 2; gy += 44) lines.push(`M${r(inn.x)} ${r(gy)}H${r(inn.x + inn.w)}`);
  const camX = w.side === 'left' ? b.x + b.w - TILE.bezel / 2 : b.x + TILE.bezel / 2;
  return g({name},
    h('path', {d: roundRectPath(b.x + 6, b.y + 9, b.w, b.h, 16), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 16), fill: '#2f353c', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(inn.x, inn.y, inn.w, inn.h, 6), fill: '#e8edf1'}),
    h('path', {d: lines.join(''), stroke: '#d5dde3', 'stroke-width': 1.4, fill: 'none'}),
    h('path', {d: roundRectPath(inn.x + 5, inn.y + 5, inn.w - 10, inn.h * 0.22, 4), fill: '#dfe5ea'}),
    planTable(ctx, {cx: w.desk.cx, cy: w.desk.cy, w: w.desk.w, h: w.desk.h, deg: w.desk.deg, seedKey: `${slot}-desk`}),
    planChair(ctx, {cx: w.seat.x, cy: w.seat.y, deg: w.seat.deg, s: 62, color: c.seat}),
    h('path', {d: `M${r(inn.x + inn.w - 34)} ${r(inn.y + 8)}l22 22M${r(inn.x + inn.w - 50)} ${r(inn.y + 8)}l38 38`, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.55}),
    h('circle', {name: `${name}-cam`, cx: r(camX), cy: r(w.port.y), r: 5.5, fill: '#6b7682', stroke: INK, 'stroke-width': 1.4}),
  );
}

/** Lit / unlit camera dot record. */
export const camLit = (ctx, on) => ({fill: on ? ctx.theme.accent2 : '#6b7682'});

/**
 * Solid link line (template units) with draw-on and end dots; frame(p) draws
 * it from the hub (p = 0) to the window (p = 1). Never dashed.
 */
export const LINK_COLOR = '#34495e';
export function linkLine(ctx, {name, pts, width = 6, color}) {
  const poly = polyline(pts);
  const total = poly.total;
  const col = color ?? LINK_COLOR;
  const d = poly.d(1);
  const a = pts[0], b = pts[pts.length - 1];
  const node = g({name, opacity: 0},
    h('path', {d, fill: 'none', stroke: '#ffffff', 'stroke-width': width + 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.8, name: `${name}-halo`, 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: col, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-a`, cx: r(a.x), cy: r(a.y), r: r(width * 1.35), fill: col, stroke: INK, 'stroke-width': 1.4}),
    h('circle', {name: `${name}-b`, cx: r(b.x), cy: r(b.y), r: r(width * 1.35), fill: col, stroke: INK, 'stroke-width': 1.4, opacity: 0}),
  );
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - clamp(p)));
    return {
      [name]: {opacity: r(p > 0 ? opacity : 0, 3)},
      [`${name}-halo`]: {'stroke-dashoffset': off},
      [`${name}-line`]: {'stroke-dashoffset': off},
      [`${name}-b`]: {opacity: p >= 0.985 ? 1 : 0},
    };
  };
  return {node, frame, poly, total};
}

/** A plan person posed for a window participant (standing → seated at their desk). */
export function remotePose(G, slot, seated) {
  const s = G.win[slot].seat;
  return {x: s.x, y: s.y, deg: s.deg, phase: 0, walk: 0, seated};
}

/* ------------------------------------------------------------------ */
/* Legend glyphs (design units, local origin at the glyph centre)      */
/* ------------------------------------------------------------------ */

export function sfrGlyph(ctx, kind, s, look) {
  const c = planColors(ctx);
  if (kind === 'room' || kind === 'window') {
    // the same seated person at the same size in both glyphs; only the surround differs (floor / screen)
    const pp = planPerson(ctx, {name: `lg-${kind}`, look});
    const person = applyStatic(pp.node, pp.pose({x: 0, y: s * 0.06, deg: 0, scale: s / 170, seated: 1}));
    const surround = kind === 'room'
      ? g(null, h('rect', {x: r(-s * 0.5), y: r(-s * 0.5), width: r(s), height: r(s), rx: 6, fill: c.floor, stroke: c.floorLine, 'stroke-width': 1.5}),
        h('path', {d: `M${r(-s * 0.5)} ${r(-s * 0.5)}H${r(s * 0.5)}`, stroke: c.wall, 'stroke-width': 5}))
      : g(null, h('rect', {x: r(-s * 0.5), y: r(-s * 0.5), width: r(s), height: r(s), rx: 7, fill: '#2f353c', stroke: INK, 'stroke-width': 1.6}),
        h('rect', {x: r(-s * 0.5 + 5), y: r(-s * 0.5 + 5), width: r(s - 10), height: r(s - 10), rx: 3, fill: '#e8edf1'}),
        h('circle', {cx: 0, cy: r(-s * 0.5 + 2.5), r: 2.5, fill: ctx.theme.accent2}));
    return g(null, surround, person);
  }
  if (kind === 'link') {
    return g(null,
      h('path', {d: `M${r(-s * 0.42)} 0H${r(s * 0.42)}`, stroke: LINK_COLOR, 'stroke-width': 5, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(-s * 0.42), cy: 0, r: 6, fill: LINK_COLOR, stroke: INK, 'stroke-width': 1.2}),
      h('circle', {cx: r(s * 0.42), cy: 0, r: 6, fill: LINK_COLOR, stroke: INK, 'stroke-width': 1.2}));
  }
  if (kind === 'bench') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.48, -s * 0.18, s * 0.96, s * 0.36, 5), fill: planColors(ctx).wood, stroke: INK, 'stroke-width': 1.8}),
      linkHub(ctx, {x: -s * 0.28, y: 0, w: s * 0.26, hh: s * 0.18}));
  }
  return null;
}

/** Colour helpers used by the entries. */
export const tones = () => ({screen: '#2f353c', remoteFloor: '#e8edf1', link: LINK_COLOR, wallEdge: shade('#454b53', -0.2)});
