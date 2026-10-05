/**
 * Collision-aware placement of editorial chips for the "Cadena causal" motif
 * (LAW-0681..0684). Pure geometry: candidates around a target are tried in
 * order and the first chip box that clears every obstacle (boxes or convex
 * polygons: tiles, loss objects, presenter, other chips) — and whose leader
 * reaches the target without crossing another obstacle — wins.
 * @module animations/causation/kits/place
 */
import {h, g} from '../../../core/svg.js';
import {r} from '../../../core/time.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {overlaps, rectPoly} from './topple.js';

/** @typedef {{x:number,y:number,w:number,h:number}} Box */

const asPoly = o => (Array.isArray(o) ? o : rectPoly(o.x, o.y, o.w, o.h));

/** Axis-aligned bounds of a polygon or box. */
export function boundsOf(o) {
  if (!Array.isArray(o)) return {x: o.x, y: o.y, w: o.w, h: o.h};
  const xs = o.map(p => p.x), ys = o.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

/** Union bounds of several boxes/polygons (null entries ignored). */
export function unionBounds(list) {
  const bs = list.filter(Boolean).map(boundsOf);
  if (!bs.length) return null;
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}

/** Does box (inflated by pad) intersect any obstacle? */
export function hitsAny(box, obstacles, pad = 0) {
  const P = rectPoly(box.x - pad, box.y - pad, box.w + 2 * pad, box.h + 2 * pad);
  return obstacles.some(o => o && overlaps(P, asPoly(o), 0.01));
}

function pointIn(p, o) {
  if (!Array.isArray(o)) return p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h;
  let sign = 0;
  for (let i = 0; i < o.length; i++) {
    const a = o[i], b = o[(i + 1) % o.length];
    const c = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(c) < 1e-9) continue;
    const s = Math.sign(c);
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

/** Leader start on the chip edge, mirroring primitives/annotate.js callout(). */
export function leaderFrom(b, target) {
  const from = {
    x: Math.max(b.x, Math.min(target.x, b.x + b.w)),
    y: target.y > b.y + b.h ? b.y + b.h : target.y < b.y ? b.y : b.y + b.h / 2,
  };
  if (from.y === b.y + b.h / 2) from.x = target.x > b.x + b.w / 2 ? b.x + b.w : b.x;
  return from;
}

/** Does the segment a→b pass through an obstacle (ignoring `skipEnd` units at b)? */
export function segmentHits(a, b, obstacles, skipEnd = 10) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < 1) return false;
  const steps = Math.ceil(L / 5);
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    if (L * (1 - t) < skipEnd) break;
    const p = {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
    if (obstacles.some(o => o && pointIn(p, o))) return true;
  }
  return false;
}

/**
 * Choose a chip position for a callout.
 * @param {{w:number,h:number}} size  chip size
 * @param {{x:number,y:number,r?:number}} target  point (r = keep the leader end this far from it)
 * @param {object} o
 * @param {Array<Box|Array<{x:number,y:number}>>} o.obstacles
 * @param {Box} o.bounds  the chip must stay inside
 * @param {number} [o.pad=10]
 * @param {Array<'above'|'aboveL'|'aboveR'|'left'|'right'|'below'>} [o.order]
 * @param {number[]} [o.gaps]
 * @param {any[]} [o.own]  obstacles the leader may enter (the target's own body)
 * @param {boolean} [o.noLeader]  place a box only (no leader to check)
 * @param {boolean} [o.leastBad]  return the least-overlapping candidate instead of a clean one
 * @param {number} [o.skipEnd=12]  length at the leader's end that may touch obstacles (it lands on its target)
 * @returns {{x:number,y:number,box:Box,end:{x:number,y:number}}|null}  x = chip centre, y = chip top
 */
export function placeChip(size, target, o) {
  const pad = o.pad ?? 10;
  const order = o.order ?? ['above', 'aboveR', 'aboveL', 'right', 'left', 'rightLow', 'leftLow', 'rightHigh', 'leftHigh', 'belowR', 'belowL', 'below'];
  const gaps = o.gaps ?? [34, 60, 95, 135, 180, 230, 290, 360];
  const B = o.bounds;
  const {w, h} = size;
  const tr = target.r ?? 0;
  const clampX = cx => Math.max(B.x + w / 2, Math.min(B.x + B.w - w / 2, cx));
  const tries = [];
  for (const gp of gaps) {
    for (const side of order) {
      let cx, top;
      const up = target.y - tr - gp - h, down = target.y + tr + gp;
      if (side === 'above') { cx = target.x; top = up; }
      if (side === 'aboveR') { cx = target.x + w / 2 + gp * 0.4; top = up; }
      if (side === 'aboveL') { cx = target.x - w / 2 - gp * 0.4; top = up; }
      if (side === 'right') { cx = target.x + tr + gp + w / 2; top = target.y - h / 2; }
      if (side === 'left') { cx = target.x - tr - gp - w / 2; top = target.y - h / 2; }
      if (side === 'rightLow') { cx = target.x + tr + gp + w / 2; top = target.y + 6; }
      if (side === 'leftLow') { cx = target.x - tr - gp - w / 2; top = target.y + 6; }
      if (side === 'rightHigh') { cx = target.x + tr + gp + w / 2; top = target.y - h - 6; }
      if (side === 'leftHigh') { cx = target.x - tr - gp - w / 2; top = target.y - h - 6; }
      if (side === 'below') { cx = target.x; top = down; }
      if (side === 'belowR') { cx = target.x + w / 2 + gp * 0.4; top = down; }
      if (side === 'belowL') { cx = target.x - w / 2 - gp * 0.4; top = down; }
      tries.push({cx: clampX(cx), top});
    }
  }
  const lead = o.own ? o.obstacles.filter(ob => !o.own.includes(ob)) : o.obstacles;
  if (o.leastBad) {
    // no clean spot anywhere: the candidate with the least overlap (chip area first, then leader)
    let best = null;
    for (const t of tries) {
      const box = {x: t.cx - w / 2, y: t.top, w, h};
      if (box.y < B.y || box.y + h > B.y + B.h) continue;
      let cost = 0;
      for (const ob of o.obstacles) {
        if (!ob) continue;
        const bb = boundsOf(ob);
        const ix = Math.max(0, Math.min(box.x + w, bb.x + bb.w) - Math.max(box.x, bb.x));
        const iy = Math.max(0, Math.min(box.y + h, bb.y + bb.h) - Math.max(box.y, bb.y));
        if (ix * iy > 0 && hitsAny(box, [ob], 0)) cost += ix * iy;
      }
      const end = {x: target.x, y: target.y - tr};
      const from = leaderFrom(box, end);
      cost += Math.hypot(from.x - end.x, from.y - end.y) * 2 + (segmentHits(from, end, lead, 12) ? 4000 : 0);
      if (!best || cost < best.cost) best = {cost, x: t.cx, y: t.top, box, end};
    }
    return best;
  }
  for (const t of tries) {
    const box = {x: t.cx - w / 2, y: t.top, w, h};
    if (box.y < B.y || box.y + h > B.y + B.h) continue;
    if (hitsAny(box, o.obstacles, pad)) continue;
    if (o.noLeader) return {x: t.cx, y: t.top, box, end: {x: target.x, y: target.y}};
    const from = leaderFrom(box, target);
    const dx = from.x - target.x, dy = from.y - target.y;
    const L = Math.hypot(dx, dy) || 1;
    const end = tr ? {x: target.x + (dx / L) * tr, y: target.y + (dy / L) * tr} : {x: target.x, y: target.y};
    const from2 = leaderFrom(box, end);
    if (Math.hypot(from2.x - end.x, from2.y - end.y) < 14) continue;
    if (segmentHits(from2, end, lead, o.skipEnd ?? 12)) continue;
    return {x: t.cx, y: t.top, box, end};
  }
  return null;
}

/**
 * placeChip over several chip sizes (e.g. the same text fitted to narrower
 * widths / more lines): the first size that finds a clean spot wins.
 * @param {Array<{w:number,h:number}>} sizes
 * @returns {{x:number,y:number,box:Box,end:{x:number,y:number},k:number}|null} k = index of the size used
 */
export function placeChipAny(sizes, target, o) {
  for (let k = 0; k < sizes.length; k++) {
    const res = placeChip(sizes[k], target, o);
    if (res) return {...res, k};
  }
  return null;
}

/**
 * Pack label chips in up to `maxRows` rows under a floor. Every chip hangs
 * from a vertical tick at its desired x (the object it names); a chip must
 * contain its own tick, chips in a row never overlap, and no tick may pass
 * through a chip of a row above its own. All row assignments are searched
 * (≤ 7 items), preferring fewer rows, then the least displacement.
 * @param {Array<{x:number, w:number, h:number}>} items  x = tick / desired centre
 * @param {{y:number, gap?:number, rowGap?:number, minX:number, maxX:number, maxRows?:number}} o
 * @returns {Array<{x:number, y:number, row:number, bottom:number}>} chip top-left positions (input order)
 */
export function packLabels(items, o) {
  const n = items.length;
  const gap = o.gap ?? 12;
  const rowGap = o.rowGap ?? 12;
  const maxRows = Math.max(1, o.maxRows ?? 3);
  if (!n) return [];
  let best = null;
  const rows = new Array(n).fill(0);
  const evaluate = () => {
    const xs = new Array(n);
    const used = Math.max(...rows) + 1;
    for (let r = 0; r < used; r++) {
      const idx = items.map((_, i) => i).filter(i => rows[i] === r).sort((a, b) => items[a].x - items[b].x);
      if (!idx.length) return null;
      // centred, clamped, then pushed apart (right, then left from the edge)
      for (const i of idx) xs[i] = Math.max(o.minX, Math.min(o.maxX - items[i].w, items[i].x - items[i].w / 2));
      for (let k = 1; k < idx.length; k++) xs[idx[k]] = Math.max(xs[idx[k]], xs[idx[k - 1]] + items[idx[k - 1]].w + gap);
      const last = idx[idx.length - 1];
      if (xs[last] + items[last].w > o.maxX) xs[last] = o.maxX - items[last].w;
      for (let k = idx.length - 2; k >= 0; k--) xs[idx[k]] = Math.min(xs[idx[k]], xs[idx[k + 1]] - gap - items[idx[k]].w);
      if (xs[idx[0]] < o.minX - 0.5) return null;
      for (const i of idx) if (items[i].x < xs[i] + 10 || items[i].x > xs[i] + items[i].w - 10) return null;
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (rows[j] < rows[i] && items[i].x > xs[j] - 6 && items[i].x < xs[j] + items[j].w + 6) return null;
      }
    }
    let cost = used * 1e5;
    for (let i = 0; i < n; i++) cost += Math.abs(xs[i] + items[i].w / 2 - items[i].x) + rows[i] * 3;
    return {cost, xs: xs.slice(), rows: rows.slice(), used};
  };
  const total = maxRows ** n;
  for (let code = 0; code < total; code++) {
    let c = code;
    for (let i = 0; i < n; i++) { rows[i] = c % maxRows; c = Math.floor(c / maxRows); }
    const res = evaluate();
    if (res && (!best || res.cost < best.cost)) best = res;
  }
  if (!best) {
    // fallback: every chip on its own row, centred on its tick
    best = {xs: items.map(it => Math.max(o.minX, Math.min(o.maxX - it.w, it.x - it.w / 2))), rows: items.map((_, i) => i), used: n};
  }
  const rowH = [];
  items.forEach((it, i) => { rowH[best.rows[i]] = Math.max(rowH[best.rows[i]] ?? 0, it.h); });
  const rowY = [];
  let y = o.y;
  for (let k = 0; k < rowH.length; k++) { rowY[k] = y; y += (rowH[k] ?? 0) + rowGap; }
  return items.map((it, i) => ({x: best.xs[i], y: rowY[best.rows[i]], row: best.rows[i], bottom: y - rowGap}));
}

/** Thin polygon around a callout leader (chip box → end point), for later collision tests. */
export function leaderPoly(box, end, width = 10) {
  const a = leaderFrom(box, end);
  const dx = end.x - a.x, dy = end.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * width / 2, ny = (dx / L) * width / 2;
  return [{x: a.x + nx, y: a.y + ny}, {x: end.x + nx, y: end.y + ny}, {x: end.x - nx, y: end.y - ny}, {x: a.x - nx, y: a.y - ny}];
}

/**
 * Editorial callout (chip + leader + end dot), like primitives/annotate.js
 * callout() but with a configurable line count so narrow chips can wrap to
 * three lines. Same node names and frame() contract.
 * @param {any} ctx
 * @param {{name:string, text:string, chipAt:{x:number,y:number}, target:{x:number,y:number}, maxWidth:number, maxLines?:number, size?:number, color?:string}} o
 */
export function calloutChip(ctx, o) {
  const c = chip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: 'middle', maxWidth: o.maxWidth, size: o.size ?? 26, maxLines: o.maxLines ?? 2, fill: ctx.theme.card, stroke: o.color ?? ctx.theme.ink, color: ctx.theme.ink, name: `${o.name}-chip`});
  const b = c.box;
  const from = leaderFrom(b, o.target);
  const len = Math.hypot(o.target.x - from.x, o.target.y - from.y);
  const color = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(o.target.x), y2: r(o.target.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(o.target.x), cy: r(o.target.y), r: 7, fill: color, stroke: ctx.theme.card, 'stroke-width': 2.5, opacity: 0}),
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

/**
 * Status tag (dot + bold text in a pill), like primitives/annotate.js
 * statusTag() but sized for its letter spacing, so long supplied texts never
 * run past the pill's end.
 */
export function stateTag(ctx, text, o) {
  const size = o.size ?? 22;
  const ls = 0.5;
  const fit = ctx.fit(text, {maxWidth: (o.maxWidth ?? 320) - size * 2.4, size, maxLines: 1, weight: 700});
  const textW = fit.width + ls * Math.max(0, (fit.lines[0] || '').length - 1);
  const padX = size * 0.7;
  const w = textW + padX * 2 + size * 0.9;
  const hh = size * 1.75;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const col = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: o.opacity},
    h('rect', {x: r(x), y: r(o.y), width: r(w), height: r(hh), rx: r(hh / 2), fill: o.fill ?? ctx.theme.card, stroke: col, 'stroke-width': 2}),
    h('circle', {cx: r(x + padX + size * 0.2), cy: r(o.y + hh / 2), r: r(size * 0.26), fill: col}),
    textBlock(fit, {x: x + padX + size * 0.75, y: o.y + (hh - fit.size) / 2 + fit.size * 0.02, fill: col, letterSpacing: ls}),
  );
  return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}};
}

/** Thin polygons around each segment of a polyline (lines that chips must not cover). */
export function segPolys(pts, width = 10) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    if (L < 0.5) continue;
    const nx = (-dy / L) * width / 2, ny = (dx / L) * width / 2;
    out.push([{x: a.x + nx, y: a.y + ny}, {x: b.x + nx, y: b.y + ny}, {x: b.x - nx, y: b.y - ny}, {x: a.x - nx, y: a.y - ny}]);
  }
  return out;
}

/**
 * Narrowest chip width that keeps the same number of lines and font size as
 * `maxWidth` does — i.e. balanced lines instead of a long line plus an orphan
 * word. Mirrors primitives/annotate.js chip() padding and fitting.
 * @param {any} ctx
 * @param {string} text
 * @param {{maxWidth:number, size:number, maxLines?:number, minSize?:number, weight?:number, padX?:number}} o
 * @returns {number} a maxWidth to pass to chip()
 */
export function balancedWidth(ctx, text, o) {
  const pad = (o.padX ?? o.size * 0.6) * 2;
  const opts = w => ({maxWidth: w - pad, size: o.size, minSize: o.minSize ?? o.size * 0.75, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600, family: 'sans'});
  const f0 = ctx.fit(text, opts(o.maxWidth));
  if (f0.lines.length < 2 || f0.truncated) return o.maxWidth;
  let lo = Math.max(pad + 20, o.maxWidth * 0.3), hi = o.maxWidth;
  for (let k = 0; k < 16; k++) {
    const mid = (lo + hi) / 2;
    const f = ctx.fit(text, opts(mid));
    if (f.lines.length === f0.lines.length && !f.truncated && f.size >= f0.size - 0.01) hi = mid; else lo = mid;
  }
  return Math.min(o.maxWidth, hi + 2);
}
