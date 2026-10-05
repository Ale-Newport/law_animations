// LAW-0086 — Analogía de casos · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends at its element, the order does not change
// when seeking, and a relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';
import {ratioChecks, TEXT_CHECKS} from './analogia-ratio-checks.js';

contractSuite('LAW-0086', {
  // the supplied rule quotes end in a literal “…” (author text, not a cut);
  // real fit truncation is caught by the per-ratio TEXT_CHECKS (<title> test)
  allowTruncation: ['Where an item is lent', 'Cuando se presta'],
  continuity: ['tracer', 'lens'],
  semantic: [
    {at: 0, fn: 's.separated === 0 && s.pinsUp.every(q => q === 0) && s.plumbDrawn.every(q => q === 0) && s.relationsDrawn.every(q => q === 0) && !s.tracerVisible', label: 'separate: B lies on A, no pin, no plumb line, no relationship, no tracer'},
    {at: 0.18, fn: 's.separated === 1 && s.pinsUp.every(q => q === 1) && s.plumbDrawn.every(q => q === 0)', label: 'the sheets are exploded and every pin is up before anything is related'},
    {at: 0.26, fn: 's.plumbDrawn.some(q => q === 1) && s.plumbDrawn.some(q => q < 1) && s.relationsDrawn.every(q => q === 0)', label: 'plumb lines drop column by column; relationships wait'},
    {at: 0.26, fn: 's.plumbDrawn.every((q, i) => i === 0 || q === 0 || s.plumbDrawn[i - 1] === 1)', label: 'a later plumb line never starts before the previous one has landed'},
    {at: 0.26, fn: 's.discsShown.every((d, i) => d === 0 || s.plumbDrawn[i] === 1)', label: 'a glyph disc appears only once its plumb line has landed'},
    {at: 0.44, fn: 's.plumbDrawn.every(q => q === 1) && s.relationsDrawn.every(q => q === 1) && !s.tracerVisible', label: 'all supplied relationships drawn before the tracer runs'},
    {at: 1, fn: "JSON.stringify(s.glyphs) === JSON.stringify(['eq','eq','ne','one'])", label: 'each slot reads its supplied comparison: = / ≠ / only in one case'},
    {at: 1, fn: 's.linkEnds.length === 3 && s.linkEnds.every(Boolean)', label: 'every connector starts and ends on its own element'},
    {at: 1, fn: "s.relationKinds.every(k => k === 'relation') && s.arrowheads.every(a => a === false)", label: 'plain relations carry no arrowhead (not drawn as causation)'},
    {at: 1, params: {relationships: [{from: 'rule', to: 'difference', kind: 'sequence'}, {from: 'caseB', to: 'caseA', kind: 'relation'}]}, fn: "JSON.stringify(s.relationKinds) === JSON.stringify(['sequence','relation']) && s.arrowheads[0] === true && s.arrowheads[1] === false && s.linkEnds.every(Boolean)", label: 'a supplied sequence gets an arrow; the plain relation still does not'},
    {at: 1, params: {relationships: [{from: 'rule', to: 'similarity', kind: 'relation'}]}, fn: "s.relationPairs.length === 1 && s.relationPairs[0] === 'rule>similarity'", label: 'only the supplied relationships are drawn'},
    {at: 0.6, fn: "s.tracerVisible && s.visited.length >= 2 && s.visited.every((id, i) => id === s.visitOrder[i])", label: 'the tracer visits the elements in the supplied order'},
    {at: 1, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['caseB','similarity','caseA','difference','rule']) && !s.tracerVisible", label: 'gather: tracer gone, visit order as supplied'},
    {at: 0.6, params: {traversalOrder: ['rule', 'difference', 'caseA']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['rule','difference','caseA'])", label: 'the tracer follows a different supplied traversal order'},
    {at: 0.7, fn: "s.lensOver === 'difference' && s.lensWindow[0] >= 0.43 && s.lensWindow[1] <= 0.87", label: 'trace: the magnifier rests over the focus element (the relevant difference)'},
    {at: 0.7, params: {focusElement: 'similarity'}, fn: "s.lensOver === 'similarity' && s.focus === 'similarity'", label: 'the focus element is configurable'},
    {at: 0.5, fn: 's.states === 0', label: 'no relevance state is shown before the gather beat'},
    {at: 1, fn: "s.lensOver === null && s.lensTravel === 0 && s.states === 1 && s.statesShown >= 2", label: 'gather: magnifier back at rest; relevant similarity and difference tagged as supplied'},
    {at: 1, params: {finalState: 'relevance-pending'}, fn: "s.finalState === 'relevance-pending' && s.states === 1", label: 'a pending state can be supplied instead'},
    {at: 1, params: {facts: [
      {icon: 'ladder', a: 'Ladder lent', b: 'Ladder lent', relevant: true},
      {icon: 'key', a: '', b: 'Key handed over', relevant: true},
    ]}, fn: "JSON.stringify(s.glyphs) === JSON.stringify(['eq','one']) && s.relDiff === 1 && s.linkEnds.every(Boolean)", label: 'supplied data drive the slots: a feature only B has lands on an empty slot'},
    {at: 0.76, params: {textVisibility: 'none'}, fn: "s.separated === 1 && s.plumbDrawn.every(q => q === 1) && JSON.stringify(s.glyphs) === JSON.stringify(['eq','eq','ne','one'])", label: 'labels hidden: the same mechanism reads from pins, plumb lines and glyphs'},
    {at: 0.7, fn: "s.detailWindow === 1 && s.detailZoom >= 1.15 && s.lensOffText", label: 'trace: a detail window beside the stack shows a real enlarged copy of the focus slot; the magnifier never sits on a readout text'},
    {at: 0.74, fn: "s.seat === 0 && s.separated === 1", label: 'the stack stays exploded through the trace'},
    {at: 1, fn: "s.seat === 1 && s.seatedShown === 1 && s.detailWindow === 0 && JSON.stringify(s.coincide) === JSON.stringify([0, 1]) && s.sideBySide.includes(s.relDiff)", label: 'gather: B seats back on A — shared tokens coincide, the differing variants stand side by side; the detail window has closed'},
    {at: 0.95, fn: 's.linkEnds.every(Boolean)', label: 'connectors stay on their elements while B moves (seek into the gather)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.seat === 1 && JSON.stringify(s.coincide) === JSON.stringify([0, 1])", label: 'labels hidden: the gather still reads (coinciding tokens, side-by-side variants)'},
  ],
});

// Per-ratio checks (every preset × 16:9 / 1:1 / 9:16).
ratioChecks('LAW-0086', [
  ...TEXT_CHECKS,
  {at: 0.7, fn: "s.detailWindow === 1 && JSON.stringify(s.insetTokens) === '[\"A\",\"B\"]' && s.insetGlyph", label: 'the inset shows case A’s AND case B’s token side by side with the glyph between them'},
  {at: 0.7, fn: "s.insetContents.length === 2 && s.insetContents.every((h, i) => h && h.length === 1 && h[0].startsWith(['pinA', 'pinB'][i]) || (h && h.length === 1 && h[0].startsWith(['emA', 'emB'][i])))", label: 'each inset copy contains only its own case’s token (no neighbouring pin, badge or the magnifier)'},
  {at: 0.7, fn: 's.insetLeaderTextHits === 0', label: 'the inset’s dashed leaders cross no card, tab or plate text'},
  {at: 0.45, fn: 's.connMinGap === null || s.connMinGap >= 30', label: 'exploded: the two rule connectors never run as a tight parallel pair'},
  {at: 1, fn: 's.connMinGap === null || s.connMinGap >= 30', label: 'seated: the two rule connectors never run as a tight parallel pair'},
  {at: 0.45, fn: 's.connPinHits === 0 && s.connCardHits === 0', label: 'exploded: no rule connector passes through another feature’s token or a readout card'},
  {at: 1, fn: 's.connPinHits === 0 && s.connCardHits === 0', label: 'seated: no rule connector passes through another feature’s token or a readout card'},
  {at: 1, fn: 's.lensRestClear && s.seatedClear', label: 'the parked magnifier touches no card/label/sheet; seated = / ≠ glyphs sit on no token'},
  {at: 1, params: {textVisibility: 'none'}, fn: 's.lensRestClear && s.seatedClear', label: 'labels hidden: the parked magnifier still sits in free space'},
]);
