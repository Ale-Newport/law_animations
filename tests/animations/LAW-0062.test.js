// LAW-0062 — Fuente primaria y comentario · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change
// when seeking, and a plain relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0062', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: 's.separated === 0 && s.tabGap >= 0 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible', label: 'starts assembled: card beside the page (tab touching, never overlapping), nothing drawn'},
    {at: 0.18, fn: 's.separated === 1 && s.noteGap > 200', label: 'the card slides out to the commentary side of the gutter'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1)', label: 'all relationships exist before the marker moves'},
    {at: 0.56, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['search','sourceShelf','source','passage','pinpoint','note'].slice(0, s.visitOrder.length)) && s.visitOrder.length >= 2 && s.visitOrder.length < 6", label: 'part-way, the marker has visited a prefix of the supplied traversal order'},
    {at: 0.9, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['search','sourceShelf','source','passage','pinpoint','note'])", label: 'the full traversal order is kept when seeking to the end'},
    {at: 0.66, fn: "s.focusScale > 1.4 && s.visitOrder[s.visitOrder.length - 1] === 'pinpoint'", label: 'the focus element (pinpoint) enlarges clearly while the marker is on it'},
    {at: 1, fn: 's.focusScale === 1 && !s.tracerVisible && s.statesShown === 1', label: 'gather: states shown, focus released'},
    {at: 1, fn: 's.connectorGaps.length === 5 && s.connectorGaps.every(g => g <= 12)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 1, fn: "JSON.stringify(s.crossesGutter) === JSON.stringify(['pinpoint>passage'])", label: 'only the pinpoint link crosses the gutter'},
    {at: 1, fn: 's.labelsClean', label: 'relation labels are placed clear of elements, connectors and the marker path'},
    {at: 1, fn: 's.uncleanLabels.length === 0', label: 'every element label, relation label, state chip and the legend has a collision-free place'},
    {at: 1, fn: "s.stateInfo.length === 3 && s.stateInfo.every(q => q.size >= s.labelSize - 0.5) && s.stateInfo.filter(q => q.name !== 'st-link').every(q => q.lines === 1 && q.gap <= 24)", label: 'gather states sit against the object they describe (page, card), one line, at the element-label size'},
    {at: 1, params: {locale: 'es'}, fn: "s.stateInfo.length === 3 && s.stateInfo.every(q => q.size >= s.labelSize - 0.5) && s.stateInfo.filter(q => q.name !== 'st-link').every(q => q.lines === 1 && q.gap <= 24)", label: 'the Spanish state chips keep their place and size'},
    {at: 0.9, params: {traversalOrder: ['search', 'commentaryShelf', 'note', 'pinpoint', 'passage', 'source']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['search','commentaryShelf','note','pinpoint','passage','source'])", label: 'a different traversal order is followed exactly'},
    {at: 1, params: {relationships: [{from: 'pinpoint', to: 'passage', kind: 'causal'}]}, fn: "s.arrows.length === 1 && s.arrows[0].kind === 'causal' && s.arrows[0].arrow", label: 'a causal link appears only when supplied'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.tracerVisible && s.relationsDrawn.every(p => p === 1)', label: 'the mechanism runs identically with labels hidden'},
  ],
});
