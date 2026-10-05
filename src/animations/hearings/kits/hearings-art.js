/**
 * Generic hearings art (category "hearings" — Audiencias y desarrollo del
 * juicio). Shared art for every hearings motif: import these pieces, do not
 * fork them. It builds on the accepted courts plan language
 * (../../courts/kits/courts-art.js, imported READ-ONLY: walls, floors, chairs,
 * top-down people) and adds the equipment of a generic, fictional hearing
 * room seen from above:
 *  - an oval shared table (every seat identical: no head of the table);
 *  - a wall status display whose frame is SOLID when a supplied state is
 *    active and DASHED only while it is pending (dashes = pending in the
 *    library), with a solid ● / ◆ cue of equal ink area;
 *  - a two-position wall switch (◆ ↔ ●) that drives the room equipment;
 *  - wall lamps with a floor glow and a neutral "lights off" floor tint;
 *  - a thin power line along the walls with a travelling pulse;
 *  - a plain wall clock (no numerals, no time span is ever implied);
 *  - name cards (flat when handed over, standing tent card when set down),
 *    a card tray, a paper sheet and an exhibit box on a low cabinet;
 *  - a door with a SOLID swing arc (the courts door arc is dashed).
 * Nothing here encodes a procedure, a rank or an outcome. Colours are
 * neutral (no red): warm light, blue accent, greys.
 *
 * Local conventions (as courts-art): plan pieces use template units, a plan
 * person's local forward is −y (angle 0 = facing up the page, degrees
 * clockwise). Every piece takes a `name` so several instances can coexist.
 *
 * Exports (stable API for later hearings motifs):
 *   hearingColors(ctx)                    palette tokens (planColors + equipment)
 *   STATE_GLYPH, stateGlyph(ctx, o)       solid ● / ◆ of equal ink area
 *   ovalTable(ctx, o)                     shared oval table from above
 *   statusDisplay(ctx, o)                 wall display {node, frame(state)}
 *   sessionSwitch(ctx, o)                 two-position switch {node, frame(k)}
 *   wallLamp(ctx, o)                      lamp + glow {node, glow, frame(on)}
 *   powerLine(ctx, o)                     wall power line + pulse {node, frame(p, op)}
 *   wallClock(ctx, o)                     clock face {node, frame(minDeg)}
 *   nameCard(ctx, o)                      name card {node, frame({x,y,deg,stand,opacity})}
 *   cardTray(ctx, o), paperSheet(ctx, o), exhibitBox(ctx, o), lowCabinet(ctx, o)
 *   plainDoor(ctx, o)                     door leaf with a solid swing arc
 *   facing(p, q)                          plan facing (deg) from p towards q
 *   reachRecords(rig, pose, target, o)    override one arm of a planPerson rig to reach a WORLD point
 * @module animations/hearings/kits/hearings-art
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {planColors} from '../../courts/kits/courts-art.js';

const INK = '#1f2328';

/** Palette tokens for hearing-room art (neutral; derived from the theme). */
export function hearingColors(ctx) {
  const th = ctx.theme;
  return {
    ...planColors(ctx),
    screen: '#ffffff',
    screenEdge: '#3b4550',
    lampOff: '#d9d3c6',
    lampOn: '#f2c14e',
    glow: '#ffe9a8',
    dim: '#24313d',
    power: '#8b95a0',
    pulse: th.accent2,
    tray: '#66737f',
    card: '#ffffff',
    cardEdge: th.accent2,
    paper: '#fbf7ee',
    paperLine: '#c9c2b4',
    box: '#b98a5e',
    boxDark: '#8e6441',
    cabinet: '#8f98a1',
    glyph: INK,
  };
}

/* ------------------------------------------------------------------ */
/* ● / ◆ cues                                                          */
/* ------------------------------------------------------------------ */

/** Supplied states → solid cue kind (started ●, pending ◆). */
export const STATE_GLYPH = {started: 'dot', pending: 'diamond'};

/**
 * Solid ● (circle of radius s) or ◆ (diamond of half-diagonal s·√(π/2)):
 * the two have the SAME ink area, fill and stroke, so neither reads heavier.
 * @param {any} ctx
 * @param {{name?:string, kind:'dot'|'diamond', cx:number, cy:number, s:number, fill?:string, opacity?:number}} o
 */
export function stateGlyph(ctx, o) {
  const fill = o.fill ?? hearingColors(ctx).glyph;
  if (o.kind === 'dot') return h('circle', {name: o.name, cx: r(o.cx), cy: r(o.cy), r: r(o.s), fill, opacity: o.opacity});
  const a = o.s * Math.sqrt(Math.PI / 2);
  return h('path', {name: o.name, d: `M${r(o.cx)} ${r(o.cy - a)}L${r(o.cx + a)} ${r(o.cy)}L${r(o.cx)} ${r(o.cy + a)}L${r(o.cx - a)} ${r(o.cy)}Z`, fill, opacity: o.opacity});
}

/* ------------------------------------------------------------------ */
/* Furniture                                                           */
/* ------------------------------------------------------------------ */

/** Shared oval table from above (wood, grain, rim). Every seat around it is identical. */
export function ovalTable(ctx, {name, cx, cy, a, b, seedKey = 'oval'}) {
  const c = hearingColors(ctx);
  const grain = [];
  for (let i = 0; i < 5; i++) {
    const yy = cy - b * 0.62 + (i / 4) * b * 1.24 + (ctx.rng(`${seedKey}-g`, i) - 0.5) * 8;
    const half = a * Math.sqrt(Math.max(0, 1 - ((yy - cy) / b) ** 2)) * 0.8;
    const wob = 3 + ctx.rng(`${seedKey}-w`, i) * 4;
    grain.push(`M${r(cx - half)} ${r(yy)}C${r(cx - half * 0.3)} ${r(yy - wob)} ${r(cx + half * 0.3)} ${r(yy + wob)} ${r(cx + half)} ${r(yy)}`);
  }
  return g({name},
    h('ellipse', {cx: r(cx + 5), cy: r(cy + 8), rx: r(a), ry: r(b), fill: ctx.theme.shadow}),
    h('ellipse', {cx: r(cx), cy: r(cy), rx: r(a), ry: r(b), fill: c.wood, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: grain.join(''), stroke: shade(c.wood, -0.12), 'stroke-width': 1.8, fill: 'none', opacity: 0.7}),
    h('ellipse', {cx: r(cx), cy: r(cy), rx: r(a - 7), ry: r(b - 7), fill: 'none', stroke: c.woodEdge, 'stroke-width': 1.8, opacity: 0.8}),
  );
}

/** Low cabinet from above (a plain grey top with a lighter lid line). */
export function lowCabinet(ctx, {name, x, y, w, h: hh}) {
  const c = hearingColors(ctx);
  return g({name},
    h('path', {d: roundRectPath(x + 4, y + 6, w, hh, 6), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 6), fill: c.cabinet, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(x + 5, y + 5, w - 10, hh - 10, 4), fill: shade(c.cabinet, 0.18), stroke: 'none'}),
  );
}

/** Exhibit box from above: a lidded box with a blank tag slot (the motif prints its tag beside it). */
export function exhibitBox(ctx, {name, cx, cy, s = 56, deg = 0}) {
  const c = hearingColors(ctx);
  const w = s, hh = s * 0.74;
  return g({name, transform: T(cx, cy, deg)},
    h('path', {d: roundRectPath(-w / 2 + 3, -hh / 2 + 5, w, hh, 5), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 5), fill: c.box, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(-w / 2 + 4)} ${r(-hh * 0.12)}H${r(w / 2 - 4)}`, stroke: c.boxDark, 'stroke-width': 3}),
    h('rect', {x: r(-w * 0.2), y: r(hh * 0.08), width: r(w * 0.4), height: r(hh * 0.26), rx: 2, fill: '#f6efe0', stroke: INK, 'stroke-width': 1.4}),
  );
}

/** Paper sheet from above with simulated (decorative) lines. */
export function paperSheet(ctx, {name, cx, cy, w = 36, h: hh = 46, deg = 0}) {
  const c = hearingColors(ctx);
  const lines = [];
  for (let i = 0; i < 4; i++) lines.push(`M${r(-w / 2 + 6)} ${r(-hh / 2 + 9 + i * (hh - 16) / 3.4)}H${r(w / 2 - 6 - (i === 3 ? w * 0.3 : 0))}`);
  return g({name, transform: T(cx, cy, deg)},
    h('rect', {x: r(-w / 2 + 2), y: r(-hh / 2 + 3), width: r(w), height: r(hh), rx: 2, fill: ctx.theme.shadow}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 2, fill: c.paper, stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: lines.join(''), stroke: c.paperLine, 'stroke-width': 2, 'stroke-linecap': 'round'}),
  );
}

/** Card tray from above (a shallow open box). */
export function cardTray(ctx, {name, cx, cy, w = 96, h: hh = 62}) {
  const c = hearingColors(ctx);
  return g({name, transform: T(cx, cy)},
    h('path', {d: roundRectPath(-w / 2 + 3, -hh / 2 + 5, w, hh, 8), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 8), fill: c.tray, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(-w / 2 + 6, -hh / 2 + 6, w - 12, hh - 12, 5), fill: shade(c.tray, 0.28), stroke: 'none'}),
  );
}

/**
 * Name card seen from above. Local origin = card centre; local −y = the side
 * facing its holder's front. stand ∈ [0, 1]: 0 = lying flat (a white card
 * with an accent band), 1 = a standing tent card (narrow, with its ridge).
 * The card never carries text: its label is printed by the motif beside
 * the holder.
 * @param {any} ctx
 * @param {{name:string, w?:number, h?:number}} o
 */
export function nameCard(ctx, o) {
  const c = hearingColors(ctx);
  const w = o.w ?? 60, hh = o.h ?? 32;
  const N = o.name;
  const node = g({name: N, opacity: 0},
    g({name: `${N}-flat`},
      h('rect', {x: r(-w / 2 + 2), y: r(-hh / 2 + 4), width: r(w), height: r(hh), rx: 3, fill: ctx.theme.shadow}),
      h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 3, fill: c.card, stroke: INK, 'stroke-width': 1.8}),
      h('rect', {x: r(-w / 2 + 5), y: r(-hh / 2 + 5), width: r(w - 10), height: r(hh * 0.22), rx: 1.5, fill: c.cardEdge})),
    g({name: `${N}-tent`, opacity: 0},
      h('rect', {x: r(-w / 2 + 2), y: r(-hh * 0.25 + 4), width: r(w), height: r(hh * 0.5), rx: 2, fill: ctx.theme.shadow}),
      h('rect', {x: r(-w / 2), y: r(-hh * 0.25), width: r(w), height: r(hh * 0.5), rx: 2, fill: c.card, stroke: INK, 'stroke-width': 1.8}),
      h('path', {d: `M${r(-w / 2)} 0H${r(w / 2)}`, stroke: c.cardEdge, 'stroke-width': 3})),
  );
  /** @param {{x:number,y:number,deg:number,stand:number,opacity:number}} s */
  const frame = s => ({
    [N]: {transform: T(s.x, s.y, s.deg), opacity: r(s.opacity, 3)},
    [`${N}-flat`]: {opacity: r(1 - clamp(s.stand), 3)},
    [`${N}-tent`]: {opacity: r(clamp(s.stand), 3)},
  });
  return {node, frame, size: {w, h: hh}};
}

/* ------------------------------------------------------------------ */
/* Wall equipment                                                      */
/* ------------------------------------------------------------------ */

/**
 * Wall status display (seen from above as a panel mounted on the inner face
 * of a wall, its screen drawn face-up so it can be read). Two frames are
 * drawn: a SOLID one (a supplied state is active) and a DASHED one (pending);
 * frame({started}) cross-fades between them (started ∈ [0,1]). The motif adds
 * its own text and ● / ◆ cue inside `screen` (returned box).
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, h:number}} o  outer box (template units)
 */
export function statusDisplay(ctx, o) {
  const c = hearingColors(ctx);
  const {x, y, w} = o;
  const hh = o.h;
  const inset = 7;
  const screen = {x: x + inset, y: y + inset, w: w - inset * 2, h: hh - inset * 2};
  const N = o.name;
  const node = g({name: N},
    h('path', {d: roundRectPath(x + 4, y + 6, w, hh, 10), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 10), fill: c.screenEdge, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(screen.x, screen.y, screen.w, screen.h, 6), fill: c.screen}),
    h('path', {name: `${N}-solid`, d: roundRectPath(screen.x + 4, screen.y + 4, screen.w - 8, screen.h - 8, 5), fill: 'none', stroke: INK, 'stroke-width': 3}),
    // dashes mean "pending" in the library: this frame is drawn only while the supplied state is pending
    h('path', {name: `${N}-dashed`, 'data-pending': 1, d: roundRectPath(screen.x + 4, screen.y + 4, screen.w - 8, screen.h - 8, 5), fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0}),
  );
  const frame = started => ({
    [`${N}-solid`]: {opacity: r(clamp(started), 3)},
    [`${N}-dashed`]: {opacity: r(1 - clamp(started), 3)},
  });
  return {node, frame, screen, box: {x, y, w, h: hh}};
}

/**
 * Two-position wall switch: a plate with a ◆ (pending) and a ● (started) end
 * and a lever between them. frame(k): k = 0 → lever at ◆, k = 1 → lever at ●.
 * Horizontal plate centred on (cx, cy), width s.
 */
export function sessionSwitch(ctx, {name, cx, cy, s = 84}) {
  const c = hearingColors(ctx);
  const w = s, hh = s * 0.46;
  const g0 = s * 0.075;
  const lever = `${name}-lever`;
  const travel = w * 0.22;
  const node = g({name},
    h('path', {d: roundRectPath(cx - w / 2 + 3, cy - hh / 2 + 5, w, hh, 8), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(cx - w / 2, cy - hh / 2, w, hh, 8), fill: '#eef0f2', stroke: INK, 'stroke-width': 2.2}),
    stateGlyph(ctx, {kind: 'diamond', cx: cx - w * 0.36, cy, s: g0}),
    stateGlyph(ctx, {kind: 'dot', cx: cx + w * 0.36, cy, s: g0}),
    h('path', {d: `M${r(cx - travel)} ${r(cy)}H${r(cx + travel)}`, stroke: '#9aa4ad', 'stroke-width': r(hh * 0.28), 'stroke-linecap': 'round'}),
    g({name: lever, transform: T(cx - travel, cy)},
      h('circle', {r: r(hh * 0.3), fill: c.screenEdge, stroke: INK, 'stroke-width': 2})),
  );
  const frame = k => ({[lever]: {transform: T(cx - travel + 2 * travel * clamp(k), cy)}});
  return {node, frame, box: {x: cx - w / 2, y: cy - hh / 2, w, h: hh}};
}

/**
 * Wall lamp on the inner face of a wall (side: 'top'|'bottom'|'left'|'right'),
 * with a soft floor glow (radial gradient) that fades in with frame(on).
 * `glow` is drawn separately (under furniture), `node` is the fixture.
 */
export function wallLamp(ctx, {name, x, y, side, R = 20, glowR = 170}) {
  const c = hearingColors(ctx);
  const rot = {top: 0, right: 90, bottom: 180, left: 270}[side] ?? 0;
  const gid = ctx.id(`${name}-grad`);
  const inward = {top: {x: 0, y: 1}, bottom: {x: 0, y: -1}, left: {x: 1, y: 0}, right: {x: -1, y: 0}}[side] ?? {x: 0, y: 1};
  const gc = {x: x + inward.x * glowR * 0.35, y: y + inward.y * glowR * 0.35};
  const glow = g({name: `${name}-glow`, opacity: 0},
    h('defs', null, h('radialGradient', {id: gid},
      h('stop', {offset: '0%', 'stop-color': c.glow, 'stop-opacity': 0.95}),
      h('stop', {offset: '100%', 'stop-color': c.glow, 'stop-opacity': 0}))),
    h('ellipse', {cx: r(gc.x), cy: r(gc.y), rx: r(glowR), ry: r(glowR * 0.8), fill: ctx.ref(`${name}-grad`)}));
  const node = g({name, transform: T(x, y, rot)},
    h('path', {d: `M${r(-R)} 0A${r(R)} ${r(R)} 0 0 0 ${r(R)} 0Z`, fill: c.lampOff, stroke: INK, 'stroke-width': 2}),
    h('path', {name: `${name}-on`, d: `M${r(-R + 5)} 0A${r(R - 5)} ${r(R - 5)} 0 0 0 ${r(R - 5)} 0Z`, fill: c.lampOn, opacity: 0}),
  );
  const frame = on => ({[`${name}-glow`]: {opacity: r(clamp(on), 3)}, [`${name}-on`]: {opacity: r(clamp(on), 3)}});
  const box = side === 'top' || side === 'bottom' ? {x: x - R, y: side === 'top' ? y : y - R, w: 2 * R, h: R} : {x: side === 'left' ? x : x - R, y: y - R, w: R, h: 2 * R};
  return {node, glow, frame, box};
}

/** Thin power line along the walls with a travelling pulse (frame(p, pulseOpacity)). */
export function powerLine(ctx, {name, pts}) {
  const c = hearingColors(ctx);
  const poly = polyline(pts);
  const node = g({name},
    h('path', {d: poly.d(1), fill: 'none', stroke: c.power, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('circle', {name: `${name}-pulse`, r: 9, fill: c.pulse, stroke: '#ffffff', 'stroke-width': 3, opacity: 0}),
  );
  const frame = (p, op = 1) => {
    const q = poly.at(clamp(p));
    return {[`${name}-pulse`]: {cx: r(q.x), cy: r(q.y), opacity: r(op, 3)}};
  };
  return {node, frame, poly};
}

/** Plain wall clock face (no numerals): 12 ticks, an hour and a minute hand. frame(minDeg). */
export function wallClock(ctx, {name, cx, cy, R = 34, hourDeg = 300}) {
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? R * 0.68 : R * 0.78, r1 = R * 0.88;
    ticks.push(`M${r(cx + Math.sin(a) * r0)} ${r(cy - Math.cos(a) * r0)}L${r(cx + Math.sin(a) * r1)} ${r(cy - Math.cos(a) * r1)}`);
  }
  const node = g({name},
    h('circle', {cx: r(cx + 3), cy: r(cy + 5), r: r(R), fill: ctx.theme.shadow}),
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: '#ffffff', stroke: INK, 'stroke-width': 3}),
    h('path', {d: ticks.join(''), stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    h('line', {x1: r(cx), y1: r(cy), x2: r(cx), y2: r(cy - R * 0.45), stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round', transform: `rotate(${r(hourDeg)} ${r(cx)} ${r(cy)})`}),
    h('line', {name: `${name}-min`, x1: r(cx), y1: r(cy), x2: r(cx), y2: r(cy - R * 0.7), stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', transform: `rotate(0 ${r(cx)} ${r(cy)})`}),
    h('circle', {cx: r(cx), cy: r(cy), r: 3.5, fill: INK}),
  );
  const frame = minDeg => ({[`${name}-min`]: {transform: `rotate(${r(minDeg, 2)} ${r(cx)} ${r(cy)})`}});
  return {node, frame, box: {x: cx - R, y: cy - R, w: 2 * R, h: 2 * R}};
}

/**
 * Door leaf with a SOLID swing arc (plan notation without dashes). Closed
 * along the wall at closedDeg; frame(k) opens it by openDeg·k.
 */
export function plainDoor(ctx, o) {
  const c = hearingColors(ctx);
  const {hinge, width} = o;
  const a0 = (o.closedDeg * Math.PI) / 180;
  const a1 = ((o.closedDeg + o.openDeg) * Math.PI) / 180;
  const P = a => ({x: hinge.x + Math.cos(a) * width, y: hinge.y + Math.sin(a) * width});
  const p0 = P(a0), p1 = P(a1);
  const sweep = o.openDeg > 0 ? 1 : 0;
  const node = g({name: o.name},
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}A${r(width)} ${r(width)} 0 0 ${sweep} ${r(p1.x)} ${r(p1.y)}`, fill: 'none', stroke: c.frame, 'stroke-width': 1.4, opacity: 0.45}),
    g({name: `${o.name}-leaf`, transform: `rotate(0 ${r(hinge.x)} ${r(hinge.y)})`},
      h('rect', {x: r(hinge.x), y: r(hinge.y - 4), width: r(width), height: 8, rx: 3, fill: c.woodDark, stroke: INK, 'stroke-width': 1.6, transform: `rotate(${r(o.closedDeg)} ${r(hinge.x)} ${r(hinge.y)})`})),
    h('circle', {cx: r(hinge.x), cy: r(hinge.y), r: 5, fill: c.wallEdge}),
  );
  const frame = k => ({[`${o.name}-leaf`]: {transform: `rotate(${r(o.openDeg * clamp(k))} ${r(hinge.x)} ${r(hinge.y)})`}});
  return {node, frame};
}

/* ------------------------------------------------------------------ */
/* People helpers                                                      */
/* ------------------------------------------------------------------ */

/** Plan facing angle (deg, 0 = up the page, clockwise) of someone at p looking towards q. */
export function facing(p, q) {
  return (Math.atan2(q.x - p.x, -(q.y - p.y)) * 180) / Math.PI;
}

/** World → local (planPerson frame) point. */
export function toLocal(pose, q) {
  const a = ((pose.deg ?? 0) * Math.PI) / 180;
  const k = pose.scale ?? 1;
  const dx = (q.x - pose.x) / k, dy = (q.y - pose.y) / k;
  return {x: dx * Math.cos(a) + dy * Math.sin(a), y: -dx * Math.sin(a) + dy * Math.cos(a)};
}

/** Local (planPerson frame) → world point. */
export function toWorld(pose, q) {
  const a = ((pose.deg ?? 0) * Math.PI) / 180;
  const k = pose.scale ?? 1;
  return {x: pose.x + (q.x * Math.cos(a) - q.y * Math.sin(a)) * k, y: pose.y + (q.x * Math.sin(a) + q.y * Math.cos(a)) * k};
}

/** Shoulder (local) of each arm of a planPerson rig, and the longest reach (template units at scale 1). */
export const SHOULDER = {armL: {x: -34, y: -2}, armR: {x: 34, y: -2}};
export const REACH = 76;

/**
 * Override one arm of a planPerson rig so its hand lies on a WORLD target.
 * `k` ∈ [0, 1] blends from the rig's own hand position (k = 0) to the target.
 * Returns {nodes, hand (world), reached} — reached is false when the target
 * lies beyond REACH from the shoulder (the hand then stops at full reach).
 * @param {{name:string}} rig   planPerson rig (only its name is used)
 * @param {{x:number,y:number,deg?:number,scale?:number,seated?:number}} pose
 * @param {{x:number,y:number}} target world point
 * @param {{arm?:'armL'|'armR', k?:number, rest?:{x:number,y:number}}} [o]
 */
export function reachRecords(rig, pose, target, o = {}) {
  const arm = o.arm ?? 'armR';
  const k = clamp(o.k ?? 1);
  const sh = SHOULDER[arm];
  const side = arm === 'armR' ? 1 : -1;
  const seated = pose.seated ?? 0;
  const rest = o.rest ?? {x: side * 43 + (side * 24 - side * 43) * seated, y: 16 + (-44 - 16) * seated};
  let t = toLocal(pose, target);
  const d = Math.hypot(t.x - sh.x, t.y - sh.y);
  const reached = d <= REACH + 0.5;
  if (!reached) t = {x: sh.x + ((t.x - sh.x) / d) * REACH, y: sh.y + ((t.y - sh.y) / d) * REACH};
  const hx = rest.x + (t.x - rest.x) * k, hy = rest.y + (t.y - rest.y) * k;
  const line = {x1: r(sh.x), y1: r(sh.y), x2: r(hx), y2: r(hy)};
  const N = rig.name;
  return {
    nodes: {[`${N}-${arm}-o`]: line, [`${N}-${arm}-i`]: line, [`${N}-${arm}-h`]: {cx: r(hx), cy: r(hy)}},
    hand: toWorld(pose, {x: hx, y: hy}),
    reached,
  };
}
