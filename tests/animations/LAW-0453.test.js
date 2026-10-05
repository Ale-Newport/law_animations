// LAW-0453 — Vencimiento de propuesta · story. Contract battery + ID-specific checks.
// Standing coordinator rule (item 20): the long-labels-stress proposal reference and title, the three term values and
// the second annotation are capped; the per-field reason with rendered numbers is in the preset's description and the
// pre-cap values in LAW-0453.presets.precap.json. Every capped value stays longer than baseline; every count is kept
// (3 terms, 5 events, 2 annotations).
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point, the clock hand included), anchored
// objects (each card leaves its sender's rack from the sender's solved hand and lands at the receiver's solved hand;
// the clock stands on B's rack), and a transformation recognisable with the labels hidden (semantic state only).
// Legal content: the clock's mark is a supplied milestone only; "before"/"after" are positions relative to it; no
// consequence, no deadline / expiry / validity wording (noDeadlineWords).
// Windows (LAW-0453.js): clock from 0.17 · events spread over 0.30–0.68 in the supplied order · strip title 0.12–0.16
// · final state 0.75–0.80 · key 0.78–0.83 · notes 0.80–0.85.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noDeadlineWords} from './cf04-rendered.js';

const ID = 'LAW-0453';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardR'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereR === 'A' && s.stationsShown === 0 && s.clockAngle === -120", label: 'rest: the proposal in A\'s rack, the response in B\'s rack, the hand away from the mark, the strip empty'},
    {at: 0.25, fn: "s.whereP === 'route' && s.clockAngle > -120 && s.clockAngle < 0", label: 'the clock\'s hand starts towards the mark while the proposal travels'},
    {at: 0.34, fn: "s.whereP === 'B' && s.stationsShown === 1", label: 'the proposal lands in B\'s rack beside the clock; one station'},
    {at: 0.5, fn: "s.whereR === 'route' && !s.atMark", label: 'the response travels back to A before the hand reaches the mark (supplied order)'},
    {at: 0.75, fn: "s.whereP === 'B' && s.whereR === 'B' && s.stationsShown === 4 && s.atMark && s.milestoneShown && s.allReached", label: 'main action done by 0.75: both cards delivered, the hand at the mark at the milestone\'s station'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['proposal-received','response-sent','response-received','milestone']) && s.relation === 'before' && s.finalShown === 1 && s.layoutOk", label: 'hold: the supplied order; the response before the supplied milestone (as supplied)'},
    {at: 0.3, fn: "s.stationsShown <= 1 && s.finalShown === 0 && !s.atMark", label: 'seeking back: the order, the hand and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.relation === 'after' && s.finalState === 'response-after' && s.clockAngle === 60 && s.order.length === 5", label: 'alternative: milestone before the response; the hand passes the mark and moves on'},
    {at: 1, params: P('long-labels-stress'), fn: "s.relation === 'mixed' && s.finalState === 'sequence-to-examine'", label: 'stress: the milestone between the response\'s events; the sequence is to be examined'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereR === 'A' && !s.atMark", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereR === 'B' && s.stationsShown === 4 && s.atMark", label: 'labels hidden: the same journeys, stations and clock'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two cards never meet'},
]);

suppliedTextSuite(ID, {
  fields: 'return [p.offer.reference, p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), p.responses[0].reference, p.responses[0].text, ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text)]',
  content: 'return [p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), p.responses[0].text, ...p.sequence.map(e => e.time)]',
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Milestone as supplied (illustrative)', 'Hito según lo aportado (ilustrativo)']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="card-p"]', '[data-node="card-r"]', '[data-node="A-head"]', '[data-node="B-head"]', '[data-node="clock"]']);
seekHistory(ID);
fill(ID, [0.05, 1]);
headFloor(ID);
esDefaults(ID);
cardsApart(ID, [['card-p', 'card-r'], ['card-p', 'clock'], ['card-r', 'clock']]);
noDeadlineWords(ID);
