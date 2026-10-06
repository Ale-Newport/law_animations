// LAW-0383 — Copia de evidencia digital · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (which device the hand takes from the
// dock: the original in A, the copy in B) and no legal consequence is invented (guide + neutral note only).
// Windows (u, 7.5 s): base 0–0.17 (hand to hover 0.05–0.15, identical in A and B) · change 0.17–0.40 (hand to the source
// bay in A / the target bay in B 0.17–0.27, grip 0.27–0.40) · carried 0.40–0.55 · B: tag 0.55–0.66, chain 0.66–0.69 ·
// hands back · guide 0.79–0.85 · note 0.82–0.87.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0383';

contractSuite(ID, {
  continuity: ['handA', 'handB', 'origA', 'copyB', 'tagB'],
  attach: [
    {from: 0.2705, to: 0.5495, a: 'handA', b: 'gripOrigA', tol: 1.5},
    {from: 0.2705, to: 0.5495, a: 'handB', b: 'gripCopyB', tol: 1.5},
    {from: 0.5805, to: 0.6595, a: 'handB', b: 'gripTagB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && s.origAtA === 'dock' && s.copyAtB === 'dock' && s.tagStateB === 'lying'", label: 'base: both devices seated in both docks'},
    {at: 0.35, fn: "s.origAtA === 'gripped' && s.copyAtA === 'dock' && s.copyAtB === 'gripped' && s.origAtB === 'dock'", label: 'the change: A grips the original, B grips the copy'},
    {at: 0.5, fn: "s.origAtA === 'carried' && s.copyAtB === 'carried'", label: 'both carried in parallel'},
    {at: 1, fn: "s.origAtA === 'bag' && s.copyAtA === 'dock' && s.copyAtB === 'placed' && s.origAtB === 'dock' && s.tagStateB === 'attached' && s.tagA === 'lying' && s.guide === 1 && s.allReached && s.problems.length === 0", label: 'hold: A original in its bag, B copy tagged; guide; fits'},
    {at: 0.7, fn: 's.guide === 0', label: 'the guide waits for the hold'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.label), p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.key];",
  content: 'return [p.changedFact, p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'hands within reach; devices held while moved; composition fits', [
  {at: [1], presets: ['baseline-es'], tv: ['all'], fn: 's.textPx >= 19.5', label: 'baseline-es keeps text at >= 19.5 px (baseline floor) in every ratio'},
  {at: times(0, 1, 0.02), fn: 's.allReached', label: 'hands within reach'},
  {at: times(0.28, 0.54, 0.01), fn: 'Math.hypot(s.handA.x - s.gripOrigA.x, s.handA.y - s.gripOrigA.y) < 2 && Math.hypot(s.handB.x - s.gripCopyB.x, s.handB.y - s.gripCopyB.y) < 2', label: 'devices move only in the hands'},
  {at: [1], fn: 's.problems.length === 0 && s.S >= 70', label: 'a composition fits'},
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
    combos.push({sharedFacts: []});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 70)} ${w}x${h} ${tv}: ${s.problems} S=${s.S}`);
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
      for (const u of [0, 0.35, 0.6, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, a: s1.origAtA, b: s1.copyAtB, t: s1.tagStateB, g: s1.guide});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.a).toBe('bag');
    expect(r.b).toBe('placed');
    expect(r.t).toBe('attached');
    expect(r.g).toBe(1);
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
