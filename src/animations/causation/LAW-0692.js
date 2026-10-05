/**
 * LAW-0692 — Causas concurrentes · inspect
 *
 * Storyboard (the state the two routes produced; one detail lens):
 *  0.00–0.20 build       The context: both racks with every link seal made,
 *                        both marbles resting against the vase from opposite
 *                        sides, two separate cracks — the state produced by the
 *                        two routes as supplied. A status tag hangs under the
 *                        seal of the inspected link (default: route B's link
 *                        into the loss): "Link B3 → loss: <before value>".
 *                        Context caption, legend and a record card appear.
 *  0.20–0.45 isolate     A lens opens beside the arrival zone — a real
 *                        enlarged copy of the stage and the tag, drawn in the
 *                        same coordinates and posed from the same state every
 *                        frame — while the context dims. The copy fades in once
 *                        the lens has left its source (no double image, no
 *                        long blank card). Under it: "Before: <before value>".
 *  0.45–0.75 substitute  The before value is struck (every line). Then only the
 *                        dependent state changes, in the scene and so in the
 *                        lens: the link seal turns from linked rings to a
 *                        dashed "disputed" ring (or back), the tag's old value
 *                        lifts away and the new one fades in; "After: <after
 *                        value>" stays still ≥ 400 ms; the record card in the
 *                        context turns over (old value kept, struck).
 *  0.75–1.00 return      The lens closes onto its source; the context keeps
 *                        the changed seal, a neutral Δ marker with its label,
 *                        the record card and the key "As supplied · routes not
 *                        added up · no conclusion drawn". Nothing about the
 *                        marbles, the cracks or the other route changes, and no
 *                        validity, responsibility or outcome is inferred.
 *                        Seeking back restores the old datum exactly.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0692
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
import {
  ccFields, CC_STRINGS, ROUTES, resolveRoutes, concurrentStage, runMetrics, rackNeed, linkName,
  legendColumns, legendFrame, routeItems, lossItems, flowRows, chipG, balancedG, calloutG, FLOOR_T,
} from './kits/causas-concurrentes.js';

const ID = 'LAW-0692';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  legend: [0.02, 0.12], caption: [0, 0.08], record: [0.06, 0.14],
  lgOut: [0.2, 0.222], shift: [0.222, 0.25], open: [0.24, 0.33], copyIn: [0.275, 0.32], before: [0.33, 0.37],
  strike: [0.45, 0.49], swap: [0.52, 0.58], tagOut: [0.52, 0.555], tagIn: [0.56, 0.595], after: [0.58, 0.62], ctxTurn: [0.64, 0.7],
  underOut: [0.215, 0.24], underIn: [0.84, 0.87], close: [0.76, 0.84], unshift: [0.83, 0.86], lgIn: [0.85, 0.89], marker: [0.86, 0.89], markerLabel: [0.87, 0.9], key: [0.87, 0.9],
};
const DIM = 0.6;
const TARGETS = ['last-link-b', 'last-link-a'];

const sceneSchema = {
  ...ccFields,
  ...inspectFields(TARGETS),
  substitution: oneOf('Dependent state of the substituted datum: to-disputed = the link seal turns into a dashed "disputed" ring; to-proposed = the reverse', ['to-disputed', 'to-proposed']),
};

const defaultParams = {
  events: {
    a: [
      {label: 'Kitchen tap left running', time: 'T0'},
      {label: 'Sink overflows', time: 'T+4 min'},
      {label: 'Water spreads to the shelf', time: 'T+9 min'},
    ],
    b: [
      {label: 'Roof gutter blocked', time: 'T0'},
      {label: 'Rain seeps through the wall', time: 'T+6 min'},
      {label: 'Water drips onto the shelf', time: 'T+9 min'},
    ],
  },
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase on the shelf cracked'}],
  routeLabels: {a: 'Cause A', b: 'Cause B'},
  focusTarget: 'last-link-b',
  substitution: 'to-disputed',
  beforeValue: 'proposed',
  afterValue: 'disputed (as supplied)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'State produced by both routes, as supplied', marker: 'Datum changed'},
};

const SHAPES = {
  landscape: {size: 24, baseMin: 20, minSize: 17, modes: ['below', 'side', 'col']},
  square: {size: 24, baseMin: 20, minSize: 17, modes: ['below', 'side', 'col']},
  portrait: {size: 25, baseMin: 20.5, minSize: 17, modes: ['below']},
};
const MARGIN = 10;

function fitVi(w, h, nMax, contactK) {
  const ok = V => {
    const m = runMetrics(V);
    const rackW = (w - 12 - m.vw - 2 * 2.4 * m.R) / 2;
    const span = rackW - 10 - (2 * m.R + 14) - 6;
    if (span < Math.max(6 * m.R, 100)) return false;
    return rackNeed(nMax, span, V, contactK) + FLOOR_T <= h && V <= h * 0.42;
  };
  let lo = 55, hi = 420;
  if (!ok(lo)) return null;
  if (ok(hi)) return hi;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  return lo;
}

/** The status tag under the inspected seal (one per stage copy). Old value lifts out, new value fades in. */
function statusTag(ctx, {prefix, head, before, after, x, y, dir, size, maxW}) {
  const th = ctx.theme;
  const mk = (txt, nm, o2 = {}) => chipG(ctx, `${head}: ${txt}`, {x: 0, y: 0, maxWidth: balancedG(ctx, `${head}: ${txt}`, {maxWidth: maxW, size, maxLines: 5}), size, maxLines: 5, name: nm, ...o2});
  const a0 = mk(before, 'p'), b0 = mk(after, 'p');
  const place = c0 => (dir > 0 ? x : x - c0.box.w);
  const A = chipG(ctx, `${head}: ${before}`, {x: place(a0), y, maxWidth: balancedG(ctx, `${head}: ${before}`, {maxWidth: maxW, size, maxLines: 5}), size, maxLines: 5, name: `${prefix}-tagold`, fill: th.card, stroke: th.inkSoft});
  const B = chipG(ctx, `${head}: ${after}`, {x: place(b0), y, maxWidth: balancedG(ctx, `${head}: ${after}`, {maxWidth: maxW, size, maxLines: 5}), size, maxLines: 5, name: `${prefix}-tagnew`, fill: th.accent2Soft, stroke: th.accent2, opacity: 0});
  const lead = h('path', {d: `M${r(x)} ${r(y - 12)}V${r(y)}`, stroke: th.inkSoft, 'stroke-width': 2.5});
  const node = g({name: `${prefix}-tag`}, lead, g({name: `${prefix}-tagoldg`}, A.node), B.node);
  const box = unionBounds([A.box, B.box, {x: x - 2, y: y - 12, w: 4, h: 12}]);
  const frame = (outP, inP) => ({
    [`${prefix}-tagoldg`]: {opacity: r(1 - outP, 3), transform: `translate(0 ${r(-14 * ease.inCubic(outP))})`},
    [`${prefix}-tagnew`]: {opacity: r(inP, 3)},
  });
  return {node, box, frame, oldBox: A.box, newBox: B.box};
}

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = {w: ctx.design.w, h: cfg.DH ?? ctx.design.h};
  const {C, focus} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const size = cfg.size;
  const side = cfg.mode === 'col' || (cfg.mode === 'side' && keyOn);
  const nMax = Math.max(C.routes.a.n, C.routes.b.n);
  const fk = focus.k, fi = focus.i;
  const lname = linkName(t, C.routes[fk], fi);

  // ---- caption + legend + band (record card, loss, key)
  const items = k => (keyOn ? routeItems(ctx, C, k, {head: `${t.route} ${k.toUpperCase()} · ${C.routes[k].name}`}) : []);
  let legW = 0, stageX = MARGIN, stageW = D.w - 2 * MARGIN;
  let lg = {rows: [], bottom: 0};
  if (cfg.mode === 'col') {
    // square: the stage on the left, both route legends stacked in a right column (the lens later opens there)
    legW = cfg.legW;
    stageW = D.w - 2 * MARGIN - legW - 24;
    // labels hidden: no legend column, so the context rests centred and slides aside when the lens opens
    stageX = keyOn ? MARGIN : (D.w - stageW) / 2;
    const lx = D.w - MARGIN - legW;
    const gap = cfg.lgGap ?? 9;
    if (keyOn) {
      const la = legendColumns(ctx, {cols: [{x: lx, y: 0, w: legW, items: items('a')}], size, maxLines: 5, gap, prefix: 'lgq'});
      lg = legendColumns(ctx, {cols: ROUTES.map((k, i) => ({x: lx, y: i ? la.bottom + 2 * gap : 0, w: legW, items: items(k)})), size, maxLines: 5, gap, prefix: 'lg'});
      if (lg.bottom > D.h || lg.truncated || la.truncated) return {bad: 'legend', over: lg.bottom - D.h + (lg.truncated ? 10000 : 0)};
    }
  } else if (side) {
    legW = cfg.legW;
    stageX = MARGIN + legW + 18;
    stageW = D.w - 2 * stageX;
    lg = legendColumns(ctx, {cols: ROUTES.map((k, i) => ({x: i ? D.w - MARGIN - legW : MARGIN, y: 0, w: legW, items: items(k)})), size, maxLines: 5, gap: 9, prefix: 'lg'});
    if (lg.bottom > D.h || lg.truncated) return {bad: 'legend'};
  }
  const capProbe = allOn ? chipG(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 0, y: 0, maxWidth: stageW, size, maxLines: 2}) : null;
  const capH = capProbe ? capProbe.box.h + 12 : 0;
  // record card: "<link> · status" + old value (struck later) + new value
  const recW = Math.min(stageW, 640);
  const recHead = keyOn ? chipG(ctx, `${lname} · ${t.status}`, {x: 0, y: 0, maxWidth: recW, size, maxLines: 2}) : null;
  const recOld = keyOn ? chipG(ctx, p.beforeValue, {x: 0, y: 0, maxWidth: recW * 0.48, size, maxLines: 5}) : null;
  const recNew = keyOn ? chipG(ctx, p.afterValue, {x: 0, y: 0, maxWidth: recW * 0.48, size, maxLines: 5}) : null;
  const bandItems = [];
  if (keyOn) {
    bandItems.push({key: 'record', kind: 'record', w: Math.max(recHead.box.w, recOld.box.w + 16 + recNew.box.w), h: recHead.box.h + 8 + Math.max(recOld.box.h, recNew.box.h)});
    lossItems(ctx, C).forEach(it => { const b = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: balancedG(ctx, it.text, {maxWidth: Math.min(stageW, 600), size, maxLines: 4}), size, maxLines: 4}).box; bandItems.push({...it, w: b.w, h: b.h}); });
    const kb = chipG(ctx, t.key, {x: 0, y: 0, maxWidth: balancedG(ctx, t.key, {maxWidth: Math.min(stageW, 520), size, maxLines: 5}), size, maxLines: 5}).box;
    bandItems.push({key: 'key', kind: 'key', text: t.key, w: kb.w, h: kb.h});
  }
  const bandProbe = flowRows(bandItems, {x: stageX, y: 0, w: stageW, gap: 20, rowGap: 10});
  const bandH = bandItems.length ? bandProbe.bottom + 14 : 0;
  let legH = 0, cols0 = null;
  if (!side && keyOn) {
    const colW = (D.w - 2 * MARGIN - 30) / 2;
    cols0 = ROUTES.map((k, i) => ({x: MARGIN + i * (colW + 30), y: 0, w: colW, items: items(k)}));
    const lp = legendColumns(ctx, {cols: cols0, size, maxLines: cfg.maxLines ?? 3, gap: 8, prefix: 'lgp'});
    if (lp.truncated) return {bad: 'cut'};
    legH = lp.bottom + 14;
  }
  const stageTop = capH;
  // below-mode: keep room under the stage for a real lens (>= 36 % of the frame's short side) plus its notes;
  // the legend and band under it fade while the lens is open
  const vsc = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
  const minLens0 = (0.36 * Math.min(ctx.view.width, ctx.view.height)) / vsc;
  const annH0 = keyOn ? [p.beforeValue, p.afterValue].map((tx, i) => chipG(ctx, `${i ? t.after : t.before}: ${tx}`, {x: 0, y: 0, maxWidth: Math.min(560, D.w * 0.46), size, maxLines: 5}).box.h).reduce((a2, b2) => a2 + b2, 0) + 22 : 0;
  const stageH = cfg.tallRest ? D.h - capH - 6 : side ? D.h - capH - bandH - legH : (cfg.stageK ?? 1) * Math.min(D.h - capH - bandH - legH, D.h - capH - (minLens0 + annH0 + 40));
  if (stageH < 200) return {bad: 'stage'};
  const V = fitVi(stageW, stageH, nMax, cfg.contactK);
  if (!V) return {bad: 'V'};
  // the tag under the inspected seal must fit between the last plank and the floor
  if (cfg.dry) return {V, cfg: {...cfg, dry: false}};

  const box = {x: stageX, y: stageTop, w: stageW, h: stageH};
  const swapLink = {k: fk, i: fi, toDisputed: base.toDisputed};
  const mkStage = prefix => concurrentStage(ctx, {prefix, box, V, C, swapLink, fitTop: !cfg.tallRest, contactK: cfg.contactK});
  const stage = mkStage('st');
  const copy = mkStage('lzs');
  // tag geometry: under the inspected seal, extending outward (away from the vase)
  const jp = stage.joints[fk][fi];
  const dir = stage.racks[fk].s > 0 ? -1 : 1;
  const tagY = jp.y + Math.max(11, stage.R * 0.72) + 16;
  const tagMaxW = cfg.tagW ?? Math.max(180, Math.min(stage.rackBox(fk).w - 20, 420));
  const tagX = jp.x;
  // the tag carries the short link name ("B3 → loss"); the full name is on the record card
  const shortName = lname.replace(`${t.link} `, '');
  const mkTag = prefix => (keyOn ? statusTag(ctx, {prefix, head: shortName, before: p.beforeValue, after: p.afterValue, x: tagX, y: tagY, dir, size, maxW: tagMaxW}) : null);
  const tag = mkTag('st');
  // the tag must hang between the last plank and the floor (never over the band below)
  if (tag && tag.box.y + tag.box.h > stage.F - 4 && !cfg.forceLens) return {bad: 'tag', over: tag.box.y + tag.box.h - stage.F + 4};
  const tagCopy = mkTag('lzs');

  // ---- lens source: WHOLE objects only — the vase with its plinth, both arriving marbles and their last seals
  // (what distinguishes route A from route B at the loss), and the whole status tag
  const R = stage.R;
  const pts = [stage.joints[fk][fi], stage.contactPoint('a'), stage.contactPoint('b')];
  const plinthBox = {x: stage.cx - stage.plinthW / 2 - 8, y: stage.plinthTop - 4, w: stage.plinthW + 16, h: stage.F - stage.plinthTop + 14};
  // (the seal gets its halo; a resting marble only needs its own radius plus its outline)
  const sealH = Math.max(11, R * 0.72) + 8;
  let src = unionBounds([{x: pts[0].x - sealH, y: pts[0].y - sealH, w: 2 * sealH, h: 2 * sealH}, ...pts.slice(1).map(q => ({x: q.x - 1.3 * R, y: q.y - 1.3 * R, w: 2.6 * R, h: 2.6 * R})), stage.vaseBox, plinthBox, tag && {x: tag.box.x - 4, y: tag.box.y - 4, w: tag.box.w + 8, h: tag.box.h + 10}]);
  src = {x: src.x - 8, y: src.y - 8, w: src.w + 16, h: src.h + 16};
  const annMw = Math.min(560, D.w * 0.46);
  const annProbe = keyOn ? [p.beforeValue, p.afterValue].map((tx, i) => chipG(ctx, `${i ? t.after : t.before}: ${tx}`, {x: 0, y: 0, maxWidth: annMw, size, maxLines: 5})) : [];
  const annH = keyOn ? annProbe[0].box.h + annProbe[1].box.h + 22 : 0;
  // a real inspection: the lens's short side is >= ~36 % of the FRAME's short side
  const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
  const minLens = (0.36 * Math.min(ctx.view.width, ctx.view.height)) / vs;
  // placements: slide the dimmed context to one side (the legend columns fade) and open the lens beside it,
  // or open it over the legend area below the stage; the context always stays wholly visible (>= ~45 % wide)
  const opts = [];
  const stageX0 = stageX, stageX1 = stageX + stageW;
  const bottomOf = stageTop + stageH;
  const regionFor = kind => {
    if (kind === 'shiftL') { const sx = MARGIN - stageX0; return {sx, x: stageX1 + sx + 22, y: 8, w: D.w - 8 - (stageX1 + sx + 22), h: D.h - 16 - annH}; }
    if (kind === 'shiftR') { const sx = D.w - MARGIN - stageX1; return {sx, x: 8, y: 8, w: stageX0 + sx - 22 - 8, h: D.h - 16 - annH}; }
    return {sx: 0, x: 8, y: bottomOf + 16, w: D.w - 16, h: D.h - 8 - annH - (bottomOf + 16)};
  };
  const poseOf = (P, q) => ({x: q.x * P.s + P.tx, y: q.y * P.s + P.ty, w: q.w * P.s, h: q.h * P.s});
  const tryPlace = (kind, rg, P) => {
    if (rg.w < 60 || rg.h < 60) return;
    const sp = poseOf(P, src);
    const z = Math.min(4, rg.w / sp.w, rg.h / sp.h);
    if (z < 1.5) return;
    const dw = sp.w * z, dh = sp.h * z;
    const below = kind !== 'shiftL' && kind !== 'shiftR' && kind !== 'shrinkL';
    const dy = Math.max(rg.y, Math.min(rg.y + rg.h - dh, below ? rg.y : sp.y + sp.h / 2 - dh / 2));
    const dx = below ? Math.max(rg.x, Math.min(rg.x + rg.w - dw, sp.x + sp.w / 2 - dw / 2)) : rg.x + (rg.w - dw) / 2;
    opts.push({kind, pose: P, z, dest: {x: dx, y: dy, w: dw, h: dh}, minDim: Math.min(dw, dh)});
  };
  if (cfg.tallRest) {
    // labels hidden, tall box: the stage fills the box at rest; for the lens it shrinks (>= 0.45 of the width) to the top
    // (to the top with the lens below, or to the left with the lens beside it; the largest scale that gives a full lens)
    for (let sL = 0.9; sL >= 0.46 - 1e-9; sL -= 0.02) {
      if ((stageW * sL) / D.w < 0.45) break;
      const hS = (stage.F + FLOOR_T - (stage.rackTop - 24)) * sL;
      const Pt = {s: sL, tx: (D.w - stageW * sL) / 2 - stageX * sL, ty: 8 - (stage.rackTop - 24) * sL};
      const bottom = Pt.ty + (stage.F + FLOOR_T) * sL;
      tryPlace('shrink', {x: 8, y: bottom + 16, w: D.w - 16, h: D.h - 8 - annH - (bottom + 16)}, Pt);
      const Pl = {s: sL, tx: MARGIN + 10 - stageX * sL, ty: (D.h - hS) / 2 - (stage.rackTop - 24) * sL};
      const right = MARGIN + 10 + stageW * sL;
      tryPlace('shrinkL', {x: right + 24, y: 8, w: D.w - 8 - (right + 24), h: D.h - 16 - annH}, Pl);
      if (opts.some(o2 => o2.minDim >= minLens)) break;
    }
  } else {
    for (const kind of ['shiftL', 'shiftR', 'below']) {
      const rg = regionFor(kind);
      tryPlace(kind, rg, {s: 1, tx: rg.sx, ty: 0});
    }
  }
  // tall-rest: the first (largest) shrink that gives a full-size lens; otherwise the largest lens
  const okOpts = opts.filter(o2 => o2.minDim >= minLens);
  if (!cfg.tallRest || !okOpts.length) opts.sort((a2, b2) => b2.minDim - a2.minDim);
  const best = cfg.tallRest && okOpts.length ? okOpts.sort((a2, b2) => b2.pose.s - a2.pose.s || b2.minDim - a2.minDim)[0] : opts[0];
  if ((!best || best.minDim < minLens) && !cfg.forceLens) return {bad: 'lens', over: best ? minLens - best.minDim : 999};
  const place = best || {kind: 'below', pose: {s: 1, tx: 0, ty: 0}, z: 1.5, dest: {x: 8, y: 8, w: src.w * 1.5, h: src.h * 1.5}, minDim: 0};
  const z = place.z;
  const pose = place.pose;
  const shiftX = pose.tx;
  const srcS = poseOf(pose, src);
  const dest = place.dest;
  // nothing the rim would cut is drawn in the copy: seals and barricades lying partly across the crop are left out of it
  const part = q => { const inn = q.x >= src.x && q.x + q.w <= src.x + src.w && q.y >= src.y && q.y + q.h <= src.y + src.h; const out = q.x + q.w <= src.x || q.x >= src.x + src.w || q.y + q.h <= src.y || q.y >= src.y + src.h; return !inn && !out; };
  const hideInCopy = [];
  for (const k of ROUTES) stage.joints[k].forEach((q, i) => { if (part({x: q.x - sealH, y: q.y - sealH, w: 2 * sealH, h: 2 * sealH})) hideInCopy.push(`lzs-joint${k}${i}`, ...(k === fk && i === fi ? [`lzs-jointalt${k}${i}`] : [])); });
  stage.bars.forEach((b, j) => { if (part({x: b.box.x - 4, y: b.box.y - 4, w: b.box.w + 8, h: b.box.h + 8})) hideInCopy.push(`lzs-alt${j}`); });
  if (hideInCopy.includes(`lzs-joint${fk}${fi}`)) return {bad: 'seal'};
  const L2 = lens(ctx, {name: 'lz', source: srcS, dest, content: g({transform: `translate(${r(pose.tx)} ${r(pose.ty)}) scale(${r(pose.s, 4)})`}, copy.back, copy.main, tagCopy && tagCopy.node), color: th.accent2});

  // ---- annotation under the lens (before struck, after)
  let ann = null;
  if (keyOn) {
    const ax = dest.x + dest.w / 2;
    const b = chipG(ctx, `${t.before}: ${p.beforeValue}`, {x: ax, y: dest.y + dest.h + 12, anchor: 'middle', maxWidth: annMw, size, maxLines: 5, name: 'ann-before', opacity: 0});
    const a = chipG(ctx, `${t.after}: ${p.afterValue}`, {x: ax, y: b.box.y + b.box.h + 10, anchor: 'middle', maxWidth: annMw, size, maxLines: 5, name: 'ann-after', fill: th.accent2Soft, stroke: th.accent2, opacity: 0});
    const strikes = b.fit.lines.map((ln, i) => {
      const lw = ctx.measure(ln.replace(/ /g, ' '), b.fit.size, 600, 'sans') + 8;
      const yy = b.box.y + size * 0.38 + i * b.fit.lineHeight + b.fit.size * 0.5;
      return {lw, node: h('line', {name: `ann-strike${i}`, x1: r(ax - lw / 2), x2: r(ax + lw / 2), y1: r(yy), y2: r(yy), stroke: th.ink, 'stroke-width': 3, 'stroke-dasharray': `${r(lw)} ${r(lw + 12)}`, 'stroke-dashoffset': r(lw)})};
    });
    ann = {before: b, after: a, strikes, node: g({name: 'ann'}, b.node, g({name: 'ann-strikes'}, strikes.map(s => s.node)), a.node)};
  }

  // ---- caption, legend (below), band (record, loss, key)
  const cap = capProbe ? chipG(ctx, `${t.context}: ${p.contextLabels.context}`, {x: stageX, y: 0, maxWidth: stageW, size, maxLines: 2, name: 'ctx-caption', fill: th.accent2Soft, stroke: th.accent2, opacity: 0}) : null;
  const bandTop = D.h - bandH + 6;
  // below-mode: the legend sits midway in the room between the stage and the band (that room is where the lens opens)
  const legY = stageTop + stageH + 14 + Math.max(0, (bandTop - (stageTop + stageH + 14) - legH) / 2);
  if (!side && keyOn) lg = legendColumns(ctx, {cols: cols0.map(c => ({...c, y: legY})), size, maxLines: cfg.maxLines ?? 3, gap: 8, prefix: 'lg'});
  const placed = flowRows(bandItems, {x: stageX, y: bandTop, w: stageW, gap: 20, rowGap: 10}).placed;
  let record = null;
  const band = [];
  for (const it of placed) {
    if (it.kind === 'record') {
      const hd = chipG(ctx, `${lname} · ${t.status}`, {x: it.x, y: it.y, maxWidth: recW, size, maxLines: 2, fill: th.card, stroke: th.inkSoft});
      const vy = it.y + hd.box.h + 8;
      const oldC = chipG(ctx, p.beforeValue, {x: it.x, y: vy, maxWidth: recW * 0.48, size, maxLines: 5, name: 'rec-old', fill: th.card, stroke: th.inkSoft});
      const newC = chipG(ctx, p.afterValue, {x: it.x + oldC.box.w + 16, y: vy, maxWidth: recW * 0.48, size, maxLines: 5, name: 'rec-new', fill: th.accent2Soft, stroke: th.accent2, opacity: 0});
      const strikes = oldC.fit.lines.map((ln, i) => {
        const lw = ctx.measure(ln.replace(/ /g, ' '), oldC.fit.size, 600, 'sans') + 8;
        const yy = vy + size * 0.38 + i * oldC.fit.lineHeight + oldC.fit.size * 0.5;
        return {lw, node: h('line', {name: `rec-strike${i}`, x1: r(oldC.box.cx - lw / 2), x2: r(oldC.box.cx + lw / 2), y1: r(yy), y2: r(yy), stroke: th.ink, 'stroke-width': 3, 'stroke-dasharray': `${r(lw)} ${r(lw + 12)}`, 'stroke-dashoffset': r(lw)})};
      });
      record = {node: g({name: 'record', opacity: 0}, hd.node, oldC.node, g(null, strikes.map(s => s.node)), newC.node), strikes, box: {x: it.x, y: it.y, w: it.w, h: it.h}};
    } else {
      const c = chipG(ctx, it.text, {x: it.x, y: it.y, maxWidth: balancedG(ctx, it.text, {maxWidth: it.kind === 'key' ? Math.min(stageW, 520) : Math.min(stageW, 600), size, maxLines: 4}), size, maxLines: 4, name: `band-${it.key}`, opacity: 0,
        fill: it.kind === 'loss' ? th.accent3Soft : th.card, stroke: it.kind === 'loss' ? th.accent3 : th.inkSoft});
      band.push({key: it.key, kind: it.kind, node: c.node, box: c.box});
    }
  }

  // ---- Δ marker + label near the inspected seal (clear of planks, vase, tag)
  const obst = [...stage.planks, stage.vaseBox, stage.plinthBox, tag && tag.box].filter(Boolean);
  const mR = Math.max(16, size * 0.7);
  // first clear spot on growing rings around the seal (outward side first), inside the stage
  const clearAt = (x, y) => {
    const bx = {x: x - mR - 6, y: y - mR - 6, w: 2 * mR + 12, h: 2 * mR + 12};
    if (bx.x < stageX || bx.x + bx.w > stageX + stageW || bx.y < stageTop || bx.y + bx.h > stage.F) return false;
    return !obst.some(o => bx.x < o.x + o.w && o.x < bx.x + bx.w && bx.y < o.y + o.h && o.y < bx.y + bx.h);
  };
  let mPos = null;
  for (let rad = 2 * mR; rad < 600 && !mPos; rad += 8) {
    for (const deg of [-35, -60, -15, -85, 10, -110, 35, -140, 60]) {
      const a2 = (deg * Math.PI) / 180;
      const x = jp.x + dir * Math.cos(a2) * rad, y = jp.y + Math.sin(a2) * rad;
      if (clearAt(x, y)) { mPos = {x, y: y - mR}; break; }
    }
  }
  mPos = mPos || {x: jp.x + dir * 3 * mR, y: jp.y - 3 * mR};
  const mC = {x: mPos.x, y: mPos.y + mR};
  const marker = changedMarker(ctx, {x: mC.x, y: mC.y, radius: mR, name: 'marker', opacity: 0});
  let mLabel = null;
  if (keyOn && p.contextLabels.marker) {
    const lp = chipG(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: 360, size, maxLines: 2});
    const res = placeChip({w: lp.box.w, h: lp.box.h}, {x: mC.x, y: mC.y, r: mR}, {obstacles: [...obst, {x: mC.x - mR, y: mC.y - mR, w: 2 * mR, h: 2 * mR}], bounds: {x: stageX, y: stageTop, w: stageW, h: stageH}, order: dir > 0 ? ['right', 'rightHigh', 'aboveR', 'above'] : ['left', 'leftHigh', 'aboveL', 'above'], gaps: [12, 26, 50, 80]});
    // otherwise anywhere in the design space clear of the scene, the legends and the band; never outside it
    const res2 = res || placeChip({w: lp.box.w, h: lp.box.h}, {x: mC.x, y: mC.y, r: mR}, {obstacles: [...obst, ...lg.rows.map(rw => rw.box), ...band.map(b => b.box), ...(cap ? [cap.box] : []), ...(record ? [record.box] : []), {x: mC.x - mR, y: mC.y - mR, w: 2 * mR, h: 2 * mR}], bounds: {x: 0, y: 0, w: D.w, h: D.h}, order: ['right', 'left', 'rightHigh', 'leftHigh', 'aboveR', 'aboveL', 'above'], gaps: [12, 26, 50, 80]});
    const at0 = res2 || {x: mC.x + dir * (mR + 16 + lp.box.w / 2), y: mC.y - lp.box.h / 2};
    const at = {x: Math.max(lp.box.w / 2 + 4, Math.min(D.w - lp.box.w / 2 - 4, at0.x)), y: at0.y};
    mLabel = calloutG(ctx, {name: 'mlabel', text: p.contextLabels.marker, chipAt: {x: at.x, y: at.y}, target: {x: mC.x + (at.x < mC.x ? -mR : mR), y: mC.y}, maxWidth: 360, maxLines: 2, size, color: th.accent2});
  }

  // anything the open lens or its notes lie over fades while it is open (no text under text)
  const cover = [{x: dest.x - 10, y: dest.y - 10, w: dest.w + 20, h: dest.h + 20}, ...(ann ? [ann.before.box, ann.after.box] : [])];
  const hit = b => cover.some(c => b.x < c.x + c.w && c.x < b.x + b.w && b.y < c.y + c.h && c.y < b.y + b.h);
  const under = {rows: (place.kind === 'below' ? lg.rows.filter(rw => hit(rw.box)) : lg.rows).map(rw => rw.name), band: place.kind === 'below' ? band.filter(b => hit(b.box)).map(b => b.key) : [], record: place.kind === 'below' && record ? hit(record.box) : false, cap: place.kind === 'below' && cap ? hit(cap.box) : false, tag: place.kind === 'below' && tag ? hit(tag.box) : false};
  // labels hidden, lens below: the context rests centred in the box and slides up to its place as the lens opens
  // labels hidden: a rest camera enlarges the whole context to fill the box while no lens is open (LAW-0688 pattern);
  // it eases back to the lens pose (scale 1, slid aside) just before the window appears and out again after it closes
  const cb = {x: stageX - 20, y: stage.rackTop - 24, w: stageW + 40, h: stage.F + FLOOR_T - stage.rackTop + 24};
  let rest = {s: 1, tx: 0, ty: 0};
  if (!keyOn && !cfg.tallRest) {
    const top = 30; // keep clear of the content notice
    const sR = Math.min(3, (D.w - 12) / cb.w, (D.h - top - 6) / cb.h);
    rest = {s: sR, tx: D.w / 2 - sR * (cb.x + cb.w / 2), ty: top + (D.h - top) / 2 - sR * (cb.y + cb.h / 2)};
  }
  return {pose, cb, rest, srcS, sealR: Math.max(11, stage.R * 0.72) + 6, hideInCopy, place: place.kind, shiftX, minLens, plinthBox, stageW, stage, copy, tag, tagCopy, L2, src, dest, zoom: z, ann, cap, lg, band, record, marker, mC, mR, mLabel, under, V, size, side, focus, jp};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const C = resolveRoutes(p);
    const fk = p.focusTarget === 'last-link-a' ? 'a' : 'b';
    const fi = C.routes[fk].n - 1;
    const toDisputed = p.substitution !== 'to-proposed';
    // the inspected link starts in its "before" state
    C.routes[fk].links[fi] = {...C.routes[fk].links[fi], status: toDisputed ? 'proposed' : 'disputed'};
    const base = {C, focus: {k: fk, i: fi}, toDisputed};
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 1) out.push(s); out.push(b); return out; };
    const cands = [];
    const legWs = [0.2, 0.22, 0.24, 0.25, 0.26, 0.27, 0.28, 0.3].map(f => ctx.design.w * f);
    for (const sizes of [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)]) {
      for (const size of sizes) {
        for (const mode of ctx.show('key') ? SH.modes : ['below']) {
          const cfgs = !ctx.show('key') ? [{mode, size, tallRest: true}] : mode === 'col' ? [0.4, 0.42, 0.44, 0.46, 0.475].flatMap(f => [undefined, 150, 125].flatMap(tagW => [9, 4].flatMap(lgGap => [undefined, 1.15, 1.3].map(contactK => ({mode, size, tagW, lgGap, contactK, legW: ctx.design.w * f}))))) : mode === 'side' ? legWs.map(legW => ({mode, size, legW})) : [1, 0.9, 0.8, 0.7, 0.6].flatMap(stageK => [{mode, size, stageK}, {mode, size, stageK, maxLines: 4}, {mode, size, stageK, maxLines: 6}]);
          for (const cfg of cfgs) {
            const X = compose(ctx, base, {...cfg, dry: true});
            if (!X.V) continue;
            const full = compose(ctx, base, X.cfg);
            if (full.stage) cands.push({cfg: X.cfg, V: X.V, size, zoom: full.zoom});
          }
        }
      }
      if (cands.length) break;
    }
    let L;
    if (cands.length) {
      const maxSize = Math.max(...cands.map(c => c.size));
      const lo = maxSize >= SH.baseMin ? Math.max(SH.baseMin, maxSize - 3) : maxSize - 0.5;
      const pick = cands.filter(c => c.size >= lo - 1e-9).sort((a, b) => b.V - a.V || b.size - a.size)[0];
      L = compose(ctx, base, pick.cfg);
      L.kScale = 1;
      L.fallback = false;
    } else {
      let found = null;
      for (let DH = ctx.design.h + 20; DH <= ctx.design.h * 3 && !found; DH += 20) {
        for (const mode of ctx.show('key') ? SH.modes : ['below']) {
          const X = compose(ctx, base, {mode, size: SH.minSize, maxLines: 5, legW: ctx.design.w * 0.28, DH, forceLens: true, dry: true});
          if (X.V) { found = X.cfg; break; }
        }
      }
      L = compose(ctx, base, found);
      L.kScale = ctx.design.h / found.DH;
      L.fallback = true;
    }
    L.dx = (ctx.design.w - ctx.design.w * L.kScale) / 2;
    L.base = base;
    return L;
  },
  build(ctx, L) {
    return g({transform: L.kScale < 1 ? T(L.dx, 0, 0, L.kScale) : null},
      L.lg.rows.map(rw => rw.node),
      // the context (stage, tag, caption, record, band, marker) slides aside as one piece while the lens is open
      g({name: 'ctxmove'},
        L.cap && L.cap.node,
        L.stage.back, L.stage.main,
        L.tag && L.tag.node,
        L.band.map(b => b.node),
        L.record && L.record.node,
        L.marker,
        L.mLabel && L.mLabel.node),
      g({name: 'lz-wrap', 'data-occludes': 1}, L.L2.node),
      L.ann && L.ann.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const {k: fk} = L.focus;
    // the produced state (both routes at the vase); only the inspected seal changes
    const sw = ease.inOutCubic(seg(u, ...W.swap));
    const a = L.stage.pose({a: 2, b: 2}, {swap: sw});
    const c = L.copy.pose({a: 2, b: 2}, {swap: sw});
    Object.assign(nodes, a.nodes, c.nodes);
    for (const n of L.hideInCopy) nodes[n] = {...(nodes[n] || {}), opacity: 0};
    const outP = seg(u, ...W.tagOut), inP = seg(u, ...W.tagIn);
    if (L.tag) Object.assign(nodes, L.tag.frame(outP, inP), L.tagCopy.frame(outP, inP));
    // lens
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    Object.assign(nodes, L.L2.frame(open));
    // the window grows IN PLACE at its destination (never sweeping over the context between source and destination);
    // its copy is scaled with it about the window centre, so no field is ever cut by the rim
    if (u > W.open[0] && u < W.close[1]) {
      const D0 = L.dest, S0 = L.srcS;
      const sc = 0.7 + 0.3 * open;
      const cx = D0.x + D0.w / 2, cy = D0.y + D0.h / 2;
      const R = {x: cx - (D0.w * sc) / 2, y: cy - (D0.h * sc) / 2, w: D0.w * sc, h: D0.h * sc};
      const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
      const kx = D0.w / S0.w, ky = D0.h / S0.h;
      Object.assign(nodes, {'lz-cliprect': rect, 'lz-bg': rect, 'lz-border': rect, 'lz-shadow': {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height},
        'lz-content': {transform: `translate(${r(cx)} ${r(cy)}) scale(${r(sc, 4)}) translate(${r(-cx)} ${r(-cy)}) translate(${r(D0.x - S0.x * kx)} ${r(D0.y - S0.y * ky)}) scale(${r(kx, 4)} ${r(ky, 4)})`},
        // the window and its copy fade in together as it grows (no bare card: it never overlaps its source)
        // it appears while the camera is still settling and leaves while the camera starts back (no lone small stage)
        'lz-win': {opacity: r(Math.min(seg(u, W.open[0], W.open[0] + 0.015), 1 - seg(u, W.close[1] - 0.015, W.close[1])), 3)}});
      const horiz = Math.abs(cx - (S0.x + S0.w / 2)) >= Math.abs(cy - (S0.y + S0.h / 2));
      const right = cx > S0.x + S0.w / 2;
      const [a1, a2, b1, b2] = horiz
        ? (right ? [[S0.x + S0.w, S0.y], [R.x, R.y], [S0.x + S0.w, S0.y + S0.h], [R.x, R.y + R.h]] : [[S0.x, S0.y], [R.x + R.w, R.y], [S0.x, S0.y + S0.h], [R.x + R.w, R.y + R.h]])
        : [[S0.x, S0.y + S0.h], [R.x, R.y], [S0.x + S0.w, S0.y + S0.h], [R.x + R.w, R.y]];
      nodes['lz-coneA'] = {x1: r(a1[0]), y1: r(a1[1]), x2: r(a2[0]), y2: r(a2[1]), opacity: open > 0.05 ? 1 : 0};
      nodes['lz-coneB'] = {x1: r(b1[0]), y1: r(b1[1]), x2: r(b2[0]), y2: r(b2[1]), opacity: open > 0.05 ? 1 : 0};
    }
    const ctxOp = r(1 - DIM * open, 3);
    nodes['st-back'] = {opacity: ctxOp};
    nodes['st-main'] = {opacity: ctxOp};
    const copyOp = u > W.open[0] && u < W.close[1] ? 1 : 0;
    nodes['lz-content'] = {...nodes['lz-content'], opacity: r(copyOp, 3)};
    // anything under the lens has faded out just before the window appears, and returns as soon as it has gone
    const gone = r(clamp(1 - seg(u, ...W.underOut) + seg(u, ...W.underIn)), 3);
    // the context slides aside before the lens opens and back after it closes (never scaled)
    const shiftP = ease.inOutCubic(seg(u, ...W.shift)) * (1 - ease.inOutCubic(seg(u, ...W.unshift)));
    const cam = {s: L.rest.s + (L.pose.s - L.rest.s) * shiftP, tx: L.rest.tx + (L.pose.tx - L.rest.tx) * shiftP, ty: L.rest.ty + (L.pose.ty - L.rest.ty) * shiftP};
    nodes.ctxmove = {transform: `translate(${r(cam.tx)} ${r(cam.ty)}) scale(${r(cam.s, 4)})`};
    const lgVis = L.place === 'below' ? null : clamp(1 - seg(u, ...W.lgOut) + seg(u, ...W.lgIn));
    if (L.tag) nodes['st-tag'] = {opacity: r(L.under.tag ? gone : ctxOp, 3)};
    if (L.ann) {
      const annOut = 1 - seg(u, W.close[0], W.close[0] + 0.02);
      const bo = seg(u, ...W.before) * annOut;
      nodes['ann-before'] = {opacity: r(bo, 3)};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after) * annOut, 3)};
      nodes['ann-strikes'] = {opacity: r(bo, 3)};
      const sp = seg(u, ...W.strike);
      L.ann.strikes.forEach((s, i) => { nodes[`ann-strike${i}`] = {'stroke-dashoffset': r(s.lw * (1 - sp))}; });
    }
    if (L.cap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.caption) * (L.under.cap ? gone : 1), 3)};
    Object.assign(nodes, legendFrame(L.lg.rows, rw => seg(u, ...W.legend) * (lgVis !== null ? lgVis : L.under.rows.includes(rw.name) ? gone : 1)));
    for (const b of L.band) nodes[`band-${b.key}`] = {opacity: r((b.kind === 'key' ? seg(u, ...W.key) : seg(u, ...W.legend)) * (L.under.band.includes(b.key) ? gone : 1), 3)};
    const turn = seg(u, ...W.ctxTurn);
    if (L.record) {
      nodes.record = {opacity: r(seg(u, ...W.record) * (L.under.record ? gone : 1), 3)};
      nodes['rec-new'] = {opacity: r(turn, 3)};
      L.record.strikes.forEach((s, i) => { nodes[`rec-strike${i}`] = {'stroke-dashoffset': r(s.lw * (1 - turn))}; });
    }
    const mp = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mp, 3)};
    if (L.mLabel) Object.assign(nodes, L.mLabel.frame(seg(u, ...W.markerLabel)));

    const inside = (q, R) => q.x >= R.x && q.x + (q.w || 0) <= R.x + R.w && q.y >= R.y && q.y + (q.h || 0) <= R.y + R.h;
    const over = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
    const datum = u < W.strike[0] ? 'before' : u < W.after[0] ? 'changing' : 'after';
    const jn = `joint${fk}${L.focus.i}`, ja = `jointalt${fk}${L.focus.i}`;
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      focusTarget: p.focusTarget,
      substitution: p.substitution,
      lensOpen: r(open, 3),
      copyShown: r(copyOp, 3),
      zoom: r(L.zoom, 3),
      datum,
      strike: r(seg(u, ...W.strike), 3),
      seal: sw <= 0 ? 'before' : sw >= 1 ? 'after' : 'changing',
      tagValue: inP >= 1 ? 'after' : outP <= 0 ? 'before' : 'changing',
      contextDatum: turn <= 0 ? 'before' : turn < 1 ? 'changing' : 'after',
      state: a.semantic.state, cracked: a.semantic.cracked, marbles: a.semantic.marbles, joints: a.semantic.joints,
      mirror: JSON.stringify(a.nodes[`st-${jn}`]) === JSON.stringify(c.nodes[`lzs-${jn}`]) && JSON.stringify(a.nodes[`st-${ja}`]) === JSON.stringify(c.nodes[`lzs-${ja}`]),
      // the inspected link (its seal, with its halo), the marble resting on it and the whole status tag lie inside the source
      sourceHoldsDetail: inside({x: L.jp.x - L.sealR, y: L.jp.y - L.sealR, w: 2 * L.sealR, h: 2 * L.sealR}, L.src)
        && inside({x: a.semantic.marbles[fk].x - L.stage.R, y: a.semantic.marbles[fk].y - L.stage.R, w: 2 * L.stage.R, h: 2 * L.stage.R}, L.src)
        && (!L.tag || inside(L.tag.box, L.src)),
      lensClearOfSource: !over(L.srcS, L.dest),
      markerVisible: mp >= 1,
      markerClear: ![...L.stage.planks, L.stage.vaseBox].some(b => over(b, {x: L.mC.x - L.mR, y: L.mC.y - L.mR, w: 2 * L.mR, h: 2 * L.mR})),
      // lens checklist: short side of the lens / 36 % of the frame's short side (>= 1 passes); context width share;
      // whole objects in the source (vase + plinth + both marbles)
      lensShare: r(Math.min(L.dest.w, L.dest.h) / L.minLens, 3),
      contextShare: r((L.stageW * L.pose.s) / ctx.design.w, 3),
      // the context's drawn extent (rest camera included) as shares of the design box
      ctxW: r((L.cb.w * cam.s) / ctx.design.w, 3), ctxH: r((L.cb.h * cam.s) / ctx.design.h, 3),
      wholeObjects: inside(L.stage.vaseBox, L.src) && inside(L.plinthBox, L.src) && ['a', 'b'].every(k => inside({x: a.semantic.marbles[k].x - L.stage.R, y: a.semantic.marbles[k].y - L.stage.R, w: 2 * L.stage.R, h: 2 * L.stage.R}, L.src)),
      shift: r(L.shiftX * shiftP, 1),
      place: L.place,
      layout: {V: r(L.V), size: r(L.size), k: r(L.kScale, 3), fallback: L.fallback, side: L.side},
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
    slug: 'causation-03-inspect',
    title: 'Concurrent causes — inspecting the status of one route’s link into the loss',
    titleEs: 'Causas concurrentes — Inspección y cambio de un dato',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Causas concurrentes',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The state produced by two routes that each reach the same vase. A lens enlarges the arrival zone (a real copy posed from the scene) and the status tag of one route’s link into the loss. One datum is substituted (e.g. proposed → disputed): the old value is struck, the seal changes from linked rings to a dashed ring, the new value holds; the lens closes onto the changed seal with a neutral Δ marker. The marbles, cracks and the other route do not change; nothing is inferred.',
    tags: ['causation', 'concurrent causes', 'inspect', 'lens', 'link status', 'changed datum', 'two routes', 'same loss'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causas-concurrentes.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
