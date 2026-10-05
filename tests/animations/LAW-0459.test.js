// LAW-0459 — Intercambio de promesas · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (whether Party B also holds a
// commitment that travels: reciprocal in A, unilateral in B) and it changes objects, relations and sequence, not only
// text: in A, B's card enters its rack at the change and crosses A's card; in B only A's card travels, with no empty
// place drawn for a second one. No legal consequence is drawn (no winner, no deficiency, no binding force, no
// formation: noDeadlineWords).
// Composition (LAW-0459.js): two identical stages over one comparison table and the footer notes; 1:1 with labels all
// keeps the stacked-column layout of the coordinator ruling "CF CONTRAST 1:1 STAGE SHARE".
// Windows: headers and table from CHANGE = 0.24 (B's card and its slots in A come in with them) · events from 0.44,
// A's commitment sent and received at the same moments in both scenes · guide and key at the end.
// Standing coordinator rule (item 20): the long-labels-stress guide and neutral note are capped (each still longer
// than its baseline counterpart; driver and numbers in the preset's description; pre-cap values in
// LAW-0459.presets.precap.json).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noDeadlineWords, noEmptyPanel} from './cf05-rendered.js';

const ID = 'LAW-0459';
const CHANGE = 0.24;
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardPA', 'cardRA', 'cardPB', 'handAA', 'handBA', 'handAB', 'handBB'],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0', label: 'base: the same situation in both stages, no scenario label, no table'},
    {at: 0.23, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change'},
    {at: 0.42, fn: "s.headers === 1 && s.a.configuration === 'reciprocal' && s.b.configuration === 'unilateral' && s.lookA.cardRShown === 1 && s.lookB.cardRShown === 0", label: "change: in A, B's commitment is in B's rack; in B only A's commitment is supplied"},
    {at: 0.5, fn: "s.lookA.whereP === 'route' && s.lookB.whereP === 'route' && s.lookA.whereR === 'A'", label: "parallel: A's commitment is on its way in both stages at the same moment (B's not yet sent in A)"},
    {at: 0.62, fn: "s.lookA.whereP === 'B' && s.lookB.whereP === 'B' && s.lookA.whereR === 'route'", label: "A's commitment received at the same moment in both stages; in A, B's commitment still travelling"},
    {at: 1, fn: "s.guide === 1 && s.allReached && s.layoutOk && JSON.stringify(s.a.order) === JSON.stringify(['commitmentA-sent','commitmentB-sent','commitmentA-received','commitmentB-received']) && JSON.stringify(s.b.order) === JSON.stringify(['commitmentA-sent','commitmentA-received'])", label: 'guide: both sequences as supplied; hands reach'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.a.configuration === 'reciprocal' && s.b.configuration === 'unilateral'", label: 'alternative: still reciprocal in A and unilateral in B'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.guide === 1 && s.allReached', label: 'labels hidden: the same contrast plays'},
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
