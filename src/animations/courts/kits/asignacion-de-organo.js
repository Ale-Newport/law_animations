/**
 * "Asignación de órgano" kit (LAW-0209..0212): a case file is sent to one of
 * several GENERIC, fictional venues (sedes) according to SUPPLIED data.
 *
 * The scene is a site plan ("plano") seen from above: an intake office where a
 * clerk holds the case file, a main road to a sorting point (a plaza where the
 * road meets an avenue), and spurs from the avenue to the doors of two or three
 * venues. Each venue is a small building with a receiving desk (with an
 * in-tray) and a second room (sala). A dashed waiting slot sits on the plaza.
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md): the buildings, their names and
 * every datum are fictional placeholders supplied by the author. The route the
 * file takes follows ONLY the supplied mapping (`routes`: datum → venue): the
 * file goes to the venue of the first row whose datum equals the file's datum;
 * when no row matches, the venue stays pending and the file waits in the dashed
 * slot. Nothing here states or implies a real jurisdiction, competence or venue
 * rule, a time limit, the validity of a filing or any outcome.
 *
 * The kit owns fields, defaults, strings, the site geometry (template units, in
 * a "flow" frame: +x from the intake towards the venues, y across), the art,
 * the clerk walker and carry pose, the file prop and small text helpers. Each
 * entry owns its own timeline, composition and semantics. Generic art comes
 * from ./courts-art.js; text fitting and placers from ./distribucion-de-sala.js
 * (both read-only).
 * @module animations/courts/kits/asignacion-de-organo
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {
  planColors, planSheet, floorArea, wallRing, planDoor, planTable, planChair, planPlant, planLectern, planPerson, PERSON,
} from './courts-art.js';
import {glue, fitWords, overlaps, roundCorners, pxPerUnit, R2} from './distribucion-de-sala.js';

export {glue, fitWords, overlaps, pxPerUnit, R2};

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

export const VMAX = 3;

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Fields shared by the four entries (brief: courts, routes, seats, labels) plus the file. */
export const organoFields = {
  courts: obj('Generic, fictional buildings: the intake office where the file starts and the venues (sedes) it can be sent to. No real court, building shape, emblem or jurisdiction', {
    origin: str('Name of the intake office (fictional)', 60),
    venues: list('The venues, generic fictional buildings with editable names, drawn in this order', obj('Venue', {
      name: str('Editable venue name (fictional)', 60),
    }, ['name']), 2, VMAX),
  }, ['origin', 'venues']),
  routes: list('The SUPPLIED mapping: each row sends one datum value to one venue. The file follows the first row whose datum equals the file datum; when no row matches, the venue stays pending. Nothing else decides the route; a row naming a missing venue is ignored', obj('Mapping row', {
    datum: str('Datum value exactly as supplied (e.g. "district = East (fictional)")', 60),
    venue: int('Index of the venue in courts.venues', 0, VMAX - 1),
  }, ['datum', 'venue']), 1, 4),
  seats: obj('Places where the file can be set down (as supplied)', {
    arrival: str('Caption of the in-tray on the desk of each venue', 60),
    waiting: str('Caption of the dashed waiting slot at the sorting point', 60),
  }, ['arrival', 'waiting']),
  labels: obj('Editable built-in captions', {
    junction: str('Caption of the sorting point (the junction)', 50),
    datum: str('Prefix of the file datum', 30),
    key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 110),
  }, ['junction', 'datum', 'key']),
  file: obj('The case file (fictional) and the datum written on its tag', {
    label: str('Name of the file (fictional)', 50),
    datum: str('The supplied datum on its tag; matched against the mapping rows', 60),
  }, ['label', 'datum']),
  clerk: obj('Optional appearance of the clerk who carries the file', {appearance}),
};

export const ORG_EN = {
  courts: {origin: 'Intake office (fictional)', venues: [{name: 'Venue North (fictional)'}, {name: 'Venue East (fictional)'}, {name: 'Venue South (fictional)'}]},
  routes: [
    {datum: 'district = North (fictional)', venue: 0},
    {datum: 'district = East (fictional)', venue: 1},
    {datum: 'district = South (fictional)', venue: 2},
  ],
  seats: {arrival: 'In-tray on the venue desk', waiting: 'Waiting slot at the sorting point'},
  labels: {junction: 'Sorting point', datum: 'Supplied datum', key: 'Data and mapping as supplied · no conclusion drawn'},
  file: {label: 'Case file 24-017 (fictional)', datum: 'district = East (fictional)'},
  clerk: {},
};

export const ORG_ES = {
  courts: {origin: 'Oficina de registro (ficticia)', venues: [{name: 'Sede Norte (ficticia)'}, {name: 'Sede Este (ficticia)'}, {name: 'Sede Sur (ficticia)'}]},
  routes: [
    {datum: 'distrito = Norte (ficticio)', venue: 0},
    {datum: 'distrito = Este (ficticio)', venue: 1},
    {datum: 'distrito = Sur (ficticio)', venue: 2},
  ],
  seats: {arrival: 'Bandeja de entrada de la sede', waiting: 'Hueco de espera del punto de reparto'},
  labels: {junction: 'Punto de reparto', datum: 'Dato aportado', key: 'Datos y correspondencias según lo aportado · sin conclusión'},
  file: {label: 'Expediente 24-017 (ficticio)', datum: 'distrito = Este (ficticio)'},
  clerk: {},
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const ORG_LONG = {
  courts: {
    origin: 'Central intake and registry office, ground floor (fictional)',
    venues: [
      {name: 'Venue North, civic building on the upper avenue (fictional)'},
      {name: 'Venue East, annex beside the river market square (fictional)'},
      {name: 'Venue South, former library by the ring road (fictional)'},
    ],
  },
  routes: [
    {datum: 'district = North, including the old quarter (fictional)', venue: 0},
    {datum: 'district = East, both banks of the river (fictional)', venue: 1},
    {datum: 'district = South, beyond the ring road (fictional)', venue: 2},
    {datum: 'district = Harbour side, piers one to four (fictional)', venue: 0},
  ],
  seats: {arrival: 'In-tray on the receiving desk of each venue (as supplied)', waiting: 'Dashed waiting slot at the sorting point (as supplied)'},
  labels: {junction: 'Sorting point where the road meets the avenue', datum: 'Supplied datum on the tag', key: 'Every datum, name and mapping row is shown exactly as supplied by the author · no conclusion drawn'},
  file: {label: 'Case file 24-017, second volume (fictional)', datum: 'district = East, both banks of the river (fictional)'},
  clerk: {},
};

export const ORG_STRINGS = {
  en: {selected: 'File set down at the venue named by the supplied mapping', pending: 'No supplied row matches · the file waits at the sorting point', held: 'File held at the sorting point (as supplied)', was: 'was', pendingTag: 'no matching row'},
  es: {selected: 'Expediente depositado en la sede que indica la correspondencia aportada', pending: 'Ninguna fila aportada coincide · el expediente espera en el punto de reparto', held: 'Expediente retenido en el punto de reparto (según lo aportado)', was: 'antes', pendingTag: 'ninguna fila coincide'},
};

/* ------------------------------------------------------------------ */
/* Resolution (the supplied mapping, nothing else)                     */
/* ------------------------------------------------------------------ */

/** Normalized datum for matching: case, spacing and Unicode form only. */
export const normDatum = s => String(s ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Venues with their mapping tags, valid rows and the venue selected by the
 * supplied mapping for a datum (-1 = pending: no row matches).
 * @param {any} p params
 * @param {{datum?:string, rows?:Array<{datum:string,venue:number}>}} [o]
 */
export function resolveOrgano(p, o = {}) {
  const venues = p.courts.venues.map((v, i) => ({name: v.name, index: i, tags: []}));
  const rows = (o.rows ?? p.routes).map((rw, i) => ({datum: rw.datum, venue: rw.venue, index: i})).filter(rw => rw.venue < venues.length);
  for (const rw of rows) venues[rw.venue].tags.push(rw);
  const d = normDatum(o.datum ?? p.file.datum);
  const hit = d ? rows.find(rw => normDatum(rw.datum) === d) : null;
  return {venues, rows, selected: hit ? hit.venue : -1, matchRow: hit ? hit.index : -1};
}

/* ------------------------------------------------------------------ */
/* Site geometry (template units, flow frame)                          */
/* ------------------------------------------------------------------ */

export const WALL = 18;
export const DOOR_HALF = 58;
/** Plan person half-width (template units at scale 1). */
export const PRAD = PERSON.half;
/** Forward offset of a carried file from the clerk's centre. */
export const CARRY = 60;

/** Size presets of the site (template units). */
export const SPECS = {
  full: {intakeW: 250, intakeH: 290, roadL: 170, roadW: 150, plazaW: 270, plazaH: 300, avW: 150, spurL: 140, spW: 132, venueW: 360, venueH: 226, gap: 44},
  medium: {intakeW: 220, intakeH: 262, roadL: 110, roadW: 146, plazaW: 262, plazaH: 296, avW: 148, spurL: 100, spW: 130, venueW: 316, venueH: 216, gap: 36},
  compact: {intakeW: 176, intakeH: 236, roadL: 64, roadW: 140, plazaW: 252, plazaH: 290, avW: 140, spurL: 56, spW: 124, venueW: 262, venueH: 200, gap: 26},
  mini: {intakeW: 150, intakeH: 204, roadL: 18, roadW: 132, plazaW: 228, plazaH: 272, avW: 130, spurL: 30, spW: 116, venueW: 230, venueH: 176, gap: 12},
  // courts "micro" spec (documented exception for tight paired layouts, e.g. LAW-0211): people are drawn at 1.2× the
  // plan scale (`ps`) so they stay >= 60 px at 1080p when two complete plans share one frame; doors (±66) and roads
  // are widened to match, and the intake desk is left out so the larger clerk never overlaps furniture
  micro: {intakeW: 140, intakeH: 204, roadL: 10, roadW: 146, plazaW: 226, plazaH: 272, avW: 146, spurL: 20, spW: 146, venueW: 222, venueH: 164, gap: 8, doorHalf: 66, ps: 1.2, noDesk: true, slotY: 64},
  tight: {intakeW: 160, intakeH: 220, roadL: 36, roadW: 136, plazaW: 240, plazaH: 280, avW: 136, spurL: 44, spW: 120, venueW: 250, venueH: 184, gap: 16},
};

/** Neutral floor tints of the venues (identity by position and tint; no meaning). */
export const VENUE_TINTS = ['#e6edf3', '#f2ead8', '#e4eee2'];

/**
 * Geometry of the site for n venues in the flow frame: intake (left), road,
 * plaza with the avenue on its far side (the junction J), spurs and venues.
 * @param {number} n number of venues (2..3)
 * @param {typeof SPECS.full} S
 */
export function siteGeometry(n, S0, extra = {}) {
  const ef = extra.flow || 0, es = extra.spread || 0;
  const S = {...S0, roadL: S0.roadL + ef * 0.55, spurL: S0.spurL + ef * 0.45, gap: S0.gap + (n > 1 ? es / (n - 1) : 0)};
  const t = WALL;
  const dh = S.doorHalf ?? DOOR_HALF;
  const intake = {x: 0, y: -S.intakeH / 2, w: S.intakeW, h: S.intakeH};
  const roadX0 = S.intakeW + t;
  const plaza = {x: roadX0 + S.roadL, y: -S.plazaH / 2, w: S.plazaW, h: S.plazaH};
  const xA = plaza.x + plaza.w - S.avW / 2;
  const J = {x: xA, y: 0};
  const pitch = S.venueH + S.gap + 2 * t;
  const cs = Array.from({length: n}, (_, i) => (i - (n - 1) / 2) * pitch);
  const xV = xA + S.avW / 2 + S.spurL + t;
  const venues = cs.map((c, i) => {
    const box = {x: xV, y: c - S.venueH / 2, w: S.venueW, h: S.venueH};
    const stand = {x: xV + 88, y: c};
    const tray = {x: stand.x + CARRY, y: c};
    const desk = {cx: tray.x + 16, cy: c, w: 56, h: Math.min(150, S.venueH - 60)};
    const partition = S.venueW >= 300 ? xV + desk.cx - xV + 50 : null;
    return {i, c, box, door: {x: xV - t / 2, y: c}, stand, tray, desk, partition, outer: {x: xV - t, y: c - S.venueH / 2 - t, w: S.venueW + 2 * t, h: S.venueH + 2 * t}};
  });
  const yTop = Math.min(-S.plazaH / 2, cs[0] - S.spW / 2), yBot = Math.max(S.plazaH / 2, cs[n - 1] + S.spW / 2);
  const avenue = {x: xA - S.avW / 2, y: yTop, w: S.avW, h: yBot - yTop};
  const road = {x: roadX0, y: -S.roadW / 2, w: S.roadL, h: S.roadW};
  const spurs = cs.map(c => ({x: xA + S.avW / 2, y: c - S.spW / 2, w: S.spurL + t, h: S.spW}));
  // the dashed waiting slot, on the plaza's near side (clear of the road and the avenue)
  const slot = {x: plaza.x + 66, y: S.slotY ?? S.plazaH / 2 - 56, w: 80, h: 66};
  const slotStand = {x: slot.x, y: slot.y - CARRY};
  // sorting lectern (decor) on the plaza's other near corner
  const lectern = {x: plaza.x + 56, y: -S.plazaH / 2 + 50};
  const start = {x: S.noDesk ? S.intakeW * 0.45 : Math.max(96, S.intakeW * 0.5), y: 0};
  const intakeDesk = {cx: Math.max(44, S.intakeW * 0.2), cy: 0, w: 56, h: Math.min(170, S.intakeH - 90)};
  const intakeDoor = {x: S.intakeW + t / 2, y: 0};
  const minY = Math.min(intake.y, avenue.y, venues[0].outer.y) - t;
  const maxY = Math.max(intake.y + intake.h, avenue.y + avenue.h, venues[n - 1].outer.y + venues[n - 1].outer.h) + t;
  const extents = {x: -t - 14, y: minY - 14, w: xV + S.venueW + 2 * t + 28, h: maxY - minY + 28};
  // legs (the clerk's walks)
  const leg1 = roundCorners(dedupe([start, {x: S.intakeW - 40, y: 0}, intakeDoor, {x: plaza.x, y: 0}, J]), 40);
  const leg2 = venues.map(v => roundCorners(dedupe([J, {x: xA, y: v.c}, v.door, v.stand]), 46));
  const legWait = roundCorners(dedupe([J, {x: (J.x + slotStand.x) / 2 + 20, y: slotStand.y}, slotStand]), 40);
  return {n, S, t, dh, intake, intakeDesk, intakeDoor, road, plaza, avenue, spurs, venues, J, slot, slotStand, lectern, start, extents, leg1, leg2, legWait, pitch};
}

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
    if (Math.abs(cross) > 1e-6) res.push(b);
  }
  if (out.length > 1) res.push(out[out.length - 1]);
  return res;
}

/* ------------------------------------------------------------------ */
/* Template → design mapping (flow right, or flow up = turned −90°)   */
/* ------------------------------------------------------------------ */

/**
 * The site stretched (longer road and spurs, or wider gaps between venues) so
 * its extents match the shape of `box` — the plan then fills its area instead
 * of leaving a band. rot = the plan is turned a quarter in the box.
 */
export function stretchedSite(n, S, box, rot, caps) {
  caps = caps || {flow: 760, spread: 380};
  const G0 = siteGeometry(n, S);
  const E = G0.extents;
  const R = rot ? box.h / box.w : box.w / box.h;
  let ef = 0, es = 0;
  if (E.w / E.h < R) ef = Math.min(caps.flow, R * E.h - E.w);
  else es = Math.min(caps.spread, E.w / R - E.h);
  return ef > 1 || es > 1 ? siteGeometry(n, S, {flow: ef, spread: es}) : G0;
}

/**
 * Fit the site extents E into `box` (design units). rot = true turns the plan
 * a quarter (the flow runs up the page; venues along the top).
 * @returns {{k:number, rot:boolean, ox:number, oy:number, toD:(q:any)=>{x:number,y:number}, box:(b:any)=>any, transform:string, rect:any}}
 */
export function mapper(E, box, rot, kMax = Infinity, align = {x: 0.5, y: 0.5}) {
  const ew = rot ? E.h : E.w, eh = rot ? E.w : E.h;
  const k = Math.min(box.w / ew, box.h / eh, kMax);
  const bx = box.x + (box.w - ew * k) * align.x, by = box.y + (box.h - eh * k) * align.y;
  return mapperAt(E, rot, k, bx, by);
}

/** Mapper with a given scale whose extents' top-left lands at (bx, by). */
export function mapperAt(E, rot, k, bx, by) {
  const ox = rot ? bx - E.y * k : bx - E.x * k;
  const oy = rot ? by + (E.x + E.w) * k : by - E.y * k;
  const toD = rot ? q => ({x: ox + q.y * k, y: oy - q.x * k}) : q => ({x: ox + q.x * k, y: oy + q.y * k});
  const mbox = b => {
    const a = toD({x: b.x, y: b.y}), c = toD({x: b.x + b.w, y: b.y + b.h});
    return {x: Math.min(a.x, c.x), y: Math.min(a.y, c.y), w: Math.abs(c.x - a.x), h: Math.abs(c.y - a.y)};
  };
  return {k, rot, ox, oy, toD, box: mbox, transform: T(ox, oy, rot ? -90 : 0, k), rect: mbox(E)};
}

/* ------------------------------------------------------------------ */
/* Art                                                                  */
/* ------------------------------------------------------------------ */

/** Kerb lines of the road network (edges not shared with the plaza or another road). */
function roadKerbs(G) {
  const d = [];
  const {road, avenue, plaza, spurs} = G;
  d.push(`M${r(road.x)} ${r(road.y)}H${r(plaza.x)}M${r(road.x)} ${r(road.y + road.h)}H${r(plaza.x)}`);
  // avenue sides, interrupted by the plaza and the spurs
  const left = avenue.x, right = avenue.x + avenue.w;
  const cuts = (list) => {
    const segs = [];
    let cur = avenue.y;
    for (const [a, b] of list.sort((p, q) => p[0] - q[0])) { if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b); }
    if (cur < avenue.y + avenue.h) segs.push([cur, avenue.y + avenue.h]);
    return segs;
  };
  for (const [a, b] of cuts([[plaza.y, plaza.y + plaza.h]])) d.push(`M${r(left)} ${r(a)}V${r(b)}`);
  for (const [a, b] of cuts(spurs.map(sp => [sp.y, sp.y + sp.h]))) d.push(`M${r(right)} ${r(a)}V${r(b)}`);
  d.push(`M${r(left)} ${r(avenue.y)}H${r(right)}M${r(left)} ${r(avenue.y + avenue.h)}H${r(right)}`);
  for (const sp of spurs) d.push(`M${r(sp.x)} ${r(sp.y)}H${r(sp.x + sp.w - G.t)}M${r(sp.x)} ${r(sp.y + sp.h)}H${r(sp.x + sp.w - G.t)}`);
  return d.join('');
}

/** Centre lines of the roads. */
function roadMids(G) {
  const {road, avenue, spurs, plaza} = G;
  const d = [`M${r(road.x + 10)} 0H${r(plaza.x - 6)}`, `M${r(avenue.x + avenue.w / 2)} ${r(avenue.y + 12)}V${r(plaza.y - 6)}M${r(avenue.x + avenue.w / 2)} ${r(plaza.y + plaza.h + 6)}V${r(avenue.y + avenue.h - 12)}`];
  for (const sp of spurs) d.push(`M${r(sp.x + 12)} ${r(sp.y + sp.h / 2)}H${r(sp.x + sp.w - G.t - 8)}`);
  return d.join('');
}

/**
 * The site plan: sheet, roads, plaza, intake office, venues (desk, in-tray,
 * second room), lectern, dashed waiting slot and doors.
 * @param {any} ctx
 * @param {any} G siteGeometry()
 * @param {{prefix:string, keep?:(b:any)=>boolean, sheet?:boolean}} o
 */
export function siteArt(ctx, G, o) {
  const P = o.prefix;
  const c = planColors(ctx);
  const th = ctx.theme;
  const {S, t} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const parts = [];
  if (o.sheet !== false) parts.push(planSheet(ctx, {name: `${P}-sheet`, x: G.extents.x, y: G.extents.y, w: G.extents.w, h: G.extents.h, cell: 48}));
  // roads: main road, avenue and spurs (paved, with kerbs and a faint centre line) and the plaza (stone tiles)
  const ROAD = '#e2dccf', KERB = '#a89c86', MID = '#c9bfab';
  const roads = [G.road, G.avenue, ...G.spurs];
  parts.push(g({name: `${P}-roads`},
    roads.map(b => h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), fill: ROAD})),
    h('path', {d: roadKerbs(G), fill: 'none', stroke: KERB, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    h('path', {d: roadMids(G), fill: 'none', stroke: MID, 'stroke-width': 3, 'stroke-dasharray': '16 14'})));
  parts.push(g({name: `${P}-plaza`},
    floorArea(ctx, {...G.plaza, kind: 'tiles', cell: 50, fill: c.stone, line: shade(c.stone, -0.08)}),
    h('path', {d: roundRectPath(G.plaza.x, G.plaza.y, G.plaza.w, G.plaza.h, 6), fill: 'none', stroke: KERB, 'stroke-width': 4})));
  // plaza furniture: the sorting lectern, planters, the dashed waiting slot
  if (keep({x: G.lectern.x - 30, y: G.lectern.y - 22, w: 60, h: 44})) parts.push(planLectern(ctx, {name: `${P}-lectern`, cx: G.lectern.x, cy: G.lectern.y, s: 56, deg: 135}));
  const plx = G.plaza.x + G.plaza.w - G.S.avW - 34;
  for (const [i, py] of [[0, G.plaza.y + 34], [1, G.plaza.y + G.plaza.h - 34]]) {
    if (plx > G.plaza.x + 120 && keep({x: plx - 24, y: py - 24, w: 48, h: 48})) parts.push(planPlant(ctx, {name: `${P}-pplant${i}`, cx: plx, cy: py, s: 42, seedKey: `pp${i}`}));
  }
  parts.push(h('path', {name: `${P}-slot`, d: roundRectPath(G.slot.x - G.slot.w / 2, G.slot.y - G.slot.h / 2, G.slot.w, G.slot.h, 10), fill: 'rgba(255,255,255,0.55)', stroke: c.frame, 'stroke-width': 3, 'stroke-dasharray': '9 7'}));
  // intake office
  const I = G.intake;
  parts.push(floorArea(ctx, {name: `${P}-intake-floor`, ...I, kind: 'tiles', cell: 54}));
  parts.push(wallRing(ctx, {name: `${P}-intake-walls`, ...I, t, gaps: [{side: 'right', a: -G.dh, b: G.dh, kind: 'door'}, {side: 'top', a: I.w * 0.25, b: I.w * 0.7, kind: 'window'}, {side: 'bottom', a: I.w * 0.25, b: I.w * 0.7, kind: 'window'}]}));
  if (!S.noDesk && keep({x: G.intakeDesk.cx - 28, y: -G.intakeDesk.h / 2, w: 56, h: G.intakeDesk.h})) parts.push(planTable(ctx, {name: `${P}-intake-desk`, cx: G.intakeDesk.cx, cy: G.intakeDesk.cy, w: G.intakeDesk.w, h: G.intakeDesk.h, seedKey: 'idesk'}));
  if (I.w >= 200 && keep({x: I.w - 60, y: I.y + 10, w: 50, h: 50})) parts.push(planPlant(ctx, {name: `${P}-intake-plant`, cx: I.w - 34, cy: I.y + 36, s: 40, seedKey: 'iplant'}));
  // venues
  const doors = {};
  G.venues.forEach((v, i) => {
    const B = v.box;
    const vp = [];
    vp.push(floorArea(ctx, {x: B.x, y: B.y, w: B.w, h: B.h, kind: 'tiles', cell: 50, fill: VENUE_TINTS[i % VENUE_TINTS.length], line: shade(VENUE_TINTS[i % VENUE_TINTS.length], -0.07)}));
    const gaps = [{side: 'left', a: v.c - G.dh, b: v.c + G.dh, kind: 'door'}, {side: 'top', a: B.x + B.w * 0.45, b: B.x + B.w * 0.8, kind: 'window'}, {side: 'bottom', a: B.x + B.w * 0.45, b: B.x + B.w * 0.8, kind: 'window'}];
    vp.push(wallRing(ctx, {...B, t, gaps}));
    if (v.partition) {
      // a second room (sala) behind a partition with an opening
      const px0 = v.partition;
      const gapA = B.y + B.h - 96, gapB = B.y + B.h - 18;
      vp.push(h('path', {d: `M${r(px0)} ${r(B.y)}H${r(px0 + 12)}V${r(gapA)}H${r(px0)}Z`, fill: c.wall, stroke: c.wallEdge, 'stroke-width': 1.5}));
      vp.push(h('path', {d: `M${r(px0)} ${r(gapB)}H${r(px0 + 12)}V${r(B.y + B.h)}H${r(px0)}Z`, fill: c.wall, stroke: c.wallEdge, 'stroke-width': 1.5}));
      const roomW = B.x + B.w - px0 - 12;
      if (roomW >= 70) {
        const tcx = px0 + 12 + roomW / 2;
        const tb = {cx: tcx, cy: B.y + B.h * 0.4, w: Math.min(46, roomW * 0.4), h: Math.min(110, B.h * 0.48)};
        if (keep({x: tb.cx - tb.w / 2, y: tb.cy - tb.h / 2, w: tb.w, h: tb.h})) vp.push(planTable(ctx, {cx: tb.cx, cy: tb.cy, w: tb.w, h: tb.h, seedKey: `sala${i}`}));
        if (roomW >= 128) {
          for (const [k2, sx] of [[0, -1], [1, 1]]) {
            const ch = {x: tcx + sx * (tb.w / 2 + 24), y: tb.cy};
            if (keep({x: ch.x - 22, y: ch.y - 22, w: 44, h: 44})) vp.push(planChair(ctx, {cx: ch.x, cy: ch.y, deg: sx < 0 ? 90 : 270, s: 40}));
            void k2;
          }
        }
      }
    }
    // receiving desk and its in-tray
    const D = v.desk;
    if (keep({x: D.cx - D.w / 2, y: D.cy - D.h / 2, w: D.w, h: D.h})) vp.push(planTable(ctx, {cx: D.cx, cy: D.cy, w: D.w, h: D.h, seedKey: `vdesk${i}`}));
    if (keep({x: v.tray.x - 32, y: v.tray.y - 40, w: 64, h: 80})) {
      vp.push(h('path', {name: `${P}-tray${i}`, d: roundRectPath(v.tray.x - 30, v.tray.y - 38, 60, 76, 6), fill: shade(c.wood, 0.1), stroke: '#1f2328', 'stroke-width': 2.2}));
      vp.push(h('path', {d: roundRectPath(v.tray.x - 24, v.tray.y - 32, 48, 64, 4), fill: 'none', stroke: c.woodEdge, 'stroke-width': 2}));
    }
    parts.push(g({name: `${P}-venue${i}`}, vp));
    doors[`v${i}`] = planDoor(ctx, {name: `${P}-vdoor${i}`, hinge: {x: B.x - t / 2, y: v.c - G.dh}, width: G.dh * 2, closedDeg: 90, openDeg: -80});
    parts.push(doors[`v${i}`].node);
  });
  doors.origin = planDoor(ctx, {name: `${P}-idoor`, hinge: {x: I.w + t / 2, y: -G.dh}, width: G.dh * 2, closedDeg: 90, openDeg: -80});
  parts.push(doors.origin.node);
  return {node: g({name: `${P}-site`}, parts), doors, colors: c, theme: th};
}

/* ------------------------------------------------------------------ */
/* Paired lanes (opt-in; LAW-0211): one shared venue row, lane A above   */
/* and lane B below, each with its own intake office, road, sorting      */
/* point and slot. Nothing here changes siteGeometry/siteArt.            */
/* ------------------------------------------------------------------ */

/** Lane sizes (template units); people use the courts "micro" person scale (ps 1.2). */
export const LANE_SPEC = {iw: 150, ih: 120, roadL: 30, roadW: 116, pw: 186, phOut: 66, phIn: 76, inner: true, vw: 236, vh: 184, gap: 22, spur: 0, dh: 58, ps: 1.2, pad: 10};

/**
 * Geometry of two mirrored lanes sharing one row of n venues (flow +x). Lane A
 * lies above the venue row (sign −1), lane B below (sign +1). Each venue has a
 * door and a desk with an in-tray for each lane (A's on the upper wall, left of
 * centre; B's on the lower wall, right of centre). `extra.flow` lengthens the
 * roads, `extra.spread` the spurs between the roads and the venues.
 */
export function laneGeometry(n, S0 = LANE_SPEC, extra = {}) {
  const S = {...S0, roadL: S0.roadL + (extra.flow || 0), spur: S0.spur + (extra.spread || 0)};
  const t = WALL, dh = S.dh;
  const px0 = S.iw + t + S.roadL;
  // (inner) the plazas with their slots and lecterns open towards the venue row, between the two roads: the venue
  // row starts after lane B's (shifted) plaza
  const x0V = px0 + S.pw + 40 + (S.inner ? 0.4 * S.vw : 0);
  const lastX = x0V + n * (S.vw + 2 * t + S.gap) - S.gap;
  const venues = Array.from({length: n}, (_, i) => {
    const box = {x: x0V + i * (S.vw + 2 * t + S.gap) + t, y: -S.vh / 2, w: S.vw, h: S.vh};
    const dx = {A: box.x + S.vw * 0.3, B: box.x + S.vw * 0.7};
    const lanes = {};
    for (const [key, sg] of [['A', -1], ['B', 1]]) {
      const wallY = sg * (S.vh / 2);
      const stand = {x: dx[key], y: wallY - sg * 62};
      const tray = {x: dx[key], y: stand.y - sg * CARRY};
      lanes[key] = {door: {x: dx[key], y: sg * (S.vh / 2 + t / 2)}, stand, tray, deg: sg < 0 ? 180 : 0, table: {cx: dx[key], cy: tray.y - sg * 8, w: 76, h: 52}};
    }
    return {i, c: box.x + S.vw / 2, box, outer: {x: box.x - t, y: box.y - t, w: box.w + 2 * t, h: box.h + 2 * t}, lanes};
  });
  const lanes = {};
  // lane B is lane A mirrored across the venue row AND shifted right by the distance between the two doors of a
  // venue (A's door sits left of centre, B's right of centre), so the two lanes are congruent: the same walk, the
  // same lengths, the same timing; both roads have the same length and end inside the venue row's span
  const shift = venues[0].lanes.B.door.x - venues[0].lanes.A.door.x;
  for (const [key, sg] of [['A', -1], ['B', 1]]) {
    const off = key === 'B' ? shift : 0;
    const yA = sg * (S.vh / 2 + t + S.spur + S.roadW / 2);
    const inner = yA - sg * S.roadW / 2, outer = yA + sg * S.roadW / 2;
    const intake = {x: off, y: yA - S.ih / 2, w: S.iw, h: S.ih};
    const road = {x: off + S.iw + t, y: yA - S.roadW / 2, w: lastX - shift - (S.iw + t), h: S.roadW};
    const pOuter = outer + sg * S.phOut, pInner = inner - sg * S.phIn;
    const plaza = S.inner ? {x: off + px0, y: Math.min(outer, pInner), w: S.pw, h: Math.abs(pInner - outer)} : {x: off + px0, y: Math.min(inner, pOuter), w: S.pw, h: Math.abs(pOuter - inner)};
    const J = {x: off + px0 + S.pw * 0.64, y: yA};
    const slot = S.inner ? {x: off + px0 + S.pw * 0.3, y: inner - sg * (S.phIn / 2 + 1), w: 100, h: 62} : {x: off + px0 + S.pw * 0.28, y: outer + sg * (S.phOut / 2 + 4), w: 80, h: 60};
    const slotStand = S.inner ? {x: slot.x, y: slot.y + sg * CARRY} : {x: slot.x, y: slot.y - sg * CARRY};
    const spurs = venues.map(v => { const d = v.lanes[key].door; return {x: d.x - dh - 12, y: Math.min(inner, sg * (S.vh / 2 + t)), w: 2 * dh + 24, h: Math.abs(inner - sg * (S.vh / 2 + t))}; });
    const start = {x: off + S.iw * 0.45, y: yA};
    const intakeDoor = {x: off + S.iw + t / 2, y: yA};
    const leg1 = dedupe([start, {x: off + S.iw - 30, y: yA}, intakeDoor, {x: off + px0, y: yA}, J]);
    const legTo = venues.map(v => roundCorners(dedupe([J, {x: v.lanes[key].door.x, y: yA}, v.lanes[key].door, v.lanes[key].stand]), 40));
    const legWait = dedupe([J, slotStand]);
    const lectern = S.inner ? {x: off + px0 + S.pw * 0.82, y: inner - sg * (S.phIn / 2)} : {x: off + px0 + S.pw * 0.82, y: outer + sg * (S.phOut / 2)};
    const slotDeg = S.inner ? (sg < 0 ? 180 : 0) : (sg < 0 ? 0 : 180);
    lanes[key] = {key, sign: sg, off, yA, intake, intakeDoor, road, plaza, J, slot, slotStand, slotDeg, spurs, start, leg1, legTo, legWait, lectern};
  }
  const ys = [];
  for (const L of Object.values(lanes)) ys.push(L.intake.y - t, L.intake.y + L.intake.h + t, L.plaza.y, L.plaza.y + L.plaza.h, L.road.y, L.road.y + L.road.h);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = S.pad ?? 14;
  const extents = {x: -t - pad, y: minY - pad, w: lastX + t + 2 * pad, h: maxY - minY + 2 * pad};
  return {n, S, t, dh, venues, lanes, extents};
}

/** Lane geometry stretched to the shape of `box` (longer roads, or longer spurs). */
export function stretchedLanes(n, box, caps = {flow: 1400, spread: 260}, S = LANE_SPEC) {
  const G0 = laneGeometry(n, S);
  const E = G0.extents;
  const R = box.w / box.h;
  if (E.w / E.h < R) return laneGeometry(n, S, {flow: Math.min(caps.flow, R * E.h - E.w)});
  return laneGeometry(n, S, {spread: Math.min(caps.spread, (E.w / R - E.h) / 2)});
}

/** Art of the paired lanes: sheet, roads, plazas, slots, intake offices, the shared venues, doors. */
export function laneArt(ctx, LG, o) {
  const P = o.prefix;
  const c = planColors(ctx);
  const {S, t, dh} = LG;
  const ROAD = '#e2dccf', KERB = '#a89c86';
  const sheet = planSheet(ctx, {name: `${P}-sheet`, x: LG.extents.x, y: LG.extents.y, w: LG.extents.w, h: LG.extents.h, cell: 48});
  const doors = {};
  const laneNodes = {};
  let parts;
  for (const L of Object.values(LG.lanes)) {
    const K = L.key;
    parts = [];
    parts.push(g({name: `${P}-${K}-roads`},
      [L.road, ...L.spurs].map(b => h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), fill: ROAD})),
      h('path', {d: `M${r(L.road.x)} ${r(L.road.y)}H${r(L.road.x + L.road.w)}M${r(L.road.x)} ${r(L.road.y + L.road.h)}H${r(L.road.x + L.road.w)}`, fill: 'none', stroke: KERB, 'stroke-width': 4}),
      h('path', {d: `M${r(L.road.x + 10)} ${r(L.yA)}H${r(L.road.x + L.road.w - 10)}`, stroke: '#c9bfab', 'stroke-width': 3, 'stroke-dasharray': '16 14'})));
    parts.push(g({name: `${P}-${K}-plaza`},
      floorArea(ctx, {...L.plaza, kind: 'tiles', cell: 48, fill: c.stone, line: shade(c.stone, -0.08)}),
      h('path', {d: roundRectPath(L.plaza.x, L.plaza.y, L.plaza.w, L.plaza.h, 6), fill: 'none', stroke: KERB, 'stroke-width': 4})));
    parts.push(planLectern(ctx, {name: `${P}-${K}-lectern`, cx: L.lectern.x, cy: L.lectern.y, s: 48, deg: (L.sign < 0) !== Boolean(S.inner) ? 0 : 180}));
    parts.push(h('path', {name: `${P}-${K}-slot`, d: roundRectPath(L.slot.x - L.slot.w / 2, L.slot.y - L.slot.h / 2, L.slot.w, L.slot.h, 10), fill: 'rgba(255,255,255,0.55)', stroke: c.frame, 'stroke-width': 3, 'stroke-dasharray': '9 7'}));
    const I = L.intake;
    parts.push(floorArea(ctx, {name: `${P}-${K}-intake-floor`, ...I, kind: 'tiles', cell: 50}));
    parts.push(wallRing(ctx, {name: `${P}-${K}-intake-walls`, ...I, t, gaps: [{side: 'right', a: L.yA - dh, b: L.yA + dh, kind: 'door'}, {side: L.sign < 0 ? 'top' : 'bottom', a: I.x + I.w * 0.25, b: I.x + I.w * 0.7, kind: 'window'}]}));
    // the intake doors are mirror images too (hinge on the side away from the venue row)
    doors[`${K}-origin`] = planDoor(ctx, {name: `${P}-${K}-idoor`, hinge: {x: I.x + I.w + t / 2, y: L.yA + L.sign * dh}, width: dh * 2, closedDeg: -L.sign * 90, openDeg: L.sign * 80});
    parts.push(doors[`${K}-origin`].node);
    laneNodes[K] = g({name: `${P}-${K}-lane`}, parts);
  }
  parts = [];
  LG.venues.forEach((v, i) => {
    const B = v.box;
    const tint = VENUE_TINTS[i % VENUE_TINTS.length];
    const vp = [floorArea(ctx, {x: B.x, y: B.y, w: B.w, h: B.h, kind: 'tiles', cell: 50, fill: tint, line: shade(tint, -0.07)})];
    vp.push(wallRing(ctx, {...B, t, gaps: [
      {side: 'top', a: v.lanes.A.door.x - dh, b: v.lanes.A.door.x + dh, kind: 'door'},
      {side: 'bottom', a: v.lanes.B.door.x - dh, b: v.lanes.B.door.x + dh, kind: 'door'},
      {side: 'left', a: B.y + B.h * 0.3, b: B.y + B.h * 0.7, kind: 'window'},
      {side: 'right', a: B.y + B.h * 0.3, b: B.y + B.h * 0.7, kind: 'window'}]}));
    for (const K of ['A', 'B']) {
      const Lv = v.lanes[K];
      vp.push(planTable(ctx, {cx: Lv.table.cx, cy: Lv.table.cy, w: Lv.table.w, h: Lv.table.h, seedKey: `lt${i}${K}`}));
      vp.push(h('path', {name: `${P}-tray${i}${K}`, d: roundRectPath(Lv.tray.x - 36, Lv.tray.y - 28, 72, 56, 6), fill: shade(c.wood, 0.1), stroke: '#1f2328', 'stroke-width': 2.2}));
    }
    parts.push(g({name: `${P}-venue${i}`}, vp));
    doors[`A-v${i}`] = planDoor(ctx, {name: `${P}-A-vdoor${i}`, hinge: {x: v.lanes.A.door.x - dh, y: -S.vh / 2 - t / 2}, width: dh * 2, closedDeg: 0, openDeg: 80});
    doors[`B-v${i}`] = planDoor(ctx, {name: `${P}-B-vdoor${i}`, hinge: {x: v.lanes.B.door.x - dh, y: S.vh / 2 + t / 2}, width: dh * 2, closedDeg: 0, openDeg: -80});
    parts.push(doors[`A-v${i}`].node, doors[`B-v${i}`].node);
  });
  return {sheet, lanes: laneNodes, venues: g({name: `${P}-venues`}, parts), doors};
}

/** Opening 0..1 of a door gate for a moving walker at `pos` (template units). */
export function doorOpenness(gate, pos, moving) {
  if (!moving || !pos) return 0;
  const d = Math.hypot(pos.x - gate.x, pos.y - gate.y);
  return ease.inOutSine(clamp(1 - (d - 60) / 120));
}

/* ------------------------------------------------------------------ */
/* The case file (top-down prop)                                       */
/* ------------------------------------------------------------------ */

/** Size of the file prop (template units, local forward = −y). */
export const FILE = {w: 64, h: 48};

/**
 * Top-down case file: a manila folder with paper edges, a front tab and a tag
 * (the supplied datum travels on this tag). Local centre (0, 0).
 */
export function fileProp(ctx, {name}) {
  const th = ctx.theme;
  const w = FILE.w, hh = FILE.h;
  const x = -w / 2, y = -hh / 2;
  return g({name},
    h('path', {d: roundRectPath(x + 3, y + 5, w, hh, 5), fill: th.shadow}),
    h('path', {d: roundRectPath(x - 2, y - 2, w, hh, 4), fill: '#f7f3ea', stroke: '#1f2328', 'stroke-width': 1.4}),
    h('path', {d: roundRectPath(x, y, w, hh, 4), fill: '#e2c48c', stroke: '#1f2328', 'stroke-width': 2}),
    h('path', {d: `M${r(x + 6)} ${r(y)}v-7h20v7`, fill: '#e2c48c', stroke: '#1f2328', 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x + 10)} ${r(y + 16)}h28M${r(x + 10)} ${r(y + 24)}h22`, stroke: '#a8874f', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
    // the tag (datum) tied to the right edge
    h('path', {d: `M${r(x + w - 4)} ${r(y + 10)}l10 -6`, stroke: '#1f2328', 'stroke-width': 1.6}),
    h('path', {d: `M${r(x + w + 4)} ${r(y - 2)}h18l6 8l-6 8h-18z`, fill: th.accent3, stroke: '#1f2328', 'stroke-width': 1.8, 'stroke-linejoin': 'round', transform: `rotate(-24 ${r(x + w + 4)} ${r(y + 6)})`}),
  );
}

/** Tag glyph (design units, centre at the origin) — the same tag as on the file. */
export function tagGlyph(ctx, s = 22, fill) {
  const th = ctx.theme;
  const w = s * 1.2, hh = s * 0.8;
  return g(null,
    h('path', {d: `M${r(-w / 2)} ${r(-hh / 2)}H${r(w / 2 - hh * 0.35)}L${r(w / 2)} 0L${r(w / 2 - hh * 0.35)} ${r(hh / 2)}H${r(-w / 2)}Z`, fill: fill ?? th.accent3, stroke: '#1f2328', 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(w / 2 - hh * 0.55), cy: 0, r: r(hh * 0.13), fill: '#fff', stroke: '#1f2328', 'stroke-width': 1.2}));
}

/* ------------------------------------------------------------------ */
/* The clerk: walker along a leg and the carry pose                    */
/* ------------------------------------------------------------------ */

const angDiff = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
const norm360 = a => ((a % 360) + 360) % 360;
const STRIDE = 36;

/** A leg: polyline + start/end facing (template degrees, 0 = up the page). */
export function makeLeg(pts, startDeg, endDeg) {
  const poly = polyline(pts);
  const h0 = (poly.at(0).a * 180) / Math.PI + 90;
  return {pts, poly, startDeg: startDeg ?? h0, endDeg: endDeg ?? (poly.at(1).a * 180) / Math.PI + 90};
}

/**
 * Walker state at leg progress q ∈ [0, 1]: turn from the start facing, walk
 * (feet and arms alternate), turn to the end facing.
 */
export function walkAt(leg, q, reduced = false) {
  const qq = clamp(q);
  const s = ease.inOutSine(qq);
  const p = leg.poly.at(s);
  const head = (leg.poly.at(Math.min(1, s + 0.004)).a * 180) / Math.PI + 90;
  let deg = head;
  if (qq < 0.1) deg = leg.startDeg + angDiff(leg.startDeg, head) * ease.inOutSine(qq / 0.1);
  if (qq > 0.86) deg = head + angDiff(head, leg.endDeg) * ease.inOutSine((qq - 0.86) / 0.14);
  if (qq <= 0) deg = leg.startDeg;
  if (qq >= 1) deg = leg.endDeg;
  const moving = qq > 0 && qq < 1;
  const amp = moving ? Math.min(1, qq / 0.06, (1 - qq) / 0.06) : 0;
  return {x: p.x, y: p.y, deg: norm360(deg), phase: ((s * leg.poly.total) / STRIDE) * Math.PI, walk: reduced ? amp * 0.6 : amp, moving};
}

/** Where a carried file sits for a clerk at (x, y) facing deg. */
export function carryPoint(st, scale = 1, reach = CARRY) {
  const a = (st.deg * Math.PI) / 180;
  return {x: st.x + Math.sin(a) * reach * scale, y: st.y - Math.cos(a) * reach * scale};
}

/**
 * Pose records for a plan person carrying (carry = 1) or not carrying (0) an
 * object in front with both hands.
 */
export function clerkNodes(pp, name, st, carry, scale = 1) {
  const nodes = pp.pose({x: st.x, y: st.y, deg: st.deg, scale, phase: st.phase, walk: st.walk * (1 - 0.7 * carry), seated: 0});
  for (const [key, side] of [['armL', -1], ['armR', 1]]) {
    const hn = nodes[`${name}-${key}-h`];
    const hx = lerp(hn.cx, side * 33, carry), hy = lerp(hn.cy, (-CARRY + 6) / scale, carry);
    const line = {x1: r(side * 34), y1: -2, x2: r(hx), y2: r(hy)};
    nodes[`${name}-${key}-o`] = line;
    nodes[`${name}-${key}-i`] = line;
    nodes[`${name}-${key}-h`] = {cx: r(hx), cy: r(hy)};
  }
  return nodes;
}

export {planPerson, actorLook};

/* ------------------------------------------------------------------ */
/* Text helpers (design units)                                         */
/* ------------------------------------------------------------------ */

export const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** A multi-line text element from a fitWords result; y = top of the block. */
export function textAt(fit, x, y, fill, o = {}) {
  return h('text', {name: o.name, x: r(x), y: r(y + fit.size * 0.8), 'font-family': FONT, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': o.italic ? 'italic' : undefined, 'text-anchor': o.anchor || 'start', fill, opacity: o.opacity},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

/** Fit supplied text with glue (numbers and short words kept with their neighbour). */
export function fitG(text, o) {
  // a short last word ("up", "on") never ends up alone on the last line
  return fitWords(glue(text).replace(/\s+(\p{L}{1,3}[.)]?)$/u, '\u00a0$1'), o);
}

/**
 * Largest-to-floor fit that never breaks a word: returns the fit at `size`
 * (or down to minSize) with at most maxLines lines, or a truncated result.
 */
export function fitNoSplit(text, {maxWidth, size, minSize, maxLines, weight = 600}) {
  return fitG(text, {maxWidth, size, minSize: minSize ?? size, maxLines, weight});
}

/**
 * A tag chip: tag glyph + fitted text on a card. Returns {w, h, node(x, y, name)}.
 * The node has a `-hi` outline (match highlight) and a `-scan` outline.
 */
export function tagChip(ctx, text, {F, maxWidth, maxLines = 3, weight = 600, glyph = true, stroke}) {
  const th = ctx.theme;
  const gs = glyph ? F * 1.25 : 0;
  const padX = F * 0.55, padY = F * 0.36;
  const fit = fitG(text, {maxWidth: maxWidth - padX * 2 - (glyph ? gs + F * 0.35 : 0), size: F, minSize: F, maxLines, weight});
  const w = fit.width + padX * 2 + (glyph ? gs + F * 0.35 : 0);
  const hh = Math.max(fit.height, gs * 0.8) + padY * 2;
  return {
    w, h: hh, fit,
    node(x, y, name, o = {}) {
      const rad = Math.min(hh / 2, F * 0.6);
      return g({name, opacity: o.opacity},
        h('path', {name: name && `${name}-body`, d: roundRectPath(x, y, w, hh, rad), fill: th.card, stroke: stroke ?? th.inkSoft, 'stroke-width': 2}),
        glyph ? g({transform: T(x + padX + gs / 2, y + hh / 2)}, tagGlyph(ctx, gs * 0.85)) : null,
        textAt(fit, x + padX + (glyph ? gs + F * 0.35 : 0), y + (hh - fit.height) / 2, th.ink, {name: name && `${name}-text`}),
        name ? h('path', {name: `${name}-scan`, d: roundRectPath(x - 4, y - 4, w + 8, hh + 8, rad + 3), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '6 5', opacity: 0}) : null,
        name ? h('path', {name: `${name}-hi`, d: roundRectPath(x - 5, y - 5, w + 10, hh + 10, rad + 4), fill: 'none', stroke: th.accent2, 'stroke-width': 4.5, opacity: 0}) : null,
      );
    },
  };
}

/**
 * The venue text block: the venue name (bold, on a card edged in the venue's
 * tint) over its mapping tags. Returns {w, h, node(x, y, prefix), tagBoxes}.
 */
export function venueBlock(ctx, venue, {F, maxWidth, maxLines = 3, tints = VENUE_TINTS}) {
  const th = ctx.theme;
  const padX = F * 0.55, padY = F * 0.36;
  const nameFit = fitG(venue.name, {maxWidth: maxWidth - padX * 2 - F * 0.9, size: F, minSize: F, maxLines, weight: 700});
  const nameW = nameFit.width + padX * 2 + F * 0.9, nameH = nameFit.height + padY * 2;
  const tags = venue.tags.map(tg => ({row: tg.index, chip: tagChip(ctx, tg.datum, {F, maxWidth: maxWidth - F * 0.8, maxLines})}));
  const gap = F * 0.3;
  const w = Math.max(nameW, ...tags.map(tg => tg.chip.w + F * 0.8));
  const hh = nameH + tags.reduce((a, tg) => a + gap + tg.chip.h, 0);
  const truncated = nameFit.truncated || tags.some(tg => tg.chip.fit.truncated);
  const tint = tints[venue.index % tints.length];
  return {
    w, h: hh, truncated, nameFit, tags, nameH,
    tagBox(x, y, j) {
      let yy = y + nameH;
      for (let q = 0; q < j; q++) yy += gap + tags[q].chip.h;
      return {x: x + F * 0.8, y: yy + gap, w: tags[j].chip.w, h: tags[j].chip.h};
    },
    node(x, y, P) {
      const rad = Math.min(nameH / 2, F * 0.6);
      const parts = [
        h('path', {d: roundRectPath(x, y, nameW, nameH, rad), fill: th.card, stroke: shade(tint, -0.45), 'stroke-width': 2.6}),
        h('path', {d: roundRectPath(x + padX * 0.6, y + nameH * 0.22, F * 0.5, nameH * 0.56, F * 0.2), fill: tint, stroke: shade(tint, -0.45), 'stroke-width': 1.6}),
        textAt(nameFit, x + padX + F * 0.9, y + (nameH - nameFit.height) / 2, th.ink, {name: `${P}-name`}),
      ];
      let yy = y + nameH;
      tags.forEach((tg, j) => {
        yy += gap;
        // a thin stem from the name card to each tag (the tag hangs from the venue)
        parts.push(h('path', {d: `M${r(x + F * 0.45)} ${r(y + nameH)}V${r(yy + tg.chip.h / 2)}H${r(x + F * 0.8)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2}));
        parts.push(tg.chip.node(x + F * 0.8, yy, `${P}-tag${tg.row}`));
        yy += tg.chip.h;
      });
      return g({name: P}, parts);
    },
  };
}

/**
 * Venue text blocks placed beside their venues (design units).
 * rot = false (flow right): each block right of its venue, centred on its row
 * (rows pushed apart when they would touch), width ≤ colW.
 * rot = true (flow up): blocks above the venues; with three venues the outer
 * two share the lower row (left- and right-aligned) and the middle one stands
 * above them, its leader dropping between the two.
 * Returns {blocks:[{v, m, box, lead:{from,to}}], need} where `need` is the
 * band the blocks take beyond the venues (height when rot, width otherwise).
 */
export function placeVenueBlocks(ctx, venues, vo, region, F, px, {rot, colW, maxLines = 4}) {
  const blocks = venues.map((v, i) => ({v, i}));
  if (!blocks.length) return {blocks, need: 0};
  if (!rot) {
    for (const b of blocks) b.m = venueBlock(ctx, b.v, {F, maxWidth: colW, maxLines});
    blocks.forEach((b, i) => { b.box = {x: vo[i].x + vo[i].w + 34, y: vo[i].y + vo[i].h / 2 - b.m.h / 2, w: b.m.w, h: b.m.h}; });
    for (let i = 1; i < blocks.length; i++) {
      const a = blocks[i - 1].box, b = blocks[i].box;
      if (b.y < a.y + a.h + 10) b.y = a.y + a.h + 10;
    }
    const last = blocks[blocks.length - 1].box;
    const over = last.y + last.h - (region.y + region.h);
    if (over > 0) {
      last.y -= over;
      for (let i = blocks.length - 2; i >= 0; i--) {
        const nb = blocks[i + 1].box, b = blocks[i].box;
        if (b.y + b.h + 10 > nb.y) b.y = nb.y - 10 - b.h;
      }
    }
    const first = blocks[0].box;
    if (first.y < region.y) {
      first.y = region.y;
      for (let i = 1; i < blocks.length; i++) {
        const pb = blocks[i - 1].box, b = blocks[i].box;
        if (b.y < pb.y + pb.h + 10) b.y = pb.y + pb.h + 10;
      }
    }
    blocks.forEach((b, i) => {
      const nameMid = b.box.y + Math.min(b.box.h, b.m.nameH) / 2;
      const y = Math.max(vo[i].y + 12, Math.min(nameMid, vo[i].y + vo[i].h - 12));
      b.lead = {from: {x: b.box.x, y: Math.max(b.box.y + 6, Math.min(y, b.box.y + b.box.h - 6))}, to: {x: vo[i].x + vo[i].w, y}};
    });
    return {blocks, need: Math.max(...blocks.map(b => b.box.w)) + 34};
  }
  const top = Math.min(...vo.map(q => q.y));
  const bottom = top - 26;
  const cx = i => vo[i].x + vo[i].w / 2;
  const R = region;
  const cap = 460 / px;
  if (blocks.length === 3) {
    const lx = cx(1);
    const w0 = Math.min(cap, lx - 26 - R.x), w2 = Math.min(cap, R.x + R.w - lx - 26);
    blocks[0].m = venueBlock(ctx, blocks[0].v, {F, maxWidth: w0, maxLines});
    blocks[2].m = venueBlock(ctx, blocks[2].v, {F, maxWidth: w2, maxLines});
    blocks[1].m = venueBlock(ctx, blocks[1].v, {F, maxWidth: Math.min(R.w, 560 / px), maxLines});
    const b0 = blocks[0], b1 = blocks[1], b2 = blocks[2];
    b0.box = {x: Math.max(R.x, Math.min(cx(0) - b0.m.w / 2, lx - 26 - b0.m.w)), y: bottom - b0.m.h, w: b0.m.w, h: b0.m.h};
    b2.box = {x: Math.min(R.x + R.w - b2.m.w, Math.max(cx(2) - b2.m.w / 2, lx + 26)), y: bottom - b2.m.h, w: b2.m.w, h: b2.m.h};
    const low = Math.min(b0.box.y, b2.box.y);
    b1.box = {x: Math.max(R.x, Math.min(lx - b1.m.w / 2, R.x + R.w - b1.m.w)), y: low - 16 - b1.m.h, w: b1.m.w, h: b1.m.h};
  } else {
    blocks.forEach((b, i) => {
      const half = (R.w - 26) / blocks.length;
      b.m = venueBlock(ctx, b.v, {F, maxWidth: Math.min(cap, half), maxLines});
      const x0 = R.x + i * (half + 26);
      b.box = {x: Math.max(x0, Math.min(cx(i) - b.m.w / 2, x0 + half - b.m.w)), y: bottom - b.m.h, w: b.m.w, h: b.m.h};
    });
  }
  blocks.forEach((b, i) => {
    const x = Math.max(b.box.x + 10, Math.min(cx(i), b.box.x + b.box.w - 10));
    const tx = Math.max(vo[i].x + 14, Math.min(x, vo[i].x + vo[i].w - 14));
    b.lead = {from: {x, y: b.box.y + b.box.h}, to: {x: tx, y: vo[i].y}};
  });
  return {blocks, need: top - Math.min(...blocks.map(b => b.box.y))};
}

/**
 * The plan and its venue blocks fitted into `region` (design units): the site
 * is stretched to the region's shape, then fitted; rot = false puts the blocks
 * in a column right of the venues (T = its width), rot = true above them.
 * Returns {G, M, placed}.
 */
export function planWithBlocks(ctx, {n, S, region, venues, F, px, rot, T = 0, kMax = 1.6, maxLines = 4, caps}) {
  let G, M, placed = {blocks: [], need: 0};
  const vOuter = () => G.venues.map(v => M.box(v.outer));
  if (!rot) {
    const Tw = venues.length ? T / px : 0;
    const siteBox = {x: region.x, y: region.y, w: region.w - Tw, h: region.h};
    G = stretchedSite(n, S, siteBox, false, caps);
    M = mapper(G.extents, siteBox, false, kMax, {x: 0, y: 0.5});
    const colW = Math.min(region.x + region.w - (M.rect.x + M.rect.w) - 12, 460 / px);
    placed = placeVenueBlocks(ctx, venues, vOuter(), region, F, px, {rot: false, colW, maxLines});
    const usedW = M.rect.w + 12 + (venues.length ? placed.need : 0);
    const dx = Math.max(0, (region.w - usedW) / 2);
    M = mapperAt(G.extents, false, M.k, M.rect.x + dx, M.rect.y);
    placed = placeVenueBlocks(ctx, venues, vOuter(), region, F, px, {rot: false, colW, maxLines});
  } else {
    let Tb = 0;
    for (let it = 0; it < 5; it++) {
      const siteBox = {x: region.x, y: region.y + Tb, w: region.w, h: region.h - Tb};
      G = stretchedSite(n, S, siteBox, true, caps);
      M = mapper(G.extents, siteBox, true, kMax, {x: 0.5, y: 0});
      placed = placeVenueBlocks(ctx, venues, vOuter(), region, F, px, {rot: true, maxLines});
      const need = venues.length ? placed.need + 8 : 0;
      if (Math.abs(need - Tb) < 0.5) break;
      Tb = need;
    }
    const used = Tb + M.rect.h;
    const dy = Math.max(0, (region.h - used) / 2);
    M = mapperAt(G.extents, true, M.k, M.rect.x, M.rect.y + dy);
    placed = placeVenueBlocks(ctx, venues, vOuter(), region, F, px, {rot: true, maxLines});
  }
  return {G, M, placed, vOuter};
}

/** Problems of placed venue blocks: truncated, outside the region, overlapping. */
export function blockProblems(placed, region) {
  const out = [];
  const blocks = placed.blocks;
  for (const b of blocks) {
    if (b.m.truncated) out.push('block-trunc');
    const R = region;
    if (b.box.x < R.x - 0.5 || b.box.y < R.y - 0.5 || b.box.x + b.box.w > R.x + R.w + 0.5 || b.box.y + b.box.h > R.y + R.h + 0.5) out.push('block-out');
  }
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) if (overlaps(blocks[i].box, blocks[j].box, 4)) out.push('block-overlap');
  return out;
}

/** Lines wrapped in the venue blocks beyond one per item (a small layout cost). */
export const blockWraps = placed => placed.blocks.reduce((a, b) => a + b.m.nameFit.lines.length - 1 + b.m.tags.reduce((c, tg) => c + tg.chip.fit.lines.length - 1, 0), 0);

/** Leader + block nodes for placed venue blocks. */
export function venueBlockNodes(ctx, placed, prefix = 'vb') {
  const th = ctx.theme;
  return placed.blocks.map(b => g(null,
    h('path', {d: `M${r(b.lead.from.x)} ${r(b.lead.from.y)}L${r(b.lead.to.x)} ${r(b.lead.to.y)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4}),
    h('circle', {cx: r(b.lead.to.x), cy: r(b.lead.to.y), r: 4.5, fill: th.inkSoft}),
    b.m.node(b.box.x, b.box.y, `${prefix}${b.i}`)));
}

/** Distance from a box to a point. */
export const boxDist = (b, p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h)));

/** Does the polyline pass within pad of box b? */
export function pathHits(pts, b, pad = 0) {
  for (let j = 1; j < pts.length; j++) {
    const p = pts[j - 1], q = pts[j];
    const n = Math.max(2, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 8));
    for (let i = 0; i <= n; i++) {
      const x = p.x + ((q.x - p.x) * i) / n, y = p.y + ((q.y - p.y) * i) / n;
      if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
    }
  }
  return false;
}

/**
 * Place a w × h box beside `part` (design units): candidates ring the part at
 * growing gaps (≤ maxGap) on every side with slides; a candidate must lie in
 * `bounds`, clear every `hard` box (pad 6) and keep `pathPad` from every path
 * in `paths`. The nearest valid one wins (then the preferred side order).
 * @returns {{x:number,y:number,w:number,h:number}|null}
 */
export function placeNear(part, w, hh, o) {
  const order = o.order || ['below', 'above', 'right', 'left'];
  const hard = o.hard || [];
  const paths = o.paths || [];
  const pad = o.pad ?? 6;
  let best = null;
  const gaps = o.gaps || [8, 16, 28, 44, 64, 90, 120];
  for (const gap of gaps) {
    if (gap > (o.maxGap ?? 1e9)) continue;
    order.forEach((sd, oi) => {
      for (const f of [0, -0.25, 0.25, -0.5, 0.5, -0.75, 0.75, -1, 1]) {
        let box;
        if (sd === 'below') box = {x: part.x + part.w / 2 - w / 2 + f * (part.w / 2 + w / 2), y: part.y + part.h + gap, w, h: hh};
        else if (sd === 'above') box = {x: part.x + part.w / 2 - w / 2 + f * (part.w / 2 + w / 2), y: part.y - gap - hh, w, h: hh};
        else if (sd === 'right') box = {x: part.x + part.w + gap, y: part.y + part.h / 2 - hh / 2 + f * (part.h / 2 + hh / 2), w, h: hh};
        else box = {x: part.x - gap - w, y: part.y + part.h / 2 - hh / 2 + f * (part.h / 2 + hh / 2), w, h: hh};
        const B = o.bounds;
        if (B && (box.x < B.x || box.y < B.y || box.x + w > B.x + B.w || box.y + hh > B.y + B.h)) continue;
        if (hard.some(q => overlaps(box, q, pad))) continue;
        if (paths.some(pts => pathHits(pts, box, o.pathPad ?? 0))) continue;
        const cost = gap + oi * 6 + Math.abs(f) * 10;
        if (!best || cost < best.cost) best = {box, cost};
      }
    });
    if (best) break;
  }
  return best ? best.box : null;
}

/** Union of boxes. */
export const unionBox = bs => {
  const v = bs.filter(Boolean);
  const x0 = Math.min(...v.map(b => b.x)), y0 = Math.min(...v.map(b => b.y));
  return {x: x0, y: y0, w: Math.max(...v.map(b => b.x + b.w)) - x0, h: Math.max(...v.map(b => b.y + b.h)) - y0};
};

/** Legend glyphs (design units, centre at the origin). */
export function legendGlyph(ctx, kind, s, look) {
  const c = planColors(ctx);
  const th = ctx.theme;
  if (kind === 'clerk') {
    const pp = planPerson(ctx, {name: 'lg-clerk', look});
    return g({transform: `scale(${r(s / 110, 4)})`}, bake(pp.node, clerkNodes(pp, 'lg-clerk', {x: 0, y: 8, deg: 0, phase: 0, walk: 0}, 1)), g({transform: T(0, 8 - CARRY)}, stripNames(fileProp(ctx, {name: 'lg-file'}))));
  }
  if (kind === 'file') return g({transform: `scale(${r(s / 80, 4)})`}, stripNames(fileProp(ctx, {name: 'lg-file'})));
  if (kind === 'route') return h('path', {d: `M${r(-s * 0.45)} ${r(s * 0.1)}Q0 ${r(-s * 0.3)} ${r(s * 0.45)} ${r(s * 0.1)}`, fill: 'none', stroke: c.route, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': `0.1 ${r(6 * 2.6)}`});
  if (kind === 'tray') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.42, -s * 0.34, s * 0.84, s * 0.68, 5), fill: shade(c.wood, 0.1), stroke: '#1f2328', 'stroke-width': 2}),
      h('path', {d: roundRectPath(-s * 0.32, -s * 0.24, s * 0.64, s * 0.48, 3), fill: 'none', stroke: c.woodEdge, 'stroke-width': 2}));
  }
  if (kind === 'slot') return h('path', {d: roundRectPath(-s * 0.44, -s * 0.34, s * 0.88, s * 0.68, 7), fill: '#fff', stroke: c.frame, 'stroke-width': 3, 'stroke-dasharray': '7 5'});
  if (kind === 'tag') return tagGlyph(ctx, s * 0.62);
  if (kind === 'office') {
    return g(null,
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.36), width: r(s * 0.84), height: r(s * 0.72), fill: '#f5efe3', stroke: '#454b53', 'stroke-width': r(s * 0.12)}),
      h('rect', {x: r(s * 0.3), y: r(-s * 0.14), width: r(s * 0.16), height: r(s * 0.28), fill: '#fff'}));
  }
  if (kind === 'plaza') {
    return g(null,
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.36), width: r(s * 0.84), height: r(s * 0.72), rx: 4, fill: '#e7dcc6', stroke: '#a89c86', 'stroke-width': 3}),
      h('path', {d: `M${r(-s * 0.42)} 0H${r(s * 0.42)}M0 ${r(-s * 0.36)}V${r(s * 0.36)}`, stroke: '#cbbd9f', 'stroke-width': 2}));
  }
  return g(null, h('circle', {r: s * 0.3, fill: th.inkSoft}));
}

/** Remove `name` attributes from a node tree (static glyph copies). */
export function stripNames(n) {
  if (!n || typeof n === 'string') return n;
  const attrs = {...n.attrs};
  delete attrs.name;
  return {tag: n.tag, attrs, children: n.children.map(stripNames)};
}

/** Bake a pose record into a (name-less) node tree for static glyphs. */
export function bake(node, nodes) {
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

/** The clerk's look (supplied appearance wins; seeded otherwise). */
export function clerkLook(ctx, p) {
  return actorLook(ctx, p.clerk || {}, 0);
}
