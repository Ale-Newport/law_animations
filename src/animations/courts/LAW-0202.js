/**
 * LAW-0202 — Distribución de una sala · mechanism
 *
 * Storyboard (a decomposed map of the placement, not a row of boxes: the
 * generic building front on one side, the room plan it contains in the middle
 * with its entrance and one seat as separate parts, the participant standing
 * outside the entrance, and the sheet of editable seat labels on the other
 * side):
 *  0.00–0.18  separate: the six components (building, room plan, entrance,
 *             participant, seat, label sheet) slide apart from one cluster to
 *             their places; the sheet shows its rows face down.
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one,
 *             anchored to the element edges and styled by kind (relation =
 *             plain line with end dots, never an arrow; sequence = arrow;
 *             communication = dashed arrow; causal only when supplied); each
 *             carries its own label beside it. The other supplied routes of the
 *             room are drawn faintly inside the plan.
 *  0.43–0.75  trace: a tracer follows the supplied traversalOrder along the
 *             connectors; the focus element enlarges while it passes; the
 *             participant walks through the entrance to the seat and sits as
 *             the tracer reaches the seat; when the tracer reaches the sheet,
 *             its rows turn face up (the editable labels are revealed) and the
 *             row of the traced seat is outlined.
 *  0.75–1.00  gather: origin (the participant's start pad), transformation (the
 *             drawn route) and state (the seated person, the revealed labels)
 *             stay visible with a legend of connector kinds and the key
 *             "as supplied · no conclusion drawn".
 * No position is given a legal meaning; no procedure or outcome is shown.
 * @module animations/courts/LAW-0202
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {LINK_STYLES} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {planPerson, routeTrail, buildingElevation, planChair, planColors} from './kits/courts-art.js';
import {
  salaFields, SALA_EN, resolveSala, roomGeometry, fitRoom, furnitureBoxes, placeFree, walkerAt, doorOpen, roomArt, gchip, glue, fitWords, pxPerUnit,
  overlaps, R2, PERSON_RAD, WALL, roundCorners, sideCaption,
} from './kits/distribucion-de-sala.js';

const ID = 'LAW-0202';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {slide: [0.02, 0.15], relate: [0.2, 0.42], trace: [0.45, 0.72], legend: [0.75, 0.81]};
const EL = ['building', 'room', 'entrance', 'participant', 'seat', 'label'];

const STRINGS = {
  en: {kinds: 'Connections', start: 'start'},
  es: {kinds: 'Conexiones', start: 'inicio'},
};

const relationship = obj('A supplied relationship between two components', {
  from: oneOf('Source component', EL),
  to: oneOf('Target component', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the connector (as supplied; empty = the caption of its kind)', 50),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  ...salaFields,
  elements: list('Component captions; ids are fixed by the scene, captions are editable', obj('Component', {
    id: oneOf('Component id', EL),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 6, 6),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied)', relationship, 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', EL),
  relationLabels: obj('Caption used for each relation kind (legend, and connectors without their own label)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', EL), 2, 8),
};

const defaultParams = {
  ...SALA_EN,
  elements: [
    {id: 'building', label: 'Building'},
    {id: 'room', label: 'Room plan'},
    {id: 'entrance', label: 'Entrance'},
    {id: 'participant', label: 'Participant'},
    {id: 'seat', label: 'Seat'},
    {id: 'label', label: 'Editable seat labels'},
  ],
  relationships: [
    {from: 'building', to: 'room', kind: 'relation', label: 'contains'},
    {from: 'participant', to: 'entrance', kind: 'sequence', label: 'enters through'},
    {from: 'entrance', to: 'seat', kind: 'sequence', label: 'walks to'},
    {from: 'seat', to: 'label', kind: 'relation', label: 'is labelled'},
  ],
  focusElement: 'seat',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['building', 'room', 'entrance', 'seat', 'label'],
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const {seats, routes} = resolveSala(ctx, p);
    const cap = id => (p.elements.find(e => e.id === id) || {label: id}).label;
    const route = routes[0];
    let best = null;
    const log = [];
    const combos = shape === 'landscape' ? [[0.26, 0.8], [0.3, 0.8], [0.26, 0.8, 150], [0.3, 0.8, 150], [0.24, 0.8, 190], [0.22, 0.8, 210], [0.34, 0.8, 120], [0.22, 0.8], [0.28, 0.8, 180]] : shape === 'square' ? [[0.34, 0.76], [0.4, 0.76], [0.46, 0.76], [0.34, 0.76, 0.22], [0.4, 0.76, 0.22], [0.34, 0.7, 0.22], [0.34, 0.66, 0.22], [0.46, 0.76, 0.22], [0.4, 0.66], [0.46, 0.66], [0.46, 0.66, 0.22], [0.5, 0.46, 0.22, 0, 1], [0.5, 0.44, 0.22, 0, 1], [0.54, 0.46, 0.2, 0, 1], [0.46, 0.46, 0.22, 0, 1], [0.34, 0.66, 0.22, 150], [0.3, 0.66, 0.22, 170], [0.34, 0.62, 0.22, 150], [0.34, 0.76, 0.22, 150], [0.34, 0.76, 0.3, 150], [0.3, 0.76, 0.22, 170], [0.34, 0.7, 0.22, 190], [0.38, 0.76, 0.22, 130], [0.3, 0.66, 0.18, 170], [0.34, 0.66, 0.18, 150], [0.4, 0.66, 0.2, 110], [0.4, 0.7, 0.2, 120], [0.38, 0.66, 0.2, 130]] : [[0.34, 0], [0.4, 0], [0.46, 0]];
    const sizes = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6];
    // pass 1: the large room at any size down to the baseline floor; pass 2: every combination
    const passes = [sizes.filter(v => v >= 19.8).flatMap(v => combos.filter(c => c[1] !== 0.66).map(c => [v, c])), sizes.flatMap(v => combos.map(c => [v, c]))];
    // cheap failures (sheet overflow, truncated captions, people too small) are rejected before the
    // expensive connector search; at most BUDGET full compositions are built (a count, so the result is
    // deterministic), then the best one found is kept
    const BUDGET = 70;
    let full = 0;
    const tried = new Set();
    search:
    for (const pass of passes) {
      for (const [v, [colF, roomH, bldH, gut, band]] of pass) {
        const key = `${v}/${colF}/${roomH}/${bldH}/${gut}/${band}`;
        if (tried.has(key)) continue;
        tried.add(key);
        const L = compose(ctx, p, v / px, px, shape, seats, routes, route, cap, showAll, showKey, colF, roomH, bldH || 0.3, gut || 60, band, true);
        log.push(`${v}/${colF}/${roomH}/${bldH || 0.3}/${gut || 60}${band ? '/band' : ''}:${L.stub ? 'quick:' : ''}${L.problems.join('+')}`);
        if (L.stub) continue;
        full++;
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length) { best = L; break search; }
        if (full >= BUDGET) break search;
      }
    }
    if (!best) best = compose(ctx, p, 16.6 / px, px, shape, seats, routes, route, cap, showAll, showKey, ...(combos[0].length ? [combos[0][0], combos[0][1], combos[0][2] || 0.3, combos[0][3] || 60, combos[0][4]] : []));
    best.log = log;
    return best;
  },
  build(ctx, L) {
    const els = L.els;
    return g(null,
      g({name: 'el-building'}, L.building.node, L.chips.building && L.chips.building.node),
      g({name: 'el-room'},
        g({transform: T(L.ox, L.oy, 0, L.k)}, L.room.node, L.trails.map(t => t.node)),
        L.chips.room && L.chips.room.node, L.sideCap && L.sideCap.node),
      g({name: 'el-entrance'}, h('path', {d: roundRectPath(L.entBox.x, L.entBox.y, L.entBox.w, L.entBox.h, 10), fill: 'none', stroke: ctx.theme.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '6 5'}), L.chips.entrance && L.chips.entrance.node),
      g({name: 'el-participant'}, L.pad, L.chips.participant && L.chips.participant.node, g({transform: T(L.ox, L.oy, 0, L.k)}, L.person.node)),
      g({name: 'el-seat'}, L.seatBody, L.chips.seat && L.chips.seat.node),
      g({name: 'el-label'}, L.sheet.node),
      L.graph.node,
      L.relNodes,
      L.tracerNode,
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    // separate: slide out of one cluster
    const slide = ease.inOutCubic(seg(u, ...W.slide));
    const cx = L.cluster.x, cy = L.cluster.y;
    const focusScale = {};
    for (const id of EL) {
      const c = L.centers[id];
      const dx = L.sepOff[id].x * (1 - slide), dy = L.sepOff[id].y * (1 - slide);
      // focus: enlarge while the tracer is near its visit
      const visit = L.visits.find(v => v.id === id && id === ctx.params.focusElement);
      const near = visit ? Math.max(0, 1 - Math.abs(u - visit.u) / 0.07) : 0;
      const s = 1 + 0.22 * ease.inOutSine(near);
      focusScale[id] = s;
      nodes[`el-${id}`] = {transform: `${T(dx, dy)} ${scaleAbout(c.x, c.y, r(s, 4))}`};
    }
    // relationships drawn one by one
    const n = L.rels.length;
    const drawn = L.rels.map((_, i) => ease.inOutSine(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 0.85) * (W.relate[1] - W.relate[0])) / n)));
    Object.assign(nodes, L.graph.frame(i => drawn[i]));
    // other supplied routes of the room, faint
    L.trails.forEach((t, i) => Object.assign(nodes, t.frame(drawn[0] > 0 ? seg(u, W.relate[0], W.relate[1]) : 0, 0.45)));
    // tracer
    const tp = seg(u, ...W.trace);
    const tracerOn = u >= W.trace[0] - 0.01 && L.poly.total > 0;
    const tq = L.poly.at(ease.inOutSine(tp));
    const sb = L.sheet.box;
    const inSheet = tq.x > sb.x - 6 && tq.x < sb.x + sb.w + 6 && tq.y > sb.y - 6 && tq.y < sb.y + sb.h + 6;
    const tracerOp = tracerOn && !inSheet ? 1 - seg(u, W.trace[1] + 0.005, W.trace[1] + 0.03) : 0;
    nodes.tracer = {transform: T(tq.x, tq.y), opacity: r(tracerOp, 3)};
    const visited = L.visits.filter(v => u >= v.u - 1e-9).map(v => v.id);
    // the participant walks through the entrance and sits as the tracer reaches the seat
    const wq = seg(u, L.walk[0], L.walk[1]);
    const st = walkerAt(L.walker, wq, {reduced: ctx.reduced, walkEnd: 0.86});
    Object.assign(nodes, L.person.pose({x: st.x, y: st.y, deg: st.deg, phase: st.phase, walk: st.walk, seated: st.seated}));
    Object.assign(nodes, L.room.doors.main.frame(doorOpen(L.G, 'main', [st])));
    if (L.room.doors.side) Object.assign(nodes, L.room.doors.side.frame(0));
    nodes[`rm-ring-${L.slot}`] = {opacity: r(1 - st.seated, 3)};
    // label sheet: rows face down until the tracer reaches the sheet
    const tLabel = L.visits.find(v => v.id === 'label');
    const revealAt = tLabel ? tLabel.u : W.trace[1];
    Object.assign(nodes, L.sheet.frame(u, revealAt));
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const dp = {x: L.ox + st.x * L.k, y: L.oy + st.y * L.k};
    return {
      nodes,
      semantic: {
        beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
        slide: r(slide, 3),
        separateStart: r(L.sepF, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracerVisible: tracerOp > 0,
        tracerParkedClear: tracerOp === 0 || !inSheet,
        tracer: R2(tq),
        visitOrder: visited,
        focusScale: r(Math.max(...Object.values(focusScale)), 3),
        person: R2(dp),
        personState: st.state,
        seatAt: R2(L.seatD),
        sheetRevealed: r(L.sheet.revealed(u, revealAt), 3),
        connectorGaps: L.gaps,
        arrows: L.rels.map(q => ({kind: q.kind, arrow: LINK_STYLES[q.kind].arrow})),
        labelsClear: L.labelsClear,
        labelOwn: L.labelOwn,
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        log: L.log,
        k: r(L.k, 3),
      },
    };
  },
};

/** One composition at text size F. */
function compose(ctx, p, F, px, shape, seats, routes, route, cap, showAll, showKey, colF, roomH, bldH, gut = 60, band = false, quick = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const problems = [];
  let crossDetail = null;
  let legendMiss = null;
  // ---- regions per shape: the label sheet sits beside the room on the side of the traced seat, the
  // building on the other side (landscape) or above (square: left column; portrait: top band)
  const slot0 = route ? route.slot : 'left1';
  const seatLeft = /left|back1|front/.test(slot0);
  let R;
  if (shape === 'landscape') {
    const sheetR = {w: D.w * colF}, bldR = {w: D.w * 0.15};
    // (landscape) bldH carries the gap between the sheet and the room; the rest goes between room and building
    const gs = bldH > 1 ? bldH : 90, gb = bldH > 1 ? 280 - Math.min(bldH, 150) : 190;
    const roomW = D.w - sheetR.w - bldR.w - gs - gb;
    const rx = seatLeft ? sheetR.w + gs : bldR.w + gb;
    R = {room: {x: rx, y: 0, w: roomW, h: D.h * 0.8}, part: D.h * 0.2,
      sheet: {x: seatLeft ? 0 : D.w - sheetR.w, y: 0, w: sheetR.w, h: D.h},
      bld: {x: seatLeft ? D.w - bldR.w : 0, y: D.h * 0.1, w: bldR.w, h: D.h * 0.62}};
  } else if (shape === 'portrait') {
    R = {bld: {x: seatLeft ? D.w * (0.46 + colF - 0.34) : 0, y: 0, w: D.w * (0.54 - colF + 0.34) - 12, h: D.h * 0.36}, sheet: {x: seatLeft ? 0 : D.w * (0.46 - colF + 0.34), y: 0, w: D.w * (0.54 + colF - 0.34), h: D.h * 0.36},
      room: {x: 0, y: D.h * 0.4, w: D.w, h: D.h * 0.47}, part: D.h * 0.13};
  } else if (band) {
    // (square, many texts) the room across the top; the sheet under the traced seat's side, the building on the other side
    const top = D.h * roomH + 16;
    R = {room: {x: 0, y: 0, w: D.w, h: D.h * roomH}, part: D.h * (1 - roomH),
      sheet: {x: seatLeft ? 0 : D.w * (1 - colF), y: top, w: D.w * colF, h: D.h - top},
      bld: {x: seatLeft ? D.w * (1 - bldH) : 0, y: top, w: D.w * bldH, h: D.h - top}};
  } else {
    const colW = D.w * colF;
    R = {room: {x: seatLeft ? colW + gut : 0, y: 0, w: D.w - colW - gut, h: D.h * roomH}, part: D.h * (1 - roomH),
      bld: {x: seatLeft ? 0 : D.w - colW, y: 0, w: colW, h: D.h * bldH}, sheet: {x: seatLeft ? 0 : D.w - colW, y: D.h * (bldH + 0.06), w: colW, h: D.h * (0.94 - bldH)}};
  }
  // ---- room plan (no corridor)
  const fr = fitRoom(R.room, {corridor: false});
  const {W: RW, H: RH, k} = fr;
  // people stay >= 60 px across at 1080p (category floor), with a small margin
  if (2 * PERSON_RAD * k * px < 62) problems.push('small');
  const G = roomGeometry(RW, RH);
  const t = WALL;
  const ox = R.room.x + (R.room.w - (RW + 2 * t) * k) / 2 + t * k;
  const oy = R.room.y + t * k;
  const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
  const slot = route ? route.slot : 'left1';
  const S = G.slots[slot];
  const room = roomArt(ctx, G, {prefix: 'rm', corridor: false, emptyRings: seats.map(s => s.slot)});
  // other routes: from the main door gate to their seats (faint, as supplied)
  const trails = routes.slice(1).map((rt, i) => {
    const pts = [G.doors[rt.door].gate, G.doors[rt.door].in, {x: G.doors[rt.door].in.x, y: rt.door === 'main' ? G.yB : G.yF}, {x: G.slots[rt.slot].x, y: rt.door === 'main' ? G.yB : G.yF}, G.slots[rt.slot]];
    return routeTrail(ctx, {name: `trail${i}`, pts: roundCorners(pts, 40), width: 5});
  });
  // ---- the participant: a start pad below the entrance (template units, outside the room)
  const gate = G.doors.main.gate;
  const padT = {x: gate.x - (shape === 'square' ? 380 : 300), y: G.H + t + 120};
  const walkPts = roundCorners([padT, {x: gate.x, y: G.H + t + 54}, gate, G.doors.main.in, {x: gate.x, y: G.yB}, {x: S.x, y: G.yB}, S], 42);
  const walker = {poly: polyline(walkPts), spot: {deg: 0}, seat: {x: S.x, y: S.y, deg: S.deg}};
  const person = planPerson(ctx, {name: 'walker', look: route ? route.look : {skin: '#c68863', hair: 'short', hairColor: '#4a3122', outfit: th.cloth[0]}});
  const padD = toD(padT);
  const rad = PERSON_RAD * k;
  const pad = g(null,
    h('rect', {x: r(padD.x - rad * 1.25), y: r(padD.y - rad * 0.95), width: r(rad * 2.5), height: r(rad * 1.9), rx: r(rad * 0.4), fill: planColors(ctx).corridor, stroke: th.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '8 6'}),
  );
  // ---- element boxes (design units)
  const seatD = toD(S);
  const seatBox = {x: seatD.x - rad * 0.9, y: seatD.y - rad * 0.9, w: rad * 1.8, h: rad * 1.8};
  const seatBody = g(null, h('rect', {x: r(seatBox.x), y: r(seatBox.y), width: r(seatBox.w), height: r(seatBox.h), rx: r(rad * 0.3), fill: 'none', stroke: th.accent2, 'stroke-width': 3.5}));
  const doorD = toD(gate);
  const entBox = {x: doorD.x - 70 * k, y: doorD.y - 34 * k, w: 140 * k, h: 68 * k};
  const partBox = {x: padD.x - rad * 1.25, y: padD.y - rad * 0.95, w: rad * 2.5, h: rad * 1.9};
  const roomBox = {x: ox - t * k, y: oy - t * k, w: (RW + 2 * t) * k, h: (RH + 2 * t) * k};
  const kinds = [...new Set(p.relationships.filter(q => q.from !== q.to).map(q => q.kind))];
  const make = (lx, ly0, lw) => {
    const parts = [];
    let y = 0;
    if (showAll) {
      for (const kd of kinds) {
        const st = LINK_STYLES[kd];
        const col = kindColor(ctx, kd);
        const fit = fitWords(glue(p.relationLabels[kd]), {maxWidth: lw - 70, size: F, minSize: F, maxLines: 2, weight: 500});
        parts.push(h('path', {d: `M${r(lx)} ${r(ly0 + y + F * 0.6)}h46`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}));
        if (st.arrow) parts.push(h('path', {d: `M${r(lx + 50)} ${r(ly0 + y + F * 0.6)}l-12 -7v14z`, fill: col}));
        parts.push(textAt(fit, lx + 62, ly0 + y, th.fg));
        y += fit.height + F * 0.45;
      }
    }
    const kf = fitWords(glue(p.labels.key), {maxWidth: lw, size: F, minSize: F, maxLines: 4, weight: 500});
    parts.push(textAt(kf, lx, ly0 + y + F * 0.3, th.fgSoft, true));
    y += kf.height + F * 0.3;
    return {parts, box: {x: lx, y: ly0, w: lw, h: y}};
  };
  if (shape === 'portrait' && showKey) {
    const lh = make(0, 0, R.bld.w).box.h + F * 0.9;
    R.bld = {...R.bld, y: R.bld.y + lh, h: R.bld.h - lh};
    R.legendTop = {lx: R.bld.x, lw: R.bld.w, ly0: 0, bottom: R.bld.y - F * 0.5};
  }
  // building
  // (square column: when the building's caption fits beside it, the building keeps the full height of its region)
  let bh = Math.min(R.bld.h - F * 3.4, R.bld.w * 1.1);
  if (shape === 'square' && !band && showKey) {
    const bigH = Math.min(R.bld.h * 0.92, R.bld.w * 0.5);
    const capFit = fitWords(glue(`${cap('building')}: ${p.courts.building}`), {maxWidth: R.bld.w - bigH / 0.95 - 30 - F * 1.2, size: F, minSize: F, maxLines: 4, weight: 600});
    if (bigH > bh && !capFit.truncated && capFit.height + F < bigH) bh = bigH;
  }
  const bw = Math.min(R.bld.w, bh / 0.95);
  // (tall frames: the building keeps to the outer side of its region, its tree away from the label sheet)
  const bx = shape === 'square' && R.bld.w - bw > 200 / px ? R.bld.x : shape === 'portrait' ? (seatLeft ? R.bld.x + R.bld.w - bw : R.bld.x) : R.bld.x + (R.bld.w - bw) / 2;
  const building = buildingElevation(ctx, {name: 'bld', x: bx, y: R.bld.y, w: bw, h: bh, highlight: {floor: 1, bay: 3}});
  const bldBox = building.body;
  // label sheet (all supplied seat labels; the traced seat's row outlined)
  if (band) {
    // the sheet starts below the participant's start pad (which sits under the entrance)
    const top = Math.max(R.sheet.y, partBox.y + partBox.h + 14);
    R.sheet = {...R.sheet, y: top, h: D.h - top};
  }
  if (shape === 'landscape') {
    // the key on top of the sheet column (connectors leave the sheet sideways or downwards), both centred vertically
    const sp = {F, title: showKey ? cap('label') : null, rows: seats.map(s => s.label), focus: 0, showText: showKey};
    const sh = labelSheet(ctx, {x: R.sheet.x, y: 0, w: R.sheet.w, h: D.h, ...sp}).box.h;
    const lh = showKey ? make(0, 0, R.sheet.w).box.h + F * 1.4 : 0;
    const top = Math.max(0, (D.h - lh - sh) / 2);
    if (showKey) R.legendTop = {lx: R.sheet.x, lw: R.sheet.w, ly0: top, bottom: top + lh};
    R.sheet = {...R.sheet, y: top + lh, h: D.h - top - lh};
  }
  const sheet = labelSheet(ctx, {x: R.sheet.x, y: R.sheet.y, w: R.sheet.w, h: R.sheet.h, F, flush: shape === 'landscape', title: showKey ? cap('label') : null, rows: seats.map(s => s.label), focus: seats.findIndex(s => s.slot === slot), showText: showKey});
  if (sheet.overflow) problems.push('sheet');
  if (quick && problems.length) return {stub: true, problems};
  // chips (captions): each on the side of its part that no connector leaves from
  const chips = {};
  const join = (c0, v) => (String(v).toLowerCase().startsWith(String(c0).toLowerCase()) ? String(v) : `${c0}: ${v}`);
  const centerOf = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
  const partOf0 = {building: bldBox, room: roomBox, entrance: entBox, participant: partBox, seat: seatBox, label: sheet.box};
  const relsIn = p.relationships.filter(q => q.from !== q.to);
  const rays = id => relsIn.filter(q => q.from === id || q.to === id).map(q => [centerOf(partOf0[id]), centerOf(partOf0[q.from === id ? q.to : q.from])]);
  const legendTopBox = R.legendTop ? [{x: R.legendTop.lx, y: R.legendTop.ly0, w: R.legendTop.lw, h: R.legendTop.bottom - R.legendTop.ly0}] : [];
  const furnD = furnitureBoxes(G).map(f => ({x: ox + f.x * k, y: oy + f.y * k, w: f.w * k, h: f.h * k}));
  // the participant as drawn (the person on the pad reaches past the pad's frame)
  const partDraw = {x: partBox.x - rad * 0.35, y: partBox.y - rad * 0.35, w: partBox.w + rad * 0.7, h: partBox.h + rad * 0.7};
  const sideChip = (id, text, opts, order, gap = 10) => {
    const part = partOf0[id];
    const probe = gchip(ctx, text, {...opts, x: 0, y: 0, anchor: 'start'});
    // texts, the other parts and every piece of furniture are hard obstacles (the shared kit placer)
    const hard = [sheet.box, building.box, ...legendTopBox, ...Object.values(chips).map(c0 => c0.box),
      ...Object.entries(partOf0).filter(([id2]) => id2 !== id && id2 !== 'room').map(([id2, q]) => (id2 === 'participant' ? partDraw : q)), ...furnD.filter(f => !(part.x + part.w / 2 > f.x && part.x + part.w / 2 < f.x + f.w && part.y + part.h / 2 > f.y && part.y + part.h / 2 < f.y + f.h))];
    const pl = sideCaption({part, w: probe.box.w, h: probe.box.h, order, gap, frame: D, hard, rays: rays(id)});
    if (!pl.clear) problems.push(`caption-${id}`);
    return {...gchip(ctx, text, {...opts, x: pl.box.x, y: pl.box.y, anchor: 'start', name: `cap-${id}`}), side: pl.side};
  };
  if (showKey) {
    const btext = join(cap('building'), p.courts.building);
    chips.building = sideChip('building', btext, {maxWidth: Math.max(R.bld.w, 200 / px), size: F, minSize: F, maxLines: 5, fill: th.card}, ['below', 'above', 'left', 'right']);
    chips.participant = sideChip('participant', cap('participant'), {maxWidth: 300 / px, size: F, minSize: F, maxLines: 3, fill: th.card}, shape === 'square' && !band ? ['below', 'left', 'right'] : ['left', 'right', 'below']);
    chips.entrance = sideChip('entrance', join(cap('entrance'), p.labels.mainDoor), {maxWidth: 300 / px, size: F, minSize: F, maxLines: 4, fill: th.card}, ['right', 'below', 'left']);
    chips.seat = sideChip('seat', cap('seat'), {maxWidth: 260 / px, size: F, minSize: F, maxLines: 2, fill: th.card, stroke: th.accent2}, ['below', 'above', 'right', 'left'], 6);
    // the room's caption: on bare floor inside the room (never on furniture, a caption, the seat or the walk)
    const ropts = {maxWidth: Math.min(roomBox.w * 0.55, 380 / px), size: F, minSize: F, maxLines: 5, fill: th.card, stroke: th.accent2};
    const rtext = join(cap('room'), p.courts.room);
    const rprobe = gchip(ctx, rtext, {...ropts, x: 0, y: 0});
    const inner = {x: roomBox.x + t * k + 6, y: roomBox.y + t * k + 6, w: roomBox.w - 2 * t * k - 12, h: roomBox.h - 2 * t * k - 12};
    const spot = placeFree({w: rprobe.box.w, h: rprobe.box.h, bounds: inner, people: [{...seatD, rad}], extra: [...Object.values(chips).map(c0 => c0.box), seatBox, entBox, ...furnD],
      paths: [walkPts.map(toD)], pathPad: rad * 0.4, prefer: 'top-left', step: 8});
    if (!spot) problems.push('caption-room');
    const at = spot || {x: inner.x, y: inner.y};
    chips.room = gchip(ctx, rtext, {...ropts, x: at.x, y: at.y, name: 'cap-room'});
  }
  if (quick && (problems.length || Object.values(chips).some(c => c.fit.truncated))) return {stub: true, problems: [...problems, 'trunc']};
  let sideCap = null;
  if (showAll) {
    const sd = G.doors.side.gate;
    const q = toD({x: sd.x - t / 2, y: G.sideDoor.a});
    // beside the side door, inside the room, on bare floor (furniture and captions are hard obstacles)
    const sopts = {maxWidth: 240 / px, size: F, minSize: F, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft};
    const sprobe = gchip(ctx, p.labels.sideDoor, {...sopts, x: 0, y: 0});
    const door = toD({x: G.W, y: (G.sideDoor.a + G.sideDoor.b) / 2});
    const dpart = {x: door.x - 20 * k, y: toD({x: 0, y: G.sideDoor.a}).y, w: 20 * k, h: (G.sideDoor.b - G.sideDoor.a) * k};
    const spl = sideCaption({part: dpart, w: sprobe.box.w, h: sprobe.box.h, order: ['left', 'above', 'below'], gap: 8, frame: D,
      hard: [...furnD, ...Object.values(chips).map(c0 => c0.box), seatBox, entBox, {x: seatD.x - rad, y: seatD.y - rad, w: 2 * rad, h: 2 * rad}]});
    if (!spl.clear) problems.push('caption-side');
    sideCap = gchip(ctx, p.labels.sideDoor, {...sopts, x: spl.box.x, y: spl.box.y, anchor: 'start', name: 'cap-side'});
  }
  const labelBox = sheet.box;
  // ---- the graph
  // element boxes include their caption chips, so connectors end at the part + caption, never through a caption
  const uni = (a, b) => (b ? {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y)} : a);
  const elements = {
    building: {box: uni(bldBox, chips.building && chips.building.box)}, room: {box: roomBox}, entrance: {box: uni(entBox, chips.entrance && chips.entrance.box)},
    participant: {box: uni(partBox, chips.participant && chips.participant.box)}, seat: {box: uni(seatBox, chips.seat && chips.seat.box)}, label: {box: labelBox},
  };
  let legendLate = null;
  let legend = null;
  if (showKey) {
    const spots = [];
    if (R.legendTop) spots.push(R.legendTop);
    else spots.push({lx: R.sheet.x, lw: R.sheet.w, ly0: sheet.box.y + sheet.box.h + F * 0.7, bottom: D.h - 1});
    // beside the building (square column: the building is narrower than the column)
    if (shape === 'square' && R.bld.w - bw - 16 >= 200 / px) spots.push({lx: bx + bw + 16, lw: R.bld.x + R.bld.w - bx - bw - 16, ly0: R.bld.y, bottom: chips.building ? chips.building.box.y - 6 : R.bld.y + bh});
    // below the room (after the participant pad and the entrance caption)
    const low = Math.max(partBox.y + partBox.h, ...[chips.participant, chips.entrance].filter(Boolean).map(c => c.box.y + c.box.h), entBox.y + entBox.h) + F * 0.9;
    spots.push({lx: R.room.x, lw: R.room.w, ly0: low, bottom: D.h - 1});
    // under the room, beside the participant's pad and its caption (right, then left)
    const padZone = [partBox, chips.participant && chips.participant.box].filter(Boolean);
    const zr = Math.max(...padZone.map(b => b.x + b.w)) + F * 1.2, zl = Math.min(...padZone.map(b => b.x)) - F * 1.2;
    const under = roomBox.y + roomBox.h + F * 0.8;
    if (D.w - 4 - zr >= 240 / px) spots.push({lx: zr, lw: D.w - 4 - zr, ly0: under, bottom: D.h - 1});
    if (zl - Math.max(0, R.room.x) >= 240 / px) spots.push({lx: Math.max(0, R.room.x), lw: zl - Math.max(0, R.room.x), ly0: under, bottom: D.h - 1});
    // (square column) under the sheet, as wide as the free floor left of the participant's pad
    if (shape === 'square' && !band && seatLeft) spots.push({lx: 0, lw: zl, ly0: sheet.box.y + sheet.box.h + F * 0.6, bottom: D.h - 1});
    let got = null;
    for (const sp of spots) {
      const L1 = make(sp.lx, sp.ly0, sp.lw);
      const busy = [...Object.values(chips).map(c0 => c0.box), sideCap && sideCap.box, ...Object.values(partOf0), building.body].filter(Boolean);
      if (L1.box.y + L1.box.h <= sp.bottom && !busy.some(q => overlaps(L1.box, q, 8))) { got = L1; break; }
    }
    legendLate = !got ? {make} : null;
    if (got) legend = {node: g({name: 'legend', opacity: 0}, got.parts), box: got.box};
  }
  const rels = p.relationships.filter(q => q.from !== q.to);
  // connectors end a little inside the drawn box edge (the graph adds its own end gap), so arrowheads touch their part
  const inset = b => ({x: b.x + 6, y: b.y + 6, w: Math.max(4, b.w - 12), h: Math.max(4, b.h - 12)});
  // connectors attach to the drawn part itself (not to its caption), so no arrow ends in empty space
  // (the building's caption sits right below or above it: together they form one part)
  const stacked = c0 => c0 && /below|above/.test(c0.side);
  const partOf = {building: stacked(chips.building) ? uni(bldBox, chips.building.box) : bldBox, room: roomBox, entrance: entBox, participant: partBox,
    // (the seat's caption, when right under or over it, forms one part with it: connectors end on the pair)
    seat: stacked(chips.seat) ? uni(seatBox, chips.seat.box) : seatBox, label: labelBox};
  const gEls = Object.fromEntries(Object.entries(partOf).map(([id, b]) => [id, {box: inset(b)}]));
  // each connector's bend is chosen to keep it off captions, texts, other parts and earlier connectors
  const textish = [...Object.values(chips).map(c => c.box), sideCap && sideCap.box, sheet.box, building.body, legend && legend.box].filter(Boolean);
  const bendOpts = [0.08, 0.14, -0.08, -0.14, 0.24, -0.24, 0, 0.34, -0.34, 0.46, -0.46];
  const furnFree = furnD.filter(f => !(seatD.x > f.x && seatD.x < f.x + f.w && seatD.y > f.y && seatD.y < f.y + f.h));
  const chosen = [];
  const bends = rels.map((q, i) => {
    const def = q.kind === 'relation' ? 0.08 : 0.14;
    const others = Object.entries(partOf).filter(([id]) => id !== q.from && id !== q.to && id !== 'room').map(([, b]) => b);
    let bestB = null;
    for (const bnd of bendOpts) {
      const one = relationGraph(ctx, {name: 'probe', elements: gEls, relationships: [{...q, label: ''}], relationLabels: p.relationLabels, chipSize: F, obstacles: [], separateLabels: true, bend: () => bnd});
      const pts = Array.from({length: 41}, (_, j) => one.conns[0].c.at(j / 40));
      let cost = Math.abs(bnd - def) * 2;
      for (const z of pts.slice(2, 39)) {
        if ([...textish, ...others].some(b => z.x > b.x - 6 && z.x < b.x + b.w + 6 && z.y > b.y - 6 && z.y < b.y + b.h + 6)) cost += 10;
        // and off the furniture (a connector across the bench or a table reads as part of it)
        if (furnFree.some(b => z.x > b.x && z.x < b.x + b.w && z.y > b.y && z.y < b.y + b.h)) cost += 4;
        if (z.x < 4 || z.y < 4 || z.x > D.w - 4 || z.y > D.h - 4) cost += 10;
        // keep connectors apart, so each one has room for its own label beside it
        if (chosen.some(ps => ps.some(w => Math.hypot(w.x - z.x, w.y - z.y) < 14))) cost += 3;
        else if (chosen.some(ps => ps.some(w => Math.hypot(w.x - z.x, w.y - z.y) < 60 / px))) cost += 0.6;
      }
      if (!bestB || cost < bestB.cost) bestB = {bnd, cost, pts};
    }
    chosen.push(bestB.pts);
    return bestB.bnd;
  });
  const graph = relationGraph(ctx, {
    name: 'rg', elements: gEls, relationships: rels.map(q => ({...q, label: q.label ? glue(q.label) : ''})), relationLabels: p.relationLabels, chipSize: F, chipMax: 240 / px,
    obstacles: [], separateLabels: true, bend: (q, i) => bends[i],
  });
  // connector end gaps (end point to its element box edge)
  const edgeGap = (b, q) => Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h));
  const gaps = graph.conns.map(c => r(Math.max(edgeGap(partOf[c.rel.from], c.c.from), edgeGap(partOf[c.rel.to], c.c.to)), 1));
  // ---- relation labels: beside their OWN connector (box within 14 px of it), clear of the parts, people,
  // chips, texts and every other connector
  const connPts = graph.conns.map(c => Array.from({length: 41}, (_, i) => c.c.at(i / 40)));
  const hard = [...Object.entries(elements).filter(([id]) => id !== 'room').map(([, e]) => e.box), ...Object.values(chips).map(c => c.box), sideCap && sideCap.box, sheet.box, building.box, legend && legend.box,
    {x: seatD.x - rad, y: seatD.y - rad, w: 2 * rad, h: 2 * rad}].filter(Boolean);
  const roomFurn = furnitureBoxes(G).map(f => ({x: ox + f.x * k, y: oy + f.y * k, w: f.w * k, h: f.h * k}));
  const relLabels = [];
  const placedL = [];
  graph.conns.forEach((c, i) => {
    if (!showAll) return;
    const text = c.rel.label || p.relationLabels[c.rel.kind];
    let best = null;
    const dTo = (b, pts) => Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
    for (const wk of [1, 1.3, 0.75, 0.55, 1.6]) {
      const fit = fitWords(glue(text), {maxWidth: (240 / px) * wk, size: F, minSize: F, maxLines: wk < 1 ? 4 : 3, weight: 600});
      if (fit.truncated) continue;
      const w = fit.width + F * 1.2, hh = fit.height + F * 0.76;
      for (const t0 of [0.5, 0.44, 0.56, 0.38, 0.62, 0.32, 0.68, 0.26, 0.74, 0.2, 0.8, 0.14, 0.86]) {
        const q = c.c.at(t0);
        const a = q.a;
        const nx = -Math.sin(a), ny = Math.cos(a);
        for (const side of [1, -1]) {
          for (const off of [6, 12, 20, 30, 38]) {
            // box centre pushed out along the normal until its edge is `off` from the curve
            const ext = Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2 + off / px;
            const box = {x: q.x + nx * side * ext - w / 2, y: q.y + ny * side * ext - hh / 2, w, h: hh};
            if (box.x < 4 || box.y < 4 || box.x + w > D.w - 4 || box.y + hh > D.h - 4) continue;
            if (hard.some(o2 => overlaps(box, o2, 4)) || placedL.some(o2 => overlaps(box, o2, 8))) continue;
            if (connPts.some((pts, j) => pts.some(z => z.x > box.x - 6 && z.x < box.x + w + 6 && z.y > box.y - 6 && z.y < box.y + hh + 6))) continue;
            // it reads as this connector's label: nearer its own connector than any other one
            const own = dTo(box, connPts[i]);
            if (own * px > 40 || connPts.some((pts, j) => j !== i && dTo(box, pts) < own + 8 / px)) continue;
            let cost = 0;
            for (const f of roomFurn) if (overlaps(box, f)) cost += 25;
            cost += Math.abs(t0 - 0.5) * 4 + (1 - wk) * 3;
            if (!best || cost < best.cost) best = {box, fit, cost};
          }
        }
      }
      if (best) break;
    }
    if (!best) {
      problems.push(`rel${i}`);
      const fit = fitWords(glue(text), {maxWidth: 240 / px, size: F, minSize: F, maxLines: 3, weight: 600});
      const q = c.c.at(0.5);
      best = {box: {x: q.x + 8, y: q.y + 8, w: fit.width + F * 1.2, h: fit.height + F * 0.76}, fit};
    }
    placedL.push(best.box);
    relLabels.push({i, box: best.box, fit: best.fit, color: kindColor(ctx, c.rel.kind)});
  });
  const labelsClear = relLabels.every(L1 => !relLabels.some(L2 => L2 !== L1 && overlaps(L1.box, L2.box, 2)) && !hard.some(o2 => overlaps(L1.box, o2, 0)));
  const labelOwn = relLabels.every(L1 => {
    const b = L1.box;
    const d = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
    const own = d(connPts[L1.i]);
    return own * px <= 40 && connPts.every((pts, j) => j === L1.i || d(pts) >= own + 8 / px);
  });
  if (!labelsClear) problems.push('labels');
  if (!labelOwn) problems.push('own');
  const textBoxes = [...Object.values(chips).map(c => c.box), sideCap && sideCap.box, ...relLabels.map(q => q.box)].filter(Boolean);
  const crosses = graph.conns.some((c, i) => connPts[i].slice(3, 38).some(z => textBoxes.some(b => z.x > b.x && z.x < b.x + b.w && z.y > b.y && z.y < b.y + b.h)));
  crossDetail = graph.conns.map((c, i) => connPts[i].slice(3, 38).filter(z => textBoxes.some(b => z.x > b.x && z.x < b.x + b.w && z.y > b.y && z.y < b.y + b.h)).length);
  if (crosses) problems.push('cross');
  // connectors leave shared parts from distinct points and never run in close parallel (as the rendered check)
  {
    const ends = graph.conns.map(c => [c.c.from, c.c.to]);
    let bad = false;
    for (let i = 0; i < connPts.length && !bad; i++) for (let j = i + 1; j < connPts.length && !bad; j++) {
      if (ends[i].some(a0 => ends[j].some(b0 => Math.hypot(a0.x - b0.x, a0.y - b0.y) < 14 / px))) bad = true;
      const la = connPts[i].reduce((a0, q, n) => a0 + (n ? Math.hypot(q.x - connPts[i][n - 1].x, q.y - connPts[i][n - 1].y) : 0), 0);
      let run = 0;
      for (const q of connPts[i]) {
        run = connPts[j].some(z => Math.hypot(z.x - q.x, z.y - q.y) < 22 / px) ? run + la / 40 : 0;
        if (run > 110 / px) { bad = true; break; }
      }
    }
    if (bad) problems.push('routes');
  }
  if (Object.values(chips).some(c => c.fit.truncated)) problems.push('trunc');
  if (Object.values(chips).some(c => c.box.x < 2 || c.box.y < 2 || c.box.x + c.box.w > D.w - 2 || c.box.y + c.box.h > D.h - 2)) problems.push('frame');
  const relNodes = relLabels.map(L1 => g({name: `rg-lg${L1.i}`, opacity: 0},
    h('path', {d: roundRectPath(L1.box.x, L1.box.y, L1.box.w, L1.box.h, Math.min(L1.box.h / 2, F * 0.7)), fill: th.card, stroke: L1.color, 'stroke-width': 2}),
    textAt(L1.fit, L1.box.x + L1.box.w / 2, L1.box.y + (L1.box.h - L1.fit.height) / 2, th.ink, false, 'middle')));
  if (showKey && !legend && legendLate) {
    const make = legendLate.make;
    const lw = Math.min(roomBox.w * 0.5, 360 / px);
    const probe = make(0, 0, lw - 20);
    const free = placeFree({w: lw, h: probe.box.h + 20, bounds: {x: ox + 8, y: oy + 8, w: RW * k - 16, h: RH * k - 16},
      people: [{x: seatD.x, y: seatD.y, rad}], extra: [...roomFurn, ...Object.values(chips).map(c => c.box), sideCap && sideCap.box, ...relLabels.map(q => q.box)].filter(Boolean),
      paths: [...connPts, walkPts.map(toD)], pathPad: 14, furniture: [], prefer: 'top-right'});
    if (free) {
      const L1 = make(free.x + 10, free.y + 10, lw - 20);
      L1.parts.unshift(h('path', {d: roundRectPath(free.x, free.y, free.w, free.h, 10), fill: th.paper, stroke: th.inkFaint, 'stroke-width': 2}));
      legend = {node: g({name: 'legend', opacity: 0}, L1.parts), box: L1.box};
    } else {
      problems.push('legend');
      const L1 = make(R.sheet.x, sheet.box.y + sheet.box.h + F * 0.7, R.sheet.w);
      legend = {node: g({name: 'legend', opacity: 0}, L1.parts), box: L1.box};
    }
  }
  // final audit: no two text-bearing boxes overlap (captions, relation labels, sheet, legend, building)
  {
    const all = [...Object.values(chips).map(c => c.box), sideCap && sideCap.box, ...relLabels.map(q => q.box), sheet.box, legend && legend.box, building.box].filter(Boolean);
    if (all.some((a1, i) => all.some((b1, j) => j > i && overlaps(a1, b1, 2)))) problems.push('overlap');
    if (legend && connPts.some(pts => pts.slice(3, 38).some(z => z.x > legend.box.x - 4 && z.x < legend.box.x + legend.box.w + 4 && z.y > legend.box.y - 4 && z.y < legend.box.y + legend.box.h + 4))) problems.push('cross');
  }
  // ---- tracer route through the supplied order
  const rt = graph.route(p.traversalOrder);
  const visits = rt.visits.map(v => ({id: v.id, u: lerp(W.trace[0], W.trace[1], ease.inOutSine(v.t) === 0 ? 0 : invSine(v.t))}));
  const tSeat = visits.find(v => v.id === 'seat');
  const walkEnd = tSeat ? Math.max(tSeat.u, W.trace[0] + 0.1) : W.trace[1];
  const walk = [Math.max(W.trace[0] + 0.005, walkEnd - 0.17), walkEnd];
  const tracerNode = g({name: 'tracer', opacity: 0},
    h('circle', {r: 19, fill: th.accent, opacity: 0.22}),
    h('circle', {r: 10, fill: th.accent, stroke: th.paper, 'stroke-width': 3}));
  // legend: connector kinds in use + key
  const centers = Object.fromEntries(Object.entries(elements).map(([id, e]) => [id, {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2}]));
  const cluster = {x: D.w / 2, y: D.h / 2};
  // ---- the "separate" beat: the parts start drawn closer together and slide apart, but never overlapping
  // (the room travels with its seat and entrance). The largest start offset that keeps every group clear.
  const cb = c0 => (c0 ? c0.box : null);
  const unionAll = bs => bs.filter(Boolean).reduce((a, b) => uni(a, b));
  // (each group moves as one; its members are the part boxes and their captions)
  const groups = {
    building: {ids: ['building'], box: unionAll([building.box, cb(chips.building)]), parts: [building.box, cb(chips.building)]},
    room: {ids: ['room', 'seat', 'entrance'], box: roomBox, parts: [roomBox, cb(chips.room), sideCap && sideCap.box, seatBox, cb(chips.seat), entBox, cb(chips.entrance)]},
    participant: {ids: ['participant'], box: unionAll([partDraw, cb(chips.participant)]), parts: [partDraw, cb(chips.participant)]},
    label: {ids: ['label'], box: sheet.box, parts: [sheet.box]},
  };
  const shiftedParts = (gr, f) => { const c = centerOf(gr.box); const dx = (cluster.x - c.x) * f, dy = (cluster.y - c.y) * f; return gr.parts.filter(Boolean).map(b => ({...b, x: b.x + dx, y: b.y + dy})); };
  let sepF = 0;
  for (const f of [0.16, 0.13, 0.1, 0.08, 0.06, 0.04, 0.03, 0.02]) {
    const gs = Object.values(groups).map(gr => shiftedParts(gr, f));
    if (!gs.some((ga, i) => gs.some((gb, j) => j > i && ga.some(a1 => gb.some(b1 => overlaps(a1, b1, 12)))))) { sepF = f; break; }
  }
  {
    const gs = Object.values(groups).map(gr => shiftedParts(gr, 0));
    if (gs.some((ga, i) => gs.some((gb, j) => j > i && ga.some(a1 => gb.some(b1 => overlaps(a1, b1, 2)))))) problems.push('parts');
  }
  const sepOff = {};
  for (const gr of Object.values(groups)) {
    const c = centerOf(gr.box);
    for (const id of gr.ids) sepOff[id] = {x: (cluster.x - c.x) * sepF, y: (cluster.y - c.y) * sepF};
  }
  return {F, px, k, G, ox, oy, room, trails, person, walker, walk, pad, seatBody, seatD, slot, building, chips, sideCap, sheet, graph, els: elements, rels, gaps, labelsClear, labelOwn,
    poly: rt.poly, visits, tracerNode, legend, centers, cluster, problems, relNodes, relLabels, crossDetail, entBox, legendMiss, sepOff, sepF};
}

/** Inverse of inOutSine on [0,1] (time fraction at which an arc-length fraction is reached). */
function invSine(v) {
  return Math.acos(1 - 2 * clamp(v)) / Math.PI;
}

/**
 * The sheet of editable seat labels: a paper sheet with one row per supplied
 * seat. Rows are face down (a plain back) until revealed; the traced seat's
 * row is outlined in the seat colour.
 */
function labelSheet(ctx, o) {
  const th = ctx.theme;
  const F = o.F;
  const pad = F * 0.8;
  const rowW = Math.min(o.w, 440 / (o.F / F)) - pad * 2;
  const title = o.title ? fitWords(glue(o.title), {maxWidth: rowW, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  const fits = o.rows.map(t => fitWords(glue(t), {maxWidth: rowW - F * 1.6, size: F, minSize: F, maxLines: 3, weight: 600}));
  const rowH = fits.map(f => f.height + F * 0.66);
  const w = rowW + pad * 2;
  const hh = pad + (title ? title.height + F * 0.8 : 0) + rowH.reduce((a, b) => a + b + F * 0.26, 0) + pad * 0.6;
  const x = o.x + (o.w - w) / 2;
  const y = o.flush ? o.y : o.y + Math.max(0, Math.min((o.h - hh) * 0.2, o.h - hh));
  const parts = [];
  parts.push(h('path', {d: roundRectPath(x + 5, y + 8, w, hh, 12), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, hh, 12), fill: th.paper, stroke: th.ink, 'stroke-width': 2.4}));
  let yy = y + pad;
  if (title) {
    parts.push(textAt(title, x + pad, yy, th.ink));
    yy += title.height + F * 0.8;
  }
  const rows = [];
  fits.forEach((f, i) => {
    const ry = yy;
    const rh = rowH[i];
    const name = `row${i}`;
    const front = g({name: `${name}-front`, opacity: 0},
      h('rect', {x: r(x + pad), y: r(ry), width: r(rowW), height: r(rh), rx: 8, fill: th.card, stroke: i === o.focus ? th.accent2 : th.inkSoft, 'stroke-width': i === o.focus ? 4 : 2}),
      h('circle', {cx: r(x + pad + F * 0.7), cy: r(ry + rh / 2), r: r(F * 0.26), fill: i === o.focus ? th.accent2 : th.inkSoft}),
      o.showText ? textAt(f, x + pad + F * 1.3, ry + (rh - f.height) / 2, th.ink) : null);
    const back = g({name: `${name}-back`},
      h('rect', {x: r(x + pad), y: r(ry), width: r(rowW), height: r(rh), rx: 8, fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 2}),
      h('path', {d: `M${r(x + pad + 10)} ${r(ry + rh / 2)}h${r(rowW - 20)}`, stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round'}));
    parts.push(back, front);
    rows.push({name, cx: x + pad + rowW / 2, cy: ry + rh / 2});
    yy += rh + F * 0.26;
  });
  const flipAt = (u, at, i) => seg(u, at + i * 0.012, at + i * 0.012 + 0.03);
  return {
    node: g(null, parts),
    box: {x, y, w, h: hh},
    overflow: y + hh > o.y + o.h + 1 || fits.some(f => f.truncated) || (title && title.truncated),
    frame(u, at) {
      const out = {};
      rows.forEach((rw, i) => {
        const q = flipAt(u, at, i);
        // turn over: the back narrows away, then the front widens in (never both drawn at once)
        const k1 = q < 0.5 ? 1 - q * 2 : 0, k2 = q >= 0.5 ? (q - 0.5) * 2 : 0;
        out[`${rw.name}-back`] = {opacity: k1 > 0 ? 1 : 0, transform: scaleAbout(rw.cx, rw.cy, r(Math.max(0.02, k1), 3), 1)};
        out[`${rw.name}-front`] = {opacity: k2 > 0 ? 1 : 0, transform: scaleAbout(rw.cx, rw.cy, r(Math.max(0.02, k2), 3), 1)};
      });
      return out;
    },
    revealed: (u, at) => Math.min(...rows.map((_, i) => flipAt(u, at, i))),
  };
}

function textAt(fit, x, y, fill, italic = false, anchor = 'start') {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': italic ? 'italic' : undefined, 'text-anchor': anchor, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-01-mechanism',
    title: 'Room layout — the parts of a placement and how they connect',
    titleEs: 'Distribución de una sala — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Distribución de una sala',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The placement decomposed into a generic building, the room plan it contains, the entrance, a participant, one seat and the sheet of editable seat labels. Only supplied relationships are drawn, styled by kind; a tracer follows the supplied order while the focus part enlarges, the participant walks to the seat and the labels are revealed.',
    tags: ['mechanism', 'floor plan', 'room', 'building', 'seat', 'labels', 'connectors', 'tracer', 'relation', 'sequence'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/animations/roles/kits/mediation-labels.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
