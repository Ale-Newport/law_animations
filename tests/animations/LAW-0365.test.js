// LAW-0365 — Embalaje de prueba · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (hands, object and seal strip move continuously), anchoring of
// objects (the right hand holds the object while it is lifted, carried and lowered into the pouch, then holds the
// flap's free edge while folding it; the left hand steadies the pouch, then holds the strip while it is peeled,
// carried and laid on the seam, and keeps its end down while the right hand presses along it) and the transformation
// recognisable with labels hidden (the object ends inside the pouch, the flap folded, the strip laid across the seam).
// Timing (u, 8 s): rest 0–0.15 · reach object 0.15–0.215 (left hand steadies 0.15–0.215 → 0.40) · lift 0.215–0.235 ·
// carry 0.235–0.31 · lower 0.31–0.34 · to flap 0.34–0.385 · fold 0.385–0.45 · right hand holds the flap 0.45–0.58 ·
// left hand to strip 0.40–0.48 · strip carried 0.48–0.58 · laid 0.58–0.61 · pressed 0.62–0.71 · hands back 0.71–0.78 ·
// (altered: slit 0.76–0.80, Δ 0.78–0.83) · notes 0.76–0.82 · state 0.77–0.83; still from 0.83.
// Legal: neutral process; the seal state is only the supplied state; no doctrine on tampering or its consequences.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0365';

contractSuite(ID, {
  continuity: ['handR', 'handL', 'obj', 'strip'],
  attach: [
    {from: 0.2155, to: 0.3395, a: 'handR', b: 'objGrip', tol: 1.5},
    {from: 0.3855, to: 0.4495, a: 'handR', b: 'flapGrip', tol: 1.5},
    {from: 0.2155, to: 0.3995, a: 'handL', b: 'steady', tol: 1.5},
    {from: 0.4805, to: 0.7095, a: 'handL', b: 'stripGrip', tol: 1.5},
    {from: 0.6205, to: 0.7095, a: 'handR', b: 'press', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && !s.inside && s.flap === 1 && !s.peeled && s.lift === 0", label: 'rest: object apart, flap open, strip on its card'},
    {at: 0.145, fn: "s.phase === 'rest' && s.flap === 1", label: 'nothing moves during the rest beat'},
    {at: 0.27, fn: "s.phase === 'carry' && s.holdingObj && s.lift === 1 && s.steadying", label: 'the object is carried while the other hand steadies the pouch'},
    {at: 0.36, fn: 's.inside && !s.folded', label: 'the object is inside before the flap folds'},
    {at: 0.42, fn: "s.phase === 'fold' && s.folding && s.flap < 1 && s.flap > -1", label: 'the hand folds the flap over the mouth'},
    {at: 0.53, fn: 's.folded && s.holdingStrip && !s.laid', label: 'flap folded; the strip is carried to the seam'},
    {at: 0.66, fn: 's.laid && s.pressing && s.pressed > 0 && s.pressed < 1', label: 'the strip lies on the seam and is pressed along'},
    {at: 1, fn: "s.inside && s.folded && s.laid && s.pressed > 0.9 && s.slit === 0 && s.marker === 0 && s.allReached && s.problems.length === 0", label: 'hold: sealed, seal intact; composition fits'},
    {at: 1, params: {finalState: 'altered'}, fn: 's.laid && s.slit === 1 && s.marker === 1', label: 'altered: the supplied slit and the neutral marker are shown'},
    {at: 0.7, params: {finalState: 'altered'}, fn: 's.slit === 0 && s.marker === 0', label: 'altered: nothing is marked before the hold'},
    {at: 1, params: {finalState: 'open'}, fn: "s.inside && s.flap === 1 && !s.peeled && s.phase === 'bagged'", label: 'open: the object is in the pouch, not sealed'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.actionCapped && !s.laid', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {records: [{field: 'A', value: 'x'}, {field: 'B', value: ''}]}, fn: 's.rows[0] === true && s.rows[1] === false', label: 'blank rows come only from the supplied records'},
    {at: 0.1, fn: "s.phase === 'rest' && !s.inside && s.flap === 1", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.items[0].id, p.items[0].label, p.sealNumber, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name), ...p.custodians.map(c => c.role), ...p.timestamps.map(t => t.label), ...p.timestamps.map(t => t.time), p.labels.key, p.actorLabels.a, p.objectLabels.bag, p.objectLabels.seal, p.objectLabels.label, p.objectLabels.chain, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [p.items[0].label, p.sealNumber, ...p.records.map(r => r.field), ...p.records.filter(r => r.value).map(r => r.value), ...p.custodians.map(c => c.name)];',
  captions: 'return [p.objectLabels.bag, p.objectLabels.seal, p.objectLabels.label, p.objectLabels.chain, p.actorLabels.a];',
});

ratioChecks(ID, 'props held while moved, hands within reach, composition fits', [
  {at: times(0, 1, 0.02), fn: 's.lift === 0 || s.holdingObj', label: 'the object is lifted only while held'},
  {at: times(0.15, 0.78, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: times(0.47, 0.6, 0.01), fn: '!s.holdingStrip || Math.hypot(s.handL.x - s.stripGrip.x, s.handL.y - s.stripGrip.y) < 2', label: 'the strip moves only in the left hand'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
]);

// Every count of records (2..5), custodians (1..2), timestamps (1..3), every object kind and state composes.
test(`${ID}: every array count, object kind and state composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const combos = [];
    for (const n of [2, 3, 4, 5]) for (const kind of ['key', 'cup', 'box']) combos.push({records: Array.from({length: n}, (_, i) => ({field: `Field ${i + 1}`, value: i % 2 ? '' : `Value ${i + 1}`})), items: [{id: 'Item X (fictional)', label: 'Item (fictional)', kind}]});
    combos.push({custodians: [{name: 'A (fictional)', role: 'Role'}, {name: 'B (fictional)', role: 'Role'}], timestamps: [{label: 'a', time: '1'}, {label: 'b', time: '2'}, {label: 'c', time: '3'}]});
    combos.push({timestamps: [{label: 'a', time: '1'}], annotations: [], finalState: 'altered'});
    combos.push({annotations: [{target: 'object', text: 'Note one'}, {target: 'label', text: 'Note two'}], finalState: 'open'});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.inside || s.S < 95 || !s.allReached) out.push(`${JSON.stringify(params).slice(0, 60)} ${w}x${h} ${tv}: ${s.problems.join(',')} S=${s.S}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden: no visible text, yet the object travels into the pouch and the seal closes it.
test(`${ID}: labels hidden — no visible text; the object ends in the sealed pouch`, async ({page}) => {
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
      res.push({text, moved: Math.hypot(s1.obj.x - s0.obj.x, s1.obj.y - s0.obj.y), strip: Math.hypot(s1.strip.x - s0.strip.x, s1.strip.y - s0.strip.y), inside: s1.inside, folded: s1.folded, laid: s1.laid});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(150);
    expect(r.strip).toBeGreaterThan(150);
    expect(r.inside && r.folded && r.laid).toBe(true);
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
