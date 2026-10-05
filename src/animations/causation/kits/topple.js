/**
 * Kinematic toppling solver for the "Cadena causal" motif (LAW-0681..0684).
 *
 * Bodies are rigid rectangles standing on a surface; each one rotates
 * clockwise (falls toward +x) about its bottom-right corner (the pivot).
 * A body only starts to move at the exact normalized time at which the
 * previous body first TOUCHES it (contact found geometrically with a
 * separating-axis test), and while two bodies touch, the leaning body's
 * angle is limited so the two polygons never interpenetrate. Everything is a
 * pure function of (geometry, u): no state is carried between frames.
 *
 * Local frame of a body (before rotation): x ∈ [-w, 0], y ∈ [-h, 0] with the
 * pivot at (0, 0). SVG `rotate(+θ)` about the pivot gives the same pose.
 * A body with `dir: -1` is the mirror image: it stands with its pivot at the
 * bottom-LEFT corner and falls toward -x (counter-clockwise). Its local
 * coordinates stay those of the unmirrored body; the world x offset from the
 * pivot is negated (SVG: translate(pivot) rotate(-θ) scale(-1 1)).
 * @module animations/causation/kits/topple
 */

import {r} from '../../../core/time.js';

const DEG = Math.PI / 180;

/**
 * World corners of a body at angle θ (radians): [BL, BR(pivot), TR, TL].
 * @param {{w:number,h:number,pivot:{x:number,y:number}}} b
 * @param {number} th
 */
export function bodyCorners(b, th) {
  const c = Math.cos(th), s = Math.sin(th);
  const d = b.dir ?? 1;
  const R = (x, y) => ({x: b.pivot.x + d * (x * c - y * s), y: b.pivot.y + x * s + y * c});
  return [R(-b.w, 0), R(0, 0), R(0, -b.h), R(-b.w, -b.h)];
}

/** World point of a body-local point at angle θ (radians). */
export function bodyPoint(b, th, local) {
  const c = Math.cos(th), s = Math.sin(th);
  const d = b.dir ?? 1;
  return {x: b.pivot.x + d * (local.x * c - local.y * s), y: b.pivot.y + local.x * s + local.y * c};
}

/** Body-local coordinates of a world point for a body at angle 0. */
export function localAt0(b, q) {
  return {x: (b.dir ?? 1) * (q.x - b.pivot.x), y: q.y - b.pivot.y};
}

/** SVG transform that places art drawn in the body-local frame at angle θ (degrees). */
export function poseTransform(b, deg) {
  const d = b.dir ?? 1;
  const t = `translate(${r(b.pivot.x)} ${r(b.pivot.y)})`;
  const a = r(d * deg);
  return `${t}${a ? ` rotate(${a})` : ''}${d < 0 ? ' scale(-1 1)' : ''}`;
}

/**
 * Signed distance of world point q from the trailing face (local x = -w) of
 * body b at angle θ: positive = outside the body (still apart), ≤ 0 = touching
 * or inside. Works for both fall directions.
 */
export function faceGap(b, th, q) {
  const bl = bodyPoint(b, th, {x: -b.w, y: 0});
  const tl = bodyPoint(b, th, {x: -b.w, y: -b.h});
  const inner = bodyPoint(b, th, {x: 0, y: 0});
  const dx = tl.x - bl.x, dy = tl.y - bl.y;
  const L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L;
  if ((inner.x - bl.x) * nx + (inner.y - bl.y) * ny > 0) { nx = -nx; ny = -ny; }
  return (q.x - bl.x) * nx + (q.y - bl.y) * ny;
}

/** Axis-aligned rectangle as a polygon. */
export const rectPoly = (x, y, w, h) => [{x, y}, {x: x + w, y}, {x: x + w, y: y + h}, {x, y: y + h}];

function project(poly, ax, ay) {
  let lo = Infinity, hi = -Infinity;
  for (const p of poly) {
    const v = p.x * ax + p.y * ay;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return [lo, hi];
}

/**
 * Separating-axis overlap test for two convex polygons. Touching (overlap
 * smaller than `eps`) does not count as intersecting.
 */
export function overlaps(A, B, eps = 0.05) {
  for (const poly of [A, B]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const ax = -(q.y - p.y), ay = q.x - p.x;
      const L = Math.hypot(ax, ay) || 1;
      const [a0, a1] = project(A, ax / L, ay / L);
      const [b0, b1] = project(B, ax / L, ay / L);
      if (a1 <= b0 + eps || b1 <= a0 + eps) return false;
    }
  }
  return true;
}

const hits = (poly, obstacles) => obstacles.some(o => overlaps(poly, o));

/**
 * Largest angle in [0, maxTh] the body can reach without penetrating any
 * obstacle when sweeping up from 0 (assumes it is free at 0). The sweep is
 * sampled in small steps first, so an obstacle that is only crossed part-way
 * through a long swing (a tile tipping over a landing edge) is not skipped.
 */
export function maxFree(b, obstacles, maxTh) {
  if (maxTh <= 0 || !obstacles.length) return Math.max(0, maxTh);
  const step = 2.5 * DEG;
  let lo = 0, hi = null;
  for (let a = Math.min(step, maxTh); ; a = Math.min(a + step, maxTh)) {
    if (hits(bodyCorners(b, a), obstacles)) { hi = a; break; }
    lo = a;
    if (a >= maxTh) return maxTh;
  }
  for (let k = 0; k < 26; k++) {
    const mid = (lo + hi) / 2;
    if (hits(bodyCorners(b, mid), obstacles)) hi = mid; else lo = mid;
  }
  return lo;
}

/** Free-fall schedule shape: gentle start, accelerating (inverted pendulum). */
const V0 = 0.28;
const fall = tau => V0 * tau + (1 - V0) * tau * tau;
const fallInv = f => (-V0 + Math.sqrt(V0 * V0 + 4 * (1 - V0) * f)) / (2 * (1 - V0));

/**
 * Build a toppling chain.
 * @param {object} o
 * @param {Array<{w:number,h:number,pivot:{x:number,y:number},maxDeg?:number,dur?:number,statics?:Array<Array<{x:number,y:number}>>}>} o.bodies
 *   in chain order; `dur` = normalized time to sweep maxDeg if unobstructed
 * @param {number} o.start  normalized time at which body 0 starts to fall
 * @param {number|null} [o.stopAtLink]  if set, body stopAtLink+1 and later
 *   never start (the chain is held at that link's contact)
 */
export function toppleChain(o) {
  const B = o.bodies.map(b => ({...b, maxTh: (b.maxDeg ?? 88) * DEG, statics: b.statics || []}));
  const n = B.length;
  const starts = new Array(n).fill(Infinity);
  const contactTh = new Array(n).fill(null); // angle of body i when it first touches body i+1
  starts[0] = o.start;
  for (let i = 0; i < n - 1; i++) {
    if (!Number.isFinite(starts[i])) break;
    const upright = bodyCorners(B[i + 1], 0);
    const th = maxFree(B[i], [...B[i].statics, upright], B[i].maxTh);
    const touches = th < B[i].maxTh - 1e-6 && hits(bodyCorners(B[i], Math.min(B[i].maxTh, th + 0.004)), [upright]);
    if (!touches) break;
    contactTh[i] = th;
    starts[i + 1] = starts[i] + fallInv(th / B[i].maxTh) * B[i].dur;
  }
  const stopAt = o.stopAtLink ?? null;

  /** scheduled (unobstructed) angle of body i at time u */
  const sched = (i, u) => {
    if (!(u > starts[i])) return 0;
    const tau = Math.min(1, (u - starts[i]) / B[i].dur);
    return B[i].maxTh * fall(tau);
  };

  /**
   * Solve the chain at normalized time u.
   * @param {number} u
   * @returns {{angles:number[], started:boolean[], touching:boolean[]}}
   *   angles in radians; touching[i] = body i is in contact with body i+1
   */
  function at(u) {
    const angles = new Array(n).fill(0);
    const active = stopAt === null ? n : Math.min(n, stopAt + 1);
    for (let i = active - 1; i >= 0; i--) {
      let a = sched(i, u);
      if (stopAt !== null && i === stopAt && contactTh[i] !== null) a = Math.min(a, contactTh[i]);
      if (a > 0) {
        const obs = [...B[i].statics];
        if (i + 1 < n) obs.push(bodyCorners(B[i + 1], angles[i + 1]));
        a = maxFree(B[i], obs, a);
      }
      angles[i] = a;
    }
    const started = starts.map((s, i) => i < active && u > s);
    const touching = angles.map((a, i) => i < n - 1 && contactTh[i] !== null && i < active && u >= starts[i + 1] - 1e-9);
    return {angles, started, touching};
  }

  return {
    bodies: B,
    starts,
    contactTh,
    at,
    /** normalized time at which body i reaches `deg` degrees if unobstructed */
    timeAtAngle: (i, deg) => starts[i] + fallInv(Math.min(1, (deg * DEG) / B[i].maxTh)) * B[i].dur,
    /** fully settled pose (all bodies at rest) */
    settled: () => at(1e6),
  };
}

export {DEG};
