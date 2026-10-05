// LAW-0713 — Contribución de la persona afectada · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (both trolleys roll together along their lanes; each step object hops
// as its trolley passes), anchoring (trolleys stay on their lane lines and stop before their barriers; steps stand
// beside their supplied lane; the connectors run from the lane ends to the event pad) and a transformation recognizable
// with the labels hidden (two trolleys roll, objects hop, two connectors draw, a brace joins the lanes).
// Windows (LAW-0713.js W): legend 0–0.04 · roll 0.16–0.40 · connectors 0.45–0.56 · brace 0.62–0.66 · loss chip
// 0.66–0.71 · status 0.76–0.80 · notes 0.78–0.82 · key 0.80–0.84.
// Legal (causation-09 brief, VERY high risk): no apportionment, fault, shares, percentages or contributory-negligence
// doctrine; both lanes, trolleys, barriers and connectors have identical stroke, colour, size and timing; the
// convergence is a supplied description only (the trolleys never reach the event).
// Brief customizable fields: all present (events, causalLinks, alternatives, losses, actorLabels, objectLabels,
// actionProgress, annotations, finalState); 'origin' added.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; scene-area floor >= 0.20 of the frame as in
// accepted LAW-0701..0712): the long-labels-stress step COUNT is capped at four (baseline 2). Rendered at 1080p
// (2026-10-05): six steps → 1:1 scene area 0.137; four steps with every other field at full count → 0.209.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {sweep, textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, inFrameSweep, sceneAreaShare, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest} from './contribucion-afectada-checks.js';

const ID = 'LAW-0713';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cartA', 'cartB'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.roll === 0 && s.conn === 0 && s.bracket === 0", label: 'rest: lanes, parked trolleys, steps, event; nothing joined'},
    {at: 0.25, fn: 's.roll > 0 && s.roll < 1 && s.cartA.x === s.cartB.x && s.conn === 0', label: 'both trolleys roll together, at the same place on their lanes'},
    {at: 0.43, fn: 's.atBarrier && s.beforeBarrier && s.conn === 0', label: 'the trolleys stop before their barriers before any connector is drawn'},
    {at: 0.5, fn: 's.conn > 0 && s.conn < 1 && s.bracket === 0', label: 'the two connectors draw together'},
    {at: 1, fn: "s.conn === 1 && s.bracket === 1 && s.varShown && s.keyShown && s.finalState === 'convergence-shown' && s.beside.every(Boolean) && s.beforeBarrier", label: 'hold: both connectors, the brace, the loss as supplied and the key; trolleys still before their barriers'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'convergence-disputed' && s.beside.every(Boolean)", label: 'alternative: convergence marked disputed as supplied (never decided)'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.roll === 1 && s.conn === 1 && s.bracket === 1', label: 'labels hidden: the same transformation'},
    {at: 1, fn: "s.kinds.every(k => k === 'relation')", label: 'default connectors are plain relations (no causal arrow unless supplied)'},
  ],
});

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight of the two lanes', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: equalWeight(['cartA', 'cartB']), label: 'the ● and ◆ trolleys have identical weight'},
  {at: [1], dom: equalWeight(['barA', 'barB']), label: 'the two barriers have identical weight'},
]);
// (the connectors draw on with a stroke-dasharray, so equalWeight's dash test does not apply: compare widths and colours)
ratioChecks(ID, 'equal connectors', [
  {at: [1], dom: "(() => { const s = n => [...svg.querySelectorAll('[data-node=\"' + n + '\"] path')].map(q => (q.getAttribute('stroke') || '') + '/' + (q.getAttribute('stroke-width') || '')).join(); return s('cnA') !== '' && s('cnA') === s('cnB'); })()", label: 'the two connectors have identical stroke width and colour'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.origin.name, ...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.record, p.objectLabels.laneA, p.objectLabels.laneB, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'no red (rendered)', [
  {at: [0.5, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

restHoldFill(ID, [0.1, 1]);
thinContent(ID);
subjectHeight(ID, [['field']], [0.1, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
sceneAreaShare(ID, ['field', 'floor'], [0.1, 1], 0.2);
chipsClearOfProps(ID, '^(band-.*|varg|rec)$', '^(field|bracket)$', [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1]);
sweep(ID, 'each step object >= 40 px tall at 1080p (rendered)', `
  x.seek(x.durationMs);
  const F = frameBox(), k = 1080 / Math.min(F.width, F.height);
  let mn = Infinity;
  for (const e of svg.querySelectorAll('[data-node^="item"]')) { const hh = e.getBoundingClientRect().height * k; mn = Math.min(mn, hh); if (hh < 40) out.push(tag + ': ' + e.getAttribute('data-node') + ' ' + hh.toFixed(1) + ' px'); }
  return 'min object ' + mn.toFixed(1) + ' px';
`);

bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
lineBreakTest(ID);
noEnglishTest(ID);
sweep(ID, 'DBGLAYOUT', `if (ctx.ratio !== '1:1') return; x.seek(x.durationMs); const l = x.getState({bounds: false}).semantic.layout; return l.mode + ' PH ' + l.PH + ' size ' + l.size;`, {tvs: ['all'], presets: ['long-labels-stress']});
