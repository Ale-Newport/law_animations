/**
 * LAW-0096 — Regla y excepción · inspect
 *
 * Storyboard (one junction board seen from above, a rectangular reading
 * magnifier, no actors):
 *  0.00–0.20 build       The state produced by the action: the fact card rests
 *                        on its wagon at the stop line of the main track (general
 *                        rule). Its datum sits in a label HOLDER on the card's
 *                        bottom row, next to the condition-marker slot. As
 *                        supplied for the BEFORE state, the relation line runs
 *                        from the marker to the gate socket (condition), the
 *                        socket lights, a pulse runs down the wire, the switch
 *                        blade throws, the gate swings open and the separate
 *                        branch (exception) lights. A status tag names the state.
 *  0.20–0.45 isolate     A reading magnifier lifts the holder + marker slot out
 *                        of the dimmed context: its glass is a REAL copy of the
 *                        whole board drawn at the same coordinates, enlarged
 *                        about the source region. A "Before" record appears.
 *  0.45–0.75 substitute  One datum is replaced: the old value is struck through,
 *                        then the tape inside the holder slides one window to the
 *                        left so the AFTER insert shows (no cross-fade). Only the
 *                        dependent state follows, as SUPPLIED for the after
 *                        state: the marker tile flips, the relation line is
 *                        pulled back (or redrawn), the socket and wire go dark,
 *                        the blade and gate return and the main route lights.
 *                        The dim relaxes so these far changes stay visible.
 *  0.75–1.00 return      The magnifier shrinks back toward its source and
 *                        dissolves on the way (so the enlarged copy never doubles
 *                        the original text); the record (before struck → after)
 *                        settles where the lens was and a pennant pinned to the
 *                        holder marks the changed datum.
 * Seeking back before the substitution restores the old datum exactly (pure
 * function of time). The scene never decides which route applies: both route
 * states are supplied (routeBefore / routeAfter).
 * focusTarget 'condition' puts the holder on the condition plaque instead (the
 * lens then lifts the plaque's holder and the socket plate).
 * Layouts: wide boxes keep the magnifier in a column beside the card; tall and
 * square boxes put the magnifier band above the board (placement can flip it).
 * Legal content: fictional house rules, jurisdiction unspecified,
 * illustrative-unverified.
 * @module animations/reasoning/LAW-0096
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline, roundRectPath} from '../../core/geometry.js';
import {inspectFields, oneOf} from '../../schemas/fields.js';
import {chip, connector, textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {lens} from '../../frameworks/lens.js';
import {placeChip, stateTag, hitsAny} from '../causation/kits/place.js';
import {
  reglaFields, REGLA_STRINGS, ROUTE_STATES, markerOf, routeOf, stateText, palette,
  junctionGeom, junctionParts, factCard, wagon, plaque, emblem, datumTape, datumTapeHeight, readingLens,
} from './kits/regla-y-excepcion.js';

const ID = 'LAW-0096';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  caption: [0, 0.06],
  linkIn: [0.02, 0.07], sockIn: [0.06, 0.09], pulseIn: [0.07, 0.11], throwIn: [0.09, 0.15], litIn: [0.11, 0.18], tagIn: [0.15, 0.19],
  open: [0.21, 0.37], before: [0.36, 0.42],
  strike: [0.46, 0.5], slide: [0.5, 0.58], after: [0.56, 0.61], relax: [0.58, 0.62],
  flip: [0.58, 0.63],
  linkOut: [0.6, 0.63], sockOut: [0.61, 0.63], pulseOut: [0.62, 0.645], tagOut: [0.62, 0.64],
  linkNew: [0.63, 0.66], sockNew: [0.65, 0.67], pulseNew: [0.66, 0.68],
  litOut: [0.64, 0.68], throw: [0.66, 0.72], litNew: [0.68, 0.74], tagNew: [0.72, 0.75],
  close: [0.76, 0.86], recUp: [0.8, 0.9], flag: [0.86, 0.92],
};

const STRINGS = {
  en: {...REGLA_STRINGS.en, before: 'Before', after: 'After'},
  es: {...REGLA_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  ...reglaFields,
  ...inspectFields(['fact', 'condition']),
  routeBefore: oneOf('Route state supplied for the BEFORE value (never computed by the scene)', ROUTE_STATES),
  routeAfter: oneOf('Route state supplied for the AFTER value (never computed by the scene)', ROUTE_STATES),
};

const defaultParams = {
  facts: ['Parcel 7 arrives Monday, 9:40'],
  rules: {
    general: 'Parcels are left at the front desk',
    exception: 'Signed-for parcels go to the post room',
    condition: 'The parcel needs a signature',
  },
  issues: ['Which datum on the parcel card sets the route?'],
  assumptions: ['Fictional house rules, as supplied'],
  focusTarget: 'fact',
  beforeValue: 'Needs a signature',
  afterValue: 'No signature needed',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Context: the junction as supplied, parcel 7 at the stop line', marker: 'Changed datum'},
  routeBefore: 'branch-as-supplied',
  routeAfter: 'main-as-supplied',
};

const SHAPES = {
  landscape: {arr: 'col', colFrac: 0.37, cardW: 280, size: 27, gauge: 46, plaque: 27, curve: 230, toS: 56, lead: 22, gateAfter: 14, handle: 92, chip: 27, head: 27},
  square: {arr: 'top', areaH: 262, cardW: 262, size: 25, gauge: 42, plaque: 24, curve: 200, toS: 50, lead: 22, gateAfter: 12, handle: 84, chip: 24, head: 24},
  portrait: {arr: 'top', areaH: 430, cardW: 262, size: 26, gauge: 44, plaque: 25, curve: 170, toS: 44, lead: 22, gateAfter: 10, handle: 88, chip: 26, head: 26},
};

const linkKind = m => (m === 'present' ? 'relation' : m === 'disputed' ? 'disputed' : null);
const sockMode = m => (m === 'present' ? 'present' : m === 'disputed' ? 'disputed' : null);
const union = list => {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};
const inflate = (b, p) => ({x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p});
const shift = (b, q) => ({x: b.x + q.x, y: b.y + q.y, w: b.w, h: b.h});

/**
 * Board plan: main track near the top, the separate branch leaves it DOWNWARD
 * (so the card's bottom row faces the socket), plaques in their slots.
 */
function planBoard(ctx, B, S0, card, probe) {
  const gw = S0.gauge;
  const wagonAlong = card.w + 60;
  const cpX = B.x + S0.lead + wagonAlong / 2;
  const sD = cpX - B.x + wagonAlong / 2 + S0.toS;
  const Sx = B.x + sD, Qx = Sx + S0.curve, postX = Qx + S0.gateAfter;
  const sockS = S0.size * 0.95;
  const plate = sockS * 2.7;
  const x1 = B.x + B.w - 16;
  const ruleX = Sx + 40, ruleW = x1 - ruleX;
  const excX = Qx - 50, excW = x1 - excX;
  const conX = postX + plate / 2 + 26, conW = x1 - conX;
  const ruleH = probe('rule', ruleW), excH = probe('exception', excW), conH = probe('condition', conW);
  const cardTop = -card.ext.y;
  const topNeed = Math.max(14 + ruleH + 14 + gw * 1.25, 14 + cardTop);
  const wedgeNeed = Math.max(gw * 1.35 + 20 + plate + 14 + gw * 1.25, gw * 1.25 + 12 + conH + 12 + gw * 1.25);
  const botNeed = gw * 1.25 + 14 + excH + 14;
  const need = topNeed + wedgeNeed + botNeed;
  const spare = Math.max(0, B.h - need);
  const Ym = B.y + topNeed + spare * 0.22;
  const off = wedgeNeed + spare * 0.5;
  const geom = junctionGeom({axis: 'h', a: {x: B.x, y: Ym}, sDist: sD, len: B.w - 26, off: -off, curve: S0.curve, gauge: gw, endGap: 40, gateAfter: S0.gateAfter, postSide: 'outer', bladeLen: Math.min(110, S0.curve * 0.5)});
  const Yb = Ym + off;
  return {
    overflow: need - B.h, gw, wagonAlong, cp: {x: cpX, y: Ym}, geom, Ym, Yb, off, sockS, plate,
    slots: {
      rule: {x: ruleX, w: ruleW, y: B.y + 14 + Math.max(0, Ym - gw * 1.25 - 14 - ruleH - (B.y + 14)) * 0.6, h: ruleH},
      exception: {x: excX, w: excW, y: Yb + gw * 1.25 + 14, h: excH},
      condition: {x: conX, w: conW, top: Ym + gw * 1.25 + 12, bottom: Yb - gw * 1.25 - 12, h: conH},
    },
  };
}

function compose(ctx, k) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const pal = palette(ctx);
  const D = ctx.design;
  const base = SHAPES[ctx.view.shape];
  const S0 = {...base, size: base.size * k, plaque: base.plaque * k, chip: base.chip * k, head: base.head * k};
  const target = p.focusTarget;
  const onFact = target === 'fact';
  const place = p.detailGeometry.placement;
  const mb = markerOf(p.routeBefore), ma = markerOf(p.routeAfter);
  const rb = routeOf(p.routeBefore), ra = routeOf(p.routeAfter);

  // ---- header: issue (and the board's context caption)
  const M = 14;
  const flipCol = S0.arr === 'col' && place === 'right';
  const flipTop = S0.arr === 'top' && place === 'bottom';
  const colX = S0.arr === 'col' ? (flipCol ? D.w - M - S0.colW : M) : M;
  const colW = S0.arr === 'col' ? Math.round(D.w * S0.colFrac) : D.w - 2 * M;
  let issue = null;
  if (ctx.show('all') && p.issues.length) {
    issue = chip(ctx, `${t.issue}: ${p.issues[0]}`, {x: colX, y: 10, maxWidth: colW, size: S0.head, maxLines: 2, fill: '#fff8dc', stroke: th.accent3, name: 'issue', weight: 600, radius: 6});
  }
  const headBottom = issue ? issue.box.y + issue.box.h : 4;
  let capFit = null;
  const capSize = S0.head * 0.92;
  if (ctx.show('all') && p.contextLabels.context) capFit = ctx.fit(p.contextLabels.context, {maxWidth: S0.arr === 'col' ? D.w - colW - 3 * M : D.w - 2 * M, size: capSize, minSize: capSize * 0.8, maxLines: 1, weight: 600});
  const capH = capFit ? capFit.height + 12 : 0;

  // ---- regions
  let B, area;
  if (S0.arr === 'col') {
    const bx = flipCol ? M : colX + colW + 24;
    B = {x: bx, y: 10 + capH, w: D.w - colW - 24 - 2 * M + (flipCol ? 0 : 0), h: D.h - 10 - capH - 10};
    if (flipCol) B.w = colX - 24 - M;
    area = {x: colX, y: headBottom + 18, w: colW, h: D.h - headBottom - 18 - 10};
  } else if (!flipTop) {
    area = {x: M, y: headBottom + 12, w: D.w - 2 * M, h: S0.areaH};
    const by = area.y + area.h + 8 + capH;
    B = {x: 8, y: by, w: D.w - 16, h: D.h - by - 8};
  } else {
    const by = headBottom + 12 + capH;
    B = {x: 8, y: by, w: D.w - 16, h: D.h - by - 8 - S0.areaH - 12};
    area = {x: M, y: B.y + B.h + 12, w: D.w - 2 * M, h: S0.areaH};
  }

  // ---- the card (+ its reserved holder row when the fact datum is inspected)
  const tapeSize = S0.size * 0.86;
  const padC = Math.round(S0.size * 0.55);
  const slotC = S0.size * 0.95 * 2.5;
  const holderW = S0.cardW - 2 * padC - slotC * 0.62;
  const tapeHFact = datumTapeHeight(ctx, {w: holderW, before: p.beforeValue, after: p.afterValue, size: tapeSize});
  const longer = p.beforeValue.length >= p.afterValue.length ? p.beforeValue : p.afterValue;
  const cardOpts = {w: S0.cardW, facts: p.facts, heading: t.fact, marker: null, size: S0.size, maxLines: 4, markerCorner: 'bottom', markerSide: 'right',
    feature: onFact ? {text: null, reserveFor: longer, placeholder: false, dotOpacity: 0, minH: tapeHFact - padC * 0.36} : null};
  const card = factCard(ctx, {prefix: 'probe-card', ...cardOpts});

  // ---- plaque specs
  const spec = {
    rule: {heading: t.rule, text: p.rules.general, color: pal.rule, soft: pal.ruleSoft, headInk: '#ffffff', icon: 'main', size: S0.plaque},
    exception: {heading: t.exception, text: p.rules.exception, color: pal.exc, soft: pal.excSoft, headInk: pal.excInk, icon: 'branch', size: S0.plaque},
    condition: {heading: t.condition, text: p.rules.condition, color: pal.excSoft, soft: pal.excSoft, headInk: pal.excInk, icon: 'socket', size: S0.plaque * 0.96},
  };
  // the condition holder is as wide as the card's holder (so it magnifies alike), next to the socket side
  const conHolderW = w => Math.min(w - 2 * Math.round(spec.condition.size * 0.55), holderW + 20);
  const conTapeH = w => datumTapeHeight(ctx, {w: conHolderW(w), before: p.beforeValue, after: p.afterValue, size: spec.condition.size * 0.92});
  const plaqueOf = (kind, x, y, w, name) => plaque(ctx, {name, x, y, w, ...spec[kind], maxLines: 3, ...(kind === 'condition' && !onFact ? {bodyH: conTapeH(w)} : {})});
  const probe = (kind, w) => plaqueOf(kind, 0, 0, w).box.h;
  const P = planBoard(ctx, B, S0, card, probe);
  const G = P.geom;
  const cp = P.cp;

  // ---- plaque positions (world)
  const sl = P.slots;
  const socketProbe = junctionParts(ctx, {prefix: 'probe-jn', geom: G, lever: null, socketS: P.sockS});
  const sockC = socketProbe.socketAt;
  const conY = clamp(sockC.y - sl.condition.h / 2, sl.condition.top, Math.max(sl.condition.top, sl.condition.bottom - sl.condition.h));
  const plPos = {rule: {x: sl.rule.x, y: sl.rule.y, w: sl.rule.w}, exception: {x: sl.exception.x, y: sl.exception.y, w: sl.exception.w}, condition: {x: sl.condition.x, y: conY, w: sl.condition.w}};
  const plBoxes = Object.fromEntries(['rule', 'exception', 'condition'].map(kd => [kd, plaqueOf(kd, plPos[kd].x, plPos[kd].y, plPos[kd].w)]));
  const plateBox = {x: sockC.x - P.plate / 2, y: sockC.y - P.plate / 2, w: P.plate, h: P.plate};

  // ---- the substituted datum's holder (world)
  let holder;
  if (onFact) {
    const fb = card.featureBox;
    holder = {x: cp.x + fb.x, y: cp.y + fb.y, w: fb.w, h: fb.h, size: tapeSize};
  } else {
    const bb = plBoxes.condition.bodyBox;
    const hw = conHolderW(plPos.condition.w);
    holder = {x: bb.x, y: bb.y, w: hw, h: bb.h, size: spec.condition.size * 0.92};
  }
  const slotBox = {x: cp.x + card.emblem.x - card.slot / 2, y: cp.y + card.emblem.y - card.slot / 2, w: card.slot, h: card.slot};
  const cardBoxW = {x: cp.x + card.ext.x, y: cp.y + card.ext.y, w: card.ext.w, h: card.ext.h};
  const markerPt = {x: cp.x + card.emblem.x, y: cp.y + card.emblem.y};

  // ---- relation line marker → socket plate (before / after kinds)
  const lkFrom = edgeAnchor(slotBox, {x: sockC.x, y: sockC.y}, 2);
  const lkTo = edgeAnchor(plateBox, markerPt, 3);
  const kA = linkKind(mb), kB = linkKind(ma);

  // ---- lens source, destination and magnification
  // the source frame hugs the holder's top edge (the card's fact line just above it stays clear
  // of the outline), with a margin on the other sides
  const S = (() => { const b = inflate(onFact ? union([holder, slotBox]) : union([holder, plateBox]), 10); const top = Math.min(holder.y - 3, b.y + 7); return {x: b.x, y: top, w: b.w, h: b.y + b.h - top}; })();
  const req = p.detailGeometry.zoom;
  const handleRoom = S0.handle + 8;
  let Dst, zoom, recSide;
  // record (before → after) chips: measured first so the lens leaves room for them
  const recSize = S0.chip;
  const recText = [`${t.before}: ${p.beforeValue}`, `${t.after}: ${p.afterValue}`];
  const recProbe = mw => recText.map(tx => chip(ctx, tx, {x: 0, y: 0, maxWidth: mw, size: recSize, maxLines: 2, weight: 600}).box);
  let assumption = null;
  const footProbe = ctx.show('all') && p.assumptions.length ? chip(ctx, `${t.assumed}: ${p.assumptions.join(' · ')}`, {x: 0, y: 0, maxWidth: area.w - handleRoom, size: S0.chip * 0.8, maxLines: 2, weight: 500}).box : null;
  const footH = footProbe ? footProbe.h + 12 : 0;
  if (S0.arr === 'col') {
    const rb0 = recProbe(area.w - handleRoom);
    const recH = ctx.show('key') ? rb0[0].h + rb0[1].h + 44 : 0;
    const availW = area.w - handleRoom;
    const availH = area.h - recH - footH - 24;
    zoom = Math.min(req, availW / S.w, availH / S.h);
    const dw = S.w * zoom, dh = S.h * zoom;
    // align with the source vertically when possible (short cone lines)
    const dy = clamp(S.y + S.h / 2 - dh / 2, area.y, area.y + availH - dh);
    Dst = {x: area.x + handleRoom + (availW - dw) / 2, y: dy, w: dw, h: dh};
    recSide = 'below';
  } else {
    const besideW = 400;
    const tryBeside = area.w - handleRoom - besideW - 24;
    const zB = Math.min(req, tryBeside / S.w, (area.h - 12) / S.h);
    const rbB = recProbe(besideW);
    const fitsBeside = ctx.show('key') ? rbB[0].h + rbB[1].h + 40 + footH <= area.h : true;
    const rbBelow = recProbe((area.w - handleRoom - 30) / 2);
    const belowH = ctx.show('key') ? Math.max(rbBelow[0].h, rbBelow[1].h) + 26 : 0;
    const zBelow = Math.min(req, (area.w - handleRoom) / S.w, (area.h - belowH - footH - 8) / S.h);
    if (fitsBeside && zB >= zBelow * 0.9) {
      zoom = zB;
      const dw = S.w * zoom, dh = S.h * zoom;
      Dst = {x: area.x + handleRoom, y: area.y + (area.h - dh) / 2, w: dw, h: dh};
      recSide = 'beside';
    } else {
      zoom = zBelow;
      const dw = S.w * zoom, dh = S.h * zoom;
      Dst = {x: area.x + handleRoom + (area.w - handleRoom - dw) / 2, y: area.y + Math.max(0, (area.h - belowH - footH - 8 - dh) / 2), w: dw, h: dh};
      recSide = 'below';
    }
  }

  // ---- record chips
  let rec = null;
  if (ctx.show('key')) {
    let pos;
    if (recSide === 'beside') {
      const x = Dst.x + Dst.w + 24;
      const mw = area.x + area.w - x;
      const bs = recProbe(mw);
      const total = bs[0].h + 34 + bs[1].h;
      const y0 = area.y + Math.max(0, (area.h - footH - total) / 2);
      pos = [{x, y: y0, mw}, {x, y: y0 + bs[0].h + 34, mw}];
      rec = buildRecord(ctx, pos, recText, recSize, 'down');
      rec.lift = 0;
    } else if (S0.arr === 'col') {
      const mw = area.w - handleRoom;
      const bs = recProbe(mw);
      const y0 = Dst.y + Dst.h + 24;
      pos = [{x: area.x + handleRoom, y: y0, mw}, {x: area.x + handleRoom, y: y0 + bs[0].h + 34, mw}];
      rec = buildRecord(ctx, pos, recText, recSize, 'down');
      // after the lens closes the record rises to where the lens was
      const total = bs[0].h + 34 + bs[1].h;
      rec.lift = Math.max(0, y0 - (Dst.y + Dst.h / 2 - total / 2));
    } else {
      const mw = (area.w - handleRoom - 30) / 2;
      const bs = recProbe(mw);
      const y0 = Dst.y + Dst.h + 18;
      const wA = bs[0].w, wB = bs[1].w;
      const x0 = area.x + handleRoom + (area.w - handleRoom - (wA + 30 + wB)) / 2;
      pos = [{x: x0, y: y0, mw}, {x: x0 + wA + 30, y: y0, mw}];
      rec = buildRecord(ctx, pos, recText, recSize, 'right');
      const hh = Math.max(bs[0].h, bs[1].h);
      rec.lift = Math.max(0, y0 - (Dst.y + Dst.h / 2 - hh / 2));
    }
  }
  if (footProbe) {
    const fy = area.y + area.h - footProbe.h;
    const fx = recSide === 'beside' ? Dst.x + Dst.w + 24 : area.x + handleRoom;
    assumption = chip(ctx, `${t.assumed}: ${p.assumptions.join(' · ')}`, {x: fx, y: fy, maxWidth: area.x + area.w - fx, size: S0.chip * 0.8, maxLines: 2, fill: th.card, stroke: th.inkFaint, name: 'foot', weight: 500});
  }

  // ---- context caption above the board
  let capNode = null;
  if (capFit) capNode = textBlock(capFit, {x: B.x + 6, y: B.y - capH + 2, fill: th.fg, name: 'context-cap'});

  // ---- obstacles on the board (tracks, plaques, card, socket) for tags and pennant
  const gw = P.gw;
  const trackBoxes = [
    {x: B.x, y: P.Ym - gw * 1.3, w: B.w, h: gw * 2.6},
    {x: G.Q.x - 10, y: P.Yb - gw * 1.3, w: B.x + B.w - G.Q.x + 10, h: gw * 2.6},
  ];
  for (let i = 0; i <= 10; i++) {
    const q = G.branchOnly.at(i / 10 * (S0.curve * 1.05) / G.branchOnly.total);
    trackBoxes.push({x: q.x - gw * 1.3, y: q.y - gw * 1.3, w: gw * 2.6, h: gw * 2.6});
  }
  const boardObs = [...trackBoxes, cardBoxW, plBoxes.rule.box, plBoxes.exception.box, plBoxes.condition.box, plateBox, inflate(slotBox, 4)];
  const boardBounds = {x: B.x + 12, y: B.y + 12, w: B.w - 24, h: B.h - 24};

  // ---- changed-datum pennant pinned to the holder's left end
  const pin = {x: holder.x + 10, y: holder.y + holder.h / 2};
  const flagSize = S0.chip * 0.9;
  const flagFit = ctx.show('key') && p.contextLabels.marker ? ctx.fit(p.contextLabels.marker, {maxWidth: 300, size: flagSize, minSize: flagSize * 0.8, maxLines: 1, weight: 700}) : null;
  const flagW = (flagFit ? flagFit.width : flagSize * 1.6) + flagSize * 1.6;
  const flagH = flagSize * 1.7;
  let flag = null;
  {
    const cands = [];
    for (const len of [70, 95, 125, 160, 200, 250]) {
      for (const [dx, dy] of [[-0.35, 1], [0.2, 1], [-0.35, -1], [-1, 0.25], [-1, -0.5], [0.35, -1]]) {
        const L = Math.hypot(dx, dy);
        const tip = {x: pin.x + (dx / L) * len, y: pin.y + (dy / L) * len};
        // the pennant flies to the left of the pole top (or right when there is no room)
        for (const side of [-1, 1]) {
          const box = {x: side < 0 ? tip.x - flagW : tip.x, y: tip.y - flagH / 2, w: flagW, h: flagH};
          cands.push({tip, box, side, len});
        }
      }
    }
    const own = onFact ? [cardBoxW] : [plBoxes.condition.box];
    const obs = boardObs.filter(o => !own.includes(o));
    const inB = b => b.x >= boardBounds.x && b.y >= boardBounds.y && b.x + b.w <= boardBounds.x + boardBounds.w && b.y + b.h <= boardBounds.y + boardBounds.h;
    const ownBox = own[0];
    // 1) clear of everything; 2) may fly over track ballast but never over a plaque, card or socket; 3) fallback
    const solid = [cardBoxW, plBoxes.rule.box, plBoxes.exception.box, plBoxes.condition.box, plateBox, inflate(slotBox, 4)];
    flag = cands.find(c => inB(c.box) && !hitsAny(c.box, [...obs, ownBox], 6))
      || cands.find(c => inB(c.box) && !hitsAny(c.box, solid, 6))
      || cands.find(c => inB(c.box) && !hitsAny(c.box, obs, 2)) || cands[0];
  }
  const flagNode = buildFlag(ctx, pin, flag, flagFit, flagSize, flagW, flagH);
  const flagBox = flag.box;

  // ---- status tags (before / after), near the switch in free board space
  const tags = [];
  const tagTexts = [stateText(t, p.routeBefore), stateText(t, p.routeAfter)];
  const tagObs = [...boardObs, flagBox];
  let tagAt = null;
  if (ctx.show('key')) {
    const size = S0.chip * 0.95;
    const probes = tagTexts.map(tx => stateTag(ctx, tx, {x: 0, y: 0, size, maxWidth: B.w * 0.6}).box);
    const hh = probes[0].h;
    // each tag sits beside the track it names (the main line past the switch, the siding, or the
    // switch itself for a held state); the old tag has faded before the new one appears
    const along = (poly, f) => poly.at(f);
    const targetOf = st => {
      const rt = routeOf(st);
      if (rt === 'main') { const q = along(polyline([G.S, G.E]), 0.6); return {x: q.x, y: q.y, r: gw * 1.3}; }
      if (rt === 'branch') { const q = along(polyline([G.Q, G.EB]), 0.55); return {x: q.x, y: q.y, r: gw * 1.3}; }
      return {x: G.S.x - 30, y: P.Ym + gw * 1.3, r: 6};
    };
    const placeTag = (i, extra) => {
      const sz = {w: probes[i].w, h: hh};
      const tgt = targetOf(i ? p.routeAfter : p.routeBefore);
      return placeChip(sz, tgt, {obstacles: [...tagObs, ...extra], bounds: boardBounds, noLeader: true, pad: 8, order: ['below', 'above', 'belowL', 'belowR', 'aboveL', 'aboveR'], gaps: [8, 20, 40, 70, 110, 160]})
        || placeChip(sz, {x: G.S.x - 30, y: P.Ym + gw * 1.3, r: 6}, {obstacles: [...tagObs, ...extra], bounds: boardBounds, noLeader: true, pad: 8, order: ['belowL', 'below', 'leftLow', 'belowR', 'aboveL', 'above'], gaps: [16, 40, 70, 110, 160, 220, 300]})
        || placeChip(sz, tgt, {obstacles: [...tagObs, ...extra], bounds: boardBounds, noLeader: true, leastBad: true})
        || {x: B.x + B.w / 2, y: B.y + B.h - hh - 16};
    };
    const res = placeTag(0, []);
    const res2 = tagTexts[1] !== tagTexts[0] ? placeTag(1, []) : res;
    tagAt = res2;
    const colOf = st => (routeOf(st) === 'held' ? th.inkSoft : routeOf(st) === 'branch' ? pal.excInk : pal.rule);
    tags.push(stateTag(ctx, tagTexts[0], {x: res.x, y: res.y, anchor: 'middle', size, maxWidth: B.w * 0.6, name: 'tagA', color: colOf(p.routeBefore), opacity: 0}));
    if (tagTexts[1] !== tagTexts[0]) tags.push(stateTag(ctx, tagTexts[1], {x: res2.x, y: res2.y, anchor: 'middle', size, maxWidth: B.w * 0.6, name: 'tagB', color: colOf(p.routeAfter), opacity: 0}));
  }

  return {
    overflow: P.overflow, S0, P, G, B, area, cp, card, cardOpts, plPos, plBoxes, spec, plaqueOf, sockC, plateBox, holder, slotBox, cardBoxW, markerPt,
    lkFrom, lkTo, kA, kB, mb, ma, rb, ra, S, Dst, zoom, rec, recSide, assumption, issue, capNode, flagNode, flagBox, flag, pin, tags, tagAt, onFact,
    handleCorner: 'l',
  };
}

/** Before (struck) → after record chips with a small connecting arrow. */
function buildRecord(ctx, pos, texts, size, dir) {
  const th = ctx.theme;
  const a = chip(ctx, texts[0], {x: pos[0].x, y: pos[0].y, maxWidth: pos[0].mw, size, maxLines: 2, fill: th.card, stroke: th.inkFaint, color: th.inkSoft, name: 'recA', weight: 600});
  const b = chip(ctx, texts[1], {x: pos[1].x, y: pos[1].y, maxWidth: pos[1].mw, size, maxLines: 2, fill: th.card, stroke: th.ink, name: 'recB', weight: 700});
  // strike one segment through each line of the old value
  const f = a.fit;
  const padY = size * 0.38;
  let d = '';
  let len = 0;
  f.lines.forEach((ln, i) => {
    const lw = ctx.measure(ln, f.size, f.weight, f.family);
    const cy = a.box.y + padY + i * f.lineHeight + f.size * 0.5;
    const x1 = a.box.cx - lw / 2 - 4, x2 = a.box.cx + lw / 2 + 4;
    d += `M${r(x1)} ${r(cy)}H${r(x2)}`;
    len += x2 - x1;
  });
  const strike = h('path', {name: 'recStrike', d, stroke: th.accent, 'stroke-width': Math.max(2.5, size * 0.12), 'stroke-linecap': 'round', fill: 'none', 'stroke-dasharray': `${r(len + 2)} ${r(len + 20)}`, 'stroke-dashoffset': r(len + 2)});
  let arrow;
  if (dir === 'down') {
    const x = a.box.x + 22, y1 = a.box.y + a.box.h + 5, y2 = b.box.y - 5;
    arrow = g({name: 'recArrow', opacity: 0}, h('path', {d: `M${r(x)} ${r(y1)}V${r(y2 - 8)}`, stroke: th.fgSoft, 'stroke-width': 3, 'stroke-linecap': 'round'}), h('path', {d: `M${r(x - 7)} ${r(y2 - 10)}L${r(x)} ${r(y2)}L${r(x + 7)} ${r(y2 - 10)}Z`, fill: th.fgSoft}));
  } else {
    const y = a.box.y + a.box.h / 2, x1 = a.box.x + a.box.w + 5, x2 = b.box.x - 5;
    arrow = g({name: 'recArrow', opacity: 0}, h('path', {d: `M${r(x1)} ${r(y)}H${r(x2 - 8)}`, stroke: th.fgSoft, 'stroke-width': 3, 'stroke-linecap': 'round'}), h('path', {d: `M${r(x2 - 10)} ${r(y - 7)}L${r(x2)} ${r(y)}L${r(x2 - 10)} ${r(y + 7)}Z`, fill: th.fgSoft}));
  }
  const node = g({name: 'rec'}, g({name: 'recAg', opacity: 0}, a.node, strike), arrow, g({name: 'recBg', opacity: 0}, b.node));
  return {node, boxes: [a.box, b.box], strikeLen: len, strikeLines: f.lines.length};
}

/** Pennant on a pin pole: marks the changed datum (reads without its label). */
function buildFlag(ctx, pin, flag, fit, size, fw, fh) {
  const th = ctx.theme;
  const tip = flag.tip;
  const b = flag.box;
  const notch = fh * 0.32;
  const d = flag.side < 0
    ? `M${r(b.x + b.w)} ${r(b.y)}H${r(b.x)}L${r(b.x + notch)} ${r(b.y + b.h / 2)}L${r(b.x)} ${r(b.y + b.h)}H${r(b.x + b.w)}Z`
    : `M${r(b.x)} ${r(b.y)}H${r(b.x + b.w)}L${r(b.x + b.w - notch)} ${r(b.y + b.h / 2)}L${r(b.x + b.w)} ${r(b.y + b.h)}H${r(b.x)}Z`;
  const parts = [
    h('line', {x1: r(pin.x), y1: r(pin.y), x2: r(tip.x), y2: r(tip.y), stroke: th.ink, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    h('path', {d, fill: th.accent, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(pin.x), cy: r(pin.y), r: 7, fill: th.accent, stroke: th.ink, 'stroke-width': 2}),
  ];
  if (fit) {
    const tx = flag.side < 0 ? b.x + notch + (b.w - notch) / 2 : b.x + (b.w - notch) / 2;
    parts.push(textBlock(fit, {x: tx, y: b.y + (b.h - fit.size) / 2 - fit.size * 0.02, anchor: 'middle', fill: '#ffffff', name: 'flag-text'}));
  } else {
    // labels hidden: a small tick on the pennant
    const cx = flag.side < 0 ? b.x + notch + (b.w - notch) / 2 : b.x + (b.w - notch) / 2, cy = b.y + b.h / 2;
    parts.push(h('path', {d: `M${r(cx - size * 0.35)} ${r(cy)}L${r(cx - size * 0.08)} ${r(cy + size * 0.28)}L${r(cx + size * 0.4)} ${r(cy - size * 0.3)}`, fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  }
  return g({name: 'flag', opacity: 0}, parts);
}

/**
 * The whole board (tracks, connector, socket, plaques, card, holder, links),
 * built once for the context and once (prefix 'z') for the magnifier's glass,
 * at the SAME design coordinates.
 */
function boardNodes(ctx, L, pf) {
  const th = ctx.theme;
  const pal = palette(ctx);
  const {B, P, G, cp, card} = L;
  const gw = P.gw;
  const parts = junctionParts(ctx, {prefix: `${pf}jn`, geom: G, lever: null, socketS: P.sockS});
  const sockC = L.sockC;
  // wire from the socket plate to the switch (the connector's signal line)
  const wirePts = [{x: sockC.x - P.plate / 2, y: sockC.y}, {x: G.S.x + (sockC.x - G.S.x) * 0.42, y: sockC.y}, {x: G.S.x + 30, y: G.S.y + gw * 1.15}, {x: G.S.x + 8, y: G.S.y + 7}];
  const wire = polyline(wirePts);
  const wireNode = g(null,
    h('path', {d: wire.d(1), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-linejoin': 'round'}),
    h('path', {name: `${pf}pulse`, d: wire.d(1), fill: 'none', stroke: pal.exc, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(wire.total)} ${r(wire.total + 20)}`, 'stroke-dashoffset': r(wire.total)}),
  );
  const s = P.sockS;
  const sA = sockMode(L.mb), sB = sockMode(L.ma);
  const socket = g(null,
    h('path', {d: roundRectPath(L.plateBox.x, L.plateBox.y, P.plate, P.plate, 9), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    h('line', {x1: r(L.plateBox.x + P.plate), y1: r(sockC.y), x2: r(L.plPos.condition.x), y2: r(clamp(sockC.y, L.plBoxes.condition.box.y + 14, L.plBoxes.condition.box.y + L.plBoxes.condition.box.h - 14)), stroke: th.inkSoft, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    g({transform: T(sockC.x, sockC.y)},
      emblem(ctx, {s, mode: 'socket'}),
      sA ? emblem(ctx, {name: `${pf}sockA`, s, mode: sA, opacity: 0}) : null,
      sB && sB !== sA ? emblem(ctx, {name: `${pf}sockB`, s, mode: sB, opacity: 0}) : null),
  );
  const pl = ['rule', 'exception', 'condition'].map(kd => L.plaqueOf(kd, L.plPos[kd].x, L.plPos[kd].y, L.plPos[kd].w, `${pf}pl-${kd}`).node);
  const cardNode = factCard(ctx, {prefix: `${pf}card`, ...L.cardOpts}).node;
  const wag = wagon(ctx, {name: `${pf}wagon`, along: P.wagonAlong, across: gw * 1.9});
  // marker tiles (before / after faces) in the card's bottom-right slot
  const es = card.emblem.s;
  const mk = g(null,
    g({name: `${pf}mkA`}, emblem(ctx, {s: es, mode: L.mb})),
    L.ma !== L.mb ? g({name: `${pf}mkB`}, emblem(ctx, {s: es, mode: L.ma})) : null,
  );
  const tape = datumTape(ctx, {prefix: `${pf}dt`, x: L.holder.x, y: L.holder.y, w: L.holder.w, h: L.holder.h, before: ctx.params.beforeValue, after: ctx.params.afterValue, size: L.holder.size});
  const lkA = L.kA ? connector(ctx, {name: `${pf}lkA`, from: L.lkFrom, to: L.lkTo, kind: L.kA, bend: 0.14, color: pal.excInk}) : null;
  const lkB = L.kB && L.kB !== L.kA ? connector(ctx, {name: `${pf}lkB`, from: L.lkFrom, to: L.lkTo, kind: L.kB, bend: 0.14, color: pal.excInk}) : null;
  const clipId = `${pf}board-clip`;
  const node = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 24)}))),
    h('path', {d: roundRectPath(B.x + 5, B.y + 8, B.w, B.h, 24), fill: th.shadow}),
    h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 24), fill: pal.board}),
    g({'clip-path': ctx.ref(clipId)}, parts.bed, parts.lights, parts.rails, parts.buffers, parts.blade, parts.pivot, parts.gate, wireNode),
    h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 24), fill: 'none', stroke: th.ink, 'stroke-width': 2.5}),
    socket,
    pl,
    g({transform: T(cp.x, cp.y)}, wag, cardNode),
    g({transform: T(cp.x + card.emblem.x, cp.y + card.emblem.y)}, mk),
    tape.node,
    lkA && lkA.node, lkB && lkB.node,
  );
  return {node, parts, wire, tape, lkA, lkB};
}

const scene = {
  sizes: {landscape: [1600, 880], square: [1000, 880], portrait: [900, 1400]},
  layout(ctx) {
    let L = null;
    for (const k of [1, 0.94, 0.88, 0.82, 0.76]) {
      L = compose(ctx, k);
      if (L.overflow <= 0) break;
    }
    L.ctxBoard = boardNodes(ctx, L, 'c');
    L.zBoard = boardNodes(ctx, L, 'z');
    const pal = palette(ctx);
    // no grey overlay: the context itself fades while the glass is up
    L.lens = lens(ctx, {name: 'lens', source: L.S, dest: L.Dst, content: g(null, h('rect', {x: 0, y: 0, width: ctx.design.w, height: ctx.design.h, fill: ctx.theme.paper}), L.zBoard.node), radius: 22, color: '#2b2f33'});
    L.rim = readingLens(ctx, {prefix: 'rim', handle: L.S0.handle, corner: L.handleCorner});
    L.pal = pal;
    return L;
  },
  build(ctx, L) {
    return g(null,
      L.issue && L.issue.node,
      g({name: 'ctxfade'},
        L.capNode,
        L.ctxBoard.node,
        L.tags.map(tg => tg.node),
        L.flagNode),
      L.lens.node,
      L.rim.node,
      L.rec && L.rec.node,
      L.assumption && L.assumption.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const st = stateAt(L, u);
    Object.assign(nodes, poseBoard(L, L.ctxBoard, 'c', st), poseBoard(L, L.zBoard, 'z', st));

    // --- magnifier: open → (relax dim) → close
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    const relax = seg(u, ...W.relax);
    const dim = lp * (1 - 0.6 * relax);
    Object.assign(nodes, L.lens.frame(lp, dim));
    // on the way back the glass dissolves while it shrinks onto its source: it is gone before the
    // enlarged copy nears 1:1 over the original (no doubled text) and never covers the record
    const dissolve = 1 - ease.inOutSine(seg(seg(u, ...W.close), 0.05, 0.55));
    const winOp = (lp > 0.001 ? Math.min(1, lp * 4) : 0) * dissolve;
    nodes['lens-win'] = {opacity: r(winOp, 3)};
    // the cone lines and the source outline belong to the glass: they dissolve with it
    // (no dashed leaders left pointing at an empty spot while the magnifier returns)
    // they show the lift-out while the glass grows, then step back so no line sits across the
    // card's text or the plaques during the long hold
    const coneOp = lp > 0.05 ? winOp * (1 - seg(lp, 0.75, 1)) : 0;
    for (const nm of ['lens-coneA', 'lens-coneB']) nodes[nm] = {...nodes[nm], opacity: r(coneOp, 3)};
    nodes['lens-src'] = {opacity: r(winOp, 3)};
    nodes.ctxfade = {opacity: r(1 - 0.55 * dim, 3)};
    const R = {x: lerp(L.S.x, L.Dst.x, lp), y: lerp(L.S.y, L.Dst.y, lp), w: lerp(L.S.w, L.Dst.w, lp), h: lerp(L.S.h, L.Dst.h, lp)};
    Object.assign(nodes, L.rim.frame(R, winOp));

    // --- captions, tags, record, pennant
    if (L.issue) nodes.issue = {opacity: r(seg(u, ...W.caption), 3)};
    if (L.capNode) nodes['context-cap'] = {opacity: r(seg(u, ...W.caption), 3)};
    const tagA = seg(u, ...W.tagIn) * (L.tags[1] ? 1 - seg(u, ...W.tagOut) : 1);
    if (L.tags[0]) nodes.tagA = {opacity: r(tagA, 3)};
    if (L.tags[1]) nodes.tagB = {opacity: r(seg(u, ...W.tagNew), 3)};
    const recUp = ease.inOutCubic(seg(u, ...W.recUp));
    if (L.rec) {
      nodes.rec = {transform: `translate(0 ${r(-L.rec.lift * recUp)})`};
      nodes.recAg = {opacity: r(seg(u, ...W.before), 3)};
      nodes.recStrike = {'stroke-dashoffset': r((L.rec.strikeLen + 2) * (1 - seg(u, ...W.strike)))};
      nodes.recArrow = {opacity: r(seg(u, ...W.after), 3)};
      nodes.recBg = {opacity: r(seg(u, ...W.after), 3)};
    }
    if (L.assumption) nodes.foot = {opacity: r(seg(u, ...W.caption), 3)};
    const fl = (ctx.reduced ? ease.outCubic : ease.outBack)(seg(u, ...W.flag));
    const flOn = seg(u, ...W.flag);
    nodes.flag = {opacity: flOn > 0 ? 1 : 0, transform: `translate(${r(L.pin.x)} ${r(L.pin.y)}) scale(${r(Math.max(0.001, clamp(fl, 0, 1.2)), 4)}) translate(${r(-L.pin.x)} ${r(-L.pin.y)})`};

    // --- semantics
    const mapped = q => ({x: R.x + (q.x - L.S.x) * (R.w / L.S.w), y: R.y + (q.y - L.S.y) * (R.h / L.S.h)});
    const hc = {x: L.holder.x + L.holder.w / 2, y: L.holder.y + L.holder.h / 2};
    const hm = mapped(hc);
    const inside = (q, b, tol = 0) => q.x >= b.x - tol && q.x <= b.x + b.w + tol && q.y >= b.y - tol && q.y <= b.y + b.h + tol;
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = st.slide <= 0 ? 'before' : st.slide >= 1 ? 'after' : 'changing';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        layoutScale: r(L.S0.size / SHAPES[ctx.view.shape].size, 3),
        focusTarget: L.onFact ? 'fact' : 'condition',
        datum,
        tapeSlide: r(st.slide, 3),
        strike: r(st.strike, 3),
        tapeOffset: r(-L.ctxBoard.tape.step * st.slide, 2),
        lensTapeOffset: r(-L.zBoard.tape.step * st.slide, 2),
        lensOpen: r(lp, 3),
        lensVisible: r(winOp, 3),
        lensZoom: r(L.zoom, 3),
        lensC: P2({x: R.x + R.w / 2, y: R.y + R.h / 2}),
        lensBox: {x: r(R.x), y: r(R.y), w: r(R.w), h: r(R.h)},
        sourceBox: {x: r(L.S.x), y: r(L.S.y), w: r(L.S.w), h: r(L.S.h)},
        sourceContainsHolder: inside({x: L.holder.x, y: L.holder.y}, L.S) && inside({x: L.holder.x + L.holder.w, y: L.holder.y + L.holder.h}, L.S),
        sourceContainsMarker: L.onFact ? inside({x: L.markerPt.x, y: L.markerPt.y}, L.S) : inside({x: L.sockC.x, y: L.sockC.y}, L.S),
        holderInLens: lp > 0.99 ? inside(hm, R) && Math.abs((hm.x - R.x) / R.w - (hc.x - L.S.x) / L.S.w) < 1e-6 : null,
        contextDim: r(dim, 3),
        marker: st.flip < 0.5 ? L.mb : L.ma,
        markerFlip: r(st.flip, 3),
        link: {before: r(st.lkA, 3), after: r(st.lkB, 3), kindBefore: L.kA, kindAfter: L.kB},
        socket: {before: r(st.sockA, 3), after: r(st.sockB, 3)},
        pulse: r(st.pulse, 3),
        blade: r(st.blade, 3),
        gate: r(st.gate, 3),
        litMain: r(st.litM, 3),
        litBranch: r(st.litB, 3),
        routeShown: st.throwP >= 1 ? L.ra : st.throwP > 0 ? 'changing' : L.rb,
        cardAt: P2(L.cp),
        cardStatic: true,
        tagShown: L.tags.length ? (nodes.tagB && nodes.tagB.opacity > 0 ? 'after' : nodes.tagA && nodes.tagA.opacity > 0 ? 'before' : 'none') : 'hidden',
        recordLift: L.rec ? r(L.rec.lift * recUp, 2) : 0,
        recordAt: L.rec ? P2({x: L.rec.boxes[0].x, y: L.rec.boxes[0].y - L.rec.lift * recUp}) : P2({x: 0, y: 0}),
        flagShown: flOn >= 1,
        flagClear: !hitsAny(L.flagBox, [L.cardBoxW, L.plBoxes.rule.box, L.plBoxes.exception.box, L.plateBox].filter(b => !(L.onFact && b === L.cardBoxW)), 0),
        flagAtHolder: Math.hypot(L.pin.x - L.holder.x - 10, L.pin.y - L.holder.y - L.holder.h / 2) < 1,
        recordClearOfLens: L.rec ? L.rec.boxes.every(b => !overlapsBox(shift(b, {x: 0, y: -L.rec.lift * recUp}), R, 0) || lp < 0.02) : true,
        strikeLines: L.ctxBoard.tape.strikeLines,
      },
    };
  },
};

function overlapsBox(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Dependent state at time u (identical for the context and the glass copy). */
function stateAt(L, u) {
  const bB = L.rb === 'branch' ? 1 : 0, bA = L.ra === 'branch' ? 1 : 0;
  const mB = L.rb === 'main' ? 1 : 0, mA = L.ra === 'main' ? 1 : 0;
  const changesLink = L.kA !== L.kB;
  // build: the before state is constructed (cause before effect)
  const linkIn = ease.inOutCubic(seg(u, ...W.linkIn));
  const sockIn = seg(u, ...W.sockIn);
  const pulseIn = seg(u, ...W.pulseIn);
  const throwIn = ease.inOutCubic(seg(u, ...W.throwIn));
  const litIn = ease.inOutSine(seg(u, ...W.litIn));
  // substitute: datum, then the dependent state as supplied for the after value
  const strike = seg(u, ...W.strike);
  const slide = ease.inOutCubic(seg(u, ...W.slide));
  const flip = L.ma !== L.mb ? seg(u, ...W.flip) : 0;
  const linkOut = changesLink ? ease.inOutCubic(seg(u, ...W.linkOut)) : 0;
  const linkNew = changesLink ? ease.inOutCubic(seg(u, ...W.linkNew)) : 0;
  const sockOut = sockMode(L.ma) !== sockMode(L.mb) ? seg(u, ...W.sockOut) : 0;
  const sockNew = sockMode(L.ma) !== sockMode(L.mb) ? seg(u, ...W.sockNew) : 0;
  const throwP = bA !== bB ? ease.inOutCubic(seg(u, ...W.throw)) : (u >= W.throw[1] ? 1 : 0);
  const litOut = ease.inOutSine(seg(u, ...W.litOut));
  const litNew = ease.inOutSine(seg(u, ...W.litNew));
  const pulseOut = seg(u, ...W.pulseOut), pulseNew = seg(u, ...W.pulseNew);
  const bladeBefore = bB * throwIn;
  const blade = bA !== bB ? lerp(bladeBefore, bA, throwP) : bladeBefore;
  const pulse = bA !== bB ? (bB ? pulseIn * (1 - pulseOut) : pulseNew) : bB * pulseIn;
  // lights: the before route lights during the build; if the route changes it retracts and the new one lights
  const routeChanges = L.ra !== L.rb;
  const litB = (bB * litIn * (routeChanges ? 1 - litOut : 1)) + (routeChanges && bA ? litNew : 0);
  const litM = (mB * litIn * (routeChanges ? 1 - litOut : 1)) + (routeChanges && mA ? litNew : 0);
  return {
    strike, slide, flip, throwP,
    lkA: L.kA ? linkIn * (1 - linkOut) : 0,
    lkB: changesLink && L.kB ? linkNew : 0,
    sockA: sockMode(L.mb) ? sockIn * (1 - sockOut) : 0,
    sockB: sockMode(L.ma) && sockMode(L.ma) !== sockMode(L.mb) ? sockNew : 0,
    pulse, blade, gate: blade, litB: clamp(litB), litM: clamp(litM),
  };
}

/** Frame record of one board copy for a state. */
function poseBoard(L, bd, pf, st) {
  const nodes = {};
  Object.assign(nodes, bd.parts.pose({blade: st.blade, gate: st.gate, litMain: st.litM, litBranch: st.litB}));
  nodes[`${pf}pulse`] = {'stroke-dashoffset': r(bd.wire.total * (1 - st.pulse))};
  if (sockMode(L.mb)) nodes[`${pf}sockA`] = {opacity: r(st.sockA, 3)};
  if (sockMode(L.ma) && sockMode(L.ma) !== sockMode(L.mb)) nodes[`${pf}sockB`] = {opacity: r(st.sockB, 3)};
  // marker tile flip: before face narrows to an edge, after face opens
  const mx = L.cp.x + L.card.emblem.x, my = L.cp.y + L.card.emblem.y;
  const fa = st.flip < 0.5 ? 1 - st.flip * 2 : 0;
  const fb = st.flip >= 0.5 ? (st.flip - 0.5) * 2 : 0;
  nodes[`${pf}mkA`] = {transform: `scale(${r(Math.max(0.001, fa), 4)} 1)`, opacity: fa > 0.001 ? 1 : 0};
  if (L.ma !== L.mb) nodes[`${pf}mkB`] = {transform: `scale(${r(Math.max(0.001, fb), 4)} 1)`, opacity: fb > 0.001 ? 1 : 0};
  void mx; void my;
  Object.assign(nodes, bd.tape.pose(st.slide, st.strike));
  if (bd.lkA) Object.assign(nodes, bd.lkA.frame(st.lkA, st.lkA > 0 ? 1 : 0));
  if (bd.lkB) Object.assign(nodes, bd.lkB.frame(st.lkB, st.lkB > 0 ? 1 : 0));
  return nodes;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-04-inspect',
    title: 'Rule and exception — magnify the datum holder and swap one value',
    titleEs: 'Regla y excepción — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Regla y excepción',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A railway junction board shows the supplied state: the fact card waits at the stop line, its condition marker is related to the gate socket, the switch is thrown and the separate branch (exception) is lit. A rectangular reading magnifier lifts the card’s datum holder and marker slot out of the dimmed board as a real enlarged copy. The old value is struck through and the holder’s tape slides to the supplied alternative; only the dependent state follows as supplied (marker tile flips, relation line withdrawn, socket and wire dark, switch and gate back, main route lit). The magnifier closes, a before → after record stays and a pennant marks the changed datum. No legal conclusion is drawn.',
    tags: ['reasoning', 'rule', 'exception', 'inspect', 'magnifier', 'lens', 'datum', 'substitution', 'switch', 'branch'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/regla-y-excepcion.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
