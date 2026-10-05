// LAW-0354 — Efectos durante revisión · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (both markers move continuously along their lanes), anchoring
// (each marker leaves its own card's port and stays on its own lane; the lanes never meet) and the transformation
// recognisable with labels hidden (the gate turns to the supplied datum before the ● marker arrives, which then passes
// or stops; the ◆ marker reaches its bay either way).
// Timing (u): rest 0–0.15 · lanes draw on 0.15–0.30 · markers advance 0.24–0.70 at one pace · focus (gate grows)
// 0.38–0.46 · slats turn to the supplied datum 0.40–0.48 · chevrons past the gate light as the marker passes them 0.48–0.70 (maintained) ·
// relax 0.74–0.80 · notes 0.78–0.83 · state 0.79–0.84; still from 0.84.
// Legal: the gate shows the supplied datum only; chevrons show direction only (sequence as configured).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0354';

contractSuite(ID, {
  continuity: ['tokP', 'tokR'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.draw === 0 && s.set === 0 && s.closed === 0.5 && s.focus === 1 && !s.passed", label: 'rest: lanes faint, gate unset (half-turned), markers at their cards'},
    {at: 0.35, fn: 's.draw === 1 && s.sP > 0.05 && s.sR > 0.05 && s.samePace && s.set === 0', label: 'both markers advance at one pace, each on its own lane'},
    {at: 0.48, fn: 's.set === 1 && s.focus > 1.3 && s.sP < s.sGate', label: 'the gate is set to the supplied datum before the ● marker arrives (cause before effect)'},
    {at: 1, fn: 's.passed && s.lit === 1 && s.closed === 0 && s.sR > 0.95 && s.problems.length === 0', label: 'hold (maintained): the ● marker passed the open gate, chevrons lit; the ◆ marker at its bay'},
    {at: 1, params: {finalState: 'suspended'}, fn: '!s.passed && s.sP === s.sStop && s.closed === 1 && s.lit === 0 && s.sR > 0.95', label: 'suspended (as supplied): the ● marker stops before the closed gate; the ◆ marker still reaches its bay'},
    {at: 0.2, fn: 's.set === 0 && !s.passed', label: 'seeking back restores the unset gate exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.routes.process, p.routes.review, p.finalState === 'maintained' ? p.outcomes.maintained : p.outcomes.suspended, p.labels.filter, p.labels.key, p.actorLabels.a, p.actorLabels.b, p.objectLabels.arrows, p.objectLabels.calendar, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: "return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.finalState === 'maintained' ? p.outcomes.maintained : p.outcomes.suspended];",
  captions: 'return [p.objectLabels.arrows, p.objectLabels.calendar];',
});

ratioChecks(ID, 'lanes apart, gate set before arrival, composition fits', [
  {at: [0, 0.5, 1], fn: 's.laneGap > 8', label: 'the two lanes never meet'},
  {at: times(0, 1, 0.01), fn: 's.sP < s.sGate - 0.005 || s.set === 1', label: 'the ● marker reaches the gate only after the gate is set'},
  {at: times(0.24, 0.7, 0.02), fn: 's.samePace', label: 'both markers advance at one pace until one stops'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, lanes, tag, legend)'},
  {at: [1], fn: "s.finalState === 'maintained' ? s.passed : (!s.passed && s.sP === s.sStop)", label: 'the ● marker ends where the supplied datum leaves it'},
]);

test(`${ID}: labels hidden — no visible text; the markers still advance and the gate decides only the ● lane`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const fs of ['maintained', 'suspended']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {textVisibility: 'none', finalState: fs}}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      let text = 0;
      for (const u of [0, 0.5, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      const s = x.getState({bounds: false}).semantic;
      res.push({fs, text, passed: s.passed, sR: s.sR, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.passed).toBe(r.fs === 'maintained'); expect(r.sR).toBeGreaterThan(0.95); expect(r.problems).toBe(0); }
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

test(`${ID}: 0..2 notes (every target) × both data compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const sets = [[], [{target: 'calendar', text: 'The calendar marks no date'}], [{target: 'cards', text: 'Each card is the source of one marker'}, {target: 'arrows', text: 'Chevrons show direction only'}]];
    const out = [];
    for (const notes of sets) for (const fs of ['maintained', 'suspended']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {annotations: notes, finalState: fs}}).semantic;
      if (s.problems.length) out.push(`${notes.length} ${fs} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
