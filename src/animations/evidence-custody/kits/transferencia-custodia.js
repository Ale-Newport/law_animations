/**
 * "Transferencia de custodia" motif kit (evidence-custody-03, LAW-0369..0372). A hand-off of a sealed evidence bag
 * between TWO custodians across a counter, each one keeping a SEPARATE record sheet. The category look (steel bench
 * with green mat, gloved arms, objects, tag, ball chain, bag, legend icons, glue-aware text fitting) comes READ-ONLY
 * from ./evidence-art.js; everything specific to this motif is drawn here:
 *
 *  - HAND-OFF STAGE (top-down): custodian A stands at one end, custodian B at the other (drawn from above: shoulders,
 *    head, hair; A in a light lab coat, B in a slate jacket — appearance only, never a role or verdict). Each has an
 *    own steel desk with the green mat; a wooden COUNTER between the desks carries a marked hand-off tray (the shared
 *    hand-off point). Landscape-type boxes run A → B left to right ('h'); tall boxes run A → B top to bottom ('v').
 *  - BAG: the category's translucent evidence bag holding the fictional object; a manila TAG (etiqueta) lies on the
 *    bag and is joined to the bag's eyelet by a ball CHAIN (cadena). Bag, object, tag and chain move as one carried
 *    unit.
 *  - LOG SHEETS: one clipboard per custodian, in that custodian's lane colour (A blue clip, B amber clip — lane
 *    identity only), with a header badge and record rows (field stub + value line). A row is written (ink scribble,
 *    or printed text in enlarged views) or left blank exactly as supplied.
 *  - PENS: each custodian's second hand holds a pen; the pen tip follows the sampled scribble exactly while writing.
 *
 * Solvers: `tcStage` (all positions for a box and orientation) and `tcPose` (every hand / prop position of the
 * hand-off at an already-capped time: A carries the bag to the tray, both hands hold it at the shared point, B takes it
 * to B's desk; then A writes A's log and B writes B's log — unless the supplied state leaves B's log without entry).
 *
 * Neutral by design: a blank row or an unwritten log is drawn only because it was supplied; nothing here says what a
 * documentary gap means. No chain-of-custody doctrine.
 * @module animations/evidence-custody/kits/transferencia-custodia
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, lerp, seg, ease, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {topArm} from '../../../primitives/desk.js';
import {
  ecFields, objectModel, objectArt, tagModel, tagArt, chainNode, chainProps, bagModel, bagBack, bagFront, scribble,
  scribblePoints, legendIcon, textAt, fitG, benchNode, INK, GLOVE, GLOVE_CUFF, COAT, WRITE_INK, METAL, METAL_DARK, pathAt,
} from './evidence-art.js';

/* ------------------------------------------------------------------ */
/* Fields and defaults                                                 */
/* ------------------------------------------------------------------ */

export const LOGS = ['a', 'b'];

export const tcFields = {
  items: ecFields.items,
  custodians: list('The two custodians (fictional; descriptive roles only): the first hands the bag over (A), the second receives it (B)', obj('Custodian', {
    name: str('Name (fictional)', 40),
    role: str('Descriptive role (not a legal finding)', 50),
  }, ['name', 'role']), 2, 2),
  timestamps: ecFields.timestamps,
  records: list('Rows of the two separate record sheets; log a = sheet of custodian A, log b = sheet of custodian B. An empty value leaves that row blank (as supplied)', obj('Record row', {
    log: oneOf('Which sheet the row belongs to (a or b)', LOGS),
    field: str('Field name printed on the sheet', 30),
    value: str('Value written in the row (empty = left blank)', 50),
  }, ['log', 'field', 'value']), 2, 6),
  labels: obj('Built-in labels', {
    key: str('Neutral key shown in the legend', 90),
    blank: str('Text used for a row left blank', 60),
    logA: str('Title of sheet A (the name of custodian A follows)', 30),
    logB: str('Title of sheet B (the name of custodian B follows)', 30),
  }, ['key', 'blank', 'logA', 'logB']),
};

export const TC_EN = {
  items: [{id: 'Item E-03 (fictional)', label: 'Small wooden box in a sealed bag (fictional)', kind: 'box'}],
  custodians: [
    {name: 'R. Okoye (fictional)', role: 'Person handing the bag over'},
    {name: 'L. Moreau (fictional)', role: 'Person receiving the bag'},
  ],
  timestamps: [{label: 'Bag handed over', time: '10:20 (illustrative)'}, {label: 'Bag received', time: '10:21 (illustrative)'}],
  records: [
    {log: 'a', field: 'Handed over by', value: 'R. Okoye'},
    {log: 'a', field: 'Time', value: '10:20'},
    {log: 'b', field: 'Received by', value: 'L. Moreau'},
    {log: 'b', field: 'Time', value: '10:21'},
  ],
  labels: {key: 'As supplied · no conclusion drawn', blank: '(left blank, as supplied)', logA: 'Sheet A', logB: 'Sheet B'},
};

export const TC_ES = {
  items: [{id: 'Indicio E-03 (ficticio)', label: 'Caja de madera pequeña en bolsa cerrada (ficticia)', kind: 'box'}],
  custodians: [
    {name: 'R. Okoye (ficticia)', role: 'Persona que entrega la bolsa'},
    {name: 'L. Moreau (ficticia)', role: 'Persona que recibe la bolsa'},
  ],
  timestamps: [{label: 'Bolsa entregada', time: '10:20 (ilustrativo)'}, {label: 'Bolsa recibida', time: '10:21 (ilustrativo)'}],
  records: [
    {log: 'a', field: 'Entregado por', value: 'R. Okoye'},
    {log: 'a', field: 'Hora', value: '10:20'},
    {log: 'b', field: 'Recibido por', value: 'L. Moreau'},
    {log: 'b', field: 'Hora', value: '10:21'},
  ],
  labels: {key: 'Según lo aportado · sin conclusión', blank: '(en blanco, según lo aportado)', logA: 'Hoja A', logB: 'Hoja B'},
};

/** Rows per log: [{field, value, filled, len, idx}] (idx = position in params.records). */
export function tcLogs(P) {
  const out = {a: [], b: []};
  P.records.forEach((rw, idx) => {
    const v = String(rw.value ?? '').trim();
    out[rw.log === 'b' ? 'b' : 'a'].push({field: rw.field, value: rw.value, filled: v.length > 0, len: clamp(0.35 + v.length / 26, 0.35, 1), idx});
  });
  return out;
}

/** Legend line of a record row. */
export function tcRecordLine(rw, blank) {
  return `${rw.field}: ${rw.filled ? rw.value : blank}`;
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

/** Lane identity colours (A blue, B amber). Identity only — never a verdict. */
export const LANE = {a: '#4f7fb3', b: '#c28a2c'};
export const SLEEVE = {a: COAT, b: '#6f7d8c'};
export const GLOVES = {a: GLOVE, b: '#b9c4d8'};
const CUFF = {a: GLOVE_CUFF, b: '#8d9ab3'};
const HAIR = {a: '#3b2a20', b: '#8a6a43'};
const SKIN = {a: '#c68863', b: '#f1c9a5'};
const COUNTER = '#b48a5a';
const FLOOR = '#d9dcd6';
const SHEET = '#fbfaf6';
const BOARD = '#8d6b48';

/* ------------------------------------------------------------------ */
/* Stage geometry                                                      */
/* ------------------------------------------------------------------ */

/**
 * All positions of the hand-off stage in a world box.
 * @param {{x:number,y:number,w:number,h:number}} box  the stage window (world design units)
 * @param {'h'|'v'} orient  'h' = A left → B right; 'v' = A top → B bottom
 * @param {{kind:string, rowsA:number, rowsB:number}} o
 */
export function tcStage(box, orient, o) {
  const H = orient === 'h';
  const La = H ? box.w : box.h, Lb = H ? box.h : box.w;
  const map = (a, b) => (H ? {x: box.x + a, y: box.y + b} : {x: box.x + b, y: box.y + a});
  const ax = H ? {x: 1, y: 0} : {x: 0, y: 1};
  const hr = clamp(Math.min(Lb * 0.07, La * 0.055), 26, 64); // head radius
  const personA = hr * 1.05; // the torso centre sits just inside the window edge
  const aZ0 = hr * 2.35;
  const cw = La * 0.11; // counter width
  const deskEnd = La / 2 - cw / 2;
  const Za = deskEnd - aZ0;
  const pad = Math.max(10, Lb * 0.022);
  const laneB = Lb / 2 - pad * 1.5; // across size of each lane
  // bag: along × across fit, aspect w:h = 0.78 (bag upright: w horizontal, h vertical)
  const fitBox = (along, across, aspect) => {
    // returns {w, h} (world) fitting along × across with aspect w/h
    const wMax = H ? along : across, hMax = H ? across : along;
    let hh = hMax, w = hh * aspect;
    if (w > wMax) { w = wMax; hh = w / aspect; }
    return {w, h: hh};
  };
  const bagSz = fitBox(Za * 0.92, laneB * 0.96, 0.78);
  const logSz = fitBox(Za * 0.86, laneB * 0.9, 0.82);
  const bagLane = pad + laneB / 2 + pad * 0.2;
  const logLane = Lb - pad - laneB / 2 - pad * 0.2;
  const zoneA = aZ0 + Za / 2, zoneB = La - zoneA;
  const B = bagModel(bagSz.w, bagSz.h);
  const S = bagSz.h; // stage scale = bag height
  const along = v => (H ? v.w : v.h) / 2;
  const bagStart = map(zoneA, bagLane), bagMid = map(La / 2, bagLane), bagEnd = map(zoneB, bagLane);
  const logA = {...map(zoneA, logLane), ...logSz}, logB = {...map(zoneB, logLane), ...logSz};
  logA.x -= logSz.w / 2; logA.y -= logSz.h / 2; logB.x -= logSz.w / 2; logB.y -= logSz.h / 2;
  const sh = hr * 2.15; // shoulder half-span (across)
  const persons = {
    a: {c: map(personA, Lb / 2), face: H ? 0 : 90, carry: map(personA + hr * 0.15, Lb / 2 - sh), pen: map(personA + hr * 0.15, Lb / 2 + sh)},
    b: {c: map(La - personA, Lb / 2), face: H ? 180 : -90, carry: map(La - personA - hr * 0.15, Lb / 2 - sh), pen: map(La - personA - hr * 0.15, Lb / 2 + sh)},
  };
  const armW = clamp(hr * 0.66, 22, 44);
  const inset = along(bagSz) * 0.16;
  const gripOff = {a: {x: -ax.x * (along(bagSz) - inset), y: -ax.y * (along(bagSz) - inset)}, b: {x: ax.x * (along(bagSz) - inset), y: ax.y * (along(bagSz) - inset)}};
  const rest = {
    a: {carry: map(aZ0 + hr * 0.6, Lb / 2 - sh * 1.05), pen: null},
    b: {carry: map(La - aZ0 - hr * 0.6, Lb / 2 - sh * 1.05), pen: null},
  };
  const desks = {
    a: H ? {x: box.x + aZ0 - hr * 0.3, y: box.y + pad * 0.5, w: deskEnd - aZ0 + hr * 0.3, h: Lb - pad} : {x: box.x + pad * 0.5, y: box.y + aZ0 - hr * 0.3, w: Lb - pad, h: deskEnd - aZ0 + hr * 0.3},
    b: H ? {x: box.x + La / 2 + cw / 2, y: box.y + pad * 0.5, w: deskEnd - aZ0 + hr * 0.3, h: Lb - pad} : {x: box.x + pad * 0.5, y: box.y + La / 2 + cw / 2, w: Lb - pad, h: deskEnd - aZ0 + hr * 0.3},
  };
  const counter = H ? {x: box.x + deskEnd, y: box.y, w: cw, h: Lb} : {x: box.x, y: box.y + deskEnd, w: Lb, h: cw};
  const tray = {x: bagMid.x - bagSz.w / 2 - S * 0.06, y: bagMid.y - bagSz.h / 2 - S * 0.06, w: bagSz.w + S * 0.12, h: bagSz.h + S * 0.12};
  const M = objectModel(o.kind, Math.min(B.inner.w / 1.05, B.inner.h / 0.75) * 0.9);
  const TM = tagModel({w: bagSz.w * 0.7, h: bagSz.h * 0.2, rows: 2});
  const sheets = {a: sheetModel(logA, o.rowsA), b: sheetModel(logB, o.rowsB)};
  const fits = Za > 60 && bagSz.h > 60 && S >= 80;
  return {box, orient, H, La, Lb, map, ax, hr, S, B, bag: bagSz, M, TM, bagStart, bagMid, bagEnd, persons, armW, gripOff, rest, desks, counter, tray, logs: {a: logA, b: logB}, sheets, fits};
}

/** Clipboard sheet model (world). Rows: [{y, x0, x1, stubX}] in world coordinates. */
export function sheetModel(L, n) {
  const clipH = L.h * 0.08;
  const px = L.x + L.w * 0.07, pw = L.w * 0.86;
  const py = L.y + clipH * 0.9, ph = L.h - clipH * 0.9 - L.h * 0.04;
  const head = {x: px, y: py, w: pw, h: ph * 0.2};
  const ry0 = py + ph * 0.26, ry1 = py + ph * 0.94;
  const N = Math.max(1, n);
  const pitch = (ry1 - ry0) / Math.max(3, N);
  const rows = Array.from({length: n}, (_, i) => {
    const y = ry0 + pitch * (i + 0.72);
    return {y, top: ry0 + pitch * i, h: pitch, x0: px + pw * 0.06, stubX: px + pw * 0.06 + pw * 0.24, x1: px + pw * 0.94};
  });
  return {...L, clipH, paper: {x: px, y: py, w: pw, h: ph}, head, rows, pitch};
}

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

/** The floor, the two desks and the counter with its hand-off tray. */
export function stageArt(ctx, G, prefix) {
  const {box} = G;
  const deskA = benchNode(ctx, {prefix: `${prefix}-da`, ...G.desks.a, radius: 14, grid: Math.max(30, G.S * 0.22)});
  const deskB = benchNode(ctx, {prefix: `${prefix}-db`, ...G.desks.b, radius: 14, grid: Math.max(30, G.S * 0.22)});
  const C = G.counter;
  const grain = [];
  for (let i = 1; i < 6; i++) {
    const k = i / 6;
    grain.push(G.H ? `M${r(C.x + C.w * k)} ${r(C.y)}V${r(C.y + C.h)}` : `M${r(C.x)} ${r(C.y + C.h * k)}H${r(C.x + C.w)}`);
  }
  const t = G.tray;
  const tick = Math.max(10, G.S * 0.07);
  const corners = [[t.x, t.y, 1, 1], [t.x + t.w, t.y, -1, 1], [t.x, t.y + t.h, 1, -1], [t.x + t.w, t.y + t.h, -1, -1]]
    .map(([x, y, sx, sy]) => `M${r(x + sx * tick)} ${r(y)}H${r(x)}V${r(y + sy * tick)}`).join('');
  return g({name: `${prefix}-stage`},
    h('rect', {x: r(box.x), y: r(box.y), width: r(box.w), height: r(box.h), fill: FLOOR}),
    h('path', {d: Array.from({length: 12}, (_, i) => G.H ? `M${r(box.x)} ${r(box.y + box.h * (i + 1) / 13)}h${r(G.hr * 2.4)}M${r(box.x + box.w)} ${r(box.y + box.h * (i + 1) / 13)}h${r(-G.hr * 2.4)}` : `M${r(box.x + box.w * (i + 1) / 13)} ${r(box.y)}v${r(G.hr * 2.4)}M${r(box.x + box.w * (i + 1) / 13)} ${r(box.y + box.h)}v${r(-G.hr * 2.4)}`).join(''), stroke: shade(FLOOR, -0.08), 'stroke-width': 2}),
    deskA.surface, deskB.surface,
    h('path', {d: roundRectPath(C.x + 6, C.y + 8, C.w, C.h, 10), fill: '#000', opacity: 0.18}),
    h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, 10), fill: COUNTER, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: grain.join(''), stroke: shade(COUNTER, -0.16), 'stroke-width': 2, opacity: 0.7}),
    h('path', {d: roundRectPath(t.x, t.y, t.w, t.h, 10), fill: shade(COUNTER, 0.12), opacity: 0.85}),
    h('path', {d: corners, fill: 'none', stroke: '#fbfaf6', 'stroke-width': Math.max(3, G.S * 0.018), 'stroke-linecap': 'round'}),
    deskA.frame, deskB.frame,
  );
}

/** Top-down person (local origin = torso centre, facing +x). */
export function personTop(ctx, key, hr, o = {}) {
  const sleeve = SLEEVE[key];
  const sw = Math.max(2.2, hr * 0.05);
  const span = hr * 2.5;
  return g({name: o.name},
    h('path', {d: `M${r(-hr * 0.85)} ${r(-span)}Q${r(hr * 0.75)} ${r(-span)} ${r(hr * 0.8)} 0Q${r(hr * 0.75)} ${r(span)} ${r(-hr * 0.85)} ${r(span)}Q${r(-hr * 1.2)} 0 ${r(-hr * 0.85)} ${r(-span)}Z`, fill: sleeve, stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(hr * 0.1)} ${r(-span * 0.55)}Q${r(hr * 0.5)} 0 ${r(hr * 0.1)} ${r(span * 0.55)}`, fill: 'none', stroke: shade(sleeve, -0.18), 'stroke-width': 2}),
    h('ellipse', {cx: r(hr * 0.35), cy: 0, rx: r(hr * 0.98), ry: r(hr * 0.92), fill: SKIN[key], stroke: INK, 'stroke-width': sw}),
    h('path', {d: `M${r(hr * 0.75)} ${r(-hr * 0.7)}A${r(hr * 0.98)} ${r(hr * 0.92)} 0 1 0 ${r(hr * 0.75)} ${r(hr * 0.7)}Q${r(hr * 0.35)} 0 ${r(hr * 0.75)} ${r(-hr * 0.7)}Z`, fill: HAIR[key], stroke: INK, 'stroke-width': sw * 0.8}),
    h('ellipse', {cx: r(hr * 1.34), cy: 0, rx: r(hr * 0.12), ry: r(hr * 0.16), fill: shade(SKIN[key], -0.12), stroke: INK, 'stroke-width': 1.6}),
  );
}

/** Ball-point pen in hand (local origin = tip, body along −x). */
export function penArt(len, key, name) {
  const w = Math.max(6, len * 0.09);
  return g({name},
    h('path', {d: `M0 0L${r(len * 0.14)} ${r(-w * 0.45)}H${r(len)}Q${r(len + w * 0.5)} 0 ${r(len)} ${r(w * 0.45)}H${r(len * 0.14)}Z`, transform: 'scale(-1 1)', fill: '#2d3a4d', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(-len * 0.86), y: r(-w * 0.62), width: r(len * 0.2), height: r(w * 1.24), rx: 2, fill: LANE[key], stroke: INK, 'stroke-width': 1.4}),
    h('circle', {cx: 0, cy: 0, r: r(w * 0.2), fill: WRITE_INK}),
  );
}

/**
 * Clipboard sheet (world coords). Rows are written scribbles (`${prefix}-w${i}` animatable by dash offset) or, with
 * `texts` ([{fieldFit, valueFit}] or null per row), printed field / value text. `header` = custodian badge.
 */
export function sheetArt(ctx, SM, key, rows, o) {
  const P = o.prefix;
  const pp = SM.paper;
  const parts = [
    h('path', {d: roundRectPath(SM.x + 6, SM.y + 9, SM.w, SM.h, 12), fill: '#000', opacity: 0.18}),
    h('path', {d: roundRectPath(SM.x, SM.y, SM.w, SM.h, 12), fill: BOARD, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(pp.x, pp.y, pp.w, pp.h, 4), fill: SHEET, stroke: shade(SHEET, -0.25), 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(SM.x + SM.w * 0.3, SM.y - SM.clipH * 0.15, SM.w * 0.4, SM.clipH * 1.5, 6), fill: LANE[key], stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(SM.x + SM.w * 0.42), y: r(SM.y + SM.clipH * 0.2), width: r(SM.w * 0.16), height: r(SM.clipH * 0.5), rx: 3, fill: shade(LANE[key], -0.3)}),
  ];
  // header: lane band with a small person badge
  const hd = SM.head;
  const br = hd.h * 0.36;
  parts.push(h('path', {d: roundRectPath(hd.x + 4, hd.y + hd.h * 0.12, hd.w - 8, hd.h * 0.76, 6), fill: shade(LANE[key], 0.62), stroke: LANE[key], 'stroke-width': 2}));
  parts.push(g({transform: T(hd.x + 8 + br * 1.3, hd.y + hd.h / 2)}, badge(key, br)));
  if (o.headText) parts.push(textAt(o.headText, {x: hd.x + 12 + br * 2.7, y: hd.y + hd.h / 2 - o.headText.height / 2, fill: INK}));
  else parts.push(h('path', {d: `M${r(hd.x + 12 + br * 2.8)} ${r(hd.y + hd.h / 2)}h${r(hd.w * 0.45)}`, stroke: shade(LANE[key], -0.2), 'stroke-width': r(Math.max(3, hd.h * 0.14), 2), 'stroke-linecap': 'round'}));
  rows.forEach((rw, i) => {
    const R = SM.rows[i];
    const t = o.texts && o.texts[i];
    if (t) {
      parts.push(textAt(t.fieldFit, {x: R.x0, y: R.y - t.fieldFit.height - R.h * 0.08, fill: '#5b5b55'}));
      parts.push(h('line', {x1: r(R.x0), x2: r(R.x1), y1: r(R.y + 2), y2: r(R.y + 2), stroke: '#b9c2c8', 'stroke-width': 1.6}));
      return;
    }
    parts.push(h('path', {d: `M${r(R.x0)} ${r(R.y)}H${r(R.stubX - R.h * 0.12)}`, stroke: '#8a8f94', 'stroke-width': r(Math.max(2.4, R.h * 0.13), 2), 'stroke-linecap': 'round'}));
    parts.push(h('line', {x1: r(R.stubX), x2: r(R.x1), y1: r(R.y + 2), y2: r(R.y + 2), stroke: '#b9c2c8', 'stroke-width': 1.6}));
    if (rw.filled) {
      const pts = sheetRowPoints(ctx, SM, i, rw, `${o.seed || P}`);
      const d = scribble(ctx, `${o.seed || P}-${i}`, pts.x0, pts.x1, R.y, pts.amp);
      parts.push(h('path', {name: `${P}-w${i}`, d, fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(2, R.h * 0.075), 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 100, 'stroke-dasharray': '100 102', 'stroke-dashoffset': 100}));
    }
  });
  return g({name: o.name}, parts);
}

/** Scribble extent and sampled points of a written row (pen tip follows these). */
export function sheetRowPoints(ctx, SM, i, rw, seed) {
  const R = SM.rows[i];
  const x0 = R.stubX + R.h * 0.1;
  const x1 = x0 + (R.x1 - x0 - 4) * rw.len;
  const amp = Math.min(R.h * 0.34, SM.h * 0.05);
  return {x0, x1, amp, pts: scribblePoints(ctx, `${seed}-${i}`, x0, x1, R.y, amp, 6)};
}

/** Custodian badge (top-down head in lane ring). */
export function badge(key, rr) {
  return g(null,
    h('circle', {r: r(rr), fill: '#fff', stroke: LANE[key], 'stroke-width': r(Math.max(2.5, rr * 0.18), 2)}),
    h('circle', {cy: r(rr * 0.05), r: r(rr * 0.58), fill: SKIN[key], stroke: INK, 'stroke-width': 1.4}),
    h('path', {d: `M${r(-rr * 0.58)} ${r(rr * 0.02)}A${r(rr * 0.58)} ${r(rr * 0.58)} 0 0 1 ${r(rr * 0.58)} ${r(rr * 0.02)}Q0 ${r(-rr * 0.22)} ${r(-rr * 0.58)} ${r(rr * 0.02)}Z`, fill: HAIR[key]}),
  );
}

/** The carried unit: bag (back), object, bag film (front), tag on the bag and the chain to the eyelet. Local origin = bag centre. */
export function bagUnit(ctx, G, prefix) {
  const B = G.B;
  const ox = -B.w / 2, oy = -B.h / 2;
  const objC = {x: ox + B.inner.x + B.inner.w / 2, y: oy + B.inner.y + B.inner.h * 0.45};
  const eyelet = {x: ox + B.w * 0.88, y: oy + B.strip * 0.9 + B.strip * 2.2};
  const TM = G.TM;
  const tagHole = {x: ox + B.w * 0.2, y: oy + B.h * 0.8};
  const tagRows = [{filled: true, len: 0.8}, {filled: true, len: 0.55}];
  const chainA = eyelet, chainB = tagHole;
  const chain = chainNode(`${prefix}-chain`, {bead: Math.max(5, G.S * 0.026)});
  const node = g({name: prefix},
    g({transform: T(ox, oy)}, bagBack(ctx, B, {})),
    g({transform: T(objC.x, objC.y, -8)}, objectArt(ctx, G.M)),
    g({transform: T(ox, oy)}, bagFront(ctx, B, {})),
    h('circle', {cx: r(eyelet.x), cy: r(eyelet.y), r: r(G.S * 0.03), fill: METAL, stroke: INK, 'stroke-width': 1.6}),
    h('circle', {cx: r(eyelet.x), cy: r(eyelet.y), r: r(G.S * 0.012), fill: METAL_DARK}),
    g({transform: T(tagHole.x, tagHole.y, -6)}, tagArt(ctx, TM, {prefix: `${prefix}-tag`, rows: tagRows, seedKey: `${prefix}-tag`})),
    chain,
  );
  const sag = G.S * 0.12;
  const props = chainProps(`${prefix}-chain`, chainA, {x: chainB.x, y: chainB.y}, sag);
  return {node, props, objC, eyelet, tagHole};
}

/** Small legend icons of this motif (falls back to the category icons). */
export function tcIcon(ctx, kind, s, o = {}) {
  if (kind === 'cus-a' || kind === 'cus-b') return badge(kind.slice(4), s * 0.42);
  if (kind === 'log-a' || kind === 'log-b') {
    const key = kind.slice(4);
    return g(null,
      h('path', {d: roundRectPath(-s * 0.32, -s * 0.42, s * 0.64, s * 0.84, 4), fill: BOARD, stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-s * 0.26), y: r(-s * 0.34), width: r(s * 0.52), height: r(s * 0.7), fill: SHEET}),
      h('rect', {x: r(-s * 0.14), y: r(-s * 0.48), width: r(s * 0.28), height: r(s * 0.12), rx: 2, fill: LANE[key], stroke: INK, 'stroke-width': 1.2}),
      h('path', {d: `M${r(-s * 0.18)} ${r(-s * 0.1)}h${r(s * 0.36)}M${r(-s * 0.18)} ${r(s * 0.08)}h${r(s * 0.36)}M${r(-s * 0.18)} ${r(s * 0.24)}h${r(s * 0.24)}`, stroke: '#9aa3a8', 'stroke-width': 2}),
    );
  }
  if (kind === 'counter') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.45, -s * 0.24, s * 0.9, s * 0.48, 4), fill: COUNTER, stroke: INK, 'stroke-width': 1.6}),
      h('path', {d: `M${r(-s * 0.2)} ${r(-s * 0.12)}h${r(-s * 0.08)}v${r(s * 0.08)}M${r(s * 0.2)} ${r(s * 0.12)}h${r(s * 0.08)}v${r(-s * 0.08)}`, stroke: '#fff', 'stroke-width': 2, fill: 'none'}),
    );
  }
  if (kind === 'blank-row') {
    return g(null,
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.26), width: r(s * 0.84), height: r(s * 0.52), rx: 4, fill: SHEET, stroke: '#9aa3a8', 'stroke-width': 1.5}),
      h('path', {d: `M${r(-s * 0.32)} ${r(s * 0.06)}h${r(s * 0.16)}M${r(-s * 0.08)} ${r(s * 0.1)}h${r(s * 0.4)}`, stroke: '#8a8f94', 'stroke-width': 2}),
    );
  }
  if (kind === 'pen') return g({transform: T(s * 0.36, s * 0.2, -30)}, penArt(s * 0.8, o.key || 'a'));
  return legendIcon(ctx, kind, s, o);
}

/** Legend panel node using this motif's icons (rows from evidence-art `panelLayout`). */
export function tcPanelNode(ctx, PL) {
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
      if (row.icon) parts.push(g({transform: T(F * 0.8, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, tcIcon(ctx, row.icon, F * 1.3, {color: row.color, key: row.name})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}

/* ------------------------------------------------------------------ */
/* Arms                                                                */
/* ------------------------------------------------------------------ */

/** The four arms (A carry / pen, B carry / pen), with lengths sized to the farthest pose of `poses`. */
export function tcArms(ctx, G, poses, prefix) {
  const out = {};
  for (const key of LOGS) for (const role of ['carry', 'pen']) {
    const sh = G.persons[key][role];
    let far = 0;
    for (const s of poses) far = Math.max(far, Math.hypot(s.hands[key][role].x - sh.x, s.hands[key][role].y - sh.y));
    const len = far * 0.56 + G.armW * 0.6;
    out[`${key}${role}`] = topArm(ctx, {name: `${prefix}-${key}${role}`, skin: GLOVES[key], sleeve: SLEEVE[key], cuff: CUFF[key], handed: role === 'carry' ? 'left' : 'right', upper: len, lower: len, width: G.armW, handScale: 1.25});
  }
  return out;
}

/** Pose an arm with its elbow bowed away from the stage's centre line (outward across the lanes). */
export function poseOut(G, arm, shoulder, hand, role) {
  const p1 = arm.pose(shoulder, hand, 1), p2 = arm.pose(shoulder, hand, -1);
  const across = p => (G.H ? p.y : p.x);
  // the elbow is read from the upper-arm node end
  const e1 = elbowOf(p1), e2 = elbowOf(p2);
  const mid = across(G.H ? {y: G.box.y + G.box.h / 2} : {x: G.box.x + G.box.w / 2});
  const out1 = Math.abs(across(e1) - mid), out2 = Math.abs(across(e2) - mid);
  return (role === 'carry' ? across(e1) < across(e2) : across(e1) > across(e2)) || (out1 === out2 && out1 >= out2) ? p1 : p2;
}

function elbowOf(p) {
  const k = Object.keys(p.nodes).find(n => n.endsWith('-upper'));
  return {x: p.nodes[k].x2, y: p.nodes[k].y2};
}

/* ------------------------------------------------------------------ */
/* Pose solver                                                         */
/* ------------------------------------------------------------------ */

/**
 * Write plan of a log inside window [t0, t1]: move in, write each filled row (tip follows the scribble), move out.
 * Returns {tip, writing, progress:number[]} at u.
 */
function writeAt(ctx, G, key, rows, win, u, restTip, enabled, seed) {
  const SM = G.sheets[key];
  const progress = rows.map(() => 0);
  if (!enabled || !rows.some(rw => rw.filled)) return {tip: restTip, writing: false, progress};
  const [t0, t1] = win;
  const k = seg(u, t0, t1);
  const filled = rows.map((rw, i) => ({rw, i})).filter(q => q.rw.filled);
  const plan = filled.map(q => ({...q, ...sheetRowPoints(ctx, SM, q.i, q.rw, seed)}));
  const mIn = 0.18, mOut = 0.82;
  if (k <= 0) return {tip: restTip, writing: false, progress};
  if (k >= 1) { plan.forEach(q => { progress[q.i] = 1; }); return {tip: restTip, writing: false, progress}; }
  if (k < mIn) return {tip: pathAt([[0, restTip], [mIn, plan[0].pts[0]]], k), writing: false, progress};
  if (k > mOut) { plan.forEach(q => { progress[q.i] = 1; }); const last = plan[plan.length - 1].pts; return {tip: pathAt([[mOut, last[last.length - 1]], [1, restTip]], k), writing: false, progress}; }
  const n = plan.length;
  const span = (mOut - mIn) / n;
  const hop = n > 1 ? 0.22 : 0;
  const j = Math.min(n - 1, Math.floor((k - mIn) / span));
  for (let q = 0; q < j; q++) progress[plan[q].i] = 1;
  const kk = (k - mIn - j * span) / span; // 0..1 inside row j (with a hop to the next row at its end)
  const wEnd = 1 - hop;
  const pts = plan[j].pts;
  if (kk <= wEnd) {
    const p = clamp(kk / wEnd);
    progress[plan[j].i] = p;
    const f = p * (pts.length - 1);
    const a = Math.floor(f), b = Math.min(pts.length - 1, a + 1);
    return {tip: {x: lerp(pts[a].x, pts[b].x, f - a), y: lerp(pts[a].y, pts[b].y, f - a)}, writing: true, progress};
  }
  progress[plan[j].i] = 1;
  const next = plan[j + 1] ? plan[j + 1].pts[0] : pts[pts.length - 1];
  return {tip: pathAt([[wEnd, pts[pts.length - 1]], [1, next]], kk), writing: false, progress};
}

/** Pen geometry: tip offset from the hand (fixed per custodian) and the pen's angle. */
export function penGeo(G, key) {
  const sh = G.persons[key].pen;
  const L = G.logs[key];
  const c = {x: L.x + L.w / 2, y: L.y + L.h / 2};
  const d = Math.hypot(c.x - sh.x, c.y - sh.y) || 1;
  const dir = {x: (c.x - sh.x) / d, y: (c.y - sh.y) / d};
  const reach = G.armW * 1.25;
  const restTip = {x: L.x + (key === 'a' ? (G.H ? L.w * 0.12 : L.w * 0.12) : (G.H ? L.w * 0.88 : L.w * 0.12)), y: L.y + (G.H ? L.h * 0.9 : (key === 'a' ? L.h * 0.12 : L.h * 0.88))};
  return {off: {x: dir.x * reach, y: dir.y * reach}, angle: Math.atan2(dir.y, dir.x) * 180 / Math.PI, restTip, len: G.armW * 2.4};
}

/**
 * Every position of the hand-off at an (already capped) time u.
 * W: {aReach, aCarry, bReach, shared, aBack, bCarry, bBack, aWrite, bWrite}
 * o: {writeA, writeB, rows:{a,b}, seed}
 */
export function tcPose(ctx, G, W, u, o) {
  const restA = G.rest.a.carry, restB = G.rest.b.carry;
  const gA = p => ({x: p.x + G.gripOff.a.x, y: p.y + G.gripOff.a.y});
  const gB = p => ({x: p.x + G.gripOff.b.x, y: p.y + G.gripOff.b.y});
  // bag path: A carries start → mid (aCarry), rests on the tray during the shared hold, B carries mid → end (bCarry)
  let bag, phase, holder = null;
  const kA = ease.inOutCubic(seg(u, ...W.aCarry)), kB = ease.inOutCubic(seg(u, ...W.bCarry));
  if (u < W.aCarry[0]) bag = {...G.bagStart};
  else if (u < W.aCarry[1]) bag = {x: lerp(G.bagStart.x, G.bagMid.x, kA), y: lerp(G.bagStart.y, G.bagMid.y, kA)};
  else if (u < W.bCarry[0]) bag = {...G.bagMid};
  else bag = {x: lerp(G.bagMid.x, G.bagEnd.x, kB), y: lerp(G.bagMid.y, G.bagEnd.y, kB)};
  // lift (carried slightly raised: a soft shadow offset and 3 % scale)
  const lift = Math.max(Math.sin(Math.PI * seg(u, ...W.aCarry)), Math.sin(Math.PI * seg(u, ...W.bCarry)));
  // A carry hand
  let handA;
  const holdA = u >= W.aReach[1] && u < W.aBack[0];
  if (u < W.aReach[0]) handA = restA;
  else if (u < W.aReach[1]) handA = pathAt([[W.aReach[0], restA], [W.aReach[1], gA(G.bagStart)]], u);
  else if (holdA) handA = gA(bag);
  else handA = pathAt([[W.aBack[0], gA(G.bagMid)], [W.aBack[1], restA]], u);
  // B carry hand
  let handB;
  const holdB = u >= W.bReach[1] && u < W.bBack[0];
  if (u < W.bReach[0]) handB = restB;
  else if (u < W.bReach[1]) handB = pathAt([[W.bReach[0], restB], [W.bReach[1], gB(G.bagMid)]], u);
  else if (holdB) handB = gB(bag);
  else handB = pathAt([[W.bBack[0], gB(G.bagEnd)], [W.bBack[1], restB]], u);
  if (holdA && holdB) holder = 'shared';
  else if (holdA) holder = 'a';
  else if (holdB) holder = 'b';
  const moving = (u >= W.aCarry[0] && u < W.aCarry[1]) ? 'a' : (u >= W.bCarry[0] && u < W.bCarry[1]) ? 'b' : null;
  // pens
  const pa = penGeo(G, 'a'), pb = penGeo(G, 'b');
  const wa = writeAt(ctx, G, 'a', o.rows.a, W.aWrite, u, pa.restTip, o.writeA, `${o.seed}-a`);
  const wb = writeAt(ctx, G, 'b', o.rows.b, W.bWrite, u, pb.restTip, o.writeB, `${o.seed}-b`);
  const penHand = (w, pg) => ({x: w.tip.x - pg.off.x, y: w.tip.y - pg.off.y});
  if (u < W.aReach[0]) phase = 'rest';
  else if (u < W.aCarry[0]) phase = 'reach';
  else if (u < W.aCarry[1]) phase = 'carry-a';
  else if (holder === 'shared') phase = 'hand-off';
  else if (u < W.bCarry[1]) phase = 'carry-b';
  else if (wa.writing || seg(u, ...W.aWrite) > 0 && seg(u, ...W.aWrite) < 1) phase = 'log-a';
  else if (wb.writing || (o.writeB && seg(u, ...W.bWrite) > 0 && seg(u, ...W.bWrite) < 1)) phase = 'log-b';
  else phase = 'done';
  return {
    bag, lift, phase, holder, moving,
    hands: {a: {carry: handA, pen: penHand(wa, pa)}, b: {carry: handB, pen: penHand(wb, pb)}},
    grips: {a: gA(bag), b: gB(bag)},
    tips: {a: wa.tip, b: wb.tip}, writing: {a: wa.writing, b: wb.writing},
    progress: {a: wa.progress, b: wb.progress},
    pens: {a: pa, b: pb},
    atTray: Math.hypot(bag.x - G.bagMid.x, bag.y - G.bagMid.y) < 0.5,
    atB: Math.hypot(bag.x - G.bagEnd.x, bag.y - G.bagEnd.y) < 0.5,
  };
}

/** Frame nodes for the carried bag unit, pens and arms. Returns {nodes, allReached}. */
export function tcFrameNodes(ctx, G, s, L, prefix) {
  const nodes = {};
  const sc = 1 + 0.03 * s.lift;
  nodes[`${prefix}-bag`] = {transform: T(s.bag.x, s.bag.y, 0, sc)};
  nodes[`${prefix}-bagShadow`] = {transform: T(s.bag.x + G.S * 0.03 * (1 + s.lift), s.bag.y + G.S * 0.04 * (1 + s.lift)), opacity: r(0.16 + 0.08 * s.lift, 3)};
  Object.assign(nodes, L.unit.props);
  let reached = true;
  for (const key of LOGS) {
    const pc = poseOut(G, L.arms[`${key}carry`], G.persons[key].carry, s.hands[key].carry, 'carry');
    const pp = poseOut(G, L.arms[`${key}pen`], G.persons[key].pen, s.hands[key].pen, 'pen');
    Object.assign(nodes, pc.nodes, pp.nodes);
    reached = reached && pc.reached && pp.reached;
    nodes[`${prefix}-pen-${key}`] = {transform: T(s.tips[key].x, s.tips[key].y, s.pens[key].angle)};
  }
  return {nodes, allReached: reached};
}

/** Static scene nodes for a stage: {under (stage, sheets), bag (shadow + unit), arms, palms, pens, thumbs, persons}. */
export function tcSceneNodes(ctx, G, L, prefix, o = {}) {
  const st = stageArt(ctx, G, prefix);
  const sheets = LOGS.map(key => sheetArt(ctx, G.sheets[key], key, L.rows[key], {prefix: `${prefix}-log${key}`, name: `${prefix}-log${key}`, seed: `${o.seed}-${key}`, texts: o.texts ? o.texts[key] : null, headText: o.headTexts ? o.headTexts[key] : null}));
  const shadow = h('path', {name: `${prefix}-bagShadow`, d: roundRectPath(-G.B.w / 2, -G.B.h / 2, G.B.w, G.B.h, 16), fill: '#000', opacity: 0.16});
  const persons = LOGS.map(key => g({transform: T(G.persons[key].c.x, G.persons[key].c.y, G.persons[key].face)}, personTop(ctx, key, G.hr, {name: `${prefix}-person-${key}`})));
  const pens = LOGS.map(key => penArt(penGeo(G, key).len, key, `${prefix}-pen-${key}`));
  const A = L.arms;
  return {
    stage: st, sheets, shadow, bag: L.unit.node, persons, pens,
    arms: LOGS.flatMap(key => [A[`${key}carry`].arm, A[`${key}pen`].arm]),
    palms: LOGS.flatMap(key => [A[`${key}carry`].palm, A[`${key}pen`].palm]),
    thumbs: LOGS.flatMap(key => [A[`${key}carry`].thumb, A[`${key}pen`].thumb]),
  };
}

/** Write progress props for the two sheets. */
export function tcWriteProps(prefix, rows, progress) {
  const out = {};
  for (const key of LOGS) rows[key].forEach((rw, i) => {
    if (rw.filled) out[`${prefix}-log${key}-w${i}`] = {'stroke-dashoffset': r(100 * (1 - clamp(progress[key][i])), 2)};
  });
  return out;
}

export {fitG, textAt};
