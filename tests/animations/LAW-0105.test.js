// LAW-0105 — Razonamiento circular · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of the motion (external card, magnifier, both hands), anchoring of the
// objects (the magnifier never leaves the left hand; the card is held from its grip until it rests on the
// box and only then is released; arrows start and end on the card edges they connect) and the
// transformation reads with the labels hidden (same loop, same separation, same chain).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {midWordSuite} from './razonamiento-circular-checks.js';

const ID = 'LAW-0105';
const noHit = "s.cardBoxes.every(b => !(s.lupaBox.x < b.x + b.w && s.lupaBox.x + s.lupaBox.w > b.x && s.lupaBox.y < b.y + b.h && s.lupaBox.y + s.lupaBox.h > b.y))";

contractSuite(ID, {
  continuity: ['E', 'lupa', 'handL', 'handR', 'gripE'],
  attach: [
    {from: 0, to: 1, a: 'handL', b: 'lupaGrip', tol: 1},
    {from: 0.495, to: 0.685, a: 'handR', b: 'gripE', tol: 1},
  ],
  semantic: [
    {at: 0.1, fn: "s.loopDrawn[0] === 0 && s.loopDrawn[1] === 0 && s.ePhase === 'propped' && s.eSupport === 'claim' && s.chainDrawn.every(v => v === 0) && s.apexTouch < 0.5", label: 'rest: claim and premise lean on each other (tops touch), external premise propped on the claim, no arrow yet'},
    {at: 0.25, fn: 's.loopDrawn[0] > 0 && s.loopDrawn[1] === 0', label: 'the premise → claim arrow draws first'},
    {at: 0.33, fn: 's.loopDrawn[0] === 1 && s.loopDrawn[1] > 0 && s.loopDrawn[1] < 1 && !s.loopClosed', label: 'then the second arrow leaves the claim'},
    {at: 0.42, fn: 's.loopClosed && s.returnOnPremise < 0.5 && s.returnStartOnClaim < 0.5 && s.firstStartOnPremise < 0.5 && s.firstEndOnClaim < 0.5', label: 'the arrow returns to its own premise: every loop arrow starts and ends on the card edge it connects'},
    {at: 0.42, fn: 's.lupaOverReturn', label: 'the magnifier has followed the returning arrow to where it lands'},
    {at: 0.44, fn: "s.ePhase === 'propped' && !s.eMovedBeforeLoopClosed", label: 'the external premise is not touched before the loop has closed'},
    {at: 0.6, fn: "s.holdingE && (s.ePhase === 'carried' || s.ePhase === 'lifted') && s.chainDrawn.every(v => v === 0)", label: 'the hand carries the external premise; no chain arrow before it rests'},
    {at: 0.7, fn: "s.eSupport === 'box' && s.eBoxContact !== null && s.eBoxContact < 1 && !s.chainBeforeRest", label: 'separated: the external premise leans on the outside support (touching its top corner)'},
    {at: 0.69, fn: '!s.chainBeforeRest', label: 'chain arrows only after the card rests on the box'},
    {at: 0.8, fn: "s.chainDrawn[0] === 1 && s.chainDrawn[1] === 1 && !s.holdingE && s.loopClosed", label: 'box → external premise → claim chain drawn; hand released'},
    {at: 1, fn: `s.lupaParked && ${noHit}`, label: 'hold: the magnifier is parked in free space, off every card'},
    {at: 1, fn: "s.beat === 'hold' && s.finalState === 'external-set-apart' && s.placeFail.length === 0", label: 'hold: the supplied final state; every note found a free place'},
    {at: 1, params: {finalState: 'loop-only'}, fn: "s.loopClosed && s.ePhase === 'propped' && s.chainDrawn.every(v => v === 0) && !s.holdingE", label: 'loop-only (as supplied): the loop is traced, the external premise stays where it was, no chain'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && s.loopClosed === false', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.loopClosed && s.returnOnPremise < 0.5 && s.eSupport === 'box' && s.chainDrawn.every(v => v === 1) && s.lupaParked", label: 'labels hidden: the same loop, separation and chain read'},
    {at: 0.1, params: {textVisibility: 'none'}, fn: "s.ePhase === 'propped' && s.loopDrawn[1] === 0", label: 'labels hidden: nothing is separated or looped early'},
  ],
});


// Rendered text audit (shared harness): every supplied field drawn un-truncated at the hold; supplied text
// >= 16 px (>= 19.5 px baseline) and never smaller than the generic captions; the no-conclusion key.
const FIELDS = 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, ...p.issues, ...p.assumptions, p.speaker.name, p.speaker.role, p.analyst.name, p.actorLabels.a, ...Object.values(p.objectLabels), ...p.annotations.map(a => a.text)]';
suppliedTextSuite(ID, {fields: FIELDS, content: 'return [p.claim, ...p.facts, p.supportLabel, ...p.rules, p.speaker.name]', captions: 'return [p.actorLabels.a, ...p.issues, ...p.assumptions]'});
midWordSuite(ID, FIELDS);
