// LAW-0372 — Transferencia de custodia · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens shows the focus sheet drawn in the same
// coordinates as the context, with the room stepped aside), the change is localised (one row of one sheet: its ink /
// printed value only) and seeking back restores the before value exactly.
// Timing (u, 8 s): context 0–0.10 · aside 0.10–0.19 · lens opens 0.20–0.32 · ring 0.34–0.40 · old value fades
// 0.45–0.51 · trace 0.50–0.56 · new value 0.54–0.62 (held to 0.75) · lens closes 0.75–0.84 · room back 0.85–0.93 ·
// Δ marker 0.86–0.92; still from 0.93.
// Legal: the substituted value is only the supplied alternative; no inference about validity, responsibility or outcome.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0372';

contractSuite(ID, {
  semantic: [
    {at: 0, fn: "s.phase === 'context' && s.open === 0 && s.aside === 0 && s.datum === 'before' && s.contextRow === 'before-ink' && s.marker === 0 && s.atB", label: 'context: the room after the hand-off, before value written'},
    {at: 0.3, fn: "s.open > 0.5 && s.contextRow === 'hidden' && s.datum === 'before'", label: 'the lens opens and the context copy of the row is hidden in step'},
    {at: 0.42, fn: 's.open === 1 && s.ring === 1 && s.zoom >= 1.6 && s.lensShort >= 0.34', label: 'a real magnification (>= 1.6x here) of a large lens'},
    {at: 0.48, fn: "s.datum === 'changing' && s.oldValue < 1", label: 'the old value lifts and fades'},
    {at: 0.7, fn: "s.datum === 'after' && s.newValue === 1 && s.trace === 1 && s.open === 1", label: 'the new value holds with the before trace'},
    {at: 1, fn: "s.phase === 'return' && s.open === 0 && s.aside === 0 && s.contextRow === 'blank' && s.marker === 1 && s.problems.length === 0 && s.allReached", label: 'return: the context shows the after state (blank row) and the Δ marker'},
    {at: 1, params: {afterValue: 'J. Ruiz'}, fn: "s.contextRow === 'after-ink'", label: 'a written after value shows as new ink in the context'},
    {at: 0.12, fn: "s.datum === 'before' && s.contextRow === 'before-ink' && s.marker === 0 && s.newValue === 0", label: 'seeking back restores the before value exactly'},
    {at: 0.3, params: {focusTarget: 'a2'}, fn: "s.focus.sheet === 'a' && s.focus.row === 1", label: 'the focus row follows focusTarget'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.contextLabels.context, p.contextLabels.marker, ...(p.beforeValue ? [p.beforeValue] : []), ...(p.afterValue ? [p.afterValue] : [])];",
  content: 'return [p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name), ...(p.afterValue ? [p.afterValue] : [])];',
  captions: 'return [p.contextLabels.context];',
});

ratioChecks(ID, 'lens size, magnification and composition', [
  {at: [0.42], fn: 's.zoom >= 1.5 && s.lensShort >= 0.34', label: 'the lens is a real, large magnification'},
  {at: [0, 1], fn: 's.problems.length === 0 && s.atB', label: 'a composition fits'},
  {at: times(0.2, 0.84, 0.02), fn: "s.open < 0.001 || s.contextRow === 'hidden'", label: 'the changed row is shown in one place at a time'},
]);

// While the lens is open the context copy is hidden; lens text never renders under 16 px; the new value is still >= 400 ms.
test(`${ID}: visible text >= 16 px at 1080p at every sampled time (lens included)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready;
      const svg = x.element;
      const k = 1080 / Math.min(w, h);
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      for (let i = 0; i <= 50; i++) {
        x.seek(x.durationMs * i / 50);
        const rootM = svg.getScreenCTM();
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = rootM.inverse().multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
          if (px < 15.9) bad.push(`${w}x${h} u=${i / 50}: ${t.textContent.slice(0, 20)} ${px.toFixed(1)}`);
        }
      }
      x.destroy(); el.remove();
    }
    return bad;
  }, ID);
  expect(out.slice(0, 5)).toEqual([]);
});

test(`${ID}: every focus row and count composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const [na, nb] of [[1, 1], [3, 3], [3, 1], [1, 3]]) for (const ft of ['b1', 'b3', 'a2']) {
      combos.push({focusTarget: ft, records: [...Array.from({length: na}, (_, i) => ({log: 'a', field: `Field A${i + 1}`, value: `Value ${i + 1}`})), ...Array.from({length: nb}, (_, i) => ({log: 'b', field: `Field B${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`}))]});
    }
    for (const kind of ['key', 'cup', 'box']) combos.push({items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}], afterValue: 'J. Ruiz', beforeValue: ''});
    combos.push({timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}], detailGeometry: {zoom: 2, placement: 'top'}});
    combos.push({detailGeometry: {zoom: 1.5, placement: 'left'}});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs * 0.42, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || s.zoom < 1.5 || s.lensShort < 0.3 || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 70)} ${w}x${h} ${tv}: ${s.problems.join(',')} z=${s.zoom} short=${s.lensShort}`);
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
