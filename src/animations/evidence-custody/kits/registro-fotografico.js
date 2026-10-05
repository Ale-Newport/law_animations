/**
 * "Registro fotográfico" motif kit (evidence-custody-04, LAW-0373..0376). Art and solvers for photographing one
 * fictional object from several framings with an abstract camera on an articulated copy-stand arm. The category look
 * (bench, gloved arms, objects, tag, ball chain, bag, legend, text fitting) comes READ-ONLY from ./evidence-art.js;
 * everything specific to this motif is drawn here:
 *
 *  - SUBJECT CLUSTER: the object (key / mug / box) with its manila tag hung on a ball chain, and an open evidence bag
 *    lying beside it. The key is mirrored so every object's chain eyelet faces the tag.
 *  - PHOTO SCALE: an L-shaped photographic scale (black / white blocks, tick marks) that a gloved hand lays along the
 *    object's lower-left corner before the detail views.
 *  - CAMERA ON A STAND: a top-down abstract camera (body, lens barrel, rear handle, shutter button, mode dial) carried
 *    by a two-segment metal stand arm clamped to the bench edge. Its framing is shown as a translucent view wedge from
 *    the lens to a bracketed field rectangle on the mat: far away = overview (vista general), close = detail.
 *  - PRINTS: each exposure lifts a real copy of exactly the framed field (same coordinates, white border fading in)
 *    and carries it to its numbered slot on a photo board; a thread then joins every print to the same pin on the
 *    object. A print copies the scene; nothing about it signals validity or any legal state.
 *
 * Solvers: `rfStage` (positions for the cluster, fields, camera stations, stand base and the photo board inside a
 * box), `rfPose` (every pose of the photographing action at an already-capped time).
 * @module animations/evidence-custody/kits/registro-fotografico
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r, seg, lerp, ease} from '../../../core/time.js';
import {roundRectPath, ik2} from '../../../core/geometry.js';
import {str, list, obj, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {
  objectModel, objectArt, tagModel, tagArt, chainD, bagModel, bagBack, bagFront, legendIcon, textAt, pathAt,
  INK, MAT, MAT_LINE, METAL, METAL_DARK, STEEL,
} from './evidence-art.js';

/* ------------------------------------------------------------------ */
/* Motif defaults and fields                                           */
/* ------------------------------------------------------------------ */

export const VIEW_TARGETS = ['scene', 'object', 'tag'];
export const PRINT_AR = 1 / (0.89 / 1.5 + 0.055 * 2.6); // print (border included); its image is 3:2 like every field
const CAM_DARK = '#3b4147';
const CAM_MID = '#59616a';
const CAM_LENS = '#262a2f';
const BOARD = '#e8e4da';
const THREAD = '#b8862f';

export const RF_EN = {
  items: [{id: 'Item E-04 (fictional)', label: 'Ceramic mug left on a table (fictional)', kind: 'cup'}],
  custodians: [{name: 'M. Haddad (fictional)', role: 'Person photographing the item'}],
  timestamps: [{label: 'Overview taken', time: '14:02 (illustrative)'}, {label: 'Detail taken', time: '14:04 (illustrative)'}],
  records: [
    {field: 'Item no.', value: 'E-04'},
    {field: 'Description', value: 'Ceramic mug'},
    {field: 'Photos', value: '3 views'},
  ],
  views: [
    {label: 'Photo 1 · Overview', target: 'scene'},
    {label: 'Photo 2 · Documented detail with scale', target: 'object'},
    {label: 'Photo 3 · Tag on its chain', target: 'tag'},
  ],
  labels: {key: 'As supplied · no conclusion drawn', blank: '(left blank, as supplied)'},
};
export const RF_ES = {
  items: [{id: 'Indicio E-04 (ficticio)', label: 'Taza de cerámica dejada en una mesa (ficticia)', kind: 'cup'}],
  custodians: [{name: 'M. Haddad (ficticia)', role: 'Persona que fotografía el objeto'}],
  timestamps: [{label: 'Vista general tomada', time: '14:02 (ilustrativo)'}, {label: 'Detalle tomado', time: '14:04 (ilustrativo)'}],
  records: [
    {field: 'N.º de indicio', value: 'E-04'},
    {field: 'Descripción', value: 'Taza de cerámica'},
    {field: 'Fotos', value: '3 vistas'},
  ],
  views: [
    {label: 'Foto 1 · Vista general', target: 'scene'},
    {label: 'Foto 2 · Detalle documentado con escala', target: 'object'},
    {label: 'Foto 3 · Etiqueta en su cadena', target: 'tag'},
  ],
  labels: {key: 'Según lo aportado · sin conclusión', blank: '(en blanco, según lo aportado)'},
};

export const rfFields = {
  views: list('Views photographed, in order (each becomes one print). target picks the framing: scene = overview of the whole cluster, object = close detail of the object with the scale, tag = the tag on its chain', obj('View', {
    label: str('Caption of the view / print (fictional)', 60),
    target: oneOf('Framing: scene, object or tag', VIEW_TARGETS),
  }, ['label', 'target']), 2, 3),
  labels: obj('Editable captions', {
    key: str('Neutral key (must say that no conclusion is drawn)', 80),
    blank: str('Text shown for a tag row the author left blank', 50),
  }, ['key', 'blank']),
};

/** Records with their written / blank state. */
export function rfRecords(P) {
  return P.records.map(rw => ({field: rw.field, value: rw.value, filled: String(rw.value || '').trim().length > 0}));
}
export const rfRecordLine = (rw, blank) => `${rw.field}: ${rw.filled ? rw.value : blank}`;

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Local → world for a frame at c rotated by deg (degrees). */
export function toWorld(p, c, deg) {
  const a = (deg * Math.PI) / 180;
  const ca = Math.cos(a), sa = Math.sin(a);
  return {x: c.x + p.x * ca - p.y * sa, y: c.y + p.x * sa + p.y * ca};
}
/** Camera rotation (deg) so that its lens (local −y) points from c to target. */
export const aimDeg = (c, t) => (Math.atan2(t.y - c.y, t.x - c.x) * 180) / Math.PI + 90;
const boxU = (a, b) => ({x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y)});
const hitBox = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** Camera model for unit Cs (local origin = body centre = stand mount; lens toward −y). */
export function cameraModel(Cs) {
  return {
    Cs,
    body: {x: -0.5 * Cs, y: -0.24 * Cs, w: Cs, h: 0.48 * Cs},
    lens: {x: -0.21 * Cs, y: -0.66 * Cs, w: 0.42 * Cs, h: 0.44 * Cs},
    handle: {x: -0.2 * Cs, y: 0.22 * Cs, w: 0.4 * Cs, h: 0.26 * Cs},
    tip: {x: 0, y: -0.66 * Cs},
    grip: {x: 0, y: 0.36 * Cs},
    button: {x: 0.32 * Cs, y: -0.06 * Cs},
    radius: 0.62 * Cs,
  };
}

/** Field rectangle (3:2) around a target of the unit cluster (S = 1, object centre = origin). */
function unitField(target) {
  if (target === 'scene') return {x: -1.8, y: -1.36, w: 3.75, h: 2.5};
  if (target === 'tag') return {x: 0.38, y: -1.07, w: 1.56, h: 1.04};
  return {x: -0.86, y: -0.5, w: 1.62, h: 1.08};
}

/**
 * Stage layout inside box `B` (design units).
 * @param {{x:number,y:number,w:number,h:number}} B
 * @param {{kind:string, targets:string[], slots:number, tray:'right'|'top'|'left'|'bottom', trayFrac:number, rows:number, approach?:'down'|'left'}} o
 */
export function rfStage(B, o) {
  const approach = o.approach || 'down';
  const a = approach === 'down' ? {x: 0, y: 1} : {x: -1, y: 0};
  // unit cluster (S = 1)
  const Mu = objectModel(o.kind, 1);
  const anchorU = {x: o.kind === 'key' ? -Mu.anchor.x : Mu.anchor.x, y: Mu.anchor.y};
  const T0u = tagModel({w: 1.12, h: 0.5, rows: Math.max(2, o.rows)});
  const holeU = {x: 0.78, y: -0.62};
  const bagU = {x: -1.68, y: -0.52, w: 0.84, h: 1.06};
  const rulerU = {L: 0.82, Lv: 0.6, w: 0.1};
  const rulerPlacedU = {x: -0.62, y: 0.47, a: 0};
  const rulerRestU = {x: 1.02, y: 0.86, a: -12};
  const items = [
    {x: -Mu.w / 2, y: -Mu.h / 2, w: Mu.w, h: Mu.h},
    {x: holeU.x + T0u.x0, y: holeU.y - 0.25, w: T0u.w, h: 0.5},
    bagU,
    {x: rulerPlacedU.x, y: rulerPlacedU.y - rulerU.Lv, w: rulerU.L, h: rulerU.Lv},
  ];
  const fieldsU = VIEW_TARGETS.map(t => ({...unitField(t), target: t}));
  const CsU = 0.76;
  const CMu = cameraModel(CsU);
  const stationFor = (F, dir) => {
    const ext = dir.y ? F.h / 2 : F.w / 2;
    const gap = 0.12 * F.w + 0.62 * CsU + 0.06;
    const c = {x: F.x + F.w / 2 + dir.x * (ext + gap), y: F.y + F.h / 2 + dir.y * (ext + gap)};
    return c;
  };
  const stations = {};
  for (const F of fieldsU) {
    let best = null;
    for (const dir of [a, {x: 0, y: 1}, {x: 1, y: 0}]) {
      const c = stationFor(F, dir);
      const fp = {x: c.x - CMu.radius, y: c.y - CMu.radius, w: CMu.radius * 2, h: CMu.radius * 2};
      const clash = items.some(it => hitBox(fp, it, 0.02));
      if (!clash) { best = c; break; }
      if (!best) best = c;
    }
    const tc = {x: F.x + F.w / 2, y: F.y + F.h / 2};
    stations[F.target] = {...best, a: aimDeg(best, tc)};
  }
  const used = o.targets.map(t => stations[t]);
  const ov = stations[o.targets[0]];
  // stand base on the far side of the first station; park beside it
  const perp = approach === 'down' ? {x: -1, y: 0} : {x: 0, y: -1};
  const baseU = {x: ov.x + a.x * 0.3 + perp.x * 1.25, y: ov.y + a.y * 0.3 + perp.y * 1.25};
  const parkU = {x: baseU.x - a.x * 0.75 - perp.x * 0.1, y: baseU.y - a.y * 0.75 - perp.y * 0.1};
  parkU.a = aimDeg(parkU, {x: 0, y: 0});
  // unit bounding box of the stage (cluster, fields used, cameras at their stations, base)
  let bb = items.reduce(boxU);
  if (o.restRuler !== false) bb = boxU(bb, {x: rulerRestU.x - 0.05, y: rulerRestU.y - rulerU.Lv - 0.1, w: rulerU.L + 0.2, h: rulerU.Lv + 0.15});
  for (const t of o.targets) bb = boxU(bb, fieldsU.find(f => f.target === t));
  for (const s of [...used, parkU]) bb = boxU(bb, {x: s.x - CMu.radius - 0.08, y: s.y - CMu.radius - 0.08, w: (CMu.radius + 0.08) * 2, h: (CMu.radius + 0.08) * 2});
  bb = boxU(bb, {x: baseU.x - 0.3, y: baseU.y - 0.3, w: 0.6, h: 0.6});
  // tray
  const n = Math.max(1, o.slots);
  const side = o.tray;
  const gapT = 0.05;
  let S, zone, tray;
  if (side === 'inset') {
    // one slot in the free lower-right corner of the stage (right of the camera stations, below the tag)
    S = Math.min(B.w / bb.w, B.h / bb.h);
    zone = B;
    tray = null;
  } else if (side === 'right' || side === 'left') {
    const tw = B.w * o.trayFrac;
    const zw = B.w - tw - B.w * gapT;
    S = Math.min(zw / bb.w, B.h / bb.h);
    zone = {x: side === 'right' ? B.x : B.x + tw + B.w * gapT, y: B.y, w: zw, h: B.h};
    const sg = o.slotGap ?? 0.05;
    const pw = Math.min(tw * 0.86, ((B.h * 0.94 - (n - 1) * B.h * sg) / n) * PRINT_AR);
    const ph = pw / PRINT_AR;
    // pack: stage and board side by side as one centred group
    const tu = Math.min(tw, pw / 0.86), gapW = B.w * gapT;
    const total = bb.w * S + gapW + tu;
    const gx = B.x + Math.max(0, (B.w - total) / 2);
    zone = side === 'right' ? {x: gx, y: B.y, w: bb.w * S, h: B.h} : {x: gx + tu + gapW, y: B.y, w: bb.w * S, h: B.h};
    const tx = side === 'right' ? gx + bb.w * S + gapW : gx;
    tray = {x: tx, y: B.y, w: tu, h: B.h, pw, ph, slots: Array.from({length: n}, (_, i) => {
      const tot = n * ph + (n - 1) * B.h * sg;
      return {x: tx + (tu - pw) / 2, y: B.y + (B.h - tot) / 2 + i * (ph + B.h * sg), w: pw, h: ph};
    })};
  } else {
    const th = B.h * o.trayFrac;
    const zh = B.h - th - B.h * gapT;
    S = Math.min(B.w / bb.w, zh / bb.h);
    zone = {x: B.x, y: side === 'top' ? B.y + th + B.h * gapT : B.y, w: B.w, h: zh};
    const pw = Math.min(((B.w * 0.96) / n - B.w * 0.03), th * 0.84 * PRINT_AR);
    const ph = pw / PRINT_AR;
    const ty = side === 'top' ? B.y : B.y + B.h - th;
    tray = {x: B.x, y: ty, w: B.w, h: th, pw, ph, slots: Array.from({length: n}, (_, i) => {
      const tot = n * pw + (n - 1) * B.w * 0.03;
      return {x: B.x + (B.w - tot) / 2 + i * (pw + B.w * 0.03), y: ty + (th - ph) / 2, w: pw, h: ph};
    })};
  }
  const ox = zone.x + (zone.w - bb.w * S) / 2 - bb.x * S;
  const oy = zone.y + (zone.h - bb.h * S) / 2 - bb.y * S;
  const W = p => ({x: ox + p.x * S, y: oy + p.y * S});
  const WB = b => ({x: ox + b.x * S, y: oy + b.y * S, w: b.w * S, h: b.h * S});
  if (!tray) {
    const camR = Math.max(...used.map(c => c.x)) + CMu.radius + 0.06;
    const x0 = Math.max(camR, 0.5), x1 = bb.x + bb.w - 0.02;
    const pwU = x1 - x0, phU = pwU / PRINT_AR;
    const y1 = bb.y + bb.h - 0.02, y0 = Math.max(y1 - phU, 1.0);
    const sl = WB({x: x0, y: y0, w: pwU, h: phU});
    tray = {x: sl.x, y: sl.y, w: sl.w, h: sl.h, pw: sl.w, ph: sl.h, slots: [sl]};
  }
  const M = objectModel(o.kind, S);
  const T0 = tagModel({w: 1.12 * S, h: 0.5 * S, rows: Math.max(2, o.rows)});
  const fields = {};
  for (const F of fieldsU) fields[F.target] = {...WB(F), target: F.target};
  const st = {};
  for (const k of Object.keys(stations)) st[k] = {...W(stations[k]), a: stations[k].a};
  const base = W(baseU);
  const park = {...W(parkU), a: parkU.a};
  const CM = cameraModel(CsU * S);
  let far = 0;
  for (const s of [...o.targets.map(t => st[t]), park]) far = Math.max(far, Math.hypot(s.x - base.x, s.y - base.y));
  const armL = far * 0.56 + 6;
  const objC = W({x: 0, y: 0});
  const stageBox = WB(bb);
  return {
    S, M, T0, CM, approach, a, perp,
    objC, mirror: o.kind === 'key',
    anchor: W(anchorU), hole: W(holeU),
    bag: {...WB(bagU), B: bagModel(bagU.w * S, bagU.h * S)},
    ruler: {L: rulerU.L * S, Lv: rulerU.Lv * S, w: rulerU.w * S, placed: {...W(rulerPlacedU), a: 0}, rest: {...W(rulerRestU), a: rulerRestU.a}},
    fields, stations: st, base, park, armL, tray, zone, stageBox,
    targets: o.targets.slice(),
    pin: {x: objC.x - M.w * 0.08, y: objC.y - M.h * 0.05},
    fits: S > 0 && tray.pw > 0,
  };
}

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

/** Mat patch (green with grid lines) covering a rect — background of a print image or lens. */
export function matPatch(ctx, b, step) {
  const lines = [];
  const s0 = step || 60;
  for (let x = Math.ceil(b.x / s0) * s0; x < b.x + b.w; x += s0) lines.push(`M${r(x)} ${r(b.y)}V${r(b.y + b.h)}`);
  for (let y = Math.ceil(b.y / s0) * s0; y < b.y + b.h; y += s0) lines.push(`M${r(b.x)} ${r(y)}H${r(b.x + b.w)}`);
  return g(null,
    h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), fill: MAT}),
    h('path', {d: lines.join(''), stroke: MAT_LINE, 'stroke-width': 1.4, opacity: 0.55, fill: 'none'}),
  );
}

/** L-shaped photo scale (local origin = outer corner; arms along +x and −y). */
export function rulerArt(ctx, G, o = {}) {
  const {L, Lv, w} = G.ruler;
  const n = 8, nv = 6;
  const parts = [
    h('path', {d: `M0 0H${r(L)}V${r(-w)}H${r(w)}V${r(-Lv)}H0Z`, fill: '#f4f2ec', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
  for (let i = 0; i < n; i += 2) parts.push(h('rect', {x: r(w + ((L - w) / n) * i), y: r(-w * 0.55), width: r((L - w) / n), height: r(w * 0.55), fill: '#22262a'}));
  for (let i = 1; i < nv; i += 2) parts.push(h('rect', {x: 0, y: r(-w - ((Lv - w) / nv) * (i + 1)), width: r(w * 0.55), height: r((Lv - w) / nv), fill: '#22262a'}));
  const ticks = [];
  for (let i = 0; i <= n; i++) ticks.push(`M${r(w + ((L - w) / n) * i)} ${r(-w)}v${r(w * (i % 2 ? 0.25 : 0.4))}`);
  for (let i = 0; i <= nv; i++) ticks.push(`M${r(w)} ${r(-w - ((Lv - w) / nv) * i)}h${r(-w * (i % 2 ? 0.25 : 0.4))}`);
  parts.push(h('path', {d: ticks.join(''), stroke: INK, 'stroke-width': 1.3, fill: 'none'}));
  parts.push(h('circle', {cx: r(w * 0.5), cy: r(-w * 0.5), r: r(w * 0.2), fill: '#c9452e', stroke: INK, 'stroke-width': 1}));
  return g({name: o.name, opacity: o.opacity}, parts);
}

/** Top-down camera (local origin = mount; lens toward −y). Named sub-node `${name}-btn` (shutter). */
export function cameraArt(ctx, CM, o = {}) {
  const Cs = CM.Cs;
  const B = CM.body, Lz = CM.lens, Hd = CM.handle;
  const ridges = [];
  for (let i = 1; i < 5; i++) ridges.push(`M${r(Lz.x + 2)} ${r(Lz.y + (Lz.h / 5) * i)}H${r(Lz.x + Lz.w - 2)}`);
  const grip = [];
  for (let i = 1; i < 5; i++) grip.push(`M${r(Hd.x + (Hd.w / 5) * i)} ${r(Hd.y + Hd.h * 0.25)}V${r(Hd.y + Hd.h * 0.8)}`);
  return g({name: o.name},
    h('path', {d: roundRectPath(B.x + 7, B.y + 10, B.w, B.h, Cs * 0.08), fill: '#000', opacity: 0.2}),
    h('path', {d: roundRectPath(Hd.x, Hd.y, Hd.w, Hd.h, Cs * 0.08), fill: CAM_LENS, stroke: INK, 'stroke-width': 2}),
    h('path', {d: grip.join(''), stroke: CAM_MID, 'stroke-width': 2}),
    h('path', {d: roundRectPath(Lz.x, Lz.y, Lz.w, Lz.h, Cs * 0.04), fill: CAM_LENS, stroke: INK, 'stroke-width': 2}),
    h('path', {d: ridges.join(''), stroke: '#4a5158', 'stroke-width': 2}),
    h('rect', {x: r(Lz.x - Cs * 0.02), y: r(Lz.y - Cs * 0.01), width: r(Lz.w + Cs * 0.04), height: r(Cs * 0.06), rx: 3, fill: '#8a939b', stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, Cs * 0.09), fill: CAM_DARK, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(B.x + Cs * 0.05, B.y + Cs * 0.05, B.w - Cs * 0.1, B.h * 0.3, Cs * 0.05), fill: shade(CAM_DARK, 0.18)}),
    h('path', {d: roundRectPath(-Cs * 0.17, -Cs * 0.2, Cs * 0.34, Cs * 0.32, Cs * 0.05), fill: CAM_MID, stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(-Cs * 0.08), y: r(-Cs * 0.12), width: r(Cs * 0.16), height: r(Cs * 0.08), rx: 2, fill: '#2b2f34'}),
    h('circle', {cx: r(-Cs * 0.33), cy: r(-Cs * 0.05), r: r(Cs * 0.085), fill: '#7d868e', stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: `M${r(-Cs * 0.33)} ${r(-Cs * 0.12)}v${r(Cs * 0.05)}`, stroke: INK, 'stroke-width': 1.6}),
    h('circle', {name: o.name ? `${o.name}-btn` : undefined, cx: r(CM.button.x), cy: r(CM.button.y), r: r(Cs * 0.065), fill: '#cfd3d6', stroke: INK, 'stroke-width': 1.6}),
  );
}

/** Stand arm nodes (two metal segments, joints, bench clamp). Pose with `standProps`. */
export function standNodes(ctx, G, name) {
  const wd = Math.max(10, G.S * 0.09);
  const b = G.base;
  return g({name},
    h('path', {d: roundRectPath(b.x - wd * 1.6, b.y - wd * 1.6, wd * 3.2, wd * 3.2, wd * 0.5), fill: STEEL, stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: r(b.x), cy: r(b.y), r: r(wd * 0.9), fill: METAL, stroke: INK, 'stroke-width': 2}),
    h('line', {name: `${name}-s1o`, stroke: INK, 'stroke-width': r(wd + 4), 'stroke-linecap': 'round'}),
    h('line', {name: `${name}-s1`, stroke: '#b9c0c5', 'stroke-width': r(wd), 'stroke-linecap': 'round'}),
    h('line', {name: `${name}-s2o`, stroke: INK, 'stroke-width': r(wd * 0.85 + 4), 'stroke-linecap': 'round'}),
    h('line', {name: `${name}-s2`, stroke: '#cfd5d9', 'stroke-width': r(wd * 0.85), 'stroke-linecap': 'round'}),
    h('circle', {name: `${name}-j`, r: r(wd * 0.75), fill: METAL_DARK, stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(b.x), cy: r(b.y), r: r(wd * 0.5), fill: METAL_DARK, stroke: INK, 'stroke-width': 1.6}),
  );
}
/** Stand pose: solves the elbow (kept on the side away from the subject). */
export function standProps(name, G, cam) {
  const away = G.perp;
  const s1 = ik2(G.base, cam, G.armL, G.armL, 1), s2 = ik2(G.base, cam, G.armL, G.armL, -1);
  const score = s => (s.elbow.x - G.base.x) * away.x + (s.elbow.y - G.base.y) * away.y - Math.hypot(s.elbow.x - G.objC.x, s.elbow.y - G.objC.y) * -0.001;
  const s = score(s1) >= score(s2) ? s1 : s2;
  const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
  return {
    [`${name}-s1o`]: line(G.base, s.elbow), [`${name}-s1`]: line(G.base, s.elbow),
    [`${name}-s2o`]: line(s.elbow, cam), [`${name}-s2`]: line(s.elbow, cam),
    [`${name}-j`]: {cx: r(s.elbow.x), cy: r(s.elbow.y)},
  };
}

/** Wedge (lens tip → the two angular extremes of the field) and field bracket paths. */
export function wedgeD(G, cam, F) {
  const tip = toWorld(G.CM.tip, cam, cam.a);
  const cs = [{x: F.x, y: F.y}, {x: F.x + F.w, y: F.y}, {x: F.x + F.w, y: F.y + F.h}, {x: F.x, y: F.y + F.h}];
  const base = Math.atan2(F.y + F.h / 2 - tip.y, F.x + F.w / 2 - tip.x);
  const ang = c => { let d = Math.atan2(c.y - tip.y, c.x - tip.x) - base; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const sorted = cs.slice().sort((p, q) => ang(p) - ang(q));
  const lo = sorted[0], hi = sorted[3];
  return {tip, wedge: `M${r(tip.x)} ${r(tip.y)}L${r(lo.x)} ${r(lo.y)}L${r(hi.x)} ${r(hi.y)}Z`};
}
export function bracketD(F) {
  const k = Math.min(F.w, F.h) * 0.18;
  const {x, y, w, h: hh} = F;
  return `M${r(x)} ${r(y + k)}V${r(y)}H${r(x + k)}M${r(x + w - k)} ${r(y)}H${r(x + w)}V${r(y + k)}M${r(x + w)} ${r(y + hh - k)}V${r(y + hh)}H${r(x + w - k)}M${r(x + k)} ${r(y + hh)}H${r(x)}V${r(y + hh - k)}`;
}
/** Wedge + field node (named `${name}-wedge`, `${name}-box`, `${name}-br`). */
export function wedgeNodes(ctx, name) {
  return g({name, opacity: 0},
    h('path', {name: `${name}-wedge`, fill: '#ffffff', opacity: 0.16, stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': '10 8', 'stroke-opacity': 0.75}),
    h('rect', {name: `${name}-box`, fill: '#ffffff', opacity: 0.1, stroke: '#ffffff', 'stroke-width': 1.5, 'stroke-opacity': 0.6}),
    h('path', {name: `${name}-br`, fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round'}),
  );
}
export function wedgeProps(name, G, cam, F, op) {
  const W = wedgeD(G, cam, F);
  return {
    [name]: {opacity: r(op, 3)},
    [`${name}-wedge`]: {d: W.wedge},
    [`${name}-box`]: {x: r(F.x), y: r(F.y), width: r(F.w), height: r(F.h)},
    [`${name}-br`]: {d: bracketD(F)},
  };
}

/**
 * Static subject cluster (bag, chain, object, tag) in world coordinates. `prefix` makes the tag's row names unique
 * (every copy — scene, prints, lens — needs its own prefix). `ruler` adds the placed scale.
 */
export function subjectArt(ctx, G, o) {
  const {M, T0} = G;
  const bag = G.bag;
  const rows = o.rows.map(rw => ({filled: rw.filled, len: 0.8}));
  const sag = G.S * 0.12;
  const bw = Math.max(5, G.S * 0.05);
  const d = chainD(G.anchor, G.hole, sag);
  return g({name: o.name},
    g({transform: T(bag.x, bag.y)}, bagBack(ctx, bag.B, {}), bagFront(ctx, bag.B, {})),
    g({opacity: 0.22}, h('ellipse', {cx: r(G.objC.x + 6), cy: r(G.objC.y + 10), rx: r(M.w * 0.5), ry: r(M.h * 0.5), fill: '#000'})),
    g({transform: G.mirror ? `${T(G.objC.x, G.objC.y)} scale(-1 1)` : T(G.objC.x, G.objC.y)}, objectArt(ctx, M)),
    g({transform: T(G.hole.x, G.hole.y, 8)}, tagArt(ctx, T0, {prefix: `${o.prefix}-tag`, rows, seedKey: o.seedKey || 'rf'})),
    h('path', {d, fill: 'none', stroke: METAL_DARK, 'stroke-width': r(bw * 0.3, 2), 'stroke-linecap': 'round'}),
    h('path', {d, fill: 'none', stroke: METAL, 'stroke-width': r(bw, 2), 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.35, 2)}`}),
    o.ruler ? g({transform: T(G.ruler.placed.x, G.ruler.placed.y, G.ruler.placed.a)}, rulerArt(ctx, G)) : null,
  );
}

/**
 * Print art: white border + image = a real copy of field F (the subject at the same coordinates, scaled to fit).
 * Local origin = print centre; size pw × ph at scale 1. Number badge (text when `numberText`, pips otherwise).
 */
/** Image rect of a print of width pw centred at (cx, cy) at scale 1, and the field → print scale k. */
export function printImage(pw, F, cx = 0, cy = 0) {
  const ph = pw / PRINT_AR;
  const m = Math.max(5, pw * 0.055);
  const iw = pw - m * 2;
  const img = {x: cx - pw / 2 + m, y: cy - ph / 2 + m, w: iw, h: iw / 1.5};
  return {img, k: iw / F.w, map: p => ({x: img.x + (p.x - F.x) * (iw / F.w), y: img.y + (p.y - F.y) * (iw / F.w)})};
}

export function printArt(ctx, G, F, o) {
  const {pw, ph} = o;
  const m = Math.max(5, pw * 0.055);
  const iw = pw - m * 2;
  const img = {x: -pw / 2 + m, y: -ph / 2 + m, w: iw, h: iw / 1.5};
  const k = img.w / F.w;
  const clipId = `${o.name}-clip`;
  const badgeR = Math.max(15.5, Math.min(pw, ph) * 0.1);
  const bx = pw / 2 - badgeR - m * 0.4, by = -ph / 2 + badgeR + m * 0.4;
  const dots = [];
  const nd = o.index + 1;
  for (let i = 0; i < nd; i++) dots.push(h('circle', {cx: r(bx + (i - (nd - 1) / 2) * badgeR * 0.55), cy: r(by), r: r(badgeR * 0.18), fill: '#fff'}));
  return g({name: o.name},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {x: r(img.x), y: r(img.y), width: r(img.w), height: r(img.h)}))),
    h('rect', {name: `${o.name}-border`, x: r(-pw / 2), y: r(-ph / 2), width: r(pw), height: r(ph), rx: 4, fill: '#fbfaf6', stroke: INK, 'stroke-width': 2}),
    g({'clip-path': ctx.ref(clipId)},
      g({transform: `${T(img.x, img.y)} scale(${r(k, 5)}) ${T(-F.x, -F.y)}`},
        matPatch(ctx, {x: F.x - 20, y: F.y - 20, w: F.w + 40, h: F.h + 40}, Math.max(40, G.S * 0.4)),
        subjectArt(ctx, G, {prefix: o.name, rows: o.rows, ruler: o.ruler, seedKey: 'rf'}),
      ),
    ),
    h('rect', {x: r(img.x), y: r(img.y), width: r(img.w), height: r(img.h), fill: 'none', stroke: '#9aa3a9', 'stroke-width': 1.2}),
    h('circle', {cx: r(bx), cy: r(by), r: r(badgeR), fill: '#4f6d8a', stroke: INK, 'stroke-width': 2}),
    o.numberText ? null : g(null, dots),
    o.numberText ? h('text', {x: r(bx), y: r(by + badgeR * 0.42), 'text-anchor': 'middle', 'font-size': r(badgeR * 1.2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.numberText) : null,
    h('circle', {cx: 0, cy: r(-ph / 2), r: r(Math.max(5, pw * 0.03)), fill: THREAD, stroke: INK, 'stroke-width': 1.6}),
  );
}

/** Photo board (tray) behind the prints: light board, dashed numbered slots. */
export function boardArt(ctx, G, o = {}) {
  const Tr = G.tray;
  const pad = Math.min(Tr.pw, Tr.ph) * 0.1;
  const xs = Tr.slots.map(s => s.x), ys = Tr.slots.map(s => s.y);
  const bx = Math.min(...xs) - pad, by = Math.min(...ys) - pad;
  const bw = Math.max(...Tr.slots.map(s => s.x + s.w)) - bx + pad, bh = Math.max(...Tr.slots.map(s => s.y + s.h)) - by + pad;
  return g({name: o.name},
    h('path', {d: roundRectPath(bx + 6, by + 9, bw, bh, 12), fill: '#000', opacity: 0.18}),
    h('path', {d: roundRectPath(bx, by, bw, bh, 12), fill: BOARD, stroke: INK, 'stroke-width': 2.2}),
    Tr.slots.map((s, i) => h('rect', {name: o.name ? `${o.name}-slot${i}` : undefined, x: r(s.x), y: r(s.y), width: r(s.w), height: r(s.h), rx: 4, fill: 'none', stroke: '#9b9586', 'stroke-width': 2, 'stroke-dasharray': '9 7'})),
  );
}

/** Thread path from a print's pin to the object pin (gentle sag). */
export function threadD(a, b, sag) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  return `M${r(a.x)} ${r(a.y)}Q${r(mx)} ${r(my + sag)} ${r(b.x)} ${r(b.y)}`;
}
export function threadLen(a, b, sag) {
  // arc length of the quadratic (sampled)
  let L = 0, p = a;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag;
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    const q = {x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mx + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * my + t * t * b.y};
    L += Math.hypot(q.x - p.x, q.y - p.y); p = q;
  }
  return L;
}
export const THREAD_COLOR = THREAD;

/** Object pin (where every thread ends). */
export function pinNode(ctx, G, name) {
  const R = Math.max(7, G.S * 0.06);
  return g({name, opacity: 0},
    h('circle', {cx: r(G.pin.x), cy: r(G.pin.y), r: r(R * 1.7), fill: '#fff', opacity: 0.35}),
    h('circle', {cx: r(G.pin.x), cy: r(G.pin.y), r: r(R), fill: THREAD, stroke: INK, 'stroke-width': 2}),
  );
}

/* ------------------------------------------------------------------ */
/* Pose solver                                                         */
/* ------------------------------------------------------------------ */

/** Print pose for a field F flown into slot s with progress k (0 = on the field at the field's scale). */
export function printFly(G, F, slot, k, pw) {
  const s0 = F.w / (pw * 0.89); // the image (≈0.89 pw wide) matches the field exactly at k = 0
  const c0 = {x: F.x + F.w / 2, y: F.y + F.h / 2 + (pw * 0.0165) * s0}, c1 = {x: slot.x + slot.w / 2, y: slot.y + slot.h / 2};
  const e = ease.inOutCubic(k);
  const lift = Math.sin(Math.PI * e) * G.S * 0.25;
  return {x: lerp(c0.x, c1.x, e), y: lerp(c0.y, c1.y, e) - lift, s: lerp(s0, slot.w / pw, e), lift};
}

/**
 * Every pose of the photographing action at time u (already capped by actionProgress by the caller).
 * plan: {rulerReach, rulerCarry, camReach, views:[{move, shoot, fly}], back, shots:[bool], ruler:boolean}
 * C: {restCam, restAux} hand rest points.
 */
export function rfPose(G, C, plan, u) {
  const CM = G.CM;
  // ruler
  const rp = G.ruler;
  const kr = plan.ruler ? ease.inOutCubic(seg(u, ...plan.rulerCarry)) : plan.rulerPlaced ? 1 : 0;
  const lift = Math.sin(Math.PI * kr) * G.S * 0.12;
  const rul = {x: lerp(rp.rest.x, rp.placed.x, kr), y: lerp(rp.rest.y, rp.placed.y, kr) - lift, a: lerp(rp.rest.a, rp.placed.a, kr)};
  const rulGripL = {x: rp.L * 0.62, y: -rp.w * 0.5};
  const rulerG = toWorld(rulGripL, rul, rul.a);
  const rulerHeld = plan.ruler && u >= plan.rulerCarry[0] && u <= plan.rulerCarry[1];
  // camera
  const keys = [[0, G.park], [plan.views[0].move[0], G.park]];
  plan.views.forEach(v => { keys.push([v.move[1], G.stations[v.target]]); });
  const pos = pathAt(keys.map(([t, p]) => [t, {x: p.x, y: p.y}]), u);
  const ang = pathAt(keys.map(([t, p]) => [t, {x: p.a, y: 0}]), u).x;
  const cam = {x: pos.x, y: pos.y, a: ang};
  const camG = toWorld(CM.grip, cam, cam.a);
  const btnG = toWorld(CM.button, cam, cam.a);
  // current view (for the wedge): the last view whose move has started
  let vi = -1;
  plan.views.forEach((v, i) => { if (u >= v.move[0]) vi = i; });
  const wedgeOp = vi < 0 ? 0 : clamp(seg(u, plan.views[0].move[0], plan.views[0].move[0] + 0.03)) * (1 - seg(u, plan.back[0], plan.back[1]) * (plan.keepWedge ? 0 : 1));
  // shutter / flash
  let flash = 0, press = 0;
  plan.views.forEach((v, i) => {
    if (!plan.shots[i]) return;
    const k = seg(u, ...v.shoot);
    if (k > 0 && k < 1) { flash = Math.max(flash, Math.sin(Math.PI * k)); press = Math.max(press, Math.sin(Math.PI * Math.min(1, k * 1.6))); }
  });
  // hands
  const camHeld = u >= plan.camReach[1] && u <= plan.back[0];
  const handCam = pathAt([[0, C.restCam], [plan.camReach[0], C.restCam], [plan.camReach[1], toWorld(CM.grip, G.park, G.park.a)]], u);
  const camHand = u < plan.camReach[1] ? handCam : u <= plan.back[0] ? camG : pathAt([[plan.back[0], camG], [plan.back[1], C.restCam]], u);
  const pressOff = press * G.S * 0.03;
  const auxOnBtn = {x: btnG.x, y: btnG.y + pressOff};
  const auxTo = plan.auxReach;
  let aux;
  if (plan.ruler) {
    if (u < plan.rulerReach[0]) aux = C.restAux;
    else if (u < plan.rulerCarry[0]) aux = pathAt([[plan.rulerReach[0], C.restAux], [plan.rulerReach[1], toWorld(rulGripL, rp.rest, rp.rest.a)]], u);
    else if (u <= plan.rulerCarry[1]) aux = rulerG;
    else if (u < auxTo[1]) aux = pathAt([[plan.rulerCarry[1], toWorld(rulGripL, rp.placed, rp.placed.a)], [auxTo[0], toWorld(rulGripL, rp.placed, rp.placed.a)], [auxTo[1], camBtnAt(G, plan, auxTo[1])]], u);
    else if (u <= plan.back[0]) aux = auxOnBtn;
    else aux = pathAt([[plan.back[0], camBtnAt(G, plan, plan.back[0])], [plan.back[1], C.restAux]], u);
  } else if (u < auxTo[0]) aux = C.restAux;
  else if (u < auxTo[1]) aux = pathAt([[auxTo[0], C.restAux], [auxTo[1], camBtnAt(G, plan, auxTo[1])]], u);
  else if (u <= plan.back[0]) aux = auxOnBtn;
  else aux = pathAt([[plan.back[0], camBtnAt(G, plan, plan.back[0])], [plan.back[1], C.restAux]], u);
  const auxOn = u >= auxTo[1] && u <= plan.back[0];
  // prints
  const prints = plan.views.map((v, i) => {
    if (!plan.shots[i]) return {state: 'none', k: 0, op: 0, x: 0, y: 0, s: 1};
    const F = G.fields[v.target];
    const kf = seg(u, ...v.fly);
    const born = u >= v.shoot[0] + (v.shoot[1] - v.shoot[0]) * 0.5;
    const p = printFly(G, F, G.tray.slots[plan.slotOf ? plan.slotOf[i] : i], kf, G.tray.pw);
    return {state: !born ? 'none' : kf <= 0 ? 'captured' : kf < 1 ? 'flying' : 'placed', k: kf, op: born ? 1 : 0, border: born ? clamp(kf * 3 + 0.25) : 0, ...p};
  });
  const phase = u < (plan.ruler ? plan.rulerReach[0] : plan.camReach[0]) ? 'rest'
    : plan.ruler && u < plan.rulerCarry[1] ? 'ruler'
      : vi < 0 || u < plan.views[0].move[0] ? 'reach'
        : u < plan.back[0] ? `view${vi}` : 'hold';
  return {rul, rulerG, rulerHeld, placedRuler: plan.ruler ? u >= plan.rulerCarry[1] : Boolean(plan.rulerPlaced), cam, camG, btnG, camHand, aux, camHeld, auxOn, press, flash, vi, wedgeOp, prints, phase};
}

/** Shutter-button position of the camera at time u (for the aux hand's approach / leave keys). */
function camBtnAt(G, plan, u) {
  const keys = [[0, G.park], [plan.views[0].move[0], G.park]];
  plan.views.forEach(v => { keys.push([v.move[1], G.stations[v.target]]); });
  const pos = pathAt(keys.map(([t, p]) => [t, {x: p.x, y: p.y}]), u);
  const ang = pathAt(keys.map(([t, p]) => [t, {x: p.a, y: 0}]), u).x;
  return toWorld(G.CM.button, {x: pos.x, y: pos.y}, ang);
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

/** Legend icon: rf-camera, rf-print, rf-scale, rf-thread, else the category icons. */
export function rfIcon(ctx, kind, s, o = {}) {
  if (kind === 'rf-camera') {
    const CM = cameraModel(s * 0.9);
    return g({transform: T(0, s * 0.1, 90)}, cameraArt(ctx, CM, {}));
  }
  if (kind === 'rf-print') {
    return g(null,
      h('rect', {x: r(-s * 0.45), y: r(-s * 0.3), width: r(s * 0.9), height: r(s * 0.6), rx: 2, fill: '#fbfaf6', stroke: INK, 'stroke-width': 1.6}),
      h('rect', {x: r(-s * 0.38), y: r(-s * 0.23), width: r(s * 0.76), height: r(s * 0.4), fill: MAT}),
      h('circle', {cx: r(-s * 0.05), cy: r(-s * 0.03), r: r(s * 0.1), fill: '#e7e1d3', stroke: INK, 'stroke-width': 1}),
    );
  }
  if (kind === 'rf-scale') {
    return g(null,
      h('path', {d: `M${r(-s * 0.42)} ${r(s * 0.3)}H${r(s * 0.42)}V${r(s * 0.16)}H${r(-s * 0.28)}V${r(-s * 0.4)}H${r(-s * 0.42)}Z`, fill: '#f4f2ec', stroke: INK, 'stroke-width': 1.6}),
      h('path', {d: `M${r(-s * 0.2)} ${r(s * 0.23)}h${r(s * 0.12)}M${r(s * 0.04)} ${r(s * 0.23)}h${r(s * 0.12)}M${r(-s * 0.35)} ${r(-s * 0.1)}v${r(s * 0.12)}`, stroke: INK, 'stroke-width': r(s * 0.1)}),
    );
  }
  if (kind === 'rf-thread') {
    return g(null,
      h('path', {d: `M${r(-s * 0.42)} ${r(-s * 0.2)}Q0 ${r(s * 0.35)} ${r(s * 0.42)} ${r(-s * 0.05)}`, fill: 'none', stroke: THREAD, 'stroke-width': 3.5, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(s * 0.42), cy: r(-s * 0.05), r: r(s * 0.1), fill: THREAD, stroke: INK, 'stroke-width': 1.2}),
    );
  }
  if (kind === 'rf-bag') return legendIcon(ctx, 'bag', s, o);
  return legendIcon(ctx, kind, s, o);
}

/** Legend panel node (local origin = top-left). Every row is a named group. */
export function rfPanelNode(ctx, PL) {
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
      if (row.icon) parts.push(g({transform: T(F * 0.8, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, rfIcon(ctx, row.icon, F * 1.3, {color: row.color, key: row.name})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}
