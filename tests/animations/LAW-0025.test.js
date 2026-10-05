// LAW-0025 — Traducción paralela · story. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: continuous motion, anchored props
// (pen tip = end of the ink while drawing; stamp = reviewer's solved hand) and
// a transformation that still reads with labels hidden.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0025', {
  continuity: ['penTip', 'handPen', 'stampTool'],
  attach: [
    // while a guide or the term mark is being drawn, the pen tip (from the
    // solved hand) is the end of the ink stroke (strokeEnd exists only then)
    {from: 0.15, to: 0.66, a: 'penTip', b: 'strokeEnd', tol: 1.5},
    // the hand holds the pen at its grip on every frame (IK reached)
    {from: 0, to: 1, a: 'handPen', b: 'penGrip', tol: 1.5},
    // the stamp touches its spot while pressed (stampSpot exists only then)
    {from: 0.62, to: 0.8, a: 'stampTool', b: 'stampSpot', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.links.every(v => v === 0) && !s.stampApplied && s.underline === 0", label: 'rest: pages unlinked, nothing marked or stamped'},
    {at: 0.3, fn: 's.links[0] > 0 && s.links[s.links.length - 1] === 0', label: 'guides are drawn one pair at a time, in reading order'},
    {at: 0.45, fn: 's.links[0] === 1 && s.linked >= 2', label: 'first guides complete during the action beats'},
    {at: 0.5, fn: 's.underline === 0 || s.linked === s.pairs', label: 'the term is marked only after every guide is drawn (cause before effect)'},
    {at: 0.71, fn: 's.stampPressed && s.linked === s.pairs', label: 'the reviewer presses the stamp after the guides are complete'},
    {at: 1, fn: "s.linked === s.pairs && s.underline === 1 && s.question === 0 && s.stampApplied && s.termSlot === 'available'", label: 'aligned: every pair linked, equivalent underlined, stamp applied'},
    {at: 1, params: {finalState: 'term-unconfirmed'}, fn: "s.linked === s.pairs && s.question === 1 && s.underline === 0 && s.termSlot === 'unconfirmed'", label: 'term-unconfirmed: guides drawn, the term keeps a question mark instead'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.linked < s.pairs && !s.stampApplied', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.linked === s.pairs && s.stampApplied', label: 'the action completes identically with labels hidden'},
    {at: 0.3, params: {clauses: ['Uno.', 'Dos.', 'Tres.', 'Cuatro.'], translations: ['One.', 'Two.', 'Three.', 'Four.']}, fn: 's.pairs === 4 && s.links.length === 4', label: 'one guide per supplied segment pair'},
  ],
});
