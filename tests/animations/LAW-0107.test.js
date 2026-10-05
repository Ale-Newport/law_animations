// LAW-0107 — Razonamiento circular · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist; exactly the indicated fact changes (what the premise rests on) and it
// changes objects, relations and sequence (A-frame + loop vs chain onto a box), not only text or colour; no
// legal consequence is invented (only the supplied structure; neutral note, no winner).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {midWordSuite, everyLayoutSuite} from './razonamiento-circular-checks.js';

const ID = 'LAW-0107';

contractSuite(ID, {
  semantic: [
    {at: 0, fn: 's.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.boxInB && s.lean === 0', label: 'base: two identical scenes, nothing differs yet'},
    {at: 0.16, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.boxInB && s.lookA.labels === 0', label: 'base: still identical just before the change beat; no scenario label yet'},
    {at: 0.3, fn: 's.boxInB && s.lean === 0 && JSON.stringify(s.lookA.P) === JSON.stringify(s.lookB.P) && JSON.stringify(s.lookA.C) === JSON.stringify(s.lookB.C)', label: 'change: only the support under the premise differs (box slides into B); cards untouched'},
    {at: 0.38, fn: 's.cordA.visible && s.cordA.toClaim && s.cordB.visible && s.cordB.toBox', label: 'change: the premise is tied to the claim in A and to the outside support in B'},
    {at: 0.5, fn: 's.lean > 0 && s.lean < 1 && s.lookA.chocks === 1 && s.lookB.chocks === 1', label: 'parallel: both lanes lean with identical timing'},
    {at: 0.6, fn: 's.apexA < 0.5 && s.boxContactB < 0.5 && s.claimOnPremiseB < 0.5 && s.psiB > 6', label: 'geometry differs: A-frame (tops touch) in A; premise on the box and claim on the premise in B'},
    {at: 0.62, fn: 'JSON.stringify(s.arrowsA) === JSON.stringify(s.arrowsB)', label: 'arrows draw with the same timing in both lanes'},
    {at: 0.8, fn: "s.arrowsA.every(v => v === 1) && s.loopA.endOnPremise < 0.5 && s.chainB.endOnPremise < 0.5 && s.chainB.secondEndOnClaim < 0.5", label: 'sequence differs: A’s second arrow returns to its own premise; B’s chain starts at the box and ends on the claim'},
    {at: 1, fn: "s.guide === 1 && s.rings === 1 && s.markLocalSame && JSON.stringify(s.differsOnly) === JSON.stringify(['premiseRestsOn'])", label: 'guide: the changed detail is ringed at the same spot in both lanes and joined; only one fact differs'},
    {at: 0.16, params: {textVisibility: 'none'}, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.boxInB', label: 'labels hidden: identical before the change beat'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.apexA < 0.5 && s.boxContactB < 0.5 && s.arrowsB.every(v => v === 1)', label: 'labels hidden: the same physical difference reads'},
  ],
});

// A and B identical before the change beat (shared harness), every preset × ratio, labels shown and hidden.
identicalBeforeChange(ID, 0.17);

// Rendered text audit (shared harness): every supplied field drawn un-truncated at the hold; supplied text
// >= 16 px (>= 19.5 px baseline) and never smaller than the generic captions; the no-conclusion key.
const FIELDS = 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, ...p.issues, ...p.assumptions, p.speaker.name, p.speaker.role, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]';
suppliedTextSuite(ID, {fields: FIELDS, content: 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, p.scenarioA.label, p.scenarioB.label]', captions: 'return [p.comparisonLabels.neutral, ...p.issues, ...p.assumptions]'});
// Kind labels ("AFIRMACIÓN") are never hyphenated either (review: item 13).
midWordSuite(ID, FIELDS, {strictHyphen: true});

// Guide bracket (review: items 5, 8, 16): it crosses no arrow, card or box; it runs outside the lanes (above them
// side by side, down a gutter left of them when stacked) and never along a lane frame; it keeps well away from
// the rule plaque (the rule is not wired to a lane); its callout is attached to it.
everyLayoutSuite(ID, 'guide bracket routed clear, outside the lanes, callout attached',
  's.guideClear && s.guideOutsideLanes && s.guideFrameGap >= 18 && (s.guidePlaqueGap === null || s.guidePlaqueGap >= 40) && s.guideChipAttached !== false',
  {at: [0.9, 1], visibility: ['all', 'none']});
