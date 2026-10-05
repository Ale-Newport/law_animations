// LAW-0254 — Comunicación a la contraparte · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its component (edge to edge, following the components while they
// move or enlarge), the order does not change when seeking, and a relation is never drawn as causality by default
// (plain lines with end dots; a sequence has a solid start and a hollow end; no arrowheads; a causal mark only when a
// relationship is supplied as causal).
// Timing (u): separate 0.02–0.14 · name chips 0.12–0.18 · relationships drawn one after another 0.19–0.42 · tracer
// 0.44–0.73 (the focus element enlarged 1.15× while the tracer is on it, back by 0.785; each stop lights and each leg's
// calendar cell opens as the tracer passes along the track) · the supplied state 0.78–0.83.
// People are portrait badges: the badge (head and shoulders) is >= 96 px across at 1080p in every preset × ratio.
// Coordinator decision (standing rule, AUTHORING item 20): the long-labels-stress preset is capped — two stops and three
// legs (near-maximum names and dates), four element labels of 33–42 characters, the two sequence legs unlabelled and
// tray labels of 23 characters, instead of three stops, four legs, seven labels of 44–54, six relationship labels and
// tray labels of 35 — because with the near-maximum values no arrangement fits 1:1 at >= 16 px with badges >= 96 px
// (best: 1.32 × the region's height), the sequence labels beside the trays find no free place and the trays' name chips
// find none at 9:16; the fallbacks and measurements are in the presets note. Every other stress field stays at
// near-maximum length. Every check below applies to it unchanged.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {CARDS_CLEAR, IN_FRAME, TEXT_OFF_BARS, NEUTRAL_MARKERS} from './requerimiento-previo-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, headSizeTest, neutralityTest, noArrowsTest,
  seekHistoryTest, blankWindowTest, esDefaultsTest, chipsOffTest, fillTest,
} from './comunicacion-contraparte-checks.js';

const ID = 'LAW-0254';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.explode === 0 && s.relationsDrawn.every(v => v === 0) && s.stateShown === 0", label: 'start: the parts gathered, no relationship drawn, no state'},
    {at: 0.3, fn: "s.explode === 1 && s.relationsDrawn[0] === 1 && s.relationsDrawn[s.relationsDrawn.length - 1] === 0", label: 'relate: the relationships are drawn one after another'},
    {at: 0.5, fn: "s.tracerVisible && s.relationsDrawn.every(v => v === 1) && s.stateShown === 0", label: 'trace: the tracer runs along the drawn relationships; no state yet'},
    {at: 0.74, fn: "s.legsDone === s.legs", label: 'every leg is done once the tracer has passed the whole track'},
    {at: 1, fn: "s.beat === 'gather' && s.stateShown === 1 && s.plan === 'documented' && s.markerShown === 0 && s.arrowheads === 0 && s.problems.length === 0", label: 'gather: the supplied state (documented ●); no arrowheads; composition clean'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.plan === 'questioned' && s.markerShown === 1 && s.focus === 'calendar' && s.problems.length === 0", label: 'questioned (as supplied): ◆ and the dashed disputed marker; the calendar is the focus'},
    {at: 0.35, fn: "s.stateShown === 0 && s.legsDone === 0", label: 'seeking back restores the earlier state'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.stateShown === 1 && s.legsDone === s.legs", label: 'labels hidden: the same mechanism and state'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.problems.length === 0', label: `${n}: clean composition`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const q = p.finalState === 'questioned'; const n = p.stages.length + 1; const legs = Array.from({length: n}, (_, i) => p.dates.legs[i] ?? '—'); const el = id => (p.elements.find(e => e.id === id) || {}).label; return [el('partyA') || p.parties[0].name + ' · ' + p.parties[0].role, el('partyB') || p.parties[1].name + ' · ' + p.parties[1].role, el('file') || p.documents.caseFile.ref + ' · ' + p.documents.caseFile.title, el('calendar') || p.objectLabels.calendar, ...p.stages, ...legs, p.objectLabels.outTray, p.objectLabels.inTray, q ? p.objectLabels.questioned : p.objectLabels.documented, ...p.relationships.filter(r => r.label).map(r => r.label), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])];",
  content: "const q = p.finalState === 'questioned'; return [...p.stages, q ? p.objectLabels.questioned : p.objectLabels.documented];",
  captions: "return [p.relationLabels.sequence];",
});

// ---------------------------------------------------------------------------------------------
// every connector ends on its two components' rendered boxes (within 3 px) while it is visible
const ENDS_ON = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const near = (q, b) => q.x >= b.left - 3 && q.x <= b.right + 3 && q.y >= b.top - 3 && q.y <= b.bottom + 3;
  for (const ln of svg.querySelectorAll('[data-node$="-line"][data-from]')) {
    if (eff(ln) < 0.3) continue;
    const len = ln.getTotalLength(); if (len < 1) continue;
    const m = ln.getScreenCTM();
    const a = ln.getPointAtLength(0).matrixTransform(m), b = ln.getPointAtLength(len).matrixTransform(m);
    const A = svg.querySelector('[data-node="cmp-' + ln.dataset.from + '"]').getBoundingClientRect(), B = svg.querySelector('[data-node="cmp-' + ln.dataset.to + '"]').getBoundingClientRect();
    if (!near(a, A) || !near(b, B)) return false;
  }
  return true;
})()`;
// each relationship label sits <= 24 px (1080p) from its own connector and nearer it than any other connector
const LABEL_NEAR = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const lines = [...svg.querySelectorAll('[data-node$="-line"][data-from]')];
  const pts = ln => { const m = ln.getScreenCTM(), L = ln.getTotalLength(), out = []; for (let j = 0; j <= 40; j++) out.push(ln.getPointAtLength(L * j / 40).matrixTransform(m)); return out; };
  const P2 = lines.map(pts);
  const dist = (b, ps) => Math.min(...ps.map(q => Math.hypot(Math.max(b.left - q.x, 0, q.x - b.right), Math.max(b.top - q.y, 0, q.y - b.bottom))));
  for (const lab of svg.querySelectorAll('[data-node^="rlab"][data-node$="-card"]')) {
    if (eff(lab) < 0.5) continue;
    const i = +lab.dataset.node.match(/rlab(\\d+)/)[1];
    const b = lab.getBoundingClientRect();
    const own = dist(b, P2[i]);
    const other = Math.min(Infinity, ...P2.filter((_, j) => j !== i).map(ps => dist(b, ps)));
    if (own / K > 24 || other <= own) return false;
  }
  return true;
})()`;

ratioChecks(ID, 'connectors end on their components, labels beside their own connector, in frame, cards own their text', [
  {at: [0.25, 0.42, 0.5, 0.6, 0.7, 0.9, 1], dom: ENDS_ON, label: 'RENDERED: every visible connector ends on its two components (following enlargement)'},
  {at: [0.45, 0.6, 1], tv: ['all'], dom: LABEL_NEAR, label: 'RENDERED: each relationship label is <= 24 px from its own connector and nearer it than any other'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [0, 0.5, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005});
noOverlapTest(ID, {step: 0.01, markers: ['[data-node="tracer"]', '[data-node="m-cue"]', '[data-node^="cmp-"]']});
headSizeTest(ID, {min: 96, step: 0.02, sel: '[data-node$="-badge"]'});
chipsOffTest(ID, {chips: '[data-node$="-chip"], [data-node="key"], [data-node^="rlab"]:not([data-node*="-"])', props: '[data-node^="cmp-"]', step: 0.02, heads: '[data-node$="-badge"]'});
fillTest(ID, {at: [0.5, 1], a: 0.85, b: 0.5});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
blankWindowTest(ID, {selectors: ['[data-node="plan"]', '[data-node="panel"]']});
coldCreateTest(ID);
esDefaultsTest(ID);
