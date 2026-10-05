/**
 * "Organización de turnos" kit (LAW-0221..0224): a generic, fictional hearing
 * room seen from above. Participants sit on the two long sides of one table;
 * each seat has a TURN LAMP on the table in front of it (lit = "active turn",
 * unlit = "pending turn": waiting only, never a penalty or a loss) and a
 * party badge on its chair back (● or ◆, solid glyphs of equal weight). The
 * TURN SIGNAL is a small physical token: the person who holds it pushes it
 * across the table, it glides to the next person in the supplied sequence,
 * who reaches out, catches it and draws it to their place; their lamp lights
 * after the token arrives (cause before effect).
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md): participants, parties and the
 * sequence are SUPPLIED and editable ("sequence as configured
 * (illustrative)"). Nothing here states a speaking order required by any
 * procedure, which side goes first, any time allowed per turn or any
 * consequence of a turn; "pending" only means waiting. Both parties have the
 * same visual weight (same badge size, stroke and colour; only the glyph
 * differs). The signal passes between people, never along institutional
 * routes.
 *
 * The kit owns fields, defaults, strings, the plan geometry (template units),
 * the hop solver (token path, hands, lamps), the plan art and the panel text
 * stacks. Each entry owns its own timeline, composition and semantics.
 * @module animations/courts/kits/organizacion-de-turnos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {chip} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {changedMarker} from '../../../primitives/markers.js';
import {planColors, floorArea, wallRing, planTable, planChair, planPlant, planPerson, PERSON} from './courts-art.js';
import {fitWords, glue, applyStatic, pxPerUnit, overlaps} from './distribucion-de-sala.js';

export {pxPerUnit, overlaps, glue};

const INK = '#1f2328';
const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

/** Seat positions: three along each long side of the table (in tall frames the table stands upright: top = left side, bottom = right side). */
export const SLOTS = ['top1', 'top2', 'top3', 'bottom1', 'bottom2', 'bottom3'];
export const PARTIES = ['circle', 'diamond'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a party or a turn)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: courts, routes, seats, labels). */
export const turnFields = {
  courts: obj('Generic, fictional building and hearing room (no real court, building shape or emblem)', {
    building: str('Name printed under the generic building (fictional)', 50),
    room: str('Name of the hearing room drawn as a plan (fictional)', 50),
  }, ['building', 'room']),
  seats: list('Participants at the table: a seat position, an editable label and a party badge (● or ◆, told apart only by the glyph). Positions, labels and parties are as supplied and carry no legal meaning', obj('Seat', {
    slot: oneOf('Position at the table: top1–top3 along one long side, bottom1–bottom3 along the other', SLOTS),
    label: str('Editable label of the participant (as supplied)', 50),
    party: oneOf('Party badge drawn on the chair back (● circle or ◆ diamond; equal weight)', PARTIES),
    appearance,
  }, ['slot', 'label', 'party']), 2, 6),
  routes: list('Sequence as configured (illustrative): the seat indices in the order the turn signal passes between them. It is supplied data, not a required speaking order', int('Seat index', 0, 5), 2, 6),
  labels: obj('Editable legend texts', {
    active: str('Legend of the lit lamp (active turn)', 40),
    pending: str('Legend of the unlit lamp (pending turn: waiting only)', 40),
    signal: str('Legend of the turn signal token', 40),
    sequence: str('Legend of the numbers on the lamps (the sequence as configured)', 60),
    circle: str('Legend of the ● party badge', 40),
    diamond: str('Legend of the ◆ party badge', 40),
    key: str('Key: states and sequence are as supplied; no conclusion is drawn', 90),
  }, ['active', 'pending', 'key']),
};

export const TURN_EN = {
  courts: {building: 'Civic building (fictional)', room: 'Hearing room 2 (fictional)'},
  seats: [
    {slot: 'top1', label: 'Participant A', party: 'circle'},
    {slot: 'bottom1', label: 'Participant B', party: 'diamond'},
    {slot: 'top2', label: 'Participant C', party: 'circle'},
    {slot: 'bottom2', label: 'Participant D', party: 'diamond'},
  ],
  routes: [1, 2, 3],
  labels: {
    active: 'Active turn', pending: 'Pending turn (waiting)', signal: 'Turn signal',
    sequence: 'Sequence as configured (illustrative)', circle: 'Party ● (fictional)', diamond: 'Party ◆ (fictional)',
    key: 'Turns and sequence as supplied · no conclusion drawn',
  },
};

export const TURN_ES = {
  courts: {building: 'Edificio cívico (ficticio)', room: 'Sala de audiencia 2 (ficticia)'},
  seats: [
    {slot: 'top1', label: 'Participante A', party: 'circle'},
    {slot: 'bottom1', label: 'Participante B', party: 'diamond'},
    {slot: 'top2', label: 'Participante C', party: 'circle'},
    {slot: 'bottom2', label: 'Participante D', party: 'diamond'},
  ],
  routes: [1, 2, 3],
  labels: {
    active: 'Turno activo', pending: 'Turno pendiente (en espera)', signal: 'Señal de turno',
    sequence: 'Secuencia según configuración (ilustrativa)', circle: 'Parte ● (ficticia)', diamond: 'Parte ◆ (ficticia)',
    key: 'Turnos y secuencia según lo aportado · sin conclusión',
  },
};

/**
 * Near-maximum lengths (long-labels-stress). Coordinator decision (standing stress rule, 2026-09-26, AUTHORING item
 * 20; reason corrected in courts-06 review 1): the count is capped to the baseline's four participants. Measured with
 * six near-maximum participants (three per side) in LAW-0221 at 1:1: every chip is placed beside its seat at 16.9 px,
 * but the people render at 58.3 px, under the 60 px floor. Texts stay near-maximum; counts equal the baseline.
 */
export const TURN_LONG = {
  courts: {building: 'Municipal civic services building east (fictional)', room: 'Multipurpose hearing room 2, ground floor (fict.)'},
  seats: [
    {slot: 'top1', label: 'Participant A for the first party (as supplied)', party: 'circle'},
    {slot: 'bottom1', label: 'Participant B for the second party (as supplied)', party: 'diamond'},
    {slot: 'top2', label: 'Participant C for the first party (as supplied)', party: 'circle'},
    {slot: 'bottom2', label: 'Participant D for the second party (as supplied)', party: 'diamond'},
  ],
  routes: [1, 2, 3, 0],
  labels: {
    active: 'Active turn: lamp lit (as supplied)', pending: 'Pending turn: waiting only (supplied)', signal: 'Turn signal passed by hand (supplied)',
    sequence: 'Numbers on the lamps: sequence as configured (illustrative)', circle: 'Party ● badge on the chair (fictional)', diamond: 'Party ◆ badge on the chair (fictional)',
    key: 'Turns, parties and the sequence are shown as supplied by the author · no conclusion drawn',
  },
};

export const TURN_STRINGS = {
  en: {
    holdActive: 'Active turn (as supplied): {name}', holdPending: 'Signal back in the tray: every turn pending (as supplied)',
    was: 'was', tray: 'Tray',
  },
  es: {
    holdActive: 'Turno activo (según lo aportado): {name}', holdPending: 'Señal de vuelta en la bandeja: todos los turnos pendientes (según lo aportado)',
    was: 'antes', tray: 'Bandeja',
  },
};

/* ------------------------------------------------------------------ */
/* Resolved params                                                     */
/* ------------------------------------------------------------------ */

/**
 * Valid seats (first use of a slot wins, with each participant's look) and the
 * valid sequence (known seat indices, no immediate repeats; at least two).
 * @returns {{seats: any[], seq: number[]}} seq holds indices into `seats`
 */
export function resolveTurns(ctx, p) {
  const seen = new Set();
  const seats = [];
  const byIndex = new Map();
  (p.seats || []).forEach((s, i) => {
    if (seen.has(s.slot)) return;
    seen.add(s.slot);
    const q = {...s, index: i, pos: seats.length, look: actorLook(ctx, s, seats.length)};
    byIndex.set(i, q.pos);
    seats.push(q);
  });
  const seq = [];
  for (const si of p.routes || []) {
    const pos = byIndex.get(si);
    if (pos === undefined || seq[seq.length - 1] === pos) continue;
    seq.push(pos);
  }
  if (seq.length < 2) {
    seq.length = 0;
    seats.slice(0, 2).forEach(s => seq.push(s.pos));
  }
  return {seats, seq};
}

/* ------------------------------------------------------------------ */
/* Plan geometry (template units)                                      */
/* ------------------------------------------------------------------ */

export const GEO = {S: 240, TA: 190, OFF: 48, END: 118, WALL: 18, BAND0: 64, REACH: 98, DOOR: 92};

/** Person local frame → world (template). deg clockwise; local forward = −y. */
export function toWorld(pose, lx, ly) {
  const a = (pose.deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return {x: pose.x + lx * c - ly * s, y: pose.y + lx * s + ly * c};
}
/** World → person local frame. */
export function toLocal(pose, q) {
  const a = (pose.deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  const dx = q.x - pose.x, dy = q.y - pose.y;
  return {x: dx * c + dy * s, y: -dx * s + dy * c};
}

/** Local spots of a seat (person frame). */
export const LOCAL = {rest: {x: 0, y: -64}, lamp: {x: -58, y: -86}, badge: {x: 0, y: 44}, shoulder: side => ({x: side * 34, y: -2}), desk: side => ({x: side * 24, y: -44})};

/**
 * Hearing-room plan. `cols` seats per long side (2–3), `axis` 'h' (table
 * across the frame) or 'v' (table upright), `band` the depth of the label band
 * outside each row (template units), `bandEnd` extra floor at both table ends.
 */
export function turnGeometry({cols = 2, axis = 'h', band = 60, bandEnd = 0, padAcross = 0, slots = SLOTS, S = GEO.S, end = GEO.END, ta = GEO.TA, wallGap = 26} = {}) {
  const {OFF, BAND0} = GEO;
  const TA = ta;
  const END = end;
  const along = cols * S + 40;
  const acrossHalf = TA / 2 + OFF + BAND0 + band + wallGap + padAcross;
  const Wc = along + 2 * (END + bandEnd);
  const Hc = 2 * acrossHalf;
  const W = axis === 'h' ? Wc : Hc, H = axis === 'h' ? Hc : Wc;
  const map = (u, v) => (axis === 'h' ? {x: W / 2 + u, y: H / 2 + v} : {x: W / 2 + v, y: H / 2 + u});
  const vec = (du, dv) => (axis === 'h' ? {x: du, y: dv} : {x: dv, y: du});
  const degOf = f => (f.y > 0.5 ? 180 : f.y < -0.5 ? 0 : f.x > 0.5 ? 90 : -90);
  const seats = {};
  for (const slot of slots) {
    const row = slot.startsWith('top') ? -1 : 1;
    const c = Number(slot.slice(-1)) - 1;
    if (c >= cols) continue;
    const u = -along / 2 + 20 + (c + 0.5) * S;
    const v = row * (TA / 2 + OFF);
    const face = vec(0, -row);
    const P = map(u, v);
    seats[slot] = {slot, row, col: c, x: P.x, y: P.y, deg: degOf(face), out: vec(0, row), along: vec(1, 0)};
  }
  const t0 = map(-along / 2, -TA / 2), t1 = map(along / 2, TA / 2);
  const table = {x: Math.min(t0.x, t1.x), y: Math.min(t0.y, t1.y), w: Math.abs(t1.x - t0.x), h: Math.abs(t1.y - t0.y)};
  const centre = map(0, 0);
  // the door: in the end wall at +u, centred on the table axis; plants in the four corners
  const dh = GEO.DOOR / 2;
  const door = axis === 'h' ? {side: 'right', a: H / 2 - dh, b: H / 2 + dh} : {side: 'bottom', a: W / 2 - dh, b: W / 2 + dh};
  const plants = [map(-Wc / 2 + 46, -Hc / 2 + 46), map(Wc / 2 - 46, -Hc / 2 + 46), map(-Wc / 2 + 46, Hc / 2 - 46), map(Wc / 2 - 46, Hc / 2 - 46)];
  // windows in the two walls along the rows (beyond the table ends, so no window sits behind a label)
  const winSpan = [-Wc / 2 + 30, -along / 2 - 20];
  const windows = [];
  if (winSpan[1] - winSpan[0] > 60) {
    for (const sgn of [-1, 1]) {
      const a0 = sgn < 0 ? winSpan[0] : -winSpan[1], a1 = sgn < 0 ? winSpan[1] : -winSpan[0];
      if (axis === 'h') { windows.push({side: 'top', a: W / 2 + a0, b: W / 2 + a1}, {side: 'bottom', a: W / 2 + a0, b: W / 2 + a1}); }
      else { windows.push({side: 'left', a: H / 2 + a0, b: H / 2 + a1}, {side: 'right', a: H / 2 + a0, b: H / 2 + a1}); }
    }
  }
  const tray = {x: centre.x, y: centre.y, w: axis === 'h' ? 96 : 64, h: axis === 'h' ? 64 : 96};
  return {W, H, axis, cols, band, bandEnd, padAcross, along, S, end, ta: TA, wallGap, table, centre, seats, door, plants, windows, tray, map, vec, t: GEO.WALL};
}

/** Pose (template) of a seated participant at a slot. */
export const seatPose = (G, slot) => ({x: G.seats[slot].x, y: G.seats[slot].y, deg: G.seats[slot].deg});
/** World spots of a seat. */
export const restAt = (G, slot) => toWorld(seatPose(G, slot), LOCAL.rest.x, LOCAL.rest.y);
export const lampAt = (G, slot) => toWorld(seatPose(G, slot), LOCAL.lamp.x, LOCAL.lamp.y);
export const badgeAt = (G, slot) => toWorld(seatPose(G, slot), LOCAL.badge.x, LOCAL.badge.y);

/* ------------------------------------------------------------------ */
/* Hops: the token path, the hands and the lamps                        */
/* ------------------------------------------------------------------ */

/** Token path from one rest spot to another (or to the tray): straight across, curved inward along a row. */
export function hopPath(G, fromSlot, toSlot) {
  const A = restAt(G, fromSlot);
  const B = toSlot === 'tray' ? {x: G.tray.x, y: G.tray.y} : restAt(G, toSlot);
  const sa = G.seats[fromSlot];
  const same = toSlot !== 'tray' && G.seats[toSlot].row === sa.row;
  const pts = [];
  const N = 28;
  if (same) {
    // along a row: bow inward (towards the table centre line) so it never runs over the lamps in between
    const inward = {x: -sa.out.x, y: -sa.out.y};
    const C = {x: (A.x + B.x) / 2 + inward.x * 34, y: (A.y + B.y) / 2 + inward.y * 34};
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      pts.push({x: (1 - t) * (1 - t) * A.x + 2 * t * (1 - t) * C.x + t * t * B.x, y: (1 - t) * (1 - t) * A.y + 2 * t * (1 - t) * C.y + t * t * B.y});
    }
  } else {
    for (let i = 0; i <= N; i++) pts.push({x: lerp(A.x, B.x, i / N), y: lerp(A.y, B.y, i / N)});
  }
  return polyline(pts);
}

const easeS = t => ease.inOutCubic ? ease.inOutCubic(t) : (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Plan the hops of a sequence (indices into `seats`) inside [a, b]. The last
 * hop goes to the tray when `toTray`. Each hop: {from, to, path, a, b, sRel,
 * sCatch, sideFrom, sideTo}. sRel / sCatch are the path fractions where the
 * holder lets go and the receiver catches (a shared point when they meet).
 */
export function planHops(G, seats, seq, {a, b, toTray = false, gap = 0.1}) {
  const legs = [];
  for (let i = 0; i + 1 < seq.length; i++) legs.push([seq[i], seq[i + 1]]);
  if (toTray) legs.push([seq[seq.length - 1], 'tray']);
  const n = legs.length;
  const span = (b - a) / (n + gap * (n - 1));
  return legs.map(([f, t], i) => {
    const fs = seats[f].slot, ts = t === 'tray' ? 'tray' : seats[t].slot;
    const path = hopPath(G, fs, ts);
    const pf = seatPose(G, fs);
    const firstPt = path.at(0.35);
    const lf = toLocal(pf, firstPt);
    const sideFrom = lf.x < -4 ? -1 : 1;
    const shF = toWorld(pf, LOCAL.shoulder(sideFrom).x, LOCAL.shoulder(sideFrom).y);
    let sRel = 0;
    for (let k = 0; k <= 60; k++) { const s = k / 60; const q = path.at(s); if (Math.hypot(q.x - shF.x, q.y - shF.y) <= GEO.REACH) sRel = s; else if (s > 0.05) break; }
    sRel = Math.min(sRel, 0.5);
    let sCatch = 1, sideTo = 1;
    if (ts !== 'tray') {
      const pt = seatPose(G, ts);
      const lt = toLocal(pt, path.at(0.65));
      sideTo = lt.x < -4 ? -1 : 1;
      const shT = toWorld(pt, LOCAL.shoulder(sideTo).x, LOCAL.shoulder(sideTo).y);
      for (let k = 60; k >= 0; k--) { const s = k / 60; const q = path.at(s); if (Math.hypot(q.x - shT.x, q.y - shT.y) <= GEO.REACH) sCatch = s; else if (s < 0.95) break; }
      sCatch = Math.max(sCatch, 0.5);
      if (sRel >= sCatch) sRel = sCatch = (sRel + sCatch) / 2;
    }
    const h0 = a + i * span * (1 + gap);
    return {from: f, to: t, fromSlot: fs, toSlot: ts, path, a: h0, b: h0 + span, sRel, sCatch, sideFrom, sideTo};
  });
}

/** Token progress along its hop at hop-local t (0..1): pushed 0.06–0.8. */
export const hopS = t => easeS(clamp((t - 0.06) / 0.74));
/** Hop-local time at which the token reaches path fraction s. */
export function hopTimeAt(s) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (hopS(m) < s) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/**
 * State of the turn at u: token position, who holds it, each seat's lamp
 * (0..1 lit), each seat's hand targets (world, template units; null = desk).
 * `seq` indices into seats; hops from planHops. Before the first hop the first
 * person in the sequence holds the signal with their lamp lit.
 */
export function turnAt(G, seats, seq, hops, u, {startLit = true} = {}) {
  const n = seats.length;
  const lamps = new Array(n).fill(0);
  const hands = seats.map(() => ({L: null, R: null}));
  let holder = seq[0];
  let token = restAt(G, seats[seq[0]].slot);
  let phase = 'rest';
  lamps[seq[0]] = startLit ? 1 : 0;
  let hopIdx = -1;
  for (let i = 0; i < hops.length; i++) {
    const hp = hops[i];
    if (u < hp.a) break;
    hopIdx = i;
    const t = clamp((u - hp.a) / (hp.b - hp.a));
    const s = hopS(t);
    token = hp.path.at(s);
    const tRel = hopTimeAt(hp.sRel), tCatch = hopTimeAt(hp.sCatch);
    // the holder's lamp goes out once the token has left their hand
    lamps[hp.from] = u >= hp.b ? 0 : 1 - clamp((t - tRel) / 0.06);
    if (hp.to !== 'tray') lamps[hp.to] = clamp((t - 0.82) / 0.08);
    const arrived = s >= 1 - 1e-9;
    holder = arrived ? hp.to : null;
    phase = arrived ? 'rest' : s <= hp.sRel ? 'push' : s < hp.sCatch ? 'glide' : 'catch';
    if (holder === 'tray') holder = null;
  }
  // hands: the current holder's hand rests on the token; during a hop the hands follow the solver
  seats.forEach((st, i) => {
    const pose = seatPose(G, st.slot);
    const deskOf = sd => toWorld(pose, LOCAL.desk(sd).x, LOCAL.desk(sd).y);
    let target = null, side = 1;
    const hp = hopIdx >= 0 ? hops[hopIdx] : null;
    const t = hp ? clamp((u - hp.a) / (hp.b - hp.a)) : 0;
    const active = hp && hopS(t) < 1 - 1e-9;
    if (active && hp.from === i) {
      side = hp.sideFrom;
      const tRel = hopTimeAt(hp.sRel);
      if (t <= tRel) target = token;
      else {
        const k = clamp((t - tRel) / 0.12);
        const relPt = hp.path.at(hp.sRel);
        const dk = deskOf(side);
        target = k >= 1 ? null : {x: lerp(relPt.x, dk.x, easeS(k)), y: lerp(relPt.y, dk.y, easeS(k))};
      }
    } else if (active && hp.to === i) {
      side = hp.sideTo;
      const tCatch = hopTimeAt(hp.sCatch);
      const t0 = Math.max(0, tCatch - 0.2);
      if (t >= tCatch) target = token;
      else if (t > t0) {
        const k = easeS(clamp((t - t0) / (tCatch - t0)));
        const cp = hp.path.at(hp.sCatch);
        const dk = deskOf(side);
        target = {x: lerp(dk.x, cp.x, k), y: lerp(dk.y, cp.y, k)};
      }
    } else if (holder === i) {
      // holding: the hand that caught it stays on the token
      const last = hops.filter(q => q.to === i && u >= q.a).pop();
      side = last ? last.sideTo : 1;
      target = token;
    }
    if (target) hands[i][side < 0 ? 'L' : 'R'] = target;
  });
  const reached = seats.every((st, i) => ['L', 'R'].every(k => {
    const tg = hands[i][k];
    if (!tg) return true;
    const pose = seatPose(G, st.slot);
    const sh = toWorld(pose, LOCAL.shoulder(k === 'L' ? -1 : 1).x, LOCAL.shoulder(k === 'L' ? -1 : 1).y);
    return Math.hypot(tg.x - sh.x, tg.y - sh.y) <= GEO.REACH + 1;
  }));
  return {token, holder, lamps, hands, phase, hopIdx, reached};
}

/**
 * Pose record for a seated participant with optional hand targets (world,
 * template units). Overrides the planPerson arm nodes for a reaching hand.
 */
export function seatedPose(person, pose, hands = {}, scale = 1) {
  const nodes = person.pose({x: pose.x, y: pose.y, deg: pose.deg, seated: 1, scale});
  const N = person.name;
  for (const [key, side] of [['armL', -1], ['armR', 1]]) {
    const tg = hands[side < 0 ? 'L' : 'R'];
    if (!tg) continue;
    const lq = toLocal(pose, tg);
    const sx = side * 34, sy = -2;
    const line = {x1: r(sx), y1: r(sy), x2: r(lq.x / scale), y2: r(lq.y / scale)};
    nodes[`${N}-${key}-o`] = line;
    nodes[`${N}-${key}-i`] = line;
    nodes[`${N}-${key}-h`] = {cx: r(lq.x / scale), cy: r(lq.y / scale)};
  }
  return nodes;
}

/** A person rig for a seat (planPerson with its name kept for arm overrides). */
export function turnPerson(ctx, name, look) {
  const pp = planPerson(ctx, {name, look});
  return {...pp, name};
}

/* ------------------------------------------------------------------ */
/* Art (template units)                                                */
/* ------------------------------------------------------------------ */

/** Party badge: a white disc with an ink ring and a solid ● or ◆ (equal ink area and stroke). */
export function partyGlyph(ctx, party, {x = 0, y = 0, R = 16, name, opacity} = {}) {
  const inner = party === 'circle'
    ? h('circle', {cx: r(x), cy: r(y), r: r(R * 0.46), fill: INK})
    : h('path', {d: `M${r(x)} ${r(y - R * 0.58)}L${r(x + R * 0.58)} ${r(y)}L${r(x)} ${r(y + R * 0.58)}L${r(x - R * 0.58)} ${r(y)}Z`, fill: INK});
  return g({name, opacity},
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: '#ffffff', stroke: INK, 'stroke-width': r(Math.max(2.4, R * 0.15), 2)}),
    inner);
}

/** The turn-signal token (template units): a rounded plate with a white "signal" mark. Local origin = centre. */
export function tokenNode(ctx, {name, s = 40} = {}) {
  const th = ctx.theme;
  const hs = s / 2;
  return g({name},
    h('path', {d: roundRectPath(-hs + 3, -hs + 5, s, s, s * 0.26), fill: th.shadow}),
    h('path', {d: roundRectPath(-hs, -hs, s, s, s * 0.26), fill: th.accent3, stroke: INK, 'stroke-width': 2.4}),
    h('circle', {cx: r(-s * 0.16), cy: 0, r: r(s * 0.1), fill: '#ffffff'}),
    h('path', {d: `M${r(s * 0.02)} ${r(-s * 0.2)}A${r(s * 0.24)} ${r(s * 0.24)} 0 0 1 ${r(s * 0.02)} ${r(s * 0.2)}M${r(s * 0.16)} ${r(-s * 0.32)}A${r(s * 0.38)} ${r(s * 0.38)} 0 0 1 ${r(s * 0.16)} ${r(s * 0.32)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(s * 0.08, 2), 'stroke-linecap': 'round'}),
  );
}

/**
 * Turn lamp (template units): unlit = white disc with an ink ring; lit = the
 * same disc filled with the warm accent plus a halo ring (the `-lit` group,
 * opacity animated). The numeral (sequence position) is a text node `-num`
 * (and `-numlit` in white over the lit disc).
 */
export function lampNode(ctx, {name, x, y, R, num = null, fontSize}) {
  const th = ctx.theme;
  const fs = fontSize ?? R * 1.1;
  const txt = (nm, fill) => (num === null ? null : h('text', {name: nm, x: r(x), y: r(y + fs * 0.36), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(fs, 2), 'font-weight': 700, fill}, String(num)));
  return g({name},
    h('circle', {cx: r(x + 2), cy: r(y + 4), r: r(R), fill: th.shadow}),
    h('circle', {name: `${name}-disc`, cx: r(x), cy: r(y), r: r(R), fill: '#ffffff', stroke: INK, 'stroke-width': 3}),
    g({name: `${name}-lit`, opacity: 0},
      h('circle', {cx: r(x), cy: r(y), r: r(R + 9), fill: 'none', stroke: th.accent3, 'stroke-width': 6}),
      h('circle', {cx: r(x), cy: r(y), r: r(R), fill: th.accent3, stroke: INK, 'stroke-width': 3})),
    // one numeral over both states (never two copies cross-fading)
    txt(`${name}-num`, INK),
  );
}

/** Closed door leaf in its wall gap with a thin SOLID swing arc (no dashes). */
function doorArt(ctx, G, name) {
  const c = planColors(ctx);
  const d = G.door;
  const w = d.b - d.a;
  let hinge, closedDeg, sweep;
  if (d.side === 'right') { hinge = {x: G.W, y: d.a}; closedDeg = 90; sweep = 0; }
  else { hinge = {x: d.a, y: G.H}; closedDeg = 0; sweep = 1; }
  const a0 = (closedDeg * Math.PI) / 180, a1 = ((closedDeg + (d.side === 'right' ? 90 : -90)) * Math.PI) / 180;
  const P = a => ({x: hinge.x + Math.cos(a) * w, y: hinge.y + Math.sin(a) * w});
  const p0 = P(a0), p1 = P(a1);
  return g({name},
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}A${r(w)} ${r(w)} 0 0 ${sweep} ${r(p1.x)} ${r(p1.y)}`, fill: 'none', stroke: c.frame, 'stroke-width': 1.8, opacity: 0.55}),
    h('rect', {x: r(hinge.x), y: r(hinge.y - 4.5), width: r(w), height: 9, rx: 3, fill: c.woodDark, stroke: INK, 'stroke-width': 1.6, transform: `rotate(${closedDeg} ${r(hinge.x)} ${r(hinge.y)})`}),
    h('circle', {cx: r(hinge.x), cy: r(hinge.y), r: 5.5, fill: c.wallEdge}));
}

/**
 * The plan art (template units). Returns {room (floor, walls, door, windows,
 * plants, table, tray), chairs, badges, lamps, lampR} as separate groups so
 * entries can stack people between them.
 * @param {{prefix:string, seats:any[], nums?:Map<number,number>|null, lampR:number, numSize:number, tray?:boolean, keepPlant?:(i:number)=>boolean}} o
 */
export function turnArt(ctx, G, o) {
  const P = o.prefix;
  const {W, H, t} = G;
  const room = [];
  room.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 62}));
  const hasDoor = o.door !== false && (G.end ?? GEO.END) + (G.bandEnd || 0) >= GEO.DOOR + 10;
  room.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: [...(hasDoor ? [{side: G.door.side, a: G.door.a, b: G.door.b, kind: 'door'}] : []), ...G.windows.map(q => ({...q, kind: 'window'}))]}));
  if (hasDoor) room.push(doorArt(ctx, G, `${P}-door`));
  G.plants.forEach((q, i) => { if (!o.keepPlant || o.keepPlant(i)) room.push(planPlant(ctx, {name: `${P}-plant${i}`, cx: q.x, cy: q.y, s: 46, seedKey: `tplant${i}`})); });
  const tb = G.table;
  room.push(planTable(ctx, {name: `${P}-table`, cx: tb.x + tb.w / 2, cy: tb.y + tb.h / 2, w: G.axis === 'h' ? tb.w : tb.h, h: G.axis === 'h' ? tb.h : tb.w, deg: G.axis === 'h' ? 0 : 90, seedKey: `${P}tbl`}));
  if (o.tray) {
    const q = G.tray;
    const c = planColors(ctx);
    room.push(g({name: `${P}-tray`},
      h('path', {d: roundRectPath(q.x - q.w / 2, q.y - q.h / 2, q.w, q.h, 12), fill: shade(c.wood, -0.18), stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(q.x - q.w / 2 + 8, q.y - q.h / 2 + 8, q.w - 16, q.h - 16, 8), fill: shade(c.wood, -0.3)})));
  }
  const chairs = o.seats.map((s, i) => {
    const pose = seatPose(G, s.slot);
    const c0 = toWorld(pose, 0, 16);
    return planChair(ctx, {name: `${P}-chair${i}`, cx: c0.x, cy: c0.y, deg: pose.deg, s: 64});
  });
  const badges = o.seats.map((s, i) => {
    const q = badgeAt(G, s.slot);
    return partyGlyph(ctx, s.party, {x: q.x, y: q.y, R: 17, name: `${P}-badge${i}`});
  });
  const lamps = o.seats.map((s, i) => {
    const q = lampAt(G, s.slot);
    const num = o.nums && o.nums.has(i) ? o.nums.get(i) : null;
    return lampNode(ctx, {name: `${P}-lamp${i}`, x: q.x, y: q.y, R: o.lampR, num, fontSize: o.numSize});
  });
  return {room: g({name: `${P}-room`}, room), chairs: g({name: `${P}-chairs`}, chairs), badges: g({name: `${P}-badges`}, badges), lamps: g({name: `${P}-lamps`}, lamps)};
}

/** Lamp frame record: lit fraction k, numerals shown or not. */
export function lampFrame(name, k, hasNum) {
  return {[`${name}-lit`]: {opacity: r(clamp(k), 3)}};
}

/* ------------------------------------------------------------------ */
/* Labels beside the seats (design units)                               */
/* ------------------------------------------------------------------ */

/** Fitted chip text (glue-aware) for a seat label. */
export const fitG = (text, o) => fitWords(glue(text), o);

/**
 * Seat chip boxes in design units: each chip sits in the band outside its
 * row, centred on its person, `gap` beyond the chair back. `toD` maps
 * template → design, k is the plan scale. Returns [{box, fit, from, to}] or
 * null when a chip does not fit its band (a word would break or a line would
 * be cut).
 */
export function seatChips(ctx, G, seats, {toD, k, F, maxLines = 3, weight = 600, checkBand = true}) {
  const out = [];
  const padX = F * 0.55, padY = F * 0.34;
  for (const s of seats) {
    const st = G.seats[s.slot];
    const along = G.axis === 'h';
    // horizontal table: the chip is bounded by the seat spacing; upright table: by the band depth
    const maxW = along ? (G.S ?? GEO.S) * k - 18 : G.band * k - 4;
    const fit = fitG(s.label, {maxWidth: maxW - padX * 2, size: F, minSize: F, maxLines, weight});
    // a word wider than the line would break mid-word (split-word): the chip does not fit
    if (widestWord(ctx, s.label, F, weight) > maxW - padX * 2 + 0.5) return null;
    // a name torn from its letter ("Participante / A") reads as an orphan fragment: the chip does not fit
    if (fit.lines.some(ln => ln.trim().length <= 2)) return null;
    if (fit.truncated || fit.width > maxW - padX * 2 + 0.5) return null;
    const w = fit.width + padX * 2, hh = fit.height + padY * 2;
    if (!along && hh > (G.S ?? GEO.S) * k - 18) return null;
    if (checkBand && along && hh > G.band * k - 4) return null;
    const P = toD({x: st.x, y: st.y});
    const d0 = (GEO.BAND0 + 2) * k;
    let box;
    if (st.out.y < -0.5) box = {x: P.x - w / 2, y: P.y - d0 - hh, w, h: hh};
    else if (st.out.y > 0.5) box = {x: P.x - w / 2, y: P.y + d0, w, h: hh};
    else if (st.out.x < -0.5) box = {x: P.x - d0 - w, y: P.y - hh / 2, w, h: hh};
    else box = {x: P.x + d0, y: P.y - hh / 2, w, h: hh};
    // the leader: from the chip edge nearest the person to the person's back
    const back = toD(toWorld(seatPose(G, s.slot), 0, 30));
    const from = {x: clamp(back.x, box.x + 8, box.x + box.w - 8), y: clamp(back.y, box.y, box.y + box.h)};
    out.push({box, fit, from, to: back, padY});
  }
  return out;
}

/**
 * Fit the hearing-room plan into a design box at text size F: the label band
 * grows until every chip fits beside its seat, the scale k is the largest that
 * fits, and the spare room becomes floor (table ends, beyond the bands). Axis
 * 'h' = table across, 'v' = table upright (label bands tried in steps).
 * Returns {G, k, ox, oy, toD, chips} or null when a chip cannot fit.
 */
export function fitPlan(ctx, seats, box, axis, F, {showKey = true, cols = 2, maxLines = 4, spacings = [GEO.S], end = GEO.END, ta = GEO.TA, wallGap = 26} = {}) {
  const fitK = G => Math.min(box.w / (G.W + 2 * G.t), box.h / (G.H + 2 * G.t));
  let best = null;
  const bands = !showKey ? [30] : axis === 'h' ? [null] : [150, 190, 230, 270, 320];
  for (const S of spacings) for (const b0 of bands) {
    let band = b0 ?? 70, G = null, k = 0, chips = [];
    if (!showKey) band = 30;
    for (let it = 0; it < 4; it++) {
      G = turnGeometry({cols, axis, band, S, end, ta, wallGap});
      k = fitK(G);
      if (!showKey) { chips = []; break; }
      chips = seatChips(ctx, G, seats, {toD: q => ({x: q.x * k, y: q.y * k}), k, F, maxLines, checkBand: axis === 'v'});
      if (!chips) break;
      if (axis === 'v') break;
      const need = Math.max(...chips.map(c => c.box.h)) / k + 10;
      if (Math.abs(need - band) < 2) break;
      band = need;
    }
    if (showKey && !chips) continue;
    if (showKey && axis === 'h') {
      chips = seatChips(ctx, G, seats, {toD: q => ({x: q.x * k, y: q.y * k}), k, F, maxLines});
      if (!chips) continue;
    }
    if (!best || k > best.k) best = {G, k};
  }
  if (!best) return null;
  let {G, k} = best;
  const S = G.S;
  const slackW = box.w / k - (G.W + 2 * G.t), slackH = box.h / k - (G.H + 2 * G.t);
  const [sAlong, sAcross] = axis === 'h' ? [slackW, slackH] : [slackH, slackW];
  G = turnGeometry({cols, axis, band: G.band, bandEnd: Math.max(0, sAlong / 2 - 1), padAcross: Math.max(0, sAcross / 2 - 1), S, end, ta, wallGap});
  const ox = box.x + (box.w - G.W * k) / 2, oy = box.y + (box.h - G.H * k) / 2;
  const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
  const chips = showKey ? seatChips(ctx, G, seats, {toD, k, F, maxLines}) : [];
  return {G, k, ox, oy, toD, chips};
}

/** Chip node (design units) for a seat label with its leader. Named `${name}`, `${name}-body`, `${name}-text`, `${name}-lead`. */
export function seatChipNode(ctx, c, {name, owner}) {
  const th = ctx.theme;
  const b = c.box;
  const baseline = b.y + c.padY + c.fit.size * 0.8;
  return g({name, opacity: 0, 'data-owner': owner},
    h('line', {name: `${name}-lead`, x1: r(c.from.x), y1: r(c.from.y), x2: r(c.to.x), y2: r(c.to.y), stroke: th.ink, 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
    h('path', {name: `${name}-body`, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2, c.fit.size * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
    h('text', {name: `${name}-text`, x: r(b.x + b.w / 2), y: r(baseline), 'font-family': SANS, 'font-size': r(c.fit.size, 2), 'font-weight': c.fit.weight, 'text-anchor': 'middle', fill: th.ink},
      c.fit.lines.map((ln, i) => h('tspan', {x: r(b.x + b.w / 2), dy: i === 0 ? 0 : r(c.fit.lineHeight, 2)}, ln))),
  );
}

/* ------------------------------------------------------------------ */
/* Panel stacks (design units)                                          */
/* ------------------------------------------------------------------ */

/** Widest single word (for "never break a word"). */
export function widestWord(ctx, text, size, weight = 600) {
  return Math.max(0, ...String(text ?? '').split(/[\s ]+/).filter(Boolean).map(wd => ctx.measure(wd, size, weight, 'sans')));
}

/** Fitted text block at (x, y = top). */
export function textAt(fit, x, y, fill, o = {}) {
  return h('text', {name: o.name, x: r(x), y: r(y + fit.size * 0.8), 'font-family': SANS, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': o.italic ? 'italic' : undefined, 'text-anchor': o.anchor, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

/** Legend glyphs (design units), origin at the glyph centre. */
export function turnLegendGlyph(ctx, kind, s, look) {
  if (kind === 'active' || kind === 'pending') {
    const R = s * 0.26;
    return g(null,
      h('circle', {r: r(R), fill: kind === 'active' ? ctx.theme.accent3 : '#ffffff', stroke: INK, 'stroke-width': 3}),
      kind === 'active' ? h('circle', {r: r(R + 7), fill: 'none', stroke: ctx.theme.accent3, 'stroke-width': 5}) : null);
  }
  if (kind === 'signal') return g({transform: `scale(${r(s / 60, 3)})`}, tokenNode(ctx, {s: 40}));
  if (kind === 'sequence') {
    const R = s * 0.15;
    return g(null,
      h('circle', {cx: r(-s * 0.3), cy: 0, r: r(R), fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
      h('circle', {cx: r(s * 0.3), cy: 0, r: r(R), fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
      h('path', {d: `M${r(-s * 0.3 + R + 4)} 0H${r(s * 0.3 - R - 9)}`, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(s * 0.3 - R - 3)} 0l-9 -6v12z`, fill: INK}));
  }
  if (kind === 'circle' || kind === 'diamond') return partyGlyph(ctx, kind, {R: s * 0.3});
  if (kind === 'marker') return changedMarker(ctx, {radius: s * 0.3});
  if (kind === 'person') {
    const pp = planPerson(ctx, {name: 'lg-person', look});
    return g(null, applyStatic(pp.node, pp.pose({x: 0, y: 0, deg: 0, scale: s / 100})));
  }
  return null;
}

/** Glue-aware chip (design units). */
function gchipK(ctx, text, o) {
  return chip({theme: ctx.theme, fit: fitWords}, glue(text), o);
}

/**
 * Measure a vertical stack of panel items at width w and text size F.
 * Item types: chip {text, stroke?, weight?, name}, legend {kind, text, weight?, name},
 * note {text, color, name}, key {text, name}, text {text, weight?, name, italic?}.
 */
export function measureStack(ctx, items, w, F) {
  const th = ctx.theme;
  const gap = F * 0.6;
  const glyph = F * 2.1;
  const rows = [];
  let truncated = false;
  for (const it of items) {
    let row;
    let avail = w;
    if (it.type === 'chip') {
      const c = gchipK(ctx, it.text, {x: 0, y: 0, anchor: 'middle', maxWidth: w, size: F, minSize: F, maxLines: 4, fill: th.card, stroke: it.stroke ?? th.ink, weight: it.weight ?? 600});
      row = {it, h: c.box.h, fit: c.fit};
      avail = w - F * 1.2;
    } else if (it.type === 'legend') {
      avail = w - glyph - 14;
      const fit = fitG(it.text, {maxWidth: avail, size: F, minSize: F, maxLines: 4, weight: it.weight ?? 500});
      row = {it, h: Math.max(glyph, fit.height), fit, glyph};
    } else if (it.type === 'note') {
      avail = w - F * 1.9 - 12;
      const fit = fitG(it.text, {maxWidth: avail, size: F, minSize: F, maxLines: 5, weight: 500});
      row = {it, h: fit.height, fit};
    } else if (it.type === 'key') {
      avail = w - 12;
      const fit = fitG(it.text, {maxWidth: avail, size: F, minSize: F, maxLines: 4, weight: 500});
      row = {it, h: fit.height + F * 0.45, fit};
    } else {
      const fit = fitG(it.text, {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: it.weight ?? 500});
      row = {it, h: fit.height, fit};
    }
    if (row.fit.truncated) truncated = true;
    if (widestWord(ctx, it.text, F, it.type === 'chip' ? (it.weight ?? 600) : (it.weight ?? 500)) > avail + 0.5) truncated = true;
    rows.push(row);
  }
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
      node = gchipK(ctx, it.text, {x: x + m.w / 2, y: yy, anchor: 'middle', maxWidth: m.w, size: m.F, minSize: m.F, maxLines: 4, fill: th.card, stroke: it.stroke ?? th.ink, weight: it.weight ?? 600}).node;
    } else if (it.type === 'legend') {
      node = g(null,
        g({transform: T(x + row.glyph / 2, yy + row.h / 2)}, turnLegendGlyph(ctx, it.kind, row.glyph, look)),
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

/** Person size at scale 1 (template). */
export const PERSON_RAD = PERSON.half;
export const R2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
export {T};
