// LAW-0382 — Copia de evidencia digital · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element (edge anchors), the order does not change on seek
// (relations drawn one after another, tracer follows the supplied order), and a relation is not drawn as causality by
// default (plain relations without arrowheads; arrows only for a supplied sequence / causal kind).
// Windows (u, 7 s): separate 0.03–0.15 · label chips 0.14–0.18 · relations drawn 0.19–0.42 · tracer 0.44–0.74 (copy
// written while the tracer passes the transfer window; focus 0.44–0.50 … 0.75–0.80) · hold.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0382';

contractSuite(ID, {
  continuity: ['orig', 'copy', 'tracer'],
  semantic: [
    {at: 0, fn: "s.phase === 'separate' && s.separated === 0 && s.copyCells === 0 && s.drawn.every(k => k === 0)", label: 'start: devices seated in the dock, copy blank, no relations'},
    {at: 0.18, fn: 's.separated === 1 && s.copyCells === 0', label: 'parts separated before anything is written'},
    {at: 0.3, fn: 's.drawn.some(k => k > 0) && s.drawn.some(k => k === 0)', label: 'relations are drawn one after another'},
    {at: 0.6, fn: 's.focusScale > 1 && s.tracerAt !== null && s.copyCells > 0', label: 'the tracer runs, the focus enlarges, the copy is being written'},
    {at: 1, fn: 's.drawn.every(k => k === 1) && s.arrows.length === 0 && s.focusScale === 1 && s.copyCells === s.cells && s.problems.length === 0', label: 'hold: every relation drawn, plain relations without arrows; copy written; fits'},
    {at: 1, params: {relationships: [{from: 'original', to: 'window', kind: 'relation'}, {from: 'window', to: 'copy', kind: 'sequence'}]}, fn: "s.arrows.length === 1 && s.arrows[0] === 'sequence'", label: 'an arrow only when a sequence is supplied'},
    {at: 0.62, fn: "s.order.join() === 'original,window,copy'", label: 'the tracer keeps the supplied order'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.elements.map(e => e.label), ...p.records.map(r => r.field), ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.label), p.relationLabels.relation, p.labels.key];",
  content: 'return [p.items[0].label, ...p.elements.map(e => e.label), ...p.records.map(r => r.field), ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'composition fits; connectors anchored at component edges', [
  {at: [1], presets: ['baseline-es'], tv: ['all'], fn: 's.textPx >= 19.5', label: 'baseline-es keeps text at >= 19.5 px (baseline floor) in every ratio'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 's.connectors.every(c => Math.hypot(c.a.x - c.b.x, c.a.y - c.b.y) > 40)', label: 'every connector has a readable length'},
]);

test(`${ID}: every device kind, row count and option composes at every ratio (labels on / off)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const kind of ['drive', 'stick', 'card']) for (const n of [2, 5]) combos.push({items: [{id: 'X (fictional)', label: 'Item (fictional)', kind}], records: Array.from({length: n}, (_, i) => ({field: `F${i + 1}`, value: i % 2 ? '' : `V${i + 1}`}))});
    combos.push({custodians: [{name: 'A (fictional)', role: 'r'}, {name: 'B (fictional)', role: 'r'}], timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}]});
    combos.push({timestamps: [{label: 'a', time: '1'}], custodians: [{name: 'A (fictional)', role: 'r'}]});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length) out.push(`${JSON.stringify(params).slice(0, 70)} ${w}x${h} ${tv}: ${s.problems} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text and the action still reads`, async ({page}) => {
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
      res.push({text, drawn: s1.drawn, cells: s1.copyCells === s1.cells, sep: s1.separated});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.drawn.every(k => k === 1)).toBe(true);
    expect(r.cells).toBe(true);
    expect(r.sep).toBe(1);
  }
});

test(`${ID}: visible text >= 16 px at every sampled moment (1080p, every ratio)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const params of [{}]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
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
