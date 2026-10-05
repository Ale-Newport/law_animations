/**
 * LAW-0102 — Condiciones alternativas · mechanism
 *
 * Storyboard (an exploded diagram of the pneumatic "either" mechanism; no
 * actors — the parts themselves are the explanation):
 *  0.00–0.18 separate  The parts start pushed together around the junction:
 *                      the RULE plaque, the two INLET STATIONS (Route A and
 *                      Route B: condition plate + fact card with its supplied
 *                      status + a brass inlet bell whose tube stub points to the
 *                      junction), the JUNCTION (a brass shuttle valve with a
 *                      cut-away window and its ball) and the POINT OF ANALYSIS
 *                      (receiving tray with the magnifier lying on it). They
 *                      slide apart along lines from the junction.
 *  0.18–0.43 relate    Only the supplied relationships are drawn, one after the
 *                      other, anchored to the parts' edges / tube stubs / valve
 *                      ports, each captioned with its kind: a plain relation
 *                      (rule — inlet) has end dots and NO arrowhead; sequences
 *                      (inlet → junction → point) have arrowheads; a causal
 *                      style appears only when the author supplies it.
 *  0.43–0.75 trace     A tracer marker runs through `traversalOrder` along the
 *                      drawn connectors. When it reaches the focus element the
 *                      magnifier lifts off the tray and holds over it — its
 *                      glass shows a real enlarged copy — and, at the junction,
 *                      the ball is pushed against the far seat by the arriving
 *                      route (so one route alone opens the outlet).
 *  0.75–1.00 gather    The parts slide part of the way back toward the junction
 *                      (connectors stay attached and keep their captions); the
 *                      supplied states stay visible: each fact's status pill,
 *                      the ball's position and the state tag at the point
 *                      ("reached by Route A and by Route B — as supplied").
 * Wide boxes flow left → right (rule | stacked inlets | junction | point);
 * square boxes put the rule on top, the inlets side by side and the junction
 * and point in one row; tall boxes stack rule / inlets / junction / point.
 * Legal content: fictional, jurisdiction unspecified; relationships and
 * statuses are supplied; reaching the point is not a finding that a condition
 * is met, that the rule applies, or of any outcome.
 * @module animations/reasoning/LAW-0102
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {dist, polyline} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  AC_STRINGS, acFields, AC_DEFAULTS, resolveRoutes, stateLine, statusText, statusTokens, acColors, unitsPerPx,
  tubeArt, inletArt, valveArt, trayArt, lupaArt, rulePlaque, panel, notesLayout, notesArt, cloneArt, cubicAt, cubicHead, filletPoints,
} from './kits/condiciones-alternativas.js';

const ID = 'LAW-0102';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {explode: [0.01, 0.15], draw: [0.17, 0.4], trace: [0.43, 0.7], capsOut: [0.72, 0.74], gather: [0.74, 0.8], capsIn: [0.8, 0.84], tag: [0.8, 0.84], chips: [0, 0.06]};
const IDS = ['rule', 'portA', 'portB', 'junction', 'point'];
const M = 14;
const PX = [22, 21, 20, 19, 18, 17, 16];

const EXTRA = {
  en: {factWord: 'Fact', relation: 'lists this condition', sequence: 'route (sequence)'},
  es: {factWord: 'Hecho', relation: 'enumera esta condición', sequence: 'ruta (secuencia)'},
};
const STRINGS = {en: {...AC_STRINGS.en, ...EXTRA.en}, es: {...AC_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {...acFields, ...mechanismFields(IDS)};
const defaultParams = {
  ...AC_DEFAULTS,
  elements: [
    {id: 'rule', label: 'Rule · illustrative text'},
    {id: 'portA', label: 'Route A · condition as supplied'},
    {id: 'portB', label: 'Route B · condition as supplied'},
    {id: 'junction', label: 'Junction · either route'},
    {id: 'point', label: 'Point of analysis'},
  ],
  relationships: [
    {from: 'rule', to: 'portA', kind: 'relation'},
    {from: 'rule', to: 'portB', kind: 'relation'},
    {from: 'portA', to: 'junction', kind: 'sequence'},
    {from: 'portB', to: 'junction', kind: 'sequence'},
    {from: 'junction', to: 'point', kind: 'sequence'},
  ],
  focusElement: 'junction',
  relationLabels: {relation: 'lists this condition', communication: 'communication', sequence: 'route (sequence)', causal: 'causal (as supplied)'},
  traversalOrder: ['portA', 'junction', 'point'],
};

const labelOf = (p, id, t) => {
  const e = p.elements.find(x => x.id === id);
  if (e) return e.label;
  const d = defaultParams.elements.find(x => x.id === id);
  return id === 'rule' ? t.ruleKind : id === 'junction' ? t.junction : id === 'point' ? t.point : id === 'portA' ? `${t.route} A` : id === 'portB' ? `${t.route} B` : d.label;
};

const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
const shiftBox = (b, d) => ({x: b.x + d.x, y: b.y + d.y, w: b.w, h: b.h});
const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const unionB = list => {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};

/** Edge anchor with the outward normal of the side it lies on. */
function edgeA(b, toward, pad = 6) {
  const c = center(b);
  const dx = toward.x - c.x, dy = toward.y - c.y;
  const hw = b.w / 2 + pad, hh = b.h / 2 + pad;
  const sx = hw / Math.abs(dx || 1e-9), sy = hh / Math.abs(dy || 1e-9);
  if (sx < sy) return {x: c.x + dx * sx, y: c.y + dy * sx, nx: Math.sign(dx), ny: 0};
  return {x: c.x + dx * sy, y: c.y + dy * sy, nx: 0, ny: Math.sign(dy)};
}

/** Measure every part and place the exploded composition. */
function compose(ctx, cpx, pwk = 0.28, forceRow = false, tagLow = false, pointLow = false, midGap = 150, tight = false, tagLeft = false) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const U = unitsPerPx(ctx);
  const shape = ctx.view.shape;
  const col = acColors(ctx);
  const showK = ctx.show('key'), showA = ctx.show('all');
  const hidden = !showK && !showA;
  const cs = cpx * U, ks = Math.min(cpx, 20) * U, gs = Math.min(cpx, 19) * U;
  const res = resolveRoutes(p);
  const L = {cpx, U, cs, ks, gs, res, shape, midGap};
  const Wd = D.w - 2 * M;
  const tpl = shape === 'landscape' || forceRow ? 'row' : 'column';
  const ruleMid = false;
  const beside = shape === 'square' && !forceRow; // square: the point of analysis sits beside the valve (saves a row)
  L.tpl = beside ? 'column-beside' : tpl;
  L.ruleMid = ruleMid;
  const N = notesLayout(ctx, {M, ks, collapse: hidden});
  L.N = N;
  let top = M, bottom = N.top - 16;

  // --- widths per template
  let rw, pw, ptw;
  if (ruleMid) { pw = Wd * (pwk + 0.12); rw = pw; ptw = Wd * 0.2; }
  else if (tpl === 'row') { rw = clamp(Wd * (0.48 - pwk), 300, 440); pw = clamp(Wd * pwk, 380, 700); ptw = clamp(Wd * 0.17, 260, 380); }
  // square: a wide middle gap between the two inlets, which close up across it in the gather
  else { rw = Wd; pw = (Wd - (beside ? midGap : 50)) / 2; ptw = beside ? Wd * 0.3 : Wd * 0.56; }
  const vs = beside ? clamp(cs * 1.5, 30, 46) : tpl === 'row' ? clamp(cs * 2.1, 40, 66) : clamp(cs * 2, 36, 62); // valve half-height
  const tw = clamp(vs * 0.7, 24, 40);
  const bellGap = tight ? 10 : 24; // clear space between a card and its inlet bell
  const stubLen = tpl === 'row' ? 40 : tight ? 12 : 22;
  const bellRoom = tpl !== 'column' ? bellGap + tw * 1.35 + 10 + stubLen : 0;
  const bellDrop = tpl !== 'column' ? 0 : bellGap + tw * 1.35 + 10 + stubLen; // bell + stub hanging under the card

  // --- rule
  const plq = rulePlaque(ctx, {w: rw, kind: labelOf(p, 'rule', t), headSize: ks, text: p.rules.name, size: cs, show: showK});
  // --- ports (plate + card + inlet bell on the side facing the junction, with its tube stub)
  const ports = {};
  // square: each inlet's condition plate and fact card sit side by side (card on the inner side, bell under it)
  const sideBySide = false; // tried for square: narrower panels grew taller, not shorter
  for (const R of res.routes) {
    const key = R.key;
    const w = sideBySide ? (pw - 12) / 2 : pw - bellRoom;
    const plate = panel(ctx, {w, head: labelOf(p, `port${key}`, t), headSize: ks, body: R.condition, size: cs, weight: 600, show: showK, balance: true});
    // the fact card carries its kind in the status pill ("Fact A · Supplied · sent") to keep the card compact
    const card = panel(ctx, {w, head: null, headSize: ks, body: R.fact || '—', size: cs, balance: true, pill: {tokens: [`${t.factWord} ${key}`, ...statusTokens(t, R.status)], status: R.status, color: col.route(key)}, pillSize: ks, show: showK});
    ports[key] = {plate, card, w};
  }
  const plateH = Math.max(ports.A.plate.h, ports.B.plate.h);
  const rowH = sideBySide ? Math.max(plateH, ports.A.card.h, ports.B.card.h) : 0;
  const portStackH = key => (sideBySide ? rowH : plateH + 10 + ports[key].card.h) + bellDrop;
  // --- junction and point captions
  const capOf = (text, mw) => chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: gs, minSize: gs, maxLines: 4, weight: 600});
  const valveLong = 2 * (vs * 2.3 + vs * 0.62) + 8, valveShort = vs * 1.15 + vs * 1.72 + 10;
  // square (beside): the junction caption sits left of the valve, below its inlets (saves a row)
  const jCapW = tpl === 'row' ? 220 : beside ? Wd * 0.4 - valveLong / 2 - 14 : Math.max(valveLong + 60, 280);
  const jCap = capOf(labelOf(p, 'junction', t), jCapW);
  const pCap = capOf(labelOf(p, 'point', t), beside ? Math.max(ptw, 240) : Math.max(ptw, 260));
  const tagText = stateLine(t, res);
  // square boxes hang the state tag under Route A's inlet (with a leader to the tray); elsewhere it sits under the tray
  // square (tagLeft): the state tag hangs under the junction caption, left of the valve (saves a row)
  tagLeft = tagLeft && beside && !tagLow;
  const tagMax = tagLow ? Wd : tagLeft ? jCapW : beside ? Math.max(ptw, 280) : Math.max(ptw + 40, 300);
  const tagP = chip(ctx, tagText, {x: 0, y: 0, maxWidth: tagMax, size: ks, minSize: ks, maxLines: 5, weight: 700});
  // last resort (square, longest texts): the state tag gets its own row just above the notes
  if (tagLow) { bottom -= tagP.box.h + 8; L.tagLowY = bottom + 8; }
  const trayW = ptw * 0.86, trayH = clamp(vs * 1.1, 40, 64);
  const lupR = clamp(vs * 1.05, 36, 62);
  const pointArtH = lupR * 0.75 + trayH + 12;
  const pointH = pointArtH + 10 + pCap.box.h + (tagLow || tagLeft ? 0 : 10 + tagP.box.h);
  const junctionH = beside ? vs * 1.15 + Math.max(vs * 1.72 + 12, vs * 0.6 + jCap.box.h + 6 + (tagLeft ? tagP.box.h + 10 : 0)) : (tpl === 'row' ? valveLong : vs * 1.15 + vs * 1.72) + 12 + jCap.box.h;
  // wide boxes hang the junction caption right of the valve's lower inlet (clear of the Route B link)
  const junctionW = tpl === 'row' ? valveShort / 2 + 10 + Math.max(valveShort / 2 + 10, vs * 0.9 + jCap.box.w) : Math.max(valveLong, jCap.box.w);
  const pointW = Math.max(ptw, tagLow || tagLeft ? 0 : tagP.box.w, pCap.box.w);

  // --- positions (exploded) per template
  const E = {};
  let ok = true;
  if (ruleMid) {
    // one column: inlet A, the rule plaque, inlet B (short relation links up and down); valve; point
    const gap = (Wd - pw - junctionW - pointW) / 2;
    if (gap < 80) ok = false;
    const hA = portStackH('A'), hB = portStackH('B');
    const g1 = 60;
    const spare = bottom - top - hA - hB - plq.h - 2 * g1;
    if (spare < 0) ok = false;
    const ex = Math.max(0, spare) / 4;
    const yA = top + ex, yR = yA + hA + g1 + ex, yB = yR + plq.h + g1 + ex;
    E.portA = {x: M, y: yA, side: 1};
    E.portB = {x: M, y: yB, side: 1};
    E.rule = {x: M, y: yR};
    const x2 = M + pw + gap, x3 = x2 + junctionW + gap;
    const mid = (yA + plateH + 10 + Math.min(ports.A.card.h * 0.4, 70) + yB + plateH + 10 + Math.min(ports.B.card.h * 0.4, 70)) / 2;
    E.junction = {x: x2 + valveShort / 2 + 10, y: mid};
    E.point = {x: x3, y: clamp(mid - pointArtH / 2, top, bottom - pointH)};
    if (junctionH > bottom - top) ok = false;
  } else if (tpl === 'row') {
    const gap = (Wd - rw - pw - junctionW - pointW) / 3;
    if (gap < 90) ok = false;
    const x0 = M, x1 = x0 + rw + gap, x2 = x1 + pw + gap, x3 = x2 + junctionW + gap;
    const hA = portStackH('A'), hB = portStackH('B');
    if (hA + hB + 90 > bottom - top) ok = false;
    const yA = top, yB = bottom - hB;
    E.portA = {x: x1, y: yA, side: 1};
    E.portB = {x: x1, y: yB, side: 1};
    const mid = (yA + hA / 2 + yB + hB / 2) / 2;
    E.rule = {x: x0, y: clamp(mid - plq.h / 2, top, bottom - plq.h)};
    E.junction = {x: x2 + valveShort / 2 + 10, y: mid};
    E.point = {x: x3, y: clamp(mid - pointArtH / 2, top, bottom - pointH)};
    if (plq.h > bottom - top || junctionH > bottom - top) ok = false;
  } else {
    const hP = Math.max(portStackH('A'), portStackH('B'));
    const rows = plq.h + hP + (beside ? Math.max(junctionH, pointH) : junctionH + pointH);
    const sqGap = pwk >= 0.28 ? 92 : pwk >= 0.24 ? 62 : pwk >= 0.2 ? 40 : 26; // square: roomy gaps first (visible separation), tighter ones as fallback
    // the gap under the rule holds the 'lists' link captions on their links
    const ruleCapH = Math.max(0, ...p.relationships.filter(rl => rl.from === 'rule' || rl.to === 'rule').map(rl => capOf(p.relationLabels[rl.kind] || t[rl.kind] || rl.kind, 420).box.h));
    const minGap = beside ? [Math.max(sqGap, ruleCapH + 22), sqGap] : [70, 60, 70];
    const spare = bottom - top - rows - minGap.reduce((a, b) => a + b, 0);
    if (spare < 0) ok = false;
    const extra = Math.max(0, spare) / (minGap.length + 1);
    const yR = top + extra * 0.5;
    const yP = yR + plq.h + minGap[0] + extra;
    const yJ = yP + hP + minGap[1] + extra;
    E.rule = {x: (D.w - rw) / 2, y: yR};
    E.portA = {x: M, y: yP, side: 1};
    E.portB = {x: D.w - M - pw, y: yP, side: -1};
    if (beside) {
      // valve left of centre, point to its right; the outlet turns down and right into the tray
      // valve centred under the inlets (bells hang on the cards' inner sides); the point at the right edge,
      // right of Route B's link
      const jx = M + Wd * 0.4;
      E.junction = {x: jx, y: Math.min(yJ + vs * 1.15, bottom - junctionH + vs * 1.15 - 4)};
      // last resort: the point drops to the bottom of the box, clear of Route B's inlet above it
      E.point = {x: D.w - M - pointW, y: pointLow ? bottom - pointH : yJ + Math.max(0, (junctionH - pointH) / 2)};
      if (E.point.x < jx + valveLong / 2 + 50 || E.point.y + pointH > bottom + 0.5) ok = false;
    } else {
      const yPt = yJ + junctionH + minGap[2] + extra;
      E.junction = {x: D.w / 2, y: yJ + vs * 1.15};
      E.point = {x: (D.w - pointW) / 2, y: yPt};
    }
  }
  if (!ok) return null;
  E.pointW = E.pointWide || pointW;

  // --- build part geometry at the exploded positions
  const parts = {};
  // rule
  parts.rule = {art: {x: E.rule.x, y: E.rule.y, w: rw, h: plq.h}, draw: () => plq.draw(E.rule.x, E.rule.y, 'rule-plaque')};
  parts.rule.full = parts.rule.art;
  // ports: the bell sits on the side facing the junction, at the fact card's height (the card feeds it)
  for (const key of ['A', 'B']) {
    const P = ports[key];
    const side = E[`port${key}`].side;
    const x0 = E[`port${key}`].x, y = E[`port${key}`].y;
    const x = side > 0 ? x0 : x0 + bellRoom;
    const plateB = {x, y, w: P.w, h: P.plate.h};
    const cardB = {x, y: y + plateH + 10, w: P.w, h: P.card.h};
    let inlet, stubPts, out;
    if (tpl !== 'column') {
      const by = cardB.y + Math.min(cardB.h * 0.4, 70);
      const edge = side > 0 ? x + P.w : x;
      const bellEndX = edge + side * (bellGap + tw * 1.35 + 10);
      inlet = inletArt(ctx, `inlet${key}`, {x: bellEndX, y: by, tube: tw, rot: side > 0 ? 0 : 180, flip: side < 0, color: col.route(key)});
      stubPts = [{x: bellEndX, y: by}, {x: bellEndX + side * stubLen, y: by}];
      out = {x: bellEndX + side * stubLen, y: by, nx: side, ny: 0};
    } else {
      // the bell hangs under the card, on its outer half, so the tube drops beside the valve's own inlet
      // square: bells on the cards' inner halves (the valve sits between them); tall: on the outer halves
      // square: bells on the cards' inner halves, just outside the valve's own inlets (the tubes drop beside the
      // valve and turn into its side inlets, so the inlets can close down onto it in the gather)
      const vHalf = vs * 2.8 + 4, jxB = M + Wd * 0.4;
      // clear of the valve by the bell's full width plus the gather padding, plus the inward gather of the inlets
      const bOff = vHalf + tw * 0.5 + 25 + 16 + (midGap >= 90 ? (midGap - 24) / 2 : 0);
      const bx = beside ? clamp(jxB - side * bOff, x + P.w * 0.1, x + P.w * 0.9) : side > 0 ? x + P.w * 0.32 : x + P.w * 0.68;
      const bellEndY = cardB.y + cardB.h + bellGap + tw * 1.35 + 10;
      inlet = inletArt(ctx, `inlet${key}`, {x: bx, y: bellEndY, tube: tw, rot: 90, flip: true, color: col.route(key)});
      // the kit's box pads every side by the bell radius; the narrow (lower) end is only the tube wide
      inlet = {...inlet, box: {...inlet.box, h: bellEndY + tw / 2 + 6 - inlet.box.y}};
      stubPts = [{x: bx, y: bellEndY}, {x: bx, y: bellEndY + stubLen}];
      out = {x: bx, y: bellEndY + stubLen, nx: 0, ny: 1};
    }
    const stub = tubeArt(ctx, `stub${key}`, filletPoints(stubPts, 4), {width: tw, color: col.route(key), every: 9999});
    const art = unionB([plateB, cardB, inlet.box, {x: Math.min(stubPts[0].x, stubPts[1].x) - tw / 2 - 4, y: Math.min(stubPts[0].y, stubPts[1].y) - tw / 2 - 4, w: Math.abs(stubPts[1].x - stubPts[0].x) + tw + 8, h: Math.abs(stubPts[1].y - stubPts[0].y) + tw + 8}]);
    parts[`port${key}`] = {
      obst: [plateB, cardB, inlet.box, {x: Math.min(stubPts[0].x, stubPts[1].x) - tw / 2 - 4, y: Math.min(stubPts[0].y, stubPts[1].y) - tw / 2 - 4, w: Math.abs(stubPts[1].x - stubPts[0].x) + tw + 8, h: Math.abs(stubPts[1].y - stubPts[0].y) + tw + 8}],
      art, full: art, out,
      body: unionB([plateB, cardB]),
      draw: () => g(null,
        stub.back, stub.front, inlet.node,
        P.plate.draw(plateB.x, plateB.y, {name: `plate${key}`, fill: col.brassLight, stroke: col.brassDark, headColor: '#5a4518', color: ctx.theme.ink, radius: 8, accent: col.route(key)}),
        P.card.draw(cardB.x, cardB.y, {name: `card${key}`, fill: ctx.theme.paper, stroke: ctx.theme.inkSoft, headColor: ctx.theme.inkSoft, color: ctx.theme.ink, radius: 6, accent: col.route(key)})),
    };
  }
  // junction (valve: inlets top/bottom + outlet right in wide boxes; inlets left/right + outlet down otherwise)
  const vOpts = tpl === 'row' ? {rot: -90, flipX: true} : {rot: 0};
  const valve = valveArt(ctx, 'valve', {x: E.junction.x, y: E.junction.y, size: vs, colorA: col.A, colorB: col.B, ...vOpts});
  const lvalve = valveArt(ctx, 'lvalve', {x: E.junction.x, y: E.junction.y, size: vs, colorA: col.A, colorB: col.B, ...vOpts});
  const jcY = valve.box.y + valve.box.h + 12;
  const jc = chip(ctx, labelOf(p, 'junction', t), {...(tpl === 'row' ? {x: E.junction.x + vs * 0.9, y: jcY} : beside ? {x: valve.box.x - 8, y: E.junction.y + vs * 0.6, anchor: 'end'} : {x: E.junction.x, y: jcY, anchor: 'middle'}), maxWidth: jCapW, size: gs, minSize: gs, maxLines: 4, weight: 600, name: 'cap-junction', fill: ctx.theme.card, stroke: ctx.theme.inkSoft});
  parts.junction = {obst: [valve.box, jc.box], art: valve.box, full: unionB([valve.box, jc.box]), draw: () => g(null, valve.node, showA ? jc.node : null), valve, lvalve};
  // point: tray + magnifier resting on it, caption and (hold) state tag
  const ptX = E.point.x + E.pointW / 2;
  const trayTop = E.point.y + lupR * 0.75;
  const tray = trayArt(ctx, 'tray', {x: ptX, y: trayTop, w: trayW, h: trayH, legs: 0, capR: tw * 0.4});
  const pc = chip(ctx, labelOf(p, 'point', t), {x: ptX, y: trayTop + trayH + 10, anchor: 'middle', maxWidth: beside ? Math.max(ptw, 240) : Math.max(ptw, 260), size: gs, minSize: gs, maxLines: 4, weight: 600, name: 'cap-point', fill: ctx.theme.card, stroke: ctx.theme.inkSoft});
  const tagAt = tagLow ? {x: M, y: L.tagLowY} : tagLeft ? {x: valve.box.x - 8, y: parts.junction.obst[1].y + parts.junction.obst[1].h + 10, anchor: 'end'} : {x: ptX, y: pc.box.y + pc.box.h + 10, anchor: 'middle'};
  const tag = chip(ctx, tagText, {...tagAt, maxWidth: tagMax, size: ks, minSize: ks, maxLines: 5, weight: 700, name: 'state-tag', fill: ctx.theme.card, stroke: ctx.theme.ink});
  const lupaRest = {x: ptX + Math.max(0, Math.min(trayW * 0.16, E.pointW / 2 - lupR * 2.35 - 10)), y: trayTop - lupR * 0.1};
  L.tagLead = null;
  L.tagSeparate = false;
  const lupaBox = {x: lupaRest.x - lupR - 8, y: lupaRest.y - lupR * 1.6 - 8, w: lupR * 3.3 + 16, h: lupR * 2.6 + 16};
  if (tagLeft) { parts.junction.obst.push(tag.box); parts.junction.full = unionB([parts.junction.full, tag.box]); }
  const tagOnPoint = !tagLow && !tagLeft;
  parts.point = {obst: [tray.box, pc.box, tagOnPoint ? tag.box : null, lupaBox].filter(Boolean), art: tray.box, full: unionB([tray.box, pc.box, tagOnPoint ? tag.box : null, lupaBox]), draw: () => g(null, tray.back, tray.front, showA ? pc.node : null), tray, tag, pc, lupaRest};
  L.parts = parts;
  L.valve = valve;
  L.lvalve = lvalve;
  L.lupR = lupR;
  L.tw = tw;
  L.vs = vs;
  L.tagText = tagText;
  L.Jc = {x: E.junction.x, y: E.junction.y};
  L.centers = Object.fromEntries(IDS.map(id => [id, center(parts[id].art)]));
  L.bottom = bottom;
  // exploded parts never touch
  {
    // piece by piece (plates, cards, bells, valve, captions, tray, magnifier)
    const bs = IDS.map(id => parts[id].obst || [parts[id].full]);
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (bs[i].some(a => bs[j].some(b => hit(a, b, 6)))) return null;
  }
  // every part inside the design box
  for (const id of IDS) {
    const b = parts[id].full;
    if (b.x < M - 1 || b.x + b.w > D.w - M + 1 || b.y < M - 1 || b.y + b.h > bottom + 1) return null;
  }
  return L;
}

/** Offsets of every part for a pull amount e (0 = exploded layout, 1 = pushed together). */
function offsets(L, e) {
  const out = {};
  for (const id of IDS) out[id] = {x: L.pull[id].x * e, y: L.pull[id].y * e};
  return out;
}

/** Anchor on a part toward another part (tube stubs and valve ports where they exist). */
function anchorOf(L, id, other, off) {
  const d = off[id];
  const P = L.parts[id];
  if (id.startsWith('port') && other === 'junction') return {x: P.out.x + d.x, y: P.out.y + d.y, nx: P.out.nx, ny: P.out.ny};
  if (id === 'junction' && (other === 'portA' || other === 'portB')) {
    const key = other.slice(4);
    const q = L.valve.ports[key], c = L.valve.ports.center;
    const n = {x: q.x - c.x, y: q.y - c.y};
    const len = Math.hypot(n.x, n.y) || 1;
    return {x: q.x + (n.x / len) * 8, y: q.y + (n.y / len) * 8, nx: n.x / len, ny: n.y / len};
  }
  if (id === 'junction' && other === 'point') {
    const q = L.valve.ports.out, c = L.valve.ports.center;
    const n = {x: q.x - c.x, y: q.y - c.y};
    const len = Math.hypot(n.x, n.y) || 1;
    return {x: q.x + (n.x / len) * 10, y: q.y + (n.y / len) * 10, nx: n.x / len, ny: n.y / len};
  }
  const b = shiftBox(id.startsWith('port') ? P.body : P.art, d);
  // stacked flows: the rule plaque spans the width above both inlets, so each 'lists' link drops straight
  // down over its own inlet (the two links and their captions stay well apart)
  const rulePort = (id === 'rule' && other.startsWith('port')) || (other === 'rule' && id.startsWith('port'));
  if (rulePort && L.tpl !== 'row') {
    const pid = id === 'rule' ? other : id;
    const pb = shiftBox(L.parts[pid].body, off[pid]);
    const rb = shiftBox(L.parts.rule.art, off.rule);
    const x = clamp(pb.x + pb.w / 2, Math.max(pb.x, rb.x) + 24, Math.min(pb.x + pb.w, rb.x + rb.w) - 24);
    return id === 'rule' ? {x, y: rb.y + rb.h + 6, nx: 0, ny: 1} : {x, y: pb.y - 6, nx: 0, ny: -1};
  }
  const oc = L.parts[other] ? (() => { const c = center(L.parts[other].art); const o = off[other]; return {x: c.x + o.x, y: c.y + o.y}; })() : center(b);
  return edgeA(b, oc, id === 'junction' ? 4 : 6);
}

/** Cubic geometry of every supplied relationship for offsets `off`. */
function linkGeoms(L, off) {
  return L.rels.map(rel => {
    const A = anchorOf(L, rel.from, rel.to, off);
    const B = anchorOf(L, rel.to, rel.from, off);
    const len = Math.hypot(B.x - A.x, B.y - A.y);
    const k = Math.min(len * 0.42, 160);
    // control points stay above the content bottom, so no connector dips into the state tag or the notes
    const yMax = L.bottom - 6;
    const c1 = {x: A.x + A.nx * k, y: Math.min(A.y + A.ny * k, Math.max(A.y, yMax))};
    const c2 = {x: B.x + B.nx * k, y: Math.min(B.y + B.ny * k, Math.max(B.y, yMax))};
    return {A, B, c1, c2, len, mid: cubicAt(A, c1, c2, B, 0.5)};
  });
}

function finish(ctx, L) {
  const p = ctx.params;
  const t = ctx.t;
  const th = ctx.theme;
  const D = ctx.design;
  const showA = ctx.show('all');
  L.rels = p.relationships.filter(rl => rl.from !== rl.to && IDS.includes(rl.from) && IDS.includes(rl.to));
  const bounds = {x: M, y: M, w: D.w - 2 * M, h: L.bottom - M};
  // (1 unit of tolerance, as in compose())
  const inside = b => b.x >= bounds.x - 1 && b.y >= bounds.y - 1 && b.x + b.w <= bounds.x + bounds.w + 1 && b.y + b.h <= bounds.y + bounds.h + 1;
  L.pull = Object.fromEntries(IDS.map(id => [id, {x: 0, y: 0}]));
  const G1 = linkGeoms(L, offsets(L, 0));
  L.G1 = G1;
  const segX = (a, b, c, d) => {
    const o = (p1, p2, p3) => (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  const segHitsBox = (a, b, q) => {
    for (let k = 1; k < 24; k++) {
      const x = a.x + (b.x - a.x) * k / 24, y = a.y + (b.y - a.y) * k / 24;
      if (x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h) return true;
    }
    return false;
  };
  const edgePt = (b, q) => ({x: clamp(q.x, b.x, b.x + b.w), y: clamp(q.y, b.y, b.y + b.h)});
  const curveHitsBox = (q, b, pad) => {
    for (let s2 = 0.04; s2 <= 0.96; s2 += 0.04) { const pt = cubicAt(q.A, q.c1, q.c2, q.B, s2); if (pt.x > b.x - pad && pt.x < b.x + b.w + pad && pt.y > b.y - pad && pt.y < b.y + b.h + pad) return true; }
    return false;
  };
  // a leader crosses (or runs within 9 units of) another link: exact segment tests against the sampled curve
  const segDist = (p0, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
    const k = clamp(((p0.x - a.x) * dx + (p0.y - a.y) * dy) / l2);
    return Math.hypot(p0.x - a.x - dx * k, p0.y - a.y - dy * k);
  };
  // distance between two segments (0 when they cross)
  const segSegDist = (a1, a2, b1, b2) => (segX(a1, a2, b1, b2) ? 0 : Math.min(segDist(a1, b1, b2), segDist(a2, b1, b2), segDist(b1, a1, a2), segDist(b2, a1, a2)));
  const LEAD_GAP = 40; // two dotted leaders never run side by side (it must be clear which leader serves which link)
  const curveNearSeg = (q, a, e) => {
    let prev = cubicAt(q.A, q.c1, q.c2, q.B, 0);
    for (let k = 1; k <= 40; k++) {
      const pt = cubicAt(q.A, q.c1, q.c2, q.B, k / 40);
      if (segX(a, e, prev, pt) || segDist(pt, a, e) < 14) return true;
      prev = pt;
    }
    return false;
  };

  // --- the magnifier's pass (rest on the tray → over the focus element → back), known BEFORE any caption is
  // placed: every caption is seated clear of its whole path for the whole timeline (captions never move).
  // The handle angle at the hold is the one that covers the least printed text.
  L.magR = Math.max(L.vs * 2.3, L.lupR);
  L.pass = null;
  L.capShift = {junction: null, point: null};
  L.capTop = {junction: false, point: false};
  const focusId = p.focusElement;
  if (IDS.includes(focusId) && p.traversalOrder.includes(focusId)) {
    L.magHold = holdRadius(L, focusId);
    const fc = focusPoint(L, focusId);
    const rest = L.parts.point.lupaRest;
    const jcB0 = L.parts.junction.obst[1], pcB0 = L.parts.point.pc.box;
    const printed = [...['portA', 'portB'].flatMap(id => L.parts[id].obst.slice(0, 2)), L.parts.rule.art, L.N.issueBox, L.N.footBox].filter(Boolean);
    const caps0 = showA ? [jcB0, pcB0] : [];
    let bestAng = -12, bestHits = Infinity;
    // (angles within ±180° of the resting −28°, so the magnifier turns the short way)
    for (const a of [-12, -40, 15, 40, -70, 70, 110, 150, -180, -150, -110]) {
      let n = 0;
      for (let k = 2; k <= 10; k += 2) {
        const fp = lupaFoot(L, k / 10, fc, rest, a);
        n += 10 * printed.filter(b => footHitsBox({...fp, R: 0}, b, 4)).length + caps0.filter(b => footHitsBox(fp, b, 4)).length;
      }
      if (n < bestHits) { bestHits = n; bestAng = a; }
    }
    L.angHold = bestAng;
    const sweep = [];
    for (let k = 1; k <= 20; k++) sweep.push(lupaFoot(L, k / 20, fc, rest, bestAng));
    const underPass = b => sweep.some(fp => footHitsBox(fp, b, 6));
    L.pass = {fc, rest, underPass, sweepBoxes: sweep.flatMap(footBoxes)};
    // the junction / point captions: moved once (for the whole timeline) to the nearest spot clear of the path;
    // with no such spot they are drawn above the magnifier layer
    const seat = (own, id) => {
      if (!showA || !underPass(own)) return;
      const others = IDS.flatMap(q => (L.parts[q].obst || [L.parts[q].full]).filter(b => b !== own));
      const cands = [];
      for (let dx = -600; dx <= 600; dx += 12) for (const dy of [0, -12, 12, -24, 24, -40, 40, -60, 60]) cands.push({dx, dy, d: Math.hypot(dx, dy)});
      cands.sort((q1, q2) => q1.d - q2.d);
      for (const c of cands) {
        const b = {x: own.x + c.dx, y: own.y + c.dy, w: own.w, h: own.h};
        if (!inside(b) || underPass(b) || others.some(q => hit(b, q, 8)) || G1.some(q => curveHitsBox(q, b, 4))) continue;
        L.capShift[id] = {dx: c.dx, dy: c.dy};
        own.x = b.x; own.y = b.y; // the part's obstacle / caption box follows (same object)
        return;
      }
      L.capTop[id] = true;
    };
    seat(jcB0, 'junction');
    seat(pcB0, 'point');
    for (const id of ['junction', 'point']) if (L.capShift[id]) L.parts[id].full = unionB(L.parts[id].obst);
  }

  // --- pulls toward the junction (round-robin, equal steps): as far as each part can go while every part stays
  // apart and every link keeps a readable length. e = 1 is the pushed-together start; the hold uses L.eg of it.
  // a link keeps a readable length; in the stacked flows a rule link also keeps room for its caption on the line
  const minLen = L.rels.map((rel, k) => {
    const base = Math.min(84, G1[k].len * 0.6);
    if (L.tpl === 'row' || !showA || (rel.from !== 'rule' && rel.to !== 'rule')) return base;
    const text = p.relationLabels[rel.kind] || t[rel.kind] || rel.kind;
    return Math.max(base, chip(ctx, text, {x: 0, y: 0, maxWidth: 420, size: L.gs, minSize: L.gs, maxLines: 4, weight: 600}).box.h + 14);
  });
  const nearFirst = IDS.filter(id => id !== 'junction').sort((a, b) => dist(L.centers[a], L.Jc) - dist(L.centers[b], L.Jc));
  const sOf = Object.fromEntries(nearFirst.map(id => [id, 0]));
  const stopped = new Set();
  // each part slides along ONE axis toward the junction: in the wide flow the columns close up horizontally;
  // in the tall / square flows the rows close up vertically (the point beside the valve slides across)
  const dirOf = id => {
    const c = L.centers[id], dx = L.Jc.x - c.x, dy = L.Jc.y - c.y;
    const horizontal = L.tpl === 'row' ? true : L.tpl === 'column-beside' && id !== 'rule';
    // square: the two inlets close up symmetrically across the middle gap
    if (L.tpl === 'column-beside' && id.startsWith('port')) return L.midGap >= 90 ? {x: D.w / 2 - c.x, y: 0} : {x: 0, y: dy};
    return horizontal ? {x: dx, y: 0} : {x: 0, y: dy};
  };
  const offFor = sMap => Object.fromEntries(IDS.map(id => {
    const v = dirOf(id), k = id === 'junction' ? 0 : sMap[id] ?? 0;
    return [id, {x: v.x * k, y: v.y * k}];
  }));
  for (let s2 = 0.02; s2 <= 0.9001 && stopped.size < nearFirst.length; s2 += 0.02) {
    for (const id of nearFirst) {
      if (stopped.has(id)) continue;
      const trial = {...sOf, [id]: s2};
      const off = offFor(trial);
      const b = shiftBox(L.parts[id].full, off[id]);
      // parts clash piece by piece (plates, cards, bells, valve, captions, tray, magnifier), not by their unions
      const pieces = q => (L.parts[q].obst || [L.parts[q].full]).map(bx => shiftBox(bx, off[q]));
      const mine = pieces(id);
      const clash = !inside(b) || IDS.some(o => o !== id && pieces(o).some(bo => mine.some(bm => hit(bm, bo, 12))))
        || linkGeoms(L, off).some((q, k) => q.len < Math.min(minLen[k], G1[k].len - 0.5));
      if (clash) stopped.add(id); else sOf[id] = s2;
    }
  }
  // no part travels further than ~130 units (the gathered layout keeps room for every caption)
  for (const id of nearFirst) { const v = dirOf(id), len = Math.hypot(v.x, v.y) || 1; sOf[id] = Math.min(sOf[id], 130 / len); }
  // the two inlets are mirror parts: they move by the same amount
  const vlen = id => Math.hypot(dirOf(id).x, dirOf(id).y) || 1;
  const both = Math.min(sOf.portA * vlen('portA'), sOf.portB * vlen('portB'));
  sOf.portA = both / vlen('portA'); sOf.portB = both / vlen('portB');
  const full = offFor(sOf);
  for (const id of IDS) L.pull[id] = full[id];
  L.pullLen = Object.fromEntries(IDS.map(id => [id, r(Math.hypot(L.pull[id].x, L.pull[id].y), 1)]));
  L.eg = 0.8;

  // --- relation captions, placed separately for the spread layout (drawing / trace) and the gathered hold.
  // Every link gets its caption: on the line when there is room, else nearby with a short leader that crosses
  // no part, no other link, no other caption and no other leader (AUTHORING items 1, 5, 16).
  const placeCaps = (G, off, tag, opt = {}) => {
    // obstacles: each part's own pieces (not their union — the union of the valve and its caption would
    // swallow the free space where the outlet link runs), plus any extra boxes (e.g. the magnifier's pass)
    const partBoxes = IDS.flatMap(id => (L.parts[id].obst || [L.parts[id].full]).map(b => shiftBox(b, off[id])));
    // extra boxes keep captions out (a leader may pass under them: e.g. the magnifier's path)
    const capObst = [...partBoxes, ...(opt.extra || [])];
    const placed = [], leads = [];
    // captions kept where they are (opt.fixed[i]) are placed first
    for (const c of opt.fixed || []) if (c) { placed.push(c.box); if (c.lead) leads.push(c.lead); }
    let misses = 0;
    const caps = L.rels.map((rel, i) => {
      if (!showA) return null;
      if (opt.fixed && opt.fixed[i]) return opt.fixed[i];
      const text = p.relationLabels[rel.kind] || t[rel.kind] || rel.kind;
      const Gi = G[i];
      for (const mw of [420, 300, 230, 180, 140, 110]) {
        const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: L.gs, minSize: L.gs, maxLines: 4, weight: 600});
        // never a width that truncates or splits a word
        if (probe.fit.truncated || probe.fit.lines.join(' ').replace(/\s+/g, ' ').trim() !== text.replace(/\s+/g, ' ').trim()) continue;
        const bw = probe.box.w, bh = probe.box.h;
        for (let d = 0; d <= 640; d += 14) {
          const n = d === 0 ? 1 : Math.max(8, Math.round(d / 10));
          for (let a = 0; a < n; a++) {
            const ang = (a / n) * Math.PI * 2 + Math.PI / 2;
            const cx = Gi.mid.x + Math.cos(ang) * d, cy = Gi.mid.y + Math.sin(ang) * d;
            const b = {x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh};
            if (!inside(b) || capObst.some(q => hit(b, q, d > 26 ? 12 : 6)) || placed.some(q => hit(b, q, 10))) continue;
            if (G.some((q, j) => j !== i && curveHitsBox(q, b, 6))) continue;
            if (leads.some(ld => segHitsBox(ld.a, ld.e, b))) continue;
            let lead = null;
            if (d > 26) {
              const e = edgePt(b, Gi.mid);
              if (partBoxes.some(q => segHitsBox(Gi.mid, e, q)) || placed.some(q => segHitsBox(Gi.mid, e, q))) continue;
              if (G.some((q, j) => j !== i && curveNearSeg(q, Gi.mid, e))) continue;
              if (leads.some(ld => segSegDist(ld.a, ld.e, Gi.mid, e) < LEAD_GAP)) continue;
              lead = {a: {x: Gi.mid.x, y: Gi.mid.y}, e};
            } else if (d > 0 && curveHitsBox(Gi, b, 6)) continue;
            placed.push(b);
            if (lead) leads.push(lead);
            return {text, mw, box: b, w: bw, h: bh, lead};
          }
        }
      }
      misses++;
      const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: 230, size: L.gs, minSize: L.gs, maxLines: 3, weight: 600});
      const b = {x: Gi.mid.x - probe.box.w / 2, y: Gi.mid.y - probe.box.h / 2, w: probe.box.w, h: probe.box.h};
      placed.push(b);
      return {text, mw: 230, box: b, w: b.w, h: b.h, lead: null, miss: true};
    });
    let crossing = false;
    for (let a = 0; a < leads.length; a++) for (let b2 = a + 1; b2 < leads.length; b2++) if (segX(leads[a].a, leads[a].e, leads[b2].a, leads[b2].e)) crossing = true;
    L[`${tag}Misses`] = misses;
    L[`${tag}Crossing`] = crossing;
    let close = false;
    for (let a = 0; a < leads.length; a++) for (let b2 = a + 1; b2 < leads.length; b2++) if (segSegDist(leads[a].a, leads[a].e, leads[b2].a, leads[b2].e) < LEAD_GAP) close = true;
    L[`${tag}LeadersClose`] = close;
    // independent audit: no leader crosses a link other than its own
    L[`${tag}LeaderOverLink`] = caps.some((c, i) => c && c.lead && G.some((q, j) => {
      if (j === i) return false;
      let prev = cubicAt(q.A, q.c1, q.c2, q.B, 0);
      for (let k = 1; k <= 80; k++) { const pt = cubicAt(q.A, q.c1, q.c2, q.B, k / 80); if (segX(c.lead.a, c.lead.e, prev, pt)) return true; prev = pt; }
      return false;
    }));
    return caps;
  };
  // spread captions: clear of the magnifier's path; a caption that finds no such spot is seated normally and
  // drawn above the magnifier layer (never covered, never moved)
  L.caps = placeCaps(G1, offsets(L, 0), 'spread', {extra: L.pass ? L.pass.sweepBoxes : []});
  if (L.pass && L.spreadMisses) {
    const again = placeCaps(G1, offsets(L, 0), 'spread', {fixed: L.caps.map(c => (c && !c.miss ? c : null))});
    L.caps = L.caps.map((c, i) => (c && c.miss ? {...again[i], top: L.pass.underPass(again[i].box)} : c));
  }
  // the gathered hold: as close as every caption still finds a clean place (0.8 of the pull, else less)
  // first by holding the point of analysis back (the outlet caption needs room between valve and tray), then
  // by gathering everything less
  const pull0 = {...L.pull.point};
  gatherLoop: for (const eg of [0.8, 0.7, 0.6, 0.5, 0.4]) {
    for (const ps of [1, 0.75, 0.5]) {
      L.eg = eg;
      L.pull.point = {x: pull0.x * ps, y: pull0.y * ps};
      const offG = offsets(L, eg);
      L.GG = linkGeoms(L, offG);
      L.gcaps = placeCaps(L.GG, offG, 'gathered');
      if (!L.gatheredMisses) break gatherLoop;
    }
  }
  L.pullLen.point = r(Math.hypot(L.pull.point.x, L.pull.point.y), 1);
  const capNode = (c, i, pre) => c && g({name: `${pre}${i}`, opacity: 0},
    c.lead ? h('line', {x1: r(c.lead.a.x), y1: r(c.lead.a.y), x2: r(c.lead.e.x), y2: r(c.lead.e.y), stroke: kindColor(ctx, L.rels[i].kind), 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null,
    chip(ctx, c.text, {x: c.box.x + c.box.w / 2, y: c.box.y, anchor: 'middle', maxWidth: c.mw, size: L.gs, minSize: L.gs, maxLines: 4, weight: 600, fill: th.card, stroke: kindColor(ctx, L.rels[i].kind)}).node);
  L.capNodes = [...L.caps.map((c, i) => (c && !c.top ? capNode(c, i, 'lcap') : null)), ...L.gcaps.map((c, i) => capNode(c, i, 'gcap'))];
  L.topCapNodes = L.caps.map((c, i) => (c && c.top ? capNode(c, i, 'lcap') : null));
  // junction / point captions that stay under the path are drawn above the magnifier (the originals hidden)
  const twin = (box, text, name) => g({name}, chip(ctx, text, {x: box.x + box.w / 2, y: box.y, anchor: 'middle', maxWidth: box.w + 2, size: L.gs, minSize: L.gs, maxLines: 4, weight: 600, fill: th.card, stroke: th.inkSoft}).node);
  if (showA && L.capTop.junction) L.topCapNodes.push(twin(L.parts.junction.obst[1], labelOf(p, 'junction', t), 'jtop'));
  if (showA && L.capTop.point) L.topCapNodes.push(twin(L.parts.point.pc.box, labelOf(p, 'point', t), 'ptop'));

  // --- connectors (per-frame path data), tracer, magnifier with a real enlarged copy
  L.linkNodes = L.rels.map((rel, i) => {
    const col = kindColor(ctx, rel.kind);
    const st = LINK_STYLES[rel.kind] || LINK_STYLES.relation;
    return g({name: `link${i}`, opacity: 0},
      h('path', {name: `link${i}-line`, d: 'M0 0', fill: 'none', stroke: col, 'stroke-width': st.width + 0.5, 'stroke-linecap': 'round', 'stroke-dasharray': st.dash || undefined}),
      st.arrow ? h('path', {name: `link${i}-head`, d: `M0 0L${r(-st.width * 4.4)} ${r(-st.width * 2.4)}L${r(-st.width * 3.2)} 0L${r(-st.width * 4.4)} ${r(st.width * 2.4)}Z`, fill: col, opacity: 0}) : null,
      st.endDots ? h('circle', {name: `link${i}-dotA`, r: st.width * 1.7, fill: col, opacity: 0}) : null,
      st.endDots ? h('circle', {name: `link${i}-dotB`, r: st.width * 1.7, fill: col, opacity: 0}) : null);
  });
  const copyParts = IDS.filter(id => id !== 'junction').map(id => cloneArt(L.parts[id].draw()));
  L.copy = g({name: 'lupa-copy', opacity: 0}, copyParts, L.lvalve.node);
  L.lupa = lupaArt(ctx, 'lupa', {R: L.lupR, handle: L.lupR * 1.5, content: L.copy});
  L.tracerNode = tracer(ctx, 'tracer');

  // --- traversal route (through the connectors, at the exploded layout)
  const order = p.traversalOrder.filter(id => IDS.includes(id));
  const pts = [];
  const visits = [];
  // hub points: the tube stub of an inlet, the valve window, the tray; for the rule the plaque edge facing
  // the next part — the tracer never runs over printed text
  const cOf = (id, other) => {
    if (id.startsWith('port')) return {x: L.parts[id].out.x, y: L.parts[id].out.y};
    if (id === 'junction') return L.valve.ports.center;
    if (id === 'point') { const tb = L.parts.point.tray.box; return {x: tb.x + tb.w / 2, y: tb.y + tb.h * 0.3}; }
    const k = other ? L.rels.findIndex(rl => (rl.from === id && rl.to === other) || (rl.to === id && rl.from === other)) : -1;
    if (k >= 0) return L.rels[k].from === id ? G1[k].A : G1[k].B;
    return edgeA(L.parts.rule.art, L.Jc, 4);
  };
  order.forEach((id, i) => {
    if (i === 0) { pts.push(cOf(id, order[1])); visits.push({id, idx: 0}); return; }
    const prev = order[i - 1];
    const k = L.rels.findIndex(rl => (rl.from === prev && rl.to === id) || (rl.from === id && rl.to === prev));
    if (k >= 0) {
      const G = G1[k];
      const fwd = L.rels[k].from === prev;
      pts.push(fwd ? G.A : G.B);
      for (let s = 1; s <= 30; s++) pts.push(cubicAt(G.A, G.c1, G.c2, G.B, fwd ? s / 30 : 1 - s / 30));
    }
    pts.push(cOf(id, order[i - 1]));
    visits.push({id, idx: pts.length - 1});
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1] || 1;
  L.route = {poly: polyline(pts.length > 1 ? pts : [pts[0], pts[0]]), visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
  L.order = order;
  // focus visit (first time the tracer reaches the focus element)
  const fv = L.route.visits.find(v => v.id === p.focusElement);
  L.focusU = fv ? lerp(W.trace[0], W.trace[1], fv.t) : null;
  // which route arrives at the junction (the side the tracer comes from)
  const ji = order.indexOf('junction');
  L.arrivesFrom = ji > 0 && (order[ji - 1] === 'portA' || order[ji - 1] === 'portB') ? order[ji - 1].slice(4) : null;
  L.junctionU = ji >= 0 ? lerp(W.trace[0], W.trace[1], L.route.visits.find(v => v.id === 'junction').t) : null;

  return L;
}

/** Printed text under the magnifier (plates, cards, rule plaque, notes): neither the glass nor the handle may cover it. */
function lensOverText(L, lift) {
  const fp = lupaFoot(L, lift, L.pass.fc, L.pass.rest, L.angHold ?? -12);
  const printed = [...['portA', 'portB'].flatMap(id => L.parts[id].obst.slice(0, 2)), L.parts.rule.art, L.N.issueBox, L.N.footBox].filter(Boolean);
  return printed.some(b => footHitsBox(fp, b, 0));
}

/** Caption boxes on screen now (opacity ≥ 0.05), with a flag for those drawn above the magnifier. */
function visibleCaptions(L, capVis, off) {
  const out = [];
  L.caps.forEach((c, i) => { if (c && capVis[i] && capVis[i].l >= 0.05) out.push({b: c.box, top: Boolean(c.top)}); });
  L.gcaps.forEach((c, i) => { if (c && capVis[i] && capVis[i].g >= 0.05) out.push({b: c.box, top: false}); });
  const jc = L.parts.junction.obst[1], pc = shiftBox(L.parts.point.pc.box, off.point);
  out.push({b: jc, top: L.capTop.junction}, {b: pc, top: L.capTop.point});
  return out;
}

/** Does the magnifier (at this lift) cover any caption on screen (except those drawn above it)? */
function lensOverCaption(L, lift, capVis, off, showA) {
  if (!showA || !L.pass || lift <= 0.001) return false;
  const fp = lupaFoot(L, lift, L.pass.fc, L.pass.rest, L.angHold ?? -12);
  return visibleCaptions(L, capVis, off).some(c => !c.top && footHitsBox(fp, c.b, 0));
}

/** Is the tracer (visibly) on a caption? Its dot (r 9, glow 17) must stay off every caption on screen. */
function tracerOnCaption(L, tp, vis, capVis, off, showA) {
  if (!showA || vis <= 0.05) return false;
  return visibleCaptions(L, capVis, off).some(c => Math.hypot(Math.max(c.b.x - tp.x, 0, tp.x - c.b.x - c.b.w), Math.max(c.b.y - tp.y, 0, tp.y - c.b.y - c.b.h)) < 12);
}

/** Pose of the magnifier at lift (0 = resting on the tray, 1 = over the focus), as drawn by frame(). */
function lupaPose(L, lift, fc, rest, angHold) {
  return {c: {x: lerp(rest.x, fc.x, lift), y: lerp(rest.y, fc.y, lift) - Math.sin(Math.PI * lift) * 30}, sc: lerp(1, (L.magHold ?? L.magR) / L.lupR, lift), ang: lerp(-28, angHold, lift)};
}
/** Footprint of the magnifier (glass disc with its rim, and the handle as a capsule) at a lift. */
function lupaFoot(L, lift, fc, rest, angHold) {
  const P = lupaPose(L, lift, fc, rest, angHold);
  const R = L.lupR * P.sc, a = P.ang * Math.PI / 180;
  const h0 = R * 0.92, h1 = (L.lupR * 0.92 + L.lupR * 1.5) * P.sc;
  return {c: P.c, R: R + 7 * P.sc, a0: {x: P.c.x + Math.cos(a) * h0, y: P.c.y + Math.sin(a) * h0}, a1: {x: P.c.x + Math.cos(a) * h1, y: P.c.y + Math.sin(a) * h1}, hw: L.lupR * 0.2 * P.sc};
}
function footHitsBox(fp, b, pad = 0) {
  const circ = (c, R) => Math.hypot(Math.max(b.x - c.x, 0, c.x - b.x - b.w), Math.max(b.y - c.y, 0, c.y - b.y - b.h)) < R + pad;
  if (circ(fp.c, fp.R)) return true;
  for (let k = 0; k <= 8; k++) if (circ({x: lerp(fp.a0.x, fp.a1.x, k / 8), y: lerp(fp.a0.y, fp.a1.y, k / 8)}, fp.hw)) return true;
  return false;
}
function footBoxes(fp) {
  const out = [{x: fp.c.x - fp.R, y: fp.c.y - fp.R, w: 2 * fp.R, h: 2 * fp.R}];
  for (let k = 0; k <= 4; k++) { const x = lerp(fp.a0.x, fp.a1.x, k / 4), y = lerp(fp.a0.y, fp.a1.y, k / 4); out.push({x: x - fp.hw, y: y - fp.hw, w: 2 * fp.hw, h: 2 * fp.hw}); }
  return out;
}

const scene = {
  sizes: {landscape: [1800, 900], square: [1240, 1043], portrait: [900, 1400]},
  layout(ctx) {
    let L = null;
    if (ctx.view.shape === 'square') {
      // square: the tall flow with roomy gaps, then with tighter gaps, then the wide flow, then the tightest gaps
      const base = [[0.28, false, false], [0.28, false, true], [0.24, false, false], [0.24, false, true], [0.2, false, true], [0.1, false, true], [0.2, false, true, true], [0.1, false, true, true]];
      // the wide middle gap first (the inlets close up across it), then a narrower one, then the wide flow
      const tries = [...base.map(q => [...q.slice(0, 3), q[3] || false, 150]), ...base.map(q => [...q.slice(0, 3), q[3] || false, 90]), [0.28, true, false, false, 150], ...[150, 90].flatMap(mg => base.map(q => [...q.slice(0, 3), q[3] || false, mg, true])), ...base.map(q => [...q.slice(0, 3), q[3] || false, 50])];
      // square: the state tag beside the valve (under the junction caption) first — it saves a whole row, so the
      // text stays large — then the older arrangements. Largest text first (baseline ≥ 19.5 px); per text size,
      // the first composition whose captions all find a clean place and whose parts visibly gather.
      const left = [];
      for (const k of [0.28, 0.24, 0.2, 0.1]) for (const mg of [150, 90]) for (const tt of [false, true]) left.push([k, false, false, false, mg, tt, true]);
      const all = [...left, ...tries];
      let best = null, bestScore = -Infinity, finished = 0;
      outerSq: for (const px of PX) {
        for (const tr of all) {
          const C = compose(ctx, px, ...tr);
          if (!C) continue;
          const F = finish(ctx, C);
          finished++;
          const moves = IDS.filter(id => id !== 'junction').map(id => Math.hypot(F.pull[id].x, F.pull[id].y) * F.eg / F.U);
          const mean = moves.reduce((a, b) => a + b, 0) / moves.length;
          const misses = (F.spreadMisses || 0) + (F.gatheredMisses || 0);
          const score = -misses * 1000 + Math.min(mean, 30) + px * 3;
          if (score > bestScore) { best = F; bestScore = score; }
          if (!misses && mean >= 28 && Math.min(moves[1], moves[2]) >= 18) break outerSq;
          if (finished >= 24) break outerSq;
        }
      }
      if (best) return best;
    } else {
      // the first composition whose captions all find a clean place (largest text first)
      let best = null, bestScore = -Infinity, tried = 0;
      outer: for (const px of PX) for (const k of [0.28, 0.32, 0.36]) {
        const C = compose(ctx, px, k);
        if (!C) continue;
        const F = finish(ctx, C);
        const moves = IDS.filter(id => id !== 'junction').map(id => Math.hypot(F.pull[id].x, F.pull[id].y) * F.eg / F.U);
        const mean = moves.reduce((a, b) => a + b, 0) / moves.length;
        const misses = (F.spreadMisses || 0) + (F.gatheredMisses || 0);
        const score = -misses * 1000 + Math.min(mean, 40) + px;
        if (score > bestScore) { best = F; bestScore = score; }
        if (!misses && mean >= 30) break outer;
        if (++tried >= 6) break outer;
      }
      if (best) return best;
    }
    if (!L) throw new Error(`${ID}: no composition fits the ${ctx.view.shape} box`);
    return finish(ctx, L);
  },
  build(ctx, L) {
    return g(null,
      g({name: 'links'}, L.linkNodes),
      IDS.map(id => g({name: `part-${id}`, transform: T(0, 0)}, L.parts[id].draw())),
      g({name: 'tag-g', opacity: 0}, ctx.show('key') ? L.parts.point.tag.node : null, ctx.show('key') && L.tagLead ? h('line', {...L.tagLead, stroke: ctx.theme.ink, 'stroke-width': 2, 'stroke-dasharray': '4 5'}) : null),
      L.tracerNode,
      L.capNodes,
      L.lupa.node,
      L.topCapNodes || null,
      notesArt(ctx, L.N, {ks: L.ks}),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const e = ease.inOutCubic(seg(u, ...W.explode));
    const gth = ease.inOutCubic(seg(u, ...W.gather));
    const pullE = u < W.gather[0] ? 1 - e : L.eg * gth;
    const off = offsets(L, pullE);
    for (const id of IDS) nodes[`part-${id}`] = {transform: T(off[id].x, off[id].y)};
    // --- connectors: drawn one after the other, then kept attached while the parts move
    const G = linkGeoms(L, off);
    const n = L.rels.length;
    const slot = (W.draw[1] - W.draw[0]) / Math.max(1, n);
    const capVis = [];
    const drawn = [];
    const ends = [];
    L.rels.forEach((rel, i) => {
      const q = ease.inOutSine(seg(u, W.draw[0] + i * slot, W.draw[0] + (i + 1) * slot));
      drawn.push(r(q, 3));
      const g0 = G[i];
      const [a, b, c, d] = q > 0 ? cubicHead(g0.A, g0.c1, g0.c2, g0.B, q) : [g0.A, g0.A, g0.A, g0.A];
      nodes[`link${i}`] = {opacity: q > 0 ? 1 : 0};
      nodes[`link${i}-line`] = {d: `M${r(a.x)} ${r(a.y)}C${r(b.x)} ${r(b.y)} ${r(c.x)} ${r(c.y)} ${r(d.x)} ${r(d.y)}`};
      const st = LINK_STYLES[rel.kind] || LINK_STYLES.relation;
      if (st.arrow) {
        const ang = Math.atan2(g0.B.y - g0.c2.y, g0.B.x - g0.c2.x) * 180 / Math.PI;
        nodes[`link${i}-head`] = {transform: T(g0.B.x, g0.B.y, ang), opacity: q >= 0.985 ? 1 : 0};
      }
      if (st.endDots) {
        nodes[`link${i}-dotA`] = {cx: r(g0.A.x), cy: r(g0.A.y), opacity: q > 0 ? 1 : 0};
        nodes[`link${i}-dotB`] = {cx: r(g0.B.x), cy: r(g0.B.y), opacity: q >= 0.985 ? 1 : 0};
      }
      // captions: the spread-layout set while the links are drawn and traced; it fades out before the parts
      // gather, and the set placed for the gathered layout fades in after they have settled (never both at once)
      // (captions never move: each is seated for the whole timeline, clear of the magnifier's path)
      const base = clamp((q - 0.55) / 0.45) * (1 - seg(u, ...W.capsOut));
      capVis[i] = {l: L.caps[i] ? base : 0, g: L.gcaps[i] ? seg(u, ...W.capsIn) : 0};
      if (L.caps[i]) nodes[`lcap${i}`] = {opacity: r(base, 3)};
      if (L.gcaps[i]) nodes[`gcap${i}`] = {opacity: r(seg(u, ...W.capsIn), 3)};
      // the ends lie on (or at the ports of) their own parts
      const onPart = (pt, id) => {
        const b = shiftBox(id.startsWith('port') ? L.parts[id].art : L.parts[id].art, off[id]);
        return pt.x >= b.x - 16 && pt.x <= b.x + b.w + 16 && pt.y >= b.y - 16 && pt.y <= b.y + b.h + 16;
      };
      ends.push(onPart(g0.A, rel.from) && onPart(g0.B, rel.to));
    });
    // --- tracer along the supplied traversal order
    const tr = seg(u, ...W.trace);
    const vis = u >= W.trace[0] && u <= W.trace[1] + 0.02 ? clamp(Math.min(seg(u, W.trace[0], W.trace[0] + 0.02), 1 - seg(u, W.trace[1], W.trace[1] + 0.02))) : 0;
    const tp = L.route.poly.at(ease.inOutSine(tr));
    // the tracer runs UNDER the captions and fades out as it nears one (it never sits on caption text)
    let trVis = vis;
    if (vis > 0 && ctx.show('all')) {
      for (const c of visibleCaptions(L, capVis, off)) {
        const d = Math.hypot(Math.max(c.b.x - tp.x, 0, tp.x - c.b.x - c.b.w), Math.max(c.b.y - tp.y, 0, tp.y - c.b.y - c.b.h));
        trVis = Math.min(trVis, clamp((d - 14) / 22));
      }
    }
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: r(trVis, 3)};
    const visited = L.route.visits.filter(v => ease.inOutSine(tr) >= v.t - 1e-6 && u >= W.trace[0]).map(v => v.id);
    // --- the ball: pushed against the far seat by the route the tracer arrives from
    let ball = 0;
    if (L.junctionU !== null && L.arrivesFrom) {
      const k = ease.inOutSine(seg(u, L.junctionU - 0.015, L.junctionU + 0.03));
      ball = (L.arrivesFrom === 'A' ? 1 : -1) * k;
    }
    Object.assign(nodes, L.valve.frame(ball), L.lvalve.frame(ball));
    // --- magnifier: rests on the tray, lifts over the focus element while the tracer passes it
    const pOff = off.point;
    const rest = {x: L.parts.point.lupaRest.x + pOff.x, y: L.parts.point.lupaRest.y + pOff.y};
    let lc = rest, lift = 0, mag = 0;
    if (L.focusU !== null) {
      const go = ease.inOutCubic(seg(u, L.focusU - 0.08, L.focusU - 0.015));
      const back = ease.inOutCubic(seg(u, L.focusU + 0.05, L.focusU + 0.1));
      const fc = focusPoint(L, p.focusElement);
      lift = go * (1 - back);
      lc = {x: lerp(rest.x, fc.x, lift), y: lerp(rest.y, fc.y, lift) - Math.sin(Math.PI * lift) * 30};
      mag = go >= 1 && back <= 0 ? 1 : 0;
    }
    const ang = lerp(-28, L.angHold ?? -12, lift);
    // junction / point captions seated once clear of the magnifier's path (or drawn above it)
    if (ctx.show('all')) {
      if (L.capTop.junction) nodes['cap-junction'] = {opacity: 0};
      else if (L.capShift.junction) nodes['cap-junction'] = {transform: T(L.capShift.junction.dx, L.capShift.junction.dy)};
      if (L.capTop.point) { nodes['cap-point'] = {opacity: 0}; nodes.ptop = {transform: T(pOff.x, pOff.y)}; }
      else if (L.capShift.point) nodes['cap-point'] = {transform: T(L.capShift.point.dx, L.capShift.point.dy)};
    }
    // over the focus part the glass grows to show the whole detail, enlarged 1.5×
    const sc = lerp(1, (L.magHold ?? L.magR) / L.lupR, lift);
    const z = 1.5;
    nodes.lupa = {transform: T(lc.x, lc.y, ang, sc)};
    // the glass always shows the real enlarged copy while it is lifted (it never blanks out what lies under it)
    nodes['lupa-copy'] = {opacity: lift > 0.02 ? 1 : 0, transform: `rotate(${r(-ang)}) scale(${r(z / sc, 4)}) translate(${r(-lc.x)} ${r(-lc.y)})`};
    // --- chips
    const chipsO = r(seg(u, ...W.chips), 3);
    if (ctx.show('key')) nodes.foot = {opacity: chipsO};
    if (L.N.issueBox && ctx.show('all')) nodes['issue-g'] = {opacity: chipsO};
    nodes['tag-g'] = {opacity: r(seg(u, ...W.tag), 3)};

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
        template: L.tpl,
        spread: r(1 - pullE, 3),
        gathered: r(1 - L.eg, 3),
        pullLengths: L.pullLen,
        relationsDrawn: drawn,
        linkKinds: L.rels.map(rl => rl.kind),
        arrowheads: L.rels.map(rl => Boolean((LINK_STYLES[rl.kind] || {}).arrow)),
        causalCount: L.rels.filter(rl => rl.kind === 'causal').length,
        linkEnds: ends,
        linkLengths: G.map(q => r(q.len, 1)),
        tracer: P2(tp),
        tracerVisible: vis > 0,
        visitOrder: L.order,
        visited,
        focus: p.focusElement,
        focusU: L.focusU === null ? null : r(L.focusU, 3),
        lupa: P2(lc),
        lupaOverFocus: mag === 1,
        lupaAtRest: lift === 0,
        ball: r(ball, 3),
        statuses: {A: L.res.routes[0].status, B: L.res.routes[1].status},
        stateTag: ctx.show('key') && u >= W.tag[1] ? L.tagText : null,
        text: {contentPx: r(L.cs / L.U, 2), keyPx: r(L.ks / L.U, 2), captionPx: r(L.gs / L.U, 2), captionMisses: (L.spreadMisses || 0) + (L.gatheredMisses || 0)},
        captionedLinks: {spread: L.caps.filter(Boolean).length, gathered: L.gcaps.filter(Boolean).length, links: L.rels.length},
        captionedKinds: [...new Set(L.rels.filter((rl, i) => L.caps[i]).map(rl => rl.kind))],
        leadersCross: Boolean(L.spreadCrossing || L.gatheredCrossing || L.lensAltCrossing),
        leaderOverLink: Boolean(L.spreadLeaderOverLink || L.gatheredLeaderOverLink || L.lensAltLeaderOverLink),
        // captions that the magnifier's pass would cover, and how many of them could not be moved aside (hidden)
        // captions drawn above the magnifier (no clear seat off its path) — they are never covered
        captionsOnTop: L.caps.filter(c => c && c.top).length + (L.capTop.junction ? 1 : 0) + (L.capTop.point ? 1 : 0),
        // at most one copy of each link's caption on screen at any time (no duplicate while anything moves)
        captionCopies: Math.max(0, ...capVis.map(v => (v.l > 0.02 ? 1 : 0) + (v.g > 0.02 ? 1 : 0))),
        leadersClose: Boolean(L.spreadLeadersClose || L.gatheredLeadersClose),
        gatherMove: r(Math.min(...IDS.filter(id => id !== 'junction').map(id => Math.hypot(L.pull[id].x, L.pull[id].y) * L.eg)) / L.U, 1),
        gatherMoves: Object.fromEntries(IDS.filter(id => id !== 'junction').map(id => [id, r(Math.hypot(L.pull[id].x, L.pull[id].y) * L.eg / L.U, 1)])),
        tracerOnText: vis > 0 && tracerOnText(L, tp),
        magnifierPx: r(2 * L.magR / L.U, 1),
        lensOverCaption: lensOverCaption(L, lift, capVis, off, ctx.show('all')),
        tracerOnCaption: tracerOnCaption(L, tp, trVis, capVis, off, ctx.show('all')),
        lensOverText: L.pass && lift > 0.001 ? lensOverText(L, lift) : false,
        valvePx: r(2 * L.valve.Lv / L.U, 1),
        notes: {issues: L.N.issueBox && ctx.show('all') ? 1 : 0, key: ctx.show('key'), footHasAssumptions: p.assumptions.every(x => L.N.footText.includes(x))},
        partsApartAtStart: Object.values(L.pullLen).some(v => v > 40),
        partsTouch: partsTouch(L, off),
      },
    };
  },
};

/** Point the magnifier holds over for a focus element (exploded layout). */
function focusPoint(L, id) {
  const f = focusRaw(L, id);
  const Rg = L.magHold ?? L.magR;
  const Rt = Rg * (1 + 7 / L.lupR) + 6; // glass + rim + margin
  if (id === 'portA' || id === 'portB') {
    // over an inlet the glass holds on the bell, clear of the plate and fact card it hangs from
    const P = L.parts[id];
    const box = unionB(P.obst.slice(0, 2));
    const d = Math.hypot(Math.max(box.x - f.x, 0, f.x - box.x - box.w), Math.max(box.y - f.y, 0, f.y - box.y - box.h));
    if (d < Rt) { f.x += P.out.nx * (Rt - d); f.y += P.out.ny * (Rt - d); }
  }
  // the enlarged glass stays above the notes (issue / assumptions)
  return {x: f.x, y: Math.min(f.y, L.N.top - Rt)};
}

/** Glass radius at the hold: the full enlargement over the valve / tray / rule; over an inlet, only as large as
 * the room between its bell and the fact card allows (no smaller than the resting glass). */
function holdRadius(L, id) {
  if (id !== 'portA' && id !== 'portB') return L.magR;
  const f = focusRaw(L, id);
  const box = unionB(L.parts[id].obst.slice(0, 2));
  const d = Math.hypot(Math.max(box.x - f.x, 0, f.x - box.x - box.w), Math.max(box.y - f.y, 0, f.y - box.y - box.h));
  return clamp((d - 6) / (1 + 7 / L.lupR), L.lupR, L.magR);
}
function focusRaw(L, id) {
  if (id === 'junction') return L.valve.ports.center;
  if (id === 'point') {
    const t = L.parts.point.tray;
    return {x: t.box.x + t.box.w * 0.5, y: t.box.y + t.box.h * 0.4};
  }
  if (id === 'rule') return center(L.parts.rule.art);
  const P = L.parts[id];
  return {x: P.out.x - P.out.nx * (L.tw * 1.35 + 30), y: P.out.y - P.out.ny * (L.tw * 1.35 + 30)};
}

/** Is the tracer over printed text (a card, plate or the rule plaque)? */
function tracerOnText(L, q) {
  const boxes = [L.parts.portA.body, L.parts.portB.body, L.parts.rule.art];
  return boxes.some(b => q.x > b.x + 4 && q.x < b.x + b.w - 4 && q.y > b.y + 4 && q.y < b.y + b.h - 4);
}

/** Whether any drawn piece (plate, card, bell, stub, valve, caption, tray, magnifier) of one part touches another part's. */
function partsTouch(L, off) {
  const bs = IDS.map(id => (L.parts[id].obst || [L.parts[id].full]).map(b => shiftBox(b, off[id])));
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (bs[i].some(a => bs[j].some(b => hit(a, b, 0)))) return true;
  return false;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-06-mechanism',
    title: 'Alternative conditions — exploded view of two inlets, a shuttle valve and one point of analysis',
    titleEs: 'Condiciones alternativas — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones alternativas',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded diagram: rule plaque, two inlet stations (condition plate, fact card with supplied status, brass bell and tube stub), a shuttle-valve junction and the receiving tray with its magnifier separate; only the supplied relationships are drawn, anchored to their parts (relations without arrowheads, sequences with arrowheads, causal only when supplied); a tracer follows the traversal order while the magnifier shows a real enlarged copy of the focus part and the arriving route pushes the valve ball against the far seat; the parts gather with every state visible. No conclusion is drawn.',
    tags: ['reasoning', 'alternative conditions', 'mechanism', 'shuttle valve', 'either route', 'relations', 'tracer', 'magnifier', 'exploded view'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-alternativas.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
