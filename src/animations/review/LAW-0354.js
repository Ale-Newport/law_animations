/**
 * LAW-0354 — Efectos durante revisión · mechanism
 *
 * Storyboard (a plan of the mechanism on a light plate; nothing is a flowchart row: two source cards stand together —
 * the decision card (●) and the appeal card (◆) — and from a port on each card's outer edge a lane springs out and
 * curves AWAY from the other, so the two lanes run apart and never meet; the process lane ends in a ● bay, the review
 * lane in a ◆ bay; a slatted filter gate stands across the process lane's straight run with the datum tag hanging into
 * the free space between the lanes; a calendar is a fixture between the cards' ports):
 *  0.00–0.15  the components at rest; the lanes are faint outlines, the gate's slats half-turned (unset), the tag
 *             readable.
 *  0.15–0.42  the lanes draw on from their ports; a ● marker leaves the decision card and a ◆ marker leaves the appeal
 *             card and both advance at the same pace, each along its own lane (sequence as configured).
 *  0.38–0.73  focus (from 0.38): the gate enlarges and its slats turn to the SUPPLIED datum (edge-on: maintained; closed with a
 *             neutral pause glyph: suspended) BEFORE the ● marker arrives; the ● marker then passes and the chevrons
 *             past the gate light up, or it stops before the gate; the ◆ marker reaches the review bay.
 *  0.73–1.00  the focus relaxes; states stay visible; notes, the supplied state and the key "as supplied · no
 *             conclusion drawn". No doctrine on suspension, no dates, no time limits.
 * @module animations/review/LAW-0354
 */
import {defineAnimation} from '../../core/define.js';
import {fitDesign} from '../../core/layout.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {cubicPolyline, polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  edFields, ED_EN, ED_ES, localisedEd, cardModel, cardNode, tagModel, tagNode, gateArt, gateFrame, calendarNode,
  panelLayout, panelNode, ringRect, noteColors, overlaps, markGlyph, laneColor, R2, INK, SLATE, LANE_BED, CHEV_DIM, SIDE,
} from './kits/efectos-durante-revision.js';

const ID = 'LAW-0354';
const DURATION = 8000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {draw: [0.15, 0.3], travel: [0.24, 0.7], focus: [0.38, 0.46], set: [0.4, 0.48], lit: [0.48, 0.7], relax: [0.74, 0.8], notes: [0.78, 0.83], state: [0.79, 0.84]};
const TARGETS = ['cards', 'arrows', 'filter', 'calendar'];
const SIZES = [25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const FOCUS = 1.32, RELAX = 1.12;

const STRINGS = {
  en: {
    maintained: 'Both markers advanced in their own lanes; the ● marker passed the open filter (supplied datum)',
    suspended: 'Both markers advanced in their own lanes; the ● marker stopped at the closed filter (supplied datum)',
  },
  es: {
    maintained: 'Los dos marcadores avanzaron por su carril; el marcador ● pasó el filtro abierto (dato aportado)',
    suspended: 'Los dos marcadores avanzaron por su carril; el marcador ● se detuvo ante el filtro cerrado (dato aportado)',
  },
};

const OWN_EN = {
  actorLabels: {a: 'Decision card: source of the ● marker', b: 'Appeal card: source of the ◆ marker'},
  objectLabels: {arrows: 'Chevrons: direction of travel along each lane (sequence as configured, illustrative)', calendar: 'Calendar (a fixture; no date marked)'},
  annotations: [{target: 'filter', text: 'Only the gate depends on the supplied datum; the review lane has no gate'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Resolución: origen del marcador ●', b: 'Recurso: origen del marcador ◆'},
  objectLabels: {arrows: 'Chevrones: sentido de avance en cada carril (secuencia configurada, ilustrativa)', calendar: 'Calendario (accesorio; sin fechas marcadas)'},
  annotations: [{target: 'filter', text: 'Solo el filtro depende del dato aportado; el carril del recurso no tiene filtro'}],
  stateCaption: '',
};
const EN = {...ED_EN, ...OWN_EN};
const ES = {...ED_ES, ...OWN_ES};

const sceneSchema = {
  ...edFields,
  actorLabels: obj('Captions of the two source cards (legend)', {
    a: str('Caption of the decision card (source of the ● marker)', 70),
    b: str('Caption of the appeal card (source of the ◆ marker)', 70),
  }, ['a', 'b']),
  objectLabels: obj('Captions of the mechanism\'s objects in the legend', {
    arrows: str('Caption for the chevrons (direction of travel only)', 100),
    calendar: str('Caption for the calendar (a fixture only)', 70),
  }, ['arrows', 'calendar']),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 100),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The supplied datum (no conclusion is inferred): maintained — the gate turns open and the ● marker passes; suspended — the gate closes and the ● marker stops before it', ['maintained', 'suspended']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 120),
};

const defaultParams = {...EN, finalState: 'maintained'};

/** Distance from a point to a polyline's points (dense sampling). */
function polyDist(q, pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L2 = dx * dx + dy * dy || 1;
    const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / L2);
    best = Math.min(best, Math.hypot(q.x - (a.x + dx * t), q.y - (a.y + dy * t)));
  }
  return best;
}
const boxClear = (b, pts, m) => [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5], [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5]].every(([fx, fy]) => polyDist({x: b.x + b.w * fx, y: b.y + b.h * fy}, pts) > m)
  && !pts.some(p => p.x > b.x - m && p.x < b.x + b.w + m && p.y > b.y - m && p.y < b.y + b.h + m);

/** Plan of the mechanism inside a box (local u along the lanes, v across; mapped to world for 'h' or 'v'). */
function planMech(P, M, TM, box, F, H) {
  const U = H ? box.w : box.h, V = H ? box.h : box.w;
  const map = (u, v) => (H ? {x: box.x + u, y: box.y + v} : {x: box.x + v, y: box.y + u});
  const mapBox = (u, v, eu, ev) => (H ? {x: box.x + u, y: box.y + v, w: eu, h: ev} : {x: box.x + v, y: box.y + u, w: ev, h: eu});
  const cu = H ? M.w : M.h, cv = H ? M.h : M.w; // card extents along u / v
  const laneW = Math.max(F * 2, 32);
  const bay = laneW * 1.75;
  const gapC = Math.max(F * 1.2, 20);
  const vMid = V / 2;
  const vD = vMid - gapC / 2 - cv, vA = vMid + gapC / 2;
  const vTop = bay / 2 + F * 0.3, vBot = V - bay / 2 - F * 0.3;
  const uPort = cu;
  const u1 = uPort + Math.max(F * 5.5, (U - cu) * 0.24);
  const uEnd = U - bay / 2 - F * 0.2;
  const curve = (vPort, vLane) => {
    const p0 = {u: uPort, v: vPort}, p3 = {u: u1, v: vLane};
    const c1 = {u: uPort + (u1 - uPort) * 0.55, v: vPort}, c2 = {u: uPort + (u1 - uPort) * 0.45, v: vLane};
    const pts = cubicPolyline(map(p0.u, p0.v), map(c1.u, c1.v), map(c2.u, c2.v), map(p3.u, p3.v), 40).pts;
    const n = 24;
    for (let i = 1; i <= n; i++) pts.push(map(u1 + ((uEnd - u1) * i) / n, vLane));
    return polyline(pts);
  };
  const lanes = [curve(vD + cv / 2, vTop), curve(vA + cv / 2, vBot)];
  const uGate = u1 + (uEnd - u1) * 0.42;
  const gThk = Math.max(F * 2, 30), gSpan = laneW + F * 1.4;
  const gate = {...map(uGate, vTop), rot: H ? 0 : 90};
  const sGate = lanes[0].total ? (lanes[0].total - (uEnd - uGate)) / lanes[0].total : 0.5;
  const tokR = laneW * 0.42;
  const sStop = sGate - (gThk * FOCUS * 0.5 + tokR + F * 0.5) / lanes[0].total;
  const sStart = (tokR + 4) / Math.max(1, lanes[0].total);
  // tag: hanging into the free space between the lanes, just past the gate
  const tu = H ? TM.w : TM.h, tv = H ? TM.h : TM.w;
  const tag = mapBox(clamp(uGate - tu * 0.25, u1, uEnd - tu), vTop + gSpan * FOCUS / 2 + F * 0.8, tu, tv);
  // calendar: the first free spot (right middle, beside the cards' ports, mid-run) clear of both lanes and the tag
  const cal = (() => {
    const cw = F * 3.4, ch = cw * 0.86;
    const eu = H ? cw : ch, ev = H ? ch : cw;
    const cands = [
      mapBox(uEnd - eu - F * 0.4, vMid - ev / 2 + (H ? F * 0.6 : 0), eu, ev),
      mapBox(cu + F * 1.4, vMid - ev / 2, eu, ev),
      mapBox(u1 + F, vMid - ev / 2, eu, ev),
      mapBox((u1 + uEnd) / 2, vBot - laneW - ev - F * 0.6, eu, ev),
    ];
    const clear = b => !overlaps(b, tag, F * 0.4) && boxClear(b, lanes[0].pts, laneW / 2 + 6) && boxClear(b, lanes[1].pts, laneW / 2 + 6)
      && !overlaps(b, mapBox(0, vD, cu, cv), 6) && !overlaps(b, mapBox(0, vA, cu, cv), 6);
    return cands.find(clear) || cands[0];
  })();
  const cards = [mapBox(0, vD, cu, cv), mapBox(0, vA, cu, cv)];
  const bays = [map(uEnd, vTop), map(uEnd, vBot)];
  const problems = [];
  if (vD < vTop + laneW * 0.5 - 1e-6 || vA + cv > vBot - laneW * 0.5 + 1e-6) problems.push('cards-height');
  if (u1 >= uEnd - (uEnd - u1) * 0.1 || uEnd - u1 < F * 12) problems.push('lanes-length');
  const tagBot = H ? tag.y + tag.h : tag.x + tag.w;
  if ((H ? tag.y + tag.h : tag.x + tag.w) > (H ? box.y + vBot - laneW : box.x + vBot - laneW)) problems.push('tag-room');
  void tagBot;
  if (!boxClear(tag, lanes[1].pts, laneW / 2 + 6) || !boxClear(cal, lanes[0].pts, laneW / 2 + 6) || !boxClear(cal, lanes[1].pts, laneW / 2 + 6)) problems.push('lane-clash');
  if (overlaps(tag, cal, F * 0.4)) problems.push('tag-calendar');
  // chevrons along each lane (world points + angle); the process lane's past-gate chevrons are the lit ones
  const step = Math.max(F * 2.3, 34);
  const chev = lanes.map((L, i) => {
    const out = [];
    for (let d = tokR * 2 + step * 0.5; d < L.total - bay * 0.6; d += step) {
      const s = d / L.total;
      if (i === 0 && Math.abs(s - sGate) * L.total < gThk * FOCUS * 0.5 + step * 0.4) continue;
      out.push({...L.at(s), s});
    }
    return out;
  });
  return {laneW, bay, lanes, gate, gThk, gSpan, sGate, sStop, sStart, tokR, tag, cal, cards, bays, chev, problems, H};
}

function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const H = opts.orient === 'h';
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'filter', text: P.labels.filter, name: 'lg-filter'});
  if (showKey) rows.push({kind: 'item', icon: 'laneA', text: P.routes.process, name: 'lg-process'});
  if (showKey) rows.push({kind: 'item', icon: 'laneB', text: P.routes.review, name: 'lg-review'});
  if (showAll) rows.push({kind: 'item', icon: 'cardA', text: P.actorLabels.a, name: 'lg-carda'});
  if (showAll) rows.push({kind: 'item', icon: 'cardB', text: P.actorLabels.b, name: 'lg-cardb'});
  if (showAll) rows.push({kind: 'item', icon: 'kind-sequence', text: P.objectLabels.arrows, name: 'lg-arrows'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gap = F * 1.2;
  let plate, panel = null, PL = null;
  if (!rows.length) plate = {x: 0, y: 0, w: DW, h: DH};
  else if (opts.band) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols || 1, tight: opts.tight});
    plate = {x: 0, y: 0, w: DW, h: DH - PL.h - gap};
    panel = {x: 4, y: DH - PL.h};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F});
    plate = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  const m = Math.max(F * 0.9, 16);
  const box = {x: plate.x + m, y: plate.y + m, w: plate.w - m * 2, h: plate.h - m * 2};
  const TM = tagModel(P, {w: F * (H ? 14 : 12.5), F, maxLines: H ? 5 : 6});
  // the widest card that keeps the cards' column within the plate (scan; the plan reports what does not fit)
  const lo = F * 8.6, hi = Math.max(lo, Math.min(F * 15, H ? box.w * 0.3 : box.w * 0.46));
  let best = null;
  for (let k = 0; k <= 6; k++) {
    const cw = hi - ((hi - lo) * k) / 6;
    const M = cardModel(P, {w: cw, F, showText: showKey});
    const G = planMech(P, M, TM, box, F, H);
    const q = {M, G, bad: G.problems.length + (M.ok ? 0 : 1)};
    if (!best || q.bad < best.bad) best = q;
    if (!q.bad) break;
  }
  const {M, G} = best;
  const problems = [...G.problems, !M.ok && 'card-text', !TM.ok && 'tag-text', PL && !PL.ok && 'panel-text'].filter(Boolean);
  const usedH = PL ? Math.max(plate.y + plate.h, panel.y + PL.h) : plate.y + plate.h;
  const dy = Math.max(0, (DH - usedH) / 2);
  return {F, H, plate, box, panel, PL, M, TM, G, dy, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 820], portrait: [950, 1420]},
  layout(ctx) {
    const P = localisedEd(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const arrangements = shape === 'portrait' ? [{band: true, orient: 'v'}, {band: true, cols: 2, orient: 'v'}]
      : shape === 'square' ? [{band: true, cols: 2, orient: 'h'}, {band: true, cols: 2, orient: 'h', tight: true}, {band: true, cols: 3, orient: 'h', tight: true}, {pw: 0.4, orient: 'v'}]
        : [{pw: 0.27, orient: 'h'}, {pw: 0.31, orient: 'h'}, {pw: 0.35, orient: 'h'}];
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const sizes = (!showKey ? [38, 34, 30, 27, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements) {
        const c = compose(ctx, P, F, a);
        if (c.ok) { C = c; break outer; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    const notes = noteColors(ctx.theme);
    const {G} = C;
    const pad = 12;
    const grow = b => ({x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2});
    const tgt = name => {
      if (name === 'calendar') return [grow(G.cal)];
      if (name === 'filter') {
        const s = G.gSpan * RELAX / 2 + pad, t = G.gThk * RELAX / 2 + pad;
        return [G.H ? {x: G.gate.x - t, y: G.gate.y - s - pad, w: t * 2, h: s * 2 + pad} : {x: G.gate.x - s, y: G.gate.y - t, w: s * 2, h: t * 2}];
      }
      if (name === 'arrows') {
        const c = G.chev[0].filter(q => q.s > G.sGate);
        if (!c.length) return [];
        const xs = c.map(q => q.x), ys = c.map(q => q.y), s = G.laneW * 0.6;
        return [{x: Math.min(...xs) - s, y: Math.min(...ys) - s, w: Math.max(...xs) - Math.min(...xs) + s * 2, h: Math.max(...ys) - Math.min(...ys) + s * 2}];
      }
      return G.cards.map(grow);
    };
    const rings = ctx.show('all') ? P.annotations.flatMap((a, i) => tgt(a.target).map(b => ringRect(b, notes[i % 2], 4))) : [];
    return {P, C, rings, pxu};
  },
  build(ctx, L) {
    const {C, P} = L;
    const {G, M, TM} = C;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const st = P.finalState === 'maintained' ? 0 : 1;
    const lane = i => {
      const col = laneColor(th, i);
      const d = G.lanes[i].d();
      const len = r(G.lanes[i].total);
      return g({name: `lane${i}`},
        h('path', {d, fill: 'none', stroke: INK, 'stroke-width': r(G.laneW + 5), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.18}),
        h('path', {name: `lane${i}-o`, d, fill: 'none', stroke: INK, 'stroke-width': r(G.laneW + 5), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len}),
        h('path', {name: `lane${i}-b`, d, fill: 'none', stroke: LANE_BED, 'stroke-width': r(G.laneW), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len}),
        h('path', {name: `lane${i}-c`, d, fill: 'none', stroke: col, 'stroke-width': r(Math.max(3, G.laneW * 0.12)), 'stroke-linecap': 'round', 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len}),
      );
    };
    const cs = G.laneW * 0.26;
    const chevPath = q => `M${r(-cs * 0.5)} ${r(-cs)}L${r(cs * 0.5)} 0L${r(-cs * 0.5)} ${r(cs)}`;
    const chevs = i => G.chev[i].map((q, k) => {
      const lit = i === 0 && q.s > G.sGate;
      return g({transform: T(q.x, q.y, (q.a * 180) / Math.PI)},
        h('path', {name: `chev${i}-${k}`, d: chevPath(q), fill: 'none', stroke: CHEV_DIM, 'stroke-width': Math.max(3.5, C.F * 0.24), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        lit ? h('path', {name: `lit${k}`, d: chevPath(q), fill: 'none', stroke: laneColor(th, 0), 'stroke-width': Math.max(4.5, C.F * 0.3), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}) : null);
    });
    const bay = i => {
      const b = G.bays[i], s = G.bay;
      return g({name: `bay${i}`},
        h('path', {d: roundRectPath(b.x - s / 2, b.y - s / 2, s, s, s * 0.22), fill: th.card, stroke: SLATE, 'stroke-width': 3}),
        g({transform: T(b.x, b.y)}, markGlyph(SIDE[i], s * 0.16, {fill: laneColor(th, i), stroke: th.card, sw: 1.5})));
    };
    const token = i => g({name: `tok${i}`, transform: T(G.lanes[i].pts[0].x, G.lanes[i].pts[0].y)},
      h('circle', {r: r(G.tokR + 3), fill: th.shadow, cx: 3, cy: 4}),
      h('circle', {r: r(G.tokR), fill: laneColor(th, i), stroke: INK, 'stroke-width': 2.6}),
      markGlyph(SIDE[i], G.tokR * 0.42, {fill: '#fff', stroke: laneColor(th, i), sw: 1.4}));
    const leader = (() => {
      const t = G.tag;
      const a = G.H ? {x: clamp(G.gate.x, t.x + 12, t.x + t.w - 12), y: t.y} : {x: t.x, y: clamp(G.gate.y, t.y + 12, t.y + t.h - 12)};
      const b = G.H ? {x: a.x, y: G.gate.y + G.gSpan * FOCUS / 2 - 4} : {x: G.gate.x + G.gSpan * FOCUS / 2 - 4, y: a.y};
      return h('path', {d: `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`, stroke: SLATE, 'stroke-width': 3, 'stroke-linecap': 'round'});
    })();
    return g({name: 'scene', transform: C.dy ? T(0, C.dy) : undefined},
      g({name: 'plate'},
        h('path', {d: roundRectPath(C.plate.x + 5, C.plate.y + 7, C.plate.w, C.plate.h, 24), fill: th.shadow}),
        h('path', {d: roundRectPath(C.plate.x, C.plate.y, C.plate.w, C.plate.h, 24), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
        h('path', {d: roundRectPath(C.plate.x + 10, C.plate.y + 10, C.plate.w - 20, C.plate.h - 20, 18), fill: 'none', stroke: th.paperLine || '#d9d2c3', 'stroke-width': 1.5})),
      lane(0), lane(1), chevs(0), chevs(1), bay(0), bay(1),
      g({transform: T(G.cal.x, G.cal.y)}, calendarNode(ctx, {prefix: 'cal', w: G.cal.w, h: G.cal.h})),
      g({name: 'tagg'}, leader, g({transform: T(G.tag.x, G.tag.y)}, tagNode(ctx, TM, {prefix: 'tag', showText: showKey, ops: [st === 0 ? 1 : 0, st === 1 ? 1 : 0]}))),
      g({name: 'cardD', transform: T(G.cards[0].x, G.cards[0].y)}, cardNode(ctx, M, 0, {prefix: 'cardD-art'})),
      g({name: 'cardA', transform: T(G.cards[1].x, G.cards[1].y)}, cardNode(ctx, M, 1, {prefix: 'cardA-art'})),
      token(1), token(0),
      g({name: 'gatef', transform: T(G.gate.x, G.gate.y, G.gate.rot)}, gateArt(ctx, {prefix: 'gate', thk: G.gThk, sp: G.gSpan, F: C.F, pauseSide: G.H ? -1 : 1})),
      g({name: 'rings', opacity: 0}, L.rings),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, C} = L;
    const {G} = C;
    const nodes = {};
    const maintained = P.finalState === 'maintained';
    const e = ease.inOutCubic;
    const kDraw = e(seg(u, ...W.draw));
    for (const i of [0, 1]) {
      const len = G.lanes[i].total;
      for (const part of ['o', 'b', 'c']) nodes[`lane${i}-${part}`] = {'stroke-dashoffset': r(len * (1 - kDraw), 1)};
      G.chev[i].forEach((q, k) => { nodes[`chev${i}-${k}`] = {opacity: r(clamp((kDraw - q.s) * 8), 3)}; });
    }
    // markers: the same pace on both lanes (arc-length per unit time); the ● marker stops before a closed gate
    const kT = seg(u, ...W.travel);
    const total0 = G.lanes[0].total, total1 = G.lanes[1].total;
    const span = Math.max(total0, total1);
    const dist = kT * span;
    const s0max = maintained ? 1 : G.sStop; // (the marker docks in its bay)
    const s1max = 1;
    const sP = Math.min(s0max, G.sStart + dist / total0);
    const sR = Math.min(s1max, G.sStart * total0 / total1 + dist / total1);
    const pP = G.lanes[0].at(sP), pR = G.lanes[1].at(sR);
    nodes.tok0 = {transform: T(pP.x, pP.y)};
    nodes.tok1 = {transform: T(pR.x, pR.y)};
    // focus: the gate grows, its slats turn to the supplied datum before the marker arrives, then it relaxes
    const kF = e(seg(u, ...W.focus)), kRx = e(seg(u, ...W.relax));
    const sc = lerp(lerp(1, FOCUS, kF), RELAX, kRx);
    nodes.gatef = {transform: `${T(G.gate.x, G.gate.y, G.gate.rot, sc)}`};
    const kSet = e(seg(u, ...W.set));
    const closed = lerp(0.5, maintained ? 0 : 1, kSet);
    Object.assign(nodes, gateFrame('gate', closed, maintained ? 0 : kSet));
    const kLit = maintained ? seg(u, ...W.lit) : 0;
    const lit = G.chev[0].map((q, k) => ({q, k})).filter(o => o.q.s > G.sGate);
    lit.forEach(({q, k}) => { nodes[`lit${k}`] = {opacity: r(clamp((sP - q.s) * 30) * (kLit > 0 ? 1 : 0), 3)}; });
    const noteK = seg(u, ...W.notes), stateK = seg(u, ...W.state);
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const row of C.PL.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const passed = sP > G.sGate;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const minGap = (() => {
      let m = Infinity;
      for (let k = 0; k <= 40; k++) { const q = G.lanes[0].at(k / 40); m = Math.min(m, polyDist(q, G.lanes[1].pts)); }
      return m;
    })();
    return {
      nodes,
      semantic: {
        beat,
        tokP: R2(pP), tokR: R2(pR), sP: r(sP, 4), sR: r(sR, 4), sGate: r(G.sGate, 4), sStop: r(G.sStop, 4),
        draw: r(kDraw, 3), focus: r(sc, 3), set: r(kSet, 3), closed: r(closed, 3), lit: r(kLit, 3), passed,
        samePace: Math.abs((sP - G.sStart) * total0 - (sR * total1 - G.sStart * total0)) < 1 || sP >= s0max - 1e-9 || sR >= s1max - 1e-9,
        laneGap: r(minGap - G.laneW, 1),
        finalState: P.finalState, problems: C.problems, textPx: r(C.F * L.pxu, 1), orient: C.H ? 'h' : 'v',
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
    slug: 'review-09-mechanism',
    title: 'Effects during review — from the decision card and the appeal card two lanes spring apart; markers advance on both at one pace and a filter set by the supplied datum lets the process marker pass or stops it',
    titleEs: 'Efectos durante revisión — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Efectos durante revisión',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A plan of the mechanism: the decision card (●) and the appeal card (◆) stand together; from a port on each card\'s outer edge a lane springs out and curves away from the other, so the process lane and the review lane run apart and never meet, each ending in its own bay. A slatted filter gate stands across the process lane with the datum tag hanging between the lanes. The lanes draw on and a marker advances along each at the same pace; the gate enlarges and turns to the supplied datum before the ● marker arrives, which then passes (effect maintained) or stops (effect suspended according to the data supplied). Chevrons only show direction (sequence as configured). A calendar is a fixture. No suspension doctrine, dates or time limits; jurisdiction unspecified.',
    tags: ['review', 'effects during review', 'mechanism', 'parallel lanes', 'appeal', 'decision', 'filter gate', 'supplied datum', 'markers', 'chevrons', 'calendar'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/efectos-durante-revision.js', 'src/animations/review/kits/confirmacion-ilustrativa.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
