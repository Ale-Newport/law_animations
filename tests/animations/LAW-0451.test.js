// LAW-0451 — Retirada de propuesta · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the supplied order of the two
// receipts: one after the other in A, one position in B — "order to be examined"), and no legal consequence is
// invented to complete the contrast (no winner, no effect of the withdrawal, no "in time", no revocation).
// Composition (LAW-0451.js): two identical stages (side by side or stacked) over one comparison table (one row per
// event, one column per scenario) and the footer notes. Square frames: the stages also use the footer's room during
// the action and collapse at the guide (shrink for glyph-token cards, else fade; their end state stays in the table).
// Windows: headers 0.24–0.30 (CHANGE = 0.24) · table 0.26–0.33 · B's bracket 0.32–0.38 · events from 0.44 at the
// same pitch in both scenes (the same sending moments) · collapse 0.77–0.80 · ring 0.79–0.84 · guide 0.81–0.86 ·
// key 0.83–0.88.
// Standing coordinator rule (item 20): the long-labels-stress sending/receipt time labels of scenario A (and B's sending
// time), the shared facts and the neutral note are capped so that 1:1 keeps the people at the hold (per-field reason with
// rendered numbers in the preset's description; pre-cap values in LAW-0451.presets.precap.json).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults} from './cf03-rendered.js';

const ID = 'LAW-0451';
const CHANGE = 0.24;
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardPA', 'cardWA', 'cardPB', 'cardWB', 'handAA', 'handBA', 'handAB', 'handBB'],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0', label: 'base: two identical stages, no scenario label, no table yet'},
    {at: 0.23, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change'},
    {at: 0.4, fn: 's.headers === 1 && !s.a.grouped && s.b.grouped && s.lookA.row === 1 && s.lookB.bracket === 1', label: 'change: A supplies the receipts in order, B with one position (bracket "order to be examined")'},
    {at: 0.43, fn: "s.a.whereP === 'A' && s.b.whereP === 'A' && JSON.stringify(s.lookA.handA) === JSON.stringify(s.lookB.handA)", label: 'parallel: A takes the proposal at the same moment in both stages'},
    {at: 0.5, fn: "s.a.whereP === 'route' && s.b.whereP === 'route'", label: 'parallel: the proposal travels in both stages'},
    {at: 0.66, fn: "s.a.whereW === 'B' && s.a.whereP === 'route' && s.b.whereW === 'B' && s.b.whereP === 'B'", label: 'A: the receipts one after the other (supplied order); B: both at the bracketed position'},
    {at: 1, fn: "s.guide === 1 && s.allReached && s.layoutOk && JSON.stringify(s.a.order) === JSON.stringify(['proposal-sent','withdrawal-sent','withdrawal-received','proposal-received']) && JSON.stringify(s.b.order) === JSON.stringify(['proposal-sent','withdrawal-sent','withdrawal-received+proposal-received'])", label: 'guide: both sequences as supplied; the guide is shown; hands reach'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.a.order[2] === 'proposal-received' && s.b.grouped", label: 'alternative: A supplies the proposal received first; B one position'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.a.whereW === 'B' && s.b.whereP === 'B' && s.b.grouped && s.guide === 1", label: 'labels hidden: the same contrast plays'},
  ],
});

identicalBeforeChange(ID, CHANGE);

ratioChecks(ID, 'paired layout, reach and equal stages', [
  {at: [1], fn: 's.layoutOk && s.sameGeometry', label: 'every block fits; both stages share one geometry'},
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.flightGap >= 0', label: 'the two cards in flight never meet'},
]);

suppliedTextSuite(ID, {
  fields: `return [p.offer.reference, p.offer.title, ...p.terms.map(t => t.label + ': ' + t.value), p.responses[0].reference, p.responses[0].text,
    ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), ...p.parties.map(q => q.name),
    p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]`,
  content: `return [p.offer.title, ...p.terms.map(t => t.label + ': ' + t.value), p.responses[0].text, ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), p.changedFact]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="a-card-p"]', '[data-node="a-card-w"]', '[data-node="b-card-p"]', '[data-node="b-card-w"]', '[data-node="a-A-head"]', '[data-node="a-B-head"]', '[data-node="b-A-head"]', '[data-node="b-B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1]);
headFloor(ID, {count: 4});
esDefaults(ID);

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
