// LAW-0091 — Distinción de casos · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (one cell of
// the new case), and no legal consequence is invented to complete the contrast
// (no winner, no outcome; the rule is never applied).
import {contractSuite} from '../harness/contract.js';

const IN_B = {facts: [
  {text: 'Lease signed for one year', icon: 'document', in: 'both'},
  {text: 'Rent paid every month', icon: 'calendar', in: 'both'},
  {text: 'Neighbour phoned in a complaint', icon: 'phone', in: 'b'},
  {text: 'Keys returned on day 30', icon: 'key', in: 'both'},
]};
const ALL_BOTH = {facts: [
  {text: 'Buyer signed the order form', icon: 'document', in: 'both'},
  {text: 'Goods delivered on day 3', icon: 'box', in: 'both'},
  {text: 'Price paid in cash', icon: 'coin', in: 'both'},
]};
const same = (a, b) => `JSON.stringify(s.${a}) === JSON.stringify(s.${b})`;

contractSuite('LAW-0091', {
  continuity: ['lensA', 'lensB', 'tokenA'],
  attach: [
    // A's extracted token rides in A's glass from the capture to the drop into the clip
    {from: 0.651, to: 0.719, a: 'tokenA', b: 'lensA', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: `s.differingCells === 0 && s.peel === 0 && ${same('lensLocalA', 'lensLocalB')} && s.links.every(v => v === 0)`, label: 'base: two identical complete scenes (the changed cell is still covered on both boards)'},
    {at: 0.16, fn: "s.cellsA.every(c => c !== 'new-only') && s.cellsA.filter(c => c === 'covered').length === 1", label: 'base: nothing but the covered cell is undecided'},
    {at: 0.38, fn: "s.peel === 1 && s.differingCells === 1 && s.cellsA[2] === 'earlier-only' && s.cellsB[2] === 'both' && s.links.every(v => v === 0) && s.holderA === 'card'", label: 'change beat: exactly one cell differs (A: not recorded in the new case, B: recorded), before anything moves'},
    {at: 0.38, fn: `${same('cellsA.slice(0,2)', 'cellsB.slice(0,2)')} && s.cellsA[3] === s.cellsB[3]`, label: 'every other fact stays identical in both scenes'},
    {at: 0.5, fn: same('lensLocalA', 'lensLocalB'), label: 'parallel: both magnifiers move in lockstep while they compare'},
    {at: 0.595, fn: "s.links.every(v => v === 1) && s.linkKindA[2] === 'broken' && s.linkKindB[2] === 'closed' && s.linkKindA.filter(k => k === 'broken').length === 1 && s.linkKindB.every(k => k === 'closed')", label: 'the changed column breaks the link in A only; B links every column'},
    {at: 0.68, fn: "s.holderA === 'lens' && Math.hypot(s.tokenA.x - s.lensA.x, s.tokenA.y - s.lensA.y) <= 1.5 && s.holderB === 'none' && s.clipB === 'empty'", label: 'A lifts the unmatched fact in the glass; B has nothing to lift'},
    {at: 1, fn: "s.clipA === 'holds-fact' && s.clipClosedA === 1 && s.clipB === 'empty' && s.guide === 1 && s.tagsShown", label: 'hold: A clip holds the fact, B clip stays empty, guide and state tags shown'},
    {at: 1, fn: `${same('lensLocalA', 'lensLocalB')}`, label: 'hold: both magnifiers rest over the changed column'},
    {at: 1, fn: 's.outcome === null && s.winner === null', label: 'no outcome, winner or score is produced'},
    {at: 0.7, fn: 's.guide === 0', label: 'the comparison guide is not drawn before the closing beat'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.clipA === 'holds-fact' && s.clipB === 'empty' && s.differingCells === 1 && s.guide === 1", label: 'the same contrast completes with labels hidden'},
    {at: 0.38, params: IN_B, fn: "s.changedRow === 2 && s.cellsA[2] === 'new-only' && s.cellsB[2] === 'both' && s.differingCells === 1", label: 'the changed cell follows the supplied data (fact recorded only in the new case)'},
    {at: 0.68, params: IN_B, fn: "s.holderA === 'lens'", label: 'a fact present only in the new case is lifted from the new strip'},
    {at: 1, params: ALL_BOTH, fn: "s.changedRow === -1 && s.differingCells === 0 && s.clipA === 'empty' && s.clipB === 'empty'", label: 'no distinguishing fact supplied: both boards stay identical and nothing is extracted'},
  ],
});
