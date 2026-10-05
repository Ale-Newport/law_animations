/**
 * LAW-0716 — Contribución de la persona afectada · inspect
 *
 * Storyboard (the state produced by the action; one real lens; one datum
 * changes):
 *  0.00–0.20 build       The context: the slab after both conducts ran — both
 *                        trolleys at their barriers, both connectors drawn to
 *                        the event (identical stroke and weight), the supplied
 *                        steps under their lanes, and the focus step (Step 1 by
 *                        default) on its ● slot under lane A, as supplied. On a
 *                        string from it hangs a value tag at the slab's left:
 *                        the loss as supplied (heading) and the supplied lane
 *                        of the step ("Step 1: supplied for lane A — conduct of
 *                        A"). Beside it the record (steps and the event).
 *  0.20–0.45 isolate     The record and captions step out, the scene tag's value
 *                        leaves, and an opaque lens appears EXACTLY over its
 *                        source (a real copy of the tag, the string, both slot
 *                        pads and the step, in the same coordinates) and grows
 *                        into the freed room to >= 1.5× the rest size.
 *  0.45–0.75 substitute  The old value is struck (0.45–0.49), lifts away
 *                        (0.52–0.545) and the alternative value fades in
 *                        (0.555–0.58). Only then the dependent geometry follows
 *                        (0.60–0.66): the step slides from the ● slot under lane
 *                        A to the ◆ slot under lane B, its string following.
 *  0.75–1.00 return      The lens shrinks back onto its source; the context shows
 *                        the NEW state; the tag value, record and band return, a
 *                        neutral Δ marker marks the changed tag, "Before: <old>"
 *                        (struck) / "After: <new>" keep the old value traceable,
 *                        with the key "As supplied · no conclusion drawn". No
 *                        share, fault or contributory doctrine is stated; nothing
 *                        is weighed. Seeking back restores the old datum exactly.
 * Timings, the side (slide) and stack (step back) patterns and the lens rules
 * follow LAW-0712 (accepted causation-08 inspect).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0716
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields, obj, int, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  caFields, CA_STRINGS, CA_DEFAULTS, CA_ES_DEFAULTS, resolveCA, entryText, linkNotes, altText, glueN, unwidow,
  fieldGeom, fieldW, fieldH, itemPlaces, slabArt, cartArt, eventArt, itemArt, laneBarrier, laneConnector, sideMark, floorArt,
  iconChip, flowRows, recordMeasure, recordBuild, fitG,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/contribucion-afectada.js';

const ID = 'LAW-0716';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_SIDE = {
  ctxIn: [0, 0.02], textIn: [0, 0.04],
  textOut: [0.195, 0.21], shift: [0.195, 0.222], tagOut: [0.212, 0.222], open: [0.2225, 0.31], guides: [0.3, 0.34],
  strike: [0.45, 0.49], oldOut: [0.52, 0.545], newIn: [0.555, 0.58], geo: [0.6, 0.66],
  close: [0.76, 0.8], tagIn: [0.8, 0.815], shiftBack: [0.8, 0.83], textBack: [0.83, 0.86], marker: [0.84, 0.87], trace: [0.85, 0.89], key: [0.86, 0.9],
};
const W_STACK = {...W_SIDE,
  textOut: [0.21, 0.222], tagOut: [0.203, 0.209], shrink: [0.205, 0.218], open: [0.2185, 0.26],
  close: [0.765, 0.795], regrow: [0.78, 0.8], tagIn: [0.8, 0.81], textBack: [0.8, 0.82],
  marker: [0.82, 0.85], trace: [0.83, 0.87], key: [0.84, 0.88],
};
// stack2 (record inside the context): the record and captions step out BEFORE the context steps back
const W_STACK2 = {...W_STACK, textOut: [0.19, 0.204]};
const TARGETS = ['lane-tag'];
// the lens copy's text shows only while drawn at >= this size (px at 1080p; baseline floor)
const LENS_TEXT_MIN = 19.5;
const ITEM_K = 1.2; // the steps stand a little larger here (the changed object stays a real object)

const strings = {
  en: {...CA_STRINGS.en, context: 'The two lanes after both conducts ran, with the record, as supplied', marker: 'Changed datum', beforeV: 'Before', afterV: 'After'},
  es: {...CA_STRINGS.es, context: 'Los dos carriles tras avanzar ambas conductas, con su registro (aportado)', marker: 'Dato cambiado', beforeV: 'Antes', afterV: 'Después'},
};

const sceneSchema = {
  ...caFields,
  ...inspectFields(TARGETS),
  focusItem: int('Index (0-based) of the step whose supplied lane is the datum (its own "lane" value is not used here)', 0, 5),
  focusLanes: obj('Lane the focus step stands under with each value (only this geometry changes with the datum)', {
    before: oneOf('Lane drawn with the before value', ['a', 'b']),
    after: oneOf('Lane drawn with the after value', ['a', 'b']),
  }),
};

const defaultParams = {
  ...CA_DEFAULTS,
  focusTarget: 'lane-tag',
  beforeValue: 'Step 1: supplied for lane A (conduct of A)',
  afterValue: 'Step 1: supplied for lane B (conduct of B)',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'The two lanes after both conducts ran, with the record, as supplied', marker: 'Changed datum'},
  focusItem: 0,
  focusLanes: {before: 'a', after: 'b'},
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...CA_ES_DEFAULTS,
  beforeValue: 'Paso 1: aportado para el carril A (conducta de A)',
  afterValue: 'Paso 1: aportado para el carril B (conducta de B)',
  contextLabels: {context: 'Los dos carriles tras avanzar ambas conductas, con su registro (aportado)', marker: 'Dato cambiado'},
};

const MARGIN = 10;

/** Bake a connector's completed frame (a record of node name → attributes) into its static vnode tree. */
function applyStatic(node, rec) {
  const walk = v => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v.attrs && v.attrs.name && rec[v.attrs.name]) { Object.assign(v.attrs, rec[v.attrs.name]); delete v.attrs.name; }
    else if (v.attrs && v.attrs.name) delete v.attrs.name;
    (v.children || []).forEach(walk);
  };
  walk(node);
  return node;
}
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['side', 'stack']},
  square: {size: 24, minSize: 17, arr: ['stack', 'stack2', 'side']},
  portrait: {size: 25, minSize: 17, arr: ['stack']},
};
const RW_ = fieldW();

/** Frame size in design units (the design space is fitted into the caption-safe box). */
function frameUnits(ctx) {
  const v = ctx.view, D = ctx.design;
  const s = Math.min(v.content.w / D.w, v.content.h / D.h);
  return {w: v.width / s, h: v.height / s, short: Math.min(v.width, v.height) / s};
}

/** Glue numbers to their word, "·" to the word before it, and keep short parentheticals whole. */
const glueLv = t => glueN(t);

/** The value tag: heading (the variation as labelled) + the value (before / after), one width. */
function tagMeasure(ctx, p, size, w, textOn) {
  const pad = size * 0.6;
  const fit = (t0, o) => fitG(ctx, unwidow(glueLv(t0), q => fitG(ctx, q, o)), o);
  const hs = size * 1.4;
  const fh = textOn ? fit(p.losses[0].label, {maxWidth: w - 2 * pad - size * 1.3, size: hs, minSize: hs, maxLines: 4, weight: 600}) : null;
  // (the value — the datum — is set a fifth larger than the heading: it is what the lens is for)
  const vs = size * 1.75;
  const fb = textOn ? fit(p.beforeValue, {maxWidth: w - 2 * pad, size: vs, minSize: vs, maxLines: 6, weight: 700}) : null;
  const fa = textOn ? fit(p.afterValue, {maxWidth: w - 2 * pad, size: vs, minSize: vs, maxLines: 6, weight: 700}) : null;
  const headH = textOn ? fh.height + size * 0.3 : size * 1.1;
  const textH = textOn ? Math.max(fb.height, fa.height) : size * 2;
  const hole = size * 0.9;
  const bad = textOn && [fh, fb, fa].some(f => f.truncated || f.broken);
  // (the area of the tag's text blocks — heading + the smaller of the two values; labels hidden: the bars)
  const textArea = textOn ? fh.width * fh.height + Math.min(fb.width * fb.height, fa.width * fa.height) : (w - 2 * pad) * size * 2;
  return {w, pad, hole, fh, fb, fa, headH, h: hole * 0.9 + headH + textH + pad * 1.1, bad, textArea};
}

/** Tag art at (x, y) (top-left); names prefixed with P. Value groups: P-vb (before), P-va (after), P-strike. */
function tagArt(ctx, m, x, y, P, textOn) {
  const th = ctx.theme;
  const {w, pad, hole} = m;
  const card = h('path', {d: `M${r(x)} ${r(y)}H${r(x + w - hole * 0.9)}L${r(x + w)} ${r(y + hole * 0.9)}V${r(y + m.h)}H${r(x)}Z`, fill: '#fbf3dc', stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'});
  const ring = h('circle', {cx: r(x + w - hole * 0.95), cy: r(y + hole * 0.95), r: r(hole * 0.24), fill: th.paper, stroke: th.ink, 'stroke-width': 2});
  const hy = y + hole * 0.9;
  const ty = hy + m.headH + pad * 0.1;
  let head, vb, va, strike = null;
  if (textOn) {
    head = textBlock(m.fh, {x: x + pad, y: hy, fill: th.inkSoft, name: `${P}-head`});
    vb = g({name: `${P}-vb`}, textBlock(m.fb, {x: x + pad, y: ty, fill: th.ink, name: `${P}-vbt`}));
    va = g({name: `${P}-va`, opacity: 0}, textBlock(m.fa, {x: x + pad, y: ty, fill: th.ink, name: `${P}-vat`}));
    const lines = m.fb.lines.map((ln, i) => ({x: x + pad, y: ty + i * m.fb.lineHeight + m.fb.size * 0.5, w: ctx.measure(ln.replace(/ /g, ' '), m.fb.size, m.fb.weight, m.fb.family)}));
    strike = g({name: `${P}-strike`, opacity: 0}, lines.map((ln, i) => h('path', {name: `${P}-st${i}`, d: `M${r(ln.x - 3)} ${r(ln.y)}H${r(ln.x + ln.w + 3)}`, stroke: th.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(ln.w + 6)} ${r(ln.w + 20)}`, 'stroke-dashoffset': r(ln.w + 6)})));
    m.strikeLines = lines;
  } else {
    const bar = (ww, yy, o = 0.6) => h('path', {d: `M${r(x + pad)} ${r(yy)}H${r(x + pad + ww)}`, stroke: th.inkSoft, 'stroke-width': r(m.hole * 0.3), 'stroke-linecap': 'round', opacity: o});
    head = bar((w - 2 * pad) * 0.5, hy + pad * 0.6, 0.35);
    vb = g({name: `${P}-vb`}, bar((w - 2 * pad) * 0.8, ty + pad * 0.6), bar((w - 2 * pad) * 0.45, ty + pad * 1.6));
    va = g({name: `${P}-va`, opacity: 0}, bar((w - 2 * pad) * 0.6, ty + pad * 0.6), bar((w - 2 * pad) * 0.7, ty + pad * 1.6));
  }
  return {node: g({name: P}, card, ring, g({name: `${P}-vals`}, head, vb, va, strike)), hole: {x: x + w - hole * 0.95, y: y + hole * 0.95}, box: {x, y, w, h: m.h}};
}

/**
 * Zone geometry at scale PH (zone-local: x from the zone's left edge, y from the floor line, up negative): [field with
 * the focus consequence's two slots on its right-hand path, the tag hanging above the path] ([record on an easel] in
 * wide boxes).
 */
function zoneGeom(M, PH, tg, rec, RW, arr, minW, tagSide = false) {
  // the field stands right of the tag; the focus step stands at the lanes' start, midway between them, with a short
  // LEADER to the lane it is supplied for (the datum); the tag hangs at the slab's left, level with it
  // (tagSide false — tall boxes: the tag hangs ABOVE the slab's left end instead, and the field takes the width)
  const G = fieldGeom(tagSide ? tg.w + 30 : 0, 0, PH);
  const fx = G.xs + 0.16 * PH;
  const ih = G.itemS * ITEM_K, iw = ih * 0.82;
  const sy = G.cy + ih / 2; // the step's base
  // the leader's two ends: the lower edge of lane A's strip, the upper edge of lane B's strip
  // the step's two slots (its base): just under lane A's strip, or standing on lane B's strip edge — the step slides
  // between them when its supplied lane changes
  const ys = [G.yA + G.LT + 0.02 * PH + ih, G.yB - G.LT - 0.01 * PH];
  const itemTop = sy - ih;
  const tagX = tagSide ? 6 : G.x0 + 6;
  const tagY = tagSide ? Math.min(G.cy - tg.h / 2, -tg.h - 12) : G.slabTop - 12 - tg.h;
  let right = Math.max(G.x1, tagX + tg.w) + 12;
  let recX = null, recY = null, recTop = 0;
  if (arr === 'side' || arr === 'stack2') {
    recX = right + 30;
    recY = -PH * 0.12 - (rec.h + 14);
    recTop = recY - rec.clipH * 0.35;
    right = recX + RW + 20;
  }
  if (right < minW) right = minW;
  const top = Math.min(tagY - tg.hole * 1.45, G.top, arr === 'side' || arr === 'stack2' ? recTop : 0);
  return {G, fx, ys, sy, iw, ih, itemTop, tagX, tagY, recX, recY, zW: right + 6, zH: -top + 16, top, tagSide};
}

/** A slot pad on the slab (● / ◆, identical shape and weight) under a step position `at`. */
function slotArt(ctx, {G, at, side}) {
  const th = ctx.theme;
  const rx = G.itemS * ITEM_K * 0.55, ry = rx * 0.4;
  return g({transform: T(at.x, at.y)},
    h('ellipse', {cx: 0, cy: 0, rx: r(rx), ry: r(ry), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3}),
    sideMark(ctx, {cx: rx + G.headS * 0.45, cy: -ry * 0.2, s: G.headS * 0.7, side}));
}

/** The focus step's leader: from the step's centre to the lane edge at y (the dependent geometry of the datum). */
function stringD(L, y) {
  // the tag's string, from the tag (fixed) to the step's side at base y (follows the step)
  if (!L.tagSide) return `M${r(L.tagAt.x + L.tg.w * 0.5)} ${r(L.tagAt.y + L.tg.h)}L${r(L.fxw - L.zg0.iw * 0.3)} ${r(y - L.zg0.ih)}`;
  return `M${r(L.tagAt.x + L.tg.w)} ${r(L.tagAt.y + L.tg.h / 2)}L${r(L.fxw - L.zg0.iw / 2 - 2)} ${r(y - L.zg0.ih / 2)}`;
}

/** The tag's tie: from the tag's right edge (fixed) to the step's left side (fixed). */
function tieD(L) {
  if (!L.tagSide) return `M${r(L.fxw)} ${r(L.tagAt.y + L.tg.h)}L${r(L.fxw)} ${r(L.syw - L.zg0.ih)}`;
  return `M${r(L.tagAt.x + L.tg.w)} ${r(L.tagAt.y + L.tg.h / 2)}L${r(L.fxw - L.zg0.iw / 2 - 2)} ${r(L.syw - L.zg0.ih / 2)}`;
}

function compose(ctx, base, cfg) {
  const D = ctx.design;
  const p = ctx.params;
  const {size, RW, tagW, arr} = cfg;
  const textOn = ctx.show('key');
  const memo = base.memo;
  const full = D.w - 2 * MARGIN;
  const FU = frameUnits(ctx);
  const tk = `${size}|${tagW}`;
  let tg = memo.tag.get(tk);
  if (!tg) { tg = tagMeasure(ctx, p, size, tagW, textOn); memo.tag.set(tk, tg); }
  if (tg.bad && !cfg.force) return {bad: 'tag'};
  const rk = `${size}|${RW}`;
  let rec = memo.rec.get(rk);
  if (!rec) { rec = recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, text: textOn, maxLines: 4}); memo.rec.set(rk, rec); }
  if (rec.bad && !cfg.force) return {bad: 'record'};
  const recW = RW + 20, recH = rec.h + 14 + rec.clipH * 0.35;
  const minCtx = 0.47 * FU.w + 4;
  const flowBand = w => {
    const bk = `${size}|${Math.round(w)}`;
    let b = memo.band.get(bk);
    // (a band that does not fit a width does not fit a narrower one either: some chip in it would not fit there)
    const badB = memo.badBand.get(size);
    if (!b && badB !== undefined && w <= badB) return {sz: [], h: 0, bad: true};
    if (!b) {
      // (exact reuse, no change to what is drawn: a chip measured for a width is kept for that width — bands wider than
      // 760 share one chip width; a chip that fits on one line at a width is the same chip at any narrower width it still
      // fits; a chip that does not fit a width does not fit a narrower one either)
      const chipAt = (it, i, mw) => {
        const one = memo.one.get(`${size}|${i}`), bad = memo.badW.get(`${size}|${i}`);
        if (one && one.w <= mw + 1e-9) return one;
        if (bad !== undefined && mw <= bad) return {it, w: 0, h: 0, bad: true};
        const ek = `${size}|${i}|${mw}`;
        if (memo.exact.has(ek)) return memo.exact.get(ek);
        const c = {it, ...iconChip(ctx, it, {size, maxW: mw, maxLines: 4})};
        memo.exact.set(ek, c);
        if (c.bad) memo.badW.set(`${size}|${i}`, Math.max(bad ?? -1, mw));
        else if (c.lines === 1 && (!one || mw > one.mw)) memo.one.set(`${size}|${i}`, Object.assign(c, {mw}));
        return c;
      };
      const sz = textOn ? base.band.map((it, i) => chipAt(it, i, Math.min(w, 760))) : [];
      const fl = flowRows(sz, {x: 0, y: 0, w, gap: 16, rowGap: 10});
      b = {sz, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad || q.w > w + 0.5)};
      memo.band.set(bk, b);
      if (b.bad) memo.badBand.set(size, Math.max(badB ?? -1, w));
    }
    return b;
  };
  let found = null;
  let lastWhy = '';
  for (let PH = Math.min(D.h, 520); PH >= cfg.hMin; PH *= 0.985) {
    const zg = zoneGeom(base.M, PH, tg, rec, RW, arr, minCtx, Boolean(cfg.tagSide));
    if (zg.zW > full) { lastWhy = 'zW'; continue; }
    // (the field part of the context — the record steps out while the lens is open — keeps >= minCtx)
    if ((arr === 'side' || arr === 'stack2') && zg.zW - (RW + 56) < minCtx) { lastWhy = 'ctxW'; continue; }
    let room, blockH;
    const split = Boolean(cfg.split);
    const bandW = split ? Math.floor((arr === 'stack' ? full - recW - 20 : full - zg.zW - 12) / 24) * 24 : full;
    if (bandW < 240) { lastWhy = 'bandW'; continue; }
    const band = flowBand(bandW);
    if (band.bad && !cfg.force) { lastWhy = 'band'; continue; }
    if (arr === 'side') {
      blockH = split ? Math.max(zg.zH, band.h) : zg.zH + (band.h ? 16 + band.h : 0);
      if (blockH > D.h) { lastWhy = `blockH${Math.round(blockH)}`; continue; }
      room = {w: full - zg.zW - 12, h: D.h};
      if (room.w < 200) { lastWhy = 'room'; continue; }
      if (split && band.h < 0.35 * D.h) return {bad: 'thin-band'};
    } else {
      // (stack2: the record stands beside the field inside the context; only the band runs under it)
      if (arr === 'stack2' && (split || !textOn)) { lastWhy = 'split'; continue; }
      blockH = zg.zH + 30 + (arr === 'stack2' ? band.h : split ? Math.max(recH, band.h) : recH + (band.h ? 16 + band.h : 0));
      if (blockH > D.h) { lastWhy = `blockH${Math.round(blockH)}`; continue; }
      // spare height: the context sits high and the record (and band) at the foot of the box, so the scene spans the box
      const top = Math.max(0, (D.h - blockH) * 0.05);
      const sBack = Math.min(1, (0.45 * FU.w + 8) / full);
      room = {w: full, h: D.h - top - zg.zH * sBack - 16, sBack, top};
    }
    // crop: the tag, the string and both slots of the focus consequence with the inner ring between them (the
    // consequence and its string move inside it when the datum changes)
    const G = zg.G;
    // (the tag, the step and both leader ends with their slot pads: the moving leader stays in view)
    const c0 = {x: zg.tagX - 6, y: Math.min(zg.tagY, G.yA + G.LT * 0.3) - 6};
    const c1 = {x: Math.max(zg.tagX + tg.w, zg.fx + zg.iw / 2 + G.headS) + 10, y: Math.max(zg.tagY + tg.h, G.yB - G.LT * 0.3) + 6};
    let crop = {x: c0.x, y: c0.y, w: c1.x - c0.x, h: c1.y - c0.y};
    // (a crop narrower than the room widens, centred, up to 1.6× — so the open lens spans the room)
    const ar = room.w / room.h;
    // (only as far as the tag's text keeps >= 0.30 of the window: the lens stays text-dominated)
    const tA0 = tg.textArea / (crop.w * crop.h);
    if (crop.w / crop.h < ar) { const nw = Math.max(crop.w, Math.min(crop.h * ar, crop.w * (textOn ? 1.6 : 1.4), textOn ? crop.w * tA0 / 0.33 : Infinity)); crop = {...crop, x: crop.x - (nw - crop.w) / 2, w: nw}; }
    // (a crop wider than the room deepens downward into the plate, up to 1.6× — never below the floor line)
    // (labels hidden only: with labels shown the text-coverage gate keeps the crop on the tag)
    // (labels hidden: the crop is not deepened — the lens stays on the tag, the step and its leader)
    // (text coverage target: the tag's text blocks cover >= 0.29 of the crop by this estimate; the rendered text boxes run taller, the rendered gate is 0.30)
    const textA = tg.textArea / (crop.w * crop.h);
    if (textOn && textA < 0.315 && !cfg.force) { lastWhy = `text${textA.toFixed(2)}`; continue; }
    const Z = Math.min(room.w / crop.w, room.h / crop.h);
    const lensMin = Math.min(crop.w, crop.h) * Z;
    // (lens-content fill: the tag card and the rig parts inside the crop cover >= 0.40 of it — LENS FILL METRIC)
    // (the tag card, the two slot pads, the consequence and the plate strip under the path)
    // (the drawn content inside the crop: the tag card plus the slab under it — lanes, slots, the step and its leader)
    const pb = G.plateBox;
    const ov = Math.max(0, Math.min(crop.x + crop.w, pb.x + pb.w) - Math.max(crop.x, pb.x)) * Math.max(0, Math.min(crop.y + crop.h, pb.y + pb.h) - Math.max(crop.y, pb.y));
    const fill = Math.min(1, (tg.w * tg.h + ov) / (crop.w * crop.h));
    // (context + lens fill the box while the lens is open: >= 0.82 of its height)
    const spanH = arr === 'side' ? Math.max(zg.zH, crop.h * Z) : zg.zH * room.sBack + 16 + crop.h * Z + 14;
    if (spanH < (arr === 'side' ? 0.9 : 0.88) * (D.h - (room.top || 0)) && !cfg.force) { lastWhy = `span${Math.round(spanH)}`; continue; }
    // (stacked: the union of the stepped-back context and the lens also spans most of the box's width)
    if (arr !== 'side' && Math.max(zg.zW * room.sBack, crop.w * Z) < 0.9 * full && !cfg.force) { lastWhy = 'unionW'; continue; }
    if ((Z < 1.62 || lensMin < 0.37 * FU.short + 4 || fill < 0.42) && !cfg.force) { lastWhy = `Z${Z.toFixed(2)}/${Math.round(lensMin)}/f${fill.toFixed(2)}`; continue; }
    found = {PH, zg, band, room, crop, Z, blockH, split, bandW, fill};
    break;
  }
  if (!found) return {bad: `fit:${lastWhy}`};
  if (cfg.dry) return {PH: found.PH, size, Z: found.Z, cfg: {...cfg, dry: false}};
  return {FU, size, cfg, tg, rec, recW, recH, arr, RW, ...found, ...found.zg};
}
// depth of the face shown in the lens below the rail (× PH)
const RIG_FACE_IN = 0.3;

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveCA(p);
    const fi = clamp(Math.round(p.focusItem ?? 0), 0, M.n - 1);
    const lanes = [p.focusLanes.before === 'b' ? 'b' : 'a', p.focusLanes.after === 'b' ? 'b' : 'a'];
    const textOn = ctx.show('key');
    // (the trace and key rows come first: they appear late, so the chips shown at rest take the band's last rows)
    const band = [
      {key: 'trB', icon: 'lanes', text: `${t.beforeV}: ${glueLv(p.beforeValue)}`, when: 'trace'},
      {key: 'trA', icon: 'lanes', text: `${t.afterV}: ${glueLv(p.afterValue)}`, when: 'trace'},
      {key: 'key', text: t.key, when: 'key'},
      {key: 'caption', icon: 'record', text: p.contextLabels.context || t.context, when: 'ctx'},
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: altText(ctx, a), when: 'ctx'})),
      ...linkNotes(ctx, M).map(l => ({...l, when: 'ctx'})),
      ...(p.losses[1] ? [{key: 'loss1', icon: 'loss', text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'ctx'}] : []),
    ];
    const rows = [
      // (the focus step's row carries no lane glyph: its lane is the datum)
      ...M.entries.map(e => ({key: `ev${e.i}`, icon: 'item', item: e.i, lane: e.i === fi ? null : e.lane, text: entryText(e)})),
      {key: 'scale', icon: 'event', text: `${p.origin.name} · ${t.lanes}`},
    ];
    const base = {M, fi, lanes, header: t.record, rows, band, memo: {rec: new Map(), band: new Map(), tag: new Map(), one: new Map(), badW: new Map(), badBand: new Map(), exact: new Map()}};
    const rws = ctx.view.shape === 'portrait' ? [440, 520, 620, 720, 900] : ctx.view.shape === 'square' ? [340, 420, 480, 640, 880] : [420, 480, 540, 600];
    // (wide tags: the tag spans both slots, so it dominates the lens at any field size)
    const tws = ctx.view.shape === 'portrait' ? [300, 360, 420, 480, 560] : ctx.view.shape === 'square' ? [260, 320, 380, 440, 520] : [280, 340, 400, 460, 520];
    const hMin = ctx.view.shape === 'square' ? 110 : 140;
    let pick = null, best = null;
    const why = [];
    const v0 = ctx.view, fs0 = Math.min(v0.content.w / ctx.design.w, v0.content.h / ctx.design.h);
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      if (best && pick && pick.sc >= 1e6 && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      for (const arr of SH.arr) for (const RW of rws) for (const tagW of tws) for (const split of [false, true]) for (const tagSide of [true, false]) {
        const X = compose(ctx, base, {size, RW, tagW, arr, split, tagSide, hMin, dry: true});
        if (!X.cfg) { why.push(`${arr}/${RW}/${tagW}${split ? 's' : ''}${tagSide ? 'T' : ''}@${size}:${X.bad}`); continue; }
        if (!best) best = X;
        // the field reaches >= 0.205 of the frame height when it can (subject floor 0.20 + margin); then the larger
        // field and lens, text at >= 20 preferred
        const subj = X.PH * (fieldH() - 0.02) * fs0 >= 0.205 * v0.height ? 1 : 0;
        const sc = subj * 1e6 + X.PH * Math.min(1.2, X.Z / 1.6) * (X.size >= 20 ? 1.15 : 1);
        if (!pick || sc > pick.sc) pick = {...X, sc};
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    let Dv = ctx.design;
    // fallback: a taller virtual box scaled into the real one (flagged); last resort (e.g. the DOM-less text estimator):
    // text and lens limits relaxed, flagged in semantic.problems — never throws
    for (const force of [false, true]) {
      for (let f = 1.1; f <= (force ? 12.01 : 4.01) && !L; f += force ? 0.5 : 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const arr of ['stack', 'side']) for (const tagW of tws) {
          if (L) break;
          const X = compose(c2, base, {size: SH.minSize, RW: rws[rws.length - 1], tagW, arr, tagSide: true, hMin: force ? 30 : 80, force});
          if (X.tg) { L = X; Dv = c2.design; if (force) L.problems = ['no-layout-fits']; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(0, 40);
    L.M = M; L.fi = fi; L.lanes = lanes;
    const full = Dv.w - 2 * MARGIN;
    let zx, F, recX, recY, bandX, bandY, bandW;
    if (L.arr === 'side') {
      const top = Math.max(0, (Dv.h - L.blockH) / 2);
      zx = L.split ? MARGIN + full - L.zW : MARGIN + (full - L.zW) / 2;
      L.zShift = MARGIN + full - L.zW - zx;
      F = top + (L.split ? (L.blockH - L.zH) / 2 : 0) + L.zH - 16;
      recX = zx + L.recX; recY = F + L.recY;
      if (L.split) { bandX = MARGIN; bandW = L.bandW; bandY = top + (L.blockH - L.band.h) / 2; } else { bandX = MARGIN; bandW = full; bandY = top + L.zH + 16; }
    } else {
      const top = L.room.top;
      L.zShift = 0;
      L.sBack = L.room.sBack;
      L.pivot = {x: MARGIN + full / 2, y: top};
      zx = MARGIN + (full - L.zW) / 2;
      F = top + L.zH - 16;
      const lowH = L.arr === 'stack2' ? L.band.h : L.split ? Math.max(L.recH, L.band.h) : L.recH + (L.band.h ? 16 + L.band.h : 0);
      const lowTop = Math.max(top + L.zH + 30, Dv.h - lowH);
      recY = lowTop + L.rec.clipH * 0.35;
      if (L.arr === 'stack2') {
        recX = zx + L.recX; recY = F + L.recY;
        bandX = MARGIN; bandW = full; bandY = lowTop;
      } else if (L.split) {
        recX = MARGIN + 10;
        bandX = MARGIN + L.recW + 20; bandW = L.bandW; bandY = lowTop;
      } else {
        recX = MARGIN + (full - L.recW) / 2 + 10;
        bandX = MARGIN; bandW = full; bandY = recY - L.rec.clipH * 0.35 + L.recH + 16;
      }
    }
    L.F = F; L.zx = zx;
    L.Gw = fieldGeom(zx + (L.tagSide ? L.tg.w + 30 : 0), F, L.PH);
    L.places = itemPlaces(L.Gw, M, [fi], 0.42);
    L.fxw = zx + L.fx;
    L.zg0 = {iw: L.iw, ih: L.ih};
    L.ysw = L.ys.map(y => F + y);
    L.syw = F + L.sy;
    L.tagAt = {x: zx + L.tagX, y: F + L.tagY};
    L.crop = {x: zx + L.crop.x, y: F + L.crop.y, w: L.crop.w, h: L.crop.h};
    const dw = L.crop.w * L.Z, dh = L.crop.h * L.Z;
    if (L.arr === 'side') {
      const cy = Math.max(0, Math.min(Dv.h - dh, L.crop.y + L.crop.h / 2 - dh / 2));
      const roomW = full - L.zW - 12;
      L.dest = {x: MARGIN + (roomW - dw) / 2, y: cy, w: dw, h: dh};
    } else {
      const backBottom = L.pivot.y + (F + 16 - L.pivot.y) * L.sBack;
      // the lens takes the foot of the room below the stepped-back context (context + lens then span the box)
      // (a lens narrower than the box stands at its right, so context + lens span the box's width)
      L.dest = {x: MARGIN + full - dw, y: Math.max(backBottom + 14, Dv.h - dh), w: dw, h: dh};
    }
    L.recOnFloor = L.arr === 'side' || L.arr === 'stack2';
    L.recNode = recordBuild(ctx, L.rec, {prefix: 'rec', x: recX, y: recY});
    L.bandNodes = [];
    if (L.band.sz.length) {
      const pl = flowRows(L.band.sz, {x: bandX, y: bandY, w: bandW, gap: 16, rowGap: 10, center: !L.split}).placed;
      for (const q of pl) {
        const it = q.it.it;
        const b = q.it.build(q.x, q.y, `band-${it.key}`, {});
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    L.trB = L.bandNodes.find(b => b.key === 'trB');
    if (L.trB) {
      const strike = v => { if (v && typeof v === 'object') { if (v.tag === 'text') v.attrs['text-decoration'] = 'line-through'; (v.children || []).forEach(strike); } };
      strike(L.trB.node);
    }
    // Δ marker on the tag's top-left corner (over the card's blank top strip); its label where it is clear of the tag,
    // the rig and the frame
    const mR = Math.max(16, L.size * 0.8);
    L.marker = {x: L.tagAt.x + mR * 0.9, y: L.tagAt.y - mR * 0.35, R: mR};
    L.markerLabel = textOn ? {text: p.contextLabels.marker || t.marker} : null;
    if (L.markerLabel) {
      const fo = {maxWidth: Math.max(160, Math.min(320, L.tg.w + 60)), size: L.size, minSize: L.size, maxLines: 2, weight: 600};
      const f = fitG(ctx, unwidow(glueN(L.markerLabel.text), q => fitG(ctx, q, fo)), fo);
      const w = f.width + L.size * 1.2, hh = f.height + L.size * 0.76;
      const G = L.Gw;
      const rigBox = {x: G.x0 - 6, y: G.top - 10, w: G.x1 - G.x0 + 12, h: F - G.top + 10};
      const tagBox = {x: L.tagAt.x, y: L.tagAt.y, w: L.tg.w, h: L.tg.h};
      const meets = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      const inD = b => b.x >= MARGIN - 0.5 && b.y >= 0 && b.x + b.w <= Dv.w - MARGIN + 0.5 && b.y + b.h <= Dv.h;
      const cands = [
        {x: L.marker.x - mR - 10 - w, y: L.marker.y - hh / 2, w, h: hh},
        {x: L.tagAt.x - 12 - w, y: Math.max(0, L.marker.y - hh / 2), w, h: hh},
        {x: L.tagAt.x - 12 - w, y: L.tagAt.y + L.tg.h - hh, w, h: hh},
        {x: L.tagAt.x, y: L.marker.y - mR - 8 - hh, w, h: hh},
        {x: L.tagAt.x + L.tg.w + 12, y: L.tagAt.y, w, h: hh},
        {x: L.tagAt.x + L.tg.w - w, y: L.marker.y - mR - 8 - hh, w, h: hh},
        {x: L.tagAt.x, y: L.tagAt.y + L.tg.h + 8, w, h: hh},
        {x: L.tagAt.x + L.tg.w - w, y: L.tagAt.y + L.tg.h + 8, w, h: hh},
      ];
      const bandBoxes = [...L.bandNodes.map(b => b.box), L.recNode.box];
      const clearOf = b => !bandBoxes.some(q => meets(b, {x: q.x - 6, y: q.y - 6, w: q.w + 12, h: q.h + 12}));
      const box = cands.find(b => inD(b) && !meets(b, tagBox) && !meets(b, rigBox) && clearOf(b))
        || cands.find(b => inD(b) && !meets(b, tagBox) && clearOf(b))
        || cands.find(b => inD(b) && !meets(b, tagBox)) || cands[0];
      L.markerLabel = {...L.markerLabel, fit: f, box};
    }
    const Dr = ctx.design;
    L.k = Math.min(1, Dr.w / Dv.w, Dr.h / Dv.h);
    L.dx = (Dr.w - Dv.w * L.k) / 2;
    L.dy = (Dr.h - Dv.h * L.k) / 2;
    L.Dv = Dv;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const textOn = ctx.show('key');
    const G = L.Gw;
    const M = L.M;
    // the zone (floor, field, markers, slots, consequences, string, tag) — drawn twice: scene and lens copy
    const zone = (P, tagP) => {
      const tag = tagArt(ctx, L.tg, L.tagAt.x, L.tagAt.y, tagP, textOn);
      const y0 = L.ysw[L.lanes[0] === 'b' ? 1 : 0];

      // the state produced by the action: both trolleys at their barriers, both connectors drawn (identical)
      const links = M.links.map(l => laneConnector(ctx, {name: `${P}cn${l.lane}`, G, l: l.lane, kind: l.kind, disputed: l.status === 'disputed'}));
      const stand = [
        {y: G.py, node: g({transform: T(G.px, G.py)}, eventArt(ctx, {R: G.padR}))},
        ...L.places.map(q => ({y: q.y, node: g({transform: T(q.x, q.y)}, itemArt(ctx, {i: q.i, s: q.s}))})),
        ...['a', 'b'].map(l => ({y: G.laneY(l) + 0.01, node: g({transform: T(G.xb, G.laneY(l))}, laneBarrier(ctx, {name: `${P}lb${l}`, G}))})),
        ...['a', 'b'].map(l => ({y: G.laneY(l) + 0.02, node: g({name: `${P}cart${l}`, transform: T(G.cartX(1), G.laneY(l))}, cartArt(ctx, {PH: G.PH, side: l}))})),
        {y: 1e9, node: g({name: `${P}item`, transform: T(L.fxw, y0)}, itemArt(ctx, {i: L.fi, s: G.itemS * ITEM_K}))},
      ].sort((a0, b0) => a0.y - b0.y);
      return g(null,
        L.arr !== 'side' || P ? floorArt(ctx, {name: `${P}floor`, x0: MARGIN, x1: L.Dv.w - MARGIN, floorY: L.F}) : null,
        g({name: `${P || 'z'}field`},
          slabArt(ctx, {G}),
          links.map(lk => { const fr = lk.frame(1); return g(null, applyStatic(lk.node, fr)); }),
          // the two slots of the focus step: a ● pad under lane A, a ◆ pad under lane B (same shape and weight)
          slotArt(ctx, {G, at: {x: L.fxw, y: L.ysw[0]}, side: 'a'}),
          slotArt(ctx, {G, at: {x: L.fxw, y: L.ysw[1]}, side: 'b'}),
          stand.map(q => q.node)),
        h('path', {name: `${P}string`, d: stringD(L, y0), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5}),
        tag.node,
      );
    };
    const rb = L.recNode.box;
    const recEasel = L.recOnFloor ? h('path', {d: `M${r(rb.x + rb.w * 0.3)} ${r(rb.y + rb.h - 4)}L${r(rb.x + rb.w * 0.24)} ${r(L.F)}M${r(rb.x + rb.w * 0.7)} ${r(rb.y + rb.h - 4)}L${r(rb.x + rb.w * 0.76)} ${r(L.F)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.32)), 'stroke-linecap': 'round'}) : null;
    const Lc = L.crop;
    const lens = g({name: 'lz', opacity: 0, 'data-occludes': 1},
      h('defs', null, h('clipPath', {id: ctx.id('lzclip')}, h('rect', {name: 'lz-cliprect', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14}))),
      h('rect', {name: 'lz-win', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14, fill: th.paper}),
      g({'clip-path': ctx.ref('lzclip')}, g({name: 'lz-content'}, zone('lzs-', 'lzt'))),
      h('rect', {name: 'lz-border', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14, fill: 'none', stroke: th.accent2, 'stroke-width': 4}),
    );
    const guides = g({name: 'guides', opacity: 0},
      h('path', {name: 'src-frame', d: roundRectPath(Lc.x, Lc.y, Lc.w, Lc.h, 10), fill: 'none', stroke: th.accent2, 'stroke-width': 3}),
      h('line', {name: 'guide0', x1: r(Lc.x), y1: r(Lc.y), x2: r(Lc.x), y2: r(Lc.y), stroke: th.accent2, 'stroke-width': 2.5}),
      h('line', {name: 'guide1', x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(Lc.x), y2: r(Lc.y + Lc.h), stroke: th.accent2, 'stroke-width': 2.5}),
    );
    const ml = L.markerLabel;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.recOnFloor ? null : g({name: 'rec-g'}, L.recNode.node),
      L.arr === 'side' ? floorArt(ctx, {name: 'floor', x0: MARGIN, x1: L.Dv.w - MARGIN, floorY: L.F}) : null,
      g({name: 'cam'}, zone('', 'tg'), L.recOnFloor ? g({name: 'rec-g'}, recEasel, L.recNode.node) : null),
      guides,
      lens,
      changedMarker(ctx, {name: 'marker', x: L.marker.x, y: L.marker.y, radius: L.marker.R, opacity: 0}),
      ml ? g({name: 'mlabel', opacity: 0},
        h('path', {d: roundRectPath(ml.box.x, ml.box.y, ml.box.w, ml.box.h, Math.min(ml.box.h / 2, L.size * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 2}),
        textBlock(ml.fit, {x: ml.box.x + L.size * 0.6, y: ml.box.y + L.size * 0.38, fill: th.ink})) : null,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const textOn = ctx.show('key');
    const nodes = {};
    const stack = L.arr !== 'side';
    const W = L.arr === 'stack2' ? W_STACK2 : stack ? W_STACK : W_SIDE;
    const Lr = L.crop, De = L.dest;
    const shP = stack ? 0 : u < W.shiftBack[0] ? ease.inOutCubic(seg(u, ...W.shift)) : 1 - ease.inOutCubic(seg(u, ...W.shiftBack));
    const sh = L.zShift * shP;
    const backP = !stack ? 0 : u < W.regrow[0] ? ease.inOutCubic(seg(u, ...W.shrink)) : 1 - ease.inOutCubic(seg(u, ...W.regrow));
    const sc = stack ? lerp(1, L.sBack, backP) : 1;
    const pv = L.pivot || {x: 0, y: 0};
    const camT = stack ? `translate(${r(pv.x)} ${r(pv.y)}) scale(${r(sc, 5)}) translate(${r(-pv.x)} ${r(-pv.y)})` : T(r(sh), 0);
    nodes.cam = {opacity: r(seg(u, ...W.ctxIn), 3), transform: camT};
    const Lc = stack ? {x: pv.x + (Lr.x - pv.x) * sc, y: pv.y + (Lr.y - pv.y) * sc, w: Lr.w * sc, h: Lr.h * sc} : {x: Lr.x + sh, y: Lr.y, w: Lr.w, h: Lr.h};
    const op = stack
      ? ease.outCubic(seg(u, W.open[0] + 0.004, W.open[1])) * (1 - ease.inCubic(seg(u, ...W.close)))
      : ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const lensOn = u >= W.open[0] && u < W.close[1];
    const cur = {x: lerp(Lc.x, De.x, op), y: lerp(Lc.y, De.y, op), w: lerp(Lc.w, De.w, op), h: lerp(Lc.h, De.h, op)};
    const k = cur.w / Lr.w;
    nodes.lz = {opacity: lensOn ? 1 : 0};
    for (const n of ['lz-cliprect', 'lz-win', 'lz-border']) nodes[n] = {x: r(cur.x), y: r(cur.y), width: r(cur.w), height: r(cur.h)};
    nodes['lz-content'] = {transform: `translate(${r(cur.x)} ${r(cur.y)}) scale(${r(k, 5)}) translate(${r(-Lr.x)} ${r(-Lr.y)})`};
    const gOn = lensOn ? seg(u, ...W.guides) * (1 - seg(u, W.close[0], W.close[0] + 0.01)) : 0;
    nodes.guides = {opacity: r(gOn, 3)};
    const gVis = L.arr === 'side' ? 1 : 0;
    nodes['src-frame'] = {transform: camT};
    if (L.arr === 'side') {
      const bx = cur.x + cur.w <= Lc.x + 1 ? cur.x + cur.w : cur.x;
      nodes.guide0 = {x1: r(Lc.x), y1: r(Lc.y), x2: r(bx), y2: r(cur.y), opacity: gVis};
      nodes.guide1 = {x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(bx), y2: r(cur.y + cur.h), opacity: gVis};
    } else {
      nodes.guide0 = {x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(cur.x), y2: r(cur.y), opacity: gVis};
      nodes.guide1 = {x1: r(Lc.x + Lc.w), y1: r(Lc.y + Lc.h), x2: r(cur.x + cur.w), y2: r(cur.y), opacity: gVis};
    }
    // the datum: before → after (scene tag and lens copy together; the scene's tag is blank while the lens holds it)
    const out = seg(u, ...W.oldOut), inn = seg(u, ...W.newIn);
    const ctxVals = u < W.tagOut[1] ? 1 - seg(u, ...W.tagOut) : u < W.tagIn[0] ? 0 : seg(u, ...W.tagIn);
    const lift = L.PH * 0.05;
    for (const P of ['tg', 'lzt']) {
      nodes[`${P}-vb`] = {opacity: r(1 - out, 3), transform: T(0, -lift * ease.inQuad(out))};
      nodes[`${P}-va`] = {opacity: r(inn, 3)};
      if (textOn) {
        const st = seg(u, ...W.strike);
        nodes[`${P}-strike`] = {opacity: r(st > 0 ? 1 - out : 0, 3), transform: T(0, -lift * ease.inQuad(out))};
        (L.tg.strikeLines || []).forEach((ln, i) => { nodes[`${P}-st${i}`] = {'stroke-dashoffset': r((ln.w + 6) * (1 - st))}; });
      }
    }
    // the tag's texts (scene and lens copy) show only while drawn at >= the floor
    const floor = L.size >= LENS_TEXT_MIN ? LENS_TEXT_MIN + 0.1 : 16.2;
    nodes['tg-vals'] = {opacity: r(L.size * sc >= floor ? ctxVals : 0, 3)};
    nodes['lzt-vals'] = {opacity: k * L.size >= floor ? 1 : 0};
    // dependent geometry only, AFTER the new value is legible: the consequence slides between the slots (across the
    // inner ring), its string following
    const gp0 = ease.inOutQuad(seg(u, ...W.geo));
    const yOf = l => L.ysw[l === 'b' ? 1 : 0];
    const yNow = lerp(yOf(L.lanes[0]), yOf(L.lanes[1]), gp0);
    const pt = {x: L.fxw, y: yNow};
    // the step slides between its slots (under lane A ↔ on lane B), its string following — in the lens and in context
    for (const P of ['', 'lzs-']) { nodes[`${P}string`] = {d: stringD(L, yNow)}; nodes[`${P}item`] = {transform: T(L.fxw, yNow)}; }
    const txt = u < W.textOut[1] ? Math.min(seg(u, ...W.textIn), 1 - seg(u, ...W.textOut)) : u < W.textBack[0] ? 0 : seg(u, ...W.textBack);
    nodes['rec-g'] = {opacity: r(L.arr === 'side' ? 1 : txt, 3)};
    for (const bn of L.bandNodes) {
      const v = bn.when === 'ctx' ? txt : bn.when === 'trace' ? seg(u, ...W.trace) : seg(u, ...W.key);
      nodes[`band-${bn.key}`] = {opacity: r(v, 3)};
    }
    const mOn = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mOn, 3)};
    if (L.markerLabel) nodes.mlabel = {opacity: r(mOn, 3)};
    const datum = inn >= 1 ? 'after' : out > 0 || seg(u, ...W.strike) > 0 ? 'changing' : 'before';
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      datum,
      tagValue: inn >= 1 ? 'after' : out <= 0 ? 'before' : 'changing',
      lensValue: !lensOn ? null : inn >= 0.15 ? 'after' : 1 - out >= 0.15 ? 'before' : null,
      strike: r(seg(u, ...W.strike), 3),
      lensOpen: r(op, 3), lensOn,
      zoom: r(L.Z, 3),
      lensNow: {x: r(cur.x), y: r(cur.y), w: r(cur.w), h: r(cur.h)},
      crop: {x: r(Lc.x), y: r(Lc.y), w: r(Lc.w), h: r(Lc.h)},
      shift: r(sh),
      back: r(sc, 4),
      lensMinSide: r(Math.min(De.w, De.h) / L.FU.short, 3),
      lensFill: r(L.fill, 3),
      ctxValues: r(ctxVals, 3),
      geo: r(gp0, 3),
      lane: gp0 >= 1 ? L.lanes[1] : gp0 <= 0 ? L.lanes[0] : 'changing',
      lanes: L.lanes, focusItem: L.fi,
      item: {x: r(pt.x), y: r(pt.y)},
      markerVisible: mOn >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      textsOut: txt === 0,
      tag: {x: r(L.tagAt.x), y: r(L.tagAt.y), w: r(L.tg.w), h: r(L.tg.h)},
      marker: {x: r(L.marker.x), y: r(L.marker.y), R: r(L.marker.R)},
      frame: {w: r(L.Dv.w), h: r(L.Dv.h)},
      layout: {PH: r(L.PH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, arr: L.arr, why: L.why, Z: r(L.Z, 3), room: {w: r(L.room.w), h: r(L.room.h)}, dest: {w: r(L.dest.w), h: r(L.dest.h)}, zW: r(L.zW), zH: r(L.zH)},
      ...(L.problems ? {problems: L.problems} : {}),
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-09-inspect',
    title: 'Affected person\'s contribution — a lens on the lane tag of one supplied step; one supplied datum is substituted',
    titleEs: 'Contribución de la persona afectada — Inspección y cambio de un dato',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Contribución de la persona afectada',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A fictional slab after both supplied conducts ran: two identical lanes, both trolleys at their barriers, both connectors to the event, the supplied steps under their lanes, and Step 1 on the ● slot under lane A with a value tag on a string, beside the record. A real enlarged copy of the tag, the string, both slots and the step grows from its source; the supplied value is struck and replaced by the alternative value, and only then the step slides to the ◆ slot under lane B. The lens returns to its source; a Δ marker and a before/after trace keep the old value traceable. Nothing is weighed, shared out or decided.',
    tags: ['causation', 'affected person', 'inspect', 'lens', 'datum substitution', 'parallel lanes', 'before and after', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/contribucion-afectada.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
