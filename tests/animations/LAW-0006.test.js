// LAW-0006 — Sellado de copia · mechanism. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0006', {
  continuity: ['tracer', 'copyOrigin', 'stampFace', 'ghost'],
  semantic: [
    {at: 0, fn: 's.explode === 0 && !s.markApplied && !s.dieInked && !s.tracerVisible && s.relationsDrawn.every(p => p === 0)', label: 'starts as a compact, unmarked set with no relations drawn'},
    {at: 0.18, fn: 's.explode === 1 && s.relationsDrawn.every(p => p === 0)', label: 'the elements are separated before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.markApplied', label: 'all relations drawn before the tracer changes anything'},
    {at: 0.5, fn: 's.maxAnchorGap <= 12', label: 'every connector starts and ends on its element (anchor gap <= 12 design units)'},
    {at: 0.5, fn: "s.connectors.every(c => c.kind !== 'causal') && s.connectors.filter(c => c.kind === 'relation').every(c => !c.arrow)", label: 'plain relations carry no arrowhead; no causal link by default'},
    {at: 0.58, fn: 's.ghostMoving && s.dieInked && !s.markApplied', label: 'the inked die footprint travels down the press axis before the mark exists'},
    {at: 0.66, fn: 's.markApplied && s.dieInked', label: 'the mark appears once the footprint reaches the copy'},
    {at: 1, fn: 's.markApplied && s.dieInked && !s.tracerVisible && !s.ghostMoving', label: 'ends with source, transformation and state visible; tracer gone'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['ink','stamp','mark','copy','folder'])", label: 'tracer follows the default traversal order'},
    {at: 0.6, params: {traversalOrder: ['pen', 'original', 'copy', 'ink', 'stamp', 'mark']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['pen','original','copy','ink','stamp','mark'])", label: 'tracer follows a supplied traversal order'},
    {at: 1, params: {relationships: [{from: 'ink', to: 'stamp', kind: 'causal', label: 'supplied cause'}]}, fn: "s.connectors.length === 1 && s.connectors[0].kind === 'causal' && s.connectors[0].arrow", label: 'causal styling only when the author supplies it'},
  ],
});
