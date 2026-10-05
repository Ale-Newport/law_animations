// LAW-0008 — Sellado de copia · inspect. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

const same = (a, b) => `JSON.stringify(s.${a}) === JSON.stringify(s.${b})`;

contractSuite('LAW-0008', {
  continuity: ['windowCenter', 'thumbOrigin', 'lensStamp', 'lensHand'],
  attach: [
    // inside the detail window the replayed stamp travels in the clerk's solved hand,
    // and its face sits on the spot while pressed
    {from: 0.481, to: 0.734, a: 'lensHand', b: 'lensStamp', tol: 1.5},
    {from: 0.626, to: 0.654, a: 'lensStamp', b: 'lensMarkSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && !s.contextMark", label: 'context shows the before datum (no mark)'},
    {at: 0.44, fn: "s.lensOpen === 1 && s.datum === 'before' && !s.lensMark", label: 'the detail window is open on the unchanged spot'},
    {at: 0.21, fn: `s.lensOpen === 0 && ${same('sourceDesign', 'window')}`, label: 'the window starts exactly on the source region (detail keeps its source coordinates)'},
    {at: 0.3, fn: 's.lensOpen > 0 && s.lensOpen < 1 && s.window.w > s.sourceDesign.w', label: 'the window grows out of the source while the context shrinks'},
    {at: 0.6, fn: "s.datum === 'changing' && !s.lensMark && !s.contextMark", label: 'during the replay the stamp is on its way; the context is untouched'},
    {at: 0.7, fn: "s.lensMark && !s.contextMark && s.contextDatum === 'before'", label: 'the substitution is local to the window until the return'},
    {at: 0.7, fn: same('lensCopy', 'contextCopy'), label: 'only the datum differs: the copy geometry is identical in window and context'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextMark && s.contextDatum === 'after'", label: 'returns to the context showing the new datum'},
    {at: 0.3, fn: "!s.contextMark && s.datum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'date', beforeValue: 'Day 3', afterValue: 'Day 5'}, fn: "s.contextMark && s.contextDatum === 'after' && s.focusTarget === 'date'", label: 'date substitution: impression present, only its date line changes'},
    {at: 0.4, params: {focusTarget: 'label', beforeValue: 'COPY', afterValue: 'FILE COPY'}, fn: "s.contextMark && s.datum === 'before' && s.contextDatum === 'before'", label: 'label substitution starts from the old legend'},
  ],
});
