// LAW-0697 — Daño material · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (the tin, the chip, the plotter pen), anchoring of objects (the tin rides
// the shelf board until it slides off; the chip is the piece of the lip until it breaks off; nothing on the object
// changes before the tin touches it) and a transformation recognizable with the labels hidden (the object goes from
// intact to altered next to the record, and the plotter writes the after row).
// Windows (LAW-0697.js W): tilt 0.15–0.22 · slide 0.19–0.26 · fall 0.26–0.33 · contact 0.33 · crack 0.33–0.42 · chip
// 0.345–0.43 (panel scratches 0.35–0.45) · plotter to the row 0.46–0.52 · write 0.52–0.68 · park 0.68–0.73 · status
// 0.75–0.80 · notes 0.77–0.82 · key 0.79–0.84 (hold ≥ 960 ms).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, frameShare, coldCreate} from './dano-material-checks.js';

const ID = 'LAW-0697';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tin', 'chip', 'tip', 'objTop'],
  semantic: [
    {at: 0, fn: "s.phase === 'rest' && !s.altered && s.tilt === 0 && s.written === 0 && s.afterIcon === 0", label: 'rest: the object is intact, the tin on the shelf, the after row blank'},
    {at: 0.3, fn: '!s.altered && s.tilt > 0', label: 'the tin is still falling: the object has not changed yet (cause precedes effect)'},
    {at: 0.329, fn: '!s.altered', label: 'nothing on the object changes before contact'},
    {at: 0.4, fn: 's.altered && s.markA > 0', label: 'after contact the object changes (first mark)'},
    {at: 0.5, fn: 's.markA === 1 && s.markB === 1 && s.written === 0', label: 'both marks complete before the record is written'},
    {at: 0.6, fn: 's.written > 0 && s.written < 1 && s.afterIcon === 1', label: 'the plotter writes the after row'},
    {at: 1, fn: "s.written === 1 && s.statusShown && s.keyShown && s.phase === 'done'", label: 'hold: the after row written; status and key shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.kind === 'panel' && s.finalState === 'entry-disputed' && s.markA === 1 && s.markB === 1", label: 'alternative: a dented, scratched panel; after entry disputed as supplied'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.written === 0', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.altered && s.written === 1', label: 'labels hidden: the same physical change and the written (simulated) row'},
  ],
});

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, scene share', [
  {at: [0, 0.35, 0.7, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: frameShare(['floor', 'sh-post', 'table', 'objg', 'rec'], 0.55, 0.55), label: 'the scene (stage and record) spans >= 55 % of the frame width or height'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.object.before, p.actorLabels.a, p.actorLabels.b, p.objectLabels.record, p.objectLabels.before, p.objectLabels.after, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), p.object.before]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5);
textSizeOverTime(ID);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Incident|Object|record|before|after|supplied|conclusion|Altered|Link)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

coldCreate(ID);
