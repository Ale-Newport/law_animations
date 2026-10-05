/**
 * LAW-0342 — Confirmación ilustrativa · mechanism
 *
 * Storyboard (an exploded view; no desk, no hands): the aligned pair of decision cards — A, the original decision,
 * and B, the confirmatory decision as supplied — is taken apart into its parts: the two cards, their two result
 * fields (printed as supplied) and the alignment guide (the neutral filter strip). A calendar is a fixture only.
 *  0.00–0.18  separate: from the aligned pair (results in their cards, the strip across them) the cards move apart to
 *             the top corners, each result field slides out of its card to a row of its own (B's field lands off the
 *             line, as it lay before the alignment) and the strip drops to its own place below them as a guide.
 *  0.18–0.43  relate: only the supplied relationships are drawn, each anchored to the edges of its two parts, in the
 *             style of its kind — a plain relation has dots at both ends and no arrowhead (nothing is causal unless the
 *             author supplies it).
 *  0.43–0.75  trace: a marker follows the supplied traversal order part to part; the focus part (default: the guide)
 *             is enlarged while the marker is on it.
 *  0.75–1.00  gather: B's result field is brought level with A's (the arrow marks meet) — position only: the printed
 *             results never change —; origin, alignment and state stay visible with the key "as supplied · no
 *             conclusion drawn". No doctrine on what a confirmation means.
 * @module animations/review/LAW-0342
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  ciFields, CI_EN, CI_ES, localisedCi, cardModel, cardNode, resultNode, resultBox, filterStrip, calendarNode, panelLayout,
  panelNode, linkColor, registerRow, R2,
} from './kits/confirmacion-ilustrativa.js';

const ID = 'LAW-0342';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {apart: [0.04, 0.18], relate: [0.19, 0.42], trace: [0.44, 0.74], level: [0.75, 0.81], state: [0.8, 0.85]};
const IDS = ['original', 'confirming', 'resultA', 'resultB', 'guide'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const SIZES = [30, 28, 26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {state: 'Origin, alignment and state as supplied: the two printed results are unchanged', calendar: 'Calendar (a fixture; no date marked)'},
  es: {state: 'Origen, alineación y estado según lo aportado: los dos resultados impresos no cambian', calendar: 'Calendario (un elemento fijo; sin fechas marcadas)'},
};

const OWN_EN = {
  elements: [
    {id: 'original', label: 'Card A: original decision (as supplied)'},
    {id: 'confirming', label: 'Card B: confirmatory decision (as supplied)'},
    {id: 'resultA', label: 'Result field of card A (printed as supplied)'},
    {id: 'resultB', label: 'Result field of card B (printed as supplied)'},
    {id: 'guide', label: 'Alignment guide: the filter strip (neutral)'},
  ],
  relationships: [
    {from: 'original', to: 'resultA', kind: 'relation'},
    {from: 'confirming', to: 'resultB', kind: 'relation'},
    {from: 'resultA', to: 'guide', kind: 'relation'},
    {from: 'resultB', to: 'guide', kind: 'relation'},
    {from: 'original', to: 'confirming', kind: 'relation'},
  ],
  focusElement: 'guide',
  relationLabels: {relation: 'Linked as supplied (no direction)', communication: 'Communication as supplied', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link as supplied'},
  traversalOrder: ['original', 'resultA', 'guide', 'resultB', 'confirming'],
  stateCaption: '',
};
const OWN_ES = {
  elements: [
    {id: 'original', label: 'Tarjeta A: decisión original (según lo aportado)'},
    {id: 'confirming', label: 'Tarjeta B: decisión confirmatoria (según lo aportado)'},
    {id: 'resultA', label: 'Campo de resultado de la tarjeta A (impreso según lo aportado)'},
    {id: 'resultB', label: 'Campo de resultado de la tarjeta B (impreso según lo aportado)'},
    {id: 'guide', label: 'Guía de alineación: la tira filtro (neutra)'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'guide',
  relationLabels: {relation: 'Vinculados según lo aportado (sin dirección)', communication: 'Comunicación según lo aportado', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal según lo aportado'},
  traversalOrder: OWN_EN.traversalOrder,
  stateCaption: '',
};
const EN = {...CI_EN, ...OWN_EN};
const ES = {...CI_ES, ...OWN_ES};

const sceneSchema = {
  ...ciFields,
  elements: list('Parts of the exploded view; ids are fixed by the scene, labels are editable (a part left out is not drawn)', obj('Part', {
    id: oneOf('Part id', IDS),
    label: str('Visible label (legend)', 70),
  }, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships between parts; the kind sets the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source part id', IDS),
    to: oneOf('Target part id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Part enlarged while the marker passes', IDS),
  relationLabels: obj('Caption used for each relation kind (legend)', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links', 50),
    causal: str('Caption for supplied causal links', 50),
  }, ['relation', 'communication', 'sequence', 'causal']),
  traversalOrder: list('Order in which the marker visits the parts', oneOf('Part id', IDS), 2, 8),
  stateCaption: str('Caption of the gathered state (empty: the built-in caption)', 110),
};

const defaultParams = {...EN};

const ICON = {original: 'cardA', confirming: 'cardB', resultA: 'result', resultB: 'result', guide: 'filter'};

/** Resolved parts, relationships (both ends drawn, no self links, no duplicates) and the visiting order. */
export function resolve(P) {
  const shown = new Set(P.elements.map(e => e.id));
  const label = Object.fromEntries(P.elements.map(e => [e.id, e.label]));
  const rels = [];
  for (const q of P.relationships) {
    if (q.from === q.to || !shown.has(q.from) || !shown.has(q.to)) continue;
    if (rels.some(x => (x.from === q.from && x.to === q.to) || (x.from === q.to && x.to === q.from))) continue;
    rels.push({...q});
  }
  const order = [];
  for (const id of P.traversalOrder) if (shown.has(id) && order[order.length - 1] !== id) order.push(id);
  if (order.length < 2) for (const id of IDS) if (shown.has(id) && !order.includes(id)) order.push(id);
  const kinds = KINDS.filter(k => rels.some(q => q.kind === k));
  return {shown, label, rels, order, kinds, focus: shown.has(P.focusElement) ? P.focusElement : null};
}

export function compose(ctx, P, R, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const rows = [];
  if (showKey) for (const id of IDS) if (R.shown.has(id)) rows.push({kind: 'item', icon: ICON[id], text: R.label[id], name: `lg-${id}`});
  if (showKey) for (const k of R.kinds) rows.push({kind: 'item', icon: `kind-${k}`, text: P.relationLabels[k], name: `lg-kind-${k}`});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: ctx.t.calendar, name: 'lg-calendar'});
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t.state, name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const gapP = F * 1.4;
  let box, panel = null, PL = null;
  if (!rows.length) box = {x: 0, y: 0, w: DW, h: DH};
  else if (opts.band) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols || 1, tight: opts.tight});
    box = {x: 0, y: 0, w: DW, h: DH - PL.h - gapP};
    panel = {x: 4, y: DH - PL.h};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F});
    box = {x: 0, y: 0, w: DW - PW - gapP, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  const m = Math.max(10, F * 0.5);
  const inner = {x: box.x + m, y: box.y + m, w: box.w - 2 * m, h: box.h - 2 * m};
  const cardGap = Math.max(F * 5, inner.w * 0.1);
  const gapR0 = Math.max(F * 3.2, 58), tab0 = Math.max(F * 1.5, 24);
  const cw = Math.min(F * (showKey ? 20 : 17), (inner.w - cardGap) / 2, (inner.w - gapR0 - 2 * tab0 - F) / 2 - 2);
  let M = null;
  for (const bars of [1, 0]) {
    M = cardModel(P, {w: cw, F, showText: showKey, bars, foot: F * 1.0});
    if (M.h < inner.h * 0.62) break;
  }
  const res = resultBox(M);
  const rw = res.w, rh = res.h;
  const gapR = Math.max(F * 3.2, 58);
  const tab = Math.max(F * 1.5, 24);
  const reg = registerRow(M, 'result');
  const gh = reg.half * 2;
  const gw = 2 * rw + gapR + 1.4 * M.pad + 2 * (tab + F * 0.5);
  const dyB = rh * 0.55;
  const minV1 = Math.max(F * 2.6, 44), minV2 = Math.max(F * 2.2, 36);
  const baseH = M.h + minV1 + rh + dyB + minV2 + gh;
  const fitsH = baseH <= inner.h + 0.5;
  const fitsW = gw <= inner.w + 0.5 && cw >= F * 9;
  // spare height goes to the gaps (the parts spread out; no empty band)
  const spare = Math.max(0, inner.h - baseH);
  const v1 = minV1 + Math.min(spare * 0.55, F * 9), v2 = minV2 + Math.min(spare * 0.45, F * 7);
  const usedH = M.h + v1 + rh + dyB + v2 + gh;
  const oy = inner.y + Math.max(0, (inner.h - usedH) / 2);
  const cx = inner.x + inner.w / 2;
  const A1 = {x: cx - (2 * cw + cardGap) / 2, y: oy};
  const B1 = {x: A1.x + cw + cardGap, y: oy};
  const yRes = oy + M.h + v1;
  const rA1 = {x: cx - gapR / 2 - rw, y: yRes};
  const rB1 = {x: cx + gapR / 2, y: yRes + dyB};
  const rB2 = {x: cx + gapR / 2, y: yRes};
  const G1 = {x: cx - gw / 2, y: yRes + rh + dyB + v2};
  // start: the aligned pair, centred, results in their cards and the strip across them
  const yS = oy + (usedH - M.h) / 2 - (M.h * 0.5 - reg.y) * 0.4;
  const A0 = {x: cx - gapR / 2 - cw, y: yS};
  const B0 = {x: cx + gapR / 2, y: yS};
  const rA0 = {x: A0.x + res.x, y: A0.y + res.y};
  const rB0 = {x: B0.x + res.x, y: B0.y + res.y};
  const G0 = {x: cx - gw / 2, y: yS + reg.y - reg.half};
  const calW = F * 3.6, calH = calW * 0.84;
  const cal = cardGap >= calW + F * 2 ? {x: cx - calW / 2, y: oy + F * 0.3, w: calW, h: calH} : {x: inner.x + inner.w - calW, y: G1.y + gh - calH, w: calW, h: calH};
  const problems = [!fitsH && 'height', !fitsW && 'width', !M.ok && 'card-text', PL && !PL.ok && 'panel-text'].filter(Boolean);
  return {F, box, inner, panel, PL, M, rw, rh, gw, gh, tab, gapR, A0, A1, B0, B1, rA0, rA1, rB0, rB1, rB2, G0, G1, cal, reg, ok: !problems.length, problems};
}

/** Edge anchor of a box towards a point (pad outside the box). */
function anchor(b, toward, pad = 7) {
  const c = {x: b.x + b.w / 2, y: b.y + b.h / 2};
  const dx = toward.x - c.x, dy = toward.y - c.y;
  const sx = dx ? (b.w / 2 + pad) / Math.abs(dx) : Infinity, sy = dy ? (b.h / 2 + pad) / Math.abs(dy) : Infinity;
  const k = Math.min(sx, sy);
  return {x: c.x + dx * k, y: c.y + dy * k};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const R = resolve(P);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const arrangements = shape === 'portrait' ? [{band: true}, {band: true, cols: 2}]
      : shape === 'square' ? [{band: true, cols: 2}, {band: true, cols: 3, tight: true}, {pw: 0.36}]
        : [{pw: 0.27}, {pw: 0.31}, {pw: 0.35}, {pw: 0.39}];
    const sizes = (!showKey ? [40, 36, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements) {
        const c = compose(ctx, P, R, F, a);
        if (c.ok) { C = c; break outer; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    return {P, R, C, pxu};
  },
  build(ctx, L) {
    const {C, R} = L;
    const {M} = C;
    const parts = [];
    if (C.cal) parts.push(g({transform: T(C.cal.x, C.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: C.cal.w, h: C.cal.h})));
    // connectors under the parts
    const links = R.rels.map((q, i) => {
      const col = linkColor(ctx.theme, q.kind);
      const wdt = q.kind === 'causal' ? 5 : 3.6;
      return g({name: `link${i}`, opacity: 0},
        h('path', {name: `link${i}-line`, d: 'M0 0L1 0', fill: 'none', stroke: col, 'stroke-width': wdt, 'stroke-linecap': 'round'}),
        q.kind === 'relation' || q.kind === 'communication' ? h('circle', {name: `link${i}-dA`, r: 5, fill: col}) : h('rect', {name: `link${i}-dA`, x: -5, y: -5, width: 10, height: 10, fill: col}),
        q.kind === 'relation' ? h('circle', {name: `link${i}-dB`, r: 5, fill: col})
          : q.kind === 'communication' ? h('circle', {name: `link${i}-dB`, r: 6.5, fill: ctx.theme.card, stroke: col, 'stroke-width': 2.6})
            : h('path', {name: `link${i}-dB`, d: q.kind === 'causal' ? 'M4 0L-16 -10L-16 10Z' : 'M3 0L-13 -8L-13 8Z', fill: col}));
    });
    parts.push(g({name: 'links'}, links));
    const show = id => R.shown.has(id);
    if (show('original')) parts.push(g({name: 'el-original', transform: T(C.A0.x, C.A0.y)}, cardNode(ctx, M, 'a', {prefix: 'carda', slot: true})));
    if (show('confirming')) parts.push(g({name: 'el-confirming', transform: T(C.B0.x, C.B0.y)}, cardNode(ctx, M, 'b', {prefix: 'cardb', slot: true})));
    const arrow = {len: C.gapR / 2 - 2, hgt: Math.min(C.reg.half * 1.3, C.F * 1.6)};
    if (show('resultA')) parts.push(g({name: 'el-resultA', transform: T(C.rA0.x, C.rA0.y)}, resultNode(ctx, M, 'a', {prefix: 'resa', arrow})));
    if (show('resultB')) parts.push(g({name: 'el-resultB', transform: T(C.rB0.x, C.rB0.y)}, resultNode(ctx, M, 'b', {prefix: 'resb', arrow})));
    if (show('guide')) parts.push(g({name: 'el-guide', transform: T(C.G0.x, C.G0.y)}, filterStrip(ctx, {prefix: 'guide-art', w: C.gw, h: C.gh, tab: C.tab})));
    parts.push(g({name: 'tracer', opacity: 0},
      h('circle', {r: 20, fill: ctx.theme.accent3, opacity: 0.3}),
      h('circle', {r: 10, fill: ctx.theme.accent3, stroke: '#fff', 'stroke-width': 3})));
    return g({name: 'scene'},
      g({name: 'parts'}, parts),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null);
  },
  frame(ctx, L, u) {
    const {C, R, P} = L;
    const {M} = C;
    const nodes = {};
    const e = ease.inOutCubic;
    const kA = e(seg(u, ...W.apart));
    const kL = e(seg(u, ...W.level));
    const mix = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
    const pos = {
      original: mix(C.A0, C.A1, kA),
      confirming: mix(C.B0, C.B1, kA),
      resultA: mix(C.rA0, C.rA1, kA),
      resultB: kL > 0 ? mix(C.rB1, C.rB2, kL) : mix(C.rB0, C.rB1, kA),
      guide: mix(C.G0, C.G1, kA),
    };
    const size = {original: {w: M.w, h: M.h}, confirming: {w: M.w, h: M.h}, resultA: {w: C.rw, h: C.rh}, resultB: {w: C.rw, h: C.rh}, guide: {w: C.gw, h: C.gh}};
    // tracer along the visiting order (centre to centre), the focus part enlarged while the marker is on it
    const centreOf = id => ({x: pos[id].x + size[id].w / 2, y: pos[id].y + size[id].h / 2});
    const nSeg = R.order.length - 1;
    const tq = seg(u, ...W.trace);
    const segF = tq * nSeg;
    const si = Math.min(nSeg - 1, Math.floor(segF));
    const local = clamp(segF - si);
    // the marker dwells at each part (first and last 25 % of each hop) and travels in between
    const travel = ease.inOutSine(clamp((local - 0.25) / 0.5));
    const tp = mix(centreOf(R.order[si]), centreOf(R.order[si + 1]), travel);
    const at = travel < 0.02 ? R.order[si] : travel > 0.98 ? R.order[si + 1] : null;
    const tracing = u >= W.trace[0] && u <= W.trace[1];
    nodes.tracer = {opacity: r(tracing ? Math.min(1, seg(u, W.trace[0], W.trace[0] + 0.015), 1 - seg(u, W.trace[1] - 0.015, W.trace[1])) : 0, 3), transform: T(tp.x, tp.y)};
    // focus: enlarged while the marker is on the focus part (smooth in/out)
    let fk = 0;
    if (R.focus && tracing) {
      for (let j = 0; j <= nSeg; j++) {
        if (R.order[j] !== R.focus) continue;
        const tj = W.trace[0] + ((W.trace[1] - W.trace[0]) * (j + (j === 0 ? 0 : 0))) / nSeg;
        const span = (W.trace[1] - W.trace[0]) / nSeg;
        fk = Math.max(fk, clamp(1 - Math.abs(u - tj) / (span * 0.45)));
      }
    }
    const zoom = 1 + 0.14 * ease.inOutSine(fk);
    const boxOf = id => {
      const p = pos[id], s = size[id];
      const k = id === R.focus ? zoom : 1;
      const c = {x: p.x + s.w / 2, y: p.y + s.h / 2};
      return {x: c.x - (s.w * k) / 2, y: c.y - (s.h * k) / 2, w: s.w * k, h: s.h * k};
    };
    for (const id of IDS) {
      if (!R.shown.has(id)) continue;
      const p = pos[id], s = size[id];
      const k = id === R.focus ? zoom : 1;
      nodes[`el-${id}`] = {transform: k === 1 ? T(p.x, p.y) : `${scaleAbout(p.x + s.w / 2, p.y + s.h / 2, k)} ${T(p.x, p.y)}`};
    }
    // connectors: drawn on in the supplied order, anchored to both parts' edges every frame
    const nR = R.rels.length;
    const linkInfo = R.rels.map((q, i) => {
      const bA = boxOf(q.from), bB = boxOf(q.to);
      const cA = {x: bA.x + bA.w / 2, y: bA.y + bA.h / 2}, cB = {x: bB.x + bB.w / 2, y: bB.y + bB.h / 2};
      const a = anchor(bA, cB), b = anchor(bB, cA, q.kind === 'relation' ? 7 : 10);
      const len = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const span = (W.relate[1] - W.relate[0]) / Math.max(1, nR);
      const p = e(seg(u, W.relate[0] + i * span, W.relate[0] + (i + 0.85) * span));
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      nodes[`link${i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`link${i}-line`] = {d: `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`, 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len * (1 - p))};
      nodes[`link${i}-dA`] = {transform: T(a.x, a.y, ang), opacity: p > 0 ? 1 : 0};
      nodes[`link${i}-dB`] = {transform: T(b.x, b.y, ang), opacity: p >= 0.985 ? 1 : 0};
      return {from: q.from, to: q.to, kind: q.kind, p: r(p, 3), a: R2(a), b: R2(b), arrow: q.kind === 'sequence' || q.kind === 'causal', len: r(len, 1),
        endsOk: Math.abs(Math.max(Math.abs(a.x - (bA.x + bA.w / 2)) - bA.w / 2, Math.abs(a.y - (bA.y + bA.h / 2)) - bA.h / 2) - 7) < 1.5
          && Math.abs(Math.max(Math.abs(b.x - (bB.x + bB.w / 2)) - bB.w / 2, Math.abs(b.y - (bB.y + bB.h / 2)) - bB.h / 2) - (q.kind === 'relation' ? 7 : 10)) < 1.5};
    });
    const stateK = seg(u, ...W.state);
    if (C.PL) for (const row of C.PL.rows) if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const visit = tracing ? R.order.slice(0, si + 1 + (travel > 0.98 ? 1 : 0)) : u > W.trace[1] ? R.order.slice() : [];
    const tipA = {x: pos.resultA.x + C.rw + C.gapR / 2 - 2, y: pos.resultA.y + C.rh / 2};
    const tipB = {x: pos.resultB.x - C.gapR / 2 + 2, y: pos.resultB.y + C.rh / 2};
    return {
      nodes,
      semantic: {
        beat, apart: r(kA, 3), level: r(kL, 3), tracer: R2(tp), tracerAt: at, tracing, visited: visit, order: R.order,
        focus: R.focus, zoom: r(zoom, 3), links: linkInfo, arrowheads: linkInfo.filter(q => q.arrow && q.p >= 0.985).length,
        tipGap: r(Math.hypot(tipA.x - tipB.x, tipA.y - tipB.y), 2),
        results: [P.outcomes.a, P.outcomes.b], parts: Object.fromEntries(IDS.filter(id => R.shown.has(id)).map(id => [id, R2(pos[id])])),
        stateK: r(stateK, 3), problems: C.problems, textPx: r(C.F * L.pxu, 1),
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
    slug: 'review-06-mechanism',
    title: 'Illustrative confirmation — exploded view: the two cards, their result fields and the alignment guide, with only the supplied relationships',
    titleEs: 'Confirmación ilustrativa — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Confirmación ilustrativa',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded view of the aligned pair of decision cards: card A (original decision) and card B (confirmatory decision as supplied) move apart, their result fields slide out to a row of their own and the filter strip drops below them as the alignment guide. Only the supplied relationships are drawn, anchored to the parts\' edges and styled by kind (a plain relation has no arrowhead). A marker follows the supplied traversal order and the focus part is enlarged as it passes; finally B\'s result field is brought level with A\'s — position only, the printed results never change. Illustrative; no doctrine on what a confirmation means; jurisdiction unspecified.',
    tags: ['review', 'confirmation', 'mechanism', 'exploded view', 'decision cards', 'result fields', 'alignment guide', 'relationships as supplied', 'traversal'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/paper.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
