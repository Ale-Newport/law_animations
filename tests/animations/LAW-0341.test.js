// LAW-0341 — Confirmación ilustrativa · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (both hands, card B and the strip move continuously), anchoring of
// objects (the right hand is on card B's lower corner for the whole slide; the left hand on the strip's tab while it is
// carried and laid; nothing moves unless held) and the transformation recognisable with labels hidden (card B leaves its
// loose, turned place and ends square beside card A with the arrow marks meeting; the strip lies across the aligned rows).
// Timing (u): rest 0–0.15 · right hand to B 0.15–0.21 · slide 0.21–0.43 (lifted 0.21–0.24, set down 0.41–0.45) ·
// release 0.46–0.56 · left hand to the strip 0.45–0.51 · strip carried 0.51–0.63 · laid 0.63–0.66 · hand back
// 0.66–0.73 · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal: the printed results are supplied text and never change; no doctrine on what a confirmation means.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0341';

contractSuite(ID, {
  continuity: ['handR', 'handL', 'cardB', 'stripC'],
  attach: [
    {from: 0.2105, to: 0.4595, a: 'handR', b: 'gripB', tol: 1.5},
    {from: 0.5105, to: 0.6595, a: 'handL', b: 'gripS', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && !s.heldB && !s.heldS && s.slide === 0 && s.strip === 0 && s.tipGap > 20", label: 'rest: card B lies loose (arrow marks apart), strip parked, hands down'},
    {at: 0.145, fn: "s.phase === 'rest' && s.reach === 0 && s.slide === 0", label: 'nothing moves during the rest beat'},
    {at: 0.21, fn: 's.reach === 1 && s.slide === 0', label: 'the hand reaches card B before it moves (cause before effect)'},
    {at: 0.32, fn: "s.phase === 'slide' && s.heldB && s.slide > 0 && s.slide < 1", label: 'card B slides while held'},
    {at: 0.57, fn: "s.heldS && s.strip > 0 && s.strip < 1 && !s.heldB", label: 'the strip is carried by the left hand after the right hand let go'},
    {at: 1, fn: "s.phase === 'laid' && !s.heldB && !s.heldS && s.tipGap < 8 && s.tipDy < 0.5 && s.rowDy < 0.5 && s.stripOnRow < 0.5 && s.cardBdeg === 0 && s.allReached && s.problems.length === 0", label: 'hold: card B square beside A, arrow marks meet on one line, strip across the aligned rows'},
    {at: 1, fn: 's.results[0] === "Result as given (placeholder text)" && s.results[1] === "Result as given (placeholder text)"', label: 'the printed results stay exactly as supplied'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.phase === 'rest' && s.slide === 0 && s.strip === 0 && s.tipGap > 20", label: 'pending: nothing moves, card B stays where it lies'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.heldB && s.slide < 1', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {routes: {align: 'header', label: 'Header rows (as configured)'}}, fn: "s.align === 'header' && s.tipGap < 8 && s.stripOnRow < 0.5", label: 'the configured row alone decides where the marks and the strip sit'},
    {at: 0.1, fn: "s.phase === 'rest' && s.slide === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.a.role, p.decisions.a.title, p.decisions.a.ref, p.decisions.b.role, p.decisions.b.title, p.decisions.b.ref, p.grounds.a, p.grounds.b, p.outcomes.a, p.outcomes.b, p.routes.label, p.labels.key, p.actorLabels.a, p.objectLabels.arrows, p.objectLabels.result, p.objectLabels.calendar, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.decisions.a.role, p.decisions.a.title, p.decisions.a.ref, p.decisions.b.role, p.decisions.b.title, p.decisions.b.ref, p.grounds.a, p.grounds.b, p.outcomes.a, p.outcomes.b];',
  captions: 'return [p.objectLabels.arrows, p.objectLabels.result, p.objectLabels.calendar, p.actorLabels.a];',
});

ratioChecks(ID, 'card B only moves while held; composition fits; hands within reach; results never change', [
  {at: times(0, 1, 0.01), fn: '(s.slide === 0 || s.slide === 1) || s.heldB', label: 'card B moves only while the right hand holds it'},
  {at: times(0, 1, 0.01), fn: '(s.strip === 0 || s.strip === 1) || s.heldS', label: 'the strip moves only while the left hand holds it'},
  {at: times(0.15, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, desk, panel)'},
  {at: [1], fn: 's.tipGap < 8 && s.rowDy < 0.5 && s.stripOnRow < 0.5', label: 'the cards end aligned on the configured row under the strip'},
  {at: times(0, 1, 0.05), params: {outcomes: {a: 'Result A as supplied', b: 'Result B as supplied'}}, fn: "s.results[0] === 'Result A as supplied' && s.results[1] === 'Result B as supplied'", label: 'the printed results equal the supplied ones at every time'},
]);

// The result text drawn on each card is the same DOM text at every sampled time (it is never animated).
test(`${ID}: printed results never change in the DOM`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080}); await x.ready;
    const seen = new Set();
    for (let i = 0; i <= 40; i++) {
      x.seek((i / 40) * x.durationMs);
      const ts = ['carda-art-res-t', 'cardb-art-res-t'].map(n => { const t = x.element.querySelector(`[data-node="${n}"]`); return t ? `${t.textContent}|${t.getAttribute('opacity') || 1}` : 'missing'; });
      seen.add(ts.join('/'));
    }
    x.destroy(); el.remove();
    return [...seen];
  }, ID);
  expect(out.length).toBe(1);
  expect(out[0]).not.toContain('missing');
});

// Labels hidden: no visible text, yet card B ends square beside card A with the marks meeting (the action reads).
test(`${ID}: labels hidden — no visible text; card B ends aligned beside card A`, async ({page}) => {
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
      res.push({text, moved: Math.hypot(s1.cardB.x - s0.cardB.x, s1.cardB.y - s0.cardB.y), gap0: s0.tipGap, gap1: s1.tipGap, strip: s1.strip});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(60);
    expect(r.gap0).toBeGreaterThan(20);
    expect(r.gap1).toBeLessThan(8);
    expect(r.strip).toBe(1);
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

// Every annotation count (0..2) and both alignment rows compose at every ratio.
test(`${ID}: 0..2 notes × both alignment rows compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const notes = [{target: 'cards', text: 'Both cards are the same size (as supplied)'}, {target: 'calendar', text: 'The calendar marks no date'}];
    const out = [];
    for (const n of [0, 1, 2]) for (const align of ['result', 'header']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {annotations: notes.slice(0, n), routes: {align, label: 'Alignment guide (as configured)'}}}).semantic;
      if (s.problems.length || s.tipGap >= 8) out.push(`${n} ${align} ${w}x${h}: ${s.problems.join(',')} gap ${s.tipGap}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
