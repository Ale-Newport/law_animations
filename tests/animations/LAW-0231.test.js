// LAW-0231 — Deliberación separada · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the supplied configuration:
// joined / apart), and no legal consequence is invented to complete the contrast. The changed fact alters geometry
// and sequence (the door closes and the public space moves apart in one scene only), not only text or colour.
// ● audiencia and ◆ deliberación get equal visual weight (same header style, same ring style; solid cues, no dashes).
// Timing (u): identical 0–0.17 · labels 0.17–0.24 · rings 0.22–0.30 · (apart scene) door 0.40–0.47, track 0.45–0.52,
// move 0.48–0.72 · guide 0.77–0.83 · neutral note 0.80–0.86.
// The long-labels-stress preset is capped as a QUALITY choice (LAW-0223 precedent): near-maximum texts fit at 1:1 with
// people 54.1–56.2 px (16.6 px text), above the 45 px contrast stress floor; the cap keeps people at 62.8 px (presets
// note). Every check below applies to it unchanged. People floors are coordinator decisions (production/SESSION_HANDOFF.md).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, equalWeightTest, wordingTest, noArrowsTest, fillMostTest, thinContentTest} from './deliberacion-separada-checks.js';

const ID = 'LAW-0231';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['pubA', 'pubB'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.doorA === 1 && s.doorB === 1", label: 'base: two identical scenes, the spaces joined, both doors open'},
    {at: 0.32, fn: "s.lookA.ring === 'public-space' && s.lookB.ring === 'zone' && s.lookA.labelShown === 1 && s.lookB.labelShown === 1 && s.doorB === 1", label: 'introduce: A labelled and ringed on its public space (●), B on its zone (◆), at the same moment; nothing moves yet'},
    {at: 0.45, fn: 's.doorB < 1 && s.doorA === 1 && s.lookB.move === 0', label: 'action (B): the door closes first, before anything moves'},
    {at: 0.6, fn: 's.lookB.move > 0 && s.lookA.move === 0 && s.doorA === 1', label: 'action runs in parallel, adapted only to the configuration: B moves apart, A stays joined'},
    {at: 0.76, fn: 's.separatedB && !s.separatedA', label: 'the action is complete by u 0.76'},
    {at: 1, fn: "s.guide === 1 && s.noteShown === 1 && s.sameScale && s.separatedB && !s.separatedA && s.problems.length === 0", label: 'guide and neutral note at the hold; both scenes at the same scale; composition fits'},
    {at: 0.1, fn: 's.lookA.move === 0 && s.lookB.move === 0 && s.lookB.door === 1', label: 'seeking back restores the identical base exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.separatedA && !s.separatedB && s.configA === 'apart'", label: 'the geometry follows only the supplied configuration (swapped here)'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.separatedB && !s.separatedA', label: 'labels hidden: the same difference is visible'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [p.courts.building, p.courts.hearing, p.courts.deliberation, p.routes.track, p.routes.partition, p.seats.bench, ...p.seats.participants.map(q => q.name), p.labels.gap, p.labels.sequence, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  content: 'return [p.courts.hearing, p.courts.deliberation, p.scenarioA.label, p.scenarioB.label, p.changedFact];',
  captions: 'return [p.routes.track, p.routes.partition, p.seats.bench, p.labels.gap];',
});

// ---------------------------------------------------------------------------------------------
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; };";
const VB = "const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const vbox = e => { const r0 = e.getBoundingClientRect(); const a = new DOMPoint(r0.left, r0.top).matrixTransform(m), b = new DOMPoint(r0.right, r0.bottom).matrixTransform(m); return {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y}; };";
// the two scenes are the same size (equal weight) and large, on the real thresholds (AUTHORING item 18 and the
// 2026-09-26 layout rule): each >= 0.40 of the FRAME width side by side, >= 0.71 stacked, >= 0.55 when stacked beside
// a text column (here the headers' column at 1:1, or a right-hand text column)
const SCENES_LARGE = `(() => { ${VB}
  const A = vbox(svg.querySelector('[data-node="a-building"]')), B = vbox(svg.querySelector('[data-node="b-building"]'));
  const same = Math.abs(A.w - B.w) < 0.5 && Math.abs(A.h - B.h) < 0.5;
  const side = Math.abs(A.y - B.y) < 1;
  const hd = svg.querySelector('[data-node="a-header"]'); const H = hd ? vbox(hd) : null;
  const pn = svg.querySelector('[data-node="panel"]'); const PN = pn ? vbox(pn) : null;
  const besideText = (H && H.x + H.w <= A.x + 1 && H.w > 1) || (PN && PN.x >= A.x + A.w - 1 && PN.w > 1);
  const need = side ? 0.40 : besideText ? 0.55 : 0.71;
  return same && A.w >= need * vb.width;
})()`;
// the guide starts on A's changed detail and ends on B's
const GUIDE_ENDS = `(() => { ${BOX}
  const gd = svg.querySelector('[data-node="guide"] path'); const len = gd.getTotalLength(); const mm = gd.getScreenCTM();
  const p0 = gd.getPointAtLength(0).matrixTransform(mm), p1 = gd.getPointAtLength(len).matrixTransform(mm);
  const a = bx(svg.querySelector('[data-node="a-detail"]')), b = bx(svg.querySelector('[data-node="b-detail"]'));
  const near = (q, o) => q.x >= o.l - 4 && q.x <= o.r + 4 && q.y >= o.t - 4 && q.y <= o.b + 4;
  return near(p0, a) && near(p1, b);
})()`;
// nobody enters either abstract zone
const ZONES_EMPTY = `(() => { ${BOX}
  const hit = (a, b) => a.l < b.r - 2 && b.l < a.r - 2 && a.t < b.b - 2 && b.t < a.b - 2;
  return ['a', 'b'].every(P => { const z = bx(svg.querySelector('[data-node="' + P + '-zone"]').querySelector('rect')); return [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + P + '-p\\\\d$').test(e.getAttribute('data-node'))).every(e => !hit(bx(e), z)); });
})()`;

// the guide never runs inside an abstract zone (it is routed outside the plans, along the partition line)
const GUIDE_OUTSIDE = `(() => { ${BOX}
  const gd = svg.querySelector('[data-node="guide"] path'); const len = gd.getTotalLength(); const mm = gd.getScreenCTM();
  const zones = ['a', 'b'].map(P => bx(svg.querySelector('[data-node="' + P + '-zone"]').querySelector('rect')));
  for (let t = 0.02; t < 0.98; t += 0.01) { const q = gd.getPointAtLength(len * t).matrixTransform(mm); if (zones.some(z => q.x > z.l + 3 && q.x < z.r - 3 && q.y > z.t + 3 && q.y < z.b - 3)) return false; }
  return true;
})()`;

// the guide has a real channel (items 5 / 16): its path, in 1080p px, never retraces itself (no two parallel segments
// overlapping within 10 px, no reversal), and every stretch outside the plans keeps >= 24 px from the plans' outer walls
// (vertical stretches that enter a plan along its partition line are the two ends, allowed)
const GUIDE_CHANNEL = `(() => { ${VB}
  const unit = Math.min(vb.width, vb.height) / 1080;
  const gd = svg.querySelector('[data-node="guide"] path');
  const toks = gd.getAttribute('d').match(/[MHVL]|-?[\\d.]+/g); const pts = []; let cx = 0, cy = 0, cmd = null;
  for (let i = 0; i < toks.length;) { if (/[MHVL]/.test(toks[i])) { cmd = toks[i++]; continue; }
    if (cmd === 'M' || cmd === 'L') { cx = +toks[i++]; cy = +toks[i++]; } else if (cmd === 'H') cx = +toks[i++]; else cy = +toks[i++];
    pts.push([cx, cy]); }
  const M = svg.getScreenCTM().inverse().multiply(gd.getScreenCTM());
  const P = pts.map(([x, y]) => { const q = new DOMPoint(x, y).matrixTransform(M); return {x: q.x / unit, y: q.y / unit}; });
  const segs = []; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1]; if (Math.hypot(a.x - b.x, a.y - b.y) > 0.5) segs.push({a, b, hz: Math.abs(a.y - b.y) < 0.5}); }
  const bb = ['a', 'b'].map(q => { const v = vbox(svg.querySelector('[data-node="' + q + '-building"]')); return {l: v.x / unit, t: v.y / unit, r: (v.x + v.w) / unit, b: (v.y + v.h) / unit}; });
  const rng = (s, hz) => hz ? [Math.min(s.a.x, s.b.x), Math.max(s.a.x, s.b.x)] : [Math.min(s.a.y, s.b.y), Math.max(s.a.y, s.b.y)];
  const ov = (p, q) => Math.min(p[1], q[1]) - Math.max(p[0], q[0]);
  const bad = [];
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const s1 = segs[i], s2 = segs[j]; if (s1.hz !== s2.hz) continue;
    const d = s1.hz ? Math.abs(s1.a.y - s2.a.y) : Math.abs(s1.a.x - s2.a.x);
    if (j === i + 1 || (ov(rng(s1, s1.hz), rng(s2, s2.hz)) > 2 && d < 10)) bad.push('retrace ' + i + '/' + j);
  }
  segs.forEach((s, i) => { const [lo, hi] = rng(s, s.hz); const c = s.hz ? s.a.y : s.a.x;
    for (const B of bb) { const [l2, h2] = s.hz ? [B.l, B.r] : [B.t, B.b]; const [e0, e1] = s.hz ? [B.t, B.b] : [B.l, B.r];
      if (ov([lo, hi], [l2, h2]) <= 2) continue;
      if (c > e0 && c < e1) { if (s.hz) bad.push('inside ' + i); continue; }
      const dist = Math.min(Math.abs(c - e0), Math.abs(c - e1)); if (dist < 23.5) bad.push('clear ' + i + ' ' + dist.toFixed(1)); } });
  if (bad.length) throw new Error('guide channel: ' + bad.join(', '));
  return true;
})()`;

ratioChecks(ID, 'two equal scenes, the guide on the changed detail and outside the zones, zones empty', [
  {at: [1], dom: GUIDE_OUTSIDE, label: 'rendered: the comparative guide never runs inside either abstract zone'},
  {at: [1], dom: GUIDE_CHANNEL, label: 'rendered: the guide never retraces itself (no parallel segments within 10 px) and keeps >= 24 px (1080p) from the plans\' walls outside them'},
  {at: [0, 0.5, 1], dom: SCENES_LARGE, label: 'rendered: the two scenes are the same size and large (each >= 0.40 of the frame width side by side, >= 0.71 stacked, >= 0.55 beside a text column)'},
  {at: [1], tv: ['all'], dom: GUIDE_ENDS, label: 'rendered: the comparative guide runs from A\'s changed detail to B\'s'},
  {at: times(0, 1, 0.1), dom: ZONES_EMPTY, label: 'rendered: nobody enters either abstract zone'},
  {at: times(0, 1, 0.01), fn: 's.doorClosedBeforeMoveB', label: 'in the apart scene the door is closed before the public space moves (cause before effect)'},
  {at: [0, 0.5, 1], fn: 's.sameScale', label: 'both scenes are drawn at the same scale'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node^="a-badge"]', '[data-node^="b-badge"]', '[data-node="a-header"]', '[data-node="b-header"]', '[data-node="a-pmark"]', '[data-node="a-zmark"]', '[data-node="b-pmark"]', '[data-node="b-zmark"]']});
peopleSizeTest(ID, {names: ['a-p0', 'a-p1', 'a-p2', 'a-p3', 'b-p0', 'b-p1', 'b-p2', 'b-p3'], min: 60, step: 0.05});
equalWeightTest(ID, {chips: [], marks: ['[data-node="a-cue"]', '[data-node="b-cue"]']});
wordingTest(ID);
noArrowsTest(ID);
coldCreateTest(ID);
fillMostTest(ID, {at: [0.05, 0.3, 0.6, 1]});
thinContentTest(ID);
