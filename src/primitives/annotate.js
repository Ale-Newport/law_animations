/**
 * Text blocks, label chips, anchored connectors, brackets and tracer markers.
 * Connectors distinguish relation / communication / sequence / causal; a plain
 * relation never gets an arrowhead, so association is not drawn as causation.
 * @module primitives/annotate
 */
import {h, g} from '../core/svg.js';
import {FONTS} from '../core/text.js';
import {cubic, cubicPolyline, roundRectPath} from '../core/geometry.js';
import {T} from '../core/transform.js';
import {r} from '../core/time.js';

/**
 * Render a fitted text block. `y` is the top of the block.
 * @param {import('../core/text.js').FitResult} fit
 * @param {{x:number, y:number, anchor?:'start'|'middle'|'end', fill:string, name?:string, opacity?:number, italic?:boolean, letterSpacing?:number}} o
 */
export function textBlock(fit, o) {
  const baseline = o.y + fit.size * 0.8;
  return h('text', {
    name: o.name,
    x: o.x,
    y: baseline,
    'font-family': FONTS[fit.family] || FONTS.sans,
    'font-size': r(fit.size, 2),
    'font-weight': fit.weight,
    'font-style': o.italic ? 'italic' : undefined,
    'letter-spacing': o.letterSpacing,
    'text-anchor': o.anchor || 'start',
    fill: o.fill,
    opacity: o.opacity,
  },
  fit.truncated ? h('title', null, fit.full) : null,
  fit.lines.map((line, i) => h('tspan', {x: o.x, dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, line)));
}

/**
 * Label chip: rounded pill/box with fitted text.
 * @param {any} ctx
 * @param {string} text
 * @param {{x:number, y:number, maxWidth:number, size?:number, minSize?:number, maxLines?:number, anchor?:'start'|'middle'|'end', fill?:string, color?:string, stroke?:string, weight?:number, family?:'sans'|'serif'|'mono', name?:string, textName?:string, padX?:number, padY?:number, radius?:number}} o
 */
export function chip(ctx, text, o) {
  const size = o.size ?? 26;
  const padX = o.padX ?? size * 0.6;
  const padY = o.padY ?? size * 0.38;
  const fit = ctx.fit(text, {maxWidth: o.maxWidth - padX * 2, size, minSize: o.minSize ?? size * 0.75, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600, family: o.family ?? 'sans'});
  const w = fit.width + padX * 2;
  const hh = fit.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const y = o.y;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, y, w, hh, o.radius ?? Math.min(hh / 2, size * 0.7)), fill: o.fill ?? ctx.theme.card, stroke: o.stroke ?? ctx.theme.ink, 'stroke-width': o.stroke === 'none' ? 0 : 2}),
    textBlock(fit, {x: x + w / 2, y: y + padY, anchor: 'middle', fill: o.color ?? ctx.theme.ink, name: o.textName}),
  );
  return {node, box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2}, fit};
}

/**
 * Free caption text (no box).
 */
export function caption(ctx, text, o) {
  const fit = ctx.fit(text, {maxWidth: o.maxWidth, size: o.size ?? 28, minSize: o.minSize, maxLines: o.maxLines ?? 2, weight: o.weight ?? 500, family: o.family ?? 'sans'});
  const node = textBlock(fit, {x: o.x, y: o.y, anchor: o.anchor ?? 'start', fill: o.fill ?? ctx.theme.fg, name: o.name, italic: o.italic});
  const w = fit.width;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  return {node, box: {x, y: o.y, w, h: fit.height}, fit};
}

/** Connector visual kinds. */
export const LINK_STYLES = {
  relation: {dash: null, arrow: false, width: 3, endDots: true},
  communication: {dash: '10 9', arrow: true, width: 3.5, endDots: false},
  sequence: {dash: null, arrow: true, width: 3.5, endDots: false},
  causal: {dash: null, arrow: true, width: 5, endDots: false},
  disputed: {dash: '4 10', arrow: false, width: 3.5, endDots: true},
};

/**
 * Anchored connector (cubic curve) whose drawing progress is animatable.
 * The arrowhead is only shown once the stroke reaches the end, so it never
 * floats detached from its line.
 * @param {any} ctx
 * @param {{name:string, from:{x:number,y:number}, to:{x:number,y:number}, bend?:number, kind?:keyof LINK_STYLES, color?:string, c1?:{x:number,y:number}, c2?:{x:number,y:number}}} o
 */
export function connector(ctx, o) {
  const style = LINK_STYLES[o.kind || 'relation'];
  const {from, to} = o;
  const dx = to.x - from.x, dy = to.y - from.y;
  const bend = o.bend ?? 0.25;
  // control points perpendicular offset for a gentle arc
  const nx = -dy, ny = dx;
  const c1 = o.c1 || {x: from.x + dx * 0.3 + nx * bend, y: from.y + dy * 0.3 + ny * bend};
  const c2 = o.c2 || {x: from.x + dx * 0.7 + nx * bend, y: from.y + dy * 0.7 + ny * bend};
  const poly = cubicPolyline(from, c1, c2, to, 60);
  const total = poly.total;
  const d = `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`;
  const color = o.color ?? ctx.theme.fg;
  const end = poly.at(1);
  const headLen = style.width * 4.2;
  const xs = poly.pts.map(q => q.x), ys = poly.pts.map(q => q.y);
  const pad = style.width * 6 + 20;
  const mx = Math.min(...xs) - pad, my = Math.min(...ys) - pad;
  const node = g({name: o.name},
    style.dash
      ? h('defs', null, h('mask', {id: ctx.id(`${o.name}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...xs) - mx + pad), height: r(Math.max(...ys) - my + pad)},
        h('path', {name: `${o.name}-masker`, d, fill: 'none', stroke: '#fff', 'stroke-width': style.width * 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)})))
      : null,
    style.dash
      ? h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: color, 'stroke-width': style.width, 'stroke-linecap': 'round', 'stroke-dasharray': style.dash, mask: ctx.ref(`${o.name}-mask`)})
      : h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: color, 'stroke-width': style.width, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    style.arrow ? h('path', {name: `${o.name}-head`, d: `M0 0L${r(-headLen)} ${r(-headLen * 0.55)}L${r(-headLen * 0.72)} 0L${r(-headLen)} ${r(headLen * 0.55)}Z`, fill: color, transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${o.name}-dotA`, cx: from.x, cy: from.y, r: style.width * 1.6, fill: color, opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${o.name}-dotB`, cx: to.x, cy: to.y, r: style.width * 1.6, fill: color, opacity: 0}) : null,
  );
  /**
   * Frame props for drawing progress p in [0,1] and overall opacity.
   * @param {number} p
   * @param {number} [opacity=1]
   */
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - p));
    const out = {[o.name]: {opacity}};
    if (style.dash) out[`${o.name}-masker`] = {'stroke-dashoffset': off};
    else out[`${o.name}-line`] = {'stroke-dashoffset': off};
    if (style.arrow) out[`${o.name}-head`] = {opacity: p >= 0.985 ? 1 : 0};
    if (style.endDots) {
      out[`${o.name}-dotA`] = {opacity: p > 0 ? 1 : 0};
      out[`${o.name}-dotB`] = {opacity: p >= 0.985 ? 1 : 0};
    }
    return out;
  };
  return {node, frame, at: t => poly.at(t), total, mid: poly.at(0.5), from, to, c1, c2};
}

/**
 * A tracer marker (ring + dot) used to follow relations in mechanisms.
 */
export function tracer(ctx, name, color) {
  const c = color ?? ctx.theme.accent;
  return g({name, opacity: 0},
    h('circle', {r: 17, fill: c, opacity: 0.22}),
    h('circle', {r: 9, fill: c, stroke: ctx.theme.paper, 'stroke-width': 3}),
  );
}

/** Square bracket spanning two points (for comparison guides). */
export function bracketPath(a, b, depth) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * depth, ny = (dx / L) * depth;
  return `M${r(a.x)} ${r(a.y)}L${r(a.x + nx)} ${r(a.y + ny)}L${r(b.x + nx)} ${r(b.y + ny)}L${r(b.x)} ${r(b.y)}`;
}

/** Point on a connector-like cubic without building a node. */
export function curvePoint(from, c1, c2, to, t) {
  return cubic(from, c1, c2, to, t);
}

/** Small status tag (e.g. SENT / RECEIVED / PENDING) with an icon dot. */
export function statusTag(ctx, text, o) {
  const size = o.size ?? 22;
  const fit = ctx.fit(text, {maxWidth: o.maxWidth ?? 320, size, maxLines: 1, weight: 700});
  const padX = size * 0.7;
  const w = fit.width + padX * 2 + size * 0.9;
  const hh = size * 1.75;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const node = g({name: o.name, opacity: o.opacity},
    h('rect', {x, y: o.y, width: w, height: hh, rx: hh / 2, fill: o.fill ?? ctx.theme.card, stroke: o.color ?? ctx.theme.ink, 'stroke-width': 2}),
    h('circle', {cx: x + padX + size * 0.2, cy: o.y + hh / 2, r: size * 0.26, fill: o.color ?? ctx.theme.ink}),
    textBlock(fit, {x: x + padX + size * 0.75, y: o.y + (hh - fit.size) / 2 + fit.size * 0.02, fill: o.color ?? ctx.theme.ink, letterSpacing: 0.5, name: o.textName}),
  );
  return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}};
}

/**
 * Editorial callout: a leader line from a chip to a target point.
 * @param {any} ctx
 * @param {{name:string, text:string, chipAt:{x:number,y:number}, anchor?:'start'|'middle'|'end', target:{x:number,y:number}, maxWidth:number, size?:number, maxLines?:number, color?:string}} o
 */
export function callout(ctx, o) {
  const c = chip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: o.anchor ?? 'middle', maxWidth: o.maxWidth, size: o.size ?? 26, maxLines: o.maxLines ?? 2, fill: ctx.theme.card, stroke: o.color ?? ctx.theme.ink, color: ctx.theme.ink, name: `${o.name}-chip`});
  const b = c.box;
  // leader starts at the chip edge nearest the target
  const from = {
    x: Math.max(b.x, Math.min(o.target.x, b.x + b.w)),
    y: o.target.y > b.y + b.h ? b.y + b.h : o.target.y < b.y ? b.y : b.y + b.h / 2,
  };
  if (from.y === b.y + b.h / 2) from.x = o.target.x > b.cx ? b.x + b.w : b.x;
  const len = Math.hypot(o.target.x - from.x, o.target.y - from.y);
  const color = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: from.x, y1: from.y, x2: o.target.x, y2: o.target.y, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: o.target.x, cy: o.target.y, r: 7, fill: color, stroke: ctx.theme.card, 'stroke-width': 2.5, opacity: 0}),
    c.node,
  );
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: Math.min(1, Math.max(0, (p - 0.45) / 0.55))},
  });
  return {node, frame, box: b};
}
