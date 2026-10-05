/**
 * LAW-0183 — Interpretación lingüística · contrast
 *
 * Storyboard — two complete table scenes on one clock (brief beats). Both are
 * the same table, the same two speakers (same looks, same seats), the same
 * notepad and the same supplied words of the first speaker, in the same
 * bubble. Exactly ONE fact differs: how the listener receives the words —
 * A «Comunicación directa» (the words go straight to the listener) or
 * B «comunicación interpretada» (an interpreter renders them). The fact
 * changes people, relations and sequence, not just text or colour.
 * The supplied relationships are drawn as labelled links between the
 * bubbles and the people: in A the links between the two speakers (e.g.
 * "heard directly"); in B the links through the interpreter (A's words →
 * her rendering, her rendering → the listener).
 *  [0.00–0.17] base: identical scenes at rest; only the A/B letter badges.
 *  [0.17–0.40] change: the scenario placards appear on both table fronts; in
 *              B the interpreter is at the seat behind the table — whole and
 *              opaque from her first frame — and settles in; her name chip
 *              appears on the table front right under her. A's seat stays
 *              empty.
 *  [0.40–0.77] parallel: in both scenes the first speaker says the same words
 *              (same bubble, same tail). In A the listener turns to them and a
 *              link runs from the bubble to the listener. In B the interpreter
 *              listens and takes notes, then gives the supplied rendering in
 *              her own bubble (tail at HER mouth); links run from the first
 *              bubble to hers and from hers to the listener, who turns to it.
 *              The speakers never change.
 *  [0.77–1.00] guide: equal outlines on the one changed spot of each table
 *              front (empty in A, the interpreter's name in B), joined by a
 *              guide through the supplied guide label; shared facts, the
 *              changed fact, a neutral note and the "as supplied · no
 *              conclusion drawn" key. No winner, score, ranking or legal
 *              consequence; nothing says a rendering is accurate, faithful,
 *              certified, sufficient or valid.
 * Side by side on wide boxes (16:9, 1:1), stacked on tall boxes (9:16).
 * @module animations/roles/LAW-0183
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {mix, polyline, roundRectPath} from '../../core/geometry.js';
import {str, obj, contrastFields} from '../../schemas/fields.js';
import {textBlock, connector} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  interpFields, languagesField, INTERP_DEFAULTS, KIT_STRINGS, captionOf, roleOf, glueTail, tokenWidth,
  interpStage, measureBubble, speakBubble, ribbon, langColor, LANG_GLYPHS, fitWords, wchip, overlaps, keyChip, flap, runTrack, boxDist, segHits,
} from './kits/interpretacion-linguistica.js';

const ID = 'LAW-0183';
const DURATION = 7500;
const CHANGE = 0.17;
const BEATS = {base: [0, CHANGE], change: [CHANGE, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  labels: [0.17, 0.22], enter: [0.2, 0.3], iChip: [0.3, 0.36],
  bubS: [0.4, 0.44], talkS: [0.41, 0.54], gest: [0.42, 0.47], ungest: [0.5, 0.55], lean: [0.39, 0.43], unlean: [0.54, 0.58],
  // A: straight to the listener
  aTurn: [0.45, 0.51], aLink: [0.46, 0.55],
  // B: listen and note, then render
  turnSrc: [0.4, 0.45], strokes: [[0.45, 0.49], [0.505, 0.545]], penBack: [0.548, 0.575], turnDst: [0.565, 0.6],
  bubR: [0.6, 0.64], talkI: [0.61, 0.72], bLink1: [0.62, 0.68], bLink2: [0.66, 0.72], bTurn: [0.66, 0.71],
  rings: [0.77, 0.8], guide: [0.79, 0.85], strip: [0.83, 0.88], key: [0.85, 0.9],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, changed: 'Changed fact', shared: 'Same in both scenes'},
  es: {...KIT_STRINGS.es, changed: 'Hecho que cambia', shared: 'Igual en ambas escenas'},
};

const sceneSchema = {
  ...interpFields,
  relationships: {
    ...interpFields.relationships,
    description: 'Relationships drawn as labelled links, styled by kind: in A the links between the two speakers (A’s words → the listener), in B the links through the interpreter (A’s words → her rendering; her rendering → the listener). The label is shown beside its own link (array replaces the previous value)',
    items: obj('A relationship between two of the three people', {
      ...interpFields.relationships.items.properties,
      label: str('Label beside the link (empty = the caption of its kind)', 50),
    }, ['from', 'to', 'kind']),
  },
  languages: languagesField,
  props: obj('Supplied speech (the same first words in both scenes; the rendering exists only in B)', {
    utterance: str('What the first speaker says, as supplied (identical in A and B)', 120),
    rendering: str('The interpreter’s rendering in scenario B, as supplied', 120),
  }),
  ...contrastFields(),
};

const defaultParams = {
  ...INTERP_DEFAULTS,
  relationships: [
    {from: 'a', to: 'b', kind: 'communication', label: 'Heard directly'},
    {from: 'a', to: 'interpreter', kind: 'communication', label: 'Heard by the interpreter'},
    {from: 'interpreter', to: 'b', kind: 'communication', label: 'Rendered for the listener'},
  ],
  props: {
    utterance: 'Dejé las llaves en la recepción a las nueve.',
    rendering: 'I left the keys at the reception desk at nine.',
  },
  scenarioA: {label: 'Direct communication', caption: 'The words go straight to the listener'},
  scenarioB: {label: 'Interpreted communication', caption: 'An interpreter renders the words'},
  changedFact: 'Whether an interpreter renders the words for the listener',
  sharedFacts: ['Same two speakers at the same table', 'Same words from the first speaker'],
  comparisonLabels: {guide: 'Only this differs: an interpreter at the table', neutral: 'Two situations side by side; neither is ranked and no outcome is stated'},
};

/** Per shape: compact staging (seat distance X, person units) so the figures stay large. */
const CFG = {
  landscape: {arr: 'row', X: 300, size: 24, kMax: 1.95, kMin: 1.61, kStress: 1.31, crop: -28, gap: 30},
  square: {arr: 'row', X: 300, size: 21, kMax: 1.3, kMin: 1.005, kStress: 0.72, crop: -28, gap: 18},
  portrait: {arr: 'column', X: 370, size: 26, kMax: 2.0, kMin: 1.51, kStress: 1.1, crop: -28, gap: 20},
};
const YS = -150, ZI = 0.8, PADW = 150;
// a shallower tabletop (opt-in kit staging) keeps the figures large; the table front is a thin edge
const TABLE = {far: -98, near: -50};

/** Wrap chips into rows across a band width; returns placed chips (relative) and the band height. */
function flowChips(items, width, gap = 12) {
  const rows = [];
  let row = [], w = 0;
  for (const c of items) {
    if (row.length && w + gap + c.box.w > width) { rows.push(row); row = []; w = 0; }
    row.push(c); w += (row.length > 1 ? gap : 0) + c.box.w;
  }
  if (row.length) rows.push(row);
  const out = [];
  let y = 0;
  for (const rr of rows) {
    const rw = rr.reduce((q, c, i) => q + c.box.w + (i ? gap : 0), 0);
    let x = (width - rw) / 2;
    const rh = Math.max(...rr.map(c => c.box.h));
    for (const c of rr) { out.push({c, dx: x - c.box.x, dy: y - c.box.y}); x += c.box.w + gap; }
    y += rh + 10;
  }
  return {placed: out, h: Math.max(0, y - 10), rows: rows.length};
}

/**
 * Pack the shared chips (in their order) into as little height as possible: the chips are split into
 * consecutive rows; in each row every chip gets the least width that keeps it to the row's line count n,
 * and the least n whose widths fit the band wins. The partition with the least total height is used.
 */
function packStrip(ctx, specs, avail, gap = 12) {
  const memo = new Map();
  const at = (i, n) => {
    const key = `${i}|${n}`;
    if (memo.has(key)) return memo.get(key);
    const sp = specs[i];
    const make = w => wchip(ctx, sp.text, {...sp.o, x: 0, y: 0, maxWidth: w, maxLines: Math.max(n, sp.o.maxLines || 1)});
    // (no line of one or two short words left alone: "As supplied · / no" is never accepted)
    const ok = c => !c.fit.truncated && c.fit.lines.length <= n && (c.fit.lines.length === 1 || c.fit.lines.every(l => String(l).replace(/\u00a0/g, ' ').trim().length > 3));
    let out = null;
    if (ok(make(avail))) {
      let lo = 60, hi = avail;
      for (let q = 0; q < 12; q++) { const mid = (lo + hi) / 2; if (ok(make(mid))) hi = mid; else lo = mid; }
      out = make(Math.min(avail, hi + 1));
    }
    memo.set(key, out);
    return out;
  };
  // best[i] = least height packing specs[i..]
  const best = new Array(specs.length + 1).fill(null);
  best[specs.length] = {h: 0, rows: []};
  for (let i = specs.length - 1; i >= 0; i--) {
    for (let j = i + 1; j <= specs.length; j++) {
      if (!best[j]) continue;
      for (let n = 1; n <= 5; n++) {
        const row = [];
        for (let q = i; q < j; q++) row.push(at(q, n));
        if (row.some(c => !c)) continue;
        const w = row.reduce((t, c, q) => t + c.box.w + (q ? gap : 0), 0);
        if (w > avail) continue;
        const h = Math.max(...row.map(c => c.box.h)) + (best[j].rows.length ? 10 : 0) + best[j].h;
        if (!best[i] || h < best[i].h - 0.5) best[i] = {h, rows: [row, ...best[j].rows]};
        break;
      }
    }
  }
  if (!best[0]) {
    const chips = specs.map(sp => wchip(ctx, sp.text, {...sp.o, x: 0, y: 0, maxWidth: avail}));
    return flowChips(chips, avail, gap);
  }
  // spend the spare width of each row on the chips with the most lines (fewer, fuller lines)
  const rows = best[0].rows.map((rr, ri) => {
    const idx0 = best[0].rows.slice(0, ri).reduce((t, q) => t + q.length, 0);
    const row = rr.slice();
    for (let pass = 0; pass < 6; pass++) {
      const wsum = row.reduce((t, c, q) => t + c.box.w + (q ? gap : 0), 0);
      const order = row.map((c, q) => q).sort((a, b) => row[b].fit.lines.length - row[a].fit.lines.length);
      let changed = false;
      for (const q of order) {
        const n = row[q].fit.lines.length;
        if (n <= 1) continue;
        const c2 = at(idx0 + q, n - 1);
        if (c2 && wsum - row[q].box.w + c2.box.w <= avail) { row[q] = c2; changed = true; break; }
      }
      if (!changed) break;
    }
    return row;
  });
  const out = [];
  let y = 0;
  for (const rr of rows) {
    const rw = rr.reduce((q, c, i) => q + c.box.w + (i ? gap : 0), 0);
    let x = (avail - rw) / 2;
    const rh = Math.max(...rr.map(c => c.box.h));
    for (const c of rr) { out.push({c, dx: x - c.box.x, dy: y + (rh - c.box.h) / 2 - c.box.y}); x += c.box.w + gap; }
    y += rh + 10;
  }
  return {placed: out, h: Math.max(0, y - 10), rows: rows.length};
}

/** Fit a text to exactly n lines (narrowing the width) so both placards have equal line counts. */
function fitLines(text, o, n) {
  const f = fitWords(text, o);
  if (f.lines.length >= n || f.truncated) return f;
  let lo = 30, hi = o.maxWidth;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    const q = fitWords(text, {...o, maxWidth: mid, minSize: o.size});
    if (q.lines.length >= n) lo = mid; else hi = mid;
  }
  const q = fitWords(text, {...o, maxWidth: lo, minSize: o.size});
  return q.lines.length === n && !q.truncated ? q : f;
}

/** Which relationships each scene draws: A — between the two speakers; B — through the interpreter. */
const relsFor = (rels, id) => rels.map((rel, i) => ({rel, i})).filter(({rel}) => rel.from !== rel.to
  && (id === 'a' ? rel.from !== 'interpreter' && rel.to !== 'interpreter' : rel.from === 'interpreter' || rel.to === 'interpreter'));

/**
 * One scene at origin o: the bubbles beside the interpreter's head, the path of the words, and under the
 * table the relation map — the people's names (A left, the interpreter centre, B right, each under its
 * person) joined by the supplied relationships (arrow style by kind; label on or above its own arrow).
 */
function buildScene(ctx, id, o, g0, sh) {
  const p = ctx.params;
  const th = ctx.theme;
  const {k, X, crop, S, capS, capP, showAll, showKey, pw, col, map} = g0;
  const b = id === 'b';
  const problems = [];
  const stageW = (X + 132) * k;
  const Ay = o.y - sh.sceneTop;
  const Ax = o.x + (pw - stageW) / 2 + 66 * k;
  const st = interpStage(ctx, {prefix: `s${id}`, k, A: {x: Ax, y: Ay}, X, crop, actors: p.actors, withInterpreter: b, yS: YS, zI: ZI, padW: PADW, enterMode: 'seat', table: TABLE});
  const fa = st.faceBox('a'), fb = st.faceBox('b'), fi = st.faceBox('i');
  const faces = b ? [fa, fb, fi] : [fa, fb];
  const cx = st.shI.x;
  const T0 = st.table;
  // --- bubbles (identical geometry in A and B)
  const bandBottom = Math.min(fa.y, fb.y) - 10;
  const sx0 = Math.max(o.x + 4, st.Lx(-66) - 12), sx1 = fi.x - 10;
  const rx0 = fi.x + fi.w + 10, rx1 = Math.min(o.x + pw - (col ? 24 : 4), st.Lx(X + 66) + 12);
  const lS = {color: langColor(ctx, 0), glyph: LANG_GLYPHS[0]}, lD = {color: langColor(ctx, 1), glyph: LANG_GLYPHS[1]};
  const MS = measureBubble(ctx, {w: sx1 - sx0, text: p.props.utterance, tab: showAll ? p.languages.a : '', S, minS: S, maxLines: 6, tabS: capP, keepTokens: true, tabFrac: 0.95});
  const MR = measureBubble(ctx, {w: rx1 - rx0, text: p.props.rendering, tab: showAll ? p.languages.b : '', S, minS: S, maxLines: 6, tabS: capP, keepTokens: true, tabFrac: 0.95});
  if (sx1 - sx0 < 140 || rx1 - rx0 < 140) problems.push('bubble-narrow');
  if (MS.truncated || MR.truncated) problems.push('bubble-truncated');
  if ([MS, MR].some(M => M.tabText.lines.length > 1 && M.tabText.lines.some(l => l.trim().length <= 3))) problems.push('tab-orphan');
  // both bubbles have the same height (their tops align, so the path runs level above her head)
  const HB = Math.max(MS.h, MR.h);
  MS.h = HB; MR.h = HB;
  const bubS = speakBubble(ctx, {name: `${id}bubS`, x: sx0, y: bandBottom - MS.h, M: MS, tip: st.tipA, tailX: st.tipA.x + 10 * k, lang: lS, showText: showAll, tabSide: 'left'});
  const tipI = st.tipI(1);
  const bubR = speakBubble(ctx, {name: `${id}bubR`, x: rx0, y: bandBottom - MR.h, M: MR, tip: tipI, tailX: Math.max(rx0 + 30, tipI.x + 8 * k), lang: lD, showText: showAll, tabSide: 'right'});
  if (!st.tipClear(st.tipA, 'a') || st.tailHitsHead(bubS.tailBase, st.tipA, 'a', 0)) problems.push('tail-S');
  if (b && !st.tipClear(tipI, 'i')) problems.push('tail-R1');
  if (b && st.tailHitsHead(bubR.tailBase, tipI, 'i', 2)) problems.push('tail-R2');
  if (b && segHits(bubR.tailBase, tipI, fb)) problems.push('tail-R3');
  // --- the path of the words: A → straight to the listener; B → from A's bubble over her head to hers
  const yl = bubS.body.y + Math.min(14, HB * 0.2);
  const headTop = {x: fb.x + fb.w * 0.4, y: fb.y - 4};
  const path = b
    ? ribbon(ctx, {name: `${id}path`, from: {x: sx1, y: yl}, to: {x: rx0 - 2, y: yl}, c1: {x: sx1 + 20, y: yl}, c2: {x: rx0 - 20, y: yl}, color: lS.color, width: 7, conn: `${id}path`})
    : ribbon(ctx, {name: `${id}path`, from: {x: sx1, y: yl}, to: headTop, c1: {x: sx1 + 80, y: yl}, c2: {x: headTop.x - 20, y: headTop.y - 70}, color: lS.color, width: 7, conn: `${id}path`});
  if (b && path.poly.pts.some(q => q.y > fi.y - 4 && q.x > fi.x && q.x < fi.x + fi.w)) problems.push('path-face');
  // --- relation map under the table
  const top = T0.yBottom + 8;
  const rowY = top;                              // chips row right under the table (two-row form: labels below the arrows)
  const cyRow = rowY + map.chipH / 2;
  const x0 = o.x + 6, x1 = o.x + pw - (col ? 30 : 6);
  // the speakers' names at the two ends (under their seats' side), the interpreter's under her
  const chipX = map.ticks ? {a: st.Lx(0), b: st.Lx(X), interpreter: cx - map.w.interpreter / 2} : {a: x0, b: x1 - map.w.b, interpreter: cx - map.w.interpreter / 2};
  const chipMaxW = {a: map.cw.a, b: map.cw.b, interpreter: map.cw.interpreter};
  const chips = {};
  if (showKey) {
    for (const who of (b ? ['a', 'interpreter', 'b'] : ['a', 'b']).filter(w => !map.ticks || w === 'interpreter')) {
      const text = map.chipText(who);
      chips[who] = wchip(ctx, text, {x: chipX[who], y: rowY + (map.chipH - map.h[who]) / 2, anchor: 'start', maxWidth: chipMaxW[who], size: capP, minSize: capP, maxLines: 5, name: `${id}chip-${who}`, weight: 600, padX: 10});
    }
  }
  function spotX0(c) { return c - map.spotW / 2; }
  function spotX1(c) { return c + map.spotW / 2; }
  const spot = {x: cx - map.spotW / 2, y: rowY - 4, w: map.spotW, h: map.chipH + 8};
  if (chipX.a + map.w.a > spot.x - 8 || chipX.b < spot.x + spot.w + 8) problems.push('map-crowded');
  const edge = (who, side) => (who === 'a' ? chipX.a + map.w.a : who === 'b' ? chipX.b : side < 0 ? chipX.interpreter : chipX.interpreter + map.w.interpreter);
  const rels = relsFor(p.relationships, id);
  const links = rels.map(({rel, i}, j) => {
    const order = w => (w === 'a' ? 0 : w === 'interpreter' ? 1 : 2);
    const lr = order(rel.from) < order(rel.to);
    const left = lr ? rel.from : rel.to, right = lr ? rel.to : rel.from;
    const same = rels.filter(q => [q.rel.from, q.rel.to].sort().join() === [rel.from, rel.to].sort().join());
    const dy = same.length > 1 ? (same.indexOf(same.find(q => q.i === i)) ? 8 : -8) : 0;
    const xL = edge(left, 1) + 6, xR = edge(right, -1) - 6;
    // (two-row form: the arrows run low in the chips' row, right above their labels)
    const y = (map.oneRow ? cyRow : rowY + map.chipH - Math.min(5, map.chipH / 4)) + dy;
    const from = lr ? {x: xL, y} : {x: xR, y}, to = lr ? {x: xR, y} : {x: xL, y};
    const c = connector(ctx, {name: `${id}rl${i}`, from, to, kind: rel.kind, c1: {x: from.x + (to.x - from.x) * 0.33, y}, c2: {x: from.x + (to.x - from.x) * 0.67, y}, color: kindColor(ctx, rel.kind)});
    const line = c.node.children.find(ch => ch.attrs && ch.attrs.name === `${id}rl${i}-line`);
    if (line) line.attrs['data-conn'] = `${id}rl${i}`;
    if (xR - xL < (showKey ? 50 : 30)) problems.push('map-arrow-short');
    let label = null;
    if (showAll) {
      const L0 = {...map.labels[i]};
      // centred on the free part of its arrow (in B the ring around the interpreter's chip covers its ends)
      const fL = b && left === 'interpreter' ? Math.max(xL, spot.x + spot.w + 4) : xL;
      const fR = b && right === 'interpreter' ? Math.min(xR, spot.x - 4) : xR;
      // (A's link between the two speakers is labelled in the middle: inside the changed spot, or under it;
      // two-row form: the labels hang under the chips' row and step aside from the guide's drop)
      let mx = !b && left === 'a' && right === 'b' ? cx : map.oneRow ? (fL + fR) / 2 : (xL + xR) / 2;
      let lw = L0.maxW + 2;
      if (!map.oneRow) {
        const dx = g0.dropX(id, cx);
        // too wide for either side of the drop: wrap it narrower (it must still fit the labels' row)
        const side = Math.max(dx - x0, x1 - dx) - 34;
        if (L0.box.w > side) {
          lw = side;
          const q = wchip(ctx, glueTail(rel.label || rel.kind), {x: 0, y: 0, maxWidth: lw, size: capS, minSize: capS, maxLines: 4, weight: 600, padX: 8});
          if (q.fit.truncated || q.box.h > map.labelH - 10 + 0.5) problems.push('label-drop');
          L0.box = q.box;
        }
        const half = L0.box.w / 2 + 30;
        if (Math.abs(mx - dx) < half) {
          const leftOk = dx - half - L0.box.w / 2 >= x0 + 1, rightOk = dx + half + L0.box.w / 2 <= x1 - 1;
          mx = (mx <= dx && leftOk) || !rightOk ? dx - half : dx + half;
        }
        mx = Math.max(x0 + 1 + L0.box.w / 2, Math.min(x1 - 1 - L0.box.w / 2, mx));
        if (Math.abs(mx - dx) < half - 2) problems.push('label-drop');
      }
      // on its own arrow (one-row form: the arrow shows on both sides of the chip), or right above it
      const ly = map.oneRow ? cyRow - L0.box.h / 2 : rowY + map.chipH + 10;
      label = wchip(ctx, glueTail(rel.label || rel.kind), {x: mx, y: ly, anchor: 'middle', maxWidth: lw, size: capS, minSize: capS, maxLines: 4, weight: 600, padX: 8, fill: th.card, stroke: kindColor(ctx, rel.kind), color: th.ink, name: `${id}rlab${i}`});
      if (map.oneRow && label.box.w > xR - xL - 16) problems.push('map-label-wide');
    }
    return {rel, i, c, label, xL, xR};
  });
  const lbs = links.map(l => l.label).filter(Boolean);
  const insideSpot = bb => bb.x >= spot.x - 1 && bb.y >= spot.y - 1 && bb.x + bb.w <= spot.x + spot.w + 1 && bb.y + bb.h <= spot.y + spot.h + 1;
  if (lbs.some(l => !insideSpot(l.box) && overlaps(l.box, spot, 4))) problems.push('ring-label');
  for (let q = 0; q < lbs.length; q++) {
    for (let w = q + 1; w < lbs.length; w++) if (overlaps(lbs[q].box, lbs[w].box, 6)) problems.push('map-labels');
    if (lbs[q].box.x < x0 || lbs[q].box.x + lbs[q].box.w > x1) problems.push('map-label-out');
    for (const c of Object.values(chips)) if (overlaps(lbs[q].box, c.box, 4)) problems.push('map-label-chip');
  }
  const ticks = map.ticks && showKey ? ['a', 'b'].map(w => h('circle', {name: `${id}tick-${w}`, cx: r(chipX[w]), cy: r(map.oneRow ? cyRow : rowY + map.chipH - Math.min(5, map.chipH / 4)), r: 7, fill: th.ink})) : [];
  return {id, o, st, bubS, bubR, path, chips, ticks, spot, links, faces, fa, fb, fi, problems, cx, mapBottom: rowY + map.chipH + map.labelH};
}

function tryLayout(ctx, S, k, floor = 17, capSec = null, force = false) {
  // (force: the no-fit last resort — keep composing past a failed check so a complete, flagged layout comes back)
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const col = C.arr === 'column';
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  // two tiers: primary supplied text (the bubbles' words, their language tabs, the people's names) at capP;
  // secondary text (relation labels, cards, strip, guide, note, key) at capS <= capP
  const capP = Math.max(floor, Math.min(S, 22));
  const capS = Math.min(capP, capSec ?? capP);
  const problems = [];
  const pw = col ? D.w - 8 : (D.w - C.gap) / 2;
  // square boxes: at smaller scales the seats move apart to use the pane (wider bubbles)
  // (stacked boxes too: the seats use the free width, so the bubbles above them are wider and shorter)
  const X = shape === 'square' ? Math.min(560, Math.max(260, Math.floor((pw - 8) / k - 132)))
    : col ? Math.min(520, Math.max(C.X, Math.floor((pw - 60) / k - 132))) : C.X;
  const stageW = (X + 132) * k;
  if (stageW > pw - (col ? 44 : 4)) { if (!force) return {ok: false, problems: ['too-wide']}; problems.push('too-wide'); }
  const lanes = [th.accent3, th.cloth[5]];
  const crop = C.crop;
  // --- relation map geometry (the same in A and B): chips under each person, labels on / above the arrows
  const mapW = pw - 12;
  // the chips carry "Name · role" (square boxes: the speakers' names only, their roles are in the shared
  // strip; when even those leave no room for the arrows, the speakers' ends are dots right under them)
  const namesOnly = shape === 'square';
  const chipText = who => (namesOnly && who !== 'interpreter' ? p.actors[who === 'a' ? 0 : 1].name : captionOf(p, who));
  const cf = (who, maxW) => wchip(ctx, chipText(who), {x: 0, y: 0, maxWidth: maxW, size: capP, minSize: capP, maxLines: 5, weight: 600, padX: 10});
  let colW = col ? Math.min(mapW * 0.22, 300) : Math.min(mapW * 0.3, 300);
  // every chip on two lines where it can: "Name ·" over the role
  const w2 = who => {
    const name = p.actors[who === 'a' ? 0 : who === 'b' ? 1 : 2].name, role = roleOf(p, who);
    if (namesOnly && who !== 'interpreter') return Math.min(colW, Math.max(...name.split(' ').map(t => ctx.measure(t, capP, 600, 'sans'))) + 34);
    // (square boxes: the interpreter's chip may be wider so "Name ·" stays on one line)
    return Math.min(namesOnly && who === 'interpreter' ? Math.max(colW, mapW * 0.42) : colW, Math.max(120, (role ? Math.max(ctx.measure(`${name} ·`, capP, 600, 'sans'), ctx.measure(role, capP, 600, 'sans')) : ctx.measure(name, capP, 600, 'sans')) + 34));
  };
  const chipsAt = () => {
    const cmax = {a: w2('a'), b: w2('b'), interpreter: w2('interpreter')};
    return {cmax, cw: {a: cf('a', cmax.a), b: cf('b', cmax.b), interpreter: cf('interpreter', cmax.interpreter)}};
  };
  let {cmax, cw} = chipsAt();
  // long names: wider chips rather than four-line chips
  // (stacked boxes: narrower, taller chips instead, so the labels keep room on their arrows)
  if (Object.values(cw).some(c => c.fit.lines.length > 3 || c.fit.truncated)) { colW = col ? mapW * 0.22 : Math.min(mapW * 0.36, 340); ({cmax, cw} = chipsAt()); }
  const ticks = namesOnly && (cw.a.fit.truncated || cw.b.fit.truncated || cw.a.box.w + cw.b.box.w + cw.interpreter.box.w + 2 * 64 > mapW);
  // (dots at the ends: the interpreter's chip may use the room between them)
  if (ticks) { cmax.interpreter = Math.max(cmax.interpreter, Math.min(X * k - 128, 220)); cw.interpreter = cf('interpreter', cmax.interpreter); }
  if ((ticks ? [cw.interpreter] : Object.values(cw)).some(c => c.fit.truncated)) problems.push('names');
  const map = {w: {a: ticks ? 0 : cw.a.box.w, b: ticks ? 0 : cw.b.box.w, interpreter: cw.interpreter.box.w}, h: {a: ticks ? 0 : cw.a.box.h, b: ticks ? 0 : cw.b.box.h, interpreter: cw.interpreter.box.h}, cw: cmax, chipText, ticks};
  map.chipH = showKey ? Math.max(...Object.values(map.h)) : capS * 1.6;
  // the room between neighbouring chips (the arrows) at this scale
  const hipA = (pw - stageW) / 2 + 66 * k, hipB = hipA + X * k, cxs = hipA + X / 2 * k;
  const spotW0 = Math.max(showKey ? map.w.interpreter : 120, 120) + 14;
  const ax = ticks ? hipA : 6 + map.w.a, bx = ticks ? hipB : pw - (col ? 30 : 6) - map.w.b;
  const ix0 = cxs - map.w.interpreter / 2, ix1 = cxs + map.w.interpreter / 2;
  const gapAB = bx - ax - 12;
  // in B the equal ring reaches past the interpreter's chip by as much as A's middle label is wider
  const aRel = p.relationships.find(q => q.from !== 'interpreter' && q.to !== 'interpreter' && q.from !== q.to);
  // (A's middle label wraps to the width of the interpreter's chip when it can, so the rings stay tight)
  const aMax = aRel ? Math.min(gapAB - 36, Math.max(map.w.interpreter, Math.max(...String(glueTail(aRel.label || aRel.kind)).split(' ').map(t => ctx.measure(t, capS, 600, 'sans'))) + 18)) : 0;
  const aOn = showAll && aRel ? wchip(ctx, glueTail(aRel.label || aRel.kind), {x: 0, y: 0, maxWidth: Math.max(60, aMax), size: capS, minSize: capS, maxLines: 3, weight: 600, padX: 8}) : null;
  const ringOver = Math.max(7, aOn ? (aOn.box.w + 14 - map.w.interpreter) / 2 : 7) + 6;
  const gapAI = ix0 - ringOver - ax - 12, gapIB = bx - (ix1 + ringOver) - 12;
  map.labels = {};
  let oneRow = true, labelH = 0;
  if (showAll) {
    for (const [i, rel] of p.relationships.entries()) {
      const viaI = rel.from === 'interpreter' || rel.to === 'interpreter';
      const pair = [rel.from, rel.to].sort().join('|');
      const room = !viaI ? gapAB : pair === 'a|interpreter' ? gapAI : gapIB;
      // one-row form: the label sits on its arrow and leaves some arrow visible on both sides
      const on = wchip(ctx, glueTail(rel.label || rel.kind), {x: 0, y: 0, maxWidth: Math.max(60, rel === aRel ? aMax : room - 36), size: capS, minSize: capS, maxLines: 4, weight: 600, padX: 8});
      const above = wchip(ctx, glueTail(rel.label || rel.kind), {x: 0, y: 0, maxWidth: Math.min(Math.max(120, room + 100, pw * 0.4), pw / 2 - 40), size: capS, minSize: capS, maxLines: 3, weight: 600, padX: 8});
      map.labels[i] = {on, above};
      // (a glued group — "Listened\u00a0to" — never splits: too little room on the arrow means the label hangs)
      const tokW = tokenWidth(ctx, rel.label || rel.kind, capS, 600) + 18;
      if (on.fit.truncated || on.box.w > room - 36 || (rel !== aRel && tokW > room - 36)) oneRow = false;
    }
    for (const [i] of p.relationships.entries()) {
      const L0 = oneRow ? map.labels[i].on : map.labels[i].above;
      if (L0.fit.truncated) problems.push('rel-label');
      map.labels[i] = {box: L0.box, maxW: L0.fit.width + (L0.box.w - L0.fit.width)};
      labelH = Math.max(labelH, L0.box.h);
    }
  }
  map.oneRow = oneRow;
  // one-row form: the chips' row is as tall as the tallest label sitting on an arrow
  if (oneRow && showAll) map.chipH = Math.max(map.chipH, labelH);
  map.labelH = showAll && !oneRow ? labelH + 10 : 0;
  // equal changed spots: wide enough for the interpreter's chip (B) and A's middle label
  const aLab = p.relationships.findIndex(q => q.from !== 'interpreter' && q.to !== 'interpreter' && q.from !== q.to);
  // (two-row form: A's label hangs under the middle of its arrow, so the spot is wide enough for the guide to
  // drop from its inner end clear of that label)
  map.spotW = Math.max((showKey ? map.w.interpreter : 120) + 14, showAll && aLab >= 0 && oneRow ? map.labels[aLab].box.w + 14 : 0);
  const mapH = 8 + map.labelH + map.chipH + 6;
  // --- scenario cards on top of each scene (badge + "label · caption"): the same size and line counts in A and B
  // side by side: card A left of A's changed spot, card B right of B's (the guide drops between them)
  // the guide drops from the inner end of each changed spot (A: its right end, B: its left end)
  const dropIn = map.spotW / 2 - 18;
  const below = shape === 'square';
  const xaC = cxs + (below ? 0 : dropIn), xbC = pw + C.gap + cxs - (below ? 0 : dropIn);
  // square boxes: the cards sit in their own row under the guide label (each under its scene)
  // stacked: each card at the left, clear of the guide's drop (card B shares the gap row with the guide label)
  const cardMax = col ? 4 + xaC - 26 - 8 : below ? pw - 12 : Math.min(xaC - 26 - 8, D.w - 8 - (xbC + 26));
  // (the scenario cards: secondary tier, like the other cards and strip notes)
  const capC = capS;
  const bR = Math.max(15, capC * 0.75);
  const tw = cardMax - bR * 2 - 40;
  const cardText = sc0 => (showAll && sc0.caption ? `${sc0.label} · ${sc0.caption}` : sc0.label);
  const lab0 = {maxWidth: tw, size: capC, minSize: capC, maxLines: shape === 'square' ? 5 : 3, weight: 600};
  let la = fitWords(cardText(p.scenarioA), lab0), lb = fitWords(cardText(p.scenarioB), lab0);
  const nL = Math.max(la.lines.length, lb.lines.length);
  la = fitLines(cardText(p.scenarioA), lab0, nL); lb = fitLines(cardText(p.scenarioB), lab0, nL);
  if ([la, lb].some(f => f.truncated) || la.lines.length !== lb.lines.length) problems.push(`cards(${Math.round(cardMax)})`);
  const cW = Math.min(cardMax, bR * 2 + 40 + (showKey ? Math.max(la.width, lb.width) : 0));
  const cH = Math.max(bR * 2 + 12, (showKey ? la.height : 0) + 20);
  const makeCard = (id, i, x, y) => {
    const lab = id === 'a' ? la : lb;
    return g({name: `hdr${id}`, 'data-card': 1},
      h('path', {d: roundRectPath(r(x), r(y), r(cW), r(cH), 12), fill: th.card, stroke: lanes[i], 'stroke-width': 3}),
      h('circle', {cx: r(x + 12 + bR), cy: r(y + cH / 2), r: r(bR), fill: lanes[i], stroke: th.ink, 'stroke-width': 2.5}),
      showKey ? textBlock(fitWords(id.toUpperCase(), {maxWidth: bR * 2, size: bR * 1.1, minSize: bR * 1.1, maxLines: 1, weight: 800}), {x: x + 12 + bR, y: y + cH / 2 - bR * 0.48, anchor: 'middle', fill: '#fff'}) : null,
      showKey ? g({name: `hdrl${id}`, opacity: 0}, textBlock(lab, {x: x + bR * 2 + 26, y: y + (cH - lab.height) / 2, fill: th.ink})) : null);
  };
  // --- shared strip: shared facts and the changed fact (side by side: the neutral note and the key sit in the guide row)
  const specs = [];
  const so = (name, extra = {}) => ({size: capS, minSize: capS, maxLines: 3, name, ...extra});
  // the people's names and roles are on their chips in the relation maps (the same in A and B)
  const sharedList = [...(shape === 'square' ? [captionOf(p, 'a'), captionOf(p, 'b')] : []), ...p.sharedFacts];
  if (ticks && !showAll && showKey) specs.push({text: `${captionOf(p, 'a')} · ${captionOf(p, 'b')}`, o: so('shared', {weight: 600, fill: th.card, stroke: th.inkSoft, color: th.ink})});
  if (showAll && sharedList.length) specs.push({text: `${ctx.t.shared}: ${sharedList.join(' · ')}`, o: so('shared', {weight: 500, fill: th.paperShade, stroke: th.inkSoft, color: th.ink, maxLines: 5})});
  if (showAll) specs.push({text: `${ctx.t.changed}: ${p.changedFact}`, o: so('changed', {weight: 700, fill: th.card, stroke: th.accent, color: th.ink})});
  // square boxes: the neutral note and the key flank the guide label in its row
  const flankL = xaC - 8 - 24, flankR = D.w - 8 - (xbC + 24);
  const flanks = [];
  if (below && Math.min(flankL, flankR) >= 240) {
    if (showAll) flanks.push(wchip(ctx, p.comparisonLabels.neutral, {x: 8, y: 0, maxWidth: flankL, size: capS, minSize: capS, maxLines: 5, weight: 500, fill: th.card, stroke: th.inkSoft, color: th.ink, name: 'neutral'}));
    if (showKey) flanks.push(wchip(ctx, ctx.t.key, {x: D.w - 8, y: 0, anchor: 'end', maxWidth: flankR, size: capS, minSize: capS, maxLines: 4, weight: 600, fill: th.card, stroke: th.inkSoft, color: th.ink, name: 'key'}));
    if (flanks.some(c => c.fit.truncated)) problems.push('flank-truncated');
  } else {
    if (showAll) specs.push({text: p.comparisonLabels.neutral, o: so('neutral', {weight: 500, fill: th.card, stroke: th.inkSoft, color: th.ink, maxLines: 4})});
    if (showKey) specs.push({text: ctx.t.key, o: so('key', {weight: 600, fill: th.card, stroke: th.inkSoft, color: th.ink})});
  }
  const flankH = Math.max(0, ...flanks.map(c => c.box.h));
  const strip = packStrip(ctx, specs, D.w - 16);
  const stripItems = strip.placed.map(q => q.c);
  if (stripItems.length !== specs.length || stripItems.some(c => c.fit.truncated)) problems.push('strip-truncated');
  // stacked: the label sits on the level run between the drop from A's spot and the lane at the right margin
  const guideMax = col ? (D.w - 10) - (4 + cxs + dropIn) - 44 : xbC - xaC - 90;
  let guide0 = showAll ? wchip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: Math.min(guideMax, 520), size: capS, minSize: capS, maxLines: 4, weight: 700}) : null;
  // (square boxes: a label that would wrap between the drops spans them instead; the drops enter its top)
  let guideWide = false, guidePad;
  if (below && guide0 && guide0.fit.lines.length > 1) {
    let wide = wchip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: D.w - 24, size: capS, minSize: capS, maxLines: 4, weight: 700});
    const need = xbC - xaC + 60;
    if (wide.box.w < need) wide = wchip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: D.w - 24, size: capS, minSize: capS, maxLines: 4, weight: 700, padX: (need - wide.fit.width) / 2 + 1});
    if (wide.fit.lines.length < guide0.fit.lines.length && wide.box.w <= D.w - 16) { guide0 = wide; guideWide = true; guidePad = Math.max(capS * 0.6, (need - wide.fit.width) / 2 + 1); }
  }
  if (guide0 && guide0.fit.truncated) problems.push('guide-truncated');
  if (problems.length && !force) return {ok: false, problems};

  // --- probe both scenes for the vertical extent
  const g0 = {k, X, crop, S, capS, capP, showAll, showKey, pw, col, map,
    // (square boxes: the drops leave the spots' middles; the relation labels hang beside them)
    dropX: (id, cx) => (below ? cx : cx + (col || id === 'a' ? 1 : -1) * dropIn)};
  const pa = buildScene(ctx, 'a', {x: 0, y: 0}, g0, {sceneTop: 0});
  const pb = buildScene(ctx, 'b', {x: 0, y: 0}, g0, {sceneTop: 0});
  problems.push(...pa.problems, ...pb.problems);
  if (problems.length && !force) return {ok: false, problems};
  const sceneTop = Math.min(pa.bubS.box.y, pb.bubR.box.y, ...pa.path.poly.pts.map(q => q.y)) - 6;
  const sceneH = pa.st.table.yBottom - sceneTop + mapH;
  const guideH = guide0 ? guide0.box.h : 24;
  // (square, two text tiers: the guide row's gaps are a little tighter)
  const rg = capS < capP ? 9 : 12;
  const rowH = col ? 0 : below ? rg + Math.max(guideH, flankH) + rg + cH + (rg - 3) : Math.max(guideH, cH) + 20;
  const stripH = strip.h ? strip.h + 10 : 0;
  const gapCol = col ? Math.max(guideH, cH) + 26 : 0;
  const cardBand = cH + 10;
  const totalH = col ? cardBand + sceneH * 2 + gapCol + 48 + stripH : sceneH + rowH + stripH;
  if (totalH > D.h - 12 && !force) return {ok: false, problems: [`too-tall(${Math.round(totalH)}=bub${Math.round(Math.max(pa.bubS.box.h, pb.bubR.box.h))}+sc${Math.round(sceneH - mapH)}+map${Math.round(mapH)}+card${Math.round(cardBand)}+row${Math.round(rowH)}+strip${Math.round(stripH)})`]};
  const y0 = 6 + (D.h - 12 - totalH) / 2;
  const origins = col ? [{x: 4, y: y0 + cardBand}, {x: 4, y: y0 + cardBand + sceneH + gapCol}] : [{x: 0, y: y0}, {x: pw + C.gap, y: y0}];
  const scenes = ['a', 'b'].map((id, i) => {
    const sc = buildScene(ctx, id, origins[i], g0, {sceneTop});
    problems.push(...sc.problems);
    const card = col ? (id === 'a' ? {x: 8, y: origins[i].y - cardBand} : {x: 8, y: origins[0].y + sceneH + (gapCol - cH) / 2})
      : below ? {x: origins[i].x + (pw - cW) / 2, y: sc.mapBottom + rg + Math.max(guideH, flankH) + rg}
        : {x: id === 'a' ? sc.cx + dropIn - 26 - cW : sc.cx - dropIn + 26, y: sc.mapBottom + 12 + (rowH - 20 - cH) / 2};
    const header = makeCard(id, i, card.x, card.y);
    const track = [];
    if (id === 'b') {
      const lift1 = q => ({x: q.x + 6 * k, y: q.y - 10 * k});
      W.strokes.forEach(([a, bb], j) => {
        const poly = sc.st.strokes[j];
        const from = j === 0 ? a - 0.03 : W.strokes[j - 1][1] + 0.003;
        track.push({a: from, b: a - 0.004, to: lift1(poly.at(0)), ease: ease.inOutSine});
        track.push({a: a - 0.004, b: a, to: poly.at(0), ease: ease.inOutSine});
        track.push({a, b: bb, at: u => poly.at(ease.inOutSine(seg(u, a, bb)))});
        track.push({a: bb, b: bb + 0.003, to: lift1(poly.at(1)), ease: ease.inOutSine});
      });
      track.push({a: W.penBack[0], b: W.penBack[1], to: sc.st.rest.nibI, ease: ease.inOutSine});
      for (const j of [0, 1]) for (let q = 0; q <= 1.0001; q += 0.25) if (!sc.st.pose({a: {}, b: {}, i: {nib: sc.st.strokes[j].at(q)}}).semantic.allReached) problems.push('reach');
    }
    // the card never covers the scene (its bubbles and path start below it)
    return {...sc, header, card: {...card, w: cW, h: cH}, track, lane: lanes[i]};
  });
  const [sa, sb] = scenes;
  // --- guide: from the bottom of each changed spot down into the guide row, joined through the label;
  // the neutral note and the key sit at the two ends of that row
  let gpts, guideNode = null, rowNodes = [];
  if (!col) {
    // straight down from each changed spot, then level into the two sides of the guide label
    // the drops leave the spots where they cross no relation label (below-cards boxes may use any point)
    const xa = g0.dropX('a', sa.cx), xb = g0.dropX('b', sb.cx);
    const rowMid = below ? sa.mapBottom + rg + Math.max(guideH, flankH) / 2 : sa.mapBottom + 12 + (rowH - 20) / 2;
    for (const c of flanks) rowNodes.push({node: g({transform: T(0, rowMid - c.box.h / 2)}, c.node), box: {...c.box, y: rowMid - c.box.h / 2}});
    if (guide0) guideNode = wchip(ctx, p.comparisonLabels.guide, {x: (xa + xb) / 2, y: rowMid - guide0.box.h / 2, anchor: 'middle', maxWidth: guide0.box.w + 2, padX: guideWide ? guidePad : undefined, size: capS, minSize: capS, maxLines: 4, weight: 700, fill: th.card, stroke: th.accent, color: th.ink, name: 'guide-chip'});
    const gx0 = guideNode ? guideNode.box.x : (xa + xb) / 2, gx1 = guideNode ? guideNode.box.x + guideNode.box.w : (xa + xb) / 2;
    gpts = [{x: xa, y: sa.spot.y + sa.spot.h + 5}, {x: xa, y: rowMid}, {x: gx0, y: rowMid}, {x: gx1, y: rowMid}, {x: xb, y: rowMid}, {x: xb, y: sb.spot.y + sb.spot.h + 5}];
    if (guideWide) gpts = [{x: xa, y: sa.spot.y + sa.spot.h + 5}, {x: xa, y: rowMid}, {x: xb, y: rowMid}, {x: xb, y: sb.spot.y + sb.spot.h + 5}];
    if (guideNode && !guideWide && (gx0 < xa + 30 || gx1 > xb - 30)) problems.push('guide-chip-room');
    if (guideNode && guideWide && (gx0 > xa - 30 || gx1 < xb + 30)) problems.push('guide-chip-room');
  } else {
    const xm = D.w - 10;
    const ya = origins[0].y + sceneH + gapCol / 2;
    const yb = sb.mapBottom + 26;
    const xa = g0.dropX('a', sa.cx), xb = g0.dropX('b', sb.cx);
    gpts = [{x: xa, y: sa.spot.y + sa.spot.h + 5}, {x: xa, y: ya}, {x: xm, y: ya}, {x: xm, y: yb}, {x: xb, y: yb}, {x: xb, y: sb.spot.y + sb.spot.h + 5}];
    if (guide0) guideNode = wchip(ctx, p.comparisonLabels.guide, {x: (xa + xm) / 2, y: ya - guide0.box.h / 2, anchor: 'middle', maxWidth: guide0.box.w + 2, size: capS, minSize: capS, maxLines: 4, weight: 700, fill: th.card, stroke: th.accent, color: th.ink, name: 'guide-chip'});
    if (sb.bubR.box.x + sb.bubR.box.w > xm - 8 || sb.st.Lx(X + 70) > xm - 6 || sb.card.x + sb.card.w > xm - 6 || Object.values(sb.chips).some(c => c.box.x + c.box.w > xm - 8)) problems.push('guide-lane');
    if (guideNode && (overlaps(guideNode.box, sb.card, 6) || guideNode.box.x < xa + 12)) problems.push('guide-card');
  }
  // the guide crosses no relation label or name chip, and runs along no chip border
  const inside = (bb, sp) => bb.x >= sp.x - 1 && bb.y >= sp.y - 1 && bb.x + bb.w <= sp.x + sp.w + 1 && bb.y + bb.h <= sp.y + sp.h + 1;
  const stripY0 = col ? sb.mapBottom + 52 : sa.mapBottom + rowH;
  const stripBoxes = strip.placed.map(({c, dx, dy}) => ({x: c.box.x + 8 + dx, y: c.box.y + stripY0 + dy, w: c.box.w, h: c.box.h}));
  const segBoxes0 = scenes.flatMap(sc => [...sc.links.map(l => l.label && l.label.box).filter(Boolean), ...Object.values(sc.chips).map(c => c.box)].filter(bb => !inside(bb, sc.spot)).concat([sc.card]));
  const segBoxes = [...segBoxes0, ...stripBoxes, ...rowNodes.map(n => n.box)];
  for (let q = 0; q + 1 < gpts.length; q++) {
    const a0 = gpts[q], a1 = gpts[q + 1];
    const bx = {x: Math.min(a0.x, a1.x) - 1, y: Math.min(a0.y, a1.y) - 1, w: Math.abs(a1.x - a0.x) + 2, h: Math.abs(a1.y - a0.y) + 2};
    if (segBoxes.some(b0 => overlaps(bx, b0, 12))) { problems.push('guide-cross'); break; }
  }
  const guidePoly = polyline(gpts);
  const guideLine = h('path', {name: 'guide', 'data-conn': 'guide', 'data-guide': 1, d: guidePoly.d(1), fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(guidePoly.total)} ${r(guidePoly.total + 10)}`, 'stroke-dashoffset': r(guidePoly.total)});
  const ringNodes = scenes.map(s => h('path', {name: `ring${s.id}`, d: roundRectPath(r(s.spot.x), r(s.spot.y), r(s.spot.w), r(s.spot.h), 12), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '10 7', opacity: 0}));
  const stripY = col ? sb.mapBottom + 52 : sa.mapBottom + rowH;
  const stripNodes = strip.placed.map(({c, dx, dy}) => g({transform: T(8 + dx, stripY + dy)}, c.node));
  if (stripY + strip.h > D.h - 4) problems.push('strip-overflow');
  const vc = ctx.view.content;
  const fitK = Math.min(vc.w / D.w, vc.h / D.h);
  // the share of the frame width each scene (its pane: people, bubbles and relation map) takes
  const stageFrac = (pw * fitK) / ctx.view.width;
  const vFill = Math.min(1, totalH / D.h);
  const sizes = [la.size, capS, ...stripItems.map(c => c.fit.size), S];
  return {ok: problems.length === 0, problems, S, k, capP, capS, col, scenes, stripNames: [...stripItems, ...flanks].map(c => c.node.attrs.name), guideLine, guidePoly, guideNode, ringNodes, stripNodes, rowNodes,
    stageFrac, vFill, contentMin: Math.min(...sizes), headerLines: [la.lines.length, lb.lines.length, la.lines.length, lb.lines.length]};
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const tries = [];
    let best = null;
    const attempt = (S, k, floor, capSec = null) => {
      const L = tryLayout(ctx, S, k, floor, capSec);
      if (!L.ok) tries.push(`${S}/${r(k)}:${L.problems.join('+')}`);
      return L.ok ? L : null;
    };
    // (every pass searches the scale in coarse steps, then tries one finer step up from the scale it found)
    const pass = (kHi, kLo, Ss, kOuter) => {
      let found = null, kF = null;
      const sList = [...Ss];
      if (kOuter) {
        for (let k = kHi; k >= kLo - 0.04 - 1e-6 && !found; k -= 0.04) {
          const kk = Math.max(k, kLo);
          for (const S of sList) { found = attempt(S, kk, Math.min(17, S)); if (found) { kF = kk; break; } }
        }
      } else {
        for (const S of sList) {
          for (let k = kHi; k >= kLo - 0.04 - 1e-6 && !found; k -= 0.04) { const kk = Math.max(k, kLo); found = attempt(S, kk, Math.min(17, S)); if (found) kF = kk; }
          if (found) break;
        }
      }
      if (found && kF + 0.02 <= kHi + 1e-6) {
        for (const S of sList) { if (S < found.S && !kOuter) break; const L = attempt(S, kF + 0.02, Math.min(17, S)); if (L) { found = L; break; } }
      }
      return found;
    };
    const range = (a, b) => Array.from({length: Math.round(a - b) + 1}, (_, i) => a - i);
    // 1) baseline text (≥ 20 px) with the figures at least at their floor size (heads as large as LAW-0163's):
    //    the largest figures first, then the largest text
    best = pass(C.kMax, C.kMin, range(C.size, 20), true);
    // 1b) square boxes (coordinator decision 2026-09-26): primary text (the bubbles' words, the language tabs,
    //     the people's names) stays >= 20 px; the secondary text (scenario cards, relation labels, strip,
    //     guide, note, key) may go to 18 px
    if (!best && ctx.view.shape === 'square') {
      for (const T of [19, 18]) {
        const ks = [];
        for (let k = C.kMax; k > C.kMin + 1e-6; k -= 0.02) ks.push(k);
        ks.push(C.kMin);
        for (const k of ks) {
          if (best) break;
          for (const S of range(C.size, 20)) { const L = tryLayout(ctx, S, k, 17, T); if (L.ok) { best = L; break; } tries.push(`${S}/${T}/${r(k)}:${L.problems.join("+")}`); }
        }
        if (best) break;
      }
    }
    // 2) smaller text with the figures still at their floor size
    if (!best) best = pass(C.kMax, C.kMin, range(19, 16), false);
    // 3) long supplied text: below the floor size, the largest figures first, then the largest text
    if (!best) best = pass(C.kMin - 0.02, C.kStress, range(19, 16), true);
    if (best) return {...best, tries: tries.slice(-12)};
    // DOM-less contract (AUTHORING 2026-09-27): never throw from layout. Nothing fits (only seen with the fallback text
    // estimator, no DOM): the smallest text and figures, composed past the failed checks, flagged in semantic.problems
    for (const k of [C.kStress, C.kMin]) {
      for (const S of [16, 17, 18, 19]) {
        let L = null;
        try { L = tryLayout(ctx, S, k, 16, null, true); } catch (e) { tries.push(`${S}/${r(k)}:threw(${e.message})`); }
        if (L && L.scenes) return {...L, ok: false, forced: true, problems: [...new Set(['no-layout-fits', ...L.problems])], tries: tries.slice(-12)};
      }
    }
    throw new Error(`${ID}: no layout fits (${tries.slice(-8).join(' | ')})`);
  },
  build(ctx, L) {
    return g(null,
      L.scenes.map(s => g({name: `scene${s.id}`},
        s.st.node,
        s.header,
        Object.values(s.chips).map(c => c.node),
        s.bubS.node,
        s.id === 'b' ? s.bubR.node : null,
        s.path.node,
        s.links.map(ln => ln.c.node),
        s.ticks,
        s.links.map(ln => ln.label && g({'data-rel-label': `${s.id}rl${ln.i}`}, ln.label.node)))),
      L.ringNodes,
      L.guideLine,
      L.guideNode && g({'data-rel-label': 'guide'}, L.guideNode.node),
      L.stripNodes,
      L.rowNodes.map(n => n.node),
    );
  },
  frame(ctx, L, u, timeMs) {
    const reduced = ctx.reduced;
    const x = w => seg(u, w[0], w[1]);
    const nodes = {};
    const sem = {};
    let allReached = true;
    const looks = {};
    for (const s of L.scenes) {
      const st = s.st;
      const b = s.id === 'b';
      const lean = 6 * ease.inOutSine(x(W.lean)) * (1 - ease.inOutSine(x(W.unlean)));
      const talkS = u > W.talkS[0] && u < W.talkS[1] ? 1 : 0;
      const gest = ease.inOutSine(x(W.gest)) * (1 - ease.inOutSine(x(W.ungest)));
      const wave = reduced ? 0 : Math.sin(timeMs * 0.009) * 8 * st.k;
      const near = mix(st.rest.nearA, {x: st.rest.gestureA.x, y: st.rest.gestureA.y + wave * gest}, gest);
      const openS = x(W.bubS);
      const turn = ease.inOutSine(x(b ? W.bTurn : W.aTurn));
      let pose;
      let openR = 0, talkI = 0, enter = 0, notes = [0, 0];
      const linkP = {};
      if (b) {
        enter = x(W.enter);
        const toDst = ease.inOutSine(x(W.turnDst));
        const toSrc = ease.inOutSine(x(W.turnSrc)) * (1 - toDst);
        notes = W.strokes.map(w => ease.inOutSine(x(w)));
        const nib = runTrack(u, st.rest.nibI, s.track);
        openR = x(W.bubR);
        talkI = u > W.talkI[0] && u < W.talkI[1] ? 1 : 0;
        pose = st.pose({
          a: {near, lean, mouth: talkS * flap(timeMs, reduced, 0)},
          b: {lean: 4 * turn, tilt: -10 * turn},
          i: {enter, nib, tilt: 9 * (-toSrc + toDst), look: -toSrc + toDst, mouth: talkI * flap(timeMs, reduced, 0.7)},
          notes,
        });
        Object.assign(nodes, s.bubR.frame(openR, reduced));
        sem.noteTarget = W.strokes.some(w => u >= w[0] && u <= w[1]) ? {x: r(nib.x), y: r(nib.y)} : null;
      } else {
        pose = st.pose({a: {near, lean, mouth: talkS * flap(timeMs, reduced, 0)}, b: {lean: 4 * turn, tilt: -10 * turn}, notes: [0, 0, 0]});
      }
      Object.assign(nodes, pose.nodes);
      Object.assign(nodes, s.bubS.frame(openS, reduced));
      // the path of the words and the relation map: in A with the words; in B first A's words → her
      // rendering, then hers → the listener
      const pathP = ease.inOutSine(x(b ? W.bLink1 : W.aLink));
      Object.assign(nodes, s.path.frame(pathP));
      s.links.forEach(ln => {
        const pair = [ln.rel.from, ln.rel.to].sort().join('|');
        const w = !b ? W.aLink : pair === 'a|interpreter' ? W.bLink1 : W.bLink2;
        const pr = ease.inOutSine(x(w));
        linkP[pair] = r(pr, 3);
        Object.assign(nodes, ln.c.frame(pr, pr > 0 ? 1 : 0));
        if (ln.label) nodes[`${s.id}rlab${ln.i}`] = {opacity: r(clamp((pr - 0.55) / 0.45), 3)};
      });
      if (b && s.chips.interpreter) nodes['bchip-interpreter'] = {opacity: r(x(W.iChip), 3)};
      if (ctx.show('key')) nodes[`hdrl${s.id}`] = {opacity: r(x(W.labels), 3)};
      nodes[`ring${s.id}`] = {opacity: r(x(W.rings), 3)};
      allReached = allReached && pose.semantic.allReached;
      const ps = pose.semantic;
      sem[s.id] = {bubbleS: r(openS, 3), ribbon: r(pathP, 3), links: linkP, dstTurned: r(turn, 3), rendering: r(openR, 3), entered: r(enter, 3), interpreterOpaque: b ? (enter > 0 ? 1 : 0) : 0, notes: notes.map(v => r(v, 3)), speakingS: talkS > 0, speakingI: talkI > 0};
      if (b) Object.assign(sem, {handIL: ps.handIL, handIR: ps.handIR, pen: ps.pen});
      sem[`handA${s.id}`] = ps.handA; sem[`farA${s.id}`] = ps.farA; sem[`handB${s.id}`] = ps.handB;
      looks[s.id] = {bubbleS: r(openS, 3), rendering: r(openR, 3), interpreter: r(enter, 3), notes: notes.map(v => r(v, 3)), turned: r(turn, 3), talking: talkS > 0, ring: r(x(W.rings), 3), anyLink: Object.values(linkP).some(v => v > 0)};
    }
    const gp = ease.inOutSine(x(W.guide));
    nodes.guide = {'stroke-dashoffset': r(L.guidePoly.total * (1 - gp))};
    if (L.guideNode) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) / 0.5), 3)};
    const stripP = x(W.strip);
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    for (const n of L.stripNames) if (n !== 'names') nodes[n] = {opacity: r(n === 'key' ? x(W.key) : stripP, 3)};
    const [sa, sb] = L.scenes;
    const iBox = sb.st.interpBox();
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        lookA: looks.a, lookB: looks.b,
        allReached,
        guideProgress: r(gp, 3), ringsShown: r(x(W.rings), 3), stripShown: r(stripP, 3), keyShown: r(x(W.key), 3),
        changedFact: ctx.params.changedFact,
        arrangement: L.col ? 'column' : 'row',
        sceneFrac: r(L.stageFrac, 3), stageFrac: r(L.stageFrac, 3), vFill: r(L.vFill, 3),
        ...(L.forced ? {problems: L.problems} : {}),
        labelsFit: L.ok, layoutTries: L.tries, textSize: L.S, primaryText: L.capP, secondaryText: L.capS, scale: r(L.k, 2),
        contentMin: r(L.contentMin, 1),
        headerLines: L.headerLines,
        ringsEqual: Math.abs(sa.spot.w - sb.spot.w) < 0.5 && Math.abs(sa.spot.h - sb.spot.h) < 0.5,
        relationsShown: {a: sa.links.map(ln => `${ln.rel.from}>${ln.rel.to}:${ln.rel.kind}`), b: sb.links.map(ln => `${ln.rel.from}>${ln.rel.to}:${ln.rel.kind}`)},
        partiesSameSize: sa.st.k === sb.st.k,
        relationsDrawn: {a: sa.links.map(ln => ln.rel.label || ln.rel.kind), b: sb.links.map(ln => ln.rel.label || ln.rel.kind)},
        iChipGap: sb.chips.interpreter ? r(Math.max(0, sb.chips.interpreter.box.y - sb.st.table.yBottom), 1) : null,
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.1.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-06-contrast',
    title: 'Language interpretation — direct and interpreted communication side by side',
    titleEs: 'Interpretación lingüística — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Interpretación lingüística',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical tables with the same two speakers and the same first words. One fact differs: in A the words go straight to the listener; in B an interpreter is at the table, listens, takes notes and gives the supplied rendering in her own bubble. The supplied relationships are drawn as labelled links (A: between the speakers; B: through the interpreter). Equal outlines on the one changed spot of each table front are joined by a guide; shared facts, the changed fact and a neutral note are drawn once. No ranking, no outcome; nothing states that a rendering is accurate or valid.',
    tags: ['interpreter', 'direct communication', 'interpreted communication', 'comparison', 'speech bubble', 'relationships', 'table', 'notepad'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/interpretacion-linguistica.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/animations/roles/kits/entrevista-a-cliente.js', 'src/animations/roles/kits/mediation-table.js', 'src/frameworks/graph.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
