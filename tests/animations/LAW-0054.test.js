// LAW-0054 — Tratamiento de un caso · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the order does not
// change when seeking, and a relation is not drawn as causality by default.
import {contractSuite, presetsFor} from '../harness/contract.js';

const preset = name => presetsFor('LAW-0054').find(x => x.name === name).params;
const LONG = preset('long-labels-stress');
const ES = preset('baseline-es');
// every connector keeps a visible run at both ends and most of its length
// (captions sit on long lines only, otherwise beside them), each relation
// caption stays on or right beside its own line, and no caption covers a
// component, another caption or the legend
const LANDS = 's.connectorRuns.every(x => x[0] >= 25 && x[1] >= 25 && x[2] >= 0.45) && s.chipGaps.every(g => g === null || g <= 70) && s.chipsClear';
// the relation arriving from the labels lands on one of the decision's ports
const PORT = 's.portLanding <= 15';

const ORDER = "JSON.stringify(s.visitOrder) === JSON.stringify(['query','library','resolutions','labels','decision','card'])";

contractSuite('LAW-0054', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: 's.labelsFilled === 0 && s.rowsWritten === 0 && !s.tracerVisible && s.relationsDrawn.every(p => p === 0)', label: 'starts separated components: blank labels, empty card, nothing drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && s.labelsFilled === 0', label: 'all relations drawn before the tracer runs; labels still blank'},
    {at: 1, fn: 's.labelsFilled === 3 && s.rowsWritten === 3 && s.bindersLit && !s.tracerVisible', label: 'ends with every supplied label placed and every card row written'},
    {at: 1, fn: 's.connectorEnds.every(e => e.from <= 16 && e.to <= 16)', label: 'every connector ends on the edge of its own element'},
    {at: 1, fn: LANDS, label: 'connectors land visibly: captions never hide a line end and sit on or beside their own line'},
    {at: 1, params: LONG, fn: LANDS, label: 'long labels: connectors still land visibly with their captions beside them'},
    {at: 1, params: ES, fn: LANDS, label: 'Spanish labels: connectors still land visibly with their captions beside them'},
    {at: 0.7, fn: PORT, label: 'the lit ports sit on the decision edge that faces the labels, and the relation lands on a port'},
    {at: 0.7, params: LONG, fn: PORT, label: 'long labels: the labels relation lands on a decision port'},
    {at: 0.6, fn: 's.capsClearAtPulse', label: 'the enlarging focus element never grows into its own caption (captions move out with the edge)'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.kinds.every((k, i) => k !== 'relation' || !s.arrowheads[i])", label: 'no causal link by default; plain relations carry no arrowhead'},
    {at: 0.5, fn: ORDER, label: 'tracer order = supplied traversal order (mid-trace)'},
    {at: 0.9, fn: ORDER, label: 'tracer order unchanged after seeking later'},
    {at: 0.6, params: {traversalOrder: ['decision', 'labels', 'resolutions', 'library', 'query']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['decision','labels','resolutions','library','query'])", label: 'tracer follows a different supplied order'},
    {at: 1, params: {sources: [{citation: 'R-30', date: 'Year 5', label: 'Mentions'}, {citation: 'R-41', date: 'Year 6', label: ''}]}, fn: 's.labelsFilled === 1 && s.rowsWritten === 2', label: 'a resolution without a supplied label keeps a blank tag'},
  ],
});
