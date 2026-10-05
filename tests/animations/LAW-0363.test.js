// LAW-0363 — Etiquetado de indicio · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two benches of identical size); exactly the indicated fact changes (B's
// pen lifts over the supplied row `changedRecord`, which stays blank — every other row, position and timing is
// identical); no legal consequence is invented (both tags are clipped and bagged the same way; guide + neutral note).
// Timing (u): base 0–0.17 (identical) · hand to pen 0.17–0.20 · pen to the first row 0.20–0.225 · rows written 0.225–0.36 (B skips the changed row) ·
// pen back 0.36–0.40 · hand to tag 0.40–0.46 · tag carried 0.46–0.53 · clip 0.53–0.58 · release 0.58–0.60 · hand to
// object 0.60–0.64 · lift 0.64–0.66 · carry 0.66–0.74 · lower 0.74–0.77 · hand back 0.77–0.83 · guide 0.79–0.85 ·
// note 0.82–0.87; still from 0.87.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0363';
const CHANGE_AT = 0.17;
const attach = [];
for (const s of ['A', 'B']) {
  attach.push({from: 0.2005, to: 0.3595, a: `hand${s}`, b: `penGrip${s}`, tol: 1.5});
  attach.push({from: 0.4605, to: 0.5795, a: `hand${s}`, b: `tagGrip${s}`, tol: 1.5});
  attach.push({from: 0.6405, to: 0.7695, a: `hand${s}`, b: `objGrip${s}`, tol: 1.5});
  attach.push({from: 0.5205, to: 0.5995, a: `handL${s}`, b: `steady${s}`, tol: 1.5});
}

contractSuite(ID, {
  continuity: ['handA', 'handB', 'handLA', 'penA', 'penB', 'objA', 'objB', 'holeA', 'holeB'],
  attach,
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.write.every(w => w === 0)", label: 'base: identical benches, all rows blank'},
    {at: 0.37, fn: 's.writtenA[s.changedRecord] === 1 && s.writtenB[s.changedRecord] === 0 && s.writtenA.every((w, i) => i === s.changedRecord || w === s.writtenB[i])', label: 'only the changed row differs (written in A, blank in B)'},
    {at: 0.6, fn: 'JSON.stringify(s.lookA.obj) === JSON.stringify(s.lookB.obj) && s.lookA.attached === s.lookB.attached', label: 'the tag-and-bag action runs identically in parallel'},
    {at: 1, fn: 's.lookA.inside && s.lookB.inside && s.lookA.attached && s.lookB.attached && s.guide === 1 && s.problems.length === 0 && s.allReached', label: 'hold: both objects bagged with tags attached; guide shown; composition fits'},
    {at: 1, params: {changedRecord: 0}, fn: 's.writtenB[0] === 0 && s.writtenA[0] === 1 && s.writtenB[1] === 1', label: 'the supplied changedRecord alone decides the blank row'},
    {at: 0.1, fn: "s.beat === 'base' && s.guide === 0", label: 'seeking back restores the base'},
  ],
});

identicalBeforeChange(ID, CHANGE_AT);

suppliedTextSuite(ID, {
  fields: "return [p.changedFact, ...p.records.map(r => r.field), ...p.records.map(r => r.value), ...p.sharedFacts, p.items[0].id, p.items[0].label, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.scenarioA.label, p.scenarioB.label, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.key];",
  content: 'return [p.changedFact, ...p.records.map(r => r.field), ...p.records.map(r => r.value)];',
  captions: 'return [...p.sharedFacts];',
});

ratioChecks(ID, 'scenes equal except the changed row; tags stay joined; composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 'Math.abs(s.stages[0].w - s.stages[1].w) < 0.01 && Math.abs(s.stages[0].h - s.stages[1].h) < 0.01', label: 'both benches have the same size'},
  {at: times(0, 1, 0.02), fn: 'JSON.stringify(s.lookA.obj) === JSON.stringify(s.lookB.obj) && JSON.stringify(s.lookA.hand) === JSON.stringify(s.lookB.hand)', label: 'object and hand positions are identical in A and B at every moment'},
  {at: times(0.6, 1, 0.02), fn: 'Math.abs(s.chainLenA - s.chainL) < 0.6 && Math.abs(s.chainLenB - s.chainL) < 0.6', label: 'once clipped, both tags stay at chain length'},
  {at: times(0.17, 0.85, 0.01), fn: 's.allReached', label: 'hands within reach'},
]);

test(`${ID}: every records count (2..5), changed row and object kind composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [2, 3, 4, 5]) for (const kind of ['key', 'cup', 'box']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const params = {records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: `Value ${i + 1}`})), changedRecord: n - 1, items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}], sharedFacts: n > 3 ? ['a', 'b', 'c'] : []};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.lookB.inside || s.S < 60) out.push(`${n} ${kind} ${w}x${h}: ${s.problems.join(',')} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: cold create() of long-labels-stress stays under ~1 s in every ratio`, async ({browser}) => {
  const stress = presetsFor(ID).find(p => p.name === 'long-labels-stress').params;
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, params, w, h]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params}); await x.ready; x.seek(x.durationMs);
      const dt = performance.now() - t0; x.destroy(); return dt;
    }, [ID, stress, w, h]);
    await page.close();
    expect(ms).toBeLessThan(1000);
  }
});
