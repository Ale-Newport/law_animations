/**
 * LAW-0181 — Interpretación lingüística · story
 *
 * Storyboard (a meeting table seen from the side and slightly from above; the
 * table's front panel crops the speakers' legs):
 *  0.00–0.15  rest: speaker A (left end) and speaker B (right end) sit facing
 *             each other; the interpreter sits behind the table between them,
 *             facing the viewer, her left hand on a notepad (the document)
 *             and a pen in her right hand. Name chips on the table panel.
 *  0.10–0.17  anticipation: the interpreter turns her head towards the first
 *             speaker (order from the sequence relationship; default A).
 *  0.15–0.42  the first speaker leans in and speaks: a bubble in their
 *             language (tab: glyph + supplied label) opens WITH its supplied
 *             text, its tail in front of that speaker's mouth; one hand
 *             gestures. The interpreter listens (head turned) and writes
 *             three shorthand marks on the pad — the nib follows each stroke
 *             from her SOLVED hand.
 *  0.42–0.73  the speaker stops; the interpreter lays the pen down, turns to
 *             the other speaker and speaks: a ribbon is drawn from the first
 *             bubble to a second bubble (the other language, the supplied
 *             rendering) whose tail is beside HER mouth. The listener turns
 *             to that bubble. The first bubble stays open and keeps its own
 *             tail: the speakers never change, the interpreter only connects
 *             the two bubbles.
 *  0.73–1.00  hold: the supplied final state (words given and noted, or the
 *             rendering given), the "as supplied · no conclusion drawn" key
 *             and optional callouts. Nothing says the rendering is accurate,
 *             faithful, certified, sufficient or valid; no outcome.
 * @module animations/roles/LAW-0181
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {mix} from '../../core/geometry.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {
  interpFields, languagesField, INTERP_DEFAULTS, KIT_STRINGS, firstSpeaker, captionOf,
  interpStage, measureBubble, speakBubble, ribbon, langColor, LANG_GLYPHS,
  fitWords, wchip, overlaps, noteCallout, freeSpot, gridCands, segHits, keyChip, flap, runTrack, segDist, boxDist, nameChips,
} from './kits/interpretacion-linguistica.js';

const ID = 'LAW-0181';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  turnSrc: [0.1, 0.17],
  lean: [0.14, 0.2], unlean: [0.4, 0.46],
  bubS: [0.15, 0.19], talkS: [0.16, 0.37], gest: [0.18, 0.24], ungest: [0.33, 0.39],
  strokes: [[0.2, 0.245], [0.26, 0.3], [0.325, 0.365]],
  penBack: [0.375, 0.42],
  turnDst: [0.42, 0.48],
  bubR: [0.49, 0.53], talkI: [0.5, 0.66], palm: [0.48, 0.53], unpalm: [0.64, 0.69],
  ribbon: [0.52, 0.62],
  dstTurn: [0.51, 0.58], srcLook: [0.47, 0.53],
  tag: [0.76, 0.8], key: [0.78, 0.82], note: [0.8, 0.87],
};
const ACT_END = 0.72;
const TARGETS = ['utterance', 'rendering', 'notes'];
/** Longest callout leader accepted (design units ≈ px at 1080p). */
const MAX_LEADER = 170;

const STRINGS = {en: {...KIT_STRINGS.en}, es: {...KIT_STRINGS.es}};

const sceneSchema = {
  ...interpFields,
  languages: languagesField,
  props: obj('Supplied speech (shown exactly as supplied; nothing is assessed)', {
    utterance: str('What the first speaker says, as supplied (in the first speaker’s language)', 150),
    rendering: str('The interpreter’s rendering, as supplied (in the other speaker’s language)', 150),
  }),
  actorLabels: obj('Chip captions next to each person (empty = role caption)', {
    a: str('Caption for speaker A', 50), b: str('Caption for speaker B', 50), interpreter: str('Caption for the interpreter', 50),
  }),
  objectLabels: obj('Labels printed on props and links', {
    notes: str('Heading printed on the interpreter’s notepad', 40),
    link: str('Label beside the ribbon that links the two bubbles', 70),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('The state supplied for the final hold (nothing is assessed or concluded)', ['words-noted', 'rendering-given']),
};

const defaultParams = {
  ...INTERP_DEFAULTS,
  props: {
    utterance: 'Dejé las llaves en la recepción a las nueve.',
    rendering: 'I left the keys at the reception desk at nine.',
  },
  actorLabels: {a: '', b: '', interpreter: ''},
  objectLabels: {notes: 'Interpreter’s notes', link: 'Rendered for the listener · same speaker'},
  actionProgress: 1,
  annotations: [{target: 'rendering', text: 'Voiced by the interpreter for the listener'}],
  finalState: 'rendering-given',
};

/** Per-shape staging (design units; k = person scale, X = seat distance in person units). */
const CFG = {
  landscape: {X: 560, kMax: 1.8, kMin: 1.0, crop: 72, size: 28, min: 17, bubMax: 640, mode: 'side'},
  square: {X: 540, kMax: 1.32, kMin: 0.9, crop: 78, size: 26, min: 17, bubMax: 480, mode: 'side'},
  portrait: {X: 470, padW: 230, kMax: 1.6, kMin: 1.0, crop: 150, floor: true, panelLocal: 96, size: 32, min: 17, bubMax: 880, mode: 'stack'},
};

/** Does segment p→q cross the polyline pts? */
function crossesPoly(p, q, pts) {
  const o = (a, b, c) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (o(p, q, a) * o(p, q, b) < 0 && o(a, b, p) * o(a, b, q) < 0) return true;
  }
  return false;
}

/** Sampled clearance: does segment p→q cross any box? */
const hitsAny = (p, q, boxes) => boxes.some(b => segHits(p, q, b));

function tryLayout(ctx, S, k, Ay, cropAdd = 0) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const probeOnly = Ay === null;
  const minS = Math.max(C.min, S * 0.84);
  const problems = [];
  const src = firstSpeaker(p.relationships);
  const mirror = src === 'b';
  const rendered = p.finalState === 'rendering-given';

  // --- stage (the pad label is measured to the pad's header width)
  const X = C.X;
  const padHeaderW = ((C.padW ?? 214) - 24 - 16) * k;
  const padLabel = fitWords(p.objectLabels.notes, {maxWidth: padHeaderW, size: Math.max(minS, S * 0.8), minSize: minS, maxLines: 2, weight: 700});
  if (padLabel.truncated) problems.push('pad-label');
  const stageW = (X + 132) * k;
  if (stageW > D.w - 12) problems.push('too-wide');
  const Ax = (D.w - stageW) / 2 + 66 * k;
  const st = interpStage(ctx, {prefix: 'st', k, A: {x: Ax, y: Ay ?? 0}, X, crop: C.crop + cropAdd, floor: C.floor, panelLocal: C.panelLocal + cropAdd, actors: p.actors, padLabel: showAll ? padLabel : null, padLabelH: padLabel, padW: C.padW});
  if (padLabel.height + 10 > st.padBox.h * 0.55) problems.push('pad-label-tall');
  const T0 = st.table;
  // --- name chips on the table's front panel (fixed: they never move or change)
  const chips = [];
  let chipMode = null;
  if (showKey) {
    const res = nameChips(ctx, p, st, S, Math.max(C.min, Math.min(minS, S * 0.72)), D, k);
    if (!res) problems.push('chips');
    else { chips.push(...res.set); chipMode = res.mode; }
  }
  const fb = {a: st.faceBox('a'), b: st.faceBox('b'), i: st.faceBox('i')};
  const faces = [fb.a, fb.b, fb.i];
  // canonical frame: the first speaker on the LEFT (the stage is symmetric about D.w / 2); mirror x for B-first
  const mx = x => (mirror ? D.w - x : x);
  const M2 = q => ({x: mx(q.x), y: q.y});
  const dstId = src === 'a' ? 'b' : 'a';
  const cS = fb.a, cD = fb.b, cI = fb.i;           // canonical face boxes
  const cTipS = st.tipA, cTipI = st.tipI(1);       // canonical tail tips
  const tipS = M2(cTipS), tipI = M2(cTipI);        // world tips
  const langS = src === 'a' ? p.languages.a : p.languages.b;
  const langD = src === 'a' ? p.languages.b : p.languages.a;
  const lS = {color: langColor(ctx, src === 'a' ? 0 : 1), glyph: LANG_GLYPHS[src === 'a' ? 0 : 1]};
  const lD = {color: langColor(ctx, src === 'a' ? 1 : 0), glyph: LANG_GLYPHS[src === 'a' ? 1 : 0]};

  // generic captions (link label, tag, key, callouts) never exceed the smallest supplied text
  const capOf = (MS0, MR0) => {
    const cMin0 = Math.min(MS0.text.size, MR0.text.size, MS0.tabText.size, MR0.tabText.size, padLabel.size, ...chips.map(c => c.fit.size));
    return Math.max(Math.min(17, cMin0), Math.min(S * 0.9, cMin0));
  };
  const linkW = Math.min(460, D.w * (shape === 'landscape' ? 0.3 : 0.44));
  const linkProbe = (MS0, MR0) => wchip(ctx, p.objectLabels.link, {x: 0, y: 0, maxWidth: linkW, size: capOf(MS0, MR0), minSize: capOf(MS0, MR0), maxLines: 3, weight: 600});

  // --- bubbles (canonical coordinates)
  const margin = 10, gapFace = 16, tailMin = 34;
  let Sx, Sw, Rx, Rw, Sb, Rb, MS, MR;
  if (C.mode === 'side') {
    const sRight = cI.x - gapFace;
    Sw = Math.min(C.bubMax, sRight - margin);
    Sx = sRight - Sw;
    Rx = cI.x + cI.w + gapFace;
    Rw = Math.min(C.bubMax, D.w - margin - Rx);
    MS = measureBubble(ctx, {w: Sw, text: p.props.utterance, tab: langS, S, minS, maxLines: 5});
    MR = measureBubble(ctx, {w: Rw, text: p.props.rendering, tab: langD, S, minS, maxLines: 5});
    Sb = Math.min(cS.y - 10, cTipS.y - tailMin);
    Rb = Math.min(cD.y - 10, cTipI.y - tailMin);
  } else {
    // stack: the rendering right of the interpreter's head, above the listener; the first speaker's
    // words above everything (the ribbon drops from one to the other)
    Rx = cI.x + cI.w + gapFace;
    Rw = Math.min(C.bubMax, D.w - margin - Rx);
    MR = measureBubble(ctx, {w: Rw, text: p.props.rendering, tab: langD, S, minS, maxLines: 6});
    Rb = Math.min(cD.y - 10, cTipI.y - tailMin);
    Sx = margin;
    Sw = Math.min(C.bubMax, D.w - margin * 2 - 40);
    MS = measureBubble(ctx, {w: Sw, text: p.props.utterance, tab: langS, S, minS, maxLines: 5});
    const ribbonGap = Math.max(96, linkProbe(MS, MR).box.h + 44);
    Sb = Math.min(cS.y - 10, Rb - MR.h - MR.tabH * 0.5 - ribbonGap, cI.y - 14);
  }
  if (MS.truncated || MR.truncated) problems.push('bubble-truncated');
  const Sy = Sb - MS.h, Ry = Rb - MR.h;
  const tailXS = cTipS.x + 10 * k;
  const tailXR = Rx + Math.min(70, Rw * 0.2);
  // --- ribbon (canonical): from the first bubble to the rendering (its language tab sits on the far side)
  let rf, rt, c1, c2;
  if (C.mode === 'side') {
    rf = {x: Sx + Sw - 46, y: Sy};
    rt = {x: Math.min(Rx + 46, Rx + Rw - MR.tabW - MR.pad * 0.6 - 30), y: Ry - 1};
    const lift = Math.max(80, (Math.max(rf.y, rt.y) - cI.y + 26) / 0.75);
    c1 = {x: rf.x + 34, y: rf.y - lift};
    c2 = {x: rt.x - 34, y: rt.y - lift};
  } else {
    const xr = Math.min(Rx + Math.min(70, Rw * 0.22), Rx + Rw - MR.tabW - MR.pad * 0.6 - 30);
    rf = {x: xr, y: Sb};
    rt = {x: xr, y: Ry - 1};
    c1 = {x: xr, y: rf.y + (rt.y - rf.y) * 0.35};
    c2 = {x: xr, y: rf.y + (rt.y - rf.y) * 0.65};
  }
  const bubS = speakBubble(ctx, {name: 'bubS', x: mirror ? D.w - Sx - Sw : Sx, y: Sy, M: MS, tip: tipS, tailX: mx(tailXS), lang: lS, showText: showAll, tabSide: mirror ? 'right' : 'left'});
  const bubR = speakBubble(ctx, {name: 'bubR', x: mirror ? D.w - Rx - Rw : Rx, y: Ry, M: MR, tip: tipI, tailX: mx(tailXR), lang: lD, showText: showAll, tabSide: mirror ? 'left' : 'right'});
  const rib = ribbon(ctx, {name: 'rib', from: M2(rf), to: M2(rt), c1: M2(c1), c2: M2(c2), color: lS.color});
  const ribPts = rib.poly.pts;

  // --- checks: faces clear of bubbles; tails end beside mouths and cross no head
  for (const bb of [bubS.box, bubR.box]) if (faces.some(f => overlaps(bb, f, 2))) problems.push('bubble-face');
  if (overlaps(bubS.box, bubR.box, 8)) problems.push('bubbles-overlap');
  const tailClearS = st.tipClear(tipS, src) && !st.tailHitsHead(bubS.tailBase, tipS, src, 0);
  const tailClearR = st.tipClear(tipI, 'i') && !st.tailHitsHead(bubR.tailBase, tipI, 'i', 2);
  if (!tailClearS) problems.push('tail-S');
  if (!tailClearR) problems.push('tail-R');
  if (segHits(bubR.tailBase, tipI, fb[dstId]) || segHits(bubS.tailBase, tipS, fb.i) || segHits(bubS.tailBase, tipS, bubR.box)) problems.push('tail-cross');
  if (faces.some(f => ribPts.some(q => q.x > f.x && q.x < f.x + f.w && q.y > f.y && q.y < f.y + f.h))) problems.push('ribbon-face');
  const txtS = bubS.textBox, txtR = bubR.textBox;
  const inBox = (q, b, m = 4) => q.x > b.x - m && q.x < b.x + b.w + m && q.y > b.y - m && q.y < b.y + b.h + m;
  if (ribPts.some(q => [txtS, txtR, bubS.tab, bubR.tab].some(b => inBox(q, b)))) problems.push('ribbon-text');

  const capS = capOf(MS, MR);

  // --- the ribbon's label, right beside its own ribbon (above the arc / beside the drop)
  let link = null, linkDist = null;
  const ribBB = (() => {
    const xs = ribPts.map(q => q.x), ys = ribPts.map(q => q.y);
    return {x: Math.min(...xs) - 8, y: Math.min(...ys) - 8, w: Math.max(...xs) - Math.min(...xs) + 16, h: Math.max(...ys) - Math.min(...ys) + 16};
  })();
  if (showAll && rendered) {
    const lw = linkW;
    const probe = linkProbe(MS, MR);
    if (probe.fit.truncated) problems.push('link-truncated');
    const w = probe.box.w, hh = probe.box.h;
    const dRib = b => Math.min(...ribPts.map(q => boxDist(q, b)));
    const cands0 = [];
    if (C.mode === 'side') {
      // beside the rising part (over the first bubble), beside the falling part, or above the apex
      const apex = ribPts.reduce((m, q) => (q.y < m.y ? q : m), ribPts[0]);
      const rise = rib.poly.at(0.22), fall = rib.poly.at(0.78);
      const topS = Math.min(bubS.box.y, bubR.box.y);
      cands0.push(mirror ? {x: fall.x - 14 - w, y: Math.min(fall.y - hh / 2, topS - 10 - hh)} : {x: rise.x - 14 - w, y: Math.min(rise.y - hh / 2, topS - 10 - hh)});
      cands0.push(mirror ? {x: rise.x + 14, y: Math.min(rise.y - hh / 2, topS - 10 - hh)} : {x: fall.x + 14, y: Math.min(fall.y - hh / 2, topS - 10 - hh)});
      cands0.push({x: apex.x - w / 2, y: apex.y - 12 - hh});
    } else {
      const mid = rib.poly.at(0.5);
      cands0.push(mirror ? {x: mid.x - 22 - w, y: mid.y - hh / 2} : {x: mid.x + 22, y: mid.y - hh / 2});
      cands0.push(mirror ? {x: mid.x + 22, y: mid.y - hh / 2} : {x: mid.x - 22 - w, y: mid.y - hh / 2});
    }
    const blockers = [bubS.body, bubR.body, bubS.tab, bubR.tab, ...faces, st.interpBox()];
    let spot = cands0.find(c => !blockers.some(b => overlaps({x: c.x, y: c.y, w, h: hh}, b, 6)) && !ribPts.some(q => inBox(q, {x: c.x, y: c.y, w, h: hh})) && c.x >= 8 && c.x + w <= D.w - 8 && dRib({x: c.x, y: c.y, w, h: hh}) <= 30);
    if (!spot) { problems.push('link'); spot = cands0[0]; }
    link = wchip(ctx, p.objectLabels.link, {x: spot.x, y: spot.y, maxWidth: lw, size: capS, minSize: capS, maxLines: 3, weight: 600, name: 'link', fill: th.card, stroke: lS.color, color: th.ink});
    linkDist = dRib(link.box);
    if (linkDist > 30) problems.push('link-far');
  }

  // --- vertical extent (the probe centres the composition)
  const top = Math.min(bubS.box.y, bubR.box.y, ribBB.y, ...(link ? [link.box.y] : []), fb.i.y);
  const bottom = Math.max(T0.yBottom, ...chips.map(c => c.box.y + c.box.h));
  if (probeOnly) return {ok: false, probe: true, problems, top, bottom};
  if (top < 6 || bottom > D.h - 4) problems.push('out-of-frame');
  if (problems.length) return {ok: false, problems};

  // --- occupied boxes for tags, key and callouts
  const tailBox = (base, tip) => ({x: Math.min(base.x, tip.x) - 26, y: Math.min(base.y, tip.y), w: Math.abs(base.x - tip.x) + 52, h: Math.abs(tip.y - base.y)});
  const obstacles = [bubS.box, bubR.box, tailBox(bubS.tailBase, tipS), tailBox(bubR.tailBase, tipI), ...faces, ribBB,
    st.personBox('a'), st.personBox('b'), st.interpBox(), st.padBox, ...st.chairBoxes(),
    {x: T0.x0, y: T0.yFar, w: T0.x1 - T0.x0, h: T0.panelTop + 6 * k - T0.yFar}, ...chips.map(c => c.box), ...(link ? [link.box] : [])];
  if (C.floor) obstacles.push({x: T0.x0 - 60 * k, y: T0.panelBottom, w: T0.x1 - T0.x0 + 120 * k, h: T0.yBottom - T0.panelBottom});
  const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  const cands = gridCands(bounds, 12);

  // --- editorial callouts (short leaders that cross no text or face)
  const notes = [];
  const leaders = [];
  const textBoxes = [txtS, txtR, bubS.tab, bubR.tab, ...chips.map(c => c.box), ...(link ? [link.box] : [])];
  if (showAll) {
    // candidate anchor points on the outline of each target (inside the outline by 3 units)
    const edgePts = (bx, fr = [0.2, 0.5, 0.8]) => [
      ...fr.map(f => ({x: bx.x + bx.w * f, y: bx.y + bx.h - 3})),
      ...fr.map(f => ({x: bx.x + bx.w * f, y: bx.y + 3})),
      ...[0.35, 0.65].flatMap(f => [{x: bx.x + 3, y: bx.y + bx.h * f}, {x: bx.x + bx.w - 3, y: bx.y + bx.h * f}]),
    ];
    const padB = st.padBox;
    const targets = {
      utterance: edgePts(bubS.body),
      rendering: edgePts(bubR.body),
      notes: [0.2, 0.5, 0.8].map(f => ({x: padB.x + padB.w * f, y: padB.y + padB.h - 6})).concat([{x: padB.x + padB.w - 4, y: padB.y + padB.h * 0.6}, {x: padB.x + 4, y: padB.y + padB.h * 0.6}]),
    };
    for (const [i, a] of p.annotations.entries()) {
      if (a.target === 'rendering' && !rendered) continue;
      let best = null;
      for (const maxW of (shape === 'portrait' ? [D.w * 0.6, D.w * 0.45, D.w * 0.34] : [Math.min(440, D.w * 0.32), Math.min(330, D.w * 0.32), 260, 210])) {
        const probe = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, anchor: 'start', target: {x: -50, y: -50}, maxWidth: maxW, size: capS, minSize: capS, maxLines: 4});
        if (probe.fit.truncated) continue;
        const w = probe.box.w, hh = probe.box.h;
        const lead = (b, tg) => {
          const from = {x: clamp(tg.x, b.x + 12, b.x + b.w - 12), y: tg.y > b.y + b.h ? b.y + b.h : tg.y < b.y ? b.y : b.y + b.h / 2};
          if (from.y === b.y + b.h / 2) from.x = tg.x > b.x + b.w / 2 ? b.x + b.w : b.x;
          const len = Math.hypot(tg.x - from.x, tg.y - from.y);
          const end = len > 14 ? {x: tg.x - ((tg.x - from.x) * 14) / len, y: tg.y - ((tg.y - from.y) * 14) / len} : from;
          return {from, end, len};
        };
        for (const tg of targets[a.target]) {
          const score = b => {
            const L0 = lead(b, tg);
            const grow = b => ({x: b.x - 8, y: b.y - 8, w: b.w + 16, h: b.h + 16});
            const cross = hitsAny(L0.from, L0.end, [...textBoxes, ...faces, ...notes.map(n => n.box)].map(grow)) || crossesPoly(L0.from, L0.end, ribPts) ? 1e5 : 0;
            return L0.len + cross + (L0.len < 30 ? 200 : 0) + (L0.len > MAX_LEADER ? 1e4 : 0);
          };
          // only spots whose leader can be short enough are worth scoring
          const near = cands.filter(c => c.x > tg.x - w - MAX_LEADER && c.x < tg.x + MAX_LEADER && c.y > tg.y - hh - MAX_LEADER && c.y < tg.y + MAX_LEADER);
          const spot = freeSpot(near, w, hh, obstacles, bounds, 10, score);
          if (!spot) continue;
          const b = {x: spot.x, y: spot.y, w, h: hh};
          const sc = score(b);
          if (!best || sc < best.sc) best = {sc, spot, tg, maxW, len: lead(b, tg).len};
        }
      }
      if (!best || best.sc >= 1e4) { problems.push('note'); if (!best) continue; }
      leaders.push(r(best.len));
      const n = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: best.spot.x, y: best.spot.y}, anchor: 'start', target: best.tg, maxWidth: best.maxW, size: capS, minSize: capS, maxLines: 4});
      notes.push(n);
      obstacles.push(n.box);
    }
  }

  if (problems.length) return {ok: false, problems};

  // --- final-state tag and the neutral key (near the scene; they may wrap to fit a free margin)
  let tag = null, key = null;
  const placeBest = (make, anchorPt, wy = 1) => {
    let best = null;
    for (const maxW of [Math.min(460, D.w * 0.4), 340, 260, 200]) {
      const probe = make(0, 0, maxW, null);
      if (probe.fit.truncated) continue;
      const lines = probe.fit.lines.length;
      const sc = b => Math.hypot(b.x + b.w / 2 - anchorPt.x, (b.y + b.h / 2 - anchorPt.y) * wy) + (lines - 1) * 90;
      const spot = freeSpot(cands, probe.box.w, probe.box.h, obstacles, bounds, 10, sc);
      if (!spot) continue;
      const v = sc({x: spot.x, y: spot.y, w: probe.box.w, h: probe.box.h});
      if (!best || v < best.v - 1) best = {v, spot, maxW};
    }
    return best;
  };
  if (showKey) {
    const stateText = rendered ? ctx.t.renderingGiven : ctx.t.wordsGiven;
    // the state tag sits by the end of the action (under the rendering, or by the notepad)
    const anchor = rendered ? {x: bubR.body.x + bubR.body.w * (mirror ? 0.15 : 0.85), y: bubR.body.y + bubR.body.h + 90} : {x: st.padBox.x + st.padBox.w / 2, y: T0.yBottom};
    const mkTag = (x, y, maxW, name) => wchip(ctx, stateText, {x, y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, weight: 700, name, color: th.ink, stroke: th.ink});
    const bt = placeBest(mkTag, anchor);
    if (bt) { tag = mkTag(bt.spot.x, bt.spot.y, bt.maxW, 'state-tag'); obstacles.push(tag.box); } else problems.push('tag');
    // the key: beside the table's lower corner on the other side, else under the table
    const kAnchor = {x: mirror ? T0.x1 + 60 : T0.x0 - 60, y: T0.yBottom - 40};
    const mkKey = (x, y, maxW, name) => keyChip(ctx, ctx.t.key, {x, y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, name});
    const bk = placeBest(mkKey, kAnchor, 1.6);
    if (bk) { key = mkKey(bk.spot.x, bk.spot.y, bk.maxW, 'key'); obstacles.push(key.box); } else problems.push('key');
  }

  // --- pen plan: hover → write each stroke → back to rest; every target reachable
  const track = [];
  const targetsI = [];
  const lift = q => ({x: q.x + 6 * k, y: q.y - 10 * k});
  W.strokes.forEach(([a, b], i) => {
    const poly = st.strokes[i];
    const s0 = poly.at(0);
    // hover above the stroke's start (from rest, or from the previous stroke's lifted end), then touch down
    const from = i === 0 ? a - 0.03 : W.strokes[i - 1][1] + 0.003;
    track.push({a: from, b: a - 0.004, to: lift(s0), ease: ease.inOutSine});
    track.push({a: a - 0.004, b: a, to: s0, ease: ease.inOutSine});
    track.push({a, b, at: u => poly.at(ease.inOutSine(seg(u, a, b)))});
    track.push({a: b, b: b + 0.003, to: lift(poly.at(1)), ease: ease.inOutSine});
    for (let q = 0; q <= 1.0001; q += 0.25) targetsI.push(poly.at(q));
    targetsI.push(lift(s0), lift(poly.at(1)));
  });
  track.push({a: W.penBack[0], b: W.penBack[1], to: st.rest.nibI, ease: ease.inOutSine});
  const reach = targetsI.every(nib => st.pose({a: {}, b: {}, i: {nib}}).semantic.allReached) && st.pose({a: {near: st.rest.gestureA}, b: {near: st.rest.gestureB}, i: {}}).semantic.allReached;
  if (!reach) problems.push('reach');
  const contentMin = Math.min(capS, MS.text.size, MR.text.size, MS.tabText.size, MR.tabText.size, padLabel.size, ...chips.map(c => c.fit.size));
  return {
    ok: problems.length === 0, problems, S, k, st, bubS, bubR, rib, link, linkDist, chips, notes, leaders, tag, key, capS, contentMin,
    top, bottom, track, src, dst: dstId, mirror, rendered, tailClearS, tailClearR, padLabel,
  };
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const D = ctx.design;
    const tries = [];
    // for each text size (largest first) the largest person scale that fits; the best balance of text
    // size and figure size wins (a few text sizes are compared, never the whole grid)
    const fitAt = (S, k) => {
      for (const cropAdd of [0, 30, 60]) {
        const probe = tryLayout(ctx, S, k, null, cropAdd);
        if (probe.problems.length) {
          tries.push(`${S}/${r(k)}/${cropAdd}:${probe.problems.join('+')}`);
          if (probe.problems.includes('chips')) continue;
          return null;
        }
        const hgt = probe.bottom - probe.top;
        if (hgt > D.h - 16) { tries.push(`${S}/${r(k)}/${cropAdd}:too-tall`); return null; }
        const Ay = 8 + (D.h - 16 - hgt) / 2 - probe.top;
        const L = tryLayout(ctx, S, k, Ay, cropAdd);
        if (L.ok) return L;
        tries.push(`${S}/${r(k)}/${cropAdd}:${L.problems.join('+')}`);
      }
      return null;
    };
    let best = null;
    for (let S = C.size; S >= C.min - 1e-6; S -= 1) {
      if (best && S < best.S - 3) break;
      for (let k = C.kMax; k >= C.kMin - 1e-6; k -= 0.05) {
        if (best && k <= best.k) break;
        const L = fitAt(S, k);
        if (!L) continue;
        const score = S / C.size + 1.3 * (k / C.kMax);
        if (!best || score > best.score) best = {...L, score};
        break;
      }
    }
    if (best) return {...best, tries: tries.slice(-8)};
    throw new Error(`${ID}: no layout fits (${tries.slice(-12).join(' | ')})`);
  },
  build(ctx, L) {
    return g(null,
      L.st.node,
      L.chips.map(c => c.node),
      L.bubS.node,
      L.bubR.node,
      L.rib.node,
      L.link && g({'data-rel-label': 'rib'}, L.link.node),
      L.tag && L.tag.node,
      L.key && L.key.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const st = L.st;
    const reduced = ctx.reduced;
    const done = p.actionProgress >= 1;
    const capU = lerp(BEATS.action[0], ACT_END, p.actionProgress);
    const a = Math.min(u, capU);
    const x = w => seg(a, w[0], w[1]);
    const rendered = L.rendered;
    // 1 = the interpreter still follows the first speaker; 0 = turned to the listener
    const toDst = rendered ? ease.inOutSine(x(W.turnDst)) : 0;
    const toSrc = ease.inOutSine(x(W.turnSrc)) * (1 - toDst);
    const sideS = L.mirror ? 1 : -1; // screen side of the first speaker, seen from the interpreter
    const tiltI = 9 * (sideS * toSrc - sideS * toDst);
    const lookI = sideS * toSrc - sideS * toDst;
    // the first speaker
    const lean = 6 * ease.inOutSine(x(W.lean)) * (1 - ease.inOutSine(x(W.unlean)));
    const talkS = x(W.talkS) > 0 && x(W.talkS) < 1 ? seg(a, W.talkS[0], W.talkS[0] + 0.01) * (1 - seg(a, W.talkS[1] - 0.01, W.talkS[1])) : 0;
    const gest = ease.inOutSine(x(W.gest)) * (1 - ease.inOutSine(x(W.ungest)));
    const wave = reduced ? 0 : Math.sin(timeMs * 0.009) * 9 * st.k;
    const openS = x(W.bubS);
    const srcLook = rendered ? ease.inOutSine(x(W.srcLook)) : 0;
    // the listener turns to the rendering
    const dstTurn = rendered ? ease.inOutSine(x(W.dstTurn)) : 0;
    // the interpreter
    const notes = W.strokes.map(w => ease.inOutSine(x(w)));
    const nib = runTrack(a, st.rest.nibI, L.track);
    const writing = W.strokes.some(w => a >= w[0] && a <= w[1]);
    const ribP = rendered ? ease.inOutSine(x(W.ribbon)) : 0;
    const openR = rendered ? x(W.bubR) : 0;
    const talkI = rendered && x(W.talkI) > 0 && x(W.talkI) < 1 ? 1 : 0;
    const palm = rendered ? ease.inOutSine(x(W.palm)) * (1 - ease.inOutSine(x(W.unpalm))) : 0;
    const leftRest = st.rest.leftI;
    const palmTarget = {x: leftRest.x + (L.mirror ? -1 : 1) * 60 * st.k, y: leftRest.y - 70 * st.k};
    const srcIsA = L.src === 'a';
    const gestPt = srcIsA ? st.rest.gestureA : st.rest.gestureB;
    const restNear = srcIsA ? st.rest.nearA : st.rest.nearB;
    const near = mix(restNear, {x: gestPt.x, y: gestPt.y + wave * gest}, gest);
    const sPose = {near, lean, mouth: talkS * flap(timeMs, reduced, 0), tilt: -6 * srcLook};
    const dPose = {lean: 4 * dstTurn, tilt: -10 * dstTurn - 2 * (1 - dstTurn) * toSrc};
    const posed = st.pose({
      a: srcIsA ? sPose : dPose,
      b: srcIsA ? dPose : sPose,
      i: {nib, tilt: tiltI, look: lookI, mouth: talkI * flap(timeMs, reduced, 0.7), left: mix(leftRest, palmTarget, palm), open: palm > 0.5 ? 1 : 0},
      notes,
    });
    const nodes = posed.nodes;
    Object.assign(nodes, L.bubS.frame(openS, reduced));
    Object.assign(nodes, L.bubR.frame(openR, reduced));
    Object.assign(nodes, L.rib.frame(ribP));
    const fade = w => (done ? r(seg(u, ...w), 3) : 0);
    if (L.link) nodes.link = {opacity: r(clamp((ribP - 0.6) / 0.4), 3)};
    if (L.tag) nodes['state-tag'] = {opacity: fade(W.tag)};
    if (L.key) nodes.key = {opacity: fade(W.key)};
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    return {
      nodes,
      semantic: {
        ...sem,
        noteTarget: writing ? {x: r(nib.x), y: r(nib.y)} : null,
        beat,
        first: L.src,
        bubbleS: r(openS, 3), bubbleR: r(openR, 3), ribbon: r(ribP, 3),
        notes: notes.map(v => r(v, 3)),
        speakingS: talkS > 0.5, speakingI: talkI > 0.5,
        // head direction of the interpreter: towards the first speaker, the listener or neutral
        iFaces: Math.abs(tiltI) < 3 ? 'none' : (tiltI * sideS > 0 ? 'src' : 'dst'),
        iTilt: r(tiltI, 2),
        dstTurned: r(dstTurn, 3),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        labelsFit: L.ok, layoutTries: L.tries, textSize: L.S, scale: r(L.k, 2),
        contentMin: r(L.contentMin),
        keyShown: Boolean(L.key),
        leaderMax: L.leaders.length ? Math.max(...L.leaders) : 0,
        linkDist: L.linkDist === null ? null : r(L.linkDist, 1),
        tailClearS: L.tailClearS, tailClearR: L.tailClearR,
        // the tails' tips (world) and the mouths they serve
        tipS: {x: r(L.bubS.tip.x), y: r(L.bubS.tip.y)}, tipR: {x: r(L.bubR.tip.x), y: r(L.bubR.tip.y)},
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
    slug: 'roles-06-story',
    title: 'Language interpretation — an interpreter links two speech bubbles at the table',
    titleEs: 'Interpretación lingüística — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Interpretación lingüística',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a meeting table: the first speaker says the supplied words in a bubble tagged with their language; the interpreter behind the table turns to listen and writes shorthand marks on her notepad (the pen follows the solved hand), then turns to the other speaker and gives the supplied rendering in a second bubble whose tail is at her own mouth. A ribbon links the two bubbles; the listener turns to the rendering. The speakers never change. As supplied; no accuracy, validity or outcome is stated.',
    tags: ['interpreter', 'interpretation', 'language', 'speech bubble', 'rendering', 'notepad', 'pen', 'table', 'three people', 'consecutive'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/interpretacion-linguistica.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/animations/roles/kits/entrevista-a-cliente.js', 'src/animations/roles/kits/mediation-table.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
