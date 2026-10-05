// LAW-0078 — Trazabilidad de una cita · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the visiting order does not change
// with seeking, and a plain relation is never drawn as causation by default.
// Windows (u): separate 0.02–0.16, relate 0.19–0.42 (one link after another), trace 0.44–0.74,
// states 0.77–0.86.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0078', {
  continuity: ['tracer', 'noteC', 'intC', 'srcC'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.separated === 0 && s.relationsDrawn.every(p => p === 0)', label: 'starts as a pile: nothing separated, related or traced'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(p => p === 0)', label: 'the works are separated before any relation is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.43, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible && s.cardRows.every(v => v === 0)', label: 'all supplied relations drawn before the tracer runs'},
    {at: 0.5, fn: 's.anchoredEnds', label: 'every chain starts on a footnote eyelet and ends on the cited eyelet; every line ends on its element edge'},
    {at: 0.5, fn: "!s.relationKinds.includes('causal') && !s.arrowsOnRelations", label: 'no causal link unless supplied; plain relations carry no arrow'},
    {at: 0.5, fn: "JSON.stringify(s.chainLinks) === JSON.stringify(['note>intermediate','intermediate>source'])", label: 'citation links are chains between the works in citing order'},
    {at: 0.52, fn: 's.tracerVisible && s.tracerOnLink', label: 'the ring rides on the drawn chain'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['note','intermediate'])", label: 'mid-trace: note then intermediate visited'},
    {at: 0.9, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['note','intermediate','source'])", label: 'visiting order is the supplied one'},
    {at: 0.35, fn: "s.visitOrder.length === 0", label: 'seeking back before the trace restores an empty visit list'},
    {at: 1, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['note','intermediate','source']) && s.cardRows.every(v => v === 1) && s.statesShown === 1 && !s.tracerVisible && s.anchoredEnds", label: 'gather: order unchanged after seeking, card records each stop, states shown, still anchored'},
    {at: 0.58, fn: 's.focusScale > 1.08', label: 'the focus element enlarges while it is visited'},
    {at: 0.58, fn: 's.anchoredEnds', label: 'while the focus element is enlarged every line still ends on its (current) edge'},
    {at: 0.9, params: {traversalOrder: ['source', 'intermediate', 'note']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['source','intermediate','note'])", label: 'the tracer follows a supplied (reversed) order'},
    {at: 0.5, params: {relationships: [{from: 'note', to: 'intermediate', kind: 'causal'}, {from: 'intermediate', to: 'source', kind: 'sequence'}]}, fn: "s.relationKinds[0] === 'causal' && JSON.stringify(s.chainLinks) === JSON.stringify(['intermediate>source']) && s.anchoredEnds", label: 'a causal link appears only when supplied (drawn as a causal connector, not a chain)'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['note','intermediate','source']) || JSON.stringify(s.visitOrder) === JSON.stringify(['note','intermediate'])", label: 'labels hidden: the same trace happens'},
  ],
});
