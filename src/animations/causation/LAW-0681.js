/**
 * LAW-0681 — Cadena causal · story
 *
 * Storyboard (side view, one floor, one presenter):
 *  0.00–0.15 rest   A presenter (the party who proposes the chain) stands at
 *                   the left of a floor on which one upright tile per supplied
 *                   event waits in the SUPPLIED order (a die face on each tile
 *                   gives its position without text). A vase stands on a
 *                   display plinth at the end. Event chips appear in order.
 *  0.075–0.16       The presenter leans in and reaches the first tile; the
 *                   fingertip stays on the tile face while pushing it.
 *  0.16–0.56 action Each tile rotates about its bottom corner and only starts
 *                   when the previous tile's top corner TOUCHES it (computed
 *                   contact); a joint marker pops at every contact.
 *  ~0.56–0.70       The last tile strikes the vase, which tips over on the
 *                   plinth and cracks; chips break off the lip.
 *  0.73–1.00 hold   Leaning staircase + cracked vase; status tag "Proposed
 *                   chain (as supplied)" and editorial callouts.
 *  finalState 'unresolved-at-disputed-link': the chain reaches the disputed
 *  link and holds there; everything downstream stays upright as a dimmed
 *  solid (the held tile leans on it) and also gets a dashed outline of its
 *  fallen pose — the animation does not decide the link.
 *  Tall boxes: two levels (upper landing → lower floor); the tile before the
 *  one that tips over the landing edge comes to rest lying ON the landing.
 *  Alternatives: a tall barricade standing on the floor behind the tiles.
 * Legal content: fictional, jurisdiction unspecified, the chain is shown only
 * as proposed by a party; no finding of causation or responsibility.
 * @module animations/causation/LAW-0681
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {personRig} from '../../primitives/person.js';
import {actorLook} from '../../primitives/people-style.js';
import {chainFields, CHAIN_STRINGS, resolveChain, chainStage, fitChainH, chainWidth, wrapExtents, dieFace, tileColor, lossArt} from './kits/causal-chain.js';
import {placeChip, placeChipAny, packLabels, boundsOf, unionBounds, leaderPoly, calloutChip, stateTag} from './kits/place.js';
import {bodyPoint, bodyCorners, DEG} from './kits/topple.js';

const ID = 'LAW-0681';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {labels: [0.015, 0.12], alt: [0.03, 0.12], reach: [0.075, 0.16], start: 0.16, strike: 0.56, withdraw: 0.07, present: [0.74, 0.82], tag: [0.75, 0.8], note: [0.8, 0.9], watch: [0.2, 0.62]};
const PUSH_DEG = 9;

const sceneSchema = {
  ...chainFields,
  presenter: party,
  actorLabels: obj('Role caption shown with the presenter', {a: str('Caption for the presenter (descriptive, not a finding)', 80)}),
  objectLabels: obj('Labels printed in the scene', {
    chain: str('Status tag shown in the final hold when the chain reaches the loss', 70),
    stand: str('Optional label printed on the display plinth', 30),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['chain', 'link', 'loss', 'alternative']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: the proposed chain reaches the loss, or it reaches the disputed link and stays unresolved (never decided)', ['reaches-loss', 'unresolved-at-disputed-link']),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+1 min'},
    {label: 'Display stand shakes', time: 'T+2 min'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  presenter: {name: 'Rin Adeyemi', role: 'Party A'},
  actorLabels: {a: 'Party A · proposes this chain'},
  objectLabels: {chain: 'Proposed chain (as supplied)', stand: ''},
  actionProgress: 1,
  annotations: [{target: 'loss', text: 'Loss as described in Party A’s account'}],
  finalState: 'reaches-loss',
};

const SHAPES = {
  landscape: {mode: 'row', maxH: 470, size: 28, maxLines1: 3},
  square: {mode: 'row', maxH: 420, size: 32, maxLines1: 3},
  // tall boxes: the chain wraps from an upper landing down to a lower floor
  portrait: {mode: 'wrap', maxH: 390, size: 34},
};
const MARGIN = 26;
const SHARD = 0.36; // floor beyond the plinth where chips land (× H)
const SHARD_WRAP = 0.3; // wrap mode: chips land in a shorter strip left of the plinth
/** Wrap mode: gap between lower-floor tiles (× H) — wider for long lower rows so the fallen staircase stays readable. */
const lowGapOf = (n, m) => (n - m >= 3 ? 0.5 : 0.36);
const kOf = H => clamp(H / 300, 0.62, 1.3);
const zoneOf = H => 165 * kOf(H);

/** Single floor: tile height from the width left after the presenter. */
function rowPlan(n, lc, D, maxH) {
  let H = maxH;
  for (let it = 0; it < 6; it++) H = fitChainH(n, D.w - 2 * MARGIN - zoneOf(H) - SHARD * H, maxH, lc);
  const cw = chainWidth(n, H, lc);
  const left = (D.w - (zoneOf(H) + cw + SHARD * H)) / 2;
  return {mode: 'row', H, x0: left + zoneOf(H), floorLeft: left - 4, floorRight: left + zoneOf(H) + cw + SHARD * H, maxH};
}

/**
 * Two levels: choose the split (m tiles on the landing) that allows the
 * tallest tiles. Links that carry a barrier or where the chain is held stay
 * on the landing (m ≥ link + 2), where there is free air above them for the
 * back shelf, the "?" joint and their notes; if that is impossible the
 * single-floor layout is used.
 */
function wrapPlan(n, lc, D, maxH, fixedM, minM = 1) {
  const fit = (m, H) => {
    const ex = wrapExtents(n, m, H, lc, undefined, lowGapOf(n, m));
    const z = zoneOf(H);
    const lo = Math.max(MARGIN + z + ex.row1, MARGIN + SHARD_WRAP * H - ex.row2Left);
    const hi = D.w - MARGIN - ex.reach - 10;
    return {ex, z, lo, hi, ok: lo <= hi};
  };
  let best = null;
  for (let m = Math.max(1, minM); m < n; m++) {
    if (fixedM && m !== fixedM) continue;
    let lo = 60, hi = maxH;
    if (!fit(m, lo).ok) continue;
    if (fit(m, hi).ok) lo = hi;
    else for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (fit(m, mid).ok) lo = mid; else hi = mid; }
    const score = lo - Math.abs(m - n / 2) * 2;
    if (!best || score > best.score) best = {m, H: lo, score};
  }
  if (!best) return rowPlan(n, lc, D, maxH);
  const {m, H} = best;
  const f = fit(m, H);
  const l0 = Math.min(-f.ex.row1 - f.z, f.ex.row2Left - SHARD_WRAP * H), r0 = f.ex.reach + 10;
  const xe = clamp(D.w / 2 - (l0 + r0) / 2, f.lo, Math.max(f.lo, f.hi));
  return {mode: 'wrap', H, m, xe, x0: xe - f.ex.row1, landingLeft: xe - f.ex.row1 - f.z - 4, lowLeft: xe + f.ex.row2Left - SHARD_WRAP * H, lowRight: xe + f.ex.reach + 10, maxH};
}

/**
 * Lay the whole composition out at a nominal floor height; the caller centres
 * it vertically afterwards (L.dy). Returns every box used, for the fit test.
 */
function compose(ctx, plan, tk, o) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {SH, C, n, unresolved, stopLink, links, lossCount} = o;
  const wrap = plan.mode === 'wrap';
  const H = plan.H;
  const k = kOf(H);
  const z = zoneOf(H);
  const F = D.h * 0.6;
  const size = SH.size * tk;
  const lossText = `${t.lossAs}: ${p.losses.map(l => l.label).join(' · ')}`;
  const stage = chainStage(ctx, {
    prefix: 'st', x0: plan.x0, floorY: F, H, n, lossCount, links,
    barriers: C.alternatives.map(a => ({link: a.link})),
    start: W.start, strike: W.strike, stopAtLink: stopLink,
    floorLeft: wrap ? plan.landingLeft : plan.floorLeft, floorRight: plan.floorRight,
    wrap: wrap ? {m: plan.m, floorLeft: Math.min(plan.lowLeft, plan.landingLeft), floorRight: plan.lowRight, lowGap: lowGapOf(n, plan.m)} : null,
  });
  const F2 = stage.floorY2;
  const floorBottom = F2 + 34;

  // --- presenter (on the floor, or on the upper landing in wrap mode)
  const look = actorLook(ctx, p.presenter, 0);
  const rig = personRig(ctx, {name: 'actor', look, pose: 'standing'});
  const ax = plan.x0 - 114 * k;
  const ay = F + 4;
  const restNear = {x: ax + 22 * k, y: ay - 156 * k};
  const presentAt = {x: ax + 120 * k, y: ay - 262 * k};
  const tile0 = stage.bodies[0];
  const gripLocal = {x: -tile0.w - 13 * k, y: -0.8 * H};
  const grip = th0 => bodyPoint(tile0, th0, gripLocal);
  const releaseU = stage.sim.timeAtAngle(0, PUSH_DEG);
  const headTop = ay - 420 * k;
  const presenterBox = {x: ax - 58 * k, y: headTop - 6, w: 198 * k, h: ay - headTop + 6};

  // --- event labels
  const labelNodes = [];
  const labelBoxes = [];
  let legendLoss = null; // wrap mode: where the loss row of the legend sits (notes on the loss attach to it)
  if (ctx.show('key') && wrap) {
    // two-level layouts: a legend below the lower floor (two columns when the box is wide);
    // die icons tie each row to its tile
    const cols = SH.legendCols ?? 1;
    const iconS = 52 * tk;
    const colGap = 34;
    const colW = (D.w - 2 * MARGIN - (cols - 1) * colGap) / cols;
    const textMax = colW - 8 - iconS - 16;
    const entries = [...C.events.map((e, i) => ({key: `ev${i}`, order: i, text: `${i + 1}. ${e.label}`, i})), {key: 'loss', order: n, text: lossText, i: -1}];
    const perCol = Math.ceil(entries.length / cols);
    const top = floorBottom + 34;
    for (let cI = 0; cI < cols; cI++) {
      const rowX = MARGIN + 8 + cI * (colW + colGap);
      let y = top;
      entries.slice(cI * perCol, (cI + 1) * perCol).forEach(en => {
        const isLoss = en.i < 0;
        const c = chip(ctx, en.text, {x: rowX + iconS + 16, y, maxWidth: textMax, size, maxLines: 2, fill: isLoss ? th.accent3Soft : th.card, stroke: isLoss ? th.accent3 : th.accent2, name: `lab-${en.key}`});
        const icon = isLoss
          ? g({transform: T(rowX + iconS * 0.8, y + (c.box.h + iconS) / 2)}, lossArt(ctx, {name: 'legend-vase', w: iconS * 0.62, h: iconS, kind: 'vase'}).node)
          : g({transform: T(rowX, y + (c.box.h - iconS) / 2)}, dieFace(ctx, {s: iconS, k: en.i + 1, fill: tileColor(ctx, en.i), pip: '#ffffff'}));
        labelNodes.push({key: en.key, order: en.order, node: g({name: `labg-${en.key}`, opacity: 0}, icon, c.node)});
        labelBoxes.push({x: rowX, y, w: c.box.x + c.box.w - rowX, h: Math.max(c.box.h, iconS)});
        if (isLoss) legendLoss = {rowX, iconS, chip: c.box, icon: {x: rowX + iconS * 0.49, y: y + (c.box.h + iconS) / 2 + 6}, bottom: y + Math.max(c.box.h, iconS), colW};
        y += Math.max(c.box.h, iconS) + 16;
      });
    }
  } else if (ctx.show('key')) {
    // wide boxes: chips hang from ticks under the tiles — one row when they fit, else staggered
    const mk = (mw, ml) => C.events.map((e, i) => ({key: `ev${i}`, order: i, text: `${i + 1}. ${e.label}`, x: stage.tiles[i].left + stage.w / 2, mw, ml, stroke: th.accent2}));
    let items = mk(stage.spacing - 12, SH.maxLines1);
    const fits = items.every(it => {
      const f = chip(ctx, it.text, {x: 0, y: 0, maxWidth: it.mw, size, maxLines: it.ml}).fit;
      return !f.truncated && f.size >= size * 0.92;
    });
    if (!fits) items = mk(stage.spacing * 2 - 18, 4);
    items.push({key: 'loss', order: n, text: lossText, x: stage.plinth.x + stage.plinth.w / 2, mw: Math.max(stage.plinth.w + 90, 300), ml: 5, stroke: th.accent3, fill: th.accent3Soft});
    const probes = items.map(it => chip(ctx, it.text, {x: 0, y: 0, maxWidth: it.mw, size, maxLines: it.ml}));
    const packed = packLabels(items.map((it, i) => ({x: it.x, w: probes[i].box.w, h: probes[i].box.h})), {y: floorBottom + 18, minX: MARGIN * 0.5, maxX: D.w - MARGIN * 0.5, gap: 10, rowGap: 12, maxRows: 3});
    items.forEach((it, i) => {
      const pk = packed[i];
      const cc = chip(ctx, it.text, {x: pk.x, y: pk.y, maxWidth: it.mw, size, maxLines: it.ml, fill: it.fill ?? th.card, stroke: it.stroke, name: `lab-${it.key}`});
      const tick = h('line', {x1: r(it.x), x2: r(it.x), y1: r(floorBottom + 2), y2: r(pk.y), stroke: it.stroke, 'stroke-width': 2, opacity: 0.8});
      labelNodes.push({key: it.key, order: it.order, node: g({name: `labg-${it.key}`, opacity: 0}, tick, cc.node)});
      labelBoxes.push(cc.box);
    });
  }
  // presenter chip above the head
  let whoChip = null;
  if (ctx.show('key')) {
    const who = [p.presenter.name, p.actorLabels.a || p.presenter.role].filter(Boolean).join(' · ');
    const wx = Math.max(MARGIN * 0.5, ax - 60 * k);
    // compact (≤ 3 lines) so callout leaders from the landing's barrier can pass beside it
    const mw = wrap ? Math.min(D.w * 0.46, D.w - MARGIN * 0.5 - wx) : Math.min(D.w * 0.5, Math.max(300, z * 2.6));
    const probe = chip(ctx, who, {x: 0, y: 0, maxWidth: mw, size: size * 0.9, maxLines: 4});
    whoChip = chip(ctx, who, {x: wx, y: headTop - probe.box.h - 12, maxWidth: mw, size: size * 0.9, maxLines: 4, name: 'lab-who', stroke: th.ink});
  }

  // --- plinth label (printed on the plinth front)
  let standLabel = null;
  if (p.objectLabels.stand && ctx.show('all')) {
    const f = ctx.fit(p.objectLabels.stand, {maxWidth: stage.plinth.w - 60, size: Math.max(16, H * 0.07), minSize: 12, maxLines: 1, weight: 600});
    standLabel = textBlock(f, {x: stage.plinth.x + stage.plinth.w / 2, y: stage.plinth.top + (F2 - stage.plinth.top) * 0.42, anchor: 'middle', fill: th.inkSoft});
  }

  // --- obstacles every editorial chip must clear
  const fin = stage.pose(1).semantic;
  const polysFin = stage.polygonsAt(1);
  const polysAll = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].flatMap(u => stage.polygonsAt(u)).concat(polysFin);
  const jr = Math.max(13, H * 0.066) + 7;
  const jointBoxes = fin.joints.filter(Boolean).map(q => ({x: q.x - jr, y: q.y - jr, w: 2 * jr, h: 2 * jr}));
  const floorBoxes = wrap
    ? [{x: plan.landingLeft - 8, y: F - 30, w: stage.wrap.xe - plan.landingLeft + 16, h: 64}, {x: Math.min(plan.lowLeft, plan.landingLeft) - 8, y: F2 - 30, w: plan.lowRight - Math.min(plan.lowLeft, plan.landingLeft) + 16, h: 64}]
    : [{x: plan.floorLeft - 8, y: F - 30, w: plan.floorRight - plan.floorLeft + 16, h: 64}];
  const plinthBox = {x: stage.plinth.x - 4, y: stage.plinth.top, w: stage.plinth.w + 8, h: F2 - stage.plinth.top + 34};
  // unresolved: the dashed sweep over the first downstream body and the dashed
  // "fallen" outline of every downstream body
  const ghostBoxes = unresolved ? [stopLink + 1].map(i => {
    const bb = boundsOf(polysFin[i]);
    const d = stage.bodies[i].dir ?? 1;
    return {x: d > 0 ? bb.x + bb.w * 0.5 : bb.x - 0.62 * H, y: bb.y - 0.08 * H, w: bb.w * 0.5 + 0.62 * H, h: 0.4 * H};
  }).concat(stage.bodies.map((b, i) => (i > stopLink ? bodyCorners(b, stage.settledFull.angles[i]) : null)).filter(Boolean)) : [];
  const bars = stage.barriers;
  const fixed = [presenterBox, whoChip && whoChip.box, ...labelBoxes, ...floorBoxes, plinthBox, ...jointBoxes, ...ghostBoxes, ...bars.flatMap(b => [b.box, b.stand])].filter(Boolean);
  const bounds = {x: MARGIN * 0.5, y: -D.h, w: D.w - MARGIN, h: 3 * D.h};
  const placed = [];
  const leads = [];

  // --- alternative callouts (visible from the start, so they clear every pose of the fall)
  const altNodes = ctx.show('all') ? C.alternatives.map((a, j) => {
    const b = bars[j];
    const text = `${t.alternative}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`;
    const mw = wrap ? D.w - 2 * MARGIN : Math.min(560, D.w * 0.36);
    const fits = [[mw, 2], [mw * 0.66, 3], [mw * 0.48, 3], [mw * 0.4, 4]].map(([wd, ml]) => ({wd, ml, box: chip(ctx, text, {x: 0, y: 0, maxWidth: wd, size: size * 0.9, maxLines: ml}).box}));
    const po = {obstacles: [...fixed, ...polysAll, ...placed, ...leads], bounds, own: [b.box, b.stand], order: ['above', 'aboveR', 'aboveL', 'right', 'left', 'rightHigh', 'leftHigh']};
    const res = placeChipAny(fits.map(f => f.box), {x: b.top.x, y: b.top.y}, po) || {...placeChip(fits[1].box, b.top, {...po, leastBad: true}), k: 1};
    const f = fits[res.k];
    const at = res;
    const c = calloutChip(ctx, {name: `alt${j}`, text, chipAt: {x: at.x, y: at.y}, target: at.end, maxWidth: f.wd, maxLines: f.ml, size: size * 0.9, color: th.accent});
    placed.push(c.box);
    leads.push(leaderPoly(c.box, at.end));
    return c;
  }) : [];

  // --- editorial notes (final hold: they clear the settled pose)
  const B = stage.bodies;
  const iT = Math.min(1, n - 1);
  const linkIdx = stopLink ?? C.disputed ?? 0;
  const lossBody = B[n];
  const targets = {
    // the exposed part of the tile's upper face, above where the previous tile rests on it
    chain: {pt: bodyPoint(B[iT], fin.angles[iT] * DEG, {x: -B[iT].w - 4, y: -0.84 * H}), own: [polysFin[iT]]},
    link: fin.joints[linkIdx] ? {pt: {...fin.joints[linkIdx], r: jr + 4}, own: []} : {pt: fin.tops[linkIdx], own: [polysFin[linkIdx]]},
    // standing (unresolved) loss: point at its rim, where the air above it is free
    loss: unresolved
      ? {pt: {...bodyPoint(lossBody, 0, {x: -lossBody.w / 2, y: -lossBody.h}), r: 10}, own: [polysFin[n]]}
      : {pt: bodyPoint(lossBody, fin.angles[n] * DEG, {x: -lossBody.w / 2, y: -lossBody.h * 0.55}), own: [polysFin[n]]},
    alternative: bars.length ? {pt: bars[0].top, own: [bars[0].box, bars[0].stand]} : {pt: fin.tops[0], own: [polysFin[0]]},
  };
  let legendNoteY = legendLoss ? legendLoss.bottom + 18 : 0;
  const notes = ctx.show('all') ? p.annotations.map((a, i) => {
    const tg = targets[a.target];
    if (wrap && a.target === 'loss' && legendLoss) {
      // two levels: the vase sits under the landing, walled in by the tiles; the note
      // on the loss hangs from the loss row of the legend (its vase icon) instead of
      // sending a leader across the landing
      const lx = legendLoss.rowX + legendLoss.iconS + 16 + 18;
      const probe = chip(ctx, a.text, {x: 0, y: 0, maxWidth: legendLoss.colW - (lx - legendLoss.rowX), maxLines: 3, size: size * 0.95});
      const at = {x: lx + probe.box.w / 2, y: legendNoteY};
      const cc = calloutChip(ctx, {name: `note${i}`, text: a.text, chipAt: at, target: legendLoss.icon, maxWidth: legendLoss.colW - (lx - legendLoss.rowX), maxLines: 3, size: size * 0.95});
      legendNoteY += cc.box.h + 14;
      placed.push(cc.box);
      return cc;
    }
    const mw = wrap ? D.w - 2 * MARGIN : Math.min(600, D.w * 0.4);
    const fits = [[mw, 2], [mw * 0.66, 3], [mw * 0.48, 3], [mw * 0.4, 4]].map(([wd, ml]) => ({wd, ml, box: chip(ctx, a.text, {x: 0, y: 0, maxWidth: wd, size: size * 0.95, maxLines: ml}).box}));
    const po = {obstacles: [...fixed, ...polysFin, ...placed, ...leads], bounds, own: tg.own};
    const res = placeChipAny(fits.map(f => f.box), tg.pt, po) || {...placeChip(fits[2].box, tg.pt, {...po, leastBad: true}), k: 2};
    const f = fits[res.k];
    const at = res;
    const c = calloutChip(ctx, {name: `note${i}`, text: a.text, chipAt: {x: at.x, y: at.y}, target: at.end, maxWidth: f.wd, maxLines: f.ml, size: size * 0.95});
    placed.push(c.box);
    leads.push(leaderPoly(c.box, at.end));
    return c;
  }) : [];

  let tag = null;
  // --- status tag: over the chain, clear of the presenter
  if (ctx.show('key')) {
    const tagText = unresolved ? `${t.disputedLink} · ${t.unresolved}` : (p.objectLabels.chain || t.proposedChain);
    const tsize = SH.size * Math.max(0.85, tk);
    const probe = stateTag(ctx, tagText, {x: 0, y: 0, size: tsize, maxWidth: D.w - 2 * MARGIN});
    const cx = wrap ? (plan.x0 + plan.lowRight) / 2 : (plan.x0 + plan.floorRight) / 2;
    const res = placeChip({w: probe.box.w, h: probe.box.h}, {x: cx, y: F - H}, {obstacles: [...fixed, ...polysFin, ...placed, ...leads], bounds, noLeader: true, order: ['above', 'aboveR', 'aboveL'], gaps: [30, 60, 100, 150, 210, 280, 360, 460]});
    const at = res || {x: cx, y: F - H - 30 - probe.box.h};
    tag = stateTag(ctx, tagText, {x: at.x, y: at.y, anchor: 'middle', size: tsize, maxWidth: D.w - 2 * MARGIN, name: 'state-tag', color: unresolved ? th.inkSoft : th.accent2, opacity: 0});
    placed.push(tag.box);
  }

  const ext = unionBounds([presenterBox, whoChip && whoChip.box, ...labelBoxes, ...floorBoxes, ...placed, ...bars.flatMap(b => [b.box, b.stand]), {x: plan.x0, y: F - H - 8, w: 1, h: 1}]);
  return {stage, rig, k, ax, ay, restNear, presentAt, grip, releaseU, labelNodes, whoChip, standLabel, tag, altNodes, notes, unresolved, stopLink, n, ext, dy: 0};
}


const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    const C = resolveChain(p);
    const n = C.n;
    const unresolved = p.finalState === 'unresolved-at-disputed-link';
    const stopLink = unresolved ? (C.disputed ?? Math.floor((n - 1) / 2)) : null;
    const links = C.links.map((l, i) => (i === stopLink ? {...l, status: 'disputed'} : l));
    const lossCount = Math.min(2, p.losses.length);
    const base = {SH, C, n, unresolved, stopLink, links, lossCount};
    // links that need free air above them (held link, barriers) must stay on the landing
    const keyLinks = [stopLink, ...C.alternatives.map(a => a.link)].filter(v => v !== null && v !== undefined);
    const minM = keyLinks.length ? Math.max(...keyLinks) + 2 : 1;
    const plan0 = SH.mode === 'wrap' && minM <= n - 1 ? wrapPlan(n, lossCount, D, SH.maxH, null, minM) : rowPlan(n, lossCount, D, SH.maxH);
    let plan = plan0;
    let tk = 1;
    let L = compose(ctx, plan, tk, base);
    // shrink until the whole composition fits the design height, then centre it
    for (let it = 0; it < 10 && L.ext.h > D.h - 16; it++) {
      const maxH = plan.H * 0.94;
      plan = plan0.mode === 'wrap' ? wrapPlan(n, lossCount, D, maxH, plan0.m, plan0.m) : rowPlan(n, lossCount, D, maxH);
      tk = Math.max(0.76, tk * 0.965);
      L = compose(ctx, plan, tk, base);
    }
    L.dy = (D.h - L.ext.h) / 2 - L.ext.y;
    return L;
  },
  build(ctx, L) {
    return g({transform: T(0, L.dy)},
      L.stage.back,
      L.rig.node,
      L.stage.main,
      L.standLabel,
      L.labelNodes.map(x => x.node),
      L.whoChip && L.whoChip.node,
      L.altNodes.map(a => a.node),
      L.tag && L.tag.node,
      L.notes.map(nn => nn.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const posed = L.stage.pose(a, {barrierIn: L.altNodes.map(() => 1)});
    const nodes = posed.nodes;
    const S = posed.semantic;
    const done = p.actionProgress >= 1;

    // --- presenter: reach → push (fingertip on the tile face) → withdraw → present
    const th0 = S.angles[0] * DEG;
    const reach = ease.inOutCubic(seg(a, ...W.reach));
    const withdraw = ease.inOutCubic(seg(a, L.releaseU, L.releaseU + W.withdraw));
    const present = done ? ease.inOutCubic(seg(u, ...W.present)) : 0;
    const pushing = a >= W.start && a < L.releaseU;
    let near;
    if (a < W.start) near = mix(L.restNear, L.grip(0), reach);
    else if (pushing) near = L.grip(th0);
    else near = mix(mix(L.grip(PUSH_DEG * DEG), L.restNear, withdraw), L.presentAt, present);
    const lean = 8 * reach * (1 - withdraw);
    const watch = seg(a, ...W.watch);
    const headTilt = reduced ? 0 : 7 * Math.sin(Math.PI * clamp(watch * 1.15));
    const posedRig = L.rig.frame({x: L.ax, y: L.ay, facing: 1, scale: L.k, lean, headTilt, near, far: null, mouth: 0});
    Object.assign(nodes, posedRig.nodes);
    const hand = posedRig.hands.near;

    // --- labels, tags, callouts
    const count = Math.max(1, L.labelNodes.length);
    const each = (W.labels[1] - W.labels[0]) / count;
    for (const ln of L.labelNodes) nodes[`labg-${ln.key}`] = {opacity: r(seg(u, W.labels[0] + ln.order * each, W.labels[0] + (ln.order + 1.6) * each), 3)};
    if (L.whoChip) nodes['lab-who'] = {opacity: r(seg(u, 0, W.labels[0] + 0.02), 3)};
    L.altNodes.forEach(an => Object.assign(nodes, an.frame(seg(u, ...W.alt))));
    if (L.tag) nodes['state-tag'] = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    L.notes.forEach(nn => Object.assign(nodes, nn.frame(done ? seg(u, ...W.note) : 0)));

    // --- semantics
    const B = L.stage.bodies;
    const gaps = [];
    for (let i = 0; i < L.n - 1; i++) {
      const tr = bodyPoint(B[i], S.angles[i] * DEG, {x: 0, y: -B[i].h});
      const bl = bodyPoint(B[i + 1], S.angles[i + 1] * DEG, {x: -B[i + 1].w, y: 0});
      const tl = bodyPoint(B[i + 1], S.angles[i + 1] * DEG, {x: -B[i + 1].w, y: -B[i + 1].h});
      const dx = tl.x - bl.x, dy = tl.y - bl.y;
      // signed distance of tile i's top corner from tile i+1's facing side (positive = still apart)
      gaps.push(r(((tr.x - bl.x) * dy - (tr.y - bl.y) * dx) / (Math.hypot(dx, dy) || 1), 1));
    }
    const starts = L.stage.sim.starts;
    const startOrder = starts.map((st, i) => [st, i]).filter(x => Number.isFinite(x[0])).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      hand: P2(hand),
      pushGrip: P2(L.grip(th0)),
      handOnTile: pushing,
      allReached: posedRig.reached,
      reach: {near: posedRig.reached},
      angles: S.angles,
      started: S.started,
      touching: S.touching,
      gaps,
      startOrder,
      joints: S.joints,
      lossState: S.lossState,
      cracked: S.cracked,
      ghost: S.ghost,
      stopLink: L.stopLink,
      actionCapped: p.actionProgress < 1 && u > capU,
    };
    S.tops.forEach((q, i) => { semantic[i < L.n ? `tile${i}` : `loss${i - L.n}`] = q; });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-01-story',
    title: 'Causal chain — toppling tiles in the supplied order',
    titleEs: 'Cadena causal — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Cadena causal',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side-view microscene: a presenter pushes the first of 3–6 event tiles standing in the supplied order; each tile only starts when the previous one touches it, and the last one strikes a vase on a plinth, which tips and cracks (loss as described). Shown only as the proposed chain; an alternative final state holds at a disputed link, unresolved.',
    tags: ['causation', 'chain', 'dominoes', 'events', 'order', 'loss', 'proposed', 'disputed link', 'presenter', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CHAIN_STRINGS,
  scene,
});
