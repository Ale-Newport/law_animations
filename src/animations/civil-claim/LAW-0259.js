/**
 * LAW-0259 — Contestación estructurada · contrast
 *
 * Storyboard (two complete copies of the same office wall — side by side on wide and square boxes, stacked on tall
 * ones; each has the pin board with the initial claim's numbered allegations and Party B's structured response, Party
 * B with her pointer, Party A seated at the desk under the board with the case file and the two trays, and the
 * calendar; every supplied text that is the same in A and B — the allegations, the sections and the shared facts — is
 * printed once in a shared strip; A is marked with a solid ● badge, B with a solid ◆ badge of equal size and weight):
 *  0.00–0.17  base: two identical scenes at rest.
 *  0.17–0.40  the scenario headers appear and the changed-fact chip names the one fact that differs; in each scene the
 *             first section's row receives its supplied state — ● admitted in A, ◆ disputed in B (a localized, explicit
 *             change on the response itself).
 *  0.40–0.77  in parallel, in both scenes, Party B carries each section's thread to the allegation it answers; the
 *             first section's thread is pinned as a solid line in A and as a dashed (disputed-marker) line in B — the
 *             relation itself is drawn differently; every other thread is identical.
 *  0.77–1.00  a numbered marker ① sits beside the changed thread in both scenes and the guide chip ① names the
 *             difference; the neutral note and the "as supplied · no conclusion drawn" key. No winner, score, effect of
 *             admitting or disputing, burden, consequence or outcome is shown.
 * @module animations/civil-claim/LAW-0259
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {
  CE_DEFAULTS, CE_COMMON_ES, CE_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, solveBoard, placeBoard, boardStage, choreo, sectionsOf, stateKeyText, localizeDefaults, stateBadge,
} from './kits/contestacion-estructurada.js';

const ID = 'LAW-0259';
const DURATION = 7500;
const C0 = 0.4, C1 = 0.77;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ = {headers: [0.17, 0.24], rowMark: [0.24, 0.3], changed: [0.28, 0.36], guide: [0.775, 0.83], note: [0.8, 0.86]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** how much of the people scale the compact board follows (the changed thread stays legible beside large people) */
const BOARD_K = {landscape: 0.6, portrait: 0.6, square: 0.3};
const S_MIN = {landscape: 0.3, square: 0.3, portrait: 0.3};

const STRINGS = {
  en: {...CE_STRINGS.en, same: 'Same in A and B', changedFact: 'Changed fact', answers: 'answers'},
  es: {...CE_STRINGS.es, same: 'Igual en A y B', changedFact: 'Hecho cambiado', answers: 'contesta'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  ...contrastFields(),
};

const defaultParams = {
  parties: CE_DEFAULTS.parties,
  documents: CE_DEFAULTS.documents,
  stages: CE_DEFAULTS.stages,
  dates: CE_DEFAULTS.dates,
  scenarioA: {label: 'Section 1: fact admitted'},
  scenarioB: {label: 'Section 1: fact disputed'},
  changedFact: 'The state supplied for section 1',
  sharedFacts: ['Same allegations, sections and parties'],
  comparisonLabels: {guide: 'Only section 1’s thread and state differ', neutral: 'No conclusion is drawn'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...CE_COMMON_ES,
  scenarioA: {label: 'Apartado 1: hecho admitido'},
  scenarioB: {label: 'Apartado 1: hecho controvertido'},
  changedFact: 'El estado aportado del apartado 1',
  sharedFacts: ['Mismas alegaciones, apartados y partes'],
  comparisonLabels: {guide: 'Solo cambian el hilo y el estado del apartado 1', neutral: 'Sin conclusión'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const D = ctx.design;
    const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const B = SIZE[ctx.view.shape];
    const floorK = 16.4 / pxPer / (B * 0.96);
    // (supplied text starts at ~20 px; it steps down — never under ~16.4 px — only while the strip and headers leave
    // the scenes too small for their people)
    // each arrangement and people scale at each text size; the largest people among the layouts that fit win (the
    // supplied text steps down only when no layout keeps the people >= 45 px)
    const arrs = {landscape: ['row'], portrait: ['column', 'row'], square: ['row', 'side']}[ctx.view.shape];
    let L = null;
    for (const k of [1, 0.92, 0.85].filter(k2 => k2 > floorK + 0.03).concat([floorK])) {
      for (const arr of arrs) for (const tk of ctx.view.shape === 'landscape' ? [false] : [false, true]) for (const pk of ctx.view.shape === 'square' ? [3.8, 3.4, 3, 2.7, 2.4, 2.1, 1.8] : [3.2, 2.7, 2.4, 2.1, 1.8, 1.5, 1.25, 1]) {
        const q = compose(ctx, Math.max(k, floorK), arr, pk, tk);
        // (labels hidden: the arrangement that fills the frame best; otherwise the larger people)
        const better = ctx.show('key') || q.fillOk === L?.fillOk ? q.headPx > L?.headPx : q.fillOk;
        if (!L || (q.ok && !L.ok) || (q.ok === L.ok && better)) L = q;
        // (people scales are tried largest first: the first that fits is this arrangement's best)
        if (q.ok) break;
      }
      // (the standing people floors — 55 px at 1:1, 60 px elsewhere — with a little margin: below them the text steps down)
      if (L.ok && L.headPx >= (ctx.view.shape === 'square' ? 56.5 : 61.5)) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** Scenario badge: A a solid circle (●), B a solid diamond (◆) of equal weight. */
function badge(th, k, cx, cy, R) {
  if (!k) return h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: th.accent2, stroke: th.ink, 'stroke-width': 2.5});
  const d = R * 1.22;
  return h('path', {d: `M${r(cx)} ${r(cy - d)}L${r(cx + d)} ${r(cy)}L${r(cx)} ${r(cy + d)}L${r(cx - d)} ${r(cy)}Z`, fill: th.accent3, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'});
}

/**
 * flow chips left to right, wrapping rows, inside width w starting at (x, y); a block (bw × bh) at the top left is kept
 * free (the rows beside it start after it)
 */
function flow(items, x, y, w, gap, bw = 0, bh = 0) {
  const out = [];
  let cy = y, rowH = 0;
  // beside the block: rows take, in order, the chips that fit there; a chip too wide waits for the full-width rows
  const rest = [];
  if (bw) {
    const xs = x + bw + gap;
    let cx = xs;
    for (const it of items) {
      if (it.w > x + w - xs) { rest.push(it); continue; }
      if (cx > xs && cx + it.w > x + w) {
        if (cy + rowH + gap + it.h > y + bh + 0.5) { rest.push(it); continue; }
        cy += rowH + gap; rowH = 0; cx = xs;
      }
      if (cy + it.h > y + bh + 0.5 && out.length) { rest.push(it); continue; }
      out.push({...it, x: cx, y: cy});
      cx += it.w + gap;
      rowH = Math.max(rowH, it.h);
    }
    cy = y + bh + gap; rowH = 0;
  } else rest.push(...items);
  let cx = x;
  let first = true;
  for (const it of rest) {
    if (!first && cx + it.w > x + w) { cy += rowH + gap; rowH = 0; cx = x; }
    out.push({...it, x: cx, y: cy});
    cx += it.w + gap;
    rowH = Math.max(rowH, it.h);
    first = false;
  }
  // (keep the supplied reading order for the placed chips)
  out.sort((a2, b2) => items.indexOf(items.find(q => q.name === a2.name)) - items.indexOf(items.find(q => q.name === b2.name)));
  return {items: out, h: Math.max(bh, rest.length ? cy + rowH - y : (bw ? bh : 0))};
}

/** The sections in each scenario: the first one's state is A admitted / B disputed; the others as supplied. */
const secsFor = (p, k) => sectionsOf(p).map((s, i) => (i === 0 ? {...s, state: k ? 'disputed' : 'admitted'} : s));

function compose(ctx, sizeK, arr, peopleK = 1, tuck = false) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const small = B * 0.96 * sizeK;
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf(ctx, p);
  const sp = {...p, labels: CE_DEFAULTS.labels};
  // arr: 'row' (side by side, strip under), 'column' (stacked, strip under), 'side' (stacked, strip in a right column)
  const row = arr === 'row';
  const side = arr === 'side';
  const colW = side ? Math.round(D.w * 0.3) : 0;
  // ---- top band: the state key and the "as supplied" key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
  const stKey = showKey ? gchip(ctx, stateKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  let y = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
  // ---- shared strip (bottom): what is the same in A and B — the shared facts, the allegations and the sections —
  // printed once; then the changed-fact chip, the guide chip and the neutral note
  const secs = sectionsOf(p);
  const stripTexts = showAll ? [
    ...(p.sharedFacts.length ? [{name: 'same', text: `${t.same}: ${p.sharedFacts.join(' · ')}`, weight: 700}] : []),
    {name: 'claim-t', text: p.documents.claim.title, weight: 700},
    ...p.documents.claim.allegations.map((a, i) => ({name: `al${i}`, text: `${i + 1}  ${a}`, weight: 600})),
    {name: 'resp-t', text: p.documents.response.title, weight: 700},
    ...secs.map((s, i) => ({name: `sec${i}`, text: `§${i + 1}  ${s.label} · ${t.answers} ${s.refers + 1}`, weight: 600})),
    ...[p.scenarioA, p.scenarioB].map((sc, k) => (sc.caption ? {name: `cap${k}`, text: `${k ? '◆' : '●'} ${sc.caption}`, weight: 600} : null)).filter(Boolean),
  ] : [];
  const changedText = showAll ? `${t.changedFact}: ${p.changedFact}` : null;
  const guideText = showAll && p.comparisonLabels.guide ? `1  ${p.comparisonLabels.guide}` : null;
  const noteText = showAll && p.comparisonLabels.neutral ? p.comparisonLabels.neutral : null;
  const stripW = side ? colW : D.w - 16;
  const mk = (name, text, weight = 600, stroke = th.inkSoft) => {
    const c = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: stripW, size: small, minSize: small, maxLines: 6, fill: th.card, stroke, color: th.ink, weight});
    return {name, text, weight, stroke, w: c.box.w, h: c.box.h};
  };
  const items = [...stripTexts.map(q => mk(q.name, q.text, q.weight)), ...(changedText ? [mk('changed', changedText, 700, th.ink)] : []), ...(guideText ? [mk('guide', guideText, 700, th.ink)] : []), ...(noteText ? [mk('note', noteText, 600)] : [])];
  // ---- the two insets (A, B) at the head of the strip: the changed thread drawn large — its two pins, its lane and
  // its state glyph (>= 25 px across at 1080p) — so the one difference reads at every size, labels shown or hidden
  const Rg = Math.max(12.5 / pxPer, small * 0.45);
  const insW = Rg * 6.2, insH = Rg * 6.6;
  const blkW = 2 * insW + 12, blkH = insH;
  const fl0 = flow(items, 0, 0, stripW, 8, blkW, blkH);
  const stripH = side ? 0 : fl0.h + 10;
  // ---- scenario headers (one per scene)
  // (each header carries its scenario's label; the two captions are printed in the strip, marked ● and ◆)
  const hdrText = k => (k ? p.scenarioB : p.scenarioA).label;
  const R = small * 0.5;
  // ---- name chips under each party, in each scene
  const capOf = i => partyCaption(p, i);
  const sceneW = row ? (D.w - 16 - 24) / 2 : D.w - 16 - (side ? colW + 20 : 0);
  const hdrProbe = showKey ? [0, 1].map(k => gchip(ctx, hdrText(k), {x: 0, y: 0, anchor: 'start', maxWidth: sceneW - R * 3, size: small, minSize: small, maxLines: 4})) : [];
  const hdrH = hdrProbe.length ? Math.max(...hdrProbe.map(c => c.box.h)) + 8 : 0;
  const chipMax = sceneW * 0.5;
  const probe = showKey ? [0, 1].map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 12 : 6;
  const top0 = y;
  const bottom = D.h - 8 - stripH;
  const sceneH = row ? bottom - top0 - hdrH - chipBand : (bottom - top0 - 2 * (hdrH + chipBand) - 12) / 2;
  // ---- the two scenes: compact boards (texts are in the strip), the board hanging over the desk; one solve, one scale
  // (the scenes' sheets show filler rows only: the strip prints the allegations and sections, in the same order)
  const opts = k => ({prefix: k ? 'sb' : 'sa', p: sp, looks, showText: false, markIdx: p.dates.responseDay, compact: true, tuck, sections: secsFor(p, k), lwK: tuck ? 16 : 26, peopleK, compactTs: 20 * Math.max(1, peopleK * BOARD_K[shape])});
  // (the wall rises into the scene box's free height: the two rooms fill their boxes)
  const sol = solveBoard(ctx, {B, availW: sceneW, availH: sceneH, sMin: S_MIN[shape], opts: opts(0), fillH: true, scMin: 0.1});
  const stA = sol.stage;
  const stB0 = boardStage(ctx, {...opts(1), ts: sol.ts});
  const spareB = sceneH / sol.s - (stB0.ext.h - 30);
  const stB = sol.fitted && spareB > 2 ? boardStage(ctx, {...opts(1), ts: sol.ts, wallExtra: Math.round(spareB)}) : stB0;
  const solB = {stage: stB, desk: null, s: sol.s};
  const x0s = row ? [8, 8 + sceneW + 24] : [8, 8];
  const tops = row ? [top0 + hdrH, top0 + hdrH] : [top0 + hdrH, top0 + hdrH + sceneH + chipBand + 12 + hdrH];
  const PLs = [placeBoard(sol, {x0: x0s[0], top0: tops[0], availW: sceneW, bottom: tops[0] + sceneH, chipBand: 0}), placeBoard(solB, {x0: x0s[1], top0: tops[1], availW: sceneW, bottom: tops[1] + sceneH, chipBand: 0})];
  const stages = [stA, stB];
  const occupied = [];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  // headers: just above each scene's board/wall
  const headers = showKey ? [0, 1].map(k => {
    const PL = PLs[k];
    const E = stages[k].ext;
    const wallTop = PL.board.oy + E.y * PL.s;
    const xL = x0s[k];
    const c = gchip(ctx, hdrText(k), {x: xL + R * 2.6, y: Math.max(top0, wallTop - hdrH), anchor: 'start', maxWidth: sceneW - R * 3, size: small, minSize: small, maxLines: 4, fill: th.card, stroke: th.ink, color: th.ink, weight: 700, name: `hdr${k}-chip`});
    occupied.push(c.box);
    return {c, bx: xL + R * 1.2, by: c.box.y + c.box.h / 2};
  }) : [];
  // name chips under each scene's floor
  const chips = [];
  if (showKey) {
    [0, 1].forEach(k => {
      const PL = PLs[k];
      const G = stages[k].G;
      const xs = [PL.board.M({x: G.xB, y: 0}).x, PL.board.M({x: 0, y: 0}).x];
      [0, 1].forEach(i => {
        const w = probe[i].box.w;
        const sx0 = x0s[k];
        const cx = clamp(xs[i], sx0 + w / 2, sx0 + sceneW - w / 2);
        const c = gchip(ctx, capOf(i), {x: cx, y: PL.floorB + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${k ? 'b' : 'a'}${i ? 'a' : 'b'}`});
        chips.push(c);
        occupied.push(c.box);
      });
    });
  }
  // the strip, placed under the scenes
  const stripX = side ? D.w - 8 - colW : 8, stripY = side ? top0 : D.h - 8 - (stripH - 10);
  const fl = flow(items, stripX, stripY, stripW, 8, blkW, blkH);
  const insets = [0, 1].map(k => ({x: stripX + k * (insW + 12), y: stripY, w: insW, h: insH, R: Rg}));
  const strip = fl.items.map(it => ({...it, c: gchip(ctx, it.text, {x: it.x, y: it.y, anchor: 'start', maxWidth: stripW, size: small, minSize: small, maxLines: 6, fill: th.card, stroke: it.stroke, color: th.ink, weight: it.weight, name: `strip-${it.name}`})}));
  // the guide markers ① at each inset's top right corner (never over a thread)
  const markR = small * 0.62;
  const markers = insets.map(b => ({x: b.x + b.w - markR - 4, y: b.y + markR + 4}));
  // boxes mapped for the checks
  const boxes = PLs.map(PL => PL.boxes);
  const faces = boxes.flatMap(b => [b.headA, b.headB]).filter(f => f.w > 0);
  const labelBoxes = [...chips.map(c => c.box), ...headers.map(q => q.c.box), ...strip.map(q => q.c.box), key && key.box, stKey && stKey.box].filter(Boolean);
  const truncated = [...chips.map(c => c.fit), ...headers.map(q => q.c.fit), ...strip.map(q => q.c.fit), key && key.fit, stKey && stKey.fit].filter(f => f && f.truncated).map(f => f.full);
  const labelsClear = labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)));
  const headPx = Math.min(...boxes.map(b => b.headB.w)) * pxPer * 0.85;
  const sceneShare = {w: r(stA.ext.w * sol.s / D.w, 3), h: r(stA.ext.h * sol.s / D.h, 3)};
  return {insets, PLs, stages, headers, chips, strip, markers, markR, key, stKey, faces, labelBoxes, truncated, labelsClear, headPx, sceneShare, small, R, row,
    ok: sol.fitted && !truncated.length && labelsClear && (!side || fl.h + top0 <= D.h - 8) && fl.h + stripY <= D.h - 4, arr, peopleK, tuck, sizeK, showAll,
    // (the drawn block of both scenes, as a share of the design box: for the labels-hidden choice)
    fillOk: (stA.ext.w * sol.s * (row ? 2 : 1)) / D.w >= 0.8 && ((stA.ext.h - 30) * sol.s * (row ? 1 : 2)) / D.h >= 0.5, s: sol.s, textPx: r(sol.stage.G.ts * sol.s, 2)};
}

/** One inset: the changed thread of scene k drawn large (response pin below → its lane → claim pin above), its glyph. */
function inset(ctx, b, k, L) {
  const th = ctx.theme;
  const R = b.R;
  const state = k ? 'disputed' : 'admitted';
  const top = {x: b.x + R * 1.7, y: b.y + R * 1.5}, bot = {x: b.x + R * 1.7, y: b.y + b.h - R * 1.5};
  const lane = b.x + b.w - R * 2.2;
  const d = `M${r(bot.x)} ${r(bot.y)}H${r(lane)}V${r(top.y)}H${r(top.x)}`;
  const len = 2 * (lane - top.x) + (bot.y - top.y);
  const sheet = (y0, y1, fill) => h('path', {d: roundRectPath(b.x + R * 0.5, y0, R * 2.2, y1 - y0, 4), fill, stroke: '#1f2328', 'stroke-width': 2});
  return g({name: `inset${k}`},
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: '#c9a77a', stroke: '#1f2328', 'stroke-width': 2.5}),
    sheet(b.y + R * 0.45, top.y + R * 0.9, th.paper),
    sheet(bot.y - R * 0.9, b.y + b.h - R * 0.45, th.paper),
    h('path', {name: `inset${k}-line`, d, fill: 'none', stroke: k ? th.accent3 : th.accent2, 'stroke-width': r(R * 0.45), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
    k ? h('path', {name: `inset${k}-dash`, d, fill: 'none', stroke: th.paper, 'stroke-width': r(R * 0.22), 'stroke-dasharray': `${r(R * 0.9)} ${r(R * 0.6)}`, opacity: 0}) : null,
    [top, bot].map(q => h('circle', {cx: r(q.x), cy: r(q.y), r: r(R * 0.42), fill: th.metal, stroke: '#1f2328', 'stroke-width': 2})),
    stateBadge(ctx, {name: `inset${k}-bd`, state, x: lane, y: (top.y + bot.y) / 2, R}),
  );
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const font = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";
  // the first section's supplied state on its response row (the localized change): ● in A, ◆ in B
  const rowMarks = L.stages.map((st, k) => {
    const G = st.G;
    const PL = L.PLs[k];
    const rw = G.resp.rows[0];
    const q = PL.board.M({x: G.respPos.x + G.LW - G.ts * 2.4, y: G.respPos.y + rw.y + rw.h / 2});
    return g({name: `rowmark${k}`, opacity: 0}, stateBadge(ctx, {name: `rowmark${k}-g`, state: k ? 'disputed' : 'admitted', x: q.x, y: q.y, R: G.ts * 0.42 * PL.s, opacity: 1}));
  });
  return g(null,
    L.stages.map((st, k) => g({transform: `${T(L.PLs[k].board.ox, L.PLs[k].board.oy)} scale(${r(L.s, 5)})`}, st.node)),
    rowMarks,
    L.chips.map(c => c.node),
    L.headers.map((q, k) => g({name: `hdr${k}`, opacity: 0}, badge(th, k, q.bx, q.by, L.R), q.c.node)),
    L.strip.map(q => (['changed', 'guide', 'note'].includes(q.name) ? g({name: `strip-${q.name}-g`, opacity: 0}, q.c.node) : q.c.node)),
    L.insets.map((b, k) => inset(ctx, b, k, L)),
    L.showAll && L.markers.map((m, k) => g({name: `mark${k}`, opacity: 0},
      h('circle', {cx: r(m.x), cy: r(m.y), r: r(L.markR), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      h('text', {x: r(m.x), y: r(m.y + L.small * 0.34), 'text-anchor': 'middle', 'font-size': r(L.small), 'font-weight': 700, 'font-family': font, fill: th.ink}, '1'))),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
  );
}

function frameScene(ctx, L, u) {
  const cRaw = (u - C0) / (C1 - C0);
  const c = clamp(cRaw, 0, 1);
  const nodes = {};
  const vs = L.stages.map(st => choreo(c, st.G));
  const posed = L.stages.map((st, k) => st.pose(vs[k]));
  posed.forEach(pz => Object.assign(nodes, pz.nodes));
  const hdrP = seg(u, ...W_.headers);
  const rowP = seg(u, ...W_.rowMark);
  const chP = seg(u, ...W_.changed);
  const guideP = seg(u, ...W_.guide);
  const noteP = seg(u, ...W_.note);
  [0, 1].forEach(k => {
    if (L.headers[k]) nodes[`hdr${k}`] = {opacity: r(hdrP, 3)};
    nodes[`rowmark${k}`] = {opacity: r(rowP, 3)};
    if (L.showAll) nodes[`mark${k}`] = {opacity: r(guideP, 3)};
    // (each inset follows its scene's first thread: drawn as it is carried, its glyph once it is pinned)
    const b = L.insets[k], R0 = b.R;
    const len = 2 * ((b.x + b.w - R0 * 2.2) - (b.x + R0 * 1.7)) + (b.h - 3 * R0);
    const dr = vs[k].drawn[0];
    nodes[`inset${k}-line`] = {'stroke-dashoffset': r(len * (1 - dr))};
    if (k) nodes[`inset${k}-dash`] = {opacity: dr >= 1 ? 1 : 0};
    nodes[`inset${k}-bd`] = {opacity: r(vs[k].badge[0], 3)};
  });
  if (L.strip.some(q => q.name === 'changed')) nodes['strip-changed-g'] = {opacity: r(chP, 3)};
  if (L.strip.some(q => q.name === 'guide')) nodes['strip-guide-g'] = {opacity: r(guideP, 3)};
  if (L.strip.some(q => q.name === 'note')) nodes['strip-note-g'] = {opacity: r(noteP, 3)};
  const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
  const M = k => q => (q ? {x: r(L.PLs[k].board.M(q).x), y: r(L.PLs[k].board.M(q).y)} : null);
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), phase: vs[0].phase, active: vs[0].active,
      drawnA: vs[0].drawn.map(x => r(x, 3)), drawnB: vs[1].drawn.map(x => r(x, 3)), badgesA: vs[0].badge.map(x => r(x, 3)), badgesB: vs[1].badge.map(x => r(x, 3)),
      statesA: L.stages[0].G.links.map(l => l.state), statesB: L.stages[1].G.links.map(l => l.state),
      refersA: L.stages[0].G.links.map(l => l.refers), refersB: L.stages[1].G.links.map(l => l.refers),
      handA: M(0)(posed[0].semantic.hand), handB: M(1)(posed[1].semantic.hand), gripA: M(0)(posed[0].semantic.grip), gripB: M(1)(posed[1].semantic.grip),
      tipA: M(0)(posed[0].semantic.tip), tipB: M(1)(posed[1].semantic.tip),
      allReached: posed.every(pz => pz.semantic.allReached), markP: posed[0].semantic.markP,
      headers: r(hdrP, 3), rowMark: r(rowP, 3), changedShown: r(chP, 3), guide: r(guideP, 3), note: r(noteP, 3),
      truncated: L.truncated, labelsClear: L.labelsClear, headPx: r(L.headPx, 1), textPx: L.textPx, sceneShare: L.sceneShare, arrangement: L.arr + (L.tuck ? '-tuck' : ''), peopleK: L.peopleK, textK: r(L.sizeK, 3),
      faces: L.faces.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !hit(b, f, 0))),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-05-contrast',
    title: 'Structured response — the same response with the first section’s fact admitted (A) or disputed (B)',
    titleEs: 'Contestación estructurada — Contraste entre dos escenarios',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Contestación estructurada',
    treatment: 'contrast',
    family: 'paired-scenarios',
    description: 'Two complete copies of the same office wall — the pin board with the initial claim’s allegations and Party B’s structured response, Party B with her pointer, Party A at the desk with the case file and the trays, and the calendar — side by side (stacked on tall frames). The shared texts are printed once. Only the state supplied for the first section differs: ● admitted in A (a solid thread) and ◆ disputed in B (a dashed thread), equal weight; Party B links every section in parallel in both scenes. A numbered marker and a guide chip name the one difference. No winner, score, effect of admitting or disputing, burden, consequence or outcome is shown.',
    tags: ['structured response', 'contrast', 'admitted fact', 'disputed fact', 'paired scenarios', 'allegations', 'sections', 'pin board', 'calendar', 'trays'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/contestacion-estructurada.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
