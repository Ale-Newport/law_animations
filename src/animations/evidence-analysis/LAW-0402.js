/**
 * LAW-0402 — Mapa de proposiciones · mechanism
 *
 * Storyboard (an exploded proposition map — no board frame, no hands): the claim cards hang along the top tier, the
 * labelled evidence cards along the bottom tier (their slot labels printed under them), and the witness — the source
 * of her statement — sits as a portrait badge at the bottom left. Between the tiers each supplied link is drawn as a
 * thread anchored to the two cards' eyelets: a link supplied as direct support runs straight and solid; a link
 * supplied as a disputed inference is routed through a hollow inference ring and drawn dashed (the extra step is the
 * inference that is disputed; dashes = disputed across the library).
 *  0.00–0.18  separate: from the compact cluster of the board (everything close together inside a faint board outline)
 *             the claim cards rise to the top tier, the evidence cards drop to the bottom tier and the witness badge
 *             slides out to the left; the outline fades.
 *  0.18–0.43  relate: only the explicit relationships are drawn, one after another, each anchored to its elements:
 *             the supplied relationships (kind styles from the library: a plain relation has dots at both ends and no
 *             arrowhead; causal only when supplied) and the supplied links (solid, or dashed through the inference
 *             ring).
 *  0.43–0.75  trace: a tracer marker follows the supplied traversal order element to element along those lines; the
 *             focus element is enlarged while the tracer is on it.
 *  0.75–1.00  gather: the tiers draw slightly together; origin (witness), the links and their supplied states stay
 *             visible with the key "links as supplied · no weighing of evidence, no conclusion drawn".
 * @module animations/evidence-analysis/LAW-0402
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {mechanismFields, RELATION_KINDS} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath, edgeAnchor, circleAnchor, polyline} from '../../core/geometry.js';
import {connector, chip, LINK_STYLES} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  eaFields, EA_EN, EA_ES, localised, resolveLinks, threadNode, legendColumns, panelNode, R2, fitG, THREAD, LINEN, FRAME, INK,
} from './kits/analysis-art.js';
import {
  MP_LABELS_EN, MP_LABELS_ES, mpLabelFields, boardLayout, idFits, claimTextH, evLabelH, cardNodes, slotLabelNodes, contentRows,
} from './kits/mapa-proposiciones.js';

const ID = 'LAW-0402';
const DURATION = 7000;
const W = {separate: [0.02, 0.17], relate: [0.18, 0.43], trace: [0.45, 0.74], gather: [0.76, 0.86], notes: [0.8, 0.86]};
const ELEMENT_IDS = ['witness', 'e1', 'e2', 'e3', 'p1', 'p2', 'p3'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16];

const OWN_EN = {
  labels: MP_LABELS_EN,
  elements: [
    {id: 'witness', label: 'Witness: source of statement E1 (fictional)'},
    {id: 'e1', label: 'Labelled evidence, pinned below'},
    {id: 'p1', label: 'Claim it is said to support, above'},
  ],
  relationships: [{from: 'witness', to: 'e1', kind: 'relation'}],
  focusElement: 'e2',
  relationLabels: {relation: 'gave the statement (relation)', communication: 'communication', sequence: 'sequence as configured', causal: 'causal (supplied)'},
  traversalOrder: ['witness', 'e1', 'p1', 'e2', 'p2'],
};
const OWN_ES = {
  labels: MP_LABELS_ES,
  elements: [
    {id: 'witness', label: 'Testigo: origen de la declaración E1 (ficticia)'},
    {id: 'e1', label: 'Prueba etiquetada, clavada abajo'},
    {id: 'p1', label: 'Afirmación que pretende apoyar, arriba'},
  ],
  relationships: [{from: 'witness', to: 'e1', kind: 'relation'}],
  focusElement: 'e2',
  relationLabels: {relation: 'prestó la declaración (relación)', communication: 'comunicación', sequence: 'secuencia según configuración', causal: 'causal (aportado)'},
  traversalOrder: ['witness', 'e1', 'p1', 'e2', 'p2'],
};
const EN = {...EA_EN, ...OWN_EN};
const ES = {...EA_ES, ...OWN_ES};

const sceneSchema = {...eaFields, ...mpLabelFields, ...mechanismFields(ELEMENT_IDS)};
const defaultParams = {...EN};

/* ------------------------------------------------------------------ */

function legendRows(ctx, P, links, looks, md) {
  const rows = contentRows(ctx, P, links, {looks, claims: !md.cot, evidence: !md.evb});
  if (ctx.show('all')) {
    const kinds = [...new Set(P.relationships.map(q => q.kind))];
    for (const k of kinds) rows.push({kind: 'item', icon: `rel-${k}`, text: P.relationLabels[k], name: `lg-rel-${k}`, caption: true});
    P.elements.forEach((el, i) => rows.push({kind: 'item', icon: el.id === 'witness' ? 'person' : el.id[0] === 'e' ? 'board' : 'claim', look: looks.w, index: 0, text: `${el.id.toUpperCase()} · ${el.label}`, name: `lg-el${i}`, caption: true}));
  }
  if (ctx.show('key')) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function legendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  if (!rows.length) return {stage: {x: 0, y: 0, w: DW, h: DH}, panel: null, PL: null};
  if (opt.mode === 'below') {
    const colW = (DW - 8 - (opt.cols - 1) * F * 1.2) / opt.cols;
    const PL = legendColumns(ctx, rows, colW, F, opt.cols);
    return {stage: {x: 0, y: 0, w: DW, h: DH - PL.h - gap}, panel: {x: 4, y: DH - PL.h}, PL};
  }
  const PW = DW * opt.pw;
  const PL = legendColumns(ctx, rows, PW, F, 1);
  PL.ok = PL.ok && PL.h <= DH;
  return {stage: {x: 0, y: 0, w: DW - PW - gap, h: DH}, panel: {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)}, PL};
}

/** Element geometry: boxes (cards) and the witness circle. */
function model(ctx, P, links, S, F, md) {
  const key = ctx.show('key');
  const badgeR = clamp(Math.min(S.w * 0.09, S.h * 0.14), 44, 90);
  const inner = {x: S.x, y: S.y, w: S.w, h: S.h};
  const evStart = clamp((badgeR * 2.6) / S.w, 0.14, 0.32);
  const idW = key ? Math.max(...P.evidence.map(e => fitG(e.id, {maxWidth: 999, size: 20, weight: 800, maxLines: 1}).width)) : 0;
  const BL = boardLayout(inner, P, links, {evRange: [evStart, 1], gap: 0.3, claimText: key && md.cot ? claimTextH(P, F) : null, evLabel: key && md.evb ? evLabelH(P, F) : null, idW});
  const ev0 = BL.evid[0];
  const badge = {x: S.x + badgeR + 8, y: ev0.y + BL.eh / 2, r: badgeR};
  // inference rings for disputed links: offset from the straight line so the route visibly takes an extra step
  const routes = links.map((l, n) => {
    const E = BL.ends[n];
    if (l.kind !== 'disputed') return {pts: [E.e, E.c], ring: null};
    const mx = (E.e.x + E.c.x) / 2, my = (E.e.y + E.c.y) / 2;
    const dx = E.c.x - E.e.x, dy = E.c.y - E.e.y, len = Math.hypot(dx, dy) || 1;
    const off = clamp(len * 0.14, 24, 60) * (n % 2 ? -1 : 1);
    const ring = {x: mx - (dy / len) * off, y: my + (dx / len) * off};
    return {pts: [E.e, ring, E.c], ring};
  });
  const cBot = Math.max(...BL.claims.map(C => C.y + C.h)), eTop = Math.min(...BL.evid.map(E => E.y));
  const problems = [];
  if (eTop - cBot < Math.max(80, S.h * 0.18)) problems.push('tier-gap');
  const ids = idFits(P, BL, 1, key && md.cot ? F : null);
  if (key && !ids.ok) problems.push('id-text');
  return {S, BL, badge, routes, ids, problems, cx: S.x + S.w / 2, cy: S.y + S.h / 2};
}

/** Centre of an element by id (or null when absent). */
function elemCenter(M, id) {
  if (id === 'witness') return {x: M.badge.x, y: M.badge.y};
  const i = +id.slice(1) - 1;
  if (id[0] === 'e') { const E = M.BL.evid[i]; return E ? {x: E.x + E.w / 2, y: E.y + E.h / 2} : null; }
  const C = M.BL.claims[i];
  return C ? {x: C.x + C.w / 2, y: C.y + C.h / 2} : null;
}

function elemBox(M, id) {
  if (id === 'witness') return null;
  const i = +id.slice(1) - 1;
  const B = id[0] === 'e' ? M.BL.evid[i] : M.BL.claims[i];
  return B ? {x: B.x, y: B.y, w: B.w, h: B.h} : null;
}

/** Anchor on an element's edge toward a point. */
function elemAnchor(M, id, toward, pad = 6) {
  if (id === 'witness') return circleAnchor({x: M.badge.x, y: M.badge.y}, M.badge.r + pad, toward);
  return edgeAnchor(elemBox(M, id), toward, pad);
}

/** Polyline of a path [{x,y}...] truncated at fraction p of its length → d string. */
function partialD(pts, p) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(l); total += l; }
  let left = total * clamp(p);
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    const l = segs[i - 1];
    if (left >= l) { d += `L${r(pts[i].x)} ${r(pts[i].y)}`; left -= l; continue; }
    const k = l ? left / l : 0;
    d += `L${r(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k)} ${r(pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k)}`;
    break;
  }
  return d;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const links = resolveLinks(P);
    const looks = {w: actorLook(ctx, null, 0), ev: P.evidence.map((e, j) => actorLook(ctx, null, 2 + j))};
    const MODES = [{cot: true, evb: true}, {cot: true, evb: false}, {cot: false, evb: false}];
    const rowsBy = MODES.map(md => legendRows(ctx, P, links, looks.ev, md));
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'below', cols: 2}, {mode: 'side', pw: 0.34}, {mode: 'side', pw: 0.4}]
        : [{mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.34}];
    let best = null, bestScore = -1, C = null, firstOk = -1;
    for (const [si, F] of SIZES.entries()) {
      if (firstOk >= 0 && si > firstOk + 1) break;
      for (const [mi, md] of MODES.entries()) for (const opt of opts) {
        const LG = legendFor(ctx, rowsBy[mi], F, opt);
        const problems = LG.PL && !LG.PL.ok ? ['panel-text'] : [];
        if (LG.stage.h < 300 || LG.stage.w < 300) continue;
        const M = model(ctx, P, links, LG.stage, F, md);
        const c = {F, md, ...LG, M, problems: [...problems, ...M.problems]};
        const score = Math.min(M.BL.ew, 150) * Math.sqrt(M.BL.cw) * (F < 19.5 ? 0.3 : 1) * (md.cot ? 1.15 : 1) * (md.evb ? 1.1 : 1);
        if (!c.problems.length && firstOk < 0 && F >= 19.5) firstOk = si;
        if (!c.problems.length && score > bestScore) { best = c; bestScore = score; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    if (best) C = best;
    const M = C.M;
    // explicit relationships between present elements
    const present = id => elemCenter(M, id) !== null;
    const rels = P.relationships.filter(q => q.from !== q.to && present(q.from) && present(q.to)).map((q, i) => {
      const a = elemCenter(M, q.from), b = elemCenter(M, q.to);
      const from = elemAnchor(M, q.from, b), to = elemAnchor(M, q.to, a, q.kind === 'relation' ? 6 : 12);
      return {...q, i, from, to};
    });
    // tracer route through the traversal order along the drawn lines
    const order = P.traversalOrder.filter(present);
    const legs = [];
    for (let i = 1; i < order.length; i++) {
      const a = order[i - 1], b = order[i];
      const link = links.find(l => (`e${l.e + 1}` === a && `p${l.c + 1}` === b) || (`e${l.e + 1}` === b && `p${l.c + 1}` === a));
      let pts;
      if (link) { pts = M.routes[link.n].pts.slice(); if (a[0] === 'p') pts.reverse(); }
      else {
        const rel = rels.find(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
        if (rel) pts = rel.from && (rel.from === a) ? [rel.from, rel.to] : [rel.from, rel.to];
        if (rel) pts = rel.from === undefined ? null : (rel.from && rel.from === a ? [rel.from, rel.to] : (rel.from === a ? [rel.from, rel.to] : (rel.from === b ? [rel.to, rel.from] : [rel.from, rel.to])));
        if (rel) pts = (rel.from === a || rel.from === b) ? null : null;
        if (rel) pts = rel.fromId === undefined ? (rel.from === a ? null : null) : null;
        if (rel) { const fa = rel.from === undefined; pts = fa ? null : (rel.from && (rel.from === a) ? null : null); }
        if (rel) pts = rel.from_id;
        if (rel) pts = (rel.from && rel.to) ? (rel.from === a ? [rel.from, rel.to] : [rel.from, rel.to]) : null;
        if (rel && rel.from) pts = (P.relationships[rel.i].from === a) ? [rel.from, rel.to] : [rel.to, rel.from];
        if (!pts) pts = [elemCenter(M, a), elemCenter(M, b)];
        pts = [elemCenter(M, a), ...pts, elemCenter(M, b)];
      }
      if (link) pts = [elemCenter(M, a), ...pts, elemCenter(M, b)];
      legs.push({a, b, poly: polyline(pts)});
    }
    return {P, links, C, M, rels, order, legs, looks};
  },
  build(ctx, L) {
    const {C, M, P} = L;
    const BL = M.BL;
    const th = ctx.theme;
    const cards = cardNodes(ctx, BL, P, {prefix: 'cd', ids: M.ids, looks: L.looks.ev});
    const badge = personBadge(ctx, {name: 'wit', x: M.badge.x, y: M.badge.y, radius: M.badge.r, look: L.looks.w});
    const threads = L.links.map(l => threadNode(`th${l.n}`, l.kind, 4.5));
    const rings = L.links.map(l => (M.routes[l.n].ring ? g({name: `ring${l.n}`, opacity: 0, transform: T(M.routes[l.n].ring.x, M.routes[l.n].ring.y)},
      h('circle', {r: 15, fill: th.paper, stroke: THREAD, 'stroke-width': 4}),
      h('circle', {r: 4, fill: THREAD})) : null));
    const relNodes = L.rels.map(q => {
      const c = connector(ctx, {name: `rel${q.i}`, from: q.from, to: q.to, kind: q.kind, bend: 0.08, color: kindColor(ctx, q.kind)});
      q.c = c;
      let lab = null;
      if (ctx.show('all')) {
        const ch = chip(ctx, P.relationLabels[q.kind], {x: c.mid.x, y: c.mid.y + 14, anchor: 'middle', maxWidth: 260, size: Math.max(16, C.F * 0.84), minSize: 16, maxLines: 2, name: `rel${q.i}-lab`});
        lab = ch.node;
      }
      return g({name: `relg${q.i}`}, c.node, lab ? g({name: `rel${q.i}-labg`, opacity: 0}, lab) : null);
    });
    const outline = h('path', {name: 'outline', d: roundRectPath(M.S.x + M.S.w * 0.12, M.S.y + M.S.h * 0.12, M.S.w * 0.76, M.S.h * 0.76, 16), fill: LINEN, stroke: FRAME, 'stroke-width': 10, opacity: 0.9});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, panelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      outline,
      g({name: 'tierC'}, cards.claims.map((n, i) => g({name: `fc${i}`}, n))),
      g({name: 'tierE'}, slotLabelNodes(ctx, BL, M.ids, 'slot-labels'), cards.evid.map((n, j) => g({name: `fe${j}`}, n))),
      g({name: 'witG'}, g({name: 'fw'}, badge.node)),
      relNodes,
      threads,
      rings,
      g({name: 'tracer', opacity: 0}, h('circle', {r: 20, fill: th.accent, opacity: 0.25}), h('circle', {r: 10, fill: th.accent, stroke: th.paper, 'stroke-width': 3})),
      panels,
    );
  },
  frame(ctx, L, u) {
    const {M, P} = L;
    const BL = M.BL;
    const nodes = {};
    // separate: tiers start compact around the centre
    const kS = ease.inOutCubic(seg(u, ...W.separate));
    const kG = ease.inOutCubic(seg(u, ...W.gather));
    const sepY = (1 - kS) * 0.32;
    const gath = kG * 0.05;
    const dyC = (M.cy - (BL.claims[0].y + BL.ch / 2)) * (sepY + gath);
    const dyE = (M.cy - (BL.evid[0].y + BL.eh / 2)) * (sepY + gath);
    const dxW = (M.cx - M.badge.x) * (1 - kS) * 0.4;
    nodes.tierC = {transform: T(0, dyC)};
    nodes.tierE = {transform: T(0, dyE)};
    nodes.witG = {transform: T(dxW, dyE)};
    nodes.outline = {opacity: r(0.9 * (1 - kS), 3)};
    // relationships then links draw in sequence during relate
    const items = [...L.rels.map(q => ({t: 'rel', q})), ...L.links.map(l => ({t: 'link', l}))];
    const n = items.length;
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, n);
    const shift = (p, dy) => ({x: p.x, y: p.y + dy});
    items.forEach((it, i) => {
      const p = ease.inOutCubic(seg(u, W.relate[0] + i * span, W.relate[0] + (i + 0.85) * span));
      if (it.t === 'rel') {
        Object.assign(nodes, it.q.c.frame(p, p > 0 ? 1 : 0));
        nodes[`relg${it.q.i}`] = {transform: T(0, dyE * (1 - 0) * 0 + 0)};
        if (ctx.show('all')) nodes[`rel${it.q.i}-labg`] = {opacity: r(seg(u, W.relate[0] + (i + 0.6) * span, W.relate[0] + (i + 1) * span), 3)};
      } else {
        const R = M.routes[it.l.n];
        const pts = R.pts.map((q, k) => shift(q, k === 0 ? dyE : k === R.pts.length - 1 ? dyC : (dyE + dyC) / 2));
        nodes[`th${it.l.n}`] = {d: p > 0 ? partialD(pts, p) : `M${r(pts[0].x)} ${r(pts[0].y)}`, opacity: p > 0 ? 1 : 0};
        if (R.ring) nodes[`ring${it.l.n}`] = {opacity: r(seg(p, 0.35, 0.55), 3), transform: T(R.ring.x, R.ring.y + (dyE + dyC) / 2)};
      }
    });
    // tracer
    const kT = seg(u, ...W.trace);
    let tr = null, at = null;
    if (L.legs.length && kT > 0 && kT < 1) {
      const m = L.legs.length;
      const f = kT * m;
      const i = Math.min(m - 1, Math.floor(f));
      const t = ease.inOutCubic(f - i);
      tr = L.legs[i].poly.at(t);
      at = t < 0.5 ? L.legs[i].a : L.legs[i].b;
    }
    nodes.tracer = {opacity: tr ? 1 : 0, transform: tr ? T(tr.x, tr.y) : T(M.badge.x, M.badge.y)};
    // focus enlarges while the tracer is on it (and settles back)
    const focus = P.focusElement;
    let bump = 0;
    if (tr) {
      const c = elemCenter(M, focus);
      if (c) bump = clamp(1 - Math.hypot(tr.x - c.x, tr.y - c.y) / (Math.max(BL.cw, BL.ew) * 1.2));
    }
    const sc = 1 + 0.16 * ease.inOutCubic(bump);
    const scaleAt = (c, k) => `translate(${r(c.x)} ${r(c.y)}) scale(${r(k, 4)}) translate(${r(-c.x)} ${r(-c.y)})`;
    BL.claims.forEach((Cc, i) => { const id = `p${i + 1}`; nodes[`fc${i}`] = {transform: id === focus ? scaleAt(elemCenter(M, id), sc) : ''}; });
    BL.evid.forEach((E, j) => { const id = `e${j + 1}`; nodes[`fe${j}`] = {transform: id === focus ? scaleAt(elemCenter(M, id), sc) : ''}; });
    nodes.fw = {transform: focus === 'witness' ? scaleAt(elemCenter(M, 'witness'), sc) : ''};
    const phase = u < W.separate[1] ? 'separate' : u < W.relate[1] ? 'relate' : u < W.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        phase, tracer: tr ? R2(tr) : null, tracerAt: at, order: L.order, focusScale: r(sc, 3),
        relKinds: L.rels.map(q => q.kind), relArrow: L.rels.map(q => Boolean(LINK_STYLES[q.kind].arrow)),
        linkKinds: L.links.map(l => l.kind), rings: L.links.map(l => Boolean(M.routes[l.n].ring)),
        linkEnds: L.links.map(l => ({e: R2(BL.ends[l.n].e), c: R2(BL.ends[l.n].c)})),
        evBoxes: BL.evid.map(E => ({x: r(E.x), y: r(E.y), w: r(E.w), h: r(E.h)})), claimBoxes: BL.claims.map(Cc => ({x: r(Cc.x), y: r(Cc.y), w: r(Cc.w), h: r(Cc.h)})),
        separated: r(kS, 3), problems: L.C.problems, textPx: r(L.C.F, 1), ew: r(BL.ew, 1), cw: r(BL.cw, 1),
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
    slug: 'evidence-analysis-01-mechanism',
    title: 'Proposition map — exploded map: the witness as source, labelled evidence below, claims above; each supplied link anchored to its cards, disputed links routed through an inference ring',
    titleEs: 'Mapa de proposiciones — Mecanismo o relación explicada',
    category: 'evidence-analysis',
    categoryName: 'Análisis y presentación de pruebas',
    motif: 'Mapa de proposiciones',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The proposition board comes apart into tiers: claim cards above, labelled evidence cards below, the witness as a portrait badge at the source of her statement. Only the explicit relationships are drawn, anchored to their elements: supplied relationships in the library\'s kind styles (a plain relation has no arrowhead; causal only when supplied) and supplied links as threads — solid for direct support, dashed through a hollow inference ring for a disputed inference. A tracer follows the supplied order while the focus element enlarges. No weighing of evidence, no credibility judgement, no proof standard; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'analysis', 'proposition map', 'mechanism', 'claims', 'links', 'inference', 'disputed', 'witness', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-analysis/kits/analysis-art.js', 'src/animations/evidence-analysis/kits/mapa-proposiciones.js', 'src/primitives/badges.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
