/**
 * Neutral state markers shared by all treatments (docs/AUTHORING.md → Legal
 * content: glyphs and colours carry meaning). Use these instead of drawing
 * ad-hoc discs, so every "changed" marker in the library looks the same and
 * never reads as approval (tick) or alarm (red disc / warning triangle).
 * @module primitives/markers
 */
import {h, g} from '../core/svg.js';
import {r} from '../core/time.js';

/**
 * "Changed datum" marker: a white Δ outline on the blue accent2 disc with a
 * paper rim, as used by the accepted inspect scenes (e.g. LAW-0004, LAW-0136).
 * Local origin = disc centre unless x/y are given.
 * @param {any} ctx
 * @param {{name?: string, x?: number, y?: number, radius?: number, opacity?: number}} [o]
 */
export function changedMarker(ctx, o = {}) {
  const th = ctx.theme;
  const R = o.radius ?? 18;
  const x = o.x ?? 0, y = o.y ?? 0;
  const s = R * 0.44; // Δ half-width
  return g({name: o.name, opacity: o.opacity},
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: th.accent2, stroke: th.paper, 'stroke-width': r(Math.max(3, R * 0.22))}),
    h('path', {d: `M${r(x)} ${r(y - s)}l${r(s)} ${r(s * 1.75)}h${r(-2 * s)}z`, fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(3, R * 0.2)), 'stroke-linejoin': 'round'}),
  );
}
