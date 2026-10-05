/**
 * LAW-0190 — Atención en registro · mechanism
 *
 * A plan view of the registry counter (seen from above), not the story's
 * front view: the public side is on one side of the glass line, the office
 * side on the other, with a pass-through gap. The components of the intake
 * are laid out where they are on the counter: the person filing and the
 * request bubble (public side), the bundle of tabbed sheets (public half of
 * the counter), the checklist card (office half), the entry-reference slip
 * (in the pass-through) and the clerk (office side). 16:9 runs the counter
 * across the frame; 9:16 turns it (public side at the bottom).
 *  0.00–0.18  separate: the components slide out of a compact cluster on the
 *             counter to their places; the glass line and pass-through appear.
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one,
 *             styled by kind (plain relation = no arrow; sequence / supplied
 *             communication = arrow; causal only when supplied); each label
 *             sits beside its own connector.
 *  0.43–0.75  trace: a marker follows the supplied traversal order along the
 *             connectors; the focus element (checklist by default) enlarges
 *             while the marker is on it and its rows take their supplied
 *             glyphs (dot = received, dashed ring = pending); the slip is
 *             printed when the marker reaches it.
 *  0.75–1.00  gather: states stay visible; a legend of the relation kinds, the
 *             "as supplied · no conclusion drawn" key. Nothing is concluded.
 * @module animations/roles/LAW-0190
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {edgeAnchor, circleAnchor, polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {mechanismFields} from '../../schemas/fields.js';
import {connector, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {shade} from '../../primitives/paper.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  regFields, REG_DEFAULTS, KIT_STRINGS, itemColor, measureCard, checklistCard, measureSlip, slipProp, bundleProp,
  keyChip, looksOf, fitWords, wchip, overlaps, badWrap, freeSpot, gridCands, regProps, REG_PROPS,
} from './kits/atencion-en-registro.js';
import {textBlock} from '../../primitives/annotate.js';

const ID = 'LAW-0190';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {sep: [0.02, 0.16], glass: [0.06, 0.16], rel: [0.18, 0.43], trace: [0.45, 0.73], legend: [0.76, 0.83], key: [0.78, 0.85]};
const IDS = ['filer', 'request', 'bundle', 'checklist', 'slip', 'clerk'];

const STRINGS = {
  en: {...KIT_STRINGS.en, kinds: 'Relation kinds (as supplied)', slipPending: 'Slip not yet printed'},
  es: {...KIT_STRINGS.es, kinds: 'Tipos de relación (según lo aportado)', slipPending: 'Justificante aún sin imprimir'},
};

const mf = mechanismFields(IDS);
const sceneSchema = {
  actors: regFields.actors,
  roles: regFields.roles,
  props: regProps,
  ...mf,
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied); an optional label is drawn beside the line', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
    label: str('Label drawn beside this relationship (as supplied; defaults to the caption of its kind)', 60),
  }, ['from', 'to', 'kind']), 1, 8),
};

const defaultParams = {
  actors: REG_DEFAULTS.actors,
  roles: REG_DEFAULTS.roles,
  props: JSON.parse(JSON.stringify(REG_PROPS)),
  elements: [
    {id: 'filer', label: 'Person filing'},
    {id: 'request', label: 'Request (speech)'},
    {id: 'bundle', label: 'Bundle of sheets'},
    {id: 'checklist', label: 'Checklist (as supplied)'},
    {id: 'slip', label: 'Entry-reference slip'},
    {id: 'clerk', label: 'Registry clerk'},
  ],
  relationships: [
    {from: 'filer', to: 'bundle', kind: 'sequence', label: 'hands over'},
    {from: 'bundle', to: 'checklist', kind: 'relation', label: 'checked against'},
    {from: 'clerk', to: 'checklist', kind: 'relation', label: 'keeps'},
    {from: 'checklist', to: 'slip', kind: 'sequence', label: 'then prints'},
    {from: 'slip', to: 'filer', kind: 'communication', label: 'handed back'},
  ],
  focusElement: 'checklist',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['filer', 'bundle', 'checklist', 'slip', 'filer'],
};

/** Plan positions (a = public → office, b = along the counter), per shape. */
const PLAN = {
  filer: {a: 0.1, b: 0.6}, request: {a: 0.12, b: 0.18}, bundle: {a: 0.36, b: 0.3},
  slip: {a: 0.5, b: 0.78}, checklist: {a: 0.67, b: 0.36}, clerk: {a: 0.9, b: 0.62},
};
const COUNTER = {a0: 0.26, a1: 0.79, glass: 0.5, gap: [0.64, 0.9]};
/** Square frames: the same plan, the people pushed to the sides and the counter components spread. */
const PLAN_SQ = [
  {filer: {a: 0.08, b: 0.66}, request: {a: 0.2, b: 0.12}, bundle: {a: 0.41, b: 0.45}, slip: {a: 0.55, b: 0.85}, checklist: {a: 0.74, b: 0.3}, clerk: {a: 0.93, b: 0.72}},
  {filer: {a: 0.08, b: 0.7}, request: {a: 0.22, b: 0.13}, bundle: {a: 0.4, b: 0.5}, slip: {a: 0.57, b: 0.86}, checklist: {a: 0.73, b: 0.32}, clerk: {a: 0.93, b: 0.66}},
  {filer: {a: 0.08, b: 0.62}, request: {a: 0.12, b: 0.15}, bundle: {a: 0.36, b: 0.47}, slip: {a: 0.53, b: 0.84}, checklist: {a: 0.72, b: 0.26}, clerk: {a: 0.92, b: 0.7}},
  {filer: {a: 0.08, b: 0.66}, request: {a: 0.12, b: 0.16}, bundle: {a: 0.37, b: 0.36}, slip: {a: 0.55, b: 0.84}, checklist: {a: 0.73, b: 0.3}, clerk: {a: 0.93, b: 0.72}},
  {filer: {a: 0.08, b: 0.62}, request: {a: 0.12, b: 0.16}, bundle: {a: 0.39, b: 0.3}, slip: {a: 0.52, b: 0.8}, checklist: {a: 0.7, b: 0.33}, clerk: {a: 0.92, b: 0.68}},
  // long captions: the bundle lower, the checklist higher (more room for the label between them)
  {filer: {a: 0.08, b: 0.5}, request: {a: 0.16, b: 0.12}, bundle: {a: 0.36, b: 0.62}, slip: {a: 0.58, b: 0.88}, checklist: {a: 0.74, b: 0.26}, clerk: {a: 0.93, b: 0.72}},
  {filer: {a: 0.08, b: 0.56}, request: {a: 0.14, b: 0.14}, bundle: {a: 0.34, b: 0.58}, slip: {a: 0.6, b: 0.86}, checklist: {a: 0.75, b: 0.24}, clerk: {a: 0.93, b: 0.66}},
];
const CFG = {
  landscape: {size: 21, R: 70, card: 330, bubble: 320, slip: 220},
  square: {size: 20, R: 50, card: 250, bubble: 220, slip: 186},
  portrait: {size: 22, R: 74, card: 380, bubble: 300, slip: 220},
};

function tryLayout(ctx, S, scaleArt, planIdx = 0) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const portrait = shape === 'portrait';
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const problems = [];
  const PL = shape === 'square' ? PLAN_SQ[planIdx] : PLAN;
  const at = (a, b) => (portrait ? {x: 16 + b * (D.w - 32), y: 16 + (1 - a) * (D.h - 32)} : {x: 16 + a * (D.w - 32), y: 16 + b * (D.h - 32)});
  const label = id => (p.elements.find(e => e.id === id) || {label: id}).label;
  const looks = looksOf(ctx, p);
  const items = p.props.items;
  const colors = items.map((_, i) => itemColor(ctx, i));

  // ---- components (design units)
  // the people keep their full size whatever the text length (only the props scale with scaleArt)
  const R = C.R * 1.15;
  const E = {};
  const nodes = {};
  // people: round busts with "name · component label" chips
  for (const [id, i] of [['filer', 0], ['clerk', 1]]) {
    const c = at(PL[id].a, PL[id].b);
    const b = personBadge(ctx, {name: `el-${id}-art`, x: 0, y: 0, radius: R, look: looks[i]});
    E[id] = {c, circle: {x: c.x, y: c.y, r: R}, box: {x: c.x - R, y: c.y - R, w: R * 2, h: R * 2}, art: b.node, text: `${p.actors[i].name} · ${label(id)}`};
  }
  // request bubble with the supplied speech
  {
    const c = at(PL.request.a, PL.request.b);
    let f = null, fl = null;
    for (const grow of [1, 1.25, 1.5]) {
      const bw = Math.min(C.bubble * grow, D.w * 0.36) * Math.min(1, scaleArt + 0.1);
      f = fitWords(p.props.speech.filer, {maxWidth: bw - S * 1.4, size: S, minSize: S, maxLines: 5, weight: 600});
      fl = fitWords(label('request'), {maxWidth: bw - S * 1.4, size: S, minSize: S, maxLines: 2, weight: 800});
      if (!f.truncated && !fl.truncated) break;
    }
    if (f.truncated || badWrap(f) || fl.truncated || badWrap(fl)) problems.push('request');
    const w = Math.max(f.width, fl.width) + S * 1.4, hh = fl.height + S * 0.35 + f.height + S * 1.2;
    const x = c.x - w / 2, y = c.y - hh / 2;
    const toward = E.filer.c;
    // the tail points at the filer from a corner of the bubble (the relation line runs from its middle)
    // the tail runs from the bubble's edge to the person's badge, ending just outside the rim beside the face
    const tip = circleAnchor({x: toward.x, y: toward.y}, R + 8, {x: c.x, y: c.y});
    const base = edgeAnchor({x, y, w, h: hh}, tip, -12);
    const ang = Math.atan2(tip.y - base.y, tip.x - base.x);
    const nx = -Math.sin(ang) * 14, ny = Math.cos(ang) * 14;
    const d = roundRectPath(x, y, w, hh, Math.min(22, hh / 3));
    const tail = `M${r(base.x + nx)} ${r(base.y + ny)}L${r(tip.x)} ${r(tip.y)}L${r(base.x - nx)} ${r(base.y - ny)}Z`;
    const art = g(null,
      h('path', {name: 'req-tail', d: tail, fill: th.card, stroke: '#3b4450', 'stroke-width': 3, 'stroke-linejoin': 'round'}),
      h('path', {d, fill: th.card, stroke: '#3b4450', 'stroke-width': 3}),
      h('path', {d: `M${r(base.x + nx * 0.8)} ${r(base.y + ny * 0.8)}L${r(base.x - nx * 0.8)} ${r(base.y - ny * 0.8)}`, stroke: th.card, 'stroke-width': 5}),
      showKey ? textBlock(fl, {x: x + S * 0.7, y: y + S * 0.6, fill: th.accent2}) : null,
      showAll ? textBlock(f, {x: x + S * 0.7, y: y + S * 0.6 + fl.height + S * 0.35, fill: th.ink}) : f.lines.map((ln, j) => h('rect', {x: r(x + S * 0.7), y: r(y + S * 0.6 + fl.height + S * 0.35 + j * f.lineHeight + S * 0.2), width: r(ctx.measure(ln, S, 600)), height: r(S * 0.6), rx: 4, fill: th.inkSoft, 'data-bar': 1})),
    );
    // the tail's area (sampled): nothing else is placed on it
    const tailBoxes = [];
    for (let q = 0; q <= 8; q++) {
      const px = base.x + (tip.x - base.x) * (q / 8), py = base.y + (tip.y - base.y) * (q / 8);
      const hw = 14 * (1 - q / 8) + 4;
      tailBoxes.push({x: px - hw, y: py - hw, w: hw * 2, h: hw * 2});
    }
    E.request = {c, box: {x, y, w, h: hh}, art, text: null, tip, tailBoxes};
  }
  // bundle: a squared-then-stepped stack of the received sheets (plan view)
  {
    const c = at(PL.bundle.a, PL.bundle.b);
    const recv = items.map((it, i) => (it.status === 'received' ? i : -1)).filter(i => i >= 0);
    const bw = 110 * scaleArt, bh = 146 * scaleArt;
    const bp = bundleProp(ctx, {name: 'el-bundle-bd', colors: recv.map(i => colors[i]), w: bw, h: bh});
    const n = recv.length;
    E.bundle = {c, box: {x: c.x - bw / 2 - 16 * (n - 1) - 4, y: c.y - bh / 2 - 22 - 12 * (n - 1), w: bw + 16 * (n - 1) + 8, h: bh + 26 + 12 * (n - 1)}, art: bp.node, text: label('bundle'), n, stepped: true};
  }
  // checklist card (supplied items; glyphs appear as the marker passes)
  {
    const c = at(PL.checklist.a, PL.checklist.b);
    // widen the card (not the text) until the supplied items fit whole
    let M = null;
    for (const extra of [0, 40, 80, 120]) {
      M = measureCard(ctx, {items, title: showKey ? label('checklist') : null, su: S, w: C.card * Math.min(1, scaleArt + 0.15) + extra});
      if (!M.truncated) break;
    }
    if (M.truncated) problems.push('card');
    const card = checklistCard(ctx, 'el-card', M, {showText: showAll, colors});
    E.checklist = {c, box: {x: c.x - M.w / 2, y: c.y - M.h / 2 - 10, w: M.w, h: M.h + 10}, art: card.node, card, M, text: null};
  }
  // slip (printed when the marker reaches it) in the pass-through
  {
    const c = at(PL.slip.a, PL.slip.b);
    const SM = measureSlip(ctx, {su: S, header: label('slip'), ref: p.props.reference, w: C.slip});
    if (SM.truncated) problems.push('slip');
    const sp = slipProp(ctx, 'el-slip-p', SM, {showText: showAll});
    // the empty slot says what it is for until the slip is printed
    const slotF = showKey ? fitWords(ctx.t.slipPending, {maxWidth: SM.w - S * 1.2, size: S, minSize: S, maxLines: 3, weight: 600}) : null;
    if (slotF && (slotF.truncated || badWrap(slotF) || slotF.height > SM.h - 12)) problems.push('slot-label');
    E.slip = {c, box: {x: c.x - SM.w / 2, y: c.y - SM.h / 2, w: SM.w, h: SM.h}, art: sp, SM, text: null, slotF};
  }
  if (problems.length) return {ok: false, problems};

  const bounds = {x: 6, y: 6, w: D.w - 12, h: D.h - 12};
  const inB = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  // components must not overlap each other
  for (let i = 0; i < IDS.length; i++) for (let j = i + 1; j < IDS.length; j++) if (overlaps(E[IDS[i]].box, E[IDS[j]].box, 10)) return {ok: false, problems: ['overlap']};
  if (IDS.some(id => !inB(E[id].box))) return {ok: false, problems: ['bounds']};

  // ---- counter plan and glass line
  const cA = at(COUNTER.a0, 0), cB = at(COUNTER.a1, 1);
  const counter = {x: Math.min(cA.x, cB.x), y: Math.min(cA.y, cB.y), w: Math.abs(cB.x - cA.x), h: Math.abs(cB.y - cA.y)};
  const g0 = at(COUNTER.glass, 0), g1 = at(COUNTER.glass, 1);
  const gp0 = at(COUNTER.glass, COUNTER.gap[0]), gp1 = at(COUNTER.glass, COUNTER.gap[1]);

  // ---- connectors: anchored on the real edges (circle for people); labels beside their own line
  const anchor = (e, toward, pad) => (e.circle ? circleAnchor(e.circle, e.circle.r + pad, toward) : edgeAnchor(e.box, toward, pad));
  const rels = p.relationships.filter(q => E[q.from] && E[q.to] && q.from !== q.to);
  const conns = rels.map((rel, i) => {
    const A = E[rel.from], B = E[rel.to];
    const from = anchor(A, B.c, 6), to = anchor(B, A.c, rel.kind === 'relation' ? 6 : 12);
    const touchesReq = rel.from === 'request' || rel.to === 'request';
    const c = connector(ctx, {name: `rg-c${i}`, from, to, kind: rel.kind, bend: touchesReq ? 0 : 0.08 * (i % 2 ? -1 : 1), color: kindColor(ctx, rel.kind)});
    const pts = Array.from({length: 41}, (_, q) => c.at(q / 40));
    return {rel, c, pts, i, len: c.total};
  });
  // a connector must not run through a third component or a label chip
  for (const x of conns) {
    const mid = x.pts.slice(3, -3);
    for (const id of IDS) {
      if (id === x.rel.from || id === x.rel.to) continue;
      if (mid.some(q => q.x > E[id].box.x && q.x < E[id].box.x + E[id].box.w && q.y > E[id].box.y && q.y < E[id].box.y + E[id].box.h)) problems.push(`through-${id}`);
    }
    if (x.len < 60) problems.push('short');
  }
  // crossings between connectors
  const cross = (p1, p2, p3, p4) => { const o = (a, b, c) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)); return o(p1, p2, p3) * o(p1, p2, p4) < 0 && o(p3, p4, p1) * o(p3, p4, p2) < 0; };
  let crossings = 0;
  for (let i = 0; i < conns.length; i++) for (let j = i + 1; j < conns.length; j++) {
    const A = conns[i].pts, B = conns[j].pts;
    let hit = false;
    for (let a = 0; a < A.length - 1 && !hit; a++) for (let b = 0; b < B.length - 1 && !hit; b++) if (cross(A[a], A[a + 1], B[b], B[b + 1])) hit = true;
    if (hit) crossings++;
  }
  if (problems.length) return {ok: false, problems: [...new Set(problems)]};

  // relation labels: nearest free spot to the connector's middle, clear of components, chips, other lines
  
  const occupied = [...IDS.map(id => E[id].box), ...E.request.tailBoxes];
  const allPts = conns.map(x => x.pts);
  const relLabels = [];
  if (showAll) {
    for (const x of conns) {
      const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
      let best = null;
      const why = {b: 0, o: 0, l: 0, n: 0, d: 0, c: 0};
      for (const maxW of [300, 230, 180, 360, 140]) {
        const probe = wchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: maxW, size: S, minSize: S, maxLines: 3, weight: 600});
        if (probe.fit.truncated || badWrap(probe.fit)) continue;
        const w = probe.box.w, hh = probe.box.h;
        const mid = x.c.mid;
        const dx = x.c.to.x - x.c.from.x, dy = x.c.to.y - x.c.from.y, L0 = Math.hypot(dx, dy) || 1;
        const nx = -dy / L0, ny = dx / L0;
        let found = null;
        for (let d = 0; d <= 160 && !found; d += 6) {
          for (const sg of d ? [1, -1] : [1]) {
            for (const along of [0, 0.12, -0.12, 0.24, -0.24, 0.34, -0.34]) {
              const cx = mid.x + nx * d * sg + dx * along, cy = mid.y + ny * d * sg + dy * along;
              const b = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
              if (!inB(b)) { why.b++; continue; }
              if (occupied.some(o => overlaps(b, o, 6))) { why.o++; continue; }
              if (relLabels.some(o => overlaps(b, o.box, 6))) { why.l++; continue; }
              // not on any connector (its own included: the label sits beside the line)
              if (allPts.some(pts => pts.some(q => q.x > b.x - 5 && q.x < b.x + b.w + 5 && q.y > b.y - 5 && q.y < b.y + b.h + 5))) { why.n++; continue; }
              // nearer to its own connector than to any other (by at least 10)
              const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
              const own = dist(x.pts);
              if (own > 38) { why.d++; continue; }
              if (conns.some(o => o !== x && dist(o.pts) < own + 10)) { why.c++; continue; }
              found = {cx, cy, own};
              break;
            }
            if (found) break;
          }
        }
        if (!found) continue;
        best = {...wchip(ctx, text, {x: found.cx, y: found.cy - hh / 2, anchor: 'middle', maxWidth: maxW, size: S, minSize: S, maxLines: 3, weight: 600, stroke: kindColor(ctx, x.rel.kind), name: `rl${x.i}`}), own: found.own};
        break;
      }
      if (!best) return {ok: false, problems: [`rel-label-${x.i}${JSON.stringify(why)}`]};
      relLabels.push(best);
    }
  }

  // ---- element label chips (under each component, above when there is no room)
  const chipsL = {};
  if (showKey) {
    for (const id of IDS.filter(q => E[q].text)) {
      const e = E[id];
      const maxW = Math.max(220, Math.min(portrait ? 440 : 400, e.box.w + 200));
      let best = null;
      const sides = ['below', 'above', 'right', 'left'].flatMap(sd => (sd === 'below' || sd === 'above'
        ? [0, 26, 52].flatMap(ex => [[sd, 0, ex], [sd, -0.35, ex], [sd, 0.35, ex]]) : [[sd, 0, 0], [sd, -0.6, 0], [sd, 0.6, 0]]));
      for (const [side, off, ex, mw] of [maxW, 250, 200].flatMap(mw => sides.map(q => [...q, mw]))) {
        const probe = wchip(ctx, e.text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: S, minSize: S, maxLines: 3, weight: 700});
        if (probe.fit.truncated || badWrap(probe.fit)) continue;
        const y = side === 'below' ? e.box.y + e.box.h + 10 + ex : side === 'above' ? e.box.y - 10 - ex - probe.box.h : e.c.y - probe.box.h / 2 + off * e.box.h * 0.5;
        const cx0 = side === 'right' ? e.box.x + e.box.w + 10 + probe.box.w / 2 : side === 'left' ? e.box.x - 10 - probe.box.w / 2 : e.c.x + off * probe.box.w;
        const cx = clamp(cx0, bounds.x + probe.box.w / 2, bounds.x + bounds.w - probe.box.w / 2);
        const ch = wchip(ctx, e.text, {x: cx, y, anchor: 'middle', maxWidth: mw, size: S, minSize: S, maxLines: 3, weight: 700, name: `lab-${id}`});
        if (!inB(ch.box)) continue;
        if (IDS.some(o => overlaps(ch.box, E[o].box, 6))) continue;
        if (E.request.tailBoxes.some(o => overlaps(ch.box, o, 4))) continue;
        if (Object.values(chipsL).some(q => overlaps(ch.box, q.box, 6))) continue;
        if (relLabels.some(q => overlaps(ch.box, q.box, 6))) continue;
        // never on a connector
        if (conns.some(x => x.pts.some(q => q.x > ch.box.x - 6 && q.x < ch.box.x + ch.box.w + 6 && q.y > ch.box.y - 6 && q.y < ch.box.y + ch.box.h + 6))) continue;
        best = ch;
        break;
      }
      if (!best) return {ok: false, problems: [`label-${id}`]};
      chipsL[id] = best;
    }
  }
  // ---- legend of relation kinds present + key (free space, nearest the bottom)
  const kinds = [...new Set(rels.map(q => q.kind))];
  let legend = null, key = null;
  const occ2 = [...occupied, ...Object.values(chipsL).map(c => c.box), ...relLabels.map(q => q.box)];
  const lineBoxes = conns.flatMap(x => x.pts.map(q => ({x: q.x - 4, y: q.y - 4, w: 8, h: 8})));
  const cands = gridCands(bounds, 10);
  if (showKey) {
    // the legend is stacked (one kind per line) or, when that finds no room, laid out in a row
    let spot = null, lw = 0, lh = 0, title = null, rows = null, flat = false;
    const sw = 58, gap = S * 0.4;
    for (const [tw, fl] of [[400, false], [300, false], [620, true], [420, true]]) {
      const t0 = fitWords(ctx.t.kinds, {maxWidth: tw, size: S, minSize: S, maxLines: 2, weight: 800});
      const r0 = kinds.map(kd => ({kd, f: fitWords(p.relationLabels[kd] || kd, {maxWidth: 300, size: S, minSize: S, maxLines: 2, weight: 600})}));
      if ([t0, ...r0.map(q => q.f)].some(f => f.truncated || badWrap(f))) continue;
      const rowW = fl ? r0.reduce((a0, q) => a0 + sw + 12 + q.f.width, 0) + S * (r0.length - 1) : Math.max(...r0.map(q => sw + 12 + q.f.width));
      const w0 = Math.max(t0.width, rowW) + S * 1.2;
      const h0 = S * 0.6 + t0.height + gap + (fl ? Math.max(...r0.map(q => q.f.height)) + gap : r0.reduce((a0, q) => a0 + q.f.height + gap, 0)) + S * 0.4;
      if (w0 > bounds.w) continue;
      const sp0 = freeSpot(cands, w0, h0, [...occ2, ...lineBoxes], bounds, 8, b => (portrait ? Math.abs(b.y + b.h / 2 - D.h * 0.5) * 0.2 + Math.abs(b.x) * 0.1 : (D.h - b.y - b.h) * 1 + Math.abs(b.x + b.w / 2 - D.w / 2) * 0.3));
      if (sp0) { spot = sp0; lw = w0; lh = h0; title = t0; rows = r0; flat = fl; break; }
    }
    if (!spot) return {ok: false, problems: ['legend-room']};
    const parts = [h('path', {d: roundRectPath(spot.x, spot.y, lw, lh, 12), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2})];
    let yy = spot.y + S * 0.6;
    parts.push(textBlock(title, {x: spot.x + S * 0.6, y: yy, fill: th.ink}));
    yy += title.height + gap;
    let xx = spot.x + S * 0.6;
    for (const q of rows) {
      const st = LINK_STYLES[q.kd];
      const ly = yy + q.f.size * 0.55;
      const x0 = xx;
      parts.push(h('line', {x1: x0, x2: x0 + sw - (st.arrow ? 10 : 0), y1: r(ly), y2: r(ly), stroke: kindColor(ctx, q.kd), 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}));
      if (st.arrow) parts.push(h('path', {d: `M${x0 + sw} ${r(ly)}l-13 -7l3 7l-3 7Z`, fill: kindColor(ctx, q.kd)}));
      if (st.endDots) parts.push(h('circle', {cx: x0, cy: r(ly), r: 4.8, fill: kindColor(ctx, q.kd)}), h('circle', {cx: x0 + sw, cy: r(ly), r: 4.8, fill: kindColor(ctx, q.kd)}));
      parts.push(textBlock(q.f, {x: x0 + sw + 12, y: yy, fill: th.ink}));
      if (flat) xx += sw + 12 + q.f.width + S;
      else yy += q.f.height + gap;
    }
    legend = {node: g({name: 'legend', opacity: 0}, parts), box: {x: spot.x, y: spot.y, w: lw, h: lh}};
    const kp = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: Math.min(520, D.w - 20), size: S, minSize: S, maxLines: 2});
    const ks = freeSpot(cands, kp.box.w, kp.box.h, [...occ2, legend.box, ...lineBoxes], bounds, 8, b => Math.hypot(b.x - legend.box.x, (b.y - legend.box.y - legend.box.h) * 1.5));
    if (!ks) return {ok: false, problems: ['key-room']};
    key = keyChip(ctx, ctx.t.key, {x: ks.x, y: ks.y, maxWidth: Math.min(520, D.w - 20), size: S, minSize: S, maxLines: 2, name: 'key'});
  }

  // ---- tracer route through the traversal order (along connectors when linked)
  // the marker visits a person at the rim of their badge (it never rests on a face)
  const center = (id, toward) => (E[id].circle && toward ? circleAnchor(E[id].circle, E[id].circle.r + 14, toward) : E[id].c);
  const route = [];
  const visits = [];
  const order = p.traversalOrder.filter(id => E[id]);
  order.forEach((id, i) => {
    if (i === 0) { route.push(center(id, E[order[1] || id].c)); visits.push({id, idx: 0}); return; }
    const prev = order[i - 1];
    const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    if (link) {
      const fw = link.rel.from === prev;
      route.push(fw ? link.c.from : link.c.to);
      for (let k = 1; k <= 30; k++) route.push(link.c.at(fw ? k / 30 : 1 - k / 30));
    } else {
      route.push(anchor(E[prev], center(id), 6));
      route.push(anchor(E[id], center(prev), 6));
    }
    const last = route[route.length - 1];
    if (!E[id].circle) route.push(center(id));
    else if (Math.hypot(last.x - E[id].c.x, last.y - E[id].c.y) < E[id].circle.r + 4) route.push(center(id, E[prev].c));
    visits.push({id, idx: route.length - 1});
  });
  const poly = polyline(route);
  const cum = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / total}));

  // separated positions: each component starts pulled 45 % towards the counter's centre
  const cc = {x: counter.x + counter.w / 2, y: counter.y + counter.h / 2};
  const labelMinDist = relLabels.length ? Math.max(...relLabels.map(q => q.own)) : 0;
  return {
    ok: true, problems, S, scaleArt, E, chipsL, counter, glass: {g0, g1, gp0, gp1}, conns, relLabels, legend, key, poly, visitT, cc, order,
    crossings, labelMinDist, kinds, portrait,
  };
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const tries = [];
    // prefer large art at full text size (≥ 19.5 px); only then step the text down to the 16 px floor
    const np = ctx.view.shape === 'square' ? PLAN_SQ.length : 1;
    const attempt = (S, sa) => {
      for (let pi = 0; pi < np; pi++) {
        const L = tryLayout(ctx, S, sa, pi);
        if (L.ok) return L;
        tries.push(`${S}/${sa}/${pi}:${L.problems.join('+')}`);
      }
      return null;
    };
    for (const sa of [1.15, 1, 0.9, 0.8, 0.7, 0.6]) {
      for (let S = C.size; S >= 19.5 - 1e-6; S -= 0.5) { const L = attempt(S, sa); if (L) return {...L, tries}; }
    }
    for (let S = 19; S >= 16 - 1e-6; S -= 0.5) {
      for (const sa of [1.15, 1, 0.9, 0.8, 0.7, 0.6]) { const L = attempt(S, sa); if (L) return {...L, tries}; }
    }
    const tally = {};
    for (const t of tries) { const k = t.split(':')[1]; tally[k] = (tally[k] || 0) + 1; }
    throw new Error(`${ID}: no layout fits (${JSON.stringify(tally)} | ${tries.slice(-3).join(' | ')})`);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const E = L.E;
    const wood = th.dark ? '#8e6a4b' : th.woodTop;
    const cn = L.counter;
    const grain = [];
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7;
      if (!L.portrait) grain.push(h('path', {d: `M${r(cn.x + cn.w * t)} ${r(cn.y + 10)}C${r(cn.x + cn.w * t + 8)} ${r(cn.y + cn.h * 0.3)} ${r(cn.x + cn.w * t - 8)} ${r(cn.y + cn.h * 0.7)} ${r(cn.x + cn.w * t + 4)} ${r(cn.y + cn.h - 10)}`, fill: 'none', stroke: shade(wood, -0.1), 'stroke-width': 2, opacity: 0.5}));
      else grain.push(h('path', {d: `M${r(cn.x + 10)} ${r(cn.y + cn.h * t)}C${r(cn.x + cn.w * 0.3)} ${r(cn.y + cn.h * t + 8)} ${r(cn.x + cn.w * 0.7)} ${r(cn.y + cn.h * t - 8)} ${r(cn.x + cn.w - 10)} ${r(cn.y + cn.h * t + 4)}`, fill: 'none', stroke: shade(wood, -0.1), 'stroke-width': 2, opacity: 0.5}));
    }
    const gl = L.glass;
    const elNode = id => {
      const e = E[id];
      const inner = id === 'filer' || id === 'clerk' ? g({transform: T(e.c.x, e.c.y)}, e.art)
        : id === 'bundle' ? g({transform: T(e.c.x, e.c.y)}, e.art)
          : id === 'checklist' ? g({transform: T(e.box.x, e.box.y + 10)}, e.art)
            : id === 'slip' ? g(null,
              g({name: 'slip-slot'},
                h('path', {d: roundRectPath(e.box.x, e.box.y, e.box.w, e.box.h, 6), fill: '#ffffff', 'fill-opacity': 0.25, stroke: th.inkSoft, 'stroke-width': 2, 'stroke-opacity': 0.6, 'stroke-dasharray': '8 6'}),
                e.slotF ? textBlock(e.slotF, {x: e.c.x - e.slotF.width / 2, y: e.c.y - e.slotF.height / 2, fill: th.ink, name: 'slip-slot-t'}) : null),
              g({name: 'slip-print', opacity: 0}, g({transform: T(e.box.x, e.box.y)}, e.art)))
              : e.art;
      return g({name: `el-${id}`}, inner);
    };
    return g(null,
      h('path', {d: roundRectPath(cn.x, cn.y, cn.w, cn.h, 24), fill: wood, stroke: th.ink, 'stroke-width': th.stroke}),
      grain,
      // glass line with its pass-through gap (plan view)
      g({name: 'glass', opacity: 0},
        h('line', {x1: r(gl.g0.x), y1: r(gl.g0.y), x2: r(gl.gp0.x), y2: r(gl.gp0.y), stroke: '#7aa6c2', 'stroke-width': 9, 'stroke-linecap': 'round'}),
        h('line', {x1: r(gl.gp1.x), y1: r(gl.gp1.y), x2: r(gl.g1.x), y2: r(gl.g1.y), stroke: '#7aa6c2', 'stroke-width': 9, 'stroke-linecap': 'round'}),
        h('line', {x1: r(gl.g0.x), y1: r(gl.g0.y), x2: r(gl.gp0.x), y2: r(gl.gp0.y), stroke: '#fff', 'stroke-width': 2.5, opacity: 0.7}),
        h('line', {x1: r(gl.gp1.x), y1: r(gl.gp1.y), x2: r(gl.g1.x), y2: r(gl.g1.y), stroke: '#fff', 'stroke-width': 2.5, opacity: 0.7})),
      L.conns.map(x => x.c.node),
      ['bundle', 'checklist', 'slip', 'request', 'filer', 'clerk'].map(elNode),
      Object.values(L.chipsL).map(c => c.node),
      L.relLabels.map((q, i) => g({name: `rl${L.conns[i].i}g`, opacity: 0}, q.node)),
      tracer(ctx, 'tracer'),
      L.legend && L.legend.node,
      L.key && g({name: 'keyg', opacity: 0}, L.key.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const E = L.E;
    const nodes = {};
    // separate: each component slides from a compact cluster to its place
    const sp = ease.inOutCubic(seg(u, ...W.sep));
    for (const id of IDS) {
      const e = E[id];
      const dx = (L.cc.x - e.c.x) * 0.2 * (1 - sp), dy = (L.cc.y - e.c.y) * 0.2 * (1 - sp);
      nodes[`el-${id}`] = {transform: `${T(dx, dy)}`};
    }
    nodes.glass = {opacity: r(seg(u, ...W.glass), 3)};
    // the component labels settle with their components
    for (const id of Object.keys(L.chipsL)) nodes[`lab-${id}`] = {opacity: r(seg(sp, 0.75, 1), 3), transform: nodes[`el-${id}`].transform};
    // relate: connectors drawn one by one
    const n = L.conns.length;
    const drawn = L.conns.map((x, i) => ease.inOutSine(seg(u, W.rel[0] + ((W.rel[1] - W.rel[0]) * i) / n, W.rel[0] + ((W.rel[1] - W.rel[0]) * (i + 1)) / n)));
    L.conns.forEach((x, i) => {
      Object.assign(nodes, x.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
      if (L.relLabels[i]) nodes[`rl${x.i}g`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45), 3)};
    });
    // trace
    const tp = seg(u, ...W.trace);
    const tq = ease.inOutSine(tp);
    const pt = L.poly.at(tq);
    const traceOn = u >= W.trace[0] && u < W.trace[1] + 0.02;
    nodes.tracer = {transform: T(pt.x, pt.y), opacity: traceOn ? r(Math.min(1, seg(u, W.trace[0], W.trace[0] + 0.01) * (1 - seg(u, W.trace[1], W.trace[1] + 0.02))), 3) : 0};
    const visited = L.visitT.filter(v => tq >= v.t - 1e-9 && u >= W.trace[0]).map(v => v.id);
    // focus: enlarges while the marker is on it (±4 % of the route around the visit)
    const fv = L.visitT.filter(v => v.id === p.focusElement);
    let focus = 0;
    for (const v of fv) focus = Math.max(focus, seg(tq, v.t - 0.14, v.t - 0.04) * (1 - seg(tq, v.t + 0.1, v.t + 0.2)));
    if (u >= W.trace[1]) focus = 0;
    const fs = 1 + 0.16 * ease.inOutSine(focus);
    const fe = E[p.focusElement];
    if (fe) {
      const base = nodes[`el-${p.focusElement}`].transform;
      nodes[`el-${p.focusElement}`] = {transform: fs !== 1 ? `${base} ${scaleAbout(fe.c.x, fe.c.y, fs)}` : base};
    }
    // transformation: the rows take their supplied glyphs once the marker has reached the checklist
    const vc = L.visitT.find(v => v.id === 'checklist');
    const rowsP = vc ? seg(tq, vc.t - 0.02, vc.t + 0.06) * (u >= W.trace[0] ? 1 : 0) : 0;
    const items = p.props.items;
    const dots = items.map((it, i) => (it.status === 'received' ? clamp(rowsP * items.length - i) : 0));
    const rings = items.map((it, i) => (it.status === 'pending' ? clamp(rowsP * items.length - i) : 0));
    Object.assign(nodes, E.checklist.card.frame({dots, rings}));
    // the bundle lies stepped in plan view, every sheet's tab visible
    for (let j = 0; j < E.bundle.n; j++) {
      nodes[`el-bundle-bd-s${j}`] = {transform: j ? T(-16 * j, -12 * j) : ''};
      if (j < E.bundle.n - 1) nodes[`el-bundle-bd-sh${j}`] = {opacity: 1};
    }
    // the slip is printed when the marker reaches it (dashed slot before)
    const vs = L.visitT.find(v => v.id === 'slip');
    const printed = vs ? seg(tq, vs.t - 0.03, vs.t) * (u >= W.trace[0] ? 1 : 0) : 0;
    nodes['slip-print'] = {opacity: r(printed, 3)};
    nodes['slip-slot'] = {opacity: r(1 - printed, 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    if (L.key) nodes.keyg = {opacity: r(seg(u, ...W.key), 3)};
    const gaps = L.conns.map(x => {
      const A = E[x.rel.from], B = E[x.rel.to];
      const d = (q, e) => (e.circle ? Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r) : Math.max(0, Math.min(Math.abs(q.x - e.box.x), Math.abs(q.x - e.box.x - e.box.w), Math.abs(q.y - e.box.y), Math.abs(q.y - e.box.y - e.box.h))));
      return r(Math.max(d(x.c.from, A), d(x.c.to, B)), 1);
    });
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sp, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracer: {x: r(pt.x), y: r(pt.y)},
        tracerVisible: traceOn && tp > 0,
        // the marker never sits on a face (people are visited at the rim of their badge)
        tracerClearOfFaces: !(traceOn && tp > 0) || ['filer', 'clerk'].every(id => Math.hypot(pt.x - E[id].c.x, pt.y - E[id].c.y) >= E[id].circle.r * 0.95),
        peopleDiameter: r(E.filer.circle.r * 2, 1),
        slotLabelled: Boolean(E.slip.slotF),
        visitOrder: visited,
        focusScale: r(fs, 3),
        dots: dots.map(v => r(v, 3)), rings: rings.map(v => r(v, 3)),
        slipPrinted: r(printed, 3),
        connectorGaps: gaps,
        arrows: L.conns.map(x => ({kind: x.rel.kind, arrow: LINK_STYLES[x.rel.kind].arrow})),
        crossings: L.crossings,
        relLabelCount: L.relLabels.length,
        relLabelMaxDist: r(L.labelMinDist, 1),
        legendShown: L.legend ? r(seg(u, ...W.legend), 3) : 0,
        kinds: L.kinds,
        labelsFit: L.ok, textSize: L.S, artScale: L.scaleArt, layoutTries: L.tries.slice(0, 12),
        mainActionEnd: W.trace[1],
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
    slug: 'roles-08-mechanism',
    title: 'Registry window — how the intake connects its parts (counter plan)',
    titleEs: 'Atención en registro — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Atención en registro',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A plan view of the registry counter: the person filing and the request bubble on the public side, the bundle on the public half, the checklist on the office half, the entry-reference slip in the pass-through of the glass line, and the clerk on the office side. Only the supplied relationships are drawn, styled by kind with their labels beside them; a marker follows the supplied traversal order, the focus element enlarges, the checklist rows take their supplied glyphs and the slip is printed when reached.',
    tags: ['registry', 'mechanism', 'plan view', 'counter', 'checklist', 'bundle', 'entry reference', 'relations', 'tracer', 'speech bubble'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/atencion-en-registro.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
