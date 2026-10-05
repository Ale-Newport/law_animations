// LAW-0691 — Causas concurrentes · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (only the padlock on the gate of the
// route that is not run, as supplied in `released`) and no legal consequence is invented (each running route is
// shown reaching the loss as supplied; nothing is added up, no share, winner or outcome).
// Windows (LAW-0691.js W): base 0–0.17 · badges 0.17–0.22 · locks 0.19–0.27 · rings 0.22–0.28 · change chip
// 0.24–0.30 · gates 0.40–0.45 · runs 0.43 → strike 0.70 · results 0.76–0.81 · guide 0.77–0.84 · notes 0.80–0.86 ·
// key 0.82–0.87 (hold ≥ 975 ms).
// coordinator decision 2026-09-26: stress lengths capped to fit at 16 px (LAW-0687 precedent; see SESSION_HANDOFF)
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME} from './causas-concurrentes-checks.js';

const ID = 'LAW-0691';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['aMarbleA', 'aMarbleB', 'bMarbleA', 'bMarbleB'],
  semantic: [
    {at: 0.1, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.lossState === "intact"', label: 'base: two identical complete scenes'},
    {at: 0.35, fn: 's.a.lock.b === 1 && s.a.lock.a === 0 && s.b.lock.a === 1 && s.b.lock.b === 0 && s.a.state.a === "rest" && s.b.state.b === "rest"', label: 'change: a padlock only on the gate of the route not run in each scene, before anything moves'},
    {at: 0.55, fn: 's.a.state.a === "rolling" && s.a.state.b === "rest" && s.b.state.b === "rolling" && s.b.state.a === "rest"', label: 'parallel: A runs route A, B runs route B; the locked marbles stay'},
    {at: 0.66, fn: 's.a.lossState === "intact" && s.b.lossState === "intact"', label: 'the loss is untouched until a marble reaches it'},
    {at: 1, fn: 's.a.state.a === "at-loss" && s.a.cracked.a === 1 && s.a.cracked.b === 0 && s.b.state.b === "at-loss" && s.b.cracked.b === 1 && s.b.cracked.a === 0', label: 'each scene: its running route reaches the vase on its own side; one crack each'},
    {at: 1, fn: 's.guideProgress === 1 && s.resultsShown && JSON.stringify(s.changedRoutes) === JSON.stringify(["a","b"])', label: 'the guide joins the changed detail; both supplied results shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.a.state.a === "at-loss" && s.a.state.b === "at-loss" && s.a.cracked.a === 1 && s.a.cracked.b === 1 && s.b.state.b === "rest" && s.b.lock.b === 1 && JSON.stringify(s.changedRoutes) === JSON.stringify(["b"])', label: 'alternative: both routes in A (two separate cracks, not merged); B keeps route B locked'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.a.cracked.a === 1 && s.b.cracked.b === 1 && s.a.lock.b === 1', label: 'labels hidden: the same physical contrast'},
  ],
});

identicalBeforeChange(ID, 0.17);

ratioChecks(ID, 'layout fits; scenes large; side by side or full width', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback && s.layout.fits', label: 'the block fits without a fallback scale'},
  // stack: scenes stacked beside a right-hand text column keep >= 0.55 of the frame width (AUTHORING item 20 threshold)
  {at: [1], fn: "s.layout.row ? s.layout.stageW / s.layout.blockW >= 0.4 : s.layout.arr === 'stack' ? s.layout.stageW / s.layout.blockW >= 0.55 : s.layout.stageW / s.layout.blockW >= 0.8", label: 'each scene >= ~40 % of the width side by side / >= 0.55 stacked beside the text column / full width when stacked alone'},
  {at: times(0.43, 0.7, 0.03), fn: "new Set([s.a, s.b].flatMap(sc => ['a', 'b'].filter(k => sc.state[k] !== 'rest').map(k => sc.state[k]))).size <= 1", label: 'every running marble in both scenes is in the same phase at the same instant (same take)'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text', [
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.events.a.map(e => e.time), ...p.events.b.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.routeLabels.a, p.routeLabels.b, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]",
  content: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.losses.map(l => l.label), p.scenarioA.label, p.scenarioB.label, p.changedFact]",
  captions: "return ['As supplied · routes not added up · no conclusion drawn', 'Según lo aportado · rutas sin sumar · sin conclusión']",
});

// Coordinator bar: key text >= 19.5 px in baseline AND baseline-es in every ratio (layout size = px at 1080p, the
// design spaces are sized to scale ~1.0 in every ratio).
ratioChecks(ID, 'baseline and baseline-es text >= 19.5 px', [
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.layout.size >= 19.5 && s.layout.k === 1', label: 'text size >= 19.5 px without a fallback scale'},
]);

textSizeOverTime(ID);

// baseline-es is a Spanish baseline: no English default text may be drawn.
ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Presenter|Route|Cause|Loss|Link|Before|After|Datum|Context)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);
