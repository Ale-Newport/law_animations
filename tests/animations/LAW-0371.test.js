// LAW-0371 — Transferencia de custodia · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete hand-off rooms of identical size), exactly the indicated fact
// changes (only room B's sheet B stays without entry: B's pen hand never writes there; everything else runs identically)
// and no legal consequence is invented to complete the contrast (neutral note, no winner, no score).
// Timing (u, 9 s): base 0–0.17 · change (ring 0.20–0.28, Δ 0.26–0.33, room B only) · parallel hand-off: A reaches
// 0.40–0.43, carries 0.43–0.50, B reaches 0.46–0.50, shared hold 0.50–0.54, B carries 0.54–0.61, A writes 0.59–0.68,
// B writes (room A only) 0.67–0.76 · guide 0.79–0.85 · note 0.82–0.87; still from 0.87.
// Legal: a documentary gap is a supplied fact with no stated consequence; no chain-of-custody doctrine.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0371';
const same = (a, b) => `JSON.stringify(s.${a}) === JSON.stringify(s.${b})`;

contractSuite(ID, {
  continuity: ['bagA', 'bagB', 'handAcA', 'handAcB', 'handBcA', 'handBcB', 'handApA', 'handApB', 'handBpA', 'handBpB'],
  attach: [
    {from: 0.4305, to: 0.5395, a: 'handAcA', b: 'gripAA', tol: 1.5},
    {from: 0.4305, to: 0.5395, a: 'handAcB', b: 'gripAB', tol: 1.5},
    {from: 0.5005, to: 0.6095, a: 'handBcA', b: 'gripBA', tol: 1.5},
    {from: 0.5005, to: 0.6095, a: 'handBcB', b: 'gripBB', tol: 1.5},
    {from: 0, to: 1, a: 'handApA', b: 'penGripAA', tol: 1.5},
    {from: 0, to: 1, a: 'handBpA', b: 'penGripBA', tol: 1.5},
    {from: 0, to: 1, a: 'handApB', b: 'penGripAB', tol: 1.5},
    {from: 0, to: 1, a: 'handBpB', b: 'penGripBB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: `s.beat === 'base' && ${same('lookA', 'lookB')} && s.gapRing === 0 && s.gapMark === 0 && s.sameSize`, label: 'base: identical rooms, nothing marked'},
    {at: 0.36, fn: "s.gapRing === 1 && s.gapMark === 1 && JSON.stringify({...s.lookA, gapMark: 1}) === JSON.stringify(s.lookB)", label: 'the change: only room B\'s sheet B is marked (supplied fact)'},
    {at: 0.52, fn: "s.holderA === 'shared' && s.holderB === 'shared' && JSON.stringify(s.lookA.bag) === JSON.stringify(s.lookB.bag)", label: 'the hand-off runs identically in parallel (shared hold on the tray)'},
    {at: 0.64, fn: `${same('writtenAA', 'writtenAB')} && s.atBA && s.atBB`, label: 'sheet A is written the same way in both rooms'},
    {at: 0.72, fn: 's.writtenBA.some(v => v > 0) && s.writtenBB.every(v => v === 0) && JSON.stringify(s.lookA.handBp) !== JSON.stringify(s.lookB.handBp)', label: 'only in room A does B write sheet B (B\'s pen hand moves only there)'},
    {at: 1, fn: "s.writtenBA.every(v => v === 1) && s.writtenBB.every(v => v === 0) && s.guide === 1 && s.note === 1 && s.allReached && s.problems.length === 0", label: 'hold: guide and neutral note; composition fits'},
    {at: 0.7, fn: 's.guide === 0 && s.note === 0', label: 'the guide waits for the hold'},
    {at: 0.1, fn: `s.beat === 'base' && ${same('lookA', 'lookB')}`, label: 'seeking back restores the identical base'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.labels.logA, p.labels.logB, p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: 'return [p.changedFact, p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.scenarioA.caption, p.scenarioB.caption];',
});

ratioChecks(ID, 'bags held while moved, hands within reach, equal rooms', [
  {at: times(0.38, 0.8, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: [0, 0.5, 1], fn: 's.sameSize && s.stageA.w === s.stageB.w && s.stageA.h === s.stageB.h', label: 'the two rooms have identical size'},
  {at: [1], fn: 's.problems.length === 0 && s.atBA && s.atBB', label: 'a composition fits and both bags end with B'},
]);

test(`${ID}: every array count, object kind composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const [na, nb] of [[1, 1], [3, 3], [3, 1], [1, 3], [2, 2]]) for (const kind of ['key', 'cup', 'box']) {
      combos.push({items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}], records: [...Array.from({length: na}, (_, i) => ({log: 'a', field: `Field A${i + 1}`, value: `Value ${i + 1}`})), ...Array.from({length: nb}, (_, i) => ({log: 'b', field: `Field B${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`}))]});
    }
    combos.push({sharedFacts: [], timestamps: [{label: 'a', time: '1'}]});
    combos.push({sharedFacts: ['One', 'Two', 'Three', 'Four'], timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}]});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.atBA || !s.atBB || s.S < 120 || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 70)} ${w}x${h} ${tv}: ${s.problems.join(',')} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; both bags pass to B; only room B's sheet B stays blank`, async ({page}) => {
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
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      const text = [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      res.push({text, ok: s1.atBA && s1.atBB && s1.writtenBA.every(v => v === 1) && s1.writtenBB.every(v => v === 0) && s1.gapMark === 1});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.ok).toBe(true); }
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
