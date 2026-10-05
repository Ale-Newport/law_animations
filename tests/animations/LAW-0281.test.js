// LAW-0281 — Apertura de audiencia · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (each card follows its holder's SOLVED hand,
// each label stays with its participant), and the transformation (the room is activated; the participants take their
// name cards) recognisable with the labels hidden.
// Timing (u): rest 0–0.15 (nothing moves) · switch ◆→● 0.155–0.19 (the cause) · pulse 0.18–0.27 · lamps 0.21–0.31 ·
// pending text out 0.27–0.29, frame solid 0.285–0.31, started text in 0.30–0.325 · cards in the configured sequence from
// 0.33 (window 0.15 each; the last one ends by 0.70) · notes 0.75–0.80 · state tag 0.76–0.81; still from u 0.81.
// Legal content: no formula, ritual wording, hierarchy, speaking order or consequence of "pending"; ● / ◆ solid cues of
// equal ink area; dashes only on the pending display frame; no arrows; no red.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, limbsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';

const ID = 'LAW-0281';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['card0', 'card1', 'card2', 'hand0', 'hand1', 'hand2'],
  // while a participant carries their card, the hand stays on the card's grip (default order 0 > 1 > 2)
  attach: [
    {from: 0.395, to: 0.44, a: 'hand0', b: 'grip0', tol: 0.6},
    {from: 0.505, to: 0.55, a: 'hand1', b: 'grip1', tol: 0.6},
    {from: 0.615, to: 0.66, a: 'hand2', b: 'grip2', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.lights === 0 && s.switchK === 0 && s.display === 'pending' && s.cardState.every(c => c === 'in-tray') && s.labels.every(l => l === 0)", label: 'rest: lights off, switch at ◆, display shows the supplied pending state, cards in the tray, no label'},
    {at: 0.145, fn: "s.lights === 0 && s.switchK === 0 && s.cardState.every(c => c === 'in-tray')", label: 'nothing moves during the rest beat'},
    {at: 0.2, fn: "s.switchK === 1 && s.lights === 0 && s.display === 'pending'", label: 'the switch moves first (the cause); the lamps and the display follow'},
    {at: 0.33, fn: "s.lights === 1 && s.display === 'started' && s.started === 1 && s.cardState.every(c => c === 'in-tray')", label: 'the room is activated before any card moves'},
    ...[0.3, 0.4, 0.5, 0.6, 0.7].map(at => ({at, fn: "s.labels.every((l, i) => l === 0 || s.cardState[i] === 'placed')", label: `a label only arrives once its card is set down (u=${at})`})),
    {at: 0.45, fn: "s.received >= 1 && s.cardState.some(c => c === 'in-tray')", label: 'mid-way: some cards received, others still in the tray'},
    {at: 0.72, fn: "s.cardState.every(c => c === 'placed')", label: 'the main action is complete by u 0.72'},
    {at: 1, fn: "s.cardState.every(c => c === 'placed') && s.labels.every(l => l === 1) && s.finalState === 'all-received' && s.allReached && s.problems.length === 0", label: 'hold: the supplied final state; every label shown; the composition fits'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.lights === 1 && s.received >= 1 && s.cardState.some(c => c !== 'placed')", label: 'labels hidden: the same activation and hand-over happen'},
    {at: 1, params: {finalState: 'last-waiting'}, fn: "s.cardState[2] === 'in-tray' && s.cardState[0] === 'placed' && s.cardState[1] === 'placed'", label: 'supplied final state: the last card of the sequence is still in the tray'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.cardState.some(c => c !== 'placed')", label: 'actionProgress freezes the opening part-way'},
    {at: 1, params: {sequence: [2, 0, 1]}, fn: "s.order === '2>0>1'", label: 'the supplied sequence decides the order of the cards'},
    {at: 0.1, fn: "s.display === 'pending' && s.lights === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.speaker < p.speakers.length).map(s => s.text), ...p.exhibits, p.session.started, p.session.pending, p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.lights, p.objectLabels.card, p.objectLabels.clock, ...p.annotations.map(a => a.text)];',
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.filter(s => s.speaker < p.speakers.length).map(s => s.text), ...p.exhibits, p.session.started];',
  captions: 'return [p.actorLabels.participant, p.objectLabels.lights, p.objectLabels.card, p.objectLabels.clock, p.labels.sequence];',
});

// ---------------------------------------------------------------------------------------------
// Display hand-over: the two supplied state texts are never both legible (>= 0.15) at once (60 fps over the change).
ratioChecks(ID, 'display hand-over, cause before effect, labels after their cards', [
  {at: times(0.26, 0.34, 0.0025), fn: '!s.textOverlap', label: 'the pending and started texts are never both shown (sequenced hand-over)'},
  {at: [0.18, 0.19, 0.2], fn: 's.lights === 0 || s.switchK === 1', label: 'the lamps never come on before the switch has moved'},
  {at: times(0.3, 0.75, 0.01), fn: "s.labels.every((l, i) => l === 0 || s.cardState[i] === 'placed')", label: 'labels never arrive before their card is set down'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: [1], fn: 's.allReached', label: 'every hand reached its card'},
]);

const PROPS = ['[data-node^="rm-sheet"]', '[data-node^="rm-card"]', '[data-node^="rm-exhibit"]', '[data-node="rm-tray"]', '[data-node="rm-display"]', '[data-node="rm-switch"]', '[data-node="rm-clock"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]', '[data-node^="exchip"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node^="rm-card"]', '[data-node^="rm-p"][data-node$="-head"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node^="rm-card"]', '[data-node^="rm-sheet"]']});
limbsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.85, 1], maxGap: 60});
equalWeightTest(ID, {marks: [['[data-node="lg-pending"] path', '[data-node="lg-started"] circle'], ['[data-node="rm-d-pending"] path', '[data-node="rm-d-started"] circle']]});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.6, 0.8, 1]});
fillMostTest(ID, {subject: '[data-node="rm-room"]'});
thinContentTest(ID);
esDefaultsTest(ID);
