// LAW-0336 — Límites de revisión · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens is a uniformly scaled copy of the
// rail's end region: the tag inside the lens maps back to the context tag exactly); the change is local (only the
// focus rail and its tag move; the other rail, the arrows and the sheet stay); seeking back to earlier times restores
// the old datum exactly.
// Timing (u): context 0–0.20 · lens opens 0.20–0.38 · old value lifts away 0.46–0.50 · new value settles 0.50–0.55 ·
// the rail, carrying the tag, slides to the new section 0.55–0.67 (ghost appears) and stays still to 0.76 · lens closes 0.76–0.86 ·
// marker 0.84–0.89 · legend back 0.84–0.90; still from 0.90.
// Legal: one supplied datum substituted; inside / outside is descriptive; neutral Δ marker; no validity or outcome.
// Coordinator decision (standing rule 2026-09-26, from LAW-0687/0689–0692; see the presets note): long-labels-stress
// beforeValue / afterValue capped at 60 characters (baseline 40) after the 1:1 fallbacks were tried.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0336';

contractSuite(ID, {
  continuity: ['tag', 'lensTag'],
  semantic: [
    {at: 0, fn: "s.beat === 'context' && s.datum === 'before' && s.lensOpen === 0 && s.rail === s.railBefore && s.ctxOld === 1 && s.ctxNew === 0", label: 'context: the old datum on the desk; lens closed'},
    {at: 0.42, fn: 's.lensOpen === 1 && s.datumInLens && s.ctxOld === 0 && s.ctxNew === 0 && s.lensOld === 1', label: 'isolate: the datum is only in the lens (context tag blank)'},
    {at: 0.72, fn: "s.datum === 'after' && s.rail === s.railAfter && s.lensNew === 1 && s.lensOld === 0 && s.ghost === 1", label: 'substitute: the new value, rail at the new section, ghost of the old position'},
    {at: 1, fn: 's.lensOpen === 0 && s.ctxNew === 1 && s.marker === 1 && s.zoom >= 1.5 && s.problems.length === 0', label: 'back: context shows the new datum with the changed marker; magnification >= 1.5; composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.rail === s.railBefore && s.ghost === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: {focusTarget: 'upper-edge', afterIndex: 0}, fn: '!s.lower && s.after.from === 0 && s.after.to === s.before.to', label: 'upper edge: only the first section changes'},
    {at: 1, fn: 's.inside[1] === true && s.inside[0] === true', label: 'the legend follows the new geometry (B now inside, as supplied)'},
    {at: 0.1, fn: 's.inside[1] === false', label: 'before the substitution B lies outside (as supplied)'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, ...p.decisions.sections, ...p.grounds.map(g => g.text), p.labels.frame, p.labels.key, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  content: 'return [p.decisions.title, ...p.decisions.sections, ...p.grounds.map(g => g.text), p.afterValue];',
  captions: 'return [p.contextLabels.context];',
});

ratioChecks(ID, 'lens real, datum in one place, change local, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 's.zoom >= 1.5 - 1e-6', label: 'the lens magnifies at least 1.5×'},
  {at: times(0, 1, 0.01), fn: '!(s.datumInLens && (s.ctxOld || s.ctxNew)) && !(s.lensOld > 0.15 && s.lensNew > 0.15)', label: 'the datum is legible in one place only; old and new never overlap'},
  {at: times(0, 0.499, 0.01), fn: "s.datum === 'before' && s.rail === s.railBefore", label: 'nothing reads as the new value before the substitution beat'},
  {at: times(0.5, 0.551, 0.01), fn: 's.rail === s.railBefore', label: 'the datum changes before the geometry follows (cause before effect)'},
  {at: times(0.68, 1, 0.02), fn: 's.rail === s.railAfter', label: 'the rail stays at the new section after the substitution'},
  {at: [0.42], fn: 'Math.abs(s.lensTag.x - (s.dest.x + (s.tag.x - s.src.x) * s.zoom)) < 0.5', label: 'the lens copy keeps the source coordinates'},
]);

// The lens is a real inspection: its window's smaller side is >= 0.34 of the frame's short side while open, it does
// not overlap its own source region, and the desk (context) keeps >= 45 % of one frame dimension visible.
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
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready; x.seek(0.6 * x.durationMs);
      const F = x.element.getBoundingClientRect();
      const L = x.element.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
      const S = x.element.querySelector('[data-node="lens-src"]').getBoundingClientRect();
      const D = x.element.querySelector('[data-node="desk-surface"]').getBoundingClientRect();
      const ov = !(L.right <= S.left + 1 || L.left >= S.right - 1 || L.bottom <= S.top + 1 || L.top >= S.bottom - 1);
      // the context's share is measured on what stays VISIBLE: the largest strip of the desk not covered by the lens
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

test(`${ID}: labels hidden — no visible text; the rail still moves and the marker shows`, async ({page}) => {
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
      res.push({text, moved: Math.abs(s.railAfter - s.railBefore), marker: s.marker, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.moved).toBeGreaterThan(30); expect(r.marker).toBe(1); expect(r.problems).toBe(0); }
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

test(`${ID}: 3..6 sections compose at every ratio (both edges)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const n of [3, 4, 5, 6]) for (const edge of ['lower-edge', 'upper-edge']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const sections = Array.from({length: n}, (_, i) => `Section ${i + 1} (supplied text)`);
      const params = {decisions: {title: 'Decision (fictional)', sections}, routes: {from: 1, to: Math.min(2, n - 1)}, focusTarget: edge, afterIndex: edge === 'lower-edge' ? n - 1 : 0};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params}).semantic;
      if (s.problems.length) out.push(`${n} ${edge} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
