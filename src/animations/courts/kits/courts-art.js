/**
 * Generic courts art (category "courts" — Órganos y espacios judiciales).
 * Shared, READ-ONLY art for every courts motif: import these pieces, do not
 * fork them. Everything here is original vector geometry of GENERIC,
 * fictional spaces — no real court, building shape, emblem, flag, coat of
 * arms or symbol of a legal system. Nothing here encodes a rank, a rule or a
 * procedural meaning: a desk is a desk, a seat is a seat.
 *
 * Plan-view visual language (top-down, "as drawn on a plan"):
 *  - walls are solid charcoal poché with door gaps; a door is a thin leaf on
 *    a hinge plus a dashed swing arc; windows are pale double lines;
 *  - floors are warm paper with a faint tile grid; corridors use long
 *    planks; a raised platform is a lighter slab with step lines;
 *  - furniture is warm wood with a lighter top edge; seats are upholstered
 *    rounded squares with a darker backrest bar (the back is where the seat
 *    faces away from);
 *  - people seen from above: shoulders in the outfit colour, arms and hands
 *    at the sides, the head with its hair from above, nose pointing where the
 *    person faces; they walk (feet and arms alternate) and sit (legs forward
 *    under the desk, hands on it);
 *  - routes are round-dot trails with draw-on.
 * Elevation language (front view): a generic modern block with a window
 * grid, a flat canopy over the entrance and a plain parapet; one window can
 * be highlighted to locate a room.
 *
 * Local conventions: plan pieces use design units; a plan person's local
 * forward is −y (angle 0 = facing up the page; angles in degrees clockwise).
 * Every piece takes a `name`/`prefix` so several instances can coexist.
 *
 * Exports (stable API for later courts motifs):
 *   planColors(ctx)                      palette tokens for plan art
 *   planSheet(ctx, o)                    drawing sheet with a faint grid
 *   floorArea(ctx, o)                    floor slab (tiles | planks | plain)
 *   wallRing(ctx, o)                     rectangular wall ring with door/window gaps
 *   planDoor(ctx, o)                     animatable door leaf + swing arc
 *   planPlatform(ctx, o)                 raised platform with step lines
 *   planDesk(ctx, o) / planTable(ctx, o) wooden desk / table from above
 *   planChair(ctx, o)                    chair from above (facing angle)
 *   planBench(ctx, o)                    bench with backrest from above
 *   planLectern(ctx, o)                  small standing lectern from above
 *   planPlant(ctx, o)                    potted plant from above (decor)
 *   planPerson(ctx, o)                   top-down person rig {node, pose()}
 *   routeTrail(ctx, o)                   dotted route with draw-on {node, frame()}
 *   seatRing(ctx, o)                     dashed empty-seat outline
 *   buildingElevation(ctx, o)            generic building front {node, windowBox()}
 * @module animations/courts/kits/courts-art
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';

const INK = '#1f2328';

/** Palette tokens for plan-view art (derived from the theme; neutral). */
export function planColors(ctx) {
  const th = ctx.theme;
  return {
    ink: INK,
    wall: '#454b53',
    wallEdge: '#2b3036',
    floor: '#f5efe3',
    floorLine: '#e6dccb',
    corridor: '#ebe5d8',
    corridorLine: '#dcd3c1',
    platform: '#ede3d0',
    platformEdge: '#cdbd9f',
    sheet: '#fbf8f1',
    sheetGrid: '#e9e3d6',
    wood: th.woodTop,
    woodDark: th.woodDark,
    woodEdge: shade(th.woodTop, 0.22),
    seat: '#5d6f80',
    seatBack: '#3f4d5a',
    bench: '#8a6a4f',
    glass: '#cfe1ea',
    route: th.accent2,
    stone: '#e7dcc6',
    stoneDark: '#cbbd9f',
    frame: '#5d6873',
  };
}

/** Drawing sheet: paper with a faint square grid and a thin border. */
export function planSheet(ctx, {name, x, y, w, h: hh, cell = 40, radius = 18}) {
  const c = planColors(ctx);
  const lines = [];
  for (let gx = x + cell; gx < x + w - 2; gx += cell) lines.push(`M${r(gx)} ${r(y + 6)}V${r(y + hh - 6)}`);
  for (let gy = y + cell; gy < y + hh - 2; gy += cell) lines.push(`M${r(x + 6)} ${r(gy)}H${r(x + w - 6)}`);
  return g({name},
    h('path', {d: roundRectPath(x + 6, y + 9, w, hh, radius), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, radius), fill: c.sheet, stroke: shade(c.sheetGrid, -0.25), 'stroke-width': 2}),
    h('path', {d: lines.join(''), stroke: c.sheetGrid, 'stroke-width': 1.2, fill: 'none'}),
  );
}

/**
 * Floor slab. kind: 'tiles' (square grid), 'planks' (long boards along the
 * longer side) or 'plain'.
 */
export function floorArea(ctx, {name, x, y, w, h: hh, kind = 'tiles', cell = 56, fill, line}) {
  const c = planColors(ctx);
  const base = fill || (kind === 'planks' ? c.corridor : c.floor);
  const stroke = line || (kind === 'planks' ? c.corridorLine : c.floorLine);
  const d = [];
  if (kind === 'tiles') {
    for (let gx = x + cell; gx < x + w - 1; gx += cell) d.push(`M${r(gx)} ${r(y)}V${r(y + hh)}`);
    for (let gy = y + cell; gy < y + hh - 1; gy += cell) d.push(`M${r(x)} ${r(gy)}H${r(x + w)}`);
  } else if (kind === 'planks') {
    const along = w >= hh;
    const step = cell * 0.55;
    if (along) {
      let row = 0;
      for (let gy = y + step; gy < y + hh - 1; gy += step, row++) {
        d.push(`M${r(x)} ${r(gy)}H${r(x + w)}`);
        for (let gx = x + ((row % 2) ? cell * 1.4 : cell * 2.6); gx < x + w; gx += cell * 3.2) d.push(`M${r(gx)} ${r(gy - step)}V${r(gy)}`);
      }
    } else {
      let col = 0;
      for (let gx = x + step; gx < x + w - 1; gx += step, col++) {
        d.push(`M${r(gx)} ${r(y)}V${r(y + hh)}`);
        for (let gy = y + ((col % 2) ? cell * 1.4 : cell * 2.6); gy < y + hh; gy += cell * 3.2) d.push(`M${r(gx - step)} ${r(gy)}H${r(gx)}`);
      }
    }
  }
  return g({name},
    h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), fill: base}),
    d.length ? h('path', {d: d.join(''), stroke: stroke, 'stroke-width': 1.4, fill: 'none'}) : null,
  );
}

/**
 * Rectangular wall ring drawn as solid poché, INSIDE edge on (x, y, w, h).
 * gaps: [{side:'top'|'bottom'|'left'|'right', a, b, kind?:'door'|'window'|'open'}]
 * with a/b absolute coordinates along that side (x for top/bottom, y for
 * left/right). Windows keep a thin glazed double line in the gap.
 * `sides` limits which sides get a wall (default all four).
 */
export function wallRing(ctx, {name, x, y, w, h: hh, t = 18, gaps = [], sides = ['top', 'bottom', 'left', 'right']}) {
  const c = planColors(ctx);
  const parts = [];
  const glass = [];
  const segs = (from, to, list) => {
    const out = [];
    let cur = from;
    for (const q of list.slice().sort((a, b) => a.a - b.a)) {
      if (q.a > cur) out.push([cur, Math.min(q.a, to)]);
      cur = Math.max(cur, q.b);
    }
    if (cur < to) out.push([cur, to]);
    return out;
  };
  const byside = s => gaps.filter(q => q.side === s);
  if (sides.includes('top')) for (const [a, b] of segs(x - t, x + w + t, byside('top'))) parts.push(`M${r(a)} ${r(y - t)}H${r(b)}V${r(y)}H${r(a)}Z`);
  if (sides.includes('bottom')) for (const [a, b] of segs(x - t, x + w + t, byside('bottom'))) parts.push(`M${r(a)} ${r(y + hh)}H${r(b)}V${r(y + hh + t)}H${r(a)}Z`);
  if (sides.includes('left')) for (const [a, b] of segs(y, y + hh, byside('left'))) parts.push(`M${r(x - t)} ${r(a)}H${r(x)}V${r(b)}H${r(x - t)}Z`);
  if (sides.includes('right')) for (const [a, b] of segs(y, y + hh, byside('right'))) parts.push(`M${r(x + w)} ${r(a)}H${r(x + w + t)}V${r(b)}H${r(x + w)}Z`);
  for (const q of gaps.filter(q2 => q2.kind === 'window')) {
    if (q.side === 'top' || q.side === 'bottom') {
      const yy = q.side === 'top' ? y - t : y + hh;
      glass.push(h('rect', {x: r(q.a), y: r(yy), width: r(q.b - q.a), height: r(t), fill: c.glass, stroke: c.wallEdge, 'stroke-width': 1.5}),
        h('path', {d: `M${r(q.a)} ${r(yy + t / 2)}H${r(q.b)}`, stroke: c.wallEdge, 'stroke-width': 1.2}));
    } else {
      const xx = q.side === 'left' ? x - t : x + w;
      glass.push(h('rect', {x: r(xx), y: r(q.a), width: r(t), height: r(q.b - q.a), fill: c.glass, stroke: c.wallEdge, 'stroke-width': 1.5}),
        h('path', {d: `M${r(xx + t / 2)} ${r(q.a)}V${r(q.b)}`, stroke: c.wallEdge, 'stroke-width': 1.2}));
    }
  }
  return g({name},
    h('path', {d: parts.join(''), fill: c.wall, stroke: c.wallEdge, 'stroke-width': 1.5, 'stroke-linejoin': 'round'}),
    glass);
}

/**
 * Door leaf on a hinge with a dashed swing arc. The leaf is closed along the
 * wall at angle `closedDeg` and opens by `openDeg` (signed) — frame(k) sets the
 * open fraction k ∈ [0, 1].
 * @param {any} ctx
 * @param {{name:string, hinge:{x:number,y:number}, width:number, closedDeg:number, openDeg:number}} o
 */
export function planDoor(ctx, o) {
  const c = planColors(ctx);
  const {hinge, width} = o;
  const a0 = (o.closedDeg * Math.PI) / 180;
  const a1 = ((o.closedDeg + o.openDeg) * Math.PI) / 180;
  const P = a => ({x: hinge.x + Math.cos(a) * width, y: hinge.y + Math.sin(a) * width});
  const p0 = P(a0), p1 = P(a1);
  const sweep = o.openDeg > 0 ? 1 : 0;
  const node = g({name: o.name},
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}A${r(width)} ${r(width)} 0 0 ${sweep} ${r(p1.x)} ${r(p1.y)}`, fill: 'none', stroke: c.frame, 'stroke-width': 1.6, 'stroke-dasharray': '6 6', opacity: 0.75}),
    g({name: `${o.name}-leaf`, transform: `rotate(0 ${r(hinge.x)} ${r(hinge.y)})`},
      h('rect', {x: r(hinge.x), y: r(hinge.y - 4), width: r(width), height: 8, rx: 3, fill: c.woodDark, stroke: INK, 'stroke-width': 1.6, transform: `rotate(${r(o.closedDeg)} ${r(hinge.x)} ${r(hinge.y)})`})),
    h('circle', {cx: r(hinge.x), cy: r(hinge.y), r: 5, fill: c.wallEdge}),
  );
  const frame = k => ({[`${o.name}-leaf`]: {transform: `rotate(${r(o.openDeg * Math.max(0, Math.min(1, k)))} ${r(hinge.x)} ${r(hinge.y)})`}});
  return {node, frame};
}

/** Raised platform: lighter slab, a front edge and two step lines. */
export function planPlatform(ctx, {name, x, y, w, h: hh, edge = 'bottom'}) {
  const c = planColors(ctx);
  const steps = [];
  const s = Math.min(w, hh) * 0.09;
  if (edge === 'bottom') for (let i = 1; i <= 2; i++) steps.push(`M${r(x + i * s)} ${r(y + hh + i * s * 0.6)}H${r(x + w - i * s)}`);
  if (edge === 'top') for (let i = 1; i <= 2; i++) steps.push(`M${r(x + i * s)} ${r(y - i * s * 0.6)}H${r(x + w - i * s)}`);
  return g({name},
    h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), fill: c.platform, stroke: c.platformEdge, 'stroke-width': 2.5}),
    h('path', {d: steps.join(''), stroke: c.platformEdge, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none'}),
  );
}

/**
 * Desk / table from above. Centre (cx, cy), size w × h, rotation deg.
 * `front` side ('top'|'bottom'|'none') gets a modesty-panel line.
 */
export function planTable(ctx, {name, cx, cy, w, h: hh, deg = 0, front = 'none', seedKey = 'tbl'}) {
  const c = planColors(ctx);
  const x = -w / 2, y = -hh / 2;
  const grain = [];
  const n = Math.max(2, Math.round(hh / 22));
  for (let i = 0; i < n; i++) {
    const gy = y + ((i + 0.5) / n) * hh + (ctx.rng(`${seedKey}-g`, i) - 0.5) * 6;
    const wob = 3 + ctx.rng(`${seedKey}-w`, i) * 4;
    grain.push(`M${r(x + 8)} ${r(gy)}C${r(x + w * 0.35)} ${r(gy - wob)} ${r(x + w * 0.65)} ${r(gy + wob)} ${r(x + w - 8)} ${r(gy)}`);
  }
  const panel = front === 'bottom' ? `M${r(x + 6)} ${r(y + hh - 7)}H${r(x + w - 6)}` : front === 'top' ? `M${r(x + 6)} ${r(y + 7)}H${r(x + w - 6)}` : '';
  return g({name, transform: T(cx, cy, deg)},
    h('path', {d: roundRectPath(x + 4, y + 6, w, hh, 8), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: c.wood, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: grain.join(''), stroke: shade(c.wood, -0.12), 'stroke-width': 1.6, fill: 'none', opacity: 0.7}),
    h('path', {d: roundRectPath(x + 4, y + 4, w - 8, hh - 8, 6), fill: 'none', stroke: c.woodEdge, 'stroke-width': 1.6, opacity: 0.8}),
    panel ? h('path', {d: panel, stroke: c.woodDark, 'stroke-width': 5, 'stroke-linecap': 'round'}) : null,
  );
}
export const planDesk = planTable;

/**
 * Chair from above; `deg` is the facing angle of a person sitting on it
 * (0 = facing up). Local seat centre at (cx, cy). Size s ≈ seat width.
 */
export function planChair(ctx, {name, cx, cy, deg = 0, s = 60, color}) {
  const c = planColors(ctx);
  const col = color || c.seat;
  const hs = s / 2;
  return g({name, transform: T(cx, cy, deg)},
    h('path', {d: roundRectPath(-hs + 3, -hs + 6, s, s, 10), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(-hs, -hs, s, s * 0.96, 10), fill: col, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(-hs + 6, -hs + 5, s - 12, s * 0.62, 7), fill: shade(col, 0.14), opacity: 0.9}),
    h('path', {d: roundRectPath(-hs - 3, hs * 0.72, s + 6, s * 0.26, 6), fill: shade(col, -0.3), stroke: INK, 'stroke-width': 2.2}),
  );
}

/** Bench with a backrest from above (people sit facing `deg`). */
export function planBench(ctx, {name, cx, cy, w, d = 56, deg = 0}) {
  const c = planColors(ctx);
  const x = -w / 2;
  const slats = [];
  for (let i = 1; i < 4; i++) slats.push(`M${r(x + 8)} ${r(-d / 2 + (i * d * 0.7) / 4)}H${r(x + w - 8)}`);
  return g({name, transform: T(cx, cy, deg)},
    h('path', {d: roundRectPath(x + 3, -d / 2 + 6, w, d, 8), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x, -d / 2, w, d * 0.74, 8), fill: c.bench, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: slats.join(''), stroke: shade(c.bench, -0.22), 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(x - 2, d * 0.24, w + 4, d * 0.26, 6), fill: shade(c.bench, -0.35), stroke: INK, 'stroke-width': 2.2}),
  );
}

/** Small lectern from above (a slanted top with a front lip). */
export function planLectern(ctx, {name, cx, cy, s = 56, deg = 0}) {
  const c = planColors(ctx);
  return g({name, transform: T(cx, cy, deg)},
    h('path', {d: roundRectPath(-s / 2 + 3, -s * 0.35 + 5, s, s * 0.7, 6), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(-s / 2, -s * 0.35, s, s * 0.7, 6), fill: c.wood, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(-s / 2 + 5)} ${r(-s * 0.35 + 8)}H${r(s / 2 - 5)}`, stroke: c.woodDark, 'stroke-width': 4, 'stroke-linecap': 'round'}),
  );
}

/** Potted plant seen from above (decor). */
export function planPlant(ctx, {name, cx, cy, s = 44, seedKey = 'plant'}) {
  const leaves = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + ctx.rng(`${seedKey}-a`, i) * 0.5;
    const rr = s * (0.28 + ctx.rng(`${seedKey}-r`, i) * 0.12);
    leaves.push(h('ellipse', {cx: r(Math.cos(a) * rr), cy: r(Math.sin(a) * rr), rx: r(s * 0.2), ry: r(s * 0.11), transform: `rotate(${r((a * 180) / Math.PI)} ${r(Math.cos(a) * rr)} ${r(Math.sin(a) * rr)})`, fill: i % 2 ? '#6f8f5c' : '#5b7d4c', stroke: INK, 'stroke-width': 1.4}));
  }
  return g({name, transform: T(cx, cy)},
    h('circle', {r: r(s * 0.5), fill: '#b47a55', stroke: INK, 'stroke-width': 2}),
    h('circle', {r: r(s * 0.4), fill: '#6b4a34'}),
    leaves,
  );
}

/* ------------------------------------------------------------------ */
/* People from above                                                   */
/* ------------------------------------------------------------------ */

/** Size of a plan person at scale 1 (for layout and collision). */
export const PERSON = {half: 50, headR: 22, bodyHalf: 42, depth: 30};

/**
 * Top-down person rig. Local forward = −y. pose() places, rotates and
 * animates it:
 *   x, y       centre (between the shoulders), design units
 *   deg        facing (0 = up the page, clockwise)
 *   scale      uniform size
 *   phase      walk-cycle phase (radians); feet and arms alternate
 *   walk       walk amplitude 0..1 (0 = standing still)
 *   seated     0..1 (legs forward, hands forward on the desk)
 * The node never changes opacity by itself (people stay whole and opaque).
 * @param {any} ctx
 * @param {{name:string, look:{skin:string,hair:string,hairColor:string,outfit:string,glasses?:boolean}}} o
 */
export function planPerson(ctx, o) {
  const N = o.name;
  const L = o.look;
  const outfit = L.outfit;
  const sleeve = shade(outfit, -0.12);
  const trousers = shade(outfit, -0.45);
  const skinDk = shade(L.skin, -0.14);
  const hair = topHair(L.hair, L.hairColor);
  const armLine = (key) => [
    h('line', {name: `${N}-${key}-o`, stroke: INK, 'stroke-width': 21, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${key}-i`, stroke: sleeve, 'stroke-width': 16, 'stroke-linecap': 'round'}),
    h('circle', {name: `${N}-${key}-h`, r: 8.5, fill: L.skin, stroke: INK, 'stroke-width': 2}),
  ];
  const node = g({name: N},
    h('ellipse', {cx: 3, cy: 8, rx: 50, ry: 34, fill: ctx.theme.shadow}),
    // walking feet (under the body)
    h('ellipse', {name: `${N}-footL`, cx: -13, cy: 0, rx: 9.5, ry: 14, fill: INK}),
    h('ellipse', {name: `${N}-footR`, cx: 13, cy: 0, rx: 9.5, ry: 14, fill: shade(INK, 0.18)}),
    // seated legs (forward, under the desk)
    g({name: `${N}-legs`, opacity: 0},
      h('path', {d: 'M-14 -2V-40M14 -2V-40', stroke: INK, 'stroke-width': 24, 'stroke-linecap': 'round'}),
      h('path', {d: 'M-14 -2V-40M14 -2V-40', stroke: trousers, 'stroke-width': 19, 'stroke-linecap': 'round'}),
      h('ellipse', {cx: -14, cy: -50, rx: 9.5, ry: 12, fill: INK}),
      h('ellipse', {cx: 14, cy: -50, rx: 9.5, ry: 12, fill: INK})),
    armLine('armL'),
    armLine('armR'),
    // shoulders and torso seen from above, collar at the front
    h('path', {d: 'M-42 4C-44 -10 -34 -18 -20 -18H20C34 -18 44 -10 42 4C41 15 32 20 20 20H-20C-32 20 -41 15 -42 4Z', fill: outfit, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-11 -18L0 -7L11 -18Z', fill: '#f4f1ea', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-30 8Q0 16 30 8', fill: 'none', stroke: shade(outfit, -0.25), 'stroke-width': 2}),
    // head from above: ears, face side forward (nose), hair from above
    g({name: `${N}-head`},
      h('ellipse', {cx: -21, cy: -1, rx: 5, ry: 7, fill: skinDk, stroke: INK, 'stroke-width': 1.8}),
      h('ellipse', {cx: 21, cy: -1, rx: 5, ry: 7, fill: skinDk, stroke: INK, 'stroke-width': 1.8}),
      hair.back,
      h('circle', {cx: 0, cy: -1, r: 21, fill: L.skin, stroke: INK, 'stroke-width': 2.4}),
      h('ellipse', {cx: 0, cy: -22, rx: 4.8, ry: 6, fill: L.skin, stroke: INK, 'stroke-width': 1.8}),
      L.glasses ? h('path', {d: 'M-15 -16Q-8 -21 -2 -17M2 -17Q8 -21 15 -16', fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}) : null,
      hair.front),
  );

  /**
   * @param {{x:number,y:number,deg?:number,scale?:number,phase?:number,walk?:number,seated?:number}} s
   */
  function pose(s) {
    const k = s.scale ?? 1;
    const walk = (s.walk ?? 0) * (1 - (s.seated ?? 0));
    const seated = s.seated ?? 0;
    const ph = s.phase ?? 0;
    const sw = Math.sin(ph);
    const nodes = {};
    nodes[N] = {transform: T(s.x, s.y, s.deg ?? 0, k)};
    nodes[`${N}-footL`] = {cy: r(-2 - 15 * sw * walk), opacity: r(1 - seated, 3)};
    nodes[`${N}-footR`] = {cy: r(-2 + 15 * sw * walk), opacity: r(1 - seated, 3)};
    nodes[`${N}-legs`] = {opacity: r(seated, 3)};
    for (const [key, side] of [['armL', -1], ['armR', 1]]) {
      const swing = side * sw * walk * 13;
      const hang = {x: side * 43, y: 16 + swing};
      const desk = {x: side * 24, y: -44};
      const hx = hang.x + (desk.x - hang.x) * seated;
      const hy = hang.y + (desk.y - hang.y) * seated;
      const sx = side * 34, sy = -2;
      const line = {x1: r(sx), y1: r(sy), x2: r(hx), y2: r(hy)};
      nodes[`${N}-${key}-o`] = line;
      nodes[`${N}-${key}-i`] = line;
      nodes[`${N}-${key}-h`] = {cx: r(hx), cy: r(hy)};
    }
    return nodes;
  }
  return {node, pose, size: PERSON};
}

/** Hair seen from above (covers the back and crown of the head). */
function topHair(style, color) {
  const dk = shade(color, -0.22);
  switch (style) {
    case 'long':
      return {
        back: h('path', {d: 'M-24 -2C-28 20 -18 34 0 34C18 34 28 20 24 -2Z', fill: dk, stroke: INK, 'stroke-width': 2}),
        front: h('path', {d: 'M-21 -6C-22 -20 -10 -24 0 -24C10 -24 22 -20 21 -6C22 8 14 20 0 21C-14 20 -22 8 -21 -6Z', fill: color, stroke: INK, 'stroke-width': 2, transform: 'translate(0 4)'}),
      };
    case 'bun':
      return {
        back: null,
        front: g(null,
          h('path', {d: 'M-21 -4C-21 -20 -8 -22 0 -22C8 -22 21 -20 21 -4C21 12 12 20 0 20C-12 20 -21 12 -21 -4Z', fill: color, stroke: INK, 'stroke-width': 2, transform: 'translate(0 3)'}),
          h('circle', {cx: 0, cy: 12, r: 9, fill: dk, stroke: INK, 'stroke-width': 2})),
      };
    case 'curly': {
      const bumps = [];
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.02 + (i / 8) * 0.96);
        bumps.push(h('circle', {cx: r(Math.cos(a) * 15), cy: r(Math.sin(a) * 13 + 2), r: 8.5, fill: color, stroke: INK, 'stroke-width': 1.6}));
      }
      return {back: null, front: g(null, h('circle', {cx: 0, cy: 3, r: 17, fill: color}), bumps, h('circle', {cx: 0, cy: -6, r: 8, fill: color, stroke: INK, 'stroke-width': 1.6}))};
    }
    case 'buzz':
      return {back: null, front: h('path', {d: 'M-19 -4C-19 -18 -8 -20 0 -20C8 -20 19 -18 19 -4C19 10 11 18 0 18C-11 18 -19 10 -19 -4Z', fill: color, opacity: 0.85, transform: 'translate(0 3)'})};
    case 'scarf':
      return {
        back: h('path', {d: 'M-27 -4C-29 18 -16 30 0 30C16 30 29 18 27 -4C24 -20 12 -26 0 -26C-12 -26 -24 -20 -27 -4Z', fill: dk, stroke: INK, 'stroke-width': 2}),
        front: h('path', {d: 'M-23 -8C-22 -22 -10 -26 0 -26C10 -26 22 -22 23 -8C24 10 14 24 0 24C-14 24 -24 10 -23 -8Z', fill: color, stroke: INK, 'stroke-width': 2, transform: 'translate(0 4)'}),
      };
    case 'short':
    default:
      return {back: null, front: h('path', {d: 'M-20 -4C-21 -19 -9 -22 0 -22C9 -22 21 -19 20 -4C20 11 12 19 0 19C-12 19 -20 11 -20 -4Z', fill: color, stroke: INK, 'stroke-width': 2, transform: 'translate(0 3)'})};
  }
}

/* ------------------------------------------------------------------ */
/* Routes and seat outlines                                            */
/* ------------------------------------------------------------------ */

/**
 * Dotted route along a polyline with draw-on progress (a mask reveals the
 * dots so the dash pattern never slides). frame(p, opacity).
 * @param {any} ctx
 * @param {{name:string, pts:Array<{x:number,y:number}>, color?:string, width?:number}} o
 */
export function routeTrail(ctx, o) {
  const poly = polyline(o.pts);
  const d = poly.d(1);
  const total = poly.total;
  const color = o.color ?? planColors(ctx).route;
  const w = o.width ?? 6;
  const xs = o.pts.map(q => q.x), ys = o.pts.map(q => q.y);
  const pad = 30;
  const mx = Math.min(...xs) - pad, my = Math.min(...ys) - pad;
  const node = g({name: o.name, opacity: 0},
    h('defs', null, h('mask', {id: ctx.id(`${o.name}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...xs) - mx + pad), height: r(Math.max(...ys) - my + pad)},
      h('path', {name: `${o.name}-masker`, d, fill: 'none', stroke: '#fff', 'stroke-width': w * 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}))),
    h('path', {d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `0.1 ${r(w * 2.6)}`, mask: ctx.ref(`${o.name}-mask`), opacity: 0.85}),
  );
  const frame = (p, opacity = 1) => ({
    [o.name]: {opacity: r(opacity, 3)},
    [`${o.name}-masker`]: {'stroke-dashoffset': r(total * (1 - Math.max(0, Math.min(1, p))))},
  });
  return {node, frame, poly, total};
}

/** Dashed outline marking an empty seat (neutral). */
export function seatRing(ctx, {name, cx, cy, rad = 40, opacity = 1}) {
  const c = planColors(ctx);
  return h('circle', {name, cx: r(cx), cy: r(cy), r: r(rad), fill: 'none', stroke: c.frame, 'stroke-width': 2.5, 'stroke-dasharray': '7 7', opacity});
}

/* ------------------------------------------------------------------ */
/* Generic building (front elevation)                                  */
/* ------------------------------------------------------------------ */

/**
 * Generic, fictional building front: plinth, a block with a window grid,
 * floor bands, a flat entrance canopy with glazed doors, a plain parapet and
 * a round tree beside it. No columns, dome, flag or emblem.
 * Local box (x, y, w, h) is the building incl. the ground line.
 * highlight: {floor, bay} (floor 0 = ground floor) gets the accent outline.
 * Returns the node, the box of every window (windowBox(floor, bay)) and the
 * plaque box (for a name label placed by the motif).
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, h:number, floors?:number, bays?:number, highlight?:{floor:number,bay:number}|null, tree?:boolean, plaque?:boolean}} o
 */
export function buildingElevation(ctx, o) {
  const th = ctx.theme;
  const c = planColors(ctx);
  const floors = o.floors ?? 3;
  const bays = o.bays ?? 5;
  const {x, y, w} = o;
  const hh = o.h;
  const treeW = o.tree === false ? 0 : Math.min(w * 0.22, hh * 0.32);
  const bx = x + treeW * 0.55, bw = w - treeW * 0.55;
  const ground = y + hh;
  const plinth = hh * 0.05;
  const parapet = hh * 0.07;
  const top = y + parapet;
  const bodyH = ground - plinth - top;
  const fh = bodyH / floors;
  const bayW = bw / bays;
  const mid = Math.floor(bays / 2);
  const winBox = (f, b) => {
    const fy = ground - plinth - (f + 1) * fh;
    const ww = bayW * 0.56, wh = fh * 0.56;
    return {x: bx + b * bayW + (bayW - ww) / 2, y: fy + fh * 0.2, w: ww, h: wh};
  };
  const parts = [];
  // ground and shadow
  parts.push(h('path', {d: `M${r(x - 8)} ${r(ground)}H${r(x + w + 8)}`, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round'}));
  parts.push(h('rect', {x: r(bx + 8), y: r(top + 10), width: r(bw), height: r(ground - top - 10), fill: th.shadow}));
  // body
  parts.push(h('rect', {x: r(bx), y: r(top), width: r(bw), height: r(ground - top), fill: c.stone, stroke: INK, 'stroke-width': 2.6}));
  // parapet and cornice
  parts.push(h('rect', {x: r(bx - 8), y: r(y), width: r(bw + 16), height: r(parapet), fill: c.stoneDark, stroke: INK, 'stroke-width': 2.4}));
  // plinth
  parts.push(h('rect', {x: r(bx - 4), y: r(ground - plinth), width: r(bw + 8), height: r(plinth), fill: shade(c.stoneDark, -0.08), stroke: INK, 'stroke-width': 2.2}));
  // floor bands
  for (let f = 1; f < floors; f++) {
    const fy = ground - plinth - f * fh;
    parts.push(h('path', {d: `M${r(bx)} ${r(fy)}H${r(bx + bw)}`, stroke: c.stoneDark, 'stroke-width': 4}));
  }
  // windows (the ground-floor middle bay is the entrance)
  for (let f = 0; f < floors; f++) {
    for (let b = 0; b < bays; b++) {
      if (f === 0 && b === mid) continue;
      const q = winBox(f, b);
      parts.push(g(null,
        h('rect', {x: r(q.x), y: r(q.y), width: r(q.w), height: r(q.h), fill: c.glass, stroke: INK, 'stroke-width': 2}),
        h('path', {d: `M${r(q.x + q.w / 2)} ${r(q.y)}V${r(q.y + q.h)}M${r(q.x)} ${r(q.y + q.h * 0.36)}H${r(q.x + q.w)}`, stroke: c.frame, 'stroke-width': 2}),
        h('path', {d: `M${r(q.x + q.w * 0.12)} ${r(q.y + q.h * 0.9)}L${r(q.x + q.w * 0.42)} ${r(q.y + q.h * 0.45)}`, stroke: '#ffffff', 'stroke-width': 2.4, opacity: 0.7, 'stroke-linecap': 'round'}),
        h('rect', {x: r(q.x - 3), y: r(q.y + q.h), width: r(q.w + 6), height: 5, fill: c.stoneDark, stroke: INK, 'stroke-width': 1.4})));
    }
  }
  // entrance: glazed double door under a flat canopy
  const dw = bayW * 0.72, dh = fh * 0.78;
  const dx = bx + mid * bayW + (bayW - dw) / 2, dy = ground - plinth - dh;
  parts.push(h('rect', {x: r(dx), y: r(dy), width: r(dw), height: r(dh + plinth), fill: shade(c.glass, -0.12), stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('path', {d: `M${r(dx + dw / 2)} ${r(dy)}V${r(dy + dh + plinth)}`, stroke: INK, 'stroke-width': 2.2}));
  parts.push(h('path', {d: `M${r(dx + dw / 2 - 8)} ${r(dy + dh * 0.55)}v14M${r(dx + dw / 2 + 8)} ${r(dy + dh * 0.55)}v14`, stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round'}));
  const canopyY = dy - fh * 0.12;
  parts.push(h('rect', {x: r(dx - bayW * 0.3), y: r(canopyY), width: r(dw + bayW * 0.6), height: r(fh * 0.08), rx: 3, fill: c.frame, stroke: INK, 'stroke-width': 2.2}));
  // plaque (blank; the motif may print a name on it)
  const plaque = {x: bx + bw * 0.12, y: y + parapet * 0.12, w: bw * 0.76, h: parapet * 0.76};
  // tree beside the building
  let tree = null;
  if (treeW > 0) {
    const tx = x + treeW * 0.5, tr = treeW * 0.5;
    tree = g(null,
      h('path', {d: `M${r(tx)} ${r(ground)}V${r(ground - tr * 1.6)}`, stroke: '#6b4a34', 'stroke-width': r(Math.max(5, tr * 0.18)), 'stroke-linecap': 'round'}),
      h('circle', {cx: r(tx), cy: r(ground - tr * 2.1), r: r(tr), fill: '#7e9a6a', stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: r(tx - tr * 0.35), cy: r(ground - tr * 2.35), r: r(tr * 0.45), fill: '#8faa7a', opacity: 0.9}));
  }
  let hl = null;
  if (o.highlight) {
    const q = winBox(o.highlight.floor, o.highlight.bay);
    hl = g({name: `${o.name}-hl`},
      h('rect', {x: r(q.x - 7), y: r(q.y - 7), width: r(q.w + 14), height: r(q.h + 14), rx: 6, fill: 'none', stroke: th.accent2, 'stroke-width': 5}),
      h('rect', {x: r(q.x), y: r(q.y), width: r(q.w), height: r(q.h), fill: th.accent2Soft, opacity: 0.85}));
  }
  const node = g({name: o.name}, tree, parts, hl);
  return {node, windowBox: winBox, plaque, body: {x: bx, y: top, w: bw, h: ground - top}, box: {x, y, w, h: hh}, entrance: {x: dx, y: dy, w: dw, h: dh + plinth}};
}
