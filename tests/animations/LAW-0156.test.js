// LAW-0156 — Interpretaciones concurrentes · inspect. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: the detail keeps its source coordinates, the change is
// localized (only the inspected band), and seeking back restores the old datum exactly.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

contractSuite('LAW-0156', {
  continuity: ['hand', 'mag'],
  attach: [
    // the magnifier rides the hand from pick-up until it is laid down again
    {from: 0.191, to: 0.814, a: 'hand', b: 'magGrip', tol: 1.5},
  ],
  // the detail window shows a real enlarged copy (text marked with a zero-width space) over the desk
  allowTextOverlap: ['​'],
  semantic: [
    {at: 0.19, fn: "s.lensOpen === 0 && s.datum === 'before' && s.fade === 0 && s.magAtRest", label: 'build: the state produced by the action is shown before any zoom'},
    {at: 0.3, fn: 's.magAtSource && s.lensOpen === 0', label: 'the hand brings the magnifier onto the highlighted words before the window opens'},
    {at: 0.44, fn: "s.lensOpen === 1 && s.magnification > 1.5 && s.lensMapsSource && s.datum === 'before' && s.swap === 0", label: 'isolate: an enlarged copy anchored on the source, before anything changes'},
    {at: 0.7, fn: "s.datum === 'after' && s.swap === 1 && s.fade === 1 && s.lensOpen === 1 && s.bandsDiffer", label: 'substitute: only the inspected band changes; the old one stays as an outline'},
    {at: 0.4, fn: "s.datum === 'before' && s.swap === 0 && s.fade === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, fn: "s.lensOpen === 0 && s.markerShown && s.noteShown && s.datum === 'after' && s.magAtRest && s.allReached", label: 'return: full context, changed-datum marker and note, magnifier laid down'},
    {at: 0.6, params: {focusTarget: 'readingA-focus', beforeValue: 'the minutes kept by the secretary', afterValue: 'the minutes'}, fn: "s.focusTarget === 'readingA-focus' && s.spansFound[0] && s.spansFound[1] && s.lensMapsSource && s.lensOpen === 1", label: 'reading A can be inspected with the same guarantees'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: 's.swap === 1 && s.lensOpen === 1', label: 'the substitution plays with labels hidden'},
  ],
});

ratioChecks('LAW-0156', 'layout fits; parked magnifier and notes clear', [
  {at: [0, 1], fn: 's.fits && s.magClear && s.notesClear && s.leadClear', label: 'every block inside the desk; magnifier and notes clear of objects; change leader crosses no other object'},
  // review fixes: the old value stays traceable everywhere (the note always reads "old → new")
  {at: [1], fn: 's.noteKeepsBoth', label: 'the change note names both the old and the new value in every ratio and preset'},
  // the Δ marker never covers a pull tab
  {at: [1], fn: 's.markerOffTabs', label: 'the changed-datum marker is clear of both overlay tabs'},
  // the return is spread: complete by ~0.9, and the withdrawing arm never lies over the marker or the note while they show
  {at: [0.8, 0.83, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.95, 1], fn: 's.armClearOfNote', label: 'the arm is clear of the marker and the change note whenever they are visible'},
  {at: [1], fn: 's.lastMotionEnd <= 0.91', label: 'everything is still by u 0.91 (hold of ~720 ms)'},
]);

suppliedTextSuite('LAW-0156', {
  fields: `const src = i => p.sources[Math.min(p.sources.length - 1, p.interpretations[i].source)].title;
    return [p.passages.ref, p.passages.text, ...p.interpretations.flatMap(x => [x.label, x.text, x.focus]), src(0), src(1),
      p.sources[0].title, ...p.sources.map(s => s.id), ...p.hierarchy.levels, p.hierarchy.caption,
      p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]`,
  captions: `return p.locale === 'es' ? ['Propuesta (según lo aportado)', 'Jerarquía editable'] : ['Proposed (as supplied)', 'Editable hierarchy']`,
});
