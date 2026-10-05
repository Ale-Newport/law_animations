/**
 * "Etiquetado de indicio" motif kit (evidence-custody-01, LAW-0361..0364): motif geometry and solvers shared by the
 * four entries. Art comes from the category kit (./evidence-art.js).
 *
 * The motif: an object receives a manila tag whose ball chain is clipped to the object's attachment point; when the
 * object is moved the tag stays joined to it (the chain keeps its length and the tag trails the motion), and the
 * object goes into an evidence bag with the tag still attached. The tag's rows are written or blank exactly as the
 * author supplies them; no doctrine on admissibility or custody, and no judgement that a blank row changes anything.
 *
 * Kit contents: motif strings, record resolution, the stage model (bench positions for object, tag, bag in a box),
 * the stage renderer (two copies — "carried" above the bag film and "inside" below it — swapped only when they
 * coincide, so nothing teleports) and the tag-hang solver (chain length constant; tag direction = rest direction
 * pushed back by the object's velocity, bounded so the motion stays continuous).
 * @module animations/evidence-custody/kits/etiquetado-indicio
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r, seg, lerp, ease} from '../../../core/time.js';
import {str, obj} from '../../../schemas/fields.js';
import {
  objectModel, objectArt, tagModel, tagArt, tagWriteProps, chainNode, chainProps, bagModel, bagBack, bagFront, pathAt,
} from './evidence-art.js';

export const EI_LABELS_EN = {key: 'As supplied · no conclusion drawn', blank: '(left blank, as supplied)'};
export const EI_LABELS_ES = {key: 'Según lo aportado · sin conclusión', blank: '(en blanco, según lo aportado)'};

export const eiLabelFields = {
  labels: obj('Editable captions', {
    key: str('Neutral key (must say that no conclusion is drawn)', 80),
    blank: str('Text shown for a row the author left blank', 50),
  }, ['key', 'blank']),
};

/** Records with their written / blank state. */
export function resolveRecords(P) {
  return P.records.map(rw => ({field: rw.field, value: rw.value, filled: String(rw.value || '').trim().length > 0}));
}

/** "Field: value" or "Field: (left blank, as supplied)". */
export function recordLine(rw, blank) {
  return `${rw.field}: ${rw.filled ? rw.value : blank}`;
}

/* ------------------------------------------------------------------ */
/* Stage model                                                         */
/* ------------------------------------------------------------------ */

/**
 * Stage positions inside a box (design units). Horizontal boxes: object left, tag below it, bag right. Tall boxes:
 * object top-left, tag top-right, bag below.
 * @param {{x:number,y:number,w:number,h:number}} box  the mat (inner area) of the bench
 * @param {{kind:string, rows:number, scale?:number}} o
 */
export function stageModel(box, o) {
  const wide = box.w / box.h > 1.12;
  const k = o.scale ?? 1;
  const S = (wide ? Math.min(box.w * 0.2, box.h * 0.29) : Math.min(box.w * 0.37, box.h * 0.23)) * k;
  const M = objectModel(o.kind, S);
  const TG = tagModel({w: S * 1.28, h: S * 0.66, rows: o.rows});
  const B = bagModel(S * 1.9, S * 2.8);
  let obj0, tagHole0, bag;
  if (wide) {
    bag = {x: box.x + box.w * 0.95 - B.w, y: box.y + (box.h - B.h) / 2};
    obj0 = {x: box.x + box.w * 0.24, y: box.y + box.h * 0.3};
    tagHole0 = {x: box.x + box.w * 0.12, y: box.y + box.h * 0.72};
  } else {
    bag = {x: box.x + (box.w - B.w) / 2 + box.w * 0.12, y: box.y + box.h * 0.975 - B.h};
    obj0 = {x: box.x + box.w * 0.3, y: box.y + box.h * 0.15};
    tagHole0 = {x: box.x + box.w * 0.08 + TG.h * 0.3, y: box.y + box.h * 0.36};
  }
  const chainL = S * 0.34;
  const hangAngle = 55; // degrees: rest direction of the chain (anchor -> hole) once released
  const tagAngle = 35; // the tag's own angle when it is clipped and released
  // object resting place inside the bag: the union of object + hanging tag is centred in the inner film
  const ha = (hangAngle * Math.PI) / 180, ta = (tagAngle * Math.PI) / 180;
  const ax = M.anchor.x, ay = M.anchor.y;
  const hx = ax + Math.cos(ha) * chainL, hy = ay + Math.sin(ha) * chainL;
  const tagPts = [[TG.x0, -TG.h / 2], [TG.x1, -TG.h / 2], [TG.x1, TG.h / 2], [TG.x0, TG.h / 2]].map(([x, y]) => ({x: hx + x * Math.cos(ta) - y * Math.sin(ta), y: hy + x * Math.sin(ta) + y * Math.cos(ta)}));
  const minX = Math.min(-M.w / 2, ...tagPts.map(p => p.x)), maxX = Math.max(M.w / 2, ...tagPts.map(p => p.x));
  const minY = Math.min(-M.h / 2, ...tagPts.map(p => p.y)), maxY = Math.max(M.h / 2, ...tagPts.map(p => p.y));
  const I = B.inner;
  const objIn = {x: bag.x + I.x + (I.w - (maxX - minX)) / 2 - minX, y: bag.y + I.y + Math.max(0, (I.h - (maxY - minY)) / 2) - minY};
  const fitsBag = maxX - minX <= I.w + 2 && maxY - minY <= I.h + B.h * 0.08;
  return {wide, S, M, TG, B, bag, obj0, objIn, tagHole0, chainL, hangAngle, tagAngle, tableAngle: -10, fitsBag, box};
}

/** Where the hand grips the tag (tag-local) and the object (object-local). */
export const tagGrip = TG => ({x: TG.x0 + TG.w * 0.55, y: 0});
export const objGrip = M => ({x: M.kind === 'key' ? M.S * 0.16 : -M.S * 0.06, y: 0});

/** Rotate a local point by deg and translate. */
export function local(p, at, deg) {
  const a = (deg * Math.PI) / 180;
  return {x: at.x + p.x * Math.cos(a) - p.y * Math.sin(a), y: at.y + p.x * Math.sin(a) + p.y * Math.cos(a)};
}

/**
 * Tag-hang solver: the hole stays at chain length L from the anchor; its direction is the rest direction pushed back
 * by the anchor velocity (bounded at 0.85 so the direction never flips discontinuously). Returns {hole, angle, dirDeg}.
 * @param {{x:number,y:number}} anchor
 * @param {{x:number,y:number}} vel  anchor velocity (design units per unit of u)
 * @param {number} restDeg
 * @param {number} L
 * @param {number} [k]
 */
export function hang(anchor, vel, restDeg, L, k = 1 / 4200) {
  const a = (restDeg * Math.PI) / 180;
  let px = -vel.x * k, py = -vel.y * k;
  const m = Math.hypot(px, py);
  if (m > 0.85) { px *= 0.85 / m; py *= 0.85 / m; }
  const dx = Math.cos(a) + px, dy = Math.sin(a) + py;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const ang = (deg * Math.PI) / 180;
  return {hole: {x: anchor.x + Math.cos(ang) * L, y: anchor.y + Math.sin(ang) * L}, dirDeg: deg};
}

/** Numerical velocity of a path function at u. */
export function velocity(fn, u, e = 0.004) {
  const a = fn(Math.max(0, u - e)), b = fn(Math.min(1, u + e));
  const dt = Math.min(1, u + e) - Math.max(0, u - e) || 1;
  return {x: (b.x - a.x) / dt, y: (b.y - a.y) / dt};
}

/* ------------------------------------------------------------------ */
/* Stage renderer                                                      */
/* ------------------------------------------------------------------ */

function copyNodes(ctx, G, P, rows, seedKey) {
  return g({name: `${P}-grp`},
    chainNode(`${P}-chain`, {bead: Math.max(5, G.S * 0.04)}),
    g({name: `${P}-tagT`}, g({name: `${P}-tagSh`, opacity: 0.18}, g({transform: T(5, 8)}, tagShadow(G.TG))), tagArt(ctx, G.TG, {prefix: `${P}-tag`, rows, seedKey, writable: true})),
    g({name: `${P}-objT`},
      g({name: `${P}-objSh`, opacity: 0.2}, objectShadow(G.M)),
      objectArt(ctx, G.M),
      g({name: `${P}-clasp`, opacity: 0}, h('circle', {cx: r(G.M.anchor.x), cy: r(G.M.anchor.y), r: r(Math.max(5, G.S * 0.045)), fill: 'none', stroke: '#5d656c', 'stroke-width': r(Math.max(2.5, G.S * 0.02), 2)})),
    ),
  );
}

function tagShadow(TG) {
  return h('rect', {x: r(TG.x0), y: r(-TG.h / 2), width: r(TG.w), height: r(TG.h), rx: 8, fill: '#000'});
}
function objectShadow(M) {
  return h('ellipse', {cx: 6, cy: 10, rx: r(M.w * 0.5), ry: r(M.h * 0.5), fill: '#000'});
}

/**
 * Stage nodes: {back, inside, front, carried} groups to be layered by the entry (arms/palms go between front and
 * carried; thumbs above carried).
 * @param {any} ctx
 * @param {ReturnType<typeof stageModel>} G
 * @param {{prefix:string, rows:Array<{filled:boolean, len?:number}>, seedKey?:string}} o
 */
export function stageNodes(ctx, G, o) {
  const P = o.prefix;
  const seedKey = o.seedKey || 'ei-tag';
  return {
    back: g({transform: T(G.bag.x, G.bag.y)}, bagBack(ctx, G.B, {name: `${P}-bagB`})),
    inside: copyNodes(ctx, G, `${P}-in`, o.rows, seedKey),
    front: g({transform: T(G.bag.x, G.bag.y)}, bagFront(ctx, G.B, {name: `${P}-bagF`})),
    carried: copyNodes(ctx, G, `${P}-out`, o.rows, seedKey),
  };
}

/**
 * Stage frame props.
 * @param {string} P prefix
 * @param {ReturnType<typeof stageModel>} G
 * @param {{obj:{x:number,y:number}, lift:number, inside:boolean, hole:{x:number,y:number}, tagAngle:number,
 *   chainEnd:{x:number,y:number}, clasp:number, write?:Array<number|null>, tagLift?:number}} s
 */
export function stageProps(P, G, s) {
  const out = {};
  const sc = 1 + s.lift * 0.06;
  const tsc = 1 + (s.tagLift || 0) * 0.05;
  for (const c of ['in', 'out']) {
    const N = `${P}-${c}`;
    const on = (c === 'in') === s.inside;
    out[`${N}-grp`] = {opacity: on ? 1 : 0};
    out[`${N}-objT`] = {transform: T(s.obj.x, s.obj.y, 0, sc)};
    out[`${N}-objSh`] = {opacity: r(0.12 + s.lift * 0.16, 3), transform: T(s.lift * 8, s.lift * 10)};
    out[`${N}-tagT`] = {transform: T(s.hole.x, s.hole.y, s.tagAngle, tsc)};
    out[`${N}-tagSh`] = {opacity: r(0.1 + (s.tagLift || 0) * 0.14, 3)};
    out[`${N}-clasp`] = {opacity: r(s.clasp, 3)};
    Object.assign(out, chainProps(`${N}-chain`, s.hole, s.chainEnd, Math.min(40, G.S * 0.12) * (1 - s.lift * 0.5)));
    if (s.write) Object.assign(out, tagWriteProps(`${N}-tag`, s.write));
  }
  return out;
}

/** World position of the object's anchor for an object centre (scale with lift). */
export function anchorAt(G, objPos, lift) {
  const sc = 1 + lift * 0.06;
  return {x: objPos.x + G.M.anchor.x * sc, y: objPos.y + G.M.anchor.y * sc};
}

/** The tag's loose chain end (tag-local) when the chain is not clipped yet. */
export function looseEnd(G) {
  return {x: -G.chainL * 0.8, y: G.TG.h * 0.35};
}

/**
 * Every pose of the tag-and-bag action at (already capped) time ua. W: windows reachTag, carryTag, steadyIn, clip,
 * release, steadyOut, toObj, lift, carry, lower, back. C: restR, restL. Pure.
 */
export function actionPose(G, C, W, ua, {doTag, doBag}) {
  const on = (w, flag = true) => (flag ? seg(ua, ...w) : 0);
  // object path (centre) and lift
  const objPath = uu => pathAt([[W.carry[0], G.obj0], [W.carry[1], G.objIn]], doBag ? uu : 0);
  const objPos = objPath(ua);
  const lift = doBag ? ease.inOutCubic(on(W.lift)) * (1 - ease.inOutCubic(on(W.lower))) : 0;
  const inside = doBag && on(W.lower) >= 1;
  const anchor0 = anchorAt(G, G.obj0, 0);
  const anchor = anchorAt(G, objPos, lift);
  // tag: lying → carried by the hand to the clip position → released and hanging from the anchor
  const ha = (G.hangAngle * Math.PI) / 180;
  const clipHole = {x: anchor0.x + Math.cos(ha) * G.chainL, y: anchor0.y + Math.sin(ha) * G.chainL};
  const kCarryTag = ease.inOutCubic(on(W.carryTag, doTag));
  const kClip = ease.inOutCubic(on(W.clip, doTag));
  const released = doTag && on(W.release) > 0;
  let hole, tagAngle;
  if (!released) {
    hole = {x: lerp(G.tagHole0.x, clipHole.x, kCarryTag), y: lerp(G.tagHole0.y, clipHole.y, kCarryTag)};
    tagAngle = lerp(G.tableAngle, G.tagAngle, kCarryTag);
  } else {
    const vel = velocity(uu => anchorAt(G, objPath(Math.min(uu, ua)), 0), ua);
    const hs = hang(anchor, vel, G.hangAngle, G.chainL);
    hole = hs.hole;
    tagAngle = G.tagAngle + (hs.dirDeg - G.hangAngle);
  }
  const tagLift = doTag ? Math.sin(Math.PI * clamp((ua - W.carryTag[0]) / (W.release[1] - W.carryTag[0]))) * (ua < W.release[1] ? 1 : 0) : 0;
  const loose = local(looseEnd(G), hole, tagAngle);
  const attached = doTag && kClip >= 1;
  const chainEnd = attached ? anchor : {x: lerp(loose.x, anchor.x, kClip), y: lerp(loose.y, anchor.y, kClip)};
  const clasp = doTag ? clamp((on(W.clip) - 0.75) / 0.25) : 0;
  // hands
  const tagG = local(tagGrip(G.TG), hole, tagAngle);
  const sc = 1 + lift * 0.06;
  const og = objGrip(G.M);
  const objG = {x: objPos.x + og.x * sc, y: objPos.y + og.y * sc};
  const steadyP = {x: G.obj0.x + (G.M.kind === 'key' ? G.S * 0.34 : -G.S * 0.22), y: G.obj0.y};
  const kReach = ease.inOutCubic(on(W.reachTag, doTag));
  const kToObj = ease.inOutCubic(on(W.toObj, doBag));
  const kBack = doBag ? ease.inOutCubic(on(W.back)) : ease.inOutCubic(on(W.toObj, doTag));
  const mix = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
  let handR;
  let phase = 'rest';
  if (!doTag || ua < W.reachTag[0]) { handR = C.restR; phase = 'rest'; }
  else if (ua < W.reachTag[1]) { handR = mix(C.restR, tagG, kReach); phase = 'reach-tag'; }
  else if (ua < W.release[1]) { handR = tagG; phase = ua < W.carryTag[1] ? 'carry-tag' : ua < W.clip[1] ? 'clip' : 'release'; }
  else if (!doBag) { const rel = local(tagGrip(G.TG), clipHole, G.tagAngle); handR = mix(rel, C.restR, kBack); phase = kBack >= 1 ? 'tagged' : 'return'; }
  else if (ua < W.toObj[1]) { const rel = local(tagGrip(G.TG), clipHole, G.tagAngle); handR = mix(rel, objG, kToObj); phase = 'to-object'; }
  else if (ua < W.back[0]) { handR = objG; phase = ua < W.lift[1] ? 'lift' : ua < W.carry[1] ? 'carry' : 'lower'; }
  else { handR = mix(objG, C.restR, kBack); phase = kBack >= 1 ? 'bagged' : 'return'; }
  const kSIn = ease.inOutCubic(on(W.steadyIn, doTag)), kSOut = ease.inOutCubic(on(W.steadyOut, doTag));
  const handL = kSOut > 0 ? mix(steadyP, C.restL, kSOut) : mix(C.restL, steadyP, kSIn);
  return {ua, objPos, lift, inside, anchor, hole, tagAngle, tagLift, chainEnd, clasp, attached, released, handR, handL, tagG, objG, steadyP, phase,
    holdingTag: doTag && ua >= W.reachTag[1] && ua < W.release[1], holdingObj: doBag && ua >= W.toObj[1] && ua < W.back[0],
    steadying: doTag && ua >= W.steadyIn[1] && ua < W.steadyOut[0]};
}


export {pathAt, clamp};
