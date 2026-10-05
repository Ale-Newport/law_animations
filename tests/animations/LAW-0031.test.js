// LAW-0031 — Cadena de versiones · contrast. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0031', {
  continuity: ['handA_A', 'handA_B', 'handB1_A', 'handB1_B', 'tab_A', 'tab_B', 'copy1_A', 'copy4_A', 'copy1_B', 'copy4_B'],
  attach: [
    // each clerk's hand holds the carried copy's grip (null between carries)
    {from: 0.25, to: 0.6, a: 'handA_A', b: 'gripA_A', tol: 1.5},
    {from: 0.25, to: 0.6, a: 'handA_B', b: 'gripA_B', tol: 1.5},
    // each reviewer's hand holds the tab while carrying it
    {from: 0.61, to: 0.7, a: 'handB1_A', b: 'tabGrip_A', tol: 1.5},
    {from: 0.61, to: 0.7, a: 'handB1_B', b: 'tabGrip_B', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "JSON.stringify(s.a.copies) === JSON.stringify(s.b.copies) && s.a.ring === 0 && s.b.ring === 0 && !s.a.tabOn && !s.b.tabOn", label: 'identical base situation, no difference shown yet'},
    {at: 0.3, fn: "s.a.ring > 0.9 && s.a.ringOn === 'v4' && s.b.ringOn === 'v3' && JSON.stringify(s.a.copies) === JSON.stringify(s.b.copies)", label: 'the change is introduced on a different copy while everything else is identical'},
    {at: 0.45, fn: "JSON.stringify(s.a.chainOrder) === JSON.stringify(s.b.chainOrder) && JSON.stringify(s.a.copies) === JSON.stringify(s.b.copies)", label: 'the ordering runs identically in parallel'},
    {at: 0.66, fn: "s.a.tabHeld && s.b.tabHeld && JSON.stringify(s.a.chainOrder) === JSON.stringify(['v1','v2','v3','v4'])", label: 'both tabs are carried only after both chains are complete'},
    {at: 1, fn: "s.a.tabOn === 'v4' && s.b.tabOn === 'v3' && JSON.stringify(s.a.chainOrder) === JSON.stringify(s.b.chainOrder)", label: 'exactly the indicated fact differs: which copy carries the tab'},
    {at: 1, fn: 's.guideProgress === 1', label: 'the comparison guide is drawn at the end'},
    {at: 1, params: {tabbed: {a: 'v2', b: 'v1'}}, fn: "s.a.tabOn === 'v2' && s.b.tabOn === 'v1'", label: 'the tabbed copies follow the supplied changed fact'},
  ],
});
