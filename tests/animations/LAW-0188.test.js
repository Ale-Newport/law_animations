// LAW-0188 — Mediación entre partes · inspect. Contract battery + ID-specific checks.
// Acceptance (brief): the detail keeps its source coordinates, the change is
// localized, and seeking back restores the previous datum exactly.
// Return beat is sequential: lens closes 0.69–0.745, camera returns
// 0.745–0.79, then the context swap runs on c = (u − 0.79) / 0.11
// (TURN_WINDOWS.swap: slide 0.24–0.46, slide2 0.46–0.68, sOn 0.68–0.8) and the
// marker fades in 0.87–0.915; everything holds from 0.915.
import {contractSuite} from '../harness/contract.js';

const SLOT = {focusTarget: 'slotLength', beforeValue: '5 min', afterValue: '10 min'};

contractSuite('LAW-0188', {
  continuity: ['token', 'medL', 'medR', 'handA', 'handB'],
  attach: [
    // before the substitution reaches the context, Party A rests a hand on the token
    {from: 0, to: 0.79, a: 'handA', b: 'gripA', tol: 1.5},
    // context return (full size): left hand pulls the token to the centre, right hand carries it to B
    {from: 0.817, to: 0.84, a: 'medL', b: 'gripL', tol: 1.5},
    {from: 0.841, to: 0.864, a: 'medR', b: 'gripR', tol: 1.5},
    // Party B's hand rests on the token at the end
    {from: 0.879, to: 1, a: 'handB', b: 'gripB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.tokenAt === 'a' && s.speakingA && s.lensCopyMatches", label: 'context: A holds the token and speaks; the lens copy uses the context coordinates'},
    {at: 0.44, fn: "s.lensOpen > 0.9 && s.datum === 'before' && JSON.stringify(s.lensOrder) === JSON.stringify(['a','b'])", label: 'lens open on the unchanged turn order'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensOrder === null && JSON.stringify(s.contextOrder) === JSON.stringify(['a','b']) && s.tokenAt === 'a'", label: 'the substitution happens inside the lens only (context untouched)'},
    {at: 0.66, fn: "s.datum === 'after' && JSON.stringify(s.lensOrder) === JSON.stringify(['b','a']) && s.lensOpen === 1 && s.tokenAt === 'a'", label: 'lens holds the new datum; the token has not moved yet'},
    {at: 0.77, fn: "s.lensOpen === 0 && !s.cameraReturned && s.tokenAt === 'a' && s.tokenHold === 'a' && s.contextDatum === 'before'", label: 'while the camera returns nothing else changes in the context'},
    {at: 0.79, fn: "s.cameraReturned && s.tokenAt === 'a' && s.contextDatum === 'before'", label: 'the camera is back at full context before the context update and the token handoff start'},
    {at: 0.915, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && JSON.stringify(s.contextOrder) === JSON.stringify(['b','a']) && s.tokenAt === 'b' && s.speakingB === false && s.bubbleB === 1 && s.bubbleA === 0 && s.markerVisible", label: 'changed state fully settled by 0.915 (≥ 0.08 of the timeline held)'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && JSON.stringify(s.contextOrder) === JSON.stringify(['b','a']) && s.tokenAt === 'b' && s.speakingB === false && s.bubbleB === 1 && s.markerVisible", label: 'return to context: token now with B, changed marker shown'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.tokenAt === 'a' && JSON.stringify(s.lensOrder) === JSON.stringify(['a','b'])", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: SLOT, fn: "s.slotLens === 0.84 && s.slotContext === 0.84 && s.tokenAt === 'a'", label: 'slot substitution: bar doubles (5 → 10), the token stays with the first speaker'},
    {at: 0.3, params: SLOT, fn: 's.slotLens === 0.42 && s.slotContext === 0.42 && s.slotValues.old === 1 && s.slotValues.new === 0', label: 'slot substitution: seeking back restores the old bar and value'},
    {at: 0.5, params: SLOT, fn: 's.slotValues.old > 0 && s.slotValues.new === 0', label: 'slot value cross-fade: the old value leaves first'},
    {at: 0.535, params: SLOT, fn: 's.slotValues.old === 0 && s.slotValues.new === 0', label: 'slot value cross-fade: the two values are never drawn together'},
    {at: 0.58, params: SLOT, fn: 's.slotValues.old === 0 && s.slotValues.new > 0', label: 'slot value cross-fade: the new value arrives after the old one is gone'},
  ],
});
