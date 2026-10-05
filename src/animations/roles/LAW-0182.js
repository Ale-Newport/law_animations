/**
 * LAW-0182 — Interpretación lingüística · mechanism
 *
 * Storyboard (a spatial "path of the words", not a row of boxes): the three
 * people are portrait badges — the first speaker (A) and the listener (B)
 * on the outside, the interpreter in between and lower; the words travel
 * along a U: A → A's bubble → interpreter (→ her notepad) → her rendering
 * bubble → B. In 9:16 the same U is turned on its side.
 *  0.00–0.18  separate: the badges are in place; the components slide out of
 *             their owners — A's words (a bubble with its tail on A) out of
 *             A; the notepad and the rendering (a bubble whose tail is on the
 *             INTERPRETER) out of the interpreter.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             anchored to the element edges and styled by kind (communication
 *             = dashed arrow, sequence = arrow, relation = plain line with end
 *             dots, never an arrow; causal only when supplied). Each label sits
 *             beside its own connector. By default one relation ties A to the
 *             rendering: the words stay A's; the interpreter never becomes a
 *             party.
 *  0.43–0.75  trace: a marker follows `traversalOrder` along the connectors and
 *             tails; the focus element (default: the interpreter) enlarges
 *             while the marker passes.
 *  0.75–1.00  gather: everything stays visible — origin (A), the change of
 *             language (two bubbles, two tabs), the link, the listener; a
 *             legend of the kinds used and the "as supplied · no conclusion
 *             drawn" key. Nothing states accuracy, validity or an outcome.
 * @module animations/roles/LAW-0182
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, circleAnchor, polyline, roundRectPath} from '../../core/geometry.js';
import {str, obj, list, oneOf, party, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, textBlock, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  INTERP_DEFAULTS, KIT_STRINGS, languagesField, measureBubble, speakBubble, langColor, LANG_GLYPHS,
  fitWords, wchip, overlaps, keyChip, freeSpot, gridCands, boxDist,
} from './kits/interpretacion-linguistica.js';

const ID = 'LAW-0182';
const DURATION = 7000;
const IDS = ['a', 'utterance', 'interpreter', 'notes', 'rendering', 'b'];
const W = {sep: [0.03, 0.16], rel: [0.18, 0.43], trace: [0.45, 0.73], legend: [0.76, 0.8], key: [0.78, 0.83]};

const STRINGS = {
  en: {...KIT_STRINGS.en, legend: 'Kinds of link'},
  es: {...KIT_STRINGS.es, legend: 'Tipos de vínculo'},
};

const relationship = obj('An explicit relationship between two components', {
  from: oneOf('Source component', IDS),
  to: oneOf('Target component', IDS),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label beside the connector (empty = the caption of its kind)', 60),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  actors: list('Speaker A, speaker B and the interpreter, in this order (fictional people)', party, 3, 3),
  languages: languagesField,
  props: obj('Supplied speech (shown exactly as supplied)', {
    utterance: str('What speaker A says, as supplied', 110),
    rendering: str('The interpreter’s rendering, as supplied', 110),
  }),
  elements: list('Component labels; ids are fixed by the scene, labels are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 40),
  }, ['id', 'label']), 6, 6),
  relationships: list('Explicit relationships between components; the kind sets the line style (causal only when supplied)', relationship, 1, 7),
  focusElement: oneOf('Component enlarged while the marker passes', IDS),
  relationLabels: obj('Caption used for each relation kind (legend, and connectors without their own label)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the marker visits components', oneOf('Component id', IDS), 2, 9),
};

const defaultParams = {
  actors: INTERP_DEFAULTS.actors,
  languages: INTERP_DEFAULTS.languages,
  props: {
    utterance: 'Dejé las llaves en la recepción a las nueve.',
    rendering: 'I left the keys at the reception desk at nine.',
  },
  elements: [
    {id: 'a', label: 'Speaker A'},
    {id: 'utterance', label: 'Words spoken'},
    {id: 'interpreter', label: 'Interpreter'},
    {id: 'notes', label: 'Notes'},
    {id: 'rendering', label: 'Rendering'},
    {id: 'b', label: 'Speaker B'},
  ],
  relationships: [
    {from: 'utterance', to: 'interpreter', kind: 'communication', label: 'Heard by the interpreter'},
    {from: 'interpreter', to: 'notes', kind: 'relation', label: 'Notes kept'},
    {from: 'utterance', to: 'rendering', kind: 'sequence', label: 'Then rendered'},
    {from: 'rendering', to: 'b', kind: 'communication', label: 'Addressed to the listener'},
    {from: 'a', to: 'rendering', kind: 'relation', label: 'Still speaker A’s words'},
  ],
  focusElement: 'interpreter',
  relationLabels: {relation: 'Relation', communication: 'Communication', sequence: 'Sequence', causal: 'Cause (as supplied)'},
  traversalOrder: ['a', 'utterance', 'interpreter', 'notes', 'interpreter', 'rendering', 'b'],
};

/** Per-shape anchors (fractions of the design space) and sizes. */
const CFG = {
  landscape: {size: 28, Rb: 78, bw: 0.28, nw: 260, pos: {a: [0.08, 0.6], b: [0.92, 0.6], interpreter: [0.5, 0.68], notes: [0.69, 0.8], utterance: [0.3, 0.38], rendering: [0.7, 0.38]}, chips: 'below'},
  square: {size: 24, Rb: 60, bw: 0.34, nw: 200, pos: {a: [0.1, 0.62], b: [0.9, 0.62], interpreter: [0.5, 0.7], notes: [0.75, 0.84], utterance: [0.23, 0.4], rendering: [0.77, 0.4]}, chips: 'below'},
  portrait: {size: 28, Rb: 76, bw: 0.56, nw: 300, pos: {a: [0.2, 0.14], utterance: [0.6, 0.3], interpreter: [0.2, 0.46], notes: [0.3, 0.8], rendering: [0.7, 0.56], b: [0.8, 0.92]}, chips: 'below'},
};

/**
 * A routed connector (rounded polyline) with the same look and frame protocol as annotate.connector:
 * relation = plain line with end dots, communication = dashed + arrow, sequence = arrow.
 */
function routedConnector(ctx, o) {
  const style = LINK_STYLES[o.kind || 'relation'];
  // round the corners
  const P = o.pts;
  const pts = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    const rr = Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
    const u1 = {x: b.x + (a.x - b.x) * rr / Math.hypot(a.x - b.x, a.y - b.y), y: b.y + (a.y - b.y) * rr / Math.hypot(a.x - b.x, a.y - b.y)};
    const u2 = {x: b.x + (c.x - b.x) * rr / Math.hypot(c.x - b.x, c.y - b.y), y: b.y + (c.y - b.y) * rr / Math.hypot(c.x - b.x, c.y - b.y)};
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      pts.push({x: (1 - t) * (1 - t) * u1.x + 2 * (1 - t) * t * b.x + t * t * u2.x, y: (1 - t) * (1 - t) * u1.y + 2 * (1 - t) * t * b.y + t * t * u2.y});
    }
  }
  pts.push(P[P.length - 1]);
  const poly = polyline(pts);
  const total = poly.total;
  const d = poly.d(1);
  const color = o.color;
  const end = poly.at(1);
  const headLen = style.width * 4.2;
  const node = g({name: o.name},
    h('path', {name: `${o.name}-line`, 'data-conn': o.name, d, fill: 'none', stroke: color, 'stroke-width': style.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': style.dash ? style.dash : `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': style.dash ? 0 : r(total), opacity: 1}),
    style.arrow ? h('path', {name: `${o.name}-head`, d: `M0 0L${r(-headLen)} ${r(-headLen * 0.55)}L${r(-headLen * 0.72)} 0L${r(-headLen)} ${r(headLen * 0.55)}Z`, fill: color, transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${o.name}-dotA`, cx: r(P[0].x), cy: r(P[0].y), r: style.width * 1.6, fill: color, opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${o.name}-dotB`, cx: r(end.x), cy: r(end.y), r: style.width * 1.6, fill: color, opacity: 0}) : null,
  );
  const frame = (pr, opacity = 1) => {
    const out = {[o.name]: {opacity}};
    // (dashed kinds reveal by opacity of the whole; solid ones draw on)
    out[`${o.name}-line`] = style.dash ? {opacity: pr > 0 ? 1 : 0} : {'stroke-dashoffset': r(total * (1 - pr))};
    if (style.arrow) out[`${o.name}-head`] = {opacity: pr >= 0.985 ? 1 : 0};
    if (style.endDots) { out[`${o.name}-dotA`] = {opacity: pr > 0 ? 1 : 0}; out[`${o.name}-dotB`] = {opacity: pr >= 0.985 ? 1 : 0}; }
    return out;
  };
  return {node, frame, at: t => poly.at(t), total, from: P[0], to: P[P.length - 1]};
}

function tryLayout(ctx, S, f, ys = 1, yo = 0) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const minS = Math.max(17, S * 0.86);
  const problems = [];
  const lab = id => (p.elements.find(e => e.id === id) || {label: id}).label;
  // centres from the per-shape fractions, stretched (ys) and shifted (yo) vertically to fill the box
  const P = id => ({x: C.pos[id][0] * D.w, y: yo + C.pos[id][1] * D.h * ys});
  const Rb = C.Rb * f;
  const people = {a: 0, b: 1, interpreter: 2};
  const looks = [0, 1, 2].map(i => actorLook(ctx, p.actors[i], i));

  // --- people badges + name chips
  const badges = {}, chips = {};
  for (const id of ['a', 'interpreter', 'b']) {
    const c = P(id);
    badges[id] = personBadge(ctx, {name: `pb-${id}`, x: c.x, y: c.y, radius: Rb, look: looks[people[id]]});
    if (showKey) {
      const text = `${p.actors[people[id]].name} · ${lab(id)}`;
      if (C.chips === 'below' || id === 'interpreter') {
        // (in 9:16 the first speaker's bubble hangs below-right of A: A's chip goes above the badge)
        const above = shape === 'portrait' && id === 'a';
        const co = {y: above ? null : c.y + Rb * 1.16 + 8, maxWidth: shape === 'portrait' ? 340 : Math.min(300, D.w * 0.27), size: S, minSize: minS, maxLines: 4, name: `chip-${id}`};
        if (above) {
          const pr = wchip(ctx, text, {...co, y: 0, x: c.x, anchor: 'middle'});
          co.y = c.y - Rb * 1.16 - 8 - pr.box.h;
        }
        chips[id] = wchip(ctx, text, {...co, x: c.x, anchor: 'middle'});
        // kept inside the frame, still under its badge
        if (chips[id].box.x < 8) chips[id] = wchip(ctx, text, {...co, x: 8, anchor: 'start'});
        else if (chips[id].box.x + chips[id].box.w > D.w - 8) chips[id] = wchip(ctx, text, {...co, x: D.w - 8, anchor: 'end'});
      } else {
        const right = c.x < D.w / 2;
        chips[id] = wchip(ctx, text, {x: right ? c.x + Rb + 12 : c.x - Rb - 12, y: c.y - 24, anchor: right ? 'start' : 'end', maxWidth: 260, size: S, minSize: minS, maxLines: 3, name: `chip-${id}`});
      }
      if (chips[id].fit.truncated) problems.push('chip');
    }
  }
  const circleBox = c => ({x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2});
  // --- the two bubbles (tails on the owner's badge rim, towards the mouth)
  const bw = C.bw * D.w;
  const mkBubble = (id, owner, lang, li, text) => {
    const M = measureBubble(ctx, {w: bw, text, tab: `${lab(id)} · ${lang}`, S, minS, maxLines: 5, tabFrac: 0.8, tabLines: 4});
    if (M.truncated) problems.push(`${id}-truncated`);
    const c = P(id);
    const x = c.x - bw / 2, y = c.y - M.h / 2;
    const oc = badges[owner].circle;
    const mouth = {x: oc.x, y: oc.y + oc.r * 0.05};
    const cc = {x: c.x, y: c.y};
    const tip = circleAnchor({x: mouth.x, y: mouth.y}, oc.r + 6, cc);
    const up = tip.y < y;
    const tailX = clamp(tip.x, x + 40, x + bw - 40);
    const b = speakBubble(ctx, {name: `bub-${id}`, x, y, M, tip, tailX, lang: {color: langColor(ctx, li), glyph: LANG_GLYPHS[li]}, showText: showAll, tabSide: tip.x > c.x ? 'left' : 'right'});
    if (up && b.tab.x < tailX + 30 && b.tab.x + b.tab.w > tailX - 30) problems.push('tab-tail');
    return {M, b, tip, center: {x: c.x, y: c.y}, box: {x, y, w: bw, h: M.h}};
  };
  const U = mkBubble('utterance', 'a', p.languages.a, 0, p.props.utterance);
  const R = mkBubble('rendering', 'interpreter', p.languages.b, 1, p.props.rendering);
  // --- the notepad (upright card): heading + shorthand marks
  const nw = C.nw * Math.max(0.9, f);
  const nh0 = fitWords(lab('notes'), {maxWidth: nw - 30, size: S, minSize: minS, maxLines: 2, weight: 700});
  if (nh0.truncated) problems.push('notes-truncated');
  const nh = nh0.height + 14 + 70 * f;
  const nc = P('notes');
  const NB = {x: nc.x - nw / 2, y: nc.y - nh / 2, w: nw, h: nh};
  const notesParts = [
    h('path', {d: roundRectPath(NB.x + 5, NB.y + 7, NB.w, NB.h, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(NB.x, NB.y, NB.w, NB.h, 8), fill: th.paper, stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: `M${r(NB.x)} ${r(NB.y + nh0.height + 14)}H${r(NB.x + NB.w)}`, stroke: th.paperLine, 'stroke-width': 2}),
    ...Array.from({length: Math.max(4, Math.round(NB.w / 30))}, (_, i) => h('ellipse', {cx: r(NB.x + 16 + i * ((NB.w - 32) / Math.max(3, Math.round(NB.w / 30) - 1))), cy: r(NB.y), rx: 3.5, ry: 6, fill: 'none', stroke: '#6b7580', 'stroke-width': 2})),
  ];
  const my = NB.y + nh0.height + 22;
  for (let i = 0; i < 3; i++) {
    const yy = my + (i + 0.5) * (NB.h - (my - NB.y) - 8) / 3;
    const pts = [];
    for (let j = 0; j <= 16; j++) pts.push(`${j ? 'L' : 'M'}${r(NB.x + 18 + j * (NB.w - 36) * (i === 2 ? 0.5 : 0.85) / 16)} ${r(yy + Math.sin(j * (1.1 + i * 0.3)) * 5 * f)}`);
    notesParts.push(h('path', {d: pts.join(''), fill: 'none', stroke: '#1d3f8f', 'stroke-width': 2.6, 'stroke-linecap': 'round'}));
  }
  if (showAll) notesParts.push(textBlock(nh0, {x: NB.x + NB.w / 2, y: NB.y + 10, anchor: 'middle', fill: th.ink, name: 'notes-title'}));
  else notesParts.push(h('rect', {x: r(NB.x + NB.w / 2 - Math.min(nh0.width, NB.w - 40) / 2), y: r(NB.y + 12), width: r(Math.min(nh0.width, NB.w - 40)), height: r(nh0.size * 0.6), rx: 4, fill: th.inkSoft, opacity: 0.6}));

  // --- elements for connectors
  const EL = {
    a: {circle: badges.a.circle}, b: {circle: badges.b.circle}, interpreter: {circle: badges.interpreter.circle},
    utterance: {box: U.box}, rendering: {box: R.box}, notes: {box: NB},
  };
  const centerOf = id => (EL[id].circle ? {x: EL[id].circle.x, y: EL[id].circle.y} : {x: EL[id].box.x + EL[id].box.w / 2, y: EL[id].box.y + EL[id].box.h / 2});
  const anchorOf = (id, toward, pad) => (EL[id].circle ? circleAnchor(EL[id].circle, EL[id].circle.r + pad, toward) : edgeAnchor(EL[id].box, toward, pad));
  const boxOf = id => (EL[id].circle ? circleBox(EL[id].circle) : EL[id].box);
  // all element boxes (+ chips) are obstacles for connectors and labels
  const elBoxes = IDS.map(id => ({id, b: id === 'utterance' ? U.b.box : id === 'rendering' ? R.b.box : boxOf(id)}));
  const chipBoxes = Object.values(chips).map(c => c.box);

  // --- connectors (custom route for a person ↔ rendering / utterance link that would cross the middle)
  const conns = p.relationships.map((rel, i) => {
    const kind = rel.kind;
    const A0 = centerOf(rel.from), B0 = centerOf(rel.to);
    const pad = kind === 'relation' ? 8 : 14;
    let from, to, c1, c2;
    const pair = [rel.from, rel.to].sort().join('|');
    const over = (pair === 'a|rendering' || pair === 'b|utterance');
    let route = null;
    const topBub = Math.min(U.b.box.y, R.b.box.y);
    if (over && shape !== 'portrait') {
      // up from the person, across above both bubbles, down onto the bubble's top edge (a label fits under the run)
      const person = ['a', 'b'].includes(rel.from) ? rel.from : rel.to;
      const card = person === rel.from ? rel.to : rel.from;
      const pc = EL[person].circle, cb = EL[card].box;
      const yRun = topBub - Math.max(60, S * 3.2);
      const cbb = card === 'rendering' ? R.b : U.b;
      // lands on the bubble body's top edge, clear of its language tab
      const tb = cbb.tab;
      let cx0 = cb.x + cb.w * (pc.x < cb.x + cb.w / 2 ? 0.62 : 0.38);
      if (cx0 > tb.x - 24 && cx0 < tb.x + tb.w + 24) cx0 = tb.x - cb.x > cb.x + cb.w - tb.x - tb.w ? Math.max(cb.x + 30, tb.x - 30) : Math.min(cb.x + cb.w - 30, tb.x + tb.w + 30);
      const cEnd = {x: cx0, y: cbb.body.y - pad};
      // leave from the top of the badge, or from its outer side when a bubble sits right above it
      const blocked = [U.b.box, R.b.box].some(bb => pc.x > bb.x - 16 && pc.x < bb.x + bb.w + 16 && bb.y < pc.y);
      const side = pc.x < D.w / 2 ? -1 : 1;
      const xOut = side < 0 ? Math.max(12, Math.min(pc.x - pc.r - 24, Math.min(U.b.box.x, R.b.box.x) - 24)) : Math.min(D.w - 12, Math.max(pc.x + pc.r + 24, Math.max(U.b.box.x + U.b.box.w, R.b.box.x + R.b.box.w) + 24));
      const pts = blocked
        ? [{x: pc.x + side * (pc.r + 8), y: pc.y}, {x: xOut, y: pc.y}, {x: xOut, y: yRun}, {x: cEnd.x, y: yRun}, cEnd]
        : [{x: pc.x, y: pc.y - pc.r - 8}, {x: pc.x, y: yRun}, {x: cEnd.x, y: yRun}, cEnd];
      route = person === rel.from ? pts : pts.slice().reverse();
    } else if (over && shape === 'portrait') {
      // out of the person's side, round the right margin, into the bubble's right edge
      const person = ['a', 'b'].includes(rel.from) ? rel.from : rel.to;
      const card = person === rel.from ? rel.to : rel.from;
      const pc = EL[person].circle, cb = card === 'rendering' ? R.b.box : U.b.box;
      const xR = D.w - 14;
      const pEnd = {x: pc.x + pc.r + 8, y: pc.y};
      const cEnd = {x: cb.x + cb.w + pad, y: cb.y + cb.h * 0.55};
      const pts = [pEnd, {x: xR, y: pc.y}, {x: xR, y: cEnd.y}, cEnd];
      route = person === rel.from ? pts : pts.slice().reverse();
    } else {
      from = anchorOf(rel.from, B0, 8);
      to = anchorOf(rel.to, A0, pad);
      const dx = to.x - from.x, dy = to.y - from.y;
      // the gentlest bend whose curve passes through no other component or name chip
      const blockers = [...elBoxes.filter(e => e.id !== rel.from && e.id !== rel.to).map(e => e.b), ...chipBoxes];
      const inB = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
      const f0 = from, t0 = to;
      for (const bend of [0.1 * (i % 2 ? -1 : 1), -0.1 * (i % 2 ? -1 : 1), 0.25, -0.25, 0.4, -0.4, 0.6, -0.6, 0.85, -0.85]) {
        c1 = {x: f0.x + dx * 0.3 - dy * bend, y: f0.y + dy * 0.3 + dx * bend};
        c2 = {x: f0.x + dx * 0.7 - dy * bend, y: f0.y + dy * 0.7 + dx * bend};
        // the ends leave / arrive in the direction of the bend
        from = anchorOf(rel.from, c1, 8);
        to = anchorOf(rel.to, c2, pad);
        const probe = Array.from({length: 41}, (_, j) => {
          const t = j / 40, mt = 1 - t;
          return {x: mt * mt * mt * from.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * to.x, y: mt * mt * mt * from.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * to.y};
        });
        if (!probe.some(q => blockers.some(b => inB(q, b)))) break;
      }
    }
    let c;
    if (route) {
      c = routedConnector(ctx, {name: `rc${i}`, pts: route, kind, color: kindColor(ctx, kind)});
      from = c.from; to = c.to;
    } else {
      c = connector(ctx, {name: `rc${i}`, from, to, kind, c1, c2, color: kindColor(ctx, kind)});
      // tag the drawn line for the rendered label test
      const line = c.node.children.find(ch => ch.attrs && ch.attrs.name === `rc${i}-line`);
      if (line) line.attrs['data-conn'] = `rc${i}`;
    }
    const pts = Array.from({length: 61}, (_, j) => c.at(j / 60));
    return {rel, c, pts, from, to, kind, len: polyline(pts).total};
  });
  // connectors never pass through a component they do not join (their ends are 8–14 units off the edges)
  let crossings = 0;
  const why = [];
  const inside = (q, b, m) => q.x > b.x + m && q.x < b.x + b.w - m && q.y > b.y + m && q.y < b.y + b.h - m;
  conns.forEach(cn => {
    for (const e of elBoxes) {
      if (e.id === cn.rel.from || e.id === cn.rel.to) continue;
      if (cn.pts.some(q => inside(q, e.b, 2))) { crossings++; why.push(`${cn.rel.from}>${cn.rel.to}@${e.id}`); }
    }
    chipBoxes.forEach((cb, j) => { if (cn.pts.some(q => inside(q, cb, 0))) { crossings++; why.push(`${cn.rel.from}>${cn.rel.to}@chip${j}`); } });
  });
  const segX = (p1, p2, p3, p4) => { const o = (a, b, c) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)); return o(p1, p2, p3) * o(p1, p2, p4) < 0 && o(p3, p4, p1) * o(p3, p4, p2) < 0; };
  const tails = [[U.b.tailBase, U.tip], [R.b.tailBase, R.tip]];
  for (let i = 0; i < conns.length; i++) {
    for (let j = i + 1; j < conns.length; j++) {
      const A1 = conns[i].pts, B1 = conns[j].pts;
      let x = false;
      for (let a = 3; a < A1.length - 3 && !x; a++) for (let b = 3; b < B1.length - 3 && !x; b++) if (segX(A1[a - 1], A1[a], B1[b - 1], B1[b])) x = true;
      if (x) { crossings++; why.push(`c${i}xc${j}`); }
    }
    tails.forEach(([ta, tb], t) => { for (let a = 1; a < conns[i].pts.length; a++) if (segX(conns[i].pts[a - 1], conns[i].pts[a], ta, tb)) { crossings++; why.push(`c${i}xtail${t}`); break; } });
  }
  tails.forEach(([ta, tb], t) => chipBoxes.forEach((cb, j) => { for (let q = 0; q <= 20; q++) { const pt = {x: lerp(ta.x, tb.x, q / 20), y: lerp(ta.y, tb.y, q / 20)}; if (inside(pt, cb, 0)) { crossings++; why.push(`tail${t}@chip${j}`); break; } } }));
  if (crossings) problems.push(`crossings(${why.join(',')})`);
  const minConn = Math.min(...conns.map(c => c.len));
  if (minConn < 70) problems.push('short-connector');

  // --- relation labels, each beside its own connector (≤ 30 units), clearly further from any other
  const capS = Math.max(17, Math.min(S * 0.9, 22, U.M.text.size, R.M.text.size, U.M.tabText.size, R.M.tabText.size, nh0.size, ...Object.values(chips).map(c => c.fit.size)));
  const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  const placedLabels = [];
  const occupied = [...elBoxes.map(e => e.b), ...chipBoxes];
  const allPts = conns.map(c => c.pts);
  const tailPts = tails.map(([a, b]) => Array.from({length: 11}, (_, j) => ({x: lerp(a.x, b.x, j / 10), y: lerp(a.y, b.y, j / 10)})));
  const labels = conns.map((cn, i) => {
    if (!showAll) return null;
    const text = cn.rel.label || p.relationLabels[cn.kind];
    let best = null;
    for (const maxW of [300, 230, 180, 150]) {
      const probe = wchip(ctx, text, {x: 0, y: 0, maxWidth: maxW, size: capS, minSize: capS, maxLines: 4, weight: 600});
      if (probe.fit.truncated) continue;
      const w = probe.box.w, hh = probe.box.h;
      for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
        const q = cn.c.at(t);
        const q2 = cn.c.at(Math.min(1, t + 0.02));
        const ang = Math.atan2(q2.y - q.y, q2.x - q.x);
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        for (const side of [1, -1]) {
          for (const d of [10, 18, 28]) {
            // box whose nearest edge is d units off the curve, along the normal
            const ext = Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2;
            const cx = q.x + nx * side * (ext + d), cy = q.y + ny * side * (ext + d);
            const b = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
            if (b.x < bounds.x || b.y < bounds.y || b.x + w > bounds.x + bounds.w || b.y + hh > bounds.y + bounds.h) continue;
            if (occupied.some(o => overlaps(b, o, 6)) || placedLabels.some(o => overlaps(b, o, 8))) continue;
            const dist = pts => Math.min(...pts.map(pt => boxDist(pt, b)));
            const own = dist(cn.pts);
            if (own > 30) continue;
            const others = [...allPts.filter((_, j) => j !== i), ...tailPts];
            if (others.some(pts => dist(pts) < own + 16)) continue;
            const sc = own + Math.abs(t - 0.5) * 40 + (maxW < 300 ? 8 : 0);
            if (!best || sc < best.sc) best = {sc, b, maxW, own};
          }
        }
      }
      if (best) break;
    }
    if (!best) { problems.push(`label${i}`); return null; }
    placedLabels.push(best.b);
    const node = wchip(ctx, text, {x: best.b.x + best.b.w / 2, y: best.b.y, anchor: 'middle', maxWidth: best.maxW, size: capS, minSize: capS, maxLines: 4, weight: 600, fill: th.card, stroke: kindColor(ctx, cn.kind), name: `rl${i}`});
    return {node, box: node.box, own: best.own};
  });

  // --- legend of kinds used + key, in free space
  const kinds = [...new Set(conns.map(c => c.kind))];
  const cands = gridCands(bounds, 12);
  const obst = [...occupied, ...placedLabels, ...conns.map(cn => {
    const xs = cn.pts.map(q => q.x), ys = cn.pts.map(q => q.y);
    return {x: Math.min(...xs) - 6, y: Math.min(...ys) - 6, w: Math.max(...xs) - Math.min(...xs) + 12, h: Math.max(...ys) - Math.min(...ys) + 12};
  })];
  const hitsConn = b => conns.some(cn => cn.pts.some(q => q.x > b.x - 6 && q.x < b.x + b.w + 6 && q.y > b.y - 6 && q.y < b.y + b.h + 6)) || tailPts.some(ps => ps.some(q => q.x > b.x - 6 && q.x < b.x + b.w + 6 && q.y > b.y - 6 && q.y < b.y + b.h + 6));
  let legend = null, key = null;
  if (showKey) {
    let placedLegend = false;
    for (const iw of [240, 180, 140]) {
      const items = kinds.map(kd => fitWords(p.relationLabels[kd], {maxWidth: iw, size: capS, minSize: capS, maxLines: 4, weight: 600}));
      if (items.some(f => f.truncated)) continue;
      const rowHs = items.map(f => Math.max(capS * 1.5, f.height + 10));
      const lw = 70 + Math.max(...items.map(f => f.width)) + 24;
      const title = fitWords(ctx.t.legend, {maxWidth: lw - 20, size: capS, minSize: capS, maxLines: 2, weight: 700});
      const lh = title.height + 16 + rowHs.reduce((q, v) => q + v, 0) + 8;
      const occ = [...obst.slice(0, occupied.length + placedLabels.length)];
      const spot = freeSpot(cands, lw, lh, occ, bounds, 8, b => (hitsConn(b) ? 1e5 : 0) + Math.hypot(b.x - bounds.x, b.y + b.h - (bounds.y + bounds.h)));
      if (!spot || hitsConn({x: spot.x, y: spot.y, w: lw, h: lh})) continue;
      const parts = [h('path', {d: roundRectPath(spot.x, spot.y, lw, lh, 10), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}), textBlock(title, {x: spot.x + 12, y: spot.y + 8, fill: th.ink})];
      const lconns = [];
      kinds.forEach((kd, j) => {
        const yy = spot.y + title.height + 16 + rowHs.slice(0, j).reduce((q, v) => q + v, 0) + rowHs[j] / 2;
        const cc = connector(ctx, {name: `lg${j}`, from: {x: spot.x + 12, y: yy}, to: {x: spot.x + 60, y: yy}, kind: kd, c1: {x: spot.x + 28, y: yy}, c2: {x: spot.x + 44, y: yy}, color: kindColor(ctx, kd)});
        parts.push(g(null, cc.node));
        parts.push(textBlock(items[j], {x: spot.x + 70, y: yy - items[j].height / 2, fill: th.ink}));
        lconns.push(cc);
      });
      legend = {node: g({name: 'legend', opacity: 0, 'data-card': 1}, parts), box: {x: spot.x, y: spot.y, w: lw, h: lh}, conns: lconns};
      occupied.push(legend.box);
      placedLegend = true;
      break;
    }
    if (!placedLegend) {
      // a one-row legend (title, then each kind's sample and caption) for crowded frames
      const items = kinds.map(kd => fitWords(p.relationLabels[kd], {maxWidth: 220, size: capS, minSize: capS, maxLines: 2, weight: 600}));
      const title = fitWords(ctx.t.legend, {maxWidth: 200, size: capS, minSize: capS, maxLines: 2, weight: 700});
      const lh = Math.max(title.height, ...items.map(f => f.height)) + 20;
      const lw = 12 + title.width + 20 + items.reduce((q, f) => q + 58 + f.width + 18, 0);
      const occ = [...obst.slice(0, occupied.length + placedLabels.length)];
      const spot = lw <= bounds.w ? freeSpot(cands, lw, lh, occ, bounds, 8, b => (hitsConn(b) ? 1e5 : 0) + (bounds.y + bounds.h - b.y - b.h)) : null;
      if (spot && !hitsConn({x: spot.x, y: spot.y, w: lw, h: lh})) {
        const parts = [h('path', {d: roundRectPath(spot.x, spot.y, lw, lh, 10), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}), textBlock(title, {x: spot.x + 12, y: spot.y + (lh - title.height) / 2, fill: th.ink})];
        const lconns = [];
        let x = spot.x + 12 + title.width + 20;
        const yy = spot.y + lh / 2;
        kinds.forEach((kd, j) => {
          const cc = connector(ctx, {name: `lg${j}`, from: {x, y: yy}, to: {x: x + 46, y: yy}, kind: kd, c1: {x: x + 16, y: yy}, c2: {x: x + 30, y: yy}, color: kindColor(ctx, kd)});
          parts.push(g(null, cc.node));
          parts.push(textBlock(items[j], {x: x + 56, y: yy - items[j].height / 2, fill: th.ink}));
          lconns.push(cc);
          x += 58 + items[j].width + 18;
        });
        legend = {node: g({name: 'legend', opacity: 0, 'data-card': 1}, parts), box: {x: spot.x, y: spot.y, w: lw, h: lh}, conns: lconns};
        occupied.push(legend.box);
      } else problems.push('legend');
    }
    const kp = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: 420, size: capS, minSize: capS, maxLines: 2});
    const ks = freeSpot(cands, kp.box.w, kp.box.h, occupied.concat(placedLabels), bounds, 8, b => (hitsConn(b) ? 1e5 : 0) + Math.hypot(b.x + b.w - (bounds.x + bounds.w), b.y + b.h - (bounds.y + bounds.h)));
    if (ks && !hitsConn({x: ks.x, y: ks.y, w: kp.box.w, h: kp.box.h})) key = keyChip(ctx, ctx.t.key, {x: ks.x, y: ks.y, maxWidth: 420, size: capS, minSize: capS, maxLines: 2, name: 'key'});
    else problems.push('key');
  }
  // text inside the frame
  for (const b of [...Object.values(chips).map(c => c.box), U.b.box, R.b.box, NB]) if (b.x < 4 || b.y < 4 || b.x + b.w > D.w - 4 || b.y + b.h > D.h - 4) problems.push('out');
  // chips / cards never overlap one another or a badge
  const cardBoxes = [...Object.values(chips).map(c => c.box), U.b.box, R.b.box, NB];
  for (let i = 0; i < cardBoxes.length; i++) for (let j = i + 1; j < cardBoxes.length; j++) if (overlaps(cardBoxes[i], cardBoxes[j], 6)) problems.push('card-overlap');
  for (const cb of cardBoxes) for (const id of ['a', 'b', 'interpreter']) if (overlaps(cb, circleBox(badges[id].circle), 2)) problems.push('card-badge');

  // --- tracer route through traversalOrder (connectors either way, tails, else a straight hop)
  const tailOf = {'a|utterance': [U.tip, U.b.tailBase], 'interpreter|rendering': [R.tip, R.b.tailBase]};
  const route = [];
  const visits = [];
  const order = p.traversalOrder;
  order.forEach((id, i) => {
    if (i === 0) { route.push(centerOf(id)); visits.push({id, idx: 0}); return; }
    const prev = order[i - 1];
    const cn = conns.find(c => (c.rel.from === prev && c.rel.to === id) || (c.rel.from === id && c.rel.to === prev));
    const tkey = [prev, id].sort().join('|');
    if (cn) {
      const fw = cn.rel.from === prev;
      for (let j = 0; j <= 30; j++) route.push(cn.c.at(fw ? j / 30 : 1 - j / 30));
    } else if (tailOf[tkey]) {
      const [owner, base] = tailOf[tkey];
      const fw = prev === 'a' || prev === 'interpreter';
      route.push(fw ? owner : base, fw ? base : owner);
    }
    route.push(centerOf(id));
    visits.push({id, idx: route.length - 1});
  });
  const poly = polyline(route);
  const cum = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y));
  const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / (cum[cum.length - 1] || 1)}));

  const labelDists = labels.filter(Boolean).map(l => l.own);
  const contentBoxes = [...elBoxes.map(e => e.b), ...chipBoxes, ...placedLabels, ...conns.map(cn => {
    const yy = cn.pts.map(q => q.y);
    return {x: 0, y: Math.min(...yy), w: 1, h: Math.max(...yy) - Math.min(...yy)};
  })];
  const cTop = Math.min(...contentBoxes.map(b => b.y)), cBot = Math.max(...contentBoxes.map(b => b.y + b.h));
  return {
    ok: problems.length === 0, problems, S, f, ys, yo, cTop, cBot, badges, chips, U, R, NB, notesNode: g({name: 'notes-card'}, notesParts), conns, labels, legend, key, poly, visitT,
    crossings, minConn, relLabelMaxDist: labelDists.length ? Math.max(...labelDists) : 0, capS,
    connectorGaps: conns.map(cn => {
      const gapTo = (id, q) => (EL[id].circle ? Math.abs(Math.hypot(q.x - EL[id].circle.x, q.y - EL[id].circle.y) - EL[id].circle.r) : Math.min(boxDist(q, EL[id].box), ...(id === 'utterance' ? [boxDist(q, U.b.tab)] : id === 'rendering' ? [boxDist(q, R.b.tab)] : [])));
      return r(Math.max(gapTo(cn.rel.from, cn.from), gapTo(cn.rel.to, cn.to)), 1);
    }),
  };
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const tries = [];
    let least = null;
    for (let S = C.size; S >= 17 - 1e-6; S -= 1) {
      for (const f of [1, 0.9, 0.8, 0.7]) {
        // first at the plain fractions, then stretched / centred so the map fills the height
        const L0 = tryLayout(ctx, S, f);
        const fr = Object.values(C.pos).map(q => q[1]);
        const span = (Math.max(...fr) - Math.min(...fr)) * ctx.design.h;
        let L = null;
        // (a crowded frame keeps a band free at the bottom for the legend and the key)
        for (const reserve of [0, 110]) {
          const slack = (ctx.design.h - 24 - reserve) - (L0.cBot - L0.cTop);
          const ys = clamp(1 + slack / Math.max(1, span), 0.8, 1.35);
          const top1 = L0.cTop + (ys - 1) * Math.min(...fr) * ctx.design.h;
          const h1 = (L0.cBot - L0.cTop) + (ys - 1) * span;
          const yo = 12 + ((ctx.design.h - 24 - reserve) - h1) / 2 - top1;
          L = tryLayout(ctx, S, f, ys, yo);
          if (L.ok) break;
        }
        if (!L.ok && L0.ok) L = L0;
        if (L.ok) return {...L, tries: tries.slice(-8)};
        tries.push(`${S}/${f}:${L.problems.join('+')}`);
        if (!least || L.problems.length < least.problems.length) least = L;
      }
    }
    // nothing fits cleanly: draw the attempt with the fewest problems (reported as labelsFit false)
    return {...least, tries: tries.slice(-8)};
  },
  build(ctx, L) {
    const slide = (id, node) => g({name: `sl-${id}`}, g({name: `el-${id}`}, node));
    return g(null,
      L.conns.map(c => c.c.node),
      ['a', 'interpreter', 'b'].map(id => L.badges[id].node),
      Object.values(L.chips).map(c => c.node),
      slide('utterance', L.U.b.node),
      slide('rendering', L.R.b.node),
      slide('notes', L.notesNode),
      L.labels.map((l, i) => l && g({name: `rlg${i}`, opacity: 0, 'data-rel-label': `rc${i}`}, l.node.node)),
      L.legend && L.legend.node,
      L.key && L.key.node,
      tracer(ctx, 'tracer'),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const nodes = {};
    // separate: each component slides out of its owner (text shown with its card)
    const owners = {utterance: 'a', rendering: 'interpreter', notes: 'interpreter'};
    const centers = {utterance: {x: L.U.box.x + L.U.box.w / 2, y: L.U.box.y + L.U.box.h / 2}, rendering: {x: L.R.box.x + L.R.box.w / 2, y: L.R.box.y + L.R.box.h / 2}, notes: {x: L.NB.x + L.NB.w / 2, y: L.NB.y + L.NB.h / 2}};
    let sepAll = 1;
    ['utterance', 'notes', 'rendering'].forEach((id, i) => {
      const a = W.sep[0] + i * 0.03, b = a + 0.07;
      const s = ease.inOutCubic(seg(u, a, b));
      sepAll = Math.min(sepAll, s);
      const oc = L.badges[owners[id]].circle, c = centers[id];
      const k = lerp(0.25, 1, s);
      nodes[`sl-${id}`] = {transform: s >= 1 ? '' : `${T((oc.x - c.x) * (1 - s), (oc.y - c.y) * (1 - s))} ${scaleAbout(c.x, c.y, k)}`, opacity: r(clamp(s * 3), 3)};
    });
    Object.assign(nodes, L.U.b.frame(1, reduced), L.R.b.frame(1, reduced));
    // relate: connectors one by one
    const n = L.conns.length;
    const span = (W.rel[1] - W.rel[0]) / n;
    const drawn = L.conns.map((cn, i) => {
      const pr = ease.inOutSine(seg(u, W.rel[0] + i * span, W.rel[0] + (i + 0.8) * span));
      Object.assign(nodes, cn.c.frame(pr, pr > 0 ? 1 : 0));
      if (L.labels[i]) nodes[`rlg${i}`] = {opacity: r(clamp((pr - 0.55) / 0.45), 3)};
      return pr;
    });
    // trace
    const tp = seg(u, ...W.trace);
    const tv = tp > 0 && tp < 1;
    const q = L.poly.at(ease.inOutSine(tp));
    nodes.tracer = {transform: T(q.x, q.y), opacity: tv ? 1 : 0};
    const te = ease.inOutSine(tp);
    const visitOrder = L.visitT.filter(v => tp > 0 && v.t <= te + 1e-9).map(v => v.id);
    // focus element enlarges while the marker is near it
    const fv = L.visitT.filter(v => v.id === p.focusElement);
    const near = tv ? Math.max(0, ...fv.map(v => 1 - clamp(Math.abs(te - v.t) / 0.1))) : 0;
    const focusScale = 1 + 0.16 * ease.inOutSine(near);
    for (const id of IDS) {
      const k = id === p.focusElement ? focusScale : 1;
      if (['a', 'b', 'interpreter'].includes(id)) nodes[`pb-${id}-body`] = {transform: k === 1 ? '' : `scale(${r(k, 4)})`};
      else {
        const c = centers[id];
        nodes[`el-${id}`] = {transform: k === 1 ? '' : scaleAbout(c.x, c.y, k)};
      }
    }
    if (L.legend) {
      nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
      L.legend.conns.forEach(cc => Object.assign(nodes, cc.frame(1, 1)));
    }
    if (L.key) nodes.key = {opacity: r(seg(u, ...W.key), 3)};
    return {
      nodes,
      semantic: {
        tracer: {x: r(q.x), y: r(q.y)},
        tracerVisible: tv, tracerShown: tv,
        separated: r(sepAll, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        visitOrder,
        focusScale: r(focusScale, 3),
        legendShown: L.legend ? r(seg(u, ...W.legend), 3) : 0,
        keyShown: L.key ? r(seg(u, ...W.key), 3) : 0,
        arrows: L.conns.map(cn => ({kind: cn.kind, arrow: ['communication', 'sequence', 'causal'].includes(cn.kind)})),
        connectorGaps: L.connectorGaps,
        crossings: L.crossings, minConn: r(L.minConn),
        relLabelMaxDist: r(L.relLabelMaxDist, 1), relLabelCount: L.labels.filter(Boolean).length,
        tails: {utterance: 'a', rendering: 'interpreter'},
        labelsFit: L.problems.length === 0, textSize: L.S, scale: L.f, layoutTries: L.tries,
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
    slug: 'roles-06-mechanism',
    title: 'Language interpretation — the path of the words, component by component',
    titleEs: 'Interpretación lingüística — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Interpretación lingüística',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A U-shaped map of the path of the words: speaker A’s bubble (tail on A), the interpreter and her notes, her rendering (tail on the interpreter) and the listener. Only the supplied relationships are drawn, one by one, styled by kind with labels beside their own connectors; a relation keeps the rendering tied to speaker A. A marker follows the supplied traversal order; the focus element enlarges. Legend and key; no accuracy, validity or outcome is stated.',
    tags: ['interpreter', 'mechanism', 'relationships', 'speech bubble', 'rendering', 'notes', 'language', 'traversal'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/interpretacion-linguistica.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
