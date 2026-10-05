// LAW-0174 — Intervención de perito · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends at its element, the visiting order does not change when
// seeking (the contract determinism checks plus the visit-order assertions below), and a plain
// relation is never drawn as causation (no arrowhead; causal only when supplied).
// Windows: separate 0.02–0.16 · relations 0.19–0.42 (one by one) · tag tracer 0.44–0.74 (parts take
// their supplied state as the tag arrives; late parts at 0.74) · legend 0.77–0.83 · key 0.80–0.86.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0174').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}) @${at}`,
}))));

contractSuite('LAW-0174', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.states.data === 0 && s.states.opinion === 0', label: 'start: parts stacked, no relation, no state'},
    {at: 0.17, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'separate: the parts are apart before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.43, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible && s.states.data === 0', label: 'all supplied relations exist before the tag moves; no state yet'},
    ...[0.5, 0.55, 0.6, 0.65, 0.7].map(at => ({at, fn: "s.visitOrder.length >= 1 && JSON.stringify(['specialist','object','data','opinion'].slice(0, s.visitOrder.length)) === JSON.stringify(s.visitOrder)", label: `the tag follows the supplied traversal order (prefix so far) @${at}`})),
    ...[0.5, 0.55, 0.6, 0.65, 0.7].map(at => ({at, fn: "(s.visitOrder.includes('data') || s.states.data === 0) && (s.visitOrder.includes('opinion') || s.states.opinion === 0)", label: `a part takes its state only after the tag reaches it @${at}`})),
    {at: 0.72, fn: "s.focus === 'opinion' && s.focusScale > 1.05", label: 'the focus element enlarges while the tag passes it'},
    {at: 1, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['specialist','object','data','opinion']) && s.states.data === 1 && s.states.opinion === 1 && s.states.figure === 1 && s.focusScale === 1", label: 'gather: every part in its supplied state; order complete'},
    {at: 0.74, params: {traversalOrder: ['specialist', 'opinion', 'data']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['specialist','opinion','data'])", label: 'another traversal order is followed as supplied'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, params: {relationships: [{from: 'object', to: 'data', kind: 'causal', label: 'as supplied'}]}, fn: "s.arrows.length === 1 && s.arrows[0].kind === 'causal' && s.arrows[0].arrow", label: 'a supplied causal link is drawn as causal (only then)'},
    {at: 0.5, fn: 's.connectorGaps.length === 5 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
    ...each([1], 's.labelsFit && s.legendClear && s.layoutFits', 'relation labels placed; legend clear; layout fits uncut'),
  ],
});

suppliedTextSuite('LAW-0174', {
  fields: 'const R = p.props.report; return [p.actors[0].name, p.roles.specialist, p.props.object, p.props.tag, R.title, R.figure, R.dataHeading, ...R.measurements, R.opinionHeading, R.opinion, R.scope, ...p.elements.map(e => e.label), ...p.relationships.map(x => x.label), ...[...new Set(p.relationships.map(x => x.kind))].map(k => p.relationLabels[k])];',
  content: 'const R = p.props.report; return [p.props.tag, R.title, R.figure, R.dataHeading, ...R.measurements, R.opinionHeading, R.opinion, R.scope];',
  captions: 'return [...p.elements.map(e => e.label), ...p.relationships.map(x => x.label)];',
});

ratioChecks('LAW-0174', 'review round 1: link length, labels beside their lines, focus kept clear, chips not crossed', [
  // every connector has a readable length (no stub hidden behind a chip)
  {at: [1], fn: 's.minConnLen >= s.S * 3', label: 'every connector is at least 3 text-heights long'},
  // labels sit beside their own line (placed by perpendicular offset, clear of every connector and element)
  {at: [1], fn: 's.labelsFit && s.labelsOwn && s.labelGap <= s.S * 6', label: 'relation labels seated beside their lines'},
  // the enlarged focus element stays inside the report panel and off the title, other elements and chips
  {at: [0.66, 0.7, 0.72, 0.74, 0.78], fn: 's.focusClear', label: 'focus enlargement stays clear'},
  // no connector runs through the name or object chip
  {at: [1], fn: '!s.chipsCrossed && s.legendClear && s.layoutFits', label: 'chips not crossed by connectors; legend clear; layout fits'},
  // review round 1 (standing rule): no supplied text is drawn over its placeholder dashes mid-transition
  {at: times(0.3, 0.95, 0.005), dom: `[...svg.querySelectorAll('[data-node]')].filter(e => /-ph-(row\\d+|op)$|^d-ph\\d+$|^op-ph$/.test(e.dataset.node)).every(ph => { const n = ph.dataset.node; const tn = n.replace('-ph-row', '-row').replace(/-ph-op$/, '-op').replace(/^d-ph/, 'd-row').replace(/^op-ph$/, 'op-text'); const t = svg.querySelector('[data-node="' + tn + '"]'); const o = e => Number(e.getAttribute('opacity') ?? 1); return !t || o(ph) === 0 || o(t) === 0; })`, label: 'placeholder leaves before its text arrives', presets: ['baseline-illustrative', 'long-labels-stress'], tv: ['all']},
]);
