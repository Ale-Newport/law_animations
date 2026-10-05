// LAW-0379 — Inventario de objetos · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (only the changed object's row and
// therefore its line differ: diffCount <= 1, rowA/rowB), and no legal consequence is invented (neutral note only).
// Timing (u, 7.5 s): base 0–0.17 · changed row written in A 0.20–0.32 (ring in both 0.17–0.40) · parallel placing
// 0.40–0.77 · guide 0.78–0.86 · neutral note 0.80–0.88; still from 0.88.
// Coordinator decision 2026-10-06 (evidence-custody-05 iteration 2): long-labels-stress entry references shortened to "Entry 26-0x" (longer than baseline).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0379';

contractSuite(ID, {
  continuity: ['handA', 'handB', 'gripA', 'gripB'],
  semantic: [
    {at: 0.1, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.rowA === 0 && s.rowB === 0', label: 'base: A and B identical'},
    {at: 0.35, fn: 's.rowA === 1 && s.rowB === 0', label: 'change beat: the row is written in A only'},
    {at: 1, fn: 's.linkA === 1 && s.linkB === 0 && s.diffCount === 1 && s.guide === 1 && s.problems.length === 0', label: 'hold: only the changed object is joined in A, not in B; guide shown'},
    {at: 1, params: {changedItem: 1}, fn: 's.k === 0 && s.linkA === 1 && s.linkB === 0', label: 'the changed object is editable'},
    {at: 0.05, fn: 's.rowA === 0', label: 'seeking back restores the base state'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.scenarioA.label, p.scenarioB.label, p.changedFact, ...p.sharedFacts, ...p.items.map(i => i.id), ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.key];",
  content: 'return [p.changedFact, ...p.sharedFacts, ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'hands within reach; composition fits', [
  {at: times(0.4, 0.77, 0.02), fn: 's.allReached', label: 'both hands stay within reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
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

