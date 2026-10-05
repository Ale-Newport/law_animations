// LAW-0027 — Traducción paralela · contrast. Contract battery + ID-specific
// checks encoding the brief's acceptanceCheck: both scenes exist, exactly the
// indicated fact changes (the term slot), and no legal consequence is added
// (both scenes are linked and stamped identically).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0027', {
  continuity: ['penA', 'penB', 'stampA', 'stampB'],
  attach: [
    {from: 0, to: 1, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0, to: 1, a: 'handB', b: 'gripB', tol: 1.5},
    {from: 0.17, to: 0.7, a: 'penA', b: 'strokeA', tol: 1.5},
    {from: 0.17, to: 0.7, a: 'penB', b: 'strokeB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.slot === 'blank' && s.b.slot === 'blank' && JSON.stringify(s.penA) === JSON.stringify(s.penB) && s.a.linked === 0 && s.b.linked === 0", label: 'identical base situation: blank slot in both scenes'},
    {at: 0.3, fn: "s.a.slot === 'available' && s.b.slot === 'unconfirmed' && s.a.linked === 0 && s.b.linked === 0", label: 'the changed fact is introduced locally at the slot, before any guide'},
    {at: 0.4, fn: 's.a.question === 0 && s.b.question === 1', label: 'only scenario B adds a question mark'},
    {at: 0.55, fn: 'JSON.stringify(s.a.links) === JSON.stringify(s.b.links) && JSON.stringify(s.penA) === JSON.stringify(s.penB)', label: 'the guides are drawn identically in parallel'},
    {at: 1, fn: "s.a.linked === s.b.linked && s.a.stamp && s.b.stamp && s.a.slot === 'available' && s.b.slot === 'unconfirmed'", label: 'both linked and stamped the same way; only the term slot differs'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.a.slot === 'available' && s.b.slot === 'unconfirmed' && s.b.question === 1", label: 'the difference still reads with labels hidden (shape of slot + question mark)'},
  ],
});
