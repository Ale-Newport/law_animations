// LAW-0001 — Firma de documento · story. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0001', {
  allowTextOverlap: ['RECEIVED', 'RECIBIDO'], // the receipt stamp intentionally overprints the title
  continuity: ['penTip', 'documentCenter', 'handA', 'handB1', 'stampTool'],
  attach: [
    // A's hand pushes the sheet; B's hand pulls it; the stamp touches its spot while pressed
    {from: 0.462, to: 0.504, a: 'handA', b: 'docGripA', tol: 1.5},
    {from: 0.6, to: 0.679, a: 'handB1', b: 'docGripB', tol: 1.5},
    {from: 0.697, to: 0.732, a: 'stampTool', b: 'stampSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.documentHolder === 'A' && s.signatureProgress === 0 && s.penHeld", label: 'starts unsigned with party A holding the pen'},
    {at: 0.3, fn: 's.penTouching && s.signatureProgress > 0 && s.signatureProgress < 1', label: 'pen is on paper while the signature is drawn'},
    {at: 0.45, fn: '!s.penHeld && s.signatureProgress === 1', label: 'pen laid down before the sheet is pushed'},
    {at: 0.55, fn: "s.documentHolder === 'gliding' && s.signatureProgress === 1", label: 'document moves only after the signature is complete'},
    {at: 1, fn: "s.documentHolder === 'B' && s.stampApplied", label: 'ends with the stamped document at B'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.signatureProgress === 0 && s.documentHolder === 'A'", label: 'pending state: no signature, no transfer'},
    {at: 1, params: {finalState: 'signed-retained'}, fn: "s.signatureProgress === 1 && s.documentHolder === 'A' && !s.stampApplied", label: 'retained state: signed, stays with A'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.signatureProgress > 0 && s.signatureProgress < 1', label: 'actionProgress freezes the action part-way'},
  ],
});
