// LAW-0159 — Regla transitoria · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist; exactly the indicated fact changes (the supplied day stamped on the one
// case) and it changes geometry and sequence (the card travels to a different side of the post), not only text or
// colour; no legal consequence is invented (strips only say before / after / on the supplied milestone; a neutral
// note, no winner).
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';

const ID = 'LAW-0159';

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardA', 'cardB', 'stampA', 'stampB'],
  attach: [
    // each lane's hand holds the stamp while it is lifted, pressed and put back, then the card while it slides
    {from: 0.2, to: 0.34, a: 'handA', b: 'stampGripA', tol: 1.5},
    {from: 0.2, to: 0.34, a: 'handB', b: 'stampGripB', tol: 1.5},
    {from: 0.401, to: 0.67, a: 'handA', b: 'cardGripA', tol: 1.5},
    {from: 0.401, to: 0.67, a: 'handB', b: 'cardGripB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: 's.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.lookA.stamped && s.lookA.labels === 0', label: 'base: two identical scenes; blank day chips; no scenario words yet'},
    {at: 0.16, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change beat'},
    {at: 0.35, fn: 's.lookA.stamped && s.lookB.stamped && JSON.stringify(s.lookA.card) === JSON.stringify(s.lookB.card) && s.sides.A === "neutral" && s.sides.B === "neutral"', label: 'change: both days stamped (only the printed day differs); the cards have not moved'},
    {at: 0.55, fn: 'JSON.stringify(s.lookA.card) !== JSON.stringify(s.lookB.card) && JSON.stringify(s.lookA.hand) !== JSON.stringify(s.lookB.hand)', label: 'parallel: the same gesture carries the card to a different place'},
    {at: 0.6, fn: 's.sides.A === "neutral" && s.sides.B === "neutral"', label: 'no side is shown before the card reaches its day (cause before effect)'},
    {at: 1, fn: "s.sides.A === 'before' && s.sides.B === 'after' && s.cardLeftOfPost.A === true && s.cardLeftOfPost.B === false", label: 'A: before the supplied milestone, left of the post; B: after it, right of the post'},
    {at: 1, fn: 's.slideLen.B > s.slideLen.A + 50 && s.sameScene && JSON.stringify(s.differsOnly) === JSON.stringify(["caseDay"])', label: 'geometry differs (longer slide in B); every other element is the same scene'},
    {at: 1, fn: 's.guide === 1 && s.neutral === 1', label: 'guide: bracket, changed-fact label and neutral note shown'},
    {at: 1, params: {changedCase: {label: 'On the day', icon: 'meeting', dayA: 20, dayB: 31}}, fn: "s.sides.A === 'on' && s.sides.B === 'after'", label: 'a case on the milestone day is placed on neither side'},
    {at: 0.16, params: {textVisibility: 'none'}, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'labels hidden: identical before the change beat'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.sides.A === 'before' && s.sides.B === 'after' && s.slideLen.B > s.slideLen.A", label: 'labels hidden: the same physical difference reads'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), `${p.timeline.unit} ${p.milestone.day} (${p.milestone.label})`, p.changedCase.label, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]',
  content: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), `${p.timeline.unit} ${p.milestone.day} (${p.milestone.label})`, p.changedCase.label, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts]',
  captions: 'return [p.comparisonLabels.neutral]',
});
