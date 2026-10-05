// LAW-0035 — Notificación documentada · contrast. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0035', {
  allowTextOverlap: ['RECEIVED', 'RECIBIDO', 'Day', 'Día'], // the date stamp intentionally overprints the card's reference rows
  continuity: ['envA', 'envB', 'cardA', 'cardB', 'handA_a', 'handA_b', 'handB1_a', 'handB1_b', 'copyA', 'copyB'],
  attach: [
    // A clips the card onto the envelope: the card rides A's hand
    {from: 0.236, to: 0.309, a: 'handA_a', b: 'cardGripA_a', tol: 1.5},
    // both recipients take the envelope at the hatch the same way
    {from: 0.491, to: 0.564, a: 'handB1_a', b: 'envGripB_a', tol: 1.5},
    {from: 0.491, to: 0.564, a: 'handB1_b', b: 'envGripB_b', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.card === 'folder' && s.b.card === 'folder' && s.a.envelope === 'out-tray' && s.b.envelope === 'out-tray' && JSON.stringify(s.cardA) === JSON.stringify(s.cardB)", label: 'identical base situation in both scenes'},
    {at: 0.3, fn: "s.a.card === 'A' && s.b.card === 'folder' && s.markerProgress > 0", label: 'the one changed fact is introduced locally: only A attaches the card'},
    {at: 0.39, fn: "s.a.card === 'envelope' && s.b.card === 'folder'", label: 'A dispatches with the card clipped, B without'},
    {at: 0.52, fn: "s.a.envelope === s.b.envelope && JSON.stringify(s.envA) === JSON.stringify(s.envB)", label: 'the delivery runs identically in parallel'},
    {at: 0.6, fn: "s.a.envelope === 'in-tray' && s.b.envelope === 'in-tray'", label: 'both envelopes reach the IN tray'},
    {at: 1, fn: "s.a.filed && s.a.signature === 1 && s.a.stamped && s.b.card === 'folder' && s.b.signature === 0 && !s.b.stamped", label: 'A: signed card filed; B: blank card still in the folder'},
    {at: 1, fn: "s.a.envelope === 'in-tray' && s.b.envelope === 'in-tray' && s.guideProgress === 1", label: 'both notices delivered; guide joins the compared detail; no outcome state exists'},
  ],
});
