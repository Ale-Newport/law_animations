// LAW-0374 — Registro fotográfico · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): spatial composition with object, tag and connectors anchored to their edges; continuity of
// the camera, the prints and the tracer; recognisable with labels hidden (two framings, two prints, relations drawn).
// Windows (u, 7 s): camera to far station 0.02–0.07, exposure 0.075–0.09, print 1 flies 0.09–0.17 · near station
// 0.15–0.20, exposure 0.205–0.22, print 2 flies 0.22–0.30 · label chips 0.28–0.32 · relations drawn 0.31–0.50 ·
// tracer 0.50–0.76 (focus enlarged 0.50–0.56 … 0.76–0.81) · hold.
// Legal: plain relations have no arrowhead; causal only when supplied; no doctrine.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0374';

contractSuite(ID, {
  continuity: ['cam', 'print0', 'print1', 'tracer'],
  semantic: [
    {at: 0, fn: "s.phase === 'assemble' && s.prints.every(p => p === 'none') && s.drawn.every(k => k === 0)", label: 'start: no prints, no relations'},
    {at: 0.12, fn: "s.prints[0] === 'flying' && s.prints[1] === 'none'", label: 'the overview print exists only after the first exposure'},
    {at: 0.31, fn: "s.prints.every(p => p === 'placed') && s.fields[0] > s.fields[1] * 1.8", label: 'both prints placed; overview field wider than detail field'},
    {at: 0.4, fn: 's.drawn.some(k => k > 0) && s.drawn.some(k => k === 0)', label: 'relations are drawn one after another'},
    {at: 0.58, fn: "s.focusScale > 1 && s.tracerAt !== null", label: 'the tracer runs and the focus component enlarges'},
    {at: 1, fn: 's.drawn.every(k => k === 1) && s.arrows.length === 0 && s.focusScale === 1 && s.problems.length === 0', label: 'hold: every supplied relation drawn, plain relations without arrows; composition fits'},
    {at: 1, params: {relationships: [{from: 'camera', to: 'overview', kind: 'causal'}, {from: 'overview', to: 'object', kind: 'relation'}]}, fn: "s.arrows.length === 1 && s.arrows[0] === 'causal'", label: 'a causal arrow only when supplied'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.elements.map(e => e.label), ...p.records.map(r => r.field), ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.label), p.relationLabels.relation, p.labels.key];",
  content: 'return [p.items[0].label, ...p.elements.map(e => e.label), ...p.records.map(r => r.field), ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'composition fits; connectors anchored at component edges', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 's.connectors.every(c => Math.hypot(c.a.x - c.b.x, c.a.y - c.b.y) > 20)', label: 'every connector has a readable length'},
]);

test(`${ID}: every object kind / records count / relation set composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const kind of ['key', 'cup', 'box']) for (const n of [2, 5]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {textVisibility: tv, items: [{id: 'X (fictional)', label: 'Item (fictional)', kind}], records: Array.from({length: n}, (_, i) => ({field: `F${i}`, value: i % 2 ? '' : 'v'})), custodians: [{name: 'A', role: 'r'}, {name: 'B', role: 'r'}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${kind} ${n} ${w}x${h} ${tv}: ${s.problems}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the map still forms`, async ({page}) => {
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
      for (const u of [0, 0.1, 0.5, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      const s = x.getState({bounds: false}).semantic;
      res.push({text, prints: s.prints, drawn: s.drawn});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.prints.every(p => p === 'placed')).toBe(true);
    expect(r.drawn.every(k => k === 1)).toBe(true);
  }
});

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
      for (let i = 0; i <= 40; i++) {
        x.seek((i / 40) * x.durationMs);
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b) * k;
          if (px < 15.9) out.push(`${w}x${h} u=${i / 40} ${t.textContent.slice(0, 20)} ${px.toFixed(1)}`);
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
