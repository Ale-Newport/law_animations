/**
 * LAW-0109 — Premisa oculta · story
 *
 * Storyboard (top-down worktable; one analyst whose two arms enter from the
 * frame edge, body off-frame):
 *  0.00–0.15 rest     A dark reading board lies on the table. On it the FACT
 *                     card and the CONCLUSION card (texts as supplied) are
 *                     pushed together, edge to edge: the argument reads as one
 *                     step. Each card has a pull tab on its outer edge and a
 *                     brass hinge (the connector) folded back on its inner
 *                     edge. A magnifier lies on the table. Both hands reach
 *                     the two pull tabs.
 *  0.15–0.42 action   The hands pull the two cards apart. A GAP opens between
 *                     fact and conclusion; it uncovers a recessed pocket in the
 *                     board and, lying in it, an intermediate card — the
 *                     premise supplied by the author — revealed strip by strip
 *                     as the gap widens (nothing of it shows before).
 *  0.42–0.73 complete The hands let go. The card's SUPPLIED status decides the
 *                     rest, never an inference: stated → a printed card; both
 *                     hinge leaves swing over the joints and latch onto it, and
 *                     it lifts flush (the walk is continuous); left unstated →
 *                     a pencil card with a dashed edge; the hinges stay folded
 *                     and it stays loose in its pocket. The right hand then
 *                     picks up the magnifier and holds it over the revealed
 *                     card (the glass shows a real enlarged copy) and puts it
 *                     back on its spot.
 *  0.73–1.00 hold     State key "Premise stated / left unstated · as supplied ·
 *                     no conclusion drawn", the supplied issue and assumption
 *                     notes and any editorial annotations. Nothing says whether
 *                     the reasoning holds.
 * Wide boxes: the walk runs left → right and the arms come up from the bottom
 * edge; square and tall boxes: the walk runs top → bottom (fact on top) and
 * the arms enter from the left and right edges.
 * Legal content: fictional, jurisdiction unspecified; the three texts and the
 * premise's status are the author's; nothing is inferred.
 * @module animations/reasoning/LAW-0109
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, dist} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {placeChip, placeChipAny, calloutChip, segPolys, leaderPoly, hitsAny, balancedWidth} from '../causation/kits/place.js';
import {
  poFields, PO_STRINGS, DEFAULT_CONTENT, walkGeometry, shiftWalk, cardArt, boardArt, recessShade, hingeArt, walkCopy,
  lupaArt, notesColumn, notesSize, keyChip, centerOf, unionRect, unitsPer1080px, markChip, markCallout,
} from './kits/premisa-oculta.js';

const ID = 'LAW-0109';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  chips: [0.01, 0.1], reach: [0.03, 0.145], pull: [0.15, 0.41],
  release: [0.42, 0.5], latchF: [0.44, 0.52], latchC: [0.48, 0.56], lift: [0.55, 0.61],
  reachR: [0.45, 0.53], carry: [0.53, 0.595], look: [0.595, 0.64], back: [0.64, 0.69], withdrawR: [0.695, 0.77],
  key: [0.74, 0.8], notes: [0.76, 0.84], annot: [0.8, 0.9],
};

const sceneSchema = {
  ...poFields,
  analyst: party,
  actorLabels: obj('Role caption shown in the analyst’s chip', {a: str('Caption for the analyst (descriptive)', 60)}),
  objectLabels: obj('Kind labels printed on the three cards', {
    fact: str('Kind label on the fact card', 32),
    premise: str('Kind label on the intermediate card', 40),
    conclusion: str('Kind label on the conclusion card', 32),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['fact', 'premise', 'conclusion', 'connector', 'lupa']), 0, 2),
  finalState: oneOf('Status of the intermediate premise supplied by the author for the final hold: stated (printed card, hinges latch it into the walk) or unstated (pencil card left loose in its pocket). Descriptive only; no conclusion is drawn in either', ['stated', 'unstated']),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  analyst: {name: 'Rin', role: 'Analyst'},
  actorLabels: {a: 'Analyst · reads the argument'},
  objectLabels: {fact: 'Fact', premise: 'Intermediate premise', conclusion: 'Conclusion'},
  actionProgress: 1,
  annotations: [],
  finalState: 'unstated',
};

const SHAPES = {
  landscape: {axis: 'x', size: 58, side: 70},
  square: {axis: 'x', size: 48, side: 30},
  portrait: {axis: 'y', size: 58, maxW: 860},
};
const M = 14;
const P2 = q => ({x: r(q.x), y: r(q.y)});

function elbowOf(pose) {
  const n = pose.nodes;
  const key = Object.keys(n).find(k => k.endsWith('-upper'));
  return {x: n[key].x2, y: n[key].y2};
}

/** Geometry, arms and fixed props for one text size. */
function compose(ctx, s) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = SHAPES[ctx.view.shape];
  const X = S.axis === 'x';
  const u = unitsPer1080px(ctx);
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const stated = p.finalState === 'stated';
  const desk = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const deskR = desk.x + desk.w, deskB = desk.y + desk.h;
  const common = {
    s, u, show: showKey, maxLines: X ? 5 : 6,
    kinds: {fact: p.objectLabels.fact || t.factKind, premise: p.objectLabels.premise || t.premiseKind, conclusion: p.objectLabels.conclusion || t.conclusionKind},
    texts: {fact: p.facts, premise: p.rules, conclusion: p.conclusion},
  };
  // notes: supplied issues and assumptions, and the state key (≥ ~21 px, never above the card text)
  // (capped below at the smallest fitted card text, so no chip ever reads larger than the cards)
  let ns = Math.min(s, Math.max(s * 0.6, 21 * u));
  const items = showAll ? [...p.issues.map(q => ({kind: 'issue', text: `${t.issue}: ${q}`})), ...p.assumptions.map(a => ({kind: 'assumed', text: `${t.assumed}: ${a}`}))] : [];
  const iss = items.filter(it => it.kind === 'issue'), ass = items.filter(it => it.kind === 'assumed');
  const R = clamp(s * 1.75, 56, 96);
  const Lh = R * 1.5;
  const restAngle = 38;
  const lupaDrop = Math.max(R, Math.sin(restAngle * Math.PI / 180) * (R + Lh) * 1.02 + 14) + 8;
  const keyProbe = w => (showKey ? keyChip(ctx, stated ? 'stated' : 'unstated', {x: 0, y: 0, size: ns, maxWidth: w, maxLines: 3}) : null);
  const tl = s * 1.15;
  let g0, bandH, band;
  if (X) {
    const cw = (desk.w - 2 * S.side - 2 * tl - 2 * Math.max(10, s * 0.42)) / 3;
    g0 = walkGeometry(ctx, {...common, axis: 'x', x: 0, y: 0, cw});
    ns = Math.min(ns, ...g0.bodySizes);
    // top band: issues (left) | state key (centre, over the premise) | assumptions (right)
    const keyW = Math.min(cw * 1.2, desk.w * 0.36);
    const kp = keyProbe(keyW);
    const colW = (desk.w - 40 - (kp ? kp.box.w + 40 : 0)) / 2;
    const nL = notesSize(ctx, iss, colW, ns, 4), nR = notesSize(ctx, ass, colW, ns, 4);
    bandH = Math.max(kp ? kp.box.h : 0, nL.h, nR.h);
    band = {kp, keyW, colW, nL, nR};
  } else {
    const width = Math.min(S.maxW, desk.w - 2 * (tl + 60));
    g0 = walkGeometry(ctx, {...common, axis: 'y', x: 0, y: 0, width});
    ns = Math.min(ns, ...g0.bodySizes);
    const keyW = Math.min(desk.w - 60, width + 2 * tl + 80);
    const kp = keyProbe(keyW);
    const colW = (desk.w - 60) / 2;
    const nL = notesSize(ctx, iss, colW, ns, 5), nR = notesSize(ctx, ass, colW, ns, 5);
    const nh = Math.max(nL.h, nR.h);
    bandH = (kp ? kp.box.h : 0) + (nh ? (kp ? 14 : 0) + nh : 0);
    band = {kp, keyW, colW, nL, nR, width};
  }
  // vertical stack: notes band · walk (board) · magnifier band; centred, leftover split around the walk
  const boardH = g0.board.h;
  const gapA = bandH ? 30 : 0, gapB = 26;
  const stackH = bandH + gapA + boardH + gapB + R + lupaDrop;
  const room = desk.h - 36;
  const free = Math.max(0, room - stackH);
  const bandTop = desk.y + 18 + free * 0.2;
  const boardTop = bandTop + bandH + gapA + free * 0.3;
  const x0 = X ? desk.x + S.side + tl : desk.x + (desk.w - band.width) / 2;
  const geo = shiftWalk(g0, x0 - g0.boxes.fact.x, boardTop + (g0.boxes.fact.y - g0.board.y) - g0.boxes.fact.y);
  const pc = centerOf(geo.boxes.premise);
  let keyAt, notesAt;
  if (X) {
    const {kp, keyW, colW, nL, nR} = band;
    keyAt = kp ? {x: pc.x, y: bandTop + (bandH - kp.box.h) / 2, w: keyW} : null;
    notesAt = {
      left: {x: desk.x + 20, y: bandTop, w: colW, items: iss, h: nL.h, truncated: nL.truncated},
      right: {x: deskR - 20 - colW, y: bandTop, w: colW, items: ass, h: nR.h, truncated: nR.truncated},
    };
  } else {
    const {kp, keyW, colW, nL, nR} = band;
    keyAt = kp ? {x: desk.x + desk.w / 2, y: bandTop, w: keyW} : null;
    const ny = bandTop + (kp ? kp.box.h + 14 : 0);
    notesAt = {
      left: {x: desk.x + 20, y: ny, w: colW, items: iss, h: nL.h, truncated: nL.truncated},
      right: {x: desk.x + desk.w / 2 + 10, y: ny, w: colW, items: ass, h: nR.h, truncated: nR.truncated},
    };
  }
  const F = geo.boxes.fact, C = geo.boxes.conclusion;
  const cl = geo.closed;
  // magnifier: rest spot in the band below the walk (under the premise, a little towards the conclusion side)
  const boardB = geo.board.y + geo.board.h;
  const rest = {c: {x: pc.x + R * 0.3, y: boardB + gapB + free * 0.15 + R}, angle: restAngle};
  const hold = {c: pc, angle: X ? 58 : 30};
  const gripAt = (c, ang, lift) => {
    const k = 1 + 0.07 * lift;
    const a = (ang * Math.PI) / 180;
    return {x: c.x + Math.cos(a) * (R + Lh * 0.6) * k, y: c.y + Math.sin(a) * (R + Lh * 0.6) * k};
  };
  const restGrip = gripAt(rest.c, rest.angle, 0);
  const holdGrip = gripAt(hold.c, hold.angle, 1);
  const handleEnd = (c, ang) => ({x: c.x + Math.cos(ang * Math.PI / 180) * (R + Lh) * 1.02, y: c.y + Math.sin(ang * Math.PI / 180) * (R + Lh) * 1.02});
  const lupaBottom = rest.c.y + lupaDrop;
  const viaR = X ? {x: (geo.grips.conclusion.x + restGrip.x) / 2 + 60, y: boardB + 40} : {x: deskR - 80, y: Math.max(geo.grips.conclusion.y, restGrip.y) + 30};
  const fitsBase = stackH <= room && !geo.truncated && geo.bbox.x >= desk.x + 8 && geo.bbox.x + geo.bbox.w <= deskR - 8 && !band.nL.truncated && !band.nR.truncated
    && F.x + cl.fact.dx >= desk.x && C.x + C.w + cl.conclusion.dx <= deskR;

  // --- arms
  const look = actorLook(ctx, p.analyst, 0);
  const gripF1 = geo.grips.fact, gripC1 = geo.grips.conclusion;
  const gripF0 = {x: gripF1.x + cl.fact.dx, y: gripF1.y + cl.fact.dy};
  const gripC0 = {x: gripC1.x + cl.conclusion.dx, y: gripC1.y + cl.conclusion.dy};
  let shoulderL, restL, shoulderR, restR, bendL, bendR;
  if (X) {
    shoulderL = {x: Math.max(desk.x + 170, gripF0.x - 30), y: deskB + 190};
    restL = {x: shoulderL.x - 40, y: deskB - 64};
    shoulderR = {x: Math.min(deskR - 170, gripC0.x + 30), y: deskB + 190};
    restR = {x: shoulderR.x + 50, y: deskB - 60};
    bendL = 1; bendR = -1;
  } else {
    shoulderL = {x: desk.x - 250, y: gripF0.y + 150};
    restL = {x: desk.x + 60, y: shoulderL.y + 30};
    // shoulder off the right edge at the conclusion's level (the upper arm never lies along the bottom edge)
    shoulderR = {x: deskR + 230, y: Math.min(gripC1.y + 150, deskB - 60)};
    restR = {x: deskR - 60, y: shoulderR.y + 30};
    bendL = -1; bendR = -1;
  }
  const HAND = 24 * 1.3 * (50 / 46);
  const need = (sh, pts) => Math.max(...pts.map(q => dist(sh, q))) + 30 - HAND;
  const nL = need(shoulderL, [gripF0, gripF1, restL]);
  const nR = need(shoulderR, [gripC0, gripC1, restGrip, holdGrip, restR, viaR]);
  const armL = topArm(ctx, {name: 'armL', skin: look.skin, sleeve: look.outfit, handed: 'right', width: 50, upper: nL * 0.52, lower: nL * 0.48});
  const armR = topArm(ctx, {name: 'armR', skin: look.skin, sleeve: look.outfit, handed: 'left', width: 50, upper: nR * 0.52, lower: nR * 0.48});

  // --- analyst chip on the bottom edge, clear of the arms in every sampled pose, the lupa and the walk
  let who = null;
  const whoSize = ns;
  if (showAll) {
    const txt = [p.analyst.name, p.actorLabels.a].filter(Boolean).join(' · ');
    const armPts = (arm, sh, bend, tgs) => tgs.flatMap(tg => { const ps = arm.pose(sh, tg, bend); return segPolys([sh, elbowOf(ps), ps.hand], 72); });
    const obst = [
      ...armPts(armL, shoulderL, bendL, [restL, gripF0, mix(gripF0, gripF1, 0.5), gripF1]),
      ...armPts(armR, shoulderR, bendR, [restR, gripC0, mix(gripC0, gripC1, 0.5), gripC1, restGrip, holdGrip]),
      {x: rest.c.x - R - 14, y: rest.c.y - R - 14, w: 2 * R + 28, h: 2 * R + 28},
      ...segPolys([rest.c, handleEnd(rest.c, rest.angle)], 40),
      geo.bbox,
    ];
    let best = null;
    for (const [mw, ml] of [[520, 1], [420, 2], [330, 3], [520, 2], [420, 3], [330, 4], [260, 5], [420, 4]]) {
      const bw0 = chip(ctx, txt, {x: 0, y: 0, maxWidth: mw, size: whoSize, minSize: whoSize, maxLines: ml});
      if (bw0.fit.truncated) continue;
      const mwB = balancedWidth(ctx, txt, {maxWidth: mw, size: whoSize, minSize: whoSize, maxLines: ml});
      const c0 = chip(ctx, txt, {x: 0, y: 0, maxWidth: mwB, size: whoSize, minSize: whoSize, maxLines: ml});
      if (c0.fit.truncated || c0.fit.lines.length !== bw0.fit.lines.length) continue;
      const bw = c0.box.w, bh = c0.box.h;
      for (const lift of [0, 30, 60, 100, 150]) {
        const y = deskB - 16 - bh - lift;
        for (let x = desk.x + 16; x + bw <= deskR - 16 && !best; x += 8) {
          if (!hitsAny({x, y, w: bw, h: bh}, obst, 6)) best = {x, y, mw: mwB, ml};
        }
        if (best) break;
      }
      if (best) break;
    }
    if (!best) best = {x: desk.x + 16, y: deskB - 16 - chip(ctx, txt, {x: 0, y: 0, maxWidth: 420, size: whoSize, minSize: whoSize, maxLines: 6}).box.h, mw: 420, ml: 6};
    who = chip(ctx, txt, {x: best.x, y: best.y, maxWidth: best.mw, size: whoSize, minSize: whoSize, maxLines: best.ml, name: 'who', fill: ctx.theme.card, stroke: ctx.theme.ink});
    markChip(who.node);
    who.clear = !hitsAny(who.box, obst, 0);
  }
  return {
    s, u, X, geo, desk, stated, R, Lh, rest, hold, restGrip, holdGrip, handleEnd, lupaBottom, look, armL, armR, shoulderL, shoulderR, restL, restR, bendL, bendR,
    gripF0, gripF1, gripC0, gripC1, keyAt, notesAt, ns, who, pc, viaR,
    fits: fitsBase && lupaBottom <= deskB - 8,
  };
}

/** Nodes, notes and editorial label placement for the composed geometry. */
function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const geo = L.geo;
  const look = L.stated ? 'stated' : 'unstated';
  L.board = boardArt(ctx, geo, {name: 'board', pocketName: 'pocket', seedKey: 'po-board'});
  L.premise = cardArt(ctx, geo, 'premise', {name: 'premise', prefix: 'prm', look});
  L.recess = recessShade(ctx, geo, 'recess');
  L.hF = hingeArt(ctx, geo, 'fact', {name: 'hingeF'});
  L.hC = hingeArt(ctx, geo, 'conclusion', {name: 'hingeC'});
  L.fact = g({name: 'fact', transform: T(geo.closed.fact.dx, geo.closed.fact.dy)}, cardArt(ctx, geo, 'fact', {prefix: 'fct'}), L.hF.fixed, L.hF.leaf, L.hF.knuckle);
  L.conc = g({name: 'conc', transform: T(geo.closed.conclusion.dx, geo.closed.conclusion.dy)}, cardArt(ctx, geo, 'conclusion', {prefix: 'cnc'}), L.hC.fixed, L.hC.leaf, L.hC.knuckle);
  const copy = walkCopy(ctx, geo, {look, k: L.stated ? 1 : -1, prefix: 'lcopy'});
  L.lupa = lupaArt(ctx, {name: 'lupa', R: L.R, handle: L.Lh, copy, zoom: 1.7, lensFill: shade(th.woodTop, -0.04)});
  // notes (hold): issues left, assumptions right, state key over the premise
  const mk = (A, name, align) => (A.items.length ? notesColumn(ctx, A.items, {x: A.x, y: A.y, w: A.w, size: L.ns, maxLines: L.X ? 4 : 5, name, align}) : null);
  L.notesL = mk(L.notesAt.left, 'notesL', 'left');
  L.notesR = mk(L.notesAt.right, 'notesR', L.X ? 'right' : 'left');
  L.key = L.keyAt ? keyChip(ctx, look, {x: L.keyAt.x, y: L.keyAt.y, anchor: 'middle', size: L.ns, maxWidth: L.keyAt.w, maxLines: 3, name: 'key'}) : null;
  // editorial annotations: placed in free space, clear of the walk, the lupa (both spots), the notes and the arms at rest
  L.annots = [];
  if (ctx.show('all') && p.annotations.length) {
    const armRFin = L.armR.pose(L.shoulderR, L.restR, L.bendR);
    const armLFin = L.armL.pose(L.shoulderL, L.restL, L.bendL);
    const fixed = [geo.bbox, {x: L.rest.c.x - L.R - 10, y: L.rest.c.y - L.R - 10, w: 2 * L.R + 20, h: 2 * L.R + 20}, ...segPolys([L.rest.c, L.handleEnd(L.rest.c, L.rest.angle)], 40),
      ...segPolys([L.shoulderR, elbowOf(armRFin), L.restR], 76), ...segPolys([L.shoulderL, elbowOf(armLFin), L.restL], 76),
      L.who && L.who.box, L.key && L.key.box, ...(L.notesL ? L.notesL.boxes : []), ...(L.notesR ? L.notesR.boxes : [])].filter(Boolean);
    const bounds = {x: L.desk.x + 12, y: L.desk.y + 12, w: L.desk.w - 24, h: L.desk.h - 24};
    const placed = [];
    p.annotations.forEach((an, i) => {
      const tg = annotationTarget(L, an.target);
      const mw = Math.min(520, L.desk.w * 0.42);
      const fits = [[mw, 2], [mw * 0.75, 3], [mw * 0.55, 4], [mw, 3], [mw, 4]].map(([wd, ml]) => ({wd, ml, c: chip(ctx, an.text, {x: 0, y: 0, maxWidth: wd, size: L.ns, maxLines: ml})}))
        .filter(f => f.c.fit.size >= L.ns - 0.01 && !f.c.fit.truncated).map(f => ({...f, box: f.c.box}));
      if (!fits.length) fits.push({wd: mw, ml: 5, box: chip(ctx, an.text, {x: 0, y: 0, maxWidth: mw, size: L.ns, maxLines: 5}).box});
      const po = {obstacles: [...fixed, ...placed], bounds, own: tg.own, order: tg.order, gaps: [34, 60, 95, 135, 180, 230, 290, 360, 440, 520, 620, 740]};
      const res = placeChipAny(fits.map(f => f.box), tg.pt, po) || {...placeChip(fits[0].box, tg.pt, {...po, leastBad: true}), k: 0};
      const f = fits[res.k];
      const c = markCallout(calloutChip(ctx, {name: `annot${i}`, text: an.text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: f.wd, maxLines: f.ml, size: L.ns, color: th.ink}));
      placed.push(c.box, leaderPoly(c.box, res.end));
      L.annots.push(c);
    });
  }
  // parked-prop check: the magnifier at rest (start and hold) touches no card, note, key or chip
  const lupaBox = {x: L.rest.c.x - L.R - 8, y: L.rest.c.y - L.R - 8, w: 2 * L.R + 16, h: 2 * L.R + 16};
  const lupaPolys = [lupaBox, ...segPolys([L.rest.c, L.handleEnd(L.rest.c, L.rest.angle)], 30)];
  const others = [geo.board, ...Object.values(geo.boxes), L.key && L.key.box, L.who && L.who.box, ...(L.notesL ? L.notesL.boxes : []), ...(L.notesR ? L.notesR.boxes : []), ...L.annots.map(a => a.box)].filter(Boolean);
  L.parkedClear = !others.some(o => hitsAny(o, lupaPolys, 0));
  return L;
}

/** Annotation target point on a free side of its object, the objects its leader may enter, and the preferred chip sides. */
function annotationTarget(L, target) {
  const geo = L.geo;
  const b = geo.boxes;
  const B = geo.board;
  if (L.X) {
    if (target === 'fact') return {pt: {x: b.fact.x + b.fact.w * 0.3, y: B.y - 2}, own: [geo.bbox], order: ['above', 'aboveL', 'aboveR']};
    if (target === 'conclusion') return {pt: {x: b.conclusion.x + b.conclusion.w * 0.7, y: B.y - 2}, own: [geo.bbox], order: ['above', 'aboveR', 'aboveL']};
    if (target === 'lupa') return {pt: {x: L.rest.c.x, y: L.rest.c.y, r: L.R + 10}, own: [], order: ['left', 'leftLow', 'right', 'rightLow', 'belowL', 'below']};
    if (target === 'connector') return {pt: {x: geo.hinge.fact.x, y: B.y + B.h + 2}, own: [geo.bbox], order: ['belowL', 'below', 'leftLow']};
    // the premise: its lower edge, left of the magnifier's column (a leader never runs over the resting magnifier)
    return {pt: {x: b.premise.x + b.premise.w * 0.18, y: B.y + B.h + 2}, own: [geo.bbox], order: ['belowL', 'below', 'leftLow']};
  }
  // tall walk: leaders end in the free margins beside the board (never across a card's text)
  if (target === 'fact') return {pt: {x: b.fact.x + b.fact.w * 0.3, y: B.y - 2}, own: [geo.bbox], order: ['above', 'aboveL', 'aboveR']};
  if (target === 'conclusion') return {pt: {x: b.conclusion.x + b.conclusion.w * 0.3, y: B.y + B.h + 2}, own: [geo.bbox], order: ['below', 'belowL', 'belowR']};
  if (target === 'lupa') return {pt: {x: L.rest.c.x, y: L.rest.c.y, r: L.R + 10}, own: [], order: ['left', 'leftLow', 'right', 'rightLow', 'leftHigh']};
  if (target === 'connector') return {pt: {x: B.x + B.w + 8, y: geo.hinge.conclusion.y}, own: [], order: ['belowR', 'below', 'rightLow']};
  // the premise: the free right-hand margin at its level (the left margin holds the resting left arm)
  return {pt: {x: B.x + B.w + 10, y: L.pc.y}, own: [], order: ['aboveR', 'above', 'belowR', 'below', 'rightHigh']};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const S = SHAPES[ctx.view.shape];
    let s = S.size;
    let L = compose(ctx, s);
    for (let it = 0; it < 24 && !L.fits; it++) {
      s *= 0.95;
      L = compose(ctx, s);
    }
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    const desk = deskWindow(ctx, {prefix: 'desk', x: L.desk.x, y: L.desk.y, w: L.desk.w, h: L.desk.h, radius: 30, seedKey: 'po-desk'});
    return g(null,
      desk.surface,
      g({'clip-path': desk.clip},
        L.board.base, L.board.pocket,
        h('defs', null, h('clipPath', {id: ctx.id('gapclip')}, h('rect', {name: 'gapclip-r', x: 0, y: 0, width: 0, height: 0}))),
        // the intermediate card is only visible through the gap (the cards on either side cover the rest)
        g({'clip-path': ctx.ref('gapclip')}, g({name: 'premise-g'}, L.premise, L.recess)),
        L.fact, L.conc,
        L.lupa.shadows,
        L.armR.arm, L.armR.palm,
        L.lupa.view, L.lupa.prop,
        L.armR.thumb,
        L.armL.arm, L.armL.palm, L.armL.thumb,
      ),
      desk.frame,
      L.who && g({'data-role': 'content'}, L.who.node),
      L.key && L.key.node,
      L.notesL && L.notesL.node,
      L.notesR && L.notesR.node,
      L.annots.map(a => g({'data-role': 'content'}, a.node)),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const geo = L.geo;
    const capU = lerp(BEATS.action[0], W.withdrawR[1], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};

    // --- the pull: both cards leave the premise's centre along the walk axis
    const pr = ease.inOutCubic(seg(a, ...W.pull));
    const off = w => ({dx: geo.closed[w].dx * (1 - pr), dy: geo.closed[w].dy * (1 - pr)});
    const oF = off('fact'), oC = off('conclusion');
    nodes.fact = {transform: T(oF.dx, oF.dy)};
    nodes.conc = {transform: T(oC.dx, oC.dy)};
    const gripF = {x: L.gripF1.x + oF.dx, y: L.gripF1.y + oF.dy};
    const gripC = {x: L.gripC1.x + oC.dx, y: L.gripC1.y + oC.dy};
    // how much of the premise card the gap uncovers (0 … 1)
    const Pm = geo.boxes.premise;
    const extent = L.X ? Pm.w : Pm.h;
    const gapW = L.X ? (geo.boxes.conclusion.x + oC.dx) - (geo.boxes.fact.x + geo.boxes.fact.w + oF.dx) : (geo.boxes.conclusion.y + oC.dy) - (geo.boxes.fact.y + geo.boxes.fact.h + oF.dy);
    const revealed = clamp(gapW / extent);
    const fR = geo.boxes.fact.x + geo.boxes.fact.w + oF.dx, cL = geo.boxes.conclusion.x + oC.dx;
    const fB = geo.boxes.fact.y + geo.boxes.fact.h + oF.dy, cT = geo.boxes.conclusion.y + oC.dy;
    const BB = geo.board;
    nodes['gapclip-r'] = L.X
      ? {x: r(fR), y: r(BB.y - 40), width: r(Math.max(0, cL - fR)), height: r(BB.h + 80)}
      : {x: r(BB.x - 40), y: r(fB), width: r(BB.w + 80), height: r(Math.max(0, cT - fB))};

    // --- hinges: latch onto a stated premise (fact side first), stay folded for an unstated one
    const kF = L.stated ? -1 + 2 * (reduced ? ease.outCubic(seg(a, ...W.latchF)) : ease.inOutCubic(seg(a, ...W.latchF))) : -1;
    const kC = L.stated ? -1 + 2 * (reduced ? ease.outCubic(seg(a, ...W.latchC)) : ease.inOutCubic(seg(a, ...W.latchC))) : -1;
    Object.assign(nodes, L.hF.frame(kF), L.hC.frame(kC));
    const lift = L.stated ? ease.inOutCubic(seg(a, ...W.lift)) : 0;
    nodes.recess = {opacity: r(1 - lift, 3)};
    nodes['premise-g'] = {transform: lift > 0 ? `translate(${r(-2 * lift)} ${r(-3 * lift)})` : 'translate(0 0)'};

    // --- hands: rest → tabs → ride the tabs while pulling → let go → (right) magnifier → rest
    const reach = ease.inOutCubic(seg(a, ...W.reach));
    const rel = ease.inOutCubic(seg(a, ...W.release));
    const onTabs = a >= W.pull[0] && a < W.release[0];
    let handL;
    if (a < W.pull[0]) handL = mix(L.restL, gripF, reach);
    else if (onTabs) handL = gripF;
    else {
      const away = L.X ? {x: gripF.x - 30, y: gripF.y + 70} : {x: gripF.x - 70, y: gripF.y + 20};
      handL = rel < 0.35 ? mix(gripF, away, rel / 0.35) : mix(away, L.restL, (rel - 0.35) / 0.65);
    }
    const pl = L.armL.pose(L.shoulderL, handL, L.bendL);
    Object.assign(nodes, pl.nodes);

    // magnifier: lifted from its spot, held over the revealed card, put back
    const carry = ease.inOutSine(seg(a, ...W.carry));
    const back = ease.inOutSine(seg(a, ...W.back));
    const q = carry * (1 - back);
    const liftL = clamp(q * 3);
    const ang = lerp(L.rest.angle, L.hold.angle, q);
    const lc = {x: lerp(L.rest.c.x, L.hold.c.x, q), y: lerp(L.rest.c.y, L.hold.c.y, q) - Math.sin(Math.PI * q) * 30};
    const lf = L.lupa.frame(lc, ang, liftL, 1);
    const lupaGrip = lf.grip;
    delete lf.grip;
    Object.assign(nodes, lf);
    const reachR = ease.inOutCubic(seg(a, ...W.reachR));
    const wd = ease.inOutSine(seg(a, ...W.withdrawR));
    let handR;
    if (a < W.pull[0]) handR = mix(L.restR, gripC, reach);
    else if (onTabs) handR = gripC;
    else if (a < W.reachR[1]) {
      // let go of the tab and reach the magnifier's handle, passing below the board (never over the cards' text)
      const k = reachR;
      handR = mix(mix(gripC, L.viaR, k), mix(L.viaR, lupaGrip, k), k);
    } else if (a < W.withdrawR[0]) handR = lupaGrip;
    else handR = mix(lupaGrip, L.restR, wd);
    const prr = L.armR.pose(L.shoulderR, handR, L.bendR);
    Object.assign(nodes, prr.nodes);
    const lupaHeld = a >= W.reachR[1] && a < W.withdrawR[0];

    // --- chips and editorial layer
    if (L.who) nodes.who = {opacity: r(seg(u, ...W.chips), 3)};
    if (L.key) nodes.key = {opacity: done ? r(seg(u, ...W.key), 3) : 0};
    if (L.notesL) nodes.notesL = {opacity: done ? r(seg(u, ...W.notes), 3) : 0};
    if (L.notesR) nodes.notesR = {opacity: done ? r(seg(u, ...W.notes), 3) : 0};
    L.annots.forEach((x, i) => Object.assign(nodes, x.frame(done ? seg(u, W.annot[0] + i * 0.03, W.annot[1] + i * 0.03) : 0)));

    // --- semantics
    const fc = centerOf(geo.boxes.fact), cc = centerOf(geo.boxes.conclusion);
    const tipF = L.hF.tipAt(kF), tipC = L.hC.tipAt(kC);
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      axis: geo.axis,
      finalState: p.finalState,
      premiseLook: L.stated ? 'stated' : 'unstated',
      textSize: r(L.s, 2),
      wordSplit: !!L.geo.wordSplit,
      pull: r(pr, 3),
      gap: r(gapW, 2),
      revealed: r(revealed, 3),
      premiseHidden: gapW <= 0.5,
      fact: P2({x: fc.x + oF.dx, y: fc.y + oF.dy}),
      conclusion: P2({x: cc.x + oC.dx, y: cc.y + oC.dy}),
      premiseCenter: P2(L.pc),
      kF: r(kF, 3), kC: r(kC, 3),
      latched: kF >= 1 && kC >= 1,
      hingesFolded: kF <= -1 && kC <= -1,
      leafTipF: P2({x: tipF.x + oF.dx, y: tipF.y + oF.dy}),
      leafTipC: P2({x: tipC.x + oC.dx, y: tipC.y + oC.dy}),
      recessed: r(1 - lift, 3),
      handL: P2(handL), handR: P2(handR),
      gripF: P2(gripF), gripC: P2(gripC),
      handsOnTabs: onTabs,
      lupa: P2(lc),
      lupaGrip: P2(lupaGrip),
      lupaHeld,
      lupaOverPremise: q >= 1,
      lupaAtRest: q === 0,
      lupaParkedClear: L.parkedClear,
      whoClear: L.who ? L.who.clear : null,
      latchedBeforeOpen: pr < 1 && (kF > -1 || kC > -1),
      allReached: pl.reached && prr.reached,
      reach: {left: pl.reached, right: prr.reached},
      actionCapped: p.actionProgress < 1 && u > capU,
      keyShown: !!L.key && done && seg(u, ...W.key) >= 1,
      notesShown: done && seg(u, ...W.notes) >= 1,
      notes: [...(L.notesAt.left.items || []), ...(L.notesAt.right.items || [])].map(it => it.text),
      keyText: L.key ? L.key.text : null,
      contentPx1080: r(Math.min(L.ns, ...geo.bodySizes) / L.u, 2),
      bodyPx1080: r(Math.min(...geo.bodySizes) / L.u, 2),
      kindPx1080: r(Math.min(...geo.kindSizes) / L.u, 2),
      notePx1080: r(L.ns / L.u, 2),
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
    slug: 'reasoning-08-story',
    title: 'Hidden premise — pulling fact and conclusion apart reveals the card between them',
    titleEs: 'Premisa oculta — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Premisa oculta',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down worktable: an analyst’s two hands pull a fact card and a conclusion card apart on a reading board. The gap that opens uncovers a recessed pocket holding an intermediate card — the premise supplied by the author. As supplied, a stated premise is a printed card that the brass hinges latch into the walk; an unstated one is a pencil card left loose in its pocket. A magnifier is held over the revealed card and put back. No conclusion is drawn.',
    tags: ['reasoning', 'hidden premise', 'enthymeme', 'fact', 'conclusion', 'gap', 'hinge', 'magnifier', 'hands', 'desk'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/premisa-oculta.js', 'src/animations/reasoning/kits/hecho-y-regla.js', 'src/primitives/desk.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: PO_STRINGS,
  scene,
});
