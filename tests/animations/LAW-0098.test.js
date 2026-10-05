// LAW-0098 — Condiciones acumulativas · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the order does not change
// when seeking, and a relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

// Windows (fractions of the duration): explode 0.04–0.16, links 0.19–0.41 (one after
// another, in the supplied order), trace 0.45–0.73, gather 0.76–0.86, test turn 0.86–0.95.
contractSuite('LAW-0098', {
  continuity: ['tracer', 'pc0', 'pc1', 'pc2'],
  semantic: [
    {at: 0, fn: "s.explode === 0 && s.pieces.every(p => p === 'assembled') && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.theta === 0", label: 'separate: assembled board, nothing drawn, no tracer'},
    {at: 0.17, fn: "s.explode === 1 && s.pieces.every(p => p === 'exploded') && s.relationsDrawn.every(p => p === 0)", label: 'pieces are pulled out before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later relationship never starts before the previous one is complete (supplied order)'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all supplied relationships drawn before the tracer runs'},
    {at: 1, fn: 's.linkEnds.every(Boolean) && s.linkEnds.length === 7', label: 'every connector starts and ends on its own element (anchored)'},
    {at: 0.5, fn: 's.linkEnds.every(Boolean)', params: {textVisibility: 'none'}, label: 'anchoring does not depend on labels'},
    {at: 1, fn: "JSON.stringify(s.linkKinds) === JSON.stringify(['relation','relation','relation','sequence','sequence','sequence','sequence']) && s.arrowheads.slice(0, 3).every(a => !a) && s.arrowheads.slice(3).every(Boolean)", label: 'fact ↔ pocket is a plain relation (no arrowhead); the gear line is a sequence'},
    {at: 1, fn: "!s.linkKinds.includes('causal')", label: 'no causal style unless a relationship is supplied as causal'},
    {at: 1, params: {relationships: [{from: 'fact1', to: 'cond1', kind: 'causal'}, {from: 'cond1', to: 'cond2', kind: 'sequence'}]}, fn: "JSON.stringify(s.linkKinds) === JSON.stringify(['causal','sequence']) && s.arrowheads[0]", label: 'a supplied causal relationship is drawn as causal'},
    {at: 1, params: {relationships: [{from: 'fact1', to: 'cond1', kind: 'relation'}, {from: 'cond4', to: 'dial', kind: 'sequence'}]}, fn: 's.skippedRelationships === 1 && s.linkKinds.length === 1', label: 'relationships to components that do not exist are ignored, not invented'},
    {at: 0.6, fn: "s.tracerVisible && s.visited.length > 0 && s.visited.every((id, i) => id === s.visitOrder[i])", label: 'the tracer visits components in the supplied order'},
    {at: 1, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['connector','cond1','cond2','cond3','dial']) && !s.tracerVisible", label: 'visit order = traversalOrder; tracer gone in the gather'},
    {at: 0.62, params: {traversalOrder: ['dial', 'cond3', 'cond2']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['dial','cond3','cond2']) && s.visited[0] === 'dial'", label: 'the tracer follows a different supplied traversal order'},
    {at: 0.3, fn: 's.focusScale === 1', label: 'the focus element is not enlarged before the tracer runs'},
    {at: 0.59, fn: "s.focus === 'cond2' && s.focusScale > 1.1", label: 'the focus element enlarges while the tracer passes it'},
    {at: 0.62, params: {focusElement: 'fact1', traversalOrder: ['fact1', 'cond1', 'cond2']}, fn: "s.focus === 'fact1'", label: 'focus element is configurable'},
    {at: 0.9, fn: "s.pieces.every(p => p === 'seated') && s.theta > 0 && s.theta < 180", label: 'gather: pieces back in their pockets before the test turn completes'},
    {at: 1, fn: 's.seated === 3 && s.theta === 180 && s.dial === 1 && s.dialLamp && s.turned.every(Boolean) && s.complete', label: 'final: every piece seated, the whole line turned, dial reached (as supplied)'},
    {at: 1, params: {facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'pending'}, {label: 'c', status: 'supplied'}]}, fn: "s.pieces[1] === 'absent' && s.breakAt === 1 && s.turned[1] && !s.turned[2] && !s.turned[3] && s.dial === 0 && !s.dialLamp", label: 'pending piece: pocket stays empty, motion stops at the gap, dial does not move'},
    {at: 1, params: {facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'disputed'}, {label: 'c', status: 'supplied'}]}, fn: "s.pieces[1] === 'unseated' && s.dial === 0 && !s.turned[2]", label: 'disputed piece: comes back but is not seated (not resolved here)'},
    {at: 1, params: {rules: {name: 'Rule five (fictional)', conditions: ['A', 'B', 'C', 'D', 'E']}, facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'supplied'}, {label: 'c', status: 'supplied'}, {label: 'd', status: 'supplied'}, {label: 'e', status: 'supplied'}]}, fn: 's.n === 5 && s.seated === 5 && s.dial === 1', label: 'five conditions assemble and turn'},
    {at: 1, fn: "s.labels.legend && s.labels.tag && s.labels.note && s.labels.captions === 3 && s.capModes.every(m => !m.endsWith('leastBad'))", label: 'final hold keeps the legend of connection kinds, the state and every component caption, each placed cleanly (leader clear of text)'},
    {at: 1, params: {locale: 'es'}, fn: 's.labels.legend && s.labels.tag', label: 'Spanish labels: legend and state still placed'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.relationsDrawn.every(p => p === 1) && s.pieces.some(p => p === 'returning' || p === 'seated')", label: 'labels hidden: the same decomposition and reassembly happen'},
  ],
});
