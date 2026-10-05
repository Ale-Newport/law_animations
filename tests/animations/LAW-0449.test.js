// LAW-0449 — Retirada de propuesta · story. Contract battery + ID-specific checks.
// Standing coordinator rule (item 20): the long-labels-stress references, proposal title, item and quantity terms and
// annotations are capped; the per-field reason with rendered numbers is in the preset's description and the pre-cap
// values in LAW-0449.presets.precap.json. Every capped field stays longer than baseline, every count is kept.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point), anchored objects (each card leaves
// A's rack from A's solved hand and lands in B's rack at B's solved hand), and a transformation recognisable with the
// labels hidden (semantic state only). Legal content: the scene depicts the supplied order of the events only; it
// states no effect of the withdrawal, no "in time", no prevailing message, no revocation.
// Windows (LAW-0449.js): events spread over 0.24–0.68 in the supplied order · strip title 0.12–0.16 · final state
// 0.75–0.80 · key 0.78–0.83 · notes 0.80–0.85.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart} from './cf03-rendered.js';

const ID = 'LAW-0449';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardW'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereW === 'A' && s.stationsShown === 0", label: 'rest: both cards in A\'s rack; the strip is empty'},
    {at: 0.3, fn: "s.whereP === 'route' && s.whereW === 'A' && s.stationsShown === 1", label: 'the proposal travels first (supplied order); one station shown'},
    {at: 0.45, fn: "s.whereP === 'route' && s.whereW === 'route'", label: 'both journeys under way (the routes cross)'},
    {at: 0.75, fn: "s.whereP === 'B' && s.whereW === 'B' && s.stationsShown === 4 && s.allReached", label: 'main action done by 0.75: both cards in B\'s rack, four stations'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['proposal-sent','withdrawal-sent','withdrawal-received','proposal-received']) && s.finalShown === 1 && s.layoutOk", label: 'hold: the strip keeps the supplied order; the supplied final state is shown'},
    {at: 0.3, fn: "s.stationsShown === 1 && s.finalShown === 0", label: 'seeking back: the order and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.grouped && s.order.length === 3 && s.finalState === 'sequence-to-examine'", label: 'receipts supplied with one position: one station, order to be examined'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereW === 'A'", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereW === 'B' && s.stationsShown === 4", label: 'labels hidden: the same journeys and stations'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two cards in flight never meet'},
]);

suppliedTextSuite(ID, {
  fields: 'return [p.offer.reference, p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), p.responses[0].reference, p.responses[0].text, ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text)]',
  content: 'return [p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), p.responses[0].text, ...p.sequence.map(e => e.time)]',
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="card-p"]', '[data-node="card-w"]', '[data-node="A-head"]', '[data-node="B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1]);
headFloor(ID);
esDefaults(ID);
cardsApart(ID, [['card-p', 'card-w']]);
