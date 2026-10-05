// LAW-0465 — Intención de vincularse · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point), anchored objects (each message
// leaves its sender's rack from the sender's solved hand and lands at the other party's solved hand; the context's
// frame surrounds the parties, racks, cards and strip) and a transformation recognisable with the labels hidden
// (semantic state only). The cause precedes the visible effect: the surroundings draw themselves only after both
// messages rest.
// Legal content: the context is supplied and changes only the surroundings of the same conversation; the band names it
// "as supplied, no automatic conclusion"; the two settings' badges have the same size and weight; no presumption,
// intention to be bound, binding force, enforceability, validity, formation or outcome; no jurisdiction
// (noDeadlineWords, conceptNeutral, EN and ES).
// Standing coordinator rule (item 20): the long-labels-stress capped fields (each still longer than its baseline
// counterpart, every count kept) are listed with the true driver and rendered numbers in the preset's description;
// the pre-cap values are in LAW-0465.presets.precap.json.
// Windows (LAW-0465.js): events at 0.24 · 0.35 · 0.46 · 0.57 · 0.68 (the context's station) · frame drawn
// 0.675–0.73 · badge 0.72–0.75 · context chip from the rest · final state 0.75–0.80 · key 0.78–0.83 · notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noDeadlineWords, frameChecks, conceptNeutral} from './cf07-rendered.js';

const ID = 'LAW-0465';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardR'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereR === 'A' && s.stationsShown === 0 && s.contextDrawn === 0", label: 'rest: each message in its sender\'s rack; no surroundings; the strip is empty'},
    {at: 0.3, fn: "s.whereP === 'route' && s.whereR === 'A' && s.stationsShown === 1", label: 'A\'s message sets off first (supplied order); one station'},
    {at: 0.4, fn: "s.whereP === 'route' && s.whereR === 'route' && s.contextDrawn === 0", label: 'both messages travel: their routes cross'},
    {at: 0.62, fn: "s.whereP === 'B' && s.whereR === 'B' && s.stationsShown === 4 && s.contextDrawn === 0", label: 'both messages rest at the other party before the surroundings (cause before effect)'},
    {at: 0.76, fn: "s.contextDrawn === 1 && s.stationsShown === 5 && s.allReached && s.setting === 'social'", label: 'the supplied context surrounds the same conversation (social gathering, as supplied)'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['messageA-sent','messageB-sent','messageA-received','messageB-received','context']) && s.finalState === 'context-as-supplied' && s.finalShown === 1 && s.contextLabel === 'a social gathering' && s.layoutOk", label: 'hold: the supplied order; the context as supplied, nothing concluded'},
    {at: 0.3, fn: 's.stationsShown === 1 && s.finalShown === 0 && s.contextDrawn === 0', label: 'seeking back: the surroundings and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.setting === 'negotiated' && s.order[0] === 'messageB-sent' && s.contextDrawn === 1", label: 'alternative: another conversation in a negotiation meeting (the badge differs only); B\'s message sent first'},
    {at: 1, params: P('long-labels-stress'), fn: "s.grouped && s.contextDrawn === 1", label: 'stress: receipts in one position (order to be examined); the surroundings drawn'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereR === 'A' && s.contextDrawn === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereR === 'B' && s.contextDrawn === 1", label: 'labels hidden: the same journeys and the same surroundings'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two cards never meet'},
]);

suppliedTextSuite(ID, {
  fields: 'return [p.offer.reference, p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), p.responses[0].reference, p.responses[0].text, ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text), p.contextLabel]',
  content: 'return [p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), p.responses[0].text, ...p.sequence.map(e => e.time)]',
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
conceptNeutral(ID);
frameChecks(ID, ['']);

// Rendered: the two messages at equal weight — their cards the same size, their glyphs the same area (± 3 %), in every
// preset × ratio at rest.
test(`${ID}: the two messages at equal weight (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(0.05 * x.durationMs);
      const box = n => x.element.querySelectorAll(`[data-node="${n}-face"] > path`)[1].getBoundingClientRect();
      const a = box('card-p'), b = box('card-r');
      if (Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1) fails.push(`${pr.name} ${ratio}: cards ${a.width.toFixed(0)}×${a.height.toFixed(0)} vs ${b.width.toFixed(0)}×${b.height.toFixed(0)}`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});
