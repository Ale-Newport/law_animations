// LAW-0235 — Archivo judicial · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist in full, exactly the indicated fact changes (the supplied state of the
// file: A active ●, B archived ◆ — which alters the block that opens and the route, mirrored and of equal length), and
// no legal consequence is invented to complete the contrast (no winner, score, rule or outcome; "archived" is only
// another shelf block).
// Scene shares of the FRAME width (AUTHORING item 20): side by side >= 0.40 (16:9 and 1:1: two compact plans with
// two-unit blocks), stacked >= 0.71 (9:16). People >= 60 px in every ratio (the 1:1 floor is 55 px baseline / 45 px
// stress; the scene keeps >= 60 px anyway).
// Timing (u): base 0–0.17 · header labels 0.17–0.23 · stamps 0.18–0.24 · pulses 0.24–0.30 · lamps 0.295–0.325 ·
// units roll 0.34–0.45 · clerks walk out 0.36–0.54 · reach 0.54–0.565 · pull 0.565–0.59 · back 0.60–0.72 · let go
// 0.725–0.75 · guide 0.78–0.83 · note 0.81–0.86; everything is still from u 0.86.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, equalWeightTest, neutralityTest,
  noArrowsTest, seekHistoryTest, blankWindowTest,
} from './archivo-judicial-checks.js';

const ID = 'LAW-0235';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['clerkA', 'clerkB', 'fileA', 'fileB'],
  attach: [
    {from: 0.595, to: 0.72, a: 'fileA', b: 'handsA', tol: 0.5},
    {from: 0.595, to: 0.72, a: 'fileB', b: 'handsB', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.cue === null", label: 'base: the two scenes are identical (only the lane badges differ)'},
    {at: 0.335, fn: "s.lookA.cue === 'active' && s.lookB.cue === 'archived' && s.a.lamp === 1 && s.b.lamp === 1 && s.a.open === 0", label: 'introduce: A is stamped ●, B ◆; each pulse lights the lamp of its block before any unit rolls'},
    {at: 0.5, fn: "s.a.open === 1 && s.b.open === 1 && s.a.block === 'active' && s.b.block === 'archived'", label: 'action: A opens its ● block, B its ◆ block (the changed fact alters geometry and route)'},
    {at: 0.65, fn: "s.a.holder === 'clerk' && s.b.holder === 'clerk' && JSON.stringify(s.lookA.clerk) === JSON.stringify(s.lookB.clerk)", label: 'the two clerks carry their files on mirrored routes at the same moment'},
    {at: 0.77, fn: "s.a.holder === 'tray' && s.b.holder === 'tray'", label: 'each file is set in the tray of its state by u 0.77'},
    {at: 1, fn: 's.guide === 1 && s.problems.length === 0', label: 'guide: the comparison guide joins the two stamps; the composition fits'},
    {at: 0.1, fn: "s.a.holder === 'shelf' && s.b.holder === 'shelf' && s.guide === 0", label: 'seeking back restores the base state'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.a.holder === 'tray' && s.b.holder === 'tray' && s.guide === 1", label: 'labels hidden: the same contrast plays'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [p.courts.building, p.courts.archive, p.courts.active, p.courts.archived, p.routes.rails, p.routes.locator, p.seats.counter, p.seats.clerk.name, p.labels.sequence, p.labels.key, p.file.identifier, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  content: 'return [p.scenarioA.label, p.scenarioB.label, p.changedFact, p.file.identifier, p.courts.active, p.courts.archived];',
  captions: 'return [p.routes.rails, p.routes.locator, p.seats.counter];',
});
identicalBeforeChange(ID, 0.17);

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden).
// scene width share of the FRAME: side by side (16:9, 1:1) >= 0.40, stacked (9:16) >= 0.71; measured on the rendered
// plan of each scene (room, blocks, counter and clerk)
const SHARES = `(() => {
  const F = svg.getBoundingClientRect();
  const ws = ['a-view', 'b-view'].map(n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect());
  const stacked = F.height > F.width * 1.2;
  const need = stacked ? 0.71 : 0.4;
  return ws.every(b => b.width / F.width >= need);
})()`;
// the two scenes are the same size and never touch
const SAME_SIZE = `(() => { const [a, b] = ['a-room', 'b-room'].map(n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect()); return Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1 && !(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom); })()`;
// the guide ends on the two stamps (rings) and does not cross a text
const GUIDE = `(() => {
  const gd = svg.querySelector('[data-node="guide"]');
  const rings = [...gd.querySelectorAll('circle')].map(c => c.getBoundingClientRect());
  const stamps = ['a-stamp', 'b-stamp'].map(n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect());
  const inRing = (s, q) => Math.abs((s.left + s.right) / 2 - (q.left + q.right) / 2) < 3 && Math.abs((s.top + s.bottom) / 2 - (q.top + q.bottom) / 2) < 3;
  if (!stamps.every((s, i) => inRing(s, rings[i]))) return false;
  const path = gd.querySelector('path'); const m = path.getScreenCTM(); const len = path.getTotalLength();
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect());
  for (let j = 1; j < 60; j++) { const q = path.getPointAtLength(len * j / 60).matrixTransform(m); if (texts.some(o => q.x > o.left && q.x < o.right && q.y > o.top && q.y < o.bottom)) return false; }
  return true;
})()`;
// the header cue, stamp and plaque of A and B: ● vs ◆ of equal ink area (never a colour, dash or strike)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";

ratioChecks(ID, 'scene shares of the frame, equal scenes, the guide on the stamps, the frame filled', [
  {at: [0, 0.5, 1], dom: SHARES, label: 'rendered: each scene >= 0.40 of the frame width side by side, >= 0.71 stacked'},
  {at: [0, 1], dom: SAME_SIZE, label: 'rendered: the two scenes have the same size and never touch'},
  {at: [0.85, 1], tv: ['all'], dom: GUIDE, label: 'rendered: the guide ends on the two stamps and crosses no text'},
  {at: [1], dom: FILL, label: 'rendered: the scenes and the strip fill the caption-safe box'},
  {at: times(0, 1, 0.01), fn: 'JSON.stringify(s.lookA.clerk) === JSON.stringify(s.lookB.clerk) && s.lookA.open === s.lookB.open && s.lookA.holder === s.lookB.holder', label: 'the two scenes run the same (mirrored) route, timing and states at every u'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
// (the guide's path is checked point by point against every text above; its bounding box is not a covering shape)
noOverlapTest(ID, {step: 0.01, markers: ['[data-node="a-clerk"]', '[data-node="b-clerk"]', '[data-node="a-file"]', '[data-node="b-file"]', '[data-node="a-stamp"]', '[data-node="b-stamp"]']});
peopleSizeTest(ID, {names: ['a-clerk', 'b-clerk'], min: 60, step: 0.02});
equalWeightTest(ID, {chips: [['[data-node="legend-active"]', '[data-node="legend-archived"]']], marks: [['[data-node="a-hd-cue"]', '[data-node="b-hd-cue"]'], ['[data-node="a-stamp-mark"]', '[data-node="b-stamp-mark"]'], ['[data-node="a-mark0"]', '[data-node="a-mark1"]'], ['[data-node="b-tmark0"]', '[data-node="b-tmark1"]']], at: [0, 0.3, 0.6, 1]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
blankWindowTest(ID, {selectors: ['[data-node="a-room"]', '[data-node="b-room"]', '[data-node="panel"]', '[data-node$="header"]']});
coldCreateTest(ID);
