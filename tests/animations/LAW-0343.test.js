// LAW-0343 — Confirmación ilustrativa · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete desks of the same size), exactly the indicated fact differs
// (only desk B receives the supplied confirmatory card; everything else — card A, strip, calendar, hands, timing — is
// the same) and no legal consequence is invented (the printed results never change; the guide and the neutral note
// name no winner, score or outcome).
// Timing (u): base 0–0.17 (identical) · desk B: hand to the card 0.17–0.22, card brought in 0.22–0.37, hand away
// 0.38–0.45 · both desks: hand to the strip 0.42–0.48, strip carried 0.48–0.62, laid 0.62–0.65, hand back 0.65–0.74 ·
// guide 0.77–0.82 · neutral note 0.80–0.85; still from 0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0343';

contractSuite(ID, {
  continuity: ['handRB', 'handLA', 'handLB', 'stripA', 'stripB'],
  attach: [
    {from: 0.2205, to: 0.3795, a: 'handRB', b: 'gripB', tol: 1.5},
    {from: 0.4805, to: 0.6495, a: 'handLA', b: 'gripSA', tol: 1.5},
    {from: 0.4805, to: 0.6495, a: 'handLB', b: 'gripSB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.bVisible && s.strip === 0", label: 'base: both desks identical, no supplied card visible'},
    {at: 0.3, fn: "s.beat === 'change' && s.heldB && s.slide > 0 && s.slide < 1 && s.lookA.cardB === null", label: 'change: only desk B receives the card, held by the hand'},
    {at: 0.45, fn: 's.slide === 1 && s.tipGapB < 8 && s.lookA.cardB === null', label: 'card B is set square beside card A (arrow marks meet); desk A has none'},
    {at: 0.55, fn: 's.heldS && JSON.stringify(s.lookA.strip) === JSON.stringify(s.lookB.strip) && JSON.stringify(s.lookA.handL) === JSON.stringify(s.lookB.handL)', label: 'parallel: the same strip motion on both desks at the same time'},
    {at: 1, fn: 's.stripOnRowA < 0.5 && s.stripOnRowB < 0.5 && s.guide === 1 && s.note === 1 && s.allReached && s.problems.length === 0', label: 'hold: the strip lies on the configured row on both desks; guide and neutral note shown'},
    {at: 1, fn: "s.desks[0].w === s.desks[1].w && s.desks[0].h === s.desks[1].h", label: 'both desks have the same size'},
    {at: 0.76, fn: 's.guide === 0 && s.note === 0', label: 'the guide and the note wait for the guide beat'},
    {at: 0.1, fn: "s.beat === 'base' && s.slide === 0 && s.strip === 0", label: 'seeking back restores the base exactly'},
  ],
});

identicalBeforeChange(ID, 0.17);

// Coordinator decision (2026-10-05, precedent LAW-0211): at 1:1 ONLY (default, baseline-illustrative, baseline-es) key
// text may be >= 18 px (title/reasons >= 16.5 px) as a documented limit; 16:9 and 9:16 keep the 19.5 px floor, checked
// separately below (the shared suite takes one floor for all ratios).
suppliedTextSuite(ID, {
  baselineMin: 18,
  fields: "return [p.decisions.a.role, p.decisions.a.title, p.decisions.a.ref, p.decisions.b.role, p.decisions.b.title, p.decisions.b.ref, p.grounds.a, p.grounds.b, p.outcomes.a, p.outcomes.b, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.routes.label, p.labels.key];",
  content: 'return [p.decisions.a.role, p.decisions.a.ref, p.decisions.b.role, p.decisions.b.ref, p.outcomes.a, p.outcomes.b, p.scenarioA.label, p.scenarioB.label, p.changedFact];',
  captions: 'return [];',
});

ratioChecks(ID, 'only desk B changes; equal desks; composition fits', [
  {at: [1], fn: 's.textPx >= 19.5', label: '16:9 and 9:16 keep the 19.5 px baseline floor (coordinator decision 2026-10-05 limits the exception to 1:1)', presets: ['baseline-illustrative', 'baseline-es'], ratios: ['16:9', '9:16'], tv: ['all']},
  {at: times(0, 0.165, 0.015), fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'identical desks before the change beat'},
  {at: times(0.17, 1, 0.03), fn: 's.lookA.cardB === null', label: 'desk A never receives a second card'},
  {at: times(0.4, 1, 0.03), fn: 'JSON.stringify(s.lookA.strip) === JSON.stringify(s.lookB.strip)', label: 'the shared strip action is identical on both desks'},
  {at: times(0, 1, 0.02), fn: '(s.slide === 0 || s.slide === 1) || s.heldB', label: 'card B moves only while held'},
  {at: [1], fn: 's.problems.length === 0 && s.tipGapB < 8', label: 'a composition fits; card B ends aligned'},
  {at: times(0, 1, 0.1), params: {outcomes: {a: 'Result A as supplied', b: 'Result B as supplied'}}, fn: "s.results[0] === 'Result A as supplied' && s.results[1] === 'Result B as supplied'", label: 'the printed results equal the supplied ones at every time'},
]);

// Labels hidden: no visible text, yet desk B ends with two aligned cards and desk A with one (the difference reads).
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
      res.push({text, b: s1.lookB.cardB !== null, a: s1.lookA.cardB === null, gap: s1.tipGapB, guide: s1.guide});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.b && r.a).toBe(true);
    expect(r.gap).toBeLessThan(8);
    expect(r.guide).toBe(1);
  }
});

// Cold create stays within budget for the long-labels stress preset in every ratio (fresh page each time).
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

// Every count of shared facts (0..4) and both alignment rows compose at every ratio.
test(`${ID}: 0..4 shared facts × both alignment rows compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const facts = ['Same card A', 'Same strip', 'Same desk and hands', 'Same timing (illustrative)'];
    const out = [];
    for (const n of [0, 2, 4]) for (const align of ['result', 'header']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {sharedFacts: facts.slice(0, n), routes: {align, label: 'Alignment guide (as configured)'}}}).semantic;
      if (s.problems.length || s.tipGapB >= 8) out.push(`${n} ${align} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
