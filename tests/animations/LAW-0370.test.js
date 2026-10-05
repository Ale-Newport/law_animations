// LAW-0370 — Transferencia de custodia · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element (anchored to the edges of both element boxes, label
// included), the order does not change on seek (the tracer visits the supplied traversal order, deterministically) and
// a relation is not drawn as causality by default (plain relations have no arrowhead; no causal link unless supplied).
// Timing (u, 8 s): separate 0.02–0.16 · labels 0.16–0.20 · relations drawn one after another 0.19–0.43 · tracer
// 0.44–0.74 with the focus element enlarged 0.43–0.49 → 0.75–0.80 · still hold from 0.80.
// Legal: neutral relations only; no doctrine; a blank row is only a supplied blank row.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0370';

const near = "(c => { const d = (p, b) => Math.max(b.x - p.x, 0, p.x - b.x - b.w) + Math.max(b.y - p.y, 0, p.y - b.y - b.h); return d(c.end, c.toBox) < 16 && d(c.start, c.fromBox) < 16; })";

contractSuite(ID, {
  continuity: ['bag', 'custodianA', 'logB'],
  semantic: [
    {at: 0, fn: "s.phase === 'separate' && s.separated === 0 && s.drawn.every(p => p === 0) && s.tracer === null", label: 'start: elements packed at the hand-off point, nothing drawn'},
    {at: 0.17, fn: 's.separated === 1 && s.drawn.every(p => p === 0)', label: 'elements apart before any relation is drawn'},
    {at: 0.3, fn: 's.drawn.some(p => p === 1) && s.drawn.some(p => p === 0)', label: 'relations are drawn one after another'},
    {at: 0.44, fn: `s.drawn.every(p => p === 1) && s.connectors.every(${near})`, label: 'every connector ends on its element'},
    {at: 0.44, fn: "s.connectors.filter(c => c.kind === 'relation').every(c => !c.arrow) && !s.connectors.some(c => c.kind === 'causal')", label: 'plain relations have no arrowhead; no causal link by default'},
    {at: 0.5, fn: "s.tracer !== null && s.leg === 0 && s.focus === 1", label: 'the tracer starts on the first leg; the focus element is enlarged'},
    {at: 0.7, fn: 's.leg === s.legs.length - 1 && s.legs.every(l => l[2])', label: 'the tracer reaches the last leg along drawn relations only'},
    {at: 1, fn: "s.phase === 'hold' && s.focus === 0 && s.tracer === null && s.problems.length === 0", label: 'hold: still; composition fits'},
    {at: 0.58, fn: 's.leg === 1', label: 'seeking keeps the traversal order (second leg mid-trace)'},
    {at: 1, params: {relationships: [{from: 'custodianA', to: 'bag', kind: 'causal'}]}, fn: "s.connectors.length === 1 && s.connectors[0].arrow && s.connectors[0].kind === 'causal'", label: 'a causal arrow appears only when supplied'},
    {at: 1, params: {records: [{log: 'a', field: 'A', value: 'x'}, {log: 'b', field: 'B', value: ''}]}, fn: 's.rows.a[0] === true && s.rows.b[0] === false', label: 'blank rows come only from the supplied records'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.labels.logA, p.labels.logB, ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])];",
  content: 'return [p.items[0].label, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name)];',
  captions: 'return [...p.elements.map(e => e.label)];',
});

ratioChecks(ID, 'connectors land, composition fits', [
  {at: [0.45, 1], fn: `s.connectors.every(${near})`, label: 'every connector ends on its element'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

// Element art must stay large: bag ≥ 120 and custodian badge radius ≥ 40 design units at every ratio and count.
test(`${ID}: every array count and relation set composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const [na, nb] of [[1, 1], [3, 3], [3, 1], [1, 3], [2, 2]]) for (const kind of ['key', 'cup', 'box']) {
      combos.push({items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}], records: [...Array.from({length: na}, (_, i) => ({log: 'a', field: `Field A${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`})), ...Array.from({length: nb}, (_, i) => ({log: 'b', field: `Field B${i + 1}`, value: `Value ${i + 1}`}))]});
    }
    combos.push({relationships: [{from: 'tag', to: 'logB', kind: 'communication'}], traversalOrder: ['tag', 'logB']});
    combos.push({elements: [{id: 'bag', label: 'Bag'}, {id: 'tag', label: 'Tag'}], relationships: [{from: 'bag', to: 'tag', kind: 'relation'}], traversalOrder: ['bag', 'tag']});
    combos.push({timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}]});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || s.bagH < 120 || s.personR < 40) out.push(`${JSON.stringify(params).slice(0, 70)} ${w}x${h} ${tv}: ${s.problems.join(',')} bag=${s.bagH} R=${s.personR}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Text never renders under 16 px at any moment (sheet rows print only at full size).
test(`${ID}: visible text >= 16 px at 1080p at every sampled time`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready;
      const svg = x.element;
      const k = 1080 / Math.min(w, h);
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      for (let i = 0; i <= 40; i++) {
        x.seek(x.durationMs * i / 40);
        const rootM = svg.getScreenCTM();
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = rootM.inverse().multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
          if (px < 15.9) bad.push(`${w}x${h} u=${i / 40}: ${t.textContent.slice(0, 20)} ${px.toFixed(1)}`);
        }
      }
      x.destroy(); el.remove();
    }
    return bad;
  }, ID);
  expect(out.slice(0, 5)).toEqual([]);
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
