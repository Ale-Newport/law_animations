/**
 * LAW-0087 — Analogía de casos · contrast
 *
 * Storyboard (two identical wall-mounted tracing boards, no hands):
 *  0.00–0.17 base    Both boards show the same situation: the earlier case's
 *                    tracing sheet hangs on the peg bar over the lit panel;
 *                    the new case's sheet hangs above it from a slider batten
 *                    riding in two guide rails. One slot of the new case —
 *                    the changed feature — is covered by a paper flap in
 *                    both boards. Headers show only the letters A and B.
 *  0.17–0.40 change  The flaps fold up. Board A reveals the SAME print as the
 *                    earlier case, in the same cell ("Relevant similarity");
 *                    board B reveals a different print in the neighbouring
 *                    cell ("Relevant difference"). Nothing else differs.
 *  0.40–0.77 action  In parallel and with identical timing both battens slide
 *                    the new sheets down the rails until their holes drop on
 *                    the pegs. Shared features coincide (overprinted ink,
 *                    "=") in both boards; the changed feature merges in A but
 *                    stays as two prints side by side with "≠" in B.
 *  0.77–1.00 guide   Dashed rings mark the changed slot in both boards and a
 *                    comparison guide joins them; the rule tag (text as
 *                    supplied) names that feature; a neutral note says every
 *                    other feature is identical and no outcome is shown. No
 *                    winner, score or legal consequence.
 * Boards side by side on wide boxes, stacked on tall ones (the guide then runs
 * down the right margin).
 * Legal content: fictional, jurisdiction unspecified; relevance and values
 * are supplied by the author, the scene draws no conclusion.
 * @module animations/reasoning/LAW-0087
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, oneOf, list, obj} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {
  analogyFields, ANALOGY_STRINGS, PICTOS, resolveAnalogy, inks, sheetGeometry, featureRing, allTexts,
  overlayNodes, overlayFrame, tracingBoard, slideBatten, pictogram, SANS,
} from './kits/analogia-de-casos.js';

const ID = 'LAW-0087';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  flap: [0.19, 0.3], labels: [0.22, 0.33], pulse: [0.3, 0.38],
  slide: [0.42, 0.61], reveal: [0.61, 0.75],
  rings: [0.77, 0.83], guide: [0.8, 0.9], rule: [0.84, 0.9], states: [0.86, 0.92], note: [0.89, 0.96],
};
const M = 30;

const sceneSchema = {
  ...analogyFields,
  scenarioA: obj('Scenario A (the new case shares the changed feature)', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B (the new case differs on the changed feature)', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: obj('The single feature whose new-case value differs between the two scenes (scenario A uses the supplied `b` of that feature)', {
    feature: int('Index of the changed feature in `facts`', 0, 4),
    valueB: str('New-case value of that feature in scenario B', 64),
    iconB: {type: ['string', 'null'], enum: [...PICTOS, null], description: 'Pictogram of the scenario-B value (null = same pictogram)'},
  }, ['feature', 'valueB']),
  sharedFacts: list('Optional footnote listing features stated as identical in both scenes', str('Shared fact', 60), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide joining the changed slot in both scenes', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  cases: {a: {name: 'Case Harbour', note: 'earlier case · fictional'}, b: {name: 'Case Linden', note: 'new case · fictional'}},
  facts: [
    {icon: 'ladder', a: 'Ladder lent by a neighbour', b: 'Ladder lent by a neighbour', relevant: true},
    {icon: 'note', a: 'Loan noted on a slip', b: 'Loan noted on a slip', relevant: false},
    {icon: 'calendar', a: 'Return date agreed', b: 'Return date agreed', relevant: true},
    {icon: 'rain', a: 'Left outside in the rain', b: 'Left outside in the rain', relevant: false},
  ],
  rules: [{name: 'Rule R (illustrative)', text: '“Where an item is lent and a return date is agreed, …”'}],
  issues: ['Does the new case share the feature Rule R names?'],
  assumptions: ['Facts taken as each account supplies them'],
  scenarioA: {label: 'Relevant similarity', caption: 'New case: return date agreed'},
  scenarioB: {label: 'Relevant difference', caption: 'New case: no return date agreed'},
  changedFact: {feature: 2, valueB: 'No return date agreed', iconB: null},
  sharedFacts: [],
  comparisonLabels: {guide: 'Only this feature changes', neutral: 'Every other feature is identical in A and B · no outcome is shown'},
};

/** Panel plan per shape. */
function plan(ctx, footer = 0) {
  const D = ctx.design;
  const column = ctx.view.shape === 'portrait';
  const headerH = column ? 64 : 70;
  if (column) {
    const gap = 26;
    const PH = (D.h - 2 * M - gap - footer) / 2;
    const PW = D.w - 2 * M - 40; // right margin carries the guide
    const foot = footer ? {x: M, y: D.h - M - footer + 14, w: PW, h: footer - 14} : null;
    return {column, headerH, gap, PW, PH, foot, panels: [0, 1].map(i => ({x: M, y: M + i * (PH + gap)}))};
  }
  const gap = ctx.view.shape === 'square' ? 56 : 70;
  const PW = (D.w - 2 * M - gap) / 2;
  const PH = D.h - 2 * M - footer;
  const foot = footer ? {x: M, y: D.h - M - footer + 14, w: D.w - 2 * M, h: footer - 14} : null;
  return {column, headerH, gap, PW, PH, foot, panels: [0, 1].map(i => ({x: M + i * (PW + gap), y: M}))};
}

/** Height of a footer band holding the given notes (stacked chips). */
function footerFor(ctx, keys) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const probeW = (ctx.view.shape === 'portrait' ? D.w - 2 * M - 40 : (D.w - 2 * M) / 2) - 40;
  const texts = [];
  if (keys.includes('neutral') && p.comparisonLabels.neutral) texts.push([p.comparisonLabels.neutral, 24]);
  if (keys.includes('shared') && p.sharedFacts.length) texts.push([`${t.sameInBoth}: ${p.sharedFacts.join(' · ')}`, 20]);
  if (keys.includes('issue') && p.issues.length) texts.push([`${t.issue}: ${p.issues[0]}`, 22]);
  if (keys.includes('assume') && p.assumptions.length) texts.push([p.assumptions.map(a => `${t.assumption}: ${a}`).join(' · '), 19]);
  if (!texts.length) return 0;
  const hs = texts.map(([tx, sz]) => chip(ctx, tx, {x: 0, y: 0, maxWidth: probeW, size: sz, minSize: 16, maxLines: 3, weight: 600, padY: sz * 0.3}).box.h + 8);
  // wide boxes: two columns of notes side by side
  const total = ctx.view.shape === 'portrait' ? hs.reduce((a, b) => a + b, 0) : Math.max(hs.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0), hs.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0));
  return Math.min(total + 24, 300);
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1500]},
  layout(ctx) {
    // the boards' vacated bands hold the notes first; whatever does not fit
    // goes to a footer band under the boards, grown only as much as needed and
    // never so much that the sheets become too small (sheet height >= 250)
    const D = ctx.design;
    const column = ctx.view.shape === 'portrait';
    const headerH = column ? 64 : 70;
    const minBoard = 2 * (column ? 220 : 250) - 60 + 12 + 44 + 28 + 28;
    const cap = column ? D.h - 2 * M - 26 - 2 * (minBoard + headerH + 8) : D.h - 2 * M - (minBoard + headerH + 8);
    // tall boxes start with a footer for the rule tag and the notes (the
    // boards' bands then only carry the state tags and the guide label)
    let footer = column && ctx.show('all') ? Math.min(cap, footerFor(ctx, ['neutral', 'shared', 'issue', 'assume']) + 96) : 0;
    let L = null;
    for (let pass = 0; pass < 5; pass++) {
      L = scene.layoutWith(ctx, footer);
      if (!L.dropped.length || footer >= cap) break;
      footer = Math.min(cap, footer + L.droppedH + 30);
    }
    return L;
  },
  layoutWith(ctx, footer) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const I = inks(th);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const k = Math.min(p.changedFact.feature, p.facts.length - 1);
    const factsA = p.facts;
    const factsB = p.facts.map((f, i) => (i === k ? {...f, b: p.changedFact.valueB, iconB: p.changedFact.iconB || f.iconB || f.icon} : f));
    const RA = resolveAnalogy(factsA, {pairs: [k]});
    const RB = resolveAnalogy(factsB, {pairs: [k]});
    const S = plan(ctx, footer);
    const rail = 22;
    const batten = 44;

    // --- board + sheet sizes (identical in both panels)
    const board = {w: S.PW, h: S.PH - S.headerH - 8};
    const inner = {w: board.w - 28, h: board.h - 28};
    const sw = inner.w - 2 * rail - 20;
    // the parked sheet may hang over the earlier sheet's header band (no text there)
    const ovl = 60;
    const sh = (inner.h - batten - 12 + ovl) / 2;
    const geo = sheetGeometry(ctx, {
      w: sw, h: sh, units: RA.units, texts: allTexts(RA).concat(allTexts(RB)),
      names: {a: '', b: ''}, size: S.column ? 22 : 25, minSize: 16, maxLines: 3, showLabels: showKey, showNames: false, nameSize: 14, compact: true,
      minPicto: 80,
      // the changed feature ends its row on the right in both boards, so the
      // comparison guide leaves its ring without passing over another print
      rowEnd: {side: 'right', first: [k]},
    });

    // --- per panel geometry
    const panels = S.panels.map((pp, i) => {
      const R = i === 0 ? RA : RB;
      const P = i === 0 ? 'pa' : 'pb';
      const bx = pp.x, by = pp.y + S.headerH + 8;
      const inx = bx + 14, iny = by + 14;
      const sx = inx + rail + 10;
      const bRest = {x: sx, y: iny + batten};
      const aAt = {x: sx, y: bRest.y + sh - ovl};
      const pegs = geo.holes.map(hh => ({x: aAt.x + hh.x, y: aAt.y + hh.y}));
      const tb = tracingBoard(ctx, {prefix: `${P}board`, x: bx, y: by, w: board.w, h: board.h, rail, litY: aAt.y - 26, pegs, pegBar: {x0: inx + rail, x1: inx + inner.w - rail, y: aAt.y + geo.holes[0].y}});
      const ov = overlayNodes(ctx, {prefix: P, geo, R, I, bare: true, noLetter: true});
      // flap over the changed slot of the new case (identical in both boards)
      const u = geo.unitCells[k];
      const fx0 = u.L.x + 6, fx1 = u.R.x + u.R.w - 6;
      const fy0 = u.L.pc.y - u.L.ps / 2 - 16;
      const labH = showKey ? Math.max(...[factsA[k].a, factsA[k].b, factsB[k].b].filter(Boolean).map(tx => geo.fitLabel(tx).height)) : 0;
      const fy1 = Math.min(sh - 30, u.L.label.y + labH + 10);
      const flapD = `M${r(fx0)} ${r(fy0)}H${r(fx1)}V${r(fy1 - 22)}L${r(fx1 - 22)} ${r(fy1)}H${r(fx0)}Z`;
      const flap = g({name: `${P}flap`},
        h('path', {d: flapD, fill: '#efe3c4', stroke: '#b59b62', 'stroke-width': 2}),
        h('path', {d: `M${r(fx1)} ${r(fy1 - 22)}L${r(fx1 - 22)} ${r(fy1 - 22)}L${r(fx1 - 22)} ${r(fy1)}Z`, fill: '#d9c79b', stroke: '#b59b62', 'stroke-width': 1.5}),
        h('path', {d: `M${r(fx0 + 14)} ${r(fy0 + 18)}H${r(fx1 - 14)}M${r(fx0 + 14)} ${r(fy0 + 34)}H${r(fx1 - 40)}`, stroke: '#cdb988', 'stroke-width': 3, 'stroke-linecap': 'round'}),
        h('rect', {x: r((fx0 + fx1) / 2 - 34), y: r(fy0 - 9), width: 68, height: 18, rx: 3, fill: '#f6efd9', opacity: 0.9, stroke: '#cfc19c', 'stroke-width': 1}),
      );
      const ring = featureRing(geo, k, 'differs');
      const ringLen = 2 * (ring.w + ring.h);
      const ringNode = h('path', {name: `${P}ring`, d: roundRectPath(aAt.x + ring.x, aAt.y + ring.y, ring.w, ring.h, 16), fill: 'none', stroke: th.ink, 'stroke-width': 4, 'stroke-dasharray': `14 8`, opacity: 0});
      // batten label: the new case's name
      const bl = showKey ? ctx.fit(`${t.newCase}: ${p.cases.b.name}`, {maxWidth: sw * 0.6, size: 23, minSize: 16, maxLines: 1, weight: 700}) : null;
      const battenNode = slideBatten(ctx, {x0: -rail - 6, x1: sw + rail + 6, clips: [sw * 0.1, sw * 0.9], barH: 36, labelFit: bl});
      // earlier case's name on the board's lower rail
      const al = showKey ? ctx.fit(`${t.earlierCase}: ${p.cases.a.name}`, {maxWidth: sw * 0.7, size: 23, minSize: 16, maxLines: 1, weight: 700}) : null;
      const aTag = al ? g(null,
        h('path', {d: roundRectPath(bx + board.w / 2 - al.width / 2 - 14, by + board.h - 14 - 17, al.width + 28, 34, 6), fill: '#fbf5e4', stroke: '#6f4b2d', 'stroke-width': 1.4}),
        textBlock(al, {x: bx + board.w / 2, y: by + board.h - 14 - al.height / 2, anchor: 'middle', fill: th.ink})) : null;
      // header: letter badge + (from the change beat) label and caption
      const sc = i === 0 ? p.scenarioA : p.scenarioB;
      const hx = pp.x, hy = pp.y;
      const br = S.headerH * 0.34;
      const color = i === 0 ? th.accent4 : th.accent3;
      const headParts = [h('circle', {cx: r(hx + br + 2), cy: r(hy + S.headerH * 0.46), r: r(br), fill: color, stroke: th.ink, 'stroke-width': 2.5})];
      if (showKey) headParts.push(h('text', {x: r(hx + br + 2), y: r(hy + S.headerH * 0.46 + br * 0.42), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(br * 1.2), 'font-weight': 800, fill: '#fff'}, i === 0 ? 'A' : 'B'));
      const labNodes = [];
      if (showKey) {
        const lw = S.PW - 2 * br - 30;
        const lf = ctx.fit(sc.label, {maxWidth: lw * (sc.caption && showAll ? 0.52 : 1), size: 33, minSize: 22, maxLines: 1, weight: 700});
        labNodes.push(textBlock(lf, {x: hx + 2 * br + 18, y: hy + S.headerH * 0.46 - lf.size * 0.55, fill: th.fg}));
        if (sc.caption && showAll) {
          const cf = ctx.fit(sc.caption, {maxWidth: lw - lf.width - 24, size: 25, minSize: 18, maxLines: 2, weight: 500});
          labNodes.push(textBlock(cf, {x: hx + 2 * br + 18 + lf.width + 22, y: hy + S.headerH * 0.46 - cf.height / 2, fill: th.fgSoft}));
        }
      }
      const header = g(null, headParts, g({name: `${P}head`, opacity: 0}, labNodes));
      return {i, P, R, ov, tb, flap, ring, ringLen, ringNode, battenNode, aTag, header, bRest, aAt, board: {x: bx, y: by, w: board.w, h: board.h}, fy0};
    });

    // --- comparison guide: leaves each changed-slot ring on its right side (the
    // slot ends its row) and runs outside the sheets: tall boxes down the right
    // margin, wide boxes up the right rail of each board and across just above
    // the boards
    const [pA, pB] = panels;
    const ringBox = pnl => ({x: pnl.aAt.x + pnl.ring.x, y: pnl.aAt.y + pnl.ring.y, w: pnl.ring.w, h: pnl.ring.h});
    const rA = ringBox(pA), rB = ringBox(pB);
    let pts, a0, b0, lane = null, bridgeY = null;
    a0 = {x: rA.x + rA.w, y: rA.y + rA.h / 2};
    b0 = {x: rB.x + rB.w, y: rB.y + rB.h / 2};
    if (S.column) {
      lane = D.w - M - 14;
      pts = [a0, {x: lane, y: a0.y}, {x: lane, y: b0.y}, b0];
    } else {
      const railX = pnl => pnl.board.x + pnl.board.w - 14 - rail / 2;
      bridgeY = Math.min(pA.board.y, pB.board.y) - 4;
      pts = [a0, {x: railX(pA), y: a0.y}, {x: railX(pA), y: bridgeY}, {x: railX(pB), y: bridgeY}, {x: railX(pB), y: b0.y}, b0];
    }
    const rounded = roundedPath(pts, 22);
    const guideLen = pathLen(pts);
    const guide = g({name: 'guide', opacity: 0},
      h('path', {d: rounded, fill: 'none', stroke: th.paper, 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.85}),
      h('path', {name: 'guide-line', d: rounded, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(guideLen)} ${r(guideLen + 10)}`, 'stroke-dashoffset': r(guideLen)}),
      h('circle', {name: 'guide-dA', cx: r(a0.x), cy: r(a0.y), r: 7, fill: th.ink}),
      h('circle', {name: 'guide-dB', cx: r(b0.x), cy: r(b0.y), r: 7, fill: th.ink, opacity: 0}));

    // --- in the vacated upper part of the boards: guide label, rule tag, states, notes
    const vac = pnl => ({x: pnl.aAt.x, y: pnl.bRest.y - 4, w: sw, h: pnl.aAt.y - 46 - (pnl.bRest.y - 4)});
    const vA = vac(pA), vB = vac(pB);
    const notes = [];
    const dropped = [];
    let droppedH = 0;
    const blocks = [];
    const TS = S.column ? 24 : 25;
    const gl = p.comparisonLabels.guide || t.onlyThisChanges;
    let guideChip = null, tick = null;
    if (showKey && gl) {
      if (S.column) {
        // right-aligned in board B's vacated band, tied to the margin lane by a tick
        const maxW = Math.min(440, vB.w - 40);
        const probe = chip(ctx, gl, {x: 0, y: 0, maxWidth: maxW, size: TS + 3, maxLines: 2, weight: 700});
        const cy = vB.y + vB.h - probe.box.h - 6;
        guideChip = chip(ctx, gl, {x: lane - 20, y: cy, anchor: 'end', maxWidth: maxW, size: TS + 3, maxLines: 2, weight: 700, fill: '#fff4d6', stroke: th.ink, name: 'guideLabel'});
        tick = {x1: guideChip.box.x + guideChip.box.w, y1: guideChip.box.cy, x2: lane, y2: guideChip.box.cy};
      } else {
        // under the bridge, centred over the gap between the boards, tied to it by a tick
        const gx = (pA.board.x + pA.board.w + pB.board.x) / 2;
        const maxW = Math.min(440, sw * 0.7);
        guideChip = chip(ctx, gl, {x: gx, y: bridgeY + 34, anchor: 'middle', maxWidth: maxW, size: TS + 3, maxLines: 2, weight: 700, fill: '#fff4d6', stroke: th.ink, name: 'guideLabel'});
        tick = {x1: gx, y1: guideChip.box.y, x2: gx, y2: bridgeY};
      }
      blocks.push(guideChip.box);
    }
    // states: centred over each ring, just above the landed batten
    const states = [];
    if (showKey) {
      panels.forEach(pnl => {
        const F = pnl.R.features[k];
        const word = F.kind === 'shared' ? t.coincides : F.kind === 'differs' ? t.differs : t.onlyOne;
        const txt = `${word} · ${t.asSupplied}`;
        const v = vac(pnl);
        const rb = ringBox(pnl);
        const probe = chip(ctx, txt, {x: 0, y: 0, maxWidth: Math.min(360, v.w * 0.6), size: TS - 1, maxLines: 2, weight: 700});
        let cx = clamp(rb.x + rb.w / 2, v.x + probe.box.w / 2 + 6, v.x + v.w - probe.box.w / 2 - 6);
        let cy = v.y + v.h - probe.box.h - 6;
        // keep clear of the guide label
        const box0 = {x: cx - probe.box.w / 2, y: cy, w: probe.box.w, h: probe.box.h};
        if (guideChip && overlaps(box0, guideChip.box, 10)) cy = guideChip.box.y - probe.box.h - 12;
        const c = chip(ctx, txt, {x: cx, y: cy, anchor: 'middle', maxWidth: Math.min(360, v.w * 0.6), size: TS - 1, maxLines: 2, weight: 700, fill: th.card, stroke: F.kind === 'shared' ? I.m.ink : th.ink, name: `${pnl.P}state`});
        states.push({P: pnl.P, c});
        blocks.push(c.box);
      });
    }
    // rule tag (text as supplied) with the socket of the changed feature
    let ruleTag = null;
    {
      const rule = p.rules[0];
      const w = Math.min(S.column ? 600 : 640, vA.w - 30);
      const ss = 30;
      const nameF = showAll ? ctx.fit(rule.name || t.ruleCard, {maxWidth: w - 2 * ss - 46, size: TS, minSize: 17, maxLines: 1, weight: 700}) : null;
      const textF = showAll ? ctx.fit(rule.text, {maxWidth: w - 2 * ss - 46, size: TS - 1, minSize: 16, maxLines: 3, weight: 500, family: 'serif'}) : null;
      const hh = Math.max(2 * ss + 22, (nameF ? nameF.height + 8 : 0) + (textF ? textF.height : 0) + 28);
      // highest free spot in board A's band, else board B's, else the footer
      let x = 0, y = 0, found = false;
      const footHosts0 = !S.foot ? [] : S.column ? [S.foot] : [{...S.foot, w: S.foot.w / 2 - 10}, {...S.foot, x: S.foot.x + S.foot.w / 2 + 10, w: S.foot.w / 2 - 10}];
      for (const host of S.column ? [...footHosts0, vA, vB] : [vA, vB, ...footHosts0]) {
        if (host.w < w) continue;
        x = footHosts0.includes(host) ? host.x + 10 : host.x + (host.w - w) / 2;
        for (y = host.y + 10; y <= host.y + host.h - hh; y += 8) {
          if (!blocks.some(bb => overlaps({x, y, w, h: hh}, bb, 8))) { found = true; break; }
        }
        if (found) break;
      }
      if (!found) { x = vA.x + (vA.w - w) / 2; y = vA.y + 10; dropped.push('rule'); droppedH += hh + 16; }
      const F = RA.features[k];
      ruleTag = {box: {x, y, w, h: hh}, node: g({name: 'ruleTag', opacity: 0},
        h('path', {d: roundRectPath(x + 5, y + 7, w, hh, 10), fill: th.shadow}),
        h('path', {d: roundRectPath(x, y, w, hh, 10), fill: '#fffaf0', stroke: th.ink, 'stroke-width': 2.2}),
        h('circle', {cx: r(x + 16 + ss), cy: r(y + hh / 2), r: ss + 3, fill: '#fffaf0', stroke: th.ink, 'stroke-width': 2.5}),
        h('circle', {cx: r(x + 16 + ss), cy: r(y + hh / 2), r: ss - 3, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.5}),
        g({transform: T(x + 16 + ss, y + hh / 2)}, pictogram(F.icon, {s: ss * 1.3, ink: th.ink, soft: '#ffffff'})),
        nameF ? textBlock(nameF, {x: x + 2 * ss + 32, y: y + 14, fill: th.ink}) : null,
        textF ? textBlock(textF, {x: x + 2 * ss + 32, y: y + 14 + (nameF ? nameF.height + 8 : 0), fill: th.ink, italic: true}) : null,
        showAll ? null : [h('rect', {x: r(x + 2 * ss + 32), y: r(y + 20), width: r((w - 2 * ss - 52) * 0.5), height: 12, rx: 6, fill: th.ink, opacity: 0.7}), h('rect', {x: r(x + 2 * ss + 32), y: r(y + 42), width: r((w - 2 * ss - 52) * 0.8), height: 9, rx: 4.5, fill: th.paperLine})])};
      blocks.push(ruleTag.box);
    }
    // neutral note (+ shared-facts footnote, issue, assumption): first free
    // spot scanning each board's vacated band from the top
    const noteTexts = [];
    if (showAll && p.comparisonLabels.neutral) noteTexts.push({key: 'neutral', text: p.comparisonLabels.neutral, size: TS, weight: 600});
    if (showAll && p.sharedFacts.length) noteTexts.push({key: 'shared', text: `${t.sameInBoth}: ${p.sharedFacts.join(' · ')}`, size: TS - 4, weight: 500});
    if (S.column && showAll && p.issues.length + p.assumptions.length > 0) {
      // tall boxes: issue and assumptions share one compact footnote
      const parts = [];
      if (p.issues.length) parts.push(`${t.issue}: ${p.issues[0]}`);
      parts.push(...p.assumptions.map(a => `${t.assumption}: ${a}`));
      noteTexts.push({key: 'issue', text: parts.join(' · '), size: TS - 5, weight: 500});
    } else {
      if (showAll && p.issues.length) noteTexts.push({key: 'issue', text: `${t.issue}: ${p.issues[0]}`, size: TS - 2, weight: 600});
      if (showAll && p.assumptions.length) noteTexts.push({key: 'assume', text: p.assumptions.map(a => `${t.assumption}: ${a}`).join(' · '), size: TS - 5, weight: 500});
    }
    // wide boxes: a footer band is split in two halves (one under each board)
    const footHosts = !S.foot ? [] : S.column ? [S.foot] : [{...S.foot, w: S.foot.w / 2 - 10}, {...S.foot, x: S.foot.x + S.foot.w / 2 + 10, w: S.foot.w / 2 - 10}];
    const hosts = S.column ? [...footHosts, vA, vB] : [vA, vB, ...footHosts];
    for (const nt of noteTexts) {
      let placed = null;
      for (const host of hosts) {
        for (const [anchor, frac] of [['middle', 1], ['start', 1], ['end', 1], ['start', 0.5], ['end', 0.5], ['end', 0.34], ['start', 0.34]]) {
          const maxW = (host.w - 40) * frac;
          const probe = chip(ctx, nt.text, {x: 0, y: 0, maxWidth: maxW, size: nt.size, minSize: 16, maxLines: 5, weight: nt.weight, padY: nt.size * 0.3});
          if (probe.fit.truncated) continue;
          const bw = probe.box.w, bh = probe.box.h;
          const x = anchor === 'middle' ? host.x + host.w / 2 : anchor === 'start' ? host.x + 16 : host.x + host.w - 16;
          const x0 = anchor === 'middle' ? x - bw / 2 : anchor === 'start' ? x : x - bw;
          for (let y = host.y + 10; y <= host.y + host.h - bh; y += 6) {
            const box = {x: x0, y, w: bw, h: bh};
            if (blocks.some(bb => overlaps(box, bb, 6))) continue;
            placed = chip(ctx, nt.text, {x, y, anchor, maxWidth: maxW, size: nt.size, minSize: 16, maxLines: 5, weight: nt.weight, padY: nt.size * 0.3, fill: nt.key === 'neutral' ? th.card : th.paper, stroke: nt.key === 'neutral' ? th.inkSoft : 'none', color: nt.key === 'neutral' ? th.ink : th.inkSoft, name: `note-${nt.key}`});
            break;
          }
          if (placed) break;
        }
        if (placed) break;
      }
      if (placed) {
        notes.push({key: nt.key, c: placed});
        blocks.push(placed.box);
      } else {
        dropped.push(nt.key);
        droppedH += chip(ctx, nt.text, {x: 0, y: 0, maxWidth: (S.foot ? S.foot.w : sw) - 40, size: nt.size, minSize: 16, maxLines: 3, weight: nt.weight, padY: nt.size * 0.3}).box.h + 10;
      }
    }
    return {S, geo, sw, sh, panels, k, RA, RB, guide, guideLen, a0, b0, guideChip, tick, ruleTag, states, notes, dropped, droppedH};
  },
  build(ctx, L) {
    return g(null,
      L.panels.map(pnl => g(null,
        pnl.header,
        pnl.tb.node,
        g({transform: T(pnl.aAt.x, pnl.aAt.y)}, pnl.ov.sheetA),
        pnl.tb.pegs,
        g({name: `${pnl.P}sheetB`, transform: T(pnl.bRest.x, pnl.bRest.y)}, pnl.ov.sheetB, pnl.flap, pnl.battenNode),
        g({name: `${pnl.P}overlay`, transform: T(pnl.aAt.x, pnl.aAt.y)}, pnl.ov.overlay),
        pnl.aTag,
        pnl.ringNode,
      )),
      L.guide,
      L.ruleTag && L.ruleTag.node,
      L.guideChip && g({name: 'guideChip', opacity: 0},
        L.tick ? h('line', {x1: r(L.tick.x1), y1: r(L.tick.y1), x2: r(L.tick.x2), y2: r(L.tick.y2), stroke: ctx.theme.ink, 'stroke-width': 2.5, 'stroke-dasharray': '6 5'}) : null,
        L.guideChip.node),
      L.states.map(s => g({name: `${s.P}stateW`, opacity: 0}, s.c.node)),
      L.notes.map(n => g({name: `${n.key}W`, opacity: 0}, n.c.node)),
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const nodes = {};
    const lift = ease.inOutCubic(seg(u, ...W.flap));
    const labels = seg(u, ...W.labels);
    const slide = ease.inOutCubic(seg(u, ...W.slide));
    const landed = u >= W.slide[1];
    const q = seg(u, ...W.reveal);
    const per = L.panels.map(pnl => {
      // flap folds up about its top edge, then fades
      const sy = 1 - 1.3 * lift;
      nodes[`${pnl.P}flap`] = {opacity: r(1 - seg(u, W.flap[0] + 0.06, W.flap[1]), 3), transform: Math.abs(sy - 1) > 1e-6 ? `translate(0 ${r(pnl.fy0)}) scale(1 ${r(Math.abs(sy) < 0.02 ? 0.02 * Math.sign(sy || 1) : sy, 4)}) translate(0 ${r(-pnl.fy0)})` : ''};
      nodes[`${pnl.P}head`] = {opacity: r(labels, 3)};
      // the new case's sheet slides down the rails onto the pegs
      const y = pnl.bRest.y + (pnl.aAt.y - pnl.bRest.y) * slide;
      nodes[`${pnl.P}sheetB`] = {transform: T(pnl.bRest.x, y)};
      const bBox = {x: pnl.bRest.x, y, w: L.sw, h: L.sh};
      const ov = overlayFrame(ctx, pnl.ov, {P: pnl.P, geo: L.geo, aOrigin: pnl.aAt, bBox, landed, q, reduced});
      Object.assign(nodes, ov.nodes);
      // brief pulse on the revealed print of the changed feature
      const pr = pnl.ov.pr.b.find(x => x.f === L.k);
      if (pr) {
        const pulse = reduced ? 1 : 1 + 0.12 * Math.sin(Math.PI * seg(u, ...W.pulse));
        nodes[`${pnl.P}pb${L.k}-pic`] = {transform: `${T(pr.cell.pc.x, pr.cell.pc.y)} scale(${r(pulse, 4)})`};
      }
      return {y, ov, F: pnl.R.features[L.k]};
    });
    // guide: rings, line, label, rule, states, notes
    const ring = seg(u, ...W.rings);
    L.panels.forEach(pnl => { nodes[`${pnl.P}ring`] = {opacity: r(ring, 3)}; });
    const gp = ease.inOutCubic(seg(u, ...W.guide));
    nodes.guide = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-line'] = {'stroke-dashoffset': r(L.guideLen * (1 - gp))};
    nodes['guide-dB'] = {opacity: gp >= 0.99 ? 1 : 0};
    if (L.guideChip) nodes.guideChip = {opacity: r(seg(u, W.guide[1] - 0.04, W.guide[1] + 0.03), 3)};
    if (L.ruleTag) nodes.ruleTag = {opacity: r(seg(u, ...W.rule), 3)};
    const st = seg(u, ...W.states);
    L.states.forEach(s => { nodes[`${s.P}stateW`] = {opacity: r(st, 3)}; });
    L.notes.forEach(n => { nodes[`${n.key}W`] = {opacity: r(seg(u, ...W.note), 3)}; });

    const P2 = q2 => ({x: r(q2.x), y: r(q2.y)});
    const kindsA = L.RA.features.map(F => F.kind);
    const kindsB = L.RB.features.map(F => F.kind);
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.action[1] ? 'action' : 'guide',
      scenes: L.panels.length,
      changedFeature: L.k,
      kindsA, kindsB,
      differsAt: kindsA.map((kind, i) => (kind !== kindsB[i] ? i : -1)).filter(i => i >= 0),
      flapLift: r(lift, 3),
      flapsCover: lift === 0,
      labelsShown: r(labels, 3),
      sheetBA: P2({x: L.panels[0].bRest.x, y: per[0].y}),
      sheetBB: P2({x: L.panels[1].bRest.x, y: per[1].y}),
      slideA: r((per[0].y - L.panels[0].bRest.y) / (L.panels[0].aAt.y - L.panels[0].bRest.y), 3),
      slideB: r((per[1].y - L.panels[1].bRest.y) / (L.panels[1].aAt.y - L.panels[1].bRest.y), 3),
      landed,
      mergeA: per[0].ov.mergeState,
      mergeB: per[1].ov.mergeState,
      badgesA: per[0].ov.badgesShown,
      badgesB: per[1].ov.badgesShown,
      changedA: per[0].F.kind,
      changedB: per[1].F.kind,
      rings: r(ring, 3),
      guide: r(gp, 3),
      guideEnds: [P2(L.a0), P2(L.b0)],
      ringEdges: L.panels.map(pnl => P2({x: pnl.aAt.x + pnl.ring.x + pnl.ring.w, y: pnl.aAt.y + pnl.ring.y + pnl.ring.h / 2})),
      changedAtRowEnd: Boolean(L.geo.unitCells[L.k] && L.geo.unitCells[L.k].last),
      arrangement: L.S.column ? 'column' : 'row',
      notesShown: L.notes.map(n => n.key),
      notesDropped: L.dropped,
      outcome: null,
      winner: null,
    };
    return {nodes, semantic};
  },
};

/** Polyline path with rounded corners. */
function roundedPath(pts, rad) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, l1 / 2, l2 / 2);
    const p1 = {x: b.x + ((a.x - b.x) / (l1 || 1)) * rr, y: b.y + ((a.y - b.y) / (l1 || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (l2 || 1)) * rr, y: b.y + ((c.y - b.y) / (l2 || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  const z = pts[pts.length - 1];
  return `${d}L${r(z.x)} ${r(z.y)}`;
}

function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

function pathLen(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return s;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-02-contrast',
    title: 'Case analogy — the same overlay with one feature changed',
    titleEs: 'Analogía de casos — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Analogía de casos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical wall tracing boards: a flap on the new case’s sheet folds up to reveal the changed feature — the same print as the earlier case in A, a different print beside it in B — then both sheets slide down onto the pegs in parallel; the feature merges in A and stays side by side in B. A guide joins the changed slot in both boards; no winner or outcome.',
    tags: ['reasoning', 'analogy', 'contrast', 'tracing paper', 'overlay', 'registration', 'similarity', 'difference', 'rule', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/analogia-de-casos.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: ANALOGY_STRINGS,
  scene,
});
