// LAW-0364 — Etiquetado de indicio · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is the same tag drawn at the
// context's coordinates, scaled from the source rectangle), the change is localised (only the focus row's value
// changes: before → after, with a "before" trace), and seeking back restores the previous datum exactly.
// Windows (u): context 0–0.20 · lens opens 0.20–0.32 (context copy of the row hidden from 0.20) · old value lifts
// 0.45–0.51 · before-trace 0.50–0.56 · new value 0.54–0.62 · new value still 0.62–0.75 · lens closes 0.75–0.85 ·
// context row in the after state from 0.85 · Δ marker 0.84–0.90 · legend lines 0.85–0.90; still from 0.90.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0364';

contractSuite(ID, {
  continuity: ['hole'],
  semantic: [
    {at: 0, fn: "s.phase === 'context' && s.shown === 'before' && s.lensP === 0 && s.ctxBefore === 1 && s.marker === 0", label: 'context: before value, no lens, no marker'},
    {at: 0.4, fn: "s.lensP === 1 && s.ctxBefore === 0 && s.ctxAfter === 0 && s.lensBefore === 1 && s.lensAfter === 0", label: 'lens open: the datum is shown only in the lens (before value)'},
    {at: 0.7, fn: "s.shown === 'after' && s.lensAfter === 1 && s.lensBefore === 0 && s.lensP === 1", label: 'substituted: the new value is shown in the lens, still'},
    {at: 1, fn: "s.lensP === 0 && s.ctxAfter === 1 && s.ctxBefore === 0 && s.marker === 1 && s.problems.length === 0 && s.zoom >= 1.5", label: 'return: context shows the after state with the Δ marker; composition fits'},
    {at: 0.1, fn: "s.shown === 'before' && s.ctxBefore === 1 && s.ctxAfter === 0", label: 'seeking back restores the before value exactly'},
    {at: 1, params: {focusTarget: 0, beforeValue: 'E-01', afterValue: 'E-02'}, fn: 's.focus === 0 && s.value === "E-02"', label: 'the supplied focus row and values alone decide the substitution'},
  ],
});

suppliedTextSuite(ID, {
  at: [0.7],
  fields: "return [p.items[0].id, ...p.records.map(r => r.field), ...p.records.filter((r, i) => i !== p.focusTarget).map(r => r.value), p.afterValue, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.labels.key];",
  content: "return [...p.records.map(r => r.field), p.afterValue];",
  captions: 'return [];',
});

ratioChecks(ID, 'real magnification; one copy of the datum at a time; composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (panel text, bag, lens text >= 16 px)'},
  {at: [0.4], fn: 's.zoom >= 1.5 && s.dest.w >= s.source.w * 1.5', label: 'the lens magnifies >= 1.5x'},
  {at: times(0.2, 0.849, 0.01), fn: 's.ctxBefore === 0 && s.ctxAfter === 0', label: 'while the lens is open the context copy of the row is hidden'},
  {at: times(0.62, 0.75, 0.01), fn: 's.lensAfter === 1 && s.lensBefore === 0', label: 'the new value is readable and still for >= ~1 s'},
  {at: [0.4], dom: "(() => { const el = svg.querySelector('[data-node=lens-border]'); const b = el.getBBox(); const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM()); const vb = svg.viewBox.baseVal; return Math.min(b.width * m.a, b.height * m.d) / Math.min(vb.width, vb.height) >= 0.35; })()", label: 'the lens is a real inspection window (smaller side >= 35 % of the frame short side, in viewBox units)'},
]);

test(`${ID}: every records count (2..5) and focus row composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [2, 3, 4, 5]) for (const kind of ['key', 'cup', 'box']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const params = {records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: `Value ${i + 1}`})), focusTarget: n - 1, beforeValue: '', afterValue: 'New value', items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${n} ${kind} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the lens still opens and the row changes`, async ({page}) => {
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
      for (const u of [0, 0.4, 0.7, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0.4 * x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s2 = x.getState({bounds: false}).semantic;
      res.push({text, lens: s1.lensP, after: s2.ctxAfter, marker: s2.marker});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.lens).toBe(1);
    expect(r.after).toBe(1);
    expect(r.marker).toBe(1);
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
