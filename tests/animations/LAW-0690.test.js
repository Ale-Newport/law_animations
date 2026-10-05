// LAW-0690 — Causas concurrentes · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the visit order does not change when seeking, and a
// relation is never drawn as causality by default (causal only where supplied; plain relations have no arrowhead).
// Windows (LAW-0690.js W): spread 0.02–0.16 · relationships 0.19–0.42 (one by one) · tracers 0.45–0.72 (both at
// once, each on its own conduit) · focus swell on arrival, back by 0.78 · states 0.76–0.82 · band 0.78–0.86 · key
// 0.80–0.86 (hold ≥ 980 ms).
// coordinator decision 2026-09-26: stress lengths capped to fit at 16 px (LAW-0687 precedent; see SESSION_HANDOFF)
// Standing coordinator rule (AUTHORING item 20) applied to the stress preset for item 18 at 1:1: event labels 32–35
// chars, alternatives 35–37, first loss 46 (near-maximum lengths gave 91 px tiles / board 0.30 of the height).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME} from './causas-concurrentes-checks.js';

const ID = 'LAW-0690';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const A = "JSON.stringify(s.visitOrderA)", B = "JSON.stringify(s.visitOrderB)";

contractSuite(ID, {
  continuity: ['tracerA', 'tracerB'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.spread === 0', label: 'separate: components start together; no relationship drawn yet'},
    {at: 0.18, fn: 's.spread === 1 && s.relationsDrawn.every(p => p === 0)', label: 'components are in place before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all supplied relationships exist before the tracers move'},
    {at: 0.6, fn: `${A} === JSON.stringify(['sourceA','a1','a2']) && ${B} === JSON.stringify(['sourceB','b1','b2'])`, label: 'both tracers move at the same time, each through its own route in the supplied order'},
    {at: 1, fn: `${A} === JSON.stringify(['sourceA','a1','a2','a3','loss']) && ${B} === JSON.stringify(['sourceB','b1','b2','b3','loss']) && s.stateShown === 1`, label: 'each tracer ends at the loss; both arrival states shown'},
    {at: 1, fn: 's.portsApart > 100 && s.tracersApart > 100', label: 'nothing merges: two separate ports on the loss, the tracers stay apart'},
    {at: 0.3, fn: `${A} === '[]' && ${B} === '[]'`, label: 'seeking back: the order restarts (nothing visited before the trace beat)'},
    {at: 1, fn: 's.connectorGaps.length === 8 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge (or its own port)'},
    {at: 1, fn: "s.kinds.every(k => k.kind === 'sequence') && !s.kinds.some(k => k.kind === 'causal')", label: 'no causal link unless supplied (default: sequence as supplied)'},
    {at: 0.745, fn: 's.focusScale > 1.05', label: 'the focus element (the loss) swells as the tracers arrive'},
    {at: 1, fn: 's.focusScale === 1', label: 'the focus element is back to size for the hold'},
    {at: 1, params: {traversalOrder: ['sourceA', 'a2', 'a1', 'loss', 'sourceB', 'b1', 'loss']}, fn: `${A} === JSON.stringify(['sourceA','a2','a1','loss']) && ${B} === JSON.stringify(['sourceB','b1','loss'])`, label: 'a different supplied order is followed as supplied'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.kinds.some(k => k.kind === 'causal') && s.kinds.some(k => k.kind === 'relation' && k.arrow === false) && s.connectorGaps.every(g => g <= 16)", label: 'alternative: one supplied causal link; the plain relation has no arrowhead'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.atLoss.a && s.atLoss.b', label: 'labels hidden: the same map and routes'},
  ],
});

ratioChecks(ID, 'layout fits; connectors land; tracers apart', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
  {at: [1], fn: 's.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
  {at: times(0.45, 1, 0.05), fn: 's.tracersApart > 60', label: 'the two tracers never meet'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text', [
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.events.a.map(e => e.time), ...p.events.b.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.routeLabels.a, p.routeLabels.b, ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])]",
  content: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.losses.map(l => l.label), p.routeLabels.a, p.routeLabels.b]",
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

// AUTHORING item 11: with labels hidden the board fills most of the safe box height in every ratio.
ratioChecks(ID, 'labels hidden: the board fills the box', [
  {at: [1], tv: ['none'], fn: 's.layout.boardShare >= 0.85 && s.layout.k === 1', label: 'labels hidden: board >= 85 % of the design height'},
]);
