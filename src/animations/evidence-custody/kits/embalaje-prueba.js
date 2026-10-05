/**
 * "Embalaje de prueba" motif kit (evidence-custody-02, LAW-0365..0368). Art and solvers for packing an object into a
 * sealable evidence pouch that is closed with a tamper-evident seal strip (precinto). Category look (bench, gloved
 * arms, objects, legend, text fitting) comes READ-ONLY from ./evidence-art.js; everything specific to this motif is
 * drawn here:
 *
 *  - POUCH: a top-down evidence pouch (translucent film body) with a white fold-over FLAP hinged at the mouth. Open,
 *    the flap lies flat above the mouth showing its inner face with a release-liner band; folded, it lies over the
 *    top of the body showing its outer face with two write-on lines ("sealed by", "seal state"). The body carries a
 *    printed custody LABEL (etiqueta: record rows written or blank as supplied) and a CHAIN strip (cadena: one signed
 *    box per custodian, joined by small links).
 *  - SEAL STRIP (precinto): an ochre tamper-evident tape with perforated edges and a white number plate (the supplied
 *    seal number, or barcode bars when text is hidden / too small). It rests on a white backing card, is peeled off,
 *    laid across the flap's free edge (the seam) and pressed down (a pressed tint follows the pressing hand).
 *  - MARKED ALTERATION: a zig-zag slit across the strip with a thin gap; it is a SUPPLIED mark only, shown with the
 *    neutral changed-datum marker. Nothing here says what an alteration means.
 *
 * Solvers: `sealStage` (bench positions for object, pouch, strip in a box — 'side' or 'top' arrangement) and
 * `sealPose` (every pose of the packing action at an already-capped time: right hand moves the object into the
 * pouch, folds the flap, presses the strip; left hand steadies the pouch, then peels the strip and lays it on the
 * seam). Two copies of each carried prop (below / above the arms) are swapped only where they coincide.
 * @module animations/evidence-custody/kits/embalaje-prueba
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r, seg, lerp, ease} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, obj} from '../../../schemas/fields.js';
import {FONTS} from '../../../core/text.js';
import {shade} from '../../../primitives/paper.js';
import {changedMarker} from '../../../primitives/markers.js';
import {
  objectModel, objectArt, scribble, legendIcon, textAt, fitG, pathAt, INK, WRITE_INK, BAG_EDGE,
} from './evidence-art.js';

/* ------------------------------------------------------------------ */
/* Motif defaults and fields                                           */
/* ------------------------------------------------------------------ */

export const TAPE = '#e2ad3b';
export const TAPE_DARK = '#a8781a';
export const FLAP = '#f7f5ef';
export const FLAP_IN = '#ece6d6';
export const LINER = '#c9d6df';

export const EP_EN = {
  items: [{id: 'Item E-02 (fictional)', label: 'Small wooden box from a desk drawer (fictional)', kind: 'box'}],
  custodians: [{name: 'J. Ferraz (fictional)', role: 'Person packing the item'}],
  timestamps: [{label: 'Item packed', time: '11:20 (illustrative)'}, {label: 'Seal applied', time: '11:22 (illustrative)'}],
  records: [
    {field: 'Item no.', value: 'E-02'},
    {field: 'Description', value: 'Wooden box'},
    {field: 'Packed by', value: 'J. Ferraz'},
  ],
  sealNumber: 'P-04127',
  labels: {key: 'As supplied · no conclusion drawn', blank: '(left blank, as supplied)', seal: 'Seal no.'},
};
export const EP_ES = {
  items: [{id: 'Indicio E-02 (ficticio)', label: 'Caja de madera pequeña de un cajón (ficticia)', kind: 'box'}],
  custodians: [{name: 'J. Ferraz (ficticia)', role: 'Persona que embala el objeto'}],
  timestamps: [{label: 'Objeto embalado', time: '11:20 (ilustrativo)'}, {label: 'Precinto puesto', time: '11:22 (ilustrativo)'}],
  records: [
    {field: 'N.º de indicio', value: 'E-02'},
    {field: 'Descripción', value: 'Caja de madera'},
    {field: 'Embalado por', value: 'J. Ferraz'},
  ],
  sealNumber: 'P-04127',
  labels: {key: 'Según lo aportado · sin conclusión', blank: '(en blanco, según lo aportado)', seal: 'N.º de precinto'},
};

export const epFields = {
  sealNumber: str('Number printed on the seal strip (fictional)', 16),
  labels: obj('Editable captions', {
    key: str('Neutral key (must say that no conclusion is drawn)', 80),
    blank: str('Text shown for a label row the author left blank', 50),
    seal: str('Caption before the seal number', 40),
  }, ['key', 'blank', 'seal']),
};

/** Records with their written / blank state. */
export function epRecords(P) {
  return P.records.map(rw => ({field: rw.field, value: rw.value, filled: String(rw.value || '').trim().length > 0}));
}
export const epRecordLine = (rw, blank) => `${rw.field}: ${rw.filled ? rw.value : blank}`;

/* ------------------------------------------------------------------ */
/* Pouch                                                               */
/* ------------------------------------------------------------------ */

/** Pouch geometry for size S (local origin = top-left of the body; the mouth / hinge is y = 0). */
export function pouchModel(S, o = {}) {
  const w = S * 1.9, hh = S * 2.1, fh = S * 0.5;
  const strip = stripModel(w + S * 0.26, S * 0.26, S);
  return {
    S, w, h: hh, fh, strip,
    inner: {x: w * 0.07, y: S * 0.66, w: w * 0.86, h: S * 0.66},
    label: {x: w * 0.07, y: S * 1.34, w: w * 0.86, h: S * 0.66},
    rows: Math.max(1, o.rows ?? 3), chainN: Math.max(1, o.chainN ?? 1),
  };
}

/** Pouch back layer: shadow + back film. */
export function pouchBack(ctx, PM, o = {}) {
  return g({name: o.name},
    h('path', {d: roundRectPath(8, 12, PM.w, PM.h, 14), fill: '#000', opacity: 0.16}),
    h('path', {d: roundRectPath(0, 0, PM.w, PM.h, 14), fill: '#dbe5eb', opacity: 0.9, stroke: BAG_EDGE, 'stroke-width': 2.5}),
    h('path', {d: `M${r(PM.w * 0.04)} ${r(PM.S * 0.08)}H${r(PM.w * 0.96)}`, stroke: shade('#dbe5eb', -0.12), 'stroke-width': 2}),
  );
}

/**
 * Pouch front layer: film sheen, custody label (rows written / blank) and chain strip (one signed box per custodian).
 * @param {any} ctx
 * @param {ReturnType<typeof pouchModel>} PM
 * @param {{name?:string, rows:Array<{filled:boolean}>, chainN:number, seedKey?:string}} o
 */
export function pouchFront(ctx, PM, o) {
  const S = PM.S, Lb = PM.label;
  const key = o.seedKey || 'ep';
  const parts = [
    h('path', {d: roundRectPath(0, 0, PM.w, PM.h, 14), fill: '#fff', opacity: 0.16}),
    h('path', {d: `M${r(PM.w * 0.86)} ${r(PM.S * 0.62)}L${r(PM.w * 0.8)} ${r(PM.S * 1.2)}`, stroke: '#fff', 'stroke-width': r(Math.max(6, S * 0.05)), 'stroke-linecap': 'round', opacity: 0.5}),
    // label
    h('path', {d: roundRectPath(Lb.x, Lb.y, Lb.w, Lb.h, 8), fill: '#fbfaf6', stroke: BAG_EDGE, 'stroke-width': 2}),
    h('path', {d: roundRectPath(Lb.x, Lb.y, Lb.w, Lb.h * 0.15, 8), fill: '#c7d5df'}),
    h('path', {d: `M${r(Lb.x + Lb.w * 0.05)} ${r(Lb.y + Lb.h * 0.075)}h${r(Lb.w * 0.32)}`, stroke: '#51677a', 'stroke-width': r(Math.max(3, Lb.h * 0.04), 2), 'stroke-linecap': 'round'}),
  ];
  const rowsTop = Lb.y + Lb.h * 0.2, rowsBot = Lb.y + Lb.h * 0.64;
  const n = o.rows.length;
  const pitch = (rowsBot - rowsTop) / Math.max(1, n);
  o.rows.forEach((rw, i) => {
    const y = rowsTop + pitch * (i + 0.72);
    const x0 = Lb.x + Lb.w * 0.05, xs = x0 + Lb.w * 0.24;
    parts.push(h('path', {d: `M${r(x0)} ${r(y)}h${r(Lb.w * 0.17)}`, stroke: '#7d8a94', 'stroke-width': r(Math.max(2, pitch * 0.16), 2), 'stroke-linecap': 'round'}));
    parts.push(h('line', {x1: r(xs), x2: r(Lb.x + Lb.w * 0.95), y1: r(y + 2), y2: r(y + 2), stroke: '#b9c2c8', 'stroke-width': 1.4}));
    if (rw.filled) parts.push(h('path', {d: scribble(ctx, `${key}-row${i}`, xs + 4, xs + (Lb.x + Lb.w * 0.93 - xs) * (0.55 + ((i * 29) % 35) / 100), y, Math.min(pitch * 0.38, S * 0.05)), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.6, S * 0.012), 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  });
  // chain strip: boxes joined by links (one per custodian; each carries a signature)
  const cy0 = Lb.y + Lb.h * 0.7, chH = Lb.h * 0.24;
  const cn = Math.max(1, o.chainN);
  const gapW = Lb.w * 0.06;
  const bw = (Lb.w * 0.9 - gapW * (cn - 1)) / cn;
  for (let i = 0; i < cn; i++) {
    const bx = Lb.x + Lb.w * 0.05 + i * (bw + gapW);
    parts.push(h('path', {d: roundRectPath(bx, cy0, bw, chH, 4), fill: '#eef2f4', stroke: '#7d8a94', 'stroke-width': 1.6}));
    parts.push(h('path', {d: scribble(ctx, `${key}-sig${i}`, bx + bw * 0.12, bx + bw * 0.8, cy0 + chH * 0.66, chH * 0.32), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.6, S * 0.012), 2), 'stroke-linecap': 'round'}));
    if (i > 0) {
      const lx = bx - gapW / 2, ly = cy0 + chH / 2;
      parts.push(h('ellipse', {cx: r(lx - gapW * 0.2), cy: r(ly), rx: r(gapW * 0.38), ry: r(chH * 0.16), fill: 'none', stroke: '#5d656c', 'stroke-width': 2.2}));
      parts.push(h('ellipse', {cx: r(lx + gapW * 0.2), cy: r(ly), rx: r(gapW * 0.38), ry: r(chH * 0.16), fill: 'none', stroke: '#5d656c', 'stroke-width': 2.2}));
    }
  }
  parts.push(h('path', {d: roundRectPath(0, 0, PM.w, PM.h, 14), fill: 'none', stroke: BAG_EDGE, 'stroke-width': 2.5}));
  return g({name: o.name}, parts);
}

/** Flap outline (hinge-local; open flap towards -y; pass sy = -1 for the folded flap). */
export function flapOutline(w, fh, sy = 1) {
  const y = v => r(v * sy);
  return `M${r(-w / 2)} 0V${y(-fh * 0.72)}Q${r(-w / 2)} ${y(-fh)} ${r(-w / 2 + fh * 0.3)} ${y(-fh)}H${r(w / 2 - fh * 0.3)}Q${r(w / 2)} ${y(-fh)} ${r(w / 2)} ${y(-fh * 0.72)}V0Z`;
}

/**
 * Flap (local origin = hinge centre; the flap extends towards -y when open). Animate `${name}` with
 * T(hx, hy, 0, 1, sy): sy = 1 open, -1 folded. Faces swap with `${name}-in` / `${name}-out` opacity.
 * The outer face carries two write-on lines (sealed by / seal state); `${name}-st0` and `${name}-st1` are the
 * scribbles of the state line (before / after), animatable by opacity.
 */
export function flapNode(ctx, PM, o) {
  const N = o.name;
  const w = PM.w, fh = PM.fh, S = PM.S;
  const outline = flapOutline(w, fh);
  // outer face: lines are drawn mirrored (the face is seen after the fold flips y)
  const ln = k => -fh * k;
  return g({name: N},
    g({name: `${N}-in`},
      h('path', {d: outline, fill: FLAP_IN, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('path', {d: roundRectPath(-w / 2 + S * 0.08, -fh * 0.8, w - S * 0.16, fh * 0.34, 6), fill: LINER, stroke: shade(LINER, -0.25), 'stroke-width': 1.5}),
      h('path', {d: `M${r(-w / 2 + S * 0.14)} ${r(-fh * 0.63)}h${r(w * 0.3)}`, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8}),
    ),
    g({name: `${N}-out`, opacity: 0},
      h('path', {d: outline, fill: FLAP, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-w * 0.44)} ${r(ln(0.24))}h${r(w * 0.12)}M${r(-w * 0.44)} ${r(ln(0.5))}h${r(w * 0.12)}`, stroke: '#7d8a94', 'stroke-width': r(Math.max(2.5, S * 0.02), 2), 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(-w * 0.28)} ${r(ln(0.24) + 2)}H${r(w * 0.44)}M${r(-w * 0.28)} ${r(ln(0.5) + 2)}H${r(w * 0.44)}`, stroke: '#b9c2c8', 'stroke-width': 1.5}),
      h('path', {d: scribble(ctx, `${o.seedKey || 'ep'}-by`, -w * 0.26, w * 0.12, ln(0.24), S * 0.045), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.6, S * 0.012), 2), 'stroke-linecap': 'round'}),
      g({name: `${N}-st0`}, h('path', {d: scribble(ctx, `${o.seedKey || 'ep'}-st0`, -w * 0.26, w * 0.02, ln(0.5), S * 0.045), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.6, S * 0.012), 2), 'stroke-linecap': 'round'})),
      g({name: `${N}-st1`, opacity: 0}, h('path', {d: scribble(ctx, `${o.seedKey || 'ep'}-st1`, -w * 0.26, w * 0.3, ln(0.5), S * 0.045), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.6, S * 0.012), 2), 'stroke-linecap': 'round'})),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Seal strip                                                          */
/* ------------------------------------------------------------------ */

/** Strip geometry (local origin = centre, length along x). */
export function stripModel(len, hh, S) {
  return {len, h: hh, plate: {w: S * 0.66, h: hh * 0.7}, slitX: len * 0.27, S};
}

/** Barcode-like bars on a plate (a different seed text gives a different pattern: a changed number reads with labels hidden). */
export function barsPath(Pl, seed = '') {
  let hsh = 7;
  for (const ch of String(seed)) hsh = (hsh * 31 + ch.charCodeAt(0)) % 9973;
  const out = [];
  let bx = -Pl.w * 0.4;
  let i = 0;
  while (bx < Pl.w * 0.4) { const k = (i * 7 + hsh) % 5; out.push(`M${r(bx)} ${r(-Pl.h * 0.3)}v${r(Pl.h * 0.6)}`); bx += (k < 2 ? 3.5 : 1.8) + 3 + ((i * 5 + hsh) % 4); i++; }
  return out.join('');
}

/** Plate overlay with bars for a seed (drawn over a strip whose plate is blank). */
export function plateBars(SM, seed, o = {}) {
  const Pl = SM.plate;
  return g({name: o.name, opacity: o.opacity},
    h('rect', {x: r(-Pl.w / 2), y: r(-Pl.h / 2), width: r(Pl.w), height: r(Pl.h), rx: 4, fill: '#fffdf6', stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: barsPath(Pl, seed), stroke: INK, 'stroke-width': 2.2}),
  );
}

/** Zig-zag slit across the strip at local x (a supplied mark). */
export function slitPath(SM) {
  const x = SM.slitX, hh = SM.h;
  const n = 5;
  let d = `M${r(x - hh * 0.06)} ${r(-hh / 2 - 3)}`;
  for (let i = 1; i <= n; i++) d += `L${r(x + (i % 2 ? hh * 0.1 : -hh * 0.06))} ${r(-hh / 2 + (hh * i) / n)}`;
  return d + `L${r(x)} ${r(hh / 2 + 3)}`;
}

/**
 * Seal strip art (local origin = centre). `numberFit` prints the number on the plate (else barcode bars).
 * Named parts: `${name}-slit` (opacity), `${name}-press` (width of the pressed tint from the left end).
 */
export function stripArt(ctx, SM, o) {
  const N = o.name;
  const L = SM.len, hh = SM.h, Pl = SM.plate;
  const ticks = [];
  for (let x = -L / 2 + SM.S * 0.05; x < L / 2 - 4; x += SM.S * 0.07) ticks.push(`M${r(x)} ${r(-hh / 2)}v${r(hh * 0.13)}M${r(x)} ${r(hh / 2)}v${r(-hh * 0.13)}`);
  const bars = !o.numberFit && !o.blank ? barsPath(Pl, o.barSeed || '') : '';
  return g({name: N},
    h('rect', {x: r(-L / 2 + 4), y: r(-hh / 2 + 5), width: r(L), height: r(hh), rx: 3, fill: '#000', opacity: 0.14}),
    h('rect', {x: r(-L / 2), y: r(-hh / 2), width: r(L), height: r(hh), rx: 3, fill: TAPE, stroke: INK, 'stroke-width': 2}),
    h('path', {d: ticks.join(''), stroke: TAPE_DARK, 'stroke-width': 2}),
    h('path', {d: `M${r(-L / 2 + 6)} ${r(-hh * 0.22)}H${r(L / 2 - 6)}M${r(-L / 2 + 6)} ${r(hh * 0.22)}H${r(L / 2 - 6)}`, stroke: shade(TAPE, 0.25), 'stroke-width': 1.6}),
    o.press ? h('rect', {name: `${N}-press`, x: r(-L / 2), y: r(-hh / 2), width: 0, height: r(hh), rx: 3, fill: TAPE_DARK, opacity: 0.28}) : null,
    h('rect', {x: r(-Pl.w / 2), y: r(-Pl.h / 2), width: r(Pl.w), height: r(Pl.h), rx: 4, fill: '#fffdf6', stroke: INK, 'stroke-width': 1.6}),
    o.numberFit ? textAt(o.numberFit, {x: 0, y: -o.numberFit.height / 2, anchor: 'middle', fill: INK, name: `${N}-num`}) : o.blank ? null : h('path', {d: bars, stroke: INK, 'stroke-width': 2.2}),
    g({name: `${N}-slit`, opacity: o.slit ? 1 : 0},
      h('path', {d: slitPath(SM), fill: 'none', stroke: '#fffdf6', 'stroke-width': r(Math.max(5, hh * 0.12), 2), 'stroke-linejoin': 'round'}),
      h('path', {d: slitPath(SM), fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    ),
  );
}

/**
 * Fit of the seal number on the plate at the legend size F (design units; supplied content is never smaller than the
 * legend captions), or null when it does not fit or would render under the floor (bars are drawn instead; the number
 * is always listed in the legend). Widens / heightens the plate of SM to the fitted text.
 * @param {number} vs  rendered px per design unit at 1080p
 */
export function numberFit(ctx, SM, text, F, vs = 1) {
  if (!ctx.show('key') || !String(text || '').trim()) return null;
  if (F * vs < 16) return null;
  const f = fitG(text, {maxWidth: SM.len * 0.4, size: F, minSize: F, maxLines: 1, weight: 700, family: 'mono'});
  if (!f.ok || F * 1.18 > SM.h * 0.92) return null;
  const pw = Math.max(SM.plate.w, f.width + F * 0.9);
  const sx = Math.max(SM.slitX, pw / 2 + SM.h * 0.4);
  if (sx > SM.len / 2 - SM.h * 0.35) return null; // the marked slit must never cross the printed number
  SM.plate = {w: pw, h: Math.max(SM.plate.h, F * 1.18)};
  SM.slitX = sx;
  return f;
}

/** Backing card the strip rests on (local origin = centre, same axes as the strip). */
export function backingCard(SM, o = {}) {
  const L = SM.len + SM.S * 0.12, hh = SM.h + SM.S * 0.12;
  return g({name: o.name},
    h('rect', {x: r(-L / 2 + 5), y: r(-hh / 2 + 7), width: r(L), height: r(hh), rx: 6, fill: '#000', opacity: 0.15}),
    h('rect', {x: r(-L / 2), y: r(-hh / 2), width: r(L), height: r(hh), rx: 6, fill: '#f4f1e8', stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: `M${r(-L * 0.42)} ${r(hh * 0.36)}h${r(L * 0.2)}`, stroke: '#c3bba5', 'stroke-width': 2, 'stroke-linecap': 'round'}),
  );
}

/* ------------------------------------------------------------------ */
/* Stage model and pose solver (story + contrast)                      */
/* ------------------------------------------------------------------ */

/**
 * Bench positions inside a box. 'side': object (right), pouch (centre), strip standing on its card (left);
 * 'top': strip lying (top-left), object (top-right), pouch below.
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {{kind:string, rows:number, chainN:number, arr?:'side'|'top'|'auto'}} o
 */
export function sealStage(box, o) {
  const Sside = Math.min(box.w / 4.15, box.h / 2.78);
  const Stop = Math.min(box.w / 3.6, box.h / 3.62);
  const arr = o.arr && o.arr !== 'auto' ? o.arr : (Sside >= Stop ? 'side' : 'top');
  const S = arr === 'side' ? Sside : Stop;
  const PM = pouchModel(S, {rows: o.rows, chainN: o.chainN});
  const SM = PM.strip;
  const M = objectModel(o.kind, S * 1.04);
  let bag, obj0, strip0;
  if (arr === 'side') {
    const ox = box.x + (box.w - 4.15 * S) / 2;
    const top = box.y + (box.h - 2.6 * S) / 2;
    // spare width spreads the strip and the object away from the pouch (bounded, so reaches stay plausible)
    const spare = Math.min(box.w - 4.15 * S, S * 1.2) * 0.4;
    strip0 = {c: {x: ox + S * 0.42 - spare, y: box.y + box.h / 2}, a: 90};
    bag = {x: ox + S * 0.95, y: top + PM.fh};
    obj0 = {x: bag.x + PM.w + S * 0.72 + spare, y: bag.y + S * 0.55};
  } else {
    const ox = box.x + (box.w - 3.6 * S) / 2;
    const top = box.y + (box.h - 3.55 * S) / 2;
    strip0 = {c: {x: ox + S * 0.1 + SM.len / 2, y: top + S * 0.3}, a: -4};
    obj0 = {x: ox + S * 3.6 - S * 0.62, y: top + S * 0.34};
    bag = {x: box.x + (box.w - PM.w) / 2, y: top + S * 0.95 + PM.fh};
  }
  const I = PM.inner;
  const objIn = {x: bag.x + I.x + I.w / 2, y: bag.y + I.y + I.h / 2};
  const stripOn = {c: {x: bag.x + PM.w / 2, y: bag.y + PM.fh}, a: 0};
  const fits = M.w <= I.w && M.h <= I.h + 2;
  return {arr, S, PM, SM, M, bag, obj0, objIn, strip0, stripOn, fits, box};
}

/** Rotate a local point by deg and translate (with optional scale). */
export function local(p, at, deg, sc = 1) {
  const a = (deg * Math.PI) / 180;
  return {x: at.x + (p.x * Math.cos(a) - p.y * Math.sin(a)) * sc, y: at.y + (p.x * Math.sin(a) + p.y * Math.cos(a)) * sc};
}

const mixP = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
export const objGripEP = M => ({x: M.kind === 'key' ? M.S * 0.16 : -M.S * 0.04, y: 0});

/**
 * Every pose of the packing action at (capped) time ua. W keys: reachObj, steadyIn, lift, carry, lower, toFlap,
 * fold, holdFlap, steadyOut, toStrip, carryStrip, lay, press, back. C: restR, restL. Pure.
 * @param {ReturnType<typeof sealStage>} G
 */
export function sealPose(G, C, W, ua, {doBag = true, doSeal = true} = {}) {
  const io = ease.inOutCubic;
  const on = (w, f = true) => (f ? seg(ua, ...w) : 0);
  const PM = G.PM, SM = G.SM;
  // object
  const objPos = doBag ? pathAt([[W.carry[0], G.obj0], [W.carry[1], G.objIn]], ua) : {...G.obj0};
  const lift = doBag ? io(on(W.lift)) * (1 - io(on(W.lower))) : 0;
  const inside = doBag && on(W.lower) >= 1;
  const og = objGripEP(G.M);
  const osc = 1 + lift * 0.06;
  const objG = {x: objPos.x + og.x * osc, y: objPos.y + og.y * osc};
  // flap
  const kF = io(on(W.fold, doSeal));
  const sy = Math.cos(Math.PI * kF);
  const hinge = {x: G.bag.x + PM.w / 2, y: G.bag.y};
  const flapG = k => { const s2 = Math.cos(Math.PI * k); return {x: hinge.x, y: hinge.y - PM.fh * s2 * 0.86}; };
  const flapHold = {x: G.bag.x + PM.w * 0.8, y: G.bag.y + PM.fh * 0.5};
  // strip
  const kC = io(on(W.carryStrip, doSeal));
  const kUp = io(on([W.carryStrip[0], W.carryStrip[0] + 0.02], doSeal));
  const kDown = io(on(W.lay, doSeal));
  const sLift = kUp * (1 - kDown);
  const sc = 1 + sLift * 0.06;
  const da = ((G.stripOn.a - G.strip0.a + 540) % 360) - 180;
  const stripC = mixP(G.strip0.c, G.stripOn.c, kC);
  const stripA = G.strip0.a + da * kC;
  const gripL = {x: -SM.len * 0.36, y: 0};
  const stripG = local(gripL, stripC, stripA, sc);
  const laid = doSeal && kDown >= 1;
  const kP = io(on(W.press, doSeal));
  const pressLocal = lerp(-SM.len * 0.12, SM.len * 0.43, kP);
  const pressP = local({x: pressLocal, y: 0}, G.stripOn.c, 0);
  const pressW = laid ? clamp((pressLocal + SM.len / 2) / SM.len) * SM.len * (kP > 0 ? 1 : 0) : 0;
  // right hand
  let handR, phase = 'rest';
  const kRO = io(on(W.reachObj, doBag));
  if (!doBag || ua < W.reachObj[0]) { handR = C.restR; }
  else if (ua < W.reachObj[1]) { handR = mixP(C.restR, objG, kRO); phase = 'reach-object'; }
  else if (ua < W.lower[1]) { handR = objG; phase = ua < W.lift[1] ? 'lift' : ua < W.carry[1] ? 'carry' : 'lower'; }
  else if (!doSeal) { const k = io(on(W.toFlap)); handR = mixP(objG, C.restR, k); phase = k >= 1 ? 'bagged' : 'return'; }
  else if (ua < W.toFlap[1]) { handR = mixP(objG, flapG(0), io(on(W.toFlap))); phase = 'to-flap'; }
  else if (ua < W.fold[1]) { handR = flapG(kF); phase = 'fold'; }
  else if (ua < W.holdFlap[1]) { handR = mixP(flapG(1), flapHold, io(on(W.holdFlap))); phase = 'hold-flap'; }
  else if (ua < W.press[0]) { handR = mixP(flapHold, local({x: -SM.len * 0.12, y: 0}, G.stripOn.c, 0), io(on([W.lay[0], W.press[0]]))); phase = ua < W.lay[0] ? 'hold-flap' : 'to-press'; }
  else if (ua < W.press[1]) { handR = pressP; phase = 'press'; }
  else { const k = io(on(W.back)); handR = mixP(pressP, C.restR, k); phase = k >= 1 ? 'sealed' : 'return'; }
  // left hand: steadies the pouch, then peels the strip and lays it on the seam (it holds the strip's left end
  // while the right hand presses)
  const steadyP = {x: G.bag.x + PM.w * 0.12, y: G.bag.y + PM.h * 0.93};
  let handL;
  const kSI = io(on(W.steadyIn, doBag)), kSO = io(on(W.steadyOut, doBag && !doSeal));
  if (!doSeal || ua < W.toStrip[0]) handL = kSO > 0 ? mixP(steadyP, C.restL, kSO) : mixP(C.restL, steadyP, kSI);
  else if (ua < W.toStrip[1]) handL = mixP(steadyP, stripG, io(on(W.toStrip)));
  else if (ua < W.back[0]) handL = stripG;
  else handL = mixP(stripG, C.restL, io(on(W.back)));
  const holdingStrip = doSeal && ua >= W.toStrip[1] && ua < W.lay[1];
  return {
    ua, objPos, lift, inside, objG, kF, sy, hinge, flapG: flapG(kF), stripC, stripA, stripSc: sc, stripG, laid, pressW, pressP,
    handR, handL, steadyP, phase,
    holdingObj: doBag && ua >= W.reachObj[1] && ua < W.lower[1],
    folding: doSeal && ua >= W.toFlap[1] && ua < W.fold[1],
    holdingStrip, pressing: doSeal && ua >= W.press[0] && ua < W.press[1],
    steadying: doBag && ua >= W.steadyIn[1] && ua < (doSeal ? W.toStrip[0] : W.steadyOut[0]),
    peeled: doSeal && ua >= W.carryStrip[0],
  };
}

/* ------------------------------------------------------------------ */
/* Stage renderer                                                      */
/* ------------------------------------------------------------------ */

function objCopy(ctx, G, N) {
  return g({name: N},
    g({name: `${N}-sh`, opacity: 0.2}, h('ellipse', {cx: 6, cy: 10, rx: r(G.M.w * 0.5), ry: r(G.M.h * 0.5), fill: '#000'})),
    objectArt(ctx, G.M),
  );
}

/**
 * Stage layers: {back, inside, front, flap, low, carried} (arms go between `low` and `carried`; thumbs above).
 * @param {any} ctx
 * @param {ReturnType<typeof sealStage>} G
 * @param {{prefix:string, rows:Array<{filled:boolean}>, chainN:number, number:any, slit?:boolean, seedKey?:string, marker?:boolean}} o
 */
export function sealNodes(ctx, G, o) {
  const P = o.prefix;
  const sk = o.seedKey || 'ep';
  const SM = G.SM;
  return {
    back: g({transform: T(G.bag.x, G.bag.y)}, pouchBack(ctx, G.PM, {name: `${P}-pb`})),
    inside: objCopy(ctx, G, `${P}-objIn`),
    front: g({transform: T(G.bag.x, G.bag.y)}, pouchFront(ctx, G.PM, {name: `${P}-pf`, rows: o.rows, chainN: o.chainN, seedKey: sk})),
    card: g({transform: T(G.strip0.c.x, G.strip0.c.y, G.strip0.a)}, backingCard(SM, {name: `${P}-card`})),
    flap: flapNode(ctx, G.PM, {name: `${P}-flap`, seedKey: sk}),
    low: g(null,
      g({name: `${P}-sLo`}, stripArt(ctx, SM, {name: `${P}-sLoA`, numberFit: o.number, press: true, slit: false})),
      o.marker ? changedMarker(ctx, {name: `${P}-mk`, x: 0, y: 0, radius: Math.max(16, G.S * 0.11), opacity: 0}) : null,
    ),
    carried: g(null,
      objCopy(ctx, G, `${P}-objOut`),
      g({name: `${P}-sHi`, opacity: 0}, stripArt(ctx, SM, {name: `${P}-sHiA`, numberFit: o.number, slit: false})),
    ),
  };
}

/**
 * Stage frame props for a pose. `slit` = opacity of the marked alteration on the strip; `marker` = opacity of the Δ.
 */
export function sealProps(P, G, s, {slit = 0, marker = 0, markerAt = null} = {}) {
  const out = {};
  const osc = 1 + s.lift * 0.06;
  out[`${P}-objIn`] = {opacity: s.inside ? 1 : 0, transform: T(s.objPos.x, s.objPos.y, 0, osc)};
  out[`${P}-objOut`] = {opacity: s.inside ? 0 : 1, transform: T(s.objPos.x, s.objPos.y, 0, osc)};
  out[`${P}-objIn-sh`] = {opacity: r(0.12 + s.lift * 0.16, 3), transform: T(s.lift * 8, s.lift * 10)};
  out[`${P}-objOut-sh`] = {opacity: r(0.12 + s.lift * 0.16, 3), transform: T(s.lift * 8, s.lift * 10)};
  out[`${P}-flap`] = {transform: `${T(s.hinge.x, s.hinge.y)} scale(1 ${r(Math.abs(s.sy) < 0.02 ? 0.02 * Math.sign(s.sy || 1) : s.sy, 4)})`};
  out[`${P}-flap-in`] = {opacity: s.sy >= 0 ? 1 : 0};
  out[`${P}-flap-out`] = {opacity: s.sy >= 0 ? 0 : 1};
  const hi = s.holdingStrip;
  out[`${P}-sLo`] = {opacity: hi ? 0 : 1, transform: T(s.stripC.x, s.stripC.y, s.stripA, s.stripSc)};
  out[`${P}-sHi`] = {opacity: hi ? 1 : 0, transform: T(s.stripC.x, s.stripC.y, s.stripA, s.stripSc)};
  out[`${P}-sLoA-press`] = {width: r(s.pressW)};
  out[`${P}-sLoA-slit`] = {opacity: r(slit, 3)};
  out[`${P}-sHiA-slit`] = {opacity: r(slit, 3)};
  if (markerAt) out[`${P}-mk`] = {opacity: r(marker, 3), transform: T(markerAt.x, markerAt.y)};
  return out;
}

/** World position of the slit centre for a strip pose. */
export function slitAt(G, c, a, sc = 1) {
  return local({x: G.SM.slitX, y: 0}, c, a, sc);
}

/** Where the Δ marker of a marked alteration sits: just beside the slit, on the strip's upper side (rides with it). */
export function markerAt(G, c, a, sc = 1) {
  return local({x: G.SM.slitX + G.S * 0.05, y: -(G.SM.h / 2 + G.S * 0.17)}, c, a, sc);
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

/** Motif legend icons (ep-seal, ep-pouch, ep-label, ep-chain, ep-alter) with the category icons as fallback. */
export function epIcon(ctx, kind, s, o = {}) {
  if (kind === 'ep-seal') {
    return g(null,
      h('rect', {x: r(-s * 0.48), y: r(-s * 0.16), width: r(s * 0.96), height: r(s * 0.32), rx: 2, fill: TAPE, stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-s * 0.18), y: r(-s * 0.1), width: r(s * 0.36), height: r(s * 0.2), rx: 2, fill: '#fffdf6', stroke: INK, 'stroke-width': 1.2}),
    );
  }
  if (kind === 'ep-alter') {
    return g(null,
      h('rect', {x: r(-s * 0.48), y: r(-s * 0.16), width: r(s * 0.96), height: r(s * 0.32), rx: 2, fill: TAPE, stroke: INK, 'stroke-width': 1.6}),
      h('path', {d: `M${r(s * 0.02)} ${r(-s * 0.2)}l${r(s * 0.08)} ${r(s * 0.1)}l${r(-s * 0.1)} ${r(s * 0.1)}l${r(s * 0.1)} ${r(s * 0.1)}l${r(-s * 0.06)} ${r(s * 0.1)}`, fill: 'none', stroke: INK, 'stroke-width': 2}),
    );
  }
  if (kind === 'ep-pouch') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.34, -s * 0.36, s * 0.68, s * 0.82, 4), fill: '#dbe5eb', stroke: BAG_EDGE, 'stroke-width': 2}),
      h('path', {d: `M${r(-s * 0.34)} ${r(-s * 0.36)}h${r(s * 0.68)}v${r(s * 0.2)}h${r(-s * 0.68)}Z`, fill: FLAP, stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-s * 0.4), y: r(-s * 0.2), width: r(s * 0.8), height: r(s * 0.1), fill: TAPE, stroke: INK, 'stroke-width': 1.2}),
    );
  }
  if (kind === 'ep-label') {
    return g(null,
      h('rect', {x: r(-s * 0.4), y: r(-s * 0.3), width: r(s * 0.8), height: r(s * 0.6), rx: 3, fill: '#fbfaf6', stroke: BAG_EDGE, 'stroke-width': 1.8}),
      h('rect', {x: r(-s * 0.4), y: r(-s * 0.3), width: r(s * 0.8), height: r(s * 0.12), rx: 3, fill: '#c7d5df'}),
      h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.04)}h${r(s * 0.55)}M${r(-s * 0.3)} ${r(s * 0.14)}h${r(s * 0.4)}`, stroke: WRITE_INK, 'stroke-width': 2}),
    );
  }
  if (kind === 'ep-chain') {
    return g(null,
      h('rect', {x: r(-s * 0.46), y: r(-s * 0.14), width: r(s * 0.34), height: r(s * 0.28), rx: 3, fill: '#eef2f4', stroke: '#7d8a94', 'stroke-width': 1.6}),
      h('rect', {x: r(s * 0.12), y: r(-s * 0.14), width: r(s * 0.34), height: r(s * 0.28), rx: 3, fill: '#eef2f4', stroke: '#7d8a94', 'stroke-width': 1.6}),
      h('ellipse', {cx: r(-s * 0.05), cy: 0, rx: r(s * 0.08), ry: r(s * 0.05), fill: 'none', stroke: '#5d656c', 'stroke-width': 2}),
      h('ellipse', {cx: r(s * 0.05), cy: 0, rx: r(s * 0.08), ry: r(s * 0.05), fill: 'none', stroke: '#5d656c', 'stroke-width': 2}),
    );
  }
  if (kind === 'ep-delta') return changedMarker(ctx, {radius: s * 0.32});
  return legendIcon(ctx, kind, s, o);
}

/** Legend panel node (like the category panel, with the motif icons). Every row is a named group. */
export function epPanelNode(ctx, PL) {
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
      if (row.icon) parts.push(g({transform: T(F * 0.8, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, epIcon(ctx, row.icon, F * 1.3, {color: row.color, key: row.name})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}

export {FONTS};
