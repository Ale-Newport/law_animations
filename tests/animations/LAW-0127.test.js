// LAW-0127 — Definición legislativa · contrast. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';
import {motifChecks} from './definicion-legislativa-checks.js';

contractSuite('LAW-0127', {
  continuity: ['handLA', 'handLB', 'handRA', 'handRB', 'pinBA', 'pinBB', 'lensA', 'lensB'],
  attach: [
    {from: 0.061, to: 0.39, a: 'handLA', b: 'lensGripA', tol: 1.5},
    {from: 0.061, to: 0.39, a: 'handLB', b: 'lensGripB', tol: 1.5},
    {from: 0.49, to: 0.599, a: 'handLA', b: 'pinBA', tol: 1.5},
    {from: 0.49, to: 0.599, a: 'handLB', b: 'pinBB', tol: 1.5},
    {from: 0.215, to: 0.265, a: 'handRA', b: 'edgeGripA', tol: 1.5},
    {from: 0.215, to: 0.265, a: 'handRB', b: 'edgeGripB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "JSON.stringify([s.A.handL, s.A.handR, s.A.lens, s.A.pinB]) === JSON.stringify([s.B.handL, s.B.handR, s.B.lens, s.B.pinB]) && s.A.bookOpen === 0 && s.B.bookOpen === 0 && s.A.noteOpen === 0 && s.B.noteOpen === 0", label: 'base: the two desks are identical (same poses, book closed, note face down)'},
    {at: 0.15, fn: "!s.changedShown && s.A.termMark > 0 && s.A.termMark === s.B.termMark", label: 'the difference is not shown before the change beat; both mark the term identically'},
    {at: 0.3, fn: "s.changedShown && s.A.bookOpen > 0 && s.B.bookOpen === 0 && s.B.noteOpen > 0 && s.A.noteOpen === 0", label: 'change: A opens the book at the definitions, B turns the note card; nothing else differs'},
    {at: 1, fn: "s.A.linked && s.B.linked && s.A.target === 'definition' && s.B.target === 'note' && s.A.entryHl === 1 && s.B.noteHl === 1 && s.A.noteOpen === 0 && s.B.bookOpen === 0", label: 'both scenes exist and only the link target differs (definition vs proposal)'},
    {at: 1, fn: "Math.hypot(s.A.pinB.x - s.B.pinB.x, s.A.pinB.y - s.B.pinB.y) > 200 && s.A.handR.x !== undefined", label: 'the changed fact changes geometry: the cord ends in another section of the book (A) or on the note card (B)'},
    {at: 1, fn: "s.guide === 1 && s.neutralShown && s.allReached", label: 'guide links the changed detail with a neutral note (no winner, no outcome)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.A.linked && s.B.linked && s.A.bookOpen === 1 && s.B.noteOpen === 1", label: 'the contrast reads identically with labels hidden'},
  ],
});

// Review B007 rounds 1–3 — defect classes fixed, checked for every preset × ratio:
//  * round 1: key labels were 12-14 px; the closed book's title plate printed over the page text;
//    the guide ended in empty space; a bare shadow rectangle stood beside the turning note card;
//  * round 2: supplied text (article reference and wording, source name, hierarchy names, the
//    definition) was drawn as bars on the desks, or under 16 px: every supplied field is text >= 16 px;
//  * round 3: the desks were thumbnails (about 11% of a 16:9 frame together) under a large shared
//    panel and separate result cards; the cord was 1-2 px: the desks are drawn as large as the frame
//    allows (each >= 40% of the width at 16:9, >= 44% at 1:1, stacked at >= 75% at 9:16 — the
//    long-labels stress preset shrinks them, bounded below), the identical elements are one compact
//    strip of text, each result is a callout attached where its cord ends (A: the entry on the
//    definitions page; B: the note card) and never covers the documents, the cord is >= 4 px;
//  * round 4: the ending was rushed (final state ~0.3 s): everything is complete by u 0.85 of 8 s;
//    long labels at 1:1 kept desks at 33% of the width: headers run on at the content size (>= 40%);
//    the 1:1 desks grow taller so the callouts lie on them (no blank band under the desks).
const FIELDS_BASE = `[P.sources[0], ...P.hierarchy, P.passages[0].ref, P.passages[0].heading, P.passages[0].text, P.scenarioA.label, P.scenarioA.caption, P.scenarioB.label, P.scenarioB.caption, ...P.sharedFacts]`;
const FIELDS_HOLD = `[P.sources[0], P.sources[1], ...P.hierarchy, P.passages[0].ref, P.passages[0].heading, P.passages[0].text, P.passages[1].ref, P.passages[1].heading, P.passages[1].term, P.passages[1].text, P.interpretations[0].reading, P.interpretations[0].source, P.scenarioA.label, P.scenarioA.caption, P.scenarioB.label, P.scenarioB.caption, P.comparisonLabels.guide, P.comparisonLabels.neutral]`;
const CARDS = ['resA-g', 'resB-g', 'guidechip-g'];
const DESKS = ['A-desk-surface', 'B-desk-surface'];
const STD = ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'];
motifChecks('LAW-0127', 'desks as the subject (frame share), callouts at the cord ends, cord >= 4 px, supplied text >= 16 px', [
  {at: 0.1, tvs: ['all'], dom: {kind: 'fieldsText', min: 16, fields: FIELDS_BASE}, label: 'base: every supplied field shown so far is visible TEXT at >= 16 px (no bars)'},
  {at: 0.3, tvs: ['all'], dom: {kind: 'fieldsText', min: 16, fields: '[P.changedFact]'}, label: 'change: the changed fact is visible text at >= 16 px'},
  {at: 1, tvs: ['all'], dom: {kind: 'fieldsText', min: 16, fields: FIELDS_HOLD}, label: 'hold: every supplied field is visible TEXT at >= 16 px (no bars)'},
  {at: 1, tvs: ['all'], dom: {kind: 'minPx', nodes: CARDS, min: 16.4}, label: "A's definition and B's proposal (one size) and the guide label read at >= 16.5 px"},
  {at: 1, fn: "s.keyPx >= s.floorPx && s.floorPx >= 16.4", label: 'the two callouts share one text size, never below the floor'},
  // round 3: the desks are the subject
  ...[0.1, 1].map(at => ({at, ratios: ['16:9'], presets: STD, dom: {kind: 'widthShare', nodes: DESKS, min: 0.4}, label: '16:9: each desk covers >= 40% of the frame width'})),
  ...[0.1, 1].map(at => ({at, ratios: ['1:1'], presets: STD, dom: {kind: 'widthShare', nodes: DESKS, min: 0.44}, label: '1:1: each desk covers >= 44% of the frame width'})),
  ...[0.1, 1].map(at => ({at, ratios: ['9:16'], presets: STD, dom: {kind: 'widthShare', nodes: DESKS, min: 0.75}, label: '9:16: the desks are stacked, each >= 75% of the frame width'})),
  {at: 1, presets: ['long-labels-stress'], ratios: ['16:9', '1:1'], dom: {kind: 'widthShare', nodes: DESKS, min: 0.4}, label: 'long-labels stress, 16:9 / 1:1: each desk still covers >= 40% of the frame width'},
  {at: 1, presets: ['long-labels-stress'], ratios: ['9:16'], dom: {kind: 'widthShare', nodes: DESKS, min: 0.6}, label: 'long-labels stress, 9:16: the stacked desks keep >= 60% of the frame width'},
  // round 4: the ending is not rushed — everything is complete 1 s before the end and holds
  {at: 'hold', dom: {kind: 'holdsToEnd'}, label: 'the complete final state (callouts, guide, labels, neutral note) holds unchanged for the last 1 s'},
  {at: 'hold', fn: "s.guide === 1 && s.neutralShown && s.A.linked && s.B.linked", label: 'at 1 s before the end the guide, the neutral note and both links are complete'},
  {at: 1, ratios: ['9:16'], fn: "s.arrangement === 'stacked' && s.handLA.y < s.handLB.y", label: '9:16: desk A above desk B'},
  {at: 1, fn: "s.deskShare > 0 && Math.abs(s.handLA.x - s.handLB.x) >= 0", label: 'both desks have the same size (one desk scale)'},
  ...[0.3, 0.6, 1].map(at => ({at, dom: {kind: 'strokePx', nodes: ['A-pins-cord', 'B-pins-cord'], min: 4}, label: 'the cord is >= 4 px on the frame'})),
  {at: 1, fn: "s.cordPx >= 4", label: 'the cord width (semantic) is >= 4 px at 1080p'},
  {at: 1, fn: "s.pointerA.fromCard && s.pointerA.toDock < 30 && s.pointerB.fromCard && s.calloutsClearOfDocks", label: "each callout is attached where its cord ends (A: the entry's pin; B: the note card) and leaves the cord's end visible"},
  {at: 1, fn: "s.calloutsClearOfProps", label: 'the callouts never cover the extract, the book (open pages / closed cover, flags) or the note card'},
  {at: 1, fn: "s.guideOnTags && s.guide === 1", label: 'both guide ends sit on the callouts'},
  ...[0.2, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.4, 0.5].map(at => ({at, fn: "!s.plateWithPage && s.noteShadowMatches", label: 'the title plate is gone before any page text shows; the note shadow turns with the card'})),
]);
