/**
 * LAW-0204 — Distribución de una sala · inspect
 *
 * Storyboard (the context is the state produced by the story: the plan of the
 * generic room inside its building, everyone seated, every seat labelled):
 *  0.00–0.20  build: the seated plan fills the frame beside a panel (building,
 *             names, key, context caption); the inspected seat carries its label
 *             and, under it, the supplied value that will change (e.g. "Seat:
 *             right table, aisle side").
 *  0.20–0.45  isolate: a frame settles on the inspected detail (the table, the
 *             person, the label and the value); the texts on the plan fade, the
 *             whole plan shrinks into a corner of its area and a lens opens in the
 *             freed space (never over anyone): a REAL enlarged copy of the same
 *             plan coordinates, tied to the frame by two guides. Furniture enters
 *             the lens whole or not at all.
 *  0.45–0.75  substitute ONE datum: the old value is struck through (every
 *             line), turns grey and docks under the chip as "was: …"; only the
 *             dependent geometry follows — for a seat substitution the person
 *             stands, moves to the supplied seat at the same table and sits, and
 *             the label's leader re-attaches; for a label substitution nobody
 *             moves. The seat label itself is never replaced: the substituted
 *             value has its own chip. The new value stays still in the lens.
 *  0.75–1.00  return: the lens closes, the plan grows back to fill its area with
 *             the new state, the struck old value and a neutral changed-datum
 *             marker (Δ); a note in the panel repeats the marker. Seeking back
 *             restores the old datum exactly.
 * Nothing about validity, rank, procedure or outcome is inferred.
 * @module animations/courts/LAW-0204
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {planPerson, buildingElevation} from './kits/courts-art.js';
import {
  salaFields, SALA_EN, SALA_STRINGS, SLOTS, resolveSala, roomGeometry, fitRoom, walkerAt, roomArt, furnitureBoxes, placeSeatLabels, placeFree,
  seatLabelNode, seatObstacles, bodyBox, gchip, glue, fitWords, pxPerUnit, overlaps, R2, PERSON_RAD, roundCorners,
} from './kits/distribucion-de-sala.js';

const ID = 'LAW-0204';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  caption: [0.03, 0.1], frame: [0.2, 0.24], textOut: [0.2, 0.225], shrink: [0.215, 0.28], open: [0.28, 0.36],
  strike: [0.46, 0.5], dock: [0.51, 0.55], move: [0.55, 0.62], newIn: [0.62, 0.65], newInStill: [0.555, 0.585],
  close: [0.72, 0.77], grow: [0.77, 0.83], textIn: [0.83, 0.855], marker: [0.855, 0.89],
};

const STRINGS = {
  en: {...SALA_STRINGS.en},
  es: {...SALA_STRINGS.es},
};

const sceneSchema = {
  ...salaFields,
  focusSeat: int('Which seat (index in `seats`) is inspected', 0, 5),
  afterSlot: oneOf('Seat substitution: the supplied new position of the inspected person (a free position at a table)', SLOTS),
  focusTarget: oneOf('Detail that is substituted: seat = the supplied seat datum (the person moves to afterSlot); label = the label text given to the inspected seat (nobody moves). The seat label itself stays drawn in its own chip', ['seat', 'label']),
  beforeValue: str('Value shown before the substitution, in its own chip under the seat label (seat: the seat datum; label: the label text before)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum), in the same chip', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens, relative to the context it is taken from', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  ...SALA_EN,
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'right1', label: 'Participant B'},
    {slot: 'back1', label: 'Public seat'},
  ],
  routes: [{seat: 1, door: 'main'}, {seat: 2, door: 'main'}, {seat: 0, door: 'side'}, {seat: 3, door: 'main'}],
  focusSeat: 2,
  afterSlot: 'right2',
  focusTarget: 'seat',
  beforeValue: 'Seat: right table, aisle side',
  afterValue: 'Seat: right table, wall side',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Seating as placed on the plan', marker: 'Changed: one supplied seat datum'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const cols = shape === 'landscape' ? [0.24, 0.27, 0.3] : shape === 'square' ? [0.22, 0.25, 0.28, 0.31] : [0.2, 0.24, 0.28, 0.32];
    let best = null;
    const log = [];
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      for (const colF of cols) {
        for (const [orient, sw] of [['below', 330], ['beside', 330], ['below', 240], ['beside', 260], ['below', 200]]) {
          const L = compose(ctx, p, v / px, px, colF, orient, sw);
          log.push(`${v}/${colF}/${orient}/${sw}:${L.problems.join('+')}`);
          if (!best || L.problems.length < best.problems.length) best = L;
          if (!L.problems.length) { L.log = log; return L; }
        }
      }
    }
    best.log = log;
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const world = g({name: 'world'},
      g({transform: T(L.ox, L.oy, 0, L.k)}, L.room.node, L.people.map(pp => pp.node)),
      // texts on the plan: faded out while the plan is small (the lens shows them enlarged)
      g({name: 'world-text'},
        L.roomChip && L.roomChip.node,
        L.doorChips.map((d, i) => seatLabelNode(ctx, d.L, {name: `door-cap${i}`, size: L.Fc, color: th.inkSoft})),
        L.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: `rm-chair-${L.slots[i]}`}))),
      L.marker,
      h('rect', {name: 'src-frame', x: r(L.crop.x), y: r(L.crop.y), width: r(L.crop.w), height: r(L.crop.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', opacity: 0}),
    );
    return g(null,
      world,
      // the inspected label and its value chips: drawn at screen size and anchored to the (moving) person, so
      // the new value and the struck old one stay readable (>= 16 px) while the plan shrinks and grows back
      g({name: 'cx-wrap'}, L.stack.node('cx')),
      L.panel.node,
      L.guides.map((gd, i) => h('line', {name: `guide${i}`, x1: r(gd.a.x), y1: r(gd.a.y), x2: r(gd.b.x), y2: r(gd.b.y), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0})),
      // the lens: an opaque window with a real enlarged copy of the same plan coordinates
      g({name: 'lens', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18}))),
        h('rect', {x: r(L.dest.x + 6), y: r(L.dest.y + 10), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: '#f5efe3'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(L.dest.x - L.crop.x * L.zoom, L.dest.y - L.crop.y * L.zoom)} scale(${r(L.zoom, 4)})`},
            g({transform: T(L.ox, L.oy, 0, L.k)}, L.lzRoom.node, L.lzPeople.map((pp, i) => (L.lzShow[i] ? pp.node : null))),
            L.lzChips.map(c => seatLabelNode(ctx, c.L, {name: c.name, size: c.size, color: c.color, owner: c.owner})),
            L.stack.node('lz'))),
        h('rect', {x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    // the plan shrinks into its corner while the lens is open, and grows back to fill its area
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, L.sT, sh);
    const off = {x: lerp(0, L.offT.x, sh), y: lerp(0, L.offT.y, sh)};
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    nodes.world = {transform: `${T(off.x, off.y)} scale(${r(sc, 4)})`};
    // texts on the plan scale with it: each stays while it is still >= 16 px, and fades only below that
    const textOp = L.F * L.px * sc >= 16 - 1e-6 ? 1 : 0;
    nodes['world-text'] = {opacity: r(textOp, 3)};
    // the people: seated; the inspected one moves to the supplied seat during the move window
    const mv = L.moves ? seg(u, ...W.move) : 0;
    const poses = L.seatsAt.map((q, i) => {
      if (i !== L.fi || !L.moves) return {x: q.x, y: q.y, deg: q.deg, phase: 0, walk: 0, seated: 1, state: 'seated'};
      const st = walkerAt(L.mover, mv, {walkEnd: 0.86, reduced: ctx.reduced});
      // stands up first (seated 1 → 0 over the first sixth), then walks and sits again
      const up = mv > 0 && mv < 1 ? Math.min(1, mv / 0.16) : 0;
      return {...st, seated: mv <= 0 ? 1 : mv >= 1 ? 1 : st.seated > 0 ? st.seated : 1 - up};
    });
    poses.forEach((ps, i) => {
      const pose = {x: ps.x, y: ps.y, deg: ps.deg, phase: ps.phase, walk: ps.walk, seated: ps.seated, scale: L.ps};
      Object.assign(nodes, L.people[i].pose(pose), L.lzShow[i] ? L.lzPeople[i].pose(pose) : {});
    });
    // focus label leader follows the inspected person (plan coordinates)
    const fp = poses[L.fi];
    const fd = {x: L.ox + fp.x * L.k, y: L.oy + fp.y * L.k};
    Object.assign(nodes, L.stack.frame(u, fd, L.rad));
    // the stack follows the person at screen size (never below 16 px); hidden only while the lens (which holds
    // its enlarged copy) is open
    const ss = Math.min(1, Math.max(sc, 16.5 / (L.F * L.px)));
    const ps0 = wt(fd);
    L.labels.forEach((sl, i) => { if (sl) { nodes[`lab${i}`] = {opacity: 1}; nodes[`lab${i}-text`] = {opacity: 1}; } });
    L.doorChips.forEach((d, i) => { nodes[`door-cap${i}`] = {opacity: 1}; });
    L.lzChips.forEach(c => { nodes[c.name] = {opacity: 1}; nodes[`${c.name}-text`] = {opacity: 1}; });
    for (const dn of Object.keys(L.room.doors)) Object.assign(nodes, L.room.doors[dn].frame(0));
    for (const dn of Object.keys(L.lzRoom.doors)) Object.assign(nodes, L.lzRoom.doors[dn].frame(0));
    // isolate: frame on the (shrinking) plan, guides and the lens (opens in place at its destination)
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1], W.close[1] + 0.03));
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const ls = 0.6 + 0.4 * open;
    const lc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
    L.guides.forEach((gd, i) => {
      nodes[`guide${i}`] = {x2: r(lc.x + (gd.b.x - lc.x) * ls), y2: r(lc.y + (gd.b.y - lc.y) * ls), opacity: r(Math.min(fr, open > 0.05 ? 1 : 0), 3)};
    });
    nodes.lens = {opacity: r(open, 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    nodes['cx-wrap'] = {transform: `${T(ps0.x, ps0.y)} scale(${r(ss, 4)}) ${T(-fd.x, -fd.y)}`, opacity: r(1 - open, 3)};
    nodes['cx-marker'] = {opacity: r(seg(u, ...W.marker), 3)};
    Object.assign(nodes, L.panel.frame(u));
    // (square) the panel band steps aside while the lens reaches over it
    nodes.panel = {opacity: r(L.lensOverPanel ? 1 - open : 1, 3)};
    const strike = seg(u, ...W.strike), dock = seg(u, ...W.dock), newIn = seg(u, ...(L.moves ? W.newIn : W.newInStill));
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const people = poses.map(q => wt({x: L.ox + q.x * L.k, y: L.oy + q.y * L.k}));
    const rr = L.rad * sc;
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(open, 3),
        contextScale: r(sc, 3),
        textOnPlan: r(textOp, 3),
        valueScale: r(ss, 3),
        valueShown: r(1 - open, 3),
        datum,
        strike: r(strike, 3),
        oldDocked: r(dock, 3),
        newShown: r(newIn, 3),
        focusTarget: p.focusTarget,
        personSlot: !L.moves ? L.beforeSlot : mv >= 1 ? L.afterSlot : mv <= 0 ? L.beforeSlot : 'moving',
        person: R2(wt(fd)),
        seatBefore: R2(wt(L.beforeD)),
        seatAfter: R2(wt(L.afterD)),
        moves: L.moves,
        // magnification of the lens relative to the context it is taken from (the shrunk plan)
        zoom: r(L.zoom / L.sT, 2),
        lensScale: r(L.zoom, 3),
        crop: {x: r(L.crop.x), y: r(L.crop.y), w: r(L.crop.w), h: r(L.crop.h)},
        stackInCrop: L.stackInCrop,
        lensClearOfPeople: open === 0 || people.every(q => !overlaps(L.dest, {x: q.x - rr, y: q.y - rr, w: 2 * rr, h: 2 * rr}, 0)),
        lensClearOfSource: !overlaps(L.dest, L.cropShrunk, 0),
        lensClearOfPlan: !overlaps(L.dest, L.planShrunk, 0),
        guidesClear: L.guidesClear,
        markerShown: r(seg(u, ...W.marker), 3),
        markerClearOfHeads: L.markerClear,
        others: L.seatsAt.map((q, i) => (i === L.fi ? null : R2(wt({x: L.ox + q.x * L.k, y: L.oy + q.y * L.k})))),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        log: L.log,
      },
    };
  },
};

/** One composition at text size F; colF = panel share (column width, or band height when tall). */
function compose(ctx, p, F, px, colF, orient, sw) {
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const Fc = Math.max(16.6 / px, F * 0.8);
  const {seats, routes} = resolveSala(ctx, p);
  // ---- regions: the plan fills its area; the panel beside it (column) or under it (band)
  const band = shape !== 'landscape';
  const panelBox = band ? {x: 0, y: D.h * (1 - colF), w: D.w, h: D.h * colF} : {x: D.w * (1 - colF), y: 0, w: D.w * colF, h: D.h};
  const planBox = band ? {x: 0, y: 0, w: D.w, h: D.h * (1 - colF) - 26} : {x: 0, y: 0, w: D.w * (1 - colF) - 30, h: D.h};
  // ---- plan (the story's end state: everyone seated)
  const {W: RW, H: RH, k} = fitRoom(planBox);
  const G = roomGeometry(RW, RH);
  const E = G.extents;
  const ox = planBox.x + (planBox.w - E.w * k) / 2 - E.x * k;
  const oy = planBox.y + (planBox.h - E.h * k) / 2 - E.y * k;
  const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
  const planRect = {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k};
  const ps = clamp(62 / (100 * k * px), 1, 1.3); // people >= 60 px even on the smallest plan
  const rad = PERSON_RAD * k * ps;
  const personPx = 100 * k * ps * px;
  if (personPx < 60) problems.push('small');
  const occupied = new Set(routes.map(rt => rt.slot));
  const fiSeat = seats.find(s => s.index === p.focusSeat) || seats[0];
  const fi = Math.max(0, routes.findIndex(rt => rt.slot === fiSeat.slot));
  const beforeSlot = routes[fi] ? routes[fi].slot : fiSeat.slot;
  const afterOk = p.focusTarget === 'seat' && p.afterSlot !== beforeSlot && !occupied.has(p.afterSlot);
  const afterSlot = afterOk ? p.afterSlot : beforeSlot;
  const moves = afterOk;
  const seatsAt = routes.map(rt => ({...G.slots[rt.slot]}));
  const room = roomArt(ctx, G, {prefix: 'rm', emptyRings: []});
  const people = routes.map((rt, i) => planPerson(ctx, {name: `p${i}`, look: rt.look}));
  const lzPeople = routes.map((rt, i) => planPerson(ctx, {name: `lz-p${i}`, look: rt.look}));
  // the move: stand, step back into the aisle, along it, into the new chair (same table)
  const B = G.slots[beforeSlot], A = G.slots[afterSlot];
  const aisleY = Math.max(B.y, A.y) + 70;
  const sameRow = Math.abs(B.y - A.y) < 2;
  const mover = {poly: polyline(sameRow ? [{x: B.x, y: B.y}, {x: (B.x + A.x) / 2, y: B.y + 10}, {x: A.x, y: A.y}] : roundCorners([{x: B.x, y: B.y}, {x: B.x, y: aisleY}, {x: A.x, y: aisleY}, {x: A.x, y: A.y}], 30)), spot: {deg: B.deg}, seat: {x: A.x, y: A.y, deg: A.deg}};
  const beforeD = toD(B), afterD = toD(A);
  const mapB = f => ({x: ox + f.x * k, y: oy + f.y * k, w: f.w * k, h: f.h * k});
  const furnAll = furnitureBoxes(G);
  const furn = furnAll.filter(f => f.kind !== 'chair' || !occupied.has(f.slot)).map(mapB);
  // pieces the inspected stack must not cover: desk, tables, bench, plants and empty chairs (not the two seats it serves)
  // (the chair the inspected person leaves is empty at the end: it counts too)
  const stackHard = furnAll.filter(f => f.kind !== 'chair' || ((!occupied.has(f.slot) || (moves && f.slot === beforeSlot)) && f.slot !== afterSlot)).map(mapB);
  const roomBox = {x: ox + 4 * k, y: oy + 4 * k, w: (RW - 8) * k, h: (RH - 8) * k};
  const everyone = [...routes.map(rt => ({...toD(G.slots[rt.slot]), rad})), {...afterD, rad}];
  // ---- the inspected stack: the seat label chip + the value chip (before → after) + the dock for the old value
  const stack = focusStack(ctx, {F, px, orient, sw, moves, labelText: fiSeat.label, before: p.beforeValue, after: p.afterValue, was: ctx.t.was, showKey});
  if (stack.problem) problems.push(stack.problem);
  // placed within 40 px of the person at BOTH seats (the leader re-attaches when they move)
  const M = {x: (beforeD.x + afterD.x) / 2, y: (beforeD.y + afterD.y) / 2};
  const half = Math.hypot(beforeD.x - afterD.x, beforeD.y - afterD.y) / 2;
  const path = mover.poly.pts.map(toD);
  let stackAt = null;
  if (showKey) {
    let bestS = null;
    for (const gap of [8, 16, 26, 36]) {
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) {
        const w = stack.w, hh = stack.h;
        const cx = M.x + dx * (half + rad + gap + w / 2), cy = M.y + dy * (rad + gap + hh / 2);
        for (const f of [0, -0.25, 0.25, -0.45, 0.45]) {
          const box = {x: cx - w / 2 + (dy ? f * w : 0), y: cy - hh / 2 + (dx && !dy ? f * hh : 0), w, h: hh};
          const labelBox = stack.labelRect(box);
          const dist = q => Math.hypot(Math.max(labelBox.x - q.x, 0, q.x - labelBox.x - labelBox.w), Math.max(labelBox.y - q.y, 0, q.y - labelBox.y - labelBox.h)) - rad;
          // the stack may reach over the bottom wall into the (empty) corridor
          if (box.x < roomBox.x || box.y < roomBox.y || box.x + box.w > roomBox.x + roomBox.w || box.y + box.h > roomBox.y + roomBox.h + (G.t + G.cw * 0.8) * k) continue;
          if (dist(beforeD) * px > 40 || dist(afterD) * px > 40 || dist(beforeD) < 3 || dist(afterD) < 3) continue;
          if (everyone.some(q => Math.hypot(Math.max(box.x - q.x, 0, q.x - box.x - box.w), Math.max(box.y - q.y, 0, q.y - box.y - box.h)) < q.rad + 3)) continue;
          if (moves && path.some(q => q.x > box.x - rad * 0.6 && q.x < box.x + box.w + rad * 0.6 && q.y > box.y - rad * 0.6 && q.y < box.y + box.h + rad * 0.6)) continue;
          // furniture: never under the stack (a struck value over a bench reads as part of it)
          const onFurn = stackHard.filter(f2 => overlaps(box, f2, -2)).length;
          const cost = onFurn * 100 + gap / 10 + Math.abs(f) * 2;
          if (!bestS || cost < bestS.cost) bestS = {box, cost, onFurn};
        }
      }
    }
    if (!bestS) { problems.push('stack'); bestS = {box: {x: M.x - stack.w / 2, y: M.y + rad + 8, w: stack.w, h: stack.h}, onFurn: 0}; }
    if (bestS.onFurn) problems.push('stack-furniture');
    stackAt = bestS.box;
  }
  stack.place(stackAt);
  // ---- the other seat labels (each nearer its own person than any other seat or chair), door captions, room name
  const extra = stackAt ? [stackAt] : [];
  const labels = routes.map(() => null);
  if (showKey) {
    const others = routes.map((rt, i) => ({rt, i})).filter(o => o.i !== fi);
    const res = placeSeatLabels(ctx, {
      items: others.map(o => ({key: `seat${o.i}`, text: o.rt.label, at: toD(G.slots[o.rt.slot]), rad, avoidPaths: moves ? [path] : []})),
      people: [...routes.map(rt => bodyBox(toD(G.slots[rt.slot]), G.slots[rt.slot].deg, rad)), {...afterD, rad}], furniture: furn, bounds: roomBox, size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 36 / px, pathPad: rad * 0.55, extra,
      ...seatObstacles(G, toD, new Set([...occupied, afterSlot])),
    });
    if (res.fails.length) problems.push('labels');
    res.labels.forEach((L, j) => { labels[others[j].i] = L; extra.push(L.box); });
  }
  const doorChips = [];
  if (showAll) {
    const corrR = {x: ox + (G.W + G.t + 4) * k, y: oy + 4 * k, w: (G.cw - 8) * k, h: (G.H + G.t + G.cw - 8) * k};
    const corrB = {x: ox + 4 * k, y: oy + (G.H + G.t + 4) * k, w: (G.W + G.t + G.cw - 8) * k, h: (G.cw - 8) * k};
    for (const it of [
      {key: 'mainDoor', text: p.labels.mainDoor, at: toD({x: (G.mainDoor.a + G.mainDoor.b) / 2, y: G.H + G.t / 2}), rad: 10, bounds: corrB},
      {key: 'sideDoor', text: p.labels.sideDoor, at: toD({x: G.W + G.t / 2, y: (G.sideDoor.a + G.sideDoor.b) / 2}), rad: 10, bounds: corrR},
    ]) {
      let got = null;
      for (const bounds of [it.bounds, roomBox]) {
        const res = placeSeatLabels(ctx, {items: [it], people: everyone, furniture: furn, bounds, size: Fc, minSize: Fc, maxWidth: Math.min(260 / px, bounds.w), maxLines: 4, maxGap: 200, extra});
        const L = res.labels[0];
        if (!res.fails.length && !L.fit.truncated) { got = L; break; }
        if (!got) got = L;
      }
      doorChips.push({key: it.key, L: got});
      extra.push(got.box);
      if (got.fit.truncated || got.none) problems.push('door');
    }
  }
  let roomChip = null;
  if (showKey) {
    const ropts = {maxWidth: Math.max(220 / px, Math.min(360 / px, RW * k * 0.34)), size: F, minSize: F, maxLines: 4, fill: th.card, stroke: th.accent2};
    const probe = gchip(ctx, p.courts.room, {x: 0, y: 0, ...ropts});
    if (probe.fit.truncated) problems.push('room-trunc');
    const spot = placeFree({w: probe.box.w, h: probe.box.h, bounds: roomBox, people: everyone, extra, paths: moves ? [path] : [], pathPad: rad * 0.7, furniture: furn, prefer: 'top-left'});
    if (!spot) problems.push('room');
    const at = spot || {x: roomBox.x, y: roomBox.y};
    roomChip = gchip(ctx, p.courts.room, {x: at.x, y: at.y, ...ropts, name: 'room-name'});
    extra.push(roomChip.box);
  }
  // ---- the crop (source of the lens): the table of the inspected seats + both seats + the stack
  const tb = G.tables.find(t2 => Math.abs(t2.cx - (B.x + A.x) / 2) < t2.w) || null;
  const zoomMax = p.detailGeometry.zoom;
  const cropOf = withTable => {
    const parts = [{x: Math.min(beforeD.x, afterD.x) - rad * 1.05, y: Math.min(beforeD.y, afterD.y) - rad * 1.05, w: Math.abs(beforeD.x - afterD.x) + rad * 2.1, h: Math.abs(beforeD.y - afterD.y) + rad * 2.1}];
    if (withTable && tb) parts.push({x: ox + (tb.cx - tb.w / 2) * k, y: oy + (tb.cy - tb.h / 2) * k, w: tb.w * k, h: tb.h * k});
    if (stackAt) parts.push(stackAt);
    const x0 = Math.min(...parts.map(q => q.x)) - 14, y0 = Math.min(...parts.map(q => q.y)) - 14;
    const x1 = Math.max(...parts.map(q => q.x + q.w)) + 14, y1 = Math.max(...parts.map(q => q.y + q.h)) + 14;
    return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
  };
  // ---- the shrunk context and the lens region: the plan shrinks into a corner of its area and the lens takes
  // the freed part (beside or under it). The people of the shrunk plan stay >= 45 px (the lens is the focus
  // then; 60 px at rest); the lens magnifies >= 1.8x relative to the shrunk plan; among those, the pair that
  // fills the plan's area best wins.
  let pick = null;
  const sMin = 46 / personPx;
  for (const withTable of [true, false]) {
    const crop = cropOf(withTable);
    for (const sT of [0.8, 0.75, 0.7, 0.65, 0.6, 0.56, 0.52, 0.48, 0.45, 0.42].filter(v => v >= sMin)) {
      const sw2 = planRect.w * sT, sh2 = planRect.h * sT;
      const opts = [
        {side: 'right', at: {x: planBox.x, y: planBox.y + (planBox.h - sh2) / 2}, reg: {x: planBox.x + sw2 + 30, y: planBox.y, w: planBox.w - sw2 - 30, h: planBox.h}},
        {side: 'below', at: {x: planBox.x + (planBox.w - sw2) / 2, y: planBox.y}, reg: {x: planBox.x, y: planBox.y + sh2 + 30, w: planBox.w, h: planBox.h - sh2 - 30}},
      ];
      // (square) the lens may also reach down over the panel band, which steps aside while the lens is open
      if (shape === 'square') {
        opts.push({side: 'right', over: true, at: {x: planBox.x, y: planBox.y}, reg: {x: planBox.x + sw2 + 30, y: planBox.y, w: planBox.w - sw2 - 30, h: D.h - planBox.y}});
        opts.push({side: 'below', over: true, at: {x: planBox.x, y: planBox.y}, reg: {x: planBox.x, y: planBox.y + sh2 + 30, w: D.w, h: D.h - planBox.y - sh2 - 30}});
      }
      for (const o2 of opts) {
        if (o2.reg.w < 60 || o2.reg.h < 60) continue;
        const zAbs = Math.min(zoomMax * sT, (o2.reg.w - 16) / crop.w, (o2.reg.h - 16) / crop.h);
        // how much of the plan's area the pair spans (shrunk plan + lens, as one block): the arrangement that
        // leaves the least empty band wins (e.g. plan above, lens below on tall frames)
        const lw = crop.w * zAbs, lh = crop.h * zAbs;
        const lx = o2.reg.x + (o2.reg.w - lw) / 2, ly = o2.reg.y + (o2.reg.h - lh) / 2;
        const ux0 = Math.min(o2.at.x, lx), uy0 = Math.min(o2.at.y, ly), ux1 = Math.max(o2.at.x + sw2, lx + lw), uy1 = Math.max(o2.at.y + sh2, ly + lh);
        const span = Math.min(1, (ux1 - ux0) / planBox.w) * Math.min(1, (uy1 - uy0) / planBox.h);
        const fill = 0.5 * span + 0.5 * (sw2 * sh2 + lw * lh) / (planBox.w * planBox.h);
        const cand = {crop, sT, side: o2.side, over: Boolean(o2.over), offT: {x: o2.at.x - planRect.x * sT, y: o2.at.y - planRect.y * sT}, reg: o2.reg, zAbs, rel: zAbs / sT, withTable, fill: fill - (o2.over ? 0.05 : 0)};
        const good = cand.rel >= 1.8 && zAbs >= 1;
        if (good && (!pick || !pick.good || cand.fill > pick.fill + 0.01)) pick = {...cand, good};
        else if (!pick || (!pick.good && cand.rel > pick.rel)) pick = {...cand, good};
      }
    }
    if (pick && pick.good) break;
  }
  if (!pick) {
    problems.push('lens-people');
    const crop = cropOf(false);
    pick = {crop, sT: 0.6, side: 'right', offT: {x: 0, y: 0}, reg: {x: planBox.x + planRect.w * 0.6 + 30, y: planBox.y, w: planBox.w * 0.3, h: planBox.h}, zAbs: 1, rel: 1.6, good: false};
  }
  const {sT, offT, reg: lensRegion, zAbs: zoom} = pick;
  // the lens fills its region: its source frame grows around the detail (same magnification) towards the
  // region's shape, inside the plan, as long as no neighbour is cut by the rim (else a smaller growth)
  let crop = pick.crop;
  {
    const c0 = pick.crop;
    const tw = (lensRegion.w - 16) / zoom, th2 = (lensRegion.h - 16) / zoom;
    const pb0 = rt => ({x: toD(G.slots[rt.slot]).x - rad, y: toD(G.slots[rt.slot]).y - rad, w: 2 * rad, h: 2 * rad});
    const inB = (b, c) => b.x >= c.x && b.y >= c.y && b.x + b.w <= c.x + c.w && b.y + b.h <= c.y + c.h;
    for (const f of [1, 0.8, 0.6, 0.4, 0.2]) {
      const w2 = c0.w + Math.max(0, tw - c0.w) * f, h2 = c0.h + Math.max(0, th2 - c0.h) * f;
      const c = {x: clamp(c0.x + c0.w / 2 - w2 / 2, planRect.x, planRect.x + planRect.w - w2), y: clamp(c0.y + c0.h / 2 - h2 / 2, planRect.y, planRect.y + planRect.h - h2), w: Math.min(w2, planRect.w), h: Math.min(h2, planRect.h)};
      const cut = routes.some((rt, i) => i !== fi && overlaps(pb0(rt), c, 0) && !inB(pb0(rt), c));
      const cutStack = stackAt && !inB(stackAt, c);
      if (!cut && !cutStack) { crop = c; break; }
    }
  }
  if (pick.rel < 1.5) problems.push('zoom');
  const stackInCrop = !stackAt || (stackAt.x >= crop.x && stackAt.y >= crop.y && stackAt.x + stackAt.w <= crop.x + crop.w && stackAt.y + stackAt.h <= crop.y + crop.h);
  const dw = crop.w * zoom, dh = crop.h * zoom;
  const dest = {x: lensRegion.x + (lensRegion.w - dw) / 2, y: lensRegion.y + (lensRegion.h - dh) / 2, w: dw, h: dh};
  const wtT = q => ({x: offT.x + q.x * sT, y: offT.y + q.y * sT});
  const wtB = b => ({...wtT(b), w: b.w * sT, h: b.h * sT});
  const cropShrunk = wtB(crop), planShrunk = wtB(planRect);
  if (overlaps(dest, planShrunk, 4) || (!pick.over && overlaps(dest, panelBox, 4))) problems.push('lens-place');
  // ---- the lens copy: furniture whole or not at all; people wholly inside; chips wholly inside
  const inCrop = b => b.x >= crop.x && b.y >= crop.y && b.x + b.w <= crop.x + crop.w && b.y + b.h <= crop.y + crop.h;
  const lzRoom = roomArt(ctx, G, {prefix: 'lzrm', emptyRings: [], keep: b => inCrop(mapB(b))});
  const pbox = rt => ({x: toD(G.slots[rt.slot]).x - rad, y: toD(G.slots[rt.slot]).y - rad, w: 2 * rad, h: 2 * rad});
  const lzShow = routes.map((rt, i) => i === fi || inCrop(pbox(rt)));
  if (routes.some((rt, i) => i !== fi && overlaps(pbox(rt), crop, 0) && !inCrop(pbox(rt)))) problems.push('neighbor');
  const lzChips = [];
  labels.forEach((L, i) => { if (L && inCrop(L.box)) lzChips.push({name: `lz-lab${i}`, L, size: F, owner: `lz-p${i}`}); });
  doorChips.forEach((d, i) => { if (inCrop(d.L.box)) lzChips.push({name: `lz-door${i}`, L: d.L, size: Fc, color: th.inkSoft}); });
  // ---- panel: building + names, key, context caption, marker note (Δ repeated)
  const mR = Math.max(15, F * 0.75);
  const panel = infoPanel(ctx, {F, box: panelBox, band, p, showKey, mR});
  if (panel.problem) problems.push(panel.problem);
  // ---- guides (lens open, plan shrunk): from the frame's corners to the lens corners facing it, clear of
  // heads and of the panel texts (the plan's own texts are faded while the plan is small)
  const heads = [...routes.map(rt => toD(G.slots[rt.slot])), afterD].map(q => { const c = wtT(q); const hr = rad * sT * 0.5; return {x: c.x - hr, y: c.y - hr, w: 2 * hr, h: 2 * hr}; });
  const corners = b => [{x: b.x, y: b.y}, {x: b.x + b.w, y: b.y}, {x: b.x + b.w, y: b.y + b.h}, {x: b.x, y: b.y + b.h}];
  const lc0 = {x: dest.x + dest.w / 2, y: dest.y + dest.h / 2};
  const segClear1 = (a, b2) => {
    for (let i = 1; i < 40; i++) {
      const q = {x: lerp(a.x, b2.x, i / 40), y: lerp(a.y, b2.y, i / 40)};
      if ([...heads, ...(pick.over ? [] : panel.textBoxes)].some(o => q.x > o.x - 3 && q.x < o.x + o.w + 3 && q.y > o.y - 3 && q.y < o.y + o.h + 3)) return false;
      if (i > 2 && q.x > cropShrunk.x + 2 && q.x < cropShrunk.x + cropShrunk.w - 2 && q.y > cropShrunk.y + 2 && q.y < cropShrunk.y + cropShrunk.h - 2) return false;
    }
    return true;
  };
  const segClear = (a, b2) => [1, 0.9, 0.8, 0.7, 0.6].every(k2 => segClear1(a, {x: lc0.x + (b2.x - lc0.x) * k2, y: lc0.y + (b2.y - lc0.y) * k2}));
  const cs = corners(cropShrunk), cd = corners(dest);
  const pairs = pick.side === 'below' ? [[3, 0], [2, 1]] : [[1, 0], [2, 3]];
  let guides = pairs.map(([i, j]) => ({a: cs[i], b: cd[j]}));
  let guidesClear = guides.every(gd => segClear(gd.a, gd.b));
  if (!guidesClear) {
    const alt = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (segClear(cs[i], cd[j])) alt.push({a: cs[i], b: cd[j]});
    if (alt.length >= 1) { guides = alt.slice(0, 2); guidesClear = true; } else problems.push('guides');
  }
  // ---- marker (Δ) beside the stack on the full-size plan, off every head, chip and wall
  const headsFull = [...routes.map(rt => toD(G.slots[rt.slot])), afterD].map(q => ({x: q.x - rad * 0.5, y: q.y - rad * 0.5, w: rad, h: rad}));
  const sb = stackAt || {x: afterD.x - rad, y: afterD.y - rad, w: 2 * rad, h: 2 * rad};
  const mCands = [
    {x: sb.x + sb.w + mR + 6, y: sb.y + mR}, {x: sb.x - mR - 6, y: sb.y + mR},
    {x: sb.x + sb.w + mR + 6, y: sb.y + sb.h - mR}, {x: sb.x - mR - 6, y: sb.y + sb.h - mR},
    {x: sb.x + sb.w / 2, y: sb.y + sb.h + mR + 6}, {x: sb.x + sb.w / 2, y: sb.y - mR - 6},
  ];
  const mOk = q => q.x - mR > roomBox.x && q.x + mR < roomBox.x + roomBox.w && q.y - mR > roomBox.y
    && headsFull.every(hd => Math.hypot(q.x - (hd.x + hd.w / 2), q.y - (hd.y + hd.h / 2)) > rad + mR)
    && !extra.some(b => overlaps({x: q.x - mR, y: q.y - mR, w: 2 * mR, h: 2 * mR}, b, 4));
  const markerAt = mCands.find(mOk) || mCands[0];
  const markerClear = mOk(markerAt);
  if (!markerClear) problems.push('marker');
  const marker = changedMarker(ctx, {name: 'cx-marker', x: markerAt.x, y: markerAt.y, radius: mR, opacity: 0});
  return {F, Fc, px, k, ox, oy, G, room, lzRoom, people, lzPeople, labels, doorChips, roomChip, stack, marker, panel, crop, dest, zoom, guides, guidesClear, lzChips,
    seatsAt, slots: routes.map(rt => rt.slot), fi, moves, mover, ps, lzShow, beforeSlot, afterSlot, beforeD, afterD, rad, stackInCrop, markerClear, problems,
    sT, offT, cropShrunk, planShrunk, personPx, lensOverPanel: Boolean(pick.over)};
}

/**
 * The inspected stack: the seat label chip on top (never replaced), the value
 * chip under it (before → after) and the old value's dock. Drawn twice
 * (context and lens copy, same coordinates). Before → strike (every line) →
 * the old value turns grey and docks → new value in.
 */
function focusStack(ctx, o) {
  const th = ctx.theme;
  const {F, px} = o;
  const maxW = (o.sw || 330) / px;
  const lab = o.showKey ? fitWords(glue(o.labelText), {maxWidth: maxW, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  const dBefore = o.showKey ? fitWords(glue(o.before), {maxWidth: maxW, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
  const dAfter = o.showKey ? fitWords(glue(o.after), {maxWidth: maxW, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
  const wasFit = o.showKey ? fitWords(glue(`${o.was}: ${o.before}`), {maxWidth: maxW, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
  const padX = F * 0.6, padY = F * 0.38;
  const chipH = f => (f ? f.height + padY * 2 : 0);
  const chipW = f => (f ? f.width + padX * 2 : 0);
  const hLabel = Math.max(chipH(lab), F * 1.6);
  const wLabel = chipW(lab);
  const hDatum = Math.max(chipH(dBefore), chipH(dAfter));
  const wDatum = Math.max(chipW(dBefore), chipW(dAfter));
  const hDock = chipH(wasFit), wDock = chipW(wasFit);
  const gap = F * 0.3;
  // 'below': dock under the value chip; 'beside': dock to the right of the value chip (a wider, shorter stack)
  const beside = o.orient === 'beside';
  const w = beside ? Math.max(wLabel, wDatum + F * 0.6 + wDock, F * 3) : Math.max(wLabel, wDatum, wDock, F * 3);
  const hh = beside ? hLabel + gap + Math.max(hDatum, hDock) : hLabel + gap + hDatum + gap + hDock;
  const problem = [lab, dBefore, dAfter, wasFit].some(f => f && f.truncated) ? 'stack-trunc' : null;
  let at = null;
  const textEl = (fit, x, y, fill, name, anchor = 'middle') => h('text', {name, x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'text-anchor': anchor, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
  const strikeLines = (fit, cx, y, name) => fit.lines.map((ln, i) => {
    const lw = ctx.measure(ln, fit.size, fit.weight, 'sans');
    const yy = y + i * fit.lineHeight + fit.size * 0.45;
    return h('line', {name: `${name}${i}`, x1: r(cx - lw / 2), x2: r(cx - lw / 2), y1: r(yy), y2: r(yy), stroke: th.ink, 'stroke-width': Math.max(2.4, F * 0.1), 'stroke-linecap': 'round', 'data-x2': r(cx + lw / 2)});
  });
  const geo = () => {
    const x = at.x, y = at.y;
    if (beside) {
      const rowY = y + hLabel + gap;
      return {lb: {x, y, w: wLabel, h: hLabel}, db: {x, y: rowY, w: wDatum, h: hDatum}, kb: {x: x + wDatum + F * 0.6, y: rowY + (hDatum - hDock) / 2, w: wDock, h: hDock}};
    }
    return {
      lb: {x: x + (w - wLabel) / 2, y, w: wLabel, h: hLabel},
      db: {x: x + (w - wDatum) / 2, y: y + hLabel + gap, w: wDatum, h: hDatum},
      kb: {x: x + (w - wDock) / 2, y: y + hLabel + gap + hDatum + gap, w: wDock, h: hDock},
    };
  };
  return {
    w, h: hh, hLabel,
    problem,
    /** the seat label chip's box for a stack placed at `box` (its leader starts there) */
    labelRect: box => (beside ? {x: box.x, y: box.y, w: wLabel, h: hLabel} : {x: box.x + (w - wLabel) / 2, y: box.y, w: wLabel, h: hLabel}),
    place(box) { at = box ? {x: box.x, y: box.y} : null; },
    /** node for a copy: prefix 'cx' (context) or 'lz' (lens copy) */
    node(P) {
      if (!at) return null;
      const {lb, db: vb, kb} = geo();
      const lead = h('line', {name: `${P}-lead`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linecap': 'round'});
      const leadDot = h('circle', {name: `${P}-lead-dot`, r: 4.5, fill: th.ink});
      const labelChip = g({name: `${P}-label`},
        h('path', {name: `${P}-label-body`, d: roundRectPath(lb.x, lb.y, lb.w, lb.h, Math.min(lb.h / 2, F * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2.4}),
        textEl(lab, lb.x + lb.w / 2, lb.y + (lb.h - lab.height) / 2, th.ink));
      const valueOld = g({name: `${P}-old`},
        h('path', {name: `${P}-old-body`, d: roundRectPath(vb.x, vb.y, vb.w, vb.h, Math.min(vb.h / 2, F * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.2}),
        g({name: `${P}-old-text`}, textEl(dBefore, vb.x + vb.w / 2, vb.y + (vb.h - dBefore.height) / 2, th.ink)),
        strikeLines(dBefore, vb.x + vb.w / 2, vb.y + (vb.h - dBefore.height) / 2, `${P}-strike`));
      const valueNew = g({name: `${P}-new`, opacity: 0},
        h('path', {name: `${P}-new-body`, d: roundRectPath(vb.x, vb.y, vb.w, vb.h, Math.min(vb.h / 2, F * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
        textEl(dAfter, vb.x + vb.w / 2, vb.y + (vb.h - dAfter.height) / 2, th.ink));
      const dockChip = g({name: `${P}-dock`, opacity: 0},
        h('path', {d: roundRectPath(kb.x, kb.y, kb.w, kb.h, Math.min(kb.h / 2, F * 0.7)), fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 1.8}),
        textEl(wasFit, kb.x + kb.w / 2, kb.y + (kb.h - wasFit.height) / 2, th.inkSoft),
        strikeLines(wasFit, kb.x + kb.w / 2, kb.y + (kb.h - wasFit.height) / 2, `${P}-dstrike`).map(l => ({...l, attrs: {...l.attrs, name: undefined, x2: l.attrs['data-x2'], stroke: th.inkSoft, 'stroke-width': 2}})));
      return g({name: `${P}-stack`}, lead, leadDot, labelChip, valueOld, dockChip, valueNew);
    },
    frame(u, person, rad) {
      const out = {};
      if (!at) return out;
      const {lb, db: vb, kb} = geo();
      const strike = ease.inOutSine(seg(u, ...W.strike));
      const dock = ease.inOutCubic(seg(u, ...W.dock));
      const newIn = seg(u, ...(o.moves ? W.newIn : W.newInStill));
      // leader from the label chip edge nearest the person to the person's rim
      const near = {x: clamp(person.x, lb.x, lb.x + lb.w), y: clamp(person.y, lb.y, lb.y + lb.h)};
      const dx = near.x - person.x, dy = near.y - person.y, L = Math.hypot(dx, dy) || 1;
      for (const P of ['cx', 'lz']) {
        const rr = Math.min(L - 2, rad - 6);
        const rim = {x: person.x + (dx / L) * rr, y: person.y + (dy / L) * rr};
        out[`${P}-lead`] = {x1: r(near.x), y1: r(near.y), x2: r(rim.x), y2: r(rim.y)};
        out[`${P}-lead-dot`] = {cx: r(rim.x), cy: r(rim.y)};
        // strike every line of the old value
        dBefore.lines.forEach((ln, i) => {
          const lw = ctx.measure(ln, dBefore.size, dBefore.weight, 'sans');
          const cx = vb.x + vb.w / 2;
          out[`${P}-strike${i}`] = {x2: r(lerp(cx - lw / 2, cx + lw / 2, strike)), opacity: strike > 0 ? 1 : 0};
        });
        // the struck old value turns grey and moves into its dock
        const tx = (kb.x + kb.w / 2) - (vb.x + vb.w / 2), ty = kb.y - vb.y;
        out[`${P}-old`] = {transform: T(tx * dock, ty * dock), opacity: dock >= 1 ? 0 : 1};
        out[`${P}-old-text`] = {opacity: r(1 - 0.45 * dock, 3)};
        out[`${P}-dock`] = {opacity: dock >= 1 ? 1 : 0};
        out[`${P}-new`] = {opacity: r(newIn, 3)};
      }
      return out;
    },
  };
}

/** Panel: small building + names, key, context caption and the marker note (Δ repeated). */
function infoPanel(ctx, o) {
  const th = ctx.theme;
  const {F, box, band, p, showKey, mR} = o;
  const parts = [];
  const textBoxes = [];
  let problem = null;
  const txt = (f, x, y, fill, weight, italic, name) => h('text', {name, x: r(x), y: r(y + f.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(f.size, 2), 'font-weight': weight, 'font-style': italic ? 'italic' : undefined, fill}, f.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(f.lineHeight, 2)}, ln)));
  // building: top of the column, or left of the band
  const bh = band ? Math.min(box.h * 0.8, 170) : Math.min(box.w * 0.62, 170, box.h * 0.3);
  const bw = bh * 0.95;
  const bx = band ? box.x : box.x + (box.w - bw) / 2;
  parts.push(buildingElevation(ctx, {name: 'pan-bld', x: bx, y: box.y, w: bw, h: bh, highlight: {floor: 1, bay: 3}, tree: false}).node);
  const tx = band ? box.x + bw + 26 : box.x, tw = band ? box.w - bw - 26 : box.w;
  let y = band ? box.y : box.y + bh + F * 0.8;
  const items = showKey ? [
    {text: `${p.courts.building} · ${p.courts.room}`, weight: 600, fill: th.fg},
    {text: p.labels.key, weight: 500, fill: th.fgSoft, italic: true},
    p.contextLabels.context ? {text: p.contextLabels.context, weight: 500, fill: th.fgSoft, name: 'ctx-caption'} : null,
    p.contextLabels.marker ? {text: p.contextLabels.marker, weight: 600, fill: th.fg, name: 'marker-note', marker: true} : null,
  ].filter(Boolean) : [];
  const groups = {};
  for (const it of items) {
    const indent = it.marker ? mR * 2 + 12 : 0;
    const f = fitWords(glue(it.text), {maxWidth: tw - indent, size: F, minSize: F, maxLines: 5, weight: it.weight});
    if (f.truncated) problem = 'panel';
    const node = txt(f, tx + indent, y, it.fill, it.weight, it.italic);
    textBoxes.push({x: tx + indent, y, w: f.width, h: f.height});
    if (it.name) groups[it.name] = g({name: it.name, opacity: 0}, it.marker ? changedMarker(ctx, {x: tx + mR * 0.85, y: y + F * 0.55, radius: mR * 0.85}) : null, node);
    else parts.push(node);
    y += f.height + F * 0.7;
  }
  if (y - F * 0.7 > box.y + box.h + 2) problem = 'panel';
  return {
    node: g({name: 'panel'}, parts, groups['ctx-caption'], groups['marker-note']),
    problem,
    textBoxes,
    frame: u => ({
      ...(groups['ctx-caption'] ? {'ctx-caption': {opacity: r(seg(u, ...W.caption), 3)}} : {}),
      ...(groups['marker-note'] ? {'marker-note': {opacity: r(seg(u, W.marker[0] + 0.01, W.marker[1] + 0.01), 3)}} : {}),
    }),
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-01-inspect',
    title: 'Room layout — inspecting one supplied seat datum and substituting it',
    titleEs: 'Distribución de una sala — Inspección y cambio de un dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Distribución de una sala',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The seated plan of a generic room fills the frame as the context. It shrinks into a corner while a lens enlarges a real copy of one table, its person, the seat label and the supplied value; the old value is struck through and docked as "was: …", the person moves to the supplied seat at the same table and the label’s leader re-attaches (or, for a label substitution, only the value chip changes). The plan grows back; a neutral Δ marks the change; seeking back restores the old datum.',
    tags: ['inspect', 'lens', 'floor plan', 'seat', 'label', 'substitution', 'changed marker', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/markers.js', 'src/animations/roles/kits/mediation-labels.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
