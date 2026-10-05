// LAW-0165 — Consulta entre profesionales · story. Contract battery + ID-specific checks.
// Acceptance (brief): continuity of motion, object anchoring, and the transformation must be
// recognisable with labels hidden (checked on semantic state, which does not depend on text).
// Clock mapping (see LAW-0165.js): c = (u − 0.15) / 0.63. Placement phases (kit): pick-up at
// a + 0.2·d, press at a + 0.84·d of each window [a, a + d].
//   A's flag  c [0, 0.34]    held c 0.068–0.286 → u 0.193–0.330
//   B's flag  c [0.2, 0.54]  held c 0.268–0.486 → u 0.319–0.456
//   B's open  c [0.56, 0.86] held c 0.620–0.812 → u 0.541–0.662
//   band c [0.52, 0.66] → u 0.478–0.566; ring from c 0.842 → u 0.680
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const ALT = presetsFor('LAW-0165').find(q => q.name === 'contrast-or-alternative').params;

contractSuite('LAW-0165', {
  continuity: ['handA', 'handB', 'flagSameA', 'flagSameB', 'flagOpen'],
  attach: [
    // each flag IS the solved hand while carried (pick-up to press)
    {from: 0.196, to: 0.328, a: 'handA', b: 'flagSameA', tol: 0.5},
    {from: 0.322, to: 0.454, a: 'handB', b: 'flagSameB', tol: 0.5},
    {from: 0.544, to: 0.66, a: 'handB', b: 'flagOpen', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.at.sameA === 'pad' && s.at.sameB === 'pad' && s.at.open === 'pad' && s.band === 0 && s.bubbleA === 0 && s.bubbleB === 0", label: 'rest: every flag lies on its owner’s pad; no bubble, no mark'},
    {at: 0.25, fn: "s.holdSameA === 'a' && s.at.sameB === 'pad' && s.band === 0 && s.ring === 0", label: 'A carries a flag in hand before anything is marked'},
    {at: 0.39, fn: "s.at.sameA === 1 && s.holdSameB === 'b' && s.band === 0", label: 'A’s flag is on the shared passage; B carries theirs'},
    {at: 0.5, fn: "s.at.sameA === 1 && s.at.sameB === 1 && s.aligned && s.band > 0 && s.band < 1 && s.at.open === 'pad'", label: 'both flags sit level on the same passage; the band grows between them'},
    {at: 0.6, fn: "s.holdOpen === 'b' && s.band === 1 && s.ring === 0 && s.slot === 0", label: 'B carries the open-question flag; no open mark yet'},
    {at: 1, fn: "s.at.open === 2 && s.openApart && s.aligned && s.band === 1 && s.ring === 1 && s.slot === 1 && s.bubbleA === 1 && s.bubbleB === 1 && s.legendShown === 1 && s.allReached", label: 'hold: same point marked, open question apart with ring and empty outline, legend shown'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.aligned && s.band > 0', label: 'labels hidden: the aligned flags and the band still read'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.openApart && s.ring === 1 && s.slot === 1', label: 'labels hidden: the open question still reads (ring + empty outline)'},
    {at: 1, params: {finalState: 'laid'}, fn: "s.at.sameA === 1 && s.at.sameB === 1 && s.at.open === 2 && s.band === 0 && s.ring === 0 && s.slot === 0", label: 'supplied state "laid": flags placed, no comparison marks drawn'},
    {at: 0.25, params: {relationships: [{from: 'b', to: 'a', kind: 'sequence'}]}, fn: "s.order === 'b>a' && s.holdSameB === 'b' && s.at.sameA === 'pad'", label: 'a sequence link B→A makes B lay the first flag'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.at.sameA === 1 && s.holdSameB === 'b' && s.band === 0 && s.legendShown === 0", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: ALT, fn: "s.openBy === 'a' && s.at.open === 2 && s.at.sameA === 0 && s.aligned && s.ring === 1", label: 'alternative: A raises the open question on another passage'},
    {at: 1, fn: 's.labelsFit', label: 'default labels fit (no cut text, no overlaps, callouts placed clear)'},
  ],
});

suppliedTextSuite('LAW-0165', {
  fields: "const d = p.props.document; return [...p.actors.map(a => a.name), p.actorLabels.a || p.roles.a, p.actorLabels.b || p.roles.b, d.reference, d.title, ...d.passages.map(x => x.ref), ...d.passages.map(x => x.text), p.props.same.noteA, p.props.same.noteB, p.props.open.note, ...(p.finalState === 'compared' ? [p.objectLabels.samePoint, p.objectLabels.openQuestion] : []), ...p.annotations.map(a => a.text)];",
  content: "const d = p.props.document; return [...p.actors.map(a => a.name), ...d.passages.map(x => x.text), p.props.same.noteA, p.props.same.noteB, p.props.open.note];",
  captions: 'return ["no conclusion drawn", "sin conclusión"];',
});

ratioChecks('LAW-0165', 'labels fit, hands reach, flags below the chin, equal treatment', [
  {at: [0.2, 0.24, 0.28, 0.3, 0.32, 0.36, 0.4, 0.44, 0.55, 0.6, 0.65, 0.7, 1], fn: 's.flagsBelowChin', label: 'a carried or pressed flag never rises above the chin (never at the face)'},
  {at: [1], fn: 's.equalSizes', label: 'both professionals get the same name size and the same note size'},
  {at: [0.3, 0.38, 0.45, 0.62, 1], fn: 's.bubbleTextWithBubble', label: 'no bubble is shown without its text'},
  {at: [1], fn: 's.labelsFit && s.allReached', label: 'hold: every label fits clear of the others; all IK targets reached'},
  {at: [0.25, 0.4, 0.6], fn: 's.allReached', label: 'carrying: all IK targets reached'},
]);
