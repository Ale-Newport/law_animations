// LAW-0360 — Cierre de itinerario · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens is a real enlarged copy of the same desk
// region, starting on and collapsing back onto its source), the change is localised (only the focus route's end entry
// changes; no track, clip, badge or state) and going back in time restores exactly the old entry.
// Timing (u): build: ink 0.03–0.14, clips 0.06–0.16, badges 0.14–0.18 · source outline 0.20–0.24 · lens opens
// 0.24–0.37 · old entry lifts 0.47–0.53 · new entry 0.56–0.62 (still until 0.75) · lens closes 0.75–0.85 · marker
// 0.85–0.90 · panel back 0.85–0.91; still from 0.91.
// Lens checklist (AUTHORING): ≥ 1.5×, ≥ ~35 % of the frame's short side, the datum legible in one place at a time,
// never a translucent copy over its source, the new value still for ≥ 400 ms.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0360';

contractSuite(ID, {
  continuity: ['lensBox'],
  semantic: [
    {at: 0, fn: "s.beat === 'build' && s.open === 0 && s.value === 'before' && s.contextShows === 'before' && s.marker === 0", label: 'build: context with the old entry, no lens'},
    {at: 0.19, fn: 's.ink === 1 && s.clips === 1 && s.badges === 1 && s.open === 0', label: 'the marked state is complete before the lens opens'},
    {at: 0.45, fn: "s.open === 1 && s.contextShows === 'lens' && s.value === 'before' && s.zoom >= 1.5", label: 'isolate: the lens holds the detail (≥ 1.5×); the context copy is hidden'},
    {at: 0.7, fn: "s.value === 'after' && s.newIn === 1 && s.was === 1 && s.contextShows === 'lens'", label: 'substitute: the new entry in the lens, the old one kept in the "was" band'},
    {at: 1, fn: "s.open === 0 && s.contextShows === 'after' && s.marker === 1 && s.problems.length === 0", label: 'return: lens closed, the context shows the new entry with the Δ marker'},
    {at: 1, fn: "s.states.join() === 'concluded,pending,pending' && s.labels[0] === 'Route 1 (as supplied)'", label: 'states and labels are untouched'},
    {at: 0.3, fn: "s.value === 'before' && s.lift === 0", label: 'seeking back restores exactly the old entry'},
    {at: 0.24, fn: 'JSON.stringify(s.lensBox) === JSON.stringify({x: s.src.x, y: s.src.y})', label: 'the lens starts exactly on its source'},
    {at: 0.85, fn: 'JSON.stringify(s.lensBox) === JSON.stringify({x: s.src.x, y: s.src.y}) && s.open === 0', label: 'the lens closes back onto its source'},
    {at: 1, params: {focusTarget: 'route2'}, fn: "s.focus === 1 && s.before === 'Not yet checked in this file' && s.problems.length === 0", label: 'the focus target alone decides which card is inspected; an empty before value is the supplied entry'},
    {at: 1, params: {beforeValue: 'Entry X-9 (fictional)'}, fn: "s.before === 'Entry X-9 (fictional)'", label: 'a supplied before value replaces the entry'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const fi = Math.min(p.routes.length, Number(p.focusTarget.slice(5))) - 1; return [p.decisions.title, p.decisions.ref, p.grounds, ...p.routes.map(r => r.label), ...p.routes.filter((r, i) => i !== fi).map(r => r.end), p.afterValue, p.outcomes.concluded, p.outcomes.pending, p.labels.file, p.labels.key, p.contextLabels.context, p.contextLabels.marker];",
  content: "return [p.decisions.title, ...p.routes.map(r => r.label), p.afterValue];",
  captions: 'return [];',
});

ratioChecks(ID, 'lens is a real, large magnification; the datum lives in one place at a time', [
  {at: [1], fn: 's.textPx >= 19.5', label: 'baseline presets (incl. baseline-es) keep key text >= 19.5 px in every ratio (browser-measured layout)', presets: ['baseline-illustrative', 'baseline-es'], tv: ['all']},
  {at: [0.5], fn: 's.zoom >= 1.5 && s.problems.length === 0', label: 'lens ≥ 1.5× and a composition fits'},
  {at: [0.5], dom: "(() => { const b = svg.querySelector('[data-node=\"lens-border\"]').getBoundingClientRect(); const m = svg.getScreenCTM(); const vb = svg.viewBox.baseVal; return Math.min(b.width, b.height) / Math.min(vb.width * m.a, vb.height * m.d) >= 0.34; })()", label: 'the open lens is ≥ ~35 % of the frame\'s short side', tv: ['all']},
  {at: times(0, 1, 0.01), fn: "s.contextShows !== 'lens' || s.copy > 0.02", label: 'the context copy is hidden only while the lens holds the detail'},
  {at: times(0.63, 0.75, 0.01), fn: "s.newIn === 1 && s.value === 'after'", label: 'the new entry stays still ≥ 400 ms in the lens'},
]);

test(`${ID}: one legible copy of the datum at a time`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const res = {both: [], overSource: []};
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      for (let i = 0; i <= 200; i++) {
        const u = i / 200;
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const ctxV = Math.max(op(q('end0-end')), op(q('end0-alt')));
        const lensV = Math.max(op(q('L-end0-end')), op(q('L-end0-alt')));
        if (ctxV >= 0.15 && lensV >= 0.15) res.both.push(`${w}x${h} u=${u}`);
        const lb = q('lens-border').getBoundingClientRect(), sb = q('src').getBoundingClientRect();
        const overlap = Math.max(0, Math.min(lb.right, sb.right) - Math.max(lb.left, sb.left)) * Math.max(0, Math.min(lb.bottom, sb.bottom) - Math.max(lb.top, sb.top));
        if (s.copy > 0.05 && s.copy < 0.95 && overlap > 0.5 * sb.width * sb.height) res.overSource.push(`${w}x${h} u=${u}`);
      }
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  expect(out.both.slice(0, 5)).toEqual([]);
  expect(out.overSource.slice(0, 5)).toEqual([]);
});

test(`${ID}: labels hidden — no visible text; the lens still opens and the marker stays`, async ({page}) => {
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
      for (const u of [0, 0.5, 0.7, 1]) {
        x.seek(u * x.durationMs);
        text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length;
      }
      x.seek(0.5 * x.durationMs); const s5 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, zoom: s5.zoom, open: s5.open, marker: s1.marker, problems: s1.problems.length});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.zoom).toBeGreaterThanOrEqual(1.5);
    expect(r.open).toBe(1);
    expect(r.marker).toBe(1);
    expect(r.problems).toBe(0);
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

test(`${ID}: every focus target × placement × 2..3 routes composes at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const rt = (i, st) => ({label: `Route ${i} (as supplied)`, state: st, end: st === 'pending' ? 'Not yet checked in this file' : `Resolution R-${i + 1} recorded (fictional)`});
    const out = [];
    for (const n of [2, 3]) for (const focusTarget of ['route1', 'route2', 'route3']) for (const placement of ['auto', 'right', 'bottom']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const params = {routes: [rt(1, 'concluded'), rt(2, 'pending'), rt(3, 'concluded')].slice(0, n), focusTarget, detailGeometry: {zoom: 2, placement}};
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs * 0.5, params}).semantic;
      if (s.problems.length || s.zoom < 1.5) out.push(`${n} ${focusTarget} ${placement} ${w}x${h}: ${s.problems.join(',')} zoom ${s.zoom}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
