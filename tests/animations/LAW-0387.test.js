// LAW-0387 — Comparación de huellas digitales · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete stations), exactly the indicated fact changes (one symbol
// of the lifted chain in B; every other pair is linked identically) and no legal consequence is invented (neutral note,
// no winner). Windows (u, 7.5 s): base 0–0.17 (hand to frame 0.04–0.12 in both) · change 0.17–0.40 (B's tile turns over
// 0.22–0.32, ring 0.18–0.38) · frame to pair 1 0.40–0.45 · pairs 0.45–0.74 · frame parked 0.74–0.78 · hand back
// 0.78–0.82 · guide 0.79–0.85 · note 0.82–0.87.
// Tile-size floor 31.5 design units for each of the two stations (both scenes share the frame; precedent: accepted
// LAW-0375 keeps contrast benches at about 0.74 of its story floor).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0387';

contractSuite(ID, {
  continuity: ['handA', 'handB', 'readerA', 'readerB'],
  attach: [
    {from: 0.1205, to: 0.7795, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0.1205, to: 0.7795, a: 'handB', b: 'gripB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && !s.flipped && s.linksA.every(k => k === 0) && s.linksB.every(k => k === 0)", label: 'base: no links, no change yet'},
    {at: 0.38, fn: 's.flipped && s.linksA.every(k => k === 0)', label: 'the change happens in B before any comparison'},
    {at: 0.6, fn: 'JSON.stringify(s.linksA) === JSON.stringify(s.linksB)', label: 'the comparison runs in parallel at the same pace'},
    {at: 1, fn: "s.linkA === 'bridge' && s.linkB === 'open' && s.guide === 1 && s.note === 1 && s.allReached && s.problems.length === 0", label: 'hold: bridge in A, open stubs in B at the changed pair; guide; composition fits'},
    {at: 0.7, fn: 's.guide === 0', label: 'the guide waits for the hold'},
    {at: 0.1, fn: '!s.flipped', label: 'seeking back restores the base symbol'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.items[0].id, p.items[0].label, p.cards.a, p.cards.b, p.matchLabels.same, p.matchLabels.differ, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.label), p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.key];",
  content: 'return [p.changedFact, p.items[0].label, p.cards.a, p.cards.b, ...p.custodians.map(c => c.name)];',
  captions: 'return [];',
});

ratioChecks(ID, 'hands within reach; frames held while moved; composition fits', [
  {at: [1], presets: ['baseline-es', 'baseline-illustrative'], tv: ['all'], fn: 's.textPx >= 19.5', label: 'baseline text >= 19.5 px in every ratio'},
  {at: times(0, 1, 0.02), fn: 's.allReached', label: 'hands within reach'},
  {at: times(0.13, 0.77, 0.01), fn: 'Math.hypot(s.handA.x - s.gripA.x, s.handA.y - s.gripA.y) < 2 && Math.hypot(s.handB.x - s.gripB.x, s.handB.y - s.gripB.y) < 2', label: 'frames move only with a hand on their handle'},
  {at: [1], fn: 's.problems.length === 0 && s.ts >= 31.5', label: 'a composition fits'},
]);

test(`${ID}: every segment count, change index and object kind composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const sy = ['arc', 'loop', 'fork', 'dot', 'end', 'arc'];
    for (const n of [3, 6]) for (const ci of [0, 5]) for (const kind of ['key', 'cup', 'box']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {textVisibility: tv, segments: sy.slice(0, n).map(a => ({a, b: a})), changeIndex: ci, changeSymbol: 'end', items: [{id: 'X (fictional)', label: 'Item (fictional)', kind}], sharedFacts: []};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.allReached) out.push(`${n} ${ci} ${kind} ${w}x${h} ${tv}: ${s.problems}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the changed pair still differs`, async ({page}) => {
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
      const s = x.getState({bounds: false}).semantic;
      res.push({text, a: s.linkA, b: s.linkB});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.a).toBe('bridge');
    expect(r.b).toBe('open');
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
