// LAW-0150 — Remisión entre artículos · mechanism. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: every connector ends on its element, the order
// does not change when seeking, and a plain relation is never drawn as causation by default.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
// shared per-ratio runner (real 16:9 / 1:1 / 9:16 instances × every preset × labels shown/hidden)
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ALT = presetsFor('LAW-0150').find(q => q.name === 'contrast-or-alternative').params;
const ORDER = "JSON.stringify(s.visitOrder) === JSON.stringify(['provision','relay','referenced'])";

contractSuite('LAW-0150', {
  continuity: ['tracer'],
  semantic: [
    {at: 0.05, fn: 's.separated < 1 && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible', label: 'separate: leaves still sliding out of the volume; no relationship drawn yet'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(v => v === 0)', label: 'leaves are on their bands before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(v => v === 1) && s.relationsDrawn.some(v => v < 1)', label: 'relationships are drawn one after another'},
    {at: 0.44, fn: 's.relationsDrawn.every(v => v === 1) && !s.tracerVisible', label: 'all supplied relationships drawn before the marker moves'},
    {at: 0.5, fn: "s.connectorsLand && !s.kinds.includes('causal') && s.kinds.filter(k => k === 'relation').length === 1", label: 'every connector ends on its element; "printed in" is a plain relation; no causal link by default'},
    {at: 0.5, fn: ORDER + ' && s.tracerVisible', label: 'the marker follows the supplied traversal order'},
    {at: 0.62, fn: "s.visited.join() === s.visitOrder.slice(0, s.visited.length).join() && s.visited.length === 2", label: 'visits happen in the supplied order (no reordering when seeking)'},
    {at: 0.6, fn: "s.focus === 'relay' && s.focusScale > 1", label: 'the focus leaf swells while the marker is on it'},
    {at: 1, fn: "s.visited.join() === 'provision,relay,referenced' && s.at === 'referenced' && s.docks.every(v => v === 1) && s.keyShown === 1 && s.tracerClear", label: 'gather: all leaves, relations and dock numbers stay; the marker rests beside the referenced text'},
    {at: 0.62, params: {traversalOrder: ['referenced', 'relay', 'provision']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['referenced','relay','provision']) && s.visited[0] === 'referenced'", label: 'another supplied order is followed as given (the marker rides the links backwards)'},
    {at: 1, params: ALT, fn: "s.leaves.length === 2 && !s.leaves.includes('relay') && s.visited.join() === 'provision,referenced' && s.kinds.filter(k => k === 'sequence').length === 1 && s.connectorsLand", label: 'alternative (direct reference): two leaves, one "refers to" leg'},
    {at: 0.5, params: {relationships: [{from: 'provision', to: 'relay', kind: 'causal'}, {from: 'relay', to: 'referenced', kind: 'sequence'}]}, fn: "s.kinds.includes('causal') && s.connectorsLand", label: 'a causal style appears only where the author supplies it'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.visited.join() === 'provision,relay,referenced' && s.connectorsLand", label: 'labels hidden: the same mechanism runs'},
  ],
});

suppliedTextSuite('LAW-0150', {
  fields: 'return [p.sources[0].title, ...p.hierarchy.levels, ...p.passages.map(x => x.ref), ...p.passages.map(x => x.cue), ...p.elements.filter(e => e.id !== "relay" || p.passages.length > 2).map(e => e.label), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k]), ...p.interpretations.flatMap(i => [i.by, i.text])];',
  content: 'return [...p.hierarchy.levels, ...p.passages.map(x => x.ref), ...p.passages.map(x => x.cue), ...p.elements.map(e => e.label)];',
  captions: 'return ["no conclusion drawn", "sin conclusión"];',
});

ratioChecks('LAW-0150', 'leaves fit and never overlap; connectors land; the parked marker is clear of the leaves', [
  {at: [1], fn: 's.leavesFit && s.leavesClear && s.connectorsLand && s.tracerClear', label: 'hold: leaves fit their bands, do not overlap, connectors land, marker parked outside the leaves'},
  {at: times(0.46, 0.74, 0.04), fn: 's.connectorsLand', label: 'connectors stay on their elements while the marker travels'},
]);

// Review round 2 (every preset × real ratio × labels shown/hidden): no connector cuts a band label, a leaf's
// element label or the volume label; every relation label sits beside its own line on a short leader, clear of
// the connector ends (arrowheads visible on the cards) and of the other labels; the moving marker never covers
// a relation label.
ratioChecks('LAW-0150', 'connectors clear of chips; labels beside their own line; marker never over a label', [
  {at: [1], fn: 's.linesClearOfChips && s.labelsClearOfChips && s.labelsClearOfEnds && s.labelsPlaced && s.labelsOwnLine && s.labelLeads.every(v => v <= 160)', label: 'hold: lines miss every chip; each label beside its own line (nearer to it than to any other line, leader <= 160), clear of ends and other labels'},
  {at: times(0.44, 0.76, 0.008), fn: '!s.tracerOverLabel', label: 'the moving marker never covers a relation label'},
]);

// Review round 3: at the hold the marker docks on the referenced card's free edge, clear of every connector end
// (the last "refers to" arrowhead stays visible), and the last link has real length (>= 100 units) in every ratio.
ratioChecks('LAW-0150', 'parked marker clear of connector ends; last link long', [
  {at: [0.9, 1], fn: 's.parkedClearOfEnds && s.tracerClear && !s.tracerOverLabel', label: 'hold: the parked marker is clear of every connector end and label'},
  {at: [1], fn: 's.lastLinkLength >= 100', label: 'the last "refers to" link is >= 100 units long'},
]);
