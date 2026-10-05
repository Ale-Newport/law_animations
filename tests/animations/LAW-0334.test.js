// LAW-0334 — Límites de revisión · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its own component (anchored on the edges of the two components it
// joins, never crossing another component); the traversal order does not change when seeking; a plain relation is
// not drawn as causality (no arrowhead unless the author supplies a directed kind).
// Timing (u): separate 0.04–0.17 (the frame lifts off the decision and slides out, same size) · relationships drawn one
// after the other 0.18–0.42 · tracer 0.44–0.74 (focus enlarges near its visits; copies of the enclosed sections slide
// into the frame's glass when the tracer first reaches it) · card states 0.75–0.80; still from 0.80.
// Legal: plain relations by default; the frame shows the supplied range only; inside / outside is descriptive.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0334';

contractSuite(ID, {
  continuity: ['frame', 'tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.exploded === 0 && s.copies === 0 && s.connectors.every(c => c.drawn === 0)", label: 'start: the frame lies on the decision; no relation drawn yet'},
    {at: 0.18, fn: 's.exploded === 1 && s.connectors.every(c => c.drawn === 0)', label: 'the frame is separated before any relation is drawn'},
    {at: 0.43, fn: 's.connectors.every(c => c.drawn === 1) && s.tracer === null', label: 'all supplied relations drawn before the tracer starts'},
    {at: 0.6, fn: "s.tracer !== null && s.reached[0] === 'decision'", label: 'the tracer follows the traversal order from its first component'},
    {at: 1, fn: "s.copies === 1 && s.states === 1 && s.connectors.every(c => !c.arrow) && s.problems.length === 0", label: 'hold: copies in the glass, card states shown, plain relations without arrowheads, composition fits'},
    {at: 1, params: {relationships: [{from: 'decision', to: 'frame', kind: 'causal'}]}, fn: 's.connectors.length === 1 && s.connectors[0].arrow', label: 'a supplied causal link is the only way to get a directed style'},
    {at: 0.5, fn: "s.focus === 'frame'", label: 'the supplied focus component is used'},
    {at: 0.1, fn: 's.copies === 0 && s.states === 0', label: 'seeking back restores the separation beat'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.decisions.sections, ...p.grounds.map(g => g.text), p.labels.frame, p.labels.key, ...p.elements.filter(e => e.id.startsWith('question')).map(e => e.label), ...p.relationships.map(r => r.label || p.relationLabels[r.kind])];",
  content: 'return [p.decisions.title, ...p.decisions.sections, ...p.grounds.map(g => g.text)];',
  captions: '',
});

ratioChecks(ID, 'connectors anchored, order stable, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, labels placed, nothing crossing)'},
  {at: [1], fn: "s.connectors.every(c => { const B = s.boxes[c.from], E = s.boxes[c.to]; const near = (p, b) => p.x >= b.x - 24 && p.x <= b.x + b.w + 24 && p.y >= b.y - 24 && p.y <= b.y + b.h + 24; return near(c.a, B) && near(c.b, E); })", label: 'every connector ends on its own two components'},
  {at: times(0.44, 0.74, 0.02), fn: 's.visits.length >= 2 && s.visits.every((v, i, a) => i === 0 || v.t >= a[i - 1].t)', label: 'traversal visits stay in the supplied order'},
]);

// The order of visits is the same whatever the seek history (forward, backward, random).
test(`${ID}: tracer visits do not depend on the seek order`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080}); await x.ready;
    const ts = [0.5, 0.7, 0.45, 0.62, 0.55, 0.73, 0.48];
    const at = t => { x.seek(t * x.durationMs); return JSON.stringify(x.getState({bounds: false}).semantic.reached); };
    const a = ts.map(at), b = ts.slice().reverse().map(at).reverse();
    x.destroy(); el.remove();
    return {a, b};
  }, ID);
  expect(out.a).toEqual(out.b);
});

test(`${ID}: labels hidden — no visible text; the frame is separated and the copies sit in its glass`, async ({page}) => {
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
      res.push({text, copies: s.copies, exploded: s.exploded, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.copies).toBe(1); expect(r.exploded).toBe(1); expect(r.problems).toBe(0); }
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

test(`${ID}: 3..6 sections and 1..max relationships compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const rels = [{from: 'decision', to: 'frame', kind: 'relation'}, {from: 'frame', to: 'questionA', kind: 'relation'}, {from: 'frame', to: 'questionB', kind: 'relation'}, {from: 'questionA', to: 'questionB', kind: 'sequence'}];
    for (const n of [3, 4, 5, 6]) for (const k of [1, 3, 4]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const sections = Array.from({length: n}, (_, i) => `Section ${i + 1} (supplied text)`);
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {decisions: {title: 'Decision (fictional)', sections}, routes: {from: 0, to: Math.min(1, n - 1)}, relationships: rels.slice(0, k)}}).semantic;
      if (s.problems.length) out.push(`${n} sections, ${k} rels, ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
