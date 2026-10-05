/**
 * Pure geometry helpers: vectors, curves, polyline sampling and a 2-bone IK
 * solver used by character rigs so hands always stay attached to arms.
 * @module core/geometry
 */

/** @typedef {{x:number,y:number}} Pt */

export const pt = (x, y) => ({x, y});
export const add = (a, b) => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a, b) => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a, k) => ({x: a.x * k, y: a.y * k});
export const len = a => Math.hypot(a.x, a.y);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const mix = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
export const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const deg = rad => (rad * 180) / Math.PI;
export const rad = d => (d * Math.PI) / 180;

/** Quadratic bezier point. */
export function quad(p0, p1, p2, t) {
  const u = 1 - t;
  return {x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y};
}

/** Cubic bezier point. */
export function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y};
}

/** Tangent angle of a cubic bezier at t (radians). */
export function cubicAngle(p0, p1, p2, p3, t) {
  const e = 1e-3;
  const a = cubic(p0, p1, p2, p3, Math.max(0, t - e));
  const b = cubic(p0, p1, p2, p3, Math.min(1, t + e));
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Sample a Catmull-Rom spline through points into a dense polyline.
 * @param {Pt[]} pts
 * @param {number} [perSeg=10]
 */
export function catmullRom(pts, perSeg = 10) {
  if (pts.length < 2) return pts.slice();
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Precompute cumulative lengths of a polyline for arc-length sampling.
 * @param {Pt[]} pts
 */
export function polyline(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1];
  return {
    pts,
    total,
    /** point at arc-length fraction t */
    at(t) {
      if (pts.length === 1 || total === 0) return {...pts[0], a: 0};
      const target = Math.min(Math.max(t, 0), 1) * total;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] <= target) lo = mid; else hi = mid;
      }
      const segLen = cum[hi] - cum[lo] || 1;
      const k = (target - cum[lo]) / segLen;
      const a = pts[lo], b = pts[hi];
      return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, a: Math.atan2(b.y - a.y, b.x - a.x)};
    },
    /** SVG path data for the whole polyline */
    d(precision = 1) {
      const f = v => (Math.round(v * 10 ** precision) / 10 ** precision);
      return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('');
    },
  };
}

/** Sample a cubic bezier into a polyline helper. */
export function cubicPolyline(p0, p1, p2, p3, n = 48) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(cubic(p0, p1, p2, p3, i / n));
  return polyline(pts);
}

/**
 * Two-bone inverse kinematics. Returns elbow and the reachable hand position.
 * @param {Pt} shoulder
 * @param {Pt} target
 * @param {number} upper upper-arm length
 * @param {number} lower forearm length
 * @param {1|-1} bend elbow bend direction
 */
export function ik2(shoulder, target, upper, lower, bend = 1) {
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  let d = Math.hypot(dx, dy);
  const maxReach = upper + lower - 0.01;
  const minReach = Math.abs(upper - lower) + 0.01;
  const base = Math.atan2(dy, dx);
  d = Math.min(Math.max(d, minReach), maxReach);
  const cosA = (upper * upper + d * d - lower * lower) / (2 * upper * d);
  const A = Math.acos(Math.min(1, Math.max(-1, cosA)));
  const elbowAngle = base - bend * A;
  const elbow = {x: shoulder.x + upper * Math.cos(elbowAngle), y: shoulder.y + upper * Math.sin(elbowAngle)};
  const hand = {x: shoulder.x + d * Math.cos(base), y: shoulder.y + d * Math.sin(base)};
  const forearmAngle = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);
  return {elbow, hand, upperAngle: elbowAngle, forearmAngle, reached: Math.hypot(dx, dy) <= maxReach + 0.02};
}

/** Axis-aligned rectangle helpers. */
export const rect = (x, y, w, h) => ({x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h});

/** Anchor point on a rectangle edge facing towards another point. */
export function edgeAnchor(box, toward, pad = 0) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const dx = toward.x - cx, dy = toward.y - cy;
  if (dx === 0 && dy === 0) return {x: cx, y: cy};
  const hw = box.w / 2 + pad, hh = box.h / 2 + pad;
  const s = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
  return {x: cx + dx * s, y: cy + dy * s};
}

/** Point on a circle edge facing toward another point. */
export function circleAnchor(c, radius, toward) {
  const a = Math.atan2(toward.y - c.y, toward.x - c.x);
  return {x: c.x + radius * Math.cos(a), y: c.y + radius * Math.sin(a)};
}

/** Rounded-rectangle path data (supports per-corner radii). */
export function roundRectPath(x, y, w, h, rad) {
  const r = Math.max(0, Math.min(rad, w / 2, h / 2));
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}
