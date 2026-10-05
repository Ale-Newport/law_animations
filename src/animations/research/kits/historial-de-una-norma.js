/**
 * Reading-station stage for the "Historial de una norma" motif
 * (LAW-0049..0052). Frontal view of a library reading station:
 *
 *   bookshelf (anchor) · catalogue kiosk (search box) · lectern holding the
 *   consolidated file whose sheets are the TEMPORAL LAYERS (one per version,
 *   oldest at the back/top, newest at the front/bottom) · a vertical date
 *   rail beside the layers · the research card (ficha) that carries the
 *   selected date · the researcher's two arms entering from the frame edge.
 *
 * Choreography primitives (all values in [0,1]; each entry owns its timeline):
 *   right hand types the query → the kiosk locates the volume on the shelf →
 *   left hand pulls the volume (spine view), turns it face-on while bringing
 *   it forward and hangs it on the lectern → left hand pulls the front sheet
 *   down so the layers fan out along the rail → right hand takes the research
 *   card, clips it onto the rail and slides it to the selected date → the
 *   layer marked for that date is outlined; later layers turn into ghosts.
 *
 * Attachment rules (asserted by tests through `semantic`):
 *  - the volume follows the SOLVED left hand while held (grip on the spine,
 *    which becomes the face's left edge after the turn);
 *  - while fanning, the left hand coincides with the front sheet's corner;
 *  - the card follows the SOLVED right hand from pick-up to release;
 *  - every IK target is inside arm reach (`allReached`).
 * The kit owns geometry and a pose solver only; entries own the timelines.
 * @module animations/research/kits/historial-de-una-norma
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, cubic, roundRectPath} from '../../../core/geometry.js';
import {topArm} from '../../../primitives/desk.js';
import {chip, textBlock, callout} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {actorLook} from '../../../primitives/people-style.js';

export const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Canonical stage sizes (design units) by axis. The square station has the
 * proportions of a 1:1 frame's caption-safe box (≈1.29:1) so the lectern is
 * shown at the same scale as in 16:9 (key labels ≥ ~19 px at 1080 px).
 */
export const STATION = {horizontal: {w: 1600, h: 900}, square: {w: 1110, h: 900}, vertical: {w: 900, h: 1400},
  // compact panels for the paired comparison: the lectern and its labels fill each panel, so two complete
  // stations still show key labels near the single-station size (row 16:9, row 1:1, stacked 9:16)
  panelRow: {w: 960, h: 720}, panelSq: {w: 640, h: 856}, panelCol: {w: 1040, h: 660}};

/**
 * Geometry per axis. Shoulders sit outside the window (arms enter from the
 * frame edge); every reach target was checked with the solver (allReached).
 */
const GEO = {
  horizontal: {
    ledgeY: 764,
    shelf: {x: 22, y: 30, w: 430, rows: 4, slotRow: 2},
    // the kiosk stands a little lower so the wall above it is free for notes next to the top layers
    kiosk: {x: 1290, y: 136, w: 288, h: 410, stand: true},
    face: {x: 530, y: 96}, sheetW: 380, shMax: 470,
    card: {w: 246, h: 150},
    keyboard: {x: 1316, w: 250},
    shoulderL: {x: 300, y: 1030}, shoulderR: {x: 1440, y: 1010},
    restL: {x: 360, y: 858}, restR: {x: 1400, y: 862},
    bendL: 1, bendR: -1,
    arm: {upper: 420, lower: 400, width: 56, handScale: 1.3},
    chip: {x: 800, maxWidth: 800},
  },
  // kiosk over shelf in a narrow left column, lectern + rail + card beside it
  square: {
    ledgeY: 764,
    shelf: {x: 16, y: 398, w: 284, rows: 3, slotRow: 1},
    kiosk: {x: 16, y: 24, w: 284, h: 350, stand: false},
    face: {x: 344, y: 96}, sheetW: 380, shMax: 470,
    card: {w: 222, h: 150}, cardRestDX: 36,
    keyboard: {x: 580, w: 250},
    shoulderL: {x: -170, y: 860}, shoulderR: {x: 1250, y: 940},
    restL: {x: 120, y: 858}, restR: {x: 995, y: 862},
    bendL: -1, bendR: 1,
    arm: {upper: 420, lower: 400, width: 56, handScale: 1.3},
    chip: {x: 560, maxWidth: 540},
  },
  vertical: {
    ledgeY: 1270,
    shelf: {x: 20, y: 26, w: 390, h: 520, rows: 3, slotRow: 2},
    kiosk: {x: 434, y: 34, w: 446, h: 380, stand: false, wide: true},
    face: {x: 34, y: 596}, sheetW: 400, shMax: 460,
    card: {w: 250, h: 150},
    keyboard: {x: 560, w: 280},
    shoulderL: {x: -190, y: 1100}, shoulderR: {x: 1110, y: 1160},
    restL: {x: 90, y: 1360}, restR: {x: 800, y: 1350},
    bendL: -1, bendR: 1,
    arm: {upper: 420, lower: 400, width: 56, handScale: 1.3},
    chip: {x: 450, maxWidth: 500},
  },
  // compact panels used by the paired comparison (no left arm, volume already hung)
  panelRow: {
    ledgeY: 646,
    shelf: {x: 704, y: 430, w: 236, h: 216, rows: 2, slotRow: -1},
    kiosk: {x: 700, y: 22, w: 244, h: 384, stand: false},
    face: {x: 30, y: 76}, sheetW: 300, shMax: 420,
    card: {w: 222, h: 150}, cardRestDX: 26,
    keyboard: {x: 720, w: 204},
    shoulderL: {x: -200, y: 600}, shoulderR: {x: 1160, y: 560},
    restL: {x: 60, y: 700}, restR: {x: 900, y: 704},
    bendL: -1, bendR: 1,
    arm: {upper: 420, lower: 400, width: 56, handScale: 1.3},
    chip: {x: 480, maxWidth: 560},
  },
  panelSq: {
    ledgeY: 796,
    shelf: {x: 14, y: 18, w: 176, h: 206, rows: 2, slotRow: -1},
    kiosk: {x: 204, y: 18, w: 422, h: 206, stand: false, wide: true, results: false},
    face: {x: 18, y: 272}, sheetW: 280, shMax: 420,
    card: {w: 196, h: 150}, cardRestDX: 12,
    keyboard: {x: 214, w: 200},
    shoulderL: {x: -200, y: 700}, shoulderR: {x: 820, y: 660},
    restL: {x: 60, y: 820}, restR: {x: 600, y: 812},
    bendL: -1, bendR: 1,
    arm: {upper: 420, lower: 400, width: 56, handScale: 1.3},
    chip: {x: 320, maxWidth: 420},
  },
  panelCol: {
    ledgeY: 592,
    shelf: {x: 792, y: 376, w: 228, h: 216, rows: 2, slotRow: -1},
    kiosk: {x: 786, y: 22, w: 240, h: 334, stand: false},
    face: {x: 36, y: 66}, sheetW: 340, shMax: 420,
    card: {w: 234, h: 150}, cardRestDX: 30,
    keyboard: {x: 800, w: 206},
    shoulderL: {x: -200, y: 560}, shoulderR: {x: 1250, y: 520},
    restL: {x: 60, y: 650}, restR: {x: 960, y: 650},
    bendL: -1, bendR: 1,
    arm: {upper: 420, lower: 400, width: 56, handScale: 1.3},
    chip: {x: 520, maxWidth: 600},
  },
};

const BOOK_COLORS = ['#7a3b3b', '#2f5d62', '#b08a3e', '#4a5a7a', '#8c6d5a', '#3f6b4a', '#a0522d', '#5b4a6e', '#c9b99a', '#6d7f8c', '#8f3f55', '#51616b'];
const VOLUME_COLOR = '#284a6b';
const WALL = '#ece5d6';

/** Colour of version layer i (consistent across the four entries). */
export function versionColor(ctx, i) {
  const th = ctx.theme;
  return [th.accent4, th.accent2, th.accent3, shade(th.accent2, -0.4)][i % 4];
}

/* ------------------------------------------------------------------------ */
/* Art pieces                                                               */
/* ------------------------------------------------------------------------ */

function bookSpine(ctx, x, y, w, hh, color, k) {
  const th = ctx.theme;
  const band = shade(color, 0.28);
  const parts = [
    h('rect', {x, y, width: w, height: hh, rx: 3, fill: color, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: x + 2, y: y + hh * 0.08, width: w - 4, height: 4, fill: band}),
    h('rect', {x: x + 2, y: y + hh * 0.86, width: w - 4, height: 4, fill: band}),
  ];
  if (k > 0.45) parts.push(h('rect', {x: x + w * 0.2, y: y + hh * 0.3, width: w * 0.6, height: hh * 0.16, rx: 2, fill: '#f3ead6', opacity: 0.9}));
  else parts.push(h('rect', {x: x + w * 0.35, y: y + hh * 0.28, width: w * 0.3, height: hh * 0.36, rx: 2, fill: shade(color, -0.25)}));
  return g(null, parts);
}

/**
 * Front-view bookshelf with a reserved slot for the target volume.
 * @returns {{node:any, slot:{x:number,y:number,w:number,h:number}, glowName:string}}
 */
export function bookshelf(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w, h: hh} = o;
  const signFit = o.sign && ctx.show('all') ? ctx.fit(o.sign, {maxWidth: w - 70, size: 24, minSize: 16, maxLines: w < 320 ? 3 : 2, weight: 700}) : null;
  const crown = signFit ? Math.max(50, signFit.height + 30) : (o.sign ? 50 : 28);
  const side = 16, board = 16;
  const innerX = x + side, innerW = w - side * 2;
  const top = y + crown;
  const rowH = (hh - crown - board) / o.rows;
  const parts = [
    h('path', {d: roundRectPath(x + 9, y + 12, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: innerX, y: top, width: innerW, height: hh - crown - board, fill: '#4f3a2b'}),
    h('rect', {x: innerX, y: top, width: innerW, height: 10, fill: '#000', opacity: 0.18}),
  ];
  let slot = null;
  const slotW = o.slotW;
  for (let row = 0; row < o.rows; row++) {
    const by = top + (row + 1) * rowH;
    const books = [];
    const isSlot = row === o.slotRow;
    const endX = innerX + innerW - 6;
    const stop = isSlot ? endX - slotW - 70 : endX;
    let bx = innerX + 6;
    for (let i = 0; i < 40; i++) {
      const k = row * 40 + i;
      const bw = 22 + Math.floor(ctx.rng(`${P}-bw`, k) * 22);
      if (bx + bw > stop) break;
      const bh = (rowH - 10) * (0.64 + ctx.rng(`${P}-bh`, k) * 0.3);
      const col = BOOK_COLORS[Math.floor(ctx.rng(`${P}-bc`, k) * BOOK_COLORS.length)];
      books.push(bookSpine(ctx, bx, by - bh, bw, bh, col, ctx.rng(`${P}-bs`, k)));
      bx += bw + 2;
    }
    if (isSlot) {
      const sh = Math.min(o.slotH, rowH - 14);
      const sx = endX - slotW - 44;
      slot = {x: sx, y: by - sh, w: slotW, h: sh};
      // the gap left behind when the volume leaves (always drawn under it)
      parts.push(h('rect', {x: sx - 1, y: by - sh - 2, width: slotW + 2, height: sh + 2, fill: '#2e2119'}));
      books.push(bookSpine(ctx, sx + slotW + 6, by - (rowH - 10) * 0.78, endX - (sx + slotW + 6), (rowH - 10) * 0.78, BOOK_COLORS[3], 0.2));
      // leaning book between the run and the slot
      const lw = 24, lh = (rowH - 10) * 0.7;
      books.push(g({transform: `rotate(-14 ${r(sx - 8)} ${r(by)})`}, bookSpine(ctx, sx - 8 - lw, by - lh, lw, lh, BOOK_COLORS[6], 0.6)));
    } else if (stop - bx > 60) {
      // a small horizontal stack fills the end of the row
      const sw = Math.min(stop - bx - 12, innerW * 0.34);
      for (let j = 0; j < 3; j++) {
        const col = BOOK_COLORS[(row * 3 + j + 2) % BOOK_COLORS.length];
        books.push(h('rect', {x: bx + 8 + j * 4, y: by - 18 * (j + 1), width: sw - j * 10, height: 16, rx: 3, fill: col, stroke: th.ink, 'stroke-width': 2}));
      }
    }
    parts.push(g(null, books));
    parts.push(h('rect', {x: innerX - 3, y: by, width: innerW + 6, height: board, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('rect', {x: innerX - 1, y: by + board - 5, width: innerW + 2, height: 4, fill: th.woodDark, opacity: 0.55}));
  }
  // crown with an optional section sign (first source)
  parts.push(h('path', {d: roundRectPath(x - 6, y - 4, w + 12, crown - 4, 6), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}));
  if (signFit) {
    const f = signFit;
    const pw = f.width + 34;
    parts.push(h('path', {d: roundRectPath(x + w / 2 - pw / 2, y + 5, pw, crown - 22, 5), fill: '#efe2c4', stroke: th.ink, 'stroke-width': 2}));
    parts.push(textBlock(f, {x: x + w / 2, y: y + 5 + (crown - 22 - f.height) / 2 - 1, anchor: 'middle', fill: th.ink}));
  }
  const glowName = `${P}-glow`;
  const glow = slot ? g({name: glowName, opacity: 0},
    h('path', {d: roundRectPath(slot.x - 12, slot.y - 12, slot.w + 24, slot.h + 20, 10), fill: 'none', stroke: th.highlight, 'stroke-width': 12, opacity: 0.7}),
    h('path', {d: roundRectPath(slot.x - 12, slot.y - 12, slot.w + 24, slot.h + 20, 10), fill: 'none', stroke: th.accent3, 'stroke-width': 4}),
  ) : null;
  return {node: g({name: P}, parts), glow, slot, glowName, box: {x, y, w, h: hh}};
}

/** Search-field magnifier glyph centred at (x,y). */
function magnifier(x, y, s, color) {
  return g(null,
    h('circle', {cx: x - s * 0.12, cy: y - s * 0.12, r: s * 0.32, fill: 'none', stroke: color, 'stroke-width': s * 0.12}),
    h('line', {x1: x + s * 0.12, y1: y + s * 0.12, x2: x + s * 0.4, y2: y + s * 0.4, stroke: color, 'stroke-width': s * 0.14, 'stroke-linecap': 'round'}));
}

function calendarGlyph(x, y, s, color) {
  return g(null,
    h('rect', {x: x - s / 2, y: y - s * 0.42, width: s, height: s * 0.86, rx: 3, fill: '#fff', stroke: color, 'stroke-width': 2.4}),
    h('rect', {x: x - s / 2, y: y - s * 0.42, width: s, height: s * 0.24, fill: color}),
    h('path', {d: `M${r(x - s * 0.25)} ${r(y + 0.06 * s)}h${r(s * 0.12)}M${r(x + 0.02 * s)} ${r(y + 0.06 * s)}h${r(s * 0.12)}M${r(x - s * 0.25)} ${r(y + 0.26 * s)}h${r(s * 0.12)}`, stroke: color, 'stroke-width': 2.4}));
}

/**
 * Catalogue kiosk (the search box). Text is revealed by clip rectangles so the
 * typing is deterministic; with labels hidden, bars are revealed instead. The
 * screen content scales down (bounded) until it fits the screen height.
 */
export function kiosk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w, h: hh} = o;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const bez = 14;
  const sx = x + bez, sy = y + bez, sw = w - bez * 2;
  const inner = sw - 24;
  const withResults = o.results !== false;
  const screenBottom = sy + hh - bez * 2 - 8;
  // --- measure at decreasing scales until the content fits the screen
  let M = null;
  for (const k of [1, 0.92, 0.84, 0.76, 0.7]) {
    const hFit = showAll && o.header ? ctx.fit(o.header, {maxWidth: sw - 64, size: 21 * k, minSize: 14, maxLines: 2, weight: 700}) : null;
    const headH = Math.max((o.wide ? 46 : 48) * Math.max(k, 0.85), hFit ? hFit.height + 20 : 0);
    const qFit = ctx.fit(o.query || ' ', {maxWidth: inner - 40, size: (o.wide ? 26 : 24) * k, minSize: 15, maxLines: 5, weight: 600});
    const fieldH = Math.max(50 * k, qFit.height + 20);
    const dSize = (o.wide ? 26 : 24) * k;
    // the typed date is a key datum: one line at a readable size, otherwise two lines (never an ellipsis)
    const dateFit = txt => {
      const one = ctx.fit(txt, {maxWidth: inner - 60, size: dSize, minSize: Math.min(dSize, 17), maxLines: 1, weight: 700});
      return one.truncated ? ctx.fit(txt, {maxWidth: inner - 60, size: Math.min(dSize, 22), minSize: 15, maxLines: 2, weight: 700}) : one;
    };
    const dFit = dateFit(o.date || ' ');
    const dFit2 = o.dateAfter !== undefined ? dateFit(o.dateAfter) : null;
    const dH = Math.max(42, 50 * k, dFit.height + 18, dFit2 ? dFit2.height + 18 : 0);
    const cFit = withResults && showAll && o.citation ? ctx.fit(o.citation, {maxWidth: sw - 20 - 64, size: 19 * k, minSize: 13, maxLines: 3, weight: 600}) : null;
    const rowH = withResults ? Math.max((o.wide ? 80 : 96) * k, cFit ? cFit.height + 50 : 0) : 0;
    const gap = 12 * k + 2;
    const total = headH + gap + fieldH + gap + dH + (withResults ? gap + rowH : 0);
    M = {k, hFit, headH, qFit, fieldH, dFit, dFit2, dH, cFit, rowH, gap, total};
    if (sy + total <= screenBottom) break;
  }
  const parts = [];
  if (o.stand) {
    const cx = x + w / 2;
    parts.push(h('rect', {x: cx - 16, y: y + hh - 6, width: 32, height: o.standTo - (y + hh) + 6, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('path', {d: `M${r(cx - 70)} ${r(o.standTo)}Q${r(cx - 70)} ${r(o.standTo - 16)} ${r(cx - 40)} ${r(o.standTo - 16)}H${r(cx + 40)}Q${r(cx + 70)} ${r(o.standTo - 16)} ${r(cx + 70)} ${r(o.standTo)}Z`, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
  } else {
    // wall mount
    parts.push(h('rect', {x: x + w / 2 - 40, y: y + hh - 4, width: 80, height: 14, rx: 4, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
  }
  parts.push(h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 20), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, hh, 20), fill: '#2b3138', stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('path', {d: roundRectPath(sx, sy, sw, hh - bez * 2, 10), fill: '#f5f8fb'}));
  // header bar
  const {hFit, headH, qFit, fieldH, dFit, dFit2, dH, cFit, rowH, gap} = M;
  parts.push(h('path', {d: `M${sx} ${sy + 10}Q${sx} ${sy} ${sx + 10} ${sy}H${sx + sw - 10}Q${sx + sw} ${sy} ${sx + sw} ${sy + 10}V${r(sy + headH)}H${sx}Z`, fill: th.accent2}));
  parts.push(magnifier(sx + 26, sy + headH / 2, 26, '#fff'));
  if (hFit) parts.push(textBlock(hFit, {x: sx + 48, y: sy + (headH - hFit.height) / 2 - 1, fill: '#fff'}));
  // search field (query): one text block, revealed line by line through a multi-rect clip
  let cy = sy + headH + gap;
  const field = {x: sx + 10, y: cy, w: sw - 20, h: fieldH};
  parts.push(h('path', {d: roundRectPath(field.x, field.y, field.w, field.h, 12), fill: '#fff', stroke: th.accent2, 'stroke-width': 3}));
  parts.push(magnifier(field.x + 22, field.y + field.h / 2, 22, th.inkSoft));
  const qx = field.x + 42, qy = field.y + (field.h - qFit.height) / 2;
  const qLines = qFit.lines.map((line, i) => ({x: qx, y: qy + i * qFit.lineHeight, w: showKey ? ctx.measure(line, qFit.size, qFit.weight, 'sans') : Math.min(inner - 50, 90 + i * 40)}));
  parts.push(h('defs', null, h('clipPath', {id: ctx.id(`${P}-qc`)},
    qLines.map((L, i) => h('rect', {name: `${P}-qr${i}`, x: L.x - 2, y: L.y - 5, width: 0, height: Math.min(qFit.lineHeight, qFit.size + 10)})))));
  parts.push(g({'clip-path': ctx.ref(`${P}-qc`)}, showKey
    ? textBlock(qFit, {x: qx, y: qy, fill: th.ink})
    : qLines.map(L => h('rect', {x: L.x, y: L.y + qFit.size * 0.2, width: L.w, height: qFit.size * 0.6, rx: 4, fill: th.inkSoft}))));
  parts.push(h('rect', {name: `${P}-caret`, x: qx, y: qy - 2, width: 3, height: qFit.size + 6, fill: th.accent2, opacity: 0}));
  cy = field.y + field.h + gap;
  // date field
  const dField = {x: sx + 10, y: cy, w: sw - 20, h: dH};
  parts.push(h('path', {d: roundRectPath(dField.x, dField.y, dField.w, dField.h, 12), fill: '#fff', stroke: th.inkFaint, 'stroke-width': 2}));
  parts.push(calendarGlyph(dField.x + 24, dField.y + dH / 2, 24, th.accent));
  const dx0 = dField.x + 48;
  const dw = showKey ? Math.max(dFit.width, dFit2 ? dFit2.width : 0) : 132;
  const dTop = f => dField.y + (dH - f.height) / 2;
  // typing reveal: one clip rectangle over both lines of a wrapped date
  parts.push(h('defs', null, h('clipPath', {id: ctx.id(`${P}-dc`)}, h('rect', {name: `${P}-dr`, x: dx0 - 2, y: dField.y + 4, width: 0, height: dH - 8}))));
  parts.push(g({'clip-path': ctx.ref(`${P}-dc`)}, showKey
    ? textBlock(dFit, {x: dx0, y: dTop(dFit), fill: th.accent, name: `${P}-date0`})
    : h('rect', {name: `${P}-date0`, x: dx0, y: dField.y + dH / 2 - 8, width: dw, height: 16, rx: 4, fill: th.accent}),
    dFit2 ? (showKey
      ? textBlock(dFit2, {x: dx0, y: dTop(dFit2), fill: th.accent2, name: `${P}-date1`, opacity: 0})
      : h('rect', {name: `${P}-date1`, opacity: 0, x: dx0, y: dField.y + dH / 2 - 8, width: dw * 1.2, height: 16, rx: 4, fill: th.accent2})) : null));
  cy = dField.y + dField.h + gap;
  // results: one matching row (highlights when found) and a faint second row
  const resBox = {x: sx + 10, y: cy, w: sw - 20, h: rowH};
  if (withResults) {
    parts.push(g({name: `${P}-hit`, opacity: 0},
      h('path', {d: roundRectPath(resBox.x, resBox.y, resBox.w, resBox.h, 10), fill: th.accent3Soft, stroke: th.accent3, 'stroke-width': 3})));
    const countFit = showAll && o.count ? ctx.fit(o.count, {maxWidth: resBox.w - 64, size: 17 * M.k, minSize: 12, maxLines: 1, weight: 500}) : null;
    parts.push(g({name: `${P}-res`, opacity: 0},
      // mini binder icon
      h('rect', {x: resBox.x + 12, y: resBox.y + 14, width: 30, height: 44, rx: 3, fill: VOLUME_COLOR, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: resBox.x + 17, y: resBox.y + 22, width: 20, height: 9, rx: 2, fill: '#f3ead6'}),
      cFit
        ? textBlock(cFit, {x: resBox.x + 54, y: resBox.y + 9, fill: th.ink})
        : h('rect', {x: resBox.x + 54, y: resBox.y + 18, width: resBox.w * 0.55, height: 12, rx: 4, fill: th.inkSoft}),
      countFit
        ? textBlock(countFit, {x: resBox.x + 54, y: resBox.y + rowH - countFit.size - 8, fill: th.inkSoft})
        : h('rect', {x: resBox.x + 54, y: resBox.y + rowH - 22, width: resBox.w * 0.3, height: 10, rx: 4, fill: th.inkFaint}),
    ));
    const r2y = resBox.y + rowH + 10;
    if (r2y + 50 < screenBottom) {
      parts.push(h('rect', {x: resBox.x + 12, y: r2y + 8, width: 26, height: 36, rx: 3, fill: th.paperLine}));
      parts.push(h('rect', {x: resBox.x + 54, y: r2y + 12, width: resBox.w * 0.5, height: 10, rx: 4, fill: th.paperLine}));
      parts.push(h('rect', {x: resBox.x + 54, y: r2y + 30, width: resBox.w * 0.3, height: 10, rx: 4, fill: th.paperLine}));
    }
  }
  parts.push(h('rect', {x: sx, y: sy + hh - bez * 2 - 6, width: sw, height: 6, fill: '#000', opacity: 0.06}));
  const qTotal = qLines.reduce((a, L) => a + L.w, 0) || 1;

  /** @param {number} typed query reveal @param {number} dated date reveal @param {number} found result */
  function frame(typed, dated, found) {
    const nodes = {};
    let acc = 0;
    let caret = {x: qx, y: qy};
    qLines.forEach((L, i) => {
      const share = clamp((typed * qTotal - acc) / L.w);
      nodes[`${P}-qr${i}`] = {width: r(share > 0 ? L.w * share + 4 : 0)};
      if (typed * qTotal >= acc) caret = {x: L.x + L.w * share + 3, y: L.y};
      acc += L.w;
    });
    const typing = typed > 0 && dated < 1;
    nodes[`${P}-caret`] = {x: r(dated > 0 ? dx0 + dw * dated + 3 : caret.x), y: r(dated > 0 ? dField.y + 12 : caret.y - 2), height: dated > 0 ? dH - 24 : qFit.size + 6, opacity: typing ? 1 : 0};
    nodes[`${P}-dr`] = {width: r(dw * dated + 4)};
    if (withResults) {
      nodes[`${P}-hit`] = {opacity: r(found, 3)};
      nodes[`${P}-res`] = {opacity: r(found, 3)};
    }
    return nodes;
  }
  return {node: g({name: P}, parts), frame, resultBox: resBox, field, dateField: dField};
}

/**
 * Research card (ficha). Local origin = the rail-clip point on its left edge,
 * near the card's top: the card HANGS from the clip, so the band of the layer
 * it marks stays open above the card's top edge (room for a leader).
 */
export function researchCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  // `citLines` lets a narrow card keep a long citation whole (one more line instead of an ellipsis)
  const citFit = showAll && o.citation ? ctx.fit(o.citation, {maxWidth: w - 30, size: 20, minSize: 15, maxLines: o.citLines ?? 3, weight: 500}) : null;
  // header in spaced capitals: the letter spacing is part of the measured width; a long header takes two lines
  const headTxt = showAll && o.header ? o.header.toUpperCase() : null;
  const LS = 1;
  const hf = headTxt ? (() => {
    const one = ctx.fit(headTxt, {maxWidth: w - 30 - headTxt.length * LS, size: 17, minSize: 13, maxLines: 1, weight: 700});
    return one.truncated ? ctx.fit(headTxt, {maxWidth: w - 30 - Math.ceil(headTxt.length * 0.62) * LS, size: 16, minSize: 12, maxLines: 2, weight: 700}) : one;
  })() : null;
  const hx = hf ? Math.round(hf.height - hf.size) : 0;
  const extra = (citFit ? Math.round(citFit.height - citFit.size) : 0) + hx;
  // the date is the key label: one line at a large size, or two lines rather than a tiny single line
  const dateFit = txt => {
    const one = ctx.fit(txt, {maxWidth: w - 30, size: 31, minSize: 24, maxLines: 1, weight: 800});
    return one.truncated ? ctx.fit(txt, {maxWidth: w - 30, size: 29, minSize: 20, maxLines: 2, weight: 800}) : one;
  };
  const dF = showKey && o.date ? dateFit(o.date) : null;
  const dF2 = showKey && o.date && o.dateAfter !== undefined ? dateFit(o.dateAfter) : null;
  const dateExtra = Math.round(Math.max(dF ? dF.height - dF.size : 0, dF2 ? dF2.height - dF2.size : 0));
  const hh = o.h + 10 + extra + dateExtra;
  const cy0 = -28;
  const parts = [
    h('path', {d: roundRectPath(6, cy0 + 8, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, cy0, w, hh, 6), fill: '#fbf5e4', stroke: th.ink, 'stroke-width': th.stroke}),
    h('line', {x1: 10, x2: w - 10, y1: cy0 + 36 + hx, y2: cy0 + 36 + hx, stroke: '#c0504d', 'stroke-width': 2.4}),
  ];
  for (let i = 0; i < 3; i++) parts.push(h('line', {x1: 10, x2: w - 10, y1: cy0 + extra + 70 + i * 34, y2: cy0 + extra + 70 + i * 34, stroke: '#9fb7cf', 'stroke-width': 1.4}));
  parts.push(h('circle', {cx: w - 22, cy: cy0 + hh - 14, r: 7, fill: '#ddd3bc', stroke: th.ink, 'stroke-width': 1.6}));
  if (hf) parts.push(textBlock(hf, {x: 16, y: cy0 + 12, fill: '#c0504d', letterSpacing: LS}));
  if (citFit) parts.push(textBlock(citFit, {x: 16, y: cy0 + 44 + hx, fill: th.inkSoft}));
  else parts.push(h('rect', {x: 16, y: cy0 + 50 + hx, width: w * 0.6, height: 10, rx: 4, fill: th.inkFaint}));
  if (showAll) {
    const f = ctx.fit(o.dateLabel, {maxWidth: w - 30, size: 20, minSize: 14, maxLines: 1, weight: 600});
    parts.push(textBlock(f, {x: 16, y: cy0 + extra + 74, fill: th.ink}));
  }
  if (dF) {
    parts.push(textBlock(dF, {x: 16, y: cy0 + extra + 106, fill: th.accent, name: o.dateName}));
    if (dF2) parts.push(textBlock(dF2, {x: 16, y: cy0 + extra + 106, fill: th.accent2, name: `${o.dateName}-b`, opacity: 0}));
  } else {
    parts.push(h('rect', {name: o.dateName, x: 16, y: cy0 + extra + 112, width: w * 0.5, height: 18, rx: 5, fill: th.accent}));
    if (o.dateAfter !== undefined) parts.push(h('rect', {name: `${o.dateName}-b`, x: 16, y: cy0 + extra + 112, width: w * 0.62, height: 18, rx: 5, fill: th.accent2, opacity: 0}));
  }
  if (o.clip !== false) {
    // rail clip (metal C around the rod) at the local origin
    parts.push(h('path', {d: 'M8 -16H-12Q-20 -16 -20 -8V8Q-20 16 -12 16H8', fill: 'none', stroke: th.metalDark, 'stroke-width': 7, 'stroke-linecap': 'round'}));
    parts.push(h('path', {d: 'M8 -16H-12Q-20 -16 -20 -8V8Q-20 16 -12 16H8', fill: 'none', stroke: th.metal, 'stroke-width': 3, 'stroke-linecap': 'round'}));
    // pointer notch pointing at the rail
    parts.push(h('path', {d: 'M0 -9L-10 0L0 9Z', fill: th.accent, stroke: th.ink, 'stroke-width': 1.6}));
  }
  return {node: g({name: P}, parts), box: {x: 0, y: cy0, w, h: hh}, h: hh, top: cy0, grip: {x: w * 0.8, y: cy0 + hh * 0.66}};
}

const SHEET_PAD = 18;
const SHEET_FOLD = 26;

/**
 * Header layout of a layer: label and start date share one row when they fit
 * at a readable size, otherwise they take two rows (never truncated first).
 * @returns {{rows:1|2, headerH:number, lf:any, df:any}}
 */
export function sheetHeader(ctx, v, w) {
  const x0 = SHEET_PAD + 22, x1 = w - SHEET_FOLD - 4;
  const avail = x1 - x0;
  if (!ctx.show('key')) return {rows: 1, headerH: 46, lf: null, df: null};
  for (const [ls, ds] of [[26, 22], [25, 21], [24, 20], [23, 20], [21, 19]]) {
    const lw = ctx.measure(v.label, ls, 800, 'sans'), dw = ctx.measure(v.from, ds, 600, 'sans');
    if (lw + dw + 18 <= avail) {
      return {rows: 1, headerH: 46,
        lf: ctx.fit(v.label, {maxWidth: lw + 2, size: ls, minSize: ls, maxLines: 1, weight: 800}),
        df: ctx.fit(v.from, {maxWidth: dw + 2, size: ds, minSize: ds, maxLines: 1, weight: 600})};
    }
  }
  // two rows: each row has the full width, so the label keeps the one-row size
  return {rows: 2, headerH: 78,
    lf: ctx.fit(v.label, {maxWidth: avail, size: 26, minSize: 17, maxLines: 1, weight: 800}),
    df: ctx.fit(v.from, {maxWidth: w - SHEET_PAD * 2 - 8, size: 21, minSize: 14, maxLines: 1, weight: 600})};
}

function passageFit(ctx, v, w, lines) {
  return ctx.fit(v.text, {maxWidth: w - SHEET_PAD * 2 - 12, size: 21, minSize: 15, maxLines: lines, weight: 500, family: 'serif', leading: 1.1});
}

/** Height of the exposed strip a layer needs (header + passage). */
export function stripNeeded(ctx, v, w) {
  const hd = sheetHeader(ctx, v, w);
  const passH = ctx.show('all') && v.text ? passageFit(ctx, v, w, 2).height : 22;
  return hd.headerH + passH + 22;
}

/**
 * One temporal layer: a sheet with header (label + start date), coloured
 * index tab, highlighted passage in the exposed strip, body lines, and
 * overlays for the "selected" outline and the "later" ghost.
 * Local origin = top-left of the sheet.
 */
export function versionSheet(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh, strip, color} = o;
  const v = o.version;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const fold = SHEET_FOLD;
  const pad = SHEET_PAD;
  const hd = sheetHeader(ctx, v, w);
  const paper = g({name: `${P}-paper`},
    h('path', {d: roundRectPath(5, 7, w, hh, 6), fill: th.shadow}),
    h('path', {d: `M0 5Q0 0 5 0H${w - fold}L${w} ${fold}V${hh - 5}Q${w} ${hh} ${w - 5} ${hh}H5Q0 ${hh} 0 ${hh - 5}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${w - fold} 0V${fold - 4}Q${w - fold} ${fold} ${w - fold + 4} ${fold}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: 3, y: 8, width: 7, height: hh - 16, rx: 3, fill: color}),
  );
  // body: passage (in the exposed strip, clear of the next layer's outline) + text lines
  const body = [];
  const passTop = hd.headerH + 2;
  // the exposed strip (the next layer covers the rest); the front layer is fully exposed
  const passH = Math.max(22, o.front ? Math.max(44, strip - passTop - 12) : strip - passTop - 12);
  const passLines = passH >= 44 ? 2 : 1;
  let passFit = null;
  const fits = showAll && v.text && passageFit(ctx, v, w, 1).height <= (o.front ? passH : strip - passTop - 12) + 2;
  if (fits) {
    passFit = passageFit(ctx, v, w, passLines);
    const py = passTop + Math.max(0, (passH - passFit.height) / 2);
    body.push(h('rect', {name: o.textAfter !== undefined ? `${P}-passhl0` : undefined, x: pad, y: py - 4, width: passFit.width + 12, height: passFit.height + 8, rx: 4, fill: th.highlight, opacity: 0.75}));
    body.push(textBlock(passFit, {x: pad + 6, y: py, fill: th.ink, name: `${P}-pass`}));
    if (o.textAfter !== undefined) {
      const f2 = passageFit(ctx, {text: o.textAfter}, w, passLines);
      const py2 = passTop + Math.max(0, (passH - f2.height) / 2);
      body.push(h('rect', {name: `${P}-passhl1`, x: pad, y: py2 - 4, width: f2.width + 12, height: f2.height + 8, rx: 4, fill: th.accent2Soft, opacity: 0}));
      body.push(textBlock(f2, {x: pad + 6, y: py2, fill: th.ink, name: `${P}-pass1`, opacity: 0}));
    }
  } else {
    const bw = (w - pad * 2) * (0.55 + 0.12 * o.index);
    body.push(h('rect', {x: pad, y: passTop + passH / 2 - 11, width: bw, height: 22, rx: 4, fill: th.highlight, opacity: 0.75}));
    body.push(h('rect', {x: pad + 6, y: passTop + passH / 2 - 4, width: bw - 12, height: 8, rx: 3, fill: th.inkSoft}));
  }
  const lineTop = strip + 16;
  const barH = 8;
  const rows = Math.max(3, Math.floor((hh - lineTop - 30) / 24));
  for (let i = 0; i < rows; i++) {
    const last = i % 4 === 3;
    const lw = (w - pad * 2) * (last ? 0.45 + ctx.rng('hist-line', o.index * 30 + i) * 0.25 : 0.84 + ctx.rng('hist-line', o.index * 30 + i) * 0.16);
    body.push(h('rect', {x: pad, y: lineTop + i * 24, width: r(lw), height: barH, rx: 4, fill: th.paperLine}));
  }
  const content = g({name: `${P}-content`}, body);
  // header: dot + label, start date (same row or second row); keeps a paper
  // backing so it stays legible when the sheet becomes a ghost
  const head = [h('rect', {x: 12, y: 8, width: w - 24 - fold * 0.5, height: hd.headerH - 8, rx: 6, fill: th.paper})];
  head.push(h('circle', {cx: pad + 7, cy: 27, r: 8, fill: color, stroke: th.ink, 'stroke-width': 1.6}));
  if (showKey) {
    head.push(textBlock(hd.lf, {x: pad + 22, y: 27 - hd.lf.size * 0.55, fill: th.ink}));
    if (hd.rows === 1) head.push(textBlock(hd.df, {x: w - fold - 4, y: 27 - hd.df.size * 0.55, anchor: 'end', fill: th.inkSoft}));
    else head.push(textBlock(hd.df, {x: pad + 22, y: 50, fill: th.inkSoft}));
  } else {
    head.push(h('rect', {x: pad + 22, y: 21, width: 70, height: 12, rx: 4, fill: th.ink}));
    head.push(h('rect', {x: w - fold - 110, y: 21, width: 100, height: 12, rx: 4, fill: th.inkFaint}));
  }
  const header = g({name: `${P}-head`}, head);
  // coloured index tab protruding on the right edge
  const tab = g(null,
    h('path', {d: `M${w - 2} ${fold + 6}H${w + 16}Q${w + 22} ${fold + 6} ${w + 22} ${fold + 12}V${fold + 56}Q${w + 22} ${fold + 62} ${w + 16} ${fold + 62}H${w - 2}Z`, fill: color, stroke: th.ink, 'stroke-width': 2}),
  );
  const hl = g({name: `${P}-hl`, opacity: 0},
    h('path', {d: roundRectPath(-5, -5, w + 32, hh + 10, 10), fill: 'none', stroke: th.accentSoft, 'stroke-width': 10}),
    h('path', {d: roundRectPath(-5, -5, w + 32, hh + 10, 10), fill: 'none', stroke: th.accent, 'stroke-width': 5}),
  );
  const ghost = h('path', {name: `${P}-ghost`, d: roundRectPath(0, 0, w, hh, 6), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '12 9', opacity: 0});
  return {node: g({name: P}, paper, content, tab, header, hl, ghost), passFit, header: hd};
}

/* ------------------------------------------------------------------------ */
/* Station                                                                  */
/* ------------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {{query:string, sources:string[], citations:string[], dates:{selected:string}, versions:Array<{label:string,from:string,text?:string}>}} o.data
 * @param {number} o.selected         supplied layer index for the selected date
 * @param {{volume?:string, card?:string, search?:string}} [o.labels]
 * @param {object} [o.researcher]     party (name, appearance)
 * @param {string} [o.actorCaption]   chip text for the researcher (null = none)
 * @param {boolean} [o.shelf=true]
 * @param {boolean} [o.leftArm=true]
 * @param {'shelf'|'hung'} [o.volumeStart='shelf']
 */
export function readingStation(ctx, o) {
  const th = ctx.theme;
  const t = ctx.t;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STATION[axis];
  const data = o.data;
  const n = data.versions.length;
  const sel = Math.max(0, Math.min(n - 1, o.selected));
  const showAll = ctx.show('all');

  // --- layer geometry
  const faceX = G.face.x, faceY = G.face.y;
  const sheetOff = {x: 26, y: 16};
  const sheetTop = faceY + sheetOff.y;
  const stackBottom = G.ledgeY - 26;
  const avail = stackBottom - sheetTop;
  const SW = G.sheetW;
  const need = Math.max(...data.versions.map(v => stripNeeded(ctx, v, SW)));
  const shMin = Math.min(300, avail * 0.45);
  const dy = Math.round(Math.min(Math.max(need, n <= 3 ? 100 : 86), (avail - shMin) / (n - 1)));
  const SH = Math.min(G.shMax, avail - (n - 1) * dy);
  const dx = 22;
  const fw = SW + 52, fh = SH + 34;
  const railX = faceX + sheetOff.x + SW + (n - 1) * dx + 22 + 20;
  const railTop = sheetTop - 6;
  const railBottom = sheetTop + (n - 1) * dy + SH + 4;

  // --- shelf and volume geometry (the volume scales up as it comes forward)
  const shelfBox = o.shelf === false ? null : {x: G.shelf.x, y: G.shelf.y, w: G.shelf.w, h: G.shelf.h ?? G.ledgeY - G.shelf.y};
  const slotMax = shelfBox ? Math.min(150, (shelfBox.h - 66) / G.shelf.rows - 16) : 140;
  const slotW = Math.round(62 * (axis === 'horizontal' ? 1 : 0.94));
  const shelf = shelfBox ? bookshelf(ctx, {prefix: `${P}-shelf`, ...shelfBox, rows: G.shelf.rows, slotRow: G.shelf.slotRow, slotW, slotH: slotMax, sign: G.shelf.slotRow < 0 && G.shelf.w < 260 ? null : data.sources[0]}) : null;
  // the volume on the shelf is exactly as tall as the slot the shelf actually leaves
  const slotH = shelf && shelf.slot ? shelf.slot.h : slotMax;
  const k0 = slotH / fh;
  const spineW = slotW / k0;

  const vol = buildVolume(ctx, {P, n, SW, SH, fw, fh, spineW, sheetOff, dx, dy, k0, data, sel, labels: o.labels || {}, passageAfter: o.passageAfter});

  // --- lectern
  const lec = {x: faceX - 32, y: faceY - 44, w: railX + 30 - (faceX - 32), h: G.ledgeY - (faceY - 44) + 6};
  const lectern = g(null,
    h('path', {d: roundRectPath(lec.x + 8, lec.y + 10, lec.w, lec.h, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(lec.x, lec.y, lec.w, lec.h, 12), fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(lec.x + 16, lec.y + 16, lec.w - 32, lec.h - 32, 8), fill: shade(th.woodTop, 0.12), stroke: shade(th.woodTop, -0.2), 'stroke-width': 2}),
    // top clip bar
    h('rect', {x: faceX + 30, y: faceY - 30, width: fw - 60, height: 18, rx: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
  );
  const hooks = g(null, [faceX + fw * 0.22, faceX + fw * 0.78].map(hx => h('path', {d: `M${r(hx - 8)} ${faceY - 16}V${faceY + 8}Q${r(hx)} ${faceY + 18} ${r(hx + 8)} ${faceY + 8}V${faceY - 16}Z`, fill: th.metal, stroke: th.ink, 'stroke-width': 2})));

  // --- date rail with ticks aligned to each layer's top edge
  const rail = g(null,
    h('rect', {x: railX - 6, y: railTop, width: 12, height: railBottom - railTop, rx: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: railX - 14, y: railTop - 10, width: 28, height: 14, rx: 4, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: railX - 14, y: railBottom - 4, width: 28, height: 14, rx: 4, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
  );
  const ticks = g(null, data.versions.map((_, i) => g({name: `${P}-tick${i}`, transform: T(0, sheetTop)},
    h('line', {x1: railX - 20, x2: railX + 20, y1: 0, y2: 0, stroke: th.ink, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('circle', {cx: railX, cy: 0, r: 7, fill: versionColor(ctx, i), stroke: th.ink, 'stroke-width': 2}))));
  // selected-date position on the rail (inside the band of the marked layer)
  const dateAt = i => sheetTop + i * dy + dy * 0.52;
  const dateY = dateAt(sel);

  // --- kiosk
  const K = G.kiosk;
  const kioskArt = kiosk(ctx, {prefix: `${P}-kiosk`, x: K.x, y: K.y, w: K.w, h: K.h, stand: K.stand, standTo: G.ledgeY + 6, wide: K.wide,
    header: (o.labels && o.labels.search) || t.searchHeader, query: data.query, date: data.dates.selected, citation: data.citations[0],
    count: `${n} ${t.versionsCount}`, results: K.results, dateAfter: o.dateAfter});

  // --- counter (ledge) + keyboard
  const counter = g(null,
    h('rect', {x: -10, y: G.ledgeY, width: W + 20, height: 44, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: -10, y: G.ledgeY + 44, width: W + 20, height: H - G.ledgeY, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: -10, y: G.ledgeY + 44, width: W + 20, height: 8, fill: '#000', opacity: 0.12}),
    h('path', {d: `M0 ${G.ledgeY + 80}C${W * 0.3} ${G.ledgeY + 70} ${W * 0.6} ${G.ledgeY + 92} ${W} ${G.ledgeY + 78}`, fill: 'none', stroke: th.woodDark, 'stroke-width': 2, opacity: 0.4}),
  );
  const kb = {x: G.keyboard.x, y: G.ledgeY + 6, w: G.keyboard.w, h: 30};
  const keys = [];
  for (let row = 0; row < 3; row++) {
    const inset = (2 - row) * 5;
    const cnt = 11 - row;
    const kw = (kb.w - 20 - inset * 2) / cnt;
    for (let c = 0; c < cnt; c++) keys.push(h('rect', {x: kb.x + 10 + inset + c * kw + 1.5, y: kb.y + 4 + row * 8.6, width: kw - 3, height: 6.4, rx: 1.5, fill: '#626a73'}));
  }
  const keyboard = g(null,
    h('path', {d: `M${kb.x + 10} ${kb.y}H${kb.x + kb.w - 10}L${kb.x + kb.w} ${kb.y + kb.h}H${kb.x}Z`, fill: '#353b42', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    keys);

  // --- research card
  const card = researchCard(ctx, {prefix: `${P}-card`, w: G.card.w, h: G.card.h, header: (o.labels && o.labels.card) || t.cardHeader,
    citation: data.citations[0], dateLabel: t.selectedDate, date: data.dates.selected, dateName: `${P}-card-date`, dateAfter: o.dateAfter});
  const cardH = card.h, cardBelow = card.h + card.top;
  // the card stands on the counter right of the rail (clear of the rail and inside the frame)
  const cardRest = {x: Math.min(railX + (G.cardRestDX ?? 44), W - 16 - G.card.w), y: G.ledgeY + 6 - cardBelow, rot: 0};
  const cardWait = {x: railX, y: railBottom - cardBelow - 6, rot: 0};

  // --- arms
  const look = actorLook(ctx, o.researcher, 0);
  const armSpec = G.arm;
  const armL = o.leftArm === false ? null : topArm(ctx, {name: `${P}-armL`, skin: look.skin, sleeve: look.outfit, handed: 'left', ...armSpec});
  const armR = topArm(ctx, {name: `${P}-armR`, skin: look.skin, sleeve: look.outfit, handed: 'right', ...armSpec});

  // --- room window
  const clipId = `${P}-clip`;
  const room = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(0, 0, W, H, 30)}))),
    h('path', {d: roundRectPath(0, 0, W, H, 30), fill: WALL}),
  );
  const wallLines = [];
  for (let i = 1; i < 12; i++) wallLines.push(h('line', {x1: (W / 12) * i, x2: (W / 12) * i, y1: 0, y2: G.ledgeY, stroke: '#d9d0bd', 'stroke-width': 2, opacity: 0.6}));
  const frame = h('path', {d: roundRectPath(0, 0, W, H, 30), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2});

  // actor caption on the counter front, between the resting hands (name and role never truncated away)
  const chipNode = o.actorCaption && ctx.show('key')
    ? actorChip(ctx, o.actorCaption, {x: G.chip.x, y0: G.ledgeY + 44, y1: H, maxWidth: G.chip.maxWidth, name: `${P}-chip`})
    : null;

  const node = g({name: P},
    room,
    g({'clip-path': ctx.ref(clipId)},
      wallLines,
      kioskArt.node,
      shelf && shelf.node,
      shelf && shelf.glow,
      lectern,
      rail,
      ticks,
      vol.node,
      hooks,
      counter,
      keyboard,
      card.node,
      armL && [armL.arm, armL.palm, armL.thumb],
      armR.arm, armR.palm, armR.thumb,
    ),
    frame,
    chipNode && chipNode.node,
  );

  // ----------------------------------------------------------------------
  // Poses
  const slot = (shelf && shelf.slot) || {x: faceX - 80, y: faceY, w: slotW, h: slotH};
  const volOnShelf = {x: slot.x + slot.w, y: slot.y, k: k0};
  const volOut = {x: slot.x + slot.w + (axis === 'horizontal' ? 10 : 12), y: slot.y + 26, k: k0 * 1.18};
  const volHung = {x: faceX, y: faceY, k: 1};
  const gripLocal = phi => ({x: -spineW * Math.cos(phi) / 2, y: fh * 0.72});
  const keyPos = {x: kb.x + kb.w * 0.5, y: kb.y + 14};

  const rot = (p, deg) => {
    const a = (deg * Math.PI) / 180;
    return {x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a)};
  };
  const cardGripAt = cp => {
    const q = rot(card.grip, cp.rot);
    return {x: cp.x + q.x, y: cp.y + q.y};
  };
  const frontCorner = f => ({x: faceX + sheetOff.x + (n - 1) * dx * f + 6, y: sheetTop + (n - 1) * dy * f + SH - 10});

  /**
   * Pose the station from action values in [0,1].
   * @param {{toKeys:number, type:number, dated:number, locate:number, backR:number,
   *          toVol:number, pull:number, carry:number, settle:number, toFan:number, fan:number, releaseL:number,
   *          toCard:number, liftCard:number, slide:number, clip:number, releaseR:number, select:number,
   *          target?:number}} s   `target` = layer index the card travels to (defaults to the supplied selection)
   */
  function pose(s) {
    const nodes = {};
    const target = s.target ?? sel;
    const tgtY = s.targetY ?? dateAt(target);

    // ---- kiosk
    Object.assign(nodes, kioskArt.frame(clamp(s.type), clamp(s.dated), clamp(s.locate)));
    if (shelf && shelf.glow) nodes[shelf.glowName] = {opacity: r(clamp(s.locate) * (1 - clamp(s.pull * 1.5)), 3)};

    // ---- volume pose
    let vp;
    let phi = 0;
    if (s.carry > 0) {
      const e = ease.inOutCubic(s.carry);
      // square: the kiosk hangs above the shelf, so the arc stays low and passes in front of the shelf crown
      const c1 = axis === 'square'
        ? {x: lerp(volOut.x, volHung.x, 0.55), y: volOut.y - 70}
        : {x: volOut.x + (volHung.x - volOut.x) * 0.1, y: Math.min(volOut.y, volHung.y) - 40};
      const c2 = {x: volHung.x - 40, y: volHung.y - 30};
      const q = cubic(volOut, c1, c2, volHung, e);
      vp = {x: q.x, y: q.y, k: lerp(volOut.k, 1, ease.inOutSine(s.carry))};
      phi = (Math.PI / 2) * ease.inOutSine(seg(s.carry, 0.08, 0.85));
    } else {
      const e = ease.inOutCubic(s.pull);
      vp = {x: lerp(volOnShelf.x, volOut.x, e), y: lerp(volOnShelf.y, volOut.y, e), k: lerp(volOnShelf.k, volOut.k, e)};
    }
    if (s.carry >= 1 && s.settle > 0 && !ctx.reduced) vp.y += Math.sin(Math.PI * s.settle) * 6;
    if (o.volumeStart === 'hung') { vp = {...volHung}; phi = Math.PI / 2; }
    const fan = ease.inOutCubic(clamp(s.fan));
    Object.assign(nodes, vol.pose(vp, phi, fan));
    const gl = gripLocal(phi);
    const volGrip = {x: vp.x + gl.x * vp.k, y: vp.y + gl.y * vp.k};
    const volumeHolder = o.volumeStart === 'hung' ? 'lectern' : s.carry >= 1 ? 'lectern' : s.carry > 0 ? 'L-carrying' : s.pull > 0 ? 'L-pulling' : 'shelf';

    // ---- ticks follow the layer tops
    data.versions.forEach((_, i) => { nodes[`${P}-tick${i}`] = {transform: T(0, sheetTop + i * dy * fan), opacity: fan > 0.02 || i === 0 ? 1 : 0}; });

    // ---- left arm
    let solvedL = null;
    let handL = null;
    if (armL) {
      const restL = G.restL;
      if (s.releaseL > 0) handL = mix(frontCorner(1), restL, ease.inOutSine(s.releaseL));
      else if (s.fan > 0) handL = frontCorner(fan);
      else if (s.toFan > 0) handL = mix(volGrip, frontCorner(0), ease.inOutCubic(s.toFan));
      else if (s.pull > 0 || s.carry > 0) handL = volGrip;
      else handL = mix(restL, volGrip, ease.inOutSine(s.toVol));
      solvedL = armL.pose(G.shoulderL, handL, G.bendL);
      Object.assign(nodes, solvedL.nodes);
    }

    // ---- card pose
    let cp = {...cardRest};
    const cardWaitAt = {...cardWait};
    if (s.liftCard > 0) {
      const e = ease.inOutCubic(s.liftCard);
      cp = {x: lerp(cardRest.x, cardWaitAt.x, e), y: lerp(cardRest.y, cardWaitAt.y, e) - Math.sin(Math.PI * e) * 24, rot: lerp(cardRest.rot, 0, e)};
    }
    if (s.slide > 0) {
      const e = ease.inOutCubic(s.slide);
      cp = {x: cardWaitAt.x, y: lerp(cardWaitAt.y, tgtY, e), rot: 0};
    }
    if (s.clip > 0) cp = {x: cardWaitAt.x, y: tgtY, rot: 0};
    nodes[`${P}-card`] = {transform: T(cp.x, cp.y, cp.rot)};
    if (s.cardDate !== undefined) nodes[`${P}-card-date`] = {opacity: r(clamp(s.cardDate), 3)};
    const cardGrip = cardGripAt(cp);
    const cardHolder = s.releaseR > 0 || (s.clip >= 1 && s.releaseR > 0) ? 'rail' : s.toCard >= 1 ? (s.slide > 0 || s.clip > 0 ? 'R-sliding' : 'R-holding') : 'counter';

    // ---- right arm
    const restR = G.restR;
    let handR;
    const tap = i => ({x: keyPos.x + (((i * 37) % 5) - 2) * 18, y: keyPos.y});
    if (s.releaseR > 0) handR = mix(cardGripAt({x: cardWaitAt.x, y: tgtY, rot: 0}), restR, ease.inOutSine(s.releaseR));
    else if (s.toCard >= 1) handR = cardGrip;
    else if (s.toCard > 0) handR = mix(restR, cardGripAt(cardRest), ease.inOutCubic(s.toCard));
    else if (s.backR > 0) handR = mix(keyPos, restR, ease.inOutCubic(s.backR));
    else if (s.type > 0 || s.dated > 0) {
      // taps: the hand hops between keys and dips on each stroke
      const tt = clamp(s.type * 0.8 + s.dated * 0.2) * 9;
      const i = Math.floor(tt);
      const f = tt - i;
      const a = tap(i), b = tap(i + 1);
      const hop = mix(a, b, ease.inOutSine(f));
      handR = ctx.reduced ? keyPos : {x: hop.x, y: hop.y - Math.sin(Math.PI * f) * 10};
      if (tt >= 9) handR = keyPos;
    } else handR = mix(restR, keyPos, ease.inOutCubic(s.toKeys));
    const solvedR = armR.pose(G.shoulderR, handR, G.bendR);
    Object.assign(nodes, solvedR.nodes);

    // ---- selection response (optionally blended from one layer to another)
    const selP = clamp(s.select);
    if (s.mix) Object.assign(nodes, vol.selectMix(s.mix.from, s.mix.to, s.mix.t));
    else Object.assign(nodes, vol.select(target, selP));
    // ---- datum swaps: old value lifts out before the new one settles in
    const swap = (a, b, pr) => {
      const out = clamp(pr * 2), inn = clamp(pr * 2 - 1);
      nodes[a] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-14 * out)})`};
      nodes[b] = {opacity: r(inn, 3), transform: `translate(0 ${r(14 * (1 - inn))})`};
    };
    if (o.dateAfter !== undefined && s.dateSwap !== undefined) {
      swap(`${P}-card-date`, `${P}-card-date-b`, s.dateSwap);
      swap(`${P}-kiosk-date0`, `${P}-kiosk-date1`, s.dateSwap);
    }
    if (o.passageAfter && s.passSwap !== undefined && ctx.show('all') && data.versions[o.passageAfter.index].text) {
      const pp = `${P}-v${o.passageAfter.index}`;
      swap(`${pp}-pass`, `${pp}-pass1`, s.passSwap);
      const e2 = clamp(s.passSwap * 2 - 0.5);
      nodes[`${pp}-passhl0`] = {opacity: r(0.75 * (1 - e2), 3)};
      nodes[`${pp}-passhl1`] = {opacity: r(0.9 * e2, 3)};
    }

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const reachL = solvedL ? solvedL.reached : true;
    return {
      nodes,
      semantic: {
        handL: solvedL ? P2(solvedL.hand) : null,
        handR: P2(solvedR.hand),
        volumeGrip: P2(volGrip),
        volume: P2(vp),
        volumeScale: r(vp.k, 3),
        volumeTurn: r(phi / (Math.PI / 2), 3),
        volumeHolder,
        frontCorner: P2(frontCorner(fan)),
        fan: r(fan, 3),
        card: P2(cp),
        cardGrip: P2(cardGrip),
        cardHolder,
        cardTargetY: r(tgtY),
        typed: r(clamp(s.type), 3),
        located: s.locate >= 1,
        selected: selP > 0 ? target : null,
        selectProgress: r(selP, 3),
        laterLayers: selP > 0 ? data.versions.map((_, i) => i).filter(i => i > target) : [],
        reach: {L: reachL, R: solvedR.reached},
        allReached: reachL && solvedR.reached,
      },
    };
  }

  const cardBoxAt = cp => ({x: cp.x, y: cp.y + card.top, w: G.card.w, h: cardH});
  const kioskObstacles = [{x: K.x, y: K.y, w: K.w + 8, h: K.h + 12},
    ...(K.stand
      ? [{x: K.x + K.w / 2 - 16, y: K.y + K.h, w: 32, h: G.ledgeY - (K.y + K.h)}, {x: K.x + K.w / 2 - 70, y: G.ledgeY - 16, w: 140, h: 22}]
      : [{x: K.x + K.w / 2 - 40, y: K.y + K.h - 4, w: 80, h: 16}])];
  return {
    node, pose, W, H, axis, n, sel, dy, SH, SW, dx, faceX, faceY, sheetTop, railX, railTop, railBottom, fw, fh,
    dateAt,
    cardRest, cardWait,
    cardBoxAt,
    /** top edge (stage y) of layer i when fanned */
    layerTop: i => sheetTop + i * dy,
    /** stage x of the right edge of layer i's selection outline */
    outlineRightX: i => faceX + sheetOff.x + i * dx + SW + 27,
    /** stage box of the card clipped at layer i's date */
    cardFinalBox: i => cardBoxAt({x: cardWait.x, y: dateAt(i)}),
    cardRestBox: cardBoxAt(cardRest),
    /** stage box of the "Later version" tag when layer i is marked (null when no later layer) */
    tagBox: i => {
      if (i >= n - 1 || !vol.tagH) return null;
      const q = vol.tagAt(i);
      return {x: faceX + q.x - vol.tagW / 2, y: faceY + q.y, w: vol.tagW, h: vol.tagH};
    },
    /** free wall right of the rail, for editorial notes */
    noteRegion: {x0: railX + 30, x1: W - 16, y0: 18, y1: G.ledgeY - 14},
    kioskObstacles,
    /** stage point of a sheet-local point for layer i when fully fanned */
    sheetPoint: (i, local, f = 1) => ({x: faceX + sheetOff.x + i * dx * f + local.x, y: sheetTop + i * dy * f + local.y}),
    kioskBox: {x: K.x, y: K.y, w: K.w, h: K.h},
    /** Boxes holding text when fully fanned (layer strips), for annotation placement. */
    stripBoxes: () => data.versions.map((_, i) => ({x: faceX + sheetOff.x + i * dx, y: sheetTop + i * dy, w: SW + 24, h: i === n - 1 ? SH : dy})),
    kioskArt,
    shelfBox: shelf ? shelf.box : null,
    slot,
    ledgeY: G.ledgeY,
    lecternBox: lec,
    chipBox: chipNode ? chipNode.box : null,
  };
}

/**
 * The consolidated volume: spine (seen on the shelf) + face (cover board with
 * the loose version sheets). Local origin = the spine/face edge, top.
 */
function buildVolume(ctx, o) {
  const th = ctx.theme;
  const {P, n, SW, SH, fw, fh, spineW, sheetOff, dx, dy, k0, data} = o;
  const showAll = ctx.show('all');
  const sheets = data.versions.map((v, i) => versionSheet(ctx, {prefix: `${P}-v${i}`, index: i, front: i === n - 1, w: SW, h: SH, strip: dy, color: versionColor(ctx, i), version: v, textAfter: o.passageAfter && o.passageAfter.index === i ? o.passageAfter.text : undefined}));
  // one "later" tag on the front-most ghost, placed in the part of it that lies
  // BELOW the marked layer's outline (never inside the outline)
  const laterTag = ctx.show('key') && n >= 2 ? chipTag(ctx, ctx.t.later, {name: `${P}-later`, x: 0, y: 0}) : null;
  /** face-local top-centre of the tag for a marked layer `target` */
  const frontHead = sheets[n - 1].header.headerH;
  const tagAt = target => {
    // below the marked outline AND below the front ghost's own header (never over a label)
    const bottom = sheetOff.y + (n - 1) * dy + SH - 6;
    const th2 = laterTag ? laterTag.h : 0;
    const top = Math.min(Math.max(sheetOff.y + target * dy + SH + 14, sheetOff.y + (n - 1) * dy + frontHead + 10), bottom - th2);
    return {x: sheetOff.x + (n - 1) * dx + SW / 2, y: (top + bottom) / 2 - th2 / 2};
  };
  // spine art (drawn in spine-local units; the group is scaled by cos(phi))
  const label = o.labels.volume || data.citations[0];
  const spineLabelSize = 17 / k0;
  const spine = g({name: `${P}-spine`},
    h('rect', {x: -spineW, y: 0, width: spineW, height: fh, rx: 6 / k0 * 0.5, fill: shade(VOLUME_COLOR, 0.08), stroke: th.ink, 'stroke-width': 2 / k0}),
    h('rect', {x: -spineW + spineW * 0.16, y: fh * 0.1, width: spineW * 0.68, height: fh * 0.3, rx: 4 / k0, fill: '#f3ead6', stroke: th.ink, 'stroke-width': 1.5 / k0}),
    showAll && label ? textBlock(ctx.fit(label, {maxWidth: spineW * 0.6, size: spineLabelSize, minSize: spineLabelSize * 0.7, maxLines: 3, weight: 700}), {x: -spineW / 2, y: fh * 0.12, anchor: 'middle', fill: th.ink}) : null,
    data.versions.map((_, i) => h('rect', {x: -spineW + spineW * 0.16, y: fh * 0.5 + i * fh * 0.06, width: spineW * 0.68, height: fh * 0.04, rx: 2 / k0, fill: versionColor(ctx, i), stroke: th.ink, 'stroke-width': 1.2 / k0})),
    h('circle', {cx: -spineW / 2, cy: fh * 0.82, r: spineW * 0.16, fill: shade(VOLUME_COLOR, -0.35), stroke: th.ink, 'stroke-width': 2 / k0}),
  );
  const face = g({name: `${P}-face`},
    h('path', {d: roundRectPath(8, 10, fw, fh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, fw, fh, 10), fill: VOLUME_COLOR, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: 0, y: 0, width: 16, height: fh, rx: 6, fill: shade(VOLUME_COLOR, -0.3)}),
    h('rect', {x: sheetOff.x - 6, y: sheetOff.y - 6, width: SW + 12, height: SH + 12, rx: 6, fill: shade(VOLUME_COLOR, -0.2)}),
    sheets.map((sh, i) => g({name: `${P}-v${i}-pos`}, sh.node)),
    laterTag && laterTag.node,
  );
  const node = g({name: `${P}-vol`}, spine, face);

  /** @param {{x:number,y:number,k:number}} vp @param {number} phi @param {number} fan */
  function pose(vp, phi, fan) {
    const nodes = {};
    const c = Math.cos(phi), s = Math.sin(phi);
    nodes[`${P}-vol`] = {transform: T(vp.x, vp.y, 0, vp.k)};
    nodes[`${P}-spine`] = {transform: `scale(${r(Math.max(0.0001, c), 4)} 1)`, opacity: c < 0.02 ? 0 : 1};
    nodes[`${P}-face`] = {transform: `scale(${r(Math.max(0.0001, s), 4)} 1)`, opacity: s < 0.02 ? 0 : 1};
    data.versions.forEach((_, i) => {
      nodes[`${P}-v${i}-pos`] = {transform: T(sheetOff.x + i * dx * fan, sheetOff.y + i * dy * fan)};
    });
    return nodes;
  }
  /** Outline the layer for the selected date; turn later layers into ghosts. */
  function select(target, p) {
    const nodes = {};
    const e = ease.inOutCubic(p);
    data.versions.forEach((_, i) => {
      const later = i > target;
      nodes[`${P}-v${i}-hl`] = {opacity: r(i === target ? e : 0, 3)};
      nodes[`${P}-v${i}-paper`] = {opacity: r(later ? 1 - 0.86 * e : 1, 3)};
      nodes[`${P}-v${i}-content`] = {opacity: r(later ? 1 - e : i < target ? 1 - 0.25 * e : 1, 3)};
      nodes[`${P}-v${i}-ghost`] = {opacity: r(later ? e : 0, 3)};
    });
    if (laterTag) {
      const q = tagAt(Math.min(target, n - 2));
      nodes[`${P}-later`] = {opacity: r(target < n - 1 ? clamp(e * 1.4 - 0.4) : 0, 3), transform: T(q.x, q.y)};
    }
    return nodes;
  }
  /**
   * Selection moving from layer a to layer b (t in [0,1]); both fully selected states are exact.
   * A layer that stops (or starts) being a ghost changes in two stages, never as a cross-fade: its
   * paper turns opaque first (hiding the layer underneath) and only then its own lines and passage
   * fade in — or, the other way, its lines fade out before the paper turns see-through.
   */
  function selectMix(a, b, t) {
    const nodes = {};
    const e = ease.inOutCubic(clamp(t));
    const contentOf = (i, s) => (i > s ? 0 : i < s ? 0.75 : 1);
    data.versions.forEach((_, i) => {
      const hl = (i === a ? 1 - e : 0) + (i === b ? e : 0);
      const laterA = i > a ? 1 : 0, laterB = i > b ? 1 : 0;
      const unGhost = laterA > laterB, toGhost = laterB > laterA;
      const pPaper = unGhost ? clamp(e * 2) : toGhost ? clamp(e * 2 - 1) : e;
      const pContent = unGhost ? clamp(e * 2 - 1) : toGhost ? clamp(e * 2) : e;
      const later = lerp(laterA, laterB, pPaper);
      nodes[`${P}-v${i}-hl`] = {opacity: r(hl, 3)};
      nodes[`${P}-v${i}-paper`] = {opacity: r(1 - 0.86 * later, 3)};
      nodes[`${P}-v${i}-content`] = {opacity: r(lerp(contentOf(i, a), contentOf(i, b), pContent), 3)};
      nodes[`${P}-v${i}-ghost`] = {opacity: r(later, 3)};
    });
    if (laterTag) {
      // the tag follows the outline's bottom edge (between the two placements when both have a later layer)
      const la = a < n - 1 ? 1 - e : 0, lb = b < n - 1 ? e : 0;
      const qa = tagAt(Math.min(a, n - 2)), qb = tagAt(Math.min(b, n - 2));
      const k = la + lb > 0 ? lb / (la + lb) : 0;
      nodes[`${P}-later`] = {opacity: r(clamp((la + lb) * 1.4 - 0.4), 3), transform: T(lerp(qa.x, qb.x, k), lerp(qa.y, qb.y, k))};
    }
    return nodes;
  }
  return {node, pose, select, selectMix, sheets, tagAt, tagH: laterTag ? laterTag.h : 0, tagW: laterTag ? laterTag.w : 0};
}

/**
 * Actor caption pill centred in a horizontal band. One line "Name · Role" when
 * it fits at a readable size; otherwise the name and the role take one line
 * each (each shrinks within bounds) so the role is never lost.
 * @param {any} ctx
 * @param {string|{name?:string, role?:string}} who
 * @param {{x:number, y0:number, y1:number, maxWidth:number, name:string}} o
 */
export function actorChip(ctx, who, o) {
  const th = ctx.theme;
  const name = typeof who === 'string' ? who : who.name || '';
  const role = typeof who === 'string' ? '' : who.role || '';
  const one = [name, role].filter(Boolean).join(' · ');
  const band = o.y1 - o.y0;
  const single = chip(ctx, one, {x: 0, y: 0, anchor: 'middle', maxWidth: o.maxWidth, size: 28, minSize: 23, maxLines: 1, name: o.name, fill: th.card});
  if (!single.fit.truncated || !name || !role) {
    return chip(ctx, one, {x: o.x, y: o.y0 + (band - single.box.h) / 2, anchor: 'middle', maxWidth: o.maxWidth, size: 28, minSize: 23, maxLines: 1, name: o.name, fill: th.card});
  }
  const padX = 18, padY = 8;
  const nf = ctx.fit(name, {maxWidth: o.maxWidth - padX * 2, size: 25, minSize: 17, maxLines: 1, weight: 700});
  const rf = ctx.fit(role, {maxWidth: o.maxWidth - padX * 2, size: 21, minSize: 16, maxLines: 1, weight: 500});
  const gap = 3;
  const w = Math.max(nf.width, rf.width) + padX * 2;
  const hh = nf.size * 1.12 + gap + rf.size * 1.05 + padY * 2;
  const x = o.x - w / 2, y = o.y0 + (band - hh) / 2;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, y, w, hh, 18), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    textBlock(nf, {x: o.x, y: y + padY, anchor: 'middle', fill: th.ink}),
    textBlock(rf, {x: o.x, y: y + padY + nf.size * 1.12 + gap, anchor: 'middle', fill: th.inkSoft}));
  return {node, box: {x, y, w, h: hh, cx: o.x, cy: y + hh / 2}, fit: {truncated: nf.truncated || rf.truncated}};
}

/**
 * Place an editorial callout in the free wall right of the date rail.
 * Scans chip positions inside `st.noteRegion` and, for each candidate target,
 * scores: chip overlapping an obstacle (card, kiosk, other notes) — rejected;
 * leader crossing an obstacle — heavily penalised; then the leader length.
 * @param {any} ctx
 * @param {any} st readingStation result
 * @param {{name:string, text:string, targets:Array<{x:number,y:number}>, obstacles:Array<{x:number,y:number,w:number,h:number}>, size?:number, maxLines?:number, maxWidth?:number}} o
 */
export function placeNote(ctx, st, o) {
  const R = st.noteRegion;
  const size = o.size ?? 26;
  const maxLines = o.maxLines ?? 4;
  const full = Math.min(o.maxWidth ?? 380, R.x1 - R.x0);
  // try the preferred width first, then narrower chips (more lines) if the wall is cut by the card or kiosk
  const widths = [...new Set([full, 320, 280, 250, 220].filter(v => v <= full))];
  const hit = (b, q, m) => b.x < q.x + q.w + m && b.x + b.w + m > q.x && b.y < q.y + q.h + m && b.y + b.h + m > q.y;
  const inside = (p, q, m) => p.x > q.x - m && p.x < q.x + q.w + m && p.y > q.y - m && p.y < q.y + q.h + m;
  let best = null;
  widths.forEach((maxWidth, wi) => {
    const probe = chip(ctx, o.text, {x: 0, y: 0, anchor: 'start', maxWidth, size, maxLines});
    if (probe.fit.truncated) return;
    const w = probe.box.w, hh = probe.box.h;
    for (const T of o.targets) {
      for (let y = R.y0; y + hh <= R.y1; y += 8) {
        for (let x = R.x0; x + w <= R.x1; x += 10) {
          const b = {x, y, w, h: hh};
          const blocked = o.obstacles.filter(q => hit(b, q, 10)).length;
          const from = {x: Math.max(b.x, Math.min(T.x, b.x + b.w)), y: T.y > b.y + b.h ? b.y + b.h : T.y < b.y ? b.y : b.y + b.h / 2};
          if (from.y === b.y + b.h / 2) from.x = T.x > b.x + b.w / 2 ? b.x + b.w : b.x;
          const len = Math.hypot(T.x - from.x, T.y - from.y);
          let cross = 0;
          for (let k = 1; k < 24; k++) {
            const p = {x: from.x + (T.x - from.x) * k / 24, y: from.y + (T.y - from.y) * k / 24};
            if (o.obstacles.some(q => inside(p, q, 5))) cross++;
          }
          const score = blocked * 5000 + cross * 400 + len + (len < 36 ? 300 : 0) + (T.penalty || 0) + wi * 40;
          if (!best || score < best.score) best = {score, b, T, maxWidth};
        }
      }
    }
  });
  if (!best) {
    const probe = chip(ctx, o.text, {x: 0, y: 0, anchor: 'start', maxWidth: full, size, maxLines});
    best = {b: {x: R.x0, y: R.y0, w: probe.box.w, h: probe.box.h}, T: o.targets[0], maxWidth: full};
  }
  const note = callout(ctx, {name: o.name, text: o.text, chipAt: {x: best.b.x, y: best.b.y}, anchor: 'start', target: best.T, maxWidth: best.maxWidth, size, maxLines});
  return {...note, box: best.b, target: best.T};
}

/** Small pill tag (used for "Later version"); local node, named for opacity. */
function chipTag(ctx, text, o) {
  const th = ctx.theme;
  const f = ctx.fit(text, {maxWidth: 300, size: 22, minSize: 16, maxLines: 1, weight: 700});
  const w = f.width + 30, hh = f.size + 16;
  const node = g({name: o.name, opacity: 0},
    g(null,
      h('path', {d: roundRectPath(o.x - w / 2, o.y, w, hh, hh / 2), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '7 5'}),
      textBlock(f, {x: o.x, y: o.y + 8, anchor: 'middle', fill: th.inkSoft})));
  return {node, w, h: hh};
}

/* ------------------------------------------------------------------------ */
/* Mechanism art: exploded isometric layers and flat component icons        */
/* ------------------------------------------------------------------------ */

/**
 * One version as an isometric plate (sheet lying flat, seen from above).
 * Local origin = centre of the top face. The top face carries real sheet art
 * (passage highlight and text lines) mapped with an affine matrix.
 */
export function isoPlate(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {a, b, t, color} = o;
  const face = `M0 ${-b}L${a} 0L0 ${b}L${-a} 0Z`;
  const k = 0.01;
  const M = `matrix(${r(a * k, 4)} ${r(b * k, 4)} ${r(-a * k, 4)} ${r(b * k, 4)} 0 ${-b})`;
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const lw = 62 + ctx.rng('hist-iso', o.index * 10 + i) * 22;
    lines.push(h('rect', {x: 12, y: 44 + i * 8.5, width: r(i === 5 ? lw * 0.55 : lw), height: 3.6, rx: 1.6, fill: th.paperLine}));
  }
  const paper = g({name: `${P}-paper`},
    h('path', {d: `M0 ${-b + t + 10}L${a} ${t + 10}L0 ${b + t + 10}L${-a} ${t + 10}Z`, fill: th.shadow}),
    h('path', {d: `M${-a} 0L0 ${b}V${b + t}L${-a} ${t}Z`, fill: shade(color, -0.12), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${a} 0L0 ${b}V${b + t}L${a} ${t}Z`, fill: shade(color, -0.3), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: face, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    g({transform: M},
      h('rect', {x: 10, y: 10, width: 26, height: 7, rx: 2, fill: color}),
      h('rect', {x: 40, y: 11, width: 34, height: 5, rx: 2, fill: th.inkFaint}),
      h('rect', {x: 10, y: 25, width: 78, height: 11, rx: 2.4, fill: th.highlight, opacity: 0.85}),
      h('rect', {x: 14, y: 28.6, width: 60 + o.index * 5, height: 3.8, rx: 1.6, fill: th.inkSoft}),
      lines),
  );
  const hl = g({name: `${P}-hl`, opacity: 0},
    h('path', {d: face, fill: 'none', stroke: th.accentSoft, 'stroke-width': 16, 'stroke-linejoin': 'round'}),
    h('path', {d: face, fill: 'none', stroke: th.accent, 'stroke-width': 6, 'stroke-linejoin': 'round'}));
  const ghost = h('path', {name: `${P}-ghost`, d: `${face}M${-a} 0V${t}L0 ${b + t}L${a} ${t}V0`, fill: 'none', stroke: th.dark ? th.fgSoft : th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '11 8', 'stroke-linejoin': 'round', opacity: 0});
  return {node: g({name: P}, paper, hl, ghost)};
}

/** Point where the ray from the plate centre toward `toward` leaves the rhombus. */
export function rhombusAnchor(c, a, b, toward, pad = 0) {
  const dx = toward.x - c.x, dy = toward.y - c.y;
  const d = Math.abs(dx) / (a + pad) + Math.abs(dy) / (b + pad * 0.5);
  if (d === 0) return {x: c.x, y: c.y};
  return {x: c.x + dx / d, y: c.y + dy / d};
}

/** Flat search bar (the search box as a component). */
export function searchBar(ctx, o) {
  const th = ctx.theme;
  const {x, y, w} = o;
  const showKey = ctx.show('key');
  const qFit = showKey ? ctx.fit(o.query, {maxWidth: w - 110, size: 30, minSize: 19, maxLines: 2, weight: 600}) : null;
  const hh = Math.max(84, qFit ? qFit.height + 40 : 84);
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 9, w, hh, hh / 2), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, 42)), fill: th.card, stroke: th.accent2, 'stroke-width': 4}),
    h('circle', {cx: x + 46, cy: y + hh / 2, r: 26, fill: th.accent2}),
    magnifier(x + 48, y + hh / 2 + 2, 30, '#fff'),
  ];
  if (qFit) parts.push(textBlock(qFit, {x: x + 88, y: y + (hh - qFit.height) / 2, fill: th.ink}));
  else parts.push(h('rect', {x: x + 88, y: y + hh / 2 - 8, width: w * 0.5, height: 16, rx: 5, fill: th.inkSoft}));
  return {node: g(null, parts), box: {x, y, w, h: hh}};
}

/**
 * The consolidated file seen face-on (the document component): cover with a
 * label window, the edges of the loose sheets and one coloured tab per version.
 */
export function consolidatedFile(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh, n} = o;
  const parts = [h('path', {d: roundRectPath(x + 8, y + 10, w, hh, 10), fill: th.shadow})];
  for (let i = n - 1; i >= 0; i--) {
    parts.push(h('rect', {x: x + 14 + i * 7, y: y + 10 + i * 7, width: w - 20, height: hh - 16, rx: 5, fill: th.paper, stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('path', {d: `M${x + w - 6 + i * 7} ${y + 30 + i * 34}h16q6 0 6 6v18q0 6 -6 6h-16z`, fill: versionColor(ctx, i), stroke: th.ink, 'stroke-width': 2}));
  }
  parts.push(h('path', {d: roundRectPath(x, y, w - 10, hh - 10, 10), fill: VOLUME_COLOR, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('rect', {x, y, width: 18, height: hh - 10, rx: 6, fill: shade(VOLUME_COLOR, -0.3)}));
  const lw = w - 64;
  // label window grows with the (never truncated) citation, up to five lines
  const f = ctx.show('all') && o.label ? ctx.fit(o.label, {maxWidth: lw - 20, size: 24, minSize: 13, maxLines: 5, weight: 700}) : null;
  const winH = Math.min(hh - 76, Math.max(hh * 0.36, f ? f.height + 20 : 0));
  parts.push(h('rect', {x: x + 34, y: y + 30, width: lw, height: winH, rx: 6, fill: '#f3ead6', stroke: th.ink, 'stroke-width': 2}));
  if (f) {
    parts.push(textBlock(f, {x: x + 34 + lw / 2, y: y + 30 + (winH - f.height) / 2, anchor: 'middle', fill: th.ink}));
  } else {
    parts.push(h('rect', {x: x + 50, y: y + 50, width: lw - 32, height: 12, rx: 4, fill: th.inkSoft}));
  }
  parts.push(h('circle', {cx: x + (w - 10) / 2 + 8, cy: Math.max(y + hh * 0.74, y + 30 + winH + 30), r: 18, fill: shade(VOLUME_COLOR, -0.35), stroke: th.ink, 'stroke-width': 2}));
  return {node: g(null, parts), box: {x, y, w: w + 16, h: hh}};
}
