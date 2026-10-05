// LAW-0378 — Inventario de objetos · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element (edge box incl. caption), the order does not change on
// seek (tracer follows the supplied traversal order), and a relation is never drawn as causation (no arrowhead on a
// plain relation; no causal link unless supplied).
// Timing (u, 7 s): separate 0.02–0.17 · captions 0.16–0.20 · connectors in sequence 0.18–0.43 · tracer 0.43–0.75
// (focus enlarged 0.43–0.49, back 0.75–0.80) · hold from 0.80.
// Coordinator decision 2026-10-06 (evidence-custody-05 iteration 2): long-labels-stress entry references shortened to "Entry 26-0x" (longer than baseline).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0378';

contractSuite(ID, {
  continuity: ['tracer', 'p_bag', 'p_object', 'p_cell', 'p_chain', 'p_tag', 'p_row'],
  semantic: [
    {at: 0, fn: "s.phase === 'separate' && s.separated === 0 && !s.printed", label: 'start: assembled, printed text hidden'},
    {at: 0.2, fn: 's.separated === 1 && s.printed', label: 'parts apart and full size before relations are drawn'},
    {at: 0.3, fn: 's.connectors.every(c => c.okA && c.okB)', label: 'every connector ends on its own part'},
    {at: 0.3, fn: "!s.arrows.includes('causal')", label: 'no causal link unless supplied'},
    {at: 0.5, fn: "s.phase === 'trace' && s.focusScale > 1.1", label: 'tracer running; focus part enlarged'},
    {at: 0.44, fn: 's.tracerAt === s.order[0]', label: 'the tracer starts at the first supplied part'},
    {at: 0.75, fn: 's.tracerAt === s.order[s.order.length - 1]', label: 'the tracer ends at the last supplied part'},
    {at: 1, fn: "s.phase === 'hold' && s.focusScale === 1 && s.problems.length === 0", label: 'hold; composition fits'},
    {at: 1, params: {relationships: [{from: 'tag', to: 'row', kind: 'causal'}]}, fn: "s.arrows.length === 1 && s.arrows[0] === 'causal'", label: 'a causal arrow appears only when supplied'},
    {at: 0.1, fn: "s.phase === 'separate' && !s.printed", label: 'seeking back restores the separation phase'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.elements.map(e => e.label), p.items[0].id, p.records[0].value, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.labels.key];",
  content: 'return [...p.elements.map(e => e.label), ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'connectors land; order stable; composition fits', [
  {at: [0.45, 1], fn: 's.connectors.every(c => c.okA && c.okB)', label: 'connectors end on their parts'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: times(0, 0.169, 0.01), fn: '!s.printed', label: 'printed text hidden while parts grow'},
]);

test(`${ID}: cold create() of long-labels-stress stays under ~1 s in every ratio`, async ({browser}) => {
  const stress = presetsFor(ID).find(p => p.name === "long-labels-stress").params;
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto("/tests/harness/host.html");
    await page.waitForFunction(() => document.body.dataset.ready === "1");
    const ms = await page.evaluate(async ([id, params, w, h]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement("div"); document.getElementById("slots").appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params}); await x.ready; x.seek(x.durationMs);
      const dt = performance.now() - t0; x.destroy(); return dt;
    }, [ID, stress, w, h]);
    await page.close();
    expect(ms).toBeLessThan(1000);
  }
});

test(`${ID}: labels hidden — no visible text at any sampled time`, async ({page}) => {
  await page.goto("/tests/harness/host.html");
  await page.waitForFunction(() => document.body.dataset.ready === "1");
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    let text = 0;
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement("div"); document.getElementById("slots").appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {textVisibility: "none"}}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute("opacity"); if (a) o *= parseFloat(a); } return o; };
      for (const u of [0, 0.3, 0.5, 0.7, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll("[data-layer=\"scene\"] text")].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.destroy(); el.remove();
    }
    return text;
  }, ID);
  expect(out).toBe(0);
});

test(`${ID}: every item count (2..5) composes at every ratio, labels on and off`, async ({page}) => {
  await page.goto("/tests/harness/host.html");
  await page.waitForFunction(() => document.body.dataset.ready === "1");
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const kinds = ["key", "cup", "box", "phone", "wallet", "notebook"];
    const out = [];
    for (const n of [2, 3, 4, 5]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ["all", "none"]) {
      const params = {textVisibility: tv, items: Array.from({length: n}, (_, i) => ({id: `Object ${i + 1} (fictional)`, label: "Item", kind: kinds[(i + n) % 6]})), records: Array.from({length: n}, (_, i) => ({field: `No. ${i + 1}`, value: `Item ${i + 1}`})), custodians: n % 2 ? [{name: "A (fictional)", role: "Role"}, {name: "B (fictional)", role: "Role"}] : [{name: "A (fictional)", role: "Role"}], timestamps: n > 3 ? [{label: "a", time: "1"}, {label: "b", time: "2"}, {label: "c", time: "3"}] : [{label: "a", time: "1"}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${n} ${w}x${h} ${tv}: ${s.problems.join(",")}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join("\n")).toEqual([]);
});

