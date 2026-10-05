/**
 * Stateless seeded pseudo-random values. Each value is addressed by
 * (seed, key, index) so render order, seek order and mount order never
 * change the result. There is no shared random stream.
 * @module core/random
 */

/** 32-bit FNV-1a hash of a string. */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mix a 32-bit integer (splitmix-like finalizer). */
function mix(x) {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * Deterministic value in [0,1) for a seed and a key.
 * @param {number} seed
 * @param {string} key
 * @param {number} [index=0]
 */
export function rand(seed, key, index = 0) {
  const h = mix(hashString(key) ^ mix((seed | 0) + 0x9e3779b9) ^ mix(index + 1));
  return h / 4294967296;
}

/** Deterministic value in [lo, hi). */
export function randRange(seed, key, lo, hi, index = 0) {
  return lo + (hi - lo) * rand(seed, key, index);
}

/** Deterministic pick from an array. */
export function pick(seed, key, list, index = 0) {
  return list[Math.floor(rand(seed, key, index) * list.length) % list.length];
}

/**
 * Bound helper to a seed: rng('key', i) -> [0,1)
 * @param {number} seed
 */
export function seeded(seed) {
  const fn = (key, index = 0) => rand(seed, key, index);
  fn.range = (key, lo, hi, index = 0) => randRange(seed, key, lo, hi, index);
  fn.pick = (key, list, index = 0) => pick(seed, key, list, index);
  return fn;
}
