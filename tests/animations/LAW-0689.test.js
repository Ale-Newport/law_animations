// LAW-0689 — Causas concurrentes · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (both marbles, both hands), anchoring of objects (each hand on its
// lever knob while pressing it; each marble on its own planks) and a transformation that is recognizable with the
// labels hidden (two routes each reach the same vase from its own side, nothing merged or added up).
// Windows (LAW-0689.js W): reach 0.05–0.13 · press 0.13–0.19 · gates 0.14–0.20 · runs 0.20 → strike 0.62 ·
// withdraw 0.24–0.31 · present 0.66–0.74 · tag 0.74–0.80 · notes 0.77–0.84 · key 0.80–0.86 (hold ≥ 840 ms).
// coordinator decision 2026-09-26: stress lengths capped to fit at 16 px (LAW-0687 precedent; see SESSION_HANDOFF)
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, LEADS_CLEAR, stageShare} from './causas-concurrentes-checks.js';

const ID = 'LAW-0689';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const FIVE = {events: {a: ['a1', 'a2', 'a3', 'a4', 'a5'].map(label => ({label})), b: ['b1', 'b2', 'b3', 'b4', 'b5'].map(label => ({label}))}};

contractSuite(ID, {
  continuity: ['marbleA', 'marbleB', 'handA', 'handB'],
  attach: [
    // each presenter's hand stays on its lever knob while pressing it
    {from: 0.131, to: 0.235, a: 'handA', b: 'knobA', tol: 1.5},
    {from: 0.131, to: 0.235, a: 'handB', b: 'knobB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.state.a === 'rest' && s.state.b === 'rest' && s.lossState === 'intact' && s.gateOpen.a === 0 && s.gateOpen.b === 0", label: 'rest: both marbles held by closed gates; loss intact'},
    {at: 0.14, fn: "s.state.a === 'rest' && s.state.b === 'rest' && s.pressing", label: 'nothing rolls before the gates open; the presenters are pressing'},
    {at: 0.3, fn: "s.state.a === 'rolling' && s.state.b === 'rolling' && s.marbleA.x < s.marbleB.x && s.apart", label: 'both routes run at the same time, each on its own rack'},
    {at: 0.45, fn: "['a','b'].every(k => s.joints[k].every((on, i) => i === 0 || !on || s.joints[k][i - 1]))", label: 'links are passed in the supplied order (no link before the one before it)'},
    {at: 0.6, fn: "s.lossState === 'intact' && s.cracked.a === 0 && s.cracked.b === 0", label: 'the loss is untouched until the marbles reach it (cause precedes the visible effect)'},
    {at: 1, fn: "s.state.a === 'at-loss' && s.state.b === 'at-loss' && s.cracked.a === 1 && s.cracked.b === 1 && s.lossState === 'cracked' && s.joints.a.every(Boolean) && s.joints.b.every(Boolean)", label: 'final hold: each route reaches the vase and leaves its own crack'},
    {at: 1, fn: 's.apart && Math.abs(s.contact.a) <= 1.5 && Math.abs(s.contact.b) <= 1.5 && s.marbleA.x < s.marbleB.x', label: 'nothing merges: each marble rests against the vase on its own side'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.state.b === 'held' && s.ghost.b === 1 && s.cracked.b === 0 && s.state.a === 'at-loss' && s.cracked.a === 1", label: 'unresolved: route B holds at its disputed link (ghost path); route A reaches the vase'},
    {at: 1, params: {finalState: 'unresolved-at-disputed-link'}, fn: "s.state.b === 'held' && s.held.b !== null && s.state.a === 'at-loss'", label: 'unresolved without a supplied disputed link: route B holds at its middle link'},
    {at: 1, params: {actionProgress: 0.35}, fn: "s.lossState === 'intact' && s.actionCapped && s.state.a !== 'at-loss'", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: FIVE, fn: "s.state.a === 'at-loss' && s.state.b === 'at-loss' && s.joints.a.length === 5 && s.joints.b.length === 5", label: 'five events per route: both runs reach the vase'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.statusChips.includes('tag') && s.statusChips.includes('held')", label: 'item 14: the supplied status tag AND the held status are both drawn (two chips)'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.state.a === 'at-loss' && s.state.b === 'at-loss' && s.cracked.a === 1 && s.cracked.b === 1", label: 'labels hidden: the same physical action happens'},
  ],
});

ratioChecks(ID, 'layout fits; hands reach; routes stay apart', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback && s.layout.fits', label: 'the layout fits the design box without a fallback scale'},
  {at: times(0, 1, 0.05), fn: 's.allReached && s.apart', label: 'hands reach their targets; the two marbles never meet'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, leaders clear, stage share', [
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: LEADS_CLEAR, tv: ['all'], label: 'no leader passes over another text'},
  {at: [1], dom: stageShare(['st-racka', 'st-rackb', 'st-floor'], 0.5, 0.5), label: 'the stage (racks + floor) spans ≥ 50 % of the caption-safe width or height'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.events.a.map(e => e.time), ...p.events.b.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.routeLabels.a, p.routeLabels.b, p.presenters.a.name, p.presenters.b.name, p.actorLabels.a, p.actorLabels.b, p.objectLabels.tag, p.objectLabels.stand, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), p.routeLabels.a, p.routeLabels.b]",
  captions: "return ['As supplied · routes not added up · no conclusion drawn', 'Según lo aportado · rutas sin sumar · sin conclusión']",
});

// Coordinator bar: key text >= 19.5 px in baseline AND baseline-es in every ratio (layout size = px at 1080p, the
// design spaces are sized to scale ~1.0 in every ratio).
ratioChecks(ID, 'baseline and baseline-es text >= 19.5 px', [
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.layout.size >= 19.5 && s.layout.k === 1', label: 'text size >= 19.5 px without a fallback scale'},
]);

textSizeOverTime(ID);

// baseline-es is a Spanish baseline: no English default (e.g. the presenter role "Presenter") may be drawn.
ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Presenter|Route|Cause|Loss|Link)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);
