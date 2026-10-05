// LAW-0361 — Etiquetado de indicio · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (hands, object, tag hole and chain end move continuously),
// anchoring of objects (the right hand holds the tag while it is carried and clipped, then holds the object while it
// is lifted, carried and lowered; once clipped the chain keeps its length, so the tag stays joined to the moving
// object) and the transformation recognisable with labels hidden (the object ends in the bag with its tag attached).
// Timing (u): rest 0–0.15 · hand to tag 0.15–0.20 · tag carried 0.20–0.32 (left hand steadies the object 0.20–0.50) ·
// chain clipped 0.32–0.39 · tag released 0.39–0.42 · hand to object 0.42–0.48 · lift 0.48–0.51 · carry 0.51–0.63 ·
// lower into the bag 0.63–0.66 · hand back 0.66–0.73 · notes 0.74–0.80 · state 0.75–0.81; still from 0.81.
// Legal: neutral process; rows written / blank as supplied; no admissibility or custody doctrine.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0361';

contractSuite(ID, {
  continuity: ['handR', 'handL', 'obj', 'hole', 'chainEnd'],
  attach: [
    {from: 0.2005, to: 0.3895, a: 'handR', b: 'tagGrip', tol: 1.5},
    {from: 0.4805, to: 0.6595, a: 'handR', b: 'objGrip', tol: 1.5},
    {from: 0.2705, to: 0.4195, a: 'handL', b: 'steady', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && !s.attached && !s.inside && s.lift === 0", label: 'rest: tag apart, chain not clipped, object on the bench'},
    {at: 0.145, fn: "s.phase === 'rest'", label: 'nothing moves during the rest beat'},
    {at: 0.3, fn: "s.phase === 'carry-tag' && s.holdingTag && !s.attached", label: 'the hand carries the tag to the object'},
    {at: 0.36, fn: "s.phase === 'clip' && s.steadying", label: 'the chain is clipped while the other hand steadies the object'},
    {at: 0.45, fn: 's.attached && !s.holdingTag && Math.abs(s.chainLen - s.chainL) < 0.6', label: 'released: the tag is joined at chain length'},
    {at: 0.57, fn: "s.phase === 'carry' && s.holdingObj && s.lift === 1 && s.attached && Math.abs(s.chainLen - s.chainL) < 0.6", label: 'the object is carried and the tag stays attached'},
    {at: 1, fn: "s.inside && s.attached && s.lift === 0 && s.allReached && s.problems.length === 0 && Math.abs(s.chainLen - s.chainL) < 0.6", label: 'hold: object in the bag with the tag attached; composition fits'},
    {at: 1, params: {finalState: 'tagged'}, fn: "s.attached && !s.inside && s.phase === 'tagged'", label: 'tagged: the tag is attached and the object stays on the bench'},
    {at: 1, params: {finalState: 'pending'}, fn: "!s.attached && !s.inside && s.phase === 'rest'", label: 'pending: nothing is attached'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && !s.inside', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {records: [{field: 'A', value: 'x'}, {field: 'B', value: ''}]}, fn: 's.rows[0] === true && s.rows[1] === false', label: 'blank rows come only from the supplied records'},
    {at: 0.1, fn: "s.phase === 'rest' && !s.attached", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.records.map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.actorLabels.a, p.objectLabels.tag, p.objectLabels.chain, p.objectLabels.bag, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.items[0].label, ...p.records.map(r => r.field), ...p.records.map(r => r.value), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.objectLabels.tag, p.objectLabels.chain, p.objectLabels.bag, p.actorLabels.a];',
});

ratioChecks(ID, 'tag stays joined, hands within reach, composition fits', [
  {at: times(0.4, 1, 0.01), fn: '!s.attached || Math.abs(s.chainLen - s.chainL) < 0.6', label: 'once clipped the chain keeps its length (tag joined to the object)'},
  {at: times(0, 1, 0.02), fn: 's.lift === 0 || s.holdingObj', label: 'the object is lifted only while held'},
  {at: times(0.15, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

// Every count of records (2..5) and custodians / timestamps (1..max) and every object kind composes at every ratio.
test(`${ID}: every array count and object kind composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const n of [2, 3, 4, 5]) for (const kind of ['key', 'cup', 'box']) combos.push({records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`})), items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]});
    combos.push({custodians: [{name: 'A (fictional)', role: 'Role'}, {name: 'B (fictional)', role: 'Role'}], timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}]});
    combos.push({timestamps: [{label: 'a', time: '1'}], annotations: []});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.inside || s.S < 70) out.push(`${JSON.stringify(params).slice(0, 60)} ${w}x${h} ${tv}: ${s.problems.join(',')} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden: no visible text, yet the object travels into the bag with its tag.
test(`${ID}: labels hidden — no visible text; the tagged object ends in the bag`, async ({page}) => {
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
      res.push({text, moved: Math.hypot(s1.obj.x - s0.obj.x, s1.obj.y - s0.obj.y), inside: s1.inside, attached: s1.attached});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(150);
    expect(r.inside).toBe(true);
    expect(r.attached).toBe(true);
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
