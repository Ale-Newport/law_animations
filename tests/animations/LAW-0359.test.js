// LAW-0359 — Cierre de itinerario · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete desks of the same size), exactly the indicated fact differs
// (only the supplied state of the focus route: traced to its end card on desk A, clipped on desk B; every other route
// is marked identically on both desks) and no legal consequence is invented (the guide and the neutral note name no
// winner, score or outcome; the end entries never change).
// Timing (u): base 0–0.17 (identical) · change: A puck hop 0.17–0.21, trace 0.21–0.34, back 0.34–0.39; B clip
// 0.19–0.33 · shared marking on both desks: puck 0.43–0.66 + back 0.66–0.73, clips 0.43–0.73 · guide 0.77–0.82 ·
// neutral note 0.80–0.85; still from 0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0359';

contractSuite(ID, {
  continuity: ['puckA', 'puckB', 'clipB'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.inkFocusA === 0 && s.laidFocusB === 0", label: 'base: both desks identical, nothing marked'},
    {at: 0.28, fn: "s.beat === 'change' && s.inkFocusA > 0 && s.inkFocusA < 1 && s.inkFocusB === 0 && s.laidFocusA === 0", label: 'change: only desk A traces the focus route'},
    {at: 0.4, fn: 's.inkFocusA === 1 && s.laidFocusB === 1 && s.inkFocusB === 0 && s.laidFocusA === 0 && s.badgesA[s.focus] === 1 && s.badgesB[s.focus] === 1', label: 'after the change: A traced (●), B clipped (◆) on the focus route only'},
    {at: 0.55, fn: 's.sharedSame && JSON.stringify(s.lookA.puck) === JSON.stringify(s.lookB.puck)', label: 'parallel: the other routes are marked identically on both desks at the same time'},
    {at: 1, fn: 's.sharedSame && s.guide === 1 && s.note === 1 && s.problems.length === 0 && s.badgesA.every(b => b === 1) && s.badgesB.every(b => b === 1)', label: 'hold: every route marked; guide and neutral note shown'},
    {at: 1, fn: "s.statesA[s.focus] === 'concluded' && s.statesB[s.focus] === 'pending' && s.statesA.filter((x, i) => i !== s.focus).join() === s.statesB.filter((x, i) => i !== s.focus).join()", label: 'exactly the focus route\'s state differs'},
    {at: 1, fn: 's.desks[0].w === s.desks[1].w && s.desks[0].h === s.desks[1].h', label: 'both desks have the same size'},
    {at: 0.76, fn: 's.guide === 0 && s.note === 0', label: 'the guide and the note wait for the guide beat'},
    {at: 1, params: {focusRoute: 3}, fn: "s.focus === 2 && s.statesB[2] === 'pending' && s.statesA[2] === 'concluded' && s.problems.length === 0", label: 'the focus route alone decides where the difference lies'},
    {at: 0.1, fn: "s.beat === 'base' && s.inkFocusA === 0", label: 'seeking back restores the base exactly'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.ref, p.grounds, ...p.routes.flatMap(r => [r.label, r.end]), p.outcomes.concluded, p.outcomes.pending, p.labels.file, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: 'return [p.decisions.title, p.decisions.ref, ...p.routes.flatMap(r => [r.label, r.end]), p.scenarioA.label, p.scenarioB.label, p.changedFact];',
  captions: 'return [];',
});

ratioChecks(ID, 'only the focus route differs; equal desks; composition fits', [
  {at: times(0, 0.165, 0.015), fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'identical desks before the change beat'},
  {at: times(0.17, 1, 0.02), fn: 's.sharedSame', label: 'the other routes are always marked identically'},
  {at: times(0.17, 1, 0.02), fn: 's.inkFocusB === 0 && s.laidFocusA === 0', label: 'desk B never traces the focus route; desk A never clips it'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

test(`${ID}: labels hidden — no visible text; the one difference still reads`, async ({page}) => {
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
      res.push({text, a: s1.inkFocusA, b: s1.laidFocusB, guide: s1.guide, problems: s1.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.a).toBe(1);
    expect(r.b).toBe(1);
    expect(r.guide).toBe(1);
    expect(r.problems).toBe(0);
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

test(`${ID}: 2..3 routes × focus × 0..4 shared facts compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const rt = (i, st) => ({label: `Route ${i} (as supplied)`, state: st, end: `End entry of route ${i} (as supplied)`});
    const facts = ['Same resolution', 'Same routes', 'Same file and tray', 'Same calendar'];
    const out = [];
    for (const n of [2, 3]) for (const focusRoute of [1, n]) for (const k of [0, 4]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const params = {routes: [rt(1, 'concluded'), rt(2, 'pending'), rt(3, 'concluded')].slice(0, n), focusRoute, sharedFacts: facts.slice(0, k)};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.sharedSame) out.push(`${n} f${focusRoute} k${k} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
