/**
 * Compact node badges for mechanism diagrams: a person bust, a prop icon
 * holder and a generic component frame. Each returns its box so connectors
 * can anchor to real edges.
 * @module primitives/badges
 */
import {h, g} from '../core/svg.js';
import {T} from '../core/transform.js';
import {r} from '../core/time.js';
import {shade} from './paper.js';
import {chip} from './annotate.js';

/**
 * Person bust inside a round badge. Local origin = badge centre.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, radius?:number, look:{skin:string, hair:string, hairColor:string, outfit:string, glasses?:boolean}, label?:string, labelMax?:number, ring?:string}} o
 */
export function personBadge(ctx, o) {
  const th = ctx.theme;
  const R = o.radius ?? 80;
  const L = o.look;
  const clip = `${o.name}-clip`;
  const headR = R * 0.3;
  const hy = -R * 0.12;
  const hair = hairShape(L.hair, headR, hy, L.hairColor);
  const parts = [
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('circle', {r: R - 3}))),
    h('circle', {r: R, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke}),
    g({'clip-path': ctx.ref(clip)},
      hair.back,
      // shoulders / torso
      h('path', {d: `M${r(-R * 0.72)} ${r(R)}C${r(-R * 0.7)} ${r(R * 0.36)} ${r(-R * 0.42)} ${r(R * 0.26)} 0 ${r(R * 0.26)}C${r(R * 0.42)} ${r(R * 0.26)} ${r(R * 0.7)} ${r(R * 0.36)} ${r(R * 0.72)} ${r(R)}Z`, fill: L.outfit, stroke: th.ink, 'stroke-width': 2.5}),
      h('path', {d: `M${r(-R * 0.14)} ${r(R * 0.27)}L0 ${r(R * 0.5)}L${r(R * 0.14)} ${r(R * 0.27)}Z`, fill: '#f4f1ea', stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: -headR * 0.34, y: hy + headR * 0.7, width: headR * 0.68, height: headR * 0.8, fill: L.skin, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: 0, cy: hy, r: headR, fill: L.skin, stroke: th.ink, 'stroke-width': 2.5}),
      hair.front,
      h('circle', {cx: -headR * 0.36, cy: hy + headR * 0.05, r: headR * 0.09, fill: th.ink}),
      h('circle', {cx: headR * 0.36, cy: hy + headR * 0.05, r: headR * 0.09, fill: th.ink}),
      h('path', {d: `M${r(-headR * 0.3)} ${r(hy + headR * 0.45)}q${r(headR * 0.3)} ${r(headR * 0.2)} ${r(headR * 0.6)} 0`, fill: 'none', stroke: th.ink, 'stroke-width': 2, 'stroke-linecap': 'round'}),
      L.glasses ? g(null,
        h('circle', {cx: -headR * 0.36, cy: hy + headR * 0.05, r: headR * 0.24, fill: 'none', stroke: th.ink, 'stroke-width': 2}),
        h('circle', {cx: headR * 0.36, cy: hy + headR * 0.05, r: headR * 0.24, fill: 'none', stroke: th.ink, 'stroke-width': 2}),
        h('line', {x1: -headR * 0.12, x2: headR * 0.12, y1: hy + headR * 0.05, y2: hy + headR * 0.05, stroke: th.ink, 'stroke-width': 2})) : null,
    ),
    h('circle', {r: R, fill: 'none', stroke: o.ring || th.ink, 'stroke-width': o.ring ? 5 : th.stroke}),
  ];
  let labelNode = null;
  let labelBox = null;
  if (o.label && ctx.show('key')) {
    const c = chip(ctx, o.label, {x: 0, y: R + 12, anchor: 'middle', maxWidth: o.labelMax ?? 320, size: 28, maxLines: 2});
    labelNode = c.node;
    labelBox = c.box;
  }
  return {
    node: g({name: o.name, transform: T(o.x, o.y)}, g({name: `${o.name}-body`}, parts), labelNode),
    box: {x: o.x - R, y: o.y - R, w: R * 2, h: R * 2},
    circle: {x: o.x, y: o.y, r: R},
    labelBox: labelBox && {x: labelBox.x + o.x, y: labelBox.y + o.y, w: labelBox.w, h: labelBox.h},
  };
}

/** Hair shapes (back layer behind head, front layer over it). */
export function hairShape(style, R, cy, color) {
  const dark = shade(color, -0.15);
  switch (style) {
    case 'long':
      return {
        back: h('path', {d: `M${r(-R * 1.05)} ${r(cy)}C${r(-R * 1.15)} ${r(cy + R * 1.4)} ${r(-R * 0.9)} ${r(cy + R * 2)} ${r(-R * 0.55)} ${r(cy + R * 2.1)}H${r(R * 0.55)}C${r(R * 0.9)} ${r(cy + R * 2)} ${r(R * 1.15)} ${r(cy + R * 1.4)} ${r(R * 1.05)} ${r(cy)}Z`, fill: dark, stroke: '#1f2328', 'stroke-width': 2}),
        front: h('path', {d: `M${r(-R * 1.02)} ${r(cy + R * 0.1)}C${r(-R * 1.05)} ${r(cy - R * 1.1)} ${r(R * 1.05)} ${r(cy - R * 1.1)} ${r(R * 1.02)} ${r(cy + R * 0.1)}C${r(R * 0.6)} ${r(cy - R * 0.45)} ${r(-R * 0.2)} ${r(cy - R * 0.55)} ${r(-R * 1.02)} ${r(cy + R * 0.1)}Z`, fill: color, stroke: '#1f2328', 'stroke-width': 2}),
      };
    case 'bun':
      return {
        back: h('circle', {cx: R * 0.1, cy: cy - R * 1.05, r: R * 0.42, fill: color, stroke: '#1f2328', 'stroke-width': 2}),
        front: h('path', {d: `M${r(-R * 1.0)} ${r(cy + R * 0.05)}C${r(-R * 1.0)} ${r(cy - R * 1.1)} ${r(R * 1.0)} ${r(cy - R * 1.1)} ${r(R * 1.0)} ${r(cy + R * 0.05)}C${r(R * 0.5)} ${r(cy - R * 0.5)} ${r(-R * 0.5)} ${r(cy - R * 0.5)} ${r(-R * 1.0)} ${r(cy + R * 0.05)}Z`, fill: color, stroke: '#1f2328', 'stroke-width': 2}),
      };
    case 'curly': {
      const bumps = [];
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1.05 + (i / 6) * 0.9);
        bumps.push(h('circle', {cx: Math.cos(a) * R * 0.92, cy: cy + Math.sin(a) * R * 0.92, r: R * 0.36, fill: color, stroke: '#1f2328', 'stroke-width': 2}));
      }
      return {back: g(null, bumps), front: h('path', {d: `M${r(-R * 0.9)} ${r(cy - R * 0.2)}Q0 ${r(cy - R * 0.95)} ${r(R * 0.9)} ${r(cy - R * 0.2)}Q0 ${r(cy - R * 0.55)} ${r(-R * 0.9)} ${r(cy - R * 0.2)}Z`, fill: color}) };
    }
    case 'buzz':
      return {back: null, front: h('path', {d: `M${r(-R * 0.98)} ${r(cy - R * 0.05)}C${r(-R * 0.95)} ${r(cy - R * 1.05)} ${r(R * 0.95)} ${r(cy - R * 1.05)} ${r(R * 0.98)} ${r(cy - R * 0.05)}C${r(R * 0.6)} ${r(cy - R * 0.62)} ${r(-R * 0.6)} ${r(cy - R * 0.62)} ${r(-R * 0.98)} ${r(cy - R * 0.05)}Z`, fill: color, opacity: 0.9})};
    case 'scarf':
      return {
        back: h('path', {d: `M${r(-R * 1.25)} ${r(cy + R * 1.6)}C${r(-R * 1.4)} ${r(cy - R * 0.4)} ${r(-R * 0.9)} ${r(cy - R * 1.35)} 0 ${r(cy - R * 1.35)}C${r(R * 0.9)} ${r(cy - R * 1.35)} ${r(R * 1.4)} ${r(cy - R * 0.4)} ${r(R * 1.25)} ${r(cy + R * 1.6)}Z`, fill: color, stroke: '#1f2328', 'stroke-width': 2}),
        front: h('path', {d: `M${r(-R * 0.95)} ${r(cy + R * 0.2)}C${r(-R * 0.95)} ${r(cy - R * 1.0)} ${r(R * 0.95)} ${r(cy - R * 1.0)} ${r(R * 0.95)} ${r(cy + R * 0.2)}C${r(R * 0.75)} ${r(cy - R * 0.55)} ${r(-R * 0.75)} ${r(cy - R * 0.55)} ${r(-R * 0.95)} ${r(cy + R * 0.2)}Z`, fill: color, stroke: '#1f2328', 'stroke-width': 2}),
      };
    case 'short':
    default:
      return {back: null, front: h('path', {d: `M${r(-R * 1.02)} ${r(cy + R * 0.15)}C${r(-R * 1.1)} ${r(cy - R * 1.15)} ${r(R * 1.1)} ${r(cy - R * 1.15)} ${r(R * 1.02)} ${r(cy - R * 0.05)}C${r(R * 0.55)} ${r(cy - R * 0.6)} ${r(-R * 0.35)} ${r(cy - R * 0.35)} ${r(-R * 1.02)} ${r(cy + R * 0.15)}Z`, fill: color, stroke: '#1f2328', 'stroke-width': 2})};
  }
}

/**
 * Round icon badge holding an arbitrary icon node drawn around (0,0).
 */
export function iconBadge(ctx, {name, x, y, radius = 62, icon, label, labelMax = 280, fill}) {
  const th = ctx.theme;
  let labelNode = null;
  if (label && ctx.show('key')) labelNode = chip(ctx, label, {x: 0, y: radius + 12, anchor: 'middle', maxWidth: labelMax, size: 26, maxLines: 2}).node;
  return {
    node: g({name, transform: T(x, y)}, g({name: `${name}-body`},
      h('circle', {r: radius, fill: fill || th.card, stroke: th.ink, 'stroke-width': th.stroke}), icon), labelNode),
    box: {x: x - radius, y: y - radius, w: radius * 2, h: radius * 2},
    circle: {x, y, r: radius},
  };
}
