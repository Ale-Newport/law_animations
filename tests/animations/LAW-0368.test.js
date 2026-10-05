// LAW-0368 — Embalaje de prueba · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is the same seam — flap, strip,
// number plate — drawn at the context's coordinates and scaled from the source rectangle), the change is localised
// (only the focus datum changes: seal state with its dependent slit, or the seal number; a "before" trace stays) and
// seeking back restores the previous datum exactly.
// Windows (u, 8 s): context 0–0.20 (the pouch steps aside 0.10–0.19) · lens opens 0.20–0.32 (context copy of the datum
// hidden from 0.20) · ring 0.34–0.40 · old value lifts 0.45–0.51 · before-trace 0.50–0.56 · new value (and slit)
// 0.54–0.62 · new value still 0.62–0.75 · lens closes 0.75–0.85 · context after state from 0.85 · Δ 0.86–0.92 ·
// legend 0.85–0.90 · the pouch returns to its centred rest 0.85–0.93; still from 0.93.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0368';

contractSuite(ID, {
  continuity: ['seam'],
  semantic: [
    {at: 0, fn: "s.phase === 'context' && s.shown === 'before' && s.lensP === 0 && s.ctxBefore === 1 && s.marker === 0 && s.slitCtx === 0", label: 'context: before value, strip unbroken, no lens, no marker'},
    {at: 0.4, fn: 's.lensP === 1 && s.ctxBefore === 0 && s.ctxAfter === 0 && s.lensBefore === 1 && s.lensAfter === 0 && s.slitLens === 0', label: 'lens open: the datum is shown only in the lens (before value)'},
    {at: 0.7, fn: "s.shown === 'after' && s.lensAfter === 1 && s.lensBefore === 0 && s.lensP === 1 && s.slitLens === 1", label: 'substituted: the new value and its dependent slit are shown in the lens, still'},
    {at: 1, fn: 's.lensP === 0 && s.ctxAfter === 1 && s.ctxBefore === 0 && s.slitCtx === 1 && s.marker === 1 && s.problems.length === 0 && s.zoom >= 1.5', label: 'return: context shows the after state with the Δ marker; composition fits'},
    {at: 0.1, fn: "s.shown === 'before' && s.ctxBefore === 1 && s.ctxAfter === 0 && s.slitCtx === 0", label: 'seeking back restores the before value exactly'},
    {at: 0.4, fn: 's.restK === 0', label: 'the pouch has stepped aside while the lens is open'},
    {at: 1, fn: 's.restK === 1', label: 'context and hold: the pouch is centred and enlarged on the bench'},
    {at: 1, params: {focusTarget: 'sealNumber', beforeValue: 'P-1', afterValue: 'P-2'}, fn: "s.focus === 'sealNumber' && s.value === 'P-2' && s.slitCtx === 0 && s.slitLens === 0", label: 'the seal-number substitution changes only the number (no slit)'},
  ],
});

suppliedTextSuite(ID, {
  at: [0.7],
  fields: "return [p.items[0].id, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), p.afterValue, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.labels.key];",
  content: "return [...p.records.map(r => r.field), p.afterValue];",
  captions: 'return [];',
});

ratioChecks(ID, 'real magnification; one copy of the datum at a time; composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (panel text, lens text >= 16 px, lens size)'},
  {at: [0.4], fn: 's.zoom >= 1.5 && s.dest.w >= s.source.w * 1.5', label: 'the lens magnifies >= 1.5x'},
  {at: times(0.2, 0.849, 0.01), fn: 's.ctxBefore === 0 && s.ctxAfter === 0', label: 'while the lens is open the context copy of the datum is hidden'},
  {at: times(0.62, 0.75, 0.01), fn: 's.lensAfter === 1 && s.lensBefore === 0', label: 'the new value is readable and still for >= ~1 s'},
  {at: [0.4], dom: "(() => { const el = svg.querySelector('[data-node=lens-border]'); const b = el.getBBox(); const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM()); const vb = svg.viewBox.baseVal; return Math.min(b.width * m.a, b.height * m.d) / Math.min(vb.width, vb.height) >= 0.35; })()", label: 'the lens is a real inspection window (smaller side >= 35 % of the frame short side, in viewBox units)'},
]);

test(`${ID}: every records count (2..5), custodians, object kind and focus composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [2, 3, 4, 5]) for (const kind of ['key', 'cup', 'box']) for (const focus of ['sealState', 'sealNumber']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {textVisibility: tv, records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: `Value ${i + 1}`})), focusTarget: focus, beforeValue: focus === 'sealNumber' ? 'P-1001' : '', afterValue: focus === 'sealNumber' ? 'P-1010' : 'New value', items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}],
        custodians: n % 2 ? [{name: 'A (fictional)', role: 'Role'}, {name: 'B (fictional)', role: 'Role'}] : [{name: 'A (fictional)', role: 'Role'}], timestamps: n > 4 ? [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}] : [{label: 'a', time: '1'}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${n} ${kind} ${focus} ${w}x${h} ${tv}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the lens still opens and the seal state changes`, async ({page}) => {
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
      for (const u of [0, 0.4, 0.7, 1]) {
        x.seek(u * x.durationMs);
        text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      }
      x.seek(0.4 * x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s2 = x.getState({bounds: false}).semantic;
      res.push({text, lens: s1.lensP, slit: s2.slitCtx, marker: s2.marker});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.lens).toBe(1);
    expect(r.slit).toBe(1);
    expect(r.marker).toBe(1);
  }
});

// Text size over time: no visible lens text under 16 px while the lens grows or shrinks.
test(`${ID}: visible text >= 16 px at every sampled moment (1080p, every ratio)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      const k = 1080 / Math.min(w, h);
      for (let i = 0; i <= 50; i++) {
        x.seek((i / 50) * x.durationMs);
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m0 = t.getScreenCTM(); if (!m0) continue;
          const m = svg.getScreenCTM().inverse().multiply(m0); // viewBox units (= px of the w×h frame)
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
