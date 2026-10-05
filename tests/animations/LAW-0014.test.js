// LAW-0014 — Redacción comparada · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the order does not
// change when seeking, and a plain relation is not drawn as causation.
import {contractSuite} from '../harness/contract.js';

const ORDER = "['original','alignment','change','alignment','revised']";

contractSuite('LAW-0014', {
  continuity: ['tracer', 'originalSheet', 'revisedSheet'],
  semantic: [
    {at: 0, fn: '!s.separated && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && !s.rowsLit', label: 'starts with the two versions stacked, nothing related yet'},
    {at: 0.175, fn: 's.separated && s.relationsDrawn.every(p => p === 0)', label: 'versions separated before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && !s.rowsLit && s.pairsLinked === 0', label: 'tracer runs only after all relations exist; nothing changed yet'},
    {at: 0.5, fn: 's.anchors.length === 6 && s.anchors.every(a => a.onFrom && a.onTo)', label: 'every connector starts and ends on the edge of its own element'},
    {at: 0.5, fn: "!s.arrowKinds.includes('causal') && s.arrowKinds.filter(k => k === 'relation').length === 5", label: 'plain relations stay relations; nothing is causal by default'},
    {at: 0.6, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${ORDER})`, label: 'tracer follows the supplied traversal order'},
    {at: 0.2, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${ORDER})`, label: 'the order is the same whatever time is sought'},
    {at: 0.78, fn: 's.rowsLit && JSON.stringify(s.changedRows) === "[0,2]" && s.pairsLinked === 1 && !s.tracerVisible', label: 'rows 1 and 3 differ, row 2 keeps its wording; all pairs linked'},
    {at: 1, fn: 's.rowsLit && s.pairsLinked === 1 && s.pairs === 3 && s.separated', label: 'gather: origin, links and row states stay visible'},
    {at: 0.6, params: {traversalOrder: ['folder', 'revised', 'alignment', 'change']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','revised','alignment','change'])", label: 'custom traversal order is honoured'},
    {at: 0.5, params: {relationships: [{from: 'pen', to: 'revised', kind: 'causal'}, {from: 'original', to: 'alignment', kind: 'relation'}]}, fn: "s.arrowKinds.includes('causal') && s.anchors.every(a => a.onFrom && a.onTo)", label: 'causal styling appears only when the author supplies it'},
    {at: 1, params: {redactions: [0]}, fn: 'JSON.stringify(s.changedRows) === "[2]" && s.pairs === 1', label: 'changes inside a redacted clause are not compared'},
  ],
});
