// LAW-0705 — Agravación de daño · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion (the ◆ flag rides the mark's edge from the initial to the later level),
// anchoring (the flags stand in the rail at the supplied levels; the mark never passes its level line; nothing moves
// before its record rows light) and a transformation recognizable with the labels hidden (the mark spreads across the
// panel, ● / ◆ flags and edge lines mark the two supplied states, stripes and a bracket show the variation as supplied).
// Windows (LAW-0705.js W): legend 0–0.04 · prior-condition rows lit 0.15–0.26 · ● flag 0.15–0.20, edge line 0.19–0.25
// · later-change rows lit 0.26–0.62 · ◆ flag 0.26–0.31 · spread 0.31–0.62 · stripes 0.62–0.67 · bracket 0.66–0.70 ·
// variation chip 0.69–0.74 · status 0.76–0.80 · notes 0.78–0.82 · key 0.80–0.84.
// Legal (causation-07 brief): objects only, no person; neither state is a harm caused by someone; no causation test or
// doctrine, fault, liability, quantum, outcome or jurisdiction; ●/◆ at equal weight; levels are placeholders on an
// illustrative scale.
// Brief customizable fields: all present (events, causalLinks, alternatives, losses, actorLabels, objectLabels,
// actionProgress, annotations, finalState); none omitted.
// People floors: no people in this motif (objects only); the object floors are the no-token checks below (>= 85 px at
// 1:1 baseline, >= 70 px in stress) and the subject >= 0.20 of the frame height (causation-05 LAW-0700 decision).
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; scene-area floor >= 0.20 of the frame in
// every preset as in accepted LAW-0701): the long-labels-stress COUNTS are capped. True driver: the 1:1 box — the
// physical scene (panel, flags, floor) >= 0.20 of the frame area with stress text >= 16 px. Fallbacks tried: side,
// split, tall (right-hand column), below, below2 and a compact-list composition ('list': panel left, the variation
// chip, record and legend as a compact list in a right-hand column continuing under the panel). Rendered at 1080p
// (2026-10-05; pre-cap copy production/scratch/causation-07/LAW-0705.stress-precap.json): full counts (5 entries, 2
// accounts, 1 link, 2 variation items, 2 notes) → old 'tall' 17 px area 0.101; 'list' 17 px 0.153 (16 px 0.184); 1
// account + 1 note → 0.176; 4 entries only → 0.169; 4 entries + 1 note + the longer account → 0.184. Capped to 4
// entries (the first four), 1 account (the first), 1 note (the first) — baseline 3 / 0 / 1; link and both variation
// items kept; every text field keeps its near-maximum length. After: 1:1 'list' 17 px area 0.211 (labels hidden
// 'tall' 0.258); 16:9 'split' 19 px 0.393; 9:16 'below' 20 px 0.226.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {sweep, textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, inFrameSweep, sceneAreaShare, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest, noTokenTest} from './agravacion-dano-checks.js';

const ID = 'LAW-0705';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['flagBPos', 'edge'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.level === s.initial && s.flagA === 0 && s.flagB === 0 && s.spread === 0", label: 'rest: the mark at the supplied initial level; no flag yet'},
    {at: 0.22, fn: 's.flagA === 1 && s.flagB === 0 && s.lit.some(Boolean) && s.level === s.initial', label: 'the prior-condition rows light and the ● flag marks the initial level'},
    {at: 0.3, fn: 's.flagB > 0 && s.spread === 0 && s.level === s.initial && s.lit.some(Boolean)', label: 'the later-change rows light before the mark moves'},
    {at: 0.45, fn: 's.spread > 0 && s.spread < 1', label: 'the mark spreads, the ◆ flag riding its edge'},
    {at: 0.63, fn: 's.spread === 1 && s.level === s.later && s.bracket === 0', label: 'the mark reaches the supplied later level before the bracket'},
    {at: 1, fn: "s.bracket === 1 && s.stripes === 1 && s.varShown && s.keyShown && s.finalState === 'variation-shown' && s.level === s.later", label: 'hold: both flags, stripes, the bracket, the variation as supplied and the key'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'variation-disputed' && s.level === s.later", label: 'alternative: the later state marked disputed as supplied (never decided)'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped', label: 'actionProgress freezes the action part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.level === s.later && s.flagB === 1 && s.stripes === 1', label: 'labels hidden: the same transformation'},
  ],
});

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight of the two flags', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: equalWeight(['flagA', 'flagB']), label: 'the ● and ◆ flags have identical weight, both solid'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.object.name, ...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.record, p.objectLabels.initial, p.objectLabels.later, ...p.annotations.map(a => a.text)]",
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
// the subject: the panel on its stand with the two flags (visible on the rail's siding from the first frame)
subjectHeight(ID, [['panel', 'flagA', 'flagB']], [0.1, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
// Physical scene area >= 0.20 of the frame (the LAW-0701 review measure) in EVERY preset, long-labels-stress included,
// labels shown and hidden, at rest and hold (review 2026-10-05: the earlier 0.09 stress exemption is removed).
sceneAreaShare(ID, ['panel', 'floor', 'flagA', 'flagB'], [0.1, 1], 0.2);
// (review 2026-10-05, 1:1 default) the chips in the record's column start directly under the record (<= 22 px): the
// rows shown from the first frame come first, so nothing hangs detached below an empty gap mid-run
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
chipsClearOfProps(ID, '^(band-.*|varg|rec)$', '^(panel|flagA|flagB|bracket)$', [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1]);
noTokenTest(ID, ['panel'], [0.1, 0.5, 1]);

bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
lineBreakTest(ID);
noEnglishTest(ID);
