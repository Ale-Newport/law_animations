// LAW-0355 — Efectos durante revisión · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (the supplied datum on the tag, which
// sets the gate — the only difference; the cards, lanes and pace are identical) and no legal consequence is invented to
// complete the contrast (the decision card passes or waits as a matter of geometry; a neutral note; no winner).
// Timing (u): base 0–0.18 (identical; gates unset, tags blank) · both decision cards to their gates 0.18–0.38, appeal
// cards 0.18–0.74 · the datum appears on each tag 0.40–0.45 and the gates turn 0.42–0.50 (the change) · A's decision
// card passes 0.50–0.72 (chevrons 0.52–0.72) · guide 0.77–0.83 · neutral note 0.80–0.85; still from 0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0355';
const CHANGE_AT = 0.4;

contractSuite(ID, {
  continuity: ['cardAP', 'cardAR', 'cardBP', 'cardBR'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.closed === 0.5 && s.lookA.tag === 0 && s.lookA.tP === s.tStart", label: 'base: identical scenes, gates unset, tags blank'},
    {at: 0.39, fn: "JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.tP === s.tWait", label: 'both decision cards wait at their gates identically before the change'},
    {at: 0.5, fn: "s.lookA.closed === 0 && s.lookB.closed === 1 && s.lookA.datum === 'maintained' && s.lookB.datum === 'suspended' && s.lookA.tR === s.lookB.tR", label: 'the change beat sets only the datum and the gate'},
    {at: 1, fn: 's.passedA && !s.passedB && s.lookB.tP === s.tWait && s.lookA.tP === s.tEnd && s.lookA.tR === s.tEnd && s.lookB.tR === s.tEnd && s.guide === 1 && s.problems.length === 0', label: 'hold: A passed its open gate, B waits; both appeal cards in their bays; guide shown'},
    {at: 0.1, fn: "s.beat === 'base' && s.guide === 0 && s.lookA.tag === 0", label: 'seeking back restores the base'},
  ],
});

identicalBeforeChange(ID, CHANGE_AT);

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.routes.process, p.routes.review, p.outcomes.maintained, p.outcomes.suspended, p.labels.filter, p.labels.key, p.scenarioA.label, p.scenarioB.label, ...(p.scenarioA.caption ? [p.scenarioA.caption] : []), ...(p.scenarioB.caption ? [p.scenarioB.caption] : []), p.changedFact, ...p.sharedFacts, p.objectLabels.arrows, p.objectLabels.calendar, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: 'return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.outcomes.maintained, p.outcomes.suspended, p.changedFact];',
  captions: 'return [...p.sharedFacts, p.objectLabels.arrows, p.objectLabels.calendar];',
});

ratioChecks(ID, 'scenes equal, one fact differs, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 'Math.abs(s.stages[0].w - s.stages[1].w) < 0.01 && Math.abs(s.stages[0].h - s.stages[1].h) < 0.01', label: 'both scenes have the same size'},
  {at: times(0, 1, 0.02), fn: 's.lookA.tR === s.lookB.tR && s.lookA.tag === s.lookB.tag', label: 'the appeal cards and the tags\' timing are identical in A and B at every moment'},
  {at: times(0, 0.399, 0.02), fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'nothing differs before the change beat'},
]);

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
    if (r.tall) { expect(r.side, r.tag).toBe(false); expect(r.share, r.tag).toBeGreaterThanOrEqual(0.8); }
    else { expect(r.side, r.tag).toBe(true); expect(r.share, r.tag).toBeGreaterThanOrEqual(0.4); }
  }
});

test(`${ID}: labels hidden — no visible text; A passes, B waits`, async ({page}) => {
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
      for (const u of [0, 0.5, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      const s = x.getState({bounds: false}).semantic;
      res.push({text, a: s.passedA, b: s.passedB, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.a).toBe(true); expect(r.b).toBe(false); expect(r.problems).toBe(0); }
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

test(`${ID}: 0..4 shared facts and both captions compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const k of [0, 1, 2, 3, 4]) for (const cap of [false, true]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const sharedFacts = Array.from({length: k}, (_, i) => `Shared fact ${i + 1} (fictional)`);
      const params = {sharedFacts, ...(cap ? {scenarioA: {label: 'A · Effect maintained', caption: 'Situation A as supplied'}, scenarioB: {label: 'B · Effect suspended', caption: 'Situation B as supplied'}} : {})};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${k} facts, captions ${cap}, ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
