// LAW-0385 — Comparación de huellas digitales · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (hands, lifted card and reading frame move continuously), anchoring
// of objects (the left hand holds the lifted card while it is slid into its row; the right hand holds the reading
// frame's handle from pick-up to parking) and the transformation recognisable with labels hidden (the card ends in the
// lower row, every compared pair carries its bridge or open stubs).
// Timing (u, 7 s): rest 0–0.15 · left hand to card 0.15–0.20, card slid 0.20–0.30, hand back 0.30–0.36 · right hand to
// frame 0.17–0.24, frame to pair 1 0.28–0.36 · pairs 0.36–0.72 (per pair: link 8–55 %, slide 60–100 %) · frame parked
// 0.73–0.79 · hand back 0.79–0.85 · notes / state 0.80–0.86.
// Legal: symbolic chains; a bridge only says that two supplied symbols are the same; no identity/outcome.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0385';

contractSuite(ID, {
  continuity: ['handL', 'handR', 'card', 'reader'],
  attach: [
    {from: 0.2005, to: 0.2995, a: 'handL', b: 'cardGrip', tol: 1.5},
    {from: 0.2405, to: 0.7895, a: 'handR', b: 'readerGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && !s.cardPlaced && s.links.every(k => k === 0)", label: 'rest: card askew, no links'},
    {at: 0.145, fn: "s.phase === 'rest'", label: 'nothing moves during the rest beat'},
    {at: 0.25, fn: 's.cardHeld && !s.cardPlaced && s.links.every(k => k === 0)', label: 'the lifted card is slid in the left hand before any comparison'},
    {at: 0.34, fn: 's.cardPlaced && s.readerHeld && s.links.every(k => k === 0)', label: 'no pair is linked before the frame sits on it'},
    {at: 0.45, fn: 's.links[0] === 1 && s.links[s.links.length - 1] === 0', label: 'pairs are linked one after another'},
    {at: 1, fn: "s.links.every(k => k === 1) && !s.readerHeld && s.allReached && s.problems.length === 0", label: 'hold: every pair linked, frame parked; composition fits'},
    {at: 1, params: {finalState: 'pending'}, fn: 's.links[s.links.length - 1] === 0 && s.links[0] === 1', label: 'pending: the last pair stays uncompared'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && s.links.every(k => k === 0)', label: 'actionProgress freezes the action part-way'},
    {at: 0.1, fn: "s.phase === 'rest' && s.links.every(k => k === 0)", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, p.cards.a, p.cards.b, p.matchLabels.same, p.matchLabels.differ, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.actorLabels.a, p.objectLabels.lightbox, p.objectLabels.reader, p.objectLabels.tag, p.objectLabels.bag, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.items[0].label, p.cards.a, p.cards.b, ...p.records.map(r => r.field), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.objectLabels.lightbox, p.objectLabels.reader, p.objectLabels.tag, p.objectLabels.bag, p.actorLabels.a];',
});

ratioChecks(ID, 'props held while moved, hands within reach, composition fits', [
  {at: [1], presets: ['baseline-es', 'baseline-illustrative'], tv: ['all'], fn: 's.textPx >= 19.5', label: 'baseline text >= 19.5 px in every ratio'},
  {at: times(0, 1, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: times(0.2, 0.3, 0.01), fn: 'Math.hypot(s.handL.x - s.cardGrip.x, s.handL.y - s.cardGrip.y) < 2', label: 'the card moves only in the left hand'},
  {at: times(0.25, 0.78, 0.01), fn: 'Math.hypot(s.handR.x - s.readerGrip.x, s.handR.y - s.readerGrip.y) < 2', label: 'the frame moves only with the right hand on its handle'},
  {at: [1], fn: 's.problems.length === 0 && s.ts >= 42', label: 'a composition fits with large tiles'},
]);

test(`${ID}: every segment count, object kind and state composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    const sy = ['arc', 'loop', 'fork', 'dot', 'end', 'arc'];
    for (const n of [3, 4, 5, 6]) for (const kind of ['key', 'cup', 'box']) combos.push({segments: sy.slice(0, n).map((a, i) => ({a, b: i % 2 ? a : 'dot'})), items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]});
    for (const n of [2, 5]) combos.push({records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`}))});
    combos.push({custodians: [{name: 'A (fictional)', role: 'Role'}, {name: 'B (fictional)', role: 'Role'}], timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}], finalState: 'pending'});
    combos.push({timestamps: [{label: 'a', time: '1'}], annotations: [{target: 'object', text: 'Note one'}, {target: 'reader', text: 'Note two'}]});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 60)} ${w}x${h} ${tv}: ${s.problems.join(',')} ts=${s.ts}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the card is placed and the pairs are linked`, async ({page}) => {
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
      for (const u of [0, 0.3, 0.6, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, card: Math.hypot(s1.card.x - s0.card.x, s1.card.y - s0.card.y), links: s1.links});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.card).toBeGreaterThan(40);
    expect(r.links.every(k => k === 1)).toBe(true);
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
