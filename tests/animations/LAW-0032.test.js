// LAW-0032 — Cadena de versiones · inspect. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0032', {
  continuity: ['lensTab', 'contextTab'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextTabOn === 'v4'", label: 'context shows the before datum: the tab on v4'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensTabOn === 'v4' && JSON.stringify(s.lensTab) === JSON.stringify(s.contextTab)", label: 'lens open on the unchanged detail, drawn at the same source coordinates as the context'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensTabOn === 'moving' && s.contextTabOn === 'v4'", label: 'the substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextTabOn === 'v3' && s.contextDatum === 'after' && s.markerVisible", label: 'returns to context with the new datum and a changed marker'},
    {at: 0.3, fn: "s.contextTabOn === 'v4' && s.lensTabOn === 'v4' && s.datum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'date', beforeValue: 'Day 12', afterValue: 'Day 14'}, fn: "s.contextTabOn === 'v4' && s.contextDatum === 'after' && s.contextTextSwap === 1 && s.focusTarget === 'date'", label: 'date substitution leaves the tab where it was'},
    {at: 0.3, params: {focusTarget: 'date', beforeValue: 'Day 12', afterValue: 'Day 14'}, fn: "s.contextTextSwap === 0 && s.lensTextSwap === 0", label: 'seeking back before a date substitution shows the old date'},
  ],
});
