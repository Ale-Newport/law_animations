// LAW-0380 — Inventario de objetos · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (lens content is the station drawn at the context's
// coordinates, scaled from the source rectangle), the change is localised (only the focus tag's reference and its line
// change) and seeking back restores the previous datum exactly.
// Windows (u, 8 s): context 0–0.20 · lens opens 0.20–0.32 (context copy hidden from 0.20) · old value lifts 0.45–0.51 ·
// old line retracts 0.46–0.54 · trace 0.50–0.56 · new value 0.54–0.62 · new line 0.58–0.68 · still to 0.75 · lens closes
// 0.75–0.85 · Δ marker and state 0.86–0.92; still from 0.92.
// Coordinator decision 2026-10-06 (evidence-custody-05 iteration 2): long-labels-stress entry references shortened to "Entry 26-0x" (longer than baseline).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0380';

contractSuite(ID, {
  continuity: ['tip'],
  semantic: [
    {at: 0, fn: "s.phase === 'context' && s.shown === 'before' && s.ctxBefore === 1 && s.lensP === 0 && s.marker === 0 && s.linkedTo === s.beforeRow", label: 'context: before value, joined to its row, no lens'},
    {at: 0.4, fn: 's.lensP === 1 && s.ctxBefore === 0 && s.ctxAfter === 0 && s.lensBefore === 1', label: 'lens open: datum only in the lens'},
    {at: 0.7, fn: "s.shown === 'after' && s.lensAfter === 1 && s.lensBefore === 0 && s.linkedTo === s.afterRow", label: 'substituted: new value; line follows the new reference'},
    {at: 1, fn: 's.lensP === 0 && s.ctxAfter === 1 && s.ctxBefore === 0 && s.marker === 1 && s.zoom >= 1.5 && s.problems.length === 0', label: 'return: after state with the Δ marker; composition fits'},
    {at: 0.1, fn: "s.shown === 'before' && s.ctxBefore === 1 && s.linkedTo === s.beforeRow", label: 'seeking back restores the before value exactly'},
    {at: 1, params: {afterValue: 'No. 3'}, fn: 's.afterRow === 2 && s.linkedTo === 2', label: 'an after value carried by a row redraws the line to that row'},
  ],
});

suppliedTextSuite(ID, {
  at: [0.7],
  fields: "return [p.afterValue, ...p.records.map(r => r.value), ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.labels.key];",
  content: 'return [...p.records.map(r => r.value), p.afterValue];',
  captions: 'return [];',
});

ratioChecks(ID, 'real magnification; one copy of the datum at a time; composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (lens size, zoom)'},
  {at: [0.4], fn: 's.zoom >= 1.5 && s.dest.w >= s.source.w * 1.5', label: 'the lens magnifies >= 1.5x'},
  {at: times(0.2, 0.849, 0.01), fn: 's.ctxBefore === 0 && s.ctxAfter === 0', label: 'while the lens is open the context copy of the datum is hidden'},
  {at: times(0.62, 0.75, 0.01), fn: 's.lensAfter === 1 && s.lensBefore === 0', label: 'the new value is readable and still'},
  {at: [0.4], dom: "(() => { const el = svg.querySelector('[data-node=lens-border]'); const b = el.getBBox(); const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM()); const vb = svg.viewBox.baseVal; return Math.min(b.width * m.a, b.height * m.d) / Math.min(vb.width, vb.height) >= 0.35; })()", label: 'lens smaller side >= 35 % of the frame short side'},
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

