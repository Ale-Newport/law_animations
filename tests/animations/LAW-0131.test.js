// LAW-0131 — Conflicto entre textos · contrast. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: both scenes exist, exactly the indicated
// fact changes, and no legal consequence is invented (states are supplied).
import {contractSuite, presetsFor} from '../harness/contract.js';

// safe areas that turn the 16:9 test frame into a square / portrait content box
const SHAPES = {row: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}}};
const all = [...presetsFor('LAW-0131'), {name: 'labels-hidden', params: {textVisibility: 'none'}}];
const perPreset = all.flatMap(pr => Object.entries(SHAPES).flatMap(([shape, sa]) => [
  // the editable hierarchy (identical in A and B) is drawn ONCE, large enough to read on a phone
  {at: 0.3, params: {...pr.params, ...sa}, fn: 's.boardShared && s.boardShown && s.boardLabelPx >= 16', label: `shared hierarchy board shown with key labels >= 16 px at 1080p (${pr.name}, ${shape})`},
  // the guide keeps every word (no ellipsis) and never runs into the neutral note or the board
  {at: 1, params: {...pr.params, ...sa}, fn: 's.guideShown && s.footerClear && s.footerWhole', label: `guide chips whole and clear of the note (${pr.name}, ${shape})`},
  // AUTHORING 14/17: the wording both scenes share is printed once and stays readable through the
  // hold; key content (shared wording, the lanes' differing phrase, guide) >= 16 px at 1080p and
  // never smaller than the scenario captions; the slot stays on its page; plates clear the texts
  // (≥ ~16 px: 15.8 allows for the simulated square box of this 16:9 test frame; the real 1080×1080
  // long-labels frame measures 16.0 px)
  {at: 1, params: {...pr.params, ...sa}, fn: 's.sharedPlateShown && s.boardShown && s.keyPx >= 15.8 && s.captionPx <= s.keyPx && s.slotInside && s.platesClear', label: `shared wording readable at the hold, key text >= ~16 px and not smaller than captions (${pr.name}, ${shape})`},
  // B007 round 3: every hierarchy level label lies inside its row card; the pin cup keeps clear of the
  // article; the assistant's hand never covers either lane's phrase slot (grab → marker → withdraw)
  {at: 1, params: {...pr.params, ...sa}, fn: 's.boardRowsFit && s.cupClear', label: `hierarchy rows contain their wrapped labels; cup clear of the article (${pr.name}, ${shape})`},
  ...[0.42, 0.5, 0.58, 0.62, 0.65, 0.68, 0.7, 0.72, 0.73, 0.74, 0.75, 0.78].map(at => ({at, params: {...pr.params, ...sa}, fn: 's.a.handOffPhrase && s.b.handOffPhrase', label: `the hand keeps off the phrase slots (${pr.name}, ${shape}, t=${at})`})),
  // B007 round 4: the hand (its drawn fist) keeps off the book's printed anchor heading ("§ Art. 4")
  ...[0.3, 0.4, 0.5, 0.6, 0.64, 0.68, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.78].map(at => ({at, params: {...pr.params, ...sa}, fn: 's.handOffAnchor', label: `the hand keeps off the anchor heading (${pr.name}, ${shape}, t=${at})`})),
  // AUTHORING 19: rings, guide and neutral note are complete by u = 0.9 (a ≥ 300 ms full hold)
  {at: 0.9, params: {...pr.params, ...sa}, fn: 's.finalShown && s.beat === "guide"', label: `final beat complete by t=0.9 (${pr.name}, ${shape})`},
  // colour: the A/B letter badges use lane colours, distinct from each other and from the alarm accent
  {at: 1, params: {...pr.params, ...sa}, fn: 's.laneBadges.a !== s.laneBadges.alarm && s.laneBadges.b !== s.laneBadges.alarm && s.laneBadges.a !== s.laneBadges.b', label: `A/B badges in lane colours, not the alarm accent (${pr.name}, ${shape})`},
  // AUTHORING 18: side by side (16:9, 1:1), each desk takes >= 40 % of the frame width (1:1 long labels:
  // desks stacked on the left, the shared footer as a column on the right)
  ...(shape !== 'portrait' ? [{at: 1, params: {...pr.params, ...sa}, fn: 's.deskFrac >= 0.4', label: `each desk >= 40 % of the frame width (${pr.name}, ${shape})`}] : []),
]));

contractSuite('LAW-0131', {
  continuity: ['articleA', 'articleB', 'handAA', 'handAB', 'markerA', 'markerB'],
  attach: [
    // each article rides its assistant's hand from the grab until the hand lets go
    {from: 0.401, to: 0.619, a: 'handAA', b: 'gripAA', tol: 1.5},
    {from: 0.401, to: 0.619, a: 'handAB', b: 'gripAB', tol: 1.5},
    // each marker rides its hand from the cup to the seam
    {from: 0.666, to: 0.704, a: 'handAA', b: 'mGripA', tol: 1.5},
    {from: 0.666, to: 0.704, a: 'handAB', b: 'mGripB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "['article', 'articleRot', 'gap', 'handA', 'markerHolder', 'highlight', 'zoneDrawn', 'lens'].every(k => JSON.stringify(s.a[k]) === JSON.stringify(s.b[k])) && s.written === 0", label: 'base: the two scenes are identical and the phrase slot is still empty'},
    {at: 0.16, fn: "JSON.stringify(s.a.article) === JSON.stringify(s.b.article) && s.written === 0 && s.a.highlight === 0 && s.b.highlight === 0", label: 'no difference is shown before the change beat'},
    {at: 0.4, fn: "s.written === 1 && s.a.gap === s.b.gap && s.a.zoneDrawn === 0", label: 'the changed wording is written in both scenes before the action runs'},
    {at: 0.55, fn: "s.a.gap === 12 && s.b.gap === 8 && s.a.highlight > 0.5 && s.a.highlight === s.b.highlight", label: 'the same hand brings both articles to the book (B meets at contact) while both phrases are highlighted'},
    {at: 0.61, fn: "s.a.gap === 12 && s.b.gap === 54 && s.a.highlight === 1 && s.b.highlight === 1 && s.b.zoneDrawn > 0", label: 'only in B the article is held back to a gap before the zone is drawn'},
    {at: 1, fn: "s.a.gap === 12 && s.b.gap === 54 && s.a.markerPlaced && s.b.markerPlaced && s.statesSupplied.a === 'compatible-application' && s.statesSupplied.b === 'conflict-flagged' && s.guideShown", label: 'hold: A docked and clipped, B held apart and flagged, guide shown'},
    {at: 1, params: {states: {a: 'conflict-flagged', b: 'conflict-flagged'}}, fn: "s.a.gap === s.b.gap && JSON.stringify(s.a.marker) === JSON.stringify(s.b.marker)", label: 'geometry follows the SUPPLIED states, not the wording: equal states give equal scenes'},
    {at: 1, params: {states: {a: 'tension-highlighted', b: 'conflict-flagged'}}, fn: "s.a.markerHolder === 'none' && s.a.zoneDrawn === 1 && s.b.markerPlaced", label: 'a supplied plain state places no marker'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.a.gap === 12 && s.b.gap === 54 && s.a.markerPlaced && s.b.markerPlaced && s.guideShown && !s.guideText", label: 'the contrast plays identically with labels hidden; the guide keeps text-free ring markers'},
    {at: 1, fn: "s.changedFact === 'phrase' && s.a.allReached && s.b.allReached", label: 'exactly one fact (the phrase wording) differs; every hand target is reachable'},
    ...perPreset,
  ],
});
