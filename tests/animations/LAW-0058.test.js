// LAW-0058 — Lectura de sumario · mechanism. Contract battery + ID-specific checks
// (brief acceptanceCheck: every connector ends on its element, the order does
// not change when seeking, and a relation is not drawn as causation by default).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0058', {
  continuity: ['tracer', 'cardAt', 'passageAt'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.passageMarked === 0 && s.passageLifted === 0 && s.relationsDrawn.every(p => p === 0)', label: 'starts assembled: passage in its slot, nothing drawn'},
    {at: 0.2, fn: 's.passageLifted === 1 && s.relationsDrawn.every(p => p < 1)', label: 'components separate before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all relations drawn before the tracer runs'},
    {at: 0.44, fn: 's.passageMarked === 0 && !s.pointerLit', label: 'the passage is not marked before the tracer arrives'},
    {at: 1, fn: 's.passageMarked === 1 && s.pointerLit && !s.tracerVisible', label: 'ends with the pointer lit and the passage marked'},
    {at: 0.5, fn: 's.connectorsLand', label: 'every connector starts and ends on its element edge'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.connectorsLand', label: 'connectors still land with labels hidden'},
    {at: 0.5, fn: "s.relationKinds.every((k, i) => (k === 'relation') === !s.arrowheads[i]) && !s.relationKinds.includes('causal')", label: 'plain relations have no arrowhead; nothing is causal by default'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['search','card','passage','document','library'])", label: 'tracer follows the supplied traversal order'},
    {at: 0.9, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['search','card','passage','document','library'])", label: 'the order is the same when seeking elsewhere'},
    {at: 0.6, params: {traversalOrder: ['library', 'document', 'passage', 'card', 'search']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['library','document','passage','card','search'])", label: 'a reversed traversal order is honoured'},
    // occlusion, not only geometry: no connector end under a caption / tag /
    // relation label and no caption across a connector, in all three shapes
    {at: 0.5, fn: 's.labelsClearOfConnectors', label: 'no connector end is hidden under a caption, tag or label (16:9, 9:16 and 1:1 layouts)'},
    {at: 0.5, params: {locale: 'es', elements: [{id: 'search', label: 'Buscador'}, {id: 'card', label: 'Ficha del sumario'}, {id: 'passage', label: 'Pasaje resumido'}, {id: 'document', label: 'Texto de la resolución'}, {id: 'library', label: 'Tomo de la biblioteca'}]}, fn: 's.labelsClearOfConnectors', label: 'captions stay clear of connector ends with other label lengths'},
    {at: 0.6, fn: 's.tracerOffText', label: 'the tracer rides connectors and element outlines, never across an element’s printed text'},
    {at: 0.6, params: {traversalOrder: ['library', 'document', 'passage', 'card', 'search']}, fn: 's.tracerOffText', label: 'the tracer stays off the elements for a reversed order too'},
  ],
});
