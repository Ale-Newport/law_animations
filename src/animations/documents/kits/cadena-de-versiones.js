/**
 * Version-chain kit for the "Cadena de versiones" motif (LAW-0029..0032).
 *
 * Assets (original vector geometry):
 *  - versionSheet: a copy with a header band that carries the version badge
 *    (identifier + one pip per position in the chain, so order still reads
 *    with labels hidden), a date/descriptor, and accumulated revision marks
 *    (copy k shows k margin marks);
 *  - indexTab: a sticky index flag (translucent adhesive end + solid flag)
 *    with a tick stroke that a pen can draw;
 *  - versionFolder: a manila file with a labelled tab that holds the chain;
 *  - versionDesk: top-down desk. Clerk A files loose copies, oldest first,
 *    into a shingled chain on the folder (each newer copy on top, offset so
 *    every older header band stays visible); reviewer B presses an index tab
 *    onto the header band of the selected copy and ticks it with a pen.
 *
 * The kit owns geometry and a pose solver (action values → node props). Each
 * entry owns its own timeline, layout and semantics.
 *
 * Attachment rules (asserted by tests through semantics):
 *  - a carried copy is positioned so its grip point sits exactly under A's
 *    SOLVED hand (`handA` == `carryGrip`);
 *  - the tab follows B1's solved hand while held (`handB1` == `tabGrip`) and
 *    stays at its attach point on the copy once pressed;
 *  - the pen is posed from B2's solved hand; while writing its tip follows
 *    the tick stroke on the tab (`penTip` == `tickPoint`);
 *  - every IK target is inside arm reach (`allReached`).
 * Z-order: every copy exists twice — a pile instance (pile layer, drawn in
 * reverse pick order so the next copy to pick is always on top) and a chain
 * instance (chain layer above the pile, drawn oldest first). The instance
 * swap happens at pick-up, when both occupy the same pose, so nothing pops.
 * @module animations/documents/kits/cadena-de-versiones
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, polyline, catmullRom, roundRectPath} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {pen, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Fields                                                               */
/* ------------------------------------------------------------------ */

/** Scene fields shared by the four entries of the motif. */
export const versionFields = {
  versions: list('Successive copies, oldest first; each identifier is printed on the copy’s header badge', obj('Version', {
    id: str('Version identifier printed on the badge (fictional)', 16),
    date: str('Relative date or descriptor printed on the header (fictional)', 24),
  }, ['id']), 2, 5),
  selectedVersion: str('Identifier of the copy the index tab identifies (must match a versions[].id; otherwise the newest copy is used)', 16),
};

/** Index of a version id inside the list (fallback: newest). */
export function versionIndex(versions, id, fallback = versions.length - 1) {
  const i = versions.findIndex(v => v.id === id);
  return i >= 0 ? i : fallback;
}

export const FOLDER_COLOR = '#dcbc7d';
export const TAB_COLOR = '#f2b134';

/**
 * Chip that prefers one line (shrinking a little) and only wraps — up to
 * `maxLines` — when one line would truncate the meaning.
 */
export function tightChip(ctx, text, o) {
  const one = chip(ctx, text, {...o, maxLines: 1, minSize: o.size * 0.82});
  if (!one.fit.truncated) return one;
  return chip(ctx, text, {...o, maxLines: o.maxLines ?? 3, minSize: o.minSize ?? o.size * 0.62});
}

/**
 * Actor name chip with a swatch in the actor's sleeve colour, so the label
 * reads as belonging to that arm even when it cannot sit right beside it.
 * Prefers one line; wraps up to `maxLines` rather than truncating.
 */
export function actorChip(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size ?? 28;
  const padX = size * 0.55, padY = size * 0.36;
  const sw = size * 0.42;
  const gap = size * 0.38;
  const room = o.maxWidth - padX * 2 - sw * 2 - gap;
  let fit = ctx.fit(text, {maxWidth: room, size, minSize: size * 0.82, maxLines: 1, weight: 600});
  if (fit.truncated) fit = ctx.fit(text, {maxWidth: room, size, minSize: size * 0.72, maxLines: o.maxLines ?? 2, weight: 600});
  // a long name keeps all its words: one more line before any ellipsis
  if (fit.truncated) fit = ctx.fit(text, {maxWidth: room, size: size * 0.9, minSize: size * 0.62, maxLines: (o.maxLines ?? 2) + 1, weight: 600});
  const w = padX * 2 + sw * 2 + gap + fit.width;
  const hh = fit.height + padY * 2;
  const x = o.anchor === 'end' ? o.x - w : o.anchor === 'middle' ? o.x - w / 2 : o.x;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: r(x + padX + sw), cy: r(o.y + padY + size * 0.5), r: r(sw), fill: o.color, stroke: th.ink, 'stroke-width': 2}),
    textBlock(fit, {x: x + padX + sw * 2 + gap, y: o.y + padY, fill: th.ink}),
  );
  return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}, fit};
}

/**
 * Editorial callout whose leader is a polyline (chip → via points → target),
 * drawn on like `callout()`. Used where a straight leader would cross copies.
 * @param {any} ctx
 * @param {{name:string, text:string, chipAt:{x:number,y:number}, anchor?:'start'|'middle'|'end', via:Array<{x:number,y:number}>,
 *   target:{x:number,y:number}, maxWidth:number, size?:number, maxLines?:number, color?:string}} o
 */
export function elbowCallout(ctx, o) {
  const th = ctx.theme;
  const color = o.color ?? th.ink;
  const c = tightChip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size ?? 26, maxLines: o.maxLines ?? 3, fill: th.card, stroke: color, name: `${o.name}-chip`});
  const b = c.box;
  const first = o.via.length ? o.via[0] : o.target;
  const from = {x: Math.max(b.x + 12, Math.min(first.x, b.x + b.w - 12)), y: first.y > b.y + b.h ? b.y + b.h : first.y < b.y ? b.y : b.y + b.h / 2};
  const pts = [from, ...o.via, o.target];
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-lead`, d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(o.target.x), cy: r(o.target.y), r: 7, fill: color, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
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
 * Layout of a copy's header band. One row: [badge][pips] … [date]. Two rows
 * (used when an identifier or date would not fit): [badge][pips] above,
 * [date] below. `fits` reports whether everything fits without truncation.
 * @param {any} ctx
 * @param {{w:number, band:number, rows?:1|2, reserveRight?:number, ids:string[], dates:string[], index:number}} o
 */
export function bandLayout(ctx, o) {
  const {w, band, index} = o;
  const pad = w * 0.07;
  const two = o.rows === 2;
  const row1 = two ? band * 0.62 : band;
  const bh = row1 * (two ? 0.74 : 0.64);
  const by = two ? row1 * 0.17 : (row1 - bh) / 2;
  const idSize = row1 * 0.44;
  const limit = w - Math.max(pad * 0.8, (o.reserveRight || 0) + 10);
  // two-row bands give the identifier most of the first row (the pips squeeze
  // in after it); an identifier is never cut: it shrinks further first
  const idMax = two ? Math.max(w * 0.6, Math.min(w * 0.74, limit - pad * 0.8 - bh * 0.62 - 12 - (index + 1) * 9)) : w * 0.36;
  const idFit = t => {
    const f = ctx.fit(t, {maxWidth: idMax, size: idSize, minSize: idSize * 0.62, maxLines: 1, weight: 800});
    return f.truncated && two ? ctx.fit(t, {maxWidth: idMax, size: idSize * 0.62, minSize: idSize * 0.42, maxLines: 1, weight: 800}) : f;
  };
  const idFits = o.ids.map(idFit);
  const bw = Math.max(bh * 1.3, ...idFits.map(f => f.width + bh * 0.62));
  const badge = {x: pad * 0.8, y: by, w: bw, h: bh};
  let pipR = row1 * 0.075;
  let gap = pipR * 2.7;
  const pipX0 = badge.x + bw + pipR * 2.2;
  if (two && index > 0 && pipX0 + index * gap + pipR > limit) {
    gap = Math.max(pipR * 2.2, (limit - pipX0 - pipR) / index);
    if (pipX0 + index * gap + pipR > limit) {
      pipR = Math.max(2.5, (limit - pipX0) / (index * 2.2 + 1));
      gap = pipR * 2.2;
    }
  }
  const pips = [];
  for (let i = 0; i <= index; i++) pips.push({x: pipX0 + i * gap, y: by + bh / 2, r: pipR});
  const pipEnd = pipX0 + index * gap + pipR;
  let dateX, dateAnchor, dateMax, dateSize, dateMid;
  if (two) {
    dateX = badge.x;
    dateAnchor = 'start';
    dateMax = limit - badge.x;
    dateSize = (band - row1) * 0.56;
    dateMid = row1 + (band - row1) * 0.46;
  } else {
    dateX = limit;
    dateAnchor = 'end';
    dateMax = Math.max(40, limit - (pipEnd + pad * 0.6));
    dateSize = band * 0.3;
    dateMid = band / 2;
  }
  const dateFit = d => {
    const f = ctx.fit(d, {maxWidth: dateMax, size: dateSize, minSize: dateSize * 0.74, maxLines: 1, weight: 600});
    return f.truncated && two ? ctx.fit(d, {maxWidth: dateMax, size: dateSize * 0.74, minSize: dateSize * 0.56, maxLines: 1, weight: 600}) : f;
  };
  const dateFits = o.dates.map(d => (d ? dateFit(d) : null));
  const fits = !idFits.some(f => f.truncated) && !dateFits.some(f => f && f.truncated) && pipEnd <= limit + 0.5;
  return {badge, idFits, pips, dateFits, dateX, dateAnchor, dateMax, dateMid, dateY: f => dateMid - f.size / 2, fits};
}

/**
 * Header-band mode shared by every copy of a stage: one row when all
 * identifiers and dates fit, otherwise a taller two-row band.
 * @returns {{rows:1|2, band:number}}
 */
export function chooseBand(ctx, {versions, w, band, reserveRight = 0}) {
  const ok = (rows, b) => versions.every((v, i) => bandLayout(ctx, {w, band: b, rows, reserveRight, ids: [v.id], dates: [v.date || ''], index: i}).fits);
  if (ok(1, band)) return {rows: 1, band};
  return {rows: 2, band: Math.round(band * 1.45)};
}

/* ------------------------------------------------------------------ */
/* Version sheet                                                        */
/* ------------------------------------------------------------------ */

/**
 * A copy of the document. Local origin = top-left corner.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, band:number, version:{id:string,date?:string}, index:number,
 *   doc:{docId:string,title:string,clauses:string[],redactions?:number[]}, lineSeed?:string,
 *   swap?:{date?:[string,string], id?:[string,string]}, ring?:boolean, ringColor?:string, reserveRight?:number, nameTexts?:boolean, rows?:1|2}} o
 *   `bodyText: false` draws the body schematically (for copies that are always covered).
 *   `nameTexts` names the body text nodes (`${prefix}-tx-*`) and returns their local boxes in `bodyTexts`.
 *   `swap` renders before/after variants (named `${prefix}-date0/1`, `${prefix}-id0/1`) for inspect.
 */
export function versionSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, band, prefix} = o;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const pad = w * 0.07;
  const v = o.version;
  const parts = [];

  // shadow + sheet
  parts.push(h('path', {d: roundRectPath(5, 8, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: th.paper}));
  // header band
  parts.push(h('path', {d: `M0 6Q0 0 6 0H${r(w - 6)}Q${r(w)} 0 ${r(w)} 6V${r(band)}H0Z`, fill: th.paperShade}));
  parts.push(h('line', {x1: 0, x2: w, y1: band, y2: band, stroke: th.ink, 'stroke-width': 1.8}));

  // badge (identifier), pips and date — geometry independent of label visibility
  const ids = o.swap && o.swap.id ? o.swap.id : [v.id];
  const dates = o.swap && o.swap.date ? o.swap.date : [v.date || ''];
  const BL = bandLayout(ctx, {w, band, rows: o.rows || 1, reserveRight: o.reserveRight || 0, ids, dates, index: o.index});
  const {badge} = BL;
  parts.push(h('path', {name: o.swap && o.swap.id ? `${prefix}-badge` : undefined, d: roundRectPath(badge.x, badge.y, badge.w, badge.h, badge.h * 0.28), fill: th.ink}));
  if (showKey) {
    BL.idFits.forEach((f, i) => parts.push(textBlock(f, {x: badge.x + badge.w / 2, y: badge.y + (badge.h - f.size) / 2 - f.size * 0.02, anchor: 'middle', fill: '#ffffff', name: o.swap && o.swap.id ? `${prefix}-id${i}` : undefined, opacity: i ? 0 : undefined})));
  }
  // pips: one per position in the chain (reads without text)
  for (const q of BL.pips) parts.push(h('circle', {cx: r(q.x), cy: r(q.y), r: r(q.r), fill: th.accent2, stroke: th.ink, 'stroke-width': 1.4}));
  // date / descriptor: right end of row 1 (one-row) or row 2 (two-row);
  // the right end of the band stays free for an index tab's adhesive film
  let dateFit = null;
  if (showAll) {
    BL.dateFits.forEach((f, i) => {
      if (!f) return;
      if (i === 0) dateFit = f;
      parts.push(textBlock(f, {x: BL.dateX, y: BL.dateY(f), anchor: BL.dateAnchor, fill: i ? th.accent2 : th.inkSoft, name: o.swap && o.swap.date ? `${prefix}-date${i}` : undefined, opacity: i ? 0 : undefined}));
    });
  } else if (dates[0]) {
    const bw = Math.min(BL.dateMax, w * 0.24);
    parts.push(h('rect', {x: r(BL.dateAnchor === 'end' ? BL.dateX - bw : BL.dateX), y: r(BL.dateMid - band * 0.07), width: r(bw), height: r(band * 0.14), rx: 3, fill: th.paperLine}));
  }
  const dateMax = BL.dateMax;
  const dateRight = BL.dateAnchor === 'end' ? BL.dateX : BL.dateX + dateMax;

  // body (texts are recorded so a stage can hide the ones covered by other copies)
  const bodyTexts = [];
  let y = band + pad * 0.75;
  const inner = w - pad * 2;
  const docSize = Math.max(11, w * 0.042);
  const bodyText = showAll && o.bodyText !== false;
  if (o.doc.docId && bodyText) {
    const f = ctx.fit(o.doc.docId, {maxWidth: inner, size: docSize, minSize: 9, maxLines: 1, weight: 600, family: 'mono'});
    bodyTexts.push({name: `${prefix}-tx-doc`, box: {x: pad, y, w: f.width, h: f.height}});
    parts.push(textBlock(f, {x: pad, y, fill: th.inkSoft, name: o.nameTexts ? `${prefix}-tx-doc` : undefined}));
  } else {
    parts.push(h('rect', {x: pad, y: y + 2, width: r(inner * 0.3), height: r(docSize * 0.55), rx: 3, fill: th.paperLine}));
  }
  y += docSize * 2.6;
  const titleSize = Math.max(14, w * 0.064);
  if (o.doc.title && bodyText) {
    const f = ctx.fit(o.doc.title, {maxWidth: inner, size: titleSize, minSize: titleSize * 0.72, maxLines: 2, weight: 700, family: 'serif'});
    bodyTexts.push({name: `${prefix}-tx-title`, box: {x: pad, y, w: f.width, h: f.height}});
    parts.push(textBlock(f, {x: pad, y, fill: th.ink, name: o.nameTexts ? `${prefix}-tx-title` : undefined}));
    y += f.height + titleSize * 0.72;
  } else {
    parts.push(h('rect', {x: pad, y, width: r(inner * 0.72), height: r(titleSize * 0.7), rx: 4, fill: th.ink, opacity: 0.8}));
    y += titleSize * 1.3;
  }
  parts.push(h('line', {x1: pad, x2: r(w - pad), y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 2}));
  y += titleSize * 0.62;
  const clauses = (o.doc.clauses && o.doc.clauses.length ? o.doc.clauses : ['', '', '']).slice(0, 5);
  const area = Math.max(0, hh - pad * 0.9 - y);
  const each = area / clauses.length;
  const barH = Math.max(4, w * 0.016);
  const headSize = Math.max(10, w * 0.042);
  const redactions = new Set(o.doc.redactions || []);
  clauses.forEach((text, i) => {
    const cy = y + i * each;
    let used = 0;
    // accumulated revision marks: copy k carries k margin marks
    if (i < o.index) {
      parts.push(h('rect', {x: r(pad * 0.28), y: r(cy - 1), width: r(Math.max(4, pad * 0.26)), height: r(Math.max(10, each * 0.72)), rx: 2, fill: th.accent}));
      parts.push(h('rect', {x: r(pad - 3), y: r(cy + headSize * 1.3 - 2), width: r(inner * 0.66), height: r(barH + 4), rx: 3, fill: th.accentSoft}));
    }
    if (text && bodyText && each > headSize * 1.6) {
      const f = ctx.fit(`${i + 1}. ${text}`, {maxWidth: inner, size: headSize, minSize: 8, maxLines: 1, weight: 600});
      bodyTexts.push({name: `${prefix}-tx-c${i}`, box: {x: pad, y: cy, w: f.width, h: f.height}});
      parts.push(textBlock(f, {x: pad, y: cy, fill: th.ink, name: o.nameTexts ? `${prefix}-tx-c${i}` : undefined}));
      used = headSize * 1.3;
    } else if (each > headSize * 1.6) {
      parts.push(h('rect', {x: pad, y: r(cy + 1), width: r(inner * 0.45), height: r(barH + 1), rx: 2, fill: shade('#c9c2b4', -0.25)}));
      used = headSize * 1.3;
    }
    const bars = Math.max(1, Math.min(2, Math.floor((each - used - barH) / (barH * 2.3))));
    for (let b = 0; b < bars; b++) {
      const lw = inner * (b === bars - 1 ? 0.5 + ctx.rng(`${o.lineSeed || 'ver'}-l`, i * 7 + b) * 0.3 : 0.84 + ctx.rng(`${o.lineSeed || 'ver'}-l`, i * 7 + b) * 0.16);
      parts.push(h('rect', {x: pad, y: r(cy + used + b * barH * 2.3), width: r(lw), height: r(barH), rx: r(barH / 2), fill: th.paperLine}));
    }
    if (redactions.has(i)) parts.push(h('rect', {x: r(pad - 4), y: r(cy - 3), width: r(inner + 8), height: r(Math.max(0, Math.min(each - 4, used + bars * barH * 2.3 + 2))), rx: 3, fill: th.ink}));
  });
  // outline on top of the band
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke}));
  if (o.ring) {
    parts.push(h('path', {name: `${prefix}-ring`, d: roundRectPath(-11, -11, w + 22, hh + 22, 14), fill: 'none', stroke: o.ringColor || th.accent, 'stroke-width': 6, 'stroke-dasharray': '16 10', opacity: 0}));
  }
  return {
    node: g({name: prefix}, parts),
    w, h: hh, band,
    bodyTexts: o.nameTexts ? bodyTexts : [],
    badge,
    tabLocal: {x: w, y: band / 2},
    dateFit,
    dateBox: {x: dateRight - dateMax, y: BL.dateMid - band * 0.25, w: dateMax, h: band * 0.5},
  };
}

/* ------------------------------------------------------------------ */
/* Index tab                                                            */
/* ------------------------------------------------------------------ */

/**
 * Sticky index flag. Local origin = the sheet edge on the flag's centre
 * line; +x is the protruding direction. The tick stroke is drawable.
 * @param {any} ctx
 * @param {{name:string, h:number, overlap:number, protrude:number, color?:string}} o
 */
export function indexTab(ctx, o) {
  const th = ctx.theme;
  const {h: hh, overlap: ov, protrude: pr} = o;
  const c = o.color || TAB_COLOR;
  const y0 = -hh / 2;
  const tickPts = [
    {x: pr * 0.26, y: hh * 0.02}, {x: pr * 0.36, y: hh * 0.14}, {x: pr * 0.44, y: hh * 0.24},
    {x: pr * 0.56, y: hh * 0.04}, {x: pr * 0.68, y: -hh * 0.14}, {x: pr * 0.78, y: -hh * 0.27},
  ];
  const tick = polyline(catmullRom(tickPts, 6));
  const tickName = `${o.name}-tick`;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(-ov + 4, y0 + 6, ov + pr, hh, 6), fill: th.shadow}),
    // adhesive film on the sheet (translucent)
    h('rect', {x: r(-ov), y: r(y0), width: r(ov + 2), height: r(hh), fill: c, 'fill-opacity': 0.45, stroke: shade(c, -0.4), 'stroke-width': 1.5, 'stroke-dasharray': '5 4'}),
    // solid flag
    h('path', {d: `M0 ${r(y0)}H${r(pr - 10)}Q${r(pr)} ${r(y0)} ${r(pr)} ${r(y0 + 10)}V${r(-y0 - 10)}Q${r(pr)} ${r(-y0)} ${r(pr - 10)} ${r(-y0)}H0Z`, fill: c, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(pr * 0.08), y: r(y0 + 4), width: r(pr * 0.8), height: r(hh * 0.14), rx: 2, fill: '#ffffff', opacity: 0.35}),
    h('path', {name: tickName, d: tick.d(1), fill: 'none', stroke: '#1d3f8f', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(tick.total)} ${r(tick.total + 10)}`, 'stroke-dashoffset': r(tick.total), opacity: 0}),
  );
  return {
    node,
    h: hh, overlap: ov, protrude: pr,
    // pinched just beyond the flag's tip, so the flag stays visible in the hand
    grip: {x: pr + 22, y: 0},
    tickAt: p => tick.at(p),
    tickFrame: p => ({[tickName]: {'stroke-dashoffset': r(tick.total * (1 - p)), opacity: p > 0 ? 1 : 0}}),
  };
}

/** Pad of spare flags (fanned), the tab is taken from its top. Local origin = pad centre. */
export function tabPad(ctx, {h: hh, overlap, protrude, color}) {
  const th = ctx.theme;
  const c = color || TAB_COLOR;
  const w = overlap + protrude;
  const flag = (deg, dx, dy, tone) => g({transform: T(dx, dy, deg)},
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 7), fill: shade(c, tone), stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(overlap), height: r(hh), rx: 6, fill: '#ffffff', opacity: 0.28}));
  return g(null,
    h('path', {d: roundRectPath(-w / 2 + 6, -hh / 2 + 26, w + 10, hh + 8, 8), fill: th.shadow}),
    // card backing of the pad
    h('path', {d: roundRectPath(-w / 2 - 8, -hh / 2 + 4, w + 16, hh + 22, 8), fill: '#f4efe4', stroke: th.ink, 'stroke-width': 2}),
    flag(10, 6, 16, -0.22), flag(5, 3, 9, -0.12),
  );
}

/* ------------------------------------------------------------------ */
/* Folder                                                               */
/* ------------------------------------------------------------------ */

/**
 * Manila file seen from above, with a labelled tab on its top edge.
 * Local origin = top-left of the body (the tab rises above y = 0).
 */
export function versionFolder(ctx, {w, h: hh, label, tabH = 34, color}) {
  const th = ctx.theme;
  const c = color || FOLDER_COLOR;
  const tabW = w * 0.46;
  let labelFit = label && ctx.show('all') ? ctx.fit(label, {maxWidth: tabW - 26, size: tabH * 0.56, minSize: tabH * 0.44, maxLines: 1, weight: 700}) : null;
  if (labelFit && labelFit.truncated) labelFit = ctx.fit(label, {maxWidth: tabW - 26, size: tabH * 0.4, minSize: tabH * 0.34, maxLines: 2, weight: 700, leading: 1.05});
  return {
    node: g(null,
      h('path', {d: roundRectPath(8, 12 - tabH, w, hh + tabH, 12), fill: th.shadow}),
      h('path', {d: `M0 10Q0 0 10 0H${r(w - 10)}Q${r(w)} 0 ${r(w)} 10V${r(hh - 10)}Q${r(w)} ${r(hh)} ${r(w - 10)} ${r(hh)}H10Q0 ${r(hh)} 0 ${r(hh - 10)}Z`, fill: c, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      h('path', {d: `M8 2V${r(-tabH + 10)}Q8 ${r(-tabH)} 18 ${r(-tabH)}H${r(tabW - 16)}Q${r(tabW)} ${r(-tabH)} ${r(tabW + 8)} 2Z`, fill: shade(c, 0.08), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      h('rect', {x: 14, y: 16, width: r(w - 28), height: r(hh - 32), rx: 8, fill: '#000', opacity: 0.05}),
      // bottom pocket and a two-prong fastener at the top of the file
      h('path', {d: `M0 ${r(hh * 0.8)}L${r(w * 0.34)} ${r(hh * 0.8)}Q${r(w * 0.42)} ${r(hh * 0.8)} ${r(w * 0.48)} ${r(hh * 0.86)}L${r(w * 0.6)} ${r(hh * 0.94)}H${r(w)}V${r(hh - 10)}Q${r(w)} ${r(hh)} ${r(w - 10)} ${r(hh)}H10Q0 ${r(hh)} 0 ${r(hh - 10)}Z`, fill: shade(c, -0.08), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('rect', {x: r(w / 2 - 44), y: 8, width: 88, height: 18, rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: r(w / 2 - 28), cy: 17, r: 4, fill: th.metalDark}),
      h('circle', {cx: r(w / 2 + 28), cy: 17, r: 4, fill: th.metalDark}),
      labelFit ? textBlock(labelFit, {x: 20, y: -tabH + (tabH - labelFit.height) / 2, fill: th.ink}) : null,
    ),
    tabBox: {x: 8, y: -tabH, w: tabW, h: tabH},
  };
}

/* ------------------------------------------------------------------ */
/* Desk stage                                                           */
/* ------------------------------------------------------------------ */

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {horizontal: {w: 1760, h: 900}, square: {w: 1410, h: 1100}, vertical: {w: 900, h: 1400}};

/**
 * Geometry per axis. Pile entries are [cx, cy, deg]; grips are fractions of
 * the sheet size measured from its centre. Positions were chosen so that
 * every IK target stays inside arm reach (verified by the tests).
 */
export const GEO = {
  horizontal: {
    sheet: {w: 300, h: 390, band: 68}, step: {dx: 10, dy: 68}, chain0: {x: 1010, y: 104},
    folder: {x: 968, y: 72, w: 424, h: 736},
    piles: [{x: 400, bottom: 745, rot: -3}, {x: 705, bottom: 800, rot: 2.5}],
    grip: {x: -0.12, fromBottom: 55}, shoulderA: {x: 870, y: 1140}, restA: {x: 928, y: 642}, bendA: -1,
    armA: {upper: 420, lower: 400},
    arm: {upper: 372, lower: 352},
    shoulderB1: {x: 2020, y: 600}, restB1: {x: 1650, y: 730}, bendB1: 1, armB1: {upper: 400, lower: 380},
    shoulderB2: {x: 2050, y: 330}, restB2: {x: 1840, y: 430}, penRest: {x: 1545, y: 615}, bendB2: 1, penAngle: -26,
    tabPad: {x: 1610, y: 830, rot: -12},
    tab: {h: 44, overlap: 42, protrude: 88},
  },
  square: {
    sheet: {w: 270, h: 350, band: 68}, step: {dx: 9, dy: 68}, chain0: {x: 714, y: 222},
    folder: {x: 680, y: 190, w: 380, h: 720},
    piles: [{x: 225, bottom: 800, rot: -3}, {x: 520, bottom: 880, rot: 2.5}],
    grip: {x: -0.12, fromBottom: 55}, shoulderA: {x: 640, y: 1280}, restA: {x: 780, y: 800}, homeOnFile: true, bendA: -1,
    armA: {upper: 430, lower: 410},
    arm: {upper: 392, lower: 372},
    shoulderB1: {x: 1620, y: 820}, restB1: {x: 1280, y: 880}, bendB1: 1, armB1: {upper: 400, lower: 380},
    shoulderB2: {x: 1660, y: 480}, restB2: {x: 1510, y: 500}, penRest: {x: 1190, y: 760}, bendB2: 1, penAngle: -26,
    tabPad: {x: 1240, y: 990, rot: -12},
    tab: {h: 40, overlap: 38, protrude: 80},
  },
  vertical: {
    sheet: {w: 260, h: 338, band: 60}, step: {dx: 8, dy: 60}, chain0: {x: 236, y: 704},
    folder: {x: 200, y: 672, w: 364, h: 648},
    piles: [{x: 190, bottom: 609, rot: -3}, {x: 460, bottom: 669, rot: 2.5}],
    grip: {x: -0.3, y: 0.12}, shoulderA: {x: -320, y: 800}, restA: {x: 150, y: 962}, bendA: 1, handedA: 'left',
    armA: {upper: 420, lower: 400},
    arm: {upper: 360, lower: 340},
    shoulderB1: {x: 1150, y: 1250}, restB1: {x: 820, y: 1180}, bendB1: 1, armB1: {upper: 400, lower: 380},
    shoulderB2: {x: 1080, y: 640}, restB2: {x: 970, y: 660}, penRest: {x: 700, y: 640}, bendB2: 1, penAngle: -26,
    tabPad: {x: 740, y: 1300, rot: -12},
    tab: {h: 40, overlap: 38, protrude: 84},
  },
};

/**
 * Loose copies lie in two small cascades (left: v1, v3, v5…; right: v2, v4…),
 * the first to be picked on top. Each deeper copy peeks out by one header
 * band (+4) at the same angle, so every identifier is visible at rest and
 * every covered body is covered completely. Small x jitter per depth.
 */
const JITTER = [0, 12, -8];

/** Sub-phases of each copy's move inside the ordering progress. */
const REACH_END = 0.4;
const CARRY_END = 0.88;

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {Array<{id:string,date?:string}>} o.versions
 * @param {number} o.selected                 index of the copy the tab identifies
 * @param {{docId:string,title:string,clauses:string[],redactions?:number[]}} o.doc
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.people  [clerk, reviewer]
 * @param {string} [o.folderLabel]
 * @param {boolean} [o.chips=true]
 * @param {boolean} [o.withTab=true]           reviewer + tab + pen present
 * @param {number} [o.ringIndex=-1]            copy that carries an editorial ring (contrast); the ring outlines
 *   that copy's header band on a layer above the chain, so it stays visible once newer copies cover the body
 * @param {number} [o.labelScale=1]             enlarges the key labels (header bands with the identifiers, actor
 *   chips, file label) for stages that are shown small, e.g. two desks side by side in a square frame
 * @param {{index:number, date?:[string,string], id?:[string,string]}} [o.swap] before/after variants on one copy (inspect)
 */
export function versionDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STAGE[axis];
  const N = o.versions.length;
  // header bands grow to two rows when identifiers/dates are long; the sheets
  // then get shorter so the whole chain still fits on the file
  const LS = o.labelScale ?? 1;
  const chainMax = G.folder.y + G.folder.h - 30 - G.chain0.y;
  // enlarged bands must still leave every copy a readable body on the file
  const minSheetH = G.sheet.h * 0.55;
  let baseBand = Math.round(G.sheet.band * LS);
  let bandMode = chooseBand(ctx, {versions: o.versions, w: G.sheet.w, band: baseBand, reserveRight: G.tab.overlap});
  while (N > 1 && chainMax - (N - 1) * bandMode.band < minSheetH && baseBand > G.sheet.band * 0.85) {
    baseBand = Math.round(baseBand * 0.92);
    bandMode = chooseBand(ctx, {versions: o.versions, w: G.sheet.w, band: baseBand, reserveRight: G.tab.overlap});
  }
  const S = {w: G.sheet.w, band: bandMode.band, h: Math.min(G.sheet.h, chainMax - (N - 1) * bandMode.band)};
  const reduced = ctx.reduced;

  /* ---- chain slots (centres) and pile poses ---- */
  const slot = k => ({x: G.chain0.x + k * G.step.dx + S.w / 2, y: G.chain0.y + k * S.band + S.h / 2, rot: 0});
  const cascade = S.band + 4;
  const pilePose = k => {
    const pl = G.piles[k % 2];
    const d = Math.floor(k / 2);
    const a = rad(pl.rot);
    const lx = JITTER[d] || 0, ly = -cascade * d;
    const py = pl.bottom - S.h / 2;
    return {x: pl.x + lx * Math.cos(a) - ly * Math.sin(a), y: py + lx * Math.sin(a) + ly * Math.cos(a), rot: pl.rot};
  };
  /** true when a stage point lies on the sheet posed at `pose` (inflated by `pad`) */
  const onSheet = (pose, q, pad = 2) => {
    const a = -rad(pose.rot);
    const dx = q.x - pose.x, dy = q.y - pose.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(lx) <= S.w / 2 + pad && Math.abs(ly) <= S.h / 2 + pad;
  };
  const rotPt = (pose, local) => {
    const a = rad(pose.rot);
    const s = pose.s ?? 1;
    return {x: pose.x + (local.x * Math.cos(a) - local.y * Math.sin(a)) * s, y: pose.y + (local.x * Math.sin(a) + local.y * Math.cos(a)) * s};
  };
  const gripLocal = {x: S.w * G.grip.x, y: G.grip.fromBottom !== undefined ? S.h / 2 - G.grip.fromBottom : S.h * G.grip.y};

  /* ---- copies (two instances each) ---- */
  const sheets = [];
  const pileSheets = [];
  const pileNodes = [];
  const chainNodes = [];
  for (let i = 0; i < N; i++) {
    const make = inst => {
      const swap = o.swap && o.swap.index === i && inst === 'chain' ? {date: o.swap.date, id: o.swap.id} : undefined;
      return versionSheet(ctx, {
        prefix: `${P}-${inst}${i}`, w: S.w, h: S.h, band: S.band, version: o.versions[i], index: i, doc: o.doc,
        lineSeed: `ver-${i}`, swap, reserveRight: G.tab.overlap, nameTexts: true, rows: bandMode.rows,
      });
    };
    const a = make('pile');
    const b = make('chain');
    sheets.push(b);
    pileSheets.push(a);
    pileNodes.push(g({name: `${P}-pc${i}`, transform: T(pilePose(i).x, pilePose(i).y, pilePose(i).rot)}, g({transform: T(-S.w / 2, -S.h / 2)}, a.node)));
    chainNodes.push(g({name: `${P}-cc${i}`, transform: T(pilePose(i).x, pilePose(i).y, pilePose(i).rot), display: 'none'}, g({transform: T(-S.w / 2, -S.h / 2)}, b.node)));
  }

  /* ---- folder ---- */
  const folder = versionFolder(ctx, {w: G.folder.w, h: G.folder.h, label: o.folderLabel, tabH: Math.round(34 * Math.min(LS, 1.3))});
  const folderNode = g({transform: T(G.folder.x, G.folder.y)}, folder.node);

  /* ---- tab, pad, pen ---- */
  const withTab = o.withTab !== false;
  const tab = indexTab(ctx, {name: `${P}-tab`, ...G.tab});
  const padPose = {x: G.tabPad.x, y: G.tabPad.y, rot: G.tabPad.rot};
  // the moving tab rests on the pad with its flag centred on the pad
  const tabRestLocal = {x: -(G.tab.protrude - G.tab.overlap) / 2, y: 0};
  const tabRest = {...rotPt(padPose, tabRestLocal), rot: padPose.rot};
  const tabPadNode = g({transform: T(padPose.x, padPose.y, padPose.rot)}, tabPad(ctx, G.tab));
  const penProp = pen(ctx, {name: `${P}-pen`, length: 200, body: th.accent2});
  const penDir = {x: Math.cos(rad(G.penAngle)), y: Math.sin(rad(G.penAngle))};

  /* ---- arms ---- */
  const lookA = actorLook(ctx, o.people[0], 0);
  const lookB = actorLook(ctx, o.people[1], 1);
  const armSpec = {...G.arm, width: 50, handScale: 1.3};
  const armA = topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: G.handedA || 'right', ...armSpec, ...(G.armA || {})});
  const armB1 = topArm(ctx, {name: `${P}-armB1`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'right', ...armSpec, ...(G.armB1 || {})});
  const armB2 = topArm(ctx, {name: `${P}-armB2`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'left', ...armSpec, ...(G.armB2 || {})});

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30});

  /* ---- actor chips: sleeve-colour swatch + name · role ---- */
  const caption = p => (p.role ? `${p.name} · ${p.role}` : p.name);
  let chipA = null, chipB = null;
  if (o.chips !== false && ctx.show('key')) {
    if (axis === 'vertical') {
      chipA = actorChip(ctx, caption(o.people[0]), {x: 18, y: 18, maxWidth: W * 0.47, size: 26 * LS, maxLines: 2, color: lookA.outfit, name: `${P}-chipA`});
      if (withTab) chipB = actorChip(ctx, caption(o.people[1]), {x: W - 18, y: 18, anchor: 'end', maxWidth: W * 0.47, size: 26 * LS, maxLines: 2, color: lookB.outfit, name: `${P}-chipB`});
    } else {
      // A's elbow swings out to the right of the shoulder, so the clerk's chip
      // sits on the bottom edge just left of where the upper arm enters
      const size = (axis === 'square' ? 31 : 28) * LS;
      const x = G.shoulderA.x - 150;
      const optsA = {x, anchor: 'end', maxWidth: x - 24, size, maxLines: 2, color: lookA.outfit, name: `${P}-chipA`};
      const probe = actorChip(ctx, caption(o.people[0]), {...optsA, y: 0});
      chipA = actorChip(ctx, caption(o.people[0]), {...optsA, y: H - 10 - probe.box.h});
      if (withTab) chipB = actorChip(ctx, caption(o.people[1]), {x: W - 24, y: 16, anchor: 'end', maxWidth: W - 24 - (G.folder.x + G.folder.w * 0.46 + 30), size, maxLines: 2, color: lookB.outfit, name: `${P}-chipB`});
    }
  }

  // editorial ring around the ringed copy's header band (above the chain, travels with the copy)
  const ringed = o.ringIndex >= 0 && o.ringIndex < N;
  const ringNode = ringed
    ? g({name: `${P}-ring`, opacity: 0, transform: T(pilePose(o.ringIndex).x, pilePose(o.ringIndex).y, pilePose(o.ringIndex).rot)},
      h('path', {d: roundRectPath(-S.w / 2 - 10, -S.h / 2 - 10, S.w + 20, S.band + 16, 12), fill: 'none', stroke: th.accent, 'stroke-width': 6, 'stroke-dasharray': '16 10', 'stroke-linecap': 'round'}))
    : null;

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      folderNode,
      g({name: `${P}-pile`}, pileNodes.slice().reverse()),
      g({name: `${P}-chain`}, chainNodes),
      ringNode,
      withTab ? tabPadNode : null,
      withTab ? tab.node : null,
      withTab ? penProp.node : null,
      armA.arm, armA.palm, armA.thumb,
      withTab ? [armB1.arm, armB1.palm, armB1.thumb, armB2.arm, armB2.palm, armB2.thumb] : null,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  /* ---- helpers for poses ---- */
  // where the clerk's hand settles after filing: its rest spot, or (square)
  // on the file's lower edge just below the finished chain
  const chainBottom = G.chain0.y + (N - 1) * S.band + S.h;
  const homeA = G.homeOnFile
    ? {x: G.folder.x + 44, y: Math.min(G.folder.y + G.folder.h - 12, chainBottom + 58)}
    : G.restA;
  const release = k => {
    // after letting go, the hand eases back toward the shoulder a little
    const q = rotPt({...slot(k)}, gripLocal);
    const toS = {x: G.shoulderA.x - q.x, y: G.shoulderA.y - q.y};
    const L = Math.hypot(toS.x, toS.y) || 1;
    return {x: q.x + (toS.x / L) * 60, y: q.y + (toS.y / L) * 60};
  };
  const copyPose = (k, c) => {
    const a = pilePose(k), b = slot(k);
    if (c <= 0) return {...a, s: 1};
    if (c >= 1) return {...b, s: 1};
    const e = ease.inOutSine(c);
    // gentle arc: the copy slides on a curve bowed away from the shoulder
    const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    const away = axis === 'vertical' ? {x: 40, y: 0} : {x: 0, y: -50};
    const ctl = {x: mid.x + away.x, y: mid.y + away.y};
    const x = (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * ctl.x + e * e * b.x;
    const y = (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * ctl.y + e * e * b.y;
    return {x, y, rot: lerp(a.rot, b.rot, e), s: reduced ? 1 : 1 + 0.035 * Math.sin(Math.PI * c)};
  };
  // Body texts of a loose copy that the copy above it (same cascade) covers
  // stay hidden until that copy has slid off their centre; texts of a filed
  // copy hide once the next copy lands over them (both changes happen while
  // the text is under paper, so nothing visible pops).
  const pileReveal = pileSheets.map((sp, i) => sp.bodyTexts.map(t => {
    if (i < 2) return {name: t.name, cover: -1, c: 0};
    const cover = i - 2;
    const q = rotPt(pilePose(i), {x: t.box.x + t.box.w / 2 - S.w / 2, y: t.box.y + t.box.h / 2 - S.h / 2});
    let c = 0;
    while (c < 1 && onSheet(copyPose(cover, c), q)) c = Math.min(1, r(c + 0.01, 2));
    return {name: t.name, cover, c};
  }));
  const tabAttach = k => {
    const s = slot(k);
    return {x: s.x - S.w / 2 + sheets[k].tabLocal.x, y: s.y - S.h / 2 + sheets[k].tabLocal.y, rot: 0};
  };
  const penGripFromTip = t => ({x: t.x + penDir.x * penProp.grip, y: t.y + penDir.y * penProp.grip});

  /**
   * Pose the stage from action values, each in [0,1].
   * @param {{order:number, homeA?:number, tabReach?:number, tabCarry?:number, tabPress?:number, tabRelease?:number,
   *   penReach?:number, penApproach?:number, penWrite?:number, penReturn?:number, penWithdraw?:number, ring?:number,
   *   tabSlide?:{from:number,to:number,p:number}}} s
   *   `tabSlide` moves an attached tab between two copies' bands (inspect context update, no hand).
   */
  function pose(s) {
    const nodes = {};
    const o0 = clamp(s.order);
    const copies = [];
    const holders = [];
    let carrying = -1;
    const carries = [];
    for (let k = 0; k < N; k++) carries.push(seg(clamp(o0 * N - k), REACH_END, CARRY_END));
    for (let k = 0; k < N; k++) {
      const c = carries[k];
      for (const t of pileReveal[k]) nodes[t.name] = {opacity: t.cover < 0 || carries[t.cover] >= t.c ? 1 : 0};
      const coveredInChain = k < N - 1 && carries[k + 1] >= 1;
      for (const t of sheets[k].bodyTexts) nodes[t.name] = {opacity: coveredInChain ? 0 : 1};
      const pz = copyPose(k, c);
      copies.push(pz);
      const inChain = c > 0;
      if (c > 0 && c < 1) carrying = k;
      holders.push(c <= 0 ? 'pile' : c < 1 ? 'carried' : 'chain');
      nodes[`${P}-pc${k}`] = {display: !inChain};
      nodes[`${P}-cc${k}`] = {display: inChain, transform: T(pz.x, pz.y, pz.rot, pz.s)};
    }

    // --- arm A: reach → carry → release, copy after copy, then home
    let handA;
    if (o0 <= 0) handA = G.restA;
    else if (o0 >= 1) handA = mix(release(N - 1), homeA, ease.inOutCubic(clamp(s.homeA ?? 0)));
    else {
      const k = Math.min(N - 1, Math.floor(o0 * N));
      const lp = clamp(o0 * N - k);
      const prev = k === 0 ? G.restA : release(k - 1);
      if (lp < REACH_END) handA = mix(prev, rotPt(copies[k], gripLocal), ease.inOutSine(lp / REACH_END));
      else if (lp < CARRY_END) handA = rotPt(copies[k], gripLocal);
      else handA = mix(rotPt(copies[k], gripLocal), release(k), ease.inOutSine((lp - CARRY_END) / (1 - CARRY_END)));
    }
    const solvedA = armA.pose(G.shoulderA, handA, G.bendA);
    Object.assign(nodes, solvedA.nodes);

    // --- tab: pad → B1 hand → attach point on the selected copy's band
    let solvedB1 = null, solvedB2 = null;
    let tabPose = tabRest;
    let tabHeld = false;
    let tabAttached = false;
    let penTip = null;
    let penHeld = false;
    let handB2Pt = null;
    let tickPoint = null;
    const tickP = clamp(s.penWrite ?? 0);
    if (withTab) {
      const att = tabAttach(o.selected);
      const reach = clamp(s.tabReach ?? 0), carry = clamp(s.tabCarry ?? 0), press = clamp(s.tabPress ?? 0), rel = clamp(s.tabRelease ?? 0);
      if (s.tabSlide) {
        const a = tabAttach(s.tabSlide.from), b = tabAttach(s.tabSlide.to);
        tabPose = {...mix(a, b, ease.inOutCubic(clamp(s.tabSlide.p))), rot: 0};
        tabAttached = true;
      } else if (carry > 0) {
        const e = ease.inOutSine(carry);
        const lift = reduced ? 0 : Math.sin(Math.PI * carry) * 40;
        tabPose = {x: lerp(tabRest.x, att.x, e), y: lerp(tabRest.y, att.y, e) - lift * 0.3, rot: lerp(tabRest.rot, 0, e)};
        tabAttached = carry >= 1 && press >= 0.5;
      }
      const tabScale = 1 - 0.07 * Math.sin(Math.PI * press) + (carry > 0 && carry < 1 && !reduced ? 0.06 * Math.sin(Math.PI * carry) : 0);
      nodes[`${P}-tab`] = {transform: T(tabPose.x, tabPose.y, tabPose.rot, tabScale)};
      Object.assign(nodes, tab.tickFrame(ease.inOutSine(tickP)));
      const gripW = rotPt(tabPose, tab.grip);
      let handB1;
      if (rel > 0) handB1 = mix(rotPt(att, tab.grip), G.restB1, ease.inOutCubic(rel));
      else if (carry > 0) handB1 = gripW;
      else handB1 = mix(G.restB1, rotPt(tabRest, tab.grip), ease.inOutCubic(reach));
      tabHeld = reach >= 1 && rel === 0;
      solvedB1 = armB1.pose(G.shoulderB1, handB1, G.bendB1);
      Object.assign(nodes, solvedB1.nodes);

      // --- pen (B2): the hand comes in from off-desk, picks the pen up where
      // it lies, carries it to the tick start, writes, puts it back, leaves.
      const pr = clamp(s.penReach ?? 0), ap = clamp(s.penApproach ?? 0), rt = clamp(s.penReturn ?? 0), wd = clamp(s.penWithdraw ?? 0);
      const tickWorld = p => rotPt(tabPose, tab.tickAt(p));
      const lifted = q => ({x: q.x - 6, y: q.y - 14});
      const restGrip = penGripFromTip(G.penRest);
      let tip = null;
      let handB2;
      if (wd > 0) handB2 = mix(restGrip, G.restB2, ease.inOutCubic(wd));
      else if (rt > 0) tip = mix(lifted(tickWorld(1)), G.penRest, ease.inOutCubic(rt));
      else if (tickP > 0) {
        tip = tickWorld(ease.inOutSine(tickP));
        if (tickP >= 1) tip = lifted(tip);
        else tickPoint = tip;
      } else if (ap > 0) tip = mix(G.penRest, lifted(tickWorld(0)), ease.inOutCubic(ap));
      else handB2 = mix(G.restB2, restGrip, ease.inOutCubic(pr));
      penHeld = Boolean(tip);
      solvedB2 = armB2.pose(G.shoulderB2, penHeld ? penGripFromTip(tip) : handB2, G.bendB2);
      Object.assign(nodes, solvedB2.nodes);
      penTip = penHeld
        ? {x: solvedB2.hand.x - penDir.x * penProp.grip, y: solvedB2.hand.y - penDir.y * penProp.grip}
        : {x: G.penRest.x, y: G.penRest.y};
      nodes[`${P}-pen`] = {transform: T(penTip.x, penTip.y, G.penAngle)};
      handB2Pt = solvedB2.hand;
    }

    if (ringed) {
      const rz = copies[o.ringIndex];
      nodes[`${P}-ring`] = {opacity: r(clamp(s.ring ?? 0), 3), transform: T(rz.x, rz.y, rz.rot, rz.s)};
    }

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const semantic = {
      holders,
      order: copies.map((_, k) => k).filter(k => holders[k] === 'chain'),
      carrying: carrying >= 0 ? o.versions[carrying].id : null,
      handA: P2(solvedA.hand),
      carryGrip: carrying >= 0 ? P2(rotPt(copies[carrying], gripLocal)) : null,
      tab: P2(tabPose),
      tabHeld,
      tabAttached,
      tabGrip: tabHeld && (s.tabCarry ?? 0) > 0 ? P2(rotPt(tabPose, tab.grip)) : null,
      handB1: solvedB1 ? P2(solvedB1.hand) : null,
      penTip: penTip ? P2(penTip) : null,
      penHeld,
      handB2: handB2Pt ? P2(handB2Pt) : null,
      penGrip: penHeld ? P2(penGripFromTip(penTip)) : null,
      tickPoint: tickPoint ? P2(tickPoint) : null,
      tickProgress: r(tickP, 3),
      reach: {A: solvedA.reached, B1: solvedB1 ? solvedB1.reached : true, B2: solvedB2 ? solvedB2.reached : true},
      allReached: solvedA.reached && (!solvedB1 || solvedB1.reached) && (!solvedB2 || solvedB2.reached),
    };
    copies.forEach((c, k) => { semantic[`copy${k + 1}`] = P2(c); });
    return {nodes, semantic};
  }

  /** Stage-space box of copy k at rest in the chain (full sheet). */
  const slotBox = k => {
    const s = slot(k);
    return {x: s.x - S.w / 2, y: s.y - S.h / 2, w: S.w, h: S.h};
  };
  /** Stage-space box of the visible header band of copy k in the chain. */
  const bandBox = k => {
    const b = slotBox(k);
    return {x: b.x, y: b.y, w: S.w, h: S.band};
  };

  /**
   * A static drawing of the filed chain (final state) at the same stage
   * coordinates — used as the real content of an inspect lens. Bodies of
   * covered copies are schematic (they are under paper anyway).
   * @param {string} prefix
   * @param {{index:number,date?:[string,string],id?:[string,string]}} [swap]
   */
  const chainCopyNode = (prefix, swap) => g(null, o.versions.map((v, k) => {
    const b = slotBox(k);
    const sp = versionSheet(ctx, {
      prefix: `${prefix}${k}`, w: S.w, h: S.h, band: S.band, version: v, index: k, doc: o.doc, lineSeed: `ver-${k}`,
      reserveRight: G.tab.overlap, rows: bandMode.rows, bodyText: k === N - 1,
      swap: swap && swap.index === k ? {date: swap.date, id: swap.id} : undefined,
    });
    return g({transform: T(b.x, b.y)}, sp.node);
  }));

  return {
    node, pose, chainCopyNode, bandMode,
    W, H, axis, N, S, G,
    sheets,
    slot, slotBox, bandBox, tabAttach,
    tab,
    folderBox: {x: G.folder.x, y: G.folder.y, w: G.folder.w, h: G.folder.h},
    chainBox: (() => {
      const a = slotBox(0), b = slotBox(N - 1);
      return {x: a.x, y: a.y, w: b.x + b.w - a.x, h: b.y + b.h - a.y};
    })(),
    /** right edge of a protruding tab on copy k */
    tabTip: k => ({x: tabAttach(k).x + G.tab.protrude, y: tabAttach(k).y}),
    pileBox: (() => {
      const ps = o.versions.map((_, k) => pilePose(k));
      const xs = ps.map(q => q.x), ys = ps.map(q => q.y);
      return {x: Math.min(...xs) - S.w * 0.62, y: Math.min(...ys) - S.h * 0.62, w: Math.max(...xs) - Math.min(...xs) + S.w * 1.24, h: Math.max(...ys) - Math.min(...ys) + S.h * 1.24};
    })(),
    chipA, chipB,
  };
}
