/**
 * LAW-0206 — Jerarquía judicial editable · mechanism
 *
 * Storyboard (an exploded diagram, not a row of boxes): the SUPPLIED hierarchy
 * as a plan sheet (planos: one row per supplied level, lowest at the bottom,
 * each with its bodies and the supplied links between them), the building of
 * a body on the origin level and the building of a body on the configured
 * review level (each on a podium whose height follows its supplied level),
 * the plan of one room of the origin building (salas) and the people who sit
 * in it (personas):
 *  0.00–0.18  separate: the pieces start gathered near the middle and slide
 *             apart to their places; their captions appear once they are apart.
 *  0.18–0.43  only the explicit relationships are drawn, one by one, each
 *             anchored to the edges of its two pieces (a plan row → the building
 *             of that level). A plain relation has dots and no arrow; an arrow
 *             only for a relationship supplied as communication, sequence or
 *             causal. Each carries its relation caption.
 *  0.43–0.75  a tracer follows the relationships in the supplied traversal
 *             order; when it reaches the supplied focus element, that element
 *             enlarges (its connectors stay attached).
 *  0.75–1.00  the mechanism is held together: origin (the plan), transformation
 *             (the buildings on their levels) and state (level tags under both
 *             buildings) stay visible with the key "as supplied · no conclusion
 *             drawn". Nothing says that any review happens or has an effect.
 * @module animations/courts/LAW-0206
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, cubicPolyline, polyline} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {mechanismFields} from '../../schemas/fields.js';
import {tracer} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {actorLook} from '../../primitives/people-style.js';
import {buildingElevation, planPerson, planColors} from './kits/courts-art.js';
import {
  hierFields, HIER_STRINGS, resolveHier, pxPerUnit, fitG, fitOk, cardH, labelCard, textAt, roomPad, padSize, lookFor, applyStatic, overlaps, R2,
} from './kits/jerarquia-editable.js';

const ID = 'LAW-0206';
const DURATION = 7000;
const IDS = ['plan', 'origin', 'review', 'room', 'people'];
const W = {apart: [0.02, 0.16], caps: [0.165, 0.2], rels: [0.19, 0.42], trace: [0.44, 0.74], focus: 0.24, state: [0.75, 0.8], key: [0.77, 0.82]};

const STRINGS = {
  en: {...HIER_STRINGS.en, originTag: 'Level', reviewTag: 'Level'},
  es: {...HIER_STRINGS.es, originTag: 'Nivel', reviewTag: 'Nivel'},
};

const base = hierFields({maxBodies: 4, maxLevels: 4, labelMax: 40, levelMax: 40, maxSeats: 2});
const sceneSchema = {
  ...base,
  ...mechanismFields(IDS),
};
// shorter element labels than the generic builder allows
sceneSchema.elements = list('Component labels; ids are fixed by the scene (plan, origin, review, room, people), labels are editable', obj('Component', {
  id: oneOf('Component id', IDS),
  label: str('Visible label', 44),
}, ['id', 'label']), 2, IDS.length);

const defaultParams = {
  courts: {
    levels: [{name: 'Origin level (as configured)'}, {name: 'Level 2 (as configured)'}, {name: 'Configured review level'}],
    bodies: [
      {label: 'Origin body A (fictional)', level: 1},
      {label: 'Level 2 body (fictional)', level: 2},
      {label: 'Review body (as configured)', level: 3},
    ],
  },
  routes: [{from: 0, to: 1, kind: 'relation'}, {from: 1, to: 2, kind: 'relation'}],
  seats: 2,
  labels: {note: 'Supplied hierarchy (illustrative)', key: 'Relations as supplied · no conclusion drawn'},
  people: [],
  elements: [
    {id: 'plan', label: 'Plan of the supplied levels'},
    {id: 'origin', label: 'Building on the origin level'},
    {id: 'review', label: 'Building on the configured review level'},
    {id: 'room', label: 'A room of the origin building'},
    {id: 'people', label: 'People in that room (fictional)'},
  ],
  relationships: [
    {from: 'plan', to: 'origin', kind: 'relation'},
    {from: 'plan', to: 'review', kind: 'relation'},
    {from: 'origin', to: 'room', kind: 'relation'},
  ],
  focusElement: 'plan',
  relationLabels: {relation: 'Relation (as configured)', communication: 'Communication (as supplied)', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['people', 'room', 'origin', 'plan', 'review'],
};

/** Slot arrangements (fractions of the design box) per layout shape; the layout keeps the best one. */
const SLOTS = {
  landscape: [
    {plan: [0, 0, 0.27, 1], origin: [0.34, 0.4, 0.17, 0.6], review: [0.53, 0.0, 0.17, 0.6], room: [0.73, 0.28, 0.27, 0.72]},
    {plan: [0, 0, 0.27, 1], origin: [0.35, 0.46, 0.16, 0.54], review: [0.54, 0.0, 0.16, 0.54], room: [0.74, 0.3, 0.26, 0.7]},
    {plan: [0, 0, 0.3, 1], origin: [0.37, 0.42, 0.16, 0.58], review: [0.56, 0.0, 0.16, 0.58], room: [0.76, 0.28, 0.24, 0.72]},
    {plan: [0, 0, 0.25, 1], origin: [0.4, 0.42, 0.15, 0.58], review: [0.58, 0.0, 0.15, 0.58], room: [0.76, 0.28, 0.24, 0.72]},
  ],
  portrait: [
    {plan: [0, 0, 1, 0.34], origin: [0.02, 0.5, 0.44, 0.24], review: [0.54, 0.36, 0.44, 0.24], room: [0.18, 0.76, 0.64, 0.24]},
    {plan: [0, 0, 1, 0.38], origin: [0.02, 0.52, 0.44, 0.23], review: [0.54, 0.4, 0.44, 0.23], room: [0.18, 0.77, 0.64, 0.23]},
  ],
  square: [
    {plan: [0, 0, 0.62, 0.56], review: [0.7, 0.0, 0.3, 0.52], origin: [0, 0.62, 0.32, 0.38], room: [0.6, 0.56, 0.4, 0.44]},
    {plan: [0, 0, 0.58, 0.56], review: [0.72, 0.0, 0.28, 0.52], origin: [0, 0.62, 0.32, 0.38], room: [0.6, 0.56, 0.4, 0.44]},
    {plan: [0, 0, 0.66, 0.6], review: [0.74, 0.0, 0.26, 0.54], origin: [0, 0.66, 0.32, 0.34], room: [0.6, 0.6, 0.4, 0.4]},
    {plan: [0, 0, 0.62, 0.66], review: [0.74, 0.0, 0.26, 0.56], origin: [0, 0.71, 0.32, 0.29], room: [0.62, 0.62, 0.38, 0.38]},
    {plan: [0, 0, 0.66, 0.68], review: [0.74, 0.0, 0.26, 0.58], origin: [0, 0.73, 0.3, 0.27], room: [0.6, 0.64, 0.4, 0.36]},
    {plan: [0, 0, 0.6, 0.62], room: [0.68, 0.0, 0.32, 0.5], origin: [0, 0.68, 0.3, 0.32], review: [0.64, 0.56, 0.36, 0.44]},
    {plan: [0, 0, 0.56, 0.7], review: [0.72, 0.0, 0.28, 0.56], origin: [0, 0.74, 0.34, 0.26], room: [0.58, 0.62, 0.42, 0.38]},
    {plan: [0, 0, 0.54, 0.72], review: [0.74, 0.0, 0.26, 0.58], origin: [0, 0.76, 0.36, 0.24], room: [0.58, 0.64, 0.42, 0.36]},
  ],
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    let best = null;
    const px = pxPerUnit(ctx);
    for (let F = 21.5 / px; F >= 16.6 / px - 1e-6; F -= (F * px > 20.2 ? 0.8 : 0.4) / px) {
      for (const slots of SLOTS[ctx.view.shape]) {
        const L = compose(ctx, F, px, slots);
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length) break;
      }
      if (!best.problems.length) break;
    }
    return best;
  },
  build(ctx, L) {
    return g(null,
      L.els.map(e => g({name: `el-${e.id}`}, g({name: `el-${e.id}-art`}, e.art), e.caption && g({name: `el-${e.id}-cap`, opacity: 0}, e.caption.node), e.state && g({name: `el-${e.id}-state`, opacity: 0}, e.state.node))),
      L.rels.map(c => c.node),
      L.rels.map(c => c.labNode),
      L.key && g({name: 'key', opacity: 0}, L.key),
      tracer(ctx, 'tracer', ctx.theme.accent),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    // separate: pieces slide apart from the middle
    const ap = ease.inOutCubic(seg(u, ...W.apart));
    const capP = seg(u, ...W.caps);
    // focus: enlarges when the tracer reaches it (and stays enlarged)
    const route = L.route;
    const trP = seg(u, ...W.trace);
    const focusVisit = route.visits.find(v => v.id === p.focusElement);
    const tv = focusVisit ? Math.min(0.9, focusVisit.t) : 0;
    const fz = focusVisit ? ease.inOutCubic(seg(trP, Math.max(0.001, tv - 0.06), tv + 0.1)) : 0;
    const boxes = {};
    for (const e of L.els) {
      const off = {x: (L.centre.x - e.c.x) * L.gather * (1 - ap), y: (L.centre.y - e.c.y) * L.gather * (1 - ap)};
      const s = e.id === p.focusElement ? 1 + W.focus * fz : 1;
      nodes[`el-${e.id}`] = {transform: `${T(off.x, off.y)} ${scaleAbout(e.c.x, e.c.y, r(s, 4))}`};
      if (e.caption) nodes[`el-${e.id}-cap`] = {opacity: r(capP, 3)};
      if (e.state) nodes[`el-${e.id}-state`] = {opacity: r(seg(u, ...W.state), 3)};
      const b = e.full;
      boxes[e.id] = {x: e.c.x + (b.x - e.c.x) * s + off.x, y: e.c.y + (b.y - e.c.y) * s + off.y, w: b.w * s, h: b.h * s, avoid: e.avoid, rows: e.rows && e.rows.map(rw => ({y: e.c.y + (rw.y - e.c.y) * s + off.y}))};
    }
    // relationships: drawn one by one, anchored to the (current) edges of their pieces
    const n = L.rels.length;
    const relP = [];
    L.rels.forEach((c, i) => {
      const a = W.rels[0] + (i * (W.rels[1] - W.rels[0])) / n, b = a + (W.rels[1] - W.rels[0]) / n;
      const pr = seg(u, a, b);
      relP.push(pr);
      const geo = connGeo(L, c.rel, boxes, L.relSides[i]);
      Object.assign(nodes, c.frame({...geo, labT: c.labT, labRest: c.labRest}, pr));
    });
    // tracer along the traversal order (routes are built on the rest layout; the focus scale is small)
    const trv = trP > 0 && trP < 1 ? 1 : trP >= 1 ? r(1 - seg(u, W.trace[1], W.trace[1] + 0.02), 3) : 0;
    const tp = route.poly.at(ease.inOutQuad(trP));
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: trv};
    if (L.key) nodes.key = {opacity: r(seg(u, ...W.key), 3)};
    const visited = route.visits.filter(v => trP >= v.t - 1e-6).map(v => v.id);
    const ends = L.rels.map((c, i) => {
      const geo = connGeo(L, c.rel, boxes, L.relSides[i]);
      return {from: R2(geo.from), to: R2(geo.to), gapFrom: r(edgeGap(geo.from, boxes[c.rel.from]), 2), gapTo: r(edgeGap(geo.to, boxes[c.rel.to]), 2)};
    });
    return {
      nodes,
      semantic: {
        separated: r(ap, 3),
        gather: L.gather,
        captions: r(capP, 3),
        relationsDrawn: relP.map(v => r(v, 3)),
        kinds: L.rels.map(c => c.rel.kind),
        arrows: L.rels.map(c => c.arrow),
        tracer: R2(tp),
        tracerVisible: trv > 0,
        visitOrder: visited,
        traversal: route.visits.map(v => v.id),
        focus: p.focusElement,
        focusScale: r(1 + W.focus * fz, 3),
        connectorEnds: ends,
        connectorGaps: ends.map(e => Math.max(e.gapFrom, e.gapTo)),
        stateShown: r(seg(u, ...W.state), 3),
        keyShown: r(seg(u, ...W.key), 3),
        problems: L.problems,
        tierBars: L.tierBars,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        allReached: true,
      },
    };
  },
};

/** Distance from a point to the edge of a box (0 when on the edge). */
function edgeGap(q, b) {
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
  const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  if (dx || dy) return Math.hypot(dx, dy);
  return Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y);
}

/** Connector geometry between two pieces (a plan row anchors at the level of the building it relates to). */
function connGeo(L, rel, boxes, fixed = null) {
  const A = boxes[rel.from], B = boxes[rel.to];
  const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
  const at = (bx, s0, toward) => {
    const yc = clamp(toward.y, bx.y + 12, bx.y + bx.h - 12), xc = clamp(toward.x, bx.x + 12, bx.x + bx.w - 12);
    if (s0 === 'right') return {x: bx.x + bx.w, y: yc, dir: {x: 1, y: 0}, s: s0};
    if (s0 === 'left') return {x: bx.x, y: yc, dir: {x: -1, y: 0}, s: s0};
    if (s0 === 'bottom') return {x: xc, y: bx.y + bx.h, dir: {x: 0, y: 1}, s: s0};
    return {x: xc, y: bx.y, dir: {x: 0, y: -1}, s: s0};
  };
  const rowY = (id, other) => {
    const e = L.byId[id];
    if (id !== 'plan' || !e.rows) return null;
    const lvl = other === 'origin' ? L.originLevel : other === 'review' ? L.reviewLevel : null;
    if (!lvl) return null;
    return boxes.plan.rows[lvl - 1].y;
  };
  const build = (sa, sb) => {
    let from = at(A, sa, cb), to = at(B, sb, ca);
    const ra = rowY(rel.from, rel.to), rb = rowY(rel.to, rel.from);
    if (ra !== null && from.dir.x) { from = {...from, y: ra}; to = at(B, sb, from); }
    if (rb !== null && to.dir.x) { to = {...to, y: rb}; from = at(A, sa, to); }
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const k = Math.min(len * 0.4, 140);
    const c1 = {x: from.x + from.dir.x * k, y: from.y + from.dir.y * k};
    const c2 = {x: to.x + to.dir.x * k, y: to.y + to.dir.y * k};
    const poly = cubicPolyline(from, c1, c2, to, 40);
    return {from, to, c1, c2, poly, sides: [sa, sb], d: `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`};
  };
  if (fixed) return build(fixed[0], fixed[1]);
  // choose the pair of allowed sides whose curve crosses no other piece (then the shortest)
  const allowed = bx => ['right', 'left', 'bottom', 'top'].filter(q => !(bx.avoid || []).includes(q));
  const others = [...Object.entries(boxes).filter(([id]) => id !== rel.from && id !== rel.to && !(L.byId[id] && L.byId[id].inRoom)).map(([, b]) => b), ...(L.textBoxes || [])];
  let best = null;
  for (const sa of allowed(A)) for (const sb of allowed(B)) {
    const geo = build(sa, sb);
    // the curve must leave each end outward
    const hits = geo.poly.pts.slice(2, -2).filter(q => others.some(b => q.x > b.x - 12 && q.x < b.x + b.w + 14 && q.y > b.y - 12 && q.y < b.y + b.h + 16)
      || [A, B].some(b => q.x > b.x + 2 && q.x < b.x + b.w - 2 && q.y > b.y + 2 && q.y < b.y + b.h - 2)).length;
    const score = hits * 1e5 + geo.poly.total;
    if (!best || score < best.score) best = {geo: {...geo, hits}, score};
  }
  return best.geo;
}

/** Arc-length fraction of the polyline point nearest to q. */
function nearestT(poly, q) {
  let best = 0, bd = Infinity;
  for (let k = 0; k <= 60; k++) { const z = poly.at(k / 60); const d = Math.hypot(z.x - q.x, z.y - q.y); if (d < bd) { bd = d; best = k / 60; } }
  return best;
}

function relArt(ctx, name, rel, lab) {
  const th = ctx.theme;
  const color = kindColor(ctx, rel.kind);
  const arrow = rel.kind !== 'relation';
  const dash = rel.kind === 'communication' ? '10 9' : null;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d: 'M0 0', fill: 'none', stroke: color, 'stroke-width': rel.kind === 'causal' ? 5 : 3.5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': dash ? '0.02 0.02' : '1 1.2', 'stroke-dashoffset': 1}),
    arrow ? h('path', {name: `${name}-head`, d: 'M0 0L-16 -9L-12 0L-16 9Z', fill: color, opacity: 0}) : null,
    arrow ? null : h('circle', {name: `${name}-dotA`, r: 6, fill: color, stroke: th.paper, 'stroke-width': 2, opacity: 0}),
    arrow ? null : h('circle', {name: `${name}-dotB`, r: 6, fill: color, stroke: th.paper, 'stroke-width': 2, opacity: 0}),
  );
  const labNode = lab ? g({name: `${name}-lab`, opacity: 0}, lab.node) : null;
  const frame = (geo, p) => {
    const out = {
      [name]: {opacity: p > 0 ? 1 : 0},
      [`${name}-line`]: {d: geo.d, 'stroke-dashoffset': r(1 - p, 4)},
    };
    if (arrow) {
      const e = geo.poly.at(1);
      out[`${name}-head`] = {transform: T(e.x, e.y, (e.a * 180) / Math.PI), opacity: p >= 0.99 ? 1 : 0};
    } else {
      out[`${name}-dotA`] = {cx: r(geo.from.x), cy: r(geo.from.y), opacity: p > 0 ? 1 : 0};
      out[`${name}-dotB`] = {cx: r(geo.to.x), cy: r(geo.to.y), opacity: p >= 0.99 ? 1 : 0};
    }
    if (labNode) {
      const q = geo.poly.at(geo.labT ?? 0.5);
      const d0 = geo.labRest || q;
      out[`${name}-lab`] = {opacity: r(clamp((p - 0.55) / 0.45), 3), transform: T(q.x - d0.x, q.y - d0.y)};
    }
    return out;
  };
  return {node, labNode, frame, arrow};
}

/** One composition at text size F. */
function compose(ctx, F, px, slotSet) {
  const p = ctx.params;
  const th = ctx.theme;
  const c = planColors(ctx);
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const R = resolveHier(p);
  const labelOf = id => (p.elements.find(e => e.id === id) || {}).label;
  const slots = slotSet;
  const gapY = 10 / px;
  // the focus element's slot leaves room for its enlargement
  const box = id => {
    const s = slots[id];
    // (drop shadows stick out right and below: keep 14 units free there)
    const b = {x: s[0] * D.w, y: s[1] * D.h, w: s[2] * D.w - 14, h: s[3] * D.h - 14};
    if (id !== p.focusElement) return b;
    const k = 1 / (1 + W.focus);
    return {x: b.x + (b.w * (1 - k)) / 2, y: b.y + (b.h * (1 - k)) / 2, w: b.w * k, h: b.h * k};
  };
  // origin / review bodies: the first body on the lowest / highest supplied level
  const minL = Math.min(...R.bodies.map(b => b.level)), maxL = Math.max(...R.bodies.map(b => b.level));
  const originBody = R.bodies.find(b => b.level === minL), reviewBody = R.bodies.find(b => b.level === maxL);
  const originLevel = originBody.level, reviewLevel = reviewBody.level;
  const els = [];
  const capBoxes = [];
  const L0 = {};
  const cap = (id, bx, bottom, top = null) => {
    const t = labelOf(id);
    if (!showAll || !t) return {h: 0, node: null};
    const f = fitG(t, {maxWidth: bx.w - F * 0.84, size: F, minSize: F, maxLines: 3, weight: 600});
    if (!fitOk(f)) problems.push(`cap-${id}`);
    const card = labelCard(ctx, f, {x: bx.x + bx.w / 2, y: top !== null ? top : bottom - cardH(f, F), anchor: 'middle', size: F, fill: th.card, stroke: th.ink, name: `cap-${id}`});
    capBoxes.push(card.box);
    return {h: cardH(f, F) + gapY, node: card.node, box: card.box};
  };
  // ---- plan sheet (the supplied hierarchy)
  const planB = box('plan');
  // the plan's caption sits above the sheet: connectors leave the sheet by its other edges
  const planCap = cap('plan', planB, 0, planB.y);
  const sheet = {x: planB.x, y: planB.y + planCap.h, w: planB.w, h: planB.h - planCap.h};
  const pad = F * 0.7;
  const inner = sheet.w - pad * 2;
  const wideSheet = sheet.w > sheet.h * 1.6;
  // wide sheets: title and key side by side at the top; tall sheets: title at the top, key at the bottom
  const title = showKey ? fitG(p.labels.note, {maxWidth: wideSheet ? inner * 0.46 : inner, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  if (title && !fitOk(title)) problems.push('title');
  const keyFit = showKey ? fitG(p.labels.key, {maxWidth: wideSheet ? inner * 0.5 : inner, size: F, minSize: F, maxLines: 4, weight: 500}) : null;
  if (keyFit && !fitOk(keyFit)) problems.push('key');
  const keyAt = keyFit ? (wideSheet ? {x: sheet.x + sheet.w - pad - inner * 0.5, y: sheet.y + pad} : {x: sheet.x + pad, y: sheet.y + sheet.h - pad - keyFit.height}) : null;
  // rows from the highest level (top) to level 1 (bottom): level chip, then its bodies as small chips
  const headH = wideSheet ? Math.max(title ? title.height : 0, keyFit ? keyFit.height : 0) + F * 0.8 : (title ? title.height + F * 0.8 : 0);
  const rowsTop = sheet.y + pad + headH;
  const rowsBottom = sheet.y + sheet.h - pad - (!wideSheet && keyFit ? keyFit.height + F * 0.8 : 0);
  const rowH = (rowsBottom - rowsTop) / R.N;
  const rowNodes = [];
  const rowYs = [];
  const bodyChipAt = {};
  for (let li = R.N; li >= 1; li--) {
    const ry = rowsTop + (R.N - li) * rowH;
    rowYs[li - 1] = ry + rowH / 2;
    rowNodes.push(h('path', {d: `M${r(sheet.x + pad * 0.5)} ${r(ry + rowH)}H${r(sheet.x + sheet.w - pad * 0.5)}`, stroke: c.sheetGrid, 'stroke-width': 2, 'stroke-dasharray': li > 1 ? '8 6' : null}));
    let yy = ry + F * 0.3;
    const wide = wideSheet;
    if (showKey) {
      const nameW = wide ? inner * 0.42 : inner;
      const lf = fitG(R.levels[li - 1].name, {maxWidth: nameW, size: F, minSize: F, maxLines: 2, weight: 700});
      if (!fitOk(lf)) problems.push('level');
      rowNodes.push(textAt(lf, sheet.x + pad, yy, th.fg));
      let bx0 = sheet.x + pad + F * 0.6, by = yy + lf.height + F * 0.35;
      if (wide) { bx0 = sheet.x + pad + nameW + F; by = ry + F * 0.3; }
      const maxW = sheet.x + sheet.w - pad - bx0;
      let cx = bx0, lineH = 0;
      for (const b of R.bodies.filter(bb => bb.level === li)) {
        const bf = fitG(b.label, {maxWidth: maxW - F * 0.84, size: F, minSize: F, maxLines: 2, weight: 500});
        if (!fitOk(bf)) problems.push('body');
        const cw = bf.width + F * 0.84;
        if (wide && cx > bx0 && cx + cw > bx0 + maxW) { cx = bx0; by += lineH + F * 0.3; lineH = 0; }
        const card = labelCard(ctx, bf, {x: cx, y: by, size: F, fill: th.card, stroke: c.frame, strokeWidth: 1.5, align: 'start'});
        rowNodes.push(card.node);
        bodyChipAt[b.i] = card.box;
        if (wide) { cx += card.box.w + F * 0.5; lineH = Math.max(lineH, card.box.h); } else by += card.box.h + F * 0.3;
      }
      yy = wide ? Math.max(yy + lf.height, by + lineH) : by;
    } else {
      // labels hidden: the ordering reads graphically — each row is a tier bar whose length grows with its level
      // (a staircase), and each body on that level stands on it as a small building
      const barH = Math.min(rowH * 0.18, 16);
      const barW = inner * (0.3 + 0.7 * (li / R.N));
      const barY = ry + rowH - barH - 4;
      rowNodes.push(h('rect', {x: r(sheet.x + pad), y: r(barY), width: r(barW), height: r(barH), rx: 3, fill: c.stone, stroke: '#1f2328', 'stroke-width': 1.6}));
      L0.tierBars = (L0.tierBars || 0) + 1;
      const onRow = R.bodies.filter(bb => bb.level === li);
      const bh2 = Math.min(rowH - barH - 10, 70);
      const bw2 = bh2 * 1.1;
      onRow.forEach((b, j) => {
        const bx = sheet.x + pad + 10 + j * (bw2 + 10);
        rowNodes.push(buildingElevation(ctx, {name: undefined, x: bx, y: barY - bh2, w: bw2, h: bh2, floors: 2, bays: 3, tree: false}).node);
        bodyChipAt[b.i] = {x: bx, y: barY - bh2, w: bw2, h: bh2};
      });
      yy = ry + rowH;
    }
    if (yy > ry + rowH + 1) problems.push('rows');
  }
  // supplied links between bodies, drawn on the sheet as small connectors at the chips' left edge
  const linkNodes = R.links.map((l, i) => {
    const A = bodyChipAt[l.from], B = bodyChipAt[l.to];
    if (!A || !B) return null;
    const ya = A.y + A.h / 2, yb = B.y + B.h / 2;
    const col = kindColor(ctx, l.kind);
    if (wideSheet) {
      // wide sheet: links run in the margin on the right of the chips (never across the level names)
      const xR = Math.max(...Object.values(bodyChipAt).map(q => q.x + q.w)) + 10 + (i % 3) * 6;
      return g(null,
        h('path', {d: `M${r(A.x + A.w)} ${r(ya)}H${r(xR)}V${r(yb)}H${r(B.x + B.w + (l.kind === 'sequence' ? 6 : 0))}`, fill: 'none', stroke: col, 'stroke-width': 2.5}),
        l.kind === 'sequence' ? h('path', {d: `M${r(B.x + B.w)} ${r(yb)}l9 -5v10z`, fill: col}) : h('circle', {cx: r(B.x + B.w), cy: r(yb), r: 3.5, fill: col}));
    }
    const xL = sheet.x + pad * 0.55 + (i % 3) * 5;
    return g(null,
      h('path', {d: `M${r(A.x)} ${r(ya)}H${r(xL)}V${r(yb)}H${r(B.x - (l.kind === 'sequence' ? 6 : 0))}`, fill: 'none', stroke: col, 'stroke-width': 2.5}),
      l.kind === 'sequence' ? h('path', {d: `M${r(B.x)} ${r(yb)}l-9 -5v10z`, fill: col}) : h('circle', {cx: r(B.x), cy: r(yb), r: 3.5, fill: col}));
  });
  const planArt = g(null,
    h('path', {d: roundRectPath(sheet.x + 5, sheet.y + 8, sheet.w, sheet.h, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(sheet.x, sheet.y, sheet.w, sheet.h, 14), fill: c.sheet, stroke: '#1f2328', 'stroke-width': 2.2}),
    h('path', {d: `M${r(sheet.x + sheet.w - 34)} ${r(sheet.y)}V${r(sheet.y + 20)}Q${r(sheet.x + sheet.w - 34)} ${r(sheet.y + 34)} ${r(sheet.x + sheet.w - 20)} ${r(sheet.y + 34)}H${r(sheet.x + sheet.w)}`, fill: 'none', stroke: c.sheetGrid, 'stroke-width': 2}),
    title ? textAt(title, sheet.x + pad, sheet.y + pad, th.fg) : null,
    rowNodes, linkNodes,
    keyFit ? g(null, h('path', {d: `M${r(keyAt.x)} ${r(keyAt.y - F * 0.35)}H${r(keyAt.x + keyFit.width)}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(keyFit, keyAt.x, keyAt.y, th.fgSoft, {italic: true})) : null,
  );
  els.push({id: 'plan', avoid: ['top'], art: planArt, capBox: planCap.box, caption: planCap.node ? {node: planCap.node} : null, box: sheet, c: {x: sheet.x + sheet.w / 2, y: sheet.y + sheet.h / 2}, rows: rowYs.map(y => ({y}))});
  // ---- the two buildings on podiums (heights follow their supplied levels)
  const personPx = 64;
  const ps = personPx / 100 / px;
  // both buildings are drawn at the same size (equal weight); only the podium height follows the level
  // a wide slot puts the caption and the level tag beside the building; a tall one stacks them under it
  const sideOf = bx => ctx.view.shape !== 'square' && bx.w > bx.h * 1.05;
  const bldTexts = (id, lvl, bx) => {
    const side = sideOf(bx);
    const tw = side ? bx.w * 0.5 - F * 0.5 : bx.w;
    const capF = showAll && labelOf(id) ? fitG(labelOf(id), {maxWidth: tw - F * 0.84, size: F, minSize: F, maxLines: 3, weight: 600}) : null;
    const st = showKey ? fitG(`${ctx.t.originTag}: ${R.levels[lvl - 1].name}`, {maxWidth: tw - F * 0.84, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
    return {side, tw, capF, st, capH: capF ? cardH(capF, F) + gapY : 0, stH: st ? cardH(st, F) + gapY : 0};
  };
  const bldSize = (id, lvl) => {
    const bx = box(id);
    const t = bldTexts(id, lvl, bx);
    const ah = t.side ? bx.h : bx.h - t.capH - t.stH;
    const aw = t.side ? bx.w - t.tw - F * 0.5 : bx.w;
    const podH = ah * 0.14 * (0.6 + (lvl - 1));
    return Math.min(ah - podH - 6, aw * 0.9 * (176 / 220));
  };
  const sharedBh = Math.min(bldSize('origin', originLevel), bldSize('review', reviewLevel));
  const bldEl = (id, body, lvl) => {
    const bx = box(id);
    const t = bldTexts(id, lvl, bx);
    const {st} = t;
    if (st && !fitOk(st)) problems.push(`state-${id}`);
    if (t.capF && !fitOk(t.capF)) problems.push(`cap-${id}`);
    const avail = t.side ? {x: bx.x, y: bx.y, w: bx.w - t.tw - F * 0.5, h: bx.h} : {x: bx.x, y: bx.y, w: bx.w, h: bx.h - t.capH - t.stH};
    // building + podium: podium height grows with the level (1 step per level)
    const step = avail.h * 0.14;
    const podH = step * (0.6 + (lvl - 1));
    const bh = Math.min(avail.h - podH - 6, avail.w * 0.9 * (176 / 220), sharedBh);
    if (bh < 60) problems.push(`bld-${id}`);
    const bw = bh * (220 / 176);
    const cx = avail.x + avail.w / 2;
    const top = avail.y + avail.h - podH;
    const podW = bw * 1.08;
    const art = g(null,
      h('rect', {x: r(cx - podW / 2), y: r(top), width: r(podW), height: r(podH), fill: c.stone, stroke: '#1f2328', 'stroke-width': 2.2}),
      h('rect', {x: r(cx - podW / 2 - 5), y: r(top - 3), width: r(podW + 10), height: 10, rx: 3, fill: c.stoneDark, stroke: '#1f2328', 'stroke-width': 2}),
      buildingElevation(ctx, {name: `bld-${id}`, x: cx - bw / 2, y: top - 3 - bh, w: bw, h: bh, floors: 3, bays: 4, tree: false, highlight: id === 'origin' ? {floor: 1, bay: 0} : null}).node,
    );
    const artBox = {x: cx - podW / 2 - 5, y: top - 3 - bh, w: podW + 10, h: bh + 3 + podH};
    let capCard = null, stateCard = null;
    if (t.side) {
      // beside the building, bottom-aligned with its podium: caption above the level tag
      const tx = bx.x + bx.w - t.tw / 2;
      let yb = bx.y + bx.h;
      if (st) { stateCard = labelCard(ctx, st, {x: tx, y: yb - cardH(st, F), anchor: 'middle', size: F, fill: th.card, stroke: th.accent4, name: `state-${id}`}); yb -= t.stH; }
      if (t.capF) capCard = labelCard(ctx, t.capF, {x: tx, y: yb - cardH(t.capF, F), anchor: 'middle', size: F, fill: th.card, stroke: th.ink, name: `cap-${id}`});
    } else {
      if (t.capF) capCard = labelCard(ctx, t.capF, {x: bx.x + bx.w / 2, y: bx.y + bx.h - cardH(t.capF, F), anchor: 'middle', size: F, fill: th.card, stroke: th.ink, name: `cap-${id}`});
      if (st) stateCard = labelCard(ctx, st, {x: cx, y: avail.y + avail.h + gapY * 0.5, anchor: 'middle', size: F, fill: th.card, stroke: th.accent4, name: `state-${id}`});
    }
    if (capCard) capBoxes.push(capCard.box);
    els.push({id, avoid: [t.side ? 'right' : 'bottom'], art, side: t.side, capBox: capCard && capCard.box, caption: capCard ? {node: capCard.node} : null, state: stateCard, box: artBox, c: {x: artBox.x + artBox.w / 2, y: artBox.y + artBox.h / 2}, bh});
  };
  bldEl('origin', originBody, originLevel);
  bldEl('review', reviewBody, reviewLevel);
  // ---- the room (enlarged plan of the highlighted room) with the people seated in it; the people are their own
  // piece (their footprint inside the room) so relationships and the tracer can reach them
  {
    const bx = box('room');
    const t0 = labelOf('room'), t1 = labelOf('people');
    const fr = showAll && t0 ? fitG(t0, {maxWidth: bx.w - F * 0.84, size: F, minSize: F, maxLines: 3, weight: 600}) : null;
    const fp = showAll && t1 ? fitG(t1, {maxWidth: bx.w - F * 0.84, size: F, minSize: F, maxLines: 3, weight: 600}) : null;
    if ((fr && !fitOk(fr)) || (fp && !fitOk(fp))) problems.push('cap-room');
    const capsH = (fr ? cardH(fr, F) + gapY : 0) + (fp ? cardH(fp, F) + gapY : 0);
    const avail = {x: bx.x, y: bx.y, w: bx.w, h: bx.h - capsH};
    const pz = padSize(ps, p.seats);
    const k = Math.min(avail.w / pz.w, avail.h / pz.h, 2.4);
    const w = pz.w * k, hh = pz.h * k;
    const x = avail.x + (avail.w - w) / 2, y = avail.y + (avail.h - hh) / 2;
    const looks = Array.from({length: p.seats}, (_, j) => actorLook(ctx, (p.people || [])[j], j));
    const pad2 = roomPad(ctx, {name: 'room-pad', w: pz.w, h: pz.h, ps, seats: p.seats, looks});
    const art = g({transform: `${T(x, y)} scale(${r(k, 4)})`}, pad2.node);
    if (k < 0.9) problems.push('room');
    let yc = y + hh + gapY;
    let rc = null, pc = null;
    if (fr) { rc = labelCard(ctx, fr, {x: x + w / 2, y: yc, anchor: 'middle', size: F, fill: th.card, stroke: th.ink, name: 'cap-room'}); yc += rc.box.h + gapY * 0.6; capBoxes.push(rc.box); }
    if (fp) { pc = labelCard(ctx, fp, {x: x + w / 2, y: yc, anchor: 'middle', size: F, fill: th.card, stroke: th.ink, name: 'cap-people'}); capBoxes.push(pc.box); }
    // both captions belong to the room piece (they move and scale with it)
    els.push({id: 'room', avoid: ['bottom'], art, capBox: rc && rc.box, caption: rc || pc ? {node: g(null, rc && rc.node, pc && pc.node)} : null, box: {x, y, w, h: hh}, c: {x: x + w / 2, y: y + hh / 2}});
    // the seated people's footprint (room coordinates → design units)
    const pr = 52 * ps;
    const pts = pad2.people.map(q => ({x: x + q.x * k, y: y + q.y * k}));
    const pb = pts.length
      ? {x: Math.min(...pts.map(q => q.x)) - pr * k, y: Math.min(...pts.map(q => q.y)) - pr * k * 1.2, w: 0, h: 0}
      : {x: x + w * 0.35, y: y + hh * 0.45, w: w * 0.3, h: hh * 0.3};
    if (pts.length) { pb.w = Math.max(...pts.map(q => q.x)) + pr * k - pb.x; pb.h = Math.max(...pts.map(q => q.y)) + pr * k * 0.8 - pb.y; }
    els.push({id: 'people', avoid: [], art: g(null), capBox: pc && pc.box, caption: null, box: pb, c: {x: pb.x + pb.w / 2, y: pb.y + pb.h / 2}, inRoom: true});
    L0.roomScale = k;
  }
  // connectors anchor on the art itself and never leave through the side that carries the piece's captions
  for (const e of els) {
    e.full = e.box;
    e.c = {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2};
  }
  {
    const cen = {x: D.w / 2, y: D.h / 2};
    const shifted = (e, k) => ({x: e.box.x + (cen.x - e.c.x) * k, y: e.box.y + (cen.y - e.c.y) * k, w: e.box.w, h: e.box.h});
    const solid = els.filter(e => !e.inRoom);
    let k = 0.45;
    while (k > 0 && solid.some((a, i) => solid.some((b, j) => j > i && overlaps(shifted(a, k), shifted(b, k), 12)))) k = Math.round((k - 0.01) * 100) / 100;
    L0.gather = Math.max(0, k);
  }
  const byId = Object.fromEntries(els.map(e => [e.id, e]));
  const L = {F, px, els, byId, originLevel, reviewLevel, problems, tierBars: L0.tierBars || 0, gather: L0.gather, personPx: ps * 100 * px * (L0.roomScale || 1)};
  L.centre = {x: D.w / 2, y: D.h / 2};
  // ---- relationships (only those supplied between existing pieces)
  const restBoxes = Object.fromEntries(els.map(e => [e.id, {...e.full, rows: e.rows, avoid: e.avoid}]));
  const rels = p.relationships.filter(q => byId[q.from] && byId[q.to] && q.from !== q.to);
  const placed = [];
  const obstacles = [...els.filter(e => !e.inRoom).map(e => e.box), ...els.filter(e => e.state).map(e => e.state.box)];
  // captions and level tags count as obstacles for the connectors too
  L.textBoxes = [...capBoxes, ...els.filter(e => e.state).map(e => e.state.box)];
  const geos = rels.map(rel => connGeo(L, rel, restBoxes));
  if (geos.some(q => q.hits > 0)) problems.push('route');
  L.relSides = geos.map(q => q.sides);
  // every connector is long enough to read beside its chip (>= 3 text lines)
  if (geos.some(q => q.poly.total < 3 * F * 1.2 + 16 / px)) problems.push('short-link');
  const distTo = (bb, pl) => Math.min(...pl.pts.map(z => Math.hypot(Math.max(bb.x - z.x, 0, z.x - (bb.x + bb.w)), Math.max(bb.y - z.y, 0, z.y - (bb.y + bb.h)))));
  L.rels = rels.map((rel, i) => {
    const geo = geos[i];
    let lab = null;
    if (showAll) {
      const text = p.relationLabels[rel.kind] || rel.kind;
      const fits = [fitG(text, {maxWidth: 200 / px, size: F, minSize: F, maxLines: 2, weight: 600}), fitG(text, {maxWidth: 300 / px, size: F, minSize: F, maxLines: 1, weight: 600})].filter(fitOk);
      if (!fits.length) problems.push('rel-label');
      const f = fits[0] || fitG(text, {maxWidth: 200 / px, size: F, minSize: F, maxLines: 2, weight: 600});
      const inside = bb => bb.x >= 0 && bb.y >= 0 && bb.x + bb.w <= D.w && bb.y + bb.h <= D.h;
      const clearOf = bb => inside(bb) && !obstacles.some(q => overlaps(bb, q, 6)) && !placed.some(q => overlaps(bb, q, 6)) && !capBoxes.some(q => overlaps(bb, q, 6))
        && geos.every((og, j) => j === i || distTo(bb, og.poly) > Math.min(distTo(bb, geo.poly) + 10 / px, 1e9) && distTo(bb, og.poly) > 6)
        && distTo(bb, geo.poly) <= 36 / px && distTo(bb, geo.poly) >= 5 / px;
      // try positions along the connector (t) and pushed to either side of it, with a two-line or a one-line chip
      let got = null;
      for (const ff of fits.length ? fits : [f]) {
        for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88]) {
          const at = geo.poly.at(t);
          for (const [dx, dy] of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            for (let dd = 0; dd <= 140 && !got; dd += 8) {
              const cand = labelCard(ctx, ff, {x: at.x + dx * dd, y: at.y - cardH(ff, F) / 2 + dy * dd, anchor: 'middle', size: F, fill: th.card, stroke: kindColor(ctx, rel.kind), strokeWidth: 2});
              if (clearOf(cand.box)) got = {card: cand, anchor: at};
            }
            if (got) break;
          }
          if (got) break;
        }
        if (got) break;
      }
      if (!got) { problems.push('rel-place'); got = {card: labelCard(ctx, f, {x: geo.poly.at(0.5).x, y: geo.poly.at(0.5).y - cardH(f, F) / 2, anchor: 'middle', size: F, fill: th.card, stroke: kindColor(ctx, rel.kind), strokeWidth: 2}), anchor: geo.poly.at(0.5)}; }
      placed.push(got.card.box);
      lab = got;
    }
    const art = relArt(ctx, `rel${i}`, rel, lab && {node: lab.card.node});
    return {...art, rel, labBox: lab && lab.card.box, labT: lab ? nearestT(geo.poly, lab.anchor) : 0.5, labRest: lab && lab.anchor};
  });
  // ---- tracer route: through the pieces in the supplied traversal order, along the relationships
  const pts = [];
  const visits = [];
  const ctr = id => restBoxes[id] && {x: restBoxes[id].x + restBoxes[id].w / 2, y: restBoxes[id].y + restBoxes[id].h / 2};
  const order = p.traversalOrder.filter(id => byId[id]);
  order.forEach((id, i) => {
    if (i === 0) { pts.push(ctr(id)); visits.push({id, idx: 0}); return; }
    const prev = order[i - 1];
    const rel = rels.find(q => (q.from === prev && q.to === id) || (q.from === id && q.to === prev));
    if (rel) {
      const geo = connGeo(L, rel, restBoxes, L.relSides[rels.indexOf(rel)]);
      const fw = rel.from === prev;
      for (let k = 0; k <= 30; k++) pts.push(geo.poly.at(fw ? k / 30 : 1 - k / 30));
    }
    pts.push(ctr(id));
    visits.push({id, idx: pts.length - 1});
  });
  if (pts.length < 2) pts.push({...pts[0]});
  const poly = polyline(pts);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const tot = cum[cum.length - 1] || 1;
  L.route = {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / tot}))};
  L.key = null;
  return L;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-02-mechanism',
    title: 'Editable hierarchy — the supplied plan, two generic buildings, a room and its people, and the relations between them',
    titleEs: 'Jerarquía judicial editable — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Jerarquía judicial editable',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded diagram: the plan sheet of the supplied levels and bodies, the generic building of a body on the origin level and one on the configured review level (podium heights follow the supplied levels), the plan of one room and the people in it. Only the supplied relationships are drawn, anchored to the pieces’ edges and styled by kind (a plain relation has no arrow); a tracer follows the supplied traversal order and the focus element enlarges. Nothing says that a review happens or has an effect.',
    tags: ['hierarchy', 'mechanism', 'plan', 'levels', 'generic buildings', 'room plan', 'people', 'relations', 'as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/jerarquia-editable.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
