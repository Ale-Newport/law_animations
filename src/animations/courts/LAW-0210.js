/**
 * LAW-0210 — Asignación de órgano · mechanism
 *
 * Storyboard (the sending decomposed into six parts laid out as a loop across
 * the frame — not a row of boxes: the intake office (a generic building front),
 * the case file (an enlarged folder with its datum tag), the sorting switch (a
 * plan fragment of the sorting point: a plaza with one branch stub per venue, a
 * pointer, the dashed waiting slot and the sorting clerk standing at its entry),
 * the mapping sheet (the SUPPLIED rows, datum · venue), the venues (generic
 * building fronts with their names, standing apart) and the receiving room (a
 * desk with its in-tray and the receiving clerk seated at it, drawn as a plan)).
 * Connectors land on a part's own art (the switch body — never a rail tip —, the
 * matched venue's building towards the desk), each on its own port, and run
 * through no text, no other part and no other connector; every label sits
 * beside its own line (or on its own thin leader), never over a line:
 *  0.00–0.18  separate: the parts start gathered towards the centre and slide
 *             apart to their places (never overlapping).
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one,
 *             anchored to the parts' edges; a plain relation is a line with end
 *             dots (never an arrow); another kind is drawn only when supplied and
 *             then carries the caption of its kind ("… as configured
 *             (illustrative)"). Each connector has its own label beside it.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order along the
 *             connectors; the focus part enlarges while the tracer passes. When
 *             the tracer reaches the mapping sheet, the row whose datum EQUALS the
 *             file's datum is outlined and the switch pointer turns to that
 *             venue's branch (or to the waiting slot when no row matches); at the
 *             venues, that venue's window is highlighted; at the room, the file
 *             lies in the in-tray (or, when no row matches, in the slot).
 *  0.75–1.00  gather: origin, transformation (the matched row and the turned
 *             pointer) and state (the file set down) stay visible with a legend of
 *             the connector kinds used and the key "as supplied · no conclusion
 *             drawn". No venue is ranked, no venue sends to another, no outcome.
 * @module animations/courts/LAW-0210
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {buildingElevation, planColors, planTable, planChair, planPerson, wallRing, floorArea} from './kits/courts-art.js';
import {shade} from '../../primitives/paper.js';
import {
  organoFields, ORG_EN, resolveOrgano, fileProp, textAt, fitG, tagGlyph, tagChip, legendGlyph, overlaps, pxPerUnit, R2, VENUE_TINTS, clerkLook,
} from './kits/asignacion-de-organo.js';

/** People in the mechanism (plan view): >= ~70 px across at 1080p whatever the part's scale. */
const personScale = px => 0.7 / px;

const ID = 'LAW-0210';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {slide: [0.02, 0.15], relate: [0.2, 0.42], trace: [0.45, 0.72], legend: [0.75, 0.81]};
const EL = ['origin', 'file', 'switch', 'mapping', 'venues', 'room'];

const STRINGS = {
  en: {kinds: 'Connections', was: 'was'},
  es: {kinds: 'Conexiones', was: 'antes'},
};

const relationship = obj('A supplied relationship between two parts', {
  from: oneOf('Source part', EL),
  to: oneOf('Target part', EL),
  kind: oneOf('relation | communication | sequence | causal (only relation in the shipped presets; another kind is drawn only when the author supplies it, with the caption of its kind)', RELATION_KINDS),
  label: str('Label drawn beside the connector (as supplied; empty = the caption of its kind)', 50),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  ...organoFields,
  elements: list('Part captions; ids are fixed by the scene, captions are editable', obj('Part', {
    id: oneOf('Part id', EL),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 6, 6),
  relationships: list('Explicit relationships between the parts; kind controls the line style (plain relation = no arrow)', relationship, 1, 6),
  focusElement: oneOf('Part enlarged while the tracer passes', EL),
  relationLabels: obj('Caption of each connection kind (legend, and connectors without their own label)', {
    relation: str('Caption for plain relations', 60),
    communication: str('Caption for communications', 60),
    sequence: str('Caption for sequence links', 60),
    causal: str('Caption for supplied causal links', 60),
  }),
  traversalOrder: list('Order in which the tracer visits the parts', oneOf('Part id', EL), 2, 8),
};

const defaultParams = {
  ...ORG_EN,
  elements: [
    {id: 'origin', label: 'Intake office'},
    {id: 'file', label: 'Case file and its datum'},
    {id: 'switch', label: 'Switch at the sorting point'},
    {id: 'mapping', label: 'Supplied mapping sheet'},
    {id: 'venues', label: 'Venues'},
    {id: 'room', label: 'Receiving desk'},
  ],
  relationships: [
    {from: 'origin', to: 'file', kind: 'relation', label: 'held at'},
    {from: 'file', to: 'switch', kind: 'relation', label: 'carried to'},
    {from: 'switch', to: 'mapping', kind: 'relation', label: 'reads'},
    {from: 'mapping', to: 'venues', kind: 'relation', label: 'one row per datum'},
    {from: 'venues', to: 'room', kind: 'relation', label: 'each has'},
  ],
  focusElement: 'mapping',
  relationLabels: {relation: 'linked as configured', communication: 'communication as configured (illustrative)', sequence: 'sequence as configured (illustrative)', causal: 'causal link as supplied (illustrative)'},
  traversalOrder: ['origin', 'file', 'switch', 'mapping', 'venues', 'room'],
};

/**
 * Row templates per shape: the parts sit in rows (a loop, read top-left → around), each part taking a share of
 * its row's width; `h` = the rows' height weights; gaps between rows and columns carry the connectors and their
 * labels. Several variants are tried.
 */
const ROWS = {
  landscape: [
    {rows: [[['file', 0.27], ['mapping', 0.4], ['venues', 0.33]], [['origin', 0.22], ['switch', 0.43], ['room', 0.35]]], h: [0.58, 0.42]},
    {rows: [[['file', 0.3], ['mapping', 0.38], ['venues', 0.32]], [['origin', 0.2], ['switch', 0.45], ['room', 0.35]]], h: [0.55, 0.45]},
    {rows: [[['file', 0.25], ['mapping', 0.42], ['venues', 0.33]], [['origin', 0.22], ['switch', 0.42], ['room', 0.36]]], h: [0.6, 0.4]},
  ],
  square: [
    {rows: [[['file', 0.55], ['origin', 0.45]], [['switch', 0.44], ['mapping', 0.56]], [['venues', 0.62], ['room', 0.38]]], h: [0.28, 0.36, 0.36]},
    {rows: [[['file', 0.6], ['origin', 0.4]], [['switch', 0.4], ['mapping', 0.6]], [['venues', 0.6], ['room', 0.4]]], h: [0.26, 0.38, 0.36]},
    {rows: [[['file', 0.6], ['origin', 0.4]], [['switch', 0.36], ['mapping', 0.64]], [['venues', 0.62], ['room', 0.38]]], h: [0.24, 0.44, 0.32]},
    {rows: [[['file', 0.62], ['origin', 0.38]], [['switch', 0.34], ['mapping', 0.66]], [['venues', 0.64], ['room', 0.36]]], h: [0.22, 0.47, 0.31]},
    {rows: [[['file', 0.62], ['origin', 0.38]], [['switch', 0.36], ['mapping', 0.64]], [['venues', 0.6], ['room', 0.4]]], h: [0.21, 0.47, 0.32]},
    {rows: [[['file', 0.64], ['origin', 0.36]], [['switch', 0.35], ['mapping', 0.65]], [['venues', 0.62], ['room', 0.38]]], h: [0.2, 0.5, 0.3]},
    {rows: [[['origin', 0.24], ['file', 0.42], ['switch', 0.34]], [['mapping', 1]], [['venues', 0.64], ['room', 0.36]]], h: [0.3, 0.36, 0.34]},
    {rows: [[['origin', 0.22], ['file', 0.44], ['switch', 0.34]], [['mapping', 1]], [['venues', 0.66], ['room', 0.34]]], h: [0.28, 0.4, 0.32]},
  ],
  portrait: [
    {rows: [[['file', 0.56], ['origin', 0.44]], [['switch', 0.46], ['mapping', 0.54]], [['venues', 1]], [['room', 0.8]]], h: [0.19, 0.29, 0.27, 0.25]},
    {rows: [[['file', 0.6], ['origin', 0.4]], [['switch', 0.42], ['mapping', 0.58]], [['venues', 1]], [['room', 0.55]]], h: [0.19, 0.32, 0.29, 0.2]},
  ],
};

const SIZES = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6];

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const log = [];
    let best = null;
    let stubBest = null;
    for (const v of SIZES) {
      let pick = null;
      for (const [vi, tpl] of ROWS[shape].entries()) {
        for (const gapF of [2.6, 3.6, 5]) {
          const L = compose(ctx, p, v / px, px, shape, tpl, gapF);
          log.push(`${v}/${vi}/${gapF}:${L.problems.join('+')}`);
          if (L.stub) { if (!stubBest || L.problems.length < stubBest.n) stubBest = {n: L.problems.length, v, tpl, gapF}; continue; }
          if (!best || L.problems.length < best.problems.length) best = L;
          if (!L.problems.length && !pick) pick = L;
        }
      }
      if (pick) { best = pick; break; }
    }
    if (!best) {
      // nothing composed without a part problem: the smallest size and first template, fully (reported as problems)
      const sb = stubBest || {v: SIZES[SIZES.length - 1], tpl: ROWS[shape][0], gapF: 3.6};
      best = compose(ctx, p, sb.v / px, px, shape, sb.tpl, sb.gapF, true);
    }
    best.log = log.slice(-24);
    return best;
  },
  build(ctx, L) {
    return g(null,
      EL.map(id => L.parts[id].node),
      L.conns.map(c => c.node),
      L.relLabels.map(q => q.node),
      L.tracerNode,
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const slide = ease.inOutCubic(seg(u, ...W.slide));
    const focusScale = {};
    const visitU = {};
    for (const v of L.visits) visitU[v.id] = v.u;
    for (const id of EL) {
      const P = L.parts[id];
      const dx = L.sepOff[id].x * (1 - slide), dy = L.sepOff[id].y * (1 - slide);
      const vu = visitU[id];
      const near = id === ctx.params.focusElement && vu !== undefined ? Math.max(0, 1 - Math.abs(u - vu) / 0.07) : 0;
      const s = 1 + (L.maxGrow[id] - 1) * ease.inOutSine(near);
      focusScale[id] = s;
      nodes[`el-${id}`] = {transform: `${T(dx, dy)} ${scaleAbout(P.center.x, P.center.y, r(s, 4))}`};
    }
    // relationships drawn one by one (only after the parts have separated)
    const n = L.conns.length;
    const drawn = L.conns.map((_, i) => ease.inOutSine(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 0.85) * (W.relate[1] - W.relate[0])) / n)));
    L.conns.forEach((c, i) => Object.assign(nodes, c.frame(drawn[i], drawn[i] > 0 ? 1 : 0)));
    L.relLabels.forEach(q => { nodes[q.name] = {opacity: r(clamp((drawn[q.i] - 0.55) / 0.45), 3)}; });
    // tracer along the supplied order
    const tp = seg(u, ...W.trace);
    const tq = L.poly.total > 0 ? L.poly.at(ease.inOutSine(tp)) : {x: 0, y: 0};
    const tracerOp = u >= W.trace[0] - 0.005 && L.poly.total > 0 ? 1 - seg(u, W.trace[1] + 0.005, W.trace[1] + 0.03) : 0;
    nodes.tracer = {transform: T(tq.x, tq.y), opacity: r(tracerOp, 3)};
    const reached = id => (visitU[id] !== undefined ? u >= visitU[id] : u >= W.trace[1]);
    // mapping: the matched row is outlined when the tracer reaches the sheet; the pointer turns then
    const mp = seg(u, (visitU.mapping ?? W.trace[1]) - 0.005, (visitU.mapping ?? W.trace[1]) + 0.03);
    Object.assign(nodes, L.parts.mapping.frame(mp), L.parts.switch.frame(mp), L.parts.venues.frame(seg(u, (visitU.venues ?? W.trace[1]) - 0.005, (visitU.venues ?? W.trace[1]) + 0.03) * (mp >= 1 ? 1 : 0)));
    const rp = seg(u, (visitU.room ?? W.trace[1]) - 0.005, (visitU.room ?? W.trace[1]) + 0.03) * (mp >= 1 ? 1 : 0);
    Object.assign(nodes, L.parts.room.frame(rp), L.parts.switch.frame(mp, rp));
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const visited = L.visits.filter(v => u >= v.u - 1e-9).map(v => v.id);
    return {
      nodes,
      semantic: {
        beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
        slide: r(slide, 3),
        separateStart: r(L.sepF, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracer: R2(tq),
        tracerVisible: tracerOp > 0,
        visitOrder: visited,
        focusScale: r(Math.max(...Object.values(focusScale)), 3),
        rowMatched: r(mp, 3),
        matchRow: L.res.matchRow,
        selected: L.res.selected,
        pointerTo: mp >= 1 ? (L.res.selected < 0 ? 'slot' : `venue${L.res.selected}`) : 'none',
        fileSetDown: rp >= 1 ? (L.res.selected < 0 ? 'slot' : 'tray') : 'none',
        mappingReached: reached('mapping'),
        connectorGaps: L.gaps,
        arrows: L.conns.map(c => ({kind: c.kind, arrow: LINK_STYLES[c.kind].arrow, from: c.a, to: c.b})),
        connPorts: L.conns.map(c => c.ports),
        labelsClear: L.labelsClear,
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        log: L.log,
      },
    };
  },
};

/** One composition at text size F. */
function compose(ctx, p, F, px, shape, tpl, gapF, full = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const res = resolveOrgano(p);
  const cap = id => (p.elements.find(e => e.id === id) || {label: id}).label;
  // secondary text: smaller than the main text only while that keeps it >= 19.6 px (never below 16.6 px)
  const Fc = Math.max(F * 0.86, Math.min(F, 19.6 / px), 16.6 / px);
  // ---- the legend band (bottom): kinds used + key
  const rels = p.relationships.filter(q => q.from !== q.to);
  const kinds = [...new Set(rels.map(q => q.kind))];
  const legendItems = [];
  if (showAll) for (const kd of kinds) legendItems.push({kd, fit: fitG(p.relationLabels[kd], {maxWidth: 420 / px, size: Fc, minSize: Fc, maxLines: 2, weight: 500})});
  const keyFit = showKey ? fitG(p.labels.key, {maxWidth: D.w * 0.6, size: Fc, minSize: Fc, maxLines: 3, weight: 500}) : null;
  // kinds and key share one line when they fit, else the key goes on a second line
  const kindsW = legendItems.reduce((a, q) => a + 60 + q.fit.width + F * 1.4, 0);
  const kindsH = Math.max(0, ...legendItems.map(q => q.fit.height));
  const keyBelow = keyFit && legendItems.length && kindsW + keyFit.width + 8 > D.w;
  const lgH = (keyBelow ? kindsH + F * 0.4 + keyFit.height : Math.max(kindsH, keyFit ? keyFit.height : 0)) + (legendItems.length || keyFit ? F * 0.8 : 0);
  if (legendItems.some(q => q.fit.truncated) || (keyFit && keyFit.truncated)) problems.push('legend-trunc');
  const area = {x: 0, y: 0, w: D.w, h: D.h - lgH};
  // rows: gaps between rows and between columns keep room for the connectors and their labels
  const rowGap = F * gapF, colGap = F * gapF * (shape === 'square' ? 1.35 : 0.9);
  const nR = tpl.rows.length;
  const rowsH = area.h - rowGap * (nR - 1);
  const boxes = {};
  let y = area.y;
  tpl.rows.forEach((row, ri) => {
    const rh = rowsH * tpl.h[ri];
    const used = row.reduce((a, [, f]) => a + f, 0);
    const wAvail = area.w - colGap * (row.length - 1);
    let x = area.x + (1 - used) * wAvail / 2;
    for (const [id, f] of row) { boxes[id] = {x, y, w: wAvail * f, h: rh}; x += wAvail * f + colGap; }
    y += rh + rowGap;
  });
  const box = id => boxes[id];
  // ---- the parts
  const parts = {};
  parts.origin = originPart(ctx, p, box('origin'), F, Fc, px, cap('origin'), showAll, showKey);
  parts.file = filePart(ctx, p, box('file'), F, px, cap('file'), showAll, showKey);
  parts.switch = switchPart(ctx, p, box('switch'), F, Fc, px, cap('switch'), res, showAll, showKey);
  parts.mapping = mappingPart(ctx, p, box('mapping'), F, px, cap('mapping'), res, showAll, showKey);
  parts.venues = venuesPart(ctx, p, box('venues'), F, px, cap('venues'), res, showAll, showKey);
  parts.room = roomPart(ctx, p, box('room'), F, Fc, px, cap('room'), res, showAll, showKey);
  for (const id of EL) problems.push(...parts[id].problems.map(q => `${id}:${q}`));
  for (let i = 0; i < EL.length; i++) for (let j = i + 1; j < EL.length; j++) if (overlaps(parts[EL[i]].box, parts[EL[j]].box, 4)) problems.push(`parts:${EL[i]}/${EL[j]}`);
  // cheap failures stop here (the connector and label search is the expensive part)
  if (problems.length && !full) return {problems, stub: true};
  // ---- connectors: from part edge to part edge; the bend keeps them off the other parts
  const partBox = id => parts[id].box;
  const inset = b => ({x: b.x + 4, y: b.y + 4, w: Math.max(4, b.w - 8), h: Math.max(4, b.h - 8)});
  const conns = [];
  const connPts = [];
  // connectors land on a part's art or its title chip (never on empty space beside a caption)
  const anchorOf = id => { const P = parts[id]; const a = P.anchor || partBox(id); if (!P.title) return a; const x0 = Math.min(a.x, P.title.x), y0 = Math.min(a.y, P.title.y); return {x: x0, y: y0, w: Math.max(a.x + a.w, P.title.x + P.title.w) - x0, h: Math.max(a.y + a.h, P.title.y + P.title.h) - y0}; };
  // every text of every part: a connector must not run through one
  const allTexts = EL.flatMap(id => parts[id].texts);
  const slideOn = (b, pt, f) => {
    // move an edge point along its edge by f × the edge length (stays on the edge)
    const onV = Math.abs(pt.x - b.x) < 0.5 || Math.abs(pt.x - b.x - b.w) < 0.5;
    return onV ? {x: pt.x, y: clamp(pt.y + f * b.h, b.y + 6, b.y + b.h - 6)} : {x: clamp(pt.x + f * b.w, b.x + 6, b.x + b.w - 6), y: pt.y};
  };
  // a connector lands on its part's own art (its port for that partner: the switch's plaza, the matched venue's
  // building towards the desk), never on empty space, a title or a rail tip; it crosses no text at all (titles
  // included) and no other part
  const centreOf = id => { const b = parts[id].anchor || partBox(id); return {x: b.x + b.w / 2, y: b.y + b.h / 2}; };
  const portOf = (id, other) => {
    const P = parts[id];
    return inset(P.port ? P.port(other, centreOf(other)) : (P.anchor || partBox(id)));
  };
  const portsOf = (id, other) => (parts[id].ports ? parts[id].ports(other).map(inset) : [portOf(id, other)]);
  const bezier = (from, to, bend) => {
    const dx = to.x - from.x, dy = to.y - from.y, nx = -dy, ny = dx;
    const c1 = {x: from.x + dx * 0.3 + nx * bend, y: from.y + dy * 0.3 + ny * bend}, c2 = {x: from.x + dx * 0.7 + nx * bend, y: from.y + dy * 0.7 + ny * bend};
    return Array.from({length: 41}, (_, j) => { const t = j / 40, m = 1 - t; return {x: m * m * m * from.x + 3 * m * m * t * c1.x + 3 * m * t * t * c2.x + t * t * t * to.x, y: m * m * m * from.y + 3 * m * m * t * c1.y + 3 * m * t * t * c2.y + t * t * t * to.y}; });
  };
  const mids = b => [{x: b.x + b.w / 2, y: b.y}, {x: b.x + b.w / 2, y: b.y + b.h}, {x: b.x, y: b.y + b.h / 2}, {x: b.x + b.w, y: b.y + b.h / 2}];
  // segments a-b and c-d cross (proper intersection)
  const crosses = (a, b, c, d) => {
    const o = (p, q2, r2) => (q2.x - p.x) * (r2.y - p.y) - (q2.y - p.y) * (r2.x - p.x);
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  // where earlier connectors end on each part: a new one keeps its own port, >= 40 px away
  // connectors are routed one after another (each avoiding the earlier ones); when that order leaves a crossing or a
  // shared port, other orders are tried
  const routeAll = order => {
    const ends = {};
    const connPts = [];
    const res = [];
    const probs = [];
    for (const i of order) {
      const q = rels[i];
      // every candidate port pair (the venues offer each building towards the mapping sheet)
      const LA = portsOf(q.from, q.to), LB = portsOf(q.to, q.from);
      let bestAll = null;
      for (const A of LA) for (const B of LB) {
        if (bestAll && bestAll.cost < 4 && !bestAll.partHits && !bestAll.textHits && !bestAll.crossHits && !bestAll.portHits) break;
        const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
        const from0 = edgeAnchor(A, cb, 0), to0 = edgeAnchor(B, ca, 0);
        let best = null;
        // other parts, and the parts of its own two parts that are not its port (the other buildings, the rails)
        const softs = [[q.from, q.to], [q.to, q.from]].flatMap(([id, o]) => (parts[id].soft ? parts[id].soft(o) : []));
        // (and a part's other pieces of art — the venues' other buildings — with a clear margin)
        const sameBox = (a, b) => Math.abs(a.x + 4 - b.x) < 1 && Math.abs(a.y + 4 - b.y) < 1;
        const siblings = [[q.from, A], [q.to, B]].flatMap(([id, port]) => (parts[id].artBoxes || []).filter(b => !sameBox(b, port)).map(b => ({x: b.x - 10, y: b.y - 14, w: b.w + 20, h: b.h + 14})));
        const others = [...EL.filter(id => id !== q.from && id !== q.to).map(partBox), ...siblings, ...[[q.from, q.to], [q.to, q.from]].flatMap(([id, o]) => (parts[id].obstacles ? parts[id].obstacles(o) : []))];
        const prevBB = connPts.map(pts => { const xs = pts.map(z => z.x), ys = pts.map(z => z.y); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}; });
        // a part may forbid landing on some edges of its port (the switch: never on the rail tips)
        const onEdge = (bx, pt, e) => (e === 'right' ? Math.abs(pt.x - bx.x - bx.w) < 0.6 : e === 'left' ? Math.abs(pt.x - bx.x) < 0.6 : e === 'top' ? Math.abs(pt.y - bx.y) < 0.6 : Math.abs(pt.y - bx.y - bx.h) < 0.6);
        const banned = (id, bx, pt) => (parts[id].noEdge || []).some(e => onEdge(bx, pt, e));
        const score = (from, to, bend, extra) => {
          if (banned(q.from, A, from) || banned(q.to, B, to)) return;
          // the curve's points are computed as the scan goes (most candidates stop early)
          const dx = to.x - from.x, dy = to.y - from.y;
          const c1x = from.x + dx * 0.3 - dy * bend, c1y = from.y + dy * 0.3 + dx * bend, c2x = from.x + dx * 0.7 - dy * bend, c2y = from.y + dy * 0.7 + dx * bend;
          const pts = [from];
          const ptAt = j => { const t = j / 40, m = 1 - t; return {x: m * m * m * from.x + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * to.x, y: m * m * m * from.y + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * to.y}; };
          let cost = Math.abs(bend) * 2 + extra;
          let partHits = 0, textHits = 0, crossHits = 0, portHits = 0;
          for (const [pt, id] of [[from, q.from], [to, q.to]]) for (const e of ends[id] || []) {
            const d = Math.hypot(e.x - pt.x, e.y - pt.y);
            if (d < 40) { cost += 12; if (d < 30) portHits++; }
          }
          for (let j = 1; j < 40; j++) {
            if (best && cost >= best.cost) return;
            const z = ptAt(j);
            pts.push(z);
            // other parts, and never outside the parts' area (the legend band below it carries the key)
            if (others.some(ob => inBox(z, ob, 4)) || z.x < 4 || z.y < 4 || z.x > D.w - 4 || z.y > area.y + area.h - 4) { cost += 10; partHits++; }
            const nearEnd = Math.hypot(z.x - from.x, z.y - from.y) < 10 || Math.hypot(z.x - to.x, z.y - to.y) < 10;
            if (!nearEnd && allTexts.some(tb => inBox(z, tb, 2))) { cost += 8; textHits++; }
            if (!nearEnd && (inBox(z, A, -2) || inBox(z, B, -2))) cost += 2;
            if (softs.some(ob => inBox(z, ob, 2))) cost += 3;
            if (prevBB.some((bb, pi) => inBox(z, bb, 18) && connPts[pi].some(w => Math.abs(w.x - z.x) < 18 && Math.abs(w.y - z.y) < 18 && Math.hypot(w.x - z.x, w.y - z.y) < 18))) cost += 3;
            // connectors never cross one another
            const z0 = pts[j - 1];
            for (let pi = 0; pi < connPts.length; pi++) {
              if (!inBox(z, prevBB[pi], 2) && !inBox(z0, prevBB[pi], 2)) continue;
              const P = connPts[pi];
              for (let m = 1; m < P.length; m++) if (crosses(z0, z, P[m - 1], P[m])) { cost += 14; crossHits++; }
            }
          }
          pts.push(to);
          if (Math.hypot(to.x - from.x, to.y - from.y) < 60) cost += 4;
          if (!best || cost < best.cost) best = {from, to, bend, pts, cost, partHits, textHits, crossHits, portHits};
        };
        const slides = [[0, 0], ...[0.15, -0.15, 0.3, -0.3].flatMap(f => [[f, 0], [0, f], [f, f], [f, -f]])];
        for (const [fa, fb] of slides) {
          if (best && best.cost < 3) break;
          const from = slideOn(A, from0, fa), to = slideOn(B, to0, fb);
          for (const bend of [0, 0.1, -0.1, 0.2, -0.2]) score(from, to, bend, (Math.abs(fa) + Math.abs(fb)) * 2);
        }
        if (!best || best.partHits || best.textHits || best.crossHits || best.portHits) {
          // other edges of the two ports
          for (const ma of mids(A)) for (const mb of mids(B)) for (const [fa, fb] of [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3], [0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) {
            const from = slideOn(A, ma, fa), to = slideOn(B, mb, fb);
            for (const bend of [0, 0.15, -0.15, 0.3, -0.3, 0.45, -0.45]) score(from, to, bend, 3 + (Math.abs(fa) + Math.abs(fb)) * 2);
          }
        }
        if (best && (!bestAll || best.cost < bestAll.cost)) bestAll = {...best, A, B};
      }
      let best = bestAll;
      const A = bestAll ? bestAll.A : LA[0], B = bestAll ? bestAll.B : LB[0];
      const from0 = edgeAnchor(A, {x: B.x + B.w / 2, y: B.y + B.h / 2}, 0), to0 = edgeAnchor(B, {x: A.x + A.w / 2, y: A.y + A.h / 2}, 0);
      if (!best) best = {from: from0, to: to0, bend: 0, pts: bezier(from0, to0, 0), cost: 99, partHits: 1, textHits: 0, crossHits: 0, portHits: 0};
      if (best.partHits > 0 || best.textHits > 0) probs.push(`route${i}`);
      if (best.crossHits > 0) probs.push(`cross${i}`);
      if (best.portHits > 0) probs.push(`port${i}`);
      (ends[q.from] = ends[q.from] || []).push(best.from);
      (ends[q.to] = ends[q.to] || []).push(best.to);
      connPts.push(best.pts);
      res[i] = {best, A, B};
    }
    return {res, probs};
  };
  const idx = rels.map((_, i) => i);
  const orders = [idx, idx.slice().reverse(), ...idx.slice(1).map(k => [...idx.slice(k), ...idx.slice(0, k)])];
  let routed = null;
  for (const [k, ord] of orders.entries()) {
    const R = routeAll(ord);
    if (!routed || R.probs.length < routed.probs.length) routed = R;
    if (!R.probs.length) break;
    // a blocked route (through a part or a text) is rarely freed by another order: three orders at most then
    if (k >= 2 && routed.probs.some(pr => pr.startsWith('route'))) break;
  }
  problems.push(...routed.probs);
  rels.forEach((q, i) => {
    const {best, A, B} = routed.res[i];
    const c = connector(ctx, {name: `cn${i}`, from: best.from, to: best.to, kind: q.kind, bend: best.bend, color: kindColor(ctx, q.kind)});
    connPts.push(best.pts);
    const pid = (id, o, box) => (parts[id].portId ? parts[id].portId(o, centreOf(o), box) : id);
    conns.push({...c, kind: q.kind, a: q.from, b: q.to, rel: q, portA: A, portB: B, ports: [pid(q.from, q.to, A), pid(q.to, q.from, B)]});
  });
  const edgeD = (bx, q) => Math.min(Math.abs(q.x - bx.x), Math.abs(q.x - bx.x - bx.w), Math.abs(q.y - bx.y), Math.abs(q.y - bx.y - bx.h));
  const gaps = conns.map(c => r(Math.max(edgeD(c.portA, c.from), edgeD(c.portB, c.to)), 1));
  // ---- relation labels: beside their own connector, clear of parts, texts and other connectors
  const relLabels = [];
  const hard = EL.map(id => partBox(id));
  const connBB = connPts.map(pts => { const xs = pts.map(z => z.x), ys = pts.map(z => z.y); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}; });
  const placedL = [];
  const leaders = [];
  // a chip never sits on an earlier label's leader (each leader reaches only its own chip)
  const crossesLeader = b => leaders.some(ld => { for (let m = 0; m <= 20; m++) { if (inBox({x: lerp(ld.a.x, ld.b.x, m / 20), y: lerp(ld.a.y, ld.b.y, m / 20)}, b, 8)) return true; } return false; });
  if (showAll) {
    conns.forEach((c, i) => {
      const own = c.rel.label ? (c.rel.kind === 'relation' ? c.rel.label : `${c.rel.label} · ${p.relationLabels[c.rel.kind]}`) : p.relationLabels[c.rel.kind];
      let bestL = null;
      for (const wk of [1, 0.7, 1.4, 0.5, 0.36]) {
        const f = fitG(own, {maxWidth: (230 / px) * wk, size: F, minSize: F, maxLines: 3, weight: 600});
        if (f.truncated || (f.lines.length > 1 && f.lines[f.lines.length - 1].trim().length <= 3)) continue;
        const w = f.width + F * 1.1, hh = f.height + F * 0.7;
        for (const t0 of [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78, 0.15, 0.85]) {
          const q = c.at(t0);
          const nx = -Math.sin(q.a), ny = Math.cos(q.a);
          for (const side of [1, -1]) {
            for (const off of [6, 14, 24, 36, 50]) {
              const ext = Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2 + off;
              const b = {x: q.x + nx * side * ext - w / 2, y: q.y + ny * side * ext - hh / 2, w, h: hh};
              if (b.x < 2 || b.y < 2 || b.x + w > D.w - 2 || b.y + hh > area.y + area.h - 2) continue;
              if (hard.some(o => overlaps(b, o, 4)) || placedL.some(o => overlaps(b, o, 8))) continue;
              if (connBB.some((bb, j) => overlaps(bb, b, 5) && connPts[j].some(z => inBox(z, b, 5)))) continue;
              if (crossesLeader(b)) continue;
              const dOwn = Math.min(...connPts[i].map(z => boxDist(b, z)));
              if (connPts.some((pts, j) => j !== i && Math.min(...pts.map(z => boxDist(b, z))) < dOwn + 6)) continue;
              const cost = Math.abs(t0 - 0.5) * 4 + off / 20 + (wk !== 1 ? 1 : 0);
              if (!bestL || cost < bestL.cost) bestL = {b, f, cost};
            }
          }
        }
        if (bestL) break;
      }
      if (!bestL) {
        // second pass: further out, tied to its connector by a thin leader that crosses no part and no label
        for (const lw of [240, 180, 320]) {
        if (bestL) break;
        const f = fitG(own, {maxWidth: lw / px, size: F, minSize: F, maxLines: 3, weight: 600});
        if (f.truncated) continue;
        const w = f.width + F * 1.1, hh = f.height + F * 0.7;
        for (const t0 of [0.5, 0.35, 0.65, 0.2, 0.8]) {
          const q = c.at(t0);
          for (let ang = 0; ang < 360; ang += 30) {
            for (const dist of [60, 90, 130, 180, 240]) {
              const cx0 = q.x + Math.cos((ang * Math.PI) / 180) * dist, cy0 = q.y + Math.sin((ang * Math.PI) / 180) * dist;
              const b = {x: cx0 - w / 2, y: cy0 - hh / 2, w, h: hh};
              if (b.x < 2 || b.y < 2 || b.x + w > D.w - 2 || b.y + hh > area.y + area.h - 2) continue;
              if (hard.some(o => overlaps(b, o, 4)) || placedL.some(o => overlaps(b, o, 8))) continue;
              if (connPts.some(pts => pts.some(z => inBox(z, b, 5)))) continue;
              if (crossesLeader(b)) continue;
              const near = {x: clamp(q.x, b.x, b.x + b.w), y: clamp(q.y, b.y, b.y + b.h)};
              let clear = true;
              // the leader crosses no part, label or text, and keeps clear of every other connector and leader (never
              // a shared leader)
              for (let j = 1; j < 20 && clear; j++) {
                const z = {x: lerp(q.x, near.x, j / 20), y: lerp(q.y, near.y, j / 20)};
                if (hard.some(o => inBox(z, o, 2)) || placedL.some(o => inBox(z, o, 2)) || allTexts.some(o => inBox(z, o, 2))) clear = false;
                else if (j > 2 && connPts.some((pts, k2) => k2 !== i && pts.some(w => Math.hypot(w.x - z.x, w.y - z.y) < 14))) clear = false;
                else if (leaders.some(ld => { for (let m = 0; m <= 10; m++) { const w = {x: lerp(ld.a.x, ld.b.x, m / 10), y: lerp(ld.a.y, ld.b.y, m / 10)}; if (Math.hypot(w.x - z.x, w.y - z.y) < 14) return true; } return false; })) clear = false;
              }
              if (!clear) continue;
              const cost = dist / 40 + Math.abs(t0 - 0.5) * 3;
              if (!bestL || cost < bestL.cost) bestL = {b, f, cost, leader: {a: q, b: near}};
            }
          }
        }
        }
      }
      if (!bestL) { problems.push(`label${i}`); const f = fitG(own, {maxWidth: 230 / px, size: F, minSize: F, maxLines: 3, weight: 600}); const q = c.at(0.5); bestL = {b: {x: q.x + 8, y: q.y + 8, w: f.width + F * 1.1, h: f.height + F * 0.7}, f}; }
      placedL.push(bestL.b);
      if (bestL.leader) leaders.push(bestL.leader);
      const col = kindColor(ctx, c.rel.kind);
      relLabels.push({i, name: `rl${i}`, box: bestL.b, node: g({name: `rl${i}`, opacity: 0},
        bestL.leader ? h('path', {name: `rl${i}-leader`, d: `M${r(bestL.leader.a.x)} ${r(bestL.leader.a.y)}L${r(bestL.leader.b.x)} ${r(bestL.leader.b.y)}`, stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null,
        h('path', {name: `rl${i}-chip`, d: roundRectPath(bestL.b.x, bestL.b.y, bestL.b.w, bestL.b.h, Math.min(bestL.b.h / 2, F * 0.7)), fill: th.card, stroke: col, 'stroke-width': 2}),
        textAt(bestL.f, bestL.b.x + F * 0.55, bestL.b.y + F * 0.35, th.ink))});
    });
  }
  const labelsClear = relLabels.every(a => !relLabels.some(b => b !== a && overlaps(a.box, b.box, 2)) && !hard.some(o => overlaps(a.box, o, 0)));
  // ---- tracer route through the supplied order
  const route = tracerRoute(p.traversalOrder, conns, id => anchorOf(id));
  const visits = route.visits.map(v => ({id: v.id, u: lerp(W.trace[0], W.trace[1], v.t === 0 ? 0 : invSine(v.t))}));
  const tracerNode = g({name: 'tracer', opacity: 0},
    h('circle', {r: 19, fill: th.accent, opacity: 0.22}),
    h('circle', {r: 10, fill: th.accent, stroke: th.paper, 'stroke-width': 3}));
  // ---- legend band
  let legend = null;
  if (legendItems.length || keyFit) {
    const y0 = area.y + area.h + F * 0.5;
    const nodes = [];
    let x = 0;
    for (const q of legendItems) {
      const st = LINK_STYLES[q.kd];
      const col = kindColor(ctx, q.kd);
      const yl = y0 + Fc * 0.6;
      nodes.push(h('path', {d: `M${r(x)} ${r(yl)}h44`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}));
      if (st.endDots) nodes.push(h('circle', {cx: r(x), cy: r(yl), r: st.width * 1.6, fill: col}), h('circle', {cx: r(x + 44), cy: r(yl), r: st.width * 1.6, fill: col}));
      if (st.arrow) nodes.push(h('path', {d: `M${r(x + 50)} ${r(yl)}l-12 -7v14z`, fill: col}));
      nodes.push(textAt(q.fit, x + 60, y0, th.fg));
      x += 60 + q.fit.width + F * 1.4;
    }
    if (keyFit) {
      const kx = keyBelow ? 0 : Math.max(x, D.w - keyFit.width - 4);
      nodes.push(textAt(keyFit, kx, keyBelow ? y0 + kindsH + F * 0.4 : y0, th.fgSoft, {italic: true}));
      if (kx + keyFit.width > D.w + 0.5) problems.push('legend-width');
    }
    legend = {node: g({name: 'legend', opacity: 0}, nodes), box: {x: 0, y: y0, w: D.w, h: lgH}};
  }
  // ---- the "separate" beat: the parts start drawn closer to the centre, never overlapping
  const cluster = {x: area.x + area.w / 2, y: area.y + area.h / 2};
  const centerOf = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
  let sepF = 0;
  for (const f of [0.16, 0.13, 0.1, 0.08, 0.06, 0.04, 0.03, 0.02]) {
    const moved = EL.map(id => { const c = centerOf(partBox(id)); const b = partBox(id); return {...b, x: b.x + (cluster.x - c.x) * f, y: b.y + (cluster.y - c.y) * f}; });
    if (!moved.some((a, i) => moved.some((b, j) => j > i && overlaps(a, b, 10)))) { sepF = f; break; }
  }
  const sepOff = {};
  for (const id of EL) { const c = centerOf(partBox(id)); sepOff[id] = {x: (cluster.x - c.x) * sepF, y: (cluster.y - c.y) * sepF}; }
  for (const id of EL) parts[id].center = centerOf(partBox(id));
  // the focus part grows by up to 12 %, never past the design box
  const maxGrow = {};
  for (const id of EL) {
    const b = partBox(id), c = parts[id].center;
    const lim = [c.x / (c.x - b.x), (D.w - c.x) / (b.x + b.w - c.x), c.y / (c.y - b.y), (D.h - c.y) / (b.y + b.h - c.y)].filter(v => Number.isFinite(v) && v > 0);
    maxGrow[id] = Math.max(1, Math.min(1.12, ...lim.map(v => v * 0.995)));
  }
  // ---- audit: texts in frame
  const texts = [...EL.flatMap(id => parts[id].texts), ...relLabels.map(q => q.box)];
  if (texts.some(b => b.x < -0.5 || b.y < -0.5 || b.x + b.w > D.w + 0.5 || b.y + b.h > D.h + 0.5)) problems.push('frame');
  return {F, px, parts, conns, relLabels, labelsClear, maxGrow, poly: route.poly, visits, tracerNode, legend, sepOff, sepF, gaps, res, problems};
}

function inBox(z, b, pad = 0) { return z.x > b.x - pad && z.x < b.x + b.w + pad && z.y > b.y - pad && z.y < b.y + b.h + pad; }
const boxDist = (b, p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h)));
function invSine(v) { return Math.acos(1 - 2 * clamp(v)) / Math.PI; }

/** Tracer path through part ids: along a connector when one links consecutive ids, else a straight hop. */
function tracerRoute(order, conns, boxOf) {
  const pts = [];
  const visits = [];
  const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
  order.forEach((id, i) => {
    if (i === 0) { pts.push(center(boxOf(id))); visits.push({id, idx: 0}); return; }
    const prev = order[i - 1];
    const link = conns.find(c => (c.a === prev && c.b === id) || (c.a === id && c.b === prev));
    if (link) {
      const fwd = link.a === prev;
      for (let k = 0; k <= 30; k++) pts.push(link.at(fwd ? k / 30 : 1 - k / 30));
    } else {
      pts.push(edgeAnchor(boxOf(prev), center(boxOf(id))), edgeAnchor(boxOf(id), center(boxOf(prev))));
    }
    pts.push(center(boxOf(id)));
    visits.push({id, idx: pts.length - 1});
  });
  const poly = polyline(pts);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  return {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
}

/* ------------------------------------------------------------------ */
/* Parts. Each returns {node (group el-<id>), box, texts, problems, frame(k)} */
/* ------------------------------------------------------------------ */

/** Part title: a small caption chip at the top of the part box. */
function title(ctx, text, b, F, px, show, maxW = Infinity) {
  if (!show) return {h: 0, node: null, box: null, truncated: false};
  let f = fitG(text, {maxWidth: Math.min(b.w, 420 / px, maxW) - F * 1.1, size: F, minSize: F, maxLines: 2, weight: 700});
  if (f.truncated && maxW < Infinity) f = fitG(text, {maxWidth: Math.min(b.w, 420 / px) - F * 1.1, size: F, minSize: F, maxLines: 2, weight: 700});
  const w = f.width + F * 1.1, hh = f.height + F * 0.6;
  const x = b.x, y = b.y;
  return {h: hh + F * 0.35, truncated: f.truncated, box: {x, y, w, h: hh}, node: g(null,
    h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, F * 0.6)), fill: ctx.theme.ink}),
    textAt(f, x + F * 0.55, y + F * 0.3, '#fff'))};
}

function originPart(ctx, p, b, F, Fc, px, capText, showAll, showKey) {
  const th = ctx.theme;
  const problems = [];
  const t = title(ctx, capText, b, F, px, showAll);
  const side = b.w > (b.h - t.h) * 1.6;
  const nm = showKey ? tagChip(ctx, p.courts.origin, {F, maxWidth: side ? b.w * 0.55 : b.w, maxLines: 3, weight: 700, glyph: false, stroke: th.ink}) : null;
  if (t.truncated || (nm && nm.fit.truncated)) problems.push('trunc');
  const bh = b.h - t.h - (!side && nm ? nm.h + F * 0.4 : 0);
  const bw = Math.min(side ? b.w - (nm ? nm.w + F * 0.6 : 0) : b.w, bh * 1.05);
  if (bh < 56 || bw < 50) problems.push('room');
  const bx = b.x, by = b.y + t.h;
  const bld = buildingElevation(ctx, {name: 'org-bld', x: bx, y: by, w: bw, h: Math.max(10, bh), floors: 2, bays: 4, tree: false, highlight: null});
  const nb = nm ? (side ? {x: bx + bw + F * 0.6, y: by + (bh - nm.h) / 2, w: nm.w, h: nm.h} : {x: b.x, y: by + bh + F * 0.4, w: nm.w, h: nm.h}) : null;
  const right = Math.max(bx + bw, nb ? nb.x + nb.w : 0, t.box ? t.box.x + t.box.w : 0);
  const used = {x: b.x, y: b.y, w: right - b.x, h: b.h};
  return {title: t.box, box: used, anchor: {x: bx, y: by, w: bw, h: bh}, texts: [t.box, nb].filter(Boolean), problems, frame: () => ({}),
    node: g({name: 'el-origin'}, t.node, bld.node, nm && nm.node(nb.x, nb.y, 'org-name'))};
}

function filePart(ctx, p, b, F, px, capText, showAll, showKey) {
  const th = ctx.theme;
  const problems = [];
  const t = title(ctx, capText, b, F, px, showAll);
  const top = b.y + t.h;
  const avail = {x: b.x, y: top, w: b.w, h: b.h - t.h};
  // the folder, enlarged, on the left; its name and datum on the right
  const fs = Math.min(avail.h / (64 + 20), (avail.w * 0.34) / 112, 2.6);
  if (fs < 1) problems.push('room');
  const tw = avail.w - 112 * fs - F * 0.6;
  const lab = showKey ? fitG(p.file.label, {maxWidth: tw, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  const dat = showKey ? tagChip(ctx, `${p.labels.datum}: ${p.file.datum}`, {F, maxWidth: tw, maxLines: 4, stroke: th.accent3}) : null;
  if ((lab && lab.truncated) || (dat && dat.fit.truncated) || t.truncated) problems.push('trunc');
  const textH = (lab ? lab.height + F * 0.4 : 0) + (dat ? dat.h : 0);
  if (textH > avail.h + 0.5) problems.push('room');
  const blockH = Math.max(textH, 70 * fs);
  const fx = avail.x + 45 * fs, fy = avail.y + 6 + blockH / 2 + 4 * fs;
  const tx = avail.x + 112 * fs + F * 0.6;
  const ty = avail.y + 6 + Math.max(0, (blockH - textH) / 2);
  const texts = [t.box].filter(Boolean);
  const nodes = [t.node, g({transform: `${T(fx, fy)} scale(${r(fs, 4)})`}, fileProp(ctx, {name: 'mf-file'}))];
  if (lab) { nodes.push(textAt(lab, tx, ty, th.ink)); texts.push({x: tx, y: ty, w: lab.width, h: lab.height}); }
  if (dat) { const dy = ty + (lab ? lab.height + F * 0.4 : 0); nodes.push(dat.node(tx, dy, 'mf-datum')); texts.push({x: tx, y: dy, w: dat.w, h: dat.h}); }
  const right = Math.max(tx + Math.max(lab ? lab.width : 0, dat ? dat.w : 0), avail.x + 112 * fs);
  return {title: t.box, box: {x: b.x, y: b.y, w: Math.max(right - b.x, t.box ? t.box.w : 0), h: t.h + 6 + blockH + 8}, anchor: {x: avail.x, y: avail.y, w: right - avail.x, h: 6 + blockH + 8}, texts: texts.filter(Boolean), problems, frame: () => ({}), node: g({name: 'el-file'}, nodes)};
}

/** The switch: a plan fragment of the sorting point — plaza, one branch stub per venue, the slot, a pointer. */
function switchPart(ctx, p, b, F, Fc, px, capText, res, showAll, showKey) {
  const th = ctx.theme;
  const c = planColors(ctx);
  const problems = [];
  const t = title(ctx, capText, b, F, px, showAll);
  // the junction label stands above the clerk and the left part of the plaza: the rest of the plaza's top edge stays
  // free for a connector to land on
  const pw0 = 96 * personScale(px);
  const jl = showAll ? fitG(p.labels.junction, {maxWidth: pw0 + (b.w - pw0) * 0.2, size: Fc, minSize: Fc, maxLines: 4, weight: 600}) : null;
  const sl = showAll ? fitG(p.seats.waiting, {maxWidth: b.w * 0.55, size: Fc, minSize: Fc, maxLines: 3, weight: 500}) : null;
  if (t.truncated || (jl && jl.truncated) || (sl && sl.truncated)) problems.push('trunc');
  const top = b.y + t.h;
  const ah = b.h - t.h;
  const n = res.venues.length;
  // plaza on the left, stubs to the right (one per venue, in venue order), slot below the plaza
  const jlH = jl ? jl.height + 8 : 0;
  const slotH = Math.max(sl ? sl.height : 0, 40) + 14;
  // the sorting clerk stands at the plaza's entry (left of it), facing the pointer
  const PS = personScale(px), pw = 96 * PS;
  const s0 = Math.min(ah - jlH - slotH - 4, (b.w - pw) * 0.42);
  if (s0 < 70 || s0 < pw * 0.9) problems.push('room');
  const s = Math.max(40, s0);
  const pl = {x: b.x + 6 + pw, y: top + jlH, w: s, h: s};
  const J = {x: pl.x + s / 2, y: pl.y + s / 2};
  const stubX1 = Math.min(b.x + b.w - 20, pl.x + s + Math.max(70, b.w * 0.4));
  const ys = Array.from({length: n}, (_, i) => pl.y + ((i + 0.5) / n) * s);
  const road = '#e2dccf', kerb = '#a89c86';
  const nodes = [t.node];
  nodes.push(h('path', {d: `M${r(pl.x + s)} ${r(pl.y + 6)}V${r(pl.y + s - 6)}`, stroke: kerb, 'stroke-width': 3}));
  ys.forEach((y, i) => {
    const tint = VENUE_TINTS[i % VENUE_TINTS.length];
    nodes.push(h('path', {d: `M${r(pl.x + s)} ${r(y)}H${r(stubX1)}`, stroke: road, 'stroke-width': r(Math.min(26, s / n * 0.55)), 'stroke-linecap': 'butt'}));
    nodes.push(h('rect', {x: r(stubX1 - 4), y: r(y - 12), width: 22, height: 24, rx: 4, fill: tint, stroke: shade(tint, -0.45), 'stroke-width': 2}));
  });
  nodes.push(floorArea(ctx, {x: pl.x, y: pl.y, w: s, h: s, kind: 'tiles', cell: Math.max(14, s / 5), fill: c.stone, line: shade(c.stone, -0.08)}));
  nodes.push(h('path', {d: roundRectPath(pl.x, pl.y, s, s, 6), fill: 'none', stroke: kerb, 'stroke-width': 3}));
  // the dashed waiting slot under the plaza
  const slot = {x: pl.x + s * 0.12, y: pl.y + s + 12, w: s * 0.5, h: Math.min(44, s * 0.3)};
  nodes.push(h('path', {d: roundRectPath(slot.x, slot.y, slot.w, slot.h, 8), fill: '#fff', stroke: c.frame, 'stroke-width': 3, 'stroke-dasharray': '8 6'}));
  const fk = Math.min(slot.w / 80, slot.h / 60);
  nodes.push(g({name: 'sw-file', opacity: 0, transform: `${T(slot.x + slot.w / 2, slot.y + slot.h / 2)} scale(${r(fk, 4)})`}, fileProp(ctx, {name: 'sw-file-prop'})));
  // the pointer (a needle on a pivot) — neutral until the mapping is read
  const len = s * 0.42;
  nodes.push(g({name: 'sw-pointer', transform: T(J.x, J.y, 0)},
    h('path', {d: `M0 ${r(-6)}L${r(len)} 0L0 6Z`, fill: th.inkSoft, stroke: th.ink, 'stroke-width': 1.5}),
    h('circle', {r: 8, fill: th.paper, stroke: th.ink, 'stroke-width': 2.5})));
  const sc = planPerson(ctx, {name: 'sw-clerk', look: clerkLook(ctx, p)});
  nodes.push(sc.node);
  const scPose = sc.pose({x: b.x + 6 + pw / 2, y: J.y, deg: 90, scale: PS, phase: 0, walk: 0, seated: 0});
  const texts = [t.box].filter(Boolean);
  if (jl) { const jy = top; nodes.push(textAt(jl, b.x + 6, jy, th.fg)); texts.push({x: b.x + 6, y: jy, w: jl.width, h: jl.height}); }
  if (sl) { const sx = slot.x + slot.w + 10, sy = slot.y + slot.h / 2 - sl.height / 2; nodes.push(textAt(sl, sx, sy, th.fg)); texts.push({x: sx, y: sy, w: sl.width, h: sl.height}); if (sx + sl.width > b.x + b.w + 0.5 || sy + sl.height > b.y + b.h + 0.5) problems.push('room'); }
  // pointer angles: to each stub end, or to the slot
  const angTo = q => (Math.atan2(q.y - J.y, q.x - J.x) * 180) / Math.PI;
  const target = res.selected < 0 ? {x: slot.x + slot.w / 2, y: slot.y + slot.h / 2} : {x: stubX1, y: ys[res.selected]};
  const a1 = angTo(target), a0 = -90;
  const used = {x: b.x, y: b.y, w: Math.max(stubX1 + 18, ...texts.map(q => q.x + q.w)) - b.x, h: Math.max(slot.y + slot.h, ...texts.map(q => q.y + q.h)) - b.y + 4};
  const rails = {x: pl.x + s + 4, y: pl.y + 2, w: stubX1 + 18 - pl.x - s - 4, h: s - 4};
  return {title: t.box, box: used, anchor: {x: pl.x, y: pl.y, w: stubX1 + 18 - pl.x, h: slot.y + slot.h - pl.y}, port: () => ({x: pl.x, y: pl.y, w: stubX1 + 18 - pl.x, h: s}), noEdge: ['right'], obstacles: () => [slot, {x: b.x, y: J.y - pw / 2, w: pw + 6, h: pw}], texts, problems, node: g({name: 'el-switch'}, nodes),
    frame: (k, set = 0) => ({...scPose, 'sw-pointer': {transform: T(J.x, J.y, r(lerp(a0, a1, ease.inOutCubic(k)), 2))}, 'sw-file': {opacity: r(res.selected < 0 ? set : 0, 3)}})};
}

/** The supplied mapping sheet: one row per mapping row — its datum (tag) and the venue it names. */
function mappingPart(ctx, p, b, F, px, capText, res, showAll, showKey) {
  const th = ctx.theme;
  const problems = [];
  const t = title(ctx, capText, b, F, px, showAll);
  const top = b.y + t.h;
  const pad = F * 0.6;
  // one or two columns of rows (two when the sheet is wide: a full-width row of the layout)
  const cols = b.w >= (2 * 470) / px && res.rows.length > 2 ? 2 : 1;
  const cg = F * 1.2;
  const rowW = (b.w - pad * 2 - cg * (cols - 1)) / cols;
  const rows = res.rows.map(rw => {
    const v = res.venues[rw.venue];
    const d = showKey ? tagChip(ctx, rw.datum, {F, maxWidth: rowW * 0.58, maxLines: 5}) : null;
    const nf = showKey ? fitG(v.name, {maxWidth: rowW * 0.42 - F * 1.4, size: F, minSize: F, maxLines: 5, weight: 500}) : null;
    return {rw, v, d, nf, h: showKey ? Math.max(d.h, nf.height + F * 0.3) : F * 1.6};
  });
  if (t.truncated || rows.some(q => (q.d && q.d.fit.truncated) || (q.nf && q.nf.truncated))) problems.push('trunc');
  const perCol = Math.ceil(rows.length / cols);
  const colRows = Array.from({length: cols}, (_, ci) => rows.slice(ci * perCol, (ci + 1) * perCol));
  const colH = cr => cr.reduce((a, q) => a + q.h + F * 0.35, 0);
  const sheetH = pad * 2 + Math.max(...colRows.map(colH));
  if (top + sheetH > b.y + b.h + 0.5) problems.push('room');
  const sx = b.x, sy = top;
  const nodes = [t.node,
    h('path', {d: roundRectPath(sx + 5, sy + 8, b.w, sheetH, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(sx, sy, b.w, sheetH, 12), fill: th.paper, stroke: th.ink, 'stroke-width': 2.4})];
  colRows.forEach((cr, ci) => {
    let y = sy + pad;
    const x = sx + pad + ci * (rowW + cg);
    cr.forEach(q => {
      const tint = VENUE_TINTS[q.v.index % VENUE_TINTS.length];
      const rb = {x: x - 5, y: y - 4, w: rowW + 10, h: q.h + 8};
      if (q.d) nodes.push(q.d.node(x, y + (q.h - q.d.h) / 2, `mp-row${q.rw.index}`));
      else nodes.push(g({transform: T(x + F, y + q.h / 2)}, tagGlyph(ctx, F * 1.1)));
      const nx = x + rowW * 0.58 + F * 0.5;
      nodes.push(h('path', {d: `M${r(x + (q.d ? q.d.w : F * 2) + 6)} ${r(y + q.h / 2)}H${r(nx - 6)}`, stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}));
      nodes.push(h('rect', {x: r(nx), y: r(y + q.h / 2 - F * 0.45), width: r(F * 0.7), height: r(F * 0.9), rx: 3, fill: tint, stroke: shade(tint, -0.45), 'stroke-width': 1.6}));
      if (q.nf) nodes.push(textAt(q.nf, nx + F * 1.1, y + (q.h - q.nf.height) / 2, th.ink));
      nodes.push(h('path', {name: `mp-hl${q.rw.index}`, d: roundRectPath(rb.x, rb.y, rb.w, rb.h, 10), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}));
      y += q.h + F * 0.35;
    });
  });
  const match = res.matchRow;
  return {title: t.box, box: {x: b.x, y: b.y, w: b.w, h: sheetH + t.h}, anchor: {x: sx, y: sy, w: b.w, h: sheetH}, texts: [t.box, {x: sx, y: sy, w: b.w, h: sheetH}].filter(Boolean), problems, node: g({name: 'el-mapping'}, nodes),
    frame: k => Object.fromEntries(rows.map(q => [`mp-hl${q.rw.index}`, {opacity: r(q.rw.index === match ? k : 0, 3)}]))};
}

/** The venues: generic building fronts with their names; the selected one's window lights up at the visit. */
function venuesPart(ctx, p, b, F, px, capText, res, showAll, showKey) {
  const th = ctx.theme;
  const problems = [];
  // the title keeps to the first building's cell (the other roofs stay free for links to land on)
  const t = title(ctx, capText, b, F, px, showAll, b.w > b.h ? b.w / res.venues.length + F * 0.8 : Infinity);
  const top = b.y + t.h;
  const n = res.venues.length;
  const row = b.w > b.h - t.h;
  const nodes = [t.node];
  const texts = [t.box].filter(Boolean);
  const hls = [];
  const drawn = [];
  res.venues.forEach((v, i) => {
    const cell = row ? {x: b.x + (i * b.w) / n, y: top, w: b.w / n - 10, h: b.h - t.h} : {x: b.x, y: top + (i * (b.h - t.h)) / n, w: b.w, h: (b.h - t.h) / n - 10};
    const nm = showKey ? fitG(v.name, {maxWidth: cell.w - F * 0.9, size: F, minSize: F, maxLines: 5, weight: 700}) : null;
    if (nm && nm.truncated) problems.push('trunc');
    const nh = nm ? nm.height + F * 0.6 : 0;
    const bh = cell.h - nh - 6;
    if (bh < 56) problems.push('room');
    // buildings stand apart (a clear gap of at least ~0.2 of a cell between neighbours)
    const bw = Math.min(cell.w * 0.8 - 8, bh * 1.15);
    const bx = cell.x + (cell.w - bw) / 2;
    const tint = VENUE_TINTS[i % VENUE_TINTS.length];
    const bld = buildingElevation(ctx, {name: `mv-bld${i}`, x: bx, y: cell.y, w: bw, h: Math.max(10, bh), floors: 2, bays: 3, tree: false, highlight: {floor: 0, bay: 0}});
    drawn.push({x: bx, y: cell.y, w: bw, h: bh + 6});
    nodes.push(bld.node);
    hls.push(`mv-bld${i}-hl`);
    // tint band under the building (the venue's colour in the mapping sheet and the switch)
    nodes.push(h('rect', {x: r(bx), y: r(cell.y + bh + 1), width: r(bw), height: 5, fill: tint, stroke: shade(tint, -0.45), 'stroke-width': 1}));
    if (nm) {
      const nx = cell.x + (cell.w - nm.width) / 2, ny = cell.y + bh + 8 + F * 0.1;
      nodes.push(textAt(nm, nx + (nm.lines.length > 1 ? 0 : 0), ny, th.ink));
      texts.push({x: nx, y: ny, w: nm.width, h: nm.height});
    }
  });
  if (t.truncated) problems.push('trunc');
  const sel = res.selected;
  const all = [...drawn, ...texts.filter(Boolean)];
  const x0 = Math.min(...all.map(q => q.x)), y0 = Math.min(...all.map(q => q.y));
  const tight = {x: x0, y: y0, w: Math.max(...all.map(q => q.x + q.w)) - x0, h: Math.max(...all.map(q => q.y + q.h)) - y0};
  const artX0 = Math.min(...drawn.map(q => q.x)), artY0 = Math.min(...drawn.map(q => q.y));
  const art = {x: artX0, y: artY0, w: Math.max(...drawn.map(q => q.x + q.w)) - artX0, h: Math.max(...drawn.map(q => q.y + q.h)) - artY0};
  // towards the desk the link leaves the matched venue's building (when a row matches); else the row of buildings
  // towards the desk: the matched venue's building; towards any other part: the building nearest to it (a link
  // always lands on a building, never on the gap between two)
  const port = (other, oc) => {
    if (other === 'room' && sel >= 0) return drawn[sel];
    if (!oc) return drawn[0];
    const d = q => Math.hypot(q.x + q.w / 2 - oc.x, q.y + q.h / 2 - oc.y);
    return drawn.slice().sort((a, b) => d(a) - d(b))[0];
  };
  // towards the desk the other buildings are kept at a clear distance (the link never reads as touching them)
  const obstacles = other => (other === 'room' && sel >= 0 ? drawn.filter((_, i) => i !== sel).map(q => ({x: q.x - 18, y: q.y - 22, w: q.w + 36, h: q.h + 22})) : []);
  const ports = other => (other === 'room' && sel >= 0 ? [drawn[sel]] : drawn);
  const portId = (other, oc, box) => `venue${box ? drawn.findIndex(q => Math.abs(q.x + 4 - box.x) < 1 && Math.abs(q.y + 4 - box.y) < 1) : drawn.indexOf(port(other, oc))}`;
  return {title: t.box, box: tight, anchor: art, port, ports, portId, obstacles, artBoxes: drawn, texts, problems, node: g({name: 'el-venues'}, nodes),
    frame: k => Object.fromEntries(hls.map((nm, i) => [nm, {opacity: r(i === sel ? k : 0, 3)}]))};
}

/** The receiving room: a plan of a desk with its in-tray; the file lies in it once the tracer arrives. */
function roomPart(ctx, p, b, F, Fc, px, capText, res, showAll, showKey) {
  const th = ctx.theme;
  const c = planColors(ctx);
  const problems = [];
  const t = title(ctx, capText, b, F, px, showAll);
  // wide cells: the caption sits beside the plan, so the plan takes the full height
  const side = b.w > (b.h - t.h) * 1.7;
  const sideS = b.h - t.h;
  const ar = showAll ? fitG(p.seats.arrival, {maxWidth: side ? b.w - sideS - F : b.w, size: Fc, minSize: Fc, maxLines: 4, weight: 500}) : null;
  if (t.truncated || (ar && ar.truncated)) problems.push('trunc');
  const top = b.y + t.h;
  const ah = side ? sideS : b.h - t.h - (ar ? ar.height + F * 0.4 : 0);
  const s = Math.max(40, Math.min(ah, b.w));
  if (Math.min(ah, b.w) < 80) problems.push('room');
  const rx = b.x, ry = top;
  const k = s / 200;
  const nodes = [t.node,
    floorArea(ctx, {x: rx + 10 * k, y: ry + 10 * k, w: 180 * k, h: 180 * k, kind: 'tiles', cell: 36 * k, fill: VENUE_TINTS[Math.max(0, res.selected) % VENUE_TINTS.length]}),
    wallRing(ctx, {x: rx + 10 * k, y: ry + 10 * k, w: 180 * k, h: 180 * k, t: 10 * k, gaps: [{side: 'left', a: ry + 70 * k, b: ry + 130 * k, kind: 'door'}]}),
    planTable(ctx, {cx: rx + 80 * k, cy: ry + 100 * k, w: 40 * k, h: 110 * k, seedKey: 'mroom'}),
    h('path', {d: roundRectPath(rx + 60 * k, ry + 78 * k, 40 * k, 44 * k, 4), fill: shade(c.wood, 0.1), stroke: '#1f2328', 'stroke-width': 1.8}),
    g({name: 'mr-file', opacity: 0, transform: `${T(rx + 80 * k, ry + 100 * k, 90)} scale(${r(0.62 * k, 4)})`}, fileProp(ctx, {name: 'mr-file-prop'})),
  ];
  // the receiving clerk, seated at the desk facing it (inside the room's walls)
  const PS = personScale(px);
  const cx = rx + 100 * k + 36 * PS;
  if (cx + 44 * PS > rx + 180 * k) problems.push('room');
  nodes.push(planChair(ctx, {cx, cy: ry + 100 * k, deg: 270, s: 60 * PS}));
  const rc = planPerson(ctx, {name: 'mr-clerk', look: clerkLook(ctx, p)});
  nodes.push(rc.node);
  const rcPose = rc.pose({x: cx, y: ry + 100 * k, deg: 270, scale: PS, phase: 0, walk: 0, seated: 1});
  const texts = [t.box].filter(Boolean);
  if (ar) {
    const ax = side ? rx + s + F * 0.6 : rx, ay = side ? ry + (s - ar.height) / 2 : ry + s + F * 0.4;
    nodes.push(textAt(ar, ax, ay, th.fg)); texts.push({x: ax, y: ay, w: ar.width, h: ar.height});
  }
  const setDown = res.selected >= 0;
  const rw = side ? s + (ar ? F * 0.6 + ar.width : 0) : Math.max(s, ar ? ar.width : 0);
  return {title: t.box, box: {x: b.x, y: b.y, w: Math.max(rw, t.box ? t.box.w : 0), h: t.h + s + (!side && ar ? ar.height + F * 0.4 : 0)}, anchor: {x: rx + 10 * k, y: ry + 10 * k, w: 180 * k, h: 180 * k}, texts, problems, node: g({name: 'el-room'}, nodes),
    frame: k2 => ({...rcPose, 'mr-file': {opacity: r(setDown ? k2 : 0, 3)}})};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-03-mechanism',
    title: 'Venue assignment — the parts of the sending and how the supplied data connect them',
    titleEs: 'Asignación de órgano — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Asignación de órgano',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The sending decomposed into an intake office, the case file with its datum tag, a switch at the sorting point, the supplied mapping sheet, the generic venues and a receiving desk. Only supplied relationships are drawn (plain relations by default); a tracer follows the supplied order; at the mapping sheet the row whose datum equals the file datum is outlined and the switch pointer turns to that venue\'s branch (or to the waiting slot when none matches). No venue is ranked or sends to another; no outcome is shown.',
    tags: ['mechanism', 'venue', 'mapping', 'case file', 'switch', 'connectors', 'tracer', 'relation', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
