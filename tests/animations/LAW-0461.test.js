// LAW-0461 — Consideration como concepto · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point), anchored objects (each token leaves
// its giver's rack from the giver's solved hand and lands at the other party's solved hand; the link starts and ends
// on the two tokens' edges) and a transformation recognisable with the labels hidden (semantic state only). The cause
// precedes the visible effect: the link is drawn only after both tokens rest.
// Legal content: "consideration" appears only as the supplied, illustrative concept label; the link is a plain relation
// ("Linked as supplied", no arrowhead); "performance identified" / "question to be analysed" are supplied statuses
// (the latter with the dashed pending marker, never a failure); no rule, validity, enforceability, binding force,
// sufficiency, adequacy or formation wording (noDeadlineWords, EN and ES).
// Standing coordinator rule (item 20): the long-labels-stress capped fields (each still longer than its baseline
// counterpart, every count kept) are listed with the true driver and rendered numbers in the preset's description;
// the pre-cap values are in LAW-0461.presets.precap.json.
// Windows (LAW-0461.js): events at 0.24 · 0.35 · 0.46 · 0.57 · 0.68 (the link's station) · link drawn 0.675–0.72 ·
// caption 0.715–0.74 · final state 0.75–0.80 · key 0.78–0.83 · notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noDeadlineWords, linkChecks, conceptNeutral} from './cf06-rendered.js';

const ID = 'LAW-0461';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardR'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereR === 'A' && s.stationsShown === 0 && s.linkDrawn === 0", label: 'rest: each token in its giver\'s rack; no link; the strip is empty'},
    {at: 0.3, fn: "s.whereP === 'route' && s.whereR === 'A' && s.stationsShown === 1", label: 'the promise token sets off first (supplied order); one station'},
    {at: 0.4, fn: "s.whereP === 'route' && s.whereR === 'route' && s.linkDrawn === 0", label: 'both tokens travel: their routes cross'},
    {at: 0.62, fn: "s.whereP === 'B' && s.whereR === 'B' && s.stationsShown === 4 && s.linkDrawn === 0", label: 'both tokens rest at the other party before any link (cause before effect)'},
    {at: 0.75, fn: "s.linkDrawn === 1 && s.stationsShown === 5 && s.allReached && s.linkStatus === 'identified'", label: 'the link is drawn between the two tokens, as supplied'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['promise-sent','performance-sent','promise-received','performance-received','linked']) && s.finalState === 'performance-identified' && s.finalShown === 1 && s.conceptLabel === 'consideration' && s.layoutOk", label: 'hold: the supplied order and status; the concept label as supplied'},
    {at: 0.3, fn: 's.stationsShown === 1 && s.finalShown === 0 && s.linkDrawn === 0', label: 'seeking back: the link and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.linkStatus === 'to-analyse' && s.finalState === 'question-to-analyse' && s.order[0] === 'performance-sent' && s.linkDrawn === 1", label: 'alternative: a question to be analysed (dashed pending marker); the performance token sent first'},
    {at: 1, params: P('long-labels-stress'), fn: "s.grouped && s.finalState === 'performance-identified' && s.linkDrawn === 1", label: 'stress: receipts in one position (order to be examined); the supplied status at the hold'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereR === 'A' && s.linkDrawn === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereR === 'B' && s.linkDrawn === 1", label: 'labels hidden: the same journeys and the same link'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two cards never meet'},
]);

suppliedTextSuite(ID, {
  fields: 'return [p.offer.reference, p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), p.responses[0].reference, p.responses[0].text, ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text), p.conceptLabel]',
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
linkChecks(ID, ['']);

// Rendered: the two tokens at equal weight — their cards the same size, their glyphs the same area (± 3 %), in every
// preset × ratio at rest.
test(`${ID}: promise and performance tokens at equal weight (rendered)`, async ({page}) => {
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
