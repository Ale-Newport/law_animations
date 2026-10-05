// LAW-0005 — Sellado de copia · story. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0005', {
  continuity: ['stampTool', 'copyCenter', 'originalCenter', 'handStamp', 'handSteady', 'handA'],
  attach: [
    // the stamp travels in the clerk's solved hand; the steadying hand holds and slides the copy;
    // A's hand stays on the original; the stamp face sits on the mark spot while pressed
    {from: 0.201, to: 0.579, a: 'handStamp', b: 'stampTool', tol: 1.5},
    {from: 0.231, to: 0.679, a: 'handSteady', b: 'copyGrip', tol: 1.5},
    {from: 0, to: 1, a: 'handA', b: 'origGrip', tol: 1.5},
    {from: 0.421, to: 0.459, a: 'stampTool', b: 'markSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0.05, fn: "s.stampOn === 'rest' && !s.stampHeld && !s.markApplied && s.copyHolder === 'desk' && s.stampHeight === 0", label: 'rest: stamp on its rest, copy unmarked'},
    {at: 0.25, fn: "s.stampOn === 'pad' && s.stampHeld && !s.markApplied", label: 'the stamp is inked on the pad before it moves to the copy'},
    {at: 0.33, fn: "s.stampHeight > 0.5 && s.stampOn === 'air' && !s.markApplied", label: 'raised over the copy: no mark before contact (cause precedes effect)'},
    {at: 0.44, fn: "s.stampOn === 'copy' && s.markApplied && Math.hypot(s.stampTool.x - s.markSpot.x, s.stampTool.y - s.markSpot.y) < 1.5", label: 'contact: the mark exists exactly under the stamp face'},
    {at: 0.44, fn: 'Math.abs(s.markRotation - s.stampRotation) < 0.01', label: 'the mark keeps the rotation of the stamp face at contact'},
    {at: 0.66, fn: "s.copyHolder === 'sliding' && s.markApplied", label: 'the marked copy is slid onto the file afterwards'},
    {at: 1, fn: "s.copyHolder === 'folder' && s.markApplied && s.originalHolder === 'A' && s.stampOn === 'rest' && !s.stampHeld", label: 'ends: marked copy filed, original back with A, stamp on its rest'},
    {at: 1, params: {finalState: 'unmarked'}, fn: "!s.markApplied && s.copyHolder === 'desk' && s.stampOn === 'rest'", label: 'unmarked state: the stamp hovers and returns, no mark'},
    {at: 0.44, params: {finalState: 'unmarked'}, fn: "!s.markApplied && s.stampHeight > 0.5", label: 'unmarked state: no contact at the contact time'},
    {at: 1, params: {finalState: 'marked-on-desk'}, fn: "s.markApplied && s.copyHolder === 'desk' && s.originalHolder === 'desk'", label: 'marked-on-desk state: marked copy stays on the desk'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.stampHeld && !s.markApplied && s.actionCapped', label: 'actionProgress freezes the action part-way'},
  ],
});
