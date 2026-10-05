// LAW-0030 — Cadena de versiones · mechanism. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0030', {
  continuity: ['tracer', 'tab', 'copy1', 'copy2', 'copy3', 'copy4'],
  semantic: [
    {at: 0, fn: '!s.separated && !s.tracerVisible && s.relationsDrawn.every(p => p === 0)', label: 'starts as the filed chain: nothing separated, no relation drawn'},
    {at: 0.2, fn: 's.separated && s.relationsDrawn.every(p => p < 1)', label: 'elements are separated before relations are drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && !s.tabSlotLit', label: 'all relations drawn before the tracer runs; the tab slot is not yet identified'},
    {at: 1, fn: "s.tabSlotLit && !s.tracerVisible && s.selected === 'v4'", label: 'ends with the tab slot on the selected copy identified and the tracer gone'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','copy1','copy2','copy3','copy4','tab'])", label: 'the tracer follows the supplied traversal order'},
    {at: 0.3, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','copy1','copy2','copy3','copy4','tab'])", label: 'the order does not change when seeking back'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.kinds.every((k, i) => (k === 'relation') === !s.arrows[i])", label: 'no causal link by default; plain relations carry no arrow'},
    {at: 1, fn: "s.connectorEnds.every(e => Number.isFinite(e.from.x) && Number.isFinite(e.to.y))", label: 'every connector is anchored at both ends'},
    {at: 0.6, params: {traversalOrder: ['tab', 'copy4', 'copy3']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['tab','copy4','copy3'])", label: 'a supplied traversal order is followed'},
  ],
});
