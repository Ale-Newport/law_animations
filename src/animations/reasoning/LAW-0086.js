/**
 * LAW-0086 — Analogía de casos · mechanism
 *
 * Storyboard (exploded axonometric view of the tracing overlay, no hands):
 *  0.00–0.18 separate  Case B's tracing sheet lies on case A's; it rises along
 *                      the two registration posts until the stack is exploded
 *                      (A below, B above; wide boxes). Each supplied feature
 *                      then pops up as a pin — a round token with the
 *                      feature's pictogram in the case's ink. A shared feature
 *                      (identical text) stands in the SAME slot on both sheets;
 *                      a differing or single-case feature has a pair of slots
 *                      (A's variant left, B's right), as on the story's sheets.
 *                      The layer tabs name the two cases; the rule plate (text
 *                      as supplied) carries one socket per feature it names.
 *  0.18–0.43 relate    Column by column a plumb line drops from B's slot to
 *                      sheet A; where it lands a glyph disc reads the
 *                      comparison: "=" (it lands on A's token), "≠" (it lands
 *                      beside A's different token) or a dashed empty slot (only
 *                      one case has it). The readout card under the column
 *                      holds the supplied text(s). Then ONLY the supplied
 *                      relationships are drawn in their kind's style (a plain
 *                      relation has no arrowhead; arrows only for supplied
 *                      sequence / communication / causal links).
 *  0.43–0.75 trace     A tracer follows `traversalOrder`. When it reaches the
 *                      focus element a magnifier glides over that slot's
 *                      tokens (never over a readout text) and a detail window
 *                      beside the stack shows a real enlarged copy of it.
 *  0.75–1.00 gather    The window closes, the magnifier returns; sheet B slides
 *                      back down the posts and seats on A: shared tokens
 *                      coincide (merged ink), differing variants stand side by
 *                      side with their "≠", single-case slots stay empty. The
 *                      relationships stay attached; state tags read "relevant
 *                      similarity / difference · as supplied" (or disputed /
 *                      pending), with a legend of the connection kinds used,
 *                      the issue and the assumption.
 * Wide boxes explode the stack vertically (slots left → right); tall and
 * square boxes turn it a quarter turn (sheets side by side, slots top →
 * bottom) so every slot keeps a full-size readout.
 * Legal content: fictional features and rule text supplied by the author; the
 * scene only shows the supplied structure — it never decides that a rule
 * applies, that the cases are alike in law, or any outcome.
 * @module animations/reasoning/LAW-0086
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath, cubic} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {oneOf, mechanismFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {segPolys, hitsAny} from '../causation/kits/place.js';
import {kindColor} from '../../frameworks/graph.js';
import {lens as detailLens} from '../../frameworks/lens.js';
import {shade} from '../../primitives/paper.js';
import {
  analogyFields, ANALOGY_STRINGS, resolveAnalogy, inks, relBadge, glyphOf, magnifier, pictogram,
  axo, stackPlane, stackPin, rulePlate, socketNode, postRod, brokeWord, SANS,
} from './kits/analogia-de-casos.js';

const ID = 'LAW-0086';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  tabs: [0, 0.06], tabB: [0.1, 0.16], rise: [0.02, 0.11], pins: [0.08, 0.18],
  plumb: [0.19, 0.31], rels: [0.31, 0.43],
  // the magnifier is carried quickly (it is lifted over the scene while it moves)
  trace: [0.45, 0.72], lensGo: 0.1, win: 0.05, lensBack: [0.78, 0.865], winClose: [0.75, 0.79],
  seat: [0.79, 0.9], seated: [0.88, 0.93],
  states: [0.9, 0.96], legend: [0.9, 0.96], issue: [0.92, 0.98],
};
const ELEMENT_IDS = ['caseA', 'caseB', 'rule', 'similarity', 'difference', 'lens'];
const ZOOM = 1.7;
const SEAT_EQ = 0.78; // "=" disc scale once seated beside the merged token

const mech = mechanismFields(ELEMENT_IDS);
const sceneSchema = {
  ...analogyFields,
  ...mech,
  finalState: oneOf('State supplied by the author for the relevance tags in the gather beat (no legal conclusion is inferred)', ['marked-as-supplied', 'difference-disputed', 'relevance-pending']),
};

const defaultParams = {
  cases: {a: {name: 'Case Harbour', note: 'earlier case · fictional'}, b: {name: 'Case Linden', note: 'new case · fictional'}},
  facts: [
    {icon: 'ladder', a: 'Ladder lent by a neighbour', b: 'Ladder lent by a neighbour', relevant: true},
    {icon: 'note', a: 'Loan noted on a slip', b: 'Loan noted on a slip', relevant: false},
    {icon: 'calendar', a: 'Return date agreed', b: 'No return date agreed', relevant: true},
    {icon: 'rain', a: 'Left outside in the rain', b: '', relevant: false},
  ],
  rules: [{name: 'Rule R (illustrative)', text: '“Where an item is lent and a return date is agreed, …”'}],
  issues: ['Is Case Linden alike in the features Rule R names?'],
  assumptions: ['Facts taken as each account supplies them'],
  elements: [{id: 'similarity', label: 'Relevant similarity'}, {id: 'difference', label: 'Relevant difference'}],
  relationships: [
    {from: 'caseB', to: 'caseA', kind: 'relation'},
    {from: 'rule', to: 'similarity', kind: 'relation'},
    {from: 'rule', to: 'difference', kind: 'relation'},
  ],
  focusElement: 'difference',
  relationLabels: {relation: '', communication: '', sequence: '', causal: ''},
  traversalOrder: ['caseB', 'similarity', 'caseA', 'difference', 'rule'],
  finalState: 'marked-as-supplied',
};

const M = 30;

/** Does segment a→b pass through the interior of box (shrunk by 4)? */
function segCrossesBox(a, b, box) {
  const bx = {x: box.x + 4, y: box.y + 4, w: box.w - 8, h: box.h - 8};
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  for (const [pp, qq] of [[-dx, a.x - bx.x], [dx, bx.x + bx.w - a.x], [-dy, a.y - bx.y], [dy, bx.y + bx.h - a.y]]) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 < t1;
}

/** Built-in label of an element unless the author overrides it. */
function elementLabel(ctx, id) {
  const p = ctx.params;
  const t = ctx.t;
  const o = p.elements.find(e => e.id === id);
  if (o && o.label) return o.label;
  if (id === 'caseA') return p.cases.a.name;
  if (id === 'caseB') return p.cases.b.name;
  if (id === 'rule') return (p.rules[0] && p.rules[0].name) || t.ruleCard;
  if (id === 'similarity') return t.relevantSimilarity;
  if (id === 'difference') return t.relevantDifference;
  return t.magnifier;
}

/** State tag text for a relevant column (descriptive only). */
function stateText(ctx, key) {
  const p = ctx.params;
  const t = ctx.t;
  const base = elementLabel(ctx, key);
  if (p.finalState === 'relevance-pending') return `${base} · ${t.pendingWord}`;
  if (p.finalState === 'difference-disputed' && key === 'difference') return `${base} · ${t.disputed}`;
  return `${base} · ${t.asSupplied}`;
}

const kindCaption = (ctx, kind) => ctx.params.relationLabels[kind] || ctx.t[kind];

/** Width of the side column (rule plate + detail window on wide boxes; lens + window + notes on square boxes). */
function sideWidth(ctx) {
  const D = ctx.design;
  const shape = ctx.view.shape;
  return shape === 'landscape' ? clamp(D.w * 0.24, 400, 480) : 0;
}

/** The comparison glyph + two mini tokens drawn in a readout card. */
function miniRow(ctx, I, F, cx, my, miniR) {
  const th = ctx.theme;
  const gap = miniR * 2.9;
  const slot = (who, at) => {
    const has = who === 'A' ? F.a : F.b;
    const ink = who === 'A' ? I.a : I.b;
    if (!has) return h('circle', {cx: r(at), cy: r(my), r: r(miniR - 2), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-dasharray': '5 4'});
    const icon = who === 'B' && F.kind !== 'shared' ? F.iconB : F.icon;
    return g(null,
      h('circle', {cx: r(at), cy: r(my), r: r(miniR), fill: '#ffffff', stroke: ink.ink, 'stroke-width': 3}),
      g({transform: T(at, my)}, pictogram(icon, {s: miniR * 1.3, ink: ink.ink, soft: '#ffffff'})));
  };
  return [slot('A', cx - gap * 0.62), slot('B', cx + gap * 0.62), relBadge(ctx, {kind: glyphOf(F.kind), x: cx, y: my, rad: miniR * 0.62, color: F.kind === 'shared' ? I.m.ink : th.ink})];
}

/** Points of a connector route (a cubic or a polyline) for given end points. */
function routePts(route) {
  if (route.poly) return route.poly;
  const out = [];
  for (let i = 0; i <= 32; i++) out.push(cubic(route.from, route.c1, route.c2, route.to, i / 32));
  return out;
}
const dOf = route => (route.poly
  ? `M${route.poly.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`
  : `M${r(route.from.x)} ${r(route.from.y)}C${r(route.c1.x)} ${r(route.c1.y)} ${r(route.c2.x)} ${r(route.c2.y)} ${r(route.to.x)} ${r(route.to.y)}`);

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const I = inks(th);
    const R = resolveAnalogy(p.facts);
    // design units that render as 20 px on a 1080-px frame side (key text floor)
    const PX = 20 * Math.min(ctx.view.width, ctx.view.height) / (1080 * fitDesign(ctx.view, D.w, D.h).scale);
    const F16 = PX * 0.8; // 16 px at 1080p: the floor for any author text
    // sizes of the author's content as drawn (generic captions are capped to
    // the smallest of them: the text hierarchy never inverts)
    const contentSizes = [];
    const cols = R.features.filter(F => F.kind !== 'none');
    const shape0 = ctx.view.shape;
    const portrait = shape0 === 'portrait';
    const landscape = shape0 === 'landscape';
    const sq = shape0 === 'square';
    const qt = false; // (quarter-turn variant retired: every box explodes the stack vertically)
    const tall = portrait || sq;
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const RW = sideWidth(ctx);
    // --- rule plate (landscape: sockets + state captions at its top, text below)
    const sockR = qt ? 32 : 32;
    const rule = p.rules[0];
    const namedCount = cols.filter(F => F.relevant).length;
    const TX = sq ? 30 : landscape ? 30 : 29;
    const stateKey = F => (F.i === R.relSim ? 'similarity' : F.i === R.relDiff ? 'difference' : null);
    // landscape: each socket row carries the element's name and, in the
    // gather beat, the supplied state under it — the row is as tall as both
    const capFit = (key, mw) => {
      const f1 = ctx.fit(elementLabel(ctx, key), {maxWidth: mw, size: Math.max(PX, TX * 0.8), minSize: Math.max(18, PX * 0.92), maxLines: 2, weight: 700});
      const suffix = p.finalState === 'relevance-pending' ? t.pendingWord : p.finalState === 'difference-disputed' && key === 'difference' ? t.disputed : t.asSupplied;
      const f2 = ctx.fit(suffix, {maxWidth: mw, size: Math.max(PX, TX * 0.72), minSize: Math.max(17, PX * 0.92), maxLines: 1, weight: 600});
      return {f1, f2, h: f1.height + 12 + f2.height};
    };
    const capW0 = RW - 2 * 32 - 2;
    const rowH = Math.max(2 * sockR + 22, ...(landscape && showKey ? cols.filter(F => F.relevant && stateKey(F)).map(F => capFit(stateKey(F), capW0).h + 16) : [0]));
    const plateW = landscape ? RW : sq ? (D.w - 2 * M) * 0.44 : D.w - 2 * M;
    const plate = rulePlate(ctx, {prefix: 'plate', w: plateW, name: elementLabel(ctx, 'rule'), text: rule.text, size: Math.max(PX * 1.05, TX * (landscape ? 0.92 : 0.9)), minSize: Math.max(16, PX * 0.92), maxLines: 4, top: landscape ? 18 + namedCount * rowH + 6 : 44});

    // --- column widths: a shared feature has one slot, the others a pair
    const wOf = F => (F.kind === 'shared' ? (portrait || sq ? 1.8 : 1.5) : 2.1);
    const discR = qt ? 25 : 26;
    const U = cols.reduce((s, F) => s + wOf(F), 0);

    // --- plan
    const lensR = qt ? 62 : sq ? 56 : 66;
    let axes, sd, O, su, mU, unit, tokR, post, vPin, pinH, G, tabH = 0, tabW = 0, right = 0;
    const readoutLines = F => {
      if (F.kind === 'shared') return [{who: null, text: F.a}];
      const out = [];
      if (F.a) out.push({who: 'A', text: F.a});
      if (F.b) out.push({who: 'B', text: F.b});
      return out;
    };
    // square boxes drop the mini token row from the readouts (the tokens stand
    // right above them) so the readout text can stay large
    // (with labels hidden the mini row is all a readout shows: keep it)
    const noMini = qt || (sq && showKey);
    const miniR = noMini ? 0 : tall ? 21 : 24;
    // square boxes tag the supplied states above the seated stack instead of
    // on a ribbon inside the readouts (the readouts stay short)
    const ribbonOn = showKey && !sq;
    const cardOnce = (F, w, k) => {
      // readout lines wrap only between words (a smaller size when a word is too long)
      // (never below 16 px, never cut: more lines instead)
      const fitWords = (tx, o) => {
        let f = null;
        for (const kk of [1, 0.9, 0.8, 0.72]) {
          const sz = Math.max(F16, o.size * kk);
          f = ctx.fit(tx, {...o, size: sz, minSize: Math.max(F16, Math.min(o.minSize, sz))});
          if (!brokeWord(f) && !f.truncated) break;
        }
        if (f.truncated) f = ctx.fit(tx, {...o, size: Math.max(F16, o.size * 0.72), minSize: F16, maxLines: 12});
        return f;
      };
      const lines = readoutLines(F).map(l => ({...l, fit: showKey ? fitWords(l.who ? `${l.who} · ${l.text}` : l.text, {maxWidth: w - 20, size: Math.max(PX, TX * (tall ? 0.8 : 0.86)) * k, minSize: Math.max(F16, PX * 0.92 * k), maxLines: qt ? 3 : tall ? 7 : 6, weight: 600}) : null}));
      const textH = showKey ? lines.reduce((acc, l) => acc + l.fit.height + l.fit.size * 0.4, 0) + 4 : 0;
      const rib = ribbonOn && stateKey(F) ? fitWords(stateText(ctx, stateKey(F)), {maxWidth: w - 26, size: Math.max(PX, TX * (tall ? 0.68 : 0.74)) * Math.max(0.85, k), minSize: Math.max(F16, PX * 0.92 * Math.max(0.85, k)), maxLines: 8, weight: 700}) : null;
      return {lines, rib, h: (noMini ? 18 : 2 * miniR + 24) + textH + (rib ? rib.height + 18 : 0)};
    };
    let colWOf;
    let cardScale = 1;
    // one text scale for every readout card, so the tallest stays within the cap
    const fitCards = cap => {
      for (const k of [1, 0.94, 0.88, 0.8]) {
        cardScale = k;
        const hmax = Math.max(...cols.map(F => cardOnce(F, colWOf(F) - 12, k).h));
        if (hmax <= cap) return hmax;
      }
      return Math.max(...cols.map(F => cardOnce(F, colWOf(F) - 12, cardScale).h));
    };
    // the end tokens keep clear of the registration posts (holes at u = 16
    // and su - 16): widen the margins (smaller units) when they would touch
    const clearPosts = () => {
      const edgeRoom = F => (F.kind === 'shared' ? unit * wOf(F) / 2 : unit * wOf(F) / 2 - unit * 0.62);
      // (the posts stand at v = 0.2·sd, the tokens at 0.5·sd: in the drawing a
      // right-end token sits that much closer to its post)
      const need = 16 + 24 + tokR;
      const skew = Math.abs(axes.eV.x) * 0.3 * sd;
      const lack = Math.max(0, need - skew - (mU + edgeRoom(cols[0])), need + skew - (mU + edgeRoom(cols[cols.length - 1])));
      if (lack > 0) {
        mU += lack + 4;
        const unit2 = (su - 2 * mU) / U;
        tokR = Math.max(20, tokR * unit2 / unit);
        unit = unit2;
        post = tokR * 0.7;
        pinH = post + 2 * tokR;
      }
    };
    let bottomH = 0;
    let panel = null;
    if (tall) {
      axes = {eU: {x: 1, y: 0}, eV: {x: 0.44, y: 0.32}, eZ: {x: 0, y: -1}};
      sd = 170;
      tabH = sq ? Math.max(96, PX * 3.6) : 108;
      const lane = 84; // two well separated connector lanes right of the stack
      O = {x: M + 4, y: 0};
      su = D.w - M - lane - O.x - sd * axes.eV.x;
      mU = 22;
      unit = (su - 2 * mU) / U;
      tokR = clamp(Math.min(unit * 0.34, unit * 0.62 - discR - 4), 24, sq ? 40 : 50);
      post = tokR * 0.7;
      vPin = sd * 0.5;
      pinH = post + 2 * tokR;
      clearPosts();
      colWOf = F => unit * wOf(F);
      const cardH0 = fitCards(D.h * (sq ? 0.24 : 0.24));
      const plateY = D.h - M - plate.h;
      let cardsY;
      if (sq) {
        // bottom row: lens + detail window / legend on the left, rule plate on the right
        // the band holds the lens, the issue / assumption and the legend: tall
        // enough for the supplied texts at ≥ 17.6 px (never cut)
        let need = 0;
        if (showAll) {
          const bw0 = D.w - 2 * M - plateW - 24 - lensR * 4.3;
          const probe = tx => chip(ctx, tx, {x: 0, y: 0, maxWidth: bw0, size: PX * 0.88, minSize: F16, maxLines: 7}).box.h + 10;
          if (p.issues.length) need += probe(`${t.issue}: ${p.issues[0]}`);
          if (p.assumptions.length) need += probe(p.assumptions.map(a2 => `${t.assumption}: ${a2}`).join(' · '));
          need += 60;
        }
        const rowH = Math.max(plate.h, 262, need);
        // room above the plate's sockets for the connectors' two turns
        const turnRoom = sockR + 3 + 14 + 28 + 18;
        cardsY = D.h - M - rowH - Math.max(34, turnRoom - (rowH - plate.h)) - cardH0;
        panel = {x: M, y: D.h - M - rowH, w: D.w - 2 * M - plateW - 24, h: rowH};
      } else {
        const bandH = 250;
        cardsY = plateY - 34 - bandH - cardH0;
        panel = {x: M, y: cardsY + cardH0 + 16, w: D.w - 2 * M, h: bandH};
      }
      O = {x: O.x, y: cardsY - 20 - sd * axes.eV.y};
      const top = M + tabH + 24 + 96;
      G = O.y + vPin * axes.eV.y - pinH - top;
      right = D.w - M;
    } else if (qt) {
      // quarter turn: the sheets stand side by side, slots run top → bottom
      axes = {eU: {x: 0, y: 1}, eV: {x: 0.42, y: -0.3}, eZ: {x: 1, y: 0}};
      sd = 220;
      tabH = 100;
      bottomH = plate.h + 34;
      O = {x: M + 8, y: M + tabH + 24 - sd * axes.eV.y};
      su = D.h - M - bottomH - O.y - 6;
      mU = 22;
      unit = (su - 2 * mU) / U;
      tokR = clamp(Math.min(unit * 0.34, unit * 0.62 - discR - 4), 24, 54);
      post = tokR * 0.62;
      vPin = sd * 0.5;
      pinH = post + 2 * tokR;
      right = D.w - M - (RW ? RW + 26 : 0);
      // B's tokens leave a lane on the right for the rule connectors
      G = right - 74 - O.x - vPin * axes.eV.x - pinH;
    } else {
      axes = {eU: {x: 1, y: 0}, eV: {x: 0.44, y: 0.32}, eZ: {x: 0, y: -1}};
      sd = 250;
      tabW = clamp(D.w * 0.155, 250, 320);
      O = {x: M + tabW + 30, y: 0};
      const stackRight = D.w - M - RW - 36;
      su = stackRight - O.x - sd * axes.eV.x;
      mU = 30;
      unit = (su - 2 * mU) / U;
      tokR = clamp(Math.min(unit * 0.34, unit * 0.62 - discR - 4), 28, 60);
      post = tokR * 0.7;
      vPin = sd * 0.5;
      pinH = post + 2 * tokR;
      clearPosts();
      colWOf = F => unit * wOf(F);
      const cardH0 = fitCards(D.h * 0.34);
      const top = M + 76;
      O = {x: O.x, y: D.h - M - cardH0 - 20 - sd * axes.eV.y};
      G = O.y + vPin * axes.eV.y - pinH - top;
    }
    const P = axo(axes, O);
    // column centres and slots
    const colInfo = [];
    let acc = mU;
    cols.forEach(F => {
      const w = unit * wOf(F);
      const uC = acc + w / 2;
      const dd = unit * 0.62;
      const pair = F.kind !== 'shared';
      colInfo.push({F, uC, w, uA: pair ? uC - dd : uC, uB: pair ? uC + dd : uC, pair});
      acc += w;
    });
    const colW = qt ? unit : 0;
    // quarter turn: a card sits on its plumb line and must fit its row
    const cardBody = (F, w, rowSpace) => {
      if (!qt) return cardOnce(F, w, cardScale);
      let best = null;
      for (const k of [1, 0.9, 0.82, 0.74]) {
        best = cardOnce(F, w, k);
        if (best.h <= rowSpace - 10) break;
      }
      return best;
    };
    let cardH = 0;
    let plateAt;
    if (!qt) {
      cardH = Math.max(...cols.map(F => cardOnce(F, colWOf(F) - 12, cardScale).h));
      plateAt = tall ? {x: D.w - M - plateW, y: D.h - M - plate.h} : {x: D.w - M - RW, y: M + 6};
    } else {
      plateAt = {x: M, y: D.h - M - plate.h};
    }

    // --- planes, posts, pins
    const holes = [{u: 16, v: sd * 0.2}, {u: su - 16, v: sd * 0.2}];
    const band = {v0: vPin - 26, v1: vPin + 26};
    const planeA = stackPlane(ctx, {name: 'planeA', P, su, sd, z: 0, ink: I.a.ink, opacity: 0.94, holes, band});
    const planeB = stackPlane(ctx, {name: 'planeB', P, su, sd, z: G, ink: I.b.ink, opacity: 0.62, holes, band});
    const postLow = holes.map((q, k) => postRod(ctx, {name: `postL${k}`, a: P(q.u, q.v, -16), b: P(q.u, q.v, G)}));
    const postHigh = holes.map((q, k) => postRod(ctx, {name: `postH${k}`, a: P(q.u, q.v, G), b: P(q.u, q.v, G + 46)}));
    const footR = {rx: qt ? 9 : 18, ry: qt ? 16 : 7};
    const pinSpec = (F, which, ink) => ({eZ: axes.eZ, post, tokR, icon: which === 'A' || F.kind === 'shared' ? F.icon : F.iconB, ink: ink ? ink.ink : which === 'A' ? I.a.ink : I.b.ink, soft: ink ? ink.soft : which === 'A' ? I.a.soft : I.b.soft, footRx: footR.rx, footRy: footR.ry});
    const pinsA = [], pinsB = [], emptyA = [], emptyB = [];
    const emptySlot = (name, base) => {
      const c = {x: base.x + axes.eZ.x * (post + tokR), y: base.y + axes.eZ.y * (post + tokR)};
      return {name, c, node: g({name, opacity: 0},
        h('ellipse', {cx: r(base.x), cy: r(base.y), rx: r(footR.rx), ry: r(footR.ry), fill: th.inkSoft, opacity: 0.25}),
        h('circle', {cx: r(c.x), cy: r(c.y), r: r(tokR - 3), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '7 6'}))};
    };
    colInfo.forEach((c, i) => {
      const F = c.F;
      if (F.a) pinsA.push({f: F.i, i, ...stackPin(ctx, {name: `pinA${F.i}`, base: P(c.uA, vPin, 0), ...pinSpec(F, 'A')})});
      else emptyA.push({f: F.i, i, ...emptySlot(`emA${F.i}`, P(c.uA, vPin, 0))});
      if (F.b) pinsB.push({f: F.i, i, ...stackPin(ctx, {name: `pinB${F.i}`, base: P(c.uB, vPin, G), ...pinSpec(F, 'B')})});
      else emptyB.push({f: F.i, i, ...emptySlot(`emB${F.i}`, P(c.uB, vPin, G))});
    });
    // seated overlay: merged tokens (shared) and A's tokens seen through B
    const merged = colInfo.filter(c => c.F.kind === 'shared').map(c => ({f: c.F.i, ...stackPin(ctx, {name: `om${c.F.i}`, base: P(c.uC, vPin, 0), ...pinSpec(c.F, 'A', I.m)})}));
    const throughA = colInfo.filter(c => c.F.kind !== 'shared' && c.F.a).map(c => ({f: c.F.i, ...stackPin(ctx, {name: `ot${c.F.i}`, base: P(c.uA, vPin, 0), ...pinSpec(c.F, 'A')})}));
    // seated: "=" (shrunk a little) beside the merged token at its centre
    // height — right of it when the next slot leaves room, else left of it
    // (never onto the previous slot's "=" or token), else above-right, clear
    // of its head; "≠" / empty between the two slots
    const dr = discR * SEAT_EQ;
    const tokEdge = (cc, side) => (cc.pair ? (side > 0 ? cc.uA - tokR : cc.uB + tokR) : (side > 0 ? cc.uC - tokR : cc.uC + tokR));
    let prevRight = -Infinity;
    const seatU = colInfo.map((c, i) => {
      if (c.F.kind !== 'shared') {
        // "≠" / empty glyph between the two variants, shrunk to the gap
        const gapHalf = unit * 0.62 - tokR - 4;
        prevRight = c.pair ? c.uB + tokR : c.uC + tokR;
        return {du: 0, z: post + tokR, sc: clamp(gapHalf / discR, 0.45, 1)};
      }
      const nx = colInfo[i + 1];
      const nextLeft = nx ? tokEdge(nx, 1) : Infinity;
      const prevEdge = Math.max(prevRight, i > 0 ? tokEdge(colInfo[i - 1], -1) : -Infinity);
      // right of the merged token, else left of it; shrunk to the free gap;
      // above-right of its head only when neither side has room
      const roomR = nextLeft - (c.uC + tokR + 6), roomL = (c.uC - tokR - 6) - prevEdge;
      let q;
      const fitR = Math.min(dr, (roomR - 6) / 2), fitL = Math.min(dr, (roomL - 6) / 2);
      if (fitR >= discR * 0.45 && fitR >= fitL) q = {du: tokR + 4 + fitR, z: post + tokR, sc: fitR / discR};
      else if (fitL >= discR * 0.45) q = {du: -(tokR + 4 + fitL), z: post + tokR, sc: fitL / discR};
      else q = {du: tokR * 0.8, z: post + 2 * tokR + dr + 6, sc: SEAT_EQ};
      prevRight = Math.max(c.uC + tokR, q.du > 0 && q.z === post + tokR ? c.uC + q.du + q.sc * discR : -Infinity);
      return q;
    });
    const columns = colInfo.map((c, i) => {
      const F = c.F;
      const from = P(c.uB, vPin, G);
      const to = F.kind === 'shared' ? P(c.uC, vPin, pinH) : P(c.uB, vPin, 0);
      // the glyph disc sits on the plumb line just above where it lands on A
      const disc = P(c.uB, vPin, Math.min(pinH + discR + 14, (G + pinH) / 2));
      const seated = P(c.uC + seatU[i].du, vPin, seatU[i].z);
      return {F, i, c, disc, seated, seatScale: seatU[i].sc, from, to};
    });
    // seated glyphs never sit on a token (semantics)
    const seatedClear = columns.every(cl => {
      const rr = discR * cl.seatScale;
      const toks = (cl.c.pair ? [cl.c.uA, cl.c.uB] : [cl.c.uC]).map(u0 => P(u0, vPin, post + tokR));
      return toks.every(tq => Math.hypot(tq.x - cl.seated.x, tq.y - cl.seated.y) >= tokR + rr - 3);
    });
    const plumbs = columns.map(cl => ({cl, node: h('line', {name: `plumb${cl.F.i}`, x1: r(cl.from.x), y1: r(cl.from.y), x2: r(cl.from.x), y2: r(cl.from.y), stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '9 6', opacity: 0})}));
    const discs = columns.map(cl => relBadge(ctx, {name: `disc${cl.F.i}`, kind: glyphOf(cl.F.kind), x: 0, y: 0, rad: discR, color: cl.F.kind === 'shared' ? I.m.ink : th.ink, opacity: 0}));

    // --- readout cards: under each column (wide) or on its plumb line (tall / square)
    if (plate.titleFit) contentSizes.push(plate.titleFit.size);
    if (plate.textFit) contentSizes.push(plate.textFit.size);
    const cards = columns.map(cl => {
      const F = cl.F;
      let x, y, w, rowSpace = 0;
      if (qt) {
        const bNear = P(cl.c.uC, 0, G);
        x = P(cl.c.uC, vPin, pinH + 2 * discR + 18).x + 14;
        w = bNear.x - 14 - x;
        rowSpace = cl.c.w;
      } else {
        w = cl.c.w - 12;
        const front = P(cl.c.uC, sd, 0);
        x = front.x - w / 2;
        y = front.y + 20;
      }
      const body = cardBody(F, w, rowSpace);
      if (showKey) body.lines.forEach(l => contentSizes.push(l.fit.size));
      if (body.rib) contentSizes.push(body.rib.size);
      const hh = qt ? body.h : cardH;
      if (qt) y = P(cl.c.uC, vPin, 0).y - hh / 2;
      const cx = x + w / 2;
      const my = y + miniR + 12;
      let ty = noMini ? y + 10 : y + 2 * miniR + 24;
      const texts = [];
      if (showKey) {
        body.lines.forEach((l, k) => {
          texts.push(textBlock(l.fit, {x: cx, y: ty, anchor: 'middle', fill: l.who === 'B' ? shade(I.b.ink, -0.2) : l.who === 'A' ? shade(I.a.ink, -0.2) : th.ink, name: `rd${F.i}-t${k}`}));
          ty += l.fit.height + l.fit.size * 0.4;
        });
      }
      let rib = null;
      if (body.rib) {
        const rh = body.rib.height + 12;
        const ry = y + hh - rh - 8;
        rib = g({name: `st-${stateKey(F)}`, opacity: 0},
          h('path', {d: roundRectPath(x + 8, ry, w - 16, rh, 8), fill: '#fff4d6', stroke: th.ink, 'stroke-width': 1.8}),
          textBlock(body.rib, {x: cx, y: ry + 6, anchor: 'middle', fill: th.ink}));
      }
      const node = g({name: `card${F.i}`, opacity: 0},
        h('path', {d: roundRectPath(x + 4, y + 6, w, hh, 12), fill: th.shadow}),
        h('path', {d: roundRectPath(x, y, w, hh, 12), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
        noMini ? null : miniRow(ctx, I, F, cx, my, miniR), texts, rib);
      return {f: F.i, box: {x, y, w, h: hh}, mini: {x: cx, y: my}, node, state: body.rib ? stateKey(F) : null};
    });

    // --- tabs (layer names) + tethers to their sheets
    const tabNodes = [];
    const tabBoxes = {};
    const mkTab = (key, which, box) => {
      const ink = which === 'a' ? I.a.ink : I.b.ink;
      const br = Math.max(24, PX * 0.88);
      const textW = box.w - 2 * br - 44;
      const nameF = showKey ? ctx.fit(which === 'a' ? elementLabel(ctx, 'caseA') : elementLabel(ctx, 'caseB'), {maxWidth: textW, size: Math.max(PX * 1.15, Math.min(TX * 1.08, 32)), minSize: tall ? 19 : Math.max(19, PX), maxLines: tall ? 2 : 4, weight: 700}) : null;
      const note = which === 'a' ? p.cases.a.note : p.cases.b.note;
      const noteF = showAll && note ? ctx.fit(note, {maxWidth: textW, size: Math.max(PX * 0.95, TX * 0.8), minSize: Math.max(18, PX * 0.9), maxLines: 2, weight: 500}) : null;
      if (nameF) contentSizes.push(nameF.size);
      if (noteF) contentSizes.push(noteF.size);
      const inner = (nameF ? nameF.height : 22) + (noteF ? noteF.height + nameF.size * 0.32 : 0);
      const hh = Math.max(74, inner + 28);
      const y = box.align === 'bottom' ? box.y + box.h - hh : box.align === 'middle' ? box.y + (box.h - hh) / 2 : box.y;
      const b = {x: box.x, y, w: box.w, h: hh};
      const parts = [
        h('path', {d: roundRectPath(b.x + 4, b.y + 6, b.w, b.h, 12), fill: th.shadow}),
        h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 12), fill: '#f8f6ef', stroke: ink, 'stroke-width': 3}),
        h('circle', {cx: r(b.x + 14 + br), cy: r(b.y + b.h / 2), r: br, fill: ink, stroke: th.ink, 'stroke-width': 2}),
      ];
      if (showKey) parts.push(h('text', {x: r(b.x + 14 + br), y: r(b.y + b.h / 2 + br * 0.42), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(br * 1.15), 'font-weight': 800, fill: '#ffffff'}, which === 'a' ? 'A' : 'B'));
      if (nameF) {
        const ty = b.y + (b.h - inner) / 2;
        parts.push(textBlock(nameF, {x: b.x + 2 * br + 28, y: ty, fill: th.ink, name: `${key}-name`}));
        if (noteF) parts.push(textBlock(noteF, {x: b.x + 2 * br + 28, y: ty + nameF.height + nameF.size * 0.32, fill: th.inkSoft, name: `${key}-note`}));
      } else {
        parts.push(h('rect', {x: r(b.x + 2 * br + 28), y: r(b.y + b.h / 2 - 7), width: r(textW * 0.7), height: 14, rx: 7, fill: ink, opacity: 0.4}));
      }
      tabNodes.push(g({name: key, opacity: 0}, parts));
      tabBoxes[key] = b;
    };
    let tetherA, tetherB;
    if (qt || tall) {
      // (the magnifier rests in the band under the readouts, not in the tab row)
      const R0 = D.w - M;
      const tw = (R0 - M - 64) / 2;
      mkTab('tabA', 'a', {x: M, y: M, w: tw, h: tabH, align: 'bottom'});
      mkTab('tabB', 'b', {x: R0 - tw, y: M, w: tw, h: tabH, align: 'bottom'});
      tetherA = {from: {x: tabBoxes.tabA.x + 60, y: tabBoxes.tabA.y + tabBoxes.tabA.h}, at: z => (tall ? P(0, sd * 0.1, z) : P(0, sd * 0.2, z))};
      tetherB = {from: {x: tabBoxes.tabB.x + tabBoxes.tabB.w - 60, y: tabBoxes.tabB.y + tabBoxes.tabB.h}, at: z => (tall ? P(su, sd * 0.1, z) : P(0, sd * 0.8, z))};
    } else {
      const midA = P(0, sd / 2, 0), midB = P(0, sd / 2, G);
      mkTab('tabA', 'a', {x: M, y: midA.y - 75, w: tabW, h: 150, align: 'middle'});
      mkTab('tabB', 'b', {x: M, y: midB.y - 75, w: tabW, h: 150, align: 'middle'});
      // tabs never touch: B's tab moves up when the stack is shallow
      const over = tabBoxes.tabB.y + tabBoxes.tabB.h + 14 - tabBoxes.tabA.y;
      if (over > 0) {
        tabNodes.pop();
        mkTab('tabB', 'b', {x: M, y: midB.y - 75 - over, w: tabW, h: 150, align: 'middle'});
      }
      tetherA = {from: {x: M + tabW, y: tabBoxes.tabA.y + tabBoxes.tabA.h / 2}, at: z => P(0, sd / 2, z)};
      tetherB = {from: {x: M + tabW, y: tabBoxes.tabB.y + tabBoxes.tabB.h / 2}, at: z => P(0, sd / 2, z)};
    }

    // --- sockets on the rule plate (one per feature the rule names)
    const named = qt || tall ? columns.filter(cl => cl.F.relevant).sort((a, b) => b.i - a.i) : columns.filter(cl => cl.F.relevant);
    const sockets = named.map((cl, k) => {
      let s;
      if (qt || tall) s = {x: plateAt.x + plate.w - 48 - (named.length - 1 - k) * (2 * sockR + 24), y: plateAt.y};
      else s = {x: plateAt.x, y: plateAt.y + 18 + k * rowH + rowH / 2 - 7}; // farthest target on top
      return {cl, f: cl.F.i, ...s, rad: sockR};
    });
    const socketNodes = sockets.map(s => socketNode(ctx, {name: `sock${s.f}`, x: s.x, y: s.y, rad: s.rad, icon: s.cl.F.icon}));
    // landscape: the supplied state is captioned beside its socket on the plate
    // --- elements and their anchors (dz = how far B has come down, 0 = exploded)
    const colOf = key => {
      const f = key === 'similarity' ? R.relSim : key === 'difference' ? R.relDiff : null;
      return f === null ? null : columns.find(cl => cl.F.i === f) || null;
    };
    const bShift = dz => ({x: -axes.eZ.x * dz, y: -axes.eZ.y * dz});
    const tokTip = (cl, dz) => {
      // B's token tip (A's when B has none), a little beyond the token
      if (cl.F.b) {
        const q = P(cl.c.uB, vPin, G + pinH + 5);
        const s = bShift(dz);
        return {x: q.x + s.x, y: q.y + s.y};
      }
      return P(cl.c.uA, vPin, pinH + 5);
    };
    // provisional rest spot; the final one is chosen below with a collision
    // check against everything visible while the magnifier rests
    let lensRest;
    if (sq) lensRest = {x: M + lensR + 16, y: panel.y + panel.h / 2};
    else if (tall) lensRest = {x: M + lensR + 16, y: panel.y + panel.h / 2 + 10};
    else lensRest = {x: M + lensR + 12, y: D.h - M - lensR - 14};
    const elements = {
      caseA: {box: tabBoxes.tabA}, caseB: {box: tabBoxes.tabB},
      rule: {box: {x: plateAt.x, y: plateAt.y, w: plate.w, h: plate.h}},
      lens: {circle: {x: lensRest.x, y: lensRest.y, r: lensR}},
    };
    for (const key of ['similarity', 'difference']) {
      const cl = colOf(key);
      if (cl) elements[key] = {col: cl};
    }

    // --- supplied relationships (only those whose two ends exist); each is a
    // route re-evaluated per frame, so its ends stay on their elements while B moves
    const cen = (e, dz) => (e.col ? tokTip(e.col, dz) : e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
    const edge = (e, toward, dz) => {
      if (e.col) return tokTip(e.col, dz);
      const cc = cen(e, dz);
      if (e.circle) {
        const d = Math.hypot(toward.x - cc.x, toward.y - cc.y) || 1;
        return {x: cc.x + ((toward.x - cc.x) / d) * (e.circle.r + 6), y: cc.y + ((toward.y - cc.y) / d) * (e.circle.r + 6)};
      }
      const b = e.box;
      const dx = toward.x - cc.x, dy = toward.y - cc.y;
      const sx = dx ? (b.w / 2 + 6) / Math.abs(dx) : Infinity, sy = dy ? (b.h / 2 + 6) / Math.abs(dy) : Infinity;
      const sc = Math.min(sx, sy);
      return {x: cc.x + dx * sc, y: cc.y + dy * sc};
    };
    const conns = [];
    p.relationships.forEach((rel, k) => {
      const A = elements[rel.from], B = elements[rel.to];
      if (!A || !B || rel.from === rel.to) return;
      const pair = new Set([rel.from, rel.to]);
      let routeAt;
      if (pair.has('rule') && (pair.has('similarity') || pair.has('difference'))) {
        const key = pair.has('similarity') ? 'similarity' : 'difference';
        const cl = elements[key].col;
        const sk = sockets.find(s => s.f === cl.F.i);
        if (!sk) return;
        const ruleFirst = rel.from === 'rule';
        const order = sockets.indexOf(sk);
        routeAt = dz => {
          const tPt = tokTip(cl, dz);
          let rt;
          if (qt) {
            const sPt = {x: sk.x, y: sk.y - sk.rad - 3};
            const laneX = right - 74 + 22 + order * 14;
            const turnY = sk.y - sk.rad - 14 - (sockets.length - 1 - order) * 12;
            rt = {poly: [sPt, {x: sPt.x, y: turnY}, {x: laneX, y: turnY}, {x: laneX, y: tPt.y}, tPt]};
          } else if (tall) {
            // up a lane right of the stack, over the tokens, down onto the tip
            const sPt = {x: sk.x, y: sk.y - sk.rad - 3};
            const laneX = D.w - M - 70 + order * 32;
            const turnY = sk.y - sk.rad - 14 - (sockets.length - 1 - order) * 28;
            const yH = tPt.y - 30 - order * 50;
            rt = {poly: [sPt, {x: sPt.x, y: turnY}, {x: laneX, y: turnY}, {x: laneX, y: yH}, {x: tPt.x, y: yH}, tPt]};
          } else {
            // orthogonal lanes left of the plate: the upper socket (leftmost
            // target) takes the lane next to the plate and the higher run
            // above the tokens, so the two connectors never cross or pair up
            const sPt = {x: sk.x - sk.rad - 3, y: sk.y};
            const laneX = plateAt.x - 50 - order * 34;
            // (the runs stay at the exploded tokens' height: while B seats, only
            // the final drop onto its token grows)
            const yH = tokTip(cl, 0).y - 22 - (sockets.length - 1 - order) * 40;
            rt = {poly: [sPt, {x: laneX, y: sPt.y}, {x: laneX, y: yH}, {x: tPt.x, y: yH}, tPt]};
          }
          if (!ruleFirst) rt = rt.poly ? {poly: rt.poly.slice().reverse()} : {from: rt.to, c1: rt.c2, c2: rt.c1, to: rt.from};
          return rt;
        };
      } else {
        routeAt = dz => {
          if (pair.has('caseA') && pair.has('caseB')) {
            const a = tabBoxes.tabA, b = tabBoxes.tabB;
            const aPt = qt || tall ? {x: a.x + a.w + 4, y: a.y + a.h / 2} : {x: a.x + 40, y: a.y - 4};
            const bPt = qt || tall ? {x: b.x - 4, y: b.y + b.h / 2} : {x: b.x + 40, y: b.y + b.h + 4};
            const from = rel.from === 'caseA' ? aPt : bPt, to = rel.from === 'caseA' ? bPt : aPt;
            return {from, c1: {x: lerp(from.x, to.x, 0.33), y: lerp(from.y, to.y, 0.33)}, c2: {x: lerp(from.x, to.x, 0.67), y: lerp(from.y, to.y, 0.67)}, to};
          }
          const from = edge(A, cen(B, dz), dz), to = edge(B, cen(A, dz), dz);
          const dx = to.x - from.x, dy = to.y - from.y;
          return {from, c1: {x: from.x + dx * 0.3 - dy * 0.15, y: from.y + dy * 0.3 + dx * 0.15}, c2: {x: from.x + dx * 0.7 - dy * 0.15, y: from.y + dy * 0.7 + dx * 0.15}, to};
        };
      }
      const colr = kindColor(ctx, rel.kind);
      const color = colr === th.fgSoft ? th.ink : colr;
      const arrow = rel.kind !== 'relation';
      const dashed = rel.kind === 'communication';
      const r0 = routeAt(0);
      const node = g({name: `rel${k}`, opacity: 0},
        h('path', {name: `rel${k}-case`, d: dOf(r0), fill: 'none', stroke: th.paper, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.85, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1}),
        h('path', {name: `rel${k}-p`, d: dOf(r0), fill: 'none', stroke: color, 'stroke-width': rel.kind === 'causal' ? 5 : 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': dashed ? '0.02 0.018' : '1 1', 'stroke-dashoffset': dashed ? 0 : 1}),
        arrow ? h('path', {name: `rel${k}-ah`, d: 'M0 0L-16 -8L-16 8Z', fill: color, opacity: 0}) : null,
        arrow ? null : h('circle', {name: `rel${k}-dA`, r: 6, fill: color, opacity: 0}),
        arrow ? null : h('circle', {name: `rel${k}-dB`, r: 6, fill: color, opacity: 0}),
      );
      const ends = dz => {
        const rt = routeAt(dz);
        const pts = routePts(rt);
        const fromEl = rel.from, toEl = rel.to;
        return {pts, first: pts[0], last: pts[pts.length - 1], expect: {[fromEl]: expectPt(fromEl, dz, pts[0]), [toEl]: expectPt(toEl, dz, pts[pts.length - 1])}};
      };
      const expectPt = (id, dz, fallback) => {
        const e = elements[id];
        if (e && e.col) return tokTip(e.col, dz);
        if (id === 'rule' && (pair.has('similarity') || pair.has('difference'))) return fallback;
        return fallback;
      };
      conns.push({k, rel, node, routeAt, arrow, dashed, ends});
    });

    // --- the magnifier's rest spot: the first candidate (nearest the preferred
    // one) where neither the lens nor its handle touches a tab, a readout
    // card, the rule plate, either sheet (exploded or seated), a pin, a
    // tether or a connector (at both B heights)
    const restAngle = qt ? -35 : sq ? 12 : 32;
    let lensRestClear = false;
    const lensFoot = c => {
      const a = (restAngle * Math.PI) / 180;
      const out = [{x: c.x - lensR - 6, y: c.y - lensR - 6, w: 2 * lensR + 12, h: 2 * lensR + 12}];
      for (let d = lensR + 10; d <= lensR * 3.3; d += 16) out.push({x: c.x + Math.cos(a) * d - 14, y: c.y + Math.sin(a) * d - 14, w: 28, h: 28});
      return out;
    };
    {
      const planeBox = z => {
        const q = [P(0, 0, z), P(su, 0, z), P(su, sd, z), P(0, sd, z), P(0, 0, z + pinH + 8), P(su, 0, z + pinH + 8)];
        const xs = q.map(v => v.x), ys = q.map(v => v.y);
        return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
      };
      const obs = [
        ...Object.values(tabBoxes), ...cards.map(cd => cd.box),
        {x: plateAt.x, y: plateAt.y - sockR - 8, w: plate.w, h: plate.h + sockR + 8},
        planeBox(0), planeBox(G),
        ...segPolys([tetherA.from, tetherA.at(0)], 14), ...segPolys([tetherB.from, tetherB.at(0)], 14), ...segPolys([tetherB.from, tetherB.at(G)], 14),
        ...conns.filter(x => x.rel.from !== 'lens' && x.rel.to !== 'lens').flatMap(x => [0, G].flatMap(dz => segPolys(routePts(x.routeAt(dz)).filter((_, i2, arr) => i2 % 2 === 0 || i2 === arr.length - 1), 12))),
      ];
      const ok = c => {
        const foot = lensFoot(c);
        const bb = {x: Math.min(...foot.map(f => f.x)), y: Math.min(...foot.map(f => f.y)), x1: Math.max(...foot.map(f => f.x + f.w)), y1: Math.max(...foot.map(f => f.y + f.h))};
        if (bb.x < M * 0.5 || bb.y < M * 0.5 || bb.x1 > D.w - M * 0.5 || bb.y1 > D.h - M * 0.5) return false;
        return !foot.some(f => hitsAny(f, obs, 4));
      };
      const pref = lensRest;
      const cands = [];
      for (let y = M + lensR; y <= D.h - M - lensR; y += 16) for (let x = M + lensR; x <= D.w - M - lensR; x += 16) cands.push({x, y});
      cands.sort((a, b) => Math.hypot(a.x - pref.x, a.y - pref.y) - Math.hypot(b.x - pref.x, b.y - pref.y));
      const best = ok(pref) ? pref : cands.find(ok);
      if (best) lensRest = best;
      lensRestClear = ok(lensRest);
      elements.lens.circle = {x: lensRest.x, y: lensRest.y, r: lensR};
    }
    const lensBoxes = lensFoot(lensRest);

    // --- legend (kinds actually drawn) + issue / assumption: one block, placed
    // in the room sheet B vacates above the seated stack when it is free of
    // every connector, otherwise in the side column (wide) / band (tall)
    const kindsUsed = [...new Set(conns.map(x => x.rel.kind))];
    const legendItems = kindsUsed.map(kind => ({kind, text: `${kindCaption(ctx, kind)}${kind === 'relation' ? ` — ${t.noArrow}` : ''}`}));
    const legendNodes = [];
    const extras = [];
    const seatedTop = O.y + vPin * axes.eV.y - pinH - (tall ? 30 + 50 * Math.max(0, sockets.length - 1) : 0) - 26;
    const vacated = {x: O.x + 30, y: M + (tall ? tabH + 36 : 6), w: (landscape ? plateAt.x - 30 : O.x + su) - (O.x + 30), h: 0};
    vacated.h = seatedTop - vacated.y;
    // square: state tags just above the seated stack, over their own column
    const stateTags = [];
    if (sq && showKey) {
      const tagCols = columns.filter(cl => stateKey(cl.F));
      const laneL = D.w - M - 70;
      const tabBottom = Math.max(...Object.values(tabBoxes).map(b => b.y + b.h));
      const room = seatedTop - tabBottom - 12;
      const items = tagCols.map(cl => {
        // widest-first only when the natural width does not fit the room
        let f = null;
        for (const [mw, k] of [[clamp(cl.c.w * 1.4, 240, 400), 1], [520, 1], [520, 0.86], [640, 0.8]]) {
          f = ctx.fit(stateText(ctx, stateKey(cl.F)), {maxWidth: mw, size: Math.max(F16, PX * k), minSize: Math.max(F16, PX * 0.92 * k), maxLines: 4, weight: 700});
          if (f.height + 18 <= room) break;
        }
        const w = f.width + 28, hh = f.height + 18;
        const cx = P(cl.c.uC, vPin, 0).x;
        return {cl, f, w, hh, x: clamp(cx - w / 2, M, laneL - w), cx};
      });
      // keep neighbouring tags apart
      items.sort((a, b) => a.x - b.x);
      for (let k = 1; k < items.length; k++) {
        const prev = items[k - 1];
        if (items[k].x < prev.x + prev.w + 14) items[k].x = prev.x + prev.w + 14;
      }
      items.forEach(it => {
        const y = Math.max(tabBottom + 12, seatedTop - it.hh);
        const key = stateKey(it.cl.F);
        const px2 = clamp(it.cx, it.x + 18, it.x + it.w - 18);
        stateTags.push({key, box: {x: it.x, y, w: it.w, h: it.hh}, node: g({name: `st-${key}`, opacity: 0},
          h('path', {d: `M${r(px2 - 10)} ${r(y + it.hh - 1)}L${r(px2)} ${r(y + it.hh + 12)}L${r(px2 + 10)} ${r(y + it.hh - 1)}Z`, fill: '#fff4d6', stroke: th.ink, 'stroke-width': 1.8}),
          h('path', {d: roundRectPath(it.x, y, it.w, it.hh, 9), fill: '#fff4d6', stroke: th.ink, 'stroke-width': 1.8}),
          h('rect', {x: r(px2 - 8.5), y: r(y + it.hh - 3), width: 17, height: 4, fill: '#fff4d6'}),
          textBlock(it.f, {x: it.x + it.w / 2, y: y + 9, anchor: 'middle', fill: th.ink}))});
      });
    }
    const tagBoxes = stateTags.map(st => st.box);
    const fallback = landscape
      ? {x: plateAt.x, y: plateAt.y + plate.h + 30, w: RW, h: D.h - M - (plateAt.y + plate.h + 30)}
      : {x: lensRest.x + lensR * 3.5 + 12, y: panel.y, w: panel.x + panel.w - (sq ? 0 : 60) - (lensRest.x + lensR * 3.5 + 12), h: panel.h};
    const connPolys = conns.flatMap(x => segPolys(routePts(x.routeAt(G)).filter((_, i, arr) => i % 2 === 0 || i === arr.length - 1), 22));
    const tetherPolys = [...segPolys([tetherA.from, tetherA.at(0)], 16), ...segPolys([tetherB.from, tetherB.at(0)], 16)];
    const buildBlock = (area, big, keys, kz = 1) => {
      const mw = Math.min(area.w, big ? 760 : area.w);
      const parts = [];
      let bad = false;
      // issue / assumption (content: never cut, never below 16 px)
      const txt = [];
      if (showAll && p.issues.length && keys.includes('issue')) txt.push({key: 'issue', text: `${t.issue}: ${p.issues[0]}`});
      if (showAll && p.assumptions.length && keys.includes('assume')) txt.push({key: 'assume', text: p.assumptions.map(a2 => `${t.assumption}: ${a2}`).join(' · ')});
      const chipSizes = [];
      const chipParts = txt.map(it => {
        const copt = {maxWidth: mw, size: Math.max(F16, (it.key === 'issue' ? Math.max(PX * 1.05, TX * (big ? 1 : 0.8)) : Math.max(PX, TX * (big ? 0.84 : 0.7))) * kz), minSize: Math.max(F16, PX * 0.88 * kz), maxLines: 7};
        const probe = chip(ctx, it.text, {x: 0, y: 0, ...copt, weight: it.key === 'issue' ? 600 : 500});
        if (probe.fit && probe.fit.truncated) bad = true;
        if (probe.fit) chipSizes.push(probe.fit.size);
        return {key: it.key, text: it.text, copt, w: probe.box.w, h: probe.box.h};
      });
      // legend (a generic caption): never larger than the content around it
      if (showAll && legendItems.length && keys.includes('legend')) {
        const lw = Math.min(mw, 460);
        const cap = Math.min(...contentSizes, ...chipSizes);
        const lsz = Math.max(F16, Math.min(Math.max(PX * 0.95, TX * (big ? 0.82 : 0.74)) * kz, cap));
        const rows = legendItems.map((li, k) => ({li, f: ctx.fit(li.text, {maxWidth: lw - 104, size: lsz, minSize: Math.min(lsz, F16), maxLines: 3, weight: 600}), k}));
        if (rows.some(rw => rw.f.truncated)) bad = true;
        const rowHs = rows.map(rw => Math.max(34, rw.f.height + 12));
        const hh = 16 + rowHs.reduce((s2, v) => s2 + v, 0);
        const bw = Math.min(lw, Math.max(...rows.map(rw => rw.f.width)) + 112);
        parts.push({key: 'legend', w: bw, h: hh, rows, rowHs});
      }
      parts.push(...chipParts);
      const bw = parts.length ? Math.max(...parts.map(q => q.w)) : 0;
      const bh = parts.reduce((s2, q) => s2 + q.h, 0) + 10 * Math.max(0, parts.length - 1);
      return {parts, bw, bh, bad, chipSizes};
    };
    const placedBoxes = [];
    const tryArea = (area, big, scan, keys = ['legend', 'issue', 'assume'], kz = 1) => {
      if (area.w < 200 || area.h < 60) return null;
      const B0 = buildBlock(area, big, keys, kz);
      if (B0.bad) return null;
      if (!B0.parts.length) return {B0, at: {x: area.x, y: area.y}};
      const cands = scan ? [0.5, 0.3, 0.7, 0.15, 0.85, 0, 1] : [0];
      for (const fy of scan ? [0.4, 0.2, 0.6, 0, 0.8, 1] : [0]) {
        for (const fx of cands) {
          const box = {x: area.x + (area.w - B0.bw) * fx, y: area.y + (area.h - B0.bh) * fy, w: B0.bw, h: B0.bh};
          if (box.y < area.y - 1 || box.y + box.h > area.y + area.h + (scan ? 1 : 24) || box.x < area.x - 1) continue;
          if (hitsAny(box, [...lensBoxes, ...tagBoxes, ...placedBoxes], 6)) continue;
          if (!scan || !hitsAny(box, [...connPolys, ...tetherPolys], 8)) return {B0, at: box, center: scan};
        }
      }
      return null;
    };
    // one block where it fits; otherwise the legend and the issue/assumption
    // are placed separately (each in the first area with room)
    const blocks = [];
    const whole = tryArea(vacated, true, true) || tryArea(fallback, false, false);
    if (whole) blocks.push(whole);
    else {
      for (const keys of [['issue', 'assume'], ['legend']]) {
        const one = tryArea(vacated, true, true, keys) || tryArea(fallback, false, true, keys)
          || tryArea(fallback, false, true, keys, 0.86) || tryArea(fallback, false, true, keys, 0.76) || tryArea(fallback, false, false, keys, 0.76)
          || tryArea(vacated, true, true, keys, 0.8) || tryArea(fallback, false, true, keys, 0.6);
        if (one) { blocks.push(one); placedBoxes.push(one.at); contentSizes.push(...one.B0.chipSizes); }
      }
    }
    for (const placedBlock of blocks) {
      if (!placedBlock.B0.parts.length) continue;
      const {B0, at} = placedBlock;
      let y = at.y;
      for (const it of B0.parts) {
        const x = placedBlock.center ? at.x + (B0.bw - it.w) / 2 : at.x;
        if (it.key === 'legend') {
          const bx = x, by = y;
          let ly0 = by + 8;
          legendNodes.push(g({name: 'legend', opacity: 0},
            h('path', {d: roundRectPath(bx, by, it.w, it.h, 12), fill: th.card, stroke: th.paperLine, 'stroke-width': 2}),
            it.rows.map((rw, k) => {
              const style = rw.li.kind;
              const cc = kindColor(ctx, style);
              const col = cc === th.fgSoft ? th.ink : cc;
              const ly = ly0 + it.rowHs[k] / 2;
              ly0 += it.rowHs[k];
              return g(null,
                h('line', {x1: r(bx + 18), y1: r(ly), x2: r(bx + 74), y2: r(ly), stroke: col, 'stroke-width': style === 'causal' ? 5 : 3, 'stroke-dasharray': style === 'communication' ? '10 9' : undefined}),
                style === 'relation' ? [h('circle', {cx: r(bx + 18), cy: r(ly), r: 5, fill: col}), h('circle', {cx: r(bx + 74), cy: r(ly), r: 5, fill: col})] : h('path', {d: `M${r(bx + 80)} ${r(ly)}l-13 -7v14Z`, fill: col}),
                textBlock(rw.f, {x: bx + 94, y: ly - rw.f.height / 2, fill: th.ink}));
            })));
        } else {
          const c = chip(ctx, it.text, {x, y, ...it.copt, fill: it.key === 'issue' ? th.card : th.paper, stroke: it.key === 'issue' ? th.inkSoft : 'none', color: it.key === 'issue' ? th.ink : th.inkSoft, name: it.key, weight: it.key === 'issue' ? 600 : 500});
          extras.push({key: it.key, c});
          if (c.fit) contentSizes.push(c.fit.size);
        }
        y += it.h + 10;
      }
    }

    // plate captions (landscape): after the hold block, so the generic
    // suffix is capped by every content size, the chips included
    const plateCaps = [];
    if (landscape && showKey) {
      sockets.forEach(s => {
        const key = stateKey(s.cl.F);
        if (!key) return;
        const x0 = s.x + s.rad + 16;
        const mw = plateAt.x + plate.w - 18 - x0;
        // the element's name is printed beside its socket from the start (like
        // the socket itself); the supplied state is added under it in the gather beat
        const cf = capFit(key, mw);
        const f1 = cf.f1;
        contentSizes.push(f1.size);
        const capB = Math.min(...contentSizes);
        const f2 = cf.f2.size > capB ? ctx.fit(cf.f2.full, {maxWidth: mw, size: capB, minSize: Math.min(capB, F16), maxLines: 1, weight: 600}) : cf.f2;
        const y0 = s.y - (f1.height + 12 + f2.height) / 2;
        plateCaps.push({key,
          label: g({name: `stl-${key}`, opacity: 0}, textBlock(f1, {x: x0, y: y0, fill: th.ink})),
          node: g({name: `stp-${key}`, opacity: 0}, textBlock(f2, {x: x0, y: y0 + f1.height + 12, fill: th.inkSoft}))});
      });
    }

    // --- the real enlarged copy (for the magnifier and the detail window)
    const copy = [
      stackPlane(ctx, {P, su, sd, z: 0, ink: I.a.ink, opacity: 0.94, holes, band}),
      pinsA.map(pp => stackPin(ctx, {base: pp.base, ...pinSpec(R.features[pp.f], 'A')}).node),
      emptyA.map(e => g(null, h('circle', {cx: r(e.c.x), cy: r(e.c.y), r: r(tokR - 3), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '7 6'}))),
      columns.map(cl => h('line', {x1: r(cl.from.x), y1: r(cl.from.y), x2: r(cl.to.x), y2: r(cl.to.y), stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '9 6'})),
      stackPlane(ctx, {P, su, sd, z: G, ink: I.b.ink, opacity: 0.62, holes, band}),
      pinsB.map(pp => stackPin(ctx, {base: pp.base, ...pinSpec(R.features[pp.f], 'B')}).node),
      emptyB.map(e => g(null, h('circle', {cx: r(e.c.x), cy: r(e.c.y), r: r(tokR - 3), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '7 6'}))),
      columns.map(cl => relBadge(ctx, {kind: glyphOf(cl.F.kind), x: cl.disc.x, y: cl.disc.y, rad: discR, color: cl.F.kind === 'shared' ? I.m.ink : th.ink})),
    ];
    const mag = magnifier(ctx, {prefix: 'mag', R: lensR, handle: lensR * 2.3, content: g(null, h('rect', {x: -3000, y: -3000, width: 9000, height: 9000, fill: '#f1ead9'}), copy), zoom: ZOOM});
    // focus: the slot's tokens and where B's plumb line lands (never a readout text)
    const focusId = p.focusElement;
    let focus = null;
    const cardBoxes = cards.map(cd => cd.box);
    if (focusId === 'similarity' || focusId === 'difference') {
      const cl = colOf(focusId);
      if (cl) {
        const pts = cl.F.kind === 'shared'
          ? [P(cl.c.uC - tokR, vPin, post + tokR), P(cl.c.uC + tokR, vPin, post + tokR), P(cl.c.uC, vPin, 0), {x: cl.disc.x, y: cl.disc.y - discR - 6}]
          : [P(cl.c.uA - tokR, vPin, post + tokR), P(cl.c.uA, vPin, 0), P(cl.c.uA, vPin, pinH), P(cl.c.uB + discR + 4, vPin, 0), {x: cl.disc.x, y: cl.disc.y - discR - 6}];
        const pad = 14;
        const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
        let src = {x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad};
        // keep the source off the readout texts
        for (const cb of cardBoxes) {
          if (!qt && src.y + src.h > cb.y - 6 && src.x < cb.x + cb.w && src.x + src.w > cb.x) src = {...src, h: Math.max(40, cb.y - 6 - src.y)};
        }
        focus = {src, anchor: {x: src.x + src.w / 2, y: src.y + src.h / 2}};
      }
    } else if (focusId === 'caseA' || focusId === 'caseB') {
      const pins = focusId === 'caseA' ? pinsA : pinsB;
      if (pins.length) focus = {src: {x: pins[0].token.x - tokR - 16, y: pins[0].token.y - tokR - 16, w: 2 * tokR + 32, h: 2 * tokR + 32}, anchor: pins[0].token};
    } else if (focusId === 'rule' && sockets.length) {
      focus = {src: {x: sockets[0].x - sockR - 14, y: sockets[0].y - sockR - 14, w: 2 * sockR + 28, h: 2 * sockR + 28}, anchor: {x: sockets[0].x, y: sockets[0].y}};
    }
    // the detail window beside the stack: for a similarity / difference it is
    // a PAIR of real enlarged copies — case A's token (on sheet A) and case
    // B's token (on the exploded sheet B) side by side with the slot's glyph
    // between them, so the inset reads "A = B" / "A ≠ B"; otherwise one copy
    const wins = [];
    let winGlyph = null, winK = 0;
    const bg = h('rect', {x: -3000, y: -3000, width: 9000, height: 9000, fill: '#f1ead9'});
    const textBoxes = [...cards.map(cd => cd.box), ...Object.values(tabBoxes), {x: plateAt.x, y: plateAt.y, w: plate.w, h: plate.h}];
    if (focus) {
      let room;
      if (landscape) room = {x: plateAt.x, y: plateAt.y + plate.h + 26, w: RW, h: D.h - M - 6 - (plateAt.y + plate.h + 26)};
      // tall / square: the whole band under the readouts — the magnifier is
      // over the focus slot while the window is open (it returns only after
      // the window has closed)
      else room = {x: panel.x + 6, y: panel.y + 6, w: panel.w - 12, h: panel.h - 12};
      const clF = (focusId === 'similarity' || focusId === 'difference') ? colOf(focusId) : null;
      if (clF) {
        const tokAt = (u0, z0) => {
          const base = P(u0, vPin, z0);
          return {x: base.x + axes.eZ.x * (post + tokR), y: base.y + axes.eZ.y * (post + tokR)};
        };
        const cA = tokAt(clF.F.kind === 'shared' ? clF.c.uC : clF.c.uA, 0);
        const cB = tokAt(clF.F.kind === 'shared' ? clF.c.uC : clF.c.uB, G);
        const S = 2 * tokR + 36;
        const srcOf = c => ({x: c.x - S / 2, y: c.y - S / 2, w: S, h: S});
        const gapMid = Math.max(70, Math.min(room.w, room.h) * 0.26);
        const d = Math.min((room.w - gapMid) / 2, room.h, S * 2.6);
        const k = d / S;
        if (k > 1.15) {
          const y0 = room.y + (room.h - d) / 2;
          const x0 = room.x + (room.w - (2 * d + gapMid)) / 2;
          // each copy holds ONLY its own sheet and its own token (no other
          // pin, badge, plumb line or the magnifier can leak into it)
          const ownCopy = key => {
            const F = clF.F;
            const pin = key === 'A' ? pinsA.find(pp => pp.f === F.i) : pinsB.find(pp => pp.f === F.i);
            const em = key === 'A' ? emptyA.find(e => e.f === F.i) : emptyB.find(e => e.f === F.i);
            const parts = [stackPlane(ctx, {P, su, sd, z: key === 'A' ? 0 : G, ink: key === 'A' ? I.a.ink : I.b.ink, opacity: key === 'A' ? 0.94 : 0.62, holes, band})];
            if (pin) parts.push(stackPin(ctx, {base: pin.base, ...pinSpec(F, key)}).node);
            else if (em) parts.push(h('circle', {cx: r(em.c.x), cy: r(em.c.y), r: r(tokR - 3), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '7 6'}));
            return {node: g(null, bg, parts), holds: [pin ? `pin${key}${F.i}` : em ? `em${key}${F.i}` : null].filter(Boolean)};
          };
          [['A', cA, x0, I.a.ink], ['B', cB, x0 + d + gapMid, I.b.ink]].forEach(([key, c, dx, ink]) => {
            const oc = ownCopy(key);
            const w1 = detailLens(ctx, {name: `win${key}`, source: srcOf(c), dest: {x: dx, y: y0, w: d, h: d}, content: oc.node, color: ink, radius: 16});
            wins.push({key, w: w1, src: srcOf(c), dest: {x: dx, y: y0, w: d, h: d}, c, holds: oc.holds});
          });
          const gr = Math.min(gapMid * 0.36, 30);
          winGlyph = g({name: 'winGlyph', opacity: 0}, relBadge(ctx, {kind: glyphOf(clF.F.kind), x: x0 + d + gapMid / 2, y: y0 + d / 2, rad: gr, color: clF.F.kind === 'shared' ? I.m.ink : th.ink}));
          winK = k;
        }
      } else {
        const k = Math.min(room.w / focus.src.w, room.h / focus.src.h, 2.6);
        const dw = focus.src.w * k, dh = focus.src.h * k;
        const dest = {x: room.x + (room.w - dw) / 2, y: room.y + (room.h - dh) / 2, w: dw, h: dh};
        if (k > 1.15) {
          wins.push({key: 'F', w: detailLens(ctx, {name: 'win', source: focus.src, dest, content: g(null, bg, copy), color: th.accent3, radius: 18}), src: focus.src, dest});
          winK = k;
        }
      }
    }
    // the dashed leaders of a window are drawn only where they cross no card,
    // tab or plate text (else the coloured outlines alone tie source and copy)
    const segBox = (a, b, box) => {
      let t0 = 0, t1 = 1;
      const dx = b.x - a.x, dy = b.y - a.y;
      for (const [pp, qq] of [[-dx, a.x - box.x], [dx, box.x + box.w - a.x], [-dy, a.y - box.y], [dy, box.y + box.h - a.y]]) {
        if (pp === 0) { if (qq < 0) return false; continue; }
        const tt = qq / pp;
        if (pp < 0) { if (tt > t1) return false; if (tt > t0) t0 = tt; } else { if (tt < t0) return false; if (tt < t1) t1 = tt; }
      }
      return t0 < t1;
    };
    const tokenBoxes = [...pinsA, ...pinsB].map(pp => ({x: pp.token.x - tokR, y: pp.token.y - tokR, w: 2 * tokR, h: 2 * tokR, token: pp.token}));
    wins.forEach(wn => {
      const N = wn.key === 'F' ? 'win' : `win${wn.key}`;
      const others = tokenBoxes.filter(tb => !wn.c || Math.hypot(tb.token.x - wn.c.x, tb.token.y - wn.c.y) > 2);
      wn.name = N;
      wn.cones = true;
      for (const pp of [0.35, 0.7, 1]) {
        const fr = wn.w.frame(pp, 0);
        for (const cn of ['coneA', 'coneB']) {
          const ln = fr[`${N}-${cn}`];
          const a = {x: ln.x1, y: ln.y1}, b = {x: ln.x2, y: ln.y2};
          if ([...textBoxes, ...others].some(bx => bx && segBox(a, b, {x: bx.x + 2, y: bx.y + 2, w: bx.w - 4, h: bx.h - 4}))) wn.cones = false;
        }
      }
    });

    // --- tracer route through the traversal order (exploded state)
    const isCol = k => k === 'similarity' || k === 'difference';
    const anchorOf = (id, other) => {
      const e = elements[id];
      if (!e) return null;
      if ((id === 'caseA' || id === 'caseB') && isCol(other) && elements[other]) {
        const cl = elements[other].col;
        return id === 'caseB' ? cl.from : P(cl.F.a ? cl.c.uA : cl.c.uB, vPin, cl.F.a ? pinH : 0);
      }
      if (id === 'rule' && isCol(other) && elements[other]) {
        const sk = sockets.find(s => s.f === elements[other].col.F.i);
        if (sk) return {x: sk.x, y: sk.y};
      }
      if (e.col) return tokTip(e.col, 0);
      if (e.circle) return {x: e.circle.x, y: e.circle.y};
      return {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2};
    };
    const order = p.traversalOrder.filter(id => elements[id]);
    const pts = [];
    const visits = [];
    const push = q => { if (q) pts.push({x: q.x, y: q.y}); };
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const prev = order[i - 1], next = order[i + 1];
      if (i > 0) {
        const link = conns.find(xx => (xx.rel.from === prev && xx.rel.to === id) || (xx.rel.from === id && xx.rel.to === prev));
        if (link) {
          const fwd = link.rel.from === prev;
          const lp = routePts(link.routeAt(0));
          (fwd ? lp : lp.slice().reverse()).forEach(push);
        }
        push(anchorOf(id, prev));
      } else push(anchorOf(id, next));
      visits.push({id, idx: pts.length - 1});
      if (next) {
        const out = anchorOf(id, next);
        const inn = pts[pts.length - 1];
        if (out && (Math.abs(out.x - inn.x) > 1 || Math.abs(out.y - inn.y) > 1)) push(out);
      }
    }
    // the tracer never runs across a readout card's text: a straight hop that
    // would cross a card detours along the card's edge instead
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const hit = cards.find(cd => segCrossesBox(a, b, cd.box));
      if (hit && Math.hypot(b.x - a.x, b.y - a.y) > 4) {
        const yTop = hit.box.y - 12;
        pts.splice(i, 0, {x: a.x, y: yTop}, {x: b.x, y: yTop});
        visits.forEach(v => { if (v.idx >= i) v.idx += 2; });
        i += 2;
      }
    }
    const poly = pts.length >= 2 ? polyline(pts) : null;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / total}));
    const stateNames = [...cards.filter(cd => cd.state).map(cd => `st-${cd.state}`), ...stateTags.map(st => `st-${st.key}`), ...plateCaps.map(pc => `stp-${pc.key}`)];
    const tethers = g(null,
      h('line', {name: 'tetherA', stroke: I.a.ink, 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: 0}),
      h('line', {name: 'tetherB', stroke: I.b.ink, 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: 0}));

    return {R, I, cols, columns, plumbs, discs, cards, planeA, planeB, postLow, postHigh, pinsA, pinsB, emptyA, emptyB, merged, throughA, P, G, O, su, axes, tabNodes, tabBoxes, plate, plateAt, sockets, socketNodes, plateCaps,
      tokR, lensRestClear, seatedClear, restAngle, stateTags, elements, conns, legendNodes, extras, mag, wins, winGlyph, winK, textBoxes, segBox, lensRest, lensR, focus, poly, visitT, order, discR, qt, stateNames, tethers, tetherA, tetherB, tokTip, colOf, colW};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.tethers,
      L.planeA,
      L.postLow,
      L.pinsA.map(pp => pp.node),
      L.emptyA.map(e => e.node),
      L.plumbs.map(pl => pl.node),
      g({name: 'layerB'}, L.planeB, L.pinsB.map(pp => pp.node), L.emptyB.map(e => e.node)),
      g({name: 'postsHigh'}, L.postHigh),
      g({name: 'seatedOverlay', opacity: 0}, L.throughA.map(x => x.node), L.merged.map(x => x.node)),
      L.discs,
      L.cards.map(cd => cd.node),
      L.tabNodes,
      L.conns.map(x => x.node),
      g({transform: T(L.plateAt.x, L.plateAt.y)}, L.plate.node),
      L.socketNodes,
      L.plateCaps.map(pc => [pc.label, pc.node]),
      L.stateTags.map(st => st.node),
      L.legendNodes,
      L.extras.map(e => g({name: `${e.key}-wrap`, opacity: 0}, e.c.node)),
      L.mag.node,
      L.wins.map(wn => wn.w.node),
      L.winGlyph,
      g({name: 'tracer', opacity: 0},
        h('circle', {r: 26, fill: th.accent3, opacity: 0.28}),
        h('circle', {r: 13, fill: th.accent3, stroke: th.ink, 'stroke-width': 2.5}),
        h('circle', {r: 4.5, fill: '#ffffff'})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const nodes = {};
    const {axes} = L;

    // --- separate: B rises along the posts; gather: it slides back down and seats
    const rise = ease.inOutCubic(seg(u, ...W.rise));
    const seat = ease.inOutCubic(seg(u, ...W.seat));
    const dz = (1 - rise + seat) * L.G; // how far B is below its exploded height
    const off = {x: -axes.eZ.x * dz, y: -axes.eZ.y * dz};
    nodes.layerB = {transform: T(off.x, off.y)};
    nodes.postsHigh = {transform: T(off.x, off.y)};
    nodes.tabA = {opacity: r(seg(u, ...W.tabs), 3)};
    nodes.tabB = {opacity: r(seg(u, ...W.tabB), 3)};
    const tA = L.tetherA.at(0), tB = L.tetherB.at(L.G - dz);
    nodes.tetherA = {x1: r(L.tetherA.from.x), y1: r(L.tetherA.from.y), x2: r(tA.x), y2: r(tA.y), opacity: r(seg(u, ...W.tabs), 3)};
    nodes.tetherB = {x1: r(L.tetherB.from.x), y1: r(L.tetherB.from.y), x2: r(tB.x), y2: r(tB.y), opacity: r(seg(u, ...W.tabB), 3)};
    const nCols = L.columns.length;
    const pinP = [];
    L.columns.forEach((cl, k) => {
      const s0 = W.pins[0] + (k / Math.max(1, nCols)) * (W.pins[1] - W.pins[0] - 0.04);
      const q = seg(u, s0, s0 + 0.04);
      const sc = reduced ? (q > 0 ? 1 : 0) : ease.outBack(q);
      pinP.push(r(q, 3));
      for (const [pins, key] of [[L.pinsA, 'pinA'], [L.pinsB, 'pinB']]) {
        const pp = pins.find(x => x.f === cl.F.i);
        if (!pp) continue;
        nodes[`${key}${cl.F.i}`] = {opacity: q > 0 ? 1 : 0, transform: scaleAbout(pp.base.x, pp.base.y, Math.max(0.001, sc))};
      }
      for (const [em, key] of [[L.emptyA, 'emA'], [L.emptyB, 'emB']]) {
        if (em.find(x => x.f === cl.F.i)) nodes[`${key}${cl.F.i}`] = {opacity: r(q, 3)};
      }
    });

    // --- relate: plumb lines column by column, glyph disc + readout on landing
    const plumbP = [];
    const discP = [];
    const seated = ease.inOutCubic(seg(u, ...W.seated));
    L.plumbs.forEach((pl, k) => {
      const span = (W.plumb[1] - W.plumb[0]) / nCols;
      const q = ease.inOutQuad(seg(u, W.plumb[0] + k * span, W.plumb[0] + (k + 0.8) * span));
      plumbP.push(r(q, 3));
      const cl = pl.cl;
      nodes[`plumb${cl.F.i}`] = {opacity: q > 0 && seat < 0.35 ? r(1 - seat / 0.35, 3) : 0, x1: r(cl.from.x), y1: r(cl.from.y), x2: r(lerp(cl.from.x, cl.to.x, q)), y2: r(lerp(cl.from.y, cl.to.y, q))};
      const land = seg(u, W.plumb[0] + (k + 0.8) * span, W.plumb[0] + (k + 1) * span);
      discP.push(r(land, 3));
      const sc = (reduced ? 1 : 0.6 + 0.4 * ease.outBack(land)) * lerp(1, pl.cl.seatScale, seat);
      // the disc rides down with B, then settles on the seated slot
      const dq = cl.disc;
      const onPlumb = {x: dq.x + off.x * 0.5, y: dq.y + off.y * 0.5};
      const pos = seat > 0 ? {x: lerp(dq.x, cl.seated.x, seat), y: lerp(dq.y, cl.seated.y, seat)} : onPlumb;
      nodes[`disc${cl.F.i}`] = {opacity: r(land, 3), transform: T(pos.x, pos.y, 0, sc)};
      nodes[`card${cl.F.i}`] = {opacity: r(land, 3)};
    });
    nodes.seatedOverlay = {opacity: r(seated, 3)};
    const relP = [];
    const nRel = Math.max(1, L.conns.length);
    const linkEnds = [];
    L.conns.forEach((x, k) => {
      const span = (W.rels[1] - W.rels[0]) / nRel;
      const q = ease.inOutCubic(seg(u, W.rels[0] + k * span, W.rels[0] + (k + 0.9) * span));
      relP.push(r(q, 3));
      const rt = x.routeAt(dz);
      const d = dOf(rt);
      const pts = routePts(rt);
      const a = pts[0], z = pts[pts.length - 1], zb = pts[pts.length - 2];
      nodes[`rel${k}`] = {opacity: q > 0 ? 1 : 0};
      nodes[`rel${k}-case`] = {d, 'stroke-dashoffset': r(1 - q, 4)};
      nodes[`rel${k}-p`] = x.dashed ? {d, opacity: r(q, 3)} : {d, 'stroke-dashoffset': r(1 - q, 4)};
      if (x.arrow) {
        const ang = (Math.atan2(z.y - zb.y, z.x - zb.x) * 180) / Math.PI;
        nodes[`rel${k}-ah`] = {transform: T(z.x, z.y, ang), opacity: q >= 0.98 ? 1 : 0};
      } else {
        nodes[`rel${k}-dA`] = {cx: r(a.x), cy: r(a.y), opacity: q > 0 ? 1 : 0};
        nodes[`rel${k}-dB`] = {cx: r(z.x), cy: r(z.y), opacity: q >= 0.98 ? 1 : 0};
      }
      const e = x.ends(dz);
      linkEnds.push(Object.keys(e.expect).length === 2 && Math.hypot(e.expect[x.rel.from].x - a.x, e.expect[x.rel.from].y - a.y) <= 1 && Math.hypot(e.expect[x.rel.to].x - z.x, e.expect[x.rel.to].y - z.y) <= 1);
    });

    // --- connector legibility (semantics): closest approach of two rule
    // connectors, connectors passing through another feature's token or a
    // readout card
    const sampleP = pts => {
      const out = [];
      for (let i = 1; i < pts.length; i++) {
        const a0 = pts[i - 1], b0 = pts[i];
        const n = Math.max(1, Math.ceil(Math.hypot(b0.x - a0.x, b0.y - a0.y) / 6));
        for (let k2 = 1; k2 < n; k2++) out.push({x: a0.x + (b0.x - a0.x) * k2 / n, y: a0.y + (b0.y - a0.y) * k2 / n});
      }
      return out;
    };
    const ruleConns = L.conns.map(x => {
      const key = ['similarity', 'difference'].find(k2 => x.rel.from === k2 || x.rel.to === k2);
      if (!key || !(x.rel.from === 'rule' || x.rel.to === 'rule') || !L.elements[key]) return null;
      return {f: L.elements[key].col.F.i, pts: sampleP(routePts(x.routeAt(dz)))};
    }).filter(Boolean);
    let connMinGap = null;
    if (ruleConns.length === 2) {
      connMinGap = Infinity;
      for (const q of ruleConns[0].pts) for (const q2 of ruleConns[1].pts) connMinGap = Math.min(connMinGap, Math.hypot(q.x - q2.x, q.y - q2.y));
    }
    const tokensNow = [...L.pinsA.map(pp => ({f: pp.f, c: pp.token})), ...L.pinsB.map(pp => ({f: pp.f, c: {x: pp.token.x + off.x, y: pp.token.y + off.y}}))];
    let connPinHits = 0, connCardHits = 0;
    ruleConns.forEach(rc => {
      const ends = [rc.pts[0], rc.pts[rc.pts.length - 1]];
      if (tokensNow.some(tk => tk.f !== rc.f && rc.pts.some(q => Math.hypot(q.x - tk.c.x, q.y - tk.c.y) < L.tokR * 0.9))) connPinHits++;
      if (L.cards.some(cd => rc.pts.some(q => q.x > cd.box.x + 4 && q.x < cd.box.x + cd.box.w - 4 && q.y > cd.box.y + 4 && q.y < cd.box.y + cd.box.h - 4))) connCardHits++;
      void ends;
    });

    // --- trace: tracer along the traversal order; magnifier + detail window over the focus
    const tq = seg(u, ...W.trace);
    const tracerOn = Boolean(L.poly) && u >= W.trace[0] && u < W.trace[1] + 0.02;
    const tp = L.poly ? L.poly.at(ease.inOutSine(tq)) : {x: 0, y: 0};
    nodes.tracer = {opacity: tracerOn ? 1 : 0, transform: T(tp.x, tp.y)};
    const visited = L.visitT.filter(v => tq > 0 && ease.inOutSine(tq) >= v.t - 1e-6).map(v => v.id);
    const fv = L.visitT.find(v => v.id === p.focusElement);
    const tFocus = fv ? W.trace[0] + (W.trace[1] - W.trace[0]) * invSine(fv.t) : null;
    let lensC = L.lensRest;
    let lensOver = null;
    let lensLift = 0;
    let lensK = 0;
    let winP = 0;
    if (L.focus && tFocus !== null) {
      const goW = [Math.max(W.trace[0] - 0.02, tFocus - W.lensGo), tFocus];
      const go = ease.inOutCubic(seg(u, ...goW));
      const back = ease.inOutCubic(seg(u, ...W.lensBack));
      lensK = go * (1 - back);
      lensC = {x: lerp(L.lensRest.x, L.focus.anchor.x, lensK), y: lerp(L.lensRest.y, L.focus.anchor.y, lensK)};
      lensLift = u < W.lensBack[0] ? Math.sin(Math.PI * seg(u, ...goW)) : Math.sin(Math.PI * back);
      if (lensK >= 0.999) lensOver = p.focusElement;
      winP = ease.inOutCubic(seg(u, tFocus, tFocus + W.win)) * (1 - ease.inOutCubic(seg(u, ...W.winClose)));
    }
    const restAngle = L.restAngle;
    Object.assign(nodes, L.mag.frame(lensC, lerp(restAngle, -35, lensK), clamp(lensLift)));
    let leaderTextHits = 0;
    L.wins.forEach(wn => {
      Object.assign(nodes, wn.w.frame(winP, 0));
      if (!wn.cones) { nodes[`${wn.name}-coneA`].opacity = 0; nodes[`${wn.name}-coneB`].opacity = 0; }
      for (const cn of ['coneA', 'coneB']) {
        const ln = nodes[`${wn.name}-${cn}`];
        if (!ln.opacity) continue;
        if (L.textBoxes.some(bx => L.segBox({x: ln.x1, y: ln.y1}, {x: ln.x2, y: ln.y2}, {x: bx.x + 2, y: bx.y + 2, w: bx.w - 4, h: bx.h - 4}))) leaderTextHits++;
      }
    });
    if (L.winGlyph) nodes.winGlyph = {opacity: r(clamp((winP - 0.6) / 0.4), 3)};

    // --- gather: states, legend, issue
    const stP = seg(u, ...W.states);
    L.stateNames.forEach(nm => { nodes[nm] = {opacity: r(stP, 3)}; });
    L.plateCaps.forEach(pc => { nodes[`stl-${pc.key}`] = {opacity: r(seg(u, ...W.tabs), 3)}; });
    if (L.legendNodes.length) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    L.extras.forEach(e => { nodes[`${e.key}-wrap`] = {opacity: r(seg(u, ...W.issue), 3)}; });

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      separated: r(rise * (1 - seat), 3),
      seat: r(seat, 3),
      seatedShown: r(seated, 3),
      pinsUp: pinP,
      plumbDrawn: plumbP,
      discsShown: discP,
      glyphs: L.columns.map(cl => glyphOf(cl.F.kind)),
      kinds: L.columns.map(cl => cl.F.kind),
      coincide: L.merged.map(m => m.f),
      sideBySide: L.columns.filter(cl => cl.F.kind === 'differs').map(cl => cl.F.i),
      relationsDrawn: relP,
      relationKinds: L.conns.map(x => x.rel.kind),
      relationPairs: L.conns.map(x => `${x.rel.from}>${x.rel.to}`),
      arrowheads: L.conns.map(x => x.arrow),
      linkEnds,
      tracer: P2(tp),
      tracerVisible: tracerOn,
      visited,
      visitOrder: L.visitT.map(v => v.id),
      focus: p.focusElement,
      lens: P2(lensC),
      lensOver,
      lensTravel: r(lensK, 3),
      lensWindow: tFocus === null || !L.focus ? null : [r(Math.max(W.trace[0] - 0.02, tFocus - W.lensGo), 3), r(W.lensBack[1], 3)],
      lensOffText: L.focus ? L.cards.every(cd => !(L.focus.src.x < cd.box.x + cd.box.w && L.focus.src.x + L.focus.src.w > cd.box.x && L.focus.src.y < cd.box.y + cd.box.h && L.focus.src.y + L.focus.src.h > cd.box.y)) : true,
      detailWindow: r(winP, 3),
      detailZoom: r(L.winK, 2),
      insetTokens: L.wins.map(wn => wn.key),
      insetContents: L.wins.map(wn => wn.holds || null),
      connMinGap: connMinGap === null ? null : r(connMinGap, 1),
      connPinHits,
      lensRestClear: L.lensRestClear,
      seatedClear: L.seatedClear,
      connCardHits,
      insetGlyph: Boolean(L.winGlyph),
      insetLeaderTextHits: leaderTextHits,
      states: r(stP, 3),
      statesShown: L.stateNames.length,
      finalState: p.finalState,
      relSim: L.R.relSim,
      relDiff: L.R.relDiff,
      layout: L.qt ? 'quarter-turn' : 'vertical',
    };
    return {nodes, semantic};
  },
};

/** Inverse of ease.inOutSine on [0,1]. */
function invSine(y) {
  return Math.acos(1 - 2 * clamp(y)) / Math.PI;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-02-mechanism',
    title: 'Case analogy — exploded registration stack',
    titleEs: 'Analogía de casos — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Analogía de casos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded axonometric view of the tracing overlay: case B’s sheet rises off case A’s along two registration posts, every supplied feature stands as a pin (shared features in the same slot, differing ones in a pair of slots), plumb lines test each slot (=, ≠ or only in one case), the rule plate relates only to the features it names, a tracer follows the supplied traversal order, a magnifier and a detail window enlarge the focus slot, and B seats back on A so shared tokens coincide — relations as supplied, no conclusion drawn.',
    tags: ['reasoning', 'analogy', 'cases', 'tracing paper', 'exploded view', 'registration', 'plumb line', 'mechanism', 'relation', 'tracer', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/analogia-de-casos.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js', 'src/frameworks/lens.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: ANALOGY_STRINGS,
  scene,
});
