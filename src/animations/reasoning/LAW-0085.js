/**
 * LAW-0085 — Analogía de casos · story
 *
 * Storyboard (top-down desk with a light table; the reviewer's hand):
 *  0.00–0.15 rest    Case A's tracing sheet lies registered on the pegs of a
 *                    glowing light table; case B's sheet lies on the desk
 *                    beside it. Each sheet prints a small scene: one
 *                    pictogram per supplied feature on a ground line, with its
 *                    label; A's name in the left half of the header, B's in
 *                    the right half. The rule card (text as supplied) shows
 *                    one socket per feature it names; a magnifier rests on
 *                    the light table's tray. The hand moves to B's lower edge.
 *  0.15–0.42 action  The hand pinches B, lifts it (larger, longer shadow) and
 *                    slides it sideways first, then onto A (so it never passes
 *                    over the rule card); it is lowered until B's punched holes
 *                    drop onto the same pegs and its corner crosshairs lie on
 *                    A's. A's labels vanish under the paper as B passes over
 *                    them; A's name and letter stay readable through it.
 *  0.42–0.73 complete  Shared features coincide one by one: the two prints
 *                    overprint into the merged ink and an "=" tick appears;
 *                    differing variants stay side by side with a "≠" badge;
 *                    what only A has shows through in A's ink. On wide boxes
 *                    the hand then pulls the rule card down beside the overlay.
 *                    It picks up the magnifier, sets it over the relevant
 *                    difference (a real enlarged copy is seen through the
 *                    lens) and withdraws. The rule's sockets send threads to
 *                    the relevant similarity and difference (plain relations,
 *                    no arrowheads), each entering the sheet on its own lane.
 *  0.73–1.00 hold    The supplied final state is held: the socket captions
 *                    read "relevant similarity / difference · as supplied"
 *                    (or disputed / pending). No legal conclusion is drawn.
 * Wide boxes: light table left, rule card and B right. Tall boxes: B on top,
 * light table below it, rule card at the bottom, the arm from the right edge.
 * Square: rule card across the top, light table left, B bottom-right.
 * The desk runs off the frame on the side the arm enters from.
 * @module animations/reasoning/LAW-0085
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, dist, roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, num, oneOf, list, obj, annotation} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {placeChip, calloutChip, segPolys, hitsAny} from '../causation/kits/place.js';
import {
  analogyFields, ANALOGY_STRINGS, resolveAnalogy, inks, sheetGeometry, cellOf, badgeSpot, featureRing,
  sheetBase, printNode, relBadge, glyphOf, ruleCard, magnifier, lightTable, place, centeredBounds, boxGap, allTexts, laneWire, pictogram, brokeWord, SANS,
} from './kits/analogia-de-casos.js';

const ID = 'LAW-0085';
const STRINGS = {
  en: {...ANALOGY_STRINGS.en, noConclusion: 'Relevance marks as supplied · no conclusion is drawn'},
  es: {...ANALOGY_STRINGS.es, noConclusion: 'Marcas de relevancia según lo aportado · no se extrae ninguna conclusión'},
};
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  labels: [0, 0.08],
  reach: [0.05, 0.155], lift: [0.16, 0.2], carry: [0.2, 0.37], lower: [0.37, 0.42], release: 0.425,
  reveal: [0.43, 0.56], through: [0.43, 0.5],
  // wide boxes: the hand pulls the rule card down beside the overlay
  cardReach: [0.425, 0.49], cardSlide: [0.495, 0.56],
  magReach: [0.563, 0.61], magLift: [0.61, 0.625], magCarry: [0.625, 0.69], magSet: [0.69, 0.71],
  withdraw: [0.715, 0.8],
  rings: [0.62, 0.7], threads: [0.65, 0.74],
  captions: [0.74, 0.8], issue: [0.77, 0.85], notes: [0.8, 0.9],
};
const ACTION_END = 0.73;
const ZOOM = 1.55;

const sceneSchema = {
  ...analogyFields,
  actorLabels: obj('Caption shown for the reviewer whose hands perform the action', {a: str('Caption for the reviewer (descriptive, not a finding)', 60), b: str('Unused second caption (kept for the shared story contract)', 60)}),
  objectLabels: obj('Captions printed beside the rule card sockets in the final hold (empty = built-in wording)', {
    similarity: str('Caption for the relevant similarity (as supplied)', 60),
    difference: str('Caption for the relevant difference (as supplied)', 60),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['similarity', 'difference', 'rule', 'overlay']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold (no legal conclusion is inferred)', ['marked-as-supplied', 'difference-disputed', 'relevance-pending']),
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
  actorLabels: {a: 'Reviewer (fictional)', b: ''},
  objectLabels: {similarity: '', difference: ''},
  actionProgress: 1,
  annotations: [],
  finalState: 'marked-as-supplied',
};

const ARM = {upper: 400, lower: 380, width: 54, handScale: 1.3};
const M = 26;
const LP = 34;

/** Caption printed beside a rule socket in the final hold (descriptive only). */
function captionText(ctx, key) {
  const p = ctx.params;
  const t = ctx.t;
  if (p.finalState === 'relevance-pending') return t.relevancePending;
  if (key === 'sim') return p.objectLabels.similarity || `${t.relevantSimilarity} · ${t.asSupplied}`;
  const base = p.objectLabels.difference || t.relevantDifference;
  if (p.finalState === 'difference-disputed') return `${base} · ${t.disputed}`;
  return p.objectLabels.difference || `${base} · ${t.asSupplied}`;
}

/** Proper intersection of segments ab and cd. */
function segCross(a, b, c, d) {
  const o = (p, q, s) => (q.x - p.x) * (s.y - p.y) - (q.y - p.y) * (s.x - p.x);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  return ((d1 > 1e-6 && d2 < -1e-6) || (d1 < -1e-6 && d2 > 1e-6)) && ((d3 > 1e-6 && d4 < -1e-6) || (d3 < -1e-6 && d4 > 1e-6));
}
function crossings(P, Q) {
  let n = 0;
  for (let i = 1; i < P.length; i++) for (let j = 1; j < Q.length; j++) if (segCross(P[i - 1], P[i], Q[j - 1], Q[j])) n++;
  return n;
}
/** Closest approach of two polylines (sampled every ~6 units). */
function minGapOf(P, Q) {
  const sample = pts => {
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
      for (let k = 0; k <= n; k++) out.push({x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n});
    }
    return out;
  };
  const A = sample(P), B = sample(Q);
  let m = Infinity;
  for (const q of A) for (const q2 of B) m = Math.min(m, Math.hypot(q.x - q2.x, q.y - q2.y));
  return m;
}
const pathLen = P => P.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - P[i].x, q.y - P[i].y), 0);

/**
 * Stage plan per shape: sheet size, light table (with a front tray where the
 * magnifier rests), B's rest pose, rule card (and, on wide boxes, where it is
 * pulled to), grip on B and the desk edge the reviewer's arm comes from.
 */
function stagePlan(ctx, R, px, wideK = 0.5) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const t = ctx.t;
  const rule = p.rules[0];
  const relevant = R.features.filter(F => F.relevant && F.kind !== 'none');
  const sockets = relevant.map(F => ({icon: F.icon, f: F.i}));
  const capTexts = sockets.filter(sk => sk.f === R.relSim || sk.f === R.relDiff).map(sk => captionText(ctx, sk.f === R.relSim ? 'sim' : 'diff'));
  const mkCard = (w, maxH, size0, socketsFirst, socketsAlign = 'left') => {
    let c = null;
    // key text never below 20 px at 1080p
    // key text at 20+ px; a long supplied rule may go down to 16.5 px (never
    // cut) so the card leaves the sheet room (captions follow it down)
    const sizes = [size0, size0 * 0.9, size0 * 0.82].map(v => Math.max(v, px(20.5))).concat([px(18.5), px(16.5)]);
    for (const size of sizes) {
      const spec = socks => ({prefix: 'rule', w, name: rule.name || t.ruleCard, text: rule.text, sockets: socks, captioned: [R.relSim, R.relDiff].filter(v => v !== null), captionTexts: capTexts, size, textMin: Math.min(size, px(20)), maxLines: 6, socketR: 32, socketsFirst, socketsAlign});
      c = ruleCard(ctx, spec(sockets));
      c.size = size;
      c.rebuild = socks => {
        const c2 = ruleCard(ctx, spec(socks));
        c2.size = size;
        return c2;
      };
      if (c.h <= maxH) break;
    }
    return c;
  };
  const tray = lensR => 2 * lensR + 18;
  if (shape === 'landscape' || shape === 'square') {
    // wide and square boxes: light table left (full height: its front tray
    // holds the magnifier and the reviewer's name plate), rule card top-right,
    // B resting bottom-right; the card is pulled down beside the overlay once
    // B has left, and the issue block fills the column under it
    const sq = shape === 'square';
    const gap = sq ? 30 : 40;
    // B's rest pose may overhang the light table's metal rim (never A's sheet)
    const sw = clamp((D.w - 2 * M - 2 * LP - gap + 16) * (sq ? wideK : 0.5), 460, 980);
    const lensR = clamp(sw * 0.06, 50, 58);
    const colX = M + sw + 2 * LP + gap;
    const colW = D.w - M - colX;
    const card = mkCard(Math.min(colW, 900), sq ? 320 : 240, Math.max(26, px(sq ? 22 : 23)), false);
    const cardPos = {x: colX + (colW - card.w) / 2, y: M + 36};
    const sh = Math.min(sq ? 720 : 640, D.h - 2 * M - 2 * LP - tray(lensR), D.h - (cardPos.y + card.h) - 26 - M - 6);
    const trayH = D.h - 2 * M - 2 * LP - sh;
    const lt = {x: M, y: M, w: sw + 2 * LP, h: sh + 2 * LP + trayH};
    const A = {x: lt.x + LP + sw / 2, y: lt.y + LP + sh / 2};
    const B0 = {x: Math.min(colX + colW / 2, D.w - M - 8 - sw / 2), y: D.h - M - sh / 2 - 6, rot: sq ? 1.2 : 1.4};
    const grip = {x: sw * 0.8, y: sh - 16};
    const trayY = A.y + sh / 2 + LP + trayH / 2 - 6;
    const mag0 = {c: {x: A.x + sw * 0.2, y: trayY}, angle: 0};
    // after B has left, the rule card is pulled down beside the overlay
    const cardEndY = clamp(A.y - card.h * 0.55, cardPos.y, D.h - M - card.h - 70);
    return {shape, sw, sh, lt, trayH, A, B0, grip, card, cardPos, cardEndY, slide: true, cardGrip: {x: card.w * 0.1, y: card.h - 10}, mag0, lensR, edge: 'bottom', cable: 'left', size: Math.max(clamp(sw * 0.03, 21, 27), px(21)), minLabel: px(20), exit: 'down', mkCard};
  }
  // portrait: B on top, light table below it, rule card at the bottom
  const sw = D.w - 2 * M - 2 * LP;
  const lensR = clamp(sw * 0.075, 50, 64);
  const card = mkCard(D.w - 2 * M, 250, 26, true, 'right');
  const sh = Math.min(640, (D.h - 2 * M - 2 * LP - tray(lensR) - card.h - 36 - 40 - 24) / 2);
  const B0 = {x: D.w / 2, y: M + sh / 2 + 4, rot: -1.4};
  const lt = {x: M, y: M + sh + 30, w: sw + 2 * LP, h: sh + 2 * LP + tray(lensR)};
  const A = {x: lt.x + LP + sw / 2, y: lt.y + LP + sh / 2};
  const cardPos = {x: M, y: D.h - M - card.h};
  const grip = {x: sw - 22, y: sh - 22};
  const trayY = A.y + sh / 2 + LP + tray(lensR) / 2 - 6;
  const mag0 = {c: {x: A.x + sw * 0.14, y: trayY}, angle: 0};
  return {shape, sw, sh, lt, trayH: tray(lensR), A, B0, grip, card, cardPos, cardEndY: cardPos.y, slide: false, mag0, lensR, edge: 'right', cable: 'none', size: Math.max(clamp(sw * 0.03, 21, 27), px(21)), minLabel: px(20), exit: 'up', mkCard};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const R = resolveAnalogy(p.facts);
    const I = inks(th);
    // design units that render as `n` px on a 1080-px frame side
    const fit = fitDesign(ctx.view, D.w, D.h);
    const pxU = n => n * Math.min(ctx.view.width, ctx.view.height) / (1080 * fit.scale);
    let S = stagePlan(ctx, R, pxU);
    const minLab = S.minLabel ?? 16;
    const nameSz0 = Sx => Math.max(20, Math.min(30, Sx.sw * 0.042), pxU(20.5));
    // tight: long supplied texts in a small box — names, notes and facts all
    // start near the 16–18 px content floor (captions follow them down)
    let tight = false;
    const geoOpts = (Sx, tt = tight) => ({
      w: Sx.sw, h: Sx.sh, units: R.units, texts: allTexts(R),
      names: {a: p.cases.a.name, b: p.cases.b.name, na: p.cases.a.note, nb: p.cases.b.note},
      size: tt ? Math.min(Sx.size, pxU(17.5)) : Sx.size, maxLines: 3, showLabels: ctx.show('key'), showNames: ctx.show('key'), wordSafe: true,
      nameSize: tt ? pxU(18.5) : nameSz0(Sx), nameMin: pxU(16.5), nameLines: 4, stackNames: tt,
      noteSize: tt ? pxU(16.5) : Math.max(nameSz0(Sx) * 0.72, Math.min(nameSz0(Sx), pxU(20.5))), noteMin: pxU(16.5), noteLines: 2,
      minPicto: pxU(54),
    });
    // square: when long supplied texts leave the facts cramped, a wider share
    // of the desk goes to the sheet (the rule card column gets narrower)
    if (S.shape === 'square' && ctx.show('key')) {
      const q0 = sheetGeometry(ctx, {...geoOpts(S), minSize: minLab});
      if (q0.truncated || q0.ps < pxU(50)) {
        tight = true;
        let bestK = {k: 0.5, ps: -1};
        for (const k of [0.5, 0.55, 0.6, 0.65]) {
          const Sk = stagePlan(ctx, R, pxU, k);
          // B (same size as A) must still rest on the desk beside A's sheet
          const bRest = centeredBounds({...Sk.B0, s: 1}, Sk.sw, Sk.sh);
          if (bRest.x < Sk.lt.x + Sk.lt.w - LP + 4) continue;
          const q = sheetGeometry(ctx, {...geoOpts(Sk), minSize: pxU(16.5), cols: [2, 3, 4]});
          const sc = q.truncated || q.fallback ? -1 : q.ps;
          if (sc > bestK.ps + 2) bestK = {k, ps: sc};
        }
        if (bestK.k !== 0.5) S = stagePlan(ctx, R, pxU, bestK.k);
      }
    }
    const {sw, sh} = S;
    // threads enter the sheet from its right edge: the relevant difference sits
    // at the right end of its row, the relevant similarity in the first row
    // (it then either sits at a row end or is reached along the header rule)
    const order = R.units.slice().sort((a, b) => {
      const k = u => (u.f === R.relSim ? 0 : u.f === R.relDiff ? 2 : 1);
      return k(a) - k(b);
    });
    // facts, names and notes are the author's content: kept whole (names up
    // to 3 lines, notes up to 2) and never below 16 px; facts first try the
    // 20-px floor and only drop towards 16 px when they would otherwise be cut
    const mkGeoAt = (cols, floor) => sheetGeometry(ctx, {
      ...geoOpts(S), units: order, minSize: floor,
      rowEnd: {side: 'right', first: [R.relDiff, R.relSim].filter(v => v !== null)},
      cols,
    });
    const namesCut = gg => gg.names && ['a', 'b', 'na', 'nb'].some(k => gg.names[k] && gg.names[k].truncated);
    let lowFloor = false;
    const mkGeo = cols => {
      const g1 = mkGeoAt(cols, minLab);
      if (!g1.truncated && !lowFloor) return g1;
      lowFloor = true;
      return mkGeoAt(cols, pxU(16.5));
    };
    // the two variants under the magnifier get narrower labels (the handle lies
    // between them): use fewer columns until those labels fit untruncated
    const gapW = S.lensR * 0.34 + 16;
    const lensF0 = R.relDiff ?? (R.features.find(F => F.kind !== 'shared' && F.kind !== 'none') || {}).i ?? R.relSim;
    const pairFits = gg => {
      const F = lensF0 === null || lensF0 === undefined ? null : R.features[lensF0];
      if (!F || F.kind !== 'differs' || !ctx.show('key')) return true;
      return [F.a, F.b].every(tx => {
        const f = ctx.fit(tx, {maxWidth: gg.cells[0].w - 16 - gapW, size: gg.labelSize, minSize: Math.min(gg.labelSize, Math.max(15, minLab)), maxLines: 4, weight: 600});
        return !f.truncated && !brokeWord(f);
      });
    };
    let geo = mkGeo(undefined);
    void namesCut;
    // still cut at the 16-px floor: the column count that keeps every fact
    // whole with the largest pictograms
    if (geo.truncated) {
      let pick = null;
      for (const C of [2, 3, 4, 5]) {
        const g2 = mkGeoAt([C], pxU(16.5));
        if (g2.fallback || g2.truncated) continue;
        if (!pick || g2.ps > pick.ps) pick = g2;
      }
      if (pick) geo = pick;
    }
    // (never at the cost of pictograms smaller than ~50 px: the pair's labels
    // then wrap to more lines instead)
    for (let C = geo.cols - 1; C >= 2 && !pairFits(geo); C--) {
      const g2 = mkGeo([C]);
      if (g2.fallback || (g2.ps < pxU(50) && g2.ps < geo.ps)) break;
      geo = g2;
    }
    const poseA = {x: S.A.x, y: S.A.y, rot: 0, s: 1};
    const toA = local => ({x: S.A.x - sw / 2 + local.x, y: S.A.y - sh / 2 + local.y});
    const centered = local => ({x: local.x - sw / 2, y: local.y - sh / 2});

    // --- canvas in design units: the desk runs off the frame on the arm's side
    const canvas = {x0: -fit.ox / fit.scale, y0: -fit.oy / fit.scale, x1: (ctx.view.width - fit.ox) / fit.scale, y1: (ctx.view.height - fit.oy) / fit.scale};

    // --- prints: A's variant in the left/single cell; B's shared print on the
    // same cell, B's differing variant in the right cell of the pair
    const aPrints = [], bPrints = [];
    R.features.forEach(F => {
      const u = geo.unitCells[F.i];
      if (!u) return;
      if (F.a) aPrints.push({f: F.i, cell: u.pair ? u.L : u.S, icon: F.icon, text: F.a});
      if (F.b) bPrints.push({f: F.i, cell: F.kind === 'shared' ? (u.pair ? u.L : u.S) : (u.pair ? u.R : u.S), icon: F.kind === 'shared' ? F.icon : F.iconB, text: F.b});
    });
    const sheetA = sheetBase(ctx, {prefix: 'shA', geo, which: 'a', ink: I.a.ink, paperOpacity: 0.88});
    const sheetB = sheetBase(ctx, {prefix: 'shB', geo, which: 'b', ink: I.b.ink, paperOpacity: 0.6});
    // the magnifier is later laid over the badge between the two variants of
    // the inspected feature, its handle running down between their labels:
    // those two labels are fitted narrower (up to 4 lines) and pushed apart
    const lensF = R.relDiff ?? (R.features.find(F => F.kind !== 'shared' && F.kind !== 'none' && geo.unitCells[F.i]) || {}).i ?? R.relSim;
    const hasLens = lensF !== null && lensF !== undefined;
    const geoN = {...geo, fitLabel: tx => ctx.fit(tx, {maxWidth: geo.cells[0].w - 16 - gapW, size: geo.labelSize, minSize: Math.min(geo.labelSize, pxU(16.5)), maxLines: 3, weight: 600})};
    // (only when both labels still wrap between words at the narrower width;
    // otherwise they keep their full width and the handle takes another way)
    const narrowOK = hasLens && [R.features[lensF].a, R.features[lensF].b].every(tx => { const f = tx ? geoN.fitLabel(tx) : null; return !f || (!f.truncated && !brokeWord(f)); });
    const splitPair = hasLens && narrowOK && geo.unitCells[lensF] && geo.unitCells[lensF].pair && R.features[lensF].kind === 'differs';
    const pn = (pr, o) => {
      if (!splitPair || pr.f !== lensF) return printNode(ctx, geo, {...o, cell: pr.cell});
      const side = pr.cell.key === 'L' ? -1 : 1;
      const cell = {...pr.cell, label: {...pr.cell.label, x: pr.cell.label.x + side * gapW / 2, w: pr.cell.label.w - gapW}};
      return printNode(ctx, geoN, {...o, cell});
    };
    const aNodes = aPrints.map(pr => ({f: pr.f, ...pn(pr, {name: `pa${pr.f}`, icon: pr.icon, text: pr.text, ink: I.a.ink, soft: I.a.soft})}));
    const bNodes = bPrints.map(pr => ({f: pr.f, ...pn(pr, {name: `pb${pr.f}`, icon: pr.icon, text: pr.text, ink: I.b.ink, soft: I.b.soft})}));

    // --- overlay (drawn above B, in A's frame): merged prints, show-through, badges
    const merged = R.features.filter(F => F.kind === 'shared' && geo.unitCells[F.i]);
    const through = aPrints.filter(pr => R.features[pr.f].kind !== 'shared');
    const mergedNodes = merged.map(F => {
      const c = cellOf(geo, F.i, 'S');
      return {f: F.i, c, node: g({name: `om${F.i}`, opacity: 0}, printNode(ctx, geo, {name: `omp${F.i}`, cell: c, icon: F.icon, text: '', ink: I.m.ink, soft: I.m.soft, showText: false}).node)};
    });
    const throughNodes = through.map(pr => ({f: pr.f, ...pn(pr, {name: `ot${pr.f}`, icon: pr.icon, text: pr.text, ink: I.a.ink, soft: I.a.soft, opacity: 0})}));
    const badges = R.features.filter(F => F.kind !== 'none' && geo.unitCells[F.i]).map(F => {
      const sp = badgeSpot(geo, F.i, F.kind);
      const eq = F.kind === 'shared';
      return {f: F.i, eq, sp, glyph: glyphOf(F.kind), node: relBadge(ctx, {name: `bd${F.i}`, kind: glyphOf(F.kind), x: sp.x, y: sp.y, rad: eq ? 15 : 19, color: eq ? I.m.ink : th.ink, opacity: 0})};
    });
    // A's name and letter seen through B (shown from the moment B covers them)
    let throughName = null;
    if (geo.names) {
      const nameNodes = [textBlock(geo.names.a, {x: sheetA.nameX, y: geo.headerTop, fill: th.ink})];
      if (geo.names.na) nameNodes.push(textBlock(geo.names.na, {x: sheetA.nameX, y: geo.headerTop + geo.names.a.height + 6, fill: th.inkSoft}));
      throughName = g({name: 'otName', opacity: 0}, nameNodes);
    }
    const throughBadge = g({name: 'otBadge', opacity: 0}, h('circle', {cx: r(sheetA.badge.x), cy: r(sheetA.badge.y), r: r(sheetA.badge.r), fill: I.a.ink, stroke: th.ink, 'stroke-width': 2}),
      ctx.show('key') ? h('text', {x: r(sheetA.badge.x), y: r(sheetA.badge.y + sheetA.badge.r * 0.42), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(sheetA.badge.r * 1.15), 'font-weight': 800, fill: '#ffffff'}, 'A') : null);
    const aNameBox = geo.names ? {x: sheetA.nameX - 4, y: sheetA.nameY - 4, w: Math.max(geo.names.a.width, geo.names.na ? geo.names.na.width : 0) + 8, h: geo.stackNames ? geo.names.rowB : geo.header} : null;
    const aLetterBox = {x: sheetA.badge.x - sheetA.badge.r, y: sheetA.badge.y - sheetA.badge.r, w: 2 * sheetA.badge.r, h: 2 * sheetA.badge.r};
    // B's texts (sheet-local) that could pass over A's name while B is carried
    const bTexts = [];
    if (geo.names) bTexts.push({name: 'shB-names', box: {x: sheetB.nameX - 4, y: sheetB.nameY - 4, w: Math.max(geo.names.b.width, geo.names.nb ? geo.names.nb.width : 0) + 8, h: geo.stackNames ? geo.header - geo.names.rowB : geo.header}});
    if (ctx.show('key')) bTexts.push({name: 'shB-letter', box: {x: sheetB.badge.x - sheetB.badge.r, y: sheetB.badge.y - sheetB.badge.r, w: 2 * sheetB.badge.r, h: 2 * sheetB.badge.r}});
    bNodes.forEach(n => { if (n.labBox) bTexts.push({name: `pb${n.f}-lab`, box: n.labBox}); });

    // --- relevance rings (A frame) and the lens target
    const ringOf = f => (f === null ? null : featureRing(geo, f, R.features[f].kind));
    const ringS = ringOf(R.relSim), ringD = ringOf(R.relDiff);
    const ringNode = (name, box) => {
      if (!box) return null;
      const len = 2 * (box.w + box.h);
      return {len, box, node: h('path', {name, d: roundRectPath(box.x, box.y, box.w, box.h, 16), fill: 'none', stroke: th.ink, 'stroke-width': 4, 'stroke-dasharray': `${r(len)} ${r(len + 20)}`, 'stroke-dashoffset': r(len), opacity: 0})};
    };
    const pending = p.finalState === 'relevance-pending';
    const rS = ringNode('ringS', ringS);
    const rD = ringNode('ringD', ringD);
    const lensLocal = hasLens ? badgeSpot(geo, lensF, R.features[lensF].kind) : null;

    // --- light table, pegs
    const lt = lightTable(ctx, {prefix: 'lt', ...S.lt, pegs: geo.holes.map(c => toA(c)), cable: S.cable, trayH: S.lt.h - S.sh - 2 * LP});
    const cardPos0 = {...S.cardPos};
    const cardPos = {x: S.cardPos.x, y: S.cardEndY};

    // --- threads: socket → turn → lane in the light table's right rim → the
    // sheet edge → the ring (side entry at mid-height when the feature ends
    // its row; along the header rule when it is in the first row)
    const edgeX = S.A.x + sw / 2;
    const targets = [];
    const addTarget = (f, ring, key) => {
      if (f === null || !ring) return;
      const u = geo.unitCells[f];
      const rw = {x: toA(ring).x, y: toA(ring).y, w: ring.w, h: ring.h};
      let inner, ey, land;
      if (u.last) {
        ey = rw.y + rw.h / 2;
        inner = [{x: edgeX, y: ey}, {x: rw.x + rw.w + 2, y: ey}];
        land = 'side';
      } else if (u.row === 0) {
        ey = toA({x: 0, y: geo.headerTop + geo.header}).y;
        const cx = rw.x + rw.w / 2;
        inner = [{x: edgeX, y: ey}, {x: cx, y: ey}, {x: cx, y: rw.y - 2}];
        land = 'top';
      } else {
        ey = toA({x: 0, y: (u.L || u.S).groundY + 3}).y;
        inner = [{x: edgeX, y: ey}, {x: rw.x + rw.w + 2, y: ey}];
        land = 'side';
      }
      targets.push({f, key, ring, rw, inner, ey, land});
    };
    addTarget(R.relSim, ringS, 'sim');
    addTarget(R.relDiff, ringD, 'diff');
    // two well separated lanes (rim, then the desk just beside it) and turn
    // heights, so the two threads never run as a close parallel pair
    const lanes = [edgeX + 12, edgeX + LP + 14];
    const turnStep = 40;
    let card = S.card;
    let best = null;
    const socketOrders = [card.sockets.map(s => ({icon: s.icon, f: s.f}))];
    if (targets.length === 2) {
      const base = socketOrders[0];
      const i0 = base.findIndex(s => s.f === targets[0].f), i1 = base.findIndex(s => s.f === targets[1].f);
      if (i0 >= 0 && i1 >= 0) {
        const sw2 = base.slice();
        [sw2[i0], sw2[i1]] = [sw2[i1], sw2[i0]];
        socketOrders.push(sw2);
      }
    }
    for (const socks of socketOrders) {
      const c = socks === socketOrders[0] ? S.card : S.card.rebuild(socks);
      const cBox = {x: cardPos.x, y: cardPos.y, w: c.w, h: c.h};
      const perms = targets.length === 2 ? [[0, 1], [1, 0]] : [[0]];
      // a card beside the sheet may also be left by the sockets' own side
      // (stacked sockets: a thread leaving downwards would run through the
      // socket below it)
      for (const exitLeft of S.slide ? [false, true] : [false]) for (const laneP of perms) {
        for (const turnP of perms) {
          const routes = targets.map((tg, k) => {
            const s = c.sockets.find(q => q.f === tg.f);
            if (!s) return null;
            const sx = cBox.x + s.x, sy = cBox.y + s.y;
            const lane = lanes[laneP[k]];
            if (exitLeft) return [{x: sx - s.r - 1, y: sy}, {x: lane, y: sy}, {x: lane, y: tg.ey}, ...tg.inner];
            const down = S.exit === 'down';
            const turnY = down ? cBox.y + c.h + 18 + turnP[k] * turnStep : cBox.y - 16 - turnP[k] * turnStep;
            return [{x: sx, y: down ? sy + s.r + 1 : sy - s.r - 1}, {x: sx, y: turnY}, {x: lane, y: turnY}, {x: lane, y: tg.ey}, ...tg.inner];
          });
          if (routes.some(x => !x)) continue;
          const cr = routes.length === 2 ? crossings(routes[0], routes[1]) : 0;
          // (a near miss is as bad as a crossing: no tight parallel pair)
          let gap = routes.length === 2 ? minGapOf(routes[0], routes[1]) : Infinity;
          routes.forEach((rt, k) => c.sockets.forEach(so => {
            if (so.f === targets[k].f) return;
            gap = Math.min(gap, minGapOf(rt, [{x: cBox.x + so.x, y: cBox.y + so.y}, {x: cBox.x + so.x, y: cBox.y + so.y}]) - so.r);
          }));
          const cost = cr * 1e5 + (gap < 30 ? 5e4 + (30 - gap) * 100 : 0) + routes.reduce((s2, x) => s2 + pathLen(x), 0);
          if (!best || cost < best.cost) best = {cost, routes, card: c, cr};
        }
      }
    }
    if (best) card = best.card;
    // text hierarchy: no generic caption is ever larger than the smallest
    // author-supplied content (facts, names, notes, rule name/text)
    const contentSizes = [];
    if (ctx.show('key')) {
      contentSizes.push(geo.labelSize);
      [...aNodes, ...bNodes].forEach(n => { if (n.fit) contentSizes.push(n.fit.size); });
      if (geo.names) ['a', 'b', 'na', 'nb'].forEach(k => { if (geo.names[k]) contentSizes.push(geo.names[k].size); });
    }
    if (card.titleFit) contentSizes.push(card.titleFit.size);
    if (card.textFit) contentSizes.push(card.textFit.size);
    const capMax = contentSizes.length ? Math.min(...contentSizes) : Infinity;
    const threads = targets.map((tg, k) => {
      if (!best) return null;
      const pts = best.routes[k];
      const c = laneWire(ctx, {name: `th-${tg.key}`, pts, color: th.ink, dashed: pending, radius: 12, width: 3.6});
      return {key: tg.key, f: tg.f, c, pts, si: card.sockets.findIndex(s => s.f === tg.f), land: tg.land, rw: tg.rw};
    }).filter(Boolean);

    // --- captions beside the sockets (final hold)
    const captions = [];
    if (ctx.show('key')) {
      threads.forEach(tr => {
        const s = card.sockets[tr.si];
        const slot = card.captionSlots[tr.si];
        if (!slot) return;
        const cs = Math.min(card.capSize, capMax);
        const f = ctx.fit(captionText(ctx, tr.key), {maxWidth: slot.w, size: cs, minSize: Math.min(cs, pxU(16)), maxLines: 3, weight: 700});
        captions.push({key: tr.key, node: g({name: `cap-${tr.key}`, opacity: 0}, textBlock(f, {x: cardPos.x + slot.x, y: cardPos.y + s.y - f.height / 2, fill: th.ink}))});
      });
    }

    // --- magnifier (two layers: resting under the sheets, carried above them)
    // with a real enlarged copy of the composite in the lens
    const lzGeo = {...geo, names: null};
    const lzA = sheetBase(ctx, {prefix: 'lzA', geo: lzGeo, which: 'a', ink: I.a.ink, paperOpacity: 0.88, noText: true});
    const lzB = sheetBase(ctx, {prefix: 'lzB', geo: lzGeo, which: 'b', ink: I.b.ink, paperOpacity: 0.6, noText: true});
    const lzContent = g({transform: T(S.A.x - sw / 2, S.A.y - sh / 2)},
      h('rect', {x: -LP + 22, y: -LP + 22, width: sw + 2 * LP - 44, height: sh + 2 * LP - 44, fill: '#fcf8ea'}),
      lzA.node,
      aPrints.map(pr => printNode(ctx, geo, {name: `lza${pr.f}`, cell: pr.cell, icon: pr.icon, text: '', ink: I.a.ink, soft: I.a.soft, showText: false}).node),
      lzB.node,
      bPrints.map(pr => printNode(ctx, geo, {name: `lzb${pr.f}`, cell: pr.cell, icon: pr.icon, text: '', ink: I.b.ink, soft: I.b.soft, showText: false}).node),
      merged.map(F => printNode(ctx, geo, {name: `lzm${F.i}`, cell: cellOf(geo, F.i, 'S'), icon: F.icon, text: '', ink: I.m.ink, soft: I.m.soft, showText: false}).node),
      through.map(pr => printNode(ctx, geo, {name: `lzt${pr.f}`, cell: pr.cell, icon: pr.icon, text: '', ink: I.a.ink, soft: I.a.soft, showText: false}).node),
      badges.map(b => relBadge(ctx, {name: `lzbd${b.f}`, kind: b.glyph, x: b.sp.x, y: b.sp.y, rad: b.eq ? 15 : 19, color: b.eq ? I.m.ink : th.ink})),
      rD ? h('path', {name: 'lz-ringD', d: roundRectPath(ringD.x, ringD.y, ringD.w, ringD.h, 16), fill: 'none', stroke: th.ink, 'stroke-width': 4, 'stroke-dasharray': `${r(rD.len)} ${r(rD.len + 20)}`, 'stroke-dashoffset': r(rD.len)}) : null,
    );
    // the lens never covers a label: it shrinks to the free room around the badge
    const labelBoxes = [];
    [...aNodes, ...bNodes, ...throughNodes].forEach(n => { if (n.labBox) labelBoxes.push(n.labBox); });
    const rectDist = (q, b) => Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)));
    // ... and it never hides the two variants' pictograms (it sits in the gap between them)
    const pairPics = hasLens && geo.unitCells[lensF] ? ['L', 'R', 'S'].map(k => geo.unitCells[lensF][k]).filter(Boolean).map(c => ({x: c.pc.x - c.ps / 2, y: c.pc.y - c.ps / 2, w: c.ps, h: c.ps})) : [];
    const lensR = hasLens && (labelBoxes.length || pairPics.length) ? clamp(Math.min(...[...labelBoxes, ...pairPics].map(b => rectDist(lensLocal, b))) - 5, 28, S.lensR) : S.lensR;
    const mag = magnifier(ctx, {prefix: 'mag', R: lensR, handle: lensR * 2.7, content: lzContent, zoom: ZOOM});
    const magLow = magnifier(ctx, {prefix: 'magLow', R: lensR, handle: lensR * 2.7, content: null, zoom: 1});
    const lensTarget = hasLens ? toA(lensLocal) : S.mag0.c;

    // the handle (it stays on the sheet when the hand withdraws) must not lie
    // over a label: try handle directions until one is clear
    const handleL = lensR * 2.7;
    const blockers = [];
    [...aNodes, ...bNodes, ...throughNodes].forEach(n => { if (n.labBox) blockers.push(n.labBox); });
    blockers.push(...pairPics);
    const handleClear = ang => {
      if (!hasLens) return true;
      const a = (ang * Math.PI) / 180;
      for (let d = lensR; d <= lensR + handleL + 10; d += 8) {
        const q = {x: lensLocal.x + Math.cos(a) * d, y: lensLocal.y + Math.sin(a) * d};
        if (q.x < 0 || q.y < 0 || q.x > sw || q.y > sh) break;
        if (blockers.some(b => q.x > b.x - 12 && q.x < b.x + b.w + 12 && q.y > b.y - 8 && q.y < b.y + b.h + 8)) return false;
      }
      return true;
    };
    const angPref = S.edge === 'right' ? [90, 70, 110, 50, 130, 30, 20, 150, 0] : [90, 70, 110, 55, 125, 40, 140, 25, 155];
    const magAngleEnd = angPref.find(handleClear) ?? 90;

    // --- the reviewer's arm: carries B, (pulls the card,) carries the magnifier
    const look = actorLook(ctx, {appearance: {}}, 0);
    const arm = topArm(ctx, {name: 'arm', skin: look.skin, sleeve: look.outfit, handed: 'right', ...ARM});
    const reach = ARM.upper + ARM.lower + 24 * ARM.handScale * (ARM.width / 46);
    const gripC = centered(S.grip);
    const gripRest = place({...S.B0, s: 1}, gripC);
    const gripEnd = place(poseA, gripC);
    const magGrip0 = mag.gripAt(S.mag0.c, S.mag0.angle);
    const magGripEnd = mag.gripAt(lensTarget, magAngleEnd);
    const cardGrip0 = S.slide ? {x: cardPos0.x + S.cardGrip.x, y: cardPos0.y + S.cardGrip.y} : null;
    const cardGrip1 = S.slide ? {x: cardPos.x + S.cardGrip.x, y: cardPos.y + S.cardGrip.y} : null;
    const armTargets = [gripRest, gripEnd, magGrip0, magGripEnd, cardGrip0, cardGrip1].filter(Boolean);
    // the shoulder follows the hand (the reviewer leans in), always beyond the
    // frame edge and ~0.8 of the arm's reach away, so the arm keeps one
    // natural bend and never folds back on itself
    const base = S.edge === 'bottom'
      ? {x: armTargets.reduce((s2, q) => s2 + q.x, 0) / armTargets.length + 160, y: D.h + 40}
      : {x: D.w + 40, y: armTargets.reduce((s2, q) => s2 + q.y, 0) / armTargets.length + 160};
    const armLen = reach * 0.8;
    const shoulderFor = hq => {
      let sq;
      if (S.edge === 'bottom') {
        const dx = clamp((base.x - hq.x) * 0.5, -armLen * 0.7, armLen * 0.7);
        sq = {x: hq.x + dx, y: Math.max(base.y, hq.y + Math.sqrt(armLen * armLen - dx * dx))};
      } else {
        const dy = clamp((base.y - hq.y) * 0.5, -armLen * 0.7, armLen * 0.7);
        sq = {x: Math.max(base.x, hq.x + Math.sqrt(armLen * armLen - dy * dy)), y: hq.y + dy};
      }
      const d = Math.hypot(sq.x - hq.x, sq.y - hq.y);
      const lim = reach * 0.92;
      if (d > lim) sq = {x: hq.x + (sq.x - hq.x) * lim / d, y: hq.y + (sq.y - hq.y) * lim / d};
      return sq;
    };
    const sh0 = shoulderFor(magGripEnd);
    const bend = S.edge === 'right' ? 1 : -1;
    // the whole arm slides in from beyond the frame edge on its side and
    // slides back out after laying the magnifier down (nothing covers a label
    // in the hold)
    const out = S.edge === 'bottom' ? {x: 0, y: 1} : {x: 1, y: 0};
    const OUT = 950;

    // --- carry path: sideways first, then onto A, so B never crosses the card
    const cardBox0 = {x: cardPos0.x - 8, y: cardPos0.y - 40, w: card.w + 16, h: card.h + 48};
    const px = q => ease.inOutCubic(q);
    const mkPy = dl => q => ease.inOutCubic(clamp((q - dl) / (1 - dl)));
    let delay = 0.7;
    for (const dl of [0, 0.15, 0.3, 0.45, 0.55, 0.65]) {
      const py = mkPy(dl);
      let ok = true;
      for (let k = 0; k <= 40 && ok; k++) {
        const q = k / 40;
        const pose = {x: lerp(S.B0.x, S.A.x, px(q)), y: lerp(S.B0.y, S.A.y, py(q)), rot: lerp(S.B0.rot, 0, px(q)), s: 1.035};
        if (boxGap(centeredBounds(pose, sw, sh), cardBox0) < 6) ok = false;
      }
      if (ok) { delay = dl; break; }
    }

    // --- desk window: bleeds past the canvas edge on the arm's side
    // (it ends at the caption-safe bottom: the caption band stays free)
    const deskBox = S.edge === 'bottom'
      ? {x: 0, y: 0, w: D.w, h: D.h}
      : {x: 0, y: 0, w: Math.max(D.w, canvas.x1 + 60), h: D.h};
    const desk = deskWindow(ctx, {prefix: 'desk', ...deskBox, radius: 28});

    // --- hold texts: issue + assumption, actor caption, notes
    const compositeBox = {x: S.A.x - sw / 2, y: S.A.y - sh / 2, w: sw, h: sh};
    const ltBox = {x: S.lt.x, y: S.lt.y, w: S.lt.w, h: S.lt.h};
    const cardBox = {x: cardPos.x, y: cardPos.y - 36, w: card.w, h: card.h + 36};
    const magFinal = {x: lensTarget.x - lensR - 10, y: lensTarget.y - lensR - 10, w: 2 * lensR + 20, h: 2 * lensR + 20};
    const handlePoly = segPolys([lensTarget, magGripEnd], lensR * 0.5);
    const threadPolysOf = tr => segPolys(tr.pts, 18);
    const threadPolys = threads.flatMap(threadPolysOf);
        const bounds = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
    const placed = [];
    const extras = [];
    const obst = () => [ltBox, cardBox, magFinal, ...handlePoly, ...threadPolys, ...placed];
    // notes: each points at its own thread (the part outside the sheet), out
    // in the free desk area; chips avoid everything and a leader may touch
    // only its own thread
    const threadPt = key => {
      const tr = threads.find(x => x.key === key);
      if (!tr) return null;
      // the point of the thread's outer part farthest from every other thread
      const others = threads.filter(x => x !== tr).flatMap(x => x.pts);
      const clear = q => (others.length ? Math.min(...others.map(o => Math.hypot(o.x - q.x, o.y - q.y))) : 80);
      const outer = tr.pts.slice(0, 4);
      let bestPt = null;
      for (let i = 1; i < outer.length; i++) {
        const a0 = outer[i - 1], b0 = outer[i];
        const L0 = Math.hypot(b0.x - a0.x, b0.y - a0.y);
        for (let k = 1; k < 10; k++) {
          const q = {x: a0.x + (b0.x - a0.x) * k / 10, y: a0.y + (b0.y - a0.y) * k / 10};
          const score = Math.min(70, clear(q)) * 3 + Math.min(L0, 200) * 0.2 - Math.abs(k - 5) * 2;
          if (!bestPt || score > bestPt.score) bestPt = {score, q};
        }
      }
      return {x: bestPt.q.x, y: bestPt.q.y, own: threadPolysOf(tr)};
    };
    const noteTargets = {
      similarity: threadPt('sim') || (ringS ? {...toA({x: ringS.x + ringS.w / 2, y: ringS.y}), own: []} : null),
      difference: threadPt('diff') || (ringD ? {...toA({x: ringD.x + ringD.w, y: ringD.y + ringD.h / 2}), own: []} : null),
      rule: {x: cardPos.x + card.w * 0.5, y: cardPos.y + card.h, own: []},
      overlay: {...toA({x: sw - 30, y: 30}), own: []},
    };
    const loose = [];
    const notes = ctx.show('all') ? p.annotations.map((a, i) => {
      const tg = noteTargets[a.target];
      if (!tg) return null;
      const mw = Math.min(460, Math.max(260, (S.shape === "portrait" ? D.w - 2 * M : D.w - S.lt.x - S.lt.w - 60) - 20));
      const size = Math.max(S.size * 0.9, minLab);
      const probe = chip(ctx, a.text, {x: 0, y: 0, maxWidth: mw, size, maxLines: 3});
      const trayBox = {x: S.lt.x + 22, y: S.A.y + sh / 2 + LP, w: S.lt.w - 52, h: S.lt.y + S.lt.h - (S.A.y + sh / 2 + LP)};
      const obstacles = [ltBox, compositeBox, trayBox, cardBox, magFinal, ...handlePoly, ...threadPolys, ...placed];
      const own = [...tg.own, ltBox, ...(a.target === 'rule' ? [cardBox] : [])];
      const gaps = [34, 60, 95, 135, 180, 230, 290, 360, 450, 560, 680];
      // (tall boxes: the threads run up the right edge, so a leader to them
      // would form a bundle — the note joins the free block with the
      // feature's pictogram instead)
      let res = S.shape === 'portrait' ? null : placeChip({w: probe.box.w, h: probe.box.h}, tg, {obstacles, bounds, own, pad: 12, gaps});
      // no spot beside the preferred point: any other point along the note's
      // own thread (first without, then with its leader crossing the other one)
      const trN = threads.find(x => x.key === (a.target === 'similarity' ? 'sim' : a.target === 'difference' ? 'diff' : ''));
      for (const cross of [false, true]) {
        if (res || !trN || S.shape === 'portrait') break;
        // (the leader may meet the other thread, never run across the sheet)
        const own2 = [...own, ...(cross ? threadPolys : threadPolysOf(trN))];
        for (let k = 1; k < 20 && !res; k++) {
          const q = trN.c.at(k / 20);
          res = placeChip({w: probe.box.w, h: probe.box.h}, {x: q.x, y: q.y}, {obstacles, bounds, own: own2, pad: 12, gaps});
        }
      }
      if (!res) {
        // no clean spot with a leader: the note joins the free-standing block,
        // tagged with the pictogram of the feature it is about
        const icon = a.target === 'similarity' && R.relSim !== null ? R.features[R.relSim].icon : a.target === 'difference' && R.relDiff !== null ? R.features[R.relDiff].icon : null;
        loose.push({key: `note${i}`, text: a.text, icon});
        return null;
      }
      const cc = calloutChip(ctx, {name: `note${i}`, text: a.text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: mw, maxLines: 3, size});
      placed.push(cc.box);
      return cc;
    }).filter(Boolean) : [];

    // issue + assumption: one block in the largest free part of the desk
    const blockItems = [];
    const bigBlock = S.shape === 'portrait' ? 1.3 : 1;
    if (ctx.show('all') && p.issues.length) blockItems.push({key: 'issue', text: `${t.issue}: ${p.issues[0]}`, size: S.size * 1.1 * bigBlock, weight: 600, fill: th.card, stroke: th.inkSoft, color: th.ink});
    loose.forEach(n => blockItems.push({key: n.key, text: n.text, icon: n.icon, size: Math.max(S.size * 0.9, minLab), weight: 600, fill: th.card, stroke: th.ink, color: th.ink}));
    const captionSz = Math.min(capMax, Math.max(S.size * 0.86, minLab) * (bigBlock > 1 ? 1.15 : 1));
    if (ctx.show('all') && p.assumptions.length) blockItems.push({key: 'assume', text: p.assumptions.map(a => `${t.assumption}: ${a}`).join(' · '), size: Math.max(S.size * 0.86 * bigBlock, captionSz, pxU(16.5)), weight: 500, fill: th.paper, stroke: 'none', color: th.inkSoft});
    // key: the relevance marks are the author's, no conclusion is drawn
    if (ctx.show('all')) blockItems.push({key: 'keyNote', text: t.noConclusion, size: captionSz, weight: 600, fill: '#fff4d6', stroke: th.ink, color: th.ink});
    const regions = [];
    if (S.slide) {
      const x0 = S.lt.x + S.lt.w + 30;
      regions.push({x: x0, y: M, w: D.w - M - x0, h: cardPos.y - 40 - M});
      regions.push({x: x0, y: cardPos.y + card.h + 50, w: D.w - M - x0, h: D.h - M - (cardPos.y + card.h + 50)});
    } else if (S.shape === 'portrait') {
      regions.push({x: M, y: M, w: D.w - 2 * M, h: S.lt.y - M - 10});
    } else {
      const x0 = S.lt.x + S.lt.w + 36;
      regions.push({x: x0, y: S.lt.y, w: D.w - M - x0, h: D.h - M - S.lt.y});
    }
    regions.sort((a, b) => b.w * b.h - a.w * a.h);
    const iconSp = it => (it.icon ? it.size * 1.9 + 12 : 0);
    const putBlock = (items, V, wk = 1) => {
      const mw = Math.min(V.w - 16, 640) * wk;
      const probes = items.map(it => chip(ctx, it.text, {x: 0, y: 0, maxWidth: mw - iconSp(it), size: it.size, maxLines: 3, weight: it.weight}));
      if (wk < 1 && probes.some(pr => pr.fit && pr.fit.truncated)) return false;
      const bw = Math.max(...probes.map((pr, i) => pr.box.w + iconSp(items[i])));
      const bh = probes.reduce((acc, pr) => acc + pr.box.h, 0) + 10 * (probes.length - 1);
      let at = null;
      for (const fx of [0.5, 0.3, 0.7, 0, 1]) {
        for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8, 0.05, 0.95]) {
          const box = {x: V.x + (V.w - bw) * fx, y: V.y + (V.h - bh) * fy, w: bw, h: bh};
          if (box.x < V.x - 1 || box.y < V.y - 1 || box.y + bh > V.y + V.h + 1) continue;
          if (!hitsAny(box, obst(), 12)) { at = box; break; }
        }
        if (at) break;
      }
      if (!at) return false;
      let y = at.y;
      items.forEach((it, i) => {
        if (!it.icon) {
          const c = chip(ctx, it.text, {x: at.x + bw / 2, y, anchor: 'middle', maxWidth: mw, size: it.size, maxLines: 3, fill: it.fill, stroke: it.stroke, name: it.key, weight: it.weight, color: it.color});
          placed.push(c.box);
          extras.push({key: it.key, c});
        } else {
          const isp = iconSp(it);
          const x0 = at.x + (bw - probes[i].box.w - isp) / 2;
          const c = chip(ctx, it.text, {x: x0 + isp, y, maxWidth: mw - isp, size: it.size, maxLines: 3, fill: it.fill, stroke: it.stroke, weight: it.weight, color: it.color});
          const ir = it.size * 0.95;
          const cy = y + c.box.h / 2;
          const node = g({name: it.key},
            h('circle', {cx: r(x0 + ir), cy: r(cy), r: r(ir), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2.5}),
            g({transform: T(x0 + ir, cy)}, pictogram(it.icon, {s: ir * 1.3, ink: th.ink, soft: '#ffffff'})),
            h('line', {x1: r(x0 + 2 * ir), y1: r(cy), x2: r(x0 + isp), y2: r(cy), stroke: th.ink, 'stroke-width': 2.5}),
            c.node);
          const box = {x: x0, y, w: isp + c.box.w, h: c.box.h};
          placed.push(box);
          extras.push({key: it.key, c: {node, box}});
        }
        y += probes[i].box.h + 10;
      });
      return true;
    };
    const usable = regions.filter(V => V.h >= 60 && V.w >= 220);
    if (blockItems.length && !usable.some(V => putBlock(blockItems, V))) {
      // no room for one block: each item on its own, wherever it fits (a
      // narrower, taller chip when the full width does not fit)
      blockItems.forEach(it => [1, 0.8, 0.62].some(wk => usable.some(V => putBlock([it], V, wk))));
    }
    // reviewer caption: a name plate on the light table's front tray, beside
    // the resting magnifier (always drawn; the arm only passes over it)
    let actorChip = null;
    if (ctx.show('all') && p.actorLabels.a) {
      const trayTop = S.A.y + sh / 2 + LP;
      const trayMid = S.mag0.c.y;
      const magL = S.mag0.c.x - lensR - 22, magR = S.mag0.c.x + lensR * 3.7 + 16;
      const pencilL = S.lt.x + S.lt.w - 22 - 16; // (the plate may lie over the pencil)
      const spans = [{x0: S.lt.x + 22 + 16, x1: magL}, {x0: magR, x1: pencilL}].sort((u1, u2) => (u2.x1 - u2.x0) - (u1.x1 - u1.x0));
      const sp = spans[0];
      const psz = Math.max(S.size * 0.9, minLab);
      const icoR = psz * 0.95;
      const f = ctx.fit(p.actorLabels.a, {maxWidth: Math.max(80, sp.x1 - sp.x0 - 2 * icoR - 36), size: psz, minSize: pxU(16.5), maxLines: 3, weight: 700});
      const w = f.width + 2 * icoR + 36, hh = Math.max(f.height + 18, 2 * icoR + 12);
      const x = sp.x0 + Math.max(0, (sp.x1 - sp.x0 - w) / 2), y = clamp(trayMid - hh / 2, trayTop + 4, S.lt.y + S.lt.h - hh - 10);
      actorChip = {box: {x, y, w, h: hh}, node: g({name: 'actor', opacity: 0},
        h('path', {d: roundRectPath(x + 3, y + 5, w, hh, 10), fill: th.shadow}),
        h('path', {d: roundRectPath(x, y, w, hh, 10), fill: '#fbf5e4', stroke: th.ink, 'stroke-width': 2}),
        h('circle', {cx: r(x + 10 + icoR), cy: r(y + hh / 2), r: r(icoR), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}),
        g({transform: T(x + 10 + icoR, y + hh / 2)}, pictogram('person', {s: icoR * 1.25, ink: th.ink, soft: '#ffffff'})),
        textBlock(f, {x: x + 2 * icoR + 24, y: y + (hh - f.height) / 2, fill: th.ink}))};
    }
    // semantics: pictogram size in px (1080p), closest approach of the two
    // threads, how much of the pair's pictograms the parked lens hides
    const sampleLine = pts => {
      const out = [];
      for (let i = 1; i < pts.length; i++) {
        const a0 = pts[i - 1], b0 = pts[i];
        const n = Math.max(1, Math.ceil(Math.hypot(b0.x - a0.x, b0.y - a0.y) / 6));
        for (let k = 0; k <= n; k++) out.push({x: a0.x + (b0.x - a0.x) * k / n, y: a0.y + (b0.y - a0.y) * k / n});
      }
      return out;
    };
    const threadMinGap = threads.length === 2 ? (() => {
      const P0 = sampleLine(threads[0].pts), P1 = sampleLine(threads[1].pts);
      let m = Infinity;
      for (const q of P0) for (const q2 of P1) m = Math.min(m, Math.hypot(q.x - q2.x, q.y - q2.y));
      return m;
    })() : null;
    const lensLocalBox = hasLens ? {x: lensLocal.x - lensR, y: lensLocal.y - lensR, w: 2 * lensR, h: 2 * lensR} : null;
    const lensPicCover = lensLocalBox && pairPics.length ? Math.max(...pairPics.map(b => {
      const ix = Math.max(0, Math.min(b.x + b.w, lensLocalBox.x + lensLocalBox.w) - Math.max(b.x, lensLocalBox.x));
      const iy = Math.max(0, Math.min(b.y + b.h, lensLocalBox.y + lensLocalBox.h) - Math.max(b.y, lensLocalBox.y));
      return (ix * iy) / (b.w * b.h);
    })) : 0;
    const qa = {pictoPx: geo.ps / pxU(1), threadMinGap, lensPicCover};
    return {
      qa,
      R, S, geo, I, sw, sh, poseA, sheetA, sheetB, aNodes, bNodes, aPrints, bPrints, mergedNodes, throughNodes, throughName, throughBadge, badges,
      aNameBox, aLetterBox, bTexts,
      rS, rD, lensF: hasLens ? lensF : null, lensTarget, lt, card, cardPos, cardPos0, threads, captions, mag, magLow, lensR, arm, sh0, shoulderFor, out, OUT, bend, gripC, magAngleEnd,
      desk, extras, actorChip, notes, compositeBox, toA, centered, delay, cardGrip0, cardGrip1,
    };
  },
  build(ctx, L) {
    const {S, sw, sh} = L;
    const sleeve = h('line', {name: 'armX', stroke: ctx.theme.ink, 'stroke-width': ARM.width + 5, 'stroke-linecap': 'butt'});
    const look = actorLook(ctx, {appearance: {}}, 0);
    return g(null,
      L.desk.surface,
      g({'clip-path': L.desk.clip},
        L.lt.node,
        L.actorChip && L.actorChip.node,
        g({name: 'cardG', transform: T(L.cardPos0.x, L.cardPos0.y)}, L.card.node),
        L.magLow.node,
        g({name: 'sheetA', transform: T(S.A.x - sw / 2, S.A.y - sh / 2)}, L.sheetA.node, L.aNodes.map(n => n.node)),
        L.arm.palm,
        g({name: 'sheetB'}, g({transform: T(-sw / 2, -sh / 2)}, L.sheetB.node, L.bNodes.map(n => n.node))),
        g({name: 'overlay', transform: T(S.A.x - sw / 2, S.A.y - sh / 2)},
          L.throughName, L.throughBadge,
          L.throughNodes.map(n => n.node),
          L.mergedNodes.map(m => m.node),
          L.badges.map(b => b.node),
          L.rS && L.rS.node, L.rD && L.rD.node,
        ),
        L.lt.pegs,
        L.threads.map(tr => tr.c.node),
        L.mag.node,
        L.arm.thumb,
        // the sleeve continues past the shoulder to the frame edge
        sleeve,
        L.arm.arm,
        h('line', {name: 'armXf', stroke: look.outfit, 'stroke-width': ARM.width, 'stroke-linecap': 'butt'}),
      ),
      L.desk.frame,
      L.captions.map(c => c.node),
      L.extras.map(e => e.c.node),
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const {S, sw, sh} = L;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};

    // --- sheet B: rest → lift → carry (sideways first) → lower onto the pegs
    const lift = seg(a, ...W.lift);
    const cq = seg(a, ...W.carry);
    const lower = ease.inOutCubic(seg(a, ...W.lower));
    const B0 = S.B0;
    const A = L.poseA;
    const kx = ease.inOutCubic(cq);
    const ky = ease.inOutCubic(clamp((cq - L.delay) / (1 - L.delay)));
    const pose = a < W.carry[0]
      ? {x: B0.x, y: B0.y, rot: B0.rot, s: 1 + 0.035 * ease.outQuad(lift)}
      : {x: lerp(B0.x, A.x, kx), y: lerp(B0.y, A.y, ky), rot: lerp(B0.rot, 0, kx), s: 1.035 - 0.035 * lower};
    const liftAmt = a < W.carry[0] ? lift : 1 - lower;
    nodes.sheetB = {transform: T(pose.x, pose.y, pose.rot, pose.s)};
    nodes['shB-shadow'] = {transform: T(10 * liftAmt, 14 * liftAmt)};
    const landed = a >= W.lower[1];
    const gripW = place(pose, L.gripC);

    // --- rule card: pulled down beside the overlay (wide boxes)
    const slideP = S.slide ? ease.inOutCubic(seg(a, ...W.cardSlide)) : 0;
    const cardY = lerp(L.cardPos0.y, L.cardPos.y, slideP);
    nodes.cardG = {transform: T(L.cardPos.x, cardY)};

    // --- magnifier: resting (low layer) → picked up (high layer) → carried → laid over the difference
    const mLift = seg(a, ...W.magLift);
    const mCarry = ease.inOutCubic(seg(a, ...W.magCarry));
    const mSet = seg(a, ...W.magSet);
    const m0 = S.mag0;
    const lc = mix(m0.c, L.lensTarget, mCarry);
    const ang = lerp(m0.angle, L.magAngleEnd, mCarry);
    const magLift = mCarry > 0 ? 1 - mSet : mLift;
    const magHeld = a >= W.magLift[0];
    Object.assign(nodes, L.mag.frame(lc, ang, magLift));
    Object.assign(nodes, L.magLow.frame(m0.c, m0.angle, 0));
    nodes.mag = {opacity: magHeld ? 1 : 0};
    nodes.magLow = {opacity: magHeld ? 0 : 1};
    const magGrip = L.mag.gripAt(lc, ang);

    // --- the hand: park → B's edge → carries B → (card) → magnifier → park
    const reachB = ease.inOutCubic(seg(a, ...W.reach));
    const holdingB = a >= W.lift[0] && a < W.release;
    const gripEnd = place(A, L.gripC);
    const magGrip0 = L.mag.gripAt(m0.c, m0.angle);
    const withdraw = done ? ease.inOutCubic(seg(u, ...W.withdraw)) : 0;
    const off = k => ({x: L.out.x * L.OUT * k, y: L.out.y * L.OUT * k});
    let hand, holder;
    let shK = 0;
    if (a < W.lift[0]) {
      shK = 1 - reachB;
      const o = off(shK);
      hand = {x: gripW.x + o.x, y: gripW.y + o.y};
      holder = 'none';
    } else if (holdingB) { hand = gripW; holder = 'sheetB'; }
    else if (!magHeld) {
      const toMag = ease.inOutCubic(seg(a, ...W.magReach));
      let from = gripEnd;
      holder = 'none';
      if (S.slide) {
        const toCard = ease.inOutCubic(seg(a, ...W.cardReach));
        const cg = {x: L.cardPos.x + S.cardGrip.x, y: cardY + S.cardGrip.y};
        if (a < W.cardSlide[0]) from = mix(gripEnd, L.cardGrip0, toCard);
        else { from = cg; if (a < W.cardSlide[1]) holder = 'card'; }
      }
      hand = mix(from, magGrip0, toMag);
    } else if (withdraw <= 0) { hand = magGrip; holder = 'magnifier'; }
    else {
      shK = withdraw;
      const o = off(shK);
      hand = {x: magGrip.x + o.x, y: magGrip.y + o.y};
      holder = 'none';
    }
    const shoulder = L.shoulderFor(hand);
    const sol = L.arm.pose(shoulder, hand, L.bend);
    Object.assign(nodes, sol.nodes);
    // the sleeve continues past the shoulder: along the upper arm, bent toward
    // the frame edge on the arm's side
    const upN = sol.nodes['arm-upper'];
    const ux = shoulder.x - upN.x2, uy = shoulder.y - upN.y2;
    const ul = Math.hypot(ux, uy) || 1;
    const vx = ux / ul + L.out.x * 0.8, vy = uy / ul + L.out.y * 0.8;
    const vl = Math.hypot(vx, vy) || 1;
    const far = {x: shoulder.x + (vx / vl) * 1600, y: shoulder.y + (vy / vl) * 1600};
    const ext = {x1: r(shoulder.x), y1: r(shoulder.y), x2: r(far.x), y2: r(far.y)};
    nodes.armX = ext;
    nodes.armXf = ext;

    // --- A's labels disappear under the tracing paper as B covers them; A's
    // name and letter stay readable through it (drawn above B once covered)
    const bBox = centeredBounds(pose, sw, sh);
    const aVis = box => (box ? clamp(boxGap(box, bBox) / 40) : 1);
    const cb = L.compositeBox;
    const world = bx => ({x: cb.x + bx.x, y: cb.y + bx.y, w: bx.w, h: bx.h});
    let hiddenA = 0;
    L.aNodes.forEach(n => {
      if (!n.labBox) return;
      const o = aVis(world(n.labBox));
      if (o < 1) hiddenA++;
      nodes[`pa${n.f}-lab`] = {opacity: r(o, 3)};
    });
    const thr = landed ? seg(a, ...W.through) : 0;
    let nameCover = 0;
    if (L.aNameBox) {
      const v = aVis(world(L.aNameBox));
      // one copy at a time (the same text in the same place): A's own print
      // until B nears it, then the copy drawn above B
      const ot = thr > 0 || v < 1;
      nodes['shA-names'] = {opacity: ot ? 0 : 1};
      nodes.otName = {opacity: ot ? 1 : 0};
      nameCover = 1 - v;
    }
    const vL = aVis(world(L.aLetterBox));
    const otL = thr > 0 || vL < 1;
    if (ctx.show('key')) nodes['shA-letter'] = {opacity: otL ? 0 : 1};
    nodes.otBadge = {opacity: otL ? 1 : 0};
    // B's texts fade where they would pass over A's name / letter seen through B
    const through = [];
    if (L.aNameBox && nameCover > 0) through.push(world(L.aNameBox));
    if (1 - vL > 0) through.push(world(L.aLetterBox));
    const bWorld = bx => {
      const pts = [[bx.x, bx.y], [bx.x + bx.w, bx.y], [bx.x + bx.w, bx.y + bx.h], [bx.x, bx.y + bx.h]].map(([x, y]) => place(pose, {x: x - sw / 2, y: y - sh / 2}));
      const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
      return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
    };
    L.bTexts.forEach(bt => {
      let o = 1;
      if (!landed) for (const tb of through) o = Math.min(o, clamp(boxGap(bWorld(bt.box), tb) / 24));
      nodes[bt.name] = {opacity: r(o, 3)};
    });

    // --- reveal after landing: merged overprints, show-through, badges
    const nM = Math.max(1, L.mergedNodes.length);
    const mergeState = [];
    L.mergedNodes.forEach((m, k) => {
      const s0 = W.reveal[0] + (k / nM) * (W.reveal[1] - W.reveal[0] - 0.05);
      const q = landed ? seg(a, s0, s0 + 0.05) : 0;
      const pop = reduced ? 1 : 1 + 0.1 * Math.sin(Math.PI * q);
      nodes[`om${m.f}`] = {opacity: r(q, 3), transform: pop !== 1 ? scaleAbout(m.c.pc.x, m.c.pc.y, pop) : ''};
      mergeState.push(q >= 1 ? 'merged' : q > 0 ? 'merging' : 'apart');
    });
    L.throughNodes.forEach(n => { nodes[`ot${n.f}`] = {opacity: r(thr, 3)}; });
    let badgesShown = 0;
    L.badges.forEach((b, k) => {
      const s0 = W.reveal[0] + 0.02 + (k / Math.max(1, L.badges.length)) * 0.08;
      const q = landed ? seg(a, s0, s0 + 0.04) : 0;
      if (q >= 1) badgesShown++;
      nodes[`bd${b.f}`] = {opacity: r(q, 3), transform: T(b.sp.x, b.sp.y, 0, reduced ? 1 : 0.6 + 0.4 * ease.outBack(q))};
    });

    // --- rings, threads, captions
    const ringP = done ? ease.inOutCubic(seg(u, ...W.rings)) : 0;
    if (L.rS) nodes.ringS = {opacity: ringP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.rS.len * (1 - ringP))};
    if (L.rD) {
      nodes.ringD = {opacity: ringP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.rD.len * (1 - ringP))};
      nodes['lz-ringD'] = {'stroke-dashoffset': r(L.rD.len * (1 - ringP))};
    }
    const threadP = [];
    L.threads.forEach((tr, k) => {
      const s0 = W.threads[0] + k * 0.02;
      const q = done ? ease.inOutCubic(seg(u, s0, W.threads[1] - (L.threads.length - 1 - k) * 0.02)) : 0;
      threadP.push(r(q, 3));
      Object.assign(nodes, tr.c.frame(q));
    });
    const capP = done ? seg(u, ...W.captions) : 0;
    L.captions.forEach(c => { nodes[`cap-${c.key}`] = {opacity: r(capP, 3)}; });
    // the issue block appears as soon as its place is free (B gone and, on
    // wide boxes, the card pulled down), not only in the hold
    const issueW = S.slide ? [0.57, 0.64] : [0.43, 0.5];
    L.extras.forEach(e => { nodes[e.key] = {opacity: done ? r(seg(u, ...issueW), 3) : 0}; });
    if (L.actorChip) nodes.actor = {opacity: 1};
    L.notes.forEach(n => Object.assign(nodes, n.frame(done ? seg(u, ...W.notes) : 0)));

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const crossB = place(pose, L.centered(L.geo.cross[0]));
    const crossA = L.toA(L.geo.cross[0]);
    const edgeDist = (q, b) => {
      const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
      const outside = Math.hypot(dx, dy);
      if (outside > 0) return outside;
      return Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y);
    };
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      hand: P2(sol.hand),
      gripB: P2(gripW),
      magGrip: P2(magGrip),
      sheetB: P2(pose),
      lens: P2(lc),
      card: P2({x: L.cardPos.x, y: cardY}),
      holder,
      sheetOverCard: boxGap(bBox, {x: L.cardPos.x, y: cardY - 34, w: L.card.w, h: L.card.h + 34}) <= 0,
      holderB: a < W.lift[0] ? 'desk' : holdingB ? 'hand' : 'registered',
      registration: r(dist(crossA, crossB), 2),
      landed,
      mergeState,
      shared: L.mergedNodes.map(m => m.f),
      kinds: L.R.features.map(F => F.kind),
      glyphs: L.badges.map(b => b.glyph),
      badgesShown,
      throughShown: r(thr, 3),
      hiddenALabels: hiddenA,
      nameAVisible: L.aNameBox ? r(Math.max(Number(nodes['shA-names'].opacity), Number(nodes.otName.opacity)), 3) : 1,
      magHeld,
      lensOver: mSet >= 1 ? L.lensF : null,
      relSim: L.R.relSim,
      relDiff: L.R.relDiff,
      threads: threadP,
      threadKinds: L.threads.map(() => (p.finalState === 'relevance-pending' ? 'pending' : 'relation')),
      threadArrows: L.threads.map(() => false),
      threadLands: L.threads.map(tr => r(edgeDist(tr.c.to, tr.rw), 2)),
      threadCrossings: L.threads.length === 2 ? crossings(L.threads[0].pts, L.threads[1].pts) : 0,
      rings: r(ringP, 3),
      captions: r(capP, 3),
      reach: {arm: sol.reached},
      allReached: sol.reached,
      actionCapped: p.actionProgress < 1 && u > capU,
      reviewerCaption: L.actorChip ? Number(nodes.actor.opacity) === 1 : false,
      pictoPx: r(L.qa.pictoPx, 1),
      threadMinGap: L.qa.threadMinGap === null ? null : r(L.qa.threadMinGap, 1),
      lensPicCover: r(L.qa.lensPicCover, 3),
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
    slug: 'reasoning-02-story',
    title: 'Case analogy — two tracing sheets laid one over the other',
    titleEs: 'Analogía de casos — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Analogía de casos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down light table: a reviewer lifts the tracing sheet of case B and lowers it onto case A’s pegs; shared features coincide (merged ink, “=” tick), differing variants stay side by side (“≠”), a magnifier is laid over the relevant difference and the rule card’s sockets thread to the relevant similarity and difference — all as supplied, no conclusion drawn.',
    tags: ['reasoning', 'analogy', 'cases', 'tracing paper', 'overlay', 'light table', 'magnifier', 'similarity', 'difference', 'rule', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/analogia-de-casos.js', 'src/animations/causation/kits/place.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
