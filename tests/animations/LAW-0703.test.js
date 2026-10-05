// LAW-0703 — Pérdida económica · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete flow machines of equal size), exactly the indicated fact
// changes (only B's ◆ gate is open and lets the supplied stated difference out; A's ● plate stays shut) and no legal
// consequence is invented to complete the contrast (a neutral note and the key; no winner, no outcome).
// Windows (LAW-0703.js W): heads 0.02–0.10 · shared entries 0.04–0.12 · ● plate / ◆ gate 0.20–0.34 · changed-fact chip
// 0.22–0.30 · entries run in both 0.40–0.62 · B's stated difference 0.63–0.74 · level line 0.77–0.81 · bracket
// 0.79–0.84 · neutral note 0.82–0.87 · key 0.84–0.89.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; subject >= 0.20 of the frame height,
// causation-05 LAW-0700 decision in production/SESSION_HANDOFF.md): the long-labels-stress COUNTS are capped; true
// driver, fallbacks tried and rendered before/after numbers in LAW-0703.presets.json.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, sweep, inFrameSweep, sceneAreaShare, chipsClearOfProps} from './perdida-economica-checks.js';

const ID = 'LAW-0703';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tokA0', 'tokB0'],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.stackA === 0 && s.stackB === 0 && s.gateB === 0", label: 'base: two identical empty machines; no gate yet'},
    {at: 0.36, fn: "s.gateB === 1 && s.flow === 0 && s.stackA === 0 && s.stackB === 0", label: 'change: the plates are in place before anything flows'},
    {at: 0.5, fn: 's.flow > 0 && s.flow < 1 && JSON.stringify(s.lookA.tokens) === JSON.stringify(s.lookB.tokens)', label: 'the same entries run in parallel, token for token'},
    {at: 0.625, fn: 's.flow === 1 && s.stackA === s.refTokens && s.stackB === s.refTokens && s.gapB === 0', label: 'both machines reach the same reference level before B lets anything out'},
    {at: 0.76, fn: 's.stackA === s.refTokens && s.stackB === s.allegedTokens && !s.guideShown', label: 'only B lets out the supplied stated difference'},
    {at: 1, fn: 's.guideShown && s.keyShown && s.stackA === s.refTokens && s.stackB === s.allegedTokens', label: 'hold: the level line, the bracket, the neutral note and the key'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.stackB === s.allegedTokens && s.guideShown', label: 'alternative: the workshop entries and their stated difference'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.stackB === s.allegedTokens && s.guideShown', label: 'labels hidden: the same contrast'},
  ],
});

identicalBeforeChange(ID, 0.2);

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: equalWeight(['plateA', 'plateB']), label: 'the ● plate and the ◆ plate have identical weight, both solid'},
  {at: [1], dom: equalWeight(['columnA', 'columnB']), label: 'the two machines are drawn with identical weight'},
  {at: [1], tv: ['all'], dom: equalWeight(['hA', 'hB']), label: 'the A and B heads have identical weight'},
]);

ratioChecks(ID, 'no red for the loss (rendered)', [
  {at: [0.3, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.scenarioA.label, p.scenarioB.label, p.changedFact]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Same|Changed|Only|Reference|Alleged|Stated|supplied|conclusion|units|fictional|winner|Model)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

// Each scene's share of the FRAME width: >= 0.40 side by side, >= 0.71 stacked, >= 0.55 stacked beside a text column
// (the lane is the floor each machine stands on), labels shown and hidden, at rest and at the hold.
sweep(ID, 'each scene spans its share of the frame width (rendered)', `
  let worst = Infinity;
  for (const u of [0.1, 1]) {
    x.seek(u * x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    const F = frameBox();
    const need = s.arrangement === 'row' ? 0.4 : s.arrangement === 'textcol' ? 0.55 : 0.71;
    for (const n of ['floorA', 'floorB']) {
      const w = svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect().width / F.width;
      worst = Math.min(worst, w);
      if (w < need - 0.002) out.push(tag + ' u=' + u + ': ' + n + ' ' + w.toFixed(3) + ' < ' + need + ' (' + s.arrangement + ')');
    }
  }
  return 'min scene width ' + worst.toFixed(3);
`);

restHoldFill(ID, [0.1, 1]);
thinContent(ID);
// the subject: each machine (column and hopper) standing on its floor
subjectHeight(ID, [['columnA', 'hopperA', 'floorA'], ['columnB', 'hopperB', 'floorB']], [0.1, 1]);
coldCreate(ID);
inFrameSweep(ID);

// locale "es" with the default content (review 2026-09-27): the default events, stated difference and captions are
// drawn in Spanish too (fields left at their English default take their Spanish default)
ratioChecks(ID, 'locale es with default params draws no English', [
  {at: [0.1, 0.62, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Month|Shop|Supplier|Flow|record|Reference|Alleged|Stated|supplied|conclusion|units|fictional|Before|After|Changed|Only|Same|Hopper|gate|related)\\b/.test(t.textContent))", label: 'no English text with locale es and default params'},
]);

// Review 2026-09-27: the guide chip covered B's right-tray token at the hold — no chip covers a prop (trays, tokens,
// columns, hoppers, plates, B's gate) in any preset × ratio; plus scene area and safe-box area fill.
chipsClearOfProps(ID, '^(band-.*|guide-chip|hA|hB)$', '^(trayR[AB]|t[AB]\\d+|column[AB]|hopper[AB]|plate[AB]|gateB)$', [0.1, 0.3, 0.5, 0.62, 0.7, 0.8, 0.9, 1]);
sceneAreaShare(ID, ['columnA', 'hopperA', 'floorA', 'columnB', 'hopperB', 'floorB'], [0.1, 1], 0.2);
