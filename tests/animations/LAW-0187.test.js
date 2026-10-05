// LAW-0187 — Mediación entre partes · contrast. Contract battery + ID-specific checks.
// Acceptance (brief): both scenes exist, exactly the indicated fact (timing of
// the interventions) is modified, and no legal consequence is added.
// Clock mapping: c = (u − 0.17) / 0.6 · 1.12.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0187', {
  continuity: ['tokenA', 'tokenB', 'medLA', 'medRA', 'medLB', 'medRB', 'handAA', 'handBB'],
  attach: [
    // ordered scene: the token only moves under the mediator's hand
    {from: 0.226, to: 0.297, a: 'medLA', b: 'gripLA', tol: 1.5},
    {from: 0.493, to: 0.555, a: 'medLA', b: 'gripLA', tol: 1.5},
    {from: 0.557, to: 0.619, a: 'medRA', b: 'gripRA', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "JSON.stringify(s.a) === JSON.stringify(s.b) && s.a.tokenAt === 'home' && s.a.bubbleA === 0 && s.b.bubbleB === 0", label: 'identical base situation in both scenes'},
    {at: 0.36, fn: "s.a.speakingA && !s.a.speakingB && s.a.tokenAt === 'a' && s.b.both && s.b.tokenAt === 'home'", label: 'the change: one speaker with the token in A, both speaking in B'},
    {at: 0.5, fn: '!s.a.both && s.b.both', label: 'A never has two speakers at once; B does'},
    {at: 0.75, fn: "s.a.speakingB && !s.a.speakingA && s.b.both", label: 'A: the second party speaks after the first'},
    {at: 1, fn: "s.a.tokenAt === 'b' && s.b.tokenAt === 'home' && s.charts[0].overlap === 0 && s.charts[1].overlap > 0.5", label: 'charts: sequence in A, overlap in B'},
    {at: 1, fn: 's.guideProgress === 1 && s.allReached', label: 'comparison guide drawn at the end'},
    {at: 0.36, params: {relationships: [{from: 'b', to: 'a', kind: 'sequence'}]}, fn: "s.a.speakingB && !s.a.speakingA && s.a.tokenAt === 'b' && s.b.both", label: 'the ordered scene follows the supplied speaking order'},
  ],
});
