/**
 * Original vector props for the "Mediación entre partes" motif:
 *  - turnToken: a wooden talking token (disc) seen from the front-above, or
 *    from the top for plans;
 *  - agendaClipboard: a clipboard with an agenda whose rows carry a
 *    checkbox, a speaker marker and text (or abstract bars without labels);
 *  - speechBubble: bubble whose tail points at the speaker's mouth, with
 *    abstract speech lines drawn progressively (or short supplied text);
 *  - frontMediator: a front-facing seated figure for the person behind the
 *    table. Its body and its arms are separate layers so the tabletop can
 *    sit between them (torso behind the table, arms resting on it). Arms are
 *    two-bone IK chains ending in mitten hands; an optional pen is held by
 *    one hand and positioned from the SOLVED hand.
 * @module animations/roles/kits/mediation-props
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout, rotateAbout} from '../../../core/transform.js';
import {clamp, ease, r} from '../../../core/time.js';
import {rad, roundRectPath} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {hairShape} from '../../../primitives/badges.js';
import {pen as penProp, shade} from '../../../primitives/paper.js';

const INK = '#1f2328';
const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ token */

/**
 * Talking token seen from the front-above (flattened disc). Local origin =
 * centre of the top face. `flat` is the vertical squash of the top face.
 * @param {any} ctx
 * @param {{name:string, radius?:number, flat?:number, color?:string}} o
 */
export function turnToken(ctx, o) {
  const R = o.radius ?? 30;
  const f = o.flat ?? 0.45;
  const ry = R * f;
  const thick = R * 0.34;
  const c = o.color ?? ctx.theme.accent3;
  const side = shade(c, -0.28);
  return g({name: o.name},
    h('ellipse', {cx: 4, cy: thick + ry * 0.5, rx: R * 1.08, ry: ry * 1.15, fill: ctx.theme.shadow}),
    h('path', {d: `M${-R} 0V${r(thick)}A${R} ${r(ry)} 0 0 0 ${R} ${r(thick)}V0Z`, fill: side, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('ellipse', {cx: 0, cy: 0, rx: R, ry: r(ry), fill: c, stroke: INK, 'stroke-width': 2.4}),
    h('ellipse', {cx: 0, cy: 0, rx: R * 0.72, ry: r(ry * 0.72), fill: 'none', stroke: shade(c, -0.18), 'stroke-width': 2}),
    // engraved speech glyph (flattened with the face)
    g({transform: `scale(1 ${r(f, 3)})`},
      h('path', {d: bubbleGlyph(R * 0.42), fill: shade(c, -0.35)})),
  );
}

/**
 * Talking token seen from the top (for plans). Local origin = centre.
 * @param {any} ctx
 * @param {{name?:string, radius?:number, color?:string}} o
 */
export function tokenTop(ctx, o) {
  const R = o.radius ?? 26;
  const c = o.color ?? ctx.theme.accent3;
  return g({name: o.name},
    h('circle', {cx: 3, cy: 5, r: R + 2, fill: ctx.theme.shadow}),
    h('circle', {r: R, fill: c, stroke: INK, 'stroke-width': 2.6}),
    h('circle', {r: R * 0.72, fill: 'none', stroke: shade(c, -0.18), 'stroke-width': 2}),
    h('path', {d: bubbleGlyph(R * 0.46), fill: shade(c, -0.35)}),
  );
}

/** Small speech-bubble glyph centred on 0,0. */
function bubbleGlyph(s) {
  return `M${r(-s)} ${r(-s * 0.55)}Q${r(-s)} ${r(-s * 0.9)} ${r(-s * 0.6)} ${r(-s * 0.9)}H${r(s * 0.6)}Q${r(s)} ${r(-s * 0.9)} ${r(s)} ${r(-s * 0.55)}V${r(s * 0.25)}Q${r(s)} ${r(s * 0.6)} ${r(s * 0.6)} ${r(s * 0.6)}H${r(-s * 0.1)}L${r(-s * 0.55)} ${r(s * 1.05)}L${r(-s * 0.45)} ${r(s * 0.6)}H${r(-s * 0.6)}Q${r(-s)} ${r(s * 0.6)} ${r(-s)} ${r(s * 0.25)}Z`;
}

/* --------------------------------------------------------------- agenda */

/**
 * Agenda clipboard. Local origin = top-left of the sheet (unflattened).
 * Rows: checkbox · speaker marker (first two rows) · text or bars.
 * Named nodes: `${P}-hl${i}` (row highlight), `${P}-tick${i}` (tick stroke,
 * draw with ticks()), `${P}-mk${i}` (speaker marker groups; translate to swap),
 * `${P}-row${i}` (row text/bars group), and with `slots`: `${P}-slot${i}` (bar),
 * `${P}-slotv${i}-0|1` (before/after value texts).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, title:string, items:string[], markers:Array<{color:string, letter:string}>, showText:boolean, slots?:{texts?:string[][]}}} o
 *   slots: optional slot-length bars on the two turn rows (widths set per frame)
 */
export function agendaClipboard(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix: P} = o;
  const board = '#8a6848';
  const parts = [];
  parts.push(h('path', {d: roundRectPath(-w * 0.05 + 5, -hh * 0.07 + 8, w * 1.1, hh * 1.12, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(-w * 0.05, -hh * 0.07, w * 1.1, hh * 1.12, 10), fill: board, stroke: INK, 'stroke-width': 2.5}));
  parts.push(h('path', {d: `M3 3H${r(w - 3)}V${r(hh - 3)}H3Z`, fill: th.paper, stroke: INK, 'stroke-width': 2}));
  // metal clip
  parts.push(h('path', {d: roundRectPath(w * 0.34, -hh * 0.1, w * 0.32, hh * 0.13, 5), fill: '#b9c1c8', stroke: INK, 'stroke-width': 2}));
  parts.push(h('path', {d: roundRectPath(w * 0.42, -hh * 0.06, w * 0.16, hh * 0.05, 3), fill: '#8b959e'}));

  const pad = w * 0.07;
  const titleSize = hh * 0.12;
  if (o.showText && o.title) {
    // one line (bounded shrink); a long heading wraps to two smaller lines instead of being cut
    let f = ctx.fit(o.title, {maxWidth: w - pad * 2, size: titleSize, minSize: titleSize * 0.7, maxLines: 1, weight: 800});
    if (f.truncated) f = ctx.fit(o.title, {maxWidth: w - pad * 2, size: titleSize * 0.7, minSize: titleSize * 0.55, maxLines: 2, weight: 800});
    parts.push(textBlock(f, {x: pad, y: hh * 0.165 - f.height / 2, fill: th.ink, name: `${P}-title`, letterSpacing: 0.5}));
  } else {
    parts.push(h('rect', {x: pad, y: hh * 0.1, width: w * 0.42, height: titleSize * 0.7, rx: 3, fill: th.ink, opacity: 0.85}));
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: hh * 0.27, y2: hh * 0.27, stroke: th.paperLine, 'stroke-width': 2}));

  const n = o.items.length;
  const top = hh * 0.31;
  const rowH = (hh * 0.95 - top) / n;
  const box = Math.min(rowH * 0.56, w * 0.11);
  const rows = [];
  const hl = [];
  const ticks = [];
  const markers = [];
  const texts = [];
  const boxes = [];
  o.items.forEach((item, i) => {
    const y0 = top + i * rowH;
    const cy = y0 + rowH / 2;
    const bx = pad, by = cy - box / 2;
    hl.push(h('path', {name: `${P}-hl${i}`, d: roundRectPath(pad * 0.4, y0 + rowH * 0.06, w - pad * 0.8, rowH * 0.88, 5), fill: th.accent3Soft, stroke: th.accent3, 'stroke-width': 1.5, opacity: 0}));
    boxes.push(h('rect', {x: bx, y: by, width: box, height: box, rx: 3, fill: '#fff', stroke: INK, 'stroke-width': 2}));
    const tick = [{x: bx + box * 0.16, y: by + box * 0.5}, {x: bx + box * 0.42, y: by + box * 0.8}, {x: bx + box * 1.02, y: by - box * 0.08}];
    const tlen = Math.hypot(tick[1].x - tick[0].x, tick[1].y - tick[0].y) + Math.hypot(tick[2].x - tick[1].x, tick[2].y - tick[1].y);
    ticks.push(h('path', {name: `${P}-tick${i}`, d: `M${r(tick[0].x)} ${r(tick[0].y)}L${r(tick[1].x)} ${r(tick[1].y)}L${r(tick[2].x)} ${r(tick[2].y)}`, fill: 'none', stroke: '#1d3f8f', 'stroke-width': Math.max(2.5, box * 0.16), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(tlen)} ${r(tlen + 10)}`, 'stroke-dashoffset': r(tlen)}));
    let tx = bx + box + w * 0.04;
    const mr = box * 0.55;
    const rowX0 = tx - 6;
    if (i < 2) {
      markers.push({i, x: tx + mr, y: cy, r: mr});
      tx += mr * 2 + w * 0.035;
    }
    const tw = w - pad - tx;
    const slotLane = o.slots && i < 2 ? {x: tx, y: cy + rowH * 0.1, w: tw * 0.55, h: rowH * 0.26} : null;
    const textY = slotLane ? cy - rowH * 0.42 : cy - rowH * 0.22;
    const tSize = rowH * (slotLane ? 0.3 : 0.38);
    const rowParts = [];
    if (o.showText) {
      // one line when it fits (bounded shrink), else two lines centred on the row: never cut
      let f = ctx.fit(item, {maxWidth: tw, size: tSize, minSize: tSize * 0.8, maxLines: 1, weight: 600});
      if (f.truncated) f = ctx.fit(item, {maxWidth: tw, size: tSize * (slotLane ? 0.9 : 0.8), minSize: rowH * 0.16, maxLines: 2, weight: 600});
      const ty = slotLane ? textY + (tSize - f.size) / 2 : cy - f.height / 2 - f.size * 0.04;
      rowParts.push(textBlock(f, {x: tx, y: slotLane ? Math.min(ty, slotLane.y - f.height - 2) : ty, fill: th.ink}));
    } else {
      const lw = tw * (0.55 + ctx.rng(`${P}-bar`, i) * 0.4);
      rowParts.push(h('rect', {x: tx, y: slotLane ? textY + tSize * 0.2 : cy - rowH * 0.1, width: r(lw), height: r(rowH * 0.2), rx: rowH * 0.1, fill: th.paperLine}));
    }
    if (slotLane) {
      // slot-length bar (hypothetical durations) with before/after value texts
      rowParts.push(h('rect', {x: slotLane.x, y: slotLane.y, width: slotLane.w, height: slotLane.h, rx: slotLane.h / 2, fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 1.5}));
      rowParts.push(h('rect', {name: `${P}-slot${i}`, x: slotLane.x, y: slotLane.y, width: 0, height: slotLane.h, rx: slotLane.h / 2, fill: th.accent2, stroke: INK, 'stroke-width': 1.5}));
      if (o.showText && o.slots.texts && o.slots.texts[i]) {
        o.slots.texts[i].forEach((txt, k) => {
          const f = ctx.fit(txt, {maxWidth: tw * 0.4, size: rowH * 0.32, minSize: rowH * 0.2, maxLines: 1, weight: 700});
          rowParts.push(textBlock(f, {x: slotLane.x + slotLane.w + tw * 0.03, y: slotLane.y + slotLane.h / 2 - f.size * 0.55, fill: k ? th.accent2 : th.ink, name: `${P}-slotv${i}-${k}`, opacity: k ? 0 : 1}));
        });
      }
    }
    // the whole row content (marker, text, slot bar) moves as one named group,
    // e.g. to reorder turns; its card background shows only while lifted
    const card = {x: rowX0, y: y0 + rowH * 0.08, w: w - pad * 0.5 - rowX0, h: rowH * 0.84};
    const mkNode = i < 2 && o.markers[i] ? markerNode(o.markers[i], markers[markers.length - 1]) : null;
    texts.push(g({name: `${P}-row${i}`},
      g({name: `${P}-lift${i}`, opacity: 0},
        h('path', {d: roundRectPath(card.x + 4, card.y + 6, card.w, card.h, 6), fill: th.shadow}),
        h('path', {d: roundRectPath(card.x, card.y, card.w, card.h, 6), fill: th.paper, stroke: th.accent3, 'stroke-width': 1.5})),
      mkNode, rowParts));
    rows.push({i, y0, cy, rowH, box: {x: bx, y: by, s: box}, tick, tlen, textX: tx, textW: tw, slotLane, card});
  });
  // speaker marker disc (inside its row group)
  function markerNode(spec, m) {
    return g({name: `${P}-mk${m.i}`, transform: T(m.x, m.y)},
      h('circle', {r: r(m.r), fill: spec.color, stroke: INK, 'stroke-width': 2}),
      o.showText ? h('text', {x: 0, y: r(m.r * 0.42), 'text-anchor': 'middle', 'font-size': r(m.r * 1.15), 'font-weight': 800, 'font-family': FONT, fill: '#fff'}, spec.letter) : h('circle', {r: r(m.r * 0.34), fill: '#fff', opacity: 0.85}),
    );
  }
  const node = g({name: P}, parts, hl, boxes, ticks, texts);
  return {
    node, w, h: hh, rows, markers,
    /** frame props: tick progress per row, highlight per row */
    frame(tickP, hlP) {
      const out = {};
      rows.forEach((row, i) => {
        out[`${P}-tick${i}`] = {'stroke-dashoffset': r(row.tlen * (1 - clamp(tickP[i] || 0)))};
        out[`${P}-hl${i}`] = {opacity: r(clamp(hlP[i] || 0), 3)};
      });
      return out;
    },
    /** point on the tick stroke of row i at progress p (local coords) */
    tickAt(i, p) {
      const row = rows[i];
      const t = row.tick;
      const l1 = Math.hypot(t[1].x - t[0].x, t[1].y - t[0].y);
      const d = clamp(p) * row.tlen;
      if (d <= l1) {
        const k = d / l1;
        return {x: t[0].x + (t[1].x - t[0].x) * k, y: t[0].y + (t[1].y - t[0].y) * k};
      }
      const k = (d - l1) / (row.tlen - l1);
      return {x: t[1].x + (t[2].x - t[1].x) * k, y: t[1].y + (t[2].y - t[1].y) * k};
    },
  };
}

/* --------------------------------------------------------------- bubble */

/**
 * Speech bubble with its tail on the bottom (default) or top edge pointing at `tail`.
 * Named: `${name}` (open transform/opacity), `${name}-w${i}` (speech lines),
 * `${name}-txt` (supplied text).
 * @param {any} ctx
 * @param {{name:string, box:{x:number,y:number,w:number,h:number}, tail:{x:number,y:number}, tailSide?:'bottom'|'top', text?:string, showText:boolean, stroke?:string, fill?:string, lines?:number}} o
 */
export function speechBubble(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o.box;
  const rr = Math.min(34, hh * 0.3);
  const bw = Math.min(56, w * 0.18);
  const bx = clamp(o.tail.x, x + rr + bw / 2 + 4, x + w - rr - bw / 2 - 4);
  const tip = o.tail;
  const d = o.tailSide === 'top'
    ? `M${r(x + rr)} ${r(y)}H${r(bx - bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(bx + bw / 2)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`
    : `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(bx + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(bx - bw / 2)} ${r(y + hh)}H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  const stroke = o.stroke ?? th.ink;
  const fill = o.fill ?? th.card;
  const parts = [
    h('path', {d, fill: th.shadow, transform: T(6, 8)}),
    h('path', {d, fill, stroke, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
  ];
  const text = o.text && o.showText ? o.text : '';
  const lines = [];
  let txt = null;
  const padX = w * 0.12;
  if (text) {
    const f = ctx.fit(text, {maxWidth: w - padX * 2, size: Math.min(40, hh * 0.24), minSize: Math.min(40, hh * 0.24) * 0.66, maxLines: 3, weight: 600});
    txt = textBlock(f, {x: x + w / 2, y: y + (hh - f.height) / 2, anchor: 'middle', fill: th.ink, name: `${o.name}-txt`, opacity: 0});
  } else {
    const n = o.lines ?? 3;
    const lh = hh / (n + 1);
    for (let i = 0; i < n; i++) {
      const ly = y + lh * (i + 1);
      const len = (w - padX * 2) * (i === n - 1 ? 0.45 + ctx.rng(`${o.name}-l`, i) * 0.2 : 0.78 + ctx.rng(`${o.name}-l`, i) * 0.22);
      lines.push({x1: x + padX, x2: x + padX + len, y: ly, len});
    }
  }
  const lineW = Math.max(8, Math.min(16, hh * 0.075));
  const lineNodes = lines.map((l, i) => h('line', {name: `${o.name}-w${i}`, x1: r(l.x1), x2: r(l.x2), y1: r(l.y), y2: r(l.y), stroke: o.lineColor ?? th.inkSoft, 'stroke-width': r(lineW), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(l.len)} ${r(l.len + 30)}`, 'stroke-dashoffset': r(l.len), opacity: 0.8}));
  const node = g({name: o.name, opacity: 0}, parts, lineNodes, txt);
  return {
    node,
    box: o.box,
    tip,
    /**
     * @param {number} open 0..1 (grows from the tail tip)
     * @param {number} words 0..1 (speech lines drawn progressively)
     * @param {boolean} reduced
     */
    frame(open, words, reduced) {
      const out = {};
      const k = open <= 0 ? 0.3 : 0.3 + 0.7 * (reduced ? ease.outCubic(open) : ease.outBack(open));
      out[o.name] = {opacity: r(clamp(open * 3), 3), transform: scaleAbout(tip.x, tip.y, k)};
      const n = lines.length;
      lines.forEach((l, i) => {
        const p = clamp(words * n - i);
        out[`${o.name}-w${i}`] = {'stroke-dashoffset': r(l.len * (1 - p))};
      });
      if (txt) out[`${o.name}-txt`] = {opacity: r(clamp(words * 4), 3)};
      return out;
    },
  };
}

/* ------------------------------------------------------- front mediator */

const UP = 100;
const LO = 98;
const HAND = 17;
const SHOULDER = {l: {x: -60, y: 14}, r: {x: 60, y: 14}};
const HEAD = {x: 0, y: -92, r: 44};
const PEN_LEN = 92;

/**
 * Front-facing seated person behind a table. Local origin = centre of the
 * shoulder line; the torso extends downward (the table covers its lower part).
 * `body` must be drawn before the tabletop, `arms` after it.
 * @param {any} ctx
 * @param {{name:string, look:{skin:string,hair:string,hairColor:string,outfit:string,glasses?:boolean}, penSide?:'l'|'r'|null}} o
 */
export function frontMediator(ctx, o) {
  const N = o.name;
  const L = o.look;
  const skinShade = shade(L.skin, -0.12);
  const jacket = L.outfit;
  const hair = hairShape(L.hair, HEAD.r, HEAD.y, L.hairColor);
  const chairC = '#5d4c40';
  const chair = g(null,
    h('path', {d: roundRectPath(-104, -150, 208, 420, 34), fill: chairC, stroke: INK, 'stroke-width': 2.8}),
    h('path', {d: roundRectPath(-86, -132, 172, 380, 26), fill: shade(chairC, 0.12)}),
  );
  const torso = g(null,
    h('path', {d: 'M-86 44C-88 10 -72 -6 -44 -10L-16 -14H16L44 -10C72 -6 88 10 86 44L82 300H-82Z', fill: jacket, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-17 -14L0 34L17 -14Z', fill: '#f4f1ea', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-17 -14L-34 -6L-8 70L0 34Z', fill: shade(jacket, -0.14), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M17 -14L34 -6L8 70L0 34Z', fill: shade(jacket, -0.14), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-52 26q10 40 6 110M52 26q-10 40 -6 110', fill: 'none', stroke: shade(jacket, -0.25), 'stroke-width': 2}),
  );
  const neck = h('rect', {x: -14, y: -50, width: 28, height: 42, rx: 7, fill: skinShade, stroke: INK, 'stroke-width': 2.2});
  const eyeY = HEAD.y - 2;
  // back hair sits behind the torso (long hair falls behind the shoulders) and turns with the head
  const hairBack = g({name: `${N}-hairback`}, hair.back);
  const head = g({name: `${N}-head`},
    h('ellipse', {cx: -43, cy: HEAD.y + 4, rx: 8, ry: 11, fill: skinShade, stroke: INK, 'stroke-width': 2.2}),
    h('ellipse', {cx: 43, cy: HEAD.y + 4, rx: 8, ry: 11, fill: skinShade, stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: HEAD.x, cy: HEAD.y, r: HEAD.r, fill: L.skin, stroke: INK, 'stroke-width': 2.8}),
    g({name: `${N}-eyes`},
      h('ellipse', {cx: -15, cy: eyeY, rx: 4.2, ry: 5.4, fill: INK}),
      h('ellipse', {cx: 15, cy: eyeY, rx: 4.2, ry: 5.4, fill: INK})),
    h('path', {d: `M-23 ${eyeY - 13}q8 -5 15 -1M8 ${eyeY - 14}q8 -4 15 1`, fill: 'none', stroke: shade(L.hairColor, -0.1), 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('path', {d: `M1 ${HEAD.y + 2}q5 10 -3 12`, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    h('path', {name: `${N}-mouth`, d: frontMouth(0), fill: '#7a2f2a', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    L.glasses ? g(null,
      h('circle', {cx: -15, cy: eyeY, r: 11, fill: 'none', stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: 15, cy: eyeY, r: 11, fill: 'none', stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: `M-4 ${eyeY}h8`, stroke: INK, 'stroke-width': 2.2})) : null,
    hair.front,
  );
  const body = g({name: `${N}-body`}, chair, hairBack, torso, neck, head);

  const penSide = o.penSide ?? null;
  const penNode = penSide ? penProp(ctx, {name: `${N}-pen`, length: PEN_LEN, body: ctx.theme.accent2}) : null;
  const penAngle = penSide === 'l' ? -122 : -58;
  const penDir = {x: Math.cos(rad(penAngle)), y: Math.sin(rad(penAngle))};
  const penGrip = penNode ? penNode.grip : 0;

  const arm = s => g({name: `${N}-${s}`},
    h('line', {name: `${N}-${s}-uo`, stroke: INK, 'stroke-width': 31, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-lo`, stroke: INK, 'stroke-width': 28, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-u`, stroke: jacket, 'stroke-width': 25.5, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-l`, stroke: jacket, 'stroke-width': 22.5, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-cuff`, stroke: '#f4f1ea', 'stroke-width': 19, 'stroke-linecap': 'butt'}),
    penSide === s ? penNode.node : null,
    g({name: `${N}-${s}-hand`},
      g({name: `${N}-${s}-mitt`},
        h('path', {d: 'M-6 -15C11 -19 27 -14 30 -2C31 11 16 18 0 15C-8 14 -11 -11 -6 -15Z', fill: L.skin, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
        h('path', {d: s === 'l' ? 'M8 13C16 24 27 23 27 16' : 'M8 -13C16 -24 27 -23 27 -16', fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
        h('path', {d: 'M19 -8q4 3 4 7M19 3q4 3 3 7', fill: 'none', stroke: shade(L.skin, -0.3), 'stroke-width': 1.8, 'stroke-linecap': 'round'})),
      // open palm (fingers extended along the forearm), shown for gestures
      g({name: `${N}-${s}-palm`, opacity: 0}, openPalm(L.skin, s === 'l' ? 1 : -1))),
  );
  const arms = g({name: `${N}-arms`}, arm('l'), arm('r'));

  /**
   * @param {{x:number, y:number, scale:number, left:{x:number,y:number}, right:{x:number,y:number}, look?:number, tilt?:number, mouth?:number, penTip?:{x:number,y:number}|null, open?:{l?:number,r?:number}}} s
   *   left/right: WORLD hand targets (fingertip point). penTip: when given the
   *   pen hand is placed so the pen nib sits on penTip.
   */
  function frame(s) {
    const k = s.scale;
    const nodes = {};
    const tr = T(s.x, s.y, 0, k);
    nodes[`${N}-body`] = {transform: tr};
    nodes[`${N}-arms`] = {transform: tr};
    nodes[`${N}-head`] = {transform: s.tilt ? rotateAbout(0, -48, s.tilt) : ''};
    nodes[`${N}-hairback`] = {transform: s.tilt ? rotateAbout(0, -48, s.tilt) : ''};
    nodes[`${N}-eyes`] = {transform: T((s.look ?? 0) * 6, 0)};
    nodes[`${N}-mouth`] = {d: frontMouth(s.mouth ?? 0)};
    const toLocal = p => ({x: (p.x - s.x) / k, y: (p.y - s.y) / k});
    const toWorld = p => ({x: s.x + p.x * k, y: s.y + p.y * k});
    const hands = {};
    const elbows = {};
    let reached = true;
    let pen = null;
    for (const side of ['l', 'r']) {
      const sh = SHOULDER[side];
      let target = toLocal(side === 'l' ? s.left : s.right);
      const usePen = penSide === side && s.penTip;
      if (usePen) {
        const tip = toLocal(s.penTip);
        target = {x: tip.x + penDir.x * penGrip, y: tip.y + penDir.y * penGrip};
      }
      const sol = frontArm(sh, target, side === 'l' ? -1 : 1);
      if (!sol.reached) reached = false;
      const a = sol.forearmAngle;
      const wrist = {x: sol.hand.x - Math.cos(a) * HAND * 0.6, y: sol.hand.y - Math.sin(a) * HAND * 0.6};
      const cuffA = {x: wrist.x - Math.cos(a) * 16, y: wrist.y - Math.sin(a) * 16};
      const cuffB = {x: wrist.x - Math.cos(a) * 5, y: wrist.y - Math.sin(a) * 5};
      const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
      nodes[`${N}-${side}-uo`] = line(sh, sol.elbow);
      nodes[`${N}-${side}-u`] = line(sh, sol.elbow);
      nodes[`${N}-${side}-lo`] = line(sol.elbow, wrist);
      nodes[`${N}-${side}-l`] = line(sol.elbow, wrist);
      nodes[`${N}-${side}-cuff`] = line(cuffA, cuffB);
      nodes[`${N}-${side}-hand`] = {transform: T(wrist.x, wrist.y, (a * 180) / Math.PI)};
      const open = (s.open && s.open[side]) || 0;
      nodes[`${N}-${side}-mitt`] = {opacity: open >= 0.5 ? 0 : 1};
      nodes[`${N}-${side}-palm`] = {opacity: open >= 0.5 ? 1 : 0};
      hands[side] = toWorld(sol.hand);
      elbows[side] = toWorld(sol.elbow);
      if (penSide === side) {
        // nib from the solved hand: the pen never leaves the hand
        const tipL = {x: sol.hand.x - penDir.x * penGrip, y: sol.hand.y - penDir.y * penGrip};
        nodes[`${N}-pen`] = {transform: T(tipL.x, tipL.y, penAngle)};
        pen = toWorld(tipL);
      }
    }
    return {nodes, hands, elbows, pen, reached, head: toWorld(HEAD)};
  }

  /** world offset from pen nib to the pen-hand target, at scale k */
  const penOffset = k => ({x: penDir.x * penGrip * k, y: penDir.y * penGrip * k});
  return {body, arms, frame, penOffset, reach: UP + LO + HAND * 0.6, shoulders: SHOULDER, head: HEAD};
}

const smooth = t => t * t * (3 - 2 * t);

/** Comfortable 3D shoulder–hand distance (fraction of the reach) used to give the hand its depth. */
const ARM_DEPTH = 0.86;

/**
 * Front-view two-bone arm solved in pseudo-3D so the elbow can never flip.
 * The 2D target gets a depth (towards the viewer) so the 3D shoulder–hand
 * distance stays comfortable; the elbow lies on the circle of valid 3D
 * elbows and is chosen by a pole vector that blends continuously with the
 * hand height: outward (elbows out) for hands on the table, downward
 * (elbow under the hand) for raised hands. The pole always points slightly
 * backwards while the hand is in front of the body, so it is never parallel
 * to the arm axis and the solution is continuous for any hand path. The
 * projected bones foreshorten instead of stretching.
 * @param {{x:number,y:number}} sh  shoulder (local)
 * @param {{x:number,y:number}} target  hand target (local)
 * @param {-1|1} out  outward x direction of this arm
 */
function frontArm(sh, target, out) {
  const lower = LO + HAND * 0.6;
  const reach = UP + lower;
  const dx = target.x - sh.x, dy = target.y - sh.y;
  const d2 = Math.hypot(dx, dy);
  const dist = Math.min(d2, reach - 0.01);
  const hand = d2 > 1e-6 ? {x: sh.x + (dx / d2) * dist, y: sh.y + (dy / d2) * dist} : {x: sh.x, y: sh.y};
  const Dc = ARM_DEPTH * reach;
  const hz = dist < Dc ? Math.sqrt(Dc * Dc - dist * dist) : 0;
  const D = Math.max(dist, Dc);
  const ax = [(hand.x - sh.x) / D, (hand.y - sh.y) / D, hz / D];
  const a = (UP * UP - lower * lower + D * D) / (2 * D);
  const rho = Math.sqrt(Math.max(0, UP * UP - a * a));
  // 0 = hand on the table, 1 = hand raised to shoulder height or above
  const w = smooth(clamp((150 - target.y) / 120));
  const pole = [out * (1 - 0.65 * w), 0.3 + 0.7 * w, -0.15 - 0.15 * w];
  const pd = pole[0] * ax[0] + pole[1] * ax[1] + pole[2] * ax[2];
  const pp = [pole[0] - pd * ax[0], pole[1] - pd * ax[1], pole[2] - pd * ax[2]];
  const pl = Math.hypot(pp[0], pp[1], pp[2]) || 1;
  const elbow = {x: sh.x + ax[0] * a + (pp[0] / pl) * rho, y: sh.y + ax[1] * a + (pp[1] / pl) * rho};
  return {elbow, hand, reached: d2 <= reach - 0.01 + 0.02, forearmAngle: Math.atan2(hand.y - elbow.y, hand.x - elbow.x)};
}

/** Open palm in hand-local coords (+x along the forearm); `side` flips the thumb. */
function openPalm(skin, side) {
  const t = side;
  return g(null,
    h('path', {d: `M-4 -14C6 -17 16 -16 20 -12L40 -13C45 -13 45 -7 40 -7L24 -6L44 -4C49 -4 49 2 44 2L24 3L41 7C46 8 45 14 40 13L22 11C18 16 6 17 -2 15C-9 12 -10 -10 -4 -14Z`, fill: skin, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round'}),
    h('path', {d: `M6 ${-15 * t}C10 ${-27 * t} 22 ${-31 * t} 26 ${-25 * t}C28 ${-21 * t} 20 ${-17 * t} 16 ${-13 * t}`, fill: skin, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round'}),
  );
}

/** Front-view mouth: closed smile at 0, open up to 1. */
function frontMouth(open) {
  const o = clamp(open);
  const y = HEAD.y + 22;
  if (o < 0.04) return `M-12 ${y}q12 7 24 0q-12 3 -24 0Z`;
  return `M-12 ${r(y - 1)}q12 ${r(-2 * o)} 24 0q-12 ${r(5 + 12 * o)} -24 0Z`;
}
