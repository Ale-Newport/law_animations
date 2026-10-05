// LAW-0166 — Consulta entre profesionales · mechanism. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: every connector ends on its element (badge circle, card
// or page edge; a notes → page line ends exactly on the outer tip of the flag it places), the
// order does not change on seek (traversal order and visit times come from the supplied order;
// determinism is covered by the contract battery), and a relation is never drawn as causation
// (plain relations have no arrowhead; no causal link unless supplied).
// Timing (default, 5 relationships): relate u 0.18–0.40, 0.044 each; connector i is drawn over
// u [0.18 + 0.044 i, + 0.031]; each note's flag rides its line for 0.09 (630 ms) from 0.3 of its
// slot: notesA u 0.325–0.415, notesB u 0.369–0.459; trace u 0.46–0.74; legend u 0.76–0.83.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const ALT = presetsFor('LAW-0166').find(q => q.name === 'contrast-or-alternative').params;

contractSuite('LAW-0166', {
  continuity: ['tracer', 'flagSameA', 'flagSameB', 'flagOpen'],
  semantic: [
    {at: 0.05, fn: 's.separated < 1 && s.drawn.every(d => d === 0) && !s.flagsLanded && s.band === 0', label: 'separate: elements slide apart; nothing related yet'},
    {at: 0.3, fn: 's.drawn[0] === 1 && s.drawn[1] === 1 && s.drawn[2] === 1 && s.drawn[3] === 0 && !s.flagsLanded', label: 'relate: the supplied relationships are drawn one by one, in order'},
    {at: 0.36, fn: 's.drawn[3] > 0 && s.flagSameA.x !== null && !s.flagsLanded', label: 'a note’s flag travels along its line toward the page'},
    {at: 0.465, fn: 's.drawn.every(d => d === 1) && s.flagsLanded && s.aligned && s.band === 0 && s.ring === 0', label: 'all flags landed on the margins, level on the shared passage; no mark yet'},
    {at: 0.6, fn: 's.tracerOn', label: 'trace: the tracer runs along the connectors'},
    {at: 0.9, fn: 's.band === 1 && s.ring === 1 && !s.tracerOn && s.legendShown === 1', label: 'gather: same point and open question marked; legend shown'},
    {at: 1, fn: "s.anchored && s.kinds.every((k, i) => k !== 'relation' || !s.arrows[i]) && !s.kinds.includes('causal')", label: 'connectors end on their elements; plain relations have no arrow; nothing causal unless supplied'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['a', 'notesA', 'document', 'notesB', 'b']) && s.visitTimes.every((t, i, a) => i === 0 || t > a[i - 1])", label: 'the tracer visits the elements in the supplied order'},
    {at: 0.465, params: {textVisibility: 'none'}, fn: 's.flagsLanded && s.aligned', label: 'labels hidden: the mechanism still reads'},
    {at: 1, params: ALT, fn: "s.kinds.includes('sequence') && s.arrows[s.kinds.indexOf('sequence')] && JSON.stringify(s.order) === JSON.stringify(['document', 'notesB', 'b', 'a', 'notesA']) && s.anchored && s.focusElement === 'notesA'", label: 'alternative: a supplied sequence link gets its arrow; the tracer follows the new order'},
    {at: 1, params: {relationships: [{from: 'a', to: 'b', kind: 'causal', label: 'x'}, {from: 'notesA', to: 'document', kind: 'relation'}, {from: 'notesB', to: 'document', kind: 'relation'}]}, fn: "s.kinds.includes('causal') && s.arrows[0] && s.anchored", label: 'causal is drawn only when supplied (then with its arrow)'},
  ],
});

suppliedTextSuite('LAW-0166', {
  fields: "const d = p.props.document; const kinds = [...new Set(p.relationships.map(x => x.kind))]; return [...p.actors.map(a => a.name), p.roles.a, p.roles.b, d.reference, d.title, ...d.passages.map(x => x.ref), ...d.passages.map(x => x.text), p.props.same.noteA, p.props.same.noteB, p.props.open.note, ...p.elements.filter(e => e.id !== 'document').map(e => e.label), ...p.relationships.map(x => x.label || p.relationLabels[x.kind]), ...kinds.map(k => p.relationLabels[k])];",
  content: "const d = p.props.document; return [...p.actors.map(a => a.name), ...d.passages.map(x => x.text), p.props.same.noteA, p.props.same.noteB, p.props.open.note];",
  captions: 'return ["no conclusion drawn", "sin conclusión"];',
});

ratioChecks('LAW-0166', 'labels fit and connectors anchored', [
  {at: [1], fn: 's.labelsFit && s.anchored', label: 'hold: labels placed clear; connectors anchored (every preset × ratio)'},
  {at: [1], fn: 's.anchored', label: 'connectors anchored in every preset × ratio'},
  {at: [1], fn: 's.labelsNear', label: 'every relation label within ~40 px of its own connector'},
  {at: [1], fn: 's.linesDistinct', label: 'each note→flag line starts at its own point (lines traceable)'},
  {at: [1], fn: 's.equalSizes', label: 'both professionals get the same name size and the same note size'},
  {at: [1], fn: 's.captionsNotLarger', label: 'labels, names and legend never larger than the notes (item 17)'},
]);
