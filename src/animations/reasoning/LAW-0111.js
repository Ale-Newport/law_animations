/**
 * LAW-0111 — Premisa oculta · contrast
 *
 * Storyboard (two complete, identical reading boards; no hands — the cards
 * run on the board's slide and the magnifier is an instrument):
 *  0.00–0.17 base      Two identical boards, A and B, each with the same fact
 *                      card and conclusion card pushed together over the same
 *                      pocket, the same brass hinges folded back and the same
 *                      magnifier at rest. Only neutral A / B badges; nothing
 *                      differs (the intermediate card is covered on both).
 *  0.17–0.40 change    One localized, explicit change per board: a large
 *                      marker clip slides in and grips the fact card's outer
 *                      edge (sticking out into the free margin, clear of the
 *                      hinges and of every text) — in A a printed clip with
 *                      quotation marks (premise STATED in the argument), in B a
 *                      pencil clip with an ellipsis (premise LEFT UNSTATED).
 *                      Each lane's label and caption appear with its clip.
 *  0.40–0.77 parallel  Both boards open in lockstep: the same gap uncovers the
 *                      same intermediate card (same supplied text). Only the
 *                      contrasted circumstance adapts the rest, as supplied:
 *                      the stated card is printed, both hinges swing over and
 *                      latch it into the walk and it lifts flush; the unstated
 *                      card is pencil, the hinges stay folded, it stays loose
 *                      in its pocket and the magnifier goes to read it and
 *                      comes back. (Geometry and sequence differ, not only
 *                      colour or text.)
 *  0.77–1.00 guide     The boards slide up to make room for a compact band (they
 *                      are centred in the frame while the band is empty). A
 *                      comparison guide joins the two intermediate cards through
 *                      free space only and carries the changed-fact chip (wide
 *                      boxes: across the gap between the boards and down into
 *                      the chip under it; stacked: through the chip, which sits
 *                      between the boards); a neutral note, the shared facts,
 *                      issues and assumptions, and the key "as supplied · no
 *                      conclusion drawn". No winner, score or outcome. All of it
 *                      settles by 0.85 (a > 1 s readable hold).
 * Wide boxes: boards side by side, each walk running top → bottom. Tall boxes:
 * boards stacked, each walk running left → right, with B's header under B's
 * board (only the guide lies between the boards). Square boxes use whichever
 * of the two arrangements gives the larger card text.
 * Legal content: fictional, jurisdiction unspecified; statuses as supplied.
 * @module animations/reasoning/LAW-0111
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {balancedWidth} from '../causation/kits/place.js';
import {
  poFields, premiseStatusField, PO_STRINGS, DEFAULT_CONTENT, walkGeometry, shiftWalk, cardArt, boardArt, recessShade, hingeArt, walkCopy,
  lupaArt, keyChip, centerOf, unitsPer1080px, poColors, badgeArt, quoteGlyph, ellipsisGlyph, markChip,
} from './kits/premisa-oculta.js';
import {shade} from '../../primitives/paper.js';

const ID = 'LAW-0111';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  badges: [0.01, 0.08], clip: [0.19, 0.3], lanes: [0.27, 0.35],
  open: [0.41, 0.56], latchF: [0.57, 0.62], latchC: [0.6, 0.65], lift: [0.645, 0.69],
  lupaGo: [0.575, 0.635], lupaBack: [0.69, 0.75],
  // the boards slide up for the band, then guide, notes and band; everything settles by 0.85 (> 1 s hold)
  cam: [0.765, 0.795], guide: [0.79, 0.825], note: [0.815, 0.845], band: [0.82, 0.85],
};
const M = 24;
const P2 = q => ({x: r(q.x), y: r(q.y)});

const EXTRA = {
  en: {sameInBoth: 'Same in both', neutralDefault: 'Two supplied versions side by side — no conclusion is drawn'},
  es: {sameInBoth: 'Igual en ambos', neutralDefault: 'Dos versiones aportadas, lado a lado — sin conclusión'},
};
const STRINGS = {en: {...PO_STRINGS.en, ...EXTRA.en}, es: {...PO_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...poFields,
  statusA: {...premiseStatusField, description: `Scenario A — ${premiseStatusField.description}`},
  statusB: {...premiseStatusField, description: `Scenario B — ${premiseStatusField.description}`},
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: str('The single circumstance that differs between A and B (shown on the comparison guide)', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  statusA: 'stated',
  statusB: 'unstated',
  scenarioA: {label: 'Premise stated', caption: 'The argument states the intermediate premise'},
  scenarioB: {label: 'Premise left unstated', caption: 'The same argument leaves it unstated'},
  changedFact: 'Whether the argument states the intermediate premise',
  sharedFacts: ['same fact card', 'same conclusion card', 'same premise text'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'Two supplied versions side by side — no conclusion is drawn about either'},
};

const SHAPES = {
  landscape: {arr: 'row', axis: 'y', size: 64},
  square: {arr: 'column', axis: 'x', size: 58},
  portrait: {arr: 'column', axis: 'x', size: 58},
};
const SQUARE_ROW = {arr: 'row', axis: 'y', size: 62};

/**
 * Marker clip gripping an edge: printed quotation marks (stated) or a pencil ellipsis (unstated). Local origin =
 * the grip point on the edge; the body extends along +x (onto the card), the glyph stays upright (counter-rotated).
 */
function clipArt(ctx, name, status, w, hh, ang) {
  const th = ctx.theme;
  const col = poColors(ctx);
  const stated = status === 'stated';
  return g({name, opacity: 0},
    h('path', {d: roundRectPath(w * 0.12 + 5, -hh / 2 + 7, w * 0.88, hh, 10), fill: th.shadow}),
    h('rect', {x: r(-w * 0.06), y: r(-hh * 0.2), width: r(w * 0.26), height: r(hh * 0.4), rx: r(hh * 0.1), fill: th.metal, stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: `M${r(w * 0.14)} ${r(-hh / 2)}H${r(w - 10)}Q${r(w)} ${r(-hh / 2)} ${r(w)} ${r(-hh / 2 + 10)}V${r(hh / 2 - 10)}Q${r(w)} ${r(hh / 2)} ${r(w - 10)} ${r(hh / 2)}H${r(w * 0.14)}Z`, fill: stated ? col.premise : '#fbf8f1', stroke: stated ? th.ink : col.pencil, 'stroke-width': 3, 'stroke-dasharray': stated ? undefined : '8 6', 'stroke-linejoin': 'round'}),
    g({transform: `translate(${r(w * 0.58)} 0) rotate(${r(-ang)})`}, stated ? quoteGlyph(hh * 0.72, '#ffffff') : ellipsisGlyph(hh * 0.78, col.pencil)));
}

function compose(ctx, s, S = SHAPES[ctx.view.shape]) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const row = S.arr === 'row';
  const u = unitsPer1080px(ctx);
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  // notes: ~21 px, but in text-dense layouts they shrink with the card text (never below ~16.5 px, never above it)
  let ns = Math.min(s, Math.max(Math.min(21 * u, s), 16.5 * u));
  const R = clamp(s * 1.35, 40, 66);
  const Lh = R * 1.35;
  // the changed-fact marker: a large clip gripping the fact card's outer edge, in the margin left of the board
  const mW = s * 2.3, mH = s * 1.9;
  const lm = mW + 10;
  const bandW = D.w - 2 * M;
  const guideText = showAll ? [p.comparisonLabels.guide, p.changedFact].filter(Boolean).join(' — ') : null;
  const panelW0 = row ? (D.w - 2 * M - Math.max(70, s * 2)) / 2 : D.w - 2 * M;
  const common = {s, u, show: showKey, maxLines: 9, tabs: false, kinds: {fact: t.factKind, premise: t.premiseKind, conclusion: t.conclusionKind}, texts: {fact: p.facts, premise: p.rules, conclusion: p.conclusion}};
  let g0;
  if (S.axis === 'y') {
    // walk down the panel (full width but the marker margin); the magnifier rests in the header band, top right
    g0 = walkGeometry(ctx, {...common, axis: 'y', x: lm, y: 0, width: panelW0 - lm - 8});
  } else {
    // horizontal walk; the magnifier rests to the right of the board (handle down)
    const cw = (panelW0 - lm - 8 - 2 * Math.max(10, s * 0.42) - (2 * R + 34)) / 3;
    g0 = walkGeometry(ctx, {...common, axis: 'x', x: lm, y: 0, cw});
  }
  // no chip or lane label reads larger than the (fitted) card text
  const cardMin = Math.min(...g0.bodySizes);
  ns = Math.min(ns, cardMin);
  const labSize = Math.min(Math.max(s * 0.9, 22 * u), ns * 1.5, cardMin);
  const mkChip = (txt, w, ml, weight = 600) => {
    const bw = balancedWidth(ctx, txt, {maxWidth: w, size: ns, minSize: ns, maxLines: ml, weight});
    return {...chip(ctx, txt, {x: 0, y: 0, maxWidth: bw, size: ns, minSize: ns, maxLines: ml, weight}), bw, ml};
  };
  // stacked: the guide chip lies ON the guide in the gap between the two boards (no leader needed)
  const guideC = guideText ? mkChip(guideText, row ? (bandW - 48) / 4 : Math.min(bandW, panelW0 * 0.8), row ? 6 : 3, 700) : null;
  const gapP = row ? Math.max(70, s * 2) : Math.max(40, s * 1.3, guideC ? guideC.box.h + 44 : 0);
  const panelW = panelW0;
  const tl = s * 1.15;
  // lane header: badge + label (+ caption); both lanes use one size and one height
  const badgeR = labSize * 0.72;
  const textX = badgeR * 2 + 14;
  const headW = panelW - textX - (S.axis === 'y' ? 2 * R + 40 : 0);
  const lf = sc => (showKey ? ctx.fit(sc.label, {maxWidth: headW, size: labSize, minSize: labSize, maxLines: 2, weight: 700}) : null);
  const cf = sc => (showAll && sc.caption ? ctx.fit(sc.caption, {maxWidth: headW, size: ns, minSize: ns, maxLines: 2, weight: 500}) : null);
  const heads = [p.scenarioA, p.scenarioB].map(sc => ({l: lf(sc), c: cf(sc)}));
  const capGap = labSize * 0.32 + 6;
  const headH = Math.max(badgeR * 2 + 6, S.axis === 'y' ? 2 * R + 14 : 0, ...heads.map(hd => (hd.l ? hd.l.height : 0) + (hd.c ? hd.c.height + capGap : 0))) + 12;
  // shift so the board starts just under the header
  const geo = shiftWalk(g0, 0, headH + 10 - g0.board.y);
  const Bd = geo.board;
  const pc = centerOf(geo.boxes.premise);
  // magnifier rest (panel-local) and its reading spot over the premise
  let rest;
  if (S.axis === 'y') rest = {c: {x: panelW - R - 30, y: Bd.y - 10 - R - 4}, angle: 25};
  else rest = {c: {x: Bd.x + Bd.w + tl * 0.4 + 12 + R, y: Bd.y + R + 4}, angle: 62};
  const lupaBottom = S.axis === 'y' ? Bd.y + Bd.h : Math.max(Bd.y + Bd.h, rest.c.y + R + Math.sin(rest.angle * Math.PI / 180) * Lh + 10);
  const panelH = lupaBottom + 6;
  // band: key, neutral note, shared facts (+ assumptions and issues); on wide boxes also the guide chip
  const shared = showAll ? [...p.sharedFacts, ...p.assumptions.map(a => `${t.assumed}: ${a}`), ...p.issues.map(q => `${t.issue}: ${q}`)] : [];
  const sharedText = shared.length ? `${t.sameInBoth}: ${shared.join(' · ')}` : null;
  const neutralText = showAll ? (p.comparisonLabels.neutral || t.neutralDefault) : null;
  const keyStatus = p.statusA === p.statusB ? p.statusA : 'both';
  // compact band. Wide boxes: [key over neutral note] | [guide chip, centred under the gap between the boards] |
  // [shared facts]. Stacked: the guide chip is on the guide between the boards; key | neutral | shared side by side
  // when the band is wide enough, else stacked.
  let band;
  if (row) {
    const wG = Math.min(bandW * 0.3, 560), wS = (bandW - wG - 32) / 2;
    const keyC = showKey ? keyChip(ctx, keyStatus, {x: 0, y: 0, size: ns, maxWidth: wS, maxLines: 4}) : null;
    const neutralC = neutralText ? mkChip(neutralText, wS, 5, 500) : null;
    const sharedC = sharedText ? mkChip(sharedText, wS, 12) : null;
    const gC = guideText ? mkChip(guideText, wG, 6, 700) : null;
    const leftH = (keyC ? keyC.box.h : 0) + (keyC && neutralC ? 8 : 0) + (neutralC ? neutralC.box.h : 0);
    const b1 = {kind: 'row', wG, wS, keyC, neutralC, sharedC, gC, items: [keyC, neutralC, sharedC, gC], h: Math.max(leftH, gC ? gC.box.h : 0, sharedC ? sharedC.box.h : 0)};
    // alternative for long shared texts: key | guide | neutral on one row, the shared facts full width underneath
    const sharedW = sharedText ? mkChip(sharedText, bandW, 6) : null;
    const top2 = Math.max(keyC ? keyC.box.h : 0, gC ? gC.box.h : 0, neutralC ? neutralC.box.h : 0);
    const b2 = {kind: 'row2', wG, wS, keyC, neutralC, sharedC: sharedW, gC, items: [keyC, neutralC, sharedW, gC], h: top2 + (sharedW ? 10 + sharedW.box.h : 0)};
    const bad = B => B.items.some(c => c && c.fit.truncated);
    band = !bad(b2) && (bad(b1) || b2.h < b1.h - 1) ? b2 : b1;
  } else {
    const cols = bandW >= 1000 ? 3 : 1;
    const cw = (bandW - 16 * (cols - 1)) / cols;
    const keyC = showKey ? keyChip(ctx, keyStatus, {x: 0, y: 0, size: ns, maxWidth: cw, maxLines: 4}) : null;
    const neutralC = neutralText ? mkChip(neutralText, cw, 5, 500) : null;
    const sharedC = sharedText ? mkChip(sharedText, cw, 12) : null;
    const it = [keyC, neutralC, sharedC].filter(Boolean);
    band = {kind: cols === 3 ? 'cols' : 'stack', cw, keyC, neutralC, sharedC, items: [keyC, neutralC, sharedC], h: cols === 3 ? Math.max(0, ...it.map(c => c.box.h)) : it.reduce((a, c) => a + c.box.h + 8, it.length ? -8 : 0)};
  }
  const trunc = B => B.items.some(c => c && c.fit.truncated);
  const bandH = band.h;
  const totalH = row ? panelH + 14 + bandH : panelH * 2 + gapP + 14 + bandH;
  const truncated = geo.truncated || heads.some(hd => (hd.l && hd.l.truncated) || (hd.c && hd.c.truncated)) || trunc(band) || (guideC && guideC.fit.truncated);
  return {
    s, u, row, ns, labSize, capGap, letter: Math.max(Math.min(labSize, ns) * 0.8, Math.min(16.2 * u, ns)), gapP, panelW, panelH, headH, heads, badgeR, textX, geo, R, Lh, rest, pc, bandH, totalH,
    guideC: row ? band.gC : guideC, band, guideText, neutralText, sharedText, tl, mW, mH,
    fits: totalH <= D.h - 2 * M + 0.5 && !truncated && (S.axis === 'x' || geo.W > 260),
    budget: {totalH: r(totalH), room: r(D.h - 2 * M), tr: [geo.truncated, heads.map(hd => [hd.l && hd.l.truncated, hd.c && hd.c.truncated]), band.items.map(c => c && c.fit.truncated), guideC && guideC.fit.truncated]},
  };
}

/** Everything of one scene (panel-local); `lane` = 'A' | 'B'; status as supplied. */
function sceneNodes(ctx, L, lane, status) {
  const th = ctx.theme;
  const geo = L.geo;
  const P = lane;
  const look = status === 'stated' ? 'stated' : 'unstated';
  const brd = boardArt(ctx, geo, {seedKey: 'po-board'});
  const hF = hingeArt(ctx, geo, 'fact', {name: `${P}hF`});
  const hC = hingeArt(ctx, geo, 'conclusion', {name: `${P}hC`});
  const cl = geo.closed;
  // the changed-fact marker grips the fact card's outer edge and sticks out into the free margin (clear of the
  // hinges and of every text); it rides with the card
  const clipAt = {x: geo.boxes.fact.x + 2, y: geo.boxes.fact.y + geo.boxes.fact.h / 2};
  const clipAng = 180;
  const clip = clipArt(ctx, `${P}clip`, status, L.mW, L.mH, clipAng);
  const copy = walkCopy(ctx, geo, {look, k: status === 'stated' ? 1 : -1, prefix: `${P}lc`});
  const lupa = lupaArt(ctx, {name: `${P}lupa`, R: L.R, handle: L.Lh, copy, zoom: 1.6, lensFill: th.paper});
  const gapId = `${P}gap`;
  const node = g({name: `${P}scene`},
    brd.base, brd.pocket,
    h('defs', null, h('clipPath', {id: ctx.id(gapId)}, h('rect', {name: `${P}gap-r`, x: 0, y: 0, width: 0, height: 0}))),
    g({'clip-path': ctx.ref(gapId)}, g({name: `${P}prm`}, cardArt(ctx, geo, 'premise', {look}), recessShade(ctx, geo, `${P}recess`))),
    g({name: `${P}fact`, transform: T(cl.fact.dx, cl.fact.dy)}, cardArt(ctx, geo, 'fact', {}), hF.fixed, hF.leaf, hF.knuckle, clip),
    g({name: `${P}conc`, transform: T(cl.conclusion.dx, cl.conclusion.dy)}, cardArt(ctx, geo, 'conclusion', {}), hC.fixed, hC.leaf, hC.knuckle),
    lupa.shadows, lupa.view, lupa.prop);
  return {node, hF, hC, lupa, clipAt, clipAng, status};
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const col = poColors(ctx);
  // panel origins (content centred vertically in the room)
  const room = D.h - 2 * M;
  const top = M + Math.max(0, (room - L.totalH) / 2);
  // stacked: B's header goes UNDER B's board, so only the comparison guide lies between the two boards
  L.origins = L.row
    ? [{x: M, y: top}, {x: M, y: top}].map((o, i) => ({x: M + i * (L.panelW + L.gapP), y: top}))
    : [{x: M, y: top}, {x: M, y: top + L.panelH + L.gapP - L.headH}];
  L.scenes = [sceneNodes(ctx, L, 'A', p.statusA), sceneNodes(ctx, L, 'B', p.statusB)];
  // the key names only the statuses actually supplied (one chip when A and B share a status)
  L.used = [p.statusA === p.statusB ? p.statusA : 'both'];
  // headers
  L.headers = [p.scenarioA, p.scenarioB].map((sc, i) => {
    const o = L.origins[i];
    const letter = i ? 'B' : 'A';
    const colr = i ? th.accent2 : th.accent;
    const hd = L.heads[i];
    const hy = !L.row && i === 1 ? o.y + L.panelH + 4 : o.y;
    const by = hy + L.badgeR + 4;
    const badge = g({name: `badge${letter}`, opacity: 0},
      h('circle', {cx: r(o.x + L.badgeR), cy: r(by), r: r(L.badgeR), fill: colr, stroke: th.ink, 'stroke-width': 2.4}),
      ctx.show('key') ? g({'data-role': 'caption'}, h('text', {x: r(o.x + L.badgeR), y: r(by + L.letter * 0.36), 'text-anchor': 'middle', 'font-size': r(L.letter), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, letter)) : null);
    const lab = g({name: `lane${letter}`, opacity: 0},
      hd.l ? g({'data-role': 'content'}, textBlock(hd.l, {x: o.x + L.textX, y: hy + 2, fill: th.fg})) : null,
      hd.c ? g({'data-role': 'content'}, textBlock(hd.c, {x: o.x + L.textX, y: hy + 2 + (hd.l ? hd.l.height + L.capGap : 0), fill: th.fgSoft})) : null);
    return {badge, lab};
  });
  // comparison guide: joins the two intermediate cards through free space only
  const P = L.geo.boxes.premise;
  const Bd = L.geo.board;
  const ink = th.dark ? th.fg : th.ink;
  const bandTop = L.row ? L.origins[0].y + L.panelH + 14 : L.origins[1].y + L.panelH + L.headH + 14;
  const place = (c, x, y, name, weight = 600, stroke = th.ink) => (c ? {
    node: g({name, opacity: 0, 'data-role': 'content'}, markChip(chip(ctx, c.fit.full, {x, y, maxWidth: c.bw, size: L.ns, minSize: L.ns, maxLines: c.ml, weight, fill: th.card, stroke}).node)),
    box: {x, y, w: c.box.w, h: c.box.h},
  } : null);
  let paths = [];
  L.guideChip = null;
  if (L.row) {
    // across the gap between the two boards at the premise's level, then straight down the gap into its chip
    const yM = L.origins[0].y + P.y + P.h / 2;
    const pA = {x: L.origins[0].x + P.x + P.w, y: yM}, gA = {x: L.origins[0].x + Bd.x + Bd.w + 4, y: yM};
    const gB = {x: L.origins[1].x + Bd.x - 4, y: yM}, pB = {x: L.origins[1].x + P.x, y: yM};
    const midX = (gA.x + gB.x) / 2;
    if (L.guideC) {
      const w = L.guideC.box.w;
      L.guideChip = place(L.guideC, clamp(midX - w / 2, M, D.w - M - w), bandTop, 'guide-chip', 700, ink);
    }
    paths = [[pA, gA, gB, pB], L.guideChip ? [{x: midX, y: yM}, {x: midX, y: bandTop}] : null].filter(Boolean);
    L.guideEnds = [pA, pB];
  } else {
    // down from A's card, through its chip (which sits in the gap between the boards), into B's card
    const x = L.origins[0].x + P.x + P.w / 2;
    const pA = {x, y: L.origins[0].y + P.y + P.h}, pB = {x, y: L.origins[1].y + P.y};
    const gapTop = L.origins[0].y + L.panelH, gapBot = L.origins[1].y + Bd.y;
    if (L.guideC) {
      const w = L.guideC.box.w, hh = L.guideC.box.h;
      L.guideChip = place(L.guideC, clamp(x - w / 2, M, D.w - M - w), (gapTop + gapBot) / 2 - hh / 2, 'guide-chip', 700, ink);
    }
    const cy0 = L.guideChip ? L.guideChip.box.y : (gapTop + gapBot) / 2, cy1 = L.guideChip ? L.guideChip.box.y + L.guideChip.box.h : cy0;
    paths = [[pA, {x, y: cy0}], [{x, y: cy1}, pB]];
    L.guideEnds = [pA, pB];
  }
  L.guidePaths = paths.map(pts => pts.reduce((a, q, i) => a + (i ? Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0), 0));
  L.guidePts = paths;
  L.guideNode = g({name: 'guide', opacity: 0},
    paths.map((pts, k) => h('path', {name: `guide-line${k}`, d: pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: ink, 'stroke-width': 3, 'stroke-dasharray': `${r(L.guidePaths[k])} ${r(L.guidePaths[k] + 4)}`, 'stroke-dashoffset': r(L.guidePaths[k]), 'stroke-linejoin': 'round'})),
    h('circle', {cx: r(L.guideEnds[0].x), cy: r(L.guideEnds[0].y), r: 7, fill: ink}),
    h('circle', {name: 'guide-end', cx: r(L.guideEnds[1].x), cy: r(L.guideEnds[1].y), r: 7, fill: ink, opacity: 0}));
  // band
  const B = L.band;
  L.key = [];
  const keyAt = (x, y, w) => { if (B.keyC) L.key.push(keyChip(ctx, p.statusA === p.statusB ? p.statusA : 'both', {x, y, size: L.ns, maxWidth: w, maxLines: 4, name: 'key0'})); };
  if (B.kind === 'row2') {
    const gx0 = L.guideChip ? L.guideChip.box.x : D.w / 2 - B.wG / 2;
    const gx1 = L.guideChip ? L.guideChip.box.x + L.guideChip.box.w : D.w / 2 + B.wG / 2;
    keyAt(M, bandTop, Math.min(B.wS, gx0 - 16 - M));
    L.neutralChip = place(B.neutralC, Math.max(gx1 + 16, D.w - M - (B.neutralC ? B.neutralC.box.w : 0)), bandTop, 'neutral', 500);
    const top2 = Math.max(B.keyC ? B.keyC.box.h : 0, L.guideChip ? L.guideChip.box.h : 0, B.neutralC ? B.neutralC.box.h : 0);
    L.sharedChip = place(B.sharedC, M + (D.w - 2 * M - (B.sharedC ? B.sharedC.box.w : 0)) / 2, bandTop + top2 + 10, 'shared');
  } else if (B.kind === 'row') {
    const gx0 = L.guideChip ? L.guideChip.box.x : D.w / 2 - B.wG / 2;
    const gx1 = L.guideChip ? L.guideChip.box.x + L.guideChip.box.w : D.w / 2 + B.wG / 2;
    const leftW = gx0 - 16 - M, rightX = gx1 + 16;
    keyAt(M, bandTop, Math.min(B.wS, leftW));
    L.neutralChip = place(B.neutralC, M, bandTop + (B.keyC ? B.keyC.box.h + 8 : 0), 'neutral', 500);
    L.sharedChip = place(B.sharedC, Math.max(rightX, D.w - M - (B.sharedC ? B.sharedC.box.w : 0)), bandTop, 'shared');
  } else if (B.kind === 'cols') {
    keyAt(M, bandTop, B.cw);
    L.neutralChip = place(B.neutralC, M + B.cw + 16, bandTop, 'neutral', 500);
    L.sharedChip = place(B.sharedC, M + 2 * (B.cw + 16), bandTop, 'shared');
  } else {
    let y = bandTop;
    keyAt(M, y, B.cw);
    if (B.keyC) y += B.keyC.box.h + 8;
    L.neutralChip = place(B.neutralC, M, y, 'neutral', 500);
    if (B.neutralC) y += B.neutralC.box.h + 8;
    L.sharedChip = place(B.sharedC, M, y, 'shared');
  }
  // camera: while the band is empty the boards are centred in the frame; they slide up for it at the guide beat
  L.camOff = Math.max(0, (L.bandH + 14) / 2);
  return L;
}

/** One scene's state at time u (panel-local). */
function sceneState(L, sc, u, reduced) {
  const geo = L.geo;
  const stated = sc.status === 'stated';
  const pr = ease.inOutCubic(seg(u, ...W.open));
  const off = w => ({dx: geo.closed[w].dx * (1 - pr), dy: geo.closed[w].dy * (1 - pr)});
  const oF = off('fact'), oC = off('conclusion');
  const e = f => (reduced ? ease.outCubic(f) : ease.inOutCubic(f));
  const kF = stated ? -1 + 2 * e(seg(u, ...W.latchF)) : -1;
  const kC = stated ? -1 + 2 * e(seg(u, ...W.latchC)) : -1;
  const lift = stated ? ease.inOutCubic(seg(u, ...W.lift)) : 0;
  const go = stated ? 0 : ease.inOutSine(seg(u, ...W.lupaGo)) * (1 - ease.inOutSine(seg(u, ...W.lupaBack)));
  const clipIn = ease.outCubic(seg(u, ...W.clip));
  const Pm = geo.boxes.premise;
  const gap = L.row
    ? (geo.boxes.conclusion.y + oC.dy) - (geo.boxes.fact.y + geo.boxes.fact.h + oF.dy)
    : (geo.boxes.conclusion.x + oC.dx) - (geo.boxes.fact.x + geo.boxes.fact.w + oF.dx);
  const revealed = clamp(gap / (L.row ? Pm.h : Pm.w));
  const lupaC = {x: lerp(L.rest.c.x, L.pc.x, go), y: lerp(L.rest.c.y, L.pc.y, go)};
  return {pr, oF, oC, kF, kC, lift, go, clipIn, gap, revealed, lupaC};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const search = S => {
      let s = S.size;
      let L = compose(ctx, s, S);
      const tried = [];
      for (let it = 0; it < 24 && !L.fits; it++) {
        tried.push({s: r(s), h: L.budget.totalH, tr: L.budget.tr});
        s *= 0.95;
        L = compose(ctx, s, S);
      }
      // refine: the largest size between the last failing and the first fitting step
      if (L.fits && tried.length) {
        let lo = s, hi = s / 0.95;
        for (let k = 0; k < 6; k++) {
          const mid = (lo + hi) / 2;
          const Lm = compose(ctx, mid, S);
          if (Lm.fits) { lo = mid; L = Lm; } else hi = mid;
        }
      }
      L.budget = {...L.budget, tried};
      return L;
    };
    // square boxes: side by side (walks top → bottom) or stacked (walks left → right), whichever reads larger
    const cands = ctx.view.shape === 'square' ? [SHAPES.square, SQUARE_ROW] : [SHAPES[ctx.view.shape]];
    const Ls = cands.map(search);
    const L = Ls.reduce((a, b) => (b.fits && (!a.fits || Math.min(...b.geo.bodySizes) > Math.min(...a.geo.bodySizes) + 0.01) ? b : a));
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    return g(null,
      g({name: 'stage'},
        L.scenes.map((sc, i) => g({transform: T(L.origins[i].x, L.origins[i].y)}, sc.node)),
        L.headers.map(hd => [hd.badge, hd.lab]),
        L.guideNode),
      L.guideChip && L.guideChip.node,
      L.key.map(k => k.node),
      L.sharedChip && L.sharedChip.node,
      L.neutralChip && L.neutralChip.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const geo = L.geo;
    const looks = [];
    const states = L.scenes.map((sc, i) => {
      const P = i ? 'B' : 'A';
      const st = sceneState(L, sc, u, ctx.reduced);
      nodes[`${P}fact`] = {transform: T(st.oF.dx, st.oF.dy)};
      nodes[`${P}conc`] = {transform: T(st.oC.dx, st.oC.dy)};
      Object.assign(nodes, sc.hF.frame(st.kF), sc.hC.frame(st.kC));
      nodes[`${P}recess`] = {opacity: r(1 - st.lift, 3)};
      nodes[`${P}prm`] = {transform: st.lift > 0 ? `translate(${r(-2 * st.lift)} ${r(-3 * st.lift)})` : 'translate(0 0)'};
      const Bd = geo.board;
      const fE = L.row ? geo.boxes.fact.y + geo.boxes.fact.h + st.oF.dy : geo.boxes.fact.x + geo.boxes.fact.w + st.oF.dx;
      const cS = L.row ? geo.boxes.conclusion.y + st.oC.dy : geo.boxes.conclusion.x + st.oC.dx;
      nodes[`${P}gap-r`] = L.row ? {x: r(Bd.x - 30), y: r(fE), width: r(Bd.w + 60), height: r(Math.max(0, cS - fE))} : {x: r(fE), y: r(Bd.y - 30), width: r(Math.max(0, cS - fE)), height: r(Bd.h + 60)};
      // marker clip: slides in along the fact card's inner edge to its seat
      const slide = L.row ? {x: -(L.s * 3.2) * (1 - st.clipIn), y: 0} : {x: 0, y: -(L.s * 3.2) * (1 - st.clipIn)};
      nodes[`${P}clip`] = {transform: T(sc.clipAt.x + slide.x, sc.clipAt.y + slide.y, sc.clipAng), opacity: st.clipIn > 0 ? r(Math.min(1, st.clipIn * 3), 3) : 0};
      const lf = sc.lupa.frame(st.lupaC, L.rest.angle, st.go, st.go);
      delete lf.grip;
      Object.assign(nodes, lf);
      // what a viewer can see of this scene (panel-local): used to prove A and B are identical before the change beat
      looks.push({
        fact: P2({x: st.oF.dx, y: st.oF.dy}), conclusion: P2({x: st.oC.dx, y: st.oC.dy}),
        revealed: r(st.revealed, 3), premiseLook: r(st.revealed, 3) > 0 ? sc.status : null,
        hinge: [r(st.kF, 3), r(st.kC, 3)], lift: r(st.lift, 3), lupa: P2(st.lupaC),
        clip: st.clipIn > 0 ? sc.status : null,
        lane: r(seg(u, ...W.lanes), 3),
      });
      return st;
    });
    // headers: neutral badges first; each lane's label with its clip
    const bOp = r(seg(u, ...W.badges), 3);
    const lOp = r(seg(u, ...W.lanes), 3);
    nodes.badgeA = {opacity: bOp};
    nodes.badgeB = {opacity: bOp};
    nodes.laneA = {opacity: lOp};
    nodes.laneB = {opacity: lOp};
    // guide + band
    const gp = ease.inOutCubic(seg(u, ...W.guide));
    nodes.guide = {opacity: gp > 0 ? 1 : 0};
    // the guide draws on segment by segment
    const tot = L.guidePaths.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    L.guidePaths.forEach((len, k) => {
      const f = clamp((gp * tot - acc) / (len || 1));
      nodes[`guide-line${k}`] = {'stroke-dashoffset': r(len * (1 - f))};
      acc += len;
    });
    nodes['guide-end'] = {opacity: gp >= 1 ? 1 : 0};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(seg(u, ...W.note), 3)};
    nodes.stage = {transform: T(0, L.camOff * (1 - ease.inOutCubic(seg(u, ...W.cam))))};
    const band = r(seg(u, ...W.band), 3);
    L.key.forEach(k => { nodes[k.node.attrs.name] = {opacity: band}; });
    if (L.sharedChip) nodes.shared = {opacity: band};
    if (L.neutralChip) nodes.neutral = {opacity: r(seg(u, ...W.note), 3)};

    const [A, B] = states;
    const differs = [];
    if (L.scenes[0].status !== L.scenes[1].status) differs.push('premiseStatus');
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      arrangement: L.row ? 'row' : 'column',
      scenes: 2,
      textSize: r(L.s, 2),
      wordSplit: !!L.geo.wordSplit,
      statusA: L.scenes[0].status, statusB: L.scenes[1].status,
      lookA: looks[0], lookB: looks[1],
      identicalLooks: JSON.stringify(looks[0]) === JSON.stringify(looks[1]),
      openA: r(A.pr, 3), openB: r(B.pr, 3),
      revealedA: r(A.revealed, 3), revealedB: r(B.revealed, 3),
      hingeA: [r(A.kF, 3), r(A.kC, 3)], hingeB: [r(B.kF, 3), r(B.kC, 3)],
      latchedA: A.kF >= 1 && A.kC >= 1, latchedB: B.kF >= 1 && B.kC >= 1,
      liftA: r(A.lift, 3), liftB: r(B.lift, 3),
      lupaA: P2({x: L.origins[0].x + A.lupaC.x, y: L.origins[0].y + A.lupaC.y}),
      lupaB: P2({x: L.origins[1].x + B.lupaC.x, y: L.origins[1].y + B.lupaC.y}),
      lupaReadingA: A.go >= 1, lupaReadingB: B.go >= 1,
      factA: P2({x: L.origins[0].x + centerOf(geo.boxes.fact).x + A.oF.dx, y: L.origins[0].y + centerOf(geo.boxes.fact).y + A.oF.dy}),
      factB: P2({x: L.origins[1].x + centerOf(geo.boxes.fact).x + B.oF.dx, y: L.origins[1].y + centerOf(geo.boxes.fact).y + B.oF.dy}),
      clipA: A.clipIn > 0 ? L.scenes[0].status : null, clipB: B.clipIn > 0 ? L.scenes[1].status : null,
      differs,
      sharedTexts: {fact: p.facts, premise: p.rules, conclusion: p.conclusion},
      guide: r(gp, 3),
      labelsShown: lOp >= 1,
      bandShown: band >= 1,
      winner: null, score: null, outcome: null,
      bodyPx1080: r(Math.min(...geo.bodySizes) / L.u, 2),
      notePx1080: r(L.ns / L.u, 2),
      budget: L.budget,
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-08-contrast',
    title: 'Hidden premise — the same argument with the premise stated (A) and left unstated (B)',
    titleEs: 'Premisa oculta — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Premisa oculta',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical reading boards hold the same fact and conclusion cards over the same hidden intermediate card. A marker clip introduces the one change: in A the argument states the premise, in B it leaves it unstated (as supplied). Both walks open in lockstep; A’s printed card is latched into the walk by the hinges and lifts flush, B’s pencil card stays loose in its pocket and B’s magnifier reads it. A dashed guide joins the two cards; a neutral note says no conclusion is drawn about either.',
    tags: ['reasoning', 'hidden premise', 'enthymeme', 'contrast', 'stated', 'unstated', 'paired', 'hinge', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/premisa-oculta.js', 'src/animations/reasoning/kits/hecho-y-regla.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
