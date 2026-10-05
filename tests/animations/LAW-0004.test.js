// LAW-0004 — Firma de documento · inspect. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0004', {
  allowTextOverlap: ['RECEIVED', 'RECIBIDO'], // the receipt stamp intentionally overprints the title
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextSignature === 0", label: 'context shows the before datum'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensSignature === 0", label: 'lens open on the unchanged detail'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensSignature > 0 && s.lensSignature < 1 && s.contextSignature === 0", label: 'substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextSignature === 1 && s.contextDatum === 'after'", label: 'returns to context with the new datum'},
    {at: 0.3, fn: "s.contextSignature === 0 && s.datum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'date', beforeValue: 'Day 3', afterValue: 'Day 5'}, fn: "s.contextSignature === 1 && s.contextDatum === 'after' && s.focusTarget === 'date'", label: 'date substitution leaves the signature unchanged'},
  ],
});
