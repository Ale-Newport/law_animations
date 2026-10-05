// LAW-0349 — Devolución para nuevo examen · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (both hands, the folder and the notes slip move continuously),
// anchoring of objects (the slip stays in the right hand while carried, then on the folder; the folder only moves
// while a hand holds it: the right hand to the hand-over point, both hands there, then the left hand into the tray)
// and the transformation recognisable with labels hidden (the folder leaves the review mat and ends, with its notes,
// in the tray whose filter doors stand open; no text).
// Timing (u): rest 0–0.15 · right hand to the slip 0.15–0.20 · slip carried 0.20–0.26 · pressed on 0.26–0.28 · grip
// 0.28–0.31 · right hand slides the folder to the hand-over point 0.31–0.42 (left hand reaches it 0.34–0.42) · hand-over
// 0.42–0.45 · left hand carries it into the configured tray 0.45–0.60 · lets go 0.60–0.62 · hands back (right
// 0.45–0.57, left 0.62–0.73) · notes rings 0.74–0.79 · state 0.75–0.80 · renewed line 0.76–0.81; still from 0.81.
// Legal: the route and the return point are supplied (only the configured doors are open); the renewed examination is
// never shown and has no outcome.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0349';

contractSuite(ID, {
  continuity: ['folderC', 'handR', 'handL', 'slipC'],
  attach: [
    {from: 0.2005, to: 0.2795, a: 'slipC', b: 'handR', tol: 1.5},
    {from: 0.3105, to: 0.4495, a: 'handR', b: 'gripR', tol: 1.5},
    {from: 0.4205, to: 0.6195, a: 'handL', b: 'gripL', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && s.atReview && !s.slipAttached && s.holder === 'none'", label: 'rest: the folder lies on the review mat; the slip beside it'},
    {at: 0.145, fn: "s.phase === 'rest' && s.atReview", label: 'nothing moves during the rest beat'},
    {at: 0.2, fn: 's.atReview && !s.slipAttached', label: 'the hand reaches the slip before anything moves (cause before effect)'},
    {at: 0.3, fn: 's.slipAttached && s.atReview', label: 'the notes are on the folder before it leaves the mat'},
    {at: 0.37, fn: "s.holder === 'R' && !s.atReview", label: 'the right hand slides the folder along the lane'},
    {at: 0.435, fn: "s.holder === 'both'", label: 'hand-over at a shared point: both hands on the folder'},
    {at: 0.52, fn: "s.holder === 'L'", label: 'the left hand carries it on'},
    {at: 1, fn: "s.phase === 'placed' && s.inTarget && s.slipAttached && s.holder === 'none' && s.allReached && s.problems.length === 0", label: 'hold: the folder with its notes lies in the configured tray; hands back; composition fits'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.phase === 'rest' && s.atReview && s.states === 1", label: 'pending: the folder stays on the review mat'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && !s.inTarget && !s.atReview', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {routes: {stations: ['P1 (fictional)', 'P2 (fictional)', 'P3 (fictional)'], origin: 'Review (fictional)', returnTo: 2}}, fn: 's.target === 2 && s.inTarget && s.openDoors.join() === "2"', label: 'the supplied return point alone decides the tray (and the open doors)'},
    {at: 0.1, fn: "s.phase === 'rest' && s.atReview", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.grounds, ...p.routes.stations, p.routes.origin, p.labels.route, p.labels.point, p.labels.key, p.outcomes.returned, p.outcomes.renewed, p.actorLabels.a, p.objectLabels.filter, p.objectLabels.calendar, ...p.annotations.map(a => a.text)];",
  content: 'return [p.decisions.title, ...p.grounds, ...p.routes.stations, p.routes.origin];',
  captions: 'return [p.objectLabels.filter, p.objectLabels.calendar, p.actorLabels.a];',
});

ratioChecks(ID, 'folder only moves while held; composition fits; hands within reach', [
  {at: times(0.31, 0.62, 0.01), fn: "s.holder !== 'none'", label: 'the folder travels only while a hand holds it'},
  {at: times(0, 1, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, plates, slip, panel)'},
  {at: [1], fn: 's.inTarget', label: 'the folder ends in the configured tray'},
]);

// Labels hidden: no visible text, yet the folder ends in the open tray with its notes (the action reads).
test(`${ID}: labels hidden — no visible text; the folder travels into the configured tray`, async ({page}) => {
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
      for (const u of [0, 0.4, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, moved: Math.hypot(s1.folderC.x - s0.folderC.x, s1.folderC.y - s0.folderC.y), inTarget: s1.inTarget, notes: s1.slipAttached, problems: s1.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(150);
    expect(r.inTarget).toBe(true);
    expect(r.notes).toBe(true);
    expect(r.problems).toBe(0);
  }
});

// The parked hands and the parked slip never rest on a plate or on the folder at the hold (AUTHORING item 12).
test(`${ID}: nothing is parked over the plates or the folder at the hold`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}}); await x.ready; x.seek(x.durationMs);
      const box = n => x.element.querySelector(`[data-node="${n}"]`).getBoundingClientRect();
      const hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      const plates = [...x.element.querySelectorAll('[data-node^="plate"]')].map(e => e.getBoundingClientRect());
      const hands = ['armL-hand', 'armR-hand'].map(box);
      const folder = box('folder');
      res.push({tag: `${pr.name} ${tv} ${w}x${h}`, bad: hands.some(hb => hit(hb, folder) || plates.some(p => hit(hb, p)))});
      x.destroy(); el.remove();
    }
    return res;
  }, [ID, presets]);
  for (const r of out) expect(r.bad, r.tag).toBe(false);
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

// Every valid count of points (2..3), of notes (1..3) and every return point compose at every ratio, labels on and off.
test(`${ID}: 2..3 points, 1..3 notes and every return point compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [2, 3]) for (const k of [1, 2, 3]) for (let t = 0; t < n; t++) for (const tv of ['all', 'none']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const stations = Array.from({length: n}, (_, i) => `Point ${i + 1} (fictional)`);
      const grounds = Array.from({length: k}, (_, i) => `Note ${i + 1} (fictional)`);
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {routes: {stations, origin: 'Review desk (fictional)', returnTo: t}, grounds, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.inTarget || !s.allReached) out.push(`${n} points, ${k} notes, to ${t}, ${tv}, ${w}x${h}: ${s.problems.join(',')} ${s.inTarget} ${s.allReached}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
