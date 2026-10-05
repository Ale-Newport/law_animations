// LAW-0053 — Tratamiento de un caso · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchors, and a transformation
// that is recognisable with labels hidden (the harness renders textVisibility
// "none"; the binders still fly, turn, get pinned and are linked by tagged threads).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0053', {
  continuity: ['mag', 'res0', 'res1', 'res2', 'res3', 'tag0', 'tag1', 'tag2', 'tag3'],
  attach: [
    // each supplied label hangs from its binder (shelved, pulled, flying, pinned) until its thread starts
    {from: 0, to: 0.45, a: 'tag0', b: 'anchor0', tol: 1},
    {from: 0, to: 0.52, a: 'tag1', b: 'anchor1', tol: 1},
    {from: 0, to: 0.59, a: 'tag2', b: 'anchor2', tol: 1},
    // the magnifier rests exactly over each matching binder while it dwells
    {from: 0.28, to: 0.46, a: 'mag', b: 'magTarget', tol: 1},
  ],
  semantic: [
    {at: 0, fn: "s.states.every(x => x === 'shelf') && s.queryTyped === 0 && !s.magOut", label: 'rest: binders on the shelf, empty query, magnifier in its socket'},
    {at: 0.2, fn: "s.queryTyped > 0 && s.queryTyped < 1 && s.states.every(x => x === 'shelf')", label: 'the query is typed before anything moves'},
    {at: 0.3, fn: "s.magOut && s.states[0] !== 'shelf' && s.states[1] === 'shelf' && s.states[2] === 'shelf'", label: 'the magnifier finds the first binder first'},
    {at: 0.4, fn: "s.states[0] === 'flying' && s.linked === 0", label: 'a found binder flies to the card before any link exists'},
    {at: 0.5, fn: "s.threadP[0] > 0 && s.threadP[0] < 1 && s.states[0] === 'placed'", label: 'the thread is drawn only after the cover is pinned'},
    {at: 0.73, fn: 's.linked === 3', label: 'all resolutions linked by the end of the displacement beat'},
    {at: 1, fn: "s.linked === 3 && s.tagOnSpot0 && s.tagOnSpot1 && s.tagOnSpot2 && !s.magOut", label: 'hold: every supplied label hangs on its thread; magnifier back in the bar'},
    {at: 1, fn: 'Math.max(...s.slotRadius) - Math.min(...s.slotRadius) < 1', label: 'no invented hierarchy: every resolution sits at the same distance from the decision'},
    {at: 1, fn: 'new Set(s.tagTextSizes.filter(x => x !== null)).size === 1', label: 'no invented hierarchy: every supplied label prints at one shared text size'},
    {at: 1, fn: 's.stateChipClear', label: 'the final-state chip is clear of the decision (and its pin), the covers, the tags, the threads and the notes'},
    {at: 0.45, fn: 's.flightsClear', label: 'no flying binder passes over a cover pinned before it, the card heading or the decision'},
    {at: 0.4, fn: 's.tagEdgeGap < 0.5', label: 'while a cover turns, its tag hangs on the cover\'s current edge (never detached beside it)'},
    {at: 0.47, fn: 's.tagEdgeGap < 0.5', label: 'the next turning cover keeps its tag on its edge too'},
    {at: 1, params: {finalState: 'placed'}, fn: "s.states.every(x => x === 'placed') && s.threadP.every(p => p === 0)", label: 'placed state: covers pinned, no link drawn'},
    {at: 1, params: {finalState: 'found'}, fn: "s.states.every(x => x === 'found')", label: 'found state: binders only highlighted in the library'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.linked === 0 && s.actionCapped', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sources: [{citation: 'R-21', date: 'Year 2', label: 'Cites'}, {citation: 'R-33', date: 'Year 3', label: ''}, {citation: 'R-47', date: 'Year 5', label: 'Distinguishes'}]}, fn: "s.states[1] === 'placed' && s.linked === 2 && s.tag1 === undefined", label: 'a resolution without a supplied label is placed but never linked'},
  ],
});
