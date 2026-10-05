/**
 * Paired-comparison layout helper (for `contrast` treatments).
 * Places two equally scaled stages side by side (wide boxes) or stacked
 * (tall boxes), each with a header strip for the scenario label. It only
 * computes geometry and header nodes; each entry draws its own scenes and
 * decides what differs between them.
 * @module frameworks/paired
 */
import {h, g} from '../core/svg.js';
import {T} from '../core/transform.js';
import {chip, textBlock} from '../primitives/annotate.js';

/**
 * @param {any} ctx
 * @param {{stage:{w:number,h:number}, arrangement:'row'|'column', header?:number, gap?:number}} o
 * @returns {{w:number, h:number, panels:Array<{x:number,y:number,s:number,w:number,h:number,headerY:number}>, arrangement:string}}
 */
export function pairedGeometry(ctx, o) {
  const header = o.header ?? 120;
  const gap = o.gap ?? 70;
  const {w: sw, h: sh} = o.stage;
  if (o.arrangement === 'row') {
    const w = sw * 2 + gap;
    const hh = sh + header;
    return {w, h: hh, arrangement: 'row', panels: [0, 1].map(i => ({x: i * (sw + gap), y: header, s: 1, w: sw, h: sh, headerY: 0}))};
  }
  const w = sw;
  const hh = (sh + header) * 2 + gap;
  return {w, h: hh, arrangement: 'column', panels: [0, 1].map(i => ({x: 0, y: i * (sh + header + gap) + header, s: 1, w: sw, h: sh, headerY: i * (sh + header + gap)}))};
}

/**
 * Scenario header: letter badge + label + optional caption, all fitted.
 * @param {any} ctx
 * @param {{name:string, letter:string, label:string, caption?:string, x:number, y:number, w:number, h:number, color:string}} o
 */
export function scenarioHeader(ctx, o) {
  const th = ctx.theme;
  const size = Math.min(54, o.h * 0.4);
  const badgeR = size * 0.78;
  const parts = [
    h('circle', {cx: o.x + badgeR, cy: o.y + o.h * 0.42, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    // with labels hidden the badge stays as a coloured marker (A = left/top, B = right/bottom)
    ctx.show('key') ? h('text', {x: o.x + badgeR, y: o.y + o.h * 0.42 + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
  ];
  if (ctx.show('key')) {
    const f = ctx.fit(o.label, {maxWidth: o.w - badgeR * 2 - 24, size, minSize: size * 0.7, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: o.x + badgeR * 2 + 18, y: o.y + o.h * 0.42 - f.size * 0.62, fill: th.fg}));
  }
  if (o.caption && ctx.show('all')) {
    const f2 = ctx.fit(o.caption, {maxWidth: o.w - badgeR * 2 - 24, size: size * 0.62, minSize: 16, maxLines: 1, weight: 500});
    parts.push(textBlock(f2, {x: o.x + badgeR * 2 + 18, y: o.y + o.h * 0.42 + size * 0.6, fill: th.fgSoft}));
  }
  return g({name: o.name}, parts);
}

/** Centre a design block (bw×bh) in the scene design space at scale. */
export function centerBlock(ctx, bw, bh) {
  const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
  return {s, ox: (ctx.design.w - bw * s) / 2, oy: (ctx.design.h - bh * s) / 2, transform: T((ctx.design.w - bw * s) / 2, (ctx.design.h - bh * s) / 2, 0, s)};
}

/** Neutral comparison note chip (no winner, no score). */
export function neutralNote(ctx, text, o) {
  return chip(ctx, text, {x: o.x, y: o.y, anchor: 'middle', maxWidth: o.maxWidth, size: o.size ?? 28, maxLines: 2, fill: ctx.theme.card, name: o.name, weight: 500});
}
