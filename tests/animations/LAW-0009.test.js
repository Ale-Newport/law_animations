// LAW-0009 — Apertura de expediente · story. Contract battery + ID-specific checks.
// acceptanceCheck: motion continuity, object anchoring, and the transformation
// must be recognisable with labels hidden (the contract battery checks that no
// text is visible with textVisibility 'none'; these semantics check the action).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0009', {
  continuity: ['handL', 'handR', 'coverGrip', 'indexCenter', 'topDocCenter', 'penTip', 'stampTool'],
  attach: [
    // left hand holds the cover's free edge while lifting it
    {from: 0.172, to: 0.298, a: 'handL', b: 'coverGrip', tol: 1.5},
    // right hand holds the index sheet while drawing it out
    {from: 0.372, to: 0.528, a: 'handR', b: 'indexGrip', tol: 1.5},
    // the pen is carried by the solved left hand while held (picked up, ticking, laid down)
    {from: 0.46, to: 0.718, a: 'penGrip', b: 'handL', tol: 1.5},
    // the stamp sits on its spot while pressed
    {from: 0.711, to: 0.736, a: 'stampTool', b: 'stampSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.coverAngle === 0 && s.holder === 'folder' && s.spread === 0 && s.ticks.every(t => t === 0) && !s.penHeld", label: 'starts closed, at rest, nothing ticked'},
    {at: 0.25, fn: "s.coverAngle > 10 && s.coverAngle < 108 && s.holder === 'cover-in-left-hand'", label: 'the left hand lifts the cover over the hinge'},
    {at: 0.365, fn: 's.coverAngle > 150 && s.spread === 0', label: 'the cover is open before any layer moves (cause precedes effect)'},
    {at: 0.45, fn: "s.coverOpen && s.spread > 0 && s.spread < 1 && s.holder === 'right-hand'", label: 'the index is drawn out and the layers follow'},
    {at: 0.62, fn: 's.penHeld && s.ticks[0] > 0 && s.spread === 1', label: 'ticking starts only once the layers are laid out'},
    {at: 0.7, fn: "s.ticks.every(t => t === 1) && !s.stampPressed", label: 'the stamp is pressed only after the last tick (forearms do not converge)'},
    {at: 0.72, fn: 's.stampPressed && s.ticks.every(t => t === 1)', label: 'the stamp lands once the index is ticked'},
    {at: 1, fn: "s.coverOpen && s.spread === 1 && s.holder === 'laid-out' && s.ticks.every(t => t === 1) && s.stampApplied && !s.penHeld", label: 'ends opened, laid out, ticked and stamped with the pen put down'},
    {at: 1, params: {absentDocument: 2}, fn: 's.ticks[2] === 0 && s.ticks.filter((t, i) => i !== 2).every(t => t === 1) && s.absentDocument === 2', label: 'an absent document is passed over, never ticked'},
    {at: 1, params: {finalState: 'opened'}, fn: '!s.stampApplied && s.spread === 1', label: 'supplied final state without stamp'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.spread < 1 && s.actionCapped', label: 'actionProgress freezes the action part-way'},
  ],
});
