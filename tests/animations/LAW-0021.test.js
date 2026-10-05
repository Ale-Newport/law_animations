// LAW-0021 — Anexo incorporado · story. Contract battery + ID-specific checks.
// Acceptance (brief): continuity of motion, object anchoring, and the
// transformation must be recognisable with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0021', {
  continuity: ['annexCenter', 'handA', 'handB', 'penTip', 'stampTool'],
  attach: [
    // B's solved hand IS the annex grip while sliding it out and carrying it
    {from: 0.212, to: 0.379, a: 'handB', b: 'annexGrip', tol: 1.5},
    // the pen / seal are always positioned from A's solved hand when held
    {from: 0, to: 1, a: 'handA', b: 'heldGrip', tol: 1.5},
    // while writing and linking, the pen tip is the moving end of the ink
    {from: 0.476, to: 0.604, a: 'penTip', b: 'inkTip', tol: 1.5},
    // the seal touches its spot at the press
    {from: 0.72, to: 0.73, a: 'stampTool', b: 'stampSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.annexHolder === 'folder' && !s.penHeld && s.writeProgress === 0 && !s.sealApplied && s.highlight === 0", label: 'starts at rest: annex in the folder, pen on the desk, nothing written'},
    {at: 0.14, fn: "s.annexHolder === 'folder' && s.beat === 'rest'", label: 'rest beat stays still (annex still in the pocket)'},
    {at: 0.3, fn: "s.annexHolder === 'B-carrying' && s.annexLift > 0.5 && s.writeProgress === 0", label: 'B carries the lifted annex toward the contract'},
    {at: 0.42, fn: "s.annexHolder === 'gliding' && s.highlight === 0", label: 'released annex glides the last stretch; clause not yet lit'},
    {at: 0.5, fn: "s.annexHolder === 'docked' && s.highlight > 0 && s.penTouching && s.writeProgress > 0 && s.linkProgress === 0", label: 'tab lands at the clause first, then the reference is written'},
    {at: 0.58, fn: "s.writeProgress === 1 && s.linkProgress > 0 && s.linkProgress < 1 && !s.sealApplied", label: 'link loop drawn after the reference, before the seal'},
    {at: 0.66, fn: "!s.penHeld && s.linkProgress === 1 && !s.sealApplied", label: 'pen laid down before the seal is taken'},
    {at: 1, fn: "s.annexHolder === 'docked' && s.linkProgress === 1 && s.sealAcrossSeam && Math.hypot(s.eyelet.x - s.linkEnd.x, s.eyelet.y - s.linkEnd.y) < 30 && s.beat === 'hold'", label: 'held final state: annex docked at the clause, link ends on the tab eyelet, joint seal across the seam'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.annexHolder === 'docked' && s.linkProgress === 1 && s.sealApplied", label: 'labels hidden: the same physical transformation happens'},
    {at: 1, params: {finalState: 'separate'}, fn: "s.annexHolder === 'separate' && s.linkProgress === 0 && s.writeProgress === 1 && s.sealApplied && !s.sealAcrossSeam && s.highlight === 0", label: 'separate state: annex laid apart, no link, seal on the annex alone'},
    {at: 1, params: {linkedClause: 2}, fn: "s.annexHolder === 'docked' && s.linkProgress === 1", label: 'another linked clause re-targets the dock'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.annexHolder === 'B-carrying' && s.actionCapped && s.writeProgress === 0", label: 'actionProgress freezes the action part-way'},
  ],
});
