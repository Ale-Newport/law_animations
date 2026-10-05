// LAW-0125 — Definición legislativa · story. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0125', {
  continuity: ['lens', 'handL', 'handR', 'pinA', 'pinB', 'coverEdge'],
  attach: [
    // the lens rides the left hand from taking it until it is parked again
    {from: 0.126, to: 0.4, a: 'handL', b: 'lensGrip', tol: 1.5},
    // pin B rides the left hand while it is carried to the definition
    {from: 0.536, to: 0.664, a: 'handL', b: 'pinB', tol: 1.5},
    // the right hand rides the cover's free edge while it swings (until it lets it fall)
    {from: 0.281, to: 0.35, a: 'handR', b: 'edgeGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.bookOpen === 0 && s.termMark === 0 && !s.linked && s.lensHolder === 'desk' && s.pinHolder === 'desk'", label: 'rest: book closed, term unmarked, lens and pins on the desk'},
    {at: 0.25, fn: "s.lensHolder === 'hand' && s.termCovered && s.bookOpen === 0", label: 'the lens covers the term before the book opens'},
    {at: 0.315, fn: "s.termMark === 1 && s.bookOpen < 0.5 && s.entryHl === 0", label: 'the term is marked before the definitions page is revealed'},
    {at: 0.45, fn: "s.bookOpen === 1 && s.lensHolder === 'desk' && !s.pinAPlaced && s.entryHl === 0", label: 'book open at the definitions section; lens parked; no link yet'},
    {at: 0.6, fn: "s.pinAPlaced && s.pinHolder === 'hand' && !s.linked && s.entryHl === 0", label: 'pin A is in at the term while pin B is still carried (entry not yet lit)'},
    {at: 1, fn: "s.linked && s.entryHl === 1 && s.bookOpen === 1 && s.termMark === 1 && s.allReached", label: 'ends with the cord from the term to the supplied definition'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.linked && s.entryHl === 1 && s.bookOpen === 1", label: 'the transformation completes identically with labels hidden'},
    {at: 1, params: {finalState: 'definition-located'}, fn: "!s.linked && !s.pinAPlaced && s.bookOpen === 1 && s.entryHl === 0", label: 'supplied final state definition-located: opened, not linked'},
    {at: 1, params: {finalState: 'term-marked'}, fn: "!s.linked && s.bookOpen === 0 && s.termMark === 1", label: 'supplied final state term-marked: book stays closed'},
    {at: 1, params: {entryRow: 3, hierarchy: ['L1', 'L2', 'L3', 'L4'], passages: [{ref: 'A', heading: 'H', text: 'uses x', term: 'x', level: 1}, {ref: 'B', heading: 'D', text: 'means y', term: 'x', level: 4}]}, fn: "s.linked && s.allReached", label: 'a definition at the last of four levels, third row, is reached and linked'},
    {at: 1, params: {actionProgress: 0.35}, fn: "s.actionCapped && s.termMark === 1 && !s.linked", label: 'actionProgress freezes the action part-way (term marked, no link)'},
  ],
});
