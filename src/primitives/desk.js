/**
 * Top-down desk primitives: a framed desk "window" (clips everything inside,
 * so arms enter from the frame edge) and a two-bone arm with a hand whose
 * palm and thumb are separate layers (props pass between them).
 * @module primitives/desk
 */
import {h, g} from '../core/svg.js';
import {ik2, roundRectPath} from '../core/geometry.js';
import {T} from '../core/transform.js';
import {r} from '../core/time.js';
import {shade} from './paper.js';

/**
 * Desk surface inside a rounded window. Returns the surface node and a clip
 * reference that scenes apply to the group containing arms and props.
 */
export function deskWindow(ctx, {prefix, x, y, w, h: hh, radius = 28, wood, mat = true, seedKey}) {
  // seedKey lets paired or lens copies share identical grain independent of the node prefix
  const grainKey = seedKey || prefix;
  const th = ctx.theme;
  const top = wood || th.woodTop;
  const grain = [];
  const n = Math.max(6, Math.round(hh / 70));
  for (let i = 0; i < n; i++) {
    const gy = y + ((i + 0.5) / n) * hh + (ctx.rng(`${grainKey}-grain`, i) - 0.5) * 20;
    const wob = 6 + ctx.rng(`${grainKey}-wob`, i) * 10;
    grain.push(h('path', {d: `M${r(x)} ${r(gy)}C${r(x + w * 0.3)} ${r(gy - wob)} ${r(x + w * 0.6)} ${r(gy + wob)} ${r(x + w)} ${r(gy - wob * 0.4)}`, fill: 'none', stroke: shade(top, -0.12), 'stroke-width': 2, opacity: 0.55}));
  }
  const clipId = `${prefix}-clip`;
  const surface = g({name: `${prefix}-surface`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(x, y, w, hh, radius)}))),
    h('path', {d: roundRectPath(x, y, w, hh, radius), fill: top}),
    g({'clip-path': ctx.ref(clipId)}, grain,
      mat ? h('path', {d: roundRectPath(x + w * 0.06, y + hh * 0.08, w * 0.88, hh * 0.84, 22), fill: shade(top, -0.05), opacity: 0.6}) : null),
  );
  const frame = h('path', {d: roundRectPath(x, y, w, hh, radius), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2});
  return {surface, frame, clip: ctx.ref(clipId), box: {x, y, w, h: hh}};
}

/**
 * Top-down arm + hand rig.
 * Nodes: `${name}-upper`, `${name}-lower`, `${name}-cuff`, `${name}-hand` (palm
 * layer), `${name}-thumb` (thumb layer; place it above held props).
 * @param {any} ctx
 * @param {{name:string, skin:string, sleeve:string, cuff?:string, handed?:'right'|'left', upper?:number, lower?:number, width?:number}} o
 */
export function topArm(ctx, o) {
  const th = ctx.theme;
  const ARM = o.width ?? 46;
  const HS = o.handScale ?? 1.3; // hands are larger than the sleeve width
  const W = ARM; // hand geometry is authored in sleeve-width units, scaled by HS
  const side = o.handed === 'left' ? 1 : -1; // thumb side in local coords
  const skin = o.skin;
  const upperLen = o.upper ?? 230;
  const lowerLen = o.lower ?? 210;
  const HAND = 24 * HS * (ARM / 46); // wrist → palm centre
  const outline = th.ink;
  // outlines first so the elbow joint is seamless
  const armNodes = [
    h('line', {name: `${o.name}-upper-o`, stroke: outline, 'stroke-width': W + 5, 'stroke-linecap': 'round'}),
    h('line', {name: `${o.name}-lower-o`, stroke: outline, 'stroke-width': W * 0.92 + 5, 'stroke-linecap': 'round'}),
    h('line', {name: `${o.name}-upper`, stroke: o.sleeve, 'stroke-width': W, 'stroke-linecap': 'round'}),
    h('line', {name: `${o.name}-lower`, stroke: o.sleeve, 'stroke-width': W * 0.92, 'stroke-linecap': 'round'}),
    h('line', {name: `${o.name}-cuff`, stroke: o.cuff || '#f4f1ea', 'stroke-width': W * 0.8, 'stroke-linecap': 'butt'}),
  ];
  const palm = g({name: `${o.name}-hand`},
    // fingers (gripping) and palm
    h('path', {d: `M4 ${-W * 0.42}C${W * 0.5} ${-W * 0.52} ${W * 1.12} ${-W * 0.46} ${W * 1.18} ${-W * 0.1}C${W * 1.22} ${W * 0.1} ${W * 1.12} ${W * 0.44} ${W * 0.5} ${W * 0.46}C${W * 0.1} ${W * 0.48} -4 ${W * 0.3} -4 0C-4 ${-W * 0.3} 0 ${-W * 0.4} 4 ${-W * 0.42}Z`, fill: skin, stroke: outline, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${W * 0.78} ${-W * 0.3}q${W * 0.14} ${W * 0.06} ${W * 0.16} ${W * 0.2}M${W * 0.8} ${-W * 0.02}q${W * 0.14} ${W * 0.06} ${W * 0.16} ${W * 0.2}M${W * 0.76} ${W * 0.24}q${W * 0.12} ${W * 0.04} ${W * 0.14} ${W * 0.16}`, fill: 'none', stroke: shade(skin, -0.28), 'stroke-width': 2, 'stroke-linecap': 'round'}),
  );
  const thumb = g({name: `${o.name}-thumb`},
    h('path', {d: `M${W * 0.2} ${side * W * 0.3}C${W * 0.45} ${side * W * 0.62} ${W * 0.9} ${side * W * 0.66} ${W * 1.02} ${side * W * 0.42}C${W * 1.06} ${side * W * 0.3} ${W * 0.8} ${side * W * 0.24} ${W * 0.55} ${side * W * 0.22}Z`, fill: skin, stroke: outline, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
  );
  /**
   * Pose the arm so the palm centre sits on `hand` (world design units).
   * @param {{x:number,y:number}} shoulder
   * @param {{x:number,y:number}} hand
   * @param {1|-1} [bend]
   */
  function pose(shoulder, hand, bend = 1) {
    const s = ik2(shoulder, hand, upperLen, lowerLen + HAND, bend);
    const a = s.forearmAngle;
    const wrist = {x: s.hand.x - Math.cos(a) * HAND, y: s.hand.y - Math.sin(a) * HAND};
    const cuffA = {x: wrist.x - Math.cos(a) * 22, y: wrist.y - Math.sin(a) * 22};
    const cuffB = {x: wrist.x - Math.cos(a) * 4, y: wrist.y - Math.sin(a) * 4};
    const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
    const handT = T(wrist.x, wrist.y, (a * 180) / Math.PI, HS);
    return {
      nodes: {
        [`${o.name}-upper-o`]: line(shoulder, s.elbow),
        [`${o.name}-upper`]: line(shoulder, s.elbow),
        [`${o.name}-lower-o`]: line(s.elbow, wrist),
        [`${o.name}-lower`]: line(s.elbow, wrist),
        [`${o.name}-cuff`]: line(cuffA, cuffB),
        [`${o.name}-hand`]: {transform: handT},
        [`${o.name}-thumb`]: {transform: handT},
      },
      hand: s.hand,
      wrist,
      angle: a,
      reached: s.reached,
    };
  }
  return {arm: g({name: o.name}, armNodes), palm, thumb, pose, reach: upperLen + lowerLen + HAND};
}
