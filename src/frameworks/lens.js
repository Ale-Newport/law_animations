/**
 * Detail lens (for `inspect` treatments). A real enlarged copy of a scene
 * region: the entry supplies content drawn in the SAME coordinates as the
 * context, so the lens preserves the detail's source coordinates exactly.
 * The lens window morphs from the source rectangle to its destination and
 * back; cone lines keep the detail visibly tied to its origin.
 * @module frameworks/lens
 */
import {h, g} from '../core/svg.js';
import {T} from '../core/transform.js';
import {lerp, r} from '../core/time.js';
import {roundRectPath} from '../core/geometry.js';

/**
 * @param {any} ctx
 * @param {{name:string, source:{x:number,y:number,w:number,h:number}, dest:{x:number,y:number,w:number,h:number}, content:any, frame?:{x:number,y:number,w:number,h:number}, radius?:number, color?:string}} o
 *   `frame` is the full context box used for the dimming overlay.
 */
export function lens(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const color = o.color ?? th.accent;
  const rad = o.radius ?? 26;
  const F = o.frame;
  const clipId = `${N}-clip`;
  const node = g({name: N},
    // dim everything except the source region (even-odd hole)
    F ? h('path', {name: `${N}-dim`, d: `M${r(F.x)} ${r(F.y)}h${r(F.w)}v${r(F.h)}h${r(-F.w)}Z` + holePath(o.source), 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}) : null,
    h('path', {name: `${N}-src`, d: roundRectPath(o.source.x, o.source.y, o.source.w, o.source.h, 10), fill: 'none', stroke: color, 'stroke-width': 4, opacity: 0}),
    h('line', {name: `${N}-coneA`, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('line', {name: `${N}-coneB`, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${N}-cliprect`, rx: rad}))),
    g({name: `${N}-win`, opacity: 0},
      h('rect', {name: `${N}-shadow`, rx: rad, fill: th.shadow}),
      h('rect', {name: `${N}-bg`, rx: rad, fill: th.paper}),
      g({'clip-path': ctx.ref(clipId)}, g({name: `${N}-content`}, o.content)),
      h('rect', {name: `${N}-border`, rx: rad, fill: 'none', stroke: color, 'stroke-width': 5}),
    ),
  );
  /**
   * @param {number} p  open progress 0 (collapsed onto the source) → 1 (at dest)
   * @param {number} [dim=p] overlay strength 0..1
   */
  const frame = (p, dim = p) => {
    const S = o.source, D = o.dest;
    const R = {x: lerp(S.x, D.x, p), y: lerp(S.y, D.y, p), w: lerp(S.w, D.w, p), h: lerp(S.h, D.h, p)};
    const k = R.w / S.w;
    const ky = R.h / S.h;
    const visible = p > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    const [a1, a2, b1, b2] = coneCorners(S, R);
    const out = {
      [`${N}-dim`]: F ? {opacity: r(0.42 * dim, 3)} : undefined,
      [`${N}-src`]: {opacity: visible ? 1 : 0},
      [`${N}-coneA`]: {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: p > 0.05 ? 1 : 0},
      [`${N}-coneB`]: {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: p > 0.05 ? 1 : 0},
      [`${N}-cliprect`]: rect,
      [`${N}-win`]: {opacity: visible ? Math.min(1, p * 4) : 0},
      [`${N}-shadow`]: {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height},
      [`${N}-bg`]: rect,
      [`${N}-border`]: rect,
      [`${N}-content`]: {transform: `${T(R.x - S.x * k, R.y - S.y * ky)} scale(${r(k, 4)} ${r(ky, 4)})`},
    };
    if (!F) delete out[`${N}-dim`];
    return out;
  };
  return {node, frame, zoom: o.dest.w / o.source.w};
}

function holePath(s) {
  return `M${r(s.x)} ${r(s.y)}v${r(s.h)}h${r(s.w)}v${r(-s.h)}Z`;
}

/** Choose the two cone lines joining the source and the lens window. */
function coneCorners(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  const horizontal = Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y);
  if (horizontal) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x;
    const rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y;
  const ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
}
