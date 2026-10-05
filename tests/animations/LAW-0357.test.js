// LAW-0357 — Cierre de itinerario · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (both hands, the puck and every filter clip move continuously),
// anchoring of objects (the puck stays in the right hand at every moment; a clip moves only while the left hand holds
// it by its tab) and the transformation recognisable with labels hidden (the route supplied as concluded ends inked to
// its end card; each way supplied as pending a check ends with a clip across its track).
// Timing (u): rest 0–0.15 · right hand traces the concluded routes 0.15–0.47 (per route: hop 30 %, trace 70 %), back
// 0.47–0.54 · left hand lays one clip per pending route 0.44–0.70 (per clip: reach 30 %, carry 55 %, let go 15 %), back
// 0.70–0.75 · notes 0.76–0.81 · state tag 0.77–0.82; still from 0.82.
// Legal: routes and states are supplied; nothing says whether any route is closed or available.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0357';

contractSuite(ID, {
  continuity: ['handR', 'handL', 'puck', 'clip0', 'clip1'],
  attach: [
    {from: 0, to: 1, a: 'handR', b: 'puck', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phaseR === 'rest' && s.phaseL === 'rest' && s.inks[0] === 0 && s.laid[1] === 0 && s.badges.every(b => b === 0)", label: 'rest: tracks pale, clips in the tray, badges neutral'},
    {at: 0.145, fn: "s.phaseR === 'rest' && s.inks[0] === 0", label: 'nothing moves during the rest beat'},
    {at: 0.3, fn: "s.phaseR === 'trace' && s.tracing === 0 && s.inks[0] > 0 && s.inks[0] < 1 && s.badges[0] === 0", label: 'the puck traces route 1; its badge waits for the ink to arrive (cause before effect)'},
    {at: 0.5, fn: "s.inks[0] === 1 && s.badges[0] === 1 && s.heldS && s.laid[1] === 0", label: 'route 1 traced (badge shown); the left hand carries the first clip'},
    {at: 1, fn: "s.phaseR === 'rest' && s.phaseL === 'rest' && !s.heldS && s.inks[0] === 1 && s.laid[1] === 1 && s.laid[2] === 1 && s.clipOnTrack.every(d => d < 0.5) && s.badges.every(b => b === 1) && s.allReached && s.problems.length === 0", label: 'hold: route 1 inked, both pending ways clipped, hands back at rest'},
    {at: 1, fn: "s.states.join() === 'concluded,pending,pending' && s.ends[0] === 'Resolution R-2 recorded (fictional)'", label: 'states and end entries stay exactly as supplied'},
    {at: 1, params: {finalState: 'unmarked'}, fn: "s.phaseR === 'rest' && s.inks[0] === 0 && s.laid[1] === 0 && s.badges.every(b => b === 0)", label: 'unmarked: nothing moves'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.inks[0] > 0 && s.inks[0] < 1', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {routes: [{label: 'R-A', state: 'pending', end: 'Not yet checked'}, {label: 'R-B', state: 'concluded', end: 'R-9 recorded'}]}, fn: 's.inks[1] === 1 && s.laid[0] === 1 && s.inks[0] === null && s.laid[1] === null && s.problems.length === 0', label: 'the supplied states alone decide what is traced and what is clipped'},
    {at: 0.1, fn: "s.phaseR === 'rest' && s.inks[0] === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.ref, p.grounds, ...p.routes.flatMap(r => [r.label, r.end]), p.outcomes.concluded, p.outcomes.pending, p.labels.file, p.labels.key, p.actorLabels.a, p.objectLabels.arrows, p.objectLabels.filter, p.objectLabels.calendar, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.decisions.title, p.decisions.ref, p.grounds, ...p.routes.flatMap(r => [r.label, r.end]), p.outcomes.concluded, p.outcomes.pending];',
  captions: 'return [p.objectLabels.arrows, p.objectLabels.filter, p.objectLabels.calendar, p.actorLabels.a];',
});

ratioChecks(ID, 'puck always in hand; clips move only while held; composition fits; hands within reach', [
  {at: times(0, 1, 0.01), fn: 'Math.hypot(s.handR.x - s.puck.x, s.handR.y - s.puck.y) < 1.5', label: 'the puck stays in the right hand'},
  {at: times(0, 1, 0.005), fn: '!s.heldS || Math.hypot(s.handL.x - s.gripS.x, s.handL.y - s.gripS.y) < 1.5', label: 'a carried clip stays in the left hand (by its tab)'},
  {at: times(0, 1, 0.01), fn: "s.phaseL === 'carry' || s.laid.every(v => v === null || v === 0 || v === 1)", label: 'clips are either in the tray, carried or laid'},
  {at: times(0, 1, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, desk, panel)'},
  {at: [1], fn: 's.clipOnTrack.every(d => d < 0.5) && s.inks.every(v => v === null || v === 1)', label: 'every route ends marked with its supplied state'},
]);

// Clips: between two samples a clip either stays put or is held (never moves on its own).
test(`${ID}: a clip never moves unless held`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      let prev = null;
      for (let i = 0; i <= 300; i++) {
        const s = def.evaluate({width: w, height: h, timeMs: (i / 300) * def.defaultParams.durationMs}).semantic;
        if (prev) for (const k of ['clip0', 'clip1']) {
          const moved = Math.hypot(s[k].x - prev[k].x, s[k].y - prev[k].y) > 0.01;
          if (moved && !(s.heldS || prev.heldS)) out.push(`${w}x${h} ${k} u=${i / 300}`);
        }
        prev = s;
      }
    }
    return out;
  }, ID);
  expect(bad.slice(0, 5)).toEqual([]);
});

// Labels hidden: no visible text, yet the traced route and the clipped ways read.
test(`${ID}: labels hidden — no visible text; route traced and ways clipped`, async ({page}) => {
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
      for (const u of [0, 0.3, 0.6, 1]) {
        x.seek(u * x.durationMs);
        text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      }
      const s1 = x.getState({bounds: false}).semantic;
      const ink = svg.querySelector('[data-node="ink0"]');
      res.push({text, ink: s1.inks[0], laid: s1.laid.filter(v => v === 1).length, dash: parseFloat(ink.getAttribute('stroke-dashoffset')), problems: s1.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.ink).toBe(1);
    expect(r.laid).toBe(2);
    expect(r.dash).toBeLessThan(1);
    expect(r.problems).toBe(0);
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

// Every route count (2..3) × every state mix × 0..2 notes composes at every ratio.
test(`${ID}: 2..3 routes × state mixes × 0..2 notes compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const rt = (i, st) => ({label: `Route ${i} (as supplied)`, state: st, end: st === 'pending' ? 'Not yet checked in this file' : `Resolution R-${i + 1} recorded (fictional)`});
    const mixes = [['concluded', 'pending'], ['pending', 'pending'], ['concluded', 'concluded'], ['pending', 'concluded', 'pending'], ['concluded', 'concluded', 'concluded'], ['pending', 'pending', 'pending']];
    const notes = [{target: 'origin', text: 'The starting resolution as supplied'}, {target: 'calendar', text: 'The calendar marks no date'}];
    const out = [];
    for (const mix of mixes) for (const n of [0, 2]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const params = {routes: mix.map((st, i) => rt(i + 1, st)), annotations: notes.slice(0, n)};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || !s.allReached || s.clipOnTrack.some(d => d >= 0.5) || s.inks.some(v => v !== null && v !== 1)) out.push(`${mix.join('/')} n${n} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
