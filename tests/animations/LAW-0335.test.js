// LAW-0335 — Límites de revisión · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact is changed (the section the question's arrow
// points at — the only geometric difference; the frame is identical in both, at the same time); no legal consequence
// is invented to complete the contrast (inside / outside is descriptive; a neutral note; no winner).
// Timing (u): base 0–0.17 (identical scenes; the arrow parked beside the title) · the arrow slides to its section in A
// and in B 0.19–0.38 · the same frame comes down on both 0.42–0.62 · laid 0.62–0.67 · glass 0.67–0.75 · guide
// 0.77–0.83 · state lines 0.78–0.83 · neutral note 0.80–0.85; still from 0.85.
// Coordinator decision (standing rule 2026-09-26, from LAW-0687/0689–0692; see the presets note): long-labels-stress
// section tags capped at 35 characters (still longer than the baseline's 25) after the 1:1 fallbacks were tried.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0335';
const CHANGE_AT = 0.17;

contractSuite(ID, {
  continuity: ['tipA', 'tipB', 'frameA'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.lookA.frameShown", label: 'base: identical scenes, no frame yet'},
    {at: 0.3, fn: "s.beat === 'change' && s.lookA.tip.y !== s.lookB.tip.y && s.lookA.frameY === s.lookB.frameY", label: 'the change beat moves only the arrows (to different sections)'},
    {at: 0.5, fn: 's.lookA.frameY === s.lookB.frameY && s.lookA.frameShown && s.lookB.frameShown', label: 'the same frame comes down on both at the same time'},
    {at: 1, fn: 's.insideNow[0] === s.inside[0] && s.insideNow[1] === s.inside[1] && s.guide === 1 && s.problems.length === 0', label: 'hold: the arrow tips lie as supplied (inside in A, outside in B); guide shown; composition fits'},
    {at: 1, fn: 's.lookA.glass === s.lookB.glass && s.lookA.frameY === s.lookB.frameY && s.lookA.lift === s.lookB.lift', label: 'frames identical at the hold'},
    {at: 1, params: {grounds: [{side: 'a', text: 'Q (fictional)', section: 0}, {side: 'b', text: 'Q (fictional)', section: 2}]}, fn: 's.inside[0] === false && s.inside[1] === true', label: 'the supplied sections alone decide inside / outside'},
    {at: 0.1, fn: "s.beat === 'base' && s.guide === 0", label: 'seeking back restores the base'},
  ],
});

identicalBeforeChange(ID, CHANGE_AT);

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.decisions.sections, ...p.grounds.map(g => g.text), p.labels.frame, p.labels.key, p.scenarioA.label, p.scenarioB.label, ...(p.scenarioA.caption ? [p.scenarioA.caption] : []), ...(p.scenarioB.caption ? [p.scenarioB.caption] : []), p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: 'return [...p.decisions.sections, ...p.grounds.map(g => g.text), p.changedFact];',
  captions: 'return [...p.sharedFacts];',
});

ratioChecks(ID, 'scenes equal, one fact differs, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 'Math.abs(s.stages[0].w - s.stages[1].w) < 0.01 && Math.abs(s.stages[0].h - s.stages[1].h) < 0.01', label: 'both scenes have the same size'},
  {at: times(0, 1, 0.02), fn: 's.lookA.frameY === s.lookB.frameY && s.lookA.glass === s.lookB.glass', label: 'the frame is identical in A and B at every moment'},
  {at: times(0.4, 1, 0.05), fn: 's.lookA.tip.x === s.lookB.tip.x', label: 'only the arrow\'s section (its height) differs, not its reach'},
]);

// Stacked on tall frames, side by side on wide ones; each scene >= 40 % of the frame width side by side, the full
// width stacked (AUTHORING item 18). Measured on the rendered desk windows.
test(`${ID}: scenes side by side on wide frames (each >= 40 % of the width), stacked on tall frames`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      el.style.width = w + 'px'; el.style.height = h + 'px';
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready; x.seek(x.durationMs);
      const F = x.element.getBoundingClientRect();
      const b = ['stageA', 'stageB'].map(n => x.element.querySelector(`[data-node="${n}"]`).getBoundingClientRect());
      res.push({tag: `${pr.name} ${w}x${h}`, tall: h > w, side: Math.abs(b[0].top - b[1].top) < 2, share: Math.min(b[0].width, b[1].width) / F.width});
      x.destroy(); el.remove();
    }
    return res;
  }, [ID, presets]);
  for (const r of out) {
    if (r.tall) expect(r.side, r.tag).toBe(false);
    else { expect(r.side, r.tag).toBe(true); expect(r.share, r.tag).toBeGreaterThanOrEqual(0.4); }
    if (r.tall) expect(r.share, r.tag).toBeGreaterThanOrEqual(0.8);
  }
});

test(`${ID}: labels hidden — no visible text; the arrows still end inside (A) and outside (B)`, async ({page}) => {
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
      res.push({text, inside: s.insideNow, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.inside).toEqual([true, false]); expect(r.problems).toBe(0); }
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

test(`${ID}: 3..6 sections and 0..4 shared facts compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [3, 4, 5, 6]) for (const k of [0, 2, 4]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const sections = Array.from({length: n}, (_, i) => `Section ${i + 1} (supplied text)`);
      const sharedFacts = Array.from({length: k}, (_, i) => `Shared fact ${i + 1} (fictional)`);
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {decisions: {title: 'Decision (fictional)', sections}, routes: {from: 0, to: Math.min(1, n - 1)}, sharedFacts}}).semantic;
      if (s.problems.length) out.push(`${n} sections, ${k} facts, ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
