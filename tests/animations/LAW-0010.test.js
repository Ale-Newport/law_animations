// LAW-0010 — Apertura de expediente · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends at its element, the traversal order
// does not change when seeking, and a plain relation is never drawn as causal.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0010', {
  continuity: ['tracer', 'topLayer'],
  semantic: [
    {at: 0, fn: 's.coverAngle === 0 && s.layerLift === 0 && s.indexCard === 0 && !s.tracerVisible && s.ticks.every(t => t === 0)', label: 'starts as the closed, compact file'},
    {at: 0.18, fn: 's.coverAngle === 125 && s.layerLift === 1 && s.indexCard === 1 && s.relationsDrawn.every(p => p === 0)', label: 'elements are separated before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all relations drawn before the tracer runs'},
    {at: 0.44, fn: 's.ticks.every(t => t === 0) && !s.stampApplied', label: 'nothing is ticked or stamped before the tracer passes'},
    {at: 0.5, fn: 's.anchorsOk', label: 'every connector ends on its element'},
    {at: 1, fn: 's.labelsOnConnectors.length === 0 && s.labelOverlaps === 0 && s.shortestConnector >= 120', label: 'captions sit beside, never on, the connectors and never on each other; no connector is a stub'},
    {at: 1, params: {elements: [{id: 'cover', label: 'Front cover of the case folder'}, {id: 'folder', label: 'Folder carrying the case file number'}, {id: 'documents', label: 'Documents filed as separate layers'}, {id: 'index', label: 'Index sheet listing every document'}, {id: 'pen', label: 'Pen used for the check marks'}, {id: 'stamp', label: 'Stamp recording the opening'}]}, fn: 's.labelsOnConnectors.length === 0 && s.labelOverlaps === 0', label: 'long captions still clear the connectors and each other'},
    {at: 0.5, fn: "!s.kinds.includes('causal') && s.arrowless >= 1", label: 'default relations are not causal; plain relations carry no arrow'},
    {at: 1, fn: 's.ticks.every(t => t === 1) && s.stampApplied && !s.tracerVisible', label: 'ends with every entry ticked, the registry stamped and the tracer gone'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['cover','folder','documents','index','pen','stamp'])", label: 'tracer follows the default traversal order'},
    {at: 0.3, params: {traversalOrder: ['stamp', 'pen', 'index', 'documents']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['stamp','pen','index','documents'])", label: 'tracer follows a supplied traversal order'},
    {at: 1, params: {absentDocument: 1}, fn: 's.ticks[1] === 0 && s.ticks.filter((t, i) => i !== 1).every(t => t === 1)', label: 'an absent document is never ticked'},
  ],
});
