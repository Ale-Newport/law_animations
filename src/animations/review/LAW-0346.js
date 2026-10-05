/**
 * LAW-0346 — Sustitución de decisión · mechanism
 *
 * Storyboard (an exploded view of the substitution: the three places of the
 * rail — the intake tray, the position held by its holder frame and the history
 * pocket — stand apart on the lower tier; the two cards — B ◆ the later result
 * supplied, A ● the initial result — are lifted onto the upper tier, each between
 * the two places it is related to; wide frames: places in a row, cards above the
 * gaps; tall frames: places in a column, cards beside the gaps):
 *  0.00–0.18  separate: the cards lie in their places (B in the tray, A in the
 *             position), then lift off and rise to the upper tier; an occupant
 *             token (a small card face with the same glyph) stays in each place
 *             they left. Captions name every component (editable).
 *  0.18–0.43  draw ONLY the supplied relationships, each in its kind's style
 *             (plain relation = a line with end dots, no arrow; sequence = a line
 *             with an arrowhead; communication = a double line; causal = a heavy
 *             line with an arrowhead, only when supplied). A legend names each
 *             kind used.
 *  0.43–0.75  a tracer follows the supplied traversal order along the
 *             relationships (around the components' edges, never over a text);
 *             the focus element enlarges while the tracer passes. Meanwhile the
 *             part that changes changes: the ◆ token slides from the tray into the
 *             position and pushes the ● token into the history pocket.
 *  0.75–1.00  everything stays assembled and visible — origin (the tray),
 *             transformation (the position's occupant) and state (the history
 *             keeps card A) — with the supplied states captioned.
 * Nothing is evaluated: relation is never drawn as causation unless supplied;
 * neither card is marked right or wrong; no rule, time limit or outcome;
 * jurisdiction unspecified.
 * @module animations/review/LAW-0346
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline} from '../../core/geometry.js';
import {str, obj} from '../../schemas/fields.js';
import {mechanismFields, RELATION_KINDS} from '../../schemas/fields.js';
import {pxPerUnit} from '../hearings/kits/apertura-audiencia.js';
import {
  sdFields, SD_EN, SD_ES, localisedSd, fitG, textAt, cardModel, cardNode, placeNode, tokenNode, headPath,
  calendarNode, orderPips, INK, R2, overlaps,
} from './kits/sustitucion-de-decision.js';

const ID = 'LAW-0346';
const DURATION = 7000;
const IDS = ['intake', 'later', 'position', 'initial', 'history'];
const W = {
  lift: [0.04, 0.15], capsIn: [0.12, 0.17], links: [0.18, 0.43], trace: [0.44, 0.74],
  tokB: [0.56, 0.68], tokA: [0.6, 0.68], states: [0.75, 0.8],
};
const SIZES = [26, 25, 24, 23, 22, 21, 20.5, 19.5, 18.5, 17.5, 16.5, 16];

const OWN_EN = {
  elements: [
    {id: 'intake', label: 'Intake tray'},
    {id: 'later', label: 'Card B ◆ (the later one)'},
    {id: 'position', label: 'Position in its holder frame'},
    {id: 'initial', label: 'Card A ● (the initial one)'},
    {id: 'history', label: 'History pocket'},
  ],
  relationships: [
    {from: 'later', to: 'intake', kind: 'relation'},
    {from: 'later', to: 'position', kind: 'sequence'},
    {from: 'initial', to: 'position', kind: 'relation'},
    {from: 'initial', to: 'history', kind: 'sequence'},
  ],
  focusElement: 'position',
  relationLabels: {relation: 'Line with dots: a plain relation (as supplied)', communication: 'Double line: a communication (as supplied)', sequence: 'Line with a head: a sequence, moves to (as supplied)', causal: 'Heavy line with a head: a causal link (only as supplied)'},
  traversalOrder: ['intake', 'later', 'position', 'initial', 'history'],
};
const OWN_ES = {
  elements: [
    {id: 'intake', label: 'Bandeja de entrada'},
    {id: 'later', label: 'Tarjeta B ◆ (la posterior)'},
    {id: 'position', label: 'Posición en su marco'},
    {id: 'initial', label: 'Tarjeta A ● (la inicial)'},
    {id: 'history', label: 'Bolsillo de historial'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'position',
  relationLabels: {relation: 'Línea con puntos: una relación simple (según lo aportado)', communication: 'Línea doble: una comunicación (según lo aportado)', sequence: 'Línea con punta: una secuencia, pasa a (según lo aportado)', causal: 'Línea gruesa con punta: un vínculo causal (solo si se aporta)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...SD_EN, ...OWN_EN};
const ES = {...SD_ES, ...OWN_ES};

const mf = mechanismFields(IDS);
const sceneSchema = {
  ...sdFields,
  ...mf,
  relationLabels: obj('Legend caption of each relation kind (shown once per kind used)', {
    relation: str('Caption for plain relations', 70),
    communication: str('Caption for communications', 70),
    sequence: str('Caption for sequence links', 70),
    causal: str('Caption for supplied causal links', 70),
  }, ['relation', 'communication', 'sequence', 'causal']),
};
const defaultParams = {...EN};

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

const labelOf = (P, id) => {
  const e = (P.elements || []).find(q => q.id === id);
  const d = (P.locale === 'es' ? OWN_ES : OWN_EN).elements.find(q => q.id === id);
  return e ? e.label : d.label;
};

function compose(ctx, P, F, opt) {
  const D = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const tall = opt.tall;
  const problems = [];
  const mx = 18, my = 14;
  // kinds used (legend), order note, key
  const kinds = RELATION_KINDS.filter(k => P.relationships.some(q => q.kind === k));
  const legendRows = [];
  if (showAll) kinds.forEach(k => legendRows.push({kind: k, text: P.relationLabels[k], name: `lg-${k}`}));
  if (showAll) legendRows.push({kind: 'pips', text: P.labels.order, name: 'order-note'});
  if (showKey) legendRows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const iconW = F * 2.6;
  const legCols = tall ? 1 : 2;
  const legColW = (D.w - 2 * mx - (legCols - 1) * F * 1.5) / legCols;
  const leg = legendRows.map(row => ({...row, fit: fitG(row.text, {maxWidth: legColW - (row.kind === 'key' ? 0 : iconW), size: F, minSize: F, maxLines: 3, weight: row.kind === 'key' ? 600 : 500})}));
  leg.forEach(q => { if (!q.fit.ok) problems.push('legend'); });
  // legend placement: column-major in legCols columns
  const perCol = Math.ceil(leg.length / legCols) || 0;
  const colH = [];
  leg.forEach((q, i) => {
    const c = Math.floor(i / Math.max(1, perCol));
    q.col = c;
    q.y = colH[c] || 0;
    colH[c] = q.y + q.fit.height + F * 0.55;
  });
  const legH = leg.length ? Math.max(...colH) - F * 0.55 : 0;
  // geometry of the components
  let cw, plateW, plateH, colW;
  if (!tall) {
    colW = (D.w - 2 * mx) / 3;
    plateW = Math.min(colW * 0.56, F * 12);
    cw = Math.min(colW * 0.86, F * opt.cwMax);
  } else {
    colW = D.w - 2 * mx;
    plateW = Math.min(colW * 0.4, F * 12);
    cw = Math.min(colW * 0.5, F * opt.cwMax);
  }
  const CM = cardModel(ctx, {w: cw, F, minF: F, maxLines: opt.cardLines, a: P.decisions.initial, b: P.decisions.later, showText: showKey, minH: showKey ? 0 : cw * 0.6});
  if (!CM.ok) problems.push('card-text');
  plateH = Math.max(F * 3.6, Math.min(CM.h * 0.62, plateW * 0.62));
  // captions: element label (bold) + description (+ grounds) + reserved state
  const capW = tall ? colW * 0.42 : colW - 24;
  const desc = {intake: P.routes.intake, position: P.decisions.position, history: P.routes.history};
  const states = {position: P.outcomes.position, history: P.outcomes.history};
  const caps = {};
  for (const id of ['intake', 'position', 'history']) {
    const items = [];
    if (showKey) items.push({k: 'label', fit: fitG(labelOf(P, id), {maxWidth: capW, size: F, minSize: F, maxLines: 2, weight: 700})});
    if (showAll) items.push({k: 'desc', fit: fitG(desc[id], {maxWidth: capW, size: F, minSize: F, maxLines: 3, weight: 500}), italic: true});
    if (showAll && id === 'intake') items.push({k: 'grounds', fit: fitG(P.grounds, {maxWidth: capW, size: F, minSize: F, maxLines: 3, weight: 500}), italic: true});
    if (showKey && states[id]) items.push({k: 'state', fit: fitG(states[id], {maxWidth: capW - F * 0.9, size: F, minSize: F, maxLines: 3, weight: 600}), state: true});
    let y = 0;
    for (const it of items) { if (!it.fit.ok) problems.push(`caption-${id}`); it.y = y; y += it.fit.height + F * 0.3; }
    caps[id] = {items, h: Math.max(0, y - F * 0.3), w: capW};
  }
  const cardCaps = {};
  for (const id of ['later', 'initial']) {
    const fit = showKey ? fitG(labelOf(P, id), {maxWidth: cw, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
    if (fit && !fit.ok) problems.push(`caption-${id}`);
    cardCaps[id] = fit;
  }
  const cardCapH = Math.max(...['later', 'initial'].map(id => (cardCaps[id] ? cardCaps[id].height + F * 0.45 : 0)));
  const boxes = {};
  const capAt = {};
  let need, spare;
  if (!tall) {
    const capsH = Math.max(caps.intake.h, caps.position.h, caps.history.h);
    const corridor = Math.max(F * 4.2, 96);
    need = cardCapH + CM.h + corridor + 14 + plateH + F * 0.6 + capsH + F * 1.2 + legH;
    spare = D.h - 2 * my - need;
    if (spare < -0.5) problems.push('height');
    const sp = Math.max(0, spare);
    let y = my + sp * 0.12;
    const cardY = y + cardCapH;
    y = cardY + CM.h + corridor + sp * 0.3;
    const plateY = y + 14;
    const capY = plateY + plateH + F * 0.6;
    const legY = D.h - my - legH - sp * 0.12;
    ['intake', 'position', 'history'].forEach((id, i) => {
      const cx = mx + colW * (i + 0.5);
      boxes[id] = {x: cx - plateW / 2, y: plateY, w: plateW, h: plateH};
      capAt[id] = {x: cx - capW / 2, y: capY};
    });
    ['later', 'initial'].forEach((id, i) => {
      const cx = mx + colW * (i + 1);
      boxes[id] = {x: cx - cw / 2, y: cardY, w: cw, h: CM.h};
    });
    return finish({legY, capY});
  }
  // tall: places in a column on the left, cards on the right beside the gaps
  const leftX = mx;
  const placeBlock = id => plateH + 14 + F * 0.5 + caps[id].h;
  const colNeed = ['intake', 'position', 'history'].reduce((a, id) => a + placeBlock(id), 0);
  const gapMin = Math.max(F * 1.6, 40);
  need = colNeed + gapMin * 2 + F * 1.4 + legH;
  // the cards must fit beside the gaps: each card centred on a gap between two place blocks
  spare = D.h - 2 * my - need;
  if (spare < -0.5) problems.push('height');
  const sp = Math.max(0, spare);
  const gapY = gapMin + sp * 0.28;
  let y = my + sp * 0.08 + 12;
  const plateX = leftX + 8;
  for (const id of ['intake', 'position', 'history']) {
    boxes[id] = {x: plateX, y, w: plateW, h: plateH};
    capAt[id] = {x: plateX, y: y + plateH + F * 0.5};
    y += placeBlock(id) + gapY;
  }
  const cardX = D.w - mx - cw;
  ['later', 'initial'].forEach((id, i) => {
    const a = i === 0 ? 'intake' : 'position', b = i === 0 ? 'position' : 'history';
    const midY = (boxes[a].y + boxes[a].h / 2 + boxes[b].y + boxes[b].h / 2) / 2;
    boxes[id] = {x: cardX, y: midY - CM.h / 2 + cardCapH / 2, w: cw, h: CM.h};
  });
  // the cards may not overlap each other or leave the frame
  if (boxes.later.y + CM.h + cardCapH + 16 > boxes.initial.y) problems.push('cards-overlap');
  if (boxes.later.y - cardCapH < my) problems.push('card-top');
  const legY = D.h - my - legH;
  if (boxes.initial.y + CM.h > legY - F) problems.push('card-legend');
  if (capAt.history.y + caps.history.h > legY - F * 0.6) problems.push('caps-legend');
  return finish({legY});

  function finish(extra) {
    // caption collisions with the cards (tall frames: the place captions sit left of the cards)
    for (const id of ['intake', 'position', 'history']) {
      const cb = {x: capAt[id].x, y: capAt[id].y, w: caps[id].w, h: caps[id].h};
      for (const c of ['later', 'initial']) if (overlaps(cb, {x: boxes[c].x, y: boxes[c].y - cardCapH, w: boxes[c].w, h: boxes[c].h + cardCapH}, 6)) problems.push(`caption-card-${id}`);
    }
    return {problems, F, tall, CM, boxes, caps, capAt, cardCaps, cardCapH, leg, legCols, legColW, iconW, legH, plateW, plateH, cw, ...extra};
  }
}

/** Walk along a rectangle's perimeter (shorter way) between two points on its edge. */
function perimeterWalk(b, p, q) {
  const per = 2 * (b.w + b.h);
  const tOf = pt => {
    const dl = Math.abs(pt.x - b.x), dr = Math.abs(pt.x - (b.x + b.w)), dt = Math.abs(pt.y - b.y), db = Math.abs(pt.y - (b.y + b.h));
    const m = Math.min(dl, dr, dt, db);
    if (m === dt) return clamp(pt.x - b.x, 0, b.w);
    if (m === dr) return b.w + clamp(pt.y - b.y, 0, b.h);
    if (m === db) return b.w + b.h + clamp(b.x + b.w - pt.x, 0, b.w);
    return 2 * b.w + b.h + clamp(b.y + b.h - pt.y, 0, b.h);
  };
  const at = t => {
    let s = ((t % per) + per) % per;
    if (s <= b.w) return {x: b.x + s, y: b.y};
    s -= b.w;
    if (s <= b.h) return {x: b.x + b.w, y: b.y + s};
    s -= b.h;
    if (s <= b.w) return {x: b.x + b.w - s, y: b.y + b.h};
    s -= b.w;
    return {x: b.x, y: b.y + b.h - s};
  };
  const t0 = tOf(p), t1 = tOf(q);
  let d = t1 - t0;
  if (d > per / 2) d -= per;
  if (d < -per / 2) d += per;
  const n = Math.max(2, Math.ceil(Math.abs(d) / 12));
  const out = [];
  for (let i = 1; i < n; i++) out.push(at(t0 + (d * i) / n));
  return out;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1359]},
  layout(ctx) {
    const P = localisedSd(ctx, EN, ES);
    const px = pxPerUnit(ctx);
    const tall = ctx.view.shape === 'portrait';
    const opts = tall ? [{tall: true, cwMax: 18, cardLines: 5}, {tall: true, cwMax: 20, cardLines: 7}] : [{tall: false, cwMax: 15, cardLines: 4}, {tall: false, cwMax: 18, cardLines: 6}];
    let best = null;
    outer:
    for (const Fp of SIZES) for (const opt of opts) {
      const L = compose(ctx, P, Fp / px, opt);
      if (!best || L.problems.length < best.problems.length) best = L;
      if (!L.problems.length) { best = L; break outer; }
    }
    const L = best;
    L.P = P;
    L.px = px;
    const B = L.boxes;
    const ctr = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    // connectors: only the supplied relationships (anchored to the real edges; a small gap at each end)
    L.links = P.relationships.map((rel, i) => {
      const A = B[rel.from], Bb = B[rel.to];
      if (!A || !Bb || rel.from === rel.to) return null;
      const a = edgeAnchor(A, ctr(Bb), 6), b = edgeAnchor(Bb, ctr(A), rel.kind === 'relation' ? 6 : 10);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      return {i, rel, a, b, len, ang: Math.atan2(b.y - a.y, b.x - a.x)};
    }).filter(Boolean);
    // the tracer route: along the relationships (edge to edge), around each component's edge between its two anchors
    const order = (P.traversalOrder || []).filter(id => B[id]);
    const pts = [];
    const visits = [];
    let cur = null; // current point on an edge
    for (let k = 0; k < order.length; k++) {
      const id = order[k];
      if (k === 0) { const nxt = order[1] ? ctr(B[order[1]]) : ctr(B[id]); cur = edgeAnchor(B[id], nxt, 6); pts.push(cur); visits.push({id, idx: 0}); continue; }
      const prev = order[k - 1];
      const link = L.links.find(q => (q.rel.from === prev && q.rel.to === id) || (q.rel.from === id && q.rel.to === prev));
      const out = link ? (link.rel.from === prev ? link.a : link.b) : edgeAnchor(B[prev], ctr(B[id]), 6);
      const inn = link ? (link.rel.from === prev ? link.b : link.a) : edgeAnchor(B[id], ctr(B[prev]), 6);
      const pad = 6;
      const big = b => ({x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad});
      pts.push(...perimeterWalk(big(B[prev]), cur, out), out, inn);
      visits.push({id, idx: pts.length - 1});
      cur = inn;
    }
    if (pts.length < 2) pts.push({x: pts[0] ? pts[0].x + 1 : 0, y: pts[0] ? pts[0].y : 0});
    const poly = polyline(pts);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const tot = cum[cum.length - 1] || 1;
    L.route = {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / tot}))};
    // card start: lying in their places, scaled to fit
    const fitIn = (card, place) => {
      const s0 = Math.min(0.94 * place.w / card.w, 0.94 * place.h / card.h);
      return {s0, x: place.x + (place.w - card.w * s0) / 2, y: place.y + (place.h - card.h * s0) / 2};
    };
    L.startB = fitIn(B.later, B.intake);
    L.startA = fitIn(B.initial, B.position);
    L.tokS = Math.min(L.plateH * 0.62, L.plateW * 0.5);
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const B = L.boxes;
    const F = L.F;
    const parts = [];
    // places
    for (const id of ['intake', 'position', 'history']) {
      const b = B[id];
      parts.push(g({name: `mc-${id}-at`, transform: T(b.x, b.y)}, placeNode(ctx, {prefix: `mc-${id}`, kind: id, w: b.w, h: b.h})));
    }
    // occupant tokens (standing in for the cards in their places)
    parts.push(g({name: 'mc-tokB-at', transform: T(B.intake.x + B.intake.w / 2, B.intake.y + B.intake.h / 2)}, tokenNode(ctx, {name: 'mc-tokB', side: 'b', size: L.tokS, glyphName: 'mc-tokB-g'})));
    parts.push(g({name: 'mc-tokA-at', transform: T(B.position.x + B.position.w / 2, B.position.y + B.position.h / 2)}, tokenNode(ctx, {name: 'mc-tokA', side: 'a', size: L.tokS, glyphName: 'mc-tokA-g'})));
    // connectors
    const links = [];
    for (const k of L.links) {
      const color = k.rel.kind === 'sequence' ? th.fg : k.rel.kind === 'communication' ? th.accent2 : k.rel.kind === 'causal' ? INK : th.fgSoft;
      const wdt = k.rel.kind === 'causal' ? 6 : 3.5;
      const d = `M${r(k.a.x)} ${r(k.a.y)}L${r(k.b.x)} ${r(k.b.y)}`;
      const dash = {'stroke-dasharray': `${r(k.len)} ${r(k.len + 6)}`, 'stroke-dashoffset': r(k.len), 'data-draw': 1};
      const nx = -Math.sin(k.ang) * 3.5, ny = Math.cos(k.ang) * 3.5;
      links.push(g({name: `mc-l${k.i}`, opacity: 0},
        k.rel.kind === 'communication'
          ? [h('path', {name: `mc-l${k.i}-p`, d: `M${r(k.a.x + nx)} ${r(k.a.y + ny)}L${r(k.b.x + nx)} ${r(k.b.y + ny)}`, fill: 'none', stroke: color, 'stroke-width': 2.5, ...dash}),
            h('path', {name: `mc-l${k.i}-q`, d: `M${r(k.a.x - nx)} ${r(k.a.y - ny)}L${r(k.b.x - nx)} ${r(k.b.y - ny)}`, fill: 'none', stroke: color, 'stroke-width': 2.5, ...dash})]
          : h('path', {name: `mc-l${k.i}-p`, d, fill: 'none', stroke: color, 'stroke-width': wdt, 'stroke-linecap': 'round', ...dash}),
        k.rel.kind === 'relation' ? [h('circle', {name: `mc-l${k.i}-d0`, cx: r(k.a.x), cy: r(k.a.y), r: 5.5, fill: color, opacity: 0}), h('circle', {name: `mc-l${k.i}-d1`, cx: r(k.b.x), cy: r(k.b.y), r: 5.5, fill: color, opacity: 0})] : null,
        k.rel.kind !== 'relation' ? h('path', {name: `mc-l${k.i}-h`, d: headPath(k.rel.kind === 'causal' ? 24 : 18), transform: T(k.b.x, k.b.y, (k.ang * 180) / Math.PI), fill: color, opacity: 0}) : null));
    }
    parts.push(g({name: 'mc-links'}, links));
    // cards (drawn after the places: they lie in them at the start, then rise)
    parts.push(g({name: 'mc-cardB', transform: T(L.startB.x, L.startB.y)}, cardNode(ctx, L.CM, {prefix: 'mc-b', side: 'b', order: 2})));
    parts.push(g({name: 'mc-cardA', transform: T(L.startA.x, L.startA.y)}, cardNode(ctx, L.CM, {prefix: 'mc-a', side: 'a', order: 1})));
    // captions
    const caps = [];
    for (const id of ['later', 'initial']) {
      const f = L.cardCaps[id];
      if (f) caps.push(textAt(f, {x: B[id].x, y: B[id].y - L.cardCapH + F * 0.05, fill: th.fg, name: `cap-${id}`}));
    }
    for (const id of ['intake', 'position', 'history']) {
      const c = L.caps[id];
      const at = L.capAt[id];
      for (const it of c.items) {
        const y = at.y + it.y;
        if (it.state) {
          caps.push(g({name: `state-${id}`, opacity: 0},
            h('circle', {cx: r(at.x + F * 0.32), cy: r(y + F * 0.55), r: r(F * 0.26), fill: id === 'history' ? th.accent2 : th.accent3, stroke: INK, 'stroke-width': 1.5}),
            textAt(it.fit, {x: at.x + F * 0.9, y, fill: th.fg})));
        } else caps.push(textAt(it.fit, {x: at.x, y, fill: th.fg, italic: it.italic, name: `cap-${id}-${it.k}`}));
      }
    }
    parts.push(g({name: 'caps', opacity: 0}, caps.filter(c => !(c.attrs && /^state-/.test(c.attrs.name || '')))));
    for (const c of caps) if (c.attrs && /^state-/.test(c.attrs.name || '')) parts.push(c);
    // tracer
    parts.push(g({name: 'mc-tracer', opacity: 0},
      h('circle', {r: 17, fill: th.accent2, opacity: 0.22}),
      h('circle', {r: 9, fill: th.accent2, stroke: th.paper, 'stroke-width': 3})));
    // legend
    const D = ctx.design;
    const lg = [];
    for (const q of L.leg) {
      const x0 = 18 + q.col * (L.legColW + F * 1.5);
      const y0 = L.legY + q.y;
      const cy = y0 + Math.min(q.fit.height, F * 1.2) / 2;
      const items = [];
      if (q.kind === 'key') {
        items.push(h('line', {x1: r(x0), x2: r(x0 + Math.max(q.fit.width, F * 6)), y1: r(y0 - F * 0.28), y2: r(y0 - F * 0.28), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
        items.push(textAt(q.fit, {x: x0, y: y0, fill: th.fg, italic: true}));
      } else {
        const iw = L.iconW - F * 0.6;
        if (q.kind === 'pips') items.push(g({transform: T(x0 + iw / 2, cy)}, orderPips(2, F * 0.32)));
        else {
          const color = q.kind === 'sequence' ? th.fg : q.kind === 'communication' ? th.accent2 : q.kind === 'causal' ? INK : th.fgSoft;
          if (q.kind === 'communication') items.push(h('path', {d: `M${r(x0)} ${r(cy - 3.5)}H${r(x0 + iw)}M${r(x0)} ${r(cy + 3.5)}H${r(x0 + iw)}`, stroke: color, 'stroke-width': 2.5}));
          else items.push(h('line', {x1: r(x0 + 4), x2: r(x0 + iw - (q.kind === 'relation' ? 4 : 2)), y1: r(cy), y2: r(cy), stroke: color, 'stroke-width': q.kind === 'causal' ? 6 : 3.5}));
          if (q.kind === 'relation') items.push(h('circle', {cx: r(x0 + 4), cy: r(cy), r: 5, fill: color}), h('circle', {cx: r(x0 + iw - 4), cy: r(cy), r: 5, fill: color}));
          else items.push(h('path', {d: headPath(q.kind === 'causal' ? 20 : 15), transform: T(x0 + iw, cy), fill: color}));
        }
        items.push(textAt(q.fit, {x: x0 + L.iconW, y: y0, fill: th.fg}));
      }
      lg.push(g({name: q.name}, items));
    }
    parts.push(g({name: 'legend'}, lg));
    void D;
    return g(null, parts);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const B = L.boxes;
    const F = L.F;
    // separate: the cards rise from their places to the upper tier
    const lift = ease.inOutCubic(seg(u, ...W.lift));
    const pose = (st, box) => ({x: lerp(st.x, box.x, lift), y: lerp(st.y, box.y, lift), s: lerp(st.s0, 1, lift)});
    const pb = pose(L.startB, B.later), pa = pose(L.startA, B.initial);
    // focus: the focus element enlarges while the tracer passes it
    const tr = seg(u, ...W.trace);
    const visit = L.route.visits.find(v => v.id === L.P.focusElement);
    const focusK = visit && u >= W.trace[0] && u <= W.trace[1] + 0.02 ? Math.max(0, 1 - Math.abs(tr - visit.t) / 0.12) : 0;
    const fk = ease.inOutSine(focusK);
    const fs = 1 + 0.1 * fk;
    const scaleFor = id => (id === L.P.focusElement ? fs : 1);
    const cardTr = (p, id) => {
      const sc = p.s * scaleFor(id);
      const w = L.CM.w * p.s, hh = L.CM.h * p.s;
      const cx = p.x + w / 2, cy = p.y + hh / 2;
      return `${T(cx - (L.CM.w * sc) / 2, cy - (L.CM.h * sc) / 2)} scale(${r(sc, 4)})`;
    };
    nodes['mc-cardB'] = {transform: cardTr(pb, 'later')};
    nodes['mc-cardA'] = {transform: cardTr(pa, 'initial')};
    // card text only once the cards are full size (never under the text floor)
    const txt = r(seg(u, W.lift[1] - 0.012, W.lift[1]), 3);
    if (L.CM.fits.a) { nodes['mc-a-text'] = {opacity: txt}; nodes['mc-b-text'] = {opacity: txt}; }
    for (const id of ['intake', 'position', 'history']) {
      const b = B[id], s = scaleFor(id);
      nodes[`mc-${id}-at`] = {transform: `${T(b.x + (b.w * (1 - s)) / 2, b.y + (b.h * (1 - s)) / 2)} scale(${r(s, 4)})`};
    }
    // tokens: appear in the places the cards leave; the ◆ token slides into the position and pushes the ● token on
    const tokIn = r(seg(u, W.lift[0] + 0.03, W.lift[1]), 3);
    const tb = ease.inOutSine(seg(u, ...W.tokB)), ta = ease.inOutSine(seg(u, ...W.tokA));
    const c = id => ({x: B[id].x + B[id].w / 2, y: B[id].y + B[id].h / 2});
    const pB = {x: lerp(c('intake').x, c('position').x, tb), y: lerp(c('intake').y, c('position').y, tb)};
    const pA = {x: lerp(c('position').x, c('history').x, ta), y: lerp(c('position').y, c('history').y, ta)};
    nodes['mc-tokB-at'] = {transform: T(pB.x, pB.y)};
    nodes['mc-tokA-at'] = {transform: T(pA.x, pA.y)};
    nodes['mc-tokB'] = {opacity: tokIn};
    nodes['mc-tokA'] = {opacity: tokIn};
    // captions
    const capsOn = r(seg(u, ...W.capsIn), 3);
    nodes.caps = {opacity: capsOn};
    const st = r(seg(u, ...W.states), 3);
    for (const id of ['position', 'history']) if (L.caps[id].items.some(i => i.state)) nodes[`state-${id}`] = {opacity: st};
    // links drawn in supplied order
    const n = L.links.length;
    L.links.forEach((k, j) => {
      const p = ease.inOutSine(seg(u, W.links[0] + (j * (W.links[1] - W.links[0])) / Math.max(1, n), W.links[0] + ((j + 1) * (W.links[1] - W.links[0])) / Math.max(1, n)));
      nodes[`mc-l${k.i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`mc-l${k.i}-p`] = {'stroke-dashoffset': r(k.len * (1 - p))};
      if (k.rel.kind === 'communication') nodes[`mc-l${k.i}-q`] = {'stroke-dashoffset': r(k.len * (1 - p))};
      if (k.rel.kind === 'relation') { nodes[`mc-l${k.i}-d0`] = {opacity: p > 0 ? 1 : 0}; nodes[`mc-l${k.i}-d1`] = {opacity: p >= 0.985 ? 1 : 0}; }
      else nodes[`mc-l${k.i}-h`] = {opacity: p >= 0.985 ? 1 : 0};
    });
    // tracer
    const tp = L.route.poly.at(tr);
    const tOn = u >= W.trace[0] - 0.01 && u <= W.trace[1] + 0.01 ? 1 : 0;
    nodes['mc-tracer'] = {transform: T(tp.x, tp.y), opacity: tOn};
    const visited = L.route.visits.filter(v => tr >= v.t - 1e-6).map(v => v.id);
    return {
      nodes,
      semantic: {
        beat: u < 0.18 ? 'separate' : u < 0.43 ? 'relations' : u < 0.75 ? 'trace' : 'assembled',
        lift: r(lift, 3),
        linksDrawn: L.links.map((k, j) => r(clamp(seg(u, W.links[0] + (j * (W.links[1] - W.links[0])) / Math.max(1, n), W.links[0] + ((j + 1) * (W.links[1] - W.links[0])) / Math.max(1, n))), 3)),
        links: L.links.map(k => ({from: k.rel.from, to: k.rel.to, kind: k.rel.kind, a: R2(k.a), b: R2(k.b), arrow: k.rel.kind === 'sequence' || k.rel.kind === 'causal'})),
        boxes: Object.fromEntries(Object.entries(B).map(([k, b]) => [k, {x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)}])),
        tracer: tOn ? R2(tp) : null,
        tracerT: r(tr, 4),
        visited,
        visitOrder: L.route.visits.map(v => v.id),
        focus: L.P.focusElement,
        focusScale: r(fs, 3),
        cardB: R2(pb),
        cardA: R2(pa),
        tokenB: R2(pB),
        tokenA: R2(pA),
        positionHolds: tb >= 1 ? 'b' : tb > 0 ? 'changing' : 'a',
        historyHolds: ta >= 1 ? 'a' : ta > 0 ? 'changing' : null,
        cardText: txt,
        states: st,
        textPx: r(F * L.px, 2),
        problems: L.problems,
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
    slug: 'review-07-mechanism',
    title: 'Decision substitution — exploded view: the places of the rail, the two cards and only the supplied relations between them',
    titleEs: 'Sustitución de decisión — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Sustitución de decisión',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded view of a substitution: the intake tray, the position (in its holder frame) and the history pocket stand apart; card B (◆, later result supplied) and card A (●, initial result) rise from their places to an upper tier, each between the two places it relates to, leaving an occupant token behind. Only the supplied relationships are drawn, each in its kind\'s style (plain relation without an arrow; sequence with a head; causal only when supplied), with a legend. A tracer follows the supplied traversal order around the components; the focus element enlarges as it passes; the ◆ token slides into the position and pushes the ● token into the history pocket, where card A stays. Illustrative; nothing is evaluated; jurisdiction unspecified.',
    tags: ['review', 'decision substitution', 'mechanism', 'exploded view', 'relations', 'tracer', 'history kept', 'as supplied', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/sustitucion-de-decision.js', 'src/animations/hearings/kits/apertura-audiencia.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
