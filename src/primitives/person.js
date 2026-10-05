/**
 * Stylized three-quarter-view character rig (standing or seated).
 * Original vector design: simple, coherent, not anatomically realistic.
 *
 *  - Local origin: floor point between the feet (standing) or the seat
 *    point under the hips (seated). Local design faces +x.
 *  - Arms are two-bone IK chains ending in mitten hands, so hands can never
 *    detach; `frame()` returns the solved WORLD hand positions for props.
 *  - Facing −1 mirrors the whole figure; IK is solved in local space.
 *  - Appearance comes from actorLook(); it never encodes a role or verdict.
 * @module primitives/person
 */
import {h, g} from '../core/svg.js';
import {T, rotateAbout} from '../core/transform.js';
import {ik2, rad} from '../core/geometry.js';
import {r} from '../core/time.js';
import {shade} from './paper.js';

const INK = '#1f2328';
const UPPER = 80;
const LOWER = 76;
const HAND_R = 15;

/**
 * @param {any} ctx
 * @param {{name:string, look:{skin:string,hair:string,hairColor:string,outfit:string,glasses?:boolean}, pose?:'standing'|'seated', chair?:boolean}} o
 */
export function personRig(ctx, o) {
  const N = o.name;
  const L = o.look;
  const seated = o.pose === 'seated';
  const lift = seated ? 190 : 0; // upper body sits 190 lower when seated (hips at y=0)
  const Y = v => v + lift;       // map standing upper-body coordinates to the pose
  const hip = {x: 0, y: Y(-186)};
  const neck = {x: 2, y: Y(-330)};
  const headC = {x: 5, y: Y(-366)};
  const shoulderNear = {x: 12, y: Y(-302)};
  const shoulderFar = {x: -14, y: Y(-305)};
  const trousers = shade(L.outfit, -0.45);
  const sleeve = L.outfit;
  const skinShade = shade(L.skin, -0.12);

  // ---- legs
  const legs = seated
    ? g(null,
      h('path', {d: `M-10 0H62Q76 0 76 14V112`, fill: 'none', stroke: INK, 'stroke-width': 34, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d: `M-10 0H62Q76 0 76 14V112`, fill: 'none', stroke: trousers, 'stroke-width': 29, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('ellipse', {cx: 90, cy: 118, rx: 24, ry: 10, fill: INK}))
    : g(null,
      legLine(-7, Y(-190), -9, -14, trousers),
      legLine(7, Y(-190), 11, -14, trousers),
      h('ellipse', {cx: -2, cy: -8, rx: 21, ry: 9, fill: INK}),
      h('ellipse', {cx: 21, cy: -8, rx: 21, ry: 9, fill: shade(INK, 0.15)}));

  // ---- torso
  const torso = g(null,
    h('path', {d: `M-38 ${Y(-296)}Q-40 ${Y(-320)} -18 ${Y(-322)}H24Q42 ${Y(-320)} 40 ${Y(-296)}L36 ${Y(-196)}Q34 ${Y(-180)} 18 ${Y(-180)}H-20Q-36 ${Y(-180)} -36 ${Y(-196)}Z`, fill: L.outfit, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    h('path', {d: `M-6 ${Y(-322)}L6 ${Y(-296)}L18 ${Y(-322)}Z`, fill: '#f4f1ea', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M6 ${Y(-296)}V${Y(-200)}`, stroke: shade(L.outfit, -0.25), 'stroke-width': 2}),
    h('path', {d: `M-30 ${Y(-200)}H34`, stroke: shade(L.outfit, -0.25), 'stroke-width': 3}),
  );
  const neckNode = h('rect', {x: -8, y: Y(-340), width: 20, height: 22, rx: 4, fill: skinShade, stroke: INK, 'stroke-width': 2});

  // ---- head
  const hair = profileHair(L.hair, headC, L.hairColor);
  const eyeY = headC.y - 4;
  const head = g({name: `${N}-head`},
    hair.back,
    h('circle', {cx: headC.x, cy: headC.y, r: 36, fill: L.skin, stroke: INK, 'stroke-width': 2.8}),
    h('ellipse', {cx: headC.x - 20, cy: headC.y + 2, rx: 7, ry: 9, fill: skinShade, stroke: INK, 'stroke-width': 2}),
    h('ellipse', {cx: headC.x + 11, cy: eyeY, rx: 3.4, ry: 4.2, fill: INK}),
    h('ellipse', {cx: headC.x + 27, cy: eyeY, rx: 3, ry: 4, fill: INK}),
    h('path', {d: `M${headC.x + 6} ${eyeY - 10}q6 -3 11 0M${headC.x + 23} ${eyeY - 10}q5 -2 9 0`, fill: 'none', stroke: shade(L.hairColor, -0.1), 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
    h('path', {d: `M${headC.x + 33} ${headC.y - 2}l5 9l-6 2`, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {name: `${N}-mouth`, d: mouthPath(headC, 0), fill: '#7a2f2a', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    L.glasses ? g(null,
      h('circle', {cx: headC.x + 11, cy: eyeY, r: 8.5, fill: 'none', stroke: INK, 'stroke-width': 2}),
      h('circle', {cx: headC.x + 28, cy: eyeY, r: 7.5, fill: 'none', stroke: INK, 'stroke-width': 2}),
      h('path', {d: `M${headC.x + 19.5} ${eyeY}h1M${headC.x + 2} ${eyeY - 1}l-18 -3`, stroke: INK, 'stroke-width': 2})) : null,
    hair.front,
  );

  const arm = (key, sh, color) => g({name: `${N}-${key}`},
    h('line', {name: `${N}-${key}-uo`, stroke: INK, 'stroke-width': 25, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${key}-lo`, stroke: INK, 'stroke-width': 23, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${key}-u`, stroke: color, 'stroke-width': 20, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${key}-l`, stroke: color, 'stroke-width': 18, 'stroke-linecap': 'round'}),
    g({name: `${N}-${key}-hand`},
      h('path', {d: `M-4 -11C8 -14 20 -10 22 -1C23 8 12 13 0 11C-6 10 -8 -8 -4 -11Z`, fill: L.skin, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      h('path', {d: `M6 -9C12 -18 20 -18 20 -12`, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'})),
  );
  const chair = seated && o.chair !== false
    ? g(null,
      h('rect', {x: -64, y: Y(-300), width: 22, height: 300, rx: 8, fill: '#6d5a4b', stroke: INK, 'stroke-width': 2.5}),
      h('rect', {x: -60, y: -6, width: 130, height: 16, rx: 6, fill: '#7d6857', stroke: INK, 'stroke-width': 2.5}),
      h('path', {d: 'M-50 10V150M60 10V150', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round'}))
    : null;

  const node = g({name: N},
    chair,
    arm('far', shoulderFar, shade(sleeve, -0.18)),
    legs,
    g({name: `${N}-upper`}, torso, neckNode, head),
    arm('near', shoulderNear, sleeve),
  );

  /**
   * Pose the rig.
   * @param {{x:number, y:number, facing?:1|-1, scale?:number, lean?:number, headTilt?:number, mouth?:number,
   *          near?:{x:number,y:number}|null, far?:{x:number,y:number}|null, nearRest?:{x:number,y:number}, farRest?:{x:number,y:number}}} s
   *   near/far: WORLD targets for the hands (null = rest pose).
   */
  function frame(s) {
    const f = s.facing ?? 1;
    const k = s.scale ?? 1;
    const lean = s.lean ?? 0;
    const nodes = {};
    nodes[N] = {transform: `${T(s.x, s.y)} scale(${r(f * k, 4)} ${r(k, 4)})`};
    nodes[`${N}-upper`] = {transform: lean ? rotateAbout(hip.x, hip.y, lean) : ''};
    nodes[`${N}-head`] = {transform: s.headTilt ? rotateAbout(neck.x, neck.y, s.headTilt) : ''};
    nodes[`${N}-mouth`] = {d: mouthPath(headC, s.mouth ?? 0)};
    const toLocal = p => ({x: (p.x - s.x) / (f * k), y: (p.y - s.y) / k});
    const toWorld = p => ({x: s.x + p.x * f * k, y: s.y + p.y * k});
    const leanPt = p => rotatePt(p, hip, lean);
    const hands = {};
    let reached = true;
    for (const [key, shoulder0] of [['near', shoulderNear], ['far', shoulderFar]]) {
      const shoulder = leanPt(shoulder0);
      const restLocal = seated
        ? {x: shoulder.x + 62, y: shoulder.y + 118}
        : {x: shoulder.x + (key === 'near' ? 10 : 4), y: shoulder.y + 146};
      const target = s[key] ? toLocal(s[key]) : (s[`${key}Rest`] ? toLocal(s[`${key}Rest`]) : restLocal);
      const sol = ik2(shoulder, target, UPPER, LOWER + HAND_R * 0.6, -1);
      if (s[key] && !sol.reached) reached = false;
      const a = sol.forearmAngle;
      const wrist = {x: sol.hand.x - Math.cos(a) * HAND_R * 0.6, y: sol.hand.y - Math.sin(a) * HAND_R * 0.6};
      const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
      nodes[`${N}-${key}-uo`] = line(shoulder, sol.elbow);
      nodes[`${N}-${key}-u`] = line(shoulder, sol.elbow);
      nodes[`${N}-${key}-lo`] = line(sol.elbow, wrist);
      nodes[`${N}-${key}-l`] = line(sol.elbow, wrist);
      nodes[`${N}-${key}-hand`] = {transform: T(wrist.x, wrist.y, (a * 180) / Math.PI)};
      const w = toWorld(sol.hand);
      const worldAngle = f === 1 ? a : Math.PI - a;
      hands[key] = {x: w.x, y: w.y, angle: worldAngle};
    }
    const headWorld = toWorld(leanPt(headC));
    const mouthWorld = toWorld(leanPt({x: headC.x + 30, y: headC.y + 20}));
    return {nodes, hands, reached, head: headWorld, mouth: mouthWorld, top: toWorld(leanPt({x: headC.x, y: headC.y - 42}))};
  }

  /** Useful local anchors converted by the scene if needed. */
  const anchors = {headC, hip, shoulderNear, shoulderFar, height: seated ? 230 : 410, lift};
  return {node, frame, anchors};
}

function legLine(x1, y1, x2, y2, color) {
  return g(null,
    h('line', {x1, y1, x2, y2, stroke: INK, 'stroke-width': 33, 'stroke-linecap': 'round'}),
    h('line', {x1, y1, x2, y2, stroke: color, 'stroke-width': 28, 'stroke-linecap': 'round'}));
}

function rotatePt(p, c, deg) {
  if (!deg) return p;
  const a = rad(deg);
  const dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a)};
}

/** Mouth: closed smile line at 0, rounded open shape up to 1. */
export function mouthPath(c, open) {
  const x = c.x + 15, y = c.y + 19;
  const o = Math.max(0, Math.min(1, open));
  if (o < 0.04) return `M${r(x)} ${r(y)}q7 3 14 0q-7 1 -14 0Z`;
  return `M${r(x)} ${r(y - 1)}q7 ${r(-2 * o)} 14 0q-7 ${r(4 + 9 * o)} -14 0Z`;
}

/** Hair seen in three-quarter view (covers the back of the head). */
function profileHair(style, c, color) {
  const dk = shade(color, -0.2);
  const x = c.x, y = c.y;
  switch (style) {
    case 'long':
      return {
        back: h('path', {d: `M${x - 34} ${y - 12}C${x - 50} ${y + 40} ${x - 44} ${y + 78} ${x - 22} ${y + 84}H${x + 8}C${x - 6} ${y + 50} ${x - 4} ${y + 20} ${x - 2} ${y}Z`, fill: dk, stroke: INK, 'stroke-width': 2.4}),
        front: h('path', {d: `M${x - 37} ${y + 6}C${x - 44} ${y - 40} ${x + 2} ${y - 50} ${x + 26} ${y - 34}C${x + 36} ${y - 28} ${x + 38} ${y - 18} ${x + 36} ${y - 12}C${x + 18} ${y - 26} ${x - 6} ${y - 20} ${x - 14} ${y - 6}C${x - 18} ${y + 8} ${x - 26} ${y + 14} ${x - 37} ${y + 6}Z`, fill: color, stroke: INK, 'stroke-width': 2.4}),
      };
    case 'bun':
      return {
        back: h('circle', {cx: x - 30, cy: y - 26, r: 17, fill: color, stroke: INK, 'stroke-width': 2.4}),
        front: h('path', {d: `M${x - 36} ${y + 4}C${x - 42} ${y - 40} ${x + 6} ${y - 50} ${x + 30} ${y - 30}C${x + 36} ${y - 24} ${x + 36} ${y - 18} ${x + 34} ${y - 14}C${x + 14} ${y - 26} ${x - 4} ${y - 22} ${x - 12} ${y - 10}C${x - 18} ${y} ${x - 26} ${y + 8} ${x - 36} ${y + 4}Z`, fill: color, stroke: INK, 'stroke-width': 2.4}),
      };
    case 'curly': {
      const bumps = [];
      const pts = [[-34, -4], [-30, -24], [-16, -38], [2, -42], [18, -36], [-38, 14]];
      for (const [dx, dy] of pts) bumps.push(h('circle', {cx: x + dx, cy: y + dy, r: 15, fill: color, stroke: INK, 'stroke-width': 2.2}));
      return {back: null, front: g(null, bumps, h('path', {d: `M${x - 38} ${y}C${x - 36} ${y - 34} ${x + 10} ${y - 44} ${x + 28} ${y - 30}C${x + 10} ${y - 26} ${x - 10} ${y - 18} ${x - 22} ${y + 4}Z`, fill: color}))};
    }
    case 'buzz':
      return {back: null, front: h('path', {d: `M${x - 35} ${y}C${x - 38} ${y - 36} ${x + 4} ${y - 44} ${x + 28} ${y - 28}C${x + 12} ${y - 30} ${x - 8} ${y - 24} ${x - 16} ${y - 12}C${x - 20} ${y - 4} ${x - 26} ${y + 4} ${x - 35} ${y}Z`, fill: color, opacity: 0.92})};
    case 'scarf':
      return {
        back: h('path', {d: `M${x - 44} ${y + 60}C${x - 52} ${y - 10} ${x - 36} ${y - 52} ${x + 2} ${y - 50}C${x + 30} ${y - 48} ${x + 44} ${y - 28} ${x + 42} ${y - 6}L${x + 30} ${y + 34}C${x + 18} ${y + 52} ${x - 14} ${y + 70} ${x - 44} ${y + 60}Z`, fill: color, stroke: INK, 'stroke-width': 2.4}),
        front: h('path', {d: `M${x + 40} ${y - 10}C${x + 34} ${y - 40} ${x + 6} ${y - 46} ${x - 12} ${y - 40}C${x + 8} ${y - 30} ${x + 22} ${y - 18} ${x + 26} ${y + 2}C${x + 28} ${y + 22} ${x + 22} ${y + 36} ${x + 14} ${y + 44}C${x + 34} ${y + 36} ${x + 44} ${y + 14} ${x + 40} ${y - 10}Z`, fill: shade(color, 0.08), stroke: INK, 'stroke-width': 2.4}),
      };
    case 'short':
    default:
      return {back: null, front: h('path', {d: `M${x - 36} ${y + 2}C${x - 42} ${y - 38} ${x - 2} ${y - 50} ${x + 26} ${y - 34}C${x + 34} ${y - 28} ${x + 34} ${y - 20} ${x + 30} ${y - 16}C${x + 16} ${y - 24} ${x} ${y - 22} ${x - 8} ${y - 14}C${x - 14} ${y - 4} ${x - 24} ${y + 6} ${x - 36} ${y + 2}Z`, fill: color, stroke: INK, 'stroke-width': 2.4})};
  }
}
