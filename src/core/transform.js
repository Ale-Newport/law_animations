/**
 * Transform string builders with fixed rounding, so serialized scene state is
 * stable across seek order and free of floating-point noise.
 * @module core/transform
 */
import {r} from './time.js';

/**
 * translate → rotate(deg) → scale.
 * @param {number} x
 * @param {number} y
 * @param {number} [rotDeg=0]
 * @param {number} [sx=1]
 * @param {number} [sy=sx]
 */
export function T(x, y, rotDeg = 0, sx = 1, sy = sx) {
  let s = `translate(${r(x)} ${r(y)})`;
  if (rotDeg) s += ` rotate(${r(rotDeg)})`;
  if (sx !== 1 || sy !== 1) s += ` scale(${r(sx, 4)} ${r(sy, 4)})`;
  return s;
}

/** Scale about a pivot point. */
export function scaleAbout(px, py, s, sy = s) {
  return `translate(${r(px)} ${r(py)}) scale(${r(s, 4)} ${r(sy, 4)}) translate(${r(-px)} ${r(-py)})`;
}

/** Rotate about a pivot point. */
export function rotateAbout(px, py, deg) {
  return `rotate(${r(deg)} ${r(px)} ${r(py)})`;
}

/** Compose transform strings (left applied outermost). */
export const compose = (...parts) => parts.filter(Boolean).join(' ');
