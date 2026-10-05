// LAW-0050 — Historial de una norma · mechanism. Contract battery + ID-specific checks.
// Acceptance (brief): every connector ends on its element, the order does not change
// when seeking, and a plain relation is never drawn as causation.
import {contractSuite} from '../harness/contract.js';

const ORDER = "['search','library','document','layers','date','card']";

contractSuite('LAW-0050', {
  continuity: ['tracer', 'plateTop'],
  semantic: [
    {at: 0, fn: "s.plateGap < 30 && !s.tracerVisible && s.selected === null", label: 'starts compact: plates stacked, no tracer, nothing selected'},
    {at: 0.2, fn: "s.plateGap > 100", label: 'plates separate along the time axis in the first beat'},
    {at: 0.3, fn: "s.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)", label: 'relations are drawn one by one'},
    {at: 0.45, fn: "s.relationsDrawn.every(p => p === 1) && s.tracerVisible", label: 'all relations drawn before the tracer runs'},
    {at: 0.5, fn: "s.selectProgress === 0", label: 'the layer is only marked when the tracer runs from the layers to the date'},
    {at: 1, fn: "s.selected === 1 && JSON.stringify(s.laterLayers) === '[2]' && !s.tracerVisible", label: 'ends with the supplied layer outlined and the later layer ghosted'},
    {at: 0.5, fn: "s.connectorsLand.every(Boolean)", label: 'every connector ends on its own element (mid trace)'},
    {at: 1, fn: "s.connectorsLand.every(Boolean)", label: 'every connector ends on its own element (final)'},
    {at: 1, params: {selectedVersion: 0}, fn: "s.connectorsLand.every(Boolean) && s.selected === 0", label: 'connectors still land when another layer is marked'},
    {at: 1, fn: "s.connectors.every(c => c.kind !== 'relation' || !c.arrow) && !s.connectors.some(c => c.kind === 'causal')", label: 'plain relations have no arrowhead; nothing is causal by default'},
    {at: 0.3, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${ORDER})`, label: 'traversal order (early seek)'},
    {at: 0.9, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${ORDER})`, label: 'traversal order unchanged after seeking later'},
    {at: 0.6, params: {traversalOrder: ['card', 'date', 'layers']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['card','date','layers'])", label: 'tracer follows the supplied traversal order'},
  ],
});
