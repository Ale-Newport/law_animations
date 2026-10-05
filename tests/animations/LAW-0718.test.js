// LAW-0718 — Distribución ilustrativa de pérdidas · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element (anchored on the part boxes' edges), the order does not
// change on seek (the contract's ordered / reverse / shuffled determinism plus the visit order below) and a plain
// relation is never drawn as causality (no arrowhead; a causal link only when supplied, in ink, never red).
// Windows (LAW-0718.js W): legend 0–0.04 · parts move apart 0.02–0.16 · names 0.12–0.18 · relationships 0.19–0.42
// (one after another) · tracer 0.44–0.73 · state 0.78–0.84 · key 0.82–0.87.
// Legal (causation-10 brief): no apportionment doctrine, no computed percentage, no fault; the bar carries both supplied
// allocations' boundaries as ● / ◆ ticks of equal weight; values hypothetical and labelled so.
// Brief customizable fields: events, causalLinks, alternatives, losses, elements, relationships, focusElement,
// relationLabels, traversalOrder — all present; 'unit' and 'allocationLabels' added.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; scene-area floor >= 0.20 of the frame as in
// accepted LAW-0701/0705): the long-labels-stress COUNTS are capped (four events and one account kept; one total, no
// connector note). Rendered at 1080p (2026-10-05, pre-cap copy production/scratch/causation-10/
// LAW-0718.stress-precap.json): full counts → 1:1 area 0.135; after the cap 1:1 0.284, 9:16 0.440, 16:9 0.355.
// Fallbacks tried: ring and diamond compositions with the panel beside / below, wide chips, relation chips along connectors.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {sweep, textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, inFrameSweep, sceneAreaShare, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest} from './distribucion-perdidas-checks.js';

const ID = 'LAW-0718';
const P = name => presetsFor(ID).find(q => q.name === name).params;

// each connector's two ends lie on (within 20 units outside) the edges of its own two part boxes
const ANCHORED = `s.relEnds.every(e => [[e.a, s.boxes[e.from]], [e.b, s.boxes[e.to]]].every(([pt, b]) => pt.x >= b.x - 20 && pt.x <= b.x + b.w + 20 && pt.y >= b.y - 20 && pt.y <= b.y + b.h + 20 && !(pt.x > b.x + 1 && pt.x < b.x + b.w - 1 && pt.y > b.y + 1 && pt.y < b.y + b.h - 1)))`;

contractSuite(ID, {
  continuity: ['tracer', 'part_loss', 'part_barriers', 'part_connectors', 'part_events'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.explode === 0", label: 'start: the parts packed together'},
    {at: 0.18, fn: 's.explode === 1 && s.trace === 0', label: 'the parts stand apart before any relationship is traced'},
    {at: 0.3, fn: ANCHORED, label: 'every connector is anchored on its own two parts'},
    {at: 0.3, fn: "!s.relKinds.includes('causal')", label: 'default: no relationship is drawn as causal'},
    {at: 0.55, fn: "s.trace > 0 && s.trace < 1 && s.visits.join() === 'loss,barriers,connectors,events'", label: 'the tracer follows the traversal order'},
    {at: 0.5, fn: 's.focusScale >= 1', label: 'the focus part is never shrunk while traced'},
    {at: 1, fn: `s.keyShown && s.focusScale === 1 && ${ANCHORED}`, label: 'hold: the mechanism assembled, connectors still anchored, the key'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.relKinds.includes('causal') && s.focus === 'connectors' && s.visits[0] === 'events'", label: 'alternative: a supplied causal link, another focus and order'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: `${ANCHORED} && s.explode === 1`, label: 'labels hidden: the same mechanism'},
  ],
});

// the focus part enlarges while the tracer passes over it (largest scale over the trace window, every preset × ratio ×
// labels state)
sweep(ID, 'the focus part enlarges while the tracer passes', `
  let peak = 0;
  for (let u = 0.44; u <= 0.74; u += 0.005) { x.seek(u * x.durationMs); peak = Math.max(peak, x.getState({bounds: false}).semantic.focusScale); }
  if (!(peak > 1.1)) out.push(tag + ': focus peak scale ' + peak);
  return 'peak ' + peak;
`);

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: '!s.problems', label: 'a real composition is found (no fallback)'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, relations without arrowheads', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: "[...svg.querySelectorAll('[data-node^=\"rel\"][data-node$=\"-head\"]')].length === [...svg.querySelectorAll('[data-node^=\"rel\"][data-node$=\"-line\"]')].length - [...svg.querySelectorAll('[data-node^=\"rel\"][data-node$=\"-dotA\"]')].length", label: 'only sequence / causal connectors carry an arrowhead; plain relations have end dots'},
  {at: [1], dom: equalWeight(['loss-tA0', 'loss-tB0']), label: 'the ● A and ◆ B ticks have identical weight'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.losses[0].label, ...(p.losses[1] ? [p.losses[1].label] : []), ...p.events.map(e => e.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), ...p.elements.map(e => e.label), p.allocationLabels.a, p.allocationLabels.b]",
  content: "return [...p.events.map(e => e.label), ...p.elements.map(e => e.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'no red (rendered)', [
  {at: [0.5, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

restHoldFill(ID, [0.2, 1]);
thinContent(ID);
subjectHeight(ID, [['art-loss', 'art-barriers', 'art-connectors', 'art-events']], [0.2, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
sceneAreaShare(ID, ['art-loss', 'art-barriers', 'art-connectors', 'art-events'], [0.2, 1], 0.2);
chipsClearOfProps(ID, '^(band-.*|rlabg\\d+)$', '^art-.*$', [0.2, 0.4, 0.6, 0.8, 1]);

bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
lineBreakTest(ID);
noEnglishTest(ID);
