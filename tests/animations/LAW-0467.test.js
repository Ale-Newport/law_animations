// LAW-0467 — Intención de vincularse · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the supplied context round the same
// conversation: A a social gathering, B a negotiation meeting) and it changes objects, not only text: with the change
// each scene is surrounded by the same soft frame and only its setting badge differs (two cups / a table with a
// notepad, same size and weight); the table's context row differs and the Δ guide outlines it, saying that nothing is
// concluded automatically. No legal consequence is invented: no winner, no presumption, no intention to be bound, no
// binding force, enforceability, validity or formation; no jurisdiction (noDeadlineWords, conceptNeutral, EN and ES).
// Composition (LAW-0467.js): two identical stages over one comparison table and the footer notes; 1:1 with labels all
// keeps the stacked-column layout of the coordinator ruling "CF CONTRAST 1:1 STAGE SHARE".
// Windows: headers, table and each scene's surroundings from CHANGE = 0.24 · events from 0.44 (the same moments in both
// scenes) · guide and key at the end.
// Standing coordinator rule (item 20): the long-labels-stress capped fields (each still longer than baseline, every
// count kept) are listed with the true driver and rendered numbers in the preset's description; pre-cap values in
// LAW-0467.presets.precap.json.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noDeadlineWords, noEmptyPanel, frameChecks, conceptNeutral} from './cf07-rendered.js';

const ID = 'LAW-0467';
const CHANGE = 0.24;
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardPA', 'cardRA', 'cardPB', 'cardRB', 'handAA', 'handBA', 'handAB', 'handBB'],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0 && s.lookA.frame === 0', label: 'base: the same situation in both stages, no scenario label, no table, no surroundings'},
    {at: 0.23, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change'},
    {at: 0.42, fn: "s.headers === 1 && s.lookA.frame === 1 && s.lookB.frame === 1 && s.lookA.setting === 'social' && s.lookB.setting === 'negotiated'", label: 'change: each scene surrounded by its supplied context — the same frame, only the setting badge differs'},
    {at: 0.5, fn: "s.lookA.whereP === 'route' && s.lookB.whereP === 'route' && JSON.stringify(s.lookA.cardP) === JSON.stringify(s.lookB.cardP)", label: 'parallel: the same conversation — A\'s message travels at the same moment on the same path in both stages'},
    {at: 0.75, fn: "s.lookA.whereP === 'B' && s.lookB.whereP === 'B' && s.lookA.whereR === 'B' && s.lookB.whereR === 'B'", label: 'both messages with the other party in both stages'},
    {at: 1, fn: "s.guide === 1 && s.allReached && s.layoutOk && JSON.stringify(s.a.order) === JSON.stringify(s.b.order)", label: 'guide: the same supplied order in both; hands reach'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.a.setting === 'social' && s.b.setting === 'negotiated' && s.a.order[0] === 'messageB-sent'", label: 'alternative: the same single changed fact with other facts'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.guide === 1 && s.allReached && s.lookB.frame === 1', label: 'labels hidden: the same contrast plays'},
  ],
});

identicalBeforeChange(ID, CHANGE);

ratioChecks(ID, 'paired layout, reach and equal stages', [
  {at: [1], fn: 's.layoutOk && s.sameGeometry', label: 'every block fits; both stages share one geometry (slots included)'},
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.flightGap >= 0', label: 'the two cards never meet'},
]);

suppliedTextSuite(ID, {
  fields: `return [p.offer.reference, p.offer.title, ...p.terms.map(t => t.label + ': ' + t.value), p.responses[0].reference, p.responses[0].text,
    ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), ...p.parties.map(q => q.name),
    p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean)`,
  content: `return [p.offer.title, ...p.terms.map(t => t.label + ': ' + t.value), p.responses[0].text, ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), p.changedFact]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="a-card-p"]', '[data-node="a-card-r"]', '[data-node="b-card-p"]', '[data-node="b-card-r"]', '[data-node="a-A-head"]', '[data-node="a-B-head"]', '[data-node="b-A-head"]', '[data-node="b-B-head"]']);
seekHistory(ID);
// (coordinator ruling, LAW-0455 re-review, applied here: the fill proxy is > 0.5 on the shorter axis — this item's rest frame shows
// the scenes only, without an empty table frame; 0.5 is used here instead of this builder's own 0.55)
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {count: 4});
esDefaults(ID);
cardsApart(ID, [['a-card-p', 'a-card-r'], ['b-card-p', 'b-card-r']]);
noDeadlineWords(ID);
conceptNeutral(ID);

// Rendered fill (labels key / none as well as all): from the change to the hold the stages, the comparison table and
// their trays cover the caption-safe box — at least 80 % of a 24 × 24 grid of its cells is under a visible element
// box (the LAW-0448 round-4 fill pattern; this builder's own threshold).
test(`${ID}: the frame stays filled from the change to the hold, labels all / key / none (rendered grid cover)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], worst = {};
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const R = svg.getBoundingClientRect();
      const sa = x.getState({bounds: false}).params.safeArea;
      const S = {l: R.left + R.width * sa.left, t: R.top + R.height * sa.top, w: R.width * (1 - sa.left - sa.right), h: R.height * (1 - sa.top - sa.bottom) - Math.min(R.width, R.height) * 0.057};
      const vis = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o >= 0.05; };
      let mn = 1;
      for (const u of [0.3, 0.5, 0.7, 0.85, 1]) {
        x.seek(u * x.durationMs);
        const bs = [...svg.querySelectorAll('[data-layer="scene"] path, [data-layer="scene"] rect, [data-layer="scene"] circle')].filter(e => !e.closest('defs') && !e.closest('clipPath') && vis(e)).map(e => e.getBoundingClientRect()).filter(q => q.width > 2 && q.height > 2);
        let cov = 0;
        const N = 24;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const cx = S.l + (i + 0.5) * S.w / N, cy = S.t + (j + 0.5) * S.h / N;
          if (bs.some(q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) cov++;
        }
        const f = cov / (N * N);
        mn = Math.min(mn, f);
        if (f < 0.8) fails.push(`${pr.name} ${tv} ${ratio} u${u} cover ${f.toFixed(2)}`);
      }
      worst[`${pr.name} ${tv} ${ratio}`] = +mn.toFixed(2);
      x.destroy();
      el.remove();
    }
    return {fails, worst};
  }, [ID, presets]);
  console.log(JSON.stringify(out.worst));
  expect(out.fails.slice(0, 20)).toEqual([]);
});

noEmptyPanel(ID);
frameChecks(ID, ['a-', 'b-']);
