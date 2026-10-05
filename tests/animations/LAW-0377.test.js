// LAW-0377 — Inventario de objetos · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (hand and every object move continuously; the carried copy of an
// object sits exactly on the hand), object anchoring (an object moves only while held: grip → carry → release into its
// cell; listed objects get their line to the list row only after placement) and the transformation recognisable with
// labels hidden (objects end in their cells, lines drawn).
// Timing (u): rest 0–0.15 · per object a slot proportional to its hand travel (bounded 0.7–1.6×): reach 0–40 %, grip 40–45 %, carry
// 45–86 %, release 86–93 %, tag written / line drawn 90–125 % · hand back 0.70–0.76 · notes 0.77–0.83 · state 0.78–0.84; still from 0.84.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0377';
contractSuite(ID, {
  continuity: ['hand', 'item0', 'item1', 'item2'],
  // grip = the carried object's position while one is held (else the hand): the carried object never leaves the hand
  attach: [{from: 0.15, to: 0.76, a: 'hand', b: 'grip', tol: 1.5}],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.states.every(x => x === 'bag') && s.links.every(v => v === 0)", label: 'rest: every object in the bag, no line'},
    {at: 0.145, fn: "s.states.every(x => x === 'bag') && s.holding === -1", label: 'nothing moves during the rest beat'},
    {at: 1, fn: "s.states.every(x => x === 'placed') && s.links.every(v => v === 1) && s.allReached && s.problems.length === 0", label: 'hold: all placed and joined; composition fits'},
    {at: 1, params: {records: [{field: 'No. 1', value: 'Key'}, {field: 'No. 2', value: 'Phone'}]}, fn: "s.links[2] === 0 && s.states[2] === 'placed' && s.links[0] === 1", label: 'an object without an entry is placed but not joined'},
    {at: 1, params: {finalState: 'placed'}, fn: "s.states.every(x => x === 'placed') && s.links.every(v => v === 0)", label: 'placed: no rows joined'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.states.every(x => x === 'bag')", label: 'pending: objects stay in the bag'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && s.placedCount < 3', label: 'actionProgress freezes the action part-way'},
    {at: 0.1, fn: "s.states.every(x => x === 'bag')", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.items.map(i => i.id), ...p.items.map(i => i.label), ...p.records.map(r => r.field), ...p.records.map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.time), p.labels.key, p.actorLabels.a, p.objectLabels.bag, p.objectLabels.rack, ...p.annotations.map(a => a.text)];",
  content: 'return [...p.records.map(r => r.value), ...p.items.map(i => i.label), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.objectLabels.bag, p.objectLabels.rack, p.actorLabels.a];',
});

ratioChecks(ID, 'objects move only while held; hand within reach; composition fits', [
  {at: times(0.15, 0.76, 0.01), fn: 's.allReached', label: 'the hand stays within reach'},
  {at: times(0, 1, 0.02), fn: "s.states.filter(x => x === 'carried').length <= 1", label: 'one object carried at a time'},
  {at: times(0.15, 0.8, 0.01), fn: "s.states.every((x, i) => i === 0 || x === 'bag' || s.states[i - 1] === 'placed')", label: 'one object at a time, in order: the next leaves the bag only after the previous is placed'},
  {at: times(0, 1, 0.01), fn: "s.links.every((v, i) => v === 0 || s.states[i] === 'placed')", label: 'a line is drawn only after its object is placed (cause precedes effect)'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

test(`${ID}: cold create() of long-labels-stress stays under ~1 s in every ratio`, async ({browser}) => {
  const stress = presetsFor(ID).find(p => p.name === "long-labels-stress").params;
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto("/tests/harness/host.html");
    await page.waitForFunction(() => document.body.dataset.ready === "1");
    const ms = await page.evaluate(async ([id, params, w, h]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement("div"); document.getElementById("slots").appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params}); await x.ready; x.seek(x.durationMs);
      const dt = performance.now() - t0; x.destroy(); return dt;
    }, [ID, stress, w, h]);
    await page.close();
    expect(ms).toBeLessThan(1000);
  }
});

test(`${ID}: labels hidden — no visible text at any sampled time`, async ({page}) => {
  await page.goto("/tests/harness/host.html");
  await page.waitForFunction(() => document.body.dataset.ready === "1");
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    let text = 0;
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement("div"); document.getElementById("slots").appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {textVisibility: "none"}}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute("opacity"); if (a) o *= parseFloat(a); } return o; };
      for (const u of [0, 0.3, 0.5, 0.7, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll("[data-layer=\"scene\"] text")].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.destroy(); el.remove();
    }
    return text;
  }, ID);
  expect(out).toBe(0);
});

test(`${ID}: every item count (2..5) composes at every ratio, labels on and off`, async ({page}) => {
  await page.goto("/tests/harness/host.html");
  await page.waitForFunction(() => document.body.dataset.ready === "1");
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const kinds = ["key", "cup", "box", "phone", "wallet", "notebook"];
    const out = [];
    for (const n of [2, 3, 4, 5]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ["all", "none"]) {
      const params = {textVisibility: tv, items: Array.from({length: n}, (_, i) => ({id: `Object ${i + 1} (fictional)`, label: "Item", kind: kinds[(i + n) % 6]})), records: Array.from({length: n}, (_, i) => ({field: `No. ${i + 1}`, value: `Item ${i + 1}`})), custodians: n % 2 ? [{name: "A (fictional)", role: "Role"}, {name: "B (fictional)", role: "Role"}] : [{name: "A (fictional)", role: "Role"}], timestamps: n > 3 ? [{label: "a", time: "1"}, {label: "b", time: "2"}, {label: "c", time: "3"}] : [{label: "a", time: "1"}]};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${n} ${w}x${h} ${tv}: ${s.problems.join(",")}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join("\n")).toEqual([]);
});

