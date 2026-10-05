// LAW-0182 — Interpretación lingüística · mechanism. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: every connector ends at its element, the order does not change when seeking,
// and a relation is never drawn as causation (arrows only for communication/sequence; causal only when
// supplied). Windows (LAW-0182.js W): components slide out 0.03–0.16, relationships drawn 0.18–0.43 (one
// by one), marker 0.45–0.73, legend and key complete by 0.83.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {LABEL_OWNS_CONNECTOR} from './interpretacion-linguistica-checks.js';

const FULL = JSON.stringify(['a', 'utterance', 'interpreter', 'notes', 'interpreter', 'rendering', 'b']);

contractSuite('LAW-0182', {
  continuity: ['tracer'],
  continuityLimit: 45,
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.separated === 0 && s.relationsDrawn.every(p => p === 0)', label: 'start: the people in place, components not yet separated, nothing related'},
    {at: 0.17, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'separate: the components are laid out before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all relationships exist before the marker moves'},
    {at: 0.6, fn: `s.tracerVisible && s.visitOrder.length >= 2 && JSON.stringify(s.visitOrder) === JSON.stringify(${FULL}.slice(0, s.visitOrder.length))`, label: 'the marker follows the supplied traversal order'},
    {at: 0.46, params: {focusElement: 'a'}, fn: 's.focusScale > 1.1', label: 'the focus element enlarges while the marker passes'},
    {at: 1, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${FULL}) && s.focusScale === 1 && s.legendShown === 1 && s.keyShown === 1 && !s.tracerShown`, label: 'gather: full order visited, focus back to size, legend and key shown, neutral hold'},
    {at: 0.6, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${FULL}.slice(0, s.visitOrder.length))`, label: 'seeking back (after the end) gives the same partial order'},
    {at: 1, fn: 's.connectorGaps.length > 0 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, params: {relationships: [{from: 'utterance', to: 'rendering', kind: 'causal', label: 'as supplied'}]}, fn: "s.arrows.length === 1 && s.arrows[0].kind === 'causal' && s.arrows[0].arrow", label: 'a causal link is drawn only when supplied'},
    {at: 1, params: {traversalOrder: ['a', 'utterance', 'rendering', 'b']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['a', 'utterance', 'rendering', 'b'])", label: 'a different traversal order is followed as supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.visitOrder.length === 7', label: 'the mechanism reads with labels hidden'},
    {at: 1, fn: "s.tails.utterance === 'a' && s.tails.rendering === 'interpreter'", label: 'each bubble keeps its own speaker’s tail (the rendering is voiced by the interpreter)'},
  ],
});

suppliedTextSuite('LAW-0182', {
  fields: `const kinds = [...new Set(p.relationships.map(r => r.kind))];
    return [p.actors[0].name, p.actors[1].name, p.actors[2].name, ...p.elements.map(e => e.label), p.languages.a, p.languages.b,
      p.props.utterance, p.props.rendering, ...p.relationships.map(r => r.label || p.relationLabels[r.kind]), ...kinds.map(k => p.relationLabels[k])]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Tipos de vínculo'] : ['As supplied · no conclusion drawn', 'Kinds of link']`,
});

ratioChecks('LAW-0182', 'layout fits; labels beside their own connectors; connectors distinct and readable', [
  {at: [1], fn: 's.labelsFit', label: 'components, names, labels and legend fit', tv: ['all']},
  {at: [1], fn: 's.crossings === 0 && s.minConn >= 70', label: 'connectors never cross each other, a tail, a component or a chip; each ≥ 70 px'},
  {at: [1], fn: 's.relLabelCount === P.relationships.length && s.relLabelMaxDist <= 30', label: 'every relation label within 30 px of its own connector', tv: ['all']},
  {at: [1], dom: LABEL_OWNS_CONNECTOR, label: "rendered: each relation label's nearest connector is its own (≤ 40 px, others ≥ 8 px further)", tv: ['all']},
]);
