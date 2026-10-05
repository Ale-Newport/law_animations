// LAW-0696 — Evento interviniente · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a second copy of the stage and
// the status tag, drawn in the context's coordinates and posed from the same state every frame; its source holds the
// later event, the inspected seal and the whole tag), the change is local (only that link's seal and tag; tiles, the
// crack and every other seal stay) and seeking back restores the old datum exactly.
// Windows (LAW-0696.js W): legend steps out 0.20–0.225 (square / labels-hidden wide boxes: the context shrinks into the
// left half at the same time) · lens opens 0.225–0.31 (window and copy opaque from the first frame, the copy starts
// over its source) · before 0.30–0.35 · strike 0.45–0.49 · old seal out 0.52–0.55, new seal in 0.555–0.59 · tag old
// out 0.52–0.555, new in 0.56–0.595 · after 0.58–0.62 (still until 0.76) · lens closes 0.76–0.80 · context back 0.795–0.835 · texts back 0.835–0.865 ·
// Δ marker 0.84–0.88 · label/key 0.85–0.89.
// coordinator decision 2026-09-26 (standing stress cap rule, LAW-0687/0689–0692 precedent; see SESSION_HANDOFF): the
// long-labels-stress lengths are capped to the longest tried values that fit every ratio at >= 16 px (measurements in
// LAW-0696.presets.json); every field stays longer than the baseline and every count >= the baseline.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME} from './evento-interviniente-checks.js';

const ID = 'LAW-0696';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.seal === 'before' && s.tagValue === 'before' && !s.markerVisible", label: 'context: the produced state with the old datum; no lens, no marker'},
    {at: 0.1, fn: "s.lossState[0] === 'down' && s.cracked[0] === 1 && s.joints.every(Boolean)", label: 'the context is the state produced after the later event entered (sequence run through it as supplied)'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && s.sourceHoldsDetail && s.mirror && s.copyShown === 1 && s.lensClearOfSource", label: 'isolate: a real enlarged copy (>= 1.5×) of the later event, its seal and the whole tag, beside its source'},
    {at: 0.5, fn: "s.strike === 1 && s.datum === 'changing' && s.seal === 'before'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.seal === 'after' && s.tagValue === 'after' && s.lensOpen === 1 && s.mirror", label: 'the seal and tag show the new value — in the scene and in the lens'},
    {at: 1, fn: "s.lensOpen === 0 && s.seal === 'after' && s.markerVisible && s.markerClear", label: 'return: changed seal, Δ marker clear of the tiles'},
    {at: 1, fn: "s.lossState[0] === 'down' && s.cracked[0] === 1 && s.joints.every(Boolean) && s.angles.every(a => a > 0)", label: 'local change: tiles, crack and every seal stay as they were'},
    {at: 0.34, fn: "s.datum === 'before' && s.strike === 0 && s.seal === 'before' && s.tagValue === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'link-in' && s.substitution === 'to-proposed' && s.seal === 'after' && s.markerVisible", label: 'alternative: the link into the later event, disputed → proposed'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.seal === 'after'", label: 'labels hidden: the same isolation and change'},
  ],
});

ratioChecks(ID, 'lens checklist', [
  {at: [0.34, 0.4, 0.5, 0.6, 0.7, 0.75], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.sourceHoldsDetail && s.mirror', label: 'lens >= 1.5×, its source holds the seal and the whole tag, the copy mirrors the scene'},
  {at: times(0.62, 0.75, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value is still in the open lens for >= 400 ms'},
  // AUTHORING lens checklist: a blank window (lens open, copy not yet shown) lasts <= ~200 ms at each end: the copy is
  // shown (opacity >= 0.3) 200 ms (0.025 u) after the lens starts to open (0.225) and until 200 ms before it has
  // closed (0.80)
  {at: [0.25, 0.3, 0.5, 0.7, 0.76, 0.775], fn: 's.copyShown >= 0.3', label: 'the enlarged copy is visible whenever the lens is more than 200 ms into its opening or closing (open 0.225, closed 0.80)'},
  {at: [0.34, 0.5, 0.62, 0.75], fn: 's.lensMinSide >= 0.4 && s.zoom >= 1.5', label: 'lens: smaller side >= 0.40 of the frame short side; magnification >= 1.5× against the context at REST'},
  {at: times(0, 1, 0.02), fn: 's.contextShare >= 0.45', label: 'the context never shrinks under 45 % of the width'},
  {at: [1], fn: 's.markerVisible && s.markerClear && s.layout.k === 1 && !s.layout.fallback && s.lensOk', label: 'Δ marker clear; layout fits without a fallback scale; lens geometry valid'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text', [
  {at: [0, 0.4, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.1, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), p.addedEvent.label, p.addedEvent.time, ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [...p.events.map(e => e.label), p.addedEvent.label, ...p.losses.map(l => l.label), p.beforeValue, p.afterValue]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});
ratioChecks(ID, 'baseline and baseline-es text >= 19.5 px', [
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.layout.size >= 19.5 && s.layout.k === 1', label: 'text size >= 19.5 px without a fallback scale'},
]);

textSizeOverTime(ID, 0.01);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.4, 0.62, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Later|Link|Loss|Before|After|Context|Datum|supplied|event|conclusion)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

// Rendered (dense): while the lens is open no line of the copy is cut by the rim and each text field of the copy is
// wholly in the lens or wholly out, in every preset × ratio × labels shown/hidden.
test.describe(`${ID} lens rim (rendered)`, () => {
  test(`${ID}: no lens-copy text crosses the rim (u 0.22–0.84)`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of ratios) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            const svg = x.element;
            const node = n => svg.querySelector(`[data-node="${n}"]`);
            const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
            let texts = 0;
            for (let u = 0.22; u <= 0.84 + 1e-9; u += 0.01) {
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
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered: the later event's tile, the inspected seal and the tag are wholly inside the open lens window; the lens never
// covers the context's stage (floor, gantry, plinth) or any visible context text while it is open.
test.describe(`${ID} lens whole objects and clear of the context (rendered)`, () => {
  test(`${ID}: whole detail in the lens; the lens never covers the context`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of ratios) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            const svg = x.element;
            const node = n => svg.querySelector(`[data-node="${n}"]`);
            const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
            x.seek(0.4 * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            const k = s.link;
            const kx = s.link === undefined ? null : k;
            const inside = (n, W) => { const e = node(n); if (!e) return 'missing'; const b = e.getBoundingClientRect(); if (b.width < 0.5) return 'empty'; return b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1 ? 'in' : 'cut'; };
            for (const u of [0.4, 0.5, 0.62, 0.75]) {
              x.seek(u * x.durationMs);
              const W = node('lz-border').getBoundingClientRect();
              const must = [`lzs-joint${kx}`, 'lzs-sw', ...(tv === 'all' ? ['lzt-tag'] : [])];
              for (const n of must) { if (eff(node(n)) < 0.05) continue; const q = inside(n, W); if (q !== 'in') out.push(`${pr.name} ${ratio} ${tv} u=${u}: ${n} ${q}`); }
            }
            for (let u = 0.2; u <= 0.88 + 1e-9; u += 0.02) {
              x.seek(u * x.durationMs);
              const win = node('lz-win');
              if (!win || eff(win) < 0.05) continue;
              const W = node('lz-border').getBoundingClientRect();
              if (W.width < 1) continue;
              for (const n of ['st-floor', 'st-gantry', 'st-plinth']) {
                const b = node(n).getBoundingClientRect();
                if (b.left < W.right - 1 && b.right > W.left + 1 && b.top < W.bottom - 1 && b.bottom > W.top + 1) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: lens over ${n}`);
              }
              const lzRoot = node('lz');
              for (const t of svg.querySelectorAll('text')) {
                if ((lzRoot && lzRoot.contains(t)) || t.closest('[data-node="ann"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
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
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered (LAW-0688 pattern, coordinator 2026-09-26): the context (the 'cam' group: stage, tag, marker) keeps >= 0.45
// of the FRAME width at every u, and while the lens is open the lens + the visible context fill >= 80 % of the
// caption-safe box.
test.describe(`${ID} context and fill (rendered)`, () => {
  test(`${ID}: context >= 0.45 of the frame width at every u; lens + context (bounding boxes only) >= 80 % of the safe box while open`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const R = svg.getBoundingClientRect();
        const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
        for (let u = 0; u <= 1.0001; u += 0.01) {
          x.seek(u * x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          const safe = {x: R.left + s.safe.x * R.width, y: R.top + s.safe.y * R.height, w: s.safe.w * R.width, h: s.safe.h * R.height};
          const cam = svg.querySelector('[data-node="cam"]').getBoundingClientRect();
          if (cam.width < 0.45 * R.width - 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: context ${(cam.width / R.width).toFixed(3)} of the frame width`);
          if (s.lensOpen === 1) {
            const lzb = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect();
            const ms = Math.min(lzb.width, lzb.height) / Math.min(R.width, R.height);
            if (ms < 0.4 - 0.002) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: lens smaller side ${ms.toFixed(3)} of the frame short side`);
            // (the reviewer's measure: the context's bounding box ('ctx': stage + tag) and the lens window's only — no
            // notes, captions or legend)
            const rs = [svg.querySelector('[data-node="ctx"]').getBoundingClientRect(), lzb];
            const l = Math.max(safe.x, Math.min(...rs.map(q => q.left))), t = Math.max(safe.y, Math.min(...rs.map(q => q.top)));
            const rr = Math.min(safe.x + safe.w, Math.max(...rs.map(q => q.right))), bb = Math.min(safe.y + safe.h, Math.max(...rs.map(q => q.bottom)));
            const cov = ((rr - l) * (bb - t)) / (safe.w * safe.h);
            if (cov < 0.8) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: lens + context cover ${cov.toFixed(2)} of the safe box`);
          }
        }
        x.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered, 60 fps: ONE copy of the changed datum at a time (AUTHORING lens checklist, LAW-0696 review): the context
// tag and the lens copy's tag are never both legible (effective opacity >= 0.15) at the same frame.
test.describe(`${ID} one copy of the datum (rendered, 60 fps)`, () => {
  test(`${ID}: the context tag and the lens copy's tag are never both >= 0.15 opacity`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const node = n => svg.querySelector(`[data-node="${n}"]`);
        const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
        const frames = Math.round(x.durationMs / 1000 * 60);
        let both = 0, seen = 0;
        for (let f = 0; f <= frames; f++) {
          x.renderFrame(f, {fps: 60});
          const a = node('tg-tag'), b = node('lzt-tag');
          if (!a || !b) continue;
          // the copy counts as legible only when the lens window shows it
          const eb = eff(b), ea = eff(a);
          if (eb >= 0.15) seen++;
          if (ea >= 0.15 && eb >= 0.15) { both++; if (both <= 2) out.push(`${pr.name} ${ratio} frame ${f}: context tag ${ea.toFixed(2)} and lens tag ${eb.toFixed(2)}`); }
        }
        if (!seen) out.push(`${pr.name} ${ratio}: the lens copy of the tag never shows (vacuous)`);
        x.destroy();
        el.remove();
      }
      return out.slice(0, 40);
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered: magnification measured against the context at REST (u 0.1): the later event's tile in the open lens is
// >= 1.5× its rendered size at rest, in every preset × ratio × labels shown/hidden.
test.describe(`${ID} magnification against rest (rendered)`, () => {
  test(`${ID}: the lens shows the later event >= 1.5× its size at rest`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const k = x.getState({bounds: false}).semantic.link; // (the inspected link; the later event's index is resolved below)
        void k;
        x.seek(0.1 * x.durationMs);
        const tiles = [...svg.querySelectorAll('[data-node^="st-tile"]')];
        // the later event's tile carries the ◆ face; find it as the tile whose lens copy is inside the window
        x.seek(0.5 * x.durationMs);
        const W = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect();
        let best = null;
        for (const t of tiles) {
          const name = t.getAttribute('data-node').replace('st-', 'lzs-');
          const c = svg.querySelector(`[data-node="${name}"]`).getBoundingClientRect();
          const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
          if (cx > W.left && cx < W.right && cy > W.top && cy < W.bottom && (!best || c.width > best.c.width)) best = {t, c};
        }
        if (!best) { out.push(`${pr.name} ${tv} ${ratio}: no tile in the lens`); x.destroy(); el.remove(); continue; }
        x.seek(0.1 * x.durationMs);
        const r0 = best.t.getBoundingClientRect();
        const zoom = Math.max(best.c.width / r0.width, best.c.height / r0.height);
        if (zoom < 1.5) out.push(`${pr.name} ${tv} ${ratio}: ${zoom.toFixed(2)}× against rest`);
        x.destroy();
        el.remove();
      }
      return out.slice(0, 40);
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered (dense): on the return the stage regrows first and only then do the caption, legend and key come back —
// no text is visible while the context is still scaled (item 19 / LAW-0696 review); no lone thumbnail on a blank frame.
test.describe(`${ID} return sequence (rendered)`, () => {
  test(`${ID}: texts come back only once the context is at full size`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element, R = svg.getBoundingClientRect();
        const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
        x.seek(x.durationMs);
        const camFull = svg.querySelector('[data-node="cam"]').getBoundingClientRect().width;
        for (let u = 0.74; u <= 0.9 + 1e-9; u += 0.005) {
          x.seek(u * x.durationMs);
          const cam = svg.querySelector('[data-node="cam"]').getBoundingClientRect();
          const scaled = cam.width < camFull - 1;
          if (scaled) for (const n of ['ctx-caption', 'key', 'record', 'mlabel']) {
            const e = svg.querySelector(`[data-node="${n}"]`);
            if (e && eff(e) >= 0.15) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(3)}: ${n} visible while the context is still scaled`);
          }
          // no lone thumbnail: while the lens is gone and the context is scaled, it must still be >= 0.45 of the frame
          const lz = svg.querySelector('[data-node="lz-win"]');
          if (scaled && (!lz || eff(lz) < 0.05) && cam.width < 0.45 * R.width) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(3)}: lone context ${(cam.width / R.width).toFixed(2)}`);
        }
        x.destroy();
        el.remove();
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered: tall boxes fill the box vertically at build and hold (content reaches >= 0.71 of the frame height, with
// labels on).
ratioChecks(ID, 'tall boxes: build and hold fill the box', [
  {at: [0.1, 1], tv: ['all'], ratios: ['9:16'], dom: "(() => { const R = svg.getBoundingClientRect(); const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; }; const bs = [...svg.querySelectorAll('[data-layer=\"scene\"] path, [data-layer=\"scene\"] rect, [data-layer=\"scene\"] text')].filter(e => !e.closest('defs') && vis(e)).map(e => e.getBoundingClientRect()).filter(q => q.width > 0); return (Math.max(...bs.map(q => q.bottom)) - R.top) / R.height >= 0.71; })()", label: 'content reaches >= 0.71 of the frame height'},
]);

// Rendered (LAW-0696 re-review r2): every object the lens shows — each link seal, each alternative's barricade, each
// loss — is wholly inside the open window or wholly outside it (its bounding box as drawn, stripes included), at every
// open frame, in every preset × ratio × labels state.
test.describe(`${ID} whole objects at the lens rim (rendered)`, () => {
  test(`${ID}: seals, barricades and losses are wholly in or wholly out of the open lens`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      let barSeen = 0;
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const lzc = svg.querySelector('[data-node="lz-content"]');
        const objs = [...lzc.querySelectorAll('[data-node]')].filter(e => /^lzs-(joint\d+|bar\d+|loss\d+|sw)$/.test(e.getAttribute('data-node')));
        if (objs.some(e => /bar/.test(e.getAttribute('data-node')))) barSeen++;
        for (let u = 0.3; u <= 0.76 + 1e-9; u += 0.02) {
          x.seek(u * x.durationMs);
          if (x.getState({bounds: false}).semantic.lensOpen !== 1) continue;
          const W = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect();
          for (const e of objs) {
            const b = e.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const inside = b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1;
            const outside = b.right <= W.left + 1 || b.left >= W.right - 1 || b.bottom <= W.top + 1 || b.top >= W.bottom - 1;
            if (!inside && !outside) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: ${e.getAttribute('data-node')} cut by the rim`);
          }
        }
        x.destroy(); el.remove();
      }
      if (!barSeen) out.push('no barricade in any preset (vacuous)');
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Rendered (LAW-0696 re-review r2): the Δ marker's bounding box intersects no text box at any u while it is drawn, in
// every preset × ratio × labels state (every text element counts, whatever its opacity).
test.describe(`${ID} Δ marker clear of all text (rendered)`, () => {
  test(`${ID}: the Δ marker never overlaps a text`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const m = svg.querySelector('[data-node="marker"]');
        const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
        let shown = 0;
        for (let u = 0; u <= 1.0001; u += 0.01) {
          x.seek(u * x.durationMs);
          if (eff(m) <= 0.01) continue;
          shown++;
          const mb = m.getBoundingClientRect();
          for (const t of svg.querySelectorAll('text')) {
            const tb = t.getBoundingClientRect();
            if (tb.width <= 1 || !(t.textContent || '').trim()) continue;
            if (Math.min(tb.right, mb.right) - Math.max(tb.left, mb.left) > 1 && Math.min(tb.bottom, mb.bottom) - Math.max(tb.top, mb.top) > 1) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: marker over "${t.textContent.slice(0, 30)}"`);
          }
        }
        if (!shown) out.push(`${pr.name} ${ratio} ${tv}: the marker never shows (vacuous)`);
        x.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
