/**
 * LAW-0696 — Evento interviniente · inspect
 *
 * Storyboard (the state the entry produced; one detail lens):
 *  0.00–0.20 build       The context: the model stage after the later event has
 *                        entered and the sequence has run through it as
 *                        supplied — every tile down, the later event (◆) lying
 *                        in its slot between two supplied events, the crane
 *                        back up, the vase cracked. A status tag hangs over the
 *                        seal of the inspected link (default: the later
 *                        event's link to the next piece): "Link later event →
 *                        3: <before value>". Context caption and legend.
 *  0.20–0.45 isolate     The legend steps out and (square boxes, or wide boxes
 *                        with labels hidden) the context shrinks into the left
 *                        half, never under 45 % of the width. A lens grows IN
 *                        PLACE in the free room beside its source (the later
 *                        event, the inspected seal and the tag) — a real
 *                        enlarged copy of the stage and the tag, drawn in the
 *                        same coordinates and posed from the same state every
 *                        frame — while the context dims in place. The copy fades
 *                        in as the window grows (from ~40 % open, once its
 *                        smallest text is >= 16.5 px), so there is no double
 *                        image and a blank window lasts ~100 ms. Under it:
 *                        "Before: <before value>".
 *  0.45–0.75 substitute  The before value is struck (every line). Then only the
 *                        dependent state changes, in the scene and so in the
 *                        lens: the inspected link seal turns from linked rings
 *                        to a dashed "?" ring (or back); the tag's old value
 *                        lifts away and the new one fades in; "After: <after
 *                        value>" stays still ≥ 400 ms.
 *  0.75–1.00 return      The lens shrinks away in place (0.76–0.815) and the
 *                        context grows back (0.81–0.85); the context keeps
 *                        the changed seal and a neutral Δ marker; the text column
 *                        adds the record "Before: <old>" (struck) / "After:
 *                        <new>", the marker label and the key "As supplied · no
 *                        conclusion drawn". No tile,
 *                        crack or other seal changes; nothing is decided about
 *                        the link, responsibility or outcome. Seeking back
 *                        restores the old datum exactly.
 * Wide boxes: stage left, legend column right (the lens opens over the dimmed
 * column). Tall: stage over the legend (the lens opens below the stage). Square
 * (and wide boxes with labels hidden): the context shrinks into the left half
 * and the lens opens in the right half.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0696
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {inspectFields, oneOf} from '../../schemas/fields.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {placeChip, unionBounds} from './kits/place.js';
import {jointArt} from './kits/causal-chain.js';
import {
  ieFields, IE_STRINGS, resolveIE, ieStage, ieGeom, fitIeH, wrapChoices, pieceName,
  chipG, balancedG, ieLegend, legendFrame, modelItems, flowRows,
} from './kits/evento-interviniente.js';

const ID = 'LAW-0696';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  legend: [0.02, 0.12], caption: [0, 0.08], tag: [0.06, 0.14],
  lgOut: [0.2, 0.225], open: [0.21, 0.29], before: [0.3, 0.35],
  strike: [0.45, 0.49], tagOut: [0.52, 0.555], sealOut: [0.52, 0.55], sealIn: [0.555, 0.59], tagIn: [0.56, 0.595], after: [0.58, 0.62],
  close: [0.76, 0.8], lgIn: [0.775, 0.82], textIn: [0.835, 0.865], marker: [0.84, 0.875], markerLabel: [0.855, 0.89], key: [0.855, 0.89],
  // hand-over of the changed datum: the context tag leaves before the lens copy appears, and returns after it has gone
  ctxTagOut: [0.195, 0.207], ctxTagIn: [0.835, 0.855], textOut: [0.195, 0.208],
};
const DIM = 0.6;
const TARGETS = ['link-out', 'link-in'];
const Z_MIN = 1.6;
const LENS_FRAC = 0.36;

const sceneSchema = {
  ...ieFields,
  ...inspectFields(TARGETS),
  substitution: oneOf('Dependent state of the substituted datum: to-disputed = the inspected link seal turns into a dashed "disputed" ring; to-proposed = the reverse', ['to-disputed', 'to-proposed']),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+2 min'},
    {label: 'Display stand shakes', time: 'T+3 min'},
  ],
  addedEvent: {label: 'Cleaner nudges the stand', time: 'T+2 min', after: 1},
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  focusTarget: 'link-out',
  substitution: 'to-disputed',
  beforeValue: 'proposed',
  afterValue: 'disputed (as supplied)',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'State produced once the later event has entered, as supplied', marker: 'Datum changed'},
};

const SHAPES = {
  landscape: {size: 24, baseMin: 20, minSize: 17, modes: ['side'], maxH: 300},
  square: {size: 24, baseMin: 20, minSize: 17, modes: ['below'], maxH: 260},
  portrait: {size: 25, baseMin: 20.5, minSize: 17, modes: ['below'], maxH: 260},
};
const MARGIN = 10;

/** Tag over the inspected seal: "<link>: <value>"; the old value lifts away, the new one fades in. */
function statusTag(ctx, {prefix, head, before, after, x, y, size, maxW, seal}) {
  const th = ctx.theme;
  const mk = txt => {
    const text = `${head}: ${txt}`;
    const bw = balancedG(ctx, text, {maxWidth: maxW, size, maxLines: 5});
    return {text, bw, c: chipG(ctx, text, {x: 0, y: 0, maxWidth: bw, size, maxLines: 5})};
  };
  const a0 = mk(before), b0 = mk(after);
  const w = Math.max(a0.c.box.w, b0.c.box.w), hh = Math.max(a0.c.box.h, b0.c.box.h);
  const A = chipG(ctx, a0.text, {x: x - a0.c.box.w / 2, y: y + (hh - a0.c.box.h) / 2, maxWidth: a0.bw, size, maxLines: 5, fill: th.card, stroke: th.inkSoft});
  const B = chipG(ctx, b0.text, {x: x - b0.c.box.w / 2, y: y + (hh - b0.c.box.h) / 2, maxWidth: b0.bw, size, maxLines: 5, fill: th.accent2Soft, stroke: th.accent2, name: `${prefix}-tagnew`, opacity: 0});
  const lead = h('path', {d: `M${r(x)} ${r(y + hh)}L${r(seal.x)} ${r(seal.y)}`, stroke: th.inkSoft, 'stroke-width': 2.5});
  const node = g({name: `${prefix}-tag`}, lead, g({name: `${prefix}-tagoldg`}, A.node), B.node);
  const frame = (outP, inP) => ({
    [`${prefix}-tagoldg`]: {opacity: r(1 - outP, 3), transform: `translate(0 ${r(-14 * ease.inCubic(outP))})`},
    [`${prefix}-tagnew`]: {opacity: r(inP, 3)},
  });
  return {node, frame, box: {x: x - w / 2, y, w, h: hh}, lead: {from: {x, y: y + hh}, to: seal}};
}

/**
 * Adjust a crop (in place) so that every link seal is wholly inside it or wholly out of it: a seal the rim would cut is
 * left out (the crop edge stops short of it) unless that would cut the required detail `need`, in which case it is
 * taken in whole.
 */
function wholeSeals(source, need, joints, jr, objs = [], objNeed = need) {
  // (seals: the box around each seal; objs: other whole objects — the alternatives' barricades — whose cut is resolved
  // against objNeed, so a barricade is left out whenever the detail allows and taken in whole otherwise)
  const ov = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
  const items = [...joints.filter(Boolean).map(q => ({b: {x: q.x - jr - 12, y: q.y - jr - 12, w: 2 * jr + 24, h: 2 * jr + 24}, need})), ...objs.map(b => ({b: {x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8}, need: objNeed}))];
  for (let it = 0; it < 24; it++) {
    let changed = false;
    // (after 10 rounds without settling — leaving one object out cuts another that must stay whole — every object the
    // rim still cuts is taken in whole: the crop only grows from there, so it settles)
    const force = it >= 10;
    for (const {b, need: nd0} of items) {
      const nd = force ? source : nd0;
      const inside = b.x >= source.x && b.y >= source.y && b.x + b.w <= source.x + source.w && b.y + b.h <= source.y + source.h;
      if (!ov(b, source) || inside) continue;
      changed = true;
      const needR = nd.x + nd.w, needB = nd.y + nd.h;
      const canR = b.x - 2 >= needR, canL = b.x + b.w + 2 <= nd.x, canB = b.y - 2 >= needB, canT = b.y + b.h + 2 <= nd.y;
      if (ov(b, nd) || !(canR || canL || canB || canT)) {
        const x0 = Math.min(source.x, b.x), y0 = Math.min(source.y, b.y);
        source.w = Math.max(source.x + source.w, b.x + b.w) - x0; source.h = Math.max(source.y + source.h, b.y + b.h) - y0;
        source.x = x0; source.y = y0;
      } else if (canR) source.w = b.x - 2 - source.x;
      else if (canL) { const r0 = source.x + source.w; source.x = b.x + b.w + 2; source.w = r0 - source.x; }
      else if (canB) source.h = b.y - 2 - source.y;
      else { const b0 = source.y + source.h; source.y = b.y + b.h + 2; source.h = b0 - source.y; }
    }
    if (!changed) break;
  }
  return source;
}

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M, SH, lossCount, fj} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const size = cfg.size;
  const side = cfg.mode === 'side' && keyOn;
  const full = D.w - 2 * MARGIN;
  const colW = side ? Math.round(D.w * cfg.colF) : full;
  const colX = side ? D.w - MARGIN - colW : MARGIN;
  const regionW = side ? D.w - 2 * MARGIN - colW - 28 : full;
  // ---- caption
  let cap = allOn && p.contextLabels.context ? chipG(ctx, `${t.context}: ${p.contextLabels.context}`, {x: MARGIN, y: 0, maxWidth: regionW, size, maxLines: 2, name: 'ctx-caption', fill: th.accent2Soft, stroke: th.accent2, opacity: 0}) : null;
  if (cap && (cap.fit.truncated || cap.fit.broken)) return {bad: 'cap'};
  const top = cap ? cap.box.h + 14 : 0;
  // ---- legend + key/marker label
  const items = keyOn ? modelItems(ctx, M) : [];
  const lgOpts = y => ({x: colX, y, w: colW, cols: side ? 1 : cfg.cols, size, maxLines: cfg.maxLines ?? 3, prefix: 'lg', gap: cfg.gap ?? 10});
  let lg = items.length ? ieLegend(ctx, items, lgOpts(0)) : {rows: [], h: 0};
  if (lg.truncated) return {bad: 'legend'};
  const keyP = keyOn ? chipG(ctx, t.key, {x: 0, y: 0, maxWidth: Math.min(colW, 560), size, maxLines: 3}) : null;
  // record of the substitution (kept at the hold: the old value stays traceable, struck)
  const recW = Math.min(colW, 560);
  const recP = keyOn ? [`${t.before}: ${p.beforeValue}`, `${t.after}: ${p.afterValue}`].map(tx => chipG(ctx, tx, {x: 0, y: 0, maxWidth: recW, size, maxLines: 4})) : [];
  if (recP.some(c => c.fit.truncated || c.fit.broken)) return {bad: 'rec'};
  // the Δ marker's label sits with the record (a Δ icon repeats the marker drawn at the changed seal)
  const mlR = size * 0.62;
  const mlP = keyOn && p.contextLabels.marker ? chipG(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: recW - 2 * mlR - 10, size, maxLines: 2}) : null;
  if (mlP && (mlP.fit.truncated || mlP.fit.broken)) return {bad: 'mlabel'};
  // key, before, after and the marker label flow in rows under the legend
  const bandItems = keyOn ? [{k: 'key', w: keyP.box.w, h: keyP.box.h}, {k: 'before', w: recP[0].box.w, h: recP[0].box.h}, {k: 'after', w: recP[1].box.w, h: recP[1].box.h}, ...(mlP ? [{k: 'ml', w: mlP.box.w + 2 * mlR + 10, h: mlP.box.h}] : [])] : [];
  const bandFlow = y0 => flowRows(bandItems, {x: colX, y: y0, w: colW, gap: 16, rowGap: 10});
  const bandH = bandItems.length ? bandFlow(0).bottom : 0;
  const textH = (lg.h ? lg.h + 14 : 0) + bandH;
  if (side && textH > D.h) return {bad: 'col'};
  // ---- tag (needed for the stage's headroom)
  const head = `${t.link} ${pieceName(t, M, fj)} → ${pieceName(t, M, fj + 1)}`;
  const tagW = Math.max(size * 8, Math.min(size * (cfg.tagK ?? 13), regionW * (cfg.tagK > 13 ? 0.45 : 0.3)));
  const tagProbe = keyOn ? [p.beforeValue, p.afterValue].map(v => chipG(ctx, `${head}: ${v}`, {x: 0, y: 0, maxWidth: balancedG(ctx, `${head}: ${v}`, {maxWidth: tagW, size, maxLines: 5}), size, maxLines: 5})) : [];
  if (tagProbe.some(c => c.fit.truncated || c.fit.broken)) return {bad: 'tag'};
  // ---- stage
  const stageH = side ? D.h - top : D.h - top - textH - 20 - (cfg.lensRoom ?? 0);
  const H = fitIeH(M.N, regionW, stageH, SH.maxH, lossCount, cfg.wrapM ?? null);
  if (!H || H < 110) return {bad: 'H', H};
  if (cfg.dry) return {H, size, cfg: {...cfg, dry: false}};
  const gm = ieGeom(M.N, H, lossCount, cfg.wrapM ?? null);
  const stageX = side ? MARGIN : MARGIN + (full - gm.width) / 2;
  // (wide: centred beside the column; square/tall: at the top, the room under it is kept for the lens)
  // (wide boxes: the stage is centred beside the column; otherwise the whole rest block — caption, stage, legend,
  // notes — is centred in the box, so build and hold fill it evenly)
  const blockH = top + gm.above + gm.below + (textH ? 20 + textH : 0);
  // (centred on what shows at build — the stage and the legend — as long as the hold's notes still fit below)
  const blockBuild = blockH - (bandH && keyP ? Math.max(0, bandH - keyP.box.h - 10) : bandH);
  const yOff = side ? 0 : Math.max(0, Math.min((D.h - blockBuild) / 2, D.h - blockH));
  if (cap && yOff) cap = chipG(ctx, `${t.context}: ${p.contextLabels.context}`, {x: MARGIN, y: yOff, maxWidth: regionW, size, maxLines: 2, name: 'ctx-caption', fill: th.accent2Soft, stroke: th.accent2, opacity: 0});
  const F = top + (side ? Math.max(0, (stageH - gm.above - gm.below) / 2) : yOff) + gm.above;
  // (square: the context shrinks to half size while the lens is open; the seals' "?" stays >= 16 px)
  const jointMin = ctx.view.shape === 'landscape' ? 23 : 30;
  const mkStage = prefix => ieStage(ctx, {prefix, jointMin, x: stageX, floorY: F, H, M: base.Mb, lossCount, take: base.take, wrapM: cfg.wrapM ?? null, span: side ? [MARGIN, MARGIN + regionW] : [MARGIN, D.w - MARGIN]});
  const stage = mkStage('st');
  const copy = mkStage('lzs');
  const stageBottom = stage.plinth.floorY + 36;
  const U = 1;
  const PS = {carry: 1, lower: 1, grip: 0, rise: 1};
  const posed = stage.pose('with', U, PS);
  const S0 = posed.semantic;
  const seal = S0.joints[fj];
  const jr = Math.max(jointMin, H * 0.075);
  // ---- tag over the seal: free space under the beam, clear of the fallen tiles and the raised claw
  let tag = null, tagCopy = null;
  const clawB = stage.clawBox(S0.claw.x, S0.claw.y);
  if (keyOn && seal) {
    const tw0 = Math.max(tagProbe[0].box.w, tagProbe[1].box.w), th0 = Math.max(tagProbe[0].box.h, tagProbe[1].box.h);
    const obst = [...stage.rigBoxes, clawB, ...posed.polys, ...stage.barriers.map(b => b.box), ...M.links.map((_, j) => S0.joints[j]).filter(Boolean).map(q => ({x: q.x - jr - 6, y: q.y - jr - 6, w: 2 * jr + 12, h: 2 * jr + 12}))];
    const bounds = {x: stage.left, y: stage.beamY + 30, w: stage.right - stage.left, h: F - stage.beamY - 30};
    // the tag leans towards the later event's side of the seal, so the lens crop stays compact
    const xc = posed.polys[M.k].reduce((acc, q) => acc + q.x / 4, 0);
    const xLeft = xc < seal.x;
    const res = placeChip({w: tw0, h: th0}, {x: seal.x, y: seal.y, r: jr + 4}, {obstacles: obst, bounds, own: posed.polys, order: xLeft ? ['aboveL', 'above', 'leftHigh', 'aboveR', 'rightHigh'] : ['aboveR', 'above', 'rightHigh', 'aboveL', 'leftHigh'], gaps: [14, 26, 40, 60, 90, 130]})
      || placeChip({w: tw0, h: th0}, {x: seal.x, y: seal.y, r: jr + 4}, {obstacles: obst, bounds, leastBad: true});
    const tx = res ? res.x : seal.x, ty = res ? res.y : seal.y - jr - 30 - th0;
    const end = res ? res.end : {x: seal.x, y: seal.y - jr};
    tag = statusTag(ctx, {prefix: 'tg', head, before: p.beforeValue, after: p.afterValue, x: tx, y: ty, size, maxW: tagW, seal: end});
    tagCopy = statusTag(ctx, {prefix: 'lzt', head, before: p.beforeValue, after: p.afterValue, x: tx, y: ty, size, maxW: tagW, seal: end});
  }
  // the after-state seals (context + copy), stacked over the stage's seal and swapped with it
  const newSeal = pre => jointArt(ctx, {name: `${pre}-sw`, disputed: base.toDisputed, radius: jr});
  // ---- the lens source: the later event, both of its seals, the tag (whole)
  const xPoly = posed.polys[M.k];
  // (the later event and the inspected seal; the other seal is included only when it is close by)
  const other = S0.joints[fj === M.k ? M.k - 1 : M.k];
  const pts = [...xPoly, ...[seal, other && seal && Math.hypot(other.x - seal.x, other.y - seal.y) < H * 0.9 ? other : null].filter(Boolean).flatMap(q => [{x: q.x - jr - 8, y: q.y - jr - 8}, {x: q.x + jr + 8, y: q.y + jr + 8}]), {x: xPoly[0].x, y: F + 10}];
  if (tag) pts.push({x: tag.box.x, y: tag.box.y}, {x: tag.box.x + tag.box.w, y: tag.box.y + tag.box.h});
  const pad = 16;
  const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
  const source = {x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad};
  // every link seal (a supplied status, "?" when disputed) is wholly inside the crop or wholly out of it
  const need = unionBounds([...xPoly.map(q => ({x: q.x, y: q.y, w: 0, h: 0})), seal && {x: seal.x - jr - 8, y: seal.y - jr - 8, w: 2 * jr + 16, h: 2 * jr + 16}, tag && tag.box]);
  // (a barricade's box as drawn, including its striped board's clipped stripe geometry, which a bounding box counts:
  // stripes run from bw/2 + boardH left of centre to bw/2 + 2.7·boardH right of it — barrierArt)
  const objs = stage.barriers.map(b => { const bh = b.box.h - 10, u0 = unionBounds([b.box, b.stand]); return {x: u0.x - bh, y: u0.y, w: u0.w + 3.7 * bh, h: u0.h}; });
  // (and the losses as described — whole or out, like the seals)
  for (const poly of posed.polys.slice(M.N)) { const bb = unionBounds(poly.map(q => ({x: q.x, y: q.y, w: 0, h: 0}))); objs.push({x: bb.x - 6, y: bb.y - 6, w: bb.w + 12, h: bb.h + 12}); }
  wholeSeals(source, need, S0.joints, jr, objs);

  // ---- legend / key positions
  const lgY = side ? Math.max(0, (D.h - textH) / 2) : stageBottom + 20;
  lg = items.length ? ieLegend(ctx, items, lgOpts(lgY)) : {rows: [], h: 0};
  const placedBand = bandFlow(lgY + (lg.h ? lg.h + 14 : 0)).placed;
  const at = k0 => placedBand.find(q => q.k === k0);
  const key = keyP ? chipG(ctx, t.key, {x: at('key').x, y: at('key').y, maxWidth: Math.min(colW, 560), size, maxLines: 3, name: 'key', stroke: th.inkSoft, opacity: 0}) : null;
  let record = null;
  if (keyOn) {
    const pb = at('before'), pa = at('after');
    const b = chipG(ctx, `${t.before}: ${p.beforeValue}`, {x: pb.x, y: pb.y, maxWidth: recW, size, maxLines: 4, name: 'rec-before'});
    const a = chipG(ctx, `${t.after}: ${p.afterValue}`, {x: pa.x, y: pa.y, maxWidth: recW, size, maxLines: 4, name: 'rec-after', fill: th.accent2Soft, stroke: th.accent2});
    const strikes = b.fit.lines.map((ln, i) => {
      const lw = ctx.measure(ln.replace(/\u00a0/g, ' '), b.fit.size, 600, 'sans');
      const yy = pb.y + size * 0.38 + i * b.fit.lineHeight + b.fit.size * 0.5;
      return h('line', {x1: r(b.box.cx - lw / 2 - 4), x2: r(b.box.cx + lw / 2 + 4), y1: r(yy), y2: r(yy), stroke: th.ink, 'stroke-width': 3});
    });
    record = {node: g({name: 'record', opacity: 0}, b.node, g(null, strikes), a.node), box: unionBounds([b.box, a.box])};
  }

  // ---- Δ marker + label near the seal, clear of the tiles and the tag
  const obst2 = [...stage.rigBoxes, clawB, ...posed.polys, tag && tag.box, ...stage.barriers.flatMap(b => [b.box, b.stand]), ...S0.joints.filter(Boolean).map(q => ({x: q.x - jr - 4, y: q.y - jr - 4, w: 2 * jr + 8, h: 2 * jr + 8}))].filter(Boolean);
  const mR = keyOn ? Math.max(20, size * 0.8) : Math.max(28, H * 0.14);
  const sealPt = seal || {x: stage.slotX, y: F - H * 0.5};
  // the tag's leader is an obstacle too (thin boxes along it); the marker never sits on a text
  if (tag && tag.lead) {
    const {from, to} = tag.lead; const nSeg = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 12));
    for (let i = 0; i <= nSeg; i++) obst2.push({x: from.x + (to.x - from.x) * i / nSeg - 4, y: from.y + (to.y - from.y) * i / nSeg - 4, w: 8, h: 8});
  }
  const texts = [cap && cap.box, ...lg.rows.map(rw => rw.box), key && key.box, record && record.box, mLabel0Box(), tag && tag.box].filter(Boolean);
  function mLabel0Box() { if (!(mlP && keyOn)) return null; const pm = at('ml'); return pm ? {x: pm.x, y: pm.y, w: mlP.box.w + 2 * mlR + 10, h: mlP.box.h} : null; }
  const stBounds = {x: stage.left + 10, y: stage.beamY + 30, w: stage.right - stage.left - 20, h: F - stage.beamY - 30};
  const clean = (bx, obs, padC = 6) => obs.every(o => { const bb = Array.isArray(o) ? unionBounds(o.map(q => ({x: q.x, y: q.y, w: 0, h: 0}))) : o; return bx.x + bx.w + padC <= bb.x || bb.x + bb.w + padC <= bx.x || bx.y + bx.h + padC <= bb.y || bb.y + bb.h + padC <= bx.y; });
  // (1) beside the seal, the usual sides; (2) any side and a wider reach; (3) a scan of the stage's free room nearest
  // the seal; (4) a scan of the whole box, clear of every text
  let mPos = placeChip({w: 2 * mR, h: 2 * mR}, {x: sealPt.x, y: sealPt.y, r: jr + 4}, {obstacles: obst2, bounds: stBounds, noLeader: true, order: ['rightHigh', 'leftHigh', 'aboveR', 'aboveL', 'above', 'right', 'left'], gaps: [6, 16, 30, 50, 80, 120, 170]})
    || placeChip({w: 2 * mR, h: 2 * mR}, {x: sealPt.x, y: sealPt.y, r: jr + 4}, {obstacles: obst2, bounds: stBounds, noLeader: true, order: ['rightHigh', 'leftHigh', 'aboveR', 'aboveL', 'above', 'right', 'left', 'rightLow', 'leftLow'], gaps: [6, 16, 30, 50, 80, 120, 170, 230, 300, 380]});
  if (mPos && !clean(mPos.box, texts)) mPos = null;
  const scan = (B0, obs) => {
    let best = null;
    for (let y = B0.y; y + 2 * mR <= B0.y + B0.h; y += mR / 3) for (let x = B0.x; x + 2 * mR <= B0.x + B0.w; x += mR / 3) {
      const bx = {x, y, w: 2 * mR, h: 2 * mR};
      if (!clean(bx, obs)) continue;
      const d = Math.hypot(x + mR - sealPt.x, y + mR - sealPt.y);
      if (!best || d < best.d) best = {d, x: x + mR, y, box: bx};
    }
    return best;
  };
  if (!mPos) mPos = scan(stBounds, [...obst2, ...texts]);
  if (!mPos) mPos = scan({x: MARGIN, y: 0, w: D.w - 2 * MARGIN, h: D.h}, [...obst2, ...texts, {x: stage.left, y: stage.beamY - 12, w: stage.right - stage.left, h: 24}]);
  const markerPlace = mPos ? 'clean' : 'least';
  if (!mPos) mPos = placeChip({w: 2 * mR, h: 2 * mR}, {x: sealPt.x, y: sealPt.y, r: jr + 4}, {obstacles: [...obst2, ...texts], bounds: stBounds, noLeader: true, leastBad: true})
    || {x: sealPt.x + jr + mR + 8, y: sealPt.y - jr - 2 * mR};
  const mC = {x: mPos.x, y: mPos.y + mR};
  const marker = changedMarker(ctx, {x: mC.x, y: mC.y, radius: mR, name: 'marker', opacity: 0});
  let mLabel = null;
  if (mlP && record) {
    const pm = at('ml');
    const c = chipG(ctx, p.contextLabels.marker, {x: pm.x + 2 * mlR + 10, y: pm.y, maxWidth: recW - 2 * mlR - 10, size, maxLines: 2, stroke: th.accent2});
    mLabel = {node: g({name: 'mlabel', opacity: 0}, changedMarker(ctx, {x: pm.x + mlR, y: pm.y + c.box.h / 2, radius: mlR}), c.node), box: {x: pm.x, y: pm.y, w: c.box.w + 2 * mlR + 10, h: c.box.h}};
  }
  const ext = unionBounds([{x: MARGIN, y: 0, w: full, h: 1}, {x: stage.left - 8, y: stage.beamY - 8, w: stage.right - stage.left + 16, h: stageBottom - stage.beamY + 8}, cap && cap.box, ...lg.rows.map(rw => rw.box), key && key.box, record && record.box, mLabel && mLabel.box, tag && tag.box]);
  return {markerPlace, objs, need, joints: S0.joints, jr, record, stage, copy, cap, lg, key, tag, tagCopy, newSeal, marker, mC, mR, mLabel, source, ext, H, size, side, F, stageBottom, colX, colW, regionW, PS, U, cfg};
}

/** The lens: destination in free room (over the dimmed legend column, or below the stage), >= Z_MIN and >= LENS_FRAC. */
function lensPhase(ctx, L) {
  const p = ctx.params, th = ctx.theme, D = ctx.design;
  const V = ctx.view;
  const S = Math.min(V.width, V.height) / Math.min(V.content.w / D.w, V.content.h / D.h);
  const FwD = V.width / Math.min(V.content.w / D.w, V.content.h / D.h); // the frame's width in design units
  const src = L.source; // the crop, in the context's REST coordinates
  const keyOn = ctx.show('key');
  const zCap = Math.max(Z_MIN, p.detailGeometry.zoom ?? 2.4);
  const annW = 330;
  const annProbe = keyOn ? [p.beforeValue, p.afterValue].map((v, i) => chipG(ctx, `${i ? ctx.t.after : ctx.t.before}: ${v}`, {x: 0, y: 0, maxWidth: annW, size: L.size, maxLines: 4}).box) : [];
  const annH = annProbe.length ? annProbe[0].h + annProbe[1].h + 30 : 0;
  const st = L.stage;
  const cb = {x: st.left - 8, y: st.beamY - 8, w: st.right - st.left + 16, h: L.stageBottom - st.beamY + 8};
  let dest, annAt = 'below', zRest = null, topAnn = null;
  let cam = {s: 1, tx: 0, ty: 0};
  let srcV = src; // the crop as seen while the lens is open (after the camera move)
  const shape = ctx.view.shape;
  if (!L.side && (shape === 'square' || shape === 'portrait')) {
    // STACKED: the context shrinks to a full-width band at the top (>= 0.47 of the FRAME width), the lens opens large
    // under it; square boxes put the Before/After notes beside the lens, tall boxes under it
    const s0 = Math.min(1, (0.455 * FwD + 2) / cb.w);
    cam = {s: s0, tx: (D.w - s0 * cb.w) / 2 - s0 * cb.x, ty: 4 - s0 * cb.y};
    annAt = shape === 'square' && keyOn ? 'right' : 'below';
    // square and tall boxes: the Before/After notes go in the top band BESIDE the context (the context moves to the left), so the
    // lens takes the whole width under them — context + lens span the box (LAW-0696 review, coverage)
    let bandH = s0 * cb.h;
    if (keyOn) {
      const aw = Math.min(annW + 90, D.w - 2 * MARGIN - s0 * cb.w - 24);
      if (aw >= 200) {
        const hs = [p.beforeValue, p.afterValue].map((v, i) => chipG(ctx, `${i ? ctx.t.after : ctx.t.before}: ${v}`, {x: 0, y: 0, maxWidth: aw, size: L.size, maxLines: 4}));
        if (!hs.some(c => c.fit.truncated || c.fit.broken)) {
          const hA = hs[0].box.h + hs[1].box.h + 8;
          annAt = 'top';
          topAnn = {aw, hA, x: D.w - MARGIN - aw};
          cam.tx = MARGIN - s0 * cb.x;
          // the band is as tall as the taller of the two; the context sits centred in it
          bandH = Math.max(bandH, hA);
          cam.ty = 4 + (bandH - s0 * cb.h) / 2 - s0 * cb.y;
          topAnn.y = 4 + (bandH - hA) / 2;
        }
      }
    }
    srcV = {x: s0 * src.x + cam.tx, y: s0 * src.y + cam.ty, w: s0 * src.w, h: s0 * src.h};
    const y0 = 4 + bandH + 12, y1 = D.h - 4;
    const wMax = D.w - 2 * MARGIN - (annAt === 'right' ? annW + 24 : 0);
    const hMax = y1 - y0 - (annAt === 'below' ? annH : 0);
    // (height-limited: the crop widens around the detail, over the stage, towards the room's shape — seals whole;
    // the widening that best keeps the window's smaller side >= 0.40 of the short side while context + lens span the
    // box wins)
    const tryCrop = f => {
      const crop = {...src};
      if (f > 0 && wMax / src.w > hMax / src.h) {
        const wantW = Math.min(src.w + f * (src.h * (wMax / hMax) - src.w), cb.w);
        crop.x = Math.max(cb.x, Math.min(cb.x + cb.w - wantW, src.x + src.w / 2 - wantW / 2));
        crop.w = wantW;
        // (and, once wider than the room's shape, taller too — upwards into the air under the beam, then down to the
        // floor; a widened crop takes any seal it meets in whole)
        for (let it = 0; it < 3; it++) {
          const wantH = crop.w * (hMax / wMax);
          if (wantH > crop.h) {
            const up = Math.max(0, Math.min(wantH - crop.h, crop.y - (st.beamY + 8)));
            crop.y -= up; crop.h += up;
            const down = Math.max(0, Math.min(wantH - crop.h, L.stageBottom - (crop.y + crop.h)));
            crop.h += down;
          }
          wholeSeals(crop, {...crop}, L.joints, L.jr, L.objs, L.need);
        }
      }
      if (f > 0 && wMax / src.w < hMax / src.h) {
        // (width-limited — tall boxes: the crop grows taller instead, over the stage, towards the room's shape)
        for (let it = 0; it < 3; it++) {
          const wantH = Math.min(src.h + f * (src.w * (hMax / wMax) - src.h), cb.h);
          if (wantH > crop.h) {
            const up = Math.max(0, Math.min((wantH - crop.h) / 2, crop.y - (st.beamY + 8)));
            crop.y -= up; crop.h += up;
            const down = Math.max(0, Math.min(wantH - crop.h, L.stageBottom - (crop.y + crop.h)));
            crop.h += down;
            const up2 = Math.max(0, Math.min(wantH - crop.h, crop.y - (st.beamY + 8)));
            crop.y -= up2; crop.h += up2;
          }
          wholeSeals(crop, {...crop}, L.joints, L.jr, L.objs, L.need);
        }
      }
      const z0 = Math.min(wMax / crop.w, hMax / crop.h);
      const ms = Math.min(crop.w * z0, crop.h * z0) / S;
      const uw = (Math.max(crop.w * z0 + (annAt === 'right' ? annW + 24 : 0), s0 * cb.w + (topAnn ? 24 + topAnn.aw : 0))) / (D.w - 2 * MARGIN);
      const uh = (crop.h * z0) / hMax;
      return {crop, z0, score: Math.min(ms / 0.4, uw / 0.88, z0 / 1.55, 1) + 0.05 * Math.min(uh, uw)};
    };
    const best = [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0].map(tryCrop).sort((a, b) => b.score - a.score)[0];
    const crop = best.crop;
    srcV = {x: s0 * crop.x + cam.tx, y: s0 * crop.y + cam.ty, w: s0 * crop.w, h: s0 * crop.h};
    const z = best.z0; // (relative to the REST context)
    const w = crop.w * z, hh = crop.h * z;
    const x = annAt === 'right' ? MARGIN + (D.w - 2 * MARGIN - annW - 24 - w) / 2 : (D.w - w) / 2;
    dest = {x, y: y0 + (hMax - hh) / 2, w, h: hh};
    zRest = z;
  } else if (!L.side) {
    // wide boxes with labels hidden: the context shifts into the left part (>= 0.47 of the frame width), the lens opens
    // on the right, as large as the room allows
    const s0 = Math.min(1, (0.47 * FwD + 2) / cb.w);
    // (the context rises to the top and the lens sits low: together they span the box's height)
    cam = {s: s0, tx: MARGIN - s0 * cb.x, ty: 4 - s0 * cb.y};
    srcV = {x: s0 * src.x + cam.tx, y: s0 * src.y + cam.ty, w: s0 * src.w, h: s0 * src.h};
    const x0 = MARGIN + s0 * cb.w + 24, x1 = D.w - MARGIN;
    const z = Math.min((x1 - x0) / src.w, (D.h - 8) / src.h);
    const w = src.w * z, hh = src.h * z;
    dest = {x: x0 + (x1 - x0 - w) / 2, y: D.h - 4 - hh, w, h: hh};
  } else {
    // wide boxes: over the dimmed legend column, the stage stays in place
    const x0 = Math.max(src.x + src.w + 24, L.colX - 10), x1 = D.w - MARGIN;
    const z = Math.min(Math.max(zCap, 2), (x1 - x0) / src.w, (D.h - 16 - annH) / src.h);
    const w = src.w * z, hh = src.h * z;
    dest = {x: x1 - w, y: Math.max(8, Math.min(D.h - 8 - hh - annH, src.y + src.h / 2 - hh / 2)), w, h: hh};
  }
  const content = g({transform: T(r(cam.tx, 2), r(cam.ty, 2), 0, r(cam.s, 5))}, L.copy.back, L.copy.main, g({name: 'lzs-swg'}, L.newSeal('lzs')), L.tagCopy && L.tagCopy.node);
  const L2 = lens(ctx, {name: 'lz', source: srcV, dest, content, color: th.accent2});
  // annotations: "Before: …" (struck later) and "After: …", under the lens or beside it
  let ann = null;
  if (keyOn) {
    const mw = annAt === 'top' ? topAnn.aw : annAt === 'right' ? annW : Math.max(dest.w, 300);
    const bx = annAt === 'top' ? topAnn.x + topAnn.aw / 2 : annAt === 'right' ? dest.x + dest.w + 24 + annW / 2 : dest.x + dest.w / 2;
    const by = annAt === 'top' ? topAnn.y : annAt === 'right' ? dest.y + dest.h / 2 - (annH - 30) / 2 - 4 : dest.y + dest.h + 12;
    const b = chipG(ctx, `${ctx.t.before}: ${p.beforeValue}`, {x: bx, y: by, anchor: 'middle', maxWidth: mw, size: L.size, maxLines: 4, name: 'ann-before', opacity: 0});
    const a = chipG(ctx, `${ctx.t.after}: ${p.afterValue}`, {x: bx, y: b.box.y + b.box.h + 8, anchor: 'middle', maxWidth: mw, size: L.size, maxLines: 4, name: 'ann-after', opacity: 0, fill: th.accent2Soft, stroke: th.accent2});
    const strikes = b.fit.lines.map((ln, i) => {
      const lw = ctx.measure(ln.replace(/ /g, ' '), b.fit.size, 600, 'sans');
      const yy = b.box.y + L.size * 0.38 + i * b.fit.lineHeight + b.fit.size * 0.5;
      return {lw: lw + 8, node: h('line', {name: `ann-strike${i}`, x1: r(b.box.cx - lw / 2 - 4), x2: r(b.box.cx + lw / 2 + 4), y1: r(yy), y2: r(yy), stroke: th.ink, 'stroke-width': 3, 'stroke-dasharray': `${r(lw + 8)} ${r(lw + 20)}`, 'stroke-dashoffset': r(lw + 8)})};
    });
    ann = {node: g({name: 'ann'}, b.node, g(null, strikes.map(s0 => s0.node)), a.node), strikes, box: unionBounds([b.box, a.box])};
  }
  const over = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
  const cover = unionBounds([{x: dest.x - 12, y: dest.y - 12, w: dest.w + 24, h: dest.h + 24}, ann && ann.box]);
  const camMoves = cam.s !== 1;
  const ctxBox = camMoves ? {x: cam.tx + cam.s * cb.x - 12, y: cam.ty + cam.s * cb.y - 12, w: cam.s * cb.w + 24, h: cam.s * cb.h + 24} : null;
  const underLens = L.lg.rows.filter(rw => over(rw.box, cover) || (ctxBox && over(rw.box, ctxBox))).map(rw => rw.name);
  const keyUnder = camMoves || (L.key ? over(L.key.box, cover) : false);
  const capUnder = camMoves || (L.cap ? over(L.cap.box, cover) : false);
  const inBox = q => q.x >= -1 && q.y >= -1 && q.x + q.w <= D.w + 1 && q.y + q.h <= D.h + 1;
  // magnification against the context at REST, and the window's smaller side against the frame's short side
  const zoom = zRest ?? dest.w / src.w;
  const minSide = Math.min(dest.w, dest.h) / S;
  const ok = zoom >= 1.5 - 1e-6 && minSide >= 0.4 - 1e-6 && inBox(dest) && (!ann || inBox(ann.box)) && (!ctxBox || !over(ctxBox, dest));
  return {L2, dest, src, srcV, zoom, minSide, frac: dest.w / S, ann, underLens, keyUnder, capUnder, ok, cam, camMoves, ctxBox};
}

/** Last resort (nothing fits at the text floor): compose in a taller virtual box; the result is scaled into the real one (k < 1, reported). */
function fallbackCompose(ctx, base, cfgs, ok) {
  for (let f = 1; f <= 3.01; f += 0.1) {
    const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
    for (const cfg of cfgs) { const X = compose(c2, base, cfg); if (ok(X)) { X.ctx2 = c2; return X; } }
  }
  return null;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveIE(p);
    const lossCount = Math.min(2, p.losses.length);
    const fj = p.focusTarget === 'link-in' ? M.k - 1 : M.k;
    const toDisputed = p.substitution !== 'to-proposed';
    // the stage is built with the BEFORE status of the inspected link; the after-state seal is drawn over it
    const Mb = {...M, links: M.links.map((l, j) => (j === fj ? {...l, status: toDisputed ? 'proposed' : 'disputed'} : l))};
    const base = {M, Mb, SH, lossCount, fj, toDisputed, take: {start: 0.3, d: 0.04, swing: 0.05}};
    const D = ctx.design;
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 1) out.push(s); out.push(b); return out; };
    const wraps = [null, ...(ctx.view.shape === 'portrait' ? wrapChoices(M.N, M.k) : [])];
    const cfgsFor = (mode, size) => (mode === 'side'
      ? [0.3, 0.34, 0.38].flatMap(colF => wraps.flatMap(wrapM => [{mode, size, colF, wrapM}, {mode, size, colF, wrapM, tagK: 10}]))
      : [2, 3].flatMap(cols => wraps.flatMap(wrapM => [{mode, size, cols, wrapM}, {mode, size, cols, wrapM, maxLines: 5, gap: 8}, {mode, size, cols, wrapM, maxLines: 5, gap: 8, tagK: 18}])));
    let L = null;
    const why = [];
    search: for (const sizes of [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)]) {
      const cands = [];
      for (const size of sizes) for (const mode of SH.modes) for (const cfg of cfgsFor(mode, size)) {
        const X = compose(ctx, {...base}, {...cfg, dry: true});
        if (X.cfg) cands.push(X); else why.push(`${mode}${cfg.cols ?? cfg.colF}${cfg.wrapM ?? ""}@${size}:${X.bad}${X.H ? Math.round(X.H) : ""}`);
      }
      const maxSize = cands.length ? Math.max(...cands.map(c => c.size)) : 0;
      // (tall boxes: the largest stage AREA — a two-level stage fills the height; elsewhere the tallest tiles)
      const areaOf = c => { const gm = ieGeom(M.N, c.H, lossCount, c.cfg.wrapM ?? null); return gm.width * (gm.above + gm.below); };
      cands.sort((a, b) => (b.size >= maxSize - 3 ? 1 : 0) - (a.size >= maxSize - 3 ? 1 : 0) || (ctx.view.shape === 'portrait' ? areaOf(b) - areaOf(a) : b.H - a.H) || b.size - a.size);
      for (const c of cands) {
        const X = compose(ctx, base, c.cfg);
        if (X.bad) continue;
        X.lens = lensPhase(ctx, X);
        if (X.lens.ok) { L = X; break search; }
        if (!L) L = X;
      }
    }
    if (!L) L = fallbackCompose(ctx, base, [{mode: SH.modes[0], size: SH.minSize, colF: 0.38, cols: 3, maxLines: 6, gap: 6}], X => Boolean(X.stage));
    // DOM-less contract (AUTHORING 2026-09-27): never throw from layout. Nothing fits even in a taller box (only seen
    // with the fallback text estimator, no DOM): compose in a box enlarged in BOTH directions (the whole picture is
    // scaled down into the real one), flagged in semantic.problems
    let noFit = false;
    if (!L) {
      noFit = true;
      const cfgs = SH.modes.flatMap(mode => [13, 24, 36].flatMap(tagK => [{mode, size: SH.minSize, colF: 0.38, cols: 3, maxLines: 6, gap: 6, tagK}, {mode, size: SH.minSize, cols: 2, maxLines: 6, gap: 6, tagK}]));
      for (let f = 1.25; f <= 6.01 && !L; f += 0.25) {
        const c2 = {...ctx, design: {w: ctx.design.w * f, h: ctx.design.h * f}};
        for (const cfg of cfgs) { const X = compose(c2, base, cfg); if (X.stage) { X.ctx2 = c2; L = X; break; } }
      }
      if (!L) {
        const bads = [];
        for (let f = 1.25; f <= 6.01; f += 1) for (const cfg of cfgs) bads.push(`${f}:${compose({...ctx, design: {w: ctx.design.w * f, h: ctx.design.h * f}}, base, cfg).bad}`);
        throw new Error(`${ID}: no composition at all (${bads.slice(0, 12).join(' | ')})`);
      }
    }
    L.fallback = !L.lens;
    if (!L.lens) L.lens = lensPhase(L.ctx2 || ctx, L);
    const Dv = (L.ctx2 || ctx).design;
    L.k = Math.min(1, ctx.design.h / Dv.h, ctx.design.w / Dv.w);
    L.dx = (ctx.design.w - Dv.w * L.k) / 2;
    if (noFit || L.fallback || !L.lens.ok) L.problems = [...(noFit ? ['no-layout-fits'] : []), ...(L.fallback ? ['fallback-scale'] : []), ...(L.lens.ok ? [] : ['lens-geometry'])];
    L.dy = 0;
    L.M = M; L.fj = fj; L.why = [...new Set(why.filter(w0 => /@17:/.test(w0)))];
    return L;
  },
  build(ctx, L) {
    return g({transform: L.k < 1 ? T(L.dx, L.dy, 0, L.k) : null},
      L.cap && L.cap.node,
      g({name: 'cam'}, g({name: 'ctx'}, L.stage.back, L.stage.main, g({name: 'st-swg'}, L.newSeal('st')), L.tag && L.tag.node, L.marker)),
      L.lg.rows.map(rw => rw.node),
      L.key && L.key.node,
      L.record && L.record.node,
      L.mLabel && L.mLabel.node,
      g({name: 'lz-wrap', 'data-occludes': 1}, L.lens.L2.node),
      L.lens.ann && L.lens.ann.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const a = L.stage.pose('with', L.U, L.PS);
    const c = L.copy.pose('with', L.U, L.PS);
    Object.assign(nodes, a.nodes, c.nodes);
    const fj = L.fj;
    // seal swap (scene and copy): old seal out, then the new seal pops in at the same place
    const so = seg(u, ...W.sealOut), si = seg(u, ...W.sealIn);
    for (const pre of ['st', 'lzs']) {
      const jn = nodes[`${pre}-joint${fj}`];
      const baseOp = jn ? jn.opacity : 0;
      nodes[`${pre}-joint${fj}`] = {...jn, opacity: r(baseOp * (1 - so), 3)};
      nodes[`${pre}-sw`] = {transform: jn ? jn.transform : 'translate(0 0)', opacity: r(baseOp * si, 3)};
    }
    // lens
    const LZ = L.lens;
    // (out-cubic growth and in-cubic shrink: the window spends little time small, so it is never a bare card for long)
    const open = ease.outCubic(seg(u, ...W.open)) * (1 - ease.inCubic(seg(u, ...W.close)));
    // the lens grows IN PLACE at its destination (it never slides over the context); the enlarged copy fades in only
    // once its smallest text reaches the floor (and from ~40 % open), so there is no double image and no tiny text
    Object.assign(nodes, LZ.L2.frame(1));
    const f = 0.3 + 0.7 * open;
    const Dd = LZ.dest, Sv = LZ.srcV;
    // (opening: it grows from its centre; closing: it shrinks towards its bottom edge, clear of the regrowing context)
    const closing = u >= W.close[0];
    const R = {x: Dd.x + Dd.w * (1 - f) / 2, y: closing && LZ.camMoves ? Dd.y + Dd.h * (1 - f) : Dd.y + Dd.h * (1 - f) / 2, w: Dd.w * f, h: Dd.h * f};
    const kz = R.w / Sv.w, kzy = R.h / Sv.h;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    nodes['lz-cliprect'] = rect;
    nodes['lz-bg'] = rect;
    nodes['lz-border'] = rect;
    nodes['lz-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    const winOp = open > 0.001 ? 1 : 0;
    nodes['lz-win'] = {opacity: winOp};
    const minText = Math.min(L.size, 1.2 * Math.max(ctx.view.shape === 'landscape' ? 23 : 30, L.H * 0.075));
    const effT = LZ.cam.s * kz * minText;
    const copyOp = winOp ? r(clamp((effT - 16.5) / 3) * clamp((open - 0.4) / 0.25), 3) : 0;
    nodes['lz-content'] = {transform: `${T(R.x - Sv.x * kz, R.y - Sv.y * kzy)} scale(${r(kz, 4)} ${r(kzy, 4)})`, opacity: copyOp};
    nodes['lz-src'] = {opacity: winOp};
    for (const c0 of ['lz-coneA', 'lz-coneB']) nodes[c0] = {...nodes[c0], opacity: 0};
    const ctxOp = r(1 - DIM * open, 3);
    nodes.ctx = {opacity: ctxOp};
    // square: the context shrinks into the left half before the lens opens, and grows back after it closes
    const camQ = LZ.camMoves ? ease.inOutCubic(seg(u, ...W.lgOut)) * (1 - ease.inOutCubic(seg(u, ...W.lgIn))) : 0;
    const cm = LZ.cam;
    nodes.cam = {transform: T(r(cm.tx * camQ, 2), r(cm.ty * camQ, 2), 0, r(1 + (cm.s - 1) * camQ, 5))};
    // ONE copy of the changed datum at a time: the context tag is hidden while the lens holds its copy
    const tagHide = Math.min(1 - seg(u, ...W.ctxTagOut) + seg(u, ...W.ctxTagIn), LZ.camMoves ? 1 - clamp(camQ * 4) : 1);
    // text: dimmed in place; what the open lens lies over steps out (and back after it closes)
    // (the texts come back only once the stage has regrown: no caption under a moving beam)
    const gone = 1 - clamp(seg(u, ...W.textOut) * (1 - seg(u, ...W.textIn)));
    Object.assign(nodes, legendFrame(L.lg.rows, rw => seg(u, ...W.legend) * ctxOp * (LZ.underLens.includes(rw.name) ? gone : 1)));
    if (L.cap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.caption) * ctxOp * (LZ.capUnder ? gone : 1), 3)};
    // (the key is part of the context from the start: it steps out with the legend and comes back with it)
    if (L.key) nodes.key = {opacity: r(seg(u, ...W.legend) * ctxOp * (LZ.keyUnder ? gone : 1), 3)};
    if (L.record) nodes.record = {opacity: r(seg(u, ...W.key), 3)};
    // tag (scene and copy)
    const tagIn = seg(u, ...W.tag);
    if (L.tag) {
      Object.assign(nodes, L.tag.frame(seg(u, ...W.tagOut), seg(u, ...W.tagIn)));
      nodes['tg-tag'] = {opacity: r(tagIn * tagHide, 3)};
      Object.assign(nodes, L.tagCopy.frame(seg(u, ...W.tagOut), seg(u, ...W.tagIn)));
      // the copy's tag is shown only once the window has grown it to >= 16.5 px (it starts at the camera's scale)
      const eff = LZ.cam.s * (1 + (LZ.zoom - 1) * open) * L.size;
      void eff;
    }
    // annotations under the lens
    if (LZ.ann) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (open >= 0.98 ? 1 : 0) + 0, 3)};
      const sp = seg(u, ...W.strike);
      LZ.ann.strikes.forEach((s0, i) => { nodes[`ann-strike${i}`] = {'stroke-dashoffset': r(s0.lw * (1 - sp)), opacity: open >= 0.98 ? 1 : 0}; });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after) * (open >= 0.98 ? 1 : 0), 3)};
    }
    const mp = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mp, 3)};
    if (L.mLabel) nodes.mlabel = {opacity: r(seg(u, ...W.markerLabel), 3)};

    const inside = (b, R) => b.x >= R.x - 0.5 && b.y >= R.y - 0.5 && b.x + b.w <= R.x + R.w + 0.5 && b.y + b.h <= R.y + R.h + 0.5;
    const over = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
    const S = a.semantic;
    const datum = u < W.strike[0] ? 'before' : u < W.after[0] ? 'changing' : 'after';
    const seal = si >= 1 ? 'after' : so > 0 ? 'changing' : 'before';
    const jr = Math.max(ctx.view.shape === 'landscape' ? 23 : 30, L.H * 0.075);
    const sp0 = S.joints[fj];
    const V = ctx.view, D = ctx.design;
    const Sd = Math.min(V.width, V.height) / Math.min(V.content.w / D.w, V.content.h / D.h);
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      focusTarget: p.focusTarget, substitution: p.substitution, link: fj,
      lensOpen: r(open, 3), copyShown: copyOp, zoom: r(LZ.zoom, 3), lensFrac: r(LZ.frac, 3), lensMinSide: r(LZ.minSide, 3), lensOk: LZ.ok,
      ctxTag: L.tag ? r(seg(u, ...W.tag) * tagHide, 3) : 0,
      lensShare: r(Math.min(LZ.dest.w, LZ.dest.h) / (0.3 * Sd), 3),
      contextShare: r(LZ.camMoves ? ((L.stage.right - L.stage.left + 16) * (1 + (LZ.cam.s - 1) * camQ)) / D.w : (L.stage.right - L.stage.left + 16) / D.w, 3),
      camera: r(camQ, 3),
      safe: {x: r(ctx.view.content.x / ctx.view.width, 4), y: r(ctx.view.content.y / ctx.view.height, 4), w: r(ctx.view.content.w / ctx.view.width, 4), h: r(ctx.view.content.h / ctx.view.height, 4)},
      datum, seal, strike: r(seg(u, ...W.strike), 3),
      tagValue: seg(u, ...W.tagIn) >= 1 ? 'after' : seg(u, ...W.tagOut) > 0 ? 'changing' : 'before',
      sourceHoldsDetail: Boolean(sp0) && inside({x: sp0.x - jr, y: sp0.y - jr, w: 2 * jr, h: 2 * jr}, LZ.src) && (!L.tag || inside(L.tag.box, LZ.src)),
      lensClearOfSource: !over(LZ.srcV, LZ.dest),
      mirror: JSON.stringify(a.nodes[`st-tile${L.M.k}`]) === JSON.stringify(c.nodes[`lzs-tile${L.M.k}`]) && JSON.stringify(nodes[`st-joint${fj}`]) === JSON.stringify({...nodes[`lzs-joint${fj}`]}),
      markerVisible: mp >= 1,
      markerClear: !a.polys.some(poly => poly.some((q, i) => {
        const q2 = poly[(i + 1) % poly.length];
        const dx = q2.x - q.x, dy = q2.y - q.y, L2 = dx * dx + dy * dy || 1;
        const t0 = clamp(((L.mC.x - q.x) * dx + (L.mC.y - q.y) * dy) / L2);
        return Math.hypot(q.x + t0 * dx - L.mC.x, q.y + t0 * dy - L.mC.y) < L.mR;
      })),
      ...(L.problems ? {problems: L.problems} : {}),
      markerPlace: L.markerPlace, objs: L.objs,
      angles: S.angles, lossState: S.lossState, cracked: S.cracked, joints: S.joints,
      layout: {H: r(L.H), size: r(L.size), side: L.side, why: L.why, k: r(L.k, 3), fallback: Boolean(L.ctx2), src: LZ.srcV, rest: LZ.src, dest: LZ.dest, colX: L.colX, tag: L.tag && L.tag.box, xp: a.polys[L.M.k], seal: S.joints[fj]},
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
    slug: 'causation-04-inspect',
    title: 'Intervening event — inspecting the status of the later event’s link',
    titleEs: 'Evento interviniente — Inspección y cambio de un dato',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Evento interviniente',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The model stage after the later event has entered and the sequence has run through it as supplied; a lens enlarges the later event with its two link seals and a status tag (a real copy posed from the scene). One datum is substituted — the status of the inspected link (proposed → disputed, or the reverse): the seal changes, the old value stays readable, struck. The lens closes onto the changed seal with a neutral Δ marker. Nothing is decided; no legal conclusion.',
    tags: ['causation', 'intervening event', 'inspect', 'lens', 'link status', 'changed datum', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/evento-interviniente.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: IE_STRINGS,
  scene,
});
