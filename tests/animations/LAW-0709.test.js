// LAW-0709 — Alcance del daño · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (the inner ring grows out of the event's pad, the outer ring out of the
// inner ring; each object hops as its ring reaches it), anchoring (the rings are centred on the event, the posts stand
// on their rings' rims, every object stands inside the ring it is supplied for; nothing moves before its record rows
// light) and a transformation recognizable with the labels hidden (two rings grow, objects hop, two posts rise).
// Windows (LAW-0709.js W): legend 0–0.04 · inner rows lit 0.15–0.29 · inner ring 0.16–0.27 · ● post 0.26–0.31 ·
// outer rows lit 0.31–0.60 · outer ring 0.33–0.56 · ◆ post 0.55–0.60 · bracket 0.63–0.67 · grouping chip 0.67–0.72 ·
// status 0.76–0.80 · notes 0.78–0.82 · key 0.80–0.84.
// Legal (causation-08 brief, VERY high risk): the rings are ONLY a supplied grouping — no remoteness or scope doctrine
// (no foreseeability, directness test, proximate cause, novus actus, "too remote"), no liability, quantum, outcome or
// jurisdiction; both rings and both posts have identical stroke, colour and weight (no red, no fading, no dashes); the
// outer ring is "to be examined" in words only; objects only, nobody is injured; ●/◆ at equal weight.
// Brief customizable fields: all present (events, causalLinks, alternatives, losses, actorLabels, objectLabels,
// actionProgress, annotations, finalState); none omitted; 'origin' added.
// People floors: no people in this motif (objects only); the object floors are the no-token checks below (>= 85 px,
// >= 70 px in stress) and the subject >= 0.20 of the frame height (causation-05 LAW-0700 decision); physical scene area
// >= 0.20 of the frame in EVERY preset (accepted causation tests LAW-0701..0708), no exemption.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; scene-area floor >= 0.20 of the frame in
// every preset as in accepted LAW-0701..0708): the long-labels-stress COUNTS are capped. True driver: the 1:1 box — the
// physical scene (plate, event, objects, rings, posts, floor) >= 0.20 of the frame area with stress text >= 16 px.
// Fallbacks tried: side, split, tall (right-hand column), below, below2 and the compact-list composition. Rendered at
// 1080p (2026-10-05; pre-cap copy production/scratch/causation-08/LAW-0709.stress-precap.json): full counts (6
// consequences, 2 accounts, 1 link, 2 grouping items, 2 notes) → 'list' 17 px area 0.121; 5 consequences → 0.138; 4
// consequences → 0.153; 1 account + 1 note → 0.143; 4 consequences + 1 account + 1 note → 0.190; the same with 1
// grouping item → 0.211 (0.202 once the event name was shortened to keep its parenthetical whole — under the margin);
// the same without the link note → 0.217. Capped to 4 consequences (the first four), 1 account, 1 grouping item, 1
// note and no link note (baseline 3 / 0 / 1 / 1 / 0); every text field keeps its near-maximum length. After: 1:1
// 'tall' 17 px area 0.211 (labels hidden 0.215).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {sweep, textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, inFrameSweep, sceneAreaShare, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest, noTokenTest} from './alcance-dano-checks.js';

const ID = 'LAW-0709';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['edge'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.ring1 === 0 && s.ring2 === 0 && s.post1 === 0 && s.post2 === 0 && s.radius1 === 0", label: 'rest: event and supplied consequences; no ring, no post yet'},
    {at: 0.2, fn: 's.ring1 > 0 && s.ring1 < 1 && s.ring2 === 0 && s.lit.some(Boolean)', label: 'the immediate rows light and the inner ring grows out of the event'},
    {at: 0.32, fn: 's.ring1 === 1 && s.post1 === 1 && s.ring2 === 0', label: 'the inner ring and its ● post are in place before the outer ring starts'},
    {at: 0.45, fn: 's.ring2 > 0 && s.ring2 < 1 && s.radius2 > s.radius1', label: 'the outer ring grows out of the inner ring'},
    {at: 0.62, fn: 's.ring2 === 1 && s.post2 === 1 && s.bracket === 0', label: 'both rings and posts are in place before the bracket'},
    {at: 1, fn: "s.bracket === 1 && s.varShown && s.keyShown && s.finalState === 'grouping-shown' && s.inside.every(Boolean)", label: 'hold: both rings, both posts, the grouping as supplied and the key; every object inside its supplied ring'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'grouping-disputed' && s.inside.every(Boolean)", label: 'alternative: the grouping marked disputed as supplied (never decided)'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.ring1 === 1 && s.ring2 === 1 && s.post2 === 1', label: 'labels hidden: the same transformation'},
  ],
});

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight of the two rings and posts', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: equalWeight(['post1', 'post2']), label: 'the ● and ◆ posts have identical weight, both solid'},
  {at: [1], dom: equalWeight(['ring1', 'ring2']), label: 'the inner and outer rings have identical stroke and weight, both solid'},
  {at: [1], dom: "['ring1', 'ring2'].map(n => svg.querySelector('[data-node=\"' + n + '\"]')).every(e => e.getAttribute('opacity') === '1' && [...e.querySelectorAll('path')].map(q => q.getAttribute('stroke')).join() === [...svg.querySelectorAll('[data-node=\"ring1\"] path')].map(q => q.getAttribute('stroke')).join())", label: 'both rings fully opaque and drawn in the same colours (no fading, no red)'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.origin.name, ...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.record, p.objectLabels.inner, p.objectLabels.outer, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label)]",
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
// the subject: the field (plate, event, objects, rings, posts)
subjectHeight(ID, [['field']], [0.1, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
// Physical scene area >= 0.20 of the frame in EVERY preset, long-labels-stress included, labels shown and hidden, at
// rest and hold (LAW-0701..0708 measure; no exemption).
sceneAreaShare(ID, ['field', 'floor'], [0.1, 1], 0.2);
// the chips in the record's column start directly under the record (<= 22 px)
sweep(ID, 'column chips attached to the record (rendered)', `
  if (ctx.ratio !== '1:1') return;
  x.seek(0.5 * x.durationMs);
  const s = x.getState({bounds: false}).semantic;
  if (s.layout.mode !== 'tall') return 'mode ' + s.layout.mode;
  const F = frameBox(), k = 1080 / F.height;
  const rec = svg.querySelector('[data-node="rec"]').getBoundingClientRect();
  const col = [...svg.querySelectorAll('[data-node^="band-"]')].filter(e => eff(e) > 0.5).map(e => e.getBoundingClientRect()).filter(b => b.left >= rec.left - 12 && b.top > rec.bottom - 1).sort((a, b) => a.top - b.top);
  if (col.length && (col[0].top - rec.bottom) * k > 22) out.push(tag + ': first visible column chip ' + Math.round((col[0].top - rec.bottom) * k) + ' px below the record');
  return 'gap ' + (col.length ? Math.round((col[0].top - rec.bottom) * k) : '-');
`, {tvs: ['all']});
chipsClearOfProps(ID, '^(band-.*|varg|rec)$', '^(field|post1|post2|bracket)$', [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1]);
noTokenTest(ID, ['field'], [0.1, 0.5, 1]);
// every consequence object stays a real object (not a token): >= 40 px tall at 1080p in every preset
sweep(ID, 'each consequence object >= 40 px tall at 1080p (rendered)', `
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
