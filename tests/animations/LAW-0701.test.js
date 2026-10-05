// LAW-0701 — Pérdida económica · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (every token drops from the hopper, slides out through a gate and lands
// on its tray), anchoring (tokens stay in the column or on a tray; nothing moves before its step) and a transformation
// recognizable with the labels hidden (the stack rises, the stated difference leaves through the ◆ gate, ● / ◆ arms
// and the bracket mark the two levels).
// Windows (LAW-0701.js W): legend 0.02–0.10 · flow 0.15–0.42 · ● arm 0.43–0.47 · stated difference out 0.48–0.64 · ◆
// arm 0.64–0.68 · bracket 0.67–0.71 · difference chip 0.70–0.74 · status 0.76–0.80 · notes 0.78–0.82 · key 0.80–0.84.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; subject >= 0.20 of the frame height,
// causation-05 LAW-0700 decision in production/SESSION_HANDOFF.md): the long-labels-stress COUNTS are capped; true
// driver, fallbacks tried and rendered before/after numbers in LAW-0701.presets.json.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, inFrameSweep, sceneAreaShare, chipsClearOfProps} from './perdida-economica-checks.js';

const ID = 'LAW-0701';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tok0', 'tokLast'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.stack === 0 && s.outOnTray === 0 && s.gapOnTray === 0 && s.refArm === 0 && s.allegedArm === 0", label: 'rest: empty column, empty trays, no arm'},
    {at: 0.3, fn: 's.flow > 0 && s.flow < 1 && s.gap === 0 && s.activeEntry !== null', label: 'the supplied entries run one after another; the stated difference has not moved'},
    {at: 0.425, fn: 's.flow === 1 && s.stack === s.refTokens && s.gapOnTray === 0', label: 'the flow reaches the reference level before anything else'},
    {at: 0.47, fn: 's.refArm === 1 && s.allegedArm === 0 && s.gap === 0', label: 'the ● arm marks the reference level (as stated) before the gate opens'},
    {at: 0.66, fn: 's.gap === 1 && s.stack === s.allegedTokens && s.gapOnTray === s.gapTokens', label: 'exactly the supplied stated difference leaves through the ◆ gate'},
    {at: 1, fn: "s.refArm === 1 && s.allegedArm === 1 && s.bracket === 1 && s.diffShown && s.keyShown && s.finalState === 'difference-stated'", label: 'hold: both arms, the bracket, the stated difference and the key'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'difference-disputed' && s.stack === s.allegedTokens", label: 'alternative: the stated difference marked disputed as supplied (never decided)'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.stack === s.allegedTokens && s.allegedArm === 1', label: 'labels hidden: the same flows, levels and gap'},
  ],
});

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight of the two arms', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: equalWeight(['armRef', 'armAll']), label: 'the ● and ◆ arms have identical weight, both solid'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.record, p.objectLabels.reference, p.objectLabels.alleged, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Flow|record|Reference|Alleged|Stated|supplied|conclusion|units|fictional|Link)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

// no alarm styling: nothing in the scene is drawn in the theme's red accent
ratioChecks(ID, 'no red for the loss (rendered)', [
  {at: [0.7, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

restHoldFill(ID, [0.1, 1]);
thinContent(ID);
// the subject: the machine (column and hopper) standing on its floor
subjectHeight(ID, [['column', 'hopper', 'colbase']], [0.1, 1]);
coldCreate(ID);
inFrameSweep(ID);

// locale "es" with the default content (review 2026-09-27): the default events, stated difference and captions are
// drawn in Spanish too (fields left at their English default take their Spanish default)
ratioChecks(ID, 'locale es with default params draws no English', [
  {at: [0.1, 0.62, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Month|Shop|Supplier|Flow|record|Reference|Alleged|Stated|supplied|conclusion|units|fictional|Before|After|Changed|Only|Same|Hopper|gate|related)\\b/.test(t.textContent))", label: 'no English text with locale es and default params'},
]);

// Review 2026-09-27 (1:1 composition): the machine stays the subject — its physical scene (hopper, column, trays,
// floor, tokens) covers >= 0.20 of the frame area at rest and hold, labels shown and hidden; no chip or record card
// covers a prop.
sceneAreaShare(ID, ['hopper', 'column', 'colbase', 'trayL', 'trayR', 'floor', 'tokens'], [0.1, 1], 0.2);
chipsClearOfProps(ID, '^(band-.*|diff|rec)$', '^(hopper|column|colbase|trayL|trayR|tok\\d+)$', [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1]);
