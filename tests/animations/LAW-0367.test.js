// LAW-0367 — Embalaje de prueba · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two benches of identical size), exactly the indicated fact changes (only
// B's seal strip receives the supplied slit mark and its Δ; every position, hand and prop is otherwise identical) and
// no legal consequence is invented (neutral note; no winner, score or outcome).
// Timing (u, 9 s): base 0–0.17 · B slit drawn 0.20–0.30, Δ 0.27–0.34 · parallel packing: reach 0.40–0.45 (left hand
// steadies 0.40–0.56) · lift 0.45–0.465 · carry 0.465–0.52 · lower 0.52–0.54 · to flap 0.54–0.57 · fold 0.57–0.615 ·
// left hand to strip 0.56–0.62 · strip carried 0.62–0.68 · laid 0.68–0.70 · pressed 0.70–0.75 · back 0.75–0.80 ·
// guide 0.79–0.85 · note 0.82–0.87; still from 0.87.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0367';
const CHANGE_AT = 0.17;
const attach = [];
for (const s of ['A', 'B']) {
  attach.push({from: 0.4505, to: 0.5395, a: `hand${s}`, b: `objGrip${s}`, tol: 1.5});
  attach.push({from: 0.5705, to: 0.6145, a: `hand${s}`, b: `flapGrip${s}`, tol: 1.5});
  attach.push({from: 0.4505, to: 0.5595, a: `handL${s}`, b: `steady${s}`, tol: 1.5});
  attach.push({from: 0.6205, to: 0.7495, a: `handL${s}`, b: `stripGrip${s}`, tol: 1.5});
  attach.push({from: 0.7005, to: 0.7495, a: `hand${s}`, b: `press${s}`, tol: 1.5});
}

contractSuite(ID, {
  continuity: ['handA', 'handB', 'handLA', 'handLB', 'objA', 'objB', 'stripA', 'stripB'],
  attach,
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.slitB === 0 && s.marker === 0", label: 'base: identical benches, nothing marked'},
    {at: 0.36, fn: 's.slitB === 1 && s.slitA === 0 && s.marker === 1 && JSON.stringify({...s.lookA, slit: 1}) === JSON.stringify(s.lookB)', label: 'the change: only B\'s strip carries the slit mark'},
    {at: 0.6, fn: 'JSON.stringify(s.lookA.obj) === JSON.stringify(s.lookB.obj) && s.lookA.inside && s.lookB.inside && s.lookA.flap === s.lookB.flap', label: 'the packing runs identically in parallel'},
    {at: 1, fn: 's.lookA.inside && s.lookB.inside && s.lookA.laid && s.lookB.laid && s.lookA.flap === -1 && s.guide === 1 && s.slitB === 1 && s.slitA === 0 && s.problems.length === 0 && s.allReached', label: 'hold: both pouches sealed; guide shown; only B marked; composition fits'},
    {at: 0.1, fn: "s.beat === 'base' && s.guide === 0 && s.slitB === 0", label: 'seeking back restores the base'},
  ],
});

identicalBeforeChange(ID, CHANGE_AT);

suppliedTextSuite(ID, {
  fields: "return [p.changedFact, p.sealNumber, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.sharedFacts, p.items[0].id, p.items[0].label, ...p.custodians.map(c => c.name), ...p.timestamps.map(t => t.time), p.scenarioA.label, p.scenarioB.label, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.key];",
  content: 'return [p.changedFact, p.sealNumber, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value)];',
  captions: 'return [...p.sharedFacts];',
});

ratioChecks(ID, 'scenes equal except the mark; composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 'Math.abs(s.stages[0].w - s.stages[1].w) < 0.01 && Math.abs(s.stages[0].h - s.stages[1].h) < 0.01', label: 'both benches have the same size'},
  {at: times(0, 1, 0.02), fn: 'JSON.stringify({...s.lookA, slit: 0}) === JSON.stringify({...s.lookB, slit: 0})', label: 'apart from the mark, every position and state is identical in A and B at every moment'},
  {at: times(0.17, 0.85, 0.01), fn: 's.allReached', label: 'hands within reach'},
]);

test(`${ID}: every records count (2..5), custodians (1..2) and object kind composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [2, 3, 4, 5]) for (const kind of ['key', 'cup', 'box']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const params = {textVisibility: tv, records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: `Value ${i + 1}`})), items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}], sharedFacts: n > 3 ? ['a', 'b', 'c', 'd'] : [],
        custodians: n % 2 ? [{name: 'A (fictional)', role: 'Role'}, {name: 'B (fictional)', role: 'Role'}] : [{name: 'A (fictional)', role: 'Role'}], timestamps: n > 4 ? [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}] : [{label: 'a', time: '1'}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.lookB.inside || !s.lookB.laid || s.S < 70 || !s.allReached) out.push(`${n} ${kind} ${w}x${h} ${tv}: ${s.problems.join(',')} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden: no visible text, the difference (slit + Δ on B's strip) still reads.
test(`${ID}: labels hidden — no visible text; B's strip still carries the mark`, async ({page}) => {
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
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      const text = [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      const slitB = op(svg.querySelector('[data-node="B-sLoA-slit"]'));
      const slitA = op(svg.querySelector('[data-node="A-sLoA-slit"]'));
      res.push({text, slitA, slitB, laid: s1.lookB.laid});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.slitB).toBeGreaterThan(0.95);
    expect(r.slitA).toBe(0);
    expect(r.laid).toBe(true);
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
