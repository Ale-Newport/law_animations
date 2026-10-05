// LAW-0126 — Definición legislativa · mechanism. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';
import {motifChecks} from './definicion-legislativa-checks.js';

contractSuite('LAW-0126', {
  continuity: ['tracer', 'article'],
  semantic: [
    {at: 0.05, fn: "!s.separated && s.drawn.every(d => !d) && s.visited.length === 0", label: 'separate: parts still rising out of their bands, no relation drawn yet'},
    {at: 0.3, fn: "s.separated && s.drawn.some(d => d) && s.drawn.some(d => !d) && s.visited.length === 0", label: 'relations are drawn one after another before the marker moves'},
    {at: 0.45, fn: "s.drawn.every(d => d)", label: 'all supplied relations drawn before the trace'},
    {at: 1, fn: "s.connectors.every(c => c.startIn && c.endIn)", label: 'every connector starts at its source part and ends at its target part'},
    {at: 1, fn: "s.connectors.every(c => c.kind !== 'relation' || !c.arrow) && s.connectors.every(c => c.kind === 'relation')", label: 'default relationships are plain relations drawn without arrowheads (no causality by default)'},
    {at: 0.6, fn: "JSON.stringify(s.visited) === JSON.stringify(s.order.slice(0, s.visited.length)) && s.visited.length > 1 && s.visited.length < s.order.length", label: 'mid-trace the visited parts are a prefix of the supplied order'},
    {at: 0.62, fn: "JSON.stringify(s.order) === JSON.stringify(['term','article','hierarchy','definitions','definition'])", label: 'order is the supplied traversal order after seeking'},
    {at: 1, fn: "s.visited.length === 5 && s.focus === 'definition' && s.focusScale > 1 && s.focusLens === 1 && s.entryLit && s.bandsMarked.length === 2", label: 'ends with the definition enlarged under the lens, both bands and the entry marked'},
    {at: 0.74, fn: "s.focusLens === 1 && s.beat === 'trace' && s.lensDest.w > s.lensSource.w * 1.04", label: 'the focus lens is open with a real enlarged copy within the trace beat'},
    {at: 0.5, fn: "s.focusLens === 0", label: 'the lens stays closed until the marker reaches the focus part'},
    {at: 1, fn: "s.connectors.every(c => !c.label || c.label.w > 0)", label: 'every relation has its caption'},
    {at: 0.46, fn: "s.tracerVisible", label: 'the marker is visible on the first relation'},
    {at: 0.5, fn: "s.bandsMarked.length === 0 && !s.entryLit", label: 'bands and entry are not marked before the marker reaches them'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.visited.length === 5 && s.focusLens === 1 && s.entryLit", label: 'the mechanism completes identically with labels hidden'},
    {at: 1, params: {relationships: [{from: 'term', to: 'definition', kind: 'causal'}, {from: 'article', to: 'hierarchy', kind: 'relation'}]}, fn: "s.connectors.find(c => c.kind === 'causal').arrow && !s.connectors.find(c => c.kind === 'relation').arrow && s.connectors.every(c => c.startIn && c.endIn)", label: 'an arrow appears only for a supplied causal relation'},
    {at: 1, params: {hierarchy: ['A', 'B', 'C', 'D'], passages: [{ref: 'A', heading: 'H', text: 'uses x', term: 'x', level: 4}, {ref: 'B', heading: 'D', text: 'means y', term: 'x', level: 1}]}, fn: "s.articleLevel === 4 && s.definitionLevel === 1 && s.connectors.every(c => c.startIn && c.endIn)", label: 'pages follow their supplied levels and connectors still land'},
  ],
});

// Review B007 rounds 1–2 — defect classes fixed, checked for every preset × ratio, labels shown and hidden:
//  * the lifted Term / Supplied-definition cards printed over their pages' header text while rising:
//    each card is clipped to the outside of its (moving) page, so it slides out from under the page edge;
//  * the focus lens parked over a relation arc and its ring covered labels: the inset is placed clear of
//    every relation line, caption, part and plate, its leader crosses no other part, and its source is
//    marked by a box around the detail;
//  * round 2: the zoom changed the definition's meaning (words replaced by bars): the inset is a
//    rectangle that holds the entry's quoted term and its WHOLE supplied wording, in order;
//  * round 2: supplied text (references, level names, headings, wording) was drawn as bars or under
//    16 px: every supplied field is present as visible text at >= 16 px (pages are sized to their text).
const FIELDS = `[P.passages[0].ref, P.passages[0].heading, P.passages[0].text, P.passages[1].ref, P.passages[1].heading, P.passages[1].text, P.passages[1].term, ...P.hierarchy, ...P.elements.map(e => e.label), ...P.relationships.map(r => r.label)]`;
motifChecks('LAW-0126', 'lift clipping, inset placement, whole definition in the inset, supplied text >= 16 px', [
  {at: 0.12, presets: ['baseline-illustrative'], ratios: ['16:9'], tvs: ['all'], fn: "s.lift.some(c => c.overPage)", label: 'mid-lift a card still lies over its page (the clipping is exercised)'},
  ...[0.09, 0.11, 0.13, 0.15, 0.17].map(at => ({at, fn: "s.lift.every(c => !c.overPage || c.clippedToOutside)", label: 'a rising card shows only outside its page'})),
  {at: 0.2, fn: "s.lift.every(c => !c.overPage)", label: 'once lifted, the cards are clear of their pages'},
  {at: 1, fn: "s.lensClear && s.srcMarkerClear && s.lensDest.w > s.lensSource.w * 1.04", label: 'inset clear of lines, captions, parts and plates, and enlarged; marker clear of other text'},
  {at: 1, tvs: ['all'], fn: "s.labelsClear", label: 'every relation caption found a free place (none on a part, a caption, a line or the inset)'},
  {at: 1, fn: "s.cardBarsInside", label: 'the definition card placeholder bars stay inside the card'},
  {at: 1, dom: {kind: 'lensWords', content: 'focus-lens-content', source: 's.lensSource'}, label: 'the inset copy shows whole words only'},
  {at: 1, dom: {kind: 'clearOf', win: 'focus-lens-win'}, label: 'no label or text lies under the open inset'},
  {at: 1, tvs: ['all'], presets: ['baseline-illustrative', 'long-labels-stress', 'baseline-es'], dom: {kind: 'lensOrder', content: 'focus-lens-content', text: '`${P.passages[1].term} ${P.passages[1].text}`'}, label: 'the inset shows the supplied definition — term and whole wording — in its original order'},
  {at: 1, tvs: ['all'], presets: ['contrast-or-alternative'], dom: {kind: 'lensOrder', content: 'focus-lens-content', text: 'P.hierarchy[P.passages[1].level - 1]'}, label: 'the inset shows the focused level\'s whole name'},
  {at: 1, tvs: ['all'], dom: {kind: 'fieldsText', min: 16, fields: FIELDS}, label: 'every supplied field is visible TEXT at >= 16 px'},
  {at: 1, params: {focusElement: 'term'}, presets: ['baseline-illustrative', 'long-labels-stress'], dom: {kind: 'lensWords', content: 'focus-lens-content', source: 's.lensSource'}, label: 'term focus: whole words in the inset'},
  {at: 1, params: {focusElement: 'article'}, presets: ['baseline-illustrative', 'long-labels-stress'], dom: {kind: 'lensWords', content: 'focus-lens-content', source: 's.lensSource'}, label: 'article focus: whole words in the inset'},
  {at: 1, params: {focusElement: 'hierarchy'}, presets: ['baseline-illustrative', 'baseline-es'], fn: "s.srcMarkerClear", dom: {kind: 'lensWords', content: 'focus-lens-content', source: 's.lensSource'}, label: 'hierarchy focus: whole plate in the inset, marker clear'},
]);
