// LAW-0376 — Registro fotográfico · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is the same focus print — image,
// badge and caption tab — drawn at the board's coordinates and scaled from the source rectangle), the change is
// localised (only the focus datum changes: caption or photo number; a "before" trace stays) and seeking back restores
// the previous datum exactly.
// Windows (u, 8 s): context 0–0.20 (bench steps aside 0.10–0.19) · lens opens 0.20–0.32 (context copy hidden from
// 0.20) · ring 0.34–0.40 · old value lifts 0.45–0.51 · trace 0.50–0.56 · new value 0.54–0.62 · still 0.62–0.75 · lens
// closes 0.75–0.85 · context after-state from 0.85 · Δ 0.86–0.92 · legend 0.85–0.90 · bench back 0.85–0.93.
// Coordinator decision (2026-10-05, coordinator message to the evidence-custody-04 builder, under the standing rule
// 2026-09-26 / AUTHORING item 20): long-labels-stress lengths/counts are capped to the longest values that keep 1:1 at its
// floors with text >= 16 px; every field stays at least as long as baseline and counts stay >= baseline.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0376';

contractSuite(ID, {
  continuity: ['focusPrint'],
  semantic: [
    {at: 0, fn: "s.phase === 'context' && s.shown === 'before' && s.lensP === 0 && s.ctxBefore === 1 && s.marker === 0", label: 'context: before value, no lens, no marker'},
    {at: 0.4, fn: 's.lensP === 1 && s.ctxBefore === 0 && s.ctxAfter === 0 && s.lensBefore === 1 && s.lensAfter === 0', label: 'lens open: the datum is shown only in the lens'},
    {at: 0.7, fn: "s.shown === 'after' && s.lensAfter === 1 && s.lensBefore === 0 && s.lensP === 1", label: 'substituted: the new value is shown in the lens, still'},
    {at: 1, fn: 's.lensP === 0 && s.ctxAfter === 1 && s.ctxBefore === 0 && s.marker === 1 && s.problems.length === 0 && s.zoom >= 1.5', label: 'return: after value with the Δ marker; composition fits'},
    {at: 0.1, fn: "s.shown === 'before' && s.ctxBefore === 1 && s.ctxAfter === 0", label: 'seeking back restores the before value exactly'},
    {at: 0.4, fn: 's.restK === 0', label: 'the bench has stepped aside while the lens is open'},
    {at: 1, params: {focusTarget: 'number', beforeValue: '2', afterValue: '2A'}, fn: "s.focus === 'number' && s.value === '2A' && s.problems.length === 0", label: 'the photo-number substitution works'},
  ],
});

suppliedTextSuite(ID, {
  at: [0.7],
  fields: "return [p.items[0].id, ...p.views.map(v => v.label), ...p.records.map(r => r.field), p.afterValue, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.labels.key];",
  content: 'return [...p.records.map(r => r.field), ...p.views.map(v => v.label)];',
  captions: 'return [];',
});

ratioChecks(ID, 'real magnification; one copy of the datum at a time; composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [0.4], fn: 's.zoom >= 1.5 && s.dest.w >= s.source.w * 1.5', label: 'the lens magnifies >= 1.5x'},
  {at: times(0.2, 0.849, 0.01), fn: 's.ctxBefore === 0 && s.ctxAfter === 0', label: 'while the lens is open the context copy of the datum is hidden'},
  {at: times(0.62, 0.75, 0.01), fn: 's.lensAfter === 1 && s.lensBefore === 0', label: 'the new value is readable and still for >= ~1 s'},
  {at: [0.4], dom: "(() => { const el = svg.querySelector('[data-node=lens-border]'); const b = el.getBBox(); const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM()); const vb = svg.viewBox.baseVal; return Math.min(b.width * m.a, b.height * m.d) / Math.min(vb.width, vb.height) >= 0.35; })()", label: 'the lens is a real inspection window (smaller side >= 35 % of the frame short side)'},
]);

test(`${ID}: every view count, records count, object kind and focus composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const nv of [2, 3]) for (const n of [2, 5]) for (const kind of ['key', 'cup', 'box']) for (const focus of ['caption', 'number']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {textVisibility: tv, views: [{label: 'A', target: 'scene'}, {label: 'B', target: 'object'}, {label: 'C', target: 'tag'}].slice(0, nv), records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: `Value ${i + 1}`})), focusTarget: focus, beforeValue: focus === 'number' ? '2' : 'Old caption', afterValue: focus === 'number' ? '2A' : 'New caption', items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${nv} ${n} ${kind} ${focus} ${w}x${h} ${tv}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the lens still opens and the datum changes`, async ({page}) => {
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

test(`${ID}: visible text >= 16 px at every sampled moment (1080p, every ratio)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const params of [{}, {focusTarget: 'number', beforeValue: '2', afterValue: '2A'}]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      const k = 1080 / Math.min(w, h);
      for (let i = 0; i <= 50; i++) {
        x.seek((i / 50) * x.durationMs);
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b) * k;
          if (px < 15.9) out.push(`${w}x${h} u=${i / 50} ${t.textContent.slice(0, 20)} ${px.toFixed(1)}`);
        }
      }
      x.destroy(); el.remove();
    }
    return out.slice(0, 20);
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
