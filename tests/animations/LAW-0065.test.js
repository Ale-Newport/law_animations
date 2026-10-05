// LAW-0065 — Extracción de hechos · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion (flags, strips, pointer never teleport),
// anchored objects (a carried copy strip's grip IS its flag's stick point from the
// peel to the card) and a transformation that reads with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0065', {
  continuity: ['flag0', 'flag1', 'flag2', 'strip0', 'strip1', 'strip2', 'pointer'],
  attach: [
    // from the peel onward each copy strip travels glued to its flag (grip = stick point)
    {from: 0.43, to: 1, a: 'flag0', b: 'strip0', tol: 0.5},
    {from: 0.475, to: 1, a: 'flag1', b: 'strip1', tol: 0.5},
    {from: 0.52, to: 1, a: 'flag2', b: 'strip2', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.holders.every(h => h === 'search') && [s.strip0, s.strip1, s.strip2].every(x => x === null) && s.marks.every(m => m[0] === 0) && !s.launched", label: 'rest: every flag parked on its request row, page unmarked, card empty'},
    {at: 0.205, fn: 's.pressed && s.holders.every(h => h === "search")', label: 'the user presses Extract before any flag leaves'},
    {at: 0.26, fn: "s.launched && s.holders[0] === 'flying' && s.holders[2] === 'search'", label: 'flags leave one after another (cause precedes effect)'},
    {at: 0.425, fn: "s.holders.every(h => h === 'page') && s.marks.every(m => m[0] === 1) && [s.strip0, s.strip1, s.strip2].every(x => x === null)", label: 'all indicated sentences flagged and highlighted before anything is pulled'},
    {at: 0.5, fn: "s.holders[0] === 'carrying' && s.strip0 && Math.hypot(s.strip0.x - s.flag0.x, s.strip0.y - s.flag0.y) < 0.5", label: 'a copy strip is pulled off the page glued to its flag'},
    {at: 0.72, fn: "s.docked.every(Boolean) && s.holders.every(h => h === 'card')", label: 'every copy lands on its slot of the fact card'},
    {at: 1, fn: "s.finalState === 'filed' && JSON.stringify(s.pinpoints) === JSON.stringify([3, 2, 4]) && s.marks.every(m => m[0] === 1) && s.allReached", label: 'final: copies filed with the supplied pinpoints; the page keeps its highlights'},
    {at: 1, params: {finalState: 'flagged'}, fn: "s.holders.every(h => h === 'page') && [s.strip0, s.strip1, s.strip2].every(x => x === null) && !s.docked.some(Boolean)", label: 'flagged state: marked on the page, nothing pulled'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && !s.docked.some(Boolean)', label: 'actionProgress freezes the action part-way'},
    {at: 0.5, fn: 's.copiesInFlight <= 1', label: 'copies are carried one at a time (never two strips in the air)'},
    {at: 0.58, fn: 's.copiesInFlight <= 1 && s.copiesShown.some(x => x === 0)', label: 'a carried copy travels rolled up (it never lies over the page text or the card header)'},
    {at: 0.66, fn: 's.copiesInFlight <= 1', label: 'the next copy only leaves once the previous one has landed'},
    {at: 1, fn: 's.copiesShown.every(x => x === 1) && s.fit.size >= 25', label: 'every copy lies flat in its slot; the page text keeps ≥ 20 px (16:9)'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.holders[0] === 'card' && s.strip0 !== null", label: 'the same physical action runs with labels hidden'},
    {at: 1, params: {query: {facts: [{label: 'When the invoice was issued', sentence: 5}], placeholder: 'Facts…'}}, fn: "JSON.stringify(s.pinpoints) === JSON.stringify([5]) && s.docked[0]", label: 'the supplied sentence decides where the flag goes'},
  ],
});
