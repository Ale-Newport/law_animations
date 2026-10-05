// LAW-0457 — Intercambio de promesas · story. Contract battery + ID-specific checks.
// Standing coordinator rule (item 20): the long-labels-stress capped fields (each still longer than its baseline
// counterpart) are listed with the true driver and rendered numbers in the preset's description; the pre-cap values are
// in LAW-0457.presets.precap.json.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point), anchored objects (each card leaves
// its holder's rack from the holder's solved hand and lands at the other party's solved hand), and a transformation
// recognisable with the labels hidden (semantic state only). Legal content: "reciprocal" / "unilateral" are supplied
// configurations only (who holds which commitment); the unilateral one shows one card and no empty slot; no
// binding, enforceability, validity or formation wording (noDeadlineWords also bans "valid", "effective").
// Windows (LAW-0457.js): events spread over 0.24–0.68 in the supplied order · strip title 0.12–0.16 · final state
// 0.75–0.80 · key 0.78–0.83 · notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noDeadlineWords} from './cf05-rendered.js';

const ID = 'LAW-0457';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardR'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereR === 'A' && s.stationsShown === 0", label: 'rest: each commitment in its holder\'s rack; the strip is empty'},
    {at: 0.3, fn: "s.whereP === 'route' && s.whereR === 'A' && s.stationsShown === 1", label: 'A\'s commitment sets off first (supplied order); one station'},
    {at: 0.45, fn: "s.whereP === 'route' && s.whereR === 'route'", label: 'both commitments travel: their routes cross'},
    {at: 0.75, fn: "s.whereP === 'B' && s.whereR === 'B' && s.stationsShown === 4 && s.allReached", label: 'main action done by 0.75: each card with the other party (where = the receiving rack)'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['commitmentA-sent','commitmentB-sent','commitmentA-received','commitmentB-received']) && s.configuration === 'reciprocal' && s.finalShown === 1 && s.layoutOk", label: 'hold: the supplied order; the supplied configuration (reciprocal) is shown'},
    {at: 0.3, fn: "s.stationsShown === 1 && s.finalShown === 0", label: 'seeking back: the order and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.configuration === 'unilateral' && JSON.stringify(s.active) === JSON.stringify(['proposal']) && s.whereP === 'B' && s.finalState === 'unilateral'", label: 'alternative: only A\'s commitment travels (unilateral, as supplied)'},
    {at: 1, params: P('long-labels-stress'), fn: "s.grouped && s.finalState === 'sequence-to-examine'", label: 'stress: receipts in one position; the sequence is to be examined'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereR === 'A'", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereR === 'B' && s.stationsShown === 4", label: 'labels hidden: the same journeys and stations'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two cards never meet'},
]);

suppliedTextSuite(ID, {
  // (B's commitment is drawn only when the supplied sequence includes its events)
  fields: 'const b = p.sequence.some(e => e.event.startsWith("commitmentB")); return [p.offer.reference, p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), ...(b ? [p.responses[0].reference, p.responses[0].text] : []), ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text)]',
  content: 'const b = p.sequence.some(e => e.event.startsWith("commitmentB")); return [p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), ...(b ? [p.responses[0].text] : []), ...p.sequence.map(e => e.time)]',
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="card-p"]', '[data-node="card-r"]', '[data-node="A-head"]', '[data-node="B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID);
esDefaults(ID);
cardsApart(ID, [['card-p', 'card-r']]);
noDeadlineWords(ID);

