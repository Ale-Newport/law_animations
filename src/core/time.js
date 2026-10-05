/**
 * Pure time helpers. Every function here is a deterministic function of its
 * arguments: no clocks, no tickers, no hidden state.
 * @module core/time
 */

/** @param {number} v @param {number} [lo=0] @param {number} [hi=1] */
export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

/** Linear interpolation. */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Normalized progress of `u` inside the window [a, b], clamped to [0, 1].
 * @param {number} u global normalized time
 * @param {number} a window start
 * @param {number} b window end
 */
export function seg(u, a, b) {
  if (b <= a) return u >= b ? 1 : 0;
  return clamp((u - a) / (b - a));
}

/** Easing functions (t in [0,1] -> [0,1]). */
export const ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  /** Small, discreet settle used for "arrive and rest" motion. */
  outBack: t => {
    const c1 = 1.25;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * Settle easing that honours reduced motion (no overshoot when reduced).
 * @param {number} t
 * @param {boolean} reduced
 */
export const settle = (t, reduced) => (reduced ? ease.outCubic(t) : ease.outBack(t));

/**
 * Evaluate a piecewise keyframe track.
 * @param {number} u normalized time
 * @param {Array<[number, number] | [number, number, (t:number)=>number]>} keys
 *   sorted [time, value, easingIntoThisKey?]
 */
export function track(u, keys) {
  if (!keys.length) return 0;
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (u <= t1) {
      const local = t1 === t0 ? 1 : (u - t0) / (t1 - t0);
      return lerp(v0, v1, (e || ease.inOutCubic)(local));
    }
  }
  return keys[keys.length - 1][1];
}

/**
 * Evaluate a keyframe track of points ({x,y}).
 * @param {number} u
 * @param {Array<[number, {x:number,y:number}, ((t:number)=>number)?]>} keys
 */
export function trackPoint(u, keys) {
  const xs = keys.map(k => [k[0], k[1].x, k[2]]);
  const ys = keys.map(k => [k[0], k[1].y, k[2]]);
  return {x: track(u, /** @type any */ (xs)), y: track(u, /** @type any */ (ys))};
}

/**
 * Build a named-phase lookup from brief beat proportions.
 * @param {Record<string,[number,number]>} phases
 */
export function phases(phases) {
  return {
    phases,
    /** local progress of a named phase */
    p(u, name) {
      const w = phases[name];
      if (!w) throw new Error(`Unknown phase "${name}"`);
      return seg(u, w[0], w[1]);
    },
    /** name of the phase active at u */
    at(u) {
      let current = Object.keys(phases)[0];
      for (const [name, [a]] of Object.entries(phases)) if (u >= a) current = name;
      return current;
    },
  };
}

/** Round to a fixed precision so serialized state is stable and "-0" free. */
export function r(v, digits = 2) {
  if (!Number.isFinite(v)) throw new Error(`Non-finite value in scene state: ${v}`);
  const m = Math.pow(10, digits);
  const out = Math.round(v * m) / m;
  return out === 0 ? 0 : out;
}

/** Stagger helper: progress of item i of n inside window [a,b] with overlap. */
export function stagger(u, i, n, a, b, overlap = 0.5) {
  const span = b - a;
  const each = span / (n - (n - 1) * overlap || 1);
  const start = a + i * each * (1 - overlap);
  return seg(u, start, start + each);
}
