// LAW-0352 — Devolución para nuevo examen · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens is a uniformly scaled copy of the tag's
// region: the tag in the lens maps back to the context tag exactly); the change is local (only the tag's value, then
// the dependent doors and the folder's tray change); seeking back restores the old datum exactly.
// Timing (u): context 0–0.20 · lens opens 0.20–0.36 · old value lifts away 0.46–0.50 · new value settles 0.50–0.55
// (still to 0.60) · lens closes 0.60–0.68 · doors swap 0.68–0.72 · folder runs to the new tray 0.69–0.79 (ghost) ·
// marker 0.80–0.85; still from 0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0352';

contractSuite(ID, {
  continuity: ['tag', 'lensTag', 'folderC'],
  semantic: [
    {at: 0, fn: "s.beat === 'context' && s.datum === 'before' && s.lensOpen === 0 && s.atBefore && s.ctxOld === 1 && s.ctxNew === 0", label: 'context: the old datum on the tag; folder at the configured point; lens closed'},
    {at: 0.42, fn: 's.lensOpen === 1 && s.datumInLens && s.ctxOld === 0 && s.ctxNew === 0 && s.lensOld === 1', label: 'isolate: the datum is only in the lens (context tag blank)'},
    {at: 0.58, fn: "s.datum === 'after' && s.lensNew === 1 && s.lensOld === 0 && s.atBefore", label: 'substitute: the new value; the folder has not moved yet (cause before effect)'},
    {at: 1, fn: 's.lensOpen === 0 && s.ctxNew === 1 && s.atAfter && s.marker === 1 && s.ghost === 1 && s.zoom >= 1.5 && s.problems.length === 0', label: 'back: new datum, folder at the new point, ghost and marker; composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.atBefore && s.ghost === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: {afterIndex: 2}, fn: 's.after === 2 && s.atAfter', label: 'the supplied alternative point alone decides where the folder goes'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.grounds, ...p.routes.stations, p.routes.origin, p.labels.route, p.labels.point, p.labels.key, p.outcomes.renewed, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  content: 'return [p.decisions.title, ...p.grounds, ...p.routes.stations, p.afterValue];',
  captions: 'return [p.contextLabels.context];',
});

ratioChecks(ID, 'lens real, datum in one place, change local, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 's.zoom >= 1.5 - 1e-6', label: 'the lens magnifies at least 1.5×'},
  {at: times(0, 1, 0.01), fn: '!(s.datumInLens && (s.ctxOld || s.ctxNew)) && !(s.lensOld > 0.15 && s.lensNew > 0.15)', label: 'the datum is legible in one place only; old and new never overlap'},
  {at: times(0, 0.499, 0.01), fn: "s.datum === 'before' && s.atBefore", label: 'nothing reads as the new value before the substitution beat'},
  {at: times(0.5, 0.68, 0.01), fn: 's.atBefore', label: 'the datum changes before the geometry follows'},
  {at: times(0.8, 1, 0.02), fn: 's.atAfter', label: 'the folder stays at the new point'},
  {at: [0.42], fn: 'Math.abs(s.lensTag.x - (s.dest.x + (s.tag.x - s.src.x) * s.zoom)) < 0.5', label: 'the lens copy keeps the source coordinates'},
]);

test(`${ID}: the open lens is large, beside its source, and the context stays a real scene`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      el.style.width = w + 'px'; el.style.height = h + 'px';
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready; x.seek(0.5 * x.durationMs);
      const F = x.element.getBoundingClientRect();
      const L = x.element.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
      const S = x.element.querySelector('[data-node="lens-src"]').getBoundingClientRect();
      const D = x.element.querySelector('[data-node="desk-surface"]').getBoundingClientRect();
      const ov = !(L.right <= S.left + 1 || L.left >= S.right - 1 || L.bottom <= S.top + 1 || L.top >= S.bottom - 1);
      const hit = !(L.right <= D.left || L.left >= D.right || L.bottom <= D.top || L.top >= D.bottom);
      const strips = hit ? [[L.left - D.left, D.height], [D.right - L.right, D.height], [D.width, L.top - D.top], [D.width, D.bottom - L.bottom]].filter(q => q[0] > 0 && q[1] > 0) : [[D.width, D.height]];
      const big = strips.sort((a, b) => b[0] * b[1] - a[0] * a[1])[0] || [0, 0];
      res.push({tag: `${pr.name} ${w}x${h}`, lens: Math.min(L.width, L.height) / Math.min(F.width, F.height), overlap: ov, ctx: Math.max(big[0] / F.width, big[1] / F.height)});
      x.destroy(); el.remove();
    }
    return res;
  }, [ID, presets]);
  for (const r of out) {
    expect(r.lens, r.tag).toBeGreaterThanOrEqual(0.34);
    expect(r.overlap, r.tag).toBe(false);
    expect(r.ctx, r.tag).toBeGreaterThanOrEqual(0.45);
  }
});

test(`${ID}: labels hidden — no visible text; the folder still moves and the marker shows`, async ({page}) => {
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
      for (const u of [0, 0.4, 0.7, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      const s = x.getState({bounds: false}).semantic;
      res.push({text, at: s.atAfter, marker: s.marker, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.at).toBe(true); expect(r.marker).toBe(1); expect(r.problems).toBe(0); }
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

test(`${ID}: 2..3 points, 1..3 notes and every before/after pair compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [2, 3]) for (const k of [1, 3]) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      if (a === b) continue;
      const stations = Array.from({length: n}, (_, i) => `Point ${i + 1} (fictional)`);
      const grounds = Array.from({length: k}, (_, i) => `Note ${i + 1} (fictional)`);
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {routes: {stations, origin: 'Review desk (fictional)', returnTo: a}, afterIndex: b, grounds}}).semantic;
      if (s.problems.length || !s.atAfter) out.push(`${n}/${k}/${a}->${b} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
