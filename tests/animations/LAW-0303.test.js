// LAW-0303 — Exhibición de documento · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (B: a detail is selected — ◆ marks the
// zone's place, then a region is framed and its enlarged copy grows into the zone; A: the zone stays empty — a different
// object and relation), and no legal consequence is invented to complete the contrast.
// Timing (u): base 0–0.17 identical · the difference introduced 0.205–0.26 · the same action in both rooms 0.40–0.75 (the
// presenter points 0.40; the document travels 0.435–0.55 and settles with its reference; in B only, the region is framed
// 0.585 and enlarged 0.625–0.71) · guide 0.785–0.85.
// Legal: the region is only a supplied region; the content is generic (lines and blocks); no winner, score, authenticity,
// admissibility, weight or ruling. Every text is drawn once (the rooms carry no text; the panel lists it).
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
import {bannedDataTest, bannedRenderTest, stressLongerTest, documentConsistencyTest, glyphStateTest, noTwinTextTest, ES_WORDS, FLOOR_FOR} from './exhibicion-documento-checks.js';

const ID = 'LAW-0303';

contractSuite(ID, {
  continuity: ['handA', 'handB'],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.lookA === s.lookB && s.tags === 0 && s.zoneMark === 0", label: 'base: the two rooms are identical'},
    {at: 0.3, fn: "s.tags === 1 && s.zoneMark === 1 && s.zoneA === 'none' && s.zoneB === 'none' && s.lookA === s.lookB", label: 'the one difference is introduced in both rooms at once, in the same place: a ◆ marks the zone in B, nothing in A'},
    {at: 0.5, fn: "s.docState === 'travelling' && s.docStateB === 'travelling' && s.lookA === s.lookB", label: 'the same action in both rooms: the document travels to the board'},
    {at: 0.65, fn: "s.zoneA === 'none' && s.zoneB === 'enlarging' && s.lookA === s.lookB", label: 'only in B is the region enlarged into the zone (a different object and relation); everything else identical'},
    {at: 1, fn: "s.zoneA === 'none' && s.zoneB === 'enlarged' && s.captionB === 1 && s.docState === 'placed' && s.guide === 1 && s.problems.length === 0 && s.lookA === s.lookB", label: 'hold: both pages on their boards; the enlarged zone only in B; the guide is drawn; the composition fits'},
    {at: 0.1, fn: "s.tags === 0 && s.guide === 0 && s.zoneB === 'none'", label: 'seeking back restores the base'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.hearing.room, ...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), ...p.exhibits, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.sequence, p.labels.key];",
  content: 'return [...p.speakers.map(s => s.label), ...p.statements.map(s => s.text), p.changedFact];',
  captions: 'return [p.labels.sequence, p.comparisonLabels.guide];',
});

ratioChecks(ID, 'identical except the contrasted item; composition fits', [
  {at: times(0, 1, 0.02), fn: 's.lookA === s.lookB', label: 'everything except the contrasted place is identical in A and B at every u'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
  {at: times(0.4, 0.75, 0.005), fn: "!(s.docStateB === 'travelling' && (s.frameB > 0 || s.zoomB > 0))", label: 'one thing at a time: nothing is framed or enlarged while the document travels'},
  {at: times(0.4, 0.75, 0.005), fn: 's.zoomB === 0 || s.frameB === 1', label: 'the zone only grows once its region is framed'},
  {at: times(0.4, 0.75, 0.005), fn: "s.docState === 'cabinet' || s.pointing > 0 || s.docState === 'placed'", label: 'the document only moves once the presenter points'},
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
    const ledA = box(node(svg, 'ra-board-body')), ledB = box(node(svg, 'rb-board-body'));
    if (!near(A, ledA, 3)) out.push(pr.name + ' ' + ratio + ': the guide does not start on room A\\'s board');
    if (!near(B, ledB, 3)) out.push(pr.name + ' ' + ratio + ': the guide does not end on room B\\'s board');
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
noOverlapTest(ID, {markers: ['[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node="rb-zmark"]']});
coldCreateTest(ID);
// standing floors: >= 60 px; 1:1 contrast >= 55 px for every preset except long-labels-stress (>= 45 px) (coordinator)
peopleSizeTest(ID, {re: '^r[ab]-p\\d$', floorFor: FLOOR_FOR});
headsClearTest(ID, {heads: '^r[ab]-p\\d-head$', covers: ['[data-node="guide"]', '[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node="ra-board"]', '[data-node="rb-board"]']});
armsClearTest(ID, {people: '^r[ab]-p(\\d)$', props: ['[data-node="ra-board"]', '[data-node="rb-board"]', '[data-node^="ra-exhibit"]', '[data-node^="rb-exhibit"]', '[data-node="ra-cabinet"]', '[data-node="rb-cabinet"]', '[data-node="ra-clock"]', '[data-node="rb-clock"]']});
equalWeightTest(ID, {at: [0.3, 1], marks: [['[data-node="hdrB-cue"]', '[data-node="hdrA-cue"]']]});
// (the plates' ● / ◆ at the hold: before it the ● rides on the document, which is still small on its exhibit)
equalWeightTest(ID, {at: [1], marks: [['[data-node="rb-capplate-g"]', '[data-node="rb-tagplate-g"]']], tag: ' (plates at the hold)'});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
stressLongerTest(ID);
documentConsistencyTest(ID, {prefix: 'rb'});
glyphStateTest(ID, {prefixes: ['ra', 'rb'], at: [1]});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.5, 0.65, 0.8, 1]});
// (the shared subject figure divides by the square 480 px test slot; the contrast's two rooms are measured against the
// rendered frame instead — see subjectFrameTest)
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="ra-walls"], [data-node="rb-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="guide"]']});
textLinesVisibleTest(ID);
