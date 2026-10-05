// LAW-0358 — Cierre de itinerario · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its part (both ends anchored to the part's edge in every frame,
// also while parts move, are enlarged or gather), the visiting order does not change when seeking, and a plain
// relation is never drawn as causality (no arrowhead unless a sequence/causal link is supplied).
// Timing (u): separate 0.03–0.17 (file outline fades 0.03–0.12) · relations drawn 0.19–0.42 · marker 0.44–0.74 ·
// gather 0.76–0.82 · state badges 0.78–0.84 · state tag 0.80–0.85; still from 0.85.
// Legal: states are supplied; nothing says whether a route is closed or available.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0358';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.apart === 0 && s.outline === 1 && s.links.every(l => l.p === 0) && !s.tracing && s.badges === 0", label: 'start: the parts packed in the file outline, nothing related yet'},
    {at: 0.18, fn: 's.apart === 1 && s.outline === 0 && s.links.every(l => l.p === 0)', label: 'the parts are apart before any relation is drawn'},
    {at: 0.43, fn: 's.links.every(l => l.p === 1 && l.endsOk && !l.crosses)', label: 'every supplied relation is drawn, ends on its two parts and crosses no other part'},
    {at: 0.3, fn: 's.links.every(l => l.endsOk)', label: 'connector ends stay on the parts while drawing'},
    {at: 0.58, fn: 's.tracing && s.links.every(l => l.endsOk)', label: 'connector ends stay on the parts while the focus part is enlarged'},
    {at: 0.79, fn: 's.links.every(l => l.endsOk) && s.gather > 0 && s.gather < 1', label: 'connector ends follow the parts while they gather'},
    {at: 1, fn: "s.arrowheads === 0 && s.links.every(l => l.kind === 'relation')", label: 'default: plain relations only — no arrowhead, nothing causal'},
    {at: 1, fn: 's.badges === 1 && s.gather === 1 && JSON.stringify(s.visited) === JSON.stringify(s.order) && s.problems.length === 0', label: 'hold: badges show the supplied states; every part visited in the supplied order'},
    {at: 1, fn: "s.states.join() === 'concluded,pending,pending'", label: 'states stay exactly as supplied'},
    {at: 1, params: {relationships: [{from: 'origin', to: 'end1', kind: 'sequence'}, {from: 'origin', to: 'end2', kind: 'relation'}]}, fn: 's.arrowheads === 1 && s.links.length === 2', label: 'an arrowhead appears only for a supplied sequence link'},
    {at: 0.6, params: {traversalOrder: ['filter', 'origin', 'end1']}, fn: "s.order.join() === 'filter,origin,end1' && s.visited[0] === 'filter'", label: 'the supplied traversal order alone decides the visiting order'},
    {at: 1, params: {routes: [{label: 'A', state: 'pending', end: 'Not yet checked'}, {label: 'B', state: 'concluded', end: 'R-9 recorded'}]}, fn: '!("end3" in s.parts) && s.links.length === 3', label: 'an end card exists only for a supplied route; links to it are dropped'},
    {at: 0.1, fn: "s.beat === 'separate' && !s.tracing", label: 'seeking back restores the separation state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.ref, p.grounds, ...p.routes.flatMap(r => [r.label, r.end]), p.outcomes.concluded, p.outcomes.pending, p.labels.key, ...p.elements.filter(e => !/^end\\d$/.test(e.id) || Number(e.id.slice(3)) <= p.routes.length).map(e => e.label), ...[...new Set(p.relationships.filter(r => [r.from, r.to].every(id => !/^end\\d$/.test(id) || Number(id.slice(3)) <= p.routes.length) && p.elements.some(e => e.id === r.from) && p.elements.some(e => e.id === r.to)).map(r => r.kind))].map(k => p.relationLabels[k]), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.decisions.title, p.decisions.ref, p.grounds, ...p.routes.flatMap(r => [r.label, r.end]), p.outcomes.concluded, p.outcomes.pending];',
  captions: 'return [];',
});

ratioChecks(ID, 'connectors land on their parts with real length; the visiting order holds; composition fits', [
  {at: times(0.18, 1, 0.02), fn: 's.links.every(l => l.p === 0 || (l.endsOk && !l.crosses))', label: 'each drawn connector ends on its two parts and crosses no other part'},
  {at: [0.43, 1], fn: 's.links.every(l => l.len >= 2 * s.textPx / 1.2)', label: 'connectors are long enough to read (no stubs)'},
  {at: times(0, 1, 0.02), fn: 's.visited.every((id, i) => s.order[i] === id)', label: 'the marker visits the parts only in the supplied order'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

test(`${ID}: labels hidden — no visible text; the parts separate and relate`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const y = def.create(el, {width: w, height: h, params: {textVisibility: 'none'}}); await y.ready;
      const svg = y.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      let text = 0;
      for (const u of [0, 0.5, 1]) { y.seek(u * y.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      y.seek(0); const s0 = y.getState({bounds: false}).semantic;
      y.seek(y.durationMs); const s1 = y.getState({bounds: false}).semantic;
      const d = id2 => Math.hypot(s1.parts[id2].x - s1.parts.origin.x, s1.parts[id2].y - s1.parts.origin.y) - Math.hypot(s0.parts[id2].x - s0.parts.origin.x, s0.parts[id2].y - s0.parts.origin.y);
      res.push({text, apart: d('end1'), links: s1.links.length, problems: s1.problems.length});
      y.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.apart).toBeGreaterThan(30);
    expect(r.links).toBe(5);
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

test(`${ID}: 2..3 routes × element subsets compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const rt = (i, st) => ({label: `Route ${i} (as supplied)`, state: st, end: st === 'pending' ? 'Not yet checked in this file' : `Resolution R-${i + 1} recorded (fictional)`});
    const all = def.defaultParams.elements;
    const subsets = [all, all.filter(e => e.id !== 'calendar'), all.filter(e => e.id !== 'filter'), all.filter(e => ['origin', 'end1'].includes(e.id))];
    const out = [];
    for (const n of [2, 3]) for (const els of subsets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const params = {routes: [rt(1, 'concluded'), rt(2, 'pending'), rt(3, 'pending')].slice(0, n), elements: els};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length || s.links.some(l => !l.endsOk || l.crosses)) out.push(`${n} ${els.length} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
