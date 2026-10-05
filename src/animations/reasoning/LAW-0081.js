/**
 * LAW-0081 — Hecho y regla · story
 *
 * Storyboard (top-down worktable; one analyst whose two arms enter from the
 * bottom edge, body off-frame):
 *  0.00–0.15 rest     The RULE plate (illustrative text supplied by the
 *                     author) is fixed to the table; its condition rows end in
 *                     sockets of four tip profiles, and two guide JAWS stick
 *                     out of its facing edge (the connector's support, with
 *                     the supplied assumptions riveted on). The FACT card lies
 *                     loose, tilted and off-line; each attribute row carries
 *                     the badge of its bolt profile. A magnifier lies on the
 *                     table. The left hand reaches the card's pull tab.
 *  0.15–0.42 action   The hand slides the card towards the plate. Dashed row
 *                     guides run back from each socket. When the leading edge
 *                     enters the flared mouth of the jaws, the card is squared
 *                     up — tilt and offset go to zero, so every attribute row
 *                     comes level with its condition row (the attributes
 *                     align). The card docks.
 *  0.42–0.73 complete The hand lets go. Only then, row by row, each latch bolt
 *                     (the connector) slides across the gap as its SUPPLIED
 *                     status says: as-supplied → seated, registration halves
 *                     close; disputed → stops short, '?' disc in the gap;
 *                     pending → stays in, dashed ghost. The right hand picks
 *                     up the magnifier and holds it over the focus joint; the
 *                     glass shows a real enlarged copy of that joint.
 *  0.73–1.00 hold     Tag "attributes aligned as supplied · no conclusion
 *                     drawn", the supplied issue as a callout on the lens,
 *                     editorial annotations. finalState 'awaiting-alignment'
 *                     keeps every bolt retracted (pending) instead.
 * Wide boxes dock left → right. Square and tall boxes dock bottom → top with
 * the rows turned into columns and the magnifier resting in the lower right.
 * The lens handle always leaves along the gap (down in wide boxes, right in
 * tall ones), away from the rows' text.
 * Legal content: fictional, jurisdiction unspecified; the rule text is the
 * author's illustrative text; statuses are descriptive, never a finding.
 * @module animations/reasoning/LAW-0081
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, rotateAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, dist} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {placeChip, placeChipAny, calloutChip, segPolys, leaderPoly, hitsAny} from '../causation/kits/place.js';
import {hrFields, HR_STRINGS, DEFAULT_CONTENT, resolveRows, focusRowOf, assemblyGeometry, shiftGeo, cardArt, plateArt, boltArt, lupaArt, assemblyCopy, jointPoint, hrColors, unionRect, jawsGeometry, jawArt} from './kits/hecho-y-regla.js';

const ID = 'LAW-0081';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  chips: [0.01, 0.1], reachL: [0.03, 0.145], slide: [0.15, 0.41], guidesIn: [0.14, 0.26], guidesOut: [0.5, 0.58],
  release: [0.43, 0.5], bolts: [0.44, 0.6], reachR: [0.5, 0.585], carry: [0.6, 0.67], setDown: [0.67, 0.7], withdrawR: [0.705, 0.78],
  tag: [0.74, 0.8], issue: [0.76, 0.85], note: [0.8, 0.9],
};
const TILT = -7;

const sceneSchema = {
  ...hrFields,
  analyst: party,
  actorLabels: obj('Role caption shown where the analyst’s arms enter the table', {a: str('Caption for the analyst (descriptive)', 60)}),
  objectLabels: obj('Kind labels printed on the objects', {
    fact: str('Kind label on the fact card', 30),
    rule: str('Kind label on the rule plate', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['fact', 'rule', 'connector', 'lupa']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: bolts travel as each attribute’s supplied status says (aligned-as-supplied), or all stay retracted (awaiting-alignment). No legal conclusion is drawn in either', ['aligned-as-supplied', 'awaiting-alignment']),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  analyst: {name: 'Rin', role: 'Analyst'},
  actorLabels: {a: 'Analyst · compares the texts'},
  objectLabels: {fact: 'Fact', rule: 'Rule · illustrative text'},
  actionProgress: 1,
  annotations: [],
  finalState: 'aligned-as-supplied',
};

/** Per-shape composition (design units). */
const SHAPES = {
  landscape: {axis: 'x', size: 40, cardW: 580, plateW: 620, rightZone: 34, startLeft: 56},
  square: {axis: 'y', size: 32, width: 960},
  portrait: {axis: 'y', size: 31, width: 740},
};
const M = 14;
const LENS_R = 0.8; // × gap

/** Rotate point p about c by deg. */
function rot(p, c, deg) {
  const a = (deg * Math.PI) / 180;
  const dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a)};
}

function elbowOf(pose) {
  const n = pose.nodes;
  const key = Object.keys(n).find(k => k.endsWith('-upper'));
  return {x: n[key].x2, y: n[key].y2};
}

/** Riveted assumption plaque (a metal label on a jaw). */
function plaque(ctx, name, text, slot, size) {
  const th = ctx.theme;
  const mw = Math.min(560, slot.maxWidth);
  const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size, maxLines: 3});
  const y = slot.above ? slot.y - probe.box.h : slot.y;
  const c = chip(ctx, text, {x: slot.x, y, anchor: 'middle', maxWidth: mw, size, maxLines: 3, fill: '#e9edf0', stroke: th.metalDark, color: '#1f2328', name: `${name}-chip`, radius: 6});
  const b = c.box;
  const node = g({name, opacity: 0}, c.node,
    h('circle', {cx: r(b.x + 9), cy: r(b.y + b.h / 2), r: 3.6, fill: th.metalDark}),
    h('circle', {cx: r(b.x + b.w - 9), cy: r(b.y + b.h / 2), r: 3.6, fill: th.metalDark}));
  return {node, box: b};
}

/** Status tag: a pill with a dot and up to two lines of bold text (a descriptive state, not a finding). */
function tagChip(ctx, text, o) {
  const s = o.size;
  const dotW = s * 0.9;
  const fit = ctx.fit(text, {maxWidth: o.maxWidth - s * 1.2 - dotW, size: s, minSize: s * 0.82, maxLines: 2, weight: 700});
  const w = fit.width + s * 1.2 + dotW;
  const hh = fit.height + s * 0.8;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.x;
  const col = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: 0},
    h('rect', {x: r(x), y: r(o.y), width: r(w), height: r(hh), rx: r(Math.min(hh / 2, s * 0.9)), fill: ctx.theme.card, stroke: col, 'stroke-width': 2.2}),
    h('circle', {cx: r(x + s * 0.6 + dotW * 0.35), cy: r(o.y + s * 0.4 + fit.size * 0.55), r: r(s * 0.26), fill: col}),
    textBlock(fit, {x: x + s * 0.6 + dotW, y: o.y + s * 0.4, fill: col}));
  return {node, box: {x, y: o.y, w, h: hh}};
}

/** Geometry, poses and fixed props for one text size. */
function compose(ctx, s) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = SHAPES[ctx.view.shape];
  const awaiting = p.finalState === 'awaiting-alignment';
  const baseRows = resolveRows(p);
  const override = {};
  if (awaiting) baseRows.forEach(rw => { if (rw.status !== 'unpaired') override[rw.i] = 'pending'; });
  const rows = resolveRows(p, override);
  const focus = focusRowOf(awaiting ? baseRows : rows);
  const desk = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const deskR = desk.x + desk.w, deskB = desk.y + desk.h;
  const common = {rows, size: s, show: ctx.show('key'), kinds: {fact: p.objectLabels.fact || t.factKind, rule: p.objectLabels.rule || t.ruleKind}, titles: {fact: p.facts.title, rule: p.rules.title}, G: s * 3.1, D: s * 1.2};
  let geo, start;
  const R = common.G * LENS_R;
  const Lh = Math.max(120, common.G * 1.25);
  if (S.axis === 'x') {
    geo = assemblyGeometry(ctx, {...common, axis: 'x', x: 0, y: 0, cardW: S.cardW, plateW: S.plateW});
    const Ht = geo.card.h;
    const plateX = deskR - S.rightZone - S.plateW;
    const x0 = plateX - geo.G - S.cardW;
    // room below the plate for the resting magnifier; the rest above for the tag/plaques
    const y0 = Math.max(desk.y + 110, Math.min(desk.y + (desk.h - Ht) * 0.5, deskB - Ht - 2 * R - 50));
    geo = shiftGeo(geo, x0, y0);
    const startX = desk.x + S.startLeft + (geo.card.x - geo.tab.x);
    start = {dx: startX - geo.card.x, dy: Math.min(0.13 * Ht, 70), rot: TILT};
  } else {
    geo = assemblyGeometry(ctx, {...common, axis: 'y', x: 0, y: 0, width: S.width});
    const x0 = (D.w - S.width) / 2;
    const dockH = geo.tab.y + geo.tab.h - geo.plate.y;
    // the resting magnifier lies beside the plate (top right) if the margin allows, else beside the card's
    // start pose, else in the lower-right corner below it
    const topRoom = deskR - (x0 + S.width) >= 2 * R + 40;
    const sideRoom = !topRoom && deskR - (x0 + S.width + 30 + 26) >= 2 * R + 26;
    const lensTop = topRoom || sideRoom ? deskB : deskB - 34 - (R + Lh) * 0.707 - R;
    const topPad = (ctx.show('key') ? 96 : 0) + (p.annotations.length && ctx.show('all') ? 40 : 30);
    // bottom band: the analyst chip (lower left) and, without side room, the resting lens (lower right)
    const whoH = ctx.show('all') ? chip(ctx, [p.analyst.name, p.actorLabels.a].filter(Boolean).join(' · '), {x: 0, y: 0, maxWidth: Math.min(360, S.width * 0.45), size: s * 0.86, maxLines: 5}).box.h + 34 : 0;
    const bottom = Math.min(lensTop - 24, deskB - 36 - whoH);
    // the docked assembly sits a little above the table's middle: the card starts below it and the held state fills the table
    const y0 = topRoom || sideRoom ? clamp(desk.y + (desk.h - dockH) / 2 - 30, desk.y + topPad, bottom - dockH - 120) : clamp(desk.y + (desk.h - dockH) / 2 - 90, desk.y + topPad, bottom - dockH - 120);
    const dy = clamp(bottom - (y0 + dockH), 110, 320);
    geo = shiftGeo(geo, x0, y0);
    start = {dx: 30, dy, rot: TILT * 0.8, topRoom, sideRoom, bottom};
  }
  const C = geo.card;
  const cc = {x: C.x + C.w / 2, y: C.y + C.h / 2};
  // along the docking axis the card follows the slide progress p; across it (offset, tilt) the jaws' alignment al
  const poseAt = pr => (geo.axis === 'x'
    ? {dx: start.dx * (1 - pr.p), dy: start.dy * (1 - pr.al), rot: start.rot * (1 - pr.al)}
    : {dx: start.dx * (1 - pr.al), dy: start.dy * (1 - pr.p), rot: start.rot * (1 - pr.al)});
  const worldOf = (pt, pose) => {
    const q = rot(pt, cc, pose.rot);
    return {x: q.x + pose.dx, y: q.y + pose.dy};
  };

  // --- guide jaws on the plate; the card's leading edge meets the mouth part-way through the slide
  const travel = geo.axis === 'x' ? -start.dx : start.dy;
  const flare = Math.max(Math.abs(geo.axis === 'x' ? start.dy : start.dx) * 0.7 + 34, 54);
  const reach = geo.G + (geo.axis === 'x' ? C.w : C.h) * 0.38;
  const flareLen = Math.min(reach * 0.45, 140);
  const jaws = jawsGeometry(geo, {reach, flareLen, flare});
  const lead0 = geo.axis === 'x' ? C.x + start.dx + C.w : C.y + start.dy;
  const toMouth = Math.abs(jaws.mouth - lead0);
  const alignP = {from: clamp(toMouth / travel, 0, 0.8), span: Math.max(0.12, flareLen / travel)};

  // --- magnifier: rest spot and the focus joint
  // (wide boxes) the glass is nudged towards the socket when the focus row's text runs up to the card's edge, so the rim never lies on it
  const J0 = jointPoint(geo, focus);
  const fa = geo.fits[focus] && geo.fits[focus].a;
  const textEnd = fa && geo.axis === 'x' ? geo.cells[focus].attrAt.x + fa.width : -Infinity;
  const J = geo.axis === 'x' ? {x: Math.min(Math.max(J0.x, textEnd + R * 1.07 + 14), geo.plate.x + geo.D * 0.9), y: J0.y} : J0;
  // the handle leaves along the gap (down in wide boxes, right in tall ones); tilt it if its end would leave the table
  const handleEndAt = ang => ({x: J.x + Math.cos(ang * Math.PI / 180) * (R + Lh) * 1.07, y: J.y + Math.sin(ang * Math.PI / 180) * (R + Lh) * 1.07});
  const inside = q => q.x > desk.x + 30 && q.x < deskR - 30 && q.y > desk.y + 30 && q.y < deskB - 30;
  const cands = geo.axis === 'x' ? [90, 75, 105, 60, 120] : [0, -22, 22, -40, 40];
  const holdAngle = cands.find(an => inside(handleEndAt(an))) ?? cands[0];
  const rest = geo.axis === 'x'
    ? {c: {x: geo.plate.x + geo.plate.w * 0.36, y: deskB - R - 26}, angle: 6}
    : start.topRoom
      ? {c: {x: deskR - R - 20, y: geo.plate.y + R + 6}, angle: 90}
      : start.sideRoom
      ? {c: {x: deskR - R - 22, y: deskB - R - Lh * 0.62 - 30}, angle: 86}
      : {c: {x: deskR - 34 - (R + Lh) * 0.707, y: deskB - 34 - (R + Lh) * 0.707}, angle: 45};
  const lupaGripAt = (c, ang, lift) => {
    const k = 1 + 0.07 * lift;
    const a = (ang * Math.PI) / 180;
    return {x: c.x + Math.cos(a) * (R + Lh * 0.6) * k, y: c.y + Math.sin(a) * (R + Lh * 0.6) * k};
  };
  const restGrip = lupaGripAt(rest.c, rest.angle, 0);
  const holdGrip = lupaGripAt(J, holdAngle, 1);

  // --- arms (analyst off-frame below the bottom edge)
  const look = actorLook(ctx, p.analyst, 0);
  const gripStart = worldOf(geo.grip, poseAt({p: 0, al: 0}));
  const gripDock = geo.grip;
  let shoulderL, restL, shoulderR, restR;
  if (geo.axis === 'x') {
    shoulderL = {x: Math.max(desk.x + 200, gripStart.x + 170), y: deskB + 240};
    restL = {x: shoulderL.x + 20, y: deskB - 66};
    shoulderR = {x: Math.min(deskR + 40, Math.max(holdGrip.x, restGrip.x) + 120), y: deskB + 250};
    restR = {x: Math.min(deskR - 70, shoulderR.x - 30), y: deskB - 58};
  } else {
    // the pushing arm comes straight up from below the tab, leaving the lower-left corner free for the analyst chip
    shoulderL = {x: gripDock.x - 60, y: deskB + 260};
    restL = {x: gripDock.x - 100, y: deskB - 70};
    shoulderR = {x: deskR + 30, y: deskB + 260};
    restR = {x: deskR - 100, y: deskB - 58};
  }
  const HAND = 24 * 1.3 * (50 / 46);
  const need = (sh, pts) => Math.max(...pts.map(q => dist(sh, q))) + 30 - HAND;
  const nL = need(shoulderL, [gripStart, gripDock, restL]);
  const nR = need(shoulderR, [restGrip, holdGrip, restR]);
  const armL = topArm(ctx, {name: 'armL', skin: look.skin, sleeve: look.outfit, handed: 'right', width: 50, upper: nL * 0.52, lower: nL * 0.48});
  const armR = topArm(ctx, {name: 'armR', skin: look.skin, sleeve: look.outfit, handed: 'left', width: 50, upper: nR * 0.52, lower: nR * 0.48});

  // --- analyst chip on the bottom edge, clear of both arms in every sampled pose, the lens and the card's start pose
  const size = s * 0.86;
  let who = null;
  if (ctx.show('all')) {
    const txt = [p.analyst.name, p.actorLabels.a].filter(Boolean).join(' · ');
    const armPts = (arm, sh, bend, tgs) => tgs.flatMap(tg => { const ps = arm.pose(sh, tg, bend); return segPolys([sh, elbowOf(ps), ps.hand], 70); });
    const obst = [
      ...armPts(armL, shoulderL, 1, [restL, gripStart, mix(gripStart, gripDock, 0.33), mix(gripStart, gripDock, 0.66), gripDock]),
      ...armPts(armR, shoulderR, -1, [restR, restGrip, mix(restGrip, holdGrip, 0.5), holdGrip]),
      {x: rest.c.x - R - 14, y: rest.c.y - R - 14, w: 2 * R + 28, h: 2 * R + 28},
      ...segPolys([rest.c, lupaGripAt(rest.c, rest.angle, 0)], 60),
      unionRect([C, geo.tab]),
    ];
    const startPoly = [C, {x: C.x + C.w, y: C.y}, {x: C.x + C.w, y: C.y + C.h}, {x: C.x, y: C.y + C.h}].map(q => worldOf(q, poseAt({p: 0, al: 0})));
    obst.push(startPoly);
    let best = null;
    for (const [mw, ml] of [[460, 2], [380, 3], [300, 4], [240, 5]]) {
      const c0 = chip(ctx, txt, {x: 0, y: 0, maxWidth: mw, size, maxLines: ml});
      if (c0.fit.truncated) continue;
      const bw = c0.box.w, bh = c0.box.h;
      for (const lift of [0, 30, 60]) {
        const y = deskB - 14 - bh - lift;
        for (let x = desk.x + 16; x + bw <= deskR - 16 && !best; x += 8) {
          if (!hitsAny({x, y, w: bw, h: bh}, obst, 6)) best = {x, y, mw, ml};
        }
        if (best) break;
      }
      if (best) break;
    }
    if (!best) best = {x: desk.x + 16, y: deskB - 14 - chip(ctx, txt, {x: 0, y: 0, maxWidth: 380, size, maxLines: 4}).box.h, mw: 380, ml: 4};
    who = chip(ctx, txt, {x: best.x, y: best.y, maxWidth: best.mw, size, maxLines: best.ml, name: 'who', fill: ctx.theme.card, stroke: ctx.theme.ink});
  }

  // --- assumption plaques above the upper jaw (wide boxes only)
  let plaques = [];
  if (ctx.show('all') && geo.axis === 'x' && p.assumptions.length) {
    const x0 = geo.plate.x + 10, x1 = geo.plate.x + geo.plate.w - 10;
    const each = (x1 - x0) / Math.min(2, p.assumptions.length);
    plaques = p.assumptions.slice(0, 2).map((a, i) => plaque(ctx, `plaque${i}`, `${t.assumed}: ${a}`, {x: x0 + each * (i + 0.5), y: jaws.a[0].y - 18, above: true, maxWidth: each - 16}, size * 0.9));
  }
  const finalTravel = rows.map(rw => (rw.attr ? geo.travel[rw.status] ?? 0 : 0));
  return {geo, rows, focus, awaiting, desk, start, cc, poseAt, worldOf, jaws, alignP, R, Lh, J, holdAngle, handleEnd: handleEndAt(holdAngle), rest, look, armL, armR, shoulderL, shoulderR, restL, restR, finalTravel, who, plaques, size, s};
}

function cardTransform(L, pose) {
  return `${T(pose.dx, pose.dy)} ${rotateAbout(L.cc.x, L.cc.y, pose.rot)}`;
}

/** Nodes and editorial label placement for the composed geometry. */
function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const geo = L.geo;
  const col = hrColors(ctx);
  L.card = cardArt(ctx, geo, {prefix: 'crd'});
  L.plate = plateArt(ctx, geo, {prefix: 'plt'});
  L.bolts = L.rows.map((rw, i) => (rw.attr ? boltArt(ctx, geo, i, {name: `bolt${i}`, status: rw.status}) : null));
  L.card0 = cardTransform(L, L.poseAt({p: 0, al: 0}));
  L.jawNodes = [jawArt(ctx, L.jaws.a, L.jaws.bracketA), jawArt(ctx, L.jaws.b, L.jaws.bracketB)];
  const copy = assemblyCopy(ctx, geo, L.finalTravel, 'lcopy');
  L.lupa = lupaArt(ctx, {name: 'lupa', R: L.R, handle: L.Lh, copy, zoom: 1.8, lensFill: shade(th.woodTop, -0.04)});
  // dashed row guides from each socket back to the jaws' mouth
  L.guideLines = [];
  L.guides = geo.cells.map((c, i) => {
    if (L.rows[i].cond === null) return null;
    const to = geo.axis === 'x' ? {x: L.jaws.mouth - 30, y: c.sock.y} : {x: c.sock.x, y: L.jaws.mouth + 30};
    const len = dist(c.sock, to);
    L.guideLines.push({i, len});
    return h('line', {name: `guide${i}`, x1: r(c.sock.x), y1: r(c.sock.y), x2: r(to.x), y2: r(to.y), stroke: shade(col.rule, -0.2), 'stroke-width': 3, 'stroke-dasharray': '11 9', 'stroke-dashoffset': r(len), 'stroke-linecap': 'round'});
  }).filter(Boolean);

  // --- obstacles for the editorial chips in the final hold
  const lensBox = {x: L.J.x - L.R * 1.1, y: L.J.y - L.R * 1.1, w: L.R * 2.2, h: L.R * 2.2};
  // final hold: both hands are back at rest; the magnifier lies over the focus joint
  const armRFin = L.armR.pose(L.shoulderR, L.restR, -1);
  const armLFin = L.armL.pose(L.shoulderL, L.restL, 1);
  const armPolys = [...segPolys([L.shoulderR, elbowOf(armRFin), L.restR], 76), ...segPolys([L.shoulderL, elbowOf(armLFin), L.restL], 76)];
  const handlePoly = segPolys([L.J, L.handleEnd], 50);
  const jawPolys = [...segPolys(L.jaws.a, 22), ...segPolys(L.jaws.b, 22)];
  const gapBox = geo.axis === 'x'
    ? {x: geo.card.x + geo.card.w, y: geo.card.y, w: geo.G, h: geo.card.h}
    : {x: geo.card.x, y: geo.plate.y + geo.plate.h, w: geo.card.w, h: geo.G};
  const fixed = [geo.card, geo.plate, geo.tab, gapBox, lensBox, ...armPolys, ...handlePoly, ...jawPolys, L.who && L.who.box, ...L.plaques.map(pq => pq.box)].filter(Boolean);
  const bounds = {x: L.desk.x + 12, y: L.desk.y + 12, w: L.desk.w - 24, h: L.desk.h - 24};
  const placed = [];
  const leads = [];
  // status tag: below the docked card in wide boxes, above the plate in square/tall ones (placed first)
  L.tag = null;
  if (ctx.show('key')) {
    const txt = `${L.awaiting ? t.awaiting : t.aligned} · ${t.noConclusion}`;
    const tsize = L.s * 0.8;
    const tagMax = geo.axis === 'x' ? D.w - 80 : Math.min(geo.plate.w * 0.62, 520);
    const probe = tagChip(ctx, txt, {x: 0, y: 0, size: tsize, maxWidth: tagMax});
    const below = {x: geo.card.x + geo.card.w / 2, y: geo.axis === 'x' ? geo.card.y + geo.card.h + 14 : geo.tab.y + geo.tab.h};
    const opts = {obstacles: [...fixed, ...placed, ...leads], bounds, noLeader: true, gaps: [16, 30, 50, 76, 110, 150, 200]};
    const ruleNote = ctx.show('all') && p.annotations.some(an => an.target === 'rule');
    // with a note on the rule, the tag keeps to the left so the note's leader can reach the plate's right end
    const above = {x: geo.plate.x + (ruleNote ? probe.box.w / 2 : geo.plate.w / 2), y: geo.plate.y};
    const res = geo.axis === 'x'
      ? placeChip({w: probe.box.w, h: probe.box.h}, below, {...opts, order: ['below', 'belowR', 'belowL']})
      : placeChip({w: probe.box.w, h: probe.box.h}, above, {...opts, order: ['above', 'aboveR', 'aboveL']})
        || placeChip({w: probe.box.w, h: probe.box.h}, below, {...opts, order: ['below', 'belowR', 'belowL']});
    const at = res || {x: below.x, y: below.y + 20};
    L.tag = tagChip(ctx, txt, {x: at.x, y: at.y, anchor: 'middle', size: tsize, maxWidth: tagMax, name: 'state-tag', color: L.awaiting ? th.inkSoft : shade(col.rule, -0.3)});
    placed.push(L.tag.box);
  }
  const mkCallout = (name, text, target, own, order) => {
    const mw = Math.min(560, L.desk.w * 0.46);
    const sz = L.size;
    const fits = [[mw, 2, 1], [mw * 0.78, 3, 1], [mw * 0.62, 3, 1], [mw * 0.5, 4, 1], [mw * 0.75, 3, 0.85], [mw * 0.55, 4, 0.85]]
      .map(([wd, ml, k]) => ({wd, ml, sz: sz * k, box: chip(ctx, text, {x: 0, y: 0, maxWidth: wd, size: sz * k, maxLines: ml}).box}));
    const po = {obstacles: [...fixed, ...placed, ...leads], bounds, own, order: order || ['left', 'leftLow', 'leftHigh', 'belowL', 'right', 'rightLow', 'rightHigh', 'belowR', 'aboveL', 'aboveR', 'below', 'above']};
    const res = placeChipAny(fits.map(f => f.box), target, po) || {...placeChip(fits[1].box, target, {...po, leastBad: true}), k: 1};
    const f = fits[res.k];
    const c = calloutChip(ctx, {name, text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: f.wd, maxLines: f.ml, size: f.sz, color: th.ink});
    placed.push(c.box);
    leads.push(leaderPoly(c.box, res.end));
    return c;
  };
  L.issues = [];
  if (ctx.show('all')) {
    const fr = L.rows[L.focus];
    const issue = p.issues.find(x => x.attribute === L.focus);
    const word = fr.status === 'disputed' ? t.disputedS : fr.status === 'pending' ? t.pendingS : null;
    const text = issue ? `${t.issue}: ${issue.text}` : word ? `${t.attribute} ${L.focus + 1} · ${word} (${t.asSupplied})` : null;
    // the question concerns the supplied attribute: hang it on the card's outer edge at that row
    const c = geo.cells[L.focus];
    const tg = geo.axis === 'x' ? {x: geo.card.x - 2, y: c.cy} : {x: c.cx, y: geo.tab.y + geo.tab.h + 2};
    const order = geo.axis === 'x' ? ['left', 'leftLow', 'leftHigh', 'belowL', 'aboveL', 'below'] : ['below', 'belowL', 'belowR', 'left', 'right'];
    if (geo.axis === 'y' && Math.abs(c.cx - (geo.tab.x + geo.tab.w / 2)) > geo.tab.w) tg.y = geo.card.y + geo.card.h + 2;
    if (text) L.issues.push(mkCallout('issue0', text, tg, [geo.card], order));
  }
  // square/tall boxes: no room for plaques on the jaws — the supplied assumptions hang from the right jaw
  L.assumeNotes = [];
  if (ctx.show('all') && geo.axis === 'y') {
    p.assumptions.slice(0, 2).forEach((as, i) => {
      const at = i === 0 ? L.jaws.a[2] : L.jaws.b[2];
      const order = i === 0 ? ['belowL', 'below', 'leftLow', 'belowR', 'left'] : ['belowR', 'below', 'rightLow', 'belowL', 'right'];
      L.assumeNotes.push(mkCallout(`assume${i}`, `${t.assumed}: ${as}`, {x: at.x + (i === 0 ? -4 : 4), y: at.y + 4}, [], order));
    });
  }
  L.notes = [];
  if (ctx.show('all')) {
    p.annotations.forEach((an, i) => {
      const tg = annotationTarget(L, an.target);
      L.notes.push(mkCallout(`note${i}`, an.text, tg.pt, tg.own, tg.order));
    });
  }
  return L;
}

/** Annotation target point on a free side of its object, the objects its leader may enter, and the preferred chip sides. */
function annotationTarget(L, target) {
  const geo = L.geo;
  const X = geo.axis === 'x';
  const jawPolys = [...segPolys(L.jaws.a, 22), ...segPolys(L.jaws.b, 22)];
  if (target === 'fact') {
    return X
      ? {pt: {x: geo.card.x + geo.card.w * 0.3, y: geo.card.y - 2}, own: [geo.card], order: ['above', 'aboveL', 'aboveR', 'leftHigh', 'left']}
      : {pt: {x: geo.card.x + geo.card.w * 0.18, y: geo.card.y + geo.card.h + 2}, own: [geo.card], order: ['below', 'belowL', 'belowR', 'left']};
  }
  if (target === 'rule') {
    return X
      ? {pt: {x: geo.plate.x + geo.plate.w * 0.74, y: geo.plate.y + geo.plate.h + 2}, own: [geo.plate], order: ['below', 'belowR', 'belowL', 'rightLow']}
      : {pt: {x: geo.plate.x + geo.plate.w - 30, y: geo.plate.y - 2}, own: [geo.plate], order: ['above', 'aboveR', 'aboveL', 'rightHigh', 'leftHigh']};
  }
  if (target === 'lupa') return {pt: {x: L.J.x, y: L.J.y, r: L.R + 12}, own: [], order: X ? ['belowR', 'rightLow', 'below', 'belowL', 'leftLow'] : ['leftLow', 'belowL', 'below', 'left']};
  // connector: the first bolt in the gap other than the focus row (the lens covers that one), reached across a jaw
  const i = L.rows.findIndex(rw => rw.attr && rw.cond !== null && rw.i !== L.focus);
  const jp = jointPoint(geo, i < 0 ? 0 : i);
  const gapBox = X ? {x: geo.card.x + geo.card.w, y: geo.card.y, w: geo.G, h: geo.card.h} : {x: geo.card.x, y: geo.plate.y + geo.plate.h, w: geo.card.w, h: geo.G};
  return {pt: jp, own: [gapBox, ...jawPolys], order: X ? ['above', 'aboveL', 'aboveR'] : ['left', 'leftLow', 'leftHigh', 'belowL']};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const S = SHAPES[ctx.view.shape];
    const D = ctx.design;
    let s = S.size;
    let L = compose(ctx, s);
    // shrink until the docked assembly, the card's start pose and the lens fit the table
    for (let it = 0; it < 10; it++) {
      const g0 = L.geo;
      const startBox = {x: g0.card.x + L.start.dx, y: g0.card.y + L.start.dy, w: g0.card.w, h: g0.axis === 'y' ? g0.tab.y + g0.tab.h - g0.card.y : g0.card.h};
      const deskB = D.h - M;
      const ok = g0.axis === 'x'
        ? g0.bbox.y + g0.bbox.h <= deskB - 2 * L.R - 34 && startBox.y + startBox.h <= deskB - 60 && g0.bbox.y >= M + 60 + Math.max(36, ...L.plaques.map(pq => pq.box.h)) && L.start.dx <= -200
        : startBox.y + startBox.h <= L.start.bottom + 1;
      if (ok) break;
      s *= 0.94;
      L = compose(ctx, s);
    }
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    const desk = deskWindow(ctx, {prefix: 'desk', x: L.desk.x, y: L.desk.y, w: L.desk.w, h: L.desk.h, radius: 30, seedKey: 'hr-desk'});
    return g(null,
      desk.surface,
      g({'clip-path': desk.clip},
        g({name: 'guides', opacity: 0}, L.guides),
        L.plaques.map(pq => pq.node),
        L.plate.base,
        g({name: 'card', transform: L.card0}, L.bolts.map(b => b && b.node), L.card),
        L.plate.top,
        L.jawNodes,
        L.lupa.shadows,
        L.armR.arm, L.armR.palm,
        L.lupa.view, L.lupa.prop,
        L.armR.thumb,
        L.armL.arm, L.armL.palm, L.armL.thumb,
      ),
      desk.frame,
      L.who && L.who.node,
      L.tag && L.tag.node,
      L.issues.map(x => x.node),
      L.assumeNotes.map(x => x.node),
      L.notes.map(x => x.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const geo = L.geo;
    // the action (incl. the hand leaving the laid-down magnifier) ends by 0.78; actionProgress caps it part-way
    const capU = lerp(BEATS.action[0], W.withdrawR[1], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};

    // --- card slide: progress pr along the docking axis; the jaws square it up (al) once its edge is in the mouth
    const pr = ease.inOutCubic(seg(a, ...W.slide));
    const al = ease.inOutSine(clamp((pr - L.alignP.from) / L.alignP.span));
    const pose = L.poseAt({p: pr, al});
    nodes.card = {transform: cardTransform(L, pose)};
    const grip = L.worldOf(geo.grip, pose);

    // --- dashed row guides
    const gIn = seg(a, ...W.guidesIn), gOut = seg(a, ...W.guidesOut);
    nodes.guides = {opacity: r(gIn > 0 ? 0.9 * (1 - gOut) : 0, 3)};
    L.guideLines.forEach(gl => { nodes[`guide${gl.i}`] = {'stroke-dashoffset': r(gl.len * (1 - ease.outCubic(gIn)))}; });

    // --- bolts: strictly after docking, in row order, as far as the supplied status says
    const n = geo.n;
    const each = (W.bolts[1] - W.bolts[0]) / (n * 0.7 + 0.3);
    const travel = [], seatedArr = [], shortArr = [];
    L.rows.forEach((rw, i) => {
      const w0 = W.bolts[0] + i * each * 0.7;
      const k = seg(a, w0, w0 + each);
      const target = rw.attr ? (geo.travel[rw.status] ?? 0) : 0;
      let tr = 0;
      if (rw.status === 'as-supplied') tr = target * (reduced ? ease.outCubic(k) : ease.outBack(k));
      else if (rw.status === 'disputed') {
        // slides, bumps at its stop and settles short (no bump when reduced)
        const q = clamp((k - 0.7) / 0.3);
        const jam = reduced ? 0 : Math.sin(q * Math.PI * 2) * 5 * (1 - q);
        tr = target * ease.outCubic(clamp(k / 0.7)) - (k > 0.7 ? jam : 0);
      }
      tr = Math.min(tr, geo.travel.seated + 3);
      travel.push(r(tr, 2));
      if (L.bolts[i]) nodes[`bolt${i}`] = {transform: L.bolts[i].transform(tr)};
      const seated = rw.status === 'as-supplied' && k >= 1;
      seatedArr.push(seated);
      shortArr.push(rw.status === 'disputed' && k >= 1);
      if (rw.cond !== null) nodes[`plt-rim${i}`] = {opacity: seated ? 1 : 0};
      if (rw.status === 'disputed') nodes[`plt-doubt${i}`] = {opacity: r(seg(k, 0.72, 0.95), 3)};
      if (rw.status === 'pending') nodes[`plt-ghost${i}`] = {opacity: r(0.9 * seg(k, 0, 0.6), 3)};
    });

    // --- left hand: rest → tab → rides the tab while sliding → lets go → rest
    const reachL = ease.inOutCubic(seg(a, ...W.reachL));
    const rel = ease.inOutCubic(seg(a, ...W.release));
    const onCard = a >= W.slide[0] && a < W.release[0];
    let handL;
    if (a < W.slide[0]) handL = mix(L.restL, grip, reachL);
    else if (onCard) handL = grip;
    else {
      const off = geo.axis === 'x' ? {x: -46, y: 40} : {x: -10, y: 70};
      const lift = {x: grip.x + off.x, y: grip.y + off.y};
      handL = rel < 0.35 ? mix(grip, lift, rel / 0.35) : mix(lift, L.restL, (rel - 0.35) / 0.65);
    }
    const pl = L.armL.pose(L.shoulderL, handL, 1);
    Object.assign(nodes, pl.nodes);

    // --- right hand + magnifier (the lens only leaves the table after every bolt has finished)
    const reachR = ease.inOutCubic(seg(a, ...W.reachR));
    const carry = ease.inOutSine(seg(a, ...W.carry)); // gentle peak speed: the lens travels far in tall boxes
    const down = ease.inOutCubic(seg(a, ...W.setDown));
    const lift = clamp(carry * 3) * (1 - 0.75 * down); // lifted off the table, then laid down on the docked assembly
    const ang = lerp(L.rest.angle, L.holdAngle, carry);
    const lc = {x: lerp(L.rest.c.x, L.J.x, carry), y: lerp(L.rest.c.y, L.J.y, carry) - Math.sin(Math.PI * carry) * 40};
    const lf = L.lupa.frame(lc, ang, lift, 1);
    const lupaGrip = lf.grip;
    delete lf.grip;
    Object.assign(nodes, lf);
    const holding = a >= W.reachR[1] && a < W.withdrawR[0];
    const wd = ease.inOutSine(seg(a, ...W.withdrawR));
    const handR = a < W.reachR[1] ? mix(L.restR, lupaGrip, reachR) : a < W.withdrawR[0] ? lupaGrip : mix(lupaGrip, L.restR, wd);
    const prr = L.armR.pose(L.shoulderR, handR, -1);
    Object.assign(nodes, prr.nodes);

    // --- chips and editorial layer
    if (L.who) nodes.who = {opacity: r(seg(u, ...W.chips), 3)};
    L.plaques.forEach((pq, i) => { nodes[`plaque${i}`] = {opacity: r(seg(u, W.chips[0] + 0.02 * i, W.chips[1] + 0.02 * i), 3)}; });
    if (L.tag) nodes['state-tag'] = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    L.issues.forEach(x => Object.assign(nodes, x.frame(done ? seg(u, ...W.issue) : 0)));
    L.assumeNotes.forEach(x => Object.assign(nodes, x.frame(done ? seg(u, ...W.issue) : 0)));
    L.notes.forEach(x => Object.assign(nodes, x.frame(done ? seg(u, ...W.note) : 0)));

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const rowOffset = Math.max(...geo.cells.map(c => {
      const q = L.worldOf(c.port, pose);
      return geo.axis === 'x' ? Math.abs(q.y - c.sock.y) : Math.abs(q.x - c.sock.x);
    }));
    const docked = pr >= 1;
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      axis: geo.axis,
      textSize: r(L.s, 2),
      plateBox: {x: r(geo.plate.x), y: r(geo.plate.y), w: r(geo.plate.w), h: r(geo.plate.h)},
      cardBox: {x: r(geo.card.x), y: r(geo.card.y), w: r(geo.card.w), h: r(geo.card.h)},
      startOffset: {x: r(L.start.dx), y: r(L.start.dy)},
      card: P2(L.worldOf(L.cc, pose)),
      cardAngle: r(pose.rot, 2),
      slide: r(pr, 3),
      align: r(al, 3),
      rowOffset: r(rowOffset, 2),
      docked,
      handL: P2(handL),
      gripL: P2(grip),
      handOnCard: onCard,
      handR: P2(handR),
      lupaGrip: P2(lupaGrip),
      lupa: P2(lc),
      lupaHeld: holding,
      lupaOverFocus: carry >= 1,
      lupaLaidDown: down >= 1,
      focusRow: L.focus,
      statuses: L.rows.map(rw => rw.status),
      travel,
      seated: seatedArr,
      stoppedShort: shortArr,
      boltsMovedBeforeDock: !docked && travel.some(v => v > 0.01),
      regGap: L.rows.map((rw, i) => (rw.cond === null || !rw.attr ? null : r(Math.max(0, geo.travel.seated - travel[i]), 1))),
      allReached: pl.reached && prr.reached,
      reach: {left: pl.reached, right: prr.reached},
      actionCapped: p.actionProgress < 1 && u > capU,
    };
    L.rows.forEach((rw, i) => {
      if (L.bolts[i]) semantic[`tip${i}`] = P2(L.worldOf(L.bolts[i].tipAt(travel[i]), pose));
    });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-01-story',
    title: 'Fact and rule — a fact card slides into a rule plate and its attributes line up',
    titleEs: 'Hecho y regla — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho y regla',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down worktable: an analyst’s hand slides a loose fact card (attributes with profiled latch bolts) into the guide jaws of a rule plate (conditions with matching sockets); the jaws square it up so the rows align, then each bolt crosses the gap as its supplied status says (seated, stopping short with a question mark, or retracted). The other hand holds a magnifier whose glass shows a real enlarged copy of the focus joint. Statuses are as supplied; no rule is said to apply.',
    tags: ['reasoning', 'fact', 'rule', 'attributes', 'alignment', 'connector', 'magnifier', 'disputed', 'hands', 'desk'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-y-regla.js', 'src/primitives/desk.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HR_STRINGS,
  scene,
});
