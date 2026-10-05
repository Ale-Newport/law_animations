/**
 * LAW-0094 — Regla y excepción · mechanism
 *
 * Storyboard (exploded view of the junction, no actors):
 *  0.00–0.18 separate  The assembled junction (fact wagon on the main line,
 *                      switch, main track, gated siding, condition socket,
 *                      magnifier over the card) comes apart: every component
 *                      slides away from the switch along its own axis, so the
 *                      gaps between them become visible. Component headings
 *                      fade in as the parts separate.
 *  0.18–0.43 relate    Only the SUPPLIED relationships are drawn, one after
 *                      another. Each link leaves and lands on a real edge of its
 *                      part (card or marker tab, glass rim, socket plate, the
 *                      turnout's baseboard, the track ends): plain relations
 *                      carry no arrowhead, sequences carry one, a causal style
 *                      appears only if the author supplies it.
 *  0.43–0.75 trace     A signal token with a halo runs through the supplied
 *                      traversal order along the drawn links (under their
 *                      captions, never over text). Each part changes state when
 *                      the token reaches it — the glass reveals the card's
 *                      marker, the socket fills (as supplied), the lever throws
 *                      the blade, the branch gate opens and the branch lights —
 *                      and the focus part lifts (≈1.3×, with a shadow) while the
 *                      token is on it; its links stay attached to its edges.
 *  0.75–1.00 gather    The parts slide back toward each other (not all the way:
 *                      the links keep readable length), the view settles on the
 *                      gathered mechanism, links shorten but stay attached and
 *                      captioned; origin (fact), transformation (thrown switch)
 *                      and the supplied state stay visible with a status tag.
 *                      No rule is said to apply.
 *  Wide boxes place the parts on a Y lying on its side (main line left→right,
 *  siding up-right); tall boxes stand the Y upright (main line top→bottom,
 *  siding to the right, plaques under the track ends).
 * Legal content: fictional house rules, jurisdiction unspecified,
 * illustrative-unverified.
 * @module animations/reasoning/LAW-0094
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {mechanismFields, oneOf} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {kindColor} from '../../frameworks/graph.js';
import {placeChip} from '../causation/kits/place.js';
import {
  reglaFields, REGLA_DEFAULTS, REGLA_STRINGS, ROUTE_STATES, markerOf, routeOf, palette,
  junctionGeom, junctionParts, factCard, wagon, magnifier, plaque, emblem, trackPiece, AXES, cardBox, overlaps,
  liveLink, tracerToken, exitPoint, entryPoint, edgeDistance,
} from './kits/regla-y-excepcion.js';

const ID = 'LAW-0094';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {explode: [0.02, 0.17], labels: [0.06, 0.17], relate: [0.19, 0.42], trace: [0.45, 0.74], gather: [0.77, 0.9], tag: [0.89, 0.95]};
const IDS = ['fact', 'lens', 'condition', 'connector', 'rule', 'exception'];

const STRINGS = {
  en: {...REGLA_STRINGS.en, lens: 'Magnifier', connector: 'Switch (connector)', noConclusion: 'As supplied · no conclusion drawn'},
  es: {...REGLA_STRINGS.es, lens: 'Lupa', connector: 'Aguja (conector)', noConclusion: 'Según lo aportado · sin conclusión'},
};

const sceneSchema = {
  ...reglaFields,
  ...mechanismFields(IDS),
  routeState: oneOf('Route state supplied by the author and shown as the tracer passes (never computed by the scene)', ROUTE_STATES),
};

const defaultParams = {
  ...REGLA_DEFAULTS,
  elements: [
    {id: 'fact', label: 'Fact'},
    {id: 'lens', label: 'Magnifier'},
    {id: 'condition', label: 'Condition'},
    {id: 'connector', label: 'Switch (connector)'},
    {id: 'rule', label: 'General rule'},
    {id: 'exception', label: 'Exception'},
  ],
  relationships: [
    {from: 'lens', to: 'fact', kind: 'relation'},
    {from: 'lens', to: 'condition', kind: 'relation'},
    {from: 'condition', to: 'connector', kind: 'sequence'},
    {from: 'rule', to: 'connector', kind: 'relation'},
    {from: 'connector', to: 'exception', kind: 'sequence'},
  ],
  focusElement: 'connector',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['fact', 'lens', 'condition', 'connector', 'exception'],
  routeState: 'branch-as-supplied',
};

const SHAPES = {
  landscape: {axis: 'h', cardW: 290, size: 26, gauge: 46, plaque: 26, plaqueW: 360, R: 66, a: 110, b: 240, off: 150, gapD: 330, gapN: 120, trackLen: 380, condW: 330, chip: 25, focus: 1.3},
  // square: the 3-column exploded grid is width-limited, so gaps and the fact's track stub are tighter
  square: {axis: 'h', cardW: 250, size: 27, gauge: 42, plaque: 27, plaqueW: 285, R: 58, a: 90, b: 200, off: 130, gapD: 180, gapN: 150, trackLen: 250, condW: 300, chip: 25, focus: 1.28, excAbove: true, stubExtra: 36, connLabelLeft: true},
  portrait: {axis: 'v', cardW: 270, size: 26, gauge: 44, plaque: 27, plaqueW: 360, R: 62, a: 100, b: 220, off: 140, gapD: 200, gapN: 150, trackLen: 330, condW: 300, chip: 26, focus: 1.28},
};

/** Chosen layout settings per geometry-relevant parameters (pure memo of `scene.search`). */
const LAYOUT_MEMO = new Map();

const unionBox = list => {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};
const shift = (b, p) => ({x: b.x + p.x, y: b.y + p.y, w: b.w, h: b.h});
const shapeBox = s => (s.r !== undefined ? {x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2} : s);
/** The whole track piece as drawn: the ballast bed's round caps and the buffer stop reach past the rail box. */
const bedBox = (b, axis, gauge) => {
  const e = gauge * 1.4;
  return axis === 'h' ? {x: b.x - e, y: b.y, w: b.w + 2 * e, h: b.h} : {x: b.x, y: b.y - e, w: b.w, h: b.h + 2 * e};
};
/**
 * Status tag (pill with a dot) in the look of the causation kit's stateTag, but allowed a second line
 * so narrow boxes can keep it beside its track. Anchor 'middle': x = centre, y = top.
 */
function statusTag(ctx, text, o) {
  const size = o.size ?? 22;
  const ls = 0.5;
  const padX = size * 0.7;
  const fit = ctx.fit(text, {maxWidth: o.maxWidth - padX * 2 - size * 0.9, size, maxLines: o.maxLines ?? 1, weight: 700});
  const textW = fit.width + ls * Math.max(0, Math.max(...fit.lines.map(l => l.length)) - 1);
  const w = textW + padX * 2 + size * 0.9;
  const hh = fit.height + size * 0.75;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.x;
  const col = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: o.opacity},
    h('rect', {x: r(x), y: r(o.y), width: r(w), height: r(hh), rx: r(Math.min(hh / 2, size * 0.875)), fill: o.fill ?? ctx.theme.card, stroke: col, 'stroke-width': 2}),
    h('circle', {cx: r(x + padX + size * 0.2), cy: r(o.y + size * 0.375 + fit.size * 0.5), r: r(size * 0.26), fill: col}),
    textBlock(fit, {x: x + padX + size * 0.75, y: o.y + size * 0.375 + fit.size * 0.02, fill: col, letterSpacing: ls}),
  );
  return {node, box: {x, y: o.y, w, h: hh}, lines: fit.lines.length, truncated: fit.truncated, fs: fit.size};
}
const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
const boxGap = (a, b) => Math.hypot(Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), 0), Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h), 0));
const inBox = (a, b, pad = 0) => a.x >= b.x + pad && a.y >= b.y + pad && a.x + a.w <= b.x + b.w - pad && a.y + a.h <= b.y + b.h - pad;

/**
 * Build the six parts in local coordinates (origin = the part's joint with the rest).
 * Each part declares its `ports` (the physical shapes links attach to), `bodies`
 * (everything captions must avoid), a `dock` (text-free point the tracer stops on)
 * and the `center` it grows about when it is the focus.
 */
function buildParts(ctx, S0, p, lk = 1) {
  const th = ctx.theme;
  const t = ctx.t;
  const pal = palette(ctx);
  const {d, n} = AXES[S0.axis];
  const gw = S0.gauge;
  const labelOf = id => {
    const e = p.elements.find(x => x.id === id);
    return e ? e.label : t[id] || id;
  };
  const route = routeOf(p.routeState);
  const marker = markerOf(p.routeState);
  const parts = {};
  const showKey = ctx.show('key');
  // element labels sit inside the scaled board: `lk` scales them up so they read at caption size on screen
  const lab = (text, o) => {
    const size = S0.chip * lk;
    const opts = {maxWidth: o.maxWidth * lk, size, minSize: size * 0.92, maxLines: 3, fill: th.card, stroke: th.inkSoft, name: o.name};
    const pr = chip(ctx, text, {...opts, x: 0, y: 0, anchor: o.anchor});
    const y = o.vAlign === 'middle' ? o.y - pr.box.h / 2 : o.vAlign === 'bottom' ? o.y - pr.box.h : o.y;
    return chip(ctx, text, {...opts, x: o.x, y, anchor: o.anchor});
  };

  // --- fact: card on a wagon over a short stub of main track ending at (0,0)
  const card = factCard(ctx, {prefix: 'card', w: S0.cardW, facts: p.facts, heading: labelOf('fact'), marker, size: S0.size, maxLines: 6, markerSide: S0.axis === 'v' ? 'left' : 'right'});
  const stubLen = (S0.axis === 'h' ? card.w : card.h) + (S0.stubExtra ?? 70);
  const stub = trackPiece(ctx, {prefix: 'stub', axis: S0.axis, len: stubLen, gauge: gw, buffer: null, light: pal.rule});
  const cc = {x: -d.x * stubLen / 2, y: -d.y * stubLen / 2};
  const wag = wagon(ctx, {name: 'fact-wagon', along: (S0.axis === 'h' ? card.w : card.h) + 40, across: gw * 1.9});
  const wagAngle = Math.atan2(d.y, d.x) * 180 / Math.PI;
  const cardB = cardBox(card, cc);
  const cardBody = {x: cc.x + card.x0, y: cc.y + card.y0, w: card.w, h: card.h};
  const slotBox = {x: cc.x + card.emblem.x - card.slot / 2, y: cc.y + card.emblem.y - card.slot / 2, w: card.slot, h: card.slot};
  const stubBox = shift(bedBox(stub.box, S0.axis, gw), {x: -d.x * stubLen, y: -d.y * stubLen});
  parts.fact = {
    node: g(null, g({transform: T(-d.x * stubLen, -d.y * stubLen)}, stub.node), g({transform: T(cc.x, cc.y, wagAngle)}, wag), g({transform: T(cc.x, cc.y)}, card.node)),
    anchor: cardB,
    full: unionBox([cardB, stubBox]),
    ports: [cardBody, slotBox],
    bodies: [cardB, stubBox],
    capBodies: [cardB, shift(stub.box, {x: -d.x * stubLen, y: -d.y * stubLen})],
    piece: stubBox,
    texts: [cardBody],
    dock: {x: cc.x + card.emblem.x, y: cc.y + card.emblem.y},
    center: cc,
    card, cardCenter: cc,
  };

  // --- lens: magnifier lying with its glass at (0,0); the glass shows the card's marker enlarged
  const R = S0.R;
  const mag = magnifier(ctx, {prefix: 'mag', R, handle: R * 1.9, content: g(null,
    h('rect', {x: -R * 1.2, y: -R * 1.2, width: R * 2.4, height: R * 2.4, fill: th.paper}),
    h('rect', {x: -R * 1.2, y: -R * 0.1, width: R * 2.4, height: R * 1.3, fill: pal.ruleSoft, opacity: 0.6}),
    g({transform: T(0, 0)}, emblem(ctx, {s: card.emblem.s, mode: marker})))});
  const magAngle = S0.axis === 'h' ? -38 : -35;
  // the label keeps to the side away from the handle (the handle points up and to the right)
  const lensLabel = showKey ? lab(labelOf('lens'), S0.axis === 'h'
    ? {x: -R - 14, y: 0, vAlign: 'middle', anchor: 'end', maxWidth: 280, name: 'lens-label'}
    : {x: R * 0.3, y: -R - 16, vAlign: 'bottom', anchor: 'end', maxWidth: 280, name: 'lens-label'}) : null;
  const handleEnd = {x: Math.cos(magAngle * Math.PI / 180) * (R * 2.9), y: Math.sin(magAngle * Math.PI / 180) * (R * 2.9)};
  const lensCore = {x: -R - 8, y: -R - 8, w: 2 * R + 16, h: 2 * R + 16};
  const handleBox = {x: Math.min(0, handleEnd.x) - 12, y: Math.min(0, handleEnd.y) - 12, w: Math.abs(handleEnd.x) + 24, h: Math.abs(handleEnd.y) + 24};
  parts.lens = {
    node: g(null, mag.view, mag.body, lensLabel && lensLabel.node),
    anchor: lensCore,
    full: unionBox([lensCore, handleBox, lensLabel && lensLabel.box]),
    ports: [{x: 0, y: 0, r: R}],
    bodies: [lensCore, handleBox, lensLabel && lensLabel.box].filter(Boolean),
    dock: {x: 0, y: 0},
    center: {x: 0, y: 0},
    label: lensLabel && lensLabel.box,
    texts: [lensLabel && lensLabel.box].filter(Boolean),
    labelFit: lensLabel && lensLabel.fit,
    // props labels must never cover: the glass and the handle (a capsule from the rim to its end)
    props: {circle: {x: 0, y: 0, r: R + Math.max(8, R * 0.14) / 2}, handle: {a: {x: Math.cos(magAngle * Math.PI / 180) * R, y: Math.sin(magAngle * Math.PI / 180) * R}, b: handleEnd, r: R * 0.15 + 2}},
    mag, magAngle,
  };

  // --- condition: socket plate (at 0,0) with its plaque beside it
  const sockS = S0.size * 1.05;
  const plate = sockS * 2.7;
  // wide boxes: plaque beside the plate; tall boxes: plaque above it
  const beside = S0.axis === 'h';
  const condPl = plaque(ctx, {name: 'pl-con', x: 0, y: 0, w: S0.condW, heading: labelOf('condition'), text: p.rules.condition, color: pal.excSoft, soft: pal.excSoft, headInk: pal.excInk, icon: 'socket', size: S0.plaque, maxLines: 8});
  const plAt = beside ? {x: plate / 2 + 22, y: -condPl.box.h / 2} : {x: -S0.condW / 2, y: plate / 2 + 22};
  const condNode = g(null,
    h('path', {d: roundRectPath(-plate / 2, -plate / 2, plate, plate, 10), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    emblem(ctx, {s: sockS, mode: 'socket'}),
    emblem(ctx, {name: 'sock-fill', s: sockS, mode: marker === 'disputed' ? 'disputed' : 'present', opacity: 0}),
    beside
      ? h('line', {x1: r(plate / 2), y1: 0, x2: r(plate / 2 + 22), y2: 0, stroke: th.inkSoft, 'stroke-width': 5, 'stroke-linecap': 'round'})
      : h('line', {x1: 0, y1: r(plate / 2), x2: 0, y2: r(plate / 2 + 22), stroke: th.inkSoft, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    g({transform: T(plAt.x, plAt.y)}, condPl.node),
  );
  const plateBox = {x: -plate / 2, y: -plate / 2, w: plate, h: plate};
  const plBox = {x: plAt.x, y: plAt.y, w: condPl.box.w, h: condPl.box.h};
  parts.condition = {node: condNode, anchor: plateBox, full: unionBox([plateBox, plBox]), ports: [plateBox], bodies: [plateBox, plBox], texts: [plBox], dock: {x: 0, y: 0}, center: {x: 0, y: 0}};

  // --- connector: turnout (main segment, branch stub, blade, lever + rod) with the switch at (0,0)
  const geom = junctionGeom({axis: S0.axis, a: {x: -d.x * S0.a, y: -d.y * S0.a}, sDist: S0.a, len: S0.a + S0.b, off: S0.off, curve: S0.b, gauge: gw, endGap: 0, gateAfter: 0, bladeLen: S0.b * 0.52});
  const leverAt = {x: d.x * S0.b * 0.18 - n.x * (gw * 1.35 + 80), y: d.y * S0.b * 0.18 - n.y * (gw * 1.35 + 80)};
  const jp = junctionParts(ctx, {prefix: 'jn', geom, lever: {x: leverAt.x, y: leverAt.y, dir: {x: -n.x, y: -n.y}, slot: 70}, buffers: false, gate: false});
  // beside the lever frame, clear of the track bed
  const connLabel = showKey ? (S0.axis === 'h'
    ? lab(labelOf('connector'), S0.connLabelLeft
      // square: the free side of the lever faces the fact wagon's row (the rule plaque sits to the right)
      // square: under the lever frame (the fact wagon's row is to its left, the rule plaque to its right)
      ? {x: leverAt.x, y: leverAt.y + 90, anchor: 'middle', maxWidth: 260, name: 'conn-label'}
      // (top-aligned with the lever frame, so extra lines grow downward beside the lever, not into the row above)
      : {x: leverAt.x + 50, y: leverAt.y - 40, anchor: 'start', maxWidth: 260, name: 'conn-label'})
    : lab(labelOf('connector'), {x: -gw * 1.45 - 16, y: leverAt.y - 44, vAlign: 'bottom', anchor: 'end', maxWidth: 220, name: 'conn-label'})) : null;
  const across = gw * 1.45;
  const leverReach = gw * 1.35 + 80 + 36;
  const connCore = S0.axis === 'h'
    ? {x: -S0.a, y: -S0.off - across, w: S0.a + S0.b, h: S0.off + across + leverReach}
    : {x: -leverReach, y: -S0.a, w: leverReach + S0.off + across, h: S0.a + S0.b};
  // the turnout is a module on its own small baseboard: links that land on its edge land on material
  const plateArt = g(null,
    h('path', {d: roundRectPath(connCore.x + 5, connCore.y + 7, connCore.w, connCore.h, 22), fill: th.shadow}),
    h('path', {d: roundRectPath(connCore.x, connCore.y, connCore.w, connCore.h, 22), fill: pal.board, stroke: pal.boardEdge, 'stroke-width': 3}),
    h('path', {d: roundRectPath(connCore.x + 9, connCore.y + 9, connCore.w - 18, connCore.h - 18, 15), fill: 'none', stroke: shade(pal.board, 0.35), 'stroke-width': 2}),
    [[connCore.x + 16, connCore.y + 16], [connCore.x + connCore.w - 16, connCore.y + 16], [connCore.x + 16, connCore.y + connCore.h - 16], [connCore.x + connCore.w - 16, connCore.y + connCore.h - 16]]
      .map(([cx, cy]) => h('circle', {cx: r(cx), cy: r(cy), r: 4.5, fill: '#d6dadd', stroke: pal.boardEdge, 'stroke-width': 1.5})),
  );
  // the lever frame (slot 70 + 70, 58 wide, with its shadow) reaches past the baseboard
  const lvL = 70 + 8, lvW = 29 + 6;
  const leverBox = S0.axis === 'h' ? {x: leverAt.x - lvW, y: leverAt.y - lvL, w: 2 * lvW, h: 2 * lvL} : {x: leverAt.x - lvL, y: leverAt.y - lvW, w: 2 * lvL, h: 2 * lvW};
  parts.connector = {
    node: g(null, plateArt, jp.bed, jp.lights, jp.rails, jp.rod, jp.blade, jp.pivot, jp.lever, connLabel && connLabel.node),
    anchor: connCore,
    full: unionBox([connCore, leverBox, connLabel && connLabel.box]),
    ports: [connCore],
    bodies: [connCore, leverBox, connLabel && connLabel.box].filter(Boolean),
    piece: unionBox([connCore, leverBox]),
    dock: {x: 0, y: 0},
    center: {x: connCore.x + connCore.w / 2, y: connCore.y + connCore.h / 2},
    label: connLabel && connLabel.box,
    labelFit: connLabel && connLabel.fit,
    props: {box: leverBox},
    texts: [connLabel && connLabel.box].filter(Boolean),
    jp, geom,
  };

  // --- rule: main track from (0,0) with a blue buffer; plaque beside (wide) or under its end (tall)
  const L = S0.trackLen;
  const ruleTrack = trackPiece(ctx, {prefix: 'rt', axis: S0.axis, len: L, gauge: gw, buffer: pal.rule, light: pal.rule});
  const exTrack = trackPiece(ctx, {prefix: 'xt', axis: S0.axis, len: L, gauge: gw, buffer: pal.exc, light: pal.exc, gate: {at: 125, side: -1}});
  const plW = S0.plaqueW;
  const mkPlaque = (kind, x, y) => plaque(ctx, {name: `pl-${kind}`, x, y, w: plW, heading: labelOf(kind), text: kind === 'rule' ? p.rules.general : p.rules.exception,
    color: kind === 'rule' ? pal.rule : pal.exc, soft: kind === 'rule' ? pal.ruleSoft : pal.excSoft, headInk: kind === 'rule' ? '#ffffff' : pal.excInk, icon: kind === 'rule' ? 'main' : 'branch', size: S0.plaque, maxLines: 8});
  let rulePl, excPl;
  if (S0.axis === 'h') {
    // (never reaching back under the gap before the track: that is where its link's caption sits)
    rulePl = mkPlaque('rule', Math.max(0, L / 2 - plW / 2), across + 18);
    if (S0.excAbove) {
      const probe = mkPlaque('exception', 0, 0);
      excPl = mkPlaque('exception', Math.max(40, L / 2 - plW / 2 + 30), -across - 18 - probe.box.h);
    } else excPl = mkPlaque('exception', Math.max(40, L / 2 - plW / 2 + 30), across + 18);
  } else {
    rulePl = mkPlaque('rule', -plW / 2, L + 26);
    excPl = mkPlaque('exception', -plW / 2, L + 26);
  }
  const trackCenter = {x: d.x * L / 2, y: d.y * L / 2};
  const trackDock = {x: d.x * L * 0.3, y: d.y * L * 0.3};
  const ruleBed = bedBox(ruleTrack.box, S0.axis, gw), excBed = bedBox(exTrack.box, S0.axis, gw);
  // bodies[0] is always the whole track piece (bed, sleepers and buffer stop): nothing may rest on it
  parts.rule = {node: g(null, ruleTrack.node, rulePl.node), anchor: ruleTrack.box, full: unionBox([ruleBed, rulePl.box]), ports: [ruleTrack.box], bodies: [ruleBed, rulePl.box], capBodies: [ruleTrack.box, rulePl.box], texts: [rulePl.box], piece: ruleBed, dock: trackDock, center: trackCenter, track: ruleTrack};
  // the gate post and its boom stand just beside the siding: neighbours keep off them too
  const gp = exTrack.gateAngles.post;
  // (the open boom lies along the track, upstream of the post)
  const boomEnd = {x: gp.x - d.x * gw * 2.7, y: gp.y - d.y * gw * 2.7};
  const gateBox = unionBox([{x: gp.x - gw * 0.6, y: gp.y - gw * 0.6, w: gw * 1.2, h: gw * 1.2}, {x: boomEnd.x - gw * 0.4, y: boomEnd.y - gw * 0.4, w: gw * 0.8, h: gw * 0.8}]);
  parts.exception = {node: g(null, exTrack.node, excPl.node), anchor: exTrack.box, full: unionBox([excBed, excPl.box, gateBox]), ports: [exTrack.box], bodies: [excBed, excPl.box, gateBox], capBodies: [exTrack.box, excPl.box, gateBox], texts: [excPl.box], piece: excBed, dock: trackDock, center: trackCenter, track: exTrack};

  // content text (fitted sizes in local units): the rule texts and the first fact are primary, the
  // fact's secondary line and the plaque headings secondary
  const content = [];
  if (ctx.show('all')) {
    const pad = Math.round(S0.size * 0.55);
    (p.facts || []).slice(0, 3).forEach((text, i) => {
      const fsz = i === 0 ? S0.size : S0.size * 0.82;
      const f = ctx.fit(text, {maxWidth: S0.cardW - pad * 2, size: fsz, minSize: fsz * 0.76, maxLines: i === 0 ? 6 : 3, weight: i === 0 ? 700 : 500});
      content.push({name: `fact${i}`, part: 'fact', size: f.size, primary: i === 0});
    });
    content.push({name: 'condition', part: 'condition', size: condPl.fit.size, primary: true});
    content.push({name: 'rule', part: 'rule', size: rulePl.fit.size, primary: true});
    content.push({name: 'exception', part: 'exception', size: excPl.fit.size, primary: true});
  }
  return {parts, card, geom, route, marker, sockS, content};
}

/** Assembled and exploded positions (world, before centring). */
function placeParts(S0, P) {
  const {d, n} = AXES[S0.axis];
  const at = (s, k) => ({x: d.x * s + n.x * k, y: d.y * s + n.y * k});
  const C = {x: 0, y: 0};
  const asm = {
    connector: C,
    fact: at(-S0.a, 0),
    rule: at(S0.b, 0),
    exception: at(S0.b, S0.off),
  };
  // the socket stands beside the siding's gate post (toward the main line), the magnifier over the card's marker
  const gateAt = P.parts.exception.track.gateAngles;
  asm.condition = {x: asm.exception.x + gateAt.post.x + gateAt.away.x * (P.sockS * 1.35 + 22), y: asm.exception.y + gateAt.post.y + gateAt.away.y * (P.sockS * 1.35 + 22)};
  const mk = {x: P.parts.fact.cardCenter.x + P.card.emblem.x, y: P.parts.fact.cardCenter.y + P.card.emblem.y};
  asm.lens = {x: asm.fact.x + mk.x, y: asm.fact.y + mk.y};
  // exploded: a 3 × 2 grid — bottom row fact · switch · main track, top row magnifier ·
  // condition · siding (wide boxes); the same grid transposed for tall boxes
  const A = P.parts;
  const cA = A.connector.anchor;
  const cF = A.condition.full;
  const pos = {connector: C, fact: at(-S0.a - S0.gapD, 0), rule: at(S0.b + S0.gapD, 0)};
  if (S0.axis === 'h') {
    pos.condition = {x: cA.x + cA.w / 2 - (cF.x + cF.w / 2), y: cA.y - S0.gapN - (cF.y + cF.h)};
    const rowY = pos.condition.y + cF.y + cF.h / 2;
    pos.lens = {x: pos.fact.x + A.fact.cardCenter.x, y: rowY};
    pos.exception = {x: S0.b + S0.gapD * 0.85, y: rowY};
  } else {
    pos.condition = {x: cA.x + cA.w + S0.gapN - cF.x, y: cA.y + cA.h / 2 - 20};
    const colX = pos.condition.x + cF.x + cF.w / 2;
    pos.lens = {x: colX, y: pos.fact.y + A.fact.cardCenter.y};
    pos.exception = {x: colX, y: S0.b + S0.gapD * 0.85};
  }
  // wide cards and plaques (long texts) must not run into their neighbours along the main line:
  // push the outer parts out until every neighbour pair keeps a clear gap (a no-op for normal texts)
  const g0 = 30;
  const box = id => shift(A[id].full, pos[id]);
  const along = b => (S0.axis === 'h' ? {lo: b.x, hi: b.x + b.w} : {lo: b.y, hi: b.y + b.h});
  const push = (id, v) => { if (v > 0) pos[id] = {x: pos[id].x + d.x * v, y: pos[id].y + d.y * v}; };
  const across = (a0, b0) => (S0.axis === 'h' ? a0.y < b0.y + b0.h && b0.y < a0.y + a0.h : a0.x < b0.x + b0.w && b0.x < a0.x + a0.w);
  for (const [inner, outer, dir] of [['connector', 'rule', 1], ['condition', 'exception', 1], ['connector', 'fact', -1], ['condition', 'lens', -1]]) {
    const bi = box(inner), bo = box(outer);
    if (!across(bi, bo)) continue;
    const ai = along(bi), ao = along(bo);
    push(outer, dir > 0 ? ai.hi + g0 - ao.lo : 0);
    if (dir < 0 && ao.hi + g0 > ai.lo) pos[outer] = {x: pos[outer].x - d.x * (ao.hi + g0 - ai.lo), y: pos[outer].y - d.y * (ao.hi + g0 - ai.lo)};
  }
  return {asm, pos};
}

/**
 * Scene geometry for one state of the mechanism, in design coordinates.
 * @param {any} L layout
 * @param {{e:number, g:number, kk:(id:string)=>number}} s explode, gather and per-part scale
 */
function geomAt(L, s) {
  const z = lerp(1, L.cam.z, s.g);
  const tx = lerp(0, L.cam.tx, s.g), ty = lerp(0, L.cam.ty, s.g);
  const S = z * L.k;
  const T0 = {x: z * L.ox + tx, y: z * L.oy + ty};
  const parts = {};
  for (const id of IDS) {
    const part = L.P.parts[id];
    const qe = {x: lerp(L.asm[id].x, L.pos[id].x, s.e), y: lerp(L.asm[id].y, L.pos[id].y, s.e)};
    const q = {x: lerp(qe.x, L.gpos[id].x, s.g), y: lerp(qe.y, L.gpos[id].y, s.g)};
    const kk = s.kk(id);
    const c = part.center;
    const pt = p0 => ({x: T0.x + S * (q.x + c.x + (p0.x - c.x) * kk), y: T0.y + S * (q.y + c.y + (p0.y - c.y) * kk)});
    const shp = sh => {
      if (sh.r !== undefined) {
        const o = pt(sh);
        return {x: o.x, y: o.y, r: sh.r * kk * S};
      }
      const o = pt(sh);
      return {x: o.x, y: o.y, w: sh.w * kk * S, h: sh.h * kk * S};
    };
    // capBodies: what relation captions keep off (a caption may sit on its link over a ballast bed's round end)
    parts[id] = {q, kk, pt, sc: kk * S, ports: part.ports.map(shp), bodies: part.bodies.map(shp), capBodies: (part.capBodies || part.bodies).map(shp), piece: part.piece ? shp(part.piece) : null,
      label: part.label ? shp(part.label) : null, texts: (part.texts || []).map(shp), dock: pt(part.dock)};
  }
  return {parts, S, T0, z};
}

/** Landing points of every supplied relationship for a geometry. */
function linkEnds(L, G) {
  return L.rels.map(rl => {
    const a = G.parts[rl.from], b = G.parts[rl.to];
    const A = exitPoint(a.ports, a.dock, b.dock);
    const B = entryPoint(b.ports, A, b.dock);
    return {A, B};
  });
}


/** Does the segment a→b touch the box (grown by pad)? (Liang–Barsky clip) */
function segHitsBox(a, b, bx, pad = 0) {
  const x0 = bx.x - pad, y0 = bx.y - pad, x1 = bx.x + bx.w + pad, y1 = bx.y + bx.h + pad;
  const dx = b.x - a.x, dy = b.y - a.y;
  let t0 = 0, t1 = 1;
  for (const [pp, qq] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]]) {
    if (pp === 0) {
      if (qq < 0) return false;
    } else {
      const tt = qq / pp;
      if (pp < 0) { if (tt > t1) return false; if (tt > t0) t0 = tt; } else { if (tt < t0) return false; if (tt < t1) t1 = tt; }
    }
  }
  return true;
}
/** A curve as a dense polyline (up to its drawn fraction). */
const polyOf = (cv, upto = 1, n = 40) => Array.from({length: n + 1}, (_, q) => cv.at(upto * q / n));
const polyHitsBox = (pts, bx, pad = 0) => pts.some((p0, i) => i > 0 && segHitsBox(pts[i - 1], p0, bx, pad));

/** Where a caption placed at {t, sg, dd} sits on a curve: the curve point, the caption centre and box. */
function capPos(cv, pl, size) {
  const m = cv.at(pl.t);
  const dir = {x: -Math.sin(m.a), y: Math.cos(m.a)};
  const c = {x: m.x + dir.x * pl.dd * pl.sg, y: m.y + dir.y * pl.dd * pl.sg};
  return {m, c, box: {x: c.x - size.w / 2, y: c.y - size.h / 2, w: size.w, h: size.h}};
}

/**
 * Place every relation caption beside its OWN link, valid at once for several geometries
 * (e.g. the exploded view and the same view with the focus part lifted). A caption sits on its
 * line when that spot is clear, else it is pushed perpendicular to the line with a short dashed
 * leader. Hard rules: inside the bounds, off every part, prop and label, off every OTHER link, off
 * the captions already placed, and its leader never runs behind another caption (nor does another
 * caption's leader run behind it). The most constrained captions are placed first.
 * @returns {Array<{t:number, sg:number, dd:number}>}
 */
function placeCaptions(sizes, variants, bounds) {
  const n = sizes.length;
  const polys = variants.map(v => v.curves.map(cv => polyOf(cv)));
  const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  const cands = i => {
    const out = [];
    const cv = variants[0].curves[i];
    for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73]) {
      out.push({t, sg: 1, dd: 0});
      const m = cv.at(t);
      const dir = {x: -Math.sin(m.a), y: Math.cos(m.a)};
      const dd0 = Math.abs(dir.x) * sizes[i].w / 2 + Math.abs(dir.y) * sizes[i].h / 2 + 14;
      for (let k = 0; k < 8; k++) for (const sg of [1, -1]) out.push({t, sg, dd: dd0 + k * 14});
    }
    return out;
  };
  // placed[vi] = [{i, box, lead:{a,b}|null}]
  const score = (i, pl, placed) => {
    let bad = 0;
    let cost = Math.abs(pl.t - 0.5) * 60 + pl.dd * 0.9;
    variants.forEach((v, vi) => {
      // in a soft variant (weight < 1) touching a part only steers the choice; other links, captions and
      // leaders stay hard rules in every variant
      const soft = (v.weight ?? 1) < 1;
      const {m, c, box} = capPos(v.curves[i], pl, sizes[i]);
      if (!inside(box)) bad += 1e6;
      for (const q of v.obstacles) if (hit(box, q, 6)) { if (soft) cost += 1e4 * v.weight; else bad += 1e4; }
      polys[vi].forEach((pts, j) => { if (j !== i && polyHitsBox(pts, box, 5)) bad += 2e4; });
      for (const q of placed[vi]) {
        if (hit(box, q.box, 8)) bad += 1e4;
        if (q.lead && segHitsBox(q.lead.a, q.lead.b, box, 3)) bad += 1e4;
        if (pl.dd > 0 && segHitsBox(m, c, q.box, 3)) bad += 1e4;
      }
      if (pl.dd > 0) {
        // a leader should not cut across another link or run over a part
        polys[vi].forEach((pts, j) => { if (j !== i && pts.some((p0, q) => q > 0 && segsCross(m, c, pts[q - 1], p0))) cost += 400; });
        // …and never runs behind a card, plaque or label (crossing track or baseboard art is only discouraged)
        for (const q of v.texts) if (segHitsBox(m, c, q, 0)) { if (soft) cost += 1e4 * v.weight; else bad += 1e4; }
        for (const q of v.obstacles) if (segHitsBox(m, c, q, 0)) cost += 120;
      }
    });
    return bad + cost;
  };
  const placedPer = variants.map(() => []);
  const free = Array.from({length: n}, (_, i) => cands(i).filter(pl => score(i, pl, placedPer) < 1e4).length);
  const order = Array.from({length: n}, (_, i) => i).sort((a, b) => free[a] - free[b] || a - b);
  const res = new Array(n);
  for (const i of order) {
    let best = null;
    for (const pl of cands(i)) {
      const sc = score(i, pl, placedPer);
      if (!best || sc < best.sc) best = {pl, sc};
    }
    res[i] = best.pl;
    if (best.sc >= 1e4) res.bad = (res.bad || 0) + 1;
    variants.forEach((v, vi) => {
      const {m, c, box} = capPos(v.curves[i], best.pl, sizes[i]);
      placedPer[vi].push({i, box, lead: best.pl.dd > 0 ? {a: m, b: c} : null});
    });
  }
  return res;
}
const segsCross = (a, b, c, d) => {
  const o = (p, q, r0) => Math.sign((q.x - p.x) * (r0.y - p.y) - (q.y - p.y) * (r0.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
};

const scene = {
  sizes: {landscape: [1600, 880], square: [1080, 900], portrait: [900, 1400]},
  // Element labels and content text (fact card, plaques) live on the scaled board: lay out, then
  // enlarge them until the labels read like the captions and the content text reaches its floor
  // (primary >= ~17 px, the fact's second line >= 12.5 px in the 1080p frame). Captions keep their
  // size, so when a caption finds no free spot beside its own link (or parts touch in the exploded
  // view) the gaps between the parts grow and the layout is redone. Content-heavy texts switch to a
  // compact composition: captions and element labels capped at ~16 px (content never reads smaller
  // than the generic captions), wider cards/plaques, more compact text-free art and tighter margins.
  // The chosen settings are memoised per geometry-relevant parameters (a pure cache: same result).
  layout(ctx) {
    const key = JSON.stringify([ctx.view.shape, ctx.design, ctx.labels, Object.fromEntries(Object.entries(ctx.params).filter(([k0]) => !['background', 'palette', 'seed', 'reducedMotion', 'durationMs', 'theme'].includes(k0)))]);
    const known = LAYOUT_MEMO.get(key);
    if (known) return scene.layoutAt(ctx, known);
    const L = scene.search(ctx);
    if (LAYOUT_MEMO.size > 200) LAYOUT_MEMO.delete(LAYOUT_MEMO.keys().next().value);
    LAYOUT_MEMO.set(key, L.opts);
    return L;
  },
  search(ctx) {
    // gap multipliers {across the rows (gapN), along the main line (gapD)}, cheapest first
    const GAPS = [[1, 1], [1.3, 1], [1.6, 1], [1, 1.2], [1.3, 1.2], [1.9, 1], [1.6, 1.2], [1.9, 1.4], [2.2, 1.6]];
    const settle = (o, csMax) => {
      let L = scene.layoutAt(ctx, o);
      for (let it = 0; it < 4; it++) {
        // (sized for the smaller of the spread-out and the gathered scale, like the content text)
        const lk = ctx.show('key') ? Math.max(1, L.labelTarget / (L.S0.chip * L.k * Math.min(1, L.cam.z))) : 1;
        const cs = Math.min(csMax, Math.max(1, o.cs * Math.pow(L.contentNeed(), 0.8)));
        if (Math.abs(lk - o.lk) < 0.02 && Math.abs(cs - o.cs) < 0.02) break;
        o.lk = lk;
        o.cs = cs;
        L = scene.layoutAt(ctx, o);
      }
      return L;
    };
    const run = (base, csMax) => {
      let best = null;
      let carry = {lk: 1, cs: base.cs0 ?? 1};
      for (const gs of GAPS) {
        const o = {...base, ...carry, gs};
        const L = settle(o, csMax);
        carry = {lk: o.lk, cs: o.cs};
        const bad = L.capBad + L.partTouch;
        if (!best || bad < best.bad) best = {L, bad};
        if (bad === 0) break;
      }
      return best.L;
    };
    const ok = L0 => L0.capBad + L0.partTouch === 0 && L0.contentNeed() <= 1.03;
    const score = L0 => (L0.capBad + L0.partTouch) * 10 + L0.contentNeed();
    // text hierarchy: generic captions and element labels never read larger than the content text —
    // when they would, they are capped at the content size (never below 16 px) and the layout redone
    const hier = (L0, base, csMax) => {
      if (!ctx.show('all') || L0.captionPx() <= L0.primaryPx() + 0.05) return L0;
      let L1 = L0;
      for (let it = 0; it < 3 && L1.captionPx() > L1.primaryPx() + 0.05; it++) {
        const cap = Math.max(16.2, Math.min(L1.cap ?? Infinity, L1.primaryPx() - 0.2));
        L1 = run({...base, cap}, csMax);
      }
      return ok(L1) || !ok(L0) ? L1 : L0;
    };
    const L0 = run({cap: null, pw: 1, art: 1}, 1.15);
    if (!ctx.show('all')) return L0;
    const L = ok(L0) ? hier(L0, {pw: 1, art: 1}, 1.15) : L0;
    if (ok(L)) return L;
    let best = L;
    for (const heavy of [{art: 0.85, pw: 1.6}, {art: 0.72, pw: 2}, {art: 1, pw: 1.6}]) {
      const H = hier(run({cap: 16.2, tight: true, cs0: 1.3, ...heavy}, 1.6), {tight: true, cs0: 1.3, ...heavy}, 1.6);
      if (ok(H)) return H;
      if (score(H) < score(best)) best = H;
    }
    return best;
  },
  layoutAt(ctx, o) {
    const {lk, cs, gs, cap} = o;
    const shapeKey = o.shape || ctx.view.shape;
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const S0 = {...SHAPES[shapeKey]};
    S0.gapN *= gs[0];
    S0.gapD *= gs[1];
    // content text scale: the text of the fact card and the plaques grows fully, their widths only
    // partly (the texts take more lines instead: the square and portrait boxes have height to spare)
    for (const key of ['size', 'plaque']) S0[key] *= cs;
    // …and the card/plaque widths follow `pw` (wider when the box is height-bound, so texts take fewer lines)
    for (const key of ['cardW', 'plaqueW', 'condW']) S0[key] *= o.pw ?? 1;
    // …and the text-free art (tracks, turnout, magnifier) may be drawn more compactly (`art` < 1)
    for (const key of ['gauge', 'R', 'a', 'b', 'off', 'trackLen']) S0[key] *= o.art ?? 1;
    // design units → pixels in the standard 1080p frame of this shape (default caption-safe area)
    const STD = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[ctx.view.shape];
    const stdC = {w: STD[0] * 0.88, h: STD[1] * 0.74 - (p.contentNotice ? Math.min(STD[0], STD[1]) * 0.057 : 0)};
    const std = Math.min(stdC.w / D.w, stdC.h / D.h);
    // relation captions (design units) and element labels (on-screen design size): capped when content needs room
    S0.capSize = cap ? Math.min(S0.chip * 0.95, cap / std) : S0.chip * 0.95;
    const labelTarget = cap ? Math.min(S0.chip, cap / std) : S0.chip;
    const P = buildParts(ctx, S0, p, lk);
    const {asm, pos} = placeParts(S0, P);
    // exploded composition, centred and scaled into the design box
    const ext = unionBox(IDS.map(id => shift(P.parts[id].full, pos[id])));
    // the assembled junction starts centred on the same point, so the parts spread outward evenly
    const asmExt = unionBox(IDS.map(id => shift(P.parts[id].anchor, asm[id])));
    const dAsm = {x: ext.x + ext.w / 2 - (asmExt.x + asmExt.w / 2), y: ext.y + ext.h / 2 - (asmExt.y + asmExt.h / 2)};
    for (const id of IDS) asm[id] = {x: asm[id].x + dAsm.x, y: asm[id].y + dAsm.y};
    // content-heavy layouts use tighter margins and a full-width issue line
    const margin = o.tight ? 16 : 34;
    let issue = null;
    if (ctx.show('all') && p.issues.length) {
      // every supplied issue is printed (joined), not only the first
      issue = chip(ctx, `${t.issue}: ${p.issues.join(' · ')}`, {x: margin, y: 12, maxWidth: D.w * (S0.axis === 'v' || o.tight ? 0.92 : 0.62), size: S0.chip, maxLines: 3, fill: '#fff8dc', stroke: th.accent3, name: 'issue', weight: 600, radius: 6});
    }
    const topRoom = issue ? issue.box.y + issue.box.h + 24 : 24;
    // footnote of the final hold, along the bottom of the design box: the supplied assumptions and the
    // reminder that states are shown as supplied and no conclusion is drawn (the gathered view keeps clear)
    let foot = null;
    if (ctx.show('all')) {
      const text = p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ${t.noConclusion}` : t.noConclusion;
      const fo = {maxWidth: D.w - 2 * margin, size: Math.max(S0.chip * 0.8, 16.5 / std), maxLines: 2, fill: th.card, stroke: th.inkFaint, name: 'foot', weight: 500, radius: 6};
      const probe = chip(ctx, text, {...fo, x: 0, y: 0});
      foot = chip(ctx, text, {...fo, x: margin, y: D.h - 6 - probe.box.h});
    }
    const Hb = foot ? foot.box.y - 12 : D.h;
    const kW = (D.w - 2 * margin) / ext.w, kH = (D.h - 2 * margin - topRoom) / ext.h;
    const k = Math.min(1.45, kW, kH);
    const ox = (D.w - ext.w * k) / 2 - ext.x * k;
    const oy = topRoom + (D.h - topRoom - ext.h * k) / 2 - ext.y * k;
    const rels = p.relationships.filter(rl => rl.from !== rl.to);
    const L = {S0, P, asm, pos, k, ox, oy, rels, issue, cam: {z: 1, tx: 0, ty: 0}, gpos: pos, capBad: 0};
    const kk1 = () => 1;
    {
      // the lifted focus part grows about a centre chosen so that it stays inside the design box
      // (its label never dips into the caption band below)
      const fp = P.parts[p.focusElement];
      const f = S0.focus;
      const B = unionBox(fp.bodies.map(shapeBox).map(b => ({x: ox + k * (pos[p.focusElement].x + b.x), y: oy + k * (pos[p.focusElement].y + b.y), w: b.w * k, h: b.h * k})));
      const W0 = {x: ox + k * (pos[p.focusElement].x + fp.center.x), y: oy + k * (pos[p.focusElement].y + fp.center.y)};
      const lim = {x0: 8, y0: topRoom - 8, x1: D.w - 8, y1: D.h - 8};
      const fitAxis = (w0, lo0, hi0, a0, a1) => {
        const lo = (f * a1 - hi0) / (f - 1), hi = (f * a0 - lo0) / (f - 1);
        return lo > hi ? (lo + hi) / 2 : clamp(w0, lo, hi);
      };
      const Wc = {x: fitAxis(W0.x, lim.x0, lim.x1, B.x, B.x + B.w), y: fitAxis(W0.y, lim.y0, lim.y1, B.y, B.y + B.h)};
      fp.center = {x: (Wc.x - ox) / k - pos[p.focusElement].x, y: (Wc.y - oy) / k - pos[p.focusElement].y};
    }
    {
      // exploded view: no two parts (with their labels and plaques) may touch
      const GX = geomAt(L, {e: 1, g: 0, kk: kk1});
      const bs = IDS.map(id => GX.parts[id].bodies.map(shapeBox));
      L.touching = [];
      for (let i = 0; i < IDS.length; i++) for (let j = i + 1; j < IDS.length; j++) if (bs[i].some(a => bs[j].some(b => hit(a, b, 6)))) L.touching.push([IDS[i], IDS[j]]);
      L.partTouch = L.touching.length;
    }

    // --- gathered state: every part slides part of the way back toward its place in the assembled
    // junction. Each part moves as far as it can (up to 85 % of the way) while all parts stay apart
    // and every link keeps a readable length (greedy, in fixed steps: deterministic).
    const GE0 = geomAt(L, {e: 1, g: 0, kk: kk1});
    const lenE = linkEnds(L, GE0).map(e2 => Math.hypot(e2.B.x - e2.A.x, e2.B.y - e2.A.y));
    // a gathered link must still carry its caption on the line with visible stubs at both ends
    const capSz = rels.map(rl => (ctx.show('all') ? chip(ctx, rl.label || p.relationLabels[rl.kind] || t[rl.kind] || rl.kind, {x: 0, y: 0, maxWidth: o.tight ? 170 : 240, size: S0.capSize, minSize: o.tight ? S0.capSize : undefined, maxLines: o.tight ? 3 : 2, weight: 600}).box : {w: 0, h: 0}));
    const needLen = (e2, i) => {
      const dx = Math.abs(e2.B.x - e2.A.x), dy = Math.abs(e2.B.y - e2.A.y);
      const len = Math.hypot(dx, dy) || 1;
      return Math.min(lenE[i], (dx / len) * capSz[i].w + (dy / len) * capSz[i].h + 64);
    };
    const gposOf = f => Object.fromEntries(IDS.map(id => [id, {x: pos[id].x + (asm[id].x - pos[id].x) * f[id], y: pos[id].y + (asm[id].y - pos[id].y) * f[id]}]));
    const fits = f => {
      const Gs = geomAt({...L, gpos: gposOf(f)}, {e: 1, g: 1, kk: kk1});
      const bodies = IDS.map(id => Gs.parts[id].bodies);
      for (let i = 0; i < IDS.length; i++) {
        for (let j = i + 1; j < IDS.length; j++) {
          if (bodies[i].some(a => bodies[j].some(b => overlaps(shapeBox(a), shapeBox(b), 30 * k)))) return false;
        }
      }
      return linkEnds(L, Gs).every((e2, i) => Math.hypot(e2.B.x - e2.A.x, e2.B.y - e2.A.y) >= Math.min(lenE[i], Math.max(needLen(e2, i), lenE[i] * 0.5)) - 0.01);
    };
    let pull = Object.fromEntries(IDS.map(id => [id, 0]));
    for (let step = 0; step < 16; step++) {
      let moved = false;
      for (const id of IDS) {
        if (pull[id] >= 0.85 - 1e-9) continue;
        const f2 = {...pull, [id]: pull[id] + 0.05};
        if (fits(f2)) { pull = f2; moved = true; }
      }
      if (!moved) break;
    }
    L.gpos = gposOf(pull);
    L.pull = pull;
    const links = rels.map((rl, i) => liveLink(ctx, {name: `rl${i}`, kind: rl.kind, color: kindColor(ctx, rl.kind)}));
    const bends = rels.map((_, i) => (i % 2 ? 0.1 : -0.1));
    const curvesFor = G => linkEnds(L, G).map((e2, i) => links[i].curve(e2.A, e2.B, bends[i]));

    // --- status tag text (the supplied state, never a conclusion); one line, or two when that frees a slot
    const named = P.route === 'main' ? 'rule' : 'exception';
    const tagText = !ctx.show('key') ? null : P.route === 'branch' ? t.branchOpen : P.route === 'main' ? t.stateMain : (p.routeState === 'held-disputed' ? t.stateDisputed : t.statePending);
    const tagVariants = [];
    if (tagText) {
      const one = statusTag(ctx, tagText, {x: 0, y: 0, size: S0.chip, maxWidth: D.w * 0.5, maxLines: 1});
      tagVariants.push({maxWidth: D.w * 0.5, maxLines: 1, box: one.box});
      const two = statusTag(ctx, tagText, {x: 0, y: 0, size: S0.chip, maxWidth: one.box.w * 0.62, maxLines: 2});
      if (two.lines === 2 && !two.truncated) tagVariants.push({maxWidth: one.box.w * 0.62, maxLines: 2, box: two.box});
    }

    // relation captions: sized once, placed for a geometry (on their link when clear, else pushed aside)
    const bounds = {x: 10, y: 10, w: D.w - 20, h: D.h - 20};
    const boundsG = {...bounds, h: Hb - 20};
    const labelsText = rels.map(rl => rl.label || p.relationLabels[rl.kind] || t[rl.kind] || rl.kind);
    const probes = !ctx.show('all') ? [] : labelsText.map((tx0, i) => chip(ctx, tx0, {x: 0, y: 0, anchor: 'middle', maxWidth: o.tight ? 170 : 240, size: S0.capSize, minSize: o.tight ? S0.capSize : undefined, maxLines: o.tight ? 3 : 2, fill: th.card, stroke: kindColor(ctx, rels[i].kind), name: `rl${i}-chip`, weight: 600}));
    const capSizes = probes.map(pr => ({w: pr.box.w, h: pr.box.h}));
    const variantOf = (G, extra = []) => ({curves: curvesFor(G), texts: [...IDS.flatMap(id => G.parts[id].texts.map(shapeBox)), issue && issue.box, ...extra].filter(Boolean), obstacles: [...IDS.flatMap(id => G.parts[id].capBodies.map(shapeBox)), issue && issue.box, ...extra].filter(Boolean)});
    const placeAll = (Gs, extra = [], weights = null, bnd = bounds) => {
      const vs = Gs.map((G, vi) => ({...variantOf(G, extra), weight: weights ? weights[vi] : 1}));
      const res = placeCaptions(capSizes, vs, bnd);
      const out = res.map((pl, i) => ({...pl, box: capPos(vs[0].curves[i], pl, capSizes[i]).box}));
      out.bad = res.bad || 0;
      return out;
    };

    // camera for the gathered hold: fit the gathered parts — and a free slot for the status tag right
    // beside the track that shows the state (never on it) — into the room below the issue caption
    {
      const G1 = geomAt(L, {e: 1, g: 1, kk: kk1});
      const bodies1 = IDS.flatMap(id => G1.parts[id].bodies.map(shapeBox));
      const ge = unionBox(bodies1);
      // (above the footnote the room runs down to it: the footnote keeps its own gap)
      const room = {x: margin + 10, y: topRoom + 36, w: D.w - 2 * margin - 20, h: (foot ? Hb - 8 : D.h - margin - 10) - topRoom - 36};
      const fitZ = U => clamp(Math.min(room.w / U.w, room.h / U.h), 0.8, 1.35);
      let slot = null;
      if (tagVariants.length) {
        const curves1 = curvesFor(G1);
        const lines1 = curves1.map(cv => polyOf(cv));
        // where the captions sit at the hold without a tag: the tag leaves those spots to the captions
        let capSpots = [];
        if (probes.length) {
          const z0 = clamp(Math.min(room.w / ge.w, room.h / ge.h), 1, 1.35);
          const c0 = {z: z0, tx: room.x + room.w / 2 - z0 * (ge.x + ge.w / 2), ty: room.y + room.h / 2 - z0 * (ge.y + ge.h / 2)};
          const G0 = geomAt({...L, cam: c0}, {e: 1, g: 1, kk: kk1});
          capSpots = placeAll([G0], [], null, boundsG).map(({box: b}) => ({x: (b.x - c0.tx) / z0, y: (b.y - c0.ty) / z0, w: b.w / z0, h: b.h / z0}));
        }
        const gap = 18;
        // beside the track piece itself (preferred), else beside its plaque, else beside the whole named part
        const nb = G1.parts[named].bodies.map(shapeBox);
        const anchors = [{box: G1.parts[named].piece, bonus: 0.06}, {box: nb[1], bonus: 0.03}, {box: unionBox(nb), bonus: 0}];
        const at = (tg, side, al, w, hh) => {
          const xs = {start: tg.x, mid: tg.x + tg.w / 2 - w / 2, end: tg.x + tg.w - w};
          const ys = {start: tg.y, mid: tg.y + tg.h / 2 - hh / 2, end: tg.y + tg.h - hh};
          if (side === 'above') return {x: xs[al], y: tg.y - gap - hh, w, h: hh};
          if (side === 'below') return {x: xs[al], y: tg.y + tg.h + gap, w, h: hh};
          if (side === 'right') return {x: tg.x + tg.w + gap, y: ys[al], w, h: hh};
          return {x: tg.x - gap - w, y: ys[al], w, h: hh};
        };
        const sides = S0.axis === 'h' ? ['above', 'right', 'below', 'left'] : ['right', 'left', 'below', 'above'];
        let best = null;
        let rank = 0;
        tagVariants.forEach((tv, vi) => {
          for (const an of anchors) {
            for (const side of sides) {
              for (const al of ['end', 'mid', 'start']) {
                // the tag keeps its design size while the camera scales the board: size the slot for its zoom
                let z = 1, b = null;
                for (let it = 0; it < 3; it++) {
                  b = at(an.box, side, al, tv.box.w / z, tv.box.h / z);
                  z = fitZ(unionBox([ge, b]));
                }
                const clear = !bodies1.some(q => hit(b, q, 10)) && !lines1.some(pts => polyHitsBox(pts, b, 6));
                const score = z + an.bonus + (vi === 0 ? 0.02 : 0) + (capSpots.some(q => hit(b, q, 8)) ? -0.5 : 0) - rank * 1e-5;
                if (clear && (!best || score > best.score)) best = {b, z, score, vi};
                rank++;
              }
            }
          }
        });
        if (best) {
          slot = best.b;
          L.tagVariant = tagVariants[best.vi];
        }
      }
      const U = slot ? unionBox([ge, slot]) : ge;
      const z = slot ? fitZ(U) : clamp(Math.min(room.w / ge.w, room.h / ge.h), 1, 1.35);
      L.cam = {z, tx: room.x + room.w / 2 - z * (U.x + U.w / 2), ty: room.y + room.h / 2 - z * (U.y + U.h / 2)};
      L.tagSlot = slot && {x: z * slot.x + L.cam.tx, y: z * slot.y + L.cam.ty, w: z * slot.w, h: z * slot.h};
    }

    // --- links and their captions (placed for the exploded and the gathered state)
    const GE = geomAt(L, {e: 1, g: 0, kk: kk1});
    const GG = geomAt(L, {e: 1, g: 1, kk: kk1});
    const cE = curvesFor(GE), cG = curvesFor(GG);
    const caps = [];
    if (probes.length) {
      // exploded placement must also hold with the focus part lifted (the tracer beat)
      const GF = geomAt(L, {e: 1, g: 0, kk: id => (id === p.focusElement ? S0.focus : 1)});
      const pE = placeAll([GE, GF], [], [1, 0.05]);
      const pG = placeAll([GG], [L.tagSlot], null, boundsG);
      L.capBad = (pE.bad || 0) + (pG.bad || 0);
      probes.forEach((pr, i) => {
        // chip built around (0,0); the frame moves it to its curve point (+ offset)
        const c0 = {x: pr.box.x + pr.box.w / 2, y: pr.box.y + pr.box.h / 2};
        caps.push({
          // leaders are drawn under every caption (a leader never crosses another caption's text)
          lead: h('line', {name: `rl${i}-lead`, stroke: kindColor(ctx, rels[i].kind), 'stroke-width': 2, 'stroke-dasharray': '3 5', opacity: 0}),
          node: g({name: `rl${i}-cap`, opacity: 0},
            g({name: `rl${i}-lab`}, g({transform: T(-c0.x, -c0.y)}, pr.node))),
          E: pE[i], G: pG[i], size: {w: pr.box.w, h: pr.box.h}, fs: pr.fit.size,
        });
      });
    }

    // --- tracer route through the supplied traversal order (timed on the exploded geometry)
    const order = p.traversalOrder.filter((id, i, a) => i === 0 || id !== a[i - 1]);
    const segs = [];
    for (let i = 1; i < order.length; i++) {
      const prev = order[i - 1], cur = order[i];
      const li = rels.findIndex(rl => (rl.from === prev && rl.to === cur) || (rl.from === cur && rl.to === prev));
      if (li >= 0) {
        const fwd = rels[li].from === prev;
        segs.push({type: 'hop', a: {dock: prev}, b: {end: li, at: fwd ? 'A' : 'B'}});
        segs.push({type: 'link', i: li, fwd});
        segs.push({type: 'hop', a: {end: li, at: fwd ? 'B' : 'A'}, b: {dock: cur}, arrive: cur});
      } else {
        segs.push({type: 'hop', a: {dock: prev}, b: {dock: cur}, arrive: cur});
      }
    }
    const endsE = linkEnds(L, GE);
    const refPt = (ref, G, ends) => (ref.dock ? G.parts[ref.dock].dock : ends[ref.end][ref.at]);
    const segLen = (sg, G, ends, curves) => (sg.type === 'link' ? curves[sg.i].total : Math.hypot(refPt(sg.b, G, ends).x - refPt(sg.a, G, ends).x, refPt(sg.b, G, ends).y - refPt(sg.a, G, ends).y));
    const lens = segs.map(sg => Math.max(1e-3, segLen(sg, GE, endsE, cE)));
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const cum = [0];
    lens.forEach(v => cum.push(cum[cum.length - 1] + v / total));
    const visits = [{id: order[0], t: 0}];
    segs.forEach((sg, i) => { if (sg.arrive) visits.push({id: sg.arrive, t: cum[i + 1]}); });

    // --- status tag, placed for the gathered hold near the part that shows the state
    let tag = null;
    if (tagVariants.length) {
      const tv = L.tagVariant || tagVariants[0];
      const probe = tv;
      const tg = GG.parts[named].piece;
      const capBoxes = caps.map((c, i) => {
        return capPos(cG[i], c.G, c.size).box;
      });
      // every part (the named track piece included: bed, sleepers, buffer stop), every caption and link
      const obs = [...IDS.flatMap(id => GG.parts[id].bodies.map(shapeBox)), ...capBoxes];
      const linesG = cG.map(cv => polyOf(cv));
      const sz = {w: probe.box.w, h: probe.box.h};
      const clean = b => !obs.some(q => hit(b, q, 6)) && !linesG.some(pts => polyHitsBox(pts, b, 6));
      let at = null;
      if (L.tagSlot) {
        const c = {x: L.tagSlot.x + L.tagSlot.w / 2, y: L.tagSlot.y + L.tagSlot.h / 2};
        if (clean({x: c.x - sz.w / 2, y: c.y - sz.h / 2, w: sz.w, h: sz.h})) at = {x: c.x, y: c.y - sz.h / 2};
      }
      if (!at) {
        // fallback: the nearest clean spot beside the piece, inside the gathered mount board
        const ub = unionBox(IDS.flatMap(id => GG.parts[id].bodies.map(shapeBox)));
        const tb = {x: Math.max(boundsG.x, ub.x - 20), y: Math.max(topRoom - 8, ub.y - 20), w: 0, h: 0};
        tb.w = Math.min(boundsG.x + boundsG.w, ub.x + ub.w + 20) - tb.x;
        tb.h = Math.min(boundsG.y + boundsG.h, ub.y + ub.h + 20) - tb.y;
        const res = placeChip(sz, {x: tg.x + tg.w / 2, y: tg.y + tg.h / 2, r: tg.h / 2}, {obstacles: obs, bounds: tb, noLeader: true, order: ['above', 'aboveL', 'aboveR', 'right', 'below', 'belowL', 'belowR', 'left', 'rightHigh', 'leftHigh', 'rightLow', 'leftLow'], gaps: [12, 30, 60, 100, 150, 210, 280, 360]})
          || placeChip(sz, {x: tg.x + tg.w / 2, y: tg.y + tg.h / 2, r: tg.h / 2}, {obstacles: obs, bounds: tb, noLeader: true, leastBad: true});
        at = res ? {x: res.x, y: res.y} : {x: tg.x + tg.w / 2, y: tg.y - sz.h - 12};
      }
      tag = statusTag(ctx, tagText, {x: at.x, y: at.y, anchor: 'middle', size: S0.chip, maxWidth: tv.maxWidth, maxLines: tv.maxLines, name: 'state-tag', color: P.route === 'main' ? palette(ctx).rule : P.route === 'branch' ? palette(ctx).excInk : th.inkSoft, opacity: 0});
      tag.capBoxes = capBoxes;
    }
    // focus: a text-free shadow under the lifted part (its ports' outline)
    const focusPart = P.parts[p.focusElement];
    const fb = unionBox(focusPart.ports.map(shapeBox));
    const focusShadow = h('path', {d: roundRectPath(fb.x, fb.y, fb.w, fb.h, focusPart.ports[0].r !== undefined ? fb.w / 2 : 20), fill: '#000000'});
    // how much the content text must still grow to reach its floor at the exploded scale (1 = enough)
    // (at the exploded scale and at the gathered hold, whichever is smaller)
    const primaryPx = () => Math.min(Infinity, ...P.content.filter(c => c.primary).map(c => c.size * L.k * Math.min(1, L.cam.z) * std));
    const captionPx = () => Math.max(S0.capSize, ctx.show('key') ? labelTarget : 0) * std;
    const contentNeed = () => Math.max(1, ...P.content.map(c => (c.primary ? 17 : 12.5) / (c.size * L.k * Math.min(1, L.cam.z) * std)));
    return Object.assign(L, {opts: {...o}, foot, Hb, labelTarget, contentNeed, primaryPx, captionPx, cs, pw: o.pw ?? 1, kW, kH, gs, cap, shapeKey, links, bends, caps, segs, lens, cum, total, visits, order, tag, topRoom, focusShadow, bounds, std, lk});
  },
  build(ctx, L) {
    const focus = ctx.params.focusElement;
    // the turnout module first, so its baseboard never covers a neighbouring part; the focus part
    // is drawn last (it lifts above its neighbours), its shadow right under it
    const order = ['connector', 'rule', 'exception', 'fact', 'condition', 'lens'].filter(id => id !== focus);
    const pal = palette(ctx);
    return g(null,
      L.issue && L.issue.node,
      // gather: one common baseboard slides in under the parts (the mechanism is mounted together again)
      g({name: 'mount', opacity: 0},
        h('path', {name: 'mount-shadow', d: 'M0 0', fill: ctx.theme.shadow}),
        h('path', {name: 'mount-board', d: 'M0 0', fill: shade(pal.board, 0.3), stroke: pal.boardEdge, 'stroke-width': 3}),
        h('path', {name: 'mount-bevel', d: 'M0 0', fill: 'none', stroke: shade(pal.board, 0.55), 'stroke-width': 2})),
      g({name: 'board'},
        order.map(id => g({name: `el-${id}`}, L.P.parts[id].node)),
        g({name: 'focus-shadow', opacity: 0}, L.focusShadow),
        g({name: `el-${focus}`}, L.P.parts[focus].node)),
      L.links.map(lk => lk.node),
      tracerToken(ctx, 'tracer'),
      L.caps.map(c => c.lead),
      L.caps.map(c => c.node),
      L.tag && L.tag.node,
      L.foot && L.foot.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const S0 = L.S0;
    const nodes = {};
    const e = ease.inOutCubic(seg(u, ...W.explode));
    const gth = ease.inOutCubic(seg(u, ...W.gather));

    // --- tracer timing and the focus lift
    const tp = seg(u, ...W.trace);
    const tracing = u >= W.trace[0] && u < W.trace[1];
    const te = ease.inOutSine(tp);
    const visitT = id => {
      const v = L.visits.find(x => x.id === id);
      return v ? v.t : null;
    };
    const fvt = visitT(p.focusElement);
    const near = fvt === null || !tracing ? 0 : clamp(1 - Math.abs(te - fvt) / 0.11);
    const lift = ease.inOutSine(near);
    const focusK = 1 + (S0.focus - 1) * lift;
    const kk = id => (id === p.focusElement ? focusK : 1);

    // --- current geometry
    const G = geomAt(L, {e, g: gth, kk});
    nodes.board = {transform: `translate(${r(G.T0.x)} ${r(G.T0.y)}) scale(${r(G.S, 5)})`};
    for (const id of IDS) {
      const part = L.P.parts[id];
      const {q} = G.parts[id];
      const c = part.center;
      const k0 = kk(id);
      nodes[`el-${id}`] = {transform: k0 !== 1 ? `${T(q.x, q.y)} translate(${r(c.x)} ${r(c.y)}) scale(${r(k0, 4)}) translate(${r(-c.x)} ${r(-c.y)})` : T(q.x, q.y)};
    }
    {
      const {q} = G.parts[p.focusElement];
      const c = L.P.parts[p.focusElement].center;
      const off = (6 + 12 * lift) / L.k;
      nodes['focus-shadow'] = {opacity: r(0.22 * lift, 3), transform: `${T(q.x + off, q.y + off * 1.3)} translate(${r(c.x)} ${r(c.y)}) scale(${r(focusK, 4)}) translate(${r(-c.x)} ${r(-c.y)})`};
    }
    // the common baseboard: it grows in under the gathering parts (text-free)
    let mountBox = null;
    {
      const ub0 = unionBox(IDS.flatMap(id => G.parts[id].bodies.map(shapeBox)));
      // the board also carries the status tag's slot beside the named track (reached as the parts gather)
      const ub1 = L.tag ? unionBox([ub0, L.tag.box]) : ub0;
      const ub = {x: lerp(ub0.x, ub1.x, gth), y: lerp(ub0.y, ub1.y, gth), w: lerp(ub0.w, ub1.w, gth), h: lerp(ub0.h, ub1.h, gth)};
      const pad = 28 + 40 * (1 - gth);
      const bx = {x: ub.x - pad, y: ub.y - pad, w: ub.w + pad * 2, h: ub.h + pad * 2};
      const B2 = {x: Math.max(6, bx.x), y: Math.max(L.topRoom - 14, bx.y), w: 0, h: 0};
      B2.w = Math.min(ctx.design.w - 6, bx.x + bx.w) - B2.x;
      // (the baseboard may run on under the footnote, which is drawn over it)
      B2.h = Math.min(ctx.design.h - 6, bx.y + bx.h) - B2.y;
      nodes.mount = {opacity: r(gth, 3)};
      nodes['mount-shadow'] = {d: roundRectPath(B2.x + 6, B2.y + 9, B2.w, B2.h, 28)};
      nodes['mount-board'] = {d: roundRectPath(B2.x, B2.y, B2.w, B2.h, 28)};
      nodes['mount-bevel'] = {d: roundRectPath(B2.x + 12, B2.y + 12, B2.w - 24, B2.h - 24, 20)};
      mountBox = B2;
    }
    // component headings / plaques appear as the parts separate
    const lab = seg(u, ...W.labels);
    for (const nm of ['pl-con', 'pl-rule', 'pl-exception']) nodes[nm] = {opacity: r(lab, 3)};
    if (ctx.show('key')) for (const nm of ['lens-label', 'conn-label']) nodes[nm] = {opacity: r(lab, 3)};

    // --- relationships: drawn one after another in the supplied order, always landing on the parts' edges
    const nR = L.rels.length;
    const each = (W.relate[1] - W.relate[0]) / Math.max(1, nR);
    const drawn = L.rels.map((_, i) => ease.inOutSine(seg(u, W.relate[0] + i * each, W.relate[0] + (i + 0.85) * each)));
    const ends = linkEnds(L, G);
    const curves = ends.map((e2, i) => L.links[i].curve(e2.A, e2.B, L.bends[i]));
    curves.forEach((cv, i) => Object.assign(nodes, L.links[i].frame(cv, drawn[i])));
    const capNow = [];
    const capState = [];
    L.caps.forEach((c, i) => {
      // exploded placement until the parts gather; a caption whose gathered spot differs fades out
      // and back in at its new spot (it never slides across props or other links)
      const same = c.E.t === c.G.t && c.E.sg === c.G.sg && Math.abs(c.E.dd - c.G.dd) < 1;
      const pl = same || gth < 0.5 ? c.E : c.G;
      const swap = same ? 1 : clamp((Math.abs(gth - 0.5) - 0.05) / 0.3);
      const {m, c: cc, box} = capPos(curves[i], pl, c.size);
      // captions of the links on the lifted focus part fade out while it lifts (its links move with it)
      const onFocus = L.rels[i].from === p.focusElement || L.rels[i].to === p.focusElement;
      const lp = clamp((drawn[i] - 0.55) / 0.45) * swap * (onFocus ? clamp(1 - lift * 2) : 1);
      nodes[`rl${i}-cap`] = {opacity: r(lp, 3)};
      nodes[`rl${i}-lab`] = {transform: T(cc.x, cc.y)};
      if (lp > 0) capNow.push(box);
      const lead = pl.dd > 20;
      nodes[`rl${i}-lead`] = {x1: r(m.x), y1: r(m.y), x2: r(cc.x), y2: r(cc.y), opacity: lead ? r(lp, 3) : 0};
      capState.push({i, box, op: lp, lead: lead ? {a: m, b: cc} : null});
    });

    // --- tracer: evaluated on the CURRENT geometry (it stays on the links while the focus part grows)
    const refPt = ref => (ref.dock ? G.parts[ref.dock].dock : ends[ref.end][ref.at]);
    let tpt;
    if (!L.segs.length) tpt = G.parts[L.order[0]].dock;
    else {
      let si = L.segs.length - 1;
      for (let i = 0; i < L.segs.length; i++) if (te <= L.cum[i + 1]) { si = i; break; }
      const f = clamp((te - L.cum[si]) / Math.max(1e-9, L.cum[si + 1] - L.cum[si]));
      const sg = L.segs[si];
      if (sg.type === 'link') tpt = curves[sg.i].at(sg.fwd ? f : 1 - f);
      else {
        const a = refPt(sg.a), b = refPt(sg.b);
        tpt = {x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f)};
      }
    }
    const vis = tracing ? Math.min(1, seg(u, W.trace[0], W.trace[0] + 0.015), 1 - seg(u, W.trace[1] - 0.012, W.trace[1])) : 0;
    // the token fades while it passes under a caption, so its halo never peeks out around the text
    // (and while it crosses a card, plaque or label away from the docks it stops on)
    const outside = boxes => boxes.reduce((mn, b) => Math.min(mn, Math.max(b.x - tpt.x, tpt.x - (b.x + b.w), b.y - tpt.y, tpt.y - (b.y + b.h))), Infinity);
    const dockDist = Math.min(...IDS.map(id => Math.hypot(G.parts[id].dock.x - tpt.x, G.parts[id].dock.y - tpt.y)));
    const textOcc = Math.max(clamp((outside(IDS.flatMap(id => G.parts[id].texts)) - 4) / 26), clamp(1 - (dockDist - 30) / 30));
    const occl = Math.min(clamp((outside(capNow) - 4) / 26), textOcc);
    nodes.tracer = {transform: T(tpt.x, tpt.y), opacity: r(vis * occl, 3)};
    // state change of a part: ramps when the tracer reaches it; parts absent from the traversal
    // change at the start of the gather beat
    const stateP = id => {
      const vt = visitT(id);
      if (vt === null) return seg(u, BEATS.gather[0], BEATS.gather[0] + 0.05);
      return u >= W.trace[1] ? 1 : tracing ? clamp((te - vt) / 0.07 + 0.001) * (te >= vt ? 1 : 0) : 0;
    };
    const visited = L.visits.filter(v => u >= W.trace[1] || (tracing && te >= v.t - 1e-6)).map(v => v.id);

    // --- states as the tracer reaches each part (supplied route state only)
    const route = L.P.route;
    const marker = L.P.marker;
    const glass = stateP('lens');
    const lensPart = L.P.parts.lens;
    Object.assign(nodes, lensPart.mag.frame({x: 0, y: 0}, lensPart.magAngle, 2.2, glass));
    const sock = marker === 'present' || marker === 'disputed' ? stateP('condition') : 0;
    nodes['sock-fill'] = {opacity: r(sock, 3)};
    const blade = route === 'branch' ? ease.inOutCubic(stateP('connector')) : 0;
    const gate = route === 'branch' ? ease.inOutCubic(stateP('exception')) : 0;
    const litB = route === 'branch' ? stateP('exception') : 0;
    const litM = route === 'main' ? stateP('rule') : 0;
    Object.assign(nodes, L.P.parts.connector.jp.pose({blade, gate: 0, lever: blade, litMain: route === 'main' ? stateP('connector') : 0, litBranch: blade}));
    Object.assign(nodes, L.P.parts.rule.track.pose({lit: litM}));
    Object.assign(nodes, L.P.parts.exception.track.pose({lit: litB, gate}));
    if (L.issue) nodes.issue = {opacity: r(seg(u, 0, 0.06), 3)};
    if (L.foot) nodes.foot = {opacity: r(seg(u, ...W.tag), 3)};
    if (L.tag) nodes['state-tag'] = {opacity: r(seg(u, ...W.tag), 3)};

    // --- semantics
    const onEdgeOf = (pt0, shapes) => Math.min(...shapes.map(sh => edgeDistance(pt0, sh))) < 1.5;
    const linkEndsOk = L.rels.map((rl, i) => onEdgeOf(ends[i].A, G.parts[rl.from].ports) && onEdgeOf(ends[i].B, G.parts[rl.to].ports));
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const centres = IDS.map(id => G.parts[id].dock);
    const spread = Math.max(...centres.map(a => Math.max(...centres.map(b => Math.hypot(a.x - b.x, a.y - b.y)))));
    // --- captions, leaders and labels vs links and props (current geometry, visible items only)
    const VIS = 0.25;
    const shownCaps = capState.filter(c => c.op > VIS);
    const polysNow = curves.map((cv, j) => (drawn[j] > 0.02 ? polyOf(cv, drawn[j]) : null));
    const capOnOtherLink = shownCaps.flatMap(c => polysNow.map((pts, j) => (j !== c.i && pts && polyHitsBox(pts, c.box, 0) ? [c.i, j] : null)).filter(Boolean));
    const leaderBehindCaption = shownCaps.filter(c => c.lead).flatMap(c => shownCaps.filter(o => o.i !== c.i && segHitsBox(c.lead.a, c.lead.b, o.box, 0)).map(o => [c.i, o.i]));
    const labOp = ctx.show('key') ? seg(u, ...W.labels) : 0;
    const labels = [
      ...shownCaps.map(c => ({name: `caption${c.i}`, box: c.box})),
      ...(labOp > VIS ? ['lens', 'connector'].filter(id => G.parts[id].label).map(id => ({name: `${id}-label`, box: G.parts[id].label})) : []),
      ...(L.tag && seg(u, ...W.tag) > VIS ? [{name: 'state-tag', box: L.tag.box}] : []),
    ];
    const lensG = G.parts.lens, lensP = L.P.parts.lens.props;
    const glassC = lensG.pt({x: 0, y: 0});
    const hA = lensG.pt(lensP.handle.a), hB = lensG.pt(lensP.handle.b);
    const lever = (() => {
      const b0 = L.P.parts.connector.props.box;
      const o = G.parts.connector.pt({x: b0.x, y: b0.y});
      return {x: o.x, y: o.y, w: b0.w * G.parts.connector.sc, h: b0.h * G.parts.connector.sc};
    })();
    const circleHits = (c0, rr, b) => Math.hypot(c0.x - clamp(c0.x, b.x, b.x + b.w), c0.y - clamp(c0.y, b.y, b.y + b.h)) < rr;
    const labelOnProp = labels.flatMap(lb => {
      const out = [];
      if (circleHits(glassC, lensP.circle.r * lensG.sc, lb.box)) out.push([lb.name, 'magnifier glass']);
      if (Array.from({length: 13}, (_, q) => ({x: lerp(hA.x, hB.x, q / 12), y: lerp(hA.y, hB.y, q / 12)})).some(c0 => circleHits(c0, lensP.handle.r * lensG.sc, lb.box))) out.push([lb.name, 'magnifier handle']);
      if (hit(lb.box, lever)) out.push([lb.name, 'switch lever']);
      return out;
    });
    // key caption sizes in px of the standard 1080p frame of this shape
    const px = [
      ...shownCaps.map(c => ({name: `caption${c.i}`, px: L.caps[c.i].fs * L.std})),
      ...(labOp > VIS ? ['lens', 'connector'].filter(id => L.P.parts[id].labelFit).map(id => ({name: `${id}-label`, px: L.P.parts[id].labelFit.size * G.parts[id].sc * L.std})) : []),
      ...(L.tag && seg(u, ...W.tag) > VIS ? [{name: 'state-tag', px: L.tag.fs * L.std}] : []),
      ...(L.issue && seg(u, 0, 0.06) > VIS ? [{name: 'issue', px: L.issue.fit.size * L.std}] : []),
    ];
    const keyPx = px.length ? r(Math.min(...px.map(q => q.px)), 1) : null;
    const capPx = px.filter(q => q.name.startsWith('caption'));
    // content text (fact card, condition and rule plaques) at its current on-screen scale
    const cPx = labOp > VIS ? L.P.content.map(c => ({name: c.name, primary: c.primary, px: c.size * G.parts[c.part].sc * L.std})) : [];
    const content = !cPx.length ? null : {
      primaryPx: r(Math.min(...cPx.filter(c => c.primary).map(c => c.px)), 1),
      secondaryPx: cPx.some(c => !c.primary) ? r(Math.min(...cPx.filter(c => !c.primary).map(c => c.px)), 1) : null,
      maxCaptionPx: capPx.length ? r(Math.max(...capPx.map(q => q.px)), 1) : null,
      // largest generic caption or element label (the lifted focus part's own label excepted: it is
      // enlarged with its part only while the tracer is on it)
      maxGenericPx: r(Math.max(0, ...px.filter(q => q.name.startsWith('caption') || (q.name.endsWith('-label') && !(lift > 0 && q.name === `${p.focusElement}-label`))).map(q => q.px)), 1),
      items: cPx.map(c => [c.name, r(c.px, 1)]),
    };

    // status tag: never on a track piece (bed, sleepers, buffer stop) or any other part/caption; inside the board
    const tb0 = L.tag && L.tag.box;
    const tagSem = !tb0 ? {shown: false} : {
      shown: seg(u, ...W.tag) > 0,
      offPieces: IDS.every(id => !G.parts[id].piece || !hit(tb0, shapeBox(G.parts[id].piece))),
      offParts: IDS.every(id => G.parts[id].bodies.every(b => !hit(tb0, shapeBox(b)))),
      offCaptions: L.tag.capBoxes.every(b => !hit(tb0, b)),
      inBoard: inBox(tb0, mountBox, 8),
      // gaps to the named track piece and to the whole named part (track, gate, plaque)
      gapToPiece: r(boxGap(tb0, shapeBox(G.parts[L.P.route === 'main' ? 'rule' : 'exception'].piece)), 1),
      gapToPart: r(Math.min(...G.parts[L.P.route === 'main' ? 'rule' : 'exception'].bodies.map(b => boxGap(tb0, shapeBox(b)))), 1),
    };
    return {
      nodes,
      semantic: {
        beat,
        explode: r(e, 3),
        gather: r(gth, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        linkKinds: L.rels.map(rl => rl.kind),
        arrowheads: L.rels.map(rl => rl.kind !== 'relation' && rl.kind !== 'disputed'),
        linkEnds: linkEndsOk,
        linkLengths: ends.map(e2 => r(Math.hypot(e2.B.x - e2.A.x, e2.B.y - e2.A.y), 1)),
        tracerVisible: vis > 0,
        tracerOpacity: r(vis * occl, 3),
        tracer: {x: r(tpt.x), y: r(tpt.y)},
        visitOrder: L.visits.map(v => v.id),
        visited,
        focus: p.focusElement,
        focusScale: r(focusK, 3),
        focusU: fvt === null ? null : r(W.trace[0] + (W.trace[1] - W.trace[0]) * (Math.acos(1 - 2 * fvt) / Math.PI), 4),
        glass: r(glass, 3),
        socketLit: r(sock, 3),
        blade: r(blade, 3),
        gate: r(gate, 3),
        litBranch: r(litB, 3),
        litMain: r(litM, 3),
        route,
        marker,
        causalCount: L.rels.filter(rl => rl.kind === 'causal').length,
        separated: minGap(L, e),
        spread: r(spread, 1),
        gatherPull: Object.fromEntries(Object.entries(L.pull).map(([id, v]) => [id, r(v, 2)])),
        tag: tagSem,
        captions: {shown: shownCaps.length, onOtherLink: capOnOtherLink, leaderBehindCaption, labelOnProp},
        keyPx1080: keyPx,
        contentPx1080: content,
        keyPxItems: px.map(q => [q.name, r(q.px, 1)]),
        layoutScale: r(L.k, 3),
        layoutFit: {composition: L.shapeKey, gapScale: L.gs, labelScale: r(L.lk, 2), contentScale: r(L.cs, 2), captionCap: L.cap, captionsWithoutFreeSpot: L.capBad, touchingParts: L.touching},
        camera: r(G.z, 3),
      },
    };
  },
};

/** Smallest gap between the parts' anchor boxes at explode progress e (negative = overlapping). */
function minGap(L, e) {
  let best = Infinity;
  const boxes = IDS.map(id => {
    const a = L.P.parts[id].anchor;
    const q = {x: lerp(L.asm[id].x, L.pos[id].x, e), y: lerp(L.asm[id].y, L.pos[id].y, e)};
    return {x: a.x + q.x, y: a.y + q.y, w: a.w, h: a.h};
  });
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i], B = boxes[j];
      const gx = Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w));
      const gy = Math.max(B.y - (A.y + A.h), A.y - (B.y + B.h));
      best = Math.min(best, Math.max(gx, gy));
    }
  }
  return r(best, 1);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-04-mechanism',
    title: 'Rule and exception — exploded junction with supplied links',
    titleEs: 'Regla y excepción — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Regla y excepción',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view of a railway junction: the fact wagon, magnifier, condition socket, switch (connector), main track (general rule) and gated siding (exception) slide apart; only the supplied relationships are drawn, landing on the parts’ real edges, with their kind (relation without arrowhead, sequence with one, causal only if supplied); a signal token follows the supplied order, lifting the focus part and changing each part’s state as it passes; the parts then gather back with their links attached and the supplied route state stays visible.',
    tags: ['reasoning', 'rule', 'exception', 'mechanism', 'exploded view', 'switch', 'branch', 'relations', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/regla-y-excepcion.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
