/**
 * "Presentación de una prueba en sala" kit (LAW-0225..0228): a generic,
 * fictional hearing room drawn as a floor plan, with a SHARED SCREEN on the
 * front wall (drawn face-on, as the plan's remote windows are), a lectern with
 * a document camera in the front aisle, the bench on its platform and two
 * tables. The concrete action: a participant carries a fictional document
 * from their table to the lectern and lays it on the camera plate; an
 * enlarged copy of the same sheet grows from the plate to the shared screen.
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md, docs/AUTHORING.md): the room,
 * the people and the document are fictional placeholders; whether the
 * document is shown on the shared screen is SUPPLIED by the author. Nothing
 * here states or implies admissibility, weight, an objection, a ruling or any
 * other outcome. "Not shown" only means "not shown on the shared screen in
 * this configured example": the document is drawn whole, in full colour, with
 * no strike, red, cross or dash. The document's content is lines and blocks
 * plus a short supplied fictional title.
 *
 * The kit owns fields, defaults, strings, the template geometry, the art and
 * a few pose helpers. Each entry owns its timeline, composition and semantics.
 * Generic art comes from ./courts-art.js; label placement and text helpers
 * are imported read-only from ./distribucion-de-sala.js.
 * @module animations/courts/kits/presentacion-de-prueba
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {planColors, floorArea, wallRing, planDoor, planPlatform, planTable, planChair, planPlant, planPerson} from './courts-art.js';
import {roundCorners, applyStatic} from './distribucion-de-sala.js';

export {
  placeSeatLabels, seatLabelNode, placeFree, sideCaption, bodyBox, personClear, gchip, glue, fitWords, pxPerUnit, overlaps, inside,
  R2, PERSON_RAD, mixP, applyStatic, roundCorners, WALL,
} from './distribucion-de-sala.js';

const INK = '#1f2328';
const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

/** Places in the generic room (front = behind the bench; left1/left2, right1/right2 = the two tables). */
export const PP_SLOTS = ['front', 'left1', 'left2', 'right1', 'right2'];
/** Places from which a participant can carry the document to the lectern (the tables). */
export const TABLE_SLOTS = ['left1', 'left2', 'right1', 'right2'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: courts, routes, seats, labels). */
export const ppFields = {
  courts: obj('Generic, fictional building and hearing room (no real court, building shape or emblem)', {
    building: str('Name printed under the generic building (fictional)', 60),
    room: str('Name of the room drawn as a plan (fictional)', 60),
  }, ['building', 'room']),
  seats: list('Participants and their places, as supplied: front = behind the bench; left1/left2 and right1/right2 = the two tables. Every listed place is drawn with its editable label; a place carries no legal meaning', obj('Place', {
    slot: oneOf('Place in the generic room', PP_SLOTS),
    label: str('Editable label of the participant at this place (as supplied)', 60),
  }, ['slot', 'label']), 2, 5),
  routes: list('Presentation order (as supplied), as seat indices: the first listed participant seated at a table carries the document to the lectern; the others look towards the shared screen in this order. Seats not listed are still drawn and keep facing the front; unknown or repeated indices are ignored', obj('Route', {
    seat: int('Index of the place in `seats`', 0, 4),
  }, ['seat']), 1, 5),
  labels: obj('Editable built-in captions', {
    document: str('Short fictional title of the document (no real case data)', 48),
    screen: str('Caption of the shared screen', 40),
    camera: str('Caption of the lectern with the document camera', 48),
    key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 90),
  }),
  people: list('Optional appearance of each seat’s person, in seat order', obj('Person', {appearance}), 0, 5),
};

export const PP_EN = {
  courts: {building: 'Civic building (fictional)', room: 'Hearing room 4 (fictional)'},
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'right1', label: 'Participant B'},
    {slot: 'right2', label: 'Participant C'},
  ],
  routes: [{seat: 1}, {seat: 0}, {seat: 2}, {seat: 3}],
  labels: {document: 'Document 3 (fictional)', screen: 'Shared screen', camera: 'Lectern with document camera', key: 'Places and labels as supplied · no conclusion drawn'},
  people: [],
};

export const PP_ES = {
  courts: {building: 'Edificio cívico (ficticio)', room: 'Sala de vistas 4 (ficticia)'},
  seats: [
    {slot: 'front', label: 'Asiento de presidencia (según lo aportado)'},
    {slot: 'left1', label: 'Participante A'},
    {slot: 'right1', label: 'Participante B'},
    {slot: 'right2', label: 'Participante C'},
  ],
  routes: PP_EN.routes,
  labels: {document: 'Documento 3 (ficticio)', screen: 'Pantalla común', camera: 'Atril con cámara de documentos', key: 'Lugares y etiquetas según lo aportado · sin conclusión'},
  people: [],
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const PP_LONG = {
  courts: {building: 'Municipal civic services building, east wing (fictional)', room: 'Multipurpose hearing room 4, first floor (fictional)'},
  seats: [
    {slot: 'front', label: 'Presiding seat behind the bench (as supplied)'},
    {slot: 'left1', label: 'Participant A, seated at the left-hand table'},
    {slot: 'left2', label: 'Representative of participant A (as supplied)'},
    {slot: 'right1', label: 'Participant B, seated at the right-hand table'},
    {slot: 'right2', label: 'Representative of participant B (as supplied)'},
  ],
  routes: [{seat: 1}, {seat: 0}, {seat: 2}, {seat: 3}, {seat: 4}],
  labels: {document: 'Document 3, printed plan of a fictional shop', screen: 'Shared screen on the front wall', camera: 'Lectern with the document camera (fictional)', key: 'Places, labels and the document are shown as supplied by the author · no conclusion drawn'},
  people: [],
};

export const PP_STRINGS = {
  en: {was: 'was'},
  es: {was: 'antes'},
};

/**
 * Valid seats (first use of a slot wins, every one drawn), the presentation
 * order (known seat, first use wins; the unlisted seats follow in seat order
 * without turning) and the presenter (the first listed table seat).
 */
export function resolvePP(ctx, p) {
  const seen = new Set();
  const seats = [];
  p.seats.forEach((s, i) => {
    if (seen.has(s.slot)) return;
    seen.add(s.slot);
    seats.push({...s, index: i, look: actorLook(ctx, (p.people || [])[i], i)});
  });
  const byIndex = new Map(seats.map(s => [s.index, s]));
  const order = [];
  for (const rt of p.routes) { const s = byIndex.get(rt.seat); if (s && !order.includes(s)) order.push(s); }
  const listed = new Set(order);
  const presenter = order.find(s => TABLE_SLOTS.includes(s.slot)) || seats.find(s => TABLE_SLOTS.includes(s.slot)) || null;
  // look order: the listed participants other than the presenter, in the supplied order
  const lookers = order.filter(s => s !== presenter);
  seats.forEach(s => { s.presenter = s === presenter; s.looks = listed.has(s) && s !== presenter; s.lookRank = lookers.indexOf(s); });
  return {seats, presenter, lookers};
}

/* ------------------------------------------------------------------ */
/* Geometry (template units; interior origin top-left, front at the top) */
/* ------------------------------------------------------------------ */

export const WALL_T = 18;
export const SCREEN = {w: 400, h: 262, bezel: 16};
export const DOC = {w: 46, h: 64};
/** Smallest interior that keeps the screen, the bench and both tables clear. */
export const PP_MIN = {W: 860, H: 680};

/** Interior size whose extents match a box aspect, so the plan fills it: {W, H, k}. */
export function fitPP(box, min = PP_MIN) {
  const ex = WALL_T * 2;
  const ar = box.w / box.h;
  let W = min.W, H = min.H;
  if (ar > (min.W + ex) / (min.H + ex)) W = Math.round(ar * (min.H + ex) - ex);
  else H = Math.round((min.W + ex) / ar - ex);
  W = Math.min(W, 1600);
  H = Math.min(H, 1300);
  const k = Math.min(box.w / (W + ex), box.h / (H + ex));
  return {W, H, k};
}

/**
 * @param {number} W interior width (≥ PP_MIN.W)
 * @param {number} H interior height (≥ PP_MIN.H)
 */
// (clearBelowScreen: template units kept free under the screen's bottom edge before a table's top — used when a
// caller hangs its own chips under the screen; 0, the default, leaves the geometry unchanged)
export function ppGeometry(W, H, {titleBand = 52, compact = false, screenW = SCREEN.w, clearBelowScreen = 0} = {}) {
  const t = WALL_T;
  // (a narrow room gets a proportionally smaller screen)
  const S = screenW === SCREEN.w ? SCREEN : {w: screenW, h: Math.round(screenW * (SCREEN.h / SCREEN.w)), bezel: SCREEN.bezel};
  // the shared screen hangs on the front wall, left of the bench (face-on, like the plan's other tiles)
  const screen = {x: 34, y: 16, w: S.w, h: S.h};
  screen.inner = {x: screen.x + S.bezel, y: screen.y + S.bezel, w: S.w - 2 * S.bezel, h: S.h - 2 * S.bezel};
  screen.c = {x: screen.x + S.w / 2, y: screen.y + S.h / 2};
  // the bench on its platform, right of the screen
  // (compact: the room of an exploded plan, whose screen hangs elsewhere — the bench is centred)
  const px0 = compact ? W * 0.2 : screen.x + S.w + 46;
  const platform = {x: px0, y: 0, w: compact ? W * 0.6 : W - px0 - 30, h: 150};
  const desk = {cx: platform.x + platform.w / 2, cy: 108, w: Math.min(300, platform.w * 0.66), h: 50};
  // two tables facing the front, their chairs behind them: side by side in a wide room, one behind the other in a
  // tall one (so neighbouring participants keep room for their labels)
  const stacked = compact || H > W * 1.05;
  const tableH = 56;
  let tables, slots0, tableY;
  // (narrowSide: a narrow room with its two tables side by side — wider tables, a narrower aisle)
  const narrowSide = !stacked && !compact && W < 760;
  if (!stacked) {
    const aisle = narrowSide ? 130 : 150;
    const tableW = narrowSide ? (W - aisle - 80) / 2 : Math.min(250, (W - 200) / 4);
    tableY = Math.max(screen.y + S.h + (narrowSide ? 200 : 190), Math.round(H * 0.56), screen.y + S.h + clearBelowScreen + tableH / 2);
    const chairY = tableY + 64;
    const lx = W / 2 - aisle / 2 - tableW / 2, rx = W / 2 + aisle / 2 + tableW / 2;
    const seatOff = tableW / 2 - 30;
    tables = [{cx: lx, cy: tableY, w: tableW, h: tableH}, {cx: rx, cy: tableY, w: tableW, h: tableH}];
    slots0 = {
      left1: {x: lx - seatOff, y: chairY, deg: 0, kind: 'table', table: 0, outer: true},
      left2: {x: lx + seatOff, y: chairY, deg: 0, kind: 'table', table: 0},
      right1: {x: rx - seatOff, y: chairY, deg: 0, kind: 'table', table: 1},
      right2: {x: rx + seatOff, y: chairY, deg: 0, kind: 'table', table: 1, outer: true},
    };
  } else {
    const tableW = Math.min(380, W * (W < 760 && !compact ? 0.46 : 0.44));
    tableY = compact ? 250 : Math.max(screen.y + S.h + (W < 760 ? 130 : 190), Math.round(H * 0.46), screen.y + S.h + clearBelowScreen + tableH / 2);
    const t2 = tableY + (compact || W < 760 ? 220 : 250);
    const cx = W * (W < 760 && !compact ? 0.38 : 0.46);
    const seatOff = tableW / 2 - 50;
    tables = [{cx, cy: tableY, w: tableW, h: tableH}, {cx, cy: t2, w: tableW, h: tableH}];
    slots0 = {
      left1: {x: cx - seatOff, y: tableY + 64, deg: 0, kind: 'table', table: 0, outer: true},
      left2: {x: cx + seatOff, y: tableY + 64, deg: 0, kind: 'table', table: 0},
      right1: {x: cx - seatOff, y: t2 + 64, deg: 0, kind: 'table', table: 1, outer: true},
      right2: {x: cx + seatOff, y: t2 + 64, deg: 0, kind: 'table', table: 1},
    };
  }
  const chairY = tableY + 64;
  const slots = {front: {x: desk.cx, y: 52, deg: 180, kind: 'desk'}, ...slots0};
  // the lectern with the document camera: head of the centre aisle, facing the front
  // (always clear of the screen: below its bottom edge, and right of it when the room is narrow)
  // (compact: in the aisle beside the first table)
  // (a narrow room with its tables one behind the other: the lectern stands right of the first table)
  const narrow = stacked && !compact && W < 760;
  // (narrowSide: at the head of the aisle, below the screen's bottom edge and clear of the tables for the presenter)
  const lcx = compact || narrow ? W * 0.84 : narrowSide ? Math.max(W / 2 + 12, screen.x + S.w + 70) : Math.max(stacked ? W * 0.52 : W / 2, screen.x + S.w + 40);
  const lcy = compact || narrow ? tableY - 20 : narrowSide ? Math.max(screen.y + S.h + 38, Math.min(tableY - tableH / 2 - 124, screen.y + S.h + 60)) : Math.max(Math.round((platform.h + tableY - tableH / 2) / 2) - 18, screen.y + S.h + 70);
  const lectern = {cx: lcx, cy: lcy, w: 124, h: 64};
  lectern.plate = {x: lectern.cx - DOC.w / 2 - 14, y: lectern.cy - DOC.h / 2 + 2, w: DOC.w + 10, h: DOC.h - 4};
  lectern.plateC = {x: lectern.plate.x + lectern.plate.w / 2, y: lectern.plate.y + lectern.plate.h / 2};
  lectern.cam = {x: lectern.cx + 36, y: lectern.cy - 8};
  lectern.stand = {x: lectern.cx - 6, y: lectern.cy + lectern.h / 2 + 36, deg: 0};
  // aisles
  const mainDoor = {a: Math.round(W * 0.72), b: Math.round(W * 0.72) + 116};
  const plants = [{x: W - 44, y: H - 44}, {x: 44, y: H - 44}];
  const room = {x: 0, y: 0, w: W, h: H};
  const extents = {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t};
  // the enlarged copy on the screen: a page as tall as the display, with a title band above it
  const pageH = screen.inner.h - titleBand - 14;
  const pageW = pageH * (DOC.w / DOC.h);
  const shown = {x: screen.inner.x + screen.inner.w / 2, y: screen.inner.y + titleBand + 4 + pageH / 2, scale: pageH / DOC.h};
  const titleBox = {x: screen.inner.x + 10, y: screen.inner.y + 6, w: screen.inner.w - 20, h: titleBand - 10};
  return {W, H, t, stacked, slots, platform, desk, tables, tableY, chairY, lectern, screen, shown, titleBox, pageW, pageH, mainDoor, plants, room, extents, aisleX: W / 2};
}

/** Where the document lies on a presenter's table (in front of their chair). */
export function docOnTable(G, slot) {
  const s = G.slots[slot];
  return {x: s.x + 18, y: G.tables[s.table].cy - 4, deg: -8};
}

/** Furniture boxes (template units) — obstacles for labels. */
export function ppFurniture(G) {
  const out = [];
  out.push({kind: 'desk', x: G.desk.cx - G.desk.w / 2, y: G.desk.cy - G.desk.h / 2, w: G.desk.w, h: G.desk.h});
  for (const tb of G.tables) out.push({kind: 'table', x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h});
  const L = G.lectern;
  out.push({kind: 'lectern', x: L.cx - L.w / 2, y: L.cy - L.h / 2, w: L.w, h: L.h});
  out.push({kind: 'screen', x: G.screen.x, y: G.screen.y, w: G.screen.w, h: G.screen.h});
  for (const [name, s] of Object.entries(G.slots)) out.push({kind: 'chair', slot: name, x: s.x - 34, y: s.y - 34, w: 68, h: 68});
  for (const pl of G.plants) out.push({kind: 'plant', x: pl.x - 26, y: pl.y - 26, w: 52, h: 52});
  return out;
}

/**
 * The presenter's walk from their table seat to the lectern's standing spot.
 */
export function presenterRoute(G, slot) {
  const S = G.slots[slot];
  const st = G.lectern.stand;
  // out of the chair towards the OUTER end of their own table (the outer seat steps straight out sideways, the
  // inner one backs out behind the outer chair), along the side aisle to the front, then to the lectern
  // (tables one behind the other: each seat is at an end, so it steps straight out towards its own end)
  const tb = G.tables[S.table];
  const left = G.stacked ? S.x < tb.cx : S.table === 0;
  const xo = left ? (tb.cx - tb.w / 2) / 2 : (tb.cx + tb.w / 2 + G.W) / 2;
  const back = S.y + 92;
  const sideways = G.stacked || S.outer;
  const pts = sideways
    ? [{x: S.x, y: S.y}, {x: xo, y: S.y}, {x: xo, y: st.y}, {x: st.x, y: st.y}]
    : [{x: S.x, y: S.y}, {x: S.x, y: back}, {x: xo, y: back}, {x: xo, y: st.y}, {x: st.x, y: st.y}];
  const rc = roundCorners(pts, 44);
  return {pts: rc, poly: polyline(rc)};
}

/* ------------------------------------------------------------------ */
/* Art (template units)                                                */
/* ------------------------------------------------------------------ */

/**
 * Room shell and furniture: floor, platform, walls (main door in the bottom
 * wall), bench, tables, chairs of the given slots, plants. o.keep(box)
 * decides per piece (lens copies draw each piece whole or not at all).
 */
export function ppRoomArt(ctx, G, o) {
  const P = o.prefix;
  const {W, H, t} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const chairs = o.chairs || Object.keys(G.slots);
  const parts = [];
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 62}));
  parts.push(planPlatform(ctx, {name: `${P}-platform`, ...G.platform}));
  const gaps = [
    {side: 'bottom', a: G.mainDoor.a, b: G.mainDoor.b, kind: 'door'},
    {side: 'left', a: H * 0.52, b: H * 0.68, kind: 'window'},
    {side: 'right', a: H * 0.34, b: H * 0.5, kind: 'window'},
    {side: 'right', a: H * 0.62, b: H * 0.78, kind: 'window'},
  ];
  parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps}));
  const deskB = {x: G.desk.cx - G.desk.w / 2, y: G.desk.cy - G.desk.h / 2, w: G.desk.w, h: G.desk.h};
  if (keep(deskB)) parts.push(planTable(ctx, {name: `${P}-desk`, cx: G.desk.cx, cy: G.desk.cy, w: G.desk.w, h: G.desk.h, front: 'bottom', seedKey: 'desk'}));
  G.tables.forEach((tb, i) => { if (keep({x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h})) parts.push(planTable(ctx, {name: `${P}-table${i}`, ...tb, seedKey: `table${i}`})); });
  for (const name of chairs) {
    const s = G.slots[name];
    if (keep({x: s.x - 34, y: s.y - 34, w: 68, h: 68})) parts.push(planChair(ctx, {name: `${P}-chair-${name}`, cx: s.x, cy: s.y, deg: s.deg, s: 62}));
  }
  G.plants.forEach((pl, i) => { if (keep({x: pl.x - 26, y: pl.y - 26, w: 52, h: 52})) parts.push(planPlant(ctx, {name: `${P}-plant${i}`, cx: pl.x, cy: pl.y, s: 46, seedKey: `plant${i}`})); });
  const md = G.mainDoor;
  const door = planDoor(ctx, {name: `${P}-door-main`, hinge: {x: md.b, y: H + t / 2}, width: md.b - md.a, closedDeg: 180, openDeg: 90});
  parts.push(door.node);
  return {node: g({name: `${P}-room`}, parts), door};
}

/** Screen colours: idle (dark, a small stand-by glyph) and lit (a light display). */
export const SCREEN_IDLE = '#3b4550';
export const SCREEN_LIT = '#eef2f5';

/**
 * The shared screen, face-on, hanging on the front wall: bezel, display
 * (idle; `${name}-lit` lights it), a stand-by glyph
 * (`${name}-idle`) and the wall mount.
 */
export function screenArt(ctx, G, {name}) {
  const S = G.screen;
  const I = S.inner;
  return g({name},
    h('rect', {x: r(S.x + S.w * 0.3), y: -WALL_T / 2 - 2, width: r(S.w * 0.4), height: 14, rx: 3, fill: '#5b6570', stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(S.x + 8, S.y + 10, S.w, S.h, 16), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(S.x, S.y, S.w, S.h, 16), fill: '#262c33', stroke: INK, 'stroke-width': 3}),
    h('path', {d: roundRectPath(I.x, I.y, I.w, I.h, 6), fill: SCREEN_IDLE, stroke: '#11151a', 'stroke-width': 1.6}),
    h('path', {name: `${name}-lit`, d: roundRectPath(I.x, I.y, I.w, I.h, 6), fill: SCREEN_LIT, opacity: 0}),
    g({name: `${name}-idle`},
      h('circle', {cx: r(I.x + I.w / 2), cy: r(I.y + I.h / 2), r: 16, fill: 'none', stroke: '#8894a0', 'stroke-width': 3}),
      h('path', {d: `M${r(I.x + I.w / 2)} ${r(I.y + I.h / 2 - 22)}V${r(I.y + I.h / 2 - 6)}`, stroke: '#8894a0', 'stroke-width': 3, 'stroke-linecap': 'round'})),
    h('circle', {cx: r(S.x + S.w - 20), cy: r(S.y + S.h - 8), r: 3.5, fill: '#7f8a95'}),
  );
}

/**
 * The lectern with the document camera: a small table, the camera plate,
 * the arm and head over the plate, and a lamp (`${name}-lamp`) that lights
 * while the camera shows the sheet.
 */
export function lecternArt(ctx, G, {name}) {
  const L = G.lectern;
  const P = L.plate;
  const cam = L.cam;
  const head = {x: L.plate.x + L.plate.w / 2, y: L.plate.y - 4};
  return g({name},
    planTable(ctx, {cx: L.cx, cy: L.cy, w: L.w, h: L.h, seedKey: 'lectern'}),
    h('path', {d: roundRectPath(P.x, P.y, P.w, P.h, 4), fill: '#e4e8ec', stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: `M${r(cam.x)} ${r(cam.y + 16)}L${r(cam.x)} ${r(head.y)}L${r(head.x + 8)} ${r(head.y)}`, fill: 'none', stroke: '#4a525b', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(cam.x), cy: r(cam.y + 16), r: 9, fill: '#4a525b', stroke: INK, 'stroke-width': 1.6}),
    h('rect', {x: r(head.x - 12), y: r(head.y - 9), width: 24, height: 18, rx: 5, fill: '#30363d', stroke: INK, 'stroke-width': 1.6}),
    h('circle', {name: `${name}-lamp`, cx: r(head.x), cy: r(head.y), r: 5, fill: ctx.theme.accent2, opacity: 0}),
    h('circle', {cx: r(head.x), cy: r(head.y), r: 5, fill: 'none', stroke: '#9aa4ad', 'stroke-width': 1.4}),
  );
}

/**
 * A fictional sheet (template units, centred on its origin): paper, a heading
 * block and text lines. Pure lines and blocks — no real content.
 */
export function sheetArt(ctx, {name, w = DOC.w, h: hh = DOC.h, stroke = 1.6}) {
  const lines = [];
  const x0 = -w / 2 + w * 0.14, x1 = w / 2 - w * 0.14;
  for (let i = 0; i < 6; i++) {
    const y = -hh / 2 + hh * (0.34 + i * 0.1);
    const x2 = i === 5 ? x0 + (x1 - x0) * 0.55 : x1;
    lines.push(`M${r(x0, 2)} ${r(y, 2)}H${r(x2, 2)}`);
  }
  return g({name},
    h('rect', {x: r(-w / 2 + 3, 2), y: r(-hh / 2 + 4, 2), width: r(w, 2), height: r(hh, 2), rx: 2, fill: ctx.theme.shadow}),
    h('rect', {name: name ? `${name}-paper` : undefined, x: r(-w / 2, 2), y: r(-hh / 2, 2), width: r(w, 2), height: r(hh, 2), rx: 2, fill: '#fffdf7', stroke: INK, 'stroke-width': stroke}),
    h('rect', {x: r(x0, 2), y: r(-hh / 2 + hh * 0.1, 2), width: r((x1 - x0) * 0.62, 2), height: r(hh * 0.12, 2), rx: 1.5, fill: '#7f93a8'}),
    h('path', {d: lines.join(''), stroke: '#9aa3ad', 'stroke-width': r(Math.max(1.4, hh * 0.035), 2), 'stroke-linecap': 'round'}),
  );
}

/**
 * The projection wedge from the camera plate to the enlarged copy: a solid,
 * translucent quadrilateral (`${name}`), its path set per frame.
 */
export function beamArt(ctx, {name}) {
  return h('path', {name, d: 'M0 0Z', fill: ctx.theme.accent2, 'fill-opacity': 0.2, stroke: ctx.theme.accent2, 'stroke-opacity': 0.55, 'stroke-width': 1.5, opacity: 0});
}

/** Beam path between the plate (a DOC-sized box at `a`) and the copy's box at `b` (both centres + scale). */
export function beamPath(a, b) {
  const box = q => ({x0: q.x - (DOC.w * q.scale) / 2, x1: q.x + (DOC.w * q.scale) / 2, y0: q.y - (DOC.h * q.scale) / 2, y1: q.y + (DOC.h * q.scale) / 2});
  const A = box(a), B = box(b);
  // the outline of the two boxes' union hull (they lie diagonally from each other)
  const pts = [[A.x0, A.y0], [A.x1, A.y0], [A.x1, A.y1], [A.x0, A.y1], [B.x0, B.y0], [B.x1, B.y0], [B.x1, B.y1], [B.x0, B.y1]];
  const hull = convexHull(pts);
  return `M${hull.map(q => `${r(q[0])} ${r(q[1])}`).join('L')}Z`;
}

function convexHull(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of P) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of P.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/**
 * Position of the enlarged copy at progress q ∈ [0, 1] (template units):
 * from the camera plate (scale 1) to the screen (G.shown), along a gentle arc,
 * growing with an ease so it reads as the same sheet getting larger.
 */
export function copyAt(G, q) {
  const a = G.lectern.plateC, b = G.shown;
  const s = ease.inOutCubic(clamp(q));
  const mid = {x: (a.x + b.x) / 2 + 40, y: (a.y + b.y) / 2 + 30};
  const u = 1 - s;
  return {
    x: u * u * a.x + 2 * u * s * mid.x + s * s * b.x,
    y: u * u * a.y + 2 * u * s * mid.y + s * s * b.y,
    scale: lerp(1, b.scale, ease.inOutSine(clamp(q))),
    deg: 0,
  };
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

/**
 * Pose record for a plan person whose hands hold a point (local person
 * coordinates, forward = −y): both hands meet the sheet's sides. `hold`
 * blends from the rig's own hands (0) to the held point (1).
 */
export function holdPose(pp, name, s, local, hold) {
  const nodes = pp.pose(s);
  if (hold <= 0) return nodes;
  for (const [key, side] of [['armL', -1], ['armR', 1]]) {
    const hn = nodes[`${name}-${key}-h`];
    const tx = local.x + side * (DOC.w / 2 - 2), ty = local.y + 6;
    const hx = lerp(hn.cx, tx, hold), hy = lerp(hn.cy, ty, hold);
    const sx = side * 34, sy = -2;
    const line = {x1: r(sx), y1: r(sy), x2: r(hx), y2: r(hy)};
    nodes[`${name}-${key}-o`] = line;
    nodes[`${name}-${key}-i`] = line;
    nodes[`${name}-${key}-h`] = {cx: r(hx), cy: r(hy)};
  }
  return nodes;
}

/** Head turn (degrees, clamped to ±70°) of a plan person named `name`. */
export function headTurn(name, deg) {
  const d = Math.max(-70, Math.min(70, deg));
  return {[`${name}-head`]: {transform: `rotate(${r(d, 2)} 0 -1)`}};
}

/** Signed head angle that turns a person (at s, facing s.deg) towards a point. */
export function lookAngle(s, target) {
  const a = (Math.atan2(target.y - s.y, target.x - s.x) * 180) / Math.PI + 90;
  return ((((a - s.deg) % 360) + 540) % 360) - 180;
}

export {planPerson, planColors, actorLook};

/* ------------------------------------------------------------------ */
/* Legend glyphs (design units, origin at the glyph centre)            */
/* ------------------------------------------------------------------ */

export function ppGlyph(ctx, kind, s, look) {
  if (kind === 'presenter' || kind === 'person') {
    const pp = planPerson(ctx, {name: 'lg-person', look});
    const nodes = kind === 'presenter' ? holdPose(pp, 'lg-person', {x: 0, y: 6, deg: 0, scale: s / 118}, {x: 0, y: -64}, 1) : pp.pose({x: 0, y: 0, deg: 0, scale: s / 100});
    const sheet = kind === 'presenter' ? g({transform: T(0, 6 - (64 * s) / 118, 0, s / 118)}, applyStatic(sheetArt(ctx, {name: 'lg-sheet'}), {})) : null;
    return g(null, applyStatic(pp.node, nodes), sheet);
  }
  if (kind === 'screen') {
    const w = s * 1.05, hh = s * 0.7;
    return g(null,
      h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 5), fill: '#262c33', stroke: INK, 'stroke-width': 2}),
      h('path', {d: roundRectPath(-w / 2 + 5, -hh / 2 + 5, w - 10, hh - 10, 2), fill: SCREEN_LIT}),
      g({transform: T(0, 1, 0, (hh - 14) / DOC.h)}, applyStatic(sheetArt(ctx, {name: 'lg-s'}), {})));
  }
  if (kind === 'camera') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.5, -s * 0.28, s, s * 0.56, 6), fill: planColors(ctx).wood, stroke: INK, 'stroke-width': 2}),
      h('rect', {x: r(-s * 0.3), y: r(-s * 0.2), width: r(s * 0.32), height: r(s * 0.4), rx: 2, fill: '#e4e8ec', stroke: INK, 'stroke-width': 1.4}),
      h('circle', {cx: r(s * 0.22), cy: 0, r: r(s * 0.1), fill: '#30363d', stroke: INK, 'stroke-width': 1.4}),
      h('circle', {cx: r(s * 0.22), cy: 0, r: r(s * 0.045), fill: ctx.theme.accent2}));
  }
  if (kind === 'beam') {
    return h('path', {d: `M${r(-s * 0.45)} ${r(s * 0.18)}L${r(s * 0.45)} ${r(-s * 0.3)}L${r(s * 0.45)} ${r(s * 0.02)}L${r(-s * 0.3)} ${r(s * 0.3)}Z`, fill: ctx.theme.accent2, 'fill-opacity': 0.2, stroke: ctx.theme.accent2, 'stroke-opacity': 0.5, 'stroke-width': 1.5});
  }
  if (kind === 'sheet') return g({transform: T(0, 0, 0, s / DOC.h * 0.9)}, applyStatic(sheetArt(ctx, {name: 'lg-sh'}), {}));
  return null;
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

export function textAt(fit, x, y, fill, {italic = false, anchor = 'start', name, weight} = {}) {
  const ax = anchor === 'middle' ? x : x;
  return h('text', {name, x: r(ax), y: r(y + fit.size * 0.8), 'font-family': FONT, 'font-size': r(fit.size, 2), 'font-weight': weight ?? fit.weight, 'font-style': italic ? 'italic' : undefined, 'text-anchor': anchor === 'middle' ? 'middle' : undefined, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(ax), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

/** Plan frame: template → design units (no rotation). */
export function planFrame(E, box, k) {
  const ox = box.x + (box.w - E.w * k) / 2 - E.x * k;
  const oy = box.y + (box.h - E.h * k) / 2 - E.y * k;
  const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
  const mapBox = b => ({x: ox + b.x * k, y: oy + b.y * k, w: b.w * k, h: b.h * k});
  return {ox, oy, k, toD, mapBox, transform: T(ox, oy, 0, k), rect: mapBox(E)};
}

/** Douglas–Peucker simplification (template units) for the label search. */
export function thin(pts, tol = 5) {
  if (pts.length < 3) return pts.slice();
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const A = pts[a], B = pts[b];
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    let m = -1, md = tol;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i].x - A.x) * dy - (pts[i].y - A.y) * dx) / L; if (d > md) { md = d; m = i; } }
    if (m > 0) { keep[m] = true; stack.push([a, m], [m, b]); }
  }
  return pts.filter((q, i) => keep[i]);
}

export {shade};

/* ------------------------------------------------------------------ */
/* The presenter's carry (shared by the contrast and inspect entries)  */
/* ------------------------------------------------------------------ */

export const toLocal = (s, q) => {
  const a = (-(s.deg || 0) * Math.PI) / 180;
  const dx = q.x - s.x, dy = q.y - s.y;
  return {x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a)};
};
export const fromLocal = (s, q) => {
  const a = ((s.deg || 0) * Math.PI) / 180;
  return {x: s.x + q.x * Math.cos(a) - q.y * Math.sin(a), y: s.y + q.x * Math.sin(a) + q.y * Math.cos(a)};
};
const lerpDeg = (a, b, t) => { const d = ((((b - a) % 360) + 540) % 360) - 180; return a + d * t; };

/** Walk along a route polyline: turn in place at both ends, heading along the path, a steady cadence. */
export function walkState(route, q) {
  const poly = route.poly;
  const turnIn = 0.1, turnOut = 0.1;
  const qw = clamp((q - turnIn) / (1 - turnIn - turnOut));
  const s = ease.inOutSine(qw);
  const p = poly.at(s);
  const head = (poly.at(Math.min(0.999, Math.max(0.001, s))).a * 180) / Math.PI + 90;
  const first = (poly.at(0.001).a * 180) / Math.PI + 90, last = (poly.at(0.999).a * 180) / Math.PI + 90;
  let deg = head;
  if (q < turnIn) deg = lerpDeg(0, first, ease.inOutSine(q / turnIn));
  else if (q > 1 - turnOut) deg = lerpDeg(last, 0, ease.inOutSine((q - (1 - turnOut)) / turnOut));
  const moving = qw > 0 && qw < 1;
  return {x: p.x, y: p.y, deg, phase: ((s * poly.total) / 36) * Math.PI, walk: moving ? Math.min(1, qw / 0.06, (1 - qw) / 0.06) : 0};
}

/**
 * The presenter at local progress of three windows (pick, walk, place, each 0..1): stands up with the sheet from
 * their table, carries it in both hands, lays it on the camera plate. Returns the pose, the held point (local),
 * the hold amount, who holds the sheet ('table' | 'hands' | 'plate') and the sheet's plan position.
 */
export function carryAt(G, slot, route, qPick, qWalk, qPlace) {
  const S = G.slots[slot];
  const table = docOnTable(G, slot);
  const stand = G.lectern.stand;
  let pres, local, hold, holder;
  if (qWalk <= 0) {
    pres = {x: S.x, y: S.y, deg: 0, phase: 0, walk: 0, seated: 1 - ease.inOutCubic(clamp((qPick - 0.45) / 0.55))};
    const loc = toLocal(pres, table);
    const lift = ease.inOutCubic(clamp((qPick - 0.45) / 0.55));
    local = {x: lerp(loc.x, 0, lift), y: lerp(loc.y, -60, lift)};
    hold = ease.inOutSine(clamp(qPick / 0.45));
    holder = qPick >= 0.45 ? 'hands' : 'table';
  } else if (qPlace <= 0) {
    pres = {...walkState(route, qWalk), seated: 0};
    local = {x: 0, y: -60};
    hold = 1;
    holder = 'hands';
  } else {
    pres = {x: stand.x, y: stand.y, deg: 0, phase: 0, walk: 0, seated: 0};
    const plateLoc = toLocal(pres, G.lectern.plateC);
    const lay = ease.inOutCubic(clamp(qPlace / 0.7));
    local = {x: lerp(0, plateLoc.x, lay), y: lerp(-60, plateLoc.y, lay)};
    hold = 1 - ease.inOutSine(clamp((qPlace - 0.7) / 0.3));
    holder = qPlace >= 0.7 ? 'plate' : 'hands';
  }
  const doc = holder === 'table' ? {x: table.x, y: table.y, deg: table.deg} : holder === 'plate' ? {x: G.lectern.plateC.x, y: G.lectern.plateC.y, deg: 0} : {...fromLocal(pres, local), deg: pres.deg};
  return {pres, local, hold, holder, doc};
}
