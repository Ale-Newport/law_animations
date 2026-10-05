// LAW-0350 — Devolución para nuevo examen · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its own component (anchored on the edges of the two cards it joins,
// never crossing another card); the traversal order does not change when seeking; a plain relation is not drawn as
// causality (no arrowhead unless a directed kind is supplied; the return is a supplied sequence link captioned "as
// configured (illustrative)").
// Timing (u): separate 0.04–0.16 (the notes card slides out of the folder card) · relationships one after the other
// 0.18–0.42 · tracer 0.44–0.74 (focus enlarges; a copy of the folder with its notes settles in the configured tray when
// the tracer reaches it) · still from 0.75.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0350';

contractSuite(ID, {
  continuity: ['notesCard', 'tracer', 'folderPos'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.exploded === 0 && s.copy === 0 && s.connectors.every(c => c.drawn === 0)", label: 'start: notes on the folder; no relation drawn yet'},
    {at: 0.18, fn: 's.exploded === 1 && s.connectors.every(c => c.drawn === 0)', label: 'components separated before any relation is drawn'},
    {at: 0.43, fn: 's.connectors.every(c => c.drawn === 1) && s.tracer === null', label: 'all supplied relations drawn before the tracer starts'},
    {at: 0.6, fn: "s.tracer !== null && s.reached[0] === 'notes'", label: 'the tracer follows the traversal order from its first component'},
    {at: 1, fn: "s.copy === 1 && s.connectors.filter(c => c.kind === 'relation').every(c => !c.arrow) && s.problems.length === 0", label: 'hold: copy in the configured tray; plain relations without arrowheads; composition fits'},
    {at: 1, params: {relationships: [{from: 'notes', to: 'folder', kind: 'causal'}]}, fn: 's.connectors.length === 1 && s.connectors[0].arrow', label: 'only a supplied directed kind gets an arrowhead'},
    {at: 0.5, fn: "s.focus === 'doors'", label: 'the supplied focus component is used'},
    {at: 0.1, fn: 's.copy === 0 && s.folderMove === 0', label: 'seeking back restores the separation beat'},
    {at: 1, fn: 's.folderMove === 1 && Math.abs(s.folderPos.x - (s.boxes.point.x + s.boxes.point.w / 2)) < s.boxes.point.w / 2', label: 'the folder itself travels to the configured tray (no teleport: continuity track folderPos)'},
    {at: 1, fn: "s.footnotes === false", label: 'connector captions are direct labels (no numbered footnotes) in the baseline'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.grounds, ...p.routes.stations, p.routes.origin, p.labels.route, p.labels.point, p.labels.key, p.outcomes.renewed, ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label || p.relationLabels[r.kind])];",
  content: 'return [p.decisions.title, ...p.grounds, ...p.routes.stations];',
  captions: '',
});

ratioChecks(ID, 'connectors anchored, order stable, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits (text floor, cards, labels, nothing crossing)'},
  {at: [1], fn: "s.connectors.every(c => { const B = s.boxes[c.from], E = s.boxes[c.to]; const near = (p, b) => p.x >= b.x - 24 && p.x <= b.x + b.w + 24 && p.y >= b.y - 24 && p.y <= b.y + b.h + 24; return near(c.a, B) && near(c.b, E); })", label: 'every connector ends on its own two components'},
  {at: times(0.44, 0.74, 0.03), fn: 's.visits.every((v, i, a) => i === 0 || v.t >= a[i - 1].t)', label: 'traversal visits stay in the supplied order'},
]);

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

test(`${ID}: labels hidden — no visible text; the copy still settles in the configured tray`, async ({page}) => {
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
      res.push({text, copy: s.copy, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.copy).toBe(1); expect(r.problems).toBe(0); }
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

test(`${ID}: 2..3 points, 1..3 notes and 1..max relationships compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const rels = def.defaultParams.relationships;
    const more = [...rels, {from: 'notes', to: 'point', kind: 'relation'}, {from: 'folder', to: 'renewed', kind: 'relation'}];
    for (const n of [2, 3]) for (const k of [1, 3]) for (const rl of [rels.slice(0, 1), rels, more]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const stations = Array.from({length: n}, (_, i) => `Point ${i + 1} (fictional)`);
      const grounds = Array.from({length: k}, (_, i) => `Note ${i + 1} (fictional)`);
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {routes: {stations, origin: 'Review desk (fictional)', returnTo: n - 1}, grounds, relationships: rl}}).semantic;
      if (s.problems.length) out.push(`${n}/${k}/${rl.length} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
