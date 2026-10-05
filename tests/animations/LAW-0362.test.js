// LAW-0362 — Etiquetado de indicio · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its component (anchored to the component's edge box, incl. its
// label), the order does not change with seeking (the tracer visits the supplied traversal order deterministically),
// and a plain relation is never drawn as causation (no arrowheads unless the supplied kind has one; no causal link
// in the shipped presets).
// Timing (u): separate 0.03–0.17 · labels 0.17–0.21 · connectors drawn in sequence 0.18–0.43 · tracer 0.43–0.75
// (focus enlarged 0.43–0.49, back 0.75–0.80) · hold from 0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0362';

contractSuite(ID, {
  continuity: ['tracer', 'p_object', 'p_chain', 'p_tag', 'p_rows', 'p_bag', 'p_custodian'],
  semantic: [
    {at: 0, fn: "s.phase === 'separate' && s.separated === 0", label: 'start: the components are assembled'},
    {at: 0.2, fn: 's.separated === 1', label: 'the components are apart before relations are drawn'},
    {at: 0.3, fn: 's.connectors.every(c => c.okA && c.okB)', label: 'every connector ends on its own component'},
    {at: 0.3, fn: 's.arrows.every(k => k !== "relation")', label: 'plain relations carry no arrowhead'},
    {at: 0.5, fn: "s.phase === 'trace' && s.focusScale > 1.1", label: 'tracer running; focus component enlarged'},
    {at: 0.44, fn: 's.tracerAt === s.order[0]', label: 'the tracer starts at the first supplied component'},
    {at: 0.74, fn: 's.tracerAt === s.order[s.order.length - 1]', label: 'the tracer ends at the last supplied component'},
    {at: 1, fn: "s.phase === 'hold' && s.focusScale === 1 && s.problems.length === 0", label: 'hold: diagram complete; composition fits'},
    {at: 1, params: {relationships: [{from: 'object', to: 'chain', kind: 'causal'}]}, fn: 's.connectors.length === 1 && s.arrows[0] === "causal"', label: 'a causal arrow appears only when supplied'},
    {at: 0.1, fn: "s.phase === 'separate'", label: 'seeking back restores the separation phase'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.elements.map(e => e.label), ...p.records.map(r => r.field), p.items[0].id, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.labels.key];",
  content: 'return [...p.elements.map(e => e.label), ...p.records.map(r => r.field)];',
  captions: 'return [];',
});

ratioChecks(ID, 'connectors land; order stable; composition fits', [
  {at: [0.45, 1], fn: 's.connectors.every(c => c.okA && c.okB)', label: 'connectors end on their components'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: times(0.43, 0.75, 0.04), fn: 's.order.includes(s.tracerAt)', label: 'the tracer is always on a supplied component route'},
]);

test(`${ID}: every records count (2..5), relationship count (1..8) and object kind composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const all = [['object', 'chain'], ['chain', 'tag'], ['tag', 'rows'], ['object', 'bag'], ['custodian', 'tag'], ['custodian', 'bag'], ['bag', 'rows'], ['chain', 'custodian']];
    const out = [];
    for (const n of [2, 5]) for (const nr of [1, 4, 8]) for (const kind of ['key', 'cup', 'box']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const params = {records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: `Value ${i + 1}`})), relationships: all.slice(0, nr).map(([a, b]) => ({from: a, to: b, kind: 'relation'})), items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.connectors.every(c => c.okA && c.okB)) out.push(`${n} ${nr} ${kind} ${w}x${h}: ${s.problems.join(',')}`);
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
