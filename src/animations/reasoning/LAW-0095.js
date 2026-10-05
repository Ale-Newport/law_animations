/**
 * LAW-0095 — Regla y excepción · contrast
 *
 * Storyboard (two complete junction boards, identical except ONE fact):
 *  0.00–0.17 base      Two identical boards (A and B): main track, gated siding
 *                      with its diamond socket, a stand magnifier parked at the
 *                      stop line and the same fact card on a wagon. Both cards
 *                      have an empty marker slot and an empty reserved row.
 *  0.17–0.40 change    Rings mark the marker slot on both cards. In B only, a
 *                      diamond stamp comes in, presses the slot and leaves: the
 *                      card now carries the condition marker and the changed
 *                      fact is written in its reserved row. A stays unchanged.
 *  0.40–0.77 parallel  Both magnifiers swing over the slot at the same time.
 *                      In B the socket fills with the same diamond, a pulse runs
 *                      along the wire to the switch, the blade throws and the
 *                      gate swings open; in A nothing is switched and the main
 *                      route lights. Both wagons then leave together — A along
 *                      the main route, B onto the separate branch (the routes
 *                      are the ones SUPPLIED for each scenario).
 *  0.77–1.00 guide     A guide joins the marker slot of A's card to B's card with
 *                      the changed-fact label; a neutral note says no outcome is
 *                      stated. No winner, score or legal consequence.
 *  Wide boxes: boards side by side; tall and square boxes: stacked.
 * Legal content: fictional house rules, jurisdiction unspecified,
 * illustrative-unverified.
 * @module animations/reasoning/LAW-0095
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {contrastFields, oneOf} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {stampTool, shade} from '../../primitives/paper.js';
import {placeChip} from '../causation/kits/place.js';
import {
  reglaFields, REGLA_STRINGS, ROUTE_STATES, routeOf, markerOf, palette,
  junctionGeom, junctionParts, cartAt, factCard, wagon, plaque, emblem, standMagnifier, cardBox, scenarioHead,
} from './kits/regla-y-excepcion.js';

const ID = 'LAW-0095';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0.0, 0.06], strip: [0.04, 0.12],
  ring: [0.18, 0.23], stampIn: [0.21, 0.27], press: [0.27, 0.3], stampOut: [0.3, 0.37], feat: [0.3, 0.36],
  lensIn: [0.4, 0.47], glass: [0.45, 0.49], lensOut: [0.53, 0.58],
  socket: [0.48, 0.515], pulse: [0.5, 0.545], blade: [0.53, 0.585], lit: [0.53, 0.6],
  depart: [0.6, 0.76],
  guide: [0.78, 0.88], guideLabel: [0.84, 0.9], note: [0.87, 0.94],
};

const sceneSchema = {
  ...reglaFields,
  ...contrastFields(),
  routeA: oneOf('Route state supplied for scenario A (never computed)', ROUTE_STATES),
  routeB: oneOf('Route state supplied for scenario B (never computed)', ROUTE_STATES),
};

const defaultParams = {
  facts: ['Parcel 7 arrives Monday, 9:40'],
  rules: {
    general: 'Parcels are left at the front desk',
    exception: 'Signed-for parcels go to the post room',
    condition: 'The parcel needs a signature',
  },
  issues: ['Does the exception’s condition appear in the facts?'],
  assumptions: ['Fictional house rules, as supplied'],
  scenarioA: {label: 'General case', caption: 'The parcel carries no signature marker'},
  scenarioB: {label: 'Exceptional case', caption: 'The same parcel is marked as needing a signature'},
  changedFact: 'Needs a signature',
  sharedFacts: ['Same parcel, same arrival time', 'Same house rules'],
  comparisonLabels: {guide: 'Changed fact', neutral: 'Two supposed situations side by side — no outcome is stated'},
  routeA: 'main-as-supplied',
  routeB: 'branch-as-supplied',
};

const STRINGS = {
  en: {...REGLA_STRINGS.en, sameRules: 'Same in A and B'},
  es: {...REGLA_STRINGS.es, sameRules: 'Igual en A y B'},
};

const SHAPES = {
  landscape: {arr: 'row', header: 100, gap: 64, size: 27, cardW: 280, gauge: 42, R: 46, strip: 26, headSize: 34},
  // square boxes are ~1.3:1 once the caption band is reserved: boards stacked on the left, shared strip in a side column
  square: {arr: 'column', side: 0.3, header: 100, gap: 16, size: 24, cardW: 240, gauge: 36, R: 40, strip: 24, headSize: 28},
  portrait: {arr: 'column', header: 112, gap: 22, size: 26, cardW: 270, gauge: 40, R: 44, strip: 25, headSize: 30},
};

/**
 * One complete junction board (panel-local coordinates, origin top-left).
 * Both panels are built by the same function; only `changed` differs.
 */
function panelScene(ctx, o) {
  const th = ctx.theme;
  const pal = palette(ctx);
  const p = ctx.params;
  const P = o.prefix;
  const S0 = o.S0;
  const {PW, PH} = o;
  const gw = S0.gauge;
  // B's stamp prints the marker matching B's SUPPLIED state (present / disputed / pending)
  const mk = o.changed ? (markerOf(o.state) === 'absent' ? 'present' : markerOf(o.state)) : null;
  const card = factCard(ctx, {prefix: `${P}-card`, w: S0.cardW, facts: [p.facts[0]], heading: ctx.t.fact, marker: mk, size: S0.size, maxLines: 4,
    feature: {text: o.changed ? p.changedFact : null, reserveFor: p.changedFact, name: `${P}-feat`, placeholder: true, dotOpacity: 0, textOpacity: 0, maxLines: 3}});
  const wagonAlong = card.w + 36;
  const top = -card.ext.y, bot = card.ext.y + card.ext.h;
  // row arrangement: a free lane along the top of every board carries the comparison guide
  const lane = o.lane || 0;
  const Yb = 12 + lane + top;
  const Ym = PH - 12 - bot;
  const off = Ym - Yb;
  const cpD = 14 + wagonAlong / 2;
  const sD = cpD + wagonAlong / 2 + 54;
  const len = PW - 16;
  const endGap = wagonAlong / 2 + 22;
  // the curve shrinks until the parked branch card clears the gate post
  let curve = Math.min(PW * 0.24, off * 1.05);
  let geom;
  for (let k = 0; k < 12; k++) {
    geom = junctionGeom({axis: 'h', a: {x: 0, y: Ym}, sDist: sD, len, off, curve, gauge: gw, endGap, gateAfter: 8, postSide: 'inner', bladeLen: Math.min(110, curve * 0.5)});
    const fin = cartAt(geom.routeBranch, geom.branchEndDist);
    if (fin.x + card.ext.x > geom.post.x + 26 || curve < 90) break;
    curve *= 0.9;
  }
  // the socket plate must fit in the wedge between the siding and the main track's ballast
  const sockS = Math.max(12, Math.min(S0.size * 0.9, (off - gw * 2.6 - 30) / 2.7));
  const parts = junctionParts(ctx, {prefix: `${P}-jn`, geom, lever: null, socketS: sockS, buffers: true});
  const sockC = parts.socketAt;
  const plate = sockS * 2.7;
  const socket = g(null,
    h('path', {d: roundRectPath(sockC.x - plate / 2, sockC.y - plate / 2, plate, plate, 8), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
    g({transform: T(sockC.x, sockC.y)}, emblem(ctx, {s: sockS, mode: 'socket'}), emblem(ctx, {name: `${P}-sock`, s: sockS, mode: mk === 'disputed' ? 'disputed' : 'present', opacity: 0})),
  );
  // wire from the socket plate to the switch (the connector's signal line)
  const wirePts = [{x: sockC.x - plate / 2, y: sockC.y}, {x: geom.S.x + (sockC.x - geom.S.x) * 0.35, y: sockC.y}, {x: geom.S.x + 26, y: geom.S.y - gw * 1.1}, {x: geom.S.x + 8, y: geom.S.y - 6}];
  const wire = polyline(wirePts);
  const wireNode = g(null,
    h('path', {d: wire.d(1), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-linejoin': 'round'}),
    h('path', {name: `${P}-pulse`, d: wire.d(1), fill: 'none', stroke: pal.exc, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(wire.total)} ${r(wire.total + 20)}`, 'stroke-dashoffset': r(wire.total)}),
  );
  // stand magnifier: base in the wedge beside the stop line; the lens swings over the marker slot
  const cp = cartAt(geom.routeMain, cpD);
  const marker = {x: cp.x + card.emblem.x, y: cp.y + card.emblem.y};
  const base = {x: cp.x + card.w / 2 + S0.R * 0.9, y: cp.y - card.h / 2 - S0.R * 1.5};
  const park = {x: base.x + S0.R * 0.35, y: base.y - S0.R * 0.2};
  const copy = factCard(ctx, {prefix: `${P}-cz`, w: S0.cardW, facts: [p.facts[0]], heading: ctx.t.fact, marker: mk, size: S0.size, maxLines: 4,
    feature: {text: null, reserveFor: p.changedFact, name: `${P}-czf`, placeholder: true, dotOpacity: 0, maxLines: 3}});
  const stand = standMagnifier(ctx, {prefix: `${P}-mag`, R: S0.R, base, content: g(null,
    h('rect', {x: 0, y: 0, width: PW, height: PH, fill: pal.board}),
    g({name: `${P}-czPos`}, copy.node))});
  const wag = wagon(ctx, {name: `${P}-wagon`, along: wagonAlong, across: gw * 1.9});
  // an ink pad with its diamond stamp rests on BOTH boards (same place, same art): only B's stamp
  // is picked up, pressed on the marker slot and put back on its pad (no fade, no teleport)
  const freeTop = 12 + lane, freeBot = cp.y + card.ext.y - 12;
  const stampS = clamp((freeBot - freeTop) / 1.3, S0.size * 1.3, S0.size * 2.1);
  const padC = {x: Math.max(stampS * 0.8 + 10, cp.x - card.w * 0.2), y: (freeTop + freeBot) / 2};
  const padNode = g({transform: T(padC.x, padC.y)},
    h('path', {d: roundRectPath(-stampS * 0.72 + 4, -stampS * 0.56 + 6, stampS * 1.44, stampS * 1.12, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(-stampS * 0.72, -stampS * 0.56, stampS * 1.44, stampS * 1.12, 10), fill: '#4a525a', stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(-stampS * 0.6, -stampS * 0.44, stampS * 1.2, stampS * 0.88, 7), fill: shade(pal.exc, -0.25), opacity: 0.85}));
  const stamp = g({name: o.changed ? `${P}-stamp` : undefined, transform: T(padC.x, padC.y)}, stampTool(ctx, {name: `${P}-stool`, size: stampS, color: pal.exc}));
  const ring = h('circle', {name: `${P}-ring`, r: r(card.slot * 0.85), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0});
  const clipId = `${P}-clip`;
  const node = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(0, 0, PW, PH, 18)}))),
    h('path', {d: roundRectPath(4, 6, PW, PH, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, PW, PH, 18), fill: pal.board}),
    g({'clip-path': ctx.ref(clipId)},
      parts.bed, parts.lights, parts.rails, parts.buffers, parts.blade, parts.pivot, parts.gate,
      wireNode, socket,
      stand.base,
      padNode,
      g({name: `${P}-cart`}, wag),
      g({name: `${P}-cardPos`}, card.node),
      g({name: `${P}-ringPos`}, ring),
      stand.arm, stand.view, stand.lens,
      stamp,
    ),
    h('path', {d: roundRectPath(0, 0, PW, PH, 18), fill: 'none', stroke: th.ink, 'stroke-width': 2.5}),
  );
  const route = routeOf(o.state);
  const endD = route === 'branch' ? geom.branchEndDist : geom.mainEndDist;
  const finalRoute = route === 'branch' ? geom.routeBranch : geom.routeMain;
  return {node, card, geom, parts, cp, cpD, marker, base, park, stand, route, endD, finalRoute, changed: o.changed, state: o.state, P, wire, mk, padC};
}

/** Pose one panel at time u (panel-local). */
function posePanel(ctx, S, u, reduced) {
  const P = S.P;
  const nodes = {};
  const changed = S.changed;
  // wagon
  const depart = S.route === 'held' ? 0 : ease.inOutCubic(seg(u, ...W.depart));
  const pos = depart > 0 ? cartAt(S.finalRoute, lerp(S.cpD, S.endD, depart)) : cartAt(S.geom.routeMain, S.cpD);
  nodes[`${P}-cart`] = {transform: T(pos.x, pos.y, pos.angle)};
  nodes[`${P}-cardPos`] = {transform: T(pos.x, pos.y)};
  nodes[`${P}-czPos`] = {transform: T(pos.x, pos.y)};
  const slot = {x: pos.x + S.card.emblem.x, y: pos.y + S.card.emblem.y};
  nodes[`${P}-ringPos`] = {transform: T(slot.x, slot.y)};
  const ringIn = seg(u, ...W.ring);
  const ringOut = seg(u, W.lensIn[0], W.lensIn[0] + 0.03);
  nodes[`${P}-ring`] = {opacity: r(ringIn * (1 - ringOut), 3)};
  // stamp (B only): in, press, out; the marker is printed at the press
  const pressed = changed && u >= W.press[0] + (W.press[1] - W.press[0]) * 0.5;
  let stampAt = null, stampShown = false;
  if (changed) {
    const inP = ease.inOutCubic(seg(u, ...W.stampIn));
    const outP = ease.inOutCubic(seg(u, ...W.stampOut));
    const press = seg(u, ...W.press);
    const lift = Math.sin(Math.PI * press);
    // picked up from its pad, carried (slightly lifted = larger) to the slot, pressed, put back
    const from = S.padC;
    const over = {x: slot.x, y: slot.y};
    const at = outP > 0 ? {x: lerp(over.x, from.x, outP), y: lerp(over.y, from.y, outP)} : {x: lerp(from.x, over.x, inP), y: lerp(from.y, over.y, inP)};
    const shown = inP > 0 && outP < 1;
    const carry = Math.sin(Math.PI * inP) * (outP > 0 ? 0 : 1) + Math.sin(Math.PI * outP);
    nodes[`${P}-stamp`] = {transform: `${T(at.x, at.y)} scale(${r(1 + 0.1 * carry - 0.08 * lift, 4)})`};
    stampAt = at;
    stampShown = shown;
    nodes[`${P}-card-mk`] = {opacity: pressed ? 1 : 0};
    nodes[`${P}-cz-mk`] = {opacity: pressed ? 1 : 0};
    const feat = ctx.show('key') ? seg(u, ...W.feat) : 0;
    if (ctx.show('key')) nodes[`${P}-feat-text`] = {opacity: r(feat, 3), transform: `translate(0 ${r(8 * (1 - feat))})`};
    nodes[`${P}-feat-ph`] = {opacity: r(1 - seg(u, W.feat[0], W.feat[0] + 0.02), 3)};
    nodes[`${P}-feat-dot`] = {opacity: pressed ? 1 : 0};
  } else {
    nodes[`${P}-feat-dot`] = {opacity: 0};
  }
  // stand magnifiers (both): swing in, glass, swing back
  const lin = ease.inOutCubic(seg(u, ...W.lensIn));
  const lout = ease.inOutCubic(seg(u, ...W.lensOut));
  const over = lin * (1 - lout);
  const C = {x: lerp(S.park.x, slot.x, over), y: lerp(S.park.y, slot.y, over)};
  const glass = seg(u, ...W.glass) * (1 - seg(u, W.lensOut[0], W.lensOut[0] + 0.02));
  Object.assign(nodes, S.stand.frame(C, 2.1, glass));
  // B: socket, pulse, switch, gate; A: nothing thrown. Lights follow the supplied route.
  // the socket answers a present or disputed marker (as supplied); only an open branch gets the pulse
  const markerOn = changed && (S.mk === 'disputed' || (S.mk === 'present' && S.route !== 'main'));
  const sock = markerOn ? ease.outCubic(seg(u, ...W.socket)) : 0;
  nodes[`${P}-sock`] = {opacity: r(sock, 3)};
  const pulse = markerOn && S.route === 'branch' ? seg(u, ...W.pulse) : 0;
  nodes[`${P}-pulse`] = {'stroke-dashoffset': r(S.wire.total * (1 - pulse))};
  const thrown = S.route === 'branch' ? ease.inOutCubic(seg(u, ...W.blade)) : 0;
  const lit = seg(u, ...W.lit);
  Object.assign(nodes, S.parts.pose({blade: thrown, gate: thrown, litMain: S.route === 'main' ? lit : 0, litBranch: S.route === 'branch' ? lit : 0}));
  return {
    nodes,
    sem: {
      route: S.route, marker: pressed ? S.mk : 'none', changedRow: changed && u >= W.feat[0] ? 1 : 0,
      cart: {x: r(pos.x), y: r(pos.y)}, slot: {x: r(slot.x), y: r(slot.y)}, lens: {x: r(C.x), y: r(C.y)},
      lensOnSlot: Math.hypot(C.x - slot.x, C.y - slot.y) < 1, socketLit: r(sock, 3), pulse: r(pulse, 3), blade: r(thrown, 3), gate: r(thrown, 3),
      cartDist: r(depart > 0 ? lerp(S.cpD, S.endD, depart) : S.cpD, 1), switchDist: r(S.geom.sDist, 1), atStopLine: depart === 0,
      onBranch: S.route === 'branch' && depart > 0 && lerp(S.cpD, S.endD, depart) > S.geom.sDist + 4,
      stamp: stampAt ? {x: r(stampAt.x), y: r(stampAt.y)} : null, stampShown,
      pulsing: r(pulse, 3), litMain: S.route === 'main' ? r(lit, 3) : 0, litBranch: S.route === 'branch' ? r(lit, 3) : 0,
    },
  };
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1080, 940], portrait: [900, 1500]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const pal = palette(ctx);
    const D = ctx.design;
    const S0 = SHAPES[ctx.view.shape];
    const M = 14;
    // --- shared strip: the same rule, exception and condition in both boards (+ shared facts)
    const stripItems = [
      {kind: 'rule', heading: t.rule, text: p.rules.general, color: pal.rule, headInk: '#fff', icon: 'main'},
      {kind: 'exception', heading: t.exception, text: p.rules.exception, color: pal.exc, headInk: pal.excInk, icon: 'branch'},
      {kind: 'condition', heading: t.condition, text: p.rules.condition, color: pal.excSoft, headInk: pal.excInk, icon: 'socket'},
    ];
    const sideW = S0.side ? Math.round(D.w * S0.side) : 0;
    const stripW = sideW || D.w - 2 * M;
    const cols = sideW ? 1 : 3;
    const colGap = 14;
    const colW = (stripW - (cols - 1) * colGap) / cols;
    const probeHs = stripItems.map(it => plaque(ctx, {x: 0, y: 0, w: colW, ...it, size: S0.strip, maxLines: 4}).box.h);
    const probeH = sideW ? probeHs.reduce((a, b) => a + b, 0) + colGap * 2 : Math.max(...probeHs);
    const sharedText = `${t.sameRules}: ${p.sharedFacts.join(' · ')}`.replace(/: $/, '');
    const sharedTitle = ctx.show('key') ? caption(ctx, sharedText, {x: M, y: 0, maxWidth: stripW, size: S0.strip * 0.92, maxLines: sideW ? 4 : 2, weight: 600, fill: th.fgSoft}) : null;
    const titleH = sharedTitle ? sharedTitle.box.h + 8 : 0;
    // the neutral note keeps its whole wording (wraps instead of being cut)
    const noteOf = (x, y, name) => chip(ctx, p.comparisonLabels.neutral, {x, y, anchor: 'middle', maxWidth: stripW, size: S0.strip, maxLines: sideW ? 4 : 3, fill: th.card, name, weight: 500});
    const noteProbe = ctx.show('all') ? noteOf(0, 0) : null;
    const noteH = noteProbe ? noteProbe.box.h + 10 : 0;
    const stripH = sideW ? 0 : titleH + probeH + noteH + 12;
    // --- panels
    const row = S0.arr === 'row';
    const scen = [p.scenarioA, p.scenarioB];
    // header band: grows (bounded) until both scenario labels and captions fit without being cut
    const PW0 = row ? (D.w - 2 * M - S0.gap) / 2 : D.w - 2 * M - (sideW ? sideW + 24 : 0);
    const guideMax = row ? PW0 * 0.7 : PW0 * 0.38;
    const guideLines = row ? 2 : 3;
    const guideProbe = ctx.show('key') ? chip(ctx, `${p.comparisonLabels.guide}: ${p.changedFact}`, {x: 0, y: 0, maxWidth: guideMax, size: S0.strip, maxLines: guideLines}).box : null;
    // A's band is free; B's band leaves room for the guide label at its right end (stacked boards)
    // both bands use the same width so A and B headers get matching type sizes
    const bandW = row ? PW0 : Math.min(PW0 - 16, PW0 - 8 - 14 - (guideProbe ? guideProbe.w : 0) - 24);
    const headWs = [bandW, bandW];
    let hdr = S0.header;
    let best = null;
    for (const extra of [0, 16, 32, 48, 64]) {
      const hh = S0.header + extra;
      const probes = scen.map((sc, i) => scenarioHead(ctx, {name: `head${i}`, letter: 'A', label: sc.label, caption: sc.caption, x: 0, y: 0, w: headWs[i], h: hh - 8, color: pal.rule}));
      const ok = !probes.some(q => q.truncated);
      const cap = Math.min(...probes.map(q => q.capSize ?? 99));
      if (ok && (!best || cap > best.cap + 0.5)) best = {hh, cap};
      if (ok && cap >= 18) break;
    }
    hdr = best ? best.hh : S0.header + 64;
    let PW, PH, origins, headers;
    if (row) {
      PW = (D.w - 2 * M - S0.gap) / 2;
      PH = D.h - 2 * M - hdr - stripH;
      origins = [{x: M, y: M + hdr}, {x: M + PW + S0.gap, y: M + hdr}];
      headers = [{x: M, y: M}, {x: M + PW + S0.gap, y: M}];
    } else {
      PW = D.w - 2 * M - (sideW ? sideW + 24 : 0);
      PH = (D.h - 2 * M - 2 * hdr - S0.gap - stripH) / 2;
      origins = [{x: M, y: M + hdr}, {x: M, y: M + hdr * 2 + PH + S0.gap}];
      headers = [{x: M, y: M}, {x: M, y: M + hdr + PH + S0.gap}];
    }
    const lane = row ? S0.strip * 2.2 : 0;
    const A = panelScene(ctx, {prefix: 'a', S0, PW, PH, changed: false, state: p.routeA, lane});
    const B = panelScene(ctx, {prefix: 'b', S0, PW, PH, changed: true, state: p.routeB, lane});
    // stacked boards: the guide label sits at the right of B's header band, so both headers leave it room
    const headNodes = headers.map((hp, i) => scenarioHead(ctx, {name: `head${i}`, letter: i ? 'B' : 'A', label: scen[i].label, caption: scen[i].caption, x: hp.x, y: hp.y + 4, w: headWs[i], h: hdr - 8, color: i ? pal.exc : pal.rule}).node);
    // strip nodes (bottom band, or a side column beside the stacked boards in square boxes)
    const stripNodes = [];
    let note = null;
    if (sideW) {
      const sx = D.w - M - sideW;
      const total = titleH + probeH + noteH;
      let y = M + Math.max(0, (D.h - 2 * M - total) / 2);
      if (sharedTitle) stripNodes.push(caption(ctx, sharedText, {x: sx, y, maxWidth: sideW, size: S0.strip * 0.92, maxLines: 4, weight: 600, fill: th.fgSoft, name: 'shared'}).node);
      y += titleH;
      stripItems.forEach((it, i) => {
        stripNodes.push(plaque(ctx, {name: `strip-${it.kind}`, x: sx, y, w: sideW, ...it, size: S0.strip, maxLines: 4}).node);
        y += probeHs[i] + colGap;
      });
      if (noteProbe) note = noteOf(sx + sideW / 2, y + 2, 'note');
    } else {
      const stripY = D.h - M - stripH + 4;
      if (sharedTitle) stripNodes.push(caption(ctx, sharedText, {x: M, y: stripY, maxWidth: D.w - 2 * M, size: S0.strip * 0.92, maxLines: 2, weight: 600, fill: th.fgSoft, name: 'shared'}).node);
      stripItems.forEach((it, i) => stripNodes.push(plaque(ctx, {name: `strip-${it.kind}`, x: M + i * (colW + colGap), y: stripY + titleH, w: colW, ...it, size: S0.strip, maxLines: 4}).node));
      note = noteProbe ? noteOf(D.w / 2, stripY + titleH + probeH + 10, 'note') : null;
    }

    // --- comparison guide: from A's marker slot to B's (final positions), routed through free space
    const finA = A.route === 'held' ? A.cp : cartAt(A.finalRoute, A.endD);
    const finB = B.route === 'held' ? B.cp : cartAt(B.finalRoute, B.endD);
    const sA = {x: origins[0].x + finA.x + A.card.emblem.x, y: origins[0].y + finA.y + A.card.emblem.y};
    const sB = {x: origins[1].x + finB.x + B.card.emblem.x, y: origins[1].y + finB.y + B.card.emblem.y};
    const ringR = A.card.slot * 0.85;
    let gpts;
    let gx, laneY;
    if (row) {
      gx = origins[0].x + PW + S0.gap / 2;
      laneY = origins[1].y + 12 + lane / 2;
      gpts = [{x: sA.x + ringR, y: sA.y}, {x: gx, y: sA.y}, {x: gx, y: laneY}, {x: sB.x, y: laneY}, {x: sB.x, y: sB.y - ringR}];
    } else {
      // down A's right edge, into B along its top edge, then straight down onto B's slot
      gx = origins[0].x + PW - 8;
      const topB = origins[1].y + 10;
      gpts = [{x: sA.x + ringR, y: sA.y}, {x: gx, y: sA.y}, {x: gx, y: topB}, {x: sB.x, y: topB}, {x: sB.x, y: sB.y - ringR}];
    }
    // drop zero-length legs
    gpts = gpts.filter((q, i) => i === 0 || Math.hypot(q.x - gpts[i - 1].x, q.y - gpts[i - 1].y) > 0.5);
    const guide = polyline(gpts);
    let guideLabel = null;
    if (ctx.show('key')) {
      const text = `${p.comparisonLabels.guide}: ${p.changedFact}`;
      const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: guideMax, size: S0.strip, maxLines: guideLines});
      // row: on the guide's lane leg inside board B; column: in B's header band beside the guide
      let cx, cy;
      if (row) {
        cx = clamp((gx + sB.x) / 2, origins[1].x + probe.box.w / 2 + 8, origins[1].x + PW - probe.box.w / 2 - 8);
        cy = laneY - probe.box.h / 2;
      } else {
        cx = gx - 14 - probe.box.w / 2;
        cy = headers[1].y + (hdr - probe.box.h) / 2;
      }
      guideLabel = chip(ctx, text, {x: cx, y: cy, anchor: 'middle', maxWidth: guideMax, size: S0.strip, maxLines: guideLines, fill: th.card, stroke: th.accent, name: 'guide-label'});
    }
    return {S0, A, B, origins, PW, PH, headNodes, stripNodes, note, guide, gpts, sA, sB, ringR, guideLabel, row};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.headNodes,
      g({transform: T(L.origins[0].x, L.origins[0].y)}, L.A.node),
      g({transform: T(L.origins[1].x, L.origins[1].y)}, L.B.node),
      g({name: 'strip'}, L.stripNodes),
      g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d: L.guide.d(1), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': `${r(L.guide.total)} ${r(L.guide.total + 20)}`, 'stroke-dashoffset': r(L.guide.total), 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}),
        h('circle', {name: 'guide-ringA', cx: r(L.sA.x), cy: r(L.sA.y), r: r(L.ringR), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0}),
        h('circle', {name: 'guide-ringB', cx: r(L.sB.x), cy: r(L.sB.y), r: r(L.ringR), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0}),
      ),
      L.guideLabel && L.guideLabel.node,
      L.note && L.note.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const pa = posePanel(ctx, L.A, u, ctx.reduced);
    const pb = posePanel(ctx, L.B, u, ctx.reduced);
    Object.assign(nodes, pa.nodes, pb.nodes);
    nodes.strip = {opacity: r(seg(u, ...W.strip), 3)};
    const gp = ease.inOutCubic(seg(u, ...W.guide));
    nodes.guide = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-line'] = {'stroke-dashoffset': r(L.guide.total * (1 - gp))};
    nodes['guide-ringA'] = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-ringB'] = {opacity: gp >= 0.99 ? 1 : 0};
    if (L.guideLabel) nodes['guide-label'] = {opacity: r(seg(u, ...W.guideLabel), 3)};
    if (L.note) nodes.note = {opacity: r(seg(u, ...W.note), 3)};
    const toW = (o, q) => ({x: r(o.x + q.x), y: r(o.y + q.y)});
    // what visibly differs between the two boards right now (panel-local comparison)
    const keys = ['marker', 'changedRow', 'blade', 'socketLit', 'pulsing', 'litMain', 'litBranch', 'cart', 'lens'];
    const visibleDiff = keys.filter(k => JSON.stringify(pa.sem[k]) !== JSON.stringify(pb.sem[k]));
    const geo = S => ({S: S.geom.S, Q: S.geom.Q, E: S.geom.E, EB: S.geom.EB, post: S.geom.post, cp: S.cp, card: [S.card.w, S.card.h], base: S.base});
    const identicalBase = JSON.stringify(geo(L.A)) === JSON.stringify(geo(L.B));
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        a: pa.sem,
        b: pb.sem,
        cartA: toW(L.origins[0], pa.sem.cart),
        cartB: toW(L.origins[1], pb.sem.cart),
        lensA: toW(L.origins[0], pa.sem.lens),
        lensB: toW(L.origins[1], pb.sem.lens),
        guideProgress: r(gp, 3),
        visibleDiff,
        identicalBase,
        stampB: pb.sem.stamp ? toW(L.origins[1], pb.sem.stamp) : null,
        stampShown: pb.sem.stampShown,
        arrangement: L.row ? 'row' : 'column',
        panelSize: {w: r(L.PW), h: r(L.PH)},
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-04-contrast',
    title: 'Rule and exception — same junction, one changed fact',
    titleEs: 'Regla y excepción — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Regla y excepción',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical railway-junction boards (general case A, exceptional case B). Only in B a stamp prints the condition marker on the fact card and the changed fact is written in its reserved row; both magnifiers examine the card at the same time; in B the socket fills, the switch throws and the gate opens, and the wagons then follow their supplied routes (A main line, B separate branch). A guide joins the changed detail; a neutral note states no outcome.',
    tags: ['reasoning', 'rule', 'exception', 'contrast', 'paired scenes', 'changed fact', 'switch', 'branch'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/regla-y-excepcion.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
