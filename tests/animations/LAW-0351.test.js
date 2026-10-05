// LAW-0351 — Devolución para nuevo examen · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (how the folder reaches the configured
// point: A enters from the left without notes, B comes back from the review desk with the supplied notes — the boards,
// doors, point and timing are identical); no legal consequence is invented (no result of either examination; neutral
// note; no winner).
// Timing (u): base 0–0.17 (identical, no folder) · entry 0.19–0.38 (A from the left, B onto the review mat with notes)
// · parallel run into the same tray 0.42–0.72 · guide 0.77–0.83 · captions 0.78–0.83 · neutral 0.80–0.85; still 0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0351';

contractSuite(ID, {
  continuity: ['folderA', 'folderB', 'slipB'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.lookA.shown", label: 'base: identical boards, no folder yet'},
    {at: 0.3, fn: "s.beat === 'change' && s.lookA.route !== s.lookB.route && !s.lookA.notes && s.lookB.notes", label: 'the change beat brings in the one difference'},
    {at: 0.55, fn: 's.run > 0 && s.run < 1', label: 'both run in parallel with the same timing'},
    {at: 1, fn: 's.inTargetA && s.inTargetB && s.guide === 1 && s.problems.length === 0', label: 'hold: both folders in the same configured tray; guide shown; composition fits'},
    {at: 0.1, fn: "s.beat === 'base' && s.guide === 0", label: 'seeking back restores the base'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.grounds, ...p.routes.stations, p.routes.origin, p.labels.route, p.labels.point, p.labels.key, p.outcomes.renewed, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: 'return [p.decisions.title, ...p.grounds, ...p.routes.stations, p.changedFact];',
  captions: 'return [...p.sharedFacts];',
});

ratioChecks(ID, 'scenes equal, one fact differs, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 'Math.abs(s.stages[0].w - s.stages[1].w) < 0.01 && Math.abs(s.stages[0].h - s.stages[1].h) < 0.01', label: 'both scenes have the same size'},
  {at: times(0.42, 0.72, 0.03), fn: 's.lookA.shown && s.lookB.shown', label: 'both folders run at the same time'},
  {at: [1], fn: 's.inTargetA && s.inTargetB', label: 'both end in the configured tray'},
]);

test(`${ID}: side by side on wide frames (each >= 40 % of the width), stacked on tall frames`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready; x.seek(x.durationMs);
      const F = x.element.getBoundingClientRect();
      const b = ['stageA', 'stageB'].map(n => x.element.querySelector(`[data-node="${n}"]`).getBoundingClientRect());
      res.push({tag: `${pr.name} ${w}x${h}`, tall: h > w, side: Math.abs(b[0].top - b[1].top) < 2, share: Math.min(b[0].width, b[1].width) / F.width});
      x.destroy(); el.remove();
    }
    return res;
  }, [ID, presets]);
  for (const r of out) {
    if (r.tall) { expect(r.side, r.tag).toBe(false); expect(r.share, r.tag).toBeGreaterThanOrEqual(0.8); }
    else { expect(r.side, r.tag).toBe(true); expect(r.share, r.tag).toBeGreaterThanOrEqual(0.4); }
  }
});

test(`${ID}: labels hidden — no visible text; both folders still reach the tray, only B with notes`, async ({page}) => {
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
      x.seek(x.durationMs); const s = x.getState({bounds: false}).semantic;
      const text = [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      res.push({text, a: s.inTargetA, b: s.inTargetB, notes: s.lookB.notes && !s.lookA.notes, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.a && r.b && r.notes).toBe(true); expect(r.problems).toBe(0); }
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

test(`${ID}: 2..3 points, 1..3 notes, 0..4 shared facts and every return point compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [2, 3]) for (const k of [1, 3]) for (const f of [0, 4]) for (let t = 0; t < n; t++) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const stations = Array.from({length: n}, (_, i) => `Point ${i + 1} (fictional)`);
      const grounds = Array.from({length: k}, (_, i) => `Note ${i + 1} (fictional)`);
      const sharedFacts = Array.from({length: f}, (_, i) => `Shared fact ${i + 1} (fictional)`);
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {routes: {stations, origin: 'Review desk (fictional)', returnTo: t}, grounds, sharedFacts}}).semantic;
      if (s.problems.length) out.push(`${n}/${k}/${f}/${t} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
