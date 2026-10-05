// LAW-0717 — Distribución ilustrativa de pérdidas · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (the blades slide and drop, the pieces spread and run down their rails
// without jumps), anchoring (each piece ends in its own tray; the blades cut on the boundaries the supplied values give;
// nothing moves before the values appear) and a transformation recognizable with the labels hidden (one bar becomes
// pieces in trays).
// Windows (LAW-0717.js W): legend 0–0.04 · values 0.15–0.20 · blades slide 0.19–0.27 · cut 0.27–0.33 · spread
// 0.33–0.41 · pieces run down 0.42–0.66 (staggered) · blades lift 0.66–0.71 · status 0.74–0.78 · notes 0.76–0.80 · key
// 0.78–0.82.
// Legal (causation-10 brief, very high risk): no apportionment doctrine, no computed percentage, no fault; piece lengths
// follow only the supplied hypothetical values (labelled hypothetical); both supplied allocations are listed in
// identical chips, neither preferred.
// Brief customizable fields: all present (events, causalLinks, alternatives, losses, actorLabels, objectLabels,
// actionProgress, annotations, finalState); 'unit', 'allocationLabels' and 'allocation' added.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; scene-area floor >= 0.20 of the frame as in
// accepted LAW-0701/0705): the long-labels-stress COUNTS are capped (four events kept; one total, no account, no
// connector note, one note). Rendered at 1080p (2026-10-05, pre-cap copy production/scratch/causation-10/
// LAW-0717.stress-precap.json): full counts → 1:1 scene area 0.086, 9:16 0.189; after the cap 1:1 0.235, 9:16 0.226,
// 16:9 0.321. Fallbacks tried: panel beside / below, compact rail zone, staggered value chips, rail zone that fills the box.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, inFrameSweep, sceneAreaShare, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest} from './distribucion-perdidas-checks.js';

const ID = 'LAW-0717';
const P = name => presetsFor(ID).find(q => q.name === name).params;

// piece widths are proportional to the supplied values (the same length per unit for every piece)
const PROPORTIONAL = 's.widths.every((w, i) => Math.abs(w / s.values[i] - s.widths[0] / s.values[0]) < 0.02 * s.widths[0] / s.values[0])';

contractSuite(ID, {
  continuity: ['seg0', 'seg1', 'blade0'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.barWhole && s.slide === 0 && s.cut === 0 && s.drops.every(q => q === 0)", label: 'rest: the whole bar, the blades parked, the trays empty'},
    {at: 0.19, fn: 's.valuesShown === 1 && s.slide === 0 && s.barWhole', label: 'the supplied values appear before any blade moves'},
    {at: 0.3, fn: 's.slide === 1 && s.cut > 0 && s.cut < 1 && s.barWhole', label: 'the blades reach the boundaries and cut'},
    {at: 0.38, fn: '!s.barWhole && s.spread > 0 && s.drops.every(q => q === 0)', label: 'the pieces spread apart on the shelf'},
    {at: 0.5, fn: 's.drops[0] > 0 && s.drops[s.drops.length - 1] < 1', label: 'the pieces run down their rails one after another'},
    {at: 0.7, fn: 's.inTray.every(Boolean)', label: 'every piece rests in its own tray'},
    {at: 1, fn: `s.inTray.every(Boolean) && s.lift === 1 && s.keyShown && s.statusShown && ${PROPORTIONAL}`, label: 'hold: pieces in trays, lengths proportional to the supplied values, status and key'},
    {at: 1, fn: 's.seg0.x === s.trayX[0] && Math.abs(s.seg0.y - s.landY) < 0.5', label: 'piece 1 ends centred in tray 1'},
    {at: 1, params: P('contrast-or-alternative'), fn: `s.allocation === 'b' && s.finalState === 'division-disputed' && s.inTray.every(Boolean) && ${PROPORTIONAL}`, label: 'alternative: divided by allocation B, marked disputed as supplied (never decided)'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && !s.inTray.every(Boolean)', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.inTray.every(Boolean) && !s.barWhole', label: 'labels hidden: the same transformation'},
  ],
});

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: '!s.problems', label: 'a real composition is found (no fallback)'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight of the two allocation chips', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: equalWeight(['band-alloc-a', 'band-alloc-b']), tv: ['all'], label: 'the A and B allocation chips have identical weight'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.losses[0].label, ...(p.losses[1] ? [p.losses[1].label] : []), ...p.events.map(e => e.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.actorLabels.a, p.actorLabels.b, p.allocationLabels.a, p.allocationLabels.b, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.map(e => e.label), p.allocationLabels.a, p.allocationLabels.b]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

// no alarm styling: nothing in the scene is drawn in the theme's red accent
ratioChecks(ID, 'no red (rendered)', [
  {at: [0.5, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

restHoldFill(ID, [0.1, 1]);
thinContent(ID);
// the subject: the rack (rail, shelf with the bar or pieces) and the trays on the floor
subjectHeight(ID, [['rail', 'shelf', 'trays', 'floor']], [0.1, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
sceneAreaShare(ID, ['rail', 'shelf', 'trays', 'floor', 'bar'], [0.1, 1], 0.2);
chipsClearOfProps(ID, '^(band-.*|valg\\d+)$', '^(bar|seg\\d+|blade\\d+|tray\\d+|shelf|rail)$', [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1]);

bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
// 'allocation' is an enum (a / b): the stress keeps 'a' like the baseline
stressLongerTest(ID, 'causation', {capped: ['allocation']});
lineBreakTest(ID);
noEnglishTest(ID);
