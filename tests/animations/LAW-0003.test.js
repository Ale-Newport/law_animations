// LAW-0003 — Firma de documento · contrast. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0003', {
  allowTextOverlap: ['RECEIVED', 'RECIBIDO'], // the receipt stamp intentionally overprints the title
  continuity: ['docA', 'docB', 'penA', 'penB'],
  semantic: [
    {at: 0.1, fn: 's.a.signature === 0 && s.b.signature === 0 && s.a.holder === s.b.holder', label: 'identical base situation'},
    {at: 0.3, fn: 's.a.signature === 0 && s.b.signature > 0', label: 'only scenario B draws the signature'},
    {at: 0.55, fn: 's.a.holder === s.b.holder && JSON.stringify(s.docA) === JSON.stringify(s.docB)', label: 'the transfer runs identically in parallel'},
    {at: 1, fn: "s.a.signature === 0 && s.b.signature === 1 && s.a.holder === 'B' && s.b.holder === 'B' && s.a.stamp && s.b.stamp", label: 'both delivered and stamped; only the signature differs'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
  ],
});
