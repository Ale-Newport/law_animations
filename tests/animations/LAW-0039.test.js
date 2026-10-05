// LAW-0039 — Custodia del original · contrast. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0039', {
  // The status mark is a large stamp that intentionally overprints the sheet's
  // clause headings (A: ORIGINAL…, B: COPY/COPIA…); the preset marks contain these words.
  allowTextOverlap: ['ORIGINAL', 'COPY', 'COPIA'],
  continuity: ['sheetA', 'sheetB', 'stampA', 'stampB', 'handA2a', 'handA2b', 'handB1b', 'penB'],
  attach: [
    {from: 0.412, to: 0.528, a: 'handA2a', b: 'gripA', tol: 1.5},
    {from: 0.412, to: 0.468, a: 'handA2b', b: 'gripB', tol: 1.5},
    {from: 0.552, to: 0.628, a: 'handB1b', b: 'gripB1', tol: 1.5},
    {from: 0.278, to: 0.303, a: 'stampA', b: 'stampSpotA', tol: 1.5},
    {from: 0.278, to: 0.303, a: 'stampB', b: 'stampSpotB', tol: 1.5},
    {from: 0.637, to: 0.708, a: 'penB', b: 'noteTipB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.holder === 'desk' && s.b.holder === 'desk' && !s.a.marked && !s.b.marked && JSON.stringify(s.sheetA) === JSON.stringify(s.sheetB)", label: 'identical base situation (same sheet, same place, unmarked)'},
    {at: 0.25, fn: 'JSON.stringify(s.stampA) === JSON.stringify(s.stampB) && JSON.stringify(s.handA2a) === JSON.stringify(s.handA2b)', label: 'the stamping motion is identical in both scenes'},
    {at: 0.35, fn: 's.a.marked && s.b.marked && s.markTexts[0] !== s.markTexts[1]', label: 'exactly one fact differs: the mark stamped on the sheet'},
    {at: 0.6, fn: "(s.a.holder === 'box' || s.a.holder === 'sinking') && (s.b.holder === 'B-pulling' || s.b.holder === 'B')", label: 'the changed fact changes the route: box in A, reader in B'},
    {at: 1, fn: "s.a.holder === 'box' && s.b.holder === 'B' && s.a.notes === 0 && s.b.notes === 1 && !s.a.lidClosed && !s.b.lidClosed && s.allReached", label: 'both scenes complete; no other difference is introduced (lids open in both)'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 0.5, fn: 's.guideProgress === 0', label: 'guide not shown before its beat'},
  ],
});
