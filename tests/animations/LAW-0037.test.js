// LAW-0037 — Custodia del original · story. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0037', {
  continuity: ['originalCenter', 'copyCenter', 'handA1', 'handA2', 'handB1', 'handB2', 'penTip', 'stampTool', 'lidEdge'],
  attach: [
    // A's right hand pushes the copy, then carries the original; B's hand pulls the copy;
    // A's left hand holds the lid's free edge while folding it; the pen tip is the end of
    // the ink while it touches the copy; the stamp touches the seal spot while pressed.
    {from: 0.152, to: 0.228, a: 'handA2', b: 'gripCopyA2', tol: 1.5},
    {from: 0.282, to: 0.398, a: 'handA2', b: 'gripOrigA2', tol: 1.5},
    {from: 0.332, to: 0.428, a: 'handB1', b: 'gripCopyB1', tol: 1.5},
    {from: 0.482, to: 0.578, a: 'handA1', b: 'lidEdge', tol: 1.5},
    {from: 0.512, to: 0.678, a: 'penTip', b: 'noteTip', tol: 1.5},
    {from: 0.66, to: 0.705, a: 'stampTool', b: 'stampSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.originalHolder === 'desk' && s.copyHolder === 'desk' && s.lidFold < 0 && !s.stampApplied && s.notesProgress === 0", label: 'rest: both sheets on the desk, box open, nothing written'},
    {at: 0.3, fn: "s.originalHolder === 'A-carrying' && (s.copyHolder === 'gliding' || s.copyHolder === 'B-pulling')", label: 'the original moves toward the box WHILE the copy circulates'},
    {at: 0.45, fn: "(s.originalHolder === 'sinking' || s.originalHolder === 'box') && s.originalScale < 1 && s.copyHolder === 'B'", label: 'the original sinks inside the box walls; the copy is with the reader'},
    {at: 0.55, fn: "s.originalHolder === 'box' && s.lidFold > -0.24 && !s.lidClosed && s.notesProgress > 0 && s.notesProgress < 1", label: 'lid folding over while the reader writes on the copy'},
    {at: 0.62, fn: 's.lidClosed && !s.stampApplied', label: 'lid closed before the seal is stamped (cause before effect)'},
    {at: 1, fn: "s.originalHolder === 'box' && s.lidClosed && s.stampApplied && s.copyHolder === 'B' && s.notesProgress === 1 && s.allReached", label: 'hold: original sealed in the box, annotated copy with the reader'},
    {at: 1, params: {finalState: 'open'}, fn: "s.originalHolder === 'box' && !s.lidClosed && !s.stampApplied && s.copyHolder === 'B'", label: 'open state: original inside, lid left open, no seal'},
    {at: 1, params: {finalState: 'closed'}, fn: 's.lidClosed && !s.stampApplied', label: 'closed state: lid closed, no seal'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.originalHolder === 'A-carrying' && s.actionCapped", label: 'actionProgress freezes the action part-way'},
  ],
});
