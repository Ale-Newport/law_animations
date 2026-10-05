// LAW-0093 — Regla y excepción · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchoring (the magnifier rides
// the left hand's grip for the whole scene; the right hand holds the lever knob
// while pulling it) and a transformation that stays recognizable with labels
// hidden (blade, gate, lit branch and the wagon's route are geometric states).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0093', {
  continuity: ['cart', 'handL', 'handR', 'mag', 'magGrip', 'knob'],
  attach: [
    // the magnifier is held at its handle grip from start to end (never teleports)
    {from: 0, to: 1, a: 'handL', b: 'magGrip', tol: 1.5},
    // the right hand is on the lever knob while it pulls it
    {from: 0.351, to: 0.429, a: 'handR', b: 'knob', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "!s.atStopLine && s.blade === 0 && s.gate === 0 && s.lever === 0 && s.glassOn === 0 && s.socketLit === 0 && s.marker === 'present'", label: 'rest: wagon at the start, switch straight, gate closed, lever up, socket empty'},
    {at: 0.14, fn: 's.cartDist === s.startDist && s.blade === 0 && s.lever === 0 && s.glassOn === 0', label: 'nothing moves before the action beat'},
    {at: 0.3, fn: 's.atStopLine && s.lensOnMarker && s.glassOn > 0 && s.blade === 0 && s.lever === 0', label: 'the magnifier examines the marker corner at the stop line before anything is switched'},
    {at: 0.345, fn: 's.socketLit > 0 && s.link > 0 && s.lever === 0', label: 'the marker is related to the gate socket (as supplied) before the lever moves'},
    {at: 0.38, fn: 's.handOnKnob && s.lever > 0 && s.blade > 0 && s.atStopLine && !s.onBranch', label: 'pulling the lever throws the blade while the wagon still waits (cause before effect)'},
    {at: 0.45, fn: 's.blade === 1 && s.gate === 1 && s.atStopLine', label: 'the separate branch is fully open before the wagon leaves the stop line'},
    {at: 0.6, fn: "s.onBranch && s.route === 'branch'", label: 'the wagon runs onto the branch after it opened'},
    {at: 1, fn: "s.onBranch && s.blade === 1 && s.gate === 1 && s.litBranch === 1 && s.litMain === 0 && !s.handOnKnob && s.glassOn === 0 && s.cartDist > s.switchDist", label: 'final hold: wagon at the branch buffer, switch and gate open, branch lit, hands released'},
    {at: 1, params: {finalState: 'main-as-supplied'}, fn: "s.route === 'main' && s.marker === 'absent' && s.blade === 0 && s.gate === 0 && s.lever === 0 && !s.onBranch && s.litMain === 1 && s.socketLit === 0 && s.cartDist > s.switchDist", label: 'main-as-supplied: no marker, lever untouched, wagon continues along the main route'},
    {at: 1, params: {finalState: 'held-disputed'}, fn: "s.route === 'held' && s.marker === 'disputed' && s.atStopLine && s.blade === 0 && s.gate === 0 && s.link > 0", label: 'held-disputed: disputed marker related to the socket, wagon held at the stop line, branch closed'},
    {at: 1, params: {finalState: 'held-pending'}, fn: "s.route === 'held' && s.marker === 'pending' && s.atStopLine && s.socketLit === 0 && s.link === 0", label: 'held-pending: covered marker, no relation drawn, wagon held'},
    {at: 0.3, params: {finalState: 'main-as-supplied'}, fn: 's.lensOnMarker && s.glassOn > 0', label: 'the magnifier examines the corner in every supplied state'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.onBranch && s.blade === 1 && s.gate === 1 && s.litBranch === 1', label: 'labels hidden: the same physical transformation happens'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && !s.onBranch && s.atStopLine', label: 'actionProgress freezes the action part-way'},
  ],
});
