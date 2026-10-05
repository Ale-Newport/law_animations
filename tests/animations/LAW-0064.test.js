// LAW-0064 — Fuente primaria y comentario · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (real copy, same coordinates),
// the change is local (only the datum and its dependent link), and seeking back to earlier
// times restores the previous datum exactly.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0064', {
  continuity: ['contextPin', 'lensPin'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextLinkedPassage === 2 && s.lensLinkedPassage === 2", label: 'context builds with the side note linked to ¶2'},
    {at: 0.2, fn: 's.threadTied && s.sourceHoldsPort', label: 'the thread is tied before the lens opens; the lens source contains the card’s tab port'},
    {at: 0.44, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensValue === '¶2' && JSON.stringify(s.lensPin) === JSON.stringify(s.contextPin)", label: 'lens open on the unchanged detail: the copy sits exactly on its source'},
    {at: 0.6, fn: "s.datum === 'changing' && s.contextValue === '¶2' && s.contextLinkedPassage === 2", label: 'the substitution happens inside the lens only'},
    {at: 0.72, fn: "s.lensValue === '¶3' && s.lensLinkedPassage === 3 && s.contextLinkedPassage === 2 && s.cardFixed", label: 'only the dependent link follows the new datum (the card itself stays put)'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextValue === '¶3' && s.contextLinkedPassage === 3 && s.contextDatum === 'after' && s.markerShown === 1", label: 'returns to the context with the new datum and a changed marker'},
    {at: 0.3, fn: "s.contextValue === '¶2' && s.datum === 'before' && s.lensLinkedPassage === 2", label: 'seeking back restores the previous datum exactly'},
    {at: 0.44, fn: 's.zoom >= 2', label: 'the lens magnifies the link at least 2x'},
    {at: 0.7, fn: 's.annLines.length === 2 && s.annLines.every(n => n === 1)', label: 'before and after values each stay on one line'},
    {at: 0.772, fn: 's.lensOpen === 1 && s.lensContent > 0 && s.lensContent < 1', label: 'return: the enlarged copy fades inside the lens while the lens stays in place'},
    {at: 0.82, fn: 's.lensContent === 0 && s.lensOpen > 0 && s.lensOpen < 1', label: 'return: only the empty frame folds back to its source (no translucent copy over the shelf)'},
    {at: 1, fn: 's.markerClear', label: 'the changed-datum marker sits beside the tab, clear of the tab, the card, the page and its flags'},
    {at: 1, params: {focusTarget: 'commentator', beforeValue: 'R. Ferrer', afterValue: 'L. Vidal'}, fn: "s.contextValue === 'L. Vidal' && s.contextLinkedPassage === 2 && s.focusTarget === 'commentator'", label: 'changing the attribution leaves the link where it was'},
    {at: 1, params: {focusTarget: 'date', beforeValue: 'Written on Day 40', afterValue: 'Written on Day 55'}, fn: "s.contextValue === 'Written on Day 55' && s.contextLinkedPassage === 2", label: 'changing the date leaves the link where it was'},
    {at: 0.72, params: {textVisibility: 'none'}, fn: 's.lensLinkedPassage === 3 && s.lensOpen > 0.9', label: 'the substitution reads with labels hidden (the pin moves)'},
  ],
});
