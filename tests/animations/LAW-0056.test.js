// LAW-0056 — Tratamiento de un caso · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is
// localized, and seeking back restores exactly the previous datum.
import {contractSuite, presetsFor} from '../harness/contract.js';

const ES = presetsFor('LAW-0056').find(x => x.name === 'baseline-es').params;

contractSuite('LAW-0056', {
  continuity: ['ctxTag', 'lensTag'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextSwap === 0", label: 'context is built with the before datum'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensSwap === 0 && s.linked === 3", label: 'lens open on the unchanged detail; every link in place'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensSwap > 0 && s.lensSwap < 1 && s.contextSwap === 0", label: 'the substitution happens inside the lens only'},
    {at: 0.6, fn: 'JSON.stringify(s.ctxTag) === JSON.stringify(s.lensTag)', label: 'the enlarged copy keeps the source coordinates of the detail'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextSwap === 1 && s.contextDatum === 'after' && s.markerShown && s.linked === 3", label: 'returns to context with the new datum, a marker and the same links'},
    {at: 1, fn: 's.ctxTagWidth === s.widthAfter && s.widthAfter !== s.widthBefore', label: "the label's dependent geometry (tag width) follows the new value"},
    {at: 0.83, fn: 's.contextSwap === 0 && s.lensSwap === 1 && s.lensOpen > 0', label: 'while the lens closes the context still shows the old value (no cross-fade in place)'},
    {at: 0.865, fn: 's.contextSwap === 1 && s.lensOpen === 0', label: 'the context takes the new value only once the lens lies on its source'},
    {at: 1, fn: 's.markerClear && s.markerDist <= 40 && !s.annotationShown', label: 'hold: the changed marker (old value struck) sits next to the detail, clear of the card contents; the lens annotation has given way to it'},
    {at: 1, params: ES, fn: 's.markerClear && s.markerDist <= 40', label: 'Spanish labels: the changed marker still sits next to the detail'},
    {at: 0.3, fn: "s.contextSwap === 0 && s.lensSwap === 0 && s.ctxTagWidth === s.widthBefore && s.contextDatum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'date', focusIndex: 2, beforeValue: 'Year 5', afterValue: 'Year 6'}, fn: "s.contextDatum === 'after' && s.focusTarget === 'date' && s.focusIndex === 2 && s.ctxTagWidth === undefined && s.linked === 3", label: 'date substitution leaves labels and links unchanged'},
  ],
});
