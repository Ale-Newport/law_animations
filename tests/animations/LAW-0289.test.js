// LAW-0289 — Interrogatorio directo · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (a slip rides in the SOLVED hand of whoever
// gives the turn until it is set on the tray; each card unfolds at the rail's entry place and advances along it) and the
// transformation (turns advancing one by one beside the witness) recognisable with the labels hidden.
// Timing (u): rest 0–0.16 (nothing moves) · turns in the configured sequence 0.16–0.72 (lift the question slips, then
// per turn: fetch, carry, set on the tray, slide up the guide, unfold, text; the rail advances one place while the next
// slip is fetched) · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal content: ● open question / ◆ bounded answer are supplied forms of equal weight; nothing is assessed (no rule of
// examination, objection, admissibility, credibility, weight or outcome); no dashes; no arrows; no red.
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px).
// coordinator decision (AUTHORING item 20): long-labels-stress is capped with its true driver and rendered before/after
// numbers recorded in the presets file (`coordinatorDecision`); the pre-cap preset is kept in production/scratch/hearings-03/.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {examinationFreeTest, ES_WORDS, FLOOR_FOR} from './interrogatorio-directo-checks.js';

const ID = 'LAW-0289';

contractSuite(ID, {
  // ('hand' is whichever speaker is carrying: it switches between the two by design; each speaker's own hand is continuous)
  continuity: ['handQ', 'handW', 'handL', 'questioner'],
  // while a slip is carried it rides in the solved hand of whoever gives the turn
  attach: [
    {from: 0.229, to: 0.245, a: 'hand', b: 'heldSlip', tol: 0.6},
    {from: 0.352, to: 0.368, a: 'hand', b: 'heldSlip', tol: 0.6},
    {from: 0.475, to: 0.49, a: 'hand', b: 'heldSlip', tol: 0.6},
    {from: 0.597, to: 0.613, a: 'hand', b: 'heldSlip', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.itemState.every(c => c === 'stack') && s.open.every(o => o === 0) && s.held === null && s.onRail === 0", label: 'rest: every turn is a folded slip (questions on the lectern, answers on the counter); the rail is empty'},
    {at: 0.155, fn: "s.itemState.every(c => c === 'stack') && s.questionerDeg === 180", label: 'nothing moves during the rest beat'},
    {at: 0.25, fn: "s.carrier === null || s.carrier === 0", label: 'the first turn (a question) is given by the questioner'},
    {at: 0.36, fn: "s.carrier === 1 && s.held === 1", label: 'an answer is carried by the witness'},
    ...[0.3, 0.45, 0.6, 0.7].map(at => ({at, fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: `a card's text only arrives once it is open (u=${at})`})),
    {at: 0.74, fn: "s.itemState.every(c => c === 'open')", label: 'the main action is complete by u 0.74'},
    {at: 1, fn: "s.itemState.every(c => c === 'open') && s.finalState === 'all-given' && s.allReached && s.problems.length === 0 && s.railX.every((x, i, a) => i === 0 || x > a[i - 1])", label: 'hold: every turn on the rail, left to right in the configured sequence; the composition fits'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.onRail >= 2 && s.itemState.some(c => c !== 'open')", label: 'labels hidden: the same exchange happens'},
    {at: 1, params: {finalState: 'last-not-given'}, fn: "s.itemState[3] === 'stack' && s.itemState[0] === 'open' && s.itemState[2] === 'open'", label: 'supplied final state: the last turn is not given'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.itemState.some(c => c !== 'open')", label: 'actionProgress freezes the exchange part-way'},
    {at: 1, params: {sequence: [2, 3, 0, 1]}, fn: "s.order === '2>3>0>1' && s.railX[2] < s.railX[3] && s.railX[3] < s.railX[0] && s.railX[0] < s.railX[1]", label: 'the supplied sequence decides the order of the turns on the rail'},
    {at: 0.1, fn: "s.itemState.every(c => c === 'stack')", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const st = p.statements; const f = (k, v) => st.some(s => s.kind === k && s.form === v); return [p.hearing.room, ...p.speakers.map(s => s.label), ...st.map(s => s.text), ...p.exhibits, ...(f('question', 'open') ? [p.states.open] : []), ...(f('answer', 'bounded') ? [p.states.bounded] : []), ...(st.some(s => s.kind === 'question' && s.form !== 'open') ? [p.labels.question] : []), ...(st.some(s => s.kind === 'answer' && s.form !== 'bounded') ? [p.labels.answer] : []), p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.witnessBox, p.objectLabels.rail, p.objectLabels.lectern, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits];',
  captions: 'return [p.actorLabels.participant, p.objectLabels.witnessBox, p.objectLabels.rail, p.objectLabels.lectern, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, one turn in hand, composition fits', [
  {at: times(0.16, 0.74, 0.005), fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: 'a card text never shows before its card is open'},
  {at: times(0.16, 0.74, 0.005), fn: "s.itemState.filter(c => c === 'carried' || c === 'sliding' || c === 'unfolding').length <= 1", label: 'one turn at a time'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.16, 0.74, 0.01), fn: 's.allReached', label: 'every reach (slips, tray) is within the arm'},
]);

const PROPS = ['[data-node^="rm-card"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node^="rm-slipwrap"]', '[data-node^="rm-p"][data-node$="-head"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node^="rm-card"]', '[data-node^="rm-slipwrap"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 60});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-bounded"] path:first-of-type', '[data-node="lg-open"] circle'], ['[data-node$="-g-bounded"]', '[data-node$="-g-open"]']]});
neutralityTest(ID);
examinationFreeTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.6, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="lab"][data-node$="-lead"]']});
textLinesVisibleTest(ID);

// The exchange is recognisable with the labels hidden: the cards still arrive with their cues (● / ◆ / neutral) and
// advance along the rail; the witness box, its tray and the guide are drawn.
test(`${ID}: labels hidden — the turns still arrive beside the witness with their cues and advance along the rail`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none'}});
    await x.ready;
    x.seek(0.36 * x.durationMs); const a = x.getState({bounds: false}).semantic.railX[0];
    x.seek(x.durationMs); const s = x.getState({bounds: false}).semantic;
    const svg = x.element;
    const q = sel => [...svg.querySelectorAll(sel)];
    return {cards: q('[data-node^="rm-card"][data-node$="-body"]').length, cues: q('[data-node$="-g-open"], [data-node$="-g-bounded"], [data-node$="-g-plain"]').length, tray: q('[data-node="rm-tray"]').length, guide: q('[data-node="rm-guide"]').length, moved: a - s.railX[0]};
  }, ID);
  expect(out.cards).toBe(4);
  expect(out.cues).toBeGreaterThanOrEqual(4);
  expect(out.tray).toBe(1);
  expect(out.guide).toBe(1);
  expect(out.moved).toBeGreaterThan(10);
});

void presetsFor;
