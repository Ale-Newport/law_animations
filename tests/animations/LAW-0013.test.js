// LAW-0013 — Redacción comparada · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchoring, and the
// transformation must be recognisable with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0013', {
  continuity: ['penTip', 'incomingCenter', 'handDrafter', 'handPen', 'stampTool'],
  attach: [
    // the drafter's solved hand carries the revised sheet by its grip point
    {from: 0.15, to: 0.319, a: 'handDrafter', b: 'gripIncoming', tol: 1.5},
    // while drawing, the pen tip IS the end of the ink stroke
    {from: 0.31, to: 0.72, a: 'penTip', b: 'strokeEnd', tol: 1.5},
    // the stamp sits on its spot across the gutter while pressed
    {from: 0.755, to: 0.775, a: 'stampTool', b: 'stampSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: '!s.incomingPlaced && s.drafterHolding && s.linksDrawn === 0 && s.marks.every(m => m.p === 0)', label: 'rest: revised sheet held by the drafter, nothing linked'},
    {at: 0.25, fn: '!s.incomingPlaced && s.drafterHolding && s.marks.every(m => m.p === 0)', label: 'the sheet is carried into place before any link is drawn'},
    {at: 0.36, fn: 's.incomingPlaced && !s.drafterHolding && s.incomingRotation === 0', label: 'versions aligned (sheet placed straight) before the drafter lets go'},
    {at: 0.5, fn: 's.marks.some(m => m.p > 0) && s.linksDrawn < s.marks.length && s.penHeld', label: 'the reviewer links the modified words with the held pen'},
    {at: 0.58, fn: 's.marks.every((m, i) => i === 0 || m.p === 0 || s.marks[i - 1].p === 1)', label: 'links are drawn one after another (no parallel strokes)'},
    {at: 0.82, fn: 's.linksDrawn === 3 && !s.penHeld && s.marks.every(m => m.kind === "link")', label: 'all three changes linked; pen laid down'},
    {at: 1, fn: "s.linksDrawn === 3 && s.stampApplied && s.finalState === 'compared' && s.incomingPlaced", label: 'final state: linked and stamped as compared'},
    {at: 1, params: {finalState: 'aligned'}, fn: 's.incomingPlaced && s.linksDrawn === 0 && !s.stampApplied', label: 'aligned state: versions side by side, no links, no stamp'},
    {at: 1, params: {finalState: 'linked'}, fn: 's.linksDrawn === 3 && !s.stampApplied', label: 'linked state: links without stamp'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.incomingPlaced && s.linksDrawn === 0', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.linksDrawn === 3 && s.stampApplied', label: 'with labels hidden the same links and stamp are drawn'},
    {at: 1, params: {edits: [{clause: 1, from: 'not in this clause', to: 'x'}, {clause: 2, from: 'letter', to: 'email'}]}, fn: 'JSON.stringify(s.unmatchedEdits) === "[0]" && s.linksDrawn === 1', label: 'an edit whose words are not in its clause is reported, not drawn'},
  ],
});
