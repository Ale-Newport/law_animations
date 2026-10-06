// LAW-0381 — Copia de evidencia digital · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (hands, original, copy and the copy's tag move continuously),
// anchoring (the left hand holds the original while it is carried to and from the source bay; the right hand holds the
// copy while it is carried, then the tag while it is carried to the copy's eyelet) and the transformation recognisable
// with labels hidden (the copy's block map is written cell by cell, the original goes back to its bag, the tag ends on
// the copy's chain).
// Timing (u, 6 s): rest 0–0.15 · hands to devices 0.15–0.225 · carried into the bays 0.225–0.30 · hands back 0.30–0.37 ·
// copy written 0.33–0.46 (lamps 0.31–0.47) · hands to the bays 0.46–0.53 · original back to its bag / copy to its spot
// 0.53–0.61 (left hand back 0.61–0.70) · right hand to the tag 0.61–0.64, tag carried 0.64–0.71, chain 0.70–0.73 · hand back 0.71–0.78 · notes /
// state 0.77–0.83.
// Legal: neutral process; the final state is only the supplied state; no doctrine on digital evidence.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0381';

contractSuite(ID, {
  continuity: ['handL', 'handR', 'orig', 'copy', 'tag'],
  attach: [
    {from: 0.2255, to: 0.2995, a: 'handL', b: 'origGrip', tol: 1.5},
    {from: 0.5305, to: 0.6095, a: 'handL', b: 'origGrip', tol: 1.5},
    {from: 0.2255, to: 0.2995, a: 'handR', b: 'copyGrip', tol: 1.5},
    {from: 0.5305, to: 0.6095, a: 'handR', b: 'copyGrip', tol: 1.5},
    {from: 0.6405, to: 0.7095, a: 'handR', b: 'tagGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.origAt === 'bag' && s.copyAt === 'tray' && s.copyCells === 0 && s.tagState === 'lying'", label: 'rest: original in its bag, blank copy in the tray, tag unattached'},
    {at: 0.145, fn: "s.origAt === 'bag' && s.copyCells === 0 && s.flow === 0", label: 'nothing moves during the rest beat'},
    {at: 0.26, fn: "s.origAt === 'carried' && s.copyAt === 'carried' && s.copyCells === 0", label: 'both devices carried to the dock before any block is written'},
    {at: 0.38, fn: "s.origAt === 'dock' && s.copyAt === 'dock' && s.flow === 1 && s.copyCells > 0 && s.copyCells < s.cells", label: 'the copy is written while both sit in the dock'},
    {at: 0.5, fn: 's.copyCells === s.cells && s.origCells === s.cells && s.flow === 0', label: 'copy complete; the original map is unchanged'},
    {at: 0.67, fn: "s.origAt === 'bag' && s.copyAt === 'placed' && s.tagState === 'carried'", label: 'original back in its bag; the tag is carried to the copy'},
    {at: 1, fn: "s.tagState === 'attached' && s.chain === 1 && s.allReached && s.problems.length === 0", label: 'hold: the copy carries its own tag; composition fits'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.tagState === 'lying' && s.chain === 0 && s.copyCells === s.cells && s.origAt === 'bag'", label: 'pending: copy made, tag left unattached'},
    {at: 1, params: {actionProgress: 0.1}, fn: 's.actionCapped && s.copyCells === 0', label: 'actionProgress freezes the action part-way'},
    {at: 0.1, fn: "s.origAt === 'bag' && s.copyCells === 0", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.actorLabels.a, p.objectLabels.original, p.objectLabels.copy, p.objectLabels.dock, p.objectLabels.tag, p.objectLabels.bag, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.items[0].label, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.objectLabels.original, p.objectLabels.copy, p.objectLabels.dock, p.objectLabels.tag, p.objectLabels.bag, p.actorLabels.a];',
});

ratioChecks(ID, 'props held while moved, hands within reach, composition fits', [
  {at: [1], presets: ['baseline-es'], tv: ['all'], fn: 's.textPx >= 19.5', label: 'baseline-es keeps text at >= 19.5 px (baseline floor) in every ratio'},
  {at: times(0.15, 0.8, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: times(0.23, 0.29, 0.01), fn: 'Math.hypot(s.handL.x - s.origGrip.x, s.handL.y - s.origGrip.y) < 2 && Math.hypot(s.handR.x - s.copyGrip.x, s.handR.y - s.copyGrip.y) < 2', label: 'the devices move only in the hands'},
  {at: [1], fn: 's.problems.length === 0 && s.S >= 95', label: 'a composition fits with large devices'},
]);

test(`${ID}: every device kind, row count and option composes at every ratio (labels on / off)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const kind of ['drive', 'stick', 'card']) for (const n of [2, 5]) combos.push({items: [{id: 'X (fictional)', label: 'Item (fictional)', kind}], records: Array.from({length: n}, (_, i) => ({field: `F${i + 1}`, value: i % 2 ? '' : `V${i + 1}`}))});
    combos.push({custodians: [{name: 'A (fictional)', role: 'r'}, {name: 'B (fictional)', role: 'r'}], timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}]});
    combos.push({timestamps: [{label: 'a', time: '1'}], custodians: [{name: 'A (fictional)', role: 'r'}]});
    combos.push({finalState: 'pending'}, {annotations: [{target: 'original', text: 'Note one'}, {target: 'dock', text: 'Note two'}]});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || s.S < 95 || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 70)} ${w}x${h} ${tv}: ${s.problems} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text and the action still reads`, async ({page}) => {
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
      for (const u of [0, 0.38, 0.66, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, orig: Math.hypot(s1.orig.x - s0.orig.x, s1.orig.y - s0.orig.y), copy: Math.hypot(s1.copy.x - s0.copy.x, s1.copy.y - s0.copy.y), cells: s1.copyCells === s1.cells, tag: s1.tagState, origAt: s1.origAt});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.orig).toBeLessThan(1);
    expect(r.copy).toBeGreaterThan(100);
    expect(r.cells).toBe(true);
    expect(r.tag).toBe('attached');
    expect(r.origAt).toBe('bag');
  }
});

test(`${ID}: visible text >= 16 px at every sampled moment (1080p, every ratio)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const params of [{}, {finalState: 'pending'}]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      const k = 1080 / Math.min(w, h);
      for (let i = 0; i <= 50; i++) {
        x.seek((i / 50) * x.durationMs);
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b) * k;
          if (px < 15.9) out.push(`${w}x${h} u=${i / 50} ${t.textContent.slice(0, 20)} ${px.toFixed(1)}`);
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
