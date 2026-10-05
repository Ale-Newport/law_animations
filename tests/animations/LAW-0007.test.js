// LAW-0007 — Sellado de copia · contrast. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

const same = (a, b) => `JSON.stringify(s.${a}) === JSON.stringify(s.${b})`;
// the footer notes share one spot: never two of them visible at once (no garbled cross-fade)
const oneFooter = '[s.footer.change, s.footer.shared, s.footer.neutral].filter(o => o > 0).length <= 1';
const footerSweep = [0.5, 0.52, 0.54, 0.545, 0.55, 0.56, 0.57, 0.6, 0.82, 0.84, 0.86, 0.87, 0.88, 0.9, 0.92, 0.94]
  .map(at => ({at, fn: oneFooter, label: 'at most one footer note visible (sequential fades)'}));

contractSuite('LAW-0007', {
  continuity: ['copyA', 'copyB', 'stampA', 'stampB', 'originalA', 'originalB', 'handStampA', 'handSteadyA', 'handSteadyB'],
  attach: [
    // A's stamp travels in the clerk's solved hand; both steadying hands hold and slide their copy;
    // A's stamp face sits on the mark spot while pressed
    {from: 0.221, to: 0.609, a: 'handStampA', b: 'stampA', tol: 1.5},
    {from: 0.321, to: 0.699, a: 'handSteadyA', b: 'copyGripA', tol: 1.5},
    {from: 0.321, to: 0.699, a: 'handSteadyB', b: 'copyGripB', tol: 1.5},
    {from: 0.461, to: 0.499, a: 'stampA', b: 'markSpotA', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: `s.a.stampOn === 'rest' && s.b.stampOn === 'rest' && !s.a.marked && !s.b.marked && ${same('copyA', 'copyB')} && ${same('originalA', 'originalB')}`, label: 'both scenes exist and start identical'},
    {at: 0.33, fn: "s.a.stampHeld && !s.b.stampHeld && s.b.stampOn === 'rest' && !s.a.marked", label: 'the changed fact: only scenario A takes and inks the stamp'},
    {at: 0.33, fn: same('handSteadyA', 'handSteadyB'), label: 'both clerks steady their copy identically'},
    {at: 0.48, fn: 's.a.marked && !s.b.marked', label: 'the mark exists only on A’s copy'},
    {at: 0.66, fn: `${same('copyA', 'copyB')} && ${same('originalA', 'originalB')} && s.a.copy === s.b.copy`, label: 'filing and return of the original run identically in parallel'},
    {at: 1, fn: "s.a.marked && !s.b.marked && s.a.copy === 'folder' && s.b.copy === 'folder' && s.a.original === 'A' && s.b.original === 'A'", label: 'ends: both copies filed, both originals back; only the mark differs'},
    {at: 1, fn: `${same('copyA', 'copyB')} && s.b.stampOn === 'rest' && s.a.stampOn === 'rest'`, label: 'no other object differs at the end'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 0.35, fn: 's.footer.change === 1 && s.footer.shared === 0 && s.footer.neutral === 0', label: 'the changed fact is the footer during the change beat'},
    {at: 0.7, fn: 's.footer.shared === 1 && s.footer.change === 0 && s.footer.neutral === 0', label: 'the shared facts are the footer during the parallel beat'},
    {at: 1, fn: 's.footer.neutral === 1 && s.footer.change === 0 && s.footer.shared === 0', label: 'only the neutral note remains in the footer at the end'},
    ...footerSweep,
  ],
});
