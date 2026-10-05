// LAW-0682 — Cadena causal · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends at its element, the order does not change
// when seeking, and a relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0682', {
  continuity: ['tracer', 'tok0', 'tokLast'],
  semantic: [
    {at: 0, fn: 's.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.lossCracked === 0', label: 'separate: no link drawn, no tracer, loss intact'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'links are drawn one by one in the supplied order'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all supplied links drawn before the tracer runs'},
    {at: 1, fn: 's.linkEnds.every(Boolean)', label: 'every connector starts and ends on its own element'},
    {at: 1, fn: "JSON.stringify(s.linkStyles) === JSON.stringify(['sequence', 'causal', 'disputed', 'sequence'])", label: 'styles follow the supplied data: causal only where supplied, disputed dotted'},
    {at: 1, fn: 's.arrowheads[0] && s.arrowheads[1] && !s.arrowheads[2]', label: 'a disputed link carries no arrowhead'},
    {at: 1, params: {causalLinks: []}, fn: "s.linkStyles.every(k => k === 'sequence')", label: 'no causal style unless a link is supplied as causal'},
    {at: 1, params: {relationships: [{from: 'alt1', to: 'e4', kind: 'relation'}]}, fn: "JSON.stringify(s.extraKinds) === '[\"relation\"]'", label: 'a supplied plain relation is drawn as a relation (no arrow)'},
    {at: 0.52, fn: 's.lossCracked === 0 && !s.visited.includes("loss")', label: 'the loss node changes only when the tracer reaches it'},
    {at: 1, fn: "s.lossCracked === 1 && !s.tracerVisible && JSON.stringify(s.visitOrder) === JSON.stringify(['e1','e2','e3','e4','loss'])", label: 'gather: loss cracked (as described), tracer gone, visit order as supplied'},
    {at: 0.6, params: {traversalOrder: ['loss', 'e4', 'e3']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['loss','e4','e3'])", label: 'the tracer follows the supplied traversal order'},
    {at: 0.62, params: {focusElement: 'e2'}, fn: "s.focus === 'e2'", label: 'focus element is configurable'},
    {at: 1, fn: "s.altRelationColors.length === 1 && s.altRelationColors.every(c => c !== s.causalColor) && s.altModes[0] === 'gap'", label: 'the alternative stands in the gap of its link, tied by a plain relation that is not drawn in the causal colour'},
  ],
});
