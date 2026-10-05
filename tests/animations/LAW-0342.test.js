// LAW-0342 — Confirmación ilustrativa · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its part (both ends anchored to the part's edge in every frame,
// also while parts move or the focus part is enlarged), the visiting order does not change when seeking, and a plain
// relation is never drawn as causality (no arrowhead unless a sequence/causal link is supplied).
// Timing (u): separate 0.04–0.18 · relations drawn 0.19–0.42 (in the supplied order) · marker 0.44–0.74 · B's result
// field brought level 0.75–0.81 · state tag 0.80–0.85; still from 0.85.
// Legal: the printed results are supplied text and never change; no doctrine on what a confirmation means.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0342';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.apart === 0 && s.links.every(l => l.p === 0) && !s.tracing", label: 'start: the aligned pair, nothing related yet'},
    {at: 0.18, fn: 's.apart === 1 && s.links.every(l => l.p === 0)', label: 'the parts are apart before any relation is drawn'},
    {at: 0.43, fn: 's.links.every(l => l.p === 1 && l.endsOk)', label: 'every supplied relation is drawn and ends on its two parts'},
    {at: 0.3, fn: 's.links.every(l => l.endsOk)', label: 'connector ends stay on the parts while drawing'},
    {at: 0.5, fn: 's.tracing && s.links.every(l => l.endsOk)', label: 'connector ends stay on the parts while the focus part is enlarged'},
    {at: 0.78, fn: 's.links.every(l => l.endsOk) && s.level > 0 && s.level < 1', label: 'connector ends follow B\'s result field while it is brought level'},
    {at: 1, fn: "s.arrowheads === 0 && s.links.every(l => l.kind === 'relation')", label: 'default: plain relations only — no arrowhead, nothing causal'},
    {at: 1, fn: 's.tipGap < 8 && s.level === 1 && JSON.stringify(s.visited) === JSON.stringify(s.order) && s.problems.length === 0', label: 'hold: results level (arrow marks meet), every part visited in the supplied order'},
    {at: 1, params: {relationships: [{from: 'original', to: 'confirming', kind: 'sequence'}, {from: 'original', to: 'resultA', kind: 'relation'}]}, fn: 's.arrowheads === 1 && s.links.length === 2', label: 'an arrowhead appears only for a supplied sequence link'},
    {at: 0.6, params: {traversalOrder: ['guide', 'original', 'confirming']}, fn: "s.order.join() === 'guide,original,confirming' && s.visited[0] === 'guide'", label: 'the supplied traversal order alone decides the visiting order'},
    {at: 1, params: {elements: [{id: 'original', label: 'Card A'}, {id: 'confirming', label: 'Card B'}]}, fn: '!("resultA" in s.parts) && !("guide" in s.parts) && s.links.length === 1', label: 'parts left out are not drawn; links to them are dropped'},
    {at: 0.1, fn: "s.beat === 'separate' && !s.tracing", label: 'seeking back restores the separation state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.a.role, p.decisions.a.title, p.decisions.a.ref, p.decisions.b.role, p.decisions.b.title, p.decisions.b.ref, p.grounds.a, p.grounds.b, p.outcomes.a, p.outcomes.b, p.labels.key, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k]), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.decisions.a.role, p.decisions.a.title, p.decisions.a.ref, p.decisions.b.role, p.decisions.b.title, p.decisions.b.ref, p.grounds.a, p.grounds.b, p.outcomes.a, p.outcomes.b, ...p.elements.map(e => e.label)];',
  captions: 'return [];',
});

ratioChecks(ID, 'connectors land on their parts; the visiting order holds; composition fits', [
  {at: times(0.18, 1, 0.02), fn: 's.links.every(l => l.p === 0 || l.endsOk)', label: 'each drawn connector ends on its two parts'},
  {at: times(0, 1, 0.02), fn: 's.visited.every((id, i) => s.order[i] === id)', label: 'the marker visits the parts only in the supplied order'},
  {at: [1], fn: 's.problems.length === 0 && s.tipGap < 8', label: 'a composition fits; the result fields end level'},
  {at: times(0, 1, 0.1), params: {outcomes: {a: 'Result A as supplied', b: 'Result B as supplied'}}, fn: "s.results[0] === 'Result A as supplied' && s.results[1] === 'Result B as supplied'", label: 'the printed results equal the supplied ones at every time'},
]);

// The result texts are static DOM text (never animated); with labels hidden the decomposition still reads.
test(`${ID}: printed results never change; labels hidden shows the parts apart and the fields level`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080}); await x.ready;
    const seen = new Set();
    for (let i = 0; i <= 40; i++) {
      x.seek((i / 40) * x.durationMs);
      seen.add(['resa-t', 'resb-t'].map(n => { const t = x.element.querySelector(`[data-node="${n}"]`); return t ? t.textContent : 'missing'; }).join('/'));
    }
    x.destroy(); el.remove();
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el2 = document.createElement('div'); document.getElementById('slots').appendChild(el2);
      const y = def.create(el2, {width: w, height: h, params: {textVisibility: 'none'}}); await y.ready;
      const svg = y.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      y.seek(0); const s0 = y.getState({bounds: false}).semantic;
      y.seek(y.durationMs); const s1 = y.getState({bounds: false}).semantic;
      const text = [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      res.push({text, apart: Math.abs(s1.parts.confirming.x - s1.parts.original.x) - Math.abs(s0.parts.confirming.x - s0.parts.original.x), gap: s1.tipGap, links: s1.links.length});
      y.destroy(); el2.remove();
    }
    return {seen: [...seen], res};
  }, ID);
  expect(out.seen.length).toBe(1);
  expect(out.seen[0]).not.toContain('missing');
  for (const r of out.res) {
    expect(r.text).toBe(0);
    expect(r.apart).toBeGreaterThan(40);
    expect(r.gap).toBeLessThan(8);
    expect(r.links).toBe(5);
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

// Every valid count of parts (2..5) and of relationships (1..8) renders a real scene that fits at every ratio.
test(`${ID}: 2..5 parts and 1..8 relationships compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const ids = ['original', 'confirming', 'resultA', 'resultB', 'guide'];
    const allRels = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) allRels.push({from: ids[i], to: ids[j], kind: 'relation'});
    const out = [];
    for (const n of [2, 3, 4, 5]) for (const k of [1, 4, 8]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const elements = ids.slice(0, n).map(id => ({id, label: `Part ${id} (as supplied)`}));
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {elements, relationships: allRels.slice(0, k), traversalOrder: ids.slice(0, n)}}).semantic;
      if (s.problems.length || !s.links.every(l => l.endsOk) || Object.keys(s.parts).length !== n) out.push(`${n} parts ${k} rels ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
