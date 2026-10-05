// LAW-0291 — Interrogatorio directo · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated turn changes (the contrasted turn's supplied form:
// ● open question from the questioner in A, ◆ bounded answer from the witness in B — a different form AND a different
// relation: who sets it on the tray), and no legal consequence is invented to complete the contrast.
// Timing (u): base 0–0.17 identical · the difference introduced 0.20–0.26 (the contrasted slip's cue with whoever gives
// it, the headers' form) · the same exchange in both rooms 0.40–0.76 · guide 0.78–0.85; neutral note and key.
// Legal: no examination rules, objection, admissibility, credibility, weight or outcome; no winner or score.
// People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px).
// coordinator decision (AUTHORING item 20): long-labels-stress is capped with its true driver and rendered before/after
// numbers recorded in the presets file (`coordinatorDecision`); the pre-cap preset is kept in production/scratch/hearings-03/.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {examinationFreeTest, ES_WORDS, FLOOR_FOR} from './interrogatorio-directo-checks.js';

const ID = 'LAW-0291';

contractSuite(ID, {
  continuity: ['handQA', 'handWB'],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.lookA === s.lookB && s.tags === 0", label: 'base: the two rooms are identical'},
    {at: 0.3, fn: "s.tags === 1 && s.formA === 'open' && s.formB === 'bounded' && s.givenByA === 0 && s.givenByB === 1 && s.lookA === s.lookB", label: 'the one difference is introduced in both rooms at once: an open question from the questioner in A, a bounded answer from the witness in B'},
    {at: 0.607, fn: "s.carrierA === 0 && s.carrierB === 1", label: 'the contrasted turn is set on the tray by the questioner in A and by the witness in B (a different relation)'},
    {at: 0.55, fn: 's.othersSame && s.itemState.some(c => c !== "stack") && s.lookA === s.lookB', label: 'the same exchange runs in both rooms; every other turn is identical'},
    {at: 1, fn: "s.stateA === 'open' && s.stateB === 'open' && s.guide === 1 && s.problems.length === 0 && s.lookA === s.lookB", label: 'hold: both contrasted cards on the rails; the guide is drawn; the composition fits'},
    {at: 0.1, fn: 's.tags === 0 && s.guide === 0', label: 'seeking back restores the base'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const sh = p.statements.filter((s, i) => i !== p.changedItem); return [p.hearing.room, ...p.speakers.map(s => s.label), ...sh.map(s => s.text), ...p.exhibits, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.scenarioA.text, p.scenarioB.text, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.sequence, p.labels.key, ...(sh.some(s => s.kind === 'question' && s.form !== 'open') ? [p.labels.question] : []), ...(sh.some(s => s.kind === 'answer' && s.form !== 'bounded') ? [p.labels.answer] : [])];",
  content: 'return [...p.speakers.map(s => s.label), p.scenarioA.text, p.scenarioB.text, p.changedFact];',
  captions: 'return [p.labels.sequence, p.comparisonLabels.guide];',
});

ratioChecks(ID, 'identical except the contrasted item; composition fits', [
  {at: times(0, 1, 0.02), fn: 's.lookA === s.lookB && s.othersSame', label: 'everything except the contrasted item is identical in A and B at every u'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits'},
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
noOverlapTest(ID, {markers: ['[data-node^="ra-slipwrap"]', '[data-node^="rb-slipwrap"]', '[data-node^="bA"]', '[data-node^="bB"]']});
coldCreateTest(ID);
// standing floors: >= 60 px; 1:1 contrast >= 55 px for every preset except long-labels-stress (>= 45 px) (coordinator)
peopleSizeTest(ID, {re: '^r[ab]-p\\d$', floorFor: FLOOR_FOR});
headsClearTest(ID, {heads: '^r[ab]-p\\d-head$', covers: ['[data-node="guide"]', '[data-node^="ra-slipwrap"]', '[data-node^="rb-slipwrap"]', '[data-node^="bA"]', '[data-node^="bB"]', '[data-node^="ra-card"]', '[data-node^="rb-card"]']});
armsClearTest(ID, {people: '^r[ab]-p(\\d)$', props: ['[data-node^="ra-card"]', '[data-node^="rb-card"]', '[data-node^="ra-exhibit"]', '[data-node^="rb-exhibit"]', '[data-node="ra-cabinet"]', '[data-node="rb-cabinet"]', '[data-node="ra-clock"]', '[data-node="rb-clock"]']});
equalWeightTest(ID, {at: [0.3], marks: [['[data-node="hdrB-cue"]', '[data-node="hdrA-cue"]'], ['[data-node="rb-slipcue2-g"]', '[data-node="ra-slipcue2-g"]']]});
neutralityTest(ID);
examinationFreeTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.5, 0.65, 0.8, 1]});
// (the shared subject figure divides by the square 480 px test slot; the contrast's two rooms are measured against the
// rendered frame instead — see subjectFrameTest)
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="ra-walls"], [data-node="rb-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node="guide"]']});
textLinesVisibleTest(ID);
