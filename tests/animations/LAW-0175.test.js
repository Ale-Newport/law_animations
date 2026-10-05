// LAW-0175 — Intervención de perito · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (the report slot the tag
// is linked to; everything else — person, object, magnifier, tag, page layout, motion — is shared)
// and no legal consequence is invented (only the supplied slot fills; no winner, score or verdict).
// Windows: base 0–0.17 · change marks 0.2–0.32 · parallel action c = (u − 0.40)/0.30 (magnifier held
// c 0.10–0.58 → u 0.43–0.574; tag held c 0.65–0.90 → u 0.595–0.67; pinned from u 0.67) · link
// 0.68–0.72 · fills 0.70–0.77 · guide 0.77–0.85 · neutral note and key 0.82–0.88.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0175').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}) @${at}`,
}))));

contractSuite('LAW-0175', {
  continuity: ['handA', 'handB', 'magA', 'magB', 'tagA', 'tagB'],
  continuityLimit: 70,
  attach: [
    {from: 0.435, to: 0.572, a: 'magA', b: 'handA', tol: 1},
    {from: 0.435, to: 0.572, a: 'magB', b: 'handB', tol: 1},
    {from: 0.597, to: 0.668, a: 'tagA', b: 'handA', tol: 1},
    {from: 0.597, to: 0.668, a: 'tagB', b: 'handB', tol: 1},
    {from: 0.672, to: 1, a: 'tagA', b: 'pinA', tol: 0.5},
    {from: 0.672, to: 1, a: 'tagB', b: 'pinB', tol: 0.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.slot === null && s.lookA.tag === 'bench'", label: 'base: two identical scenes, no slot marked, tags on the bench'},
    {at: 0.3, fn: "s.lookA.slot === 'data' && s.lookB.slot === 'opinion' && s.lookA.fence === 0 && s.lookB.fence > 0 && s.lookA.frameFill > 0 && s.lookA.tag === 'bench' && s.lookB.tag === 'bench'", label: 'change: A outlines the data slot, B closes the scope fence; nothing has moved yet'},
    {at: 0.5, fn: "s.lookA.mag === 'hand' && s.lookB.mag === 'hand' && s.lookA.lens === s.lookB.lens && JSON.stringify(s.lookA.hand) === JSON.stringify(s.lookB.hand)", label: 'parallel: the same examination in both scenes (same hand position)'},
    {at: 0.63, fn: "s.lookA.tag === 'hand' && s.lookB.tag === 'hand' && s.lookA.link === 0 && s.lookB.link === 0", label: 'parallel: both tags travel; no link and no text before the pin'},
    {at: 0.69, fn: 's.lookA.pinned && s.lookB.pinned && s.lookA.rows.every(v => v === 0) && s.lookB.op === 0', label: 'cause first: the slots fill only after the tag is pinned and linked'},
    {at: 1, fn: "s.lookA.rows.every(v => v === 1) && s.lookA.op === 0 && s.lookA.sc === 0 && s.lookB.op === 1 && s.lookB.sc === 1 && s.lookB.rows.every(v => v === 0)", label: 'A: only the data slot filled; B: only the fenced opinion filled'},
    {at: 1, fn: "JSON.stringify(s.differing) === JSON.stringify(['slot']) && s.guide === 1 && s.guideChip === 1 && s.notes === 1 && s.allReached", label: 'exactly the linked slot differs; guide, neutral note and key shown'},
    {at: 1, params: {relationships: [{scenario: 'a', from: 'object', to: 'data'}, {scenario: 'b', from: 'object', to: 'data'}]}, fn: 's.differing.length === 0 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'the same supplied slot in A and B gives identical scenes (nothing invented)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.lookA.slot === 'data' && s.lookB.slot === 'opinion' && s.lookA.rows.every(v => v === 1) && s.lookB.op === 1", label: 'labels hidden: the frame, fence and filled slots still differ'},
    // the scenes stay the subject: side by side each is ≥ 40 % of the width; stacked, full width
    ...each([1], "s.arrangement === 'row' ? s.panelW >= 0.4 : s.panelW >= 0.9", 'the scenes are substantial'),
    ...each([1], '!s.overflow && s.allReached', 'every page and the strip fit uncut; every IK target in reach'),
  ],
});

identicalBeforeChange('LAW-0175', 0.17);

suppliedTextSuite('LAW-0175', {
  fields: "const R = p.props.report; const tA = p.relationships.find(x => x.scenario === 'a').to, tB = p.relationships.find(x => x.scenario === 'b').to; const shown = new Set([tA, tB]); return [p.actors[0].name, p.roles.specialist, p.props.object, p.props.tag, R.title, R.dataHeading, ...(shown.has('data') ? R.measurements : []), R.opinionHeading, ...(shown.has('opinion') ? [R.opinion, R.scope] : []), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: "const R = p.props.report; return [p.props.tag, R.dataHeading, ...R.measurements, R.opinionHeading, R.opinion, R.scope, p.changedFact, p.scenarioA.label, p.scenarioB.label];",
  captions: 'return [p.comparisonLabels.guide];',
});

ratioChecks('LAW-0175', 'review round 1: equal weight, a physical difference, a clear guide, substantial scenes', [
  // equal visual weight: the slot fills sit UNDER the page text (drawn before it) with the same opacity
  {at: [1], dom: "(() => { for (const k of ['A', 'B']) { const f = svg.querySelector(`[data-node=${k}-pg-dfill]`), t = svg.querySelector(`[data-node=${k}-pg-row0]`), o = svg.querySelector(`[data-node=${k}-pg-op]`), ff = svg.querySelector(`[data-node=${k}-pg-fencefill]`); if (!f || !t || !o || !ff) return false; if (!(f.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) return false; if (!(ff.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING)) return false; } return true; })()", label: 'slot fills are drawn beneath the slot text'},
  {at: [1], fn: 'Math.abs(Math.max(s.lookA.frameFill, s.lookA.fenceFill) - Math.max(s.lookB.frameFill, s.lookB.fenceFill)) < 1e-6', label: 'both changed slots get the same fill strength'},
  // the difference is physical: the tag string runs to different heights (its own slot) in A and B
  {at: [1], fn: 's.pinDy >= s.S * 2', label: 'the tags are pinned beside different slots'},
  // the guide runs only through free space and its label covers no text
  {at: [1], fn: 's.guide === 1 && s.guideClear && s.guideChipClear', label: 'guide through free space; guide label clear'},
  // the scenes stay the subject: people ≥ 25 % of the design height; the board ≤ 75 % of a panel
  {at: [0, 0.3, 1], fn: 's.handsOnBench', label: 'hands rest on the bench in both scenes (rest pose)'},
  {at: [1], fn: 's.personFrac >= 0.25 && s.pageShare <= 0.75 && !s.gearHidden', label: 'specialist and object read (substantial person, gear not hidden)', presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es']},
  // long-labels-stress: every ratio keeps the person substantial; only the 1:1 stress case may widen the
  // page (to ≤ 82 % of the panel) so that its text stays at the floor size — reported as a known compromise
  {at: [1], fn: 's.personFrac >= 0.25 && s.pageShare <= 0.75 && !s.gearHidden', label: 'specialist and object read (stress, wide/tall)', presets: ['long-labels-stress'], ratios: ['16:9', '9:16']},
  {at: [1], fn: 's.personFrac >= 0.25 && s.pageShare <= 0.82 && !s.gearHidden', label: 'specialist and object read (stress, square)', presets: ['long-labels-stress'], ratios: ['1:1']},
  // review round 1 (standing rule): no supplied text is drawn over its placeholder dashes mid-transition
  {at: times(0.4, 0.95, 0.005), dom: `[...svg.querySelectorAll('[data-node]')].filter(e => /-ph-(row\\d+|op)$|^d-ph\\d+$|^op-ph$/.test(e.dataset.node)).every(ph => { const n = ph.dataset.node; const tn = n.replace('-ph-row', '-row').replace(/-ph-op$/, '-op').replace(/^d-ph/, 'd-row').replace(/^op-ph$/, 'op-text'); const t = svg.querySelector('[data-node="' + tn + '"]'); const o = e => Number(e.getAttribute('opacity') ?? 1); return !t || o(ph) === 0 || o(t) === 0; })`, label: 'placeholder leaves before its text arrives', presets: ['baseline-illustrative', 'long-labels-stress'], tv: ['all']},
]);
