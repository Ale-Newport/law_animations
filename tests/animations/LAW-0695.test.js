// LAW-0695 — Evento interviniente · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (only whether the later event enters:
// A's bay latch drops and its later event stays parked; B's crane carries it into the slot) and no legal consequence is
// invented (each scene shows only its SUPPLIED result; no winner, share, score or outcome).
// Windows (LAW-0695.js W): base 0–0.17 (lookA = lookB) · rings 0.18–0.24 · A latch 0.18–0.24 · B carry 0.19–0.32,
// lower 0.32–0.37, release 0.37–0.39, rise 0.39–0.43 · same take from 0.47 in both · results 0.76–0.81 · guide
// 0.77–0.84 · notes 0.80–0.86 · key 0.82–0.87 (hold ≥ 975 ms).
// coordinator decision 2026-09-26 (standing stress cap rule, LAW-0687/0689–0692 precedent; see SESSION_HANDOFF): the
// long-labels-stress lengths are capped to the longest tried values that fit every ratio at >= 16 px (measurements in
// LAW-0695.presets.json); every field stays longer than the baseline and every count >= the baseline.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, equalWeight} from './evento-interviniente-checks.js';

const ID = 'LAW-0695';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['aClaw', 'bClaw', 'aAdded', 'bAdded', 'aBob', 'bBob'],
  attach: [
    {from: 0, to: 0.369, a: 'bClaw', b: 'bAdded', tol: 1.5},
    {from: 0, to: 1, a: 'aClaw', b: 'aAdded', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.lossState[0] === "intact"', label: 'base: two identical complete scenes'},
    {at: 0.3, fn: 's.a.latch === 1 && s.b.latch === 0 && s.b.carry > 0 && !s.b.placed && s.a.angles.every(a => a === 0)', label: 'change: A’s latch drops (the later event stays in the bay) while B’s crane carries it'},
    {at: 0.45, fn: 's.b.placed && !s.a.placed && s.a.angles.every(a => a === 0) && s.b.angles.every(a => a === 0)', label: 'the later event stands in B’s slot before anything moves; A’s slot stays empty'},
    {at: 0.55, fn: 's.a.angles[0] > 0 && s.b.angles[0] > 0 && s.a.angles[0] === s.b.angles[0]', label: 'parallel: both scenes run the same take'},
    {at: 1, fn: 's.a.lossState[0] === "down" && s.b.lossState[0] === "down" && s.a.bridge !== null && s.b.joints[s.k] !== null && s.guideProgress === 1 && s.resultsShown', label: 'each scene reaches the vase as supplied (A across the empty slot, B through the later event); guide and results shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.a.lossState[0] === "down" && s.b.lossState[0] === "intact" && s.b.ghost === 1', label: 'alternative: A reaches the loss; B is held unresolved at the later event’s disputed link (as supplied)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.b.placed && !s.a.placed && s.a.latch === 1', label: 'labels hidden: the same physical contrast'},
  ],
});

identicalBeforeChange(ID, 0.17);

ratioChecks(ID, 'layout fits; scenes large', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the block fits without a fallback scale'},
  // AUTHORING item 20: >= ~40 % of the frame width side by side / >= 0.55 stacked beside a text column / >= 0.71 stacked alone
  // (measured against the FRAME width, in design units)
  {at: [1], fn: "s.layout.row ? s.layout.sw / s.layout.frameW >= 0.4 : s.layout.sideW ? s.layout.sw / s.layout.frameW >= 0.55 : s.layout.sw / s.layout.frameW >= 0.71", label: 'scene share of the FRAME width'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight', [
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [0.5, 1], dom: equalWeight(['ring0', 'ring1']), label: 'the two slot rings have equal weight (same solid stroke, no dashes)'},
  {at: [1], tv: ['all'], dom: "(svg.querySelector('[data-node=\"result0\"]') ? " + equalWeight(['result0', 'result1']) + " : " + equalWeight(['note-res0', 'note-res1']) + ")", label: 'the two supplied results have equal weight'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), p.addedEvent.label, p.addedEvent.time, ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]",
  content: "return [...p.events.map(e => e.label), p.addedEvent.label, ...p.losses.map(l => l.label), p.scenarioA.label, p.scenarioB.label, p.changedFact]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

ratioChecks(ID, 'baseline and baseline-es text >= 19.5 px', [
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.layout.size >= 19.5 && s.layout.k === 1', label: 'text size >= 19.5 px without a fallback scale'},
]);

textSizeOverTime(ID);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Initial|Later|Link|Loss|Reaches|Held|Same|supplied|event|sequence|conclusion)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);
