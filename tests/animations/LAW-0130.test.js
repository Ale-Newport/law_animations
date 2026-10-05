// LAW-0130 — Conflicto entre textos · mechanism. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: every connector ends on its element, the
// traversal order is kept under seeking, and a plain relation is never drawn as causal.
// Concrete action (brief): the two provisions APPROACH each other and their zone of
// tension is highlighted where they meet.
import {contractSuite, presetsFor} from '../harness/contract.js';

// safe areas that turn the 16:9 test frame into a square / portrait content box
const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}}};
const all = [...presetsFor('LAW-0130'), {name: 'labels-hidden', params: {textVisibility: 'none'}}];
const perPreset = all.flatMap(pr => Object.entries(SHAPES).flatMap(([shape, sa]) => {
  const params = {...pr.params, ...sa};
  const tag = `(${pr.name}, ${shape})`;
  return [
    // the slips are apart when the connectors have been drawn ...
    {at: 0.44, params, fn: 's.approach === 0 && s.slipDist === s.slipDistOut && s.phrasesMet === 0', label: `before the trace the two provision slips are apart and the zone is empty ${tag}`},
    // ... and slide towards each other while the tracer runs, the zone filling as they arrive
    {at: 0.56, params, fn: 's.approach > 0 && s.approach < 1 && s.phrasesMet > 0 && s.phrasesMet < 1 && s.slipDist < s.slipDistOut', label: `the slips approach each other and the zone fills progressively ${tag}`},
    {at: 1, params, fn: 's.approach === 1 && s.slipDist <= s.slipDistOut * 0.9 && s.phrasesMet === 1 && s.connectorsLand', label: `the slips end close together, flanking the zone where their phrases meet; connectors still land ${tag}`},
    // every relation label touches its OWN connector, in both states
    ...[0.44, 1].map(at => ({at, params, fn: 's.labelsAttached', label: `each relation label sits on its own connector ${tag} t=${at}`})),
    // the tracer runs along connectors and outlines, never across a provision's wording or the ring's chips
    ...[0.5, 0.55, 0.6, 0.62, 0.65, 0.7].map(at => ({at, params, fn: 's.tracerOffText && s.tracerOffChips', label: `the tracer stays off the provision wording and the ring's phrase chips ${tag} t=${at}`})),
    // B007 round 3: no label box overlaps another; every leader starts on its own connector, ends on its
    // own label and passes behind no other label
    ...[0.3, 0.44, 0.7, 1].map(at => ({at, params, fn: 's.labelsNoOverlap && s.leadersReach', label: `labels never overlap; leaders reach their own connector and label ${tag} t=${at}`})),
    // every relation label is drawn, in every preset (long labels included): on its connector, or in
    // free space tied to the connector's midpoint by a short leader — never dropped, never overlapping
    ...[0.44, 1].map(at => ({at, params, fn: 's.hiddenLabels === 0 && s.labelsAttached', label: `every relation label placed clear and attached ${tag} t=${at}`})),
  ];
}));

contractSuite('LAW-0130', {
  continuity: ['tracer', 'book', 'article', 'slip1', 'slip2'],
  semantic: [
    {at: 0.17, fn: "s.drawn.every(p => p === 0) && s.visited.length === 0", label: 'separate: no relationship is drawn before the elements are in place'},
    {at: 0.44, fn: "s.drawn.every(p => p === 1) && s.visited.length === 0", label: 'relate: every explicit relationship is drawn before the tracer starts'},
    {at: 1, fn: "s.connectorsLand && s.hiddenLabels === 0", label: 'every connector ends on the edge of its own element; every relation label is placed'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.kinds.every((k, i) => s.arrows[i] === (k !== 'relation'))", label: 'no causal link by default; plain relations carry no arrowhead'},
    {at: 0.6, fn: "s.visited.length > 0 && s.visited.every((id, i) => id === s.order[i])", label: 'the tracer visits the elements in the supplied order (prefix while running)'},
    {at: 1, fn: "JSON.stringify(s.visited) === JSON.stringify(s.order) && s.focusScale > 1 && s.phrasesMet === 1 && s.highlight.every(v => v === 1) && s.stateShown", label: 'gather: full order visited, focus enlarged, phrases met, state shown'},
    {at: 0.5, fn: "s.focusScale === 1 && s.phrasesMet < 1", label: 'the zone enlarges only when the tracer reaches it'},
    {at: 0.62, fn: "s.connectorsLand", label: 'connectors keep landing on the moving slips'},
    {at: 1, params: {relationships: [{from: 'passage1', to: 'zone', kind: 'causal'}, {from: 'passage2', to: 'zone', kind: 'relation'}]}, fn: "s.kinds[0] === 'causal' && s.arrows[0] === true && s.arrows[1] === false && s.connectorsLand", label: 'a causal arrow appears only when the author supplies a causal relationship'},
    {at: 1, params: {focusElement: 'hierarchy', traversalOrder: ['hierarchy', 'source1', 'passage1', 'zone']}, fn: "s.focus === 'hierarchy' && s.focusScale > 1 && JSON.stringify(s.visited) === JSON.stringify(['hierarchy', 'source1', 'passage1', 'zone'])", label: 'focus element and traversal order follow the parameters'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.connectorsLand && s.phrasesMet === 1 && s.focusScale > 1", label: 'the mechanism completes identically with labels hidden'},
    ...perPreset,
  ],
});
