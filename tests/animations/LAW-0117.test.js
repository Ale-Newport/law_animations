// LAW-0117 — Límite de una conclusión · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion (hands, spool, cord head, magnifier), object anchoring
// (the spool rides the laying hand, the magnifier rides the other hand while carried) and a
// transformation that stays recognizable with the labels hidden (the closed cord, pennants inside,
// dashed rings outside).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

// safe areas that turn the 16:9 test frame into the 1:1 / 9:16 content boxes (same content ratios)
const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0117').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
// AUTHORING item 12 (review round 1): after examining the cord the magnifier is PARKED in free space — never on the cord,
// a card, the note, the name card or the plaque (glass and handle) — and both hands have left the table
const parked = variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({
  at: 1, params: {...params, ...sa}, fn: 's.parkFree && s.lupaParked && s.lupaReleased && !s.lensOverCord && !s.lensOverCard && !s.handleOverCard && !s.lensOverNote && s.handsOffTable',
  label: `hold: the magnifier is parked in free space (off the cord, cards, note, plaque); hands have left the table (${name}, ${shape})`,
})));
// review round 1: pennants never cover another card or its tag
const flags = variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({
  at: 1, params: {...params, ...sa}, fn: 's.flagsClear', label: `pennants stay clear of every other card and tag (${name}, ${shape})`,
})));
// review round 1: the arms never cross the note, at any moment of the action, and keep a natural reach
const arms = [['default', {}], ...presetsFor('LAW-0117').map(pr => [pr.name, pr.params])].flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) =>
  [0.05, 0.12, 0.2, 0.3, 0.4, 0.5, 0.58, 0.62, 0.66, 0.7, 0.74, 0.8].map(at => ({
    at, params: {...params, ...sa}, fn: '!s.armsOverNote && !s.armsOverPlaque && s.armReach.L < 0.6 * s.armReach.desk && s.armReach.R < 0.6 * s.armReach.desk',
    label: `arms never cross the note or the plaque and keep a natural reach (${name}, ${shape}, t=${at})`,
  }))));
// the cord keeps its distance from every card (inside and outside) and encloses exactly the covered ones
const geometry = variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({
  at: 1, params: {...params, ...sa}, fn: 's.cordClearOfOutside && s.cordClearOfCovered && JSON.stringify(s.insideLoop) === JSON.stringify(s.scopes.map(x => x === "included"))',
  label: `the loop encloses exactly the cards supplied as covered, clear of every card (${name}, ${shape})`,
})));

contractSuite('LAW-0117', {
  continuity: ['handL', 'handR', 'spool', 'lupa', 'lupaGrip'],
  attach: [
    // the spool rides the laying hand and the cord leaves from it for the whole lay
    {from: 0.152, to: 0.618, a: 'handL', b: 'spool', tol: 1},
    {from: 0.152, to: 0.618, a: 'cordHead', b: 'spool', tol: 1},
    // the magnifier is held by the right hand from the pick-up to the set-down
    {from: 0.556, to: 0.729, a: 'handR', b: 'lupaGrip', tol: 1},
  ],
  semantic: [
    {at: 0, fn: 's.laid === 0 && !s.markersShown && s.lupaAtRest && !s.spoolHeld && !s.knotShown', label: 'rest: nothing laid, no marker, magnifier and spool at rest'},
    {at: 0.14, fn: 's.laid === 0 && !s.markersShown', label: 'the cord does not move before the hand holds the spool'},
    {at: 0.3, fn: 's.spoolHeld && s.laid > 0.1 && s.laid < 0.9 && !s.markersShown', label: 'action: the hand lays the cord part of the way; no marker yet'},
    {at: 0.6, fn: 's.laid > 0.9 && s.laid < 1 && !s.markersShown && !s.knotShown', label: 'the loop is not closed yet and nothing is marked'},
    ...[0.62, 0.64, 0.645, 0.65, 0.66, 0.7].map(at => ({at, fn: '!s.markersBeforeClose', label: `cause precedes effect: no pennant or ring before the knot is tied @${at}`})),
    {at: 0.745, fn: 's.closed && s.flags.every(v => v === 1) && s.rings.some(v => v > 0)', label: 'complete: knot tied, then pennants inside and rings outside'},
    {at: 1, fn: "s.closed && s.flags.every(v => v === 1) && s.rings.every(v => v === 1) && s.flags.length === 2 && s.rings.length === 2 && s.finalState === 'outline-closed'", label: 'hold: two covered situations with pennants, two not examined with dashed rings (as supplied)'},
    {at: 1, fn: 's.notesVisible && s.stateVisible && s.noteRows.includes("issue") && s.noteRows.includes("assumed") && s.noteRows.includes("state")', label: 'hold: the supplied issue and assumption and the state key are on the note'},
    {at: 1, params: {finalState: 'outline-left-open'}, fn: "!s.closed && !s.knotShown && !s.markersShown && !s.spoolHeld && s.laid > 0.8 && s.laid < 0.95 && s.finalState === 'outline-left-open'", label: 'left open (as supplied): the spool is set down at the gap; no knot and no markers'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && Math.abs(s.laid - 0.4) < 0.001 && !s.markersShown && !s.closed', label: 'actionProgress freezes the cord part-way (no markers)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.closed && s.flags.every(v => v === 1) && s.rings.every(v => v === 1) && s.lupaAtHold', label: 'labels hidden: the same cord, pennants and rings'},
    {at: 1, params: {facts: [{text: 'a', scope: 'not-examined'}, {text: 'b', scope: 'included'}, {text: 'c', scope: 'included'}, {text: 'd', scope: 'included'}, {text: 'e', scope: 'not-examined'}]}, fn: 's.flags.length === 3 && s.rings.length === 2 && JSON.stringify(s.insideLoop) === JSON.stringify([false, true, true, true, false])', label: 'other supplied scopes: the loop takes in exactly the three covered cards'},
    {at: 1, params: {facts: [{text: 'a', scope: 'not-examined'}, {text: 'b', scope: 'not-examined'}]}, fn: 's.flags.length === 0 && s.rings.every(v => v === 1) && s.insideLoop.every(v => !v)', label: 'nothing supplied as covered: the cord outlines no card; both stay not examined'},
    {at: 0.638, fn: 's.lupaOnCordWhileHeld && s.lift > 0.9', label: 'the magnifier is held over the cord in the corridor (its glass shows the cord) before it is parked'},
    ...parked,
    ...flags,
    ...arms,
    ...geometry,
  ],
});

suppliedTextSuite('LAW-0117', {
  fields: 'return [...p.facts.map(f => f.text), p.rules.title, p.rules.proposition, ...p.issues, ...p.assumptions, p.actorLabels.a, p.reviewer.name, p.objectLabels.proposition, p.objectLabels.outline, p.objectLabels.situation, ...p.annotations.map(a => a.text)];',
  content: 'return [...p.facts.map(f => f.text), p.rules.proposition, ...p.issues, ...p.assumptions];',
  stressMin: 16,
  captions: 'return [p.actorLabels.a, p.objectLabels.outline, p.objectLabels.situation, ...p.annotations.map(a => a.text)];',
});
