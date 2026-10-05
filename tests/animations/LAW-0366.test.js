// LAW-0366 — Embalaje de prueba · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its part (anchored to the part's edge box, incl. its caption), the
// order does not change with seeking (the tracer visits the supplied traversal order deterministically) and a plain
// relation is never drawn as causation (no arrowheads unless the supplied kind has one; no causal link in the presets).
// Timing (u, 7.5 s): separate 0.03–0.17 (parts leave their true places on the assembled pouch) · captions 0.17–0.21 ·
// connectors drawn in sequence 0.18–0.43 · tracer 0.43–0.75 (focus enlarged 0.43–0.49, back 0.75–0.80) · hold from 0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0366';

contractSuite(ID, {
  continuity: ['tracer', 'p_object', 'p_bag', 'p_flap', 'p_seal', 'p_label', 'p_chain'],
  semantic: [
    {at: 0, fn: "s.phase === 'separate' && s.separated === 0 && !s.printed && s.s_object < 1", label: 'start: the pouch is assembled; printed text hidden'},
    {at: 0.2, fn: 's.separated === 1 && s.printed && s.s_label === 1', label: 'the parts are apart and full size before relations are drawn'},
    {at: 0.3, fn: 's.connectors.every(c => c.okA && c.okB)', label: 'every connector ends on its own part'},
    {at: 0.3, fn: 's.arrows.every(k => k !== "relation")', label: 'plain relations carry no arrowhead'},
    {at: 0.5, fn: "s.phase === 'trace' && s.focusScale > 1.1", label: 'tracer running; focus part enlarged'},
    {at: 0.44, fn: 's.tracerAt === s.order[0]', label: 'the tracer starts at the first supplied part'},
    {at: 0.74, fn: 's.tracerAt === s.order[s.order.length - 1]', label: 'the tracer ends at the last supplied part'},
    {at: 1, fn: "s.phase === 'hold' && s.focusScale === 1 && s.problems.length === 0", label: 'hold: drawing complete; composition fits'},
    {at: 1, params: {relationships: [{from: 'object', to: 'bag', kind: 'causal'}]}, fn: 's.connectors.length === 1 && s.arrows[0] === "causal"', label: 'a causal arrow appears only when supplied'},
    {at: 0.1, fn: "s.phase === 'separate' && !s.printed", label: 'seeking back restores the separation phase'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.elements.map(e => e.label), ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), p.items[0].id, p.sealNumber, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.labels.key];",
  content: 'return [...p.elements.map(e => e.label), ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'connectors land; order stable; composition fits', [
  {at: [0.45, 1], fn: 's.connectors.every(c => c.okA && c.okB)', label: 'connectors end on their parts'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: times(0.43, 0.75, 0.04), fn: 's.order.includes(s.tracerAt)', label: 'the tracer is always on a supplied part route'},
  {at: times(0, 0.169, 0.01), fn: '!s.printed', label: 'printed text stays hidden while the parts grow'},
]);

test(`${ID}: every records count (2..5), custodians (1..2), relationship count (1..8) and object kind composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const all = [['object', 'bag'], ['bag', 'flap'], ['flap', 'seal'], ['bag', 'label'], ['label', 'chain'], ['seal', 'label'], ['object', 'flap'], ['bag', 'chain']];
    const out = [];
    for (const n of [2, 5]) for (const nc of [1, 2]) for (const nr of [1, 4, 8]) for (const kind of ['key', 'cup', 'box']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {textVisibility: tv, records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: `Value ${i + 1}`})), custodians: Array.from({length: nc}, (_, i) => ({name: `Person ${i + 1} (fictional)`, role: 'Role'})),
        relationships: all.slice(0, nr).map(([a, b]) => ({from: a, to: b, kind: 'relation'})), items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.connectors.every(c => c.okA && c.okB)) out.push(`${n} ${nc} ${nr} ${kind} ${w}x${h} ${tv}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the parts still come apart and the tracer runs`, async ({page}) => {
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
      for (const u of [0, 0.3, 0.6, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, moved: Math.hypot(s1.p_seal.x - s0.p_seal.x, s1.p_seal.y - s0.p_seal.y), ok: s1.connectors.every(c => c.okA && c.okB)});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(60);
    expect(r.ok).toBe(true);
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
