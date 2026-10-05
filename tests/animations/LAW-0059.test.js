// LAW-0059 — Lectura de sumario · contrast. Contract battery + ID-specific checks
// (brief acceptanceCheck: both scenes exist, exactly the indicated fact changes,
// and no legal consequence is invented to complete the contrast).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0059', {
  // Intentional overprint: each hand lens shows an ENLARGED COPY of the text it
  // reads (clipped to the glass), drawn over that same text. Only these
  // summary / passage texts of the presets are exempted from the overlap
  // heuristic; every other label is still checked.
  allowTextOverlap: [
    'The decision discusses the not', 'The panel reviewed the letter',
    'Summary of the inspection of t', 'Both parties described the sto',
    'The decision discusses at leng',
    'La resolución examina la carta', 'El tribunal revisó la carta fe',
  ],
  continuity: ['lensA', 'lensB', 'handA', 'handB', 'gripA', 'gripB'],
  attach: [
    {from: 0.4, to: 1, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0.4, to: 1, a: 'handB', b: 'gripB', tol: 1.5},
    // each lens is carried by its researcher's solved far hand at every frame
    {from: 0, to: 1, a: 'lensHandA', b: 'lensGripA', tol: 0.5},
    {from: 0, to: 1, a: 'lensHandB', b: 'lensGripB', tol: 0.5},
  ],
  semantic: [
    {at: 0.1, fn: "JSON.stringify(s.a) === JSON.stringify(s.b) && s.a.lensOn === 'rest'", label: 'identical base situation in both scenes'},
    {at: 0.36, fn: "s.a.lensOn === 'summary' && s.b.lensOn === 'wait' && s.a.pagesOpen === 0 && s.b.pagesOpen === 0", label: 'the difference is introduced before the action: A reads the summary, B waits for the text'},
    {at: 0.55, fn: 's.a.pagesOpen === s.b.pagesOpen && s.a.cardTop.y === s.b.cardTop.y && s.a.pagesOpen > 0', label: 'the card is lifted and unfolds identically in parallel'},
    {at: 1, fn: "s.a.lensOn === 'summary' && s.b.lensOn === 'passage' && s.readsA === 'summary' && s.readsB === 'passage'", label: 'A ends reading the summary, B the passage of the decision text'},
    {at: 1, fn: 's.a.pagesOpen === s.a.targetPage && s.b.pagesOpen === s.b.targetPage && s.a.holder === s.b.holder', label: 'everything else (unfolding, holder) stays identical'},
    {at: 1, fn: 's.a.highlight === 0 && s.b.highlight === 1', label: 'only the text that is read gets marked'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 1, params: {citations: {paragraph: 2}}, fn: "s.a.targetPage === 1 && s.b.targetPage === 1 && s.b.lensOn === 'passage'", label: 'a different pointer changes both scenes the same way'},
  ],
});
