/**
 * LAW-0163 — Entrevista a cliente · contrast
 *
 * Storyboard — two complete interview scenes run on one clock (brief beats).
 * Both scenes are the same table, the same two people, the same question on
 * the interviewer's small question board and the same 7-cell day strip at the
 * board's foot. Only ONE supplied fact differs: the detail the client gives
 * when answering (A «Relato inicial», e.g. “the same week”; B «dato
 * aclarado», e.g. “on day 3”). That fact changes geometry: the interviewer's
 * pen draws a different mark on the strip (a loop around the supplied span
 * of days in A, a ring around one day in B).
 * Everything both scenes share (people, the question, shared facts) is drawn
 * ONCE in a plate under the pair, so the scenes stay large.
 *  [0.00–0.17] base: identical scenes at rest; boards unmarked; bubbles closed.
 *              A/B letter badges only (scenario labels appear with the change).
 *  [0.17–0.40] change: the interviewer asks the question ("?" bubble, the
 *              question's row lights up); the client answers and the bubble
 *              shows the supplied detail — different in A and B; B's clarified
 *              datum carries the neutral Δ marker.
 *  [0.40–0.77] parallel: in both scenes the pen marks the asked question's row
 *              (a process step), then records the detail on the strip: the
 *              loop in A spans the supplied days, the ring in B circles the
 *              supplied day. Same timing, different geometry.
 *  [0.77–1.00] guide: rings in the highlight accent around the two strip marks,
 *              a guide joins them through the changed-fact label, then the
 *              neutral note and the "as supplied · no conclusion drawn" key.
 *              Complete by 0.9 and held. No winner, score, credibility
 *              judgement or legal consequence is shown.
 * Side by side on wide boxes (16:9, 1:1), stacked on tall boxes (9:16).
 * @module animations/roles/LAW-0163
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, int, obj, contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {runTrack} from './kits/mediation-table.js';
import {
  interviewFields, INTERVIEW_DEFAULTS, KIT_STRINGS, firstSpeaker, captionOf,
  measureBoard, interviewStage, askBubble, keyChip, fitWords, wchip, overlaps, flap, stripLoop,
} from './kits/entrevista-a-cliente.js';

const ID = 'LAW-0163';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  plate: [0.02, 0.08], labels: [0.17, 0.22],
  // interviewer-first order (question → answer); swapped when the client opens
  first: [0.17, 0.27], second: [0.27, 0.38],
  // parallel action
  lean: [0.4, 0.46], toRow: [0.4, 0.45], tick: [0.45, 0.5], toStrip: [0.5, 0.55], mark: [0.55, 0.7], back: [0.7, 0.76], unlean: [0.7, 0.76],
  rings: [0.77, 0.81], guide: [0.79, 0.85], chip: [0.83, 0.87], note: [0.85, 0.9],
};
const CHANGE_AT = 0.17;
const LEAN_B = 12;

const STRINGS = {
  en: {...KIT_STRINGS.en, question: 'Question', shared: 'Same in both scenes'},
  es: {...KIT_STRINGS.es, question: 'Pregunta', shared: 'Igual en ambas escenas'},
};

const span = obj('Days of the strip marked for this scene (1-based, inclusive)', {from: int('First day', 1, 7), to: int('Last day', 1, 7)}, ['from', 'to']);

const sceneSchema = {
  ...interviewFields,
  props: obj('Shared props (identical in both scenes)', {
    question: str('The question the interviewer asks in both scenes (supplied text)', 90),
    listRows: int('Rows on the question board (the asked question is the last one)', 2, 4),
    days: int('Cells of the day strip at the foot of the board', 3, 7),
  }),
  ...contrastFields(),
  detailSpans: obj('Geometry of the changed fact: the strip cells the interviewer marks in each scene (supplied, never inferred from the wording)', {a: span, b: span}),
};

const defaultParams = {
  ...INTERVIEW_DEFAULTS,
  relationships: [
    {from: 'interviewer', to: 'client', kind: 'communication'},
    {from: 'client', to: 'interviewer', kind: 'communication'},
    {from: 'interviewer', to: 'client', kind: 'sequence'},
  ],
  props: {question: 'When did you email the seller?', listRows: 3, days: 7},
  scenarioA: {label: 'Initial account', caption: '“I emailed the seller the same week.”'},
  scenarioB: {label: 'Detail clarified', caption: '“I emailed the seller on day 3.”'},
  changedFact: 'When the email was sent',
  sharedFacts: ['The parcel arrived damaged', 'The seller was contacted by email'],
  comparisonLabels: {guide: 'Only this detail differs', neutral: 'Two versions of one exchange, side by side'},
  detailSpans: {a: {from: 1, to: 7}, b: {from: 3, to: 3}},
};

/** Per-shape staging. S = content text size (design units ≈ px). */
const CFG = {
  landscape: {arr: 'row', size: 26, kMax: 2.0, kMin: 0.9},
  square: {arr: 'row', size: 23, kMax: 1.4, kMin: 0.7},
  portrait: {arr: 'column', size: 30, kMax: 2.1, kMin: 1.0},
};
/** Person-local scene geometry. */
const GEO = {gap: 74, bw: 122, clearA: 108, left: 70, right: 72, crop: 22, head: 228};

/** Card with a bold heading and one wrapped paragraph (items joined by " · "); local origin top-left. */
function plateCard(ctx, heading, parts, w, size) {
  const th = ctx.theme;
  const pad = size * 0.6;
  const hf = fitWords(heading, {maxWidth: w - pad * 2, size, minSize: size, maxLines: 2, weight: 800});
  const para = parts.length ? fitWords(parts.join('  ·  '), {maxWidth: w - pad * 2, size, minSize: size, maxLines: 8, weight: 500}) : null;
  const hh = pad * 2 + hf.height + (para ? size * 0.45 + para.height : 0);
  const cw = Math.max(hf.width, para ? para.width : 0) + pad * 2;
  const node = g(null,
    h('path', {d: roundRectPath(0, 0, cw, hh, 12), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
    textBlock(hf, {x: pad, y: pad, fill: th.ink}),
    para ? textBlock(para, {x: pad, y: pad + hf.height + size * 0.45, fill: th.ink}) : null,
  );
  return {chips: [{c: {node, box: {x: 0, y: 0, w: cw, h: hh}}, dx: (w - cw) / 2}], h: hh, truncated: hf.truncated || (para && para.truncated)};
}

/** Wrap chips left→right into rows of width maxW. */
function flowChips(ctx, items, x0, y0, maxW, size, gapX, gapY, prefix) {
  const out = [];
  let x = x0, y = y0, rowH = 0;
  const rows = [[]];
  items.forEach((it, i) => {
    let c = wchip(ctx, it.text, {x: 0, y: 0, maxWidth: maxW, size, minSize: size, maxLines: 3, weight: it.weight ?? 600, fill: it.fill, stroke: it.stroke});
    if (x > x0 && x + c.box.w > x0 + maxW) { x = x0; y += rowH + gapY; rowH = 0; rows.push([]); }
    c = wchip(ctx, it.text, {x, y, maxWidth: maxW, size, minSize: size, maxLines: 3, weight: it.weight ?? 600, fill: it.fill, stroke: it.stroke, name: `${prefix}${i}`});
    rows[rows.length - 1].push(c);
    out.push(c);
    x += c.box.w + gapX;
    rowH = Math.max(rowH, c.box.h);
  });
  // centre each row
  const centred = [];
  for (const row of rows) {
    if (!row.length) continue;
    const w = row[row.length - 1].box.x + row[row.length - 1].box.w - x0;
    const dx = (maxW - w) / 2;
    for (const c of row) centred.push({c, dx});
  }
  return {chips: centred, h: y + rowH - y0, truncated: out.some(c => c.fit.truncated)};
}

/** tryLayout that draws even when some checks fail (only for the last-resort fallback). */
function tryLayoutForced(ctx, S, k, floor) {
  return tryLayout(ctx, S, k, floor, true);
}

function tryLayout(ctx, S, k, floor, force = false) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const problems = [];
  const col = C.arr === 'column';
  const n = p.props.days;

  // --- scene width: as wide as the frame allows at this scale (the table lengthens;
  // the client sits further from the board), so each scene is large
  const pairGap = col ? 0 : 36;
  const targetW = col ? D.w - 40 : (D.w - 20 - pairGap) / 2;
  const fixedL = GEO.left + GEO.gap + GEO.bw + GEO.right;
  const clearA = Math.min(300, Math.max(GEO.clearA, targetW / k - fixedL));
  const X = GEO.gap + GEO.bw + clearA;
  const sceneW = (GEO.left + X + GEO.right) * k;
  if (sceneW > targetW + 1 && !force) return {ok: false, problems: ['too-wide']};
  const bw = GEO.bw * k;
  const rowsTxt = new Array(p.props.listRows).fill('');
  const bs = Math.max(8, bw * 0.075);
  const cell = (bw - Math.max(10, bs * 0.62) * 2) / n;
  const M = measureBoard(ctx, {w: bw, title: '', questions: rowsTxt, size: bs, minSize: bs, maxLines: 1, strip: {days: n, cell: Math.min(cell * 1.15, bs * 3.2)}});

  // --- enlarged day strip (inset) on the table's front panel
  const tableW = (X + 52) * k;
  const iw = Math.min(tableW * 0.72, n * 78);
  const icw = iw / n;
  const ich = Math.min(icw * 0.9, 58);
  const ipad = 8;
  const insetH = ich + ipad * 2;
  const numSize = Math.min(ich * 0.5, 26);
  if (showKey && numSize < 16.5) problems.push('inset-small');
  const needPanel = (insetH + 20) / k; // local units from the panel top (≈ −21)
  const crop = floor ? 156 : Math.max(GEO.crop, needPanel - 21);
  const panelLocal = floor ? Math.max(58, needPanel - 21) : null;

  const headerH = S * 1.45;
  const R = 21 * k;
  const pad = S * 0.5;
  const mR = S * 0.62;
  // the answer bubble ends before the question bubble (in front of the interviewer)
  const askDX = -(X - 5 - (X - 80)) * k; // bubble centre 80 units in front of her hip
  const bubW = (X - 80 - 1.15 * 21 + GEO.left) * k - 16;
  const fitCap = cap => fitWords(cap, {maxWidth: bubW - pad * 2 - mR * 2 - pad * 0.5, size: S, minSize: Math.max(17, S * 0.86), maxLines: 3, weight: 600});
  const capA = fitCap(p.scenarioA.caption), capB = fitCap(p.scenarioB.caption);
  if (showAll && (capA.truncated || capB.truncated)) problems.push('caption');
  const bubH = pad * 2 + Math.max(capA.height, capB.height, mR * 2);
  const tail = 16 * k;
  const stageTop = headerH + bubH + tail;
  const sceneH = stageTop + (GEO.head + crop) * k;

  // --- shared band: guide chips, shared plate, neutral note + key.
  // 16:9 splits the band into three columns (plate | guide | note); otherwise stacked.
  const split = shape === 'landscape';
  const bandW = D.w - 20;
  // generic captions never below 17 px and never above the smallest supplied text
  const cMin = Math.min(capA.size, capB.size);
  const capS = Math.max(Math.min(17, cMin), Math.min(S * 0.92, cMin));
  const gs = capS;
  const guideW = split ? Math.min(340, bandW * 0.2) : Math.min(bandW, 560);
  // 16:9: the shared plate gets the widest column (it holds the most text)
  const sideW = split ? (bandW - guideW - 40) * 0.6 : bandW;
  const noteW = split ? (bandW - guideW - 40) * 0.4 : bandW;
  const guideTop = wchip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: guideW, size: gs, minSize: gs, maxLines: 3, weight: 700});
  const guideFact = wchip(ctx, `${ctx.t.changedFact}: ${p.changedFact}`, {x: 0, y: 0, maxWidth: guideW, size: gs, minSize: gs, maxLines: 4, weight: 600});
  if (guideTop.fit.truncated || guideFact.fit.truncated) problems.push('guide-truncated');
  // stacked bands put the two guide chips side by side when they fit on one row
  const guideRow = !split && guideTop.box.w + guideFact.box.w + 14 <= bandW;
  const guideH = guideRow ? Math.max(showAll ? guideTop.box.h : 0, showKey ? guideFact.box.h : 0) : (showAll ? guideTop.box.h + 4 : 0) + (showKey ? guideFact.box.h : 0);
  const items = [];
  if (showKey) items.push(captionOf(p, 'client'), captionOf(p, 'interviewer'));
  if (showAll) items.push(`${ctx.t.question}: ${p.props.question}`, ...p.sharedFacts);
  const plate = showKey ? plateCard(ctx, ctx.t.shared, items, sideW, capS) : {chips: [], h: 0, truncated: false};
  if (plate.truncated) problems.push('plate');
  const noteItems = [];
  if (showAll) noteItems.push({text: p.comparisonLabels.neutral, weight: 500});
  if (showKey) noteItems.push({text: ctx.t.key, weight: 600, stroke: th.inkSoft});
  const notes = flowChips(ctx, noteItems, 0, 0, noteW, capS, 14, 10, 'nt');
  if (notes.truncated) problems.push('notes');
  const vgap = S * 0.45;
  const guideGap = S * 1.1; // room for the guide line above the chips
  const bandH = guideGap + (split
    ? Math.max(guideH, plate.h, notes.h)
    : guideH + (items.length ? vgap + plate.h : 0) + (noteItems.length ? vgap + notes.h : 0));

  // --- arrangement
  const gapPair = col ? S * 1.1 : pairGap;
  const totalH = col ? sceneH * 2 + gapPair + bandH : sceneH + bandH;
  if (totalH > D.h - 12) problems.push('too-tall');
  if (problems.length && !force) return {ok: false, problems};

  const top = Math.round(6 + (D.h - 12 - totalH) / 2);
  const origins = col
    ? [{x: Math.round((D.w - sceneW) / 2), y: top}, {x: Math.round((D.w - sceneW) / 2), y: Math.round(top + sceneH + gapPair)}]
    : (() => {
      const x0 = Math.round((D.w - sceneW * 2 - pairGap) / 2);
      return [{x: x0, y: top}, {x: Math.round(x0 + sceneW + pairGap), y: top}];
    })();
  const bandY = col ? top + sceneH * 2 + gapPair : top + sceneH;

  // --- scenes
  // both scenes are computed at scene A's origin (bit-identical geometry); scene B is shifted
  // by a group transform, so "identical before the change" holds exactly
  const scenes = ['a', 'b'].map((id, i) => {
    const o = origins[0];
    const shift = {x: origins[i].x - origins[0].x, y: origins[i].y - origins[0].y};
    const A = {x: o.x + GEO.left * k, y: o.y + stageTop + GEO.head * k};
    const marks = {mark: p.detailSpans[id]};
    const st = interviewStage(ctx, {prefix: `s${id}`, k, A, X, crop, floor, panelLocal, actors: p.actors, board: M, boardText: false, boardOpts: {marks}, boardGap: GEO.gap, gesture: {x: 90, y: -86}});
    const cap = id === 'a' ? capA : capB;
    const tip = st.tipA;
    const bub = sceneBubble(ctx, {name: `bub${id}`, x: o.x, y: o.y + headerH, w: bubW, h: bubH, tip, baseX: tip.x + 8 * k, pad, cap, mR, marker: id === 'b', showText: showAll});
    const bpUp = st.boardAt({});
    const boardTop = st.boardBox.y - M.pad * 1.8;
    const askC = {x: st.headB.x + askDX, y: Math.min(st.headTopY - R * 1.5, boardTop - R * 1.3)};
    const ask = askBubble(ctx, {name: `ask${id}`, c: askC, R, tip: st.tipB, baseX: askC.x, stroke: '#3b4450'});
    if (overlaps(bub.box, ask.box, 2)) problems.push('bubble-ask');
    if (ask.box.y < o.y - 2) problems.push('ask-above-scene');
    // header: letter badge + scenario label
    const scen = id === 'a' ? p.scenarioA : p.scenarioB;
    const color = id === 'a' ? th.accent2 : th.accent3;
    const bR = Math.max(S * 0.7, 15);
    const hy = o.y + headerH * 0.45;
    const labelFit = fitWords(scen.label, {maxWidth: sceneW - bR * 2 - 16, size: S, minSize: Math.max(17, S * 0.86), maxLines: 1, weight: 700});
    if (labelFit.truncated) problems.push('label');
    const header = g({name: `hdr${id}`},
      h('circle', {cx: r(o.x + bR), cy: r(hy), r: r(bR), fill: color, stroke: th.ink, 'stroke-width': 2.5}),
      showKey ? textBlock(fitWords(id.toUpperCase(), {maxWidth: bR * 2, size: bR * 1.15, minSize: bR * 1.15, maxLines: 1, weight: 800}), {x: o.x + bR, y: hy - bR * 0.52, anchor: 'middle', fill: id === 'a' ? '#fff' : th.ink}) : null,
      showKey ? g({name: `hdrl${id}`, opacity: 0}, textBlock(labelFit, {x: o.x + bR * 2 + 12, y: hy - labelFit.size * 0.62, fill: th.fg})) : null,
    );
    // pen plan: row tick (last row), then the strip mark
    const row = M.rows.length - 1;
    const tickW = q => bpUp.toWorld(st.bd.tickPaths[row].at(q));
    const markW = q => bpUp.toWorld(st.bd.markPolys.mark.at(q));
    const track = [
      {a: W.toRow[0], b: W.toRow[1], to: tickW(0), ease: ease.inOutSine},
      {a: W.tick[0], b: W.tick[1], at: u => tickW(ease.inOutSine(seg(u, ...W.tick)))},
      {a: W.toStrip[0], b: W.toStrip[1], to: markW(0), ease: ease.inOutSine},
      {a: W.mark[0], b: W.mark[1], at: u => markW(ease.inOutSine(seg(u, ...W.mark)))},
      {a: W.back[0], b: W.back[1], to: st.rest.nibB, ease: ease.inOutSine},
    ];
    // reach check (leaning in) over the whole pen path
    let reach = true;
    for (let q = 0; q <= 1.0001; q += 0.1) {
      reach = reach && st.pose({a: {}, b: {nib: tickW(q), lean: LEAN_B}}).semantic.reach.b;
      reach = reach && st.pose({a: {}, b: {nib: markW(q), lean: LEAN_B}}).semantic.reach.b;
    }
    if (!reach) problems.push('reach');
    // inset on the front panel: the same strip, enlarged and numbered; its mark follows the pen's
    const T0 = st.table;
    const pb = floor ? T0.panelBottom : T0.yBottom;
    const inset = {x: (T0.x0 + T0.x1) / 2 - iw / 2, y: T0.panelTop + (pb - T0.panelTop - insetH) / 2, w: iw, h: insetH};
    const IS = {x: inset.x + 0, y: inset.y + ipad, w: iw, h: ich, cw: icw, n};
    const loop = stripLoop(IS, p.detailSpans[id]);
    const sp = p.detailSpans[id];
    const a0 = Math.min(sp.from, sp.to), b0 = Math.max(sp.from, sp.to);
    const ring = {x: IS.x + (a0 - 1) * icw - 12, y: IS.y - ich * 0.62, w: (b0 - a0 + 1) * icw + 24, h: ich * 2.24};
    // enlargement cone: from the board strip's lower corners to the inset's upper corners
    const sTL = bpUp.toWorld({x: M.strip.x, y: M.strip.y + M.strip.h});
    const sTR = bpUp.toWorld({x: M.strip.x + M.strip.w, y: M.strip.y + M.strip.h});
    const insetNode = g({name: `inset${id}`},
      h('line', {x1: r(sTL.x), y1: r(sTL.y), x2: r(inset.x), y2: r(inset.y), stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '4 6'}),
      h('line', {x1: r(sTR.x), y1: r(sTR.y), x2: r(inset.x + iw), y2: r(inset.y), stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '4 6'}),
      h('path', {d: roundRectPath(inset.x - 6 + 4, inset.y + 6, iw + 12, insetH, 10), fill: th.shadow}),
      h('path', {d: roundRectPath(inset.x - 6, inset.y, iw + 12, insetH, 10), fill: th.paper, stroke: th.ink, 'stroke-width': 2.5}),
      Array.from({length: n}, (_, j) => g(null,
        h('rect', {x: r(IS.x + j * icw + 2), y: r(IS.y), width: r(icw - 4), height: r(ich), rx: 6, fill: j % 2 ? th.paperShade : '#fff', stroke: th.inkSoft, 'stroke-width': 1.8}),
        showKey
          ? textBlock(fitWords(String(j + 1), {maxWidth: icw, size: numSize, minSize: numSize, maxLines: 1, weight: 700}), {x: IS.x + (j + 0.5) * icw, y: IS.y + ich / 2 - numSize * 0.5, anchor: 'middle', fill: th.ink})
          : h('circle', {cx: r(IS.x + (j + 0.5) * icw), cy: r(IS.y + ich / 2), r: 4, fill: th.inkFaint}))),
      h('path', {name: `inmk${id}`, d: loop.d(1), fill: 'none', stroke: '#1d3f8f', 'stroke-width': r(Math.max(4, ich * 0.09)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(loop.total)} ${r(loop.total + 10)}`, 'stroke-dashoffset': r(loop.total), opacity: 0}),
    );
    const sh = b => ({...b, x: b.x + shift.x, y: b.y + shift.y});
    return {id, o, oWorld: origins[i], shift, st, bub, ask, header, track, ring: sh(ring), tickW, markW, row, insetNode, loop, inset: sh(inset)};
  });

  // --- guide: rings on the two insets + a line joining them through the changed-fact chip
  const [sa, sb] = scenes;
  const ringNodes = scenes.map(s => h('path', {name: `ring${s.id}`, d: roundRectPath(s.ring.x, s.ring.y, s.ring.w, s.ring.h, Math.min(s.ring.h / 2, 16)), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0}));
  const gy = bandY + guideGap * 0.55;
  let pts;
  let chipC;
  if (!col) {
    const ax = sa.ring.x + sa.ring.w / 2, bxr = sb.ring.x + sb.ring.w / 2;
    pts = [{x: ax, y: sa.ring.y + sa.ring.h}, {x: ax, y: gy}, {x: bxr, y: gy}, {x: bxr, y: sb.ring.y + sb.ring.h}];
    // guide chips sit in their own band column, between the plate and the notes
    chipC = {x: split ? 10 + sideW + 20 + guideW / 2 : D.w / 2, y: gy};
  } else {
    // from each ring's lower edge, down below the enlarged strip (never across its cells),
    // right along the panel and down the right margin
    const xm = Math.min(D.w - 8, sa.oWorld.x + sceneW + 12);
    const ya = sa.inset.y + sa.inset.h + 8, yb = sb.inset.y + sb.inset.h + 8;
    const ax = sa.ring.x + sa.ring.w / 2, bxr = sb.ring.x + sb.ring.w / 2;
    pts = [{x: ax, y: sa.ring.y + sa.ring.h}, {x: ax, y: ya}, {x: xm, y: ya}, {x: xm, y: yb}, {x: bxr, y: yb}, {x: bxr, y: sb.ring.y + sb.ring.h}];
    chipC = {x: D.w / 2, y: gy};
  }
  const guidePoly = polyline(pts);
  const guideLine = h('path', {name: 'guide', d: guidePoly.d(1), fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': `${r(guidePoly.total)} ${r(guidePoly.total + 10)}`, 'stroke-dashoffset': r(guidePoly.total), 'stroke-linejoin': 'round'});
  let gyChip = bandY + guideGap;
  const chipNodes = [];
  const place = (c, name, x, y, anchor = 'middle') => {
    const cc = wchip(ctx, c.fit.full, {x, y, anchor, maxWidth: c.box.w + 2, size: c.fit.size, minSize: c.fit.size, maxLines: 4, weight: c.fit.weight, name, stroke: th.accent});
    chipNodes.push(cc);
    return cc;
  };
  if (guideRow) {
    const tw = (showAll ? guideTop.box.w + 14 : 0) + (showKey ? guideFact.box.w : 0);
    let gx = chipC.x - tw / 2;
    if (showAll) { place(guideTop, 'gtop', gx, gyChip, 'start'); gx += guideTop.box.w + 14; }
    if (showKey) place(guideFact, 'gfact', gx, gyChip, 'start');
    gyChip += guideH;
  } else {
    if (showAll) { place(guideTop, 'gtop', chipC.x, gyChip); gyChip += guideTop.box.h + 4; }
    if (showKey) { place(guideFact, 'gfact', chipC.x, gyChip); gyChip += guideFact.box.h; }
  }
  const bandTop = bandY + guideGap;
  let plateX = 10, plateY, noteX = 10, noteY;
  if (split) {
    plateY = bandTop; noteY = bandTop;
    noteX = D.w - 10 - noteW;
  } else {
    plateY = gyChip + vgap;
    noteY = plateY + (items.length ? plate.h + vgap : 0);
  }
  const plateNodes = plate.chips.map(({c, dx}) => g({transform: T(plateX + dx, plateY)}, c.node));
  const noteNodes = notes.chips.map(({c, dx}) => g({transform: T(noteX + dx, noteY)}, c.node));
  const plateBox = {x: plateX, y: plateY, w: sideW, h: plate.h};
  const noteBox = {x: noteX, y: noteY, w: noteW, h: notes.h};
  const bandBottom = Math.max(gyChip, plateY + plate.h, noteY + notes.h);
  if (bandBottom > D.h - 4) problems.push('band-overflow');
  for (const c of chipNodes) if (overlaps(c.box, plateBox, 4) || overlaps(c.box, noteBox, 4)) problems.push('band-collision');
  for (const s of scenes) for (const c of chipNodes) if (overlaps(c.box, {x: s.oWorld.x, y: s.oWorld.y, w: sceneW, h: sceneH}, 2)) problems.push('guide-over-scene');

  // frame share of each scene (of the whole 1080p frame) and vertical fill of the design space
  const vc = ctx.view.content;
  const fit = Math.min(vc.w / D.w, vc.h / D.h);
  const frameFrac = (sceneW * fit) / ctx.view.width;
  const vFill = Math.min(1, (bandBottom - top) / D.h);
  return {ok: problems.length === 0, problems, S, k, floor, scenes, sceneW, sceneH, M, ringNodes, guideLine, guidePoly, chipNodes, plateNodes, noteNodes, plateBox, noteBox, col, capS, first: firstSpeaker(p.relationships), contentMin: Math.min(capA.size, capB.size, capS), frameFrac, vFill, insetCell: icw, numSize};
}

/** The client's answer bubble (fixed size, same for A and B), tail to the mouth. */
function sceneBubble(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh, tip, pad, cap, mR} = o;
  const rr = Math.min(24, hh * 0.3);
  const bw = Math.min(40, w * 0.12);
  const bxx = clamp(o.baseX ?? tip.x, x + rr + bw / 2 + 4, x + w - rr - bw / 2 - 4);
  const bottom = y + hh;
  const d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(bottom - rr)}Q${r(x + w)} ${r(bottom)} ${r(x + w - rr)} ${r(bottom)}H${r(bxx + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(bxx - bw / 2)} ${r(bottom)}H${r(x + rr)}Q${r(x)} ${r(bottom)} ${r(x)} ${r(bottom - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  const tx = x + pad + mR * 2 + pad * 0.5;
  const content = o.showText
    ? textBlock(cap, {x: tx, y: y + (hh - cap.height) / 2, fill: th.ink, name: `${o.name}-txt`})
    : g(null, cap.lines.map((ln, j) => h('rect', {x: r(tx), y: r(y + (hh - cap.height) / 2 + j * cap.lineHeight + cap.size * 0.2), width: r((w - tx + x - pad) * (j === cap.lines.length - 1 ? 0.6 : 0.95)), height: r(cap.size * 0.6), rx: r(cap.size * 0.3), fill: th.inkSoft, opacity: 0.8})));
  const node = g({name: o.name, opacity: 0},
    h('path', {d, fill: th.shadow, transform: T(5, 7)}),
    h('path', {d, fill: th.card, stroke: '#3b4450', 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    g({name: `${o.name}-body`, opacity: 0}, content),
    o.marker ? changedMarker(ctx, {name: `${o.name}-mark`, x: x + pad + mR, y: y + hh / 2, radius: mR, opacity: 0}) : null,
  );
  return {node, box: {x, y, w, h: hh}, tip};
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const tries = [];
    // pass 1 keeps the acting scenes large (each ≥ 40 % of the frame width side by side,
    // ≥ 80 % stacked); among fitting layouts the largest scale wins, then the fuller frame
    const minFrac = C.arr === 'column' ? 0.8 : 0.4;
    for (const pass of [1, 2]) {
      for (let S = C.size; S >= 17; S -= 1) {
        let best = null;
        for (const floor of [false, true]) {
          for (let k = C.kMax; k >= C.kMin - 1e-6; k -= 0.05) {
            const L = tryLayout(ctx, S, k, floor);
            if (!L.ok) { if (tries.length < 60) tries.push(`${S}/${r(k)}/${floor ? 'f' : 'c'}:${L.problems.join('+')}`); continue; }
            if (pass === 1 && L.frameFrac < minFrac) break;
            const score = L.k * 2 + L.vFill;
            if (!best || score > best.score) best = {L, score};
            break;
          }
        }
        if (best) return {...best.L, tries};
      }
    }
    // last resort: the smallest text and scale, drawn with its problems recorded (labelsFit false)
    for (const floor of [false, true]) {
      for (let k = C.kMin; k <= C.kMax + 1e-6; k += 0.05) {
        const L = tryLayoutForced(ctx, 17, k, floor);
        if (L.scenes) return {...L, ok: false, tries};
      }
    }
    throw new Error(`${ID}: no layout fits (${tries.slice(-3).join(' | ')})`);
  },
  build(ctx, L) {
    return g(null,
      L.scenes.map(s => g({name: `scene${s.id}`, transform: T(s.shift.x, s.shift.y)}, s.st.node, s.insetNode, s.header, s.ask.node, s.bub.node)),
      L.ringNodes,
      g({name: 'guidegrp', opacity: 0}, L.guideLine),
      g({name: 'plate', opacity: 0}, L.plateNodes),
      L.chipNodes.map(c => c.node),
      g({name: 'notes', opacity: 0}, L.noteNodes),
    );
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const nodes = {};
    // interviewer-first: question in `first`, answer in `second`; swapped when the client opens
    const qW = L.first === 'interviewer' ? W.first : W.second;
    const aW = L.first === 'interviewer' ? W.second : W.first;
    const x = w => seg(u, w[0], w[1]);
    const qx = x(qW), ax = x(aW);
    const askOpen = seg(qx, 0, 0.25) * (1 - seg(qx, 0.8, 1));
    const talkB = seg(qx, 0.05, 0.12) * (1 - seg(qx, 0.6, 0.7));
    const talkA = seg(ax, 0.06, 0.14) * (1 - seg(ax, 0.82, 0.92));
    const open = seg(ax, 0, 0.3);
    const words = seg(ax, 0.25, 0.55);
    const markerP = seg(ax, 0.65, 0.9);
    const hl = seg(qx, 0, 0.2) * (1 - seg(u, W.toStrip[0], W.toStrip[1]));
    const tick = ease.inOutSine(x(W.tick));
    const mark = ease.inOutSine(x(W.mark));
    const leanB = LEAN_B * ease.inOutSine(x(W.lean)) * (1 - ease.inOutSine(x(W.unlean)));
    const tiltB = lerp(-4, 8, ease.inOutSine(x(W.lean)) * (1 - ease.inOutSine(x(W.unlean))));
    const gest = ease.inOutSine(seg(ax, 0.1, 0.3)) * (1 - ease.inOutSine(seg(ax, 0.7, 0.95)));
    const wave = reduced ? 0 : Math.sin(timeMs * 0.009) * 8;
    const sem = {};
    const look = {};
    for (const s of L.scenes) {
      const st = s.st;
      const nib = runTrack(u, st.rest.nibB, s.track);
      const gp = {x: st.rest.gestureA.x, y: st.rest.gestureA.y + wave * st.k * gest};
      const nearA = {x: lerp(st.rest.nearA.x, gp.x, gest), y: lerp(st.rest.nearA.y, gp.y, gest)};
      const ticks = new Array(L.M.rows.length).fill(0);
      const hls = new Array(L.M.rows.length).fill(0);
      ticks[s.row] = tick;
      hls[s.row] = hl;
      const posed = st.pose({
        a: {near: nearA, lean: 5 * Math.max(talkA, gest), mouth: talkA * flap(timeMs, reduced), tilt: 0},
        b: {nib, lean: leanB, mouth: talkB * flap(timeMs, reduced, 0.9), tilt: tiltB},
        board: {},
        boardState: {ticks, hl: hls, marks: {mark: {p: mark}}},
      });
      // the enlarged inset follows the pen's mark exactly (same progress)
      posed.nodes[`inmk${s.id}`] = {'stroke-dashoffset': r(s.loop.total * (1 - mark)), opacity: mark > 0 ? 1 : 0};
      Object.assign(nodes, posed.nodes);
      const kk = open <= 0 ? 0.3 : 0.3 + 0.7 * (reduced ? ease.outCubic(open) : ease.outBack(open));
      nodes[`bub${s.id}`] = {opacity: r(clamp(open * 3), 3), transform: open >= 1 ? '' : `translate(${r(s.bub.tip.x)} ${r(s.bub.tip.y)}) scale(${r(kk, 4)}) translate(${r(-s.bub.tip.x)} ${r(-s.bub.tip.y)})`};
      nodes[`bub${s.id}-body`] = {opacity: r(clamp(words * 2), 3)};
      if (s.id === 'b') nodes['bubb-mark'] = {opacity: r(markerP, 3)};
      Object.assign(nodes, s.ask.frame(askOpen, reduced));
      if (ctx.show('key')) nodes[`hdrl${s.id}`] = {opacity: r(x(W.labels), 3)};
      const sm = posed.semantic;
      const o = s.o;
      // scene origins are whole units, so both scenes compute the same offsets
      const rel = q => ({x: r(q.x - o.x, 1), y: r(q.y - o.y, 1)});
      const inMark = u >= W.mark[0] && u <= W.mark[1];
      const inTick = u >= W.tick[0] && u <= W.tick[1];
      sem[s.id] = {
        pen: sm.pen, handB: sm.handB, gripB: sm.gripB, boardGrip: sm.boardGrip, handA: sm.handA,
        tickTarget: inMark || inTick ? {x: r(nib.x), y: r(nib.y)} : null,
        allReached: sm.allReached, markDrawn: r(mark, 3), ticked: r(tick, 3), bubble: r(open, 3), markerShown: s.id === 'b' ? r(markerP, 3) : 0,
        span: p.detailSpans[s.id], speakingA: talkA > 0.5, speakingB: talkB > 0.5, handFaceB: sm.handFaceB,
      };
      // everything visible in the scene, relative to its own origin (text excluded: its geometry is equal)
      look[s.id] = {
        // from the unrounded solved positions
        pen: rel({x: posed.pb.hands.near.x - st.gripVec.x, y: posed.pb.hands.near.y - st.gripVec.y}), handA: rel(posed.pa.hands.near), handB: rel(posed.pb.hands.near), gripB: rel(posed.pb.hands.far), mark: r(mark, 3),
        markLen: u < CHANGE_AT ? 0 : r(s.st.bd.markPolys.mark.total, 1), insetLen: u < CHANGE_AT ? 0 : r(s.loop.total, 1), tick: r(tick, 3), bubble: r(open, 3), words: r(words, 3), ask: r(askOpen, 3),
        marker: s.id === 'b' ? r(markerP, 3) : 0,
      };
    }
    // the guide (as drawn so far) keeps clear of every hand and pen
    const gp0 = seg(u, ...W.guide);
    let guideHandClear = Infinity;
    if (gp0 > 0) {
      for (let t = 0; t <= gp0 + 1e-9; t += 0.02) {
        const q = L.guidePoly.at(t);
        for (const s of L.scenes) for (const key of ['handA', 'handB', 'pen']) {
          const hq0 = sem[s.id][key];
          const hq = {x: hq0.x + s.shift.x, y: hq0.y + s.shift.y};
          guideHandClear = Math.min(guideHandClear, Math.hypot(q.x - hq.x, q.y - hq.y));
        }
      }
    }
    const ringP = seg(u, ...W.rings);
    for (const s of L.scenes) nodes[`ring${s.id}`] = {opacity: r(ringP, 3)};
    const gP = seg(u, ...W.guide);
    nodes.guidegrp = {opacity: gP > 0 ? 1 : 0};
    nodes.guide = {'stroke-dashoffset': r(L.guidePoly.total * (1 - gP))};
    const chipP = r(seg(u, ...W.chip), 3);
    for (const c of L.chipNodes) nodes[c.node.attrs.name] = {opacity: chipP};
    nodes.plate = {opacity: r(seg(u, ...W.plate), 3)};
    nodes.notes = {opacity: r(seg(u, ...W.note), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const A = sem.a, B = sem.b;
    return {
      nodes,
      semantic: {
        beat,
        a: A, b: B,
        lookA: look.a, lookB: look.b,
        penA: A.pen, penB: B.pen, handBA: A.handB, handBB: B.handB, gripBA: A.gripB, gripBB: B.gripB, boardGripA: A.boardGrip, boardGripB: B.boardGrip,
        handAA: A.handA, handAB: B.handA, tickA: A.tickTarget, tickB: B.tickTarget,
        allReached: A.allReached && B.allReached,
        guideProgress: r(gP, 3), ringsShown: r(ringP, 3), plateShown: r(seg(u, ...W.plate), 3), notesShown: r(seg(u, ...W.note), 3),
        changedFact: 'detail',
        guideHandClear: guideHandClear === Infinity ? 9999 : r(guideHandClear, 1),
        first: L.first,
        arrangement: L.col ? 'column' : 'row',
        sceneFrac: r(L.frameFrac, 3), vFill: r(L.vFill, 3), insetCell: r(L.insetCell, 1), numSize: r(L.numSize, 1), staging: L.floor ? 'floor' : 'crop',
        labelsFit: L.ok, layoutProblems: L.problems || [], layoutTries: (L.tries || []).slice(0, 24), textSize: L.S, scale: r(L.k, 2),
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
    slug: 'roles-01-contrast',
    title: 'Client interview — initial account vs clarified detail',
    titleEs: 'Entrevista a cliente — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Entrevista a cliente',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete interview scenes run in parallel: the same people, the same question and the same question board with a day strip. Only the detail the client gives differs (initial account vs clarified detail), and it changes geometry: the interviewer’s pen loops the supplied span of days in A and rings one supplied day in B. Shared content is drawn once; a guide joins the two marks through the changed-fact label. No winner or conclusion.',
    tags: ['client interview', 'contrast', 'initial account', 'clarified detail', 'question board', 'day strip', 'pen', 'speech bubble', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/entrevista-a-cliente.js', 'src/animations/roles/kits/mediation-labels.js', 'src/animations/roles/kits/mediation-table.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/markers.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
