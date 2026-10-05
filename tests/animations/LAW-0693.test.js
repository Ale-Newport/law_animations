// LAW-0693 — Evento interviniente · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (the carried tile, the claw, the pendulum bob and every tile), anchoring
// of objects (the claw holds the later event by its top from the bay until it releases it in the slot; nothing moves
// before something touches it) and a transformation recognizable with the labels hidden (a later event is carried in
// between two supplied events and the sequence continues through it, per the supplied model).
// Windows (LAW-0693.js W): carry 0.14–0.30 · lower 0.30–0.36 · release 0.36–0.38 · claw up 0.38–0.43 · the tile before
// the slot reaches the later event at 0.45 (every contact takes d ≤ 0.042) · status 0.76–0.81 · notes 0.78–0.84 ·
// key 0.80–0.86 (hold ≥ 840 ms).
// coordinator decision 2026-09-26 (standing stress cap rule, LAW-0687/0689–0692 precedent; see SESSION_HANDOFF): the
// long-labels-stress lengths are capped to the longest tried values that fit every ratio at >= 16 px (measurements in
// LAW-0693.presets.json); every field stays longer than the baseline and every count >= the baseline.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, stageShare, equalWeight} from './evento-interviniente-checks.js';

const ID = 'LAW-0693';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['claw', 'addedTop', 'bob', 'tile0', 'tile1', 'tile2', 'tile3', 'tile4', 'loss0'],
  attach: [
    // the claw grips the later event's top from the bay to the moment it opens in the slot
    {from: 0, to: 0.359, a: 'claw', b: 'addedTop', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.carry === 0 && !s.placed && s.angles.every(a => a === 0) && s.lossState[0] === 'intact'", label: 'rest: the initial sequence stands; the later event hangs in the bay'},
    {at: 0.22, fn: '!s.placed && s.carry > 0 && s.carry < 1', label: 'carry: the crane moves the later event along the beam (no teleport)'},
    {at: 0.365, fn: 's.placed && s.angles[s.k] === 0 && s.addedTop.y === s[\'tile\' + (s.k + 1)].y', label: 'the later event stands in the slot, upright, level with the other tiles'},
    {at: 0.44, fn: '!s.started[s.k]', label: 'nothing touches the later event before it has been set down and released'},
    {at: 0.47, fn: 's.started[s.k] && s.started[s.k - 1]', label: 'the tile before the slot reaches the later event, which moves on'},
    {at: 0.6, fn: 's.started.every((st, i) => i === 0 || !st || s.started[i - 1])', label: 'no tile starts before the one before it (the order of the sequence after entry)'},
    {at: 1, fn: "s.lossState[0] === 'down' && s.cracked[0] === 1 && s.joints.every(Boolean) && s.statusShown", label: 'as supplied: the sequence reaches the vase through the later event; every link seal shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'unresolved-at-disputed-link' && s.lossState[0] === 'intact' && s.ghost === 1 && s.joints[s.k] !== null && s.joints[s.k + 1] === null", label: 'unresolved as supplied: held at the later event’s disputed link (ghost of the next pose), loss untouched'},
    {at: 1, params: {finalState: 'unresolved-at-disputed-link'}, fn: "s.lossState[0] === 'intact' && s.ghost === 1", label: 'unresolved without a supplied disputed link: held at the later event’s out-link'},
    {at: 1, params: {actionProgress: 0.3}, fn: '!s.placed && s.actionCapped', label: 'actionProgress freezes the action part-way (before the later event is set down)'},
    {at: 1, params: {addedEvent: {label: 'Later', after: 4}}, fn: 's.k === 3 && s.placed', label: 'the entry point is kept between two supplied events (clamped, with a note)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.placed && s.lossState[0] === 'down'", label: 'labels hidden: the same physical entry and continuation'},
  ],
});

ratioChecks(ID, 'layout fits; the claw never touches another tile', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
  {at: times(0, 0.5, 0.02), fn: 's.clawClear', label: 'the claw’s fingers never touch a tile other than the one it carries'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, stage share, equal weight', [
  {at: [0, 0.35, 0.7, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: stageShare(['st-floor', 'st-gantry'], 0.5, 0.5), label: 'the stage spans >= 50 % of the caption-safe width or height'},
  {at: [1], tv: ['all'], dom: equalWeight(['hA', 'hB']), label: 'the two header chips (initial sequence / later event) have equal weight: same strokes and text size, no dashes'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), p.addedEvent.label, p.addedEvent.time, ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.initial, p.objectLabels.added, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.map(e => e.label), p.addedEvent.label, ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Coordinator bar: key text >= 19.5 px in baseline AND baseline-es in every ratio (layout size = px at 1080p: the design
// spaces are fitted at scale ~1.0 in every ratio).
ratioChecks(ID, 'baseline and baseline-es text >= 19.5 px', [
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.layout.size >= 19.5 && s.layout.k === 1', label: 'text size >= 19.5 px without a fallback scale'},
]);

textSizeOverTime(ID);

// baseline-es is a Spanish baseline: no English default text may be drawn.
ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Initial|Later|Link|Loss|Trigger|Crane|Reaches|Held|supplied|event|sequence|conclusion)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);
