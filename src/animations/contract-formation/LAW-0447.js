/**
 * LAW-0447 — Aceptación y contrapropuesta · contrast
 *
 * Storyboard (two complete, identical stages; side by side on wide boxes,
 * stacked on tall ones; the same board, offer, copy set, parties and timing):
 *  0.00–0.17  base: in both scenes the offer's supplied pieces are printed on
 *             the offer with an identical copy set clipped on top; Party B
 *             holds the same blank, face-down piece; Party A waits by the
 *             reply rail. Nothing differs.
 *  0.17–0.40  change: in both scenes B's hand goes to the same latch at the
 *             same time. Scenario A «Respuesta coincidente»: the latch is only
 *             pressed and stays shut. Scenario B «términos modificados»: the
 *             latch opens and B slots the held piece (turning face-up, a
 *             different value) into the set. The scenario labels appear.
 *  0.40–0.77  parallel action: both releases, both copy sets glide into their
 *             replies at the same moment — in B the released piece stays on
 *             the offer — and both A's draw their replies back.
 *  0.77–1.00  guide: the one differing piece is outlined in both replies and
 *             repeated side by side in a comparison strip (A's value · B's
 *             value) with the guide label, the changed fact, the shared facts,
 *             the neutral note and the key. No winner, score, acceptance,
 *             counter-offer or contract is stated.
 * @module animations/contract-formation/LAW-0447
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {personRig} from '../../primitives/person.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  motifFields, responseItem, DEFAULT_CONTENT, KIT_STRINGS, resolveResponse, solveStage, buildStage,
  chipW, fitW, unionBox, pieceArt, tabColor, SHEET, TILE, measureDocs, offerSheetGeometry, offerBoardArt,
  replySceneGeometry, buildReplyScene, replySceneTextBoxes, overlaps, insideBox, figureBox, headBox, pieceNo,
} from './kits/aceptacion-contrapropuesta.js';

const ID = 'LAW-0447';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const CHANGE = 0.24;
const W = {
  latchReach: [0.17, 0.24], latchPress: [0.24, 0.3], toLever: [0.3, 0.36], insert: [0.28, 0.42], nearBack: [0.43, 0.51],
  leverPress: [0.42, 0.46], slide: [0.46, 0.6], farBack: [0.48, 0.56], pullReach: [0.6, 0.66], pull: [0.66, 0.77],
  headers: [0.24, 0.3], outline: [0.78, 0.83], strip: [0.8, 0.86], notes: [0.82, 0.88], key: [0.82, 0.87],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, same: 'Same in both scenes', tokens: '{a}–{b} = the offer\'s pieces 1–{n}, copied as supplied'},
  es: {...KIT_STRINGS.es, same: 'Igual en ambas escenas', tokens: '{a}–{b} = piezas 1–{n} de la oferta, copiadas según lo aportado'},
};

const sceneSchema = {
  ...motifFields,
  responses: list('The two supplied responses: scenario A first, scenario B second (what each reply physically carries)', responseItem, 2, 2),
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  responses: [
    {reference: 'RE-2041', mode: 'same-terms'},
    {reference: 'RE-2041', mode: 'one-piece-substituted', termIndex: 1, value: 'Day 14'},
  ],
  scenarioA: {label: 'Matching reply', caption: 'The reply keeps every supplied piece'},
  scenarioB: {label: 'Modified terms', caption: 'The reply carries a different delivery piece'},
  changedFact: 'Only one fact differs: the delivery piece in the reply',
  sharedFacts: ['Same offer and pieces', 'Same parties', 'Same timing'],
  comparisonLabels: {guide: 'Only this piece differs', neutral: 'Two supplied replies side by side — no legal effect is stated'},
};

/** A design length as a fraction of the frame width. */
function frameFrac(ctx, len) {
  return len * fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale / ctx.view.width;
}

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}
const range = (a, b, step) => { const out = []; for (let v = a; v >= b - 1e-9; v -= step) out.push(Math.round(v * 1000) / 1000); return out; };

/** Scenario header: lane-coloured letter badge, label and a wrapped caption (never cut). */
function header(ctx, o) {
  const th = ctx.theme;
  const parts = [];
  const bR = o.size * 0.72;
  parts.push(h('circle', {cx: o.x + bR, cy: o.y + bR + 2, r: bR, fill: o.color, stroke: th.ink, 'stroke-width': 2.4}));
  let hh = bR * 2 + 4;
  if (ctx.show('key')) {
    // the letter is text too: never below the text floor (the caption size)
    const f = fitW(o.letter, {maxWidth: bR * 2, size: Math.max(o.size * 0.9, o.capSize ?? 0), maxLines: 1, weight: 800});
    parts.push(textBlock(f, {x: o.x + bR, y: o.y + bR + 2 - f.size * 0.45, anchor: 'middle', fill: '#ffffff'}));
    const lab = fitW(o.label, {maxWidth: o.w - bR * 2 - 16, size: o.size, minSize: o.size, maxLines: 2, weight: 800});
    parts.push(textBlock(lab, {x: o.x + bR * 2 + 14, y: o.y + 2, fill: th.fg}));
    let y = o.y + 2 + lab.height + o.size * 0.25;
    let bad = lab.bad;
    let cap = null;
    if (o.caption && ctx.show('all')) {
      cap = fitW(o.caption, {maxWidth: o.w - bR * 2 - 16, size: o.capSize, minSize: o.capSize, maxLines: 3, weight: 500});
      parts.push(textBlock(cap, {x: o.x + bR * 2 + 14, y, fill: th.fgSoft}));
      y += cap.height;
      bad = bad || cap.bad;
    }
    hh = Math.max(hh, y - o.y);
    return {node: g({name: o.name, opacity: 0}, parts), h: hh + 8, bad, w: bR * 2 + 14 + Math.max(lab.width, cap ? cap.width : 0)};
  }
  return {node: g({name: o.name, opacity: 0}, parts), h: hh + 8, bad: false, w: bR * 2};
}

/** Chip texts that may sit in the scenario-header row (beside header A / header B) instead of the footer. */
function headerChipDefs(ctx, p) {
  if (!ctx.show('all')) return [];
  const t = ctx.t, th = ctx.theme;
  return [
    {name: 'docs', text: `${p.offer.reference} · ${p.offer.title} · ${t.from}: ${p.parties[0].name} · ${t.to}: ${p.parties[1].name}`, stroke: th.inkSoft},
    {name: 'neutral', text: p.comparisonLabels.neutral, stroke: th.inkSoft},
  ];
}

/** Place the header-row chips right of each header when they fit in two lines. */
function placeHeaderChips(ctx, p, F, hdrs, slots) {
  const out = [];
  headerChipDefs(ctx, p).forEach((d, i) => {
    const s = slots[i];
    const x = s.x + hdrs[i].w + 28, maxWidth = s.x + s.w - 8 - x;
    if (maxWidth < 8 * F) return;
    let c = chipW(ctx, d.text, {x: 0, y: 0, maxWidth, size: F, maxLines: 2, weight: 600, stroke: d.stroke});
    if (c.fit.bad) c = chipW(ctx, d.text, {x: 0, y: 0, maxWidth, size: F, maxLines: 3, weight: 600, stroke: d.stroke});
    if (c.fit.bad) return;
    // right-aligned in its slot
    const cx = s.x + s.w - 8 - c.box.w;
    out.push({name: d.name, x: cx, y: s.y + 2, maxWidth, lines: c.fit.lines.length, stroke: d.stroke, text: d.text, h: c.box.h + 10});
  });
  return out;
}

/** Search results already computed (keyed by every input of the search); later instances re-use them. */
const SEARCH = new Map();
const searchKeyOf = (ctx, what) => JSON.stringify([what, ctx.params, ctx.view.width, ctx.view.height, ctx.show('all'), ctx.show('key')]);

/** Composition 'pair' (wide frames): two complete, identical term-board stages side by side. */
function layoutPair(ctx) {
  {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const DW = ctx.design.w, DH = ctx.design.h;
    const upx = unitPx(ctx);
    const RA = resolveResponse(p, p.responses[0]);
    const RB = resolveResponse(p, p.responses[1]);
    const Rg = RB.substituted ? RB : RA;          // geometry: both stages identical (both hold the piece)
    const arrangements = shape === 'portrait' ? [false] : shape === 'square' ? [true, false] : [true];
    const gap = shape === 'landscape' ? 40 : 24;
    // 1:1: two stages side by side leave no room for A's pull-back; A takes hold of the reply's tab in place
    const pullBack = shape !== 'square';
    const captions = [0, 1].map(i => (p.parties[i].role ? `${p.parties[i].name} · ${p.parties[i].role}` : p.parties[i].name));
    const pxSets = [
      {F: 22, FL: 20.5, min: 20, chip: 20}, {F: 21, FL: 19.8, min: 19.6, chip: 19.6},
      {F: 19, FL: 17, min: 16.5, chip: 16.5}, {F: 17.5, FL: 16.5, min: 16.2, chip: 16.2}, {F: 16.6, FL: 16.1, min: 16.05, chip: 16.05},
    ];
    const cache = new Map();
    const target = shape === 'landscape' ? 104 : shape === 'portrait' ? 108 : 55;
    const searchKey = searchKeyOf(ctx, 'pair');
    let best = SEARCH.get(searchKey) || null;
    const searched = Boolean(best);
    // no fitting layout: the largest text whose geometry keeps everything in frame
    const cost = c => c.G.why.reduce((a, w) => a + (/^(width|top|topHead)/.test(w) ? 10 : 1), 0) + (c.ok ? 0 : 0.5);
    for (const row of searched ? [] : arrangements) {
    if (best && best.ok) break;
    for (const px of pxSets) {
      const F = px.chip / upx;
      // ---- headers (measured at the panel width)
      const panelW = row ? (DW - gap) / 2 : DW;
      const mkHeader = (i, x, y) => header(ctx, {name: `hdr${i}`, x, y, w: panelW, letter: i ? 'B' : 'A', label: i ? p.scenarioB.label : p.scenarioA.label, caption: i ? p.scenarioB.caption : p.scenarioA.caption, size: F * 1.15, capSize: F, color: i ? th.accent : th.accent2});
      const hd0 = mkHeader(0, 0, 0), hd1 = mkHeader(1, 0, 0);
      const slots = row ? [{x: 8, y: 0, w: panelW - 8}, {x: panelW + gap + 8, y: 0, w: panelW - 8}] : [{x: 8, y: 0, w: DW - 8}, {x: 8, y: 0, w: DW - 8}];
      const hchips = placeHeaderChips(ctx, p, F, [hd0, hd1], slots);
      const hh = Math.max(hd0.h, hd1.h, ...hchips.map(c => c.h));
      // ---- footer (measured at the full width)
      const foot = footer(ctx, p, RA, RB, {w: DW, F, dry: true, skip: hchips.map(c => c.name)});
      const footH = foot.h;
      // ---- panel stage boxes
      const stageH = row ? DH - hh - footH - 16 : (DH - 2 * hh - footH - gap - 16) / 2;
      const box = {x: 0, y: 0, w: panelW, h: stageH};
      const G = solveStage(ctx, {
        box, upx, terms: p.terms, offer: p.offer, parties: p.parties, response: Rg, latch: true, latchRow: Rg.k ?? 1, replyTag: KIT_REPLY(ctx),
        captions, chipPx: px.chip, chipMax: panelW * 0.46, pullBack,
        variants: row ? [false, true] : [true, false], pxTries: [px], ks: range(2.2, row || shape !== 'square' ? 0.85 : 0.5, 0.05),
        tws: [5, 6, 7, 8.5, 10, 12, 14, 17, 20, 24], lws: [0, 4, 4.5, 5, 5.5, 6.5, 8, 10, 12, 15], hws: [4, 5, 6, 7.5, 9, 11],
        align: 'center', cache, steps: [0, 0.14, 0.28, 0.42, 0.56], compact: true,
      });
      if (!G) continue;
      const cand = {G, px, F, hh, footH, stageH, panelW, row, hchips, ok: G.ok && !foot.bad && !mkHeader(0, 0, 0).bad && !mkHeader(1, 0, 0).bad};
      const head = 88 * G.k * upx;
      // the largest text that lays out wins (px sets are tried largest first); people size follows from it
      if (!best || (cand.ok && !best.ok) || (!cand.ok && !best.ok && cost(cand) < cost(best))) best = {...cand, head};
      if (cand.ok) break;
    }
    }
    if (!best) throw new Error(`${ID}: no stage geometry fits this box`);
    if (!searched) SEARCH.set(searchKey, best);
    const {G, F, hh, footH, stageH, panelW, row, hchips} = best;
    // panel origins
    const origins = row ? [{x: 0, y: hh}, {x: panelW + gap, y: hh}] : [{x: 0, y: hh}, {x: 0, y: hh + stageH + gap + hh}];
    const hdrY = row ? [0, 0] : [0, hh + stageH + gap];
    const mkHeader = (i, x, y) => header(ctx, {name: `hdr${i}`, x, y, w: panelW, letter: i ? 'B' : 'A', label: i ? p.scenarioB.label : p.scenarioA.label, caption: i ? p.scenarioB.caption : p.scenarioA.caption, size: F * 1.15, capSize: F, color: i ? th.accent : th.accent2});
    const headers = [mkHeader(0, origins[0].x + 8, hdrY[0]), mkHeader(1, origins[1].x + 8, hdrY[1])];
    const looks = null;
    const stages = [0, 1].map(i => buildStage(ctx, G, {prefix: i ? 'b' : 'a', looks}));
    // outlines around the differing reply row (at the hold, after the pull)
    const kRow = RB.substituted ? RB.k : RA.substituted ? RA.k : null;
    const outlines = kRow === null ? [] : [0, 1].map(i => {
      const o = origins[i];
      const x = G.xSp - SHEET.spW / 2 - G.tw - G.pull - 8 + o.x, y = G.Ry + G.rowYR(kRow) - G.th / 2 - 8 + o.y;
      const w = G.tw + SHEET.spW + 16, hgt = G.th + 16;
      return {box: {x, y, w, h: hgt}, node: g({name: `ring${i}`, opacity: 0}, h('path', {d: roundRectPath(x, y, w, hgt, 12), fill: 'none', stroke: th.accent, 'stroke-width': 4}))};
    });
    const footTop = row ? hh + stageH + 12 : DH - footH - 4;
    const foot = footer(ctx, p, RA, RB, {w: DW, F, y: footTop, skip: hchips.map(c => c.name)});
    const hdrChips = hchips.map((c, i) => {
      const y = hdrY[i === 0 ? 0 : 1] + 2;
      return {name: c.name, c: chipW(ctx, c.text, {x: c.x, y, maxWidth: c.maxWidth, size: F, maxLines: c.lines, weight: 600, stroke: c.stroke, name: c.name, opacity: 0})};
    });
    const markers = RB.substituted ? [changedMarker(ctx, {name: 'mk-b', x: G.xSp - SHEET.spW / 2 - G.tw + 3 - G.pull + origins[1].x, y: G.Ry + G.rowYR(RB.k) - G.th / 2 + 3 + origins[1].y, radius: Math.max(13, F * 0.6), opacity: 0})] : [];
    return {mode: 'pair', G, stages, origins, headers, outlines, foot, markers, RA, RB, kRow, upx, ok: best.ok, F, hdrChips, head: 88 * G.k * upx, textPx: best.px.chip};
  }
}

function buildPair(ctx, L) {
  return g(null,
    L.stages.map((S, i) => g({transform: T(L.origins[i].x, L.origins[i].y)}, S.node)),
    L.headers.map(hd => hd.node),
    L.outlines.map(o => o.node),
    L.markers,
    L.hdrChips.map(q => q.c.node),
    L.foot.node);
}

function framePair(ctx, L, u) {
  {
    const nodes = {};
    const s = w => seg(u, ...W[w]);
    const base = {
      latchReach: s('latchReach'), latchPress: s('latchPress'), toLever: s('toLever'), leverPress: s('leverPress'), slide: s('slide'),
      farBack: s('farBack'), pullReach: s('pullReach'), pull: s('pull'), headB: lerp(0, 8, s('latchReach')), headA: lerp(0, 6, s('pullReach')),
    };
    const vs = [L.RA, L.RB].map(R => (R.substituted ? {...base, insert: s('insert'), nearBack: s('nearBack')} : {...base, keep: true}));
    const posed = L.stages.map((S, i) => S.pose(vs[i]));
    posed.forEach(q => Object.assign(nodes, q.nodes));
    const hdrIn = r(s('headers'), 3);
    nodes.hdr0 = {opacity: hdrIn};
    nodes.hdr1 = {opacity: hdrIn};
    L.outlines.forEach((o, i) => { nodes[`ring${i}`] = {opacity: r(s('outline'), 3)}; });
    if (L.markers.length) nodes['mk-b'] = {opacity: r(s('outline'), 3)};
    Object.assign(nodes, L.foot.frame({strip: s('strip'), notes: s('notes'), key: s('key')}));
    for (const q of L.hdrChips) nodes[q.name] = {opacity: r(q.name === 'docs' ? 1 : s('notes'), 3)};
    // look = everything visible in one scene, in panel coordinates
    const look = q => ({setOn: q.sem.setOn, latchOpen: q.sem.latchOpen, spareFaceUp: q.sem.spareFaceUp, spareIn: q.sem.spareIn, pull: q.sem.pull, pieces: q.sem.pieces, hands: [q.sem.handA, q.sem.handB, q.sem.handBn], spare: q.sem.spare, pieceStays: q.sem.pieceStays});
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const [a, b] = posed.map(q => q.sem);
    const P2 = (q, o) => (q ? {x: r(q.x + o.x), y: r(q.y + o.y)} : null);
    const sc = q => ({latchOpen: q.latchOpen, spareIn: q.spareIn, moving: q.pull > 0 && q.pull < 1 || q.setOn === 'moving', done: q.setOn === 'reply', setOn: q.setOn, pieceStays: q.pieceStays});
    return {
      nodes,
      semantic: {
        beat,
        mode: 'pair', textPx: L.textPx, textFloorMet: L.textPx >= 16,
        lookA: look(posed[0]),
        lookB: look(posed[1]),
        a: sc(a), b: sc(b),
        aSet: P2(a.setAt, L.origins[0]), bSet: P2(b.setAt, L.origins[1]),
        aHandB: P2(a.handB, L.origins[0]), bHandB: P2(b.handB, L.origins[1]),
        aHandBn: P2(a.handBn, L.origins[0]), bHandBn: P2(b.handBn, L.origins[1]),
        bSpare: P2(b.spare, L.origins[1]),
        // carrying the reply back: A draws it along the rail
        aCarryHand: P2(a.handA, L.origins[0]), bCarryHand: P2(b.handA, L.origins[1]),
        aCarryGrip: P2(a.replyGrip, L.origins[0]), bCarryGrip: P2(b.replyGrip, L.origins[1]),
        headers: hdrIn,
        guide: r(s('strip'), 3),
        allReached: a.allReached && b.allReached,
        layoutOk: L.ok,
        why: L.G.why.join(','),
        headPx: r(88 * L.G.k * L.upx, 1),
        k: r(L.G.k, 3),
        arrangement: L.origins[1].x > 0 ? 'row' : 'column',
        panelFrac: r(L.origins[1].x > 0 ? frameFrac(ctx, L.G.box.w) : 1, 3),
      },
    };
  }
}


/* ------------------------------------------------------------------------ */
/* Composition 'shared': the offer (identical in A and B) is drawn once, on a */
/* board with Party A; each scenario is a reply scene with its own responder. */
/* ------------------------------------------------------------------------ */

// shared timeline (same beats and CHANGE as the pair composition)
const WS = {
  latchReach: [0.17, 0.24], latchPress: [0.24, 0.3], farBack: [0.3, 0.37], remove: [0.29, 0.4], insert: [0.31, 0.42], turn: [0.42, 0.46],
  nearBack: [0.46, 0.53], carryReach: [0.58, 0.66], carry: [0.66, 0.77],
  headers: [0.24, 0.3], outline: [0.78, 0.83], strip: [0.8, 0.86], notes: [0.82, 0.88], key: [0.82, 0.87],
};

/**
 * @param {'row'|'bands'} arr  row: the offer board spans the top; below it Party A (left) and the two
 *   reply scenes side by side. bands: Party A beside the offer board on top; the two reply scenes below.
 */
function layoutShared(ctx, arr, target = 0, minPx = 0) {
  const p = ctx.params;
  const th = ctx.theme;
  const DW = ctx.design.w, DH = ctx.design.h;
  const upx = unitPx(ctx);
  const RA = resolveResponse(p, p.responses[0]);
  const RB = resolveResponse(p, p.responses[1]);
  const Rs = RB.substituted ? RB : RA;           // the different piece both responders hold
  const kRow = Rs.substituted ? Rs.k : 1;
  const show = ctx.show('all');
  // coordinator decision 2026-09-26 (LAW-0135 precedent, shared content drawn once): at 1:1 the four pieces are
  // printed in full once, numbered, on the shared offer board; the reply copies show the matching number tokens
  // (same number, same colour tab); B's different piece is always drawn in full; a key chip explains the tokens
  const tokens = ctx.view.shape === 'square';
  const looks = [actorLook(ctx, p.parties[0], 0), actorLook(ctx, p.parties[1], 1)];
  const captions = [0, 1].map(i => (p.parties[i].role ? `${p.parties[i].name} · ${p.parties[i].role}` : p.parties[i].name));
  const pxSets = [
    {F: 28, FL: 25, min: 24, chip: 24}, {F: 25, FL: 22.5, min: 21.5, chip: 21.5},
    {F: 22, FL: 20.5, min: 20, chip: 20}, {F: 21, FL: 19.8, min: 19.6, chip: 19.6},
    {F: 19, FL: 17, min: 16.5, chip: 16.5}, {F: 17.5, FL: 16.5, min: 16.2, chip: 16.2}, {F: 16.6, FL: 16.1, min: 16.05, chip: 16.05},
    // below the 16 px floor: only when nothing at >= 16 px lays out (a clean frame that reports the missed floor rather
    // than a broken one; see textFloorMet in the semantics)
    {F: 15.5, FL: 15.2, min: 15, chip: 15}, {F: 14.5, FL: 14.2, min: 14, chip: 14}, {F: 13.5, FL: 13.2, min: 13, chip: 13},
  ];
  const gap = 10;
  // people never below 50 px heads (the stress floor 45 px with a clear margin: a rendered head ≥ 48 px, round 6;
  // the baselines need >= the reference, see target)
  const ks = range(2.4, 0.6, 0.05).filter(k => 88 * k * upx >= 50 - 1e-6);
  const searchKey = searchKeyOf(ctx, `shared:${arr}:${target}:${minPx}`);
  let best = SEARCH.get(searchKey) || null;
  const searched = SEARCH.has(searchKey);
  let budget = 0;
  for (const px of searched ? [] : pxSets) {
  if (px.chip < 16 && best && best.ok) break;
  // an earlier arrangement already fits at this size or larger: smaller sizes cannot win
  if (px.chip < minPx - 1e-6) break;
  // sheet headers: in full first; compact (references + title; parties are named by their chips) when that cannot fit
  for (const compact of [false, true]) {
    const F = px.chip / upx;                                   // editorial text
    const Fd = px.F / upx, FLd = Math.max(px.min, px.FL) / upx; // document text
    // ---- offer board variants (measured once per text size)
    const offerVariants = [];
    for (const above of [false, true]) {
      for (const twf of [7, 8.5, 10, 12, 14, 17, 20, 24]) {
        const tw = twf * Fd + TILE.tabW + TILE.padL + TILE.gripM;
        for (const lwf of [0, 5, 6.5, 8, 10]) {
          const lw = lwf ? lwf * FLd + SHEET.lp * 2 : 0;
          for (const hwf of above ? [0] : [7.5, 9, 11, 13, 15.5]) {
            const hw = hwf * Fd + SHEET.hp * 2;
            const M = measureDocs(ctx, {terms: p.terms, offer: p.offer, parties: p.parties, response: null, replyTag: '', tw, lw, hw, above, F: Fd, FL: FLd, show, compact: compact ? 'title' : false, numbered: tokens});
            if (M.bad.length) continue;
            offerVariants.push(offerSheetGeometry(M, {terms: p.terms, tw, lw, hw, above}));
          }
        }
      }
    }
    if (!offerVariants.length) continue;
    // offer boards per reserved width: the lowest one, and lower-but-narrower ones that leave room beside them
    const ovsMemo = new Map();
    const byH = (q1, q2) => q1.bh - q2.bh || q1.bw - q2.bw;
    const ovsFor = Wb => {
      if (!ovsMemo.has(Wb)) ovsMemo.set(Wb, [...new Set([DW - 16, DW - 340, DW - 460, DW - 580].map(wm => offerVariants.filter(S => S.bw <= wm - Wb).sort(byH)[0]).filter(Boolean))]);
      return ovsMemo.get(Wb);
    };
    const headerAt = (i, x, y, w) => header(ctx, {name: `hdr${i}`, x, y, w, letter: i ? 'B' : 'A', label: i ? p.scenarioB.label : p.scenarioA.label, caption: i ? p.scenarioB.caption : p.scenarioA.caption, size: F * 1.05, capSize: F, color: i ? th.accent : th.accent2});
    const chipSize = F;
    const chipFit = w => captions.map(c => (ctx.show('key') ? fitW(c, {maxWidth: w, size: chipSize, minSize: chipSize, maxLines: 4, weight: 600}) : null));
    // scene solves memoised per box size, scale and reply measure (pure; the same scene recurs across offer boards)
    const memoG = new Map();
    const sceneAt = (sceneW, sceneH, k, rm, chip) => {
      const key = `${sceneW.toFixed(2)}|${sceneH.toFixed(2)}|${k}|${rm.tw}|${chip ? chip.height : 0}`;
      if (memoG.has(key)) return memoG.get(key);
      if (--budget < 0) return null;
      const G = replySceneGeometry(ctx, {box: {x: 0, y: 0, w: sceneW, h: sceneH}, k, M: rm.M, tw: rm.tw, terms: p.terms, kRow, chip, chipSize: F, steps: [0, 0.14, 0.28, 0.42], fast: true});
      memoG.set(key, G);
      return G;
    };
    const replyMs = [];
    for (const twf of [...(tokens ? [3, 3.5, 4, 4.5] : []), 5, 6, 7, 7.5, 8, 8.5, 9, 10, 11, 12, 14, 17, 20, 24]) {
      const tw = twf * Fd + TILE.tabW + TILE.padL + TILE.gripM;
      const cw = SHEET.cp + tw + SHEET.spW + SHEET.cp;
      const M = measureDocs(ctx, {terms: p.terms, offer: p.offer, noOffer: true, parties: p.parties, response: Rs, replyTag: KIT_REPLY(ctx), tw, lw: 0, hw: 0, above: true, F: Fd, FL: FLd, show, replyHdrW: cw, compact: tokens || compact, tokens, inlineHdr: tokens});
      if (M.bad.length) continue;
      // a wider piece with the same row and header heights is dominated (only wider): keep the narrowest
      if (replyMs.some(q => Math.abs(q.M.th - M.th) < 0.5 && Math.abs(q.M.replyHdr.h - M.replyHdr.h) < 0.5)) continue;
      replyMs.push({M, tw});
    }
    if (!replyMs.length) continue;
    // lower bound of a scene's height (the reply board on its rail, or the smallest responder) and of the offer band:
    // text sizes / note splits that cannot reach it are skipped without a solve
    const minSceneH = Math.min(...replyMs.map(rm => rm.M.replyHdr.h + (p.terms.length * rm.M.th + (p.terms.length - 1) * TILE.gap + 2 * SHEET.cp + 8) + SHEET.bp + 21 + 10));
    const minBand = arr === 'bands' ? 0 : Math.min(...offerVariants.map(S => S.bh)) + 14;
    // tokens, Party A standing in its column ('row'): the footer runs under the scenes only (A's caption stays under A)
    const footX = 0, footW = DW;
    // tokens, Party A standing in its column ('row'): A's caption is placed in A's column, above A
    // (bands: under A first, then as a note beside A when that leaves more room)
    const aNotes = !ctx.show('key') ? [false] : arr === 'row' ? [true] : arr === 'bands' ? [false, true] : [false];
    // merged (the neutral note and the key drawn as one chip, both kept word for word): a last resort, only when
    // nothing unmerged fits at this size (in practice only the long-labels stress content)
    for (const [merged, aNote] of [...aNotes.map(a => [false, a]), ...aNotes.map(a => [true, a])]) {
    if (best && best.ok && best.head >= target - 1e-6) break;
    if (merged && best && best.ok && best.px === px) break;
    const defs = noteDefs(ctx, p, merged, tokens, aNote);
    // notes either in free room of the offer band ('band') or in the footer under the comparison strip ('foot')
    // notes: all in free room of the offer band / scene corners ('band'), all but the key there ('bandKey': the
    // key joins the comparison strip in the footer), or all in the footer under the strip ('foot')
    // tokens (1:1): every split of the notes between the band and the footer (fewest in the footer first)
    const order = ['key', 'shared', 'neutral', 'fact', 'tokens', 'partyB', 'partyA'].filter(n => defs.some(d => d.name === n));
    const prefixes = order.map((_, i) => order.slice(0, i + 1));
    const footSets = tokens ? [[], ...prefixes, ['shared'], ['shared', 'key'], ['neutral', 'key'], ['fact', 'key']] : [[], ['key'], ['shared'], ['shared', 'key'], ['neutral', 'key'], ['fact', 'key'], defs.map(d => d.name)];
    // per-width memo of the header and caption fits (the k loop re-uses them)
    const memoH = new Map(), memoC = new Map();
    const hdAt = w => { const key = Math.round(w); if (!memoH.has(key)) memoH.set(key, [headerAt(0, 0, 0, w), headerAt(1, 0, 0, w)]); return memoH.get(key); };
    const chipsAt = w => { const key = Math.round(w); if (!memoC.has(key)) memoC.set(key, chipFit(w)); return memoC.get(key); };
    for (const footSet of footSets) {
      budget = 2000;   // scene solves per text size, header style and note placement (a deterministic cap on the search)
      const inBandDefs = defs.filter(d => !footSet.includes(d.name));
      if (footSet.length && inBandDefs.length === defs.length) continue;
      const foot = footer(ctx, p, RA, RB, {w: footW, F, dry: true, merged, tokens, partyA: aNote, bInset: arr === 'row' ? DW * 0.2 - gap - 1 : 0, skip: ['docs', ...inBandDefs.map(d => d.name)]});
      const footH = foot.h;
      if (DH - minBand - 6 - footH - 12 < minSceneH) continue;
      for (const k of ks) {
        let got = null;
        if (arr === 'row' || arr === 'rowBadge') {
          // rowBadge (last resort for very long content): Party A appears as a portrait beside the offer board and
          // the two scenes take the full width
          const badge = arr === 'rowBadge';
          // Party A's column: as wide as A standing at this scale (and no wider than the old fixed column)
          const Wa = badge ? 0 : Math.min(DW * 0.2 - 2 * gap - 1, 110 * k + 16);
          if (!badge && Wa < 110 * k + 16) continue;
          const sceneW = badge ? (DW - gap) / 2 : (DW - Wa - 2 * gap) / 2;
          // each scene takes >= 40 % of the FRAME width
          if (frameFrac(ctx, sceneW) < 0.4) continue;
          const Wb = badge ? Math.min(300, DW * 0.24) : 0;
          // A's caption may run on under the left part of scene A's floor (clear of that scene's own chip)
          const chipsA = aNote ? [null, null] : chipsAt(badge ? Wb - 8 : Wa - 8 + sceneW * 0.45), chipsB = chipsAt(sceneW - 12);
          if ((chipsA[0] && chipsA[0].bad) || (chipsB[1] && chipsB[1].bad)) continue;
          const badgeR = badge ? clamp(44 * k, 36, 64) : 0;
          const badgeH = badge ? 2 * badgeR + 12 + (chipsA[0] ? chipsA[0].height + chipSize * 0.72 : 0) : 0;
          // offer boards: the lowest one, and lower-but-narrower ones that leave room beside them for the notes
          const ovs = ovsFor(Wb);
          if (!ovs.length) continue;
          const hd = hdAt(sceneW - 8);
          for (const ov of ovs) {
          if (got) break;
          const bandH = Math.max(ov.bh, badgeH) + 14;
          // headers above the scenes, or (inset) in the free corner above the reply board, left of the responder's head
          for (const inset of [false, true]) {
          if (got) break;
          const hh = inset ? 0 : Math.max(hd[0].h, hd[1].h);
          const sceneY = bandH + hh + 6;
          const sceneH = DH - sceneY - footH - 12;
          const sceneBoxes = badge ? [{x: 0, y: sceneY, w: sceneW, h: sceneH}, {x: sceneW + gap, y: sceneY, w: sceneW, h: sceneH}]
            : [{x: Wa + gap, y: sceneY, w: sceneW, h: sceneH}, {x: Wa + 2 * gap + sceneW, y: sceneY, w: sceneW, h: sceneH}];
          for (const rm of replyMs) {
            if (414 * k + (tokens ? 12 : 40) > sceneH || 100 * k + rm.tw * 0.6 > sceneW) continue;   // cannot fit: skip without a solve
            const G = sceneAt(sceneW, sceneH, k, rm, tokens ? null : chipsB[1]);
            if (!G) break;
            if (!G.ok) continue;
            let ins = null;
            if (inset) {
              const wI = G.headB.x - 14 - 8;
              const hI = hdAt(wI);
              const hIh = Math.max(hI[0].h, hI[1].h);
              const yI = G.board.y - 10 - hIh;
              if (wI < 8 * F || hI.some(q => q.bad) || yI < 0) continue;
              ins = {w: wI, y: yI, h: hIh};
            }
            // no empty band above the people: the offer band moves down to the scenes' content
            const lift = Math.max(0, Math.min(G.extent.y, G.headB.y, ins ? ins.y : Infinity) - 4);
            const A = badge ? {badge: true, x: 8 + Wb / 2, y: 6 + lift + badgeR + 2, R: badgeR, k, w: Wb}
              : {x: Wa / 2 + 8, floor: sceneY + G.floorY, f: 1, k};
            if (!badge && headBox(A).y < bandH + lift + 4) continue;
            // notes: beside the offer board in its band (board left, centred or right), else above A's head
            const oxs = badge ? [Wb + 16 + (DW - Wb - 24 - ov.bw) / 2, DW - 8 - ov.bw, Wb + 16] : [(DW - ov.bw) / 2, DW - 8 - ov.bw, 8];
            let notes = [], offerAt = {x: oxs[0], y: 6 + lift};
            if (inBandDefs.length) {
              notes = null;
              for (const ox of oxs) {
                // free room: beside the offer board, above A's head, and each scene's corner above its reply board
                const corners = ins ? [] : sceneBoxes.map(b => ({x: b.x + 8, y: b.y + G.headB.y, w: G.headB.x - 20, h: G.board.y - 12 - G.headB.y, align: 'start', overScenes: true}));
                const regs = badge
                  ? [{x: Wb + 12, y: 8 + lift, w: ox - Wb - 26, h: bandH - 12, align: 'end', overScenes: true}, {x: ox + ov.bw + 14, y: 8 + lift, w: DW - 8 - (ox + ov.bw + 14), h: bandH - 12, align: 'start', overScenes: true},
                    // under A's portrait and caption
                    {x: 8, y: 6 + lift + badgeH + 10, w: Wb - 8, h: bandH - badgeH - 22, align: 'middle'}, ...corners]
                  : [{x: 8, y: 8 + lift, w: ox - 22, h: bandH - 12, align: 'end', aCol: ox - 22 <= Wa + 48}, {x: ox + ov.bw + 14, y: 8 + lift, w: DW - 8 - (ox + ov.bw + 14), h: bandH - 12, align: 'start', overScenes: true},
                    {x: 8, y: bandH + lift + 8, w: Wa - 8, h: headBox(A).y - 10 - (bandH + lift + 8), align: 'middle', aCol: true}, ...corners];
                notes = placeInRegions(ctx, inBandDefs, regs, F);
                if (notes) { offerAt = {x: ox, y: 6 + lift}; break; }
              }
              if (!notes) continue;
            }
            got = {G, ov, hd, hh, sceneBoxes, A, Wa, chipsA, sceneW, offerAt, notes, foot, footH, top: lift, inset: ins};
            break;
          }
          }
          }
        } else {
          const sceneW = (DW - gap) / 2;
          const chipsA = aNote ? [null, null] : chipsAt(DW * 0.3), chipsB = chipsAt(sceneW - 12);
          if ((chipsA[0] && chipsA[0].bad) || (chipsB[1] && chipsB[1].bad)) continue;
          const aChipH = chipsA[0] ? chipsA[0].height + chipSize * 0.72 + 22 : 12;
          const aW = 120 * k + 20;
          // offer boards that fit beside A: the lowest, and narrower ones that leave room for notes beside them
          // (the band is as tall as A or the offer board, whichever is taller)
          const fitsBand = offerVariants.filter(S => S.bw <= DW - aW - 24).sort(byH);
          const ovsB = [...new Set([0, 260, 380, 500].map(res => fitsBand.find(S => S.bw <= DW - aW - 24 - res)).filter(Boolean))];
          if (!ovsB.length) continue;
          for (const ov of ovsB) {
          if (got) break;
          const topH = Math.max(414 * k + 14, ov.bh + 20) + aChipH;
          const hd = hdAt(sceneW - 8);
          // headers above the scenes, or (inset) in each scene's free room left of its reply board
          for (const inset of [false, true]) {
          if (got) break;
          const hh = inset ? 0 : Math.max(hd[0].h, hd[1].h);
          const sceneY = topH + hh + 6;
          const sceneH = DH - sceneY - footH - 12;
          if (sceneH < 300 * k) continue;
          for (const rm of replyMs) {
            if (414 * k + (tokens ? 12 : 40) > sceneH || 100 * k + rm.tw * 0.6 > sceneW) continue;   // cannot fit: skip without a solve
            const G = sceneAt(sceneW, sceneH, k, rm, tokens ? null : chipsB[1]);
            if (!G) break;
            if (!G.ok) continue;
            let ins = null;
            if (inset) {
              const wI = G.board.x - 14 - 8;
              const hI = hdAt(wI);
              const hIh = Math.max(hI[0].h, hI[1].h);
              const yI = Math.max(4, Math.min(G.board.y, G.headB.y));
              if (wI < 8 * F || hI.some(q => q.bad) || yI + hIh > G.floorY - 12) continue;
              ins = {w: wI, y: yI, h: hIh};
            }
            const lift = Math.max(0, Math.min(G.extent.y, G.headB.y, ins ? ins.y : Infinity) - 4);
            const sceneBoxes = [{x: 0, y: sceneY, w: sceneW, h: sceneH}, {x: sceneW + gap, y: sceneY, w: sceneW, h: sceneH}];
            const floorA = lift + topH - aChipH;
            const groupW = aW + 24 + ov.bw;
            const A = {x: (DW - groupW) / 2 + aW / 2, floor: floorA, f: 1, k};
            const offerAt = {x: A.x + aW / 2 + 24, y: 8 + lift};
            let notes = [];
            if (inBandDefs.length) {
              // free room of the band: under the offer, right of it, left of A (A's side only)
              const bandBot = floorA + aChipH - 14;
              const xL = A.x - aW / 2 - 12, xR = offerAt.x + ov.bw + 14;
              const under = {x: offerAt.x, y: offerAt.y + ov.bh + 14, w: Math.min(ov.bw, DW - 8 - offerAt.x), h: floorA - 8 - (offerAt.y + ov.bh + 14), align: 'start', overScenes: true, aCol: true};
              // (above A's caption, which runs wider than A)
              const left = {x: 8, y: 8 + lift, w: xL - 8, h: floorA + 2 - 8 - lift, align: 'end', aCol: true};
              const right = {x: xR, y: 8 + lift, w: DW - 8 - xR, h: bandBot - 8 - lift, align: 'start', overScenes: true};
              // the free room right of the offer as one column, or as two columns side by side
              const halfW = (right.w - 12) / 2;
              // each scene's free room left of its reply board (below an inset header): the key / the token key in A,
              // the responder's caption in B
              const yS = ins ? ins.y + ins.h + 10 : Math.max(4, Math.min(G.board.y, G.headB.y));
              const inScenes = sceneBoxes.map((b, i) => ({x: b.x + 8, y: b.y + yS, w: G.board.x - 22, h: G.floorY - 12 - yS, align: 'start', scene: i ? 'B' : 'A'}));
              notes = placeInRegions(ctx, inBandDefs, [under, right, left, ...inScenes], F)
                || (halfW >= 8 * F ? placeInRegions(ctx, inBandDefs, [under, {...right, w: halfW}, {...right, x: right.x + halfW + 12, w: halfW}, left, ...inScenes], F) : null);
              if (!notes) continue;
            }
            got = {G, ov, hd, hh, sceneBoxes, A, Wa: aW, chipsA, sceneW, offerAt, notes, foot, footH, top: lift, inset: ins};
            break;
          }
          }
          }
        }
        if (got) {
          const bad = got.foot.bad || got.hd.some(q => q.bad);
          const cand = {...got, px, F, merged, footX, footW, aNote, ok: !bad, head: 88 * k * upx};
          const meets = c => c.ok && c.head >= target - 1e-6;
          if (!best || (meets(cand) && !meets(best)) || (cand.ok && !best.ok) || (meets(cand) === meets(best) && cand.ok === best.ok && !meets(best) && cand.head > best.head + 0.5)) best = cand;
          break;
        }
      }
    }
    }
    if (best && best.ok) break;
  }
    if (best && best.ok && best.head >= target - 1e-6) break;
  }
  if (!searched) SEARCH.set(searchKey, best);
  if (!best) return null;
  // ---- build the blocks
  const {G, ov, sceneBoxes, A, px, F} = best;
  // headers sit right above the scenes' content (the band above moved down by the same amount)
  const ins = best.inset;
  const hdrY = ins ? sceneBoxes[0].y + ins.y : sceneBoxes[0].y + best.top - best.hh - 2;
  const headers = [0, 1].map(i => header(ctx, {name: `hdr${i}`, x: sceneBoxes[i].x + 8, y: hdrY, w: ins ? ins.w : best.sceneW - 8, letter: i ? 'B' : 'A', label: i ? p.scenarioB.label : p.scenarioA.label, caption: i ? p.scenarioB.caption : p.scenarioA.caption, size: F * 1.05, capSize: F, color: i ? th.accent : th.accent2}));
  const offer = offerBoardArt(ctx, ov, best.offerAt.x, best.offerAt.y, 'offer');
  const Fd = px.F / upx;
  const spareFit = show && Rs.substituted ? fitW(Rs.value, {maxWidth: G.tw - TILE.tabW - TILE.padL - TILE.gripM, size: Fd, minSize: Fd, maxLines: 3, weight: 700}) : null;
  const scenes = [RA, RB].map((R, i) => buildReplyScene(ctx, G, {prefix: i ? 'b' : 'a', response: R, look: looks[1], value: spareFit}));
  const rigA = A.badge ? null : personRig(ctx, {name: 'pa', look: looks[0]});
  const badgeA = A.badge ? personBadge(ctx, {name: 'pa-badge', x: A.x, y: A.y, radius: A.R, look: looks[0]}) : null;
  const chipA = best.chipsA[0] ? chipW(ctx, '', {x: 0, y: 0, size: F, fit: best.chipsA[0], maxWidth: 999}) : null;
  const chipAY = A.badge ? A.y + A.R + 10 : A.floor + 12;
  const chipANode = chipA ? chipW(ctx, '', {x: clamp(A.x - chipA.box.w / 2, 6, DW - 6 - chipA.box.w), y: chipAY, size: F, fit: best.chipsA[0], maxWidth: 999, name: 'pa-chip'}) : null;
  const sceneParts = sceneBoxes.map(b => [G.board, figureBox(G.B), G.chipBox, G.stool, G.rail].filter(Boolean).map(q => ({x: q.x + b.x, y: q.y + b.y, w: q.w, h: q.h})));
  const push = G.push;
  const rowAt = i => G.Ry + G.colTop + G.rowIn(i);
  const outlines = [0, 1].map(i => {
    const o = sceneBoxes[i];
    const x = G.xSp - SHEET.spW / 2 - G.tw - push - 8 + o.x, y = rowAt(kRow) - G.th / 2 - 8 + o.y;
    const w = G.tw + SHEET.spW + 16, hgt = G.th + 16;
    return {box: {x, y, w, h: hgt}, node: g({name: `ring${i}`, opacity: 0}, h('path', {d: roundRectPath(x, y, w, hgt, 12), fill: 'none', stroke: th.accent, 'stroke-width': 4}))};
  });
  const markers = RB.substituted ? [changedMarker(ctx, {name: 'mk-b', x: G.xSp - SHEET.spW / 2 - G.tw + 3 - push + sceneBoxes[1].x, y: rowAt(kRow) - G.th / 2 + 3 + sceneBoxes[1].y, radius: Math.max(13, F * 0.6), opacity: 0})] : [];
  const defs = noteDefs(ctx, p, best.merged, tokens, best.aNote);
  const inBand = best.notes && best.notes.length;
  const scenesBottom = Math.max(...sceneBoxes.map(b => b.y + G.extent.y + G.extent.h));
  const footY = Math.min(DH - best.footH - 4, scenesBottom + 12);
  const foot = footer(ctx, p, RA, RB, {w: best.footW, x: best.footX, F, y: footY, merged: best.merged, tokens, partyA: best.aNote, bInset: arr === 'row' ? DW * 0.2 - gap - 1 : 0, skip: ['docs', ...(best.notes || []).map(q => q.name)]});
  // the whole composition is centred vertically in the frame
  const oy = Math.max(-best.top, (DH - (footY + best.footH + 4 - best.top)) / 2 - best.top);
  const panels = [0, 1].map(i => {
    const b = sceneBoxes[i];
    return h('path', {name: `panel${i}`, d: roundRectPath(b.x - 4, hdrY - 6, b.w + 8, b.y + b.h - hdrY + 10, 16), fill: th.dark ? '#ffffff' : '#000000', 'fill-opacity': 0.035, stroke: th.paperLine, 'stroke-width': 1.5});
  });
  // layout checks across the blocks
  const why = [...G.why];
  const offerBox = offer.box;
  if (ins && headers.some((hd, i) => overlaps({x: sceneBoxes[i].x + 8, y: hdrY, w: ins.w, h: ins.h}, {x: G.headB.x + sceneBoxes[i].x, y: G.headB.y + sceneBoxes[i].y, w: G.headB.w, h: G.headB.h}, 2))) why.push('inset');
  const figA = A.badge ? {x: A.x - A.R, y: A.y - A.R, w: 2 * A.R, h: 2 * A.R} : figureBox(A);
  const sceneExt = sceneBoxes.map(b => ({x: G.extent.x + b.x, y: G.extent.y + b.y, w: G.extent.w, h: G.extent.h}));
  const noteBoxes = (best.notes || []).map(q => q.c.box);
  if (sceneExt.some(q => overlaps(q, offerBox, 4))) why.push('offer-scene');
  if (overlaps(figA, offerBox, 2)) why.push('offer-A');
  if (sceneExt.some(q => overlaps(q, figA, 2))) why.push('A-scene');
  if (sceneExt.some(q => overlaps(q, {x: 0, y: footY, w: DW, h: best.footH}, 0))) why.push('foot');
  if (chipANode && sceneParts.flat().some(q => overlaps(q, chipANode.box, 4))) why.push('chipA');
  if (chipANode && (foot.boxes.some(q => overlaps(q, chipANode.box, 2)) || overlaps(foot.stripBox, chipANode.box, 2) || chipANode.box.y + chipANode.box.h > DH)) why.push('chipA-foot');
  if (noteBoxes.some(nb => overlaps(nb, offerBox, 4) || overlaps(nb, figA, 4) || sceneParts.flat().some(q => overlaps(q, nb, 4)) || (chipANode && overlaps(nb, chipANode.box, 4)))) why.push('notes');
  // each scene's responder, reply board and held pieces stay inside that scene's own panel
  const inPanels = sceneExt.every((q, i) => q.x >= sceneBoxes[i].x - 2 && q.x + q.w <= sceneBoxes[i].x + sceneBoxes[i].w + 2);
  if (!inPanels) why.push('panel');
  const frameBox = {x: 0, y: 0, w: DW, h: DH};
  if (!insideBox(offerBox, frameBox) || !sceneExt.every(q => insideBox(q, frameBox, -2)) || !noteBoxes.every(q => insideBox(q, frameBox))) why.push('frame');
  return {
    mode: 'shared', arr, G, ov, offer, scenes, sceneBoxes, headers, hdrY, rigA, badgeA, A, chipANode, outlines, markers, foot, panels, RA, RB, kRow, upx, F,
    notes: best.notes || [], ok: best.ok && why.length === 0, why, head: best.head, sceneW: best.sceneW, oy, textPx: px.chip,
  };
}

/** The contrast's notes (changed fact, shared facts, neutral note, key). */
/** The key to the number tokens (e.g. '①–④ = the offer's pieces 1–4, copied as supplied'). */
const partyCaption = (p, i) => (p.parties[i].role ? `${p.parties[i].name} · ${p.parties[i].role}` : p.parties[i].name);

function tokenKey(ctx, n) {
  return ctx.t.tokens.replace('{a}', pieceNo(0)).replace('{b}', pieceNo(n - 1)).replace('{n}', String(n));
}

function noteDefs(ctx, p, merged = false, tokens = false, partyA = false) {
  const th = ctx.theme;
  const out = [];
  if (partyA) out.push({name: 'partyA', text: partyCaption(p, 0), stroke: th.ink, inAColumn: true});
  // tokens (1:1): the responder is the same person in both scenes; its caption is drawn once (over the scenes)
  if (tokens && ctx.show('key')) out.push({name: 'partyB', text: partyCaption(p, 1), stroke: th.ink, overScenes: true, inScene: 'B'});
  if (tokens && ctx.show('all')) out.push({name: 'tokens', text: tokenKey(ctx, p.terms.length), stroke: th.inkSoft, inScene: 'A'});
  if (ctx.show('all')) {
    out.push({name: 'fact', text: p.changedFact, stroke: th.accent});
    if (p.sharedFacts.length) out.push({name: 'shared', text: `${ctx.t.same}: ${p.sharedFacts.join(' · ')}`, stroke: th.inkSoft});
    // merged: the neutral note and the key share one chip (both kept, word for word)
    out.push({name: 'neutral', text: merged && ctx.show('key') ? `${p.comparisonLabels.neutral} · ${ctx.t.key}` : p.comparisonLabels.neutral, stroke: th.inkSoft});
  }
  if (ctx.show('key') && !(merged && ctx.show('all'))) out.push({name: 'key', text: ctx.t.key, stroke: th.inkSoft, inScene: 'A'});
  return out;
}

/** Whether a note may sit in a region: scene regions only take the notes meant for that scene; the responder's
 * caption only over the scenes; Party A's caption only beside A. */
function allowedIn(d, rg) {
  if (rg.scene) return Boolean(d.inScene && d.inScene.includes(rg.scene));
  return !((d.overScenes && !rg.overScenes) || (d.inAColumn && !rg.aCol));
}

/** Place the chips in the regions: first-fit, trying every order of the chips (null when no order fits). */
function placeInRegions(ctx, defs, regions, F) {
  const memo = new Map();
  const probeOf = (d, w) => {
    const key = `${d.name}|${Math.round(w)}`;
    if (!memo.has(key)) memo.set(key, chipW(ctx, d.text, {x: 0, y: 0, maxWidth: w, size: F, maxLines: 6, weight: 600, stroke: d.stroke}));
    return memo.get(key);
  };
  const usable = regions.filter(rg => rg.w >= 6 * F && rg.h > 0);
  // a chip that fits no region on its own: no order can work
  for (const d of defs) if (!usable.some(rg => { if (!allowedIn(d, rg)) return false; const q = probeOf(d, rg.w); return !q.fit.bad && q.box.h <= rg.h; })) return null;
  const perms = a => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(q => [x, ...q])));
  for (const order of perms(defs)) {
    const cur = usable.map(rg => ({...rg, yy: rg.y}));
    const out = [];
    let okAll = true;
    for (const d of order) {
      let placed = null;
      for (const rg of cur) {
        if (!allowedIn(d, rg)) continue;
        const probe = probeOf(d, rg.w);
        if (probe.fit.bad || rg.yy + probe.box.h > rg.y + rg.h) continue;
        const x = rg.align === 'end' ? rg.x + rg.w - probe.box.w : rg.align === 'start' ? rg.x : rg.x + (rg.w - probe.box.w) / 2;
        placed = {d, x, y: rg.yy, w: rg.w};
        rg.yy += probe.box.h + 8;
        break;
      }
      if (!placed) { okAll = false; break; }
      out.push(placed);
    }
    if (okAll) return out.map(q => ({name: q.d.name, c: chipW(ctx, q.d.text, {x: q.x, y: q.y, maxWidth: q.w, size: F, maxLines: 6, weight: 600, stroke: q.d.stroke, name: q.d.name, opacity: 0})}));
  }
  return null;
}

function buildShared(ctx, L) {
  return g({transform: L.oy ? T(0, L.oy) : undefined},
    L.panels,
    L.offer.node,
    L.scenes.map((S, i) => g({transform: T(L.sceneBoxes[i].x, L.sceneBoxes[i].y)}, S.node)),
    L.rigA ? L.rigA.node : L.badgeA.node,
    L.chipANode && L.chipANode.node,
    L.headers.map(hd => hd.node),
    L.outlines.map(o => o.node),
    L.markers,
    L.notes.map(q => q.c.node),
    L.foot.node);
}

function frameShared(ctx, L, u) {
  const nodes = {};
  const s = w => seg(u, ...WS[w]);
  const base = {latchReach: s('latchReach'), latchPress: s('latchPress'), carryReach: s('carryReach'), carry: s('carry'), headB: lerp(0, 8, s('latchReach'))};
  const vs = [L.RA, L.RB].map(R => (R.substituted
    ? {...base, remove: s('remove'), insert: s('insert'), turn: s('turn'), nearBack: s('nearBack')}
    : {...base, farBack: s('farBack')}));
  const posed = L.scenes.map((S, i) => S.pose(vs[i]));
  posed.forEach(q => Object.assign(nodes, q.nodes));
  // Party A beside the shared offer: at rest, head turned a little toward the replies as they come back
  const sa = L.rigA ? L.rigA.frame({x: L.A.x, y: L.A.floor, facing: 1, scale: L.A.k, headTilt: lerp(0, 5, s('carryReach'))}) : {nodes: {}, reached: true};
  Object.assign(nodes, sa.nodes);
  const hdrIn = r(s('headers'), 3);
  nodes.hdr0 = {opacity: hdrIn};
  nodes.hdr1 = {opacity: hdrIn};
  L.outlines.forEach((o, i) => { nodes[`ring${i}`] = {opacity: r(s('outline'), 3)}; });
  if (L.markers.length) nodes['mk-b'] = {opacity: r(s('outline'), 3)};
  Object.assign(nodes, L.foot.frame({strip: s('strip'), notes: s('notes'), key: s('key')}));
  for (const q of L.notes) nodes[q.name] = {opacity: r(q.name === 'key' ? s('key') : q.name === 'tokens' || q.name === 'partyA' || q.name === 'partyB' ? 1 : s('notes'), 3)};
  const [a, b] = posed.map(q => q.sem);
  const O = L.sceneBoxes.map(b => ({x: b.x, y: b.y + L.oy}));
  const P2 = (q, o) => (q ? {x: r(q.x + o.x), y: r(q.y + o.y)} : null);
  // look = everything visible in one reply scene, in scene coordinates
  const look = q => ({latchOpen: q.latchOpen, spareFaceUp: q.spareFaceUp, spareIn: q.spareIn, carry: q.carry, pieces: q.pieces, hands: [q.handB, q.handBn], spare: q.spare, old: q.oldPiece});
  const sc = q => ({latchOpen: q.latchOpen, spareIn: q.spareIn, moving: q.carry > 0 && q.carry < 1, done: q.carry >= 1});
  const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
  return {
    nodes,
    semantic: {
      beat,
      mode: 'shared',
      arr: L.arr, textPx: L.textPx, textFloorMet: L.textPx >= 16,
      lookA: look(a), lookB: look(b),
      a: sc(a), b: sc(b),
      aSet: P2(a.setAt, O[0]), bSet: P2(b.setAt, O[1]),
      aHandB: P2(a.handB, O[0]), bHandB: P2(b.handB, O[1]),
      aHandBn: P2(a.handBn, O[0]), bHandBn: P2(b.handBn, O[1]),
      bSpare: P2(b.spare, O[1]),
      // carrying the reply back: the responder's free hand pushes it along the rail toward Party A
      aCarryHand: P2(a.carryHand, O[0]), bCarryHand: P2(b.carryHand, O[1]),
      aCarryGrip: P2(a.carryGrip, O[0]), bCarryGrip: P2(b.carryGrip, O[1]),
      headers: hdrIn,
      guide: r(s('strip'), 3),
      allReached: a.allReached && b.allReached && sa.reached,
      layoutOk: L.ok,
      why: L.why.join(','),
      headPx: r(88 * L.G.k * L.upx, 1),
      k: r(L.G.k, 3),
      arrangement: 'row',
      panelFrac: r(frameFrac(ctx, L.sceneW), 3),
    },
  };
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const shape = ctx.view.shape;
    // coordinator decision 2026-09-26: 1:1 contrast heads >= 55 px (LAW-0171 precedent), text priority
    const target = shape === 'landscape' ? 104 : shape === 'portrait' ? 108 : 55;
    const cands = [];
    const good = L => L && L.ok && L.head >= target - 1e-6 && L.textPx >= 19.5;
    // wide frames: two complete stages when they fit with people at the reference size; otherwise (and on
    // square/tall frames) the shared offer: one offer board with Party A and two reply scenes
    const sh = arr => Object.assign(m => layoutShared(ctx, arr, target, m), {badge: arr === 'rowBadge'});
    const pair = () => layoutPair(ctx);
    const order = shape === 'landscape' ? [pair, sh('row'), sh('bands'), sh('rowBadge')]
      : shape === 'portrait' ? [sh('bands'), sh('row'), pair, sh('rowBadge')]
        : [sh('row'), sh('bands'), pair, sh('rowBadge')];
    // arrangements in order; each later one only tries text sizes at least as large as the best fit so far.
    // The portrait-badge arrangement (Party A reduced to a portrait) runs only when no other arrangement fits.
    let floorPx = 0;
    for (const f of order) {
      if (f.badge && cands.some(L => L.ok && L.textPx >= 16)) continue;
      const L = f(floorPx);
      if (!L) continue;
      cands.push(L);
      if (good(L)) return L;
      if (L.ok && L.textPx >= 16) floorPx = Math.max(floorPx, L.textPx);
    }
    // nothing meets both: a layout that fits with readable text (>= 19.5 px) first, then the largest people
    // (below 16 px only as a last resort: the largest text that keeps every block in frame, never a broken frame)
    const fits = cands.filter(L => L.ok).sort((a, b) => (b.textPx >= 16) - (a.textPx >= 16) || (a.textPx >= 16 ? 0 : b.textPx - a.textPx) || (b.arr !== 'rowBadge') - (a.arr !== 'rowBadge') || (b.head >= target - 1e-6) - (a.head >= target - 1e-6) || (b.textPx >= 19.5) - (a.textPx >= 19.5) || Math.floor(b.textPx) - Math.floor(a.textPx) || b.head - a.head);
    return fits[0] || cands[0];
  },
  build(ctx, L) { return L.mode === 'pair' ? buildPair(ctx, L) : buildShared(ctx, L); },
  frame(ctx, L, u) { return L.mode === 'pair' ? framePair(ctx, L, u) : frameShared(ctx, L, u); },
};

function KIT_REPLY(ctx) { return ctx.params.locale === 'es' ? 'Respuesta' : 'Reply'; }

/**
 * Footer: comparison strip (A's piece · guide label · B's piece), changed fact,
 * shared facts, neutral note and key — wrapped into rows across the full width.
 */
function footer(ctx, p, RA, RB, o) {
  const th = ctx.theme;
  const F = o.F;
  const k = RB.substituted ? RB.k : RA.substituted ? RA.k : 1;
  const valA = RA.substituted ? RA.value : p.terms[k].value;
  const valB = RB.substituted ? RB.value : p.terms[k].value;
  const items = [];
  let bad = false;
  const W = o.w;
  const y0 = o.y ?? 0;
  // comparison strip: two mini pieces joined by the guide
  // tokens (1:1): the mini pieces only as wide as their values (the guide between them gets the room)
  const one = t => fitW(t, {maxWidth: 9999, size: F, minSize: F, maxLines: 1, weight: 700}).width + TILE.tabW + TILE.padL + 24;
  const pieceW = o.tokens ? Math.min(W * 0.28, Math.max(one(valA), one(valB), 6 * F)) : Math.min(W * 0.28, 12 * F + 70);
  const fv = t => fitW(t, {maxWidth: pieceW - TILE.tabW - TILE.padL - 18, size: F, minSize: F, maxLines: 2, weight: 700});
  const fa = ctx.show('all') ? fv(valA) : null, fb = ctx.show('all') ? fv(valB) : null;
  if ((fa && fa.bad) || (fb && fb.bad)) bad = true;
  const ph = Math.max(fa ? fa.height : F, fb ? fb.height : F) + 20;
  const guideLab = ctx.show('all') ? fitW(p.comparisonLabels.guide, {maxWidth: W - 2 * pieceW - (o.tokens ? 90 : 120), size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  if (guideLab && guideLab.bad) bad = true;
  const stripH = Math.max(ph, guideLab ? guideLab.height + 16 : 0) + 8;
  const parts = [];
  const bR = F * 0.8;
  const mini = (x, y, fit, tab, letter, color, spare) => {
    const art = pieceArt(ctx, {tw: pieceW, th: ph, kind: spare ? 'spare' : 'copy', tab, value: fit, bars: fit ? 0 : 0.6});
    return g(null,
      h('circle', {cx: x - bR - 8, cy: y + ph / 2, r: bR, fill: color, stroke: th.ink, 'stroke-width': 2}),
      ctx.show('key') ? textBlock(fitW(letter, {maxWidth: bR * 2, size: F, maxLines: 1, weight: 800}), {x: x - bR - 8, y: y + ph / 2 - F * 0.5, anchor: 'middle', fill: '#fff'}) : null,
      g({transform: T(x + pieceW, y + ph / 2)}, art.front));
  };
  const xA = bR * 2 + 16, xB = W - pieceW - 6;
  const sy = y0 + 4;
  parts.push(mini(xA, sy, fa, tabColor(ctx, k), 'A', th.accent2, RA.substituted));
  parts.push(mini(xB, sy, fb, tabColor(ctx, k), 'B', th.accent, RB.substituted));
  const lx0 = xA + pieceW + 12, lx1 = xB - bR * 2 - 22;
  parts.push(h('path', {d: `M${r(lx0)} ${r(sy + ph / 2)}H${r(lx1)}`, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round'}));
  parts.push(h('circle', {cx: r(lx0), cy: r(sy + ph / 2), r: 6, fill: th.accent}), h('circle', {cx: r(lx1), cy: r(sy + ph / 2), r: 6, fill: th.accent}));
  if (guideLab) {
    const gw = guideLab.width + F * 1.2, gh = guideLab.height + F * 0.7;
    const gx = (lx0 + lx1) / 2 - gw / 2, gy = sy + ph / 2 - gh / 2;
    parts.push(h('path', {d: roundRectPath(gx, gy, gw, gh, Math.min(gh / 2, F * 0.7)), fill: th.card, stroke: th.accent, 'stroke-width': 2.4}));
    parts.push(textBlock(guideLab, {x: gx + gw / 2, y: gy + F * 0.35, anchor: 'middle', fill: th.ink}));
  }
  const strip = g({name: 'strip', opacity: 0}, parts);
  // chips: changed fact, shared facts, neutral note, key — flowed into rows
  const chipDefs = [];
  if (o.partyA) chipDefs.push({name: 'partyA', text: partyCaption(p, 0), stroke: th.ink});
  if (o.tokens && ctx.show('key')) chipDefs.push({name: 'partyB', text: partyCaption(p, 1), stroke: th.ink});
  if (o.tokens && ctx.show('all')) chipDefs.push({name: 'tokens', text: tokenKey(ctx, p.terms.length), stroke: th.inkSoft});
  if (ctx.show('all')) {
    // the documents' shared header data, drawn once for both scenes
    const t = ctx.t;
    chipDefs.push({name: 'docs', text: `${p.offer.reference} · ${p.offer.title} · ${t.from}: ${p.parties[0].name} · ${t.to}: ${p.parties[1].name}`, stroke: th.inkSoft});
    chipDefs.push({name: 'fact', text: p.changedFact, stroke: th.accent});
    if (p.sharedFacts.length) chipDefs.push({name: 'shared', text: `${ctx.t.same}: ${p.sharedFacts.join(' · ')}`, stroke: th.inkSoft});
    chipDefs.push({name: 'neutral', text: o.merged && ctx.show('key') ? `${p.comparisonLabels.neutral} · ${ctx.t.key}` : p.comparisonLabels.neutral, stroke: th.inkSoft});
  }
  if (ctx.show('key') && !(o.merged && ctx.show('all'))) chipDefs.push({name: 'key', text: ctx.t.key, stroke: th.inkSoft});
  const skip = new Set(o.skip || []);
  for (let i = chipDefs.length - 1; i >= 0; i--) if (skip.has(chipDefs[i].name)) chipDefs.splice(i, 1);
  const chipsOut = [];
  let y = y0 + stripH + 8, x = 0, rowH = 0;
  // the responder's caption (drawn once) starts under the scenes, never under Party A
  if (chipDefs[0] && chipDefs[0].name === 'partyB') x = o.bInset || 0;
  // tokens (1:1): a chip may take the full width (fewer lines for the long notes)
  const maxW = W * 0.49;
  if (o.tokens) {
    // tokens (1:1): two columns, each chip into the shorter one (Party A's caption left, under A; the responder's right)
    const colW = (W - 12) / 2, colY = [y, y];
    for (const d of chipDefs) {
      const col = d.name === 'partyA' ? 0 : d.name === 'partyB' ? 1 : colY[0] <= colY[1] ? 0 : 1;
      const c = chipW(ctx, d.text, {x: col * (colW + 12), y: colY[col], maxWidth: colW, size: F, maxLines: 4, weight: 600, stroke: d.stroke, name: d.name, opacity: 0});
      if (c.fit.bad) bad = true;
      chipsOut.push({name: d.name, c});
      colY[col] += c.box.h + 8;
    }
    y = Math.max(...colY) - 8;
    rowH = 0;
  } else for (const d of chipDefs) {
    let c = chipW(ctx, d.text, {x: 0, y: 0, maxWidth: maxW, size: F, maxLines: 3, weight: 600, stroke: d.stroke});
    if (x > 0 && x + c.box.w > W) { x = 0; y += rowH + 8; rowH = 0; }
    c = chipW(ctx, d.text, {x, y, maxWidth: maxW, size: F, maxLines: 3, weight: 600, stroke: d.stroke, name: d.name, opacity: 0});
    if (c.fit.bad) bad = true;
    chipsOut.push({name: d.name, c});
    x += c.box.w + 10;
    rowH = Math.max(rowH, c.box.h);
  }
  // centre each chip row
  const hTot = y + rowH - y0;
  const node = g(o.x ? {transform: T(o.x, 0)} : null, strip, chipsOut.map(q => q.c.node));
  const frame = v => {
    const out = {strip: {opacity: r(v.strip, 3)}};
    for (const q of chipsOut) out[q.name] = {opacity: r(q.name === 'key' ? v.key : q.name === 'docs' || q.name === 'tokens' || q.name === 'partyA' || q.name === 'partyB' ? 1 : v.notes, 3)};
    return out;
  };
  return {node, frame, h: hTot + 6, bad, boxes: chipsOut.map(q => ({...q.c.box, x: q.c.box.x + (o.x || 0)})), stripBox: {x: o.x || 0, y: y0, w: W, h: stripH}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-02-contrast',
    title: 'Acceptance and counter-offer — a matching reply vs a reply with one piece substituted',
    titleEs: 'Aceptación y contrapropuesta — Comparación de dos supuestos',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Aceptación y contrapropuesta',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical term-board scenes. In both, Party B goes to the same latch at the same time: in A it stays shut and the copy set carries every supplied piece into the reply; in B it opens, the piece stays on the offer and B slots a different piece in. Both replies are drawn back by Party A in parallel. The differing piece is outlined in both replies and compared in a strip; no winner, score or legal effect is stated.',
    tags: ['offer', 'reply', 'terms', 'comparison', 'substitution', 'matching', 'pieces', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/aceptacion-contrapropuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
