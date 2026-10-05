/**
 * "Copia de evidencia digital" motif kit (evidence-custody-06, LAW-0381..0384). A DIGITAL IMAGING STATION on the
 * category's evidence bench — distinct from the earlier evidence-custody staging (tag/chain bench, seal pouch,
 * two-custodian hand-off room, photo stand, inventory rack). The category look (bench, gloved arms, tag, ball chain,
 * bag, legend icons, glue-aware text fitting) comes READ-ONLY from ./evidence-art.js; everything specific to this
 * motif is drawn here:
 *
 *  - STORAGE DEVICES (fictional, generic, top-down): a 2.5" drive, a USB stick or a memory card, each with a lanyard
 *    eyelet (where a tag's ball chain clips) and a label carrying a BLOCK MAP — a small grid of shaded cells drawn from
 *    the seed. The ORIGINAL has a slate label with its block map complete; the COPY is a blank device with a cream
 *    label whose cells are empty outlines until they are written, cell by cell, with exactly the original's pattern.
 *  - DUPLICATOR DOCK: a dark steel dock with two recessed bays (source = original, target = copy), one activity lamp
 *    per bay (white idle, blue busy — never green / red) and a recessed transfer window between the bays in which
 *    small blocks travel from the source bay to the target bay while the copy is written. The ORIGINAL is only read:
 *    its block map never changes.
 *  - BLANK TRAY: a shallow grey tray holding the blank copy before the action.
 *  - Category props: the original lies in an open evidence bag (bolsa) with its manila tag on a ball chain (etiqueta,
 *    cadena); a second, unattached tag waits for the copy and is clipped to the copy's eyelet when it is identified.
 *
 * Kit contents: fields and EN/ES defaults, device / dock / tray art, the station geometry (`dcStage`: bag, dock, bays,
 * tray, copy spot and tag spots inside a box for an 'h' (left → right) or 'v' (two rows) arrangement), block-flow frame
 * props, legend icons, a legend panel node and a legend-placement helper.
 *
 * Neutral by design: a block map that is copied says nothing about integrity, authenticity or admissibility; a tag
 * left unattached is drawn only because it was supplied. No doctrine on digital evidence or custody.
 * @module animations/evidence-custody/kits/copia-digital
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {
  legendIcon, panelLayout, textAt, tagModel, tagArt, bagModel, INK, METAL, METAL_DARK,
} from './evidence-art.js';

/* ------------------------------------------------------------------ */
/* Fields and defaults                                                 */
/* ------------------------------------------------------------------ */

export const DEVICE_KINDS = ['drive', 'stick', 'card'];

export const dcFields = {
  items: list('The original storage device (fictional). kind picks the drawn device', obj('Item', {
    id: str('Item reference printed in the legend (fictional)', 24),
    label: str('Short description of the original device (fictional)', 70),
    kind: oneOf('Drawn device: drive (2.5" drive), stick (USB stick) or card (memory card)', DEVICE_KINDS),
  }, ['id', 'label', 'kind']), 1, 1),
  records: list('Rows on the tag that identifies the copy, top to bottom. An empty value leaves that row blank (as supplied)', obj('Record row', {
    field: str('Field name printed on the copy tag', 30),
    value: str('Value written in the row (empty = left blank)', 50),
  }, ['field', 'value']), 2, 5),
  labels: obj('Editable captions', {
    key: str('Neutral key (must say that no conclusion is drawn)', 80),
    blank: str('Text shown for a tag row the author left blank', 50),
  }, ['key', 'blank']),
};

export const DC_EN = {
  items: [{id: 'Item D-01 (fictional)', label: 'Small 2.5" drive from a desk drawer (fictional)', kind: 'drive'}],
  custodians: [{name: 'L. Moreau (fictional)', role: 'Person making the copy'}],
  timestamps: [{label: 'Copy started', time: '11:20 (illustrative)'}, {label: 'Copy tagged', time: '11:34 (illustrative)'}],
  records: [
    {field: 'Copy no.', value: 'D-01/C1'},
    {field: 'Copy of', value: 'Item D-01'},
    {field: 'Made by', value: 'L. Moreau'},
  ],
  labels: {key: 'As supplied · no conclusion drawn', blank: '(left blank, as supplied)'},
};
export const DC_ES = {
  items: [{id: 'Indicio D-01 (ficticio)', label: 'Disco pequeño de 2,5" de un cajón (ficticio)', kind: 'drive'}],
  custodians: [{name: 'L. Moreau (ficticia)', role: 'Persona que hace la copia'}],
  timestamps: [{label: 'Copia iniciada', time: '11:20 (ilustrativo)'}, {label: 'Copia etiquetada', time: '11:34 (ilustrativo)'}],
  records: [
    {field: 'N.º de copia', value: 'D-01/C1'},
    {field: 'Copia de', value: 'Indicio D-01'},
    {field: 'Hecha por', value: 'L. Moreau'},
  ],
  labels: {key: 'Según lo aportado · sin conclusión', blank: '(en blanco, según lo aportado)'},
};

/** Records with their written / blank state. */
export function dcRecords(P) {
  return P.records.map(rw => ({field: rw.field, value: rw.value, filled: String(rw.value || '').trim().length > 0}));
}
export const dcRecordLine = (rw, blank) => `${rw.field}: ${rw.filled ? rw.value : blank}`;

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

export const DOCK = '#4d5760';
export const DOCK_TOP = '#5f6a74';
export const BAY = '#2b3238';
export const LABEL_ORIG = '#c9d6e2';
export const LABEL_COPY = '#f6f1e2';
export const LAMP_IDLE = '#eef1f3';
export const LAMP_BUSY = '#5aa0e0';
const BLOCKS = ['#2f5f8a', '#6f9cc4', '#b7cde0', '#1f3e5e'];

/* ------------------------------------------------------------------ */
/* Devices                                                             */
/* ------------------------------------------------------------------ */

/**
 * Device model of size S (local origin = centre). `eye` = lanyard eyelet (chain anchor); `grid` = block-map region.
 * @param {string} kind
 * @param {number} S
 */
export function deviceModel(kind, S) {
  if (kind === 'stick') {
    return {kind, S, w: S * 1.0, h: S * 0.36, eye: {x: -S * 0.4, y: 0}, grid: {x: -S * 0.28, y: -S * 0.11, w: S * 0.48, h: S * 0.22, cols: 6, rows: 2}};
  }
  if (kind === 'card') {
    return {kind, S, w: S * 0.72, h: S * 0.9, eye: {x: -S * 0.26, y: S * 0.36}, grid: {x: -S * 0.16, y: -S * 0.08, w: S * 0.42, h: S * 0.42, cols: 3, rows: 3}};
  }
  return {kind: 'drive', S, w: S * 1.0, h: S * 0.66, eye: {x: -S * 0.4, y: S * 0.22}, grid: {x: -S * 0.22, y: -S * 0.2, w: S * 0.6, h: S * 0.33, cols: 6, rows: 3}};
}

/** Cell rectangles of a device's block map (local coordinates). */
export function cellsOf(M) {
  const G = M.grid;
  const gap = Math.max(1.5, M.S * 0.012);
  const cw = (G.w - gap * (G.cols - 1)) / G.cols, ch = (G.h - gap * (G.rows - 1)) / G.rows;
  const out = [];
  for (let j = 0; j < G.rows; j++) for (let i = 0; i < G.cols; i++) out.push({x: G.x + i * (cw + gap), y: G.y + j * (ch + gap), w: cw, h: ch, i: j * G.cols + i});
  return out;
}

/** Block colours (deterministic per seed; identical for the original and its copy). */
export function blockColors(ctx, n) {
  return Array.from({length: n}, (_, i) => BLOCKS[Math.floor(ctx.rng('dc-block', i) * BLOCKS.length) % BLOCKS.length]);
}

/**
 * Device art (local origin = centre). role 'original' draws the complete block map; role 'copy' draws empty cell
 * outlines plus one named cell node per block (`${prefix}-c${i}`, opacity animated by the caller).
 * @param {any} ctx
 * @param {ReturnType<typeof deviceModel>} M
 * @param {{name?:string, prefix:string, role:'original'|'copy', filled?:boolean}} o
 */
export function deviceArt(ctx, M, o) {
  const S = M.S;
  const sw = Math.max(2, S * 0.016);
  const label = o.role === 'copy' ? LABEL_COPY : LABEL_ORIG;
  const parts = [];
  if (M.kind === 'stick') {
    const body = o.role === 'copy' ? '#6b7680' : '#465a70';
    parts.push(
      h('path', {d: roundRectPath(S * 0.26, -S * 0.11, S * 0.24, S * 0.22, 3), fill: METAL, stroke: INK, 'stroke-width': sw}),
      h('rect', {x: r(S * 0.32), y: r(-S * 0.06), width: r(S * 0.06), height: r(S * 0.04), fill: METAL_DARK}),
      h('rect', {x: r(S * 0.32), y: r(S * 0.02), width: r(S * 0.06), height: r(S * 0.04), fill: METAL_DARK}),
      h('path', {d: roundRectPath(-S * 0.5, -S * 0.18, S * 0.78, S * 0.36, S * 0.08), fill: body, stroke: INK, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-S * 0.33, -S * 0.145, S * 0.58, S * 0.29, S * 0.04), fill: label, stroke: shade(body, -0.3), 'stroke-width': 1.5}),
    );
  } else if (M.kind === 'card') {
    const body = o.role === 'copy' ? '#68727c' : '#3e4a58';
    const x0 = -S * 0.36, y0 = -S * 0.45, w = S * 0.72, hh = S * 0.9, n = S * 0.16;
    parts.push(
      h('path', {d: `M${r(x0 + 6)} ${r(y0)}H${r(x0 + w - n)}L${r(x0 + w)} ${r(y0 + n)}V${r(y0 + hh - 6)}Q${r(x0 + w)} ${r(y0 + hh)} ${r(x0 + w - 6)} ${r(y0 + hh)}H${r(x0 + 6)}Q${r(x0)} ${r(y0 + hh)} ${r(x0)} ${r(y0 + hh - 6)}V${r(y0 + 6)}Q${r(x0)} ${r(y0)} ${r(x0 + 6)} ${r(y0)}Z`, fill: body, stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      ...[0, 1, 2, 3, 4].map(i => h('rect', {x: r(x0 + S * 0.07 + i * S * 0.1), y: r(y0 + S * 0.04), width: r(S * 0.06), height: r(S * 0.14), rx: 2, fill: '#d6b25a', stroke: shade('#d6b25a', -0.35), 'stroke-width': 1})),
      h('path', {d: roundRectPath(-S * 0.3, -S * 0.15, S * 0.6, S * 0.56, S * 0.04), fill: label, stroke: shade(body, -0.3), 'stroke-width': 1.5}),
    );
  } else {
    const body = o.role === 'copy' ? '#7a838b' : '#5b646d';
    const x0 = -S * 0.5, y0 = -S * 0.33, w = S, hh = S * 0.66;
    parts.push(
      h('path', {d: roundRectPath(x0, y0, w, hh, S * 0.05), fill: body, stroke: INK, 'stroke-width': sw}),
      h('path', {d: roundRectPath(x0 + S * 0.03, y0 + S * 0.03, w - S * 0.06, hh - S * 0.06, S * 0.035), fill: 'none', stroke: shade(body, 0.22), 'stroke-width': 1.6}),
      ...[[x0 + S * 0.07, y0 + S * 0.07], [x0 + w - S * 0.07, y0 + S * 0.07], [x0 + w - S * 0.07, y0 + hh - S * 0.07]].map(([cx, cy]) => h('circle', {cx: r(cx), cy: r(cy), r: r(S * 0.022), fill: shade(body, 0.3), stroke: INK, 'stroke-width': 1})),
      h('rect', {x: r(x0 + w - S * 0.025), y: r(-S * 0.16), width: r(S * 0.035), height: r(S * 0.32), fill: '#d6b25a', stroke: INK, 'stroke-width': 1.2}),
      h('path', {d: roundRectPath(-S * 0.29, -S * 0.26, S * 0.74, S * 0.46, S * 0.03), fill: label, stroke: shade(body, -0.3), 'stroke-width': 1.5}),
    );
  }
  // eyelet (lanyard hole)
  parts.push(h('circle', {cx: r(M.eye.x), cy: r(M.eye.y), r: r(S * 0.045), fill: METAL, stroke: INK, 'stroke-width': 1.6}));
  parts.push(h('circle', {cx: r(M.eye.x), cy: r(M.eye.y), r: r(S * 0.02), fill: '#2b3238'}));
  const cells = cellsOf(M);
  const cols = blockColors(ctx, cells.length);
  const filled = o.role === 'original' || o.filled;
  parts.push(h('path', {d: cells.map(c => `M${r(c.x)} ${r(c.y)}h${r(c.w)}v${r(c.h)}h${r(-c.w)}Z`).join(''), fill: o.role === 'copy' ? '#fffdf6' : 'none', stroke: '#8b95a0', 'stroke-width': 1.2}));
  cells.forEach((c, i) => {
    const rect = h('rect', {x: r(c.x), y: r(c.y), width: r(c.w), height: r(c.h), fill: cols[i]});
    if (o.role === 'copy') parts.push(g({name: `${o.prefix}-c${i}`, opacity: filled ? 1 : 0}, rect));
    else parts.push(rect);
  });
  return g({name: o.name}, parts);
}

/** Frame props: reveal the first `k` (0..n, fractional) cells of a copy's block map. */
export function copyCellProps(prefix, n, k) {
  const out = {};
  for (let i = 0; i < n; i++) out[`${prefix}-c${i}`] = {opacity: r(clamp(k - i), 3)};
  return out;
}

/* ------------------------------------------------------------------ */
/* Dock and tray                                                       */
/* ------------------------------------------------------------------ */

/**
 * Dock geometry (local origin = top-left). Bays hold the largest device of any kind.
 * @param {number} S
 */
export function dockModel(S) {
  const m = S * 0.15, bw = S * 1.1, bh = S * 0.98, cw = S * 0.8;
  const w = m * 2 + bw * 2 + cw, hh = bh + m * 2.4;
  const by = m * 1.6;
  return {S, w, h: hh, bayW: bw, bayH: bh,
    src: {x: m, y: by, w: bw, h: bh, c: {x: m + bw / 2, y: by + bh / 2}},
    dst: {x: m + bw + cw, y: by, w: bw, h: bh, c: {x: m + bw + cw + bw / 2, y: by + bh / 2}},
    chan: {x: m + bw + S * 0.08, y: by + bh / 2 - S * 0.12, w: cw - S * 0.16, h: S * 0.24},
    lampS: {x: m + bw * 0.5, y: m * 0.8}, lampT: {x: m + bw + cw + bw * 0.5, y: m * 0.8}};
}

export const FLOW_BLOCKS = 4;

/** Dock art (local origin = top-left). Named nodes: `${p}-lampS`, `${p}-lampT`, `${p}-b${k}` (blocks in the window). */
export function dockArt(ctx, D, o) {
  const S = D.S;
  const p = o.prefix;
  const C = D.chan;
  const bs = C.h * 0.62;
  return g({name: o.name},
    h('path', {d: roundRectPath(6, 10, D.w, D.h, S * 0.08), fill: '#000', opacity: 0.18}),
    h('path', {d: roundRectPath(0, 0, D.w, D.h, S * 0.08), fill: DOCK, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(S * 0.04, S * 0.04, D.w - S * 0.08, D.h - S * 0.08, S * 0.06), fill: DOCK_TOP}),
    ...[D.src, D.dst].map(B => g(null,
      h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, S * 0.05), fill: BAY, stroke: INK, 'stroke-width': 2}),
      h('path', {d: roundRectPath(B.x + S * 0.04, B.y + S * 0.04, B.w - S * 0.08, B.h - S * 0.08, S * 0.035), fill: 'none', stroke: shade(BAY, 0.25), 'stroke-width': 1.5}),
      h('rect', {x: r(B.x + B.w - S * 0.06), y: r(B.c.y - S * 0.18), width: r(S * 0.04), height: r(S * 0.36), fill: '#8a7a4a', stroke: INK, 'stroke-width': 1}),
    )),
    h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, C.h * 0.3), fill: '#1c242b', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(C.x + C.h * 0.3)} ${r(C.y + C.h / 2)}H${r(C.x + C.w - C.h * 0.3)}`, stroke: '#33414d', 'stroke-width': 2, 'stroke-dasharray': '3 5'}),
    Array.from({length: FLOW_BLOCKS}, (_, k) => h('rect', {name: `${p}-b${k}`, x: r(-bs / 2), y: r(-bs / 2), width: r(bs), height: r(bs), rx: 2, fill: BLOCKS[k % BLOCKS.length], stroke: '#cfe0ef', 'stroke-width': 1.2, opacity: 0})),
    ...[['lampS', D.lampS], ['lampT', D.lampT]].map(([nm, L]) => g(null,
      h('circle', {cx: r(L.x), cy: r(L.y), r: r(S * 0.055), fill: '#1c242b', stroke: INK, 'stroke-width': 1.5}),
      h('circle', {name: `${p}-${nm}`, cx: r(L.x), cy: r(L.y), r: r(S * 0.036), fill: LAMP_IDLE}),
    )),
  );
}

/**
 * Frame props of the dock: blocks travelling through the window while `active` (0..1 fade) at flow phase `k`.
 * @param {string} p prefix
 * @param {ReturnType<typeof dockModel>} D
 * @param {number} k flow progress 0..1
 * @param {number} active 0..1
 */
export function dockFlowProps(p, D, k, active, ox = 0, oy = 0) {
  const C = D.chan;
  const out = {};
  const span = C.w - C.h * 0.7;
  for (let i = 0; i < FLOW_BLOCKS; i++) {
    const t = ((k * 5 + i / FLOW_BLOCKS) % 1 + 1) % 1;
    const x = ox + C.x + C.h * 0.35 + span * t;
    const edge = Math.min(1, t * 6, (1 - t) * 6);
    out[`${p}-b${i}`] = {transform: T(x, oy + C.y + C.h / 2), opacity: r(active * edge, 3)};
  }
  out[`${p}-lampS`] = {fill: active > 0.5 ? LAMP_BUSY : LAMP_IDLE};
  out[`${p}-lampT`] = {fill: active > 0.5 ? LAMP_BUSY : LAMP_IDLE};
  return out;
}

/** Shallow blank tray (local origin = top-left). */
export function trayArt(ctx, w, hh, o = {}) {
  return g({name: o.name},
    h('path', {d: roundRectPath(5, 8, w, hh, 14), fill: '#000', opacity: 0.14}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: '#c3cbd1', stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(w * 0.06, hh * 0.08, w * 0.88, hh * 0.84, 10), fill: '#d6dce0', stroke: '#9aa5ad', 'stroke-width': 1.5}),
  );
}

/* ------------------------------------------------------------------ */
/* Station geometry                                                    */
/* ------------------------------------------------------------------ */

const TAG_W = 1.05, TAG_H = 0.46, TAG_DROP = 0.42;

/**
 * Station positions in a box B. orient 'h': bag | dock | copy zone left → right; 'v': bag + copy zone on top, dock
 * below. Returns world positions (all in design units) and the device size S.
 * @param {{x:number,y:number,w:number,h:number}} B
 * @param {{kind:string, orient:'h'|'v', rows:number, sCap?:number}} o
 */
export function dcStage(B, o) {
  const U = {};
  const dockW = 3.3, dockH = 1.34, zoneW = 1.5, bagW = 1.5;
  let bagH = 2.2, w, hh, spotY = 1.42, lieDy = 0.42;
  const pad = 0.06;
  if (o.orient === 'v') {
    w = dockW; hh = bagH + 0.35 + dockH + 0.75;
    // spare height (tall boxes) spreads the two rows apart and lengthens the bag
    const extra = clamp(B.h / (B.w / (w + pad * 2)) - (hh + pad * 2), 0, 1.4);
    bagH += extra * 0.35; spotY += extra * 0.3; lieDy += extra * 0.08;
    U.bag = {x: 0, y: 0};
    U.zone = {x: dockW - zoneW, y: 0};
    U.dock = {x: 0, y: bagH + 0.35 + extra * 0.4};
    hh = U.dock.y + dockH + 0.75 + extra * 0.25;
  } else {
    w = bagW + 0.25 + dockW + 0.28 + zoneW; hh = 2.42;
    // spare height (wide boxes) lengthens the bag and lowers the dock, copy spot and waiting tag
    const extra = clamp(B.h / (B.w / (w + pad * 2)) - (hh + pad * 2), 0, 1.1);
    bagH += extra * 0.7; spotY += extra * 0.5; lieDy += extra * 0.35;
    U.bag = {x: 0, y: 0};
    U.dock = {x: bagW + 0.25, y: 0.72 - dockH / 2 + 0.04 + extra * 0.32};
    U.zone = {x: U.dock.x + dockW + 0.28, y: 0};
    hh += extra;
  }
  let S = Math.min(B.w / (w + pad * 2), B.h / (hh + pad * 2));
  if (o.sCap) S = Math.min(S, o.sCap);
  const ox = B.x + (B.w - w * S) / 2, oy = B.y + (B.h - hh * S) / 2;
  const P = (ux, uy) => ({x: ox + ux * S, y: oy + uy * S});
  const M = deviceModel(o.kind, S);
  const D = dockModel(S);
  const dock = {...P(U.dock.x, U.dock.y), w: D.w, h: D.h};
  const bagB = bagModel(bagW * S, bagH * S);
  const bag = {...P(U.bag.x, U.bag.y), w: bagW * S, h: bagH * S, B: bagB};
  const origRest = P(U.bag.x + bagW / 2, U.bag.y + 0.72);
  const srcBay = {x: dock.x + D.src.c.x, y: dock.y + D.src.c.y};
  const dstBay = {x: dock.x + D.dst.c.x, y: dock.y + D.dst.c.y};
  const tray = {...P(U.zone.x + 0.08, U.zone.y + 0.06), w: (zoneW - 0.16) * S, h: 1.0 * S};
  const copyRest = {x: tray.x + tray.w / 2, y: tray.y + tray.h / 2};
  const copySpot = P(U.zone.x + zoneW / 2 + 0.05, U.zone.y + spotY);
  const tagModelC = tagModel({w: TAG_W * S, h: TAG_H * S, rows: o.rows});
  const tagModelO = tagModel({w: TAG_W * S, h: TAG_H * S, rows: 3});
  const eyeOf = c => ({x: c.x + M.eye.x, y: c.y + M.eye.y});
  const holeOf = c => ({x: c.x + M.eye.x + 0.02 * S, y: c.y + M.eye.y + TAG_DROP * S});
  // the copy's tag waits on the mat below the copy spot (unattached, no chain)
  const tagFinal = holeOf(copySpot);
  const tagLie = {x: tagFinal.x - 0.05 * S, y: tagFinal.y + lieDy * S, a: 0};
  const ext = {x: ox, y: oy, w: w * S, h: hh * S};
  return {S, M, D, dock, bag, origRest, srcBay, dstBay, tray, copyRest, copySpot, tagC: tagModelC, tagO: tagModelO, eyeOf, holeOf, tagFinal, tagLie, ext, orient: o.orient, fits: S >= 60};
}

/** Tag group transform for a hole position and angle. */
export const tagT = (p, a = 0) => T(p.x, p.y, a);

/** Tag art helpers: the original's tag is fully written (scribbles); the copy's tag follows the supplied rows. */
export function origTagArt(ctx, G, name) {
  return tagArt(ctx, G.tagO, {prefix: `${name}t`, name, rows: [{filled: true, len: 0.85}, {filled: true, len: 0.6}, {filled: true, len: 0.75}], seedKey: 'dc-orig'});
}
export function copyTagArt(ctx, G, name, recs) {
  return tagArt(ctx, G.tagC, {prefix: `${name}t`, name, rows: recs.map(rw => ({filled: rw.filled, len: 0.8})), seedKey: 'dc-copy'});
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

/** Legend icon: dc-orig-<kind>, dc-copy-<kind>, dc-dock, else the category icons. */
export function dcIcon(ctx, kind, s, o = {}) {
  if (kind.startsWith('dc-orig-') || kind.startsWith('dc-copy-')) {
    const role = kind.startsWith('dc-orig-') ? 'original' : 'copy';
    const M = deviceModel(kind.slice(8), s * 0.95);
    return deviceArt(ctx, M, {prefix: `ico-${o.key || kind}`, role, filled: true});
  }
  if (kind === 'dc-dock') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.48, -s * 0.24, s * 0.96, s * 0.48, 4), fill: DOCK, stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.15), width: r(s * 0.3), height: r(s * 0.3), rx: 2, fill: BAY}),
      h('rect', {x: r(s * 0.12), y: r(-s * 0.15), width: r(s * 0.3), height: r(s * 0.3), rx: 2, fill: BAY}),
      h('rect', {x: r(-s * 0.09), y: r(-s * 0.04), width: r(s * 0.18), height: r(s * 0.08), fill: LAMP_BUSY}),
    );
  }
  return legendIcon(ctx, kind, s, o);
}

/** Legend panel node (local origin = top-left). Every row is a named group. */
export function dcPanelNode(ctx, PL) {
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
      if (row.icon) parts.push(g({transform: T(F * 0.8, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, dcIcon(ctx, row.icon, F * 1.3, {color: row.color, key: row.name})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}

/**
 * Legend placement: 'side' (one column at the right, width share pw) or 'below' (cols columns under the bench).
 * Returns the bench box, the panel origin and the fitted columns.
 */
export function dcLegendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  if (!rows.length) return {bench: {x: 0, y: 0, w: DW, h: DH}, panel: null, PL: null};
  if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [panelLayout(ctx, rows, {w: colW, F})];
    if (cols === 2 && rows.length >= 2) {
      let best = null;
      for (let i = 1; i < rows.length; i++) {
        const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      PLs = best.cols;
    }
    const ph = Math.max(...PLs.map(q => q.h));
    return {bench: {x: 0, y: 0, w: DW, h: DH - ph - gap}, panel: {x: 4, y: DH - ph}, PL: {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW}};
  }
  const PW = DW * opt.pw;
  const one = panelLayout(ctx, rows, {w: PW, F});
  return {bench: {x: 0, y: 0, w: DW - PW - gap, h: DH}, panel: {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)}, PL: {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW}};
}

/** Panel nodes for a fitted legend (one group per column). */
export function dcPanels(ctx, C) {
  return C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, dcPanelNode(ctx, PLc))) : [];
}
