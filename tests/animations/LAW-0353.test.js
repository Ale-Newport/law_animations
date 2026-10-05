// LAW-0353 — Efectos durante revisión · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (both hands and both cards move continuously), anchoring of objects
// (each hand is on its card's corner for the whole advance; nothing moves unless held) and the transformation
// recognisable with labels hidden (both cards leave the start of their lanes and advance in their own lanes; the
// decision card ends past the open gate or before the closed gate, as the supplied datum says).
// Timing (u): rest 0–0.15 · hands to the cards 0.15–0.21 · advance 0.21–0.62 (suspended: the decision card reaches the
// gate at 0.50 and waits) · chevrons past the gate light 0.47–0.64 (maintained only) · release 0.63–0.71 · notes
// 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal: whether the effect is maintained or suspended is a supplied datum only; no doctrine, dates or time limits.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0353';

contractSuite(ID, {
  continuity: ['handP', 'handR', 'cardP', 'cardR'],
  attach: [
    {from: 0.2105, to: 0.6295, a: 'handP', b: 'gripP', tol: 1.5},
    {from: 0.2105, to: 0.6295, a: 'handR', b: 'gripR', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && !s.held && s.kP === 0 && s.kR === 0 && s.tP === s.tStart && s.tR === s.tStart", label: 'rest: both cards at the start of their lanes, hands down'},
    {at: 0.145, fn: 's.reach === 0 && s.kP === 0 && s.kR === 0', label: 'nothing moves during the rest beat'},
    {at: 0.21, fn: 's.reach === 1 && s.kP === 0 && s.kR === 0', label: 'the hands reach the cards before they move (cause before effect)'},
    {at: 0.4, fn: "s.phase === 'advance' && s.held && s.kP > 0 && s.kR > 0 && s.inLanes && s.cardsApart", label: 'both cards advance at once, each in its own lane'},
    {at: 1, fn: "s.phase === 'done' && !s.held && s.passed && s.tP === s.tEnd && s.tR === s.tEnd && s.lit === 1 && !s.closed && s.allReached && s.problems.length === 0", label: 'hold (maintained): the decision card passed the open gate, chevrons lit; the appeal card in its bay'},
    {at: 1, params: {finalState: 'suspended'}, fn: '!s.passed && s.tP === s.tWait && s.leadGap > 0 && s.tR === s.tEnd && s.lit === 0 && s.closed', label: 'suspended (as supplied): the decision card waits before the closed gate; the appeal card still reaches its bay'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.held && s.kR < 1', label: 'actionProgress freezes the action part-way'},
    {at: 0.1, fn: "s.phase === 'rest' && s.kP === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.routes.process, p.routes.review, p.finalState === 'maintained' ? p.outcomes.maintained : p.outcomes.suspended, p.labels.filter, p.labels.key, p.actorLabels.a, p.objectLabels.arrows, p.objectLabels.calendar, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: "return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.finalState === 'maintained' ? p.outcomes.maintained : p.outcomes.suspended];",
  captions: 'return [p.objectLabels.arrows, p.objectLabels.calendar, p.actorLabels.a];',
});

ratioChecks(ID, 'cards move only while held, stay in their lanes, composition fits', [
  {at: times(0, 1, 0.01), fn: '((s.kP === 0 || s.kP === 1) && (s.kR === 0 || s.kR === 1)) || s.held', label: 'a card moves only while its hand holds it'},
  {at: times(0, 1, 0.02), fn: 's.inLanes && s.cardsApart', label: 'each card stays inside its own lane; the cards never touch'},
  {at: times(0.15, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, board, legend)'},
  {at: [1], fn: "s.finalState === 'maintained' ? s.passed : (!s.passed && s.leadGap > 0)", label: 'the decision card ends where the supplied datum leaves it'},
]);

// Labels hidden: no visible text, yet both cards advance and the decision card passes the gate (the action reads).
test(`${ID}: labels hidden — no visible text; both cards advance in their lanes`, async ({page}) => {
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
      for (const u of [0, 0.4, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({fs, text, mP: Math.hypot(s1.cardP.x - s0.cardP.x, s1.cardP.y - s0.cardP.y), mR: Math.hypot(s1.cardR.x - s0.cardR.x, s1.cardR.y - s0.cardR.y), passed: s1.passed, problems: s1.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.mP).toBeGreaterThan(60);
    expect(r.mR).toBeGreaterThan(r.fs === 'maintained' ? 60 : r.mP);
    expect(r.passed).toBe(r.fs === 'maintained');
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

// Every annotation count (0..2) and both supplied data compose at every ratio.
test(`${ID}: 0..2 notes × both data compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const notes = [{target: 'cards', text: 'Both cards keep to their own lanes'}, {target: 'calendar', text: 'The calendar marks no date'}];
    const out = [];
    for (const n of [0, 1, 2]) for (const fs of ['maintained', 'suspended']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {annotations: notes.slice(0, n), finalState: fs}}).semantic;
      if (s.problems.length || !s.inLanes) out.push(`${n} ${fs} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
