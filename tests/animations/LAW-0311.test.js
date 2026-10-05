// LAW-0311 — Pausa de audiencia · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (B: a recess is supplied — ◆ marks the
// card's place, then the operator signals, the session clock slows down and stops with its pause badge, the recess card
// comes out connected to the clock and the positions are marked; A: the session stays active, its clock keeps running and
// the card's place stays empty — a different object state, gesture and relation), and no legal consequence is invented.
// Timing (u): base 0–0.17 identical · the difference introduced 0.20–0.26 · the same time in both rooms 0.40–0.75 (B only:
// the operator signals 0.40–0.435, the clock slows down 0.435–0.526 and stops, pause badge 0.526–0.554, the card comes out
// 0.579–0.645, the connector 0.649–0.677, its caption 0.677–0.705, floor rings 0.708–0.743) · guide 0.78–0.85.
// Legal: times fictional and labelled as supplied; no winner, problem, penalty, rule, duration, time limit or end of the
// proceedings; jurisdiction unspecified. Every text is drawn once (the rooms carry no text; the panel lists it).
// People floors (coordinator; hearings measure the FIGURE height): >= 60 px off 1:1; >= 55 px at 1:1 except
// long-labels-stress (>= 45 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, pauseConsistencyTest, glyphStateTest, noTwinTextTest, positionsKeptTest, glyphFollowsStateTest, ES_WORDS, FLOOR_FOR} from './pausa-audiencia-checks.js';

const ID = 'LAW-0311';

contractSuite(ID, {
  continuity: ['handB'],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.lookA === s.lookB && s.tags === 0 && s.recessMark === 0 && s.clockA === 'running' && s.clockB === 'running' && s.minuteA === s.minuteB", label: 'base: the two rooms are identical; both session clocks run alike'},
    {at: 0.3, fn: "s.tags === 1 && s.recessMark === 1 && s.cardA === 'none' && s.cardB === 'none' && s.lookA === s.lookB && s.minuteA === s.minuteB", label: 'the one difference is introduced in both rooms at once, in the same place: a ◆ marks the card\'s place in B, nothing in A'},
    {at: 0.48, fn: "s.clockA === 'running' && s.clockB === 'slowing' && s.signallingB > 0 && s.lookA === s.lookB", label: 'only in B does the operator signal and the session clock slow down; everything else identical'},
    {at: 0.6, fn: "s.clockA === 'running' && s.clockB === 'stopped' && s.pauseB === 1 && s.cardA === 'none' && s.cardB === 'coming' && s.gestureB > 0.5", label: 'only in B does the recess card come out of the raised hand; in A the session clock keeps running'},
    {at: 1, fn: "s.clockA === 'running' && s.clockB === 'stopped' && s.cardA === 'none' && s.cardB === 'connected' && s.linkB === 1 && s.captionB === 1 && s.pinsB === 1 && s.guide === 1 && s.problems.length === 0 && s.lookA === s.lookB && s.minuteA !== s.minuteB", label: 'hold: A active (clock running), B in recess (clock paused, card connected, positions marked); the guide is drawn; the composition fits'},
    {at: 0.1, fn: "s.tags === 0 && s.guide === 0 && s.cardB === 'none' && s.clockB === 'running'", label: 'seeking back restores the base'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.positions, p.labels.sequence, p.labels.key];",
  content: 'return [...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), p.changedFact];',
  captions: 'return [p.labels.sequence, p.comparisonLabels.guide];',
});

ratioChecks(ID, 'identical except the contrasted item; composition fits', [
  {at: times(0, 1, 0.02), fn: 's.lookA === s.lookB', label: 'everybody\'s place, the wall clocks and (until B\'s clock slows) the session clocks are identical in A and B at every u'},
  {at: times(0, 0.43, 0.01), fn: 's.minuteA === s.minuteB', label: 'the two session clocks turn alike until the supplied difference acts'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
  {at: times(0.4, 0.75, 0.005), fn: "!(s.clockB === 'slowing' && (s.zoomB > 0 || s.pauseB > 0))", label: 'one thing at a time in B: no badge or card while the clock slows'},
  {at: times(0.4, 0.75, 0.005), fn: 's.zoomB === 0 || s.pauseB === 1', label: 'the card only comes out once the clock is paused'},
  {at: times(0.4, 0.75, 0.005), fn: 's.linkB === 0 || s.zoomB === 1', label: 'the connector only draws once the card has arrived'},
  {at: times(0.4, 1, 0.01), fn: "s.clockA === 'running'", label: 'A\'s session clock keeps running: the session stays active'},
  {at: times(0.16, 0.76, 0.01), fn: 's.allReached', label: 'every reach is within the arm'},
]);

// The guide links the two contrasted places, through free channels: it starts on card A and ends on card B, and never
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
    const ledA = box(node(svg, 'ra-board-body')), ledB = box(node(svg, 'rb-board-body'));
    if (!near(A, ledA, 3)) out.push(pr.name + ' ' + ratio + ': the guide does not start on room A\\'s panel');
    if (!near(B, ledB, 3)) out.push(pr.name + ' ' + ratio + ': the guide does not end on room B\\'s panel');
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
noOverlapTest(ID, {markers: ['[data-node="ra-sclock"]', '[data-node="rb-sclock"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node="rb-zmark"]']});
coldCreateTest(ID);
// standing floors: >= 60 px; 1:1 contrast >= 55 px for every preset except long-labels-stress (>= 45 px) (coordinator)
peopleSizeTest(ID, {re: '^r[ab]-p\\d$', floorFor: FLOOR_FOR});
headsClearTest(ID, {heads: '^r[ab]-p\\d-head$', covers: ['[data-node="guide"]', '[data-node="ra-sclock"]', '[data-node="rb-sclock"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node="ra-board"]', '[data-node="rb-board"]']});
// (the panel's own parts; B's recess card is exempt: it comes out of the operator's raised hand)
armsClearTest(ID, {people: '^r[ab]-p(\\d)$', props: ['[data-node="ra-board-body"]', '[data-node="rb-board-body"]', '[data-node="rb-cap"]', '[data-node="ra-sclock"]', '[data-node="rb-sclock"]', '[data-node^="ra-exhibit"]', '[data-node^="rb-exhibit"]', '[data-node="ra-cabinet"]', '[data-node="rb-cabinet"]', '[data-node="ra-clock"]', '[data-node="rb-clock"]']});
equalWeightTest(ID, {at: [0.3, 1], marks: [['[data-node="hdrB-cue"]', '[data-node="hdrA-cue"]']]});
// (the plates' ● / ◆ at the hold)
equalWeightTest(ID, {at: [1], marks: [['[data-node="rb-capplate-g"]', '[data-node="ra-tagplate-g"]']], tag: ' (plates at the hold)'});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
pauseConsistencyTest(ID);
glyphStateTest(ID, {prefixes: ['ra', 'rb'], at: [1]});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.5, 0.61, 0.65, 0.7, 0.8, 1]});
// (the shared subject figure divides by the square 480 px test slot; the contrast's two rooms are measured against the
// rendered frame instead — see subjectFrameTest)
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="ra-walls"], [data-node="rb-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="guide"]']});
textLinesVisibleTest(ID);
// (B: once paused its session clock stands still while its wall clock runs; nobody moves in either room)
positionsKeptTest(ID, {rooms: ['rb'], pausedFrom: 0.53});
positionsKeptTest(ID, {rooms: ['ra']});
glyphFollowsStateTest(ID, {rooms: ['ra', 'rb'], header: {ra: 'hdrA-cue', rb: 'hdrB-cue'}});
