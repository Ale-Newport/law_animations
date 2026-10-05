// LAW-0443 — Oferta comunicada · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (whether the
// offer reaches B), and no legal consequence is invented to complete the contrast.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0443', {
  continuity: ['aSheet', 'bSheet', 'bHandB'],
  attach: [
    {from: 0, to: 0.466, a: 'aHandA', b: 'aGripA', tol: 1.5},
    {from: 0, to: 0.466, a: 'bHandA', b: 'bGripA', tol: 1.5},
    {from: 0.652, to: 1, a: 'bHandB', b: 'bGripB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.holder === 'A' && s.b.holder === 'A' && s.a.folded === 0 && JSON.stringify(s.aSheet) === JSON.stringify(s.bSheet)", label: 'identical base situation in both scenes'},
    {at: 0.36, fn: "s.a.folded === 1 && s.b.folded === 1 && JSON.stringify(s.aSheet) === JSON.stringify(s.bSheet)", label: 'both offers folded and sealed identically'},
    {at: 0.51, fn: "s.a.holder === 'in-transit' && s.b.holder === 'in-transit' && JSON.stringify(s.aSheet) === JSON.stringify(s.bSheet)", label: 'sent in parallel along the same first leg'},
    {at: 0.57, fn: "s.a.holder === 'relay' && s.b.holder === 'relay'", label: 'both reach the relay at the same time'},
    {at: 0.62, fn: "s.a.holder === 'relay' && s.b.holder === 'in-transit'", label: 'only scenario B continues toward the offeree'},
    {at: 1, fn: "s.a.holder === 'relay' && s.b.holder === 'B' && s.b.opened === 1 && s.a.folded === 1", label: 'A ends sent (at the relay, sealed); B ends received and open'},
    {at: 1, fn: 's.guideProgress === 1 && s.allReached', label: 'comparison guide drawn at the end; hands within reach'},
  ],
});
