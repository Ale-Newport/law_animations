/**
 * LAW-0271 — Acumulación de pretensiones · contrast
 *
 * Storyboard (two complete copies of the same room — side by side on wide and square boxes, stacked on tall ones; each
 * has Party A and Party B, the rack of trays with one claim folder per tray (each with its own label), the push bar,
 * the case file open on its easel with one empty slot per folder, and the calendar; every supplied text that is the
 * same in A and B is printed once in a shared strip; A is marked with a solid ● badge, B with a solid ◆ badge of equal
 * size and weight):
 *  0.00–0.17  base: two identical rooms at rest — the folders in their trays, the empty slots, no configuration drawn.
 *  0.17–0.40  the scenario headers appear and the changed-fact chip names the one fact that differs; the supplied
 *             configuration is drawn round the empty slots — in A one jacket frame and one spine round all of them
 *             (joint handling, ●), in B one frame and one clip per slot (separate folders, ◆) — a localized, explicit
 *             change of geometry, the same stroke and weight in both.
 *  0.40–0.77  in parallel and identically: Party A pushes every folder with the bar into its slot; each keeps its label.
 *  0.77–1.00  a numbered marker ① sits on each inset (the slots column drawn large: the folders inside one frame in A,
 *             inside one frame each in B) and the guide chip ① names the difference; the neutral note and the
 *             "as supplied · no conclusion drawn" key. No winner, score, rule, condition, effect or outcome is shown.
 * @module animations/civil-claim/LAW-0271
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {
  AP_DEFAULTS, AP_COMMON_ES, AP_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, solveStage, placeStage, deskStage, choreo, configKeyText, localizeDefaults, stateGlyph,
} from './kits/acumulacion-pretensiones.js';

const ID = 'LAW-0271';
const DURATION = 7500;
const C0 = 0.4, C1 = 0.77;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ = {headers: [0.17, 0.24], appear: [0.24, 0.32], changed: [0.28, 0.36], guide: [0.775, 0.83], note: [0.8, 0.86]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** how much of the people scale the compact sheets follow */
const BOARD_K = {landscape: 0.6, portrait: 0.6, square: 0.7};
/** blank folder height on the rooms' compact props (in their text size): taller folders, a larger changed fact */
const rowKOf = n => Math.max(1.8, Math.min(4.2, 8.4 / n));
const LW_K = {landscape: 10, portrait: 10, square: 10};
/** the head floors (rendered head box, px at 1080p: 60 off 1:1, 55 at 1:1) with a little margin: below them the supplied
 * text steps down */
const HEAD_FLOOR = {landscape: 61.5, portrait: 61.5, square: 55.5};
/** the rendered head over the head box's width */
const HEAD_K = 0.86;

const STRINGS = {
  en: {...AP_STRINGS.en, same: 'Same in A and B', changedFact: 'Changed fact'},
  es: {...AP_STRINGS.es, same: 'Igual en A y B', changedFact: 'Hecho cambiado'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  ...contrastFields(),
};

const defaultParams = {
  parties: AP_DEFAULTS.parties,
  documents: AP_DEFAULTS.documents,
  stages: AP_DEFAULTS.stages,
  dates: AP_DEFAULTS.dates,
  scenarioA: {label: 'Joint handling (as supplied)'},
  scenarioB: {label: 'Separate folders (as supplied)'},
  changedFact: 'How the claim folders are arranged on the case file',
  sharedFacts: ['Same parties, case file and claim folders'],
  comparisonLabels: {guide: 'Only the frames differ; every folder keeps its own label', neutral: 'No conclusion is drawn'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...AP_COMMON_ES,
  scenarioA: {label: 'Tramitación conjunta (aportada)'},
  scenarioB: {label: 'Carpetas separadas (aportadas)'},
  changedFact: 'Disposición de las carpetas',
  sharedFacts: ['Mismas partes, expediente y carpetas'],
  comparisonLabels: {guide: 'Solo cambian los marcos; cada etiqueta es propia', neutral: 'Sin conclusión'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const D = ctx.design;
    const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const B = SIZE[ctx.view.shape];
    const floorK = 16.4 / pxPer / (B * 0.96);
    // each arrangement and people scale at each text size; the largest people among the layouts that fit win (the
    // supplied text steps down only when no layout keeps the figures at their floors)
    const arrs = {landscape: ['row'], portrait: ['column'], square: ctx.show('key') ? ['row', 'side'] : ['column']}[ctx.view.shape];
    let L = null;
    for (const k of [1, 0.92, 0.85].filter(k2 => k2 > floorK + 0.03).concat([floorK])) {
      for (const arr of arrs) for (const pk of [4, 3.6, 3.2, 2.8, 2.4, 2.1, 1.8, 1.5, 1.25, 1]) {
        const q = compose(ctx, Math.max(k, floorK), arr, pk);
        // (labels hidden: among the arrangements that fill the frame, the larger figures; otherwise the larger figures)
        const better = ctx.show('key') || q.fillOk === L?.fillOk ? q.headPx > L?.headPx : q.fillOk;
        if (!L || (q.ok && !L.ok) || (q.ok === L.ok && better)) L = q;
        // (people scales are tried largest first: the first that fits is this arrangement's best)
        if (q.ok) break;
      }
      if (L.ok && L.headPx >= HEAD_FLOOR[ctx.view.shape]) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** Scenario badge: A a solid circle (●), B a solid diamond (◆) of equal weight. */
function badge(ctx, k, cx, cy, R, name) {
  return stateGlyph(ctx, {name, kind: k ? 'additional' : 'initial', x: cx, y: cy, R});
}

/**
 * flow chips left to right, wrapping rows, inside width w starting at (x, y); a block (bw × bh) at the top left is kept
 * free (the rows beside it start after it)
 */
function flow(items, x, y, w, gap, bw = 0, bh = 0) {
  const out = [];
  let cy = y, rowH = 0;
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
  out.sort((a2, b2) => items.findIndex(q => q.name === a2.name) - items.findIndex(q => q.name === b2.name));
  return {items: out, h: Math.max(bh, rest.length ? cy + rowH - y : (bw ? bh : 0))};
}

function compose(ctx, sizeK, arr, peopleK = 1) {
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
  const sp = {...p, labels: AP_DEFAULTS.labels};
  // arr: 'row' (side by side, strip under), 'column' (stacked, strip under), 'side' (stacked, strip in a right column)
  const row = arr === 'row';
  const side = arr === 'side';
  const colW = side ? Math.round(D.w * 0.3) : 0;
  // ---- top band: the claim key and the "as supplied" key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
  const stKey = showKey ? gchip(ctx, configKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  const y = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
  // ---- shared strip: what is the same in A and B printed once — the shared facts, the case file and the claims (each
  // its own label) — then the changed-fact chip, the guide chip and the neutral note
  const d = p.documents;
  const stripTexts = showAll ? [
    // (the shared facts, the case file and its claims in one chip: each claim its own item, in order)
    {name: 'cf', text: `${p.sharedFacts.length ? `${t.same}: ${p.sharedFacts.join(' · ')} — ` : ''}${d.caseFile.ref} · ${d.caseFile.title} — ${d.claims.join(' · ')}`, weight: 600},
    ...[p.scenarioA, p.scenarioB].map((sc, k) => (sc.caption ? {name: `cap${k}`, text: `${k ? '◆' : '●'} ${sc.caption}`, weight: 600} : null)).filter(Boolean),
  ] : [];
  const changedText = showAll ? `${t.changedFact}: ${p.changedFact}` : null;
  const guideText = showAll && p.comparisonLabels.guide ? `1  ${p.comparisonLabels.guide}` : null;
  const noteText = showAll && p.comparisonLabels.neutral ? p.comparisonLabels.neutral : null;
  const stripW = side ? colW : D.w - 16;
  const mk = (name, text, weight = 600, stroke = th.inkSoft) => {
    const c = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: stripW, size: small, minSize: small, maxLines: 10, fill: th.card, stroke, color: th.ink, weight});
    return {name, text, weight, stroke, w: c.box.w, h: c.box.h};
  };
  const items = [...stripTexts.map(q => mk(q.name, q.text, q.weight)), ...(changedText ? [mk('changed', changedText, 700, th.ink)] : []), ...(guideText ? [mk('guide', guideText, 700, th.ink)] : []), ...(noteText ? [mk('note', noteText, 600)] : [])];
  // ---- the two insets (A, B) at the head of the strip: the slots column drawn large — the folders slide in from the
  // rack into their slots; A: one frame round all of them (●), B: one frame each (◆); glyphs >= 25 px across at 1080p —
  // so the one difference reads at every size, labels shown or hidden
  const Rg = Math.max(12.5 / pxPer, small * 0.45);
  const nF = d.claims.length;
  // (at least two rows of strip chips tall: the chips beside the insets fill two rows, not one)
  const oneRowH = showAll ? mk('probe', 'x').h : 0;
  const insW = Rg * 12.8, insH = Math.max(Rg * (nF * 1.05 + (nF - 1) * 0.65 + 1.6), oneRowH * 2 + 9);
  const twoIn = 2 * insW + 12 <= stripW;
  const blkW = twoIn ? 2 * insW + 12 : insW, blkH = twoIn ? insH : 2 * insH + 12;
  const fl0 = flow(items, 0, 0, stripW, 8, blkW, blkH);
  const stripH = side ? 0 : fl0.h + 10;
  // ---- scenario headers (one per scene)
  const hdrText = k => (k ? p.scenarioB : p.scenarioA).label;
  const R = small * 0.5;
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
  // ---- the two scenes: compact rooms (texts are in the strip); one solve, one scale (the same geometry in A and B)
  // (the wall ends just past the people: a narrower room, so the people are larger)
  const tightX = -Math.round(46 * 1.3 * peopleK);
  const opts = k => ({prefix: k ? 'sb' : 'sa', p: sp, looks, showText: false, compact: true, wallExtraL: tightX, wallExtraX: tightX, lwK: LW_K[shape], rowK: rowKOf(p.documents.claims.length), peopleK, compactTs: 20 * Math.max(1, peopleK * BOARD_K[shape])});
  const sol = sceneH > 40 ? solveStage(ctx, {B, availW: sceneW, availH: sceneH, opts: opts(1), fillH: true, scMin: 0.1}) : solveStage(ctx, {B, availW: sceneW, availH: 40, opts: opts(1), scMin: 0.1});
  // (the wall runs out to both sides of the scene box: the two rooms fill their boxes)
  const spareX = sol.fitted ? Math.max(0, sceneW / sol.s - sol.stage.ext.w - 2) / 2 : 0;
  const stB = spareX > 1 ? deskStage(ctx, {...opts(1), ts: sol.ts, wallExtra: sol.stage.wallExtra, wallExtraX: tightX + Math.round(spareX), wallExtraL: tightX + Math.round(spareX)}) : sol.stage;
  const stA = deskStage(ctx, {...opts(0), ts: sol.ts, wallExtra: stB.wallExtra, ...(spareX > 1 ? {wallExtraX: tightX + Math.round(spareX), wallExtraL: tightX + Math.round(spareX)} : {})});
  const x0s = row ? [8, 8 + sceneW + 24] : [8, 8];
  const tops = row ? [top0 + hdrH, top0 + hdrH] : [top0 + hdrH, top0 + hdrH + sceneH + chipBand + 12 + hdrH];
  const PLs = [0, 1].map(k => placeStage({...sol, stage: k ? stB : stA}, {x0: x0s[k], top0: tops[k], availW: sceneW, bottom: tops[k] + sceneH, chipBand: 0}));
  const stages = [stA, stB];
  const occupied = [];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  // headers: just above each scene's wall
  const headers = showKey ? [0, 1].map(k => {
    const PL = PLs[k];
    const E = stages[k].ext;
    const wallTop = PL.oy + E.y * PL.s;
    const xL = x0s[k];
    const c = gchip(ctx, hdrText(k), {x: xL + R * 2.8, y: Math.max(top0, wallTop - hdrH), anchor: 'start', maxWidth: sceneW - R * 3.2, size: small, minSize: small, maxLines: 4, fill: th.card, stroke: th.ink, color: th.ink, weight: 700, name: `hdr${k}-chip`});
    occupied.push(c.box);
    return {c, bx: xL + R * 1.3, by: c.box.y + c.box.h / 2};
  }) : [];
  // name chips under each scene's floor (pushed apart when they would touch)
  const chips = [];
  if (showKey) {
    [0, 1].forEach(k => {
      const PL = PLs[k];
      const G = stages[k].G;
      const sx0 = x0s[k];
      const xs = [PL.M({x: G.xA, y: 0}).x, PL.M({x: G.xB, y: 0}).x].map((x, i) => clamp(x, sx0 + probe[i].box.w / 2, sx0 + sceneW - probe[i].box.w / 2));
      const over = xs[0] + probe[0].box.w / 2 + 10 - (xs[1] - probe[1].box.w / 2);
      if (over > 0) {
        xs[0] = Math.max(sx0 + probe[0].box.w / 2, xs[0] - over / 2);
        xs[1] = xs[0] + probe[0].box.w / 2 + 10 + probe[1].box.w / 2;
      }
      [0, 1].forEach(i => {
        const c = gchip(ctx, capOf(i), {x: xs[i], y: PL.floor + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${k ? 'b' : 'a'}${i}`});
        chips.push(c);
        occupied.push(c.box);
      });
    });
  }
  // the strip, placed under the scenes (or in the right column)
  const stripX = side ? D.w - 8 - colW : 8, stripY = side ? top0 : D.h - 8 - (stripH - 10);
  const fl = flow(items, stripX, stripY, stripW, 8, blkW, blkH);
  const insets = [0, 1].map(k => (twoIn ? {x: stripX + k * (insW + 12), y: stripY, w: insW, h: insH, R: Rg} : {x: stripX, y: stripY + k * (insH + 12), w: insW, h: insH, R: Rg}));
  const strip = fl.items.map(it => ({...it, c: gchip(ctx, it.text, {x: it.x, y: it.y, anchor: 'start', maxWidth: stripW, size: small, minSize: small, maxLines: 10, fill: th.card, stroke: it.stroke, color: th.ink, weight: it.weight, name: `strip-${it.name}`})}));
  // the guide markers ① at each inset's top right corner (over the lane, never over a sheet)
  const markR = small * 0.62;
  const markers = insets.map(b => ({x: b.x + b.w - markR - 4, y: b.y + markR + 4}));
  const boxes = PLs.map(PL => PL.boxes);
  const faces = boxes.flatMap(b => [b.headA, b.headB]).filter(f => f.w > 0);
  const labelBoxes = [...chips.map(c => c.box), ...headers.map(q => q.c.box), ...strip.map(q => q.c.box), key && key.box, stKey && stKey.box].filter(Boolean);
  const truncated = [...chips.map(c => c.fit), ...headers.map(q => q.c.fit), ...strip.map(q => q.c.fit), key && key.fit, stKey && stKey.fit].filter(f => f && f.truncated).map(f => f.full);
  // (labels never touch each other, the insets or the scenes' people)
  const insetBoxes = insets.map(b => ({x: b.x, y: b.y, w: b.w, h: b.h}));
  const people = boxes.flatMap(b => [b.personA, b.personB]);
  const labelsClear = labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)))
    && labelBoxes.every(b => insetBoxes.every(z => !hit(b, z, 1)) && people.every(z => !hit(b, z, 0)));
  const figPx = Math.min(...boxes.map(b => b.personB.h)) * pxPer;
  const headPx = Math.min(...boxes.flatMap(b => [b.headA.w, b.headB.w])) * HEAD_K * pxPer;
  const sceneShare = {w: r(stB.ext.w * sol.s / D.w, 3), h: r(stB.ext.h * sol.s / D.h, 3)};
  // (the changed fact in each room — the slots column with its frames — rendered size, px at 1080p)
  const changePx = {w: r((boxes[0].rows.w + stA.G.R * 0) * pxPer, 1), h: r(boxes[0].rows.h * pxPer, 1)};
  return {insets, PLs, stages, headers, chips, strip, markers, markR, key, stKey, faces, labelBoxes, truncated, labelsClear, figPx, headPx, sceneShare, changePx, small, R, row,
    ok: sol.fitted && !truncated.length && labelsClear && (!side || fl.h + top0 <= D.h - 8) && fl.h + stripY <= D.h - 4 && sceneH > 40, arr, peopleK, sizeK, showAll,
    // (the drawn block of both scenes, as a share of the design box: for the labels-hidden choice)
    fillOk: (stB.ext.w * sol.s * (row ? 2 : 1)) / D.w >= 0.8 && ((stB.ext.h - 30) * sol.s * (row ? 1 : 2)) / D.h >= 0.5, s: sol.s, textPx: r(sol.stage.G.ts * sol.s, 2)};
}

/** The inset geometry (shared by the drawing and the frame): the rack lane · the board with its slots · the glyph. */
function insetGeo(b, n) {
  const R = b.R;
  const SW = R * 3.4, FH = R * 1.05, gap = R * 0.65;
  const colH = n * FH + (n - 1) * gap;
  const laneX = b.x + R * 0.4;
  const boardX = laneX + SW + R * 0.35;
  const spineX = boardX + R * 0.35;
  const rowX = spineX + R * 0.75;
  const boardW = rowX + SW + R * 0.35 - boardX;
  const glX = boardX + boardW + R * 1.6;
  const y0 = b.y + (b.h - colH) / 2;
  const rowY = i => y0 + i * (FH + gap);
  return {R, SW, FH, gap, colH, laneX, boardX, boardW, spineX, rowX, glX, y0, rowY};
}

/**
 * One inset: the slots column of scene k drawn large — the folders slide in from the rack into their slots; A: one frame
 * and one spine round all of them (●), B: one frame and one clip each (◆). The same stroke and weight in both.
 */
function inset(ctx, b, k, n) {
  const th = ctx.theme;
  const ink = '#1f2328', mark = '#35556b';
  const I = insetGeo(b, n);
  const {R, SW, FH} = I;
  const fr = R * 0.22;
  const folders = Array.from({length: n}, (_, i) => g(null,
    h('path', {d: roundRectPath(I.laneX, I.rowY(i), SW, FH, 4), fill: '#f0d58c', stroke: ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(I.laneX + SW * 0.12, I.rowY(i) + FH * 0.25, SW * 0.76, FH * 0.5, 3), fill: th.paper, stroke: ink, 'stroke-width': 1.2})));
  const marks = k
    ? Array.from({length: n}, (_, i) => g(null,
      h('path', {d: roundRectPath(I.spineX - fr, I.rowY(i) - fr, I.rowX + SW + fr - I.spineX + fr, FH + 2 * fr, 5), fill: 'none', stroke: mark, 'stroke-width': 3}),
      h('path', {d: roundRectPath(I.spineX + R * 0.1, I.rowY(i), R * 0.35, FH, 3), fill: mark, stroke: ink, 'stroke-width': 1.6})))
    : [h('path', {d: roundRectPath(I.spineX - fr, I.y0 - fr, I.rowX + SW + fr - I.spineX + fr, I.colH + 2 * fr, 5), fill: 'none', stroke: mark, 'stroke-width': 3}),
      h('path', {d: roundRectPath(I.spineX + R * 0.1, I.y0, R * 0.35, I.colH, 3), fill: mark, stroke: ink, 'stroke-width': 1.6})];
  return g({name: `inset${k}`},
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: '#efe3c8', stroke: ink, 'stroke-width': 2.5}),
    // the rack lane (left) and the board with its slots (middle)
    h('path', {d: roundRectPath(I.laneX - R * 0.2, I.y0 - R * 0.35, SW + R * 0.4, I.colH + R * 0.7, 6), fill: '#dfe7ec', stroke: ink, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(I.boardX, b.y + R * 0.3, I.boardW, b.h - R * 0.6, 8), fill: '#c9a15e', stroke: ink, 'stroke-width': 2}),
    Array.from({length: n}, (_, i) => h('path', {d: roundRectPath(I.rowX - 2, I.rowY(i) - 2, SW + 4, FH + 4, 4), fill: '#d9cfb8', stroke: ink, 'stroke-width': 1.2})),
    g({name: `inset${k}-marks`, opacity: 0}, marks),
    g({name: `inset${k}-f`}, folders),
    stateGlyph(ctx, {name: `inset${k}-gl`, kind: k ? 'additional' : 'initial', x: I.glX, y: b.y + b.h / 2, R, opacity: 0}),
  );
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const font = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";
  return g(null,
    L.stages.map((st, k) => g({transform: `${T(L.PLs[k].ox, L.PLs[k].oy)} scale(${r(L.s, 5)})`}, st.node)),
    L.chips.map(c => c.node),
    L.headers.map((q, k) => g({name: `hdr${k}`, opacity: 0}, badge(ctx, k, q.bx, q.by, L.R, `hdr${k}-mk`), q.c.node)),
    L.strip.map(q => (['changed', 'guide', 'note'].includes(q.name) ? g({name: `strip-${q.name}-g`, opacity: 0}, q.c.node) : q.c.node)),
    L.insets.map((b, k) => inset(ctx, b, k, ctx.params.documents.claims.length)),
    L.showAll && L.markers.map((m, k) => g({name: `mark${k}`, opacity: 0},
      h('circle', {cx: r(m.x), cy: r(m.y), r: r(L.markR), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      h('text', {x: r(m.x), y: r(m.y + L.small * 0.34), 'text-anchor': 'middle', 'font-size': r(L.small), 'font-weight': 700, 'font-family': font, fill: th.ink}, '1'))),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
  );
}

function frameScene(ctx, L, u) {
  const c = clamp((u - C0) / (C1 - C0), 0, 1);
  const nodes = {};
  const vs = L.stages.map(st => choreo(c, st.G));
  const hdrP = seg(u, ...W_.headers);
  const appP = seg(u, ...W_.appear);
  const chP = seg(u, ...W_.changed);
  const guideP = seg(u, ...W_.guide);
  const noteP = seg(u, ...W_.note);
  // the localized change: A one frame and one spine round all the slots (joint); B one frame and one clip each (separate)
  const posed = L.stages.map((st, k) => st.pose({...vs[k], jointP: k ? 0 : appP, sepP: k ? appP : 0}));
  posed.forEach(pz => Object.assign(nodes, pz.nodes));
  [0, 1].forEach(k => {
    if (L.headers[k]) nodes[`hdr${k}`] = {opacity: r(hdrP, 3)};
    if (L.showAll) nodes[`mark${k}`] = {opacity: r(guideP, 3)};
  });
  // the insets follow their scenes: the folders slide from the rack lane into their slots; the marks appear with the change
  const n = ctx.params.documents.claims.length;
  const GB = L.stages[1].G;
  const prog = GB.travel > 0 ? clamp(vs[1].sheetD / GB.travel) : 0;
  const I = insetGeo(L.insets[1], n);
  [0, 1].forEach(k => {
    nodes[`inset${k}-f`] = {transform: T(r((I.rowX - I.laneX) * prog, 2), 0)};
    nodes[`inset${k}-marks`] = {opacity: r(appP, 3)};
    nodes[`inset${k}-gl`] = {opacity: r(appP, 3)};
  });
  if (L.strip.some(q => q.name === 'changed')) nodes['strip-changed-g'] = {opacity: r(chP, 3)};
  if (L.strip.some(q => q.name === 'guide')) nodes['strip-guide-g'] = {opacity: r(guideP, 3)};
  if (L.strip.some(q => q.name === 'note')) nodes['strip-note-g'] = {opacity: r(noteP, 3)};
  const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
  const M = k => q => (q ? {x: r(L.PLs[k].M(q).x), y: r(L.PLs[k].M(q).y)} : null);
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), phaseA: vs[0].phase, phaseB: vs[1].phase, travelA: r(vs[0].sheetD, 2), travelB: r(vs[1].sheetD, 2), slottedA: vs[0].slotted, slottedB: vs[1].slotted,
      // the one difference: A joint (one frame, one spine), B separate (one frame and one clip each); before the change
      // beat neither is drawn — the two rooms are identical
      lookA: {joint: posed[0].semantic.jointP, separate: posed[0].semantic.sepP, travel: r(vs[0].sheetD, 2)}, lookB: {joint: posed[1].semantic.jointP, separate: posed[1].semantic.sepP, travel: r(vs[1].sheetD, 2)},
      configShown: r(appP, 3), insetProgress: r(prog, 3), folders: n,
      handSA: M(0)(posed[0].semantic.hand), handSB: M(1)(posed[1].semantic.hand), gripSB: M(1)(posed[1].semantic.grip), gripSA: M(0)(posed[0].semantic.grip), allReached: posed.every(pz => pz.semantic.allReached), markPB: posed[1].semantic.markP, markPA: posed[0].semantic.markP,
      headers: r(hdrP, 3), changedShown: r(chP, 3), guide: r(guideP, 3), note: r(noteP, 3),
      truncated: L.truncated, labelsClear: L.labelsClear, figPx: r(L.figPx, 1), headPx: r(L.headPx, 1), textPx: L.textPx, sceneShare: L.sceneShare, changePx: L.changePx, arrangement: L.arr, peopleK: L.peopleK, textK: r(L.sizeK, 3),
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
    slug: 'civil-claim-08-contrast',
    title: 'Accumulation of claims (illustrative) — the same room with joint handling (A) or separate folders (B), each folder keeping its own label',
    titleEs: 'Acumulación de pretensiones — Comparación de dos supuestos',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Acumulación de pretensiones',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete copies of the same room — Party A and Party B, the rack of trays with one claim folder per tray, each with its own label, the push bar, the case file open on its easel with one slot per folder, and the calendar — side by side (stacked on tall frames). The shared texts are printed once. Only one fact differs: how the folders are arranged on the case file — in A one jacket frame and one spine round all of them (joint handling, ●), in B one frame and one clip each (separate folders, ◆), drawn with the same stroke and weight. In both rooms Party A then pushes every folder into its slot; each keeps its own label. Insets draw the slots column large, and a numbered marker and a guide chip name the difference. Both configurations are supplied values: no winner, rule, condition, effect or outcome is shown.',
    tags: ['claims', 'claim folders', 'joint handling', 'separate folders', 'contrast', 'paired scenarios', 'case file', 'trays', 'calendar'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/acumulacion-pretensiones.js', 'src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
