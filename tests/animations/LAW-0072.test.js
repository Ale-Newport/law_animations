// LAW-0072 — Comprobación de jurisdicción · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is local (only the
// datum and its dependent placement), and seeking back restores the previous datum exactly.
import {contractSuite, presetsFor} from '../harness/contract.js';

// the saved presets' params (other than the default one) and safe areas that turn the
// 1920×1080 frame's caption-safe box square / tall (the semantic checks run at 1920×1080)
const PRESETS = presetsFor('LAW-0072').map(q => q.params).filter(q => Object.keys(q).length);
const SQUARE = {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25};
const TALL = {top: 0.06, right: 0.35, bottom: 0.2, left: 0.35};
const CLOSE_TIMES = [0.76, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.88];

contractSuite('LAW-0072', {
  continuity: ['docCenter'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === 'Northvale' && s.compartment === 'relevant'", label: 'context shows the before datum; the document sits with the relevant jurisdiction'},
    {at: 0.42, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensValue === 'Northvale'", label: 'lens open on the unchanged declaration'},
    {at: 0.42, fn: 's.sourceOffset.x === -6 && s.sourceOffset.y === -6 && s.source.w > 0 && s.lensHasDeclaration', label: 'the lens source is the focused document\'s own top with its whole declaration (same coordinates)'},
    {at: 0.53, fn: "s.datum === 'changing' && s.compartment === 'relevant'", label: 'while the datum is being replaced nothing else moves'},
    {at: 0.61, fn: "s.datum === 'after' && s.lensValue === 'Eastmere' && s.contextValue === 'Eastmere' && s.compartment === 'relevant'", label: 'new datum shown before its dependent placement changes'},
    {at: 0.68, fn: "s.compartment === 'moving' && s.lensOpen > 0.9 && s.sourceOffset.x === -6", label: 'the lens stays tethered to the document while only it moves'},
    {at: 1, fn: "s.lensOpen === 0 && s.compartment === 'other' && s.ghost === 1 && s.marker === 1 && s.contextKey === 'j2'", label: 'returns to the context: document in the other compartment, old slot traced, marker shown'},
    {at: 0.3, fn: "s.contextValue === 'Northvale' && s.datum === 'before' && s.compartment === 'relevant' && s.ghost === 0", label: 'seeking back restores the previous datum and placement exactly'},
    {at: 0.42, params: {sources: [{id: 'DOC-11', title: 'Supply contract file', declares: 'j1'}, {id: 'DOC-12', title: 'Freight agreement', declares: 'j2'}, {id: 'DOC-13', title: 'Warehouse lease with annexes, schedules and inventory lists', declares: 'j1'}]}, fn: 's.lensHasDeclaration', label: 'a long wrapped title never pushes the declaration out of the lens'},
    {at: 1, params: {afterValue: 'Northvale'}, fn: "!s.moves && s.compartment === 'relevant'", label: 'a substitution that keeps the same jurisdiction moves nothing (no invented consequence)'},
    {at: 0.5, fn: 's.lensClearOfLabels', label: 'the lens window opens and folds back along a path clear of the compartment labels and plates'},
    {at: 0.8, params: {contextLabels: {context: 'Sorted by the jurisdiction each document declares', marker: 'Datum changed', relevant: 'Relevant jurisdiction', other: 'Other jurisdiction'}, focusTarget: 'doc-1'}, fn: 's.lensClearOfLabels', label: 'another focused document: the lens path still avoids the labels'},
    {at: 0.65, params: {textVisibility: 'none'}, fn: '!s.beforeAfterArrow', label: 'with labels hidden no Before/After arrow is left floating'},
    // round-8 review: closing, the empty oversized frame swept back through the cabinet and
    // boxed DOC-15, parked over DOC-13's old slot, cut DOC-12/DOC-14 and the card's datum. It now
    // withdraws towards the document's current place and fades out before it reaches the
    // cabinet, a document, the card, the caption, a header or a chip — in every preset and in
    // square and tall boxes too (safe areas that turn the 1920×1080 frame's box square/tall)
    ...[{}, {focusTarget: 'doc-1'}, {focusTarget: 'doc-5'}, ...PRESETS, ...PRESETS.map(q => ({...q, safeArea: SQUARE})), ...PRESETS.map(q => ({...q, safeArea: TALL}))].flatMap(params =>
      CLOSE_TIMES.map(at => ({at, params, fn: 's.closeClearOfDocs && s.closeRouteClear && s.closeTowardDoc', label: 'closing, the lens frame is visible only clear of the cabinet, documents, card and labels, and withdraws towards the document'}))),
    {at: 0.81, fn: 's.closeFrameVisible > 0.5 && s.lensOpen < 0.9', label: 'the empty frame is seen withdrawing (not just vanishing)'},
    {at: 0.87, fn: 's.closeFrameVisible === 0 && s.lensOpen > 0', label: 'the frame has faded out before the lens is fully released'},
    {at: 0.95, fn: 's.beforeAfterChips === 1', label: 'wide box: the Before/After summary stays in the lens column at the hold'},
    {at: 0.95, params: {safeArea: TALL}, fn: 's.beforeAfterChips === 0', label: 'tall box: the Before/After chips leave with the lens (the marker carries the change)'},
    // round-6 review: while travelling back the enlarged copy stood beside DOC-13 like a second
    // document; the copy now empties at the lens place and only the empty frame folds back
    ...[0.77, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86].map(at => ({at, fn: 's.copyOnlyAtLens', label: 'folding back, the enlarged copy empties while the window is still far from the document (only the empty frame travels to it)'})),
    {at: 0.82, fn: 's.lensCopy === 0 && s.lensOpen > 0.3', label: 'mid-fold the travelling window is an empty frame'},
    {at: 0.76, fn: 's.lensCopy === 1', label: 'the enlarged copy is still shown when the fold begins'},
    // round-7 review: the moving document cut through DOC-15 (drawn over it), and the opening
    // lens copy faded in straddling DOC-13 and DOC-15
    ...[0.64, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71].map(at => ({at, fn: 's.moverClearOfDocs', label: 'changing compartment, the document never passes over another document'})),
    ...[0.64, 0.66, 0.68, 0.7].map(at => ({at, params: {focusTarget: 'doc-4', beforeValue: 'Southholm', afterValue: 'Northvale'}, fn: 's.moverClearOfDocs', label: 'a document rising into the relevant compartment never passes over another document'})),
    ...[0.24, 0.26, 0.27, 0.28, 0.29, 0.3, 0.32, 0.34, 0.36].map(at => ({at, fn: 's.openVisibleClearOfDocs', label: 'opening, the lens window is visible only once it is clear of every document'})),
    ...[0.26, 0.28, 0.3, 0.32].map(at => ({at, params: {focusTarget: 'doc-4', beforeValue: 'Southholm', afterValue: 'Northvale'}, fn: 's.openVisibleClearOfDocs', label: 'opening from the other compartment, the lens window appears only clear of the documents'})),
  ],
});
