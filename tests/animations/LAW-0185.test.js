// LAW-0185 — Mediación entre partes · story. Contract battery + ID-specific checks.
// Acceptance (brief): motion continuity, object anchoring, and the turn change
// must be recognisable with labels hidden (checked on semantic state, which
// does not depend on text).
// Clock mapping (see LAW-0185.js): x = (u − 0.15)/0.58, c = x + 0.55·x·(1−x)².
// Windows used below (c → u): m1 slide 0.10–0.24 → 0.189–0.251; A on token
// 0.31–0.47 → 0.286–0.376; tick 0.52–0.58 → 0.408–0.448; m2 slide 0.60–0.72 →
// 0.461–0.546; m3 slide 0.72–0.84 → 0.546–0.629; B on token from 0.90 → 0.669.
import {contractSuite} from '../harness/contract.js';

/** long-labels-stress params (kept in sync with LAW-0185.presets.json) */
const LONG = {"actors": [{"name": "Maria-Fernanda Castellanos Villavicencio", "role": "Party A"}, {"name": "Oluwaseun Bartholomew-Nakamura", "role": "Party B"}, {"name": "Anne-Katrin Vandenberghe-Østergaard", "role": "Mediator"}], "roles": {"a": "Representative of the tenant association", "b": "Representative of the property manager", "mediator": "Neutral third person organising turns"}, "props": {"agendaTitle": "Agenda for the joint session", "agendaItems": ["Opening account by the tenant association representative", "Opening account by the property manager representative", "Questions and clarifications from both sides", "Arrangements for a possible follow-up meeting"], "speech": {"a": "Let me explain the events from our perspective", "b": "I will now describe how we saw the situation"}}, "annotations": [{"target": "token", "text": "The wooden turn token now lies in front of the property manager representative"}, {"target": "agenda", "text": "The first agenda row has been ticked by the mediator after the first turn"}]};

contractSuite('LAW-0185', {
  // elbows are tracked with a tight limit so an IK elbow flip (a pop of the
  // arm between two solutions) fails the continuity check
  continuity: ['token', 'medL', 'medR', 'elbowL', 'elbowR', 'pen', 'handA', 'handB'],
  continuityLimit: 45,
  attach: [
    // mediator's left hand slides the token to Party A
    {from: 0.192, to: 0.249, a: 'medL', b: 'gripL', tol: 1.5},
    // Party A's hand rests on the token while speaking
    {from: 0.288, to: 0.374, a: 'handA', b: 'gripA', tol: 1.5},
    // pen nib follows the tick stroke on the agenda
    {from: 0.409, to: 0.446, a: 'pen', b: 'tickTarget', tol: 1.5},
    // left hand pulls the token back to the centre
    {from: 0.463, to: 0.544, a: 'medL', b: 'gripL', tol: 1.5},
    // right hand takes it at the centre and slides it to Party B
    {from: 0.548, to: 0.628, a: 'medR', b: 'gripR', tol: 1.5},
    // Party B's hand rests on the token through the hold
    {from: 0.672, to: 1, a: 'handB', b: 'gripB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.tokenAt === 'home' && s.bubbleA === 0 && s.bubbleB === 0 && s.ticks.every(t => t === 0)", label: 'rest: token in front of the agenda, nobody speaking'},
    {at: 0.22, fn: "s.tokenHold === 'l' && s.tokenAt === 'moving' && s.bubbleA === 0", label: 'the token only moves under the mediator’s hand, before A speaks'},
    {at: 0.3, fn: "s.tokenAt === 'a' && s.tokenHold === 'a' && s.bubbleA > 0.9 && s.speakingA && !s.speakingB", label: 'by the middle of the action beat A holds the token and speaks; B listens'},
    {at: 0.34, fn: "s.tokenAt === 'a' && s.tokenHold === 'a' && s.bubbleA > 0.9 && s.speakingA && !s.speakingB", label: 'A holds the token and speaks; B listens'},
    {at: 0.38, fn: "s.elbowL.y > s.medL.y + 20", label: 'end-of-turn gesture: the raised hand is above its elbow (no flipped elbow)'},
    ...[0.34, 0.35, 0.355, 0.36, 0.365, 0.37, 0.375, 0.38, 0.39, 0.4, 0.45, 0.5, 0.55, 0.6].map(at => ({at, fn: 's.elbowsLow', label: `elbows stay below the shoulder line through the gesture and hand-offs (u=${at})`})),
    {at: 0.53, fn: "s.tokenHold === 'l' && s.ticks[0] === 1 && s.bubbleA === 0 && !s.speakingA", label: 'A’s turn ended and ticked before the token is taken back'},
    {at: 0.6, fn: "s.tokenHold === 'r' && s.tokenAt === 'moving'", label: 'the other hand carries the token on to B'},
    {at: 0.75, fn: "s.speakingB && !s.speakingA && s.tokenAt === 'b'", label: 'B speaks only after receiving the token'},
    {at: 1, fn: "s.tokenAt === 'b' && s.tokenHold === 'b' && s.bubbleB === 1 && s.bubbleA === 0 && s.ticks[0] === 1 && s.ticks[1] === 0 && s.allReached", label: 'hold: B has the floor (supplied final state), row 1 ticked'},
    {at: 0.34, params: {textVisibility: 'none'}, fn: "s.tokenAt === 'a' && s.bubbleA > 0.9", label: 'the turn reads without labels (same action state)'},
    {at: 1, params: {finalState: 'first-has-floor'}, fn: "s.tokenAt === 'a' && s.bubbleA === 1 && s.bubbleB === 0 && s.ticks[0] === 0", label: 'supplied state: first speaker keeps the floor'},
    {at: 1, params: {finalState: 'both-heard'}, fn: "s.ticks[0] === 1 && s.ticks[1] === 1 && s.bubbleA === 0 && s.bubbleB === 0 && s.tokenAt === 'b'", label: 'supplied state: both turns completed and ticked'},
    {at: 0.34, params: {relationships: [{from: 'b', to: 'a', kind: 'sequence'}]}, fn: "s.order === 'b>a' && s.tokenAt === 'b' && s.bubbleB > 0.9", label: 'a sequence link B→A makes B speak first'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.tokenAt === 'a' && s.bubbleB === 0", label: 'actionProgress freezes the action part-way'},
    {at: 1, fn: "s.labelsFit && s.plate === 'panel'", label: 'default labels: name plate on the table panel, callout uncut, chips clear of each other'},
    {at: 1, params: LONG, fn: 's.labelsFit', label: 'long labels: a layout is found where no callout is cut and no name chip overlaps the plate'},
  ],
});
