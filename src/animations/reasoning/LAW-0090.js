/**
 * LAW-0090 — Distinción de casos · mechanism
 *
 * Storyboard (an exploded assembly drawing of the comparison; no hands):
 *  0.00–0.18 separate  The parts start assembled — the two case strips pressed
 *                      together at the seam (the story's pin board) — and are
 *                      pulled apart along dashed explosion axes: case A's strip
 *                      and case B's strip open a channel, the rule plate lifts
 *                      to the top, a stand-alone magnifier and an empty
 *                      specimen stand slide out to the free side. The strip
 *                      that records the distinguishing fact stands first; the
 *                      other strip shows an empty socket in that row.
 *  0.18–0.43 relate    Only the supplied relationships are drawn, one after
 *                      the other, each with its kind: the rule plate relates to
 *                      case A (plain relation: end dots, no arrow); case A and
 *                      case B are joined by one chain-link rung per shared fact
 *                      (relation) — the distinguishing row gets NO rung, only
 *                      a broken link (a state, not a relationship) once the
 *                      rungs are in; the empty socket is related to the
 *                      magnifier; the magnifier
 *                      leads to the stand (sequence arrow). Arrowheads only for
 *                      sequence / communication / supplied causal links.
 *  0.43–0.75 trace     A tracer follows the supplied traversal order along the
 *                      drawn links. The focus element enlarges while the tracer
 *                      is on it; once the tracer reaches the magnifier its glass
 *                      shows the gap row enlarged (token | broken link | empty
 *                      socket); on the sequence link a copy of the
 *                      distinguishing token rides with the tracer from the
 *                      glass to the stand, growing to the stand's size.
 *  0.75–1.00 gather    Everything stays visible: origin (the token on its
 *                      strip), transformation (the enlarged comparison) and
 *                      state (the fact on the stand, "as supplied"), the
 *                      "Absent in …" tag, a legend of the link kinds used, the
 *                      pending issue and the assumption footnote.
 *  Layouts: 16:9 strips on the left, magnifier → stand to their right;
 *  1:1 strips on the left, magnifier above the stand in a right column;
 *  9:16 strips on top, magnifier → stand in a band below.
 * Legal content: fictional facts, illustrative rule text as supplied,
 * jurisdiction unspecified; no rule is applied and no outcome is shown.
 * @module animations/reasoning/LAW-0090
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, oneOf, list, obj} from '../../schemas/fields.js';
import {chip, connector, textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {stateTag} from '../causation/kits/place.js';
import {
  reasoningFields, DC_STRINGS, resolveFacts, dcColors, factToken, slotRing, ruleCard, stickyNote, magnifierArt, rowComparison, pushPin, linkMark,
} from './kits/distincion-de-casos.js';

const ID = 'LAW-0090';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {apart: [0.02, 0.15], parts: [0.04, 0.16], axes: [0.02, 0.17], labels: [0.02, 0.12], relate: [0.19, 0.42], trace: [0.45, 0.73], tags: [0.77, 0.84], legend: [0.78, 0.86], issue: [0.82, 0.9]};
const IDS = ['rule', 'caseA', 'caseB', 'lens', 'fact'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const STRINGS = {
  en: {...DC_STRINGS.en, legend: 'Link kinds', lensLabel: 'Magnifier', factLabel: 'Distinguishing fact', ruleLabel: 'Rule · as supplied', asSupplied: 'State: as supplied'},
  es: {...DC_STRINGS.es, legend: 'Tipos de vínculo', lensLabel: 'Lupa', factLabel: 'Hecho diferenciador', ruleLabel: 'Regla · según lo aportado', asSupplied: 'Estado: según lo aportado'},
};

const sceneSchema = {
  ...reasoningFields,
  elements: list('Component labels; ids are fixed by the scene, labels are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 60),
  }, ['id', 'label']), 2, 5),
  relationships: list('Explicit relationships between components; kind sets the line style (plain relation = no arrow; causal only when supplied). caseA–caseB is drawn as one chain-link rung per shared fact', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Caption for this link (empty = the caption of its kind)', 60),
  }, ['from', 'to', 'kind']), 1, 6),
  focusElement: oneOf('Component enlarged while the tracer is on it', IDS),
  relationLabels: obj('Caption used for each relation kind (and in the legend)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {
  facts: [
    {text: 'Buyer signed the order form', icon: 'document', in: 'both'},
    {text: 'Goods delivered on day 3', icon: 'box', in: 'both'},
    {text: 'Seller sent a written warning', icon: 'letter', in: 'a'},
    {text: 'Price paid in cash', icon: 'coin', in: 'both'},
  ],
  rules: ['Rule R (illustrative), as stated in the earlier case'],
  issues: ['Does the warning matter for rule R?'],
  assumptions: ['Fictional facts; the other facts are treated as equal'],
  elements: [
    {id: 'rule', label: 'Rule · as supplied'},
    {id: 'caseA', label: 'Earlier case (fictional)'},
    {id: 'caseB', label: 'New case (fictional)'},
    {id: 'lens', label: 'Magnifier: row by row'},
    {id: 'fact', label: 'Distinguishing fact'},
  ],
  relationships: [
    {from: 'rule', to: 'caseA', kind: 'relation', label: 'stated on A’s facts'},
    {from: 'caseA', to: 'caseB', kind: 'relation', label: 'shared facts'},
    {from: 'caseB', to: 'lens', kind: 'relation', label: 'empty socket compared'},
    {from: 'lens', to: 'fact', kind: 'sequence', label: 'extracts'},
  ],
  focusElement: 'lens',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['rule', 'caseA', 'caseB', 'lens', 'fact'],
};

// handleDeg: direction of the magnifier's handle (it must point into free space in every layout)
const SHAPES = {
  landscape: {mode: 'right', factBelow: false, text: 26, label: 27, rule: 25, note: 24, rowMax: 175, chan: 270, qW: 190, RLmax: 170, textMax: 440, handleDeg: 132, standGap: 230},
  square: {mode: 'right', factBelow: true, text: 28, label: 28, rule: 26, note: 27, rowMax: 165, chan: 240, qW: 140, colW: 400, RLmax: 140, textMax: 330, handleDeg: 40},
  portrait: {mode: 'below', factBelow: false, text: 26, label: 27, rule: 25, note: 23, rowMax: 165, chan: 240, qW: 150, RLmax: 138, textMax: 390, handleDeg: 158, standGap: 210},
};

const SQ_GAP = 140; // square: vertical gap between the magnifier's rim and the stand
const hitBox = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
// obstacles are boxes or circles ({c: {x, y}, r}); a circle does not block the corners of its box
const hit = (a, b, pad = 0) => {
  if (!b.c) return hitBox(a, b, pad);
  const qx = clamp(b.c.x, a.x, a.x + a.w), qy = clamp(b.c.y, a.y, a.y + a.h);
  return Math.hypot(qx - b.c.x, qy - b.c.y) < b.r + pad;
};
const P2 = q => ({x: r(q.x), y: r(q.y)});

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1000], portrait: [900, 1440]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    const C = dcColors(ctx);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const right = SH.mode === 'right';
    const F = resolveFacts(p.facts);
    const n = F.n;
    const diff = F.diff;
    const Pside = F.side || 'a';
    const Qside = Pside === 'a' ? 'b' : 'a';
    const label = id => (p.elements.find(e => e.id === id) || {}).label ?? ({rule: t.ruleLabel, caseA: 'A', caseB: 'B', lens: t.lensLabel, fact: t.factLabel})[id];
    const M = 28;
    const k = diff >= 0 ? diff : Math.floor((n - 1) / 2);
    const legendH = showAll ? SH.note * 1.4 + 10 : 0;
    const footProbe = showAll && p.assumptions.length ? chip(ctx, `${t.assumption}: ${p.assumptions[0]}`, {x: 0, y: 0, maxWidth: right ? D.w * 0.45 : D.w - 2 * M, size: SH.note * 0.9, maxLines: 2, weight: 500}) : null;
    const bottomH = legendH + (footProbe ? footProbe.box.h + 10 : 0);

    // --- horizontal budget of the strip block: [texts | strip P | channel | strip Q | Q zone]
    const R0 = 44;
    const stripHalf = R => R + 18;
    const blockW = (R, textW) => textW + 22 + 2 * stripHalf(R) + SH.chan + SH.qW + 16;
    const rightColW = right ? (SH.factBelow ? clamp(D.w * 0.32, 340, SH.colW ?? 440) : clamp(D.w * 0.42, 560, 820)) : 0;
    const textW = Math.min(SH.textMax, (right ? D.w - 2 * M - rightColW - 30 : D.w - 2 * M) - blockW(R0, 0));

    // --- rule plate (top of the right column / top left in the tall layout)
    const issueW = right ? 0 : Math.min(300, D.w * 0.32);
    const plaqueW = right ? Math.min(560, rightColW) : Math.min(D.w - 2 * M - (showAll && p.issues.length ? issueW + 24 : 0), 620);
    const plaqueX = right ? D.w - M - plaqueW : M;
    const plaque = ruleCard(ctx, {prefix: 'rule', x: plaqueX, y: M, w: plaqueW, rules: p.rules, head: label('rule'), headScale: 0.92, size: SH.rule, maxLines: 3, headLines: 2});
    const plaqueBottom = plaque.box.y + plaque.box.h;
    // pending issue: beside the plaque (tall), in the top-left corner above the strips (square;
    // the strips start below it), or under the plaque in the right column (wide, placed later)
    const stripLeft0 = M + textW + 22;
    const issueTop = showAll && p.issues.length && (!right || SH.factBelow)
      ? stickyNote(ctx, right
        ? {name: 'issue', x: M, y: M + 6, w: Math.max(200, stripLeft0 + 22 - M), head: t.issue, text: p.issues[0], size: SH.note, headScale: 0.95, rot: -1.2, lines: 5}
        : {name: 'issue', x: D.w - M - issueW, y: M + 4, w: issueW, head: t.issue, text: p.issues[0], size: SH.note, headScale: 0.95, rot: -1.2})
      : null;

    // --- strips: vertical extent
    const headH = SH.label * 2.1;
    const ruleRel = p.relationships.find(rl => rl.from === 'rule' || rl.to === 'rule');
    const ruleCapH = showAll && ruleRel ? chip(ctx, ruleRel.label || p.relationLabels[ruleRel.kind] || ruleRel.kind, {x: 0, y: 0, maxWidth: 300, size: SH.note, maxLines: 2}).box.h : 0;
    const railsTop = right ? Math.max(M + 96, issueTop ? issueTop.box.y + issueTop.box.h + 22 : 0) : Math.max(plaqueBottom, issueTop ? issueTop.box.y + issueTop.box.h : 0) + Math.max(70, ruleCapH + 34);
    const RLg = SH.RLmax;
    // tall layout: the band under the strips holds the magnifier (handle pointing down-left) and
    // the stand with its specimen card; sized so neither reaches the footnote
    const specWp = 300;
    const specOpts = {x: 0, y: 0, w: !right ? specWp : SH.factBelow ? Math.min(rightColW - 20, 360) : 360, head: label('fact'), text: diff >= 0 ? F.rows[diff].text : t.noDiff, size: SH.note, state: diff < 0 ? null : t.asSupplied};
    let specProbe = specimenCard(ctx, specOpts);
    // square: the right column stacks plaque, magnifier, stand and card; when it would overflow, the
    // card keeps its heading and state only (the token on the stand and the strip text name the fact)
    let specCompact = false;
    if (right && SH.factBelow) {
      const RLs = Math.min(SH.RLmax, rightColW / 2 - 16);
      if (plaque.box.y + plaque.box.h + (showKey ? 100 : 20) + 2 * RLs + SQ_GAP + 2.28 * 73 + 30 + specProbe.box.h > D.h - M) {
        specCompact = diff >= 0;
        if (specCompact) specProbe = specimenCard(ctx, {...specOpts, compact: true});
      }
    }
    const handleDrop = RLg * 2.32 * Math.sin((180 - SH.handleDeg) * Math.PI / 180);
    // the magnifier's label rides above its rim (up to two lines)
    const lensLabH = showKey ? chip(ctx, label('lens'), {x: 0, y: 0, anchor: 'middle', maxWidth: Math.max(260, RLg * 2 + 60), size: SH.note, maxLines: 2}).box.h : 0;
    const lensHead = RLg * 0.1 + (showKey ? lensLabH + 22 : 8);
    const bandTop = 30 + lensHead;
    const bandH = right ? 0 : bandTop + RLg + Math.max(RLg + 12, handleDrop + 24, 73 * 1.28 + 30 + specProbe.box.h + 10);
    const railsBottomMax = D.h - M - bottomH - bandH - (right ? 10 : 0);
    const rowH = Math.min(SH.rowMax, (railsBottomMax - railsTop - headH - 20) / n);
    const R = clamp(rowH * 0.3, 28, 50);
    const left = right ? M : M + Math.max(0, (D.w - 2 * M - blockW(R, textW)) / 2);
    const xP = left + textW + 22 + stripHalf(R);
    const xQ = xP + SH.chan;
    const qZone = {x: xQ + stripHalf(R) + 16, w: SH.qW};
    const rowsTop = railsTop + headH + 10;
    const ys = F.rows.map((_, i) => rowsTop + rowH * (i + 0.5));
    const railBottomY = rowsTop + rowH * n + 10;
    const xOf = side => (side === Pside ? xP : xQ);

    // fact texts: shared facts once, beside strip P (right-aligned); facts only on strip Q beside it
    const texts = F.rows.map((row, i) => {
      const onP = row[Pside === 'a' ? 'inA' : 'inB'];
      const side = onP ? Pside : Qside;
      const zone = side === Pside ? {x: left, w: textW} : qZone;
      // as many lines as the row height allows (up to three), shrinking within a bound first
      const lines = clamp(Math.floor((rowH - 12) / (SH.text * 1.16)), 1, 3);
      const fit = ctx.fit(row.text, {maxWidth: zone.w, size: SH.text, minSize: SH.text * 0.74, maxLines: lines, weight: 500});
      const anchor = side === Pside ? 'end' : 'start';
      const x = side === Pside ? left + textW : qZone.x;
      return {i, side, fit, x, y: ys[i] - fit.height / 2, anchor, box: {x: anchor === 'end' ? x - fit.width : x, y: ys[i] - fit.height / 2, w: fit.width, h: fit.height}};
    });

    // --- magnifier + specimen stand
    const outR = R * 1.45;
    let lensC, standC, RL;
    if (right) {
      const x0 = qZone.x + qZone.w + 30;
      const avail = D.w - M - x0;
      if (SH.factBelow) {
        // the lens shrinks (within a bound) when plaque, label, stand and card leave less height
        const hRoom = D.h - M - 8 - specProbe.box.h - 2.28 * outR - SQ_GAP - 30 - (plaqueBottom + lensHead + 10);
        RL = Math.max(95, Math.min(SH.RLmax, avail / 2 - 16, hRoom / 2));
        lensC = {x: x0 + avail / 2, y: clamp(ys[k], plaqueBottom + RL + lensHead + 10, D.h - M - 8 - specProbe.box.h - 2.28 * outR - SQ_GAP - 30 - RL)};
        standC = {x: lensC.x, y: lensC.y + RL + SQ_GAP + outR};
      } else {
        RL = Math.min(SH.RLmax, (avail - 2 * outR - SH.standGap - 20) / 2 - 10);
        lensC = {x: x0 + RL + 10, y: clamp(ys[k], plaqueBottom + RL + lensHead + 10, D.h - M - bottomH - RL - 30)};
        standC = {x: lensC.x + RL + SH.standGap + outR, y: lensC.y};
      }
    } else {
      // stand (and its card) against the right margin; the magnifier to its left, handle down-left
      RL = RLg;
      standC = {x: D.w - M - Math.max(outR + 4, specWp / 2), y: railBottomY + bandTop + RL};
      lensC = {x: Math.max(M + RL + 10, standC.x - outR - (SH.standGap ?? 150) - RL), y: standC.y};
    }
    const lensBox = {x: lensC.x - RL, y: lensC.y - RL, w: 2 * RL, h: 2 * RL};
    const standBox = {x: standC.x - outR - 6, y: standC.y - outR - 6, w: 2 * outR + 12, h: 2 * outR + 28};

    // --- element boxes (connector anchors)
    const railBox = side => ({x: xOf(side) - stripHalf(R), y: railsTop, w: 2 * stripHalf(R), h: railBottomY - railsTop});
    const elements = {rule: plaque.box, caseA: railBox('a'), caseB: railBox('b'), lens: lensBox, fact: standBox};
    const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    const edge = (b, toward, pad = 6) => {
      const c = center(b);
      const dx = toward.x - c.x, dy = toward.y - c.y;
      if (!dx && !dy) return c;
      const s = Math.min((b.w / 2 + pad) / Math.abs(dx || 1e-9), (b.h / 2 + pad) / Math.abs(dy || 1e-9));
      return {x: c.x + dx * s, y: c.y + dy * s};
    };
    const circleEdge = (c, rad, toward) => {
      const a = Math.atan2(toward.y - c.y, toward.x - c.x);
      return {x: c.x + Math.cos(a) * rad, y: c.y + Math.sin(a) * rad};
    };
    const isRail = id => id === 'caseA' || id === 'caseB';
    const gutterX = Math.min(D.w - M - 8, qZone.x + qZone.w + 12);

    // --- connectors for the supplied relationships
    const rels = p.relationships.map((rel, idx) => {
      const pair = [rel.from, rel.to].sort().join('|');
      const color = kindColor(ctx, rel.kind);
      const text = rel.label || p.relationLabels[rel.kind] || rel.kind;
      if (pair === 'caseA|caseB') {
        // one chain-link rung per shared fact; the distinguishing row gets none
        const fromSide = rel.from === 'caseA' ? 'a' : 'b';
        const toSide = fromSide === 'a' ? 'b' : 'a';
        const rungs = F.rows.map((row, i) => (row.inA && row.inB ? i : -1)).filter(i => i >= 0).map((i, j) => {
          const xa = xOf(fromSide), xb = xOf(toSide);
          const dir = Math.sign(xb - xa);
          const c = connector(ctx, {name: `rel${idx}-r${j}`, from: {x: xa + dir * (R + 3), y: ys[i]}, to: {x: xb - dir * (R + 3), y: ys[i]}, kind: rel.kind, bend: 0, color});
          return {i, c, mid: {x: (xa + xb) / 2, y: ys[i]}};
        });
        return {rel, idx, kind: rel.kind, text, color, rungs, ends: rungs.map(x => ({from: x.c.from, to: x.c.to}))};
      }
      const anchorOf = (id, other) => {
        if (isRail(id) && (other === 'lens' || other === 'fact')) {
          // strips meet the magnifier at the gap row, through that row's cell (right edge); in
          // the tall layout the strip standing first meets it at its foot
          const sd = id === 'caseA' ? 'a' : 'b';
          const x = xOf(sd);
          if (!right && sd === Pside) return {x, y: railBottomY + 4};
          return {x: x + R + 4, y: ys[k]};
        }
        if (id === 'lens') return circleEdge(lensC, RL + 10, isRail(other) ? (right ? {x: lensC.x - 400, y: lensC.y} : {x: lensC.x + 300, y: lensC.y - 300}) : center(elements[other]));
        if (id === 'fact') return circleEdge(standC, outR + 10, center(elements[other]));
        if (isRail(id)) {
          if (other === 'rule') return {x: xOf(id === 'caseA' ? 'a' : 'b'), y: railsTop - 6};
          return edge(elements[id], center(elements[other]), 4);
        }
        if (id === 'rule' && isRail(other)) return right ? {x: plaque.box.x - 6, y: plaque.box.y + plaque.box.h * 0.55} : {x: plaque.box.x + plaque.box.w * 0.3, y: plaqueBottom + 6};
        return edge(elements[id], center(elements[other]), 6);
      };
      const from = anchorOf(rel.from, rel.to);
      const to = anchorOf(rel.to, rel.from);
      let c1, c2;
      const railLens = (isRail(rel.from) && rel.to === 'lens') || (isRail(rel.to) && rel.from === 'lens');
      if (railLens) {
        const a = isRail(rel.from) ? from : to, b = isRail(rel.from) ? to : from;
        // tall layout: out of the cell to the right, down the free gutter beside the strips
        // (never across the rows below), then in to the magnifier's upper right
        const atFoot = !right && Math.abs(a.y - (railBottomY + 4)) < 1;
        const cA = right ? {x: a.x + 90, y: a.y} : atFoot ? {x: a.x, y: a.y + 70} : {x: gutterX, y: a.y};
        const cB = right ? {x: b.x - 90, y: b.y} : atFoot ? {x: b.x - 50, y: b.y - 50} : {x: gutterX, y: b.y - 40};
        if (isRail(rel.from)) { c1 = cA; c2 = cB; } else { c1 = cB; c2 = cA; }
      } else if (pair === 'caseA|rule' || pair === 'caseB|rule') {
        // over the lane above the strip headers (wide), or straight down (tall)
        const r0 = rel.from === 'rule' ? from : to, s0 = rel.from === 'rule' ? to : from;
        const lane = right ? M + 40 : Math.min(r0.y, s0.y) + (Math.abs(s0.y - r0.y) * 0.5);
        const k1 = right ? {x: r0.x - 120, y: lane} : {x: r0.x, y: lane};
        const k2 = right ? {x: s0.x + 60, y: lane} : {x: s0.x, y: lane};
        if (rel.from === 'rule') { c1 = k1; c2 = k2; } else { c1 = k2; c2 = k1; }
      }
      const c = connector(ctx, {name: `rel${idx}`, from, to, kind: rel.kind, bend: 0.12, c1, c2, color});
      return {rel, idx, kind: rel.kind, text, color, c, ends: [{from: c.from, to: c.to}]};
    });

    // every connector must end on its own element
    const distBox = (q, b) => Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)));
    for (const x of rels) {
      if (x.rungs) x.landed = x.rungs.every(q => [q.c.from, q.c.to].every(e => ['a', 'b'].some(sd => Math.abs(Math.hypot(e.x - xOf(sd), e.y - ys[q.i]) - R) <= 6)));
      else x.landed = distBox(x.c.from, elements[x.rel.from]) <= 20 && distBox(x.c.to, elements[x.rel.to]) <= 20;
    }

    // --- strip headers (badge on the strip's tab; the label beside it, away from the channel)
    const headers = ['a', 'b'].map(side => {
      const x = xOf(side);
      const col = side === 'a' ? C.a : C.b;
      const text = label(side === 'a' ? 'caseA' : 'caseB');
      const outward = side === Pside ? -1 : 1;
      const fit = ctx.fit(text, {maxWidth: side === Pside ? textW : SH.qW + 50, size: SH.label, minSize: SH.label * 0.75, maxLines: side === Pside ? 2 : 3, weight: 700});
      const cy = railsTop + headH / 2;
      const lx = outward < 0 ? x - stripHalf(R) - 14 : x + stripHalf(R) + 14;
      const box = {x: outward < 0 ? lx - fit.width : lx, y: cy - fit.height / 2, w: fit.width, h: fit.height};
      return {side, x, col, fit, badge: SH.label * 0.72, outward, lx, cy, box: showKey ? box : null};
    });

    // --- lens view: enlarged comparison of the gap row
    const lensView = rowComparison(ctx, {prefix: 'lv', R: RL * 0.36, icon: diff >= 0 ? F.rows[diff].icon : null, present: diff >= 0 ? Pside : null, left: Pside});
    const lensArt = magnifierArt(ctx, {name: 'lens', R: RL, handleDeg: SH.handleDeg, handleLen: RL * 1.1, content: lensView});
    const handleBox = (() => {
      const a = SH.handleDeg * Math.PI / 180;
      const s0 = {x: lensC.x + Math.cos(a) * RL, y: lensC.y + Math.sin(a) * RL};
      const e = {x: lensC.x + Math.cos(a) * RL * 2.36, y: lensC.y + Math.sin(a) * RL * 2.36};
      return {x: Math.min(s0.x, e.x) - 20, y: Math.min(s0.y, e.y) - 20, w: Math.abs(e.x - s0.x) + 40, h: Math.abs(e.y - s0.y) + 40};
    })();

    // --- tags, specimen card, lens label, legend, notes
    const tags = [];
    if (showKey && diff >= 0) {
      const text = `${t.absentIn} ${Qside.toUpperCase()}`;
      const tq = stateTag(ctx, text, {x: 0, y: 0, size: SH.note, maxWidth: SH.qW + 70});
      // above the empty cell, or below it when the link to the magnifier leaves upward
      const up = right && lensC.y < ys[k] - 20;
      tags.push(stateTag(ctx, text, {x: qZone.x, y: up ? ys[k] + R + 2 : ys[k] - R - tq.box.h - 2, size: SH.note, maxWidth: SH.qW + 70, name: 'tag-absent', color: th.accent, opacity: 0}));
    }
    const diffRow = diff >= 0 ? F.rows[diff] : null;
    const specW = !right ? specWp : SH.factBelow ? Math.min(rightColW - 20, 360) : Math.min(360, D.w - M - (standC.x - 180));
    const specX = clamp(standC.x, M + specW / 2, D.w - M - specW / 2);
    const spec = specimenCard(ctx, {x: specX, stemX: standC.x, y: standC.y + outR * 1.28 + 30, w: specW, head: label('fact'), text: diffRow ? diffRow.text : t.noDiff, size: SH.note, state: diff < 0 ? null : t.asSupplied, compact: specCompact});
    const lensLabProbe = showKey ? chip(ctx, label('lens'), {x: 0, y: 0, anchor: 'middle', maxWidth: Math.max(260, RL * 2 + 60), size: SH.note, maxLines: 2}) : null;
    const lensLab = showKey ? chip(ctx, label('lens'), {x: lensC.x, y: lensC.y - RL * 1.1 - 12 - lensLabProbe.box.h, anchor: 'middle', maxWidth: Math.max(260, RL * 2 + 60), size: SH.note, maxLines: 2, name: 'lens-lab', fill: th.card}) : null;
    const usedKinds = [...new Set(rels.map(x => x.kind))];
    const legendY = D.h - M - SH.note * 1.2;
    const legend = showAll ? legendNode(ctx, {kinds: usedKinds, labels: p.relationLabels, size: SH.note * 0.9, x: left, y: legendY, title: t.legend}) : null;
    let foot = null;
    if (footProbe) {
      const text = `${t.assumption}: ${p.assumptions[0]}`;
      foot = chip(ctx, text, {x: left, y: legendY - 12 - footProbe.box.h, maxWidth: right ? D.w * 0.45 : D.w - 2 * M, size: SH.note * 0.9, maxLines: 2, weight: 500, fill: th.card, stroke: th.inkFaint, name: 'foot'});
    }
    let issue = issueTop;
    if (right && !issueTop && showAll && p.issues.length) {
      const w = Math.min(420, rightColW * 0.55);
      const busy = [lensBox, handleBox, standBox, spec.box, lensLab && lensLab.box].filter(Boolean);
      const cands = [{x: D.w - M - w - 6, y: plaqueBottom + 24}, {x: D.w - M - w - 6, y: spec.box.y + spec.box.h + 24}];
      for (const cd of cands) {
        const note = stickyNote(ctx, {name: 'issue', x: cd.x, y: cd.y, w, head: t.issue, text: p.issues[0], size: SH.note, headScale: 0.95, rot: -1.2});
        if (note.box.y + note.box.h > D.h - M - 4 || busy.some(b => hit(note.box, b, 10))) continue;
        issue = note;
        break;
      }
      if (!issue) issue = stickyNote(ctx, {name: 'issue', x: D.w - M - w - 6, y: plaqueBottom + 24, w, head: t.issue, text: p.issues[0], size: SH.note, headScale: 0.95, rot: -1.2});
    }

    // --- the gap row's channel: a broken link where no rung is drawn (state, not a relationship)
    const rungRel = rels.find(x => x.rungs);
    const gap = rungRel && diff >= 0 ? {x: (xP + xQ) / 2, y: ys[diff], s: Math.max(16, R * 0.5)} : null;
    if (gap) gap.box = {x: gap.x - gap.s - 6, y: gap.y - gap.s - 6, w: 2 * gap.s + 12, h: 2 * gap.s + 12};

    // --- relation captions (on or beside their line, clear of components, texts and each other)
    const standBase = {x: standC.x - outR * 1.2, y: standC.y + outR - 6, w: outR * 2.4, h: outR * 0.3 + 30};
    const obstacles = [plaque.box, {c: lensC, r: RL * 1.1 + 8}, handleBox, {c: standC, r: outR * 1.18 + 8}, standBase, spec.box, lensLab && lensLab.box, issue && issue.box, foot && foot.box, legend && legend.box, ...tags.map(x => x.box), ...headers.map(q => q.box), ...texts.map(x => ({x: x.box.x - 4, y: x.box.y - 4, w: x.box.w + 8, h: x.box.h + 8})),
      ...F.rows.flatMap((_, i) => ['a', 'b'].map(sd => ({x: xOf(sd) - R - 3, y: ys[i] - R - 3, w: 2 * R + 6, h: 2 * R + 6}))),
      ...['a', 'b'].map(sd => ({x: xOf(sd) - stripHalf(R), y: railsTop, w: 2 * stripHalf(R), h: headH})),
      gap && gap.box].filter(Boolean);
    const placed = [];
    const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
    const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
    const capSize = SH.note;
    // other links' paths (sampled) and the rung lines are obstacles for a caption too
    const pathDots = x => (x.rungs ? x.rungs.map(q => ({x: Math.min(q.c.from.x, q.c.to.x), y: q.c.from.y - 5, w: Math.abs(q.c.to.x - q.c.from.x), h: 10}))
      : Array.from({length: 25}, (_, i) => x.c.at(i / 24)).map(q => ({x: q.x - 4, y: q.y - 4, w: 8, h: 8})));
    // short links have the fewest free spots: their captions are placed first
    const linkLen = x => (x.rungs ? Infinity : Math.hypot(x.c.to.x - x.c.from.x, x.c.to.y - x.c.from.y));
    const capOrder = rels.slice().sort((a, b) => linkLen(a) - linkLen(b));
    const captions = showAll ? capOrder.map(x => {
      const makeAt = (pt, mw, sz = capSize, lines = 2) => chip(ctx, x.text, {x: pt.x, y: pt.y, anchor: 'middle', maxWidth: mw, size: sz, maxLines: lines, fill: th.card, stroke: x.color, name: `cap${x.idx}`, weight: 600});
      const cands = [];
      if (x.rungs) {
        const chanMid = (xP + xQ) / 2;
        // in the channel between two linked rows (it names the ladder of rungs), else below the strips;
        // never in the gap row, which has no rung
        for (const sz of [capSize * 0.88, capSize * 0.8]) {
          for (let i = 0; i + 1 < n; i++) {
            if (!x.rungs.some(q => q.i === i) || !x.rungs.some(q => q.i === i + 1)) continue;
            cands.push({pt: {x: chanMid, y: (ys[i] + ys[i + 1]) / 2}, mw: SH.chan - 2 * R - 22, mid: true, words: true, size: sz, lines: 3});
          }
        }
        // above the channel, between the strip tops (free in the tall layout), then under the strips
        for (const [mw, sz] of [[SH.chan + 60, capSize], [SH.chan - 10, capSize], [SH.chan - 10, capSize * 0.88]]) {
          const topProbe = makeAt({x: 0, y: 0}, mw, sz, 3);
          cands.push({pt: {x: chanMid, y: railsTop - topProbe.box.h - 10}, mw, size: sz, lines: 3, words: true});
        }
        cands.push({pt: {x: chanMid, y: railBottomY + 12}, mw: SH.chan + 80});
      } else {
        // beside the line first (the tracer runs along it; the chip is pushed just clear of the
        // line), then on it; one line, then two or three, then slightly smaller type
        for (const [mw, sz, lines] of [[300, capSize, 2], [200, capSize, 3], [340, capSize * 0.86, 2], [170, capSize * 0.86, 3]]) {
          for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
            const q = x.c.at(tt);
            const nx = -Math.sin(q.a), ny = Math.cos(q.a);
            for (const side of [-1, 1]) cands.push({pt: q, n: {x: nx * side, y: ny * side}, clear: true, mw, size: sz, lines, words: true});
            for (const off of [0, -92, 92]) cands.push({pt: {x: q.x + nx * off, y: q.y + ny * off}, mw, mid: true, words: true, size: sz, lines});
          }
        }
      }
      const words = x.text.split(/\s+/);
      const others = rels.filter(y => y !== x).flatMap(pathDots);
      // a ladder caption must not cover its own chain links either
      if (x.rungs) others.push(...x.rungs.map(q => {
        const sL = Math.max(16, R * 0.5);
        return {x: q.mid.x - sL * 1.2, y: q.mid.y - sL * 0.7, w: sL * 2.4, h: sL * 1.4};
      }));
      for (const cd of cands) {
        const sz = cd.size ?? capSize;
        if (cd.words && Math.max(...words.map(wd => ctx.measure(wd, sz, 600, 'sans'))) + sz * 1.2 + 4 > cd.mw) continue;
        const probe = makeAt({x: 0, y: 0}, cd.mw, sz, cd.lines);
        if (probe.fit.truncated) continue;
        let pt = cd.pt;
        if (cd.clear) {
          // centre offset so the chip's box just clears its own line on that side
          const off = Math.abs(cd.n.x) * probe.box.w / 2 + Math.abs(cd.n.y) * probe.box.h / 2 + 10;
          pt = {x: cd.pt.x + cd.n.x * off, y: cd.pt.y + cd.n.y * off};
        }
        const top = cd.mid || cd.clear ? pt.y - probe.box.h / 2 : pt.y;
        const ch = makeAt({x: pt.x, y: top}, cd.mw, sz, cd.lines);
        if (!inside(ch.box)) continue;
        if (obstacles.some(b => hit(ch.box, b, 6)) || placed.some(b => hit(ch.box, b, 8)) || others.some(b => hit(ch.box, b, 4))) continue;
        const ends = rels.filter(y => y !== x).flatMap(y => y.ends.flatMap(e => [e.from, e.to]));
        if (ends.some(e => e.x > ch.box.x - 10 && e.x < ch.box.x + ch.box.w + 10 && e.y > ch.box.y - 10 && e.y < ch.box.y + ch.box.h + 10)) continue;
        placed.push(ch.box);
        return {idx: x.idx, chip: ch};
      }
      // nothing free: the rung ladder's caption goes under the strips, others on their line
      const fb = x.rungs ? cands[cands.length - 1] : cands[0];
      const ch = makeAt({x: fb.pt.x, y: fb.pt.y - 20}, fb.mw);
      placed.push(ch.box);
      return {idx: x.idx, chip: ch, forced: true};
    }).sort((a, b) => a.idx - b.idx) : [];

    // --- explosion axes (dashed guides the parts slide along during the separation beat)
    const joinOff = (xQ - xP - 2 * R - 10) / 2;
    const axes = [
      {x1: xP - 40, y1: railBottomY + 26, x2: xQ + 40, y2: railBottomY + 26},
    ];

    // --- tracer route along the drawn links in the supplied order
    const route = buildRoute(p.traversalOrder, rels, {elements, lensC, standC, RL, outR, xP, xQ, ys, k, center, Pside, Qside, handleDeg: SH.handleDeg});

    return {F, n, diff, k, Pside, Qside, R, xP, xQ, ys, rowH, rowsTop, railsTop, railBottomY, headH, plaque, texts, rels, captions, headers, lensC, RL, lensArt, standC, outR, spec, lensLab, legend, issue, foot, tags, route, elements, textW, right, diffRow, stripHalf: stripHalf(R), joinOff, axes, plaqueBottom, gap};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = dcColors(ctx);
    const showKey = ctx.show('key');
    const sh = L.stripHalf;
    const strips = ['a', 'b'].map(side => {
      const x = side === L.Pside ? L.xP : L.xQ;
      const col = side === 'a' ? C.a : C.b;
      const soft = side === 'a' ? C.aSoft : C.bSoft;
      const top = L.railsTop, bot = L.railBottomY;
      const parts = [
        h('path', {d: roundRectPath(x - sh + 5, top + 8, 2 * sh, bot - top, 10), fill: 'rgba(31,35,40,0.18)'}),
        h('path', {d: roundRectPath(x - sh, top, 2 * sh, bot - top, 10), fill: th.paper, stroke: '#1f2328', 'stroke-width': 2.5}),
        h('path', {d: `M${r(x - sh + 1.5)} ${r(top + L.headH)}V${r(top + 10)}Q${r(x - sh + 1.5)} ${r(top + 1.5)} ${r(x - sh + 10)} ${r(top + 1.5)}H${r(x + sh - 10)}Q${r(x + sh - 1.5)} ${r(top + 1.5)} ${r(x + sh - 1.5)} ${r(top + 10)}V${r(top + L.headH)}Z`, fill: soft}),
        h('line', {x1: r(x - sh), x2: r(x + sh), y1: r(top + L.headH), y2: r(top + L.headH), stroke: col, 'stroke-width': 3}),
      ];
      L.ys.forEach((y, i) => {
        if (i > 0) parts.push(h('line', {x1: r(x - sh + 8), x2: r(x + sh - 8), y1: r(y - L.rowH / 2), y2: r(y - L.rowH / 2), stroke: th.paperLine, 'stroke-width': 1.5}));
        const row = L.F.rows[i];
        const present = side === 'a' ? row.inA : row.inB;
        if (present) parts.push(g({transform: T(x, y)}, factToken(ctx, {name: `tok-${side}${i}`, R: L.R, icon: row.icon, rim: col})));
        else parts.push(g({transform: T(x, y)}, slotRing(ctx, {name: `sock-${side}${i}`, R: L.R, hiName: `sock-${side}${i}-hi`})));
      });
      const hd = L.headers.find(q => q.side === side);
      const by = top + L.headH / 2;
      parts.push(h('circle', {cx: r(x), cy: r(by), r: r(hd.badge), fill: col, stroke: '#1f2328', 'stroke-width': 2}));
      if (showKey) {
        parts.push(h('text', {x: r(x), y: r(by + hd.badge * 0.42), 'text-anchor': 'middle', 'font-size': r(hd.badge * 1.2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: '#ffffff'}, side.toUpperCase()));
        parts.push(textBlock(hd.fit, {x: r(hd.lx), y: r(hd.cy - hd.fit.height / 2), anchor: hd.outward < 0 ? 'end' : 'start', fill: th.fg, name: `head-${side}`}));
      }
      parts.push(pushPin(x, bot - 14, side === 'a' ? C.pinA : C.pinC, 7));
      return g({name: `rail-${side}`}, parts);
    });
    const texts = L.texts.map(x => (showKey
      ? textBlock(x.fit, {x: r(x.x), y: r(x.y), anchor: x.anchor, fill: th.fg, name: `txt${x.i}`})
      : g(null, x.fit.lines.map((ln, j) => {
        const lw = ctx.measure(ln, x.fit.size, 500, 'sans');
        const bx = x.anchor === 'end' ? x.x - lw : x.x;
        return h('rect', {x: r(bx), y: r(x.y + j * x.fit.lineHeight + x.fit.size * 0.2), width: r(lw), height: r(x.fit.size * 0.55), rx: r(x.fit.size * 0.27), fill: th.dark ? '#6b6456' : '#c9c2b4'});
      }))));
    // rungs carry a chain link at their middle (the connector object), drawn once the rung is complete
    const conns = L.rels.flatMap(x => (x.rungs
      ? x.rungs.map((q, j) => g(null, q.c.node, g({transform: T(q.mid.x, q.mid.y)}, g({name: `rel${x.idx}-lkw${j}`}, linkMark(ctx, {name: `rel${x.idx}-lk${j}`, s: Math.max(16, L.R * 0.5)})))))
      : [x.c.node]));
    // the gap row: a broken link in the channel once the rungs are in place
    const gapNode = L.gap ? g({transform: T(L.gap.x, L.gap.y)}, g({name: 'gapw'}, linkMark(ctx, {name: 'gap-lk', s: L.gap.s, broken: true}))) : null;
    const stand = g({name: 'stand'},
      h('ellipse', {cx: r(L.standC.x), cy: r(L.standC.y + L.outR + 16), rx: r(L.outR * 1.15), ry: r(L.outR * 0.28), fill: C.frame, stroke: '#1f2328', 'stroke-width': 2.2}),
      h('rect', {x: r(L.standC.x - 6), y: r(L.standC.y + L.outR - 4), width: 12, height: 20, fill: C.metalDark}),
      g({transform: T(L.standC.x, L.standC.y)}, slotRing(ctx, {name: 'stand-sock', R: L.outR})),
      L.diffRow ? g({name: 'stand-tokg', transform: T(L.standC.x, L.standC.y)}, g({name: 'stand-tok', opacity: 0}, factToken(ctx, {R: L.outR, icon: L.diffRow.icon, rim: L.Pside === 'a' ? C.a : C.b}))) : null,
    );
    const carry = L.diffRow ? g({name: 'carry', opacity: 0}, factToken(ctx, {R: L.R * 1.1, icon: L.diffRow.icon, rim: L.Pside === 'a' ? C.a : C.b})) : null;
    return g(null,
      g({name: 'axes', opacity: 0}, L.axes.map(a => h('line', {...Object.fromEntries(Object.entries(a).map(([kk, v]) => [kk, r(v)])), stroke: th.fgSoft, 'stroke-width': 2, 'stroke-dasharray': '4 9', 'stroke-linecap': 'round'}))),
      g({name: 'plaque-g'}, L.plaque.node),
      g({name: 'rails'}, g({name: 'rail-P'}, strips[L.Pside === 'a' ? 0 : 1]), g({name: 'rail-Q'}, strips[L.Pside === 'a' ? 1 : 0])),
      g({name: 'texts'}, texts),
      conns,
      gapNode,
      g({name: 'stand-g'}, stand),
      L.spec.node,
      g({name: 'lens-g', transform: T(L.lensC.x, L.lensC.y)}, g({name: 'lens-s'}, L.lensArt)),
      L.lensLab && g({name: 'lens-labg'}, L.lensLab.node),
      L.tags.map(x => x.node),
      L.captions.map(x => g({name: `capg${x.idx}`, opacity: 0}, x.chip.node)),
      L.legend && L.legend.node,
      L.issue && L.issue.node,
      L.foot && g({name: 'footg', opacity: 0}, L.foot.node),
      carry,
      // tracer: a ring with a bright core, on top of everything
      g({name: 'tracer', opacity: 0},
        h('circle', {r: r(Math.max(20, L.R * 0.5)), fill: th.accent, opacity: 0.22}),
        h('circle', {r: r(Math.max(11, L.R * 0.26)), fill: th.accent, stroke: th.paper, 'stroke-width': 3.5})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const s = w => seg(u, ...W[w]);
    // --- separate: the strips start pressed together at the seam and slide apart; parts settle in
    const apart = ease.inOutCubic(s('apart'));
    nodes['rail-P'] = {transform: apart < 1 ? T(L.joinOff * (1 - apart), 0) : ''};
    nodes['rail-Q'] = {transform: apart < 1 ? T(-L.joinOff * (1 - apart), 0) : ''};
    nodes.texts = {transform: apart < 1 ? T(L.joinOff * (1 - apart), 0) : ''};
    const parts = ease.outCubic(s('parts'));
    nodes['plaque-g'] = {opacity: r(parts, 3), transform: parts < 1 ? T(0, -30 * (1 - parts)) : ''};
    nodes['stand-g'] = {opacity: r(parts, 3), transform: parts < 1 ? T(-40 * (1 - parts), 0) : ''};
    // the magnifier slides out of the assembly to its place beside the strips
    nodes['lens-g'] = {transform: T(L.lensC.x - (L.right ? 90 : 0) * (1 - parts), L.lensC.y - (L.right ? 0 : 60) * (1 - parts)), opacity: r(parts, 3)};
    const ax = s('axes');
    nodes.axes = {opacity: r(Math.sin(Math.PI * ax) * 0.9, 3)};
    // --- relate: relationships drawn one after another in the supplied order
    const nR = L.rels.length;
    const each = (W.relate[1] - W.relate[0]) / nR;
    const drawn = L.rels.map((x, i) => ease.inOutSine(seg(u, W.relate[0] + i * each, W.relate[0] + (i + 0.92) * each)));
    L.rels.forEach((x, i) => {
      if (x.rungs) {
        x.rungs.forEach((q, j) => {
          const pj = clamp(drawn[i] * x.rungs.length - j);
          Object.assign(nodes, q.c.frame(pj, drawn[i] > 0 ? 1 : 0));
          const lk = clamp((pj - 0.55) / 0.45);
          nodes[`rel${x.idx}-lk${j}`] = {opacity: r(clamp(lk * 2.5), 3)};
          nodes[`rel${x.idx}-lkw${j}`] = {transform: lk > 0 && lk < 1 ? `scale(${r(0.5 + 0.5 * lk, 3)})` : ''};
        });
      } else Object.assign(nodes, x.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
    });
    let gapShown = 0;
    if (L.gap) {
      const iR = L.rels.findIndex(x => x.rungs);
      gapShown = clamp((drawn[iR] - 0.85) / 0.15);
      nodes['gap-lk'] = {opacity: r(gapShown, 3)};
      nodes.gapw = {transform: gapShown > 0 && gapShown < 1 ? `scale(${r(0.6 + 0.4 * gapShown, 3)})` : ''};
    }
    L.captions.forEach(cp => {
      const i = L.rels.findIndex(x => x.idx === cp.idx);
      nodes[`capg${cp.idx}`] = {opacity: r(clamp((drawn[i] - 0.6) / 0.4), 3)};
    });
    // --- trace
    const tr = L.route;
    const tp = ease.inOutSine(s('trace'));
    const tracing = u > W.trace[0] && u < W.trace[1];
    const at = tr.poly.at(tp);
    nodes.tracer = {transform: T(at.x, at.y), opacity: tracing ? 1 : 0};
    const visited = tr.visits.filter(v => tp >= v.t - 1e-9 && u > W.trace[0]).map(v => v.id);
    const focusVisit = tr.visits.find(v => v.id === p.focusElement);
    let focusK = 0;
    if (focusVisit) {
      // grows as the tracer arrives, stays enlarged until the tracer leaves it along its next link
      const d = (tp - focusVisit.t) / 0.12;
      const leave = tr.segs.find(sg => sg.from === p.focusElement);
      const tEnd = Math.max(focusVisit.t + 0.12, leave ? leave.tl : 0);
      focusK = u > W.trace[0] ? (d < -1 ? 0 : d < 0 ? ease.inOutSine(d + 1) : tp <= tEnd ? 1 : 1 - 0.5 * clamp((tp - tEnd) / 0.12)) : 0;
      if (u >= W.trace[1]) focusK = 0.5;
    }
    const grow = 1 + 0.16 * focusK;
    const scaleAt = (c, sc) => (sc === 1 ? '' : `translate(${r(c.x)} ${r(c.y)}) scale(${r(sc, 4)}) translate(${r(-c.x)} ${r(-c.y)})`);
    const focusScale = id => (p.focusElement === id ? grow : 1);
    nodes['lens-s'] = {transform: focusScale('lens') === 1 ? '' : `scale(${r(focusScale('lens'), 4)})`};
    if (L.diffRow) nodes['stand-tokg'] = {transform: `${T(L.standC.x, L.standC.y)}${focusScale('fact') === 1 ? '' : ` scale(${r(focusScale('fact'), 4)})`}`};
    nodes['plaque-g'].transform = [nodes['plaque-g'].transform, scaleAt(pCenter(L.plaque.box), focusScale('rule'))].filter(Boolean).join(' ');
    for (const side of ['a', 'b']) {
      const id = side === 'a' ? 'caseA' : 'caseB';
      const key = side === L.Pside ? 'rail-P' : 'rail-Q';
      if (focusScale(id) !== 1) nodes[key].transform = [nodes[key].transform, scaleAt(pCenter(L.elements[id]), focusScale(id))].filter(Boolean).join(' ');
    }
    // the lens shows the gap row once the tracer has reached it (or at the end)
    const lensSeen = tr.visits.find(v => v.id === 'lens');
    const view = lensSeen ? (u >= W.trace[1] ? 1 : u > W.trace[0] ? clamp((tp - lensSeen.t) / 0.05 + 1) : 0) : (u >= W.trace[1] ? 1 : 0);
    nodes.lv = {opacity: r(view, 3)};
    if (L.diff >= 0) {
      nodes['lv-lk'] = {opacity: r(view, 3)};
      nodes[`sock-${L.Qside}${L.diff}-hi`] = {opacity: r(view, 3)};
    }
    // --- the distinguishing token copy travels from the lens to the stand with the tracer
    let carried = 0, onStand = 0;
    if (L.diffRow) {
      const sq = tr.segs.find(sg => sg.from === 'lens' && sg.to === 'fact');
      // the copy leaves the lens centre and ends on the stand centre (continuous in time; hidden
      // before and after the ride, when it coincides with its source / the stand token)
      carried = u >= W.trace[1] ? 1 : u > W.trace[0] && sq ? clamp((tp - sq.tl) / (sq.t1 - sq.tl)) : 0;
      const cp = sq ? tr.poly.at(lerp(sq.tl, sq.t1, carried)) : L.standC;
      onStand = carried >= 1 ? 1 : 0;
      // it emerges at the rim (small → full size) and grows to the stand's size on the way
      const emerge = 0.35 + 0.65 * ease.outCubic(clamp(carried / 0.15));
      const grow = lerp(1, L.outR / (L.R * 1.1), ease.inOutSine(carried)) * emerge;
      nodes.carry = {opacity: carried > 0 && carried < 1 ? 1 : 0, transform: `${T(cp.x, cp.y)} scale(${r(grow, 4)})`};
      // while the token rides, it is the tracer (one look from the glass to the stand)
      if (carried > 0 && carried < 1) nodes.tracer.opacity = 0;
      // that link's caption steps aside (fades) while the token passes over it, then returns
      const seqRel = L.rels.find(x => !x.rungs && [x.rel.from, x.rel.to].includes('lens') && [x.rel.from, x.rel.to].includes('fact'));
      const seqCap = seqRel && L.captions.find(cp => cp.idx === seqRel.idx);
      if (seqCap && u < W.trace[1]) {
        const hide = clamp(carried / 0.08) * (1 - clamp((carried - 0.9) / 0.1));
        const key = `capg${seqCap.idx}`;
        nodes[key] = {opacity: r(nodes[key].opacity * (1 - hide), 3)};
      }
      nodes['stand-tok'] = {opacity: onStand};
      nodes.spec = {opacity: r(onStand ? s('tags') : 0, 3)};
    } else nodes.spec = {opacity: r(s('tags'), 3)};
    // --- gather
    if (L.tags.length) nodes['tag-absent'] = {opacity: r(s('tags'), 3)};
    if (L.lensLab) nodes['lens-labg'] = {opacity: r(seg(u, ...W.labels), 3)};
    if (L.legend) nodes.legend = {opacity: r(s('legend'), 3)};
    if (L.issue) nodes.issue = {opacity: r(s('issue'), 3)};
    if (L.foot) nodes.footg = {opacity: r(seg(u, ...W.labels), 3)};

    // --- semantics
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const ends = L.rels.flatMap(x => x.ends);
    const semantic = {
      beat,
      apart: r(apart, 3),
      relationsDrawn: drawn.map(v => r(v, 3)),
      kinds: L.rels.map(x => x.kind),
      arrowheads: L.rels.map(x => Boolean(LINK_STYLES[x.kind].arrow)),
      arrowOnRelation: L.rels.some(x => x.kind === 'relation' && LINK_STYLES[x.kind].arrow),
      rungRows: (L.rels.find(x => x.rungs) || {rungs: []}).rungs.map(q => q.i),
      gapMarked: r(gapShown, 3),
      tracerVisible: tracing,
      tracer: P2(at),
      visitOrder: tr.visits.map(v => v.id),
      visited,
      focus: p.focusElement,
      focusScale: r(grow, 3),
      lensView: r(view, 3),
      carried: r(carried, 3),
      onStand,
      diffRow: L.diff,
      presentSide: L.diff >= 0 ? L.Pside : null,
      connectorsLand: L.rels.every(x => x.landed),
      captionsClear: L.captions.every(cp => !cp.forced),
      forcedCaptions: L.captions.filter(cp => cp.forced).map(cp => cp.idx),
      connectorEnds: ends.map(e => ({from: P2(e.from), to: P2(e.to)})),
      outcome: null,
    };
    if (L.diffRow) semantic.carry = P2(parseT(nodes.carry.transform));
    return {nodes, semantic};
  },
};

function pCenter(b) {
  return {x: b.x + b.w / 2, y: b.y + b.h / 2};
}

function parseT(s) {
  const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(s);
  return m ? {x: Number(m[1]), y: Number(m[2])} : {x: 0, y: 0};
}

/**
 * Tracer route: follows a drawn link between consecutive components (either
 * direction); the strips pair follows the middle rung; leaving a strip, the
 * tracer first walks along it to the link's row; otherwise a straight hop.
 */
function buildRoute(order, rels, G) {
  const pts = [];
  const push = q => pts.push({x: q.x, y: q.y});
  const anchor = id => {
    if (id === 'lens') return G.lensC;
    if (id === 'fact') return G.standC;
    return G.center(G.elements[id]);
  };
  const railX = id => (id === 'caseA' ? (G.Pside === 'a' ? G.xP : G.xQ) : (G.Pside === 'b' ? G.xP : G.xQ));
  const cum = () => {
    let s = 0;
    for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return s;
  };
  const marks = [];
  const segs = [];
  const isRail = q => q === 'caseA' || q === 'caseB';
  const linkOf = (a, b) => rels.find(x => !x.rungs && ((x.rel.from === a && x.rel.to === b) || (x.rel.from === b && x.rel.to === a)));
  // the magnifier is walked around its rim (never across the glass and the view it shows),
  // on the side away from its handle
  const rimArc = (from, to) => {
    const c = G.lensC, rr = G.RL + 6;
    const a0 = Math.atan2(from.y - c.y, from.x - c.x);
    let a1 = Math.atan2(to.y - c.y, to.x - c.x);
    let d = a1 - a0;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    const hA = (G.handleDeg ?? 90) * Math.PI / 180;
    const midDist = dd => Math.abs(Math.atan2(Math.sin(a0 + dd / 2 - hA), Math.cos(a0 + dd / 2 - hA)));
    const alt = d > 0 ? d - 2 * Math.PI : d + 2 * Math.PI;
    if (midDist(alt) > midDist(d)) d = alt;
    const steps = Math.max(2, Math.ceil(Math.abs(d) / 0.15));
    for (let kk = 1; kk <= steps; kk++) push({x: c.x + Math.cos(a0 + d * kk / steps) * rr, y: c.y + Math.sin(a0 + d * kk / steps) * rr});
  };
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    if (i === 0) {
      // start on the port where the first drawn link leaves this component (not over its text)
      const first = order.length > 1 ? linkOf(id, order[1]) : null;
      push(first && id !== 'fact' ? (first.rel.from === id ? first.c.from : first.c.to) : anchor(id));
      marks.push({id, len: 0});
      continue;
    }
    const prev = order[i - 1];
    const startLen = cum();
    const link = rels.find(x => !x.rungs && ((x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev)));
    const rung = rels.find(x => x.rungs && x.rungs.length && [prev, id].every(isRail) && prev !== id);
    let linkLen0 = null;
    if (link) {
      const fwd = link.rel.from === prev;
      const startPt = fwd ? link.c.from : link.c.to;
      if (isRail(prev)) push({x: railX(prev), y: startPt.y});
      if (prev === 'lens' && pts.length) rimArc(pts[pts.length - 1], startPt);
      linkLen0 = cum();
      for (let kk = 0; kk <= 30; kk++) push(link.c.at(fwd ? kk / 30 : 1 - kk / 30));
      if (isRail(id)) push({x: railX(id), y: pts[pts.length - 1].y});
      // the stand is visited at its centre (a carried token ends on it); the magnifier at its rim
      if (id === 'fact') push(anchor(id));
    } else if (rung) {
      const mid = rung.rungs[Math.floor((rung.rungs.length - 1) / 2)];
      push({x: railX(prev), y: mid.c.from.y});
      push({x: railX(id), y: mid.c.from.y});
    } else {
      push(anchor(id));
    }
    marks.push({id, len: cum()});
    segs.push({from: prev, to: id, len0: startLen, len1: cum(), lenLink: linkLen0 ?? startLen});
  }
  const total = cum() || 1;
  return {
    poly: polyline(pts.length > 1 ? pts : [pts[0], pts[0]]),
    visits: marks.map(m => ({id: m.id, t: m.len / total})),
    segs: segs.map(sg => ({from: sg.from, to: sg.to, t0: sg.len0 / total, t1: sg.len1 / total, tl: sg.lenLink / total})),
  };
}

/** Specimen card under the stand: heading (element label) + the fact text + state line. */
function specimenCard(ctx, o) {
  const th = ctx.theme;
  const C = dcColors(ctx);
  const showKey = ctx.show('key');
  const pad = 14;
  const hf = ctx.fit(o.head, {maxWidth: o.w - pad * 2, size: o.size * 0.95, minSize: o.size * 0.8, maxLines: 2, weight: 700});
  const bf = o.compact ? {height: -8, lines: []} : ctx.fit(o.text, {maxWidth: o.w - pad * 2, size: o.size * 1.05, minSize: o.size * 0.85, maxLines: 3, weight: 600});
  const sf = o.state ? ctx.fit(o.state, {maxWidth: o.w - pad * 2, size: o.size * 0.92, minSize: o.size * 0.8, maxLines: 2, weight: 600}) : null;
  const hh = showKey ? pad + hf.height + 8 + bf.height + (sf ? 8 + sf.height : 0) + pad : 50;
  const x = o.x - o.w / 2, y = o.y;
  const sx = o.stemX ?? o.x;
  const node = g({name: 'spec', opacity: 0},
    h('line', {x1: r(sx), x2: r(sx), y1: r(y - 16), y2: r(y + 1), stroke: '#5b4a3a', 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(x + 4, y + 7, o.w, hh, 6), fill: 'rgba(31,35,40,0.18)'}),
    h('path', {d: roundRectPath(x, y, o.w, hh, 6), fill: C.rule, stroke: '#1f2328', 'stroke-width': 2.2}),
    showKey ? textBlock(hf, {x: x + pad, y: y + pad, fill: th.inkSoft}) : h('rect', {x: r(x + pad), y: r(y + 14), width: r(o.w * 0.4), height: 8, rx: 4, fill: '#b8ad8c'}),
    showKey ? (o.compact ? null : textBlock(bf, {x: x + pad, y: y + pad + hf.height + 8, fill: '#1f2328'})) : h('rect', {x: r(x + pad), y: r(y + 28), width: r(o.w * 0.7), height: 8, rx: 4, fill: '#c9bf9f'}),
    showKey && sf ? textBlock(sf, {x: x + pad, y: y + pad + hf.height + 8 + bf.height + 8, fill: C.a}) : null,
  );
  return {node, box: {x, y: y - 16, w: o.w, h: hh + 16}};
}

/** Legend of the link kinds actually used (relation: end dots, no arrow; others: arrowheads). */
function legendNode(ctx, o) {
  const th = ctx.theme;
  const items = [];
  let x = o.x;
  const size = o.size;
  const tf = ctx.fit(`${o.title}:`, {maxWidth: 300, size, maxLines: 1, weight: 700});
  items.push(textBlock(tf, {x, y: o.y, fill: th.fgSoft}));
  x += tf.width + 16;
  for (const kind of o.kinds) {
    const st = LINK_STYLES[kind];
    const col = kindColor(ctx, kind);
    const y = o.y + size * 0.5;
    items.push(h('line', {x1: r(x), x2: r(x + 44), y1: r(y), y2: r(y), stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}));
    if (st.arrow) items.push(h('path', {d: `M${r(x + 50)} ${r(y)}l-12 -7l3 7l-3 7Z`, fill: col}));
    if (st.endDots) items.push(h('circle', {cx: r(x), cy: r(y), r: 4.5, fill: col}), h('circle', {cx: r(x + 44), cy: r(y), r: 4.5, fill: col}));
    const f = ctx.fit(o.labels[kind] || kind, {maxWidth: 260, size, maxLines: 1, weight: 500});
    items.push(textBlock(f, {x: x + 60, y: o.y, fill: th.fg}));
    x += 60 + f.width + 26;
  }
  return {node: g({name: 'legend', opacity: 0}, items), w: x - o.x, box: {x: o.x, y: o.y - 4, w: x - o.x, h: size * 1.3 + 8}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-03-mechanism',
    title: 'Distinguishing cases — exploded strips, rungs and the missing link',
    titleEs: 'Distinción de casos — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Distinción de casos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded assembly drawing: the two case strips of the pin board are pulled apart; a chain-link rung (plain relation) joins every shared fact, the distinguishing row has none. Its empty socket is related to a stand-alone magnifier whose glass shows the gap row enlarged, and a sequence arrow leads to a stand holding that fact (as supplied). The rule plate relates to case A. A tracer follows the supplied order; the focus element enlarges; nothing is decided.',
    tags: ['reasoning', 'distinguishing', 'mechanism', 'exploded', 'rungs', 'relation', 'sequence', 'magnifier', 'tracer', 'facts', 'rule'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/distincion-de-casos.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
