// LAW-0692 — Causas concurrentes · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a second copy of the stage and
// the status tag, drawn in the context's coordinates and posed from the same state every frame; its source holds the
// inspected seal and the whole tag), the change is local (only that link's seal and tag; marbles, cracks and the
// other route do not change) and seeking back restores the old datum exactly.
// Windows (LAW-0692.js W): legends fade 0.20–0.222 and chips under the lens 0.215–0.24 · camera (context slides,
// or shrinks from the labels-hidden rest camera) 0.222–0.25 · lens window appears 0.24–0.255 and grows in place to
// 0.33 (window and copy together) · before 0.33–0.37 · strike 0.45–0.49 · seal swap 0.52–0.58 · tag old out
// 0.52–0.555, new in 0.56–0.595 · after 0.58–0.62 (still until 0.76) · record turns 0.64–0.70 · lens closes 0.76–0.84
// · camera back 0.83–0.86 · chips back 0.84–0.87 · Δ marker 0.86–0.89 · label/key 0.87–0.90.
// coordinator decision 2026-09-26: stress lengths capped to fit at 16 px (LAW-0687 precedent; see SESSION_HANDOFF)
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME} from './causas-concurrentes-checks.js';

const ID = 'LAW-0692';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.seal === 'before' && s.contextDatum === 'before' && !s.markerVisible", label: 'context: the produced state with the old datum; no lens, no marker'},
    {at: 0.1, fn: "s.state.a === 'at-loss' && s.state.b === 'at-loss' && s.cracked.a === 1 && s.cracked.b === 1", label: 'the context is the state produced by both routes (each at the vase, two cracks)'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && s.sourceHoldsDetail && s.mirror && s.copyShown === 1 && s.lensClearOfSource", label: 'isolate: a real enlarged copy (>= 1.5×) of the seal and the whole tag, beside its source'},
    {at: 0.5, fn: "s.strike === 1 && s.datum === 'changing' && s.seal === 'before'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.seal === 'after' && s.tagValue === 'after' && s.lensOpen === 1 && s.mirror", label: 'the seal and tag show the new value — in the scene and in the lens'},
    {at: 0.72, fn: "s.contextDatum === 'after' && s.lensOpen === 1", label: 'the record card turns over while the lens is still open'},
    {at: 1, fn: "s.lensOpen === 0 && s.seal === 'after' && s.markerVisible && s.markerClear && s.contextDatum === 'after'", label: 'return: changed seal, Δ marker clear of planks and vase, record shows the new value'},
    {at: 1, fn: "s.state.a === 'at-loss' && s.state.b === 'at-loss' && s.cracked.a === 1 && s.cracked.b === 1 && s.joints.a.every(Boolean) && s.joints.b.every(Boolean)", label: 'local change: marbles, cracks and every other seal stay as they were'},
    {at: 0.34, fn: "s.datum === 'before' && s.strike === 0 && s.seal === 'before' && s.tagValue === 'before' && s.contextDatum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'last-link-a' && s.substitution === 'to-proposed' && s.seal === 'after' && s.markerVisible", label: 'alternative: route A’s link, disputed → proposed'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.seal === 'after'", label: 'labels hidden: the same isolation and change'},
  ],
});

ratioChecks(ID, 'lens checklist', [
  {at: [0.34, 0.4, 0.5, 0.6, 0.7, 0.75], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.sourceHoldsDetail && s.mirror', label: 'lens >= 1.5×, its source holds the seal and the whole tag, the copy mirrors the scene'},
  {at: times(0.62, 0.75, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value is still in the open lens for >= 400 ms'},
  {at: times(0.25, 0.83, 0.01), fn: 's.lensOpen === 0 || s.copyShown > 0', label: 'no bare blank lens at any moment (the window and its copy fade in and out together)'},
  {at: [0.34, 0.5, 0.62, 0.75], fn: 's.lensShare >= 1 && s.contextShare >= 0.45 && s.wholeObjects', label: 'lens short side >= 36 % of the frame short side; context >= 45 % of the width; vase, plinth and both marbles whole in the crop'},
  {at: [1], fn: 's.markerVisible && s.markerClear && s.layout.k === 1 && !s.layout.fallback', label: 'Δ marker clear; layout fits without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text', [
  {at: [0, 0.4, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.1, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.events.a.map(e => e.time), ...p.events.b.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.routeLabels.a, p.routeLabels.b, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [...p.events.a.map(e => e.label), ...p.events.b.map(e => e.label), ...p.losses.map(l => l.label), p.beforeValue, p.afterValue]",
  captions: "return ['As supplied · routes not added up · no conclusion drawn', 'Según lo aportado · rutas sin sumar · sin conclusión']",
});

// Coordinator bar: key text >= 19.5 px in baseline AND baseline-es in every ratio (layout size = px at 1080p, the
// design spaces are sized to scale ~1.0 in every ratio).
ratioChecks(ID, 'baseline and baseline-es text >= 19.5 px', [
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.layout.size >= 19.5 && s.layout.k === 1', label: 'text size >= 19.5 px without a fallback scale'},
]);

textSizeOverTime(ID);

// Rendered (dense): while the lens is open no line of the copy is cut by the rim and each text field of the copy is
// wholly in the lens or wholly out, in every preset × ratio × labels shown/hidden.
test.describe(`${ID} lens rim (rendered)`, () => {
  test(`${ID}: no lens-copy text crosses the rim (u 0.25–0.83)`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            const svg = x.element;
            const node = n => svg.querySelector(`[data-node="${n}"]`);
            const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
            let texts = 0;
            for (let u = 0.25; u <= 0.83 + 1e-9; u += 0.01) {
              x.seek(u * x.durationMs);
              const win = node('lz-win');
              if (!win || eff(win) < 0.05) continue;
              const W = node('lz-border').getBoundingClientRect();
              for (const t of node('lz-content').querySelectorAll('text')) {
                if (eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
                const spans = [...t.querySelectorAll('tspan')];
                const lines = spans.length ? spans : [t];
                const vis = lines.filter(q => { const b = q.getBoundingClientRect(); return b.width > 0.5 && b.left < W.right && b.right > W.left && b.top < W.bottom && b.bottom > W.top; });
                for (const q of vis) {
                  texts++;
                  const b = q.getBoundingClientRect();
                  if (b.left < W.left - 1 || b.right > W.right + 1 || b.top < W.top - 1 || b.bottom > W.bottom + 1) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: "${q.textContent.slice(0, 24)}" cut by the rim`);
                }
                if (vis.length && vis.length !== lines.length) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: field "${t.textContent.slice(0, 24)}" only partly in the lens`);
              }
            }
            if (tv === 'all' && !texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
            x.destroy();
            el.remove();
          }
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered (dense): whole objects only — the vase, its plinth, both marbles, the inspected seal and the tag are wholly
// inside the lens window; every other seal and barrier of the copy is wholly inside or wholly outside (never cut).
test.describe(`${ID} lens whole objects (rendered)`, () => {
  test(`${ID}: the rim never cuts the vase, marbles, seals, barriers or tag`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const node = n => svg.querySelector(`[data-node="${n}"]`);
          const must = ['lzs-vaseg', 'lzs-plinth', 'lzs-marblea', 'lzs-marbleb', 'lzs-tag'];
          const either = [...svg.querySelectorAll('[data-node^="lzs-joint"], [data-node^="lzs-alt"][data-node$="-a"]')].map(e => e.getAttribute('data-node'));
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          for (const u of [0.4, 0.5, 0.62, 0.75]) {
            x.seek(u * x.durationMs);
            const W = node('lz-border').getBoundingClientRect();
            const rel = n => {
              const e = node(n);
              if (!e) return 'missing';
              const b = e.getBoundingClientRect();
              if (b.width < 0.5 && b.height < 0.5) return 'empty';
              if (b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1) return 'in';
              if (b.right <= W.left + 1 || b.left >= W.right - 1 || b.bottom <= W.top + 1 || b.top >= W.bottom - 1) return 'out';
              return 'cut';
            };
            for (const n of must) { const q = rel(n); if (q !== 'in') out.push(`${pr.name} ${ratio} u=${u}: ${n} ${q}`); }
            for (const n of either) { if (eff(node(n)) < 0.05) continue; const q = rel(n); if (q === 'cut') out.push(`${pr.name} ${ratio} u=${u}: ${n} cut by the rim`); }
          }
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// baseline-es is a Spanish baseline: no English default text may be drawn.
ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Presenter|Route|Cause|Loss|Link|Before|After|Datum|Context)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

// Rendered (dense): the lens window never covers the context's key objects (racks, planks' floor, vase, plinth,
// marbles) at any moment of opening, hold or closing — it grows in place at its destination.
test.describe(`${ID} lens clear of the context (rendered)`, () => {
  test(`${ID}: the lens never covers the racks, floor, vase, plinth, marbles or any visible context text`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            const svg = x.element;
            const node = n => svg.querySelector(`[data-node="${n}"]`);
            const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
            const keys = ['st-racka', 'st-rackb', 'st-floor', 'st-vaseg', 'st-plinth', 'st-marblea', 'st-marbleb'];
            for (let u = 0.2; u <= 0.9 + 1e-9; u += 0.01) {
              x.seek(u * x.durationMs);
              const win = node('lz-win');
              if (!win || eff(win) < 0.05) continue;
              const W = node('lz-border').getBoundingClientRect();
              if (W.width < 1) continue;
              for (const k of keys) {
                const e = node(k);
                if (!e) continue;
                const b = e.getBoundingClientRect();
                if (b.width < 0.5) continue;
                if (b.left < W.right - 1 && b.right > W.left + 1 && b.top < W.bottom - 1 && b.bottom > W.top + 1) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: lens over ${k}`);
              }
              // item 4: no context text is visible under the (possibly translucent) window
              const lzRoot = node('lz');
              for (const t of svg.querySelectorAll('text')) {
                if ((lzRoot && lzRoot.contains(t)) || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
                const b = t.getBoundingClientRect();
                if (b.width < 0.5) continue;
                if (b.left < W.right - 1 && b.right > W.left + 1 && b.top < W.bottom - 1 && b.bottom > W.top + 1) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: text "${t.textContent.slice(0, 20)}" under the lens`);
              }
            }
            x.destroy();
            el.remove();
          }
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Labels hidden (coordinator decision, LAW-0688 pattern): a rest camera fills the safe box while no lens is open, and
// the context (shrunk or slid aside for the lens) keeps >= 0.45 of the width at every moment.
ratioChecks(ID, 'labels hidden: rest camera fills the box; context never narrower than 0.45', [
  {at: [0.1, 1], tv: ['none'], fn: 's.ctxW >= 0.8 && s.ctxH >= 0.8', label: 'labels hidden: the context fills >= 0.8 of the box (width and height) at rest and at the hold'},
  {at: times(0, 1, 0.01), tv: ['none'], fn: 's.ctxW >= 0.45', label: 'labels hidden: the context keeps >= 0.45 of the width at every u'},
]);
