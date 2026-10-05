// LAW-0344 — Confirmación ilustrativa · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens is a real enlarged copy of the same desk
// region, collapsing back onto its source), the change is localised (only the focus card's reference tag and its own
// width change; the printed results never change) and going back in time restores exactly the old value.
// Timing (u): build 0.03–0.16 · source outline 0.20–0.24 · lens opens 0.24–0.37 (an opaque copy, starting exactly over its source) ·
// old value lifts 0.47–0.53 · tag width 0.52–0.58 · new value 0.57–0.63 (still until 0.75) · lens closes 0.75–0.85 ·
// marker 0.85–0.90 · panel back 0.85–0.91; still from 0.91.
// Lens checklist (AUTHORING): ≥ 1.5×, ≥ ~35 % of the frame's short side, the datum legible in one place at a time,
// never a translucent copy over its source, the new value still for ≥ 400 ms.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0344';

contractSuite(ID, {
  continuity: ['lensBox'],
  semantic: [
    {at: 0, fn: "s.beat === 'build' && s.open === 0 && s.value === 'before' && s.contextShows === 'before' && s.marker === 0", label: 'build: context with the old value, no lens'},
    {at: 0.45, fn: "s.open === 1 && s.contextShows === 'lens' && s.value === 'before' && s.zoom >= 1.5", label: 'isolate: the lens holds the detail (≥ 1.5×); the context copy of the value is hidden'},
    {at: 0.7, fn: "s.value === 'after' && s.newIn === 1 && s.was === 1 && s.contextShows === 'lens'", label: 'substitute: the new value in the lens, the old one kept in the "was" band'},
    {at: 1, fn: "s.open === 0 && s.contextShows === 'after' && s.marker === 1 && s.tipGap < 8 && s.problems.length === 0", label: 'return: lens closed, the context shows the new value with the Δ marker; cards still aligned'},
    {at: 0.3, fn: "s.value === 'before' && s.lift === 0", label: 'seeking back restores exactly the old value'},
    {at: 0.24, fn: 'JSON.stringify(s.lensBox) === JSON.stringify({x: s.src.x, y: s.src.y})', label: 'the lens starts exactly on its source (source coordinates kept)'},
    {at: 0.85, fn: 'JSON.stringify(s.lensBox) === JSON.stringify({x: s.src.x, y: s.src.y}) && s.open === 0', label: 'the lens closes back onto its source'},
    {at: 1, params: {focusTarget: 'refA'}, fn: "s.focus === 'a' && s.before === 'Ref. A-01 (fictional)'", label: 'the focus target alone decides which card is inspected; an empty before value is the supplied reference'},
    {at: 1, params: {beforeValue: 'Ref. X-9 (fictional)'}, fn: "s.before === 'Ref. X-9 (fictional)'", label: 'a supplied before value replaces the reference'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.decisions.a.role, p.decisions.a.title, p.decisions.b.role, p.decisions.b.title, p.focusTarget === 'refA' ? p.decisions.b.ref : p.decisions.a.ref, p.afterValue, p.grounds.a, p.grounds.b, p.outcomes.a, p.outcomes.b, p.contextLabels.context, p.contextLabels.marker, p.routes.label, p.labels.key];",
  content: "return [p.decisions.a.role, p.decisions.b.role, p.afterValue, p.outcomes.a, p.outcomes.b];",
  captions: 'return [];',
});

ratioChecks(ID, 'lens is a real, large magnification; the datum lives in one place at a time', [
  {at: [0.5], fn: 's.zoom >= 1.5 && s.problems.length === 0', label: 'lens ≥ 1.5× and a composition fits'},
  {at: [0.5], dom: "(() => { const b = svg.querySelector('[data-node=\"lens-border\"]').getBoundingClientRect(); const m = svg.getScreenCTM(); const vb = svg.viewBox.baseVal; return Math.min(b.width, b.height) / Math.min(vb.width * m.a, vb.height * m.d) >= 0.34; })()", label: 'the open lens is ≥ ~35 % of the frame\'s short side', tv: ['all']},
  {at: times(0, 1, 0.01), fn: "s.contextShows !== 'lens' || s.copy > 0.02", label: 'the context copy is hidden only while the lens holds the detail'},
  {at: times(0.63, 0.75, 0.01), fn: "s.newIn === 1 && s.value === 'after'", label: 'the new value stays still ≥ 400 ms in the lens'},
  {at: times(0, 1, 0.1), params: {outcomes: {a: 'Result A as supplied', b: 'Result B as supplied'}}, fn: "s.results[0] === 'Result A as supplied' && s.results[1] === 'Result B as supplied'", label: 'the printed results equal the supplied ones at every time'},
]);

// The datum is never legible in two places at once (context tag vs lens tag), and the results' DOM text never changes.
test(`${ID}: one legible copy of the datum at a time; printed results never change`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const res = {both: [], results: new Set(), overSource: []};
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
        const ctxV = Math.max(op(q('cardb-art-ref-t')), op(q('cardb-art-ref-alt')));
        const lensV = Math.max(op(q('L-cardb-art-ref-t')), op(q('L-cardb-art-ref-alt')));
        if (ctxV >= 0.15 && lensV >= 0.15) res.both.push(`${w}x${h} u=${u}`);
        // never a translucent enlarged copy over its source
        const lb = q('lens-border').getBoundingClientRect(), sb = q('src').getBoundingClientRect();
        const overlap = Math.max(0, Math.min(lb.right, sb.right) - Math.max(lb.left, sb.left)) * Math.max(0, Math.min(lb.bottom, sb.bottom) - Math.max(lb.top, sb.top));
        if (s.copy > 0.05 && s.copy < 0.95 && overlap > 0.5 * sb.width * sb.height) res.overSource.push(`${w}x${h} u=${u}`);
        res.results.add(`${w}x${h}:` + ['carda-art-res-t', 'cardb-art-res-t'].map(n => q(n).textContent).join('/'));
      }
      x.destroy(); el.remove();
    }
    return {both: res.both, overSource: res.overSource, results: [...res.results]};
  }, ID);
  expect(out.both.slice(0, 5)).toEqual([]);
  expect(out.overSource.slice(0, 5)).toEqual([]);
  expect(out.results.length).toBe(3);
});

// Labels hidden: no visible text, the lens still opens large and the marker is shown at the end.
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

// Cold create stays within budget for the long-labels stress preset in every ratio (fresh page each time).
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

// Both focus targets × both placements × both alignment rows compose at every ratio.
test(`${ID}: both focus targets × placements × alignment rows compose at every ratio`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const focusTarget of ['refA', 'refB']) for (const placement of ['auto', 'right', 'bottom']) for (const align of ['result', 'header']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs * 0.5, params: {focusTarget, detailGeometry: {zoom: 2, placement}, routes: {align, label: 'Alignment guide (as configured)'}}}).semantic;
      if (s.problems.length || s.zoom < 1.5) out.push(`${focusTarget} ${placement} ${align} ${w}x${h}: ${s.problems.join(',')} zoom ${s.zoom}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});
