// LAW-0070 — Comprobación de jurisdicción · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the visiting order does not change
// with seeking, and a plain relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

// long element labels and captions (round-4 review: a caption sat on its own connector)
const LONG = {"elements": [{"id": "library", "label": "Project library of supply and logistics files"}, {"id": "document", "label": "Source document under examination"}, {"id": "card", "label": "Research card with the marked jurisdiction"}, {"id": "filter", "label": "Jurisdiction filter (key against declaration)"}, {"id": "relevant", "label": "Declares the jurisdiction marked on the card"}, {"id": "other", "label": "Declares a different jurisdiction than the card"}], "relationships": [{"from": "library", "to": "document", "kind": "relation", "label": "holds this document"}, {"from": "card", "to": "filter", "kind": "communication", "label": "sets the key of the filter"}, {"from": "document", "to": "filter", "kind": "sequence", "label": "passes through the reader"}, {"from": "filter", "to": "relevant", "kind": "sequence", "label": "declaration same as the key"}, {"from": "filter", "to": "other", "kind": "sequence", "label": "declaration differs from the key"}], "relationLabels": {"relation": "plain relation (no direction)", "communication": "communication between parts", "sequence": "sequence of steps", "causal": "causal link (only as supplied)"}};

contractSuite('LAW-0070', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.separated === 0 && s.readSlot === 0', label: 'starts assembled: nothing related, nothing traced'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'parts are separated before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1)', label: 'all relations drawn before the marker runs'},
    {at: 0.5, fn: 's.anchoredEnds', label: 'every connector starts and ends on the edge of its own element'},
    {at: 0.5, fn: 's.outletsLand', label: 'outlet connectors leave from their drawn port and their arrowheads land on the tray'},
    {at: 0.44, fn: 's.sourceLeft === 0', label: 'the source document is fully drawn before the marker leaves it'},
    {at: 1, fn: 's.sourceLeft === 1', label: 'once the traced document has moved on, its source position is shown empty (not in two places)'},
    {at: 0.5, fn: "!s.relationKinds.includes('causal') && s.relationKinds.includes('relation')", label: 'no causal link unless supplied; a plain relation has no arrow'},
    {at: 0.59, fn: 's.inFilter && s.focusScale > 1.09 && s.readSlot === 1', label: 'the focus element (filter) enlarges while the marker is inside and the declaration is read'},
    {at: 0.585, fn: 's.readBeforeBlade && s.blade === 0', label: 'the blade does not move before the declaration is read'},
    {at: 0.66, fn: "s.blade === 1 && s.comparison === 'same' && s.bladeTo === 'relevant'", label: 'same declared jurisdiction as the key: blade to the relevant outlet'},
    {at: 0.95, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['library','document','filter','relevant'])", label: 'tracer visits in the supplied traversal order'},
    {at: 0.3, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['library','document','filter','relevant'])", label: 'visiting order is the same after seeking back'},
    {at: 1, fn: "!s.tracerVisible && s.arrivedIn === 'relevant'", label: 'ends with the traced document in its tray, marker gone'},
    {at: 1, params: {sampleSource: 1, traversalOrder: ['card', 'filter', 'document', 'filter', 'other']}, fn: "s.comparison === 'different' && s.bladeTo === 'other' && s.arrivedIn === 'other' && JSON.stringify(s.visitOrder) === JSON.stringify(['card','filter','document','filter','other'])", label: 'a document declaring another jurisdiction: ≠ and the other outlet, following a supplied order'},
    {at: 0.5, fn: 's.relLabelsBeside', label: 'every relation caption sits beside its connector (none on the line)'},
    {at: 0.5, params: LONG, fn: 's.relLabelsBeside', label: 'long labels: every relation caption still sits beside its connector'},
    ...[0.46, 0.475, 0.49, 0.505, 0.52].map(at => ({at, fn: 's.tracerClearOfDeclaration', label: 'the marker never covers the declared jurisdiction of the traced document'})),
    {at: 0.66, params: {sampleSource: 1, traversalOrder: ['card', 'filter', 'document', 'filter', 'other']}, fn: 's.tracerClearOfDeclaration', label: 'another traversal order: the marker still passes above the declaration'},
    {at: 0.49, fn: 's.tracerVisible && s.tracerUnderDocument === 1', label: 'on the traced document the marker slips under the sheet (it never covers the document\'s text)'},
    {at: 0.55, fn: 's.tracerVisible && s.tracerUnderDocument === 0', label: 'on its connectors the marker is drawn on top again'},
  ],
});
