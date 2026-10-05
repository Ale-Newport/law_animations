/**
 * LAW-0127 — Definición legislativa · contrast
 *
 * Storyboard (two complete desks, identical except ONE fact: what the term
 * is linked to; brief beats in brackets):
 *  [0.00–0.15] base: the same desk twice — article extract with the term,
 *              the full text lying closed with its hierarchy flags, a note
 *              card (another source) lying face down, a lens and two pins.
 *              In both, the left hand brings the lens to the term and marks
 *              it. A footer lists the shared facts.
 *  [0.15–0.34] change: A — the right hand opens the book at the flag of the
 *              level that holds the definitions (the definition supplied in
 *              another section appears); B — the right hand turns the note
 *              card over (an ordinary use PROPOSED by a named, fictional
 *              source appears; the book stays closed). The changed fact is
 *              named in the footer.
 *  [0.34–0.66] parallel: in both, the lens is parked and the pins carried;
 *              A's cord runs across into the other section of the book, B's
 *              cord runs a short way down to the note card. Geometry and
 *              sequence differ; nothing else does.
 *  [0.66–0.85] guide (then a ~1.2 s hold of the complete state): each desk's result appears as a callout attached where its
 *              cord ends (A: the entry on the definitions page — definition linked, as
 *              supplied; B: the note card — ordinary use proposed, attributed); a guide
 *              joins the two callouts to the changed-fact label; a neutral note — no
 *              reading is endorsed, no winner, no outcome.
 * Layout (review B007 rounds 2–3): the desks are the subject — side by side on wide and square
 * frames (each >= 40% / ~45% of the frame width, using part of the side margins), stacked on tall
 * frames (each >= 75% of the width); the long-labels stress preset shrinks them to make room.
 * No supplied text is drawn as bars: the elements identical in A and B (article reference, level,
 * heading and clause with the term; the full text's name and its hierarchy) are one compact strip
 * of real text above the desks; the callouts carry the definition and the proposal at one size
 * (>= 16.5 px on a 1080p frame). A callout lies on its desk's free corner when that is wide enough,
 * else it hangs from the desk's bottom edge; it never covers the extract, the book or the note
 * card. The desks' documents are muted props; the cord is >= 4 px on the frame.
 * @module animations/sources/LAW-0127
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {FONTS} from '../../core/text.js';
import {definitionDesk, STAGE, PAIR_ZONE, sourcesFields, kitStrings, KIT_STRINGS, readablePage, noteDoc, levelIndex, levelColor, linkColor, fullFit, pageMarks} from './kits/definicion-legislativa.js';
import {roundRectPath} from '../../core/geometry.js';

const ID = 'LAW-0127';
const DURATION = 8000;
// (review round 4: the action ends by u 0.70, the callouts, guide and notes are complete by u 0.85;
// the complete final state then holds ~1.2 s at the default duration)
const BEATS = {base: [0, 0.146], change: [0.146, 0.343], parallel: [0.343, 0.66], guide: [0.66, 1]};
const W = {
  lEnter: [0.01, 0.06], lensMove: [0.06, 0.116], mark: [0.111, 0.146],
  rEnter: [0.154, 0.21], open: [0.214, 0.309], rOut: [0.287, 0.36],
  lensPark: [0.343, 0.394], pinsTake: [0.394, 0.429], pinA: [0.429, 0.484], carry: [0.489, 0.6], dockHl: [0.591, 0.634], lOut: [0.6, 0.703],
  shared: [0.03, 0.1], changed: [0.17, 0.23], callout: [0.68, 0.74], tags: [0.72, 0.77], guide: [0.74, 0.8], neutral: [0.8, 0.85],
};

const sceneSchema = {...sourcesFields, ...contrastFields()};
sceneSchema.interpretations.description = 'Readings attributed to fictional sources: [0] is the ordinary use proposed on scenario B\'s note card (shown as attributed, never endorsed)';
sceneSchema.changedFact.description = 'The single fact that differs between A and B (here: what the term is linked to)';

const defaultParams = {
  sources: ['Text 1 (fictional)', 'Usage note B (fictional)'],
  hierarchy: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)', 'Level 3 (user-supplied)'],
  passages: [
    {ref: 'Text 1 · Art. 7 (fictional)', heading: 'Keeping of items', text: 'The holder keeps each listed item in the register (simulated wording).', term: 'listed item', level: 3},
    {ref: 'Text 1 · Art. 2 (fictional)', heading: 'Definitions', text: 'means an object entered in the annex (simulated wording).', term: 'listed item', level: 2},
  ],
  interpretations: [{source: 'Reader B (fictional)', reading: 'Proposes the ordinary use: “any item written on a list”'}],
  scenarioA: {label: 'Defined term', caption: 'The term is linked to the definition supplied in Art. 2'},
  scenarioB: {label: 'Proposed ordinary use', caption: 'The term is linked to an ordinary use proposed by Reader B'},
  changedFact: 'Only one fact differs: what the term is linked to',
  sharedFacts: ['Same article and term', 'Same text and hierarchy', 'Same reader and tools'],
  comparisonLabels: {guide: 'Changed fact: where the cord ends (A: definition · B: proposal)', neutral: 'Two supplied scenarios side by side — no reading is endorsed and no outcome is shown'},
};


const STRINGS = {
  en: {sharedPanel: 'Identical in A and B:'},
  es: {sharedPanel: 'Igual en A y B:'},
};

/**
 * Scenario header: letter badge + label, and the scenario caption at a legible size. The label and
 * the caption are shown whole (wrapped), never cut. Returns the node and the height it needs.
 */
function scenarioHead(ctx, o) {
  const th = ctx.theme;
  // (review round 4: when the label and the caption do not share one line at the header size, both
  // run on as one paragraph at the content size — bold label, then the caption — so the header
  // takes fewer lines and the desks keep their size)
  if (o.compactFlow && ctx.show('key')) {
    const size = o.capSize;
    const badgeR = size * 0.9;
    const avail = o.w - badgeR * 2 - 14;
    const labelW = ctx.measure(o.label, o.size, 700, 'sans');
    const capW = o.caption && ctx.show('all') ? ctx.measure(o.caption, o.capSize, 500, 'sans') : 0;
    if (labelW + o.size * 0.8 + capW > avail) {
      const fl = flow(ctx, [{text: o.label, weight: 800, fill: th.fg}, ...(o.caption && ctx.show('all') ? [{text: '—', fill: th.fgSoft}, {text: o.caption, weight: 500, fill: th.fgSoft}] : [])], {size, maxWidth: avail, fill: th.fg});
      const node = g({name: o.name},
        h('circle', {cx: o.x + badgeR, cy: o.y + badgeR, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
        h('text', {x: o.x + badgeR, y: o.y + badgeR + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.letter),
        g({transform: T(o.x + badgeR * 2 + 14, o.y + badgeR - size * 0.62)}, fl.node));
      return {node, h: Math.max(badgeR * 2, badgeR - size * 0.62 + fl.h) + 10};
    }
  }
  const size = o.size;
  const badgeR = size * 0.78;
  const tx = o.x + badgeR * 2 + 16;
  const parts = [h('circle', {cx: o.x + badgeR, cy: o.y + badgeR, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5})];
  let labelBottom = o.y + badgeR * 2;
  const avail = o.w - badgeR * 2 - 20;
  let inline = false;
  if (ctx.show('key')) {
    parts.push(h('text', {x: o.x + badgeR, y: o.y + badgeR + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.letter));
    const f = fullFit(ctx, o.label, {maxWidth: avail, size, weight: 700});
    const ly = f.lines.length > 1 ? o.y : o.y + badgeR - f.size * 0.62;
    parts.push(textBlock(f, {x: tx, y: ly, fill: th.fg}));
    labelBottom = Math.max(labelBottom, ly + f.height + f.size * 0.3);
    // (compact: a one-line label and a one-line caption share the header's line)
    const cw = o.caption && ctx.show('all') ? ctx.measure(o.caption, o.capSize, 500, 'sans') : 0;
    if (cw && f.lines.length === 1 && f.width + size * 0.8 + cw <= avail) {
      inline = true;
      parts.push(textBlock(fullFit(ctx, o.caption, {maxWidth: 1e9, size: o.capSize, weight: 500}), {x: tx + f.width + size * 0.8, y: ly + (f.size - o.capSize) * 0.78, fill: th.fgSoft}));
    }
  }
  let hh = labelBottom - o.y + 6;
  if (o.caption && ctx.show('all') && !inline) {
    const f2 = fullFit(ctx, o.caption, {maxWidth: o.w - badgeR * 2 - 20, size: o.capSize, weight: 500});
    parts.push(textBlock(f2, {x: tx, y: labelBottom + 2, fill: th.fgSoft}));
    hh = labelBottom - o.y + 6 + f2.height + 8;
  }
  return {node: g({name: o.name}, parts), h: hh};
}

/**
 * A paragraph of styled runs wrapped to `maxWidth`: one <text> per line, each word a positioned
 * <tspan> (so words never collide whatever the renderer's space width). Runs with `hl` get a
 * highlight box behind their words on each line (with a colour stripe when `bar` is set): the term
 * in the clause and the hierarchy's levels. Local origin = top-left. Returns {node, h, w}.
 */
function flow(ctx, runs, o) {
  const size = o.size;
  const lh = size * 1.34;
  const words = [];
  runs.forEach((run, ri) => {
    const parts = String(run.text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    parts.forEach((wd, wi) => words.push({wd, ri, run, first: wi === 0, last: wi === parts.length - 1}));
  });
  const space = size * 0.3;
  const padOf = run => (run.hl ? size * (run.bar ? 0.62 : 0.32) : 0);
  const lines = [];
  let cur = [], x = 0;
  for (const wd of words) {
    const ww = ctx.measure(wd.wd, size, wd.run.weight || 400, wd.run.family || 'sans');
    const prev = cur[cur.length - 1];
    const sameRun = prev && prev.ri === wd.ri;
    let gap = prev ? space + (sameRun ? 0 : padOf(wd.run) + (prev.run.hl ? size * 0.32 : 0)) : padOf(wd.run);
    // a highlighted run (the term, a level) moves to the next line whole when it fits there
    const runW = wd.first && wd.run.hl ? ctx.measure(String(wd.run.text).replace(/\s+/g, ' ').trim(), size, wd.run.weight || 400, wd.run.family || 'sans') + size * 0.32 : 0;
    const keep = runW && runW + padOf(wd.run) <= o.maxWidth && x + gap + runW > o.maxWidth;
    if (prev && (keep || x + gap + ww + (wd.run.hl ? size * 0.32 : 0) > o.maxWidth)) {
      lines.push(cur); cur = []; x = 0; gap = padOf(wd.run);
    }
    cur.push({...wd, x: x + gap, w: ww});
    x += gap + ww;
  }
  if (cur.length) lines.push(cur);
  const nodes = [], boxes = [];
  let maxW = 0;
  lines.forEach((line, li) => {
    const top = li * lh;
    const base = top + size * 0.8;
    // highlight boxes per run segment on this line
    let s0 = 0;
    for (let i = 1; i <= line.length; i++) {
      if (i === line.length || line[i].ri !== line[s0].ri) {
        const run = line[s0].run;
        if (run.hl) {
          const bx = line[s0].x - padOf(run), bw = line[i - 1].x + line[i - 1].w + size * 0.32 - bx;
          boxes.push(h('path', {d: roundRectPath(bx, top - size * 0.12, bw, size * 1.26, size * 0.28), fill: run.hl, stroke: run.stroke || 'none', 'stroke-width': run.stroke ? 1.6 : 0}));
          if (run.bar) boxes.push(h('rect', {x: r(bx + size * 0.12), y: r(top - size * 0.02), width: r(size * 0.26), height: r(size * 1.06), rx: 2, fill: run.bar}));
        }
        s0 = i;
      }
    }
    nodes.push(h('text', {y: r(base), 'font-size': r(size, 2), 'font-family': FONTS.sans, fill: o.fill},
      line.map(q => h('tspan', {x: r(q.x), 'font-weight': q.run.weight || 400, 'font-family': FONTS[q.run.family || 'sans'], fill: q.run.fill, 'font-style': q.run.italic ? 'italic' : undefined}, q.wd))));
    const last = line[line.length - 1];
    maxW = Math.max(maxW, last.x + last.w + (last.run.hl ? size * 0.32 : 0));
  });
  return {node: g({name: o.name}, boxes, nodes), h: lines.length ? (lines.length - 1) * lh + size * 1.14 : 0, w: maxW, lines: lines.length};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [1000, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const D = ctx.design;
    const V = ctx.view;
    // Review B007 round 3: the two desks are the subject. They are drawn as large as the frame allows
    // (side by side on wide and square frames, stacked full-width on tall frames); the elements
    // identical in A and B (article extract with the term, the full text and its hierarchy) are one
    // compact strip of real text above them; each desk's result is a callout attached where its cord
    // ends (A: the definitions page, B: the note card); the cord is >= 4 px on the frame.
    const sc = Math.min(V.content.w / D.w, V.content.h / D.h); // frame px per design unit
    const fit0 = sc * (1080 / Math.min(V.width, V.height)); // the same on a 1080p frame
    const F = 16.5 / fit0;
    const tall = V.shape === 'portrait', square = V.shape === 'square';
    const R = square ? F : Math.max(F, 18.5 / fit0);
    const st = STAGE.pair, Z = PAIR_ZONE;
    const pa = p.passages[0], pd = p.passages[1];
    const aL = levelIndex(p, pa), dL = levelIndex(p, pd);
    const it = (p.interpretations || [])[0] || {};
    // props may use part of the side margins of the caption-safe box (text never does)
    const ox = (V.width - D.w * sc) / 2 / sc;
    const bleed = Math.max(0, ox * 0.45);
    const gap = 16 / sc;
    // ---- the shared strip (identical in A and B), real text at F
    const showAll = ctx.show('all'), showKey = ctx.show('key');
    const lcA = levelColor(ctx, aL);
    const full = String(pa.text || '').replace(/\s+/g, ' ').trim();
    const at = pa.term ? full.toLowerCase().indexOf(String(pa.term).toLowerCase()) : -1;
    const tBefore = at >= 0 ? full.slice(0, at) : full, tTerm = at >= 0 ? full.slice(at, at + pa.term.length) : pa.term, tAfter = at >= 0 ? full.slice(at + pa.term.length) : '';
    const runsArt = [
      {text: t.sharedPanel, weight: 800, fill: th.inkSoft},
      {text: pa.ref, weight: 600, fill: th.inkSoft},
      {text: p.hierarchy[aL] || '', weight: 700, fill: th.ink, hl: lcA.soft, bar: lcA.c},
      {text: '—', fill: th.inkSoft},
      {text: pa.heading, weight: 700, family: 'serif', fill: th.ink},
      {text: '—', fill: th.inkSoft},
      {text: tBefore, family: 'serif', fill: th.ink},
      {text: tTerm, weight: 700, family: 'serif', fill: th.ink, hl: th.highlight, stroke: linkColor(ctx)},
      {text: tAfter, family: 'serif', fill: th.ink},
    ];
    const runsSrc = [
      {text: `${p.sources[0]}:`, weight: 700, family: 'serif', fill: th.ink},
      ...p.hierarchy.map((l, i) => ({text: l, weight: 700, fill: th.ink, hl: levelColor(ctx, i).soft, bar: levelColor(ctx, i).c})),
    ];
    const stripPad = F * 0.55;
    const stripW = D.w;
    const stripOf = () => {
      if (!showKey) return null;
      const inner = stripW - stripPad * 2;
      const one = [flow(ctx, runsArt, {size: F, maxWidth: inner, name: 'strip-art', fill: th.ink}), flow(ctx, runsSrc, {size: F, maxWidth: inner, name: 'strip-src', fill: th.ink})];
      const hOne = one[0].h + F * 0.5 + one[1].h;
      const wA = inner * 0.6 - F;
      const two = [flow(ctx, runsArt, {size: F, maxWidth: wA, name: 'strip-art', fill: th.ink}), flow(ctx, runsSrc, {size: F, maxWidth: inner - wA - F * 2, name: 'strip-src', fill: th.ink})];
      const hTwo = Math.max(two[0].h, two[1].h);
      const useTwo = hTwo < hOne - F * 0.5 && !tall;
      const [a, b] = useTwo ? two : one;
      const hh = (useTwo ? hTwo : hOne) + stripPad * 2;
      const node = g({name: 'strip'},
        h('path', {d: roundRectPath(5, 7, stripW, hh, 12), fill: th.shadow}),
        h('path', {d: roundRectPath(0, 0, stripW, hh, 12), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
        g({transform: T(stripPad, stripPad)}, a.node),
        g({transform: useTwo ? T(stripPad + wA + F * 2, stripPad) : T(stripPad, stripPad + a.h + F * 0.5)}, b.node),
        useTwo ? h('line', {x1: r(stripPad + wA + F), x2: r(stripPad + wA + F), y1: r(stripPad * 0.6), y2: r(hh - stripPad * 0.6), stroke: th.paperLine, 'stroke-width': 2}) : null);
      return {node, h: hh};
    };
    const strip = stripOf();
    const stripH = strip ? strip.h : 0;
    // ---- footer: changed fact / guide label (R) and shared facts / neutral note (F): side by side
    // when each fits its half in two lines, else stacked
    const footW = D.w - 40;
    const sharedText = p.sharedFacts.length ? `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}` : '';
    const chipH = (text, size, weight, mw) => (text ? chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size, minSize: size, maxLines: 6, weight}).box.h : 0);
    const texts1 = [showKey ? p.changedFact : '', showAll ? p.comparisonLabels.guide : ''];
    const texts2 = [showAll ? sharedText : '', showAll ? p.comparisonLabels.neutral : ''];
    const halfW = footW / 2 - 12;
    const fitsHalf = [...texts1.map(x => [x, R, 700]), ...texts2.map(x => [x, F, 500])].every(([x, size, wt]) => !x || chipH(x, size, wt, halfW) <= size * 1.34 * 3 + size * 0.8);
    const side = fitsHalf && texts2.some(Boolean);
    const fw = side ? halfW : footW;
    const row1 = Math.max(...texts1.map(x => chipH(x, R, 700, fw)), R * 1.8);
    const row2 = Math.max(0, ...texts2.map(x => chipH(x, F, 500, fw)));
    const footH = side ? Math.max(row1, row2) : row1 + (row2 ? 10 + row2 : 0);
    const guideGap = tall ? 26 : square ? 22 : 34;
    const SG = square ? 10 : 18; // strip → headers
    // ---- callouts (result cards) and headers, measured for a desk scale
    const headSize = Math.max(F * 1.2, 24 / fit0);
    const heads = (xs, ws, y) => [
      scenarioHead(ctx, {name: 'hdrA', letter: 'A', label: p.scenarioA.label, caption: p.scenarioA.caption, x: xs[0], y, w: ws[0], size: headSize, capSize: F, color: th.accent2, compactFlow: true}),
      scenarioHead(ctx, {name: 'hdrB', letter: 'B', label: p.scenarioB.label, caption: p.scenarioB.caption, x: xs[1], y, w: ws[1], size: headSize, capSize: F, color: th.accent3, compactFlow: true}),
    ];
    const optsA = RS => ({prefix: 'resA', S: RS, tight: true, compact: true, chipOnly: true, kicker: t.linked, ref: pd.ref, heading: pd.heading, levelLabel: p.hierarchy[dL], levelColor: levelColor(ctx, dL), rows: [{term: pd.term, text: pd.text}]});
    const optsB = RS => ({prefix: 'resB', S: RS, tight: true, status: t.proposed, title: p.sources[1], reading: it.reading, source: it.source});
    // callout on the desk (A: over the low band; B: right of the note card) when B's area is wide
    // enough for its text; otherwise both hang under their desks, attached to the bottom edge
    const planFor = (dS, RS) => {
      const deskW = st.w * dS, deskH = st.h * dS;
      const col = D.w / 2 - gap / 2;
      // row: each desk fills its column (or more, using the side margins); a smaller desk is centred in it
      const xs = tall ? [(D.w - deskW) / 2, (D.w - deskW) / 2]
        : deskW >= col ? [D.w / 2 - gap / 2 - deskW, D.w / 2 + gap / 2] : [(col - deskW) / 2, D.w / 2 + gap / 2 + (col - deskW) / 2];
      const hx = tall ? [Math.max(0, xs[0]), Math.max(0, xs[0])] : [Math.max(0, xs[0]), xs[1]];
      const hw = tall ? [Math.min(deskW, D.w), Math.min(deskW, D.w)] : [Math.max(col - hx[0], deskW >= col ? 0 : col - (col - deskW) / 2 - hx[0]), Math.min(Math.max(deskW, col - (col - deskW) / 2), D.w - xs[1])];
      const hd = heads(hx, hw, 0);
      const headH = Math.max(hd[0].h, hd[1].h);
      const onDesk = Z.note.w * dS * fit0 >= 280;
      const zs = onDesk ? [Z.band, Z.note] : null;
      // (under the desks a callout takes its whole column: fewer lines)
      const colC = tall ? D.w : D.w / 2 - gap / 2;
      // (on a desk that uses the side margins the callout still keeps its text inside the design box)
      // (under the props: the callout spans its desk, inside the design box)
      const cwU = Math.min(colC, deskW - 24 * dS);
      const cxs = onDesk ? zs.map((z, i) => Math.max(0, xs[i] + (z.x + 4) * dS)) : xs.map(x => clamp(x + (deskW - cwU) / 2, 0, D.w - cwU));
      const cws = onDesk ? zs.map((z, i) => Math.min(xs[i] + (z.x + z.w - 4) * dS, D.w) - cxs[i]) : [cwU, cwU];
      const hA = readablePage(ctx, {...optsA(RS), w: cws[0]}).h, hB = noteDoc(ctx, {...optsB(RS), w: cws[1]}).h;
      const hs = [hA, hB];
      let tops, over;
      if (onDesk) {
        // bottom-aligned in its area; it may hang below the desk's edge, never over the documents
        tops = hs.map((hc, i) => Math.max(zs[i].y * dS, deskH - 12 * dS - hc));
        over = Math.max(0, ...hs.map((hc, i) => tops[i] + hc - (deskH - 12 * dS)));
      } else {
        const hc = Math.max(hA, hB);
        // (attached: it overlaps the desk's bottom edge, never the note card lying above it)
        const lap = (st.h - Z.noteCard.y - Z.noteCard.h - 6) * dS;
        tops = [deskH - lap, deskH - lap];
        over = hc - lap + 10 * dS;
        hs[0] = hs[1] = hc;
      }
      const total = tall
        ? stripH + SG + headH + deskH + over + 16 + headH + deskH + over + guideGap + footH
        : stripH + SG + headH + deskH + over + guideGap + footH;
      return {dS, RS, deskW, deskH, xs, hx, hw, headH, onDesk, zs, cxs, cws, hs, tops, over, total};
    };
    const dMax = tall ? D.w / st.w : (D.w + 2 * bleed - gap) / 2 / st.w;
    // the largest desks that fit; the result text at R when the desks keep their target share,
    // else at the floor size F (both cards always share one size)
    const target = tall ? 0.8 : square ? 0.45 : 0.4;
    const search = RS => {
      let best = null;
      for (let dS = dMax; dS > 0.2; dS -= 0.004) {
        const q = planFor(dS, RS);
        if (q.total <= D.h) return q;
        if (!best || q.total < best.total) best = q;
      }
      return best; // (nothing fits: the least overflow; reported by the fits semantic)
    };
    let PL = search(R);
    if (R > F && PL.deskW * sc / V.width < target) {
      const q = search(F);
      if (q.dS > PL.dS) PL = q;
    }
    const {dS, RS, deskW, deskH, xs, hx, hw, headH, onDesk, zs, cxs, cws, hs, tops, over} = PL;
    const spare = Math.max(0, D.h - PL.total);
    const s1 = spare * 0.5, s2 = spare * 0.2; // (the scene sits centred in the frame, not bunched at the top)
    const stripY = 0;
    const cordW = Math.max(4.4, 4.6 / (dS * fit0));
    // under-desk callouts: the desks grow taller so the callouts lie on their surface (no blank band
    // under the desks while the story runs; review round 4)
    const deskHx = onDesk ? deskH : deskH + over;
    const stageH = deskHx / dS;
    const common = {axis: 'pair', params: p, withNote: true, chips: false, captions: false, plateFade: true, mute: true, cordWidth: cordW, stageH};
    const A = definitionDesk(ctx, {...common, prefix: 'A', target: 'definition'});
    const B = definitionDesk(ctx, {...common, prefix: 'B', target: 'note'});
    let headers;
    const panels = [];
    if (tall) {
      const hy0 = stripH + SG + s1;
      const dy0 = hy0 + headH;
      const hy1 = dy0 + deskH + over + 16 + s1 * 0.5;
      panels.push({x: xs[0], y: dy0}, {x: xs[1], y: hy1 + headH});
      headers = [heads(hx, hw, hy0)[0].node, heads(hx, hw, hy1)[1].node];
    } else {
      const hy = stripH + SG + s1;
      panels.push({x: xs[0], y: hy + headH}, {x: xs[1], y: hy + headH});
      headers = heads(hx, hw, hy).map(q => q.node);
    }
    // callouts
    const resA = readablePage(ctx, {...optsA(RS), w: cws[0], minH: onDesk ? 0 : hs[0]});
    const resB = noteDoc(ctx, {...optsB(RS), w: cws[1], minH: onDesk ? 0 : hs[1]});
    const cards = panels.map((P, i) => (onDesk
      ? {x: cxs[i], y: P.y + tops[i], w: cws[i], h: i ? resB.h : resA.h}
      : {x: cxs[i], y: P.y + tops[i], w: cws[i], h: hs[i]}));
    const W2 = (P, q) => ({x: P.x + dS * q.x, y: P.y + dS * q.y});
    const dockA = W2(panels[0], A.dockB), dockB = W2(panels[1], B.dockB);
    // pointers: from the callout to where the cord ends (A: the entry's pin on the definitions page;
    // B: the note card the cord is pinned to)
    const cA = cards[0], cB = cards[1];
    const pxA = clamp(dockA.x, cA.x + 18, cA.x + cA.w - 18);
    const endA = {x: dockA.x, y: dockA.y + 16 * dS};
    const ptrA = {d: `M${r(pxA)} ${r(cA.y)}V${r(endA.y)}${Math.abs(pxA - dockA.x) > 1 ? `H${r(dockA.x)}` : ''}`, start: {x: pxA, y: cA.y}, end: endA};
    const NG = Z.noteCard;
    const note = {x: panels[1].x + NG.x * dS, y: panels[1].y + NG.y * dS, w: NG.w * dS, h: NG.h * dS};
    const ptrB = onDesk
      ? (() => { const py = clamp(dockB.y, Math.max(cB.y + 16, note.y + 12), note.y + note.h - 12); return {d: `M${r(cB.x)} ${r(py)}H${r(note.x + note.w + 2)}`, start: {x: cB.x, y: py}, end: {x: note.x + note.w + 2, y: py}}; })()
      : (() => { const px = clamp(note.x + note.w / 2, cB.x + 18, cB.x + cB.w - 18); return {d: `M${r(px)} ${r(cB.y)}V${r(note.y + note.h + 2)}`, start: {x: px, y: cB.y}, end: {x: px, y: note.y + note.h + 2}}; })();
    // footer and guide
    const lowest = Math.max(...panels.map((P, i) => Math.max(P.y + deskHx, cards[i].y + cards[i].h)));
    const gy = lowest + guideGap * 0.55 + s2;
    const fy = gy + guideGap * 0.45;
    const lx = side ? D.w / 2 - footW / 4 : D.w / 2; // the guide label's centre
    const rx = side ? D.w / 2 + footW / 4 : D.w / 2;
    const y2 = side ? fy : fy + row1 + 10;
    const mk = (text, name, size, weight, x, y, accent) => chip(ctx, text, {x, y, anchor: 'middle', maxWidth: fw, size, minSize: size, maxLines: 6, name, weight, fill: accent ? th.accentSoft : th.card, stroke: accent ? th.accent : undefined});
    const changedChip = showKey ? mk(p.changedFact, 'changed', R, 700, lx, fy, true) : null;
    const guideChip = showAll && p.comparisonLabels.guide ? mk(p.comparisonLabels.guide, 'guidechip', R, 700, lx, fy, true) : null;
    const sharedChip = showAll && sharedText ? mk(sharedText, 'shared', F, 500, rx, y2, false) : null;
    const neutral = showAll && p.comparisonLabels.neutral ? mk(p.comparisonLabels.neutral, 'neutral', F, 500, rx, y2, false) : null;
    const hasLabel = !!(guideChip || changedChip);
    let guideD, guideEnds;
    if (tall) {
      // A's callout → a lane right of the desks → down to the guide line; B's callout → down to it
      const lane = Math.max(...panels.map(P => P.x + deskW)) + Math.min(bleed * 0.6, 16);
      const eA = {x: cA.x + cA.w, y: cA.y + cA.h / 2}, eB = {x: cB.x + cB.w / 2, y: cB.y + cB.h};
      guideD = `M${r(eA.x)} ${r(eA.y)}H${r(lane)}V${r(gy)}H${r(Math.min(eB.x, lx))}${hasLabel ? `M${r(lx)} ${r(gy)}V${r(fy)}` : ''}M${r(eB.x)} ${r(gy)}V${r(eB.y)}`;
      guideEnds = [eA, eB];
    } else {
      const eA = {x: cA.x + cA.w / 2, y: cA.y + cA.h}, eB = {x: cB.x + cB.w / 2, y: cB.y + cB.h};
      guideD = `M${r(eA.x)} ${r(eA.y)}V${r(gy)}H${r(eB.x)}V${r(eB.y)}${hasLabel ? `M${r(lx)} ${r(gy)}V${r(fy)}` : ''}`;
      guideEnds = [eA, eB];
    }
    const share = deskW * sc / V.width;
    // callouts never cover the documents the story needs (A: extract, open pages, flags; B: extract,
    // the closed book and its flags, the note card)
    const ov = (a, b) => a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1;
    const inScene = (P, z) => ({x: P.x + z.x * dS, y: P.y + z.y * dS, w: z.w * dS, h: z.h * dS});
    const calloutsClear = !ov(cards[0], inScene(panels[0], Z.sheet)) && !ov(cards[0], inScene(panels[0], Z.openPages)) && !ov(cards[0], inScene(panels[0], Z.flags))
      && !ov(cards[1], inScene(panels[1], Z.sheet)) && !ov(cards[1], inScene(panels[1], Z.closedBook)) && !ov(cards[1], inScene(panels[1], Z.noteCard));
    return {A, B, panels, headers, strip, stripY, resA, resB, cards, ptrA, ptrB, guideD, guideEnds, dockA, dockB, note, dS, kpx: fit0, R: RS, F,
      sharedChip, changedChip, guideChip, neutral, arrangement: tall ? 'stacked' : 'side-by-side', calloutMode: onDesk ? 'on-desk' : 'under-desk',
      share, target, calloutsClear, cordPx: cordW * dS * fit0, deskBoxes: panels.map(P => ({x: P.x, y: P.y, w: deskW, h: deskHx}))};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ptr = (name, q) => g({name, opacity: 0},
      h('path', {d: q.d, fill: 'none', stroke: th.paper, 'stroke-width': 9, 'stroke-linecap': 'round'}),
      h('path', {d: q.d, fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(q.end.x), cy: r(q.end.y), r: 6, fill: th.accent, stroke: th.paper, 'stroke-width': 2}));
    return g(null,
      L.strip && g({name: 'strip-g', opacity: 0, transform: T(0, L.stripY)}, L.strip.node),
      L.headers,
      g({transform: T(L.panels[0].x, L.panels[0].y, 0, L.dS)}, L.A.node),
      g({transform: T(L.panels[1].x, L.panels[1].y, 0, L.dS)}, L.B.node),
      h('path', {name: 'guide', d: L.guideD, fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': '12 9', 'stroke-linecap': 'round', opacity: 0}),
      ptr('ptrA', L.ptrA),
      ptr('ptrB', L.ptrB),
      g({name: 'resA-g', opacity: 0, transform: T(L.cards[0].x, L.cards[0].y)}, L.resA.node),
      g({name: 'resB-g', opacity: 0, transform: T(L.cards[1].x, L.cards[1].y)}, L.resB.node),
      h('circle', {name: 'guide-a', cx: L.dockA.x, cy: L.dockA.y, r: 28 * L.dS + 8, fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0}),
      h('circle', {name: 'guide-b', cx: L.dockB.x, cy: L.dockB.y, r: 28 * L.dS + 8, fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0}),
      L.sharedChip && g({name: 'shared-g', opacity: 0}, L.sharedChip.node),
      L.changedChip && g({name: 'changed-g', opacity: 0}, L.changedChip.node),
      L.guideChip && g({name: 'guidechip-g', opacity: 0}, L.guideChip.node),
      L.neutral && g({name: 'neutral-g', opacity: 0}, L.neutral.node),
    );
  },
  frame(ctx, L, u) {
    const w = key => seg(u, ...W[key]);
    const base = {lEnter: w('lEnter'), lensMove: w('lensMove'), mark: w('mark'), lensPark: w('lensPark'), pinsTake: w('pinsTake'), pinA: w('pinA'), carry: w('carry'), lOut: w('lOut'), rEnter: w('rEnter'), open: w('open'), rOut: w('rOut')};
    const a = L.A.pose({...base, entryHl: w('dockHl'), noteHl: 0});
    const b = L.B.pose({...base, entryHl: 0, noteHl: w('dockHl')});
    const nodes = {...a.nodes, ...b.nodes};
    if (L.strip) nodes['strip-g'] = {opacity: r(w('shared'), 3)};
    // callouts: once each cord has landed and the hand has left the desk's free corner
    const callout = w('callout');
    nodes['resA-g'] = {opacity: r(callout, 3)};
    nodes['resB-g'] = {opacity: r(callout, 3)};
    nodes.ptrA = {opacity: r(callout, 3)};
    nodes.ptrB = {opacity: r(callout, 3)};
    const tagsOn = w('tags');
    if (ctx.show('all')) nodes['resA-kicker'] = {opacity: r(tagsOn, 3)};
    if (ctx.show('key')) nodes['resB-status'] = {opacity: r(tagsOn, 3)};
    Object.assign(nodes, pageMarks('resA', 1, () => w('dockHl')));
    const gd = w('guide');
    nodes.guide = {opacity: r(gd, 3)};
    nodes['guide-a'] = {opacity: r(gd, 3)};
    nodes['guide-b'] = {opacity: r(gd, 3)};
    // footer: shared facts during the base beat and the change; the changed-fact label on its own
    // line; at the guide it is swapped for the guide label (the old one fades out first)
    const sharedOn = clamp(w('shared') - seg(u, 0.68, 0.73));
    if (L.sharedChip) nodes['shared-g'] = {opacity: r(sharedOn, 3)};
    const changedOn = clamp(w('changed') - seg(u, 0.74, 0.77));
    if (L.changedChip) nodes['changed-g'] = {opacity: r(changedOn, 3)};
    if (L.guideChip) nodes['guidechip-g'] = {opacity: r(seg(u, 0.775, 0.82), 3)};
    if (L.neutral) nodes['neutral-g'] = {opacity: r(w('neutral'), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const rel = (s, P) => ({x: r(s.x - P.x), y: r(s.y - P.y)});
    const sa = a.semantic, sb = b.semantic;
    // desk points in scene coordinates (the desks are scaled by dS)
    const k = L.dS;
    const pa = L.panels[0], pb = L.panels[1];
    const at = (P, q) => ({x: r(P.x + q.x * k), y: r(P.y + q.y * k)});
    const inBox = (q, bx) => Math.hypot(Math.max(bx.x - q.x, 0, q.x - bx.x - bx.w), Math.max(bx.y - q.y, 0, q.y - bx.y - bx.h)) < 1;
    return {nodes, semantic: {
      beat,
      A: {target: sa.target, linked: sa.linked, bookOpen: sa.bookOpen, noteOpen: sa.noteOpen, entryHl: sa.entryHl, noteHl: sa.noteHl, termMark: sa.termMark, pinB: rel(sa.pinB, {x: 0, y: 0}), handL: rel(sa.handL, {x: 0, y: 0}), handR: rel(sa.handR, {x: 0, y: 0}), lens: sa.lens},
      B: {target: sb.target, linked: sb.linked, bookOpen: sb.bookOpen, noteOpen: sb.noteOpen, entryHl: sb.entryHl, noteHl: sb.noteHl, termMark: sb.termMark, pinB: rel(sb.pinB, {x: 0, y: 0}), handL: rel(sb.handL, {x: 0, y: 0}), handR: rel(sb.handR, {x: 0, y: 0}), lens: sb.lens},
      handLA: at(pa, sa.handL), handLB: at(pb, sb.handL),
      handRA: at(pa, sa.handR), handRB: at(pb, sb.handR),
      pinBA: at(pa, sa.pinB), pinBB: at(pb, sb.pinB),
      lensGripA: at(pa, sa.lensGrip), lensGripB: at(pb, sb.lensGrip),
      edgeGripA: at(pa, sa.edgeGrip), edgeGripB: at(pb, sb.edgeGrip),
      lensA: at(pa, sa.lens), lensB: at(pb, sb.lens),
      cordLengthA: r(Math.hypot(sa.pinB.x - sa.pinA.x, sa.pinB.y - sa.pinA.y)),
      cordLengthB: r(Math.hypot(sb.pinB.x - sb.pinA.x, sb.pinB.y - sb.pinA.y)),
      guide: r(gd, 3),
      changedShown: changedOn > 0,
      neutralShown: w('neutral') > 0,
      arrangement: L.arrangement,
      calloutMode: L.calloutMode,
      allReached: sa.allReached && sb.allReached,
      // the guide's two ends sit on the two callouts
      guideOnTags: L.guideEnds.every((q, i) => inBox(q, L.cards[i])),
      // each callout's pointer starts on the callout and ends where the cord ends
      // (A: at the entry's pin on the definitions page; B: on the note card the cord is pinned to)
      pointerA: {fromCard: inBox({x: Number(/M([-\d.]+)/.exec(L.ptrA.d)[1]), y: Number(/M[-\d.]+ ([-\d.]+)/.exec(L.ptrA.d)[1])}, L.cards[0]), toDock: r(Math.hypot(L.ptrA.end.x - L.dockA.x, L.ptrA.end.y - L.dockA.y), 1)},
      pointerB: {fromCard: inBox({x: Number(/M([-\d.]+)/.exec(L.ptrB.d)[1]), y: Number(/M[-\d.]+ ([-\d.]+)/.exec(L.ptrB.d)[1])}, L.cards[1]), toNote: true},
      calloutsOnDesks: L.cards.every((c, i) => { const d = L.deskBoxes[i]; return c.x >= d.x - 1 && c.x + c.w <= d.x + d.w + 1 && c.y < d.y + d.h; }),
      calloutsClearOfProps: L.calloutsClear,
      calloutsClearOfDocks: L.cards.every((c, i) => !inBox(i ? L.dockB : L.dockA, {x: c.x - 6, y: c.y - 6, w: c.w + 12, h: c.h + 12})),
      // the book's title plate and the page text are never visible at the same time
      plateWithPage: ['A', 'B'].some(q => (nodes[`${q}-book-plate`] || {}).opacity > 0 && (nodes[`${q}-book-pagewrap`] || {}).opacity > 0),
      // the note card's shadow is exactly as wide as the turning card (no bare shadow rectangle)
      noteShadowMatches: ['A', 'B'].every(q => {
        const fx = /scale\(([-\d.e]+)/.exec(nodes[`${q}-note-flip`].transform);
        const sx = /scale\(([-\d.e]+)/.exec(nodes[`${q}-note-shadow`].transform);
        return fx && sx && Math.abs(Math.abs(Number(fx[1])) - Number(sx[1])) < 1e-3;
      }),
      keyPx: r(L.R * L.kpx, 2),
      floorPx: r(L.F * L.kpx, 2),
      deskScale: r(L.dS, 3),
      // share of the frame's width each desk covers; the cord's width on the frame (1080p px)
      deskShare: r(L.share, 3),
      cordPx: r(L.cordPx, 2),
    }};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-02-contrast',
    title: 'Legislative definition — defined term vs proposed ordinary use',
    titleEs: 'Definición legislativa — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Definición legislativa',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical reading desks; one fact changes — what the marked term is linked to. In A the hands open the full text at the flag of the definitions section and pin the cord to the supplied definition in another section; in B they turn over a note card and pin the cord to an ordinary use proposed by a named fictional source while the book stays closed. A guide links the two cord ends; no reading is endorsed and no outcome is shown. The desks fill the frame; the elements identical in both (the article extract, the full text and its hierarchy) are one compact strip of text above them, and each result is a callout attached where its cord ends.',
    tags: ['definition', 'defined term', 'ordinary use', 'contrast', 'paired scenes', 'book', 'note card', 'pins', 'cord'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/definicion-legislativa.js', 'src/frameworks/paired.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {...KIT_STRINGS, en: {...KIT_STRINGS.en, ...STRINGS.en}, es: {...KIT_STRINGS.es, ...STRINGS.es}},
  scene,
});
