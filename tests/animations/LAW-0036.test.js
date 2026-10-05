// LAW-0036 — Notificación documentada · inspect. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0036', {
  allowTextOverlap: ['RECEIVED', 'RECIBIDO', 'Day', 'Día', 'DAY'], // the date stamp intentionally overprints the card's reference rows
  continuity: ['card', 'handA', 'lensCorner', 'sourceCorner'],
  attach: [
    // at the start of the isolate beat the lens window coincides with its source (real copy, same coordinates)
    {from: 0.2, to: 0.22, a: 'lensCorner', b: 'sourceCorner', tol: 0.6},
    // and again once it has collapsed back onto the card
    {from: 0.885, to: 1, a: 'lensCorner', b: 'sourceCorner', tol: 0.6},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextSignature === 0 && s.stageScale > 0.9", label: 'context at full size shows the before datum'},
    {at: 0.2, fn: "s.cardHolder === 'folder'", label: 'the returned card rests in the folder before inspection'},
    {at: 0.42, fn: "s.lensOpen > 0.99 && s.datum === 'before' && s.lensSignature === 0 && s.stageScale < 0.6", label: 'lens open on the unchanged detail; scene reduced to a miniature'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensSignature > 0 && s.lensSignature < 1 && s.contextSignature === 0", label: 'substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextSignature === 1 && s.contextDatum === 'after' && s.stageScale > 0.9", label: 'returns to the full context with the new datum'},
    {at: 0.3, fn: "s.contextSignature === 0 && s.datum === 'before' && s.contextDatum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'date', beforeValue: 'Day 3', afterValue: 'Day 5'}, fn: "s.contextSignature === 1 && s.contextDatum === 'after' && s.focusTarget === 'date'", label: 'date substitution leaves the signature unchanged'},
    {at: 0.6, fn: 's.annotationClear === true', label: 'the before → after annotation stands clear of the lens leader lines'},
    {at: 0.6, params: {focusTarget: 'addressee', beforeValue: 'Oluwaseun Bartholomew-Nakamura', afterValue: 'Reception desk, for O. Bartholomew-Nakamura'}, fn: 's.annotationClear === true', label: 'a long before → after annotation also stands clear of the leader lines'},
  ],
});
