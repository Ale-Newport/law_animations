/**
 * LAW-0215 — Sala física y remota · contrast
 *
 * Storyboard (two complete copies of the same generic hearing room, drawn as
 * plans: side by side on wide frames, one above the other on tall ones; the
 * same people, bench, door and window in both):
 *  0.00–0.17  base: the two scenes are identical — the room with its bench and
 *             link hubs, one table, the corridor, a shared remote window on the
 *             right wall (a participant standing at their desk in it), the
 *             people who will walk in waiting in the corridor, and the focus
 *             participant standing in their own place beside the corridor's
 *             end (a floor, a desk and a chair; no frame yet). Only the neutral
 *             A / B badges tell the scenes apart.
 *  0.17–0.40  the change, localised and explicit, drawn at the same time in
 *             both: in A a solid ring draws around the focus participant's
 *             chair in the room (they will appear in the room); in B a screen
 *             bezel draws around their own place, which becomes a window at the
 *             room edge with its camera dot (they will appear in a window). The
 *             scenario labels «Comparecencia presencial» / «remota» and their
 *             captions appear once the change is drawn.
 *  0.40–0.77  in parallel, the same arrivals with the same timing: the shared
 *             participants walk in and sit, the bench draws a solid link to the
 *             shared window; only the focus participant differs — in A they
 *             walk from their place along the corridor, through the door and sit
 *             at the ringed chair; in B the bench draws a solid link to their
 *             window and they sit at their desk. Labels arrive once seated.
 *  0.77–1.00  a solid guide outlines the focus participant's place in both
 *             scenes and joins them to one chip naming the changed fact; the
 *             shared facts, the key and the neutral note stay visible. Neither
 *             way of appearing is marked as allowed, required, valid, equivalent
 *             or lesser; there is no winner, score or consequence.
 * Equal weight: the same person size, label size, stroke and timing in A and B.
 * @module animations/courts/LAW-0215
 */
import {defineAnimation} from '../../core/define.js';
import {ParamError, applyPatch, validate} from '../../core/schema.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, int, list, obj, oneOf} from '../../schemas/fields.js';
import {planPerson, planTable, planChair, floorArea, planColors, buildingElevation} from './kits/courts-art.js';
import {
  sfrFields, SFR_EN, SFR_STRINGS, resolveSfr, sfrGeometry, planFrame, linkAt, walkerAt, doorOpen, roomArt, windowArt, linkLine, camLit,
  remotePose, furnitureBoxes, placeSeatLabels, seatLabelNode, remainingPath, bodyBox, gchip, glue, fitWords, pxPerUnit, R2, PERSON_RAD, WALL,
  TILE, HUB, outerPad, roundCorners, isWin,
} from './kits/sala-fisica-remota.js';
import {planWalkers} from './kits/distribucion-de-sala.js';

const ID = 'LAW-0215';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {change: [0.19, 0.34], headers: [0.34, 0.39], arrive: [0.41, 0.74], guide: [0.77, 0.83], notes: [0.8, 0.86]};
const MIN = {W: 480, H: 480};
const LINK_DUR = 0.11;

const STRINGS = {
  en: {shared: 'Same in A and B'},
  es: {shared: 'Igual en A y B'},
};

const scenario = who => obj(`Scenario ${who}`, {
  label: str(`Short label for scenario ${who}`, 50),
  caption: str('One-line description of where the focus participant appears (as supplied)', 90),
  appears: oneOf('Where the focus participant appears in this scenario, as supplied: in the room (at their room seat) or in a window at the room edge. It carries no legal meaning', ['room', 'window']),
}, ['label', 'appears']);

// The contrast draws two compact copies of the room side by side, so this item offers only the places the compact
// room draws: the seat behind the bench (front), the two seats at its one table (left1, left2) and two remote
// windows (win1, win2, drawn on the room's right wall). The shared schema's right1/right2 and win3/win4 are not
// offered here (they would need a second table and more windows, which the two scenes have no width for), so a
// supplied place is never dropped silently: an unsupported slot is rejected when the parameters are validated.
const CONTRAST_SLOTS = ['front', 'left1', 'left2', 'win1', 'win2'];
const sceneSchema = {
  ...sfrFields,
  seats: list('Places of the participants, as supplied: a seat in the compact room (front = behind the bench; left1/left2 = the two seats at its table) or a remote window at the room edge (win1/win2, on the right wall), each with its editable label. Only the places the compact room draws are offered. Where a participant appears is as supplied and carries no legal meaning', obj('Place', {
    slot: oneOf('Place: front, left1, left2 (room seats) or win1, win2 (remote windows)', CONTRAST_SLOTS),
    label: str('Editable label of the participant at this place (as supplied)', 60),
  }, ['slot', 'label']), 2, 4),
  // (the focus participant needs a room seat and at most one other participant may be in a window, so at most four
  // places can be combined: a fifth would always be the second shared window)
  routes: list('Arrival order (as supplied), as seat indices. Every seat is always drawn: a seat index missing from this list is appended in seat order, and an unknown or repeated index is ignored, so the list can be edited before or after Seats', obj('Route', {
    seat: int('Index of the place in `seats`', 0, 3),
  }, ['seat']), 1, 6),
  focusSeat: int('Index in `seats` of the participant whose place differs between A and B. It must be a room seat (front, left1, left2): used when they appear in the room; in the window scenario their own place beside the corridor is framed as a window. With a room-seat focus, at most one other participant may be in a window (see the combination rules)', 0, 3),
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {
    guide: str('Label on the guide linking the changed detail', 70),
    neutral: str('Neutral note (no winner, no outcome; must say that no conclusion is drawn)', 120),
  }),
};

/**
 * Combination rules (checked with the schema, before anything is drawn). The field schema alone cannot express
 * them, and a combination outside them would either be drawn with overlaps or lose a supplied place:
 *  - every place is used by exactly one participant (the arrival order is normalised, never rejected: see
 *    normalRoutes);
 *  - the focus participant (focusSeat) has a room seat (front, left1, left2): their own place in the window
 *    scenario is drawn beside the corridor, and their room seat is used in the room scenario;
 *  - with a room-seat focus, at most ONE other participant may appear in a window: the compact room's right wall
 *    holds two window places and, in the window scenario, the focus participant's own place is the second one
 *    (with two shared windows it would need a third, which neither scene has room for);
 * (Scenario A and B may supply the same appearance: both scenes are then drawn identical — nothing is invented.)
 */
export function contrastProblems(p) {
  const out = [];
  const seats = p.seats || [];
  const slots = seats.map(s => s.slot);
  const dup = slots.filter((v, i) => slots.indexOf(v) !== i);
  if (dup.length) out.push(`params.seats: each place may be used once (repeated: ${[...new Set(dup)].join(', ')})`);
  // (these two rules concern Seats and Focus seat together: the message names both fields, and the gallery shows it
  // on the field that was just edited)
  const both = 'params.seats + params.focusSeat';
  const focus = seats[p.focusSeat];
  if (!focus) out.push(`${both}: Focus seat ${p.focusSeat} is not one of the ${seats.length} Seats (indices 0–${seats.length - 1}); change Focus seat or add a seat`);
  else if (!['front', 'left1', 'left2'].includes(focus.slot)) out.push(`${both}: the Focus seat (index ${p.focusSeat}) must be a room seat (front, left1 or left2) in Seats; it is "${focus.slot}". Their own window place is drawn beside the corridor in the window scenario`);
  else {
    const shared = seats.filter((s, i) => i !== p.focusSeat && (s.slot === 'win1' || s.slot === 'win2'));
    if (shared.length > 1) out.push(`${both}: with the Focus seat at a room seat, at most one other seat in Seats may be a window (win1 or win2); there are ${shared.length}. In the window scenario the focus participant's own place takes the second window place of the compact room`);
  }
  return out;
}

/** The arrival order actually used: supplied order, unknown and repeated indices dropped, missing seats appended. */
export function normalRoutes(p) {
  const n = (p.seats || []).length;
  const out = [];
  for (const r of p.routes || []) if (Number.isInteger(r.seat) && r.seat < n && !out.includes(r.seat)) out.push(r.seat);
  for (let i = 0; i < n; i++) if (!out.includes(i)) out.push(i);
  return out.map(seat => ({seat}));
}

const defaultParams = {
  ...SFR_EN,
  seats: [
    {slot: 'win1', label: 'Participant B'},
    {slot: 'left2', label: 'Participant A'},
  ],
  routes: [{seat: 0}, {seat: 1}],
  focusSeat: 1,
  scenarioA: {label: 'In-person appearance', caption: 'Participant A appears in the room (as supplied)', appears: 'room'},
  scenarioB: {label: 'Remote appearance', caption: 'Participant A appears in a window (as supplied)', appears: 'window'},
  changedFact: 'Changed fact: where Participant A appears (as supplied)',
  sharedFacts: ['Same room, bench, door and table', 'Participant B appears in a window in both'],
  comparisonLabels: {guide: 'Only this place differs', neutral: 'Both are shown as supplied · no winner, no outcome, no conclusion drawn'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = {...ctx.params, routes: normalRoutes(ctx.params)};
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const cands = shape === 'landscape' ? [['center', 0.16], ['center', 0.19], ['center', 0.22], ['center', 0.26], ['row', 0]]
      : shape === 'square' ? [['row', 0], ['center', 0.2]] : [['column', 0]];
    let best = null;
    const log = [];
    // the largest text first; among working compositions the larger people win (score: people px + 4 × text px)
    const score = L => L.personPx + 4 * L.F * px;
    let chosen = null;
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const [arr, colF] of cands) {
        for (const rot of [0, -90]) {
          const L = compose(ctx, p, v / px, px, arr, colF, rot);
          log.push(`${v}/${arr}/${colF}/rot${rot}/k${L.k.toFixed(2)}${JSON.stringify(L.dims)}:${L.problems.join('+')}` + (L.problems.some(q => q.startsWith('lab-')) ? JSON.stringify(L.dbg) : ''));
          if (!best || L.problems.length < best.problems.length) best = L;
          if (!L.problems.length && (!pick || L.personPx > pick.personPx + 0.5)) pick = L;
        }
      }
      if (pick && (!chosen || score(pick) > score(chosen))) chosen = pick;
      if (chosen && (chosen.personPx >= 78 || v <= 19.8)) break;
    }
    if (chosen) best = chosen;
    // the guide leaders are routed once, for the chosen composition
    best = compose(ctx, p, best.F, px, best.arrangement, best.colF, best.rot, true);
    best.log = log.slice(-40);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.scenes.map(S => g({name: `${S.key}-scene`, transform: T(S.at.x, S.at.y)},
        g({name: `${S.key}-plan`, transform: S.pf.transform},
          S.room.node,
          S.placeNode,
          S.tiles.map(t => t.node),
          S.bezel,
          S.ring,
          S.links.map(l => (l ? l.node : null)),
          S.people.map(pp => pp.node)),
        S.outline,
        S.doorChip && seatLabelNode(ctx, S.doorChip, {name: `${S.key}-door-cap`, size: L.F, color: th.inkSoft}),
        S.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `${S.key}-lab${i}`, size: L.F, owner: `${S.key}-p${i}`, seat: S.seatNames[i]})),
      )),
      L.headers.map(hd => hd.node),
      L.strip.node,
      L.guide && L.guide.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const looks = {};
    const semantic = {};
    const change = ease.inOutCubic(seg(u, ...W.change));
    for (const S of L.scenes) {
      const pos = [];
      const states = [];
      const labelsShown = [];
      const look = {people: [], links: []};
      S.items.forEach((it, i) => {
        const q = seg(u, it.start, it.end);
        let st;
        if (it.kind === 'room') {
          st = walkerAt(it.walker, q, {reduced: ctx.reduced});
          Object.assign(nodes, S.people[i].pose({x: st.x, y: st.y, deg: st.deg, phase: st.phase, walk: st.walk, seated: st.seated}));
          pos.push(st);
          look.people.push({x: r(st.x, 1), y: r(st.y, 1), deg: r(st.deg, 0), seated: r(st.seated, 2)});
          look.links.push(0);
        } else {
          const ls = linkAt(q);
          const pose = it.place ? {...S.G.place.seat, phase: 0, walk: 0, seated: ls.seated} : remotePose(S.G, it.route.slot, ls.seated);
          Object.assign(nodes, S.people[i].pose(pose));
          Object.assign(nodes, S.links[i].frame(ls.draw));
          nodes[it.place ? `${S.key}-place-cam` : `${S.key}-win-${it.route.slot}-cam`] = camLit(ctx, ls.landed);
          st = {x: pose.x, y: pose.y, deg: pose.deg, state: ls.state};
          look.people.push({x: r(pose.x, 1), y: r(pose.y, 1), deg: r(pose.deg, 0), seated: r(ls.seated, 2)});
          look.links.push(r(ls.draw, 3));
        }
        states.push(st.state);
        const text = seg(u, it.end + 0.012, it.end + 0.04);
        if (S.labels[i]) {
          nodes[`${S.key}-lab${i}`] = {opacity: r(seg(u, it.end - 0.012, it.end + 0.018), 3)};
          nodes[`${S.key}-lab${i}-text`] = {opacity: r(text, 3)};
        }
        labelsShown.push(r(S.labels[i] ? text : q >= 1 ? 1 : 0, 3));
        semantic[`${S.key}p${i}`] = R2(S.toScreen(st));
        semantic[`${S.key}seat${i}`] = R2(S.toScreen(it.seatPt));
      });
      Object.assign(nodes, S.room.doors.main.frame(doorOpen(S.G, 'main', pos)));
      // the change: A rings the focus chair in the room, B frames the focus participant's own place as a window
      const bez = S.appears === 'window' ? change : 0;
      const ring = S.appears === 'room' ? change : 0;
      nodes[`${S.key}-bezel`] = {opacity: bez > 0 ? 1 : 0, 'stroke-dashoffset': r(S.bezelLen * (1 - bez))};
      nodes[`${S.key}-place-cam`] = nodes[`${S.key}-place-cam`] || camLit(ctx, false);
      nodes[`${S.key}-place-camg`] = {opacity: bez >= 1 ? 1 : 0};
      nodes[`${S.key}-ring`] = {opacity: ring > 0 ? 1 : 0, 'stroke-dashoffset': r(S.ringLen * (1 - ring))};
      const gp = seg(u, ...W.guide);
      nodes[`${S.key}-outline`] = {opacity: r(gp, 3)};
      if (S.doorChip) { nodes[`${S.key}-door-cap`] = {opacity: 1}; nodes[`${S.key}-door-cap-text`] = {opacity: 1}; }
      looks[S.key] = {...look, labels: labelsShown, bezel: r(bez, 3), ring: r(ring, 3), header: r(seg(u, ...W.headers), 3), outline: r(gp, 3)};
      semantic[S.key] = {states, seated: states.filter(x => x === 'seated').length, appears: S.appears, labels: labelsShown};
    }
    for (const hd of L.headers) nodes[`${hd.name}-label`] = {opacity: r(seg(u, ...W.headers), 3)};
    Object.assign(nodes, L.strip.frame(u));
    if (L.guide) nodes.guide = {opacity: r(seg(u, ...W.guide), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const fi = L.scenes[0].focusIndex;
    return {
      nodes,
      semantic: {
        ...semantic,
        beat,
        scenes: L.scenes.length,
        lookA: looks.A,
        lookB: looks.B,
        change: r(change, 3),
        focusIndex: fi,
        focusA: fi >= 0 ? looks.A.people[fi] : null,
        focusB: fi >= 0 ? looks.B.people[fi] : null,
        guideShown: r(seg(u, ...W.guide), 3),
        noteShown: r(seg(u, ...W.notes), 3),
        appearsA: L.scenes[0].appears,
        appearsB: L.scenes[1].appears,
        arrangement: L.arrangement,
        rotation: L.rot,
        personPx: r(L.personPx, 1),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        log: L.log,
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/* Scene geometry: the compact room + the focus participant's own place */
/* ------------------------------------------------------------------ */

/** Template extents beyond the room for the shared windows (right wall) and the focus place (beside the corridor). */
function sceneExtras(nWin, rot) {
  const side = WALL + TILE.channel + TILE.w + outerPad(rot);
  // (+ room under the focus participant's own place for its label)
  return {x: WALL + side, y: WALL + WALL + CORR + WALL + PLACE_BELOW};
}
const PLACE_BELOW = 60;
/** The contrast's corridor is a little shallower than the story's (the two scenes share one frame). */
const CORR = 130;

function fitScene(box, nWin, rot) {
  const ex = sceneExtras(nWin, rot);
  const ar = rot ? box.h / box.w : box.w / box.h;
  // with a second shared window the room is deeper, so that window and the focus place keep room for their labels
  const minH = nWin > 1 ? 550 : MIN.H;
  let Wr = MIN.W, Hr = minH;
  if (ar > (Wr + ex.x) / (Hr + ex.y)) Wr = Math.round(ar * (Hr + ex.y) - ex.x);
  else Hr = Math.round((Wr + ex.x) / ar - ex.y);
  Wr = Math.min(Wr, 1100);
  Hr = Math.max(minH, Math.min(Hr, 900));
  const ew = Wr + ex.x, eh = Hr + ex.y;
  const k = rot ? Math.min(box.w / eh, box.h / ew) : Math.min(box.w / ew, box.h / eh);
  return {W: Wr, H: Hr, k};
}

/** The room geometry plus the focus participant's own place (a tile beside the corridor's right end). */
function sceneGeometry(Wr, Hr, winSlots, rot, roomSlots) {
  const outer = outerPad(rot);
  const G = sfrGeometry(Wr, Hr, winSlots, 'right', outer, {compact: true, corridor: CORR});
  // only the chairs someone uses are drawn (the compact room keeps its space for their labels)
  for (const k of Object.keys(G.slots)) if (!roomSlots.includes(k)) delete G.slots[k];
  const t = WALL, cw = CORR;
  const cy = Hr + t + cw / 2;
  const bx = Wr + t + TILE.channel;
  const box = {x: bx, y: cy - TILE.h / 2, w: TILE.w, h: TILE.h};
  const cx = bx + TILE.w / 2;
  G.place = {
    box,
    inner: {x: box.x + TILE.bezel, y: box.y + TILE.bezel, w: box.w - 2 * TILE.bezel, h: box.h - 2 * TILE.bezel},
    seat: {x: cx, y: cy + 10, deg: 0},
    desk: {cx, cy: cy - 56, w: 124, h: 40},
    // the room-facing (left) edge, towards the corridor
    port: {x: box.x, y: cy},
  };
  const sideW = t + TILE.channel + TILE.w + outer;
  G.extents = {x: -t, y: -t, w: Wr + t + sideW, h: Hr + t + t + cw + t + PLACE_BELOW};
  return G;
}

/** Walk of the focus participant from their own place into the corridor, through the door, to their room seat. */
function placeWalk(G, slot) {
  const S = G.slots[slot];
  const D = G.doors.main;
  const cy = G.H + WALL + CORR / 2;
  const pts = [{x: G.place.seat.x, y: G.place.seat.y}, {x: G.place.box.x - 16, y: cy}, {x: G.W - 60, y: cy}, {...D.out}, {...D.gate}, {...D.in}, {x: D.in.x, y: G.yB}, {x: S.x, y: G.yB}, {x: S.x, y: S.y}];
  const clean = [];
  for (const q of pts) { const l = clean[clean.length - 1]; if (!l || Math.hypot(q.x - l.x, q.y - l.y) > 1) clean.push(q); }
  const rc = roundCorners(clean, 40);
  return {pts: rc, poly: polyline(rc), spot: {deg: 0}, seat: {x: S.x, y: S.y, deg: S.deg}};
}

/** Link from the bench's right hub down to the room-facing edge of the focus participant's place. */
function placeLink(G) {
  const hub = G.hubs.right;
  const port = G.place.port;
  // with a second shared window its diagonal link already leaves the hub downwards: the focus link then drops
  // from the hub's lower edge and runs down the channel beside the room wall (no parallel pair)
  if (Object.values(G.win).some(w => w.row === 1)) {
    const chX = G.W + WALL + TILE.channel / 2;
    const y1 = hub.y + 70;
    return roundCorners([{x: hub.x, y: hub.y + HUB.h / 2}, {x: hub.x, y: y1}, {x: chX, y: y1}, {x: chX, y: port.y}, {...port}], 26);
  }
  const entry = {x: port.x - 34, y: port.y};
  const dx = entry.x - hub.x, dy = entry.y - hub.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  const tt = Math.min(HUB.w / 2 / Math.max(Math.abs(ux), 1e-6), HUB.h / 2 / Math.max(Math.abs(uy), 1e-6));
  return roundCorners([{x: hub.x + ux * tt, y: hub.y + uy * tt}, entry, {...port}], 30);
}

/** Link from the right hub to a shared window on the right wall (row 0: level; row 1: one diagonal run). */
function winLink(G, slot) {
  const w = G.win[slot];
  const hub = G.hubs.right;
  const port = w.port;
  if (Math.abs(port.y - hub.y) < 2) return [{x: hub.x + HUB.w / 2, y: hub.y}, {...port}];
  const entry = {x: port.x - 40, y: port.y};
  const dx = entry.x - hub.x, dy = entry.y - hub.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  const tt = Math.min(HUB.w / 2 / Math.max(Math.abs(ux), 1e-6), HUB.h / 2 / Math.max(Math.abs(uy), 1e-6));
  return roundCorners([{x: hub.x + ux * tt, y: hub.y + uy * tt}, entry, {...port}], 30);
}

/** The focus participant's own place: floor, desk and chair (unframed); the bezel is drawn separately. */
function placeArt(ctx, G, key) {
  const pl = G.place;
  const c = planColors(ctx);
  const inn = pl.inner;
  const bridge = {x: G.W, y: G.H + WALL + 14, w: pl.box.x - G.W + 8, h: CORR - 28};
  return g({name: `${key}-place`},
    floorArea(ctx, {x: bridge.x, y: bridge.y, w: bridge.w, h: bridge.h, kind: 'planks'}),
    h('path', {d: roundRectPath(pl.box.x, pl.box.y, pl.box.w, pl.box.h, 16), fill: '#e8edf1', stroke: c.floorLine, 'stroke-width': 2}),
    h('path', {d: roundRectPath(inn.x + 5, inn.y + 5, inn.w - 10, inn.h * 0.22, 4), fill: '#dfe5ea'}),
    planTable(ctx, {cx: pl.desk.cx, cy: pl.desk.cy, w: pl.desk.w, h: pl.desk.h, seedKey: `${key}-place-desk`}),
    planChair(ctx, {cx: pl.seat.x, cy: pl.seat.y, deg: 0, s: 62}),
    g({name: `${key}-place-camg`, opacity: 0}, h('circle', {name: `${key}-place-cam`, cx: r(pl.box.x + TILE.bezel / 2), cy: r(pl.port.y), r: 5.5, fill: '#6b7682', stroke: '#1f2328', 'stroke-width': 1.4})),
  );
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, arrangement, colF, rot, withGuide = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const res0 = resolveSfr(ctx, p);
  const seats = res0.seats;
  // every supplied place is one the compact room draws (the schema offers only CONTRAST_SLOTS), so every route is kept
  const routes = res0.routes;
  const focus = seats.find(s => s.index === p.focusSeat) || null;
  const focusRoomSlot = focus && !isWin(focus.slot) ? focus.slot : null;
  const sharedWin = routes.filter(rt => rt.kind === 'window' && (!focus || rt.seat !== focus.index)).map(rt => rt.slot).slice(0, 2);
  // ---- shared texts: centre column (landscape) or a strip under the scenes (row / column)
  const center = arrangement === 'center';
  const colW = center ? D.w * colF : D.w;
  let centerTexts = null;
  let plan = null;
  let stripH = 0;
  const bldH0 = center ? Math.min(140, colW * 0.6) : Math.min(110, D.h * 0.13);
  if (center) {
    const names = showKey ? fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: colW, size: F, minSize: F, maxLines: 5, weight: 600}) : null;
    const factW = colW - F * 1.2;
    const facts = showAll ? p.sharedFacts.map(f => fitWords(glue(f), {maxWidth: factW, size: F, minSize: F, maxLines: 4, weight: 500})) : [];
    const sharedHead = showAll && facts.length ? fitWords(ctx.t.shared, {maxWidth: colW, size: F, minSize: F, maxLines: 1, weight: 700}) : null;
    const guideFit = showKey ? fitWords(glue(p.comparisonLabels.guide), {maxWidth: colW - F * 1.4, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
    const changedFit = showKey ? fitWords(glue(p.changedFact), {maxWidth: colW - F * 1.4, size: F, minSize: F, maxLines: 5, weight: 500}) : null;
    const neutralFit = showKey ? fitWords(glue(p.comparisonLabels.neutral), {maxWidth: colW, size: F, minSize: F, maxLines: 6, weight: 500}) : null;
    const keyFit = showKey ? fitWords(glue(p.labels.key), {maxWidth: colW, size: F, minSize: F, maxLines: 4, weight: 500}) : null;
    for (const f of [names, guideFit, changedFit, neutralFit, keyFit, sharedHead, ...facts]) if (f && f.truncated) problems.push('strip-trunc');
    const chipW = guideFit ? Math.max(guideFit.width, changedFit.width) + F * 1.4 : 0;
    const chipH = guideFit ? guideFit.height + changedFit.height + F * 0.5 + F * 0.9 : 0;
    const factsH = (sharedHead ? sharedHead.height + F * 0.3 : 0) + facts.reduce((a2, f) => a2 + f.height + F * 0.3, 0);
    const need = bldH0 + F * 0.6 + (names ? names.height + F * 0.8 : 0) + (chipH ? chipH + F * 1.0 : 0) + factsH + F * 0.6 + (neutralFit ? neutralFit.height + F * 0.6 : 0) + (keyFit ? keyFit.height : 0);
    if (need > D.h + 0.5) problems.push('strip');
    centerTexts = {names, facts, sharedHead, guideFit, changedFit, neutralFit, keyFit, chipW, chipH};
  } else {
    plan = stripPlan(ctx, p, F, D.w, bldH0, showKey, showAll, arrangement === 'column');
    if (!plan) problems.push('strip-trunc');
    stripH = plan ? plan.height + F * 0.5 : D.h * 0.4;
  }
  // ---- panels
  const gap = center ? 34 : arrangement === 'row' ? 24 : 26;
  const avail = {w: D.w, h: D.h - (center ? 0 : stripH + 18)};
  const panelW = center ? (D.w - colW - gap * 2) / 2 : arrangement === 'row' ? (avail.w - gap) / 2 : avail.w;
  const panelH = arrangement === 'column' ? (avail.h - gap) / 2 : avail.h;
  if (center && panelW < D.w * 0.4 - 1) problems.push('narrow');
  // header: badge + label (+ caption beside or under), same height for A and B
  const badgeR = F * 0.95;
  // (tall frames) the header leaves the right margin free for the guide's leader down to scene B
  const hdrW = arrangement === 'column' ? panelW * 0.7 : panelW;
  const hdrFits = [p.scenarioA, p.scenarioB].map(sc => {
    const lab = showKey ? fitWords(glue(sc.label), {maxWidth: hdrW - badgeR * 2 - 30, size: F * 1.1, minSize: F, maxLines: 2, weight: 700}) : null;
    let capt = showAll && sc.caption ? fitWords(glue(sc.caption), {maxWidth: hdrW - badgeR * 2 - 30, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
    let beside = false;
    if (capt && lab && lab.lines.length === 1 && arrangement !== 'column') {
      const room = panelW - badgeR * 2 - 30 - lab.width - 20;
      const one = fitWords(glue(sc.caption), {maxWidth: room, size: F, minSize: F, maxLines: 1, weight: 500});
      if (room > 120 && !one.truncated) { capt = one; beside = true; }
    }
    if ((lab && lab.truncated) || (capt && capt.truncated)) problems.push('header-trunc');
    return {lab, capt, beside};
  });
  if (!hdrFits.every(f => f.beside || !f.capt)) hdrFits.forEach((f, i) => { if (f.beside) { const sc = i ? p.scenarioB : p.scenarioA; f.capt = fitWords(glue(sc.caption), {maxWidth: hdrW - badgeR * 2 - 30, size: F, minSize: F, maxLines: 3, weight: 500}); f.beside = false; } });
  const headerH = Math.max(badgeR * 2 + F * 0.4, ...hdrFits.map(f => (f.beside ? f.lab.height : (f.lab ? f.lab.height + F * 0.3 : 0) + (f.capt ? f.capt.height : 0)) + F * 0.6));
  const stage = {x: 0, y: headerH, w: panelW, h: panelH - headerH};
  const {W: Wr, H: Hr, k} = fitScene(stage, sharedWin.length, rot);
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  const G = sceneGeometry(Wr, Hr, sharedWin, rot, [...routes.filter(rt => rt.kind === 'room').map(rt => rt.slot), ...(focusRoomSlot ? [focusRoomSlot] : [])]);
  const pf = planFrame(G.extents, stage, k, rot);
  // side by side, each scene's drawn plan takes at least 0.40 of the frame width (measured on its drawn extent)
  const drawnBoxes = [{x: -WALL, y: -WALL, w: Wr + 2 * WALL, h: Hr + 3 * WALL + CORR}, G.place.box, ...Object.values(G.win).map(w => w.box)];
  const dx0 = Math.min(...drawnBoxes.map(b => b.x)), dx1 = Math.max(...drawnBoxes.map(b => b.x + b.w));
  const dy0 = Math.min(...drawnBoxes.map(b => b.y)), dy1 = Math.max(...drawnBoxes.map(b => b.y + b.h));
  const drawnW = (rot ? dy1 - dy0 : dx1 - dx0) * k;
  // (the frame, in design units, is wider than the design box: the design sits in the caption-safe area)
  const frameW = ctx.view.width / ((px * Math.min(ctx.view.width, ctx.view.height)) / 1080);
  if (arrangement !== 'column' && drawnW < 0.405 * frameW) problems.push('narrow-scene');
  const toD = pf.toD;
  const rad = PERSON_RAD * k;
  // ---- schedule (the same start times in A and B; each arrival keeps its own duration)
  const roomShared = routes.filter(rt => rt.kind === 'room' && (!focus || rt.seat !== focus.index));
  const walkers = planWalkers(G, roomShared.map(rt => ({...rt, door: 'main'})), {a: W.arrive[0], b: W.arrive[1]});
  const walkP = focusRoomSlot ? placeWalk(G, focusRoomSlot) : null;
  const appears = [p.scenarioA.appears, p.scenarioB.appears].map(a => (a === 'room' && !focusRoomSlot ? 'window' : a));
  const itemsFor = ap => routes.map(rt => {
    if (focus && rt.seat === focus.index) {
      if (ap === 'room') return {route: rt, kind: 'room', walker: {...walkP}, len: walkP.poly.total, focus: true, seatPt: G.slots[focusRoomSlot]};
      return {route: rt, kind: 'window', place: true, pts: placeLink(G), focus: true, seatPt: G.place.seat};
    }
    if (rt.kind === 'room') { const w = walkers[roomShared.indexOf(rt)]; return {route: rt, kind: 'room', walker: w, len: w.poly.total, seatPt: G.slots[rt.slot]}; }
    return {route: rt, kind: 'window', pts: winLink(G, rt.slot), seatPt: G.win[rt.slot].seat};
  });
  const itemsAB = appears.map(itemsFor);
  const span = W.arrive[1] - W.arrive[0];
  const maxLen = Math.max(1, ...itemsAB.flat().filter(q => q.kind === 'room').map(q => q.len));
  const maxDur = Math.min(0.24, span);
  const durOf = q => (q.kind === 'room' ? maxDur * (0.3 + 0.7 * (q.len / maxLen)) : LINK_DUR);
  const n = routes.length;
  let gapT = 0;
  if (n > 1) {
    gapT = 0.13;
    for (let i = 1; i < n; i++) gapT = Math.min(gapT, (span - Math.max(durOf(itemsAB[0][i]), durOf(itemsAB[1][i]))) / i);
    gapT = Math.max(0.04, gapT);
  }
  for (const items of itemsAB) items.forEach((q, i) => {
    q.start = W.arrive[0] + i * gapT;
    q.end = Math.min(W.arrive[1], q.start + Math.max(0.04, Math.min(durOf(q), span - i * gapT)));
    if (q.walker) { q.walker.start = q.start; q.walker.end = q.end; }
  });
  const focusIndex = focus ? routes.findIndex(rt => rt.seat === focus.index) : -1;
  // ---- label placement in scene-local design units (shared labels identical in A and B)
  const furnAll = furnitureBoxes(G);
  const occupiedAll = new Set(routes.filter(rt => rt.kind === 'room').map(rt => rt.slot));
  const hard = furnAll.filter(f => f.kind === 'desk' || f.kind === 'table' || f.kind === 'plant').map(pf.mapBox);
  const placeB = pf.mapBox(G.place.box);
  const screens = [...Object.values(G.win).map(w => pf.mapBox(w.inner)), placeB];
  const linkPaths = itemsAB.flat().filter(q => q.kind === 'window').map(q => q.pts.map(toD));
  // the links of the shared windows only (the focus participant's own link exists only where they appear in a window)
  const sharedLinks = itemsAB.flat().filter(q => q.kind === 'window' && !q.place).map(q => q.pts.map(toD));
  const allPaths = [...linkPaths, ...(walkP ? [walkP.pts.filter((q, i) => i % 3 === 0).map(toD)] : [])];
  // paths still to be walked after arrival i (in either scene): later walkers only
  const laterWalks = i => itemsAB.flatMap(items => items.filter((q, j) => q.kind === 'room' && j > i).map(q => remainingPath(q.walker, i < 0 ? W.arrive[1] : items[i].end - 0.012).filter((z, zi) => zi % 4 === 0).map(toD))).filter(q => q.length);
  const seatPoints = [...Object.values(G.slots).map(toD), ...Object.values(G.win).map(w => toD(w.seat)), toD(G.place.seat)];
  const roomBox = pf.mapBox({x: 4, y: 4, w: Wr - 8, h: Hr - 8});
  const E = G.extents;
  // window labels: beside their window, reaching over the channel and the wall into the room's edge strip at most
  const colBox = pf.mapBox({x: Wr - 70, y: E.y, w: E.x + E.w - Wr + 70, h: E.h});
  const personAt = q => bodyBox(toD(q.seatPt), (q.seatPt.deg || 0) + rot, rad);
  // people considered by the placer: every final seat in either scene, plus the focus participant's place
  const everyone = [...itemsAB[0].map(personAt), ...itemsAB[1].map(personAt), {...toD(G.place.seat), rad}];
  const DBG = {};
  const common = {debug: DBG, size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 36 / px, pathPad: rad * 0.5, seatPoints, hard,
    hardAlways: furnAll.filter(f => f.kind === 'chair' && !occupiedAll.has(f.slot)).map(pf.mapBox)};
  const shared = routes.map(() => null);
  const focusLab = {room: null, window: null};
  const extra = [];
  if (showKey) {
    const sharedIdx = routes.map((rt, i) => i).filter(i => i !== focusIndex);
    const roomIdx = sharedIdx.filter(i => itemsAB[0][i].kind === 'room');
    const winIdx = sharedIdx.filter(i => itemsAB[0][i].kind === 'window');
    const furn = furnAll.filter(f => f.kind !== 'chair' || !occupiedAll.has(f.slot)).map(pf.mapBox);
    // the focus participant's chair is empty in a window scenario: no other chip may rest on it
    const focusChair = focusRoomSlot ? [pf.mapBox({x: G.slots[focusRoomSlot].x - 31, y: G.slots[focusRoomSlot].y - 31, w: 62, h: 62})] : [];
    const itemsOf = (idx, extraItem) => [...idx.map(i => ({key: `s${i}`, i, text: routes[i].label, at: toD(itemsAB[0][i].seatPt)})), ...(extraItem ? [extraItem] : [])];
    const hasRoom = focusIndex >= 0 && appears.includes('room');
    const hasWin = focusIndex >= 0 && appears.includes('window');
    const fRoom = hasRoom ? {key: 'focus-room', text: routes[focusIndex].label, at: toD(G.slots[focusRoomSlot])} : null;
    const fWin = hasWin ? {key: 'focus-window', text: routes[focusIndex].label, at: toD(G.place.seat)} : null;
    const roomItems = itemsOf(roomIdx, fRoom);
    if (roomItems.length) {
      const res = placeSeatLabels(ctx, {...common, hardAlways: [...common.hardAlways, ...focusChair], items: roomItems.map(it => ({...it, rad,
        avoidPaths: [...(it.i === undefined ? sharedLinks : linkPaths), ...laterWalks(it.i === undefined ? focusIndex : it.i)]})),
      people: everyone, furniture: [...furn, ...screens], bounds: roomBox, extra});
      res.labels.forEach((lb, j) => { const it = roomItems[j]; if (it.key === 'focus-room') focusLab.room = lb; else shared[it.i] = lb; extra.push(lb.box); });
      problems.push(...res.fails.map(f => `lab-${f}`));
    }
    const winItems = itemsOf(winIdx, fWin);
    if (winItems.length) {
      const res = placeSeatLabels(ctx, {...common, items: winItems.map(it => ({...it, rad, avoidPaths: [...linkPaths, ...laterWalks(it.i === undefined ? focusIndex : it.i).filter(q => it.i !== undefined || q.length === 0)]})),
        people: everyone, furniture: [...furn, ...screens], bounds: colBox, extra});
      res.labels.forEach((lb, j) => { const it = winItems[j]; if (it.key === 'focus-window') focusLab.window = lb; else shared[it.i] = lb; extra.push(lb.box); });
      problems.push(...res.fails.map(f => `lab-${f}`));
    }
  }
  // the door caption (identical in A and B), in the corridor
  let doorChip = null;
  if (showAll) {
    const at = toD({x: (G.mainDoor.a + G.mainDoor.b) / 2, y: Hr + WALL / 2});
    const corr = pf.mapBox({x: 4, y: Hr + WALL + 4, w: Wr - 8, h: CORR - 8});
    const waiting = walkers.map(w => ({...toD(w.spot), rad}));
    // in the corridor, else straddling the wall beside the door (never far from it)
    const band = pf.mapBox({x: 4, y: Hr - 34, w: G.mainDoor.a - 8, h: WALL + 76});
    let res = null;
    for (const [bounds, gapMax] of [[corr, 200], [band, 90]]) {
      res = placeSeatLabels(ctx, {items: [{key: 'door', text: p.labels.mainDoor, at, rad: 10, avoidPaths: [...walkers.map(w => w.pts.filter((q, i) => i % 3 === 0).map(toD)), ...(walkP ? [walkP.pts.map(toD)] : [])]}],
        people: [...everyone, ...waiting], furniture: [], bounds, size: F, minSize: F, maxWidth: Math.min(280 / px, bounds.w), maxLines: 3, maxGap: gapMax, pathPad: rad * 0.7, strictPaths: true, extra});
      if (!res.fails.length) break;
    }
    if (res.fails.length) problems.push('door');
    doorChip = res.labels[0];
    extra.push(doorChip.box);
  }
  // ---- scene placement
  const onW = pf.rect.w, onH = pf.rect.h;
  const scenes = [];
  const headers = [];
  ['A', 'B'].forEach((key, si) => {
    const x0 = center ? (si ? D.w - panelW : 0) : arrangement === 'row' ? si * (panelW + gap) : 0;
    // (tall frames) the shared strip sits between A and B, so the guide reaches both scenes directly
    const y0 = arrangement === 'column' ? si * (panelH + gap + stripH + 18) : 0;
    const blockH = headerH + onH;
    const top = y0 + (arrangement === 'column' ? 0 : Math.max(0, (panelH - blockH) / 2));
    // the scene group is translated so its plan (drawn in stage coordinates) sits under its header
    const at = {x: x0 + (panelW - onW) / 2 - (pf.rect.x - stage.x), y: top + headerH - pf.rect.y};
    const ap = appears[si];
    const items = itemsAB[si].map(q => ({...q, walker: q.walker ? {...q.walker} : null}));
    const P = `${key}-rm`;
    const room = roomArt(ctx, G, {prefix: P, rings: [], corrGaps: [{side: 'right', a: Hr + WALL + 14, b: Hr + WALL + CORR - 14, kind: 'open'}]});
    const tiles = sharedWin.map(s => ({slot: s, node: windowArt(ctx, G, s, {name: `${key}-win-${s}`})}));
    const people = routes.map((rt, i) => planPerson(ctx, {name: `${key}-p${i}`, look: rt.look}));
    const links = items.map((q, i) => (q.kind === 'window' ? linkLine(ctx, {name: `${key}-link${i}`, pts: q.pts}) : null));
    items.forEach((q, i) => { if (q.kind === 'window') q.link = {pts: q.pts}; });
    // bezel (B-kind change): a thick dark frame drawn on around the place; ring (A-kind change): a solid ring on the chair
    const pb = G.place.box;
    const bezelLen = 2 * (pb.w + pb.h - 2 * TILE.bezel);
    const bezel = h('rect', {name: `${key}-bezel`, x: r(pb.x + TILE.bezel / 2), y: r(pb.y + TILE.bezel / 2), width: r(pb.w - TILE.bezel), height: r(pb.h - TILE.bezel), rx: 10, fill: 'none', stroke: '#2f353c', 'stroke-width': TILE.bezel, 'stroke-dasharray': `${r(bezelLen + 4)} ${r(bezelLen + 10)}`, 'stroke-dashoffset': r(bezelLen), opacity: 0});
    const ringR = 50;
    const ringLen = 2 * Math.PI * ringR;
    const rs = focusRoomSlot ? G.slots[focusRoomSlot] : {x: 0, y: 0};
    const ring = h('circle', {name: `${key}-ring`, cx: r(rs.x), cy: r(rs.y), r: ringR, fill: 'none', stroke: th.accent2, 'stroke-width': 5, 'stroke-dasharray': `${r(ringLen + 2)} ${r(ringLen + 10)}`, 'stroke-dashoffset': r(ringLen), transform: `rotate(-90 ${r(rs.x)} ${r(rs.y)})`, opacity: 0});
    const labels = shared.slice();
    if (focusIndex >= 0) labels[focusIndex] = focusLab[ap];
    // outline of the focus participant's final place (for the guide), in scene-local design units
    const fB = focusIndex < 0 ? null : ap === 'room' ? (() => { const c = toD(G.slots[focusRoomSlot]); const rr = 62 * k; return {x: c.x - rr, y: c.y - rr, w: rr * 2, h: rr * 2, circle: true}; })() : (() => { const b = pf.mapBox(G.place.box); return {x: b.x - 8, y: b.y - 8, w: b.w + 16, h: b.h + 16}; })();
    const outline = fB ? g({name: `${key}-outline`, opacity: 0}, fB.circle
      ? h('circle', {cx: r(fB.x + fB.w / 2), cy: r(fB.y + fB.h / 2), r: r(fB.w / 2), fill: 'none', stroke: th.accent3, 'stroke-width': 5})
      : h('rect', {x: r(fB.x), y: r(fB.y), width: r(fB.w), height: r(fB.h), rx: 18, fill: 'none', stroke: th.accent3, 'stroke-width': 5})) : null;
    const seatNames = items.map(q => (q.kind === 'room' ? `${P}-chair-${q.focus ? focusRoomSlot : q.route.slot}` : q.place ? `${key}-place` : `${key}-win-${q.route.slot}`));
    scenes.push({key, at, pf, G, appears: ap, items, room, tiles, people, links, bezel, bezelLen, ring, ringLen, placeNode: placeArt(ctx, G, key), labels, doorChip, outline, outlineBox: fB, seatNames, focusIndex,
      toScreen: q => { const d = toD(q); return {x: d.x + at.x, y: d.y + at.y}; }});
    // header
    const color = si ? th.accent4 : th.accent2;
    const hx = x0 + Math.max(0, (panelW - onW) / 2), hy = top;
    const {lab, capt, beside} = hdrFits[si];
    const tx = hx + badgeR * 2 + 16;
    const parts = [h('circle', {cx: r(hx + badgeR), cy: r(hy + badgeR + 2), r: r(badgeR), fill: color, stroke: th.ink, 'stroke-width': 2.5})];
    if (showKey) parts.push(textAt({lines: [key], size: F * 1.05, weight: 800, lineHeight: 0}, hx + badgeR, hy + badgeR + 2 - F * 0.42, '#ffffff', 'middle'));
    const labelParts = [];
    if (lab) labelParts.push(textAt(lab, tx, hy + 2, th.fg, 'start'));
    if (capt) labelParts.push(textAt(capt, beside ? tx + lab.width + 20 : tx, beside ? hy + 2 + (lab.size - capt.size) * 0.8 : hy + 2 + lab.height + F * 0.3, th.fgSoft, 'start'));
    const tw2 = badgeR * 2 + 16 + Math.max(lab ? lab.width + (beside && capt ? capt.width + 20 : 0) : 0, capt && !beside ? capt.width : 0);
    headers.push({name: `hdr${si}`, box: {x: hx, y: hy, w: panelW, h: headerH - F * 0.3}, textBox: {x: hx, y: hy, w: tw2, h: headerH - F * 0.3}, node: g({name: `hdr${si}`}, parts, g({name: `hdr${si}-label`, opacity: 0}, labelParts))});
  });
  // ---- shared strip / centre column
  const stripTop = arrangement === 'column' ? panelH + gap / 2 + 9 : D.h - (plan ? plan.height : 0) - F * 0.35;
  let strip = center ? buildCenter(ctx, p, {F, colW, D, bldH0, ...centerTexts}) : plan ? plan.render(stripTop) : {node: null, guideBox: null, problem: 'strip', frame: () => ({})};
  const guideFit = center ? centerTexts.guideFit : plan ? plan.guideFit : null;
  const changedFit = center ? centerTexts.changedFit : plan ? plan.changedFit : null;
  if (strip.problem) problems.push(strip.problem);
  // ---- guide: one chip, a routed leader to each outline (design units), clear of texts, people and windows
  let guide = null;
  if (withGuide && showKey && guideFit && focusIndex >= 0 && strip.guideBox) {
    const parts = [];
    const obstacles = [];
    const addBox = (b, pad = 4, w = 1000, tag = '') => obstacles.push({x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad, w8: w, tag});
    for (const hd of headers) addBox(hd.textBox, 6, 1000, 'hdr');
    for (const S of scenes) {
      const sh = b => ({x: b.x + S.at.x, y: b.y + S.at.y, w: b.w, h: b.h});
      for (const lb of S.labels) if (lb) addBox(sh(lb.box), 6, 1000, S.key + '-lab');
      if (S.doorChip) addBox(sh(S.doorChip.box), 6, 1000, S.key + '-door');
      for (const it of S.items) { const c = S.toScreen(it.seatPt); addBox({x: c.x - rad * 0.8, y: c.y - rad * 0.8, w: rad * 1.6, h: rad * 1.6}, 2, 1000, S.key + '-person'); }
      for (const w of Object.values(S.G.win)) addBox(sh(S.pf.mapBox(w.box)), 2, 1000, S.key + '-win');
      if (S.appears !== 'window') addBox(sh(S.pf.mapBox(S.G.place.box)), 2, 400);
    }
    // the wall lines of both plans: a leader may cross a wall but must not run along one (per-sample cost)
    const wallSegs = [];
    for (const S of scenes) {
      const sh = b => ({x: b.x + S.at.x, y: b.y + S.at.y, w: b.w, h: b.h});
      for (const b0 of [{x: -WALL / 2, y: -WALL / 2, w: S.G.W + WALL, h: S.G.H + WALL}, {x: -WALL / 2, y: -WALL / 2, w: S.G.W + WALL, h: S.G.H + 2.5 * WALL + CORR}]) {
        const b = sh(S.pf.mapBox(b0));
        wallSegs.push([b.x, b.y, b.x + b.w, b.y], [b.x, b.y + b.h, b.x + b.w, b.y + b.h], [b.x, b.y, b.x, b.y + b.h], [b.x + b.w, b.y, b.x + b.w, b.y + b.h]);
      }
    }
    const nearWall = q => wallSegs.some(([x1, y1, x2, y2]) => (x1 === x2 ? Math.abs(q.x - x1) < 12 && q.y > Math.min(y1, y2) - 12 && q.y < Math.max(y1, y2) + 12 : Math.abs(q.y - y1) < 12 && q.x > Math.min(x1, x2) - 12 && q.x < Math.max(x1, x2) + 12));
    // the shared texts (strip or centre column) around the chip
    const textArea = center ? {x: (D.w - colW) / 2, y: 0, w: colW, h: D.h} : {x: 0, y: stripTop, w: D.w, h: plan ? plan.height : 0};
    const routeFor = cb => {
    const inChip = q => q.x > cb.x - 16 && q.x < cb.x + cb.w + 16 && q.y > cb.y - 16 && q.y < cb.y + cb.h + 16;
    const cost = (pts, target) => {
      let hits = 0, len = 0;
      const seen = new Set();
      for (let i = 1; i < pts.length; i++) {
        const a2 = pts[i - 1], b2 = pts[i];
        const L2 = Math.hypot(b2.x - a2.x, b2.y - a2.y);
        len += L2;
        const n = Math.max(1, Math.ceil(L2 / 5));
        for (let j = 0; j <= n; j++) {
          const q = {x: a2.x + ((b2.x - a2.x) * j) / n, y: a2.y + ((b2.y - a2.y) * j) / n};
          if (q.x < 0 || q.y < 0 || q.x > D.w || q.y > D.h) hits += 1000;
          if (!inChip(q) && q.x > textArea.x - 8 && q.x < textArea.x + textArea.w + 8 && q.y > textArea.y - 12 && q.y < textArea.y + textArea.h + 8) { if (!seen.has('txt')) { seen.add('txt'); hits += 1000; } }
          const endZone = Math.hypot(q.x - pts[pts.length - 1].x, q.y - pts[pts.length - 1].y) < 6;
          if (nearWall(q)) hits += 4;
          if (!endZone && q.x > target.x + 3 && q.x < target.x + target.w - 3 && q.y > target.y + 3 && q.y < target.y + target.h - 3) { if (!seen.has('tgt')) { seen.add('tgt'); hits += 1000; } }
          obstacles.forEach((o, oi) => { if (!seen.has(oi) && q.x > o.x && q.x < o.x + o.w && q.y > o.y && q.y < o.y + o.h && !(target.x <= o.x && target.y <= o.y && target.x + target.w >= o.x + o.w && target.y + target.h >= o.y + o.h)) { seen.add(oi); hits += o.w8; } });
        }
      }
      return hits + len * 0.2 + (pts.length - 2) * 25;
    };
    const leads = [];
    let total = 0;
    for (const S of scenes) {
      const o = S.outlineBox;
      const ob = {x: o.x + S.at.x, y: o.y + S.at.y, w: o.w, h: o.h};
      const oc = {x: ob.x + ob.w / 2, y: ob.y + ob.h / 2};
      const tAnch = [{x: oc.x, y: ob.y}, {x: oc.x, y: ob.y + ob.h}, {x: ob.x, y: oc.y}, {x: ob.x + ob.w, y: oc.y}];
      const cAnch = [{x: cb.x + cb.w / 2, y: cb.y}, {x: cb.x + cb.w / 2, y: cb.y + cb.h}, {x: cb.x, y: cb.y + cb.h / 2}, {x: cb.x + cb.w, y: cb.y + cb.h / 2}, {x: cb.x + cb.w * 0.2, y: cb.y}, {x: cb.x + cb.w * 0.8, y: cb.y}];
      const grid = n => Array.from({length: n}, (_, i) => (i + 0.5) / n);
      const Ys = [...grid(14).map(f => f * D.h), cb.y - 28, cb.y + cb.h + 28, ...scenes.flatMap(T2 => [T2.at.y + T2.pf.rect.y - 14, T2.at.y + T2.pf.rect.y + T2.pf.rect.h + 14])];
      const Xs = [...grid(14).map(f => f * D.w), 8, D.w - 8, cb.x - 28, cb.x + cb.w + 28, ...scenes.flatMap(T2 => [T2.at.x + T2.pf.rect.x - 14, T2.at.x + T2.pf.rect.x + T2.pf.rect.w + 14])];
      let bestL = null;
      for (const A of cAnch) for (const B of tAnch) {
        const forms = [[A, B], [A, {x: B.x, y: A.y}, B], [A, {x: A.x, y: B.y}, B], ...Ys.map(y => [A, {x: A.x, y}, {x: B.x, y}, B]), ...Xs.map(x => [A, {x, y: A.y}, {x, y: B.y}, B])];
        for (const f of forms) {
          const c = cost(f, ob);
          if (!bestL || c < bestL.c) bestL = {pts: f, c};
        }
      }
      total += bestL.c;
      leads.push(bestL.pts);
    }
    return {leads, total};
    };
    // the chip position (strip under / between the scenes) whose leaders cross the least wins
    let pickR = null;
    for (const pos of center ? [null] : arrangement === 'column' ? ['right', 'left', 'mid'] : ['mid', 'left', 'right']) {
      const st = center ? strip : plan.render(stripTop, pos);
      const rr = routeFor(st.guideBox);
      if (!pickR || rr.total < pickR.total - 1) pickR = {...rr, st};
    }
    strip = pickR.st;
    const cb = strip.guideBox;
    const leads = pickR.leads;
    if (pickR.total >= 1000) problems.push('guide-route');
    const dOf = pts => pts.map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
    for (const [i, ld] of leads.entries()) parts.push(h('path', {name: `guide-lead${i}`, d: dOf(ld), fill: 'none', stroke: th.accent3, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    parts.push(h('path', {name: 'guide-card', d: roundRectPath(cb.x, cb.y, cb.w, cb.h, 12), fill: th.card, stroke: th.accent3, 'stroke-width': 3}));
    parts.push(textAt(guideFit, cb.x + cb.w / 2, cb.y + F * 0.45, th.ink, 'middle'));
    parts.push(textAt(changedFit, cb.x + cb.w / 2, cb.y + F * 0.45 + guideFit.height + F * 0.5, th.inkSoft, 'middle'));
    guide = {node: g({name: 'guide', opacity: 0}, parts), box: cb, leads};
  }
  return {F, px, k, rot, colF, scenes, headers, strip, guide, arrangement, personPx, problems, rad, dbg: DBG, dims: {stripH: Math.round(stripH), headerH: Math.round(headerH), stage: Math.round(stage.h), share: +(drawnW / frameW).toFixed(3)}};
}

/** Shared texts in the centre column between the two scenes (landscape). */
function buildCenter(ctx, p, o) {
  const th = ctx.theme;
  const {F, colW, D, names, facts, sharedHead, neutralFit, keyFit, chipW, chipH, bldH0} = o;
  const parts = [];
  const noteParts = [];
  let guideBox = null;
  let problem = null;
  const bw = bldH0 * 0.95;
  const x0 = (D.w - colW) / 2;
  let y = 0;
  parts.push(buildingElevation(ctx, {name: 'st-bld', x: x0 + (colW - bw) / 2, y, w: bw, h: bldH0, highlight: {floor: 1, bay: 3}, tree: false}).node);
  y += bldH0 + F * 0.6;
  if (names) { parts.push(textAt(names, x0 + colW / 2, y, th.fg, 'middle')); y += names.height + F * 0.8; }
  const restH = (chipH ? chipH + F * 1.0 : 0) + (sharedHead ? sharedHead.height + F * 0.3 : 0) + facts.reduce((a, f) => a + f.height + F * 0.3, 0) + F * 0.6 + (neutralFit ? neutralFit.height + F * 0.6 : 0) + (keyFit ? keyFit.height : 0);
  y += Math.max(0, (D.h - y - restH) / 2);
  if (chipH) { guideBox = {x: x0 + (colW - chipW) / 2, y, w: chipW, h: chipH}; y += chipH + F * 1.0; }
  if (sharedHead) { parts.push(textAt(sharedHead, x0, y, th.fg, 'start')); y += sharedHead.height + F * 0.3; }
  for (const f of facts) { parts.push(factRow(ctx, f, x0, y, F)); y += f.height + F * 0.3; }
  y += F * 0.6;
  if (neutralFit) { noteParts.push(textAt(neutralFit, x0, y, th.fg, 'start')); y += neutralFit.height + F * 0.6; }
  if (keyFit) { noteParts.push(textAt(keyFit, x0, y, th.fgSoft, 'start', true)); y += keyFit.height; }
  if (y > D.h + 0.5) problem = 'strip';
  return {node: g({name: 'strip'}, parts, g({name: 'notes', opacity: 0}, noteParts)), guideBox, problem, frame: u => ({notes: {opacity: r(seg(u, ...W.notes), 3)}})};
}

/**
 * Strip under the scenes (row / column): the lowest of a one-row layout (building + names | shared facts |
 * guide chip | note + key) and a two-row layout (building + names | guide chip, then facts | note + key).
 * Returns {height, render(top), guideFit, changedFit} or null when a text would be cut.
 */
function stripPlan(ctx, p, F, Wd, bldH, showKey, showAll, chipLast = false) {
  const gapC = F * 1.1;
  const bw = bldH * 0.95;
  const fitsFor = w => {
    const names = showKey ? fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: w.c1, size: F, minSize: F, maxLines: 4, weight: 600}) : null;
    const sharedHead = showAll && p.sharedFacts.length ? fitWords(ctx.t.shared, {maxWidth: w.c2, size: F, minSize: F, maxLines: 1, weight: 700}) : null;
    const facts = showAll ? p.sharedFacts.map(f => fitWords(glue(f), {maxWidth: w.c2 - F * 1.2, size: F, minSize: F, maxLines: 4, weight: 500})) : [];
    const guideFit = showKey ? fitWords(glue(p.comparisonLabels.guide), {maxWidth: w.c3 - F * 1.4, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
    const changedFit = showKey ? fitWords(glue(p.changedFact), {maxWidth: w.c3 - F * 1.4, size: F, minSize: F, maxLines: 5, weight: 500}) : null;
    const neutralFit = showKey ? fitWords(glue(p.comparisonLabels.neutral), {maxWidth: w.c4, size: F, minSize: F, maxLines: 6, weight: 500}) : null;
    const keyFit = showKey ? fitWords(glue(p.labels.key), {maxWidth: w.c4, size: F, minSize: F, maxLines: 4, weight: 500}) : null;
    const all = [names, sharedHead, guideFit, changedFit, neutralFit, keyFit, ...facts].filter(Boolean);
    if (all.some(f => f.truncated)) return null;
    const h1 = bldH + (names ? F * 0.4 + names.height : 0);
    const h2 = (sharedHead ? sharedHead.height + F * 0.3 : 0) + facts.reduce((a, f) => a + f.height + F * 0.3, 0);
    const chipW = guideFit ? Math.max(guideFit.width, changedFit.width) + F * 1.4 : 0;
    const h3 = guideFit ? guideFit.height + changedFit.height + F * 1.4 : 0;
    const h4 = (neutralFit ? neutralFit.height + F * 0.5 : 0) + (keyFit ? keyFit.height : 0);
    return {names, sharedHead, facts, guideFit, changedFit, neutralFit, keyFit, h1, h2, h3, h4, chipW};
  };
  let best = null;
  const avail = Wd - gapC * 3;
  for (const fr of [[0.2, 0.3, 0.24, 0.26], [0.18, 0.34, 0.22, 0.26], [0.22, 0.26, 0.24, 0.28], [0.16, 0.3, 0.26, 0.28]]) {
    const w = {c1: Math.max(bw, avail * fr[0]), c2: avail * fr[1], c3: avail * fr[2], c4: avail * fr[3]};
    const f = fitsFor(w);
    if (!f) continue;
    const height = Math.max(f.h1, f.h2, f.h3, f.h4);
    if (!best || height < best.height) best = {kind: 'row', w, f, height};
  }
  {
    const half = (Wd - gapC) / 2;
    const w = {c1: half, c2: half, c3: half, c4: half};
    const f = fitsFor(w);
    if (f) {
      const height = Math.max(f.h1, f.h3) + F * 0.8 + Math.max(f.h2, f.h4);
      if (!best || height < best.height) best = {kind: 'grid', w, f, height};
    }
  }
  if (!best) return null;
  const th = ctx.theme;
  const {f, w} = best;
  const render = (top, chipPos) => {
    const parts = [];
    const noteParts = [];
    const col = (kind, x, y) => {
      if (kind === 'c1') {
        parts.push(buildingElevation(ctx, {name: 'st-bld', x, y, w: bw, h: bldH, highlight: {floor: 1, bay: 3}, tree: false}).node);
        if (f.names) parts.push(textAt(f.names, x, y + bldH + F * 0.4, th.fg, 'start'));
      } else if (kind === 'c2') {
        let yy = y;
        if (f.sharedHead) { parts.push(textAt(f.sharedHead, x, yy, th.fg, 'start')); yy += f.sharedHead.height + F * 0.3; }
        for (const ff of f.facts) { parts.push(factRow(ctx, ff, x, yy, F)); yy += ff.height + F * 0.3; }
      } else if (kind === 'c4') {
        let yy = y;
        if (f.neutralFit) { noteParts.push(textAt(f.neutralFit, x, yy, th.fg, 'start')); yy += f.neutralFit.height + F * 0.5; }
        if (f.keyFit) noteParts.push(textAt(f.keyFit, x, yy, th.fgSoft, 'start', true));
      }
    };
    let guideBox = null;
    const chipH = f.h3;
    const pos = chipPos || (chipLast ? 'right' : 'mid');
    if (best.kind === 'row') {
      let x = 0;
      if (pos === 'left') { if (f.guideFit) guideBox = {x: 0, y: top, w: f.chipW, h: chipH}; x += w.c3 + gapC; }
      col('c1', x, top); x += w.c1 + gapC;
      col('c2', x, top); x += w.c2 + gapC;
      if (pos === 'mid') { if (f.guideFit) guideBox = {x: x + (w.c3 - f.chipW) / 2, y: top, w: f.chipW, h: chipH}; x += w.c3 + gapC; }
      col('c4', x, top); x += w.c4 + gapC;
      if (pos === 'right' && f.guideFit) guideBox = {x: Wd - f.chipW, y: top, w: f.chipW, h: chipH};
    } else {
      const half = w.c1;
      col('c1', pos === 'left' ? half + gapC : 0, top);
      if (f.guideFit) guideBox = {x: pos === 'left' ? 0 : pos === 'right' ? Wd - f.chipW : half + gapC + (half - f.chipW) / 2, y: top, w: f.chipW, h: chipH};
      const y2 = top + Math.max(f.h1, f.h3) + F * 0.8;
      col('c2', 0, y2);
      col('c4', half + gapC, y2);
    }
    return {node: g({name: 'strip'}, parts, g({name: 'notes', opacity: 0}, noteParts)), guideBox, problem: null, frame: u => ({notes: {opacity: r(seg(u, ...W.notes), 3)}})};
  };
  return {height: best.height, render, guideFit: f.guideFit, changedFit: f.changedFit};
}

function factRow(ctx, f, x, y, F) {
  const th = ctx.theme;
  return g(null, h('circle', {cx: r(x + F * 0.35), cy: r(y + F * 0.55), r: r(F * 0.2), fill: th.fgSoft}), textAt(f, x + F * 1.2, y, th.fg, 'start'));
}

function textAt(fit, x, y, fill, anchor = 'start', italic = false) {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': italic ? 'italic' : undefined, 'text-anchor': anchor, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

const base = defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-04-contrast',
    title: 'Physical and remote room — the same hearing with one participant in the room or in a window',
    titleEs: 'Sala física y remota — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Sala física y remota',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical plans of the same generic hearing room. The only changed fact is where one participant appears, as supplied: in A a ring marks their chair and they walk from their own place through the corridor and door to sit in the room; in B a screen bezel frames their own place and the bench draws a solid link to it, and they sit at their desk. Everything else — the other people, the shared window and its link, the timing, sizes and label style — is the same. A guide names the changed fact; no winner, validity or outcome is shown.',
    tags: ['contrast', 'floor plan', 'hearing room', 'remote window', 'in person', 'link', 'bench', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/sala-fisica-remota.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});

// The combination rules are enforced wherever parameters enter: create(), evaluate() and setParams() reject a
// combination outside them with a ParamError listing every problem (the gallery shows these next to the fields).
const checkCombo = merged => {
  // field errors first (the same messages the core would give), then the combination rules
  const fp = validate(base.paramsSchema, merged);
  if (fp.length) throw new ParamError(fp);
  const pr = contrastProblems(merged);
  if (pr.length) throw new ParamError(pr);
};
const mergedWith = (cur, patch) => (patch && Object.keys(patch).length ? applyPatch(cur, patch, base.paramsSchema) : cur);
export default Object.freeze({
  ...base,
  create(container, options = {}) {
    checkCombo(mergedWith(base.defaultParams, options.params));
    const inst = base.create(container, options);
    const set = inst.setParams;
    inst.setParams = patch => { checkCombo(mergedWith(inst.getState({bounds: false}).params, patch)); return set(patch); };
    return inst;
  },
  evaluate(o = {}) {
    checkCombo(mergedWith(base.defaultParams, o.params));
    return base.evaluate(o);
  },
});
