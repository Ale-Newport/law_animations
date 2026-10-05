// LAW-0011 — Apertura de expediente · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes, and no
// legal consequence is invented to complete the contrast (no stamp, no verdict).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0011', {
  continuity: ['handLA', 'handRA', 'handLB', 'handRB', 'indexA', 'indexB', 'penA', 'penB', 'sheetB'],
  attach: [
    {from: 0.432, to: 0.498, a: 'handLA', b: 'coverGripA', tol: 1.5},
    {from: 0.542, to: 0.638, a: 'handRA', b: 'indexGripA', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: 's.sameBase && s.presentB === 1 && s.ghostB === 0', label: 'at t=0 B still holds the changed document (same tab as A), no dashed outline'},
    {at: 0.1, fn: 's.a.cover === 0 && s.b.cover === 0 && s.a.spread === 0 && s.b.spread === 0 && s.ghostB === 0 && s.sameBase', label: 'identical closed base situation'},
    {at: 0.165, fn: 's.sameBase && s.presentB === 1', label: 'the difference is not shown before the change beat'},
    {at: 0.26, fn: 's.presentB < 1 && s.exitB > 0.3 && s.sheetB.opacity > 0.5 && s.ghostB === 0', label: 'change beat: B\'s document visibly leaves the folder before its outline appears'},
    {at: 0.32, fn: 's.ghostB > 0 && s.sheetB.opacity === 0 && s.a.cover === 0 && s.b.cover === 0', label: 'the change is complete (dashed tab in B) before any action'},
    {at: 0.6, fn: 's.a.cover === s.b.cover && s.a.spread === s.b.spread && JSON.stringify(s.a.index) === JSON.stringify(s.b.index) && s.a.holder === s.b.holder', label: 'the opening runs identically in parallel'},
    {at: 1, fn: 's.a.ticks.every(t => t === 1) && s.b.ticks[2] === 0 && s.b.ticks.filter((t, i) => i !== 2).every(t => t === 1)', label: 'only the changed entry differs: unticked in B'},
    {at: 1, fn: 's.a.spread === 1 && s.b.spread === 1 && s.a.cover === s.b.cover && !s.a.stamp && !s.b.stamp && !s.a.penHeld && !s.b.penHeld', label: 'every other state matches and no stamp or outcome is added'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 1, fn: 's.arrangement === "row" && s.guideSpansGutter === true', label: 'side by side, the guide label sits in the gutter between the desks'},
    {at: 1, params: {changedIndex: 0}, fn: 's.changedIndex === 0 && s.b.ticks[0] === 0 && s.a.ticks[0] === 1', label: 'the changed fact follows the supplied index'},
  ],
});
