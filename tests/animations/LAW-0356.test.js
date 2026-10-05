// LAW-0356 — Efectos durante revisión · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens is a uniformly scaled copy of the gate
// region: the tag inside the lens maps back to the context tag exactly); the change is local (only the tag's datum, then
// the gate's slats and the chevrons past it change; the cards, lanes and calendar stay); seeking back to earlier times
// restores the old datum exactly.
// Timing (u): context 0–0.20 · legend steps aside 0.15–0.21 · lens opens 0.20–0.36 (copy shown from 40 % open) · old
// value lifts away 0.46–0.50 · new value settles 0.50–0.55 · slats turn and chevrons follow 0.56–0.64 · lens closes
// 0.76–0.86 · marker 0.84–0.89 · legend back 0.84–0.90; still from 0.90.
// Legal: one supplied datum substituted; the gate only follows it; neutral Δ marker; no doctrine, dates or time limits.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0356';

contractSuite(ID, {
  continuity: ['tag', 'lensTag', 'cardP'],
  semantic: [
    {at: 0, fn: "s.beat === 'context' && s.datum === 'before' && s.lensOpen === 0 && s.ctxOld === 1 && s.ctxNew === 0 && s.closed === 0", label: 'context: the old datum (maintained) on the tag; gate open; lens closed'},
    {at: 0.42, fn: 's.lensOpen === 1 && s.datumInLens && s.ctxOld === 0 && s.ctxNew === 0 && s.lensOld === 1', label: 'isolate: the datum is only in the lens (context tag blank)'},
    {at: 0.555, fn: "s.datum === 'after' && s.lensNew === 1 && s.lensOld === 0 && s.closed === 0", label: 'substitute: the new value settled before the gate turns (cause before effect)'},
    {at: 0.72, fn: 's.closed === 1 && s.lensNew === 1', label: 'local consequence: the slats closed, the new value still readable'},
    {at: 1, fn: 's.lensOpen === 0 && s.ctxNew === 1 && s.marker === 1 && s.closed === 1 && s.zoom >= 1.5 && s.problems.length === 0', label: 'back: the context shows the new datum, the closed gate and the Δ marker; magnification >= 1.5; composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.closed === 0 && s.marker === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: {finalState: 'maintained'}, fn: "s.before === 'suspended' && s.closed === 0 && s.ctxNew === 1", label: 'the opposite substitution opens the gate'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.routes.process, p.routes.review, p.finalState === 'maintained' ? p.outcomes.maintained : p.outcomes.suspended, p.finalState === 'maintained' ? p.outcomes.suspended : p.outcomes.maintained, p.labels.filter, p.labels.key, p.objectLabels.arrows, p.objectLabels.calendar, p.contextLabels.context, p.contextLabels.marker, p.contextLabels.previous];",
  content: "return [p.decisions.title, p.decisions.ref, p.grounds.appeal, p.finalState === 'maintained' ? p.outcomes.maintained : p.outcomes.suspended];",
  captions: 'return [p.contextLabels.context, p.objectLabels.arrows, p.objectLabels.calendar];',
});

ratioChecks(ID, 'lens real, datum in one place, change local, composition fits', [
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: 's.zoom >= 1.5 - 1e-6', label: 'the lens magnifies at least 1.5×'},
  {at: times(0, 1, 0.01), fn: '!(s.datumInLens && (s.ctxOld || s.ctxNew)) && !(s.lensOld > 0.15 && s.lensNew > 0.15)', label: 'the datum is legible in one place only; old and new never overlap'},
  {at: times(0, 0.499, 0.01), fn: "s.datum === 'before' && s.closed === s.closedBefore", label: 'nothing reads as the new value before the substitution beat'},
  {at: times(0.5, 0.56, 0.01), fn: 's.closed === s.closedBefore', label: 'the datum changes before the gate follows (cause before effect)'},
  {at: times(0.64, 1, 0.02), fn: 's.closed === s.closedAfter', label: 'the gate keeps its new position after the substitution'},
  {at: [0.42], fn: 'Math.abs(s.lensTag.x - (s.dest.x + (s.tag.x - s.src.x) * s.zoom)) < 0.5', label: 'the lens copy keeps the source coordinates'},
]);

// The lens is a real inspection: its window's smaller side is >= 0.34 of the frame's short side while open, it does
// not overlap its own source region, and the board (context) keeps >= 45 % of one frame dimension visible.
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
      const D = x.element.querySelector('[data-node="board-plate"]').getBoundingClientRect();
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

// While the lens copy is translucent it never sits over its own source (no double image), and a text in the lens
// is never legible together with the same datum in the context.
test(`${ID}: dense text-size check while the lens grows (visible lens text >= 16 px at 1080p)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready;
      const svg = x.element;
      const k1080 = 1080 / Math.min(w, h);
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      for (let i = 0; i <= 100; i++) {
        x.seek((i / 100) * x.durationMs);
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = t.getScreenCTM();
          const px = parseFloat(t.getAttribute('font-size')) * Math.hypot(m.a, m.b) * k1080;
          if (px < 15.5) out.push(`${w}x${h} u=${i / 100}: "${t.textContent.slice(0, 30)}" ${px.toFixed(1)}px`);
        }
      }
      x.destroy(); el.remove();
    }
    return out.slice(0, 10);
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the gate still turns and the marker shows`, async ({page}) => {
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
      res.push({text, closed: s.closed, marker: s.marker, problems: s.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) { expect(r.text).toBe(0); expect(r.closed).toBe(1); expect(r.marker).toBe(1); expect(r.problems).toBe(0); }
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

test(`${ID}: both substitutions compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const fs of ['maintained', 'suspended']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {finalState: fs}}).semantic;
      if (s.problems.length) out.push(`${fs} ${w}x${h}: ${s.problems.join(',')}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
