// LAW-0375 — Registro fotográfico · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity (hands, cameras and prints move continuously), anchoring (left hand on each
// camera's handle while it moves, right hand on the shutter button) and the transformation recognisable with labels
// hidden: A's camera ends far with a wide field, B's close with a small field; one print per bench; the guide.
// Windows (u, 7.5 s): base 0–0.17 (hands to camera 0.03–0.10 and to shutter 0.09–0.16, identical in A and B) · change
// 0.17–0.38 (A to the far station, B to the near station) · shutter 0.44–0.50 · print flies 0.50–0.69 · hands back
// 0.70–0.77 · guide 0.79–0.85 · note 0.82–0.87.
// Legal: no winner, no consequence; the two framings are supplied situations only.
// Coordinator decision (2026-10-05, coordinator message to the evidence-custody-04 builder, under the standing rule
// 2026-09-26 / AUTHORING item 20): the long-labels-stress fields are capped to the longest values that keep both benches
// at S >= 70 in 1:1 with text >= 16 px (side, stacked and side-head layouts tried first); every field stays longer than
// baseline and counts stay >= baseline.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0375';

contractSuite(ID, {
  continuity: ['handA', 'handLA', 'handB', 'handLB', 'camA', 'camB', 'printA', 'printB'],
  attach: [
    {from: 0.1005, to: 0.6995, a: 'handLA', b: 'camGripA', tol: 1.5},
    {from: 0.1005, to: 0.6995, a: 'handLB', b: 'camGripB', tol: 1.5},
    {from: 0.1605, to: 0.6995, a: 'handA', b: 'btnA', tol: 1.5},
    {from: 0.1605, to: 0.6995, a: 'handB', b: 'btnB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && s.printStateA === 'none' && s.printStateB === 'none'", label: 'base: no prints'},
    {at: 0.4, fn: 's.fieldA > s.fieldB * 1.8', label: 'the change: A frames a wide field, B a small one'},
    {at: 0.42, fn: "s.printStateA === 'none' && s.printStateB === 'none'", label: 'no print exists before the exposure'},
    {at: 0.6, fn: "s.printStateA === 'flying' && s.printStateB === 'flying'", label: 'both prints fly in parallel'},
    {at: 1, fn: "s.printStateA === 'placed' && s.printStateB === 'placed' && s.guide === 1 && s.allReached && s.problems.length === 0", label: 'hold: both prints placed, guide drawn, composition fits'},
    {at: 0.7, fn: 's.guide === 0', label: 'the guide waits for the hold'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.label), p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.key];",
  content: 'return [p.changedFact, p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'hands within reach; cameras held while moved; composition fits', [
  {at: [1], presets: ['baseline-es'], tv: ['all'], fn: 's.textPx >= 19.5', label: 'baseline-es keeps text at >= 19.5 px (baseline floor) in every ratio'},
  {at: times(0, 1, 0.02), fn: 's.allReached', label: 'hands within reach'},
  {at: times(0.17, 0.38, 0.01), fn: 'Math.hypot(s.handLA.x - s.camGripA.x, s.handLA.y - s.camGripA.y) < 2 && Math.hypot(s.handLB.x - s.camGripB.x, s.handLB.y - s.camGripB.y) < 2', label: 'cameras move only with a hand on their handle'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

test(`${ID}: every object kind / records count composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const kind of ['key', 'cup', 'box']) for (const n of [2, 5]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {textVisibility: tv, items: [{id: 'X (fictional)', label: 'Item (fictional)', kind}], records: Array.from({length: n}, (_, i) => ({field: `F${i}`, value: i % 2 ? '' : 'v'})), sharedFacts: [], custodians: [{name: 'A', role: 'r'}, {name: 'B', role: 'r'}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.allReached) out.push(`${kind} ${n} ${w}x${h} ${tv}: ${s.problems}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the framings still differ`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {textVisibility: 'none'}}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      let text = 0;
      for (const u of [0, 0.4, 0.6, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      const s = x.getState({bounds: false}).semantic;
      res.push({text, fa: s.fieldA, fb: s.fieldB, pa: s.printStateA, pb: s.printStateB, ca: s.lookA.cam, cb: s.lookB.cam});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.fa).toBeGreaterThan(r.fb * 1.8);
    expect(r.pa === 'placed' && r.pb === 'placed').toBe(true);
    expect(Math.hypot(r.ca.x - r.cb.x, r.ca.y - r.cb.y)).toBeGreaterThan(40);
  }
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
