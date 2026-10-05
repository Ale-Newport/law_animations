// LAW-0333 — Límites de revisión · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (both hands and the frame move continuously), anchoring of objects
// (each hand is on its grip knob of the frame for the whole carry / stretch / lay; the frame only moves while held) and
// the transformation recognisable with labels hidden (the closed frame leaves its rest place and ends open over exactly
// the supplied sections, with its filter glass; no text).
// Timing (u): rest 0–0.15 · hands to the knobs 0.15–0.20 · lift 0.20–0.23 · carry (closed) 0.23–0.36 · upper rail
// pushed up 0.36–0.50 · laid 0.50–0.54 · glass 0.54–0.62 · hands back 0.62–0.73 · state lines 0.74–0.79 · notes
// 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal: the frame shows the supplied range only (no doctrine on review scope); inside / outside is descriptive.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0333';
const HELD = [0.2005, 0.6195];

contractSuite(ID, {
  continuity: ['handL', 'handR', 'frameC'],
  attach: [
    {from: HELD[0], to: HELD[1], a: 'handL', b: 'gripL', tol: 1.5},
    {from: HELD[0], to: HELD[1], a: 'handR', b: 'gripR', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && !s.held && s.glass === 0 && s.enclosed.every(x => !x) && s.reach === 0", label: 'rest: the frame lies closed at rest; hands down; nothing enclosed'},
    {at: 0.145, fn: "s.phase === 'rest' && s.reach === 0", label: 'nothing moves during the rest beat'},
    {at: 0.2, fn: 's.reach === 1 && s.lift === 0', label: 'the hands reach the knobs before the frame moves (cause before effect)'},
    {at: 0.3, fn: "s.phase === 'carry' && s.held && s.lift === 1", label: 'the closed frame is carried, held by both hands'},
    {at: 0.45, fn: "s.phase === 'stretch' && s.held", label: 'the upper rail is pushed up while held'},
    {at: 1, fn: "s.phase === 'laid' && !s.held && s.glass === 1 && s.lift === 0 && s.enclosed[0] === s.inside[0] && s.enclosed[1] === s.inside[1] && s.allReached && s.problems.length === 0", label: 'hold: the frame laid over exactly the supplied range; what it encloses matches the supplied data; hands back'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.phase === 'rest' && s.glass === 0 && s.subs === 0", label: 'pending: the frame stays closed at rest; no inside/outside lines'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && s.held', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {routes: {from: 3, to: 4}}, fn: 's.enclosed[0] === false && s.enclosed[1] === true', label: 'the supplied range alone decides what the frame encloses'},
    {at: 0.1, fn: "s.phase === 'rest' && s.glass === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.decisions.sections, ...p.grounds.map(g => g.text), p.labels.frame, p.labels.key, p.actorLabels.a, p.objectLabels.filter, p.objectLabels.calendar, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.decisions.title, ...p.decisions.sections, ...p.grounds.map(g => g.text)];',
  captions: 'return [p.objectLabels.filter, p.objectLabels.calendar, p.actorLabels.a];',
});

ratioChecks(ID, 'frame only moves while held; composition fits; hands within reach', [
  {at: times(0, 1, 0.01), fn: 's.lift === 0 || s.held', label: 'the frame is lifted only while both hands hold it'},
  {at: times(0.15, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, sheet, panel)'},
  {at: [1], fn: 's.enclosed[0] === s.inside[0] && s.enclosed[1] === s.inside[1]', label: 'the laid frame encloses exactly the supplied sections'},
]);

// Labels hidden: no visible text, yet the frame ends open over the sheet with its glass (the action reads).
test(`${ID}: labels hidden — no visible text; the frame ends open over the supplied rows`, async ({page}) => {
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
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      const text = [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      res.push({text, moved: Math.abs(s1.frameC.y - s0.frameC.y), open: s1.frameBot - s1.frameTop, glass: s1.glass});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(80);
    expect(r.open).toBeGreaterThan(100);
    expect(r.glass).toBe(1);
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

// Every valid count of sections (3..6) renders a real scene with a fitting composition at every ratio.
test(`${ID}: 3..6 sections compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [3, 4, 5, 6]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const sections = Array.from({length: n}, (_, i) => `Section ${i + 1} (supplied text)`);
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {decisions: {title: 'Decision (fictional)', sections}, routes: {from: 0, to: Math.min(1, n - 1)}}}).semantic;
      if (s.problems.length) out.push(`${n} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
