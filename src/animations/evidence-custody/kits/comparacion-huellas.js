/**
 * Motif kit for "Comparación de huellas digitales" (evidence-custody-07, LAW-0385..0388): a fingerprint COMPARISON
 * station on the category's evidence bench. Geometry and art only; each entry owns its timeline, layout and semantics.
 *
 *  - LIGHT BOX: a steel-rimmed glowing comparison panel with two card rows (reference row on top, lifted row below)
 *    and a wide gap between the rows where segment pairs are linked.
 *  - PRINT CARD: a white card with a stylised (abstract, fictional) ridge pattern in an oval. The LIFTED card has a
 *    manila top strip, the REFERENCE card a slate strip (no text needed to tell them apart). An eyelet on its right
 *    edge carries a SYMBOLIC CHAIN: square tiles joined by short ball-chain links, one tile per supplied segment, each
 *    tile showing one abstract glyph (arc, loop, fork, dot, ending). The chains are symbolic stand-ins, not real
 *    fingerprint features or any method.
 *  - LINKS between the tile pair of one segment: equal supplied values = a plain bridge with end dots; differing
 *    supplied values = two short open stubs that do not meet (neutral accent, no cross, no red, no tick).
 *  - READING FRAME: a translucent column frame with a steel handle; it spans one tile of each chain and is slid from
 *    segment to segment.
 *  - The object (category kit), its open evidence bag and its manila tag on a ball chain complete the station.
 *
 * Neutral by design: a bridge only says that the two supplied values are the same symbol; nothing about identity,
 * reliability, admissibility or any outcome.
 * @module animations/evidence-custody/kits/comparacion-huellas
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {
  INK, METAL, METAL_DARK, MANILA, MANILA_DARK, objectModel, objectArt, tagModel, tagArt, bagModel, bagBack, bagFront,
  legendIcon, textAt, chainD, panelLayout,
} from './evidence-art.js';

export const SYMBOLS = ['arc', 'loop', 'fork', 'dot', 'end'];
export const CARD_A = MANILA;
export const CARD_B = '#7d93a8';
export const PRINT_INK = '#3d4650';
export const GLASS = '#f6fbfd';

/* ------------------------------------------------------------------ */
/* Fields and defaults                                                 */
/* ------------------------------------------------------------------ */

export const fcFields = {
  segments: list('Segment pairs of the two symbolic chains, left to right: a = symbol on the lifted card\'s chain, b = symbol on the reference card\'s chain (equal symbols are bridged, differing ones left open — as supplied)', obj('Segment pair', {
    a: oneOf('Symbol on the lifted chain', SYMBOLS),
    b: oneOf('Symbol on the reference chain', SYMBOLS),
  }, ['a', 'b']), 3, 6),
  cards: obj('Captions of the two print cards (fictional)', {
    a: str('Caption of the lifted card (chain on the lower row)', 70),
    b: str('Caption of the reference card (chain on the upper row)', 70),
  }, ['a', 'b']),
  matchLabels: obj('Captions of the two pair states (descriptive only)', {
    same: str('Caption for a pair with equal values (bridge)', 90),
    differ: str('Caption for a pair with differing values (open stubs)', 90),
  }, ['same', 'differ']),
  labels: obj('Editable captions', {
    key: str('Neutral key (must say that no conclusion is drawn)', 80),
    blank: str('Text shown for a tag row the author left blank', 50),
  }, ['key', 'blank']),
};

const SEG_DEFAULT = [{a: 'arc', b: 'arc'}, {a: 'fork', b: 'fork'}, {a: 'loop', b: 'loop'}, {a: 'end', b: 'dot'}, {a: 'dot', b: 'dot'}];

export const FC_EN = {
  items: [{id: 'Item E-07 (fictional)', label: 'Mug left on a counter (fictional)', kind: 'cup'}],
  custodians: [{name: 'L. Moreau (fictional)', role: 'Person comparing the cards'}],
  timestamps: [{label: 'Print lifted', time: '11:20 (illustrative)'}, {label: 'Comparison noted', time: '11:48 (illustrative)'}],
  records: [
    {field: 'Item no.', value: 'E-07'},
    {field: 'Description', value: 'Drinking mug'},
    {field: 'Lifted by', value: 'L. Moreau'},
    {field: 'Card', value: 'Lift 1'},
  ],
  segments: SEG_DEFAULT,
  cards: {a: 'Lifted card (from the mug, fictional)', b: 'Reference card (fictional)'},
  matchLabels: {same: 'Bridge: same symbol supplied', differ: 'Open stubs: different symbols supplied'},
  labels: {key: 'As supplied · no conclusion drawn', blank: '(left blank, as supplied)'},
};
export const FC_ES = {
  items: [{id: 'Indicio E-07 (ficticio)', label: 'Taza en una encimera (ficticia)', kind: 'cup'}],
  custodians: [{name: 'L. Moreau (ficticia)', role: 'Persona que compara las tarjetas'}],
  timestamps: [{label: 'Huella levantada', time: '11:20 (ilustrativo)'}, {label: 'Comparación anotada', time: '11:48 (ilustrativo)'}],
  records: [
    {field: 'N.º de indicio', value: 'E-07'},
    {field: 'Descripción', value: 'Taza'},
    {field: 'Levantada por', value: 'L. Moreau'},
    {field: 'Tarjeta', value: 'Levantamiento 1'},
  ],
  segments: SEG_DEFAULT,
  cards: {a: 'Tarjeta levantada (de la taza, ficticia)', b: 'Tarjeta de referencia (ficticia)'},
  matchLabels: {same: 'Puente: mismo símbolo aportado', differ: 'Tramos abiertos: símbolos distintos aportados'},
  labels: {key: 'Según lo aportado · sin conclusión', blank: '(en blanco, según lo aportado)'},
};

export const SYMBOL_NAMES = {
  en: {arc: 'arc', loop: 'loop', fork: 'fork', dot: 'dot', end: 'ending'},
  es: {arc: 'arco', loop: 'lazo', fork: 'bifurcación', dot: 'punto', end: 'final'},
};

export const fcRecords = P => P.records.map(rw => ({...rw, filled: String(rw.value || '').trim().length > 0}));
export const fcRecordLine = (rw, blank) => `${rw.field}: ${rw.filled ? rw.value : blank}`;
export const sameAt = (segs, i) => segs[i].a === segs[i].b;

/* ------------------------------------------------------------------ */
/* Geometry (units of one tile side)                                   */
/* ------------------------------------------------------------------ */

export const U = {cw: 2.0, ch: 2.4, cg: 0.55, tg: 0.42, pad: 0.45, rowGap: 1.3, rw: 1.4, handle: 0.95};

/** Card assembly model (local origin = card top-left), sized for n tiles of side ts. */
export function cardModel(n, ts) {
  const cw = U.cw * ts, ch = U.ch * ts, cg = U.cg * ts, tg = U.tg * ts;
  const tile = i => ({x: cw + cg + ts * 0.5 + i * (ts + tg), y: ch / 2});
  const AW = cw + cg + n * ts + (n - 1) * tg;
  return {n, ts, cw, ch, cg, tg, AW, tile, eye: {x: cw - ts * 0.16, y: ch / 2}};
}

/** Reading frame model (local origin = frame centre). */
export function readerModel(ts, span) {
  const w = U.rw * ts, hh = span + 1.4 * ts;
  return {ts, w, h: hh, grip: {x: 0, y: hh / 2 + U.handle * ts * 0.62}, len: hh + U.handle * ts};
}

/** World point of a local point under pose {x, y, a(deg)}. */
export function poseAt(p, l) {
  const a = (p.a || 0) * Math.PI / 180;
  return {x: p.x + l.x * Math.cos(a) - l.y * Math.sin(a), y: p.y + l.x * Math.sin(a) + l.y * Math.cos(a)};
}

/**
 * Comparison station stage, fitted into `box`.
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {{n:number, rows:number, kind:string, arrangement:'wide'|'tall', cardRest?:boolean, reader?:boolean, tsCap?:number, bagSide?:'left'|'right'}} o
 */
export function fcStage(box, o) {
  const n = o.n;
  const AWu = U.cw + U.cg + n + (n - 1) * U.tg;
  const LBw = AWu + U.pad * 2, LBh = U.ch * 2 + U.rowGap + U.pad * 2;
  const bagW = 3.0, bagH = 3.3, zoneW = 3.25, zoneH = bagH + 1.5;
  const restDy = o.cardRest ? 1.95 : 0;
  const readerLen = (U.ch + U.rowGap) + 1.4 + U.handle;
  let lay;
  if (o.arrangement === 'wide') {
    const lbx = zoneW + 0.55;
    const rx = lbx + LBw + (o.reader === false ? 0 : 0.5 + U.rw / 2);
    const W = o.reader === false ? lbx + LBw : rx + U.rw / 2 + 0.05;
    const H = LBh + (o.cardRest ? restDy - U.pad + 0.35 : 0);
    lay = {W, H: Math.max(H, zoneH + 0.2), zone: {x: 0, y: 0}, lb: {x: lbx, y: 0}, park: {x: rx, y: Math.min(LBh, H) / 2 + 0.1, a: 0}};
  } else if (o.arrangement === 'wideLow') {
    const lbx = zoneW + 0.55;
    const W = lbx + LBw;
    const H = LBh + Math.max(o.cardRest ? restDy - U.pad + 0.35 : 0, U.rw + 0.5);
    lay = {W, H, zone: {x: 0, y: 0}, lb: {x: lbx, y: 0}, park: {x: W - readerLen / 2 - 0.1 + U.handle / 2, y: LBh + 0.25 + U.rw / 2, a: -90}};
  } else {
    const topH = zoneH + 0.35;
    const W = Math.max(LBw, zoneW + (o.reader === false ? 0 : 0.6 + readerLen));
    const H = topH + LBh + (o.cardRest ? restDy - U.pad + 0.35 : 0);
    const px = zoneW + 0.6 + readerLen / 2 - U.handle / 2;
    lay = {W, H, zone: {x: 0, y: 0}, lb: {x: (W - LBw) / 2, y: topH}, park: {x: Math.min(px, W - readerLen / 2 - 0.05), y: zoneH * 0.48, a: -90}};
  }
  let ts = Math.min(box.w / lay.W, box.h / lay.H);
  if (o.tsCap) ts = Math.min(ts, o.tsCap);
  const ox = box.x + (box.w - lay.W * ts) / 2, oy = box.y + (box.h - lay.H * ts) / 2;
  const P = (x, y) => ({x: ox + x * ts, y: oy + y * ts});
  const mir = o.bagSide === 'right';
  const CM = cardModel(n, ts);
  const LB = {...P(lay.lb.x, lay.lb.y), w: LBw * ts, h: LBh * ts};
  const slotB = {x: LB.x + U.pad * ts, y: LB.y + U.pad * ts};
  const slotA = {x: slotB.x, y: slotB.y + (U.ch + U.rowGap) * ts};
  const restA = o.cardRest ? {x: slotA.x - 0.45 * ts, y: slotA.y + restDy * ts, a: -4} : {...slotA, a: 0};
  const tileB = i => ({x: slotB.x + CM.tile(i).x, y: slotB.y + CM.tile(i).y});
  const tileA = i => ({x: slotA.x + CM.tile(i).x, y: slotA.y + CM.tile(i).y});
  const span = (U.ch + U.rowGap) * ts;
  const RM = readerModel(ts, span);
  const column = i => ({x: tileA(i).x, y: (tileA(i).y + tileB(i).y) / 2, a: 0});
  const park = {...P(lay.park.x, lay.park.y), a: lay.park.a};
  // bag zone: open bag with the object; tag on its ball chain just below the bag
  const zx = P(lay.zone.x, lay.zone.y);
  const B = bagModel(bagW * ts, bagH * ts);
  const bag = {x: zx.x + 0.1 * ts, y: zx.y + 0.05 * ts, B};
  const S = 2.05 * ts;
  const M = objectModel(o.kind, S);
  const objC = {x: bag.x + B.inner.x + B.inner.w / 2, y: bag.y + B.inner.y + B.inner.h / 2 + 0.1 * ts};
  const anchor = {x: objC.x + M.anchor.x, y: objC.y + M.anchor.y};
  const T0 = tagModel({w: 2.75 * ts, h: 1.25 * ts, rows: o.rows});
  const hole = {x: bag.x + 0.42 * ts, y: bag.y + B.h + 0.78 * ts};
  void mir;
  const xs = [LB.x, LB.x + LB.w, bag.x, bag.x + B.w, hole.x + T0.x1];
  const ys = [LB.y, LB.y + LB.h, bag.y, hole.y + T0.h / 2];
  if (o.cardRest) { ys.push(restA.y + CM.ch + 0.2 * ts); xs.push(restA.x); }
  if (o.reader !== false) {
    const ends = park.a ? [{x: park.x - RM.len / 2, y: park.y - RM.w / 2}, {x: park.x + RM.len / 2, y: park.y + RM.w / 2}] : [{x: park.x - RM.w / 2, y: park.y - RM.h / 2}, {x: park.x + RM.w / 2, y: park.y + RM.h / 2 + U.handle * ts}];
    ends.forEach(e => { xs.push(e.x); ys.push(e.y); });
  }
  const stageBox = {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  const fits = stageBox.x >= box.x - 2 && stageBox.y >= box.y - 2 && stageBox.x + stageBox.w <= box.x + box.w + 2 && stageBox.y + stageBox.h <= box.y + box.h + 2;
  return {ts, n, CM, LB, slotA, slotB, restA, tileA, tileB, RM, column, park, bag, S, M, objC, anchor, T0, hole, stageBox, fits, arrangement: o.arrangement, span};
}

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

/** Abstract glyph of a symbol (centred, tile side s). */
export function glyphPath(sym, s) {
  const k = v => r(v * s, 2);
  if (sym === 'loop') return `M${k(-0.22)} ${k(0.3)}V${k(-0.02)}A${k(0.22)} ${k(0.22)} 0 0 1 ${k(0.22)} ${k(-0.02)}V${k(0.3)}`;
  if (sym === 'fork') return `M${k(-0.3)} ${k(0.3)}L0 ${k(0.02)}L${k(0.3)} ${k(0.3)}M0 ${k(0.02)}V${k(-0.32)}`;
  if (sym === 'dot') return `M${k(-0.32)} ${k(-0.16)}H${k(0.32)}`;
  if (sym === 'end') return `M${k(-0.32)} ${k(-0.13)}H${k(0.32)}M${k(-0.32)} ${k(0.17)}H${k(0.04)}`;
  return `M${k(-0.32)} ${k(0.2)}Q0 ${k(-0.46)} ${k(0.32)} ${k(0.2)}`;
}

export function glyphArt(sym, s, o = {}) {
  const sw = Math.max(2.4, s * 0.1);
  return g({name: o.name, opacity: o.opacity},
    h('path', {d: glyphPath(sym, s), fill: 'none', stroke: o.color || INK, 'stroke-width': r(sw, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    sym === 'dot' ? h('circle', {cx: 0, cy: r(s * 0.17, 2), r: r(s * 0.1, 2), fill: o.color || INK}) : null,
    sym === 'end' ? h('circle', {cx: r(s * 0.04, 2), cy: r(s * 0.17, 2), r: r(sw * 0.75, 2), fill: o.color || INK}) : null,
  );
}

/** Tile body (centred). */
export function tileBody(s, o = {}) {
  return g(null,
    h('path', {d: roundRectPath(-s / 2 + 2, -s / 2 + 4, s, s, s * 0.16), fill: '#000', opacity: 0.18}),
    h('path', {d: roundRectPath(-s / 2, -s / 2, s, s, s * 0.16), fill: o.fill || '#fbfaf6', stroke: INK, 'stroke-width': r(Math.max(2, s * 0.045), 2)}),
  );
}

/** Abstract ridge pattern in an oval (centred at 0,0; rx, ry). Purely decorative and fictional. */
export function ridgeArt(ctx, rx, ry, key) {
  const clip = `${key}-oval`;
  const d = [];
  const N = 8;
  for (let k = 1; k <= N; k++) {
    const a = rx * (0.13 * k + 0.02), c = ry * (0.11 * k + 0.08), b = ry * 1.1;
    const cy = ry * 0.18;
    d.push(`M${r(-a)} ${r(b)}C${r(-a)} ${r(cy - c * 1.25)} ${r(a)} ${r(cy - c * 1.25)} ${r(a)} ${r(b)}`);
  }
  const sw = Math.max(1.6, rx * 0.06);
  const breaks = Array.from({length: N}, (_, i) => `${r(rx * (1.2 + ctx.rng(`${key}-b`, i) * 1.6))} ${r(rx * (0.08 + ctx.rng(`${key}-c`, i) * 0.12))}`);
  return g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('ellipse', {cx: 0, cy: 0, rx: r(rx), ry: r(ry)}))),
    h('ellipse', {cx: 0, cy: 0, rx: r(rx), ry: r(ry), fill: '#eef1f2'}),
    g({'clip-path': ctx.ref(clip)}, d.map((p, i) => h('path', {d: p, fill: 'none', stroke: PRINT_INK, 'stroke-width': r(sw, 2), 'stroke-linecap': 'round', 'stroke-dasharray': breaks[i]}))),
    h('ellipse', {cx: 0, cy: 0, rx: r(rx), ry: r(ry), fill: 'none', stroke: shade('#eef1f2', -0.25), 'stroke-width': 1.4}),
  );
}

/** The ball chain path of a card assembly (eyelet → tile 0 → … → tile n-1), local coords. */
function chainLinks(CM) {
  const parts = [];
  let prev = CM.eye;
  for (let i = 0; i < CM.n; i++) {
    const t = CM.tile(i);
    parts.push(`M${r(prev.x + (i ? CM.ts * 0.5 : 0))} ${r(prev.y)}H${r(t.x - CM.ts * 0.5)}`);
    prev = t;
  }
  return parts.join('');
}

/**
 * Print card + symbolic chain (local origin = card top-left). Named nodes: `${prefix}-t${i}` (tile group, centred at
 * the tile), `${prefix}-g${i}` (glyph); with `alt` = {i, sym}, `${prefix}-x${i}` (alternative glyph, opacity 0).
 * @param {any} ctx
 * @param {ReturnType<typeof cardModel>} CM
 * @param {{prefix:string, symbols:string[], role:'a'|'b', name?:string, alt?:{i:number, sym:string}|null, blankTiles?:number[]}} o
 */
export function cardArt(ctx, CM, o) {
  const {cw, ch, ts} = CM;
  const strip = o.role === 'a' ? CARD_A : CARD_B;
  const bw = Math.max(5, ts * 0.17);
  const links = chainLinks(CM);
  return g({name: o.name},
    h('path', {d: links, fill: 'none', stroke: METAL_DARK, 'stroke-width': r(bw * 0.3, 2), 'stroke-linecap': 'round'}),
    h('path', {d: links, fill: 'none', stroke: METAL, 'stroke-width': r(bw, 2), 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.4, 2)}`}),
    h('path', {d: roundRectPath(4, 6, cw, ch, ts * 0.12), fill: '#000', opacity: 0.18}),
    h('path', {d: roundRectPath(0, 0, cw, ch, ts * 0.12), fill: '#fdfdfb', stroke: INK, 'stroke-width': r(Math.max(2, ts * 0.04), 2)}),
    h('path', {d: `M${r(ts * 0.12)} 0H${r(cw - ts * 0.12)}Q${r(cw)} 0 ${r(cw)} ${r(ts * 0.12)}V${r(ch * 0.15)}H0V${r(ts * 0.12)}Q0 0 ${r(ts * 0.12)} 0Z`, fill: strip, stroke: INK, 'stroke-width': r(Math.max(2, ts * 0.04), 2)}),
    o.role === 'a' ? h('path', {d: `M${r(cw * 0.12)} ${r(ch * 0.075)}H${r(cw * 0.55)}`, stroke: MANILA_DARK, 'stroke-width': r(ts * 0.06, 2), 'stroke-linecap': 'round'})
      : h('path', {d: `M${r(cw * 0.12)} ${r(ch * 0.075)}H${r(cw * 0.4)}M${r(cw * 0.52)} ${r(ch * 0.075)}H${r(cw * 0.7)}`, stroke: shade(CARD_B, 0.35), 'stroke-width': r(ts * 0.06, 2), 'stroke-linecap': 'round'}),
    g({transform: T(cw * 0.47, ch * 0.57, o.role === 'a' ? 7 : 0)}, ridgeArt(ctx, cw * 0.34, ch * 0.36, `${o.prefix}-r`)),
    h('circle', {cx: r(CM.eye.x), cy: r(CM.eye.y), r: r(ts * 0.11), fill: METAL, stroke: INK, 'stroke-width': 1.6}),
    o.symbols.map((sym, i) => {
      const t = CM.tile(i);
      const blank = o.blankTiles && o.blankTiles.includes(i);
      return g({name: `${o.prefix}-t${i}`, transform: T(t.x, t.y)},
        tileBody(ts),
        blank ? null : glyphArt(sym, ts, {name: `${o.prefix}-g${i}`}),
        o.alt && o.alt.i === i ? glyphArt(o.alt.sym, ts, {name: `${o.prefix}-x${i}`, opacity: 0}) : null);
    }),
  );
}

/** Empty slot outline for a card row (world coords). */
export function slotOutline(CM, at) {
  return h('path', {d: roundRectPath(at.x, at.y, CM.cw, CM.ch, CM.ts * 0.12), fill: '#ffffff', 'fill-opacity': 0.35, stroke: '#9fb3bf', 'stroke-width': 2.5, 'stroke-dasharray': '10 8'});
}

/** Light box (world coords). */
export function lightBoxArt(ctx, LB, o = {}) {
  const rad = Math.min(LB.w, LB.h) * 0.05;
  const rim = Math.max(8, LB.h * 0.025);
  const grid = [];
  const step = Math.max(24, LB.h / 9);
  for (let x = LB.x + step; x < LB.x + LB.w - 4; x += step) grid.push(`M${r(x)} ${r(LB.y + rim)}V${r(LB.y + LB.h - rim)}`);
  for (let y = LB.y + step; y < LB.y + LB.h - 4; y += step) grid.push(`M${r(LB.x + rim)} ${r(y)}H${r(LB.x + LB.w - rim)}`);
  return g({name: o.name},
    h('path', {d: roundRectPath(LB.x + 6, LB.y + 10, LB.w, LB.h, rad), fill: '#000', opacity: 0.2}),
    h('path', {d: roundRectPath(LB.x, LB.y, LB.w, LB.h, rad), fill: '#8e989d', stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(LB.x + rim, LB.y + rim, LB.w - rim * 2, LB.h - rim * 2, rad * 0.6), fill: GLASS}),
    h('path', {d: grid.join(''), stroke: '#d5e4ea', 'stroke-width': 1.4, fill: 'none'}),
    h('path', {d: roundRectPath(LB.x + rim, LB.y + rim, LB.w - rim * 2, LB.h - rim * 2, rad * 0.6), fill: 'none', stroke: '#b9cdd6', 'stroke-width': 2}),
    h('circle', {cx: r(LB.x + LB.w - rim * 0.5), cy: r(LB.y + LB.h * 0.5), r: r(rim * 0.32), fill: '#fff6c8', stroke: INK, 'stroke-width': 1.2}),
  );
}

/**
 * Link between the tile pair of one segment (world coords, top = reference tile bottom, bot = lifted tile top).
 * same: plain bridge with end dots (`${name}-bar` drawn via stroke-dashoffset on pathLength 100). differ: two open
 * stubs that do not meet (`${name}-stubA` / `-stubB`, same mechanism).
 */
export function linkArt(ctx, name, top, bot, same, ts) {
  const th = ctx.theme;
  const sw = Math.max(4, ts * 0.09);
  if (same) {
    return g({name, opacity: 0},
      h('path', {name: `${name}-bar`, d: `M${r(top.x)} ${r(top.y)}V${r(bot.y)}`, stroke: INK, 'stroke-width': r(sw, 2), 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '100 102', 'stroke-dashoffset': 100}),
      h('circle', {cx: r(top.x), cy: r(top.y), r: r(sw * 1.25, 2), fill: INK}),
      h('circle', {cx: r(bot.x), cy: r(bot.y), r: r(sw * 1.25, 2), fill: INK}),
    );
  }
  const L = bot.y - top.y;
  const c = th.accent2;
  const s1 = top.y + L * 0.32, s2 = bot.y - L * 0.32;
  const tick = ts * 0.24;
  return g({name, opacity: 0},
    h('path', {name: `${name}-stubA`, d: `M${r(top.x)} ${r(top.y)}V${r(s1)}`, stroke: c, 'stroke-width': r(sw, 2), 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '100 102', 'stroke-dashoffset': 100}),
    h('path', {name: `${name}-stubB`, d: `M${r(bot.x)} ${r(bot.y)}V${r(s2)}`, stroke: c, 'stroke-width': r(sw, 2), 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '100 102', 'stroke-dashoffset': 100}),
    h('path', {d: `M${r(top.x - tick)} ${r(s1)}H${r(top.x + tick)}M${r(bot.x - tick)} ${r(s2)}H${r(bot.x + tick)}`, stroke: c, 'stroke-width': r(sw * 0.8, 2), 'stroke-linecap': 'round'}),
    h('circle', {cx: r(top.x), cy: r(top.y), r: r(sw * 1.25, 2), fill: c}),
    h('circle', {cx: r(bot.x), cy: r(bot.y), r: r(sw * 1.25, 2), fill: c}),
  );
}

/** Frame props for a link drawn to progress k (0..1). */
export function linkProps(name, same, k) {
  const off = r(100 * (1 - k), 2);
  const out = {[name]: {opacity: k > 0 ? 1 : 0}};
  if (same) out[`${name}-bar`] = {'stroke-dashoffset': off};
  else { out[`${name}-stubA`] = {'stroke-dashoffset': off}; out[`${name}-stubB`] = {'stroke-dashoffset': off}; }
  return out;
}

/** Reading frame (local origin = frame centre; handle along +y). */
export function readerArt(ctx, RM, o = {}) {
  const {w, h: hh, ts} = RM;
  const bw = Math.max(5, ts * 0.12);
  const hl = U.handle * ts;
  return g({name: o.name},
    h('path', {d: roundRectPath(-w / 2 + 5, -hh / 2 + 8, w, hh, ts * 0.18), fill: '#000', opacity: 0.12}),
    h('rect', {x: r(-ts * 0.16), y: r(hh / 2 - 2), width: r(ts * 0.32), height: r(hl), rx: r(ts * 0.1), fill: METAL_DARK, stroke: INK, 'stroke-width': 2}),
    h('rect', {x: r(-ts * 0.26), y: r(hh / 2 + hl * 0.35), width: r(ts * 0.52), height: r(hl * 0.6), rx: r(ts * 0.12), fill: '#3c4248', stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, ts * 0.18), fill: '#9cc8e6', 'fill-opacity': 0.16, stroke: METAL_DARK, 'stroke-width': r(bw, 2)}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, ts * 0.18), fill: 'none', stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: `M${r(-w / 2)} 0h${r(ts * 0.22)}M${r(w / 2)} 0h${r(-ts * 0.22)}`, stroke: METAL_DARK, 'stroke-width': r(bw * 0.6, 2)}),
  );
}

/** Object in its open bag with the tag on a ball chain (world coords). */
export function stationBag(ctx, G, o) {
  const bw = Math.max(5, G.ts * 0.15);
  const d = chainD(G.anchor, G.hole, G.ts * 0.35);
  return g({name: o.name},
    g({transform: T(G.bag.x, G.bag.y)}, bagBack(ctx, G.bag.B, {})),
    g({transform: T(G.objC.x, G.objC.y)}, objectArt(ctx, G.M)),
    g({transform: T(G.bag.x, G.bag.y)}, bagFront(ctx, G.bag.B, {})),
    g({transform: T(G.hole.x, G.hole.y, 4)}, tagArt(ctx, G.T0, {prefix: `${o.prefix}-tag`, rows: o.rows.map(rw => ({filled: rw.filled, len: 0.8})), seedKey: 'fc'})),
    h('path', {d, fill: 'none', stroke: METAL_DARK, 'stroke-width': r(bw * 0.3, 2), 'stroke-linecap': 'round'}),
    h('path', {d, fill: 'none', stroke: METAL, 'stroke-width': r(bw, 2), 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.35, 2)}`}),
  );
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

export function fcIcon(ctx, kind, s, o = {}) {
  if (kind === 'fc-cardA' || kind === 'fc-cardB') {
    const a = kind === 'fc-cardA';
    return g(null,
      h('rect', {x: r(-s * 0.3), y: r(-s * 0.4), width: r(s * 0.6), height: r(s * 0.8), rx: 3, fill: '#fdfdfb', stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-s * 0.3), y: r(-s * 0.4), width: r(s * 0.6), height: r(s * 0.16), rx: 2, fill: a ? CARD_A : CARD_B, stroke: INK, 'stroke-width': 1.2}),
      h('ellipse', {cx: 0, cy: r(s * 0.08), rx: r(s * 0.17), ry: r(s * 0.21), fill: 'none', stroke: PRINT_INK, 'stroke-width': 1.6}),
      h('ellipse', {cx: 0, cy: r(s * 0.12), rx: r(s * 0.08), ry: r(s * 0.1), fill: 'none', stroke: PRINT_INK, 'stroke-width': 1.4}),
    );
  }
  if (kind === 'fc-same' || kind === 'fc-differ') {
    const t = s * 0.38;
    return g(null,
      g({transform: T(0, -s * 0.3)}, tileBody(t)),
      g({transform: T(0, s * 0.3)}, tileBody(t)),
      kind === 'fc-same' ? h('path', {d: `M0 ${r(-s * 0.1)}V${r(s * 0.1)}`, stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round'})
        : h('path', {d: `M0 ${r(-s * 0.11)}v${r(s * 0.06)}M0 ${r(s * 0.11)}v${r(-s * 0.06)}M${r(-s * 0.08)} ${r(-s * 0.05)}h${r(s * 0.16)}M${r(-s * 0.08)} ${r(s * 0.05)}h${r(s * 0.16)}`, stroke: ctx.theme.accent2, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    );
  }
  if (kind === 'fc-reader') {
    return g(null,
      h('rect', {x: r(-s * 0.18), y: r(-s * 0.44), width: r(s * 0.36), height: r(s * 0.64), rx: 4, fill: '#9cc8e6', 'fill-opacity': 0.3, stroke: METAL_DARK, 'stroke-width': 3}),
      h('rect', {x: r(-s * 0.06), y: r(s * 0.2), width: r(s * 0.12), height: r(s * 0.24), rx: 2, fill: '#3c4248'}),
    );
  }
  if (kind === 'fc-lightbox') {
    return g(null,
      h('rect', {x: r(-s * 0.44), y: r(-s * 0.32), width: r(s * 0.88), height: r(s * 0.64), rx: 4, fill: '#8e989d', stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-s * 0.36), y: r(-s * 0.24), width: r(s * 0.72), height: r(s * 0.48), rx: 3, fill: GLASS}),
    );
  }
  if (kind === 'fc-chain') {
    const t = s * 0.3;
    return g(null,
      h('path', {d: `M${r(-s * 0.45)} 0H${r(s * 0.45)}`, stroke: METAL, 'stroke-width': r(s * 0.12), 'stroke-dasharray': `0.01 ${r(s * 0.16)}`, 'stroke-linecap': 'round'}),
      g({transform: T(-s * 0.22, 0)}, tileBody(t), glyphArt('arc', t)),
      g({transform: T(s * 0.22, 0)}, tileBody(t), glyphArt('fork', t)),
    );
  }
  if (kind.startsWith('fc-sym-')) {
    const t = s * 0.72;
    return g(null, tileBody(t), glyphArt(kind.slice(7), t));
  }
  return legendIcon(ctx, kind, s, o);
}

/** Legend panel node (local origin = top-left). Every row is a named group. */
export function fcPanelNode(ctx, PL) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, PL.w, row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(PL.w), y1: r(row.y - F * 0.28), y2: r(row.y - F * 0.28), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.8, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, fcIcon(ctx, row.icon, F * 1.3, {color: row.color, key: row.name})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}

/**
 * Legend placement: 'side' (a right-hand column, pw = share of the design width) or 'below' (cols columns under the
 * scene). Returns the free area for the scene and the fitted panel columns.
 */
export function fcLegendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  if (!rows.length) return {area: {x: 0, y: 0, w: DW, h: DH}, panel: null, PL: null};
  if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [panelLayout(ctx, rows, {w: colW, F})];
    if (cols === 2) {
      let best = null;
      for (let i = 1; i < rows.length; i++) {
        const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      if (best) PLs = best.cols;
    }
    if (cols === 3 && rows.length >= 3) {
      const one = rows.map(rw => panelLayout(ctx, [rw], {w: colW, F}).h + F * 0.5);
      let best3 = null;
      for (let i = 1; i < rows.length - 1; i++) for (let j = i + 1; j < rows.length; j++) {
        const hs = [one.slice(0, i), one.slice(i, j), one.slice(j)].map(a => a.reduce((x, y) => x + y, 0));
        const hh = Math.max(...hs);
        if (!best3 || hh < best3.h) best3 = {h: hh, i, j};
      }
      PLs = [rows.slice(0, best3.i), rows.slice(best3.i, best3.j), rows.slice(best3.j)].map(rr => panelLayout(ctx, rr, {w: colW, F}));
    }
    const ph = Math.max(...PLs.map(q => q.h));
    return {area: {x: 0, y: 0, w: DW, h: DH - ph - gap}, panel: {x: 4, y: DH - ph}, PL: {cols: PLs, h: ph, ok: PLs.every(q => q.ok) && ph < DH * 0.62, colW, F}};
  }
  const PW = DW * opt.pw;
  if (opt.cols === 2) {
    const colW = (PW - F * 1.2) / 2;
    let best = null;
    for (let i = 1; i < rows.length; i++) {
      const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
      if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
    }
    return {area: {x: 0, y: 0, w: DW - PW - gap, h: DH}, panel: {x: DW - PW, y: Math.max(0, (DH - best.h) / 2)}, PL: {cols: best.cols, h: best.h, ok: best.cols.every(q => q.ok) && best.h <= DH, colW, F}};
  }
  const one = panelLayout(ctx, rows, {w: PW, F});
  return {area: {x: 0, y: 0, w: DW - PW - gap, h: DH}, panel: {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)}, PL: {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW, F}};
}

/** Legend panel groups for a fcLegendFor result. */
export function fcPanels(ctx, LG) {
  if (!LG.PL) return [];
  return LG.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(LG.panel.x + i * (LG.PL.colW + LG.PL.F * 1.2), LG.panel.y)}, fcPanelNode(ctx, PLc)));
}
