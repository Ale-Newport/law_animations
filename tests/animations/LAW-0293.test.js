// LAW-0293 — Preguntas de contraste · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (a slip rides in the SOLVED hand of whoever
// lays it out until it is set on the tray; each card unfolds at the rail's entry place and advances along it) and the
// transformation (two answers lined up side by side, one supplied difference marked) recognisable with labels hidden.
// Timing (u): rest 0–0.16 · turns 0.16–0.66 (question, previous answer laid out by the questioner, current answer given
// by the witness; the rail advances one place per new turn) · the difference marked in both answers 0.67–0.73 · notes
// 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal content: ● previous answer / ◆ current answer are supplied sources of equal weight; the highlight is only a
// textual difference between two supplied answers, the same in both (no inconsistency, contradiction, credibility,
// impeachment, error, weight or outcome; no red; no strike; no warning).
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {impeachmentFreeTest, stressLongerTest, differenceConsistencyTest, ES_WORDS, FLOOR_FOR} from './preguntas-contraste-checks.js';

const ID = 'LAW-0293';

contractSuite(ID, {
  // ('hand' is whichever speaker is carrying: it switches between the two by design; each speaker's own hand is continuous)
  continuity: ['handQ', 'handW', 'handL', 'questioner'],
  // while a slip is carried it rides in the solved hand of whoever gives the turn
  attach: [
    {from: 0.236, to: 0.254, a: 'hand', b: 'heldSlip', tol: 0.6},
    {from: 0.372, to: 0.39, a: 'hand', b: 'heldSlip', tol: 0.6},
    {from: 0.508, to: 0.526, a: 'hand', b: 'heldSlip', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.itemState.every(c => c === 'stack') && s.onRail === 0 && s.highlight === 0", label: 'rest: the question and the previous answer (a record) with the questioner, the current answer with the witness; the rail is empty'},
    {at: 0.155, fn: "s.itemState.every(c => c === 'stack') && s.questionerDeg === 180", label: 'nothing moves during the rest beat'},
    {at: 0.38, fn: "s.carrier === 0 && s.held === 1", label: 'the previous answer is laid out by the questioner'},
    {at: 0.515, fn: "s.carrier === 1 && s.held === 2", label: 'the current answer is given by the witness'},
    ...[0.3, 0.45, 0.6].map(at => ({at, fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: `a card's text only arrives once it is open (u=${at})`})),
    {at: 0.66, fn: "s.itemState.every(c => c === 'open') && s.highlight === 0", label: 'both answers stand on the rail before the difference is marked'},
    {at: 1, fn: "s.itemState.every(c => c === 'open') && s.finalState === 'difference-marked' && s.highlight === 1 && s.highlightFound && s.allReached && s.problems.length === 0 && Math.abs(s.rank[s.prevI] - s.rank[s.curI]) === 1 && s.railX.every((x, i, a) => i === 0 || x > a[i - 1])", label: 'hold: the two answers side by side in the configured sequence, the supplied difference marked; the composition fits'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.onRail >= 2 && s.itemState.some(c => c !== 'open')", label: 'labels hidden: the same lining up happens'},
    {at: 1, params: {finalState: 'aligned-only'}, fn: "s.highlight === 0 && s.itemState.every(c => c === 'open')", label: 'supplied final state: the answers side by side, nothing marked'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.itemState.some(c => c !== 'open') && s.highlight === 0", label: 'actionProgress freezes the lining up part-way'},
    {at: 1, params: {sequence: [0, 2, 1]}, fn: "s.order === '0>2>1' && s.railX[2] < s.railX[1]", label: 'the supplied sequence decides the order of the turns on the rail'},
    {at: 0.1, fn: "s.itemState.every(c => c === 'stack') && s.highlight === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const st = p.statements; return [p.hearing.room, ...p.speakers.map(s => s.label), ...st.map(s => s.text), ...p.exhibits, ...(st.some(s => s.kind === 'previous') ? [p.states.previous] : []), ...(st.some(s => s.kind === 'current') ? [p.states.current] : []), ...(st.some(s => s.kind === 'question') ? [p.labels.question] : []), ...(p.finalState !== 'aligned-only' ? [p.labels.difference] : []), p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.witnessBox, p.objectLabels.rail, p.objectLabels.lectern, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
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
// (the witness sits inside the walled witness box: its chip stands beyond the wall, so its leader may reach 72 px)
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 72});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-current"] path:first-of-type', '[data-node="lg-previous"] circle'], ['[data-node$="-g-bounded"]', '[data-node$="-g-open"]']]});
neutralityTest(ID);
impeachmentFreeTest(ID);
stressLongerTest(ID);
differenceConsistencyTest(ID, {defaults: {statements: [{kind: 'question', text: 'What colour was the van?'}, {kind: 'previous', text: 'The van was grey', exhibit: 0}, {kind: 'current', text: 'The van was white'}], difference: {previous: 'grey', current: 'white'}}});
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
test(`${ID}: labels hidden — the answers still arrive beside the witness with their cues and line up along the rail`, async ({page}) => {
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
  expect(out.cards).toBe(3);
  expect(out.cues).toBeGreaterThanOrEqual(3);
  expect(out.tray).toBe(1);
  expect(out.guide).toBe(1);
  expect(out.moved).toBeGreaterThan(10);
});

void presetsFor;
