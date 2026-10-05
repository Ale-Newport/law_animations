// LAW-0081 — Hecho y regla · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchoring (the hand rides the
// card's pull tab, the magnifier rides the other hand) and a transformation
// that stays recognizable with the labels hidden (the card docks and each bolt
// travels as its supplied status says).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0081', {
  continuity: ['card', 'handL', 'gripL', 'handR', 'lupa', 'lupaGrip', 'tip0', 'tip1', 'tip2'],
  attach: [
    // the analyst's hand holds the card's pull tab for the whole slide
    {from: 0.152, to: 0.428, a: 'handL', b: 'gripL', tol: 1},
    // the magnifier is held by the other hand from the pick-up to the end
    {from: 0.587, to: 0.704, a: 'handR', b: 'lupaGrip', tol: 1},
  ],
  semantic: [
    {at: 0, fn: "s.cardAngle === -7 && s.rowOffset > 10 && !s.docked && s.travel.every(v => v === 0)", label: 'rest: the card lies tilted and off-line, every bolt retracted'},
    {at: 0.14, fn: 's.slide === 0 && s.travel.every(v => v === 0)', label: 'nothing slides before the hand holds the tab'},
    {at: 0.3, fn: 's.handOnCard && !s.docked && s.slide > 0 && s.travel.every(v => v === 0)', label: 'action: the hand slides the card; bolts still retracted'},
    {at: 0.42, fn: 's.docked && s.rowOffset === 0 && s.cardAngle === 0 && s.align === 1 && s.travel.every(v => v === 0)', label: 'docked: attribute rows level with condition rows, bolts not yet moving'},
    {at: 0.5, fn: 's.travel[0] > 0 && !s.boltsMovedBeforeDock', label: 'bolts move only after docking (cause precedes effect)'},
    {at: 0.62, fn: 's.seated[0] && s.seated[1] && s.stoppedShort[2] && s.regGap[0] === 0 && s.regGap[1] === 0 && s.regGap[2] > 20', label: 'as-supplied bolts seat (registration closed); the disputed bolt stops short with a gap'},
    {at: 1, fn: "!s.lupaHeld && s.lupaLaidDown && s.lupaOverFocus && s.focusRow === 2 && JSON.stringify(s.statuses) === JSON.stringify(['as-supplied', 'as-supplied', 'disputed'])", label: "hold: the magnifier lies over the disputed joint, the hand has let go; statuses exactly as supplied"},
    {at: 1, params: {finalState: 'awaiting-alignment'}, fn: "s.docked && s.travel.every(v => v === 0) && s.statuses.every(x => x === 'pending')", label: 'awaiting-alignment: card docked, every bolt stays retracted'},
    {at: 1, params: {actionProgress: 0.3}, fn: '!s.docked && s.slide > 0 && s.slide < 1 && s.actionCapped', label: 'actionProgress freezes the slide part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: 's.docked && s.seated[0] && s.seated[1] && s.stoppedShort[2] && s.lupaOverFocus', label: 'labels hidden: the same physical transformation happens'},
    {at: 1, params: {facts: {title: 'F', attributes: [{text: 'a', status: 'as-supplied'}, {text: 'b', status: 'pending'}, {text: 'c', status: 'as-supplied'}, {text: 'd', status: 'as-supplied'}]}, rules: {title: 'R', conditions: ['A', 'B', 'C', 'D']}, issues: []}, fn: 's.travel.length === 4 && s.travel[1] === 0 && s.seated[0] && s.seated[2] && s.seated[3] && s.focusRow === 1', label: 'four rows: a pending bolt stays in while the others seat; the lens goes to it'},
    {at: 1, params: {rules: {title: 'R', conditions: ['A', 'B']}}, fn: "s.statuses[2] === 'unpaired' && s.travel[2] === 0", label: 'an attribute without a supplied condition stays unpaired (no bolt travel)'},
  ],
});
