/**
 * LAW-0263 — Reconvención ilustrativa · contrast
 *
 * Storyboard (two complete copies of the same counter — side by side on wide and square boxes, stacked on tall ones;
 * each has Party A and Party B at the ends, their trays, the case-file rack with the initial claim standing in its
 * sleeve, and the calendar on the wall; every supplied text that is the same in A and B is printed once in a shared
 * strip; A is marked with a solid ● badge, B with a solid ◆ badge of equal size and weight):
 *  0.00–0.17  base: two identical counters at rest — the initial claim in its sleeve in both.
 *  0.17–0.40  the scenario headers appear and the changed-fact chip names the one fact that differs; in B (only) the
 *             additional claim appears standing in Party B's tray — a localized, explicit change; A's tray stays empty.
 *  0.40–0.77  in parallel: in B, Party B pushes the additional claim the opposite way along its lane into the case
 *             file's other sleeve; in A nothing is added. In both scenes the initial claim stays where it is — the
 *             second claim never covers, moves or erases it.
 *  0.77–1.00  a numbered marker ① sits on each inset (the rack drawn large at the strip's head: one sleeve filled in
 *             A, both in B) and the guide chip ① names the difference; the neutral note and the "as supplied · no
 *             conclusion drawn" key. No winner, score, rule, requirement, time limit or effect is shown.
 * @module animations/civil-claim/LAW-0263
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {
  RI_DEFAULTS, RI_COMMON_ES, RI_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, solveStage, placeStage, counterStage, choreo, claimKeyText, localizeDefaults, stateGlyph,
} from './kits/reconvencion-ilustrativa.js';

const ID = 'LAW-0263';
const DURATION = 7500;
const C0 = 0.4, C1 = 0.77;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ = {headers: [0.17, 0.24], appear: [0.24, 0.32], changed: [0.28, 0.36], guide: [0.775, 0.83], note: [0.8, 0.86]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** how much of the people scale the compact sheets follow */
const BOARD_K = {landscape: 0.6, portrait: 0.6, square: 0.3};
/** the head floors (rendered head box, px at 1080p: 60 off 1:1, 55 at 1:1) with a little margin: below them the supplied
 * text steps down */
const HEAD_FLOOR = {landscape: 61.5, portrait: 61.5, square: 55.5};
/** the rendered head over the head box's width */
const HEAD_K = 0.86;

const STRINGS = {
  en: {...RI_STRINGS.en, same: 'Same in A and B', changedFact: 'Changed fact', onlyB: 'only in B'},
  es: {...RI_STRINGS.es, same: 'Igual en A y B', changedFact: 'Hecho cambiado', onlyB: 'solo en B'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  ...contrastFields(),
};

const defaultParams = {
  parties: RI_DEFAULTS.parties,
  documents: RI_DEFAULTS.documents,
  stages: RI_DEFAULTS.stages,
  dates: RI_DEFAULTS.dates,
  scenarioA: {label: 'Initial claim only'},
  scenarioB: {label: 'Initial claim and an additional claim'},
  changedFact: 'Whether Party B supplies an additional claim',
  sharedFacts: ['Same parties, case file and initial claim'],
  comparisonLabels: {guide: 'Only the second sleeve differs; the initial claim stays in both', neutral: 'No conclusion is drawn'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...RI_COMMON_ES,
  scenarioA: {label: 'Solo la pretensión inicial'},
  scenarioB: {label: 'Pretensión inicial y una adicional'},
  changedFact: 'Si la Parte B aporta una pretensión adicional',
  sharedFacts: ['Mismas partes, expediente y pretensión inicial'],
  comparisonLabels: {guide: 'Solo cambia la segunda funda; la inicial sigue en ambos', neutral: 'Sin conclusión'},
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
      for (const arr of arrs) for (const pk of [3.2, 2.8, 2.4, 2.1, 1.8, 1.5, 1.25, 1]) {
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
  const sp = {...p, labels: RI_DEFAULTS.labels};
  // arr: 'row' (side by side, strip under), 'column' (stacked, strip under), 'side' (stacked, strip in a right column)
  const row = arr === 'row';
  const side = arr === 'side';
  const colW = side ? Math.round(D.w * 0.3) : 0;
  // ---- top band: the claim key and the "as supplied" key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
  const stKey = showKey ? gchip(ctx, claimKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  const y = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
  // ---- shared strip: what is the same in A and B printed once — the shared facts, the case file, the initial claim —
  // and the additional claim (only in B); then the changed-fact chip, the guide chip and the neutral note
  const d = p.documents;
  const stripTexts = showAll ? [
    ...(p.sharedFacts.length ? [{name: 'same', text: `${t.same}: ${p.sharedFacts.join(' · ')}`, weight: 700}] : []),
    {name: 'cf', text: `${d.caseFile.ref} · ${d.caseFile.title}`, weight: 700},
    {name: 'ci', text: `● ${d.initialClaim.title}: ${d.initialClaim.summary}`, weight: 600},
    {name: 'ca', text: `◆ ${d.additionalClaim.title}: ${d.additionalClaim.summary} (${t.onlyB})`, weight: 600},
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
  // ---- the two insets (A, B) at the head of the strip: the case-file rack drawn large — its two sleeves, the initial
  // claim (●) in the first in both, the additional claim (◆) sliding into the second in B only; glyphs >= 25 px across
  // at 1080p — so the one difference reads at every size, labels shown or hidden
  const Rg = Math.max(12.5 / pxPer, small * 0.45);
  const insW = Rg * 10.4, insH = Rg * 5.4;
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
  // ---- the two scenes: compact counters (texts are in the strip); one solve, one scale (the same geometry in A and B:
  // A simply has no additional claim)
  // (the wall ends just past the people: a narrower room, so the people are larger)
  const tightX = -Math.round(46 * 1.3 * peopleK);
  const opts = k => ({prefix: k ? 'sb' : 'sa', p: sp, looks, showText: false, compact: true, stackedRack: true, near: true, withAdditional: k === 1, wallExtraL: tightX, wallExtraX: tightX, lwK: 10, peopleK, compactTs: 20 * Math.max(1, peopleK * BOARD_K[shape])});
  const sol = sceneH > 40 ? solveStage(ctx, {B, availW: sceneW, availH: sceneH, opts: opts(1), fillH: true, scMin: 0.1}) : solveStage(ctx, {B, availW: sceneW, availH: 40, opts: opts(1), scMin: 0.1});
  // (the wall runs out to both sides of the scene box: the two rooms fill their boxes)
  const spareX = sol.fitted ? Math.max(0, sceneW / sol.s - sol.stage.ext.w - 2) / 2 : 0;
  const stB = spareX > 1 ? counterStage(ctx, {...opts(1), ts: sol.ts, wallExtra: sol.stage.wallExtra, wallExtraX: tightX + Math.round(spareX), wallExtraL: tightX + Math.round(spareX)}) : sol.stage;
  const stA = counterStage(ctx, {...opts(0), ts: sol.ts, wallExtra: stB.wallExtra, ...(spareX > 1 ? {wallExtraX: tightX + Math.round(spareX), wallExtraL: tightX + Math.round(spareX)} : {})});
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
  const strip = fl.items.map(it => ({...it, c: gchip(ctx, it.text, {x: it.x, y: it.y, anchor: 'start', maxWidth: stripW, size: small, minSize: small, maxLines: 6, fill: th.card, stroke: it.stroke, color: th.ink, weight: it.weight, name: `strip-${it.name}`})}));
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
  return {insets, PLs, stages, headers, chips, strip, markers, markR, key, stKey, faces, labelBoxes, truncated, labelsClear, figPx, headPx, sceneShare, small, R, row,
    ok: sol.fitted && !truncated.length && labelsClear && (!side || fl.h + top0 <= D.h - 8) && fl.h + stripY <= D.h - 4 && sceneH > 40, arr, peopleK, sizeK, showAll,
    // (the drawn block of both scenes, as a share of the design box: for the labels-hidden choice)
    fillOk: (stB.ext.w * sol.s * (row ? 2 : 1)) / D.w >= 0.8 && ((stB.ext.h - 30) * sol.s * (row ? 1 : 2)) / D.h >= 0.5, s: sol.s, textPx: r(sol.stage.G.ts * sol.s, 2)};
}

/** One inset: the case-file rack of scene k drawn large — two sleeves; ● in the first; in B ◆ slides into the second. */
function inset(ctx, b, k) {
  const th = ctx.theme;
  const R = b.R;
  const ink = '#1f2328';
  const SWi = R * 2.8, SHi = R * 3.6;
  const sy = b.y + b.h - R * 0.7;
  const sl = [b.x + R * 0.6, b.x + R * 0.6 + SWi + R * 0.6];
  const sheet = (name, x, kind, op) => g({name, opacity: op},
    h('path', {d: roundRectPath(x, sy - SHi, SWi, SHi, 5), fill: th.paper, stroke: ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x + 2, sy - SHi + 2, SWi - 4, R * 1.9, 4), fill: kind === 'additional' ? th.accent3 : th.accent2, opacity: 0.32}),
    stateGlyph(ctx, {name: `${name}-gl`, kind, x: x + SWi / 2, y: sy - SHi + R * 1.05, R}),
    [0, 1].map(j => h('rect', {'data-bar': 1, x: r(x + R * 0.4), y: r(sy - SHi + R * 2.3 + j * R * 0.55), width: r(SWi * (j ? 0.45 : 0.7)), height: r(R * 0.26), rx: 2, fill: th.paperLine})));
  return g({name: `inset${k}`},
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: '#efe3c8', stroke: ink, 'stroke-width': 2.5}),
    // the rack: a back panel holding two sleeves
    h('path', {d: roundRectPath(b.x + R * 0.3, b.y + R * 0.5, 2 * SWi + R * 1.8, b.h - R * 0.8, 8), fill: '#c9a15e', stroke: ink, 'stroke-width': 2}),
    sl.map(x => h('path', {d: roundRectPath(x - 3, sy - SHi - R * 0.25, SWi + 6, SHi + R * 0.25, 5), fill: '#b48c4f', stroke: ink, 'stroke-width': 1.6})),
    // (A: the second sleeve simply stays empty — drawn like the scene's own empty sleeve)
    sheet(`inset${k}-ci`, sl[0], 'initial', 1),
    // (B: the additional claim, from the lane at the right, slides into the second sleeve)
    k ? g({name: 'inset1-ca-pos'}, sheet('inset1-ca', sl[1], 'additional', 0)) : null,
    sl.map(x => h('path', {d: roundRectPath(x - 3, sy - R * 0.35, SWi + 6, R * 0.5, 3), fill: '#a07a40', stroke: ink, 'stroke-width': 1.6})),
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
    L.insets.map((b, k) => inset(ctx, b, k)),
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
  const posed = L.stages.map((st, k) => st.pose(vs[k]));
  posed.forEach(pz => Object.assign(nodes, pz.nodes));
  const hdrP = seg(u, ...W_.headers);
  const appP = seg(u, ...W_.appear);
  const chP = seg(u, ...W_.changed);
  const guideP = seg(u, ...W_.guide);
  const noteP = seg(u, ...W_.note);
  // the localized change: in B only, the additional claim appears standing in Party B's tray
  nodes['sb-ca-g'] = {...nodes['sb-ca-g'], opacity: r(appP, 3)};
  [0, 1].forEach(k => {
    if (L.headers[k]) nodes[`hdr${k}`] = {opacity: r(hdrP, 3)};
    if (L.showAll) nodes[`mark${k}`] = {opacity: r(guideP, 3)};
  });
  // the inset of B follows its scene: the ◆ sheet appears in the lane, then slides into the second sleeve as the
  // additional claim travels
  const GB = L.stages[1].G;
  const prog = GB.travel > 0 ? clamp(vs[1].sheetD / GB.travel) : 0;
  const b1 = L.insets[1];
  nodes['inset1-ca-pos'] = {transform: T(r((1 - prog) * (b1.w - (b1.R * 0.6 + 2 * (b1.R * 2.8) + b1.R * 0.6) - b1.R * 0.2)), 0)};
  nodes['inset1-ca'] = {opacity: r(appP, 3)};
  if (L.strip.some(q => q.name === 'changed')) nodes['strip-changed-g'] = {opacity: r(chP, 3)};
  if (L.strip.some(q => q.name === 'guide')) nodes['strip-guide-g'] = {opacity: r(guideP, 3)};
  if (L.strip.some(q => q.name === 'note')) nodes['strip-note-g'] = {opacity: r(noteP, 3)};
  const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
  const M = k => q => (q ? {x: r(L.PLs[k].M(q).x), y: r(L.PLs[k].M(q).y)} : null);
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), phaseA: vs[0].phase, phaseB: vs[1].phase, sheetDA: r(vs[0].sheetD, 2), sheetDB: r(vs[1].sheetD, 2), slottedB: vs[1].slotted,
      additionalShown: r(appP, 3), insetProgress: r(prog, 3), withAdditional: L.stages.map(st => st.G.withAdd),
      handB: M(1)(posed[1].semantic.hand), gripB: M(1)(posed[1].semantic.grip), allReached: posed.every(pz => pz.semantic.allReached), markPB: posed[1].semantic.markP, markPA: posed[0].semantic.markP,
      headers: r(hdrP, 3), changedShown: r(chP, 3), guide: r(guideP, 3), note: r(noteP, 3),
      truncated: L.truncated, labelsClear: L.labelsClear, figPx: r(L.figPx, 1), headPx: r(L.headPx, 1), textPx: L.textPx, sceneShare: L.sceneShare, arrangement: L.arr, peopleK: L.peopleK, textK: r(L.sizeK, 3),
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
    slug: 'civil-claim-06-contrast',
    title: 'Illustrative additional claim — the same counter with the initial claim only (A) or with an additional claim too (B)',
    titleEs: 'Reconvención ilustrativa — Comparación de dos supuestos',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Reconvención ilustrativa',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete copies of the same counter — Party A and Party B at the ends, their trays, the case-file rack with the initial claim in its sleeve and the calendar — side by side (stacked on tall frames). The shared texts are printed once. Only one fact differs: in B, Party B supplies an additional claim, which appears in her tray and travels the opposite way into the rack’s second sleeve; in A nothing is added. The initial claim stays in its sleeve in both — never covered, moved or erased. Insets draw the rack large (● one sleeve filled in A, ● and ◆ in B, equal weight) and a numbered marker and a guide chip name the difference. No winner, score, rule, requirement, time limit or effect is shown.',
    tags: ['additional claim', 'counterclaim (illustrative)', 'contrast', 'paired scenarios', 'case file', 'trays', 'calendar', 'initial claim'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
