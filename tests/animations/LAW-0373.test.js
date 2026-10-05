// LAW-0373 — Registro fotográfico · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (hands, camera, scale and prints move continuously), anchoring of
// objects (the right hand holds the scale while it is carried and laid, then rides the shutter button; the left hand
// holds the camera's rear handle while the camera is moved between stations) and the transformation recognisable with
// labels hidden (the scale ends beside the object, every exposure becomes a print on the board, threads join the prints
// to the same object).
// Timing (u, 8 s, three views): rest 0–0.15 · right hand to scale 0.15–0.20, scale carried 0.20–0.28 · left hand to
// camera 0.16–0.24 · right hand to shutter 0.28–0.33 · per view (block 0.133 from 0.33): move 0–42 %, shutter 48–60 %,
// print flies 60–96 % · hands back 0.74–0.80 · pin 0.75–0.78 · threads 0.76–0.87 · notes / state 0.80–0.86.
// Legal: neutral process; the final state is only the supplied state; no doctrine on photographic evidence.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0373';

contractSuite(ID, {
  continuity: ['handR', 'handL', 'cam', 'ruler', 'print0', 'print1', 'print2'],
  attach: [
    {from: 0.2005, to: 0.2795, a: 'handR', b: 'rulerGrip', tol: 1.5},
    {from: 0.2405, to: 0.7395, a: 'handL', b: 'camGrip', tol: 1.5},
    {from: 0.3305, to: 0.7395, a: 'handR', b: 'btn', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && !s.rulerPlaced && s.prints.every(p => p === 'none') && s.wedge === 0", label: 'rest: scale apart, camera parked, no prints'},
    {at: 0.145, fn: "s.phase === 'rest' && s.wedge === 0", label: 'nothing moves during the rest beat'},
    {at: 0.25, fn: 's.rulerHeld && !s.rulerPlaced', label: 'the scale is carried in the right hand'},
    {at: 0.36, fn: 's.rulerPlaced && s.camHeld && s.onButton && s.view === 0 && s.prints[0] === \'none\'', label: 'camera moved to the overview station before any print exists'},
    {at: 0.43, fn: "s.prints[0] === 'flying' && s.prints[1] === 'none'", label: 'the overview print flies to the board after its exposure'},
    {at: 0.56, fn: "s.prints[0] === 'placed' && s.prints[1] === 'flying' && s.view === 1", label: 'second view: closer station, second print'},
    {at: 1, fn: "s.prints.every(p => p === 'placed') && s.threads.every(k => k === 1) && s.pin === 1 && s.allReached && s.problems.length === 0", label: 'hold: every print placed and joined to the object; composition fits'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.prints[2] === 'none' && s.threads[2] === 0 && s.threads[0] === 1 && s.wedge === 1", label: 'pending: the last view stays framed, untaken and unjoined'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.prints.every(p => p === 'none')", label: 'actionProgress freezes the action part-way'},
    {at: 1, fn: 's.fields[0] > s.fields[1]', label: 'the overview field is wider than the detail field'},
    {at: 0.1, fn: "s.phase === 'rest' && s.prints.every(p => p === 'none')", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.views.map(v => v.label), ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.actorLabels.a, p.objectLabels.camera, p.objectLabels.scale, p.objectLabels.prints, p.objectLabels.tag, p.objectLabels.bag, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.items[0].label, ...p.views.map(v => v.label), ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.objectLabels.camera, p.objectLabels.scale, p.objectLabels.prints, p.objectLabels.tag, p.objectLabels.bag, p.actorLabels.a];',
});

ratioChecks(ID, 'props held while moved, hands within reach, composition fits', [
  {at: times(0.15, 0.8, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: times(0.2, 0.28, 0.01), fn: 'Math.hypot(s.handR.x - s.rulerGrip.x, s.handR.y - s.rulerGrip.y) < 2', label: 'the scale moves only in the right hand'},
  {at: times(0.25, 0.73, 0.01), fn: 'Math.hypot(s.handL.x - s.camGrip.x, s.handL.y - s.camGrip.y) < 2', label: 'the camera moves only with the left hand on its handle'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

test(`${ID}: every view count, target, object kind and state composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const n of [2, 3]) for (const kind of ['key', 'cup', 'box']) combos.push({views: [{label: 'A', target: 'scene'}, {label: 'B', target: 'object'}, {label: 'C', target: 'tag'}].slice(0, n), items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]});
    combos.push({views: [{label: 'A', target: 'tag'}, {label: 'B', target: 'scene'}]});
    for (const n of [2, 5]) combos.push({records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`}))});
    combos.push({custodians: [{name: 'A (fictional)', role: 'Role'}, {name: 'B (fictional)', role: 'Role'}], timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}], finalState: 'pending'});
    combos.push({timestamps: [{label: 'a', time: '1'}], annotations: [{target: 'object', text: 'Note one'}, {target: 'camera', text: 'Note two'}]});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || s.S < 95 || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 60)} ${w}x${h} ${tv}: ${s.problems.join(',')} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the scale is laid and the prints reach the board`, async ({page}) => {
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
      let text = 0;
      for (const u of [0, 0.43, 0.7, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, ruler: Math.hypot(s1.ruler.x - s0.ruler.x, s1.ruler.y - s0.ruler.y), cam: Math.hypot(s1.cam.x - s0.cam.x, s1.cam.y - s0.cam.y), prints: s1.prints, threads: s1.threads});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.ruler).toBeGreaterThan(100);
    expect(r.cam).toBeGreaterThan(100);
    expect(r.prints.every(p => p === 'placed')).toBe(true);
    expect(r.threads.every(k => k === 1)).toBe(true);
  }
});

test(`${ID}: visible text >= 16 px at every sampled moment (1080p, every ratio)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      const k = 1080 / Math.min(w, h);
      for (let i = 0; i <= 40; i++) {
        x.seek((i / 40) * x.durationMs);
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b) * k;
          if (px < 15.9) out.push(`${w}x${h} u=${i / 40} ${t.textContent.slice(0, 20)} ${px.toFixed(1)}`);
        }
      }
      x.destroy(); el.remove();
    }
    return out.slice(0, 20);
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
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
