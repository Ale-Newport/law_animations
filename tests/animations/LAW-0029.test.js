// LAW-0029 — Cadena de versiones · story. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0029', {
  // Intentional overprint: while the clerk slides a copy across the desk, the
  // carried sheet (opaque paper, drawn above the loose pile) passes over the
  // pile copies' header texts. The heuristic sees text boxes, not occlusion;
  // the pairs always involve the carried sheet's document id/title lines.
  allowTextOverlap: ['Framework Agreement', 'FRAMEWORK-2026'],
  continuity: ['copy1', 'copy2', 'copy3', 'copy4', 'handA', 'handB1', 'handB2', 'penTip', 'tab'],
  attach: [
    // the clerk's hand holds each copy at its grip while carrying it (carryGrip is null between carries)
    {from: 0.15, to: 0.54, a: 'handA', b: 'carryGrip', tol: 1.5},
    // the reviewer's hand holds the tab from the pad to the attach point
    {from: 0.54, to: 0.63, a: 'handB1', b: 'tabGrip', tol: 1.5},
    // the pen is carried in the solved hand; its tip follows the tick stroke while writing
    {from: 0.655, to: 0.76, a: 'handB2', b: 'penGrip', tol: 1.5},
    {from: 0.685, to: 0.725, a: 'penTip', b: 'tickPoint', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.holders.every(h => h === 'pile') && !s.tabAttached && s.tickProgress === 0 && !s.penHeld", label: 'starts with every copy loose in the pile, no tab, pen lying on the desk'},
    {at: 0.2, fn: "s.carrying === 'v1' && s.holders[1] === 'pile'", label: 'the oldest copy is carried first'},
    {at: 0.4, fn: "JSON.stringify(s.chainOrder) === JSON.stringify(['v1','v2']) && s.carrying === 'v3'", label: 'copies enter the chain in version order'},
    {at: 0.5, fn: "!s.tabAttached && s.tickProgress === 0 && s.holders.includes('carried')", label: 'the tab is not attached before the chain is complete'},
    {at: 0.58, fn: "s.holders.every(h => h === 'chain') && s.tabHeld && !s.tabAttached", label: 'the chain is complete while the tab is still carried'},
    {at: 0.705, fn: "s.tabAttached && s.penHeld && s.tickProgress > 0 && s.tickProgress < 1", label: 'the tick is written only after the tab is pressed on'},
    {at: 1, fn: "JSON.stringify(s.chainOrder) === JSON.stringify(['v1','v2','v3','v4']) && s.tabAttached && s.tickProgress === 1 && !s.penHeld && s.selected === 'v4'", label: 'ends with the ordered chain, the tab on the selected copy and the pen put down'},
    {at: 1, params: {selectedVersion: 'v2'}, fn: "s.selected === 'v2' && s.tabAttached", label: 'the tab follows the supplied selected version'},
    {at: 1, params: {finalState: 'ordered-only'}, fn: "s.holders.every(h => h === 'chain') && !s.tabAttached && s.tickProgress === 0", label: 'ordered-only: chain complete, no tab applied'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.holders.includes('pile') && !s.tabAttached", label: 'actionProgress freezes the ordering part-way'},
    {at: 1, params: {versions: [{id: 'A'}, {id: 'B'}, {id: 'C'}], selectedVersion: 'B'}, fn: "JSON.stringify(s.chainOrder) === JSON.stringify(['A','B','C']) && s.selected === 'B'", label: 'three supplied versions are ordered and B is tabbed'},
  ],
});
