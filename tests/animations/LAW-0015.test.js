// LAW-0015 — Redacción comparada · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (the
// wording of the incoming copy), and no legal consequence is invented.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0015', {
  continuity: ['penA', 'penB', 'incomingA', 'incomingB', 'stampA', 'stampB'],
  attach: [
    // both drafters carry their copy by the grip point while laying it down
    {from: 0.3, to: 0.439, a: 'handDrafterA', b: 'gripA', tol: 1.5},
    {from: 0.3, to: 0.439, a: 'handDrafterB', b: 'gripB', tol: 1.5},
    // both pens: the tip is the end of the ink stroke while drawing
    {from: 0.44, to: 0.73, a: 'penA', b: 'strokeEndA', tol: 1.5},
    {from: 0.44, to: 0.73, a: 'penB', b: 'strokeEndB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.wording === 'original' && s.b.wording === 'original' && JSON.stringify(s.incomingA) === JSON.stringify(s.incomingB) && !s.a.placed && !s.b.placed", label: 'base: two identical situations (both copies carry the original wording)'},
    {at: 0.26, fn: "s.a.wording === 'original' && s.b.wording === 'changing'", label: 'change beat: only B’s copy is being rewritten'},
    {at: 0.36, fn: "s.a.wording === 'original' && s.b.wording === 'revised' && JSON.stringify(s.incomingA) === JSON.stringify(s.incomingB)", label: 'after the change the two desks still move identically'},
    {at: 0.5, fn: 's.a.placed && s.b.placed && JSON.stringify(s.incomingA) === JSON.stringify(s.incomingB)', label: 'identical placement in parallel'},
    {at: 0.8, fn: 's.a.links === 0 && s.a.ticks === 3 && s.b.links === 3 && s.b.ticks === 1', label: 'same check, different marks: A ticks every row, B links its modified words'},
    {at: 0.8, fn: "s.a.marks.every(k => k === 'tick') && JSON.stringify(s.b.marks) === JSON.stringify(['link','link','tick','link'])", label: 'only the changed rows differ between the scenes'},
    {at: 1, fn: 's.a.stamp && s.b.stamp && s.guideProgress === 1', label: 'both stamped identically; the guide is fully drawn'},
    {at: 1, fn: "JSON.stringify(s.focusRows) === JSON.stringify([0,2]) && JSON.stringify(s.ringedRows) === JSON.stringify([[0,0],[2,2]]) && s.guideBranches.length === 2 && s.guideBranches.every(v => v === 1)", label: 'the guide rings and joins EVERY differing row (rows 1 and 3), not just the first'},
    {at: 1, fn: "s.guideLabel === 'Changed fact: wording of rows 1 and 3 of the incoming copy'", label: 'the guide label names every differing row (built from the edits)'},
    {at: 0.84, fn: 's.guideProgress > 0 && s.guideProgress < 1', label: 'the guide is still drawing on at 0.84 (no early reveal)'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.ticks === 3 && s.b.links === 3', label: 'the difference reads with labels hidden (marks, not text)'},
    {at: 1, params: {edits: [{clause: 1, from: 'shared', to: 'weekly'}]}, fn: "JSON.stringify(s.focusRows) === JSON.stringify([1]) && s.guideBranches.length === 0 && s.guideLabel === 'Changed fact: wording of row 2 of the incoming copy' && JSON.stringify(s.b.marks) === JSON.stringify(['tick','link','tick']) && s.a.ticks === 3", label: 'the guide follows the supplied changed row'},
    {at: 1, params: {edits: [{clause: 0, from: 'printed', to: 'digital'}, {clause: 1, from: 'shared', to: 'weekly'}, {clause: 2, from: 'letter', to: 'email'}]}, fn: "JSON.stringify(s.focusRows) === JSON.stringify([0,1,2]) && JSON.stringify(s.ringedRows) === JSON.stringify([[0,2]]) && s.guideLabel === 'Changed fact: wording of rows 1, 2 and 3 of the incoming copy'", label: 'adjacent differing rows share one ring; the label lists all of them'},
    {at: 1, params: {locale: 'es', comparisonLabels: {guide: 'Hecho cambiado: redacción de la copia entrante, {rows}', neutral: 'Sin resultado'}}, fn: "s.guideLabel === 'Hecho cambiado: redacción de la copia entrante, filas 1 y 3'", label: 'the {rows} token is filled in the built-in language'},
    {at: 1, params: {comparisonLabels: {guide: 'Changed fact: clause 1 and clause 3', neutral: 'No outcome is stated'}}, fn: "s.guideLabel === 'Changed fact: clause 1 and clause 3'", label: 'a guide label without the token is shown verbatim'},
  ],
});
