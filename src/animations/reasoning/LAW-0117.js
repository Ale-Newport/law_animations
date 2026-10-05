/**
 * LAW-0117 — Límite de una conclusión · story
 *
 * Storyboard (top-down work table; one reviewer whose two arms enter from the
 * bottom edge, body off-frame, walking a little along the table):
 *  0.00–0.15 rest     A survey map sheet is taped to the table. On it: the
 *                     brass PLAQUE with the proposition exactly as supplied,
 *                     its tie ring on the lower edge with the red boundary
 *                     CORD already tied and a short lead running to a cord
 *                     spool lying beside it; the numbered SITUATION cards
 *                     pinned on the map — all alike, nothing says yet which
 *                     one is covered. A magnifier lies on the table, and a
 *                     pinned note carries the supplied issue, assumption and
 *                     the key. The left hand reaches the spool.
 *  0.15–0.42 action   The hand lays the cord: from the lead it walks clockwise
 *                     around the cards SUPPLIED as covered, keeping them
 *                     inside; the cord runs down the corridor between those
 *                     cards and the ones supplied as not examined.
 *  0.42–0.73 complete The loop is completed and knotted where it began (the
 *                     cause); only then do the cards inside get a small
 *                     pennant + "covered · as supplied" and the cards left
 *                     outside a dashed ring + "not examined" (the effect).
 *                     The right hand carries the magnifier onto the cord in
 *                     the corridor, lays it down and lets go — its glass
 *                     shows a real enlarged copy of the cord there. Both
 *                     hands withdraw from the table.
 *  0.73–1.00 hold     State line "Outline closed as supplied · as supplied ·
 *                     no conclusion drawn" on the note; editorial callouts.
 *                     finalState 'outline-left-open' (or actionProgress < 1)
 *                     stops the cord short of its start: the spool is set
 *                     down at the gap, no knot and no markers appear.
 * Wide/square boxes: plaque top-left, covered cards below it, corridor, the
 * cards not examined on the right, note + magnifier on a strip of table to
 * the right. Tall boxes: plaque on top, covered cards, a horizontal corridor,
 * the cards not examined below, note + magnifier on the strip at the bottom.
 * Legal content: fictional, jurisdiction unspecified. The proposition and
 * every scope are supplied by the author; being outside the cord only means
 * "not examined", never excluded or decided.
 * @module animations/reasoning/LAW-0117
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {placeChip, calloutChip, segPolys, leaderPoly} from '../causation/kits/place.js';
import {lupaArt} from './kits/hecho-y-regla.js';
import {
  limFields, LIM_STRINGS, LIM_DEFAULTS, resolveSituations, limColors, unitsPer1080px, packZone, cardArt, cardTransform, cardPoint,
  plaqueGeom, plaqueArt, mapSheet, cordArt, cordFrame, knotArt, spoolArt, noteGeom, noteArt, cordPath, track, boxBounds, distToBox,
  inside, hit, unionBox, flagsClear,
} from './kits/limite-de-una-conclusion.js';

const ID = 'LAW-0117';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  notes: [0.01, 0.1], reachL: [0.03, 0.145], lay: [0.15, 0.62], knot: [0.62, 0.655], withdrawL: [0.66, 0.78],
  reachR: [0.47, 0.552], carry: [0.555, 0.63], examine: [0.63, 0.645], park: [0.645, 0.705], setDown: [0.705, 0.73], withdrawR: [0.74, 0.83],
  flags: [0.66, 0.73], rings: [0.675, 0.745], tags: [0.71, 0.8], outlineTag: [0.66, 0.73], state: [0.74, 0.82], ann: [0.8, 0.9],
};
const FINAL_STATES = ['outline-closed', 'outline-left-open'];
const OPEN_AT = 0.88; // loop fraction where the cord stops when it is left open

const EXTRA = {
  en: {who: 'Reviewer'},
  es: {who: 'Revisora'},
};
const STRINGS = {en: {...LIM_STRINGS.en, ...EXTRA.en}, es: {...LIM_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...limFields,
  reviewer: party,
  actorLabels: obj('Caption on the name card where the reviewer stands', {a: str('Caption for the reviewer (descriptive)', 60)}),
  objectLabels: obj('Labels printed on the props', {
    proposition: str('Kind label on the plaque', 50),
    situation: str('Kind label on each situation card (followed by its number)', 24),
    outline: str('Label on the tag tied to the cord', 30),
  }),
  actionProgress: num('How far the cord may be laid around its loop (1 = complete; lower values stop it part-way, no knot, no markers)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['proposition', 'outline', 'lupa']), 0, 2),
  finalState: oneOf('State supplied by the author for the hold: the cord is closed and knotted (markers appear) or left open at a gap (no markers). No legal conclusion is drawn in either', FINAL_STATES),
};

const defaultParams = {
  ...LIM_DEFAULTS,
  reviewer: {name: 'Ada', role: 'Reviewer'},
  actorLabels: {a: 'Reviewer · lays the outline'},
  objectLabels: {proposition: 'Proposition · as supplied', situation: 'Situation', outline: 'Outline of Note 7'},
  actionProgress: 1,
  annotations: [],
  finalState: 'outline-closed',
};

const SHAPES = {
  landscape: {axis: 'row', s: 33, side: 0.25, sideMin: 330, sideMax: 430, arm: 50},
  square: {axis: 'row', s: 34, side: 0.3, sideMin: 330, sideMax: 400, arm: 52},
  portrait: {axis: 'row', s: 34, side: 0.26, sideMin: 300, sideMax: 420, arm: 52},
};
const M = 12;
const SH = 210; // shoulder depth below the table edge
const WD = 1.0; // how far the reviewer steps back when withdrawing (× the design height, plus a margin)

/** Compose geometry at card-text size s. */
function compose(ctx, s, extraLines = 0, sideK = 1, axis = null, wide = false, stripBottom = false) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = SHAPES[ctx.view.shape];
  const row = (axis || S.axis) === 'row';
  const sr = row && !stripBottom; // note strip on the right (else along the bottom)
  const u = unitsPer1080px(ctx);
  const px = v => v * u; // design units for v px at 1080p
  const sits = resolveSituations(p.facts);
  const inItems = sits.filter(q => q.scope === 'included');
  const outItems = sits.filter(q => q.scope !== 'included');
  const desk = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const deskR = desk.x + desk.w, deskB = desk.y + desk.h;
  const gutter = 20;
  // strip of table (note + magnifier + name card): right on wide/square boxes, bottom on tall ones
  const sideLen = clamp((sr ? desk.w : desk.h) * S.side, S.sideMin, S.sideMax) * sideK;
  const map = sr
    ? {x: desk.x + gutter, y: desk.y + gutter, w: desk.w - 3 * gutter - sideLen, h: desk.h - 2 * gutter}
    : {x: desk.x + gutter, y: desk.y + gutter, w: desk.w - 2 * gutter, h: desk.h - 3 * gutter - sideLen};
  const side = sr
    ? {x: map.x + map.w + gutter, y: desk.y + gutter, w: sideLen, h: desk.h - 2 * gutter}
    : {x: desk.x + gutter, y: map.y + map.h + gutter, w: desk.w - 2 * gutter, h: sideLen};
  const dense = s < px(21);
  const P = dense ? 18 : 26;
  const m = dense ? Math.max(46, s * 1.9) : Math.max(58, s * 2.2); // cord distance from the covered cards
  const gap = m; // cord distance from the cards left outside
  // generic captions never outgrow the supplied content (content text = s)
  const tagSize = Math.min(s, Math.max(s * 0.74, px(17)));
  const kindSize = Math.min(s, Math.max(s * 0.7, px(16.5)));
  // plaque (top-left of the map)
  const plW = row ? (wide ? map.w - 2 * P : Math.min(map.w * 0.62, 620)) : Math.min(map.w * 0.66, 620);
  const pg = plaqueGeom(ctx, {w: plW, s, kind: p.objectLabels.proposition || t.propKind, title: p.rules.title, text: p.rules.proposition, kindSize, maxLines: 4 + extraLines});
  const plaqueAt = {x: map.x + P, y: map.y + P};
  const rr = Math.max(9, s * 0.36);
  const ringY = plaqueAt.y + pg.h + rr * 2.1 + (ctx.view.shape === 'portrait' ? s * 1.4 : 0);
  const fpTop = s * (dense ? 0.5 : 0.62); // pennant above a card
  const inTop = ringY + rr + 10 + m + fpTop;
  let zoneIn, zoneOut, split = null, packIn, packOut, ok = false;
  const cardOpts = key => ({s, maxW: s * 13.5, minW: s * 7.5, kind: p.objectLabels.situation || t.situation, tagSize, kindSize, seedKey: key, gx: s * (dense ? 1.1 : 1.4), gy: s * (dense ? 1.05 : 1.9), maxLines: dense ? 5 : 4});
  const tries = row ? [0.52, 0.47, 0.57, 0.42, 0.62, 0.37] : [0.52, 0.46, 0.58, 0.4, 0.64];
  let chosen = null;
  for (const f of tries) {
    let zi, zo;
    if (row) {
      const avail = map.w - 2 * P - 2 * m - gap;
      const wIn = inItems.length ? avail * f : avail * 0.25;
      zi = {x: map.x + P + m, y: inTop, w: wIn, h: map.y + map.h - P - m - inTop};
      const oy = wide ? plaqueAt.y + pg.h + P : map.y + P;
      zo = {x: zi.x + wIn + m + gap, y: oy, w: map.x + map.w - P - (zi.x + wIn + m + gap), h: map.y + map.h - P - oy};
    } else {
      const avail = map.y + map.h - P - inTop - m - gap;
      const hIn = inItems.length ? avail * f : avail * 0.22;
      zi = {x: map.x + P + m, y: inTop, w: map.w - 2 * P - 2 * m, h: hIn};
      zo = {x: map.x + P, y: inTop + hIn + m + gap, w: map.w - 2 * P, h: map.y + map.h - P - (inTop + hIn + m + gap)};
    }
    const pi = packZone(ctx, zi, inItems, cardOpts('in'));
    const po = packZone(ctx, zo, outItems, cardOpts('out'));
    const fitsBoth = pi.fits && po.fits;
    // balanced: the narrower of the two card widths as large as possible
    const score = (fitsBoth ? 1e6 : 0) + Math.min(inItems.length ? pi.cw : 1e4, outItems.length ? po.cw : 1e4);
    if (!chosen || score > chosen.score) chosen = {score, zi, zo, pi, po, f, fitsBoth};
  }
  ({zi: zoneIn, zo: zoneOut, pi: packIn, po: packOut, f: split, fitsBoth: ok} = chosen);
  const cards = [...packIn.cards, ...packOut.cards].sort((a, b) => a.i - b.i);
  const plaque = {...plaqueAt, w: plW, h: pg.h};
  const ring = {x: row && wide ? clamp(zoneIn.x + zoneIn.w / 2, plaque.x + 40, plaque.x + plW - 40) : plaque.x + plW * (row ? 0.5 : 0.36), y: ringY};
  const covered = cards.filter(c => c.scope === 'included');
  const cp = cordPath(covered, ring, m, {emptyAt: {x: ring.x, y: ring.y + m * 1.8}});
  // side strip: note, magnifier rest, name card
  const noteS = Math.min(s, Math.max(s * 0.84, px(20)));
  const noteW = sr ? side.w : Math.min(side.w * (row ? 0.7 : 0.62), row ? 900 : 620);
  const ng = noteGeom(ctx, {w: noteW, s: noteS, cordLabel: p.objectLabels.outline || t.outline, issues: p.issues, assumptions: p.assumptions, state: p.finalState === 'outline-left-open' || p.actionProgress < 1 ? t.open : t.closed});
  const R = clamp(Math.min(m, gap) - 12, 40, 66);
  const Lh = Math.max(96, R * 1.8);
  const whoTxt = [p.reviewer.name, p.actorLabels.a].filter(Boolean).join(' · ');
  const whoS = Math.min(s, Math.max(s * 0.8, px(18)));
  const whoFit = ctx.show('all') && whoTxt ? ctx.fit(whoTxt, {maxWidth: (sr ? side.w : side.w - noteW - 40) - whoS * 1.4, size: whoS, minSize: whoS * 0.92, maxLines: 5, weight: 600}) : null;
  const whoH = whoFit ? whoFit.height + whoS * 1.1 : 0;
  const lensBlock = 2 * R + 40;
  const sideNeed = sr ? ng.h + 24 + lensBlock + 20 + whoH : Math.max(ng.h, lensBlock + whoH + 20);
  const sideOk = sideNeed <= side.h + 0.5 && !ng.truncated && (!whoFit || !whoFit.truncated);
  const fits = ok && sideOk && !pg.truncated && cards.every(c => !c.geo.truncated);
  const fitInfo = {zones: ok, side: sideOk, sideNeed: Math.round(sideNeed), sideH: Math.round(side.h), plaque: !pg.truncated, inTot: Math.round(packIn.total), inH: Math.round(zoneIn.h), outTot: Math.round(packOut.total), outH: Math.round(zoneOut.h)};
  return {s, u, row, sr, desk, deskR, deskB, map, side, P, m, gap, plaque, pg, ring, rr, cards, covered, cp, ng, noteW, noteS, R, Lh, whoFit, whoS, whoH, zoneIn, zoneOut, split, fits, fitInfo, sits, tagSize, kindSize};
}

/** Lens spot on the cord in the corridor, its handle direction and the parked/rest poses. */
function planProps(ctx, L) {
  const {row, cp, cards, R, Lh, side, map} = L;
  const loop = cp.loop;
  const boxes = cards.map(c => boxBounds(c.box, {top: c.geo.head * 0.5, side: 6}));
  const plaqueB = {x: L.plaque.x, y: L.plaque.y, w: L.plaque.w, h: L.ring.y + L.rr - L.plaque.y};
  // candidate lens centres: loop points on the corridor side (right in rows, bottom in columns), as close as
  // possible to the middle of the gap between a covered card and the card left outside nearest to it
  const ext = row ? Math.max(...loop.map(q => q.x)) : Math.max(...loop.map(q => q.y));
  const cov = cards.filter(c => c.scope === 'included'), outs = cards.filter(c => c.scope !== 'included');
  const ctr = c => ({x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2});
  let target = null;
  for (const a of cov) for (const b of outs) {
    const d = Math.hypot(ctr(a).x - ctr(b).x, ctr(a).y - ctr(b).y);
    if (!target || d < target.d) target = {d, p: {x: (ctr(a).x + ctr(b).x) / 2, y: (ctr(a).y + ctr(b).y) / 2}};
  }
  let best = null;
  for (const q of loop) {
    if ((row ? q.x : q.y) < ext - 3) continue;
    const clear = Math.min(...boxes.map(b => distToBox(q, b)), distToBox(q, plaqueB));
    const off = target ? Math.hypot(q.x - target.p.x, q.y - target.p.y) : 0;
    const score = (clear >= 44 ? 1000 : clear * 10) - off;
    if (!best || score > best.score) best = {q, clear, score};
  }
  // no covered card: the cord only makes a small loop near the ring — the lens sits beside it
  const J = best ? {x: best.q.x, y: best.q.y} : {x: L.ring.x + 120, y: L.ring.y + 80};
  const Rh = clamp(best ? best.clear - 8 : R, 20, R);
  // handle direction: along the corridor, choosing the side with most room
  const handleClear = ang => {
    const a = (ang * Math.PI) / 180;
    const pts = [];
    for (let k = 0; k <= 10; k++) pts.push({x: J.x + Math.cos(a) * (Rh + (Lh + 8) * k / 10), y: J.y + Math.sin(a) * (Rh + (Lh + 8) * k / 10)});
    const inMap = pts.every(q => q.x > map.x + 8 && q.x < map.x + map.w - 8 && q.y > map.y + 8 && q.y < map.y + map.h - 8);
    return inMap ? Math.min(...pts.map(q => Math.min(...boxes.map(b => distToBox(q, b)), distToBox(q, plaqueB)))) : -1;
  };
  const cands = row ? [90, -90, 70, 110, -70, -110, 45, 135] : [0, 180, 20, -20, 160, -160];
  let holdAngle = cands[0], hc = -1;
  for (const an of cands) {
    const c = handleClear(an);
    if (c > hc + 4) { hc = c; holdAngle = an; }
  }
  // rest: on the side strip, handle to the right
  const rest = L.sr
    ? {c: {x: side.x + Rh + 26, y: side.y + side.h - L.whoH - 26 - Rh - 10}, angle: 0}
    : {c: {x: side.x + side.w - Rh - Lh - 30, y: side.y + Rh + 30}, angle: 0};
  return {J, Rh, holdAngle, rest, boxes, plaqueB, clearAtHold: best ? best.clear : null};
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const C = limColors(ctx);
  const {row, sr, desk, deskR, deskB, map, side, cards} = L;
  Object.assign(L, planProps(ctx, L));
  // --- the cord track: tied at the ring, lead to the loop start, then the loop
  L.track = track(L.cp.all);
  L.leadLen = Math.hypot(L.cp.start.x - L.ring.x, L.cp.start.y - L.ring.y);
  L.loopLen = L.track.total - L.leadLen;
  const cap = Math.min(p.actionProgress, p.finalState === 'outline-left-open' ? OPEN_AT : 1);
  L.cap = cap;
  L.closed = cap >= 1;
  L.layEnd = W.lay[0] + (W.lay[1] - W.lay[0]) * cap;
  // spool at rest: at the loop start, just below the lead
  L.spoolRest = {x: L.cp.start.x, y: L.cp.start.y};
  // --- arms. Wide/square boxes: the reviewer stands at the bottom edge. Tall boxes: the reviewer walks along the
  // long sides — the cord hand enters from the left edge, the magnifier hand from the right — so the arms keep a
  // natural length and never cross the note strip at the bottom.
  L.look = actorLook(ctx, p.reviewer, 0);
  const shape = ctx.view.shape;
  const sideL = shape !== 'landscape'; // cord hand from the left edge (square, tall)
  const sideR = shape === 'portrait'; // magnifier hand from the right edge (tall); otherwise from the bottom
  L.sides = sideL;
  L.sideL = sideL;
  L.sideR = sideR;
  const loopYs = L.cp.loop.map(q => q.y);
  const loopMidY = (Math.min(...loopYs) + Math.max(...loopYs)) / 2;
  L.restL = sideL ? {x: desk.x + 56, y: loopMidY} : {x: clamp(map.x + map.w * (row ? 0.3 : 0.25), desk.x + 90, deskR - 90), y: sr ? deskB - 58 : deskB + 70};
  L.restR = sideR ? {x: deskR - 56, y: clamp(L.rest.c.y - L.Rh * 2.4, map.y + map.h * 0.55, side.y - 30)}
    : sr ? {x: map.x + map.w - 120, y: deskB - 54} : {x: side.x + side.w * 0.62, y: deskB + 70};
  // the arm stays ~90% extended: the reviewer steps back when the hand is near the edge (shoulder never on the table)
  const EXT = 0.985;
  L.armTot = {L: 1, R: 1};
  const shoulderOf = (base, hand, k = 0.55, which = 'L') => {
    const sd = which === 'L' ? sideL : sideR;
    const reach = L.armTot[which] * EXT;
    if (sd) return which === 'L' ? {x: Math.min(desk.x - 60, hand.x - reach), y: hand.y + 30} : {x: Math.max(deskR + 60, hand.x + reach), y: hand.y + 30};
    const x = lerp(base.x, hand.x, k);
    return {x, y: Math.max(deskB + 60, hand.y + Math.sqrt(Math.max(0, reach * reach - (hand.x - x) * (hand.x - x))))};
  };
  L.shoulderOf = shoulderOf;
  L.baseL = sideL ? {x: desk.x - 60, y: loopMidY} : {x: L.restL.x - 40, y: deskB + 60};
  L.baseR = sideR ? {x: deskR + 60, y: L.restR.y} : {x: L.restR.x + 60, y: deskB + 60};
  // withdrawal: straight away from the entry edge
  L.awayOf = (which, q) => {
    const sd = which === 'L' ? sideL : sideR;
    if (!sd) return {x: 0, y: Math.max(0, deskB + 240 - q.y)};
    return which === 'L' ? {x: -Math.max(0, q.x - desk.x + 260), y: 0} : {x: Math.max(0, deskR + 260 - q.x), y: 0};
  };
  L.bendL = sr ? -1 : 1; // elbow away from the note: below the hand when the note is on the right, above when it is at the bottom
  L.bendR = sideR ? -1 : -1;
  const lupa0 = lupaArt(ctx, {name: 'probe', R: L.Rh, handle: L.Lh, copy: null});
  const gripAt = (c, ang, lift) => lupa0.frame(c, ang, lift).grip;
  L.gripRest = gripAt(L.rest.c, L.rest.angle, 0);
  L.gripHold = gripAt(L.J, L.holdAngle, 1);
  L.noteBoxEst = L.ng.rows.length ? {x: side.x, y: side.y, w: L.ng.w, h: L.ng.h} : null;
  if (L.whoFit) {
    const ww = L.whoFit.width + L.whoS * 1.4;
    L.whoBoxEst = {x: sr ? side.x : side.x + side.w - ww, y: side.y + side.h - L.whoH, w: ww, h: L.whoH};
  }
  // parking spot: free table space (clear of cards, plaque, cord, lead, note and name card), near the corridor
  {
    const R0 = L.Rh * 1.08;
    const obs = [...L.boxes, L.plaqueB, L.noteBoxEst, L.whoBoxEst].filter(Boolean);
    const loopPts = L.cp.loop.concat([L.ring, L.cp.start]);
    let best = null, bestAny = null;
    // prefer spots whose straight way there (the same eased arc the frame uses) does not carry the lens over a
    // card and is short enough not to rush; otherwise the nearest free spot
    const parkMax = (80 * ((W.park[1] - W.park[0]) * DURATION / 1000 * 60)) / 1.6;
    const pathClear = c => {
      if (Math.hypot(c.x - L.J.x, c.y - L.J.y) > parkMax) return false;
      for (let k = 5; k <= 20; k++) {
        const e = k / 20;
        const q = {x: L.J.x + (c.x - L.J.x) * e, y: L.J.y + (c.y - L.J.y) * e - Math.sin(e * Math.PI) * 24};
        if (L.boxes.some(b => distToBox(q, b) < R0 + 2)) return false;
      }
      return true;
    };
    const areas = [desk];
    for (const A of areas) for (let y = A.y + R0 + 10; y < A.y + A.h - R0 - 10; y += 12) for (let x = A.x + R0 + 10; x < A.x + A.w - R0 - 10; x += 12) {
      const c = {x, y};
      if (obs.some(b => distToBox(c, b) < R0 + 10)) continue;
      if (loopPts.some(q => Math.hypot(q.x - x, q.y - y) < R0 + 16)) continue;
      // handle clear too (try a few directions)
      let ang = null;
      for (const an of [0, 180, 90, -90, 45, 135, -45, -135]) {
        const a = (an * Math.PI) / 180;
        let ok = true;
        for (let k = 0; k <= 8 && ok; k++) {
          const q = {x: x + Math.cos(a) * (R0 + (L.Lh + 10) * k / 8), y: y + Math.sin(a) * (R0 + (L.Lh + 10) * k / 8)};
          if (q.x < desk.x + 8 || q.x > deskR - 8 || q.y < desk.y + 8 || q.y > deskB - 8) ok = false;
          else if (obs.some(b => distToBox(q, b) < 14) || loopPts.some(p2 => Math.hypot(p2.x - q.x, p2.y - q.y) < 14)) ok = false;
        }
        if (ok) { ang = an; break; }
      }
      if (ang === null) continue;
      const d = Math.hypot(x - L.J.x, y - L.J.y);
      if (!bestAny || d < bestAny.d) bestAny = {d, c, ang};
      if ((!best || d < best.d) && pathClear(c)) best = {d, c, ang};
    }
    L.parkPathClear = !!best;
    best = best || bestAny;
    L.park = best ? {c: best.c, angle: best.ang} : {c: L.rest.c, angle: L.rest.angle};
    L.parkFree = !!best;
  }
  L.gripPark = gripAt(L.park.c, L.park.angle, 0);
  const HAND = 24 * 1.3 * (SHAPES[ctx.view.shape].arm / 46);
  // total arm length: the farthest target seen from the nearest allowed shoulder place, at EXT extension
  const minDist = (which, q, base) => {
    const sd = which === 'L' ? sideL : sideR;
    if (sd) return Math.hypot(which === 'L' ? q.x - (desk.x - 60) : deskR + 60 - q.x, 30);
    const x = lerp(base.x, q.x, which === 'L' ? 0.55 : 0.45);
    return Math.hypot(q.x - x, deskB + 60 - q.y);
  };
  const layPts = [];
  for (let k = 0; k <= 60; k++) layPts.push(L.track.at(L.leadLen + L.loopLen * k / 60));
  const totL = Math.max(...[L.restL, L.spoolRest, ...layPts].map(q => minDist('L', q, L.baseL))) / EXT + 20;
  const totR = Math.max(...[L.restR, L.gripRest, L.gripHold, L.gripPark].map(q => minDist('R', q, L.baseR))) / EXT + 20;
  L.armTot = {L: totL, R: totR};
  const nL = totL - HAND, nR = totR - HAND;
  const aw = SHAPES[ctx.view.shape].arm;
  L.armL = topArm(ctx, {name: 'armL', skin: L.look.skin, sleeve: L.look.outfit, handed: 'right', width: aw, upper: nL * 0.52, lower: nL * 0.48});
  L.armR = topArm(ctx, {name: 'armR', skin: L.look.skin, sleeve: L.look.outfit, handed: 'left', width: aw, upper: nR * 0.52, lower: nR * 0.48});
  L.armReach = {L: r(totL), R: r(totR), desk: r(Math.max(desk.w, desk.h))};

  // --- nodes
  L.deskNode = deskWindow(ctx, {prefix: 'desk', x: desk.x, y: desk.y, w: desk.w, h: desk.h, radius: 26});
  const mapNode = o => mapSheet(ctx, {name: o.name, x: map.x, y: map.y, w: map.w, h: map.h, compass: row ? Math.min(40, L.zoneOut.w * 0.08) : 0, compassAt: row ? {x: map.x + map.w - 60, y: map.y + 60} : {x: map.x + map.w - 60, y: map.y + 60}});
  L.mapNode = mapNode({name: 'map'});
  L.plaqueArt = plaqueArt(ctx, L.pg, {x: L.plaque.x, y: L.plaque.y, name: 'plaque', ringAt: L.ring.x === L.plaque.x + L.plaque.w * 0.5 ? 0.5 : (L.ring.x - L.plaque.x) / L.plaque.w, ring: 'bottom'});
  L.cardNodes = cards.map(c => cardArt(ctx, c.geo, {prefix: 'sit', i: c.i, transform: cardTransform(c.box)}));
  L.cord = cordArt(ctx, 'cord', Math.max(5, L.s * 0.22));
  L.knot = knotArt(ctx, 'knot', Math.max(9, L.s * 0.36));
  L.spool = spoolArt(ctx, 'spool', Math.max(24, L.s * 0.95));
  // magnifier: its glass shows a real enlarged copy of the map, cards (text-free) and cord
  const copy = g(null,
    mapNode({}),
    cards.map(c => cardArt(ctx, c.geo, {prefix: 'lc', i: c.i, named: false, textless: true, transform: cardTransform(c.box)})),
    cordArt(ctx, 'lcord', Math.max(5, L.s * 0.22)));
  L.lupa = lupaArt(ctx, {name: 'lupa', R: L.Rh, handle: L.Lh, copy, zoom: 1.7, lensFill: limColors(ctx).map});
  // note (side strip)
  const ngx = row ? side.x : side.x;
  L.noteBox = null;
  L.note = null;
  if (L.ng.rows.length) {
    const na = noteArt(ctx, L.ng, {x: ngx, y: side.y, name: 'note'});
    L.note = na.node;
    L.noteBox = na.box;
    L.stateRow = L.ng.rows.findIndex(rw => rw.kind === 'state');
  }
  // reviewer name card (a folded paper card lying at the table's edge; arms pass over it)
  L.who = null;
  if (L.whoFit) {
    const wf = L.whoFit;
    const ww = wf.width + L.whoS * 1.4, wh = L.whoH;
    const x = sr ? side.x : side.x + side.w - ww;
    const y = row ? side.y + side.h - wh : side.y + side.h - wh;
    L.whoBox = {x, y, w: ww, h: wh};
    L.who = g({name: 'who'},
      h('path', {d: `M${r(x + 4)} ${r(y + 7)}h${r(ww)}v${r(wh)}h${r(-ww)}Z`, fill: th.shadow}),
      h('rect', {x: r(x), y: r(y), width: r(ww), height: r(wh), rx: 5, fill: th.card, stroke: th.ink, 'stroke-width': 2}),
      h('line', {x1: r(x + 6), y1: r(y + wh * 0.16), x2: r(x + ww - 6), y2: r(y + wh * 0.16), stroke: th.paperLine, 'stroke-width': 1.5}),
      textBlock(wf, {x: x + ww / 2, y: y + (wh - wf.height) / 2 + wh * 0.06, anchor: 'middle', fill: th.ink}));
  }
  // --- outline tag tied to the cord, and callouts (placed clear of everything in the hold)
  const obst = [
    ...L.boxes, L.plaqueB, L.noteBox, L.whoBox,
    {x: L.J.x - L.Rh - 10, y: L.J.y - L.Rh - 10, w: 2 * L.Rh + 20, h: 2 * L.Rh + 20},
    ...segPolys([L.J, {x: L.J.x + Math.cos(L.holdAngle * Math.PI / 180) * (L.Rh + L.Lh + 6), y: L.J.y + Math.sin(L.holdAngle * Math.PI / 180) * (L.Rh + L.Lh + 6)}], 40),
  ].filter(Boolean);
  const loopPoly = L.cp.loop;
  const bounds = {x: desk.x + 14, y: desk.y + 14, w: desk.w - 28, h: desk.h - 28};
  L.otag = null;
  L.chipsPlaced = [];
  L.callouts = [];
  if (ctx.show('all')) {
    const leads = [];
    p.annotations.forEach((an, i) => {
      const tg = an.target === 'proposition' ? {x: L.plaque.x + L.plaque.w, y: L.plaque.y + L.plaque.h * 0.4}
        : an.target === 'lupa' ? {x: L.J.x, y: L.J.y - L.Rh}
          : (() => { const q = loopPoly[Math.floor(loopPoly.length * 0.62)]; return {x: q.x, y: q.y}; })();
      const size = Math.min(L.s, Math.max(L.s * 0.82, L.u * 19));
      const mw = Math.min(460, (row ? map.w : map.w) * 0.42);
      let res = null, used = null;
      for (const [wd, ml] of [[mw, 2], [mw * 0.8, 3], [mw * 0.62, 4]]) {
        const probe = ctx.fit(an.text, {maxWidth: wd - size * 1.2, size, minSize: size * 0.92, maxLines: ml, weight: 600});
        if (probe.truncated) continue;
        const sz = {w: probe.width + size * 1.2, h: probe.height + size * 0.76};
        res = placeChip(sz, tg, {obstacles: [...obst, ...L.chipsPlaced, ...leads, ...segPolys(loopPoly, 12)], bounds, own: []});
        if (res) { used = {wd, ml}; break; }
      }
      if (!res) {
        const probe = ctx.fit(an.text, {maxWidth: mw * 0.8 - size * 1.2, size, minSize: size * 0.92, maxLines: 3, weight: 600});
        res = placeChip({w: probe.width + size * 1.2, h: probe.height + size * 0.76}, tg, {obstacles: [...obst, ...L.chipsPlaced], bounds, leastBad: true});
        used = {wd: mw * 0.8, ml: 3};
      }
      const c = calloutChip(ctx, {name: `ann${i}`, text: an.text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: used.wd, maxLines: used.ml, size, color: th.ink});
      L.chipsPlaced.push(c.box);
      leads.push(leaderPoly(c.box, res.end));
      L.callouts.push(c);
    });
  }
  // hold-state facts used by the semantics
  L.coveredInsideLoop = cards.map(c => inside({x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2}, loopPoly));
  return L;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1400]},
  layout(ctx) {
    const s0 = SHAPES[ctx.view.shape].s;
    const minS = 16.3 * unitsPer1080px(ctx);
    // at each text size a wider note strip is tried before the text shrinks
    const at = sz => {
      let best = null;
      const axes = ctx.view.shape === 'square' ? ['row', 'col'] : ['row'];
      for (const ax of axes) {
        const combos = ctx.view.shape === 'portrait' ? [[false, true], [true, true]] : ax === 'row' ? [[false, false], [true, false], [true, true]] : [[false, false]];
        for (const [wide, bottom] of combos) {
          if (bottom && ctx.view.shape === 'landscape') continue;
          for (const k of [1, 1.18, 1.36, 1.55, 0.85, 0.72]) {
            const c = compose(ctx, sz, 0, k, ax, wide, bottom);
            if (c.fits) return c;
            if (!best) best = c;
          }
        }
      }
      return best;
    };
    let s = s0;
    let L = at(s);
    for (let it = 0; it < 30 && !L.fits && s > minS; it++) {
      s = Math.max(minS, s * 0.96);
      L = at(s);
    }
    // a very small caption-safe box inside a large frame: geometry first (below the px floor, never overflowing)
    for (let it = 0; it < 20 && !L.fits && s > s0 * 0.45; it++) {
      s *= 0.94;
      L = at(s);
    }
    const out = finishLayout(ctx, L);
    out.minS = minS;
    if (L.s < minS - 0.01) {
      out.floorInfo = [];
      for (const [ax, wide, bottom, k] of [['row', false, false, 1], ['row', true, false, 1], ['row', true, false, 0.85], ['row', true, true, 1], ['col', false, false, 1.18]]) {
        const c = compose(ctx, minS, 0, k, ax, wide, bottom);
        out.floorInfo.push(`${ax}/${wide}/${bottom}/${k}:${JSON.stringify(c.fitInfo)}`);
      }
    }
    return out;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.deskNode.surface,
      L.mapNode,
      L.who,
      L.note,
      L.plaqueArt.node,
      g({name: 'cards'}, L.cardNodes),
      L.cord,
      L.knot,
      L.otag,
      L.lupa.shadows,
      L.lupa.view,
      L.lupa.prop,
      g({'clip-path': L.deskNode.clip},
        L.armR.arm, L.armR.palm, L.armR.thumb,
        L.armL.arm, L.armL.palm, L.spool, L.armL.thumb),
      L.deskNode.frame,
      L.callouts.map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const reduced = ctx.reduced;
    const tr = L.track;
    // ---------------- cord laying
    const layRaw = seg(u, W.lay[0], L.layEnd);
    const lay = ease.inOutSine(layRaw);
    const laidLoop = L.loopLen * L.cap * lay;
    const drawn = L.leadLen + laidLoop;
    const head = tr.at(drawn);
    const cordD = tr.d(Math.max(drawn, 0.5));
    Object.assign(nodes, cordFrame('cord', cordD), cordFrame('lcord', cordD));
    const closedNow = L.closed && u >= W.knot[0];
    // ---------------- left arm: reach spool → lay → knot → withdraw
    const reachL = ease.inOutCubic(seg(u, ...W.reachL));
    const knotP = seg(u, ...W.knot);
    const endHold = {x: head.x, y: head.y};
    let handL;
    let spoolHeld = false;
    let spoolPos;
    if (u < W.lay[0]) {
      const a = L.restL, b = L.spoolRest;
      const mid = {x: lerp(a.x, b.x, 0.5) - 30, y: lerp(a.y, b.y, 0.5) - 10};
      const e = reachL;
      handL = {x: (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * mid.x + e * e * b.x, y: (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * mid.y + e * e * b.y};
      spoolHeld = reachL >= 1;
      spoolPos = L.spoolRest;
    } else {
      handL = {x: head.x, y: head.y};
      spoolHeld = true;
      spoolPos = handL;
      if (u >= L.layEnd && L.closed && knotP > 0 && knotP < 1 && !reduced) {
        // a small tug while the knot is tied
        handL = {x: head.x + Math.sin(knotP * Math.PI * 2) * 7, y: head.y - Math.sin(knotP * Math.PI) * 10};
        spoolPos = handL;
      }
    }
    const wdL = ease.inOutSine(seg(u, W.withdrawL[0], W.withdrawL[1]));
    let shL = L.shoulderOf(L.baseL, handL, 0.55, 'L');
    if (u >= W.withdrawL[0]) {
      // left open: the spool is set down at the gap and stays; closed: the hand takes it away
      if (!L.closed) { spoolHeld = false; spoolPos = endHold; }
      const aw = L.awayOf('L', endHold);
      const sh0 = L.shoulderOf(L.baseL, endHold, 0.55, 'L');
      handL = {x: endHold.x + aw.x * wdL, y: endHold.y + aw.y * wdL};
      shL = {x: sh0.x + aw.x * wdL, y: sh0.y + aw.y * wdL};
      if (L.closed) spoolPos = handL;
    }
    const poseL = L.armL.pose(shL, handL, L.bendL);
    Object.assign(nodes, poseL.nodes);
    nodes.spool = {transform: T(spoolPos.x, spoolPos.y, 0), opacity: 1};
    // ---------------- right arm + magnifier: carried onto the cord, held there, then parked in free space
    const reachR = ease.inOutCubic(seg(u, ...W.reachR));
    const carry = ease.inOutSine(seg(u, ...W.carry));
    const park = ease.inOutSine(seg(u, ...W.park));
    const down = ease.inOutSine(seg(u, ...W.setDown));
    const wdR = ease.inOutSine(seg(u, ...W.withdrawR));
    const lift = u < W.carry[0] ? clamp((u - W.carry[0] + 0.012) / 0.012, 0, 1) * (reachR >= 1 ? 1 : 0) : 1 - down;
    let c, ang;
    if (u < W.park[0]) {
      c = {x: lerp(L.rest.c.x, L.J.x, carry), y: lerp(L.rest.c.y, L.J.y, carry) - Math.sin(carry * Math.PI) * 30};
      ang = lerp(L.rest.angle, L.holdAngle, carry);
    } else {
      c = {x: lerp(L.J.x, L.park.c.x, park), y: lerp(L.J.y, L.park.c.y, park) - Math.sin(park * Math.PI) * 24};
      let a0 = L.holdAngle, a1 = L.park.angle;
      while (a1 - a0 > 180) a1 -= 360;
      while (a0 - a1 > 180) a1 += 360;
      ang = lerp(a0, a1, park);
    }
    const lf = L.lupa.frame(c, ang, lift, 1, c);
    const grip = lf.grip;
    delete lf.grip;
    Object.assign(nodes, lf);
    let handR;
    const released = u >= W.setDown[1];
    if (u < W.reachR[0]) handR = L.restR;
    else if (u < W.carry[0]) handR = {x: lerp(L.restR.x, L.gripRest.x, reachR), y: lerp(L.restR.y, L.gripRest.y, reachR) - Math.sin(reachR * Math.PI) * 24};
    else if (!released) handR = grip;
    else {
      const aw = L.awayOf('R', grip);
      handR = {x: grip.x + aw.x * wdR, y: grip.y + aw.y * wdR};
    }
    let shR = L.shoulderOf(L.baseR, released ? grip : handR, 0.45, 'R');
    if (released) { const aw = L.awayOf('R', grip); shR = {x: shR.x + aw.x * wdR, y: shR.y + aw.y * wdR}; }
    const poseR = L.armR.pose(shR, handR, L.bendR);
    Object.assign(nodes, poseR.nodes);
    // ---------------- knot, markers, tags
    nodes.knot = {transform: T(L.cp.start.x, L.cp.start.y), opacity: closedNow ? r(clamp(knotP * 2.5), 3) : 0};
    const showMarks = L.closed;
    const coveredIdx = L.cards.filter(cd => cd.scope === 'included').map(cd => cd.i);
    const outIdx = L.cards.filter(cd => cd.scope !== 'included').map(cd => cd.i);
    const flagsP = [];
    const ringsP = [];
    coveredIdx.forEach((i, k) => {
      const e = showMarks ? seg(u, W.flags[0] + k * 0.018, W.flags[0] + k * 0.018 + 0.04) : 0;
      const sc = e > 0 ? (reduced ? ease.outCubic(e) : ease.outBack(e)) : 0;
      nodes[`sit-flag${i}`] = {opacity: e > 0 ? 1 : 0};
      nodes[`sit-flagS${i}`] = {transform: `scale(${r(Math.max(0.001, sc), 3)})`};
      if (L.cards.find(cd => cd.i === i).geo.tIn) nodes[`sit-tagIn${i}`] = {opacity: showMarks ? r(seg(u, ...W.tags), 3) : 0};
      flagsP.push(r(e, 3));
    });
    outIdx.forEach((i, k) => {
      const e = showMarks ? seg(u, W.rings[0] + k * 0.018, W.rings[0] + k * 0.018 + 0.04) : 0;
      nodes[`sit-ring${i}`] = {opacity: r(e, 3)};
      if (L.cards.find(cd => cd.i === i).geo.tOut) nodes[`sit-tagOut${i}`] = {opacity: showMarks ? r(seg(u, ...W.tags), 3) : 0};
      ringsP.push(r(e, 3));
    });
    if (L.otag) nodes.otag = {opacity: r(seg(u, ...W.outlineTag), 3)};
    if (L.note) {
      nodes.note = {opacity: r(seg(u, ...W.notes), 3)};
      if (L.stateRow >= 0) nodes[`note-row${L.stateRow}`] = {opacity: r(seg(u, ...W.state), 3)};
    }
    L.callouts.forEach((cl, i) => Object.assign(nodes, cl.frame(seg(u, W.ann[0] + i * 0.03, W.ann[1] + i * 0.03))));

    // ---------------- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const lensCircle = {x: c.x, y: c.y};
    const lensHitsCard = L.boxes.some(b => distToBox(lensCircle, b) < L.Rh * (1 + 0.07 * lift) - 1);
    const handleEnd = {x: c.x + Math.cos(ang * Math.PI / 180) * (L.Rh + L.Lh), y: c.y + Math.sin(ang * Math.PI / 180) * (L.Rh + L.Lh)};
    const handleHitsCard = [0.2, 0.4, 0.6, 0.8, 1].some(k => { const q = {x: c.x + (handleEnd.x - c.x) * k, y: c.y + (handleEnd.y - c.y) * k}; return L.boxes.some(b => distToBox(q, b) < 12); });
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      textSize: r(L.s, 2),
      fitInfo: L.fitInfo,
      floorInfo: L.floorInfo || null,
      minS: r(L.minS || 0, 2),
      layout: L.row ? 'row' : 'col',
      handL: P2(poseL.hand),
      handR: P2(poseR.hand),
      spool: P2(spoolPos),
      cordHead: P2(head),
      spoolHeld,
      lupa: P2(c),
      lupaGrip: P2(grip),
      lift: r(lift, 3),
      lupaAtRest: carry === 0,
      lupaAtHold: carry >= 1,
      lupaOnCordWhileHeld: u >= W.carry[1] && u < W.park[0] && Math.hypot(c.x - L.J.x, c.y - L.J.y) < 1,
      lupaParked: park >= 1 && Math.hypot(c.x - L.park.c.x, c.y - L.park.c.y) < 1,
      parkFree: L.parkFree,
      lensOverCord: L.cp.loop.some(q => Math.hypot(q.x - c.x, q.y - c.y) < L.Rh * (1 + 0.07 * lift) + 2),
      lensOverNote: [L.noteBox, L.whoBox, L.plaqueB].filter(Boolean).some(b => distToBox(c, b) < L.Rh * (1 + 0.07 * lift)),
      flagsClear: flagsClear(L.cards),
      armsOverNote: !!L.noteBox && [poseL, poseR].some(ps => { const n = ps.nodes; const segs = Object.keys(n).filter(k => /-(upper|lower)$/.test(k)).map(k => n[k]); return segs.some(sg => [0, 0.25, 0.5, 0.75, 1].some(t2 => distToBox({x: lerp(sg.x1, sg.x2, t2), y: lerp(sg.y1, sg.y2, t2)}, L.noteBox) < 22)); }),
      armReach: L.armReach,
      armsOverPlaque: [poseL, poseR].some(ps => { const n = ps.nodes; const segs = Object.keys(n).filter(k => /-(upper|lower)$/.test(k)).map(k => n[k]); const pb = {x: L.plaque.x, y: L.plaque.y, w: L.plaque.w, h: L.plaque.h}; return segs.some(sg => [0, 0.25, 0.5, 0.75, 1].some(t2 => distToBox({x: lerp(sg.x1, sg.x2, t2), y: lerp(sg.y1, sg.y2, t2)}, pb) < 20)); }),
      lupaReleased: released,
      lensOverCard: lensHitsCard,
      // whether a parking spot with a clear, unhurried straight way there existed (else the nearest free spot)
      parkPathClear: L.parkPathClear,
      handleOverCard: handleHitsCard,
      laid: r(L.cap * lay, 4),
      cap: r(L.cap, 3),
      closed: closedNow && knotP >= 1,
      knotShown: closedNow && knotP > 0,
      finalState: L.closed ? 'outline-closed' : 'outline-left-open',
      actionCapped: L.cap < 1,
      scopes: L.cards.map(cd => cd.scope),
      insideLoop: L.coveredInsideLoop,
      flags: flagsP,
      rings: ringsP,
      markersShown: flagsP.some(v => v > 0) || ringsP.some(v => v > 0),
      markersBeforeClose: (flagsP.some(v => v > 0) || ringsP.some(v => v > 0)) && !(closedNow && knotP >= 1),
      minGapOutside: r(Math.min(Infinity, ...L.cards.filter(cd => cd.scope !== 'included').flatMap(cd => L.cp.loop.map(q => distToBox(q, boxBounds(cd.box))))) === Infinity ? 999 : Math.min(...L.cards.filter(cd => cd.scope !== 'included').flatMap(cd => L.cp.loop.map(q => distToBox(q, boxBounds(cd.box)))))),
      gapTarget: r(L.gap),
      cordClearOfOutside: L.cards.filter(cd => cd.scope !== 'included').every(cd => L.cp.loop.every(q => distToBox(q, boxBounds(cd.box)) > L.gap * 0.6)),
      cordClearOfCovered: L.cards.filter(cd => cd.scope === 'included').every(cd => L.cp.loop.every(q => distToBox(q, boxBounds(cd.box)) > L.m * 0.6)),
      handsOffTable: (L.sideL ? poseL.hand.x < L.desk.x - 40 : poseL.hand.y > L.deskB + 40) && (L.sideR ? poseR.hand.x > L.deskR + 40 : poseR.hand.y > L.deskB + 40),
      notesVisible: !!L.note && seg(u, ...W.notes) >= 1,
      stateVisible: !!L.note && L.stateRow >= 0 && seg(u, ...W.state) >= 1,
      noteRows: L.ng.rows.map(rw => rw.kind),
      allReached: poseL.reached && poseR.reached,
      reach: {L: poseL.reached, R: poseR.reached},
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
    slug: 'reasoning-10-story',
    title: 'Limit of a conclusion — a cord is laid around the situations a proposition covers',
    titleEs: 'Límite de una conclusión — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Límite de una conclusión',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down work table: a proposition on a brass plaque (as supplied) with a red cord tied to its ring, numbered situation cards pinned on a survey map. The reviewer’s hand lays the cord in a closed loop around the situations supplied as covered and knots it; only then do those cards get a pennant (covered as supplied) and the others a dashed ring (not examined). The other hand lays a magnifier on the cord between them. Nothing is decided about the situations left outside.',
    tags: ['reasoning', 'proposition', 'scope', 'limit', 'boundary', 'cord', 'map', 'situations', 'story', 'magnifier', 'not examined'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/limite-de-una-conclusion.js', 'src/animations/reasoning/kits/hecho-y-regla.js', 'src/primitives/desk.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
