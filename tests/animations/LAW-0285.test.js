// LAW-0285 — Exposición inicial · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the slip rides in the presenter's SOLVED
// hand until it is set down; each card unfolds about its own place) and the transformation (items laid out beside the
// lectern) recognisable with the labels hidden.
// Timing (u): rest 0–0.16 (nothing moves) · items in the configured sequence 0.16–0.73 (one window each: reach to the
// stack, lift, turn, walk, set down, unfold, text, walk back) · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal content: ● claim made / ◆ support supplied are supplied states of equal weight; nothing is assessed (no proof,
// weight, burden, sufficiency or outcome); no speaking order; dashes nowhere; no arrows; no red.
// coordinator decision (AUTHORING item 20): long-labels-stress is capped with its true driver and rendered before/after
// numbers recorded in the presets file (`coordinatorDecision`); the pre-cap preset is kept in production/scratch/hearings-02/.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, assessmentFreeTest, ES_WORDS} from './exposicion-inicial-checks.js';

const ID = 'LAW-0285';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['hand', 'handL', 'presenter'],
  // while the presenter carries a slip it rides in the solved hand
  attach: [
    {from: 0.275, to: 0.283, a: 'hand', b: 'heldSlip', tol: 0.6},
    {from: 0.408, to: 0.42, a: 'hand', b: 'heldSlip', tol: 0.6},
    {from: 0.54, to: 0.56, a: 'hand', b: 'heldSlip', tol: 0.6},
    // the stack of slips rides in the left hand between the pick-up and the first slip taken
    {from: 0.23, to: 0.255, a: 'handL', b: 'stackTop', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.itemState.every(c => c === 'stack') && s.open.every(o => o === 0) && s.held === null", label: 'rest: every item is a folded slip on the lectern; the table is empty'},
    {at: 0.155, fn: "s.itemState.every(c => c === 'stack')", label: 'nothing moves during the rest beat'},
    {at: 0.3, fn: "s.itemState.some(c => c === 'open' || c === 'unfolding' || c === 'carried' || c === 'placed')", label: 'the first slip is being laid out'},
    ...[0.25, 0.4, 0.55, 0.7].map(at => ({at, fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: `a card's text only arrives once it is open (u=${at})`})),
    ...[0.25, 0.4, 0.55, 0.7, 1].map(at => ({at, fn: "s.tether.every((t, i) => t === null || t === 0 || s.textShown[i] === 1)", label: `a support's line to its exhibit only after its card is open (u=${at})`})),
    {at: 0.74, fn: "s.itemState.every(c => c === 'open')", label: 'the main action is complete by u 0.74'},
    {at: 0.2, fn: "s.leftStack === 3", label: 'the presenter lifts the whole stack of slips first'},
    {at: 1, fn: "s.itemState.every(c => c === 'open') && s.finalState === 'all-laid-out' && s.allReached && s.problems.length === 0 && s.tether.every(t => t === null || t === 1)", label: 'hold: the supplied final state; every item laid out; the composition fits'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.laidOut >= 1 && s.itemState.some(c => c !== 'open')", label: 'labels hidden: the same laying out happens'},
    {at: 1, params: {finalState: 'last-on-lectern'}, fn: "s.itemState[2] === 'stack' && s.itemState[0] === 'open' && s.itemState[1] === 'open'", label: 'supplied final state: the last slip of the sequence is still on the lectern'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.itemState.some(c => c !== 'open')", label: 'actionProgress freezes the laying out part-way'},
    {at: 1, params: {sequence: [2, 0, 1]}, fn: "s.order === '2>0>1'", label: 'the supplied sequence decides the order of the cards'},
    {at: 0.1, fn: "s.itemState.every(c => c === 'stack')", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const st = p.statements; return [p.hearing.room, ...p.speakers.map(s => s.label), ...st.map(s => s.text), ...p.exhibits, ...(st.some(s => s.kind !== 'question' && s.state !== 'support') ? [p.states.claim] : []), ...(st.some(s => s.kind !== 'question' && s.state === 'support') ? [p.states.support] : []), ...(st.some(s => s.kind === 'question') ? [p.labels.question] : []), p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.lectern, p.objectLabels.table, p.objectLabels.clock, ...p.annotations.map(a => a.text)];",
  content: 'return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits];',
  captions: 'return [p.actorLabels.participant, p.objectLabels.lectern, p.objectLabels.table, p.objectLabels.clock, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, one item in hand, composition fits', [
  {at: times(0.16, 0.74, 0.005), fn: 's.textShown.every((t, i) => t === 0 || s.open[i] === 1)', label: 'a card text never shows before its card is open'},
  {at: times(0.16, 0.74, 0.005), fn: "s.itemState.filter(c => c === 'carried' || c === 'unfolding').length <= 1", label: 'one item at a time'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.16, 0.74, 0.01), fn: 's.allReached', label: 'every reach (stack, card place) is within the arm'},
]);

const PROPS = ['[data-node^="rm-card"]', '[data-node^="rm-exhibit"]', '[data-node="rm-cabinet"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node^="rm-slipwrap"]', '[data-node^="rm-p"][data-node$="-head"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] circle', '[data-node="rings"] rect', '[data-node^="rm-card"]', '[data-node^="rm-slipwrap"]', '[data-node^="rm-tether"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 1], maxGap: 60});
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-support"] path:first-of-type', '[data-node="lg-claim"] circle'], ['[data-node$="-g-support"]', '[data-node$="-g-claim"]']]});
neutralityTest(ID);
assessmentFreeTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.6, 0.8, 1]});
fillMostTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="rm-tether"][data-node$="-line"]', '[data-node^="lab"][data-node$="-lead"]']});
textLinesVisibleTest(ID);

// The table and its cards are recognisable with the labels hidden: the cards still unfold at their places (plain ruled
// sheets with their ● / ◆ / ? cues) and every support still links to its exhibit.
test(`${ID}: labels hidden — the cards still unfold with their cues and the supports still link to their exhibits`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none'}});
    await x.ready; x.seek(x.durationMs);
    const svg = x.element;
    const q = s => [...svg.querySelectorAll(s)];
    return {cards: q('[data-node^="rm-card"][data-node$="-body"]').length, cues: q('[data-node$="-g-claim"], [data-node$="-g-support"], [data-node$="-cue"]').length, tethers: q('[data-node^="rm-tether"][data-node$="-line"]').length, texts: q('text').filter(t => !t.closest('[data-layer="content-notice"]') && (t.textContent || '').trim()).length};
  }, ID);
  expect(out.cards).toBe(3);
  expect(out.cues).toBeGreaterThanOrEqual(3);
  expect(out.tethers).toBe(1);
});
