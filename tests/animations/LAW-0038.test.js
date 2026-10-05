// LAW-0038 — Custodia del original · mechanism. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0038', {
  continuity: ['tracer', 'original', 'copy'],
  semantic: [
    {at: 0, fn: 's.split === 0 && s.notesProgress === 0 && !s.tracerVisible', label: 'starts as one stack: original and copy together, nothing annotated'},
    {at: 0.2, fn: 's.split === 1 && s.relationsDrawn.every(p => p < 1)', label: 'components are separated before relations are drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && s.notesProgress === 0', label: 'all relations drawn before the tracer runs; the copy is unchanged until reached'},
    {at: 1, fn: 's.connectorLanding.every(d => d <= 16)', label: 'every connector ends on its element outline (all ratios share the rule)'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.kinds.every((k, i) => (k === 'relation') === !s.arrowheads[i])", label: 'plain relations carry no arrowhead; no causal link by default'},
    {at: 1, fn: 's.notesProgress === 1 && s.originalWrittenOn === false && !s.tracerVisible', label: 'ends with the copy annotated, the original untouched, tracer gone'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['seal','box','original','copy','folder'])", label: 'tracer follows the supplied traversal order'},
    {at: 0.3, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['seal','box','original','copy','folder'])", label: 'the order does not change when seeking back'},
    {at: 0.6, params: {traversalOrder: ['folder', 'copy', 'original']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','copy','original'])", label: 'a supplied traversal order is followed'},
    {at: 1, params: {relationships: [{from: 'seal', to: 'box', kind: 'causal', label: 'keeps shut'}]}, fn: "s.kinds[0] === 'causal' && s.arrowheads[0] === true", label: 'causal styling only when the author supplies a causal link'},
  ],
});
