// LAW-0299 — Objeción procesal · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated circumstance changes (B: a response card is
// supplied — ◆ a slip lying in front of the responding participant that travels to the rail and opens; A: nothing is
// supplied there — a different object and relation), and no legal consequence is invented to complete the contrast.
// Timing (u): base 0–0.17 identical · the difference introduced 0.20–0.26 · the same action in both rooms 0.40–0.71 (the
// question pauses at 0.47 once the signal is up; the reason card travels 0.49–0.55 and opens; in B only, the response
// card travels 0.63–0.685 and opens) · guide 0.785–0.85.
// Legal: the response card is only a supplied card; both questions stay paused; no grounds, ruling, outcome, winner,
// score or hierarchy.
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {rulingFreeDataTest, rulingFreeRenderTest, stressLongerTest, objectionConsistencyTest, noHierarchyTest, ES_WORDS, FLOOR_FOR} from './objecion-procesal-checks.js';

const ID = 'LAW-0299';

contractSuite(ID, {
  continuity: ['handQA', 'handQB'],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.lookA === s.lookB && s.tags === 0", label: 'base: the two rooms are identical'},
    {at: 0.3, fn: "s.tags === 1 && s.stateA === 'none' && s.stateB === 'waiting' && s.lookA === s.lookB && s.changed === s.resI", label: 'the one difference is introduced in both rooms at once, in the same place: a response slip lies in front of the responder in B, nothing in A'},
    {at: 0.48, fn: "s.paused === 1 && s.pausedB === 1 && s.signal === 1 && s.signalB === 1 && s.lookA === s.lookB", label: 'the same pause in both rooms: the signal is up and the question pauses'},
    {at: 0.52, fn: "s.itemState[s.intI] === 'travelling' && s.itemStateB[s.intI] === 'travelling' && s.stateB === 'waiting'", label: 'the reason card travels in both rooms at once'},
    {at: 0.65, fn: "s.stateA === 'none' && s.stateB === 'travelling' && s.lookA === s.lookB", label: 'only in B does the response card travel to the rail (a different object and relation); everything else identical'},
    {at: 1, fn: "s.stateA === 'none' && s.stateB === 'open' && s.paused === 1 && s.pausedB === 1 && s.itemState[s.intI] === 'open' && s.guide === 1 && s.problems.length === 0 && s.routesClear && s.lookA === s.lookB", label: 'hold: both questions paused, both reason cards on the rail, the response card only in B; the guide is drawn; the composition fits'},
    {at: 0.1, fn: "s.tags === 0 && s.guide === 0 && s.stateB === 'none'", label: 'seeking back restores the base'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.signal, p.labels.paused, p.labels.sequence, p.labels.key];",
  content: 'return [...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), p.changedFact];',
  captions: 'return [p.labels.sequence, p.comparisonLabels.guide];',
});

ratioChecks(ID, 'identical except the contrasted item; composition fits', [
  {at: times(0, 1, 0.02), fn: 's.lookA === s.lookB', label: 'everything except the contrasted place is identical in A and B at every u'},
  {at: [1], fn: 's.problems.length === 0 && s.routesClear', label: 'the composition fits (every card route clear)'},
  {at: times(0.4, 0.75, 0.005), fn: "s.itemStateB.filter(c => c === 'carried' || c === 'sliding' || c === 'travelling' || c === 'unfolding').length <= 1", label: 'one card moving at a time'},
  {at: times(0.4, 0.75, 0.005), fn: "s.itemState[s.intI] === 'none' || s.paused === 1", label: 'the reason card only moves once the question is paused'},
  {at: times(0.4, 0.75, 0.005), fn: 's.textShownB.every((t, i) => t === 0 || s.openB[i] === 1)', label: 'a card text never shows before its card is open'},
  {at: times(0.16, 0.76, 0.01), fn: 's.allReached', label: 'every reach is within the arm in both rooms'},
]);

// The guide links the two contrasted cards, through free channels: it starts on card A and ends on card B, and never
// runs over a room's floor (only over the strips and margins outside the rooms).
test(`${ID}: the guide links the two contrasted cards through free channels (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const g0 = node(svg, 'guide');
    if (!g0) return out;
    const m = g0.getScreenCTM(); const L = g0.getTotalLength();
    const P2 = t => new DOMPoint(g0.getPointAtLength(t).x, g0.getPointAtLength(t).y).matrixTransform(m);
    const near = (q, b, pad) => q.x >= b.l - pad && q.x <= b.r + pad && q.y >= b.t - pad && q.y <= b.b + pad;
    const A = P2(0), B = P2(L);
    const roomA = box(node(svg, 'ra-walls')), roomB = box(node(svg, 'rb-walls'));
    const ledA = box(node(svg, 'ra-rail')), ledB = box(node(svg, 'rb-rail'));
    if (!near(A, ledA, 3)) out.push(pr.name + ' ' + ratio + ': the guide does not start on room A\\'s rail');
    if (!near(B, ledB, 3)) out.push(pr.name + ' ' + ratio + ': the guide does not end on room B\\'s rail');
    let inside = 0;
    for (let t = 0; t <= L; t += 3) { const q = P2(t); for (const R0 of [roomA, roomB]) if (q.x > R0.l + 20 && q.x < R0.r - 20 && q.y > R0.t + 20 && q.y < R0.b - 20) inside++; }
    stat('guide samples inside a room floor ' + ratio, inside, 'max');
    // only the short drops onto the two tables (from the wall to the card) lie inside a room
    if (inside > 60) out.push(pr.name + ' ' + ratio + ': the guide runs over a room floor (' + inside + ' samples)');
    return out;`, {}, {withHidden: true});
  report(ID, 'guide', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

const CHIPS = [];
textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="guide"]']});
noOverlapTest(ID, {markers: ['[data-node^="ra-slipwrap"]', '[data-node^="rb-slipwrap"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node="ra-signal"]', '[data-node="rb-signal"]', '[data-node="ra-pause"]', '[data-node="rb-pause"]']});
coldCreateTest(ID);
// standing floors: >= 60 px; 1:1 contrast >= 55 px for every preset except long-labels-stress (>= 45 px) (coordinator)
peopleSizeTest(ID, {re: '^r[ab]-p\\d$', floorFor: FLOOR_FOR});
headsClearTest(ID, {heads: '^r[ab]-p\\d-head$', covers: ['[data-node="guide"]', '[data-node^="ra-slipwrap"]', '[data-node^="rb-slipwrap"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node^="ra-card"]', '[data-node^="rb-card"]', '[data-node="ra-pause"]', '[data-node="rb-pause"]']});
armsClearTest(ID, {people: '^r[ab]-p(\\d)$', props: ['[data-node^="ra-card"]', '[data-node^="rb-card"]', '[data-node^="ra-exhibit"]', '[data-node^="rb-exhibit"]', '[data-node="ra-cabinet"]', '[data-node="rb-cabinet"]', '[data-node="ra-clock"]', '[data-node="rb-clock"]']});
// (the headers' ● / ◆ here; the two cards' ● / ◆ in room B, where both are shown, in noHierarchyTest)
equalWeightTest(ID, {at: [0.3, 1], marks: [['[data-node="hdrB-cue"]', '[data-node="hdrA-cue"]']]});
neutralityTest(ID);
rulingFreeDataTest(ID);
rulingFreeRenderTest(ID);
stressLongerTest(ID);
objectionConsistencyTest(ID, {prefix: 'rb'});
noHierarchyTest(ID, {prefix: 'rb'});
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.47, 0.52, 0.65, 0.8, 1]});
// (the shared subject figure divides by the square 480 px test slot; the contrast's two rooms are measured against the
// rendered frame instead — see subjectFrameTest)
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="ra-walls"], [data-node="rb-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="guide"]']});
textLinesVisibleTest(ID);
