// LAW-0719 — Distribución ilustrativa de pérdidas · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete stages: rail, blades, bar, shelf, rails, trays), exactly the
// indicated fact changes (by default ONE boundary: the blade on it stands elsewhere; every other boundary, the bar, the
// rails and the trays are identical) and no legal consequence is invented (no winner, score, percentage or conclusion;
// neutral note and key).
// Windows (LAW-0719.js W): heads 0–0.04 · values 0.19–0.25 · highlight rings 0.24–0.30 · blades slide 0.26–0.36 · cut
// 0.40–0.47 · spread 0.47–0.54 · pieces run down 0.55–0.74 · guide line 0.77–0.81, chip 0.79–0.84 · note 0.82–0.87 ·
// key 0.84–0.89. Before 0.17 A and B are identical (identicalBeforeChange, labels shown and hidden).
// Legal (causation-10 brief): no apportionment doctrine, no computed percentage, no fault; equal weight (● / ◆ head
// chips of identical weight); values hypothetical and labelled so.
// Brief customizable fields: events, causalLinks, alternatives, losses, scenarioA, scenarioB, changedFact, sharedFacts,
// comparisonLabels — all present; 'unit' and 'allocationLabels' added.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; per-scene subject floor >= 0.20 of the
// frame height as in accepted LAW-0707/0711): the long-labels-stress COUNTS are capped (four events kept; one total, no
// account, no connector note, one shared fact). Rendered at 1080p (2026-10-05, pre-cap copy production/scratch/
// causation-10/LAW-0719.stress-precap.json): full counts → 1:1 no composition fits, 9:16 per-stage height 0.177; after
// the cap 9:16 0.202, 1:1 0.265, 16:9 0.376. Fallbacks tried: side by side / stacked, panel below (two chips a row) or
// beside, compact rail zones, staggered and bare-number value chips, a guide band.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, inFrameSweep, sceneAreaShare, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest} from './distribucion-perdidas-checks.js';

const ID = 'LAW-0719';
const P = name => presetsFor(ID).find(q => q.name === name).params;

// the number of boundaries whose position differs between A and B
const SAME_SCENES = `(() => {
  const sig = e => JSON.stringify({s: [...e.querySelectorAll('path, rect, circle, ellipse, line')].filter(q => q.getAttribute('stroke') && q.getAttribute('stroke') !== 'none').map(q => (+q.getAttribute('stroke-width') || 0) + '/' + (q.getAttribute('stroke-dasharray') || '')).sort(), t: [...e.querySelectorAll('text')].map(t => +t.getAttribute('font-size')).sort()});
  const a = svg.querySelector('[data-node="scene-a"]'), b = svg.querySelector('[data-node="scene-b"]');
  return a && b && sig(a) === sig(b);
})()`;
const NDIFF = 's.boundariesA.filter((x, j) => Math.abs(x - s.boundariesB[j]) > 0.5).length';

contractSuite(ID, {
  continuity: ['segA', 'segB', 'bladeA', 'bladeB'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.valuesShown === 0", label: 'base: A and B identical, no values yet'},
    {at: 0.16, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change beat'},
    {at: 0.36, fn: `s.slide === 1 && JSON.stringify(s.lookA.blades) !== JSON.stringify(s.lookB.blades) && ${NDIFF} === 1`, label: 'change: exactly one blade stands elsewhere (one changed boundary)'},
    {at: 0.36, fn: 's.lookA.blades.filter((b, j) => b.x !== s.lookB.blades[j].x).length === 1', label: 'only the blade on the changed boundary differs'},
    {at: 0.6, fn: 's.cut === 1 && s.spread === 1 && s.lookA.segs[0].q > 0 && s.lookB.segs[0].q > 0', label: 'run: the same action on both stages in parallel'},
    {at: 1, fn: 's.lookA.segs.every(q => q.q === 1) && s.lookB.segs.every(q => q.q === 1) && s.guideShown && s.keyShown', label: 'hold: both divided, the guide and the key'},
    {at: 1, fn: 's.widthsA.reduce((a, b) => a + b, 0) - s.widthsB.reduce((a, b) => a + b, 0) < 0.5', label: 'both stages divide the same whole bar'},
    {at: 1, params: P('contrast-or-alternative'), fn: `${NDIFF} === 1 && s.changedBoundary === 2`, label: 'alternative: only the last boundary differs'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: `${NDIFF} === 1 && s.lookA.segs.every(q => q.q === 1)`, label: 'labels hidden: the same contrast'},
  ],
});

identicalBeforeChange(ID, 0.17);

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: '!s.problems', label: 'a real composition is found (no fallback)'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight of A and B', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [0.1], dom: equalWeight(['head-a', 'head-b']), label: 'the A and B head chips have identical weight'},
  // (the two stages: the same strokes, the same dash patterns — a disputed connector is dashed in both — and text sizes)
  {at: [0.1], dom: SAME_SCENES, label: 'the two stages are drawn with identical weight'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.losses[0].label, ...(p.losses[1] ? [p.losses[1].label] : []), ...p.events.map(e => e.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.scenarioA.label, p.scenarioB.label, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]",
  content: "return [...p.events.map(e => e.label), p.changedFact]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'no red (rendered)', [
  {at: [0.5, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

restHoldFill(ID, [0.1, 1]);
thinContent(ID);
subjectHeight(ID, [['a-rail', 'a-shelf', 'a-trays', 'a-floor'], ['b-rail', 'b-shelf', 'b-trays', 'b-floor']], [0.1, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
sceneAreaShare(ID, ['scene-a', 'scene-b'], [0.1, 1], 0.2);
chipsClearOfProps(ID, '^(band-.*|a-valg\\d+|b-valg\\d+|guide-lab|head-a|head-b)$', '^(a-|b-)(bar|seg\\d+|blade\\d+|tray\\d+|shelf|rail)$', [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1]);

bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
lineBreakTest(ID);
noEnglishTest(ID);
