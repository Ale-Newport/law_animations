/**
 * "Apertura de audiencia" kit (LAW-0281..0284): a generic, fictional hearing
 * room drawn as a floor plan. Participants sit around one shared oval table
 * (identical seats: nobody sits at a head). The room is ACTIVATED by a
 * two-position wall switch (◆ pending → ● started): a pulse runs along the
 * power line in the walls, the wall lamps come on and the wall display
 * changes from the supplied pending state (dashed frame) to the supplied
 * started state (solid frame). Participants RECEIVE their labels: in the
 * configured sequence a blank name card slides out of the tray in the middle
 * of the table, its participant reaches out, takes it and sets it upright in
 * front of them; the supplied label arrives beside them.
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md): everything is fictional and
 * illustrative, jurisdiction unspecified. No opening formula, no ritual
 * wording, no mandatory step, no roles hierarchy, no rule about who speaks
 * first, and no consequence of "pending": it is only a waiting state of this
 * configured example (no red, dashes only for pending). The order in which
 * the cards are handed over is a SEQUENCE AS CONFIGURED (illustrative).
 *
 * The kit owns fields, defaults, strings (en/es, localised defaults), the
 * room geometry (template units), the room builder (nodes + per-frame
 * records), label measuring/placement and the text panel. Each entry owns its
 * own timeline, composition and semantics. Generic art comes from
 * ./hearings-art.js and, read-only, ../../courts/kits/courts-art.js.
 * @module animations/hearings/kits/apertura-audiencia
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {fitDesign} from '../../../core/layout.js';
import {measure, FONTS} from '../../../core/text.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {changedMarker} from '../../../primitives/markers.js';
import {floorArea, wallRing, planChair, planPerson, PERSON} from '../../courts/kits/courts-art.js';
import {fitWords, glue, applyStatic} from '../../courts/kits/distribucion-de-sala.js';
import {
  hearingColors, stateGlyph, ovalTable, statusDisplay, sessionSwitch, wallLamp, powerLine, wallClock, nameCard,
  cardTray, paperSheet, exhibitBox, lowCabinet, plainDoor, facing, toWorld, reachRecords,
} from './hearings-art.js';

export {fitWords, glue};
export const FONT = FONTS.sans;

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
export const aperturaFields = {
  hearing: obj('Generic, fictional hearing room', {
    room: str('Name of the room (fictional)', 60),
  }, ['room']),
  speakers: list('Participants seated around the shared table. Each label is supplied and editable and is printed for that participant when they receive their name card; no role, rank or speaking order is implied', obj('Participant', {
    label: str('Label received by this participant (as supplied)', 50),
    appearance,
  }, ['label']), 2, 4),
  statements: list('Supplied written statements lying on the table in front of a participant; each is shown under that participant’s label', obj('Statement', {
    speaker: int('Index of the participant in `speakers`', 0, 3),
    text: str('Statement title (fictional)', 60),
  }, ['speaker', 'text']), 0, 2),
  exhibits: list('Exhibits on the low cabinet by the wall, each with its supplied tag', str('Exhibit tag (fictional)', 50), 0, 2),
  sequence: list('Order in which the name cards are handed over (indices in `speakers`): a sequence as configured (illustrative), not a rule. Participants left out follow in list order', int('Index of the participant in `speakers`', 0, 3), 1, 4),
  session: obj('The two supplied session states shown on the wall display', {
    started: str('Supplied state: session started', 60),
    pending: str('Supplied state: session pending (a waiting state of this example only)', 60),
  }, ['started', 'pending']),
  labels: obj('Editable captions', {
    sequence: str('Caption of the order in which the cards are handed over', 80),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['sequence', 'key']),
};

export const APERTURA_EN = {
  hearing: {room: 'Hearing room 3 (fictional)'},
  speakers: [{label: 'Participant A'}, {label: 'Participant B'}, {label: 'Participant C'}],
  statements: [{speaker: 0, text: 'Written statement (fictional)'}],
  exhibits: ['Exhibit 1 (fictional)'],
  sequence: [0, 1, 2],
  session: {started: 'Session started', pending: 'Session pending'},
  labels: {sequence: 'Sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const APERTURA_ES = {
  hearing: {room: 'Sala de audiencias 3 (ficticia)'},
  speakers: [{label: 'Participante A'}, {label: 'Participante B'}, {label: 'Participante C'}],
  statements: [{speaker: 0, text: 'Declaración escrita (ficticia)'}],
  exhibits: ['Prueba 1 (ficticia)'],
  sequence: [0, 1, 2],
  session: {started: 'Sesión iniciada', pending: 'Sesión pendiente'},
  labels: {sequence: 'Secuencia según la configuración (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

/**
 * When only `locale: 'es'` is set, every field still equal to its English
 * default is replaced by the Spanish default (no English leaks into an es
 * render). Supplied values are never translated.
 * @param {any} ctx
 * @param {Record<string, any>} en  English defaults of the entry
 * @param {Record<string, any>} es  Spanish defaults of the entry (same keys)
 */
export function localised(ctx, en, es) {
  const p = ctx.params;
  if (p.locale !== 'es') return p;
  const out = {...p};
  for (const k of Object.keys(es)) {
    if (!(k in en) || !(k in p)) continue;
    const same = JSON.stringify(p[k]) === JSON.stringify(en[k]);
    if (same) out[k] = JSON.parse(JSON.stringify(es[k]));
    else if (p[k] && en[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) {
      // objects: per property (a caption left at its English default is localised on its own)
      const o = {...p[k]};
      for (const kk of Object.keys(es[k] || {})) if (JSON.stringify(p[k][kk]) === JSON.stringify(en[k][kk])) o[kk] = es[k][kk];
      out[k] = o;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Resolved params                                                     */
/* ------------------------------------------------------------------ */

/** Outfit colours used by default (skips the red-ish cloth entries: no red in this motif). */
const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];

/**
 * Speakers with their look and statements, and the configured card order.
 * @param {any} ctx
 * @param {any} P localised params
 */
export function resolveApertura(ctx, P) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  for (const st of P.statements || []) if (st.speaker < n) speakers[st.speaker].statements.push(st.text);
  const order = [];
  for (const q of P.sequence || []) if (q < n && !order.includes(q)) order.push(q);
  for (let i = 0; i < n; i++) if (!order.includes(i)) order.push(i);
  const rank = speakers.map(s => order.indexOf(s.index));
  return {n, speakers, order, rank, exhibits: (P.exhibits || []).slice(0, 2)};
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Design units → px at 1080p. */
export function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return (f.scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
}

/** Widest single word of a text at a size (so a box is never narrower than a word). */
export function widestWord(text, size, weight = 600) {
  return Math.max(0, ...glue(text).split(/[ \t\n]+/).filter(Boolean).map(w => measure(w.replace(/ /g, ' '), size, weight, 'sans')));
}

/** Whole-word fit with glued numbers ("Room 3", "Exhibit 1"); never breaks a word. */
export function fitG(text, o) {
  const size = o.size;
  const need = widestWord(text, o.minSize ?? size, o.weight ?? 600);
  const f = fitWords(glue(text), {...o, maxWidth: Math.max(o.maxWidth, need + 0.5)});
  return f;
}

/** Text node from a fit (top-left at x, y; lines as tspans). */
export function textAt(fit, x, y, fill, o = {}) {
  const anchor = o.anchor ?? 'start';
  return h('text', {name: o.name, x: r(x), y: r(y + fit.size * 0.8), 'font-family': FONT, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': o.italic ? 'italic' : undefined, 'text-anchor': anchor, fill, opacity: o.opacity},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

export const WALL = 18;
/** Seat angles (degrees, screen coordinates, 0 = right, 90 = down) per participant count: the top of the table stays open towards the wall display. */
export const SEAT_ANGLES = {2: [180, 0], 3: [180, 0, 90], 4: [180, 0, 122, 58]};
export const SEAT_ANGLES_TALL = {2: [180, 0], 3: [200, 340, 90], 4: [212, 328, 148, 32]};
/** Local positions (planPerson frame) of the hand-over point, the card's resting spot and the statement sheet. */
export const LOCAL = {handoff: {x: 18, y: -70}, rest: {x: 2, y: -62}, sheet: {x: -54, y: -70}};
/** Smallest interior per participant count (every seat, card path and label keeps its clearance). */
export const ROOM_MIN = {2: {W: 640, H: 600}, 3: {W: 660, H: 640}, 4: {W: 720, H: 690}};

/**
 * Interior size whose extents (room + walls) match a box aspect, so the plan
 * fills the box; returns {W, H, k} with k = design units per template unit.
 */
export function fitRoom(box, n, {min = ROOM_MIN[n], maxW = 1700, maxH = 1500} = {}) {
  const ex = WALL * 2;
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
 * Geometry of the generic hearing room. Interior origin = top-left of the
 * floor; the wall with the clock, display and switch is at the top.
 * @param {number} W interior width
 * @param {number} H interior height
 * @param {number} n participants (2–4)
 * @param {{dispW:number, dispH:number, exhibits:number, statements:number[][]}} o
 */
export function roomGeometry(W, H, n, o) {
  const t = WALL;
  const dispW = o.dispW, dispH = o.dispH;
  // the control unit on the wall: the status display with the two-position switch under it (one backing plate)
  const display = {x: W / 2 - dispW / 2, y: 10, w: dispW, h: dispH};
  const swS = 92;
  const sw = {cx: W / 2, cy: display.y + dispH + 10 + swS * 0.23, s: swS};
  const unit = {x: display.x - 10, y: 2, w: dispW + 20, h: dispH + swS * 0.46 + 26};
  const clock = {cx: unit.x - 64, cy: 44, R: 34};
  // table: centred below the equipment wall, radii grow with the room
  // (o.dock: height kept free under the unit, e.g. for a docked value)
  const bare = Boolean(o.bare);
  const topZone = unit.y + unit.h + Math.max(o.compact ? 56 : 110, (o.dock || 0) + 56);
  // without labels on the floor the table sits in the middle of the free floor and may be larger
  // in a tall room the side seats move to the diagonals (the free floor is in the corners)
  const tall = H > W * 0.92 && !o.bare;
  const angles = tall ? SEAT_ANGLES_TALL[n] : SEAT_ANGLES[n];
  // every seat, its person and its chair stay inside the walls: the table's radii and its centre are bounded by
  // the room (a seat's back reaches PERSON.half + 22 behind its centre)
  const back = PERSON.half + 26;
  const sinMax = Math.max(0, ...angles.map(a => Math.sin((a * Math.PI) / 180)));
  const cosMax = Math.max(0, ...angles.map(a => Math.abs(Math.cos((a * Math.PI) / 180))));
  // (o.bigTable: labels hidden — nothing else on the floor, the table and its seats take more of it)
  let A = clamp(W * (o.bigTable ? 0.3 : bare ? 0.26 : 0.23), 160, o.bigTable ? 480 : bare ? 360 : 320);
  if (cosMax > 0) A = Math.max(150, Math.min(A, (W / 2 - back - 14) / cosMax - 44));
  // (four participants need a deeper table: their statement sheets stay clear of each other's reach)
  let B = clamp(Math.min((H - topZone) * (bare ? 0.3 : 0.26), A * (bare ? 1 : 0.78)), n === 4 ? 132 : 105, bare ? 260 : 200);
  let cy = topZone + (H - topZone) * (bare ? 0.46 : H > W * 1.05 ? 0.36 : 0.42);
  if (sinMax > 0) {
    const room = H - 14 - back;
    if (cy + (B + 44) * sinMax > room) B = Math.max(n === 4 ? 120 : 100, (room - cy) / sinMax - 44);
    if (cy + (B + 44) * sinMax > room) cy = Math.max(topZone + B * 0.6, room - (B + 44) * sinMax);
  }
  // an oval, not a strip: the table is at most ~2.3 times as long as it is deep
  A = Math.min(A, Math.max(170, B * (o.bigTable ? 3.3 : 2.3)));
  const C = {x: W / 2, y: cy};
  const ring = {a: A + 44, b: B + 44};
  const seats = angles.map(deg => {
    const a = (deg * Math.PI) / 180;
    const p = {x: C.x + ring.a * Math.cos(a), y: C.y + ring.b * Math.sin(a)};
    return {...p, deg: facing(p, C), angle: deg};
  });
  const inTable = (q, pad = 0) => ((q.x - C.x) / (A - pad)) ** 2 + ((q.y - C.y) / (B - pad)) ** 2 <= 1;
  const cards = seats.map((s, i) => {
    const pose = {x: s.x, y: s.y, deg: s.deg};
    const tray = {x: C.x + (i - (n - 1) / 2) * 5, y: C.y - (i - (n - 1) / 2) * 4};
    return {tray, handoff: toWorld(pose, LOCAL.handoff), rest: toWorld(pose, LOCAL.rest), deg: s.deg};
  });
  // statement sheets: in front of their participant's left hand, on the table, and clear of every OTHER
  // participant's reach (shoulder → hand-over point, the sleeve 11 wide) and card path
  const reachSegs = seats.map(s => {
    const pose = {x: s.x, y: s.y, deg: s.deg};
    return [toWorld(pose, {x: 34, y: -2}), toWorld(pose, {x: LOCAL.handoff.x + 14, y: LOCAL.handoff.y + 10}), toWorld(pose, LOCAL.handoff)];
  });
  const segD = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y; const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)); return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t); };
  const sheets = seats.map((s, i) => (o.statements[i] || []).length ? (() => {
    const pose = {x: s.x, y: s.y, deg: s.deg};
    let found = null, fallback = null;
    for (const [lx, ly] of [[-54, -70], [-46, -86], [-60, -88], [-38, -100], [-66, -104], [-30, -114], [-72, -74], [-20, -128]]) {
      for (let f = 0; f <= 56 && !found; f += 8) {
        const c0 = toWorld(pose, {x: lx + f * 0.3, y: ly - f});
        const corners = [[-20, -25], [20, -25], [-20, 25], [20, 25], [0, 0], [-20, 0], [20, 0], [0, -25], [0, 25]].map(([dx, dy]) => toWorld({...pose, x: c0.x, y: c0.y}, {x: dx, y: dy}));
        if (!corners.every(cn => inTable(cn, 8))) { if (!fallback && f === 56) fallback = c0; continue; }
        if (!fallback) fallback = c0;
        // other participants' arms and the path of their cards stay clear of the sheet
        const clearOf = reachSegs.every((sg, j) => j === i || corners.every(cn => segD(cn, sg[0], sg[1]) > 12 && segD(cn, sg[1], sg[2]) > 12))
          && seats.every((_, j) => j === i || corners.every(cn => segD(cn, {x: C.x, y: C.y}, reachSegs[j][2]) > 22));
        if (clearOf) found = c0;
      }
      if (found) break;
    }
    // still no clear place in front of the owner: try the table between the owner and a neighbour (polar positions)
    if (!found) {
      const own = [toWorld(pose, {x: -34, y: -2}), toWorld(pose, {x: -24, y: -44})];
      outer: for (const dd of [18, -18, 28, -28, 38, -38, 50, -50, 64, -64]) for (const rf of [0.72, 0.62, 0.52, 0.42]) {
        const a = ((s.angle + dd) * Math.PI) / 180;
        const c0 = {x: C.x + A * rf * Math.cos(a), y: C.y + B * rf * Math.sin(a)};
        const corners = [[-20, -25], [20, -25], [-20, 25], [20, 25], [0, 0], [-20, 0], [20, 0], [0, -25], [0, 25]].map(([dx, dy]) => toWorld({...pose, x: c0.x, y: c0.y}, {x: dx, y: dy}));
        if (!corners.every(cn => inTable(cn, 8))) continue;
        const clearOf = reachSegs.every((sg, j) => j === i || corners.every(cn => segD(cn, sg[0], sg[1]) > 12 && segD(cn, sg[1], sg[2]) > 12))
          && seats.every((_, j) => j === i || corners.every(cn => segD(cn, {x: C.x, y: C.y}, reachSegs[j][2]) > 22))
          && corners.every(cn => segD(cn, reachSegs[i][0], reachSegs[i][1]) > 14 && segD(cn, reachSegs[i][1], reachSegs[i][2]) > 14 && segD(cn, own[0], own[1]) > 14)
          && corners.every(cn => segD(cn, {x: C.x, y: C.y}, reachSegs[i][2]) > 22);
        if (clearOf) { found = c0; break outer; }
      }
    }
    const q = found || fallback;
    return {x: q.x, y: q.y, deg: s.deg, clear: Boolean(found)};
  })() : null);
  // lamps on three walls; the power line runs inside the walls from the switch to each lamp
  const cabSpot = o.cabSpot ?? 'left';
  const lamps = [
    {x: 0, y: H * 0.42, side: 'left'},
    {x: W, y: H * 0.42, side: 'right'},
  ];
  // the third lamp on the bottom wall, unless the exhibit cabinet stands there
  if (cabSpot !== 'bottom' || !o.exhibits) lamps.push({x: W * 0.3, y: H, side: 'bottom'});
  const mid = -t / 2;
  const power = [
    [{x: sw.cx, y: mid}, {x: mid, y: mid}, {x: mid, y: H + t / 2}, {x: W * 0.3, y: H + t / 2}],
    [{x: sw.cx, y: mid}, {x: W + t / 2, y: mid}, {x: W + t / 2, y: H * 0.42}],
  ];
  // door on the bottom wall, right side (closed; nobody enters in this motif)
  const door = {a: W - 250, b: W - 138};
  // exhibits on a low cabinet along the left wall, above the left lamp
  const m = o.exhibits;
  // (on the left wall above the left lamp, or along the bottom wall in the left corner)
  const cab = !m ? null : cabSpot === 'bottom' ? {x: 34, y: H - 66, w: 26 + 74 + (m - 1) * 170, h: 66} : {x: cabSpot === 'right' ? W - 66 : 0, y: Math.max(topZone - 90, 120), w: 66, h: 26 + m * 74};
  const exhibits = [];
  for (let i = 0; i < m; i++) exhibits.push(cabSpot === 'bottom' ? {cx: cab.x + 13 + 37 + i * 170, cy: H - 33, deg: 0} : {cx: cab.x + 33, cy: cab.y + 13 + 37 + i * 74, deg: cabSpot === 'right' ? -90 : 90});
  const room = {x: 0, y: 0, w: W, h: H};
  const extents = {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t};
  const fits = seats.every(q => q.x - back >= 4 && q.x + back <= W - 4 && q.y + back <= H - 4);
  return {fits, W, H, t, n, display, sw, unit, clock, A, B, C, ring, seats, cards, sheets, lamps, power, door, cab, cabSpot, exhibits, room, extents, inTable, topZone};
}

/** Obstacle boxes of the room (template units): equipment, cabinet, exhibits, tray, sheets, seats. */
export function roomObstacles(G) {
  const out = [];
  out.push({kind: 'unit', ...G.unit});
  out.push({kind: 'clock', x: G.clock.cx - G.clock.R, y: G.clock.cy - G.clock.R, w: 2 * G.clock.R, h: 2 * G.clock.R});
  for (const l of G.lamps) out.push({kind: 'lamp', x: l.x - 24, y: l.y - 24, w: 48, h: 48});
  if (G.cab) out.push({kind: 'cabinet', ...G.cab});
  // the door leaf and its swing
  out.push({kind: 'door', x: G.door.a, y: G.H - (G.door.b - G.door.a), w: G.door.b - G.door.a, h: G.door.b - G.door.a});
  return out;
}

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/**
 * Build the room (template units) with its equipment, table, cards and people.
 * @param {any} ctx
 * @param {any} G roomGeometry()
 * @param {{prefix:string, R:any, dispText?:{started:any, pending:any}|null, glyphS:number, keep?:(b:any)=>boolean, people?:boolean}} o
 *   dispText: fits (template font size) for the display text of each state, or null (text hidden)
 */
export function hearingRoom(ctx, G, o) {
  const P = o.prefix;
  const c = hearingColors(ctx);
  const {W, H, t} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const parts = [];
  let liftTray = null;
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 64}));
  const lamps = G.lamps.map((l, i) => wallLamp(ctx, {name: `${P}-lamp${i}`, x: l.x, y: l.y, side: l.side, R: 22, glowR: Math.min(W, H) * 0.34}));
  const lampOn = lamps.map(l => keep(l.box));
  // the light stays inside the room (glows clipped to the floor)
  parts.push(g({name: `${P}-glows`},
    h('defs', null, h('clipPath', {id: ctx.id(`${P}-floorclip`)}, h('rect', {x: 0, y: 0, width: r(W), height: r(H)}))),
    g({'clip-path': ctx.ref(`${P}-floorclip`)}, lamps.map(l => l.glow))));
  // "lights off": a neutral blue-grey tint over the floor (never a red wash)
  parts.push(h('rect', {name: `${P}-dim`, x: 0, y: 0, width: r(W), height: r(H), fill: c.dim, opacity: 0.16}));
  parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: [
    {side: 'bottom', a: G.door.a, b: G.door.b, kind: 'door'},
    {side: 'left', a: H * 0.62, b: H * 0.8, kind: 'window'},
    {side: 'right', a: H * 0.62, b: H * 0.8, kind: 'window'},
  ]}));
  const power = G.power.map((pts, i) => powerLine(ctx, {name: `${P}-power${i}`, pts}));
  parts.push(power.map(pw => pw.node));
  const door = plainDoor(ctx, {name: `${P}-door`, hinge: {x: G.door.b, y: H + t / 2}, width: G.door.b - G.door.a, closedDeg: 180, openDeg: 80});
  parts.push(door.node);
  parts.push(lamps.map((l, i) => (lampOn[i] ? l.node : null)));
  // equipment wall: clock, display (+ its texts), switch
  // (o.lift: the clock, the control unit, the exhibit cabinet and the tray are wrapped in groups that frame(st.lift)
  // translates — an exploded view; without o.lift the room is drawn exactly as before)
  const wrapLift = (key, items) => (o.lift ? g({name: `${P}-lift-${key}`, transform: 'translate(0 0)'}, items) : items);
  const clock = wallClock(ctx, {name: `${P}-clock`, cx: G.clock.cx, cy: G.clock.cy, R: G.clock.R});
  if (keep(clock.box)) parts.push(wrapLift('clock', clock.node));
  const unitParts = [];
  unitParts.push(g({name: `${P}-unit`},
    h('path', {d: roundRectPath(G.unit.x + 4, G.unit.y + 6, G.unit.w, G.unit.h, 12), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(G.unit.x, G.unit.y, G.unit.w, G.unit.h, 12), fill: '#d9dde1', stroke: '#1f2328', 'stroke-width': 2})));
  const disp = statusDisplay(ctx, {name: `${P}-display`, ...G.display});
  const sw = sessionSwitch(ctx, {name: `${P}-switch`, cx: G.sw.cx, cy: G.sw.cy, s: G.sw.s});
  unitParts.push(disp.node, sw.node);
  // display cue and texts (one per supplied state; the frame decides which is shown)
  const scr = disp.screen;
  const gS = o.glyphS;
  const dispNodes = [];
  const dispPos = {};
  for (const st of ['started', 'pending']) {
    const fit = o.dispText ? o.dispText[st] : null;
    const gx = fit ? scr.x + 16 + gS * 1.25 : scr.x + scr.w / 2;
    const inner = fit ? fit.height : gS * 2;
    const gy = scr.y + scr.h / 2 - (fit && fit.lines.length > 1 ? (fit.height - fit.size) / 2 : 0);
    const tx = gx + gS * 1.25 + 12, ty = scr.y + (scr.h - inner) / 2;
    dispPos[st] = {gx, gy, tx, ty, fit};
    // (datum overlay) strike lines through the text of the substituted state, moving with it
    const strikes = o.datum && o.datum.state === st && fit ? fit.lines.map((ln, i) => {
      const y = ty + fit.size * 0.8 + i * fit.lineHeight - fit.size * 0.3;
      return h('line', {name: `${P}-strike${i}`, opacity: 0, x1: r(tx - 3), y1: r(y), x2: r(tx - 3), y2: r(y), stroke: '#1f2328', 'stroke-width': r(Math.max(2.5, fit.size * 0.1), 2), 'stroke-linecap': 'round'});
    }) : [];
    // (datum overlay) a light slip behind the substituted value while it travels to the dock, so the moving text
    // stays legible where it passes over the switch (hidden at rest; it fades as the value settles into the dock chip)
    const slip = o.datum && o.datum.dock && o.datum.state === st && fit
      ? h('path', {name: `${P}-slip`, opacity: 0, d: roundRectPath(gx - gS * 1.25 - 5, ty - 5, tx - gx + gS * 1.25 + 5 + fit.width + 8, fit.height + 10, Math.min(fit.size * 0.6, (fit.height + 10) / 2)), fill: '#f3f4f5'})
      : null;
    dispNodes.push(g({name: `${P}-d-${st}`, opacity: 0, transform: 'translate(0 0)'},
      slip,
      stateGlyph(ctx, {kind: st === 'started' ? 'dot' : 'diamond', cx: gx, cy: fit ? gy : scr.y + scr.h / 2, s: fit ? gS : Math.min(scr.h * 0.22, gS * 2)}),
      fit ? textAt(fit, tx, ty, '#1f2328', {name: `${P}-d-${st}-text`}) : null,
      strikes));
  }
  // (datum overlay) the dock under the unit where the old value rests, struck, after the substitution
  let dock = null;
  if (o.datum && o.datum.dock && dispPos[o.datum.state].fit) {
    const D0 = o.datum.dock;
    const fit = dispPos[o.datum.state].fit;
    dock = {...D0, dx: D0.x + D0.padX + D0.wasW + D0.gap + gS * 1.25 - dispPos[o.datum.state].gx, dy: D0.y + D0.padY - dispPos[o.datum.state].ty};
    unitParts.push(g({name: `${P}-dock`, opacity: 0},
      h('path', {d: roundRectPath(D0.x, D0.y, D0.w, D0.h, Math.min(D0.h / 2, fit.size * 0.7)), fill: '#f3f4f5', stroke: '#57606a', 'stroke-width': r(2.2 * (fit.size / D0.fs), 2)})));
    unitParts.push(g({name: `${P}-was`, opacity: 0}, textAt(D0.wasFit, D0.x + D0.padX, D0.y + D0.padY, '#57606a', {italic: true})));
  }
  unitParts.push(dispNodes);
  parts.push(wrapLift('unit', unitParts));
  // exhibits on the cabinet
  if (G.cab && keep(G.cab)) {
    parts.push(wrapLift('cab', [lowCabinet(ctx, {name: `${P}-cabinet`, ...G.cab}), ...G.exhibits.map((e, i) => exhibitBox(ctx, {name: `${P}-exhibit${i}`, cx: e.cx, cy: e.cy, s: 52, deg: e.deg}))]));
  }
  // table, tray, statement sheets
  const tb = {x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2};
  if (keep(tb)) {
    parts.push(ovalTable(ctx, {name: `${P}-table`, cx: G.C.x, cy: G.C.y, a: G.A, b: G.B}));
    const trayNode = cardTray(ctx, {name: `${P}-tray`, cx: G.C.x, cy: G.C.y});
    if (!o.lift) parts.push(trayNode);
    else liftTray = wrapLift('tray', trayNode);
    G.sheets.forEach((s, i) => { if (s) parts.push(paperSheet(ctx, {name: `${P}-sheet${i}`, cx: s.x, cy: s.y, deg: s.deg + 8})); });
  }
  // chairs
  const people = o.people !== false;
  G.seats.forEach((s, i) => { if (people && keep(seatBox(s))) parts.push(planChair(ctx, {name: `${P}-chair${i}`, cx: toWorld(s, {x: 0, y: 14}).x, cy: toWorld(s, {x: 0, y: 14}).y, deg: s.deg, s: 64})); });
  // (lifted) the tray is drawn above the room (it leaves the table), then the cards, then people
  if (liftTray) parts.push(liftTray);
  // cards (above the table, under the arms), then people
  const cards = G.seats.map((s, i) => nameCard(ctx, {name: `${P}-card${i}`}));
  if (keep(tb)) parts.push(cards.map(cd => cd.node));
  const rigs = G.seats.map((s, i) => (people && keep(seatBox(s)) ? planPerson(ctx, {name: `${P}-p${i}`, look: o.R.speakers[i].look}) : null));
  parts.push(rigs.filter(Boolean).map(rg => rg.node));

  /**
   * @param {{lights:number, switchK:number, started:number, text?:{started:number,pending:number}, pulse?:number|null, pulseOp?:number,
   *   clockDeg:number, cards:Array<{x:number,y:number,deg:number,stand:number,opacity:number}>,
   *   people:Array<{seated:number, reach?:{target:{x:number,y:number}, k:number}|null}>}} st
   */
  function frame(st) {
    const nodes = {};
    lamps.forEach((l, i) => { const rec = l.frame(st.lights); if (!lampOn[i]) delete rec[`${P}-lamp${i}-on`]; Object.assign(nodes, rec); });
    nodes[`${P}-dim`] = {opacity: r(0.16 * (1 - clamp(st.lights)), 3)};
    Object.assign(nodes, sw.frame(st.switchK), disp.frame(st.started), door.frame(0));
    // (optional) explicit frame opacities, e.g. a neutral display with neither frame before any state is shown
    if (st.frames) {
      nodes[`${P}-display-solid`] = {opacity: r(clamp(st.frames.solid), 3)};
      nodes[`${P}-display-dashed`] = {opacity: r(clamp(st.frames.dashed), 3)};
    }
    if (keep(clock.box)) Object.assign(nodes, clock.frame(st.clockDeg));
    if (o.lift) for (const key of ['clock', 'unit', 'cab', 'tray']) {
      const q = (st.lift && st.lift[key]) || {x: 0, y: 0};
      if (key === 'clock' && !keep(clock.box)) continue;
      if (key === 'cab' && !(G.cab && keep(G.cab))) continue;
      if (key === 'tray' && !liftTray) continue;
      nodes[`${P}-lift-${key}`] = {transform: `translate(${r(q.x)} ${r(q.y)})`};
    }
    const tx = st.text || {started: st.started, pending: 1 - st.started};
    nodes[`${P}-d-started`] = {opacity: r(clamp(tx.started), 3), transform: 'translate(0 0)'};
    nodes[`${P}-d-pending`] = {opacity: r(clamp(tx.pending), 3), transform: 'translate(0 0)'};
    if (o.datum && dispPos[o.datum.state].fit) {
      const dm = st.datum || {strike: 0, move: 0, chip: 0, was: 0};
      const fit = dispPos[o.datum.state].fit;
      const {tx: x0} = dispPos[o.datum.state];
      fit.lines.forEach((ln, i) => { nodes[`${P}-strike${i}`] = {x2: r(x0 - 3 + (measure(ln, fit.size, fit.weight, 'sans') + 6) * clamp(dm.strike)), opacity: dm.strike > 0 ? 1 : 0}; });
      if (dock) {
        nodes[`${P}-d-${o.datum.state}`].transform = `translate(${r(dock.dx * clamp(dm.move))} ${r(dock.dy * clamp(dm.move))})`;
        nodes[`${P}-slip`] = {opacity: r(clamp(dm.move * 12) * (1 - clamp((dm.move - 0.8) / 0.2)), 3)};
        nodes[`${P}-dock`] = {opacity: r(clamp(dm.chip), 3)};
        nodes[`${P}-was`] = {opacity: r(clamp(dm.was), 3)};
      }
    }
    power.forEach(pw => Object.assign(nodes, pw.frame(st.pulse ?? 0, st.pulse === null || st.pulse === undefined ? 0 : (st.pulseOp ?? 1))));
    if (keep(tb)) cards.forEach((cd, i) => Object.assign(nodes, cd.frame(st.cards[i])));
    let reached = true;
    const hands = [];
    rigs.forEach((rg, i) => {
      if (!rg) return;
      const s = G.seats[i];
      const pose = {x: s.x, y: s.y, deg: s.deg, seated: st.people[i].seated};
      Object.assign(nodes, rg.pose(pose));
      const rc = st.people[i].reach;
      if (rc) {
        const rr = reachRecords({name: `${P}-p${i}`}, pose, rc.target, {k: rc.k});
        Object.assign(nodes, rr.nodes);
        if (!rr.reached && rc.k > 0) reached = false;
        hands.push(rr.hand);
      } else {
        const rr = reachRecords({name: `${P}-p${i}`}, pose, pose, {k: 0});
        hands.push(rr.hand);
      }
    });
    return {nodes, reached, hands};
  }
  return {node: g({name: `${P}-room`}, parts), frame, rigs, cards, disp, sw, clock, lamps, power, dispPos, dock};
}

/** Box of a seated person (template units). */
export const seatBox = s => ({x: s.x - PERSON.half - 8, y: s.y - PERSON.half - 8, w: PERSON.half * 2 + 16, h: PERSON.half * 2 + 16});

/* ------------------------------------------------------------------ */
/* Display text                                                        */
/* ------------------------------------------------------------------ */

/**
 * Fit the two supplied display texts at the SAME design size F (equal weight)
 * and size the display to hold either. Returns template-unit fits and size.
 */
export function displayFits(P, F, k, {maxW = 520, maxLines = 3} = {}) {
  const Ft = F / k;
  const gS = Ft * 0.36;
  const pad = 16 + gS * 2.5 + 12 + 30;
  const texts = [P.session.started, P.session.pending];
  const need = Math.max(...texts.map(tx => widestWord(tx, Ft, 700)));
  let best = null;
  for (let w = Math.max(need, 120); w <= maxW + 0.1; w += 20) {
    const fits = texts.map(tx => fitG(tx, {maxWidth: w, size: Ft, minSize: Ft, maxLines, weight: 700}));
    if (fits.some(f => f.truncated)) continue;
    best = {fits, w};
    // prefer the narrowest display that keeps each text on at most two lines
    if (fits.every(f => f.lines.length <= 2)) break;
  }
  if (!best) {
    const fits = texts.map(tx => fitG(tx, {maxWidth: maxW, size: Ft, minSize: Ft, maxLines: 4, weight: 700}));
    best = {fits, w: maxW};
  }
  const tw = Math.max(...best.fits.map(f => f.width));
  const th = Math.max(...best.fits.map(f => f.height));
  return {started: best.fits[0], pending: best.fits[1], dispW: tw + pad, dispH: Math.max(th + 7 * 2 + 30, 84), gS, truncated: best.fits.some(f => f.truncated)};
}

/* ------------------------------------------------------------------ */
/* Label chips and their placement (design units)                      */
/* ------------------------------------------------------------------ */

/**
 * Participant chip content: an order disc (the configured sequence), the
 * label (bold) and, under it, each statement of this participant (regular).
 */
export function measureSpeakerChip(sp, rank, F, maxW, {seqDisc = true, maxLines = 3} = {}) {
  const disc = seqDisc ? F * 0.72 : 0;
  const discW = seqDisc ? disc * 2 + F * 0.45 : 0;
  const padX = F * 0.55, padY = F * 0.36;
  const inner = maxW - padX * 2 - discW;
  const label = fitG(sp.label, {maxWidth: inner, size: F, minSize: F, maxLines, weight: 700});
  const sts = sp.statements.map(tx => fitG(tx, {maxWidth: inner, size: F, minSize: F, maxLines, weight: 500}));
  const gap = F * 0.42;
  const textW = Math.max(label.width, ...sts.map(s => s.width));
  const textH = label.height + sts.reduce((a, s) => a + gap + s.height, 0);
  const w = textW + padX * 2 + discW;
  const hh = Math.max(textH, seqDisc ? disc * 2 : 0) + padY * 2;
  return {label, sts, w, h: hh, padX, padY, disc, discW, gap, rank, truncated: label.truncated || sts.some(s => s.truncated)};
}

/** Chip node (group `${name}`, body `${name}-body`, text group `${name}-text`, leader `${name}-lead`). */
export function speakerChipNode(ctx, m, box, lead, {name, color}) {
  const th = ctx.theme;
  const col = color ?? th.ink;
  const x0 = box.x + m.padX;
  const nodes = [];
  if (m.disc) {
    const cx = x0 + m.disc, cy = box.y + m.padY + Math.min(m.label.size * 0.55, m.disc);
    nodes.push(h('circle', {cx: r(cx), cy: r(cy + m.disc * 0.2), r: r(m.disc), fill: th.accent2, stroke: 'none'}));
    const f = {lines: [String(m.rank + 1)], size: m.label.size, lineHeight: m.label.size, weight: 700};
    nodes.push(h('text', {x: r(cx), y: r(cy + m.disc * 0.2 + m.label.size * 0.35), 'font-family': FONT, 'font-size': r(f.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, f.lines[0]));
  }
  const tx = x0 + m.discW;
  let y = box.y + m.padY;
  nodes.push(textAt(m.label, tx, y, th.ink));
  y += m.label.height;
  for (const s of m.sts) {
    y += m.gap;
    nodes.push(textAt(s, tx, y, th.inkSoft, {italic: true}));
    y += s.height;
  }
  return g({name, opacity: 0},
    lead ? h('line', {name: `${name}-lead`, x1: r(lead.from.x), y1: r(lead.from.y), x2: r(lead.to.x), y2: r(lead.to.y), stroke: col, 'stroke-width': 2.5, 'stroke-linecap': 'round'}) : null,
    lead ? h('circle', {cx: r(lead.to.x), cy: r(lead.to.y), r: 4.5, fill: col}) : null,
    h('path', {name: `${name}-body`, d: roundRectPath(box.x, box.y, box.w, box.h, Math.min(box.h / 2, m.label.size * 0.7)), fill: th.card, stroke: col, 'stroke-width': 2.2}),
    g({name: `${name}-text`}, nodes));
}

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
export const insideBox = (a, b, pad = 0) => a.x >= b.x + pad && a.y >= b.y + pad && a.x + a.w <= b.x + b.w - pad && a.y + a.h <= b.y + b.h - pad;
export const boxDist = (b, p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h)));

/** Does box b (design) touch the table ellipse (design centre c, radii a, bb) grown by pad? */
export function boxHitsEllipse(b, c, a, bb, pad = 0) {
  const A = a + pad, B = bb + pad;
  // nearest point of the box to the ellipse centre, then test a few edge samples
  const nx = clamp(c.x, b.x, b.x + b.w), ny = clamp(c.y, b.y, b.y + b.h);
  if (((nx - c.x) / A) ** 2 + ((ny - c.y) / B) ** 2 <= 1) return true;
  for (let i = 0; i <= 8; i++) {
    const f = i / 8;
    for (const q of [{x: b.x + b.w * f, y: b.y}, {x: b.x + b.w * f, y: b.y + b.h}, {x: b.x, y: b.y + b.h * f}, {x: b.x + b.w, y: b.y + b.h * f}]) {
      if (((q.x - c.x) / A) ** 2 + ((q.y - c.y) / B) ** 2 <= 1) return true;
    }
  }
  return false;
}

/**
 * Place labelled boxes near their anchors (design units). Each item:
 * {key, w, h, at:{x,y}, rad (anchor clearance), prefer: angle (deg, screen) or null}.
 * A candidate is rejected if it leaves `bounds`, touches any `circles` (people:
 * {x,y,rad}) or `boxes` (equipment, other placed chips), touches the table
 * ellipse, is further than maxGap from its anchor, or is nearer another
 * anchor (owner rule). Cheapest = nearest to the anchor, closest to `prefer`.
 */
export function placeLabels(items, o) {
  const placed = [...(o.placed || [])];
  const out = [];
  const fails = [];
  const anchors = o.anchors || items.map(it => it.at);
  for (const it of items) {
    let best = null;
    const R = it.rad;
    const variants = it.variants || [{w: it.w, h: it.h, m: it.m}];
    for (const gap of it.gaps || o.gaps || [10, 18, 28, 40, 56]) {
      variants.forEach((v, vi) => {
        for (let a = 0; a < 360; a += 10) {
          const th = (a * Math.PI) / 180;
          const dx = Math.cos(th), dy = Math.sin(th);
          // box whose nearest edge is at R + gap from the anchor along the direction
          const ext = Math.abs(dx) * v.w / 2 + Math.abs(dy) * v.h / 2;
          const d = R + gap + ext;
          for (const slide of [0, -0.3, 0.3]) {
            const cx = it.at.x + dx * d - dy * slide * v.w * 0.5 * Math.abs(dy), cy = it.at.y + dy * d + dx * slide * v.h * 0.5 * Math.abs(dx);
            const box = {x: cx - v.w / 2, y: cy - v.h / 2, w: v.w, h: v.h};
            if (!insideBox(box, o.bounds)) continue;
            const gp = boxDist(box, it.at) - R;
            if (gp < 4 || gp > (it.maxGap ?? o.maxGap ?? 72)) continue;
            if ((o.circles || []).some(q => boxDist(box, q) < q.rad + 5)) continue;
            if ((o.boxes || []).some(q => overlaps(box, q, 6)) || (it.boxes || []).some(q => overlaps(box, q, 6))) continue;
            if (placed.some(q => overlaps(box, q, 10))) continue;
            if (o.ellipse && boxHitsEllipse(box, o.ellipse.c, o.ellipse.a, o.ellipse.b, 6)) continue;
            const own = boxDist(box, it.at);
            if ((it.owners || anchors).some(q => Math.hypot(q.x - it.at.x, q.y - it.at.y) > 1 && boxDist(box, q) <= own + 8)) continue;
            let cost = gp + vi * 14;
            if (it.prefer !== null && it.prefer !== undefined) {
              const dd = Math.abs(((a - it.prefer + 540) % 360) - 180);
              cost += dd * 0.35;
            }
            cost += Math.abs(slide) * 6;
            if (!best || cost < best.cost) best = {box, cost, gap: gp, v};
          }
        }
      });
      if (best) break;
    }
    if (!best) {
      fails.push(it.key);
      const v = variants[0];
      best = {box: {x: it.at.x + R + 10, y: it.at.y - v.h / 2, w: v.w, h: v.h}, gap: 10, none: true, v};
    }
    placed.push(best.box);
    const b = best.box;
    const near = {x: clamp(it.at.x, b.x, b.x + b.w), y: clamp(it.at.y, b.y, b.y + b.h)};
    const dx = near.x - it.at.x, dy = near.y - it.at.y;
    const L = Math.hypot(dx, dy) || 1;
    const rim = {x: it.at.x + (dx / L) * (it.rim ?? R - 6), y: it.at.y + (dy / L) * (it.rim ?? R - 6)};
    out.push({key: it.key, box: b, lead: {from: near, to: rim}, gap: best.gap, none: Boolean(best.none), m: best.v.m});
  }
  return {labels: out, fails};
}

/* ------------------------------------------------------------------ */
/* Card choreography                                                   */
/* ------------------------------------------------------------------ */

/**
 * State of card i and its participant's hand at local progress q ∈ [0, 1]
 * of that participant's hand-over window:
 *   0.00–0.40  the card slides out of the tray to the hand-over point (flat);
 *   0.22–0.40  the participant's hand reaches out and meets it there;
 *   0.40–0.70  the hand carries the card to its resting spot in front of them;
 *   0.70–0.82  the card is set upright (flat → tent card);
 *   0.74–1.00  the hand returns to the table.
 * Returns {card:{x,y,deg,stand,opacity}, reach:{target,k}|null, state}.
 */
export function cardAt(G, i, q, reduced = false) {
  const cd = G.cards[i];
  const slide = ease.inOutCubic(clamp(q / 0.4));
  const carry = ease.inOutCubic(clamp((q - 0.4) / 0.3));
  const stand = ease.inOutCubic(clamp((q - 0.7) / 0.12));
  const reachIn = ease.inOutCubic(clamp((q - 0.22) / 0.18));
  const reachOut = ease.inOutCubic(clamp((q - 0.76) / 0.24));
  let pos;
  if (q < 0.4) pos = {x: lerp(cd.tray.x, cd.handoff.x, slide), y: lerp(cd.tray.y, cd.handoff.y, slide)};
  else pos = {x: lerp(cd.handoff.x, cd.rest.x, carry), y: lerp(cd.handoff.y, cd.rest.y, carry)};
  // the card turns from the tray's orientation to face its holder while it slides
  const deg = lerp(0, cd.deg, slide);
  const held = q >= 0.4 && q < 0.76;
  const k = q < 0.4 ? reachIn : q < 0.76 ? 1 : 1 - reachOut;
  // while held, the hand grips the card's near edge (the hand follows the SOLVED card position)
  const grip = toWorld({x: pos.x, y: pos.y, deg: cd.deg}, {x: 14, y: 10});
  const target = q < 0.4 ? toWorld({x: cd.handoff.x, y: cd.handoff.y, deg: cd.deg}, {x: 14, y: 10}) : held ? grip : toWorld({x: cd.rest.x, y: cd.rest.y, deg: cd.deg}, {x: 14, y: 10});
  const state = q <= 0 ? 'in-tray' : q < 0.4 ? 'sliding' : held ? 'held' : q < 1 ? 'placed' : 'placed';
  return {card: {x: pos.x, y: pos.y, deg, stand, opacity: 1}, reach: k > 0 ? {target, k} : null, state, held};
}

/* ------------------------------------------------------------------ */
/* Text panel (legend / notes / state / key), design units              */
/* ------------------------------------------------------------------ */

/**
 * Small glyphs for legend rows (design units, origin at the glyph centre, size s).
 * @param {any} ctx
 * @param {string} kind
 * @param {number} s
 * @param {any} [look]
 */
export function legendGlyph(ctx, kind, s, look) {
  const c = hearingColors(ctx);
  const th = ctx.theme;
  if (kind === 'started' || kind === 'pending') return stateGlyph(ctx, {kind: kind === 'started' ? 'dot' : 'diamond', cx: 0, cy: 0, s: s * 0.26, fill: th.dark ? th.fg : '#1f2328'});
  if (kind === 'person') {
    const pp = planPerson(ctx, {name: 'lg-person', look});
    return g(null, applyStatic(pp.node, pp.pose({x: 0, y: 0, deg: 0, scale: s / 100, seated: 1})));
  }
  if (kind === 'lamp') {
    return g(null,
      h('circle', {cx: 0, cy: r(s * 0.1), r: r(s * 0.45), fill: c.glow, opacity: 0.9}),
      h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.2)}A${r(s * 0.3)} ${r(s * 0.3)} 0 0 0 ${r(s * 0.3)} ${r(-s * 0.2)}Z`, fill: c.lampOn, stroke: '#1f2328', 'stroke-width': 2}),
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.3), width: r(s * 0.84), height: r(s * 0.1), fill: c.wall}));
  }
  if (kind === 'card') {
    return g(null,
      h('rect', {x: r(-s * 0.45), y: r(-s * 0.22), width: r(s * 0.9), height: r(s * 0.44), rx: 3, fill: c.card, stroke: '#1f2328', 'stroke-width': 1.8}),
      h('rect', {x: r(-s * 0.38), y: r(-s * 0.15), width: r(s * 0.76), height: r(s * 0.1), rx: 1.5, fill: c.cardEdge}));
  }
  if (kind === 'clock') {
    const ticks = [];
    for (let i = 0; i < 12; i += 3) { const a = (i / 12) * Math.PI * 2; ticks.push(`M${r(Math.sin(a) * s * 0.26)} ${r(-Math.cos(a) * s * 0.26)}L${r(Math.sin(a) * s * 0.36)} ${r(-Math.cos(a) * s * 0.36)}`); }
    return g(null,
      h('circle', {r: r(s * 0.42), fill: '#ffffff', stroke: '#1f2328', 'stroke-width': 2.4}),
      h('path', {d: ticks.join(''), stroke: '#1f2328', 'stroke-width': 2}),
      h('path', {d: `M0 0V${r(-s * 0.28)}M0 0L${r(s * 0.16)} ${r(-s * 0.1)}`, stroke: '#1f2328', 'stroke-width': 2.6, 'stroke-linecap': 'round'}));
  }
  if (kind === 'exhibit') {
    return g(null,
      h('rect', {x: r(-s * 0.4), y: r(-s * 0.3), width: r(s * 0.8), height: r(s * 0.6), rx: 3, fill: c.box, stroke: '#1f2328', 'stroke-width': 2}),
      h('path', {d: `M${r(-s * 0.36)} ${r(-s * 0.07)}H${r(s * 0.36)}`, stroke: c.boxDark, 'stroke-width': 2.4}));
  }
  if (kind === 'statement') {
    return g(null,
      h('rect', {x: r(-s * 0.28), y: r(-s * 0.38), width: r(s * 0.56), height: r(s * 0.76), rx: 2, fill: c.paper, stroke: '#1f2328', 'stroke-width': 1.8}),
      h('path', {d: `M${r(-s * 0.18)} ${r(-s * 0.18)}H${r(s * 0.18)}M${r(-s * 0.18)} 0H${r(s * 0.18)}M${r(-s * 0.18)} ${r(s * 0.18)}H${r(s * 0.08)}`, stroke: c.paperLine, 'stroke-width': 2}));
  }
  if (kind === 'switch') {
    return g(null,
      h('rect', {x: r(-s * 0.45), y: r(-s * 0.2), width: r(s * 0.9), height: r(s * 0.4), rx: 6, fill: '#eef0f2', stroke: '#1f2328', 'stroke-width': 2}),
      h('circle', {cx: r(s * 0.18), cy: 0, r: r(s * 0.12), fill: c.screenEdge}));
  }
  if (kind === 'seq') {
    return h('circle', {r: r(s * 0.3), fill: th.accent2});
  }
  if (kind === 'delta') return changedMarker(ctx, {radius: s * 0.3});
  if (kind === 'same') return h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.12)}H${r(s * 0.3)}M${r(-s * 0.3)} ${r(s * 0.12)}H${r(s * 0.3)}`, stroke: th.dark ? th.fg : '#1f2328', 'stroke-width': 3.5, 'stroke-linecap': 'round'});
  if (kind === 'guide') return h('path', {d: `M${r(-s * 0.42)} ${r(s * 0.2)}V${r(-s * 0.2)}H${r(s * 0.42)}V${r(s * 0.2)}`, fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  if (kind === 'laneA' || kind === 'laneB') return h('circle', {r: r(s * 0.34), fill: kind === 'laneA' ? th.accent2 : th.accent4});
  if (kind === 'tray') {
    return g(null,
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.28), width: r(s * 0.84), height: r(s * 0.56), rx: 5, fill: c.tray, stroke: '#1f2328', 'stroke-width': 2}),
      h('rect', {x: r(-s * 0.28), y: r(-s * 0.12), width: r(s * 0.56), height: r(s * 0.24), rx: 2, fill: c.card, stroke: '#1f2328', 'stroke-width': 1.4}));
  }
  return null;
}

/**
 * Measure a panel row at size F and column width w. Row kinds:
 *  {kind:'heading', text}            bold chip
 *  {kind:'legend', glyph, text, seqNumber?}  glyph + text
 *  {kind:'note', color, text}        coloured ring + text (keyed to a ring in the scene)
 *  {kind:'state', text}              neutral chip (the supplied final state)
 *  {kind:'text', text, bold?}        plain text
 *  {kind:'key', text}                thin rule + italic key
 */
export function measureRow(row, F, w) {
  const glyph = F * 1.9;
  if (row.kind === 'heading' || row.kind === 'state') {
    const padX = F * 0.6, padY = F * 0.36;
    const fit = fitG(row.text, {maxWidth: w - padX * 2, size: F, minSize: F, maxLines: 4, weight: 700});
    return {...row, fit, h: fit.height + padY * 2, w: fit.width + padX * 2, padX, padY};
  }
  if (row.kind === 'legend' || row.kind === 'note') {
    const fit = fitG(row.text, {maxWidth: w - glyph - F * 0.6, size: F, minSize: F, maxLines: 5, weight: 500});
    return {...row, fit, glyph, h: Math.max(glyph * 0.9, fit.height), w: glyph + F * 0.6 + fit.width};
  }
  if (row.kind === 'key') {
    const fit = fitG(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 4, weight: 500});
    return {...row, fit, h: fit.height + F * 0.5, w: fit.width};
  }
  const fit = fitG(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: row.bold ? 700 : 500});
  return {...row, fit, h: fit.height, w: fit.width};
}

/**
 * Lay measured rows into `cols` balanced columns inside a box; returns row
 * positions and whether they fit ({ok, rows:[{...m, x, y, colW}], usedH}).
 */
export function layoutRows(ms, box, F, cols, colGap) {
  const gap = F * 0.62;
  const colW = (box.w - colGap * (cols - 1)) / cols;
  // greedy balanced split keeping order
  const total = ms.reduce((a, m) => a + m.h + gap, 0);
  const target = total / cols;
  const out = [];
  let col = 0, y = 0, used = 0;
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i];
    if (col < cols - 1 && y > 0 && y + m.h / 2 > target) { col++; used = Math.max(used, y); y = 0; }
    out.push({...m, x: box.x + col * (colW + colGap), y: box.y + y, colW, col});
    y += m.h + gap;
  }
  used = Math.max(used, y - gap) + F * 0.3;
  return {ok: used <= box.h + 0.5 && ms.every(m => !m.fit.truncated), rows: out, usedH: used};
}

/** Draw one laid-out panel row. */
export function rowNode(ctx, m, {name, look} = {}) {
  const th = ctx.theme;
  if (m.kind === 'heading' || m.kind === 'state') {
    return g({name},
      h('path', {d: roundRectPath(m.x, m.y, m.w, m.h, Math.min(m.h / 2, m.fit.size * 0.7)), fill: th.card, stroke: m.kind === 'state' ? th.inkSoft : th.ink, 'stroke-width': 2.2}),
      textAt(m.fit, m.x + m.padX, m.y + m.padY, th.ink));
  }
  if (m.kind === 'legend' || m.kind === 'note') {
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const glyph = m.kind === 'note'
      ? h('circle', {cx: r(m.x + m.glyph / 2), cy: r(gy), r: r(m.glyph * 0.3), fill: 'none', stroke: m.color, 'stroke-width': 4.5})
      : g({transform: T(m.x + m.glyph / 2, gy)}, legendGlyph(ctx, m.glyph0 ?? m.glyphKind, m.glyph, look),
        m.seqNumber ? h('text', {x: 0, y: r(m.fit.size * 0.35), 'font-family': FONT, 'font-size': r(m.fit.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: m.numberFill ?? '#ffffff'}, m.seqNumber) : null);
    return g({name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  if (m.kind === 'key') {
    return g({name},
      h('path', {d: `M${r(m.x)} ${r(m.y)}H${r(m.x + Math.min(m.colW, m.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
      textAt(m.fit, m.x, m.y + m.fit.size * 0.5, th.fgSoft, {italic: true}));
  }
  return g({name}, textAt(m.fit, m.x, m.y, th.fg));
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

/** Serialize a point. */
export const R2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);

/** Map a template point with an offset/scale. */
export const mapper = (ox, oy, k) => q => ({x: ox + q.x * k, y: oy + q.y * k});
export const mapBox = (ox, oy, k) => b => ({x: ox + b.x * k, y: oy + b.y * k, w: b.w * k, h: b.h * k});

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its participant and exhibit */
/* chips placed on the free floor (design units)                        */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P  localised params
 * @param {any} R  resolveApertura()
 * @param {{x:number,y:number,w:number,h:number}} box  room box (design units)
 * @param {number} F  label text size (design units)
 * @param {{chips?:boolean, exhibitChips?:boolean, dispText?:boolean, chipMaxW?:number, align?:{x:number,y:number}, seqDisc?:boolean, waiting?:number, minK?:number}} o
 */
export function composeRoom(ctx, P, R, box, F, o = {}) {
  let best = null;
  for (const cabSpot of R.exhibits.length ? ['left', 'bottom', 'right'] : ['left']) {
    const c = composeRoom1(ctx, P, R, box, F, {...o, cabSpot});
    if (!best || c.problems.length < best.problems.length) best = c;
    if (!c.problems.length) break;
  }
  return best;
}

function composeRoom1(ctx, P, R, box, F, o = {}) {
  const n = R.n;
  const sc = o.scale ?? 1;
  const ms0 = o.minScale ?? 1;
  const fr0 = fitRoom(box, n, {min: {W: ROOM_MIN[n].W * sc * ms0, H: ROOM_MIN[n].H * sc * ms0}, maxW: 1700 * sc, maxH: 1500 * sc});
  // the display text is fitted at the design size F (template size F / k); refit once k is known
  let fr = fr0, dt = null, G = null;
  for (let it = 0; it < 2; it++) {
    dt = displayFits(P, F, fr.k, {maxW: Math.min(560, fr.W * (o.dispMaxFrac ?? 0.46))});
    // labels hidden: the display carries no text, only its cue (a compact screen)
    if (!ctx.show('key')) dt = {...dt, dispW: 200, dispH: 84};
    G = roomGeometry(fr.W, fr.H, n, {dispW: dt.dispW, dispH: dt.dispH, exhibits: R.exhibits.length, statements: R.speakers.map(s => s.statements), cabSpot: o.cabSpot, bare: o.chips === false && o.exhibitChips === false, bigTable: !ctx.show('key') && o.chips === false && o.exhibitChips === false, dock: o.dockLikeDisplay ? dt.dispH + 16 : o.dockD ? o.dockD / fr.k : 0, compact: o.compact});
  }
  const {W, H, k} = fr;
  const E = G.extents;
  const al = o.align || {x: 0.5, y: 0.5};
  const ox = box.x + (box.w - E.w * k) * al.x - E.x * k;
  const oy = box.y + (box.h - E.h * k) * al.y - E.y * k;
  const toD = mapper(ox, oy, k);
  const bD = mapBox(ox, oy, k);
  const problems = [];
  if (dt.truncated) problems.push('display-text');
  if (G.sheets.some(q => q && !q.clear)) problems.push('sheet-reach');
  if (!G.fits) problems.push('seat-outside');
  // equipment wall must not collide with itself
  if (G.clock.cx - G.clock.R < 30 || G.unit.x + G.unit.w > W - 30) problems.push('equipment-wall');
  const rad = PERSON.half * k;
  const people = G.seats.map(s => ({...toD(s), rad: rad + 4}));
  const bounds = {x: ox + 10 * k, y: oy + 10 * k, w: (W - 20) * k, h: (H - 20) * k};
  const equip = [...roomObstacles(G), ...(o.reserve ? o.reserve(G, k) : [])].map(bD);
  const ellipse = {c: toD(G.C), a: G.A * k, b: G.B * k};
  const chips = [];
  const exChips = [];
  const placed = [];
  const chipMaxW = o.chipMaxW ?? 340;
  // participant chips and exhibit tags, placed greedily; both orders are tried (participants first, then tags; tags
  // first, then participants) and the one with fewer failures is kept
  const spItems = [];
  const exItems = [];
  if (o.chips !== false) {
    const widths = [chipMaxW, chipMaxW * 0.8, chipMaxW * 0.64, chipMaxW * 0.52, chipMaxW * 0.44];
    const vs = R.speakers.map(sp => widths.map(mw => measureSpeakerChip(sp, R.rank[sp.index], F, mw, {seqDisc: o.seqDisc !== false, maxLines: 4})).filter(m => !m.truncated));
    if (vs.some(v => !v.length)) problems.push('chip-truncated');
    const cabBoxes = G.cab ? [bD(G.cab), ...G.exhibits.map(e => bD({x: e.cx - 30, y: e.cy - 30, w: 60, h: 60}))] : [];
    const owners = G.seats.map(s => toD(s));
    for (const i of R.order) spItems.push({key: `sp${i}`, i, variants: (vs[i].length ? vs[i] : [measureSpeakerChip(R.speakers[i], R.rank[i], F, chipMaxW, {seqDisc: o.seqDisc !== false, maxLines: 6})]).map(m => ({w: m.w, h: m.h, m})), at: toD(G.seats[i]), rad, rim: rad * 0.84, prefer: G.seats[i].angle, owners, boxes: cabBoxes, maxGap: 56});
  }
  if (o.exhibitChips !== false && R.exhibits.length) {
    const vs = R.exhibits.map((tx, i) => [chipMaxW, chipMaxW * 0.75, chipMaxW * 0.55].map(mw => {
      const padX = F * 0.55, padY = F * 0.34;
      const fit = fitG(tx, {maxWidth: mw - padX * 2, size: F, minSize: F, maxLines: 4, weight: 600});
      return {i, fit, w: fit.width + padX * 2, h: fit.height + padY * 2, padX, padY};
    }).filter(m => !m.fit.truncated));
    if (vs.some(v => !v.length)) problems.push('exhibit-truncated');
    const owners = G.exhibits.map(e => toD({x: e.cx, y: e.cy}));
    vs.forEach((v, i) => exItems.push({key: `ex${i}`, ex: i, variants: v.map(m => ({w: m.w, h: m.h, m})), at: toD({x: G.exhibits[i].cx, y: G.exhibits[i].cy}), rad: 30 * k, rim: 22 * k, prefer: G.cabSpot === 'bottom' ? 270 : G.cabSpot === 'right' ? 180 : 0, owners, maxGap: 130, gaps: [12, 24, 40, 60, 80, 100, 125]}));
  }
  const orders = [[...spItems, ...exItems], [...exItems, ...spItems]];
  if (exItems.length > 1) orders.push([...spItems, ...[...exItems].reverse()]);
  let res = null;
  for (const ord of orders) {
    const r0 = placeLabels(ord, {bounds, circles: people, boxes: equip, ellipse, placed: []});
    const fails = r0.fails;
    if (!res || fails.length < res.fails.length) res = {ord, r0, fails};
    if (!fails.length) break;
  }
  if (res) {
    res.ord.forEach((it, j) => {
      const L = res.r0.labels[j];
      if (it.ex !== undefined) exChips[it.ex] = L; else chips[it.i] = L;
    });
    for (const f of res.fails) problems.push(`chip-${f}`);
  }
  return {F, k, W, H, G, E, ox, oy, toD, bD, dt, chips, exChips, problems, rad, box, people, equip, ellipse, bounds,
    planRect: {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k}};
}

/** Exhibit tag chip node (group `${name}`, body `${name}-body`, leader). */
export function exhibitChipNode(ctx, L, {name}) {
  const th = ctx.theme;
  const b = L.box, m = L.m;
  return g({name},
    h('line', {x1: r(L.lead.from.x), y1: r(L.lead.from.y), x2: r(L.lead.to.x), y2: r(L.lead.to.y), stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(L.lead.to.x), cy: r(L.lead.to.y), r: 4.5, fill: th.inkSoft}),
    h('path', {name: `${name}-body`, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2, m.fit.size * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.2}),
    textAt(m.fit, b.x + m.padX, b.y + m.padY, th.ink));
}

/* ------------------------------------------------------------------ */
/* Arrangement search: room + text panel (column beside, band below)    */
/* ------------------------------------------------------------------ */

/**
 * Try panel arrangements and text sizes; keep the composition with no
 * problems, the largest people and the largest text. The panel is sized to
 * its content (a band takes only the height its rows need; a column is
 * centred vertically), so no blank band is left in the frame.
 * @param {any} ctx
 * @param {any} P
 * @param {any} R
 * @param {Array<any>} rows  panel rows (measureRow kinds)
 * @param {{sizes:number[], minF:number, roomOpts?:any, gap?:number, colFracs?:number[], bandCols?:number[], targetPx?:number, minPersonPx?:number, compose?:(box:any,F:number)=>any}} o
 *   sizes/minF in px at 1080p
 */
export function searchLayout(ctx, P, R, rows, o) {
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const shape = ctx.view.shape;
  const gap = o.gap ?? 30;
  const colGap = 28;
  const compose = o.compose || ((box, F, scale) => composeRoom(ctx, P, R, box, F, {...(o.roomOpts || {}), scale}));
  const scales = o.scales || [1, 1.25, 1.55];
  const minPerson = o.minPersonPx ?? 64;
  const sizes = o.sizes.filter(v => v >= o.minF - 1e-6).sort((a, b) => b - a);
  const log = [];
  // arrangements: each maps a text size to the panel layout and the room box (or null when the panel does not fit)
  const arrangements = [];
  if (!rows.length) arrangements.push(() => ({lay: null, roomBox: {x: 0, y: 0, w: D.w, h: D.h}, panelBox: null, cols: 0}));
  else {
    if (shape !== 'portrait' && !(shape === 'square' && o.squareBand)) {
      for (const cf of o.colFracs || [0.25, 0.3, 0.35, 0.39]) {
        arrangements.push(F => {
          const pw = D.w * cf;
          const ms = rows.map(rw => measureRow(rw, F, pw));
          const probe = layoutRows(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, 1, colGap);
          if (!probe.ok || probe.usedH > D.h) return null;
          const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
          return {lay: layoutRows(ms, panelBox, F, 1, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols: 1};
        });
      }
    }
    if (shape !== 'landscape') {
      for (const cols of o.bandCols || [2, 3]) {
        arrangements.push(F => {
          const colW = (D.w - colGap * (cols - 1)) / cols;
          const ms = rows.map(rw => measureRow(rw, F, colW));
          const probe = layoutRows(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, cols, colGap);
          if (!probe.ok || probe.usedH > D.h * 0.5) return null;
          const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
          return {lay: layoutRows(ms, panelBox, F, cols, colGap), roomBox: {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap}, panelBox, cols};
        });
      }
    }
  }
  let best = null;
  const evalAt = (arr, i, scale) => {
    const Fpx = sizes[i];
    const F = Fpx / px;
    const a = arr(F);
    if (!a) return null;
    const C = compose(a.roomBox, F, scale);
    const personPx = 100 * C.k * px;
    const problems = [...C.problems];
    if (personPx < minPerson) problems.push('people-small');
    const score = -1000 * problems.length + (Fpx >= 19.5 - 1e-6 ? 500 : 0) + Math.min(personPx, 110) + 3 * Fpx;
    log.push(`${Fpx.toFixed(1)} ${a.cols}c s${scale} ${personPx.toFixed(0)} ${problems.join('+')}`);
    const cand = {score, F, C, lay: a.lay, roomBox: a.roomBox, panelBox: a.panelBox, cols: a.cols, problems, personPx, scale};
    if (!best || score > best.score) best = cand;
    return cand;
  };
  // per arrangement and room scale: the largest text size that composes without problems (validity is
  // monotonic enough in the size to bisect the list); the best scoring candidate overall wins
  outer: for (const arr of arrangements) {
    for (const scale of scales) {
      const last = evalAt(arr, sizes.length - 1, scale);
      if (!last || last.problems.length) continue;
      let lo = 0, hi = sizes.length - 1;
      const first = evalAt(arr, 0, scale);
      if (first && !first.problems.length) hi = 0;
      else {
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          const c = evalAt(arr, mid, scale);
          if (c && !c.problems.length) hi = mid; else lo = mid;
        }
      }
      if (hi === 0 && best && !best.problems.length && best.personPx >= (o.targetPx ?? 80) && sizes[0] >= 19.5) break outer;
      // the largest size already works at this scale: a larger room scale would only shrink the people
      if (hi === 0) break;
    }
  }
  if (!best) best = evalAt(arrangements[arrangements.length - 1] || (() => ({lay: null, roomBox: {x: 0, y: 0, w: D.w, h: D.h}, panelBox: null, cols: 0})), sizes.length - 1, scales[0]) || evalAt(() => ({lay: null, roomBox: {x: 0, y: 0, w: D.w, h: D.h}, panelBox: null, cols: 0}), sizes.length - 1, scales[0]);
  best.log = log;
  return best;
}

/**
 * Vertical centring of a composition (design units): the shift that centres the union of the given boxes in the
 * design space's height (the design space is itself centred in the frame's safe box), never pushing a box out of it.
 * @param {{w:number,h:number}} D
 * @param {Array<{x:number,y:number,w:number,h:number}|null|undefined>} boxes
 */
export function centreShiftY(D, boxes) {
  const bs = boxes.filter(b => b && Number.isFinite(b.y) && Number.isFinite(b.h));
  if (!bs.length) return 0;
  const y0 = Math.min(...bs.map(b => b.y)), y1 = Math.max(...bs.map(b => b.y + b.h));
  const dy = (D.h - y1 - y0) / 2;
  return Math.max(-y0, Math.min(D.h - y1, dy));
}
