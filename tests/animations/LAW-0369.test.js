// LAW-0369 — Transferencia de custodia · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (hands, bag and pen tips move continuously), anchoring of objects
// (A's carry hand holds the bag's near edge while it is carried to the counter tray; both hands hold it on the tray;
// B's carry hand holds its far edge while it is carried to B's desk; each pen stays in its custodian's hand and its tip
// follows the ink) and the transformation recognisable with labels hidden (the bag ends on B's desk; the sheets carry
// their own rows, or sheet B stays blank in the supplied gap state).
// Timing (u, 8 s): rest 0–0.15 · A reaches 0.15–0.20 · A carries 0.20–0.30 · B reaches 0.25–0.30 · shared hold
// 0.30–0.35 · A returns 0.35–0.41 · B carries 0.35–0.45 · B returns 0.45–0.51 · A writes 0.43–0.58 · B writes
// 0.57–0.72 · notes 0.74–0.80 · state 0.75–0.81; still from 0.81.
// Legal: neutral process; a documentary gap is a supplied fact with no stated consequence; no chain-of-custody doctrine.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0369';

contractSuite(ID, {
  continuity: ['handAc', 'handBc', 'handAp', 'handBp', 'bag', 'tipA', 'tipB'],
  attach: [
    {from: 0.2005, to: 0.3495, a: 'handAc', b: 'gripA', tol: 1.5},
    {from: 0.3005, to: 0.4495, a: 'handBc', b: 'gripB', tol: 1.5},
    {from: 0, to: 1, a: 'handAp', b: 'penGripA', tol: 1.5},
    {from: 0, to: 1, a: 'handBp', b: 'penGripB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && s.bag.x === s.bagStart.x && s.bag.y === s.bagStart.y && s.writtenA.every(v => v === 0) && s.writtenB.every(v => v === 0)", label: 'rest: the bag lies on A\'s desk, both sheets unwritten'},
    {at: 0.145, fn: "s.phase === 'rest' && s.holder === null", label: 'nothing moves during the rest beat'},
    {at: 0.25, fn: "s.phase === 'carry-a' && s.holder === 'a' && s.moving === 'a'", label: 'A carries the bag toward the tray'},
    {at: 0.325, fn: "s.holder === 'shared' && s.atTray", label: 'both hands hold the bag on the tray (shared hand-off point)'},
    {at: 0.4, fn: "s.holder === 'b' && s.moving === 'b'", label: 'B carries the bag to B\'s desk'},
    {at: 0.5, fn: "s.atB && s.writingA === false && s.writtenB.every(v => v === 0)", label: 'the bag is on B\'s desk before any row of sheet B is written'},
    {at: 0.5, fn: 's.writtenA.some(v => v > 0) && s.writtenA.some(v => v < 1)', label: 'A writes sheet A after the hand-off'},
    {at: 0.61, fn: 's.writtenA.every(v => v === 1) && s.writtenB.some(v => v > 0 && v < 1)', label: 'then B writes sheet B (separate records)'},
    {at: 1, fn: "s.atB && s.writtenA.every(v => v === 1) && s.writtenB.every(v => v === 1) && s.gapRing === 0 && s.allReached && s.problems.length === 0", label: 'hold: recorded — both sheets carry their rows; composition fits'},
    {at: 1, params: {finalState: 'gap'}, fn: 's.atB && s.writtenA.every(v => v === 1) && s.rowsB.every(v => v === false) && s.writtenB.every(v => v === 0) && s.gapRing === 1', label: 'gap: sheet B stays without entry and its blank rows are ringed'},
    {at: 0.7, params: {finalState: 'gap'}, fn: 's.gapRing === 0 && s.writingB === false', label: 'gap: nothing is marked before the hold; B\'s pen never writes'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && !s.atB', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {records: [{log: 'a', field: 'A', value: 'x'}, {log: 'b', field: 'B', value: ''}]}, fn: 's.rowsA[0] === true && s.rowsB[0] === false', label: 'blank rows come only from the supplied records'},
    {at: 0.1, fn: "s.phase === 'rest' && s.bag.x === s.bagStart.x", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.labels.logA, p.labels.logB, p.actorLabels.a, p.actorLabels.b, p.objectLabels.bag, p.objectLabels.tag, p.objectLabels.chain, p.objectLabels.counter, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : []), ...p.records.filter(r => r.value && (p.finalState !== 'gap' || r.log === 'a')).map(r => r.value)];",
  content: 'return [p.items[0].label, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.objectLabels.bag, p.objectLabels.tag, p.objectLabels.chain, p.objectLabels.counter, p.actorLabels.a, p.actorLabels.b];',
});

ratioChecks(ID, 'bag held while moved, hands within reach, composition fits', [
  {at: times(0, 1, 0.02), fn: '!s.moving || s.holder === s.moving', label: 'the bag moves only in the hand of whoever carries it'},
  {at: times(0, 1, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: [1], fn: 's.problems.length === 0 && s.atB', label: 'a composition fits and the bag ends with B'},
]);

// Every count of rows (1..3 per sheet, 2..6 in all), every object kind and state composes at every ratio.
test(`${ID}: every array count, object kind and state composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const [na, nb] of [[1, 1], [2, 1], [1, 2], [3, 3], [3, 1], [1, 3], [2, 2]]) for (const kind of ['key', 'cup', 'box']) {
      const records = [...Array.from({length: na}, (_, i) => ({log: 'a', field: `Field A${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`})), ...Array.from({length: nb}, (_, i) => ({log: 'b', field: `Field B${i + 1}`, value: `Value ${i + 1}`}))];
      combos.push({records, items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]});
    }
    combos.push({timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}], finalState: 'gap'});
    combos.push({timestamps: [{label: 'a', time: '1'}], annotations: []});
    combos.push({annotations: [{target: 'bag', text: 'Note one'}, {target: 'logB', text: 'Note two'}], finalState: 'gap'});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.atB || s.S < 150 || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 70)} ${w}x${h} ${tv}: ${s.problems.join(',')} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden: no visible text, yet the bag travels from A to B and the sheets are written.
test(`${ID}: labels hidden — no visible text; the bag passes to B and both sheets are written`, async ({page}) => {
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
      res.push({text, moved: Math.hypot(s1.bag.x - s0.bag.x, s1.bag.y - s0.bag.y), atB: s1.atB, a: s1.writtenA.every(v => v === 1), b: s1.writtenB.every(v => v === 1)});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(150);
    expect(r.atB && r.a && r.b).toBe(true);
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
