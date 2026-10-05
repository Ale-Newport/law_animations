// LAW-0129 — Conflicto entre textos · story. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: continuous motion, props anchored to the
// solved hands, and a transformation that reads with labels hidden.
import {contractSuite, presetsFor} from '../harness/contract.js';

// safe areas that turn the 16:9 test frame into a square / portrait content box
const SHAPES = {horizontal: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, vertical: {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}}};
// every preset (and labels hidden) × desk layout, at rest and at the hold:
// the parked lens (glass AND handle) lies inside the desk window and clear of
// the texts, board, card, cup and captions; key captions never lose words to an ellipsis
const perPreset = [...presetsFor('LAW-0129'), {name: 'labels-hidden', params: {textVisibility: 'none'}}].flatMap(pr => Object.entries(SHAPES).flatMap(([layout, sa]) => [0, 1].map(at => ({
  at, params: {...pr.params, ...sa},
  fn: `s.layout === '${layout}' && s.lensHolder === 'desk' && s.lensParkedInDesk && s.lensParkedClear && s.keyChipsWhole`,
  label: `parked lens and handle inside the desk and clear of objects; key chips whole (${pr.name}, ${layout}, t=${at})`,
}))));

contractSuite('LAW-0129', {
  continuity: ['article', 'handA', 'handR', 'lens', 'marker'],
  attach: [
    // the assistant's hand holds the article's top edge while sliding it
    {from: 0.151, to: 0.39, a: 'handA', b: 'articleGrip', tol: 1.5},
    // the pennant pin rides the assistant's hand from the cup to the seam
    {from: 0.556, to: 0.654, a: 'handA', b: 'markerGrip', tol: 1.5},
    // the lens rides the reader's hand from pick-up until it is put back
    {from: 0.431, to: 0.629, a: 'handR', b: 'lensGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.articleHolder === 'desk' && s.gap > 150 && s.highlight === 0 && s.zoneDrawn === 0 && s.markerHolder === 'cup' && s.lensHolder === 'desk'", label: 'rest: article apart, nothing highlighted, marker in the cup, lens on the desk'},
    {at: 0.27, fn: "s.articleHolder === 'hand' && s.gap > 40 && s.gap < 150 && s.zoneDrawn === 0", label: 'the assistant carries the article towards the book before any zone appears'},
    {at: 0.45, fn: "s.gap === 40 && s.highlight === 1 && s.zoneDrawn > 0 && s.markerHolder === 'cup'", label: 'the provisions face each other and are highlighted before anything is marked (cause precedes effect)'},
    {at: 0.52, fn: "s.lensHolder === 'hand' && s.lensOverZone && s.lensShowsCopy", label: 'the reader holds the lens over the zone and it shows an enlarged copy'},
    {at: 0.62, fn: "s.markerHolder === 'hand' && !s.markerPlaced", label: 'the marker is carried by the hand before it is set down'},
    {at: 1, fn: "s.markerPlaced && s.markerHolder === 'desk' && s.zoneDrawn === 1 && s.stateShown && s.lensHolder === 'desk' && s.articleHolder === 'desk' && s.finalState === 'conflict-flagged'", label: 'hold: supplied state conflict-flagged, pin set on the seam, hands gone'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.markerPlaced && s.zoneDrawn === 1 && s.highlight === 1 && s.gap === 40", label: 'the transformation completes identically with labels hidden'},
    {at: 1, params: {finalState: 'compatible-application'}, fn: "s.markerKind === 'clip' && s.markerPlaced && s.finalState === 'compatible-application'", label: 'supplied compatible-application: a clip joins the texts instead of a pin'},
    {at: 1, params: {finalState: 'tension-highlighted'}, fn: "s.markerHolder === 'none' && s.zoneDrawn === 1 && s.highlight === 1", label: 'supplied tension-highlighted: no marker is placed'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.articleHolder === 'hand' && s.gap > 40 && s.highlight < 1 && s.markerHolder === 'cup'", label: 'actionProgress freezes the approach part-way'},
    {at: 0.5, fn: "s.lensHolder === 'hand' && s.lensRot !== 0", label: 'the lens turns to its working angle while it is held over the zone'},
    ...perPreset,
    {at: 1, params: {hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'], placement: [1, 0], caption: 'Order as supplied'}}, fn: "s.finalState === 'conflict-flagged' && s.markerPlaced", label: 'swapping the supplied hierarchy does not change the supplied state (the ordering is never applied)'},
  ],
});
